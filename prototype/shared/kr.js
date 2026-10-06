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
  if(canDo('krview')) items.push({id:'kr-cases', key:'krcases', label:'案件列表', icon:'件'}, {id:'kr-notifications', key:'krnotifs', label:'通知中心', icon:'通'});
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
  var a = currentAccount(), notDirector = a && a.role!=='kr_director', hasWork = canDo('krview');
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
  else { var b = document.querySelector('#'+id+' .content'); if(b && !b.innerHTML.trim()) b.innerHTML = '<div class="card" style="padding:28px;color:var(--slate2);line-height:1.8;">'+t(KR_PAGE_TITLES[id]||'')+'：后续部分实现。</div>'; }
}
function krBoot(){
  try{ i18nStart(); }catch(e){}
  document.querySelectorAll('.me-name').forEach(function(el){ el.textContent = ME_NAME; });
  var start = canDo('krview') || canDo('krviewOwn') ? 'kr-dashboard' : null;
  if(!start){ location.replace(homeUrl()); return; }
  CURRENT_PAGE_ID = start;
  krRenderPage(start); showPage(start);
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
