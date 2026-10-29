/* shared/booking.js —— 客户自助预约页（booking.html）的界面与流程（2026-10-06·B）
   三个入口共用一个页面：
   ① 室长发的预约链接  ?ph=占位ID  → 带入占位的时间/手机号/来访目的，从"验证手机"开始，第 1 步时间可改选；占位超时后链接仍有效
   ② 官网自助（无参数）          → 从第 1 步开始
   ③ 到店自己填      ?walkin=1   → 跳过第 1 步（时间 = 现在），提交后 IN 端由室长点［已到店］
   ④ 客人端查看/取消/重新预约  ?view=Case编号（确认/提醒短信里的网址）→ 手机验证 → 预约信息、［取消预约］、［重新预约］
   语言：印尼文 / 中文（右上角切换，记在浏览器里，词典在 i18n.js 的 BOOK_DICT）。规则和数据函数在 data.js（submitSelfBooking 等）。 */
var BK = null;
/* 新客人 9 步：选时间 → 验证手机 → 个人资料 → 来访目的 → 病史/过敏史 → 医美史（可跳过）→ 同意 → 确认提交 → 完成
   老客人：选时间 → 验证手机 → 来访目的 → 医美史（可跳过）→（同意书版本更新过才有同意）→ 确认提交 → 完成（跳过个人资料和病史/过敏史） */
var BK_STEPS = ['time','phone','profile','minor','purpose','health','beauty','consent','confirm'];

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
  BK = {entry:'web', step:0, f:{date:'', time:'', phone:'', name:'', firstName:'', lastName:'', noLast:false, gender:'', dob:'', history:'', beauty:[], purpose:'面诊商谈', note:'', c1:false, c2:false, phId:null, rebookFrom:null},
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
  else BK.mode = 'home'; /* 无参数的官网入口：先到首页（预约 / 查看我的预约，CMD-1012-03） */
  bkRender();
}
function bkSetLang(l){ BOOK_LANG = l; try{ localStorage.setItem('gmc_book_lang', l); }catch(e){} bkRender(); }

function bkRender(keepScroll){
  var root = document.getElementById('bk-root'); if(!root) return;
  document.documentElement.lang = BOOK_LANG;
  document.getElementById('bk-sub').textContent = bt('brand.sub');
  var home = BK.mode==='home'; document.body.classList.toggle('bk-home-mode', home);
  var lg = document.getElementById('bk-logo'); if(lg) lg.textContent = home ? bkClinicName() : 'GMC Network'; /* 首页左上写诊所名 */
  if(home) document.getElementById('bk-sub').textContent = '';
  ['id','zh'].forEach(function(l){ document.getElementById('lang-'+l).className = BOOK_LANG===l ? 'on' : ''; });
  if(BK.mode==='home') root.innerHTML = bkHomeHtml();
  else if(BK.mode==='lookup') root.innerHTML = bkLookupHtml();
  else if(BK.mode==='lookupNone') root.innerHTML = bkLookupNoneHtml();
  else if(BK.mode==='me' && BK.me) root.innerHTML = bkMeActive() ? bkRenderMe() : bkMeLoginHtml(); /* 预约提交后 / 验证后直接进"我的预约"；30 分钟内免验证，超过要重新手机验证 */
  else if(BK.entry==='view' && typeof bkRenderView === 'function') root.innerHTML = bkRenderView();
  else root.innerHTML = bkRenderStep();
  if(!keepScroll) window.scrollTo(0, 0);
}

/* ---- 步骤框架 ---- */
/* 老客人（手机验证后认出）：跳过"个人资料"和"健康资料"（有变化由室长到店时修改）；已签过当前版本的同意书 → 也跳过"同意"；同意书版本更新过的（或新客人）才要勾选 */
function bkLastConsent(){ var cl = BK.client; return cl ? (cl.consents||[]).slice(-1)[0] || null : null; }
function bkNeedConsent(){ var last = bkLastConsent(); return !last || last.version !== CLINIC_SETTINGS.privacyVersion; }
function bkSkipStep(s){ return (s==='time' && BK.entry==='walkin') || (s==='phone' && BK.verified) || (s==='profile' && !!BK.client && !BK.mismatch) || (s==='minor' && !bkOldMinorStep()) || (s==='health' && !!BK.client) || (s==='consent' && !bkNeedConsent()); }
function bkStepList(){ return BK_STEPS.filter(function(s){ return !bkSkipStep(s); }); }
function bkFrame(titleKey, bodyHtml){
  /* 步骤条：已经验证过手机的仍然算一步（走过了）；被跳过的步骤（老客人的个人资料/病史、不需要的同意）不出现；取消后重新预约时手机早已验证，不算 */
  var list = BK_STEPS.filter(function(x){ return x==='phone' ? !BK.f.rebookFrom : !bkSkipStep(x); }), cur = list.indexOf(BK_STEPS[BK.step]);
  var banner = '';
  if(BK.entry==='walkin') banner = '<div class="bk-info">'+bt('entry.walkin', {time:BK.f.time})+'</div>';
  else if(BK.entry==='link' && BK.step>0) banner = '<div class="bk-info">'+bt('entry.link', {time:bkTimeText(BK.f.date, BK.f.time)})+' · <a href="#" onclick="bkGo(0);return false;" style="color:var(--navy);font-weight:700;">'+bt('entry.change')+'</a></div>';
  return '<div class="bk-card"><div class="bk-step">'+bt('step.of', {n:cur+1, total:list.length})+'</div><div class="bk-bar"><span style="width:'+Math.round((cur+1)*100/list.length)+'%;"></span></div>'+
    banner+'<div class="bk-title">'+bt(titleKey)+'</div>'+bodyHtml+'</div>';
}
function bkGo(i){ BK.step = i; BK.err = ''; bkRender(); }
function bkNextStep(){ var i = BK.step + 1; while(i < BK_STEPS.length && bkSkipStep(BK_STEPS[i])) i++; bkGo(i); }
function bkPrevStep(){ var i = BK.step - 1; while(i > 0 && bkSkipStep(BK_STEPS[i])) i--; if(i<0) i = 0; bkGo(i); }
/* 固定在画面底部的操作栏（手机版面）：错误提示 + 按钮一行 */
function bkFooter(err, buttonsHtml){
  return '<div class="bk-footer">'+(err ? '<div class="bk-err" style="margin:0 0 8px;">'+bkH(err)+'</div>' : '')+'<div class="bk-footer-row">'+buttonsHtml+'</div></div>';
}
function bkNav(nextHandler, showBack){
  var off = !bkStepValid(BK_STEPS[BK.step]); /* 必填没填完时［下一步］置灰（CMD-1008-12 B） */
  return bkFooter(BK.err, (showBack ? '<button class="bk-btn ghost" onclick="bkPrevStep()">'+bt('btn.back')+'</button>' : '')+
    '<button class="bk-btn" id="bk-next" '+(off ? 'disabled ' : '')+'onclick="'+nextHandler+'">'+bt(nextHandler==='bkSubmit()' ? 'btn.submit' : 'btn.next')+'</button>');
}
/* 这一步的必填是否满足：健康资料（病史 / 过敏史）必填；两份同意书都勾选 */
function bkStepValid(s){
  if(s==='health') return !!(BK.f.history||'').trim();
  if(s==='consent') return !!(BK.f.c1 && BK.f.c2);
  return true;
}
function bkRefreshNext(){ var b = document.getElementById('bk-next'); if(b) b.disabled = !bkStepValid(BK_STEPS[BK.step]); }
function bkRenderStep(){
  var s = BK_STEPS[BK.step];
  var fn = {time:bkStepTime, phone:window.bkStepPhone, profile:window.bkStepProfile, minor:bkStepMinor, purpose:window.bkStepPurpose, health:window.bkStepHealth, beauty:window.bkStepBeauty, consent:window.bkStepConsent, confirm:window.bkStepConfirm}[s];
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
    var tag = why==='full' ? bt('time.full') : why==='lunch' ? bt('time.lunch') : ''; /* 已过去：灰色没有文字；额满：灰色 + 已满 */
    return '<div class="bk-slot'+(on?' on':'')+(why && why!=='full' ? ' off' : (why==='full' ? ' full' : ''))+'"'+(why?'':' onclick="bkPickSlot(\''+pick+'\',\''+t+'\')"')+'>'+t+(tag?'<small>'+tag+'</small>':'')+'</div>';
  }).join('');
  var chosen = BK.f.time ? '<div class="bk-info">'+bt('time.chosen', {time:bkTimeText(BK.f.date, BK.f.time)})+'</div>' : '';
  return bkFrame('s.time',
    '<div class="bk-sub">'+bt('time.hint', {open:CLINIC_SETTINGS.openTime, close:CLINIC_SETTINGS.closeTime})+' · '+bt('tz', {tz:tzLabel(clinicTzOf(CLINIC_SETTINGS))})+'</div>'+
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
  var body = bkField(bt('phone.label'), phoneInputHtml('bk-phone', BK.f.phone, {readonly:locked||o}))+
    (locked ? '<div class="bk-sub" style="margin-top:-6px;">'+bt('phone.locked')+'</div>' : '');
  if(!o) body += bkFooter(BK.err, (BK.step>0 && BK.entry!=='walkin' && !locked ? '<button class="bk-btn ghost" onclick="bkPrevStep()">'+bt('btn.back')+'</button>' : '')+'<button class="bk-btn" onclick="bkSendCode()">'+bt('phone.send')+'</button>');
  else body += '<div class="bk-demo">'+bt('phone.demo', {phone:bkH(BK.f.phone), code:o.code})+'</div>'+
    bkField(bt('phone.code'), '<input type="text" id="bk-code" inputmode="numeric" maxlength="6" onkeydown="if(event.key===\'Enter\')bkVerify()">')+
    bkFooter(BK.err, '<button class="bk-btn ghost" onclick="bkSendCode(true)">'+bt('phone.resend')+'</button><button class="bk-btn" onclick="bkVerify()">'+bt('phone.verify')+'</button>');
  return bkFrame('s.phone', body);
}
function bkSendCode(resend){
  var ph = BK.otp ? BK.f.phone : (phoneInputGet('bk-phone') || BK.f.phone);
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
  bkLoadClient();
  /* CMD-1008-14（B-015）：手机号已登记 → 先问「这个手机号已登记为 X，是本人吗？」（手机号是客人自己输入的，不是从确认短信链接带来的）；是本人才带出资料并跳过个人资料 */
  if(BK.client && !BK.mismatchOk){ BK.mismatch = true; return bkGo(BK_STEPS.indexOf('profile')); }
  bkNextStep();
}
/* 手机号找老客人：有 → 第 3、5 步自动带出资料；没有 → 新客人 */
function bkLoadClient(){
  var cl = clientByPhone(BK.f.phone); BK.client = cl;
  if(cl){ var f = BK.f; f.phone = cl.phone; f.name = cl.name; f.firstName = cl.firstName!==undefined ? cl.firstName : cl.name; f.lastName = cl.lastName||''; f.gender = cl.gender==='男' ? '男' : (cl.gender==='女' ? '女' : ''); f.dob = cl.dob||''; f.history = cl.history==='无' ? '' : (cl.history||''); var pf = minorPrefill(cl); f.marital = pf.marital; f.guardianOk = false; }
}

/* ---- 第 3 步：个人资料（新客人填姓名/性别/出生日期；老客人自动带出，确认即可；姓名和已登记的不同 → 问是不是本人） ---- */
function bkStepProfile(){
  var cl = BK.client, f = BK.f;
  if(BK.mismatch && cl){
    return bkFrame('s.profile', '<div class="bk-info" style="font-size:14px;color:var(--navy);">'+bt('mismatch.q', {reg:bkH(cl.name)})+'</div>'+
      bkFooter('', '<button class="bk-btn ghost" onclick="bkMismatch(false)">'+bt('mismatch.no')+'</button><button class="bk-btn" onclick="bkMismatch(true)">'+bt('mismatch.yes')+'</button>'));
  }
  var body = (cl ? '<div class="bk-info">'+bt('profile.back')+'</div>' : '')+
    bkField(bt('profile.first'), bkInput('firstName','text','autocomplete="given-name"'))+bkField(bt('profile.last'), bkInput('lastName','text','autocomplete="family-name"'+(f.noLast ? ' disabled style="background:#EFEDE8;color:#8E857C;"' : ''))+'<label style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:14px;"><input type="checkbox" '+(f.noLast ? 'checked ' : '')+'onchange="bkNoLast(this.checked)"> '+bt('profile.noLast')+'</label>')+
    bkField(bt('profile.gender'), '<select onchange="bkSet(\'gender\',this.value)"><option value="">'+bt('profile.pick')+'</option><option value="女"'+(f.gender==='女'?' selected':'')+'>'+bt('gender.f')+'</option><option value="男"'+(f.gender==='男'?' selected':'')+'>'+bt('gender.m')+'</option></select>')+
    bkField(bt('profile.dob'), '<input type="date" value="'+bkH(f.dob)+'" max="'+dateStr(demoNow())+'" onchange="bkDobChange(this.value)">')+bkMinorHtml()+(cl ? '' : bkField(bt('nik.label'), bkInput('nik','text','inputmode="numeric" maxlength="19" autocomplete="off" placeholder="'+bkH(bt('nik.ph'))+'"')+'<div class="bk-sub" style="margin-top:6px;">'+bt('nik.hint')+'</div>'));
  return bkFrame('s.profile', body+bkNav('bkProfileNext()', true));
}
/* CMD-1029-07：未满 21 岁（以预约当天算）→ 婚姻状况；未婚 → 必勾已通知监护人。已登记的老客人不走这一步 */
function bkMinor(){ return isMinorOn(BK.f.dob, todayStr()); }
/* CMD-1029-11：已登记的老客人（不走个人资料步骤）——旧资料没有生日 → 先补生日；以这次预约当天算未满 21 岁 → 再确认婚姻状况（带入上次）、未婚要重新勾已通知监护人 */
function bkOldMinorStep(){ if(!BK.client || BK.mismatch) return false; var n = minorNeed(BK.client); return n.needDob || n.minor; }
function bkStepMinor(){
  var f = BK.f, need = minorNeed(BK.client);
  var body = '<div class="bk-info">'+bt(need.needDob ? 'minor.oldDob' : 'minor.oldHint')+'</div>'+
    (need.needDob ? bkField(bt('profile.dob'), '<input type="date" value="'+bkH(f.dob)+'" max="'+dateStr(demoNow())+'" onchange="bkDobChange(this.value)">') : '')+bkMinorHtml();
  return bkFrame('s.minor', body+bkNav('bkMinorNext()', true));
}
function bkMinorNext(){
  var f = BK.f, need = minorNeed(BK.client);
  if(need.needDob && !f.dob){ BK.err = bt('profile.errDob'); return bkRender(); }
  if(bkMinor()){
    if(!f.marital){ BK.err = bt('minor.errMarital'); return bkRender(); }
    if(f.marital==='未婚' && !f.guardianOk){ BK.err = bt('minor.errGuardian'); return bkRender(); }
  }
  BK.err = ''; bkNextStep();
}
function bkDobChange(v){ BK.f.dob = v; if(!bkMinor()){ BK.f.marital = ''; BK.f.guardianOk = false; } BK.err = ''; bkRender(true); }
function bkMaritalSet(v){ BK.f.marital = v; if(v!=='未婚') BK.f.guardianOk = false; BK.err = ''; bkRender(true); }
function bkMinorHtml(){
  if(!bkMinor()) return '';
  var f = BK.f, radio = function(v, key){ return '<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin-right:18px;"><input type="radio" name="bk-marital" '+(f.marital===v ? 'checked ' : '')+'onchange="bkMaritalSet(\''+v+'\')"> '+bt(key)+'</label>'; };
  return bkField(bt('minor.marital'), '<div style="display:flex;flex-wrap:wrap;">'+radio('已婚','minor.married')+radio('未婚','minor.single')+'</div>')+
    (f.marital==='未婚' ? '<label style="display:flex;gap:8px;align-items:flex-start;margin:-4px 0 12px;font-size:14px;"><input type="checkbox" '+(f.guardianOk ? 'checked ' : '')+'onchange="BK.f.guardianOk=this.checked;BK.err=\'\';" style="margin-top:3px;"> <span>'+bt('minor.guardian')+'</span></label>' : '');
}
function bkNoLast(on){ BK.f.noLast = !!on; if(on) BK.f.lastName = ''; BK.err = ''; bkRender(); }
function bkProfileNext(){
  var f = BK.f; f.firstName = (f.firstName||'').trim(); f.lastName = f.noLast ? '' : (f.lastName||'').trim(); f.name = joinName(f.firstName, f.lastName); /* CMD-1021-01：名 / 姓 / 性别 / 出生日期都必填；勾「我没有姓」姓可空，显示名只用名 */
  if(!f.firstName){ BK.err = bt('profile.errName'); return bkRender(); }
  if(!f.noLast && !f.lastName){ BK.err = bt('profile.errLast'); return bkRender(); }
  if(!f.gender){ BK.err = bt('profile.errGender'); return bkRender(); }
  if(!f.dob){ BK.err = bt('profile.errDob'); return bkRender(); }
  if(!BK.client && nikClean(f.nik)){ var nerr = nikCheck(f.nik, null, true); if(nerr){ BK.err = nerr; return bkRender(); } } /* CMD-1029-10：选填；填了就要 16 位数字，且不能和已登记的客人重复（不透露对方是谁） */
  if(bkMinor()){
    if(!f.marital){ BK.err = bt('minor.errMarital'); return bkRender(); }
    if(f.marital==='未婚' && !f.guardianOk){ BK.err = bt('minor.errGuardian'); return bkRender(); }
  }
  if(BK.client && f.name.toLowerCase() !== BK.client.name.toLowerCase() && !BK.mismatchOk){ BK.mismatch = true; BK.err = ''; return bkRender(); }
  BK.err = ''; bkNextStep();
}
function bkMismatch(isMe){
  if(isMe){ BK.mismatchOk = true; BK.mismatch = false; bkLoadClient(); BK.err = ''; return bkNextStep(); } /* 是本人：带出登记的资料 */
  /* 不是本人：请改用其他手机号，重新验证 */
  BK.mismatch = false; BK.mismatchOk = false; BK.verified = false; BK.client = null; BK.otp = null; BK.phoneLocked = false;
  BK.f.phone = ''; BK.f.name = ''; BK.f.firstName = ''; BK.f.lastName = ''; BK.f.dob = ''; BK.f.history = ''; BK.f.beauty = [];
  BK.step = BK_STEPS.indexOf('phone'); BK.err = bt('phone.other'); bkRender();
}

/* ---- 第 4 步：来访目的（第一次来：面诊商谈 / 皮肤管理；来过的：再加 术后管理 / 复诊评估；+ 想咨询的内容选填）CMD-1022-15 ---- */
function bkStepPurpose(){
  var f = BK.f;
  var opts = visitPurposesFor(!!BK.client).map(function(p){ return '<div class="bk-radio'+(f.purpose===p?' on':'')+'" onclick="bkPickPurpose(\''+p+'\')"><span>'+(f.purpose===p?'◉':'○')+'</span>'+bt('purpose.'+p)+'</div>'; }).join('');
  return bkFrame('s.purpose', opts+bkField(bt('purpose.note'), '<textarea rows="3" oninput="bkSet(\'note\',this.value)">'+bkH(f.note)+'</textarea>')+bkNav('bkNextStep()', true));
}
function bkPickPurpose(p){ BK.f.purpose = p; bkRender(); }

/* ---- 病史 / 过敏史（只有新客人；老客人跳过，有变化由室长到店时修改） ---- */
function bkStepHealth(){
  var f = BK.f;
  return bkFrame('s.health', bkField(bt('health.history'), '<textarea rows="4" placeholder="'+bkH(bt('health.ph'))+'" oninput="bkSet(\'history\',this.value);bkRefreshNext()">'+bkH(f.history)+'</textarea>')+bkNav('bkHealthNext()', true));
}

function bkHealthNext(){ if(!bkStepValid('health')){ BK.err = bt('health.err'); return bkRender(); } BK.err = ''; bkNextStep(); }

/* ---- 医美史（可跳过，新老客人都有）：一笔一行 = 时间（年 + 月，手机原生选择器）+ 项目（从项目库选或自由输入）；［＋增加医美史］往下加一行并自动捲到新行；老客人上方先列出已登记的（只读） ---- */
var BK_BR_SEQ = 1;
function bkBeautyRows(){ return BK.f.beauty || (BK.f.beauty = []); }
function bkStepBeauty(){
  var cl = BK.client, rows = bkBeautyRows(), cur = dateStr(demoNow()).slice(0,7);
  var reg = '';
  if(cl && beautyRecordsOf(cl).length){
    reg = '<div class="bk-sub" style="margin-bottom:6px;"><b>'+bt('beauty.registered')+'</b></div><div class="bk-info" style="margin-bottom:14px;">'+
      beautyRecordsOf(cl).slice().sort(function(a,b){ return (b.year*100+b.month)-(a.year*100+a.month); }).map(function(r){ return '<div style="padding:3px 0;">'+r.year+'-'+pad2(r.month)+' · <b>'+bkH(r.project)+'</b></div>'; }).join('')+'</div>';
  }
  var rowHtml = rows.map(function(r, i){
    return '<div class="bk-br" id="bk-br-'+r.id+'"><div class="bk-br-head"><span>#'+(i+1)+'</span><button type="button" class="bk-x" aria-label="delete" onclick="bkDelBeauty('+i+')">✕</button></div>'+
      bkField(bt('beauty.when'), '<div style="display:flex;gap:8px;"><select style="flex:1;min-width:0;" onchange="bkBeautySet('+i+',\'y\',this.value)"><option value="">'+bt('beauty.year')+'</option>'+bkYearOpts(r.y)+'</select><select style="flex:1;min-width:0;" onchange="bkBeautySet('+i+',\'m\',this.value)"><option value="">'+bt('beauty.month')+'</option>'+bkMonthOpts(r.m)+'</select></div>')+
      bkField(bt('beauty.project'), '<input type="text" value="'+bkH(r.project)+'" placeholder="'+bkH(bt('beauty.projectPh'))+'" oninput="bkBeautySet('+i+',\'project\',this.value)">')+'</div>'; /* 项目是纯文字输入（不接项目库）；时间是年、月两个下拉（Safari 桌面版不支援 month 输入）*/
  }).join('');
  return bkFrame('s.beauty', '<div class="bk-info">'+bt('beauty.hint')+'</div>'+reg+rowHtml+
    '<button type="button" class="bk-btn ghost" style="margin-top:0;" onclick="bkAddBeauty()">'+bt('beauty.add')+'</button>'+
    bkFooter(BK.err, '<button class="bk-btn ghost" onclick="bkBeautySkip()">'+bt('beauty.skip')+'</button><button class="bk-btn" onclick="bkBeautyNext()">'+bt('btn.next')+'</button>', true));
}
/* 年份从今年往前 30 年；月 1–12；两个都选了才算填了时间（r.ym = 'YYYY-MM'） */
function bkYearOpts(sel){ var cy = demoNow().getFullYear(), o = ''; for(var y = cy; y >= cy-30; y--) o += '<option value="'+y+'"'+(String(sel)===String(y)?' selected':'')+'>'+y+'</option>'; return o; }
function bkMonthOpts(sel){ var o = ''; for(var m = 1; m <= 12; m++) o += '<option value="'+m+'"'+(String(sel)===String(m)?' selected':'')+'>'+m+'</option>'; return o; }
function bkBeautySet(i, k, v){ var r = bkBeautyRows()[i]; if(!r) return; r[k] = v; if(k==='y' || k==='m') r.ym = (r.y && r.m) ? r.y+'-'+pad2(+r.m) : ''; }
function bkAddBeauty(){
  var rows = bkBeautyRows(), id = 'n'+(BK_BR_SEQ++); rows.push({id:id, ym:'', y:'', m:'', project:''}); BK.err = ''; bkRender(true);
  var el = document.getElementById('bk-br-'+id); if(el) el.scrollIntoView({behavior:'smooth', block:'center'}); /* 自动捲到新的那一行 */
}
function bkDelBeauty(i){ bkBeautyRows().splice(i, 1); BK.err = ''; bkRender(true); }
/* ［跳过］：还没填任何一笔 → 直接跳过；已经填了 → 先确认"已填写的医美史不会保存"，确定才清空跳过 */
function bkBeautyHasInput(){ return bkBeautyRows().some(function(r){ return r.y || r.m || (r.project||'').trim(); }); }
function bkBeautySkip(){
  if(!bkBeautyHasInput()) return bkBeautySkipNow();
  var ov = document.createElement('div'); ov.id = 'bk-skip-ov'; ov.style.cssText = 'position:fixed;inset:0;z-index:60;background:rgba(27,38,53,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px;';
  ov.innerHTML = '<div style="background:#fff;border-radius:16px;padding:20px 18px;width:100%;max-width:448px;box-sizing:border-box;"><div style="font-size:15px;line-height:1.7;margin-bottom:16px;">'+bt('beauty.skipQ')+'</div>'+
    '<button type="button" class="bk-btn" onclick="bkBeautySkipNow()">'+bt('beauty.skipYes')+'</button><button type="button" class="bk-btn ghost" style="width:100%;flex:none;" onclick="bkCloseSkip()">'+bt('beauty.skipNo')+'</button></div>';
  document.body.appendChild(ov);
}
function bkCloseSkip(){ var ov = document.getElementById('bk-skip-ov'); if(ov) ov.remove(); }
function bkBeautySkipNow(){ bkCloseSkip(); BK.f.beauty = []; BK.err = ''; bkNextStep(); }
function bkBeautyNext(){
  var rows = bkBeautyRows().filter(function(r){ return r.y || r.m || (r.project||'').trim(); }); /* 整行没填的直接丢掉 */
  var cur = dateStr(demoNow()).slice(0,7);
  for(var i=0;i<rows.length;i++){
    if(!rows[i].ym || !(rows[i].project||'').trim()){ BK.f.beauty = rows; BK.err = bt('beauty.err'); return bkRender(true); }
    if(rows[i].ym > cur){ BK.f.beauty = rows; BK.err = bt('beauty.errFuture'); return bkRender(true); }
  }
  rows.forEach(function(r){ r.project = r.project.trim(); });
  BK.f.beauty = rows; BK.err = ''; bkNextStep();
}

/* ---- 第 6 步：同意（隐私政策 + 两项必勾；记录同意书版本 + 时间） ---- */
function bkStepConsent(){
  var f = BK.f;
  return bkFrame('s.consent', '<div style="font-size:13px;font-weight:700;margin-bottom:6px;">'+bt('consent.policy', {v:bkH(CLINIC_SETTINGS.privacyVersion)})+'</div>'+
    (bkLastConsent() ? '<div class="bk-demo">'+bt('consent.updated', {old:bkH(bkLastConsent().version), nw:bkH(CLINIC_SETTINGS.privacyVersion)})+'</div>' : '')+
    '<div class="bk-info" style="max-height:140px;overflow-y:auto;">'+bkH(CLINIC_SETTINGS.privacyPolicy)+'</div>'+
    '<label class="bk-check"><input type="checkbox" '+(f.c1?'checked ':'')+'onchange="BK.f.c1=this.checked;bkRefreshNext()"> <span>'+bt('consent.c1')+'</span></label>'+
    '<label class="bk-check"><input type="checkbox" '+(f.c2?'checked ':'')+'onchange="BK.f.c2=this.checked;bkRefreshNext()"> <span>'+bt('consent.c2')+'</span></label>'+
    '<div class="bk-sub">'+bt('consent.note')+'</div>'+bkNav('bkConsentNext()', true));
}
function bkConsentNext(){
  if(!BK.f.c1 || !BK.f.c2){ BK.err = bt('consent.err'); return bkRender(); }
  BK.err = ''; bkNextStep();
}

/* ---- 第 7 步：确认并提交 ---- */
function bkStepConfirm(){
  var f = BK.f, row = function(k, v){ return '<div class="bk-row"><span>'+bt(k)+'</span><span style="text-align:right;">'+bkH(v)+'</span></div>'; };
  return bkFrame('s.confirm', row('sum.time', bkTimeText(f.date, f.time))+(BK.client ? '<div class="bk-row"><span>'+bt('sum.name')+'</span><span style="text-align:right;">'+bkH(f.name)+'<br><small style="color:var(--muted);">'+bt('sum.nameNote')+'</small></span></div>' : row('sum.name', f.name))+row('sum.phone', f.phone)+row('sum.purpose', bt('purpose.'+f.purpose))+(f.note ? row('sum.note', f.note) : '')+((f.beauty||[]).length ? row('sum.beauty', bt('sum.beautyN', {n:f.beauty.length})) : '')+
    '<div style="height:12px;"></div>'+bkNav('bkSubmit()', true));
}
function bkSubmit(){
  var f = BK.f, old = f.rebookFrom ? CASE_ITEMS.filter(function(x){ return x.id===f.rebookFrom; })[0] : null;
  var res = submitSelfBooking({consentGiven:bkNeedConsent(), entry:BK.entry==='view' ? 'web' : BK.entry, phId:f.phId, date:f.date, time:f.time, phone:f.phone, name:f.name, firstName:f.firstName, lastName:f.lastName, noLastName:!!f.noLast, gender:f.gender, dob:f.dob, marital:f.marital, guardianOk:!!f.guardianOk, nik:f.nik,
    history:f.history, beauty:f.beauty, purpose:f.purpose, note:f.note, rebookFrom:old ? old.id : null});
  if(!res.ok && res.reason && /[\u4e00-\u9fa5]/.test(res.reason)){ BK.err = res.reason; return bkRender(); } /* CMD-1029-11：年龄确认没填完（页面上本来已经挡住，这里是兜底） */
  if(!res.ok){ BK.err = bt('time.taken'); BK.f.time = ''; if(BK.entry!=='walkin') BK.step = 0; return bkRender(); }
  Store.save(); BK.done = res; bkMeStart(f.phone, res.c.id); bkRender();
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
    var body = '<div class="bk-sub">'+bt('view.verify')+'</div>'+bkField(bt('phone.label'), phoneInputHtml('bk-phone', BK.f.phone, {readonly:!!o}));
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
  var ph = BK.otp ? BK.f.phone : (phoneInputGet('bk-phone') || BK.f.phone); BK.f.phone = String(ph).trim();
  if(!resend && normPhoneKey(BK.f.phone) !== normPhoneKey(clientPhoneOf(c.name))){ BK.err = bt('view.mismatch'); return bkRender(); }
  BK.err = ''; BK.otp = {code:String(100000+Math.floor(Math.random()*900000)), exp:Date.now()+5*60000};
  sendSms('code', BK.f.phone, {code:BK.otp.code}, null); Store.save(); bkRender();
}
function bkViewVerify(){
  var code = ((document.getElementById('bk-code')||{}).value||'').trim(), o = BK.otp;
  if(!o){ BK.err = bt('code.first'); return bkRender(); }
  if(Date.now() > o.exp){ BK.err = bt('code.expired'); BK.otp = null; return bkRender(); }
  if(code !== o.code){ BK.err = bt('code.bad'); return bkRender(); }
  BK.otp = null; BK.err = ''; BK.verified = true; BK.view.stage = 'card'; bkMeStart(BK.f.phone, null); bkRender();
}
function bkDoCancel(){
  var c = bkViewCase(); if(!c) return;
  var r = customerCancelCase(c.id);
  BK.view.stage = 'card'; BK.view.msg = r.ok ? bt('view.cancelled') : bt('view.cant');
  Store.save(); bkRender();
}
/* 取消后［重新预约］：回到选时间，资料带入；手机已验证所以跳过验证步骤；马上重约时 IN 端只收到一条合并的"客人改约"通知 */
function bkRebook(id){
  var c = id ? CASE_ITEMS.filter(function(x){ return x.id===id; })[0] : bkViewCase(); if(!c) return;
  var cl = clientByName(c.name);
  BK.entry = 'web'; BK.view = null; BK.mode = 'wizard'; BK.verified = true; BK.otp = null; BK.err = ''; BK.step = 0; BK.dayPick = null; BK.done = null; BK.mismatchOk = true;
  BK.f.phone = cl ? cl.phone : BK.f.phone; bkLoadClient();
  BK.f.date = ''; BK.f.time = ''; BK.f.phId = null; BK.f.purpose = c.visitPurpose || '面诊商谈'; BK.f.note = c.visitNote || ''; BK.f.c1 = false; BK.f.c2 = false; BK.f.rebookFrom = c.id;
  bkRender();
}

/* ================= 我的预约（BOOK-01 第 3 节，2026-10-07）：目前的预约 / 持有项目 / 过去的记录 ================= */
var BK_ME_MS = 30*60000; /* 提交 / 验证后 30 分钟内免验证；超过 30 分钟或重开页面（页面状态只在内存里）要重新手机验证 */
function bkMeStart(phone, bookedCaseId){
  var keep = BK.me ? BK.me.cancelled : [];
  BK.me = {at:Date.now(), phone:phone, cancelled:keep, confirm:null, msg:'', booked:bookedCaseId};
  BK.mode = 'me'; BK.done = null; BK.view = null;
}
function bkMeActive(){ return !!BK.me && (Date.now() - BK.me.at) <= BK_ME_MS; }
function bkMeClient(){ return clientByPhone(BK.me ? BK.me.phone : BK.f.phone); }
function bkMeFrame(inner){ return '<div class="bk-card"><div class="bk-title">'+bt('me.title')+'</div>'+inner+'</div>'; }
function bkMeMoney(r){ var p = []; if(r.paidKRW>0) p.push(formatCurrency(r.paidKRW,'KRW')); if(r.paidIDR>0) p.push(formatCurrency(r.paidIDR,'IDR')); return (p.join(' + ') || '—')+(r.refund ? ' · '+bt('me.refund') : ''); }
/* 这位客人的案件（含已到访的）下的在韩子项（施术以外的复诊 / 术后管理 / 其他；place=KR 或均可） */
function bkKrCareEvents(cl){
  var out = [];
  CASE_ITEMS.filter(function(c){ return c.name===cl.name; }).forEach(function(c){
    (c.subItems||[]).forEach(function(s){ if(s.date) out.push({date:s.date, text:(s.time ? s.time+' ' : '')+s.content+(s.booked ? '（'+(BOOK_LANG==='zh' ? '已预约 ' : 'sudah dijadwalkan ')+s.booked+'）' : ''), done:!!s.done, caseNo:c.caseNo, kind:s.kind, place:s.place}); });
  });
  return out.sort(function(a,b){ return a.date.localeCompare(b.date); });
}
function bkKrCareHtml(cl){
  var ev = bkKrCareEvents(cl);
  if(!ev.length) return '<div class="bk-sub">'+bt('me.krCareNone')+'</div>';
  return ev.map(function(e){ return '<div class="bk-row"><span>'+bkH(e.date)+' · '+bkH(e.text)+'</span><span style="text-align:right;">'+(e.done ? bt('me.done') : '')+'</span></div>'; }).join('');
}
/* 一个案件的实付金额（面诊费 + 定金 / 尾款 / 本地项目…；没付任何钱返回空） */
function bkCasePaidText(c){
  var fp = financePaid(c), fee = consultFeePaid(c) ? consultFeeOf(c) : 0, p = [];
  if(fp.kr>0 || (c.krBalancePaid && krBalanceInfo(c).diff>0)) p.push(formatCurrency(fp.kr + ((c.krBalancePaid && krBalanceInfo(c).diff>0) ? krBalanceInfo(c).diff : 0), 'KRW'));
  if(fp.inn + fee > 0) p.push(formatCurrency(fp.inn + fee, 'IDR'));
  return p.join(' + ');
}
/* 日历视图：月历，格子里标「来院」和「在韩」安排；下面列出当月安排 */
function bkMeCalHtml(cl, cur){
  var me = BK.me, ym = me.calMonth || todayStr().slice(0,7), y = +ym.slice(0,4), m = +ym.slice(5,7);
  var evs = cur.map(function(c){ return {date:c.visitDate, text:bt('me.ev.visit')+' '+c.visitTime, kind:'visit'}; }).concat(bkKrCareEvents(cl).map(function(e){ return {date:e.date, text:bt('me.ev.care')+' '+e.text, kind:'care', done:e.done}; }));
  var first = new Date(y, m-1, 1), days = new Date(y, m, 0).getDate(), lead = first.getDay(), cells = '';
  var mm = pad2(m), dow = BOOK_LANG==='zh' ? ['日','一','二','三','四','五','六'] : ['M','S','S','R','K','J','S'];
  cells += dow.map(function(d){ return '<div style="text-align:center;font-size:12px;color:var(--muted);">'+d+'</div>'; }).join('');
  for(var i=0;i<lead;i++) cells += '<div></div>';
  for(var d=1; d<=days; d++){
    var ds = y+'-'+mm+'-'+pad2(d), es = evs.filter(function(e){ return e.date===ds; });
    cells += '<div style="min-height:44px;border:1px solid var(--border);border-radius:6px;padding:2px 3px;font-size:12px;'+(ds===todayStr()?'border-color:var(--navy);':'')+'"><div style="color:var(--slate2);">'+d+'</div>'+es.map(function(e){ return '<div style="height:6px;border-radius:3px;margin-top:2px;background:'+(e.kind==='visit'?'#2F6FEB':(e.done?'#B9C4B5':'#C77B4A'))+';"></div>'; }).join('')+'</div>';
  }
  var nav = function(delta){ var dt = new Date(y, m-1+delta, 1); return dt.getFullYear()+'-'+pad2(dt.getMonth()+1); };
  var list = evs.filter(function(e){ return e.date.slice(0,7)===ym; }).sort(function(a,b){ return a.date.localeCompare(b.date); });
  return '<div style="display:flex;align-items:center;justify-content:space-between;margin:12px 0 8px;"><button class="bk-btn ghost" style="width:44px;min-height:36px;padding:4px;margin:0;" onclick="BK.me.calMonth=\''+nav(-1)+'\';bkRender(true)">‹</button><b>'+(BOOK_LANG==='zh' ? y+'年'+m+'月' : ym)+'</b><button class="bk-btn ghost" style="width:44px;min-height:36px;padding:4px;margin:0;" onclick="BK.me.calMonth=\''+nav(1)+'\';bkRender(true)">›</button></div>'+
    '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;">'+cells+'</div>'+
    '<div style="margin-top:10px;">'+(list.length ? list.map(function(e){ return '<div class="bk-row"><span>'+bkH(e.date)+'</span><span style="text-align:right;">'+bkH(e.text)+'</span></div>'; }).join('') : '<div class="bk-sub">'+bt('me.calEmpty')+'</div>')+'</div>';
}
function bkRenderMe(){
  var cl = bkMeClient(), me = BK.me; if(!cl) return bkMeFrame('<div class="bk-info">'+bt('view.notfound')+'</div>');
  var row = function(k, v){ return '<div class="bk-row"><span>'+bt(k)+'</span><span style="text-align:right;">'+bkH(v)+'</span></div>'; };
  var sec = function(t0, inner){ return '<div style="font-size:14px;font-weight:700;margin:20px 0 8px;color:var(--navy);">'+t0+'</div>'+inner; };
  var banner = me.booked ? '<div class="bk-info" style="margin-bottom:6px;"><b>✅ '+bt('me.ok')+'</b></div>' : '';
  /* 一、目前的预约 */
  var cur = clientCurrentCases(cl), canc = me.cancelled.map(function(id){ return CASE_ITEMS.filter(function(x){ return x.id===id; })[0]; }).filter(Boolean);
  var caseCard = function(c, cancelled){
    var inner = row('sum.time', bkTimeText(c.visitDate, c.visitTime))+row('done.case', c.caseNo)+(bkCasePaidText(c) ? row('me.paidNow', bkCasePaidText(c)) : '')+row('sum.purpose', bt('purpose.'+(c.visitPurpose||'面诊商谈')))+row('done.addr', CLINIC_SETTINGS.name+' · '+CLINIC_SETTINGS.address)+row('done.tel', CLINIC_SETTINGS.phone);
    if(cancelled) return '<div class="bk-info" style="margin-bottom:10px;opacity:.85;"><div style="font-weight:700;color:var(--muted);margin-bottom:4px;">● '+bt('view.status.cancelled')+'</div>'+inner+'<button class="bk-btn" style="margin-top:10px;" onclick="bkRebook(\''+c.id+'\')">'+bt('view.rebook')+'</button></div>';
    var btn = me.confirm===c.id
      ? '<div class="bk-info" style="margin-top:10px;font-size:14px;color:var(--navy);"><b>'+bt('view.cancelQ')+'</b><br><span style="font-size:12px;">'+bt('view.cancelT')+'</span></div><button class="bk-btn danger" onclick="bkMeCancel(\''+c.id+'\')">'+bt('view.cancelYes')+'</button><button class="bk-btn ghost" onclick="BK.me.confirm=null;bkRender(true)">'+bt('view.cancelNo')+'</button>'
      : (customerCanCancel(c) ? '<button class="bk-btn danger" style="margin-top:10px;" onclick="BK.me.confirm=\''+c.id+'\';bkRender(true)">'+bt('view.cancel')+'</button>' : '<div class="bk-sub" style="margin-top:8px;">'+bt('view.cant')+'</div>');
    return '<div class="bk-info" style="margin-bottom:10px;"><div style="font-weight:700;color:#8A7650;margin-bottom:4px;">● '+bt('view.status.waiting')+'</div>'+inner+btn+'</div>';
  };
  var curHtml = cur.map(function(c){ return caseCard(c, false); }).join('')+canc.filter(function(c){ return cur.indexOf(c)<0; }).map(function(c){ return caseCard(c, true); }).join('');
  if(!curHtml) curHtml = '<div class="bk-info">'+bt('me.noCurrent')+'</div><button class="bk-btn" style="margin-top:8px;" onclick="bkNewBooking()">'+bt('me.new')+'</button>';
  /* 二、持有项目 */
  var hv = clientHoldingsView(cl), hl = function(list){ return list.length ? list.map(function(x){ return '<div class="bk-row"><span>'+bkH(x.name)+'</span><span>'+bt('me.left', {n:x.remaining})+'</span></div>'; }).join('') : '<div class="bk-sub">'+bt('me.none')+'</div>'; };
  var holdHtml = '<div style="font-size:12px;font-weight:700;margin:4px 0;">'+bt('me.holdIN')+'</div>'+hl(hv.IN)+'<div style="font-size:12px;font-weight:700;margin:10px 0 4px;">'+bt('me.holdKR')+'</div>'+hl(hv.KR);
  /* 三、过去的记录（只列有到店的案件；报告只写"已出诊疗方案"） */
  var past = clientPastRecords(cl);
  var pastHtml = past.length ? past.map(function(r){
    return '<div class="bk-info" style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;gap:8px;"><b>'+bkH(r.date)+'</b><span>'+bkH(r.caseNo)+'</span></div>'+
      '<div style="margin-top:4px;">'+bkH(r.did || '—')+(r.report ? ' <span style="font-size:12px;background:var(--sage-bg);color:var(--sage);border-radius:10px;padding:1px 8px;">'+bt('me.report')+'</span>' : '')+'</div>'+
      (r.hospital ? '<div style="font-size:12px;color:var(--slate2);margin-top:3px;">'+bt('me.hospital')+'：'+bkH(r.hospital)+'</div>' : '')+
      '<div style="font-size:12px;color:var(--slate2);margin-top:3px;">'+bt('me.paid')+'：'+bkH(bkMeMoney(r))+'</div></div>';
  }).join('')+(past.some(function(r){ return r.report; }) ? '<div class="bk-sub">'+bt('me.reportNote')+'</div>' : '') : '<div class="bk-sub">'+bt('me.noPast')+'</div>';
  var tog = '<div style="display:flex;gap:8px;margin:6px 0 2px;">'+['list','cal'].map(function(v){ return '<button class="bk-btn'+((me.view||'list')===v?'':' ghost')+'" style="min-height:40px;padding:8px;margin-top:0;" onclick="BK.me.view=\''+v+'\';bkRender(true)">'+bt(v==='list'?'me.viewList':'me.viewCal')+'</button>'; }).join('')+'</div>';
  var careHtml = sec(bt('me.krCare'), bkKrCareHtml(cl));
  var head = banner+(me.msg ? '<div class="bk-info" style="margin-bottom:6px;">'+bkH(me.msg)+'</div>' : '')+tog;
  if(me.view==='cal') return bkMeFrame(head+bkMeCalHtml(cl, cur)+sec(bt('me.hold'), holdHtml));
  return bkMeFrame(head+sec(bt('me.current'), curHtml)+careHtml+sec(bt('me.hold'), holdHtml)+sec(bt('me.past'), pastHtml)); /* CMD-1008-12：不再写出「30 分钟不用再验证」这句；30 分钟内免验证的逻辑保留 */
}
function bkMeCancel(id){
  var r = customerCancelCase(id); BK.me.confirm = null;
  if(r.ok){ if(BK.me.cancelled.indexOf(id)<0) BK.me.cancelled.push(id); BK.me.msg = bt('view.cancelled'); } else BK.me.msg = bt('view.cant');
  BK.me.booked = null; Store.save(); bkRender(true);
}
/* 没有预约时［新预约］：回到选时间，资料带入（手机已验证，跳过验证步骤） */
function bkNewBooking(){
  var cl = bkMeClient();
  BK.mode = 'wizard'; BK.entry = 'web'; BK.view = null; BK.verified = true; BK.otp = null; BK.err = ''; BK.step = 0; BK.dayPick = null; BK.done = null; BK.mismatchOk = true;
  BK.f.phone = cl ? cl.phone : BK.f.phone; bkLoadClient(); BK.f.date = ''; BK.f.time = ''; BK.f.phId = null; BK.f.purpose = '面诊商谈'; BK.f.note = ''; BK.f.c1 = false; BK.f.c2 = false; BK.f.rebookFrom = null; BK.f.beauty = [];
  bkRender();
}
/* ================= 首页 + 查看我的预约入口（CMD-1012-03，BOOK-01 2026-10-12） ================= */
function bkClinicName(){ try{ var cl = clinicById(PAGE_CLINIC_ID); if(cl && cl.name) return cl.name; }catch(e){} return 'GMC 合作诊所（雅加达）'; }
/* CMD-1015-05 十三：首页 = 棕榈叶背景 + 左上诊所名 + 右上语言 + 大标题 + 欢迎语 + 两张大卡（图标·标题+说明·右箭头）；功能不变 */
function bkHomeHtml(){
  var arrow = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ico = {
    book: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    view: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6a2 2 0 0 1 2 2v14H7V6a2 2 0 0 1 2-2z"/><path d="M10 9h4M10 13h4M10 17h2"/></svg>'
  };
  var card = function(fn, icon, title, sub, primary){ return '<button class="bk-home-card'+(primary?' primary':'')+'" onclick="'+fn+'"><span class="bk-home-ico">'+ico[icon]+'</span><span class="bk-home-txt"><b>'+bt(title)+'</b><small>'+bt(sub)+'</small></span><span class="bk-home-arrow">'+arrow+'</span></button>'; };
  return '<div class="bk-home"><h1 class="bk-home-title">'+bt('home.welcome', {name:bkH(bkClinicName())})+'</h1><p class="bk-home-intro">'+bt('home.intro')+'</p>'+card('bkHomeBook()','book','home.book','home.bookSub',true)+card('bkHomeLookup()','view','home.view','home.viewSub',false)+'</div>';
}
function bkHomeBook(){ BK.mode = null; BK.err = ''; bkRender(); }
function bkHomeLookup(){ BK.mode = 'lookup'; BK.otp = null; BK.err = ''; BK.lkPhone = BK.lkPhone || '+62 '; bkRender(); }
function bkHomeBack(){ BK.mode = 'home'; BK.otp = null; BK.err = ''; bkRender(); }
function bkLookupHtml(){
  var o = BK.otp, ph = BK.lkPhone;
  var body = bkField(bt('phone.label'), phoneInputHtml('bk-phone', ph, {readonly:!!o, onEnter:'bkLkSend()'}));
  if(!o) body += (BK.err ? '<div class="bk-err">'+bkH(BK.err)+'</div>' : '')+'<button class="bk-btn" onclick="bkLkSend()">'+bt('phone.send')+'</button>';
  else body += '<div class="bk-demo">'+bt('phone.demo', {phone:bkH(ph), code:o.code})+'</div>'+bkField(bt('phone.code'), '<input type="text" id="bk-code" inputmode="numeric" maxlength="6" onkeydown="if(event.key===\'Enter\')bkLkVerify()">')+
    (BK.err ? '<div class="bk-err">'+bkH(BK.err)+'</div>' : '')+'<button class="bk-btn" onclick="bkLkVerify()">'+bt('phone.verify')+'</button><button class="bk-btn ghost" onclick="bkLkSend(true)">'+bt('phone.resend')+'</button>';
  return '<div class="bk-card"><div class="bk-title">'+bt('lk.title')+'</div>'+body+'<button class="bk-btn ghost" onclick="bkHomeBack()">'+bt('home.back')+'</button></div>';
}
function bkLkSend(resend){
  var ph = BK.otp ? BK.lkPhone : (phoneInputGet('bk-phone') || BK.lkPhone);
  if(!resend && normPhoneKey(ph).length < 8){ BK.err = bt('phone.bad'); return bkRender(); }
  BK.lkPhone = ph.trim(); BK.err = '';
  BK.otp = {code:String(100000+Math.floor(Math.random()*900000)), exp:Date.now()+5*60000};
  sendSms('code', BK.lkPhone, {code:BK.otp.code}, null); Store.save(); bkRender();
}
function bkLkVerify(){
  var code = ((document.getElementById('bk-code')||{}).value||'').trim(), o = BK.otp;
  if(!o){ BK.err = bt('code.first'); return bkRender(); }
  if(Date.now() > o.exp){ BK.err = bt('code.expired'); BK.otp = null; return bkRender(); }
  if(code !== o.code){ BK.err = bt('code.bad'); return bkRender(); }
  BK.otp = null; BK.err = '';
  var cl = clientByPhone(BK.lkPhone);
  if(!cl){ BK.mode = 'lookupNone'; return bkRender(); }
  BK.f.phone = cl.phone; bkMeStart(cl.phone, null); bkRender();
}
function bkLookupNoneHtml(){
  return '<div class="bk-card"><div class="bk-title">'+bt('lk.title')+'</div><div class="bk-info">'+bt('lk.none')+'</div><button class="bk-btn" style="margin-top:10px;" onclick="BK.f.phone=BK.lkPhone;bkHomeBook()">'+bt('lk.toBook')+'</button><button class="bk-btn ghost" onclick="bkHomeBack()">'+bt('home.back')+'</button></div>';
}
/* 超过 30 分钟：重新用手机验证码登录（手机号固定为这位客人的） */
function bkMeLoginHtml(){
  var o = BK.otp, ph = BK.me ? BK.me.phone : BK.f.phone;
  var body = '<div class="bk-info">'+bt('me.relogin')+'</div>'+bkField(bt('phone.label'), phoneInputHtml('bk-phone', ph, {readonly:true}));
  if(!o) body += (BK.err ? '<div class="bk-err">'+bkH(BK.err)+'</div>' : '')+'<button class="bk-btn" onclick="bkMeSend()">'+bt('phone.send')+'</button>';
  else body += '<div class="bk-demo">'+bt('phone.demo', {phone:bkH(ph), code:o.code})+'</div>'+bkField(bt('phone.code'), '<input type="text" id="bk-code" inputmode="numeric" maxlength="6" onkeydown="if(event.key===\'Enter\')bkMeVerify()">')+
    (BK.err ? '<div class="bk-err">'+bkH(BK.err)+'</div>' : '')+'<button class="bk-btn" onclick="bkMeVerify()">'+bt('phone.verify')+'</button><button class="bk-btn ghost" onclick="bkMeSend(true)">'+bt('phone.resend')+'</button>';
  return bkMeFrame(body);
}
function bkMeSend(){ var ph = BK.me.phone; BK.err = ''; BK.otp = {code:String(100000+Math.floor(Math.random()*900000)), exp:Date.now()+5*60000}; sendSms('code', ph, {code:BK.otp.code}, null); Store.save(); bkRender(); }
function bkMeVerify(){
  var code = ((document.getElementById('bk-code')||{}).value||'').trim(), o = BK.otp;
  if(!o){ BK.err = bt('code.first'); return bkRender(); }
  if(Date.now() > o.exp){ BK.err = bt('code.expired'); BK.otp = null; return bkRender(); }
  if(code !== o.code){ BK.err = bt('code.bad'); return bkRender(); }
  BK.otp = null; BK.err = ''; BK.me.at = Date.now(); bkRender();
}
setInterval(function(){ if(BK && BK.mode==='me' && BK.me && !bkMeActive() && !BK.otp && !document.getElementById('bk-code')) bkRender(true); }, 20000); /* 超过 30 分钟自动回到手机验证 */

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bkInit); else bkInit();
/* 别的标签页（IN 端）改了数据 → 本页重新读档并重画（例如时段被约满） */
window.addEventListener('storage', function(){ setTimeout(function(){ var typing = document.activeElement && /^(input|textarea|select)$/i.test(document.activeElement.tagName); if(BK && BK.mode==='me' && BK.me && bkMeActive() && !typing && !document.getElementById('bk-code')){ bkRender(true); return; } /* 我的预约：IN 端改了案件状态/取消，客人端同步 */ if(BK && !BK.done && BK.entry!=='view' && BK_STEPS[BK.step]==='time') bkRender(); }, 80); /* 只在选时间那一步刷新（时段可能被约满），其他步骤不打断填写 */ });
