package com.sara777;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.Map;

public class UpiIntentModule extends ReactContextBaseJavaModule {

  private static final int REQUEST_CODE = 9234;

  private Promise pendingPromise;

  private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
      if (requestCode != REQUEST_CODE || pendingPromise == null) return;

      Promise p = pendingPromise;
      pendingPromise = null;

      // User backed out / app closed
      if (resultCode != Activity.RESULT_OK) {
        p.reject("PAYMENT_CANCELLED", "User cancelled / closed UPI app");
        return;
      }

      String response = extractUpiResponse(data);

      WritableMap out = Arguments.createMap();
      out.putString("raw", response);

      Map<String, String> parsed = parseResponse(response);
      for (Map.Entry<String, String> e : parsed.entrySet()) {
        out.putString(e.getKey(), e.getValue());
      }

      String status = "";
      if (parsed.containsKey("Status")) status = parsed.get("Status");
      else if (parsed.containsKey("status")) status = parsed.get("status");

      out.putString("status", status == null ? "" : status.toUpperCase());
      p.resolve(out);
    }
  };

  public UpiIntentModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addActivityEventListener(activityEventListener);
  }

  @NonNull
  @Override
  public String getName() {
    return "UpiIntentModule";
  }

  @ReactMethod
  public void openUpiApp(String upiUrl, Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Activity doesn't exist");
      return;
    }

    if (pendingPromise != null) {
      promise.reject("IN_PROGRESS", "Another UPI payment is already in progress");
      return;
    }

    try {
      Uri uri = Uri.parse(upiUrl);
      Intent intent = new Intent(Intent.ACTION_VIEW, uri);

      if (intent.resolveActivity(activity.getPackageManager()) == null) {
        promise.reject("NO_UPI_APP", "No UPI app found on this device");
        return;
      }

      pendingPromise = promise;
      Intent chooser = Intent.createChooser(intent, "Pay with UPI");
      activity.startActivityForResult(chooser, REQUEST_CODE);

    } catch (Exception e) {
      pendingPromise = null;
      promise.reject("UPI_ERROR", e.getMessage(), e);
    }
  }

  private static String extractUpiResponse(@Nullable Intent data) {
    if (data == null) return null;

    // Most UPI apps return "response" in extras
    try {
      String resp = data.getStringExtra("response");
      if (resp != null && !resp.trim().isEmpty()) return resp;
    } catch (Exception ignored) {}

    // Some apps put it in extras as Object
    try {
      Bundle extras = data.getExtras();
      if (extras != null) {
        Object r = extras.get("response");
        if (r != null) {
          String resp = String.valueOf(r);
          if (resp != null && !resp.trim().isEmpty()) return resp;
        }
      }
    } catch (Exception ignored) {}

    // Rare fallback: data string
    try {
      String ds = data.getDataString();
      if (ds != null && !ds.trim().isEmpty()) return ds;
    } catch (Exception ignored) {}

    return null;
  }

  private static Map<String, String> parseResponse(String resp) {
    Map<String, String> map = new HashMap<>();
    if (resp == null || resp.trim().isEmpty()) return map;

    // Some apps return "upi://pay?Status=SUCCESS&txnId=..."
    String s = resp;
    int q = s.indexOf('?');
    if (q >= 0 && q < s.length() - 1) s = s.substring(q + 1);

    String[] parts = s.split("&");
    for (String p : parts) {
      String[] kv = p.split("=", 2);
      if (kv.length == 2) {
        map.put(kv[0], kv[1]);
      }
    }
    return map;
  }
}
