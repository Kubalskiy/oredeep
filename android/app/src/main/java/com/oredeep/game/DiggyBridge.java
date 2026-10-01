package com.oredeep.game;

import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;

import org.json.JSONObject;

/**
 * Мост JS → нативные SDK. В браузере и тестах объекта DiggyNative нет,
 * и игра остаётся на заглушках Platform.
 */
public class DiggyBridge {
    private final MainActivity activity;

    DiggyBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void logEvent(String name, String json) {
        DiggyApp app = DiggyApp.get();
        if (app != null) app.logGameEvent(name, json);
    }

    @JavascriptInterface
    public void showRewarded(String slot, String callbackId) {
        activity.runOnUiThread(() -> {
            if (activity.ads != null) activity.ads.showRewarded(slot, callbackId);
            else callback(activity.getBridge().getWebView(), callbackId, false);
        });
    }

    @JavascriptInterface
    public void showInterstitial(String callbackId) {
        /* Interstitial not in build — only rewarded + banner. */
        activity.runOnUiThread(() ->
                callback(activity.getBridge().getWebView(), callbackId, false));
    }

    @JavascriptInterface
    public void purchase(String productId, String callbackId) {
        activity.runOnUiThread(() -> {
            if (activity.billing != null) activity.billing.purchase(productId, callbackId);
            else callback(activity.getBridge().getWebView(), callbackId, false);
        });
    }

    @JavascriptInterface
    public void showPrivacyOptions() {
        activity.runOnUiThread(() -> {
            if (activity.ads != null) activity.ads.showPrivacyOptions();
        });
    }

    @JavascriptInterface
    public void openPrivacy() {
        activity.runOnUiThread(() -> {
            String url = activity.getString(R.string.privacy_policy_url);
            activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        });
    }

    @JavascriptInterface
    public void setNoAds(boolean on) {
        activity.runOnUiThread(() -> { if (activity.ads != null) activity.ads.setNoAds(on); });
    }

    static void callback(android.webkit.WebView webView, String callbackId, boolean ok) {
        callback(webView, callbackId, ok, null);
    }

    static void callback(android.webkit.WebView webView, String callbackId, boolean ok, String reason) {
        if (webView == null || callbackId == null || callbackId.isEmpty()) return;
        String js = "window.__diggyNativeCb&&window.__diggyNativeCb("
                + JSONObject.quote(callbackId) + "," + (ok ? "true" : "false")
                + "," + JSONObject.quote(reason == null ? "" : reason) + ")";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    static void grant(android.webkit.WebView webView, String productId) {
        if (webView == null || productId == null || productId.isEmpty()) return;
        String js = "window.__diggyGrant&&window.__diggyGrant(" + JSONObject.quote(productId) + ")";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
