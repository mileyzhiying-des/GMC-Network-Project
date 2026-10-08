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
function krAllCases(){
  var hid = krHospitalIdOfMe(), me = currentAccount(), rows = [];
  krClinics().forEach(function(cl){
    Store.withClinic(cl.id, function(){
      CASE_ITEMS.forEach(function(c){
        if(!krCaseVisible(c, hid)) return;
        if(me && me.role==='kr_director' && c.director !== me.name + ' 원장' && c.director !== me.name) return; /* 院长只看自己的案件 */
        var badge = caseStatusBadge(c);
        rows.push({clinicId:cl.id, clinicName:cl.name, id:c.id, caseNo:c.caseNo, name:c.name, director:c.director||'', krCoordinator:c.krCoordinator||'',
          updated:c.updated||'', noTimeline:!!(c.settlementDone && krActiveItems(c).length && !(c.subItems||[]).length && !isEnded(c)), subToday:(c.subItems||[]).filter(function(s){ return s.date===krToday() && !s.done; }).length, badge:badge, label:badge[2], subItems:caseSubStatusItems(c), phoneMasked:maskPhone(clientPhoneOf(c.name)), c:c});
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
function krNavItems(){
  var items = [];
  if(canDo('krview') || canDo('krviewOwn')) items.push({id:'kr-dashboard', key:'krdash', label:'大盘', icon:'盘'});
  if(canDo('krview') || canDo('krviewOwn')) items.push({id:'kr-cases', key:'krcases', label:'案件列表', icon:'件'}, {id:'kr-notifications', key:'krnotifs', label:'通知中心', icon:'通'});
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
function buildKrTopbar(title){
  var a = currentAccount(), hasWork = canDo('krview') || canDo('krviewOwn');
  return '<div class="topbar"><span class="title">'+t(title)+'</span><div class="actions">'+
    (hasWork ? '<button class="icon-btn" onclick="krOpenDrawer()" aria-label="对话">💬<span class="badge kr-chat-badge" style="display:none;">0</span></button>'+
      '<button class="icon-btn" onclick="krToggleBell(event)" aria-label="通知">🔔<span class="badge kr-bell-badge" style="display:none;">0</span></button>' : '')+
    '<span class="avatar" style="cursor:pointer;" onclick="toggleAvatarMenu(event)" title="'+(ME_NAME||'')+'">'+((ME_NAME||'?').charAt(0).toUpperCase())+'</span></div></div>';
}

var KR_PAGE_TITLES = {'kr-dashboard':'大盘', 'kr-cases':'案件列表', 'kr-casedetail':'案件详情', 'kr-notifications':'通知中心'};
function krRenderPage(id){
  var tSlot = document.querySelector('#'+id+' .topbar-slot'); if(tSlot) tSlot.innerHTML = buildTopbar(KR_PAGE_TITLES[id] || '');
  if(id==='kr-dashboard' && typeof krRenderDashboard==='function') krRenderDashboard();
  else if(id==='kr-cases' && typeof krRenderCases==='function') krRenderCases();
  else if(id==='kr-notifications' && typeof krRenderNotifs==='function') krRenderNotifs();
  else if(id==='kr-casedetail') krRenderCaseDetail();
  try{ krUpdateBadges(); }catch(e){}
}
function krBoot(){
  try{ i18nStart(); }catch(e){}
  document.querySelectorAll('.me-name').forEach(function(el){ el.textContent = ME_NAME; });
  var start = canDo('krview') || canDo('krviewOwn') ? 'kr-dashboard' : null; /* 地址带 ?case=诊所:案件号 时直接进详情 */
  if(!start){ location.replace(homeUrl()); return; }
  CURRENT_PAGE_ID = start;
  var q = new URLSearchParams(location.search).get('case');
  if(q){ var pr = q.split(':'); if(!krFindCase(pr[0], pr[1])){ location.replace(homeUrl()); return; } KR_CASE = {clinicId:pr[0], id:pr[1], tab:new URLSearchParams(location.search).get('tab')||'basic'}; start = 'kr-casedetail'; }
  krRenderPage(start); showPage(start);
  KR_LAST_UNREAD = krNotifUnread().length; krUpdateBadges();
}

/* ---------- 管理类页面（代表院长在 owner.html、管理者在 kr.html；范围 = 本医院） ---------- */
function krAccountStatusPill(a){ var s = STATUS_STYLE[a.status]; return '<span class="status-pill" style="background:'+s[1]+';color:'+s[2]+';">'+s[0]+'</span>'; }
(function(){
  var baseAccounts = ADMIN_RENDER.accounts, baseClinic = ADMIN_RENDER.clinic, baseBiz = ADMIN_RENDER.bizdata;
  ADMIN_RENDER.accounts = function(el, r){
    if(!isKrAccount()) return baseAccounts(el, r);
    var hid = krHospitalIdOfMe(), list = hospitalAccounts(hid), me = currentAccount();
    var cnt = function(role){ return list.filter(function(a){ return a.role===role && a.status!=='disabled'; }).length; };
    var stat = function(label, big, sub){ return '<div class="card" style="padding:14px 18px;flex:1;min-width:150px;"><div style="font-size:11px;color:var(--muted);">'+label+'</div><div style="font-size:22px;font-weight:700;margin:4px 0;">'+big+'</div><div style="font-size:11px;color:var(--slate2);">'+sub+'</div></div>'; };
    var rows = '<div class="trow head" style="grid-template-columns:0.7fr 1fr 2.2fr 1fr 1fr;"><span>账号 ID</span><span>类型</span><span>当前使用人</span><span>席位</span><span>状态</span></div>'+
      list.map(function(a){ return '<div class="trow" style="grid-template-columns:0.7fr 1fr 2.2fr 1fr 1fr;"><span><b>'+a.id+'</b>'+(a.id===me.id?'<span style="font-size:10px;color:var(--navy);margin-left:6px;">我</span>':'')+'</span><span>'+t(KR_ROLE_LABEL[a.role])+'</span><span><b>'+aEsc(a.name)+'</b><span style="color:var(--muted);font-size:11px;margin-left:6px;">'+aEsc(a.position||'')+'</span></span><span>'+(a.seat==='basic'?'基础':'加购')+'</span><span>'+krAccountStatusPill(a)+'</span></div>'; }).join('');
    el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('账号管理')+' · '+aEsc(krHospitalName())+'</div>'+
      '<div style="display:flex;gap:12px;flex-wrap:wrap;">'+stat('基本席位','3 个','代表院长 1 · 管理者 1 · 室长 1（不能退订）')+stat('院长账号', cnt('kr_director')+' 个', '加购')+stat('管理者', cnt('kr_manager')+' 个','')+stat('室长', cnt('kr_general')+' 个','')+'</div>'+
      '<div class="card" style="padding:4px 20px;">'+rows+'</div>'+
      '<div style="font-size:11px;color:var(--muted);line-height:1.7;">KR 账号的购买 / 退订 / 重设密码 / 换使用人规则同 IN 端（Notion Accounts & Settings 第 7 节），操作入口在后面几份指令里做；这一页先只读。</div>';
  };
  ADMIN_RENDER.clinic = function(el, r){
    if(!isKrAccount()) return baseClinic(el, r);
    var h = krHospital(), clinics = krClinics();
    var row = function(k, v){ return '<div class="field-row"><span class="fk">'+k+'</span><span class="fv" style="font-weight:400;">'+v+'</span><span class="fa"></span></div>'; };
    el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('医院设定')+'</div>'+
      '<div class="card" style="padding:2px 20px;">'+row('医院名称（韩 / 英）', aEsc(h.name.ko)+' / '+aEsc(h.name.en))+row('地址', aEsc(h.address))+row('时区', aEsc(tzLabel(h.tz||'Asia/Seoul')))+row('对接的诊所', clinics.map(function(c){ return aEsc(c.name); }).join('、')||'—')+'</div>'+
      '<div class="card" style="padding:14px 20px;"><div style="font-size:13px;font-weight:700;margin-bottom:6px;">'+t('定期休诊（每周固定，韩国时间）')+'</div>'+closedRulesEditorHtml(HOSP_CLOSED_DRAFT || h.closedRules || [], 'hospSetClosed')+
        '<div style="font-size:11px;color:var(--muted);margin:6px 0 10px;">整天休诊：IN 的 KR 医院日程里显示 1/3 宽的窄列，客人 / IN 选不了这天的施术日期；部分时段休诊：该时段灰色。</div>'+
        (canDo('clinic') ? '<button class="btn-primary" onclick="saveHospClosed()">'+t('保存')+'</button>' : '')+'</div>'+
      '<div style="font-size:11px;color:var(--muted);">医院设定的其他编辑项（语言、短信等）在后面几份指令里做；院长名单、开放施术日期、日程在 KR 端的日程管理 / 院长管理里。</div>';
  };
  var HOSP_CLOSED_DRAFT = null;
  window.hospSetClosed = function(dow, mode, from){
    var h = krHospital(); if(!HOSP_CLOSED_DRAFT) HOSP_CLOSED_DRAFT = JSON.parse(JSON.stringify(h.closedRules || []));
    closedRulesSet(HOSP_CLOSED_DRAFT, dow, mode, from, '16:00'); openAdminPage('clinic', true);
  };
  window.saveHospClosed = function(){
    if(!canDo('clinic') || !HOSP_CLOSED_DRAFT) { showToast('没有修改', '定期休诊和之前一样', null); return; }
    var h = krHospital(), old = closedRulesText(h.closedRules), nw = closedRulesText(HOSP_CLOSED_DRAFT);
    if(old===nw){ HOSP_CLOSED_DRAFT = null; showToast('没有修改', '定期休诊和之前一样', null); return; }
    h.closedRules = HOSP_CLOSED_DRAFT; HOSP_CLOSED_DRAFT = null;
    logOp('设定变更', '医院设定 · 定期休诊：'+old+' → '+nw); Store.touch(); openAdminPage('clinic', true); showToast('已保存', '定期休诊：'+nw, null);
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
function krIsDirector(){ var a = currentAccount(); return !!a && a.role==='kr_director'; }

/* 卡片 → 案件列表筛选条件（四里用同一份判断） */
var KR_CARDS = [
  {key:'eta', ord:10,      label:'待确认报告时间', tip:'客人已缴面诊费，等室长确认预计出报告时间', test:function(r){ return r.c.consultStatus==='paid_waiting_kr'; }},
  {key:'due', ord:20,      label:'报告快到期 / 已超时', tip:'预计出报告时间 24 小时内，或已超时', test:function(r){ if(r.c.consultStatus!=='awaiting_report') return false; if(reportOverdueNow(r.c)) return true; var e = reportEtaParse(r.c.reportEta); return !!e && (e - nowDateObj()) <= 86400000; }},
  {key:'sched',    label:'待确认施术时间', tip:'客人提交了施术日期，等 KR 确认', test:function(r){ return r.c.stage==='travel' && scheduleState(r.c)==='Pending'; }},
  {key:'change',   label:'改期待确认', tip:'客人申请改期，等 KR 确认', test:function(r){ return r.c.stage==='travel' && scheduleState(r.c)==='Changing'; }},
  {key:'today',    label:'今天到院', tip:'施术日期是今天的客人', test:function(r){ var ks = r.c.krSchedule; return !!ks && ['confirmed','arrived'].indexOf(ks.status)>-1 && ks.confirmedDate===krToday(); }},
  {key:'waiting', ord:15, label:'等待报告', tip:'等待报告的案件总数；快到期 / 已超时的标红', test:function(r){ return r.c.consultStatus==='awaiting_report'; }, hot:function(r){ if(reportOverdueNow(r.c)) return true; var e = reportEtaParse(r.c.reportEta); return !!e && (e - nowDateObj()) <= 86400000; }},
  {key:'timeline', label:'timeline 待整理', tip:'已付定金、还没有整理在韩 timeline', test:function(r){ return r.noTimeline; }},
  {key:'subtoday', label:'今日在韩子项', tip:'今天要做的在韩子项（还没完成）', test:function(r){ return r.subToday>0; }}
];
function krCardRows(card, rows){ return rows.filter(card.test); }
/* 点卡片 → 案件列表（带筛选）；案件列表在第四部分 */
var KR_LIST = {tab:'all', card:'', clinic:'', director:'', q:'', mine:false};
function krGoCards(key){ KR_LIST.card = key; KR_LIST.tab = 'all'; KR_LIST.clinic = ''; KR_LIST.director = ''; KR_LIST.q = ''; KR_LIST.mine = false; nav('kr-cases'); }

function krConfirmToday(){
  var h = krHData(); if(!h) return;
  h.dayConfirm[krToday()] = {by: ME_NAME, at: nowFullDt()}; /* UTC */
  logOp('其他', '确认今日院长日程（'+krToday()+'）', '日程');
  Store.touch(); krRenderDashboard();
}
function krOffRows(hid, date){ return (HOSPITAL_DATA[hid].offs||[]).filter(function(o){ return offApplies(o, date); }); }

function krCardHtml(card, rows){
  var hit = krCardRows(card, rows), per = {};
  hit.forEach(function(r){ per[r.clinicName] = (per[r.clinicName]||0) + 1; });
  var sub = krClinics().map(function(cl){ return '<span style="margin-right:10px;">'+krEsc(cl.name)+' <b>'+(per[cl.name]||0)+'</b></span>'; }).join('');
  var warn = hit.length && (card.hot ? hit.some(card.hot) : card.key==='due'); /* 快到期 / 已超时标红 */
  return '<div class="card" onclick="krGoCards(\''+card.key+'\')" title="'+krEsc(card.tip)+'" style="padding:14px 16px;cursor:pointer;min-width:0;'+(warn?'border-color:#E8A8A0;':'')+'">'+
    '<div style="font-size:12px;color:var(--slate2);">'+t(card.label)+'</div>'+
    '<div style="font-size:28px;font-weight:700;margin:4px 0;color:'+(warn?'#B2453A':'var(--navy)')+';">'+hit.length+'</div>'+
    '<div style="font-size:11px;color:var(--muted);line-height:1.6;">'+sub+'</div></div>';
}
function krArrivalsHtml(rows){
  var list = rows.filter(KR_CARDS[4].test).sort(function(a,b){ return (a.c.krSchedule.confirmedTime||'').localeCompare(b.c.krSchedule.confirmedTime||''); });
  if(!list.length) return '<div style="padding:18px;color:var(--muted);font-size:13px;">今天没有到院的客人</div>';
  return '<div class="trow head" style="grid-template-columns:0.6fr 1.2fr 1fr 1fr 2.4fr;"><span>时间</span><span>客户</span><span>来源诊所</span><span>院长</span><span>项目</span></div>'+
    list.map(function(r){
      var items = Store.withClinic(r.clinicId, function(){ return krActiveItems(r.c).map(function(it){ return it.name; }); }) || [];
      return '<div class="trow" onclick="krOpenCase(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:0.6fr 1.2fr 1fr 1fr 2.4fr;cursor:pointer;"><span><b>'+krEsc(r.c.krSchedule.confirmedTime||'—')+'</b></span><span>'+krEsc(r.name)+'</span><span>'+krEsc(r.clinicName)+'</span><span>'+krEsc(r.director)+'</span><span style="color:var(--slate2);">'+krEsc(items.join('、')||'—')+'</span></div>';
    }).join('');
}
function krOpenCase(clinicId, id){ if(typeof krShowCase==='function') krShowCase(clinicId, id); } /* 案件详情骨架在第五部分 */

function krOffBar(hid){
  var offs = krOffRows(hid, krToday());
  return '<div class="card" style="padding:10px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:13px;"><b>今日 OFF</b>'+
    (offs.length ? offs.map(function(o){ return '<span class="status-pill" style="background:#EDEAE2;color:var(--slate2);">'+krEsc(o.who)+(o.note?' · '+krEsc(o.note):'')+'</span>'; }).join('') : '<span style="color:var(--muted);">没有人 OFF</span>')+'</div>';
}

function krGreeting(){ var hr = nowDateObj().getHours(); return (hr < 12 ? '早上好' : hr < 18 ? '下午好' : '晚上好')+'，'+(ME_NAME||''); }
function krScrollCal(){ var el = document.getElementById('kr-cal'); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }
function krRenderDashboard(){
  var el = document.getElementById('krdash-body'); if(!el) return;
  var hid = krHospitalIdOfMe(), h = krHData(), rows = krAllCases();
  var head = '<div style="font-size:18px;font-weight:700;">'+krEsc(krGreeting())+' <span style="font-size:13px;font-weight:400;color:var(--muted);">'+krEsc(krHospitalName())+' · '+krToday()+'</span></div>';
  if(krIsDirector()){ el.innerHTML = head + krOffBar(hid) + krDirectorBlocks(rows) + krCalendarHtml(); return; }
  var conf = h.dayConfirm[krToday()];
  var banner = conf ? '' : '<div class="card" style="padding:12px 16px;display:flex;align-items:center;gap:12px;background:#FBF0C9;border-color:#E8D48A;"><span style="flex:1;font-size:13px;color:#8F6F0C;"><b>今日院长日程尚未确认</b></span><button class="btn-primary" onclick="krScrollCal()">去确认 →</button></div>';
  var cards = KR_CARDS.slice().sort(function(a0,b0){ return (a0.ord||50)-(b0.ord||50); });
  el.innerHTML = head + krOffBar(hid) + banner +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">'+cards.map(function(c){ return krCardHtml(c, rows); }).join('')+'</div>'+
    krCalendarHtml();
}

/* 院长大盘：今日自己的日程、等我出报告的案件、室长刚提交的报告（近 7 天，未读加粗） */
function krDirectorBlocks(rows){
  var me = currentAccount(), h = krHData(), today = krToday();
  /* 第一块：今天的平台客人（今天到院施术、回诊的 IN 案件）；不再显示医院自己的行程 */
  var arrivals = rows.filter(KR_CARDS[4].test).sort(function(a,b){ return (a.c.krSchedule.confirmedTime||'').localeCompare(b.c.krSchedule.confirmedTime||''); });
  var todaySubs = []; rows.forEach(function(r){ (r.c.subItems||[]).forEach(function(s){ if(s.date===today && s.place!=='IN' && !s.done && s.kind!=='施术') todaySubs.push({r:r, s:s}); }); });
  var schedHtml = arrivals.map(function(r){
      var items = krActiveItems(r.c).map(function(it){ return it.name; }).join('、');
      return '<div class="trow" onclick="krOpenCase(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:0.6fr 1.2fr 1fr 2.4fr;cursor:pointer;"><span><b>'+krEsc(r.c.krSchedule.confirmedTime||'—')+'</b></span><span>到院施术：'+krEsc(r.name)+'</span><span>'+krEsc(r.clinicName)+'</span><span style="color:var(--slate2);">'+krEsc(items||'—')+'</span></div>';
    }).join('')+
    todaySubs.map(function(x){ return '<div class="trow" onclick="krOpenCase(\''+x.r.clinicId+'\',\''+x.r.id+'\')" style="grid-template-columns:0.6fr 1.2fr 1fr 2.4fr;cursor:pointer;"><span style="color:var(--muted);">今天</span><span>'+krEsc(x.s.kind)+'：'+krEsc(x.r.name)+'</span><span>'+krEsc(x.r.clinicName)+'</span><span style="color:var(--slate2);">'+krEsc(x.s.content)+'</span></div>'; }).join('');
  if(!arrivals.length && !todaySubs.length) schedHtml = '<div style="padding:18px;color:var(--muted);font-size:13px;">今天没有平台客人</div>';
  var waiting = rows.filter(function(r){ return r.c.consultStatus==='awaiting_report'; }).sort(function(a,b){ return (a.c.reportEta||'9999').localeCompare(b.c.reportEta||'9999'); });
  var waitHtml = waiting.length ? waiting.map(function(r){
    var over = reportOverdueNow(r.c);
    return '<div class="trow" onclick="krOpenCase(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:1.2fr 1fr 1.4fr;cursor:pointer;"><span><b>'+krEsc(r.name)+'</b></span><span>'+krEsc(r.clinicName)+'</span><span style="'+(over?'color:#B2453A;font-weight:600;':'')+'">预计 '+krEsc(fmtUtc(r.c.reportEta)||'—')+(over?'（已超时）':'')+'</span></div>';
  }).join('') : '<div style="padding:18px;color:var(--muted);font-size:13px;">没有等你出报告的案件</div>';
  var weekAgo = new Date(nowDateObj().getTime() - 7*86400000).toISOString().slice(0,10);
  var read = h.reportRead[me.id] || [];
  var done = rows.filter(function(r){ return r.c.reportUploadedBy && r.c.reportDate && r.c.reportDate >= weekAgo; }).sort(function(a,b){ return b.c.reportDate.localeCompare(a.c.reportDate); });
  var doneHtml = done.length ? done.map(function(r){
    var unread = read.indexOf(r.clinicId+':'+r.id) < 0;
    return '<div class="trow" onclick="krReadReport(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:1.2fr 1fr 1fr 1fr;cursor:pointer;'+(unread?'font-weight:700;':'color:var(--slate2);')+'"><span>'+(unread?'● ':'')+krEsc(r.name)+'</span><span>'+krEsc(r.clinicName)+'</span><span>'+krEsc(r.c.reportDate)+'</span><span>'+krEsc(r.c.reportUploadedBy)+'</span></div>';
  }).join('') : '<div style="padding:18px;color:var(--muted);font-size:13px;">近 7 天没有新提交的报告</div>';
  var blk = function(title, body){ return '<div style="font-size:15px;font-weight:700;margin-top:6px;">'+title+'</div><div class="card" style="padding:4px 16px;">'+body+'</div>'; };
  return blk('今天的平台客人', schedHtml) + blk('等我出报告的案件（按预计时间）', waitHtml) + blk('室长刚提交的报告（近 7 天，未读加粗）', doneHtml);
}
function krReadReport(clinicId, id){
  var me = currentAccount(), h = krHData(); h.reportRead[me.id] = h.reportRead[me.id] || [];
  var k = clinicId+':'+id; if(h.reportRead[me.id].indexOf(k) < 0) h.reportRead[me.id].push(k);
  Store.touch(); krOpenCase(clinicId, id);
}

/* ---------- 四、KR 案件列表（KR-CASE-03） ---------- */
var KR_TABS = [
  {key:'all', label:'全部'}, {key:'consult', label:'面诊'}, {key:'confirm', label:'项目确认中'}, {key:'sched', label:'施术预约'}, {key:'travel', label:'赴韩施术'}, {key:'ended', label:'已结束'}
];
/* 案件属于哪个 tab（按案件主状态）；本地管理 / 选择项目 / 面诊已取消 这些 KR 已经不用操作的，我的判断：归"已结束"（待确认） */
function krTabOf(r){
  var l = r.label;
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
  }).sort(function(a,b){ return krUrgency(a)-krUrgency(b) || (krKeyTime(a)).localeCompare(krKeyTime(b)); });
}
function krSetList(k, v){ KR_LIST[k] = v; if(k==='tab') krRenderCases(); else krRenderCaseRows(); }
function krClearCard(){ KR_LIST.card = ''; krRenderCases(); }

function krRenderCases(){
  var el = document.getElementById('krcases-body'); if(!el) return;
  var hid = krHospitalIdOfMe(), all = krAllCases(), isDir = krIsDirector();
  var counts = {}; KR_TABS.forEach(function(t0){ counts[t0.key] = t0.key==='all' ? all.length : all.filter(function(r){ return krTabOf(r)===t0.key; }).length; });
  var tabs = KR_TABS.map(function(t0){ var on = KR_LIST.tab===t0.key; return '<button onclick="krSetList(\'tab\',\''+t0.key+'\')" style="padding:7px 14px;border-radius:18px;border:1px solid var(--line);background:'+(on?'var(--navy)':'#fff')+';color:'+(on?'#fff':'var(--slate)')+';cursor:pointer;font-size:13px;">'+t(t0.label)+' <span style="opacity:.7;">'+counts[t0.key]+'</span></button>'; }).join('');
  var clinicOpts = '<option value="">全部来源诊所</option>'+krClinics().map(function(cl){ return '<option value="'+cl.id+'"'+(KR_LIST.clinic===cl.id?' selected':'')+'>'+krEsc(cl.name)+'</option>'; }).join('');
  var dirOpts = '<option value="">全部院长</option>'+hospitalDirectorNames(hid).map(function(d){ return '<option value="'+krEsc(d)+'"'+(KR_LIST.director===d?' selected':'')+'>'+krEsc(d)+'</option>'; }).join('');
  var card = KR_CARDS.filter(function(c){ return c.key===KR_LIST.card; })[0];
  el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('案件列表')+'</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+tabs+'</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
      '<select onchange="krSetList(\'clinic\',this.value)" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;">'+clinicOpts+'</select>'+
      (isDir ? '' : '<select onchange="krSetList(\'director\',this.value)" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;">'+dirOpts+'</select>')+
      '<input placeholder="搜索客户姓名 / Case ID" value="'+krEsc(KR_LIST.q)+'" oninput="krSetList(\'q\',this.value)" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;min-width:200px;">'+
      (isDir ? '' : '<label style="font-size:13px;display:flex;align-items:center;gap:5px;cursor:pointer;"><input type="checkbox" '+(KR_LIST.mine?'checked':'')+' onchange="krSetList(\'mine\',this.checked)"> 仅看我的</label>')+
      (card ? '<span class="status-pill" style="background:var(--blue-bg);color:var(--blue);cursor:pointer;" onclick="krClearCard()">筛选：'+t(card.label)+' ✕</span>' : '')+
    '</div>'+
    '<div class="card" style="padding:4px 16px;" id="kr-rows"></div>';
  krRenderCaseRows();
}
function krRenderCaseRows(){
  var box = document.getElementById('kr-rows'); if(!box) return;
  var rows = krFilteredRows(), g = 'minmax(0,1.1fr) minmax(0,0.9fr) minmax(0,1.1fr) minmax(0,0.9fr) minmax(0,1.7fr) minmax(0,1.3fr) minmax(0,0.9fr) minmax(0,0.8fr)';
  box.innerHTML = '<div class="trow head" style="grid-template-columns:'+g+';"><span>客户姓名</span><span>Case ID</span><span>来源诊所</span><span>院长</span><span>状态</span><span>关键时间</span><span>KR 室长</span><span>更新时间</span></div>'+
    (rows.length ? rows.map(function(r){
      return '<div class="trow" onclick="krOpenCase(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:'+g+';cursor:pointer;align-items:start;">'+
        '<span><b>'+krEsc(r.name)+'</b></span><span>'+krEsc(r.caseNo)+'</span><span>'+krEsc(r.clinicName)+'</span><span>'+krEsc(r.director)+'</span>'+
        '<span><span class="status-pill" style="background:'+r.badge[0]+';color:'+r.badge[1]+';">'+krEsc(r.label)+'</span>'+krSubHtml(r.subItems)+'</span>'+
        '<span style="font-size:12px;">'+krEsc(krKeyTime(r))+'</span><span>'+krEsc(r.krCoordinator)+'</span><span style="color:var(--muted);font-size:12px;">'+krEsc(r.updated)+'</span></div>';
    }).join('') : '<div style="padding:24px;color:var(--muted);text-align:center;">没有符合条件的案件</div>');
}

/* ---------- 五、KR 案件详情骨架（KR-CASE-01 第 1 节）：现在全部只读，面诊/项目/施术的操作在后面几份指令里做 ---------- */
var KR_CASE = {clinicId:'', id:'', tab:'basic'};
var KR_CASE_TABS = [{key:'basic', label:'基础资料'}, {key:'consult', label:'面诊'}, {key:'items', label:'项目'}, {key:'proc', label:'施术'}, {key:'files', label:'附件'}, {key:'related', label:'关联案件'}, {key:'log', label:'Timeline'}];
function krShowCase(clinicId, id){ KR_CASE = {clinicId:clinicId, id:id, tab:'basic'}; if(CURRENT_PAGE_ID==='kr-casedetail'){ krRenderCaseDetail(); } else nav('kr-casedetail'); }
function krSetCaseTab(k){ KR_CASE.tab = k; krRenderCaseDetail(); }

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
    krCardBox('检测与上传', krKV('메타뷰 检测', c.metaviewStatus==='ready' ? '已检测到' : '—')+krKV('照片', c.photoUploaded?'✓ 已上传':'—')+krKV('视频', c.videoUploaded?'✓ 已上传':'—'));
}
/* ---- 面诊 tab（KR-CASE-01 第 2 节）：按状态给不同内容；操作都经 Store.mutateClinic 写进来源诊所的分区 ---- */
function krCan(){ return canDo('krwork'); } /* 室长 / 管理者 */
function krIsMyCase(c){ var me = currentAccount(); return !!me && (me.role!=='kr_director' || c.director===me.name || c.director===me.name+' 원장'); }
function krMut(fn){ var r = Store.mutateClinic(KR_CASE.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===KR_CASE.id; })[0]; return c ? fn(c) : undefined; }); krRefreshAll(); return r; }
function krTimeOptions(sel){ var o = ''; for(var m = 8*60; m <= 20*60; m += 30){ var tt = minToTime(m); o += '<option'+(tt===sel?' selected':'')+'>'+tt+'</option>'; } return o; }
function krDateAdd(n){ var d = new Date(nowDateObj().getTime() + n*86400000); return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }

/* 一、预计出报告时间 */
function krEtaBlock(c, change){
  var hid = krHospitalIdOfMe(), today = krToday(), tomorrow = krDateAdd(1);
  var sched = ((HOSPITAL_DATA[hid].directorSchedule||{})[c.director]||[]);
  var day = function(d, label){ var l = sched.filter(function(s){ return s.date===d; }).sort(function(a,b){ return a.time.localeCompare(b.time); }); return '<div style="font-size:12px;margin-bottom:6px;"><b>'+label+' '+d+'</b>：'+(l.length ? l.map(function(s){ return krEsc(s.time+' '+s.title); }).join('、') : '<span style="color:var(--muted);">没有日程</span>')+'</div>'; };
  var offs = krOffRows(hid, today).concat(krOffRows(hid, tomorrow)).filter(function(o){ return o.who===c.director; });
  var base = c.reportEta ? fmtUtc(c.reportEta).split(' ') : [krDateAdd(1), '14:00']; /* UTC 存，KR 页面按韩国时间显示 / 输入 */
  var form = krCan()
    ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;"><input type="date" id="kr-eta-d" value="'+base[0]+'" min="'+today+'" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;"><select id="kr-eta-t" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;">'+krTimeOptions(base[1])+'</select><button class="btn-primary" onclick="krDoEta('+(change?'true':'false')+')">'+(change?'确认修改':'确认')+'</button>'+(change?'<button class="btn-ghost" onclick="krSetEtaEdit(false)">取消</button>':'')+'</div>'
    : '<div style="font-size:12px;color:var(--muted);margin-top:8px;">预计出报告时间由 KR 室长确认，院长账号不能改。</div>';
  return krCardBox(change ? '修改预计出报告时间' : '确认预计出报告时间（院长 '+krEsc(c.director||'—')+'）',
    '<div style="font-size:12px;color:var(--slate2);margin-bottom:8px;">参考院长当天和隔天的日程（来自日程管理）：</div>'+day(today,'今天')+day(tomorrow,'明天')+(offs.length ? '<div style="font-size:12px;color:#C26A1B;">⚠ 院长 OFF：'+offs.map(function(o){ return krEsc(o.date+(o.note?' '+o.note:'')); }).join('、')+'</div>' : '')+form);
}
var KR_ETA_EDIT = false;
function krSetEtaEdit(v){ KR_ETA_EDIT = v; krRenderCaseDetail(); }
function krDoEta(change){
  if(!krCan()) return; /* 院长不能确认/修改时间 */
  var d = document.getElementById('kr-eta-d').value, tm = document.getElementById('kr-eta-t').value;
  if(!d || !tm){ alert('请填日期和时间'); return; }
  var eta = localToUtc(d, tm, KR_TZ); /* KR 输入的是韩国当地时间，存 UTC */
  if(eta <= nowFullDt()){ alert('预计出报告时间必须晚于现在'); return; }
  KR_ETA_EDIT = false;
  krMut(function(c){ return coreSetReportEta(c, eta, ME_NAME, !!change); });
}
function krEtaStatusBlock(c){
  var over = reportOverdueNow(c);
  return krCardBox('预计出报告时间', krKV('预计时间', krEsc(fmtUtc(c.reportEta)||'—'))+krKV('倒计时', over ? '<b style="color:#C26A1B;">已超过预计时间</b>' : krEsc(reportRemainingText(c)))+
    (over ? '<div style="background:#FDEBD3;color:#A85A10;border-radius:8px;padding:9px 12px;font-size:12px;margin-top:8px;">⏰ 已超过预计出报告时间，报告还没提交。请尽快提交，或修改预计时间（IN 端会收到通知）。</div>' : '')+
    (krCan() && !KR_ETA_EDIT ? '<div style="margin-top:10px;"><button class="btn-outline" onclick="krSetEtaEdit(true)">修改预计时间</button></div>' : ''));
}

function krTabConsult(c){
  var fee = consultFeeStatusMain(c), out = '';
  var head = krCardBox('面诊费', krKV('状态', fee+(c.consultFeeWaived ? '（原因：'+krEsc(c.consultFeeWaived.reason)+'）' : '')))+krCardBox('当前小状态', krSubHtml(caseSubStatusItems(c))||krEmpty('—'));
  if(c.reuseReport) return head+krCardBox('沿用原报告', krKV('来源', krEsc(c.reuseReport.caseNo)+'（'+krEsc(c.reuseReport.date||'')+'）')+krKV('报告', krEsc(c.videoSummary||'—')))+(typeof krAfterBlock==='function' ? krAfterBlock(c) : '');
  if(c.consultStatus==='paid_waiting_kr') return head+krEtaBlock(c, false);
  if(c.consultStatus==='awaiting_report'){
    out = head+krEtaStatusBlock(c)+(KR_ETA_EDIT ? krEtaBlock(c, true) : '');
    if(isContinuationConsult(c)) return out+krJudgeBlock(c); /* 延续既往面诊：先判断有无变动 */
    return out+krRecordBlock(c);
  }
  if(c.consultStatus==='report_ready') return head+krCardBox('报告', krKV('提交', krEsc(c.reportDate||'—')+'，'+krEsc(c.reportUploadedBy||'—'))+krKV('面诊摘要', krEsc(c.videoSummary||'—')))+(typeof krAfterBlock==='function' ? krAfterBlock(c) : '');
  return head;
}
function krTabItems(c){
  var all = krAllItems(c);
  var rows = all.length ? all.map(function(it){
    var st = krItemStatus(it);
    return '<div class="case-field-row"><span style="flex:1;font-size:13px;'+(it.cancelled?'text-decoration:line-through;color:var(--muted);':'')+'">'+krEsc(it.name)+'</span><span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+st+'</span></div>';
  }).join('') : krEmpty('还没有选择赴韩项目');
  var sch = scheduleState(c), ks = c.krSchedule || {};
  return krCardBox('赴韩项目', rows)+
    krCardBox('KR 可选范围', krEsc(c.krScope && c.krScope.length ? (Array.isArray(c.krScope) ? c.krScope.join('、') : String(c.krScope)) : '—'))+
    '<div style="font-size:11px;color:var(--muted);">只读：设定可选范围、报价等操作在后面的指令里做。</div>';
}
/* ---- 施术 tab（KR-CASE-02 第 3 节）：按施术日期状态给不同内容 ---- */
function krSchedDayHtml(c, date){
  var hid = krHospitalIdOfMe(), l = ((HOSPITAL_DATA[hid].directorSchedule||{})[c.director]||[]).filter(function(s){ return s.date===date; }).sort(function(a,b){ return a.time.localeCompare(b.time); });
  var open = hospitalOpenDates(hid, c.director).indexOf(date) > -1;
  return '<div style="font-size:12px;margin:4px 0 8px 22px;color:var(--slate2);">院长 '+krEsc(c.director||'—')+' 当天日程：'+(l.length ? l.map(function(s){ return krEsc(s.time+' '+s.title+(s.name?'（'+s.name+'）':'')); }).join('、') : '没有日程')+(open ? '' : ' <span style="color:#C26A1B;">（这天不是开放施术日期）</span>')+'</div>';
}
var KR_SCH = {caseKey:'', pick:'', time:'', address:null, reason:''};
function krSchReset(c, defaults){
  if(KR_SCH.caseKey !== krRecKey()+':'+(c.krSchedule ? c.krSchedule.status : '')) KR_SCH = {caseKey:krRecKey()+':'+(c.krSchedule ? c.krSchedule.status : ''), pick:defaults.pick||'', time:defaults.time||'10:00', address:null, reason:''};
  if(KR_SCH.address===null) KR_SCH.address = defaults.address||'';
}
function krSchSet(k, v){ KR_SCH[k] = v; if(k==='pick') krRenderCaseDetail(); }
function krDefaultAddress(){ var h = krHospital(); return h ? h.address : ''; }
function krSchForm(c, dates, labels, confirmFn, rejectFn, confirmLabel){
  var opts = dates.map(function(d, i){ return '<label style="display:block;margin:6px 0;font-size:13px;cursor:pointer;"><input type="radio" name="kr-sch-pick" '+(KR_SCH.pick===d?'checked':'')+' onchange="krSchSet(\'pick\',\''+d+'\')"> '+labels[i]+' <b>'+d+'</b></label>'+krSchedDayHtml(c, d); }).join('');
  var inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
  return opts+'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;"><span style="font-size:12px;">到院时间</span><select onchange="krSchSet(\'time\',this.value)" style="'+inp+'">'+krTimeOptions(KR_SCH.time)+'</select>'+
    '<input value="'+krEsc(KR_SCH.address)+'" oninput="krSchSet(\'address\',this.value)" placeholder="地址" style="'+inp+'flex:1;min-width:260px;"></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;"><button class="btn-primary" onclick="'+confirmFn+'()">'+confirmLabel+'</button>'+
    '<input value="'+krEsc(KR_SCH.reason)+'" oninput="krSchSet(\'reason\',this.value)" placeholder="无法安排的原因" style="'+inp+'min-width:200px;"><button class="btn-outline" onclick="'+rejectFn+'()">无法安排</button></div>';
}
function krDoSchConfirm(isChange){
  if(!krCan()) return;
  if(!KR_SCH.pick){ alert('请先选一个日期'); return; }
  if(!KR_SCH.time){ alert('请填到院时间'); return; }
  var d = KR_SCH.pick, t0 = KR_SCH.time, a = (KR_SCH.address||'').trim();
  var rr = krFindCase(KR_CASE.clinicId, KR_CASE.id), er = rr ? krSurgerySlotError(krHospitalIdOfMe(), rr.c.director, d, t0, surgeryMinutes(rr.c)) : ''; if(er){ alert(er); return; }
  krMut(function(c){ return isChange ? coreChangeConfirm(c, d, t0, a, ME_NAME) : coreScheduleConfirm(c, d, t0, a, ME_NAME); });
}
function krDoSchReject(isChange){
  if(!krCan()) return;
  var r0 = (KR_SCH.reason||'').trim(); if(!r0){ alert('请填无法安排的原因'); return; }
  krMut(function(c){ return isChange ? coreChangeReject(c, r0, ME_NAME) : coreScheduleReject(c, r0, ME_NAME); });
}
function krDoSchAdjust(){
  if(!krCan()) return;
  var t0 = KR_SCH.time, a = (KR_SCH.address||'').trim(); if(!t0){ alert('请填到院时间'); return; }
  var rr = krFindCase(KR_CASE.clinicId, KR_CASE.id), er = (rr && rr.c.krSchedule) ? krSurgerySlotError(krHospitalIdOfMe(), rr.c.director, rr.c.krSchedule.confirmedDate, t0, surgeryMinutes(rr.c)) : ''; if(er){ alert(er); return; }
  krMut(function(c){ return coreScheduleAdjust(c, t0, a, ME_NAME); });
}
function krTabProc(c){
  var ks = c.krSchedule, st = scheduleState(c), can = krCan();
  var items = krAllItems(c).map(function(it){ return '<div class="case-field-row" style="font-size:13px;flex-direction:column;align-items:flex-start;"><div style="display:flex;width:100%;"><span style="flex:1;'+(it.cancelled?'text-decoration:line-through;color:var(--muted);':'')+'">'+krEsc(it.name)+'</span><span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+krItemStatus(it)+'</span></div>'+krItemMetaHtml(it)+'</div>'; }).join('');
  var body = '';
  if(st==='Draft'){
    body = krEmpty('IN 还没有递交施术日期（IN 室长付定金后在月历里选首选 / 备选日期）。')+(ks && ks.rejectNote ? '<div style="font-size:12px;color:#C26A1B;">上次回复"无法安排"：'+krEsc(ks.rejectNote)+'</div>' : '');
  } else if(st==='Pending'){
    var dates = [ks.primary].concat(ks.backup ? [ks.backup] : []);
    krSchReset(c, {pick:ks.primary, time:'10:00', address:krDefaultAddress()});
    body = '<div style="font-size:12px;color:var(--slate2);margin-bottom:6px;">IN 递交的日期（首选 / 备选）：选一个并填到院时间和地址，或回复无法安排。</div>'+(can ? krSchForm(c, dates, dates.map(function(d, i){ return i===0 ? '首选' : '备选'; }), 'krDoSchConfirm.bind(null,false)', 'krDoSchReject.bind(null,false)', '确认') : krEmpty('首选 '+krEsc(ks.primary)+(ks.backup?'，备选 '+krEsc(ks.backup):'')+'（院长账号不能确认）'));
  } else if(st==='Confirmed'){
    krSchReset(c, {pick:ks.confirmedDate, time:ks.confirmedTime||'10:00', address:ks.address||krDefaultAddress()});
    var days = Math.round((new Date(ks.confirmedDate+'T00:00:00') - new Date(krToday()+'T00:00:00'))/86400000);
    body = krKV('施术日期', krEsc(ks.confirmedDate)+'（'+(days>0 ? '还有 '+days+' 天' : days===0 ? '就是今天' : '已过 '+(-days)+' 天')+'）')+krKV('到院时间', krEsc(ks.confirmedTime||'—'))+krKV('地址', krEsc(ks.address||'—'))+
      (can ? '<div style="margin-top:12px;font-size:12px;color:var(--slate2);">同一天之内可调整到院时间和地址（IN 会收到通知）；KR 不能改日期，要改日期请在对话里和 IN 室长沟通，由 IN 改。</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;"><select onchange="krSchSet(\'time\',this.value)" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;">'+krTimeOptions(KR_SCH.time)+'</select><input value="'+krEsc(KR_SCH.address)+'" oninput="krSchSet(\'address\',this.value)" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;flex:1;min-width:260px;"><button class="btn-outline" onclick="krDoSchAdjust()">保存调整</button></div>' : '');
  } else if(st==='Changing'){
    if(ks.changeSubmitted){
      var nd = [ks.changePrimary].concat(ks.changeBackup ? [ks.changeBackup] : []);
      krSchReset(c, {pick:ks.changePrimary, time:ks.confirmedTime||'10:00', address:ks.address||krDefaultAddress()});
      body = '<div style="font-size:12px;color:var(--slate2);margin-bottom:6px;">原日期 '+krEsc(ks.confirmedDate+' '+(ks.confirmedTime||''))+' 继续有效。IN 提出的新日期：</div>'+(can ? krSchForm(c, nd, nd.map(function(d, i){ return i===0 ? '新首选' : '新备选'; }), 'krDoSchConfirm.bind(null,true)', 'krDoSchReject.bind(null,true)', '确认新时间') : krEmpty('新首选 '+krEsc(ks.changePrimary)+(ks.changeBackup?'，新备选 '+krEsc(ks.changeBackup):'')));
    } else body = krEmpty('IN 正在选新日期（原日期 '+krEsc(ks.confirmedDate)+' 继续有效）');
  } else {
    body = krKV('施术日期', krEsc(ks.confirmedDate))+krKV('到院时间', krEsc(ks.confirmedTime||'—'))+krKV('地址', krEsc(ks.address||'—'))+krKV('状态', '已到医院');
  }
  return krCardBox('施术日期（'+{Draft:'待 IN 递交', Pending:'待确认施术时间', Confirmed:'时间已确认', Changing:'改期待确认', Arrived:'已到医院'}[st]+'）', body)+krCardBox('赴韩项目', items || krEmpty('没有赴韩项目'))+krArrivalBlock(c)+
    (typeof krProgressBlock==='function' ? krProgressBlock(c) : '');
}
function krTabFiles(c){
  var vaultHtml = krIsMyCase(c) ? krVaultHtml(c) : '';
  var files = caseAttachments(c).filter(function(f){ return !f.chatLog; });
  return vaultHtml + krCardBox('附件', files.length ? files.map(function(f){ return '<div class="case-field-row"><span class="status-pill" style="background:var(--blue-bg);color:var(--blue);font-size:10px;margin-right:8px;">'+krEsc(f.src)+'</span><span style="flex:1;font-size:13px;">'+krEsc(f.label)+'</span><span style="font-size:11px;color:var(--muted);">'+krEsc(f.date||'')+'</span></div>'; }).join('') : krEmpty('没有附件'));
}
function krTabRelated(c){
  var hid = krHospitalIdOfMe();
  var row = function(o, reason, auto){
    var b = caseStatusBadge(o), vis = krCaseVisible(o, hid);
    return '<div class="case-field-row"'+(vis?' style="cursor:pointer;" onclick="krShowCase(\''+KR_CASE.clinicId+'\',\''+o.id+'\')"':'')+'><span style="font-weight:700;min-width:84px;font-size:13px;">'+krEsc(o.caseNo)+'</span><span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+krEsc(reason)+(auto?'（自动）':'')+'</span><span style="flex:1;"></span><span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';">'+b[2]+'</span>'+(vis?'':'<span style="font-size:11px;color:var(--muted);margin-left:8px;">不在本医院</span>')+'</div>';
  };
  var before = '', after = '';
  if(c.linkedCase && c.linkedCase.caseId){ var src = CASE_ITEMS.filter(function(x){ return x.id===c.linkedCase.caseId; })[0]; if(src) before = row(src, c.linkedCase.reason, c.linkedCase.auto); }
  CASE_ITEMS.forEach(function(f){ if(f.linkedCase && f.linkedCase.caseId===c.id) after += row(f, f.linkedCase.reason, f.linkedCase.auto); });
  return krCardBox('之前关联', before||krEmpty())+krCardBox('后续关联', after||krEmpty());
}
function krTabLog(c){
  var rows = (c.logEntries||[]).map(function(e){ return '<div class="case-field-row" style="font-size:12px;align-items:flex-start;"><span style="min-width:120px;color:var(--muted);">'+krEsc(fmtUtc(e.dt||''))+'</span><span style="min-width:70px;color:var(--slate2);">'+krEsc(e.stage||'')+'</span><span style="min-width:90px;font-weight:600;">'+krEsc(e.actor||'')+'</span><span style="flex:1;">'+krEsc(e.action||'')+'</span></div>'; }).join('');
  return krCardBox('Timeline', rows || krEmpty());
}
var KR_TAB_FN = {basic:krTabBasic, consult:krTabConsult, items:krTabItems, proc:krTabProc, files:krTabFiles, related:krTabRelated, log:krTabLog};

function krRenderCaseDetail(){
  var el = document.getElementById('krcase-body'); if(!el) return;
  var r = krFindCase(KR_CASE.clinicId, KR_CASE.id);
  if(!r){ el.innerHTML = '<div class="card" style="padding:24px;color:var(--slate2);"><button class="btn-ghost" onclick="goBack()">← 返回</button><div style="margin-top:12px;">这个案件不存在，或不在你可看的范围内（KR 只能看选了本医院、且已缴 / 免除面诊费的案件；院长只能看自己的案件）。</div></div>'; return; }
  var tabs = KR_CASE_TABS.map(function(t0){ var on = KR_CASE.tab===t0.key; return '<button onclick="krSetCaseTab(\''+t0.key+'\')" style="padding:8px 16px;border:none;border-bottom:2px solid '+(on?'var(--navy)':'transparent')+';background:none;color:'+(on?'var(--navy)':'var(--slate2)')+';font-weight:'+(on?'700':'400')+';cursor:pointer;font-size:14px;">'+t(t0.label)+'</button>'; }).join('');
  var body = Store.withClinic(KR_CASE.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===KR_CASE.id; })[0]; return c ? KR_TAB_FN[KR_CASE.tab](c) : ''; });
  el.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">'+
      '<button class="btn-ghost" onclick="goBack()">← 返回</button>'+
      '<div style="font-size:18px;font-weight:700;">'+krEsc(r.name)+' <span style="font-size:13px;font-weight:400;color:var(--muted);">'+krEsc(r.caseNo)+'</span></div>'+
      '<span class="status-pill" style="background:'+r.badge[0]+';color:'+r.badge[1]+';">'+krEsc(r.label)+'</span><span style="flex:1;"></span>'+
      '<button class="btn-primary" onclick="krOpenCaseChat()">💬 对话</button></div>'+
    '<div class="card" style="padding:12px 20px;display:flex;gap:28px;flex-wrap:wrap;font-size:13px;"><span><span style="color:var(--muted);">来源诊所</span> <b>'+krEsc(r.clinicName)+'</b></span><span><span style="color:var(--muted);">院长</span> <b>'+krEsc(r.director||'—')+'</b></span><span><span style="color:var(--muted);">KR 室长</span> <b>'+krEsc(r.krCoordinator||'—')+'</b></span></div>'+
    '<div style="display:flex;gap:4px;border-bottom:1px solid var(--line);flex-wrap:wrap;">'+tabs+'</div>'+
    '<div style="display:flex;flex-direction:column;gap:14px;">'+(body||'')+'</div>';
}
function krOpenCaseChat(){ if(typeof krOpenRoomFor==='function') krOpenRoomFor(KR_CASE.clinicId, KR_CASE.id); else alert('对话在第六部分实现'); }

/* ---------- 六、KR 通知（K1）与对话 ---------- */
/* 通知：存在医院资料里（HOSPITAL_DATA[h].notifs，全局存档）；室长/管理者看 to='coord'，院长看自己案件的 to='director' */
function krNotifsForMe(){
  var h = krHData(), me = currentAccount(); if(!h || !me) return [];
  return (h.notifs||[]).filter(function(n){
    if(n.to==='all') return true;
    if(me.role==='kr_director') return n.to==='director' && n.director===me.name;
    return n.to==='coord';
  });
}
function krNotifUnread(){ var me = currentAccount(); return krNotifsForMe().filter(function(n){ return (n.readBy||[]).indexOf(me.id) < 0; }); }
function krOpenNotif(id){
  var h = krHData(), me = currentAccount();
  var n = (h.notifs||[]).filter(function(x){ return x.id===id; })[0]; if(!n) return;
  n.readBy = n.readBy || []; if(n.readBy.indexOf(me.id) < 0) n.readBy.push(me.id);
  Store.touch(); krCloseBell();
  if(n.caseId && krFindCase(n.clinicId, n.caseId)) krShowCase(n.clinicId, n.caseId); else krRefreshAll();
}
function krReadAllNotifs(){ var me = currentAccount(); krNotifsForMe().forEach(function(n){ n.readBy = n.readBy||[]; if(n.readBy.indexOf(me.id)<0) n.readBy.push(me.id); }); Store.touch(); krRefreshAll(); }
var KR_NOTIF_FILTER = 'all';
function krNotifRowHtml(n){
  var me = currentAccount(), unread = (n.readBy||[]).indexOf(me.id) < 0, cl = clinicById(n.clinicId);
  return '<div class="trow" onclick="krOpenNotif(\'' + n.id + '\')" style="grid-template-columns:18px 1fr 130px;cursor:pointer;'+(unread?'font-weight:700;':'color:var(--slate2);')+'"><span style="color:var(--terracotta);">'+(unread?'●':'')+'</span><span>'+krEsc(n.text)+(cl?' <span style="font-weight:400;font-size:11px;color:var(--muted);">'+krEsc(cl.name)+'</span>':'')+'</span><span style="font-weight:400;font-size:11px;color:var(--muted);">'+krEsc(fmtUtc(n.ts))+'</span></div>';
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
function krToggleBell(e){
  if(e) e.stopPropagation();
  if(document.getElementById('kr-bell-dd')){ krCloseBell(); return; }
  var list = krNotifsForMe().slice(0, 8);
  var d = document.createElement('div'); d.id = 'kr-bell-dd';
  d.style.cssText = 'position:fixed;top:54px;right:70px;width:360px;max-height:70vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.14);z-index:60;padding:6px 14px;';
  d.onclick = function(ev){ ev.stopPropagation(); };
  d.innerHTML = '<div style="padding:10px 0;font-weight:700;border-bottom:1px solid var(--line);">通知</div>'+(list.length ? list.map(krNotifRowHtml).join('') : '<div style="padding:16px;color:var(--muted);">没有通知</div>')+('<div style="padding:10px 0;text-align:center;"><a href="#" onclick="krCloseBell();nav(\'kr-notifications\');return false;" style="font-size:12px;">查看全部</a></div>');
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
      var unread = msgs.slice(mark).filter(function(m){ return m.from!=='sys' && !krMsgIsMine(m) && (!(me.role==='kr_director' && !caseRow) || krMentionsMe(m)); }).length; /* 院长在 Main 群里是静音的：不计未读、不推播，被 @ 才提醒 */
      var last = msgs.filter(function(m){ return m.from!=='sys'; }).slice(-1)[0];
      out.push({key:key, clinicId:cl.id, roomId:roomId, name:name, clinicName:cl.name, isMain:!caseRow, unread:unread, count:msgs.length, last:last ? krMsgText(last) : '', lastTime:last ? last.time : '', caseRow:caseRow||null});
    };
    add('main-'+hid, 'Main · '+cl.name, null);
    Object.keys(v.CHAT_DATA||{}).forEach(function(rid){
      if(rid.indexOf('case-')!==0) return;
      var r = visible[cl.id+':'+rid.slice(5)]; if(r) add(rid, r.name+' · '+r.caseNo, r);
    });
  });
  return out.sort(function(a,b){ return (b.unread>0)-(a.unread>0) || (b.isMain-a.isMain); });
}
function krMentionsMe(m){ var me = currentAccount(); return !!me && String(m.orig||'').indexOf('@'+me.name.split(' ')[0]) > -1; }
var KR_CHAT = {open:false, room:null};
function krUpdateBadges(){
  try{
    var u = krNotifUnread().length; document.querySelectorAll('.kr-bell-badge').forEach(function(b){ b.textContent = u; b.style.display = u ? '' : 'none'; });
    var c = krRoomList().reduce(function(s, r){ return s + r.unread; }, 0); document.querySelectorAll('.kr-chat-badge').forEach(function(b){ b.textContent = c; b.style.display = c ? '' : 'none'; });
  }catch(e){}
}
var KR_LAST_UNREAD = null;
(function(){ var base = krRefreshAll; krRefreshAll = function(){ base(); if(KR_CHAT.open) krRenderChat(); var u = krNotifUnread(); if(KR_LAST_UNREAD!==null && u.length > KR_LAST_UNREAD){ var n = u[0]; showToast('🔔 通知', krEsc(n.text), function(){ krOpenNotif(n.id); }); } KR_LAST_UNREAD = u.length; }; })();

function krOpenDrawer(){ KR_CHAT.open = true; KR_CHAT.room = null; krRenderChat(); }
function krOpenRoomFor(clinicId, caseId){ KR_CHAT.open = true; KR_CHAT.room = clinicId+'|case-'+caseId; krRenderChat(); }
function krCloseChat(){ KR_CHAT.open = false; var p = document.getElementById('kr-chat'); if(p) p.remove(); }
function krPickRoom(key){ KR_CHAT.room = key; krRenderChat(true); }
function krMarkRead(key, count){ var me = currentAccount(), h = krHData(); h.chatRead = h.chatRead||{}; h.chatRead[me.id] = h.chatRead[me.id]||{}; if(h.chatRead[me.id][key] !== count){ h.chatRead[me.id][key] = count; Store.touch(); } }
function krRenderChat(scrollEnd){
  var p = document.getElementById('kr-chat');
  if(!p){ p = document.createElement('div'); p.id = 'kr-chat'; p.style.cssText = 'position:fixed;top:54px;right:16px;width:400px;height:calc(100vh - 80px);background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 10px 36px rgba(0,0,0,.18);z-index:55;display:flex;flex-direction:column;overflow:hidden;'; document.body.appendChild(p); }
  var rooms = krRoomList(), room = KR_CHAT.room ? rooms.filter(function(r){ return r.key===KR_CHAT.room; })[0] : null;
  var head = function(title, back){ return '<div style="display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line);font-weight:700;">'+(back?'<a href="#" onclick="KR_CHAT.room=null;krRenderChat();return false;" style="text-decoration:none;">←</a>':'')+'<span style="flex:1;">'+title+'</span><a href="#" onclick="krCloseChat();return false;" style="text-decoration:none;color:var(--muted);">✕</a></div>'; };
  if(!room){
    p.innerHTML = head('对话', false)+'<div style="flex:1;overflow:auto;">'+(rooms.length ? rooms.map(function(r){
      return '<div onclick="krPickRoom(\''+r.key+'\')" style="display:flex;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line);cursor:pointer;align-items:center;"><span style="width:34px;height:34px;border-radius:50%;background:'+(r.isMain?'var(--slate2)':'var(--terracotta)')+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">'+(r.isMain?'G':krEsc(r.name.charAt(0)))+'</span><div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;">'+krEsc(r.name)+'</div><div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+krEsc(r.last||'—')+'</div></div><div style="text-align:right;font-size:11px;color:var(--muted);">'+krEsc(r.lastTime)+(r.unread?'<div style="margin-top:4px;background:var(--terracotta);color:#fff;border-radius:10px;padding:1px 7px;display:inline-block;">'+r.unread+'</div>':'')+'</div></div>';
    }).join('') : '<div style="padding:24px;color:var(--muted);text-align:center;">还没有对话</div>')+'</div>';
    krUpdateBadges(); return;
  }
  var msgs = (Store.readClinic(room.clinicId).CHAT_DATA||{})[room.roomId] || [], lastDay = '';
  var body = msgs.map(function(m){
    var day = m.day && m.day!==lastDay ? (lastDay = m.day, '<div style="text-align:center;font-size:11px;color:var(--muted);margin:10px 0;">'+krEsc(m.day)+'</div>') : '';
    if(m.from==='sys') return day+'<div style="text-align:center;font-size:11px;color:var(--muted);margin:6px 0;">'+krEsc(m.orig)+'</div>';
    var mine = krMsgIsMine(m), who = m.from==='me' ? (m.sender||'Dewi')+' · IN' : (m.name||'');
    var ref = m.refCaseId ? '<div style="font-size:11px;color:var(--blue);">↗ 引用案件</div>' : '';
    return day+'<div style="display:flex;flex-direction:column;align-items:'+(mine?'flex-end':'flex-start')+';margin:6px 0;"><div style="font-size:11px;color:var(--muted);margin-bottom:2px;">'+krEsc(who)+' · '+krEsc(msgTime(m)||'')+'</div><div style="max-width:78%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5;background:'+(mine?'var(--navy)':'var(--border2)')+';color:'+(mine?'#fff':'inherit')+';">'+ref+krEsc(krMsgText(m))+'</div></div>';
  }).join('');
  p.innerHTML = head(krEsc(room.name)+' <span style="font-weight:400;font-size:11px;color:var(--muted);">'+krEsc(room.clinicName)+'</span>', true)+
    '<div id="kr-chat-msgs" style="flex:1;overflow:auto;padding:8px 14px;">'+(body||'<div style="padding:24px;color:var(--muted);text-align:center;">还没有消息</div>')+'</div>'+
    '<div style="display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--line);"><input id="kr-chat-in" placeholder="输入消息…（Enter 发送）" onkeydown="if(event.key===\'Enter\')krSendMsg()" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:8px;"><button class="btn-primary" onclick="krSendMsg()">发送</button></div>';
  var box = document.getElementById('kr-chat-msgs'); if(box) box.scrollTop = box.scrollHeight;
  krMarkRead(room.key, msgs.length); krUpdateBadges();
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
function krCanRecord(c){ var me = currentAccount(); return !!me && (canDo('krwork') || (me.role==='kr_director' && krIsMyCase(c))); }
function krRecInput(v){ KR_REC.text = v; }

function krRecStart(mode){
  if(mode==='manual'){ KR_REC.recording = false; krRenderCaseDetail(); var t0 = document.getElementById('kr-rec-text'); if(t0) t0.focus(); return; }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  KR_REC.startedAt = Date.now();
  if(!SR){ /* 浏览器不支持语音识别：用演示文字代替 */
    KR_REC.demoVoice = true; KR_REC.recording = true; KR_REC.text = (KR_REC.text ? KR_REC.text+'\n' : '') + KR_DEMO_TRANSCRIPT; krRenderCaseDetail(); return;
  }
  try{
    var r = new SR(); r.lang = 'ko-KR'; r.continuous = true; r.interimResults = true;
    var base = KR_REC.text ? KR_REC.text+'\n' : '';
    r.onresult = function(e){ var fin = '', itm = ''; for(var i = 0; i < e.results.length; i++){ if(e.results[i].isFinal) fin += e.results[i][0].transcript; else itm += e.results[i][0].transcript; } KR_REC.text = base + fin + itm; var ta = document.getElementById('kr-rec-text'); if(ta) ta.value = KR_REC.text; };
    r.onerror = function(){ /* 没有麦克风权限 / 识别服务不可用：改用演示文字代替 */ KR_REC.demoVoice = true; KR_REC.rec = null; if(!KR_REC.text.trim()) KR_REC.text = KR_DEMO_TRANSCRIPT; krRenderCaseDetail(); };
    r.onend = function(){ if(KR_REC.recording && KR_REC.rec===r){ try{ r.start(); }catch(e){} } };
    KR_REC.rec = r; KR_REC.recording = true; KR_REC.demoVoice = false; r.start();
  }catch(e){ KR_REC.demoVoice = true; KR_REC.recording = true; KR_REC.text += (KR_REC.text ? '\n' : '') + KR_DEMO_TRANSCRIPT; }
  krRenderCaseDetail();
}
function krRecStop(silent){
  if(KR_REC.rec){ try{ KR_REC.rec.stop(); }catch(e){} KR_REC.rec = null; }
  if(!KR_REC.recording) return;
  KR_REC.recording = false;
  if(silent) return;
  if(!KR_REC.text.trim()){ KR_REC.demoVoice = true; KR_REC.text = KR_DEMO_TRANSCRIPT; } /* 没识别到任何内容：演示文字代替 */
  var sec = Math.max(1, Math.round((Date.now() - KR_REC.startedAt)/1000)), v = krVault(KR_CASE.clinicId, KR_CASE.id, true);
  v.audio.push({id:'au'+Date.now(), ts:nowFullDt(), by:ME_NAME, label:'面诊原始录音（演示占位，没有真实音频文件）', sec:sec});
  krVaultLog(v, '语音录入面诊（'+(KR_REC.demoVoice ? '演示文字' : '语音识别')+'，约 '+sec+' 秒），生成原始录音占位');
  Store.touch(); krRenderCaseDetail();
}
function krSaveTranscript(){
  var txt = (KR_REC.text||'').trim(); if(!txt){ alert('还没有内容'); return null; }
  var v = krVault(KR_CASE.clinicId, KR_CASE.id, true), mode = KR_REC.demoVoice ? 'voice' : (KR_REC.startedAt ? 'voice' : 'manual');
  v.transcripts.push({id:'tr'+Date.now(), ts:nowFullDt(), by:ME_NAME, mode:mode, text:txt, demo:!!KR_REC.demoVoice});
  krVaultLog(v, (mode==='voice' ? '保存转写文字' : '手动输入面诊')+'（'+txt.length+' 字）');
  Store.touch(); return txt;
}
/* AI 整理成报告草稿（演示：模板；正式版接 LLM，见 Integrations & APIs） */
function krAiDraftText(c, text){
  return '[면담 소견 요약]\n고객: '+c.name+' ('+c.caseNo+')\n고민: '+(c.concern||'—')+'\n기대: '+(c.expectation||'—')+'\n\n[원장 소견]\n'+text+'\n\n[권장 시술]\n- （실장이 가능 범위에서 선택）\n\n[주의사항]\n- 시술 전후 주의사항은 상담 시 안내 예정\n\n※ 데모용 템플릿 초안입니다. 실제 서비스에서는 LLM이 정리합니다.';
}
function krMakeDraft(){
  var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id); if(!c0 || !krCanRecord(c0.c)) return;
  var txt = krSaveTranscript(); if(!txt) return;
  Store.withClinic(KR_CASE.clinicId, function(){
    var c = CASE_ITEMS.filter(function(x){ return x.id===KR_CASE.id; })[0], v = krVault(KR_CASE.clinicId, KR_CASE.id, true);
    v.drafts.push({id:'dr'+Date.now(), ts:nowFullDt(), by:ME_NAME, source:'AI 草稿（演示模板）', text:krAiDraftText(c, txt)});
    krVaultLog(v, 'AI 整理成报告草稿（演示模板）');
  });
  KR_REC.text = ''; KR_REC.startedAt = 0; KR_REC.demoVoice = false;
  if(typeof KR_SUB!=='undefined') KR_SUB.text = null; /* 提交区的报告内容改成最新草稿 */
  Store.touch(); krRenderCaseDetail();
}
function krVaultHtml(c){
  var v = krVault(KR_CASE.clinicId, KR_CASE.id, false);
  var row = function(tag, ts, by, body){ return '<div class="case-field-row" style="align-items:flex-start;font-size:12px;"><span class="status-pill" style="background:var(--border2);color:var(--slate2);font-size:10px;margin-right:8px;">'+tag+'</span><span style="min-width:112px;color:var(--muted);">'+krEsc(ts)+'</span><span style="min-width:60px;font-weight:600;">'+krEsc(by)+'</span><span style="flex:1;white-space:pre-wrap;">'+body+'</span></div>'; };
  var rows = v.audio.map(function(a){ return row('录音', fmtUtc(a.ts), a.by, krEsc(a.label)+'（'+a.sec+' 秒）'); }).concat(
    v.transcripts.map(function(x){ return row('转写', fmtUtc(x.ts), x.by, krEsc(x.text)+(x.demo?' <i style="color:var(--muted);">（演示）</i>':'')); }),
    v.drafts.map(function(d){ return row(d.source.indexOf('AI')===0?'AI草稿':'修改稿', fmtUtc(d.ts), d.by, krEsc(d.text)); }),
    v.history.map(function(h0){ return row('过程', fmtUtc(h0.ts), h0.by, krEsc(h0.action)); }));
  return krCardBox('KR 专用附件仓库 <span style="font-weight:400;font-size:11px;color:var(--muted);">只有 KR 看得到，IN 看不到；保存期限：结案后 3 年</span>', rows.length ? rows.join('') : krEmpty('还没有内容（语音 / 手动录入后会放进来）'));
}
function krRecordBlock(c){
  krRecReset();
  if(!krCanRecord(c)) return krCardBox('录入面诊', krEmpty('你的账号不能录入这个案件的面诊'));
  var srOk = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  var tip = KR_REC.recording ? '<div style="background:#FDEBD3;color:#A85A10;border-radius:8px;padding:8px 12px;font-size:12px;margin-bottom:8px;">🎙 录音中…'+(KR_REC.demoVoice ? '（演示：当前浏览器不支持语音识别，已填入演示文字）' : '（正在做语音转文字，韩语）')+'</div>' : (!srOk ? '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">演示：这个浏览器不支持语音识别，点［语音录入面诊］会用演示文字代替。</div>' : '');
  var btns = KR_REC.recording
    ? '<button class="btn-primary" onclick="krRecStop()">⏹ 停止录音</button>'
    : '<button class="btn-outline" onclick="krRecStart(\'voice\')">🎙 语音录入面诊</button><button class="btn-outline" onclick="krRecStart(\'manual\')">⌨ 手动输入面诊</button>';
  var box = krCardBox('录入面诊（院长口述 / 室长代录）',
    tip+'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">'+btns+'</div>'+
    '<textarea id="kr-rec-text" oninput="krRecInput(this.value)" placeholder="面诊内容（语音转写或手动输入，可修改）" style="width:100%;min-height:110px;padding:10px;border:1px solid var(--line);border-radius:8px;font-size:13px;box-sizing:border-box;">'+krEsc(KR_REC.text)+'</textarea>'+
    '<div style="margin-top:10px;display:flex;gap:8px;"><button class="btn-primary" onclick="krMakeDraft()">✨ AI 整理成报告草稿（演示）</button></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-top:6px;">演示：草稿由固定模板生成，正式版接 LLM。原始录音、转写、草稿和修改过程都进「KR 专用附件仓库」。</div>');
  return box+krVaultHtml(c)+(typeof krSubmitBlock==='function' && canDo('krwork') ? krSubmitBlock(c) : '');
}


/* ---------- 三、提交最终报告（只有 KR 室长 / 管理者） ---------- */
var KR_SUB = {caseKey:'', text:null, pick:{}, notes:{}, overall:'', files:[], detail:{}}; /* detail[项目名] = {stay, anes, anesNote, pc:[{kr, inn, times, place, day}]} */
function krSubReset(c){
  if(KR_SUB.caseKey !== krRecKey()) KR_SUB = {caseKey:krRecKey(), text:null, pick:{}, notes:{}, overall:'', files:[], detail:{}};
  if(KR_SUB.text===null){ var v = krVault(KR_CASE.clinicId, KR_CASE.id, false); KR_SUB.text = v.drafts.length ? v.drafts[v.drafts.length-1].text : ''; }
}
/* 本医院赴韩项目（项目库）+ 来源诊所本地项目库的"术后管理"分类 */
function krScopeCandidates(clinicId){
  var hid = krHospitalIdOfMe();
  var all = ((HOSPITAL_DATA[hid]||{}).projects||[]).filter(function(p){ return p.active; });
  var kr = all.filter(function(p){ return !isKrPostcareCat(p.categoryId); }), krPost = all.filter(function(p){ return isKrPostcareCat(p.categoryId); });
  var v = Store.readClinic(clinicId) || {}, cat = null;
  Object.keys(v.PROJECT_CATEGORIES||{}).forEach(function(k){ if(v.PROJECT_CATEGORIES[k].label==='术后管理') cat = k; });
  var post = (v.PROJECT_LIBRARY||[]).filter(function(p){ return p.origin==='IN' && p.active && cat && p.categoryId===cat; });
  return {kr:kr, post:post, krPost:krPost}; /* kr = 赴韩项目；krPost = 韩国术后管理（韩元）；post = 来源诊所本地「术后管理」（印尼盾） */
}
function krSubSet(k, v){ KR_SUB[k] = v; }
function krPickToggle(name, on){ KR_SUB.pick[name] = on; if(on && !KR_SUB.detail[name]) KR_SUB.detail[name] = krDefaultsDetail(name); /* 项目库默认资料自动带入，可按客人调整 */ krRenderCaseDetail(); }
/* 项目资料一行小字：麻醉、推荐在韩时间、所需术后管理 */
function krItemMetaHtml(it){
  var bits = [];
  if(it.anesthesia) bits.push('麻醉：'+krEsc(it.anesthesia.label+(it.anesthesia.note?'（'+it.anesthesia.note+'）':'')));
  if(it.stay) bits.push('推荐在韩：'+krEsc(it.stay));
  (it.postcare||[]).forEach(function(x){ bits.push('术后管理：'+krEsc(x.name)+' × '+x.times+'（'+(x.place==='KR'?'必须在韩国':'韩国或印尼都可')+(x.day?'，'+krEsc(x.day):'')+'）'); });
  return bits.length ? '<div style="font-size:11px;color:var(--slate2);margin-top:2px;">'+bits.join(' ｜ ')+'</div>' : '';
}
function krDet(name){ return KR_SUB.detail[name] || (KR_SUB.detail[name] = {stay:'', anes:'local', anesNote:'', pc:[]}); }
function krDetSet(name, k, v){ krDet(name)[k] = v; }
function krPcSet(name, i, k, v){ krDet(name).pc[i][k] = v; if(k==='place') krRenderCaseDetail(); }
function krPcAdd(name){ krDet(name).pc.push({kr:'', inn:'', times:1, place:'KR', day:''}); krRenderCaseDetail(); }
function krPcDel(name, i){ krDet(name).pc.splice(i, 1); krRenderCaseDetail(); }
var KR_ANES = {local:'局部麻醉', sleep:'睡眠麻醉', general:'全身麻醉'};
/* 勾选的赴韩项目下面展开的项目资料：推荐在韩时间、麻醉特性、所需术后管理 */
function krProjDetailHtml(p, cand){
  var d = krDet(p.name), q = function(s){ return krEsc(s).replace(/'/g,''); };
  var inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;';
  var pcRows = d.pc.map(function(x, i){
    var krOpts = '<option value="">选择韩国术后管理项目</option>'+cand.krPost.map(function(o){ return '<option value="'+q(o.name)+'"'+(x.kr===o.name?' selected':'')+'>'+krEsc(o.name)+'</option>'; }).join('');
    var inOpts = '<option value="">印尼对应项目（选填）</option>'+cand.post.map(function(o){ return '<option value="'+q(o.name)+'"'+(x.inn===o.name?' selected':'')+'>'+krEsc(o.name)+'</option>'; }).join('');
    var ph = '\''+q(p.name)+'\','+i;
    return '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0;"><select onchange="krPcSet('+ph+',\'kr\',this.value)" style="'+inp+'">'+krOpts+'</select>'+
      '<input type="number" min="1" value="'+x.times+'" onchange="krPcSet('+ph+',\'times\',Math.max(1,parseInt(this.value,10)||1))" style="'+inp+'width:56px;" title="次数"> 次'+
      '<select onchange="krPcSet('+ph+',\'place\',this.value)" style="'+inp+'"><option value="KR"'+(x.place==='KR'?' selected':'')+'>必须在韩国</option><option value="either"'+(x.place==='either'?' selected':'')+'>韩国或印尼都可</option></select>'+
      '<input placeholder="术后第几天" value="'+krEsc(x.day)+'" oninput="krPcSet('+ph+',\'day\',this.value)" style="'+inp+'width:96px;">'+
      (x.place==='either' ? '<select onchange="krPcSet('+ph+',\'inn\',this.value)" style="'+inp+'">'+inOpts+'</select>' : '')+
      '<a href="#" onclick="krPcDel('+ph+');return false;">移除</a></div>';
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
function krSubmitBlock(c){
  krSubReset(c);
  var cand = krScopeCandidates(KR_CASE.clinicId);
  var row = function(p, kind){ var on = !!KR_SUB.pick[p.name]; return '<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--border2);font-size:13px;"><label style="flex:1;display:flex;gap:8px;align-items:center;cursor:pointer;"><input type="checkbox" '+(on?'checked':'')+' onchange="krPickToggle(\''+krEsc(p.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(p.name)+' <span style="color:var(--muted);font-size:11px;">'+(kind==='kr' ? formatCurrency(p.price,'KRW') : fmtRp(p.price))+'</span></label><input placeholder="备注" value="'+krEsc(KR_SUB.notes[p.name]||'')+'" oninput="krNoteSet(\''+krEsc(p.name).replace(/'/g,'')+'\',this.value)" style="width:42%;padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;"></div>'+(on && kind==='kr' ? krProjDetailHtml(p, cand) : ''); };
  return krCardBox('提交最终报告（KR 室长整理，院长不能提交）',
    '<div style="font-size:12px;color:var(--slate2);margin-bottom:6px;">报告内容（韩文原文；可在 AI 草稿基础上调整）</div>'+
    '<textarea oninput="krSubSet(\'text\',this.value)" placeholder="还没有草稿：请先在上面录入面诊并生成 AI 草稿，或直接在这里写" style="width:100%;min-height:170px;padding:10px;border:1px solid var(--line);border-radius:8px;font-size:13px;box-sizing:border-box;">'+krEsc(KR_SUB.text)+'</textarea>'+
    '<div style="font-size:12px;font-weight:700;margin:14px 0 4px;">赴韩项目可选范围（本医院项目库）</div>'+(cand.kr.map(function(p){ return row(p,'kr'); }).join('') || krEmpty('本医院项目库没有项目'))+
    '<div style="font-size:12px;font-weight:700;margin:14px 0 4px;">术后管理项目（来源诊所本地项目库「术后管理」分类）</div>'+(cand.post.map(function(p){ return row(p,'in'); }).join('') || krEmpty('来源诊所没有术后管理项目'))+
    '<div style="font-size:12px;font-weight:700;margin:14px 0 4px;">整体备注</div><input value="'+krEsc(KR_SUB.overall)+'" oninput="krSubSet(\'overall\',this.value)" placeholder="例如：具体术式以到院评估为准" style="width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:8px;box-sizing:border-box;">'+
    '<div style="font-size:12px;font-weight:700;margin:14px 0 4px;">附件</div>'+KR_SUB.files.map(function(f,i){ return '<div style="font-size:12px;padding:3px 0;">📎 '+krEsc(f)+' <a href="#" onclick="krDelFile('+i+');return false;">移除</a></div>'; }).join('')+
    '<div style="display:flex;gap:8px;margin-top:4px;"><input id="kr-file-name" placeholder="附件名称（演示：只记名称，不上传真实文件）" style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:8px;"><button class="btn-outline" onclick="krAddFile()">添加</button></div>'+
    '<div style="margin-top:16px;"><button class="btn-primary" onclick="krSubmitReport()">提交报告</button></div>');
}
function krSubmitReport(){
  if(!krCan()) return; /* 院长不能提交 */
  var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id); if(!c0) return;
  var text = (KR_SUB.text||'').trim(); if(!text){ alert('报告内容不能为空'); return; }
  var cand = krScopeCandidates(KR_CASE.clinicId), items = [];
  var bad = '';
  cand.kr.concat(cand.post).forEach(function(p){
    if(!KR_SUB.pick[p.name]) return;
    var it = {name:p.name, price:p.price, note:(KR_SUB.notes[p.name]||'').trim()};
    if(cand.kr.indexOf(p) > -1){ /* 赴韩项目的项目资料：推荐在韩时间、麻醉特性、所需术后管理 */
      var d = krDet(p.name);
      it.stay = (d.stay||'').trim(); it.anesthesia = {type:d.anes, label:KR_ANES[d.anes], note:(d.anesNote||'').trim()};
      it.postcare = d.pc.map(function(x){
        var kp = cand.krPost.filter(function(o){ return o.name===x.kr; })[0], ip = x.place==='either' ? cand.post.filter(function(o){ return o.name===x.inn; })[0] : null;
        if(!kp) bad = '「'+p.name+'」的所需术后管理还有没选项目的行';
        return {name:x.kr, times:x.times, place:x.place, day:(x.day||'').trim(), innName:ip ? ip.name : ''};
      });
    }
    items.push(it);
  });
  if(bad){ alert(bad); return; }
  /* 可以 0 个可选项目（院长判断不建议做任何项目）：单独确认；IN 端客人之后可走仅出报告或本地项目 */
  if(!items.length){ if(!confirm('本报告不推荐任何赴韩项目，确定提交吗？')) return; }
  else if(!confirm('提交后 IN 端会变成"项目确认中"，并收到"报告已出"通知。确认提交？')) return;
  var v = krVault(KR_CASE.clinicId, KR_CASE.id, true), last = v.drafts.length ? v.drafts[v.drafts.length-1].text : '';
  if(text !== last){ v.drafts.push({id:'dr'+Date.now(), ts:nowFullDt(), by:ME_NAME, source:'KR 室长调整稿', text:text}); krVaultLog(v, '室长调整草稿（最终报告）'); }
  krVaultLog(v, '提交最终报告');
  var rep = {original:text, zh:krDemoZh(text), items:items, overallNote:(KR_SUB.overall||'').trim(), files:KR_SUB.files.slice()};
  var ok = krMut(function(c){ return coreSubmitReport(c, rep, ME_NAME); });
  KR_SUB = {caseKey:'', text:null, pick:{}, notes:{}, overall:'', files:[], detail:{}}; KR_REC.caseKey = '';
  Store.touch(); krRefreshAll();
}


/* ---------- 四、延续既往面诊与补加可选项目 ---------- */
function krJudgeBlock(c){
  var info = continuationInfo(c), can = krCan() || (currentAccount().role==='kr_director' && krIsMyCase(c));
  return krCardBox('延续既往面诊：判断有无变动',
    '<div style="font-size:13px;color:var(--slate2);margin-bottom:10px;">相对原报告，院长判断有无变动？无变动 → 沿用原报告，IN 直接进入项目确认中；有变动 → 走录入面诊 → 草稿 → 提交新报告。</div>'+
    (can ? '<div style="display:flex;gap:10px;"><button class="btn-primary" onclick="krJudge(false)">无变动</button><button class="btn-outline" onclick="krJudge(true)">有变动</button></div>' : krEmpty('你的账号不能判断这个案件')));
}
function krJudge(changed){
  var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id); if(!c0 || !(krCan() || (currentAccount().role==='kr_director' && krIsMyCase(c0.c)))) return;
  if(!confirm(changed ? '确认：有变动？之后需要录入面诊并提交新报告。' : '确认：无变动？将沿用原报告，IN 直接进入项目确认中。')) return;
  krMut(function(c){ return coreJudgeContinuation(c, changed, ME_NAME); });
}
/* 项目确认中：已提交的报告和可选范围 + ［补加可选项目］（只增不减；院长不能补加） */
function krAfterBlock(c){
  var items = (c.krScope && c.krScope.items) || [];
  var list = items.length ? items.map(function(it){ return '<div class="case-field-row" style="font-size:13px;"><span style="flex:1;">'+krEsc(it.name)+(it.note?' <span style="color:var(--muted);font-size:11px;">'+krEsc(it.note)+'</span>':'')+krItemMetaHtml(it)+'</span><span style="color:var(--slate2);">'+(it.price!==undefined ? (isLocalProjectName(it.name) ? fmtRp(it.price) : formatCurrency(it.price,'KRW')) : '')+'</span></div>'; }).join('') : krEmpty('没有可选范围');
  var addable = '';
  if(krCan() && c.stage==='consult' && c.reportReady){
    var cand = krScopeCandidates(KR_CASE.clinicId), have = items.map(function(it){ return it.name; });
    var opts = cand.kr.filter(function(p){ return have.indexOf(p.name)<0; }).map(function(p){ return '<option value="kr|'+krEsc(p.name)+'">赴韩 · '+krEsc(p.name)+'</option>'; }).concat(cand.post.filter(function(p){ return have.indexOf(p.name)<0; }).map(function(p){ return '<option value="in|'+krEsc(p.name)+'">术后管理 · '+krEsc(p.name)+'</option>'; })).join('');
    addable = opts ? '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;"><select id="kr-add-sel" onchange="krAddSelChg()" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;">'+opts+'</select><select id="kr-add-anes" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;"><option value="local">局部麻醉</option><option value="sleep">睡眠麻醉</option><option value="general">全身麻醉</option></select><input id="kr-add-stay" placeholder="推荐在韩时间" style="width:110px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;"><input id="kr-add-note" placeholder="备注" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;"><button class="btn-primary" onclick="krAddScope()">补加可选项目</button></div><div style="font-size:11px;color:var(--muted);margin-top:6px;">只能新增，不能删除；要拿掉某个项目，请在对话里和 IN 室长商量。</div>' : krEmpty('项目库里的项目都已经在可选范围内了');
  }
  return krCardBox('可选范围（项目确认中）', list+addable);
}
function isLocalProjectName(name){ return PROJECT_LIBRARY.some(function(p){ return p.name===name && p.origin==='IN'; }); }
function krAddSelChg(){ var s = document.getElementById('kr-add-sel'); if(!s || s.value.split('|')[0]!=='kr') return; var df = krDefaultsDetail(s.value.split('|').slice(1).join('|')); document.getElementById('kr-add-anes').value = df.anes; document.getElementById('kr-add-stay').value = df.stay; }
function krAddScope(){
  if(!krCan()) return; /* 院长不能补加 */
  var sel = document.getElementById('kr-add-sel'); if(!sel || !sel.value) return;
  var parts = sel.value.split('|'), name = parts.slice(1).join('|'), note = (document.getElementById('kr-add-note').value||'').trim();
  var cand = krScopeCandidates(KR_CASE.clinicId), p = (parts[0]==='kr' ? cand.kr : cand.post).filter(function(x){ return x.name===name; })[0]; if(!p) return;
  var item = {name:p.name, price:p.price, note:note};
  if(parts[0]==='kr'){ var at = document.getElementById('kr-add-anes').value, df = krDefaultsDetail(name); item.anesthesia = {type:at, label:KR_ANES[at], note:at===df.anes ? df.anesNote : ''}; item.stay = (document.getElementById('kr-add-stay').value||'').trim() || df.stay; item.postcare = df.pc.map(function(x){ var kp = cand.krPost.filter(function(o){ return o.name===x.kr; })[0]; return {name:x.kr, price:kp ? kp.price : 0, times:x.times, place:x.place, day:x.day, innName:'', innPrice:0}; }); }
  krMut(function(c){ return coreAddScopeItem(c, item, ME_NAME); });
}


/* ---------- 四、项目进程（在韩 timeline 与子项，KR-CASE-02 第 4 节） ---------- */
var KR_SUB_NEW = {date:'', content:'', kind:'施术', place:'KR', projectName:''};
function krSubNewSet(k, v){ KR_SUB_NEW[k] = v; }
function krProgressBlock(c){
  if(!c.settlementDone || !krAllItems(c).length) return krCardBox('项目进程（在韩 timeline）', krEmpty('付定金后，KR 室长在这里整理在韩 timeline'));
  var can = krCan(), inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;';
  var rows = (c.subItems||[]).map(function(s){
    var tail = '';
    if(can && !s.done && c.krBalancePaid) tail += '<button class="btn-primary" style="padding:3px 10px;font-size:11px;" onclick="krSubDone(\''+s.id+'\')">标记完成</button>';
    if(can && !s.done && s.place!=='KR') tail += s.booked ? '<span class="status-pill" style="background:var(--blue-bg);color:var(--blue);">IN 已预约 '+krEsc(s.booked)+'</span>' : '<button class="btn-outline" style="padding:3px 10px;font-size:11px;" onclick="krSubInform(\''+s.id+'\')">'+(s.informed?'再次通知 IN 室长预约':'通知 IN 室长预约')+'</button>';
    if(KR_SUBDONE.id===s.id){ /* 施术子项标完成：勾选这次做了哪些项目 */
      return subItemRowHtml(s)+'<div style="margin:2px 0 8px 112px;padding:8px 12px;background:#FBF6EA;border-radius:8px;font-size:12px;"><div style="font-weight:700;margin-bottom:4px;">这次做了哪些项目？（必须勾选，不能默认全部）</div>'+krNotStartedItems(c).map(function(it){ return '<label style="display:block;margin:3px 0;"><input type="checkbox" onchange="krSubDonePick(\''+krEsc(it.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(it.name)+'</label>'; }).join('')+'<div style="margin-top:6px;display:flex;gap:8px;"><button class="btn-primary" style="padding:3px 12px;font-size:11px;" onclick="krSubDoneConfirm()">确认完成</button><button class="btn-ghost" style="padding:3px 12px;font-size:11px;" onclick="krSubDoneCancel()">取消</button></div></div>';
    }
    if(!can || s.done) return '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+subItemRowHtml(s)+(s.doneItems&&s.doneItems.length ? '<span style="font-size:11px;color:var(--muted);">完成项目：'+krEsc(s.doneItems.join('、'))+'</span>' : '')+'</div>';
    tail = tail ? '<div style="margin:-2px 0 6px 112px;">'+tail+'</div>' : '';
    return '<div class="case-field-row" style="font-size:12px;gap:6px;flex-wrap:wrap;"><b style="min-width:104px;">'+krEsc(s.no)+'</b><input type="date" value="'+s.date+'" onchange="krSubEdit(\''+s.id+'\',\'date\',this.value)" style="'+inp+'"><input value="'+krEsc(s.content)+'" onchange="krSubEdit(\''+s.id+'\',\'content\',this.value)" style="'+inp+'flex:1;min-width:160px;"><select onchange="krSubEdit(\''+s.id+'\',\'place\',this.value)" style="'+inp+'">'+krPlaceOpts(s.place)+'</select><a href="#" onclick="krSubDel(\''+s.id+'\');return false;">删除</a></div>'+tail;
  }).join('');
  var projOpts = '<option value="">（不关联项目）</option>'+krActiveItems(c).map(function(it){ return '<option value="'+krEsc(it.name).replace(/"/g,'')+'"'+(KR_SUB_NEW.projectName===it.name?' selected':'')+'>'+krEsc(it.name)+'</option>'; }).join('');
  var add = can ? '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--border2);"><input type="date" value="'+KR_SUB_NEW.date+'" onchange="krSubNewSet(\'date\',this.value)" style="'+inp+'"><select onchange="krSubNewSet(\'kind\',this.value)" style="'+inp+'">'+['施术','复诊','管理','其他'].map(function(x){ return '<option'+(KR_SUB_NEW.kind===x?' selected':'')+'>'+x+'</option>'; }).join('')+'</select><input placeholder="内容（例如 10/16 施术、消肿管理）" value="'+krEsc(KR_SUB_NEW.content)+'" oninput="krSubNewSet(\'content\',this.value)" style="'+inp+'flex:1;min-width:200px;"><select onchange="krSubNewSet(\'place\',this.value)" style="'+inp+'">'+krPlaceOpts(KR_SUB_NEW.place)+'</select><select onchange="krSubNewSet(\'projectName\',this.value)" style="'+inp+'">'+projOpts+'</select><button class="btn-primary" onclick="krSubAdd()">添加子项</button></div>' : '';
  var extra = '';
  if(can && c.krBalancePaid && !c.visitClosed && krNotStartedItems(c).length) extra += '<div style="margin-top:10px;padding:8px 12px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;"><div style="font-weight:700;margin-bottom:4px;">未完成的项目（勾选已完成的；不能默认全部；在韩国的子项都完成且项目都处理完才结案）</div>'+krNotStartedItems(c).map(function(it){ return '<label style="display:block;margin:3px 0;"><input type="checkbox" onchange="krItemsPick(\''+krEsc(it.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(it.name)+'</label>'; }).join('')+'<button class="btn-outline" style="margin-top:6px;padding:3px 12px;font-size:11px;" onclick="krDoItemsDone()">标记所选项目已完成</button></div>';
  if(can && c.hasArrived && !c.visitClosed){
    var addOpts = krScopeCandidates(KR_CASE.clinicId).kr.filter(function(p){ return !krAllItems(c).some(function(it){ return it.name===p.name && !it.cancelled && !it.swapped; }); }).map(function(p){ return '<option>'+krEsc(p.name)+'</option>'; }).join('');
    extra += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border2);display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px;"><span>回诊时加做项目（另开新结算单，在韩国付款；原结算不变）：</span><select id="kr-addon-sel" onchange="krAddonSelChg()" style="'+inp+'">'+addOpts+'</select><select id="kr-addon-anes" onchange="krAddonAnesChg()" style="'+inp+'"><option value="local">局部麻醉</option><option value="sleep">睡眠麻醉</option><option value="general">全身麻醉</option></select><label id="kr-addon-sign-w" style="display:none;color:#A85A10;"><input type="checkbox" id="kr-addon-sign"> 已在现场签署麻醉同意书</label><button class="btn-outline" onclick="krDoAddOn()">加做</button></div>';
  }
  return krCardBox('项目进程（在韩 timeline，每一行是案件下的一个子项）', (rows || krEmpty('还没有子项：请整理在韩 timeline（例如 施术、复诊、消肿管理、拆线）'))+add+''+extra+'<div style="font-size:11px;color:var(--muted);margin-top:8px;">IN 端在赴韩项目 tab 下的子 tab 只读显示；客人端暂不显示。已完成的子项不能再改。</div>');
}
function krPlaceOpts(sel){ return [['KR','韩国'],['IN','印尼'],['either','印尼 / 韩国均可']].map(function(p){ return '<option value="'+p[0]+'"'+(sel===p[0]?' selected':'')+'>'+p[1]+'</option>'; }).join(''); }
function krSubAdd(){
  if(!krCan()) return;
  var o = Object.assign({}, KR_SUB_NEW); if(!o.date || !(o.content||'').trim()){ alert('请填日期和内容'); return; }
  KR_SUB_NEW = {date:'', content:'', kind:o.kind, place:o.place, projectName:''};
  krMut(function(c){ return coreSubAdd(c, o, ME_NAME); });
}
function krSubEdit(id, k, v){ if(!krCan()) return; var p = {}; p[k] = v; krMut(function(c){ return coreSubEdit(c, id, p, ME_NAME); }); }
function krSubDel(id){ if(!krCan() || !confirm('删除这个子项？')) return; krMut(function(c){ return coreSubDel(c, id, ME_NAME); }); }


/* ---------- 五、到院、判断、调整与尾款（KR 端操作；到院后 IN 只看结果，按 KR 判断操作退款） ---------- */
var KR_ARR = {judge:'', unable:{}, reason:'', swapItem:'', swapAlt:'', rebookDate:'', rebookTime:'10:00', confirmTrip:false};
function krArrSet(k, v){ KR_ARR[k] = v; if(k==='swapAlt') KR_SUB.detail['__swap'] = krDefaultsDetail(v); /* 更换项目：新项目默认资料自动带入 */ if(k==='judge' || k==='swapItem' || k==='swapAlt' || k==='confirmTrip') krRenderCaseDetail(); }
function krUnableToggle(name, on){ KR_ARR.unable[name] = on; }
function krSetAlloc(projectId, batchId, i, v){ if(!krCan()) return; krMut(function(c){ return corePcAlloc(c, projectId, batchId, i, v, ME_NAME); }); }
function krAllocHtml(c){
  var its = krActiveItems(c).filter(function(it){ return (it.postcare||[]).length; });
  if(!its.length) return '';
  return '<div style="margin:10px 0;"><div style="font-size:12px;font-weight:700;">确认行程：术后管理的地点（含在套餐内；可弹性的在这时确定）</div>'+its.map(function(it){ return '<div style="font-size:12px;margin-top:6px;"><b>'+krEsc(it.name)+'</b></div>'+pcLinesHtml(c, it, 'krSetAlloc'); }).join('')+'</div>';
}
function krArrivalBlock(c){
  if(KR_SUB.caseKey !== krRecKey()) KR_SUB = {caseKey:krRecKey(), text:null, pick:{}, notes:{}, overall:'', files:[], detail:{}};
  var st = scheduleState(c), can = krCan(), j = c.krJudge;
  if(!c.settlementDone || !krAllItems(c).length) return '';
  var inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;', info = krBalanceInfo(c), body = '';
  if(st==='Confirmed' && !c.hasArrived){
    body = can ? '<button class="btn-primary" onclick="krMarkArrived()">标记已到医院</button>' : krEmpty('客人到院后由 KR 室长标记');
  } else if(st==='Confirmed' && c.hasArrived){
    body = krEmpty('已在韩国重新预约施术时间；客人再到医院时重新标记"已到医院"。')+(can ? '<button class="btn-primary" onclick="krMarkArrived()">标记已到医院</button>' : '');
  } else if(st==='Arrived' && !j){
    body = can ? '<div style="font-size:13px;margin-bottom:8px;">是否能施术？（KR 判断）</div>'+['ok','changed','cannot'].map(function(r){ return '<label style="display:block;margin:5px 0;font-size:13px;cursor:pointer;"><input type="radio" name="kr-judge" '+(KR_ARR.judge===r?'checked':'')+' onchange="krArrSet(\'judge\',\''+r+'\')"> '+KR_JUDGE_TEXT[r]+'</label>'; }).join('')+'<button class="btn-primary" style="margin-top:8px;" onclick="krDoJudge()">确认判断</button>' : krEmpty('等待 KR 室长判断能否施术');
  } else if(j && j.result==='cannot'){
    var od = caseOpenDates(c).filter(function(d){ return d >= krToday(); });
    body = krKV('KR 判断', '不能施术')+(j.refundKind ? krKV('定金', (j.refundKind==='all' ? '全部退回' : '不退')+'（已通知 IN 室长按此操作；操作后案件变为仅出报告）') :
      (can ? '<div style="margin-top:10px;font-size:13px;font-weight:700;">① 能否更改时间后继续？能 → 在韩国重新预约</div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0 12px;"><select onchange="krArrSet(\'rebookDate\',this.value)" style="'+inp+'"><option value="">选择开放日期</option>'+od.map(function(d){ return '<option'+(KR_ARR.rebookDate===d?' selected':'')+'>'+d+'</option>'; }).join('')+'</select><select onchange="krArrSet(\'rebookTime\',this.value)" style="'+inp+'">'+krTimeOptions(KR_ARR.rebookTime)+'</select><button class="btn-outline" onclick="krDoRebook()">重新预约施术时间</button></div>'+
        '<div style="font-size:13px;font-weight:700;">② 不能 → 退定金（由 KR 判断，IN 室长操作）</div><div style="display:flex;gap:8px;margin-top:6px;"><button class="btn-outline" onclick="krDoRefundDecision(\'all\')">全部退回</button><button class="btn-outline" onclick="krDoRefundDecision(\'none\')">不退</button></div>' : krEmpty('等待 KR 室长处理')));
  } else if(j){ /* ok / changed */
    var calc = '实际项目合计 '+formatCurrency(info.total,'KRW')+'（施术项目；术后管理含在套餐内）；定金合计 '+formatCurrency(info.deposit,'KRW')+(info.preRefund>0 ? '，减去到院前已退 '+formatCurrency(info.preRefund,'KRW') : '')+' = 可抵定金 '+formatCurrency(info.effDeposit,'KRW')+'；<b>'+(info.diff>=0 ? '尾款（在韩国补）' : '应退差额（IN 室长按此金额退）')+' '+formatCurrency(Math.abs(info.diff),'KRW')+'</b>';
    body = krKV('KR 判断', KR_JUDGE_TEXT[j.result])+'<div style="font-size:12px;color:var(--slate2);margin:8px 0;line-height:1.7;">'+calc+'</div>';
    if(j.result==='changed' && !j.settled && can){
      var pend = krNotStartedItems(c);
      body += '<div style="margin:8px 0;padding:10px 12px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;"><div style="font-weight:700;margin-bottom:4px;">调整项目</div>'+
        pend.map(function(it){ return '<label style="display:block;margin:3px 0;"><input type="checkbox" '+(KR_ARR.unable[it.name]?'checked':'')+' onchange="krUnableToggle(\''+krEsc(it.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(it.name)+'</label>'; }).join('')+
        '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;"><input placeholder="无法施术的原因" value="'+krEsc(KR_ARR.reason)+'" oninput="krArrSet(\'reason\',this.value)" style="'+inp+'min-width:200px;"><button class="btn-outline" onclick="krDoUnable()">标记无法施术</button></div>'+
        '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><span>更换：</span><select onchange="krArrSet(\'swapItem\',this.value)" style="'+inp+'"><option value="">原项目</option>'+pend.map(function(it){ return '<option'+(KR_ARR.swapItem===it.name?' selected':'')+'>'+krEsc(it.name)+'</option>'; }).join('')+'</select><span>→</span><select onchange="krArrSet(\'swapAlt\',this.value)" style="'+inp+'"><option value="">新项目（本医院项目库）</option>'+krScopeCandidates(KR_CASE.clinicId).kr.map(function(p){ return '<option'+(KR_ARR.swapAlt===p.name?' selected':'')+'>'+krEsc(p.name)+'</option>'; }).join('')+'</select></div>'+(KR_ARR.swapAlt ? '<div style="margin-top:6px;">新项目的资料（所需术后管理 / 麻醉特性 / 推荐在韩时间）：'+krProjDetailHtml({name:'__swap'}, krScopeCandidates(KR_CASE.clinicId))+'<button class="btn-outline" onclick="krDoSwap()">更换项目</button></div>' : '')+
        '<div style="font-size:11px;color:var(--muted);margin-top:4px;">更换的新项目另开新结算单，不收定金，金额计入尾款。</div></div>';
    }
    if(!c.krBalancePaid && can){
      body += krAllocHtml(c)+'<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:8px 0;cursor:pointer;"><input type="checkbox" '+(KR_ARR.confirmTrip?'checked':'')+' onchange="krArrSet(\'confirmTrip\',this.checked)"> 已和客人确认行程（术后管理地点确定后不能再改）</label><button class="btn-primary" onclick="krDoSettle()"'+(KR_ARR.confirmTrip?'':' disabled style="opacity:.5;"')+'>'+(info.diff>=0 ? '标记付清尾款' : '通知 IN 退差额')+'</button>'+(j.refundDue ? '<div style="font-size:12px;color:#C26A1B;margin-top:6px;">已通知 IN 室长按 '+formatCurrency(j.refundDue,'KRW')+' 退差额；退款后视为尾款已结清。</div>' : '');
    } else if(c.krBalancePaid){
      body += '<div style="font-size:12px;color:var(--sage);font-weight:700;margin-top:6px;">✓ 已付清尾款，行程已确认'+(c.innCare ? '；印尼部分术后管理（套餐内含）已转为客人在印尼的 0 元持有项目' : '')+'</div>';
    }
  }
  return krCardBox('到院与尾款', body);
}
function krMarkArrived(){ if(!krCan()) return; krMut(function(c){ return coreMarkArrived(c, ME_NAME); }); }
function krDoJudge(){ if(!krCan() || !KR_ARR.judge){ alert('请先选择判断结果'); return; } var r0 = KR_ARR.judge; KR_ARR.judge = ''; krMut(function(c){ return coreJudge(c, r0, ME_NAME); }); }
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
    var kp = cand.krPost.filter(function(o){ return o.name===x.kr; })[0], ip = x.place==='either' ? cand.post.filter(function(o){ return o.name===x.inn; })[0] : null;
    if(!kp) err = '所需术后管理还有没选项目的行';
    return {name:x.kr, times:x.times, place:x.place, day:(x.day||'').trim(), innName:ip ? ip.name : ''};
  });
  return {error:err, stay:(d.stay||'').trim(), anesthesia:{type:d.anes, label:KR_ANES[d.anes], note:(d.anesNote||'').trim()}, postcare:pc};
}
function krDoSettle(){
  if(!krCan() || !KR_ARR.confirmTrip) return; KR_ARR.confirmTrip = false;
  var r0 = krMut(function(c){ return coreSettleBalance(c, ME_NAME); }); if(!r0 || !r0.ok) alert('现在不能结算尾款');
}
function krDoRebook(){ if(!krCan() || !KR_ARR.rebookDate){ alert('请选择新的施术日期'); return; } var d = KR_ARR.rebookDate, t0 = KR_ARR.rebookTime; var rr = krFindCase(KR_CASE.clinicId, KR_CASE.id), er = rr ? krSurgerySlotError(krHospitalIdOfMe(), rr.c.director, d, t0, surgeryMinutes(rr.c)) : ''; if(er){ alert(er); return; } krMut(function(c){ return coreRebook(c, d, t0, ME_NAME); }); }
function krDoRefundDecision(kind){ if(!krCan() || !confirm('确认：定金'+(kind==='all'?'全部退回':'不退')+'？IN 室长会按这个判断操作。')) return; krMut(function(c){ return coreRefundDecision(c, kind, ME_NAME); }); }

var KR_SUBDONE = {id:'', pick:{}};
function krSubDone(id){
  if(!krCan()) return;
  var c0 = krFindCase(KR_CASE.clinicId, KR_CASE.id).c, s = (c0.subItems||[]).filter(function(x){ return x.id===id; })[0]; if(!s) return;
  if(s.kind==='施术'){ KR_SUBDONE = {id:id, pick:{}}; krRenderCaseDetail(); return; } /* 施术子项：先勾选这次做了哪些项目 */
  krMut(function(c){ return coreSubDone(c, id, ME_NAME, []); });
}
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
function krSubInform(id){ if(!krCan()) return; krMut(function(c){ return coreSubInform(c, id, ME_NAME); }); }
function krAddonSelChg(){ var s = document.getElementById('kr-addon-sel'), a = document.getElementById('kr-addon-anes'); if(!s || !a) return; a.value = krDefaultsDetail(s.value).anes; krAddonAnesChg(); }
function krAddonAnesChg(){ var v = document.getElementById('kr-addon-anes').value, w = document.getElementById('kr-addon-sign-w'); if(w) w.style.display = v==='local' ? 'none' : ''; }
function krDoAddOn(){
  var s = document.getElementById('kr-addon-sel'); if(!krCan() || !s || !s.value) return; var n = s.value;
  var at = document.getElementById('kr-addon-anes').value, signed = !!(document.getElementById('kr-addon-sign') && document.getElementById('kr-addon-sign').checked);
  if(at!=='local' && !signed){ alert('睡眠 / 全身麻醉：请勾选"已在现场签署麻醉同意书"才能新增'); return; }
  if(!confirm('加做「'+n+'」：另开新结算单，在韩国付款。确认？')) return;
  var an = {type:at, label:KR_ANES[at], note:''};
  krMut(function(c){ return coreAddOnItem(c, n, ME_NAME, {anesthesia:an, signed:signed}); });
}

/* ---------- KR 工作台日历（KR-DASH-01 / KR-SCHD-01，2026-10-07 修订：原「日程管理」页合并进工作台） ----------
   原则：韩国医院自己的本地客人不进平台，日历只显示从 IN 转来的平台案件。
   事件只有：到院施术（客人名 · 来源诊所 · 项目）、在韩子项（复诊、拆线、管理）、不可预约（灰块，不写原因）；固定栏 = 每天的 OFF；不显示预计出报告时间。
   周视图直接进入时今天在第一栏；韩国时间。操作：点空白格 → 加「不可预约」/ 标 OFF；单一院长的月视图点日期 → 设定当天是否开放施术；点施术 / 子项 → 打开案件。 */
var KRC = {mode:'week', anchor:'', person:'all', pop:null, edit:null, popForm:{who:'', start:'10:00', end:'11:00', part:'全天', rep:'once'}};
var KRC_H0 = 8, KRC_H1 = 20, KRC_PX = 34; /* 时间轴 08:00–20:00（韩国时间），一小时 34px */
function krcIsDirector(){ var me = currentAccount(); return !!me && me.role==='kr_director'; }
function krcAnchor(){ if(!KRC.anchor) KRC.anchor = krToday(); return KRC.anchor; }
function krcAdd(ds, n){ var d = new Date(ds+'T00:00:00'); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function krcWeekStartMon(ds){ var d = new Date(ds+'T00:00:00'), dow = (d.getDay()+6)%7; return krcAdd(ds, -dow); }
function krcDow(ds){ return '一二三四五六日'.charAt((new Date(ds+'T00:00:00').getDay()+6)%7); }
/* 我能看 / 改哪些院长：院长账号只有自己；室长和管理者全部（在职的） */
function krcDirectors(){
  var hid = krHospitalIdOfMe(), me = currentAccount(), ds = hospitalDirectors(hid).filter(function(d){ return d.active; }).map(function(d){ return d.name; });
  return krcIsDirector() ? ds.filter(function(n){ return n===me.name; }) : ds;
}
function krcWho(){ return krcIsDirector() ? currentAccount().name : KRC.person; } /* 'all' 或某位院长 */
function krcCanEdit(who){ return krcIsDirector() ? who===currentAccount().name : canDo('krsched'); }
function krcRender(){ if(CURRENT_PAGE_ID==='kr-dashboard') krRenderDashboard(); }
function krcSet(k, v){ KRC[k] = v; if(k==='mode' || k==='person'){ KRC.pop = null; KRC.edit = null; } krcRender(); }
function krcShift(n){ var a = krcAnchor(); if(KRC.mode==='month'){ var d = new Date(a+'T00:00:00'); d.setMonth(d.getMonth()+n, 1); KRC.anchor = d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-01'; } else KRC.anchor = krcAdd(a, n*(KRC.mode==='week' ? 7 : 1)); krcRender(); }
function krcToday(){ KRC.anchor = krToday(); krcRender(); }
/* 事件：平台的事 */
function krcEvents(){
  var hid = krHospitalIdOfMe(), h = krHData(), who = krcWho(), rows = krAllCases(), rm = {};
  normSchedBlocks(hid);
  rows.forEach(function(r){ rm[r.clinicId+':'+r.id] = r; });
  var okWho = function(n){ return who==='all' || n===who; };
  var surg = [], busy = [];
  Object.keys(h.directorSchedule||{}).forEach(function(n){ if(!okWho(n)) return; (h.directorSchedule[n]||[]).forEach(function(b){
    if(b.type==='施术'){ var r = rm[b.clinicId+':'+b.caseId]; if(krcIsDirector() && !r) return; var items = r ? krActiveItems(r.c).map(function(it){ return it.name; }).join('、') : ''; surg.push({b:b, row:r, label:(b.name||'')+' · '+(r ? r.clinicName : ((clinicById(b.clinicId)||{}).name||''))+(items ? ' · '+items : '')}); }
    else busy.push(b);
  }); });
  var subs = []; /* 在韩子项（复诊/拆线/管理）属于案件，不进院长日程（2026-10-07 起，KR-SCHD-01 已废弃），只在案件 Timeline / 在韩项目进程里看 */
  var offs = (h.offs||[]).filter(function(o){ return okWho(o.who) || (who==='all' && !krcIsDirector()); });
  return {surg:surg, busy:busy, subs:subs, offs:offs, closed:[]}; /* 医院休诊现在是定期休诊（医院设定里设），日历按规则算 */
}
function krcLanes(list){
  var sorted = list.slice().sort(function(a,b){ return timeToMin(a.time)-timeToMin(b.time) || timeToMin(b.end)-timeToMin(a.end); }), lanes = [], res = [];
  sorted.forEach(function(b){ var s = timeToMin(b.time), li = -1; for(var i = 0; i < lanes.length; i++){ if(lanes[i] <= s){ li = i; break; } } if(li < 0){ li = lanes.length; lanes.push(0); } lanes[li] = timeToMin(b.end); res.push({b:b, lane:li}); });
  res.forEach(function(r0){ var s0 = timeToMin(r0.b.time), e0 = timeToMin(r0.b.end), mx = 0; res.forEach(function(o){ if(timeToMin(o.b.time) < e0 && timeToMin(o.b.end) > s0) mx = Math.max(mx, o.lane); }); r0.n = mx+1; });
  return res;
}
function krcBlockHtml(r0, showWho){
  var b = r0.b, isS = b.type==='施术', s = Math.max(timeToMin(b.time), KRC_H0*60), e = Math.min(timeToMin(b.end), KRC_H1*60); if(e <= s) e = s + 20;
  var w = 100 / r0.n, top = (s - KRC_H0*60) * KRC_PX / 60, hgt = Math.max(16, (e - s) * KRC_PX / 60 - 2);
  var style = 'position:absolute;left:calc('+(r0.lane*w)+'% + 1px);width:calc('+w+'% - 3px);top:'+top+'px;height:'+hgt+'px;border-radius:5px;padding:2px 5px;font-size:10px;line-height:1.3;overflow:hidden;cursor:pointer;z-index:2;'+(isS ? 'background:#F3DFD3;color:#8A4A2A;border:1px solid #C9A38A;' : 'background:#E4E2DC;color:#777;');
  var click = isS && r0.row ? 'krShowCase(\''+r0.row.clinicId+'\',\''+r0.row.id+'\')' : (isS ? '' : 'krcEdit(\''+b.id+'\')');
  return '<div onclick="event.stopPropagation();'+click+'" title="'+krEsc(isS ? b.time+'–'+b.end+' '+r0.label : '不可预约 '+b.time+'–'+b.end)+'" style="'+style+'">'+(isS ? '<b>'+krEsc(b.time)+'</b> '+krEsc(r0.label)+(showWho ? '<br>'+krEsc(b.who) : '') : '不可预约'+(showWho ? '<br>'+krEsc(b.who) : ''))+'</div>';
}
function krcOffChip(o){ return '<span onclick="krcDelOff(\''+(o.id||'')+'\')" title="'+(krcCanEdit(o.who) ? (o.weekly ? '点一下删除这条每周固定的 OFF（所有周）' : '点一下删除这条 OFF') : '')+'" style="display:inline-block;background:#EDEAE2;color:var(--slate2);border-radius:4px;padding:1px 5px;margin:1px;font-size:10px;cursor:'+(krcCanEdit(o.who)?'pointer':'default')+';">OFF'+(o.weekly?'(每周)':'')+' '+krEsc((o.who||'').replace(/ 원장| 실장/g,''))+(o.part && o.part!=='全天' ? '·'+o.part : '')+'</span>'; }
function krcSubChip(x){ var s = x.s, r = x.row; return '<div onclick="krShowCase(\''+r.clinicId+'\',\''+r.id+'\')" title="'+krEsc(r.name+' · '+r.clinicName+'：'+s.content)+'" style="background:'+(s.done?'#E4EEE7':'#E8EEF6')+';color:'+(s.done?'var(--sage)':'#2F5F86')+';border-radius:4px;padding:1px 5px;margin:1px 0;font-size:10px;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;'+(s.done?'text-decoration:line-through;':'')+'">'+krEsc(r.name)+'·'+krEsc(s.content)+'</div>'; }
function krcGridHtml(days, ev){
  var who = krcWho(), showWho = who==='all', openDs = who!=='all' ? hospitalOpenDates(krHospitalIdOfMe(), who) : [];
  var hours = ''; for(var h2 = KRC_H0; h2 < KRC_H1; h2++) hours += '<div style="height:'+KRC_PX+'px;font-size:10px;color:var(--muted);text-align:right;padding-right:4px;box-sizing:border-box;border-top:1px solid #eee;">'+pad2(h2)+':00</div>';
  var cell = 'border-left:1px solid var(--line);min-width:0;box-sizing:border-box;', lab = 'font-size:10px;color:var(--muted);padding:3px 4px;text-align:right;';
  var r1 = '<div></div>', r2 = '<div style="'+lab+'background:#faf8f3;">OFF</div>', r3 = '<div style="'+lab+'">子项</div>', r4 = '<div>'+hours+'</div>';
  days.forEach(function(ds){
    var dS = ev.surg.filter(function(x){ return x.b.date===ds; }), dB = ev.busy.filter(function(b){ return b.date===ds; }), lanes = krcLanes(dS.map(function(x){ return Object.assign({}, x.b, {_x:x}); }).concat(dB));
    var offs = ev.offs.filter(function(o){ return offApplies(o, ds); }), subs = ev.subs.filter(function(x){ return x.s.date===ds; }), isToday = ds===krToday(), open = openDs.indexOf(ds)>-1;
    var lines = ''; for(var h3 = KRC_H0; h3 < KRC_H1; h3++) lines += '<div style="position:absolute;left:0;right:0;top:'+((h3-KRC_H0)*KRC_PX)+'px;border-top:1px solid #f0ece3;"></div>';
    var hc = hospitalClosedOn(krHospitalIdOfMe(), ds), cf = hc ? '' : hospitalClosedFrom(krHospitalIdOfMe(), ds);
    if(cf) lines += '<div title="医院休诊（定期休诊）" style="position:absolute;left:0;right:0;top:'+Math.max(0, (timeToMin(cf)-KRC_H0*60)*KRC_PX/60)+'px;bottom:0;background:repeating-linear-gradient(45deg,#F7F4EF,#F7F4EF 6px,#EFEBE4 6px,#EFEBE4 12px);pointer-events:none;z-index:1;"></div>'; /* 部分时段休诊：该时段灰色斜纹 */
    if(hc){ r1 += '<div style="'+cell+'text-align:center;font-size:11px;padding:4px 0;background:#EFEBE4;">'+ds.slice(5)+'<br><span style="font-size:9px;color:var(--terracotta);font-weight:700;">医院休诊</span></div>'; r2 += '<div style="'+cell+'background:#EFEBE4;border-top:1px solid var(--line);"></div>'; r3 += '<div style="'+cell+'background:#EFEBE4;border-top:1px solid var(--line);"></div>'; r4 += '<div style="'+cell+'height:'+((KRC_H1-KRC_H0)*KRC_PX)+'px;background:repeating-linear-gradient(45deg,#F7F4EF,#F7F4EF 6px,#EFEBE4 6px,#EFEBE4 12px);border-top:1px solid var(--line);"></div>'; return; }
    r1 += '<div style="'+cell+'text-align:center;font-size:12px;padding:4px 0;'+(isToday?'font-weight:700;color:var(--terracotta);':'')+'">'+ds.slice(5)+' 周'+krcDow(ds)+(open?'<br><span style="font-size:9px;color:var(--sage);font-weight:700;">施术开放</span>':'')+'</div>';
    r2 += '<div style="'+cell+'padding:2px;background:#faf8f3;border-top:1px solid var(--line);">'+(offs.map(krcOffChip).join('')||'<span style="font-size:10px;color:#ccc;">—</span>')+'</div>';
    r3 += '<div style="'+cell+'padding:2px;border-top:1px solid var(--line);">'+subs.map(krcSubChip).join('')+'</div>';
    r4 += '<div style="'+cell+'position:relative;height:'+((KRC_H1-KRC_H0)*KRC_PX)+'px;background:#fff;border-top:1px solid var(--line);cursor:cell;" onmousemove="krcHover(this,event)" onmouseleave="krcHoverOff(this)" onclick="krcCellClick(\''+ds+'\',event,this)"><div class="krc-hl" style="display:none;position:absolute;left:0;right:0;height:'+(KRC_PX/2)+'px;background:rgba(190,120,90,.12);pointer-events:none;"></div>'+lines+
      lanes.map(function(r0){ var x = r0.b._x; return krcBlockHtml(x ? {b:r0.b, lane:r0.lane, n:r0.n, row:x.row, label:x.label} : r0, showWho); }).join('')+'</div>';
  });
  r3 = ''; /* 子项行已废弃 */
  var cols = days.map(function(ds){ return hospitalClosedOn(krHospitalIdOfMe(), ds) ? 'minmax(0,.34fr)' : 'minmax(0,1fr)'; }).join(' '); /* 医院休诊日：整列 1/3 宽 */
  return '<div style="display:grid;flex-shrink:0;grid-template-columns:44px '+cols+';border:1px solid var(--line);border-radius:10px;overflow:hidden;">'+r1+r2+r3+r4+'</div>';
}
function krcHover(el, e){ var hl = el.querySelector('.krc-hl'); if(!hl) return; var y = e.clientY - el.getBoundingClientRect().top, slot = Math.floor(y / (KRC_PX/2)); hl.style.display = 'block'; hl.style.top = (slot * KRC_PX/2)+'px'; }
function krcHoverOff(el){ var hl = el.querySelector('.krc-hl'); if(hl) hl.style.display = 'none'; }
function krcCellClick(ds, e, el){
  var y = e.clientY - el.getBoundingClientRect().top, mins = KRC_H0*60 + Math.floor(y / (KRC_PX/2)) * 30, st = minToTime(Math.min(mins, KRC_H1*60-30));
  var dirs = krcDirs0(); KRC.popForm.who = krcWho()!=='all' ? krcWho() : (KRC.popForm.who && dirs.indexOf(KRC.popForm.who)>-1 ? KRC.popForm.who : dirs[0]);
  KRC.popForm.start = st; KRC.popForm.end = minToTime(Math.min(timeToMin(st)+60, 24*60-30)); KRC.pop = {date:ds}; KRC.edit = null; krcRender();
}
function krcDirs0(){ return krcDirectors(); }
function krcPopSet(k, v){ KRC.popForm[k] = v; }
function krcAddBusy(){
  var f = KRC.popForm, h = krHData();
  if(!f.who || !krcCanEdit(f.who)){ alert('没有权限给这位院长加不可预约'); return; }
  if(timeToMin(f.end) <= timeToMin(f.start)){ alert('结束时间要晚于开始时间'); return; }
  h.directorSchedule = h.directorSchedule||{}; (h.directorSchedule[f.who] = h.directorSchedule[f.who]||[]).push({id:'sb'+(SCHED_SEQ++)+Math.floor(Math.random()*1000), who:f.who, date:KRC.pop.date, time:f.start, end:f.end, type:'不可预约', title:'不可预约', note:''});
  normSchedBlocks(krHospitalIdOfMe()); logOp('其他', '加不可预约：'+f.who+' '+KRC.pop.date+' '+f.start+'–'+f.end, '日程'); KRC.pop = null; Store.touch(); krcRender();
}
function krcAddOff(){
  var f = KRC.popForm, h = krHData();
  if(!f.who || !krcCanEdit(f.who)){ alert('没有权限给这位院长标 OFF'); return; }
  h.offs = h.offs||[]; var wk = f.rep==='weekly'; h.offs.push({id:'off'+Date.now(), date:KRC.pop.date, who:f.who, kind:'director', part:f.part||'全天', note:'', by:ME_NAME, weekly:wk, dow:wk ? new Date(KRC.pop.date+'T00:00:00').getDay() : undefined}); /* 单次 或 每周固定这一天 */
  logOp('其他', '标 OFF：'+f.who+' '+(f.rep==='weekly' ? '每周'+['日','一','二','三','四','五','六'][new Date(KRC.pop.date+'T00:00:00').getDay()] : KRC.pop.date)+' '+(f.part||'全天'), '日程'); KRC.pop = null; Store.touch(); krcRender();
}
function krcDelOff(id){ var h = krHData(), o = (h.offs||[]).filter(function(x){ return x.id===id; })[0]; if(!o || !krcCanEdit(o.who) || !confirm('删除这条 OFF（'+o.who+' '+o.date+'）？')) return; h.offs = h.offs.filter(function(x){ return x.id!==id; }); Store.touch(); krcRender(); }
function krcEdit(id){ KRC.edit = id; KRC.pop = null; krcRender(); }
function krcBusyById(id){ var h = krHData(), r0 = null; Object.keys(h.directorSchedule||{}).forEach(function(n){ (h.directorSchedule[n]||[]).forEach(function(b){ if(b.id===id) r0 = b; }); }); return r0; }
function krcSaveBusy(){ var b = krcBusyById(KRC.edit); if(!b || !krcCanEdit(b.who)) return; var g = function(i){ return document.getElementById(i).value; }; if(timeToMin(g('krc-e-end')) <= timeToMin(g('krc-e-start'))){ alert('结束时间要晚于开始时间'); return; } b.date = g('krc-e-date'); b.time = g('krc-e-start'); b.end = g('krc-e-end'); KRC.edit = null; normSchedBlocks(krHospitalIdOfMe()); Store.touch(); krcRender(); }
function krcDelBusy(){ var h = krHData(), b = krcBusyById(KRC.edit); if(!b || !krcCanEdit(b.who) || !confirm('删除这个不可预约？')) return; h.directorSchedule[b.who] = h.directorSchedule[b.who].filter(function(x){ return x.id!==b.id; }); KRC.edit = null; Store.touch(); krcRender(); }
/* 月视图：单一院长时点日期 = 设定该院长当天是否开放施术；全部院长时点日期 = 看当天 */
function krcMonthClick(ds){
  var who = krcWho();
  if(who==='all'){ KRC.anchor = ds; krcSet('mode','day'); return; }
  if(!(krcIsDirector() ? who===currentAccount().name && canDo('kropen') : canDo('kropen'))){ alert('没有权限设定这位院长的开放日期'); return; }
  var h = krHData(); h.openDates = h.openDates||{}; var arr = (h.openDates[who] = h.openDates[who]||[]), i = arr.indexOf(ds);
  if(i>-1) arr.splice(i, 1); else arr.push(ds); arr.sort(); logOp('其他', (i>-1?'关闭':'开放')+'施术日期：'+who+' '+ds, '日程'); Store.touch(); krcRender();
}
function krcMonthHtml(ev){
  var a = krcAnchor(), ym = a.slice(0,7), start = krcWeekStartMon(ym+'-01'), cells = '', who = krcWho(), openDs = who!=='all' ? hospitalOpenDates(krHospitalIdOfMe(), who) : [];
  for(var i = 0; i < 42; i++){
    var ds = krcAdd(start, i), inM = ds.slice(0,7)===ym, ns = ev.surg.filter(function(x){ return x.b.date===ds; }).length, nsub = ev.subs.filter(function(x){ return x.s.date===ds; }).length, no = ev.offs.filter(function(o){ return offApplies(o, ds); }).length, nb = ev.busy.filter(function(b){ return b.date===ds; }).length, open = openDs.indexOf(ds)>-1;
    cells += '<div onclick="krcMonthClick(\''+ds+'\')" style="min-height:64px;padding:4px 6px;border:1px solid var(--line);background:'+(hospitalClosedOn(krHospitalIdOfMe(), ds)?'#EFEBE4':open?'var(--sage-bg)':inM?'#fff':'#faf8f3')+';cursor:pointer;font-size:11px;'+(ds===krToday()?'outline:2px solid var(--terracotta);':'')+'"><div style="color:'+(inM?'inherit':'var(--muted)')+';">'+ds.slice(8)+(open?' <span style="color:var(--sage);font-size:9px;font-weight:700;">开放</span>':'')+'</div>'+(ns?'<div style="color:#8A4A2A;">施术 '+ns+'</div>':'')+(nsub?'<div style="color:#2F5F86;">子项 '+nsub+'</div>':'')+(nb?'<div style="color:#999;">不可预约 '+nb+'</div>':'')+(no?'<div style="color:var(--muted);">OFF '+no+'</div>':'')+'</div>';
  }
  return '<div style="display:grid;flex-shrink:0;grid-template-columns:repeat(7,1fr);">'+['一','二','三','四','五','六','日'].map(function(x){ return '<div style="text-align:center;font-size:11px;color:var(--muted);padding:3px;">周'+x+'</div>'; }).join('')+cells+'</div>'+
    '<div style="font-size:11px;color:var(--muted);">'+(who==='all' ? '点日期看当天；选择单一院长后，点日期可设定该院长当天是否开放施术（绿色 = 开放）。' : '点日期 = 开放 / 关闭 '+krEsc(who)+' 当天的施术（IN 选施术日期时只看得到开放的日期）。')+'</div>';
}
function krcPopHtml(){
  var f = KRC.popForm, dirs = krcDirectors(), inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:7px;';
  return '<div class="card" style="padding:10px 14px;font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex-shrink:0;"><b>'+KRC.pop.date+'</b>'+
    (krcWho()==='all' && !krcIsDirector() ? '<select onchange="krcPopSet(\'who\',this.value)" style="'+inp+'">'+dirs.map(function(n){ return '<option'+(f.who===n?' selected':'')+'>'+krEsc(n)+'</option>'; }).join('')+'</select>' : '<span>'+krEsc(f.who)+'</span>')+
    '<select onchange="krcPopSet(\'start\',this.value)" style="'+inp+'">'+krTimeOptions(f.start)+'</select>–<select onchange="krcPopSet(\'end\',this.value)" style="'+inp+'">'+krTimeOptions(f.end)+'</select><button class="btn-outline" onclick="krcAddBusy()">加不可预约</button>'+
    '<span style="color:var(--muted);">｜</span><select onchange="krcPopSet(\'part\',this.value)" style="'+inp+'"><option>全天</option><option>上午</option><option>下午</option></select><select onchange="krcPopSet(\'rep\',this.value)" style="'+inp+'"><option value="once"'+(f.rep!=='weekly'?' selected':'')+'>单次</option><option value="weekly"'+(f.rep==='weekly'?' selected':'')+'>每周固定这一天</option></select><button class="btn-outline" onclick="krcAddOff()">标 OFF</button>'+'<button class="btn-ghost" onclick="KRC.pop=null;krcRender()">取消</button><span style="font-size:11px;color:var(--muted);">不可预约不用写原因，也不强制登记</span></div>';
}
function krcEditHtml(){
  var b = krcBusyById(KRC.edit); if(!b) return ''; var can = krcCanEdit(b.who), inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:7px;';
  return '<div class="card" style="padding:10px 14px;font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex-shrink:0;"><b>不可预约 · '+krEsc(b.who)+'</b><input type="date" id="krc-e-date" value="'+b.date+'" style="'+inp+'" '+(can?'':'disabled')+'><select id="krc-e-start" style="'+inp+'" '+(can?'':'disabled')+'>'+krTimeOptions(b.time)+'</select>–<select id="krc-e-end" style="'+inp+'" '+(can?'':'disabled')+'>'+krTimeOptions(b.end)+'</select>'+(can ? '<button class="btn-primary" onclick="krcSaveBusy()">保存</button><button class="btn-outline" onclick="krcDelBusy()">删除</button>' : '')+'<button class="btn-ghost" onclick="KRC.edit=null;krcRender()">关闭</button></div>';
}
/* 日历整块（工作台下半部） */
function krCalendarHtml(){
  var a = krcAnchor(), ev = krcEvents(), dirs = krcDirectors(), inp = 'padding:6px 9px;border:1px solid var(--line);border-radius:7px;font-size:12px;';
  var days = KRC.mode==='week' ? [0,1,2,3,4,5,6].map(function(i){ return krcAdd(a, i); }) : [a]; /* 周视图：今天在第一栏 */
  var title = KRC.mode==='month' ? a.slice(0,7) : (KRC.mode==='week' ? days[0]+' ～ '+days[6] : a+' 周'+krcDow(a));
  var h = krHData(), conf = h.dayConfirm[krToday()];
  var confirmBar = krcIsDirector() ? '' : (conf
    ? '<span style="font-size:12px;color:var(--sage);">✓ 今日院长日程已由 '+krEsc(conf.by)+' 于 '+krEsc(fmtUtcTime(conf.at))+' 确认</span>'
    : '<button class="btn-primary" onclick="krConfirmToday()">确认今日院长日程</button>');
  var tabs = ['day','week','month'].map(function(m){ return '<button onclick="krcSet(\'mode\',\''+m+'\')" style="padding:5px 13px;border-radius:15px;border:1px solid var(--line);background:'+(KRC.mode===m?'var(--navy)':'#fff')+';color:'+(KRC.mode===m?'#fff':'var(--slate)')+';cursor:pointer;font-size:12px;">'+{day:'日',week:'周',month:'月'}[m]+'</button>'; }).join('');
  var sel = krcIsDirector() ? '' : '<select onchange="krcSet(\'person\',this.value)" style="'+inp+'"><option value="all">全部院长</option>'+dirs.map(function(n){ return '<option'+(KRC.person===n?' selected':'')+'>'+krEsc(n)+'</option>'; }).join('')+'</select>';
  return '<div id="kr-cal" style="display:flex;flex-direction:column;gap:10px;"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><span style="font-size:15px;font-weight:700;">日历</span><span style="font-size:11px;color:var(--muted);">韩国时间 · 只显示从 IN 转来的平台案件</span><span style="flex:1;"></span>'+confirmBar+'</div>'+
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">'+tabs+'<button class="btn-ghost" onclick="krcShift(-1)">‹</button><b style="font-size:13px;">'+title+'</b><button class="btn-ghost" onclick="krcShift(1)">›</button><button class="btn-ghost" onclick="krcToday()">今天</button>'+sel+
    '<span style="font-size:11px;color:var(--muted);">图例：<span style="background:#F3DFD3;color:#8A4A2A;padding:0 5px;border-radius:3px;">到院施术</span> <span style="background:#E4E2DC;color:#777;padding:0 5px;border-radius:3px;">不可预约</span> <span style="background:#EDEAE2;color:var(--slate2);padding:0 5px;border-radius:3px;">OFF（固定栏）</span></span></div>'+
    (KRC.pop ? krcPopHtml() : '')+(KRC.edit ? krcEditHtml() : '')+(KRC.mode==='month' ? krcMonthHtml(ev) : krcGridHtml(days, ev))+
    (KRC.mode!=='month' ? '<div style="font-size:11px;color:var(--muted);">点空白格 → 加「不可预约」或标 OFF；点施术 / 子项 → 打开案件；点 OFF 标签可删除。</div>' : '')+'</div>';
}

/* ---------- 三、KR 院长管理（KR-DOC-01）：院长名单 ≠ 院长账号；IN 选院长、报告署名、案例库、对话都读这份名单 ---------- */
var KRD = {edit:null, draft:null};
function krdDoctors(){ return hospitalDirectors(krHospitalIdOfMe()); }
function krdAccountOf(dr){
  var a = ACCOUNTS.filter(function(x){ return x.hospitalId===krHospitalIdOfMe() && x.role==='kr_director' && x.name===dr.name; })[0];
  if(a) return '有账号 '+a.id;
  var o = ACCOUNTS.filter(function(x){ return x.hospitalId===krHospitalIdOfMe() && x.role==='kr_owner' && (x.name+' 원장')===dr.name; })[0];
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
  if(!(d0.name||'').trim()){ alert('请填韩文姓名（例如 김민석 원장）'); return; }
  var list = krdDoctors();
  if(!KRD.edit || KRD.edit==='new'){
    if(list.some(function(x){ return x.name===d0.name.trim(); })){ alert('名单里已经有这位院长'); return; }
    d0.id = hid+'-D'+(list.length+1); d0.name = d0.name.trim(); list.push(d0); h.openDates = h.openDates||{}; h.openDates[d0.name] = h.openDates[d0.name]||[];
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
  var ph = d0.photo ? '<img src="'+d0.photo+'" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">' : '<span style="width:64px;height:64px;border-radius:50%;background:'+(d0.color||'#ddd')+';display:inline-flex;align-items:center;justify-content:center;font-size:22px;color:#fff;">'+krEsc((d0.name||'?').charAt(0))+'</span>';
  return krCardBox((KRD.edit==='new' ? '新增院长' : '编辑院长：'+krEsc(d0.name)),
    '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">'+ph+'<label style="font-size:12px;">照片 <input type="file" accept="image/*" onchange="krdPhoto(this)"></label><span style="font-size:11px;color:var(--muted);">演示：上传的照片只存在内存里，刷新后消失</span></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;"><input placeholder="韩文姓名（如 김민석 원장）" value="'+krEsc(d0.name)+'" oninput="krdField(\'name\',this.value)" '+(KRD.edit==='new'?'':'disabled ')+'style="'+inp+'"><input placeholder="English" value="'+krEsc(d0.nameEn)+'" oninput="krdField(\'nameEn\',this.value)" style="'+inp+'"><input placeholder="中文（可选）" value="'+krEsc(d0.nameZh)+'" oninput="krdField(\'nameZh\',this.value)" style="'+inp+'"><select onchange="krdField(\'title\',this.value)" style="'+inp+'"><option'+(d0.title==='院长'?' selected':'')+'>院长</option><option'+(d0.title==='代表院长'?' selected':'')+'>代表院长</option></select></div>'+
    krdListEditor('经历（现 / 前）','career',true)+krdListEditor('认证资格','certs',false)+krdListEditor('学会 / 培训','societies',false)+
    '<div style="margin:8px 0;"><div style="font-size:12px;font-weight:700;margin-bottom:4px;">擅长项目（选自本医院项目库；IN 选院长时擅长客人意向项目的排前面）</div><div style="display:flex;gap:6px;flex-wrap:wrap;">'+projs.map(function(p){ return '<label style="font-size:12px;border:1px solid var(--line);border-radius:14px;padding:3px 10px;cursor:pointer;"><input type="checkbox" '+(d0.specialties.indexOf(p.name)>-1?'checked':'')+' onchange="krdSpecToggle(\''+krEsc(p.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(p.name)+'</label>'; }).join('')+'</div></div>'+
    '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn-primary" onclick="krdSave()">保存</button><button class="btn-ghost" onclick="krdClose()">取消</button></div>');
}
ADMIN_RENDER.krdoctors = function(el){
  var can = canDo('krdoctors'), list = krdDoctors();
  el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('院长管理')+' <span style="font-size:12px;font-weight:400;color:var(--muted);">'+krEsc(krHospitalName())+' · 名单 ≠ 账号：IN 选院长、报告署名、案例库、对话都读这份名单</span></div>'+
    (can ? '<div><button class="btn-primary" onclick="krdOpen(\'new\')">+ 新增院长</button></div>' : '')+(KRD.draft ? krdEditor() : '')+
    list.map(function(dr){
      var ph = dr.photo ? '<img src="'+dr.photo+'" style="width:52px;height:52px;border-radius:50%;object-fit:cover;">' : '<span style="width:52px;height:52px;border-radius:50%;background:'+(dr.color||'#ddd')+';display:inline-flex;align-items:center;justify-content:center;font-size:18px;color:#fff;flex-shrink:0;">'+krEsc(dr.name.charAt(0))+'</span>';
      var li = function(arr){ return (arr||[]).map(function(x){ return '<div>'+(x.when?krEsc(x.when)+'：':'')+krEsc(x.ko)+' <span style="color:var(--muted);">'+krEsc(x.zh||'')+'</span></div>'; }).join(''); };
      return '<div class="card" style="padding:14px 18px;display:flex;gap:14px;'+(dr.active?'':'opacity:.6;')+'">'+ph+'<div style="flex:1;font-size:12px;line-height:1.7;"><div style="font-size:14px;font-weight:700;">'+krEsc(dr.name)+' <span style="font-weight:400;color:var(--slate2);">'+krEsc(dr.nameEn||'')+(dr.nameZh?' / '+krEsc(dr.nameZh):'')+'</span> <span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+krEsc(dr.title||'院长')+'</span> <span class="status-pill" style="background:'+(dr.active?'var(--sage-bg)':'#EDEAE2')+';color:'+(dr.active?'var(--sage)':'var(--muted)')+';">'+(dr.active?'在职':'停用')+'</span></div>'+
        '<div style="color:var(--muted);">'+krEsc(krdAccountOf(dr))+'</div>'+(dr.career&&dr.career.length?'<div style="margin-top:3px;"><b>经历</b>'+li(dr.career)+'</div>':'')+((dr.certs||[]).length?'<div><b>认证资格</b>'+li(dr.certs)+'</div>':'')+((dr.societies||[]).length?'<div><b>学会 / 培训</b>'+li(dr.societies)+'</div>':'')+((dr.specialties||[]).length?'<div style="margin-top:3px;"><b>擅长项目</b> '+dr.specialties.map(function(n){ return '<span class="chip" style="cursor:inherit;">'+krEsc(n)+'</span>'; }).join('')+'</div>':'')+'</div>'+
        (can ? '<div style="display:flex;flex-direction:column;gap:6px;"><button class="btn-outline" onclick="krdOpen(\''+dr.id+'\')">编辑</button><button class="btn-ghost" onclick="krdToggleActive(\''+dr.id+'\')">'+(dr.active?'停用':'启用')+'</button></div>' : '')+'</div>';
    }).join('');
};

/* ---------- 四、KR 项目库（KR-SRVC-01）：赴韩项目，韩元，一个价格所有诊所一样；维护人 KR 室长、管理者 ---------- */
/* 项目默认资料 p.defaults = {stay:'7天', durMin:60, anes:'local|sleep|general', anesNote, postcare:[{kr(韩国术后管理项目名), times, place:'KR'|'either', day}]}
   KR 写报告的可选范围、更换项目、补加、加做时自动带入，可按客人调整（印尼对应项目写报告时再选） */
var KRP = {edit:null, draft:null, showInactive:false};
function krpProjects(){ return ((HOSPITAL_DATA[krHospitalIdOfMe()]||{}).projects||[]); }
function krpRender(){ ADMIN_RENDER.krsrvc(document.getElementById('admin-body')); }
function krpCatLabel(p){ var c0 = KR_CATEGORIES[p.categoryId] || PROJECT_CATEGORIES[p.categoryId]; return c0 ? c0.label : '—'; }
function krpCatId(label){ var r = ''; Object.keys(KR_CATEGORIES).forEach(function(k){ if(KR_CATEGORIES[k].label===label) r = k; }); return r; }
/* 项目的默认资料 → 报告/更换表单用的 detail */
function krDefaultsDetail(name){
  var p = krpProjects().filter(function(x){ return x.name===name; })[0], df = (p && p.defaults) || {};
  return {stay:df.stay||'', anes:df.anes||'local', anesNote:df.anesNote||'', pc:(df.postcare||[]).map(function(x){ return {kr:x.kr, inn:'', times:x.times||1, place:x.place||'KR', day:x.day||''}; })};
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
  KRP.draft.defaults = KRP.draft.defaults || {stay:'', durMin:60, anes:'local', anesNote:'', postcare:[]};
  KRP.draft.names = KRP.draft.names || {zh:KRP.draft.name, ko:'', id:''};
  krpRender();
}
function krpField(k, v){ KRP.draft[k] = v; }
function krpName(k, v){ KRP.draft.names[k] = v; if(k==='ko'){ if(!KRP.draft.names.zh || KRP.draft.names._auto!==false){ KRP.draft.names.zh = KRP.draft.names.zh || demoTranslate(v,'ko','zh'); } KRP.draft.names.id = demoTranslate(v,'ko','id'); } }
function krpDef(k, v){ KRP.draft.defaults[k] = v; }
function krpPcAdd(){ KRP.draft.defaults.postcare.push({kr:'', times:1, place:'KR', day:''}); krpRender(); }
function krpPcDel(i){ KRP.draft.defaults.postcare.splice(i, 1); krpRender(); }
function krpPcSet(i, k, v){ KRP.draft.defaults.postcare[i][k] = v; }
function krpClose(){ KRP.edit = null; KRP.draft = null; krpRender(); }
function krpSave(){
  if(!canDo('krlib')){ alert('只有 KR 室长、管理者可以维护项目库'); return; }
  var d0 = KRP.draft, list = krpProjects(), hid = krHospitalIdOfMe(), price = Number(d0.price);
  d0.name = (d0.names.zh || d0.name || '').trim();
  if(!d0.name){ alert('请填项目名称（中文名，用来在 IN 端显示和对应）'); return; }
  if(!(price >= 0) || d0.price===''){ alert('请填价格（韩元）'); return; }
  if(list.some(function(x){ return x.name===d0.name && x.id!==KRP.edit; })){ alert('项目库里已经有同名项目'); return; }
  d0.price = price; d0.defaults.durMin = Number(d0.defaults.durMin)||60;
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
    (isPost ? '<div style="font-size:11px;color:var(--muted);margin-top:6px;">「韩国术后管理」分类：在韩国做的术后管理，只在 KR 写报告选"所需术后管理"时用，不用填默认资料。</div>' :
    '<div style="margin-top:10px;padding:10px 12px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;"><div style="font-weight:700;margin-bottom:6px;">项目默认资料（KR 写报告 / 更换项目 / 补加时自动带入，可按客人调整）</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">推荐在韩时间 <input value="'+krEsc(df.stay)+'" oninput="krpDef(\'stay\',this.value)" placeholder="例如 7 天" style="'+inp+'width:90px;"> 施术时长 <input type="number" min="15" step="15" value="'+krEsc(df.durMin)+'" oninput="krpDef(\'durMin\',this.value)" style="'+inp+'width:80px;"> 分钟 麻醉 <select onchange="krpDef(\'anes\',this.value)" style="'+inp+'">'+Object.keys(KR_ANES).map(function(k){ return '<option value="'+k+'"'+(df.anes===k?' selected':'')+'>'+KR_ANES[k]+'</option>'; }).join('')+'</select><input placeholder="麻醉备注" value="'+krEsc(df.anesNote)+'" oninput="krpDef(\'anesNote\',this.value)" style="'+inp+'min-width:180px;"></div>'+
      '<div style="margin-top:8px;font-weight:700;">所需术后管理</div>'+df.postcare.map(function(x, i){ return '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0;"><select onchange="krpPcSet('+i+',\'kr\',this.value)" style="'+inp+'"><option value="">选择韩国术后管理项目</option>'+post.map(function(o){ return '<option'+(x.kr===o.name?' selected':'')+'>'+krEsc(o.name)+'</option>'; }).join('')+'</select><input type="number" min="1" value="'+x.times+'" onchange="krpPcSet('+i+',\'times\',Math.max(1,parseInt(this.value,10)||1))" style="'+inp+'width:56px;"> 次<select onchange="krpPcSet('+i+',\'place\',this.value)" style="'+inp+'"><option value="KR"'+(x.place==='KR'?' selected':'')+'>必须在韩国</option><option value="either"'+(x.place==='either'?' selected':'')+'>韩国或印尼都可</option></select><input placeholder="术后第几天" value="'+krEsc(x.day)+'" oninput="krpPcSet('+i+',\'day\',this.value)" style="'+inp+'width:96px;"><a href="#" onclick="krpPcDel('+i+');return false;">移除</a></div>'; }).join('')+'<button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="krpPcAdd()">+ 添加所需术后管理</button></div>')+
    '<div style="display:flex;gap:8px;margin-top:10px;"><button class="btn-primary" onclick="krpSave()">保存</button><button class="btn-ghost" onclick="krpClose()">取消</button></div>');
}
ADMIN_RENDER.krsrvc = function(el){
  var can = canDo('krlib'), all = krpProjects(), shown = all.filter(function(p){ return KRP.showInactive ? !p.active : p.active; }), cats = Object.keys(KR_CATEGORIES);
  var group = cats.map(function(k){
    var rows = shown.filter(function(p){ return p.categoryId===k; }); if(!rows.length) return '';
    return '<div class="card" style="padding:8px 18px;"><div style="font-size:12px;font-weight:700;color:var(--terracotta);padding:6px 0;">'+krEsc(KR_CATEGORIES[k].label)+(KR_CATEGORIES[k].postcare?'（在韩国做的术后管理）':'')+'</div>'+rows.map(function(p){
      var df = p.defaults, u = krpUsage(p), meta = df ? [KR_ANES[df.anes]||'', df.stay ? '在韩 '+df.stay : '', df.durMin ? df.durMin+' 分钟' : '', (df.postcare||[]).length ? '术后管理 '+df.postcare.length+' 项' : ''].filter(Boolean).join(' · ') : '';
      return '<div class="case-field-row" style="font-size:13px;gap:10px;align-items:flex-start;"><div style="flex:1;"><b>'+krEsc(p.name)+'</b> <span style="color:var(--muted);font-size:11px;">'+krEsc((p.names||{}).ko||'')+'</span><div style="font-size:11px;color:var(--slate2);">'+(meta ? '默认：'+krEsc(meta) : '<span style="color:var(--muted);">没有默认资料</span>')+'</div><div style="font-size:11px;color:var(--muted);">使用中：进行中案件 '+u.cases.length+' · 案例 '+u.libCases+'</div></div><span style="min-width:110px;text-align:right;">'+formatCurrency(p.price,'KRW')+'</span>'+
        (can ? '<span style="display:flex;gap:6px;"><button class="btn-outline" style="padding:3px 10px;font-size:11px;" onclick="krpOpen(\''+p.id+'\')">编辑</button><button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="krpToggleActive(\''+p.id+'\')">'+(p.active?'非活性化':'重新启用')+'</button>'+(!p.active ? '<button class="btn-ghost" style="padding:3px 10px;font-size:11px;'+(krpDeleteBlock(p)?'opacity:.4;':'')+'" onclick="krpDelete(\''+p.id+'\')" title="'+krEsc(krpDeleteBlock(p))+'">删除</button>' : '')+'</span>' : '')+'</div>';
    }).join('')+'</div>';
  }).join('');
  el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('项目库')+' <span style="font-size:12px;font-weight:400;color:var(--muted);">赴韩项目 · 韩元 · 一个价格，所有对接诊所一样（IN 端可切换显示印尼盾 / 人民币）</span></div>'+
    '<div style="display:flex;gap:8px;"><button class="chip'+(KRP.showInactive?'':' active')+'" onclick="KRP.showInactive=false;krpRender()">在用</button><button class="chip'+(KRP.showInactive?' active':'')+'" onclick="KRP.showInactive=true;krpRender()">非活性化</button><span style="flex:1;"></span>'+(can ? '<button class="btn-primary" onclick="krpOpen(\'new\')">+ 新增项目</button>' : '')+'</div>'+(KRP.draft ? krpEditor() : '')+(group || krEmpty('没有项目'))+
    '<div style="font-size:11px;color:var(--muted);">改价格只影响之后新选的项目；已选进案件的快照不变。"在用" = 所有对接诊所的进行中案件 + 本医院案例库案例；还在用的不能删除。分类是全系统共用的标准部位。</div>';
};


/* ---------- 五、KR 案例库（KR-SHOW-01）：赴韩施术案例；结构沿用 IN 案例库（部位 → 项目 → 案例、详情页、展示模式、手写同意书）
   维护人 KR 室长、管理者；项目选自本医院项目库；院长读 KR-DOC-01 名单（停用显示"-"）；所有对接的诊所都看得到本医院的案例（IN 案例库按医院区分）
   做法：KR 页面里把 IN 案例库用到的全局数据换成本医院的（LIB_CASES = 本医院案例数组，PROJECT_LIBRARY = 本医院项目），直接复用 IN 的渲染和编辑函数 ---- */
function krShowBind(){
  var h = krHData(); h.libCases = h.libCases || [];
  window.DEMO_ROLE = 'kr'; window.LIB_HOSPITAL = krHospitalIdOfMe();
  window.CURRENT_CLINIC_ID = '__KR'; /* 不属于任何诊所：IN 案例库的"医院切换"不会出现，也不会把案例记到某家诊所名下 */
  PROJECT_LIBRARY.length = 0; Array.prototype.push.apply(PROJECT_LIBRARY, (h.projects||[]));
  window.LIB_CASES = h.libCases; /* 同一个数组：新增/编辑直接写进医院资料，存档时随全局保存 */
  window.libDirectorClickable = function(){ return false; }; /* KR 端没有 IN 的"院长详情"页 */
}
ADMIN_RENDER.krshow = function(el){
  krShowBind();
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;"><div id="lib-filters" style="display:flex;flex-direction:column;gap:10px;flex-grow:1;min-width:280px;"></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;"><button class="btn-primary" id="lib-add-btn" onclick="openLibCaseModal(null)"'+(canDo('krlib')?'':' disabled')+'>+ 新增案例（赴韩施术）</button></div></div>'+
    '<div style="font-size:11px;color:var(--muted);">所有对接的诊所的 IN 室长都看得到本医院的案例（标明医院）；上传必须勾选同意并上传手写同意书。</div><div id="lib-grid" style="margin-top:6px;"></div>';
  renderLibrary();
};
