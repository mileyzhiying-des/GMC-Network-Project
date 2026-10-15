/* ================= CMD-1013-17 待办 / 通知调整（10/15 正式采用）=================
   规则：Notification Center 顶部「🧪 2026-10-13 待办 / 通知调整」、IN-DASH-01 / KR-DASH-01 同名节。
   原则：现有工作台 / 日历 / 通知中心的版面样式一律不动，这里只新增。
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
/* CMD-1014-02：4 张卡 = 待办 4 类。每条待办恰好属于一类（待办总数 = 4 类加总，卡片数字 = 点下去筛出的条数） */
var TODO_CAT = {bkconf:'todo', rebook:'todo', plan:'todo', resched:'todo', relay:'todo', recheck:'todo', pay:'todo', local:'todo', quiet:'todo', ph:'todo', subbook:'todo', pcdue:'todo', urge:'kr', waitkr:'kr', visit:'visit',
  eta:'todo', send:'todo', urged:'todo', sched:'todo', change:'todo', pcb:'todo', dayconf:'todo', upload:'todo', today:'today2', waitdir:'waiting', stay:'msg'};
/* CMD-1015-05 九：第一栏「阶段｜待办事项」——阶段读案件的阶段（同案件列表），没有案件的按类型 */
var TODO_STAGE_BY_KIND = {bkconf:'预约', rebook:'预约', visit:'预约', ph:'预约', pcdue:'术后管理', subbook:'术后管理', pcb:'术后管理', stay:'消息', eta:'面诊', waitdir:'面诊', upload:'面诊', send:'面诊', plan:'项目确认'};
function todoStageOf(kind, c){ if(TODO_STAGE_BY_KIND[kind]) return TODO_STAGE_BY_KIND[kind]; try{ if(c) return caseStageInfo(c).stage || ''; }catch(e){} return ''; }
/* 红点：新进来的待办亮红点，打开那个案件后灭（每个账号各自记；第一次打开先把现有的都当已看过） */
function todoSeenKey(){ var id = ''; try{ id = currentAccountId() || ''; }catch(e){} return 'gmc_cfg_todoseen_'+id; }
var TODO_SEEN_SET = null;
function todoSeenLoad(){ if(TODO_SEEN_SET) return TODO_SEEN_SET; TODO_SEEN_SET = {}; try{ var raw = localStorage.getItem(todoSeenKey()); if(raw) TODO_SEEN_SET = JSON.parse(raw); else TODO_SEEN_SET = {__init:1}; }catch(e){} return TODO_SEEN_SET; }
function todoSeenSave(){ try{ localStorage.setItem(todoSeenKey(), JSON.stringify(TODO_SEEN_SET)); }catch(e){} }
function todoSeenBaseline(items){ var s = todoSeenLoad(); if(s.__init){ delete s.__init; items.forEach(function(it){ s[it.key] = 1; }); todoSeenSave(); } }
function todoIsNew(it){ return !todoSeenLoad()[it.key]; }
function todoMarkCaseSeen(caseId){ if(!caseId) return; var s = todoSeenLoad(), ch = false; Object.keys(s).forEach(function(){}); (TODO_LAST||[]).forEach(function(it){ if(it.caseId===caseId && !s[it.key]){ s[it.key] = 1; ch = true; } }); if(ch){ todoSeenSave(); try{ todoRefresh(); }catch(e){} } }
var TODO_LAST = [], TODO_ACT_CASE = [];
function todoMk(kind, text, c, due, over, go, extra){
  return Object.assign({kind:kind, stage:todoStageOf(kind, c), key:kind+'|'+(c ? c.id : '')+'|'+(c ? '' : String(text).replace(/（已超时）/g, '')), cat:TODO_CAT[kind]||'todo', text:text, name:c ? c.name : '', no:c ? (c.caseNo||'') : '', caseId:c ? c.id : '', due:due||'', over:!!over, pin:false, mine:true, go:go||null}, extra||{});
}
function todoInGo(c, tab){ return function(){ openCaseDetail(c.id); if(tab){ c.activeCaseTab = tab; renderCaseBody(c); } }; }
function todoInMine(c){ try{ return caseOperators(c, true).inn.indexOf(ME_NAME)>-1; }catch(e){ return true; } }
function todoEtaDue(c){ return c.reportEta ? fmtUtc(c.reportEta) : ''; }
function todoCloseMinusHour(){ var m = timeToMin(CLINIC_SETTINGS.closeTime||'21:00') - 60; return m; }

/* IN-08：待收款点了去哪——面诊费 → 面诊资料；待付款结算单 → 它所在的 tab（有赴韩项目 = 赴韩施术计划，只有本地项目 = 本地管理）并滚到那张结算单 */
function todoPayGo(c, b){
  if(/面诊费/.test(b)) return todoInGo(c, 'consult');
  var m = /批次 ([^）)]+)/.exec(b), bid = m ? m[1] : '', bt = (c.settlementBatches||[]).filter(function(x){ return x.id===bid; })[0];
  var hasKr = bt ? krAllItems(c).some(function(it){ return it.batchId===bid; }) : false;
  return function(){ openCaseDetail(c.id); c.activeCaseTab = hasKr ? 'kr' : (bt ? 'localmgmt' : 'settle'); renderCaseBody(c); setTimeout(function(){ var el = document.getElementById('settle-card-'+bid); if(el && el.scrollIntoView) el.scrollIntoView({block:'center'}); }, 80); };
}
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
    if(ug && !newCalOn()) push(todoMk('urge', (c.consultStatus==='awaiting_report' ? '等待报告已超时：可催办' : '待确认施术时间已超过 1 个工作日：可催办'), c, c.consultStatus==='awaiting_report' ? todoEtaDue(c) : '', true, todoInGo(c, c.consultStatus==='awaiting_report' ? 'consult' : 'kr')));
    /* 10/14：今天来访（预约还没接待，一位一条）+ 等 KR 回复（没超时灰色，超时红 + ［催办］） */
    if(newCalOn()){
      if(c.stage==='booked' && c.subState==='waiting' && c.visitDate===today && !c.krVisit){ /* CMD-1015-08：没到预约时间 = 参考名单（不进待办）；过了预约时间还没按已到店 / 未到店 = 待办「客人还没到：联络客人」 */
        var vdue = today+' '+(c.visitTime||''), vover = !!c.visitTime && todoNowStr() >= vdue;
        push(todoMk('visit', vover ? '客人还没到：联络客人' : (c.visitTime||'')+' '+c.name+' · '+(c.visitPurpose||'到店'), c, vdue, vover, function(){ openCaseDetail(c.id); }));
      }
      var wk = null;
      if(c.consultStatus==='paid_waiting_kr') wk = {t:'等 KR 确认出报告时间', due:'', tab:'consult'};
      else if(c.consultStatus==='awaiting_report') wk = {t:'等 KR 出诊疗方案', due:todoEtaDue(c), tab:'consult'};
      else if(c.stage==='travel' && scheduleState(c)==='Pending') wk = {t:'等 KR 确认施术时间', due:(c.krSchedule||{}).primary||'', tab:'kr'};
      else if(c.stage==='travel' && scheduleState(c)==='Changing') wk = {t:'等 KR 确认改期', due:(c.krSchedule||{}).changePrimary||'', tab:'kr'};
      if(wk) push(todoMk('waitkr', wk.t+(ug ? '（已超时）' : ''), c, wk.due, !!ug, todoInGo(c, wk.tab), {urge:!!ug, gray:!ug}));
    }
    /* KR 无法安排 → 重选日期 */
    var ks = c.krSchedule;
    if(ks && !ks.status && ks.rejectNote && c.settlementDone && krActiveItems(c).length)
      push(todoMk('resched', 'KR 无法安排所选日期：重选施术日期', c, '', false, todoInGo(c, 'kr')));
    /* KR 已确认施术时间 → 转告客人（打开该案件的赴韩施术 tab 即视为已看到，见 todoMarkRelay） */
    if(scheduleState(c)==='Confirmed' && ks && c.relayTold !== (ks.confirmedDate+' '+ks.confirmedTime))
      push(todoMk('relay', 'KR 已确认施术时间：转告客人（'+ks.confirmedDate+' '+ks.confirmedTime+'）', c, ks.confirmedDate, false, todoInGo(c, 'kr')));
    /* 确认客人日程有无变化：赴韩施术前 2 天出现（CMD-1014-01 二·3） */
    if(newCalOn() && calNeedsRecheck(c)) push(todoMk('recheck', '确认客人日程有无变化（施术 '+ks.confirmedDate+'）', c, ks.confirmedDate, calDaysToSurgery(c)<=0, todoInGo(c, 'kr')));
    /* 待收款 */
    closeBlockers(c).forEach(function(b){ push(todoMk('pay', '待收款：'+b, c, '', false, todoPayGo(c, b))); }); /* IN-08：点了去那张待付款结算单所在的 tab（赴韩施术计划 / 本地管理）并滚到那张结算单 */
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
  /* CMD-1014-16：IN 在 KR 日程占位的预约，KR 改时间 / 无法安排 → 重选时间 */
  try{ krbMine().filter(function(b){ return b.status==='reselect'; }).forEach(function(b){ out.push(todoMk('rebook', '重选时间：'+b.clientName+'（'+(b.reselectKind==='change' ? 'KR 建议改时间' : 'KR 无法安排')+'：'+(b.reselectReason||'—')+'）', null, b.date+' '+b.time, true, function(){ krBookReselectOpen(b.id); }, {name:b.clientName, no:''})); }); }catch(e){}
  /* 术后管理过了建议日期（按客人，不属于某个案件） */
  try{ postcareDueList().forEach(function(x){ out.push(Object.assign(todoMk('pcdue', '术后管理已过建议日期 '+x.late+' 天：'+x.h.itemName, null, '', true, function(){ openClientDetail(x.name, 'dashboard'); setTimeout(function(){ var el = document.getElementById('detail-holdings-block'); if(el && el.scrollIntoView) el.scrollIntoView({block:'start'}); }, 80); }), {name:x.name})); }); }catch(e){} /* IN-11：去客户详情 · 持有 */
  /* 预约占位快过期（剩 5 分钟内） */
  (RESERVATION_PLACEHOLDERS||[]).forEach(function(p){ var left = p.expiresAt - Date.now(); if(left>0 && left<=5*60000) out.push(todoMk('ph', '预约占位快过期：'+p.phone+' '+p.time, null, p.date+' '+p.time, false, function(){ todoGoPlaceholder(p); }, {name:p.phone})); /* IN-12：去工作台，日历上看那个占位 */ });
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
      if(newCalOn() && c.consultStatus==='awaiting_report' && !c.consultContentAt){ var wo = reportOverdueNow(c); push(todoMk('waitdir', '等院长上传面诊'+(wo ? '（已超时）' : (c.consultStartedAt ? '（面诊中）' : '')), c, todoEtaDue(c), wo, goCase('consult'), {gray:!wo})); }
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
      push(todoMk('today', todoNotArrivedOver(today, ks.confirmedTime, ks.status==='arrived') ? '客人还没到：联络 IN 确认行程' : '今天到院：施术', c, today+' '+(ks.confirmedTime||''), todoNotArrivedOver(today, ks.confirmedTime, ks.status==='arrived'), function(){ krOpenSubCard(r.clinicId, r.id); }, {no:(krSurgSub(c) ? subCaseNo(c, krSurgSub(c)) : '') || c.caseNo}));
    krTodayVisits(c).forEach(function(s){ push(todoMk('today', todoNotArrivedOver(today, s.time, !!s.arrived) ? '客人还没到：联络 IN 确认行程' : '今天到店：'+(s.content||'术后管理'), c, today+' '+(s.time||''), todoNotArrivedOver(today, s.time, !!s.arrived), function(){ krOpenSubCard(r.clinicId, r.id, s.id); }, {no:subCaseNo(c, s) || c.caseNo})); });
  });
  /* CMD-1014-16：IN 在 KR 日程占位的预约 → 确认预约时间；确认后的预约今天到店 */
  try{ var hidB = krHospitalIdOfMe(), meB = currentAccount(); (krbList(hidB)||[]).forEach(function(b){
    var cn = ((clinicById(b.clinicId)||{}).name)||'';
    if(work && b.status==='pending') out.push(todoMk('bkconf', '确认预约时间（'+krbPurposeText(b.purpose)+'）· '+cn, null, b.date+' '+b.time, false, function(){ krBookOpen(b.id); }, {name:b.clientName, no:'', mine:true, rowKey:b.clinicId+':'}));
    if(b.status==='confirmed' && b.date===today && (work || (isKrDirectorLike(meB) && b.director===meB.name))) out.push(todoMk('today', todoNotArrivedOver(b.date, b.time, !!b.arrivedAt) ? '客人还没到：联络 IN 确认行程' : '今天到店：预约 · '+krbPurposeText(b.purpose), null, b.date+' '+b.time, todoNotArrivedOver(b.date, b.time, !!b.arrivedAt), function(){ krBookOpen(b.id); }, {name:b.clientName, no:'', mine:true, rowKey:b.clinicId+':'}));
  }); }catch(e){}
  try{ krNotifUnread().forEach(function(n){ if(n.kind==='mention' || n.kind==='missedcall' || /@ 了你|未接来电/.test(n.text||'')) out.push(todoMk('stay', tzRender(n.text), null, '', false, function(){ krOpenNotif(n.id); })); }); }catch(e){}
  return out;
}

/* CMD-1015-08：过了到院 / 到店时间还没标到 = 超时（待办）；已到的不算 */
function todoNotArrivedOver(ds, tm, arrived){ return !arrived && !!tm && todoNowStr() >= ds+' '+tm; }
/* 待办 = 现在需要我动手做的事：状态「等待中 / 待接待」（没超时的 visit / kr / waiting / today2 类）不进待办栏，只在点卡片时当灰色参考名单显示（it.ref） */
var TODO_REF_CATS = ['visit', 'kr', 'waiting', 'today2'];
function todoGoPlaceholder(p){ try{ nav('in-dashboard'); if(typeof setCalView==='function' && CAL_VIEW!=='in') setCalView('in'); DAY_OFFSET = Math.round((new Date(p.date+'T00:00:00') - new Date(todayStr()+'T00:00:00'))/86400000); setCalMode('day'); renderCalendar(); }catch(e){ console.error('[占位跳转]', e); } }
function todoItems(){
  var items;
  try{ items = todoIsKr() ? krTodoItems(krAllCases()) : inTodoItems(); }catch(e){ console.error('[待办]', e); items = []; }
  if(newCalOn()){
    if(todoIsKr() && krIsDirector()) items = items.filter(function(it){ return it.kind!=='today'; }); /* 院长：今天到院不进待办（看日历） */
    items.forEach(function(it){ it.ref = TODO_REF_CATS.indexOf(it.cat)>-1 && !it.over; });
  }
  return items;
}
/* CMD-1015-07：待办新格式——一行 6 栏「出现时间｜阶段｜进程｜截止时间｜状态｜客人 + Case ID」。
   出现时间 = 这条待办第一次出现的时间（每账号各记，存 localStorage gmc_cfg_todoat_账号，用演示时钟 demoNow()，所以拨时钟 / 隔天会跟着变）；
   超过截止时间还没处理 → 出现时间改成截止时间并按新时间重排、整行红字；分组 = 昨日及更早 / 今天 / 未来（依据显示的出现时间）；
   组内：超时的在最上面（按截止时间旧→新），其余按出现时间旧→新。 */
function todoAtKey(){ var id = ''; try{ id = currentAccountId() || ''; }catch(e){} return 'gmc_cfg_todoat_'+id; }
var TODO_AT = null;
function todoAtLoad(){ if(TODO_AT) return TODO_AT; TODO_AT = {}; try{ var raw = localStorage.getItem(todoAtKey()); if(raw) TODO_AT = JSON.parse(raw) || {}; }catch(e){} return TODO_AT; }
function todoNowStr(){ var d = demoNow(), p = function(n){ return (n<10?'0':'')+n; }; return dateStr(d)+' '+p(d.getHours())+':'+p(d.getMinutes()); }
/* 给每条待办盖出现时间（第一次见到的时刻），清掉已经不在列表里的；返回 true 表示有变化 */
function todoStampAt(all){
  var m = todoAtLoad(), now = todoNowStr(), keep = {}, ch = false;
  all.forEach(function(it){ keep[it.key] = 1; if(!m[it.key]){ m[it.key] = now; ch = true; } it.at = m[it.key]; });
  Object.keys(m).forEach(function(k){ if(!keep[k]){ delete m[k]; ch = true; } });
  if(ch){ try{ localStorage.setItem(todoAtKey(), JSON.stringify(m)); }catch(e){} }
  return ch;
}
/* 显示的出现时间：超时且有截止时间 → 截止时间；否则第一次出现的时间 */
function todoShownAt(it){ return (it.over && it.due && it.due <= todoNowStr()) ? it.due : (it.at || ''); } /* 截止时间已过才改用截止时间；超时但「截止」是将来的日期（如施术日期）时仍用出现时间 */
function todoFmtTime(s){ if(!s) return '—'; var d = s.slice(0,10), hm = s.length>=16 ? s.slice(11,16) : ''; if(d===todayStr()) return hm || '今天'; return s.slice(5,10)+(hm ? ' '+hm : ''); }
function todoGroupOf(it){ var d = (todoShownAt(it)||'').slice(0,10) || todayStr(); return d < todayStr() ? 0 : 1; } /* CMD-1015-08：只留 昨日及更早 / 今天 */
function todoSort(a, b){ return (b.pin?1:0)-(a.pin?1:0) || ((b.over?1:0)-(a.over?1:0)) || (todoShownAt(a)||'9999').localeCompare(todoShownAt(b)||'9999'); }
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
  if(newCalOn() && TODO_FILTERS[TODO_UI.kind]) return it.cat===TODO_UI.kind;
  return it.kind===TODO_UI.kind;
}
function todoRefMode(){ return newCalOn() && TODO_REF_CATS.indexOf(TODO_UI.kind)>-1; } /* 点了「今天来访 / 等 KR 回复 / 今天到院·到店 / 等待报告」卡：待办栏改显示那份名单（灰色参考） */
function todoVisible(items){
  var ref = todoRefMode();
  return items.filter(function(it){ return (!TODO_UI.mine || it.mine) && todoKindOk(it) && (ref || !it.ref); });
}

function todoCardFilter(key){ todoCardOpen(key); TODO_UI.kind = key; todoSaveUi(); todoRefresh(); }
/* 催办（待办栏里的 KR 回复行）：借用案件页的 urgeKr() */
function todoUrge(id){ var c = calCaseById(id); if(!c) return; var old = CURRENT_CASE_ID; CURRENT_CASE_ID = id; try{ urgeKr(); }finally{ CURRENT_CASE_ID = old; } todoRefresh(); }

/* ---------------- 待办栏 ---------------- */
/* CMD-1014-15 三：待办每行四栏对齐：事项｜预计时间｜状态｜客人名 + Case ID；状态 = 等待中（灰）/ 待处理 / 待接待 / 已超时（红 +［催办］）；事项文字统一正文色；没有期限写「—」 */
function todoStatusOf(it){
  if(it.over) return {t:'已超时', cls:'over'};
  if(it.cat==='visit') return {t:'待接待', cls:'recv'};
  if(it.cat==='today2') return {t:'未到', cls:'wait'}; /* CMD-1015-08：今天到院 / 到店还没到（只在参考名单里出现） */
  if(it.gray || it.cat==='kr' || it.cat==='waiting') return {t:'等待中', cls:'wait'};
  return {t:'待处理', cls:'todo'};
}
function todoRowHtml(it){
  var i = TODO_ACTS.push(it.go) - 1, st = todoStatusOf(it); TODO_ACT_CASE[i] = it.caseId||'';
  var urgeBtn = it.urge ? '<button class="btn-primary todo-urge" onclick="event.stopPropagation();todoUrge(\''+it.caseId+'\')">'+((calCaseById(it.caseId)||{}).urgedAt ? '再次催办' : '催办')+'</button>' : '';
  var proc = String(it.text||'').replace(/（已超时）|\(已超时\)/g, '').trim();
  return '<div class="todo-row'+(it.pin?' pin':'')+(it.over?' is-over':'')+((it.ref || (todoRefMode() && !it.over))?' is-ref':'')+'" '+(it.go ? 'onclick="todoGo('+i+')" style="cursor:pointer;"' : '')+'>'+
    '<div class="todo-at">'+(todoIsNew(it) ? '<span class="todo-newdot" title="新的待办"></span>' : '')+todoEsc(todoFmtTime(todoShownAt(it)))+'</div>'+
    '<div class="todo-stage">'+(it.pin?'📌 ':'')+todoEsc(it.stage||'—')+'</div>'+
    '<div class="todo-text">'+todoEsc(proc)+'</div>'+
    '<div class="todo-due'+(it.over?' over':'')+'">'+(it.due ? todoEsc(todoFmtTime(it.due)) : '—')+'</div>'+
    '<div class="todo-st '+st.cls+'">'+st.t+urgeBtn+'</div>'+
    '<div class="todo-who">'+(it.name ? '<b>'+todoEsc(it.name)+'</b>' : '<span style="color:var(--muted);">—</span>')+(it.no ? '<span>'+todoEsc(it.no)+'</span>' : '')+'</div></div>';
}
function todoGo(i){ var f = TODO_ACTS[i]; try{ var cid = (TODO_ACT_CASE||{})[i]; if(cid) todoMarkCaseSeen(cid); }catch(e){} if(f) try{ f(); }catch(e){ console.error('[待办跳转]', e); } }
function todoPaneHtml(all){
  TODO_ACTS = []; TODO_ACT_CASE = []; TODO_LAST = all; todoSeenBaseline(all); todoStampAt(all);
  var vis = todoVisible(all), n = vis.length;
  if(TODO_UI.collapsed) return '<button class="btn-outline todo-mini" onclick="todoToggle()">待办 '+n+'</button>';
  var boxStyle = newCalOn() ? ' style="width:auto;"' : '';
  var groups = [[0,'昨日及更早'],[1,'今天']];
  var body = groups.map(function(g){
    var list = vis.filter(function(it){ return todoGroupOf(it)===g[0]; }).sort(todoSort);
    if(!list.length) return '';
    return '<div class="todo-group">'+g[1]+' <span>'+list.length+'</span></div>'+list.map(todoRowHtml).join('');
  }).join('') || '<div class="todo-empty">'+(refMode ? '这类名单现在是空的' : '现在没有待办')+'</div>';
  var tag = (newCalOn() && TODO_UI.kind && TODO_FILTERS[TODO_UI.kind]) ? '<span class="todo-tag">· '+todoEsc(TODO_FILTERS[TODO_UI.kind].label)+' <span onclick="todoSetKind(\'\')" style="cursor:pointer;">✕</span></span>' : '';
  var refMode = todoRefMode();
  var headTitle = refMode ? '<b>'+todoEsc(TODO_FILTERS[TODO_UI.kind].label)+' '+n+'（参考）</b> <span onclick="todoSetKind(\'\')" title="回到待办" style="cursor:pointer;">✕</span>' : '<b>待办 '+n+'</b>'+tag; /* CMD-1015-08：参考名单标题「今天来访 4（参考）✕」 */
  return '<div class="todo-box'+(refMode?' is-refmode':'')+'"'+boxStyle+'><div class="todo-head">'+headTitle+
    '<span class="todo-seg"><span class="'+(TODO_UI.mine?'':'on')+'" onclick="todoSetMine(false)">全部</span><span class="'+(TODO_UI.mine?'on':'')+'" onclick="todoSetMine(true)">只看我的</span></span>'+
    '<span class="todo-fold" onclick="todoToggle()" title="收起">⟩</span></div>'+
    ((TODO_UI.kind && !tag) ? '<div class="todo-filter">筛选：'+todoEsc(TODO_KIND_LABEL[TODO_UI.kind]||TODO_UI.kind)+' <span onclick="todoSetKind(\'\')" style="cursor:pointer;">✕</span></div>' : '')+
    (vis.length ? '<div class="todo-row todo-headrow"><div>出现时间</div><div>阶段</div><div>进程</div><div>截止时间</div><div>状态</div><div>客人</div></div>' : '')+
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
    wrap = document.createElement('div'); wrap.id = 'cal-todo-wrap'; wrap.style.cssText = 'display:flex;gap:16px;align-items:'+(newCalOn() ? 'stretch' : 'flex-start')+';';
    calCard.parentNode.insertBefore(wrap, calCard); wrap.appendChild(calCard); calCard.style.flex = newCalOn() ? '2 1 0' : '1'; calCard.style.minWidth = '0'; /* CMD-1015-01：日历 : 待办 = 2 : 1 */
    var p = document.createElement('div'); p.id = 'todo-pane'; wrap.appendChild(p);
  }
  return document.getElementById('todo-pane');
}
function todoKrCalWrap(calHtml){
  var nc = newCalOn();
  return '<div id="cal-todo-wrap" style="display:flex;gap:16px;align-items:'+(nc ? 'stretch' : 'flex-start')+';"><div style="flex:'+(nc ? '2 1 0' : '1')+';min-width:0;">'+calHtml+'</div><div id="todo-pane"'+(nc ? ' style="flex:'+(TODO_UI.collapsed ? '0 0 auto' : '1 1 0')+';min-width:0;"' : '')+'>'+todoPaneHtml(todoItems())+'</div></div>';
}

/* ---------------- 卡片 ---------------- */
function todoCardHtml(label, count, tip, onclick, warn, dot, sub){
  return '<div class="card" data-n="'+count+'"'+(warn?' data-warn="1"':'')+' onclick="'+onclick+'" title="'+todoEsc(tip)+'" style="position:relative;padding:14px 16px;cursor:pointer;min-width:0;'+(warn?'border-color:#E8A8A0;':'')+'">'+(dot ? '<span title="有新进来的项目" style="position:absolute;top:10px;right:10px;width:10px;height:10px;border-radius:50%;background:#E5484D;"></span>' : '')+
    '<div style="font-size:12px;color:var(--slate2);">'+label+'</div>'+
    '<div class="ds-cnum" style="font-size:28px;font-weight:700;margin:4px 0;color:'+(warn?'#B2453A':'var(--navy)')+';">'+count+'</div>'+
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
/* 10/14：4 张卡 = 待办 4 类；数字 = 点下去待办栏筛出来的条数（跟着［只看我的］），红点 = 这一类有新进来的 */
function todoCatCardsHtml(all, defs, noWrap){
  var vis = all.filter(function(it){ return !TODO_UI.mine || it.mine; }), kr = todoIsKr(), names = {};
  if(kr) krClinics().forEach(function(cl){ names[cl.id] = cl.name; });
  var inner = defs.map(function(d){
    var list = vis.filter(function(it){ return it.cat===d[0]; }), warn = list.some(function(it){ return it.over; }) && d[0]!=='msg';
    var sub = '';
    if(kr && list.length){ var per = {}; list.forEach(function(it){ var cid = (it.rowKey||'').split(':')[0]; if(cid) per[cid] = (per[cid]||0) + 1; }); sub = Object.keys(per).map(function(cid){ return '<span style="margin-right:10px;">'+todoEsc(names[cid]||cid)+' <b>'+per[cid]+'</b></span>'; }).join(''); }
    var dot = todoCardDot(d[0], list.map(function(it){ return it.cat+'|'+it.kind+'|'+it.no+'|'+it.text; }));
    return todoCardHtml(d[1], list.length, d[2], 'todoCardFilter(\''+d[0]+'\')', warn, dot, sub);
  }).join('');
  return noWrap ? inner : '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">'+inner+'</div>';
}
/* IN 四张：待我处理 / 今天来访 / 等 KR 回复 / 新消息（放在今日 OFF 下方，样式沿用 KR 卡片） */
function todoMountInCards(){
  var off = document.getElementById('dash-off-row'); if(!off) return null;
  var el = document.getElementById('in-cards');
  if(!el){ el = document.createElement('div'); el.id = 'in-cards'; el.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;'; off.parentNode.insertBefore(el, off.nextSibling); }
  return el;
}
function todoInCardsHtml(all){
  if(newCalOn()) return todoCatCardsHtml(all, [['todo','待我处理','要我现在动手的事（联络客人选项目、待收款、转告客人、确认日程…）'],['visit','今天来访','今天预约、还没接待的客人（一位一条；按了已到店 / 未到店就消失）'],['kr','等 KR 回复','等报告、等确认施术时间；没超时灰色，超时变红可催办'],['msg','新消息','未读的被 @、未接来电（看了就消失）']], true);
  var mine = all.filter(function(it){ return it.mine; });
  var today = todayStr(), vis = calendarEvents().filter(function(e){ return e.date===today && e.kind!=='placeholder' && e.vstate!=='预约取消'; });
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
  if(newCalOn()) return todoCatCardsHtml(todoItems(), [['todo','待我处理','要我现在处理的事（确认出报告时间、发送诊疗方案、确认施术时间、待付款、安排术后管理…）'],['today2','今天到院 / 到店','今天要来、还没按到院的施术和术后管理'],['waiting','等待报告','等院长上传面诊（超时变红）'],['msg','新消息','未读的被 @、未接来电（看了就消失）']]);
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
function todoKrToday(){ if(typeof KRC!=='undefined'){ KRC.mode = 'day'; KRC.anchor = krToday(); KRC.person = 'all'; KRC.layer = 'hospital'; krcRender(); } }

/* ---------------- 现在时间线 ---------------- */
function todoNowLabel(){ var d = demoNow(); return pad2(d.getHours())+':'+pad2(d.getMinutes()); }
function todoNowMinutes(){ var d = demoNow(); return d.getHours()*60 + d.getMinutes(); }
function todoPlaceInLine(){
  if(CAL_MODE==='day' && newCalOn()) return todoPlaceInDay();
  var grid = document.getElementById(CAL_MODE==='day' ? 'day-grid' : 'wk-grid'); if(!grid || (CAL_MODE!=='week' && !(CAL_MODE==='day' && newCalOn()))) return;
  var old = grid.querySelector('.todo-nowline'); if(old) old.remove();
  var wkDays = grid.querySelectorAll('.wk-head'); var today = todayStr(), has = false;
  /* 本周里有今天才画（日期列头 today 标记） */
  has = !!grid.querySelector('.wk-head.today'); if(!has) return;
  var nowMin = todoNowMinutes(), rows = grid.querySelectorAll('.wk-time'), hit = null, frac = 0;
  for(var i = 0; i < rows.length; i++){
    var m = /印\s*(\d{1,2}):(\d{2})/.exec(rows[i].textContent || '') || /^(\d{1,2}):(\d{2})/.exec((rows[i].firstChild && rows[i].firstChild.nodeValue) || ''); if(!m) continue; /* CMD-1014-19：时间前标了「印 / 韩」 */
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
/* 10/14：IN 日视图改成 KR 画法（#day-col 里按分钟定位），现在线直接按分钟算 */
function todoPlaceInDay(){
  var grid = document.getElementById('day-grid'), col = document.getElementById('day-col'); if(!grid || !col) return;
  var old = grid.querySelector('.todo-nowline'); if(old) old.remove();
  if(!grid.querySelector('.wk-head.today')) return;
  var H0 = parseInt(col.getAttribute('data-h0'),10), nowMin = todoNowMinutes(), H1 = H0 + col.offsetHeight*60/CAL_DAY_PX;
  if(nowMin < H0 || nowMin >= H1) return;
  var line = document.createElement('div'); line.className = 'todo-nowline'; line.style.top = (col.offsetTop + (nowMin-H0)*CAL_DAY_PX/60)+'px'; line.innerHTML = '<span>'+todoNowLabel()+'</span>'; grid.appendChild(line); todoScrollToNow(line);
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
  document.querySelectorAll('.krc-nowline').forEach(function(el, i){
    var m = todoNowMinutes(), top = (m - KRC_H0*60) * KRC_PX / 60;
    el.style.display = (m < KRC_H0*60 || m >= KRC_H1*60) ? 'none' : ''; el.style.top = top+'px'; el.innerHTML = i===0 ? '<span>'+todoNowLabel()+'</span>' : ''; /* CMD-1014-18：一条线横贯所有栏，只有第一栏写时间标签 */
  });
}
function todoNowLineHtml(){ /* kr.js 的 krcGridHtml 在今天那一列里调用 */
  var m = todoNowMinutes(); if(m < KRC_H0*60 || m >= KRC_H1*60) return '';
  return '<div class="krc-nowline todo-nowline" style="top:'+((m - KRC_H0*60) * KRC_PX / 60)+'px;"><span>'+todoNowLabel()+'</span></div>';
}

/* ---------------- 刷新 / 入口 ---------------- */
function todoRefresh(){
  try{
    var all = todoItems(), p = document.getElementById('todo-pane');
    if(todoIsKr()){ if(p){ p.innerHTML = todoPaneHtml(all); if(newCalOn()) p.style.cssText = 'flex:'+(TODO_UI.collapsed ? '0 0 auto' : '1 1 0')+';min-width:0;'; } return; }
    p = todoMountIn(); if(p){ p.innerHTML = todoPaneHtml(all); if(newCalOn()) p.style.cssText = 'flex:'+(TODO_UI.collapsed ? '0 0 auto' : '1 1 0')+';min-width:0;'; }
    var cards = todoMountInCards(); if(cards) cards.innerHTML = todoInCardsHtml(all);
  }catch(e){ console.error('[待办刷新]', e); }
}
/* renderCalendar() 末尾调用：日历重画后补上待办栏 + 现在时间线 */
function todoAfterCalendar(){
  if(todoIsKr()) return;
  try{ todoRefresh(); if(CAL_MODE==='day' && !newCalOn()) todoDayDivider(); else todoPlaceInLine(); }catch(e){ console.error('[待办日历]', e); }
}
function todoTick(){
  try{
    if(todoIsKr()){ todoKrNowTick(); if(document.getElementById('todo-pane') && !document.querySelector('.modal-overlay.open')) todoRefresh(); return; }
    if(CURRENT_PAGE_ID!=='in-dashboard') return;
    todoRefresh();
    var line = document.querySelector('.todo-nowline');
    if(CAL_MODE==='week' || (CAL_MODE==='day' && newCalOn())) todoPlaceInLine(); else if(CAL_MODE==='day') todoDayDivider();
  }catch(e){}
}
setInterval(todoTick, 30000);
setInterval(function(){ try{ if(document.getElementById('todo-pane') && !document.hidden) todoRefresh(); }catch(e){} }, 5000);
/* IN 启动：默认打开日视图 */
function todoInBoot(){ if(todoIsKr()) return; try{ if(typeof setCalMode==='function') setCalMode('day'); }catch(e){ console.error('[默认日视图]', e); } }
/* KR：默认日视图（全部院长） */
(function(){ try{ if(typeof KRC!=='undefined'){ KRC.mode = 'day'; KRC.person = 'all'; } }catch(e){} })();

/* ---------------- 转告客人：打开该案件的赴韩施术 tab 即视为已看到 ---------------- */
(function(){
  if(typeof renderCaseBody!=='function') return;
  var base = renderCaseBody;
  renderCaseBody = function(c){
    base.apply(this, arguments);
    try{ if(!newCalOn() && !todoIsKr() && c && c.activeCaseTab==='kr' && scheduleState(c)==='Confirmed' && c.krSchedule){ var key = c.krSchedule.confirmedDate+' '+c.krSchedule.confirmedTime; if(c.relayTold!==key){ c.relayTold = key; Store.touch(); } } }catch(e){}
  };
})();

/* ---------------- 弹出提示分类（CMD-1013-17 四） ---------------- */
/* 'stay' 被 @ / 未接来电：弹出并停留；'todo' 新待办：弹一次自动收起；'msg' 消息：不弹，只进铃铛 */
function notifTodoKind(n){
  var tx = String(n.text||''), kd = n.kind||'';
  if(kd==='mention' || kd==='missedcall' || /@ 了你|未接来电/.test(tx)) return 'stay';
  if(n.popup==='confirm') return 'confirm'; /* CMD-1015-09：设定更新（IN-23 / KR-14）弹出并停留、手动确认（不是紧急，没有彩色图标） */
  if(n.popup==='once') return 'todo'; /* 今天的自助预约（IN-15 / IN-16）：弹一次、几秒后自动收起 */
  if(/诊疗方案已到|等待报告超过|无法安排|预约占位快过期|KR 确认(新)?施术时间|待收款|催办|已缴面诊费|面诊费已免除|需要处理|施术日期待确认|改期待确认|在韩加项/.test(tx) || kd==='urge' || kd==='consultpaid') return 'todo';
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

/* CMD-1015-05 九：不管从哪里打开案件（待办、案件列表、日历），打开后这个案件的新待办红点就灭 */
(function(){
  if(typeof openCaseDetail==='function'){ var o1 = openCaseDetail; openCaseDetail = function(id){ var r = o1.apply(this, arguments); try{ todoMarkCaseSeen(id); }catch(e){} return r; }; }
  if(typeof krShowCase==='function'){ var o2 = krShowCase; krShowCase = function(cl, id){ var r = o2.apply(this, arguments); try{ todoMarkCaseSeen(id); }catch(e){} return r; }; }
})();
