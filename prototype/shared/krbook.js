/* CMD-1014-16 三：IN 在「KR 医院日程」帮客人占位预约 → KR 确认后建新案件（在韩到店） / 无法安排或改时间 → IN 重选
   数据：HOSPITAL_DATA[医院].krBookings = [{id, clinicId, clientName, purpose(hold|care|other), director, date, time, end, note, status(pending|confirmed|reselect|done|cancelled|replaced),
   by, createdAt, caseId, reselectKind(change|reject), reselectReason, suggest:{date,time}, arrivedAt, did, history[]}]；
   日历上的块 = 院长日程里一条 kind:'预约' 的块（directorSchedule[院长]，bookingId 对应），待确认 = 虚线块，确认后 = 实线块；其他诊所的预约在 IN 端只显示浅灰无字。
   流程：IN 点 KR 医院日程周视图的空白时段 → 预约窗（客人只能选有赴韩项目的 / 来访目的 / 院长 / 备注；撞不可预约 / OFF / 休诊挡住并说明，午休 / 营业时间外弹确认）→ 占位（还不建案件）
   → KR 待办「确认预约时间」：［确认］= 正式预约 + 建立新案件（从预约到店开始，地点 KR 医院，c.krVisit，IN 和 KR 都看得到）+ IN 收到消息；改时间 /［无法安排］→ IN 待办「重选时间」
   → 到那天 KR 日历点预约 →［客人已到店］→ 用持有 / 新做管理 / 其他 → ［标记完成］（案件结案：在韩到店完成）。
   我的判断（待确认）：新做管理在韩国收费，不进平台结算，只记录项目名；使用在韩持有 = 扣减客人在韩持有项目一次。 */
var KRB_PURPOSE = {hold:'使用在韩持有', care:'新做管理', other:'其他'};
function krbPurposeText(p){ return KRB_PURPOSE[p] || p || ''; }
function krbHid(){ if(typeof isKrAccount==='function' && isKrAccount()) return krHospitalIdOfMe(); return (typeof krViewHospital==='function' ? krViewHospital() : null) || (linkedHospitalIds()[0] || 'H1'); }
function krbList(hid){ var h = HOSPITAL_DATA[hid]; if(!h) return []; if(!h.krBookings) h.krBookings = []; return h.krBookings; }
function krbFind(hid, id){ return krbList(hid).filter(function(b){ return b.id===id; })[0] || null; }
function krbMine(){ return krbList(krbHid()).filter(function(b){ return b.clinicId===CURRENT_CLINIC_ID; }); }
function krbBlockRemove(hid, id){ var h = HOSPITAL_DATA[hid]; if(!h) return; Object.keys(h.directorSchedule||{}).forEach(function(n){ h.directorSchedule[n] = (h.directorSchedule[n]||[]).filter(function(b){ return b.bookingId!==id; }); }); }
function krbBlockSync(hid, bk){
  krbBlockRemove(hid, bk.id);
  if(['pending','confirmed','done'].indexOf(bk.status)<0) return;
  var h = HOSPITAL_DATA[hid]; h.directorSchedule = h.directorSchedule || {};
  (h.directorSchedule[bk.director] = h.directorSchedule[bk.director] || []).push({id:'bk'+bk.id, bookingId:bk.id, kind:'预约', who:bk.director, date:bk.date, time:bk.time, end:bk.end, clinicId:bk.clinicId, name:bk.clientName, status:bk.status==='pending' ? '待确认' : '已确认', caseId:bk.caseId||'', done:bk.status==='done'});
  normSchedBlocks(hid);
}
function krbOffText(hid, date, time){
  var s = timeToMin(time), e = s + 30, hr = hospitalHours(hid), lu = hospitalLunch(hid), cf = hospitalClosedFrom(hid, date), cb = hospitalClosedBefore(hid, date);
  if(lu && s >= timeToMin(lu.from) && s < timeToMin(lu.to)) return '这是医院午休时间';
  if(s < timeToMin(hr.open) || e > timeToMin(hr.close) || (cf && e > timeToMin(cf)) || (cb && s < timeToMin(cb))) return '这是医院营业时间外';
  return '';
}
function krbTimeOptions(hid, sel){
  var hr = hospitalHours(hid), o = '', a = Math.max(0, timeToMin(hr.open)-120), z = Math.min(23*60+30, timeToMin(hr.close)+120);
  for(var m = a; m <= z; m += 30){ var t0 = minToTime(m); o += '<option'+(t0===sel ? ' selected' : '')+'>'+t0+'</option>'; }
  return o;
}
function krbInPast(date, time){ var cl = krToClinic(date, time); return new Date(cl.date+'T'+cl.time+':00').getTime() < demoNow().getTime(); }
function krbEsc(x){ return String(x==null ? '' : x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function krbOverlay(id){ var ov = document.getElementById(id); if(!ov){ ov = document.createElement('div'); ov.id = id; ov.className = 'modal-overlay'; ov.style.zIndex = 90; ov.onclick = function(e){ if(e.target===ov) ov.classList.remove('open'); }; document.body.appendChild(ov); } return ov; }
function krbSlotLabel(b){ var cl = krToClinic(b.date, b.time); return b.date+' '+b.time+'（韩国）· '+cl.time+'（印尼）'; }

/* ================= IN 端 ================= */
var KRB = null;
function krbClients(){ var seen = {}, out = []; CASE_ITEMS.forEach(function(c){ if(c.krVisit || seen[c.name]) return; if(typeof krAllItems==='function' && krAllItems(c).some(function(it){ return !it.cancelled; })){ seen[c.name] = 1; out.push(c.name); } }); return out.sort(); }
/* CMD-1014-18 三·4：KR 医院日程里可占位的时段 hover 粉色（同本院日程，#FADADD）；休诊日 / 过去的时段不亮 */
function krBookHover(el, ev, baseMin){
  var t = ev.target; if(t && t.closest){ var inner = t.closest('[onclick]'); if(inner && inner!==el){ krBookHoverOff(el); return; } }
  var ds = el.getAttribute('data-ds'), hid = krViewHospital(); if(!hid || hospitalClosedOn(hid, ds)){ krBookHoverOff(el); return; }
  var y = ev.clientY - el.getBoundingClientRect().top, slot = Math.floor(y/KR_ROW_PX), m = baseMin + slot*SLOT_MIN;
  if(krbInPast(ds, minToTime(m))){ krBookHoverOff(el); return; }
  var hl = el.querySelector('.krb-hl'); if(!hl){ hl = document.createElement('div'); hl.className = 'krb-hl'; hl.style.cssText = 'position:absolute;left:0;right:0;background:#FADADD;pointer-events:none;z-index:0;height:'+KR_ROW_PX+'px;'; el.insertBefore(hl, el.firstChild); }
  hl.style.top = (slot*KR_ROW_PX)+'px';
}
function krBookHoverOff(el){ var hl = el.querySelector('.krb-hl'); if(hl) hl.remove(); }
function krBookCellClick(ds, ev, el, baseMin){
  var t = ev && ev.target; if(t && t.closest){ var inner = t.closest('[onclick]'); if(inner && inner!==el) return; } /* 点在预约块 / 案件块上由它们自己处理 */
  var hid = krViewHospital(); if(!hid) return;
  if(hospitalClosedOn(hid, ds)){ alert(ds+' 是医院休诊日，不能预约'); return; }
  var y = ev.clientY - el.getBoundingClientRect().top, m = baseMin + Math.floor(y/KR_ROW_PX)*SLOT_MIN;
  var dirs = krViewIsAll() ? hospitalDirectorNames(hid) : krViewDirs();
  KRB = {hid:hid, date:ds, time:minToTime(Math.min(m, 23*60+30)), director:dirs[0]||'', client:'', purpose:'hold', note:'', replaceId:null, info:'', err:''};
  krbRender(); krbOverlay('krb-overlay').classList.add('open');
}
function krBookReselectOpen(id){
  var hid = krbHid(), b = krbFind(hid, id); if(!b) return;
  KRB = {hid:hid, date:(b.suggest && b.suggest.date) || b.date, time:(b.suggest && b.suggest.time) || b.time, director:b.director, client:b.clientName, purpose:b.purpose, note:b.note||'', replaceId:b.id, info:'KR '+(b.reselectKind==='change' ? '建议改时间' : '无法安排')+'：'+(b.reselectReason||'—')+(b.suggest ? '（建议 '+b.suggest.date+' '+b.suggest.time+' 韩国时间）' : ''), err:''};
  krbRender(); krbOverlay('krb-overlay').classList.add('open');
}
function krbRender(){
  var f = KRB, ov = krbOverlay('krb-overlay'); if(!f) return;
  var inp = 'width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;', row = function(k, v){ return '<div style="margin-bottom:10px;"><div style="font-size:12px;font-weight:700;margin-bottom:4px;">'+k+'</div>'+v+'</div>'; };
  var clients = krbClients(), dirs = hospitalDirectorNames(f.hid);
  ov.innerHTML = '<div class="modal-box" style="width:440px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">'+(f.replaceId ? '重选预约时间' : '在 KR 医院日程占位预约')+'</b><span style="cursor:pointer;" onclick="document.getElementById(\'krb-overlay\').classList.remove(\'open\')">✕</span></div>'+
    (f.info ? '<div style="font-size:12px;background:#FBF0C9;color:#8F6F0C;border-radius:8px;padding:8px 10px;margin-bottom:10px;">'+krbEsc(f.info)+'</div>' : '')+
    row('客人（只能选有赴韩项目的）', '<select style="'+inp+'" onchange="KRB.client=this.value"><option value="">请选择</option>'+clients.map(function(n){ return '<option'+(f.client===n ? ' selected' : '')+'>'+krbEsc(n)+'</option>'; }).join('')+'</select>')+
    row('来访目的', '<select style="'+inp+'" onchange="KRB.purpose=this.value">'+Object.keys(KRB_PURPOSE).map(function(k){ return '<option value="'+k+'"'+(f.purpose===k ? ' selected' : '')+'>'+KRB_PURPOSE[k]+'</option>'; }).join('')+'</select>')+
    row('院长', '<select style="'+inp+'" onchange="KRB.director=this.value">'+dirs.map(function(n){ return '<option'+(f.director===n ? ' selected' : '')+'>'+krbEsc(n)+'</option>'; }).join('')+'</select>')+
    '<div style="display:flex;gap:10px;">'+row('日期（韩国）', '<input type="date" value="'+f.date+'" style="'+inp+'" onchange="KRB.date=this.value">').replace('<div style="margin-bottom:10px;">','<div style="margin-bottom:10px;flex:1;">')+row('时间（韩国）', '<select style="'+inp+'" onchange="KRB.time=this.value">'+krbTimeOptions(f.hid, f.time)+'</select>').replace('<div style="margin-bottom:10px;">','<div style="margin-bottom:10px;flex:1;">')+'</div>'+
    row('备注', '<textarea style="'+inp+'height:60px;" oninput="KRB.note=this.value">'+krbEsc(f.note)+'</textarea>')+
    '<div id="krb-err" style="font-size:12px;color:#C1454A;min-height:18px;">'+krbEsc(f.err)+'</div>'+
    '<div style="display:flex;gap:10px;margin-top:6px;"><button class="btn-outline" style="flex:1;" onclick="document.getElementById(\'krb-overlay\').classList.remove(\'open\')">取消</button><button class="btn-primary" style="flex:1;" onclick="krbSubmit()">提交占位</button></div></div>';
}
function krbSubmit(){
  var f = KRB; if(!f) return; var fail = function(m){ f.err = m; var e = document.getElementById('krb-err'); if(e) e.textContent = m; };
  if(!f.client){ fail('请选择客人'); return; } if(!f.director){ fail('请选择院长'); return; } if(!f.date || !f.time){ fail('请选日期和时间'); return; }
  if(krbInPast(f.date, f.time)){ fail('不能约过去的时间'); return; }
  if(hospitalClosedOn(f.hid, f.date)){ fail(f.date+' 是医院休诊日，不能预约'); return; }
  var old = f.replaceId ? krbFind(f.hid, f.replaceId) : null; if(old) krbBlockRemove(f.hid, old.id); /* 重选：先拿掉旧占位再检查冲突 */
  var bad = krSurgerySlotError(f.hid, f.director, f.date, f.time, 30, null, {allowOffHours:true, use:true});
  if(bad){ if(old) krbBlockSync(f.hid, old); fail(bad); return; }
  var off = krbOffText(f.hid, f.date, f.time);
  if(off && !confirm(off+'（韩国 '+f.time+'），确定要约吗？')){ if(old) krbBlockSync(f.hid, old); return; }
  if(old){ old.status = 'replaced'; (old.history = old.history||[]).push({ts:nowFullDt(), text:'IN 重选时间，旧占位作废'}); }
  var bk = {id:'kb'+Date.now()+Math.floor(Math.random()*1000), clinicId:CURRENT_CLINIC_ID, clientName:f.client, purpose:f.purpose, director:f.director, date:f.date, time:f.time, end:minToTime(timeToMin(f.time)+30), note:(f.note||'').trim(), status:'pending', by:ME_NAME, createdAt:nowFullDt(), caseId:'', history:[{ts:nowFullDt(), text:ME_NAME+' 在 KR 医院日程占位：'+f.date+' '+f.time+'（韩国）'+f.director+'，'+krbPurposeText(f.purpose)}]};
  krbList(f.hid).push(bk); krbBlockSync(f.hid, bk);
  var n = pushKrNotif(f.hid, '预约待确认：'+f.client+' · '+f.date+' '+f.time+'（韩国）· '+f.director+' · '+krbPurposeText(f.purpose)+'（来源诊所 '+((clinicById(CURRENT_CLINIC_ID)||{}).name||'')+'）→ 请确认预约时间', {kind:'krbook', to:'coord', clinicId:CURRENT_CLINIC_ID, level:'action'});
  if(n) n.bookingId = bk.id;
  krbOverlay('krb-overlay').classList.remove('open'); KRB = null;
  Store.touch && Store.touch(); try{ renderCalendar(); todoRefresh(); }catch(e){}
  showToast('已占位，等 KR 确认', f.client+' · '+bk.date+' '+bk.time+'（韩国）', null);
}
function krBookBlockClick(id){
  var hid = krbHid(), b = krbFind(hid, id); if(!b) return;
  var ov = krbOverlay('krb-info-overlay'), st = {pending:'待 KR 确认', confirmed:'已确认', reselect:'需要重选时间', done:'已完成', cancelled:'已取消', replaced:'已作废'}[b.status] || b.status;
  ov.innerHTML = '<div class="modal-box" style="width:400px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">KR 医院预约</b><span style="cursor:pointer;" onclick="document.getElementById(\'krb-info-overlay\').classList.remove(\'open\')">✕</span></div>'+
    '<div style="font-size:13px;line-height:1.9;"><b>'+krbEsc(b.clientName)+'</b> · '+krbEsc(krbPurposeText(b.purpose))+'<br>'+krbEsc(krbSlotLabel(b))+' · '+krbEsc(b.director)+'<br>状态：<b>'+st+'</b>'+(b.note ? '<br>备注：'+krbEsc(b.note) : '')+(b.reselectReason ? '<br>KR：'+krbEsc(b.reselectReason) : '')+'</div>'+
    '<div style="display:flex;gap:10px;margin-top:14px;">'+(b.status==='pending' || b.status==='reselect' ? '<button class="btn-outline" style="flex:1;" onclick="krBookCancel(\''+b.id+'\')">取消预约</button>' : '')+(b.status==='reselect' ? '<button class="btn-primary" style="flex:1;" onclick="document.getElementById(\'krb-info-overlay\').classList.remove(\'open\');krBookReselectOpen(\''+b.id+'\')">重选时间</button>' : '')+(b.caseId ? '<button class="btn-primary" style="flex:1;" onclick="document.getElementById(\'krb-info-overlay\').classList.remove(\'open\');openCaseDetail(\''+b.caseId+'\')">查看案件</button>' : '')+'</div></div>';
  ov.classList.add('open');
}
function krBookCancel(id){
  var hid = krbHid(), b = krbFind(hid, id); if(!b || ['pending','reselect'].indexOf(b.status)<0) return;
  b.status = 'cancelled'; (b.history = b.history||[]).push({ts:nowFullDt(), text:ME_NAME+' 取消了占位'}); krbBlockRemove(hid, id);
  krbOverlay('krb-info-overlay').classList.remove('open'); Store.touch && Store.touch(); try{ renderCalendar(); todoRefresh(); }catch(e){}
}

/* ================= KR 端：确认 / 改时间 / 无法安排 / 到店 / 完成（core*：不碰界面） ================= */
function coreBookConfirm(hid, id, by){
  var b = krbFind(hid, id); if(!b || b.status!=='pending') return {ok:false, err:'这笔预约已经不是待确认'};
  krbBlockRemove(hid, id); /* 先拿掉自己的块再检查冲突 */
  var bad = krSurgerySlotError(hid, b.director, b.date, b.time, 30, null, {allowOffHours:true, use:true});
  if(bad){ krbBlockSync(hid, b); return {ok:false, err:bad}; }
  var caseId = '';
  Store.mutateClinic(b.clinicId, function(){
    var c = createReservationCase(b.clientName, null, b.date, b.time, '', '在韩到店·'+krbPurposeText(b.purpose));
    c.krVisit = {bookingId:b.id, hospitalId:hid, director:b.director, purpose:b.purpose, note:b.note||'', place:'KR 医院', confirmedBy:by, arrived:false, done:false};
    c.hospitalId = hid; c.director = b.director; c.krCoordinator = c.krCoordinator || '';
    logCaseEvent(c, by, 'KR 确认 IN 在 KR 医院日程的占位预约：'+b.date+' '+b.time+'（韩国）'+b.director+'；到店目的：'+krbPurposeText(b.purpose)+'；地点 KR 医院；从预约到店开始');
    caseId = c.id;
    pushNotif('预约', 'KR 已确认预约：'+b.clientName+' · '+b.date+' '+b.time+'（韩国）· '+b.director+'，已建立案件 '+(c.caseNo||'')+'（在韩到店）', {caseId:c.id, level:'info'});
  });
  b.status = 'confirmed'; b.caseId = caseId; (b.history = b.history||[]).push({ts:nowFullDt(), text:by+' 确认预约，建立案件'});
  krbBlockSync(hid, b);
  return {ok:true, caseId:caseId};
}
function coreBookReselect(hid, id, kind, reason, suggest, by){
  var b = krbFind(hid, id); if(!b || b.status!=='pending') return {ok:false, err:'这笔预约已经不是待确认'};
  b.status = 'reselect'; b.reselectKind = kind; b.reselectReason = reason || ''; b.suggest = suggest || null;
  (b.history = b.history||[]).push({ts:nowFullDt(), text:by+(kind==='change' ? ' 建议改时间' : ' 标记无法安排')+'：'+(reason||'—')});
  krbBlockRemove(hid, id);
  Store.mutateClinic(b.clinicId, function(){ pushNotif('预约', 'KR '+(kind==='change' ? '建议改预约时间' : '无法安排预约')+'：'+b.clientName+' · '+b.date+' '+b.time+'（韩国）；原因：'+(reason||'—')+'，请重选时间', {level:'action'}); });
  return {ok:true};
}
function coreBookArrive(hid, id, by){
  var b = krbFind(hid, id); if(!b || b.status!=='confirmed' || b.arrivedAt) return false;
  b.arrivedAt = nowFullDt(); (b.history = b.history||[]).push({ts:nowFullDt(), text:by+' 标记客人已到店'});
  Store.mutateClinic(b.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0]; if(c && c.krVisit){ c.krVisit.arrived = true; logCaseEvent(c, by, '客人已到店（KR 医院）'); } });
  return true;
}
/* 使用在韩持有：这位客人在本诊所各案件里「在韩持有」的项目（还有剩余次数） */
function krbHoldChoices(clinicId, clientName){
  var out = []; Store.withClinic(clinicId, function(){ CASE_ITEMS.forEach(function(c){ if(c.name!==clientName || c.krVisit) return; (c.procedureItems||[]).forEach(function(it){ if(it.heldOver && !it.holdDone && holdItemLeft(c, it)>0) out.push({caseId:c.id, caseNo:c.caseNo, name:it.name, left:holdItemLeft(c, it)}); }); }); });
  return out;
}
function coreBookDone(hid, id, did, by){
  var b = krbFind(hid, id); if(!b || b.status!=='confirmed' || !b.arrivedAt) return {ok:false, err:'要先标记客人已到店'};
  did = did || {kind:b.purpose};
  if(did.kind==='hold'){ var ch = krbHoldChoices(b.clinicId, b.clientName).filter(function(x){ return x.caseId===did.caseId && x.name===did.name; })[0]; if(!ch) return {ok:false, err:'请选择要使用的在韩持有项目'}; }
  if(did.kind==='care' && !did.name) return {ok:false, err:'请选择做了哪个管理项目'};
  var text = '';
  Store.mutateClinic(b.clinicId, function(){
    if(did.kind==='hold'){ var src = CASE_ITEMS.filter(function(x){ return x.id===did.caseId; })[0], it = src && (src.procedureItems||[]).filter(function(x){ return x.heldOver && x.name===did.name; })[0];
      if(it){ it.holdUsed = (it.holdUsed||0)+1; if(it.holdUsed >= (it.qty||1)) it.holdDone = true; logCaseEvent(src, by, '使用在韩持有「'+it.name+'」1 次（在韩到店预约，案件 '+((CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0]||{}).caseNo||'')+'）'); } text = '使用在韩持有「'+did.name+'」'; }
    else if(did.kind==='care') text = '新做管理「'+did.name+'」（韩国现场收费，不进平台结算）';
    else text = '其他'+(did.note ? '：'+did.note : '');
    var c = CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0];
    if(c && c.krVisit){ c.krVisit.done = true; c.krVisit.did = did; logCaseEvent(c, by, '在韩到店完成：'+text); finishCase(c); }
  });
  b.status = 'done'; b.did = did; (b.history = b.history||[]).push({ts:nowFullDt(), text:by+' 标记完成：'+text});
  krbBlockSync(hid, b);
  return {ok:true};
}

/* ================= KR 端界面 ================= */
var KRBK = null;
function krBookOpen(id){
  var hid = krHospitalIdOfMe(), b = krbFind(hid, id); if(!b) return;
  KRBK = {id:id, mode:null, date:b.date, time:b.time, reason:'', did:b.purpose, hold:'', care:'', note:'', err:''};
  krbRenderKr(); krbOverlay('krb-kr-overlay').classList.add('open');
}
function krbRenderKr(){
  var f = KRBK, hid = krHospitalIdOfMe(), b = f && krbFind(hid, f.id), ov = krbOverlay('krb-kr-overlay'); if(!b) return;
  var can = krCan(), cn = (clinicById(b.clinicId)||{}).name || '', inp = 'width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;box-sizing:border-box;';
  var st = {pending:'待 KR 确认', confirmed:b.arrivedAt ? '已到店' : '已确认', reselect:'IN 重选时间中', done:'已完成', cancelled:'已取消', replaced:'已作废'}[b.status] || b.status;
  var head = '<div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">IN 预约（KR 医院）</b><span style="cursor:pointer;" onclick="document.getElementById(\'krb-kr-overlay\').classList.remove(\'open\')">✕</span></div>';
  var info = '<div style="font-size:13px;line-height:1.9;margin-bottom:10px;"><b>'+krbEsc(b.clientName)+'</b> · '+krbEsc(krbPurposeText(b.purpose))+'（'+krbEsc(cn)+'）<br>'+krbEsc(b.date+' '+b.time)+'（韩国）· '+krbEsc(b.director)+'<br>状态：<b>'+st+'</b>'+(b.note ? '<br>备注：'+krbEsc(b.note) : '')+(b.caseId ? '<br><a href="#" onclick="document.getElementById(\'krb-kr-overlay\').classList.remove(\'open\');krShowCase(\''+b.clinicId+'\',\''+b.caseId+'\');return false;" style="color:var(--terracotta);">打开案件</a>' : '')+'</div>';
  var body = '';
  if(b.status==='pending' && can){
    if(f.mode==='change') body = '<div style="display:flex;gap:10px;margin-bottom:8px;"><input type="date" value="'+f.date+'" style="'+inp+'" onchange="KRBK.date=this.value"><select style="'+inp+'" onchange="KRBK.time=this.value">'+krbTimeOptions(hid, f.time)+'</select></div><textarea placeholder="原因（选填）" style="'+inp+'height:56px;" oninput="KRBK.reason=this.value"></textarea><div style="display:flex;gap:10px;margin-top:10px;"><button class="btn-outline" style="flex:1;" onclick="KRBK.mode=null;krbRenderKr()">返回</button><button class="btn-primary" style="flex:1;" onclick="krbDoReselect(\'change\')">发给 IN 重选</button></div>';
    else if(f.mode==='reject') body = '<textarea placeholder="无法安排的原因（选填）" style="'+inp+'height:56px;" oninput="KRBK.reason=this.value"></textarea><div style="display:flex;gap:10px;margin-top:10px;"><button class="btn-outline" style="flex:1;" onclick="KRBK.mode=null;krbRenderKr()">返回</button><button class="btn-primary" style="flex:1;" onclick="krbDoReselect(\'reject\')">确认无法安排</button></div>';
    else body = '<div style="display:flex;gap:8px;"><button class="btn-primary" style="flex:1;" onclick="krbDoConfirm()">确认</button><button class="btn-outline" style="flex:1;" onclick="KRBK.mode=\'change\';krbRenderKr()">改时间</button><button class="btn-outline" style="flex:1;" onclick="KRBK.mode=\'reject\';krbRenderKr()">无法安排</button></div>';
  } else if(b.status==='confirmed' && can){
    if(!b.arrivedAt) body = '<button class="btn-primary" style="width:100%;" onclick="krbDoArrive()">客人已到店</button>';
    else {
      var opts = krbHoldChoices(b.clinicId, b.clientName), care = krLocalLib(hid).map(function(p){ return p.name; });
      body = '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">做了什么</div><select style="'+inp+'margin-bottom:8px;" onchange="KRBK.did=this.value;krbRenderKr()"><option value="hold"'+(f.did==='hold' ? ' selected' : '')+'>使用在韩持有</option><option value="care"'+(f.did==='care' ? ' selected' : '')+'>新做管理</option><option value="other"'+(f.did==='other' ? ' selected' : '')+'>其他</option></select>'+
        (f.did==='hold' ? '<select style="'+inp+'" onchange="KRBK.hold=this.value"><option value="">'+(opts.length ? '请选择持有项目' : '这位客人没有可用的在韩持有')+'</option>'+opts.map(function(x){ return '<option value="'+x.caseId+'|'+krbEsc(x.name)+'"'+(f.hold===x.caseId+'|'+x.name ? ' selected' : '')+'>'+krbEsc(x.name)+'（'+x.caseNo+'，剩 '+x.left+' 次）</option>'; }).join('')+'</select>' :
        f.did==='care' ? '<select style="'+inp+'" onchange="KRBK.care=this.value"><option value="">请选择管理项目</option>'+care.map(function(n){ return '<option'+(f.care===n ? ' selected' : '')+'>'+krbEsc(n)+'</option>'; }).join('')+'</select><div style="font-size:11px;color:var(--muted);margin-top:4px;">管理项目在韩国现场收费，平台只记录项目名。</div>' :
        '<textarea placeholder="备注" style="'+inp+'height:56px;" oninput="KRBK.note=this.value"></textarea>')+
        '<button class="btn-primary" style="width:100%;margin-top:10px;" onclick="krbDoDone()">标记完成</button>';
    }
  } else if(b.status==='pending' || b.status==='confirmed') body = '<div style="font-size:12px;color:var(--muted);">只有室长 / 管理者能处理这笔预约。</div>';
  ov.innerHTML = '<div class="modal-box" style="width:420px;">'+head+info+body+'<div id="krb-kr-err" style="font-size:12px;color:#C1454A;min-height:16px;margin-top:6px;">'+krbEsc(f.err)+'</div></div>';
}
function krbKrDone(res){ var f = KRBK; if(!res.ok){ f.err = res.err || '操作失败'; krbRenderKr(); return false; } f.err = ''; Store.touch && Store.touch(); try{ krRefreshAll(); }catch(e){} return true; }
function krbDoConfirm(){ var r = coreBookConfirm(krHospitalIdOfMe(), KRBK.id, ME_NAME); if(krbKrDone(r)){ krbRenderKr(); } }
function krbDoReselect(kind){ var f = KRBK; if(kind==='change' && krbInPast(f.date, f.time)){ f.err = '不能建议过去的时间'; krbRenderKr(); return; } var r = coreBookReselect(krHospitalIdOfMe(), f.id, kind, (f.reason||'').trim(), kind==='change' ? {date:f.date, time:f.time} : null, ME_NAME); if(krbKrDone(r)){ krbOverlay('krb-kr-overlay').classList.remove('open'); } }
function krbDoArrive(){ if(coreBookArrive(krHospitalIdOfMe(), KRBK.id, ME_NAME)){ Store.touch && Store.touch(); try{ krRefreshAll(); }catch(e){} krbRenderKr(); } }
function krbDoDone(){ var f = KRBK, did = f.did==='hold' ? {kind:'hold', caseId:(f.hold||'').split('|')[0], name:(f.hold||'').split('|').slice(1).join('|')} : (f.did==='care' ? {kind:'care', name:f.care} : {kind:'other', note:(f.note||'').trim()}); var r = coreBookDone(krHospitalIdOfMe(), f.id, did, ME_NAME); if(krbKrDone(r)){ krbOverlay('krb-kr-overlay').classList.remove('open'); } }

/* KR 日历上的预约块（kr.js 的 krcBlockHtml 遇到 type '预约' 时调用） */
function krbBlockHtml(r0, showWho){
  var b = r0.b, s = Math.max(timeToMin(b.time), KRC_H0*60), e = Math.min(timeToMin(b.end), KRC_H1*60); if(e <= s) e = s + 20;
  var w = 100 / r0.n, top = (s - KRC_H0*60) * KRC_PX / 60, hgt = Math.max(16, (e - s) * KRC_PX / 60 - 2), pend = b.status==='待确认', cn = (clinicById(b.clinicId)||{}).name || '';
  var style = 'position:absolute;left:calc('+(r0.lane*w)+'% + 1px);width:calc('+w+'% - 3px);top:'+top+'px;height:'+hgt+'px;border-radius:5px;padding:2px 5px;font-size:10px;line-height:1.3;overflow:hidden;cursor:pointer;z-index:2;'+(b.done ? 'opacity:.45;text-decoration:line-through;' : '')+
    (pend ? 'background:#fff;color:#2F6B4A;border:1.5px dashed #3F7A55;' : 'background:#E4EEE7;color:#2F6B4A;border:1px solid #B5D3C0;');
  var label = (pend ? '待 KR 确认 · ' : '预约 · ')+(b.name||'')+' · '+cn;
  return '<div onclick="event.stopPropagation();krBookOpen(\''+b.bookingId+'\')" title="'+krbEsc(b.time+'–'+b.end+' '+label)+'" style="'+style+'"><b>'+krbEsc(b.time)+'</b> '+krbEsc(label)+(showWho ? '<br>'+krbEsc(b.who) : '')+'</div>';
}
