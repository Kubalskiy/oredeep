package com.oredeep.game;

import android.app.Activity;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;

import androidx.coordinatorlayout.widget.CoordinatorLayout;

import com.applovin.mediation.MaxAd;
import com.applovin.mediation.MaxAdFormat;
import com.applovin.mediation.MaxAdViewAdListener;
import com.applovin.mediation.MaxError;
import com.applovin.mediation.MaxReward;
import com.applovin.mediation.MaxRewardedAdListener;
import com.applovin.mediation.ads.MaxAdView;
import com.applovin.mediation.ads.MaxRewardedAd;
import com.applovin.sdk.AppLovinMediationProvider;
import com.applovin.sdk.AppLovinPrivacySettings;
import com.applovin.sdk.AppLovinSdk;
import com.applovin.sdk.AppLovinSdkInitializationConfiguration;
import com.applovin.sdk.AppLovinSdkUtils;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

/**
 * UMP → analytics + AppLovin MAX (rewarded + banner).
 * Interstitial / Amazon / FB / GA в билде нет.
 */
public class DiggyAds {
    private static final String TAG = "Diggy";

    private final Activity activity;
    private final WebView webView;
    private ConsentInformation consentInformation;
    private boolean consentInFlight;
    private boolean consentSettled;
    private boolean adsStarted;
    private boolean noAds;
    private FrameLayout bannerSlot;
    private MaxAdView banner;
    private MaxRewardedAd rewarded;
    private boolean rewardEarned;
    private String rewardCallback;

    DiggyAds(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    void startConsent() {
        if (adsStarted || consentInFlight || consentSettled) return;
        consentInFlight = true;
        consentInformation = UserMessagingPlatform.getConsentInformation(activity);
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
        consentInformation.requestConsentInfoUpdate(activity, params, () ->
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity, formError -> {
                    consentInFlight = false;
                    onConsentSettled();
                }),
                requestError -> {
                    consentInFlight = false;
                    onConsentSettled();
                });
    }

    private void onConsentSettled() {
        consentSettled = true;
        DiggyApp app = DiggyApp.get();
        if (app != null) app.startAnalyticsAfterConsent();
        maybeInitAds();
    }

    void onHostResume() {
        if (!adsStarted) startConsent();
    }

    void setNoAds(boolean on) {
        noAds = on;
        if (on) hideBanner();
    }

    void showPrivacyOptions() {
        if (consentInformation == null)
            consentInformation = UserMessagingPlatform.getConsentInformation(activity);
        UserMessagingPlatform.showPrivacyOptionsForm(activity, formError -> {
            if (formError != null)
                Log.w(TAG, "privacy options " + formError.getErrorCode() + " " + formError.getMessage());
            pushConsentToMax();
        });
    }

    void showRewarded(String slot, String callbackId) {
        if (noAds || rewarded == null || !rewarded.isReady()) {
            DiggyBridge.callback(webView, callbackId, false, "not_ready");
            if (!noAds) loadRewarded();
            return;
        }
        rewardEarned = false;
        rewardCallback = callbackId;
        rewarded.showAd(activity);
    }

    void destroy() {
        if (rewarded != null) rewarded.destroy();
        if (banner != null) banner.destroy();
    }

    private void maybeInitAds() {
        if (adsStarted || consentInformation == null || !consentInformation.canRequestAds()) return;
        adsStarted = true;
        pushConsentToMax();
        AppLovinSdkInitializationConfiguration init = AppLovinSdkInitializationConfiguration
                .builder(activity.getString(R.string.applovin_sdk_key))
                .setMediationProvider(AppLovinMediationProvider.MAX)
                .build();
        AppLovinSdk.getInstance(activity).initialize(init, config -> {
            if (!noAds) loadBanner();
            loadRewarded();
        });
    }

    private void pushConsentToMax() {
        if (consentInformation == null) return;
        boolean consent = consentInformation.getConsentStatus() == ConsentInformation.ConsentStatus.OBTAINED
                || consentInformation.getConsentStatus() == ConsentInformation.ConsentStatus.NOT_REQUIRED;
        String us = PreferenceManager.getDefaultSharedPreferences(activity)
                .getString("IABUSPrivacy_String", "");
        boolean doNotSell = us.length() >= 3 && us.charAt(2) == 'Y';
        AppLovinPrivacySettings.setHasUserConsent(consent);
        AppLovinPrivacySettings.setDoNotSell(doNotSell);
    }

    private void logAd(String name, String json) {
        DiggyApp app = DiggyApp.get();
        if (app != null) app.logGameEvent(name, json);
    }

    private void loadRewarded() {
        if (rewarded == null) {
            rewarded = MaxRewardedAd.getInstance(activity.getString(R.string.applovin_rewarded), activity);
            rewarded.setListener(new MaxRewardedAdListener() {
                @Override public void onUserRewarded(MaxAd ad, MaxReward reward) { rewardEarned = true; }
                @Override public void onAdLoaded(MaxAd ad) { }
                @Override public void onAdDisplayed(MaxAd ad) { }
                @Override public void onAdHidden(MaxAd ad) {
                    DiggyBridge.callback(webView, rewardCallback, rewardEarned);
                    rewardCallback = null;
                    rewardEarned = false;
                    loadRewarded();
                }
                @Override public void onAdClicked(MaxAd ad) { }
                @Override public void onAdLoadFailed(String adUnitId, MaxError error) { }
                @Override public void onAdDisplayFailed(MaxAd ad, MaxError error) {
                    DiggyBridge.callback(webView, rewardCallback, false);
                    rewardCallback = null;
                    loadRewarded();
                }
            });
        }
        rewarded.loadAd();
    }

    private void loadBanner() {
        if (noAds) return;
        ensureBannerSlot();
        if (banner == null) {
            banner = new MaxAdView(activity.getString(R.string.applovin_banner), MaxAdFormat.BANNER, activity);
            banner.setListener(new MaxAdViewAdListener() {
                @Override public void onAdLoaded(MaxAd ad) {
                    if (noAds) { hideBanner(); return; }
                    bannerSlot.setVisibility(View.VISIBLE);
                    int px = AppLovinSdkUtils.dpToPx(activity, Math.max(50, ad.getSize().getHeight()));
                    setWebMargin(px);
                    logAd("ad_banner_visible", "{\"med\":\"applovin\",\"visible\":\"on\",\"placement\":\"hud\"}");
                }
                @Override public void onAdDisplayed(MaxAd ad) { }
                @Override public void onAdHidden(MaxAd ad) { }
                @Override public void onAdClicked(MaxAd ad) {
                    logAd("ad_banner_click", "{\"med\":\"applovin\",\"placement\":\"hud\"}");
                }
                @Override public void onAdLoadFailed(String adUnitId, MaxError error) { hideBanner(); }
                @Override public void onAdDisplayFailed(MaxAd ad, MaxError error) { }
                @Override public void onAdExpanded(MaxAd ad) { }
                @Override public void onAdCollapsed(MaxAd ad) { }
            });
            int height = AppLovinSdkUtils.dpToPx(activity, MaxAdFormat.BANNER.getAdaptiveSize(activity).getHeight());
            bannerSlot.addView(banner, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, Math.max(height, 1)));
        }
        banner.loadAd();
    }

    private void ensureBannerSlot() {
        if (bannerSlot != null) return;
        if (!(webView.getParent() instanceof CoordinatorLayout)) return;
        CoordinatorLayout parent = (CoordinatorLayout) webView.getParent();
        bannerSlot = new FrameLayout(activity);
        bannerSlot.setVisibility(View.GONE);
        CoordinatorLayout.LayoutParams lp = new CoordinatorLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.gravity = Gravity.BOTTOM;
        parent.addView(bannerSlot, lp);
    }

    private void hideBanner() {
        if (bannerSlot != null && bannerSlot.getVisibility() == View.VISIBLE)
            logAd("ad_banner_visible", "{\"med\":\"applovin\",\"visible\":\"off\",\"placement\":\"hud\"}");
        if (bannerSlot != null) bannerSlot.setVisibility(View.GONE);
        if (banner != null) banner.setVisibility(View.GONE);
        setWebMargin(0);
    }

    private void setWebMargin(int px) {
        ViewGroup.LayoutParams lp = webView.getLayoutParams();
        if (lp instanceof ViewGroup.MarginLayoutParams) {
            ((ViewGroup.MarginLayoutParams) lp).bottomMargin = px;
            webView.setLayoutParams(lp);
        }
    }
}
