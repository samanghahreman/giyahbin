(function(){
"use strict";
var $=function(i){return document.getElementById(i)};
var LV={3:["بسیار خطرناک – کشنده","☠"],2:["سمی","⚠"],1:["کم‌خطر / تحریک‌کننده","!"],0:["بی‌خطر (با شناسایی قطعی)","✔"]};
var TAG={3:"کشنده",2:"سمی",1:"کم‌خطر",0:"بی‌خطر"};
var CALLS='<div class="calls"><a class="call" href="tel:115"><span>📞 اورژانس</span><b>۱۱۵</b></a><a class="call" href="tel:1490"><span>☎ مرکز مسمومیت</span><b>۱۴۹۰</b></a></div>';
var Q=[
 ["form","۱) نوع گیاه چیست؟",[["T","🌳 درخت"],["S","🌿 درختچه"],["H","🌱 علف/بوته"],["C","🪴 پیچ و بالارونده"],["B","🧅 پیازدار"],["P","🏠 آپارتمانی/زینتی"],["F","🍄 قارچ"]]],
 ["color","۲) رنگ گل یا میوه؟ (چند مورد ممکن)",[["w","⚪ سفید"],["y","🟡 زرد/نارنجی"],["r","🔴 قرمز/صورتی"],["v","🟣 بنفش/آبی"],["g","🟢 سبز/بدون گل"],["k","⚫ سیاه/قهوه‌ای"]]],
 ["hab","۳) کجا دیدید؟ (اختیاری)",[["w","💧 کنار آب"],["f","🌲 جنگل"],["m","⛰ کوه/مرتع"],["d","🏜 بیابان"],["g","🏡 باغ/خانه"],["r","🛣 کنار جاده/زمین رها"]]]
];
var sel={form:"",color:"",hab:""},thumb="",tt;

function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function norm(s){return String(s||"").toLowerCase().replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/[‌ً-ْ]/g,"").trim()}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}return null}
function zoneOf(pid){for(var i=0;i<PROVINCES.length;i++)if(PROVINCES[i][0]===pid)return PROVINCES[i][2];return ""}
function toast(m){var t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},4000)}
function show(id){["home","detail","consent","guide"].forEach(function(s){$(s).hidden=(s!==id)});window.scrollTo(0,0)}

/* ---------- فهرست ---------- */
function fill(){
  var p=$("prov");
  PROVINCES.forEach(function(x){var o=document.createElement("option");o.value=x[0];o.textContent=x[1];p.appendChild(o)});
  p.value=ls("gb_prov")||"";
}
function row(x){return '<li class="l'+x.lvl+'" data-id="'+x.id+'"><div><b>'+esc(x.fa)+'</b><small>'+esc(x.sci.split(";")[0])+'</small></div><span class="tag t'+x.lvl+'">'+LV[x.lvl][1]+" "+TAG[x.lvl]+'</span></li>'}
function render(){
  var pv=$("prov").value,lv=$("lvl").value,q=norm($("q").value);
  ls("gb_prov",pv);
  var z=pv?zoneOf(pv):"";
  var rows=PLANTS.filter(function(x){
    if(z&&x.zones.indexOf(z)<0)return false;
    if(lv==="d"&&x.lvl<2)return false;
    if(lv==="s"&&x.lvl>0)return false;
    if(q&&norm(x.fa+" "+x.en+" "+x.sci+" "+x.syn.join(" ")).indexOf(q)<0)return false;
    return true;
  }).sort(function(a,b){return b.lvl-a.lvl||a.fa.localeCompare(b.fa,"fa")});
  var n=rows.filter(function(x){return x.lvl>=2}).length;
  $("hint").textContent=rows.length+" گیاه"+(z?" · "+n+" مورد سمی در منطقهٔ «"+ZONES[z]+"» (پراکنش تقریبی)":"");
  $("list").innerHTML=rows.map(row).join("")||'<li>موردی پیدا نشد. اگر گیاه ناشناخته است، آن را سمی فرض کنید.</li>';
}

/* ---------- جزئیات ---------- */
function firstAid(l){
  if(l<1)return "";
  var s='<div class="card"><h4>اقدام اولیه</h4><ul class="rules"><li>گیاه را از دهان بیرون بیاورید و دهان را با آب بشویید.</li><li>بدون دستور پزشک استفراغ ندهید و شیر/ذغال ندهید.</li><li>نمونهٔ گیاه یا عکس آن را همراه ببرید.</li></ul>';
  if(l>=2)s+='<p class="sosT">در صورت خوردن یا تماس، فوراً تماس بگیرید</p>'+CALLS;
  return s+'</div>';
}
function card(t,v){return v&&v!=="—"?'<div class="card"><h4>'+t+'</h4>'+esc(v)+'</div>':""}
function detail(x,from){
  var info=LV[x.lvl];
  var prov=PROVINCES.filter(function(p){return x.zones.indexOf(p[2])>=0}).map(function(p){return p[1]});
  var h='<button class="back" data-to="'+(from||"home")+'">← بازگشت</button><h2 style="margin:4px 0">'+esc(x.fa)+'</h2><div class="sci">'+esc(x.sci)+" · "+esc(x.en)+" · "+esc(x.fam)+'</div>';
  h+='<div class="banner b'+x.lvl+'">'+info[1]+" "+info[0]+'</div>';
  h+=card("شناسایی ظاهری",x.feat)+card("بخش‌های خطرناک / قابل استفاده",x.parts)+card("ماده مؤثر",x.toxin)+card("علائم / نکته",x.sym)+card("شبیه چه گیاهی است؟ (احتیاط)",x.look)+card("توصیه مسافران",x.extra);
  h+=firstAid(x.lvl);
  h+='<div class="card"><h4>پراکنش تقریبی (مناطق)</h4>'+(x.zones.length===8?"سراسر ایران":x.zones.map(function(z){return ZONES[z]}).join("، "))+'<div class="hint">استان‌ها: '+(prov.length===31?"همهٔ استان‌ها":prov.join("، "))+'</div></div>';
  $("detail").innerHTML=h;
  show("detail");
}

/* ---------- شناسایی راهنما (کاملاً آفلاین) ---------- */
function openGuide(th){
  thumb=th||"";sel={form:"",color:"",hab:""};
  var h='<button class="back">← بازگشت</button><h2 style="margin:4px 0">این گیاه چه شکلی است؟</h2>';
  if(thumb)h+='<img class="thumb" src="'+esc(thumb)+'" alt="">';
  h+='<p class="hint">عکس فقط روی گوشی شما می‌ماند و برای مقایسه است. چند ویژگی را انتخاب کنید تا گیاهان مشابه (و سمی بودنشان) نشان داده شود. <b>این روش دقیق نیست.</b></p>';
  Q.forEach(function(q){
    h+='<div class="card"><h4>'+q[1]+'</h4><div class="chips" data-q="'+q[0]+'">';
    q[2].forEach(function(o){h+='<button class="chip" data-v="'+o[0]+'">'+o[1]+'</button>'});
    h+='</div></div>';
  });
  h+='<div id="gres"></div>';
  $("guide").innerHTML=h;show("guide");guideRes();
}
function guideRes(){
  var z=$("prov").value?zoneOf($("prov").value):"";
  if(!(sel.form||sel.color||sel.hab)){$("gres").innerHTML='<p class="hint">یک یا چند ویژگی را انتخاب کنید…</p>';return}
  var rows=[];
  PLANTS.forEach(function(p){
    var t=(TAGS[p.id]||"").split("|");if(t.length<3)return;
    if(sel.form&&t[0]!==sel.form)return;
    var cm=0,hm=0,i;
    if(sel.color){for(i=0;i<sel.color.length;i++)if(t[1].indexOf(sel.color[i])>=0)cm++;if(!cm)return}
    for(i=0;i<sel.hab.length;i++)if(t[2].indexOf(sel.hab[i])>=0)hm++;
    rows.push({p:p,s:(sel.form?3:0)+cm*2+hm+(z&&p.zones.indexOf(z)>=0?1:0)});
  });
  rows.sort(function(a,b){return b.s-a.s||b.p.lvl-a.p.lvl});
  var tox=rows.filter(function(r){return r.p.lvl>=2}).length,h="";
  if(!rows.length)h='<div class="banner b2">گیاه مشابهی در فهرست پیدا نشد. <b>آن را سمی فرض کنید</b> و دست نزنید و نخورید.</div>';
  else{
    h+='<div class="banner b'+(tox?3:1)+'">'+(tox?"☠ "+tox+" مورد از "+rows.length+" گیاه مشابه سمی/خطرناک است؛ تا اطمینان کامل، آن را سمی فرض کنید.":"! مشابه‌ها بی‌خطر یا کم‌خطرند، اما به‌هیچ‌وجه به خوردنش اطمینان نکنید.")+'</div>';
    if(tox)h+=CALLS;
    h+='<ul>'+rows.slice(0,40).map(function(r){return row(r.p)}).join("")+'</ul>';
    if(rows.length>40)h+='<p class="hint">+'+(rows.length-40)+' مورد دیگر؛ ویژگی‌های بیشتری انتخاب کنید.</p>';
  }
  $("gres").innerHTML=h+'<p class="disc">نتیجه بر پایهٔ ویژگی‌های انتخابی شماست و تخمینی است؛ جایگزین نظر کارشناس نیست.</p>';
}

/* ---------- ارتباط با اندروید ---------- */
window.onPhoto=function(s){
  $("busy").hidden=true;
  var r;try{r=JSON.parse(s)}catch(e){return}
  if(r.cancel)return;
  if(!r.ok){toast(r.err==="app"?"برنامهٔ دوربین/گالری در دسترس نیست.":"خواندن عکس ممکن نشد.");return}
  openGuide(r.thumb);
};
function go(src){
  if(window.Native&&window.Native.photo){$("busy").hidden=false;window.Native.photo(src)}
  else openGuide("");
}

/* ---------- رویدادها ---------- */
document.addEventListener("click",function(e){
  var t=e.target;if(!t.closest)return;
  var bk=t.closest(".back");
  if(bk){show(bk.getAttribute("data-to")||"home");return}
  var chip=t.closest(".chip");
  if(chip){
    var q=chip.parentNode.getAttribute("data-q"),v=chip.getAttribute("data-v");
    if(q==="form")sel.form=(sel.form===v?"":v);
    else sel[q]=sel[q].indexOf(v)>=0?sel[q].replace(v,""):sel[q]+v;
    var cur=sel[q];
    [].forEach.call(chip.parentNode.children,function(c){c.classList.toggle("on",cur.indexOf(c.getAttribute("data-v"))>=0)});
    guideRes();return;
  }
  var li=t.closest("[data-id]");
  if(li){var x=PLANTS.filter(function(p){return p.id===li.getAttribute("data-id")})[0];if(x)detail(x,$("guide").hidden?"home":"guide")}
});
$("btnCam").onclick=function(){go("camera")};
$("btnGal").onclick=function(){go("gallery")};
$("prov").onchange=render;$("lvl").onchange=render;$("q").oninput=render;
$("agree").onchange=function(){$("goOn").disabled=!this.checked};
$("goOn").onclick=function(){if($("agree").checked){ls("gb_ok1","1");show("home")}};
$("quit").onclick=function(){if(window.Native&&window.Native.close)window.Native.close()};
window.gbBack=function(){
  if(!$("consent").hidden)return false;
  if(!$("busy").hidden)return true;
  if(!$("detail").hidden){show(from_guide()?"guide":"home");return true}
  if(!$("home").hidden)return false;
  show("home");return true;
};
function from_guide(){return !!$("gres")&&sel&&(sel.form||sel.color||sel.hab)}
$("ver").textContent="گیاه‌بین · "+PLANTS.length+" گیاه · "+PROVINCES.length+" استان · کاملاً آفلاین";
fill();render();
show(ls("gb_ok1")==="1"?"home":"consent");
})();
