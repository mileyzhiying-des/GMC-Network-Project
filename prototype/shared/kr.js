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
          updated:c.updated||'', postPending:postCareBatchesOf(c).filter(function(x){ return !x.b.schedule && (x.b.bought-x.b.used)>0; }).length, badge:badge, label:badge[2], subItems:caseSubStatusItems(c), phoneMasked:maskPhone(clientPhoneOf(c.name)), c:c});
      });
    });
  });
  return rows;
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
      '<div class="card" style="padding:2px 20px;">'+row('医院名称（韩 / 英）', aEsc(h.name.ko)+' / '+aEsc(h.name.en))+row('地址', aEsc(h.address))+row('时区', aEsc(h.tz))+row('对接的诊所', clinics.map(function(c){ return aEsc(c.name); }).join('、')||'—')+'</div>'+
      '<div style="font-size:11px;color:var(--muted);">医院设定的编辑项（语言、短信等）在后面几份指令里做；院长名单、开放施术日期、日程在 KR 端的日程管理 / 院长管理里。</div>';
  };
  ADMIN_RENDER.bizdata = function(el, r){
    if(!isKrAccount()) return baseBiz(el, r);
    if(typeof krBizData === 'function') return krBizData(el, r);
    el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('经营数据')+'</div><div class="card" style="padding:24px;color:var(--slate2);">本医院的汇总数字在第二部分之后补。</div>';
  };
})();


/* ---------- 三、KR 大盘（KR-DASH-01） ---------- */
function krToday(){ return nowFullDt().split(' ')[0]; }
function krEsc(s){ return aEsc(s); }
function krHData(){ var h = HOSPITAL_DATA[krHospitalIdOfMe()]; if(h){ h.dayConfirm = h.dayConfirm || {}; h.reportRead = h.reportRead || {}; h.offs = h.offs || []; } return h; }
function krIsDirector(){ var a = currentAccount(); return !!a && a.role==='kr_director'; }

/* 卡片 → 案件列表筛选条件（四里用同一份判断） */
var KR_CARDS = [
  {key:'eta',      label:'待确认报告时间', tip:'客人已缴面诊费，等室长确认预计出报告时间', test:function(r){ return r.c.consultStatus==='paid_waiting_kr'; }},
  {key:'due',      label:'报告快到期 / 已超时', tip:'预计出报告时间 24 小时内，或已超时', test:function(r){ if(r.c.consultStatus!=='awaiting_report') return false; if(reportOverdueNow(r.c)) return true; var e = reportEtaParse(r.c.reportEta); return !!e && (e - nowDateObj()) <= 86400000; }},
  {key:'sched',    label:'待确认施术时间', tip:'客人提交了施术日期，等 KR 确认', test:function(r){ return r.c.stage==='travel' && scheduleState(r.c)==='Pending'; }},
  {key:'change',   label:'改期待确认', tip:'客人申请改期，等 KR 确认', test:function(r){ return r.c.stage==='travel' && scheduleState(r.c)==='Changing'; }},
  {key:'today',    label:'今天到院', tip:'施术日期是今天的客人', test:function(r){ var ks = r.c.krSchedule; return !!ks && ['confirmed','arrived'].indexOf(ks.status)>-1 && ks.confirmedDate===krToday(); }},
  {key:'postcare', label:'术后管理待确认', tip:'术后管理项目的进行时间还没确认', test:function(r){ return r.postPending>0; }}
];
function krCardRows(card, rows){ return rows.filter(card.test); }
/* 点卡片 → 案件列表（带筛选）；案件列表在第四部分 */
var KR_LIST = {tab:'all', card:'', clinic:'', director:'', q:'', mine:false};
function krGoCards(key){ KR_LIST.card = key; KR_LIST.tab = 'all'; KR_LIST.clinic = ''; KR_LIST.director = ''; KR_LIST.q = ''; KR_LIST.mine = false; nav('kr-cases'); }

function krConfirmToday(){
  var h = krHData(); if(!h) return;
  h.dayConfirm[krToday()] = {by: ME_NAME, at: nowFullDt().split(' ')[1]};
  logOp('其他', '确认今日院长日程（'+krToday()+'）', '日程');
  Store.touch(); krRenderDashboard();
}
function krOffRows(hid, date){ return (HOSPITAL_DATA[hid].offs||[]).filter(function(o){ return o.date===date; }); }

function krCardHtml(card, rows){
  var hit = krCardRows(card, rows), per = {};
  hit.forEach(function(r){ per[r.clinicName] = (per[r.clinicName]||0) + 1; });
  var sub = krClinics().map(function(cl){ return '<span style="margin-right:10px;">'+krEsc(cl.name)+' <b>'+(per[cl.name]||0)+'</b></span>'; }).join('');
  var warn = hit.length && (card.key==='due');
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

function krRenderDashboard(){
  var el = document.getElementById('krdash-body'); if(!el) return;
  var hid = krHospitalIdOfMe(), h = krHData(), rows = krAllCases();
  var head = '<div style="font-size:18px;font-weight:700;">'+t('大盘')+' <span style="font-size:13px;font-weight:400;color:var(--muted);">'+krEsc(krHospitalName())+' · '+krToday()+'</span></div>';
  if(krIsDirector()){ el.innerHTML = head + krOffBar(hid) + krDirectorBlocks(rows); return; }
  var conf = h.dayConfirm[krToday()];
  var banner = conf
    ? '<div style="font-size:12px;color:var(--sage);padding:0 4px;">✓ 今日院长日程已由 '+krEsc(conf.by)+' 于 '+krEsc(conf.at)+' 确认</div>'
    : '<div class="card" style="padding:12px 16px;display:flex;align-items:center;gap:12px;background:#FBF0C9;border-color:#E8D48A;"><span style="flex:1;font-size:13px;color:#8F6F0C;"><b>今日院长日程尚未确认</b>（日程管理在后续指令里做，这里先用按钮确认）</span><button class="btn-primary" onclick="krConfirmToday()">确认</button></div>';
  el.innerHTML = head + krOffBar(hid) + banner +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">'+KR_CARDS.map(function(c){ return krCardHtml(c, rows); }).join('')+'</div>'+
    '<div style="font-size:15px;font-weight:700;margin-top:6px;">今日到院时间线</div>'+
    '<div class="card" style="padding:4px 16px;">'+krArrivalsHtml(rows)+'</div>';
}

/* 院长大盘：今日自己的日程、等我出报告的案件、室长刚提交的报告（近 7 天，未读加粗） */
function krDirectorBlocks(rows){
  var me = currentAccount(), h = krHData(), today = krToday();
  var sched = ((h.directorSchedule||{})[me.name]||[]).filter(function(s){ return s.date===today; }).sort(function(a,b){ return a.time.localeCompare(b.time); });
  var arrivals = rows.filter(KR_CARDS[4].test);
  var schedHtml = (sched.length ? sched.map(function(s){ return '<div class="trow" style="grid-template-columns:0.6fr 3fr;"><span><b>'+krEsc(s.time)+'</b></span><span>'+krEsc(s.title)+'</span></div>'; }).join('') : '')+
    arrivals.map(function(r){ return '<div class="trow" onclick="krOpenCase(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:0.6fr 3fr;cursor:pointer;"><span><b>'+krEsc(r.c.krSchedule.confirmedTime||'—')+'</b></span><span>到院：'+krEsc(r.name)+'（'+krEsc(r.clinicName)+'）</span></div>'; }).join('') ||
    '';
  if(!sched.length && !arrivals.length) schedHtml = '<div style="padding:18px;color:var(--muted);font-size:13px;">今天没有日程</div>';
  var waiting = rows.filter(function(r){ return r.c.consultStatus==='awaiting_report'; }).sort(function(a,b){ return (a.c.reportEta||'9999').localeCompare(b.c.reportEta||'9999'); });
  var waitHtml = waiting.length ? waiting.map(function(r){
    var over = reportOverdueNow(r.c);
    return '<div class="trow" onclick="krOpenCase(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:1.2fr 1fr 1.4fr;cursor:pointer;"><span><b>'+krEsc(r.name)+'</b></span><span>'+krEsc(r.clinicName)+'</span><span style="'+(over?'color:#B2453A;font-weight:600;':'')+'">预计 '+krEsc(r.c.reportEta||'—')+(over?'（已超时）':'')+'</span></div>';
  }).join('') : '<div style="padding:18px;color:var(--muted);font-size:13px;">没有等你出报告的案件</div>';
  var weekAgo = new Date(nowDateObj().getTime() - 7*86400000).toISOString().slice(0,10);
  var read = h.reportRead[me.id] || [];
  var done = rows.filter(function(r){ return r.c.reportUploadedBy && r.c.reportDate && r.c.reportDate >= weekAgo; }).sort(function(a,b){ return b.c.reportDate.localeCompare(a.c.reportDate); });
  var doneHtml = done.length ? done.map(function(r){
    var unread = read.indexOf(r.clinicId+':'+r.id) < 0;
    return '<div class="trow" onclick="krReadReport(\''+r.clinicId+'\',\''+r.id+'\')" style="grid-template-columns:1.2fr 1fr 1fr 1fr;cursor:pointer;'+(unread?'font-weight:700;':'color:var(--slate2);')+'"><span>'+(unread?'● ':'')+krEsc(r.name)+'</span><span>'+krEsc(r.clinicName)+'</span><span>'+krEsc(r.c.reportDate)+'</span><span>'+krEsc(r.c.reportUploadedBy)+'</span></div>';
  }).join('') : '<div style="padding:18px;color:var(--muted);font-size:13px;">近 7 天没有新提交的报告</div>';
  var blk = function(title, body){ return '<div style="font-size:15px;font-weight:700;margin-top:6px;">'+title+'</div><div class="card" style="padding:4px 16px;">'+body+'</div>'; };
  return blk('今日我的日程', schedHtml) + blk('等我出报告的案件（按预计时间）', waitHtml) + blk('室长刚提交的报告（近 7 天，未读加粗）', doneHtml);
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
  if(c.consultStatus==='awaiting_report') return '预计 '+(c.reportEta||'—')+(reportOverdueNow(c)?'（已超时）':'');
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
  var base = c.reportEta ? c.reportEta.split(' ') : [krDateAdd(1), '14:00'];
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
  var eta = d+' '+tm;
  if(eta <= nowFullDt()){ alert('预计出报告时间必须晚于现在'); return; }
  KR_ETA_EDIT = false;
  krMut(function(c){ return coreSetReportEta(c, eta, ME_NAME, !!change); });
}
function krEtaStatusBlock(c){
  var over = reportOverdueNow(c);
  return krCardBox('预计出报告时间', krKV('预计时间', krEsc(c.reportEta||'—'))+krKV('倒计时', over ? '<b style="color:#C26A1B;">已超过预计时间</b>' : krEsc(reportRemainingText(c)))+
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
  var rows = (c.logEntries||[]).map(function(e){ return '<div class="case-field-row" style="font-size:12px;align-items:flex-start;"><span style="min-width:120px;color:var(--muted);">'+krEsc(e.dt||'')+'</span><span style="min-width:70px;color:var(--slate2);">'+krEsc(e.stage||'')+'</span><span style="min-width:90px;font-weight:600;">'+krEsc(e.actor||'')+'</span><span style="flex:1;">'+krEsc(e.action||'')+'</span></div>'; }).join('');
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
  return '<div class="trow" onclick="krOpenNotif(\'' + n.id + '\')" style="grid-template-columns:18px 1fr 130px;cursor:pointer;'+(unread?'font-weight:700;':'color:var(--slate2);')+'"><span style="color:var(--terracotta);">'+(unread?'●':'')+'</span><span>'+krEsc(n.text)+(cl?' <span style="font-weight:400;font-size:11px;color:var(--muted);">'+krEsc(cl.name)+'</span>':'')+'</span><span style="font-weight:400;font-size:11px;color:var(--muted);">'+krEsc(n.ts)+'</span></div>';
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
    return day+'<div style="display:flex;flex-direction:column;align-items:'+(mine?'flex-end':'flex-start')+';margin:6px 0;"><div style="font-size:11px;color:var(--muted);margin-bottom:2px;">'+krEsc(who)+' · '+krEsc(m.time||'')+'</div><div style="max-width:78%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5;background:'+(mine?'var(--navy)':'var(--border2)')+';color:'+(mine?'#fff':'inherit')+';">'+ref+krEsc(krMsgText(m))+'</div></div>';
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
  var msg = {day:KD(0), from:'them', name:ME_NAME, color:'var(--sage)', init:(ME_NAME||'?').charAt(0), orig:text, trans:demoTranslate(text,'ko','zh'), time:nowTime()};
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
  var rows = v.audio.map(function(a){ return row('录音', a.ts, a.by, krEsc(a.label)+'（'+a.sec+' 秒）'); }).concat(
    v.transcripts.map(function(x){ return row('转写', x.ts, x.by, krEsc(x.text)+(x.demo?' <i style="color:var(--muted);">（演示）</i>':'')); }),
    v.drafts.map(function(d){ return row(d.source.indexOf('AI')===0?'AI草稿':'修改稿', d.ts, d.by, krEsc(d.text)); }),
    v.history.map(function(h0){ return row('过程', h0.ts, h0.by, krEsc(h0.action)); }));
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
function krPickToggle(name, on){ KR_SUB.pick[name] = on; if(on && !KR_SUB.detail[name]) KR_SUB.detail[name] = {stay:'', anes:'local', anesNote:'', pc:[]}; krRenderCaseDetail(); }
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
    var krOpts = '<option value="">选择韩国术后管理项目</option>'+cand.krPost.map(function(o){ return '<option value="'+q(o.name)+'"'+(x.kr===o.name?' selected':'')+'>'+krEsc(o.name)+'（'+formatCurrency(o.price,'KRW')+'）</option>'; }).join('');
    var inOpts = '<option value="">印尼对应项目（选填）</option>'+cand.post.map(function(o){ return '<option value="'+q(o.name)+'"'+(x.inn===o.name?' selected':'')+'>'+krEsc(o.name)+'（'+fmtRp(o.price)+'）</option>'; }).join('');
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
        return {name:x.kr, price:kp ? kp.price : 0, times:x.times, place:x.place, day:(x.day||'').trim(), innName:ip ? ip.name : '', innPrice:ip ? ip.price : 0};
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
    addable = opts ? '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;"><select id="kr-add-sel" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;">'+opts+'</select><select id="kr-add-anes" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;"><option value="local">局部麻醉</option><option value="sleep">睡眠麻醉</option><option value="general">全身麻醉</option></select><input id="kr-add-stay" placeholder="推荐在韩时间" style="width:110px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;"><input id="kr-add-note" placeholder="备注" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;"><button class="btn-primary" onclick="krAddScope()">补加可选项目</button></div><div style="font-size:11px;color:var(--muted);margin-top:6px;">只能新增，不能删除；要拿掉某个项目，请在对话里和 IN 室长商量。</div>' : krEmpty('项目库里的项目都已经在可选范围内了');
  }
  return krCardBox('可选范围（项目确认中）', list+addable);
}
function isLocalProjectName(name){ return PROJECT_LIBRARY.some(function(p){ return p.name===name && p.origin==='IN'; }); }
function krAddScope(){
  if(!krCan()) return; /* 院长不能补加 */
  var sel = document.getElementById('kr-add-sel'); if(!sel || !sel.value) return;
  var parts = sel.value.split('|'), name = parts.slice(1).join('|'), note = (document.getElementById('kr-add-note').value||'').trim();
  var cand = krScopeCandidates(KR_CASE.clinicId), p = (parts[0]==='kr' ? cand.kr : cand.post).filter(function(x){ return x.name===name; })[0]; if(!p) return;
  var item = {name:p.name, price:p.price, note:note};
  if(parts[0]==='kr'){ var at = document.getElementById('kr-add-anes').value; item.anesthesia = {type:at, label:KR_ANES[at], note:''}; item.stay = (document.getElementById('kr-add-stay').value||'').trim(); item.postcare = []; }
  krMut(function(c){ return coreAddScopeItem(c, item, ME_NAME); });
}


/* ---------- 四、项目进程（在韩 timeline 与子项，KR-CASE-02 第 4 节） ---------- */
var KR_SUB_NEW = {date:'', content:'', kind:'施术', place:'KR', projectName:''};
function krSubNewSet(k, v){ KR_SUB_NEW[k] = v; }
function krProgressBlock(c){
  if(!c.settlementDone || !krAllItems(c).length) return krCardBox('项目进程（在韩 timeline）', krEmpty('付定金后，KR 室长在这里整理在韩 timeline'));
  var can = krCan(), inp = 'padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;';
  var rows = (c.subItems||[]).map(function(s){
    if(!can || s.done) return subItemRowHtml(s);
    return '<div class="case-field-row" style="font-size:12px;gap:6px;flex-wrap:wrap;"><b style="min-width:104px;">'+krEsc(s.no)+'</b><input type="date" value="'+s.date+'" onchange="krSubEdit(\''+s.id+'\',\'date\',this.value)" style="'+inp+'"><input value="'+krEsc(s.content)+'" onchange="krSubEdit(\''+s.id+'\',\'content\',this.value)" style="'+inp+'flex:1;min-width:160px;"><select onchange="krSubEdit(\''+s.id+'\',\'place\',this.value)" style="'+inp+'">'+krPlaceOpts(s.place)+'</select><a href="#" onclick="krSubDel(\''+s.id+'\');return false;">删除</a></div>';
  }).join('');
  var projOpts = '<option value="">（不关联项目）</option>'+krActiveItems(c).map(function(it){ return '<option value="'+krEsc(it.name).replace(/"/g,'')+'"'+(KR_SUB_NEW.projectName===it.name?' selected':'')+'>'+krEsc(it.name)+'</option>'; }).join('');
  var add = can ? '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--border2);"><input type="date" value="'+KR_SUB_NEW.date+'" onchange="krSubNewSet(\'date\',this.value)" style="'+inp+'"><select onchange="krSubNewSet(\'kind\',this.value)" style="'+inp+'">'+['施术','复诊','管理','其他'].map(function(x){ return '<option'+(KR_SUB_NEW.kind===x?' selected':'')+'>'+x+'</option>'; }).join('')+'</select><input placeholder="内容（例如 10/16 施术、消肿管理）" value="'+krEsc(KR_SUB_NEW.content)+'" oninput="krSubNewSet(\'content\',this.value)" style="'+inp+'flex:1;min-width:200px;"><select onchange="krSubNewSet(\'place\',this.value)" style="'+inp+'">'+krPlaceOpts(KR_SUB_NEW.place)+'</select><select onchange="krSubNewSet(\'projectName\',this.value)" style="'+inp+'">'+projOpts+'</select><button class="btn-primary" onclick="krSubAdd()">添加子项</button></div>' : '';
  return krCardBox('项目进程（在韩 timeline，每一行是案件下的一个子项）', (rows || krEmpty('还没有子项：请整理在韩 timeline（例如 施术、复诊、消肿管理、拆线）'))+add+'<div style="font-size:11px;color:var(--muted);margin-top:8px;">IN 端在赴韩项目 tab 下的子 tab 只读显示；客人端暂不显示。已完成的子项不能再改。</div>');
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
function krArrSet(k, v){ KR_ARR[k] = v; if(k==='judge' || k==='swapItem' || k==='confirmTrip') krRenderCaseDetail(); }
function krUnableToggle(name, on){ KR_ARR.unable[name] = on; }
function krSetAlloc(projectId, batchId, i, v){ if(!krCan()) return; krMut(function(c){ return corePcAlloc(c, projectId, batchId, i, v, ME_NAME); }); }
function krAllocHtml(c){
  var its = krActiveItems(c).filter(function(it){ return (it.postcare||[]).length; });
  if(!its.length) return '';
  return '<div style="margin:10px 0;"><div style="font-size:12px;font-weight:700;">确认行程：术后管理的地点和金额（可弹性的在这时确定）</div>'+its.map(function(it){ return '<div style="font-size:12px;margin-top:6px;"><b>'+krEsc(it.name)+'</b></div>'+pcLinesHtml(c, it, 'krSetAlloc'); }).join('')+'</div>';
}
function krArrivalBlock(c){
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
    var calc = '实际项目合计 '+formatCurrency(info.total,'KRW')+'（含术后管理的韩国部分）；定金合计 '+formatCurrency(info.deposit,'KRW')+(info.preRefund>0 ? '，减去到院前已退 '+formatCurrency(info.preRefund,'KRW') : '')+' = 可抵定金 '+formatCurrency(info.effDeposit,'KRW')+'；<b>'+(info.diff>=0 ? '尾款（在韩国补）' : '应退差额（IN 室长按此金额退）')+' '+formatCurrency(Math.abs(info.diff),'KRW')+'</b>';
    body = krKV('KR 判断', KR_JUDGE_TEXT[j.result])+'<div style="font-size:12px;color:var(--slate2);margin:8px 0;line-height:1.7;">'+calc+'</div>';
    if(j.result==='changed' && !j.settled && can){
      var pend = krNotStartedItems(c);
      body += '<div style="margin:8px 0;padding:10px 12px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;"><div style="font-weight:700;margin-bottom:4px;">调整项目</div>'+
        pend.map(function(it){ return '<label style="display:block;margin:3px 0;"><input type="checkbox" '+(KR_ARR.unable[it.name]?'checked':'')+' onchange="krUnableToggle(\''+krEsc(it.name).replace(/'/g,'')+'\',this.checked)"> '+krEsc(it.name)+'</label>'; }).join('')+
        '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;"><input placeholder="无法施术的原因" value="'+krEsc(KR_ARR.reason)+'" oninput="krArrSet(\'reason\',this.value)" style="'+inp+'min-width:200px;"><button class="btn-outline" onclick="krDoUnable()">标记无法施术</button></div>'+
        '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><span>更换：</span><select onchange="krArrSet(\'swapItem\',this.value)" style="'+inp+'"><option value="">原项目</option>'+pend.map(function(it){ return '<option'+(KR_ARR.swapItem===it.name?' selected':'')+'>'+krEsc(it.name)+'</option>'; }).join('')+'</select><span>→</span><select onchange="krArrSet(\'swapAlt\',this.value)" style="'+inp+'"><option value="">新项目（本医院项目库）</option>'+krScopeCandidates(KR_CASE.clinicId).kr.map(function(p){ return '<option'+(KR_ARR.swapAlt===p.name?' selected':'')+'>'+krEsc(p.name)+'</option>'; }).join('')+'</select><button class="btn-outline" onclick="krDoSwap()">更换项目</button></div>'+
        '<div style="font-size:11px;color:var(--muted);margin-top:4px;">更换的新项目另开新结算单，不收定金，金额计入尾款。</div></div>';
    }
    if(!c.krBalancePaid && can){
      body += krAllocHtml(c)+'<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:8px 0;cursor:pointer;"><input type="checkbox" '+(KR_ARR.confirmTrip?'checked':'')+' onchange="krArrSet(\'confirmTrip\',this.checked)"> 已和客人确认行程（地点和金额确定后不能再改）</label><button class="btn-primary" onclick="krDoSettle()"'+(KR_ARR.confirmTrip?'':' disabled style="opacity:.5;"')+'>'+(info.diff>=0 ? '标记付清尾款' : '通知 IN 退差额')+'</button>'+(j.refundDue ? '<div style="font-size:12px;color:#C26A1B;margin-top:6px;">已通知 IN 室长按 '+formatCurrency(j.refundDue,'KRW')+' 退差额；退款后视为尾款已结清。</div>' : '');
    } else if(c.krBalancePaid){
      body += '<div style="font-size:12px;color:var(--sage);font-weight:700;margin-top:6px;">✓ 已付清尾款，行程已确认'+(c.innCare ? '；印尼部分术后管理 '+formatCurrency(c.innCare.total,'IDR')+'：'+({pending:'等 IN 室长收款', collected:'IN 已收款并转为持有项目', declined:'客人当下不买'}[c.innCare.status]) : '')+'</div>';
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
function krDoSwap(){ if(!krCan() || !KR_ARR.swapItem || !KR_ARR.swapAlt){ alert('请选择原项目和新项目'); return; } var a = KR_ARR.swapItem, b = KR_ARR.swapAlt; KR_ARR.swapItem = ''; KR_ARR.swapAlt = ''; krMut(function(c){ return coreSwapItem(c, a, b, ME_NAME); }); }
function krDoSettle(){
  if(!krCan() || !KR_ARR.confirmTrip) return; KR_ARR.confirmTrip = false;
  var r0 = krMut(function(c){ return coreSettleBalance(c, ME_NAME); }); if(!r0 || !r0.ok) alert('现在不能结算尾款');
}
function krDoRebook(){ if(!krCan() || !KR_ARR.rebookDate){ alert('请选择新的施术日期'); return; } var d = KR_ARR.rebookDate, t0 = KR_ARR.rebookTime; krMut(function(c){ return coreRebook(c, d, t0, ME_NAME); }); }
function krDoRefundDecision(kind){ if(!krCan() || !confirm('确认：定金'+(kind==='all'?'全部退回':'不退')+'？IN 室长会按这个判断操作。')) return; krMut(function(c){ return coreRefundDecision(c, kind, ME_NAME); }); }
