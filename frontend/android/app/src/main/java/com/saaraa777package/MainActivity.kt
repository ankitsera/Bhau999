package com.saaraa777package

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // ✅ switch away from BootTheme ASAP so splash doesn't re-appear later
    setTheme(R.style.AppTheme)
    super.onCreate(savedInstanceState)
  }

  override fun getMainComponentName(): String = "sara777"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}