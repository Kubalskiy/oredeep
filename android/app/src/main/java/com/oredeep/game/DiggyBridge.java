package com.oredeep.game;

import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

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

    @JavascriptInterface
    public void unlockAchievement(String id) {
        activity.runOnUiThread(() -> {
            if (activity.playGames != null) activity.playGames.unlockAchievement(id);
        });
    }

    @JavascriptInterface
    public void incrementEvent(String id, int amount) {
        activity.runOnUiThread(() -> {
            if (activity.playGames != null) activity.playGames.incrementEvent(id, amount);
        });
    }

    @JavascriptInterface
    public void cloudSave(String json, String callbackId) {
        activity.runOnUiThread(() -> {
            if (activity.playGames != null) activity.playGames.saveCloud(json, callbackId);
            else callback(activity.getBridge().getWebView(), callbackId, false, "unavailable");
        });
    }

    @JavascriptInterface
    public void cloudLoad(String callbackId) {
        activity.runOnUiThread(() -> {
            if (activity.playGames != null) activity.playGames.loadCloud(callbackId);
            else callbackJson(activity.getBridge().getWebView(), callbackId, false, null, "unavailable");
        });
    }

    @JavascriptInterface
    public void scheduleNotify(String title, String body, long whenMs) {
        activity.runOnUiThread(() -> DiggyNotify.schedule(activity, title, body, whenMs));
    }

    @JavascriptInterface
    public void claimPlayReward(String rewardId) {
        activity.runOnUiThread(() -> {
            WebView wv = activity.getBridge() != null ? activity.getBridge().getWebView() : null;
            if (wv == null) return;
            String js = "window.__diggyPlayReward&&window.__diggyPlayReward("
                    + JSONObject.quote(rewardId == null ? "" : rewardId) + ")";
            wv.evaluateJavascript(js, null);
        });
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

    static void callbackJson(android.webkit.WebView webView, String callbackId, boolean ok, String payload, String reason) {
        if (webView == null || callbackId == null || callbackId.isEmpty()) return;
        String js = "window.__diggyNativeCbJson&&window.__diggyNativeCbJson("
                + JSONObject.quote(callbackId) + "," + (ok ? "true" : "false") + ","
                + JSONObject.quote(payload == null ? "" : payload) + ","
                + JSONObject.quote(reason == null ? "" : reason) + ")";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    static void grant(android.webkit.WebView webView, String productId) {
        if (webView == null || productId == null || productId.isEmpty()) return;
        String js = "window.__diggyGrant&&window.__diggyGrant(" + JSONObject.quote(productId) + ")";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
