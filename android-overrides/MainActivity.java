package in.omsarvabhuta.crm;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
  private static final String HOME = "https://om-sarva-bhuta-crm-secure.vercel.app/operations.html";
  private static final String HOST = "om-sarva-bhuta-crm-secure.vercel.app";
  private static final int PICK_FILE = 1001;
  private static final int BRAND = Color.rgb(120,26,40);
  private WebView web;
  private ProgressBar progress;
  private LinearLayout offline;
  private android.webkit.ValueCallback<Uri[]> pendingFile;
  private int dp(float n) { return Math.round(getResources().getDisplayMetrics().density*n); }

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().setStatusBarColor(BRAND);
    getWindow().setNavigationBarColor(Color.rgb(36,29,33));
    FrameLayout root = new FrameLayout(this);
    root.setBackgroundColor(Color.WHITE);
    root.setFitsSystemWindows(true);
    web = new WebView(this);
    web.setBackgroundColor(Color.WHITE);
    root.addView(web,new FrameLayout.LayoutParams(-1,-1));

    progress = new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);
    progress.setMax(100);
    progress.setProgressTintList(android.content.res.ColorStateList.valueOf(BRAND));
    root.addView(progress,new FrameLayout.LayoutParams(-1,dp(3),Gravity.TOP));

    offline = new LinearLayout(this);
    offline.setOrientation(LinearLayout.VERTICAL);
    offline.setGravity(Gravity.CENTER);
    offline.setPadding(dp(28),dp(24),dp(28),dp(24));
    offline.setBackgroundColor(Color.WHITE);
    TextView title = new TextView(this);
    title.setText("OM SARVA BHUTA CRM");
    title.setTextSize(23);
    title.setTextColor(BRAND);
    title.setGravity(Gravity.CENTER);
    title.setTypeface(null,android.graphics.Typeface.BOLD);
    offline.addView(title,new LinearLayout.LayoutParams(-1,-2));
    TextView detail = new TextView(this);
    detail.setText("Connection unavailable. Check your internet and try again.\nYour CRM data remains on the secure server.");
    detail.setTextSize(15);
    detail.setTextColor(Color.DKGRAY);
    detail.setGravity(Gravity.CENTER);
    detail.setPadding(0,dp(16),0,dp(18));
    offline.addView(detail,new LinearLayout.LayoutParams(-1,-2));
    Button retry = new Button(this);
    retry.setAllCaps(false);
    retry.setText("Retry Connection");
    retry.setTextColor(Color.WHITE);
    retry.setBackgroundTintList(android.content.res.ColorStateList.valueOf(BRAND));
    retry.setOnClickListener(v -> { offline.setVisibility(View.GONE); web.loadUrl(HOME); });
    offline.addView(retry,new LinearLayout.LayoutParams(-1,-2));
    offline.setVisibility(View.GONE);
    root.addView(offline,new FrameLayout.LayoutParams(-1,-1));
    setContentView(root);

    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setSafeBrowsingEnabled(true);
    s.setAllowFileAccess(false);
    s.setAllowContentAccess(true);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    s.setJavaScriptCanOpenWindowsAutomatically(false);
    s.setSupportMultipleWindows(false);
    s.setMediaPlaybackRequiresUserGesture(true);
    CookieManager.getInstance().setAcceptCookie(true);
    CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);

    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request) {
        if (!request.isForMainFrame()) return false;
        Uri dest = request.getUrl();
        if ("https".equalsIgnoreCase(dest.getScheme()) && HOST.equalsIgnoreCase(dest.getHost())) return false;
        if ("https".equalsIgnoreCase(dest.getScheme()) && dest.getHost()!=null) {
          try { startActivity(new Intent(Intent.ACTION_VIEW,dest)); }
          catch (ActivityNotFoundException ex) { Toast.makeText(MainActivity.this,"Cannot open browser",Toast.LENGTH_SHORT).show(); }
        } else {
          Toast.makeText(MainActivity.this,"Unsafe link blocked",Toast.LENGTH_SHORT).show();
        }
        return true;
      }
      @Override public void onPageStarted(WebView view,String url,Bitmap favicon) {
        progress.setVisibility(View.VISIBLE);
        offline.setVisibility(View.GONE);
      }
      @Override public void onPageFinished(WebView view,String url) {
        progress.setVisibility(View.GONE);
      }
      @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error) {
        if (request.isForMainFrame()) { offline.setVisibility(View.VISIBLE); progress.setVisibility(View.GONE); }
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public void onProgressChanged(WebView view,int percent) {
        progress.setProgress(percent);
        if(percent>=100) progress.setVisibility(View.GONE);
      }
      @Override public boolean onShowFileChooser(WebView view,android.webkit.ValueCallback<Uri[]> callback,FileChooserParams params) {
        if(pendingFile!=null) pendingFile.onReceiveValue(null);
        pendingFile=callback;
        try {
          startActivityForResult(params.createIntent(),PICK_FILE);
          return true;
        } catch(Exception ex) {
          pendingFile=null;
          Toast.makeText(MainActivity.this,"File picker unavailable",Toast.LENGTH_SHORT).show();
          callback.onReceiveValue(null);
          return true;
        }
      }
    });
    if(state!=null) web.restoreState(state);
    else web.loadUrl(HOME);
  }
  @Override protected void onActivityResult(int requestCode,int resultCode,Intent data) {
    super.onActivityResult(requestCode,resultCode,data);
    if(requestCode==PICK_FILE && pendingFile!=null) {
      pendingFile.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
      pendingFile=null;
    }
  }
  @Override protected void onSaveInstanceState(Bundle state) { super.onSaveInstanceState(state); web.saveState(state); }
  @Override public void onBackPressed() {
    if(offline.getVisibility()==View.VISIBLE) { offline.setVisibility(View.GONE); web.loadUrl(HOME); }
    else if(web.canGoBack()) web.goBack();
    else super.onBackPressed();
  }
  @Override protected void onDestroy() {
    if(pendingFile!=null) { pendingFile.onReceiveValue(null); pendingFile=null; }
    web.destroy(); super.onDestroy();
  }
}
