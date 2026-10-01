package com.oredeep.game;

import android.app.Activity;
import android.util.Log;
import android.webkit.WebView;

import com.google.android.gms.games.AuthenticationResult;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.games.SnapshotsClient;
import com.google.android.gms.games.snapshot.Snapshot;
import com.google.android.gms.games.snapshot.SnapshotMetadataChange;
import com.google.android.gms.tasks.Task;

import java.nio.charset.StandardCharsets;

/**
 * Play Games Services v2: sign-in, achievements, events (Game Stats), cloud snapshots, reward redeem notify.
 * Console must map achievement/event/reward IDs to the same strings used by JS (PLAY_* catalogs).
 */
public class DiggyPlayGames {
    private static final String TAG = "DiggyPGS";
    private static final String SNAPSHOT_NAME = "mountain_king_save";
    private final Activity activity;
    private final WebView webView;
    private boolean signedIn;

    DiggyPlayGames(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    void start() {
        try {
            PlayGamesSdk.initialize(activity);
            PlayGames.getGamesSignInClient(activity).isAuthenticated()
                    .addOnCompleteListener(task -> {
                        boolean ok = task.isSuccessful()
                                && task.getResult() != null
                                && task.getResult().isAuthenticated();
                        if (ok) {
                            signedIn = true;
                            notifyJs("pgs_auth", true, null);
                        } else {
                            PlayGames.getGamesSignInClient(activity).signIn()
                                    .addOnCompleteListener(this::onSignIn);
                        }
                    });
        } catch (Throwable t) {
            Log.w(TAG, "PGS init failed", t);
            notifyJs("pgs_auth", false, "unavailable");
        }
    }

    private void onSignIn(Task<AuthenticationResult> task) {
        signedIn = task.isSuccessful()
                && task.getResult() != null
                && task.getResult().isAuthenticated();
        notifyJs("pgs_auth", signedIn, signedIn ? null : "sign_in_failed");
    }

    void unlockAchievement(String id) {
        if (!signedIn || id == null || id.isEmpty()) return;
        activity.runOnUiThread(() -> {
            try {
                PlayGames.getAchievementsClient(activity).unlock(id);
            } catch (Throwable t) {
                Log.w(TAG, "unlock " + id, t);
            }
        });
    }

    void incrementEvent(String id, int amount) {
        if (!signedIn || id == null || id.isEmpty() || amount <= 0) return;
        activity.runOnUiThread(() -> {
            try {
                PlayGames.getEventsClient(activity).increment(id, amount);
            } catch (Throwable t) {
                Log.w(TAG, "event " + id, t);
            }
        });
    }

    void saveCloud(String json, String callbackId) {
        if (!signedIn) {
            DiggyBridge.callback(webView, callbackId, false, "not_signed_in");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                SnapshotsClient snaps = PlayGames.getSnapshotsClient(activity);
                snaps.open(SNAPSHOT_NAME, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED)
                        .addOnSuccessListener(outcome -> {
                            try {
                                Snapshot snap = outcome.getData();
                                if (snap == null) {
                                    DiggyBridge.callback(webView, callbackId, false, "no_snapshot");
                                    return;
                                }
                                byte[] data = json.getBytes(StandardCharsets.UTF_8);
                                snap.getSnapshotContents().writeBytes(data);
                                SnapshotMetadataChange change = new SnapshotMetadataChange.Builder()
                                        .setDescription("Mountain King progress")
                                        .build();
                                snaps.commitAndClose(snap, change)
                                        .addOnSuccessListener(m -> DiggyBridge.callback(webView, callbackId, true, null))
                                        .addOnFailureListener(e -> DiggyBridge.callback(webView, callbackId, false, "commit_fail"));
                            } catch (Throwable t) {
                                DiggyBridge.callback(webView, callbackId, false, "write_fail");
                            }
                        })
                        .addOnFailureListener(e -> DiggyBridge.callback(webView, callbackId, false, "open_fail"));
            } catch (Throwable t) {
                DiggyBridge.callback(webView, callbackId, false, "unavailable");
            }
        });
    }

    void loadCloud(String callbackId) {
        if (!signedIn) {
            DiggyBridge.callbackJson(webView, callbackId, false, null, "not_signed_in");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                SnapshotsClient snaps = PlayGames.getSnapshotsClient(activity);
                snaps.open(SNAPSHOT_NAME, false, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED)
                        .addOnSuccessListener(outcome -> {
                            try {
                                Snapshot snap = outcome.getData();
                                if (snap == null) {
                                    DiggyBridge.callbackJson(webView, callbackId, false, null, "empty");
                                    return;
                                }
                                byte[] data = snap.getSnapshotContents().readFully();
                                snaps.discardAndClose(snap);
                                String json = data == null ? "" : new String(data, StandardCharsets.UTF_8);
                                DiggyBridge.callbackJson(webView, callbackId, true, json, null);
                            } catch (Throwable t) {
                                DiggyBridge.callbackJson(webView, callbackId, false, null, "read_fail");
                            }
                        })
                        .addOnFailureListener(e -> DiggyBridge.callbackJson(webView, callbackId, false, null, "open_fail"));
            } catch (Throwable t) {
                DiggyBridge.callbackJson(webView, callbackId, false, null, "unavailable");
            }
        });
    }

    void scheduleNotify(String title, String body, long whenMs) {
        activity.runOnUiThread(() -> DiggyNotify.schedule(activity, title, body, whenMs));
    }

    private void notifyJs(String event, boolean ok, String reason) {
        if (webView == null) return;
        String js = "window.__diggyPgs&&window.__diggyPgs("
                + JSONObjectQuote(event) + "," + (ok ? "true" : "false") + ","
                + JSONObjectQuote(reason == null ? "" : reason) + ")";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private static String JSONObjectQuote(String s) {
        try {
            return org.json.JSONObject.quote(s == null ? "" : s);
        } catch (Throwable t) {
            return "\"\"";
        }
    }
}
