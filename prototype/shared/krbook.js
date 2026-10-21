/* CMD-1014-16 三：IN 在「KR 医院日程」帮客人占位预约 → KR 确认后建新案件（在韩到店） / 无法安排或改时间 → IN 重选
   数据：HOSPITAL_DATA[医院].krBookings = [{id, clinicId, clientName, purpose(hold|care|other), director, date, time, end, note, status(pending|confirmed|reselect|done|cancelled|replaced),
   by, createdAt, caseId, reselectKind(change|reject), reselectReason, suggest:{date,time}, arrivedAt, did, history[]}]；
   日历上的块 = 院长日程里一条 kind:'预约' 的块（directorSchedule[院长]，bookingId 对应），待确认 = 虚线块，确认后 = 实线块；其他诊所的预约在 IN 端只显示浅灰无字。
   流程：IN 点 KR 医院日程周视图的空白时段 → 预约窗（客人只能选有赴韩项目的 / 来访目的 / 院长 / 备注；撞不可预约 / OFF / 休诊挡住并说明，午休 / 营业时间外弹确认）→ 占位（还不建案件）
   → KR 待办「确认预约时间」：［确认］= 正式预约 + 建立新案件（从预约到店开始，地点 KR 医院，c.krVisit，IN 和 KR 都看得到）+ IN 收到消息；改时间 /［无法安排］→ IN 待办「重选时间」
   → 到那天 KR 日历点预约 →［客人已到院］→ 用持有 / 新做管理 / 其他 → ［标记完成］（案件结案：在韩到店完成）。
   我的判断（待确认）：新做管理在韩国收费，不进平台结算，只记录项目名；使用在韩持有 = 扣减客人在韩持有项目一次。 */
var KRB_HOSP = '__全院'; /* CMD-1014-18 四·2：占位预约不选院长，块挂在「全院」下（directorSchedule[KRB_HOSP]） */
var KRB_PURPOSE = {carebook:'在韩术后管理预约', holdbook:'在韩持有项目管理预约', newvisit:'新增访问', hold:'使用在韩持有', care:'新做管理', other:'其他'}; /* CMD-1020-18：IN 占位的来访目的只有前 3 个，后 3 个是旧数据 */
var KRB_PURPOSE_NEW = ['carebook', 'holdbook', 'newvisit'], KRB_NEWVISIT = ['术后复诊', '皮肤管理', '面诊商谈'];
/* 占位 / 预约的完整目的文字：把勾选的项目 / 新增访问的类型写清楚（KR 收到的占位上就是这行） */
function krbPurposeFull(b){ var t = KRB_PURPOSE[b.purpose] || b.purpose || ''; if(b.purpose==='newvisit' && b.sub) t += '：'+b.sub; else if((b.purpose==='carebook' || b.purpose==='holdbook') && (b.items||[]).length) t += '：'+b.items.map(function(x){ return x.label; }).join('、'); return t; }
/* IN 弹窗里可勾的项目：这位客人在本诊所各案件里韩国要做、还没约的术后管理（careSlotList）/ 韩国持有的管理项目（krCbMgItems，同名两笔按 iid 分开，带购买日期 / 在韩增加标签） */
function krbCandidates(client, purpose){
  var out = [];
  (CASE_ITEMS||[]).forEach(function(c){
    if(c.name!==client || c.krVisit || c.stage==='cancelled' || !c.krBalancePaid) return;
    if(purpose==='carebook'){ try{ careSlotList(c).forEach(function(sl){ if(sl.place==='IN') return; out.push({key:'care|'+c.id+'|'+sl.item+'|'+sl.i+'|'+(sl.reuse||'')+'|'+(sl.sug||''), kind:'care', caseId:c.id, caseNo:c.caseNo, label:(sl.x.name||sl.x.mgmt)+'（'+buyName(sl.item)+(sl.sug ? ' · 建议 '+String(sl.sug).slice(5).replace('-', '/') : '')+'）'}); }); }catch(e){} }
    if(purpose==='holdbook'){ try{ krCbMgItems(c).forEach(function(m){ var it = itemByKey(c, m.iid||m.name) || {}; out.push({key:'hold|'+c.id+'|'+(m.iid||m.name), kind:'hold', caseId:c.id, caseNo:c.caseNo, iid:m.iid||'', label:buyName(m.name)+'（剩 '+m.max+' 次'+' · 购买 '+krbBuyDate(c, it)+((it.krAddOn || it.preBalanceAdd) ? ' · 在韩增加' : '')+(it.pendingPay ? ' · 待付款' : '')+'）'}); }); }catch(e){} }
  });
  return out;
}
function krbBuyDate(c, it){ var b = (c.settlementBatches||[]).filter(function(x){ return x.id===it.batchId; })[0]; return b && b.time ? fmtUtc(b.time).slice(2, 10) : '—'; }
function krbDidDefault(p){ return p==='holdbook' ? 'hold' : (['hold','care','other'].indexOf(p)>-1 ? p : 'other'); }
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
  (h.directorSchedule[KRB_HOSP] = h.directorSchedule[KRB_HOSP] || []).push({id:'bk'+bk.id, bookingId:bk.id, kind:'预约', who:KRB_HOSP, date:bk.date, time:bk.time, end:bk.end, clinicId:bk.clinicId, name:bk.clientName, status:bk.status==='pending' ? '待确认' : '已确认', caseId:bk.caseId||'', done:bk.status==='done'});
  normSchedBlocks(hid);
}
function krbOffText(hid, date, time){
  var s = timeToMin(time), e = s + 30, hr = hospitalHours(hid), lu = hospitalLunch(hid), cf = hospitalClosedFrom(hid, date), cb = hospitalClosedBefore(hid, date);
  if(lu && s >= timeToMin(lu.from) && s < timeToMin(lu.to)) return '这是医院午休时间';
  if(s < timeToMin(hr.open) || e > timeToMin(hr.close) || (cf && e > timeToMin(cf)) || (cb && s < timeToMin(cb))) return '这是医院营业时间外';
  return '';
}
/* 占位预约只看医院：休诊日 / 部分时段休诊挡住（不看院长 OFF / 不可预约 / 其他预约）；午休、营业时间外另弹确认（krbOffText） */
function krbClosedText(hid, date, time){
  if(hospitalClosedOn(hid, date)) return date+' 是医院休诊日，不能预约';
  var s = timeToMin(time), e = s + 30, cf = hospitalClosedFrom(hid, date), cb = hospitalClosedBefore(hid, date);
  if((cf && e > timeToMin(cf)) || (cb && s < timeToMin(cb))) return '这个时间医院休诊（'+time+'），不能预约';
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
  KRB = {hid:hid, date:ds, time:minToTime(Math.min(m, 23*60+30)), director:'', client:'', purpose:'carebook', items:[], sub:'术后复诊', note:'', replaceId:null, info:'', err:''};
  krbRender(); krbOverlay('krb-overlay').classList.add('open');
}
function krBookReselectOpen(id){
  var hid = krbHid(), b = krbFind(hid, id); if(!b) return;
  KRB = {hid:hid, date:(b.suggest && b.suggest.date) || b.date, time:(b.suggest && b.suggest.time) || b.time, director:'', client:b.clientName, purpose:b.purpose, items:[], sub:b.sub||'术后复诊', note:b.note||'', replaceId:b.id, info:'KR '+(b.reselectKind==='change' ? '建议改时间' : '无法安排')+'：'+(b.reselectReason||'—')+(b.suggest ? '（建议 '+b.suggest.date+' '+b.suggest.time+' 韩国时间）' : ''), err:''};
  krbRender(); krbOverlay('krb-overlay').classList.add('open');
}
function krbRender(){
  var f = KRB, ov = krbOverlay('krb-overlay'); if(!f) return;
  var inp = 'width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;', row = function(k, v){ return '<div style="margin-bottom:10px;"><div style="font-size:12px;font-weight:700;margin-bottom:4px;">'+k+'</div>'+v+'</div>'; };
  var clients = krbClients();
  ov.innerHTML = '<div class="modal-box" style="width:440px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">'+(f.replaceId ? '重选预约时间' : '在 KR 医院日程占位预约')+'</b><span style="cursor:pointer;" onclick="document.getElementById(\'krb-overlay\').classList.remove(\'open\')">✕</span></div>'+
    (f.info ? '<div style="font-size:12px;background:#FBF0C9;color:#8F6F0C;border-radius:8px;padding:8px 10px;margin-bottom:10px;">'+krbEsc(f.info)+'</div>' : '')+
    row('客人（只能选有赴韩项目的）', '<select style="'+inp+'" onchange="KRB.client=this.value"><option value="">请选择</option>'+clients.map(function(n){ return '<option'+(f.client===n ? ' selected' : '')+'>'+krbEsc(n)+'</option>'; }).join('')+'</select>')+
    row('来访目的', '<select style="'+inp+'" onchange="KRB.purpose=this.value;KRB.items=[];krbRender()">'+(KRB_PURPOSE_NEW.indexOf(f.purpose)<0 ? [f.purpose].concat(KRB_PURPOSE_NEW) : KRB_PURPOSE_NEW).map(function(k){ return '<option value="'+k+'"'+(f.purpose===k ? ' selected' : '')+'>'+KRB_PURPOSE[k]+'</option>'; }).join('')+'</select>')+
    '<div style="display:flex;gap:10px;">'+row('日期（韩国）', '<input type="date" value="'+f.date+'" style="'+inp+'" onchange="KRB.date=this.value">').replace('<div style="margin-bottom:10px;">','<div style="margin-bottom:10px;flex:1;">')+row('时间（韩国）', '<select style="'+inp+'" onchange="KRB.time=this.value">'+krbTimeOptions(f.hid, f.time)+'</select>').replace('<div style="margin-bottom:10px;">','<div style="margin-bottom:10px;flex:1;">')+'</div>'+
    krbPurposeExtra(f, inp, row)+
    row('备注', '<textarea style="'+inp+'height:60px;" oninput="KRB.note=this.value">'+krbEsc(f.note)+'</textarea>')+
    '<div id="krb-err" style="font-size:12px;color:#C1454A;min-height:18px;">'+krbEsc(f.err)+'</div>'+
    '<div style="display:flex;gap:10px;margin-top:6px;"><button class="btn-outline" style="flex:1;" onclick="document.getElementById(\'krb-overlay\').classList.remove(\'open\')">取消</button><button class="btn-primary" style="flex:1;" onclick="krbSubmit()">提交占位</button></div></div>';
}
function krbPurposeExtra(f, inp, row){
  if(f.purpose==='newvisit') return row('新增访问类型', '<select style="'+inp+'" onchange="KRB.sub=this.value">'+KRB_NEWVISIT.map(function(k){ return '<option'+(f.sub===k ? ' selected' : '')+'>'+k+'</option>'; }).join('')+'</select>');
  if(f.purpose!=='carebook' && f.purpose!=='holdbook') return '';
  if(!f.client) return row(f.purpose==='carebook' ? '要做的术后管理' : '要做的管理项目', '<div style="font-size:12px;color:var(--muted);">先选客人</div>');
  var cands = krbCandidates(f.client, f.purpose);
  return row(f.purpose==='carebook' ? '要做的术后管理（可多选，至少 1 项）' : '要做的持有项目（可多选，至少 1 项）', cands.length ? cands.map(function(x){ var on = (f.items||[]).some(function(y){ return y.key===x.key; }); return '<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:4px 0;cursor:pointer;"><input type="checkbox" '+(on ? 'checked ' : '')+'onchange="krbToggleItem(\''+krbEsc(x.key).replace(/'/g,'')+'\',this.checked)"> <span>'+krbEsc(x.label)+'</span><span style="color:var(--muted);font-size:12px;">'+krbEsc(x.caseNo||'')+'</span></label>'; }).join('') : '<div style="font-size:12px;color:var(--muted);">这位客人现在没有'+(f.purpose==='carebook' ? '韩国还没约的术后管理' : '韩国持有的管理项目')+'</div>');
}
function krbToggleItem(key, on){ var f = KRB; if(!f) return; var x = krbCandidates(f.client, f.purpose).filter(function(y){ return y.key===key; })[0]; if(!x) return; f.items = (f.items||[]).filter(function(y){ return y.key!==key; }); if(on) f.items.push({key:x.key, kind:x.kind, caseId:x.caseId, iid:x.iid||'', label:x.label}); }
function krbSubmit(){
  var f = KRB; if(!f) return; var fail = function(m){ f.err = m; var e = document.getElementById('krb-err'); if(e) e.textContent = m; };
  if(!f.client){ fail('请选择客人'); return; } if(!f.date || !f.time){ fail('请选日期和时间'); return; }
  if((f.purpose==='carebook' || f.purpose==='holdbook') && !(f.items||[]).length){ fail('请至少勾选一项要做的'+(f.purpose==='carebook' ? '术后管理' : '管理项目')); return; }
  if(krbInPast(f.date, f.time)){ fail('不能约过去的时间'); return; }
  var old = f.replaceId ? krbFind(f.hid, f.replaceId) : null; if(old) krbBlockRemove(f.hid, old.id); /* 重选：先拿掉旧占位再检查冲突 */
  var bad = krbClosedText(f.hid, f.date, f.time);
  if(bad){ if(old) krbBlockSync(f.hid, old); fail(bad); return; }
  var off = krbOffText(f.hid, f.date, f.time);
  if(off && !confirm(off+'（韩国 '+f.time+'），确定要约吗？')){ if(old) krbBlockSync(f.hid, old); return; }
  if(old){ old.status = 'replaced'; (old.history = old.history||[]).push({ts:nowFullDt(), text:'IN 重选时间，旧占位作废'}); }
  var bk = {id:'kb'+Date.now()+Math.floor(Math.random()*1000), clinicId:CURRENT_CLINIC_ID, clientName:f.client, purpose:f.purpose, items:(f.purpose==='carebook' || f.purpose==='holdbook') ? (f.items||[]).slice() : [], sub:f.purpose==='newvisit' ? f.sub : '', director:'', date:f.date, time:f.time, end:minToTime(timeToMin(f.time)+30), note:(f.note||'').trim(), status:'pending', by:ME_NAME, createdAt:nowFullDt(), caseId:'', history:[{ts:nowFullDt(), text:ME_NAME+' 在 KR 医院日程占位：'+f.date+' '+f.time+'（韩国）'+f.director+'，'+krbPurposeFull({purpose:f.purpose, items:f.items, sub:f.sub})}]};
  krbList(f.hid).push(bk); krbBlockSync(f.hid, bk);
  var n = pushKrNotif(f.hid, '预约待确认：'+f.client+' · '+f.date+' '+f.time+'（韩国）· '+krbPurposeFull({purpose:f.purpose, items:f.items, sub:f.sub})+'（来源诊所 '+((clinicById(CURRENT_CLINIC_ID)||{}).name||'')+'）→ 请确认预约时间', {kind:'krbook', to:'coord', clinicId:CURRENT_CLINIC_ID, level:'action'});
  if(n) n.bookingId = bk.id;
  krbOverlay('krb-overlay').classList.remove('open'); KRB = null;
  Store.touch && Store.touch(); try{ renderCalendar(); todoRefresh(); }catch(e){}
  showToast('已占位，等 KR 确认', f.client+' · '+bk.date+' '+bk.time+'（韩国）', null);
}
function krBookBlockClick(id){
  var hid = krbHid(), b = krbFind(hid, id); if(!b) return;
  var ov = krbOverlay('krb-info-overlay'), st = {pending:'待 KR 确认', confirmed:'已确认', reselect:'需要重选时间', done:'已完成', cancelled:'已取消', replaced:'已作废'}[b.status] || b.status;
  ov.innerHTML = '<div class="modal-box" style="width:400px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">KR 医院预约</b><span style="cursor:pointer;" onclick="document.getElementById(\'krb-info-overlay\').classList.remove(\'open\')">✕</span></div>'+
    '<div style="font-size:13px;line-height:1.9;"><b>'+krbEsc(b.clientName)+'</b> · '+krbEsc(krbPurposeFull(b))+'<br>'+krbEsc(krbSlotLabel(b))+'<br>状态：<b>'+st+'</b>'+(b.note ? '<br>备注：'+krbEsc(b.note) : '')+(b.reselectReason ? '<br>KR：'+krbEsc(b.reselectReason) : '')+'</div>'+
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
  var bad = krbClosedText(hid, b.date, b.time);
  if(bad){ krbBlockSync(hid, b); return {ok:false, err:bad}; }
  var caseId = '';
  Store.mutateClinic(b.clinicId, function(){
    var exK = CASE_ITEMS.filter(function(x){ return x.krVisit && !x.krVisit.arrived && !x.krVisit.done && x.name===b.clientName && x.visitDate===b.date && x.subState!=='cancelled' && !x.visitClosed; })[0]; /* CMD-1021-16 三：同一客人那天已有还没到的 KR 预约 → 合并（时间以原预约为准） */
    var c = exK || createReservationCase(b.clientName, null, b.date, b.time, '', '在韩到院·'+krbPurposeFull(b));
    if(exK){ b.time = exK.visitTime; exK.krVisit.items = (exK.krVisit.items||[]).concat(b.items||[]); logCaseEvent(exK, by, '同一天又有一笔 KR 预约（'+krbPurposeFull(b)+'）已合并到这次预约（时间以原预约 '+exK.visitTime+' 为准）'); caseId = exK.id; pushNotif('预约', 'KR 已确认预约：'+b.clientName+' · '+b.date+' '+exK.visitTime+'（韩国），已合并到案件 '+(exK.caseNo||'')+' 的预约', {caseId:exK.id, level:'info'}); return; }
    c.krVisit = {bookingId:b.id, hospitalId:hid, director:'', purpose:b.purpose, items:(b.items||[]).slice(), sub:b.sub||'', note:b.note||'', place:'KR 医院', confirmedBy:by, arrived:false, done:false};
    c.hospitalId = hid; c.director = ''; c.krCoordinator = c.krCoordinator || '';
    updateCaseStage(c); /* CMD-1015-17：阶段 = 在韩管理（IN / KR 的案件管理都看得到） */
    logCaseEvent(c, by, 'KR 确认 IN 在 KR 医院日程的占位预约：'+b.date+' '+b.time+'（韩国）；到店目的：'+krbPurposeFull(b)+'；地点 KR 医院；从预约到店开始');
    caseId = c.id;
    pushNotif('预约', 'KR 已确认预约：'+b.clientName+' · '+b.date+' '+b.time+'（韩国），已建立案件 '+(c.caseNo||'')+'（在韩到店）', {caseId:c.id, level:'info'});
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
/* CMD-1014-18 四·18：还没到预约当天不能标「客人已到院」；原型用［模拟到当日］（b.simDay） */
function coreBookSimDay(hid, id){ var b = krbFind(hid, id); if(!b || b.status!=='confirmed') return false; b.simDay = true; return true; }
function krbArriveAllowed(b){ return b.simDay || b.date <= krToday(); }
function coreBookArrive(hid, id, by){
  var b = krbFind(hid, id); if(!b || b.status!=='confirmed' || b.arrivedAt || !krbArriveAllowed(b)) return false;
  b.arrivedAt = nowFullDt(); (b.history = b.history||[]).push({ts:nowFullDt(), text:by+' 标记客人已到院'});
  Store.mutateClinic(b.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0]; if(c && c.krVisit){ c.krVisit.arrived = true; logCaseEvent(c, by, '客人已到院（KR 医院）'); } });
  return true;
}
/* 使用在韩持有：这位客人在本诊所各案件里「在韩持有」的项目（还有剩余次数） */
function krbHoldChoices(clinicId, clientName){
  var out = []; Store.withClinic(clinicId, function(){ CASE_ITEMS.forEach(function(c){ if(c.name!==clientName || c.krVisit) return; (c.procedureItems||[]).forEach(function(it){ if(it.heldOver && !it.holdDone && holdItemLeft(c, it)>0) out.push({caseId:c.id, caseNo:c.caseNo, name:it.name, key:itemIid(it), iid:itemIid(it), bought:(typeof krBuyTime==='function' ? krBuyTime(c, it) : ''), add:!!(it.krAddOn || it.preBalanceAdd), pay:!!it.pendingPay, left:holdItemLeft(c, it)}); });
    (c.subItems||[]).forEach(function(s){ if(s.kind==='术后管理记录' && s.place==='KR' && s.hold && !s.done && !s.holdUseOf) out.push({caseId:c.id, caseNo:c.caseNo, name:s.content, key:'row:'+s.id, left:1, rowId:s.id, care:true}); }); /* 结束术后管理后转在韩持有的韩国术后管理（免费） */ }); });
  return out;
}
/* 新做管理计价（四·3）：从 KR 项目库选项目 → 待付款 → 已付款；金额只存在预约记录里，KR 看得到，IN 的案件 / Timeline / 通知都不带金额 */
function coreBookFeeAdd(hid, id, item, by){
  var b = krbFind(hid, id); if(!b || b.status!=='confirmed' || !b.arrivedAt) return {ok:false, err:'要先标记客人已到院'};
  if(!item || !item.name || (!item.service && !(item.price>0))) return {ok:false, err:'请选择项目并填写价格'};
  b.fees = b.fees || [];
  b.fees.push({name:item.name, specLabel:item.specLabel||'', price:item.service ? 0 : item.price, projectId:item.projectId||'', service:!!item.service, status:item.service ? '已付款' : '待付款'});
  (b.history = b.history||[]).push({ts:nowFullDt(), text:by+(item.service ? ' 赠送(서비스)「' : ' 加入新做管理「')+item.name+(item.specLabel ? ' · '+item.specLabel : '')+'」'+(item.service ? '' : formatCurrency(item.price,'KRW')+'（待付款）')});
  return {ok:true};
}
function coreBookFeePaid(hid, id, by){
  var b = krbFind(hid, id), ps = b && (b.fees||[]).filter(function(f){ return f.status==='待付款'; }); if(!ps || !ps.length) return {ok:false, err:'没有待付款的项目'};
  var sum = 0; ps.forEach(function(f){ f.status = '已付款'; sum += f.price; }); (b.history = b.history||[]).push({ts:nowFullDt(), text:by+' 标记已付款：'+formatCurrency(sum,'KRW')});
  return {ok:true};
}
function coreBookFeeRemove(hid, id, idx, by){ var b = krbFind(hid, id); if(!b || !b.fees || !b.fees[idx] || b.fees[idx].status!=='待付款') return {ok:false, err:'已付款的不能删除'}; b.fees.splice(idx, 1); return {ok:true}; }
function coreBookDone(hid, id, did, by){
  var b = krbFind(hid, id); if(!b || b.status!=='confirmed' || !b.arrivedAt) return {ok:false, err:'要先标记客人已到院'};
  did = did || {kind:krbDidDefault(b.purpose)};
  if(did.kind==='hold'){ var ch = krbHoldChoices(b.clinicId, b.clientName).filter(function(x){ return x.caseId===did.caseId && (did.key ? x.key===did.key : x.name===did.name); })[0]; if(!ch) return {ok:false, err:'请选择要使用的在韩持有项目'}; did.name = ch.name; did.key = ch.key; /* CMD-1020-17：按每笔购买的 iid 对，同名项目互不影响 */ did.qty = Math.max(1, parseInt(did.qty,10)||1); if(did.qty > ch.left) return {ok:false, err:'「'+did.name+'」只剩 '+ch.left+' 次'}; }
  if(did.kind==='care'){ if(!(b.fees||[]).length) return {ok:false, err:'请先选择管理项目并加入'}; if(b.fees.some(function(f){ return f.status!=='已付款'; })) return {ok:false, err:'还没付款：请先标记已付款'}; did.name = b.fees.map(function(f){ return f.name+(f.specLabel ? ' · '+f.specLabel : '')+(f.service ? '（서비스）' : ''); }).join('、'); }
  var text = '';
  Store.mutateClinic(b.clinicId, function(){
    if(did.kind==='hold'){ var src = CASE_ITEMS.filter(function(x){ return x.id===did.caseId; })[0], isRow = /^row:/.test(did.key||''), rowC = src && isRow && (src.subItems||[]).filter(function(x){ return x.hold && !x.done && x.id===did.key.slice(4) && x.kind==='术后管理记录'; })[0], it = isRow ? null : (src && itemByKey(src, did.key || did.name, function(x){ return x.heldOver; }));
      if(rowC){ rowC.done = true; rowC.doneAt = nowFullDt(); rowC.doneBy = by; rowC.visitDate = todayStr(); rowC.arrived = true; logCaseEvent(src, by, '使用在韩持有的术后管理「'+rowC.content+'」（在韩管理新案件 '+((CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0]||{}).caseNo||'')+'）'); }
      if(it){ holdUseRecord(src, it, {key:'book|'+b.id, qty:did.qty, rowId:b.id}); logCaseEvent(src, by, '使用在韩持有「'+it.name+'」'+did.qty+' 次（在韩到店预约，案件 '+((CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0]||{}).caseNo||'')+'）'); } text = '使用在韩持有「'+did.name+'」'+did.qty+' 次'; }
    else if(did.kind==='care') text = '新做管理「'+did.name+'」';
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
  KRBK = {id:id, mode:null, date:b.date, time:b.time, reason:'', did:krbDidDefault(b.purpose), hold:'', holdQty:1, care:'', pid:'', sid:'', manual:'', note:'', err:''};
  krbRenderKr(); krbOverlay('krb-kr-overlay').classList.add('open');
}
function krbRenderKr(){
  var f = KRBK, hid = krHospitalIdOfMe(), b = f && krbFind(hid, f.id), ov = krbOverlay('krb-kr-overlay'); if(!b) return;
  var can = krCan(), cn = (clinicById(b.clinicId)||{}).name || '', inp = 'width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;box-sizing:border-box;';
  var st = {pending:'待 KR 确认', confirmed:b.arrivedAt ? '已到院' : '已确认', reselect:'IN 重选时间中', done:'已完成', cancelled:'已取消', replaced:'已作废'}[b.status] || b.status;
  var head = '<div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">IN 预约（KR 医院）</b><span style="cursor:pointer;" onclick="document.getElementById(\'krb-kr-overlay\').classList.remove(\'open\')">✕</span></div>';
  var info = '<div style="font-size:13px;line-height:1.9;margin-bottom:10px;"><b>'+krbEsc(b.clientName)+'</b> · '+krbEsc(krbPurposeFull(b))+'（'+krbEsc(cn)+'）<br>'+krbEsc(b.date+' '+b.time)+'（韩国）<br>状态：<b>'+st+'</b>'+(b.note ? '<br>备注：'+krbEsc(b.note) : '')+'</div>'; /* 打开案件入口统一成下面的按钮 */
  var body = '';
  if(b.status==='pending' && can){
    if(f.mode==='change') body = '<div style="display:flex;gap:10px;margin-bottom:8px;"><input type="date" value="'+f.date+'" style="'+inp+'" onchange="KRBK.date=this.value"><select style="'+inp+'" onchange="KRBK.time=this.value">'+krbTimeOptions(hid, f.time)+'</select></div><textarea placeholder="原因（选填）" style="'+inp+'height:56px;" oninput="KRBK.reason=this.value"></textarea><div style="display:flex;gap:10px;margin-top:10px;"><button class="btn-outline" style="flex:1;" onclick="KRBK.mode=null;krbRenderKr()">返回</button><button class="btn-primary" style="flex:1;" onclick="krbDoReselect(\'change\')">发给 IN 重选</button></div>';
    else if(f.mode==='reject') body = '<textarea placeholder="无法安排的原因（选填）" style="'+inp+'height:56px;" oninput="KRBK.reason=this.value"></textarea><div style="display:flex;gap:10px;margin-top:10px;"><button class="btn-outline" style="flex:1;" onclick="KRBK.mode=null;krbRenderKr()">返回</button><button class="btn-primary" style="flex:1;" onclick="krbDoReselect(\'reject\')">确认无法安排</button></div>';
    else body = '<div style="display:flex;gap:8px;"><button class="btn-primary" style="flex:1;" onclick="krbDoConfirm()">确认</button><button class="btn-outline" style="flex:1;" onclick="KRBK.mode=\'change\';krbRenderKr()">改时间</button><button class="btn-outline" style="flex:1;" onclick="KRBK.mode=\'reject\';krbRenderKr()">无法安排</button></div>';
  } else if(b.status==='confirmed' && can){
    var viewBtn = b.caseId ? '<button class="btn-outline" style="flex:1;" onclick="krbOpenCase()">查看客人资料（打开案件）</button>' : '', closeBtn = '<button class="btn-ghost" style="flex:1;" onclick="document.getElementById(\'krb-kr-overlay\').classList.remove(\'open\')">关闭</button>';
    if(!b.arrivedAt){
      /* CMD-1014-18 四·18：还没到预约当天不显示［客人已到院］，只有查看客人资料 / 关闭；到当天才出现（原型用［模拟到当日］） */
      body = '<div style="display:flex;gap:8px;">'+(krbArriveAllowed(b) ? '<button class="btn-primary" style="flex:1;" onclick="krbDoArrive()">客人已到院</button>' : '')+viewBtn+closeBtn+'</div>'+
        (krbArriveAllowed(b) ? '' : '<div style="margin-top:10px;font-size:12px;color:var(--muted);">还没到预约当天，到院当天才能标记客人已到院。 <a href="#" onclick="krbDoSimDay();return false;">［模拟到当日］</a>（原型）</div>');
    } else {
      var opts = krbHoldChoices(b.clinicId, b.clientName), cur = f.did==='hold' ? opts.filter(function(x){ return f.hold===x.caseId+'|'+x.key; })[0] : null;
      body = '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">做了什么</div><select style="'+inp+'margin-bottom:8px;" onchange="KRBK.did=this.value;krbRenderKr()"><option value="hold"'+(f.did==='hold' ? ' selected' : '')+'>使用在韩持有</option><option value="care"'+(f.did==='care' ? ' selected' : '')+'>新做管理</option><option value="other"'+(f.did==='other' ? ' selected' : '')+'>其他</option></select>'+
        (f.did==='hold' ? '<select style="'+inp+'" onchange="KRBK.hold=this.value;KRBK.holdQty=1;krbRenderKr()"><option value="">'+(opts.length ? '请选择持有项目' : '这位客人没有可用的在韩持有')+'</option>'+opts.map(function(x){ return '<option value="'+x.caseId+'|'+krbEsc(x.key)+'"'+(f.hold===x.caseId+'|'+x.key ? ' selected' : '')+'>'+krbEsc(x.name)+(x.bought ? ' · 购买 '+x.bought : '')+(x.add ? ' · 在韩增加' : '')+(x.pay ? ' · 待付款' : '')+'（剩 '+x.left+' 次）</option>'; }).join('')+'</select>'+(cur ? '<div style="margin-top:8px;display:flex;align-items:center;gap:8px;font-size:12px;">使用次数 <input type="number" min="1" max="'+cur.left+'" value="'+f.holdQty+'" style="width:70px;'+inp.replace('width:100%;','')+'" onchange="KRBK.holdQty=Math.max(1,Math.min('+cur.left+',parseInt(this.value,10)||1));krbRenderKr()"> 次（最多 '+cur.left+'）</div>' : '') :
        f.did==='care' ? krbCareHtml(b, f, inp) :
        '<textarea placeholder="备注" style="'+inp+'height:56px;" oninput="KRBK.note=this.value"></textarea>')+
        '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn-primary" style="flex:2;" onclick="krbDoDone()">标记完成</button>'+viewBtn+closeBtn+'</div>';
    }
  } else if(b.status==='pending' || b.status==='confirmed') body = '<div style="font-size:12px;color:var(--muted);">只有室长 / 管理者能处理这笔预约。</div>';
  ov.innerHTML = '<div class="modal-box" style="width:420px;">'+head+info+body+'<div id="krb-kr-err" style="font-size:12px;color:#C1454A;min-height:16px;margin-top:6px;">'+krbEsc(f.err)+'</div></div>';
}
/* 新做管理：从 KR 项目库选项目（类别 → 项目 → 规格）→ 加入（待付款）→ 已付款；金额只在 KR 这个弹窗里看得到 */
function krbCareHtml(b, f, inp){
  var fees = b.fees || [], unpaid = fees.some(function(x){ return x.status==='待付款'; });
  var feeBox = fees.length ? '<div style="border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:13px;margin-bottom:8px;">'+fees.map(function(x, i){ return '<div style="display:flex;gap:8px;align-items:center;padding:3px 0;"><span style="flex:1;"><b>'+krbEsc(x.name)+'</b>'+(x.specLabel ? ' · '+krbEsc(x.specLabel) : '')+(x.service ? ' <span style="color:var(--sage);font-size:12px;">서비스</span>' : '')+'</span><span>'+(x.service ? '0' : formatCurrency(x.price,'KRW'))+'</span><span style="font-weight:700;font-size:12px;color:'+(x.status==='已付款' ? 'var(--sage)' : '#B5483E')+';">'+x.status+'</span>'+(x.status==='待付款' ? '<a href="#" onclick="krbDoFeeRemove('+i+');return false;" style="font-size:12px;">删除</a>' : '')+'</div>'; }).join('')+(unpaid ? '<button class="btn-primary" style="width:100%;margin-top:6px;" onclick="krbDoFeePaid()">已付款</button>' : '')+'</div>' : '';
  /* 选项目画面同 IN 本地选购：KR 本地管理项目库（韩元价格）按类别一行一个项目 + 规格 +［加入］/［赠送］(서비스) */
  var q = String(f.q||'').trim().toLowerCase(), lib = krLocalLibOn(krHospitalIdOfMe()).filter(function(p){ return !q || p.name.toLowerCase().indexOf(q)>-1 || String(p.catLabel||'').toLowerCase().indexOf(q)>-1; }), cats = [];
  lib.forEach(function(p){ if(cats.indexOf(p.catLabel)<0) cats.push(p.catLabel); });
  f.sel = f.sel || {};
  var rows = cats.map(function(cl){ return '<div style="font-size:12px;font-weight:700;color:var(--muted);margin:8px 0 2px;">'+krbEsc(cl)+'</div>'+lib.filter(function(p){ return p.catLabel===cl; }).map(function(p){
    var st = f.sel[p.id] || {}, sp = p.specs.filter(function(x){ return x.id===st.sid; })[0] || p.specs[0];
    return '<div style="display:flex;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--border2);font-size:13px;flex-wrap:wrap;"><span style="flex:1 1 110px;font-weight:600;">'+krbEsc(p.name)+'</span><select onchange="krbCareSel(\''+p.id+'\',\'sid\',this.value)" style="padding:3px 5px;border:1px solid var(--line);border-radius:6px;font-size:12px;">'+p.specs.map(function(x){ return '<option value="'+x.id+'"'+(sp && x.id===sp.id ? ' selected' : '')+'>'+krbEsc(x.label)+'</option>'; }).join('')+'</select>'+
      (p.neg ? '<input type="number" min="1" placeholder="面议 ₩" value="'+krbEsc(st.manual||'')+'" oninput="krbCareSel(\''+p.id+'\',\'manual\',this.value,true)" style="width:84px;padding:3px 5px;border:1px solid var(--line);border-radius:6px;font-size:12px;">' : '<span style="min-width:76px;text-align:right;font-size:12px;">'+(sp ? formatCurrency(sp.price,'KRW') : '')+'</span>')+
      '<button class="btn-outline" style="padding:2px 9px;font-size:12px;" onclick="krbCareAdd(\''+p.id+'\',false)">加入</button><button class="btn-ghost" style="padding:2px 8px;font-size:12px;" title="서비스：赠送，0 元" onclick="krbCareAdd(\''+p.id+'\',true)">赠送</button></div>'; }).join(''); }).join('') || '<div style="font-size:12px;color:var(--muted);">没有匹配的管理项目</div>';
  return feeBox+'<input placeholder="搜索项目 / 类别" value="'+krbEsc(f.q||'')+'" oninput="KRBK.q=this.value;krbCareRefresh()" style="'+inp+'margin-bottom:4px;"><div id="krb-care-list" style="max-height:230px;overflow:auto;">'+rows+'</div>';
}
function krbCareRefresh(){ var f = KRBK, b = f && krbFind(krHospitalIdOfMe(), f.id); if(!b) return; var box = document.getElementById('krb-care-list'); if(!box){ krbRenderKr(); return; } var tmp = document.createElement('div'); tmp.innerHTML = krbCareHtml(b, f, ''); var nb = tmp.querySelector('#krb-care-list'); if(nb) box.innerHTML = nb.innerHTML; }
function krbCareSel(pid, k, v, quiet){ KRBK.sel = KRBK.sel || {}; (KRBK.sel[pid] = KRBK.sel[pid] || {})[k] = v; if(!quiet) krbRenderKr(); }
function krbCareAdd(pid, service){
  var f = KRBK, p = krLocalLib(krHospitalIdOfMe()).filter(function(x){ return x.id===pid; })[0]; if(!p) return; var st = (f.sel||{})[pid] || {}, sp = p.specs.filter(function(x){ return x.id===st.sid; })[0] || p.specs[0];
  var price = p.neg ? (parseInt(st.manual,10)||0) : sp.price;
  var r = coreBookFeeAdd(krHospitalIdOfMe(), f.id, {name:p.name, specLabel:sp.label, price:price, projectId:p.id, service:service}, ME_NAME); if(krbKrDone(r)) krbRenderKr();
}
function krbOpenCase(){ var f = KRBK, b = f && krbFind(krHospitalIdOfMe(), f.id); if(!b || !b.caseId) return; document.getElementById('krb-kr-overlay').classList.remove('open'); krShowCase(b.clinicId, b.caseId); }
function krbDoSimDay(){ if(coreBookSimDay(krHospitalIdOfMe(), KRBK.id)){ Store.touch && Store.touch(); krbRenderKr(); } }
function krbDoFeePaid(){ var r = coreBookFeePaid(krHospitalIdOfMe(), KRBK.id, ME_NAME); if(krbKrDone(r)) krbRenderKr(); }
function krbDoFeeRemove(i){ var r = coreBookFeeRemove(krHospitalIdOfMe(), KRBK.id, i, ME_NAME); if(krbKrDone(r)) krbRenderKr(); }
function krbKrDone(res){ var f = KRBK; if(!res.ok){ f.err = res.err || '操作失败'; krbRenderKr(); return false; } f.err = ''; Store.touch && Store.touch(); try{ krRefreshAll(); }catch(e){} return true; }
function krbDoConfirm(){ var r = coreBookConfirm(krHospitalIdOfMe(), KRBK.id, ME_NAME); if(krbKrDone(r)){ krbRenderKr(); } }
function krbDoReselect(kind){ var f = KRBK; if(kind==='change' && krbInPast(f.date, f.time)){ f.err = '不能建议过去的时间'; krbRenderKr(); return; } var r = coreBookReselect(krHospitalIdOfMe(), f.id, kind, (f.reason||'').trim(), kind==='change' ? {date:f.date, time:f.time} : null, ME_NAME); if(krbKrDone(r)){ krbOverlay('krb-kr-overlay').classList.remove('open'); } }
function krbDoArrive(){ if(coreBookArrive(krHospitalIdOfMe(), KRBK.id, ME_NAME)){ Store.touch && Store.touch(); try{ krRefreshAll(); }catch(e){} krbRenderKr(); } }
function krbDoDone(){ var f = KRBK, did = f.did==='hold' ? {kind:'hold', caseId:(f.hold||'').split('|')[0], key:(f.hold||'').split('|').slice(1).join('|'), qty:f.holdQty} : (f.did==='care' ? {kind:'care'} : {kind:'other', note:(f.note||'').trim()}); var r = coreBookDone(krHospitalIdOfMe(), f.id, did, ME_NAME); if(krbKrDone(r)){ krbOverlay('krb-kr-overlay').classList.remove('open'); } }

/* KR 日历上的预约块（kr.js 的 krcBlockHtml 遇到 type '预约' 时调用） */
function krbBlockHtml(r0, showWho){
  var b = r0.b, s = Math.max(timeToMin(b.time), KRC_H0*60), e = Math.min(timeToMin(b.end), KRC_H1*60); if(e <= s) e = s + 20;
  var w = 100 / r0.n, top = (s - KRC_H0*60) * KRC_PX / 60, hgt = Math.max(16, (e - s) * KRC_PX / 60 - 2), pend = b.status==='待确认', cn = (clinicById(b.clinicId)||{}).name || '';
  var style = 'position:absolute;left:calc('+(r0.lane*w)+'% + 1px);width:calc('+w+'% - 3px);top:'+top+'px;height:'+hgt+'px;border-radius:5px;padding:2px 5px;font-size:12px;line-height:1.3;overflow:hidden;cursor:pointer;z-index:2;'+(b.done ? 'opacity:.45;text-decoration:line-through;' : '')+
    (pend ? 'background:#fff;color:#2F6B4A;border:1.5px dashed #3F7A55;' : 'background:#E4EEE7;color:#2F6B4A;border:1px solid #B5D3C0;');
  var label = (pend ? '待 KR 确认 · ' : '预约 · ')+(b.name||'')+' · '+cn;
  return '<div onclick="event.stopPropagation();krBookOpen(\''+b.bookingId+'\')" title="'+krbEsc(b.time+'–'+b.end+' '+label)+'" style="'+style+'">'+(showWho ? krcOneLine(r0) : '<b>'+krbEsc(b.time)+'</b> '+krbEsc(label))+'</div>';
}
