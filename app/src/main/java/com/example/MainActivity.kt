package com.example

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.example.ui.theme.MyApplicationTheme
import java.io.File

class MainActivity : ComponentActivity() {

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingCameraUri: Uri? = null

    // Direct Camera Picture Launcher
    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && pendingCameraUri != null) {
            filePathCallback?.onReceiveValue(arrayOf(pendingCameraUri!!))
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
        pendingCameraUri = null
    }

    // Gallery / File Picker Launcher
    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val intent = result.data
            val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, intent)
            filePathCallback?.onReceiveValue(uris)
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }

    // Camera Permission Launcher
    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            launchDirectCamera()
        } else {
            launchGalleryPicker(null)
        }
    }

    private fun launchDirectCamera() {
        try {
            val photoFile = File.createTempFile("splat_camera_", ".jpg", cacheDir)
            val photoUri = FileProvider.getUriForFile(
                this,
                "${applicationContext.packageName}.fileprovider",
                photoFile
            )
            pendingCameraUri = photoUri
            takePictureLauncher.launch(photoUri)
        } catch (e: Exception) {
            Log.e("SplatDexNative", "Failed to launch camera", e)
            filePathCallback?.onReceiveValue(null)
            filePathCallback = null
            pendingCameraUri = null
        }
    }

    private fun launchGalleryPicker(fileChooserParams: WebChromeClient.FileChooserParams?) {
        try {
            val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "image/*"
            }
            filePickerLauncher.launch(intent)
        } catch (e: Exception) {
            Log.e("SplatDexNative", "Failed to launch gallery picker", e)
            filePathCallback?.onReceiveValue(null)
            filePathCallback = null
        }
    }

    private fun handleFileChooser(
        callback: ValueCallback<Array<Uri>>?,
        fileChooserParams: WebChromeClient.FileChooserParams?
    ) {
        filePathCallback = callback

        val isCapture = fileChooserParams?.isCaptureEnabled == true
        if (isCapture) {
            val hasCameraPermission = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED

            if (hasCameraPermission) {
                launchDirectCamera()
            } else {
                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        } else {
            launchGalleryPicker(fileChooserParams)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MyApplicationTheme {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF0F172A))
                        .safeDrawingPadding()
                        .testTag("splatdex_root_container")
                ) {
                    SplatDexWebView(
                        onOpenFileChooser = { callback, fileChooserParams ->
                            handleFileChooser(callback, fileChooserParams)
                        }
                    )
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun SplatDexWebView(
    onOpenFileChooser: (ValueCallback<Array<Uri>>?, WebChromeClient.FileChooserParams?) -> Unit,
    modifier: Modifier = Modifier
) {
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }

    BackHandler(enabled = webViewInstance?.canGoBack() == true) {
        webViewInstance?.goBack()
    }

    AndroidView(
        modifier = modifier
            .fillMaxSize()
            .testTag("splatdex_webview"),
        factory = { context ->
            WebView(context).apply {
                setBackgroundColor(0xFF0F172A.toInt())
                setLayerType(View.LAYER_TYPE_HARDWARE, null)

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    mediaPlaybackRequiresUserGesture = false
                    cacheMode = WebSettings.LOAD_DEFAULT
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    displayZoomControls = false
                    builtInZoomControls = false
                    setSupportZoom(false)
                }

                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        val url = request?.url?.toString() ?: return false
                        if (url.startsWith("file://") || url.startsWith("data:")) {
                            return false
                        }
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, request.url)
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            Log.e("SplatDexWebView", "Unable to open url: $url", e)
                        }
                        return true
                    }

                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?
                    ) {
                        super.onReceivedError(view, request, error)
                        Log.w(
                            "SplatDexWebView",
                            "Resource error: ${error?.description} (${error?.errorCode}) for ${request?.url}"
                        )
                    }

                    override fun onReceivedHttpError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        errorResponse: WebResourceResponse?
                    ) {
                        super.onReceivedHttpError(view, request, errorResponse)
                        Log.w(
                            "SplatDexWebView",
                            "HTTP error ${errorResponse?.statusCode} for ${request?.url}"
                        )
                    }
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onShowFileChooser(
                        webView: WebView?,
                        filePathCallback: ValueCallback<Array<Uri>>?,
                        fileChooserParams: FileChooserParams?
                    ): Boolean {
                        onOpenFileChooser(filePathCallback, fileChooserParams)
                        return true
                    }

                    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                        consoleMessage?.let {
                            Log.d(
                                "SplatDexJS",
                                "[${it.messageLevel()}] ${it.message()} (${it.sourceId()}:${it.lineNumber()})"
                            )
                        }
                        return true
                    }
                }

                loadUrl("file:///android_asset/www/index.html")
                webViewInstance = this
            }
        }
    )
}
