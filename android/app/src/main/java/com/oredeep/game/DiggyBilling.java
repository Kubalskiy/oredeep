package com.oredeep.game;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.webkit.WebView;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Play Billing. Выдача в игре происходит только после подтверждения покупки.
 * Purchase Connector в DiggyApp сам отправляет выручку в AppsFlyer.
 */
public class DiggyBilling implements PurchasesUpdatedListener {
    private static final String TAG = "Diggy";
    private static final String[] PRODUCTS = {
            "starter_pack_499", "noads_4999",
            "gems_1999", "gems_5999", "gems_19999",
            "pack_699", "pack_1699", "pack_2499"
    };
    private static final Pattern CENTS = Pattern.compile("_(\\d+)$");

    private final Activity activity;
    private final WebView webView;
    private BillingClient billingClient;
    private final Map<String, ProductDetails> details = new HashMap<>();
    private final Map<String, String> pending = new HashMap<>();
    private final Set<String> inFlight = new HashSet<>();
    private boolean ready;
    private String queuedProduct;
    private String queuedCallback;

    DiggyBilling(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    void start() {
        billingClient = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .build();
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) return;
                ready = true;
                queryProducts();
                queryOwned();
                if (queuedProduct != null) {
                    String id = queuedProduct;
                    String cb = queuedCallback;
                    queuedProduct = null;
                    queuedCallback = null;
                    purchase(id, cb);
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                ready = false;
            }
        });
    }

    void purchase(String productId, String callbackId) {
        if (!ready || billingClient == null) {
            queuedProduct = productId;
            queuedCallback = callbackId;
            return;
        }
        ProductDetails product = details.get(productId);
        if (product == null) {
            DiggyBridge.callback(webView, callbackId, false);
            return;
        }
        pending.put(productId, callbackId);
        BillingFlowParams.ProductDetailsParams params = BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(product)
                .build();
        BillingFlowParams flow = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(params))
                .build();
        BillingResult launched = billingClient.launchBillingFlow(activity, flow);
        if (launched.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            queryOwned();
            return;
        }
        if (launched.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            pending.remove(productId);
            DiggyBridge.callback(webView, callbackId, false);
        }
    }

    void destroy() {
        if (billingClient != null) billingClient.endConnection();
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) finish(purchase);
            return;
        }
        if (code == BillingClient.BillingResponseCode.USER_CANCELED
                || code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) queryOwned();
        }
        for (String cb : new ArrayList<>(pending.values())) DiggyBridge.callback(webView, cb, false);
        pending.clear();
    }

    private void queryProducts() {
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (String id : PRODUCTS) {
            products.add(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(id)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build());
        }
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(products)
                .build();
        billingClient.queryProductDetailsAsync(params, (BillingResult billingResult, QueryProductDetailsResult result) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || result == null) return;
            for (ProductDetails item : result.getProductDetailsList()) details.put(item.getProductId(), item);
        });
    }

    private void queryOwned() {
        if (billingClient == null) return;
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();
        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) return;
            for (Purchase purchase : purchases) finish(purchase);
        });
    }

    private void finish(Purchase purchase) {
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return;
        if (purchase.getProducts() == null || purchase.getProducts().isEmpty()) return;
        String productId = purchase.getProducts().get(0);
        String token = purchase.getPurchaseToken();
        if (token == null || !inFlight.add(token)) return;
        if (isConsumable(productId)) {
            ConsumeParams params = ConsumeParams.newBuilder().setPurchaseToken(token).build();
            billingClient.consumeAsync(params, (billingResult, purchaseToken) -> {
                inFlight.remove(token);
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) deliver(purchase, productId, token);
            });
            return;
        }
        if (purchase.isAcknowledged()) {
            inFlight.remove(token);
            deliver(purchase, productId, token);
            return;
        }
        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(token)
                .build();
        billingClient.acknowledgePurchase(params, billingResult -> {
            inFlight.remove(token);
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) deliver(purchase, productId, token);
        });
    }

    private void deliver(Purchase purchase, String productId, String token) {
        SharedPreferences prefs = activity.getSharedPreferences("diggy_iap", Context.MODE_PRIVATE);
        String callback = pending.remove(productId);
        if (token != null && prefs.getBoolean(token, false)) {
            if (callback != null) DiggyBridge.callback(webView, callback, true);
            return;
        }
        if (token != null) prefs.edit().putBoolean(token, true).apply();
        DiggyApp app = DiggyApp.get();
        if (app != null) {
            app.logPurchase(productId, centsOf(productId), purchase.getOriginalJson(), purchase.getSignature());
        }
        if (callback != null) DiggyBridge.callback(webView, callback, true);
        else DiggyBridge.grant(webView, productId);
    }

    private static boolean isConsumable(String productId) {
        return productId.startsWith("gems_") || productId.startsWith("pack_");
    }

    private static int centsOf(String productId) {
        Matcher matcher = CENTS.matcher(productId == null ? "" : productId);
        if (!matcher.find()) return 0;
        try { return Integer.parseInt(matcher.group(1)); }
        catch (NumberFormatException e) { return 0; }
    }
}
