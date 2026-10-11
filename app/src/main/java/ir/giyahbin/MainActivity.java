package ir.giyahbin;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/** برنامه کاملاً آفلاین است: بدون مجوز اینترنت. عکس فقط به‌صورت بندانگشتی برای مقایسه نمایش داده می‌شود. */
public class MainActivity extends Activity {
    private static final int REQ_CAM = 1, REQ_GAL = 2;

    private WebView web;
    private Uri camUri;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#1B5E3B"));
        root.setOnApplyWindowInsetsListener((v, in) -> {
            v.setPadding(in.getSystemWindowInsetLeft(), in.getSystemWindowInsetTop(),
                    in.getSystemWindowInsetRight(), in.getSystemWindowInsetBottom());
            return in;
        });
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.addJavascriptInterface(new Bridge(), "Native");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if ("tel".equals(u.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_DIAL, u)); } catch (Exception ignored) {}
                }
                return !u.toString().startsWith("file:///android_asset/");
            }
        });
        web.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.gbBack?window.gbBack():false", v -> {
            if (!"true".equals(v)) finish();
        });
    }

    /** پل جاوااسکریپت ← اندروید */
    class Bridge {
        @JavascriptInterface
        public void close() { runOnUiThread(() -> finish()); }

        @JavascriptInterface
        public void photo(String source) {
            runOnUiThread(() -> {
                try {
                    if ("camera".equals(source)) {
                        ContentValues cv = new ContentValues();
                        cv.put(MediaStore.Images.Media.DISPLAY_NAME, "giyahbin_" + System.currentTimeMillis() + ".jpg");
                        cv.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                        cv.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Giyahbin");
                        camUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                        startActivityForResult(new Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                                .putExtra(MediaStore.EXTRA_OUTPUT, camUri), REQ_CAM);
                    } else {
                        startActivityForResult(new Intent(Intent.ACTION_GET_CONTENT).setType("image/*")
                                .addCategory(Intent.CATEGORY_OPENABLE), REQ_GAL);
                    }
                } catch (ActivityNotFoundException | SecurityException e) {
                    send("{\"ok\":false,\"err\":\"app\"}");
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        final Uri uri = req == REQ_CAM ? camUri : (data == null ? null : data.getData());
        if (res != RESULT_OK || uri == null) {
            if (req == REQ_CAM && camUri != null) deleteQuiet(camUri);
            send("{\"cancel\":true}");
            return;
        }
        new Thread(() -> {
            try {
                send(thumb(uri));
            } catch (Exception e) {
                send("{\"ok\":false,\"err\":\"img\"}");
            } finally {
                if (req == REQ_CAM) deleteQuiet(uri); // عکس موقت از گالری حذف می‌شود
            }
        }).start();
    }

    private void deleteQuiet(Uri u) {
        try { getContentResolver().delete(u, null, null); } catch (Exception ignored) {}
    }

    private void send(String json) {
        runOnUiThread(() -> web.evaluateJavascript("window.onPhoto(" + JSONObject.quote(json) + ")", null));
    }

    /** کوچک‌سازی عکس و تبدیل به data-URL برای نمایش در برنامه */
    private String thumb(Uri uri) throws Exception {
        Bitmap bmp = load(uri, 720);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.JPEG, 75, out);
        return new JSONObject().put("ok", true)
                .put("thumb", "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP))
                .toString();
    }

    private Bitmap load(Uri uri, int max) throws Exception {
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        try (InputStream in = getContentResolver().openInputStream(uri)) { BitmapFactory.decodeStream(in, null, o); }
        int sample = 1;
        while (Math.max(o.outWidth, o.outHeight) / sample > max * 2) sample *= 2;
        o.inJustDecodeBounds = false;
        o.inSampleSize = sample;
        Bitmap b;
        try (InputStream in = getContentResolver().openInputStream(uri)) { b = BitmapFactory.decodeStream(in, null, o); }
        int rot = 0;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            int ori = new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION, 1);
            rot = ori == 6 ? 90 : ori == 3 ? 180 : ori == 8 ? 270 : 0;
        } catch (Exception ignored) {}
        float sc = Math.min(1f, (float) max / Math.max(b.getWidth(), b.getHeight()));
        Matrix m = new Matrix();
        m.postScale(sc, sc);
        m.postRotate(rot);
        return Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true);
    }
}
