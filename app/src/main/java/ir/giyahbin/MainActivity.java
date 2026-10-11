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
import android.view.View;
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
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

public class MainActivity extends Activity {
    private static final int REQ_CAM = 1, REQ_GAL = 2;
    private static final String API = "https://my-api.plantnet.org/v2/identify/all";

    private WebView web;
    private Uri camUri;
    private String apiKey = "";

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

    /** پل جاوااسکریپت → اندروید */
    class Bridge {
        @JavascriptInterface
        public void close() { runOnUiThread(() -> finish()); }

        @JavascriptInterface
        public boolean hasKey() { return !BuildConfig.PLANTNET_KEY.isEmpty(); }

        @JavascriptInterface
        public void open(String url) {
            if (url == null || !url.startsWith("https://")) return;
            runOnUiThread(() -> {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void identify(String source, String key) {
            apiKey = (key == null || key.trim().isEmpty()) ? BuildConfig.PLANTNET_KEY : key.trim();
            runOnUiThread(() -> {
                try {
                    if ("camera".equals(source)) {
                        ContentValues cv = new ContentValues();
                        cv.put(MediaStore.Images.Media.DISPLAY_NAME, "giyahbin_" + System.currentTimeMillis() + ".jpg");
                        cv.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                        cv.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Giyahbin");
                        camUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                        Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, camUri);
                        startActivityForResult(i, REQ_CAM);
                    } else {
                        Intent i = new Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);
                        startActivityForResult(i, REQ_GAL);
                    }
                } catch (ActivityNotFoundException | SecurityException e) {
                    send(err("app"));
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
                send(process(uri));
            } catch (java.io.IOException e) {
                send(err("net"));
            } catch (Exception e) {
                send(err("img"));
            } finally {
                if (req == REQ_CAM) deleteQuiet(uri); // عکس موقت را از گالری حذف می‌کنیم
            }
        }).start();
    }

    private void deleteQuiet(Uri u) {
        try { getContentResolver().delete(u, null, null); } catch (Exception ignored) {}
    }

    private String err(String e) {
        return "{\"ok\":false,\"err\":" + JSONObject.quote(e) + "}";
    }

    private void send(String json) {
        runOnUiThread(() -> web.evaluateJavascript("window.onIdResult(" + JSONObject.quote(json) + ")", null));
    }

    /** کوچک‌سازی تصویر، آپلود به Pl@ntNet و بازگرداندن JSON */
    private String process(Uri uri) throws Exception {
        if (apiKey.isEmpty()) return err("nokey");
        Bitmap bmp = load(uri, 1280);
        ByteArrayOutputStream jpg = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.JPEG, 82, jpg);

        Bitmap th = Bitmap.createScaledBitmap(bmp, 480, Math.max(1, bmp.getHeight() * 480 / bmp.getWidth()), true);
        ByteArrayOutputStream thb = new ByteArrayOutputStream();
        th.compress(Bitmap.CompressFormat.JPEG, 70, thb);
        String thumb = "data:image/jpeg;base64," + Base64.encodeToString(thb.toByteArray(), Base64.NO_WRAP);

        String boundary = "----gb" + System.nanoTime();
        URL url = new URL(API + "?nb-results=5&api-key=" + URLEncoder.encode(apiKey, "UTF-8"));
        HttpURLConnection c = (HttpURLConnection) url.openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        c.setDoOutput(true);
        c.setRequestMethod("POST");
        c.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
        try (OutputStream o = c.getOutputStream()) {
            o.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"organs\"\r\n\r\nauto\r\n").getBytes("UTF-8"));
            o.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"images\"; filename=\"p.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n").getBytes("UTF-8"));
            o.write(jpg.toByteArray());
            o.write(("\r\n--" + boundary + "--\r\n").getBytes("UTF-8"));
        }
        int code = c.getResponseCode();
        if (code != 200) return err(String.valueOf(code));
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        try (InputStream in = c.getInputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) body.write(buf, 0, n);
        }
        JSONObject out = new JSONObject();
        out.put("ok", true);
        out.put("thumb", thumb);
        out.put("data", new JSONObject(body.toString("UTF-8")));
        return out.toString();
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
