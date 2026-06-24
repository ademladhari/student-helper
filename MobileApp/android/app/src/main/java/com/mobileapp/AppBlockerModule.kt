package com.mobileapp

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import org.json.JSONArray
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AppBlockerModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AppBlockerModule"

  private val statsPrefs by lazy {
    reactContext.getSharedPreferences(STATS_PREFS, Context.MODE_PRIVATE)
  }

  private val rulesPrefs by lazy {
    reactContext.getSharedPreferences(RULES_PREFS, Context.MODE_PRIVATE)
  }

  @ReactMethod
  fun setBlocking(enabled: Boolean, packages: ReadableArray, promise: Promise) {
    try {
      val packageList = mutableListOf<String>()
      for (index in 0 until packages.size()) {
        packages.getString(index)?.let { packageList.add(it) }
      }

      val previouslyBlocked = parseBlockedPackages(
        statsPrefs.getString(KEY_BLOCKED_PACKAGES, "[]"),
      )

      statsPrefs.edit()
        .putBoolean(KEY_BLOCKING_ENABLED, enabled)
        .putString(KEY_BLOCKED_PACKAGES, JSONArray(packageList).toString())
        .apply()

      AppBlockerService.isBlockingEnabled = enabled
      AppBlockerService.blockedPackages = if (enabled) packageList.toSet() else emptySet()

      if (!enabled) {
        clearFocusRulesForPackages((previouslyBlocked + packageList).toSet())
      }

      AppBlockerService.instance?.loadBlockingSettings()
      AppBlockerService.instance?.notifyBlockScreenClosed()

      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SET_BLOCKING_FAILED", error.message, error)
    }
  }

  private fun clearFocusRulesForPackages(packages: Set<String>) {
    if (packages.isEmpty()) {
      return
    }

    val editor = rulesPrefs.edit()
    packages.forEach { packageName ->
      editor.remove(ruleKey("enabled", packageName))
      editor.remove(ruleKey("mode", packageName))
      editor.remove(ruleKey("limit", packageName))
      editor.remove(ruleKey("start", packageName))
      editor.remove(ruleKey("end", packageName))
    }
    editor.apply()
  }

  private fun parseBlockedPackages(raw: String?): Set<String> {
    return try {
      val json = JSONArray(raw ?: "[]")
      buildSet {
        for (index in 0 until json.length()) {
          json.optString(index)?.takeIf { it.isNotBlank() }?.let { add(it) }
        }
      }
    } catch (_: Exception) {
      emptySet()
    }
  }

  @ReactMethod
  fun setAppRule(
    packageName: String,
    enabled: Boolean,
    mode: String,
    limitMinutes: Int,
    startMinutes: Int,
    endMinutes: Int,
    promise: Promise,
  ) {
    try {
      rulesPrefs.edit()
        .putBoolean(ruleKey("enabled", packageName), enabled)
        .putString(ruleKey("mode", packageName), mode)
        .putInt(ruleKey("limit", packageName), limitMinutes)
        .putInt(ruleKey("start", packageName), startMinutes)
        .putInt(ruleKey("end", packageName), endMinutes)
        .apply()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SET_APP_RULE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun removeAppRule(packageName: String, promise: Promise) {
    try {
      rulesPrefs.edit()
        .remove(ruleKey("enabled", packageName))
        .remove(ruleKey("mode", packageName))
        .remove(ruleKey("limit", packageName))
        .remove(ruleKey("start", packageName))
        .remove(ruleKey("end", packageName))
        .apply()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("REMOVE_APP_RULE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun getAppRules(promise: Promise) {
    try {
      val result = Arguments.createMap()
      rulesPrefs.all.forEach { (key, value) ->
        if (!key.startsWith("rule_enabled_")) {
          return@forEach
        }
        val packageName = key.removePrefix("rule_enabled_")
        val map = Arguments.createMap()
        map.putBoolean("enabled", value as? Boolean ?: false)
        map.putString("mode", rulesPrefs.getString(ruleKey("mode", packageName), "always"))
        map.putInt("limitMinutes", rulesPrefs.getInt(ruleKey("limit", packageName), 0))
        map.putInt("startMinutes", rulesPrefs.getInt(ruleKey("start", packageName), 0))
        map.putInt("endMinutes", rulesPrefs.getInt(ruleKey("end", packageName), 0))
        result.putMap(packageName, map)
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("GET_APP_RULES_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun getInstalledApps(promise: Promise) {
    try {
      val pm = reactContext.packageManager
      val apps = pm.getInstalledApplications(0)
        .filter { app ->
          pm.getLaunchIntentForPackage(app.packageName) != null &&
            app.packageName != reactContext.packageName
        }
        .sortedBy { pm.getApplicationLabel(it).toString().lowercase(Locale.getDefault()) }

      val result = Arguments.createArray()
      apps.forEach { app ->
        val map = Arguments.createMap()
        map.putString("packageName", app.packageName)
        map.putString("label", pm.getApplicationLabel(app).toString())
        map.putString("icon", drawableToBase64(pm.getApplicationIcon(app)))
        result.pushMap(map)
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("GET_INSTALLED_APPS_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun getUsageForDate(date: String, promise: Promise) {
    try {
      val result = Arguments.createMap()
      statsPrefs.all.forEach { (key, value) ->
        val prefix = "daily_usage_${date}_"
        if (key.startsWith(prefix) && value is Long) {
          result.putDouble(key.removePrefix(prefix), value.toDouble())
        }
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("GET_USAGE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun isAccessibilityServiceEnabled(promise: Promise) {
    try {
      promise.resolve(isAccessibilityEnabled())
    } catch (error: Exception) {
      promise.reject("ACCESSIBILITY_CHECK_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun requestAccessibilityService(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("ACCESSIBILITY_REQUEST_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun hasUsageAccess(promise: Promise) {
    try {
      promise.resolve(hasUsageStatsPermission())
    } catch (error: Exception) {
      promise.reject("USAGE_CHECK_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun requestUsageAccess(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("USAGE_REQUEST_FAILED", error.message, error)
    }
  }

  private fun isAccessibilityEnabled(): Boolean {
    val enabledServices = Settings.Secure.getString(
      reactContext.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
    ) ?: return false
    val expected = "${reactContext.packageName}/${AppBlockerService::class.java.name}"
    return enabledServices.split(':').any { it.equals(expected, ignoreCase = true) }
  }

  private fun hasUsageStatsPermission(): Boolean {
    val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        reactContext.packageName,
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        reactContext.packageName,
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun drawableToBase64(drawable: Drawable): String {
    val bitmap = when (drawable) {
      is BitmapDrawable -> drawable.bitmap
      else -> {
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
        val created = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(created)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        created
      }
    }
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 90, stream)
    return "data:image/png;base64,${Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)}"
  }

  companion object {
    const val STATS_PREFS = "app_blocker_stats"
    const val RULES_PREFS = "app_blocker_rules"
    const val KEY_BLOCKING_ENABLED = "is_blocking_enabled"
    const val KEY_BLOCKED_PACKAGES = "blocked_packages"

    fun ruleKey(kind: String, packageName: String): String = "rule_${kind}_$packageName"

    fun usageKey(date: String, packageName: String): String = "daily_usage_${date}_$packageName"

    fun todayKey(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
  }
}
