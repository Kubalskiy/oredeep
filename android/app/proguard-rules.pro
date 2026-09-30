# Capacitor / WebView bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.getcapacitor.** { *; }
-keep class com.oredeep.game.** { *; }

# AppLovin MAX
-keep class com.applovin.** { *; }
-dontwarn com.applovin.**

# Google Mobile Ads (via MAX google-adapter)
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# UMP
-keep class com.google.android.ump.** { *; }

# Billing
-keep class com.android.billingclient.** { *; }

# AppsFlyer + Purchase Connector
-keep class com.appsflyer.** { *; }
-dontwarn com.appsflyer.**

# AppMetrica
-keep class io.appmetrica.** { *; }
-dontwarn io.appmetrica.**

-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile
