/* shared/booking.js —— 客户自助预约页（booking.html）的界面与流程（2026-10-06·B）
   三个入口共用一个页面：
   ① 室长发的预约链接  ?ph=占位ID  → 带入占位的时间/手机号/来访目的，从"验证手机"开始，第 1 步时间可改选；占位超时后链接仍有效
   ② 官网自助（无参数）          → 从第 1 步开始
   ③ 到店自己填      ?walkin=1   → 跳过第 1 步（时间 = 现在），提交后 IN 端由室长点［已到店］
   ④ 客人端查看/取消/重新预约  ?view=Case编号（确认/提醒短信里的网址）→ 手机验证 → 预约信息、［取消预约］、［重新预约］
   语言：印尼文 / 中文（右上角切换，记在浏览器里，词典在 i18n.js 的 BOOK_DICT）。规则和数据函数在 data.js（submitSelfBooking 等）。 */
var BK = null;
var BK_STEPS = ['time','phone','profile','purpose','health','consent','confirm'];

function bkH(s){ return String(s===undefined||s===null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
function bkDayLabel(ds){
  var d = new Date(ds+'T00:00:00'), dow = d.getDay();
  var names = BOOK_LANG==='zh' ? ['日','一','二','三','四','五','六'] : ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  return {dow:names[dow], day:d.getDate(), mon:(BOOK_LANG==='zh' ? (d.getMonth()+1)+'月' : ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()])};
}
function bkTimeText(date, time){ var l = bkDayLabel(date); return (BOOK_LANG==='zh' ? l.mon+l.day+'日（周'+l.dow+'）' : l.dow+', '+l.day+' '+l.mon)+' '+time; }

function bkInit(){
  var q = new URLSearchParams(location.search), lang = null;
  try{ lang = localStorage.getItem('gmc_book_lang'); }catch(e){}
  BOOK_LANG = (q.get('lang')==='zh' || q.get('lang')==='id') ? q.get('lang') : (lang==='zh' ? 'zh' : 'id');
  BK = {entry:'web', step:0, f:{date:'', time:'', phone:'', name:'', gender:'女', dob:'', history:'', beautyHistory:'', purpose:'面诊商谈', note:'', c1:false, c2:false, phId:null, rebookFrom:null},
        err:'', otp:null, verified:false, phoneLocked:false, client:null, mismatch:false, done:null, dayPick:null, view:null};
  if(q.get('view')){ BK.entry = 'view'; BK.view = {caseNo:q.get('view'), stage:'phone'}; }
  else if(q.get('walkin')){
    BK.entry = 'walkin'; var cs = currentSlotNow(); BK.f.date = cs.date; BK.f.time = cs.time;
    if(q.get('phone')) BK.f.phone = q.get('phone');
    if(q.get('purpose')) BK.f.purpose = q.get('purpose');
    BK.step = 1; /* 跳过选时间 */
  } else if(q.get('ph')){
    BK.entry = 'link'; var p = findPlaceholder(q.get('ph'));
    if(p){ BK.f.phId = p.ph.id; BK.f.date = p.ph.date; BK.f.time = p.ph.time; BK.f.phone = p.ph.phone; BK.f.purpose = p.ph.purpose || '面诊商谈'; BK.phoneLocked = true; BK.step = 1; BK.phLive = p.live; }
  } else if(q.get('date') && q.get('time')){ BK.f.date = q.get('date'); BK.f.time = q.get('time'); }
  bkRender();
}
function bkSetLang(l){ BOOK_LANG = l; try{ localStorage.setItem('gmc_book_lang', l); }catch(e){} bkRender(); }

function bkRender(){
  var root = document.getElementById('bk-root'); if(!root) return;
  document.documentElement.lang = BOOK_LANG;
  document.getElementById('bk-sub').textContent = bt('brand.sub');
  ['id','zh'].forEach(function(l){ document.getElementById('lang-'+l).className = BOOK_LANG===l ? 'on' : ''; });
  if(BK.entry==='view' && typeof bkRenderView === 'function') root.innerHTML = bkRenderView();
  else if(BK.done && typeof bkRenderDone === 'function') root.innerHTML = bkRenderDone();
  else root.innerHTML = bkRenderStep();
  window.scrollTo(0, 0);
}

/* ---- 步骤框架 ---- */
function bkStepList(){ return BK_STEPS.filter(function(s){ return !(s==='time' && BK.entry==='walkin') && !(s==='phone' && BK.verified); }); }
function bkFrame(titleKey, bodyHtml){
  var list = bkStepList(), cur = list.indexOf(BK_STEPS[BK.step]);
  var banner = '';
  if(BK.entry==='walkin') banner = '<div class="bk-info">'+bt('entry.walkin', {time:BK.f.time})+'</div>';
  else if(BK.entry==='link' && BK.step>0) banner = '<div class="bk-info">'+bt('entry.link', {time:bkTimeText(BK.f.date, BK.f.time)})+' · <a href="#" onclick="bkGo(0);return false;" style="color:var(--navy);font-weight:700;">'+bt('entry.change')+'</a></div>';
  return '<div class="bk-card"><div class="bk-step">'+bt('step.of', {n:cur+1, total:list.length})+'</div><div class="bk-bar"><span style="width:'+Math.round((cur+1)*100/list.length)+'%;"></span></div>'+
    banner+'<div class="bk-title">'+bt(titleKey)+'</div>'+bodyHtml+'</div>';
}
function bkGo(i){ BK.step = i; BK.err = ''; bkRender(); }
function bkNextStep(){ var i = BK.step + 1; while(i < BK_STEPS.length && ((BK_STEPS[i]==='phone' && BK.verified) || (BK_STEPS[i]==='time' && BK.entry==='walkin'))) i++; bkGo(i); }
function bkPrevStep(){ var i = BK.step - 1; while(i > 0 && ((BK_STEPS[i]==='phone' && BK.verified) || (BK_STEPS[i]==='time' && BK.entry==='walkin'))) i--; if(i<0) i = 0; bkGo(i); }
function bkNav(nextHandler, showBack){
  return (BK.err ? '<div class="bk-err">'+bkH(BK.err)+'</div>' : '')+
    '<button class="bk-btn" onclick="'+nextHandler+'">'+bt(nextHandler==='bkSubmit()' ? 'btn.submit' : 'btn.next')+'</button>'+
    (showBack ? '<button class="bk-btn ghost" onclick="bkPrevStep()">'+bt('btn.back')+'</button>' : '');
}
function bkRenderStep(){
  var s = BK_STEPS[BK.step];
  var fn = {time:bkStepTime, phone:window.bkStepPhone, profile:window.bkStepProfile, purpose:window.bkStepPurpose, health:window.bkStepHealth, consent:window.bkStepConsent, confirm:window.bkStepConfirm}[s];
  return fn ? fn() : '';
}

/* ---- 第 1 步：选时间（读诊所设定：营业时间、可预约时段、午休、休诊日；额满的时段不能选） ---- */
function bkStepTime(){
  var days = [], d0 = new Date(demoNow().getFullYear(), demoNow().getMonth(), demoNow().getDate());
  for(var i=0;i<21;i++){ var d = new Date(d0); d.setDate(d0.getDate()+i); days.push(dateStr(d)); }
  var pick = BK.dayPick || BK.f.date || days[0];
  if(days.indexOf(pick) < 0) pick = days[0];
  BK.dayPick = pick;
  var dayHtml = days.map(function(ds){
    var l = bkDayLabel(ds), closed = isRescheduleDateDisabled(new Date(ds+'T00:00:00'));
    return '<div class="bk-day'+(ds===pick?' on':'')+(closed?' off':'')+'"'+(closed?'':' onclick="bkPickDay(\''+ds+'\')"')+'>'+l.dow+'<b>'+l.day+'</b>'+l.mon+(closed?'<br><small>'+bt('time.closed')+'</small>':'')+'</div>';
  }).join('');
  var slotHtml = slotsBetween(CLINIC_SETTINGS.bookFrom, minToTime(timeToMin(CLINIC_SETTINGS.bookTo)+SLOT_MIN)).map(function(t){
    var why = slotBlockReason(pick, t, BK.f.phId), on = (BK.f.date===pick && BK.f.time===t);
    if(why==='past') return '';
    var tag = why==='full' ? bt('time.full') : why==='lunch' ? bt('time.lunch') : '';
    return '<div class="bk-slot'+(on?' on':'')+(why?' off':'')+'"'+(why?'':' onclick="bkPickSlot(\''+pick+'\',\''+t+'\')"')+'>'+t+(tag?'<small>'+tag+'</small>':'')+'</div>';
  }).join('');
  var chosen = BK.f.time ? '<div class="bk-info">'+bt('time.chosen', {time:bkTimeText(BK.f.date, BK.f.time)})+'</div>' : '';
  return bkFrame('s.time',
    '<div class="bk-sub">'+bt('time.hint', {open:CLINIC_SETTINGS.openTime, close:CLINIC_SETTINGS.closeTime})+' · '+bt('tz', {tz:CLINIC_SETTINGS.tz})+'</div>'+
    '<div class="bk-days">'+dayHtml+'</div>'+(slotHtml.trim() ? '<div class="bk-slots">'+slotHtml+'</div>' : '<div class="bk-info">'+bt('time.none')+'</div>')+
    '<div style="margin-top:14px;">'+chosen+bkNav('bkTimeNext()', false)+'</div>');
}
function bkPickDay(ds){ BK.dayPick = ds; BK.err = ''; bkRender(); }
function bkPickSlot(ds, t){ BK.f.date = ds; BK.f.time = t; BK.err = ''; bkRender(); }
function bkTimeNext(){
  if(!BK.f.time){ BK.err = bt('time.pick'); return bkRender(); }
  if(slotBlockReason(BK.f.date, BK.f.time, BK.f.phId)){ BK.err = bt('time.taken'); BK.f.time = ''; return bkRender(); }
  bkNextStep();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bkInit); else bkInit();
/* 别的标签页（IN 端）改了数据 → 本页重新读档并重画（例如时段被约满） */
window.addEventListener('storage', function(){ setTimeout(function(){ if(BK && !BK.done && BK.entry!=='view' && BK_STEPS[BK.step]==='time') bkRender(); }, 80); /* 只在选时间那一步刷新（时段可能被约满），其他步骤不打断填写 */ });
