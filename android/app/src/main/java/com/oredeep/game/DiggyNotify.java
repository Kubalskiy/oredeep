package com.oredeep.game;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

/**
 * Local notifications for bag upgrade / bonus chest ready.
 */
public class DiggyNotify {
    private static final String TAG = "DiggyNotify";
    private static final String CH = "mk_game";
    public static final String ACTION = "com.oredeep.game.NOTIFY";

    static void schedule(Context ctx, String title, String body, long whenMs) {
        try {
            ensureChannel(ctx);
            long at = Math.max(System.currentTimeMillis() + 5_000L, whenMs);
            Intent i = new Intent(ctx, DiggyNotify.Receiver.class);
            i.setAction(ACTION);
            i.putExtra("title", title == null ? "Mountain King" : title);
            i.putExtra("body", body == null ? "" : body);
            int req = (int) (at % Integer.MAX_VALUE);
            PendingIntent pi = PendingIntent.getBroadcast(
                    ctx, req, i,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            if (Build.VERSION.SDK_INT >= 23) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (Throwable t) {
            Log.w(TAG, "schedule failed", t);
        }
    }

    private static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel(CH, "Mountain King", NotificationManager.IMPORTANCE_DEFAULT);
        nm.createNotificationChannel(ch);
    }

    public static class Receiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            try {
                ensureChannel(context);
                String title = intent.getStringExtra("title");
                String body = intent.getStringExtra("body");
                Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
                PendingIntent content = PendingIntent.getActivity(
                        context, 0, launch,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                NotificationCompat.Builder b = new NotificationCompat.Builder(context, CH)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle(title == null ? "Mountain King" : title)
                        .setContentText(body == null ? "" : body)
                        .setAutoCancel(true)
                        .setContentIntent(content);
                NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), b.build());
            } catch (Throwable t) {
                Log.w(TAG, "notify fail", t);
            }
        }
    }
}
