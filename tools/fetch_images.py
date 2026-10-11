"""دریافت عکس گیاهان از ویکی‌پدیا/ویکی‌مدیا کامنز (فقط مجوزهای آزاد) + ثبت نام عکاس و مجوز.
اجرا (یک‌بار، موقع توسعه):  python tools/fetch_images.py
خروجی: app/src/main/assets/www/img/<id>.webp  و  credits.js
"""
import io, json, os, re, sys, time, html, urllib.parse, urllib.request
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
WWW = os.path.join(ROOT, 'app/src/main/assets/www')
IMG = os.path.join(WWW, 'img')
UA = {'User-Agent': 'GiyahbinBuild/1.0 (https://github.com/samanghahreman/giyahbin; open-source plant safety app)'}
OK_LIC = re.compile(r'^(CC BY(-SA)? [0-9.]+|CC BY(-SA)?( 4\.0)?|CC0.*|Public domain.*|PD.*|Attribution.*|.*public domain.*)$', re.I)
BAD_NAME = re.compile(r'map|range|distribution|icon|symbol|logo|commons-|wiki|flag|locator|edit|question|ambox|portal|\.svg|diagram|chart|drawing|plate|herbarium', re.I)
# بدون عکس (عکس مناسب پیدا نشد): castanea-sativa, astragalus-spp-
SKIP_LEAD = {'castanea-sativa', 'chrysanthemum-spp-'}  # عکس اول صفحه نامناسب است (سکه / جوانه)
OVERRIDE = {'chrysanthemum-spp-': 'Chrysanthemum × morifolium', 'narcissus-spp-': 'Narcissus (plant)', 'daphne-mucronata': 'Daphne (plant)', 'iris-spp-': 'Iris (plant)', 'astragalus-spp-': 'Astragalus', 'thymus-kotschyanus': 'Thymus vulgaris', 'prunus-dulcis-var-amara': 'Bitter almond', 'solanum-lycopersicum': 'Tomato', 'ficus-elastica': 'Ficus elastica',
            'amanita-muscaria': 'Amanita muscaria', 'papaver-rhoeas': 'Papaver rhoeas', 'aloe-vera': 'Aloe vera',
            'cycas-revoluta': 'Cycas revoluta', 'sansevieria-trifasciata': 'Dracaena trifasciata', 'lolium-temulentum': 'Lolium temulentum'}

def api(base, **p):
    p.update(format='json')
    url = base + '?' + urllib.parse.urlencode(p)
    for _ in range(4):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
        except Exception:
            time.sleep(2)
    return {}

def title_of(p):
    if p['id'] in OVERRIDE: return OVERRIDE[p['id']]
    names = [p['sci']] + p['syn']
    for n in names:
        w = n.split()
        if len(w) == 2 and w[1] != 'spp.' and re.match(r'^[a-z\-]+$', w[1]): return n
    return names[0].split()[0]

def file_info(fname):
    d = api('https://commons.wikimedia.org/w/api.php', action='query', titles='File:' + fname, prop='imageinfo',
            iiprop='extmetadata|url|mime', iiurlwidth=520)
    pg = next(iter(d.get('query', {}).get('pages', {}).values()), {})
    ii = (pg.get('imageinfo') or [None])[0]
    if not ii: return None
    m = ii.get('extmetadata', {})
    lic = html.unescape(re.sub('<[^>]+>', '', m.get('LicenseShortName', {}).get('value', '')))
    art = html.unescape(re.sub('<[^>]+>', '', m.get('Artist', {}).get('value', ''))).strip() or 'Wikimedia Commons'
    if not OK_LIC.match(lic) or ii.get('mime') not in ('image/jpeg', 'image/png'): return None
    return {'lic': lic, 'artist': art[:80], 'url': ii.get('thumburl') or ii['url'], 'file': fname}

def find(p):
    t = title_of(p)
    d = api('https://en.wikipedia.org/w/api.php', action='query', titles=t, redirects=1, prop='pageimages', piprop='name')
    pg = next(iter(d.get('query', {}).get('pages', {}).values()), {})
    cands = []
    if pg.get('pageimage') and p['id'] not in SKIP_LEAD: cands.append(pg['pageimage'])
    d2 = api('https://en.wikipedia.org/w/api.php', action='query', titles=t, redirects=1, prop='images', imlimit=40)
    pg2 = next(iter(d2.get('query', {}).get('pages', {}).values()), {})
    for im in pg2.get('images', []):
        n = im['title'].replace('File:', '').replace(' ', '_')
        if n not in cands and not BAD_NAME.search(n): cands.append(n)
    for n in cands[:14]:
        r = file_info(n)
        if r: return r
    return None

def main():
    os.makedirs(IMG, exist_ok=True)
    src = open(os.path.join(WWW, 'data.js'), encoding='utf-8').read()
    # استخراج ساده از data.js با node
    import subprocess
    js = "eval(require('fs').readFileSync(process.argv[1],'utf8')+';console.log(JSON.stringify(PLANTS))')"
    plants = json.loads(subprocess.check_output(['node', '-e', js, os.path.join(WWW, 'data.js')]))
    credits, missing = {}, []
    only = set(sys.argv[1:])
    for p in plants:
        if only and p['id'] not in only: continue
        out = os.path.join(IMG, p['id'] + '.webp')
        r = find(p)
        if not r: missing.append(p['id']); print('MISSING', p['id']); continue
        try:
            raw = urllib.request.urlopen(urllib.request.Request(r['url'], headers=UA), timeout=40).read()
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            im.thumbnail((360, 360 * 3 // 4 + 60))
            im.save(out, 'WEBP', quality=66, method=6)
            credits[p['id']] = [r['artist'], r['lic'], r['file']]
            print('ok', p['id'], os.path.getsize(out) // 1024, 'KB', r['lic'])
        except Exception as e:
            missing.append(p['id']); print('ERR', p['id'], e)
        time.sleep(0.3)
    cj = os.path.join(WWW, 'credits.js')
    old = {}
    if only and os.path.exists(cj):
        old = json.loads(re.search(r'=(\{.*\});', open(cj, encoding='utf-8').read(), re.S).group(1))
    old.update(credits)
    open(cj, 'w', encoding='utf-8').write('/* عکس‌ها: ویکی‌مدیا کامنز؛ [عکاس، مجوز، نام فایل] */\nvar CREDITS=' + json.dumps(old, ensure_ascii=False, indent=0) + ';\n')
    print('done', len(old), 'images; missing:', missing)

if __name__ == '__main__':
    main()
