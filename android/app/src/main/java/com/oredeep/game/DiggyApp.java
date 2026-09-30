package com.oredeep.game;

import android.app.Application;
import android.util.Log;

import com.appsflyer.AppsFlyerLib;
import com.appsflyer.api.PurchaseClient;
import com.appsflyer.api.Store;
import com.appsflyer.share.AppsFlyerConversionListener;
import com.appsflyer.share.attribution.AppsFlyerRequestListener;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import io.appmetrica.analytics.AppMetrica;
import io.appmetrica.analytics.AppMetricaConfig;
import io.appmetrica.analytics.ExternalAttributions;

/**
 * Аналитика: AppsFlyer + AppMetrica.
 * Старт только после UMP consent (не в Application.onCreate).
 * Facebook / GameAnalytics / Amazon не входят в билд.
 */
public class DiggyApp extends Application {
    private static final String TAG = "Diggy";
    private static DiggyApp instance;
    private PurchaseClient purchaseClient;
    private boolean analyticsStarted;
    private final List<String[]> pendingEvents = new ArrayList<>();

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
    }

    static DiggyApp get() {
        return instance;
    }

    /** Вызывать после завершения UMP (успех или ошибка формы). */
    synchronized void startAnalyticsAfterConsent() {
        if (analyticsStarted) return;
        analyticsStarted = true;
        initAppsFlyer();
        initAppMetrica();
        initPurchaseConnector();
        for (String[] item : pendingEvents) {
            dispatchEvent(item[0], item[1]);
        }
        pendingEvents.clear();
    }

    void logGameEvent(String name, String json) {
        if (name == null || name.isEmpty()) return;
        synchronized (this) {
            if (!analyticsStarted) {
                if (pendingEvents.size() < 64)
                    pendingEvents.add(new String[]{ name, json == null ? "" : json });
                return;
            }
        }
        dispatchEvent(name, json);
    }

    private void dispatchEvent(String name, String json) {
        try {
            if (json == null || json.isEmpty()) AppMetrica.reportEvent(name);
            else AppMetrica.reportEvent(name, json);
        } catch (Throwable t) {
            Log.w(TAG, "AppMetrica event failed", t);
        }
        if (name.startsWith("af_")) logAppsFlyer(name, json);
    }

    private void logAppsFlyer(String name, String json) {
        try {
            Map<String, Object> values = new HashMap<>();
            if (json != null && !json.isEmpty()) {
                JSONObject object = new JSONObject(json);
                Iterator<String> keys = object.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    Object value = object.get(key);
                    if (value instanceof Double && ((Double) value) == Math.rint((Double) value))
                        value = ((Double) value).intValue();
                    values.put(key, value);
                }
            }
            AppsFlyerLib.getInstance().logEvent(this, name, values);
        } catch (Throwable t) {
            Log.w(TAG, "AppsFlyer event failed", t);
        }
    }

    void logPurchase(String productId, int cents, String receipt, String signature) {
        if (productId == null || !analyticsStarted) return;
        try {
            java.util.Currency currency = java.util.Currency.getInstance("USD");
            io.appmetrica.analytics.Revenue revenue = io.appmetrica.analytics.Revenue
                    .newBuilder(cents * 10_000L, currency)
                    .withProductID(productId)
                    .withQuantity(1)
                    .build();
            AppMetrica.reportRevenue(revenue);
        } catch (Throwable t) {
            Log.w(TAG, "AppMetrica revenue failed", t);
        }
    }

    private void initAppMetrica() {
        try {
            AppMetricaConfig config = AppMetricaConfig
                    .newConfigBuilder(getString(R.string.appmetrica_api_key))
                    .build();
            AppMetrica.activate(this, config);
            AppMetrica.enableActivityAutoTracking(this);
        } catch (Throwable t) {
            Log.e(TAG, "AppMetrica init failed", t);
        }
    }

    private void initAppsFlyer() {
        try {
            AppsFlyerConversionListener listener = new AppsFlyerConversionListener() {
                @Override
                public void onConversionDataSuccess(Map<String, Object> data) {
                    try {
                        AppMetrica.reportExternalAttribution(ExternalAttributions.appsflyer(data));
                    } catch (Throwable t) {
                        Log.w(TAG, "AppsFlyer attribution forward failed", t);
                    }
                }

                @Override
                public void onConversionDataFail(String error) {
                    Log.w(TAG, "AppsFlyer conversion fail");
                }
            };
            AppsFlyerLib.getInstance().init(getString(R.string.appsflyer_dev_key), listener, this);
            AppsFlyerLib.getInstance().start(new AppsFlyerRequestListener() {
                @Override public void onSuccess() { }
                @Override public void onError(int code, String message) {
                    Log.w(TAG, "AppsFlyer start failed: " + code);
                }
            });
        } catch (Throwable t) {
            Log.e(TAG, "AppsFlyer init failed", t);
        }
    }

    private void initPurchaseConnector() {
        try {
            boolean sandbox = getResources().getBoolean(R.bool.appsflyer_purchase_sandbox);
            purchaseClient = new PurchaseClient.Builder(this, Store.GOOGLE)
                    .autoLogInApps(true)
                    .setSandbox(sandbox)
                    .build();
            purchaseClient.startObservingTransactions();
        } catch (Throwable t) {
            Log.e(TAG, "Purchase connector init failed", t);
        }
    }
}
