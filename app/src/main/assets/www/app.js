(function(){
"use strict";
var $=function(i){return document.getElementById(i)};
var TAG={3:"کشنده",2:"سمی",1:"کم‌خطر",0:"بی‌خطر"};
var LV={3:["بسیار خطرناک – کشنده","☠"],2:["سمی","⚠"],1:["کم‌خطر / تحریک‌کننده","!"],0:["بی‌خطر (با شناسایی قطعی)","✔"]};
var DANGER_FAM={Apiaceae:"خانوادهٔ چتریان (هویج، شوکران): چند گونهٔ آن کشنده است",Solanaceae:"خانوادهٔ بادمجانیان: بسیاری از گونه‌ها سمی‌اند",Ranunculaceae:"خانوادهٔ آلاله: بیشتر گونه‌ها سمی‌اند",Apocynaceae:"خانوادهٔ خرزهره: اغلب سمی",Euphorbiaceae:"خانوادهٔ فرفیون: شیره تحریک‌کننده/سمی",Araceae:"خانوادهٔ آروم: کریستال‌های سوزش‌آور",Papaveraceae:"خانوادهٔ خشخاش: آلکالوئیدهای سمی",Amaryllidaceae:"پیازدارها: برخی سمی و برخی خوراکی‌اند",Colchicaceae:"سورنجان: بسیار سمی",Melanthiaceae:"خانوادهٔ خربق: سمی",Amanitaceae:"قارچ‌های آمانیتا: بسیار خطرناک"};
var cur=null,tt;
function toast(m){var t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},4000)}

function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function norm(s){return String(s||"").toLowerCase().replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/[‌ً-ْ]/g,"").trim()}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}return null}
function zoneOf(pid){for(var i=0;i<PROVINCES.length;i++)if(PROVINCES[i][0]===pid)return PROVINCES[i][2];return ""}

/* ---------- لیست ---------- */
function fill(){
  var p=$("prov");
  PROVINCES.forEach(function(x){var o=document.createElement("option");o.value=x[0];o.textContent=x[1];p.appendChild(o)});
  p.value=ls("gb_prov")||"";
}
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
  var h="";
  rows.forEach(function(x){h+='<li class="l'+x.lvl+'" data-id="'+x.id+'"><div><b>'+esc(x.fa)+'</b><small>'+esc(x.sci.split(";")[0])+'</small></div><span class="tag t'+x.lvl+'">'+LV[x.lvl][1]+" "+TAG[x.lvl]+'</span></li>'});
  $("list").innerHTML=h||'<li>موردی پیدا نشد. اگر گیاه ناشناخته است، آن را سمی فرض کنید.</li>';
}

/* ---------- جزئیات ---------- */
function firstAid(l){
  if(l<1)return "";
  var s='<div class="card"><h4>اقدام اولیه</h4><ul style="list-style:disc;padding-right:18px"><li style="all:unset;display:list-item">گیاه را از دهان بیرون بیاورید و دهان را با آب بشویید.</li><li style="all:unset;display:list-item">بدون دستور پزشک استفراغ ندهید و شیر/ذغال ندهید.</li><li style="all:unset;display:list-item">نمونهٔ گیاه یا عکس آن را همراه ببرید.</li>';
  if(l>=2)s+='<li style="all:unset;display:list-item"><b>فوراً تماس: اورژانس <a href="tel:115">۱۱۵</a> یا مرکز مسمومیت <a href="tel:1490">۱۴۹۰</a>.</b></li>';
  return s+'</ul></div>';
}
function detail(x,extraBanner){
  var info=LV[x.lvl];
  var prov=PROVINCES.filter(function(p){return x.zones.indexOf(p[2])>=0}).map(function(p){return p[1]});
  var h='<button class="back">← بازگشت</button><h2 style="margin:4px 0">'+esc(x.fa)+'</h2><div class="sci">'+esc(x.sci)+" · "+esc(x.en)+" · "+esc(x.fam)+'</div>';
  h+='<div class="banner b'+x.lvl+'">'+info[1]+" "+info[0]+'</div>'+(extraBanner||"");
  function c(t,v){return v&&v!=="—"?'<div class="card"><h4>'+t+'</h4>'+esc(v)+'</div>':""}
  h+=c("شناسایی ظاهری",x.feat)+c("بخش‌های خطرناک / قابل استفاده",x.parts)+c("ماده مؤثر",x.toxin)+c("علائم / نکته",x.sym)+c("شبیه چه گیاهی است؟ (احتیاط)",x.look)+c("توصیه مسافران",x.extra);
  h+=firstAid(x.lvl);
  h+='<div class="card"><h4>پراکنش تقریبی (مناطق)</h4>'+(x.zones.length===8?"سراسر ایران":x.zones.map(function(z){return ZONES[z]}).join("، "))+'<div class="hint">استان‌ها: '+(prov.length===31?"همهٔ استان‌ها":prov.join("، "))+'</div></div>';
  $("detail").innerHTML=h;
  show("detail");
}
function show(id){["home","detail"].forEach(function(s){$(s).hidden=(s!==id)});window.scrollTo(0,0)}

/* ---------- تطبیق نتیجهٔ شناسایی ---------- */
function find(sci){
  var n=norm(sci),g=n.split(" ")[0],hit=null,rel=[];
  PLANTS.forEach(function(x){
    var names=[x.sci].concat(x.syn);
    names.forEach(function(s){
      var m=norm(s);
      if(m===n||(m.split(" ")[1]&&n.indexOf(m)===0))hit=x;
      else if(m.split(" ")[0]===g&&rel.indexOf(x)<0)rel.push(x);
    });
  });
  return {hit:hit,rel:rel};
}
function analyse(res){
  var out=[],worst=-1;
  res.slice(0,3).forEach(function(r,i){
    var sn=r.species.scientificNameWithoutAuthor,f=find(sn),fam=r.species.family&&r.species.family.scientificNameWithoutAuthor;
    var lvl=-1,kind="none",plant=f.hit;
    if(f.hit){lvl=f.hit.lvl;kind="exact"}
    else if(f.rel.length){plant=f.rel.slice().sort(function(a,b){return b.lvl-a.lvl})[0];lvl=plant.lvl;kind="genus"}
    if(r.score>=0.1&&lvl>worst){worst=lvl;}
    out.push({r:r,plant:plant,lvl:lvl,kind:kind,fam:fam,i:i});
  });
  return {rows:out,worst:worst};
}
function showAlert(lvl,name,note){
  var a=$("alert");
  a.style.background=lvl>=3?"":"var(--o)";
  a.innerHTML='<div class="x">'+(lvl>=3?"☠":"⚠")+'</div><h2>'+(lvl>=3?"خطر! گیاه بسیار سمی":"هشدار! گیاه سمی")+'</h2><p style="font-size:19px"><b>'+esc(name)+'</b></p><p>'+esc(note)+'</p><p>به آن دست نزنید، نخورید و کودکان و حیوانات را دور کنید. در صورت خوردن یا تماس: اورژانس <a href="tel:115">۱۱۵</a> · مرکز مسمومیت <a href="tel:1490">۱۴۹۰</a></p><button id="okAl">فهمیدم</button>';
  a.hidden=false;
  try{if(navigator.vibrate)navigator.vibrate([300,150,300])}catch(e){}
  $("okAl").onclick=function(){a.hidden=true};
}
function result(thumb,data){
  var an=analyse(data.results||[]);
  if(!an.rows.length){noID(thumb);return}
  var top=an.rows[0],sp=top.r.species,pct=Math.round(top.r.score*100);
  var name=top.plant?top.plant.fa:((sp.commonNames&&sp.commonNames[0])||sp.scientificNameWithoutAuthor);
  var lowConf=top.r.score<0.3;
  var h='<button class="back">← بازگشت</button><img class="thumb" src="'+esc(thumb)+'" alt="">';
  h+='<h2 style="margin:6px 0">'+esc(name)+'</h2><div class="sci">'+esc(sp.scientificNameWithoutAuthor)+' · '+esc(top.fam||"")+' · اطمینان '+pct+'%</div>';
  var w=an.worst;
  if(w>=2)h+='<div class="banner b'+(w>=3?3:2)+'">'+LV[w][1]+' '+(w>=3?"بسیار خطرناک – کشنده":"سمی")+(top.lvl<w?" (در میان نتایج محتمل)":"")+(top.kind==="genus"?" (هم‌جنس با گونهٔ سمی)":"")+'</div>';
  else if(top.lvl===1)h+='<div class="banner b1">! کم‌خطر / تحریک‌کننده</div>';
  else if(top.lvl===0&&!lowConf)h+='<div class="banner b0">✔ در پایگاه داده بی‌خطر است – اما قبل از خوردن حتماً با کارشناس مطمئن شوید</div>';
  else h+='<div class="banner b2">؟ در پایگاه داده نیست – آن را سمی فرض کنید</div>';
  if(lowConf)h+='<div class="banner b2">اطمینان شناسایی پایین است. عکس واضح‌تر از برگ/گل بگیرید و تا اطمینان، <b>سمی فرض کنید</b>.</div>';
  if(top.kind==="none"&&top.fam&&DANGER_FAM[top.fam])h+='<div class="card"><h4>هشدار خانواده</h4>'+esc(DANGER_FAM[top.fam])+'</div>';
  if(top.plant){
    var p=top.plant;
    function c(t,v){return v&&v!=="—"?'<div class="card"><h4>'+t+'</h4>'+esc(v)+'</div>':""}
    h+=c("ماده مؤثر",p.toxin)+c("علائم / نکته",p.sym)+c("ظاهر",p.feat)+c("توصیه مسافران",p.extra)+firstAid(p.lvl);
    h+='<button class="alt" data-id="'+p.id+'">جزئیات کامل ›</button>';
  }
  h+='<div class="card"><h4>گزینه‌های دیگر</h4>';
  an.rows.slice(1).forEach(function(o){
    var nm=o.plant?o.plant.fa:o.r.species.scientificNameWithoutAuthor;
    h+='<div class="res"><span>'+esc(nm)+'</span><span class="pct">'+Math.round(o.r.score*100)+'%'+(o.lvl>=2?' ⚠':'')+'</span></div>';
  });
  h+='</div><p class="disc">نتیجه تخمینی است و جایگزین نظر متخصص نیست. نیرو گرفته از Pl@ntNet.</p>';
  $("detail").innerHTML=h;show("detail");
  if(w>=2&&an.rows.some(function(o){return o.r.score>=0.1&&o.lvl===w}))showAlert(w,name,top.lvl>=2?(top.plant?top.plant.sym:""):"یکی از نتایج محتمل سمی است.");
}
function noID(thumb){
  $("detail").innerHTML='<button class="back">← بازگشت</button>'+(thumb?'<img class="thumb" src="'+esc(thumb)+'" alt="">':"")+'<div class="banner b2">گیاهی تشخیص داده نشد. از نزدیک‌تر و در نور خوب از برگ یا گل عکس بگیرید. تا اطمینان، آن را سمی فرض کنید.</div>';
  show("detail");
}

/* ---------- ارتباط با اندروید ---------- */
window.onIdResult=function(s){
  $("busy").hidden=true;
  var r;try{r=JSON.parse(s)}catch(e){return}
  if(r.cancel)return;
  if(!r.ok){
    var m={nokey:"شناسایی با عکس فعلاً فعال نیست.",net:"اینترنت در دسترس نیست. می‌توانید از فهرست آفلاین گیاهان استفاده کنید.",404:"گیاهی در عکس پیدا نشد.",401:"سرویس شناسایی موقتاً در دسترس نیست. فهرست آفلاین را ببینید.",429:"سهمیهٔ امروز شناسایی تمام شد. فردا دوباره امتحان کنید.",app:"برنامهٔ دوربین/گالری در دسترس نیست.",img:"خواندن عکس ممکن نشد."}[r.err]||("خطا: "+r.err);
    toast(m);return;
  }
  result(r.thumb,r.data);
};
function go(src){
  if(!(window.Native&&window.Native.hasKey&&window.Native.hasKey())){toast("شناسایی با عکس فعلاً فعال نیست؛ از فهرست آفلاین استفاده کنید");return}
  $("busy").hidden=false;window.Native.identify(src,"");
}
/* ---------- رویدادها ---------- */
document.addEventListener("click",function(e){
  var t=e.target;
  if(t.classList&&t.classList.contains("back")){show("home");return}
  var li=t.closest&&t.closest("[data-id]");
  if(li){var x=PLANTS.filter(function(p){return p.id===li.getAttribute("data-id")})[0];if(x)detail(x)}
});
$("btnCam").onclick=function(){go("camera")};
$("btnGal").onclick=function(){go("gallery")};
$("prov").onchange=render;$("lvl").onchange=render;
$("q").oninput=render;
$("ver").textContent="گیاه‌بین · "+PLANTS.length+" گیاه · "+PROVINCES.length+" استان";
window.gbBack=function(){
  if(!$("alert").hidden){$("alert").hidden=true;return true}
  if(!$("busy").hidden)return true;
  if(!$("home").hidden)return false;
  show("home");return true;
};
fill();render();
})();
