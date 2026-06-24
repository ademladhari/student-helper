package com.mobileapp

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AppBlockerService : AccessibilityService() {

  private val handler = Handler(Looper.getMainLooper())
  private val statsPrefs by lazy { getSharedPreferences(AppBlockerModule.STATS_PREFS, Context.MODE_PRIVATE) }
  private val rulesPrefs by lazy { getSharedPreferences(AppBlockerModule.RULES_PREFS, Context.MODE_PRIVATE) }

  private var lastPackage: String? = null
  private var lastTimestamp: Long = 0L
  private var lastBlockLaunchAt: Long = 0L
  private var blockScreenVisible: Boolean = false

  private val checkLoopRunnable = object : Runnable {
    override fun run() {
      try {
        val foreground = getForegroundPackageName()
        if (foreground != null && shouldBlockPackage(foreground, System.currentTimeMillis())) {
          showBlockedScreen(foreground)
        }
      } catch (_: Exception) {
        // Ignore heartbeat errors.
      }
      handler.postDelayed(this, HEARTBEAT_MS)
    }
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this

    val info = AccessibilityServiceInfo().apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      notificationTimeout = 100
      flags = AccessibilityServiceInfo.DEFAULT
    }
    serviceInfo = info

    loadBlockingSettings()
    handler.post(checkLoopRunnable)
  }

  override fun onDestroy() {
    handler.removeCallbacks(checkLoopRunnable)
    if (instance === this) {
      instance = null
    }
    super.onDestroy()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) {
      return
    }

    val packageName = event.packageName?.toString() ?: return
    val now = System.currentTimeMillis()

    if (isIgnoredPackage(packageName)) {
      return
    }

    handleUsageTracking(event, packageName, now)

    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      return
    }

    if (!isBlockingEnabled) {
      return
    }

    if (shouldBlockPackage(packageName, now)) {
      showBlockedScreen(packageName)
    }
  }

  override fun onInterrupt() {
    // No-op.
  }

  fun loadBlockingSettings() {
    isBlockingEnabled = statsPrefs.getBoolean(AppBlockerModule.KEY_BLOCKING_ENABLED, false)
    blockedPackages = parseBlockedPackages(statsPrefs.getString(AppBlockerModule.KEY_BLOCKED_PACKAGES, "[]"))
  }

  fun notifyBlockScreenClosed() {
    blockScreenVisible = false
  }

  private fun handleUsageTracking(event: AccessibilityEvent, packageName: String, now: Long) {
    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      return
    }

    if (packageName != lastPackage) {
      flushUsage(lastPackage, lastTimestamp, now)
      lastPackage = packageName
      lastTimestamp = now
    }
  }

  private fun flushUsage(packageName: String?, start: Long, end: Long) {
    if (packageName.isNullOrBlank() || start <= 0L || end <= start) {
      return
    }

    val elapsed = end - start
    val key = AppBlockerModule.usageKey(todayKey(), packageName)
    val updated = statsPrefs.getLong(key, 0L) + elapsed
    statsPrefs.edit().putLong(key, updated).apply()
  }

  private fun shouldBlockPackage(packageName: String, now: Long): Boolean {
    if (!isBlockingEnabled) {
      return false
    }

    if (packageName in blockedPackages) {
      return true
    }

    if (!hasActiveRule(packageName)) {
      return false
    }

    return getRemainingMillis(packageName, now) <= GRACE_MS
  }

  private fun hasActiveRule(packageName: String): Boolean {
    return rulesPrefs.getBoolean(AppBlockerModule.ruleKey("enabled", packageName), false)
  }

  private fun getRemainingMillis(packageName: String, now: Long): Long {
    if (!hasActiveRule(packageName)) {
      return Long.MAX_VALUE
    }

    val mode = rulesPrefs.getString(AppBlockerModule.ruleKey("mode", packageName), "always") ?: "always"
    val calendar = java.util.Calendar.getInstance().apply { timeInMillis = now }
    val currentMinutes = calendar.get(java.util.Calendar.HOUR_OF_DAY) * 60 +
      calendar.get(java.util.Calendar.MINUTE)

    return when (mode) {
      "always" -> 0L
      "schedule" -> {
        val startMin = rulesPrefs.getInt(AppBlockerModule.ruleKey("start", packageName), 0)
        val endMin = rulesPrefs.getInt(AppBlockerModule.ruleKey("end", packageName), 0)
        val inWindow = if (startMin <= endMin) {
          currentMinutes in startMin..endMin
        } else {
          currentMinutes >= startMin || currentMinutes <= endMin
        }
        if (inWindow) 0L else Long.MAX_VALUE
      }
      "limit" -> {
        val limitMinutes = rulesPrefs.getInt(AppBlockerModule.ruleKey("limit", packageName), 0)
        val limitMillis = limitMinutes * 60_000L
        val stored = statsPrefs.getLong(AppBlockerModule.usageKey(todayKey(), packageName), 0L)
        val live = if (packageName == lastPackage && lastTimestamp > 0L) now - lastTimestamp else 0L
        limitMillis - (stored + live)
      }
      else -> Long.MAX_VALUE
    }
  }

  private fun showBlockedScreen(packageName: String): Boolean {
    val now = System.currentTimeMillis()
    if (blockScreenVisible || now - lastBlockLaunchAt < BLOCK_DEBOUNCE_MS) {
      return false
    }

    lastBlockLaunchAt = now
    blockScreenVisible = true

    val intent = Intent(this, BlockedActivity::class.java).apply {
      putExtra(BlockedActivity.EXTRA_BLOCKED_PACKAGE, packageName)
      addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_NO_HISTORY,
      )
    }

    return try {
      startActivity(intent)
      true
    } catch (_: Exception) {
      blockScreenVisible = false
      performGlobalAction(GLOBAL_ACTION_HOME)
      false
    }
  }

  private fun getForegroundPackageName(): String? {
    val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val tasks = activityManager.appTasks
    if (tasks.isNotEmpty()) {
      val top = tasks[0].taskInfo.topActivity
      if (top != null) {
        return top.packageName
      }
    }

    @Suppress("DEPRECATION")
    val processes = activityManager.runningAppProcesses ?: return null
    for (process in processes) {
      if (process.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND) {
        return process.processName.substringBefore(':')
      }
    }
    return null
  }

  private fun isIgnoredPackage(packageName: String): Boolean {
    return packageName == applicationContext.packageName ||
      packageName == "android" ||
      packageName == "com.android.systemui" ||
      packageName == "com.google.android.apps.nexuslauncher"
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

  private fun todayKey(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

  companion object {
    private const val HEARTBEAT_MS = 1000L
    private const val BLOCK_DEBOUNCE_MS = 2500L
    private const val GRACE_MS = 3000L

    @Volatile
    var instance: AppBlockerService? = null

    @Volatile
    var isBlockingEnabled: Boolean = false

    @Volatile
    var blockedPackages: Set<String> = emptySet()
  }
}
