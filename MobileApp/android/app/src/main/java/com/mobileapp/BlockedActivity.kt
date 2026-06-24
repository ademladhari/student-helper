package com.mobileapp

import android.app.ActivityManager
import android.content.Intent
import android.os.Bundle
import android.os.CountDownTimer
import android.view.KeyEvent
import android.view.WindowManager
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class BlockedActivity : AppCompatActivity() {

  private var countdownTimer: CountDownTimer? = null
  private var blockedPackage: String = ""

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_blocked)

    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
    )

    blockedPackage = intent.getStringExtra(EXTRA_BLOCKED_PACKAGE).orEmpty()
    val label = if (blockedPackage.isNotBlank()) {
      try {
        packageManager.getApplicationLabel(packageManager.getApplicationInfo(blockedPackage, 0)).toString()
      } catch (_: Exception) {
        blockedPackage
      }
    } else {
      "This app"
    }

    findViewById<TextView>(R.id.blockedTitle).text = "Focus session active"
    findViewById<TextView>(R.id.blockedAppName).text = label
    val countdownView = findViewById<TextView>(R.id.blockedCountdown)

    countdownTimer = object : CountDownTimer(COUNTDOWN_MS, 1000L) {
      override fun onTick(millisUntilFinished: Long) {
        val seconds = ((millisUntilFinished + 999) / 1000).toInt()
        countdownView.text = "Returning home in ${seconds}s"
      }

      override fun onFinish() {
        goHomeAndKillBlockedApp()
      }
    }.start()
  }

  override fun onStop() {
    super.onStop()
    AppBlockerService.instance?.notifyBlockScreenClosed()
  }

  override fun onDestroy() {
    countdownTimer?.cancel()
    super.onDestroy()
  }

  override fun onBackPressed() {
    // Block back navigation during countdown.
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    if (keyCode == KeyEvent.KEYCODE_BACK) {
      return true
    }
    return super.onKeyDown(keyCode, event)
  }

  private fun goHomeAndKillBlockedApp() {
    val homeIntent = Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_HOME)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    startActivity(homeIntent)

    if (blockedPackage.isNotBlank()) {
      val activityManager = getSystemService(ACTIVITY_SERVICE) as ActivityManager
      activityManager.killBackgroundProcesses(blockedPackage)
    }

    finish()
  }

  companion object {
    const val EXTRA_BLOCKED_PACKAGE = "blockedPackage"
    private const val COUNTDOWN_MS = 3000L
  }
}
