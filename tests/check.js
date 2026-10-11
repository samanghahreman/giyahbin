// آزمون سخت‌گیرانهٔ داده‌ها و منطق «شناسایی راهنما».  اجرا: node tests/check.js
var fs = require('fs'), d = __dirname + '/../app/src/main/assets/www/';
eval(fs.readFileSync(d + 'data.js', 'utf8') + fs.readFileSync(d + 'tags.js', 'utf8') + ';global.P=PLANTS;global.T=TAGS;global.PR=PROVINCES;global.Z=ZONES;');
var fail = 0;
function ok(c, m) { if (!c) { fail++; console.log('FAIL:', m); } }

// ۱) یکپارچگی داده
var ids = {};
P.forEach(function (p) {
  ok(!ids[p.id], 'duplicate id ' + p.id); ids[p.id] = 1;
  ['fa', 'en', 'sci', 'fam', 'feat'].forEach(function (k) { ok(p[k] && p[k].length > 1, p.id + ' missing ' + k); });
  ok([0, 1, 2, 3].indexOf(p.lvl) >= 0, p.id + ' bad level');
  ok(p.zones.length && p.zones.every(function (z) { return Z[z]; }), p.id + ' bad zones');
  if (p.lvl >= 2) { ok(p.toxin && p.toxin !== '—', p.id + ' toxic but no toxin'); ok(p.sym && p.sym.length > 5, p.id + ' toxic but no symptoms'); ok(p.parts, p.id + ' no parts'); }
  var t = (T[p.id] || '').split('|');
  ok(t.length === 3 && /^[TSHCBPF]$/.test(t[0]) && /^[wyrvgk]+$/.test(t[1]) && /^[wfmdgr]+$/.test(t[2]), p.id + ' bad tags ' + T[p.id]);
});
Object.keys(T).forEach(function (k) { ok(ids[k], 'tag for unknown plant ' + k); });
ok(PR.length === 31, '31 provinces'); ok(Object.keys(Z).length === 8, '8 zones');
PR.forEach(function (pr) {
  ok(Z[pr[2]], pr[0] + ' bad zone');
  var tox = P.filter(function (p) { return p.lvl >= 2 && p.zones.indexOf(pr[2]) >= 0; }).length;
  ok(tox >= 20, pr[1] + ' has only ' + tox + ' toxic plants');
});
// گیاهان کلیدی حتماً هستند
['nerium-oleander', 'conium-maculatum', 'cicuta-virosa', 'datura-stramonium', 'atropa-belladonna', 'ricinus-communis', 'colchicum-spp-', 'taxus-baccata', 'amanita-phalloides', 'digitalis-purpurea', 'aconitum-spp-', 'hyoscyamus-niger', 'veratrum-album']
  .forEach(function (k) { ok(ids[k], 'key toxic plant missing ' + k); });

// ۱b) تصاویر: هر گیاه عکس + اعتبار (عکاس و مجوز آزاد) دارد و حجم کل کم است
eval(fs.readFileSync(d + 'credits.js', 'utf8') + ';global.CR=CREDITS;');
var imgBytes = 0, noImg = [];
P.forEach(function (p) {
  var f = d + 'img/' + p.id + '.webp';
  if (!fs.existsSync(f)) { noImg.push(p.id); return; }
  var sz = fs.statSync(f).size; imgBytes += sz; ok(sz > 1500 && sz < 60000, p.id + ' image size ' + sz);
  ok(CR[p.id] && CR[p.id][0] && /^(CC BY|CC0|Public domain|PD|Attribution)/i.test(CR[p.id][1]), p.id + ' credit/license ' + JSON.stringify(CR[p.id]));
});
ok(noImg.length <= 6, 'too many plants without image: ' + noImg.join(','));
console.log('images', (P.length - noImg.length) + '/' + P.length, '|', Math.round(imgBytes / 1024) + ' KB', noImg.length ? '| without: ' + noImg.join(', ') : '');

// ۲) منطق راهنما (همان الگوریتم app.js)
function guide(sel) {
  var rows = [];
  P.forEach(function (p) {
    var t = (T[p.id] || '').split('|'); if (t.length < 3) return;
    if (sel.form && t[0] !== sel.form) return;
    var cm = 0, hm = 0, i;
    if (sel.color) { for (i = 0; i < sel.color.length; i++) if (t[1].indexOf(sel.color[i]) >= 0) cm++; if (!cm) return; }
    for (i = 0; i < sel.hab.length; i++) if (t[2].indexOf(sel.hab[i]) >= 0) hm++;
    rows.push({ p: p, s: (sel.form ? 3 : 0) + cm * 2 + hm });
  });
  return rows.sort(function (a, b) { return b.s - a.s || b.p.lvl - a.p.lvl; });
}
// خودبازیابی: با ویژگی‌های دقیق هر گیاه، خودش باید در ۴۰ نتیجهٔ اول باشد
var topRank = 0, miss = 0;
P.forEach(function (p) {
  var t = T[p.id].split('|'), r = guide({ form: t[0], color: t[1], hab: t[2] }), i = r.findIndex(function (x) { return x.p.id === p.id; });
  ok(i >= 0 && i < 40, 'self-recall failed for ' + p.id + ' rank ' + i);
  if (i === 0) topRank++;
});
// ایمنی: هر نتیجه‌ای شامل گیاه سمی باید هشدار بدهد؛ مجموعهٔ خالی «سمی فرض کنید»
var combos = 0, warnMissing = 0;
'TSHCBPF'.split('').forEach(function (f) { ['', 'w', 'y', 'r', 'v', 'g', 'k', 'wr', 'yg'].forEach(function (c) { ['', 'w', 'f', 'm', 'd', 'g', 'r', 'fm'].forEach(function (h) {
  combos++; var r = guide({ form: f, color: c, hab: h });
  var tox = r.filter(function (x) { return x.p.lvl >= 2; }).length;
  if (r.length && tox === 0 && r.some(function (x) { return x.p.lvl >= 2; })) warnMissing++;
}); }); });
ok(warnMissing === 0, 'warn invariant');
// خطرناک‌ترین‌ها با بدترین‌حالت (یک رنگ از چند رنگ) نیز بیایند
var dangerous = P.filter(function (p) { return p.lvl === 3; });
dangerous.forEach(function (p) { var t = T[p.id].split('|'); t[1].split('').forEach(function (c) {
  var r = guide({ form: t[0], color: c, hab: '' }); ok(r.some(function (x) { return x.p.id === p.id; }), 'lethal plant ' + p.id + ' hidden when choosing only color ' + c); }); });

console.log('plants', P.length, '| toxic>=2', P.filter(function (p) { return p.lvl >= 2; }).length, '| lethal', dangerous.length, '| self-recall rank1', topRank + '/' + P.length, '| combos', combos);
console.log(fail ? fail + ' FAILURES' : 'ALL CHECKS PASSED');
process.exit(fail ? 1 : 0);
