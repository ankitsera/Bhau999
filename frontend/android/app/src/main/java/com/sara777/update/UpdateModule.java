package com.a1online.update;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;

public class UpdateModule extends ReactContextBaseJavaModule {
  private static final String PREFS = "update_prefs";
  private static final String KEY_PENDING_PATH = "pending_apk_path";
  private static final String KEY_PENDING_URL = "pending_apk_url";
  private static final String APK_MIME = "application/vnd.android.package-archive";

  private BroadcastReceiver receiver;

  public UpdateModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "UpdateModule";
  }

  private SharedPreferences prefs() {
    return getReactApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
  }

  private boolean canInstallUnknownApps() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O)
      return true;
    return getReactApplicationContext().getPackageManager().canRequestPackageInstalls();
  }

  private void openUnknownAppsSettings() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O)
      return;
    Context ctx = getReactApplicationContext();
    Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
    intent.setData(Uri.parse("package:" + ctx.getPackageName()));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    ctx.startActivity(intent);
  }

  private void installApkFromFile(File apkFile) {
    Context ctx = getReactApplicationContext();

    Uri apkUri = FileProvider.getUriForFile(
        ctx,
        ctx.getPackageName() + ".fileprovider",
        apkFile);

    Intent intent = new Intent(Intent.ACTION_VIEW);
    intent.setDataAndType(apkUri, APK_MIME);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    ctx.startActivity(intent);
  }

  @ReactMethod
  public void openUnknownAppsSettingsRN() {
    openUnknownAppsSettings();
  }

  private File getApkFile(Context ctx) {
    String fileName = "app-update.apk";
    return new File(ctx.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName);
  }

  @ReactMethod
  public void startUpdate(String apkUrl, Promise promise) {
    try {
      Context ctx = getReactApplicationContext();

      // ✅ if not allowed, send user to settings (no download / no install)
      if (!canInstallUnknownApps()) {
        prefs().edit().putString(KEY_PENDING_URL, apkUrl).apply();
        openUnknownAppsSettings();
        promise.resolve("NEED_UNKNOWN_SOURCES");
        return;
      }

      // ✅ If APK already downloaded, just open installer ONCE (only when user taps
      // Update)
      File existingApk = getApkFile(ctx);
      if (existingApk.exists()) {
        prefs().edit().putString(KEY_PENDING_PATH, existingApk.getAbsolutePath()).apply();
        installApkFromFile(existingApk);
        promise.resolve("INSTALL_OPENED");
        return;
      }

      DownloadManager dm = (DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE);
      if (dm == null) {
        promise.reject("NO_DM", "DownloadManager not available");
        return;
      }

      // cache-bust so user always gets latest apk even with same URL
      String url = apkUrl + (apkUrl.contains("?") ? "&" : "?") + "t=" + System.currentTimeMillis();

      Uri uri = Uri.parse(url);
      DownloadManager.Request req = new DownloadManager.Request(uri);
      req.setAllowedOverRoaming(true);
      req.setAllowedOverMetered(true);
      req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

      // save inside app external files (no storage permission needed)
      String fileName = "app-update.apk";
      req.setDestinationInExternalFilesDir(ctx, Environment.DIRECTORY_DOWNLOADS, fileName);

      long downloadId = dm.enqueue(req);

      // prepare receiver to auto-install on complete (ONLY ONCE when download
      // finishes)
      if (receiver != null) {
        try {
          ctx.unregisterReceiver(receiver);
        } catch (Exception ignored) {
        }
        receiver = null;
      }

      receiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
          long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
          if (id != downloadId)
            return;

          // cleanup receiver
          try {
            ctx.unregisterReceiver(this);
          } catch (Exception ignored) {
          }

          DownloadManager.Query q = new DownloadManager.Query().setFilterById(downloadId);
          Cursor c = null;
          try {
            c = dm.query(q);
            if (c != null && c.moveToFirst()) {
              int status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
              if (status == DownloadManager.STATUS_SUCCESSFUL) {
                File apkFile = getApkFile(ctx);
                prefs().edit().putString(KEY_PENDING_PATH, apkFile.getAbsolutePath()).apply();
                installApkFromFile(apkFile); // ✅ opens installer once after download
              }
            }
          } finally {
            if (c != null)
              c.close();
          }
        }
      };

      ctx.registerReceiver(receiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));

      promise.resolve("DOWNLOADING");
    } catch (Exception e) {
      promise.reject("UPDATE_START_FAIL", e.getMessage(), e);
    }
  }

  @ReactMethod
  public void tryInstallPending(Promise promise) {
    try {
      // if permission still not granted, do nothing
      if (!canInstallUnknownApps()) {
        promise.resolve("STILL_BLOCKED");
        return;
      }

      String path = prefs().getString(KEY_PENDING_PATH, null);
      if (path == null || path.trim().isEmpty()) {
        promise.resolve("NO_PENDING");
        return;
      }

      File f = new File(path);
      if (!f.exists()) {
        prefs().edit().remove(KEY_PENDING_PATH).apply();
        promise.resolve("MISSING_FILE");
        return;
      }

      installApkFromFile(f);
      promise.resolve("INSTALL_OPENED");
    } catch (Exception e) {
      promise.reject("PENDING_INSTALL_FAIL", e.getMessage(), e);
    }
  }
}