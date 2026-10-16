/* shared/kr.js —— KR 医院端（2026-10-06，KR 端系列 2/5）：kr.html 的界面，以及 KR 代表院长在 owner.html 里的营运页面
   classic script，全局函数/变量；加载顺序：rules.js → i18n.js → ui.js → data.js → store.js → admin.js → kr.js
   KR 账号带 hospitalId、没有 clinicId：KR 页面不读写自己的诊所分区，案件等数据用 Store.readClinic / Store.withClinic 从各对接诊所的分区里读（见 store.js）。
   界面语言先用中文，文字都走 t()（i18n.js），之后补韩文词条即可。 */

var KR_ROLE_LABEL = {kr_owner:'代表院长', kr_manager:'管理者', kr_general:'室长', kr_director:'院长'};
function krHospital(){ return hospitalById(krHospitalIdOfMe()); }
function krHospitalName(){ var h = krHospital(); return h ? h.name.ko : ''; }
/* 本医院对接的诊所 */
function krClinics(){ return CLINIC_HOSPITALS.filter(function(r){ return r.hospitalId===krHospitalIdOfMe(); }).map(function(r){ return clinicById(r.clinicId); }).filter(Boolean); }

/* ---------- 跨诊所读取（二）：KR 端的案件来自各对接诊所的分区 ---------- */
/* 本医院看得到的全部案件（选了本医院 且 已缴面诊费/免除）：每行带来源诊所、状态徽章、小状态、遮罩后的联系方式。
   用 Store.withClinic 借用 IN 端的状态函数，行里只放算好的值 + 案件对象引用（只读，不要改） */
/* KR 案件列表「财务」栏（CMD-1015-17）：只显示 KR 看得到的——定金、尾款、在韩加项状态；不带面诊费和 IN 本地项目金额 */
function krFinanceHtml(c){
  if(!c.settlementDone || !krActiveItems(c).length) return '<span style="color:var(--muted);">—</span>';
  var info = krBalanceInfo(c), pend = pendingPayItems(c), addOn = (c.settlementBatches||[]).some(function(b){ return b.addOn && b.status==='active'; });
  return '<div style="font-size:12px;">定金 '+formatCurrency(info.deposit,'KRW')+'</div><div style="font-size:11px;color:var(--slate2);">尾款 '+(info.diff>=0 ? formatCurrency(info.diff,'KRW')+'（'+(c.krBalancePaid ? '已付清' : '未付')+'）' : '应退 '+formatCurrency(-info.diff,'KRW'))+'</div>'+(pend.length ? '<div style="font-size:11px;color:#B2453A;">在韩加项待付款</div>' : (addOn ? '<div style="font-size:11px;color:var(--slate2);">有在韩加项</div>' : ''));
}
var KR_ROW_OPEN = {};
function krRowToggle(key){ KR_ROW_OPEN[key] = !KR_ROW_OPEN[key]; krRenderCaseRows(); }
function krAllCases(){
  var hid = krHospitalIdOfMe(), me = currentAccount(), rows = [];
  krClinics().forEach(function(cl){
    Store.withClinic(cl.id, function(){
      CASE_ITEMS.forEach(function(c){
        if(!krCaseVisible(c, hid)) return;
        if(isKrDirectorLike(me) && c.director !== me.name) return; /* 院长只看自己的案件 */
        var badge = caseStatusBadge(c);
        rows.push({hold:krHoldOpen(c), clinicId:cl.id, clinicName:cl.name, id:c.id, caseNo:c.caseNo, name:c.name, director:c.director||'', krCoordinator:c.krCoordinator||'',
          updated:c.updated||'', start:caseStartText(c), fin:krFinanceHtml(c), inOps:caseOperators(c, true).inn.map(function(n){ return staffLabel(n); }).join('、'), subs:(function(){ subCaseNos(c); return subCaseList(c).map(function(rp){ var g = subCaseRows(c, rp); return {dno:rp.dno, place:rp.place, when:(rp.place==='IN' ? (rp.visitDate||rp.date) : rp.date+(rp.time ? ' '+rp.time : '')), text:g.map(function(s){ return s.content; }).join('；'), done:g.every(function(s){ return s.done; }), arrived:g.some(function(s){ return s.arrived; }), doneAt:rp.doneAt||''}; }); })(), noTimeline:!!(c.settlementDone && krActiveItems(c).length && !(c.subItems||[]).length && !isEnded(c)), subToday:(c.subItems||[]).filter(function(s){ return s.date===krToday() && !s.done; }).length, badge:caseStageBadge(c), label:badge[2], stageText:caseStageProcText(c), subItems:caseSubStatusItems(c), phoneMasked:maskPhone(clientPhoneOf(c.name)), c:c});
      });
    });
  });
  return rows;
}
/* 经营数据（KR 端，2026-10-07 资金归属）：KR 收入 = 尾款 + 韩国加做（医院收）；定金是诊所收的，不在这里。按案件开始的月份统计（同 IN 口径） */
var KR_BIZ_MONTH = 'cur';
function krBizSetMonth(v){ KR_BIZ_MONTH = v; openAdminPage('bizdata', true); }
function krBizData(el){
  var hid = krHospitalIdOfMe(), curM = D(0).slice(0,7), rows = [], months = {}; months[curM] = 1;
  krClinics().forEach(function(cl){
    Store.withClinic(cl.id, function(){
      CASE_ITEMS.forEach(function(c){
        if(!krCaseVisible(c, hid)) return;
        var m = bizCaseMonth(c); months[m] = 1;
        var info = krBalanceInfo(c), bal = (c.krBalancePaid && info.diff>0) ? info.diff : 0;
        var add = (c.settlementBatches||[]).filter(function(b){ return b.addOn && b.status==='active'; }).reduce(function(t,b){ return t+(b.krTotal||0); }, 0);
        rows.push({clinicId:cl.id, clinicName:cl.name, month:m, bal:bal, add:add, travel:krActiveItems(c).length>0, closed:c.stage==='closed'});
      });
    });
  });
  var want = KR_BIZ_MONTH==='cur' ? curM : KR_BIZ_MONTH, rs = rows.filter(function(r){ return want==='all' || r.month===want; });
  var sum = function(k, list){ return (list||rs).reduce(function(t,r){ return t+r[k]; }, 0); };
  var tile = function(label, big, sub, color){ return '<div class="card" style="padding:14px 18px;flex:1;min-width:150px;"><div style="font-size:11px;color:var(--muted);">'+label+'</div><div style="font-size:22px;font-weight:700;margin:4px 0;'+(color?'color:'+color+';':'')+'">'+big+'</div><div style="font-size:11px;color:var(--muted);">'+sub+'</div></div>'; };
  var opts = '<option value="cur"'+(KR_BIZ_MONTH==='cur'?' selected':'')+'>本月（'+curM+'）</option><option value="all"'+(KR_BIZ_MONTH==='all'?' selected':'')+'>全部</option>'+
    Object.keys(months).sort().reverse().filter(function(m){ return m!==curM; }).map(function(m){ return '<option value="'+m+'"'+(KR_BIZ_MONTH===m?' selected':'')+'>'+m+'</option>'; }).join('');
  var byClinic = krClinics().map(function(cl){
    var l = rs.filter(function(r){ return r.clinicId===cl.id; });
    return '<div class="trow" style="grid-template-columns:2fr 0.8fr 1.2fr 1.2fr 1.2fr;"><span>'+aEsc(cl.name)+'</span><span>'+l.length+'</span><span>'+formatCurrency(sum('bal',l),'KRW')+'</span><span>'+formatCurrency(sum('add',l),'KRW')+'</span><span><b>'+formatCurrency(sum('bal',l)+sum('add',l),'KRW')+'</b></span></div>';
  }).join('');
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;"><div style="font-size:18px;font-weight:700;">'+t('经营数据')+' · '+aEsc(krHospitalName())+'</div>'+
    '<select onchange="krBizSetMonth(this.value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;">'+opts+'</select></div>'+
    '<div style="display:flex;gap:12px;flex-wrap:wrap;">'+tile('案件数', rs.length, '来自对接诊所的案件')+tile('尾款', formatCurrency(sum('bal'),'KRW'), '已付清的尾款（韩元，医院收）')+tile('韩国加做', formatCurrency(sum('add'),'KRW'), '回诊时在韩国加做的项目（单独付款，医院收）')+tile('KR 收入合计', formatCurrency(sum('bal')+sum('add'),'KRW'), '尾款 + 韩国加做', 'var(--sage)')+'</div>'+
    aSection('按来源诊所', '<div class="trow head" style="grid-template-columns:2fr 0.8fr 1.2fr 1.2fr 1.2fr;"><span>来源诊所</span><span>案件数</span><span>尾款</span><span>韩国加做</span><span>合计</span></div>'+(byClinic || '<div style="font-size:12px;color:var(--muted);">没有对接的诊所</div>'),
      'KR 收入 = 尾款 + 韩国加做；定金由诊所收取，不计入医院收入。医院原因造成的定金退款，分担方式由 IN 室长在退款备注里记录，这里不自动扣减。')+
    '<div style="font-size:11px;color:var(--muted);">待讨论：具体要看哪些数字（这是基础版）。</div>';
}
function krFindCase(clinicId, id){ return krAllCases().filter(function(r){ return r.clinicId===clinicId && r.id===id; })[0] || null; }
/* 其他标签页（IN 端缴费等）改了数据 → 重画当前 KR 页面和角标 */
function krRefreshAll(){
  try{ if(CURRENT_PAGE_ID==='in-admin') refreshAdminPage(); else if(/^kr-/.test(CURRENT_PAGE_ID)) krRenderPage(CURRENT_PAGE_ID); }catch(e){ console.error('[KR 刷新]', e); }
  try{ if(typeof krUpdateBadges==='function') krUpdateBadges(); }catch(e){}
}

/* ---------- 页面与导航 ---------- */
/* 侧边栏：大盘 / 案件列表 / 通知中心（院长只有大盘）；管理类（经营数据、账号管理、医院设定、操作日志）有权限才出现；代表院长只有管理类 */
/* CMD-1014-16：客人管理——KR 室长 / 管理者能操作；代表院长（= 院长 + 老板）可看（只读，看自己负责的案件的客人）；一般院长没有 */
function krClientsAllowed(){ var a = currentAccount(); return canDo('krview') || !!(a && a.role==='kr_owner'); }
function krNavItems(){
  var items = [];
  if(canDo('krview') || canDo('krviewOwn')) items.push({id:'kr-dashboard', key:'krdash', label:'工作台', icon:'盘'});
  if(canDo('krview') || canDo('krviewOwn')) items.push({id:'kr-cases', key:'krcases', label:'案件管理', icon:'件'});
  if(krClientsAllowed()) items.push({id:'kr-clients', key:'krclients', label:'客人管理', icon:'客'}); /* 院长没有客人管理（KR-CLNT-01，CMD-1013-11 四） */
  if(canDo('krview') || canDo('krviewOwn')) items.push({id:'kr-notifications', key:'krnotifs', label:'通知中心', icon:'通'});
  return items;
}
function buildKrSidebar(activePage){
  var a = currentAccount();
  var brand = SIDEBAR_COLLAPSED ? '<div class="brand collapsed-brand"><span class="logo-sq">G</span></div>'
    : '<div class="brand"><b>GMC Network</b><span>'+t(KR_ROLE_LABEL[a ? a.role.replace(/^kr_/,'kr_') : ''] || '')+' · '+(ME_NAME||'')+'<br>'+krHospitalName()+'</span></div>';
  var item = function(label, icon, active, onclick){
    var inner = SIDEBAR_COLLAPSED ? '<span class="nav-icon">'+icon+'</span>' : '<span class="dot"></span><span>'+t(label)+'</span>';
    return '<a class="nav-item'+(active?' active':'')+'" href="#" title="'+t(label)+'" onclick="'+onclick+';return false;">'+inner+'</a>';
  };
  var nav = krNavItems().map(function(n){ return item(n.label, n.icon, n.key===activePage, "nav('"+n.id+"')"); }).join('');
  var admin = ADMIN_PAGES.filter(function(p){ return !p.hidden && canDo(p.perm); });
  if(admin.length) nav += (SIDEBAR_COLLAPSED || !krNavItems().length ? '' : '<div style="font-size:11px;color:var(--muted);padding:14px 14px 4px;">'+t('医院管理')+'</div>')+
    admin.map(function(p){ return item(adminPageLabel(p), p.icon, ('admin-'+p.key)===activePage, "openAdminPage('"+p.key+"')"); }).join('');
  var toggle = '<span class="collapse-toggle" onclick="toggleSidebar()" title="'+(SIDEBAR_COLLAPSED?'展开':'收起')+'">'+(SIDEBAR_COLLAPSED?'»':'«')+'</span>';
  return '<div class="sidebar'+(SIDEBAR_COLLAPSED?' collapsed':'')+'">'+toggle+brand+'<nav>'+nav+'</nav>'+(SIDEBAR_COLLAPSED?'':'<div class="sidebar-foot">GMC Network · 韩国医院端</div>')+'</div>';
}
function krHeadIconsHtml(){
  var hasWork = canDo('krview') || canDo('krviewOwn');
  return '<div class="actions">'+
    (hasWork ? '<button class="icon-btn" onclick="krOpenDrawer()" aria-label="对话">💬<span class="badge kr-chat-badge" style="display:none;">0</span></button>'+
      '<button class="icon-btn" onclick="krToggleBell(event)" aria-label="通知">🔔<span class="badge kr-bell-badge" style="display:none;">0</span></button>' : '')+
    '<span class="avatar" style="cursor:pointer;" onclick="toggleAvatarMenu(event)" title="'+(ME_NAME||'')+'">'+((ME_NAME||'?').charAt(0).toUpperCase())+'</span></div>';
}
function buildKrTopbar(title){ return ''; } /* CMD-1015-02：顶栏拿掉 */

var KR_PAGE_TITLES = {'kr-dashboard':'工作台', 'kr-cases':'案件列表', 'kr-casedetail':'案件详情', 'kr-clients':'客人管理', 'kr-clientdetail':'客人详情', 'kr-notifications':'通知中心'};
function krRenderPage(id){
  var tSlot = document.querySelector('#'+id+' .topbar-slot'); if(tSlot) tSlot.innerHTML = buildTopbar(KR_PAGE_TITLES[id] || '');
  if(id==='kr-dashboard' && typeof krRenderDashboard==='function') krRenderDashboard();
  else if(id==='kr-cases' && typeof krRenderCases==='function') krRenderCases();
  else if(id==='kr-notifications' && typeof krRenderNotifs==='function') krRenderNotifs();
  else if(id==='kr-casedetail') krRenderCaseDetail();
  else if(id==='kr-clients') krRenderClients();
  else if(id==='kr-clientdetail') krRenderClientDetail();
  try{ krUpdateBadges(); }catch(e){}
}
/* ---------- 来自 IN 的视频来电（CMD-1008-12 A1）：IN 发起视频邀请 → gmc_call 信号 → 本医院的 KR 室长 / 案件院长跳来电画面（接听 / 拒绝）；接听后进通话画面（演示：顶部计时、静音、［结束通话］） ---------- */
var KR_CALL = {sig:null, state:'idle', startedAt:0, timer:null, muted:false}; /* state: idle | ringing | connected */
function krCallRelevant(sig){
  var a = currentAccount(); if(!a || !a.hospitalId || a.hospitalId!==sig.hospitalId) return false;
  if(a.role==='kr_manager' || a.role==='kr_general'){ /* 本医院的 KR 室长 / 管理者：呼叫名单里指定了人就只响指定的人 */
    return !(sig.to && sig.to.length) || sig.to.indexOf((a.name||'').split(' ')[0])>-1;
  }
  return false; /* 院长 / 代表院长不接来电（CMD-1015-15） */
}
function krCallOverlay(){
  var ov = document.getElementById('kr-call-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'kr-call-overlay'; ov.style.cssText = 'position:fixed;inset:0;z-index:300;display:none;align-items:center;justify-content:center;background:rgba(27,38,53,.55);'; document.body.appendChild(ov); }
  return ov;
}
function krCallRender(){
  var ov = krCallOverlay(), sig = KR_CALL.sig;
  if(KR_CALL.state==='idle' || !sig){ ov.style.display = 'none'; ov.innerHTML = ''; return; }
  var title = sig.clinicName+' · '+sig.name+'（'+sig.caseNo+'）';
  if(KR_CALL.state==='ringing'){
    ov.innerHTML = '<div style="background:#fff;border-radius:16px;padding:28px 32px;width:340px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.3);"><div style="font-size:36px;">📞</div><div style="font-size:16px;font-weight:800;margin:10px 0 4px;">'+krEsc(sig.from)+' 呼叫你</div><div style="font-size:12px;color:var(--slate2);margin-bottom:20px;">'+krEsc(title)+' · 视频沟通</div>'+
      '<div style="display:flex;gap:10px;"><button class="btn-outline" style="flex:1;color:#C1454A;border-color:#C1454A;" onclick="krCallDecline()">拒绝</button><button class="btn-primary" style="flex:1;background:var(--sage);" onclick="krCallAccept()">接听</button></div></div>';
  } else {
    ov.style.background = '#1B2635';
    ov.innerHTML = '<div style="color:#fff;text-align:center;width:420px;"><div style="font-size:12px;opacity:.7;">视频沟通中</div><div style="font-size:18px;font-weight:800;margin:6px 0;">'+krEsc(title)+'</div><div style="font-size:13px;opacity:.85;margin-bottom:6px;">参与者：'+krEsc(sig.from)+'（印尼室长）、'+krEsc(ME_NAME)+'</div><div id="kr-call-timer" style="font-size:28px;font-weight:700;margin:14px 0 22px;">00:00</div>'+
      '<div style="display:flex;gap:12px;justify-content:center;"><button class="btn-outline" style="background:transparent;color:#fff;border-color:#fff;" onclick="KR_CALL.muted=!KR_CALL.muted;krCallRender()">'+(KR_CALL.muted?'取消静音':'静音')+'</button><button class="btn-primary" style="background:#C1454A;" onclick="krCallHangup()">结束通话</button></div></div>';
  }
  ov.style.display = 'flex';
}
function krCallTick(){ var el = document.getElementById('kr-call-timer'); if(!el || KR_CALL.state!=='connected') return; var s = Math.floor((Date.now()-KR_CALL.startedAt)/1000), p = function(n){ return (n<10?'0':'')+n; }; el.textContent = p(Math.floor(s/60))+':'+p(s%60); }
function krCallHandle(sig){
  if(!sig) return;
  if(sig.status==='ringing' && Date.now()-sig.ts < 60000 && krCallRelevant(sig) && KR_CALL.state==='idle'){ KR_CALL.sig = sig; KR_CALL.state = 'ringing'; krCallRender(); var sid1 = sig.id; setTimeout(function(){ krCallRingFallback(sid1); }, CALL_RING_MS+8000); return; }
  if(KR_CALL.sig && sig.id===KR_CALL.sig.id){
    if(KR_CALL.state==='ringing' && (sig.status==='accepted' || sig.status==='declined' || sig.status==='ended' || sig.status==='missed')){ if(sig.by!==ME_NAME){ KR_CALL = {sig:null, state:'idle', startedAt:0, timer:null, muted:false}; krCallRender(); } } /* 别的 KR 同事接了 / 拒了，或 IN 取消：本页来电消失 */
    else if(KR_CALL.state==='connected' && sig.status==='ended' && sig.by!==ME_NAME){ krCallFinish(); showToast('通话已结束', (sig.by||'IN')+' 结束了视频通话', null); }
  }
}
/* 兜底：发起方页面已经关了、没人处理响铃 → 本页把来电标成未接并记未接来电（按信号 id 去重，只会记一次） */
function krCallRingFallback(sigId){
  if(!KR_CALL.sig || KR_CALL.sig.id!==sigId || KR_CALL.state!=='ringing') return;
  var cur = readCallSignal(); if(cur && cur.id===sigId && cur.status==='ringing'){ patchCallSignal(sigId, {status:'missed', by:'系统'}); recordMissedCall(cur); }
  krCallFinish();
}
function krCallAccept(){
  if(!KR_CALL.sig) return;
  var cur = readCallSignal();
  if(!cur || cur.id!==KR_CALL.sig.id || cur.status!=='ringing'){ krCallFinish(); showToast('来电已失效', '已经有人接听或对方已取消', null); return; }
  patchCallSignal(cur.id, {status:'accepted', by:ME_NAME});
  KR_CALL.state = 'connected'; KR_CALL.startedAt = Date.now(); KR_CALL.muted = false;
  if(KR_CALL.timer) clearInterval(KR_CALL.timer); KR_CALL.timer = setInterval(krCallTick, 1000);
  krCallRender();
}
function krCallDecline(){ if(!KR_CALL.sig) return; patchCallSignal(KR_CALL.sig.id, {status:'declined', by:ME_NAME}); krCallFinish(); }
function krCallHangup(){ if(!KR_CALL.sig) return; patchCallSignal(KR_CALL.sig.id, {status:'ended', by:ME_NAME}); krCallFinish(); }
function krCallFinish(){ if(KR_CALL.timer) clearInterval(KR_CALL.timer); KR_CALL = {sig:null, state:'idle', startedAt:0, timer:null, muted:false}; var ov = krCallOverlay(); ov.style.background = 'rgba(27,38,53,.55)'; krCallRender(); }
window.addEventListener('storage', function(e){ if(e.key==='gmc_call' && e.newValue && isKrAccount() && canDo('krview')|| (e.key==='gmc_call' && e.newValue && isKrAccount() && canDo('krviewOwn'))){ try{ krCallHandle(JSON.parse(e.newValue)); }catch(x){} } });

function krBoot(){
  try{ i18nStart(); }catch(e){}
  try{ if(krBackfillDurations()) Store.touch(); }catch(e){ console.error(e); }
  try{ krClinics().forEach(function(cl){ Store.mutateClinic(cl.id, function(){ backfillLocalLib(); if(repairScheduleGaps()) Store.touch(); }); }); }catch(e){ console.error('[补本地项目库 / 施术子案件]', e); } try{ if(repairOffConflicts()) Store.touch(); }catch(e){ console.error('[院长 OFF 与施术冲突]', e); } /* 各来源诊所没有本地项目库的补上 */
  document.querySelectorAll('.me-name').forEach(function(el){ el.textContent = ME_NAME; });
  var start = canDo('krview') || canDo('krviewOwn') ? 'kr-dashboard' : null; /* 地址带 ?case=诊所:案件号 时直接进详情 */
  if(!start){ location.replace(homeUrl()); return; }
  CURRENT_PAGE_ID = start;
  var q = new URLSearchParams(location.search).get('case');
  if(q){ var pr = q.split(':'); if(!krFindCase(pr[0], pr[1])){ location.replace(homeUrl()); return; } KR_CASE = {clinicId:pr[0], id:pr[1], tab:new URLSearchParams(location.search).get('tab')||'basic'}; start = 'kr-casedetail'; }
  try{ if(sweepStaleSurgeryBlocks(function(cid, id){ var v = Store.readClinic(cid); return v ? (v.CASE_ITEMS||[]).filter(function(x){ return x.id===id; })[0] : null; })) Store.touch(); }catch(e){} /* 取消后还留着的施术块一次性清掉 */
  if(new URLSearchParams(location.search).get('rec') || new URLSearchParams(location.search).get('pcb')) window.__krRecInTab = true;
  if(new URLSearchParams(location.search).get('win')){ window.__krRecWin = true; document.body.classList.add('kr-recwin'); } /* 面诊录入独立小窗口：只显示录入弹窗 */ /* 录入输入页（院长开始面诊后新开的分页）：不参与「同一账号两分页」锁，和案件页属于同一次操作 */
  krRenderPage(start); showPage(start);
  if(new URLSearchParams(location.search).get('pcb') && start==='kr-casedetail') setTimeout(function(){ try{ krPcbOpenLocal(); }catch(e){ console.error(e); } }, 250);
  var recQ = new URLSearchParams(location.search).get('rec'); if(recQ && start==='kr-casedetail'){ setTimeout(function(){ try{ krSetCaseTab('consult'); krRecOpenModal(recQ==='voice' ? 'voice' : 'manual', new URLSearchParams(location.search).get('add')==='1'); }catch(e){} }, 200); }
  KR_LAST_UNREAD = krNotifUnread().length; krUpdateBadges(); try{ krToastNew([]); }catch(e){} /* 登记启动时已有的通知，之后新到的才弹 */
  try{ krCallHandle(readCallSignal()); }catch(e){} /* 刚打开页面时，如果正好有一通 60 秒内的来电，也要响 */
}

/* ---------- 管理类页面（代表院长在 owner.html、管理者在 kr.html；范围 = 本医院） ---------- */
function krAccountStatusPill(a){ var s = STATUS_STYLE[a.status]; return '<span class="status-pill" style="background:'+s[1]+';color:'+s[2]+';">'+s[0]+'</span>'; }
(function(){
  var baseAccounts = ADMIN_RENDER.accounts, baseClinic = ADMIN_RENDER.clinic, baseBiz = ADMIN_RENDER.bizdata;
  ADMIN_RENDER.accounts = function(el, r){
    if(!isKrAccount()) return baseAccounts(el, r);
    var hid = krHospitalIdOfMe(), list = hospitalAccounts(hid), me = currentAccount();
    var cnt = function(role, seat){ return list.filter(function(a){ return a.role===role && (!seat || a.seat===seat) && a.status!=='disabled'; }).length; };
    var stat = function(label, big, sub){ return '<div class="card" style="padding:14px 18px;flex:1;min-width:150px;"><div style="font-size:11px;color:var(--muted);">'+label+'</div><div style="font-size:22px;font-weight:700;margin:4px 0;">'+big+'</div><div style="font-size:11px;color:var(--slate2);">'+sub+'</div></div>'; };
    var pend = list.filter(function(a){ return a.status==='pending'; }).length;
    el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;"><div style="font-size:18px;font-weight:700;">'+t('账号管理')+' · '+aEsc(krHospitalName())+'</div><button class="btn-primary" onclick="openBuyAccounts()">＋ 加购账号</button></div>'+
      '<div style="display:flex;gap:12px;flex-wrap:wrap;">'+stat('基本席位','3 个','代表院长 1 · 管理者 1 · 室长 1（不能退订）')+stat('加购院长账号', cnt('kr_director','addon')+' 个', ACCOUNT_PRICE_TEXT)+stat('加购管理者', cnt('kr_manager','addon')+' 个', ACCOUNT_PRICE_TEXT)+stat('加购室长', cnt('kr_general','addon')+' 个', ACCOUNT_PRICE_TEXT)+stat('待激活', pend+' 个', '已购买 / 已重设，等使用人激活')+'</div>'+
      '<div class="card" style="padding:4px 20px;">'+acctRowsHtml()+'</div>'+
      '<div style="font-size:11px;color:var(--muted);line-height:1.7;">点一行看使用人历史和该账号的操作记录。KR 账号的购买 / 退订 / 重设密码 / 换使用人规则同 IN 端：重设密码后账号变「待激活」，原使用人立即登出，下一位在登录页「首次激活」接手；管理者加购管理者账号需要代表院长的验证码；代表院长账号不能被重设。</div>';
  };
  ADMIN_RENDER.clinic = function(el, r){
    if(!isKrAccount()) return baseClinic(el, r);
    var h = krHospital(), clinics = krClinics();
    var row = function(k, v){ return '<div class="field-row"><span class="fk">'+k+'</span><span class="fv" style="font-weight:400;">'+v+'</span><span class="fa"></span></div>'; };
    el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('医院设定')+'</div>'+
      '<div class="card" style="padding:2px 20px;">'+row('医院名称（韩 / 英）', aEsc(h.name.ko)+' / '+aEsc(h.name.en))+row('地址', aEsc(h.address))+row('时区', aEsc(tzLabel(h.tz||'Asia/Seoul')))+row('对接的诊所', clinics.map(function(c){ return aEsc(c.name); }).join('、')||'—')+'</div>'+
      '<div class="card" style="padding:14px 20px;"><div style="font-size:13px;font-weight:700;margin-bottom:6px;">'+t('定期休诊（每周固定，韩国时间）')+'</div>'+closedRulesEditorHtml((HOSP_DRAFT||{}).closedRules || krHData().closedRules || [], 'hospSetClosed')+
        '<div style="font-size:11px;color:var(--muted);margin:6px 0 12px;">整天休诊：IN 的 KR 医院日程里显示 1/3 宽的窄列，IN 选不了这天的施术日期；部分时段休诊：该时段浅灰。</div>'+
        '<div style="font-size:13px;font-weight:700;margin:0 0 6px;">'+t('营业时间（韩国时间）')+'</div><div style="display:flex;gap:8px;align-items:center;font-size:13px;"><input type="time" step="1800" value="'+aEsc(((HOSP_DRAFT||{}).openTime !== undefined ? (HOSP_DRAFT||{}).openTime : hospitalHours(krHospitalIdOfMe()).open))+'" onchange="hospSetHours(\'openTime\',this.value)" style="padding:6px 9px;border:1px solid var(--border);border-radius:8px;"> ～ <input type="time" step="1800" value="'+aEsc(((HOSP_DRAFT||{}).closeTime !== undefined ? (HOSP_DRAFT||{}).closeTime : hospitalHours(krHospitalIdOfMe()).close))+'" onchange="hospSetHours(\'closeTime\',this.value)" style="padding:6px 9px;border:1px solid var(--border);border-radius:8px;"></div>'+
        '<div style="font-size:11px;color:var(--muted);margin:6px 0 12px;">IN 的 KR 医院日程时间轴、KR 日历、施术 / 不可预约的可排时间、半天 OFF（上午 = 营业开始→午休开始，下午 = 午休结束→营业结束）都读这里。</div>'+
        '<div style="font-size:13px;font-weight:700;margin:6px 0;">'+t('午休（韩国时间）')+'</div><div style="display:flex;gap:8px;align-items:center;font-size:13px;"><input type="time" step="1800" value="'+aEsc(((HOSP_DRAFT||{}).lunch || krHData().lunch || {from:''}).from||'')+'" onchange="hospSetLunch(\'from\',this.value)" style="padding:6px 9px;border:1px solid var(--border);border-radius:8px;"> ～ <input type="time" step="1800" value="'+aEsc(((HOSP_DRAFT||{}).lunch || krHData().lunch || {to:''}).to||'')+'" onchange="hospSetLunch(\'to\',this.value)" style="padding:6px 9px;border:1px solid var(--border);border-radius:8px;"></div>'+
        '<div style="font-size:11px;color:var(--muted);margin:6px 0 10px;">午休：施术不能开始于午休时段，但可以跨过午休；午休在 IN 的 KR 医院日程和 KR 日历里显示为浅灰带。</div>'+
        (canDo('clinic') ? '<button class="btn-primary" onclick="saveHospClosed()">'+t('保存')+'</button>' : '')+'</div>'+
      '<div style="font-size:11px;color:var(--muted);">医院设定的其他编辑项（语言、短信等）在后面几份指令里做；院长名单、开放施术日期、日程在 KR 端的日程管理 / 院长管理里。</div>';
  };
  var HOSP_DRAFT = null; /* 医院设定草稿：{openTime, closeTime, closedRules, lunch} */
  var hospDraft = function(){ if(!HOSP_DRAFT){ var h = krHData(), hr0 = hospitalHours(krHospitalIdOfMe()); /* 医院资料（HOSPITAL_DATA）；krHospital() 是医院基本信息，不是这个；草稿只在第一次建，之后沿用（CMD-1013-15：原来每次都重建且第二次起 hr0 为空报错，营业时间 / 午休 / 休诊改不了第二项） */ HOSP_DRAFT = {openTime:hr0.open, closeTime:hr0.close, closedRules:JSON.parse(JSON.stringify(h.closedRules || [])), lunch:Object.assign({from:'', to:''}, h.lunch||{})}; } return HOSP_DRAFT; };
  window.hospSetClosed = function(dow, mode, from){ closedRulesSet(hospDraft().closedRules, dow, mode, from, '16:00'); openAdminPage('clinic', true); };
  window.hospSetLunch = function(k, v){ hospDraft().lunch[k] = v; };
  window.hospSetHours = function(k, v){ hospDraft()[k] = v; };
  window.saveHospClosed = function(){
    if(!canDo('clinic') || !HOSP_DRAFT){ showToast('没有修改', '设定和之前一样', null); return; }
    var h = krHData(), d = HOSP_DRAFT, lu = d.lunch, hr = hospitalHours(krHospitalIdOfMe());
    if(!/^\d\d:\d\d$/.test(d.openTime||'') || !/^\d\d:\d\d$/.test(d.closeTime||'') || timeToMin(d.closeTime) <= timeToMin(d.openTime)){ alert('营业时间请填完整的开始和结束时间，结束要晚于开始'); return; }
    if((lu.from || lu.to) && (timeToMin(lu.from) < timeToMin(d.openTime) || timeToMin(lu.to) > timeToMin(d.closeTime))){ alert('午休必须在营业时间内'); return; }
    var badRule = (d.closedRules||[]).filter(function(r){ return r.from && (timeToMin(r.from) < timeToMin(d.openTime) || timeToMin(r.from) >= timeToMin(d.closeTime)); })[0];
    if(badRule){ alert('部分时段休诊的起始时刻必须在营业时间内'); return; }
    if(lu.from || lu.to){ if(!/^\d\d:\d\d$/.test(lu.from||'') || !/^\d\d:\d\d$/.test(lu.to||'') || timeToMin(lu.to) <= timeToMin(lu.from)){ alert('午休请填完整的开始和结束时间，结束要晚于开始（不需要午休就两个都清空）'); return; } }
    var old = '营业时间：'+hr.open+'–'+hr.close+'；定期休诊：'+closedRulesText(h.closedRules)+'；午休：'+(h.lunch&&h.lunch.from ? h.lunch.from+'–'+h.lunch.to : '无'), nw = '营业时间：'+d.openTime+'–'+d.closeTime+'；定期休诊：'+closedRulesText(d.closedRules)+'；午休：'+(lu.from ? lu.from+'–'+lu.to : '无');
    if(old===nw){ HOSP_DRAFT = null; showToast('没有修改', '设定和之前一样', null); return; }
    h.openTime = d.openTime; h.closeTime = d.closeTime; h.closedRules = d.closedRules; h.lunch = lu.from ? {from:lu.from, to:lu.to} : null; HOSP_DRAFT = null;
    logOp('设定变更', '医院设定：'+old+' → '+nw); krSettingsNotif('医院设定：'+old+' → '+nw); Store.touch(); openAdminPage('clinic', true); showToast('已保存', nw, null);
  };
  ADMIN_RENDER.bizdata = function(el, r){
    if(!isKrAccount()) return baseBiz(el, r);
    if(typeof krBizData === 'function') return krBizData(el, r);
    el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('经营数据')+'</div><div class="card" style="padding:24px;color:var(--slate2);">本医院的汇总数字在第二部分之后补。</div>';
  };
})();


/* ---------- 三、KR 大盘（KR-DASH-01） ---------- */
function krToday(){ return todayStr(); }
function krEsc(s){ return aEsc(s); }
function krHData(){ var h = HOSPITAL_DATA[krHospitalIdOfMe()]; if(h){ h.dayConfirm = h.dayConfirm || {}; h.reportRead = h.reportRead || {}; h.offs = h.offs || []; } return h; }
function krIsDirector(){ return isKrDirectorLike(currentAccount()); }

/* 卡片 → 案件列表筛选条件（四里用同一份判断） */
var KR_CARDS = [
  {key:'eta', ord:10,      label:'待确认面诊时间', tip:'客人已缴面诊费，等室长确认面诊时间和预计出报告时间', test:function(r){ return r.c.consultStatus==='paid_waiting_kr'; }},
  {key:'due', ord:20,      label:'报告快到期 / 已超时', tip:'预计出报告时间 24 小时内，或已超时', test:function(r){ if(r.c.consultStatus!=='awaiting_report') return false; if(reportOverdueNow(r.c)) return true; var e = reportEtaParse(r.c.reportEta); return !!e && (e - nowDateObj()) <= 86400000; }},
  {key:'sched',    label:'待确认施术时间', tip:'客人提交了施术日期，等 KR 确认', test:function(r){ return r.c.stage==='travel' && scheduleState(r.c)==='Pending'; }},
  {key:'change',   label:'改期待确认', tip:'客人申请改期，等 KR 确认', test:function(r){ return r.c.stage==='travel' && scheduleState(r.c)==='Changing'; }},
  {key:'today',    label:'今天到院', tip:'施术日期是今天的客人', test:function(r){ var ks = r.c.krSchedule; return (!!ks && ['confirmed','arrived'].indexOf(ks.status)>-1 && ks.confirmedDate===krToday() && !r.c.visitClosed) || krTodayVisits(r.c).length>0; }}, /* 含今天来做术后管理 / 持有使用的客人 */
  {key:'waiting', ord:15, label:'等待报告', tip:'等待报告的案件总数；快到期 / 已超时的标红', test:function(r){ return r.c.consultStatus==='awaiting_report'; }, hot:function(r){ if(reportOverdueNow(r.c)) return true; var e = reportEtaParse(r.c.reportEta); return !!e && (e - nowDateObj()) <= 86400000; }},
  {key:'timeline', label:'timeline 待整理', tip:'已付定金、还没有整理在韩 timeline', test:function(r){ return r.noTimeline; }},
  {key:'subtoday', label:'今日在韩子项', tip:'今天要做的在韩子项（还没完成）', test:function(r){ return r.subToday>0; }}
];
function krCardRows(card, rows){ return rows.filter(card.test); }
/* 点卡片 → 案件列表（带筛选）；案件列表在第四部分 */
var KR_LIST = {tab:'all', card:'', clinic:'', director:'', q:'', mine:false};

function krConfirmToday(){
  var h = krHData(); if(!h) return;
  h.dayConfirm[krToday()] = {by: ME_NAME, at: nowFullDt()}; /* UTC */
  logOp('其他', '确认今日院长日程（'+krToday()+'）', '日程');
  Store.touch(); krRenderDashboard();
}
function krOffRows(hid, date){ return (HOSPITAL_DATA[hid].offs||[]).filter(function(o){ return offApplies(o, date); }); }

function krArrivalsHtml(rows){
  var list = rows.filter(KR_CARDS[4].test).sort(function(a,b){ return (a.c.krSchedule.confirmedTime||'').localeCompare(b.c.krSchedule.confirmedTime||''); });
  if(!list.length) return '<div style="padding:18px;color:var(--muted);font-size:13px;">今天没有到院的客人</div>';
  return '<div class="trow head" style="grid-template-columns:0.6fr 1.2fr 1fr 1fr 2.4fr;"><span>时间</span><span>客户</span><span>来源诊所</span><span>院长</span><span>项目</span></div>'+
    list.map(function(r){
      var items = Store.withClinic(r.clinicId, function(){ return krActiveItems(r.c).filter(function(it){ return !krIsMgmtItemC(it); }).map(function(it){ return it.name; }); }) || [];
      return '<div class="trow" onclick="krOpenCase(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:0.6fr 1.2fr 1fr 1fr 2.4fr;cursor:pointer;"><span><b>'+krEsc(r.c.krSchedule.confirmedTime||'—')+'</b></span><span>'+krEsc(r.name)+'</span><span>'+krEsc(r.clinicName)+'</span><span>'+krEsc(r.director)+'</span><span style="color:var(--slate2);">'+krEsc(items.join('、')||'—')+'</span></div>';
    }).join('');
}
function krOpenCase(clinicId, id){ if(typeof krShowCase==='function') krShowCase(clinicId, id); } /* 案件详情骨架在第五部分 */

function krOffBar(hid){
  var offs = krOffRows(hid, krToday()); if(!offs.length) return ''; /* 同 IN：没有人 OFF 就整行不显示；一行文字，不是卡片 */
  return '<div style="font-size:13px;margin-top:-8px;"><b>今日 OFF：</b>'+offs.map(function(o){ return '<span style="margin-right:16px;"><span style="color:var(--muted);">'+(o.kind==='director' ? 'KR院长' : 'KR室长')+'</span> <b style="color:#C1454A;">'+krEsc(o.who)+'</b>'+(o.note?' <span style="color:var(--muted);">'+krEsc(o.note)+'</span>':'')+'</span>'; }).join('')+'</div>';
}

function krGreeting(){ var hr = nowDateObj().getHours(); return (hr < 12 ? '早上好' : hr < 18 ? '下午好' : '晚上好')+'，'+(ME_NAME||''); }
function krRenderDashboard(){
  var el = document.getElementById('krdash-body'); if(!el) return;
  var hid = krHospitalIdOfMe(), h = krHData(), rows = krAllCases();
  var td0 = new Date(krToday()+'T00:00:00'); /* CMD-1015-02：问候行 + 右上日期照 IN 的排法（.dash-top / .dash-greet h1 / .dash-meta .date） */
  var head = '<div class="dash-top"><div class="dash-greet"><h1>'+krEsc(krGreeting())+'</h1></div><div class="dash-meta"><div class="date" data-clock="1">'+dashClockHtml()+'</div><div class="weather">☁ '+((TZ_INFO['Asia/Seoul']||{}).city||'首尔')+' '+((TZ_INFO['Asia/Seoul']||{}).temp||18)+'℃</div></div></div>';
  if(krIsDirector()){ el.innerHTML = head + krOffBar(hid) + todoKrDirCardsHtml() + todoKrCalWrap(krCalendarHtml()); return; } /* CMD-1015-15：院长也有 4 张卡 */
  var banner = ''; /* CMD-1014-18 三·6：拿掉「确认今日院长日程」黄色横幅 */
  el.innerHTML = head + krOffBar(hid) + banner + todoKrCardsHtml(rows) + todoKrCalWrap(krCalendarHtml()); /* CMD-1013-17：卡片 8→4 + 待办栏 */
}


/* ---------- 四、KR 案件列表（KR-CASE-03） ---------- */
var KR_TABS = [
  {key:'all', label:'全部'}, {key:'consult', label:'面诊'}, {key:'confirm', label:'项目确认中'}, {key:'sched', label:'施术预约'}, {key:'travel', label:'赴韩施术'}, {key:'postcare', label:'术后管理'}, {key:'krmgmt', label:'在韩管理'}, {key:'ended', label:'已结束'}
];
/* 案件属于哪个 tab（按案件主状态）；本地管理 / 选择项目 / 面诊已取消 这些 KR 已经不用操作的，我的判断：归"已结束"（待确认） */
function krTabOf(r){
  var l = r.label;
  if(r.c.stage==='postcare') return 'postcare'; /* CMD-1015-17 */
  if(r.c.stage==='krmgmt') return 'krmgmt';
  if(l==='面诊预约' || l==='等待报告') return 'consult';
  if(l==='项目确认中') return 'confirm';
  if(l==='施术预约') return 'sched';
  if(l==='赴韩施术') return 'travel';
  return 'ended';
}
/* 关键时间：按状态给出最需要看的那个时间 */
function krKeyTime(r){
  var c = r.c;
  if(c.consultStatus==='paid_waiting_kr') return '待确认报告时间';
  if(c.consultStatus==='awaiting_report') return '预计 '+(fmtUtc(c.reportEta)||'—')+(reportOverdueNow(c)?'（已超时）':'');
  var nextSub = (c.subItems||[]).filter(function(s){ return !s.done; })[0];
  if(nextSub && c.krBalancePaid) return '下一项 '+nextSub.date+' '+nextSub.content;
  var ks = c.krSchedule;
  if(ks && ks.confirmedDate) return '施术 '+ks.confirmedDate+(ks.confirmedTime?' '+ks.confirmedTime:'');
  if(ks && ks.primary) return '希望 '+ks.primary;
  if(c.reportDate) return '报告 '+c.reportDate;
  return '—';
}
/* 紧急程度（数字小的在前）：已超时 → 快到期 → 改期待确认 → 待确认施术时间 → 今天到院 → 待确认报告时间 → 其他 */
function krUrgency(r){
  var d = KR_CARDS;
  if(r.c.consultStatus==='awaiting_report' && reportOverdueNow(r.c)) return 0;
  if(d[1].test(r)) return 1;
  if(d[3].test(r)) return 2;
  if(d[2].test(r)) return 3;
  if(d[4].test(r)) return 4;
  if(d[0].test(r)) return 5;
  if(d[5].test(r)) return 6;
  if(d[6].test(r)) return 7;
  return 9;
}
function krSubHtml(items){
  if(!items || !items.length) return '';
  return items.map(function(it){ var col = it.kind==='Success' ? 'var(--sage)' : it.kind==='Warning' ? '#A8740A' : 'var(--slate2)'; return '<div style="font-size:11px;color:'+col+';">'+(it.kind==='Success'?'✓ ':it.kind==='Warning'?'⚠ ':'')+krEsc(it.text)+'</div>'; }).join('');
}
function krFilteredRows(){
  var me = currentAccount(), f = KR_LIST, q = (f.q||'').trim().toLowerCase();
  var card = KR_CARDS.filter(function(c){ return c.key===f.card; })[0];
  return krAllCases().filter(function(r){
    if(card && !card.test(r)) return false;
    if(f.tab!=='all' && krTabOf(r)!==f.tab) return false;
    if(f.clinic && r.clinicId!==f.clinic) return false;
    if(f.director && r.director!==f.director) return false;
    if(f.mine && (r.krCoordinator||'').split(' ')[0] !== (me.name||'').split(' ')[0]) return false;
    if(q && (r.name+' '+r.caseNo).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort(function(a,b){ return caseUpdatedDesc(a.c, b.c); }); /* CMD-1015-05 十一：按最近更新排序（原来按紧急程度 + 关键时间） */
}
function krSetList(k, v){ KR_LIST[k] = v; if(k==='tab') krRenderCases(); else krRenderCaseRows(); }
function krClearCard(){ KR_LIST.card = ''; krRenderCases(); }

function krRenderCases(){
  var el = document.getElementById('krcases-body'); if(!el) return;
  var hid = krHospitalIdOfMe(), all = krAllCases(), isDir = krIsDirector();
  var counts = {}; KR_TABS.forEach(function(t0){ counts[t0.key] = t0.key==='all' ? all.length : all.filter(function(r){ return krTabOf(r)===t0.key; }).length; });
  var tabs = KR_TABS.map(function(t0){ var on = KR_LIST.tab===t0.key; return '<span class="tab'+(on?' active':'')+'" onclick="krSetList(\'tab\',\''+t0.key+'\')">'+t(t0.label)+'</span>'; }).join(''); /* CMD-1015-03：IN 的下划线 tab、不带件数 */
  var clinicOpts = '<option value="">全部来源诊所</option>'+krClinics().map(function(cl){ return '<option value="'+cl.id+'"'+(KR_LIST.clinic===cl.id?' selected':'')+'>'+krEsc(cl.name)+'</option>'; }).join('');
  var dirOpts = '<option value="">全部院长</option>'+hospitalDirectorNames(hid).map(function(d){ return '<option value="'+krEsc(d)+'"'+(KR_LIST.director===d?' selected':'')+'>'+krEsc(d)+'</option>'; }).join('');
  var card = KR_CARDS.filter(function(c){ return c.key===KR_LIST.card; })[0];
  var fsel = 'padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;';
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;"><div class="tabs" style="flex:1 1 380px;">'+tabs+'</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
      '<select onchange="krSetList(\'clinic\',this.value)" style="'+fsel+'">'+clinicOpts+'</select>'+
      (isDir ? '' : '<select onchange="krSetList(\'director\',this.value)" style="'+fsel+'">'+dirOpts+'</select>')+
      '<input placeholder="搜索客户姓名 / Case ID" value="'+krEsc(KR_LIST.q)+'" oninput="krSetList(\'q\',this.value)" style="'+fsel+'min-width:180px;">'+
      (isDir ? '' : '<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;"><input type="checkbox" '+(KR_LIST.mine?'checked':'')+' onchange="krSetList(\'mine\',this.checked)"> 仅看我的</label>')+
      (card ? '<span class="status-pill" style="background:var(--blue-bg);color:var(--blue);cursor:pointer;" onclick="krClearCard()">筛选：'+t(card.label)+' ✕</span>' : '')+
    '</div></div>'+
    '<div class="card" style="padding:4px 20px;" id="kr-rows"></div>';
  krRenderCaseRows();
}
function krRenderCaseRows(){
  var box = document.getElementById('kr-rows'); if(!box) return;
  /* CMD-1015-17：Case ID ｜ 客户姓名 ｜ 来源诊所 ｜ 阶段 ｜ 进程 ｜ 财务 ｜ 对接院长 ｜ IN 室长 ｜ KR 室长 ｜ 开始时间 ｜ 更新时间；有子案件的 Case ID 前加 ▼ */
  var rows = krFilteredRows(), g = 'minmax(0,1.0fr) minmax(0,1.0fr) minmax(0,0.9fr) minmax(0,0.8fr) minmax(0,1.3fr) minmax(0,1.0fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,0.7fr)';
  box.innerHTML = '<div class="trow head" style="grid-template-columns:'+g+';"><span>Case ID</span><span>客户姓名</span><span>来源诊所</span><span>阶段</span><span>进程</span><span>财务</span><span>对接院长</span><span>IN 室长</span><span>KR 室长</span><span>开始时间</span><span>更新时间</span></div>'+
    (rows.length ? rows.map(function(r){
      var key = r.clinicId+':'+r.id, open = !!KR_ROW_OPEN[key], si = caseStageInfo(r.c);
      var main = '<div class="trow" onclick="krOpenCase(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:'+g+';cursor:pointer;align-items:start;">'+
        '<span style="font-size:12px;">'+(r.subs.length ? '<span onclick="event.stopPropagation();krRowToggle(\''+key+'\')" title="展开子案件" style="cursor:pointer;display:inline-block;width:16px;">'+(open ? '▲' : '▼')+'</span>' : '<span style="display:inline-block;width:16px;"></span>')+krEsc(r.caseNo)+'</span>'+
        '<span><b>'+krEsc(r.name)+'</b>'+presTag(r.clinicId, r.id)+'</span><span>'+krEsc(r.clinicName)+'</span>'+
        '<span><span class="status-pill" style="background:'+r.badge[0]+';color:'+r.badge[1]+';white-space:nowrap;">'+krEsc(si.stage)+'</span></span><span style="font-size:12px;">'+krEsc(si.proc)+(r.hold ? ' '+KR_HOLD_TAG : '')+krSubHtml(r.subItems)+krTodayVisits(r.c).map(function(s){ return '<div style="margin-top:4px;font-size:11px;">今天 '+krEsc(s.time||'')+' '+krEsc(s.content)+' '+(s.arrived ? '<span style="color:var(--sage);font-weight:700;">✓ 已到店</span>' : (krCan() ? '<button class="btn-outline" style="padding:1px 8px;font-size:11px;" onclick="event.stopPropagation();krCliAct(\'krSubArrived\',\''+r.clinicId+'\',\''+r.id+'\',\''+s.id+'\')">客人已到店</button>' : ''))+'</div>'; }).join('')+'</span>'+
        '<span>'+r.fin+'</span><span style="font-size:12px;">'+krEsc(r.director)+'</span><span style="font-size:12px;">'+krEsc(r.inOps||'—')+'</span><span style="font-size:12px;">'+krEsc(r.krCoordinator)+'</span>'+
        '<span style="color:var(--muted);font-size:12px;">'+krEsc(r.start)+'</span><span style="color:var(--muted);font-size:12px;">'+krEsc(r.updated)+'</span></div>';
      var sub = open ? r.subs.map(function(s){ return '<div class="trow" onclick="krOpenSubCard(\''+r.clinicId+'\',\''+r.id+'\',\'\')" style="grid-template-columns:'+g+';cursor:pointer;background:var(--bg-sidebar,#faf6ef);"><span style="font-size:12px;padding-left:22px;">'+krEsc(s.dno)+'</span><span></span><span></span><span><span class="status-pill" style="background:'+r.badge[0]+';color:'+r.badge[1]+';white-space:nowrap;">术后管理</span></span><span style="font-size:12px;">'+(s.place==='IN' ? '印尼' : '韩国')+'：'+krEsc(s.text)+' · '+(s.done ? '已完成' : (s.arrived ? '已到店' : '待到店'))+'</span><span></span><span></span><span></span><span></span><span style="font-size:12px;color:var(--muted);">'+krEsc(s.when)+'</span><span style="font-size:12px;color:var(--muted);">'+(s.doneAt ? krEsc(fmtUtc(s.doneAt)) : '')+'</span></div>'; }).join('') : '';
      return main+sub;
    }).join('') : '<div style="padding:24px;color:var(--muted);text-align:center;">没有符合条件的案件</div>');
}

/* ---------- 五、KR 案件详情骨架（KR-CASE-01 第 1 节）：现在全部只读，面诊/项目/施术的操作在后面几份指令里做 ---------- */
var KR_CASE = {clinicId:'', id:'', tab:'basic'};
var KR_CASE_TABS = [{key:'basic', label:'基础资料'}, {key:'consult', label:'面诊'}, {key:'items', label:'项目'}, {key:'files', label:'附件'}, {key:'related', label:'关联案件'}, {key:'log', label:'Timeline'}]; /* 拿掉「KR 专用附件」，只留共用附件（CMD-1013-08 四·1） */
function krShowCase(clinicId, id){ KR_SUB_HL = null; var r0 = krFindCase(clinicId, id), c0 = r0 && r0.c, t0 = (c0 && c0.consultRequested && !c0.reportReady && ['paid_waiting_kr','awaiting_report'].indexOf(c0.consultStatus)>-1) ? 'consult' : 'basic'; /* 2026-10-08：面诊进行中的案件，KR 室长点开直接进面诊 tab */ KR_CASE = {clinicId:clinicId, id:id, tab:t0}; if(CURRENT_PAGE_ID==='kr-casedetail'){ krRenderCaseDetail(); } else nav('kr-casedetail'); }
function krSetCaseTab(k){ KR_CASE.tab = (k==='proc' ? 'items' : k); /* CMD-1015-18：施术 tab 并进「项目」 */ krRenderCaseDetail(); }

function krKV(label, val){ return '<div class="field-row"><span class="fk">'+label+'</span><span class="fv" style="font-weight:400;">'+val+'</span><span class="fa"></span></div>'; }
function krCardBox(title, body){ return '<div class="card" style="padding:16px 22px;">'+(title?'<div class="info-heading" style="margin-bottom:6px;">'+title+'</div>':'')+body+'</div>'; }
function krEmpty(txt){ return '<div style="padding:14px 0;color:var(--muted);font-size:13px;">'+(txt||'—')+'</div>'; }

/* 各 tab 的内容（在 Store.withClinic 里调用，c 是该诊所分区里的案件） */
function krTabBasic(c){
  var b = caseBasic(c), cl = clientByName(c.name);
  var recs = beautyRecordsOf(cl).slice().sort(function(x,y){ return (y.year*100+y.month)-(x.year*100+x.month); });
  var beauty = recs.length ? recs.map(function(r){
    var isNew = r.newCaseId === c.id; /* KR 看到的"本次新增"：这一笔是为本案件新增的（不受 IN 确认基础资料后标记消失的影响） */
    return '<div class="case-field-row"><span style="min-width:90px;font-size:13px;">'+beautyYm(r)+'</span><span style="flex:1;font-size:13px;">'+krEsc(r.project)+'</span>'+(isNew?'<span class="status-pill" style="background:#FBF0C9;color:#8F6F0C;">本次新增</span>':'')+'<span style="font-size:11px;color:var(--muted);margin-left:8px;">'+krEsc(r.source)+'</span></div>';
  }).join('') : krEmpty('没有医美史记录');
  return krCardBox('客户信息',
      krKV('客户姓名', krEsc(c.name))+krKV('性别', krEsc(b.gender))+krKV('出生日期', krEsc(b.dob))+krKV('联系方式', krEsc(maskPhone(b.contact))+' <span style="font-size:11px;color:var(--muted);">（联系方式由印尼室长处理，KR 端不显示）</span>')+krKV('病史 / 过敏史', krEsc(b.history)))+
    krCardBox('本次需求', krKV('苦恼', krEsc(c.concern||'—'))+krKV('希望', krEsc(c.expectation||'—'))+krKV('预算', (c.budgetMin||c.budgetMax) ? fmtRp(c.budgetMin)+' ～ '+fmtRp(c.budgetMax) : '—'))+
    krCardBox('医美史', beauty)+
    krCardBox('检测与上传', krUploadRow(c, '메타뷰 检测', '메타뷰 检测报告', c.metaviewStatus==='ready', '已检测到')+krUploadRow(c, '照片', '照片', c.photoUploaded, '✓ 已上传')+krUploadRow(c, '视频', '视频', c.videoUploaded, '✓ 已上传'));
}
/* ---- 面诊 tab（KR-CASE-01 第 2 节）：按状态给不同内容；操作都经 Store.mutateClinic 写进来源诊所的分区 ---- */
function krCan(){ return canDo('krwork'); } /* 室长 / 管理者 */
function krIsMyCase(c){ var me = currentAccount(); return !!me && (!isKrDirectorLike(me) || c.director===me.name); }
function krMut(fn){ KR_LAST_CONFLICT = ''; var r = Store.mutateClinic(KR_CASE.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===KR_CASE.id; })[0]; return c ? fn(c) : undefined; }); krRefreshAll(); if(KR_LAST_CONFLICT){ var m = KR_LAST_CONFLICT; KR_LAST_CONFLICT = ''; krBlock(m); } return r; }
/* 时间冲突 Modal（Popup 弹窗规则：挡住类，只有［知道了］）：列出撞到的是哪一件 */
function krBlock(msg){
  var ov = document.getElementById('kr-block-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'kr-block-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = '<div class="modal-box" style="width:440px;"><div style="font-size:15px;font-weight:700;margin-bottom:10px;color:#B3261E;">时间冲突，不能这样排</div><div style="font-size:13px;line-height:1.7;white-space:pre-wrap;margin-bottom:16px;">'+krEsc(msg)+'</div><button class="btn-primary" style="width:100%;" onclick="document.getElementById(\'kr-block-overlay\').classList.remove(\'open\')">知道了</button></div>';
  ov.style.zIndex = 100010; ov.classList.add('open');
}
/* 指定了院长的术后管理 / 预约使用行（含别家诊所的案件，只读取）：同一位院长同一时段只能有一件事，这些行也算 */
function krDirectorRowsAll(director){
  var out = []; try{ krAllCases().forEach(function(r){ (r.c.subItems||[]).forEach(function(s){ if(s.director===director && s.date && s.time && !s.done && !s.skipped) out.push({id:s.id, date:s.date, time:s.time, director:director, name:r.name}); }); }); }catch(e){}
  return out;
}
/* KR 时间下拉（CMD-1012-01）：只列医院营业时间内的时间；施术 / 到院时间（kind 默认 'surgery'）还要避开午休开始；不可预约的起止（kind 'range'）列到营业结束 */
function krTimeOptions(sel, kind){
  /* 施术 / 到院时间可以选午休、营业前、营业后的时间（确认时弹窗再问一次，CMD-1013-02 二）；不可预约的起止仍限在营业时间内 */
  var hid = krHospitalIdOfMe(), hr = hospitalHours(hid), o = '', from = kind==='range' ? timeToMin(hr.open) : 6*60, to = kind==='range' ? timeToMin(hr.close) : 23*60+30;
  for(var m = from; m <= to; m += 30){
    var tt = minToTime(m); o += '<option'+(tt===sel?' selected':'')+'>'+tt+'</option>';
  }
  return o;
}
function krDateAdd(n){ var d = new Date(nowDateObj().getTime() + n*86400000); return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }

/* 一、确认两个时间：面诊时间（给院长，默认今天）+ 预计出报告时间（给客人 / IN，默认 = 面诊时间 + 30 分钟）（CMD-1008-12 C3） */
function krDefaultConsultTime(){
  var hr = hospitalHours(krHospitalIdOfMe()), d = nowDateObj(), m = d.getHours()*60 + d.getMinutes();
  m = Math.ceil(m/30)*30; /* 现在之后的下一个半点 */
  if(m < timeToMin(hr.open) || m > timeToMin(hr.close)-30) m = timeToMin(hr.open);
  return minToTime(m);
}
function krEtaFrom(cd, ct){ var m = timeToMin(ct)+30, d = cd; if(m >= 1440){ m -= 1440; d = krcAdd(cd, 1); } return [d, minToTime(m)]; }
var KR_CT = {caseKey:'', cd:'', ct:'', ed:'', et:'', touched:false};
function krCtReset(c){
  var key = krRecKey()+':'+c.consultStatus;
  if(KR_CT.caseKey===key) return;
  var ct = krDefaultConsultTime(), e = krEtaFrom(krToday(), ct);
  KR_CT = {caseKey:key, cd:krToday(), ct:ct, ed:e[0], et:e[1], touched:false};
}
function krCtSet(k, v){
  KR_CT[k] = v;
  if(k==='ed' || k==='et') KR_CT.touched = true;
  else if(!KR_CT.touched){ var e = krEtaFrom(KR_CT.cd, KR_CT.ct); KR_CT.ed = e[0]; KR_CT.et = e[1]; } /* 没手动改过预计时间：跟着面诊时间走（+30 分钟） */
  krRenderCaseDetail();
}
function krHourOptions(sel, from, to){ var o = ''; for(var m = timeToMin(from); m <= timeToMin(to); m += 30){ var tt = minToTime(m); o += '<option'+(tt===sel?' selected':'')+'>'+tt+'</option>'; } return o; }
function krConsultTimesBlock(c){
  krCtReset(c);
  var hid = krHospitalIdOfMe(), hr = hospitalHours(hid), inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
  var offs = krOffRows(hid, KR_CT.cd).filter(function(o){ return o.who===c.director; });
  var form = krCan()
    ? '<div style="display:grid;grid-template-columns:110px 1fr;gap:10px 12px;align-items:center;margin-top:10px;">'+
      '<span style="font-size:13px;font-weight:700;">面诊时间</span><span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><input type="date" value="'+KR_CT.cd+'" min="'+krToday()+'" onchange="krCtSet(\'cd\',this.value)" style="'+inp+'"><select onchange="krCtSet(\'ct\',this.value)" style="'+inp+'">'+krHourOptions(KR_CT.ct, '06:00', '23:30')+'</select></span>'+
      '<span style="font-size:13px;font-weight:700;">预计出报告时间</span><span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><input type="date" value="'+KR_CT.ed+'" min="'+KR_CT.cd+'" onchange="krCtSet(\'ed\',this.value)" style="'+inp+'"><select onchange="krCtSet(\'et\',this.value)" style="'+inp+'">'+krHourOptions(KR_CT.et, '00:00', '23:30')+'</select></span></div>'+
      '<div style="margin-top:12px;"><button class="btn-primary" onclick="krDoConfirmTimes()">确认</button></div>'
    : '<div style="font-size:12px;color:var(--muted);margin-top:8px;">面诊时间和预计出报告时间由 KR 室长确认，院长账号不能改。</div>';
  return krCardBox('确认面诊时间和预计出报告时间',
    krDirLine(c)+'<div style="font-size:12px;color:var(--slate2);margin-bottom:8px;">'+krEsc(c.director||'—')+' 当天的日程</div>'+krDirDayText(hid, c.director, KR_CT.cd)+
    (offs.length ? '<div style="font-size:12px;color:#C26A1B;margin-top:4px;">⚠ 院长 OFF：'+offs.map(function(o){ return krEsc(o.date+' '+(o.part||'全天')); }).join('、')+'</div>' : '')+form);
}
/* 院长某一天"几点～几点不行"：已有的施术 / 面诊 / 不可预约块 + 半天 OFF；整天 OFF / 医院休诊 = 整天不行 */
function krDirUnavail(hid, director, date){
  var out = [], h = HOSPITAL_DATA[hid] || {};
  if(hospitalClosedOn(hid, date)) return {whole:'医院休诊', ranges:[]};
  var offs = (h.offs||[]).filter(function(o){ return o.kind==='director' && o.who===director && offApplies(o, date); });
  if(offs.some(function(o){ return !o.part || o.part==='全天'; })) return {whole:'OFF（全天）', ranges:[]};
  offs.forEach(function(o){ var rg = krHalfRange(hid, offPartArg(o.part)); out.push({a:rg[0], b:rg[1], tag:'OFF（'+o.part+'）'}); });
  ((h.directorSchedule||{})[director]||[]).filter(function(b){ return b.date===date; }).forEach(function(b){ out.push({a:b.time, b:b.end, tag:b.kind==='施术' ? '施术' : (b.kind==='面诊' ? '面诊' : '不可预约')}); });
  var cf = hospitalClosedFrom(hid, date); if(cf) out.push({a:cf, b:hospitalHours(hid).close, tag:'医院休诊'});
  var cb0 = hospitalClosedBefore(hid, date); if(cb0) out.push({a:hospitalHours(hid).open, b:cb0, tag:'医院休诊'});
  out.sort(function(x, y){ return timeToMin(x.a) - timeToMin(y.a); });
  return {whole:'', ranges:out};
}
function krDirDayText(hid, director, date){
  return '<div style="font-size:12px;margin-bottom:6px;"><b>'+krEsc(date)+'</b></div>'+krDayAgendaHtml(director, date); /* 确认时间时的当天日程：按时间排序，每行写类型（CMD-1013-08 五·2） */
}
function krDirDayTextOld(hid, director, date){
  var u = krDirUnavail(hid, director, date);
  var lines = u.whole ? ['整天不可预约（'+u.whole+'）'] : u.ranges.map(function(r){ return r.a+'～'+r.b+' 不可预约'; });
  return '<div style="font-size:12px;margin-bottom:6px;"><b>'+krEsc(date)+'</b>'+(lines.length ? lines.map(function(l){ return '<div style="color:#C1454A;margin-top:2px;">'+krEsc(l)+'</div>'; }).join('') : '<div style="color:var(--sage);margin-top:2px;">当天没有不可预约的时段</div>')+'</div>';
}
/* 非营业时间确认（午休 / 营业前 / 营业后）：弹窗［确认］就约，［更换时间］关闭（CMD-1013-02 二） */
function krOffHoursText(hid, date, time, dur){
  var s = timeToMin(time), e = s + (dur||30), hr = hospitalHours(hid), lu = hospitalLunch(hid), cf = hospitalClosedFrom(hid, date), cb = hospitalClosedBefore(hid, date);
  if(lu && s >= timeToMin(lu.from) && s < timeToMin(lu.to)) return '这是午休时间';
  if(s < timeToMin(hr.open) || e > timeToMin(hr.close) || (cf && e > timeToMin(cf)) || (hospitalClosedBefore(hid, date) && s < timeToMin(hospitalClosedBefore(hid, date)))) return '这是营业时间外';
  return '';
}
function krOffConfirm(text, onOk){
  var ov = document.getElementById('kr-off-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'kr-off-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  window.__krOffOk = function(){ ov.classList.remove('open'); try{ onOk(); }catch(e){ console.error(e); } };
  ov.innerHTML = '<div class="modal-box" style="width:380px;"><div style="font-size:15px;font-weight:700;margin-bottom:10px;">'+krEsc(text)+'</div><div style="font-size:13px;color:var(--slate2);margin-bottom:16px;">确认预约这个时间吗？</div><div style="display:flex;gap:10px;"><button class="btn-primary" style="flex:1;" onclick="__krOffOk()">确认</button><button class="btn-outline" style="flex:1;" onclick="document.getElementById(\'kr-off-overlay\').classList.remove(\'open\')">更换时间</button></div></div>';
  ov.classList.add('open');
}
function krDoConfirmTimes(){
  if(!krCan()) return; /* 院长不能确认 / 修改时间 */
  var cd = KR_CT.cd, ct = KR_CT.ct, ed = KR_CT.ed, et = KR_CT.et;
  if(!cd || !ct || !ed || !et){ alert('请填面诊时间和预计出报告时间'); return; }
  var eta = localToUtc(ed, et, KR_TZ); /* KR 输入的是韩国当地时间，存 UTC */
  if(localToUtc(cd, ct, KR_TZ) >= eta){ alert('预计出报告时间必须晚于面诊时间'); return; }
  if(eta <= nowFullDt()){ alert('预计出报告时间必须晚于现在'); return; }
  var rr = krFindCase(KR_CASE.clinicId, KR_CASE.id); if(!rr) return;
  var dur = (ed===cd) ? Math.min(240, Math.max(30, timeToMin(et)-timeToMin(ct))) : 30;
  var er = krSurgerySlotError(krHospitalIdOfMe(), rr.c.director, cd, ct, dur, KR_CASE.clinicId+':'+KR_CASE.id, {exceptKind:'面诊', allowOffHours:true}); /* 同一位院长同一时间只能有一件事；午休 / 营业时间外只提醒 */
  if(er){ krBlock(er); return; }
  var go = function(){ KR_CT.caseKey = ''; krMut(function(c){ return coreConfirmConsultTimes(c, cd, ct, eta, ME_NAME); }); Store.touch(); krRefreshAll(); };
  var off = krOffHoursText(krHospitalIdOfMe(), cd, ct, dur); if(off) krOffConfirm(off+'（面诊 '+cd+' '+ct+'，韩国时间）', go); else go();
}
function krDoEta(change){
  if(!krCan()) return; /* 院长不能确认/修改时间 */
  var d = document.getElementById('kr-eta-d').value, tm = document.getElementById('kr-eta-t').value;
  if(!d || !tm){ alert('请填日期和时间'); return; }
  var eta = localToUtc(d, tm, KR_TZ); /* KR 输入的是韩国当地时间，存 UTC */
  if(eta <= nowFullDt()){ alert('预计出报告时间必须晚于现在'); return; }
  KR_ETA_EDIT = false;
  krMut(function(c){ return coreSetReportEta(c, eta, ME_NAME, !!change); });
  Store.touch();
}
/* 修改预计出报告时间（等待报告中，只改这一个时间；面诊时间不动） */
function krEtaBlock(c, change){
  var base = c.reportEta ? fmtUtc(c.reportEta, KR_TZ).split(' ') : [krDateAdd(1), '14:00'], inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
  return krCardBox('修改预计出报告时间（院长 '+krEsc(c.director||'—')+'）', krCan() ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px;"><input type="date" id="kr-eta-d" value="'+base[0]+'" min="'+krToday()+'" style="'+inp+'"><select id="kr-eta-t" style="'+inp+'">'+krHourOptions(base[1], '00:00', '23:30')+'</select><button class="btn-primary" onclick="krDoEta(true)">确认修改</button><button class="btn-ghost" onclick="krSetEtaEdit(false)">取消</button></div>' : '<div style="font-size:12px;color:var(--muted);">预计出报告时间由 KR 室长修改，院长账号不能改。</div>');
}
var KR_ETA_EDIT = false;
function krSetEtaEdit(v){ KR_ETA_EDIT = v; krRenderCaseDetail(); }
function krEtaStatusBlock(c){
  var over = reportOverdueNow(c), started = !!c.consultStartedAt, ended = !!c.consultContentAt, canStart = krCanRecord(c) && !started && !ended;
  /* 一张卡片：面诊时间 / 预计出报告时间 / 倒计时 / 当前小状态 /［开始面诊］/［修改预计时间］ */
  return krCardBox('面诊', krDirLine(c)+(c.consultAt ? krKV('面诊时间（韩国）', krEsc(c.consultAt.date+' '+c.consultAt.time)) : '')+krKV('预计出报告时间', krEsc(fmtUtc(c.reportEta) ? fmtUtc(c.reportEta)+'（韩国）' : '—'))+krKV('倒计时', over ? '<b style="color:#C26A1B;">已超过预计时间</b>' : krEsc(reportRemainingText(c)))+
    krKV('当前小状态', krSubHtml(caseSubStatusItems(c)) || '—')+
    (over ? '<div style="background:#FDEBD3;color:#A85A10;border-radius:8px;padding:9px 12px;font-size:12px;margin-top:8px;">⏰ 已超过预计出报告时间，诊疗方案还没发送。请尽快发送，或修改预计时间（IN 端会收到通知）。</div>' : '')+
    '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">'+(canStart ? '<button class="btn-primary" onclick="krStartConsult()">开始面诊</button>' : '')+(krCan() && !KR_ETA_EDIT ? '<button class="btn-outline" onclick="krSetEtaEdit(true)">修改预计时间</button>' : '')+'</div>');
}
function krStartConsult(){
  if(krIsDirector()){ krStartChooseOpen(); return; } /* 院长账号：先弹窗选录入方式，再新分页打开输入页 */
  krMut(function(c){ return krCanRecord(c) ? coreStartConsult(c, ME_NAME) : false; });
}
/* 院长［开始面诊］→ 弹窗选方式（语音 / 手动）→ 开始面诊 + 新分页打开对应的输入页；原案件页自动切到「基础资料」tab（CMD-1012-08 三·1） */
function krStartChooseOpen(){
  var ov = document.getElementById('kr-start-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'kr-start-overlay'; ov.className = 'modal-overlay'; ov.onclick = function(e){ if(e.target===ov) ov.classList.remove('open'); }; document.body.appendChild(ov); }
  ov.innerHTML = '<div class="modal-box" style="width:420px;"><div style="display:flex;justify-content:space-between;margin-bottom:12px;"><b style="font-size:15px;">开始面诊</b><span style="cursor:pointer;" onclick="document.getElementById(\'kr-start-overlay\').classList.remove(\'open\')">✕</span></div>'+
    '<div style="font-size:13px;color:var(--slate2);margin-bottom:14px;">选择录入方式。确定后会弹出一个小的录入窗口，这个案件页保持不动，方便对照资料。</div>'+
    '<div style="display:flex;gap:10px;"><button class="btn-primary" style="flex:1;" onclick="krStartWith(\'voice\')">🎙 语音录入</button><button class="btn-outline" style="flex:1;" onclick="krStartWith(\'manual\')">⌨ 手动输入</button></div></div>';
  ov.classList.add('open');
}
function krStartWith(mode){
  var ov = document.getElementById('kr-start-overlay'); if(ov) ov.classList.remove('open');
  var w = window.open(krRecUrl(mode, false), 'krrec', 'popup=yes,width=640,height=720,left=120,top=60'); /* 必须在点击里同步打开，否则会被浏览器拦截；原案件页不跳转 */
  krMut(function(c){ return krCanRecord(c) ? coreStartConsult(c, ME_NAME) : false; });
  if(!w) alert('浏览器拦截了弹出窗口：请允许弹出窗口，或在面诊 tab 点［录入面诊］');
}
/* 面诊卡片第一行「负责院长：KD1 院长」+［院长日程］（CMD-1012-08 二·1，取代原来的大字院长卡片） */
function krDirLine(c){ return krKV('负责院长', krEsc(c.director||'—')+(c.director ? ' <button class="btn-outline" style="padding:2px 12px;font-size:12px;margin-left:8px;" onclick="krDirSchedPopup(\''+krEsc(c.director).replace(/'/g,'')+'\')">院长日程</button>' : '')); }
function krConsultTop(c){ return ''; }
function krConsultTopOld(c){
  return '<div class="card" style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div><div style="font-size:11px;color:var(--muted);">负责院长</div><div style="font-size:26px;font-weight:800;color:var(--navy);line-height:1.2;">'+krEsc(c.director||'—')+'</div></div>'+
    (c.director ? '<button class="btn-outline" onclick="krDirSchedPopup(\''+krEsc(c.director).replace(/'/g,'')+'\')">院长日程</button>' : '')+'</div>';
}
/* ［院长日程］弹窗：只显示这位院长，今天起 7 天：施术 / 面诊 / 不可预约 / OFF / 休诊 */
function krDirSchedPopup(name){
  var hid = krHospitalIdOfMe(), h = HOSPITAL_DATA[hid] || {}, ov = ensurePromoOverlay('kr-dirsched-overlay'), rows = '';
  for(var i = 0; i < 7; i++){
    var ds = krDateAdd(i), u = krDirUnavail(hid, name, ds);
    var blocks = ((h.directorSchedule||{})[name]||[]).filter(function(b){ return b.date===ds; }).sort(function(a,b){ return a.time.localeCompare(b.time); }).map(function(b){ return '<div style="font-size:12px;margin:2px 0;"><b>'+krEsc(b.time+'～'+b.end)+'</b> '+(b.kind==='施术' ? '施术' : (b.kind==='面诊' ? '面诊' : '不可预约'))+(b.name ? ' · '+krEsc(b.name) : '')+'</div>'; }).join('');
    rows += '<div style="padding:8px 0;border-bottom:1px solid var(--border2);"><div style="font-size:13px;font-weight:700;">'+krEsc(ds)+' 周'+krcDow(ds)+(u.whole ? ' <span style="color:#C1454A;font-size:12px;">整天不行（'+krEsc(u.whole)+'）</span>' : '')+'</div>'+(blocks || '<div style="font-size:12px;color:var(--muted);">没有日程</div>')+'</div>';
  }
  ov.firstChild.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><b style="font-size:15px;">'+krEsc(name)+' 的日程（未来 7 天）</b><span style="cursor:pointer;" onclick="closePromoOverlay(\'kr-dirsched-overlay\')">✕</span></div>'+rows;
  ov.classList.add('open');
}
function krTabConsult(c){
  var fee = consultFeeStatusMain(c), out = '';
  var head = (c.consultStatus==='paid_waiting_kr' || c.consultStatus==='awaiting_report') ? '' : krCardBox('面诊', krDirLine(c)); /* 院长在面诊卡片第一行（进行中的状态在下面各自的卡片里）；面诊费卡片、当前小状态卡片已并进「面诊」卡片（CMD-1012-05） */
  if(c.reuseReport) return head+krCardBox('沿用原诊疗方案', krKV('来源', krEsc(c.reuseReport.caseNo)+'（'+krEsc(c.reuseReport.date||'')+'）')+krKV('报告', krEsc(c.videoSummary||'—')))+(typeof krAfterBlock==='function' ? krAfterBlock(c) : '');
  if(c.consultStatus==='paid_waiting_kr') return head+krConsultTimesBlock(c);
  if(c.consultStatus==='awaiting_report'){
    out = head+krEtaStatusBlock(c)+(KR_ETA_EDIT ? krEtaBlock(c, true) : '');
    if(isContinuationConsult(c)) return out+krJudgeBlock(c); /* 延续既往面诊：先判断有无变动 */
    return out+((c.consultStartedAt || c.consultContentAt) ? krRecordBlock(c) : ''); /* 按［开始面诊］之前不显示「录入面诊」和「发送诊疗方案」（CMD-1012-08 二·2） */
  }
  if(c.consultStatus==='report_ready') return head+krCardBox('报告', krKV('提交', krEsc(c.reportDate||'—')+'，'+krEsc(c.reportUploadedBy||'—'))+krKV('面诊摘要', krEsc(c.videoSummary||'—')))+(typeof krAfterBlock==='function' ? krAfterBlock(c) : '');
  return head;
}
/* 项目 tab 三张卡（CMD-1013-11 三）：施术项目（赴韩手术 + 当天加的管理 / 서비스，加的标「在韩增加」）/ 术后项目（术后管理）/ 持有项目（在韩持有，没有就不显示）；不再有「KR 可选范围」卡 */
/* CMD-1015-18：KR「项目」tab = ① 项目卡（施术项目 / 管理项目两页，只做总览）② 案件（主案件 + 每次来的子案件，操作都在这里） */
var KR_PROJ_PAGE = 'surg', KR_UNIT_CANCEL_OPEN = false;
function krProjPage(p){ KR_PROJ_PAGE = p; krRenderCaseDetail(); }
function krIsMgmtItem(it){ return krIsMgmtItemC(it); }
function krBuyTime(c, it){ var b = (c.settlementBatches||[]).filter(function(x){ return x.id===it.batchId; })[0]; return b && b.time ? fmtUtc(b.time).slice(2, 10) : '—'; }
function krPcGrid(){ return 'grid-template-columns:minmax(160px,1.6fr) 70px 96px 112px minmax(140px,auto);'; }
function krPcHead(cols){ return '<div style="display:grid;'+krPcGrid()+'gap:8px;font-size:11px;color:var(--muted);padding:4px 0;border-bottom:1px solid var(--border2);">'+cols.map(function(x){ return '<span>'+x+'</span>'; }).join('')+'</div>'; }
function krPcRow(name, type, cnt, time, ops, sub){ return '<div style="display:grid;'+krPcGrid()+'gap:8px;align-items:center;padding:7px 0;border-top:1px solid var(--border2);font-size:12px;"><span style="font-size:13px;">'+name+(sub ? '<div style="font-size:11px;color:var(--slate2);">'+sub+'</div>' : '')+'</span><span>'+krTypeTag(type)+'</span><span>'+cnt+'</span><span style="color:var(--slate2);">'+time+'</span><span style="text-align:right;white-space:nowrap;">'+ops+'</span></div>'; }
function krPcSec(title, cols, rows){ return rows.length ? '<div style="margin:10px 0 2px;font-size:12px;font-weight:700;">'+title+' <span style="font-weight:400;color:var(--muted);">'+rows.length+'</span></div>'+krPcHead(cols)+rows.join('') : ''; }
function krBtn(txt, fn, on, tip){ return '<button class="btn-'+(on?'primary':'outline')+'" '+(on ? 'onclick="'+fn+'"' : 'disabled title="'+krEsc(tip||'')+'"')+' style="padding:3px 10px;font-size:11px;'+(on?'':'opacity:.4;cursor:not-allowed;')+'">'+txt+'</button>'; }
function krViewBtn(key){ return '<a href="#" onclick="krViewCase(\''+String(key).replace(/'/g,'')+'\');return false;" style="font-size:12px;">查看案件</a>'; }
function krViewCase(key){
  if(key!=='main') KR_SUB_OPEN[key] = true; krRenderCaseDetail();
  setTimeout(function(){ var c = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, el = null; if(key==='main') el = document.getElementById('kr-maincard'); else { var rep = subCaseList(c).filter(function(r){ return subCaseKey(r)===key; })[0]; el = rep ? document.getElementById('kr-subrow-'+rep.id) : null; } if(el && el.scrollIntoView) el.scrollIntoView({block:'start', behavior:'smooth'}); }, 60);
}
function krUnitUseNow(name){ if(!krCan()) return; var r = null; krMut(function(c){ r = coreUnitUseNow(c, name, ME_NAME); if(!r.ok){ alert(r.err||'不能使用'); return false; } return true; }); }
/* 项目卡的内容：施术项目｜术后管理｜管理项目三页；每页 未使用 → 已预约 → 已完成 / 已使用（［查看案件］） */
function krProjCards(c){
  var can = krCan(), tg = coreUseTarget(c), paid = !!c.krBalancePaid, ks = c.krSchedule || {};
  var allItems = krAllItems(c), surg = allItems.filter(function(it){ return !krIsMgmtItemC(it); }), mgItems = allItems.filter(krIsMgmtItemC);
  var useBtns = function(name, pend){
    if(!can) return '';
    var okUse = !!tg && !pend, okBook = paid && !pend && !c.visitClosed, tip = pend ? '待付款，付款后才能操作' : '要有客人已到店的案件才能本次使用';
    return krBtn('本次使用', 'krUnitUseNow(\''+krEsc(name).replace(/'/g,'')+'\')', okUse, tip)+' '+krBtn('预约使用', 'krBkdOpen(\'use\',\''+krEsc(name).replace(/'/g,'')+'\')', okBook, pend ? tip : '付清尾款后才能预约');
  };
  /* ---- 施术项目 ---- */
  var sU = [], sB = [], sD = [], sC = [];
  surg.forEach(function(it){
    var plan = !(it.krAddOn || it.preBalanceAdd), nm = krEsc(it.name)+(it.qty>1 ? ' ×'+it.qty : '')+((!plan) ? ' <span class="status-pill" style="background:#FFF1D6;color:#C26A1B;font-size:10px;">在韩增加</span>' : '');
    var rows = (c.subItems||[]).filter(function(s){ return (s.kind==='增加项目' && s.projectName===it.name) || s.surgUse===it.name; }), open = rows.filter(function(s){ return !s.done; })[0], dn = rows.filter(function(s){ return s.done; })[0] || (plan ? (c.subItems||[]).filter(function(s){ return s.kind==='施术' && s.done; })[0] : null);
    var cnt = (it.qty||1)+' 次';
    if(it.cancelled || it.swapped){ sC.push(krPcRow(nm, '施术', cnt, '—', '<span style="color:var(--muted);">'+(it.swapped ? '已更换' : '已取消')+'</span>')); return; }
    if(it.pendingPay){ sU.push(krPcRow(nm, '施术', cnt+' <span style="color:#B3261E;">待付款</span>', krBuyTime(c, it), useBtns(it.name, true))); return; }
    if(it.done){ sD.push(krPcRow(nm, '施术', cnt, dn && dn.doneAt ? krEsc(fmtUtc(dn.doneAt).slice(2, 16)) : '—', krViewBtn(dn && dn.surgUse ? subCaseKey(dn) : 'main'))); return; }
    if(open){ sB.push(krPcRow(nm, '施术', cnt, krEsc(krShortDt(open.date, open.time || '')), (can && open.surgUse && !open.arrived ? '<a href="#" onclick="krSubTimeOpen(\''+open.id+'\');return false;" style="font-size:12px;">修改时间</a>' : ''))); return; }
    if(plan){ if(ks.confirmedDate && (ks.status==='confirmed' || ks.status==='arrived')) sB.push(krPcRow(nm, '施术', cnt, krEsc(krShortDt(ks.confirmedDate, ks.confirmedTime||''))+'（主案件）', '')); else sU.push(krPcRow(nm, '施术', cnt, krBuyTime(c, it), '<span style="color:var(--muted);font-size:11px;">施术日期确认后在主案件做</span>')); return; }
    sU.push(krPcRow(nm, '施术', cnt, krBuyTime(c, it), useBtns(it.name, false)));
  });
  var surgBody = krPcSec('未使用', ['项目','项目类型','次数','购买时间',''], sU)+krPcSec('已预约', ['项目','项目类型','次数','预约时间',''], sB)+krPcSec('已完成', ['项目','项目类型','次数','使用时间',''], sD)+(sC.length ? '<details style="margin-top:10px;"><summary style="font-size:12px;color:var(--slate2);cursor:pointer;">已取消 '+sC.length+'（默认收起）</summary>'+krPcHead(['项目','项目类型','次数','',''])+sC.join('')+'</details>' : '');
  /* ---- 术后管理 ---- */
  var cu = careUnits(c), pU = [], pB = [], pD = [];
  cu.unbooked.forEach(function(u){ var it = u.it; pU.push(krPcRow(krEsc(careUnitLabel(u.x)), '术后管理', '1 次', krBuyTime(c, it), can && paid && !c.visitClosed ? krBtn('预约时间', 'krBkdOpen(\'care\',\''+krEsc(it.name).replace(/'/g,'')+'\','+u.i+')', true) : krBtn('预约时间', '', false, paid ? '' : '付清尾款后才能预约'), '对应施术：'+krEsc(it.name))); });
  cu.rows.forEach(function(r){
    var s = r.s, sub = r.item ? '对应施术：'+krEsc(r.item) : '', it = (c.procedureItems||[]).filter(function(x){ return x.name===r.item; })[0];
    if(s.skipped){ var x = it && (it.postcare||[]).filter(function(p){ return (p.mgmt||p.name) && s.content.indexOf(p.mgmt||p.name)===0; })[0], idx = x ? it.postcare.indexOf(x) : 0; pU.push(krPcRow(krEsc(s.content), '术后管理', '1 次', it ? krBuyTime(c, it) : '—', can && paid ? krBtn('预约时间', 'krBkdOpen(\'care\',\''+krEsc(r.item).replace(/'/g,'')+'\','+idx+',\''+s.id+'\')', true) : '', sub+'（取消本次，待重新预约）')); return; }
    if(s.done){ pD.push(krPcRow(krEsc(s.content), '术后管理', '1 次', s.doneAt ? krEsc(fmtUtc(s.doneAt).slice(2, 16)) : '—', krViewBtn(subCaseKey(s)), sub)); return; }
    pB.push(krPcRow(krEsc(s.content), '术后管理', '1 次', krEsc(krShortDt(s.date, s.time||''))+(s.place==='IN' ? '（印尼建议日期）' : ''), (can && s.place!=='IN' && !s.arrived ? '<a href="#" onclick="krSubTimeOpen(\''+s.id+'\');return false;" style="font-size:12px;">修改时间</a>' : '')+(s.place!=='IN' ? ' '+krViewBtn(subCaseKey(s)) : ''), sub));
  });
  var careBody = krPcSec('未预约', ['项目','项目类型','次数','购买时间',''], pU)+krPcSec('已预约', ['项目','项目类型','次数','预约时间',''], pB)+krPcSec('已完成', ['项目','项目类型','次数','使用时间',''], pD);
  /* ---- 管理项目 ---- */
  var mU = [], mB = [], mD = [];
  mgItems.filter(function(it){ return !it.cancelled && !it.swapped; }).forEach(function(it){
    var nm = krEsc(it.name)+(it.krAddOn ? ' <span class="status-pill" style="background:#FFF1D6;color:#C26A1B;font-size:10px;">在韩增加</span>' : ''), qty = it.qty||1;
    if(it.pendingPay || (!it.heldOver && !it.service)){ mU.push(krPcRow(nm, '管理项目', (it.heldOver ? '' : '共 '+qty+' 次 ')+'<span style="color:#B3261E;">待付款</span>', krBuyTime(c, it), useBtns(it.name, true))); return; }
    var planned = (c.subItems||[]).filter(function(s){ return s.holdUseOf===it.name && !s.done && !s.skipped; }), left = holdItemLeft(c, it) - planned.length;
    if(left>0 && !it.holdDone) mU.push(krPcRow(nm, '管理项目', '剩 '+left+' / 共 '+qty+' 次', krBuyTime(c, it), useBtns(it.name, false)));
    planned.forEach(function(s){ mB.push(krPcRow(nm, '管理项目', '1 次', krEsc(krShortDt(s.date, s.time||'')), (can && !s.arrived ? '<a href="#" onclick="krSubTimeOpen(\''+s.id+'\');return false;" style="font-size:12px;">修改时间</a> ' : '')+krViewBtn(subCaseKey(s)))); });
    var uses = (it.uses||[]).slice(); for(var q = uses.length; q < (it.holdUsed||0); q++) uses.push({at:'', key:'main'});
    uses.forEach(function(u){ mD.push(krPcRow(nm, '管理项目', '1 次', u.at ? krEsc(fmtUtc(u.at).slice(2, 16)) : '—', krViewBtn(u.key||'main'))); });
  });
  var mgBody = krPcSec('未使用', ['项目','项目类型','次数','购买时间',''], mU)+krPcSec('已预约', ['项目','项目类型','次数','预约时间',''], mB)+krPcSec('已使用（一次一行）', ['项目','项目类型','次数','使用时间',''], mD);
  var pg = KR_PROJ_PAGE==='mgmt' ? 'mgmt' : (KR_PROJ_PAGE==='care' ? 'care' : 'surg');
  var nSurg = surg.length - sC.length, nCare = cu.unbooked.length + cu.rows.length, nMg = mgItems.filter(function(it){ return !it.cancelled && !it.swapped; }).length;
  var seg = '<div class="cal-switch"><span class="'+(pg==='surg'?'active':'')+'" onclick="krProjPage(\'surg\')">施术项目（'+nSurg+'）</span><span class="'+(pg==='care'?'active':'')+'" onclick="krProjPage(\'care\')">术后管理（'+nCare+'）</span><span class="'+(pg==='mgmt'?'active':'')+'" onclick="krProjPage(\'mgmt\')">管理项目（'+nMg+'）</span></div>';
  var addBtn = (can && c.hasArrived && !c.visitClosed && c.krBalancePaid) ? '<button class="btn-outline" style="padding:4px 14px;font-size:12px;" onclick="KR_AD.open=!KR_AD.open;krRenderCaseDetail()">'+(KR_AD.open ? '收起' : '增加项目')+'</button>' : '';
  var body = pg==='surg' ? (surgBody || krEmpty('这个案件没有施术项目')) : pg==='care' ? (careBody || krEmpty('这个案件没有术后管理')) : (mgBody || krEmpty('这个案件没有管理项目'));
  return krCardBox('<div style="display:flex;align-items:center;gap:12px;"><span>项目卡 <span style="font-weight:400;font-size:11px;color:var(--muted);">［本次使用］要有客人已到店的案件；［预约使用］按日期建立 / 并入子案件</span></span><span style="flex:1;"></span>'+addBtn+'</div>', '<div style="margin-bottom:6px;">'+seg+'</div>'+body)+krAddOnCard(c);
}
function krTabItems(c){
  return krProjCards(c)+'<div class="info-heading" style="margin:6px 2px 0;">案件 <span style="font-weight:400;font-size:11px;color:var(--muted);">施术当天是主案件，之后每一次来是一个子案件；到店后从项目卡里选这次要做的项目，按［已完成］</span></div>'+krTabProc(c);
}
/* ---- 施术 tab（KR-CASE-02 第 3 节）：按施术日期状态给不同内容 ---- */
function krSchedDayHtml(c, date){
  var hid = krHospitalIdOfMe(), u = krDirUnavail(hid, c.director, date), open = hospitalOpenDates(hid, c.director).indexOf(date) > -1;
  /* 首选 / 备选日期旁写出院长当天「几点～几点不行」（读院长日程：施术、面诊、不可预约、半休 / OFF）（CMD-1008-12 D1） */
  var txt = u.whole ? '<span style="color:#C1454A;">整天不行（'+krEsc(u.whole)+'）</span>' : (u.ranges.length ? u.ranges.map(function(r){ return '<span style="color:#C1454A;">'+krEsc(r.a+'～'+r.b+' 不行')+'</span><span style="color:var(--muted);">（'+krEsc(r.tag)+'）</span>'; }).join('　') : '<span style="color:var(--sage);">当天没有不行的时段</span>');
  return '<div style="font-size:12px;margin:4px 0 8px 22px;color:var(--slate2);">院长 '+krEsc(c.director||'—')+' 当天：'+txt+(open ? '' : ' <span style="color:#C26A1B;">（这天不是开放施术日期）</span>')+'</div>';
}
var KR_SCH = {caseKey:'', pick:'', time:'', address:null, reason:''};
function krSchReset(c, defaults){
  if(KR_SCH.caseKey !== krRecKey()+':'+(c.krSchedule ? c.krSchedule.status : '')) KR_SCH = {caseKey:krRecKey()+':'+(c.krSchedule ? c.krSchedule.status : ''), pick:defaults.pick||'', time:defaults.time||'10:00', address:null, reason:''};
  if(KR_SCH.address===null) KR_SCH.address = defaults.address||'';
}
function krSchSet(k, v){ KR_SCH[k] = v; if(k==='pick') krRenderCaseDetail(); }
function krDefaultAddress(){ var h = krHospital(); return h ? h.address : ''; }
/* 施术时长 = 本案件未取消项目在 KR 项目库「默认资料」里的 durMin 合计（surgeryMinutes，没有资料按 60 分钟）；到院时间 + 时长与院长「不可预约」/ 其他施术重叠就挡住（CMD-1013-11 一·1） */
function krSurgeryHoursNote(c){ return '<div style="font-size:12px;color:var(--slate2);margin:4px 0 6px;">这次赴韩项目合计预计约 <b>'+krHoursText(surgeryMinutes(c))+'</b>（按项目合计）</div>'; }
function krTimeOptionsFor(sel, c, date){
  var hid = krHospitalIdOfMe(), hr = hospitalHours(hid), dur = surgeryMinutes(c), key = KR_CASE.clinicId+':'+KR_CASE.id, o = '';
  for(var m = 6*60; m <= 23*60+30; m += 30){
    var tt = minToTime(m), er = date ? krSurgerySlotError(hid, c.director, date, tt, dur, key, {allowOffHours:true}) : '';
    o += '<option value="'+tt+'"'+(tt===sel?' selected':'')+(er ? ' disabled' : '')+'>'+tt+(er ? '　✕ 需约 '+krHoursText(dur)+'，'+er.replace(/^.*?，和 /, '会撞到 ').replace(/ 重叠$/, '') : '')+'</option>';
  }
  return o;
}
function krDayFullNote(c, date){
  if(!date) return '';
  var hid = krHospitalIdOfMe(), hr = hospitalHours(hid), dur = surgeryMinutes(c), key = KR_CASE.clinicId+':'+KR_CASE.id;
  for(var m = timeToMin(hr.open); m + dur <= timeToMin(hr.close) + 60; m += 30){ if(!krSurgerySlotError(hid, c.director, date, minToTime(m), dur, key, {allowOffHours:true})) return ''; }
  return '<div style="background:#FDECEA;border:1px solid #E5A19B;border-radius:8px;padding:6px 10px;font-size:12px;color:#B3261E;margin:4px 0;">这天院长排不进（施术约 '+krHoursText(dur)+'）：建议改选备选日期，或点［无法安排］。</div>';
}
function krSchForm(c, dates, labels, confirmFn, rejectFn, confirmLabel){
  var opts = dates.map(function(d, i){ return '<label style="display:block;margin:6px 0;font-size:13px;cursor:pointer;"><input type="radio" name="kr-sch-pick" '+(KR_SCH.pick===d?'checked':'')+' onchange="krSchSet(\'pick\',\''+d+'\')"> '+labels[i]+' <b>'+d+'</b></label>'+krSchedDayHtml(c, d); }).join('');
  var inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
  return krSurgeryHoursNote(c)+opts+krDayFullNote(c, KR_SCH.pick)+'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;"><span style="font-size:12px;">到院时间</span><select onchange="krSchSet(\'time\',this.value)" style="'+inp+'">'+krTimeOptionsFor(KR_SCH.time, c, KR_SCH.pick)+'</select>'+
    '<input value="'+krEsc(KR_SCH.address)+'" oninput="krSchSet(\'address\',this.value)" placeholder="地址" style="'+inp+'flex:1;min-width:260px;"></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;"><button class="btn-primary" onclick="'+confirmFn+'()">'+confirmLabel+'</button>'+
    '<input value="'+krEsc(KR_SCH.reason)+'" oninput="krSchSet(\'reason\',this.value)" placeholder="无法安排的原因" style="'+inp+'min-width:200px;"><button class="btn-outline" onclick="'+rejectFn+'()">无法安排</button></div>';
}
function krDoSchConfirm(isChange){
  if(!krCan()) return;
  if(!KR_SCH.pick){ alert('请先选一个日期'); return; }
  if(!KR_SCH.time){ alert('请填到院时间'); return; }
  var d = KR_SCH.pick, t0 = KR_SCH.time, a = (KR_SCH.address||'').trim();
  var rr = krFindCase(KR_CASE.clinicId, KR_CASE.id), dur0 = rr ? surgeryMinutes(rr.c) : 60, er = rr ? krSurgerySlotError(krHospitalIdOfMe(), rr.c.director, d, t0, dur0, KR_CASE.clinicId+':'+KR_CASE.id, {allowOffHours:true}) : ''; if(er){ krBlock(er); return; }
  var go = function(){ krMut(function(c){ return isChange ? coreChangeConfirm(c, d, t0, a, ME_NAME) : coreScheduleConfirm(c, d, t0, a, ME_NAME); }); };
  var off = krOffHoursText(krHospitalIdOfMe(), d, t0, dur0); if(off) krOffConfirm(off+'（施术 '+d+' '+t0+'，韩国时间）', go); else go();
}
function krDoSchReject(isChange){
  if(!krCan()) return;
  var r0 = (KR_SCH.reason||'').trim(); if(!r0){ alert('请填无法安排的原因'); return; }
  krMut(function(c){ return isChange ? coreChangeReject(c, r0, ME_NAME) : coreScheduleReject(c, r0, ME_NAME); });
}
function krDoSchAdjust(){
  if(!krCan()) return;
  var t0 = KR_SCH.time, a = (KR_SCH.address||'').trim(); if(!t0){ alert('请填到院时间'); return; }
  var rr = krFindCase(KR_CASE.clinicId, KR_CASE.id), er = (rr && rr.c.krSchedule) ? krSurgerySlotError(krHospitalIdOfMe(), rr.c.director, rr.c.krSchedule.confirmedDate, t0, surgeryMinutes(rr.c), KR_CASE.clinicId+':'+KR_CASE.id) : ''; if(er){ krBlock(er); return; }
  krMut(function(c){ return coreScheduleAdjust(c, t0, a, ME_NAME); });
}
/* 在韩加项后付：有待付款项目时施术 tab 最上方红色「未付款」（列出项目、金额、合计）+［已付款］（CMD-1012-15 一·3） */
function krUnpaidBanner(c){
  var its = pendingPayItems(c); if(!its.length) return '';
  var tot = its.reduce(function(s, it){ return s + itemKrAmount(it); }, 0);
  return '<div style="background:#FDECEA;border:1px solid #E5A19B;border-radius:12px;padding:14px 18px;margin-bottom:14px;"><div style="font-size:14px;font-weight:700;color:#B3261E;margin-bottom:8px;">未付款</div>'+
    its.map(function(it){ return '<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;"><span>'+krEsc(it.name)+(it.qty>1 ? ' ×'+it.qty : '')+'</span><span>'+formatCurrency(itemKrAmount(it),'KRW')+'</span></div>'; }).join('')+
    '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;border-top:1px solid #E5A19B;margin-top:6px;padding-top:6px;"><span>合计</span><span>'+formatCurrency(tot,'KRW')+'</span></div>'+
    '<div style="font-size:11px;color:#B3261E;margin-top:6px;">有待付款项目时不能结案；客人付款后点［已付款］，会生成一张结算单（IN 结算 tab 可见，来源「在韩加项」）。</div>'+
    (krCan() ? '<div style="margin-top:8px;"><button class="btn-primary" onclick="krDoAddOnPaid()">已付款</button></div>' : '')+'</div>';
}
/* 待付款项目［修正］弹窗（CMD-1013-01）：只有 KR 室长（不含院长）；改项目 / 数量 / 金额 / 删除 */
var KR_FIX = null;
function krCanFix(){ var me = currentAccount(); return krCan() && !!me && !isKrDirectorLike(me); }
function krFixOpen(idx){
  if(!krCanFix()) return;
  var c = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, it = (c.procedureItems||[])[idx]; if(!it || !it.pendingPay) return;
  KR_FIX = {idx:idx, unit:Math.round((it.price||0)/Math.max(1, it.qty||1))};
  var cand = krScopeCandidates(KR_CASE.clinicId).kr, ov = document.getElementById('kr-fix-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'kr-fix-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var inp = 'padding:6px 8px;border:1px solid var(--line);border-radius:6px;font-size:13px;width:100%;box-sizing:border-box;';
  var an = (it.anesthesia && it.anesthesia.type) || 'local';
  ov.innerHTML = '<div class="modal-box" style="max-width:440px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-size:15px;font-weight:700;">修正待付款项目</span><span style="cursor:pointer;" onclick="krFixClose()">✕</span></div>'+
    '<div style="display:grid;gap:10px;font-size:13px;"><label>项目（KR 项目库的韩国项目）<select id="kr-fix-name" onchange="krFixName()" style="'+inp+'">'+cand.map(function(p){ return '<option'+(p.name===it.name?' selected':'')+'>'+krEsc(p.name)+'</option>'; }).join('')+'</select></label>'+
    '<label>数量<input id="kr-fix-qty" type="number" min="1" value="'+(it.qty||1)+'" oninput="krFixQty()" style="'+inp+'"></label>'+
    '<label>金额（韩元，合计）<input id="kr-fix-amt" type="number" min="0" value="'+(it.price||0)+'" style="'+inp+'"></label>'+
    '<label>麻醉<select id="kr-fix-anes" onchange="krFixAnes()" style="'+inp+'">'+['local','sleep','general'].map(function(a){ return '<option value="'+a+'"'+(a===an?' selected':'')+'>'+KR_ANES[a]+'</option>'; }).join('')+'</select></label>'+
    '<label id="kr-fix-sign-w" style="display:'+(an==='local'?'none':'')+';color:#A85A10;"><input type="checkbox" id="kr-fix-sign" '+(an!=='local' ? 'checked' : '')+'> 已在现场签署麻醉同意书</label></div>'+
    '<div style="display:flex;gap:8px;margin-top:16px;"><button class="btn-primary" style="flex:1;" onclick="krFixSave()">保存</button><button class="btn-outline" onclick="krFixDelete()">删除</button><button class="btn-ghost" onclick="krFixClose()">取消</button></div></div>';
  ov.classList.add('open');
}
function krFixClose(){ var ov = document.getElementById('kr-fix-overlay'); if(ov) ov.classList.remove('open'); KR_FIX = null; }
function krFixName(){ var n = document.getElementById('kr-fix-name').value, p = PROJECT_LIBRARY.filter(function(x){ return x.name===n && x.origin==='KR'; })[0]; if(p){ KR_FIX.unit = p.price||0; krFixQty(); var a = document.getElementById('kr-fix-anes'); a.value = krDefaultsDetail(n).anes; krFixAnes(); } }
function krFixQty(){ var q = Math.max(1, parseInt(document.getElementById('kr-fix-qty').value,10) || 1); document.getElementById('kr-fix-amt').value = (KR_FIX.unit||0) * q; }
function krFixAnes(){ var v = document.getElementById('kr-fix-anes').value, w = document.getElementById('kr-fix-sign-w'); if(w) w.style.display = v==='local' ? 'none' : ''; }
function krFixSave(){
  if(!KR_FIX || !krCanFix()) return;
  var at = document.getElementById('kr-fix-anes').value, patch = {name:document.getElementById('kr-fix-name').value, qty:document.getElementById('kr-fix-qty').value, amount:document.getElementById('kr-fix-amt').value, anesthesia:{type:at, label:KR_ANES[at], note:''}, signed:!!(document.getElementById('kr-fix-sign') && document.getElementById('kr-fix-sign').checked)}, idx = KR_FIX.idx, res = null;
  if(at!=='local' && !patch.signed){ alert('睡眠 / 全身麻醉：请勾选「已在现场签署麻醉同意书」'); return; }
  krMut(function(c){ res = coreAddOnEdit(c, idx, patch, ME_NAME); return res; });
  if(!res || !res.ok){ alert((res && res.err) || '不能修正'); return; }
  krFixClose();
}
function krFixDelete(){ if(!KR_FIX || !krCanFix() || !confirm('确认删除这个待付款项目？')) return; var idx = KR_FIX.idx; krFixClose(); krMut(function(c){ return coreAddOnDelete(c, idx, ME_NAME); }); }
function krDoAddOnPaid(){ if(!krCan()) return; krMut(function(c){ return coreAddOnPaid(c, ME_NAME); }); }
function krSubNote(id){
  if(!krCan()) return;
  var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, s = (c0.subItems||[]).filter(function(x){ return x.id===id; })[0]; if(!s) return;
  var v = prompt('施术备注（IN 室长只读可见；留空 = 清空）', s.note || ''); if(v===null) return;
  krMut(function(c){ return coreSubNote(c, id, v, ME_NAME); });
}
function krTabProc(c){
  var ks = c.krSchedule, st = scheduleState(c), can = krCan(), ub = krUnpaidBanner(c);
  var items = krAllItems(c).map(function(it){ return '<div class="case-field-row" style="font-size:13px;flex-direction:column;align-items:flex-start;"><div style="display:flex;width:100%;"><span style="flex:1;'+(it.cancelled?'text-decoration:line-through;color:var(--muted);':'')+'">'+krEsc(it.name)+'</span><span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+krItemStatus(it)+'</span></div>'+krItemMetaHtml(it)+'</div>'; }).join('');
  if(!c.settlementDone) return krCardBox('赴韩施术', krEmpty('IN 付定金后才会出现施术日期和赴韩项目。')); /* 未付定金：三张卡都不显示（CMD-1012-10 修改3） */
  /* CMD-1015-17：施术当天就是主案件本身——到院 / 评估 / 加项 / 付尾款 / 今日项目都直接在施术 tab；术后管理的每次到院是下面的子案件卡片（点开展开） */
  if(st==='Confirmed' || st==='Arrived'){
    return (st==='Arrived' ? '' : krSurgHead(c))+(st==='Arrived' ? krSurgeryFlowHtml(c) : ub+krStepItemsCard(c))+krPcbNeedCard(c)+krSubCasesCard(c); /* 到店后不再显示预约栏（CMD-1015-18） */
  }
  var body = '';
  if(st==='Draft'){
    body = krEmpty('IN 还没有递交施术日期（IN 室长付定金后在月历里选首选 / 备选日期）。')+(ks && ks.rejectNote ? '<div style="font-size:12px;color:#C26A1B;">上次回复"无法安排"：'+krEsc(ks.rejectNote)+'</div>' : '');
  } else if(st==='Pending'){
    var dates = [ks.primary].concat(ks.backup ? [ks.backup] : []);
    krSchReset(c, {pick:ks.primary, time:'10:00', address:krDefaultAddress()});
    body = '<div style="font-size:12px;color:var(--slate2);margin-bottom:6px;">IN 递交的日期（首选 / 备选）：选一个并填到院时间和地址，或回复无法安排。</div>'+(can ? krSchForm(c, dates, dates.map(function(d, i){ return i===0 ? '首选' : '备选'; }), 'krDoSchConfirm.bind(null,false)', 'krDoSchReject.bind(null,false)', '确认') : krEmpty('首选 '+krEsc(ks.primary)+(ks.backup?'，备选 '+krEsc(ks.backup):'')+'（院长账号不能确认）'));
  } else if(st==='Changing'){
    if(ks.changeSubmitted){
      var nd = [ks.changePrimary].concat(ks.changeBackup ? [ks.changeBackup] : []);
      krSchReset(c, {pick:ks.changePrimary, time:ks.confirmedTime||'10:00', address:ks.address||krDefaultAddress()});
      body = '<div style="font-size:12px;color:var(--slate2);margin-bottom:6px;">原日期 '+krEsc(ks.confirmedDate+' '+(ks.confirmedTime||''))+' 继续有效。IN 提出的新日期：</div>'+(can ? krSchForm(c, nd, nd.map(function(d, i){ return i===0 ? '新首选' : '新备选'; }), 'krDoSchConfirm.bind(null,true)', 'krDoSchReject.bind(null,true)', '确认新时间') : krEmpty('新首选 '+krEsc(ks.changePrimary)+(ks.changeBackup?'，新备选 '+krEsc(ks.changeBackup):'')));
    } else body = krEmpty('IN 正在选新日期（原日期 '+krEsc(ks.confirmedDate)+' 继续有效）');
  }
  return ub+krCardBox('施术日期（'+{Draft:'待 IN 递交', Pending:'待确认施术时间', Changing:'改期待确认'}[st]+'）', body)+(st==='Changing' ? krSubCasesCard(c) : '');
}
/* 检测与上传：已有内容的行可以点开直接查看（院长也能，CMD-1013-02 三） */
function krUploadRow(c, label, fileLabel, has, okText){
  if(!has) return krKV(label, '—');
  var files = caseAttachments(c).filter(function(f){ return !f.chatLog; }), i = files.findIndex(function(f){ return f.label===fileLabel; });
  return krKV(label, i>-1 ? '<a href="#" onclick="krOpenAttachment('+i+');return false;" style="font-weight:600;">'+okText+'（点开查看）</a>' : okText);
}
/* KR 室长上传附件：文件标上传方 + 时间，IN 附件 tab 可见（演示：只记文件名，不上传真实内容） */
function krUploadFile(inp){
  if(!krCan() || !inp.files || !inp.files[0]) return; var nm = inp.files[0].name; inp.value = '';
  krMut(function(c){ c.manualAttachments = c.manualAttachments || []; c.manualAttachments.push({label:nm, src:'KR · '+ME_NAME, date:nowFullDt()}); logCaseEvent(c, ME_NAME, '上传附件：'+nm); return true; });
}
function krTabFiles(c){
  var files = caseAttachments(c).filter(function(f){ return !f.chatLog; });
  var upl = krCan() ? '<div style="margin-bottom:8px;"><label class="btn-outline" style="display:inline-block;padding:6px 12px;cursor:pointer;font-size:12px;">+ 上传附件<input type="file" style="display:none;" onchange="krUploadFile(this)"></label> <span style="font-size:11px;color:var(--muted);">文件会标上传方和时间，IN 在附件里看得到</span></div>' : '';
  return krCardBox('附件', upl+(files.length ? files.map(function(f, i){ return '<div class="case-field-row" style="cursor:pointer;" onclick="krOpenAttachment('+i+')" title="点击查看"><span class="status-pill" style="background:var(--blue-bg);color:var(--blue);font-size:10px;margin-right:8px;">'+krEsc(f.src)+'</span><span style="flex:1;font-size:13px;">'+krEsc(f.label)+'</span><span style="font-size:11px;color:var(--muted);">'+krEsc(f.date||'')+'</span><span style="font-size:11px;color:var(--terracotta);margin-left:10px;">查看</span></div>'; }).join('') : krEmpty('没有附件')));
}
/* 案件附件直接打开查看（演示：诊疗方案类显示正文，其他显示占位说明） */
function krOpenAttachment(i){
  var c = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, files = Store.withClinic(KR_CASE.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===KR_CASE.id; })[0]; return caseAttachments(cc).filter(function(f){ return !f.chatLog; }); });
  var f = files[i]; if(!f) return;
  var body = /诊疗方案/.test(f.label) && (c.reportKo || c.videoSummary) ? '<div style="white-space:pre-wrap;font-size:13px;line-height:1.8;">'+krEsc(c.reportKo || c.videoSummary)+'</div>' : '<div style="font-size:13px;color:var(--slate2);">（演示：这个附件没有真实文件，正式版在这里直接预览。）</div>';
  var ov = document.getElementById('kr-att-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'kr-att-overlay'; ov.className = 'modal-overlay'; ov.onclick = function(e){ if(e.target===ov) ov.classList.remove('open'); }; document.body.appendChild(ov); }
  ov.innerHTML = '<div class="modal-box" style="width:560px;max-height:80vh;overflow:auto;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b>'+krEsc(f.label)+'</b><span style="cursor:pointer;" onclick="document.getElementById(\'kr-att-overlay\').classList.remove(\'open\')">✕</span></div><div style="font-size:11px;color:var(--muted);margin-bottom:10px;">'+krEsc(f.src)+' · '+krEsc(f.date||'')+'</div>'+body+'</div>';
  ov.classList.add('open');
}
function krTabRelated(c){ /* 关联只往前（CMD-1013-12 一·1） */
  var hid = krHospitalIdOfMe();
  var row = function(o, reason, auto){
    var b = caseStageBadge(o), vis = krCaseVisible(o, hid);
    return '<div class="case-field-row"'+(vis?' style="cursor:pointer;" onclick="krShowCase(\''+KR_CASE.clinicId+'\',\''+o.id+'\')"':'')+'><span style="font-weight:700;min-width:84px;font-size:13px;">'+krEsc(o.caseNo)+'</span><span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+krEsc(reason)+(auto?'（自动）':'')+'</span><span style="flex:1;"></span><span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';">'+b[2]+'</span>'+(vis?'':'<span style="font-size:11px;color:var(--muted);margin-left:8px;">不在本医院</span>')+'</div>';
  };
  var before = '';
  if(c.linkedCase && c.linkedCase.caseId){ var src = CASE_ITEMS.filter(function(x){ return x.id===c.linkedCase.caseId; })[0]; if(src) before = row(src, c.linkedCase.reason, c.linkedCase.auto); }
  return krCardBox('关联案件', before||krEmpty());
}
function krTabLog(c){
  var ks = c.krSchedule, j = c.krJudge, arrCard = '';
  if(c.krBalancePaid && ks){ /* 付清尾款后收进来的「施术日期 / 到院」记录 */
    arrCard = krCardBox('施术日期与到院（已付清尾款）', krKV('施术日期', krEsc(ks.confirmedDate||'—'))+krKV('到院时间', krEsc(ks.confirmedTime ? ks.confirmedTime+'（韩国）' : '—'))+krKV('地址', krEsc(ks.address||'—'))+(j ? krKV('院长评估结果', krEsc(KR_JUDGE_TEXT[j.result]||''))+(j.memo ? krKV('memo', krEsc(j.memo)) : '') : ''));
  }
  var rows = caseTimelineEntries(c, TL_PAGE[c.id] || 'all').filter(function(e){ return !viewerLogHidden(e); }).map(function(e){ return '<div class="case-field-row" style="font-size:12px;align-items:flex-start;"><span style="min-width:120px;color:var(--muted);">'+krEsc(fmtUtc(e.dt||''))+'</span><span style="min-width:70px;color:var(--slate2);">'+krEsc(e.stage||'')+'</span><span style="min-width:90px;font-weight:600;">'+krEsc(e.actor||'')+'</span><span style="flex:1;">'+krEsc(tzRender(e.action||''))+'</span></div>'; }).join('');
  return arrCard+krCardBox('Timeline', timelineTabsHtml(c, 'krSetTlPage')+(rows || krEmpty()));
}
function krSetTlPage(id, which){ TL_PAGE[id] = which; krRenderCaseDetail(); }
function krTabVault(c){ return krIsMyCase(c) ? krVaultHtml(c) : krCardBox('KR 专用附件', krEmpty()); } /* 只有 KR 看得到，IN 端没有这个 tab */
var KR_TAB_FN = {vault:krTabVault, basic:krTabBasic, consult:krTabConsult, items:krTabItems, proc:krTabProc, files:krTabFiles, related:krTabRelated, log:krTabLog};

function krRenderCaseDetail(){
  if(KR_CASE.tab==='proc') KR_CASE.tab = 'items';
  var el = document.getElementById('krcase-body'); if(!el) return;
  var r = krFindCase(KR_CASE.clinicId, KR_CASE.id);
  if(!r){ el.innerHTML = '<div class="card" style="padding:24px;color:var(--slate2);"><button class="btn-ghost" onclick="goBack()">← 返回</button><div style="margin-top:12px;">这个案件不存在，或不在你可看的范围内（KR 只能看选了本医院、且已缴 / 免除面诊费的案件；院长只能看自己的案件）。</div></div>'; return; }
  var hasRel = !!(r.c.linkedCase && r.c.linkedCase.caseId); if(KR_CASE.tab==='related' && !hasRel) KR_CASE.tab = 'basic';
  var tabs = KR_CASE_TABS.filter(function(t0){ return t0.key!=='related' || hasRel; }).map(function(t0){ var on = KR_CASE.tab===t0.key; return '<button onclick="krSetCaseTab(\''+t0.key+'\')" style="padding:8px 16px;border:none;border-bottom:2px solid '+(on?'var(--navy)':'transparent')+';background:none;color:'+(on?'var(--navy)':'var(--slate2)')+';font-weight:'+(on?'700':'400')+';cursor:pointer;font-size:14px;">'+t(t0.label)+'</button>'; }).join('');
  var body = Store.withClinic(KR_CASE.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===KR_CASE.id; })[0]; return c ? KR_TAB_FN[KR_CASE.tab](c) : ''; });
  el.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">'+
      '<button class="btn-ghost" onclick="goBack()">← 返回</button>'+
      '<div style="font-size:18px;font-weight:700;">'+(krClientsAllowed() ? '<a href="#" onclick="krOpenClient(krClientKeyFor(\''+r.clinicId+'\',\''+krEsc(r.name).replace(/'/g,'')+'\'));return false;" style="color:inherit;text-decoration:underline dotted;">'+krEsc(r.name)+'</a>' : krEsc(r.name))+' <span style="font-size:13px;font-weight:400;color:var(--muted);">'+krEsc(r.caseNo)+'</span></div>'+
      '<span class="status-pill" style="background:'+r.badge[0]+';color:'+r.badge[1]+';">'+krEsc(r.stageText||r.label)+'</span>'+(r.hold ? ' '+KR_HOLD_TAG : '')+'<span style="flex:1;"></span>'+
      '<button class="btn-primary" onclick="krOpenCaseChat()">💬 对话</button></div>'+
    '<div class="card" style="padding:12px 20px;display:flex;gap:28px;flex-wrap:wrap;font-size:13px;"><span><span style="color:var(--muted);">来源诊所</span> <b>'+krEsc(r.clinicName)+'</b></span>'+(KR_CASE.tab==='consult' ? '' : '<span><span style="color:var(--muted);">院长</span> <b>'+krEsc(r.director||'—')+'</b></span>')+'<span><span style="color:var(--muted);">KR 室长</span> <b>'+krEsc(r.krCoordinator||'—')+'</b></span></div>'+
    '<div style="display:flex;gap:4px;border-bottom:1px solid var(--line);flex-wrap:wrap;">'+tabs+'</div>'+
    '<div style="display:flex;flex-direction:column;gap:14px;">'+(body||'')+'</div>';
}
function krOpenCaseChat(){ if(typeof krOpenRoomFor==='function') krOpenRoomFor(KR_CASE.clinicId, KR_CASE.id); else alert('对话在第六部分实现'); }

/* ---------- 六、KR 通知（K1）与对话 ---------- */
/* 通知：存在医院资料里（HOSPITAL_DATA[h].notifs，全局存档）；室长/管理者看 to='coord'，院长看自己案件的 to='director' */
function krNotifsForMe(){
  var h = krHData(), me = currentAccount(); if(!h || !me) return [];
  return (h.notifs||[]).filter(function(n){
    if(n.by && n.by===me.name) return false; /* 自己触发的不通知自己 */
    if(n.only && n.only!==me.name) return false; /* 指名给某个人的（被 @ 的室长） */
    if(n.to==='all') return true;
    if(isKrDirectorLike(me)) return (n.to==='director' && n.director===me.name) || (me.role==='kr_owner' && n.to==='coord' && false);
    return n.to==='coord';
  });
}
function krMarkNotifRead(n){ var me = currentAccount(); n.readBy = n.readBy || []; if(n.readBy.indexOf(me.id) < 0) n.readBy.push(me.id); try{ Store.touch(); krUpdateBadges(); }catch(e){} } /* 设定更新 toast 的［确认］= 已读 */
function krNotifUnread(){ var me = currentAccount(); return krNotifsForMe().filter(function(n){ return (n.readBy||[]).indexOf(me.id) < 0; }); }
/* KR 通知点击直接进对应 tab（CMD-1013-13 四）：面诊相关 → 面诊；施术日期 / 改期 / 到院 / 评估 / 待付款 / 术后管理提前 → 施术；IN 选定项目 / 付定金 → 项目；@ / 未接来电 → 对话；系统 / 设定更新 → 医院设定 */
function krNotifTarget(n){
  var tx = String(n.text||''), kd = n.kind||'';
  if(kd==='mention' || kd==='missedcall' || /@ 了你|未接来电/.test(tx)) return 'chat';
  if(kd==='system' || /系统|设定更新|更新了设定/.test(tx)) return 'settings';
  if(/术后管理提前/.test(tx)) return 'proc';
  if(/施术日期待确认|改期待确认|已到医院|评估|待付款|尾款|无法施术|更换项目/.test(tx)) return 'proc';
  if(/选定项目|选择了项目|付定金|已付定金|定金/.test(tx)) return 'items';
  if(kd==='consultpaid' || kd==='urge' || /面诊|催办|报告/.test(tx)) return 'consult';
  return '';
}
function krOpenNotif(id){
  var h = krHData(), me = currentAccount();
  var n = (h.notifs||[]).filter(function(x){ return x.id===id; })[0]; if(!n) return;
  n.readBy = n.readBy || []; if(n.readBy.indexOf(me.id) < 0) n.readBy.push(me.id);
  Store.touch(); krCloseBell();
  if(n.kind==='krbook' && n.bookingId && typeof krBookOpen==='function'){ krBookOpen(n.bookingId); return; } /* CMD-1014-16：预约待确认 → 直接打开预约窗 */
  var tg = krNotifTarget(n);
  if(tg==='settings' && canDo('clinic')){ openAdminPage('clinic'); return; }
  if(n.caseId && krFindCase(n.clinicId, n.caseId)){
    krShowCase(n.clinicId, n.caseId);
    if(tg==='chat'){ setTimeout(function(){ try{ krOpenCaseChat(); }catch(e){} }, 0); }
    else if(tg==='proc' && /已到医院|评估|待付款|尾款|无法施术|更换项目/.test(n.text||'') && krSurgSub(krFindCase(n.clinicId, n.caseId).c)) krOpenSurgSub(n.clinicId, n.caseId);
    else if(tg && tg!=='settings') krSetCaseTab(tg);
  } else if(tg==='chat' && typeof krOpenDrawer==='function'){ krOpenDrawer(); }
  else krRefreshAll();
}
function krReadAllNotifs(){ var me = currentAccount(); krNotifsForMe().forEach(function(n){ n.readBy = n.readBy||[]; if(n.readBy.indexOf(me.id)<0) n.readBy.push(me.id); }); Store.touch(); krRefreshAll(); }
var KR_NOTIF_FILTER = 'all';
function krNotifRowHtml(n){
  var me = currentAccount(), unread = (n.readBy||[]).indexOf(me.id) < 0, cl = clinicById(n.clinicId);
  return '<div class="trow" onclick="krOpenNotif(\'' + n.id + '\')" style="grid-template-columns:18px 1fr 130px;cursor:pointer;'+(unread?'font-weight:700;':'color:var(--slate2);')+'"><span style="color:var(--terracotta);">'+(unread?'●':'')+'</span><span>'+krEsc(tzRender(n.text))+(cl?' <span style="font-weight:400;font-size:11px;color:var(--muted);">'+krEsc(cl.name)+'</span>':'')+'</span><span style="font-weight:400;font-size:11px;color:var(--muted);">'+krEsc(fmtUtc(n.ts))+'</span></div>';
}
function krRenderNotifs(){
  var el = document.getElementById('krnotifs-body'); if(!el) return;
  var list = krNotifsForMe(), me = currentAccount();
  if(KR_NOTIF_FILTER==='unread') list = list.filter(function(n){ return (n.readBy||[]).indexOf(me.id)<0; });
  var tab = function(k, label){ var on = KR_NOTIF_FILTER===k; return '<button onclick="KR_NOTIF_FILTER=\''+k+'\';krRenderNotifs()" style="padding:7px 14px;border-radius:18px;border:1px solid var(--line);background:'+(on?'var(--navy)':'#fff')+';color:'+(on?'#fff':'var(--slate)')+';cursor:pointer;font-size:13px;">'+label+'</button>'; };
  el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('通知中心')+'</div>'+
    '<div style="display:flex;gap:8px;align-items:center;">'+tab('all','全部')+tab('unread','未读')+'<span style="flex:1;"></span><button class="btn-ghost" onclick="krReadAllNotifs()">全部标为已读</button></div>'+
    '<div class="card" style="padding:4px 16px;">'+(list.length ? list.map(krNotifRowHtml).join('') : '<div style="padding:24px;color:var(--muted);text-align:center;">没有通知</div>')+'</div>';
}
function krCloseBell(){ var d = document.getElementById('kr-bell-dd'); if(d) d.remove(); }
/* CMD-1014-15 二：铃铛下拉照 IN 的「最近通知」（图标 / 一行标题 / 一行时间 / 未读圆点 / ［查看全部］）；一次只开一个：开通知时对话抽屉自动关掉 */
function krNotifIcon(n){ var tx = String(n.text||''), kd = n.kind||''; if(kd==='mention' || /@ 了你/.test(tx)) return '💬'; if(kd==='missedcall' || /未接来电/.test(tx)) return '🎥'; if(kd==='system' || /设定更新|更新了设定/.test(tx)) return '⚙️'; if(/施术|到院|到医院|术后|尾款|付款/.test(tx)) return '✈️'; if(/面诊|报告|催办|诊疗方案/.test(tx)) return '🩺'; return '🔔'; }
function krToggleBell(e){
  if(e) e.stopPropagation();
  if(document.getElementById('kr-bell-dd')){ krCloseBell(); return; }
  if(typeof krCloseChat==='function') krCloseChat();
  var me = currentAccount(), btn = e && e.currentTarget, r = btn ? btn.getBoundingClientRect() : {bottom:56, right:window.innerWidth-24};
  var list = krNotifsForMe().slice().sort(function(a,b){ return String(b.ts).localeCompare(String(a.ts)); }).slice(0, 6);
  var d = document.createElement('div'); d.id = 'kr-bell-dd';
  d.style.cssText = 'position:fixed;top:'+(r.bottom+8)+'px;right:'+Math.max(12, window.innerWidth-r.right-10)+'px;width:340px;background:#fff;border:1px solid var(--border);border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.16);z-index:75;overflow:hidden;';
  d.onclick = function(ev){ ev.stopPropagation(); };
  d.innerHTML = '<div style="padding:10px 14px;font-size:12px;font-weight:700;border-bottom:1px solid var(--border2);">最近通知</div>'+
    (list.length ? list.map(function(n){
      var unread = (n.readBy||[]).indexOf(me.id) < 0;
      return '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-bottom:1px solid var(--border2);cursor:pointer;" onclick="krOpenNotif(\''+n.id+'\')"><span>'+krNotifIcon(n)+'</span><div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:'+(unread?'700':'500')+';">'+krEsc(tzRender(n.text))+'</div><div style="font-size:10px;color:var(--muted);">'+krEsc(fmtUtc(n.ts))+'</div></div>'+(unread?'<span style="width:7px;height:7px;border-radius:50%;background:var(--terracotta);margin-top:5px;"></span>':'')+'</div>';
    }).join('') : '<div style="padding:14px;font-size:12px;color:var(--muted);">没有通知</div>')+
    '<div style="padding:10px 14px;text-align:center;"><a href="#" class="info-link" onclick="krCloseBell();nav(\'kr-notifications\');return false;">查看全部</a></div>';
  document.body.appendChild(d);
}
document.addEventListener('click', function(){ krCloseBell(); });

/* ---- 对话（KR 端精简版）：只列 Main 群（每家对接诊所一个）和本医院看得到的案件房；读写走各诊所的分区 ---- */
function krMsgIsMine(m){ return m.from==='them' && m.name===ME_NAME; }
function krMsgText(m){ return m.from==='me' ? (m.trans || m.orig) : m.orig; } /* IN 室长发的（from:'me'）显示韩文译文；KR 自己人发的显示原文 */
function krRoomList(){
  var hid = krHospitalIdOfMe(), me = currentAccount(), h = krHData(), out = [];
  var visible = {}; krAllCases().forEach(function(r){ visible[r.clinicId+':'+r.id] = r; });
  krClinics().forEach(function(cl){
    var v = Store.readClinic(cl.id); if(!v) return;
    var add = function(roomId, name, caseRow){
      var msgs = (v.CHAT_DATA||{})[roomId]; if(!msgs) return;
      var key = cl.id+'|'+roomId, mark = ((h.chatRead||{})[me.id]||{})[key] || 0;
      var unread = msgs.slice(mark).filter(function(m){ return m.from!=='sys' && !krMsgIsMine(m) && (!isKrDirectorLike(me) || krMentionsMe(m)); }).length; /* 院长在 Main 群里是静音的：不计未读、不推播，被 @ 才提醒 */
      var last = msgs.filter(function(m){ return m.from!=='sys'; }).slice(-1)[0];
      out.push({key:key, clinicId:cl.id, roomId:roomId, name:name, clinicName:cl.name, isMain:!caseRow && roomId.indexOf('main-')===0, isStaff:!caseRow, unread:unread, count:msgs.length, last:last ? krMsgText(last) : '', lastTime:last ? last.time : '', caseRow:caseRow||null});
    };
    add('main-'+hid, 'Main · '+cl.name, null);
    (v.ROOMS||[]).forEach(function(rm){ if(rm.members && rm.members.indexOf(me.name)>-1) add(rm.id, rm.name, null); }); /* CMD-1014-16：KR 新建的职员对话（带成员名单，成员才看得到） */
    Object.keys(v.CHAT_DATA||{}).forEach(function(rid){
      if(rid.indexOf('case-')!==0) return;
      var r = visible[cl.id+':'+rid.slice(5)]; if(r) add(rid, r.name+' · '+r.caseNo, r);
    });
  });
  return out.sort(function(a,b){ return (b.isMain-a.isMain) || (b.unread>0)-(a.unread>0); });
}
function krMentionsMe(m){ var me = currentAccount(); return !!me && String(m.orig||'').indexOf('@'+me.name.split(' ')[0]) > -1; }
var KR_CHAT = {open:false, room:null, tab:'staff', q:'', search:false};
function krUpdateBadges(){
  try{
    var u = krNotifUnread().length; document.querySelectorAll('.kr-bell-badge').forEach(function(b){ b.textContent = u; b.style.display = u ? '' : 'none'; });
    var c = krRoomList().reduce(function(s, r){ return s + r.unread; }, 0); document.querySelectorAll('.kr-chat-badge').forEach(function(b){ b.textContent = c; b.style.display = c ? '' : 'none'; });
  }catch(e){}
}
var KR_LAST_UNREAD = null;
/* KR 端新通知 toast（CMD-1012-01）：每条新的未读通知各弹一条，手动［确认］才消失；第一次只登记已有的 */
/* KR-14 医院设定更新：该医院所有室长收到，弹出并停留、手动确认；没上线的人下次上线要弹；操作的人自己不收（krNotifsForMe 按 by 过滤）。点了去医院设定 */
function krSettingsNotif(what){
  var hid = krHospitalIdOfMe(), me = currentAccount(); if(!hid || !me) return;
  pushKrNotif(hid, ME_NAME+' 更新了医院设定：'+what+'，'+todayStr()+' 起生效', {kind:'system', to:'coord', popup:'confirm', by:ME_NAME, clinicId:''});
}
var KR_NOTIF_SEEN = null;
function krToastNew(unread){
  if(KR_NOTIF_SEEN===null){ KR_NOTIF_SEEN = {}; krNotifsForMe().forEach(function(n){ KR_NOTIF_SEEN[n.id] = 1; }); /* 设定更新没按过确认的：没上线的人下次上线要弹（CMD-1015-09） */ unread.forEach(function(n){ if(n.popup==='confirm') showToast('🔔 通知', krEsc(tzRender(n.text)), function(){ krOpenNotif(n.id); }, {sticky:true, onOk:function(){ krMarkNotifRead(n); }}); }); return; }
  unread.slice().reverse().forEach(function(n){ if(KR_NOTIF_SEEN[n.id]) return; KR_NOTIF_SEEN[n.id] = 1;
    { var tk = notifTodoKind(n); if(tk==='msg') return; showToast('🔔 通知', krEsc(tzRender(n.text)), function(){ krOpenNotif(n.id); }, {sticky: tk==='stay' || tk==='confirm', urgent: tk==='stay', onOk: tk==='confirm' ? function(){ krMarkNotifRead(n); } : null}); return; } /* CMD-1013-17 */});
}
(function(){ var base = krRefreshAll; krRefreshAll = function(){ base(); if(KR_CHAT.open && !(document.activeElement && /^kr-chat-in$|^$/.test(document.activeElement.id||'') && document.activeElement.tagName==='INPUT')) krRenderChat(); var u = krNotifUnread(); krToastNew(u); KR_LAST_UNREAD = u.length; }; })();

function krOpenDrawer(){ krCloseBell(); KR_CHAT.open = true; KR_CHAT.room = null; krRenderChat(); }
function krOpenRoomFor(clinicId, caseId){ krCloseBell(); KR_CHAT.open = true; KR_CHAT.room = clinicId+'|case-'+caseId; krRenderChat(); }
function krCloseChat(){ KR_CHAT.open = false; ['kr-chat','kr-chat-overlay'].forEach(function(id){ var el = document.getElementById(id); if(el) el.classList.remove('open'); }); }
function krPickRoom(key){ KR_CHAT.room = key; krRenderChat(true); }
function krMarkRead(key, count){ var me = currentAccount(), h = krHData(); h.chatRead = h.chatRead||{}; h.chatRead[me.id] = h.chatRead[me.id]||{}; if(h.chatRead[me.id][key] !== count){ h.chatRead[me.id][key] = count; Store.touch(); } }
/* CMD-1014-15 二：KR / 院长的对话照 IN：右侧抽屉（职员间 / 案件两个 tab、卡片、搜索）；点房间在抽屉里打开消息；房间内容、成员、权限、院长静音规则不变 */
function krEnsureChat(){
  var ov = document.getElementById('kr-chat-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'kr-chat-overlay'; ov.className = 'drawer-overlay'; ov.onclick = function(){ krCloseChat(); }; document.body.appendChild(ov); }
  var p = document.getElementById('kr-chat'); if(!p){ p = document.createElement('div'); p.id = 'kr-chat'; p.className = 'chat-drawer'; document.body.appendChild(p); }
  return p;
}
function krSetChatTab(tab){ KR_CHAT.tab = tab; KR_CHAT.room = null; krRenderChat(); }
function krChatSearch(v){ KR_CHAT.q = v; var el = document.getElementById('kr-drawer-list'); if(el) el.innerHTML = krDrawerListHtml(krRoomList()); }
function krDrawerListHtml(rooms){
  var q = (KR_CHAT.q||'').toLowerCase();
  var unreadDot = function(r){ return r.unread ? '<span class="badge" style="position:static;width:auto;min-width:16px;height:16px;padding:0 4px;border-radius:999px;display:inline-flex;margin-left:6px;">'+r.unread+'</span>' : ''; };
  var list = rooms.filter(function(r){ return KR_CHAT.tab==='case' ? !r.isStaff : r.isStaff; }).filter(function(r){ return !q || (r.name+' '+r.clinicName).toLowerCase().indexOf(q)>-1; });
  var html = list.map(function(r){
    if(r.isStaff) return '<div class="chat-card" onclick="krPickRoom(\''+r.key+'\')"><span class="sq-avt" style="background:'+(r.isMain ? 'var(--slate2)' : 'var(--blue)')+';">G</span><div style="flex-grow:1;min-width:0;"><div style="font-size:13px;font-weight:700;">'+(r.isMain ? '<span class="pin-icon">📌</span>' : '')+krEsc(r.name)+unreadDot(r)+'</div><div style="font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+krEsc(r.last||'—')+'</div></div><div style="text-align:right;font-size:11px;color:var(--muted);">'+krEsc(r.lastTime||'')+'</div></div>';
    var b = null; try{ b = caseStageBadge(r.caseRow.c); }catch(e){}
    return '<div class="chat-card" onclick="krPickRoom(\''+r.key+'\')"><span class="sq-avt" style="background:var(--terracotta);">'+krEsc((r.caseRow.name||'?').charAt(0).toUpperCase())+'</span><div style="flex-grow:1;min-width:0;"><div style="font-size:13px;font-weight:700;">'+krEsc(r.caseRow.name)+unreadDot(r)+'</div><div style="font-size:11px;color:var(--muted);">Case：'+krEsc(r.caseRow.caseNo||'')+' · '+krEsc(r.clinicName)+'</div></div><div style="text-align:right;">'+(b ? '<span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';">'+krEsc(b[2])+'</span>' : '')+'<div style="font-size:11px;color:var(--muted);margin-top:4px;">'+krEsc(r.lastTime||'')+'</div></div></div>';
  }).join('');
  return html || '<div style="font-size:12px;color:var(--muted);padding:16px 4px;">'+(KR_CHAT.tab==='case' ? '没有匹配的案件' : '没有匹配的对话')+'</div>';
}
function krRenderChat(scrollEnd){
  var p = krEnsureChat(), ov = document.getElementById('kr-chat-overlay'); p.classList.add('open'); ov.classList.add('open');
  var rooms = krRoomList(), room = KR_CHAT.room ? rooms.filter(function(r){ return r.key===KR_CHAT.room; })[0] : null;
  if(!room){
    var tabBorder = function(k){ return KR_CHAT.tab===k ? '2px solid var(--navy)' : 'none'; };
    p.innerHTML = '<div class="drawer-head"><span style="font-size:15px;font-weight:700;">对话</span><div style="display:flex;align-items:center;gap:14px;"><span style="cursor:pointer;font-size:15px;" onclick="KR_CHAT.search=!KR_CHAT.search;krRenderChat()">🔍</span><span style="cursor:pointer;font-size:15px;" onclick="krCloseChat()">✕</span></div></div>'+
      '<div style="display:flex;border-bottom:1px solid var(--border2);"><div onclick="krSetChatTab(\'staff\')" style="flex:1;text-align:center;padding:12px 0;font-size:13px;font-weight:700;cursor:pointer;border-bottom:'+tabBorder('staff')+';">职员间</div><div onclick="krSetChatTab(\'case\')" style="flex:1;text-align:center;padding:12px 0;font-size:13px;font-weight:700;cursor:pointer;border-bottom:'+tabBorder('case')+';">案件</div></div>'+
      '<div class="drawer-search-wrap'+(KR_CHAT.search ? ' open' : '')+'"><input type="text" placeholder="搜索对话…" value="'+krEsc(KR_CHAT.q||'')+'" oninput="krChatSearch(this.value)"></div>'+
      '<div class="drawer-list" id="kr-drawer-list">'+krDrawerListHtml(rooms)+'</div>'+
      (KR_CHAT.tab==='staff' ? '<div class="drawer-foot"><button class="btn-primary" style="width:100%;" onclick="krOpenNewStaffChat()">+ 新建职员对话</button></div>' : '');
    krUpdateBadges(); return;
  }
  var msgs = (Store.readClinic(room.clinicId).CHAT_DATA||{})[room.roomId] || [], lastDay = '';
  var body = msgs.map(function(m){
    var day = m.day && m.day!==lastDay ? (lastDay = m.day, '<div style="text-align:center;font-size:11px;color:var(--muted);margin:10px 0;">'+krEsc(m.day)+'</div>') : '';
    if(m.from==='sys') return day+'<div style="text-align:center;font-size:11px;color:var(--muted);margin:6px 0;">'+krEsc(m.orig)+'</div>';
    var mine = krMsgIsMine(m), who = m.from==='me' ? (m.sender||'A1 室长')+' · IN' : (m.name||'');
    var ref = m.refCaseId ? '<div style="font-size:11px;color:var(--blue);">↗ 引用案件</div>' : '';
    return day+'<div style="display:flex;flex-direction:column;align-items:'+(mine?'flex-end':'flex-start')+';margin:6px 0;"><div style="font-size:11px;color:var(--muted);margin-bottom:2px;">'+krEsc(who)+' · '+krEsc(msgTime(m)||'')+'</div><div style="max-width:78%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5;background:'+(mine?'var(--navy)':'var(--border2)')+';color:'+(mine?'#fff':'inherit')+';">'+ref+krEsc(krMsgText(m))+'</div></div>';
  }).join('');
  p.innerHTML = '<div class="drawer-head"><span style="display:flex;align-items:center;gap:8px;min-width:0;"><a href="#" onclick="KR_CHAT.room=null;krRenderChat();return false;" style="text-decoration:none;">←</a><span style="font-size:15px;font-weight:700;">'+krEsc(room.name)+' <span style="font-weight:400;font-size:11px;color:var(--muted);">'+krEsc(room.clinicName)+'</span></span></span><span style="cursor:pointer;font-size:15px;" onclick="krCloseChat()">✕</span></div>'+
    '<div id="kr-chat-msgs" style="flex:1;overflow:auto;padding:8px 14px;">'+(body||'<div style="padding:24px;color:var(--muted);text-align:center;">还没有消息</div>')+'</div>'+
    '<div style="display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--line);"><input id="kr-chat-in" placeholder="输入消息…（Enter 发送）" onkeydown="if(event.key===\'Enter\')krSendMsg()" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:8px;"><button class="btn-primary" onclick="krSendMsg()">发送</button></div>';
  var box = document.getElementById('kr-chat-msgs'); if(box) box.scrollTop = box.scrollHeight;
  krMarkRead(room.key, msgs.length); krUpdateBadges();
}

/* ---------- CMD-1014-16 二：KR［新建职员对话］（室长 / 管理者 / 院长都有；功能同 IN） ----------
   成员 = 本院 KR 人员 + 对接诊所的 IN 室长（已激活、有姓名的账号）；房间放在「所选 IN 室长所在诊所」的分区里（ROOMS 带 members），IN 在职员间 tab 看得到
   （只有成员看得到）；只选 KR 人员时放在第一家对接诊所的分区里，IN 看不到；一个房间只能选同一家诊所的 IN 室长；成员完全相同的房已存在就直接进原来的房。 */
var KR_NEWCHAT = {sel:[]};
function krChatRoster(){
  var hid = krHospitalIdOfMe(), me = currentAccount(), out = [];
  ACCOUNTS.forEach(function(a){ if(a.status==='active' && a.name && a.id!==me.id){
    if(a.hospitalId===hid && a.role.indexOf('kr_')===0) out.push({name:a.name, label:a.name+' · '+(KR_ROLE_LABEL[a.role]||'KR'), kr:true});
    else if(!a.hospitalId && a.role!=='owner' && krClinics().some(function(cl){ return cl.id===(a.clinicId||'C1'); })) out.push({name:a.name, label:a.name+' · IN 室长（'+((clinicById(a.clinicId||'C1')||{}).name||'')+'）', kr:false, clinicId:a.clinicId||'C1'});
  } });
  return out;
}
function krOpenNewStaffChat(){
  KR_NEWCHAT = {sel:[]};
  var ov = document.getElementById('kr-newchat-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'kr-newchat-overlay'; ov.className = 'modal-overlay'; ov.style.zIndex = 90; ov.onclick = function(e){ if(e.target===ov) ov.classList.remove('open'); }; document.body.appendChild(ov); }
  krRenderNewStaffChat(); ov.classList.add('open');
}
function krRenderNewStaffChat(){
  var ov = document.getElementById('kr-newchat-overlay'); if(!ov) return;
  ov.innerHTML = '<div class="modal-box" style="width:420px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">新建职员对话</b><span style="cursor:pointer;" onclick="document.getElementById(\'kr-newchat-overlay\').classList.remove(\'open\')">✕</span></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">选成员：本院 KR 人员 + 对接诊所的 IN 室长（同一个房间只能选同一家诊所的 IN 室长）</div>'+
    '<div style="max-height:46vh;overflow:auto;">'+krChatRoster().map(function(r){ var on = KR_NEWCHAT.sel.indexOf(r.name)>-1; return '<label style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--border2);font-size:13px;cursor:pointer;"><input type="checkbox" '+(on?'checked ':'')+'onchange="krToggleNewChatPick(\''+krEsc(r.name).replace(/\'/g,'')+'\')"><span>'+krEsc(r.label)+'</span></label>'; }).join('')+'</div>'+
    '<div id="kr-newchat-err" style="font-size:12px;color:#C1454A;min-height:18px;margin-top:6px;"></div>'+
    '<div style="display:flex;gap:10px;margin-top:6px;"><button class="btn-outline" style="flex:1;" onclick="document.getElementById(\'kr-newchat-overlay\').classList.remove(\'open\')">取消</button><button class="btn-primary" style="flex:1;" onclick="krConfirmNewStaffChat()">开始对话</button></div></div>';
}
function krToggleNewChatPick(name){ var i = KR_NEWCHAT.sel.indexOf(name); if(i>-1) KR_NEWCHAT.sel.splice(i,1); else KR_NEWCHAT.sel.push(name); krRenderNewStaffChat(); }
function krConfirmNewStaffChat(){
  var err = function(m){ var e = document.getElementById('kr-newchat-err'); if(e) e.textContent = m; };
  var me = currentAccount(), sel = KR_NEWCHAT.sel.slice(), roster = krChatRoster();
  if(!sel.length){ err('请至少选择一位同事'); return; }
  var inClinics = {}; sel.forEach(function(nm){ var r = roster.filter(function(x){ return x.name===nm; })[0]; if(r && !r.kr) inClinics[r.clinicId] = 1; });
  var cids = Object.keys(inClinics); if(cids.length>1){ err('一个房间只能选同一家诊所的 IN 室长（你选了 '+cids.length+' 家诊所的人）'); return; }
  var cid = cids[0] || krClinics()[0].id, members = [me.name].concat(sel).sort(), roomId = 'kgrp-'+members.join('-');
  var key = cid+'|'+roomId;
  Store.updateClinic(cid, function(v){
    v.ROOMS = v.ROOMS || []; v.CHAT_DATA = v.CHAT_DATA || {};
    if(!v.ROOMS.some(function(r){ return r.id===roomId; })){
      v.ROOMS.push({id:roomId, name:members.filter(function(n){ return n!==me.name; }).map(function(n){ return n.split(' ')[0]; }).join('、')+'（职员间）', color:'var(--blue)', init:'G', date:'刚刚', members:members, createdBy:me.name});
      v.CHAT_DATA[roomId] = v.CHAT_DATA[roomId] || [{day:KD(0), from:'sys', orig:me.name+' 新建了职员对话', time:nowTime(), ts:nowFullDt()}];
    }
  });
  document.getElementById('kr-newchat-overlay').classList.remove('open');
  KR_CHAT.open = true; KR_CHAT.tab = 'staff'; KR_CHAT.room = key; krRenderChat(true);
}
function krSendMsg(){
  var inp = document.getElementById('kr-chat-in'); if(!inp || !inp.value.trim() || !KR_CHAT.room) return;
  var parts = KR_CHAT.room.split('|'), text = inp.value.trim(), me = currentAccount();
  var msg = {day:KD(0), from:'them', name:ME_NAME, color:'var(--sage)', init:(ME_NAME||'?').charAt(0), orig:text, trans:demoTranslate(text,'ko','zh'), time:nowTime(), ts:nowFullDt()};
  Store.updateClinic(parts[0], function(v){ v.CHAT_DATA[parts[1]] = v.CHAT_DATA[parts[1]] || []; v.CHAT_DATA[parts[1]].push(msg); v.ROOM_UNREAD = v.ROOM_UNREAD || {}; v.ROOM_UNREAD[parts[1]] = (v.ROOM_UNREAD[parts[1]]||0) + 1; });
  krRenderChat(true);
  var i2 = document.getElementById('kr-chat-in'); if(i2) i2.focus();
}

/* ---------- 二、录入面诊 → AI 草稿 + KR 专用附件仓库（KR-CASE-01 第 3 节） ---------- */
/* KR 专用附件仓库：存在医院资料里（HOSPITAL_DATA[h].vault），只有 KR 页面读写，IN 端不显示；保存期限结案后 3 年（Data Retention & Consent）
   每个案件：{audio:[{id,ts,by,label,sec}], transcripts:[{id,ts,by,mode,text,demo}], drafts:[{id,ts,by,source,text}], history:[{ts,by,action}]} */
function krVault(clinicId, caseId, create){
  var h = krHData(); h.vault = h.vault || {};
  var k = clinicId+':'+caseId;
  if(!h.vault[k] && create) h.vault[k] = {audio:[], transcripts:[], drafts:[], history:[]};
  return h.vault[k] || {audio:[], transcripts:[], drafts:[], history:[]};
}
function krVaultLog(v, action){ v.history.push({ts:nowFullDt(), by:ME_NAME, action:action}); }
var KR_REC = {caseKey:'', text:'', recording:false, demoVoice:false, rec:null, startedAt:0};
var KR_DEMO_TRANSCRIPT = '턱선이 전반적으로 처지고 팔자주름이 깊습니다. 피부 탄력 저하가 중등도로 보이며, 우선 리프팅 위주로 시작하고 필요하면 윤곽 시술을 추가하는 것을 권합니다. 시술 후 2주간은 사우나와 격한 운동을 피하셔야 합니다. （演示用转写文字）';
function krRecKey(){ return KR_CASE.clinicId+':'+KR_CASE.id; }
function krRecReset(){ if(KR_REC.caseKey !== krRecKey()){ krRecStop(true); KR_REC = {caseKey:krRecKey(), text:'', recording:false, demoVoice:false, rec:null, startedAt:0}; } }
function krCanRecord(c){ var me = currentAccount(); return !!me && (canDo('krwork') || (isKrDirectorLike(me) && krIsMyCase(c))); }
function krRecInput(v){ KR_REC.text = v; }

/* 录入面诊（CMD-1008-12 C4；院长与 KR 室长相同）：点录入方式 → 弹窗；语音转写 / 手动输入都是可直接修改的输入框 →［上传内容］→ 内容以文字显示在「录入面诊」下方（存进 KR 专用附件仓库的转写记录，IN 看不到） */
var KR_REC_OPEN = false;
function krRecRefresh(){ if(KR_REC_OPEN) krRecModalRender(); krRenderCaseDetail(); }
function krRecModalRender(){
  var ov = ensurePromoOverlay('kr-rec-overlay'), voice = KR_REC.mode==='voice', srOk = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  var tip = KR_REC.recording ? '<div style="background:#FDEBD3;color:#A85A10;border-radius:8px;padding:8px 12px;font-size:12px;margin-bottom:8px;">🎙 录音中…'+(KR_REC.demoVoice ? '（演示：当前浏览器不支持语音识别，已填入演示文字）' : '（正在做语音转文字，韩语）')+'</div>' : (voice && !srOk ? '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">当前浏览器不支持语音识别，点开始录音会填入一段演示文字（可修改）。</div>' : '');
  ov.firstChild.style.width = '560px';
  ov.firstChild.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><b style="font-size:15px;">'+(KR_REC.add ? (voice ? '增加内容（语音）' : '增加内容（手动）') : (voice ? '语音录入面诊' : '手动输入面诊'))+'</b><span style="cursor:pointer;" onclick="krRecCancel()">✕</span></div>'+tip+
    (voice ? '<div style="margin-bottom:8px;">'+(KR_REC.recording ? '<button class="btn-primary" onclick="krRecStop()">⏹ 停止录音</button>' : '<button class="btn-outline" onclick="krRecStart(\'voice\')">🎙 开始 / 继续录音</button>')+'</div>' : '')+
    '<textarea id="kr-rec-text" oninput="krRecInput(this.value)" placeholder="面诊内容（语音转写或手动输入，可直接修改）" style="width:100%;min-height:200px;padding:10px;border:1px solid var(--line);border-radius:8px;font-size:13px;box-sizing:border-box;">'+krEsc(KR_REC.text)+'</textarea>'+
    '<div style="display:flex;gap:10px;margin-top:12px;"><button class="btn-outline" style="flex:1;" onclick="krRecCancel()">取消</button><button class="btn-primary" style="flex:1;" onclick="krRecUpload()">上传内容</button></div>';
  ov.classList.add('open');
}
/* 院长账号：［录入面诊］在新分页打开（地址带 rec=voice|manual，进页面后自动弹出录入窗口） */
function krRecUrl(mode, add){ return location.pathname+'?case='+KR_CASE.clinicId+':'+KR_CASE.id+'&tab=consult&rec='+mode+(add ? '&add=1' : '')+'&win=1'; }
/* 面诊录入 / 增加内容：只把录入弹窗内容用小尺寸独立窗口打开（window.open 弹出窗），原案件页不跳转；上传后原页面靠存档同步自动更新（CMD-1013-02 四） */
function krRecNewTab(mode, add){
  var w = window.open(krRecUrl(mode, add), 'krrec', 'popup=yes,width=640,height=720,left=120,top=60');
  if(!w) alert('浏览器拦截了弹出窗口：请允许弹出窗口后再点一次');
  return w;
}
function krRecOpenModal(mode, add){
  if(!window.__krRecInTab){ krRecNewTab(mode, add); return; } /* 院长和 KR 室长一样：都在独立小窗口里录入 */
  krRecReset(); KR_REC.mode = mode; KR_REC.add = !!add; KR_REC.text = ''; KR_REC.startedAt = 0; KR_REC.demoVoice = false; KR_REC_OPEN = true;
  krRecModalRender();
  if(mode==='voice') krRecStart('voice');
}
function krRecCancel(){ krRecStop(true); KR_REC_OPEN = false; KR_REC.text = ''; KR_REC.startedAt = 0; KR_REC.demoVoice = false; closePromoOverlay('kr-rec-overlay'); krRenderCaseDetail(); if(window.__krRecWin) window.close(); }
function krRecUpload(){
  if(!confirm(KR_REC.add ? '这一笔上传后不能再修改（之前的内容也不能改），确定要增加吗？' : '上传后内容不能再修改，确定要上传吗？')) return;
  krRecStop(false);
  var txt = krSaveTranscript(); if(!txt) return;
  krMut(function(c){ if(!c.consultStartedAt){ c.consultStartedAt = nowFullDt(); c.consultStartedBy = ME_NAME; } if(!c.consultContentAt){ c.consultContentAt = nowFullDt(); logCaseEvent(c, ME_NAME, '上传面诊内容，面诊结束'); updateCaseStage(c); pushKrNotif(caseKrHospital(c), ME_NAME+' 上传了面诊内容，面诊结束：'+c.name+'（'+(c.caseNo||'')+'）→ 请发送诊疗方案', {to:'coord', caseId:c.id, clinicId:c.clinicId||CURRENT_CLINIC_ID, level:'action'}); pushNotif('面诊', '面诊结束：'+c.name+'（'+(c.caseNo||'')+'），等待诊疗方案', {caseId:c.id, level:'info'}); } }); /* 院长按［上传内容］：IN 案件列表的进程由「面诊中」变「等待报告」 */
  KR_REC_OPEN = false; KR_REC.text = ''; KR_REC.startedAt = 0; KR_REC.demoVoice = false;
  closePromoOverlay('kr-rec-overlay'); Store.touch(); krRenderCaseDetail();
  if(window.__krRecWin) setTimeout(function(){ window.close(); }, 150); /* 小窗口：上传后关闭，原页面自动更新 */
}
function krRecStart(mode){
  if(mode==='manual'){ krRecOpenModal('manual'); return; }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  KR_REC.startedAt = KR_REC.startedAt || Date.now();
  if(!SR){ /* 浏览器不支持语音识别：用演示文字代替 */
    KR_REC.demoVoice = true; KR_REC.recording = true; KR_REC.text = (KR_REC.text ? KR_REC.text+'\n' : '') + KR_DEMO_TRANSCRIPT; krRecModalRender(); return;
  }
  try{
    var r = new SR(); r.lang = 'ko-KR'; r.continuous = true; r.interimResults = true;
    var base = KR_REC.text ? KR_REC.text+'\n' : '';
    r.onresult = function(e){ var fin = '', itm = ''; for(var i = 0; i < e.results.length; i++){ if(e.results[i].isFinal) fin += e.results[i][0].transcript; else itm += e.results[i][0].transcript; } KR_REC.text = base + fin + itm; var ta = document.getElementById('kr-rec-text'); if(ta) ta.value = KR_REC.text; };
    r.onerror = function(){ /* 没有麦克风权限 / 识别服务不可用：改用演示文字代替 */ KR_REC.demoVoice = true; KR_REC.rec = null; KR_REC.recording = true; if(!KR_REC.text.trim()) KR_REC.text = KR_DEMO_TRANSCRIPT; krRecModalRender(); };
    r.onend = function(){ if(KR_REC.recording && KR_REC.rec===r){ try{ r.start(); }catch(e){} } };
    KR_REC.rec = r; KR_REC.recording = true; KR_REC.demoVoice = false; r.start();
  }catch(e){ KR_REC.demoVoice = true; KR_REC.recording = true; KR_REC.text += (KR_REC.text ? '\n' : '') + KR_DEMO_TRANSCRIPT; }
  krRecModalRender();
}
function krRecStop(silent){
  if(KR_REC.rec){ try{ KR_REC.rec.stop(); }catch(e){} KR_REC.rec = null; }
  if(!KR_REC.recording) return;
  KR_REC.recording = false;
  if(silent){ if(KR_REC_OPEN) krRecModalRender(); return; }
  var sec = Math.max(1, Math.round((Date.now() - KR_REC.startedAt)/1000)), v = krVault(KR_CASE.clinicId, KR_CASE.id, true);
  v.audio.push({id:'au'+Date.now(), ts:nowFullDt(), by:ME_NAME, label:'面诊原始录音（演示占位，没有真实音频文件）', sec:sec});
  krVaultLog(v, '语音录入面诊（'+(KR_REC.demoVoice ? '演示文字' : '语音识别')+'，约 '+sec+' 秒），生成原始录音占位');
  if(KR_REC_OPEN) krRecModalRender();
}
function krSaveTranscript(){
  var txt = (KR_REC.text||'').trim(); if(!txt){ alert('还没有内容'); return null; }
  var v = krVault(KR_CASE.clinicId, KR_CASE.id, true), mode = KR_REC.mode==='voice' ? 'voice' : 'manual';
  v.transcripts.push({id:'tr'+Date.now(), ts:nowFullDt(), by:ME_NAME, mode:mode, text:txt, demo:!!KR_REC.demoVoice});
  krVaultLog(v, (mode==='voice' ? '语音录入面诊并上传内容' : '手动输入面诊并上传内容')+'（'+txt.length+' 字）');
  Store.touch(); return txt;
}
/* AI 整理成报告（演示：模板；正式版接 LLM，见 Integrations & APIs）——只在 KR 室长画面 */
function krAiDraftText(c, text){
  return '[면담 소견 요약]\n고객: '+c.name+' ('+c.caseNo+')\n고민: '+(c.concern||'—')+'\n기대: '+(c.expectation||'—')+'\n\n[원장 소견]\n'+text+'\n\n[권장 시술]\n- （실장이 가능 범위에서 선택）\n\n[주의사항]\n- 시술 전후 주의사항은 상담 시 안내 예정\n\n※ 데모용 템플릿 초안입니다. 실제 서비스에서는 LLM이 정리합니다.';
}
function krAiOrganize(){
  if(!krCan()) return; /* AI 整理报告只在 KR 室长画面，院长画面没有 */
  var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id); if(!c0) return;
  var v0 = krVault(KR_CASE.clinicId, KR_CASE.id, false), joined = v0.transcripts.map(function(t){ return t.text; }).join('\n\n').trim();
  if(!joined){ alert('请先录入面诊并上传内容（点上面的［语音录入面诊］或［手动输入面诊］）'); return; }
  var draft = '';
  Store.withClinic(KR_CASE.clinicId, function(){
    var c = CASE_ITEMS.filter(function(x){ return x.id===KR_CASE.id; })[0], v = krVault(KR_CASE.clinicId, KR_CASE.id, true);
    draft = krAiDraftText(c, joined);
    v.drafts.push({id:'dr'+Date.now(), ts:nowFullDt(), by:ME_NAME, source:'AI 整理（演示模板）', text:draft});
    krVaultLog(v, 'AI 整理出报告重点（演示模板）');
  });
  KR_SUB.text = draft; /* 整理结果放进下面的报告输入框，室长可直接修改 */
  Store.touch(); krRenderCaseDetail();
}
function krVaultHtml(c){
  var v = krVault(KR_CASE.clinicId, KR_CASE.id, false);
  var row = function(tag, ts, by, body){ return '<div class="case-field-row" style="align-items:flex-start;font-size:12px;"><span class="status-pill" style="background:var(--border2);color:var(--slate2);font-size:10px;margin-right:8px;">'+tag+'</span><span style="min-width:112px;color:var(--muted);">'+krEsc(ts)+'</span><span style="min-width:60px;font-weight:600;">'+krEsc(by)+'</span><span style="flex:1;white-space:pre-wrap;">'+body+'</span></div>'; };
  var rows = v.audio.map(function(a){ return row('录音', fmtUtc(a.ts), a.by, krEsc(a.label)+'（'+a.sec+' 秒）'); }).concat(
    v.transcripts.map(function(x){ return row('转写', fmtUtc(x.ts), x.by, krEsc(x.text)+(x.demo?' <i style="color:var(--muted);">（演示）</i>':'')); }),
    (krIsDirector() ? [] : v.drafts.map(function(d){ return row(d.source.indexOf('AI')===0?'AI草稿':'修改稿', fmtUtc(d.ts), d.by, krEsc(d.text)); })),
    v.history.map(function(h0){ return row('过程', fmtUtc(h0.ts), h0.by, krEsc(h0.action)); }));
  return krCardBox('KR 专用附件仓库 <span style="font-weight:400;font-size:11px;color:var(--muted);">只有 KR 看得到，IN 看不到；保存期限：结案后 3 年</span>', rows.length ? rows.join('') : krEmpty('还没有内容（语音 / 手动录入后会放进来）'));
}
function krRecordBlock(c){
  krRecReset();
  if(!krCanRecord(c)) return krCardBox('录入面诊', krEmpty('你的账号不能录入这个案件的面诊'));
  var v = krVault(KR_CASE.clinicId, KR_CASE.id, false);
  var entries = v.transcripts.map(function(x){ return '<div style="padding:10px 12px;margin-top:8px;background:var(--surface2,#faf6ef);border-radius:8px;"><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">'+krEsc(fmtUtc(x.ts))+' · '+krEsc(x.by)+' · '+(x.mode==='voice' ? '语音录入' : '手动输入')+(x.demo ? '（演示文字）' : '')+'</div><div style="font-size:13px;white-space:pre-wrap;line-height:1.6;">'+krEsc(x.text)+'</div></div>'; }).join('');
  var box = krCardBox('录入面诊（院长口述 / 室长代录）',
    (c.consultContentAt
      ? '<div style="font-size:12px;color:var(--sage);margin-bottom:4px;">✓ 面诊内容已上传并锁住（不能修改）；还要补充时用下面的［增加内容］，每一笔都记时间和录入人。</div>'+(c.reportReady ? '' : '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;"><button class="btn-outline" onclick="krRecOpenModal(\'voice\',true)">🎙 增加内容（语音）</button><button class="btn-outline" onclick="krRecOpenModal(\'manual\',true)">⌨ 增加内容（手动）</button></div>')
      : '<div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn-outline" onclick="krRecOpenModal(\'voice\')">🎙 语音录入面诊</button><button class="btn-outline" onclick="krRecOpenModal(\'manual\')">⌨ 手动输入面诊</button></div>')+
    (entries || '<div style="font-size:12px;color:var(--muted);margin-top:10px;">还没有录入内容：点上面的录入方式，在弹窗里录入或输入，再点［上传内容］，内容会以文字显示在这里。</div>')+
    '<div style="font-size:11px;color:var(--muted);margin-top:8px;">录入内容、原始录音和修改过程都进「KR 专用附件」tab（Timeline 旁边），只有 KR 看得到。</div>');
  return box+(typeof krSubmitBlock==='function' && canDo('krwork') ? (c.consultContentAt ? krSubmitBlock(c) : '') : '');
}


/* ---------- 三、提交最终报告（只有 KR 室长 / 管理者） ---------- */
function krSubBlank(key){ return {caseKey:key, text:null, pick:{}, notes:{}, overall:'', files:[], detail:{}, tab:'surg', mg:{}, mgq:''}; } /* tab = 可选范围分类［施术项目］［管理项目］；mg[本地项目 id] = {sid, qty, interval, manual}（CMD-1015-16） */
var KR_SUB = krSubBlank(''); /* detail[项目名] = {stay, anes, anesNote, pc:[{kr, inn, times, place, day}]} */
function krSubReset(c){
  if(KR_SUB.caseKey !== krRecKey()) KR_SUB = krSubBlank(krRecKey());
  if(KR_SUB.text===null){ var v = krVault(KR_CASE.clinicId, KR_CASE.id, false); KR_SUB.text = v.drafts.length ? v.drafts[v.drafts.length-1].text : ''; }
}
/* 本医院赴韩项目（项目库）+ 来源诊所本地项目库的"术后管理"分类 */
function krScopeCandidates(clinicId){
  var hid = krHospitalIdOfMe();
  var all = ((HOSPITAL_DATA[hid]||{}).projects||[]).filter(function(p){ return p.active; });
  var kr = all.filter(function(p){ return !isKrPostcareCat(p.categoryId); }), krPost = all.filter(function(p){ return isKrPostcareCat(p.categoryId); });
  var v = Store.readClinic(clinicId) || {}, cat = null;
  Object.keys(v.PROJECT_CATEGORIES||{}).forEach(function(k){ if(v.PROJECT_CATEGORIES[k].label==='术后管理') cat = k; });
  var localAll = (v.PROJECT_LIBRARY||[]).filter(function(p){ return p.origin==='IN' && p.active; });
  var postCat = localAll.filter(function(p){ return cat && p.categoryId===cat; });
  return {kr:kr, post:localAll, postCat:postCat, krPost:krPost, krLocal:krLocalLib(hid)}; /* kr = 赴韩项目；krPost = 韩国术后管理（韩元，「在韩国」）；post = 来源诊所全部本地项目（「在印尼」，KR 只看名称不看价格，2026-10-08）；postCat = 其中「术后管理」分类（单独列成可选项目用） */
}
function krSubSet(k, v){ KR_SUB[k] = v; if(k==='overall') krSumRefresh(); }
function krPickToggle(name, on){ KR_SUB.pick[name] = on; if(on && !KR_SUB.detail[name]) KR_SUB.detail[name] = krDefaultsDetail(name); /* 项目库默认资料自动带入，可按客人调整 */ krRenderCaseDetail(); }
/* 项目资料一行小字：麻醉、推荐在韩时间、所需术后管理 */
function krItemMetaHtml(it){
  var bits = [];
  if(it.anesthesia) bits.push('麻醉：'+krEsc(it.anesthesia.label+(it.anesthesia.note?'（'+it.anesthesia.note+'）':'')));
  if(it.mgmt) bits.push('管理项目：'+(it.qty||1)+' 次'+((it.qty||1)>1 && it.interval ? '，每隔 '+it.interval+' 天' : '')+'（付费，只在韩国做）');
  if(it.stay) bits.push('推荐在韩：'+krEsc(it.stay));
  (it.postcare||[]).forEach(function(x){ bits.push('术后管理：'+krEsc(pcLabel(x))+(x.mgmt && x.name && x.mgmt!==x.name ? '（'+krEsc(x.name)+'）' : '')+' × '+x.times+'（'+(x.place==='KR'?'必须在韩国':'韩国或印尼都可')+(x.times>1 && x.interval ? '，每隔 '+x.interval+' 天' : '')+(pcDayText(x)?'，'+krEsc(pcDayText(x)):'')+'）'); });
  return bits.length ? '<div style="font-size:11px;color:var(--slate2);margin-top:2px;">'+bits.join(' ｜ ')+'</div>' : '';
}
/* 编辑中的一行 → 存进项目的术后管理快照；第 N 天起 + 间隔自动生成之后的日子 */
function krPcToItem(x, ip){
  var o = {mgmt:(x.mgmt||'').trim(), name:x.kr, times:x.times, interval:x.times>1 ? (parseInt(x.interval,10)||1) : 0, place:x.place, startDay:parseInt(x.start,10)||0, innName:ip ? ip.name : ''};
  o.day = pcDayText(o); return o;
}
/* 管理项目名称下拉（不是自由填写；不写地点） */
var KR_PC_NAMES = ['术后复诊', '拆线', '术后管理', '伤口护理']; /* 「消肿管理」改名「术后管理」（CMD-1013-02 六） */
function krPcNameSelect(sel, onchange, inp){
  var names = KR_PC_NAMES.slice(); if(sel && names.indexOf(sel)<0) names.push(sel);
  return '<select onchange="'+onchange+'" style="'+inp+'"><option value="">管理项目</option>'+names.map(function(n){ return '<option'+(sel===n?' selected':'')+'>'+krEsc(n)+'</option>'; }).join('')+'</select>';
}
function krDet(name){ return KR_SUB.detail[name] || (KR_SUB.detail[name] = {stay:'', anes:'local', anesNote:'', pc:[]}); }

/* ---- CMD-1015-16：可选范围分［施术项目］［管理项目］；管理项目 = KR 本地管理项目（付费、只在韩国做），填 项目（规格）｜次数｜间隔 ---- */
function krMgState(S, id, p){ var st = S.mg[id]; if(!st){ st = S.mg[id] = {sid:(p && p.specs[0]) ? p.specs[0].id : '', qty:1, interval:1, manual:''}; } return st; }
function krMgLib(id){ return krLocalLib(krHospitalIdOfMe()).filter(function(x){ return x.id===id; })[0]; }
/* 一条管理项目 → 可选范围里的条目（面议项目要手填单价；没填返回 null） */
function krMgScopeItem(p, st, note){
  var sp = p.specs.filter(function(x){ return x.id===st.sid; })[0] || p.specs[0]; if(!sp) return null;
  var unit = p.neg ? Math.round(Number(st.manual)) : sp.price; if(!(unit > 0)) return null;
  var qty = Math.max(1, parseInt(st.qty,10) || 1), itv = qty > 1 ? (parseInt(st.interval,10) || 1) : 0;
  return {name:p.name+' · '+sp.label, price:unit*qty, mgmt:true, localId:p.id, specId:sp.id, specLabel:sp.label, unit:unit, qty:qty, interval:itv, note:(note||'').trim()};
}
function krMgIntervalSel(onchange, val, inp){ return '<select onchange="'+onchange+'" style="'+inp+'">'+[1,2,3,4,5,6,7,10,14,21,30].map(function(n){ return '<option value="'+n+'"'+((val||1)===n?' selected':'')+'>隔 '+n+' 天</option>'; }).join('')+'</select>'; }
/* 管理项目选择一行（发送诊疗方案 / 补加共用）：规格｜次数｜间隔｜小计；mode 'sub' 读 KR_SUB.mg，'add' 读 KR_ADD.mg */
function krMgFormHtml(p, st, mode){
  var inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;', fn = function(k, v){ return (mode==='add' ? 'krAddMgSet' : 'krMgSet')+'(\''+p.id+'\',\''+k+'\','+v+')'; };
  var it = krMgScopeItem(p, st, '');
  return '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:4px 0 8px 22px;padding:8px 10px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;">'+
    '<select onchange="'+fn('sid','this.value')+'" style="'+inp+'">'+p.specs.map(function(x){ return '<option value="'+x.id+'"'+(x.id===st.sid?' selected':'')+'>'+krEsc(x.label)+'</option>'; }).join('')+'</select>'+
    (p.neg ? '<input type="number" min="1" placeholder="面议：单价 ₩" value="'+krEsc(st.manual||'')+'" onchange="'+fn('manual','this.value')+'" style="'+inp+'width:110px;">' : '')+
    '<span style="white-space:nowrap;"><input type="number" min="1" value="'+(st.qty||1)+'" onchange="'+fn('qty','Math.max(1,parseInt(this.value,10)||1)')+'" style="'+inp+'width:46px;"> 次</span>'+
    ((st.qty||1) > 1 ? krMgIntervalSel(fn('interval','parseInt(this.value,10)'), st.interval, inp) : '')+
    '<span style="color:var(--sage);">'+(it ? '小计 '+formatCurrency(it.price,'KRW') : '（面议项目请填单价）')+'</span><span style="color:var(--muted);">只在韩国做</span></div>';
}
function krMgListHtml(S, mode){
  var q = String(S.mgq||'').trim().toLowerCase(), l = krLocalLib(krHospitalIdOfMe()).filter(function(p){ return !q || p.name.toLowerCase().indexOf(q)>-1 || String(p.catLabel||'').toLowerCase().indexOf(q)>-1; });
  var cats = []; l.forEach(function(p){ if(cats.indexOf(p.catLabel)<0) cats.push(p.catLabel); });
  var have = (mode==='add' ? ((krFindCase(KR_CASE.clinicId, KR_CASE.id)||{}).c||{}).krScope : null); have = have ? (have.items||[]).filter(function(it){ return it.mgmt; }).map(function(it){ return it.localId; }) : [];
  var tg = mode==='add' ? 'krAddMgPick' : 'krMgPick';
  return cats.map(function(cl){
    return '<div style="font-size:11px;font-weight:700;color:var(--muted);margin:8px 0 2px;">'+krEsc(cl)+'</div>'+l.filter(function(p){ return p.catLabel===cl; }).map(function(p){
      var on = !!S.mg[p.id] && !!S.mg[p.id].on, st = on ? S.mg[p.id] : null, got = have.indexOf(p.id)>-1;
      return '<div style="border-bottom:1px solid var(--border2);padding:4px 0;font-size:13px;"><label style="display:flex;gap:8px;align-items:center;cursor:pointer;"><input type="checkbox" '+(on?'checked':'')+' onchange="'+tg+'(\''+p.id+'\',this.checked)"> <span style="flex:1;font-weight:600;">'+krEsc(p.name)+'</span>'+(got ? '<span style="color:var(--muted);font-size:11px;">已在可选范围内（可再补加其他规格）</span>' : '')+'</label>'+(on ? krMgFormHtml(p, st, mode) : '')+'</div>';
    }).join('');
  }).join('') || '<div style="font-size:12px;color:var(--muted);">没有匹配的管理项目</div>';
}
function krMgPick(id, on){ var p = krMgLib(id); if(!p) return; var st = krMgState(KR_SUB, id, p); st.on = !!on; krRenderCaseDetail(); }
function krMgSet(id, k, v){ var p = krMgLib(id); if(!p) return; krMgState(KR_SUB, id, p)[k] = v; krRenderCaseDetail(); }
function krMgSearch(v){ KR_SUB.mgq = v; var el = document.getElementById('kr-mg-sub-list'); if(el) el.innerHTML = krMgListHtml(KR_SUB, 'sub'); }
function krSubTab(t){ KR_SUB.tab = t; krRenderCaseDetail(); }
function krMgPicked(){ var out = []; Object.keys(KR_SUB.mg||{}).forEach(function(id){ var st = KR_SUB.mg[id], p = krMgLib(id); if(st && st.on && p) out.push({p:p, st:st}); }); return out; }
/* 可选范围（发送诊疗方案）：［施术项目］［管理项目］两个分类 */
function krScopeTabsHtml(cand){
  var tab = KR_SUB.tab || 'surg', nS = cand.kr.filter(function(p){ return KR_SUB.pick[p.name]; }).length, nM = krMgPicked().length;
  var btn = function(key, label, n){ return '<button class="'+(tab===key ? 'btn-primary' : 'btn-outline')+'" style="padding:4px 14px;font-size:12px;" onclick="krSubTab(\''+key+'\')">'+label+(n ? '（已选 '+n+'）' : '')+'</button>'; };
  return '<div style="font-size:12px;font-weight:700;margin:14px 0 6px;">赴韩项目可选范围</div><div style="display:flex;gap:8px;margin-bottom:6px;">'+btn('surg','施术项目',nS)+btn('mgmt','管理项目',nM)+'</div>';
}
function krSumRefresh(){ var el = document.getElementById('kr-rec-sum'); if(el) el.innerHTML = krRecSummaryBlock(krScopeCandidates(KR_CASE.clinicId)); } /* 推荐项目整理随填写即时重算（CMD-1013-02 八） */
function krDetSet(name, k, v){ krDet(name)[k] = v; krSumRefresh(); }
function krPcSet(name, i, k, v){ krDet(name).pc[i][k] = v; if(k==='place' || k==='times' || k==='interval' || k==='start') krRenderCaseDetail(); else krSumRefresh(); }
function krPcAdd(name){ krDet(name).pc.push({mgmt:'', kr:'', inn:'', times:1, interval:1, place:'KR', start:''}); krRenderCaseDetail(); }
function krPcDel(name, i){ krDet(name).pc.splice(i, 1); krRenderCaseDetail(); }
var KR_ANES = {local:'局部麻醉', sleep:'睡眠麻醉', general:'全身麻醉'};
/* 勾选的赴韩项目下面展开的项目资料：推荐在韩时间、麻醉特性、所需术后管理 */
function krProjDetailHtml(p, cand){
  var d = krDet(p.name), q = function(s){ return krEsc(s).replace(/'/g,''); };
  var inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;';
  var pcRows = d.pc.map(function(x, i){
    var ph = '\''+q(p.name)+'\','+i;
    var krOpts = '<option value="">具体项目</option>'+cand.krPost.map(function(o){ return '<option value="'+q(o.name)+'"'+(x.kr===o.name?' selected':'')+'>'+krEsc(o.name)+'（免费）</option>'; }).join('')+'<optgroup label="本地管理项目（只看名称）">'+cand.krLocal.map(function(o){ return '<option value="'+q(o.name)+'"'+(x.kr===o.name?' selected':'')+'>'+krEsc(o.name)+'</option>'; }).join('')+'</optgroup>';
    var inOpts = '<option value="">印尼对应项目（选填）</option>'+cand.post.map(function(o){ return '<option value="'+q(o.name)+'"'+(x.inn===o.name?' selected':'')+'>'+krEsc(o.name)+'</option>'; }).join('');
    var days = pcDayText({startDay:x.start, times:x.times, interval:x.interval});
    return '<div style="display:grid;grid-template-columns:130px 92px 104px minmax(0,1fr) auto;gap:6px;align-items:center;margin:6px 0;">'+
      krPcNameSelect(x.mgmt, 'krPcSet('+ph+',\'mgmt\',this.value)', inp)+
      '<span style="white-space:nowrap;"><input type="number" min="1" value="'+x.times+'" onchange="krPcSet('+ph+',\'times\',Math.max(1,parseInt(this.value,10)||1))" style="'+inp+'width:44px;"> 次</span>'+
      (x.times>1 ? '<select onchange="krPcSet('+ph+',\'interval\',parseInt(this.value,10))" style="'+inp+'">'+[1,2,3,4,5,6,7,10,14].map(function(n){ return '<option value="'+n+'"'+((x.interval||1)===n?' selected':'')+'>隔 '+n+' 天</option>'; }).join('')+'</select>' : '<span></span>')+
      '<span style="display:flex;gap:4px;"><select onchange="krPcSet('+ph+',\'kr\',this.value)" style="'+inp+'flex:1;min-width:0;">'+krOpts+'</select>'+(x.place==='either' ? '<select onchange="krPcSet('+ph+',\'inn\',this.value)" style="'+inp+'flex:1;min-width:0;">'+inOpts+'</select>' : '')+'</span>'+'<a href="#" onclick="krPcDel('+ph+');return false;" style="white-space:nowrap;font-size:12px;">移除</a>'+
      '<select onchange="krPcSet('+ph+',\'place\',this.value)" style="'+inp+'"><option value="KR"'+(x.place==='KR'?' selected':'')+'>必须在韩国</option><option value="either"'+(x.place==='either'?' selected':'')+'>韩国或印尼</option></select>'+
      '<span style="white-space:nowrap;">第 <input type="number" min="1" value="'+krEsc(x.start||'')+'" onchange="krPcSet('+ph+',\'start\',this.value)" style="'+inp+'width:40px;"> 天起</span>'+
      '<span style="color:var(--sage);font-size:11px;">'+krEsc(days)+'</span></div>';
  }).join('');
  return '<div style="margin:4px 0 10px 22px;padding:10px 12px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;">'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:6px;"><span>推荐在韩时间</span><input placeholder="例如 7 天" value="'+krEsc(d.stay)+'" oninput="krDetSet(\''+q(p.name)+'\',\'stay\',this.value)" style="'+inp+'width:90px;">'+
    '<span>麻醉</span><select onchange="krDetSet(\''+q(p.name)+'\',\'anes\',this.value)" style="'+inp+'">'+Object.keys(KR_ANES).map(function(k2){ return '<option value="'+k2+'"'+(d.anes===k2?' selected':'')+'>'+KR_ANES[k2]+'</option>'; }).join('')+'</select>'+
    '<input placeholder="麻醉备注（例如全麻需空腹 8 小时）" value="'+krEsc(d.anesNote)+'" oninput="krDetSet(\''+q(p.name)+'\',\'anesNote\',this.value)" style="'+inp+'min-width:220px;"></div>'+
    '<div style="font-weight:700;margin-top:4px;">所需术后管理</div>'+(pcRows || '<div style="color:var(--muted);margin:4px 0;">没有（不需要术后管理）</div>')+
    '<button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="krPcAdd(\''+q(p.name)+'\')">+ 添加所需术后管理</button></div>';
}
function krNoteSet(name, v){ KR_SUB.notes[name] = v; }
function krAddFile(){ var i = document.getElementById('kr-file-name'); if(!i || !i.value.trim()) return; KR_SUB.files.push(i.value.trim()); krRenderCaseDetail(); }
function krDelFile(i){ KR_SUB.files.splice(i, 1); krRenderCaseDetail(); }
var KR_ZH_MAP = [['[면담 소견 요약]','【面诊意见摘要】'],['고객:','客户：'],['고민:','苦恼：'],['기대:','期望：'],['[원장 소견]','【院长意见】'],['[권장 시술]','【建议项目】'],['[주의사항]','【注意事项】'],['- 시술 전후 주의사항은 상담 시 안내 예정','- 术前术后注意事项将在咨询时说明'],['※ 데모용 템플릿 초안입니다. 실제 서비스에서는 LLM이 정리합니다.','※ 演示用模板草稿，正式版由 LLM 整理。'],['（실장이 가능 범위에서 선택）','（由室长在可选范围内选择）']];
/* 演示翻译：只翻模板里的固定词，院长口述的正文原样保留并标注（正式版接 AI 翻译） */
function krDemoZh(text){ var o = text; KR_ZH_MAP.forEach(function(m){ o = o.split(m[0]).join(m[1]); }); return o + '\n\n（演示翻译：只翻译了模板固定词，正文为韩文原文；正式版由 AI 翻译）'; }
/* 可选范围下方自动生成的推荐项目整理（勾选 / 资料变化即时重算，整体备注取下面的输入） */
function krRecSummaryBlock(cand){
  var items = cand.kr.filter(function(p){ return KR_SUB.pick[p.name]; }).map(function(p){ var d = krDet(p.name); return {name:p.name, stay:d.stay, anesthesia:{label:KR_ANES[d.anes], note:d.anesNote}, postcare:d.pc.map(function(x){ return krPcToItem(x, null); }), note:KR_SUB.notes[p.name]||''}; });
  krMgPicked().forEach(function(e){ var it = krMgScopeItem(e.p, e.st, ''); if(it) items.push(it); }); /* 管理项目单独列一段 */
  return recSummaryHtml(items, KR_SUB.overall) || '<div style="font-size:12px;color:var(--muted);margin:10px 0;">勾选赴韩项目后，这里自动生成「推荐项目整理」。</div>';
}
function krSubmitBlock(c){
  krSubReset(c);
  var cand = krScopeCandidates(KR_CASE.clinicId);
  var row = function(p, kind){ var on = !!KR_SUB.pick[p.name]; return '<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--border2);font-size:13px;"><label style="flex:1;display:flex;gap:8px;align-items:center;cursor:pointer;"><input type="checkbox" '+(on?'checked':'')+' onchange="krPickToggle(\''+krEsc(p.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(p.name)+' <span style="color:var(--muted);font-size:11px;">'+(kind==='kr' ? formatCurrency(p.price,'KRW') : '（在印尼，不显示价格）')+'</span></label><input placeholder="备注" value="'+krEsc(KR_SUB.notes[p.name]||'')+'" oninput="krNoteSet(\''+krEsc(p.name).replace(/'/g,'')+'\',this.value)" style="width:42%;padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;"></div>'+(on && kind==='kr' ? krProjDetailHtml(p, cand) : ''); };
  return krCardBox('发送诊疗方案（KR 室长整理，院长不能发送）',
    '<div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start;"><div style="flex:1 1 200px;min-width:200px;">'+'<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;flex-wrap:wrap;"><div style="font-size:12px;color:var(--slate2);">报告内容（韩文原文；AI 整理出重点后，请室长修改必要内容）</div><button class="btn-outline" onclick="krAiOrganize()">✨ AI 整理报告（演示）</button></div>'+
    '<textarea oninput="krSubSet(\'text\',this.value)" placeholder="还没有内容：先在上面录入面诊，点［AI 整理报告］整理出重点，再在这里修改；也可以直接写" style="width:100%;min-height:380px;padding:10px;border:1px solid var(--line);border-radius:8px;font-size:13px;box-sizing:border-box;">'+krEsc(KR_SUB.text)+'</textarea>'+
    '</div><div style="flex:2 1 400px;min-width:300px;">'+
    krScopeTabsHtml(cand)+((KR_SUB.tab||'surg')==='mgmt' ? '<div style="font-size:11px;color:var(--muted);margin-bottom:4px;">管理项目 = KR 本地管理项目（付费、只在韩国做）；到院后和施术项目一样标完成，没做完的转在韩持有</div><input placeholder="搜索管理项目" value="'+krEsc(KR_SUB.mgq||'')+'" oninput="krMgSearch(this.value)" style="width:100%;box-sizing:border-box;padding:6px 10px;border:1px solid var(--line);border-radius:8px;font-size:12px;margin-bottom:4px;"><div id="kr-mg-sub-list">'+krMgListHtml(KR_SUB, 'sub')+'</div>' : (cand.kr.map(function(p){ return row(p,'kr'); }).join('') || krEmpty('本医院项目库没有项目')))+
    '<div id="kr-rec-sum">'+krRecSummaryBlock(cand)+'</div>'+
    '<div style="font-size:12px;font-weight:700;margin:14px 0 4px;">整体备注</div><input value="'+krEsc(KR_SUB.overall)+'" oninput="krSubSet(\'overall\',this.value)" onchange="krRenderCaseDetail()" placeholder="例如：具体术式以到院评估为准" style="width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:8px;box-sizing:border-box;">'+
    '<div style="font-size:12px;font-weight:700;margin:14px 0 4px;">附件</div>'+KR_SUB.files.map(function(f,i){ return '<div style="font-size:12px;padding:3px 0;">📎 '+krEsc(f)+' <a href="#" onclick="krDelFile('+i+');return false;">移除</a></div>'; }).join('')+
    '<div style="display:flex;gap:8px;margin-top:4px;"><input id="kr-file-name" placeholder="附件名称（演示：只记名称，不上传真实文件）" style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:8px;"><button class="btn-outline" onclick="krAddFile()">添加</button></div>'+
    '</div></div><div style="margin-top:16px;">'+(cand.kr.concat(cand.postCat).some(function(p){ return KR_SUB.pick[p.name]; }) || krMgPicked().length ? '<button class="btn-primary" onclick="krSubmitReport()">发送诊疗方案</button>' : '<button class="btn-primary" disabled title="请选择院长推荐的项目" style="background:#C9C5BD;color:#fff;cursor:not-allowed;opacity:1;">发送诊疗方案</button>')+'</div>');
}
function krSubmitReport(){
  if(!krCan()) return; /* 院长不能提交 */
  var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id); if(!c0) return;
  var text = (KR_SUB.text||'').trim(); if(!text){ alert('报告内容不能为空'); return; }
  var cand = krScopeCandidates(KR_CASE.clinicId), items = [];
  var bad = '';
  cand.kr.concat(cand.postCat).forEach(function(p){
    if(!KR_SUB.pick[p.name]) return;
    var it = {name:p.name, price:p.price, note:(KR_SUB.notes[p.name]||'').trim()};
    if(cand.kr.indexOf(p) > -1){ /* 赴韩项目的项目资料：推荐在韩时间、麻醉特性、所需术后管理 */
      var d = krDet(p.name);
      it.stay = (d.stay||'').trim(); it.anesthesia = {type:d.anes, label:KR_ANES[d.anes], note:(d.anesNote||'').trim()};
      it.postcare = d.pc.map(function(x){
        var kp = cand.krPost.concat(cand.krLocal||[]).filter(function(o){ return o.name===x.kr; })[0], ip = x.place==='either' ? cand.post.filter(function(o){ return o.name===x.inn; })[0] : null;
        if(!kp) bad = '「'+p.name+'」的所需术后管理还有没选项目的行';
        return krPcToItem(x, ip);
      });
    }
    items.push(it);
  });
  krMgPicked().forEach(function(e){ var mi = krMgScopeItem(e.p, e.st, ''); if(!mi) bad = '管理项目「'+e.p.name+'」是面议项目，请填单价'; else items.push(mi); });
  if(bad){ alert(bad); return; }
  /* 发送诊疗方案至少勾 1 个赴韩项目（CMD-1013-07 一；取消「KR 不给项目 → 仅出报告」的路径） */
  if(!items.length){ alert('至少要勾选 1 个项目（施术项目或管理项目）才能发送诊疗方案'); return; }
  if(!confirm('发送后 IN 端会变成"项目确认中"，并收到"诊疗方案已到"通知。确认发送？')) return;
  var v = krVault(KR_CASE.clinicId, KR_CASE.id, true), last = v.drafts.length ? v.drafts[v.drafts.length-1].text : '';
  if(text !== last){ v.drafts.push({id:'dr'+Date.now(), ts:nowFullDt(), by:ME_NAME, source:'KR 室长调整稿', text:text}); krVaultLog(v, '室长调整草稿（最终报告）'); }
  krVaultLog(v, '提交最终报告');
  var rep = {original:text, zh:krDemoZh(text), items:items, overallNote:(KR_SUB.overall||'').trim(), files:KR_SUB.files.slice()};
  var ok = krMut(function(c){ return coreSubmitReport(c, rep, ME_NAME); });
  KR_SUB = krSubBlank(''); KR_REC.caseKey = '';
  Store.touch(); krRefreshAll();
}


/* ---------- 四、延续既往面诊与补加可选项目 ---------- */
function krJudgeBlock(c){
  var info = continuationInfo(c), can = krCan() || (isKrDirectorLike(currentAccount()) && krIsMyCase(c));
  return krCardBox('延续既往面诊：判断有无变动',
    '<div style="font-size:13px;color:var(--slate2);margin-bottom:10px;">相对原诊疗方案，院长判断有无变动？无变动 → 沿用原诊疗方案，IN 直接进入项目确认中；有变动 → 走录入面诊 → 草稿 → 提交新诊疗方案。</div>'+
    (can ? '<div style="display:flex;gap:10px;"><button class="btn-primary" onclick="krJudge(false)">无变动</button><button class="btn-outline" onclick="krJudge(true)">有变动</button></div>' : krEmpty('你的账号不能判断这个案件')));
}
function krJudge(changed){
  var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id); if(!c0 || !(krCan() || (isKrDirectorLike(currentAccount()) && krIsMyCase(c0.c)))) return;
  if(!confirm(changed ? '确认：有变动？之后需要录入面诊并提交新诊疗方案。' : '确认：无变动？将沿用原诊疗方案，IN 直接进入项目确认中。')) return;
  krMut(function(c){ return coreJudgeContinuation(c, changed, ME_NAME); });
}
/* 项目确认中：已提交的诊疗方案和可选范围 + ［补加可选项目］（只增不减；院长不能补加） */
function krAfterBlock(c){
  var items = (c.krScope && c.krScope.items) || [];
  var list = items.length ? items.map(function(it){ return '<div class="case-field-row" style="font-size:13px;"><span style="flex:1;">'+krEsc(it.name)+(it.note?' <span style="color:var(--muted);font-size:11px;">'+krEsc(it.note)+'</span>':'')+krItemMetaHtml(it)+'</span><span style="color:var(--slate2);">'+(it.price!==undefined ? (isLocalProjectName(it.name) ? '' : formatCurrency(it.price,'KRW')) : '')+'</span></div>'; }).join('') : krEmpty('没有可选范围');
  var addable = '';
  if(krCan() && c.stage==='consult' && c.reportReady){ krSubReset(c); addable = krAddCardHtml(c, items); }
  return krCardBox('可选范围（项目确认中）', list+addable);
}
function isLocalProjectName(name){ return PROJECT_LIBRARY.some(function(p){ return p.name===name && p.origin==='IN'; }); }
/* ---------- CMD-1015-05 四：［补加可选项目］展开一张卡片，栏位同发送诊疗方案（推荐在韩时间、麻醉、麻醉备注、所需术后管理）+ 可选共同术后管理（可和已有项目共用）；只能新增不能删除 ---------- */
var KR_ADD = {open:false, tab:'surg', sel:'', note:'', mg:{}, mgq:''}; /* tab：补加的是［施术项目］还是［管理项目］（同发送诊疗方案的表单，CMD-1015-16） */
function krAddReset(){ KR_ADD = {open:KR_ADD.open, tab:'surg', sel:'', note:'', mg:{}, mgq:''}; delete KR_SUB.detail['__add']; }
function krAddSelChg(v){ KR_ADD.sel = v; var p = v.split('|'); if(p[0]==='kr') KR_SUB.detail['__add'] = krDefaultsDetail(p.slice(1).join('|')); else delete KR_SUB.detail['__add']; krRenderCaseDetail(); }
function krAddTab(t){ KR_ADD.tab = t; krRenderCaseDetail(); }
function krAddMgPick(id, on){ var p = krMgLib(id); if(!p) return; var st = krMgState(KR_ADD, id, p); st.on = !!on; krRenderCaseDetail(); }
function krAddMgSet(id, k, v){ var p = krMgLib(id); if(!p) return; krMgState(KR_ADD, id, p)[k] = v; krRenderCaseDetail(); }
function krAddMgSearch(v){ KR_ADD.mgq = v; var el = document.getElementById('kr-mg-add-list'); if(el) el.innerHTML = krMgListHtml(KR_ADD, 'add'); }
function krAddCardHtml(c, items){
  var cand = krScopeCandidates(KR_CASE.clinicId), have = items.map(function(it){ return it.name; });
  var optsArr = cand.kr.filter(function(p){ return have.indexOf(p.name)<0; }).map(function(p){ return ['kr|'+p.name, '赴韩 · '+p.name]; }).concat(cand.postCat.filter(function(p){ return have.indexOf(p.name)<0; }).map(function(p){ return ['in|'+p.name, '术后管理（在印尼）· '+p.name]; }));
  var head = '<div style="margin-top:12px;"><button class="btn-outline" onclick="krAddToggle()">'+(KR_ADD.open ? '收起补加' : '＋ 补加可选项目')+'</button> <span style="font-size:11px;color:var(--muted);">只能新增，不能删除；要拿掉某个项目，请在对话里和 IN 室长商量。</span></div>';
  if(!KR_ADD.open) return head;
  var inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;', q = function(s){ return krEsc(s).replace(/'/g,''); };
  var tab = KR_ADD.tab || 'surg', tb = function(key, label){ return '<button class="'+(tab===key ? 'btn-primary' : 'btn-outline')+'" style="padding:4px 14px;font-size:12px;" onclick="krAddTab(\''+key+'\')">'+label+'</button>'; };
  var body = '<div style="display:flex;gap:8px;margin-bottom:8px;">'+tb('surg','施术项目')+tb('mgmt','管理项目')+'</div>';
  var can = false;
  if(tab==='mgmt'){
    body += '<input placeholder="搜索管理项目" value="'+krEsc(KR_ADD.mgq||'')+'" oninput="krAddMgSearch(this.value)" style="width:100%;box-sizing:border-box;padding:6px 10px;border:1px solid var(--line);border-radius:8px;font-size:12px;margin-bottom:4px;"><div id="kr-mg-add-list">'+krMgListHtml(KR_ADD, 'add')+'</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px;margin-top:8px;"><input placeholder="备注" value="'+krEsc(KR_ADD.note)+'" oninput="KR_ADD.note=this.value" style="'+inp+'min-width:220px;"></div>';
    can = Object.keys(KR_ADD.mg).some(function(id){ return KR_ADD.mg[id].on; });
  } else {
    if(!optsArr.length) body += krEmpty('项目库里的项目都已经在可选范围内了');
    else {
      var selOpts = '<option value="">请选择要补加的项目</option>'+optsArr.map(function(o){ return '<option value="'+q(o[0])+'"'+(KR_ADD.sel===o[0]?' selected':'')+'>'+krEsc(o[1])+'</option>'; }).join('');
      body += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px;"><select onchange="krAddSelChg(this.value)" style="'+inp+'min-width:260px;">'+selOpts+'</select><input placeholder="备注" value="'+krEsc(KR_ADD.note)+'" oninput="KR_ADD.note=this.value" style="'+inp+'min-width:220px;"></div>';
      if(KR_ADD.sel && KR_ADD.sel.split('|')[0]==='kr') body += krProjDetailHtml({name:'__add'}, cand).replace('margin:4px 0 10px 22px;','margin:10px 0;');
    }
    can = !!KR_ADD.sel;
  }
  body += '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn-primary" '+(can ? '' : 'disabled style="opacity:.5;cursor:not-allowed;" ')+'onclick="krAddScope()">补加</button><button class="btn-outline" onclick="krAddToggle()">取消</button></div>';
  return head+'<div style="margin-top:10px;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff;">'+body+'</div>';
}
function krAddScope(){
  if(!krCan()) return; /* 院长不能补加 */
  var cand = krScopeCandidates(KR_CASE.clinicId), newItems = [], bad = '';
  if((KR_ADD.tab||'surg')==='mgmt'){
    Object.keys(KR_ADD.mg).forEach(function(id){ var st = KR_ADD.mg[id]; if(!st.on) return; var p = krMgLib(id); if(!p) return; var mi = krMgScopeItem(p, st, KR_ADD.note); if(!mi) bad = '管理项目「'+p.name+'」是面议项目，请填单价'; else newItems.push(mi); });
    if(!newItems.length && !bad){ alert('请先勾选要补加的管理项目'); return; }
  } else {
    if(!KR_ADD.sel){ alert('请先选择要补加的项目'); return; }
    var parts = KR_ADD.sel.split('|'), kind = parts[0], name = parts.slice(1).join('|');
    var p = (kind==='kr' ? cand.kr : cand.postCat).filter(function(x){ return x.name===name; })[0]; if(!p) return;
    var item = {name:p.name, price:p.price, note:(KR_ADD.note||'').trim()};
    if(kind==='kr'){
      var d = krDet('__add');
      item.stay = (d.stay||'').trim(); item.anesthesia = {type:d.anes, label:KR_ANES[d.anes], note:(d.anesNote||'').trim()};
      item.postcare = d.pc.map(function(x){ var kp = cand.krPost.concat(cand.krLocal||[]).filter(function(o){ return o.name===x.kr; })[0], ip = x.place==='either' ? cand.post.filter(function(o){ return o.name===x.inn; })[0] : null; if(!kp) bad = '「'+name+'」的所需术后管理还有没选项目的行'; return krPcToItem(x, ip); });
    }
    newItems.push(item);
  }
  if(bad){ alert(bad); return; }
  krMut(function(c){ var ok = false; newItems.forEach(function(it){ if(coreAddScopeItem(c, it, ME_NAME)) ok = true; }); return ok; });
  KR_ADD = {open:false, tab:'surg', sel:'', note:'', mg:{}, mgq:''}; delete KR_SUB.detail['__add'];
  Store.touch(); krRenderCaseDetail();
}
function krAddToggle(){ KR_ADD.open = !KR_ADD.open; if(!KR_ADD.open) krAddReset(); krRenderCaseDetail(); }


/* ---------- 四、项目进程（在韩 timeline 与子项，KR-CASE-02 第 4 节） ---------- */
/* 项目进程（CMD-1008-12 D4 / D5；KR-CASE-02 2026-10-08 修订）：按日期一行一件，每行 日期 / 类型 / 内容 / 状态 / 地点；新增入口在列表下方，只有两种：
   a. 术后管理记录（免费，日期 + memo；复诊、拆线、消肿都属此类）b. 增加项目（从 KR 项目库选，需结账；睡眠 / 全麻须勾已在现场签署麻醉同意书）。施术那一行由案件自动产生 */
var KR_SUB_NEW = {type:'care', date:'', content:'', place:'KR', projectName:'', date2:''};
function krSubNewSet(k, v){ if(k==='type' && v==='local') v = 'add'; KR_SUB_NEW[k] = v; if(k==='type') krRenderCaseDetail(); }
function krProgressMemoSave(v){ if(!krCan()) return; krMut(function(c){ c.krProgressMemo = String(v||'').trim(); logCaseEvent(c, ME_NAME, '项目进程 memo：'+(c.krProgressMemo || '（清空）')); return true; }); }
/* 术后管理一行的完成区：到当天 +［客人已到］才能［标记完成］；未到当天灰 +［模拟到当日］（仅原型）。act(fn, id) 生成 onclick，客人详情里会改成带案件的版本 */
function krCareActHtml(s, act){
  act = act || function(fn, id){ return fn+'(\''+id+'\')'; };
  var reached = s.simDay || !s.date || s.date <= todayStr();
  if(!reached) return '<button class="btn-primary" disabled title="未到当天，不能标完成" style="padding:3px 10px;font-size:12px;opacity:.4;cursor:not-allowed;">标记完成</button> <span style="font-size:11px;color:var(--muted);">未到当天</span> <a href="#" onclick="'+act('krSubSim', s.id)+';return false;" title="仅原型：视为已到那天" style="font-size:11px;">模拟到当日</a>';
  if(!s.arrived) return '<button class="btn-outline" style="padding:3px 10px;font-size:12px;" onclick="'+act('krSubArrived', s.id)+'">客人已到店</button>';
  return '<button class="btn-primary" style="padding:3px 10px;font-size:12px;" onclick="'+act('krHoldSubDone', s.id)+'">标记完成</button>';
}
function krSubArrived(id){ if(!krCan()) return; krMut(function(c){ return coreSubArrived(c, id, ME_NAME); }); }
var KR_HOLD_TAG = '<span class="status-pill" style="background:#E8F0FB;color:#2F5FA8;font-size:10px;">在韩后续进行中</span>';
/* 在韩持有两张卡：mode 'care' = 术后管理（有预约日期的子项，到当天 + 客人已到才能标完成）；mode 'items' = 持有项目（已付的管理项目，只列项目 + 剩余次数，［安排使用］选日期时间，客人到后标完成）（CMD-1013-12 二·3、4） */
function krHoldCard(c, mode){
  var can = krCan(), subs = (c.subItems||[]).filter(function(s){ return s.hold && !s.done; }), items = (c.procedureItems||[]).filter(function(it){ return it.heldOver && !it.holdDone; });
  if(mode==='items'){
    if(!items.length) return '';
    var rows = items.map(function(it){ var left = holdItemLeft(c, it), pl = holdItemPlanned(c, it);
      return '<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--border2);font-size:13px;"><span style="flex:1;">'+krEsc(it.name)+'</span><span style="color:var(--slate2);">剩余 '+left+' 次'+(pl ? '（已安排 '+pl+' 次）' : '')+'</span>'+(left-pl>0 ? (can && !c.visitClosed && c.krBalancePaid ? '<button class="btn-primary" style="padding:3px 12px;font-size:12px;" onclick="krMgmtUse(\''+krEsc(it.name).replace(/'/g,'')+'\')">使用</button><button class="btn-outline" style="padding:3px 12px;font-size:12px;" onclick="krHuOpen(\''+KR_CASE.clinicId+'\',\''+c.id+'\',\''+krEsc(it.name).replace(/'/g,'')+'\')">预约后续到院</button>' : '<span style="font-size:11px;color:var(--muted);">要使用请由 IN 预约（在韩管理）</span>') : '')+'</div>'; }).join('');
    return krCardBox('持有管理项目 <span style="font-weight:400;font-size:11px;color:var(--muted);">付费管理项目付清尾款后就是在韩持有：当天做按［使用］扣一次；之后再来做先［预约后续到院］，到院后在子案件里［使用］；结案后剩下的由 IN 占位开在韩管理新案件</span>', rows);
  }
  if(!subs.length) return '';
  var rows2 = subs.map(function(s){ return '<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--border2);font-size:13px;flex-wrap:wrap;"><span style="width:150px;">'+krEsc((s.date||'')+(s.time ? ' '+s.time : ''))+'</span><span style="flex:1;min-width:160px;">'+krEsc(s.content)+(s.note ? '<div style="font-size:11px;color:var(--slate2);">备注：'+krEsc(s.note)+'</div>' : '')+'</span>'+
    (can ? krCareActHtml(s)+'<a href="#" onclick="krSubNote(\''+s.id+'\');return false;" style="font-size:12px;">'+(s.note?'改备注':'备注')+'</a><a href="#" onclick="krSubTimeOpen(\''+s.id+'\');return false;" style="font-size:12px;">改时间</a>' : '')+'</div>'; }).join('');
  return krCardBox('术后管理（在韩持有） <span style="font-weight:400;font-size:11px;color:var(--muted);">案件已结案；到当天 +［客人已到］才能标完成，记录写回本案件 Timeline</span>', rows2);
}
var KR_HU = null;
function krHuOpen(clinicId, caseId, name){ KR_CASE = {clinicId:clinicId, id:caseId, tab:'items'}; KR_HU = {name:name, date:todayStr(), time:'10:00'}; krHuRender(); }
function krHuRender(){
  var ov = document.getElementById('kr-hu-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'kr-hu-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var c = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
  ov.innerHTML = '<div class="modal-box" style="width:460px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b>预约后续到院：'+krEsc(KR_HU.name)+'</b><span style="cursor:pointer;" onclick="document.getElementById(\'kr-hu-overlay\').classList.remove(\'open\')">✕</span></div>'+
    '<div style="display:flex;gap:8px;margin-bottom:10px;"><input type="date" value="'+KR_HU.date+'" min="'+todayStr()+'" onchange="KR_HU.date=this.value;krHuRender()" style="'+inp+'"><select onchange="KR_HU.time=this.value" style="'+inp+'">'+krTimeOptions(KR_HU.time)+'</select></div>'+
    '<div style="font-size:12px;color:var(--slate2);margin-bottom:6px;">'+krEsc(c.director||'—')+' '+krEsc(KR_HU.date)+' 当天的日程</div>'+krDayAgendaHtml(c.director, KR_HU.date)+
    '<div style="display:flex;gap:8px;margin-top:14px;"><button class="btn-primary" style="flex:1;" onclick="krHuSave()">确认安排</button><button class="btn-ghost" style="flex:1;" onclick="document.getElementById(\'kr-hu-overlay\').classList.remove(\'open\')">取消</button></div></div>';
  ov.classList.add('open');
}
function krHuSave(){
  if(!KR_HU || !krCan()) return; var name = KR_HU.name, dd = KR_HU.date, tm = KR_HU.time, c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id).c;
  var er = krSurgerySlotError(krHospitalIdOfMe(), c0.director, dd, tm, 30, KR_CASE.clinicId+':'+KR_CASE.id, {allowOffHours:true, use:true}); if(er){ krBlock(er); return; }
  var go = function(){ document.getElementById('kr-hu-overlay').classList.remove('open'); krMut(function(c){ return coreHoldUseSchedule(c, name, dd, tm, ME_NAME); }); };
  var off = krOffHoursText(krHospitalIdOfMe(), dd, tm, 30); if(off) krOffConfirm(off+'（'+dd+' '+tm+'，韩国时间）', go); else go();
}
function krMgmtUse(name){ if(!krCan()) return; krMut(function(c){ return coreMgmtUse(c, name, ME_NAME); }); }
function krTodayDoneOne(id){ if(!krCan()) return; krMut(function(c){ return coreTodayDone(c, [id], ME_NAME); }); }
function krHoldSubDone(id){ if(!krCan()) return; krMut(function(c){ return coreSubDone(c, id, ME_NAME, []); }); }
function krHoldItemDone(name){ if(!krCan()) return; krMut(function(c){ return coreHoldItemDone(c, name, ME_NAME); }); }
/* 改时间（术后管理记录 / 在韩持有）：日期 + 时间，选到午休 / 营业时间外弹确认，并显示该院长新日期当天的日程（CMD-1013-08 一·4、三·2） */
var KR_TE = null;
function krSubTimeOpen(id){
  var c = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, s = (c.subItems||[]).filter(function(x){ return x.id===id; })[0]; if(!s || s.done || !krCan()) return;
  KR_TE = {id:id, date:s.date||krToday(), time:s.time||'10:00'}; krTimeEditRender();
}
function krTimeEditRender(){
  var ov = document.getElementById('kr-te-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'kr-te-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var c = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
  ov.innerHTML = '<div class="modal-box" style="width:460px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b>改时间</b><span style="cursor:pointer;" onclick="document.getElementById(\'kr-te-overlay\').classList.remove(\'open\')">✕</span></div>'+
    '<div style="display:flex;gap:8px;margin-bottom:10px;"><input type="date" value="'+KR_TE.date+'" min="'+krToday()+'" onchange="KR_TE.date=this.value;krTimeEditRender()" style="'+inp+'"><select onchange="KR_TE.time=this.value" style="'+inp+'">'+krTimeOptions(KR_TE.time)+'</select></div>'+
    '<div style="font-size:12px;color:var(--slate2);margin-bottom:6px;">'+krEsc(c.director||'—')+' '+krEsc(KR_TE.date)+' 当天的日程</div>'+krDayAgendaHtml(c.director, KR_TE.date)+
    '<div style="display:flex;gap:8px;margin-top:14px;"><button class="btn-primary" style="flex:1;" onclick="krTimeEditSave()">确认</button><button class="btn-outline" onclick="document.getElementById(\'kr-te-overlay\').classList.remove(\'open\')">取消</button></div></div>';
  ov.classList.add('open');
}
function krTimeEditSave(){
  if(!KR_TE || !krCan()) return; var id = KR_TE.id, d = KR_TE.date, t0 = KR_TE.time;
  var c9 = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, s9 = (c9.subItems||[]).filter(function(x){ return x.id===id; })[0];
  if(s9 && s9.director){ var e9 = krSurgerySlotError(krHospitalIdOfMe(), s9.director, d, t0, 30, KR_CASE.clinicId+':'+KR_CASE.id, {allowOffHours:true, use:true, exceptRowId:id}); if(e9){ krBlock(e9); return; } }
  var go = function(){ document.getElementById('kr-te-overlay').classList.remove('open'); krMut(function(c){ return coreSubTimeEdit(c, id, d, t0, ME_NAME); }); };
  var off = krOffHoursText(krHospitalIdOfMe(), d, t0, 30); if(off) krOffConfirm(off+'（'+d+' '+t0+'，韩国时间）', go); else go();
}
/* 当天日程（KR-SCHD）：按时间排序，每行写类型——营业时间外 / 午休 / 不可预约（手动）/ 面诊·客人 / 施术·客人 / 术后管理·客人（CMD-1013-08 五·2） */
function krDayAgendaHtml(director, date){
  var hid = krHospitalIdOfMe(), h = HOSPITAL_DATA[hid] || {}, hr = hospitalHours(hid), lu = hospitalLunch(hid), rows = [];
  if(hospitalClosedOn(hid, date)) return '<div style="font-size:12px;color:#C1454A;">医院休诊日</div>';
  rows.push({a:'00:00', b:hr.open, tag:'营业时间外'}); rows.push({a:hr.close, b:'24:00', tag:'营业时间外'});
  if(lu) rows.push({a:lu.from, b:lu.to, tag:'午休'});
  var cf = hospitalClosedFrom(hid, date); if(cf) rows.push({a:cf, b:hr.close, tag:'医院休诊'});
  var cb1 = hospitalClosedBefore(hid, date); if(cb1) rows.push({a:hr.open, b:cb1, tag:'医院休诊'});
  ((h.offs||[]).filter(function(o){ return o.kind==='director' && o.who===director && offApplies(o, date); })).forEach(function(o){ var rg = (o.part && o.part!=='全天') ? krHalfRange(hid, o.part) : [hr.open, hr.close]; rows.push({a:rg[0], b:rg[1], tag:'OFF（'+(o.part||'全天')+'）'}); });
  ((h.directorSchedule||{})[director]||[]).filter(function(b){ return b.date===date; }).forEach(function(b){ rows.push({a:b.time, b:b.end, tag:(function(){ var ty = b.type||b.kind; return (ty==='施术' || ty==='面诊') ? ty+'·'+(b.name||'客人') : '不可预约（手动）'; })()}); });
  /* 术后管理（在韩子项，带时间）：来自所有对接诊所的案件 */
  krClinics().forEach(function(cl){ var v = Store.readClinic(cl.id) || {}; (v.CASE_ITEMS||[]).forEach(function(cs){ if(cs.hospitalId!==hid || cs.director!==director) return; (cs.subItems||[]).forEach(function(s){ if(s.kind!=='施术' && s.date===date && s.time && !s.done && s.place==='KR') rows.push({a:s.time, b:minToTime(timeToMin(s.time)+30), tag:'术后管理·'+cs.name}); }); }); });
  rows.sort(function(x, y){ return timeToMin(x.a) - timeToMin(y.a); });
  rows = rows.filter(function(r){ return timeToMin(r.b) > timeToMin(r.a); });
  return rows.length ? rows.map(function(r){ return '<div style="font-size:12px;display:flex;gap:10px;padding:2px 0;"><span style="width:110px;color:var(--slate2);">'+krEsc(r.a+'～'+r.b)+'</span><span style="color:'+(/^(营业时间外|午休|医院休诊)/.test(r.tag) ? 'var(--muted)' : '#C1454A')+';">'+krEsc(r.tag)+'</span></div>'; }).join('') : '<div style="font-size:12px;color:var(--sage);">当天没有安排</div>';
}
function krProgressBlock(c){
  if(!c.settlementDone || !krAllItems(c).length) return krCardBox('项目进程', krEmpty('付定金后，KR 室长在这里整理项目进程（施术一行会在施术时间确认后自动产生）'));
  var can = krCan(), inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;';
  var todayMode = true, paidOk = !!c.krBalancePaid, tk = todayStr();
  var mkRow = function(s){ /* 日期早→晚排序（CMD-1013-08 三·1） */
    var kind = subKindLabel(s.kind), editable = false;
    var ops = '', stBtn = '';
    var isCare = s.kind==='术后管理记录';
    if(isCare && can && !s.done && paidOk) stBtn = krCareActHtml(s);
    /* CMD-1014-18 四·4：拿掉［通知 IN 室长预约］，回印尼的术后管理照旧进客人持有，由 IN 按持有项目预约 */
    if(s.kind==='增加项目' && !s.done && krCanFix()){ var pi = (c.procedureItems||[]).findIndex(function(x){ return x.origin==='KR' && x.pendingPay && x.name===s.projectName && !x.cancelled; }); if(pi>-1) ops += '<a href="#" onclick="krFixOpen('+pi+');return false;" style="font-size:12px;margin-right:6px;color:#B3261E;">修正</a>'; } /* 只有待付款项目有［修正］ */
    if(can && (s.kind==='施术' || kind==='术后管理记录')) ops += '<a href="#" onclick="krSubNote(\''+s.id+'\');return false;" style="font-size:12px;margin-right:6px;">'+(s.note?'改备注':'备注')+'</a>'; /* 术后管理行：［备注］+［改时间］，不再有［删除］（CMD-1013-08 三·2） */
    if(can && !s.done && kind==='术后管理记录') ops += '<a href="#" onclick="krSubTimeOpen(\''+s.id+'\');return false;" style="font-size:12px;">改时间</a>';
    var cells = {ops:ops, done:stBtn};
    if(s.kind!=='术后管理记录' && !s.done && can && paidOk) cells.date = '<label style="display:flex;gap:6px;align-items:center;cursor:pointer;"><input type="checkbox" class="kr-td-chk" value="'+s.id+'"> '+krEsc(s.date||'')+'</label>';
    if(editable){
      cells.date = '<input type="date" value="'+s.date+'" onchange="krSubEdit(\''+s.id+'\',\'date\',this.value)" style="'+inp+'width:100%;">';
      cells.content = '<input value="'+krEsc(s.content)+'" onchange="krSubEdit(\''+s.id+'\',\'content\',this.value)" style="'+inp+'width:100%;box-sizing:border-box;">';
    }
    var done = '';
    var row = subItemRowHtml(s, cells);
    return row+done+(s.done && s.doneItems && s.doneItems.length ? '<div style="font-size:11px;color:var(--muted);margin:-2px 0 4px 104px;">完成项目：'+krEsc(s.doneItems.join('、'))+'</div>' : '');
  };
  var sortSubs = function(a, b){ return (a.date||'').localeCompare(b.date||'') || (a.time||'').localeCompare(b.time||'') || a.no.localeCompare(b.no); };
  var todaySubs = (c.subItems||[]).filter(function(s){ return s.kind!=='术后管理记录'; }).sort(sortSubs), careSubs = (c.subItems||[]).filter(function(s){ return s.kind==='术后管理记录' && !s.hold; }).sort(sortSubs);
  var mainSubs = (c.subItems||[]).filter(function(s){ return s.kind!=='术后管理记录' && !s.visitKey; }).sort(sortSubs);
  var heldRows = (c.procedureItems||[]).filter(function(it){ return it.heldOver && !it.holdDone; }).map(function(it){ var left = holdItemLeft(c, it), pl = holdItemPlanned(c, it), okUse = can && !c.visitClosed && c.krBalancePaid && left-pl>0;
    return '<div style="display:grid;grid-template-columns:'+KR_TBL_COLS+';gap:8px;align-items:center;padding:7px 0;border-top:1px solid var(--border2);font-size:12px;"><span>—</span><span>'+krTypeTag('管理项目')+'</span><span style="font-size:13px;">'+krEsc(it.name)+'</span><span style="color:var(--slate2);font-weight:600;">剩余 '+left+' 次</span><span>韩国</span><span>—</span><span style="color:var(--slate2);">'+(pl ? '已安排 '+pl+' 次' : '—')+'</span><span style="text-align:right;white-space:nowrap;">'+(okUse ? '<button class="btn-primary" style="padding:3px 10px;font-size:12px;" onclick="krMgmtUse(\''+krEsc(it.name).replace(/'/g,'')+'\')">使用</button> <a href="#" onclick="krHuOpen(\''+KR_CASE.clinicId+'\',\''+c.id+'\',\''+krEsc(it.name).replace(/'/g,'')+'\');return false;" style="font-size:12px;">预约后续到院</a>' : '')+'</span></div>'; }).join('');
  var add = '';
  if(can || c.krProgressMemo){ /* 拿掉「新增术后管理记录（免费）」，该位置改「项目进程 memo」（KR 写，IN 只读；CMD-1013-08 三·3） */
    add = '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border2);"><div style="font-size:12px;font-weight:700;margin-bottom:6px;">项目进程 memo</div>'+(can ? '<textarea onchange="krProgressMemoSave(this.value)" placeholder="例如：客人术后住宿安排、复诊提醒…（KR 写，IN 只读）" style="width:100%;min-height:60px;padding:8px;border:1px solid var(--line);border-radius:8px;box-sizing:border-box;font-size:12px;">'+krEsc(c.krProgressMemo||'')+'</textarea>' : '<div style="font-size:12px;color:var(--slate2);white-space:pre-wrap;">'+krEsc(c.krProgressMemo||'')+'</div>')+'</div>';
  }
  var mainState = c.krProcedureDone ? 'done' : (c.hasArrived ? 'arrived' : 'pending');
  var tbl = (mainSubs.length || heldRows) ? krTblWrap(krTblHead()+mainSubs.map(function(s){ return krTblRow(c, s, {can:can, canDone:can && paidOk && !c.visitClosed, doneFn:'krTodayDoneOne'}); }).join('')+heldRows) : krEmpty('施术一行会在施术时间确认后自动产生；增加项目在下方「增加项目」卡新增');
  var todayCard = krCardBox('主案件 · '+krEsc(c.caseNo||'')+' '+krTblState({pending:'待到院', arrived:'已到院', done:'已完成'}[mainState], mainState)+' <span style="font-weight:400;font-size:11px;color:var(--muted);">施术当天：施术 + 在韩增加 + 管理项目使用，一行一个</span>', tbl+add);
  return '<div id="kr-maincard">'+todayCard+'</div>'+krHoldCard(c, 'care'); /* CMD-1015-17：术后管理在下面的子案件卡片里（每次到院一个） */
}
/* 在韩预约到店弹窗（日历点事件）：客人 / 项目 / 时间 +［客人已到店］；状态存在子项 s.arrived 上，日历 / 工作台 / 客人详情 / 案件页四处同步（CMD-1013-13 三） */
function krVisitPop(clinicId, caseId, subId){
  var r = krFindCase(clinicId, caseId); if(!r) return; var s = (r.c.subItems||[]).filter(function(x){ return x.id===subId; })[0]; if(!s) return;
  var ov = document.getElementById('kr-visit-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'kr-visit-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var reached = s.simDay || !s.date || s.date <= todayStr(), can = krCan();
  var act = !can ? '' : (s.done ? '<span style="color:var(--sage);font-size:13px;">已完成</span>' : s.arrived ? '<span style="color:var(--sage);font-size:13px;font-weight:700;">✓ 客人已到店</span>（到店后在客人详情 / 案件页标记完成）' : reached ? '<button class="btn-primary" onclick="krVisitArrive(\''+clinicId+'\',\''+caseId+'\',\''+subId+'\')">客人已到店</button>' : '<button class="btn-primary" disabled style="opacity:.4;cursor:not-allowed;">客人已到店</button> <span style="font-size:11px;color:var(--muted);">未到当天</span> <a href="#" onclick="krCliAct(\'krSubSim\',\''+clinicId+'\',\''+caseId+'\',\''+subId+'\');krVisitPop(\''+clinicId+'\',\''+caseId+'\',\''+subId+'\');return false;" style="font-size:11px;">模拟到当日</a>');
  ov.innerHTML = '<div class="modal-box" style="width:400px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b>'+(s.holdUseOf ? '持有项目使用' : '术后管理预约')+'</b><span style="cursor:pointer;" onclick="document.getElementById(\'kr-visit-overlay\').classList.remove(\'open\')">✕</span></div>'+
    krKV('客人', krEsc(r.name)+' <span style="color:var(--muted);font-size:12px;">'+krEsc(r.caseNo)+' · '+krEsc(r.clinicName)+'</span>')+krKV('项目', krEsc(s.content))+krKV('时间', krEsc((s.date||'')+(s.time ? ' '+s.time : ''))+'（韩国时间）')+krKV('院长', krEsc(r.director||'—'))+
    '<div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">'+act+'<button class="btn-ghost" onclick="document.getElementById(\'kr-visit-overlay\').classList.remove(\'open\');krShowCase(\''+clinicId+'\',\''+caseId+'\')">打开案件</button></div></div>';
  ov.classList.add('open');
}
function krVisitArrive(clinicId, caseId, subId){ document.getElementById('kr-visit-overlay').classList.remove('open'); krCliAct('krSubArrived', clinicId, caseId, subId); }
/* 今天要来的在韩预约（术后管理 / 持有使用，KR 韩国时间今天、还没完成） */
function krTodayVisits(c){ return (c.subItems||[]).filter(function(s){ return s.kind==='术后管理记录' && s.place==='KR' && s.date===todayStr() && !s.done; }); }
/* ======== 子案件（CMD-1013-14 二）======== */
/* ======== 子案件（CMD-1015-17）：不再是单独页面——施术当天就是主案件的施术 tab；-1 / -2 在子案件卡片里点开展开 ======== */
var KR_SUBV = {edit:false}, KR_SUB_OPEN = {};
function krOpenSub(clinicId, caseId, subId){ krOpenSubCard(clinicId, caseId, subId); } /* 旧入口（通知 / 医院设定冲突弹窗）都进施术 tab 并展开对应那次 */
function krOpenSurgSub(clinicId, caseId){ krOpenSubCard(clinicId, caseId, ''); }
function krSubToggle(key){ KR_SUB_OPEN[key] = !KR_SUB_OPEN[key]; krRenderCaseDetail(); }
function krSubRowBtns(c, s, can){
  if(s.done || !can) return '';
  if(s.place==='IN') return '';
  var act = krCareActHtml(s).replace('标记完成', s.holdUseOf ? '使用' : '标记完成'); /* 管理项目使用行：到店后按［使用］扣一次 */
  return act+'<a href="#" onclick="krSubNote(\''+s.id+'\');return false;" style="font-size:12px;margin-left:8px;">'+(s.note?'改备注':'备注')+'</a>'+(s.arrived ? '' : '<a href="#" onclick="krSubTimeOpen(\''+s.id+'\');return false;" style="font-size:12px;margin-left:8px;">改时间</a>');
}
/* ============ 案件卡统一表格（CMD-1015-19）：主案件 / 子案件同一张表 时间｜类型｜内容｜状态｜地点｜完成时间｜备注 ============ */
var KR_TBL_COLS = '84px 72px minmax(150px,1.6fr) 74px 42px 78px minmax(60px,1fr) 118px';
var KR_TYPE_STYLE = {'施术':['#E8F0FB','#2F5FA8'], '术后管理':['var(--sage-bg)','var(--sage)'], '管理项目':['#FFF1D6','#C26A1B']};
function krTblWrap(h){ return '<div style="overflow-x:auto;"><div style="min-width:720px;">'+h+'</div></div>'; }
function krTblHead(){ return '<div style="display:grid;grid-template-columns:'+KR_TBL_COLS+';gap:8px;font-size:11px;color:var(--muted);padding:4px 0;border-bottom:1px solid var(--border2);"><span>时间</span><span>项目类型</span><span>内容</span><span>状态</span><span>地点</span><span>完成时间</span><span>备注</span><span></span></div>'; }
function krTypeTag(t){ var st = KR_TYPE_STYLE[t] || KR_TYPE_STYLE['术后管理']; return '<span class="status-pill" style="background:'+st[0]+';color:'+st[1]+';font-size:11px;">'+t+'</span>'; }
function krRowType(c, s){
  if(s.kind==='施术' || s.surgUse) return '施术';
  if(s.holdUseOf) return '管理项目';
  if(s.kind==='增加项目'){ var it = (c.procedureItems||[]).filter(function(x){ return x.name===s.projectName; })[0]; return (it && (it.mgmtPlan || isLocalKrItem(it) || it.service)) ? '管理项目' : '施术'; }
  return '术后管理';
}
function krShortDt(date, time){ return date ? String(date).slice(2)+(time ? ' '+time : '') : '—'; }
/* 一行：s = 子项；o = {can, canDone, doneFn, extra(行尾额外按钮), checkbox} */
function krTblRow(c, s, o){
  var ks = c.krSchedule || {}, type = krRowType(c, s), time = s.kind==='施术' ? (s.date||ks.confirmedDate)+' '+(ks.confirmedTime||'') : krShortDt(s.date, s.time||s.visitTime).replace(/^/, '');
  var tm = s.kind==='施术' ? krShortDt(s.date||ks.confirmedDate, ks.confirmedTime) : krShortDt(s.date, s.time||s.visitTime);
  var pend = s.kind==='增加项目' && (c.procedureItems||[]).some(function(x){ return x.pendingPay && x.name===s.projectName && !x.cancelled; });
  var stText = s.done ? '已完成' : pend ? '待付款' : (s.arrived ? '已到店' : '待做'), stColor = s.done ? 'var(--sage)' : pend ? '#B3261E' : 'var(--slate2)';
  var ops = '', doneBtn = (o.can && !s.done && !pend && o.canDone) ? '<br><button class="btn-primary" style="padding:2px 10px;font-size:11px;margin-top:3px;" onclick="'+o.doneFn+'(\''+s.id+'\')">已完成</button>' : '';
  if(o.can){
    if(s.kind==='增加项目' && !s.done && krCanFix()){ var pi = (c.procedureItems||[]).findIndex(function(x){ return x.origin==='KR' && x.pendingPay && x.name===s.projectName && !x.cancelled; }); if(pi>-1) ops += '<a href="#" onclick="krFixOpen('+pi+');return false;" style="font-size:12px;margin-right:6px;color:#B3261E;">修正</a>'; }
    if(!s.done && s.kind==='术后管理记录' && !s.arrived && !s.holdUseOf) ops += '<a href="#" onclick="krSubTimeOpen(\''+s.id+'\');return false;" style="font-size:12px;margin-right:6px;">改时间</a>';
    if(o.cancel && !s.done && (s.kind==='术后管理记录' || (s.kind==='增加项目' && s.visitKey))) ops += '<a href="#" onclick="krRowCancel(\''+s.id+'\');return false;" style="font-size:12px;margin-right:6px;">取消本次</a>';
    if(s.kind==='施术' || s.kind==='术后管理记录') ops += '<a href="#" onclick="krSubNote(\''+s.id+'\');return false;" style="font-size:12px;">'+(s.note?'改备注':'备注')+'</a>';
  }
  if(o.extra) ops += o.extra;
  var note = (s.note ? krEsc(s.note) : '')+(s.earlyReason ? ' <span style="color:#C26A1B;">（提前做：'+krEsc(s.earlyReason)+'）</span>' : '');
  return '<div style="display:grid;grid-template-columns:'+KR_TBL_COLS+';gap:8px;align-items:center;padding:7px 0;border-top:1px solid var(--border2);font-size:12px;"><span>'+krEsc(tm)+'</span><span>'+krTypeTag(type)+'</span><span style="font-size:13px;">'+krEsc(s.content)+'</span><span style="color:'+stColor+';font-weight:600;">'+stText+doneBtn+'</span><span>'+(s.place==='IN' ? '印尼' : '韩国')+'</span><span style="color:var(--slate2);">'+(s.done && s.doneAt ? krEsc(fmtUtc(s.doneAt).slice(5)) : '—')+'</span><span style="color:var(--slate2);">'+(note || '—')+'</span><span style="text-align:right;white-space:nowrap;">'+ops+'</span></div>';
}
function krTblState(txt, tone){ var st = {done:['var(--sage-bg)','var(--sage)'], arrived:['#E8F0FB','#2F5FA8'], pending:['var(--border2)','var(--slate2)']}[tone] || ['var(--border2)','var(--slate2)']; return '<span class="status-pill" style="background:'+st[0]+';color:'+st[1]+';">'+txt+'</span>'; }
/* 预约使用 / 预约时间 对话框（项目卡）：日期 + 时间（+ 施术选院长；术后管理可选韩国 / 印尼）→ 按日期建立 / 并入子案件 */
var KR_BKD = null;
function krBkdOpen(mode, name, pcIdx, reuseId){
  if(!krCan()) return; var c = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, it = (c.procedureItems||[]).filter(function(x){ return x.name===name; })[0]; if(!it) return;
  var x = mode==='care' ? (it.postcare||[])[pcIdx] : null, place = mode==='care' ? (x && x.place==='KR' ? 'KR' : (x && x.innName && x.place==='IN' ? 'IN' : 'KR')) : 'KR';
  KR_BKD = {mode:mode, name:name, pcIdx:pcIdx, reuseId:reuseId||'', place:place, either:mode==='care' && x && x.place==='either' && !!x.innName, date:todayStr(), time:'10:00', dir:c.director||'', surg:mode==='use' && !krIsMgmtItemC(it)};
  krBkdRender();
}
function krBkdRender(){
  var ov = document.getElementById('kr-bkd-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'kr-bkd-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var c = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, B = KR_BKD, inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
  var dirs = (typeof krcDirectors==='function') ? krcDirectors() : [c.director];
  ov.innerHTML = '<div class="modal-box" style="width:480px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b>'+(B.mode==='care' ? '预约时间' : '预约使用')+'：'+krEsc(B.name)+'</b><span style="cursor:pointer;" onclick="document.getElementById(\'kr-bkd-overlay\').classList.remove(\'open\')">✕</span></div>'+
    (B.either ? '<div style="margin-bottom:8px;font-size:13px;"><label><input type="radio" name="bkd-place" '+(B.place==='KR'?'checked':'')+' onchange="KR_BKD.place=\'KR\';krBkdRender()"> 在韩国做</label>　<label><input type="radio" name="bkd-place" '+(B.place==='IN'?'checked':'')+' onchange="KR_BKD.place=\'IN\';krBkdRender()"> 回印尼做（只记建议日期）</label></div>' : '')+
    '<div style="display:flex;gap:8px;margin-bottom:10px;"><input type="date" value="'+B.date+'" min="'+todayStr()+'" onchange="KR_BKD.date=this.value;krBkdRender()" style="'+inp+'">'+(B.place==='IN' ? '' : '<select onchange="KR_BKD.time=this.value" style="'+inp+'">'+krTimeOptions(B.time)+'</select>')+(B.surg ? '<select onchange="KR_BKD.dir=this.value" style="'+inp+'">'+dirs.map(function(n){ return '<option'+(n===B.dir?' selected':'')+'>'+krEsc(n)+'</option>'; }).join('')+'</select>' : '')+'</div>'+
    (B.place==='IN' ? '' : '<div style="font-size:12px;color:var(--slate2);margin-bottom:6px;">'+krEsc(B.dir||c.director||'—')+' '+krEsc(B.date)+' 当天的日程</div>'+krDayAgendaHtml(B.dir||c.director, B.date))+
    '<div style="display:flex;gap:8px;margin-top:14px;"><button class="btn-primary" style="flex:1;" onclick="krBkdSave()">确认预约</button><button class="btn-ghost" style="flex:1;" onclick="document.getElementById(\'kr-bkd-overlay\').classList.remove(\'open\')">取消</button></div></div>';
  ov.classList.add('open');
}
function krBkdSave(){
  var B = KR_BKD; if(!B || !krCan()) return; var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id).c;
  var go = function(){ document.getElementById('kr-bkd-overlay').classList.remove('open'); krMut(function(c){ var ok = B.mode==='care' ? coreCareBook(c, B.name, B.pcIdx, B.date, B.time, B.place, B.reuseId, ME_NAME) : coreUnitBookUse(c, B.name, B.date, B.time, ME_NAME, B.surg ? B.dir : ''); if(!ok) alert('没有预约成功（项目状态已变化？）'); return ok; }); };
  if(B.place==='IN'){ go(); return; }
  var er = krSurgerySlotError(krHospitalIdOfMe(), B.dir||c0.director, B.date, B.time, 30, KR_CASE.clinicId+':'+KR_CASE.id, {allowOffHours:true, use:true}); if(er){ krBlock(er); return; }
  var off = krOffHoursText(krHospitalIdOfMe(), B.date, B.time, 30); if(off) krOffConfirm(off+'（'+B.date+' '+B.time+'，韩国时间）', go); else go();
}
function krRowCancel(id){ if(!krCan() || !confirm('取消这一次？项目会退回项目卡（术后管理 = 未预约，其余 = 未使用）')) return; krMut(function(c){ return coreRowCancel(c, id, ME_NAME); }); }
function krSubVisitArrive(key){ if(!krCan()) return; krMut(function(c){ return coreVisitArrive(c, key, ME_NAME); }); }
function krSubVisitSim(key){ if(!krCan()) return; krMut(function(c){ return coreVisitSim(c, key, ME_NAME); }); }
function krSubCasesCard(c){
  subCaseNos(c);
  var can = krCan(), list = subCaseList(c), pendIn = carePendingRows(c).filter(function(s){ return s.place==='IN'; });
  if(!list.length && !pendIn.length) return '';
  var rows = list.map(function(rep){
    var key = subCaseKey(rep), skey = key.replace(/'/g,''), grp = subCaseRows(c, rep), extra = coreVisitExtra(c, key), vs = coreVisitState(c, key), src = visitSource(c, key);
    var open = !!KR_SUB_OPEN[key] || KR_SUB_HL===rep.id || (vs==='arrived' && KR_SUB_OPEN[key]!==false);
    var head = '<div id="kr-subrow-'+rep.id+'" class="case-row-click case-field-row'+(KR_SUB_HL===rep.id ? ' kr-sub-hl' : '')+'" style="cursor:pointer;" onclick="krSubToggle(\''+skey+'\')"><span style="width:20px;">'+(open ? '▾' : '▸')+'</span><span style="width:96px;font-weight:700;">'+krEsc(rep.dno||'')+'</span><span style="width:130px;font-size:12px;color:var(--slate2);">'+krEsc(krShortDt(rep.date, rep.time))+'</span><span style="flex:1;font-size:13px;">'+krEsc(grp.concat(extra).map(function(s){ return s.content; }).join('；'))+'</span>'+'<span class="status-pill" style="background:#F3EFE7;color:var(--slate2);margin-right:6px;" title="预约来源">预约来源：'+src+'</span>'+krTblState({pending:'待到店', arrived:'已到店', done:'已完成'}[vs], vs)+'</div>';
    var body = '';
    if(open){
      var reached = grp.every(function(s){ return s.simDay || !s.date || s.date <= todayStr(); }), tblRows;
      var canDone = can && vs!=='pending', doneFn = 'krHoldSubDone';
      var all = grp.concat(extra).sort(function(a, b){ return (a.time||'').localeCompare(b.time||'') || String(a.no).localeCompare(String(b.no)); });
      var bar = '';
      if(vs==='pending' && can) bar = '<div style="display:flex;gap:10px;align-items:center;margin:8px 0;">'+(reached ? '<button class="btn-primary" style="padding:4px 16px;font-size:12px;" onclick="krSubVisitArrive(\''+skey+'\')">客人到店</button>' : '<button class="btn-primary" disabled style="padding:4px 16px;font-size:12px;opacity:.4;cursor:not-allowed;">客人到店</button> <span style="font-size:11px;color:var(--muted);">未到当天</span>')+(reached ? '' : '<a href="#" onclick="krSubVisitSim(\''+skey+'\');return false;" title="仅原型：视为已到那天" style="font-size:11px;">模拟到当日（演示用）</a>')+'</div>';
      var panel = (vs==='arrived' && can && !c.visitClosed) ? '<div style="font-size:11px;color:var(--slate2);margin:6px 0;">要加其他项目：到上面「项目卡」按该项目的［本次使用］（客人已到店时可按）；表里的行可以［取消本次］退回项目卡。</div>' : '';
      var tbl = krTblWrap(krTblHead()+all.map(function(s){ return krTblRow(c, s, {can:can, canDone:canDone, doneFn:doneFn, cancel:true}); }).join(''));
      body = '<div style="margin:0 0 8px 20px;padding:8px 14px;background:var(--surface2,#faf6ef);border-radius:8px;">'+tbl+bar+panel+'<div style="font-size:12px;color:var(--slate2);margin-top:6px;">'+krEsc(c.director||'—')+'（院长）'+krSubTimelineHtml(c, rep)+'</div></div>';
    }
    return head+body;
  }).join('');
  var pend = pendIn.length ? '<div style="margin-top:10px;font-size:12px;font-weight:700;color:var(--slate2);">回印尼做（由 IN 约，客人来做了才算子案件）</div>'+pendIn.map(function(s){ var late = pcDaysLate(s.date); return '<div class="case-field-row" style="font-size:13px;"><span style="flex:1;">'+krEsc(s.content)+'</span><span style="font-size:12px;color:var(--slate2);">建议 '+krEsc(pcMD(s.suggest||s.date))+(late>0 ? '，已过 '+late+' 天' : '')+'</span></div>'; }).join('') : '';
  return krCardBox('子案件 <span style="font-weight:400;font-size:11px;color:var(--muted);">按日期自动建立（同一天同一地点一个）；预约来源 = 术后预约（术后管理［预约时间］）/ 管理预约（项目［预约使用］）；到店 → 加项目走项目卡［本次使用］→ 逐行完成</span>', (rows || krEmpty('还没有术后管理预约'))+pend);
}
/* 子案件自己的 Timeline（含主案件 Timeline 里的汇总）：按子案件编号 / 内容过滤 */
function krSubTimelineHtml(c, rep){ var l = caseTimelineEntries(c, rep.dno); return '<div style="margin-top:8px;font-size:11px;font-weight:700;color:var(--muted);">本次记录</div>'+(l.map(logLine).join('') || '<div style="font-size:12px;color:var(--muted);">暂无记录</div>'); }
/* 施术预约卡（第一张）：只一行「施术时间 …」；［客人已到医院］［修改时间］在这里；地址、状态不放（状态看页面上方标签） */
function krSurgHead(c){
  var ks = c.krSchedule, st = scheduleState(c), can = krCan(); KR_SUBV = KR_SUBV || {edit:false};
  var days = Math.round((new Date(ks.confirmedDate+'T00:00:00') - new Date(krToday()+'T00:00:00'))/86400000);
  var line = krEsc(ks.confirmedDate+' '+(ks.confirmedTime||''))+(st==='Confirmed' ? '（'+(days>0 ? '还有 '+days+' 天' : days===0 ? '就是今天' : '已过 '+(-days)+' 天')+'）' : '')+(st==='Confirmed' ? ' <span style="font-size:11px;color:var(--muted);">'+krEsc(calRecheckText(c))+'</span>' : '');
  var btns = (st==='Confirmed' && can) ? '<div style="display:flex;gap:10px;margin-top:8px;"><button class="btn-primary" onclick="krMarkArrived()">客人已到医院</button><button class="btn-outline" onclick="KR_SUBV.edit=!KR_SUBV.edit;krRenderCaseDetail()">修改时间</button></div>' : '';
  var edit = '';
  if(KR_SUBV.edit && can && st==='Confirmed'){ krSchReset(c, {pick:ks.confirmedDate, time:ks.confirmedTime||'10:00', address:ks.address||krDefaultAddress()}); edit = '<div style="margin-top:12px;font-size:12px;color:var(--slate2);">同一天之内可调整到院时间和地址（IN 会收到通知）；日期要改请和 IN 室长沟通，由 IN 改。</div>'+krSurgeryHoursNote(c)+'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;"><select onchange="krSchSet(\'time\',this.value)" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;">'+krTimeOptionsFor(KR_SCH.time, c, ks.confirmedDate)+'</select><input value="'+krEsc(KR_SCH.address)+'" oninput="krSchSet(\'address\',this.value)" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;flex:1;min-width:260px;"><button class="btn-outline" onclick="krDoSchAdjust();KR_SUBV.edit=false;">保存调整</button></div>'; }
  return krCardBox('施术预约', krKV('施术时间', line)+(st==='Changing' ? '<div style="font-size:12px;color:#C26A1B;">IN 提了改期，请确认新时间；原日期继续有效。</div>' : '')+btns+edit);
}

function krSubStatusText(c, s){
  if(s.done) return '已完成';
  if(s.kind==='施术'){ var st = scheduleState(c); return st==='Arrived' ? '已到院' : (isEnded(c) ? '已结案' : '赴韩施术 · 待到院'); }
  return s.arrived ? '已到店' : '待到店';
}
function krSurgSub(c){ return (c.subItems||[]).filter(function(s){ return s.kind==='施术'; })[0] || null; }
/* CMD-1015-12：工作台 / 日历 / 待办点施术块、术后到店块 → 打开主案件详情的施术 tab（和从案件管理进来同一个画面），并把对应那天的子案件卡片高亮、滚到看得见；子案件的操作仍从卡片点进去（krOpenSub） */
var KR_SUB_HL = null;
function krOpenSubCard(clinicId, caseId, subId){
  var r = krFindCase(clinicId, caseId); if(!r){ krShowCase(clinicId, caseId); return; }
  var s0 = subId ? (r.c.subItems||[]).filter(function(x){ return x.id===subId; })[0] : null, hl = null;
  if(s0 && s0.kind==='术后管理记录'){ /* CMD-1015-17：点的是某次术后管理到院 → 展开对应那个子案件卡片；施术 / 没指定 → 施术当天（施术 tab 最上面） */
    var rep = subCaseList(r.c).filter(function(x){ return subCaseKey(x)===subCaseKey(s0); })[0]; if(rep){ KR_SUB_OPEN[subCaseKey(rep)] = true; hl = rep.id; }
  }
  krShowCase(clinicId, caseId); KR_SUB_HL = hl; krSetCaseTab('proc');
  setTimeout(function(){ var el = hl ? document.getElementById('kr-subrow-'+hl) : null; if(el && el.scrollIntoView) el.scrollIntoView({block:'center', behavior:'smooth'}); }, 80);
}
function krSurgeryFlowHtml(c){
  var st = scheduleState(c), ub = krUnpaidBanner(c);
  var items = krAllItems(c).map(function(it){ return '<div class="case-field-row" style="font-size:13px;flex-direction:column;align-items:flex-start;"><div style="display:flex;width:100%;"><span style="flex:1;'+(it.cancelled?'text-decoration:line-through;color:var(--muted);':'')+'">'+krEsc(it.name)+'</span><span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+krItemStatus(it)+'</span></div>'+krItemMetaHtml(it)+'</div>'; }).join('');
  if(c.krBalancePaid) return ub+(typeof krProgressBlock==='function' ? krProgressBlock(c) : '');
  return ub+krWizard(c); /* 付尾款前：分步式（评估 / 加项 / 付尾款），到院后才进入 */
}
function krTodayAll(on){ document.querySelectorAll('.kr-td-chk').forEach(function(e){ e.checked = on; }); }
function krSubSim(id){ if(!krCan()) return; krMut(function(c){ return coreSubSimDay(c, id, ME_NAME); }); }
/* 今日项目［已完成］ → 勾的变已完成；按完最后一项自动进术后管理阶段 / 结案（CMD-1015-17：不再弹「今日项目都已完成了吗」） */
function krTodayDone(){
  if(!krCan()) return;
  var ids = Array.prototype.map.call(document.querySelectorAll('.kr-td-chk:checked'), function(e){ return e.value; });
  if(!ids.length){ alert('请先勾选今天做完的项目'); return; }
  krMut(function(c){ return coreTodayDone(c, ids, ME_NAME); });
}
function krPlaceOpts(sel){ return [['KR','韩国'],['IN','印尼']].concat(sel==='either' ? [['either','印尼 / 韩国均可（旧）']] : []).map(function(p){ return '<option value="'+p[0]+'"'+(sel===p[0]?' selected':'')+'>'+p[1]+'</option>'; }).join(''); }
function krSubAdd(){
  if(!krCan()) return;
  var o = {kind:'术后管理记录', date:KR_SUB_NEW.date, content:KR_SUB_NEW.content, place:KR_SUB_NEW.place}; if(!o.date || !(o.content||'').trim()){ alert('请填日期和内容'); return; }
  KR_SUB_NEW.date = ''; KR_SUB_NEW.content = '';
  krMut(function(c){ return coreSubAdd(c, o, ME_NAME); });
}
function krSubEdit(id, k, v){ if(!krCan()) return; var p = {}; p[k] = v; krMut(function(c){ return coreSubEdit(c, id, p, ME_NAME); }); }
function krSubDel(id){ if(!krCan() || !confirm('删除这个子项？')) return; krMut(function(c){ return coreSubDel(c, id, ME_NAME); }); }


/* ---------- 五、到院、判断、调整与尾款（KR 端操作；到院后 IN 只看结果，按 KR 判断操作退款） ---------- */
var KR_ARR = {judge:'', memo:'', unable:{}, reason:'', swapItem:'', swapAlt:'', rebookDate:'', rebookTime:'10:00', confirmTrip:false};
function krArrSet(k, v){ KR_ARR[k] = v; if(k==='swapAlt') KR_SUB.detail['__swap'] = krDefaultsDetail(v); /* 更换项目：新项目默认资料自动带入 */ if(k==='judge'){ KR_ARR.memo = KR_ARR.memo || ''; } if(k==='rebookDate' || k==='judge' || k==='swapItem' || k==='swapAlt' || k==='confirmTrip') krRenderCaseDetail(); }
function krUnableToggle(name, on){ KR_ARR.unable[name] = on; }
function krSetAlloc(projectId, batchId, i, v){ if(!krCan()) return; krMut(function(c){ return corePcAlloc(c, projectId, batchId, i, v, ME_NAME); }); }
/* 「可以手术，但需要调整方案」（CMD-1012-05 四）：① 原项目勾选 = 保留 ② ［增加项目］（KR 项目库，填所需术后管理等）③ 结算：列出结算单 → 已付款 ④ 付款后才弹术后管理预约（按最终项目） */
var KR_ADJ = {dropped:{}, adds:{}, addOpen:false, signed:{}, locals:[], swap:{}, step:'pick'};
function krAdjAddLocal(){ var pk = krLpPick('adj'); if(!pk) return; if(pk.p.neg && !(pk.price>0)){ alert('面议项目必须手动填价格（韩元）'); return; } KR_ADJ.locals.push({name:pk.p.name, specLabel:pk.sp.label, price:pk.price, projectId:pk.p.id}); krRenderCaseDetail(); }
function krAdjToggleKeep(name, keep){ KR_ADJ.dropped[name] = !keep; krRenderCaseDetail(); }
function krAdjToggleAdd(name, on){ if(on){ KR_ADJ.adds[name] = true; KR_SUB.detail[name] = KR_SUB.detail[name] || krDefaultsDetail(name); } else delete KR_ADJ.adds[name]; krRenderCaseDetail(); }
function krAdjBlock(c, info){
  var inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;', cand = krScopeCandidates(KR_CASE.clinicId);
  var pend = krNotStartedItems(c), keepRows = pend.map(function(it){ return '<label style="display:flex;gap:8px;align-items:center;margin:4px 0;font-size:13px;"><input type="checkbox" '+(KR_ADJ.dropped[it.name]?'':'checked')+' onchange="krAdjToggleKeep(\''+krEsc(it.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(it.name)+' <span style="color:var(--muted);">'+formatCurrency(itemKrAmount(it),'KRW')+'</span></label>'; }).join('');
  var avail = cand.kr.filter(function(p){ return !krAllItems(c).some(function(it){ return it.name===p.name && !it.cancelled && !it.swapped; }); });
  var addRows = KR_ADJ.addOpen ? (avail.map(function(p){
    var on = !!KR_ADJ.adds[p.name], d = on ? krDet(p.name) : null;
    return '<label style="display:flex;gap:8px;align-items:center;margin:4px 0;font-size:13px;"><input type="checkbox" '+(on?'checked':'')+' onchange="krAdjToggleAdd(\''+krEsc(p.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(p.name)+' <span style="color:var(--muted);">'+formatCurrency(p.price,'KRW')+'</span></label>'+
      (on ? krProjDetailHtml(p, cand)+(d && d.anes!=='local' ? '<label style="display:block;margin:0 0 8px 22px;font-size:12px;"><input type="checkbox" '+(KR_ADJ.signed[p.name]?'checked':'')+' onchange="KR_ADJ.signed[\''+krEsc(p.name).replace(/'/g,'')+'\']=this.checked"> 已在现场签署麻醉同意书（'+KR_ANES[d.anes]+'必须勾选）</label>' : '') : '');
  }).join('') || '<div style="font-size:12px;color:var(--muted);">项目库里没有可加的项目</div>') : '';
  var keptItems = pend.filter(function(it){ return !KR_ADJ.dropped[it.name]; }), addNames = Object.keys(KR_ADJ.adds);
  var total = keptItems.reduce(function(s, it){ return s + itemKrAmount(it); }, 0) + addNames.reduce(function(s, n){ var p = cand.kr.filter(function(x){ return x.name===n; })[0]; return s + (p ? p.price : 0); }, 0);
  total += KR_ADJ.locals.reduce(function(s, x){ return s + x.price; }, 0);
  var done = krAllItems(c).filter(function(it){ return it.done && !it.cancelled && !it.swapped; }).reduce(function(s, it){ return s + itemKrAmount(it); }, 0);
  var diff = total + done - info.effDeposit;
  return '<div style="margin:8px 0;padding:10px 12px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;">'+
    '<div style="font-weight:700;margin-bottom:4px;">① 原项目（勾选 = 保留）</div>'+keepRows+
    '<div style="font-weight:700;margin:10px 0 4px;">② 增加项目</div>'+(KR_ADJ.addOpen ? addRows+'<div style="font-size:12px;font-weight:700;margin:8px 0 4px;">本地管理项目（类别 → 项目 → 规格 → 价格）</div><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">'+krLocalPickerHtml('adj')+'<button class="btn-outline" style="padding:3px 12px;font-size:11px;" onclick="krAdjAddLocal()">加入</button></div>'+KR_ADJ.locals.map(function(x, i){ return '<div style="margin:3px 0;">＋ '+krEsc(x.name+' · '+x.specLabel)+'　'+formatCurrency(x.price,'KRW')+' <a href="#" onclick="KR_ADJ.locals.splice('+i+',1);krRenderCaseDetail();return false;">移除</a></div>'; }).join('')+'<button class="btn-ghost" style="padding:2px 10px;font-size:11px;" onclick="KR_ADJ.addOpen=false;krRenderCaseDetail()">收起</button>' : '<button class="btn-outline" style="padding:3px 12px;font-size:12px;" onclick="KR_ADJ.addOpen=true;krRenderCaseDetail()">增加项目</button>')+
    '<div style="font-weight:700;margin:10px 0 4px;">③ 结算单（预览）</div>'+
    keptItems.map(function(it){ return '<div>'+krEsc(it.name)+'　'+formatCurrency(itemKrAmount(it),'KRW')+'</div>'; }).join('')+
    KR_ADJ.locals.map(function(x){ return '<div>＋ '+krEsc(x.name+' · '+x.specLabel)+'（增加，计入尾款）　'+formatCurrency(x.price,'KRW')+'</div>'; }).join('')+
    addNames.map(function(n){ var p = cand.kr.filter(function(x){ return x.name===n; })[0]; return '<div>＋ '+krEsc(n)+'（增加，计入尾款）　'+(p ? formatCurrency(p.price,'KRW') : '')+'</div>'; }).join('')+
    '<div style="margin-top:4px;">项目合计 '+formatCurrency(total+done,'KRW')+'；可抵定金 '+formatCurrency(info.effDeposit,'KRW')+'；<b>'+(diff>=0 ? '尾款（在韩国补）' : '应退差额')+' '+formatCurrency(Math.abs(diff),'KRW')+'</b></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-top:4px;">点下面的［结算并标记已付款］后才会生效；付款后弹出术后管理预约（按最终项目）。</div></div>';
}
/* CMD-1015-15：付清尾款后选了「稍后预约」，之后从这里约：项目 tab「术后项目」卡 + 施术 tab 都有［安排术后管理］，打开原有的术后管理预约小窗口；只在尾款已付、还有没约的术后管理时出现 */
function krPcbNeed(c){ return !!(c.krBalancePaid && !c.pcBooked && krActiveItems(c).some(function(it){ return (it.postcare||[]).length; })); }
function krPcbNeedBar(c){
  if(!krPcbNeed(c) || !krCan()) return '';
  return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;font-size:12px;color:#C26A1B;"><span style="flex:1;">还有术后管理没有预约</span><button class="btn-primary" onclick="krPcbOpen()">安排术后管理</button></div>';
}
function krPcbNeedCard(c){ var b = krPcbNeedBar(c); return b ? krCardBox('术后管理预约', b) : ''; }
function krPcbButtonHtml(c){
  var j = c.krJudge || {};
  if(!c.krBalancePaid) return ''; /* 术后管理预约区块只在付清尾款后显示（CMD-1013-03） */
  if(!krActiveItems(c).some(function(it){ return (it.postcare||[]).length; })) return '';
  return '<div style="margin:10px 0;padding:10px 12px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;"><b>术后管理预约</b>：'+(c.pcBooked ? '<span style="color:var(--sage);">已预约</span>（重新预约会替换未完成的预约）' : '<span style="color:#C26A1B;">尚未预约</span>')+' <button class="btn-outline" style="padding:2px 10px;font-size:11px;margin-left:6px;" onclick="krPcbOpen()">'+(c.pcBooked ? '重新预约' : '预约术后管理')+'</button></div>';
}
function krAllocHtml(c){
  var its = krActiveItems(c).filter(function(it){ return (it.postcare||[]).length; });
  if(!its.length) return '';
  return '<div style="margin:10px 0;"><div style="font-size:12px;font-weight:700;">确认行程：术后管理的地点（含在套餐内；可弹性的在这时确定）</div>'+its.map(function(it){ return '<div style="font-size:12px;margin-top:6px;"><b>'+krEsc(it.name)+'</b></div>'+pcLinesHtml(c, it, 'krSetAlloc'); }).join('')+'</div>';
}
function krArrivalBlock(c){
  if(KR_SUB.caseKey !== krRecKey()) KR_SUB = krSubBlank(krRecKey());
  var st = scheduleState(c), can = krCan(), j = c.krJudge;
  if(!c.settlementDone || !krAllItems(c).length) return '';
  var inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;', info = krBalanceInfo(c), body = '';
  if(st==='Confirmed' && !c.hasArrived){
    body = can ? '<button class="btn-primary" onclick="krMarkArrived()">标记已到医院</button>' : krEmpty('客人到院后由 KR 室长标记');
  } else if(st==='Confirmed' && c.hasArrived){
    body = krEmpty('已在韩国重新预约施术时间；客人再到医院时重新标记"已到医院"。')+(can ? '<button class="btn-primary" onclick="krMarkArrived()">标记已到医院</button>' : '');
  } else if(st==='Arrived' && !j){
    body = can ? '<div style="font-size:13px;margin-bottom:8px;">院长评估结果</div>'+['ok','changed','cannot'].map(function(r){ return '<label style="display:block;margin:5px 0;font-size:13px;cursor:pointer;"><input type="radio" name="kr-judge" '+(KR_ARR.judge===r?'checked':'')+' onchange="krArrSet(\'judge\',\''+r+'\')"> '+KR_JUDGE_TEXT[r]+'</label>'; }).join('')+
      '<textarea placeholder="'+(KR_ARR.judge && KR_ARR.judge!=='ok' ? 'memo（必填：原因 / 调整内容）' : 'memo（选填）')+'" oninput="KR_ARR.memo=this.value" style="width:100%;min-height:60px;margin-top:6px;padding:8px;border:1px solid var(--line);border-radius:8px;box-sizing:border-box;font-size:12px;">'+krEsc(KR_ARR.memo||'')+'</textarea>'+
      '<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-primary" onclick="krDoJudge()">确认评估结果</button><button class="btn-ghost" onclick="krUnarrive()">撤回"已到医院"</button></div>' : krEmpty('等待院长评估结果（由 KR 室长记录）');
  } else if(j && j.result==='cannot' && !j.replaced){
    var od = caseOpenDates(c).filter(function(d){ return d >= krToday(); });
    body = krKV('院长评估结果', KR_JUDGE_TEXT.cannot)+(j.memo ? krKV('memo', krEsc(j.memo)) : '')+(j.refundKind ? krKV('定金', (j.refundKind==='all' ? '全部退回' : '不退')+'（已通知 IN 室长按此操作；操作后案件变为仅出报告）') :
      (can ? '<div style="margin-top:10px;font-size:13px;font-weight:700;">① 能否更改时间后继续？能 → 在韩国重新预约</div>'+(KR_ARR.rebookDate ? '<div style="margin-top:6px;">'+krEsc(c.director||'')+' 当天的日程</div>'+krDirDayText(krHospitalIdOfMe(), c.director, KR_ARR.rebookDate) : '')+'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0 12px;"><select onchange="krArrSet(\'rebookDate\',this.value)" style="'+inp+'"><option value="">选择开放日期</option>'+od.map(function(d){ return '<option'+(KR_ARR.rebookDate===d?' selected':'')+'>'+d+'</option>'; }).join('')+'</select><select onchange="krArrSet(\'rebookTime\',this.value)" style="'+inp+'">'+krTimeOptions(KR_ARR.rebookTime)+'</select><button class="btn-outline" onclick="krDoRebook()">重新预约施术时间</button></div>'+
        '<div style="font-size:13px;font-weight:700;">② 不能 → 退定金（由 KR 判断，IN 室长操作）</div><div style="display:flex;gap:8px;margin-top:6px;"><button class="btn-outline" onclick="krDoRefundDecision(\'all\')">全部退回</button><button class="btn-outline" onclick="krDoRefundDecision(\'none\')">不退</button></div>' : krEmpty('等待 KR 室长处理')));
  } else if(j){ /* ok / changed */
    var calc = '实际项目合计 '+formatCurrency(info.total,'KRW')+'（施术项目；术后管理含在套餐内）；定金合计 '+formatCurrency(info.deposit,'KRW')+(info.preRefund>0 ? '，减去到院前已退 '+formatCurrency(info.preRefund,'KRW') : '')+' = 可抵定金 '+formatCurrency(info.effDeposit,'KRW')+'；<b>'+(info.diff>=0 ? '尾款（在韩国补）' : '应退差额（IN 室长按此金额退）')+' '+formatCurrency(Math.abs(info.diff),'KRW')+'</b>';
    body = krKV('KR 判断', KR_JUDGE_TEXT[j.result])+(j.memo ? krKV('memo', krEsc(j.memo)) : '')+'<div style="font-size:12px;color:var(--slate2);margin:8px 0;line-height:1.7;">'+calc+'</div>';
    if(j.result==='changed' && !j.settled && can){ body += krAdjBlock(c, info); }
    if(!c.krBalancePaid && can){
      body += krPcbButtonHtml(c)+'<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:8px 0;cursor:pointer;"><input type="checkbox" '+(KR_ARR.confirmTrip?'checked':'')+' onchange="krArrSet(\'confirmTrip\',this.checked)"> 已和客人确认行程（术后管理地点确定后不能再改）</label><button class="btn-primary" onclick="krDoSettle()"'+(KR_ARR.confirmTrip?'':' disabled style="opacity:.5;"')+'>'+(j.result==='changed' ? (info.diff>=0 ? '结算并标记已付款' : '结算并通知 IN 退差额') : (info.diff>=0 ? '标记付清尾款' : '通知 IN 退差额'))+'</button>'+(j.refundDue ? '<div style="font-size:12px;color:#C26A1B;margin-top:6px;">已通知 IN 室长按 '+formatCurrency(j.refundDue,'KRW')+' 退差额；退款后视为尾款已结清。</div>' : '');
    } else if(c.krBalancePaid){
      if(can && !c.pcBooked) body += krPcbButtonHtml(c);
      body += '<div style="font-size:12px;color:var(--sage);font-weight:700;margin-top:6px;">✓ 已付清尾款，行程已确认'+(c.innCare ? '；回印尼做的术后管理留在本案件（免费，由 IN 约，不转持有）' : '')+'</div>';
    }
  }
  return krCardBox('到院与尾款', body);
}
function krMarkArrived(){ if(!krCan()) return; krMut(function(c){ return coreMarkArrived(c, ME_NAME); }); }
function krDoJudge(){
  if(!krCan() || !KR_ARR.judge){ alert('请先选择院长评估结果'); return; }
  var r0 = KR_ARR.judge, memo = (KR_ARR.memo||'').trim();
  if(r0!=='ok' && !memo){ alert('除"原方案不变"外，memo 必填（写明原因 / 调整内容）'); return; }
  KR_ARR.judge = ''; KR_ARR.memo = '';
  var ok = krMut(function(c){ return coreJudge(c, r0, ME_NAME, memo); });
}
function krUnarrive(){ if(!krCan() || !confirm('撤回"已到医院"？（院长评估之前可撤回，回到施术时间已确认）')) return; krMut(function(c){ return coreUnarrive(c, ME_NAME); }); }
function krDoUnable(){
  if(!krCan()) return; var names = Object.keys(KR_ARR.unable).filter(function(n){ return KR_ARR.unable[n]; }), reason = (KR_ARR.reason||'').trim();
  if(!names.length){ alert('请至少勾选一个项目'); return; } if(!reason){ alert('请填写原因'); return; }
  var ok = krMut(function(c){ return coreMarkUnable(c, names, reason, ME_NAME); });
  if(!ok) alert('至少要保留一个能做的项目；全部不能做请选"不能施术"'); else { KR_ARR.unable = {}; KR_ARR.reason = ''; krRenderCaseDetail(); }
}
function krDoSwap(){
  if(!krCan() || !KR_ARR.swapItem || !KR_ARR.swapAlt){ alert('请选择原项目和新项目'); return; }
  var a = KR_ARR.swapItem, b = KR_ARR.swapAlt, cand = krScopeCandidates(KR_CASE.clinicId), dt = krDetailOf('__swap', cand);
  if(dt.error){ alert(dt.error); return; }
  KR_ARR.swapItem = ''; KR_ARR.swapAlt = ''; delete KR_SUB.detail['__swap'];
  krMut(function(c){ return coreSwapItem(c, a, b, ME_NAME, dt); });
}
/* 把表单里某个项目的资料（推荐在韩时间、麻醉、所需术后管理）整理成快照字段 */
function krDetailOf(key, cand){
  var d = krDet(key), err = '';
  var pc = d.pc.map(function(x){
    var kp = cand.krPost.concat(cand.krLocal||[]).filter(function(o){ return o.name===x.kr; })[0], ip = x.place==='either' ? cand.post.filter(function(o){ return o.name===x.inn; })[0] : null;
    if(!kp) err = '所需术后管理还有没选项目的行';
    return krPcToItem(x, ip);
  });
  return {error:err, stay:(d.stay||'').trim(), anesthesia:{type:d.anes, label:KR_ANES[d.anes], note:(d.anesNote||'').trim()}, postcare:pc};
}
function krDoSettle(){
  if(!krCan() || !KR_ARR.confirmTrip) return;
  var r0 = krFindCase(KR_CASE.clinicId, KR_CASE.id), c0 = r0.c, j0 = c0.krJudge || {};
  var mode = KR_WZ.cannotOpt==='replace' && j0.result==='cannot' ? 'replace' : j0.result; /* ok / changed / replace（不建议手术 → 取消项目 → 更换项目） */
  var cand = krScopeCandidates(KR_CASE.clinicId), adds = [], swaps = [], drops = [], i, lcs = KR_ADJ.locals.slice();
  var addNames = Object.keys(KR_ADJ.adds);
  for(i = 0; i < addNames.length; i++){
    var dt = krDetailOf(addNames[i], cand); if(dt.error){ alert('「'+addNames[i]+'」：'+dt.error); return; }
    if(dt.anesthesia.type!=='local' && !KR_ADJ.signed[addNames[i]]){ alert('「'+addNames[i]+'」是'+dt.anesthesia.label+'，必须勾选「已在现场签署麻醉同意书」'); return; }
    adds.push({name:addNames[i], detail:dt});
  }
  var pend = krNotStartedItems(c0);
  if(mode==='changed'){
    pend.forEach(function(it){
      if(!KR_ADJ.dropped[it.name]) return;
      var alt = KR_ADJ.swap[it.name];
      if(alt && /^L\|/.test(alt)){ var li = krSwapLocal(alt); if(li) swaps.push({from:it.name, local:li}); else drops.push(it.name); } /* 更换为管理项目（收费） */
      else if(alt){ KR_SUB.detail['__swap'+it.name] = KR_SUB.detail['__swap'+it.name] || krDefaultsDetail(alt); var sd = krDetailOf('__swap'+it.name, cand); swaps.push({from:it.name, to:alt, detail:sd}); }
      else drops.push(it.name);
    });
    if(pend.length - drops.length + adds.length + lcs.length < 1){ alert('至少要保留或增加一个项目；全部不做请选"不建议手术"'); return; }
  }
  if(mode==='replace' && !adds.length && !lcs.length){ alert('请先选要更换成的项目（KR 项目库）'); return; }
  if(mode==='ok' && !pend.length && !adds.length) return;
  var addN = adds.map(function(a){ return a.name; }).concat(swaps.filter(function(s){ return s.to; }).map(function(s){ return s.to; })), dropN = mode==='replace' ? pend.map(function(it){ return it.name; }) : drops.concat(swaps.map(function(s){ return s.from; }));
  var pm = coreProjectedConflict(c0, addN, dropN); if(pm){ krBlock(pm); return; } /* CMD-1015-21：加 / 换施术项目会拉长施术块，先查院长日程冲突 */
  KR_ARR.confirmTrip = false;
  var res = null;
  krMut(function(c){
    if(mode==='replace'){
      var byName = {}; adds.forEach(function(a){ byName[a.name] = {anesthesia:a.detail.anesthesia, signed:true, detail:a.detail}; });
      if(!coreCannotReplace(c, adds.map(function(a){ return a.name; }), byName, ME_NAME, lcs)) return false;
    } else {
      swaps.forEach(function(s){ coreSwapItem(c, s.from, s.to, ME_NAME, s.detail, s.local); });
      adds.forEach(function(a){ coreAddOnItem(c, a.name, ME_NAME, {anesthesia:a.detail.anesthesia, signed:true, detail:a.detail}); });
      lcs.forEach(function(x){ coreAddOnItem(c, x.name, ME_NAME, {local:x}); });
      if(drops.length) coreMarkUnable(c, drops, (c.krJudge && c.krJudge.memo) || '评估调整', ME_NAME);
    }
    res = coreSettleBalance(c, ME_NAME); return res;
  });
  if(!res || !res.ok){ alert('现在不能结算尾款'); return; }
  KR_ADJ = {dropped:{}, adds:{}, addOpen:false, signed:{}, locals:[], swap:{}, step:'pick'}; KR_WZ.cannotOpt = ''; KR_WZ.cannotSub = '';
  if(!res.refund) setTimeout(krPcbOpen, 80); /* 术后管理预约弹窗只在付清尾款后出现（原方案不变 / 调整方案 / 更换项目都是） */
}
function krDoRebook(){
  if(!krCan() || !KR_ARR.rebookDate){ alert('请选择新的施术日期'); return; } var d = KR_ARR.rebookDate, t0 = KR_ARR.rebookTime;
  var rr = krFindCase(KR_CASE.clinicId, KR_CASE.id), dur0 = rr ? surgeryMinutes(rr.c) : 60, er = rr ? krSurgerySlotError(krHospitalIdOfMe(), rr.c.director, d, t0, dur0, KR_CASE.clinicId+':'+KR_CASE.id, {allowOffHours:true}) : ''; if(er){ krBlock(er); return; }
  var go = function(){ krMut(function(c){ return coreRebook(c, d, t0, ME_NAME); }); };
  var off = krOffHoursText(krHospitalIdOfMe(), d, t0, dur0); if(off) krOffConfirm(off+'（更换时间 '+d+' '+t0+'，韩国时间）', go); else go(); /* 和确认面诊 / 施术时间同一套（CMD-1013-04 四·3） */
}
function krDoRefundDecision(kind){ if(!krCan() || !confirm('确认：定金'+(kind==='all'?'全部退回':'不退')+'？IN 室长会按这个判断操作。')) return; krMut(function(c){ return coreRefundDecision(c, kind, ME_NAME); }); }

var KR_SUBDONE = {id:'', pick:{}};
function krSubDone(id){ if(!krCan()) return; krMut(function(c){ return coreSubDone(c, id, ME_NAME, []); }); }
function krSubDonePick(name, on){ KR_SUBDONE.pick[name] = on; }
function krSubDoneCancel(){ KR_SUBDONE = {id:'', pick:{}}; krRenderCaseDetail(); }
function krSubDoneConfirm(){
  var names = Object.keys(KR_SUBDONE.pick).filter(function(n){ return KR_SUBDONE.pick[n]; }), id = KR_SUBDONE.id;
  if(!names.length){ alert('请勾选这次做了哪些项目'); return; }
  KR_SUBDONE = {id:'', pick:{}}; krMut(function(c){ return coreSubDone(c, id, ME_NAME, names); });
}
var KR_ITEMS_PICK = {};
function krItemsPick(name, on){ KR_ITEMS_PICK[name] = on; }
function krDoItemsDone(){
  var names = Object.keys(KR_ITEMS_PICK).filter(function(n){ return KR_ITEMS_PICK[n]; }); if(!krCan()) return;
  if(!names.length){ alert('请勾选已完成的项目'); return; }
  KR_ITEMS_PICK = {}; krMut(function(c){ return coreItemsDone(c, names, ME_NAME); });
}
/* 本地管理项目选择器（类别 → 项目 → 规格 → 价格，韩元；CMD-1012-04）：key 区分不同位置的选择状态 */
var KRLP = {}; /* 面议项目：KRLP[key].manual = 手动填的韩元价格 */
function krLpState(key){ var l = krLocalLib(krHospitalIdOfMe()); var s = KRLP[key] = KRLP[key] || {cat:'', pid:'', sid:''}; if(!s.cat) s.cat = l.length ? l[0].catLabel : ''; var ps = l.filter(function(p){ return p.catLabel===s.cat; }); if(!ps.filter(function(p){ return p.id===s.pid; })[0]) s.pid = ps.length ? ps[0].id : ''; var p = ps.filter(function(x){ return x.id===s.pid; })[0]; if(!p || !(p.specs||[]).filter(function(x){ return x.id===s.sid; })[0]) s.sid = p && p.specs.length ? p.specs[0].id : ''; return s; }
function krLpSet(key, k2, v){ KRLP[key] = KRLP[key] || {}; KRLP[key][k2] = v; if(k2==='cat'){ KRLP[key].pid = ''; KRLP[key].sid = ''; } if(k2==='pid') KRLP[key].sid = ''; krRenderCaseDetail(); }
function krLpPick(key){ var s = krLpState(key), p = krLocalLib(krHospitalIdOfMe()).filter(function(x){ return x.id===s.pid; })[0]; var sp = p && p.specs.filter(function(x){ return x.id===s.sid; })[0]; if(!(p && sp)) return null; var manual = p.neg ? (parseInt(KRLP[key].manual,10)||0) : 0; return {p:p, sp:sp, price:p.neg ? manual : sp.price}; }
function krLocalPickerHtml(key){
  var l = krLocalLib(krHospitalIdOfMe()), s = krLpState(key), cats = []; l.forEach(function(p){ if(cats.indexOf(p.catLabel)<0) cats.push(p.catLabel); });
  var inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;', ps = l.filter(function(p){ return p.catLabel===s.cat; }), pk = krLpPick(key);
  return '<select onchange="krLpSet(\''+key+'\',\'cat\',this.value)" style="'+inp+'">'+cats.map(function(c0){ return '<option'+(c0===s.cat?' selected':'')+'>'+krEsc(c0)+'</option>'; }).join('')+'</select>'+
    '<select onchange="krLpSet(\''+key+'\',\'pid\',this.value)" style="'+inp+'">'+ps.map(function(p){ return '<option value="'+p.id+'"'+(p.id===s.pid?' selected':'')+'>'+krEsc(p.name)+'</option>'; }).join('')+'</select>'+
    '<select onchange="krLpSet(\''+key+'\',\'sid\',this.value)" style="'+inp+'">'+((pk ? pk.p.specs : [])).map(function(sp){ return '<option value="'+sp.id+'"'+(sp.id===s.sid?' selected':'')+'>'+krEsc(sp.label)+'</option>'; }).join('')+'</select>'+
    (pk && pk.p.neg ? '<input type="number" min="1" placeholder="面议：填价格（₩）" value="'+(KRLP[key].manual||'')+'" oninput="KRLP[\''+key+'\'].manual=this.value" onchange="krRenderCaseDetail()" style="'+inp+'width:150px;">' : '<span style="font-size:12px;font-weight:700;">'+(pk ? formatCurrency(pk.sp.price,'KRW') : '')+'</span>');
}
function krAddonSelChg(){ var s = document.getElementById('kr-addon-sel'), a = document.getElementById('kr-addon-anes'); if(!s || !a) return; a.value = krDefaultsDetail(s.value).anes; krAddonAnesChg(); }
function krAddonAnesChg(){ var v = document.getElementById('kr-addon-anes').value, w = document.getElementById('kr-addon-sign-w'); if(w) w.style.display = v==='local' ? 'none' : ''; }
function krDoAddLocal(){
  if(!krCan()) return; var pk = krLpPick('addon'); if(!pk) return;
  var date = (document.getElementById('kr-addon-date')||{}).value || krToday();
  if(pk.p.neg && !(pk.price>0)){ alert('面议项目必须手动填价格（韩元）'); return; }
  if(!confirm('增加本地管理项目「'+pk.p.name+' · '+pk.sp.label+'」：'+formatCurrency(pk.price,'KRW')+'？')) return;
  KR_SUB_NEW.date2 = '';
  krMut(function(c){ return coreAddOnItem(c, pk.p.name, ME_NAME, {local:{name:pk.p.name, specLabel:pk.sp.label, price:pk.price, projectId:pk.p.id}, date:date}); });
}
function krDoAddOn(){
  var s = document.getElementById('kr-addon-sel'); if(!krCan() || !s || !s.value) return; var n = s.value;
  var at = document.getElementById('kr-addon-anes').value, signed = !!(document.getElementById('kr-addon-sign') && document.getElementById('kr-addon-sign').checked), date = (document.getElementById('kr-addon-date')||{}).value || krToday();
  if(at!=='local' && !signed){ alert('睡眠 / 全身麻醉：请勾选"已在现场签署麻醉同意书"才能新增'); return; }
  var rr = krFindCase(KR_CASE.clinicId, KR_CASE.id), pre = rr && !rr.c.krBalancePaid;
  if(!confirm('增加项目「'+n+'」：'+(pre ? '与尾款一次结算（计入尾款，医院收）。' : '尾款已付清，项目标「待付款」，之后点［已付款］生成结算单（不必每次结算）。')+'确认？')) return;
  var an = {type:at, label:KR_ANES[at], note:''};
  KR_SUB_NEW.date2 = '';
  krMut(function(c){ return coreAddOnItem(c, n, ME_NAME, {anesthesia:an, signed:signed, date:date}); });
}

/* ---------- KR 工作台日历（KR-DASH-01 / KR-SCHD-01，2026-10-07 修订：原「日程管理」页合并进工作台） ----------
   原则：韩国医院自己的本地客人不进平台，日历只显示从 IN 转来的平台案件。
   事件只有：到院施术（客人名 · 来源诊所 · 项目）、在韩子项（复诊、拆线、管理）、不可预约（灰块，不写原因）；固定栏 = 每天的 OFF；不显示预计出报告时间。
   周视图直接进入时今天在第一栏；韩国时间。操作：点空白格 → 加「不可预约」/ 标 OFF；单一院长的月视图点日期 → 设定当天是否开放施术；点施术 / 子项 → 打开案件。 */
var KRC = {mode:'week', anchor:'', person:'all', layer:'hospital', pop:null, edit:null, popForm:{who:'', start:'10:00', end:'11:00', part:'全天'}};
var KRC_H0 = 8, KRC_H1 = 20, KRC_PX = 34; /* 时间轴 08:00–20:00（韩国时间），一小时 34px */
function krcIsDirector(){ return isKrDirectorLike(currentAccount()); }
function krcAnchor(){ if(!KRC.anchor) KRC.anchor = krToday(); return KRC.anchor; }
function krcAdd(ds, n){ var d = new Date(ds+'T00:00:00'); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function krcWeekStartMon(ds){ var d = new Date(ds+'T00:00:00'), dow = (d.getDay()+6)%7; return krcAdd(ds, -dow); }
function krcDow(ds){ return '一二三四五六日'.charAt((new Date(ds+'T00:00:00').getDay()+6)%7); }
/* 我能看 / 改哪些院长：院长账号只有自己；室长和管理者全部（在职的） */
function krcDirectors(){
  var hid = krHospitalIdOfMe(), me = currentAccount(), ds = hospitalDirectors(hid).filter(function(d){ return d.active; }).map(function(d){ return d.name; });
  if(krcIsDirector() && krcViewAll()) return ds; /* 代表院长切到「全部院长」：只看不操作 */
  return krcIsDirector() ? ds.filter(function(n){ return n===me.name; }) : ds;
}
/* CMD-1014-19 一：日历两层——第一层［医院］（'all'，只看客人预约）｜［各位院长］（某位院长：预约 + OFF + 不可预约）；院长账号没有第一层（只看自己），代表院长切到「全部」时同室长两层（只看） */
function krcPersonName(){ var ds = hospitalDirectors(krHospitalIdOfMe()).filter(function(d){ return d.active; }).map(function(d){ return d.name; }); return (KRC.person && KRC.person!=='all' && ds.indexOf(KRC.person)>-1) ? KRC.person : (ds[0] || ''); }
function krcWho(){
  if(krcIsDirector() && !(krcViewAll())) return currentAccount().name;
  return KRC.layer==='director' ? krcPersonName() : 'all';
} /* 'all' = 医院层；否则某位院长 */
function krcCanEdit(who){ return krcIsDirector() ? who===currentAccount().name : canDo('krsched'); }
function krcRender(){ if(CURRENT_PAGE_ID==='kr-dashboard') krRenderDashboard(); }
function krcPick(v){ if(v==='__H'){ KRC.layer = 'hospital'; } else { KRC.layer = 'director'; KRC.person = v; } KRC.pop = null; KRC.edit = null; krcRender(); }
function krcSet(k, v){ KRC[k] = v; if(k==='layer' && v==='director' && (!KRC.person || KRC.person==='all')) KRC.person = krcPersonName(); if(k==='mode' || k==='person' || k==='layer'){ KRC.pop = null; KRC.edit = null; } krcRender(); }
function krcShift(n){ var a = krcAnchor(); if(KRC.mode==='month'){ var d = new Date(a+'T00:00:00'); d.setMonth(d.getMonth()+n, 1); KRC.anchor = d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-01'; } else KRC.anchor = krcAdd(a, n*(KRC.mode==='week' ? 7 : 1)); krcRender(); }
function krcToday(){ KRC.anchor = krToday(); krcRender(); }
/* 事件：平台的事 */
function krcEvents(){
  var hid = krHospitalIdOfMe(), h = krHData(), who = krcWho(), rows = krAllCases(), rm = {};
  normSchedBlocks(hid);
  rows.forEach(function(r){ rm[r.clinicId+':'+r.id] = r; });
  var okWho = function(n){ return n===KRB_HOSP ? !(krcIsDirector() && !(krcViewAll())) : (who==='all' || n===who); }; /* CMD-1014-18：全院的占位预约不挂院长，室长 / 代表院长看全部时都显示 */
  var surg = [], busy = [];
  Object.keys(h.directorSchedule||{}).forEach(function(n){ if(!okWho(n)) return; (h.directorSchedule[n]||[]).forEach(function(b){
    if(b.type==='面诊'){ var rc = rm[b.clinicId+':'+b.caseId]; if(krcIsDirector() && !rc && !(krcViewAll())) return; surg.push({b:b, row:rc, label:'面诊 · '+(b.name||'')+' · '+n}); } /* 面诊预约（CMD-1008-12 C1）：「面诊 · 客人 · 院长」 */
    else if(b.type==='预约'){ var rbk = rm[b.clinicId+':'+b.caseId] || null; surg.push({b:b, row:rbk, label:'预约 · '+(b.name||''), done:!!b.done}); } /* CMD-1014-16：IN 在 KR 日程占位 / 已确认的预约（krbook.js） */
    else if(b.type==='施术'){ var r = rm[b.clinicId+':'+b.caseId]; if(krcIsDirector() && !r && !(krcViewAll())) return; var items = r ? krActiveItems(r.c).filter(function(it){ return !krIsMgmtItemC(it); }).map(function(it){ return it.name; }).join('、') : ''; surg.push({b:b, row:r, label:(b.name||'')+' · '+(r ? r.clinicName : ((clinicById(b.clinicId)||{}).name||''))+(items ? ' · '+items : '')}); }
    else busy.push(b);
  }); });
  /* 已完成的面诊 / 施术 / 在韩子项在日历上加删除线、颜色变淡（CMD-1013-08 五·1） */
  surg.forEach(function(x){ var c0 = x.row && x.row.c; if(!c0) return; if(x.b.type==='面诊') x.done = !!c0.consultContentAt; else if(x.b.type==='施术') x.done = (c0.subItems||[]).some(function(s){ return s.kind==='施术' && s.done; }) || !!c0.krProcedureDone; });
  /* 在韩术后管理（有时间的子项，含「在韩持有」）也进日历：已约时间保留、日历照显示（CMD-1013-08 一·2） */
  rows.forEach(function(r){ var c0 = r.c; if(!c0) return; (c0.subItems||[]).forEach(function(s){
    if(s.kind==='施术' || s.place!=='KR' || !s.date || !s.time || !okWho(c0.director)) return;
    surg.push({b:{id:'sub'+s.id, subId:s.id, type:'术后管理', date:s.date, time:s.time, end:minToTime(Math.min(24*60-1, timeToMin(s.time)+30)), who:c0.director, clinicId:r.clinicId, caseId:c0.id, name:c0.name}, row:r, done:!!s.done, arrived:!!s.arrived, label:(s.arrived ? '✓ ' : '')+(s.holdUseOf ? '持有使用 · ' : '术后管理 · ')+c0.name+' · '+(c0.director||'')}); }); });
  var subs = []; /* 在韩子项不画在「子项」行（已废弃） */
  var offs = (h.offs||[]).filter(function(o){ return who==='all' ? o.kind!=='director' : okWho(o.who); }); /* 医院层：固定栏只有室长 OFF；院长层：他自己的 OFF */
  if(who==='all') busy = []; /* 医院层不显示院长不可预约 */
  return {surg:surg, busy:busy, subs:subs, offs:offs, closed:[]}; /* 医院休诊现在是定期休诊（医院设定里设），日历按规则算 */
}
function krcLanes(list){
  var sorted = list.slice().sort(function(a,b){ return timeToMin(a.time)-timeToMin(b.time) || timeToMin(b.end)-timeToMin(a.end); }), lanes = [], res = [];
  sorted.forEach(function(b){ var s = timeToMin(b.time), li = -1; for(var i = 0; i < lanes.length; i++){ if(lanes[i] <= s){ li = i; break; } } if(li < 0){ li = lanes.length; lanes.push(0); } lanes[li] = timeToMin(b.end); res.push({b:b, lane:li}); });
  res.forEach(function(r0){ var s0 = timeToMin(r0.b.time), e0 = timeToMin(r0.b.end), mx = 0; res.forEach(function(o){ if(timeToMin(o.b.time) < e0 && timeToMin(o.b.end) > s0) mx = Math.max(mx, o.lane); }); r0.n = mx+1; });
  return res;
}
/* CMD-1014-19 一·2：医院层每块一行「时间 · 客人 · 类型 · 院长」（IN 占位的院长写「全院」） */
function krcOneLine(r0){
  var b = r0.b, tp = b.type==='术后管理' ? (/持有/.test(r0.label||'') ? '持有使用' : '术后到店') : (b.type==='预约' ? '预约' : b.type);
  return '<span style="white-space:nowrap;"><b>'+krEsc(b.time)+'</b> · '+krEsc(b.name||'')+' · '+krEsc(tp)+' · '+krEsc((b.who===KRB_HOSP || !b.who) ? '全院' : b.who)+'</span>';
}
/* 已经重叠的（旧数据 / 别的路径产生的）：两个块都标红框「时间冲突」，不自动改动任何一方（CMD-1015-21） */
function krcBlockConflict(r0){
  var b = r0.b, hid = krHospitalIdOfMe(); if(!b || !b.who || b.who===KRB_HOSP || b.type==='术后管理') return '';
  var h = krHData(), s = timeToMin(b.time), e = timeToMin(b.end), list = directorClashList(hid, b.who, b.date, s, e, {exceptBlockId:b.id});
  return list.length ? clashLines(list).join('；') : '';
}
function krcBlockHtml(r0, showWho){
  if(r0.b.type==='预约' && typeof krbBlockHtml==='function') return krbBlockHtml(r0, showWho);
  var b = r0.b, isS = b.type==='施术' || b.type==='面诊' || b.type==='术后管理', isC = b.type==='面诊', isP = b.type==='术后管理', s = Math.max(timeToMin(b.time), KRC_H0*60), e = Math.min(timeToMin(b.end), KRC_H1*60); if(e <= s) e = s + 20;
  var w = 100 / r0.n, top = (s - KRC_H0*60) * KRC_PX / 60, hgt = Math.max(16, (e - s) * KRC_PX / 60 - 2);
  var style = 'position:absolute;left:calc('+(r0.lane*w)+'% + 1px);width:calc('+w+'% - 3px);top:'+top+'px;height:'+hgt+'px;border-radius:5px;padding:2px 5px;font-size:10px;line-height:1.3;overflow:hidden;cursor:pointer;z-index:2;'+(r0.done ? 'opacity:.45;text-decoration:line-through;' : (krcIsPast(b) ? 'opacity:.5;filter:grayscale(1);' : ''))+(isP ? 'background:#E4EEE7;color:#2F6B4A;border:1px solid #B5D3C0;' : isC ? 'background:#E3EAF6;color:#2F4F86;border:1px solid #A9BDE0;' : isS ? 'background:#F3DFD3;color:#8A4A2A;border:1px solid #C9A38A;' : 'background:#E4E2DC;color:#777;');
  var cfl = krcBlockConflict(r0); if(cfl){ style += 'border:2px solid #D02B2B;box-shadow:0 0 0 1px #D02B2B;'; }
  var click = isS && r0.row ? (isP ? 'krOpenSubCard(\''+r0.row.clinicId+'\',\''+r0.row.id+'\',\''+b.subId+'\')' : (b.type==='施术' ? 'krOpenSubCard(\''+r0.row.clinicId+'\',\''+r0.row.id+'\')' : 'krShowCase(\''+r0.row.clinicId+'\',\''+r0.row.id+'\')')) : (isS ? '' : 'krcEdit(\''+b.id+'\')'); /* 术后管理 / 持有使用：点开弹出客人 / 项目 / 时间 +［客人已到店］（CMD-1013-13 三·1） */
  return '<div'+(isS ? '' : ' class="krc-busy"')+' onclick="event.stopPropagation();'+click+'" title="'+krEsc((cfl ? '时间冲突：和 '+cfl+' 重叠；点进去调整，系统不会自动改。\n' : '')+(isS ? b.time+'–'+b.end+' '+r0.label : '不可预约 '+b.time+'–'+b.end))+'" style="'+style+'">'+(cfl ? '<div style="color:#C1454A;font-weight:700;">⚠ 时间冲突</div>' : '')+(showWho && isS ? krcOneLine(r0) : (isS ? '<b>'+krEsc(b.time)+'</b> '+krEsc(r0.label)+(showWho ? '<br>'+krEsc(b.who) : '') : '不可预约'+(showWho ? '<br>'+krEsc(b.who) : '')))+'</div>';
}
function krcSubChip(x){ var s = x.s, r = x.row; return '<div onclick="krShowCase(\''+r.clinicId+'\',\''+r.id+'\')" title="'+krEsc(r.name+' · '+r.clinicName+'：'+s.content)+'" style="background:'+(s.done?'#E4EEE7':'#E8EEF6')+';color:'+(s.done?'var(--sage)':'#2F5F86')+';border-radius:4px;padding:1px 5px;margin:1px 0;font-size:10px;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;'+(s.done?'text-decoration:line-through;':'')+'">'+krEsc(r.name)+'·'+krEsc(s.content)+'</div>'; }
function krcGridHtml(days, ev){
  var who = krcWho(), showWho = who==='all', openDs = who!=='all' ? hospitalOpenDates(krHospitalIdOfMe(), who) : [];
  var hours = ''; for(var h2 = KRC_H0; h2 < KRC_H1; h2++) hours += '<div style="height:'+KRC_PX+'px;font-size:10px;color:var(--muted);text-align:right;padding-right:4px;box-sizing:border-box;border-top:1px solid #eee;line-height:1.25;">'+('<b style="color:var(--slate);">韩 '+pad2(h2)+':00</b><span style="display:block;font-size:9px;color:var(--dim);">印 '+krCounterTime(h2*60)+'</span>')+'</div>';
  var cell = 'border-left:1px solid var(--line);min-width:0;box-sizing:border-box;', lab = 'font-size:10px;color:var(--muted);padding:3px 4px;text-align:right;';
  var r1 = '<div></div>' /* CMD-1014-19：时间轴每个时间前标「韩 / 印」，拿掉最上面「印尼 / 韩国」小标题 */, r2 = '<div style="'+lab+'background:#faf8f3;">'+('固定栏')+'</div>', r3 = '<div style="'+lab+'">子项</div>', r4 = '<div>'+hours+'</div>';
  days.forEach(function(ds){
    var dS = ev.surg.filter(function(x){ return x.b.date===ds; }), dB = ev.busy.filter(function(b){ return b.date===ds; }), allB = dS.map(function(x){ return Object.assign({}, x.b, {_x:x}); }).concat(dB), dirs0 = krcDirectors(), lanes = krcLanes(allB); /* CMD-1014-19：医院层不分栏，同时段并排 */
    var offs = ev.offs.filter(function(o){ return offApplies(o, ds); }), subs = ev.subs.filter(function(x){ return x.s.date===ds; }), isToday = ds===krToday(), open = openDs.indexOf(ds)>-1;
    var lines = ''; for(var h3 = KRC_H0; h3 < KRC_H1; h3++) lines += '<div style="position:absolute;left:0;right:0;top:'+((h3-KRC_H0)*KRC_PX)+'px;border-top:1px solid #f0ece3;"></div>';
    var hrs0 = hospitalHours(krHospitalIdOfMe()); /* CMD-1014-19 一·8：营业时间外（前后各 2 小时的范围里）浅灰底，和营业时间分开；仍可约（弹确认） */
    if(timeToMin(hrs0.open) > KRC_H0*60) lines += '<div title="营业时间外" style="position:absolute;left:0;right:0;top:0;height:'+((timeToMin(hrs0.open)-KRC_H0*60)*KRC_PX/60)+'px;background:var(--neutral-25);pointer-events:none;z-index:0;"></div>';
    if(timeToMin(hrs0.close) < KRC_H1*60) lines += '<div title="营业时间外" style="position:absolute;left:0;right:0;top:'+((timeToMin(hrs0.close)-KRC_H0*60)*KRC_PX/60)+'px;bottom:0;background:var(--neutral-25);pointer-events:none;z-index:0;"></div>';
    var hc = hospitalClosedOn(krHospitalIdOfMe(), ds), cf = hc ? '' : hospitalClosedFrom(krHospitalIdOfMe(), ds);
    var lu = hospitalLunch(krHospitalIdOfMe()); if(lu && !hc) lines += '<div title="午休" style="position:absolute;left:0;right:0;top:'+((timeToMin(lu.from)-KRC_H0*60)*KRC_PX/60)+'px;height:'+(Math.min(14, (timeToMin(lu.to)-timeToMin(lu.from))*KRC_PX/60))+'px;background:#F3F1EC;color:#b5b0a4;font-size:10px;text-align:center;pointer-events:none;z-index:0;">午休</div>';
    var cbf = hc ? '' : hospitalClosedBefore(krHospitalIdOfMe(), ds); if(cbf) lines += '<div title="医院休诊（半天营业）" style="position:absolute;left:0;right:0;top:0;height:'+Math.max(0, (timeToMin(cbf)-KRC_H0*60)*KRC_PX/60)+'px;background:repeating-linear-gradient(45deg,#F7F4EF,#F7F4EF 6px,#EFEBE4 6px,#EFEBE4 12px);pointer-events:none;z-index:1;"></div>';
    if(cf) lines += '<div title="医院休诊（定期休诊）" style="position:absolute;left:0;right:0;top:'+Math.max(0, (timeToMin(cf)-KRC_H0*60)*KRC_PX/60)+'px;bottom:0;background:repeating-linear-gradient(45deg,#F7F4EF,#F7F4EF 6px,#EFEBE4 6px,#EFEBE4 12px);pointer-events:none;z-index:1;"></div>'; /* 部分时段休诊：该时段灰色斜纹 */
    if(hc){ r1 += '<div'+(' title="'+ds.slice(5)+' 医院休诊"')+' style="'+cell+'text-align:center;font-size:11px;padding:4px 0;background:#EFEBE4;">'+ds.slice(5)+'<br><span style="font-size:9px;color:var(--terracotta);font-weight:700;">'+(window.DS_NEW ? '休诊' : '医院休诊')+'</span></div>'; r2 += '<div style="'+cell+'background:#EFEBE4;border-top:1px solid var(--line);"></div>'; r3 += '<div style="'+cell+'background:#EFEBE4;border-top:1px solid var(--line);"></div>'; r4 += '<div style="'+cell+'height:'+((KRC_H1-KRC_H0)*KRC_PX)+'px;background:repeating-linear-gradient(45deg,#F7F4EF,#F7F4EF 6px,#EFEBE4 6px,#EFEBE4 12px);border-top:1px solid var(--line);"></div>'; return; }
    r1 += '<div'+(isToday && days.length>1?' class="krc-head-today"':'')+' style="'+cell+'text-align:center;font-size:12px;padding:4px 0;'+(isToday?'font-weight:700;color:var(--terracotta);':'')+'">'+ds.slice(5)+' 周'+krcDow(ds)+krCapHeadHtml(ds, allB, who)+'</div>';
    r2 += '<div style="'+cell+'padding:2px;background:#faf8f3;border-top:1px solid var(--line);">'+(krcFixedHtml(ds, offs, who==='all' ? null : function(m){ return m.author===who; }))+'</div>';
    r3 += '<div style="'+cell+'padding:2px;border-top:1px solid var(--line);">'+subs.map(krcSubChip).join('')+'</div>';
    r4 += '<div'+(isToday && days.length>1?' class="krc-col-today"':'')+' style="'+cell+'position:relative;height:'+((KRC_H1-KRC_H0)*KRC_PX)+'px;background:#fff;border-top:1px solid var(--line);cursor:cell;" onmousemove="krcHover(this,event)" onmouseleave="krcHoverOff(this)" onclick="krcCellClick(\''+ds+'\',event,this)">'+(days.indexOf(krToday())>-1 ? (ds===days[0] ? todoNowLineHtml() : todoNowLineHtml().replace(/<span>[\s\S]*?<\/span>/, '')) : '')+'<div class="krc-hl" style="display:none;position:absolute;left:0;right:0;height:'+(KRC_PX/2)+'px;background:rgba(190,120,90,.12);pointer-events:none;"></div>'+lines+
      lanes.map(function(r0){ var x = r0.b._x; return krcBlockHtml(x ? {b:r0.b, lane:r0.lane, n:r0.n, row:x.row, label:x.label, done:x.done} : r0, showWho); }).join('')+'</div>';
  });
  r3 = ''; /* 子项行已废弃 */
  var cols = days.map(function(ds){ return hospitalClosedOn(krHospitalIdOfMe(), ds) ? 'minmax(0,.34fr)' : 'minmax(0,1fr)'; }).join(' '); /* 医院休诊日：整列 1/3 宽 */
  return '<div style="display:grid;flex-shrink:0;grid-template-columns:58px '+cols+';border:1px solid var(--line);border-radius:10px;overflow:hidden;">'+r1+r2+r3+r4+'</div>';
}

/* ---------- CMD-1014-15 一：日视图按院长分栏（全部院长 = 每位院长一栏；单一院长 / 一般院长 = 一栏；栏顶写院长名字） ----------
   固定栏：每位院长的 OFF / memo 放在他自己那一栏；室长的 OFF / memo 放在最上面一行「全院」（横跨全部院长栏，左边的轴格写「全院」）；
   午休、休诊、现在时间线、当前时段框每栏都有（同一高度，看起来横贯）；栏宽 = 平均分，每栏至少 180px，不够就左右滑动，左边时间轴固定不动。 */
function krcDayColsHtml(ds, ev){
  var who = krcWho(), dirs = who==='all' ? krcDirectors() : [who], n = Math.max(1, dirs.length), hid = krHospitalIdOfMe(), isToday = ds===krToday();
  var allDirNames = hospitalDirectors(hid).map(function(d){ return d.name; });
  var hc = hospitalClosedOn(hid, ds), cf = hc ? '' : hospitalClosedFrom(hid, ds), cbf = hc ? '' : hospitalClosedBefore(hid, ds), lu = hospitalLunch(hid);
  var offs = ev.offs.filter(function(o){ return offApplies(o, ds); });
  var hatch = 'repeating-linear-gradient(45deg,#F7F4EF,#F7F4EF 6px,#EFEBE4 6px,#EFEBE4 12px)';
  var sticky = 'position:sticky;left:0;z-index:6;background:#fff;box-sizing:border-box;';
  var hours = ''; for(var h2 = KRC_H0; h2 < KRC_H1; h2++) hours += '<div style="height:'+KRC_PX+'px;font-size:10px;color:var(--muted);text-align:right;padding-right:4px;box-sizing:border-box;border-top:1px solid #eee;line-height:1.25;">'+('<b style="color:var(--slate);">韩 '+pad2(h2)+':00</b><span style="display:block;font-size:9px;color:var(--dim);">印 '+krCounterTime(h2*60)+'</span>')+'</div>';
  var cell = 'border-left:1px solid var(--line);min-width:0;box-sizing:border-box;', lab = 'font-size:10px;color:var(--muted);padding:3px 4px;text-align:right;';
  var corner = '<div style="'+sticky+'font-size:10px;line-height:1.2;padding:3px 4px;text-align:right;">'+('<div style="font-weight:700;color:var(--slate);">韩国</div><div style="font-size:9px;color:var(--dim);">印尼</div>')+'</div>';
  var r1 = corner, rAll = '<div style="'+sticky+lab+'background:#faf8f3;border-top:1px solid var(--line);font-weight:700;">全院</div>', r2 = '<div style="'+sticky+lab+'background:#faf8f3;border-top:1px solid var(--line);">'+('固定栏')+'</div>', r4 = '<div style="'+sticky+'">'+hours+'</div>';
  var coordOffs = offs.filter(function(o){ return o.kind!=='director'; }), isDirMemo = function(m){ return allDirNames.indexOf(m.author)>-1; };
  rAll += '<div style="'+cell+'grid-column:2 / -1;padding:2px;background:#faf8f3;border-top:1px solid var(--line);">'+krcFixedHtml(ds, coordOffs, function(m){ return !isDirMemo(m); })+'</div>';
  var lines = ''; for(var h3 = KRC_H0; h3 < KRC_H1; h3++) lines += '<div style="position:absolute;left:0;right:0;top:'+((h3-KRC_H0)*KRC_PX)+'px;border-top:1px solid #f0ece3;"></div>';
  if(lu && !hc) lines += '<div title="午休" style="position:absolute;left:0;right:0;top:'+((timeToMin(lu.from)-KRC_H0*60)*KRC_PX/60)+'px;height:'+Math.min(14, (timeToMin(lu.to)-timeToMin(lu.from))*KRC_PX/60)+'px;background:#F3F1EC;color:#b5b0a4;font-size:10px;text-align:center;pointer-events:none;z-index:0;">午休</div>';
  if(cbf) lines += '<div title="医院休诊（半天营业）" style="position:absolute;left:0;right:0;top:0;height:'+Math.max(0, (timeToMin(cbf)-KRC_H0*60)*KRC_PX/60)+'px;background:'+hatch+';pointer-events:none;z-index:1;"></div>';
  if(cf) lines += '<div title="医院休诊（定期休诊）" style="position:absolute;left:0;right:0;top:'+Math.max(0, (timeToMin(cf)-KRC_H0*60)*KRC_PX/60)+'px;bottom:0;background:'+hatch+';pointer-events:none;z-index:1;"></div>';
  dirs.forEach(function(name, i){
    r1 += '<div class="krc-dirhead" style="'+cell+'text-align:center;font-size:12px;font-weight:700;padding:6px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+krEsc(name)+'">'+krEsc(name)+'</div>';
    var myOffs = offs.filter(function(o){ return o.kind==='director' && o.who===name; });
    r2 += '<div style="'+cell+'padding:2px;background:#faf8f3;border-top:1px solid var(--line);">'+krcFixedHtml(ds, myOffs, function(m){ return m.author===name; })+'</div>';
    var allB = ev.surg.filter(function(x){ return x.b.date===ds && x.b.who===name; }).map(function(x){ return Object.assign({}, x.b, {_x:x}); }).concat(ev.busy.filter(function(b){ return b.date===ds && b.who===name; }));
    var lanes = krcLanes(allB);
    var nowHtml = isToday ? (i===0 ? todoNowLineHtml() : todoNowLineHtml().replace(/<span>[\s\S]*?<\/span>/, '')) + krcNowFrameHtml() : '';
    if(hc) r4 += '<div style="'+cell+'height:'+((KRC_H1-KRC_H0)*KRC_PX)+'px;background:'+hatch+';border-top:1px solid var(--line);"></div>';
    else r4 += '<div style="'+cell+'position:relative;height:'+((KRC_H1-KRC_H0)*KRC_PX)+'px;background:#fff;border-top:1px solid var(--line);cursor:cell;" onmousemove="krcHover(this,event)" onmouseleave="krcHoverOff(this)" onclick="krcCellClick(\''+ds+'\',event,this,\''+krEsc(name).replace(/\'/g,'')+'\')">'+nowHtml+'<div class="krc-hl" style="display:none;position:absolute;left:0;right:0;height:'+(KRC_PX/2)+'px;background:rgba(190,120,90,.12);pointer-events:none;"></div>'+lines+
      lanes.map(function(r0){ var x = r0.b._x; return krcBlockHtml(x ? {b:r0.b, lane:r0.lane, n:r0.n, row:x.row, label:x.label, done:x.done} : r0, false); }).join('')+'</div>';
  });
  var hospB = (typeof KRB_HOSP!=='undefined') ? ev.surg.filter(function(x){ return x.b.date===ds && x.b.who===KRB_HOSP; }).map(function(x){ return Object.assign({}, x.b, {_x:x}); }) : [];
  if(hospB.length){ /* CMD-1014-18 四·2：全院的占位预约没有院长，另放一栏「全院预约」 */
    r1 += '<div class="krc-dirhead" style="'+cell+'text-align:center;font-size:12px;font-weight:700;padding:6px 4px;white-space:nowrap;">全院预约</div>';
    r2 += '<div style="'+cell+'padding:2px;background:#faf8f3;border-top:1px solid var(--line);"></div>';
    r4 += '<div style="'+cell+'position:relative;height:'+((KRC_H1-KRC_H0)*KRC_PX)+'px;background:#fff;border-top:1px solid var(--line);">'+(isToday ? todoNowLineHtml().replace(/<span>[\s\S]*?<\/span>/, '') : '')+lines+krcLanes(hospB).map(function(r0){ var x = r0.b._x; return krcBlockHtml({b:r0.b, lane:r0.lane, n:r0.n, row:x.row, label:x.label, done:x.done}, false); }).join('')+'</div>';
    n++;
  }
  return '<div style="overflow-x:auto;flex-shrink:0;border:1px solid var(--line);border-radius:10px;"><div style="display:grid;grid-template-columns:44px repeat('+n+',minmax(180px,1fr));min-width:'+(44+180*n)+'px;">'+r1+rAll+r2+r4+'</div></div>';
}
function krcHover(el, e){ if(krcWho()==='all') return; var hl = el.querySelector('.krc-hl'); if(!hl) return; var y = e.clientY - el.getBoundingClientRect().top, slot = Math.floor(y / (KRC_PX/2)); hl.style.display = 'block'; hl.style.top = (slot * KRC_PX/2)+'px'; }
function krcHoverOff(el){ var hl = el.querySelector('.krc-hl'); if(hl) hl.style.display = 'none'; }
function krcCellClick(ds, e, el, dirArg){
  if(krcWho()==='all') return; /* CMD-1014-19：医院层只显示预约，加不可预约 / 标 OFF 只在某位院长层 */
  if(krcIsDirector() && krcViewAll()) return; /* 代表院长看全部院长：只看不操作 */
  var y = e.clientY - el.getBoundingClientRect().top, mins = KRC_H0*60 + Math.floor(y / (KRC_PX/2)) * 30, st = minToTime(Math.min(mins, KRC_H1*60-30));
  var dirs = krcDirs0(); KRC.popForm.who = dirArg && dirs.indexOf(dirArg)>-1 ? dirArg : (krcWho()!=='all' ? krcWho() : (KRC.popForm.who && dirs.indexOf(KRC.popForm.who)>-1 ? KRC.popForm.who : dirs[0]));
  KRC.popForm.start = st; KRC.popForm.end = minToTime(Math.min(timeToMin(st)+60, 24*60-30)); KRC.pop = {date:ds}; KRC.edit = null; krcRender();
}
function krcDirs0(){ return krcDirectors(); }
function krcPopSet(k, v){ KRC.popForm[k] = v; }
function krcAddBusy(){
  var f = KRC.popForm, h = krHData();
  if(!f.who || !krcCanEdit(f.who)){ alert('没有权限给这位院长加不可预约'); return; }
  if(timeToMin(f.end) <= timeToMin(f.start)){ alert('结束时间要晚于开始时间'); return; }
  var be = krBusySlotError(krHospitalIdOfMe(), f.who, KRC.pop.date, f.start, f.end); if(be){ krBlock(be); return; } /* 不能和该院长已有的施术重叠 */
  h.directorSchedule = h.directorSchedule||{}; (h.directorSchedule[f.who] = h.directorSchedule[f.who]||[]).push({id:'sb'+(SCHED_SEQ++)+Math.floor(Math.random()*1000), who:f.who, date:KRC.pop.date, time:f.start, end:f.end, type:'不可预约', title:'不可预约', note:''});
  normSchedBlocks(krHospitalIdOfMe()); logOp('其他', '加不可预约：'+f.who+' '+KRC.pop.date+' '+f.start+'–'+f.end, '日程'); KRC.pop = null; Store.touch(); krcRender();
}
function krcAddOff(){
  var f = KRC.popForm, h = krHData();
  if(!f.who || !krcCanEdit(f.who)){ alert('没有权限给这位院长标 OFF'); return; }
  /* 同一位院长同一时间只能有一件事（KR-SCHD-01）：OFF 的时段里已经有这位院长的施术 / 面诊 → 挡下（CMD-1012-01） */
  var hid0 = krHospitalIdOfMe(), part0 = f.part||'全天', rg0 = part0==='全天' ? ['00:00','24:00'] : krHalfRange(hid0, part0), a0 = rg0[0]==='00:00' ? 0 : timeToMin(rg0[0]), z0 = rg0[1]==='24:00' ? 1440 : timeToMin(rg0[1]);
  var cl0 = directorClashList(hid0, f.who, KRC.pop.date, a0, z0, {rows:krDirectorRowsAll(f.who)});
  if(cl0.length){ krBlock(f.who+' 在这个时段已有：\n'+clashLines(cl0).map(function(x){ return '· '+x; }).join('\n')+'\n不能标 OFF；请先调整那一件。'); return; }
  h.offs = h.offs||[]; h.offs.push({id:'off'+Date.now(), date:KRC.pop.date, who:f.who, kind:'director', part:f.part||'全天', note:'', by:ME_NAME}); /* 只有单次（整天 / 半天），逐条新增，每条可各自删除（2026-10-08 起不再有每周固定） */
  logOp('其他', '标 OFF：'+f.who+' '+KRC.pop.date+' '+(f.part||'全天'), '日程'); KRC.pop = null; Store.touch(); krcRender();
}
function krcDelOff(id){ var h = krHData(), o = (h.offs||[]).filter(function(x){ return x.id===id; })[0]; if(!o || !krcCanEdit(o.who) || !confirm('删除这条 OFF（'+o.who+' '+o.date+'）？')) return; h.offs = h.offs.filter(function(x){ return x.id!==id; }); Store.touch(); krcRender(); }
function krcEdit(id){ KRC.edit = id; KRC.pop = null; krcRender(); }
function krcBusyById(id){ var h = krHData(), r0 = null; Object.keys(h.directorSchedule||{}).forEach(function(n){ (h.directorSchedule[n]||[]).forEach(function(b){ if(b.id===id) r0 = b; }); }); return r0; }
function krcSaveBusy(){ var b = krcBusyById(KRC.edit); if(!b || !krcCanEdit(b.who)) return; var g = function(i){ return document.getElementById(i).value; }; if(timeToMin(g('krc-e-end')) <= timeToMin(g('krc-e-start'))){ alert('结束时间要晚于开始时间'); return; } var be2 = krBusySlotError(krHospitalIdOfMe(), b.who, g('krc-e-date'), g('krc-e-start'), g('krc-e-end'), b.id); if(be2){ krBlock(be2); return; } b.date = g('krc-e-date'); b.time = g('krc-e-start'); b.end = g('krc-e-end'); KRC.edit = null; normSchedBlocks(krHospitalIdOfMe()); Store.touch(); krcRender(); }
function krcDelBusy(){ var h = krHData(), b = krcBusyById(KRC.edit); if(!b || !krcCanEdit(b.who) || !confirm('删除这个不可预约？')) return; h.directorSchedule[b.who] = h.directorSchedule[b.who].filter(function(x){ return x.id!==b.id; }); KRC.edit = null; Store.touch(); krcRender(); }
/* 月视图：单一院长时点日期 = 设定该院长当天是否开放施术；全部院长时点日期 = 看当天 */
function krcMonthClick(ds){ KRC.anchor = krcWeekStartMon(ds); krcSet('mode','week'); } /* CMD-1014-02：点日期 = 进那一周；日历上不设定开放施术日期（CMD-1014-16 清掉旧的开放日期代码） */
function krcMonthHtml(ev){
  var a = krcAnchor(), ym = a.slice(0,7), start = krcWeekStartMon(ym+'-01'), cells = '', who = krcWho(), openDs = who!=='all' ? hospitalOpenDates(krHospitalIdOfMe(), who) : [];
  for(var i = 0; i < 42; i++){
    var ds = krcAdd(start, i), inM = ds.slice(0,7)===ym, ns = ev.surg.filter(function(x){ return x.b.date===ds; }).length, nsub = ev.subs.filter(function(x){ return x.s.date===ds; }).length, no = ev.offs.filter(function(o){ return offApplies(o, ds); }).length, nb = ev.busy.filter(function(b){ return b.date===ds; }).length, open = openDs.indexOf(ds)>-1;
    cells += '<div onclick="krcMonthClick(\''+ds+'\')" style="min-height:64px;padding:4px 6px;border:1px solid var(--line);background:'+(hospitalClosedOn(krHospitalIdOfMe(), ds)?'#EFEBE4':inM?'#fff':'#faf8f3')+';cursor:pointer;font-size:11px;'+(ds===krToday()?'outline:2px solid var(--terracotta);':'')+'"><div style="color:'+(inM?'inherit':'var(--muted)')+';">'+ds.slice(8)+(inM && !hospitalClosedOn(krHospitalIdOfMe(), ds) ? krCapHeadHtml(ds, ev.surg.filter(function(x){ return x.b.date===ds; }).map(function(x){ return x.b; }).concat(ev.busy.filter(function(b){ return b.date===ds; })), who) : '')+'</div>'+(ns?'<div style="color:#8A4A2A;">施术 '+ns+'</div>':'')+(nsub?'<div style="color:#2F5F86;">子项 '+nsub+'</div>':'')+(nb?'<div style="color:#999;">不可预约 '+nb+'</div>':'')+(no?'<div style="color:var(--muted);">OFF '+no+'</div>':'')+'</div>';
  }
  return '<div style="display:grid;flex-shrink:0;grid-template-columns:repeat(7,1fr);">'+['一','二','三','四','五','六','日'].map(function(x){ return '<div style="text-align:center;font-size:11px;color:var(--muted);padding:3px;">周'+x+'</div>'; }).join('')+cells+'</div>'+
    '<div style="font-size:11px;color:var(--muted);">'+(who==='all' ? '点日期看当天；选择单一院长后，点日期可设定该院长当天是否开放施术（绿色 = 开放）。' : '点日期 = 开放 / 关闭 '+krEsc(who)+' 当天的施术（IN 选施术日期时只看得到开放的日期）。')+'</div>';
}
function krcPopHtml(){
  var f = KRC.popForm, dirs = krcDirectors(), inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:7px;';
  return '<div class="card" style="padding:10px 14px;font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex-shrink:0;"><b>'+KRC.pop.date+'</b>'+
    (krcWho()==='all' && !krcIsDirector() ? '<select onchange="krcPopSet(\'who\',this.value)" style="'+inp+'">'+dirs.map(function(n){ return '<option'+(f.who===n?' selected':'')+'>'+krEsc(n)+'</option>'; }).join('')+'</select>' : '<span>'+krEsc(f.who)+'</span>')+
    '<select onchange="krcPopSet(\'start\',this.value)" style="'+inp+'">'+krTimeOptions(f.start,'range')+'</select>–<select onchange="krcPopSet(\'end\',this.value)" style="'+inp+'">'+krTimeOptions(f.end,'range')+'</select><button class="btn-outline" onclick="krcAddBusy()">加不可预约</button>'+
    '<span style="color:var(--muted);">｜</span><select onchange="krcPopSet(\'part\',this.value)" style="'+inp+'"><option>全天</option><option>上午</option><option>下午</option></select><button class="btn-outline" onclick="krcAddOff()">标 OFF</button>'+'<button class="btn-ghost" onclick="KRC.pop=null;krcRender()">取消</button><span style="font-size:11px;color:var(--muted);">不可预约不用写原因，也不强制登记</span></div>';
}
function krcEditHtml(){
  var b = krcBusyById(KRC.edit); if(!b) return ''; var can = krcCanEdit(b.who), inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:7px;';
  return '<div class="card" style="padding:10px 14px;font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex-shrink:0;"><b>不可预约 · '+krEsc(b.who)+'</b><input type="date" id="krc-e-date" value="'+b.date+'" style="'+inp+'" '+(can?'':'disabled')+'><select id="krc-e-start" style="'+inp+'" '+(can?'':'disabled')+'>'+krTimeOptions(b.time,'range')+'</select>–<select id="krc-e-end" style="'+inp+'" '+(can?'':'disabled')+'>'+krTimeOptions(b.end,'range')+'</select>'+(can ? '<button class="btn-primary" onclick="krcSaveBusy()">保存</button><button class="btn-outline" onclick="krcDelBusy()">删除</button>' : '')+'<button class="btn-ghost" onclick="KRC.edit=null;krcRender()">关闭</button></div>';
}
/* 日历整块（工作台下半部） */
function krCalendarHtml(){
  var a = krcAnchor(), ev = krcEvents(), dirs = krcDirectors(), inp = 'padding:6px 9px;border:1px solid var(--line);border-radius:7px;font-size:12px;';
  var days = KRC.mode==='week' ? [0,1,2,3,4,5,6].map(function(i){ return krcAdd(a, i); }) : [a]; /* 周视图：今天在第一栏 */
  var title = KRC.mode==='month' ? (a.slice(0,4)+' 年 '+parseInt(a.slice(5,7),10)+' 月'+(relMonthLabel(a.slice(0,7), krToday().slice(0,7)) ? '（'+relMonthLabel(a.slice(0,7), krToday().slice(0,7))+'）' : '')) : (KRC.mode==='week' ? days[0].slice(5)+' ～ '+days[6].slice(5)+(relWeekLabel(days[0], krToday()) ? '（'+relWeekLabel(days[0], krToday())+'）' : '') : a+' 周'+krcDow(a)+(relDayLabel(relDayDiff(a, krToday())) ? '（'+relDayLabel(relDayDiff(a, krToday()))+'）' : ''));
  var tabs = '<div class="cal-switch">'+['month','week','day'].map(function(m){ return '<span class="'+(KRC.mode===m?'active':'')+'" onclick="krcSet(\'mode\',\''+m+'\')">'+{day:'日',week:'周',month:'月'}[m]+'</span>'; }).join('')+'</div>'; /* CMD-1015-02：照 IN 的排法，顺序 月｜周｜日 */
  var layerSpan = function(v, txt, on){ return '<span class="'+(on?'active':'')+'" style="white-space:nowrap;" onclick="krcPick(\''+v+'\')">'+krEsc(txt)+'</span>'; };
  var me0 = currentAccount(), viewSel = (me0 && me0.role==='kr_owner') ? '<select onchange="krcSetViewAll(this.value)" class="cal-nav-btn" style="padding:6px 9px;"><option value="me"'+(krcViewAll()?'':' selected')+'>看自己</option><option value="all"'+(krcViewAll()?' selected':'')+'>全部院长（只看）</option></select>' : '';
  var sel = (krcIsDirector() && !(krcViewAll())) ? '' : '<div class="cal-switch" style="max-width:100%;overflow-x:auto;">'+layerSpan('__H','医院',KRC.layer!=='director')+dirs.map(function(n){ return layerSpan(n, n, KRC.layer==='director' && krcPersonName()===n); }).join('')+'</div>';
  var dot = function(c, t){ return '<span><span class="dotmark" style="background:'+c+';"></span>'+t+'</span>'; };
  var legend = '<div class="cal-legend">'+dot('#8A4A2A','到院施术')+dot('#2F4F86','面诊')+dot('#2F6B4A','术后到店')+dot('#9A948B','不可预约')+dot('#C9C3B8','OFF（固定栏）')+'</div>';
  var nav = '<div class="cal-nav"><button class="cal-nav-btn" onclick="krcShift(-1)">‹</button><b class="cal-day-title" style="font-size:13px;white-space:nowrap;'+(KRC.mode==='month' ? 'cursor:pointer;" onclick="krcMonthPicker()" title="选择年月' : '')+'">'+title+'</b><button class="cal-nav-btn" onclick="krcShift(1)">›</button><button class="cal-nav-btn cal-nav-today" onclick="krcToday()">今天</button></div>';
  var memoBtn = '<button class="cal-nav-btn" onclick="krfxOpen()" title="新增备忘 / OFF">＋ memo</button>';
  /* CMD-1015-02：拿掉卡片标题「日历 · 韩国时间…」和底部说明；工具列 左 = 图例｜中 = 第一层｜右 = 月周日 → memo → ‹ 日期 › 今天（同 IN） */
  return '<div id="kr-cal" class="card" style="padding:20px 22px;display:flex;flex-direction:column;gap:14px;"><div class="cal-toolbar">'+legend+sel+viewSel+'<div style="display:flex;align-items:center;gap:14px;">'+tabs+memoBtn+nav+'</div></div>'+
    (KRC.pop ? krcPopHtml() : '')+(KRC.edit ? krcEditHtml() : '')+(KRC.mode==='month' ? krcMonthHtml(ev) : '<div class="krc-outwrap" style="height:calc(100vh - 300px);min-height:420px;overflow:auto;border-bottom:1px solid var(--border2);">'+calOutBar('krc','b', KRC_NEED.b)+krcGridHtml(days, ev)+calOutBar('krc','a', KRC_NEED.a)+'</div>')+'</div>';
}

/* ---------- 三、KR 院长管理（KR-DOC-01）：院长名单 ≠ 院长账号；IN 选院长、诊疗方案署名、案例库、对话都读这份名单 ---------- */
var KRD = {edit:null, draft:null};
function krdDoctors(){ return hospitalDirectors(krHospitalIdOfMe()); }
function krdAccountOf(dr){
  var a = ACCOUNTS.filter(function(x){ return x.hospitalId===krHospitalIdOfMe() && x.role==='kr_director' && x.name===dr.name; })[0];
  if(a) return '有账号 '+a.id;
  var o = ACCOUNTS.filter(function(x){ return x.hospitalId===krHospitalIdOfMe() && x.role==='kr_owner' && x.name===dr.name; })[0];
  return o ? '代表院长（老板账号 '+o.id+' 只管营运，医生身份在名单里）' : '没有账号（日程和 OFF 由室长代为登记）';
}
function krdRender(){ ADMIN_RENDER.krdoctors(document.getElementById('admin-body')); }
function krdOpen(id){
  var h = krHData(), dr = id==='new' ? null : krdDoctors().filter(function(x){ return x.id===id; })[0];
  KRD.edit = id; KRD.draft = JSON.parse(JSON.stringify(dr || {id:'', name:'', nameEn:'', nameZh:'', title:'院长', color:'#C9B8A3', photo:'', career:[], certs:[], societies:[], specialties:[], active:true}));
  krdRender();
}
function krdClose(){ KRD.edit = null; KRD.draft = null; krdRender(); }
function krdField(k, v){ KRD.draft[k] = v; }
function krdItemAdd(list){ KRD.draft[list].push({ko:'', zh:'', id:'', auto:true, when:'现'}); krdRender(); }
function krdItemDel(list, i){ KRD.draft[list].splice(i, 1); krdRender(); }
/* 韩文改了 → 演示翻译自动更新印尼文 / 中文（没被手改过时）；之后可以直接改翻译 */
function krdItemSet(list, i, k, v){
  var it = KRD.draft[list][i]; it[k] = v;
  if(k==='ko' && it.auto!==false){ it.zh = demoTranslate(v,'ko','zh'); it.id = demoTranslate(v,'ko','id'); krdRender(); }
  else if(k==='zh' || k==='id') it.auto = false;
}
function krdSpecToggle(name, on){ var a = KRD.draft.specialties, i = a.indexOf(name); if(on && i<0) a.push(name); if(!on && i>-1) a.splice(i, 1); }
function krdPhoto(input){ var f = input.files && input.files[0]; if(!f) return; var r = new FileReader(); r.onload = function(){ KRD.draft.photo = r.result; krdRender(); }; r.readAsDataURL(f); }
function krdSave(){
  var h = krHData(), hid = krHospitalIdOfMe(), d0 = KRD.draft;
  if(!canDo('krdoctors')){ alert('只有代表院长、管理者可以编辑院长名单'); return; }
  if(!(d0.name||'').trim()){ alert('请填韩文姓名（例如 KD1 院长）'); return; }
  var list = krdDoctors();
  if(!KRD.edit || KRD.edit==='new'){
    if(list.some(function(x){ return x.name===d0.name.trim(); })){ alert('名单里已经有这位院长'); return; }
    d0.id = hid+'-D'+(list.length+1); d0.name = d0.name.trim(); list.push(d0); 
    logOp('其他', '新增院长：'+d0.name, '院长管理');
  } else {
    var cur = list.filter(function(x){ return x.id===KRD.edit; })[0]; d0.name = cur.name; /* 姓名是案件/日程的关联键，已有院长不改姓名 */
    Object.keys(d0).forEach(function(k){ cur[k] = d0[k]; });
    logOp('其他', '修改院长资料：'+cur.name, '院长管理');
  }
  Store.touch(); KRD.edit = null; KRD.draft = null; krdRender();
}
function krdToggleActive(id){
  var dr = krdDoctors().filter(function(x){ return x.id===id; })[0]; if(!dr || !canDo('krdoctors')) return;
  if(dr.active && !confirm('停用后不再出现在 IN 的选院长选项里；已有案件照常显示名字，案例库显示"-"。确认停用？')) return;
  dr.active = !dr.active; logOp('其他', (dr.active ? '启用' : '停用')+'院长：'+dr.name, '院长管理'); Store.touch(); krdRender();
}
function krdListEditor(label, list, withWhen){
  var inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;';
  return '<div style="margin:8px 0;"><div style="font-size:12px;font-weight:700;margin-bottom:4px;">'+label+'（韩文填写，自动演示翻译成中文 / 印尼文，可修改）</div>'+KRD.draft[list].map(function(it, i){
    return '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0;">'+(withWhen ? '<select onchange="krdItemSet(\''+list+'\','+i+',\'when\',this.value)" style="'+inp+'"><option'+(it.when==='现'?' selected':'')+'>现</option><option'+(it.when==='前'?' selected':'')+'>前</option></select>' : '')+
      '<input value="'+krEsc(it.ko)+'" onchange="krdItemSet(\''+list+'\','+i+',\'ko\',this.value)" placeholder="한국어" style="'+inp+'flex:1;min-width:150px;"><input value="'+krEsc(it.zh)+'" oninput="krdItemSet(\''+list+'\','+i+',\'zh\',this.value)" placeholder="中文" style="'+inp+'width:150px;"><input value="'+krEsc(it.id)+'" oninput="krdItemSet(\''+list+'\','+i+',\'id\',this.value)" placeholder="Indonesia" style="'+inp+'width:150px;"><a href="#" onclick="krdItemDel(\''+list+'\','+i+');return false;">删除</a></div>';
  }).join('')+'<button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="krdItemAdd(\''+list+'\')">+ 添加</button></div>';
}
function krdEditor(){
  var d0 = KRD.draft, inp = 'padding:6px 9px;border:1px solid var(--line);border-radius:7px;', hid = krHospitalIdOfMe();
  var projs = ((HOSPITAL_DATA[hid]||{}).projects||[]).filter(function(p){ return p.active && !isKrPostcareCat(p.categoryId); });
  var ph = d0.photo ? '<img src="'+d0.photo+'" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">' : '<span class="ds-avl" style="width:64px;height:64px;border-radius:50%;background:'+(d0.color||'#ddd')+';display:inline-flex;align-items:center;justify-content:center;font-size:22px;color:#fff;">'+krEsc((d0.name||'?').charAt(0))+'</span>';
  return krCardBox((KRD.edit==='new' ? '新增院长' : '编辑院长：'+krEsc(d0.name)),
    '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">'+ph+'<label style="font-size:12px;">照片 <input type="file" accept="image/*" onchange="krdPhoto(this)"></label><span style="font-size:11px;color:var(--muted);">演示：上传的照片只存在内存里，刷新后消失</span></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;"><input placeholder="韩文姓名（如 KD1 院长）" value="'+krEsc(d0.name)+'" oninput="krdField(\'name\',this.value)" '+(KRD.edit==='new'?'':'disabled ')+'style="'+inp+'"><input placeholder="English" value="'+krEsc(d0.nameEn)+'" oninput="krdField(\'nameEn\',this.value)" style="'+inp+'"><input placeholder="中文（可选）" value="'+krEsc(d0.nameZh)+'" oninput="krdField(\'nameZh\',this.value)" style="'+inp+'"><select onchange="krdField(\'title\',this.value)" style="'+inp+'"><option'+(d0.title==='院长'?' selected':'')+'>院长</option><option'+(d0.title==='代表院长'?' selected':'')+'>代表院长</option></select></div>'+
    krdListEditor('经历（现 / 前）','career',true)+krdListEditor('认证资格','certs',false)+krdListEditor('学会 / 培训','societies',false)+
    '<div style="margin:8px 0;"><div style="font-size:12px;font-weight:700;margin-bottom:4px;">擅长项目（选自本医院项目库；IN 选院长时擅长客人意向项目的排前面）</div><div style="display:flex;gap:6px;flex-wrap:wrap;">'+projs.map(function(p){ return '<label style="font-size:12px;border:1px solid var(--line);border-radius:14px;padding:3px 10px;cursor:pointer;"><input type="checkbox" '+(d0.specialties.indexOf(p.name)>-1?'checked':'')+' onchange="krdSpecToggle(\''+krEsc(p.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(p.name)+'</label>'; }).join('')+'</div></div>'+
    '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn-primary" onclick="krdSave()">保存</button><button class="btn-ghost" onclick="krdClose()">取消</button></div>');
}
ADMIN_RENDER.krdoctors = function(el){
  var can = canDo('krdoctors'), list = krdDoctors();
  el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('院长管理')+' <span style="font-size:12px;font-weight:400;color:var(--muted);">'+krEsc(krHospitalName())+' · 名单 ≠ 账号：IN 选院长、诊疗方案署名、案例库、对话都读这份名单</span></div>'+
    (can ? '<div><button class="btn-primary" onclick="krdOpen(\'new\')">+ 新增院长</button></div>' : '')+(KRD.draft ? krdEditor() : '')+
    list.map(function(dr){
      var ph = dr.photo ? '<img src="'+dr.photo+'" style="width:52px;height:52px;border-radius:50%;object-fit:cover;">' : '<span class="ds-avl" style="width:52px;height:52px;border-radius:50%;background:'+(dr.color||'#ddd')+';display:inline-flex;align-items:center;justify-content:center;font-size:18px;color:#fff;flex-shrink:0;">'+krEsc(dr.name.charAt(0))+'</span>';
      var li = function(arr){ return (arr||[]).map(function(x){ return '<div>'+(x.when?krEsc(x.when)+'：':'')+krEsc(x.ko)+' <span style="color:var(--muted);">'+krEsc(x.zh||'')+'</span></div>'; }).join(''); };
      return '<div class="card" style="padding:14px 18px;display:flex;gap:14px;'+(dr.active?'':'opacity:.6;')+'">'+ph+'<div style="flex:1;font-size:12px;line-height:1.7;"><div style="font-size:14px;font-weight:700;">'+krEsc(dr.name)+' <span style="font-weight:400;color:var(--slate2);">'+krEsc(dr.nameEn||'')+(dr.nameZh?' / '+krEsc(dr.nameZh):'')+'</span> <span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+krEsc(dr.title||'院长')+'</span> <span class="status-pill" style="background:'+(dr.active?'var(--sage-bg)':'#EDEAE2')+';color:'+(dr.active?'var(--sage)':'var(--muted)')+';">'+(dr.active?'在职':'停用')+'</span></div>'+
        '<div style="color:var(--muted);">'+krEsc(krdAccountOf(dr))+'</div>'+(dr.career&&dr.career.length?'<div style="margin-top:3px;"><b>经历</b>'+li(dr.career)+'</div>':'')+((dr.certs||[]).length?'<div><b>认证资格</b>'+li(dr.certs)+'</div>':'')+((dr.societies||[]).length?'<div><b>学会 / 培训</b>'+li(dr.societies)+'</div>':'')+((dr.specialties||[]).length?'<div style="margin-top:3px;"><b>擅长项目</b> '+dr.specialties.map(function(n){ return '<span class="chip" style="cursor:inherit;">'+krEsc(n)+'</span>'; }).join('')+'</div>':'')+'</div>'+
        (can ? '<div style="display:flex;flex-direction:column;gap:6px;"><button class="btn-outline" onclick="krdOpen(\''+dr.id+'\')">编辑</button><button class="btn-ghost" onclick="krdToggleActive(\''+dr.id+'\')">'+(dr.active?'停用':'启用')+'</button></div>' : '')+'</div>';
    }).join('');
};

/* ---------- 四、KR 项目库（KR-SRVC-01）：赴韩项目，韩元，一个价格所有诊所一样；维护人 KR 室长、管理者 ---------- */
/* 项目默认资料 p.defaults = {stay:'7天', durMin:60, anes:'local|sleep|general', anesNote, postcare:[{kr(韩国术后管理项目名), times, place:'KR'|'either', day}]}
   KR 写诊疗方案的可选范围、更换项目、补加、加做时自动带入，可按客人调整（印尼对应项目写诊疗方案时再选） */
var KRP = {edit:null, draft:null, showInactive:false};
function krpProjects(){ return ((HOSPITAL_DATA[krHospitalIdOfMe()]||{}).projects||[]); }
function krpRender(){ ADMIN_RENDER.krsrvc(document.getElementById('admin-body')); }
function krpCatLabel(p){ var c0 = KR_CATEGORIES[p.categoryId] || PROJECT_CATEGORIES[p.categoryId]; return c0 ? c0.label : '—'; }
function krpCatId(label){ var r = ''; Object.keys(KR_CATEGORIES).forEach(function(k){ if(KR_CATEGORIES[k].label===label) r = k; }); return r; }
/* 项目的默认资料 → 报告/更换表单用的 detail */
function krDefaultsDetail(name){
  var p = krpProjects().filter(function(x){ return x.name===name; })[0], df = (p && p.defaults) || {};
  return {stay:df.stay||'', anes:df.anes||'local', anesNote:df.anesNote||'', pc:(df.postcare||[]).map(function(x){ return {mgmt:x.mgmt||'', kr:x.kr, inn:'', times:x.times||1, interval:x.interval||1, place:x.place||'KR', start:x.start||(String(x.day||'').match(/(\d+)/)||[])[1]||''}; })};
}
/* "在用"：所有对接诊所的进行中案件引用（可选范围/已选/结算项目/意向）+ 本医院案例库案例 */
function krpUsage(p){
  var cases = [], libN = ((HOSPITAL_DATA[krHospitalIdOfMe()]||{}).libCases||[]).filter(function(c0){ return (c0.projectIds||[]).indexOf(p.id)>-1; }).length;
  krClinics().forEach(function(cl){
    var v = Store.readClinic(cl.id) || {};
    (v.CASE_ITEMS||[]).forEach(function(c0){
      if(c0.visitClosed || isEnded(c0)) return;
      var names = []; (c0.recommended||[]).forEach(function(i){ names.push(i.name); }); (c0.procedureItems||[]).forEach(function(i){ if(!i.cancelled && !i.swapped) names.push(i.name); }); ((c0.krScope||{}).items||[]).forEach(function(i){ names.push(i.name); }); (c0.intentionProjects||[]).forEach(function(i){ names.push(i.name); });
      if(names.indexOf(p.name)>-1) cases.push(cl.name+' '+c0.caseNo);
    });
  });
  return {cases:cases, libCases:libN};
}
function krpDeleteBlock(p){
  if(p.active) return '要先非活性化才能删除';
  var u = krpUsage(p); if(u.cases.length) return '还有进行中的案件在用（'+u.cases.slice(0,3).join('、')+(u.cases.length>3?'…':'')+'）'; if(u.libCases) return '案例库里有 '+u.libCases+' 个案例用到它';
  return '';
}
function krpOpen(id){
  var p = id==='new' ? null : krpProjects().filter(function(x){ return x.id===id; })[0];
  KRP.edit = id;
  KRP.draft = p ? JSON.parse(JSON.stringify(p)) : {id:'', name:'', price:'', categoryId:krpCatId('眼部'), active:true, names:{zh:'', ko:'', id:''}};
  KRP.draft.defaults = KRP.draft.defaults || {stay:'', durMin:'', anes:'local', anesNote:'', postcare:[]};
  KRP.draft.names = KRP.draft.names || {zh:KRP.draft.name, ko:'', id:''};
  krpRender();
}
function krpField(k, v){ KRP.draft[k] = v; }
function krpName(k, v){ KRP.draft.names[k] = v; if(k==='ko'){ if(!KRP.draft.names.zh || KRP.draft.names._auto!==false){ KRP.draft.names.zh = KRP.draft.names.zh || demoTranslate(v,'ko','zh'); } KRP.draft.names.id = demoTranslate(v,'ko','id'); } }
function krpDef(k, v){ KRP.draft.defaults[k] = v; }
function krpPcAdd(){ KRP.draft.defaults.postcare.push({mgmt:'', kr:'', times:1, interval:1, place:'KR', start:''}); krpRender(); }
function krpPcDel(i){ KRP.draft.defaults.postcare.splice(i, 1); krpRender(); }
function krpPcSet(i, k, v){ KRP.draft.defaults.postcare[i][k] = v; if(k==='times' || k==='interval' || k==='start' || k==='place') krpRender(); }
function krpClose(){ KRP.edit = null; KRP.draft = null; krpRender(); }
function krpSave(){
  if(!canDo('krlib')){ alert('只有 KR 室长、管理者可以维护项目库'); return; }
  var d0 = KRP.draft, list = krpProjects(), hid = krHospitalIdOfMe(), price = Number(d0.price);
  d0.name = (d0.names.zh || d0.name || '').trim();
  if(!d0.name){ alert('请填项目名称（中文名，用来在 IN 端显示和对应）'); return; }
  if(!(price >= 0) || d0.price===''){ alert('请填价格（韩元）'); return; }
  if(list.some(function(x){ return x.name===d0.name && x.id!==KRP.edit; })){ alert('项目库里已经有同名项目'); return; }
  if(!isKrPostcareCat(d0.categoryId) && !(Number(d0.defaults.durMin) > 0)){ alert('请填施术时长（分钟，必填）'); return; } /* 赴韩项目时长必填（CMD-1013-12 三） */
  d0.price = price; d0.defaults.durMin = Number(d0.defaults.durMin)||0;
  d0.defaults.postcare = d0.defaults.postcare.filter(function(x){ return x.kr; });
  if(KRP.edit==='new'){ var np = makeProj(d0.name, price, 'KR', krpCatLabel({categoryId:d0.categoryId}), hid); np.categoryId = d0.categoryId; np.names = d0.names; np.defaults = d0.defaults; list.push(np); logOp('其他', '新增赴韩项目：'+np.name, '项目库'); }
  else { var cur = list.filter(function(x){ return x.id===KRP.edit; })[0]; var oldPrice = cur.price; cur.name = d0.name; cur.price = price; cur.categoryId = d0.categoryId; cur.names = d0.names; cur.defaults = d0.defaults; logOp('其他', '修改赴韩项目：'+cur.name+(oldPrice!==price ? '（价格 '+oldPrice+' → '+price+'，已选进案件的快照不变）' : ''), '项目库'); }
  Store.touch(); KRP.edit = null; KRP.draft = null; krpRender();
}
function krpToggleActive(id){ var p = krpProjects().filter(function(x){ return x.id===id; })[0]; if(!p || !canDo('krlib')) return; p.active = !p.active; logOp('其他', (p.active?'重新启用':'非活性化')+'赴韩项目：'+p.name, '项目库'); Store.touch(); krpRender(); }
function krpDelete(id){ var p = krpProjects().filter(function(x){ return x.id===id; })[0]; if(!p) return; var why = krpDeleteBlock(p); if(why){ alert('不能删除：'+why); return; } if(!confirm('删除「'+p.name+'」？')) return; var l = krpProjects(); l.splice(l.indexOf(p), 1); logOp('其他', '删除赴韩项目：'+p.name, '项目库'); Store.touch(); krpRender(); }
function krpToggleShow(){ KRP.showInactive = !KRP.showInactive; krpRender(); }
function krpEditor(){
  var d0 = KRP.draft, df = d0.defaults, inp = 'padding:6px 9px;border:1px solid var(--line);border-radius:7px;', cats = Object.keys(KR_CATEGORIES);
  var post = krpProjects().filter(function(p){ return isKrPostcareCat(p.categoryId) && p.active; });
  var isPost = isKrPostcareCat(d0.categoryId);
  return krCardBox(KRP.edit==='new' ? '新增赴韩项目' : '编辑赴韩项目：'+krEsc(d0.name),
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><select onchange="krpField(\'categoryId\',this.value);krpRender()" style="'+inp+'">'+cats.map(function(k){ return '<option value="'+k+'"'+(d0.categoryId===k?' selected':'')+'>'+krEsc(KR_CATEGORIES[k].label)+'</option>'; }).join('')+'</select>'+
    '<input placeholder="中文名（IN 端显示）" value="'+krEsc(d0.names.zh)+'" oninput="krpName(\'zh\',this.value)" style="'+inp+'"><input placeholder="한국어" value="'+krEsc(d0.names.ko)+'" onchange="krpName(\'ko\',this.value);krpRender()" style="'+inp+'"><input placeholder="Indonesia（自动翻译，可改）" value="'+krEsc(d0.names.id)+'" oninput="krpName(\'id\',this.value)" style="'+inp+'"><input type="number" min="0" placeholder="价格（韩元）" value="'+krEsc(d0.price)+'" oninput="krpField(\'price\',this.value)" style="'+inp+'width:150px;"> ₩</div>'+
    (isPost ? '<div style="font-size:11px;color:var(--muted);margin-top:6px;">「韩国术后管理」分类：在韩国做的术后管理，只在 KR 写诊疗方案选"所需术后管理"时用，不用填默认资料。</div>' :
    '<div style="margin-top:10px;padding:10px 12px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;"><div style="font-weight:700;margin-bottom:6px;">项目默认资料（KR 写诊疗方案 / 更换项目 / 补加时自动带入，可按客人调整）</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">推荐在韩时间 <input value="'+krEsc(df.stay)+'" oninput="krpDef(\'stay\',this.value)" placeholder="例如 7 天" style="'+inp+'width:90px;"> 施术时长 <span style="color:#C1454A;">*</span> <input type="number" min="15" step="15" placeholder="必填" value="'+krEsc(df.durMin)+'" oninput="krpDef(\'durMin\',this.value)" style="'+inp+'width:80px;"> 分钟 麻醉 <select onchange="krpDef(\'anes\',this.value)" style="'+inp+'">'+Object.keys(KR_ANES).map(function(k){ return '<option value="'+k+'"'+(df.anes===k?' selected':'')+'>'+KR_ANES[k]+'</option>'; }).join('')+'</select><input placeholder="麻醉备注" value="'+krEsc(df.anesNote)+'" oninput="krpDef(\'anesNote\',this.value)" style="'+inp+'min-width:180px;"></div>'+
      '<div style="margin-top:8px;font-weight:700;">所需术后管理</div>'+df.postcare.map(function(x, i){ var dt = pcDayText({startDay:x.start, times:x.times, interval:x.interval}); return '<div style="display:grid;grid-template-columns:130px 92px 104px minmax(0,1fr) auto;gap:6px;align-items:center;margin:4px 0;">'+krPcNameSelect(x.mgmt, 'krpPcSet('+i+',\'mgmt\',this.value)', inp)+'<span style="white-space:nowrap;"><input type="number" min="1" value="'+x.times+'" onchange="krpPcSet('+i+',\'times\',Math.max(1,parseInt(this.value,10)||1))" style="'+inp+'width:44px;"> 次</span>'+(x.times>1 ? '<select onchange="krpPcSet('+i+',\'interval\',parseInt(this.value,10))" style="'+inp+'">'+[1,2,3,4,5,6,7,10,14].map(function(n){ return '<option value="'+n+'"'+((x.interval||1)===n?' selected':'')+'>隔 '+n+' 天</option>'; }).join('')+'</select>' : '<span></span>')+'<select onchange="krpPcSet('+i+',\'kr\',this.value)" style="'+inp+'min-width:0;"><option value="">具体项目</option>'+post.map(function(o){ return '<option'+(x.kr===o.name?' selected':'')+'>'+krEsc(o.name)+'</option>'; }).join('')+'</select><a href="#" onclick="krpPcDel('+i+');return false;" style="white-space:nowrap;font-size:12px;">移除</a><select onchange="krpPcSet('+i+',\'place\',this.value)" style="'+inp+'"><option value="KR"'+(x.place==='KR'?' selected':'')+'>必须在韩国</option><option value="either"'+(x.place==='either'?' selected':'')+'>韩国或印尼</option></select><span>第 <input type="number" min="1" value="'+krEsc(x.start||'')+'" onchange="krpPcSet('+i+',\'start\',this.value)" style="'+inp+'width:40px;"> 天起</span><span style="color:var(--sage);font-size:11px;grid-column:3 / -1;">'+krEsc(dt)+'</span></div>'; }).join('')+'<button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="krpPcAdd()">+ 添加所需术后管理</button></div>')+
    '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn-primary" onclick="krpSave()">保存</button><button class="btn-ghost" onclick="krpClose()">取消</button></div>');
}
ADMIN_RENDER.krsrvc = function(el){
  var can = canDo('krlib'), all = krpProjects(), shown = all.filter(function(p){ return KRP.showInactive ? !p.active : p.active; }), cats = Object.keys(KR_CATEGORIES);
  var group = cats.map(function(k){
    var rows = shown.filter(function(p){ return p.categoryId===k; }); if(!rows.length) return '';
    return '<div class="card" style="padding:8px 18px;"><div style="font-size:12px;font-weight:700;color:var(--terracotta);padding:6px 0;">'+krEsc(KR_CATEGORIES[k].label)+(KR_CATEGORIES[k].postcare?'（在韩国做的术后管理）':'')+'</div>'+rows.map(function(p){
      var df = p.defaults, u = krpUsage(p), meta = df ? [KR_ANES[df.anes]||'', df.stay ? '在韩 '+df.stay : '', df.durMin ? df.durMin+' 分钟' : '', (df.postcare||[]).length ? '术后管理 '+df.postcare.length+' 项' : ''].filter(Boolean).join(' · ') : '';
      return '<div class="case-field-row" style="font-size:13px;gap:10px;align-items:flex-start;"><div style="flex:1;"><b>'+krEsc(p.name)+'</b> <span style="color:var(--muted);font-size:11px;">'+krEsc((p.names||{}).ko||'')+'</span><div style="font-size:11px;color:var(--slate2);">'+(meta ? '默认：'+krEsc(meta) : '<span style="color:var(--muted);">没有默认资料</span>')+'</div><div style="font-size:11px;color:var(--muted);">使用中：进行中案件 '+u.cases.length+' · 案例 '+u.libCases+'</div></div><span style="min-width:110px;text-align:right;">'+(p.price===0 ? '免费' : formatCurrency(p.price,'KRW'))+'</span>'+
        (can ? '<span style="display:flex;gap:6px;"><button class="btn-outline" style="padding:3px 10px;font-size:11px;" onclick="krpOpen(\''+p.id+'\')">编辑</button><button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="krpToggleActive(\''+p.id+'\')">'+(p.active?'非活性化':'重新启用')+'</button>'+(!p.active ? '<button class="btn-ghost" style="padding:3px 10px;font-size:11px;'+(krpDeleteBlock(p)?'opacity:.4;':'')+'" onclick="krpDelete(\''+p.id+'\')" title="'+krEsc(krpDeleteBlock(p))+'">删除</button>' : '')+'</span>' : '')+'</div>';
    }).join('')+'</div>';
  }).join('');
  el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('项目库')+' <span style="font-size:12px;font-weight:400;color:var(--muted);">赴韩项目 · 韩元 · 一个价格，所有对接诊所一样（IN 端可切换显示印尼盾 / 人民币）</span></div>'+
    '<div style="display:flex;gap:8px;"><button class="chip'+(KRP.showInactive?'':' active')+'" onclick="KRP.showInactive=false;krpRender()">在用</button><button class="chip'+(KRP.showInactive?' active':'')+'" onclick="KRP.showInactive=true;krpRender()">非活性化</button><span style="flex:1;"></span>'+(can ? '<button class="btn-primary" onclick="krpOpen(\'new\')">+ 新增项目</button>' : '')+'</div>'+(KRP.draft ? krpEditor() : '')+(group || krEmpty('没有项目'))+
    '<div style="font-size:11px;color:var(--muted);">改价格只影响之后新选的项目；已选进案件的快照不变。"在用" = 所有对接诊所的进行中案件 + 本医院案例库案例；还在用的不能删除。分类是全系统共用的标准部位。</div>'+
    krlSectionHtml(can);
};

/* ---- 本地管理项目（CMD-1012-04）：KR 项目库里的第二组，12 类、韩元、类别 → 项目（一行一个）→ 规格 → 价格；各家诊所初始化时按汇率换算出自己的一份，之后各自改价，KR 改价不同步 ---- */
var KRL = {open:{}, draft:null, edit:null};
function krlRender(){ ADMIN_RENDER.krsrvc(document.getElementById('admin-body')); }
function krlToggle(id){ KRL.open[id] = !KRL.open[id]; krlRender(); }
function krlOpen(id){ var p = krLocalLib(krHospitalIdOfMe()).filter(function(x){ return x.id===id; })[0]; if(!p) return; KRL.edit = id; KRL.draft = {name:p.name, durMin:p.durMin||'', specs:p.specs.map(function(s){ return Object.assign({}, s); }), neg:!!p.neg, opt:p.opt ? {label:p.opt.label, rules:(p.opt.rules||[{match:'*', values:p.opt.values||[]}]).map(function(r){ return {match:r.match, values:r.values.slice()}; })} : null, err:''}; krlRender(); }
function krlClose(){ KRL.edit = null; KRL.draft = null; krlRender(); }
function krlSave(){
  var p = krLocalLib(krHospitalIdOfMe()).filter(function(x){ return x.id===KRL.edit; })[0]; if(!p || !canDo('krlib')) return;
  if(!(Number(KRL.draft.durMin) > 0)){ KRL.draft.err = '请填时长（分钟，必填）'; krlRender(); return; } /* 管理项目时长必填（CMD-1013-12 三） */
  var err = specEdFinish(KRL.draft); if(err){ KRL.draft.err = err; krlRender(); return; }
  p.durMin = Number(KRL.draft.durMin); p.specs = KRL.draft.specs; p.neg = KRL.draft.neg; p.opt = KRL.draft.opt; p.price = KRL.draft.price;
  logOp('其他', '修改 KR 本地管理项目：'+p.name, '项目库'); Store.touch(); KRL.edit = null; KRL.draft = null; krlRender();
}
function krlSectionHtml(can){
  var hid = krHospitalIdOfMe(), lib = krLocalLib(hid), cats = [];
  lib.forEach(function(p){ if(cats.indexOf(p.catLabel)<0) cats.push(p.catLabel); });
  var inp = 'padding:6px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;';
  var editor = KRL.draft ? '<div class="card" style="padding:14px 18px;border:1px solid var(--terracotta);"><b>编辑规格：'+krEsc(KRL.draft.name)+'</b><div style="margin:6px 0;font-size:12px;">时长 <span style="color:#C1454A;">*</span> <input type="number" min="5" step="5" placeholder="必填" value="'+krEsc(KRL.draft.durMin)+'" oninput="KRL.draft.durMin=this.value" style="'+inp+'width:80px;"> 分钟（必填）</div>'+specEdHtml('KRL.draft', 'krlRender()', 'KRW', KRL.draft)+(KRL.draft.err ? '<div style="color:#C1454A;font-size:12px;margin:6px 0;">'+krEsc(KRL.draft.err)+'</div>' : '')+'<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn-primary" onclick="krlSave()">保存</button><button class="btn-ghost" onclick="krlClose()">取消</button></div></div>' : '';
  return '<div style="font-size:16px;font-weight:700;margin-top:18px;">本地管理项目 <span style="font-size:12px;font-weight:400;color:var(--muted);">12 类 · 韩元 · 类别 → 项目 → 规格 → 价格；术后管理设定选具体项目、在韩增加项目时用</span></div>'+editor+
    cats.map(function(cl){
      return '<div class="card" style="padding:8px 18px;"><div style="font-size:12px;font-weight:700;color:var(--terracotta);padding:6px 0;">'+krEsc(cl)+'</div>'+lib.filter(function(p){ return p.catLabel===cl; }).map(function(p){
        var open = !!KRL.open[p.id], ps = p.specs.map(function(s){ return s.price; }), lo = Math.min.apply(null, ps), hi = Math.max.apply(null, ps);
        return '<div class="case-field-row" style="font-size:13px;gap:10px;"><span style="flex:1;cursor:pointer;" onclick="krlToggle(\''+p.id+'\')"><span style="color:var(--muted);">'+(open?'▾':'▸')+'</span> <b>'+krEsc(p.name)+'</b></span><span style="font-size:12px;">'+(p.neg ? '面议' : formatCurrency(lo,'KRW')+(hi>lo?' 起':''))+' <span style="color:var(--muted);">· '+p.specs.length+' 个规格</span></span>'+(can ? '<button class="btn-outline" style="padding:3px 10px;font-size:11px;" onclick="krlOpen(\''+p.id+'\')">编辑</button>' : '')+'</div>'+
          (open ? '<div style="margin:0 0 8px 22px;padding:8px 14px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;">'+p.specs.map(function(s){ var ov = optValuesFor(p, s.label); return '<div style="display:flex;justify-content:space-between;padding:2px 0;"><span>'+krEsc(s.label)+(ov.length ? ' <span style="color:var(--muted);">（使用时选'+krEsc(p.opt.label)+'：'+krEsc(ov.join(' / '))+'）</span>' : '')+'</span><span>'+(p.neg ? '面议' : formatCurrency(s.price,'KRW'))+'</span></div>'; }).join('')+'</div>' : '');
      }).join('')+'</div>';
    }).join('');
}


/* ---------- 五、KR 案例库（KR-SHOW-01）：赴韩施术案例；结构沿用 IN 案例库（部位 → 项目 → 案例、详情页、展示模式、手写同意书）
   维护人 KR 室长、管理者；项目选自本医院项目库；院长读 KR-DOC-01 名单（停用显示"-"）；所有对接的诊所都看得到本医院的案例（IN 案例库按医院区分）
   做法：KR 页面里把 IN 案例库用到的全局数据换成本医院的（LIB_CASES = 本医院案例数组，PROJECT_LIBRARY = 本医院项目），直接复用 IN 的渲染和编辑函数 ---- */
function krShowBind(){
  /* CMD-1014-16：案例库单一由 IN 管理，KR 只读：看到的 = 本医院的赴韩施术案例 + 对接诊所的本地项目案例（都是 IN 诊所维护的），不能上传 / 编辑 / 删除 */
  var h = krHData(); h.libCases = h.libCases || [];
  window.DEMO_ROLE = 'kr'; window.LIB_HOSPITAL = krHospitalIdOfMe();
  window.CURRENT_CLINIC_ID = '__KR'; /* 不属于任何诊所 */
  var seen = {}, projs = [], cases = h.libCases.slice();
  (h.projects||[]).forEach(function(p){ seen[p.id] = 1; projs.push(p); });
  krClinics().forEach(function(cl){ var v = Store.readClinic(cl.id) || {};
    (v.PROJECT_LIBRARY||[]).forEach(function(p){ if(!seen[p.id]){ seen[p.id] = 1; projs.push(p); } });
    (v.LIB_CASES||[]).forEach(function(c0){ if(c0.source!=='travel') cases.push(c0); }); });
  PROJECT_LIBRARY.length = 0; Array.prototype.push.apply(PROJECT_LIBRARY, projs);
  window.LIB_CASES = cases; /* 新数组：KR 改不到 IN 的案例 */
  window.libDirectorClickable = function(){ return false; }; /* KR 端没有 IN 的"院长详情"页 */
}
ADMIN_RENDER.krshow = function(el){
  krShowBind();
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;"><div id="lib-filters" style="display:flex;flex-direction:column;gap:10px;flex-grow:1;min-width:280px;"></div></div>'+
    '<div style="font-size:11px;color:var(--muted);">案例库由 IN 室长维护，KR 只读；这里看到的是本医院的赴韩施术案例和对接诊所的本地项目案例。</div><div id="lib-grid" style="margin-top:6px;"></div>';
  renderLibrary();
};


/* ---------- 术后管理预约弹窗（CMD-1012-02 D4）：院长评估为"可以手术"后弹出；按术后管理设定逐条列出 ---------- */
var KR_PCB = {rows:[]};
function krPcbBuild(c){
  var ks = c.krSchedule || {}, base = ks.confirmedDate || todayStr(), rows = [];
  pcUniqueEntries(c).forEach(function(e0){
    var it = e0.it, x = e0.x, i = e0.i;
    (function(){
      var days = pcDays(x); if(!days.length) days = [0];
      days.forEach(function(n){
        var dt = new Date(base+'T00:00:00'); dt.setDate(dt.getDate()+n);
        rows.push({projectId:it.projectId, batchId:it.batchId||'', pcIdx:i, item:it.name, mgmt:x.mgmt||'', name:x.name, innName:x.innName||'', place:x.place, canIn:(x.place==='either' && !!x.innName),
          day:n, date:dt.getFullYear()+'-'+pad2(dt.getMonth()+1)+'-'+pad2(dt.getDate()), time:'', where:(x.place==='either' && !!x.innName ? '' : 'KR'), askIn:false, common:!!x.cid}); /* 韩国或印尼都可：默认未选，由 KR 选（不读 IN 的分配，CMD-1013-04 五） */
      });
    })();
  });
  return rows;
}
/* 印尼诊所某天的营业 / 约满情况（只看） */
function krInnDayStatus(clinicId, date){
  return Store.withClinic(clinicId, function(){
    if(isRescheduleDateDisabled(new Date(date+'T00:00:00'))) return '休诊';
    var free = WK_HOURS.filter(slotBookable).filter(function(t0){ return !slotBlockReason(date, t0); }).length;
    return free ? '营业，可约 '+free+' 个时段' : '已满';
  });
}
/* 付清尾款后的术后管理预约：独立小窗口（同面诊录入的做法），原页日历可看（CMD-1013-08 二·1）；弹窗被拦时退回页内弹窗 */
function krPcbOpen(){
  if(!window.__krRecWin){
    var w = null; try{ w = window.open(location.pathname+'?case='+KR_CASE.clinicId+':'+KR_CASE.id+'&tab=proc&pcb=1&win=1', 'krpcb', 'popup=yes,width=700,height=760,left=100,top=40'); }catch(e){}
    if(w) return;
  }
  krPcbOpenLocal();
}
function krPcbOpenLocal(){
  var r = krFindCase(KR_CASE.clinicId, KR_CASE.id); if(!r) return;
  var rows = Store.withClinic(KR_CASE.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===KR_CASE.id; })[0]; return c ? krPcbBuild(c) : []; });
  if(!rows.length) return;
  KR_PCB = {rows:rows, single:{}}; krPcbRender();
}
function krPcbGroupTime(date, v){ KR_PCB.rows.forEach(function(r){ if(r.date===date && r.where && r.where!=='IN') r.time = v; }); krPcbRender(); }
function krPcbToggleSingle(date){ KR_PCB.single[date] = !KR_PCB.single[date]; krPcbRender(); }
function krPcbRender(){
  var ov = document.getElementById('kr-pcb-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'kr-pcb-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;';
  var hr = hospitalHours(krHospitalIdOfMe());
  var rowsHtml = KR_PCB.rows.map(function(r, i){
    var where = r.canIn ? '<select onchange="krPcbSet('+i+',\'where\',this.value)" style="'+inp+'"><option value=""'+(!r.where?' selected':'')+'>请选择</option><option value="KR"'+(r.where==='KR'?' selected':'')+'>在韩国做（预约）</option><option value="IN"'+(r.where==='IN'?' selected':'')+'>回印尼做（'+krEsc(r.innName)+'）</option></select>' : '<span class="status-pill" style="background:var(--terracotta-bg);color:var(--terracotta);">'+(r.place==='KR' ? '必须在韩国' : '在韩国（没有印尼对应项目）')+'</span>';
    var right;
    if(!r.where){ right = '<span style="font-size:12px;color:var(--muted);">先选在哪里做</span>'; }
    else if(r.where==='IN'){
      right = '<span style="font-size:12px;color:var(--slate2);">回印尼做：转入客人持有，由 IN 按持有项目预约（建议日期 '+krEsc(r.date)+'）</span>';
    } else if(!KR_PCB.single[r.date]){
      right = '<span style="font-size:12px;color:var(--slate2);">按本组时间 '+krEsc(r.time||'（未选）')+'</span>';
    } else {
      right = '<select onchange="krPcbSet('+i+',\'time\',this.value)" style="'+inp+'"><option value="">选择时间</option>'+krHourOptions(r.time, '06:00', '23:30')+'</select>';
    }
    return {date:r.date, html:'<div style="padding:7px 0 7px 10px;border-bottom:1px solid var(--border2);font-size:13px;"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><b>'+krEsc(r.mgmt||r.name)+'</b>'+where+right+'</div><div style="font-size:11px;color:var(--muted);margin-top:2px;">来自 '+krEsc(r.item)+(r.mgmt ? '，具体项目 '+krEsc(r.name) : '')+(r.common ? '（共同术后管理）' : '')+'</div></div>'};
  });
  /* 按日期分组（早→晚），同一天一组，默认一组选一个时间；同一位置可切换成每项单独选（CMD-1013-08 二·2） */
  var dates = []; rowsHtml.forEach(function(x){ if(dates.indexOf(x.date)<0) dates.push(x.date); }); dates.sort();
  rowsHtml = dates.map(function(dt){
    var idxs = KR_PCB.rows.map(function(r, i){ return r.date===dt ? i : -1; }).filter(function(i){ return i>-1; }), krRows = idxs.filter(function(i){ return KR_PCB.rows[i].where && KR_PCB.rows[i].where!=='IN'; });
    var gt = krRows.length ? (KR_PCB.rows[krRows[0]].time || '') : '', single = !!KR_PCB.single[dt];
    var head = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:var(--surface2,#faf6ef);border-radius:8px;padding:6px 10px;margin-top:10px;"><b style="font-size:13px;">'+krEsc(dt)+'</b><span style="font-size:11px;color:var(--muted);">'+idxs.length+' 项</span>'+
      (krRows.length && !single ? '<span style="font-size:12px;">统一时间 <select onchange="krPcbGroupTime(\''+dt+'\',this.value)" style="'+inp+'"><option value="">选择时间</option>'+krHourOptions(gt, '06:00', '23:30')+'</select></span>' : '')+
      (idxs.length>1 && krRows.length ? '<a href="#" style="font-size:12px;margin-left:auto;" onclick="krPcbToggleSingle(\''+dt+'\');return false;">'+(single ? '合并成一组' : '改成每项单独选')+'</a>' : '')+'</div>';
    return head+idxs.map(function(i){ return rowsHtml[i].html; }).join('');
  }).join('');
  ov.innerHTML = '<div class="modal-box" style="width:640px;max-height:84vh;overflow:auto;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:15px;font-weight:700;">术后管理预约</span><span style="cursor:pointer;" onclick="krPcbClose()">✕</span></div>'+
    '<div style="font-size:12px;color:var(--slate2);margin-bottom:8px;">必须在韩国 = KR 直接预约；韩国或印尼都可 = 逐项选在韩国做（预约）或回印尼做（转客人在印尼的持有项目，可请 IN 帮忙预约）。预约会成为在韩子项（术后管理记录）。</div>'+rowsHtml+
    '<div style="display:flex;gap:8px;margin-top:14px;"><button class="btn-primary" onclick="krPcbConfirm()">确认预约</button><button class="btn-ghost" onclick="krPcbClose()">稍后再约</button></div></div>';
  ov.classList.add('open');
}
function krPcbSet(i, k, v){ KR_PCB.rows[i][k] = v; if(k==='where' && v==='KR'){ var r0 = KR_PCB.rows[i], mate = KR_PCB.rows.filter(function(r){ return r!==r0 && r.date===r0.date && r.where==='KR' && r.time; })[0]; if(mate && !KR_PCB.single[r0.date]) r0.time = mate.time; } if(k==='where' || k==='askIn') krPcbRender(); }
function krPcbClose(){ var ov = document.getElementById('kr-pcb-overlay'); if(ov) ov.classList.remove('open'); if(window.__krRecWin) setTimeout(function(){ window.close(); }, 50); }
function krPcbConfirm(){
  if(!krCan()) return;
  var unsel = KR_PCB.rows.filter(function(r){ return !r.where; });
  if(unsel.length){ alert('还有 '+unsel.length+' 项「韩国或印尼都可」的术后管理没选在哪里做（在韩国做 / 回印尼做）'); return; }
  var bad = KR_PCB.rows.filter(function(r){ return r.where!=='IN' && !r.time; });
  if(bad.length){ alert('还有 '+bad.length+' 项没选时间（在韩国做的项目需要选时间）'); return; }
  var rows = KR_PCB.rows.slice();
  krPcbClose();
  krMut(function(c){ return corePcBooking(c, rows, ME_NAME); });
  if(window.__krRecWin) setTimeout(function(){ window.close(); }, 200); /* 小窗口：预约后关闭，原页自动更新 */
}


/* ========== KR 施术 tab 分步式（CMD-1013-03，KR-CASE-02 2026-10-13）==========
   Step 1 到院前 → Step 2 客人已到医院（院长评估）→ Step 3-1 原方案不变 / 3-2 调整方案 / 3-3 不建议手术；每步只显示该步卡片；
   选完评估后每一步都有［上一步］可退回重选（coreJudgeRevert），付清尾款 / 确认更换时间 / 退款完成之前不产生结算单、不记为定案 */
var KR_WZ = {edit:false, cannotOpt:'', cannotSub:'', refund:'all'};
function krWzSet(k, v){ KR_WZ[k] = v; krRenderCaseDetail(); }
function krWzBack(){
  if(!krCan() || !confirm('退回上一步重新选择？（现在的选择不会留下结算单）')) return;
  KR_ADJ = {dropped:{}, adds:{}, addOpen:false, signed:{}, locals:[], swap:{}, step:'pick'}; KR_WZ.cannotOpt = ''; KR_WZ.cannotSub = ''; KR_ARR.confirmTrip = false;
  krMut(function(c){ return coreJudgeRevert(c, ME_NAME); });
}
function krWzAdjBack(){ KR_ADJ.step = 'pick'; krRenderCaseDetail(); }
function krStepItemsCard(c){
  var rows = krAllItems(c).map(function(it){
    var stText = krItemStatus(it), gone = it.cancelled || it.swapped || it.replacedBy;
    var bits = itemMetaText(it);
    return '<div class="case-field-row" style="flex-wrap:wrap;"><span style="flex:1;font-size:13px;font-weight:600;'+(gone ? 'text-decoration:line-through;color:var(--muted);' : '')+'">'+krEsc(it.name)+(it.qty>1 ? ' ×'+it.qty : '')+'</span><span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+stText+'</span>'+
      (bits.length ? '<div style="flex-basis:100%;font-size:11px;color:var(--slate2);margin:2px 0 4px;line-height:1.6;">'+bits.map(krEsc).join('　｜　')+'</div>' : '')+'</div>';
  }).join('');
  var cmHtml = '';
  return krCardBox('施术项目', (rows || krEmpty('没有赴韩项目'))+cmHtml);
}
function krWzBackBar(label){ return '<div style="margin-top:10px;"><button class="btn-ghost" onclick="'+(label||'krWzBack()')+'">← 上一步</button></div>'; }
/* 添加项目（可不加）：左选项目 / 右已选 + 结算，同 IN 本地选购版面；左侧分「施术项目」（KR 赴韩项目库）/「管理项目」（KR 本地管理项目库，韩元，收费；免费术后管理不在里面）；
   睡眠 / 全麻须勾麻醉同意书。sk = 'adj'（分步流程里的添加）/ 'ad'（施术中的「增加项目」卡，状态独立）（CMD-1013-06 三·1、三·4） */
var KR_AD = {adds:{}, signed:{}, locals:[], care:{}, open:false};
function krChS(sk){ return sk==='ad' ? KR_AD : KR_ADJ; }
function krChToggle(sk, name, on){ var S = krChS(sk); if(on){ S.adds[name] = true; KR_SUB.detail[name] = KR_SUB.detail[name] || krDefaultsDetail(name); } else delete S.adds[name]; krRenderCaseDetail(); }
function krChAddLocal(sk){ var pk = krLpPick(sk); if(!pk) return; if(pk.p.neg && !(pk.price>0)){ alert('面议项目必须手动填价格（韩元）'); return; } krChS(sk).locals.push({name:pk.p.name, specLabel:pk.sp.label, price:pk.price, projectId:pk.p.id}); krRenderCaseDetail(); }
function krChDelLocal(sk, i){ krChS(sk).locals.splice(i, 1); krRenderCaseDetail(); }
/* 管理项目列表（同 IN 本地选购：每行一个项目，规格 / 次数行内选，可搜索；［加入］收费、［赠送］= 서비스 0 元）（CMD-1013-10 二） */
function krChTab(sk, t){ krChS(sk).tab = t; krRenderCaseDetail(); }
function krChQ(sk, v){ krChS(sk).q = v; var el = document.getElementById('kr-mg-list-'+sk); if(el) el.innerHTML = krMgRowsHtml(sk); }
function krMgSpec(sk, pid, sid){ KRLP[sk+'|'+pid] = KRLP[sk+'|'+pid] || {}; KRLP[sk+'|'+pid].sid = sid; krRenderCaseDetail(); }
function krMgManual(sk, pid, v){ KRLP[sk+'|'+pid] = KRLP[sk+'|'+pid] || {}; KRLP[sk+'|'+pid].manual = v; }
function krMgAdd(sk, pid, svc){
  var p = krLocalLib(krHospitalIdOfMe()).filter(function(x){ return x.id===pid; })[0]; if(!p) return;
  var st = KRLP[sk+'|'+pid] || {}, sp = p.specs.filter(function(x){ return x.id===st.sid; })[0] || p.specs[0]; if(!sp) return;
  var price = p.neg ? (parseInt(st.manual,10)||0) : sp.price;
  if(!svc && p.neg && !(price>0)){ alert('面议项目必须手动填价格（韩元）'); return; }
  krChS(sk).locals.push({name:p.name, specLabel:sp.label, price:svc ? 0 : price, projectId:p.id, service:!!svc}); krRenderCaseDetail();
}
function krMgRowsHtml(sk){
  var q = String(krChS(sk).q||'').trim().toLowerCase(), l = krLocalLib(krHospitalIdOfMe()).filter(function(p){ return !q || p.name.toLowerCase().indexOf(q)>-1 || String(p.catLabel||'').toLowerCase().indexOf(q)>-1; });
  var cats = []; l.forEach(function(p){ if(cats.indexOf(p.catLabel)<0) cats.push(p.catLabel); });
  var inp = 'padding:4px 6px;border:1px solid var(--line);border-radius:6px;font-size:12px;';
  return cats.map(function(cl){
    return '<div style="font-size:11px;font-weight:700;color:var(--muted);margin:8px 0 2px;">'+krEsc(cl)+'</div>'+l.filter(function(p){ return p.catLabel===cl; }).map(function(p){
      var st = KRLP[sk+'|'+p.id] || {}, sp = p.specs.filter(function(x){ return x.id===st.sid; })[0] || p.specs[0];
      return '<div style="display:flex;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--border2);font-size:13px;flex-wrap:wrap;"><span style="flex:1 1 120px;font-weight:600;">'+krEsc(p.name)+'</span>'+
        '<select onchange="krMgSpec(\''+sk+'\',\''+p.id+'\',this.value)" style="'+inp+'">'+p.specs.map(function(x){ return '<option value="'+x.id+'"'+(sp && x.id===sp.id?' selected':'')+'>'+krEsc(x.label)+'</option>'; }).join('')+'</select>'+
        (p.neg ? '<input type="number" min="1" placeholder="面议 ₩" value="'+(st.manual||'')+'" oninput="krMgManual(\''+sk+'\',\''+p.id+'\',this.value)" style="'+inp+'width:90px;">' : '<span style="min-width:78px;text-align:right;font-size:12px;">'+(sp ? formatCurrency(sp.price,'KRW') : '')+'</span>')+
        '<button class="btn-outline" style="padding:2px 10px;font-size:11px;" onclick="krMgAdd(\''+sk+'\',\''+p.id+'\',false)">加入</button><button class="btn-ghost" style="padding:2px 8px;font-size:11px;" title="서비스：赠送，0 元" onclick="krMgAdd(\''+sk+'\',\''+p.id+'\',true)">赠送</button></div>';
    }).join('');
  }).join('') || '<div style="font-size:12px;color:var(--muted);">没有匹配的管理项目</div>';
}
function krAddChooser(c, sk){
  sk = sk || 'adj'; var S = krChS(sk), tab = S.tab || 'surg';
  var cand = krScopeCandidates(KR_CASE.clinicId), have = krAllItems(c).filter(function(it){ return !it.cancelled && !it.swapped; }).map(function(it){ return it.name; });
  var avail = cand.kr.filter(function(p){ return have.indexOf(p.name)<0; }), q = function(s){ return krEsc(s).replace(/'/g,''); };
  var tabBtn = function(key, label){ return '<button class="'+(tab===key ? 'btn-primary' : 'btn-outline')+'" style="padding:4px 14px;font-size:12px;" onclick="krChTab(\''+sk+'\',\''+key+'\')">'+label+'</button>'; };
  var left;
  if(tab==='mgmt') left = '<input placeholder="搜索管理项目" value="'+krEsc(S.q||'')+'" oninput="krChQ(\''+sk+'\',this.value)" style="width:100%;box-sizing:border-box;padding:6px 10px;border:1px solid var(--line);border-radius:8px;font-size:12px;margin-bottom:4px;"><div id="kr-mg-list-'+sk+'">'+krMgRowsHtml(sk)+'</div>';
  else left = '<div style="font-size:12px;color:var(--muted);margin-bottom:4px;">KR 赴韩项目库，勾选 = 加入</div>'+(avail.map(function(p){ var on = !!S.adds[p.name]; return '<label style="display:flex;gap:8px;align-items:center;margin:4px 0;font-size:13px;cursor:pointer;"><input type="checkbox" '+(on?'checked':'')+' onchange="krChToggle(\''+sk+'\',\''+q(p.name)+'\',this.checked)"> <span style="flex:1;">'+krEsc(p.name)+'</span><span style="color:var(--muted);">'+formatCurrency(p.price,'KRW')+'</span></label>'; }).join('') || '<div style="font-size:12px;color:var(--muted);">项目库里没有可加的施术项目</div>');
  var names = Object.keys(S.adds), paid = S.locals.map(function(x, i){ return {x:x, i:i}; }).filter(function(e){ return !e.x.service; }), svcs = S.locals.map(function(x, i){ return {x:x, i:i}; }).filter(function(e){ return e.x.service; });
  var right = names.map(function(n){ var p = cand.kr.filter(function(x){ return x.name===n; })[0]; if(!p) return ''; var d = krDet(n);
    return '<div style="border-bottom:1px solid var(--border2);padding:6px 0;"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;"><span>'+krEsc(n)+' <span class="status-pill" style="background:var(--terracotta-bg);color:var(--terracotta);font-size:10px;">手术</span></span><span>'+formatCurrency(p.price,'KRW')+'</span></div>'+krProjDetailHtml(p, cand)+
      (d.anes!=='local' ? '<label style="display:block;margin:0 0 6px 22px;font-size:12px;color:#A85A10;"><input type="checkbox" '+(S.signed[n]?'checked':'')+' onchange="krChS(\''+sk+'\').signed[\''+q(n)+'\']=this.checked"> 已在现场签署麻醉同意书（'+KR_ANES[d.anes]+'必须勾选）</label>' : '')+'</div>'; }).join('')+
    paid.map(function(e){ var x = e.x; return '<div style="border-bottom:1px solid var(--border2);padding:6px 0;display:flex;justify-content:space-between;font-size:13px;font-weight:600;"><span>'+krEsc(x.name+' · '+x.specLabel)+' <span class="status-pill" style="background:var(--sage-bg);color:var(--sage);font-size:10px;">管理（收费）</span> <a href="#" onclick="krChDelLocal(\''+sk+'\','+e.i+');return false;" style="font-weight:400;font-size:12px;">移除</a></span><span>'+formatCurrency(x.price,'KRW')+'</span></div>'; }).join('');
  var svcHtml = '<div style="margin-top:12px;"><div style="font-size:12px;font-weight:700;margin-bottom:4px;">서비스（赠送） <span style="font-weight:400;color:var(--muted);">0 元，不计收入，不可退；在左侧「管理项目」点［赠送］</span></div>'+(svcs.map(function(e){ var x = e.x; return '<div style="border-bottom:1px solid var(--border2);padding:5px 0;display:flex;justify-content:space-between;font-size:13px;"><span>'+krEsc(x.name+' · '+x.specLabel)+' <span class="status-pill" style="background:#FBF0C9;color:#8F6F0C;font-size:10px;">서비스</span> <a href="#" onclick="krChDelLocal(\''+sk+'\','+e.i+');return false;" style="font-size:12px;">移除</a></span><span>'+formatCurrency(0,'KRW')+'</span></div>'; }).join('') || '<div style="font-size:12px;color:var(--muted);">没有</div>')+'</div>';
  return '<div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start;"><div style="flex:1 1 280px;min-width:240px;"><div style="display:flex;gap:6px;margin-bottom:8px;">'+tabBtn('surg','施术项目')+tabBtn('mgmt','管理项目')+'</div>'+left+'</div>'+
    '<div style="flex:2 1 380px;min-width:300px;"><div style="font-size:12px;font-weight:700;margin-bottom:4px;">已选（和结算一起）</div>'+(right || '<div style="font-size:12px;color:var(--muted);">还没有选项目（可以不加）</div>')+svcHtml+'</div></div>';
}
/* 施术中「增加项目」：独立一张卡（项目进程卡下方），左选右结；尾款付清后加的 → 待付款 + ［修正］（CMD-1013-06 三·4） */
function krAddOnCard(c){
  if(!krCan() || !c.hasArrived || c.visitClosed || !c.krBalancePaid) return '';
  if(!KR_AD.open) return ''; /* CMD-1015-20：［增加项目］在项目卡右上角，展开后才显示选择卡 */
  var cand = krScopeCandidates(KR_CASE.clinicId), have = (c.subItems||[]).filter(function(s){ return s.kind==='术后管理记录'; }).map(function(s){ return s.projectName||''; });
  var careList = cand.krPost.map(function(p){ var on = !!KR_AD.care[p.name]; return '<label style="display:flex;gap:8px;align-items:center;margin:4px 0;font-size:13px;cursor:pointer;"><input type="checkbox" '+(on?'checked':'')+' onchange="krAdCare(\''+krEsc(p.name).replace(/'/g,'')+'\',this.checked)"> <span style="flex:1;">'+krEsc(p.name)+'</span><span style="color:var(--sage);font-size:11px;">免费</span></label>'; }).join('') || '<div style="font-size:12px;color:var(--muted);">没有</div>';
  var n = Object.keys(KR_AD.adds).length + KR_AD.locals.length + Object.keys(KR_AD.care).length;
  return krCardBox('增加项目', '<div style="margin-bottom:8px;"><button class="btn-ghost" onclick="KR_AD.open=false;krRenderCaseDetail()">收起</button></div>'+krAddChooser(c, 'ad')+'<div style="margin-top:12px;border-top:1px solid var(--border2);padding-top:8px;"><div style="font-size:12px;font-weight:700;margin-bottom:4px;">术后管理（免费，进项目进程，不变待付款）</div>'+careList+'</div>'+'<div style="margin-top:10px;display:flex;gap:8px;align-items:center;"><button class="btn-primary" onclick="krDoAddonCommit()"'+(n ? '' : ' disabled style="opacity:.5;cursor:not-allowed;"')+'>增加（'+n+' 项）</button><span style="font-size:11px;color:var(--muted);">手术 / 管理项目标「待付款」，之后点最上方红色提示的［已付款］一次结；免费术后管理直接进项目进程。</span></div>');
}
function krAdCare(name, on){ if(on) KR_AD.care[name] = true; else delete KR_AD.care[name]; krRenderCaseDetail(); }
function krDoAddonCommit(){
  if(!krCan()) return;
  var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, cand = krScopeCandidates(KR_CASE.clinicId), names = Object.keys(KR_AD.adds), adds = [];
  for(var i = 0; i < names.length; i++){
    var dt = krDetailOf(names[i], cand); if(dt.error){ alert('「'+names[i]+'」：'+dt.error); return; }
    if(dt.anesthesia.type!=='local' && !KR_AD.signed[names[i]]){ alert('「'+names[i]+'」是'+dt.anesthesia.label+'，必须勾选「已在现场签署麻醉同意书」'); return; }
    adds.push({name:names[i], detail:dt});
  }
  var cares = Object.keys(KR_AD.care);
  if(!adds.length && !KR_AD.locals.length && !cares.length) return;
  var locals = KR_AD.locals.slice(); KR_AD = {adds:{}, signed:{}, locals:[], care:{}, open:false};
  krMut(function(c){ cares.forEach(function(n){ coreSubAdd(c, {kind:'术后管理记录', date:todayStr(), content:n, place:'KR', projectName:n}, ME_NAME); }); adds.forEach(function(a){ coreAddOnItem(c, a.name, ME_NAME, {anesthesia:a.detail.anesthesia, signed:true, detail:a.detail}); }); locals.forEach(function(x){ coreAddOnItem(c, x.name, ME_NAME, {local:x}); }); return true; });
}
/* 结算预览 + 付清尾款：最终项目合计 − 已付定金（换项目不另算差价） */
function krWzSettleCard(c, mode){
  var info = krBalanceInfo(c), cand = krScopeCandidates(KR_CASE.clinicId), price = function(n){ var p = cand.kr.filter(function(x){ return x.name===n; })[0]; return p ? p.price : 0; };
  var pend = krNotStartedItems(c), keep = [], lines = [];
  var doneTotal = krAllItems(c).filter(function(it){ return it.done && !it.cancelled && !it.swapped; }).reduce(function(s, it){ return s + itemKrAmount(it); }, 0);
  if(mode==='replace'){ /* 原项目全部更换 */ }
  else pend.forEach(function(it){
    if(mode==='changed' && KR_ADJ.dropped[it.name]){ var alt = KR_ADJ.swap[it.name]; if(alt && /^L\|/.test(alt)){ var li = krSwapLocal(alt); if(li) lines.push({t:krEsc(it.name)+' → 更换为 '+krEsc(li.name+' · '+li.specLabel)+'（管理）', amt:li.price}); } else if(alt) lines.push({t:krEsc(it.name)+' → 更换为 '+krEsc(alt), amt:price(alt)}); }
    else lines.push({t:krEsc(it.name), amt:itemKrAmount(it)});
  });
  Object.keys(KR_ADJ.adds).forEach(function(n){ lines.push({t:'＋ '+krEsc(n)+'（当天加，手术）', amt:price(n)}); });
  KR_ADJ.locals.forEach(function(x){ lines.push({t:'＋ '+krEsc(x.name+' · '+x.specLabel)+(x.service ? '（当天加，서비스 赠送 0 元）' : '（当天加，管理）'), amt:x.price}); });
  var total = lines.reduce(function(s, l){ return s + l.amt; }, 0) + doneTotal, diff = total - info.effDeposit;
  return '<div style="font-size:12px;line-height:1.8;">'+lines.map(function(l){ return '<div style="display:flex;justify-content:space-between;"><span>'+l.t+'</span><span>'+formatCurrency(l.amt,'KRW')+'</span></div>'; }).join('')+
    '<div style="border-top:1px solid var(--border2);margin-top:6px;padding-top:6px;">项目合计 '+formatCurrency(total,'KRW')+'；已付定金（可抵）'+formatCurrency(info.effDeposit,'KRW')+'；<b>'+(diff>=0 ? '尾款（在韩国补）' : '应退差额')+' '+formatCurrency(Math.abs(diff),'KRW')+'</b></div></div>'+
    '<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:10px 0;cursor:pointer;"><input type="checkbox" '+(KR_ARR.confirmTrip?'checked':'')+' onchange="krArrSet(\'confirmTrip\',this.checked)"> 已和客人确认行程（术后管理地点确定后不能再改）</label>'+
    '<button class="btn-primary" onclick="krDoSettle()"'+(KR_ARR.confirmTrip ? '' : ' disabled style="opacity:.5;cursor:not-allowed;"')+'>付清尾款</button><div style="font-size:11px;color:var(--muted);margin-top:6px;">付款后才弹出术后管理预约；点之前不会产生结算单。</div>';
}
function krWizard(c){
  var st = scheduleState(c), j = c.krJudge, can = krCan(), ks = c.krSchedule || {}, items = krStepItemsCard(c), out = '';
  if(!c.settlementDone) return '';
  if(st==='Confirmed'){ /* Step 1 */
    krSchReset(c, {pick:ks.confirmedDate, time:ks.confirmedTime||'10:00', address:ks.address||krDefaultAddress()});
    var days = Math.round((new Date(ks.confirmedDate+'T00:00:00') - new Date(krToday()+'T00:00:00'))/86400000);
    var form = (can && KR_WZ.edit) ? '<div style="margin-top:10px;font-size:12px;color:var(--slate2);">同一天之内可调整到院时间和地址（IN 会收到通知）；日期要改请和 IN 室长沟通，由 IN 改。</div>'+krSurgeryHoursNote(c)+'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;"><select onchange="krSchSet(\'time\',this.value)" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;">'+krTimeOptionsFor(KR_SCH.time, c, ks.confirmedDate)+'</select><input value="'+krEsc(KR_SCH.address)+'" oninput="krSchSet(\'address\',this.value)" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;flex:1;min-width:260px;"><button class="btn-outline" onclick="krDoSchAdjust();KR_WZ.edit=false;">保存调整</button></div>' : '';
    out = krCardBox('施术日期', '<div style="font-size:16px;font-weight:700;">'+krEsc(ks.confirmedDate)+'（'+(days>0 ? '还有 '+days+' 天' : days===0 ? '就是今天' : '已过 '+(-days)+' 天')+'）　'+krEsc(ks.confirmedTime||'')+'</div><div style="font-size:12px;color:var(--slate2);margin-top:4px;">'+krEsc(ks.address||'')+'</div>'+
      (c.hasArrived ? '<div style="font-size:12px;color:var(--terracotta);margin-top:6px;">已在韩国重新预约施术时间；客人再到医院时重新标记「已到医院」。</div>' : '')+
      (can ? '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn-outline" onclick="krWzSet(\'edit\','+(!KR_WZ.edit)+')">修改</button><button class="btn-primary" onclick="krMarkArrived()">客人已到医院</button></div>' : krEmpty('客人到院后由 KR 室长标记'))+form);
    return out+items;
  }
  if(!j) return items+krArrivalBlock(c); /* Step 2：施术项目 + 到院与尾款（选院长评估结果；非「原方案不变」memo 必填） */
  var infoLine = krKV('KR 判断', KR_JUDGE_TEXT[j.result])+(j.memo ? krKV('memo', krEsc(j.memo)) : '');
  if(j.result==='ok'){ /* Step 3-1 */
    var addCard = krCardBox('添加项目（可不加）', can ? (KR_ADJ.addOpen ? krAddChooser(c)+'<div style="margin-top:8px;"><button class="btn-ghost" onclick="KR_ADJ.addOpen=false;krRenderCaseDetail()">收起</button></div>' : '<button class="btn-outline" onclick="KR_ADJ.addOpen=true;krRenderCaseDetail()">添加项目</button>') : krEmpty('由 KR 室长操作'));
    return items+krCardBox('到院与尾款', infoLine)+addCard+krCardBox('付清尾款', can ? krWzSettleCard(c, 'ok') : krEmpty('由 KR 室长操作'))+(can ? krWzBackBar() : '');
  }
  if(j.result==='changed'){ /* Step 3-2 */
    var pend = krNotStartedItems(c), cand = krScopeCandidates(KR_CASE.clinicId);
    var info2 = krKV('KR 判断', KR_JUDGE_TEXT.changed)+(j.memo ? krKV('memo', krEsc(j.memo)) : '');
    if(KR_ADJ.step!=='add'){
      var pickRows = pend.map(function(it){
        var keep = !KR_ADJ.dropped[it.name], nm = krEsc(it.name).replace(/'/g,'');
        var opts = '<option value="">（不做，直接取消）</option><optgroup label="施术项目（KR 赴韩项目库）">'+cand.kr.filter(function(p){ return p.name!==it.name && !krAllItems(c).some(function(x){ return x.name===p.name && !x.cancelled && !x.swapped; }); }).map(function(p){ return '<option'+(KR_ADJ.swap[it.name]===p.name?' selected':'')+'>'+krEsc(p.name)+'</option>'; }).join('')+'</optgroup>'+
          '<optgroup label="管理项目（KR 本地管理项目库，收费）">'+krLocalLib(krHospitalIdOfMe()).filter(function(p){ return !p.neg; }).map(function(p){ return p.specs.map(function(sp){ var v = 'L|'+p.id+'|'+sp.id; return '<option value="'+v+'"'+(KR_ADJ.swap[it.name]===v?' selected':'')+'>'+krEsc(p.name+' · '+sp.label+'（'+formatCurrency(sp.price,'KRW')+'）')+'</option>'; }).join(''); }).join('')+'</optgroup>';
        return '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0;font-size:13px;"><label style="display:flex;gap:8px;align-items:center;min-width:220px;cursor:pointer;"><input type="checkbox" '+(keep?'checked':'')+' onchange="krAdjToggleKeep(\''+nm+'\',this.checked)"> 保留 '+krEsc(it.name)+' <span style="color:var(--muted);">'+formatCurrency(itemKrAmount(it),'KRW')+'</span></label>'+
          (keep ? '' : '<span style="color:var(--slate2);">更换为</span><select onchange="KR_ADJ.swap[\''+nm+'\']=this.value;krRenderCaseDetail()" style="padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;">'+opts+'</select>')+'</div>';
      }).join('');
      return items+krCardBox('到院与尾款', info2)+
        krCardBox('勾选保留 / 更换', (can ? pickRows+'<div style="margin-top:8px;"><button class="btn-primary" onclick="krAdjNext()">下一步</button></div>' : krEmpty('由 KR 室长操作')))+(can ? krWzBackBar() : '');
    }
    return items+krCardBox('到院与尾款', info2)+krCardBox('添加项目（可不加）', can ? krAddChooser(c) : krEmpty('由 KR 室长操作'))+krCardBox('结算', can ? krWzSettleCard(c, 'changed') : krEmpty('由 KR 室长操作'))+(can ? krWzBackBar('krWzAdjBack()') : '');
  }
  /* Step 3-3 不建议手术 */
  var optHtml = can ? '<div style="margin:8px 0;"><label style="margin-right:18px;cursor:pointer;"><input type="radio" name="kr-cn" '+(KR_WZ.cannotOpt==='time'?'checked':'')+' onchange="krWzSet(\'cannotOpt\',\'time\')"> 更换时间</label><label style="cursor:pointer;"><input type="radio" name="kr-cn" '+(KR_WZ.cannotOpt==='cancel'||KR_WZ.cannotOpt==='replace'||KR_WZ.cannotOpt==='refund'?'checked':'')+' onchange="krWzSet(\'cannotOpt\',\'cancel\')"> 取消项目</label></div>' : krEmpty('等待 KR 室长处理');
  var sub = '';
  if(can && KR_WZ.cannotOpt==='time'){
    var od = caseOpenDates(c).filter(function(d){ return d >= krToday(); }), inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
    sub = (KR_ARR.rebookDate ? '<div style="margin-top:6px;font-size:12px;">'+krEsc(c.director||'')+' 当天的日程</div>'+krDirDayText(krHospitalIdOfMe(), c.director, KR_ARR.rebookDate) : '<div style="font-size:12px;color:var(--slate2);">选一个院长可约的日期和时间，重新预约施术：</div>')+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0 4px;"><select onchange="krArrSet(\'rebookDate\',this.value)" style="'+inp+'"><option value="">选择开放日期</option>'+od.map(function(d){ return '<option'+(KR_ARR.rebookDate===d?' selected':'')+'>'+d+'</option>'; }).join('')+'</select><select onchange="krArrSet(\'rebookTime\',this.value)" style="'+inp+'">'+krTimeOptions(KR_ARR.rebookTime)+'</select><button class="btn-primary" onclick="krDoRebook()">确认</button></div>';
  } else if(can && (KR_WZ.cannotOpt==='cancel' || KR_WZ.cannotOpt==='replace' || KR_WZ.cannotOpt==='refund')){
    sub = '<div style="margin:6px 0;font-size:13px;">取消项目后：<label style="margin:0 12px;cursor:pointer;"><input type="radio" name="kr-cn2" '+(KR_WZ.cannotOpt==='replace'?'checked':'')+' onchange="krWzSet(\'cannotOpt\',\'replace\')"> 更换项目</label><label style="cursor:pointer;"><input type="radio" name="kr-cn2" '+(KR_WZ.cannotOpt==='refund'?'checked':'')+' onchange="krWzSet(\'cannotOpt\',\'refund\')"> 退款</label></div>';
    if(KR_WZ.cannotOpt==='refund'){
      sub += j.refundKind ? '<div style="font-size:12px;color:var(--sage);">已判断：定金'+(j.refundKind==='all' ? '全部退回' : '不退')+'（已通知 IN 室长按此操作；操作后案件变为仅出报告）</div>'
        : '<div style="margin:6px 0;font-size:13px;">定金：<label style="margin:0 10px;cursor:pointer;"><input type="radio" name="kr-rf" '+(KR_WZ.refund==='all'?'checked':'')+' onchange="KR_WZ.refund=\'all\'"> 全部退回</label><label style="cursor:pointer;"><input type="radio" name="kr-rf" '+(KR_WZ.refund==='none'?'checked':'')+' onchange="KR_WZ.refund=\'none\'"> 不退</label></div><button class="btn-primary" onclick="krDoRefundDecision(KR_WZ.refund)">确认</button>';
    } else if(KR_WZ.cannotOpt==='replace'){
      sub += krAddChooser(c)+'<div style="margin-top:10px;">'+krWzSettleCard(c, 'replace')+'</div>';
    }
  }
  return items+krCardBox('到院与尾款', infoLine+optHtml+sub)+(can ? krWzBackBar() : '');
}
/* 3-2 更换为管理项目：下拉值 'L|项目id|规格id' → {name, specLabel, price, projectId} */
function krSwapLocal(v){ var p = String(v).split('|'), pr = krLocalLib(krHospitalIdOfMe()).filter(function(x){ return x.id===p[1]; })[0], sp = pr && pr.specs.filter(function(s){ return s.id===p[2]; })[0]; return (pr && sp) ? {name:pr.name, specLabel:sp.label, price:sp.price, projectId:pr.id} : null; }
function krAdjNext(){
  var c = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, pend = krNotStartedItems(c);
  var kept = pend.filter(function(it){ return !KR_ADJ.dropped[it.name] || KR_ADJ.swap[it.name]; }).length;
  KR_ADJ.step = 'add'; krRenderCaseDetail();
}


/* ========== KR 客人管理（KR-CLNT-01，CMD-1013-11 四）==========
   只有 KR 室长 / 管理者（院长没有）；客人 = 来源诊所 + 名字，只统计本院可见的案件（krAllCases），所以别的医院的客人看不到；
   不显示 IN 本地项目、IN 持有项目、诊所内部资料（联系方式 / 病史 / 财务都不放）。 */
var KR_CLI = {q:'', clinic:'', hold:'', sel:null};
function krClientRows(){ /* 同一客人 = IN 客人档案（来源诊所 + 客人档案 id；CMD-1013-12 二·1），没有档案的旧案件退回按名字 */
  var map = {}, order = [];
  krAllCases().forEach(function(r){
    var cl = Store.withClinic(r.clinicId, function(){ var x = clientByName(r.name); return x ? {id:x.id, dob:x.dob||''} : null; });
    var key = r.clinicId+'|'+(cl ? cl.id : 'n:'+r.name); if(!map[key]){ map[key] = {key:key, clinicId:r.clinicId, clinicName:r.clinicName, name:r.name, dob:cl ? cl.dob : '', cases:[], last:'', hold:false}; order.push(key); }
    var m = map[key]; m.cases.push(r);
    var ks = r.c.krSchedule || {}; if((r.c.hasArrived || ks.status==='Confirmed') && ks.confirmedDate && ks.confirmedDate > m.last) m.last = ks.confirmedDate;
    if(r.hold) m.hold = true;
  });
  return order.map(function(k0){ return map[k0]; });
}
function krCliSet(k0, v){ KR_CLI[k0] = v; krRenderClients(); }
function krRenderClients(){
  var el = document.getElementById('krclients-body'); if(!el) return;
  if(!krClientsAllowed()){ el.innerHTML = krEmpty('院长没有客人管理'); return; }
  var q = KR_CLI.q.trim().toLowerCase(), rows = krClientRows().filter(function(m){ return (!q || m.name.toLowerCase().indexOf(q)>-1) && (!KR_CLI.clinic || m.clinicId===KR_CLI.clinic) && (!KR_CLI.hold || (KR_CLI.hold==='yes') === m.hold); })
    .sort(function(a, b){ return (b.last||'').localeCompare(a.last||'') || a.name.localeCompare(b.name); });
  var sel = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
  el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('客人管理')+'</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;"><input placeholder="搜索客人名字" value="'+krEsc(KR_CLI.q)+'" oninput="KR_CLI.q=this.value;krRenderClientsKeep()" style="'+sel+'width:200px;">'+
      '<select onchange="krCliSet(\'clinic\',this.value)" style="'+sel+'"><option value="">全部来源诊所</option>'+krClinics().map(function(cl){ return '<option value="'+cl.id+'"'+(KR_CLI.clinic===cl.id?' selected':'')+'>'+krEsc(cl.name)+'</option>'; }).join('')+'</select>'+
      '<select onchange="krCliSet(\'hold\',this.value)" style="'+sel+'"><option value="">在韩后续：全部</option><option value="yes"'+(KR_CLI.hold==='yes'?' selected':'')+'>有在韩后续</option><option value="no"'+(KR_CLI.hold==='no'?' selected':'')+'>没有在韩后续</option></select></div>'+
    '<div class="card" style="padding:6px 18px;" id="krcli-list">'+krClientListHtml(rows)+'</div>';
}
/* 客人列表的「阶段 / 进程」：只显示正在进行的案件（未结束），没有进行中的案件两栏都显示「—」；在韩后续标签放在进程栏（CMD-1014-09） */
function krCliStageProc(m){
  var on = m.cases.filter(function(r){ return !isEnded(r.c); }), dash = '<span style="color:var(--muted);">—</span>';
  if(!on.length){ /* CMD-1015-17：只剩在韩持有、没人约 → 阶段「—」，进程「在韩持有 N 项（由 IN 预约）」 */
    var nHold = m.cases.reduce(function(n0, r){ return n0 + krHoldList(r.c).length; }, 0);
    return '<span>'+dash+'</span><span style="font-size:12px;">'+(nHold ? '在韩持有 '+nHold+' 项（由 IN 预约）' : dash)+'</span>';
  }
  return '<span>'+on.map(function(r){ var si = caseStageInfo(r.c); return '<div style="margin-bottom:3px;"><span class="status-pill" style="background:'+si.bg+';color:'+si.fg+';white-space:nowrap;">'+krEsc(si.stage)+'</span></div>'; }).join('')+'</span>'+
    '<span style="font-size:12px;">'+on.map(function(r){ return '<div style="margin-bottom:3px;min-height:22px;display:flex;align-items:center;">'+krEsc(caseStageInfo(r.c).proc||'—')+'</div>'; }).join('')+'</span>';
}
function krClientListHtml(rows){
  var head = '<div style="display:grid;grid-template-columns:1.2fr 1.4fr 90px 130px 90px 160px;gap:10px;font-size:11px;color:var(--muted);font-weight:700;padding:8px 0;border-bottom:1px solid var(--border);"><span>名字</span><span>来源诊所</span><span>本院案件数</span><span>最近施术日期</span><span>阶段</span><span>进程</span></div>';
  return head+(rows.length ? rows.map(function(m){
    return '<div class="case-row-click" onclick="krOpenClient(\''+m.key+'\')" style="display:grid;grid-template-columns:1.2fr 1.4fr 90px 130px 90px 160px;gap:10px;align-items:center;font-size:13px;padding:10px 0;border-bottom:1px solid var(--border2);cursor:pointer;"><span style="font-weight:600;">'+krEsc(m.name)+(m.dob && m.dob!=='—' ? ' <span style="font-weight:400;font-size:11px;color:var(--muted);">'+krEsc(m.dob)+'</span>' : '')+'</span><span>'+krEsc(m.clinicName)+'</span><span>'+m.cases.length+'</span><span>'+krEsc(m.last||'—')+'</span>'+krCliStageProc(m)+'</div>';
  }).join('') : krEmpty('没有符合条件的客人'));
}
function krRenderClientsKeep(){ var q = KR_CLI.q.trim().toLowerCase(), rows = krClientRows().filter(function(m){ return (!q || m.name.toLowerCase().indexOf(q)>-1) && (!KR_CLI.clinic || m.clinicId===KR_CLI.clinic) && (!KR_CLI.hold || (KR_CLI.hold==='yes') === m.hold); }).sort(function(a, b){ return (b.last||'').localeCompare(a.last||'') || a.name.localeCompare(b.name); }); var el = document.getElementById('krcli-list'); if(el) el.innerHTML = krClientListHtml(rows); }
function krClientKeyFor(clinicId, name){ var cl = Store.withClinic(clinicId, function(){ var x = clientByName(name); return x ? x.id : null; }); return clinicId+'|'+(cl ? cl : 'n:'+name); }
function krOpenClient(key){ KR_CLI.sel = key; if(CURRENT_PAGE_ID==='kr-clientdetail') krRenderClientDetail(); else nav('kr-clientdetail'); }
/* 客人详情里的操作要落在对应案件上：先把 KR_CASE 指到那个案件，再调用案件页同一个函数 */
function krCliAct(fn, clinicId, caseId, arg){ KR_CASE = {clinicId:clinicId, id:caseId, tab:'proc'}; window[fn](arg); }
function krRenderClientDetail(){
  var el = document.getElementById('krclientdetail-body'); if(!el) return;
  var back = '<button class="btn-ghost" onclick="goBack()">← 返回</button>';
  if(!krClientsAllowed() || !KR_CLI.sel){ el.innerHTML = '<div class="card" style="padding:24px;">'+back+'<div style="margin-top:12px;color:var(--slate2);">没有可看的客人。</div></div>'; return; }
  var m = krClientRows().filter(function(x){ return x.key===KR_CLI.sel; })[0];
  if(!m){ el.innerHTML = '<div class="card" style="padding:24px;">'+back+'<div style="margin-top:12px;color:var(--slate2);">这位客人在本院没有可看的案件。</div></div>'; return; }
  var can = krCan(), cases = m.cases.slice().sort(function(a, b){ return String(b.caseNo).localeCompare(String(a.caseNo)); });
  var caseRows = cases.map(function(r){ return '<div class="case-row-click case-field-row" style="cursor:pointer;" onclick="krShowCase(\''+r.clinicId+'\',\''+r.id+'\')"><span style="width:90px;font-weight:700;">'+krEsc(r.caseNo)+'</span><span class="status-pill" style="background:'+r.badge[0]+';color:'+r.badge[1]+';">'+krEsc(r.stageText||r.label)+'</span>'+(r.hold ? ' '+KR_HOLD_TAG : '')+'<span style="flex:1;"></span><span style="font-size:12px;color:var(--muted);">院长 '+krEsc(r.director||'—')+'</span></div>'; }).join('');
  /* 术后管理：各案件的在韩持有子项（到当天 +［客人已到］才能标完成，原型有［模拟到当日］）；持有项目：只列项目 + 剩余次数 +［安排使用］ */
  var careRows = '', holdRows = '';
  cases.forEach(function(r){
    var c = r.c, cid = r.clinicId, id = r.id, act = function(fn, sid){ return 'krCliAct(\''+fn+'\',\''+cid+'\',\''+id+'\',\''+sid+'\')'; };
    (c.subItems||[]).filter(function(s){ return s.hold && !s.done; }).forEach(function(s){
      careRows += '<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--border2);font-size:13px;flex-wrap:wrap;"><span style="width:90px;color:var(--muted);">'+krEsc(r.caseNo)+'</span><span style="width:140px;">'+krEsc((s.date||'')+(s.time ? ' '+s.time : ''))+'</span><span style="flex:1;min-width:160px;">'+krEsc(s.content)+(s.note ? '<div style="font-size:11px;color:var(--slate2);">备注：'+krEsc(s.note)+'</div>' : '')+'</span>'+
        (can ? krCareActHtml(s, act)+'<a href="#" onclick="'+act('krSubNote', s.id)+';return false;" style="font-size:12px;">'+(s.note?'改备注':'备注')+'</a><a href="#" onclick="'+act('krSubTimeOpen', s.id)+';return false;" style="font-size:12px;">改时间</a>' : '')+'</div>';
    });
    (c.procedureItems||[]).filter(function(it){ return it.heldOver && !it.holdDone; }).forEach(function(it){
      var left = holdItemLeft(c, it), pl = holdItemPlanned(c, it);
      holdRows += '<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--border2);font-size:13px;"><span style="width:90px;color:var(--muted);">'+krEsc(r.caseNo)+'</span><span style="flex:1;">'+krEsc(it.name)+'</span><span style="color:var(--slate2);">剩余 '+left+' 次'+(pl ? '（已安排 '+pl+' 次）' : '')+'</span>'+(left-pl>0 ? '<span style="font-size:11px;color:var(--muted);">要使用请由 IN 预约</span>' : '')+'</div>';
    });
  });
  var surg = [];
  cases.forEach(function(r){ (r.c.subItems||[]).filter(function(s){ return s.kind==='施术' && s.done; }).forEach(function(s){ surg.push({date:s.doneAt ? s.doneAt.slice(0,10) : (s.date||''), caseNo:r.caseNo, items:(s.doneItems||[]).join('、') || s.content, director:r.director||'—'}); }); });
  surg.sort(function(a, b){ return b.date.localeCompare(a.date); });
  var surgHtml = surg.length ? surg.map(function(x){ return '<div class="case-field-row"><span style="width:100px;">'+krEsc(x.date)+'</span><span style="width:90px;color:var(--muted);">'+krEsc(x.caseNo)+'</span><span style="flex:1;font-size:13px;">'+krEsc(x.items)+'</span><span style="font-size:12px;color:var(--muted);">院长 '+krEsc(x.director)+'</span></div>'; }).join('') : krEmpty('还没有施术记录');
  el.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">'+back+'<div style="font-size:18px;font-weight:700;">'+krEsc(m.name)+(m.dob && m.dob!=='—' ? ' <span style="font-size:12px;font-weight:400;color:var(--muted);">生日 '+krEsc(m.dob)+'</span>' : '')+'</div>'+(m.hold ? KR_HOLD_TAG : '')+'<span style="font-size:13px;color:var(--muted);">'+krEsc(m.clinicName)+' · 本院案件 '+m.cases.length+' 个</span></div>'+
    '<div style="display:flex;flex-direction:column;gap:14px;">'+krCardBox('本院所有案件', caseRows)+
    krCardBox('术后管理 <span style="font-weight:400;font-size:11px;color:var(--muted);">到当天 +［客人已到］才能标完成（原型有［模拟到当日］）</span>', careRows || krEmpty('没有待做的术后管理'))+
    krCardBox('持有项目 <span style="font-weight:400;font-size:11px;color:var(--muted);">只列项目和剩余次数；要使用请由 IN 预约，预约后进 KR 日历，客人到后在术后管理里标完成</span>', holdRows || krEmpty('没有持有项目'))+
    krCardBox('本院施术记录', surgHtml)+
    '<div style="font-size:11px;color:var(--muted);">这里不显示 IN 的本地项目、IN 持有项目和诊所内部资料。</div></div>';
}
