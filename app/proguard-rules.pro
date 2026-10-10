# No reflection-based code; defaults are sufficient.
# Methods the game's JavaScript calls through addJavascriptInterface.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
