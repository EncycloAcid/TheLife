package com.thelife.game

import android.annotation.SuppressLint
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader

/**
 * Hosts the TheLife web game (packaged in assets) in a full-screen WebView.
 * Saves live in the WebView's localStorage, which persists across launches.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var root: FrameLayout

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        // Serve assets from a stable https origin so localStorage survives app updates.
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val night = isNightMode()
        val background = Color.parseColor(if (night) DARK_BG else LIGHT_BG)
        webView = WebView(this).apply {
            setBackgroundColor(background)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.textZoom = 100
            overScrollMode = WebView.OVER_SCROLL_NEVER
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

                // The game is fully offline; never navigate away from it.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                    request.url.host != GAME_HOST
            }
            // Lets the game recolour the system-bar areas to match its theme.
            addJavascriptInterface(SystemBarsBridge(), "TheLifeAndroid")
        }
        // A WebView ignores its own padding (its page still draws edge to edge),
        // so it sits inside a container that absorbs the system-bar insets. The
        // container is painted the game's background colour so the bars blend in.
        root = FrameLayout(this).apply {
            setBackgroundColor(background)
            addView(webView, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        }
        setContentView(root)

        // Keep the game clear of the status bar, notch, gesture bar and keyboard.
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, ime.bottom))
            WindowInsetsCompat.CONSUMED
        }
        ViewCompat.requestApplyInsets(root)

        // Dark status/nav icons on the light theme, light icons on the dark theme.
        setBarIcons(dark = night)

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(GAME_URL)
        }

        // Route the system back gesture through the game's own navigation first.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript("(window.__tlBack && window.__tlBack()) ? 'y' : 'n'") { result ->
                    if (result != "\"y\"") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })
    }

    private fun setBarIcons(dark: Boolean) {
        WindowCompat.getInsetsController(window, root).apply {
            isAppearanceLightStatusBars = !dark
            isAppearanceLightNavigationBars = !dark
        }
    }

    /** Called from the game's JavaScript whenever its theme changes. */
    private inner class SystemBarsBridge {
        @JavascriptInterface
        fun setSystemBars(color: String, dark: Boolean) {
            val hex = color.trim()
            if (!HEX_COLOR.matches(hex)) return
            val parsed = Color.parseColor(hex)
            runOnUiThread {
                if (isFinishing || isDestroyed) return@runOnUiThread
                root.setBackgroundColor(parsed)
                webView.setBackgroundColor(parsed)
                setBarIcons(dark)
            }
        }
    }

    private fun isNightMode(): Boolean =
        (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES

    override fun onPause() {
        // Make sure progress is flushed when the app is backgrounded.
        webView.evaluateJavascript("try{TL.S&&TL.engine.save()}catch(e){}", null)
        webView.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val GAME_HOST = "appassets.androidplatform.net"
        private const val DARK_BG = "#000000"
        private const val LIGHT_BG = "#F2F2F7"
        private val HEX_COLOR = Regex("#[0-9A-Fa-f]{6}")
        private val GAME_URL = Uri.Builder().scheme("https").authority(GAME_HOST)
            .appendPath("assets").appendPath("index.html").build().toString()
    }
}
