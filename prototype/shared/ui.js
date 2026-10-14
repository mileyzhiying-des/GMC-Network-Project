/* shared/ui.js —— 组件/界面层：页面切换、渲染、弹窗、toast、对话浮窗、日历等；含界面状态变量
   由 gmc-network-prototype.html 拆分而来（2026-10-05 结构拆分）。classic script，全局函数/变量，不使用 ES module。 */
/* ================= navigation ================= */
var NAV_STACK = [];

var CURRENT_PAGE_ID = 'in-dashboard';

/* 这个时段的完整日程列表（周视图格子里超过 3 个时点"+N 更多"）：每项可点进案件/占位 */
function openSlotList(ds, hr){
  var evs = calendarEvents().filter(function(e){ return e.date===ds && slotOf(e.time)===hr && !calEvHidden(e); }).sort(function(a,b){ return a.time.localeCompare(b.time) || ((a.kind==='placeholder')-(b.kind==='placeholder')) || String(a.name).localeCompare(String(b.name)); });
  var ov = document.getElementById('slot-list-overlay');
  if(!ov){ ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'slot-list-overlay'; ov.style.zIndex = 70; ov.onclick = function(e){ if(e.target===ov) closeSlotList(); }; document.body.appendChild(ov); }
  ov.innerHTML = '<div class="modal-box" style="width:420px;max-height:80vh;overflow-y:auto;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-size:15px;font-weight:700;">'+dateLabel(ds)+' '+hr+' · '+evs.length+' 项日程</span><span style="cursor:pointer;color:var(--slate);" onclick="closeSlotList()">✕</span></div>'+
    '<div class="slot-list-body" style="display:flex;flex-direction:column;gap:6px;">'+evs.map(function(e){ return '<div style="display:flex;gap:8px;align-items:stretch;"><span style="font-size:11px;color:var(--muted);width:38px;padding-top:4px;">'+e.time+'</span><div style="flex:1;min-width:0;display:flex;flex-direction:column;">'+eventChipHtml(e)+'</div></div>'; }).join('')+'</div></div>';
  ov.querySelector('.slot-list-body').addEventListener('click', function(e){ if(e.target.closest('.event-chip')) closeSlotList(); }, true); /* 捕获阶段：事件块自己的 onclick 会 stopPropagation，所以不能靠冒泡 */
  ov.classList.add('open');
}
function closeSlotList(){ var ov = document.getElementById('slot-list-overlay'); if(ov) ov.classList.remove('open'); }

/* 管理类页面（经营数据/账号管理/诊所设定/操作日志）：各页的渲染函数在 ADMIN_RENDER[key] 里登记（第五～八部分）；没权限 → 导回自己的首页 */
var ADMIN_RENDER = {};
var ADMIN_KEY = null;
function openAdminPage(key, isRefresh){
  var p = ADMIN_PAGES.filter(function(x){ return x.key===key; })[0];
  if(!p || !canDo(p.perm)){ location.replace(homeUrl()); return; }
  if(!isRefresh && CURRENT_PAGE_ID==='in-casedetail' && !intakeLeaveOk()) return; /* 接待中未保存：先确认 */
  var el = document.getElementById('in-admin'); if(!el) return;
  ADMIN_KEY = key;
  el.dataset.page = 'admin-'+key;
  var tSlot = el.querySelector('.topbar-slot'); if(tSlot) tSlot.innerHTML = buildTopbar(adminPageLabel(p));
  var body = document.getElementById('admin-body');
  if(ADMIN_RENDER[key]) ADMIN_RENDER[key](body, isRefresh);
  else body.innerHTML = '<div class="card" style="padding:28px;color:var(--slate2);line-height:1.8;">「'+adminPageLabel(p)+'」页面在后续部分实现。</div>';
  if(typeof adminBanner === 'function') body.insertAdjacentHTML('afterbegin', adminBanner());
  if(CURRENT_PAGE_ID !== 'in-admin') NAV_STACK.push(CURRENT_PAGE_ID);
  showPage('in-admin');
}
function refreshAdminPage(){ if(CURRENT_PAGE_ID==='in-admin' && ADMIN_KEY) openAdminPage(ADMIN_KEY, true); }

/* ---- 接待中不停留（CMD-1008-06，IN-CASE-01 / 状态机总览第 13 节）：接待中、基础资料未保存时，页面内离开 → 弹窗确认；
   确定 = 案件回到待访问（Timeline 记"接待未完成，退回待访问"）并离开；取消 = 留在页面。直接关分页 / 刷新：beforeunload 当场退回，兜底靠心跳过期扫描（data.js sweepStaleReceptions） ---- */
function currentReceptionCase(){
  if(CURRENT_PAGE_ID!=='in-casedetail' || !CURRENT_CASE_ID) return null;
  var c = CASE_ITEMS.filter(function(x){ return x.id===CURRENT_CASE_ID; })[0];
  return receptionOpen(c) ? c : null;
}
function intakeLeaveOk(){
  var c = currentReceptionCase(); if(!c) return true;
  if(!confirm('还没保存，确定要关闭该页面吗？')) return false;
  revertIntakeToWaiting(c, '接待未完成，退回待访问', actingName());
  clearReceptionBeat(c);
  try{ renderCaseRows(); buildWeekGrid(); }catch(e){}
  return true;
}
function receptionBeatTick(){ var c = currentReceptionCase(); if(c) writeReceptionBeat(c); }
function receptionLeaveNow(){ /* 关分页 / 刷新 / 离开页面：尽力当场退回待访问（做不到时由心跳过期兜底） */
  var c = currentReceptionCase(); if(!c) return;
  revertIntakeToWaiting(c, '接待未完成，退回待访问', '系统'); clearReceptionBeat(c);
  try{ Store.save(); }catch(e){}
}

function nav(id){
  if(id !== 'in-admin' && !canDo('work') && !isKrAccount()){ location.replace(homeUrl()); return; }
  if(id !== CURRENT_PAGE_ID && !intakeLeaveOk()) return; /* 接待中未保存：先确认 */ /* KR 账号的页面权限在 kr.js 里判断 */ /* 没有日常工作权限的账号不能进工作类页面 */
  if(id === 'in-admin'){ openAdminPage(ADMIN_KEY || 'bizdata'); return; }
  if(id === CURRENT_PAGE_ID) return;
  NAV_STACK.push(CURRENT_PAGE_ID);
  if(isKrAccount() && typeof krRenderPage==='function') krRenderPage(id); /* KR 页面先渲染内容 */
  showPage(id);
}

var CASE_RETURN = [];
 /* 案件页内跳转到另一个案件时，记下来源案件，goBack() 回到它 */
function goBack(){
  if(!intakeLeaveOk()) return;
  var prev = NAV_STACK.pop();
  if(prev==='in-casedetail' && CURRENT_PAGE_ID==='in-casedetail' && CASE_RETURN.length){
    openCaseDetail(CASE_RETURN.pop(), true); /* 返回来源案件（不再入栈） */
    return;
  }
  showPage(prev || 'in-dashboard');
}

function showPage(id){
  document.querySelectorAll('.page').forEach(function(p){p.style.display='none';p.classList.remove('active');});
  var el = document.getElementById(id);
  el.style.display = 'flex';
  el.classList.add('active');
  CURRENT_PAGE_ID = id;
  if(el.classList.contains('in-shell')) highlightSidebar(el.dataset.page);
  window.scrollTo(0,0);
}


/* ================= sidebar / topbar for IN app ================= */
var SIDEBAR_COLLAPSED = false;

var IN_NAV = [
  {id:'in-dashboard', key:'dashboard', label:'工作台', icon:'工'},
  {id:'in-cases', key:'cases', label:'案件管理', icon:'件'}, /* 2026-10-08（CMD-1008-06）：案件管理在客户管理上面 */
  {id:'in-clients', key:'clients', label:'客户管理', icon:'客'},
  {id:'in-library', key:'library', label:'案例库', icon:'库'},
  {id:'in-projectlibrary', key:'projects', label:'项目库', icon:'项'},
  {id:'in-notifications', key:'notifications', label:'通知中心', icon:'通'}
];

var TITLES = {dashboard:'工作台', clients:'客户管理', cases:'案件管理', library:'案例库', projects:'项目库', notifications:'通知中心'};
ADMIN_PAGES.forEach(function(p){ TITLES['admin-'+p.key] = p.label; });


function buildSidebar(activePage){
  if(isKrAccount() && typeof buildKrSidebar==='function') return buildKrSidebar(activePage); /* KR 医院账号用 KR 的侧边栏（kr.js） */
  var brand = SIDEBAR_COLLAPSED
    ? '<div class="brand collapsed-brand"><span class="logo-sq">G</span></div>'
    : '<div class="brand"><b>GMC Network</b><span>'+accountRoleShort()+' · '+ME_NAME+'</span></div>';
  var navItems = canDo('work') ? IN_NAV : []; /* 没有日常工作权限（老板）的账号不显示工作类入口 */
  var navHtml = navItems.map(function(item){
    var active = item.key === activePage ? ' active' : '';
    var inner = SIDEBAR_COLLAPSED
      ? '<span class="nav-icon">'+item.icon+'</span>'
      : '<span class="dot"></span><span>'+item.label+'</span>';
    var onclick = item.action ? (item.action+';return false;') : ((item.id==='in-library' || item.id==='in-projectlibrary') ? ('openSidebarPage(\''+item.id+'\');return false;') : ('nav(\''+item.id+'\');return false;'));
    return '<a class="nav-item'+active+'" href="#" title="'+item.label+'" onclick="'+onclick+'">'+inner+'</a>';
  }).join('');
  var adminItems = ADMIN_PAGES.filter(function(p){ return !p.hidden && canDo(p.perm); });
  if(adminItems.length){
    navHtml += (SIDEBAR_COLLAPSED || !navItems.length ? '' : '<div style="font-size:11px;color:var(--muted);padding:14px 14px 4px;">诊所管理</div>') + adminItems.map(function(p){
      var active = ('admin-'+p.key) === activePage ? ' active' : '';
      var inner = SIDEBAR_COLLAPSED ? '<span class="nav-icon">'+p.icon+'</span>' : '<span class="dot"></span><span>'+p.label+'</span>';
      return '<a class="nav-item'+active+'" href="#" title="'+p.label+'" onclick="openAdminPage(\''+p.key+'\');return false;">'+inner+'</a>';
    }).join('');
  }
  var toggleGlyph = SIDEBAR_COLLAPSED ? '»' : '«';
  var toggleBtn = '<span class="collapse-toggle" onclick="toggleSidebar()" title="'+(SIDEBAR_COLLAPSED?'展开':'收起')+'">'+toggleGlyph+'</span>';
  return '<div class="sidebar'+(SIDEBAR_COLLAPSED?' collapsed':'')+'">'+toggleBtn+brand+'<nav>'+navHtml+'</nav>'+(SIDEBAR_COLLAPSED?'':'<div class="sidebar-foot">GMC Network · '+(canDo('work')?'印尼室长端':'老板端')+'</div>')+'</div>';
}

function buildTopRightIcons(){
  return '<div class="actions">'+
    (canDo('work') ? '<button class="icon-btn" onclick="openDrawer()" aria-label="对话">💬<span class="badge chat-badge">0</span></button>'+
    '<button class="icon-btn" onclick="toggleBellDropdown(event)" aria-label="通知">🔔<span class="badge bell-badge">0</span></button>' :
      (currentAccount() && currentAccount().role==='owner' ? '<button class="icon-btn" onclick="toggleBellDropdown(event)" aria-label="通知">🔔<span class="badge bell-badge">0</span></button>' : '')) /* CMD-1014-16：IN 老板有铃铛，只收「系统」类（设定更新、账号加购 / 退订），没有对话 */ +
    '<span class="avatar" style="cursor:pointer;" onclick="toggleAvatarMenu(event)" title="'+ME_NAME+'">'+((ME_NAME||'?').charAt(0).toUpperCase())+'</span></div>';
}

function buildTopbar(title){
  if(isKrAccount() && typeof buildKrTopbar==='function') return buildKrTopbar(title);
  return '<div class="topbar"><span class="title">'+title+'</span>'+buildTopRightIcons()+'</div>';
}

/* 页面打开方式（2026-10-02·三）：在案件页里打开案例库 / 项目库 → 新标签页（?page=...）；不在案件里 → 页内跳转。
   这两个页面的入口只有侧边栏的［案例库］［项目库］两项（每个 in-shell 页面共用同一个侧边栏） */
function openSidebarPage(id){
  if(CURRENT_PAGE_ID==='in-casedetail'){ window.open(location.pathname+'?page='+id, '_blank'); return; }
  nav(id);
}

function toggleSidebar(){
  SIDEBAR_COLLAPSED = !SIDEBAR_COLLAPSED;
  refreshAllSidebars();
}

function refreshAllSidebars(){
  var current = null;
  document.querySelectorAll('.in-shell.active').forEach(function(shell){ current = shell.dataset.page; });
  document.querySelectorAll('.in-shell').forEach(function(shell){
    var slot = shell.querySelector('.sidebar-slot');
    if(slot) slot.innerHTML = buildSidebar(current);
  });
}

function highlightSidebar(activePage){
  // Clear every nav-item's active state first, then mark only the current page's item —
  // rebuilding the sidebar HTML from scratch guarantees no stale "active" class survives a page switch.
  document.querySelectorAll('.in-shell').forEach(function(shell){
    var slot = shell.querySelector('.sidebar-slot');
    if(slot) slot.innerHTML = buildSidebar(activePage);
  });
}

var CAL_MODE = 'week';

var WEEK_OFFSET = 0, MONTH_OFFSET = 0; /* 月视图：相对「今天所在月」的偏移（CMD-1013-09 补充 1，原来 ‹ › 换不了月） */

var DAY_OFFSET = 0;

function applyTzSetting(){
  var o = TZ_INFO[CLINIC_TZ] || TZ_INFO['Asia/Jakarta'];
  var dd = document.getElementById('dash-date'); if(dd){ var t = demoNow(); dd.textContent = t.getFullYear()+'年'+(t.getMonth()+1)+'月'+t.getDate()+'日（周'+DOW_CN[dowOfDate(dateStr(t))]+'）'; } /* 今天的日期取电脑日期 */
  var w = document.getElementById('dash-weather'); if(w) w.textContent = '☁ '+(CLINIC_SETTINGS.city||o.city)+' '+o.temp+'℃';
  var l = document.getElementById('cal-tz-label'); if(l) l.textContent = tzLabel(CLINIC_TZ); /* 画面上不显示 WIB / WITA / WIT，只显示 UTC+n */
}

/* 日历右上角的时区按钮：时区已搬到「诊所设定」（老板/管理者）；一般室长只看不改 */
function openCalSettings(){ if(canDo('clinic')) openAdminPage('clinic'); }

/* "早上好"下面直接一行：今日 OFF：院长、KR 室长、IN 室长的名字；没有人 OFF 就不显示（2026-10-02 深夜；原来的"今日"区块含今日行程列表已删除） */
function renderTodayOff(){
  var el = document.getElementById('dash-off-row'); if(!el) return;
  var today = todayStr();
  var offs = memosOn(today).filter(function(m){ return m.type==='OFF'; });
  if(!offs.length){ el.style.display = 'none'; el.innerHTML = ''; return; }
  var grp = function(role){ var n = offs.filter(function(m){ return m.role===role; }).map(function(m){ return m.person; }); return n.length ? '<span style="margin-right:16px;"><span style="color:var(--muted);">'+role+'</span> <b style="color:#C1454A;">'+n.join('、')+'</b></span>' : ''; };
  el.style.display = 'block';
  el.innerHTML = '<b>今日 OFF：</b>'+grp('KR院长')+grp('KR室长')+grp('IN室长');
}

var MEMO_DRAFT = null;

/* memo 新增 / 修改（2026-10-08）：editId 有值 = 修改自己写的 memo（固定栏里的「修改」）；弹窗底部 [保存][删除]，删除前再确认一次 */
function openMemoModal(editId){
  var m = editId ? CAL_MEMOS.filter(function(x){ return x.id===editId; })[0] : null;
  if(editId && (!m || m.author!==ME_NAME)){ showToast('不能修改', '只能修改自己写的 memo', null); return; }
  MEMO_DRAFT = m ? {editId:m.id, date:m.date, type:m.type, scope:m.scope, text:m.text||''} : {date:todayStr(), type:'备忘', scope:'公开', text:''};
  var tt = document.getElementById('memo-title'); if(tt) tt.textContent = m ? '修改 memo' : '新增 memo';
  renderMemoBody();
  document.getElementById('memo-overlay').classList.add('open');
}

function closeMemoModal(){ document.getElementById('memo-overlay').classList.remove('open'); }

function renderMemoBody(){
  var d = MEMO_DRAFT, isOff = d.type==='OFF';
  var radio = function(name, val, label, checked, disabled){ return '<label style="margin-right:14px;font-size:13px;'+(disabled?'color:var(--dim);':'')+'"><input type="radio" name="'+name+'" '+(checked?'checked ':'')+(disabled?'disabled ':'')+'onchange="memoSet(\''+name+'\',\''+val+'\')"> '+label+'</label>'; };
  document.getElementById('memo-body').innerHTML =
    '<div class="field" style="margin-bottom:12px;"><label>日期</label><input type="date" value="'+d.date+'" onchange="memoSet(\'date\',this.value)"></div>'+
    '<div style="margin-bottom:12px;"><div style="font-size:12px;color:var(--slate);margin-bottom:4px;">类型</div>'+radio('type','备忘','备忘',d.type==='备忘')+radio('type','OFF','OFF',d.type==='OFF')+'</div>'+
    '<div style="margin-bottom:12px;"><div style="font-size:12px;color:var(--slate);margin-bottom:4px;">可见范围</div>'+radio('scope','公开','公开',d.scope==='公开')+radio('scope','私人','私人',d.scope==='私人',isOff)+(isOff?'<span style="font-size:11px;color:var(--muted);">OFF 固定公开</span>':'')+'</div>'+
    '<div class="field" style="margin-bottom:12px;"><label>'+(isOff?'备注（选填）':'内容')+'</label><input type="text" value="'+(d.text||'').replace(/"/g,'&quot;')+'" oninput="memoSet(\'text\',this.value)" placeholder="'+(isOff?'例如：年假':'备忘内容')+'"></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-bottom:12px;">作者：'+ME_NAME+(isOff?'（IN 室长的 OFF 从这里登记）':'')+'</div>'+
    (d.editId ? '<div style="display:flex;gap:10px;"><button class="btn-primary" style="flex:1;" onclick="saveMemoDraft()">保存</button><button class="btn-outline" style="flex:1;color:#C1454A;border-color:#C1454A;" onclick="deleteMemoDraft()">删除</button></div>' : '<button class="btn-primary" style="width:100%;" onclick="saveMemoDraft()">保存</button>');
}

function saveMemoDraft(){
  var d = MEMO_DRAFT; if(!d.date){ alert('请选择日期'); return; }
  if(d.type==='备忘' && !(d.text||'').trim()){ alert('请填写备忘内容'); return; }
  var fields = {date:d.date, weekly:false, dow:undefined, type:d.type, scope:d.type==='OFF' ? '公开' : d.scope, role:d.type==='OFF' ? 'IN室长' : undefined, person:d.type==='OFF' ? ME_NAME : undefined, text:(d.text||'').trim()};
  if(d.editId){ var m = CAL_MEMOS.filter(function(x){ return x.id===d.editId; })[0]; if(!m || m.author!==ME_NAME) return; Object.assign(m, fields); } /* 修改：原地更新（只能改自己写的） */
  else CAL_MEMOS.push(Object.assign({id:'m'+Date.now(), author:ME_NAME}, fields));
  saveMemos(); closeMemoModal(); renderCalendar(); try{ Store.touch(); }catch(e){}
  showToast(d.editId ? '已修改' : '已保存', d.type==='OFF' ? ME_NAME+' '+d.date+' OFF（公开）' : 'memo 已'+(d.editId?'修改':'保存')+'（'+d.scope+'）', null);
}
function deleteMemoDraft(){
  var d = MEMO_DRAFT; if(!d || !d.editId) return;
  var m = CAL_MEMOS.filter(function(x){ return x.id===d.editId; })[0]; if(!m || m.author!==ME_NAME) return;
  if(!confirm('确定删除这条 memo？'+(m.type==='OFF' ? '（OFF · '+m.date+'）' : '（'+m.date+'）'))) return; /* 删除前再确认一次 */
  CAL_MEMOS.splice(CAL_MEMOS.indexOf(m), 1);
  saveMemos(); closeMemoModal(); renderCalendar(); try{ Store.touch(); }catch(e){}
  showToast('已删除', 'memo 已删除', null);
}

var CAL_MODE_BY = {}; /* CMD-1014-18 三·3：本院日程 / KR 医院日程各自记住日 / 周 / 月，切回来回到原本的视图 */
function setCalView(v){
  if(CAL_VIEW!==v) CAL_MODE_BY[CAL_VIEW] = CAL_MODE;
  var memo = (CAL_VIEW!==v) ? CAL_MODE_BY[v] : null;
  CAL_VIEW = v;
  /* CMD-1008-05：KR 医院日程只有月 / 周；从本院日程的日视图切过来时自动变周视图（周含当天），切回本院日程保持周视图；「日」按钮在 KR 视角隐藏 */
  var dayBtn = document.getElementById('cal-sw-day'); if(dayBtn) dayBtn.style.display = v==='kr' ? 'none' : '';
  if(v==='kr' && CAL_MODE==='day'){ var dd = new Date(TODAY_DATE); dd.setDate(dd.getDate()+DAY_OFFSET); CAL_WEEK_FULL = true; CAL_ANCHOR = dd; WEEK_OFFSET = 0; DAY_OFFSET = 0; CAL_MODE = 'week'; ['month','week','day'].forEach(function(m){ var sw = document.getElementById('cal-sw-'+m), pn = document.getElementById('cal-'+m+'-view'); if(sw) sw.classList.toggle('active', m==='week'); if(pn) pn.style.display = m==='week' ? 'block' : 'none'; }); }
  if(memo && memo!==CAL_MODE && !(v==='kr' && memo==='day')){ CAL_MODE = memo; ['month','week','day'].forEach(function(m){ var sw = document.getElementById('cal-sw-'+m), pn = document.getElementById('cal-'+m+'-view'); if(sw) sw.classList.toggle('active', m===memo); if(pn) pn.style.display = m===memo ? 'block' : 'none'; }); }
  document.getElementById('cal-view-in').classList.toggle('active', v==='in');
  document.getElementById('cal-view-kr').classList.toggle('active', v==='kr');
  var sel = document.getElementById('kr-dir-sel'), hsel = document.getElementById('kr-hosp-sel');
  sel.style.display = v==='kr' ? 'inline-block' : 'none';
  hsel.style.display = 'none'; /* 一诊所一医院：不再切换医院 */
  KR_HOSPITAL = krViewHospital(); if(!KR_DIRECTOR) KR_DIRECTOR = 'all'; if(KR_DIRECTOR!=='all' && hospitalDirectorNames(KR_HOSPITAL).indexOf(KR_DIRECTOR)<0) KR_DIRECTOR = 'all';
  hsel.innerHTML = linkedHospitals().map(function(h){ return '<option value="'+h.id+'"'+(h.id===KR_HOSPITAL?' selected':'')+'>'+h.name.ko+'</option>'; }).join('');
  sel.innerHTML = '<option value="all"'+(KR_DIRECTOR==='all'?' selected':'')+'>医院</option>'+hospitalDirectorNames(KR_HOSPITAL).map(function(n){ return '<option'+(n===KR_DIRECTOR?' selected':'')+'>'+n+'</option>'; }).join(''); /* 全部 / 各院长（停用的不显示） */
  renderCalendar();
}

/* ---- IN 工作台「KR 医院日程」视角（2026-10-07，CMD-1007-03；IN-DASH-01 / KR-SCHD-01）----
   顶部：全部 / 各院长（读 KR 院长名单，停用不显示），月 / 周 / 日都支持。"全部" = 把所有院长的块叠加在同一个日历（不分列），时间重叠并排。
   块上的文字：灰块只写院长名字（不写原因 / 类型）；本诊所客人的施术块 = 客人名字 + 院长；他诊所客人的施术块 = 灰块只写院长名字；
   院长 OFF（整天 / 半天）、医院休诊日都显示；选单一院长时，该院长未开放施术的日期标"未开放"。
   KR 日程块的时间是韩国时间，周 / 日视图的行是诊所时间，所以按 krTimeOf(行) 对应；第二行小字是实际的韩国时间。 */
function krViewDirs(){ var hid = krViewHospital(), who = KR_DIRECTOR; var names = hospitalDirectorNames(hid); return who && who!=='all' && names.indexOf(who)>-1 ? [who] : names; } /* 当前要显示的院长（全部 = 全部启用的院长） */
function krViewIsAll(){ return !(KR_DIRECTOR && KR_DIRECTOR!=='all' && hospitalDirectorNames(krViewHospital()).indexOf(KR_DIRECTOR)>-1); }
function shortDir(n){ return String(n||'').replace(/ 원장$/, ''); }
/* 某天、当前视角下的事项：{who, s, e(分钟，韩国时间), type:'surg'|'busy'|'off', own:本诊所客人, label} */
function krDayItems(ds){
  var hid = krViewHospital(), hd = HOSPITAL_DATA[hid] || {directorSchedule:{}, offs:[]}, out = [];
  krViewDirs().forEach(function(n){
    ((hd.directorSchedule||{})[n]||[]).forEach(function(b){
      if(b.date!==ds) return;
      var s = timeToMin(b.time), e = timeToMin(b.end||minToTime(s+SLOT_MIN)), surg = b.kind==='施术', own = surg && b.clinicId===CURRENT_CLINIC_ID, label = '';
      if(b.kind==='预约'){ /* CMD-1014-16：IN 在 KR 日程帮客人占位预约；本诊所的显示「客人 · 待 KR 确认 / 预约」，其他诊所的 = 浅灰无字 */
        var mine = b.clinicId===CURRENT_CLINIC_ID;
        out.push({who:n, s:s, e:e, type:mine ? 'book' : 'busy', own:mine, pending:b.status==='待确认', bookingId:b.bookingId, label:mine ? (b.name||'')+' · '+(b.status==='待确认' ? '待 KR 确认' : '预约') : '', caseId:mine ? (b.caseId||null) : null});
        return;
      }
      if(own){ /* 本诊所客人的施术：谁 · 做什么 · 哪位医生（项目取案件的赴韩施术项目；多项显示第一项 + 等 N 项） */
        var c = CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0], its = c ? krActiveItems(c) : [];
        label = (b.name||'')+' · '+(its.length ? its[0].name+(its.length>1 ? ' 等'+its.length+'项' : '') : '施术')+' · '+n;
      } /* 其他诊所客人的施术：IN 看不到任何信息——当作和「不可预约」一样的浅灰无字块（「全部」里不显示；单一院长才显示浅灰块） */
      out.push({who:n, s:s, e:e, type:own ? 'surg' : 'busy', own:own, isRes:(b.kind==='施术' || b.kind==='面诊'), label:label, caseId:own ? b.caseId : null}); /* 不可预约：不写任何字 */
    });
    (hd.offs||[]).forEach(function(o){
      if(!offApplies(o, ds) || o.who!==n || o.kind!=='director') return;
      out.push({who:n, s:0, e:0, type:'off', own:false, part:o.part||'全天', label:n+' OFF', offKr:o});
    });
  });
  /* CMD-1014-18 四·2：占位预约不挂院长（全院），任何院长视角都显示 */
  ((hd.directorSchedule||{})[KRB_HOSP]||[]).forEach(function(b){
    if(b.date!==ds || b.kind!=='预约') return;
    var s = timeToMin(b.time), e = timeToMin(b.end||minToTime(s+SLOT_MIN)), mine = b.clinicId===CURRENT_CLINIC_ID;
    out.push({who:'', s:s, e:e, type:mine ? 'book' : 'busy', own:mine, pending:b.status==='待确认', bookingId:b.bookingId, label:mine ? (b.name||'')+' · '+(b.status==='待确认' ? '待 KR 确认' : '预约') : '', caseId:mine ? (b.caseId||null) : null});
  });
  return out;
}
/* 时间格里画什么：「全部」只画施术（平台案件）；单一院长画该院长的施术 + 不可预约（浅灰无字）；OFF 不画在时间格里 */
function krGridItems(ds){ var all = krViewIsAll(); return krDayItems(ds).filter(function(it){ return it.type==='surg' || it.type==='book' || (!all && it.type==='busy'); }); }
/* 固定栏写所有"不在"：整天 OFF 写「X OFF」；半休写「X HH:mm–HH:mm 不在」（时间换算成页面时区）；「全部」时室长 OFF 照旧；单一院长时只写该院长自己的 */
/* 半天 OFF 对应的韩国时间段：跟着医院设定算（krHalfRange，data.js）：上午 = 营业开始→午休开始，下午 = 午休结束→营业结束 */
function krBarChips(ds){
  var chip = function(txt){ return '<span style="display:inline-block;background:#F3E3E1;color:#B5483E;border-radius:5px;padding:1px 6px;margin:1px;font-size:10px;">'+txt+'</span>'; };
  var out = krDayItems(ds).filter(function(it){ return it.type==='off' && (!krViewIsAll() || (it.offKr && it.offKr.kind!=='director')); }).map(function(it){ /* 医院层只显示室长 OFF；院长层才显示院长 OFF */
    if(it.part==='全天') return chip(it.label);
    var h = krHalfRange(krViewHospital(), offPartArg(it.part)), a = krToClinic(ds, h[0]).time, z = krToClinic(ds, h[1]).time;
    return chip(it.who+' '+a+'–'+z+' 不在');
  });
  if(krViewIsAll()){
    var hd = HOSPITAL_DATA[krViewHospital()] || {offs:[]};
    (hd.offs||[]).filter(function(o){ return o.kind==='coord' && offApplies(o, ds); }).forEach(function(o){ out.push(chip(o.who+' OFF')); });
  }
  return out.join('');
}
/* 周 / 日视图的 KR 医院日程：一个事占一整块（高度跨满所跨的时段，和本院日程事件块同一画法），重叠并排；整天 OFF 只在顶部固定栏，半天 OFF 画成一整块 */
var KR_ROW_PX = 36;
/* KR 周视图的时间轴行（CMD-1008-05）：医院营业时间（韩国时间）每 SLOT_MIN 一行；大字 = 换算成页面时区的时间，小字 = 韩国时间 */
function krRows(){ var hr = hospitalHours(krViewHospital()); return slotsBetween(hr.open, hr.close); }
function krToPageTime(hm){ var diff = (tzOffsetMin(CLINIC_TZ) - tzOffsetMin(KR_TZ)); var t = (((timeToMin(hm) + diff) % 1440) + 1440) % 1440; return minToTime(t); }
function krLaneLayout(list){
  var sorted = list.slice().sort(function(a,b){ return a.s-b.s || b.e-a.e; }), lanes = [], res = [];
  sorted.forEach(function(it){ var li = -1; for(var i = 0; i < lanes.length; i++){ if(lanes[i] <= it.s){ li = i; break; } } if(li < 0){ li = lanes.length; lanes.push(0); } lanes[li] = it.e; res.push({it:it, lane:li}); });
  res.forEach(function(r0){ var mx = 0; res.forEach(function(o){ if(o.it.s < r0.it.e && o.it.e > r0.it.s) mx = Math.max(mx, o.lane); }); r0.n = mx+1; });
  return res;
}
/* 时间轴表头（和日期列头同一行）：「印尼」（大字）/「韩国」（小字），对应下面每一行的大字 / 小字；每一行时间本身不加标注 */
function axisHeadHtml(){ return ''; } /* CMD-1014-19：拿掉最上面「印尼 / 韩国」小标题，改成每个时间前标「印 / 韩」 */
function krBlockStyle(it){
  if(it.type==='book') return it.pending ? 'background:#fff;color:var(--sage);border:1.5px dashed #3F7A55;font-weight:700;cursor:pointer;' : 'background:var(--sage-bg);color:var(--sage);border:1px solid #BFD3C5;border-left:4px solid #3F7A55;font-weight:700;cursor:pointer;'; /* CMD-1014-16：IN 在 KR 日程占位预约：待 KR 确认 = 虚线块，确认后 = 实线块 */
  if(it.type==='surg' && it.own) return 'background:var(--sage-bg);color:var(--sage);border:1px solid #BFD3C5;border-left:4px solid #3F7A55;font-weight:700;cursor:pointer;'; /* 本诊所客人的施术：左侧深绿色条，可点进案件 */
  return 'background:#F3F1EC;'; /* 不可预约：很浅的灰，不写字 */
}
/* 某一天的一整列：items（韩国时间分钟）按诊所行对应的韩国时间摆放；baseMin = 第一行对应的韩国时间 */
function krDayColHtml(ds, items, baseMin, closedFrom, lunch, closedBefore){
  var total = krRows().length, h = total*KR_ROW_PX, blocks = '';
  krLaneLayout(items).forEach(function(r0){
    var it = r0.it, s = Math.max(it.s, baseMin), e = Math.min(it.e, baseMin + total*SLOT_MIN); if(e <= s) return;
    var top = (s-baseMin)/SLOT_MIN*KR_ROW_PX, hgt = Math.max(16, (e-s)/SLOT_MIN*KR_ROW_PX - 2), w = 100/r0.n;
    blocks += '<div'+(((it.type==='surg' || it.type==='book') && it.own) ? '' : ' class="kr-busy"')+(it.type==='book' && it.own ? ' onclick="krBookBlockClick(\''+it.bookingId+'\')"' : (it.own && it.caseId ? ' onclick="openCaseDetail(\''+it.caseId+'\')"' : ''))+' title="'+(it.label || '这段时间不可预约')+'" style="position:absolute;left:calc('+(r0.lane*w)+'% + 1px);width:calc('+w+'% - 3px);top:'+top+'px;height:'+hgt+'px;box-sizing:border-box;border-radius:6px;padding:3px 6px;font-size:11px;line-height:1.3;overflow:hidden;z-index:2;'+krBlockStyle(it)+'">'+it.label+'</div>';
  });
  var hatch = closedFrom ? '<div title="医院休诊（定期休诊）" style="position:absolute;left:0;right:0;top:'+Math.max(0, (timeToMin(closedFrom)-baseMin)/SLOT_MIN*KR_ROW_PX)+'px;bottom:0;background:#F3F1EC;z-index:1;"></div>' : ''; /* 部分时段休诊：灰色斜纹 */
  var hatchB = closedBefore ? '<div title="医院休诊（半天营业）" style="position:absolute;left:0;right:0;top:0;height:'+Math.max(0, (timeToMin(closedBefore)-baseMin)/SLOT_MIN*KR_ROW_PX)+'px;background:#F3F1EC;z-index:1;"></div>' : '';
  var lunchBand = lunch ? '<div title="午休" style="position:absolute;left:0;right:0;top:'+((timeToMin(lunch.from)-baseMin)/SLOT_MIN*KR_ROW_PX)+'px;height:'+((timeToMin(lunch.to)-timeToMin(lunch.from))/SLOT_MIN*KR_ROW_PX)+'px;background:#F3F1EC;color:var(--dim);font-size:10px;text-align:center;line-height:16px;z-index:0;">午休</div>' : ''; /* 午休：浅灰窄带，文字浅色（时间由韩国时间换算成页面时区的行） */
  return '<div class="kr-daycol" data-ds="'+ds+'" onclick="krBookCellClick(\''+ds+'\',event,this,'+baseMin+')" onmousemove="krBookHover(this,event,'+baseMin+')" onmouseleave="krBookHoverOff(this)" style="cursor:cell;position:relative;height:'+h+'px;border-right:1px solid var(--border2);border-bottom:1px solid var(--border2);background:#fff repeating-linear-gradient(to bottom, transparent, transparent '+(KR_ROW_PX-1)+'px, var(--border2) '+(KR_ROW_PX-1)+'px, var(--border2) '+KR_ROW_PX+'px);">'+lunchBand+hatch+hatchB+blocks+'</div>';
}
function krTimeColHtml(){
  return '<div>'+krRows().map(function(kr){ return '<div class="wk-time" style="height:'+KR_ROW_PX+'px;box-sizing:border-box;"><b style="color:var(--slate);">印 '+krToPageTime(kr)+'</b><span class="kr">韩 '+kr+'</span></div>'; }).join('')+'</div>';
}
function krOpenTag(ds){ /* CMD-1014-19 一·6：日期下写「已约 N / 上限」或「约满」，取代「施术开放 / 未开放」；算法见 calalign.js krCapSlots */
  var hid = krViewHospital(), hd = HOSPITAL_DATA[hid]; if(!hd) return ''; var slots = krCapSlots(hid, ds); if(!slots.length) return '';
  var all = krViewIsAll(), its = krDayItems(ds), names = krViewDirs();
  var blocks = its.filter(function(it){ return it.type!=='off' && (it.type==='surg' || it.type==='book' || it.isRes || !all); }).map(function(it){ return {time:minToTime(it.s), end:minToTime(it.e)}; });
  if(!all){ if(krCapDirOff(hd, ds, names[0])) return capHtml(0, 0, true); return capHtml(krCapUsed(slots, blocks), slots.length, false); }
  var duty = names.filter(function(n){ return !krCapDirOff(hd, ds, n); }).length;
  return capHtml(krCapUsed(slots, blocks), slots.length*duty, false);
}
function buildKrWeekGrid(){
  var start = getWeekStart(WEEK_OFFSET), days = [], hid = krViewHospital();
  for(var i=0;i<7;i++){ var dd = new Date(start); dd.setDate(start.getDate()+i); days.push(dd); }
  document.getElementById('wk-grid').style.gridTemplateColumns = '64px '+days.map(function(dd){ return hospitalClosedOn(hid, dateStr(dd)) ? 'minmax(0,.34fr)' : 'minmax(0,1fr)'; }).join(' '); /* 医院整天休诊：整列 1/3 宽 */
  var html = '<div class="wk-corner">'+axisHeadHtml()+'</div>', baseMin = timeToMin(hospitalHours(hid).open);
  days.forEach(function(dd){
    var ds = dateStr(dd), hclosed = hospitalClosedOn(hid, ds);
    html += '<div class="wk-head'+(sameDate(dd, TODAY_DATE)?' today':'')+'">'+(dd.getMonth()+1)+'.'+dd.getDate()+' 周'+DOW_CN[dowOfDate(ds)]+(hclosed ? '<br><span style="font-size:9px;color:var(--terracotta);font-weight:700;">休诊</span>' : krOpenTag(ds))+'</div>';
  });
  html += '<div class="wk-memo" style="font-weight:700;color:var(--slate2);">固定栏</div>';
  days.forEach(function(dd){ var ds = dateStr(dd); html += '<div class="wk-memo">'+(hospitalClosedOn(hid, ds) ? '' : krBarChips(ds))+'</div>'; });
  html += krTimeColHtml();
  days.forEach(function(dd){
    var ds = dateStr(dd);
    html += hospitalClosedOn(hid, ds) ? '<div style="height:'+(krRows().length*KR_ROW_PX)+'px;border-right:1px solid var(--border2);border-bottom:1px solid var(--border2);background:#F3F1EC;"></div>' : krDayColHtml(ds, krGridItems(ds), baseMin, hospitalClosedFrom(hid, ds), hospitalLunch(hid), hospitalClosedBefore(hid, ds));
  });
  document.getElementById('wk-grid').innerHTML = html;
}
function buildKrMonthGrid(){
  var grid = document.getElementById('cal-grid'), hid = krViewHospital();
  var first = new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth()+MONTH_OFFSET, 1), cur = new Date(first); cur.setDate(1-first.getDay());
  var html = '';
  for(var i=0;i<42;i++){
    var ds = dateStr(cur), inMonth = cur.getMonth()===first.getMonth(), closed = hospitalClosedOn(hid, ds), body = '';
    if(closed) body = '<div style="font-size:10px;font-weight:700;color:var(--terracotta);">休诊</div>';
    else {
      var its = krDayItems(ds), offs = its.filter(function(x){ return x.type==='off' && (!krViewIsAll() || (x.offKr && x.offKr.kind!=='director')); }), n = krGridItems(ds).length; /* 「全部」只数施术；单一院长数施术 + 不可预约 */
      body = (offs.length ? '<div style="font-size:10px;font-weight:700;color:#B5483E;">'+offs.map(function(x){ return shortDir(x.who); }).filter(function(v, k, a){ return a.indexOf(v)===k; }).join('、')+' OFF</div>' : '')+
        (n ? '<div style="font-size:12px;font-weight:700;color:var(--slate2);">'+n+' 项日程</div>' : '')+
        (inMonth && !closed ? '<div>'+krOpenTag(ds).replace('<br>','')+'</div>' : '');
    }
    html += '<div class="cal-cell" style="'+(closed?'background:#EFEBE4;':'')+'" onclick="openWeekOf(\''+ds+'\')" title="点击进入这一周的周视图"><span style="color:'+(inMonth?'var(--navy)':'var(--dim)')+'">'+cur.getDate()+'</span>'+body+'</div>';
    cur.setDate(cur.getDate()+1);
  }
  grid.innerHTML = html;
}
function renderResvHistory(){
  var q = ((document.getElementById('resv-search')||{}).value||'').toLowerCase();
  var colors = {'预约占位':['#E4E8ED','var(--slate2)'], '占位失效':['#EDEAE2','var(--muted)'], '已转预约':['var(--sage-bg)','var(--sage)'], '待访问':['#F2EADB','#8A7650'], '已到访':['var(--sage-bg)','var(--sage)'], '未到店':['#FBE9E7','#C1454A'], '预约取消':['#EDEAE2','var(--muted)']};
  var rows = resvHistoryRows().filter(function(r){ return !q || r.name.toLowerCase().indexOf(q)>-1; });
  document.getElementById('resv-rows').innerHTML = rows.map(function(r){
    var col = colors[r.type] || colors['待访问'];
    return '<div class="trow" style="grid-template-columns:1.4fr 1fr 1.2fr 1fr;'+(r.caseId?'cursor:pointer;':'')+'"'+(r.caseId?' onclick="openCaseDetail(\''+r.caseId+'\')"':'')+'><span style="font-size:13px;">'+r.name+'</span><span style="font-size:12px;">'+(r.caseNo||'-')+'</span><span style="font-size:12px;">'+r.date+' '+r.time+'</span><span><span class="status-pill" style="background:'+col[0]+';color:'+col[1]+';">'+r.type+'</span></span></div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);padding:14px 2px;">没有匹配的记录</div>';
}

var CAL_WEEK_FULL = false, CAL_ANCHOR = null;

function openWeekOf(ds){ CAL_WEEK_FULL = true; CAL_ANCHOR = new Date(ds+'T00:00:00'); WEEK_OFFSET = 0; setCalMode('week'); }

function buildWeekGrid(){
  if(CAL_VIEW==='kr'){ buildKrWeekGrid(); return; }
  var start = getWeekStart(WEEK_OFFSET);
  var days = [];
  for(var i=0;i<7;i++){ var dd=new Date(start); dd.setDate(start.getDate()+i); days.push(dd); }
  var evs = calendarEvents().filter(function(e){ return !calEvHidden(e); }); /* 预约取消的事件从日历消失 */
  /* 休诊日整列宽度 = 其他天的 1/3（灰色、不能点、不能新增预约；列头仍显示日期 + 休诊）；月视图不改 */
  document.getElementById('wk-grid').style.gridTemplateColumns = '64px '+days.map(function(dd){ return isRescheduleDateDisabled(dd) ? 'minmax(0,.34fr)' : 'minmax(0,1fr)'; }).join(' ');
  var html = '<div class="wk-corner">'+axisHeadHtml()+'</div>';
  days.forEach(function(dd,i){
    var isToday = sameDate(dd, TODAY_DATE);
    html += '<div class="wk-head'+(isToday?' today':'')+'">'+(dd.getMonth()+1)+'.'+dd.getDate()+' 周'+DOW_CN[dowOfDate(dateStr(dd))]+(isRescheduleDateDisabled(dd)?'<br><span style="font-size:9px;color:var(--terracotta);font-weight:700;">休诊</span>':inCapHeadHtml(dateStr(dd)))+'</div>';
  });
  html += '<div class="wk-memo" style="font-weight:700;color:var(--slate2);">固定栏</div>';
  days.forEach(function(dd){ html += '<div class="wk-memo">'+memoCellHtml(dateStr(dd))+'</div>'; });
  var lunchBarDone = false;
  calHours().forEach(function(hr){ /* CMD-1014-01：开关开着时时间范围 = 营业时间前后各 2 小时 */
    var rowEvs = evs.filter(function(e){ return slotOf(e.time)===hr; });
    if(slotIsLunch(hr)){
      /* 午休：一条窄横条（读诊所设定）；午休时段里本周有日程的才另外显示那一行，没有就不占高度 */
      if(!lunchBarDone){ html += '<div class="wk-lunchbar">午休 '+CLINIC_SETTINGS.lunchFrom+'～'+CLINIC_SETTINGS.lunchTo+'</div>'; lunchBarDone = true; }
      if(!rowEvs.some(function(e){ return days.some(function(dd){ return dateStr(dd)===e.date; }); })) return;
    }
    var nowD = demoNow(), nowSlot = pad2(nowD.getHours())+':'+(nowD.getMinutes()>=30?'30':'00');
    html += '<div class="wk-time'+(rowEvs.length?'':' empty')+(hr===nowSlot?' wk-now':'')+'"><b style="color:var(--slate);">印 '+hr+'</b><span class="kr">韩 '+krTimeOf(hr)+'</span></div>';
    for(var d=0; d<7; d++){
      var ds = dateStr(days[d]);
      var cell = rowEvs.filter(function(e){ return e.date===ds; }).sort(function(a,b){ return a.time.localeCompare(b.time) || ((a.kind==='placeholder')-(b.kind==='placeholder')) || String(a.name).localeCompare(String(b.name)); }); /* 同一时段：按时间，占位排在预约后面，再按名字 */
      var chips = cell.slice(0, 3).map(eventChipHtml).join('') + (cell.length > 3 ? '<div class="wk-more" onclick="event.stopPropagation();openSlotList(\''+ds+'\',\''+hr+'\')">+'+(cell.length-3)+' 更多</div>' : ''); /* 超过 3 个：前 3 个 + "+N 更多" */
      var why = slotBlockReason(ds, hr); /* 和预约修改、占位、预约页同一套规则：past 已过 / full 额满 / closed 休诊 / lunch 午休 */
      var pastSlot = why==='past', closedDay = why==='closed', fullSlot = why==='full';
      var slotClick = why ? ((newCalOn() && calOffHoursOk(ds,hr)) ? ' onclick="calOffHoursAdd(\''+ds+'\',\''+hr+'\')" title="营业时间外：点击代约（会再确认一次）"' : '') : ' onclick="openAddSlotModal(\''+ds+'\',\''+hr+'\')" title="点击预约这个空档"';
      var isNow = (ds===dateStr(nowD) && hr===nowSlot); /* 现在的时间点用彩色外框标出当前时段 */
      var fullTag = fullSlot ? '<div style="font-size:10px;color:var(--muted);text-align:right;">已满</div>' : '';
      html += '<div class="wk-cell'+(why?'':' wk-cell-open')+(pastSlot?' wk-past':'')+((why==='lunch'||closedDay)?' wk-lunch':'')+(why==='outside'?' wk-outside':'')+(fullSlot?' wk-full':'')+(isNow?' wk-now':'')+(sameDate(days[d], TODAY_DATE)?' wk-tcol':'')+'"'+slotClick+'>'+chips+fullTag+'</div>';
    }
  });
  document.getElementById('wk-grid').innerHTML = html;
}

function buildMonthGrid(){
  if(CAL_VIEW==='kr'){ buildKrMonthGrid(); return; }
  var grid = document.getElementById('cal-grid');
  var evs = calendarEvents().filter(function(e){ return !calEvHidden(e); });
  var first = new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth()+MONTH_OFFSET, 1);
  var startPad = first.getDay(); /* 周日=0，月历从周日开始 */
  var html = '';
  var cur = new Date(first); cur.setDate(1-startPad);
  for(var i=0;i<42;i++){
    var ds = dateStr(cur), inMonth = cur.getMonth()===first.getMonth();
    var n = evs.filter(function(e){ return e.date===ds; }).length;
    var offs = memosOn(ds).filter(function(m){ return m.type==='OFF'; }).map(function(m){ return m.person; });
    var extra = (offs.length ? '<div style="font-size:10px;font-weight:700;color:var(--terracotta);">'+offs.join('、')+' OFF</div>' : '')+(inMonth && inCapHeadHtml(ds) ? '<div>'+inCapHeadHtml(ds).replace('<br>','')+'</div>' : '')+(n ? '<div style="font-size:12px;font-weight:700;color:var(--slate2);">'+n+' 项日程</div>' : '');
    html += '<div class="cal-cell" onclick="openWeekOf(\''+ds+'\')" title="点击进入这一周的周视图"><span style="color:'+(inMonth?'var(--navy)':'var(--dim)')+'">'+cur.getDate()+'</span>'+extra+'</div>';
    cur.setDate(cur.getDate()+1);
  }
  grid.innerHTML = html;
}

function buildDayGrid(){
  if(newCalOn()){ buildDayGridNew(); return; } /* CMD-1014-01：日视图改整天时间格 */
  var d = new Date(TODAY_DATE); d.setDate(d.getDate()+DAY_OFFSET);
  var ds = dateStr(d);
  var evs = calendarEvents().filter(function(e){ return e.date===ds && !calEvHidden(e); });
  var html = '<div style="font-size:13px;font-weight:700;margin-bottom:10px;">'+(d.getMonth()+1)+'月'+d.getDate()+'日 周'+DOW_CN[dowOfDate(ds)]+'</div>';
  if(evs.length===0){ html += '<div style="font-size:12px;color:var(--muted);">当日暂无排期</div>'; }
  else{
    evs.slice().sort(function(a,b){return a.time.localeCompare(b.time);}).forEach(function(e){
      html += '<div class="schedule-row" onclick="'+(e.caseId ? 'openCaseDetail(\''+e.caseId+'\')' : 'void(0)')+'"><span class="schedule-time">'+e.time+'</span><span class="dotmark" style="background:'+TYPE_COLOR[e.kind]+';"></span><span style="font-size:13px;">'+e.name+' · '+TYPE_LABEL[e.kind]+(e.purpose?' · '+e.purpose:'')+'</span></div>';
    });
  }
  document.getElementById('day-detail').innerHTML = html;
}

function setCalMode(mode){
  if(CAL_VIEW==='kr' && mode==='day') mode = 'week'; /* KR 医院日程没有日视图 */
  CAL_MODE = mode;
  ['month','week','day'].forEach(function(v){
    document.getElementById('cal-sw-'+v).classList.toggle('active', v===mode);
    document.getElementById('cal-'+v+'-view').style.display = v===mode ? 'block' : 'none';
  });
  renderCalendar();
}

/* 月视图：原［今天］位置显示当前月份（「10月」），‹ → 上个月、› → 下个月；点月份弹出选年 + 月（内含［回到今天］）；周 / 日视图仍是［今天］ */
function monthViewDate(){ return new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth()+MONTH_OFFSET, 1); }
var CAL_NAV_ORIG = null;
function updateCalNavLabel(){
  /* CMD-1014-18 三·5：日 / 周 / 月工具列同一样式 ‹ 标题 › ［今天］。日「2026-10-14 周三（今天）」，周「10-12 ～ 10-18（本周）」，月「2026 年 10 月（本月）」（点月份弹选年月）；往外一周 / 一月只写日期 */
  var nv = document.querySelector('.cal-nav'); if(!nv) return;
  var title, clickAttr = '';
  if(CAL_MODE==='day'){
    var dd = new Date(TODAY_DATE); dd.setDate(dd.getDate()+DAY_OFFSET); var dsx = dateStr(dd), rl = relDayLabel(DAY_OFFSET);
    title = dsx+' 周'+DOW_CN[dowOfDate(dsx)]+(rl ? '（'+rl+'）' : '');
  } else if(CAL_MODE==='week'){
    var st = getWeekStart(WEEK_OFFSET), en = new Date(st); en.setDate(st.getDate()+6), stS = dateStr(st), enS = dateStr(en), wl = relWeekLabel(stS, dateStr(TODAY_DATE));
    title = stS.slice(5)+' ～ '+enS.slice(5)+(wl ? '（'+wl+'）' : '');
  } else {
    var md = monthViewDate(), ym = md.getFullYear()+'-'+pad2(md.getMonth()+1), ml = relMonthLabel(ym, dateStr(TODAY_DATE).slice(0,7));
    title = md.getFullYear()+' 年 '+(md.getMonth()+1)+' 月'+(ml ? '（'+ml+'）' : ''); clickAttr = ' onclick="openMonthPicker()" title="选择年月" style="font-size:13px;white-space:nowrap;cursor:pointer;"';
  }
  nv.innerHTML = '<button class="cal-nav-btn" onclick="calPrev()">‹</button><b class="cal-day-title"'+(clickAttr || ' style="font-size:13px;white-space:nowrap;"')+'>'+title+'</b><button class="cal-nav-btn" onclick="calNext()">›</button><button class="cal-nav-btn cal-nav-today" onclick="calToday()">今天</button>';
}
function openMonthPicker(){
  var ov = document.getElementById('cal-month-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'cal-month-overlay'; ov.className = 'modal-overlay'; ov.onclick = function(e){ if(e.target===ov) ov.classList.remove('open'); }; document.body.appendChild(ov); }
  var cur = monthViewDate(), y0 = TODAY_DATE.getFullYear();
  ov.innerHTML = '<div class="modal-box" style="width:340px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b>选择年月</b><span style="cursor:pointer;" onclick="document.getElementById(\'cal-month-overlay\').classList.remove(\'open\')">✕</span></div>'+
    '<select id="cal-pick-year" onchange="renderMonthPickerMonths()" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">'+[y0-2,y0-1,y0,y0+1,y0+2].map(function(y){ return '<option'+(y===cur.getFullYear()?' selected':'')+'>'+y+'</option>'; }).join('')+'</select>'+
    '<div id="cal-pick-months" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;"></div>'+
    '<button class="btn-outline" style="width:100%;margin-top:12px;" onclick="calToday();document.getElementById(\'cal-month-overlay\').classList.remove(\'open\')">回到今天</button></div>';
  renderMonthPickerMonths(); ov.classList.add('open');
}
function renderMonthPickerMonths(){
  var y = parseInt(document.getElementById('cal-pick-year').value, 10), cur = monthViewDate(), html = '';
  for(var m = 0; m < 12; m++) html += '<button class="'+((y===cur.getFullYear() && m===cur.getMonth()) ? 'btn-primary' : 'btn-outline')+'" style="padding:8px 0;" onclick="pickMonth('+y+','+m+')">'+(m+1)+'月</button>';
  document.getElementById('cal-pick-months').innerHTML = html;
}
function pickMonth(y, m){ MONTH_OFFSET = (y-TODAY_DATE.getFullYear())*12 + (m-TODAY_DATE.getMonth()); document.getElementById('cal-month-overlay').classList.remove('open'); renderCalendar(); }
function renderCalendar(){
  updateCalNavLabel();
  renderTodayOff();
  if(CAL_MODE==='week') buildWeekGrid();
  else if(CAL_MODE==='month') buildMonthGrid();
  else buildDayGrid();
  if(typeof todoAfterCalendar==='function') todoAfterCalendar(); /* CMD-1013-17：待办栏 + 现在时间线（开关关闭时什么都不做） */
}

var ADD_SLOT_CONTEXT = null;

var ADD_SLOT_MODE = 'existing';

function openAddSlotModal(date, time){
  ADD_SLOT_CONTEXT = {date:date, time:time};
  ADD_SLOT_MODE = 'existing';
  document.getElementById('add-slot-title').textContent = '预约空档 · '+dateLabel(date)+' '+time;
  renderAddSlotBody();
  document.getElementById('add-slot-overlay').classList.add('open');
}

function closeAddSlotModal(){ document.getElementById('add-slot-overlay').classList.remove('open'); }

function renderAddSlotBody(){
  var modeTabs = '<div style="display:flex;gap:8px;margin-bottom:16px;">'+
    '<span class="chip'+(ADD_SLOT_MODE==='existing'?' active':'')+'" onclick="setAddSlotMode(\'existing\')">老客人</span>'+
    '<span class="chip'+(ADD_SLOT_MODE==='new'?' active':'')+'" onclick="setAddSlotMode(\'new\')">新客人</span>'+
    '</div>';
  var body;
  if(ADD_SLOT_MODE==='existing'){
    var clientOptions = CLIENTS.map(function(c){ return '<option>'+c.name+'</option>'; }).join('');
    body = '<div class="field" style="margin-bottom:12px;"><label>选择客人</label><select id="add-slot-client">'+clientOptions+'</select></div>'+
      purposeSelectHtml('add-slot-purpose')+
      '<div style="font-size:11px;color:var(--muted);margin-bottom:14px;">老客人不经过预约占位，确认后直接生成 Case ID，进入"待访问"</div>'+
      '<button class="btn-primary" style="width:100%;" onclick="confirmAddSlotExisting()">确认预约</button>';
  } else {
    var link = bookingUrl({ph:'ph'+PLACEHOLDER_SEQ});
    body = '<div class="field" style="margin-bottom:12px;"><label>客人手机号</label><input type="text" id="add-slot-phone" placeholder="+62 812-xxxx-xxxx"></div>'+
      purposeSelectHtml('add-slot-purpose')+
      '<div class="field" style="margin-bottom:8px;"><label>短信内容</label><textarea id="add-slot-sms" rows="3" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;">'+DEFAULT_SMS_TEMPLATE+'</textarea></div>'+
      '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">链接自动插入，不可删除：<b>'+link+'</b></div>'+
      '<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--slate2);margin-bottom:14px;"><input type="checkbox" id="add-slot-save-default"> 保存为默认模板（只勾选才会覆盖默认，不勾只对本次生效）</label>'+
      '<div style="font-size:11px;color:var(--muted);margin-bottom:14px;">发送后所选时段出现'+CLINIC_SETTINGS.holdMinutes+'分钟"预约占位"，客户在链接里填写完成后转为正式预约</div>'+
      '<button class="btn-primary" style="width:100%;" onclick="confirmAddSlotNew(\''+link+'\')">发送链接</button>'+
      '<button class="btn-ghost" style="width:100%;margin-top:8px;" onclick="openGuestFormFromSlot()">演示：客人到店自己填资料（打开预约页，时间 = 现在）</button>';
  }
  document.getElementById('add-slot-body').innerHTML = modeTabs + body;
}

function confirmAddSlotExisting(){
  var name = document.getElementById('add-slot-client').value;
  var purpose = document.getElementById('add-slot-purpose').value;
  closeAddSlotModal();
  createReservationCase(name, null, ADD_SLOT_CONTEXT.date, ADD_SLOT_CONTEXT.time, null, purpose);
  renderCalendar();
  showToast('预约已生成', name+' · '+dateLabel(ADD_SLOT_CONTEXT.date)+' '+ADD_SLOT_CONTEXT.time+'，已生成 Case ID', null);
}

function confirmAddSlotNew(link){
  var phone = document.getElementById('add-slot-phone').value.trim();
  if(!phone){ alert('请输入手机号'); return; }
  var smsBody = document.getElementById('add-slot-sms').value;
  var purpose = document.getElementById('add-slot-purpose').value;
  if(document.getElementById('add-slot-save-default').checked && canDo('clinic')){ CLINIC_SETTINGS.sms.link = smsBody; applyClinicSettings(); } /* 默认模板属于诊所设定：只有管理者能改 */
  var phId = 'ph'+(PLACEHOLDER_SEQ++); link = bookingUrl({ph:phId}); /* 真实的客户自助预约页链接，超时后仍有效 */
  var ph = {id:phId, date:ADD_SLOT_CONTEXT.date, time:ADD_SLOT_CONTEXT.time, phone:phone, link:link,
    smsText:smsBody, purpose:purpose, expiresAt:Date.now()+holdMs()};
  logSms('link', phone, smsBody+' '+link, null);
  RESERVATION_PLACEHOLDERS.push(ph);
  closeAddSlotModal();
  renderCalendar();
  showToast('链接已发送', phone+' · '+dateLabel(ph.date)+' '+ph.time+' 已占位（'+CLINIC_SETTINGS.holdMinutes+'分钟内有效）', function(){ openPlaceholderModal(ph.id); });
}

var PLACEHOLDER_MODAL_ID = null;

/* 客户在链接里改选其他空闲时间：原占位释放，改占新时间（周四休诊不可选；不占用已有事件/占位的格子） */
function simulateSlotChange(id){
  var p = RESERVATION_PLACEHOLDERS.filter(function(x){ return x.id===id; })[0]; if(!p) return;
  var ws = new Date(p.date+'T00:00:00'); ws.setDate(ws.getDate() - dowOfDate(p.date));
  var evs = calendarEvents();
  for(var d=0; d<7; d++){
    var dd = new Date(ws); dd.setDate(ws.getDate()+d); var ds = dateStr(dd);
    if(isRescheduleDateDisabled(dd)) continue; /* 休诊日读诊所设定 */
    if(new Date(ds+'T23:59:00') < demoNow()) continue;
    for(var i=0;i<WK_HOURS.length;i++){
      var hr = WK_HOURS[i];
      if(ds===p.date && hr===p.time) continue;
      var busy = evs.some(function(e){ return e.date===ds && slotOf(e.time)===hr && e.phId!==id; });
      if(!busy && !slotBlockReason(ds, hr, id)){
        var old = dateLabel(p.date)+' '+p.time;
        p.date = ds; p.time = hr;
        closeAddSlotModal(); buildWeekGrid();
        showToast('占位已改到新时间', old+' 已释放，改占 '+dateLabel(p.date)+' '+p.time, null);
        return;
      }
    }
  }
  alert('本周没有空闲时段');
}

function openPlaceholderModal(id){
  var p = RESERVATION_PLACEHOLDERS.filter(function(x){ return x.id===id; })[0]; if(!p) return;
  PLACEHOLDER_MODAL_ID = id;
  document.getElementById('add-slot-title').textContent = '预约占位 · '+dateLabel(p.date)+' '+p.time;
  document.getElementById('add-slot-body').innerHTML =
    '<div class="case-field-row"><span class="fk">手机号</span><span style="flex-grow:1;font-size:13px;">'+p.phone+'</span></div>'+
    '<div class="case-field-row"><span class="fk">来访目的</span><span style="flex-grow:1;font-size:13px;">'+(p.purpose||'')+'</span></div>'+
    '<div class="case-field-row"><span class="fk">倒计时</span><span style="flex-grow:1;font-size:13px;" data-ph-countdown="'+p.id+'">'+placeholderCountdownText(p)+'</span></div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">'+
    '<button class="btn-outline" onclick="resendPlaceholderLink(\''+p.id+'\')">再次发送链接（倒计时重新计时）</button>'+
    '<button class="btn-outline" onclick="cancelPlaceholder(\''+p.id+'\')">取消占位</button>'+
    '<button class="btn-ghost" onclick="simulateCustomerFilledPlaceholder(\''+p.id+'\')">演示：打开客人的预约链接（新标签页）</button>'+
    '<button class="btn-ghost" onclick="simulateSlotChange(\''+p.id+'\')">演示：客户在链接里改选其他空闲时间</button>'+
    '</div>';
  document.getElementById('add-slot-overlay').classList.add('open');
}

function resendPlaceholderLink(id){
  var p = RESERVATION_PLACEHOLDERS.filter(function(x){ return x.id===id; })[0]; if(!p) return;
  p.expiresAt = Date.now()+holdMs(); p.warned = false;
  showToast('链接已重新发送', p.phone+' 倒计时已重置', null);
  openPlaceholderModal(id);
}

/* 客人自己填资料 = 客户自助预约页 booking.html（2026-10-06·B5，取代原来 in.html 里临时的表单）：
   到店自己填 → 新标签页 ?walkin=1（时间 = 现在，提交后在这里点［已到店］）；预约链接 → ?ph=占位ID（客人手机里打开的就是这个页面）。
   客人提交后数据存进共享存档，这个页面不用刷新就会同步（日历、预约历史、铃铛、通知） */
function openBookingPage(params){ window.open(bookingUrl(params), '_blank'); }
function openGuestFormFromSlot(){
  var phoneEl = document.getElementById('add-slot-phone'), purEl = document.getElementById('add-slot-purpose'), p = {walkin:1};
  if(phoneEl && phoneEl.value.trim()) p.phone = phoneEl.value.trim();
  if(purEl) p.purpose = purEl.value;
  openBookingPage(p);
}
function simulateCustomerFilledPlaceholder(id){ openBookingPage({ph:id}); }

function buildClients(){ renderClientRows(); }

function renderClientRows(){
  var q = ((document.getElementById('client-search')||{}).value||'').trim().toLowerCase();
  document.getElementById('client-rows').innerHTML = CLIENTS.filter(function(c){ return !q || c.name.toLowerCase().indexOf(q)>-1 || normPhoneKey(c.phone).indexOf(normPhoneKey(q)||'#')>-1; }).map(function(c){
    var s = clientCaseStatus(c), nm = c.name.replace(/'/g,"\\'");
    var on = CASE_ITEMS.filter(function(x){ return x.name===c.name && !isEnded(x); }), dash = '<span style="font-size:12px;color:var(--muted);">—</span>'; /* CMD-1014-09：阶段 + 进程，只显示进行中的案件，没有就「—」 */
    return '<div class="trow" style="grid-template-columns:1.4fr 0.9fr 1.3fr 1.3fr 0.9fr 0.9fr auto;"><b style="font-size:13px;cursor:pointer;" onclick="openClientDetail(\''+nm+'\',\'in-clients\')">'+c.name+'</b>'+
      '<span>'+(on.length ? on.map(function(x){ var si = caseStageInfo(x); return '<div style="margin-bottom:3px;"><span class="status-pill" style="background:'+si.bg+';color:'+si.fg+';white-space:nowrap;">'+si.stage+'</span></div>'; }).join('') : dash)+'</span>'+
      '<span style="font-size:12px;">'+(on.length ? on.map(function(x){ return '<div style="margin-bottom:3px;min-height:22px;display:flex;align-items:center;">'+(caseStageInfo(x).proc||'—')+'</div>'; }).join('') : dash)+'</span>'+
      '<span>'+s.finance+'</span>'+
      '<span style="font-size:12px;">'+c.createdBy+'</span><span style="font-size:12px;color:var(--muted);">'+c.updated+'</span>'+
      '<a href="#" onclick="openClientDetail(\''+nm+'\',\'in-clients\');return false;" style="font-size:12px;font-weight:700;">查看 →</a></div>';
  }).join('');
}


/* ================= client detail ================= */
var DETAIL_FROM = 'in-clients';

/* ---- 客户详情"基础信息"：读真实客户档案（CLIENTS），［修改］存回客户并记入客户 Timeline（2026-10-06·K） ---- */
var CLIENT_EDIT = null; /* {name, field} */
function clientDobText(c){ return c.dob ? c.dob.replace(/^(\d{4})-(\d\d)-(\d\d)$/, '$1年$2月$3日') : '—'; }
function renderClientProfile(name){
  var el = document.getElementById('detail-profile'); if(!el) return;
  var c = clientByName(name);
  if(!c){ el.innerHTML = '<div style="padding:14px 0;font-size:12px;color:var(--muted);">没有找到这位客户的档案</div>'; return; }
  var nm = String(name).replace(/'/g, "\\'");
  var row = function(k, v, field, extra){
    return '<div class="field-row"><span class="fk">'+k+'</span><span class="fv"'+(extra?' style="font-weight:400;"':'')+'>'+v+'</span><span class="fa">'+
      (field ? '<a href="#" class="info-link" onclick="openClientEdit(\''+nm+'\',\''+field+'\');return false;">修改</a>' : '')+'</span></div>'; };
  var cons = (c.consents||[]).slice(-1)[0];
  var consHtml = cons ? '已签署<span class="sub">个人资料收集同意 + 健康资料处理同意 · 同意书 '+aEscC(cons.version)+' · '+aEscC(cons.ts)+' · '+aEscC(cons.source)+'</span>' : '<span style="color:var(--muted);">未登记</span><span class="sub">到店后由室长当面签署正式同意书</span>';
  el.innerHTML = row('名 / 姓', aEscC(c.name)+'<span class="sub">名（必填）+ 姓（选填），显示“名 姓”</span>', 'name')+row('特别备注', aEscC(c.note||'无'), 'note', 1)+
    row('性别 / 出生日期', aEscC(c.gender)+' · '+clientDobText(c), 'gender')+row('基础病史和过敏史', aEscC(c.history||'无'), 'history', 1)+
    row('护照信息', aEscC(c.passport.text)+(c.passport.date?'<span class="sub">'+aEscC(c.passport.date)+'</span>':''), 'passport')+
    row('联系方式', aEscC(c.phone||'—')+'<span class="sub">手机号（一个手机号对应一位客人）</span>', 'phone')+
    '<div class="field-row"><span class="fk">隐私协议</span><span class="fv">'+consHtml+'</span><span class="fa"></span></div>';
}
function aEscC(s){ return String(s===undefined||s===null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
var CLIENT_FIELD_DEF = {
  name:{label:'名 / 姓', kind:'name2'}, note:{label:'特别备注', kind:'area'}, history:{label:'基础病史和过敏史', kind:'area'},
  gender:{label:'性别 / 出生日期', kind:'gender'}, passport:{label:'护照信息', kind:'text'}, phone:{label:'联系方式（手机号）', kind:'text'}
};
function openClientEdit(name, field){
  var c = clientByName(name), d = CLIENT_FIELD_DEF[field]; if(!c || !d) return;
  CLIENT_EDIT = {name:name, field:field};
  var ov = document.getElementById('client-edit-overlay');
  if(!ov){ ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'client-edit-overlay'; ov.style.zIndex = 90; ov.onclick = function(e){ if(e.target===ov) closeClientEdit(); }; document.body.appendChild(ov); }
  var inp = 'width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;';
  var body = d.kind==='area' ? '<textarea id="ce-v" rows="3" style="'+inp+'">'+aEscC(c[field])+'</textarea>' :
    d.kind==='gender' ? '<div style="display:flex;gap:10px;"><select id="ce-v" style="'+inp+'width:120px;"><option'+(c.gender==='女'?' selected':'')+'>女</option><option'+(c.gender==='男'?' selected':'')+'>男</option></select><input id="ce-v2" type="date" value="'+aEscC(c.dob)+'" style="'+inp+'"></div>' :
    d.kind==='name2' ? '<div style="display:flex;gap:10px;"><input id="ce-fn" type="text" placeholder="名（必填）" value="'+aEscC(c.firstName!==undefined ? c.firstName : c.name)+'" style="'+inp+'"><input id="ce-ln" type="text" placeholder="姓（选填）" value="'+aEscC(c.lastName||'')+'" style="'+inp+'"></div>' :
    field==='phone' ? phoneInputHtml('ce-ph', c.phone) :
    '<input id="ce-v" type="text" value="'+aEscC(field==='passport' ? c.passport.text : c[field])+'" style="'+inp+'">';
  ov.innerHTML = '<div class="modal-box" style="width:420px;"><div style="font-size:15px;font-weight:700;margin-bottom:12px;">修改「'+d.label+'」</div>'+body+
    '<div id="ce-err" class="error-text" style="display:none;margin-top:8px;"></div><div style="font-size:11px;color:var(--muted);margin-top:8px;">保存后写回客户档案，并记入客户 Timeline（操作人：'+aEscC(accountLabel(currentAccountId()))+'）。</div>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;"><button class="btn-outline" onclick="closeClientEdit()">取消</button><button class="btn-primary" onclick="saveClientEdit()">保存</button></div></div>';
  ov.classList.add('open');
}
function closeClientEdit(){ var ov = document.getElementById('client-edit-overlay'); if(ov) ov.classList.remove('open'); CLIENT_EDIT = null; }
function saveClientEdit(){
  var x = CLIENT_EDIT; if(!x) return;
  var c = clientByName(x.name), d = CLIENT_FIELD_DEF[x.field]; if(!c) return;
  var v = x.field==='phone' ? phoneInputGet('ce-ph') : x.field==='name' ? joinName((document.getElementById('ce-fn')||{}).value, (document.getElementById('ce-ln')||{}).value) : (document.getElementById('ce-v').value||'').trim(), err = '', oldTxt = '', newTxt = '';
  var fail = function(m){ var e = document.getElementById('ce-err'); e.textContent = m; e.style.display = 'block'; };
  if(x.field==='name'){
    if(!(document.getElementById('ce-fn')||{}).value.trim()) return fail('名不能为空（姓可以留空）');
    if(v!==c.name && clientByName(v)) return fail('已有同名的客户档案');
    oldTxt = c.name; newTxt = v;
    c.firstName = document.getElementById('ce-fn').value.trim(); c.lastName = document.getElementById('ce-ln').value.trim();
    if(v!==c.name){
      CASE_ITEMS.forEach(function(cs){ if(cs.name===c.name) cs.name = v; });
      if(CLIENT_HOLDINGS[c.name]){ CLIENT_HOLDINGS[v] = CLIENT_HOLDINGS[c.name]; delete CLIENT_HOLDINGS[c.name]; }
      c.name = v; x.name = v;
      document.getElementById('detail-name').textContent = v; HOLD_CARD_NAME = v;
    }
  } else if(x.field==='gender'){
    var dob = document.getElementById('ce-v2').value;
    oldTxt = c.gender+' · '+(c.dob||'—'); newTxt = v+' · '+(dob||'—'); c.gender = v; c.dob = dob;
  } else if(x.field==='passport'){
    oldTxt = c.passport.text; newTxt = v||'未登记'; c.passport.text = newTxt; c.passport.date = dateStr(demoNow());
  } else if(x.field==='phone'){
    if(!v) return fail('手机号不能为空');
    var other = clientByPhone(v); if(other && other.id!==c.id) return fail('这个手机号已登记为 '+other.name+'（一个手机号对应一位客人）');
    oldTxt = c.phone||'—'; newTxt = v; c.phone = v;
  } else { oldTxt = c[x.field]||'无'; newTxt = v||'无'; c[x.field] = newTxt; }
  if(oldTxt===newTxt){ closeClientEdit(); return; }
  c.timeline.push({stage:'基础信息修改', actor:ME_NAME, actorId:currentAccountId(), action:'修改「'+d.label+'」：'+oldTxt+' → '+newTxt, dt:nowFullDt(), kind:'plain'});
  c.updated = '刚刚';
  closeClientEdit(); renderClientProfile(c.name); renderClientTimeline(c.name); renderClientRows();
  try{ renderClientCases(c.name); }catch(e){}
}

/* 客户级 Timeline 只记：建档 / 基础信息修改（含修正）/ 案件开始 / 案件结案（进行中显示"进行中"） */
function renderClientTimeline(name){
  var cl = clientByName(name);
  var log = (cl ? cl.timeline : []).slice();
  CASE_ITEMS.filter(function(c){ return c.name===name; }).forEach(function(c){
    var first = (c.logEntries&&c.logEntries[0]) ? c.logEntries[0].dt : D(0)+' 09:00';
    log.push({stage:'案件开始', actor:'系统', action:'Case 开始 · '+c.caseNo, dt:first, kind:'case', caseId:c.id});
    if(isEnded(c)){
      var last = (c.logEntries&&c.logEntries.length) ? c.logEntries[c.logEntries.length-1].dt : first;
      log.push({stage:'案件结案', actor:'系统', action:'Case 结案 · '+c.caseNo+'（'+terminalBadge(c)[2]+'）', dt:last, kind:'case', caseId:c.id});
    } else {
      log.push({stage:'案件进行中', actor:'系统', action:'Case '+c.caseNo+' · 进行中', dt:first, kind:'case', caseId:c.id});
    }
  });
  log.sort(function(a,b){ return a.dt<b.dt ? 1 : -1; });
  document.getElementById('detail-log').innerHTML = log.map(logLine).join('');
}

function openClientDetail(name, from){
  DETAIL_FROM = from || 'in-clients';
  document.getElementById('detail-name').textContent = name;
  renderClientProfile(name);
  renderClientCases(name);
  renderClientHoldings(name);
  renderProjectHistory(name);
  buildHistoryList(name);
  renderClientTimeline(name);
  nav('in-clientdetail');
}

/* 持有项目卡片（HoldingBatch，总览第10节，2026-09-30）：按项目汇总显示，每个项目可展开看到各个批次；
   批次状态：未使用 / 部分使用 / 已用完 / 已取消（已退款）；2026-10-02 改：只要批次还有剩余次数（未使用、部分使用）就显示「退款」（金额手填可为0，原因必填，退款后该批次作废、剩余次数归零）；已用完的没有退款按钮；
   项目名、批次信息和退款按钮分开排版（按钮不再和文字黏在一起、项目名不折行） */
var HOLD_CARD_NAME = null, HOLD_EXPAND = {};

function toggleHoldExpand(gi){ HOLD_EXPAND[gi] = !HOLD_EXPAND[gi]; renderClientHoldings(HOLD_CARD_NAME); }

function openHoldingRefundByIdx(gi, bi){
  var h = holdingsAllSorted(HOLD_CARD_NAME).filter(function(x){ return holdingRemaining(x)>0; })[gi]; if(!h) return;
  openHoldingRefundModal(HOLD_CARD_NAME, h.itemName, bi);
}

function renderClientHoldings(name){
  HOLD_CARD_NAME = name;
  var block = document.getElementById('detail-holdings-block');
  var el = document.getElementById('detail-holdings');
  if(!block || !el) return;
  var all = holdingsAllSorted(name).filter(function(h){ return holdingRemaining(h)>0; }); /* 项目层只列剩余>0；全部用完/已退款的项目去"本院项目记录"看 */
  if(!all.length){ block.style.display = 'none'; el.innerHTML=''; return; }
  block.style.display = 'block';
  el.innerHTML = all.map(function(h, gi){
    var remaining = holdingRemaining(h), total = holdingTotal(h);
    var tags = (h.category==='术后管理'?' <span class="status-pill" style="background:var(--terracotta-bg);color:var(--terracotta);font-size:10px;">术后管理</span>':'')+
      (h.krCollected?' <span class="status-pill" style="background:var(--sage-bg);color:var(--sage);font-size:10px;">KR代收</span>':'');
    var dueMax = 0; if(h.category==='术后管理') h.batches.forEach(function(b0){ if(b0.voided || b0.refund || b0.bought-b0.used<=0) return; var sg0 = pcBatchSuggest(b0); if(sg0) dueMax = Math.max(dueMax, pcDaysLate(sg0.date)); });
    if(dueMax>0) tags += ' <span class="status-pill" style="background:#FBE3E1;color:#C1454A;font-size:10px;">已过建议日期 '+dueMax+' 天</span>';
    var open = !!HOLD_EXPAND[gi];
    var batchRows = open ? h.batches.map(function(b,bi){
      var st = batchStatusOfHolding(b), col = HOLD_BATCH_COLORS[st];
      var action = b.pkg ? '<span style="font-size:11px;color:var(--sage);white-space:nowrap;">套餐内含</span>' : (b.pkgPaid ? '<span style="font-size:11px;color:#C1454A;white-space:nowrap;">套餐 · 不可退款</span>' : (b.comp ? '<span style="font-size:11px;color:#8F6F0C;white-space:nowrap;">置换 · 不可退款</span>' : b.service ? '<span style="font-size:11px;color:var(--blue);white-space:nowrap;">서비스 · 不可退款</span>' : (st==='未使用' || st==='部分使用')
        ? ''
        : (b.refund ? '<span style="font-size:11px;color:var(--terracotta);white-space:nowrap;">'+'已退款 '+formatCurrency(b.refund.amount,'IDR')+'</span>' : '')));
      return '<div style="display:flex;align-items:center;gap:12px;padding:8px 0 8px 14px;border-top:1px dashed var(--border2);">'+
        '<div style="flex:1;min-width:0;font-size:12px;color:var(--slate2);line-height:1.6;">'+b.date+' · '+(b.pkg ? '套餐内含 · ' : '')+(b.pkgPaid ? '套餐「'+(b.pkgName||'')+'」· ' : '')+(b.comp ? '置换（赴韩定金转本地）· ' : '')+(b.service ? '서비스（赠送）· ' : '')+(b.promo ? '本月活动价 · ' : '')+'购买案件 '+caseNoLabel(b.caseId)+'<br>已用 '+b.used+'/'+b.bought+(b.schedule?'　进行时间：'+b.schedule:'')+'</div>'+
        '<span class="status-pill" style="background:'+col[0]+';color:'+col[1]+';white-space:nowrap;">'+st+'</span>'+
        '<span style="min-width:84px;text-align:right;">'+action+'</span></div>';
    }).join('') : '';
    return '<div style="padding:10px 0;border-bottom:1px solid var(--border2);">'+
      '<div style="display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="toggleHoldExpand('+gi+')">'+
      '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;">'+h.itemName+tags+'</span>'+
      '<span style="font-size:12px;color:var(--slate2);white-space:nowrap;">剩余 '+remaining+' 次（共 '+total+' 次）</span>'+
      '<span style="font-size:11px;color:var(--slate);white-space:nowrap;">'+h.batches.length+' 批 '+(open?'▴':'▾')+'</span></div>'+batchRows+'</div>';
  }).join('');
}

var HOLDING_REFUND_CTX = null;

function openHoldingRefundModal(name, itemName, batchIdx){
  var h = (CLIENT_HOLDINGS[name]||[]).filter(function(x){ return x.itemName===itemName; })[0]; if(!h) return;
  var b = h.batches[batchIdx]; if(!b || b.refund || b.voided || b.pkg || b.pkgPaid || b.service || b.comp || (b.bought-b.used)<=0) return; /* 套餐 / 서비스 / 套餐内含批次不可退款；还有剩余次数（未使用/部分使用）才能退款；已用完的不能 */
  HOLDING_REFUND_CTX = {name:name, itemName:itemName, batchIdx:batchIdx};
  /* 购买价（CMD-1008-08）：当初实付（折后）+ 有折扣时的原价和折扣；按剩余次数的参考值只提示，不自动填入金额框；读批次购买时的快照，不读当前项目库价格 */
  var cur = b.currency || 'IDR', hasPaid = typeof b.paid==='number', remain = b.bought-b.used, priceHtml = '';
  if(hasPaid){
    var pct = (b.discountPct===undefined || b.discountPct===null) ? 100 : b.discountPct;
    priceHtml = '<div style="margin-top:8px;font-size:13px;">当初实付：<b>'+formatCurrency(b.paid, cur)+'</b>'+(b.paid===0 && b.pkg ? '（套餐内含）' : '')+(b.promo ? '（本月活动价）' : '')+
      (pct<100 && b.listPrice ? '<span style="color:var(--slate2);font-size:12px;">　原价 '+formatCurrency(b.listPrice, cur)+'，'+discountText(pct)+'</span>' : '')+'</div>'+
      '<div style="font-size:11px;color:var(--muted);margin-top:4px;">按剩余次数参考：'+formatCurrency(b.bought>0 ? Math.round(b.paid*remain/b.bought) : 0, cur)+'（实付 × 剩余 / 购买），仅供参考，不会自动填入；退款金额不能超过当初实付</div>';
  } else {
    priceHtml = '<div style="margin-top:8px;font-size:12px;color:var(--muted);">这一批没有记录当初的购买价格，退款金额无法校验上限</div>';
  }
  document.getElementById('holding-refund-info').innerHTML = '<b>'+itemName+'</b><br><span style="color:var(--slate2);font-size:12px;">'+b.date+' · 购买案件 '+caseNoLabel(b.caseId)+' · 购买 '+b.bought+' 次，已用 '+b.used+' 次，<b>剩余 '+remain+' 次将作废</b></span>'+priceHtml;
  document.getElementById('holding-refund-amount').value = '';
  document.getElementById('holding-refund-reason').value = '';
  document.getElementById('holding-refund-overlay').classList.add('open');
}

function closeHoldingRefundModal(){ document.getElementById('holding-refund-overlay').classList.remove('open'); }

function confirmHoldingRefund(){
  var ctx = HOLDING_REFUND_CTX; if(!ctx) return;
  var raw = document.getElementById('holding-refund-amount').value.trim();
  var amount = Number(raw);
  if(raw==='' || isNaN(amount) || amount<0){ alert('请填写退款金额（数字）'); return; }
  var reason = document.getElementById('holding-refund-reason').value.trim();
  if(!reason){ alert('请填写退款原因'); return; }
  var h = (CLIENT_HOLDINGS[ctx.name]||[]).filter(function(x){ return x.itemName===ctx.itemName; })[0]; if(!h) return;
  var b = h.batches[ctx.batchIdx]; if(!b || b.voided || (b.bought-b.used)<=0) return;
  if(typeof b.paid==='number' && amount > b.paid){ alert('不能超过当初实付 '+formatCurrency(b.paid, b.currency||'IDR')); return; } /* 退款金额 > 当初实付 → 挡下；0 仍可以 */
  b.voidedRemaining = b.bought-b.used; /* 作废的剩余次数（已用的次数保留作历史） */
  b.voided = true; /* 这一批作废，剩余次数归零 */
  b.refund = {amount:amount, currency:b.currency||'IDR', reason:reason, date:todayStr()}; /* 退款记录挂在这一批上；不改变任何案件的结局 */
  var pc = CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0];
  if(pc){
    pc.holdingRefunds = pc.holdingRefunds || [];
    pc.holdingRefunds.push({itemName:ctx.itemName, amount:amount, reason:reason, date:b.refund.date, qty:b.voidedRemaining||0});
    logCaseEvent(pc, ME_NAME, '客户详情办理持有批次退款：'+ctx.itemName+'（剩余 '+(b.voidedRemaining||0)+' 次作废），退款 '+formatCurrency(amount,'IDR')+'，原因：'+reason+'；退款记在本案件，结局不变');
  }
  /* 本次到访的案件（客人现在到访、还没结束的那个）：记一笔"本次到访办理了退款"；如果这次没有其他购买或使用，结案时结局=已取消（仅办理退款） */
  var vc = CASE_ITEMS.filter(function(x){ return x.name===ctx.name && x.id!==b.caseId && !isEnded(x) && x.subState==='arrived' && !x.visitClosed; })[0];
  if(vc){
    vc.refundVisit = {fromCaseId:b.caseId, itemName:ctx.itemName, amount:amount};
    logCaseEvent(vc, ME_NAME, '本次到访办理持有批次退款：'+ctx.itemName+'，退款 '+formatCurrency(amount,'IDR')+'（记在购买案件 '+(pc?pc.caseNo:b.caseId)+' 上）');
    buildCaseLog && vc.id===CURRENT_CASE_ID && buildCaseLog(vc);
  }
  if(pc && pc.id===CURRENT_CASE_ID) buildCaseLog(pc);
  HOLDING_REFUND_CTX = null;
  closeHoldingRefundModal();
  renderClientHoldings(ctx.name);
  renderProjectHistory(ctx.name);
}

/* 本院项目记录（2026-09-29 第十轮新增）：本地项目读CLIENT_HOLDINGS，赴韩项目读各案件procedureItems；
   按项目名分组，每个项目可展开看购买批次，批次里再看每次使用的案件+日期 */
var PROJ_HIST_NAME = null, PROJ_HIST_TAB = {};

function setProjHistTab(gi, tab){ PROJ_HIST_TAB[gi] = tab; renderProjectHistory(PROJ_HIST_NAME); var el = document.getElementById('proj-hist-'+gi); if(el) el.style.display='block'; }

/* 医美史·本院项目记录（CMD-1013-12 一·3）：按「日期 + 案件」分组，最新在上；组头「日期 … Case ID」，下面列这次做完的项目；补登的外部项目单独成组（右侧写「外部项目」）；只列做完的 */
function renderProjectHistory(name){
  PROJ_HIST_NAME = name;
  var el = document.getElementById('project-history-list');
  if(!el) return;
  var groups = {}, order = [];
  var add = function(date, caseId, label, ext){
    var key = (ext ? 'x|' : 'c|')+date+'|'+(caseId||''); if(!groups[key]){ groups[key] = {date:date, caseId:caseId, items:[], ext:!!ext}; order.push(key); }
    groups[key].items.push(label);
  };
  getClientHoldings(name).forEach(function(h){
    h.batches.forEach(function(b){ (b.usages||[]).forEach(function(u){ add(u.date, u.caseId, h.itemName+(b.spec ? ' · '+b.spec : '')+' × '+u.qty+' 次'+(u.opt ? '（'+u.opt+'）' : ''), false); }); });
  });
  CASE_ITEMS.filter(function(c){ return c.name===name; }).forEach(function(c){
    var lastDt = (c.logEntries&&c.logEntries.length) ? c.logEntries[c.logEntries.length-1].dt.split(' ')[0] : '—';
    var sd = (c.subItems||[]).filter(function(s){ return s.kind==='施术' && s.done && s.doneAt; })[0], dt = sd ? sd.doneAt.slice(0,10) : lastDt;
    (c.procedureItems||[]).filter(function(it){ return it.origin==='KR' && it.done && !it.cancelled && !it.swapped; }).forEach(function(it){ add(dt, c.id, it.name+(it.qty>1 ? ' ×'+it.qty : ''), false); });
  });
  var cl = clientByName(name);
  if(cl) beautyRecordsOf(cl).filter(function(r){ return r.source==='室长登记'; }).forEach(function(r){ add(r.year+'-'+pad2(r.month), '', r.project, true); });
  order.sort(function(a, b){ return groups[b].date.localeCompare(groups[a].date); });
  if(!order.length){ el.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">暂无项目记录</div>'; return; }
  el.innerHTML = order.map(function(key){
    var g = groups[key], cc = g.caseId ? CASE_ITEMS.filter(function(x){ return x.id===g.caseId; })[0] : null;
    var right = g.ext ? '<span class="status-pill" style="background:var(--border2);color:var(--slate2);">外部项目</span>' : (cc ? '<a href="#" class="info-link" onclick="openCaseDetail(\''+cc.id+'\');return false;" style="font-weight:700;">'+cc.caseNo+'</a>' : '');
    return '<div class="field-row" style="flex-direction:column;align-items:flex-start;padding:8px 0;"><div style="display:flex;width:100%;justify-content:space-between;align-items:center;"><span class="fk" style="font-weight:700;">'+g.date+'</span>'+right+'</div>'+
      g.items.map(function(x){ return '<div style="padding:3px 0;font-size:13px;">· '+aEscC(x)+'</div>'; }).join('')+'</div>';
  }).join('');
}

function toggleProjHistory(i){
  var el = document.getElementById('proj-hist-'+i); if(!el) return;
  el.style.display = el.style.display==='none' ? 'block' : 'none';
}

/* 术后管理 / 复诊预约到店的案件：写时间 + 内容 + 来源，例「10/24 14:00 到店 · ONDA 提升 第 1 次（来自 A000038 腹部吸脂）」（CMD-1013-02 十）；来源 = 预约时的赴韩案件子项 */
function subVisitText(c){
  if(!c.linkedCase || !c.linkedCase.auto || !c.visitDate) return '';
  var src = CASE_ITEMS.filter(function(x){ return x.id===c.linkedCase.caseId; })[0]; if(!src) return '';
  var sub = (src.subItems||[]).filter(function(s){ return s.booked===c.caseNo; })[0]; if(!sub) return '';
  var m = String(c.visitDate).match(/^\d{4}-(\d\d)-(\d\d)/), md = m ? m[1]+'/'+m[2] : c.visitDate;
  var main = krAllItems(src).filter(function(it){ return !it.cancelled; }).map(function(it){ return it.name; }).join('、');
  return md+' '+(c.visitTime||'')+' 到店 · '+sub.content+'（来自 '+src.caseNo+(main ? ' '+main : '')+'）';
}
function renderClientCases(name){
  /* "正在进行案件"只放没结束的：已结案、已取消（不管是预约阶段取消还是全退/部分退那两个终态）都不算"进行中" */
  var mine = CASE_ITEMS.filter(function(c){ return c.name===name && !isEnded(c); });
  var el = document.getElementById('detail-cases');
  if(!el) return;
  if(mine.length===0){ el.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">当前没有进行中的案件</div>'; return; }
  el.innerHTML = mine.map(function(c){
    var b = caseStageBadge(c);
    return '<div class="trow" style="grid-template-columns:1fr 1fr auto;">'+
      '<span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';width:fit-content;">'+b[2]+'</span>'+
      '<span style="font-size:12px;color:var(--slate2);">'+(subVisitText(c) || caseStatusSub(c))+'</span>'+
      '<a href="#" onclick="openCaseDetail(\''+c.id+'\');return false;" style="font-size:12px;font-weight:700;">进入案件 →</a></div>';
  }).join('');
}

/* 医美史记录列表（客户详情"医美史 · 案件记录"和案件基础资料共用）：年月 · 项目 · 来源 +"本次新增"标记 */
function beautyMetaText(r){
  var c = r.caseId ? CASE_ITEMS.filter(function(x){ return x.id===r.caseId; })[0] : null;
  return aEscC(r.source)+' · 登记 '+aEscC((r.addedAt||'').slice(0,10)||'—')+' · 案件 '+(c ? aEscC(c.caseNo) : '—')+(r.by ? ' · '+aEscC(r.by) : '');
}
function beautyListHtml(cl){
  var rs = beautyRecordsOf(cl).slice().sort(function(a,b){ return (b.year*100+b.month)-(a.year*100+a.month); });
  if(!rs.length) return '<div style="font-size:12px;color:var(--muted);padding:6px 0;">暂无医美史记录</div>';
  return rs.map(function(r){
    var isNew = beautyRecordIsNew(r);
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border2);font-size:13px;flex-wrap:wrap;"><span style="color:var(--slate2);width:78px;flex-shrink:0;">'+beautyYm(r)+'</span><span style="flex:1;min-width:0;font-weight:700;">'+aEscC(r.project)+'</span>'+
      (isNew ? '<span class="status-pill" style="background:var(--terracotta);color:#fff;font-weight:700;">本次新增</span>' : '')+
      '<span style="flex-basis:100%;font-size:11px;color:var(--muted);padding-left:86px;">'+beautyMetaText(r)+'</span></div>'; /* 来源信息永久保留，显示在小字里 */
  }).join('');
}
/* 案件基础资料里的"医美史"一行：列出客户的医美史（本次新增有明显标记）+ ［＋补登］（来源"室长登记"，记为这个案件的本次新增） */
function caseBeautyRowHtml(c){
  var cl = clientByName(c.name);
  return '<div class="case-field-row" style="align-items:flex-start;"><span class="fk" style="padding-top:2px;">医美史</span><div style="flex-grow:1;">'+(cl ? beautyListHtml(cl) : '')+
    '<button class="btn-ghost" style="margin-top:8px;padding:4px 10px;font-size:12px;" onclick="openBeautyAdd(\''+c.id+'\')">＋ 补登医美史</button>'+
    '<div style="font-size:11px;color:var(--muted);margin-top:6px;">客人在预约页新增的标"本次新增"，到店时请和客人确认；确认基础资料后标记消失。</div></div></div>';
}
var BEAUTY_ADD_CASE = null;
function openBeautyAdd(caseId){
  BEAUTY_ADD_CASE = caseId || null;
  var ov = document.getElementById('beauty-add-overlay');
  if(!ov){ ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'beauty-add-overlay'; ov.style.zIndex = 90; ov.onclick = function(e){ if(e.target===ov) closeBeautyAdd(); }; document.body.appendChild(ov); }
  var inp = 'width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box;';
  ov.innerHTML = '<div class="modal-box" style="width:400px;"><div style="font-size:15px;font-weight:700;margin-bottom:12px;">补登医美史（来源：室长登记）</div>'+
    '<div class="field" style="margin-bottom:10px;"><label>时间（年 + 月）</label><input id="ba-ym" type="month" max="'+dateStr(demoNow()).slice(0,7)+'" style="'+inp+'"></div>'+
    '<div class="field"><label>项目</label><input id="ba-project" type="text" list="ba-project-list" placeholder="从项目库选，或自由输入" style="'+inp+'"><datalist id="ba-project-list">'+projectNameOptions().map(function(n){ return '<option value="'+aEscC(n)+'">'; }).join('')+'</datalist></div>'+
    '<div id="ba-err" class="error-text" style="display:none;margin-top:8px;"></div>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;"><button class="btn-outline" onclick="closeBeautyAdd()">取消</button><button class="btn-primary" onclick="saveBeautyAdd()">保存</button></div></div>';
  ov.classList.add('open');
}
function closeBeautyAdd(){ var ov = document.getElementById('beauty-add-overlay'); if(ov) ov.classList.remove('open'); }
function saveBeautyAdd(){
  var ym = document.getElementById('ba-ym').value, project = document.getElementById('ba-project').value.trim(), err = document.getElementById('ba-err');
  var c = BEAUTY_ADD_CASE ? CASE_ITEMS.filter(function(x){ return x.id===BEAUTY_ADD_CASE; })[0] : null;
  var name = c ? c.name : document.getElementById('detail-name').textContent, cl = clientByName(name);
  if(!ym || !project){ err.textContent = '时间（年 + 月）和项目都要填'; err.style.display = 'block'; return; }
  if(!cl) return;
  addBeautyRecord(cl, {year:+ym.slice(0,4), month:+ym.slice(5,7), project:project, source:'室长登记', caseId:c ? c.id : null, newCaseId:c ? c.id : null});
  cl.timeline.push({stage:'基础信息修改', actor:ME_NAME, actorId:currentAccountId(), action:'补登医美史：'+ym+' '+project, dt:nowFullDt(), kind:'plain'});
  closeBeautyAdd(); buildHistoryList(name); renderClientTimeline(name);
  if(c){ if(typeof continuationInfo==='function' && continuationInfo(c)) onNewHistoryChanged(); else renderCaseBody(c); }
}
function buildHistoryList(name){
  var cl = name ? clientByName(name) : null;
  var records = cl ? '<div class="info-card"><div style="padding:2px 0;">'+beautyListHtml(cl)+'</div></div>' : '';
  var addBtn = document.getElementById('beauty-add-btn'); if(addBtn) addBtn.style.display = cl ? '' : 'none';
  var own = name ? CASE_ITEMS.filter(function(c){ return c.name===name; }).map(function(c){
    var first = (c.logEntries&&c.logEntries[0]) ? c.logEntries[0].dt.split(' ')[0] : '—';
    var bd = caseStageBadge(c), lkSrc = (c.linkedCase && c.linkedCase.caseId) ? CASE_ITEMS.filter(function(x){ return x.id===c.linkedCase.caseId; })[0] : null, lk = lkSrc ? '关联 '+lkSrc.caseNo+' · '+c.linkedCase.reason : '';
    return '<div class="info-card"><div class="info-card-row"><div style="min-width:0;"><div class="value"><a href="#" class="info-link" onclick="openCaseDetail(\''+c.id+'\');return false;" style="font-weight:700;">'+c.caseNo+'</a></div><div class="sub">'+first+(lk ? ' · '+lk : '')+'</div></div>'+
      '<span class="status-pill" style="background:'+bd[0]+';color:'+bd[1]+';">'+bd[2]+'</span></div></div>';
  }).join('') : '';
  document.getElementById('history-list').innerHTML = records + own;
}

function buildDetailLog(){
  /* Client-level timeline only logs 4 kinds of events: 建档 / 基础信息修改 / Case 开始 / Case 结案.
     Everything that happens inside a case lives in that case's own timeline instead.
     Format: 进程名／具体做了什么／谁／00-00-00 00:00 */
  var log = [
    {stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-3)+' 10:02', kind:'plain'},
    {stage:'建档', actor:'A1 室长', action:'修改基础信息（补录护照信息、确认医美史）', dt:D(-3)+' 11:15', kind:'plain'},
    {stage:'预约到店', actor:'A1 室长', action:'Case 开始 · 预约到店', dt:D(-2)+' 09:05', kind:'case', caseId:'siti'}
  ];
  document.getElementById('detail-log').innerHTML = log.map(logLine).join('');
}

function rowMarkNoShow(caseId){
  if(!confirm('确认标记"未到店"？标记后不能撤回，客人后来才到需要重新预约。')) return;
  markNoShow(caseId, false);
  renderCaseRows(); buildWeekGrid();
}

/* 演示按钮「模拟时间超过30分钟」：对所有"待访问"案件按过了预约时间30分钟处理 */
function simulateTimePass30(){
  DEMO_SHIFT_MS += noShowMs()+60000; /* 演示时钟往后拨「未到店判定时间 + 1 分钟」 */
  var n = 0;
  CASE_ITEMS.slice().forEach(function(c){ if(markNoShow(c.id, true)) n++; });
  renderCaseRows(); buildWeekGrid();
  var cur = getCurrentCase();
  if(cur && CURRENT_PAGE_ID==='in-casedetail'){ renderCaseStatusBar(cur); buildCaseLog(cur); renderCaseBody(cur); }
  showToast('已模拟时间超过30分钟', n ? n+' 个待访问案件自动变为"已取消（未到店）"' : '没有待访问的案件', null);
}

function updateCaseStage(c){ c.stage = deriveCaseStage(c); c.financeResult = financeResultOf(c); if(isEnded(c)) archiveCaseRoom(c);
  if(!SEEDING && c.director && typeof syncSurgeryBlock==='function'){ try{ syncSurgeryBlock(c); }catch(e){} } /* 状态变化后施术块跟着更新（取消的不再占日程） */
  var fo = (typeof document!=='undefined') && document.getElementById('chat-float-overlay'); if(fo && fo.classList.contains('open') && typeof renderFloatMessages==='function'){ try{ renderFloatMessages(); }catch(e){} } }

var CASE_TAB_FILTER = 'all';

var CASE_REFUND_FILTER = false;
 /* 2026-09-30："有退款"筛选，和tab叠加使用 */
function buildCaseTabs(){
  document.getElementById('case-tabs').innerHTML = CASE_TABS.map(function(t){
    return '<span class="tab'+(t.key===CASE_TAB_FILTER?' active':'')+'" onclick="filterCases(\''+t.key+'\')">'+t.label+'</span>';
  }).join('') + (function(){ /* 一诊所一医院：案件列表没有医院筛选 */
    return '';
    var hs = [];
    return '<span style="margin-left:auto;display:inline-flex;gap:6px;align-items:center;"><span style="font-size:11px;color:var(--muted);">医院</span><span class="chip'+(CASE_HOSPITAL_FILTER==='all'?' active':'')+'" onclick="setCaseHospitalFilter(\'all\')">全部</span>'+
      hs.map(function(h){ return '<span class="chip'+(CASE_HOSPITAL_FILTER===h.id?' active':'')+'" onclick="setCaseHospitalFilter(\''+h.id+'\')">'+h.name.ko+'</span>'; }).join('')+'</span>';
  })() + '<span class="chip'+(CASE_REFUND_FILTER?' active':'')+'" style="margin-left:auto;" onclick="toggleRefundFilter()">有退款</span>';
}

function toggleRefundFilter(){ CASE_REFUND_FILTER = !CASE_REFUND_FILTER; buildCaseTabs(); renderCaseRows(); }

var CASE_ONLY_MINE = false;
var CASE_HOSPITAL_FILTER = 'all'; /* 案件列表按医院筛选：all 或医院 ID（只列出本诊所对接的医院） */
function setCaseHospitalFilter(v){ CASE_HOSPITAL_FILTER = v; buildCaseTabs(); renderCaseRows(); }

function renderCaseRows(){
  var items = CASE_TAB_FILTER==='all' ? CASE_ITEMS : CASE_ITEMS.filter(function(c){ return c.stage===CASE_TAB_FILTER; });
  if(CASE_REFUND_FILTER) items = items.filter(hasRefundMark);
  if(CASE_ONLY_MINE) items = items.filter(function(c){ return caseOperators(c, true).inn.indexOf(ME_NAME)>-1; }); /* 仅看我的：只显示我操作过的案件 */
  if(items.length===0){
    document.getElementById('case-rows').innerHTML = '<div style="font-size:12px;color:var(--muted);padding:20px 4px;">该分类下暂无案件（其余阶段的界面还没设计，先把预约到店这一段做完）</div>';
    return;
  }
  document.getElementById('case-rows').innerHTML = items.map(function(c){
    var si = caseStageInfo(c);
    var lmTag = (localMgmtTagOn(c) ? ' <span class="status-pill" style="background:var(--sage-bg);color:var(--sage);font-size:10px;">本地管理进行中</span>' : '')+(krHoldOpen(c) ? ' <span class="status-pill" style="background:#E8F0FB;color:#2F5FA8;font-size:10px;">在韩后续进行中</span>' : '');
    var ops = caseOperators(c, true); /* IN 室长 / KR 室长：按操作记录自动标注（所有操作过的室长） */
    /* 2026-10-08：待访问行内按钮已废弃；CMD-1008-13：当前状态拆成「阶段（彩色标签）+ 进程（文字）」，去掉「状态」栏和最右边「查看 →」，整行可点击（hover 浅粉色） */
    return '<div class="trow case-row-click" onclick="openCaseNewTab(\''+c.id+'\')" style="grid-template-columns:1.1fr 0.8fr 0.9fr 1.4fr 1.1fr 0.9fr 0.8fr 0.8fr 0.7fr;cursor:pointer;"><span><b style="font-size:13px;">'+c.name+'</b>'+presTag(CURRENT_CLINIC_ID, c.id)+'</span>'+
      '<span style="font-size:12px;color:var(--slate2);">'+c.caseNo+'</span>'+
      '<span><span class="status-pill" style="background:'+si.bg+';color:'+si.fg+';white-space:nowrap;">'+si.stage+'</span></span>'+
      '<span style="font-size:12px;">'+si.proc+lmTag+'</span>'+
      '<span>'+financeCellHtml(c)+'</span>'+
      '<span style="font-size:12px;">'+(c.director||'')+'</span><span style="font-size:12px;">'+(ops.inn.map(function(n){ return ops.innIds[n] ? nameWithId(n, ops.innIds[n]) : staffLabel(n); }).join('、')||'—')+'</span><span style="font-size:12px;">'+(ops.kr.join('、')||'—')+'</span><span style="font-size:12px;color:var(--muted);">'+c.updated+'</span></div>';
  }).join('');
}


/* ================= case detail ================= */
var CURRENT_CASE_ID = null;


var INVITE_KR_CONTEXT_CASE_ID = null;

var CHAT_VIDEO_CONTEXT_CASE_ID = null;

function openCaseDetail(id, noPush){
  var c = CASE_ITEMS.filter(function(x){ return x.id===id; })[0];
  if(!c) return;
  if(CURRENT_PAGE_ID==='in-casedetail' && CURRENT_CASE_ID && CURRENT_CASE_ID!==id && !intakeLeaveOk()) return; /* 从接待中的案件页打开另一个案件：先确认 */
  if(!noPush && CURRENT_PAGE_ID==='in-casedetail' && CURRENT_CASE_ID && CURRENT_CASE_ID!==id){
    CASE_RETURN.push(CURRENT_CASE_ID); NAV_STACK.push('in-casedetail'); /* 案件页 → 另一个案件页 */
  }
  CURRENT_CASE_ID = id;
  renderCaseSubtitle(c);
  document.getElementById('case-chat-actions').style.display = c.materialsConfirmed ? 'flex' : 'none'; /* 发起对话等按钮：基础资料确认后才显示 */
  renderCaseStatusBar(c);
  buildCaseLog(c);
  renderCaseBody(c);
  nav('in-casedetail');
}

function renderCaseStatusBar(c){
  var b = caseStageBadge(c);
  var actionBtn = '';
  if(c.krVisit && c.stage==='booked'){ /* CMD-1014-16：在韩到店案件（KR 医院）：到店 / 完成由 KR 标记，IN 不接待、不判未到店 */
    actionBtn = '<span style="font-size:12px;color:var(--slate2);">在韩到店预约（KR 医院）：'+(c.krVisit.arrived ? '客人已到店，等 KR 标记完成' : (c.visitDate+' '+c.visitTime+'（韩国）等 KR 标记客人到店'))+'</span>';
  } else if(c.stage==='booked' && c.subState==='waiting'){
    actionBtn = '<div style="display:flex;gap:10px;">'+(c.visitDate===todayStr() ? '<button class="btn-primary" onclick="markArrived()">客人已到店</button>' : '<button class="btn-primary" disabled title="只有来访当天才能标记客人已到店" style="opacity:.45;cursor:not-allowed;">客人已到店（仅来访当天）</button>')+'<button class="btn-outline" onclick="openRescheduleModal()">预约修改</button><button class="btn-outline" onclick="rowMarkNoShow(CURRENT_CASE_ID);renderCaseStatusBar(getCurrentCase());renderCaseBody(getCurrentCase());buildCaseLog(getCurrentCase())">未到店</button><button class="btn-ghost" onclick="simulateTimePass30()">演示：模拟时间超过30分钟</button><button class="btn-outline" onclick="openCancelModal()">预约取消</button></div>';
  }
  if(canEndCase(c)) actionBtn += '<button class="btn-outline" onclick="openEndCase()">结束案件</button>';
  var ug = urgeInfo(c);
  if(ug) actionBtn += '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:12px;color:#C26A1B;">'+ug.label+'</span><button class="btn-primary" onclick="urgeKr()">'+(c.urgedAt ? '再次催办' : '催办')+'</button></div>';
  document.getElementById('case-status-bar').innerHTML =
    '<div class="card" style="padding:14px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">'+
    '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:12px;color:var(--slate);">当前状态</span><span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';">'+b[2]+'</span>'+
    (localMgmtTagOn(c) ? '<span class="status-pill" style="background:var(--sage-bg);color:var(--sage);font-size:11px;">本地管理进行中</span>' : '')+
    (c.visibleToKR ? '<span class="status-pill" style="background:#EDEAE2;color:var(--slate2);font-size:11px;" title="韩国侧可见（不面诊案件点增加面诊后、或使用术后管理项目关联后）">KR可见</span>' : '')+
    (isEnded(c) ? '<span style="font-size:11px;color:var(--slate2);">'+(c.stage==='cancelled' ? '取消原因：'+endReasonText(c)+'　' : '')+financeLabel(c)+'</span>' : '')+
    caseAbnormalTags(c).map(function(t){ return '<span class="status-pill" style="background:#F6DCDC;color:#C1454A;font-size:11px;">'+t+'</span>'; }).join('')+'</div>'+
    actionBtn+'</div>';
  renderCaseHeaderActions(c);
}

/* 案件头部按钮（2026-09-29 重写）："发起视频"已删除，原位置只在未面诊的案件显示"增加面诊"（2026-10-02 面诊改版）；
   其他阶段只有"发起对话"。"发起对话"本身继续沿用原规则：生成 Case ID 后才显示 */
function renderCaseHeaderActions(c){
  var el = document.getElementById('case-chat-actions'); if(!el) return;
  el.style.display = c.materialsConfirmed ? 'flex' : 'none';
  if(!c.materialsConfirmed){ el.innerHTML=''; return; }
  var stageBtn = '';
  var notEnded = !isEnded(c);
  if(notEnded && c.needsConsult===false && !c.consultRequested){
    stageBtn = '<button class="btn-outline" onclick="addConsult()">增加面诊</button>';
  }
  /* 2026-09-30：面诊/赴韩案件从生成 Case ID 到结案前，可点"+添加本地管理"插做本地项目；不面诊案件不显示 */
  var lmBtn = '';
  if(notEnded && !c.localMgmt && !isLocalCase(c) && (c.consultRequested || c.needsConsult===true) && localAddAllowed(c)){
    lmBtn = '<button class="btn-outline" onclick="addLocalMgmt()">+ 添加本地管理</button>';
  }
  el.innerHTML = (caseRoomEligible(c) ? '<button class="btn-primary" onclick="openCaseRoom(CURRENT_CASE_ID)">发起对话</button>' : '') + lmBtn + stageBtn; /* 2026-10-02：不满足建房条件时完全不显示 */
}

var CANCEL_REASON = '';

function openCancelModal(){
  CANCEL_REASON = '';
  renderCancelReasons();
  document.getElementById('cancel-overlay').classList.add('open');
}

function closeCancelModal(){ document.getElementById('cancel-overlay').classList.remove('open'); }

function renderCancelReasons(){
  var reasons = ['客人改期','客人不需要了','联系不上客人','其他'];
  document.getElementById('cancel-reason-list').innerHTML = reasons.map(function(r){
    return '<button class="'+(CANCEL_REASON===r?'btn-primary':'btn-outline')+'" style="text-align:left;" onclick="pickCancelReason(\''+r+'\')">'+r+'</button>';
  }).join('');
}

function confirmCancel(){
  if(!CANCEL_REASON){ alert('请先选择取消原因'); return; }
  var c = getCurrentCase(); if(!c) return;
  c.subState = 'cancelled'; c.cancelBy = '室长';
  c.cancelReason = CANCEL_REASON;
  updateCaseStage(c);
  closeCancelModal();
  renderCaseStatusBar(c);
  logCaseEvent(c, ME_NAME, '取消该客人的到店预约（原因：'+CANCEL_REASON+'）');
  buildCaseLog(c);
  renderCaseBody(c);
  if(CURRENT_PAGE_ID==='in-cases') renderCaseRows();
  buildWeekGrid();
}

/* ================= reschedule modal: calendar + time-slot picker + director ================= */
var RESCHED_CASE_ID = null;

var RESCHED_VIEW_MONTH = null;
 /* Date, first of the shown month */
var RESCHED_SELECTED_DATE = null;
 /* Date */
var RESCHED_SELECTED_TIME = null;

function openRescheduleModal(){
  var c = getCurrentCase(); if(!c) return;
  RESCHED_CASE_ID = c.id;
  RESCHED_SELECTED_DATE = c.visitDate ? new Date(c.visitDate+'T00:00:00') : new Date(demoNow().getFullYear(), demoNow().getMonth(), demoNow().getDate());
  RESCHED_SELECTED_TIME = c.visitTime || '';
  /* 原预约时间已经过去（例如未到店后想改约）：一样只能选现在之后的时间 → 从今天起找第一个开诊日，不预选时间 */
  if(!c.visitDate || slotIsPast(c.visitDate, c.visitTime||'00:00')){
    var dd = new Date(demoNow().getFullYear(), demoNow().getMonth(), demoNow().getDate()), guard = 0;
    while(isRescheduleDateDisabled(dd) && guard++ < 14) dd.setDate(dd.getDate()+1);
    RESCHED_SELECTED_DATE = dd; RESCHED_SELECTED_TIME = '';
  }
  RESCHED_VIEW_MONTH = new Date(RESCHED_SELECTED_DATE.getFullYear(), RESCHED_SELECTED_DATE.getMonth(), 1);
  renderRescheduleCalendar();
  renderRescheduleTimePanel();
  document.getElementById('reschedule-overlay').classList.add('open');
}

function closeRescheduleModal(){ document.getElementById('reschedule-overlay').classList.remove('open'); }

function renderRescheduleCalendar(){
  document.getElementById('reschedule-month-label').textContent = (RESCHED_VIEW_MONTH.getMonth()+1)+'月';
  var y = RESCHED_VIEW_MONTH.getFullYear(), m = RESCHED_VIEW_MONTH.getMonth();
  var firstDow = new Date(y,m,1).getDay();
  var daysInMonth = new Date(y,m+1,0).getDate();
  var daysInPrev = new Date(y,m,0).getDate();
  var cells = [];
  for(var i=0;i<firstDow;i++){ cells.push({n:daysInPrev-firstDow+1+i, dim:1}); }
  for(var d=1; d<=daysInMonth; d++){ cells.push({n:d, y:y, m:m}); }
  while(cells.length%7!==0 || cells.length<35){ cells.push({n:cells.length, dim:1}); }
  document.getElementById('reschedule-cal-grid').innerHTML = cells.map(function(c){
    if(c.dim) return '<div style="padding:10px 0;text-align:center;font-size:13px;color:var(--dim);">'+c.n+'</div>';
    var dObj = new Date(c.y,c.m,c.n);
    var disabled = isRescheduleDateDisabled(dObj) || dateIsPast(dateStr(dObj)); /* 休诊日、今天之前的日期：灰色不能点 */
    var selected = RESCHED_SELECTED_DATE && dObj.toDateString()===RESCHED_SELECTED_DATE.toDateString();
    var style = 'padding:10px 0;text-align:center;font-size:13px;border-radius:50%;margin:2px auto;width:34px;';
    if(disabled) style += 'color:var(--dim);';
    else if(selected) style += 'background:var(--navy);color:#fff;font-weight:700;cursor:pointer;';
    else style += 'color:var(--navy);cursor:pointer;';
    var onclick = disabled ? '' : ' onclick="pickRescheduleDate('+c.y+','+c.m+','+c.n+')"';
    return '<div style="'+style+'"'+onclick+'>'+c.n+'</div>';
  }).join('');
}

function renderRescheduleTimePanel(){
  var d = RESCHED_SELECTED_DATE;
  var dow = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
  document.getElementById('reschedule-day-label').textContent = (d.getMonth()+1)+'/'+d.getDate()+' '+dow;
  function slotBtn(t){
    var why = slotBlockReason(dateStr(d), t, null, RESCHED_CASE_ID), off = !!why; /* past 已过：灰色无文字；full 额满：灰色 + 已满 */
    var selected = t===RESCHED_SELECTED_TIME && !off;
    var style = 'padding:10px 6px;text-align:center;font-size:12px;border-radius:8px;';
    if(off && why==='full') style += 'background:var(--white);border:1px solid var(--border);color:var(--muted);'; /* 已满：白底只标字 */
    else if(off) style += 'background:var(--border2);color:var(--dim);';
    else if(selected) style += 'background:var(--navy);color:#fff;font-weight:700;cursor:pointer;';
    else style += 'background:var(--white);border:1px solid var(--border);color:var(--navy);cursor:pointer;';
    var onclick = off ? '' : ' onclick="pickRescheduleTime(\''+t+'\')"';
    return '<div style="'+style+'"'+onclick+'>'+t+(why==='full' ? '<br><span style="font-size:10px;">已满</span>' : '')+'</div>';
  }
  var amGrid = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">'+RESCHED_AM.map(slotBtn).join('')+'</div>';
  var pmGrid = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px;">'+RESCHED_PM.map(slotBtn).join('')+'</div>';
  var lunchDivider = '<div style="text-align:center;font-size:11px;color:var(--terracotta);margin:12px 0;">午休 '+CLINIC_SETTINGS.lunchFrom+'～'+CLINIC_SETTINGS.lunchTo+'</div>';
  document.getElementById('reschedule-slots').innerHTML = amGrid + lunchDivider + pmGrid;
  var cn = document.getElementById('reschedule-closed-note'); if(cn) cn.textContent = '定期休诊：'+closedRulesText(CLINIC_SETTINGS.closedRules)+'（诊所设定）';
}

function confirmReschedule(){
  var c = CASE_ITEMS.filter(function(x){ return x.id===RESCHED_CASE_ID; })[0]; if(!c) return;
  if(!RESCHED_SELECTED_TIME || slotBlockReason(dateStr(RESCHED_SELECTED_DATE), RESCHED_SELECTED_TIME, null, c.id)){ alert('请选择一个可约的时段（已过去、已满、休诊、午休的时间不能选）'); return; }
  var y = RESCHED_SELECTED_DATE.getFullYear(), m = RESCHED_SELECTED_DATE.getMonth()+1, d = RESCHED_SELECTED_DATE.getDate();
  c.visitDate = y+'-'+(m<10?'0'+m:m)+'-'+(d<10?'0'+d:d);
  c.visitTime = RESCHED_SELECTED_TIME;
  closeRescheduleModal();
  logCaseEvent(c, ME_NAME, '修改预约为 '+c.visitDate+' '+c.visitTime+'');
  buildCaseLog(c);
  if(CURRENT_PAGE_ID==='in-casedetail' && CURRENT_CASE_ID===c.id){
    renderCaseSubtitle(c);
  }
  if(CURRENT_PAGE_ID==='in-cases') renderCaseRows();
  showToast('预约已修改', c.name+' · '+c.visitDate+' '+c.visitTime, null);
}

/* 对话工具栏"发起视频"参与人popup（2026-09-29 新增，IN-VIDE-01 入口①）：
   候选人固定为印尼室长+韩国室长（院长不在呼叫名单里，可自愿加入，2026-10-02），默认全选，可取消勾选 */
var CHAT_VIDEO_PARTICIPANT_CASE_ID = null;

var CHAT_VIDEO_PARTICIPANTS_SELECTED = [];

function openChatVideoParticipantModal(caseId){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0]; if(!c) return;
  CHAT_VIDEO_PARTICIPANT_CASE_ID = caseId;
  var candidates = IN_COORDINATORS.map(function(n){ return n+'（印尼室长）'; }).concat([c.krCoordinator]); /* 2026-10-02：参与人只有IN/KR室长；院长不在呼叫名单里，但可以自愿加入 */
  CHAT_VIDEO_PARTICIPANTS_SELECTED = candidates.slice();
  renderChatVideoParticipantList(candidates);
  document.getElementById('chat-video-participant-overlay').classList.add('open');
}

function renderChatVideoParticipantList(candidates){
  document.getElementById('chat-video-participant-list').innerHTML = candidates.map(function(name){
    var checked = CHAT_VIDEO_PARTICIPANTS_SELECTED.indexOf(name)>-1;
    return '<label style="display:flex;align-items:center;gap:10px;padding:8px 4px;font-size:13px;cursor:pointer;"><input type="checkbox" onchange="toggleChatVideoParticipant(\''+name+'\')" '+(checked?'checked':'')+'><span>'+name+'</span></label>';
  }).join('');
}

function toggleChatVideoParticipant(name){
  var idx = CHAT_VIDEO_PARTICIPANTS_SELECTED.indexOf(name);
  if(idx>-1) CHAT_VIDEO_PARTICIPANTS_SELECTED.splice(idx,1); else CHAT_VIDEO_PARTICIPANTS_SELECTED.push(name);
}

function closeChatVideoParticipantModal(){ document.getElementById('chat-video-participant-overlay').classList.remove('open'); }

function confirmChatVideoParticipants(){
  if(!CHAT_VIDEO_PARTICIPANTS_SELECTED.length){ alert('请至少选择一位参与人'); return; }
  closeChatVideoParticipantModal();
  startCall('chat', CHAT_VIDEO_PARTICIPANT_CASE_ID, CHAT_VIDEO_PARTICIPANTS_SELECTED.slice()); /* 不预约，点了直接呼叫 */
}

function buildCaseLog(c){
  var el = document.getElementById('case-log'); if(el) el.innerHTML = (c.logEntries||[]).map(logLine).join('');
  if(c.id===CURRENT_CASE_ID && c.activeCaseTab==='timeline' && c.materialsConfirmed && typeof renderCaseBody==='function') renderCaseBody(c); /* Timeline 是独立 tab：打开着时同步刷新 */
}

function openInviteKrModal(){
  var c0 = getCurrentCase();
  /* 只列上传过报告的KR室长（Notion：选择上传了报告的室长） */
  var cands = (c0 ? krCoordinatorsOf(c0) : []).filter(function(n){ return (c0.reportUploadedBy||'').indexOf(n)>-1; });
  if(!cands.length){ alert('没有找到上传诊疗方案的室长'); return; }
  document.getElementById('invite-kr-list').innerHTML = cands.map(function(name, i){
    return '<button class="'+(i===0?'btn-primary':'btn-outline')+'" onclick="inviteKrVideo(\'' + name + '\')">' + name + '</button>';
  }).join('');
  document.getElementById('invite-kr-overlay').classList.add('open');
}

/* ================= 视频通话（2026-10-02 增量·四，室长视频；不预约，点了直接呼叫） =================
   参与人=两边室长（客人用 IN 室长的画面），院长不在呼叫名单里但可自愿加入（画面显示"院长可加入"）；
   顶部半透明工具栏（静音 / 共享屏幕 / 结束并归档），两边室长都能共享屏幕；下方"AI 实时转录"（人名+原文+译文，手动输入用圆角框标出并翻译）；"录制中"提示；
   任一室长按［结束并归档］，或所有人离开超过10分钟自动结束并归档（演示按钮模拟）；离开后可从对话抽屉红卡片 / 工作台卡片重新加入，结束后两者消失 */
var VIDEO_CALL = {active:false, kind:null, caseId:null, participants:[], status:'idle', shareBy:null, muted:false, startedAt:0, transcript:[]};

/* KR 室长 / 院长接听、拒绝、结束（来自 gmc_call 信号，boot-in.js 的 storage 监听调用） */
function inHandleCallSignal(sig){
  if(!sig || !VIDEO_CALL.active || !VIDEO_CALL.sigId || sig.id!==VIDEO_CALL.sigId) return;
  if(sig.status==='accepted' && VIDEO_CALL.status==='ringing'){ showToast('对方已接听', (sig.by||'KR')+' 加入了视频通话', null); simulatePeerJoin(); }
  else if(sig.status==='declined' && VIDEO_CALL.status==='ringing') simulatePeerDecline();
  else if(sig.status==='ended' && VIDEO_CALL.status==='connected'){ showToast('📞 对方已结束通话', (sig.by||'KR')+' 结束了视频通话', null, {sticky:true}); endVideoConsult(); }
}
function simulatePeerDecline(){
  if(VIDEO_CALL.status!=='ringing') return;
  VIDEO_CALL.active = false; INVITE_KR_CONTEXT_CASE_ID = null; CHAT_VIDEO_CONTEXT_CASE_ID = null;
  renderDashCallCard(); try{ renderSubBookCard(); }catch(e){} try{ renderPcDueCard(); }catch(e){} try{ renderDrawerList(); }catch(e){}
  clearTimeout(VIDEO_CALL.ringTimer);
  showToast('📞 对方已拒绝', callTitle()+' 的视频通话被对方拒绝了', null, {sticky:true});
  goBack();
}

function toggleMute(){ VIDEO_CALL.muted = !VIDEO_CALL.muted; renderVideoPage(); }

function toggleShare(who){ VIDEO_CALL.shareBy = (VIDEO_CALL.shareBy===who) ? null : who; renderVideoPage(); }

function simulateAllLeft10min(){ if(!VIDEO_CALL.active) return; showToast('所有人离开超过10分钟', '通话已自动结束并归档', null); endVideoConsult(); }

function sendCallManual(){
  var i = document.getElementById('vc-manual'); var v = i ? i.value.trim() : ''; if(!v) return;
  VIDEO_CALL.transcript.push({name:ME_NAME, orig:v, trans:'（演示译文）'+v, manual:true});
  renderVideoPage();
}

function renderVideoPage(){
  var root = document.getElementById('vc-root'); if(!root) return;
  var v = VIDEO_CALL, ringing = v.status==='ringing';
  var tiles = v.participants.map(function(n, i){
    var isIn = n.indexOf('印尼')>-1;
    var joined = isIn || !ringing;
    var sharing = v.shareBy && ((v.shareBy==='me' && isIn && n.indexOf(ME_NAME)>-1) || (v.shareBy==='peer' && !isIn));
    return '<div class="vc-tile" style="min-height:150px;'+(sharing?'outline:2px solid var(--sage);':'')+'"><span class="vc-label">'+n+'</span>'+
      '<div class="vc-avt" style="width:64px;height:64px;font-size:18px;background:'+(isIn?'var(--sage)':'#3B4A5A')+';opacity:'+(joined?1:.45)+';">'+callInitial(n)+'</div>'+
      '<div style="font-size:11px;color:#9AA6B2;">'+(joined ? (sharing ? '🖥 正在共享屏幕' : (isIn && n.indexOf(ME_NAME)>-1 ? '客人在场，共用此画面' : '已加入')) : '呼叫中… 铃声响起')+'</div></div>';
  }).join('');
  var abbr = v.participants.map(function(n){ return '<span class="vc-avt" style="width:26px;height:26px;font-size:11px;background:#3B4A5A;border:2px solid #111826;margin-right:-6px;" title="'+n+'">'+callInitial(n)+'</span>'; }).join('');
  var tr = (v.transcript||[]).map(function(t){
    return t.manual
      ? '<div style="align-self:flex-end;border:1px solid #3B4A5A;border-radius:12px;padding:8px 12px;max-width:80%;"><b style="font-size:11px;color:#9AA6B2;">'+t.name+'（手动输入）</b><div style="font-size:13px;">'+t.orig+'</div><div style="font-size:12px;color:#9AA6B2;">译：'+t.trans+'</div></div>'
      : '<div><b style="font-size:11px;color:#9AA6B2;">'+t.name+'</b><div style="font-size:13px;">'+t.orig+'</div><div style="font-size:12px;color:#9AA6B2;">译：'+t.trans+'</div></div>';
  }).join('') || '<div style="font-size:12px;color:#6B7A8D;">'+(ringing ? '等待对方加入…' : '开始说话后，这里显示 AI 实时转录')+'</div>';
  var demo = ringing
    ? '<button class="btn-ghost" onclick="simulatePeerJoin()">演示：模拟对方加入</button><button class="btn-ghost" onclick="simulatePeerDecline()">演示：模拟对方拒绝</button>'
    : '<button class="btn-ghost" onclick="toggleShare(\'peer\')">演示：模拟对方'+(v.shareBy==='peer'?'停止':'')+'共享屏幕</button><button class="btn-ghost" onclick="simulateAllLeft10min()">演示：模拟所有人离开超过10分钟</button><button class="btn-ghost" onclick="leaveCall()">演示：模拟断线（稍后重新加入）</button>';
  root.innerHTML =
    '<div style="position:relative;background:rgba(17,24,38,.85);padding:14px 28px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2A3344;">'+
      '<div style="display:flex;align-items:center;gap:14px;"><span style="display:inline-flex;padding-left:6px;">'+abbr+'</span>'+
        '<span style="font-size:14px;font-weight:700;">'+callTitle()+' · 视频沟通</span>'+
        '<span style="font-size:11px;color:#9AA6B2;border:1px solid #2A3344;border-radius:10px;padding:2px 8px;">院长可加入</span>'+
        '<span style="font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;color:#E05A50;"><span style="width:8px;height:8px;border-radius:50%;background:#E05A50;"></span>录制中</span></div>'+
      '<div style="display:flex;align-items:center;gap:12px;"><span id="vc-timer" style="font-size:12px;color:#9AA6B2;">00:00:00</span>'+
        '<span class="vc-btn" title="静音" onclick="toggleMute()" style="'+(v.muted?'background:#C1454A;':'')+'">'+(v.muted?'🔇':'🎤')+'</span>'+
        '<span class="vc-btn" title="共享屏幕" onclick="toggleShare(\'me\')" style="'+(v.shareBy==='me'?'background:var(--sage);':'')+'">🖥</span>'+
        '<a href="#" onclick="endVideoConsult();return false;" style="height:40px;padding:0 18px;border-radius:20px;background:#C1454A;display:flex;align-items:center;color:#fff;font-size:13px;font-weight:700;">结束并归档</a></div>'+
    '</div>'+
    '<div style="flex-grow:1;padding:22px;display:flex;flex-direction:column;gap:14px;">'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">'+tiles+'</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+demo+'</div>'+
      '<div style="background:#0D1420;border:1px solid #2A3344;border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;max-height:280px;">'+
        '<span style="font-size:12px;font-weight:700;color:#9AA6B2;">AI 实时转录</span>'+
        '<div style="display:flex;flex-direction:column;gap:10px;overflow:auto;">'+tr+'</div>'+
        '<div style="display:flex;gap:8px;"><input type="text" id="vc-manual" placeholder="手动输入内容（会被翻译）" onkeydown="if(event.key===\'Enter\')sendCallManual()" style="flex-grow:1;padding:10px 12px;border-radius:10px;border:1px solid #2A3344;background:#1B2333;color:#E5E9EE;font-size:13px;"><span class="send-btn" onclick="sendCallManual()">➤</span></div>'+
      '</div>'+
    '</div>';
}

/* 工作台顶部卡片：只在通话进行中出现（没有通话时不显示） */
/* 工作台待办：KR 请 IN 帮忙预约的术后管理（回印尼做的子项，已通知、还没预约）；点［代约］打开预约弹窗，生成的新案件关联原案件（CMD-1012-02 D5） */
function subBookTodos(){
  var out = [];
  CASE_ITEMS.forEach(function(c){ (c.subItems||[]).forEach(function(s){ if(s.informed && !s.booked && !s.done && s.place!=='KR') out.push({c:c, s:s}); }); });
  return out;
}
/* IN 工作台：术后管理已过建议日期还没做的提醒（CMD-1013-06 一·4） */
function renderPcDueCard(){
  var el = document.getElementById('dash-pcdue-card'); if(!el) return;
  el.style.display = 'none'; el.innerHTML = ''; return; /* CMD-1014-18 四·4：工作台不再有这张卡（回印尼的术后管理由客人持有 + 待办提醒，不再请 IN 帮忙预约） */
  var list = postcareDueList();
  if(!list.length){ el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'block';
  el.innerHTML = '<div style="padding:14px 18px;"><div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#C1454A;">术后管理已过建议日期<span class="status-pill" style="background:#FBE3E1;color:#C1454A;margin-left:8px;">'+list.length+'</span></div>'+
    list.map(function(x){ return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid var(--border2);font-size:13px;"><span style="flex:1;"><b>'+x.name+'</b> · '+x.h.itemName+'（属于 '+x.sg.src.caseNo+'，建议 '+pcMD(x.sg.date)+'）<span style="color:#C1454A;">已过 '+x.late+' 天</span></span></div>'; }).join('')+'<div style="font-size:11px;color:var(--muted);margin-top:6px;">客人来店时在本地管理 / 持有项目使用里点［做术后管理］补做，会记「延后 N 天」。</div></div>';
}
function renderSubBookCard(){
  var el = document.getElementById('dash-subbook-card'); if(!el) return;
  el.style.display = 'none'; el.innerHTML = ''; return; /* CMD-1014-18 四·4：工作台不再有这张卡（回印尼的术后管理由客人持有 + 待办提醒，不再请 IN 帮忙预约） */
  var list = subBookTodos();
  if(!list.length){ el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'block';
  el.innerHTML = '<div style="padding:14px 18px;"><div style="font-size:14px;font-weight:700;margin-bottom:8px;">待预约（KR 请帮忙预约术后管理）<span class="status-pill" style="background:var(--terracotta-bg);color:var(--terracotta);margin-left:6px;">'+list.length+'</span></div>'+
    list.map(function(x){ return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid var(--border2);font-size:13px;"><span style="flex:1;"><b>'+x.c.name+'</b>（'+x.c.caseNo+'）· '+x.s.content+' · 建议 '+x.s.date+'</span><button class="btn-primary" style="padding:4px 12px;font-size:12px;" onclick="openSubBookModal(\''+x.c.id+'\',\''+x.s.id+'\')">代约</button></div>'; }).join('')+'</div>';
}
function renderDashCallCard(){
  var el = document.getElementById('dash-call-card'); if(!el) return;
  if(!VIDEO_CALL.active){ el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'block';
  el.innerHTML = '<div class="consult-body"><span style="font-size:22px;">🎥</span><div><div style="font-size:14px;font-weight:700;">'+callTitle()+' · 视频沟通 进行中</div><div style="font-size:11px;color:var(--muted);">'+VIDEO_CALL.participants.join('、')+'</div></div>'+
    '<div style="margin-left:auto;"><a class="btn-primary" href="#" onclick="rejoinCall();return false;" style="padding:9px 18px;">🎥 进入会议</a></div></div>';
}

/* 来电（被呼叫方）：铃声 + 加入/拒绝；演示用案件对话房里的"模拟KR室长来电"按钮触发 */
var INCOMING_CALL = null;

function simulateIncomingCall(){
  var c = CASE_ITEMS.filter(function(x){ return x.id===ATTACHED_CASE_ID; })[0]; if(!c || !c.krInRoom || VIDEO_CALL.active) return;
  INCOMING_CALL = {caseId:c.id};
  document.getElementById('incoming-call-title').textContent = krEnterRoomName(c)+' 室长呼叫你';
  document.getElementById('incoming-call-sub').textContent = c.name+' · '+(c.caseNo||'')+' · 视频沟通';
  document.getElementById('incoming-call-overlay').classList.add('open');
}

function acceptIncomingCall(){
  document.getElementById('incoming-call-overlay').classList.remove('open');
  if(!INCOMING_CALL) return;
  var c = CASE_ITEMS.filter(function(x){ return x.id===INCOMING_CALL.caseId; })[0];
  startCall('chat', INCOMING_CALL.caseId, [ME_NAME+'（印尼室长）', (c ? c.krCoordinator : 'KM1 室长')]);
  VIDEO_CALL.status = 'connected'; seedTranscript(); renderVideoPage(); INCOMING_CALL = null;
}

function declineIncomingCall(){
  document.getElementById('incoming-call-overlay').classList.remove('open');
  INCOMING_CALL = null;
  showToast('已拒绝来电', '你拒绝了视频通话', null);
}

function closeInviteKrModal(){
  document.getElementById('invite-kr-overlay').classList.remove('open');
}

/* 查看诊疗方案 = 单独页面（CMD-1012-02 C1，不再是弹窗）；旧入口函数名保留 */
function openReportModal(){
  var c = getCurrentCase(); if(!c) return;
  nav('in-report'); renderReportPage();
}
function renderReportPage(){
  var c = getCurrentCase(), el = document.getElementById('rp-body'); if(!c || !el) return;
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;"><button class="btn-outline" onclick="goBack()">← 返回案件</button>'+
    '<div style="display:flex;gap:8px;"><button class="btn-outline" onclick="reportToPdf()">生成 PDF 并存入附件</button><button class="btn-primary" onclick="goBack();switchCaseTab(\'kr\')">查看方案 →</button></div></div>'+
    '<div class="card" style="padding:28px 36px;max-width:820px;">'+reportDocHtml(c, REPORT_SHOW_ORIG)+'</div>';
}

function closeReportModal(){ document.getElementById('report-overlay').classList.remove('open'); }


/* ---- info drawer ---- */
function openCaseInfoDrawer(){
  var c = getCurrentCase(); if(!c) return;
  document.getElementById('peek-name').textContent = '姓名：'+c.name;
  document.getElementById('peek-contact').textContent = '联系方式：'+caseBasic(c).contact;
  document.getElementById('peek-director').textContent = (c.hospitalId ? '医院：'+hospitalName(c.hospitalId,'ko')+' · ' : '')+'对接院长：'+(c.director||'—');
  document.getElementById('peek-viewall').onclick = function(){ closeCaseInfoDrawer(); openClientDetail(c.name, 'in-cases'); return false; };
  document.getElementById('peek-overlay').classList.add('open');
  document.getElementById('case-info-drawer').classList.add('open');
}

function closeCaseInfoDrawer(){
  document.getElementById('peek-overlay').classList.remove('open');
  document.getElementById('case-info-drawer').classList.remove('open');
}


/* ---- body dispatcher ---- */
/* 退款服务（CMD-1013-04 一）：基础资料 tab 顶部（接待中、基础资料未确认时也有）；只有客人有可退批次（还有剩余次数、非套餐 / 서비스）时才出现 */
function refundableBatches(name){
  var out = [];
  getClientHoldings(name).forEach(function(h){ h.batches.forEach(function(b, bi){ if(!b.refund && !b.voided && !b.pkg && !b.pkgPaid && !b.service && !b.comp && (b.bought-b.used)>0) out.push({h:h, bi:bi, b:b}); }); });
  return out;
}
function refundServiceBarHtml(c){
  if(isEnded(c) || c.visitClosed || c.subState==='cancelled' || !(c.stage==='booked' ? c.subState==='arrived' : true)) return '';
  var n = refundableBatches(c.name).length; if(!n) return '';
  return '<div style="display:flex;justify-content:flex-end;margin-bottom:8px;"><button class="btn-outline" onclick="openRefundService()">退款服务（可退批次 '+n+' 个）</button></div>';
}
var REFUND_SVC = null;
function openRefundService(){
  var c = getCurrentCase(); if(!c) return;
  REFUND_SVC = {caseId:c.id}; renderRefundService();
}
function renderRefundService(){
  var c = getCurrentCase(); if(!c) return;
  var ov = document.getElementById('refund-svc-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'refund-svc-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var inp = 'padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;';
  var rows = refundableBatches(c.name).map(function(x, i){
    var b = x.b, cur = b.currency || 'IDR', remain = b.bought-b.used, pct = (b.discountPct===undefined || b.discountPct===null) ? 100 : b.discountPct;
    return '<div style="border:1px solid var(--border2);border-radius:10px;padding:10px 12px;margin-bottom:8px;"><label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;"><input type="checkbox" class="rs-cb" data-i="'+i+'" style="margin-top:3px;"><span style="flex:1;font-size:13px;"><b>'+x.h.itemName+'</b>'+(b.spec ? '（'+b.spec+'）' : '')+'<div style="font-size:12px;color:var(--slate2);margin-top:2px;">'+b.date+' · 购买案件 '+caseNoLabel(b.caseId)+' · 已用 '+b.used+'/'+b.bought+'（剩余 '+remain+' 次将作废）'+
      (typeof b.paid==='number' ? '<br>当初实付 <b>'+formatCurrency(b.paid, cur)+'</b>'+(b.promo ? '（活动价）' : '')+(pct<100 && b.listPrice ? '　原价 '+formatCurrency(b.listPrice, cur)+'，'+discountText(pct) : '')+'；按剩余次数参考 '+formatCurrency(b.bought>0 ? Math.round(b.paid*remain/b.bought) : 0, cur) : '<br><span style="color:var(--muted);">没有记录当初实付，无法校验上限</span>')+'</div></span></label>'+
      '<div style="margin:6px 0 0 24px;font-size:12px;">退款金额（Rp，可为 0，不超过实付）：<input type="number" min="0" id="rs-amt-'+i+'" style="'+inp+'width:150px;"></div></div>';
  }).join('');
  ov.innerHTML = '<div class="modal-box" style="width:560px;max-height:84vh;overflow:auto;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-size:15px;font-weight:700;">退款服务</span><span style="cursor:pointer;" onclick="closeRefundService()">✕</span></div>'+
    '<div style="font-size:12px;color:var(--slate2);margin-bottom:8px;">勾选要退的批次（可一次退多批）；退款后这一批作废、剩余次数归零；退款记在当初购买该批次的案件上。</div>'+(rows || '<div style="font-size:12px;color:var(--muted);">没有可退的批次</div>')+
    '<div style="font-size:12px;font-weight:700;margin:10px 0 4px;">退款原因 <span style="color:#C1454A;">*</span></div><textarea id="rs-reason" rows="3" placeholder="请输入退款原因（必填）" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;"></textarea>'+
    '<div style="display:flex;gap:10px;margin-top:14px;"><button class="btn-primary" style="flex:1;" onclick="confirmRefundService()">确认退款</button><button class="btn-outline" onclick="closeRefundService()">取消</button></div></div>';
  ov.classList.add('open');
}
function closeRefundService(){ var ov = document.getElementById('refund-svc-overlay'); if(ov) ov.classList.remove('open'); }
function confirmRefundService(){
  var c = getCurrentCase(); if(!c) return;
  var list = refundableBatches(c.name), picks = [];
  [].forEach.call(document.querySelectorAll('.rs-cb'), function(cb){ if(cb.checked){ var i = parseInt(cb.getAttribute('data-i'),10), x = list[i]; if(x) picks.push({x:x, i:i}); } });
  if(!picks.length){ alert('请至少勾选一个批次'); return; }
  var reason = document.getElementById('rs-reason').value.trim(); if(!reason){ alert('请填写退款原因'); return; }
  for(var n = 0; n < picks.length; n++){
    var raw = document.getElementById('rs-amt-'+picks[n].i).value.trim(), amt = Number(raw), b = picks[n].x.b;
    if(raw==='' || isNaN(amt) || amt<0){ alert('请填写「'+picks[n].x.h.itemName+'」的退款金额（数字，可为 0）'); return; }
    if(typeof b.paid==='number' && amt > b.paid){ alert('「'+picks[n].x.h.itemName+'」退款金额不能超过当初实付 '+formatCurrency(b.paid, b.currency||'IDR')); return; }
    picks[n].amt = amt;
  }
  var names = [], today = todayStr(), cl = clientByName(c.name);
  picks.forEach(function(p){
    var b = p.x.b, h = p.x.h, amt = p.amt;
    b.voidedRemaining = b.bought-b.used; b.voided = true; b.refund = {amount:amt, currency:b.currency||'IDR', reason:reason, date:today, viaCaseId:c.id};
    var pc = CASE_ITEMS.filter(function(y){ return y.id===b.caseId; })[0];
    var line = '退款服务：'+h.itemName+(b.spec ? '（'+b.spec+'）' : '')+'（'+b.date+' 购买，案件 '+caseNoLabel(b.caseId)+'，剩余 '+b.voidedRemaining+' 次作废），退款 '+formatCurrency(amt, b.currency||'IDR')+'，原因：'+reason+'；办理案件 '+(c.caseNo||'');
    if(pc){ pc.holdingRefunds = pc.holdingRefunds || []; pc.holdingRefunds.push({itemName:h.itemName, amount:amt, reason:reason, date:today, qty:b.voidedRemaining||0, viaCaseId:c.id}); logCaseEvent(pc, ME_NAME, line+'；退款记在本案件，结局不变'); }
    if(!pc || pc.id!==c.id) logCaseEvent(c, ME_NAME, line);
    if(cl){ cl.timeline = cl.timeline || []; cl.timeline.push({stage:'退款服务', actor:ME_NAME, actorId:currentAccountId(), action:line, dt:nowFullDt(), kind:'plain'}); }
    names.push(h.itemName);
  });
  c.refundVisit = {fromCaseId:picks[0].x.b.caseId, itemName:names.join('、'), amount:picks.reduce(function(s,p){ return s+p.amt; }, 0)};
  closeRefundService();
  buildCaseLog(c); renderCaseBody(c);
  openRefundOnlyAsk();
}
function openRefundOnlyAsk(){
  var ov = document.getElementById('refund-only-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'refund-only-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = '<div class="modal-box" style="width:400px;"><div style="font-size:15px;font-weight:700;margin-bottom:8px;">这次只办退款吗？</div><div style="font-size:13px;color:var(--slate2);margin-bottom:14px;">选「是」案件直接结束，结局为已取消（仅办理退款）；选「还有别的」关闭弹窗，照常接待。</div><div style="display:flex;gap:10px;"><button class="btn-primary" style="flex:1;" onclick="refundOnlyAnswer(true)">是，只办退款</button><button class="btn-outline" style="flex:1;" onclick="refundOnlyAnswer(false)">还有别的</button></div></div>';
  ov.classList.add('open');
}
function refundOnlyAnswer(yes){
  var ov = document.getElementById('refund-only-overlay'); if(ov) ov.classList.remove('open');
  var c = getCurrentCase(); if(!c || !yes) return;
  c.endNote = '仅办理退款'; logCaseEvent(c, ME_NAME, '这次只办退款，案件结束');
  autoFinish(c, '未购买未使用');
}
function renderCaseBody(c){
  var el = document.getElementById('case-body');
  if(c.stage==='booked' && c.subState==='waiting'){
    el.style.display = 'none';
    return;
  }
  el.style.display = 'flex';
  if(c.subState==='cancelled'){
    el.innerHTML = '<div class="card" style="padding:22px 24px;">'+
      '<div class="info-heading" style="margin-bottom:10px;">'+(c.noShow ? '未到店（已取消）' : '预约已取消')+'</div>'+
      '<div style="font-size:13px;color:var(--slate2);line-height:1.8;">性别：'+caseBasic(c).gender+'　出生日期：'+caseBasic(c).dob+'<br>联系方式：'+caseBasic(c).contact+'　病史过敏史：'+caseBasic(c).history+'</div>'+
      '<div style="font-size:11px;color:var(--muted);margin-top:10px;">资料已保留，客人重新预约后可继续跟进</div>'+
      '</div>'+'<div><div class="info-heading" style="margin:14px 0 10px;">Timeline</div>'+caseTimelineCardHtml(c)+'</div>';
    return;
  }
  if(!c.materialsConfirmed){ el.innerHTML = refundServiceBarHtml(c)+materialsCardHtml(c)+'<div><div class="info-heading" style="margin:14px 0 10px;">Timeline</div>'+caseTimelineCardHtml(c)+'</div>'; return; } /* 基础资料确认前没有 tab，Timeline 仍挂在下面 */
  normalizeCaseTab(c);
  el.innerHTML = caseTabsHtml(c) + (c.activeCaseTab==='basic' ? refundServiceBarHtml(c) : '') + caseTabContentHtml(c);
}

function resumeVisit(targetId){
  var c = getCurrentCase(); if(!c || c.materialsConfirmed) return;
  var t = CASE_ITEMS.filter(function(x){ return x.id===targetId; })[0]; if(!t) return;
  if(!confirm('接续到原案件 '+t.caseNo+'？本次新案件 '+c.caseNo+' 将作废（不留记录）。')) return;
  RESUMED_VISITS.push({name:c.name, date:c.visitDate, time:c.visitTime, purpose:c.visitPurpose, caseId:t.id, origCaseNo:t.caseNo, voidedCaseNo:c.caseNo}); /* 日历上这条预约来访改挂到原案件，显示已到访 */
  CASE_ITEMS.splice(CASE_ITEMS.indexOf(c), 1);
  logCaseEvent(t, ME_NAME, '接续到访「'+ME_NAME+'」 '+tkU(nowFullDt()));
  CASE_RETURN.length = 0;
  if(typeof buildCaseTabs==='function'){ buildCaseTabs(); renderCaseRows(); }
  openCaseDetail(t.id, true);
}

/* 取消接待（2026-09-29 新增）：只在生成 Case ID 之前（materialsCardHtml 渲染期间）可用，
   丢弃本次填写的全部草稿，案件回到"待访问"，日历上对应的预约来访恢复原色去掉"已到访" */
function openCancelIntakeModal(){
  document.getElementById('cancel-intake-overlay').classList.add('open');
}

function closeCancelIntakeModal(){
  document.getElementById('cancel-intake-overlay').classList.remove('open');
}

/* 案件页头两行（CMD-1013-09 一）：第一行「客人名（点进客户详情）· 第 N 次来访」；第二行小字「Case ID · 对接院长」，不显示医院名 */
function caseVisitNo(c){
  if(c.subState!=='arrived') return 0; /* 本案件还没到店：不显示 */
  var list = CASE_ITEMS.filter(function(x){ return x.name===c.name && x.subState==='arrived'; }).sort(function(a, b){ return ((a.visitDate||'')+' '+(a.visitTime||'')).localeCompare((b.visitDate||'')+' '+(b.visitTime||'')) || String(a.caseNo).localeCompare(String(b.caseNo)); });
  return list.findIndex(function(x){ return x.id===c.id; })+1;
}
function openClientFromCase(){ var c = getCurrentCase(); if(c) openClientDetail(c.name, 'in-casedetail'); }
function renderCaseTitle(c){
  var el = document.getElementById('case-title'); if(!el) return; var n = caseVisitNo(c);
  el.innerHTML = '<a href="#" onclick="openClientFromCase();return false;" style="color:inherit;text-decoration:underline;text-decoration-style:dotted;">'+String(c.name).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</a>'+(n ? ' · 第 '+n+' 次来访' : '');
}
function renderCaseSubtitle(c){
  var el = document.getElementById('case-subtitle'); if(!el) return;
  renderCaseTitle(c);
  var html = (c.caseNo||'')+(c.director ? ' · 对接院长：'+c.director : '');
  if(c.linkedCase && c.linkedCase.caseId){
    var src = CASE_ITEMS.filter(function(x){ return x.id===c.linkedCase.caseId; })[0];
    html += (html ? ' · ' : '')+'关联：<a href="#" class="info-link" onclick="openCaseDetail(\''+c.linkedCase.caseId+'\');return false;">'+(src&&src.caseNo?src.caseNo:c.linkedCase.caseId)+'</a>（'+c.linkedCase.reason+(c.linkedCase.auto?'，自动关联':'')+'）';
  }
  el.innerHTML = html;
}

var REL_OPEN = {};

function toggleRelExpand(key){ REL_OPEN[key] = !REL_OPEN[key]; var c = getCurrentCase(); if(c) renderCaseBody(c); }

/* 关联案件tab的［查看案件］（2026-10-02）：打开那个案件；进行中 → 在案件里打开对话；已终态 → 打开附件里的"对话记录（文本）" */
/* 页面打开方式（2026-10-02·三）：［查看案件］［转到案件对话］一律新标签页打开；转到案件对话 = 新标签页打开案件页并自动展开对话窗口（?case=A000xxx&chat=open） */
function caseUrl(id, extra){
  var c = CASE_ITEMS.filter(function(x){ return x.id===id; })[0];
  return location.pathname + '?case=' + encodeURIComponent(c ? (c.caseNo || c.id) : id) + (extra||'');
}

function openCaseNewTab(id, extra){ window.open(caseUrl(id, extra), '_blank'); }

function openCaseChatNewTab(id){
  var c = CASE_ITEMS.filter(function(x){ return x.id===id; })[0]; if(!c) return;
  if(!CHAT_DATA.hasOwnProperty(getCaseRoomId(id)) && !caseRoomEligible(c)){ alert('这个案件还没到建房条件（面诊案件缴费或免除后、不面诊案件基础资料确认后才能开对话房）'); return; }
  openCaseNewTab(id, '&chat=open');
}

/* 意向项目选择弹窗（2026-09-29 新增）：赴韩/本地项目都能多选，选中即时存进 c.intentionProjects（快照 name+origin） */
var INTENTION_PICKER_FILTER = 'KR';

/* 意向项目只列赴韩手术项目（CMD-1013-02 一）：没有本地项目，也没有消肿管理 / 拆线 / 术后复诊检查 / 伤口护理这几类术后管理（韩国术后管理分类、同名项目都不列） */
var INTENT_EXCLUDE_NAMES = ['术后消肿管理', '消肿管理', '术后管理', '拆线', '术后复诊检查', '术后复诊', '伤口护理'];
function intentSurgeryProjects(c){ return PROJECT_LIBRARY.filter(function(p){ return p.origin==='KR' && p.active && (!c.hospitalId || p.hospitalId===c.hospitalId) && !isKrPostcareCat(p.categoryId) && INTENT_EXCLUDE_NAMES.indexOf(p.name)<0; }); }
function openIntentionPickerModal(){
  var c0 = getCurrentCase(); INTENTION_PICKER_FILTER = 'KR';
  renderIntentionPickerModal();
  document.getElementById('intention-project-overlay').classList.add('open');
}

function closeIntentionPickerModal(){ document.getElementById('intention-project-overlay').classList.remove('open'); }

function renderIntentionPickerModal(){
  var c = getCurrentCase(); if(!c) return;
  document.getElementById('intention-picker-tabs').innerHTML = '<span style="font-size:11px;color:var(--muted);">只列赴韩手术项目</span>';
  var catalog = intentSurgeryProjects(c);
  document.getElementById('intention-picker-list').innerHTML = catalog.map(function(p){
    var checked = (c.intentionProjects||[]).some(function(it){ return it.projectId===p.id; });
    return '<label style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid var(--border2);font-size:13px;cursor:pointer;">'+
      '<input type="checkbox" onchange="toggleIntentionProject(\''+p.id+'\')" '+(checked?'checked':'')+'>'+
      '<span style="flex-grow:1;">'+p.name+'</span></label>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">没有匹配的项目</div>';
}

function toggleIntentionProject(projectId){
  var c = getCurrentCase(); if(!c) return;
  c.intentionProjects = c.intentionProjects || [];
  var idx = c.intentionProjects.findIndex(function(it){ return it.projectId===projectId; });
  if(idx>-1) c.intentionProjects.splice(idx,1);
  else {
    var p = projById(projectId); if(!p) return;
    if(p.origin!=='KR' || INTENT_EXCLUDE_NAMES.indexOf(p.name)>-1) return;
    c.intentionProjects.push({projectId:p.id, name:p.name, origin:p.origin});
  }
  renderIntentionPickerModal();
  renderCaseBody(c);
}

function simulateMetaviewReady(){
  var c = getCurrentCase(); if(!c || c.metaviewStatus==='ready' || c.metaviewStatus==='checking') return;
  c.metaviewStatus = 'checking';
  renderCaseBody(c);
  setTimeout(function(){
    var cc = getCurrentCase(); if(!cc || cc.id!==c.id) return;
    cc.metaviewStatus = 'ready';
    cc.materialsError = '';
    logCaseEvent(cc, '메타뷰系统', '检测完成，数据已同步');
    buildCaseLog(cc);
    renderCaseBody(cc);
  }, 1200);
}

function closeMaterialsMissing(){ document.getElementById('materials-missing-overlay').classList.remove('open'); }

function confirmMaterials(){
  var c = getCurrentCase(); if(!c) return;
  var concernVal = document.getElementById('cf-concern').value.trim();
  var expectationVal = document.getElementById('cf-expectation').value.trim();
  var missing = [];
  if(c.metaviewStatus !== 'ready') missing.push('메타뷰检测');
  if(!c.photoUploaded) missing.push('照片');
  if(!c.videoUploaded) missing.push('视频');
  if(!concernVal) missing.push('苦恼');
  if(!expectationVal) missing.push('希望预期');
  if(intentKrAllowed(c) && !(c.intentionProjects||[]).length) missing.push('意向项目');
  var ciM = continuationInfo(c);
  if(ciM && ciM.overdue) c.needsConsult = true; /* 超过1个月：只能面诊 */
  if(c.needsConsult!==true && c.needsConsult!==false && !(c.needsConsult==='reuse' && reusableReportSrc(c))) missing.push('面诊需求');
  if(c.linkedCase && c.linkedCase.caseId && !c.linkedCase.reason) missing.push('关联原因');
  syncDirectorChoice(c);
  if(c.needsConsult===true && !c.hospitalId) missing.push('医院');
  if(c.needsConsult===true && !c.director) missing.push('院长');
  if(missing.length){
    c.materialsError = '';
    document.getElementById('materials-missing-list').innerHTML = missing.map(function(x){ return '· '+x; }).join('<br>');
    document.getElementById('materials-missing-overlay').classList.add('open'); /* 缺必填项：弹 popup 提示哪几项没填 */
    return;
  }
  c.concern = concernVal;
  c.expectation = expectationVal;
  c.materialsError = '';
  c.materialsConfirmed = true;
  c.materialsDate = todayStr();
  applyCaseLink(c); /* Case ID 已在预约时生成，这里不再生成 */
  renderCaseSubtitle(c);
  document.getElementById('case-chat-actions').style.display = 'flex';
  if(c.needsConsult==='reuse'){
    applyReuseReport(c); /* 沿用之前诊疗方案：不产生面诊费卡片，直接进入"项目确认中" */
  } else if(c.needsConsult===true){
    /* 选了面诊，直接进面诊资料tab走缴费，不需要再多点一次"面诊申请" */
    c.consultRequested = true;
    c.consultStatus = 'awaiting_payment';
    recordConsultFee(c); /* 选面诊：把当下的面诊费记进案件（面诊费卡和财务栏读这个金额） */
    c.activeCaseTab = 'consult';
  } else {
    /* 选了不面诊 → 主状态"选择项目"，自动打开本地管理tab，先给"持有项目使用/新增项目"两个入口（IN-CASE-01） */
    c.projectsEnabled = true;
    c.entryChoicePending = true;
    c.activeCaseTab = 'localmgmt';
  }
  updateCaseStage(c);
  renderCaseStatusBar(c);
  logCaseEvent(c, ME_NAME, '确认了메타뷰/照片/视频/苦恼/希望预期，面诊需求：'+(c.reuseReport ? '沿用之前诊疗方案（'+c.reuseReport.caseNo+'）' : (c.needsConsult?'面诊':'不面诊')));
  buildCaseLog(c);
  renderCaseBody(c);
}

/* Tab 出现时机（IN-CASE-01）：项目列表=面诊案件报告出来后；本地管理=本地案件确认后，或面诊/赴韩案件点"+添加本地管理"后 */
/* Tab 出现时机（CMD-1012-11）：赴韩施术 = 面诊案件出诊疗方案后（或已有赴韩项目）；本地管理 = 有本地项目；结算 = 有任何一张结算单。「项目列表」tab 已并入赴韩施术 / 本地管理 */
function showKrTab(c){ return (!!c.projectsEnabled && !!c.reportReady) || (!!c.settlementDone && krAllItems(c).length>0); }
function showProjectsTab(c){ return showKrTab(c); } /* 旧名称，指向赴韩施术 */
function showSettleTab(c){ return (c.settlementBatches||[]).length>0 || !!(c.localMgmt && (c.localMgmt.batches||[]).length); }

function showLocalTab(c){ return isLocalCase(c) || !!c.localMgmt || localCarried(c) || localPurchasedBatches(c).length>0; }

function showRelatedTab(c){ return !!(c.linkedCase && c.linkedCase.caseId); } /* 只有往前关联的案件才有关联案件 tab */

/* ---- 案件终态（2026-10-02·六）：对话房整理进附件（对话记录（文本）+ 📁 里文件的链接，不复制文件；录像和AI文本本来就在面诊资料附件里），然后删除房间，
   对话抽屉里不再出现；作废的案件没有房间 ---- */
function archiveCaseRoom(c){
  if(typeof CHAT_DATA==='undefined') return;
  var roomId = getCaseRoomId(c.id);
  if(!CHAT_DATA.hasOwnProperty(roomId)) return;
  var msgs = CHAT_DATA[roomId];
  var lines = msgs.map(function(m){
    var who = m.kind==='sys' ? '系统' : msgSender(m);
    return '['+m.day+' '+msgTime(m)+'] '+who+'：'+(m.kind==='quote' ? '（引用）'+m.speaker+'：'+m.orig : (m.orig||''));
  });
  var files = msgs.filter(function(m){ return m.kind==='file'; }).map(function(m){ return m.fname; });
  c.chatArchive = {text:lines.join('\n'), files:files, date:attDate()};
  delete CHAT_DATA[roomId];
  if(CURRENT_ROOM===roomId && document.getElementById('chat-float-overlay')) closeFloat();
  logCaseEvent(c, '系统', '案件结束：对话房已整理进附件（对话记录+文件链接）并删除');
  try{ if(document.getElementById('drawer-list')) renderDrawerList(); }catch(e){}
}

function openChatArchive(caseId){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0]; if(!c || !c.chatArchive) return;
  document.getElementById('chat-archive-text').textContent = c.chatArchive.text || '（空）';
  document.getElementById('chat-archive-overlay').classList.add('open');
}

function closeChatArchive(){ document.getElementById('chat-archive-overlay').classList.remove('open'); }

function mockUploadAttachment(){
  var c = getCurrentCase(); if(!c) return;
  c.manualAttachments = c.manualAttachments || [];
  var cat = (document.getElementById('att-cat')||{}).value || '基础资料';
  c.manualAttachments.push({label:'补充附件 '+(c.manualAttachments.length+1)+'.pdf', src:cat, date:attDate()});
  logCaseEvent(c, ME_NAME, '上传了附件（'+cat+'）');
  buildCaseLog(c);
  renderCaseBody(c);
}

function editConcernField(field){
  var c = getCurrentCase(); if(!c) return;
  var label = field==='concern' ? '苦恼' : '期望';
  var val = prompt('修正'+label, c[field]||'');
  if(val===null) return;
  c[field] = val;
  renderCaseBody(c);
}

function confirmConsultFee(){
  var c = getCurrentCase(); if(!c) return;
  if(!c.hospitalId || !c.director){ alert('请先选择院长'); return; }
  if(c.addConsultMode && intentKrAllowed(c) && !(c.intentionProjects||[]).length){ alert('请先填意向项目（至少一个）'); return; }
  var d = feeDraft(c);
  if(d.locked && d.mode==='waive'){ alert('距原案件报告日期已超过1个月，不能免除面诊费'); return; }
  if(d.mode==='paid'){ markConsultPaid(); return; }
  if(!d.reason){ alert('请选择免除原因'); return; }
  if(d.reason==='其他' && !(d.note||'').trim()){ alert('请注明原因'); return; }
  applyWaiveFee(c, d.reason, (d.note||'').trim());
}

function localAskAnswer(yes){
  var c = getCurrentCase(); if(!c || !c.localAsk) return;
  document.getElementById('local-ask-overlay').classList.remove('open');
  c.localAsk = false;
  if(!yes){ logCaseEvent(c, ME_NAME, '客人不做/不增加本地项目'); c.endNote = '客人不做项目'; autoFinish(c, '未购买未使用'); return; } /* 有购买→已结案；没有→仅出报告 */
  logCaseEvent(c, ME_NAME, '客人要做/增加本地项目，在本案件内继续走本地流程');
  c.localTrack = true;
  c.entryChoicePending = true; c.projectEntryMode = null;
  c.projectsLocked = false; c.recommended = []; c.projectOriginFilter = 'IN'; c.activeCaseTab = 'localmgmt';
  updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
}

/* 使用：勾选+填次数→从最早批次扣→记Timeline→进入"本地管理"（不再直接结案） */
function submitHoldingsUse(scope){
  var c = getCurrentCase(); if(!c) return;
  var ctx = ctxOf(c, scope); if(!ctx) return;
  var holdings = clientHoldingsSorted(c.name);
  var today = todayStr();
  var used = [];
  /* 先检查：勾选了的项目如果有「使用时选」的选项，必须选好再扣次数（模式 / 部位 / 营养针种类） */
  var missOpt = holdings.filter(function(h,i){ var ce = document.getElementById('hold-check-'+scope+'-'+i), oe = document.getElementById('hold-opt-'+scope+'-'+i); return ce && ce.checked && oe && !oe.value; })[0];
  if(missOpt){ alert('「'+missOpt.itemName+'」使用时要先选好选项（模式 / 部位 / 种类）'); return; }
  holdings.forEach(function(h,i){
    var checkEl = document.getElementById('hold-check-'+scope+'-'+i);
    if(!checkEl || !checkEl.checked) return;
    var qty = parseInt(document.getElementById('hold-qty-'+scope+'-'+i).value, 10) || 0;
    if(qty<=0) return;
    var optEl = document.getElementById('hold-opt-'+scope+'-'+i), optVal = optEl ? optEl.value : '';
    var srcIds = holdingSourceCaseIds(h, qty);
    var actual = useHolding(c.name, h.itemName, c.id, today, qty, scope, optVal);
    if(actual>0 && h.category==='术后管理' && !c.linkedCase){
      var srcId = srcIds.filter(function(id){ return id!==c.id; })[0];
      if(srcId){ c.visibleToKR = true; c.linkedCase = {caseId:srcId, reason:'术后管理', auto:true}; logCaseEvent(c, '系统', '使用了 '+caseNoLabel(srcId)+' 的术后管理项目，自动关联该案件'); renderCaseSubtitle(c); }
    }
    if(actual>0){
      ctx.mgmtUses = ctx.mgmtUses || [];
      ctx.mgmtUses.push({itemName:h.itemName, qty:actual, date:today, opt:optVal||undefined});
      logCaseEvent(c, ME_NAME, (scope==='lm'?'本地管理：':'')+'使用了'+h.itemName+(optVal ? '（'+optEl.options[0].text.replace('选择','')+'：'+optVal+'）' : '')+' '+actual+'次，剩余'+holdingRemaining(h)+'次');
      used.push(h.itemName);
    }
  });
  if(!used.length){ alert('请至少勾选一项持有项目'); return; }
  ctx.mgmtActive = true; ctx.mgmtDone = false; ctx.mgmtStatus = null; ctx.addUse = false;
  if(scope==='main'){ c.entryChoicePending = false; c.activeCaseTab = isLocalCase(c) ? 'localmgmt' : 'kr'; }
  else { ctx.step = 'active'; }
  updateCaseStage(c);
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

/* 已出诊疗方案后，客人决定不做项目（不赴韩也不做本地）：二次确认 → 按结局推算（没买本地项目 → 仅出报告） */
function noProjectForClient(){
  var c = getCurrentCase(); if(!c) return;
  if(!confirm('确认客人不做任何项目？案件将按结局结束（仅出报告）。')) return;
  logCaseEvent(c, ME_NAME, '客人不做项目');
  c.endNote = '客人不做项目'; /* 仅出报告的原因（列表进程栏显示） */
  autoFinish(c, '未购买未使用');
}

/* 新增项目里"本次不购买"：判断本 case 是否有购买——有→已结案，无→已取消（未购买未使用） */
function noPurchaseThisTime(){
  var c = getCurrentCase(); if(!c) return;
  if(!confirm('确认本次不购买项目？')) return;
  logCaseEvent(c, ME_NAME, '本次不购买项目');
  c.endNote = '客人不做项目';
  autoFinish(c, '未购买未使用');
}

/* 标记项目行：action 'done' / 'cancelled'；all=true 时作用于全部进行中的项目，否则作用于勾选的 */
function markMgmtRows(scope, action, all, oneIdx){
  var c = getCurrentCase(); if(!c) return;
  var ctx = ctxOf(c, scope); if(!ctx) return;
  var uses = ctx.mgmtUses||[];
  var idxs = oneIdx!==undefined ? [oneIdx] : all
    ? uses.map(function(u,i){ return localItemStatus(u)==='进行中' ? i : -1; }).filter(function(i){ return i>-1; })
    : Array.prototype.slice.call(document.querySelectorAll('.mgmt-cb-'+scope)).filter(function(cb){ return cb.checked; }).map(function(cb){ return parseInt(cb.value,10); });
  if(!idxs.length){ alert('没有要标记的项目'); return; }
  if(oneIdx!==undefined && action==='cancelled' && !confirm('确认取消这一项？未做的次数会归还持有项目（不是退款）。')) return;
  var returned = 0, names = [];
  idxs.forEach(function(i){
    var u = uses[i]; if(!u || localItemStatus(u)!=='进行中') return;
    names.push(u.itemName);
    if(action==='done'){ u.status = 'done'; }
    else { u.status = 'cancelled'; u.cancelQty = u.qty; returnHolding(c.name, u.itemName, c.id, u.qty, scope); returned += u.qty; } /* 次数归还持有，不是退款 */
  });
  logCaseEvent(c, ME_NAME, (scope==='lm'?'本地管理：':'')+(action==='done'?'标记完成：':'标记取消（次数已归还持有，不是退款）：')+names.join('、'));
  if(returned>0) alert('已归还 '+returned+' 次到客户持有项目（这不是退款）');
  if(uses.some(function(u){ return localItemStatus(u)==='进行中'; })){ buildCaseLog(c); renderCaseBody(c); return; }
  /* 全部项目都标完：这一次本地管理结束 */
  var anyDone = uses.some(function(u){ return u.status==='done'; });
  var anyCancelled = uses.some(function(u){ return u.status==='cancelled'; });
  ctx.mgmtDone = anyDone;
  ctx.mgmtStatus = !anyCancelled ? 'done' : (anyDone ? 'cancelled_partial' : 'cancelled_all');
  ctx.mgmtActive = false; ctx.mgmtCancelling = false;
  if(scope==='lm') return afterLmFinished(c);
  if(mainlineOngoing(c)){ logCaseEvent(c, '系统', '本地管理已做完；面诊 / 赴韩还在进行，案件不自动结案'); updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c); return; }
  autoFinish(c, '管理取消');
}

function mgmtComplete(scope){
  if(!confirm('确认全部进行中的项目都已完成？')) return;
  markMgmtRows(scope, 'done', true);
}

function startMgmtCancel(scope){
  if(!confirm('确认取消全部进行中的项目？未做的次数会归还持有项目（不是退款）。')) return;
  markMgmtRows(scope, 'cancelled', true);
}

/* 在项目库查看：新标签页打开项目库（案件里点进来都开新标签页） */
/* 查看相关案例：新标签页打开该项目的案例列表（?page=in-library&project=ID） */
function openProjectCasesNewTab(pid){ window.open(location.pathname+'?page=in-library&project='+pid, '_blank'); }

function openProjectLibNewTab(){ window.open(location.pathname+'?page=in-projectlibrary', '_blank'); }

/* 流程中的退款（总览第5节，2026-09-30）：结算单上「取消项目」→ 勾选未开始的赴韩项目 → 退款弹窗（金额手填可为0 + 退款原因必填）
   → 项目变成"已取消"（不从 procedureItems 删，行状态=已取消），结算单变成部分/全额退款；
   还有赴韩项目照常继续；没有了则弹窗问"是否做本地管理"（是→同案件走本地流程；否→仅出报告）；
   已到医院之后 IN 不能再主动取消项目（按钮隐藏），只能由 KR 发起（无法施术/更换项目）。
   退款只处理赴韩项目（本地项目退款在客户详情"持有项目"卡片，见 openHoldingRefundModal） */
var REFUND_PENDING_ITEMS = [];

var REFUND_MODE = 'normal';

var REFUND_SELECTABLE = false;

function openCancelItems(batchId){
  var c = getCurrentCase(); if(!c || c.hasArrived || c.visitClosed) return;
  var paidIds = (c.settlementBatches||[]).filter(function(b){ return b.status!=='unpaid'; }).map(function(b){ return b.id; });
  var items = krNotStartedItems(c).filter(function(it){ return batchId ? it.batchId===batchId : paidIds.indexOf(it.batchId)>-1; }); /* 不传批次 = 赴韩施术 tab 的［取消项目］：所有已付款的未开始赴韩项目；和结算单上的［取消项目］走同一个流程 */
  if(!items.length) return;
  openRefundModal(items, 'normal', true);
}

function refundRecalc(){
  var sum = 0;
  Array.prototype.slice.call(document.querySelectorAll('.refund-cb')).forEach(function(cb){
    if(cb.checked){ var it = REFUND_PENDING_ITEMS[parseInt(cb.value,10)]; if(it) sum += Math.round(it.price*KR_DEPOSIT_RATE); }
  });
  document.getElementById('refund-amount').value = sum;
  refundMethodRender();
}

function openRefundModal(items, mode, selectable, amountOverride){
  REFUND_PENDING_ITEMS = items;
  REFUND_MODE = mode || 'normal';
  REFUND_SELECTABLE = !!selectable;
  var suggest = (amountOverride!==undefined) ? amountOverride : (selectable ? 0 : items.reduce(function(sum,it){ return sum+Math.round(it.price*KR_DEPOSIT_RATE); }, 0));
  var cArr = getCurrentCase(); var arrivedHint = (cArr && cArr.hasArrived) ? '<div style="font-size:12px;font-weight:700;color:var(--terracotta);margin-bottom:8px;">金额按 KR 室长判断填写</div>' : '';
  document.getElementById('refund-items').innerHTML = arrivedHint + (mode==='diffRefund' ? '<div style="font-size:13px;margin-bottom:8px;">按实际项目重算后，定金多收的差额需要退还</div>' : '') + (mode==='krCannot' ? '<div style="font-size:13px;margin-bottom:8px;">KR判断不能施术：退定金（全部退回 / 不退由KR室长判断），退款后案件按结局推算（仅出报告）</div>' : '') + (selectable ? '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">勾选要取消的项目（只能取消"未开始"的赴韩项目）</div>' : '')+
    items.map(function(it,i){
    var cb = selectable ? '<input type="checkbox" class="refund-cb" value="'+i+'" onchange="refundRecalc()" style="margin-right:8px;">' : '';
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+cb+it.name+'</span><span style="font-size:12px;color:var(--muted);">参考预付金 '+formatCurrency(Math.round(it.price*KR_DEPOSIT_RATE),'KRW')+'</span></div>';
  }).join('')+'<div style="font-size:11px;color:var(--muted);margin-top:6px;">退多少由室长决定（有的项目可退、有的不可退，金额可以为0），上面的预付金仅供参考</div>';
  document.getElementById('refund-amount').value = suggest;
  REFUND_METHOD = 'refund'; refundMethodRender();
  document.getElementById('refund-reason').value = '';
  var rn = document.getElementById('refund-note'); if(rn) rn.value = '';
  document.getElementById('refund-overlay').classList.add('open');
}

/* CMD-1014-03：［取消项目］［无法协调］的退款方式：退钱 / 转本地项目（置换） */
var REFUND_METHOD = 'refund';
function refundMethodRender(){
  var box = document.getElementById('refund-method'); if(!box) return;
  if(['normal','cannotCoordinate'].indexOf(REFUND_MODE)<0){ box.style.display = 'none'; box.innerHTML = ''; return; }
  var amt = Number((document.getElementById('refund-amount')||{}).value) || 0, credit = Math.round(amt * FX_RATES.KRW_IDR);
  box.style.display = 'block';
  box.innerHTML = '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">退款方式</div><label style="margin-right:16px;font-size:13px;"><input type="radio" name="refund-method" '+(REFUND_METHOD==='refund'?'checked ':'')+'onchange="setRefundMethod(\'refund\')"> 退钱</label><label style="font-size:13px;"><input type="radio" name="refund-method" '+(REFUND_METHOD==='comp'?'checked ':'')+'onchange="setRefundMethod(\'comp\')"> 转本地项目（置换）</label>'+
    (REFUND_METHOD==='comp' ? '<div id="refund-comp-hint" style="font-size:12px;color:#8F6F0C;margin-top:6px;">置换额度 = 上面的金额 × '+FX_RATES.KRW_IDR+' = <b>'+formatCurrency(credit,'IDR')+'</b>；确定后直接进本地管理的选购画面，要一次用完，超过的补付，买到的项目不可退款。</div>' : '');
}
function setRefundMethod(m){ REFUND_METHOD = m; refundMethodRender(); }
function closeRefundModal(){ document.getElementById('refund-overlay').classList.remove('open'); }

function confirmRefund(){
  var c = getCurrentCase(); if(!c) return;
  var raw = document.getElementById('refund-amount').value.trim();
  var amount = Number(raw);
  var chosen = REFUND_PENDING_ITEMS;
  if(REFUND_SELECTABLE){
    chosen = Array.prototype.slice.call(document.querySelectorAll('.refund-cb')).filter(function(cb){ return cb.checked; }).map(function(cb){ return REFUND_PENDING_ITEMS[parseInt(cb.value,10)]; });
    if(!chosen.length){ alert('请至少勾选一个要取消的项目'); return; }
  }
  if(raw==='' || isNaN(amount) || amount<0){ alert('请填写退款金额（数字，可为 0）'); return; }
  var reason = document.getElementById('refund-reason').value.trim();
  if(!reason){ alert('请填写退款原因'); return; }
  var refNote = ((document.getElementById('refund-note')||{}).value||'').trim();
  var names = [], batchIds = [];
  var mode0 = REFUND_MODE;
  chosen.forEach(function(it){
    if(it.cancelled || c.procedureItems.indexOf(it)<0) return;
    it.cancelled = true; /* 项目变成"已取消"，保留在案件里 */
    names.push(it.name);
    if(batchIds.indexOf(it.batchId)<0) batchIds.push(it.batchId);
  });
  if(!names.length && mode0!=='diffRefund'){ closeRefundModal(); return; }
  var hadKr = chosen.some(function(it){ return it.cancelled; });
  if(mode0==='diffRefund'){ (c.settlementBatches||[]).forEach(function(b){ if(b.krDeposit>0) batchIds.push(b.id); }); }
  c.refunds = c.refunds || [];
  var compMode = REFUND_METHOD==='comp' && ['normal','cannotCoordinate'].indexOf(mode0)>-1;
  if(compMode && !(amount>0)){ alert('转本地项目（置换）的金额要大于 0'); chosen.forEach(function(it){ if(names.indexOf(it.name)>-1) it.cancelled = false; }); return; }
  c.refunds.push({amount:amount, currency:'KRW', reason:reason, date:todayStr(), items:names, batchIds:batchIds, afterArrival:!!c.hasArrived, note:refNote, comp:compMode});
  if(mode0==='cannotCoordinate') logCaseEvent(c, ME_NAME, '室长点［无法协调］：施术日期始终无法协调，取消全部未完成赴韩项目并退款'); /* 供测试覆盖页判断 D29（CMD-1012-06 补） */
  logCaseEvent(c, ME_NAME, (mode0==='diffRefund' ? '按KR判断退还尾款差额 ' : '取消项目"'+names.join('、')+'"，'+(compMode ? '转本地置换 ' : '退款 '))+formatCurrency(amount,'KRW')+'，'+(compMode ? '置换' : '退款')+'原因：'+reason+(refNote ? '；备注：'+refNote : '')+(c.hasArrived ? '（金额按KR室长判断）' : ''));
  REFUND_PENDING_ITEMS = [];
  closeRefundModal();
  if(mode0==='diffRefund'){ /* 尾款多退少补：退差额后视为尾款已结清 */
    c.krBalancePaid = true; if(c.krJudge) c.krJudge.settled = true;
    if(finalizeInnCare(c).length){ logCaseEvent(c, actingName(), '行程已确认：术后管理印尼部分（套餐内含）已转为客人持有项目'); }
    buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
    return;
  }
  if(mode0==='krCannot'){ /* KR判断不能施术 → 退定金 → 仅出报告（不再问本地管理） */
    c.endNote = '退定金';
    finishCase(c, '未购买未使用');
    return;
  }
  if(compMode){ startCompPurchase(c, amount, reason, names); return; }
  afterKrItemsChanged(c);
}

function openLocalAskModal(c){
  var hasLocal = localPurchasedBatches(c).length>0;
  document.getElementById('local-ask-title').textContent = hasLocal ? '是否做本地项目？' : '是否增加本地项目？';
  document.getElementById('local-ask-text').textContent = hasLocal
    ? '已保留本案件的本地项目/术后管理。是 → 同一案件进入本地管理；否 → 已结案（本次有购买）'
    : '赴韩项目已全部取消。是 → 选购付款后进入本地管理；否 → 仅出报告（本次没有购买）';
  document.getElementById('local-ask-overlay').classList.add('open');
}

function openLocalKeepModal(c){
  document.getElementById('local-keep-list').innerHTML = localPurchasedBatches(c).map(function(x){
    return '· '+x.h.itemName+' ×'+x.b.bought+(x.h.category==='术后管理'?'（术后管理）':'')+(x.b.used>0?'　已用 '+x.b.used+' 次（不可退）':'');
  }).join('<br>');
  document.getElementById('local-keep-overlay').classList.add('open');
}

function localKeepChoice(kind){
  var c = getCurrentCase(); if(!c || !c.localAsk) return;
  document.getElementById('local-keep-overlay').classList.remove('open');
  if(kind==='keep'){
    c.localAsk = true;
    logCaseEvent(c, ME_NAME, '室长选择保留本案件的本地项目/术后管理');
    buildCaseLog(c);
    openLocalAskModal(c);
    return;
  }
  var rows = localPurchasedBatches(c).filter(function(x){ return x.b.used===0 && !x.b.comp; }); /* 置换批次不可退款 */
  if(!rows.length){ alert('这些批次都用过了，不能退款，只能保留'); c.localAsk = true; openLocalAskModal(c); return; }
  window.__LOCAL_REFUND_ROWS = rows;
  document.getElementById('local-refund-all-rows').innerHTML = rows.map(function(x,i){
    var pb = x.b, cur = pb.currency || 'IDR', pct = (pb.discountPct===undefined || pb.discountPct===null) ? 100 : pb.discountPct;
    var paidLine = typeof pb.paid==='number' ? '<div style="font-size:11px;color:var(--slate2);margin-top:2px;">当初实付 <b>'+formatCurrency(pb.paid, cur)+'</b>'+(pb.spec ? '　规格：'+pb.spec : '')+(pct<100 && pb.listPrice ? '　原价 '+formatCurrency(pb.listPrice, cur)+'，'+discountText(pct) : '')+(pb.pkg ? '（套餐内含）' : '')+(pb.promo ? '（活动价）' : '')+'</div>' : '<div style="font-size:11px;color:var(--muted);margin-top:2px;">没有记录当初实付</div>';
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+x.h.itemName+' ×'+x.b.bought+paidLine+'</span><span style="font-size:12px;">Rp <input type="number" min="0" id="lra-'+i+'" placeholder="金额" style="width:100px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:12px;"></span></div>';
  }).join('');
  document.getElementById('local-refund-all-reason').value = '';
  document.getElementById('local-refund-all-overlay').classList.add('open');
}

function closeLocalRefundAll(){ document.getElementById('local-refund-all-overlay').classList.remove('open'); var c = getCurrentCase(); if(c && c.localAsk==='keep') openLocalKeepModal(c); }

function confirmLocalRefundAll(){
  var c = getCurrentCase(); if(!c) return;
  var rows = window.__LOCAL_REFUND_ROWS || [];
  var reason = document.getElementById('local-refund-all-reason').value.trim();
  var amounts = rows.map(function(x,i){ var raw = document.getElementById('lra-'+i).value.trim(); return raw==='' ? NaN : Number(raw); });
  if(amounts.some(function(a){ return isNaN(a) || a<0; })){ alert('请填写每个批次的退款金额（数字，可为 0）'); return; }
  if(!reason){ alert('请填写退款原因'); return; }
  var today = todayStr(), names = [];
  rows.forEach(function(x,i){ x.b.voided = true; x.b.refund = {amount:amounts[i], currency:'IDR', reason:reason, date:today}; names.push(x.h.itemName+' ×'+x.b.bought); });
  document.getElementById('local-refund-all-overlay').classList.remove('open');
  logCaseEvent(c, ME_NAME, '室长选择全部退款：整批退款 '+names.join('、')+'；退款原因：'+reason);
  c.localAsk = false;
  c.endNote = '本地项目全退';
  autoFinish(c, '未购买未使用'); /* 本次没有购买（或已全退）→ 仅出报告；还有用过的批次保留则为已结案 */
}

/* 标记无法施术（只在"项目有变动"时用）：选中的未开始项目 → 已取消（unable）；不能全部标，全部不能做属于"不能施术" */
/* KR 在韩重新预约施术时间：回到"施术时间已确认"（新时间），客人再到医院时 KR 重新标记已到医院；IN 不能改 */
/* 选中/取消项目时把项目库当时的名字/价格/来源复制一份存进案件（快照）；
   之后项目库改价、改名、非活性化、删除都不会影响已经选进案件的这份拷贝（要求7） */
function toggleProject(projectId){
  var c = getCurrentCase(); if(!c) return;
  c.recommended = c.recommended || [];
  var idx = c.recommended.findIndex(function(it){ return it.projectId===projectId; });
  if(idx>-1){
    c.recommended.splice(idx,1);
  } else {
    var p = projById(projectId); if(!p) return;
    var item = p.origin==='IN' ? buildLocalItem(p) : {projectId:p.id, name:p.name, price:p.price, currency:currencyOf(p.origin), origin:p.origin, categoryId:p.categoryId}; /* 本地项目：带入进行中的活动价（成交价快照） */
    if(p.origin==='KR'){ /* 带上 KR 写在可选范围里的项目资料：麻醉特性、推荐在韩时间、所需术后管理（分配默认全部在韩国） */
      var si = ((c.krScope && c.krScope.items) || []).filter(function(x){ return x.name===p.name; })[0];
      if(si){ if(si.anesthesia) item.anesthesia = si.anesthesia; if(si.stay) item.stay = si.stay; if(si.postcare && si.postcare.length) item.postcare = si.postcare.map(function(x){ return Object.assign({}, x, {inTimes:0}); }); }
    }
    c.recommended.push(item);
  }
  renderCaseBody(c);
}

function toggleProjectsExpand(){
  var c = getCurrentCase(); if(!c) return;
  c.projectsExpanded = !c.projectsExpanded;
  renderCaseBody(c);
}

var SETTLE_MODAL_BATCH_ID = null;

function settleProjects(batchId){
  var c = getCurrentCase(); if(!c) return;
  var batch = batchId ? (c.settlementBatches||[]).filter(function(b){ return b.id===batchId; })[0] : latestUnpaidBatch(c);
  if(!batch) return;
  SETTLE_MODAL_BATCH_ID = batch.id;
  var rows = '';
  if(batch.krTotal){
    rows += '<div><div style="font-size:12px;font-weight:700;color:var(--terracotta);margin-bottom:6px;">赴韩项目（收预付金，尾款赴韩后支付）</div>'+
      '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--slate2);"><span>施术项目小计（术后管理含在套餐内，不另收费）</span><span>'+formatCurrency(batch.krTotal,'KRW')+'</span></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;margin-top:4px;"><span>定金（诊所收，'+Math.round(KR_DEPOSIT_RATE*100)+'%）</span><span>'+formatCurrency(batch.krDeposit,'KRW')+'</span></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);"><span>尾款（赴韩后在医院支付，医院收）</span><span>金额由医院收</span></div></div>';
  }
  if(batch.inTotal){
    rows += '<div'+(batch.krTotal?' style="border-top:1px solid var(--border2);padding-top:14px;"':'')+'><div style="font-size:12px;font-weight:700;color:var(--sage);margin-bottom:6px;">本地项目（收全款）</div>'+
      (batch.compCredit ? '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--slate2);"><span>本地项目合计</span><span>'+formatCurrency(batch.inTotal,'IDR')+'</span></div><div style="display:flex;justify-content:space-between;font-size:13px;color:#8F6F0C;"><span>赴韩定金转本地置换</span><span>−'+formatCurrency(batch.compCredit,'IDR')+'</span></div>' : '')+
      '<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;"><span>应付金额</span><span>'+formatCurrency(Math.max(0, batch.inTotal-(batch.compCredit||0)),'IDR')+'</span></div></div>';
  }
  var payLines = [];
  if(batch.krDeposit) payLines.push('<div style="display:flex;justify-content:space-between;"><span>赴韩本次应付</span><span>'+formatCurrency(batch.krDeposit,'KRW')+'</span></div>');
  if(batch.inTotal) payLines.push('<div style="display:flex;justify-content:space-between;"><span>本地本次应付'+(batch.compCredit ? '（已扣置换）' : '')+'</span><span>'+formatCurrency(Math.max(0, batch.inTotal-(batch.compCredit||0)),'IDR')+'</span></div>');
  rows += '<div style="border-top:1px solid var(--border);padding-top:14px;font-size:18px;font-weight:700;display:flex;flex-direction:column;gap:6px;"><span style="font-size:13px;color:var(--muted);font-weight:400;">本次合计应付（两种币种分开支付，不合并）</span>'+payLines.join('')+'</div>';
  var batchKr = (c.procedureItems||[]).filter(function(it){ return it.batchId===batch.id && it.origin==='KR'; }), need = batch.noDeposit ? [] : anesNeeded(c, batchKr);
  SETTLE_ANES_SIGNED = false;
  if(need.length){
    rows += '<div style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;background:#FBF6EA;"><div style="font-size:13px;font-weight:700;margin-bottom:6px;">麻醉同意书 <span style="font-weight:400;font-size:11px;color:var(--muted);">'+ANES_CONSENT_VERSION+'</span></div>'+
      '<div style="font-size:12px;color:var(--slate2);line-height:1.8;">（文案待撰写，演示占位）客人已了解下列项目的麻醉方式并同意：<br>'+need.map(function(a){ return '· '+a.name+'：<b>'+a.label+'</b>'+(a.note?'（'+a.note+'）':''); }).join('<br>')+'</div>'+
      '<label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:13px;cursor:pointer;"><input type="checkbox" onchange="toggleAnesSign(this.checked)"> 客人已签署麻醉同意书（记录版本和时间）</label></div>';
  }
  rows += '<button class="btn-primary" id="settle-pay-btn" onclick="confirmSettlementPayment()"'+(need.length ? ' disabled style="opacity:.5;"' : '')+'>确认付款</button>';
  document.getElementById('settle-breakdown').innerHTML = rows;
  document.getElementById('settle-overlay').classList.add('open');
}

function closeSettleModal(){ document.getElementById('settle-overlay').classList.remove('open'); }

function submitKrScheduleDate(){
  var c = getCurrentCase(); if(!c) return;
  var ks = ensureKrScheduleDraft(c);
  if(!ks.primary){ alert('至少选择首选日期'); return; }
  ks.status = 'pending'; ks.rejectNote = '';
  logCaseEvent(c, ME_NAME, '递交施术日期（首选 '+ks.primary+(ks.backup?'，备选 '+ks.backup:'')+'），等待Kr室长确认');
  try{ if(c.settlementDone) pushKrNotif(caseKrHospital(c), '施术日期待确认：'+c.name+'（'+(c.caseNo||'')+'）已递交施术日期（首选 '+ks.primary+(ks.backup?'，备选 '+ks.backup:'')+'）', {to:'coord', caseId:c.id, clinicId:c.clinicId||CURRENT_CLINIC_ID, level:'action'}); }catch(e){} /* 通知 KR 室长（CMD-1013-02 九） */
  updateCaseStage(c);
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

function submitKrScheduleChangeDate(){
  var c = getCurrentCase(); if(!c || !c.krSchedule || c.krSchedule.status!=='change_pending') return;
  if(!c.krSchedule.changePrimary){ alert('至少选择新的首选日期'); return; }
  c.krSchedule.changeSubmitted = true;
  logCaseEvent(c, ME_NAME, '提交新施术日期（首选 '+c.krSchedule.changePrimary+(c.krSchedule.changeBackup?'，备选 '+c.krSchedule.changeBackup:'')+'），等待Kr室长确认');
  try{ pushKrNotif(caseKrHospital(c), '改期待确认：'+c.name+'（'+(c.caseNo||'')+'）提交了新的施术日期（首选 '+c.krSchedule.changePrimary+(c.krSchedule.changeBackup?'，备选 '+c.krSchedule.changeBackup:'')+'）', {to:'coord', caseId:c.id, clinicId:c.clinicId||CURRENT_CLINIC_ID, level:'action'}); }catch(e){}
  buildCaseLog(c);
  renderCaseBody(c);
}

function requestCannotCoordinate(){
  var c = getCurrentCase(); if(!c || c.hasArrived) return;
  var undoneKr = krNotStartedItems(c);
  if(!undoneKr.length) return;
  if(!confirm('确认施术日期始终无法协调？将取消全部未完成赴韩项目并退款（金额和退款原因在下一步填写）。')) return;
  openRefundModal(undoneKr, 'cannotCoordinate');
}

/* 演示按钮「模拟KR标记完成」（2026-09-30）：逐个勾选项目标完成，或一次全部标完成；所有赴韩项目都已完成/已取消后系统自动判断结局 */
/* 演示按钮：模拟KR补加术后管理项目——弹窗从术后管理分类里选，直接进客户持有，标"KR代收"，印尼不再付款 */

/* ================= 手动［结束案件］（CMD-1013-16，新结案规则试行） =================
   只在付定金之前；弹窗列出未处理项逐项选，结束原因必填，钱清了才能按确定。结局由系统按 08 判断（面诊费已缴 / 免除、报告未出 → 仅出报告）。 */
var END_CASE = null;
var END_REASONS = ['客人不做了', '失联', '其他'];
function endCaseRows(c){
  var rows = [];
  if(c.consultRequested && c.consultStatus==='awaiting_payment') rows.push({key:'fee', title:'面诊费待缴', opts:[['pay','收款（客人已缴面诊费）'],['cancel','取消面诊']]});
  else if(c.consultRequested && ['paid_waiting_kr','awaiting_report'].indexOf(c.consultStatus)>-1) rows.push({key:'consult', info:'面诊诊疗方案还没出：照样等报告。结束后结局算「仅出报告」，KR 之后发出的诊疗方案会放进这个已结束的案件（只读、可下载），新案件关联本案件也能看。'});
  (c.settlementBatches||[]).forEach(function(b){
    if(b.status!=='unpaid') return;
    var opts = []; if(!(b.krDeposit>0)) opts.push(['pay','收款（标记已付款，本地项目转持有）']); opts.push(['cancel','取消该项目（撤销这张结算单）']);
    var amt = [b.krDeposit>0 ? '定金 '+formatCurrency(b.krDeposit,'KRW') : '', b.inTotal>0 ? '本地 '+formatCurrency(b.inTotal,'IDR') : ''].filter(Boolean).join(' + ');
    rows.push({key:'batch:'+b.id, title:'待收款：批次 '+b.id+(amt ? '（'+amt+'）' : ''), opts:opts});
  });
  var uses = (c.mgmtUses||[]).concat(c.localMgmt ? (c.localMgmt.mgmtUses||[]) : []).filter(function(u){ return localItemStatus(u)==='进行中'; });
  if(uses.length) rows.push({key:'inuse', info:'使用中的本地项目（'+uses.map(function(u){ return u.itemName+' ×'+u.qty; }).join('、')+'）：结束时标「取消」，次数归还客人持有（不是退款）；归还后想退款，可再用基础资料页的［退款服务］。'});
  refundableBatches(c.name).filter(function(x){ return x.b.caseId===c.id; }).forEach(function(x, i){
    rows.push({key:'hold:'+x.h.itemName+':'+x.bi, hold:x, title:'本地项目：'+x.h.itemName+(x.b.spec ? '（'+x.b.spec+'）' : '')+' 剩余 '+(x.b.bought-x.b.used)+' 次', opts:[['keep','转持有（留给客人下次用）'],['refund','退款']]});
  });
  return rows;
}
function openEndCase(){
  var c = getCurrentCase(); if(!c || !canEndCase(c)) return;
  END_CASE = {caseId:c.id, choice:{}, amt:{}, reason:'', note:''};
  renderEndCase();
}
function renderEndCase(){
  var c = getCurrentCase(); if(!c || !END_CASE) return;
  var ov = document.getElementById('end-case-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'end-case-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var rows = endCaseRows(c), st = END_CASE;
  var html = rows.map(function(r){
    if(r.info) return '<div style="padding:10px 12px;border-radius:8px;background:#F7F5EF;font-size:12px;color:var(--slate2);margin-bottom:8px;">'+r.info+'</div>';
    var opts = r.opts.map(function(o){ return '<label style="display:flex;align-items:center;gap:6px;font-size:13px;margin-top:6px;"><input type="radio" name="ec-'+r.key+'" '+(st.choice[r.key]===o[0] ? 'checked' : '')+' onchange="endCaseSet(\''+r.key+'\',\''+o[0]+'\')">'+o[1]+'</label>'; }).join('');
    var amt = (r.hold && st.choice[r.key]==='refund') ? '<div style="margin-top:6px;font-size:12px;">退款金额（Rp）：<input type="number" min="0" value="'+(st.amt[r.key]===undefined ? '' : st.amt[r.key])+'" oninput="END_CASE.amt[\''+r.key+'\']=this.value;endCaseUpdateBtn()" style="width:140px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;"> <span style="color:var(--muted);">当初实付 '+(typeof r.hold.b.paid==='number' ? formatCurrency(r.hold.b.paid, r.hold.b.currency||'IDR') : '—')+'，可为 0</span></div>' : '';
    return '<div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;"><div style="font-size:13px;font-weight:600;">'+r.title+'</div>'+opts+amt+'</div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">没有未处理的项目。</div>';
  var reasons = END_REASONS.map(function(x){ return '<label style="display:inline-flex;align-items:center;gap:5px;font-size:13px;margin-right:14px;"><input type="radio" name="ec-reason" '+(st.reason===x ? 'checked' : '')+' onchange="END_CASE.reason=\''+x+'\';endCaseUpdateBtn()">'+x+'</label>'; }).join('');
  ov.innerHTML = '<div class="modal-box" style="width:520px;max-height:84vh;overflow:auto;"><div style="font-size:15px;font-weight:700;margin-bottom:4px;">结束案件</div>'+
    '<div style="font-size:12px;color:var(--slate2);margin-bottom:12px;">客人中途不做了 / 有事要走。付定金之前才能手动结束；下面没处理完的要逐项选好，钱清了才能确定。</div>'+html+
    '<div style="margin:12px 0 6px;font-size:13px;font-weight:600;">结束原因（必填）</div><div>'+reasons+'</div>'+
    '<input type="text" placeholder="补充说明（选「其他」时必填）" value="'+(st.note||'').replace(/"/g,'&quot;')+'" oninput="END_CASE.note=this.value;endCaseUpdateBtn()" style="width:100%;margin-top:8px;padding:7px 9px;border:1px solid var(--border);border-radius:8px;box-sizing:border-box;">'+
    '<div id="ec-hint" style="font-size:12px;color:#C26A1B;margin-top:8px;"></div>'+
    '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;"><button class="btn-outline" onclick="closeEndCase()">返回</button><button id="ec-ok" class="btn-primary" onclick="confirmEndCase()">确定结束</button></div></div>';
  ov.classList.add('open'); endCaseUpdateBtn();
}
function endCaseSet(key, val){ END_CASE.choice[key] = val; renderEndCase(); }
function closeEndCase(){ var ov = document.getElementById('end-case-overlay'); if(ov) ov.classList.remove('open'); END_CASE = null; }
/* 还缺什么：返回提示文字，空 = 可以确定 */
function endCaseMissing(c){
  var st = END_CASE, miss = '';
  endCaseRows(c).forEach(function(r){
    if(r.info || miss) return;
    if(!st.choice[r.key]) { miss = '还没选：'+r.title; return; }
    if(r.hold && st.choice[r.key]==='refund'){ var raw = st.amt[r.key], a = Number(raw); if(raw===undefined || raw==='' || isNaN(a) || a<0){ miss = '请填写退款金额：'+r.title; } else if(typeof r.hold.b.paid==='number' && a>r.hold.b.paid){ miss = '退款金额不能超过当初实付：'+r.title; } }
  });
  if(!miss && !st.reason) miss = '请选择结束原因';
  if(!miss && st.reason==='其他' && !(st.note||'').trim()) miss = '选「其他」请补充说明';
  return miss;
}
function endCaseUpdateBtn(){
  var c = getCurrentCase(); if(!c || !END_CASE) return; var m = endCaseMissing(c), b = document.getElementById('ec-ok'), h = document.getElementById('ec-hint');
  if(h) h.textContent = m; if(b){ b.disabled = !!m; b.style.opacity = m ? '.5' : ''; }
}
function confirmEndCase(){
  var c = getCurrentCase(); if(!c || !END_CASE || !canEndCase(c)) return;
  var m = endCaseMissing(c); if(m){ alert(m); return; }
  var st = END_CASE, rows = endCaseRows(c), today = todayStr(), by = actingName(), done = [];
  var reasonText = st.reason + ((st.note||'').trim() ? '：'+st.note.trim() : '');
  var phase = c.consultRequested ? (c.consultStatus==='awaiting_payment' ? '面诊待缴费' : c.consultStatus==='report_ready' ? '项目确认中' : c.consultStatus==='cancelled' ? '纯本地' : '面诊等报告') : (isLocalCase(c) ? '纯本地' : '接待中');
  closeEndCase();
  rows.forEach(function(r){
    var ch = st.choice[r.key]; if(r.info || !ch) return;
    if(r.key==='fee'){
      if(ch==='pay'){ markConsultPaid(); done.push('面诊费已收'); }
      else { c.consultStatus = 'cancelled'; logCaseEvent(c, by, '面诊取消（结束案件时处理待缴的面诊费）'); done.push('面诊取消'); }
    } else if(r.key.indexOf('batch:')===0){
      var bid = r.key.slice(6);
      if(ch==='pay'){ SETTLE_MODAL_BATCH_ID = bid; confirmSettlementPayment(); done.push('批次 '+bid+' 已收款'); }
      else {
        c.procedureItems = (c.procedureItems||[]).filter(function(it){ return it.batchId!==bid; });
        c.settlementBatches = (c.settlementBatches||[]).filter(function(x){ return x.id!==bid; });
        c.projectsLocked = c.settlementBatches.length>0; c.recommended = []; logCaseEvent(c, by, '结束案件：取消待收款的结算单（批次 '+bid+'）'); done.push('批次 '+bid+' 已取消');
      }
    } else if(r.hold){
      var b = r.hold.b, h = r.hold.h;
      if(ch==='refund'){
        var amt = Number(st.amt[r.key]);
        b.voidedRemaining = b.bought-b.used; b.voided = true; b.refund = {amount:amt, currency:b.currency||'IDR', reason:reasonText, date:today, viaCaseId:c.id};
        c.holdingRefunds = c.holdingRefunds || []; c.holdingRefunds.push({itemName:h.itemName, amount:amt, reason:reasonText, date:today, qty:b.voidedRemaining||0, viaCaseId:c.id});
        logCaseEvent(c, by, '结束案件：退款 '+h.itemName+(b.spec ? '（'+b.spec+'）' : '')+'，剩余 '+b.voidedRemaining+' 次作废，退款 '+formatCurrency(amt, b.currency||'IDR')+'，原因：'+reasonText);
        done.push(h.itemName+' 已退款');
      } else { logCaseEvent(c, by, '结束案件：'+h.itemName+(b.spec ? '（'+b.spec+'）' : '')+' 剩余 '+(b.bought-b.used)+' 次转为客人持有'); done.push(h.itemName+' 转持有'); }
    }
  });
  /* 使用中的本地项目：标取消，次数归还持有 */
  [['main', c.mgmtUses], ['lm', c.localMgmt ? c.localMgmt.mgmtUses : null]].forEach(function(p){
    (p[1]||[]).forEach(function(u){ if(localItemStatus(u)==='进行中'){ u.status = 'cancelled'; u.cancelQty = u.qty; returnHolding(c.name, u.itemName, c.id, u.qty, p[0]); logCaseEvent(c, by, '结束案件：使用中的 '+u.itemName+' 标取消，次数已归还持有（不是退款）'); } });
  });
  var left = closeBlockers(c);
  if(left.length){ alert('还有未处理的款项：'+left.join('、')+'，案件没有结束'); renderCaseStatusBar(c); renderCaseBody(c); return; }
  c.manualEnd = {reason:st.reason, note:(st.note||'').trim(), by:by, at:nowFullDt()};
  c.endNote = '手动结束：'+reasonText;
  logCaseEvent(c, by, '手动结束案件（付定金前，当时：'+phase+'）：'+reasonText);
  finishCase(c, st.reason);
}

function cancelConsult(){
  var c = getCurrentCase(); if(!c || !canCancelConsult(c)) return;
  if(!confirm('确认取消本次面诊？取消后面诊费记为"已取消"，主状态变为"选择项目"，自动打开本地管理。')) return;
  c.consultStatus = 'cancelled';
  c.projectsEnabled = true;
  c.localTrack = true;
  c.entryChoicePending = true;
  c.activeCaseTab = 'localmgmt';
  logCaseEvent(c, ME_NAME, '面诊取消（面诊费已取消），主状态进入选择项目，自动打开本地管理');
  updateCaseStage(c);
  renderCaseStatusBar(c);
  buildCaseLog(c);
  renderCaseBody(c);
}

/* ---- 韩国那边的回应（2026-10-02 面诊改版）：面诊只有一种——院长看资料口述，KR室长整理发送诊疗方案，院长不参与视频。
   付面诊费 → 待确认报告时间（面诊预约）→ KR确认预计出报告时间 → 等待报告（预计X出报告+倒计时；超时只提醒）→ KR室长发送诊疗方案 → 项目确认中 ---- */
 /* 术后照片按恢复时间排序：1周→1个月→3个月… */
/* 演示用角色：案例库、项目库两个页面共用同一个开关，切一次两边权限一起变 */
var DEMO_ROLE = 'in';
 // 'in'=印尼室长，'kr'=韩国室长（院长不维护）
function setDemoRole(v){
  DEMO_ROLE = v;
  if(document.getElementById('in-library')) renderLibrary();
  if(document.getElementById('in-projectlibrary')) renderProjLibrary();
}


/* ---- 页内状态 + 面包屑 ---- */
var LIB_VIEW = 'part';
 // 'part' | 'method'
var LIB_STATE = {level:'home', groupId:null, projectId:null, caseId:null, filters:{director:'all', problem:'all', recovery:'all'}, compare:[]};

var LIB_GRID_CSS = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;';

function renderLibrary(){
  var main = document.getElementById('lib-grid'); if(!main) return;
  var sel = document.getElementById('lib-role-select'); if(sel) sel.value = DEMO_ROLE;
  var addBtn = document.getElementById('lib-add-btn');
  if(addBtn){ addBtn.textContent = '+ 新增案例'; addBtn.style.display = DEMO_ROLE==='in' ? '' : 'none'; } /* CMD-1014-16：KR 案例库只读，没有新增 */
  var toggle = '<div class="cal-switch"><span class="'+(LIB_VIEW==='part'?'active':'')+'" onclick="setLibView(\'part\')">按部位</span><span class="'+(LIB_VIEW==='method'?'active':'')+'" onclick="setLibView(\'method\')">按施术 / 管理</span></div>';
  var f = document.getElementById('lib-filters');
  var searchBox = '<input type="text" id="lib-search" placeholder="搜索案例标题" value="'+LIB_SEARCH.replace(/"/g,'&quot;')+'" oninput="libSearchInput(this.value)" style="width:200px;padding:7px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;">';
  var hs = linkedHospitals(), hospSw = hs.length ? '<span style="display:inline-flex;gap:6px;align-items:center;"><span style="font-size:11px;color:var(--muted);">赴韩施术医院</span><span class="chip'+(LIB_HOSPITAL==='all'?' active':'')+'" onclick="setLibHospital(\'all\')">全部</span>'+hs.map(function(h){ return '<span class="chip'+(LIB_HOSPITAL===h.id?' active':'')+'" onclick="setLibHospital(\''+h.id+'\')">'+h.name.ko+'</span>'; }).join('')+'</span>' : '';
  if(f) f.innerHTML = '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">'+toggle+searchBox+(LIB_SEARCH ? '' : libCrumbsHtml())+'</div>';
  main.style.display = 'block'; main.style.marginTop = '22px';
  renderLibMain();
}

/* 首页顶部搜索（案例标题，Notion IN-SHOW-01）：有关键词时显示全部匹配案例（跨部位/项目），清空后回到原来的层级 */
var LIB_SEARCH = '';

function libSearchInput(v){ LIB_SEARCH = v; var cr = document.querySelector('#lib-filters > div'); renderLibMain(); }

function renderLibMain(){
  var main = document.getElementById('lib-grid'); if(!main) return;
  if(LIB_SEARCH.trim()){
    var q = LIB_SEARCH.trim().toLowerCase();
    var hits = LIB_CASES.filter(function(c){ return [c.title,(c.names||{}).ko,(c.names||{}).id].some(function(t){ return (t||'').toLowerCase().indexOf(q)>-1; }); });
    main.innerHTML = '<div style="font-size:12px;color:var(--muted);margin-bottom:10px;">搜索"'+LIB_SEARCH.trim()+'"：'+hits.length+' 个案例</div><div style="'+LIB_GRID_CSS+'">'+(hits.map(libCaseCardHtml).join('') || '<div style="font-size:12px;color:var(--muted);">没有匹配的案例</div>')+'</div>';
    return;
  }
  var lv = LIB_STATE.level;
  main.innerHTML = lv==='home' ? libRenderHome() : (lv==='projects' ? libRenderProjects() : (lv==='cases' ? libRenderCases() : libRenderDetail()));
}

/* 院长详情页（基础版）：这位院长名下的案例列表（点院长名进入；不在名单上的院长显示"-"，点不了） */
var DIRECTOR_DETAIL_NAME = null;

function openDirectorDetail(name){ DIRECTOR_DETAIL_NAME = name; renderDirectorDetail(); nav('in-director'); }

function renderDirectorDetail(){
  var name = DIRECTOR_DETAIL_NAME; if(!name) return;
  var cases = LIB_CASES.filter(function(c){ return c.director===name; });
  var caseCount = CASE_ITEMS.filter(function(c){ return c.director===name; }).length;
  document.getElementById('director-detail-name').textContent = name;
  document.getElementById('director-detail-info').innerHTML =
    '<div class="field-row"><span class="fk">姓名</span><span class="fv">'+name+'</span></div>'+
    '<div class="field-row"><span class="fk">职称</span><span class="fv">院长</span></div>'+
    '<div class="field-row"><span class="fk">案例库案例数</span><span class="fv">'+cases.length+'</span></div>'+
    '<div class="field-row" style="border-bottom:none;"><span class="fk">对接案件数</span><span class="fv">'+caseCount+'</span></div>';
  document.getElementById('director-detail-grid').innerHTML = cases.length ? cases.map(libCaseCardHtml).join('') : '<div style="grid-column:1/-1;font-size:12px;color:var(--muted);padding:20px 4px;">这位院长名下暂无案例</div>';
}

function deleteLibCase(id){
  var c = libFindCase(id); if(!c || !libCaseCanEdit(c.source)) return;
  if(!confirm('确认删除案例"'+c.title+'"？删除后不可恢复。')) return;
  LIB_CASES = LIB_CASES.filter(function(x){ return x.id!==id; });
  if(CURRENT_PAGE_ID==='in-director') renderDirectorDetail();
  if(LIB_STATE.level==='detail') LIB_STATE.level = 'cases';
  renderLibrary();
}

var LIB_VIEW_KEY = null;

function openLibViewer(key){
  var c = libFindCase(LIB_STATE.caseId); if(!c) return;
  var o = libPhotoByKey(c, key);
  document.getElementById('lib-viewer-cap').textContent = c.title+' · '+o.cap;
  document.getElementById('lib-viewer-body').innerHTML = libPhotoBox(o.ph,'100%','min(60vh,460px)',o.cap);
  document.getElementById('lib-viewer-overlay').classList.add('open');
}

function closeLibViewer(){ document.getElementById('lib-viewer-overlay').classList.remove('open'); }

/* 展示模式：全屏只显示照片对比（术前、各恢复时间的术后照片，可左右切换），隐藏同意书、上传人、编辑按钮等内部信息；Esc 或关闭回到详情页 */
var LIB_PRESENT = {slides:[], idx:0};

function openLibPresent(){
  var c = libFindCase(LIB_STATE.caseId); if(!c) return;
  var slides = (c.beforePhotos||[]).map(function(ph,i){ return {ph:ph, cap:'术前'+((c.beforePhotos.length>1)?' '+(i+1):'')}; }).concat(sortedAfter(c).map(function(ph){ return {ph:ph, cap:'术后 · '+recoveryText(ph)}; }));
  if(!slides.length){ alert('这个案例没有照片'); return; }
  LIB_PRESENT = {slides:slides, idx:0};
  renderLibPresent();
  document.getElementById('lib-present-overlay').style.display = 'flex';
}

function renderLibPresent(){
  var sl = LIB_PRESENT.slides[LIB_PRESENT.idx];
  document.getElementById('lib-present-cap').textContent = sl.cap;
  document.getElementById('lib-present-body').innerHTML = libPhotoBox(sl.ph,'100%','100%',sl.cap);
  document.getElementById('lib-present-count').textContent = (LIB_PRESENT.idx+1)+' / '+LIB_PRESENT.slides.length+'　← → 切换，Esc 退出';
}

function closeLibPresent(){ document.getElementById('lib-present-overlay').style.display = 'none'; }


/* ---- 新增 / 编辑案例（2026-10-02·五） ----
   字段：标题（必填，只填一种语言，其他语言 AI 翻译可改，演示翻译）、项目（必选多选）、院长（赴韩才有）、问题（印尼才有，多选）、术前照片（选填）、术后照片（至少一张，每张必选恢复时间）；
   照片同意（必填两项）：勾选"该客人已签署案例库照片同意书" + 上传手写签名的同意书文件（jpg/png/pdf）；缺任一项［保存］不可点。 */
var LIB_EDIT = null;

function openLibCaseModal(caseId){
  if(caseId){
    var c = libFindCase(caseId); if(!c || !libCaseCanEdit(c.source)) return;
    LIB_EDIT = JSON.parse(JSON.stringify(c));
    LIB_EDIT.names = LIB_EDIT.names || {zh:c.title, ko:'', id:''};
    LIB_EDIT.consent = LIB_EDIT.consent || {signed:false, file:''};
  } else {
    LIB_EDIT = {id:null, title:'', names:{zh:'',ko:'',id:''}, source:'local', projectIds:[], director:null, problemIds:[], beforePhotos:[], afterPhotos:[], consent:{signed:false, file:''}};
  }
  renderLibCaseModal();
  document.getElementById('lib-case-overlay').classList.add('open');
}

function libEditSource(src){ if(!LIB_EDIT || LIB_EDIT.id || LIB_EDIT.source===src) return; LIB_EDIT.source = src; LIB_EDIT.projectIds = []; LIB_EDIT.director = null; LIB_EDIT.problemIds = []; renderLibCaseModal(); } /* CMD-1014-16：IN 新增案例时选类型 */
function closeLibCaseModal(){ document.getElementById('lib-case-overlay').classList.remove('open'); LIB_EDIT = null; }

function libEditAiFill(){
  var n = LIB_EDIT.names, from = ['zh','ko','id'].filter(function(k){ return (n[k]||'').trim(); })[0];
  if(!from){ alert('请至少填一种语言的标题'); return; }
  ['zh','ko','id'].forEach(function(k){ if(!(n[k]||'').trim()) n[k] = demoTranslate(n[from].trim(), from, k); });
  renderLibCaseModal();
}

function libTriggerFileInput(kind){
  var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
  input.onchange = function(e){ libHandleFiles(e.target.files, kind); };
  input.click();
}

function libHandleFiles(files, kind){
  var arr = Array.prototype.slice.call(files || []); if(!arr.length) return;
  var remaining = arr.length;
  arr.forEach(function(file){
    var reader = new FileReader();
    reader.onload = function(e){
      if(kind==='before') LIB_EDIT.beforePhotos.push({url:e.target.result}); else LIB_EDIT.afterPhotos.push({url:e.target.result, recovery:''});
      if(--remaining===0) renderLibCaseModal();
    };
    reader.readAsDataURL(file);
  });
}

function libPickConsentFile(){
  var input = document.createElement('input'); input.type = 'file'; input.accept = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';
  input.onchange = function(e){ var f = e.target.files[0]; if(f){ LIB_EDIT.consent.file = f.name; renderLibCaseModal(); } };
  input.click();
}

function renderLibCaseModal(){
  var c = LIB_EDIT; if(!c) return;
  document.getElementById('lib-case-modal-title').textContent = c.id ? '编辑案例' : '新增案例';
  var isTravel = c.source==='travel';
  var srcLabel = isTravel ? '赴韩施术案例（IN 维护，KR 只读）' : '本地项目案例（IN 维护）';
  var origin = isTravel ? 'KR' : 'IN';
  var projGroups = projLibCategories(origin).map(function(cat){
    var ps = PROJECT_LIBRARY.filter(function(pr){ return pr.categoryId===cat.id && (pr.active || c.projectIds.indexOf(pr.id)>-1); });
    if(!ps.length) return '';
    return '<div style="margin-bottom:8px;"><div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:4px;">'+cat.label+'</div><div style="display:flex;gap:8px;flex-wrap:wrap;">'+
      ps.map(function(pr){ return '<span class="chip'+(c.projectIds.indexOf(pr.id)>-1?' active':'')+'" onclick="libToggleProject(\''+pr.id+'\')">'+pr.name+(pr.active?'':'（已非活性）')+'</span>'; }).join('')+'</div></div>';
  }).join('');
  var dirOptions = '<option value=""'+(!c.director?' selected':'')+'>-</option>'+(function(){ var ns = []; linkedHospitalIds().forEach(function(h){ ns = ns.concat(hospitalDirectorNames(h)); }); return ns; })().map(function(d){ return '<option'+(c.director===d?' selected':'')+'>'+d+'</option>'; }).join('')+
    ((c.director && !isDirectorActive(c.director)) ? '<option selected value="'+c.director+'">'+c.director+'（已停用，显示为"-"）</option>' : '');
  var n = c.names;
  var nameInp = function(k, label){ return '<div class="case-field-row"><span class="fk">'+label+'</span><input type="text" value="'+(n[k]||'').replace(/"/g,'&quot;')+'" oninput="libEditName(\''+k+'\',this.value)" style="flex-grow:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div>'; };
  var missing = libEditMissing();
  document.getElementById('lib-case-body').innerHTML =
    '<div style="font-size:11px;color:var(--muted);margin-bottom:14px;">案例类型：'+(!c.id ? '<span class="chip'+(!isTravel?' active':'')+'" onclick="libEditSource(\'local\')">本地项目案例</span> <span class="chip'+(isTravel?' active':'')+'" onclick="libEditSource(\'travel\')">赴韩施术案例</span>' : srcLabel)+'</div>'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:4px;">标题 <span style="color:var(--terracotta);">*</span> <span style="font-weight:400;color:var(--muted);">只填一种语言，其他语言 AI 翻译，可手动修改</span></div>'+
    nameInp('zh','中文')+nameInp('ko','한국어')+nameInp('id','Bahasa Indonesia')+
    '<div style="margin:6px 0 12px;"><button class="btn-ghost" style="font-size:11px;" onclick="libEditAiFill()">AI 翻译补全（演示）</button></div>'+
    '<div style="margin:6px 0 10px;"><div style="font-size:12px;font-weight:700;margin-bottom:6px;">项目 <span style="color:var(--terracotta);">*</span> <span style="font-weight:400;color:var(--muted);">来自项目库（'+(isTravel?'赴韩项目':'本地项目')+'），可多选；部位/分类由项目自动带出</span></div>'+projGroups+'</div>'+
    (isTravel ? '<div class="case-field-row"><span class="fk">院长</span><select style="flex-grow:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;" onchange="libEditDirector(this.value)">'+dirOptions+'</select></div>' : '')+
    (!isTravel ? '<div style="margin:10px 0;"><div style="font-size:12px;font-weight:700;margin-bottom:6px;">问题（可多选）</div><div style="display:flex;gap:8px;flex-wrap:wrap;">'+
      Object.keys(LIB_PROBLEMS).map(function(id){ return '<span class="chip'+(c.problemIds.indexOf(id)>-1?' active':'')+'" onclick="libToggleProblem(\''+id+'\')">'+LIB_PROBLEMS[id].label+'</span>'; }).join('')+
      '<span class="chip" onclick="openLibProblemModal()">管理问题标签</span></div></div>' : '')+
    '<div class="case-field-row" style="align-items:flex-start;"><span class="fk" style="padding-top:6px;">术前照片</span><div style="flex-grow:1;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">'+
      (c.beforePhotos||[]).map(function(ph,i){ return libPhotoThumbEditHtml(ph,'before',i); }).join('')+
      '<button class="btn-ghost" onclick="libTriggerFileInput(\'before\')">+ 上传</button><button class="btn-ghost" onclick="libAddDemoPhoto(\'before\')">+ 演示照片</button></div></div>'+
    '<div class="case-field-row" style="align-items:flex-start;"><span class="fk" style="padding-top:6px;">术后照片 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;">'+
      (c.afterPhotos||[]).map(function(ph,i){ return libPhotoThumbEditHtml(ph,'after',i); }).join('')+
      '<button class="btn-ghost" onclick="libTriggerFileInput(\'after\')">+ 上传</button><button class="btn-ghost" onclick="libAddDemoPhoto(\'after\')">+ 演示照片</button></div></div>'+
    '<div style="margin:14px 0 6px;padding:12px 14px;background:var(--border2);border-radius:10px;"><div style="font-size:12px;font-weight:700;margin-bottom:8px;">照片同意（必填两项）</div>'+
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-bottom:8px;"><input type="checkbox" '+(c.consent.signed?'checked ':'')+'onchange="libSetConsentSigned(this.checked)"> 该客人已签署案例库照片同意书</label>'+
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;">手写签名同意书（jpg / png / pdf）：<span style="color:'+(c.consent.file?'var(--sage)':'var(--muted)')+';">'+(c.consent.file ? '📄 '+c.consent.file : '未上传')+'</span>'+
      '<button class="btn-ghost" onclick="libPickConsentFile()">上传文件</button><button class="btn-ghost" onclick="libUseDemoConsent()">使用演示同意书</button></div></div>'+
    (missing.length ? '<div class="error-text" style="display:block;margin:10px 0;">还差：'+missing.join('、')+'</div>' : '')+
    '<button class="btn-primary" style="width:100%;margin-top:6px;'+(missing.length?'opacity:.4;cursor:not-allowed;':'')+'" '+(missing.length?'disabled ':'')+'onclick="saveLibCase()">保存</button>';
}


/* ---- 问题标签管理（印尼管理案例，手动维护：新增 / 改名 / 删除；删除时还有案例可批量改挂到另一个问题或移除标签） ---- */
var LIB_PROB_DEL = null;

function openLibProblemModal(){
  if(!libCanEdit('local')){ alert('问题标签由 IN 室长维护'); return; }
  LIB_PROB_DEL = null; renderLibProblemModal();
  document.getElementById('lib-node-action-overlay').classList.add('open');
}

function closeLibNodeActionModal(){ document.getElementById('lib-node-action-overlay').classList.remove('open'); LIB_PROB_DEL = null; if(LIB_EDIT) renderLibCaseModal(); renderLibrary(); }

function renderLibProblemModal(){
  document.getElementById('lib-node-action-title').textContent = '管理问题标签';
  var d = LIB_PROB_DEL, html;
  if(d){
    var src = LIB_PROBLEMS[d.id], others = Object.keys(LIB_PROBLEMS).filter(function(k){ return k!==d.id; });
    html = '<div style="font-size:12px;color:var(--slate2);margin-bottom:12px;">"'+src.label+'"名下还有 '+libProblemCount(d.id)+' 个案例，怎么处理？</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;"><button class="'+(d.choice==='reassign'?'btn-primary':'btn-outline')+'" style="text-align:left;" onclick="LIB_PROB_DEL.choice=\'reassign\';renderLibProblemModal()">批量改挂到另一个问题</button>'+
      '<button class="'+(d.choice==='unlabel'?'btn-primary':'btn-outline')+'" style="text-align:left;" onclick="LIB_PROB_DEL.choice=\'unlabel\';LIB_PROB_DEL.target=null;renderLibProblemModal()">移除标签</button></div>'+
      (d.choice==='reassign' ? '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">'+(others.map(function(k){ return '<button class="'+(d.target===k?'btn-primary':'btn-outline')+'" style="text-align:left;" onclick="LIB_PROB_DEL.target=\''+k+'\';renderLibProblemModal()">'+LIB_PROBLEMS[k].label+'</button>'; }).join('') || '<div style="font-size:12px;color:var(--muted);">没有其他问题可选</div>')+'</div>' : '')+
      '<button class="btn-primary" style="width:100%;" onclick="confirmLibProblemDelete()">确认删除</button>';
  } else {
    html = Object.keys(LIB_PROBLEMS).map(function(id){
      return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+LIB_PROBLEMS[id].label+' <span style="font-size:11px;color:var(--muted);">'+libProblemCount(id)+' 个案例</span></span><span class="fa" style="gap:12px;"><a href="#" class="info-link" onclick="renameLibProblem(\''+id+'\');return false;">改名</a><a href="#" class="info-link" style="color:#C1454A;" onclick="deleteLibProblem(\''+id+'\');return false;">删除</a></span></div>';
    }).join('')+'<div style="margin-top:12px;"><button class="btn-ghost" onclick="addLibProblemUI()">＋ 新增问题</button></div>';
  }
  document.getElementById('lib-node-action-body').innerHTML = html;
}

function addLibProblemUI(){ var n = prompt('新增问题名称'); if(!n || !n.trim()) return; addLibProblem(n.trim()); renderLibProblemModal(); }

function renameLibProblem(id){ var n = prompt('修改名称', LIB_PROBLEMS[id].label); if(n===null || !n.trim()) return; LIB_PROBLEMS[id].label = n.trim(); renderLibProblemModal(); }

function deleteLibProblem(id){
  if(!libProblemCount(id)){ if(confirm('确认删除问题"'+LIB_PROBLEMS[id].label+'"？')){ delete LIB_PROBLEMS[id]; renderLibProblemModal(); } return; }
  LIB_PROB_DEL = {id:id, choice:'reassign', target:null}; renderLibProblemModal();
}

function confirmLibProblemDelete(){
  var d = LIB_PROB_DEL; if(!d) return;
  if(d.choice==='reassign' && !d.target){ alert('请先选择要改挂到的问题'); return; }
  LIB_CASES.forEach(function(c){
    var i = (c.problemIds||[]).indexOf(d.id); if(i<0) return;
    c.problemIds.splice(i,1);
    if(d.choice==='reassign' && c.problemIds.indexOf(d.target)<0) c.problemIds.push(d.target);
  });
  delete LIB_PROBLEMS[d.id];
  LIB_PROB_DEL = null; renderLibProblemModal();
}

var PROJ_DISPLAY_CCY_KR = 'KRW', PROJ_DISPLAY_CCY_IN = 'IDR';
 // 项目库页面自己的币种切换
var CASE_DISPLAY_CCY_KR = 'KRW', CASE_DISPLAY_CCY_IN = 'IDR';


/* ---- 项目库页面：赴韩项目 / 本地项目 / 非活性化 三个tab，各自单层分类筛选 ---- */
var PROJLIB_TAB = 'KR';
var PROJLIB_HOSPITAL = null; /* 赴韩项目 tab 当前看的医院（只列本诊所对接的医院） */
function projLibHospital(){ var ids = linkedHospitalIds(); return (PROJLIB_HOSPITAL && ids.indexOf(PROJLIB_HOSPITAL)>-1) ? PROJLIB_HOSPITAL : (ids[0] || null); }
function setProjLibHospital(h){ PROJLIB_HOSPITAL = h; PROJLIB_CAT_FILTER = 'all'; renderProjLibrary(); }
 // 'KR' | 'IN' | 'inactive'
var PROJLIB_CAT_FILTER = 'all';

var PROJLIB_Q = '';

function renderProjLibrary(){
  var sel = document.getElementById('projlib-role-select'); if(sel) sel.value = DEMO_ROLE;
  renderProjLibTabs();
  renderProjLibFilters();
  renderProjLibGrid();
  /* ［＋新增项目］：只在"本地项目"tab 显示（Notion IN-SRVC-01，2026-10-02）；KR 室长新增赴韩项目要等韩国侧页面（KRC）建好 */
  var add = document.getElementById('projlib-add-btn');
  if(add){
    var show = (PROJLIB_TAB==='IN');
    add.style.display = show ? 'inline-block' : 'none';
    add.disabled = !libCanEdit(PROJLIB_TAB==='KR' ? 'travel' : 'local');
    add.style.opacity = add.disabled ? '.4' : '1';
    add.title = add.disabled ? '本地项目由 IN 室长维护，当前演示角色不能新增' : '';
  }
}


/* ---- 本月活动 / 套餐 tab（CMD-1008-09，IN-SRVC-01 第 3-1 节）：只有 IN 管理者能新增 / 编辑 / 结束，一般室长只看 ---- */
var PROMO_STATUS_STYLE = {'进行中':['var(--sage-bg)','var(--sage)'], '未开始':['#E4E8ED','var(--slate2)'], '已结束':['#EDEAE2','var(--muted)']};
function promoStatusPill(x){ var st = promoStatusOf(x), c = PROMO_STATUS_STYLE[st]; return '<span class="status-pill" style="background:'+c[0]+';color:'+c[1]+';">'+st+'</span>'; }
function periodText(x){ return (x.from ? x.from : '即日起')+' ～ '+(x.to ? x.to : '不限'); }
function promoGridHtml(match){
  var mg = canDo('promo'), rows = PROMOS.filter(function(p){ var pr = projById(p.projectId); return pr && match(pr); }).sort(function(a,b){ return (b.from||'').localeCompare(a.from||''); });
  var head = '<div class="case-field-row" style="font-size:11px;color:var(--muted);font-weight:700;"><span style="flex-grow:1;">项目</span><span style="width:110px;text-align:right;">原价</span><span style="width:110px;text-align:right;">活动价</span><span style="width:190px;">期间</span><span style="width:70px;">状态</span><span style="width:100px;text-align:right;">操作</span></div>';
  var body = rows.map(function(p){
    var pr = projById(p.projectId), st = promoStatusOf(p);
    var act = mg ? (st!=='已结束' ? '<a href="#" class="info-link" onclick="openPromoModal(\''+p.id+'\');return false;">编辑</a> <a href="#" class="info-link" onclick="endPromo(\''+p.id+'\');return false;">结束</a>' : '<a href="#" class="info-link" onclick="openPromoModal(\''+p.id+'\');return false;">编辑</a>') : '<span style="font-size:11px;color:var(--dim);">只读</span>';
    var psp = specById(pr, p.specId) || defaultSpec(pr);
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+pr.name+(psp ? ' · '+psp.label : '')+'</span><span style="width:110px;text-align:right;font-size:12px;color:var(--muted);text-decoration:line-through;">'+fmtRp(psp ? psp.price : pr.price)+'</span><span style="width:110px;text-align:right;font-size:13px;font-weight:700;">'+fmtRp(p.price)+'</span><span style="width:190px;font-size:12px;color:var(--slate2);">'+periodText(p)+'</span><span style="width:70px;">'+promoStatusPill(p)+'</span><span style="width:100px;text-align:right;font-size:12px;">'+act+'</span></div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);padding:20px 4px;">还没有活动价'+(mg ? '，点右上角［＋ 新增活动价］添加' : '')+'</div>';
  return '<div class="card" style="padding:4px 20px;">'+head+body+'</div>';
}
function pkgGridHtml(match){
  var mg = canDo('promo'), rows = PACKAGES.filter(function(k){ return match({name:k.name+' '+packageItemsText(k), names:{}}); }).sort(function(a,b){ return (b.from||'').localeCompare(a.from||''); });
  var head = '<div class="case-field-row" style="font-size:11px;color:var(--muted);font-weight:700;"><span style="width:150px;">名称</span><span style="flex-grow:1;">内含项目</span><span style="width:130px;text-align:right;">套餐价</span><span style="width:170px;">期间</span><span style="width:70px;">状态</span><span style="width:80px;text-align:right;">操作</span></div>';
  var body = rows.map(function(k){
    var st = promoStatusOf(k);
    var act = mg ? (st!=='已结束' ? '<a href="#" class="info-link" onclick="openPkgModal(\''+k.id+'\');return false;">编辑</a> <a href="#" class="info-link" onclick="endPkg(\''+k.id+'\');return false;">结束</a>' : '<a href="#" class="info-link" onclick="openPkgModal(\''+k.id+'\');return false;">编辑</a>') : '<span style="font-size:11px;color:var(--dim);">只读</span>';
    return '<div class="case-field-row"><span style="width:150px;font-size:13px;font-weight:700;">'+k.name+' <span class="status-pill" style="background:#FBE9E7;color:#C1454A;font-size:10px;">不可退款</span></span><span style="flex-grow:1;font-size:12px;color:var(--slate2);">'+packageItemsText(k)+'</span><span style="width:130px;text-align:right;font-size:13px;font-weight:700;">'+fmtRp(k.price)+'<div style="font-size:10px;color:var(--muted);font-weight:400;">原价合计 '+fmtRp(packageListTotal(k))+'</div></span><span style="width:170px;font-size:12px;color:var(--slate2);">'+periodText(k)+'</span><span style="width:70px;">'+promoStatusPill(k)+'</span><span style="width:80px;text-align:right;font-size:12px;">'+act+'</span></div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);padding:20px 4px;">还没有套餐'+(mg ? '，点右上角［＋ 新增套餐］添加' : '')+'</div>';
  return '<div class="card" style="padding:4px 20px;">'+head+body+'</div>';
}
/* 动态弹窗（不在 in.html 里写死）：同一个 id 只建一次 */
function ensurePromoOverlay(id){
  var ov = document.getElementById(id);
  if(!ov){ ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = id; ov.onclick = function(e){ if(e.target===ov) ov.classList.remove('open'); }; ov.innerHTML = '<div class="modal-box" style="width:460px;max-height:86vh;overflow:auto;"></div>'; document.body.appendChild(ov); }
  return ov;
}
function closePromoOverlay(id){ var ov = document.getElementById(id); if(ov) ov.classList.remove('open'); }
function localProjectOptions(selId){ return PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN' && (p.active || p.id===selId); }).map(function(p){ return '<option value="'+p.id+'"'+(p.id===selId?' selected':'')+'>'+p.name+'</option>'; }).join(''); }
function specOptions(projectId, selSpecId){ var p = projById(projectId); return ((p && p.specs) || []).map(function(sp){ return '<option value="'+sp.id+'"'+(sp.id===selSpecId?' selected':'')+'>'+sp.label+'（'+fmtRp(sp.price)+'）</option>'; }).join(''); }
function defaultSpecIdOf(projectId){ var sp = defaultSpec(projById(projectId)); return sp ? sp.id : ''; }
var PROMO_EDIT = null, PKG_EDIT = null;
var PM_INPUT = 'width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;margin-bottom:10px;';
function openPromoModal(id){
  if(!canDo('promo')) return;
  var ex = id ? PROMOS.filter(function(p){ return p.id===id; })[0] : null;
  PROMO_EDIT = ex ? Object.assign({}, ex) : {id:null, projectId:(PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN' && p.active; })[0]||{}).id, specId:'', price:'', from:todayStr(), to:'', ended:false};
  if(!PROMO_EDIT.specId) PROMO_EDIT.specId = defaultSpecIdOf(PROMO_EDIT.projectId);
  renderPromoModal();
}
function renderPromoModal(){
  var e = PROMO_EDIT, ov = ensurePromoOverlay('promo-edit-overlay');
  ov.firstChild.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:14px;"><b style="font-size:15px;">'+(e.id ? '编辑活动价' : '新增活动价')+'</b><span style="cursor:pointer;color:var(--slate);" onclick="closePromoOverlay(\'promo-edit-overlay\')">✕</span></div>'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">本地项目</div><select style="'+PM_INPUT+'" onchange="PROMO_EDIT.projectId=this.value;PROMO_EDIT.specId=defaultSpecIdOf(this.value);renderPromoModal()">'+localProjectOptions(e.projectId)+'</select>'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">规格</div><select style="'+PM_INPUT+'" onchange="PROMO_EDIT.specId=this.value;renderPromoModal()">'+specOptions(e.projectId, e.specId)+'</select>'+
    '<div style="font-size:12px;color:var(--muted);margin:-4px 0 10px;">原价 '+fmtRp(((specById(projById(e.projectId), e.specId))||{}).price)+'</div>'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">活动价（Rp）</div><input type="number" min="0" value="'+(e.price===''?'':e.price)+'" oninput="PROMO_EDIT.price=this.value" style="'+PM_INPUT+'">'+
    '<div style="display:flex;gap:10px;"><div style="flex:1;"><div style="font-size:12px;font-weight:700;margin-bottom:6px;">开始日</div><input type="date" value="'+(e.from||'')+'" onchange="PROMO_EDIT.from=this.value" style="'+PM_INPUT+'"></div><div style="flex:1;"><div style="font-size:12px;font-weight:700;margin-bottom:6px;">结束日</div><input type="date" value="'+(e.to||'')+'" onchange="PROMO_EDIT.to=this.value" style="'+PM_INPUT+'"></div></div>'+
    (e.err ? '<div style="font-size:12px;color:#C1454A;margin-bottom:8px;">'+e.err+'</div>' : '')+
    '<div style="display:flex;gap:10px;"><button class="btn-outline" style="flex:1;" onclick="closePromoOverlay(\'promo-edit-overlay\')">取消</button><button class="btn-primary" style="flex:1;" onclick="savePromo()">保存</button></div>';
  ov.classList.add('open');
}
function savePromo(){
  var e = PROMO_EDIT; if(!e || !canDo('promo')) return;
  var price = Number(e.price), err = '';
  if(!e.projectId) err = '请选择本地项目';
  else if(e.price==='' || isNaN(price) || price<0) err = '请填写活动价（不小于 0 的数字）';
  else if(!e.from || !e.to) err = '请填写开始日和结束日';
  else if(e.to < e.from) err = '结束日不能早于开始日';
  else if(promoOverlap(e.projectId, e.from, e.to, e.id, e.specId)) err = '这个项目（同规格）在这段期间已经有活动价了';
  if(err){ e.err = err; renderPromoModal(); return; }
  if(e.id){ var p = PROMOS.filter(function(x){ return x.id===e.id; })[0]; if(p){ p.projectId = e.projectId; p.specId = e.specId; p.price = price; p.from = e.from; p.to = e.to; } }
  else PROMOS.push({id:newPromoId('pm'), projectId:e.projectId, specId:e.specId, price:price, from:e.from, to:e.to, ended:false});
  PROMO_EDIT = null; closePromoOverlay('promo-edit-overlay'); renderProjLibrary();
}
function endPromo(id){
  if(!canDo('promo')) return; var p = PROMOS.filter(function(x){ return x.id===id; })[0]; if(!p) return;
  if(!confirm('结束这条活动价？结束后本地选购不再带入活动价，恢复原价；已选进案件的成交价不变。')) return;
  p.ended = true; renderProjLibrary();
}
function doCopyLastMonthPromos(){
  if(!canDo('promo')) return;
  var n = copyLastMonthPromos();
  showToast(n ? '已复制上个月活动' : '没有可复制的活动', n ? '新增 '+n+' 条活动价（整体顺延一个月），可在列表里继续编辑' : '上个自然月内没有结束的活动价（或下个月已有同项目的活动价）', null);
  renderProjLibrary();
}
function openPkgModal(id){
  if(!canDo('promo')) return;
  var ex = id ? PACKAGES.filter(function(k){ return k.id===id; })[0] : null;
  PKG_EDIT = ex ? JSON.parse(JSON.stringify(ex)) : {id:null, name:'', items:[{projectId:(PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN' && p.active; })[0]||{}).id, specId:'', qty:1}], price:'', from:todayStr(), to:'', ended:false};
  PKG_EDIT.items.forEach(function(it){ if(!it.specId) it.specId = defaultSpecIdOf(it.projectId); });
  renderPkgModal();
}
function renderPkgModal(){
  var e = PKG_EDIT, ov = ensurePromoOverlay('pkg-edit-overlay');
  var rows = e.items.map(function(it, i){
    return '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;"><select style="flex:1;padding:7px 8px;border:1px solid var(--border);border-radius:8px;font-size:12px;" onchange="PKG_EDIT.items['+i+'].projectId=this.value;PKG_EDIT.items['+i+'].specId=defaultSpecIdOf(this.value);renderPkgModal()">'+localProjectOptions(it.projectId)+'</select><select style="width:150px;padding:7px 8px;border:1px solid var(--border);border-radius:8px;font-size:12px;" onchange="PKG_EDIT.items['+i+'].specId=this.value;renderPkgModal()">'+specOptions(it.projectId, it.specId)+'</select>'+
      qtyInputHtml({value:it.qty||1, min:1, onchange:'PKG_EDIT.items['+i+'].qty=parseInt(this.value,10)||1;renderPkgModal()'})+'<span style="font-size:12px;">次</span>'+
      (e.items.length>1 ? '<a href="#" class="info-link" onclick="PKG_EDIT.items.splice('+i+',1);renderPkgModal();return false;">移除</a>' : '')+'</div>';
  }).join('');
  ov.firstChild.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:14px;"><b style="font-size:15px;">'+(e.id ? '编辑套餐' : '新增套餐')+'</b><span style="cursor:pointer;color:var(--slate);" onclick="closePromoOverlay(\'pkg-edit-overlay\')">✕</span></div>'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">套餐名称</div><input type="text" value="'+(e.name||'').replace(/"/g,'&quot;')+'" oninput="PKG_EDIT.name=this.value" style="'+PM_INPUT+'">'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">内含项目 × 次数</div>'+rows+'<a href="#" class="info-link" style="font-size:12px;" onclick="var np=(PROJECT_LIBRARY.filter(function(p){return p.origin===\'IN\'&&p.active;})[0]||{}).id;PKG_EDIT.items.push({projectId:np,specId:defaultSpecIdOf(np),qty:1});renderPkgModal();return false;">＋ 添加内含项目</a>'+
    '<div style="font-size:11px;color:var(--muted);margin:8px 0 12px;">原价合计 '+fmtRp(packageListTotal(e))+'</div>'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">套餐价（Rp）</div><input type="number" min="0" value="'+(e.price===''?'':e.price)+'" oninput="PKG_EDIT.price=this.value" style="'+PM_INPUT+'">'+
    '<div style="display:flex;gap:10px;"><div style="flex:1;"><div style="font-size:12px;font-weight:700;margin-bottom:6px;">有效期开始（可空）</div><input type="date" value="'+(e.from||'')+'" onchange="PKG_EDIT.from=this.value" style="'+PM_INPUT+'"></div><div style="flex:1;"><div style="font-size:12px;font-weight:700;margin-bottom:6px;">有效期结束（可空）</div><input type="date" value="'+(e.to||'')+'" onchange="PKG_EDIT.to=this.value" style="'+PM_INPUT+'"></div></div>'+
    '<div style="font-size:11px;color:var(--muted);margin:-4px 0 10px;">套餐不可退款：付款后拆成各项目的持有批次，批次标「套餐」，客户详情不显示退款按钮</div>'+
    (e.err ? '<div style="font-size:12px;color:#C1454A;margin-bottom:8px;">'+e.err+'</div>' : '')+
    '<div style="display:flex;gap:10px;"><button class="btn-outline" style="flex:1;" onclick="closePromoOverlay(\'pkg-edit-overlay\')">取消</button><button class="btn-primary" style="flex:1;" onclick="savePkg()">保存</button></div>';
  ov.classList.add('open');
}
function savePkg(){
  var e = PKG_EDIT; if(!e || !canDo('promo')) return;
  var price = Number(e.price), err = '';
  if(!(e.name||'').trim()) err = '请填写套餐名称';
  else if(!e.items.length || e.items.some(function(it){ return !it.projectId; })) err = '请至少添加一个内含项目';
  else if(e.price==='' || isNaN(price) || price<0) err = '请填写套餐价（不小于 0 的数字）';
  else if(e.from && e.to && e.to < e.from) err = '有效期结束不能早于开始';
  if(err){ e.err = err; renderPkgModal(); return; }
  var rec = {name:e.name.trim(), items:e.items.map(function(it){ return {projectId:it.projectId, specId:it.specId, qty:it.qty||1}; }), price:price, from:e.from||'', to:e.to||''};
  if(e.id){ var k = PACKAGES.filter(function(x){ return x.id===e.id; })[0]; if(k) Object.assign(k, rec); }
  else PACKAGES.push(Object.assign({id:newPromoId('pk'), ended:false}, rec));
  PKG_EDIT = null; closePromoOverlay('pkg-edit-overlay'); renderProjLibrary();
}
function endPkg(id){
  if(!canDo('promo')) return; var k = PACKAGES.filter(function(x){ return x.id===id; })[0]; if(!k) return;
  if(!confirm('结束这个套餐？结束后不能再被选购；已付款拆出的持有批次不变。')) return;
  k.ended = true; renderProjLibrary();
}

function renderProjLibTabs(){
  var el = document.getElementById('projlib-tabs'); if(!el) return;
  var tabs = [{k:'KR', label:'赴韩项目'+(DEMO_ROLE==='in'?'（只读）':'')}, {k:'IN', label:'本地项目'}].concat(DEMO_ROLE==='in' ? [{k:'promo', label:'本月活动'}, {k:'pkg', label:'套餐'}] : []).concat([{k:'inactive', label:'非活性化'}]); /* 2026-10-08：IN 加本月活动 / 套餐 */
  el.innerHTML = tabs.map(function(t){
    return '<span class="tab'+(PROJLIB_TAB===t.k?' active':'')+'" onclick="setProjLibTab(\''+t.k+'\')">'+t.label+'</span>';
  }).join('');
}

function renderProjLibFilters(){
  var el = document.getElementById('projlib-filters'); if(!el) return;
  var search = '<input type="text" id="projlib-search" placeholder="搜索项目名称" value="'+PROJLIB_Q.replace(/"/g,'&quot;')+'" oninput="PROJLIB_Q=this.value;renderProjLibGrid();" style="width:220px;padding:7px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;">';
  if(PROJLIB_TAB==='inactive'){ el.innerHTML = '<div style="display:flex;gap:10px;align-items:center;">'+search+'</div>'; return; }
  if(PROJLIB_TAB==='promo' || PROJLIB_TAB==='pkg'){
    var mg = canDo('promo');
    el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;"><div style="display:flex;gap:8px;align-items:center;">'+search+
      '<span style="font-size:11px;color:var(--muted);">'+(PROJLIB_TAB==='promo' ? '活动价期间内，本地选购默认带入活动价；过期自动恢复原价' : '套餐不可退款；付款后拆成各项目的持有批次')+(mg ? '' : '　·　只有 IN 管理者能新增 / 编辑 / 结束')+'</span></div>'+
      (mg ? '<div style="display:flex;gap:8px;">'+(PROJLIB_TAB==='promo' ? '<button class="btn-outline" style="padding:6px 12px;font-size:12px;" onclick="doCopyLastMonthPromos()">复制上个月活动</button><button class="btn-primary" style="padding:6px 12px;font-size:12px;" onclick="openPromoModal()">＋ 新增活动价</button>' : '<button class="btn-primary" style="padding:6px 12px;font-size:12px;" onclick="openPkgModal()">＋ 新增套餐</button>')+'</div>' : '')+'</div>';
    return;
  }
  var origin = PROJLIB_TAB;
  var cats = projLibCategories(origin);
  var canEdit = libCanEdit(origin==='KR' ? 'travel' : 'local');
  var chips = '<span class="chip'+(PROJLIB_CAT_FILTER==='all'?' active':'')+'" onclick="setProjLibCatFilter(\'all\')">全部</span>'+
    cats.map(function(cat){ return '<span class="chip'+(PROJLIB_CAT_FILTER===cat.id?' active':'')+'" onclick="setProjLibCatFilter(\''+cat.id+'\')">'+cat.label+'</span>'; }).join('');
  var ccyOptions = origin==='KR' ? ['KRW','IDR','CNY'] : ['IDR','CNY'];
  var curCcy = origin==='KR' ? PROJ_DISPLAY_CCY_KR : PROJ_DISPLAY_CCY_IN;
  var ccySwitch = '<select onchange="setProjDisplayCcy(\''+origin+'\',this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;">'+
    ccyOptions.map(function(c){
      var label = c==='KRW'?'韩元（原价）':(c==='IDR'?(origin==='IN'?'印尼盾（原价）':'印尼盾'):'人民币');
      return '<option value="'+c+'"'+(curCcy===c?' selected':'')+'>'+label+'</option>';
    }).join('')+'</select>';
  var hospSwitch = ''; /* 一诊所一医院：不切换医院 */
  el.innerHTML = (hospSwitch ? '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">'+hospSwitch+'</div>' : '')+'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'+search+chips+'</div>'+
    '<div style="display:flex;gap:10px;align-items:center;">'+ccySwitch+
    '<button class="btn-outline" style="padding:6px 12px;font-size:12px;'+(canEdit?'':'opacity:.4;cursor:not-allowed;')+'" '+(canEdit?'':'disabled title="这一组的分类由 '+(origin==='KR'?'KR 室长':'IN 室长')+' 管理"')+' onclick="openProjCatModal(\''+origin+'\')">管理分类</button></div></div>';
}

/* ［管理分类］弹窗 */
var PROJCAT_ORIGIN = null;

function openProjCatModal(origin){ PROJCAT_ORIGIN = origin; renderProjCatModal(); document.getElementById('projcat-overlay').classList.add('open'); }

function closeProjCatModal(){ document.getElementById('projcat-overlay').classList.remove('open'); }

function renderProjCatModal(){
  var origin = PROJCAT_ORIGIN; if(!origin) return;
  document.getElementById('projcat-title').textContent = '管理分类 · '+(origin==='KR'?'赴韩项目':'本地项目');
  document.getElementById('projcat-body').innerHTML = projLibCategories(origin).map(function(cat){
    var n = PROJECT_LIBRARY.filter(function(p){ return p.categoryId===cat.id; }).length;
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+cat.label+' <span style="font-size:11px;color:var(--muted);">'+n+' 个项目</span></span>'+
      '<span class="fa" style="gap:12px;"><a href="#" class="info-link" onclick="renameProjCategory(\''+cat.id+'\');return false;">改名</a>'+
      (n ? '<span style="color:var(--muted);cursor:not-allowed;" title="分类下还有项目（包括非活性化的），不能删除">删除</span>' : '<a href="#" class="info-link" onclick="deleteProjCategory(\''+cat.id+'\');return false;">删除</a>')+'</span></div>';
  }).join('')+'<div style="margin-top:12px;"><button class="btn-ghost" onclick="addProjCategoryUI(\''+origin+'\')">＋ 新增分类</button></div>';
}

function addProjCategoryUI(origin){
  var name = prompt('新增分类名称');
  if(!name || !name.trim()) return;
  addProjCategory(name.trim(), origin);
  renderProjLibrary(); renderProjCatModal();
}

function renameProjCategory(id){
  var cat = PROJECT_CATEGORIES[id]; if(!cat) return;
  var name = prompt('修改分类名称', cat.label);
  if(name===null || !name.trim()) return;
  cat.label = name.trim();
  renderProjLibrary(); renderProjCatModal();
}

function deleteProjCategory(id){
  var hasItems = PROJECT_LIBRARY.some(function(p){ return p.categoryId===id; });
  if(hasItems){ alert('这个分类下还有项目（包括已非活性化的），请先把项目改挂到别的分类再删除'); return; }
  if(!confirm('确认删除这个分类？')) return;
  delete PROJECT_CATEGORIES[id];
  if(PROJLIB_CAT_FILTER===id) PROJLIB_CAT_FILTER = 'all';
  renderProjLibrary(); renderProjCatModal();
}

function renderProjLibGrid(){
  var el = document.getElementById('projlib-grid'); if(!el) return;
  var q = (PROJLIB_Q||'').toLowerCase();
  var match = function(p){ return !q || p.name.toLowerCase().indexOf(q)>-1 || ((p.names||{}).ko||'').toLowerCase().indexOf(q)>-1 || ((p.names||{}).id||'').toLowerCase().indexOf(q)>-1; };
  if(PROJLIB_TAB==='inactive'){
    var inactive = PROJECT_LIBRARY.filter(function(p){ return !p.active && match(p) && (p.origin!=='KR' || (p.hospitalId===projLibHospital() && !isKrPostcareCat(p.categoryId))); }); /* IN 不显示「韩国术后管理」（CMD-1012-01 L-002） */
    var groups = [{origin:'KR', label:'赴韩项目'}, {origin:'IN', label:'本地项目'}];
    el.innerHTML = groups.map(function(g){
      var items = inactive.filter(function(p){ return p.origin===g.origin; });
      if(!items.length) return '';
      return '<div style="margin-bottom:18px;"><div class="info-heading" style="margin-bottom:8px;">'+g.label+'</div>'+
        '<div class="card" style="padding:4px 20px;">'+projLibHeadHtml()+items.map(projLibRowHtml).join('')+'</div></div>';
    }).join('') || '<div style="font-size:12px;color:var(--muted);padding:20px 4px;">没有已非活性化的项目</div>';
    return;
  }
  if(PROJLIB_TAB==='promo'){ el.innerHTML = promoGridHtml(match); return; }
  if(PROJLIB_TAB==='pkg'){ el.innerHTML = pkgGridHtml(match); return; }
  var origin = PROJLIB_TAB;
  var items = PROJECT_LIBRARY.filter(function(p){ return p.origin===origin && p.active && match(p) && (origin!=='KR' || (p.hospitalId===projLibHospital() && !isKrPostcareCat(p.categoryId))); }); /* 赴韩项目：只看所选医院的 */
  if(PROJLIB_CAT_FILTER!=='all') items = items.filter(function(p){ return p.categoryId===PROJLIB_CAT_FILTER; });
  /* 按类别分组，一个项目一行（CMD-1012-04） */
  var catIds = []; items.forEach(function(p){ if(catIds.indexOf(p.categoryId)<0) catIds.push(p.categoryId); });
  el.innerHTML = '<div class="card" style="padding:4px 20px;">'+projLibHeadHtml()+
    (items.length ? catIds.map(function(cid){ var cat = PROJECT_CATEGORIES[cid]; return '<div style="font-size:12px;font-weight:700;color:var(--terracotta);padding:10px 0 2px;">'+(cat ? cat.label : '其他')+'</div>'+items.filter(function(p){ return p.categoryId===cid; }).map(projLibRowHtml).join(''); }).join('') : '<div style="font-size:12px;color:var(--muted);padding:20px 4px;">没有符合条件的项目</div>')+
    '</div>';
}

function deactivateProj(id){
  var p = projById(id); if(!p) return;
  if(!confirm('非活性化"'+p.name+'"？之后案件的项目选择里不再出现；已选进案件的、客人已持有的批次照常。')) return;
  p.active = false;
  renderProjLibrary();
}

function deleteProj(id){
  var p0 = projById(id); if(!p0 || p0.active) return; /* 只有非活性化的才能删 */
  var why = projDeleteBlockReason(p0); if(why){ alert('不能删除：'+why); return; }
  if(!confirm('确认从项目库彻底删除"'+p0.name+'"？已结束案件里的历史记录和客人已持有的批次不受影响（快照）。')) return;
  PROJECT_LIBRARY = PROJECT_LIBRARY.filter(function(p){ return p.id!==id; });
  renderProjLibrary();
}

/* ---- 新增/编辑项目表单：复用一个简单弹窗，字段少，不单独占一个 modal-box 之外的样式 ---- */
var PROJ_EDIT = null;

function openProjNewModal(){
  var origin = DEMO_ROLE==='kr' ? 'KR' : 'IN';
  PROJ_EDIT = {id:null, name:'', names:{zh:'',ko:'',id:''}, price:'', origin:origin, categoryId:(projLibCategories(origin)[0]||{}).id||'', specs:origin==='IN' ? [{id:'sp'+(LOCAL_SPEC_SEQ++), label:'1次', price:'', times:1}] : undefined, neg:false, opt:null};
  renderProjEditModal();
  document.getElementById('proj-edit-overlay').classList.add('open');
}

function openProjEditModal(id){
  var p = projById(id); if(!p) return;
  PROJ_EDIT = Object.assign({}, p); if(p.specs) PROJ_EDIT.specs = p.specs.map(function(x){ return Object.assign({}, x); }); if(p.opt) PROJ_EDIT.opt = {label:p.opt.label, rules:(p.opt.rules||[{match:'*', values:p.opt.values||[]}]).map(function(r){ return {match:r.match, values:r.values.slice()}; })}; PROJ_EDIT.names = p.names ? Object.assign({}, p.names) : {zh:p.name, ko:'', id:''};
  renderProjEditModal();
  document.getElementById('proj-edit-overlay').classList.add('open');
}

function closeProjEditModal(){ document.getElementById('proj-edit-overlay').classList.remove('open'); PROJ_EDIT = null; }

function projAiFillNames(){
  var p = PROJ_EDIT; if(!p) return;
  var n = ensureProjNames(p);
  var from = ['zh','ko','id'].filter(function(k){ return (n[k]||'').trim(); })[0];
  if(!from){ alert('请至少填一种语言的名称'); return; }
  ['zh','ko','id'].forEach(function(k){ if(!(n[k]||'').trim()) n[k] = demoTranslate(n[from].trim(), from, k); });
  renderProjEditModal();
}

function renderProjEditModal(){
  var p = PROJ_EDIT; if(!p) return;
  document.getElementById('proj-edit-title').textContent = (p.id ? '编辑项目' : '新增项目') + (p.origin==='KR' ? '（赴韩项目）' : '（本地项目）');
  var cats = projLibCategories(p.origin);
  var n = ensureProjNames(p);
  var inp = function(lang){ return '<div class="case-field-row"><span class="fk">'+LANG_LABEL[lang]+'</span><input type="text" value="'+(n[lang]||'').replace(/"/g,'&quot;')+'" oninput="setProjName(\''+lang+'\',this.value)" style="flex-grow:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div>'; };
  document.getElementById('proj-edit-body').innerHTML =
    '<div style="font-size:12px;font-weight:700;margin-bottom:4px;">项目名称 <span style="color:#C1454A;">*</span> <span style="font-weight:400;color:var(--muted);">只填一种语言，其他语言用 AI 翻译，可手动修改</span></div>'+
    inp('zh')+inp('ko')+inp('id')+
    '<div style="margin:6px 0 10px;"><button class="btn-ghost" style="font-size:11px;" onclick="projAiFillNames()">AI 翻译补全（演示）</button></div>'+
    specEdHtml('PROJ_EDIT', 'renderProjEditModal()', currencyOf(p.origin), p)+
    '<div class="case-field-row"><span class="fk">分类</span><select style="flex-grow:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;" onchange="PROJ_EDIT.categoryId=this.value">'+
      cats.map(function(c){ return '<option value="'+c.id+'"'+(p.categoryId===c.id?' selected':'')+'>'+c.label+'</option>'; }).join('')+
    '</select></div>'+
    '<span class="error-text" id="proj-edit-error" style="display:'+(p.errorMsg?'block':'none')+';margin-bottom:10px;">'+(p.errorMsg||'')+'</span>'+
    '<button class="btn-primary" style="width:100%;" onclick="saveProj()">保存</button>';
}

var NOTIF_FILTER = '全部';

function updateBell(){
  var u = unreadCount();
  document.querySelectorAll('.bell-badge').forEach(function(b){ b.textContent = u>99 ? '99+' : u; b.style.display = u ? 'flex' : 'none'; });
}

/* 生成通知：自动算收件人，收件人里有我就弹 toast（点 toast = 点这条通知） */
function pushNotif(cat, text, opts){
  opts = opts || {};
  var c = opts.caseId ? CASE_ITEMS.filter(function(x){ return x.id===opts.caseId; })[0] : null;
  var rec;
  if(opts.names) rec = opts.names.slice();
  else if(c){ var t = pushTargets(c); rec = t.inn.concat(t.kr); }
  else rec = workingIN();
  if(cat==='系统' && typeof clinicAccounts==='function'){ clinicAccounts().forEach(function(a){ if(a.role==='owner' && a.status==='active' && a.name && rec.indexOf(a.name)<0) rec.push(a.name); }); } /* CMD-1014-16：老板只收「系统」类 */
  rec = rec.filter(function(x){ return x!==ME_NAME; }); /* 操作人自己不收自己触发的通知 */
  var n = {id:'n'+(++NOTIF_SEQ), cat:cat, by:ME_NAME, level:opts.level || notifLevel(text), text:text, caseId:opts.caseId||null, ts:opts.ts||nowFullDt(), recipients:rec, read:{}, link:opts.link||(c?{kind:'case'}:{kind:'none'}), detail:opts.detail||null};
  if(opts.read) n.read[ME_NAME] = true;
  NOTIFS.unshift(n);
  updateBell();
  if(CURRENT_PAGE_ID==='in-notifications') renderNotifPage();
  if(opts.silent) n.silent = true;
  if(NOTIF_SEEN) NOTIF_SEEN[notifKey(n)] = 1; /* 本页自己产生的：下面直接弹，不要再被 toastNewNotifs 重复弹 */
  if(!opts.silent && notifMine(n) && notifyPushOn()){
    if(newTodoOn()){ var tk = notifTodoKind(n); if(tk!=='msg') showToast(NOTIF_ICON[cat]+' '+cat, tzRender(text), function(){ openNotif(n.id, 'toast'); }, {sticky: tk==='stay'}); } /* CMD-1013-17：消息不弹；新待办弹一次自动收起；被 @ / 未接来电停留 */
    else showToast(NOTIF_ICON[cat]+' '+cat, tzRender(text), function(){ openNotif(n.id, 'toast'); }, {sticky:n.level!=='info'});
  }
  return n;
}

function closeBellDropdown(){ var d = document.getElementById('bell-dd'); if(d) d.remove(); }

function toggleBellDropdown(ev){
  if(ev) ev.stopPropagation();
  if(document.getElementById('bell-dd')){ closeBellDropdown(); return; }
  try{ closeDrawer(); }catch(e){} /* CMD-1014-15：对话和通知一次只开一个 */
  var btn = ev && ev.currentTarget, r = btn ? btn.getBoundingClientRect() : {bottom:56, right:window.innerWidth-24};
  var list = myNotifs().sort(function(a,b){ return b.ts.localeCompare(a.ts); }).slice(0,6);
  var d = document.createElement('div');
  d.id = 'bell-dd';
  d.style.cssText = 'position:fixed;top:'+(r.bottom+8)+'px;right:'+Math.max(12, window.innerWidth-r.right-10)+'px;width:340px;background:#fff;border:1px solid var(--border);border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.16);z-index:75;overflow:hidden;';
  d.onclick = function(e){ e.stopPropagation(); };
  d.innerHTML = '<div style="padding:10px 14px;font-size:12px;font-weight:700;border-bottom:1px solid var(--border2);">最近通知</div>'+
    (list.length ? list.map(function(n){
      return '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-bottom:1px solid var(--border2);cursor:pointer;" onclick="openNotif(\''+n.id+'\',\'bell\')"><span>'+NOTIF_ICON[n.cat]+'</span><div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:'+(n.read[ME_NAME]?'500':'700')+';">'+tzRender(n.text)+'</div><div style="font-size:10px;color:var(--muted);">'+fmtUtc(n.ts)+'</div></div>'+(n.read[ME_NAME]?'':'<span style="width:7px;height:7px;border-radius:50%;background:var(--terracotta);margin-top:5px;"></span>')+'</div>';
    }).join('') : '<div style="padding:14px;font-size:12px;color:var(--muted);">没有通知</div>')+
    (canDo('work') ? '<div style="padding:10px 14px;text-align:center;"><a href="#" class="info-link" onclick="closeBellDropdown();nav(\'in-notifications\');return false;">查看全部</a></div>' : '');
  document.body.appendChild(d);
}

/* 点通知：标为已读并打开对应内容；通知中心页里点 = 页内跳转；正在某个案件里从铃铛/toast 点 = 新标签页 */
function openNotif(id, src){
  var n = NOTIFS.filter(function(x){ return x.id===id; })[0]; if(!n) return;
  n.read[ME_NAME] = true; updateBell(); closeBellDropdown();
  if(CURRENT_PAGE_ID==='in-notifications') renderNotifPage();
  var newTab = (src!=='page' && CURRENT_PAGE_ID==='in-casedetail');
  var k = n.link.kind;
  if(k==='system'){ openNotifDetail(n); return; }
  if(k==='mention'){
    if(n.caseId && newTab){ openCaseNewTab(n.caseId, '&chat=open'); return; }
    gotoQuoteSource(n.link.roomId, n.link.msgIdx); return; /* 被 @ → 打开该对话并定位到消息 */
  }
  if(k==='caseRoom'){
    if(newTab) openCaseNewTab(n.caseId, '&chat=open'); else openCaseRoom(n.caseId);
    return;
  }
  if(k==='subBook'){ if(n.caseId) openSubBookModal(n.caseId, n.link.subId); return; } /* KR 通知预约 → 预约弹窗 */
  if(n.caseId){ if(newTab) openCaseNewTab(n.caseId); else openCaseDetail(n.caseId); }
}

function openNotifDetail(n){
  var d = n.detail || {title:'诊所设定更新', changes:[tzRender(n.text)], effective:''};
  document.getElementById('notif-detail-title').textContent = d.title;
  document.getElementById('notif-detail-body').innerHTML = '<div style="margin-bottom:6px;"><b>改了什么</b></div>'+d.changes.map(function(x){ return '<div>• '+x+'</div>'; }).join('')+(d.effective ? '<div style="margin-top:10px;"><b>何时生效</b>　'+d.effective+'</div>' : '')+'<div style="margin-top:10px;font-size:11px;color:var(--muted);">发布于 '+n.ts+'；诊所所有 IN 室长都会收到，当时没上线的下次登录时弹出。</div>';
  document.getElementById('notif-detail-overlay').classList.add('open');
}

function closeNotifDetail(){ document.getElementById('notif-detail-overlay').classList.remove('open'); }
 /* 当前筛选下的通知全部标为已读 */
function renderNotifPage(){
  var f = document.getElementById('notif-filters'), l = document.getElementById('notif-list'); if(!f || !l) return;
  f.innerHTML = ['全部','未读'].concat(NOTIF_CATS).map(function(x){ return '<span class="chip'+(NOTIF_FILTER===x?' active':'')+'" onclick="setNotifFilter(\''+x+'\')">'+x+(x==='未读' ? ' '+unreadCount() : '')+'</span>'; }).join('');
  var list = notifFiltered();
  l.innerHTML = list.map(function(n){
    var c = n.caseId ? CASE_ITEMS.filter(function(x){ return x.id===n.caseId; })[0] : null, un = !n.read[ME_NAME];
    return '<div class="nrow" style="cursor:pointer;" onclick="openNotif(\''+n.id+'\',\'page\')"><span class="ndot" style="background:'+(un?'var(--terracotta)':'transparent')+';"></span><span style="font-size:18px;margin-right:4px;">'+NOTIF_ICON[n.cat]+'</span>'+
      '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:'+(un?'700':'500')+';">'+tzRender(n.text)+'</div><div style="font-size:11px;color:var(--muted);">'+n.cat+(c&&c.caseNo ? ' · '+c.caseNo : '')+' · '+fmtUtc(n.ts)+' · 收件：'+n.recipients.join('、')+'</div></div>'+
      '<span class="status-pill" style="background:'+(un?'var(--terracotta-bg)':'var(--border2)')+';color:'+(un?'var(--terracotta)':'var(--muted)')+';">'+(un?'未读':'已读')+'</span></div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);padding:16px 2px;">没有通知</div>';
}

function buildNotifications(){ renderNotifPage(); updateBell(); }

var DRAWER_TAB = 'staff';

function setDrawerTab(tab){
  DRAWER_TAB = tab;
  document.getElementById('drawer-tab-staff').style.borderBottom = tab==='staff' ? '2px solid var(--navy)' : 'none';
  document.getElementById('drawer-tab-case').style.borderBottom = tab==='case' ? '2px solid var(--navy)' : 'none';
  document.getElementById('drawer-foot-btn').textContent = tab==='case' ? '+ 新建案件对话' : '+ 新建职员对话';
  renderDrawerList();
}

function openNewCaseChatModal(){
  var eligible = CASE_ITEMS.filter(function(c){ return caseRoomEligible(c) && !isEnded(c) && !CHAT_DATA.hasOwnProperty(getCaseRoomId(c.id)); }); /* 符合建房条件、不是终态、还没有房间的案件 */
  document.getElementById('new-case-chat-list').innerHTML = eligible.map(function(c){
    return '<button class="btn-outline" style="text-align:left;" onclick="confirmNewCaseChat(\''+c.id+'\')">'+c.name+' · '+c.caseNo+'</button>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);padding:10px 4px;">没有可以新建对话的案件（符合建房条件、不是终态、还没有房间的案件才会出现在这里）</div>';
  document.getElementById('new-case-chat-overlay').classList.add('open');
}

function closeNewCaseChatModal(){ document.getElementById('new-case-chat-overlay').classList.remove('open'); }

var NEW_STAFF_SELECTED = [];

function openNewStaffChatModal(){
  NEW_STAFF_SELECTED = [];
  renderNewStaffChatList();
  document.getElementById('new-staff-chat-overlay').classList.add('open');
}

function closeNewStaffChatModal(){ document.getElementById('new-staff-chat-overlay').classList.remove('open'); }

function toggleNewStaffPick(id){
  var idx = NEW_STAFF_SELECTED.indexOf(id);
  if(idx>-1) NEW_STAFF_SELECTED.splice(idx,1); else NEW_STAFF_SELECTED.push(id);
  renderNewStaffChatList();
}

function renderNewStaffChatList(){
  document.getElementById('new-staff-chat-list').innerHTML = STAFF_ROSTER.filter(function(s){ return s.name.split(' ')[0]!==ME_NAME; }).map(function(s){
    var checked = NEW_STAFF_SELECTED.indexOf(s.id)>-1;
    return '<label style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border2);font-size:13px;cursor:pointer;"><input type="checkbox" onchange="toggleNewStaffPick(\''+s.id+'\')" '+(checked?'checked':'')+'><span>'+s.name+'</span></label>';
  }).join('');
}

function confirmNewStaffChat(){
  if(!NEW_STAFF_SELECTED.length){ alert('请至少选择一位同事'); return; }
  var roomId;
  if(NEW_STAFF_SELECTED.length===1){
    roomId = NEW_STAFF_SELECTED[0];
  } else {
    roomId = 'grp-' + NEW_STAFF_SELECTED.slice().sort().join('-');
    if(!roomById(roomId)){
      var names = NEW_STAFF_SELECTED.map(function(id){
        var s = STAFF_ROSTER.filter(function(x){ return x.id===id; })[0];
        return s ? s.name.split(' ')[0] : id;
      }).join('、');
      ROOMS.push({id:roomId, name:names, color:'var(--blue)', init:'G', date:'刚刚'});
    }
  }
  closeNewStaffChatModal();
  openFloatingChat(roomId); /* 成员完全相同的房已存在时会直接进原来的房，不会重开重复的群 */
}

function openDrawer(){
  try{ closeBellDropdown(); }catch(e){} /* CMD-1014-15：对话和通知一次只开一个 */
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('chat-drawer').classList.add('open');
  setDrawerTab(DRAWER_TAB);
}

function closeDrawer(){
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('chat-drawer').classList.remove('open');
}

function toggleDrawerSearch(){
  document.getElementById('drawer-search-wrap').classList.toggle('open');
}

function renderDrawerList(){
  var q = (document.getElementById('drawer-search-input').value || '').toLowerCase();
  var html = '';
  var callLabel = VIDEO_CALL.active ? callTitle()+' · 视频沟通 进行中，点击重新加入' : '';
  if(VIDEO_CALL.active && (!q || callLabel.toLowerCase().indexOf(q)>-1)){ /* 置顶①：进行中的视频红卡片 */
    html += '<div class="chat-card urgent" onclick="closeDrawer();rejoinCall();"><span class="sq-avt" style="background:#C1454A;">●</span><div><div style="font-size:13px;font-weight:700;color:#C1454A;">'+callLabel+'</div><div style="font-size:11px;color:var(--slate);">点击重新加入视频通话</div></div></div>';
  }
  var unreadDot = function(id){ var u = ROOM_UNREAD[id]||0; return u ? '<span class="badge" style="position:static;width:auto;min-width:16px;height:16px;padding:0 4px;border-radius:999px;display:inline-flex;margin-left:6px;">'+u+'</span>' : ''; };
  if(DRAWER_TAB==='case'){
    var items = CASE_ITEMS.filter(function(c){ return CHAT_DATA.hasOwnProperty(getCaseRoomId(c.id)); })
      .filter(function(c){ return !q || c.name.toLowerCase().indexOf(q)>-1 || (c.caseNo && c.caseNo.toLowerCase().indexOf(q)>-1); })
      .sort(function(a,b){ return roomLastKey(getCaseRoomId(b.id)) - roomLastKey(getCaseRoomId(a.id)); }); /* 其他房间按最新消息排序 */
    items.forEach(function(c){
      var b = caseStageBadge(c), rid = getCaseRoomId(c.id);
      html += '<div class="chat-card" onclick="openCaseRoom(\''+c.id+'\')"><span class="sq-avt" style="background:var(--terracotta);">'+c.name.charAt(0).toUpperCase()+'</span>'+
        '<div style="flex-grow:1;"><div style="font-size:13px;font-weight:700;">'+c.name+unreadDot(rid)+'</div><div style="font-size:11px;color:var(--muted);">Case：'+c.caseNo+'</div></div>'+
        '<div style="text-align:right;"><span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';">'+b[2]+'</span><div style="font-size:11px;color:var(--muted);margin-top:4px;">'+((CHAT_DATA[rid]||[]).slice(-1)[0]||{}).time+'</div></div></div>';
    });
    if(!items.length) html += '<div style="font-size:12px;color:var(--muted);padding:16px 4px;">没有匹配的案件</div>';
  } else {
    var rooms = ROOMS.filter(function(r){ return roomVisibleToMe(r.id) && (!q || r.name.toLowerCase().indexOf(q)>-1); });
    rooms.sort(function(a,b){ if(a.isMain!==b.isMain) return a.isMain ? -1 : 1; return roomLastKey(b.id)-roomLastKey(a.id); }); /* 置顶②：Main 全员群；其他按最新消息排序 */
    rooms.forEach(function(r){
      var pin = r.isMain ? '<span class="pin-icon">📌</span>' : '';
      var last = (CHAT_DATA[r.id]||[]).slice(-1)[0];
      html += '<div class="chat-card" onclick="openFloatingChat(\''+r.id+'\')"><span class="sq-avt" style="background:'+r.color+';">'+r.init+'</span><div><div style="font-size:13px;font-weight:700;">'+pin+r.name+unreadDot(r.id)+'</div><div style="font-size:11px;color:var(--muted);">'+(last ? last.day+' '+last.time : r.date)+'</div></div></div>';
    });
  }
  document.getElementById('drawer-list').innerHTML = html;
  updateChatBadge();
}

/* ================= floating chat window ================= */
var CURRENT_ROOM = 'kr-lee';

function updateChatBadge(){
  var u = totalUnread();
  document.querySelectorAll('.chat-badge').forEach(function(b){ b.textContent = u>99 ? '99+' : u; b.style.display = u ? 'flex' : 'none'; });
}

function renderFloatToolbar(){
  var el = document.getElementById('float-toolbar'); if(!el) return;
  var isCase = CURRENT_ROOM.indexOf('case-')===0;
  var btn = function(label, fn, extra, title){ return '<button class="btn-outline" style="padding:5px 12px;font-size:12px;'+(extra||'')+'"'+(title?' title="'+title+'"':'')+' onclick="'+fn+'">'+label+'</button>'; };
  var html = '<span style="position:relative;display:inline-block;">'+btn('＋','toggleAttachMenu()','','上传')+
    '<div id="attach-menu" style="display:none;position:absolute;bottom:36px;left:0;background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:0 6px 18px rgba(27,38,53,.15);min-width:96px;z-index:5;overflow:hidden;">'+
    ['文件','照片','视频'].map(function(t){ return '<div style="padding:9px 14px;font-size:13px;cursor:pointer;" onclick="sendRoomFile(\''+t+'\')">'+t+'</div>'; }).join('')+'</div></span>';
  if(isCase){
    var c = CASE_ITEMS.filter(function(x){ return x.id===CURRENT_ROOM.slice(5); })[0];
    var en = roomVideoEnabled(c);
    html += btn('🎥 视频通话', en ? 'toolbarVideo()' : 'toolbarVideoBlocked()', en ? '' : 'opacity:.4;cursor:not-allowed;',
      en ? '发起视频通话' : (c && caseHasKrSide(c) ? 'KR室长进入房间后才可用' : '这个案件没有KR室长（不面诊），视频通话不可用'));
  }
  html += btn('引用案件', 'openMentionCase()');
  el.innerHTML = html;
}

/* ---- 引用案件（2026-10-02 增量，取代"提及案件"）：工具栏［引用案件］或输入框打 # → 选案件 → 案件 chip 挂在输入框上方（可 ✕）→ 写内容 → 发送。
   消息下方显示灰底圆角条：进行中 = 📄 引用案件 A000xxx 查看案件 ［转到案件对话］；终态 = 📄 引用案件 A000xxx 查看案件。
   发出的消息会写入该案件：已有房间 → 进案件房（发言人 ｜ 来源房间 ↗ + 原文 + 译文）；符合建房条件但没房间 → 开房间放进去；
   还没到建房条件 → 先记在案件 Timeline，房间建立后带进房间；终态案件：可以挂、可以发，但不写入。候选可以包含基础资料还没确认的案件 ---- */
var REF_CHIP = null;

function renderRefChip(){
  var el = document.getElementById('float-ref-chip'); if(!el) return;
  var c = REF_CHIP ? CASE_ITEMS.filter(function(x){ return x.id===REF_CHIP; })[0] : null;
  if(!c){ el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'flex';
  el.innerHTML = '<span class="chip active" style="display:inline-flex;align-items:center;gap:6px;">📄 引用案件 '+(c.caseNo||c.name)+' · '+c.name+'<span style="cursor:pointer;" onclick="clearRefChip()">✕</span></span>';
}

function setRefChip(id){ REF_CHIP = id; renderRefChip(); var i = document.getElementById('float-input-box'); if(i) i.focus(); }

function openMentionCase(){
  document.getElementById('mention-case-list').innerHTML = CASE_ITEMS.map(function(c){
    var b = caseStageBadge(c);
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 4px;font-size:13px;cursor:pointer;border-bottom:1px solid var(--border2);" onclick="pickRefCase(\''+c.id+'\')">'+c.name+' · '+(c.caseNo||'')+' <span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';font-size:10px;">'+b[2]+'</span></div>';
  }).join('');
  document.getElementById('mention-case-overlay').classList.add('open');
}

function closeMentionCase(){ document.getElementById('mention-case-overlay').classList.remove('open'); }

var SUGGEST_ITEMS = [];

function closeSuggest(){ var el = document.getElementById('float-suggest'); if(el){ el.style.display = 'none'; el.innerHTML = ''; } SUGGEST_ITEMS = []; }

function floatInput(){
  var input = document.getElementById('float-input-box'), el = document.getElementById('float-suggest');
  var mt = input.value.match(/(^|\s)([#@])([^\s#@]*)$/);
  if(!mt){ closeSuggest(); return; }
  var kind = mt[2], q = mt[3].toLowerCase(), items;
  if(kind==='#'){
    items = CASE_ITEMS.filter(function(c){ return !q || c.name.toLowerCase().indexOf(q)>-1 || (c.caseNo||'').toLowerCase().indexOf(q)>-1; }).slice(0,8)
      .map(function(c){ return {kind:'#', key:c.id, label:'# '+c.name+' · '+(c.caseNo||'')}; });
  } else {
    items = atCandidates().filter(function(n){ return !q || n.toLowerCase().indexOf(q)>-1; }).slice(0,8).map(function(n){ return {kind:'@', key:n, label:'@ '+n}; });
  }
  SUGGEST_ITEMS = items;
  if(!items.length){ closeSuggest(); return; }
  el.style.display = 'block';
  el.innerHTML = items.map(function(it,i){ return '<div style="padding:8px 18px;font-size:13px;cursor:pointer;" onmousedown="pickSuggest('+i+');return false;">'+it.label+'</div>'; }).join('');
}

function pickSuggest(i){
  var it = SUGGEST_ITEMS[i]; if(!it) return;
  var input = document.getElementById('float-input-box');
  input.value = input.value.replace(/(^|\s)([#@])([^\s#@]*)$/, function(all, sp){ return sp + (it.kind==='@' ? '@'+it.key+' ' : ''); });
  closeSuggest();
  if(it.kind==='#') setRefChip(it.key); else input.focus();
}

function gotoQuoteSource(roomId, idx){
  if(!roomId || !roomById(roomId)){ alert('来源房间已不存在'); return; }
  openFloatingChat(roomId);
  setTimeout(function(){ var a = document.getElementById('msg-'+idx); if(a && a.nextElementSibling){ a.scrollIntoView({block:'center'}); a.nextElementSibling.style.outline = '2px solid var(--terracotta)'; } }, 30);
}

/* @ 提醒：被 @ 的人一定收到提醒，包括院长（平时静音）和不负责这个案件的室长 */
function notifyAtMentions(val){
  var cc = CURRENT_ROOM.indexOf('case-')===0 ? CASE_ITEMS.filter(function(x){ return x.id===CURRENT_ROOM.slice(5); })[0] : null;
  var hid = cc ? caseKrHospital(cc) : mainRoomHospital(CURRENT_ROOM), roomName = (roomById(CURRENT_ROOM)||{}).name || CURRENT_ROOM;
  atCandidates().forEach(function(n){
    if(val.indexOf('@'+n)<0) return;
    /* CMD-1012-01 J-006：@ KR 一侧的人（院长 / 室长）→ 写进他自己的通知中心（KR 页面会弹 toast，手动确认） */
    var dirs = hid ? hospitalDirectorNames(hid) : [], coords = hid ? hospitalCoordinators(hid) : [];
    var isDir = dirs.indexOf(n)>-1, isCoord = !isDir && coords.some(function(x){ return krAcctId(n)===x.split(' ')[0] || n===x; });
    if(hid && (isDir || isCoord)) pushKrNotif(hid, ME_NAME+' 在「'+roomName+'」里 @ 了你', {to:isDir?'director':'coord', director:isDir?n:null, only:n, caseId:cc?cc.id:null, clinicId:CURRENT_CLINIC_ID, kind:'mention'});
    showToast('已提醒 '+n, '@提及一定会提醒（院长平时静音、不负责该案件的室长也会收到）', null);
  });
  try{ Store.touch(); }catch(e){}
}
function toggleAttachMenu(){
  var m = document.getElementById('attach-menu'); if(!m) return;
  m.style.display = m.style.display==='block' ? 'none' : 'block';
}

function toolbarVideo(){
  if(!ATTACHED_CASE_ID){ alert('这个对话没有关联案件'); return; }
  openChatVideoParticipantModal(ATTACHED_CASE_ID);
}

function toolbarVideoBlocked(){
  var c = CASE_ITEMS.filter(function(x){ return x.id===ATTACHED_CASE_ID; })[0];
  alert(c && caseHasKrSide(c) ? 'KR室长进入房间后，视频通话才可用' : '这个案件没有面诊，房间里没有KR室长，视频通话不可用');
}

function sendRoomFile(type){
  var m = document.getElementById('attach-menu'); if(m) m.style.display = 'none';
  var ext = {'文件':'pdf', '照片':'jpg', '视频':'mp4'}[type];
  var fname = {'文件':'document', '照片':'photo', '视频':'video'}[type]+'-'+(ROOM_FILE_SEQ++)+'.'+ext; /* 三个都是上传；视频 = 上传视频文件 */
  if(!CHAT_DATA[CURRENT_ROOM]) CHAT_DATA[CURRENT_ROOM] = [];
  CHAT_DATA[CURRENT_ROOM].push({day:KD(0), from:'me', sender:ME_NAME, kind:'file', fileType:type, fname:fname, orig:'['+type+'] '+fname, time:nowTime(), ts:nowFullDt()});
  renderFloatMessages();
}

function openRoomFiles(){
  var msgs = (CHAT_DATA[CURRENT_ROOM]||[]).filter(function(m){ return m.kind==='file'; });
  var r = roomById(CURRENT_ROOM) || {name:CURRENT_ROOM};
  document.getElementById('room-files-title').textContent = '对话中的文件 · '+r.name;
  document.getElementById('room-files-body').innerHTML = msgs.map(function(m){
    var icon = {'文件':'📄', '照片':'🖼️', '视频':'🎞️'}[m.fileType] || '📄';
    return '<div class="case-field-row"><span style="font-size:18px;margin-right:8px;">'+icon+'</span><span style="flex-grow:1;font-size:13px;">'+m.fname+'<div style="font-size:11px;color:var(--muted);">'+(m.from==='me'?'A1 室长':(m.name||''))+' · '+m.day+' '+msgTime(m)+'</div></span>'+
      '<span class="fa" style="gap:12px;"><a href="#" class="info-link" onclick="return false;">预览</a><a href="#" class="info-link" onclick="return false;">下载</a></span></div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);padding:12px 2px;">这个房间里还没有发过文件、照片、视频</div>';
  document.getElementById('room-files-overlay').classList.add('open');
}

function closeRoomFiles(){ document.getElementById('room-files-overlay').classList.remove('open'); }

function openCaseRoom(caseId){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0]; if(!c) return;
  if(!caseRoomEligible(c)){ alert(isEnded(c) ? '案件已结束，对话房已整理进附件' : (c.consultRequested ? '面诊案件缴费（或免除面诊费）后才能开对话房' : '基础资料确认后才能开对话房')); return; }
  ensureCaseRoom(c);
  openFloatingChat(getCaseRoomId(caseId), null, caseId);
}

var ATTACHED_CASE_ID = null;

function openFloatingChat(roomId, subtitleOverride, caseId){
  closeDrawer();
  if(ROOM_UNREAD[roomId]){ ROOM_UNREAD[roomId] = 0; updateChatBadge(); }
  CURRENT_ROOM = roomId;
  var r = roomById(roomId) || {name:roomId, color:'var(--slate2)', init:'?'};
  document.getElementById('float-avt').style.background = r.color;
  document.getElementById('float-avt').textContent = r.init;
  document.getElementById('float-name').textContent = r.name;
  var oc = document.getElementById('float-open-case');
  if(roomId.indexOf('case-')===0){ oc.style.display = 'inline'; oc.onclick = function(e){ e.stopPropagation(); openCaseNewTab(roomId.slice(5)); }; } /* ↗ 新标签页打开案件页 */
  else { oc.style.display = 'none'; oc.onclick = null; }
  var isCaseRoom = roomId.indexOf('case-')===0;
  document.getElementById('float-sub').textContent = isCaseRoom ? '本案件专属对话' : (subtitleOverride ? ('关于 '+subtitleOverride+' 的沟通') : (isMainRoom(roomId) ? '院长 · 韩国室长 · 印尼室长 全员群聊（'+(mainRoomHospital(roomId) ? hospitalName(mainRoomHospital(roomId),'ko') : '')+'）· 支持 @提及' : '内部沟通'));
  ATTACHED_CASE_ID = caseId || (isCaseRoom ? roomId.slice(5) : null);
  renderChatCaseChip();
  renderFloatToolbar();
  renderMuteBtn(); renderFloatDemoBar();
  var dd0 = document.getElementById('float-members-dd'); if(dd0) dd0.style.display = 'none';
  REF_CHIP = null; renderRefChip(); closeSuggest();
  /* 2026-09-29：案件房只在真正发过消息之后才"存在"（出现在案件对话列表里），
     所以这里只是打开来看，不能顺手把 CHAT_DATA[roomId] 建出来——建房动作在 sendFloatMsg() 里，
     发第一条消息那一刻才真正创建 */
  renderFloatMessages();
  document.getElementById('chat-float-overlay').classList.add('open');
}

function renderChatCaseChip(){
  var el = document.getElementById('chat-case-chip');
  if(!ATTACHED_CASE_ID){ el.style.display='none'; el.innerHTML=''; return; }
  var c = CASE_ITEMS.filter(function(x){ return x.id===ATTACHED_CASE_ID; })[0];
  if(!c){ el.style.display='none'; return; }
  el.style.display='flex';
  var isRoom = CURRENT_ROOM.indexOf('case-')===0 && CURRENT_ROOM===getCaseRoomId(c.id);
  el.innerHTML = '<span style="font-size:11px;">📎</span><span style="font-size:11px;color:var(--terracotta);">已关联案件</span><b style="font-size:12px;color:var(--navy);flex-grow:1;">'+c.name+(c.caseNo?' · '+c.caseNo:'')+'</b>';
}

function closeFloat(){ document.getElementById('chat-float-overlay').classList.remove('open'); }

function toggleFloatSearch(){ document.getElementById('float-search').classList.toggle('open'); }

function renderFloatMessages(){
  var q = (document.getElementById('float-search-input').value || '').toLowerCase();
  var msgs = CHAT_DATA[CURRENT_ROOM] || [];
  var html = '';
  var lastDay = null;
  msgs.forEach(function(m0,i){
    var m = msgView(m0); /* 别的室长发的消息显示成"对方"气泡，名字保留发送当时的 */
    if(q && (m.orig||'').toLowerCase().indexOf(q)===-1) return;
    if(m.day !== lastDay){ html += '<div class="day-divider">'+m.day+'</div>'; lastDay = m.day; }
    var qLink = CURRENT_ROOM.indexOf('case-')===0 ? '' : ' <a href="#" class="info-link" style="font-size:10px;" onclick="openQuoteModal('+i+');return false;">引用到案件</a>';
    html += '<span id="msg-'+i+'"></span>';
    if(m.kind==='file' && !m.notMine){
      var fic = {'文件':'📄', '照片':'🖼️', '视频':'🎞️'}[m.fileType] || '📄';
      html += '<div class="bubble-row me"><div class="bubble-col"><div class="bubble me">'+fic+' '+m.fname+'</div><span class="bubble-trans" style="text-align:right;">'+msgTime(m)+qLink+'</span></div></div>';
    } else if(m.kind==='sys'){
      html += '<div style="text-align:center;font-size:11px;color:var(--muted);margin:8px 0;">'+m.orig+'</div>';
    } else if(m.kind==='quote'){
      /* 被引用的消息在案件房里显示为「发言人 ｜ 来源房间 ↗」+ 原文 + 译文；点来源房间打开那个房间并定位到这条消息 */
      var srcHtml = m.srcRoomId ? '<a href="#" class="info-link" onclick="gotoQuoteSource(\''+m.srcRoomId+'\','+m.srcIdx+');return false;">'+m.srcRoom+' ↗</a>' : m.srcRoom;
      html += '<div class="bubble-row me"><div class="bubble-col"><div class="bubble me" style="background:var(--border2);color:var(--slate2);border-left:3px solid var(--terracotta);"><div style="font-size:11px;font-weight:700;margin-bottom:4px;">'+m.speaker+' ｜ '+srcHtml+'</div>'+m.orig+(m.trans ? '<div style="font-size:11px;color:var(--muted);margin-top:4px;">译：'+m.trans+'</div>' : '')+'</div><span class="bubble-trans" style="text-align:right;">引用于 '+msgTime(m)+'</span></div></div>';
    } else if(m.from==='me'){
      html += '<div class="bubble-row me"><div class="bubble-col"><div class="bubble me">'+m.orig+'</div>'+(m.refCaseId ? refBarHtml(m.refCaseId) : '')+'<span class="bubble-trans" style="text-align:right;">'+msgTime(m)+qLink+'</span></div></div>';
    } else {
      html += '<div class="bubble-row them"><span class="bubble-avt" style="background:'+m.color+';">'+m.init+'</span><div class="bubble-col"><span class="bubble-name">'+m.name+'</span><div class="bubble them"'+(((m.orig||'').indexOf('@'+ME_NAME)>-1) ? ' style="background:#FFF1B8;box-shadow:0 0 0 2px #F0D56B;"' : '')+'>'+m.orig+'</div>'+
        (m.trans ? '<span class="bubble-trans">译：'+m.trans+'</span>' : '')+'<span class="bubble-trans">'+msgTime(m)+qLink+'</span></div></div>';
    }
  });
  document.getElementById('float-body').innerHTML = html;
  var body = document.getElementById('float-body'); body.scrollTop = body.scrollHeight;
}

/* ---- 引用消息到案件（2026-09-30）：在非案件房里把一条消息引用到某个案件，消息进入案件对话房；案件原本没有房的，引用后也会出现在"案件"分类里 ---- */
var QUOTE_PENDING = null;

function openQuoteModal(idx){
  var m = (CHAT_DATA[CURRENT_ROOM]||[])[idx]; if(!m) return;
  var speaker = msgSender(m);
  var roomName = (roomById(CURRENT_ROOM)||{}).name || CURRENT_ROOM;
  QUOTE_PENDING = {day:m.day, speaker:speaker, srcDt:quoteDt(m), srcRoom:roomName, srcRoomId:CURRENT_ROOM, srcIdx:idx, trans:m.trans||'', orig:m.orig||'', caseId:null};
  document.getElementById('quote-preview').textContent = speaker+'：'+QUOTE_PENDING.srcDt+' 「'+roomName+'」 "'+QUOTE_PENDING.orig+'"';
  renderQuoteCaseList();
  document.getElementById('quote-overlay').classList.add('open');
}

function renderQuoteCaseList(){
  document.getElementById('quote-case-list').innerHTML = CASE_ITEMS.filter(function(c){ return c.materialsConfirmed && !isEnded(c); }).map(function(c){
    return '<label style="display:flex;align-items:center;gap:8px;padding:6px 2px;font-size:13px;cursor:pointer;"><input type="radio" name="quote-case" value="'+c.id+'" onchange="QUOTE_PENDING.caseId=this.value"> '+c.name+' · '+c.caseNo+'</label>';
  }).join('');
}

function closeQuoteModal(){ document.getElementById('quote-overlay').classList.remove('open'); QUOTE_PENDING = null; }

function confirmQuote(){
  var q = QUOTE_PENDING; if(!q) return;
  if(!q.caseId){ alert('请选择要引用到的案件'); return; }
  var c = CASE_ITEMS.filter(function(x){ return x.id===q.caseId; })[0];
  var res = deliverRefQuote(c, q); /* 写入效果同"引用案件"：有房间进房间；符合建房条件开房间；还没到条件先记 Timeline */
  closeQuoteModal();
  renderDrawerList();
  showToast('已引用到案件', (c?c.name:'')+(res==='pending' ? ' 还没到建房条件，已记在案件 Timeline，房间建立后带进房间' : ' 的案件对话房已收到这条消息'), function(){ openCaseNewTab(q.caseId); });
}

function toggleMembersDropdown(){
  var dd = document.getElementById('float-members-dd');
  if(dd.style.display==='block'){ dd.style.display = 'none'; return; }
  dd.innerHTML = memberRowsHtml();
  dd.style.display = 'block';
}

function toggleMuteRoom(){
  MUTED_ROOMS[CURRENT_ROOM] = !MUTED_ROOMS[CURRENT_ROOM];
  renderMuteBtn();
  showToast(MUTED_ROOMS[CURRENT_ROOM] ? '已关闭这个房间的提醒' : '已重新打开这个房间的提醒', MUTED_ROOMS[CURRENT_ROOM] ? '新消息不再提醒；被 @ 的消息照样提醒' : '新消息会正常提醒', null);
}

function renderMuteBtn(){
  var b = document.getElementById('float-mute-btn'); if(!b) return;
  b.style.background = MUTED_ROOMS[CURRENT_ROOM] ? '#FBE9E7' : 'transparent';
  b.style.borderRadius = '8px'; b.style.padding = '0 4px';
  b.title = MUTED_ROOMS[CURRENT_ROOM] ? '已关闭这个房间的提醒，点击再打开（被@照样提醒）' : '对自己关闭这个房间的提醒（被@照样提醒）';
}

function renderFloatDemoBar(){
  var el = document.getElementById('float-demo-bar'); if(!el) return;
  el.innerHTML = '<button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="simulateIncomingMsg(false)">演示：模拟新消息</button><button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="simulateIncomingMsg(true)">演示：模拟有人@我</button>';
}

/* 演示：别人发来一条消息。新消息按推播规则 + 🔕 决定是否弹提醒；@我 一定提醒（包括静音、不负责的案件） */
function simulateIncomingMsg(atMe){
  var roomId = CURRENT_ROOM;
  var isCase = roomId.indexOf('case-')===0;
  var cc = isCase ? CASE_ITEMS.filter(function(x){ return x.id===roomId.slice(5); })[0] : null;
  var who = (isCase && cc && caseHasKrSide(cc)) ? krEnterRoomName(cc) : 'KM1 室长';
  if(!CHAT_DATA[roomId]) CHAT_DATA[roomId] = [];
  CHAT_DATA[roomId].push({day:KD(0), from:'them', name:who, color:'var(--sage)', init:who.charAt(0), orig:(atMe ? '@'+ME_NAME+' ' : '')+'（演示）有新消息，请看一下。', trans:'（演示译文）请看一下。', time:nowTime(), ts:nowFullDt()});
  renderFloatMessages();
  var roomOpen = document.getElementById('chat-float-overlay').classList.contains('open') && CURRENT_ROOM===roomId;
  if(!atMe && !roomOpen){ ROOM_UNREAD[roomId] = (ROOM_UNREAD[roomId]||0)+1; updateChatBadge(); try{ if(document.getElementById('chat-drawer').classList.contains('open')) renderDrawerList(); }catch(e){} } /* 未读不含 @ */
  var muted = !!MUTED_ROOMS[roomId];
  var pushOk = isCase ? shouldPushToMe(cc) : true; /* 案件房：只给操作过的当班室长；职员房：直接提醒 */
  if(atMe) pushNotif('对话', who+' 在「'+((roomById(roomId)||{}).name||roomId)+'」里 @ 了你', {caseId:(isCase&&cc)?cc.id:null, names:[ME_NAME], link:{kind:'mention', roomId:roomId, msgIdx:CHAT_DATA[roomId].length-1}}); /* 被@一定提醒（即使已🔕或不负责这个案件），进通知中心并弹 toast */
  else if(!muted && pushOk && notifyPushOn()) showToast('新消息 · '+((roomById(roomId)||{}).name||roomId), who+'：（演示）有新消息', null);
}

function closeRoomMembers(){ document.getElementById('room-members-overlay').classList.remove('open'); }

function sendFloatMsg(){
  var input = document.getElementById('float-input-box');
  var val = input.value.trim();
  if(!val) return;
  var isNewCaseRoom = CURRENT_ROOM.indexOf('case-')===0 && !CHAT_DATA.hasOwnProperty(CURRENT_ROOM);
  if(!CHAT_DATA[CURRENT_ROOM]) CHAT_DATA[CURRENT_ROOM] = [];
  var msg = {day:KD(0), from:'me', sender:ME_NAME, orig:val, trans:'（演示译文）'+val, time:nowTime(), ts:nowFullDt()};
  if(REF_CHIP) msg.refCaseId = REF_CHIP;
  CHAT_DATA[CURRENT_ROOM].push(msg);
  var srcIdx = CHAT_DATA[CURRENT_ROOM].length-1;
  if(REF_CHIP){
    var rc = CASE_ITEMS.filter(function(x){ return x.id===REF_CHIP; })[0];
    var roomName = (roomById(CURRENT_ROOM)||{}).name || CURRENT_ROOM;
    if(rc && !(CURRENT_ROOM===getCaseRoomId(rc.id))){ /* 在案件自己的房里引用自己，不重复写入 */
      deliverRefQuote(rc, {day:msg.day, speaker:ME_NAME, srcRoomId:CURRENT_ROOM, srcRoom:roomName, srcIdx:srcIdx, srcDt:quoteDt(msg), orig:val, trans:msg.trans});
    }
    REF_CHIP = null; renderRefChip();
  }
  notifyAtMentions(val);
  input.value=''; closeSuggest();
  renderFloatMessages();
  renderDrawerList();
}

/* toast：通知类（opts.sticky）必须手动［确认］才消失，多条叠放（CMD-1012-01）；普通操作反馈（已保存等）仍 6 秒自动消失 */
function showToast(title, text, onClickFn, opts){
  var wrap = document.getElementById('toast-stack'); if(!wrap) return;
  opts = opts || {};
  var el = document.createElement('div');
  el.className = 'toast-card';
  var body = document.createElement('div');
  body.className = 'toast-body';
  body.innerHTML = '<div class="toast-title">'+title+'</div><div class="toast-text">'+text+'</div>';
  body.addEventListener('click', function(){ if(el.parentNode) el.remove(); if(onClickFn) onClickFn(); });
  el.appendChild(body);
  if(opts.sticky){
    el.setAttribute('data-sticky', '1');
    var ok = document.createElement('button');
    ok.className = 'toast-ok'; ok.textContent = '确认';
    ok.addEventListener('click', function(e){ e.stopPropagation(); if(el.parentNode) el.remove(); });
    el.appendChild(ok);
  } else {
    var closeBtn = document.createElement('span');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', function(e){ e.stopPropagation(); if(el.parentNode) el.remove(); });
    el.appendChild(closeBtn);
    /* 普通反馈最多叠 4 个（只挤掉普通反馈，不会挤掉还没确认的通知） */
    var plain = Array.prototype.filter.call(wrap.children, function(c){ return !c.getAttribute('data-sticky'); });
    while(plain.length>=4){ wrap.removeChild(plain.shift()); }
    setTimeout(function(){ if(el.parentNode) el.remove(); }, 6000);
  }
  wrap.appendChild(el);
}

/* 通知 toast（IN）：别的分页 / 客户预约页 / KR 产生的新通知到达后，也给收件人弹 toast（K-002）。
   NOTIF_SEEN = 这个分页已经处理过（弹过或本页自己产生）的通知；第一次调用只登记已有的，不补弹 */
var NOTIF_SEEN = null;
function notifKey(n){ return n.id+'|'+n.ts; }
/* 新通知马上弹（不等画面重画）：别的分页写入存档后由 store.js 立即调用；另有每 3 秒的兜底轮询（后台分页被浏览器降速时也能补上） */
function remoteNotifTick(){
  if(typeof isKrAccount==='function' && isKrAccount()){ if(typeof krNotifUnread==='function'){ var u = krNotifUnread(); if(typeof krToastNew==='function') krToastNew(u); if(typeof krUpdateBadges==='function') krUpdateBadges(); } return; }
  toastNewNotifs(); if(typeof updateBell==='function') updateBell();
}
function toastNewNotifs(){
  if(typeof NOTIFS==='undefined') return;
  if(NOTIF_SEEN===null){ NOTIF_SEEN = {}; NOTIFS.forEach(function(n){ NOTIF_SEEN[notifKey(n)] = 1; }); return; }
  NOTIFS.slice().reverse().forEach(function(n){
    var k = notifKey(n); if(NOTIF_SEEN[k]) return; NOTIF_SEEN[k] = 1;
    if(n.silent || !notifMine(n) || n.read[ME_NAME] || !notifAlive(n) || !notifyPushOn()) return;
    if(newTodoOn()){ /* CMD-1013-17：被 @ / 未接来电 弹出并停留；新待办弹一次自动收起；消息不弹（只进铃铛 + 新消息卡） */
      var tk = notifTodoKind(n); if(tk==='msg') return;
      showToast(NOTIF_ICON[n.cat]+' '+n.cat, tzRender(n.text), function(){ openNotif(n.id, 'toast'); }, {sticky: tk==='stay'}); return;
    }
    showToast(NOTIF_ICON[n.cat]+' '+n.cat, tzRender(n.text), function(){ openNotif(n.id, 'toast'); }, {sticky:notifLevelOf(n)!=='info'});
  });
}

/* ================= 多标签页同步后的整体刷新（2026-10-05·一） =================
   其他标签页改了共享数据（localStorage）后，当前标签页重读数据，再调用这个函数把"现在能看到的东西"重画一遍。
   每个模块各自 try/catch，页面里没有的元素（比如 booking.html）直接跳过。 */
function refreshView(){
  if(isKrAccount()){ if(typeof krRefreshAll==='function') krRefreshAll(); return; } /* KR 端自己重画 */
  try{ toastNewNotifs(); }catch(e){} /* 别的分页产生的新通知 → toast（K-002） */
  try{ sweepStaleReceptions(true); }catch(e){} /* 接待中但心跳过期的案件退回待访问（CMD-1008-06） */
  [['日历与今日区块',renderCalendar],['待预约提醒卡',renderSubBookCard],['术后管理过期提醒卡',renderPcDueCard],['客户管理',buildClients],['案件tab',buildCaseTabs],['案件列表',renderCaseRows],['案例库',renderLibrary],['项目库',renderProjLibrary],['通知中心',buildNotifications],['预约历史',renderResvHistory],['对话未读',updateChatBadge],['铃铛',updateBell]].forEach(function(m){
    try{ if(typeof m[1]==='function') m[1](); }catch(e){}
  });
  try{ refreshAdminPage(); }catch(e){} /* 管理类页面（账号状态等被别的标签页改了） */
  try{
    if(CURRENT_PAGE_ID==='in-casedetail' && CURRENT_CASE_ID){
      var c = CASE_ITEMS.filter(function(x){ return x.id===CURRENT_CASE_ID; })[0];
      if(c){ renderCaseSubtitle(c); renderCaseStatusBar(c); buildCaseLog(c); renderCaseBody(c); }
    }
  }catch(e){}
  try{
    var drawer = document.getElementById('chat-drawer');
    if(drawer && drawer.classList.contains('open')) renderDrawerList();
    var fl = document.getElementById('chat-float-overlay');
    if(fl && fl.classList.contains('open') && CURRENT_ROOM) renderFloatMessages();
  }catch(e){}
}

/* ================= 登录身份相关界面（2026-10-05·三） ================= */
/* 对话消息发送人：from:'me' 的消息带 sender（发送当时的姓名）；旧演示消息没有 sender，视为 A1 室长 发的 */
function msgIsMine(m){ return m.from==='me' && (m.sender||'A1 室长')===ME_NAME; }
function msgSender(m){ return m.from==='me' ? (m.sender||'A1 室长') : (m.name||''); }
function msgView(m){
  if(m.from!=='me' || m.kind==='quote' || msgIsMine(m)) return m;
  var n = m.sender||'A1 室长';
  return Object.assign({}, m, {from:'them', notMine:true, name:n, color:'var(--terracotta)', init:n.charAt(0).toUpperCase()});
}
function accountRoleShort(){ var a = currentAccount(); return a ? ({owner:'老板', manager:'管理者', general:'室长', kr_owner:'代表院长', kr_manager:'管理者', kr_general:'室长', kr_director:'院长'}[a.role]||'室长') : '室长'; }

/* 头像菜单：个人设置 / 切换账号 / 退出登录 */
function closeAvatarMenu(){ var m = document.getElementById('avatar-menu'); if(m) m.remove(); }
function toggleAvatarMenu(e){
  if(e) e.stopPropagation();
  if(document.getElementById('avatar-menu')){ closeAvatarMenu(); return; }
  var a = currentAccount(); if(!a) return;
  var r = e.currentTarget.getBoundingClientRect();
  var m = document.createElement('div'); m.id = 'avatar-menu';
  m.style.cssText = 'position:fixed;top:'+(r.bottom+8)+'px;right:'+Math.max(12, window.innerWidth-r.right)+'px;z-index:80;background:var(--white);border:1px solid var(--border);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.18);min-width:200px;overflow:hidden;';
  var item = function(label, fn){ return '<div style="padding:10px 16px;font-size:13px;cursor:pointer;" onmouseover="this.style.background=\'var(--border2)\'" onmouseout="this.style.background=\'\'" onclick="closeAvatarMenu();'+fn+'">'+label+'</div>'; };
  m.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid var(--border2);"><div style="font-size:13px;font-weight:700;">'+accountLabel(a.id)+'</div><div style="font-size:11px;color:var(--muted);">'+ACCOUNT_ROLES[a.role]+(a.position?' · '+a.position:'')+'</div></div>'+
    item('个人设置', 'openAdminPage(\'personal\')')+item('切换账号', 'switchAccount()')+item('退出登录', 'logout()');
  m.onclick = function(ev){ ev.stopPropagation(); };
  document.body.appendChild(m);
}
/* 退出/切换：只清当前标签页的登录信息，其他标签页不受影响 */
function logout(){ try{ sessionStorage.removeItem('gmc_acct'); }catch(e){} location.href = '/login.html'; }
function switchAccount(){ try{ sessionStorage.removeItem('gmc_acct'); }catch(e){} location.href = '/login.html?switch=1'; }

/* ================= 谁正在处理这个案件 + 同账号分页锁（CMD-1012-01，IN-CASE-03 2026-10-12） =================
   心跳：案件页开着时每 5 秒写一次 gmc_case_presence（单独的 localStorage 键，不进 Store，不触发数据同步）；约 1 分钟（PRES_TTL）没更新 = 已离开。
   显示：① IN / KR 案件列表客人名后小字「A1 室长正在处理」（多人列出，双方都显示）；② 案件页上方「A2 室长也在查看这个案件」（不含自己）。
   分页锁：同一账号在第二个分页打开同一案件 → 提示「这个案件已经在另一个分页打开」+［在这里继续］；按下后原分页变只读（页面置灰 + 提示）；不同账号互不挡。
   原型限制：并发写入覆盖不修，交由正式开发的后端（见 qa-results.md）。 */
var PRES_KEY = 'gmc_case_presence', LOCK_KEY = 'gmc_case_lock', PRES_TTL = 60000, PRES_BEAT = 5000;
var TAB_ID = 't'+Math.random().toString(36).slice(2, 8);
var PRES_LAST_KEY = null, PRES_BLOCKED = null, PRES_SIG = '';
function presRead(){ try{ return JSON.parse(localStorage.getItem(PRES_KEY)||'{}') || {}; }catch(e){ return {}; } }
function presWrite(o){ try{ localStorage.setItem(PRES_KEY, JSON.stringify(o)); }catch(e){} }
function lockRead(){ try{ return JSON.parse(localStorage.getItem(LOCK_KEY)||'{}') || {}; }catch(e){ return {}; } }
function lockWrite(o){ try{ localStorage.setItem(LOCK_KEY, JSON.stringify(o)); }catch(e){} }
function presMyAcct(){ try{ return currentAccountId(); }catch(e){ return ME_NAME; } }
function presCaseKey(){
  try{
    if(window.__krRecInTab) return null; /* 院长的面诊输入页（新分页）不登记「在看这个案件」，也不触发同一账号两分页锁 */
    if(isKrAccount()) return (CURRENT_PAGE_ID==='kr-casedetail' && typeof KR_CASE!=='undefined' && KR_CASE && KR_CASE.id) ? KR_CASE.clinicId+':'+KR_CASE.id : null;
    return (CURRENT_PAGE_ID==='in-casedetail' && CURRENT_CASE_ID) ? CURRENT_CLINIC_ID+':'+CURRENT_CASE_ID : null;
  }catch(e){ return null; }
}
function presFresh(e){ return e && (Date.now() - e.ts) < PRES_TTL; }
/* 某个案件现在有谁在看（去重的名字，按名字排序） */
function presViewers(key){
  var o = presRead()[key] || {}, names = [];
  Object.keys(o).forEach(function(t){ if(presFresh(o[t]) && names.indexOf(o[t].name)<0) names.push(o[t].name); });
  return names.sort();
}
function presTag(clinicId, caseId){
  var n = presViewers(clinicId+':'+caseId); if(!n.length) return '';
  return ' <span class="pres-tag" style="font-size:11px;font-weight:400;color:#C26A1B;">'+n.join('、')+'正在处理</span>';
}
function presBeat(){
  var all = presRead(), key = presCaseKey(), now = Date.now(), changed = false;
  Object.keys(all).forEach(function(k){
    Object.keys(all[k]).forEach(function(t){ if(!presFresh(all[k][t]) || (t===TAB_ID && k!==key) || (t===TAB_ID && PRES_BLOCKED===k)){ delete all[k][t]; changed = true; } });
    if(!Object.keys(all[k]).length){ delete all[k]; changed = true; }
  });
  if(key && PRES_BLOCKED!==key){ (all[key] = all[key] || {})[TAB_ID] = {name:ME_NAME, acct:presMyAcct(), ts:now}; changed = true; var L = lockRead(), lk = lockKey(key); if(L[lk] && L[lk].tab===TAB_ID){ L[lk].ts = now; lockWrite(L); } }
  if(changed) presWrite(all);
}
/* 同一账号在别的分页开着同一案件（别的分页 id、没过期） */
function presOwnOthers(key){
  var o = presRead()[key] || {}, me = presMyAcct();
  return Object.keys(o).filter(function(t){ return t!==TAB_ID && presFresh(o[t]) && o[t].acct===me; });
}
/* 持有者记录：每个「案件 + 账号」一条（不同账号互不影响） */
function lockKey(key){ return key+'|'+presMyAcct(); }
function presClaim(key){ var L0 = lockRead(); L0[lockKey(key)] = {tab:TAB_ID, ts:Date.now()}; lockWrite(L0); if(PRES_BLOCKED===key) PRES_BLOCKED = null; presBeat(); presRender(); }
function presContinueHere(){ var key = presCaseKey(); if(key) presClaim(key); }
function presOnOpen(key){
  PRES_BLOCKED = null;
  if(!key) return;
  var L = lockRead(), holderIsMe = !!(L[lockKey(key)] && L[lockKey(key)].tab===TAB_ID);
  if(presOwnOthers(key).length && !holderIsMe) PRES_BLOCKED = key; /* 同一账号已经在别的分页打开 */
  else presClaim(key);
}
/* 只读：这个分页不是持有者（别的分页按了「在这里继续」） */
function presReadonly(key){
  var h = key ? lockRead()[lockKey(key)] : null; return !!(h && h.tab!==TAB_ID && presFresh(h) && PRES_BLOCKED!==key);
}
function presRender(){
  var key = presCaseKey(), blocked = key && PRES_BLOCKED===key, ro = presReadonly(key);
  var ov = document.getElementById('case-lock-ov');
  if(blocked){
    if(!ov){ ov = document.createElement('div'); ov.id = 'case-lock-ov'; ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(27,38,53,.5);display:flex;align-items:center;justify-content:center;'; document.body.appendChild(ov); }
    ov.innerHTML = '<div style="background:#fff;border-radius:14px;padding:26px 30px;width:380px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.3);"><div style="font-size:16px;font-weight:800;margin-bottom:8px;">这个案件已经在另一个分页打开</div><div style="font-size:12px;color:var(--slate2);line-height:1.7;margin-bottom:16px;">同一个账号同一时间只能在一个分页里处理同一个案件。在这里继续后，另一个分页会变成只读。</div><button class="btn-primary" style="width:100%;" onclick="presContinueHere()">在这里继续</button></div>';
  } else if(ov) ov.remove();
  var pageEl = key ? document.getElementById(isKrAccount() ? 'kr-casedetail' : 'in-casedetail') : null, content = pageEl ? (pageEl.querySelector('.content') || pageEl) : null;
  var ban = document.getElementById('case-readonly-bar');
  document.querySelectorAll('.case-ro').forEach(function(e){ if(e!==content || !ro){ e.classList.remove('case-ro'); e.inert = false; } });
  if(ro && content){
    content.classList.add('case-ro'); content.inert = true;
    if(!ban){ ban = document.createElement('div'); ban.id = 'case-readonly-bar'; ban.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:90;background:#FFF4E0;border:1px solid #F0D9A8;color:#8A5A10;padding:8px 14px;border-radius:10px;font-size:12px;box-shadow:0 8px 20px rgba(0,0,0,.12);display:flex;gap:12px;align-items:center;'; document.body.appendChild(ban); }
    ban.innerHTML = '这个案件已在另一个分页继续处理，本页只读（按钮已置灰）<button class="btn-outline" style="padding:3px 10px;font-size:11px;" onclick="presContinueHere()">在这里继续</button>';
  } else if(ban) ban.remove();
  var pb = document.getElementById('case-pres-bar'), others = key ? presViewers(key).filter(function(n){ return n!==ME_NAME; }) : [];
  if(others.length && !blocked){
    if(!pb){ pb = document.createElement('div'); pb.id = 'case-pres-bar'; pb.style.cssText = 'position:fixed;top:64px;right:24px;z-index:85;background:#FFF4E0;border:1px solid #F0D9A8;color:#8A5A10;padding:6px 12px;border-radius:10px;font-size:12px;'+(ro?'display:none;':''); document.body.appendChild(pb); }
    pb.textContent = others.join('、')+'也在查看这个案件';
  } else if(pb) pb.remove();
}
function presRefreshLists(){
  try{ if(isKrAccount()){ if(CURRENT_PAGE_ID==='kr-cases' && typeof krRenderCaseRows==='function') krRenderCaseRows(); } else if(CURRENT_PAGE_ID==='in-cases' && typeof renderCaseRows==='function') renderCaseRows(); }catch(e){}
}
function presTick(){
  var key = presCaseKey();
  if(key!==PRES_LAST_KEY){ PRES_LAST_KEY = key; presOnOpen(key); }
  var sig = JSON.stringify([Object.keys(presRead()).map(function(k){ return k+':'+presViewers(k).join(','); }), JSON.stringify(lockRead()), PRES_BLOCKED]);
  if(sig!==PRES_SIG){ PRES_SIG = sig; presRender(); presRefreshLists(); }
}
(function(){
  setInterval(function(){ try{ presBeat(); }catch(e){} }, PRES_BEAT);
  setInterval(function(){ try{ presTick(); }catch(e){} }, 1000);
  window.addEventListener('storage', function(e){ if(e.key===PRES_KEY || e.key===LOCK_KEY){ try{ presTick(); presRender(); }catch(x){} } });
  var leave = function(){ try{ var all = presRead(), L = lockRead(); Object.keys(all).forEach(function(k){ delete all[k][TAB_ID]; if(!Object.keys(all[k]).length) delete all[k]; }); presWrite(all); Object.keys(L).forEach(function(k){ if(L[k].tab===TAB_ID) delete L[k]; }); lockWrite(L); }catch(e){} };
  window.addEventListener('pagehide', leave); window.addEventListener('beforeunload', leave);
})();


/* ================= 同一案件同一时间只有一位室长能操作（CMD-1014-18 一） =================
   做法：localStorage 键 gmc_case_operator，每「案件 + 端（IN / KR）」一条 {tab, acct, name, ts}；案件页打开时若没有操作人（或记录超过 OP_TTL 没心跳）就成为操作人，心跳随 presBeat 每 5 秒刷新；
   别的室长打开 → 只读（顶部提示「xx 正在操作此案件」），点任何操作按钮 / 输入框 → 弹窗［取消（只读）］［接管操作］；接管后原操作人切成只读 + 「xx 已接管操作」，案件 Timeline 记一条。
   离开案件页 / 关分页（pagehide）立即放开；异常关闭没放开的，超过 OP_TTL（40 秒）没心跳就视为离开。适用 IN 室长（管理者 / 一般）之间、KR 室长（管理者 / 一般）之间；IN 与 KR 互不锁；院长 / 代表院长 / 老板不参与。
   原型限制：浏览器对后台分页的定时器会降速，后台分页的心跳可能延迟，所以 TTL 取 40 秒而不是更短。 */
var OP_KEY = 'gmc_case_operator', OP_TTL = 40000, OP_RO = false, OP_TAKEN_BY = '', OP_WAS_MINE = false, OP_LAST_KEY = null;
function opRead(){ try{ return JSON.parse(localStorage.getItem(OP_KEY)||'{}') || {}; }catch(e){ return {}; } }
function opWrite(o){ try{ localStorage.setItem(OP_KEY, JSON.stringify(o)); }catch(e){} }
function opApplies(){ try{ var a = currentAccount(); if(!a) return false; return isKrAccount() ? (a.role==='kr_manager' || a.role==='kr_general') : (a.role==='manager' || a.role==='general'); }catch(e){ return false; } }
function opSlot(key){ return key+'|'+(isKrAccount() ? 'KR' : 'IN'); }
function opHolder(key){ var h = opRead()[opSlot(key)]; return (h && (Date.now() - h.ts) < OP_TTL) ? h : null; }
function opClaim(key){ var o = opRead(); o[opSlot(key)] = {tab:TAB_ID, acct:presMyAcct(), name:ME_NAME, ts:Date.now()}; opWrite(o); OP_RO = false; OP_TAKEN_BY = ''; OP_WAS_MINE = true; }
function opRelease(){ try{ var o = opRead(), ch = false; Object.keys(o).forEach(function(k){ if(o[k].tab===TAB_ID){ delete o[k]; ch = true; } }); if(ch) opWrite(o); }catch(e){} }
function opBeat(key){ if(!key || !OP_WAS_MINE || OP_RO) return; var h = opHolder(key); if(h && h.tab===TAB_ID){ h.ts = Date.now(); var o = opRead(); o[opSlot(key)] = h; opWrite(o); } }
/* 每秒 / 收到 storage 事件时对一下：我是不是操作人 */
function opTick(){
  var key = (opApplies() && !PRES_BLOCKED) ? presCaseKey() : null;
  if(key!==OP_LAST_KEY){ opRelease(); OP_LAST_KEY = key; OP_WAS_MINE = false; OP_RO = false; OP_TAKEN_BY = ''; }
  if(!key){ opRender(null); return; }
  var h = opHolder(key), me = presMyAcct();
  if(!h){ if(!document.hidden || !OP_WAS_MINE){ var wasRo = OP_RO; opClaim(key); if(wasRo && typeof showToast==='function') showToast('你现在可以操作了', '原操作人已离开这个案件，你已自动成为操作人', null); } } /* CMD-1014-19 二·2：只读分页自动升级时给提示 */
  else if(h.acct===me){ if(h.tab!==TAB_ID && !OP_WAS_MINE) opClaim(key); else if(h.tab!==TAB_ID && OP_WAS_MINE){ OP_RO = false; } }
  else {
    if(OP_WAS_MINE){ OP_TAKEN_BY = h.name; OP_WAS_MINE = false; } /* 我刚才是操作人，现在别人接管了 */
    OP_RO = true;
  }
  if(h && h.tab===TAB_ID) OP_RO = false;
  opRender(key);
}
function opRender(key){
  var bar = document.getElementById('op-ro-bar');
  if(!key || !OP_RO){ if(bar) bar.remove(); return; }
  var h = opHolder(key), txt = OP_TAKEN_BY ? (OP_TAKEN_BY+'已接管操作，本页只读') : ((h ? h.name : '其他室长')+'正在操作此案件，本页只读');
  if(!bar){ bar = document.createElement('div'); bar.id = 'op-ro-bar'; bar.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:91;background:#FFF4E0;border:1px solid #F0D9A8;color:#8A5A10;padding:8px 14px;border-radius:10px;font-size:12px;box-shadow:0 8px 20px rgba(0,0,0,.12);'; document.body.appendChild(bar); }
  bar.textContent = txt;
}
function opTakeoverAsk(){
  var ov = document.getElementById('op-take-ov'); if(ov) ov.remove();
  ov = document.createElement('div'); ov.id = 'op-take-ov'; ov.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(27,38,53,.5);display:flex;align-items:center;justify-content:center;';
  ov.innerHTML = '<div style="background:#fff;border-radius:14px;padding:26px 30px;width:400px;box-shadow:0 24px 60px rgba(0,0,0,.3);"><div style="font-size:16px;font-weight:800;margin-bottom:8px;">当前案件正在被操作</div><div style="font-size:13px;color:var(--slate2);line-height:1.7;margin-bottom:18px;">该案件正在由其他室长操作。继续操作后，你将获得操作权限，对方将切换为只读模式。</div><div style="display:flex;gap:10px;"><button class="btn-outline" style="flex:1;" onclick="document.getElementById(\'op-take-ov\').remove()">取消（只读）</button><button class="btn-primary" style="flex:1;" onclick="opTakeover()">接管操作</button></div></div>';
  document.body.appendChild(ov);
}
function opTakeover(){
  var ov = document.getElementById('op-take-ov'); if(ov) ov.remove();
  var key = presCaseKey(); if(!key) return; var h = opHolder(key); opClaim(key);
  var note = ME_NAME+'接管操作'+(h ? '（原操作人：'+h.name+'）' : '');
  try{
    if(isKrAccount()){ var parts = key.split(':'); Store.mutateClinic(parts[0], function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===parts.slice(1).join(':'); })[0]; if(c) logCaseEvent(c, ME_NAME, note); }); if(typeof krRefreshAll==='function') krRefreshAll(); }
    else { var c = CASE_ITEMS.filter(function(x){ return x.id===CURRENT_CASE_ID; })[0]; if(c){ logCaseEvent(c, ME_NAME, note); if(typeof refreshView==='function') refreshView(); } }
  }catch(e){ console.error(e); }
  opRender(key);
}
/* 只读时点任何操作元素 → 弹窗；导航类（切 tab / 返回 / 跳页）放行 */
var OP_ALLOW = /switchCaseTab|krSetCaseTab|goBack|\bnav\(|openCaseDetail|krShowCase|krOpenClient|openCaseNewTab|toggleHoldExpand|setSettleTab|openSidebarPage|toggleBellDropdown|openDrawer|krOpenDrawer|krToggleBell|openClientDetail|krOpenSub|krOpenSurgSub|presContinueHere|opTakeover/;
function opGuard(ev){
  if(!OP_RO) return;
  var key = presCaseKey(); if(!key) return;
  var t = ev.target; if(!t || !t.closest) return;
  var page = document.getElementById(isKrAccount() ? 'kr-casedetail' : 'in-casedetail'); if(!page || !page.contains(t)) return;
  if(t.closest('#op-take-ov,#op-ro-bar,#case-lock-ov')) return;
  var el = t.closest('button,[onclick],input,select,textarea,label,a'); if(!el || !page.contains(el)) return;
  var oc = el.getAttribute('onclick') || '';
  if(oc && OP_ALLOW.test(oc)) return;
  if(el.tagName==='A' && !oc) return;
  if(!oc && !/^(INPUT|SELECT|TEXTAREA|LABEL)$/.test(el.tagName)) { var p = el.closest('[onclick]'); if(!p) return; }
  if(ev.type==='focusin' && !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
  ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
  if(document.activeElement && document.activeElement.blur && ev.type==='focusin') document.activeElement.blur();
  if(!document.getElementById('op-take-ov')){
    var h = opHolder(key);
    if(!h){ opClaim(key); opRender(key); return; } /* 没人操作了 → 直接成为操作人，请再点一次 */
    opTakeoverAsk();
  }
}
(function(){
  ['click','focusin','mousedown'].forEach(function(n){ document.addEventListener(n, function(ev){ try{ opGuard(ev); }catch(e){} }, true); });
  setInterval(function(){ try{ opBeat(presCaseKey()); }catch(e){} }, PRES_BEAT);
  setInterval(function(){ try{ opTick(); }catch(e){} }, 1000);
  window.addEventListener('storage', function(e){ if(e.key===OP_KEY){ try{ opTick(); }catch(x){} } });
  window.addEventListener('pagehide', opRelease); window.addEventListener('beforeunload', opRelease);
})();

/* 代码更新提示（CMD-1012-10 修改 / Bug1）：每次提交后 version.js 里的 hash 会变；已经打开的分页还在跑旧代码（比如新的通知逻辑），这里每 5 秒看一眼，发现变了就在顶部提示刷新。 */
(function(){
  if(typeof GMC_BUILD==='undefined' || !GMC_BUILD || typeof fetch!=='function') return;
  setInterval(function(){
    fetch('/shared/version.js?t='+Date.now(), {cache:'no-store'}).then(function(r){ return r.text(); }).then(function(t){
      var m = t.match(/h:"([0-9a-f]+)"/); if(!m || m[1]===GMC_BUILD.h || document.getElementById('gmc-update-bar')) return;
      var bar = document.createElement('div'); bar.id = 'gmc-update-bar';
      bar.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:100001;background:#1B2635;color:#fff;padding:8px 16px;border-radius:0 0 10px 10px;font-size:12px;box-shadow:0 4px 14px rgba(0,0,0,.3);';
      bar.innerHTML = '原型代码已更新（'+GMC_BUILD.h+' → '+m[1]+'），这个分页还在跑旧代码　<a href="#" style="color:#FFD28A;font-weight:700;" onclick="location.reload();return false;">刷新</a>';
      document.body.appendChild(bar);
    }).catch(function(){});
  }, 5000);
})();
