package com.oredeep.game;

import android.os.Bundle;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    DiggyAds ads;
    DiggyBilling billing;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getBridge() == null || getBridge().getWebView() == null) return;
        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new DiggyBridge(this), "DiggyNative");
        billing = new DiggyBilling(this, webView);
        ads = new DiggyAds(this, webView);
        billing.start();
        ads.startConsent();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView wv = getBridge() != null ? getBridge().getWebView() : null;
                if (wv == null) {
                    moveTaskToBack(true);
                    return;
                }
                wv.evaluateJavascript(
                    "(function(){try{return (typeof handleHardwareBack==='function'&&handleHardwareBack())?true:false;}catch(e){return false;}})()",
                    value -> {
                        boolean consumed = value != null && value.contains("true");
                        if (!consumed) moveTaskToBack(true);
                    });
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        if (ads != null) ads.onHostResume();
    }

    @Override
    public void onDestroy() {
        if (ads != null) ads.destroy();
        if (billing != null) billing.destroy();
        super.onDestroy();
    }
}
