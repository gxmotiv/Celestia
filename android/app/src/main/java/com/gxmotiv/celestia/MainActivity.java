package com.gxmotiv.celestia;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

// Online Celestia remains the primary experience. A bundled calculator is used
// whenever Android has no validated internet connection or the site cannot load.
public class MainActivity extends Activity {
    private static final String START_URL = "https://celestia.gagandeep-hwr.workers.dev/";
    private static final String APP_HOST = "celestia.gagandeep-hwr.workers.dev";
    private static final String OFFLINE_HOST = "appassets.androidplatform.net";
    private static final String OFFLINE_URL =
        "https://appassets.androidplatform.net/assets/offline/index.html";

    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private boolean offlinePageVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        // The offline page is served by WebViewAssetLoader over its reserved
        // local HTTPS origin, so direct file/content access is not necessary.
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowFileAccessFromFileURLs(false);
        webView.getSettings().setAllowUniversalAccessFromFileURLs(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        webView.getSettings().setSupportMultipleWindows(false);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(true);
        webView.setWebChromeClient(new WebChromeClient());

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                WebView view,
                WebResourceRequest request
            ) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return assetLoader.shouldInterceptRequest(Uri.parse(url));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return routeUrl(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return routeUrl(Uri.parse(url));
            }

            private boolean routeUrl(Uri uri) {
                String scheme = uri.getScheme();
                String host = uri.getHost();
                if ("https".equalsIgnoreCase(scheme) &&
                    OFFLINE_HOST.equalsIgnoreCase(host) &&
                    uri.getPath() != null &&
                    uri.getPath().startsWith("/assets/offline/")) {
                    return false;
                }
                if ("https".equalsIgnoreCase(scheme) && APP_HOST.equalsIgnoreCase(host)) {
                    return false;
                }

                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                    // Keep unsupported external URLs in the current WebView.
                    return false;
                }
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                offlinePageVisible = isOfflineUrl(Uri.parse(url));
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onReceivedError(
                WebView view,
                WebResourceRequest request,
                WebResourceError error
            ) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame() && !isOfflineUrl(request.getUrl())) {
                    showOfflinePage();
                }
            }

            @Override
            public void onReceivedHttpError(
                WebView view,
                WebResourceRequest request,
                WebResourceResponse response
            ) {
                super.onReceivedHttpError(view, request, response);
                if (request.isForMainFrame() &&
                    APP_HOST.equalsIgnoreCase(request.getUrl().getHost()) &&
                    response.getStatusCode() >= 400) {
                    showOfflinePage();
                }
            }
        });

        if (hasValidatedInternet()) {
            if (savedInstanceState != null) {
                if (webView.restoreState(savedInstanceState) == null) {
                    webView.loadUrl(START_URL);
                }
            } else {
                webView.loadUrl(START_URL);
            }
        } else {
            showOfflinePage();
        }
    }

    private boolean isOfflineUrl(Uri uri) {
        return uri != null
            && "https".equalsIgnoreCase(uri.getScheme())
            && OFFLINE_HOST.equalsIgnoreCase(uri.getHost())
            && uri.getPath() != null
            && uri.getPath().startsWith("/assets/offline/");
    }

    private boolean hasValidatedInternet() {
        try {
            ConnectivityManager manager =
                (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
            if (manager == null) return false;

            Network activeNetwork = manager.getActiveNetwork();
            if (activeNetwork == null) return false;

            NetworkCapabilities capabilities = manager.getNetworkCapabilities(activeNetwork);
            return capabilities != null
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        } catch (Exception ignored) {
            return false;
        }
    }

    private void showOfflinePage() {
        if (webView == null || offlinePageVisible) return;
        offlinePageVisible = true;
        webView.loadUrl(OFFLINE_URL);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) {
            webView.saveState(outState);
        }
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
