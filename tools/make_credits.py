"""ساخت صفحهٔ اعتبار تصاویر: docs/credits.html و data/CREDITS.md از credits.js"""
import json, re, os, subprocess, html
R = os.path.join(os.path.dirname(__file__), '..'); W = R + '/app/src/main/assets/www/'
cr = json.loads(re.search(r'=(\{.*\});', open(W + 'credits.js', encoding='utf-8').read(), re.S).group(1))
pl = json.loads(subprocess.check_output(['node', '-e', "eval(require('fs').readFileSync(process.argv[1],'utf8')+';console.log(JSON.stringify(PLANTS))')", W + 'data.js']))
rows = [(p['fa'], p['sci'].split(';')[0], *cr[p['id']], ) for p in pl if p['id'] in cr]
def url(f): return 'https://commons.wikimedia.org/wiki/File:' + f
md = ['# اعتبار تصاویر / Image credits', '', 'تصاویر از [Wikimedia Commons](https://commons.wikimedia.org) با مجوزهای آزاد (CC BY، CC BY-SA، CC0، مالکیت عمومی). برای هر تصویر پیوند صفحهٔ اصلی آمده است.', '', '| گیاه | گونه | عکاس | مجوز | منبع |', '|---|---|---|---|---|']
for fa, sci, a, l, f in rows: md.append('| %s | *%s* | %s | %s | [فایل](%s) |' % (fa, sci, a.replace('|', '/'), l, url(f)))
open(R + '/data/CREDITS.md', 'w', encoding='utf-8').write('\n'.join(md) + '\n')
h = ['<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>اعتبار تصاویر گیاه‌بین</title><style>body{font:15px/1.8 system-ui,Tahoma,sans-serif;max-width:900px;margin:auto;padding:16px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:right}a{color:#1b5e3b}</style></head><body><h1>اعتبار تصاویر</h1><p>تصاویر از <a href="https://commons.wikimedia.org">Wikimedia Commons</a> با مجوزهای آزاد است. <a href="./">بازگشت به سایت</a></p><table><tr><th>گیاه</th><th>گونه</th><th>عکاس</th><th>مجوز</th><th>منبع</th></tr>']
for fa, sci, a, l, f in rows: h.append('<tr><td>%s</td><td><i>%s</i></td><td>%s</td><td>%s</td><td><a href="%s">فایل</a></td></tr>' % (html.escape(fa), html.escape(sci), html.escape(a), html.escape(l), url(f)))
h.append('</table></body></html>')
open(R + '/docs/credits.html', 'w', encoding='utf-8').write(''.join(h))
print(len(rows), 'credits written')
