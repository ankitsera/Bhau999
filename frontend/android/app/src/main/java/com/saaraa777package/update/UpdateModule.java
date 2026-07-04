package com.saaraa777package.update;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;

import androidx.annotation.NonNull;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.FileInputStream;

public class UpdateModule extends ReactContextBaseJavaModule {
  private static final String PREFS = "update_prefs";
  private static final String KEY_PENDING_PATH = "pending_apk_path";
  private static final String KEY_PENDING_URL = "pending_apk_url";

  // store last download id so we can query progress / prevent duplicates
  private static final String KEY_DOWNLOAD_ID = "download_id";
  private static final String KEY_DOWNLOADED_VERSION = "downloaded_apk_version";
  private static final String KEY_AVAILABLE_VERSION = "available_update_version";

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

  private void clearDownloadId() {
    try { prefs().edit().remove(KEY_DOWNLOAD_ID).apply(); } catch (Exception ignored) {}
  }

  private boolean canInstallUnknownApps() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O)
      return true;
    return getReactApplicationContext().getPackageManager().canRequestPackageInstalls();
  }

  private long getInstalledVersionCode(Context ctx) {
    try {
      PackageInfo pi = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) return pi.getLongVersionCode();
      return pi.versionCode;
    } catch (Exception e) {
      return -1L;
    }
  }

  private long getApkVersionCode(Context ctx, File apkFile) {
    try {
      if (apkFile == null || !apkFile.exists()) return -1L;

      PackageManager pm = ctx.getPackageManager();
      PackageInfo info = pm.getPackageArchiveInfo(apkFile.getAbsolutePath(), 0);
      if (info == null) return -1L;

      // Some devices need these set to read version properly
      if (info.applicationInfo != null) {
        info.applicationInfo.sourceDir = apkFile.getAbsolutePath();
        info.applicationInfo.publicSourceDir = apkFile.getAbsolutePath();
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) return info.getLongVersionCode();
      return info.versionCode;
    } catch (Exception e) {
      return -1L;
    }
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
        apkFile
    );

    Intent intent = new Intent(Intent.ACTION_VIEW);
    intent.setDataAndType(apkUri, APK_MIME);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    ctx.startActivity(intent);
  }

  @ReactMethod
  public void setAvailableVersion(String version) {
    if (version == null || version.trim().isEmpty()) {
      prefs().edit().remove(KEY_AVAILABLE_VERSION).apply();
    } else {
      prefs().edit().putString(KEY_AVAILABLE_VERSION, version.trim()).apply();
    }
  }

  @ReactMethod
  public void clearUpdateState() {
    prefs().edit()
      .remove(KEY_PENDING_PATH)
      .remove(KEY_PENDING_URL)
      .remove(KEY_DOWNLOADED_VERSION)
      .remove(KEY_AVAILABLE_VERSION)
      .remove(KEY_DOWNLOAD_ID)
      .apply();
    File apk = getApkFile(getReactApplicationContext());
    deleteQuietly(apk);
  }


  public void openUnknownAppsSettingsRN() {
    openUnknownAppsSettings();
  }

  private File getApkFile(Context ctx) {
    String fileName = "app-update.apk";
    return new File(ctx.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName);
  }

  // APK is a ZIP => starts with "PK"
  private boolean isLikelyValidApk(File f) {
    FileInputStream in = null;
    try {
      if (f == null || !f.exists()) return false;

      // Too small usually means HTML/redirect/partial download
      if (f.length() < 150 * 1024) return false;

      in = new FileInputStream(f);
      byte[] sig = new byte[2];
      int r = in.read(sig);
      if (r < 2) return false;

      return sig[0] == 'P' && sig[1] == 'K';
    } catch (Exception e) {
      return false;
    } finally {
      try { if (in != null) in.close(); } catch (Exception ignored) {}
    }
  }

  private void deleteQuietly(File f) {
    try { if (f != null && f.exists()) f.delete(); } catch (Exception ignored) {}
  }

  private int queryDownloadStatus(DownloadManager dm, long downloadId) {
    Cursor c = null;
    try {
      DownloadManager.Query q = new DownloadManager.Query().setFilterById(downloadId);
      c = dm.query(q);
      if (c == null || !c.moveToFirst()) return -1; // not found
      return c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
    } catch (Exception e) {
      return -2; // error
    } finally {
      if (c != null) c.close();
    }
  }

  // Query progress from DownloadManager for last stored download id
  @ReactMethod
  public void getDownloadProgress(Promise promise) {
    try {
      Context ctx = getReactApplicationContext();
      DownloadManager dm = (DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE);
      if (dm == null) {
        promise.reject("NO_DM", "DownloadManager not available");
        return;
      }

      long downloadId = prefs().getLong(KEY_DOWNLOAD_ID, -1L);
      if (downloadId <= 0) {
        WritableMap map = Arguments.createMap();
        map.putString("status", "NOT_FOUND");
        map.putInt("percent", 0);
        promise.resolve(map);
        return;
      }

      DownloadManager.Query q = new DownloadManager.Query().setFilterById(downloadId);
      Cursor c = null;

      try {
        c = dm.query(q);
        if (c == null || !c.moveToFirst()) {
          // stale id
          clearDownloadId();
          WritableMap map = Arguments.createMap();
          map.putString("status", "NOT_FOUND");
          map.putInt("percent", 0);
          promise.resolve(map);
          return;
        }

        int status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
        long soFar = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
        long total = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));

        int percent = 0;
        if (total > 0) percent = (int) Math.min(100, Math.max(0, (soFar * 100L) / total));

        WritableMap map = Arguments.createMap();

        if (status == DownloadManager.STATUS_RUNNING ||
            status == DownloadManager.STATUS_PENDING ||
            status == DownloadManager.STATUS_PAUSED) {
          map.putString("status", "DOWNLOADING");
          map.putInt("percent", percent);
          promise.resolve(map);
          return;
        }

        if (status == DownloadManager.STATUS_SUCCESSFUL) {
          // mark complete
          clearDownloadId();
          map.putString("status", "SUCCESS");
          map.putInt("percent", 100);
          promise.resolve(map);
          return;
        }

        if (status == DownloadManager.STATUS_FAILED) {
          clearDownloadId();
          map.putString("status", "FAILED");
          map.putInt("percent", percent);
          promise.resolve(map);
          return;
        }

        map.putString("status", "UNKNOWN");
        map.putInt("percent", percent);
        promise.resolve(map);
      } finally {
        if (c != null) c.close();
      }
    } catch (Exception e) {
      promise.reject("PROGRESS_FAIL", e.getMessage(), e);
    }
  }

  @ReactMethod
  public void startUpdate(String apkUrl, String updateVersion, Promise promise) {
    try {
      Context ctx = getReactApplicationContext();

      // if not allowed, send user to settings (no download / no install)
      if (!canInstallUnknownApps()) {
        prefs().edit().putString(KEY_PENDING_URL, apkUrl).apply();
        openUnknownAppsSettings();
        promise.resolve("NEED_UNKNOWN_SOURCES");
        return;
      }

      DownloadManager dm = (DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE);
      if (dm == null) {
        promise.reject("NO_DM", "DownloadManager not available");
        return;
      }

      // ✅ Guard: if we already have a running download, don't enqueue again
      long prevId = prefs().getLong(KEY_DOWNLOAD_ID, -1L);
      if (prevId > 0) {
        int st = queryDownloadStatus(dm, prevId);

        if (st == DownloadManager.STATUS_RUNNING ||
            st == DownloadManager.STATUS_PENDING ||
            st == DownloadManager.STATUS_PAUSED) {
          promise.resolve("ALREADY_DOWNLOADING");
          return;
        }

        if (st == DownloadManager.STATUS_SUCCESSFUL) {
          // clear id and attempt install from file (if valid)
          clearDownloadId();
          File f = getApkFile(ctx);
          if (f.exists() && isLikelyValidApk(f)) {
            prefs().edit().putString(KEY_PENDING_PATH, f.getAbsolutePath()).apply();
            installApkFromFile(f);
            promise.resolve("INSTALL_OPENED");
            return;
          } else {
            deleteQuietly(f);
            prefs().edit().remove(KEY_PENDING_PATH).apply();
          }
        }

        if (st == DownloadManager.STATUS_FAILED || st == -1) {
          // stale/failed -> clear id and continue to download fresh
          clearDownloadId();
        }
      }

      // If APK already downloaded AND valid, open installer.
      // If invalid, delete it and re-download.
      File existingApk = getApkFile(ctx);

      // Check version match for existing APK
      String downloadedVer = prefs().getString(KEY_DOWNLOADED_VERSION, null);
      
      String availableVer = updateVersion != null && !updateVersion.trim().isEmpty() ? updateVersion.trim() : null;

      //Delete stale apk if version mismatch(oly if we have version info to compare)
      if(existingApk.exists() && availableVer != null) {
        boolean versionMatch = (downloadedVer != null && downloadedVer.equals(availableVer));
        if (!versionMatch) {
          deleteQuietly(existingApk);
          prefs().edit().remove(KEY_PENDING_PATH).remove(KEY_DOWNLOADED_VERSION).apply();
        }
      }
      if (existingApk.exists() && isLikelyValidApk(existingApk)) {
        long installedVc = getInstalledVersionCode(ctx);
        long apkVc = getApkVersionCode(ctx, existingApk);

        // If apk is newer, install it. Otherwise it's stale -> delete and re-download.
        if (apkVc > installedVc) {
          prefs().edit().putString(KEY_PENDING_PATH, existingApk.getAbsolutePath()).apply();
          installApkFromFile(existingApk);
          promise.resolve("INSTALL_OPENED");
          return;
        } else {
          deleteQuietly(existingApk);
          prefs().edit().remove(KEY_PENDING_PATH).apply();
          clearDownloadId();
        }
      } else if (existingApk.exists()) {
        // exists but not valid -> delete
        deleteQuietly(existingApk);
        prefs().edit().remove(KEY_PENDING_PATH).apply();
        clearDownloadId();
      }

      // cache-bust so user always gets latest apk even with same URL
      String url = apkUrl + (apkUrl.contains("?") ? "&" : "?") + "t=" + System.currentTimeMillis();

      Uri uri = Uri.parse(url);
      DownloadManager.Request req = new DownloadManager.Request(uri);
      req.setAllowedOverRoaming(true);
      req.setAllowedOverMetered(true);
      req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

      // ensure destination is clean before writing
      deleteQuietly(existingApk);

      // save inside app external files (no storage permission needed)
      String fileName = "app-update.apk";
      req.setDestinationInExternalFilesDir(ctx, Environment.DIRECTORY_DOWNLOADS, fileName);

      long downloadId = dm.enqueue(req);

      // store download id for progress polling
      prefs().edit().putLong(KEY_DOWNLOAD_ID, downloadId).apply();

      if (receiver != null) {
        try { ctx.unregisterReceiver(receiver); } catch (Exception ignored) {}
        receiver = null;
      }

      receiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
          long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
          if (id != downloadId) return;

          // cleanup receiver
          try { ctx.unregisterReceiver(this); } catch (Exception ignored) {}

          DownloadManager.Query q = new DownloadManager.Query().setFilterById(downloadId);
          Cursor c = null;
          try {
            c = dm.query(q);
            if (c != null && c.moveToFirst()) {
              int status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));

              if (status == DownloadManager.STATUS_SUCCESSFUL) {
                clearDownloadId();
                File apkFile = getApkFile(ctx);

                if (isLikelyValidApk(apkFile)) {
                  SharedPreferences.Editor editor = prefs().edit();
                  editor.putString(KEY_PENDING_PATH, apkFile.getAbsolutePath());
                  if (updateVersion != null && !updateVersion.trim().isEmpty()) {
                    editor.putString(KEY_DOWNLOADED_VERSION, updateVersion.trim());
                  }
                  editor.apply();
                  installApkFromFile(apkFile);
                } else {
                  deleteQuietly(apkFile);
                  prefs().edit().remove(KEY_PENDING_PATH).apply();
                }
              } else if (status == DownloadManager.STATUS_FAILED) {
                clearDownloadId();
              }
            }
          } finally {
            if (c != null) c.close();
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

      if (!isLikelyValidApk(f)) {
        deleteQuietly(f);
        prefs().edit().remove(KEY_PENDING_PATH).apply();
        promise.resolve("INVALID_FILE");
        return;
      }

      installApkFromFile(f);
      promise.resolve("INSTALL_OPENED");
    } catch (Exception e) {
      promise.reject("PENDING_INSTALL_FAIL", e.getMessage(), e);
    }
  }
}