/* ================= CMD-1013-17 待办 / 通知调整（试行，只加不改 + 开关 newTodoOn()）=================
   规则：Notification Center 顶部「🧪 2026-10-13 待办 / 通知调整」、IN-DASH-01 / KR-DASH-01 同名节。
   原则：现有工作台 / 日历 / 通知中心的版面样式一律不动，这里只新增；开关关闭 = 完全是 ed2a41d 的样子（本文件所有入口都先检查 newTodoOn()）。
   内容：① 待办栏（IN / KR 工作台日历右边，可收起，分已超时 / 今天 / 之后，做完由案件状态算出自动消失）
        ② 默认日视图 + 日 / 周视图「现在时间线」（每分钟移动，打开时滚到画面上方约 1/3）
        ③ KR 卡片 8 → 4、IN 加同样 4 张  ④ 弹出提示：待办弹一次自动收起，消息不弹，被 @ / 未接来电停留
        ⑤ 催办门槛、KR 结案弹窗「未完成的 N 项会转入在韩持有」（后两项的判断在 data.js / kr.js 里按开关分支，这里放辅助函数）。 */

var TODO_UI = {collapsed:false, mine:false, kind:''};
try{ var _tu = JSON.parse(localStorage.getItem('gmc_todo_ui')||'null'); if(_tu) TODO_UI = Object.assign(TODO_UI, _tu); }catch(e){}
function todoSaveUi(){ try{ localStorage.setItem('gmc_todo_ui', JSON.stringify(TODO_UI)); }catch(e){} }
var TODO_ACTS = [];
var TODO_SCROLL_KEY = '';
function todoEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function todoIsKr(){ try{ return isKrAccount(); }catch(e){ return false; } }

/* ---------------- 待办条目 ----------------
   it = {kind, text, name, no, due('YYYY-MM-DD' 或 'YYYY-MM-DD HH:mm'，页面时区), over, pin, mine, go()} */
function todoMk(kind, text, c, due, over, go, extra){
  return Object.assign({kind:kind, text:text, name:c ? c.name : '', no:c ? (c.caseNo||'') : '', due:due||'', over:!!over, pin:false, mine:true, go:go||null}, extra||{});
}
function todoInGo(c, tab){ return function(){ openCaseDetail(c.id); if(tab){ c.activeCaseTab = tab; renderCaseBody(c); } }; }
function todoInMine(c){ try{ return caseOperators(c, true).inn.indexOf(ME_NAME)>-1; }catch(e){ return true; } }
function todoEtaDue(c){ return c.reportEta ? fmtUtc(c.reportEta) : ''; }
function todoCloseMinusHour(){ var m = timeToMin(CLINIC_SETTINGS.closeTime||'21:00') - 60; return m; }

function inTodoItems(){
  var out = [], now = nowDateObj(), today = todayStr(), nowMin = demoNow().getHours()*60 + demoNow().getMinutes();
  CASE_ITEMS.forEach(function(c){
    if(c.subState==='cancelled' || c.visitClosed || isEnded(c)) return;
    var mine = todoInMine(c), push = function(it){ it.mine = mine; out.push(it); };
    /* 诊疗方案已到 → 联络客人选项目 */
    if(c.reportReady && c.projectsEnabled && c.consultStatus==='report_ready' && !c.endNote && !(c.settlementBatches||[]).length && !(c.recommended||[]).length && !c.localMgmt)
      push(todoMk('plan', '诊疗方案已到：联络客人选项目', c, '', false, todoInGo(c, 'kr')));
    /* 等待报告超时 / 待确认施术时间超时 → 可催办 */
    var ug = urgeInfo(c);
    if(ug) push(todoMk('urge', (c.consultStatus==='awaiting_report' ? '等待报告已超时：可催办' : '待确认施术时间已超过 1 个工作日：可催办'), c, c.consultStatus==='awaiting_report' ? todoEtaDue(c) : '', true, todoInGo(c, c.consultStatus==='awaiting_report' ? 'consult' : 'kr')));
    /* KR 无法安排 → 重选日期 */
    var ks = c.krSchedule;
    if(ks && !ks.status && ks.rejectNote && c.settlementDone && krActiveItems(c).length)
      push(todoMk('resched', 'KR 无法安排所选日期：重选施术日期', c, '', false, todoInGo(c, 'kr')));
    /* KR 已确认施术时间 → 转告客人（打开该案件的赴韩施术 tab 即视为已看到，见 todoMarkRelay） */
    if(scheduleState(c)==='Confirmed' && ks && c.relayTold !== (ks.confirmedDate+' '+ks.confirmedTime))
      push(todoMk('relay', 'KR 已确认施术时间：转告客人（'+ks.confirmedDate+' '+ks.confirmedTime+'）', c, ks.confirmedDate, false, todoInGo(c, 'kr')));
    /* 确认客人日程有无变化：赴韩施术前 2 天出现（CMD-1014-01 二·3） */
    if(newCalOn() && calNeedsRecheck(c)) push(todoMk('recheck', '确认客人日程有无变化（施术 '+ks.confirmedDate+'）', c, ks.confirmedDate, false, todoInGo(c, 'kr')));
    /* 请 IN 帮忙预约印尼术后管理 */
    (c.subItems||[]).forEach(function(s){ if(s.informed && !s.booked && !s.done && s.place!=='KR') push(todoMk('subbook', '请帮忙预约印尼术后管理：'+s.content, c, s.date||'', false, todoInGo(c, 'kr'))); });
    /* 待收款 */
    closeBlockers(c).forEach(function(b){ push(todoMk('pay', '待收款：'+b, c, '', false, todoInGo(c, /面诊费/.test(b) ? 'consult' : 'settle'))); });
    /* 当天本地项目未标完成：营业结束前 1 小时出现，标完才消失 */
    var uses = (c.mgmtUses||[]).concat(c.localMgmt ? (c.localMgmt.mgmtUses||[]) : []).filter(function(u){ return localItemStatus(u)==='进行中'; });
    if(uses.length && (c.arrivedDay===today || c.visitDate===today || c.localMgmtDay===today) && nowMin >= todoCloseMinusHour())
      push(todoMk('local', '当天本地项目还没标完成（'+uses.length+' 项）：营业结束前补标', c, today+' '+(CLINIC_SETTINGS.closeTime||'21:00'), false, todoInGo(c, 'localmgmt')));
    /* 项目确认中超过 3 天没动静 → 等客人决定 */
    if(c.consultStatus==='report_ready' && c.projectsEnabled && !c.endNote && !(c.settlementBatches||[]).length){
      var last = (c.logEntries||[]).length ? utcStrParse(c.logEntries[c.logEntries.length-1].dt) : null;
      if(last && (now - last) > 3*86400000) push(todoMk('quiet', '项目确认中超过 3 天没动静：问问客人决定了吗', c, '', true, todoInGo(c, 'kr')));
    }
  });
  /* 术后管理过了建议日期（按客人，不属于某个案件） */
  try{ postcareDueList().forEach(function(x){ out.push(Object.assign(todoMk('pcdue', '术后管理已过建议日期 '+x.late+' 天：'+x.h.itemName, null, '', true, function(){ openClientDetail(x.name, 'dashboard'); }), {name:x.name})); }); }catch(e){}
  /* 预约占位快过期（剩 5 分钟内） */
  (RESERVATION_PLACEHOLDERS||[]).forEach(function(p){ var left = p.expiresAt - Date.now(); if(left>0 && left<=5*60000) out.push(todoMk('ph', '预约占位快过期：'+p.phone+' '+p.time, null, p.date+' '+p.time, false, null, {name:p.phone})); });
  /* 被 @ / 未接来电（读掉才消失） */
  (NOTIFS||[]).forEach(function(n){ if(!notifMine(n) || n.read[ME_NAME] || !notifAlive(n) || notifTodoKind(n)!=='stay') return; var c = n.caseId ? CASE_ITEMS.filter(function(x){ return x.id===n.caseId; })[0] : null; out.push(todoMk('stay', tzRender(n.text), c, '', false, function(){ openNotif(n.id, 'todo'); })); });
  return out;
}

function krTodoItems(rows){
  var out = [], me = currentAccount(), today = krToday(), h = krHData(), isDir = krIsDirector(), work = canDo('krwork');
  var meId = me ? me.id : '';
  rows.forEach(function(r){
    var c = r.c, mine = (String(r.krCoordinator||'').split(' ')[0]===meId) || (r.director===(me&&me.name)), push = function(it){ it.mine = mine; it.rowKey = r.clinicId+':'+r.id; out.push(it); };
    var goCase = function(tab){ return function(){ krShowCase(r.clinicId, r.id); krSetCaseTab(tab); }; };
    if(work){
      if(c.consultStatus==='paid_waiting_kr') push(todoMk('eta', '确认预计出报告时间', c, '', false, goCase('consult')));
      if(newCalOn() && c.consultStatus==='awaiting_report' && !c.consultStartedAt && reportOverdueNow(c)) push(todoMk('waitdir', '等院长上传面诊（已超时）', c, todoEtaDue(c), true, goCase('consult')));
      if(c.consultStatus==='awaiting_report' && c.consultContentAt){ var over = reportOverdueNow(c); push(todoMk('send', '发送诊疗方案'+(over ? '（已超时）' : ''), c, todoEtaDue(c), over, goCase('consult'))); }
      if(c.urgedAt && ((c.consultStatus==='awaiting_report' && !c.reportReady) || c.consultStatus==='paid_waiting_kr' || scheduleState(c)==='Pending')) push(todoMk('urged', '被催办：请尽快处理', c, '', true, goCase(scheduleState(c)==='Pending' ? 'proc' : 'consult'), {pin:true}));
      if(c.stage==='travel' && scheduleState(c)==='Pending') push(todoMk('sched', '确认施术时间', c, (c.krSchedule||{}).primary||'', false, goCase('proc')));
      if(c.stage==='travel' && scheduleState(c)==='Changing') push(todoMk('change', '改期待确认', c, (c.krSchedule||{}).changePrimary||'', false, goCase('proc')));
      var pp = pendingPayItems(c); if(pp.length) push(todoMk('pay', '在韩加项待付款：'+pp.map(function(i){ return i.name; }).join('、'), c, '', false, goCase('proc')));
      if(c.krBalancePaid && !c.pcBooked && krActiveItems(c).some(function(it){ return (it.postcare||[]).length; })) push(todoMk('pcb', '安排术后管理', c, '', false, goCase('proc')));
    }
    /* 院长：上传面诊内容（面诊已安排、院长还没上传） */
    if(newCalOn() && isDir && c.consultStatus==='awaiting_report' && !c.consultContentAt) push(todoMk('upload', '上传面诊内容', c, todoEtaDue(c), reportOverdueNow(c), goCase('consult')));
    /* 今天到院 / 到店（院长账号看自己的案件） */
    var ks = c.krSchedule;
    if(ks && ['confirmed','arrived'].indexOf(ks.status)>-1 && ks.confirmedDate===today && !c.visitClosed)
      push(todoMk('today', '今天到院：施术', c, today+' '+(ks.confirmedTime||''), false, function(){ krOpenSurgSub(r.clinicId, r.id); }, {no:(krSurgSub(c) ? subCaseNo(c, krSurgSub(c)) : '') || c.caseNo}));
    krTodayVisits(c).forEach(function(s){ push(todoMk('today', '今天到店：'+(s.content||'术后管理'), c, today+' '+(s.time||''), false, function(){ krOpenSub(r.clinicId, r.id, s.id); }, {no:subCaseNo(c, s) || c.caseNo})); });
  });
  if(work && !isDir && h && !(h.dayConfirm||{})[today]) out.push(todoMk('dayconf', '今日院长日程未确认', null, today, false, function(){ krScrollCal(); }));
  try{ krNotifUnread().forEach(function(n){ if(n.kind==='mention' || n.kind==='missedcall' || /@ 了你|未接来电/.test(n.text||'')) out.push(todoMk('stay', tzRender(n.text), null, '', false, function(){ krOpenNotif(n.id); })); }); }catch(e){}
  return out;
}

function todoItems(){
  var items;
  try{ items = todoIsKr() ? krTodoItems(krAllCases()) : inTodoItems(); }catch(e){ console.error('[待办]', e); items = []; }
  return items;
}
function todoGroupOf(it){ if(it.over) return 0; if(it.due && it.due.slice(0,10) > todayStr()) return 2; return 1; }
function todoSort(a, b){ return (b.pin?1:0)-(a.pin?1:0) || (a.due||'9999').localeCompare(b.due||'9999'); }
/* CMD-1014-01 二·1：点卡片 = 筛选待办栏（标题后出现「· 待我处理 ✕」，✕ 回到全部）；开关关闭时仍是 10/13 的 kind 相等判断 */
var TODO_FILTERS = {
  todo:   {label:'待我处理', fn:function(it){ return todoIsKr() ? it.kind!=='today' : true; }},
  visit:  {label:'今天来访', fn:function(it){ return (it.due||'').slice(0,10)===todayStr(); }},
  kr:     {label:'等 KR 回复', fn:function(it){ return ['urge','resched','relay','recheck'].indexOf(it.kind)>-1; }},
  today2: {label:'今天到院 / 到店', fn:function(it){ return it.kind==='today'; }},
  waiting:{label:'等待报告', fn:function(it){ return ['eta','send','urged','waitdir','upload'].indexOf(it.kind)>-1; }},
  msg:    {label:'新消息', fn:function(it){ return it.kind==='stay'; }}
};
function todoKindOk(it){
  if(!TODO_UI.kind) return true;
  if(newCalOn() && TODO_FILTERS[TODO_UI.kind]) return TODO_FILTERS[TODO_UI.kind].fn(it);
  return it.kind===TODO_UI.kind;
}
function todoVisible(items){
  return items.filter(function(it){ return (!TODO_UI.mine || it.mine) && todoKindOk(it); });
}
function todoCardFilter(key){ todoCardOpen(key); TODO_UI.kind = key; todoSaveUi(); todoRefresh(); }

/* ---------------- 待办栏 ---------------- */
function todoRowHtml(it){
  var i = TODO_ACTS.push(it.go) - 1, who = [it.name, it.no].filter(Boolean).join(' · ');
  return '<div class="todo-row'+(it.pin?' pin':'')+'" '+(it.go ? 'onclick="todoGo('+i+')" style="cursor:pointer;"' : '')+'>'+
    '<div class="todo-text">'+(it.pin?'📌 ':'')+todoEsc(it.text)+'</div>'+
    '<div class="todo-sub">'+todoEsc(who)+(it.due ? '<span class="todo-due'+(it.over?' over':'')+'"> · 期限 '+todoEsc(it.due.slice(0,16))+'</span>' : '')+'</div></div>';
}
function todoGo(i){ var f = TODO_ACTS[i]; if(f) try{ f(); }catch(e){ console.error('[待办跳转]', e); } }
function todoPaneHtml(all){
  TODO_ACTS = [];
  var vis = todoVisible(all), n = vis.length;
  if(TODO_UI.collapsed) return '<button class="btn-outline todo-mini" onclick="todoToggle()">待办 '+n+'</button>';
  var groups = [[0,'已超时'],[1,'今天'],[2,'之后']];
  var body = groups.map(function(g){
    var list = vis.filter(function(it){ return todoGroupOf(it)===g[0]; }).sort(todoSort);
    if(!list.length) return '';
    return '<div class="todo-group'+(g[0]===0?' over':'')+'">'+g[1]+' <span>'+list.length+'</span></div>'+list.map(todoRowHtml).join('');
  }).join('') || '<div class="todo-empty">现在没有待办</div>';
  var tag = (newCalOn() && TODO_UI.kind && TODO_FILTERS[TODO_UI.kind]) ? '<span class="todo-tag">· '+todoEsc(TODO_FILTERS[TODO_UI.kind].label)+' <span onclick="todoSetKind(\'\')" style="cursor:pointer;">✕</span></span>' : '';
  return '<div class="todo-box"><div class="todo-head"><b>待办 '+n+'</b>'+tag+
    '<span class="todo-seg"><span class="'+(TODO_UI.mine?'':'on')+'" onclick="todoSetMine(false)">全部</span><span class="'+(TODO_UI.mine?'on':'')+'" onclick="todoSetMine(true)">只看我的</span></span>'+
    '<span class="todo-fold" onclick="todoToggle()" title="收起">⟩</span></div>'+
    ((TODO_UI.kind && !tag) ? '<div class="todo-filter">筛选：'+todoEsc(TODO_KIND_LABEL[TODO_UI.kind]||TODO_UI.kind)+' <span onclick="todoSetKind(\'\')" style="cursor:pointer;">✕</span></div>' : '')+
    '<div class="todo-list">'+body+'</div></div>';
}
var TODO_KIND_LABEL = {today:'今天到院 / 到店'};
function todoToggle(){ TODO_UI.collapsed = !TODO_UI.collapsed; todoSaveUi(); todoRefresh(); }
function todoSetMine(v){ TODO_UI.mine = !!v; todoSaveUi(); todoRefresh(); }
function todoSetKind(k){ TODO_UI.kind = k; if(k) TODO_UI.collapsed = false; todoSaveUi(); todoRefresh(); }

/* 把待办栏挂到日历右边（IN：日历卡片外面包一层；KR：渲染时由 todoKrCalWrap 包） */
function todoMountIn(){
  var grid = document.getElementById('wk-grid'); if(!grid) return null;
  var calCard = grid.closest('.card'); if(!calCard) return null;
  var wrap = document.getElementById('cal-todo-wrap');
  if(!wrap){
    wrap = document.createElement('div'); wrap.id = 'cal-todo-wrap'; wrap.style.cssText = 'display:flex;gap:16px;align-items:flex-start;';
    calCard.parentNode.insertBefore(wrap, calCard); wrap.appendChild(calCard); calCard.style.flex = '1'; calCard.style.minWidth = '0';
    var p = document.createElement('div'); p.id = 'todo-pane'; wrap.appendChild(p);
  }
  return document.getElementById('todo-pane');
}
function todoKrCalWrap(calHtml){
  return '<div id="cal-todo-wrap" style="display:flex;gap:16px;align-items:flex-start;"><div style="flex:1;min-width:0;">'+calHtml+'</div><div id="todo-pane">'+todoPaneHtml(todoItems())+'</div></div>';
}

/* ---------------- 卡片 ---------------- */
function todoCardHtml(label, count, tip, onclick, warn, dot, sub){
  return '<div class="card" onclick="'+onclick+'" title="'+todoEsc(tip)+'" style="position:relative;padding:14px 16px;cursor:pointer;min-width:0;'+(warn?'border-color:#E8A8A0;':'')+'">'+(dot ? '<span title="有新进来的项目" style="position:absolute;top:10px;right:10px;width:10px;height:10px;border-radius:50%;background:#E5484D;"></span>' : '')+
    '<div style="font-size:12px;color:var(--slate2);">'+label+'</div>'+
    '<div style="font-size:28px;font-weight:700;margin:4px 0;color:'+(warn?'#B2453A':'var(--navy)')+';">'+count+'</div>'+
    '<div style="font-size:11px;color:var(--muted);line-height:1.6;">'+(sub||'&nbsp;')+'</div></div>';
}
var TODO_SEEN = {}, TODO_LIT = {};
/* 红点：有新进来的项目就亮，点卡片后才灭（刷新不会自己灭） */
function todoCardDot(key, ids){
  var prev = TODO_SEEN[key]; TODO_SEEN[key] = ids;
  if(prev && ids.some(function(x){ return prev.indexOf(x)<0; })) TODO_LIT[key] = true;
  return !!TODO_LIT[key];
}
function todoDotClear(key){ TODO_LIT[key] = false; }
function todoCountIds(n){ var a = []; for(var i = 0; i < n; i++) a.push('m'+i); return a; }
function todoCardOpen(key){ todoDotClear(key); TODO_UI.collapsed = false; todoSaveUi(); }
/* IN 四张：待我处理 / 今天来访 / 等 KR 回复 / 新消息（放在今日 OFF 下方，样式沿用 KR 卡片） */
function todoMountInCards(){
  var off = document.getElementById('dash-off-row'); if(!off) return null;
  var el = document.getElementById('in-cards');
  if(!el){ el = document.createElement('div'); el.id = 'in-cards'; el.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;'; off.parentNode.insertBefore(el, off.nextSibling); }
  return el;
}
function todoInCardsHtml(all){
  var mine = all.filter(function(it){ return it.mine; });
  var today = todayStr(), vis = calendarEvents().filter(function(e){ return e.date===today && e.kind!=='placeholder' && !(e.kind==='reservation' && e.vstate==='预约取消'); });
  var waiting = CASE_ITEMS.filter(function(c){ return !isEnded(c) && c.subState!=='cancelled' && (['paid_waiting_kr','awaiting_report'].indexOf(c.consultStatus)>-1 || (c.stage==='travel' && ['Pending','Changing'].indexOf(scheduleState(c))>-1)); });
  var late = waiting.some(function(c){ return c.consultStatus==='awaiting_report' && reportOverdueNow(c); });
  var unread = 0; try{ unread = totalUnread(); }catch(e){}
  return todoCardHtml('待我处理', all.length, '要你做的事（右边待办栏）', (newCalOn() ? 'todoCardFilter(\'todo\')' : 'todoCardOpen(\'todo\');todoSetKind(\'\')'), all.some(function(i){ return i.over; }), todoCardDot('todo', all.map(function(i){ return i.kind+i.no+i.text; })), '我的 <b>'+mine.length+'</b>')+
    todoCardHtml('今天来访', vis.length, '今天的预约来访、赴韩施术（点一下看今天的日历）', (newCalOn() ? 'todoCardFilter(\'visit\')' : 'todoShowToday()'), false, false, '')+
    todoCardHtml('等 KR 回复', waiting.length, '等 KR 确认出报告时间、等待报告、待确认施术时间；超时标红', (newCalOn() ? 'todoCardFilter(\'kr\')' : 'filterCases(\'consult\');nav(\'in-cases\')'), late, false, '')+
    todoCardHtml('新消息', unread, '对话里的未读消息', (newCalOn() ? 'todoCardFilter(\'msg\')' : 'todoDotClear(\'msg\');openDrawer()'), false, todoCardDot('msg', todoCountIds(unread)), '');
}
function todoShowToday(){ if(typeof calToday==='function'){ DAY_OFFSET = 0; WEEK_OFFSET = 0; if(typeof setCalMode==='function') setCalMode('day'); calToday(); } var g = document.getElementById('cal-todo-wrap'); if(g) g.scrollIntoView({behavior:'smooth', block:'start'}); }
/* KR 四张：待我处理 / 今天到院、到店 / 等待报告（超时标红）/ 新消息 */
var TODO_KR_ROWS = {};
function todoKrRegisterCards(){
  if(KR_CARDS.some(function(c){ return c.key==='todo'; })) return;
  KR_CARDS.push({key:'todo', n:true, label:'待我处理', tip:'要你做的事（右边待办栏）', test:function(r){ return !!TODO_KR_ROWS[r.clinicId+':'+r.id]; }});
  KR_CARDS.push({key:'today2', n:true, label:'今天到院 / 到店', tip:'今天到院施术、今天到店做术后管理 / 持有项目的客人（点一下筛选待办 + 看今天的日历）', test:function(r){ return KR_CARDS[4].test(r) || r.subToday>0; }});
}
function todoKrCardsHtml(rows){
  todoKrRegisterCards();
  var all = todoItems(); TODO_KR_ROWS = {}; all.forEach(function(it){ if(it.rowKey) TODO_KR_ROWS[it.rowKey] = 1; });
  var cs = ['todo','today2','waiting'].map(function(k){ return KR_CARDS.filter(function(c){ return c.key===k; })[0]; });
  var html = cs.map(function(card){
    var h = krCardHtml(card, rows);
    if(newCalOn()){ h = h.replace(/onclick="[^"]*"/, 'onclick="krCardMarkSeen(\''+card.key+'\');todoCardFilter(\''+card.key+'\')"'); if(card.key==='todo') h = h.replace(/<div style="font-size:28px[^>]*>\d+</, function(m){ return m.replace(/>\d+</, '>'+all.length+'<'); }); return h; }
    if(card.key==='todo') h = h.replace(/onclick="[^"]*"/, 'onclick="krCardMarkSeen(\'todo\');todoSetKind(\'\')"').replace(/<div style="font-size:28px[^>]*>\d+</, function(m){ return m.replace(/>\d+</, '>'+all.length+'<'); });
    if(card.key==='today2') h = h.replace(/onclick="[^"]*"/, 'onclick="krCardMarkSeen(\'today2\');todoSetKind(\'today\');todoKrToday()"');
    return h;
  }).join('');
  var unread = 0; try{ unread = krRoomList().reduce(function(s, r){ return s + r.unread; }, 0); }catch(e){}
  html += todoCardHtml('新消息', unread, '对话里的未读消息', (newCalOn() ? 'todoCardFilter(\'msg\')' : 'todoDotClear(\'krmsg\');krOpenDrawer()'), false, todoCardDot('krmsg', todoCountIds(unread)), '');
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">'+html+'</div>';
}
function todoKrToday(){ if(typeof KRC!=='undefined'){ KRC.mode = 'day'; KRC.anchor = krToday(); KRC.person = 'all'; krcRender(); } }

/* ---------------- 现在时间线 ---------------- */
function todoNowLabel(){ var d = demoNow(); return pad2(d.getHours())+':'+pad2(d.getMinutes()); }
function todoNowMinutes(){ var d = demoNow(); return d.getHours()*60 + d.getMinutes(); }
function todoPlaceInLine(){
  var grid = document.getElementById(CAL_MODE==='day' ? 'day-grid' : 'wk-grid'); if(!grid || (CAL_MODE!=='week' && !(CAL_MODE==='day' && newCalOn()))) return;
  var old = grid.querySelector('.todo-nowline'); if(old) old.remove();
  var wkDays = grid.querySelectorAll('.wk-head'); var today = todayStr(), has = false;
  /* 本周里有今天才画（日期列头 today 标记） */
  has = !!grid.querySelector('.wk-head.today'); if(!has) return;
  var nowMin = todoNowMinutes(), rows = grid.querySelectorAll('.wk-time'), hit = null, frac = 0;
  for(var i = 0; i < rows.length; i++){
    var m = /^(\d{1,2}):(\d{2})/.exec((rows[i].firstChild && rows[i].firstChild.nodeValue) || rows[i].textContent || ''); if(!m) continue;
    var s = parseInt(m[1],10)*60 + parseInt(m[2],10), span = rows[i].offsetHeight ? 30 : 30;
    if(nowMin >= s && nowMin < s + span){ hit = rows[i]; frac = (nowMin - s) / span; break; }
  }
  if(!hit) return; /* 现在不在营业时间的时间轴里（午休 / 营业时间外）→ 不画 */
  grid.style.position = 'relative';
  var line = document.createElement('div'); line.className = 'todo-nowline';
  line.style.top = (hit.offsetTop + frac * hit.offsetHeight)+'px';
  line.innerHTML = '<span>'+todoNowLabel()+'</span>';
  grid.appendChild(line);
  todoScrollToNow(line);
}
function todoScrollToNow(line){
  var key = CAL_MODE+'|'+CAL_VIEW+'|'+WEEK_OFFSET; if(TODO_SCROLL_KEY===key) return;
  var sc = line.closest('.wk-scroll'); if(!sc || !sc.clientHeight) return; /* 工作台不在画面上（别的页面）时先不滚，等回到工作台再滚 */
  TODO_SCROLL_KEY = key; sc.scrollTop = Math.max(0, line.offsetTop - sc.clientHeight/3);
}
function todoDayDivider(){
  var box = document.getElementById('day-detail'); if(!box || DAY_OFFSET!==0) return;
  var old = box.querySelector('.todo-daynow'); if(old) old.remove();
  var rows = box.querySelectorAll('.schedule-row'), nowMin = todoNowMinutes(), before = null;
  for(var i = 0; i < rows.length; i++){ var t = rows[i].querySelector('.schedule-time'); if(!t) continue; var m = /^(\d{1,2}):(\d{2})/.exec(t.textContent||''); if(m && parseInt(m[1],10)*60+parseInt(m[2],10) >= nowMin){ before = rows[i]; break; } }
  var d = document.createElement('div'); d.className = 'todo-daynow'; d.innerHTML = '<span>现在 '+todoNowLabel()+'</span>';
  if(before) box.insertBefore(d, before); else box.appendChild(d);
}
function todoKrNowTick(){
  document.querySelectorAll('.krc-nowline').forEach(function(el){
    var m = todoNowMinutes(), top = (m - KRC_H0*60) * KRC_PX / 60;
    el.style.display = (m < KRC_H0*60 || m >= KRC_H1*60) ? 'none' : ''; el.style.top = top+'px'; el.innerHTML = '<span>'+todoNowLabel()+'</span>';
  });
}
function todoNowLineHtml(){ /* kr.js 的 krcGridHtml 在今天那一列里调用 */
  if(!newTodoOn()) return '';
  var m = todoNowMinutes(); if(m < KRC_H0*60 || m >= KRC_H1*60) return '';
  return '<div class="krc-nowline todo-nowline" style="top:'+((m - KRC_H0*60) * KRC_PX / 60)+'px;"><span>'+todoNowLabel()+'</span></div>';
}

/* ---------------- 刷新 / 入口 ---------------- */
function todoRefresh(){
  if(!newTodoOn()) return;
  try{
    var all = todoItems(), p = document.getElementById('todo-pane');
    if(todoIsKr()){ if(p) p.innerHTML = todoPaneHtml(all); return; }
    p = todoMountIn(); if(p) p.innerHTML = todoPaneHtml(all);
    var cards = todoMountInCards(); if(cards) cards.innerHTML = todoInCardsHtml(all);
  }catch(e){ console.error('[待办刷新]', e); }
}
/* renderCalendar() 末尾调用：日历重画后补上待办栏 + 现在时间线 */
function todoAfterCalendar(){
  if(!newTodoOn() || todoIsKr()) return;
  try{ todoRefresh(); if(CAL_MODE==='day' && !newCalOn()) todoDayDivider(); else todoPlaceInLine(); }catch(e){ console.error('[待办日历]', e); }
}
function todoTick(){
  if(!newTodoOn()) return;
  try{
    if(todoIsKr()){ todoKrNowTick(); if(document.getElementById('todo-pane') && !document.querySelector('.modal-overlay.open')) todoRefresh(); return; }
    if(CURRENT_PAGE_ID!=='in-dashboard') return;
    todoRefresh();
    var line = document.querySelector('.todo-nowline');
    if(CAL_MODE==='week' || (CAL_MODE==='day' && newCalOn())) todoPlaceInLine(); else if(CAL_MODE==='day') todoDayDivider();
  }catch(e){}
}
setInterval(todoTick, 30000);
setInterval(function(){ try{ if(newTodoOn() && document.getElementById('todo-pane') && !document.hidden) todoRefresh(); }catch(e){} }, 5000);
/* IN 启动：默认打开日视图 */
function todoInBoot(){ if(!newTodoOn() || todoIsKr()) return; try{ if(typeof setCalMode==='function') setCalMode('day'); }catch(e){ console.error('[默认日视图]', e); } }
/* KR：默认日视图（全部院长） */
(function(){ try{ if(newTodoOn() && typeof KRC!=='undefined'){ KRC.mode = 'day'; KRC.person = 'all'; } }catch(e){} })();

/* ---------------- 转告客人：打开该案件的赴韩施术 tab 即视为已看到 ---------------- */
(function(){
  if(typeof renderCaseBody!=='function') return;
  var base = renderCaseBody;
  renderCaseBody = function(c){
    base.apply(this, arguments);
    try{ if(newTodoOn() && !newCalOn() && !todoIsKr() && c && c.activeCaseTab==='kr' && scheduleState(c)==='Confirmed' && c.krSchedule){ var key = c.krSchedule.confirmedDate+' '+c.krSchedule.confirmedTime; if(c.relayTold!==key){ c.relayTold = key; Store.touch(); } } }catch(e){}
  };
})();

/* ---------------- 弹出提示分类（CMD-1013-17 四） ---------------- */
/* 'stay' 被 @ / 未接来电：弹出并停留；'todo' 新待办：弹一次自动收起；'msg' 消息：不弹，只进铃铛 */
function notifTodoKind(n){
  var tx = String(n.text||''), kd = n.kind||'';
  if(kd==='mention' || kd==='missedcall' || /@ 了你|未接来电/.test(tx)) return 'stay';
  if(/诊疗方案已到|等待报告超过|无法安排|请 IN 帮忙预约|预约占位快过期|KR 确认(新)?施术时间|待收款|催办|已缴面诊费|面诊费已免除|需要处理|施术日期待确认|改期待确认|在韩加项/.test(tx) || kd==='urge' || kd==='consultpaid') return 'todo';
  return 'msg';
}

/* KR 结案弹窗：「未完成的 N 项会转入在韩持有」（N = 0 不显示）；与 coreFinishToday 实际转入的项一致 */
function todayHeldCount(c){
  var info = todayFinishInfo(c); if(!info) return 0;
  var n = info.undone.length;
  (c.subItems||[]).forEach(function(s){ if(s.kind==='术后管理记录' && !s.done && !s.hold && info.undone.indexOf(s)<0) n++; });
  krNotStartedItems(c).forEach(function(it){ if(isLocalKrItem(it) && !it.service) n++; });
  return n;
}
function todayHeldLineHtml(c){
  if(!newTodoOn()) return '';
  var n = todayHeldCount(c); if(!n) return '';
  return '<div style="font-size:12px;color:var(--slate2);margin:2px 0 4px;">未完成的 '+n+' 项会转入在韩持有</div>';
}

/* 催办：待确认施术时间超过 1 个工作日（休诊日不算） */
function todoWorkdaysSince(utcStr){
  var t0 = utcStrParse(utcStr); if(!t0) return 0;
  var d0 = fmtUtc(utcStr).slice(0,10), n = 0, d = new Date(d0+'T00:00:00'), today = todayStr();
  while(true){ d.setDate(d.getDate()+1); var ds = d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); if(ds > today) break; if(!closedWholeDay(CLINIC_SETTINGS.closedRules, d.getDay())) n++; }
  if(n===1){ var nowT = fmtUtc(nowFullDt()).slice(11,16), subT = fmtUtc(utcStr).slice(11,16); if(nowT < subT) return 0; }
  return n;
}
function todoScheduleSubmittedAt(c){
  var l = (c.logEntries||[]).slice().reverse().filter(function(e){ return /递交施术日期/.test(e.action||''); })[0];
  return l ? l.dt : '';
}
