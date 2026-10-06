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

/* ---- 小工具：输入时只更新数据，不重画（不打断输入） ---- */
function bkSet(k, v){ BK.f[k] = v; }
function bkField(label, inner){ return '<div class="bk-field"><label>'+label+'</label>'+inner+'</div>'; }
function bkInput(k, type, extra){ return '<input type="'+(type||'text')+'" value="'+bkH(BK.f[k])+'" oninput="bkSet(\''+k+'\',this.value)" '+(extra||'')+'>'; }

/* ---- 第 2 步：验证手机（演示验证码直接显示在画面上），验证后按手机号找老客人 ---- */
function bkStepPhone(){
  var o = BK.otp, locked = BK.phoneLocked;
  var body = bkField(bt('phone.label'), '<input type="tel" id="bk-phone" value="'+bkH(BK.f.phone)+'" '+(locked||o?'readonly ':'')+'oninput="bkSet(\'phone\',this.value)" placeholder="+62 812-xxxx-xxxx">')+
    (locked ? '<div class="bk-sub" style="margin-top:-6px;">'+bt('phone.locked')+'</div>' : '');
  if(!o) body += (BK.err ? '<div class="bk-err">'+bkH(BK.err)+'</div>' : '')+'<button class="bk-btn" onclick="bkSendCode()">'+bt('phone.send')+'</button>'+
    (BK.step>0 && BK.entry!=='walkin' && !locked ? '<button class="bk-btn ghost" onclick="bkPrevStep()">'+bt('btn.back')+'</button>' : '');
  else body += '<div class="bk-demo">'+bt('phone.demo', {phone:bkH(BK.f.phone), code:o.code})+'</div>'+
    bkField(bt('phone.code'), '<input type="text" id="bk-code" inputmode="numeric" maxlength="6" onkeydown="if(event.key===\'Enter\')bkVerify()">')+
    (BK.err ? '<div class="bk-err">'+bkH(BK.err)+'</div>' : '')+
    '<button class="bk-btn" onclick="bkVerify()">'+bt('phone.verify')+'</button><button class="bk-btn ghost" onclick="bkSendCode(true)">'+bt('phone.resend')+'</button>';
  return bkFrame('s.phone', body);
}
function bkSendCode(resend){
  var ph = (document.getElementById('bk-phone')||{}).value || BK.f.phone;
  if(!resend && normPhoneKey(ph).length < 8){ BK.err = bt('phone.bad'); return bkRender(); }
  BK.f.phone = (BK.otp ? BK.f.phone : ph).trim(); BK.err = '';
  BK.otp = {code:String(100000+Math.floor(Math.random()*900000)), exp:Date.now()+5*60000};
  sendSms('code', BK.f.phone, {code:BK.otp.code}, null);
  Store.save(); bkRender();
}
function bkVerify(){
  var code = ((document.getElementById('bk-code')||{}).value||'').trim(), o = BK.otp;
  if(!o){ BK.err = bt('code.first'); return bkRender(); }
  if(Date.now() > o.exp){ BK.err = bt('code.expired'); BK.otp = null; return bkRender(); }
  if(code !== o.code){ BK.err = bt('code.bad'); return bkRender(); }
  BK.verified = true; BK.otp = null; BK.err = '';
  bkLoadClient(); bkNextStep();
}
/* 手机号找老客人：有 → 第 3、5 步自动带出资料；没有 → 新客人 */
function bkLoadClient(){
  var cl = clientByPhone(BK.f.phone); BK.client = cl;
  if(cl){ var f = BK.f; f.phone = cl.phone; f.name = cl.name; f.gender = cl.gender==='男' ? '男' : '女'; f.dob = cl.dob||''; f.history = cl.history==='无' ? '' : (cl.history||''); f.beautyHistory = cl.beautyHistory||''; }
}

/* ---- 第 3 步：个人资料（新客人填姓名/性别/出生日期；老客人自动带出，确认即可；姓名和已登记的不同 → 问是不是本人） ---- */
function bkStepProfile(){
  var cl = BK.client, f = BK.f;
  if(BK.mismatch && cl){
    return bkFrame('s.profile', '<div class="bk-info" style="font-size:14px;color:var(--navy);">'+bt('mismatch.q', {reg:bkH(cl.name)})+'</div>'+
      '<button class="bk-btn" onclick="bkMismatch(true)">'+bt('mismatch.yes')+'</button><button class="bk-btn ghost" onclick="bkMismatch(false)">'+bt('mismatch.no')+'</button>');
  }
  var body = (cl ? '<div class="bk-info">'+bt('profile.back')+'</div>' : '')+
    bkField(bt('profile.name'), bkInput('name','text','autocomplete="name"'))+
    bkField(bt('profile.gender'), '<select onchange="bkSet(\'gender\',this.value)"><option value="女"'+(f.gender==='女'?' selected':'')+'>'+bt('gender.f')+'</option><option value="男"'+(f.gender==='男'?' selected':'')+'>'+bt('gender.m')+'</option></select>')+
    bkField(bt('profile.dob'), bkInput('dob','date','max="'+dateStr(demoNow())+'"'));
  return bkFrame('s.profile', body+bkNav('bkProfileNext()', true));
}
function bkProfileNext(){
  var f = BK.f; f.name = (f.name||'').trim();
  if(!f.name){ BK.err = bt('profile.errName'); return bkRender(); }
  if(!f.dob){ BK.err = bt('profile.errDob'); return bkRender(); }
  if(BK.client && f.name.toLowerCase() !== BK.client.name.toLowerCase() && !BK.mismatchOk){ BK.mismatch = true; BK.err = ''; return bkRender(); }
  BK.err = ''; bkNextStep();
}
function bkMismatch(isMe){
  if(isMe){ BK.mismatchOk = true; BK.mismatch = false; bkLoadClient(); BK.err = ''; return bkNextStep(); } /* 是本人：带出登记的资料 */
  /* 不是本人：请改用其他手机号，重新验证 */
  BK.mismatch = false; BK.mismatchOk = false; BK.verified = false; BK.client = null; BK.otp = null; BK.phoneLocked = false;
  BK.f.phone = ''; BK.f.name = ''; BK.f.dob = ''; BK.f.history = ''; BK.f.beautyHistory = '';
  BK.step = BK_STEPS.indexOf('phone'); BK.err = bt('phone.other'); bkRender();
}

/* ---- 第 4 步：来访目的（五选一 + 想咨询的内容选填） ---- */
function bkStepPurpose(){
  var f = BK.f;
  var opts = VISIT_PURPOSES.map(function(p){ return '<div class="bk-radio'+(f.purpose===p?' on':'')+'" onclick="bkPickPurpose(\''+p+'\')"><span>'+(f.purpose===p?'◉':'○')+'</span>'+bt('purpose.'+p)+'</div>'; }).join('');
  return bkFrame('s.purpose', opts+bkField(bt('purpose.note'), '<textarea rows="3" oninput="bkSet(\'note\',this.value)">'+bkH(f.note)+'</textarea>')+bkNav('bkNextStep()', true));
}
function bkPickPurpose(p){ BK.f.purpose = p; bkRender(); }

/* ---- 第 5 步：健康资料（病史/过敏史、过往医美史；老客人显示上次填的） ---- */
function bkStepHealth(){
  var f = BK.f;
  return bkFrame('s.health', (BK.client ? '<div class="bk-info">'+bt('health.prev')+'</div>' : '')+
    bkField(bt('health.history'), '<textarea rows="3" placeholder="'+bkH(bt('health.ph'))+'" oninput="bkSet(\'history\',this.value)">'+bkH(f.history)+'</textarea>')+
    bkField(bt('health.beauty'), '<textarea rows="3" placeholder="'+bkH(bt('health.ph'))+'" oninput="bkSet(\'beautyHistory\',this.value)">'+bkH(f.beautyHistory)+'</textarea>')+bkNav('bkNextStep()', true));
}

/* ---- 第 6 步：同意（隐私政策 + 两项必勾；记录同意书版本 + 时间） ---- */
function bkStepConsent(){
  var f = BK.f;
  return bkFrame('s.consent', '<div style="font-size:13px;font-weight:700;margin-bottom:6px;">'+bt('consent.policy', {v:bkH(CLINIC_SETTINGS.privacyVersion)})+'</div>'+
    '<div class="bk-info" style="max-height:140px;overflow-y:auto;">'+bkH(CLINIC_SETTINGS.privacyPolicy)+'</div>'+
    '<label class="bk-check"><input type="checkbox" '+(f.c1?'checked ':'')+'onchange="BK.f.c1=this.checked"> <span>'+bt('consent.c1')+'</span></label>'+
    '<label class="bk-check"><input type="checkbox" '+(f.c2?'checked ':'')+'onchange="BK.f.c2=this.checked"> <span>'+bt('consent.c2')+'</span></label>'+
    '<div class="bk-sub">'+bt('consent.note')+'</div>'+bkNav('bkConsentNext()', true));
}
function bkConsentNext(){
  if(!BK.f.c1 || !BK.f.c2){ BK.err = bt('consent.err'); return bkRender(); }
  BK.err = ''; bkNextStep();
}

/* ---- 第 7 步：确认并提交 ---- */
function bkStepConfirm(){
  var f = BK.f, row = function(k, v){ return '<div class="bk-row"><span>'+bt(k)+'</span><span style="text-align:right;">'+bkH(v)+'</span></div>'; };
  return bkFrame('s.confirm', row('sum.time', bkTimeText(f.date, f.time))+row('sum.name', f.name)+row('sum.phone', f.phone)+row('sum.purpose', bt('purpose.'+f.purpose))+(f.note ? row('sum.note', f.note) : '')+
    '<div style="height:12px;"></div>'+bkNav('bkSubmit()', true));
}
function bkSubmit(){
  var f = BK.f, old = f.rebookFrom ? CASE_ITEMS.filter(function(x){ return x.id===f.rebookFrom; })[0] : null;
  var res = submitSelfBooking({entry:BK.entry==='view' ? 'web' : BK.entry, phId:f.phId, date:f.date, time:f.time, phone:f.phone, name:f.name, gender:f.gender, dob:f.dob,
    history:f.history, beautyHistory:f.beautyHistory, purpose:f.purpose, note:f.note, rebookFrom:old ? old.id : null});
  if(!res.ok){ BK.err = bt('time.taken'); BK.f.time = ''; if(BK.entry!=='walkin') BK.step = 0; return bkRender(); }
  Store.save(); BK.done = res; bkRender();
}

/* ---- 第 8 步：完成页（预约时间、诊所地址；演示"已发送确认短信"，附客人端网址） ---- */
function bkRenderDone(){
  var c = BK.done.c, row = function(k, v){ return '<div class="bk-row"><span>'+bt(k)+'</span><span style="text-align:right;">'+bkH(v)+'</span></div>'; };
  var sms = SMS_LOG.filter(function(s){ return s.caseId===c.id && s.kind==='confirm'; })[0];
  return '<div class="bk-card"><div style="text-align:center;font-size:36px;">✅</div><div class="bk-title" style="text-align:center;margin-bottom:10px;">'+bt('done.title')+'</div>'+
    row('sum.time', bkTimeText(c.visitDate, c.visitTime))+row('done.case', c.caseNo)+row('sum.name', c.name)+row('done.addr', CLINIC_SETTINGS.name+' · '+CLINIC_SETTINGS.address)+row('done.tel', CLINIC_SETTINGS.phone)+
    (BK.entry==='walkin' ? '<div class="bk-info" style="margin-top:12px;">'+bt('done.walkin')+'</div>' : '')+
    '<div style="font-size:12px;color:var(--muted);margin:14px 0 6px;">'+bt('done.sms')+'</div><div class="bk-sms">'+bkH(sms ? sms.text : '')+'</div>'+
    '<a href="'+caseViewUrl(c)+'" class="bk-btn ghost" style="display:block;text-align:center;text-decoration:none;box-sizing:border-box;margin-top:14px;">'+bt('done.manage')+'</a></div>';
}

/* ================= 客人端：查看 / 取消 / 重新预约（确认/提醒短信里的网址 booking.html?view=Case编号，需要手机验证） ================= */
function bkViewCase(){ return CASE_ITEMS.filter(function(c){ return c.caseNo===BK.view.caseNo; })[0] || null; }
function bkViewFrame(bodyHtml){ return '<div class="bk-card"><div class="bk-title">'+bt('view.title')+'</div>'+bodyHtml+'</div>'; }
function bkRenderView(){
  var v = BK.view, c = bkViewCase();
  if(!c) return bkViewFrame('<div class="bk-info">'+bt('view.notfound')+'</div>');
  if(v.stage==='phone' || v.stage==='otp'){
    var o = BK.otp;
    var body = '<div class="bk-sub">'+bt('view.verify')+'</div>'+bkField(bt('phone.label'), '<input type="tel" id="bk-phone" value="'+bkH(BK.f.phone)+'" '+(o?'readonly ':'')+'oninput="bkSet(\'phone\',this.value)" placeholder="+62 812-xxxx-xxxx">');
    if(!o) body += (BK.err ? '<div class="bk-err">'+bkH(BK.err)+'</div>' : '')+'<button class="bk-btn" onclick="bkViewSend()">'+bt('phone.send')+'</button>';
    else body += '<div class="bk-demo">'+bt('phone.demo', {phone:bkH(BK.f.phone), code:o.code})+'</div>'+bkField(bt('phone.code'), '<input type="text" id="bk-code" inputmode="numeric" maxlength="6" onkeydown="if(event.key===\'Enter\')bkViewVerify()">')+
      (BK.err ? '<div class="bk-err">'+bkH(BK.err)+'</div>' : '')+'<button class="bk-btn" onclick="bkViewVerify()">'+bt('phone.verify')+'</button><button class="bk-btn ghost" onclick="bkViewSend(true)">'+bt('phone.resend')+'</button>';
    return bkViewFrame(body);
  }
  /* 已验证：显示预约信息 */
  var vs = visitStateOf(c), key = vs==='预约取消' ? 'cancelled' : vs==='未到店' ? 'noshow' : vs==='已到访' ? 'arrived' : 'waiting';
  var color = {waiting:'#8A7650', arrived:'var(--sage)', cancelled:'var(--muted)', noshow:'#C1454A'}[key];
  var row = function(k, val){ return '<div class="bk-row"><span>'+bt(k)+'</span><span style="text-align:right;">'+bkH(val)+'</span></div>'; };
  var info = '<div style="margin-bottom:8px;"><span style="font-weight:700;color:'+color+';">● '+bt('view.status.'+key)+'</span></div>'+
    row('sum.time', bkTimeText(c.visitDate, c.visitTime))+row('done.case', c.caseNo)+row('sum.purpose', bt('purpose.'+(c.visitPurpose||'面诊商谈')))+(c.visitNote ? row('sum.note', c.visitNote) : '')+
    row('done.addr', CLINIC_SETTINGS.name+' · '+CLINIC_SETTINGS.address)+row('done.tel', CLINIC_SETTINGS.phone);
  if(v.stage==='confirmCancel'){
    return bkViewFrame(info+'<div class="bk-info" style="margin-top:12px;font-size:14px;color:var(--navy);"><b>'+bt('view.cancelQ')+'</b><br><span style="font-size:12px;">'+bt('view.cancelT')+'</span></div>'+
      '<button class="bk-btn danger" onclick="bkDoCancel()">'+bt('view.cancelYes')+'</button><button class="bk-btn ghost" onclick="BK.view.stage=\'card\';bkRender()">'+bt('view.cancelNo')+'</button>');
  }
  var tail = '';
  if(v.msg) tail += '<div class="bk-info" style="margin-top:12px;">'+bkH(v.msg)+'</div>';
  if(customerCanCancel(c)) tail += '<button class="bk-btn danger" style="margin-top:14px;" onclick="BK.view.stage=\'confirmCancel\';bkRender()">'+bt('view.cancel')+'</button>';
  else if(key==='waiting') tail += '<div class="bk-info" style="margin-top:12px;">'+bt('view.cant')+'</div>';
  if(key==='cancelled' || key==='noshow') tail += '<div class="bk-sub" style="margin-top:12px;">'+bt('view.rebookHint')+'</div><button class="bk-btn" onclick="bkRebook()">'+bt('view.rebook')+'</button>';
  return bkViewFrame(info+tail);
}
function bkViewSend(resend){
  var c = bkViewCase(); if(!c) return;
  var ph = (document.getElementById('bk-phone')||{}).value || BK.f.phone; BK.f.phone = String(ph).trim();
  if(!resend && normPhoneKey(BK.f.phone) !== normPhoneKey(clientPhoneOf(c.name))){ BK.err = bt('view.mismatch'); return bkRender(); }
  BK.err = ''; BK.otp = {code:String(100000+Math.floor(Math.random()*900000)), exp:Date.now()+5*60000};
  sendSms('code', BK.f.phone, {code:BK.otp.code}, null); Store.save(); bkRender();
}
function bkViewVerify(){
  var code = ((document.getElementById('bk-code')||{}).value||'').trim(), o = BK.otp;
  if(!o){ BK.err = bt('code.first'); return bkRender(); }
  if(Date.now() > o.exp){ BK.err = bt('code.expired'); BK.otp = null; return bkRender(); }
  if(code !== o.code){ BK.err = bt('code.bad'); return bkRender(); }
  BK.otp = null; BK.err = ''; BK.verified = true; BK.view.stage = 'card'; bkRender();
}
function bkDoCancel(){
  var c = bkViewCase(); if(!c) return;
  var r = customerCancelCase(c.id);
  BK.view.stage = 'card'; BK.view.msg = r.ok ? bt('view.cancelled') : bt('view.cant');
  Store.save(); bkRender();
}
/* 取消后［重新预约］：回到选时间，资料带入；手机已验证所以跳过验证步骤；马上重约时 IN 端只收到一条合并的"客人改约"通知 */
function bkRebook(){
  var c = bkViewCase(); if(!c) return;
  var cl = clientByName(c.name);
  BK.entry = 'web'; BK.view = null; BK.verified = true; BK.otp = null; BK.err = ''; BK.step = 0; BK.dayPick = null; BK.done = null; BK.mismatchOk = true;
  BK.f.phone = cl ? cl.phone : BK.f.phone; bkLoadClient();
  BK.f.date = ''; BK.f.time = ''; BK.f.phId = null; BK.f.purpose = c.visitPurpose || '面诊商谈'; BK.f.note = c.visitNote || ''; BK.f.c1 = false; BK.f.c2 = false; BK.f.rebookFrom = c.id;
  bkRender();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bkInit); else bkInit();
/* 别的标签页（IN 端）改了数据 → 本页重新读档并重画（例如时段被约满） */
window.addEventListener('storage', function(){ setTimeout(function(){ if(BK && !BK.done && BK.entry!=='view' && BK_STEPS[BK.step]==='time') bkRender(); }, 80); /* 只在选时间那一步刷新（时段可能被约满），其他步骤不打断填写 */ });
