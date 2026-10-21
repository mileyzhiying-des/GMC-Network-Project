/* ================= CMD-1013-17 待办 / 通知调整（10/15 正式采用）=================
   规则：Notification Center 顶部「🧪 2026-10-13 待办 / 通知调整」、IN-DASH-01 / KR-DASH-01 同名节。
   原则：现有工作台 / 日历 / 通知中心的版面样式一律不动，这里只新增。
   内容：① 待办栏（IN / KR 工作台日历右边，可收起，分已超时 / 今天 / 之后，做完由案件状态算出自动消失）
        ② 默认日视图 + 日 / 周视图「现在时间线」（每分钟移动，打开时滚到画面上方约 1/3）
        ③ KR 卡片 8 → 4、IN 加同样 4 张  ④ 弹出提示：待办弹一次自动收起，消息不弹，被 @ / 未接来电停留
        ⑤ 催办门槛、KR 结案弹窗「未完成的 N 项会转入在韩持有」（后两项的判断在 data.js / kr.js 里按开关分支，这里放辅助函数）。 */

var TODO_UI = {collapsed:false, mine:false, kind:'', tab:'todo'};
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
  eta:'todo', send:'todo', urged:'todo', sched:'todo', change:'todo', pcb:'todo', dayconf:'todo', upload:'dconsult', dsurg:'dsurg', dirop:'todo', today:'today2', waitdir:'waiting', stay:'msg'};
/* CMD-1015-05 九：第一栏「阶段｜待办事项」——阶段读案件的阶段（同案件列表），没有案件的按类型 */
var TODO_STAGE_BY_KIND = {tripend:'术后管理', inclose:'术后管理', dirop:'术后管理', bkconf:'预约', rebook:'预约', visit:'预约', ph:'预约', pcdue:'术后管理', subbook:'术后管理', pcb:'术后管理', stay:'消息', eta:'面诊', waitdir:'面诊', upload:'面诊', dsurg:'赴韩施术', send:'面诊', plan:'项目确认'};
function todoStageOf(kind, c){ if(TODO_STAGE_BY_KIND[kind]) return TODO_STAGE_BY_KIND[kind]; try{ if(c) return caseStageInfo(c).stage || ''; }catch(e){} return ''; }
/* 红点：新进来的待办亮红点，打开那个案件后灭（每个账号各自记；第一次打开先把现有的都当已看过） */
function todoSeenKey(){ var id = ''; try{ id = currentAccountId() || ''; }catch(e){} return 'gmc_cfg_todoseen_'+id; }
var TODO_SEEN_SET = null;
function todoSeenLoad(){ if(TODO_SEEN_SET) return TODO_SEEN_SET; TODO_SEEN_SET = {}; try{ var raw = localStorage.getItem(todoSeenKey()); if(raw) TODO_SEEN_SET = JSON.parse(raw); else TODO_SEEN_SET = {__init:1}; }catch(e){} return TODO_SEEN_SET; }
function todoSeenSave(){ try{ localStorage.setItem(todoSeenKey(), JSON.stringify(TODO_SEEN_SET)); }catch(e){} }
function todoSeenBaseline(items){ var s = todoSeenLoad(); if(s.__init){ delete s.__init; items.forEach(function(it){ s[it.key] = 1; }); todoSeenSave(); } }
function todoIsNew(it){ var s = todoSeenLoad(); return !s[it.key] || (!!it.over && !s[it.key+'|over']); } /* CMD-1020-12：新的、或已逾期（逾期那一刻算新的）都亮红点，打开案件后消失 */
function todoTabDot(vis){ return (vis||[]).some(todoIsNew); }
function todoMarkCaseSeen(caseId){ if(!caseId) return; var s = todoSeenLoad(), ch = false; Object.keys(s).forEach(function(){}); (TODO_LAST||[]).forEach(function(it){ if(it.caseId===caseId && (!s[it.key] || (it.over && !s[it.key+'|over']))){ s[it.key] = 1; if(it.over) s[it.key+'|over'] = 1; ch = true; } }); if(ch){ todoSeenSave(); try{ todoRefresh(); }catch(e){} } }
var TODO_LAST = [], TODO_ACT_CASE = [];
function todayShift(n){ return ymdAdd(todayStr(), n); }
function todoMk(kind, text, c, due, over, go, extra){
  return Object.assign({kind:kind, stage:todoStageOf(kind, c), key:kind+'|'+(c ? c.id : '')+'|'+(c ? '' : String(text).replace(/（已超时）/g, '')), cat:TODO_CAT[kind]||'todo', text:text, name:c ? c.name : '', no:c ? (c.caseNo||'') : '', caseId:c ? c.id : '', due:due||'', over:!!over, pin:false, mine:true, go:go||null}, extra||{});
}
function todoInGo(c, tab){ return function(){ openCaseDetail(c.id, false, {tab:tab}); }; }
function todoInMine(c){ try{ return caseOperators(c, true).inn.indexOf(ME_NAME)>-1; }catch(e){ return true; } }
function todoEtaDue(c){ return c.reportEta ? fmtUtc(c.reportEta) : ''; }
function todoCloseMinusHour(){ var m = timeToMin(CLINIC_SETTINGS.closeTime||'21:00') - 60; return m; }

/* IN-08：待收款点了去哪——面诊费 → 面诊资料；待付款结算单 → 它所在的 tab（有赴韩项目 = 赴韩施术计划，只有本地项目 = 本地管理）并滚到那张结算单 */
function todoPayGo(c, b){
  if(/面诊费/.test(b)) return todoInGo(c, 'consult');
  var m = /批次 ([^）)]+)/.exec(b), bid = m ? m[1] : '', bt = (c.settlementBatches||[]).filter(function(x){ return x.id===bid; })[0];
  var hasKr = bt ? krAllItems(c).some(function(it){ return it.batchId===bid; }) : false;
  return function(){ openCaseDetail(c.id, false, {tab:(hasKr ? 'kr' : (bt ? 'localmgmt' : 'settle')), scroll:'settle-card-'+bid}); };
}
function inTodoItems(){
  var out = [], now = nowDateObj(), today = todayStr(), nowMin = demoNow().getHours()*60 + demoNow().getMinutes();
  CASE_ITEMS.forEach(function(c){
    if(c.subState==='cancelled' || c.visitClosed || isEnded(c)) return;
    var mine = todoInMine(c), push = function(it){ it.mine = mine; out.push(it); };
    /* CMD-1021-16：术后管理（印尼）阶段：印尼的来访都做完、没有未来预约 → 第二天早上问「是否结案？」，每天问到确认 */
    if(inCloseDue(c)) push(todoMk('inclose', '术后管理（印尼）是否结案？', c, '', false, function(){ openCaseDetail(c.id); setTimeout(function(){ try{ inCloseOpen(); }catch(e){} }, 250); }));
    /* 诊疗方案已到 → 联络客人选项目 */
    if(c.reportReady && c.projectsEnabled && c.consultStatus==='report_ready' && !c.endNote && !(c.settlementBatches||[]).length && !(c.recommended||[]).length && !c.localMgmt)
      push(todoMk('plan', '面诊资料已到：联络客人选项目', c, '', false, todoInGo(c, 'consult'))); /* CMD-1020-13 二：待办写「面诊资料已到」，点开进「面诊资料」tab（诊疗方案在那里看；选项目在赴韩施术 tab） */
    /* 等待报告超时 / 待确认施术时间超时 → 可催办 */
    var ug = urgeInfo(c);
    /* 10/14：今天来访（预约还没接待，一位一条）+ 等 KR 回复（没超时灰色，超时红 + ［催办］） */

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
    
    /* KR 无法安排 → 重选日期 */
    var ks = c.krSchedule;
    if(ks && !ks.status && ks.rejectNote && c.settlementDone && krActiveItems(c).length)
      push(todoMk('resched', 'KR 无法安排所选日期：重选施术日期', c, '', false, todoInGo(c, 'kr')));
    /* KR 已确认施术时间 → 转告客人（打开该案件的赴韩施术 tab 即视为已看到，见 todoMarkRelay） */
    if(scheduleState(c)==='Confirmed' && ks && !surgMsgSent(c)){ /* CMD-1019-16：没通知过 =［发送给客人］；通知过之后 KR 又改了 = 电话通知客人时间变更（不重发） */
      var gotoRow = function(){ openCaseDetail(c.id, false, {tab:'kr', scroll:'surg-send-row'}); };
      if(surgChanged(c)) push(todoMk('relay', '电话通知客人时间变更：'+surgChangeText(c), c, ks.confirmedDate, false, gotoRow));
      else push(todoMk('relay', 'KR 已确认施术时间：发送给客人（'+ks.confirmedDate+' '+ks.confirmedTime+'）', c, ks.confirmedDate, false, gotoRow));
    }
    /* 确认客人日程有无变化：赴韩施术前 2 天出现（CMD-1014-01 二·3） */
    if(calNeedsRecheck(c)) push(todoMk('recheck', '施术前 2 天：联络客人确认行程（施术 '+ks.confirmedDate+'）', c, ks.confirmedDate, calDaysToSurgery(c)<=0, function(){ openCaseDetail(c.id, false, {tab:'kr', scroll:'surg-remind-row'}); }));
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
  /* 术后管理过了建议日期（CMD-1015-17）：留在原案件里，IN 待办「联络客人」，点了去案件的术后管理区块（IN-11） */
  try{ postcareDueList().forEach(function(x){ out.push(todoMk('pcdue', '联络客人：术后管理已过建议日期 '+x.late+' 天（'+x.s.content+'）', x.c, x.s.date, true, function(){ openCaseDetail(x.c.id, false, {pc:true}); })); }); }catch(e){}
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
    var goCase = function(tab){ return function(){ krShowCase(r.clinicId, r.id, {tab:tab}); }; };
    if(work){
      if(c.consultStatus==='paid_waiting_kr') push(todoMk('eta', '确认预计出报告时间'+(c.wantConsult ? '（客人希望：'+c.wantConsult+'）' : ''), c, '', false, goCase('consult')));
      if(c.consultStatus==='awaiting_report' && !c.consultContentAt){ var wo = reportOverdueNow(c); push(todoMk('waitdir', '等院长上传面诊'+(wo ? '（已超时）' : (c.consultStartedAt ? '（面诊中）' : '')), c, todoEtaDue(c), wo, goCase('consult'), {gray:!wo})); }
      if(c.consultStatus==='awaiting_report' && c.consultContentAt){ var over = reportOverdueNow(c); push(todoMk('send', '发送诊疗方案'+(over ? '（已超时）' : ''), c, todoEtaDue(c), over, goCase('consult'))); }
      if(c.urgedAt && ((c.consultStatus==='awaiting_report' && !c.reportReady) || c.consultStatus==='paid_waiting_kr' || scheduleState(c)==='Pending')) push(todoMk('urged', '被催办：请尽快处理', c, '', true, goCase(scheduleState(c)==='Pending' ? 'proc' : 'consult'), {pin:true}));
      if(c.stage==='travel' && scheduleState(c)==='Pending') push(todoMk('sched', '确认施术时间', c, (c.krSchedule||{}).primary||'', false, goCase('proc')));
      if(c.stage==='travel' && scheduleState(c)==='Changing') push(todoMk('change', '改期待确认', c, (c.krSchedule||{}).changePrimary||'', false, goCase('proc')));
      var pp = pendingPayItems(c); if(pp.length) push(todoMk('pay', '在韩加项待付款：'+pp.map(function(i){ return buyName(i.name); }).join('、'), c, '', false, goCase('proc')));
      if(c.krBalancePaid && !c.pcBooked && krActiveItems(c).some(function(it){ return (it.postcare||[]).length; })) push(todoMk('pcb', '安排术后管理', c, '', false, function(){ krShowCase(r.clinicId, r.id, {tab:'items', page:'care'}); })); /* CMD-1015-31：直接到项目卡术后管理分页，用［预约时间］约 */
    }
    if(work){ (c.subItems||[]).forEach(function(s){ if(s.kind==='术后管理记录' && s.place==='IN' && !s.done && !s.holdUseOf && !c.visitClosed && pcDaysLate(s.date)>0) push(todoMk('pcdue', '联络 IN 确认客人行程：术后管理已过建议日期 '+pcDaysLate(s.date)+' 天（'+s.content+'）', c, s.date, true, goCase('proc'))); }); } /* CMD-1015-17 */
    /* 院长：上传面诊内容（面诊已安排、院长还没上传） */
    if(isDir && c.consultStatus==='awaiting_report' && !c.consultContentAt) push(todoMk('upload', '上传面诊内容', c, todoEtaDue(c), reportOverdueNow(c), goCase('consult')));
    /* CMD-1015-15：院长「待施术」——自己负责的全部已确认（含已到院）施术，只当参考名单（点卡片才显示），按今天 / 之后分组 */
    if(isDir && me && r.director===me.name && c.krSchedule && ['confirmed','arrived'].indexOf(c.krSchedule.status)>-1 && c.krSchedule.confirmedDate && !c.visitClosed && !isEnded(c))
      push(todoMk('dsurg', '施术：'+krActiveItems(c).filter(function(i){ return !krIsMgmtItemC(i); }).map(function(i){ return i.name; }).join('、'), c, c.krSchedule.confirmedDate+' '+(c.krSchedule.confirmedTime||''), false, function(){ krOpenSubCard(r.clinicId, r.id); }));
    /* CMD-1020-05：院长操作的术后管理 / 管理项目到院 → 院长工作台今日提醒「11:00 客人 · ONDA 提升（院长操作）」 */
    if(isDir && me && !c.visitClosed) visitCalBlocks(c).forEach(function(v){ if(v.hasDirOp && v.director===me.name && v.date===today && !v.done) push(todoMk('dirop', '院长操作：'+v.dirNames.map(buyName).join('、'), c, v.date+' '+v.time, false, function(){ krOpenSubCard(r.clinicId, r.id, v.firstId); })); });
    /* CMD-1019-22 七：到院结束是人工确认——营业结束后没结束的不自动结束，第二天变待办「昨天的到院未结束」 */
    if(work && !c.visitClosed){
      var mvd = c.hasArrived && !c.krProcedureDone ? mainVisitDay(c) : '';
      if(mvd && mvd < today) push(todoMk('endvisit', (mvd===todayShift(-1) ? '昨天' : mvd.slice(5).replace('-', '/')+' ')+'的到院还没标客人已离院：确认是否已离院', c, mvd, true, function(){ krOpenSubCard(r.clinicId, r.id); }));
      subCaseList(c).forEach(function(rp){ var kk = subCaseKey(rp); if(rp.place==='KR' && rp.date && rp.date < today && coreVisitState(c, kk)==='arrived') push(todoMk('endvisit', (rp.date===todayShift(-1) ? '昨天' : rp.date.slice(5).replace('-', '/')+' ')+'的到院还没标客人已离院：确认是否已离院', c, rp.date, true, function(){ krOpenSubCard(r.clinicId, r.id, rp.id); }, {no:subCaseNo(c, rp)||c.caseNo})); });
    }
    /* CMD-1021-16：每天早上问「韩国行程是否结束？」（到院都做完、没有未来预约；暂不结束 → 第二天再问；离境日过了照样问） */
    if(work && tripAskDue(c)) push(todoMk('tripend', '韩国行程是否结束？', c, tripLastVisitDay(c), false, function(){ krShowCase(r.clinicId, r.id, {tab:'items'}); setTimeout(function(){ try{ krTripOpen(); }catch(e){} }, 250); }));
    /* 今天到院（院长账号看自己的案件） */
    var ks = c.krSchedule;
    if(ks && ['confirmed','arrived'].indexOf(ks.status)>-1 && ks.confirmedDate===today && !c.visitClosed)
      push(todoMk('today', todoNotArrivedOver(today, ks.confirmedTime, ks.status==='arrived') ? '客人还没到：联络 IN 确认行程' : '今天到院：施术', c, today+' '+(ks.confirmedTime||''), todoNotArrivedOver(today, ks.confirmedTime, ks.status==='arrived'), function(){ krOpenSubCard(r.clinicId, r.id); }, {no:(krSurgSub(c) ? subCaseNo(c, krSurgSub(c)) : '') || c.caseNo}));
    krTodayVisits(c).forEach(function(s){ push(todoMk('today', todoNotArrivedOver(today, s.time, !!s.arrived) ? '客人还没到：联络 IN 确认行程' : '今天到店：'+(s.content||'术后管理'), c, today+' '+(s.time||''), todoNotArrivedOver(today, s.time, !!s.arrived), function(){ krOpenSubCard(r.clinicId, r.id, s.id); }, {no:subCaseNo(c, s) || c.caseNo})); });
  });
  /* CMD-1014-16：IN 在 KR 日程占位的预约 → 确认预约时间；确认后的预约今天到店 */
  try{ var hidB = krHospitalIdOfMe(), meB = currentAccount(); (krbList(hidB)||[]).forEach(function(b){
    var cn = ((clinicById(b.clinicId)||{}).name)||'';
    if(work && b.status==='pending') out.push(todoMk('bkconf', '确认预约时间（'+krbPurposeFull(b)+'）· '+cn, null, b.date+' '+b.time, false, function(){ krBookOpen(b.id); }, {name:b.clientName, no:'', mine:true, rowKey:b.clinicId+':'}));
    if(b.status==='confirmed' && b.date===today && (work || (isKrDirectorLike(meB) && b.director===meB.name))) out.push(todoMk('today', todoNotArrivedOver(b.date, b.time, !!b.arrivedAt) ? '客人还没到：联络 IN 确认行程' : '今天到店：预约 · '+krbPurposeFull(b), null, b.date+' '+b.time, todoNotArrivedOver(b.date, b.time, !!b.arrivedAt), function(){ krBookOpen(b.id); }, {name:b.clientName, no:'', mine:true, rowKey:b.clinicId+':'}));
  }); }catch(e){}
  try{ krNotifUnread().forEach(function(n){ if(n.kind==='mention' || n.kind==='missedcall' || /@ 了你|未接来电/.test(n.text||'')) out.push(todoMk('stay', tzRender(n.text), null, '', false, function(){ krOpenNotif(n.id); })); }); }catch(e){}
  return out;
}

/* CMD-1015-08：过了到院时间还没标到 = 超时（待办）；已到的不算 */
function todoNotArrivedOver(ds, tm, arrived){ return !arrived && !!tm && todoNowStr() >= ds+' '+tm; }
/* 待办 = 现在需要我动手做的事：状态「等待中 / 待接待」（没超时的 visit / kr / waiting / today2 类）不进待办栏，只在点卡片时当灰色参考名单显示（it.ref） */
var TODO_REF_CATS = ['visit', 'kr', 'waiting', 'today2', 'dsurg'];
function todoGoPlaceholder(p){ try{ nav('in-dashboard'); if(typeof setCalView==='function' && CAL_VIEW!=='in') setCalView('in'); DAY_OFFSET = Math.round((new Date(p.date+'T00:00:00') - new Date(todayStr()+'T00:00:00'))/86400000); setCalMode('day'); renderCalendar(); }catch(e){ console.error('[占位跳转]', e); } }
function todoItems(){
  var items;
  try{ items = todoIsKr() ? krTodoItems(krAllCases()) : inTodoItems(); }catch(e){ console.error('[待办]', e); items = []; }

    if(todoIsKr() && krIsDirector()) items = items.filter(function(it){ return it.kind!=='today'; }); /* 院长：今天到院不进待办（看日历） */
    items.forEach(function(it){ it.ref = TODO_REF_CATS.indexOf(it.cat)>-1 && !it.over; });
  
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
function todoShownAt(it){ if(it.cat==='dsurg') return it.due || it.at || ''; return (it.over && it.due && it.due <= todoNowStr()) ? it.due : (it.at || ''); } /* 截止时间已过才改用截止时间；超时但「截止」是将来的日期（如施术日期）时仍用出现时间 */
function todoFmtTime(s){ if(!s) return '—'; var d = s.slice(0,10), hm = s.length>=16 ? s.slice(11,16) : ''; if(d===todayStr()) return hm || '今天'; return s.slice(5,10)+(hm ? ' '+hm : ''); }
/* CMD-1020-14 三：时间栏窄，日期和钟点上下两行（今天只写钟点），每行不换行 */
function todoFmtTimeHtml(s){ if(!s) return '—'; var d = s.slice(0,10), hm = s.length>=16 ? s.slice(11,16) : ''; if(d===todayStr()) return todoEsc(hm || '今天'); return '<span class="tt-d">'+todoEsc(s.slice(5,10))+'</span>'+(hm ? '<span class="tt-t">'+todoEsc(hm)+'</span>' : ''); }
function todoGroupOf(it){ var d = (todoShownAt(it)||'').slice(0,10) || todayStr(); if(it.cat==='dsurg') return d > todayStr() ? 2 : (d < todayStr() ? 0 : 1); return d < todayStr() ? 0 : 1; } /* CMD-1015-08：只留 昨日及更早 / 今天 */
function todoSort(a, b){ return (b.pin?1:0)-(a.pin?1:0) || ((b.over?1:0)-(a.over?1:0)) || (todoShownAt(a)||'9999').localeCompare(todoShownAt(b)||'9999'); }
/* CMD-1014-01 二·1：点卡片 = 筛选待办栏（标题后出现「· 待我处理 ✕」，✕ 回到全部）；开关关闭时仍是 10/13 的 kind 相等判断 */
var TODO_FILTERS = {
  todo:   {label:'待我处理', fn:function(it){ return todoIsKr() ? it.kind!=='today' : true; }},
  visit:  {label:'今天来访', fn:function(it){ return (it.due||'').slice(0,10)===todayStr(); }},
  kr:     {label:'等 KR 回复', fn:function(it){ return ['urge','resched','relay','recheck'].indexOf(it.kind)>-1; }},
  today2: {label:'今天到院', fn:function(it){ return it.kind==='today'; }},
  dconsult:{label:'待面诊', fn:function(it){ return it.kind==='upload'; }},
  dsurg:  {label:'待施术', fn:function(it){ return it.kind==='dsurg'; }},
  waiting:{label:'等待报告', fn:function(it){ return ['eta','send','urged','waitdir','upload'].indexOf(it.kind)>-1; }},
  msg:    {label:'新消息', fn:function(it){ return it.kind==='stay'; }}
};
function todoKindOk(it){
  if(!TODO_UI.kind) return true;
  if(TODO_FILTERS[TODO_UI.kind]) return it.cat===TODO_UI.kind;
  return it.kind===TODO_UI.kind;
}
function todoRefMode(){ return TODO_REF_CATS.indexOf(TODO_UI.kind)>-1; } /* 点了「今天来访 / 等 KR 回复 / 今天到院 / 等待报告」卡：待办栏改显示那份名单（灰色参考） */
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
  if(it.kind==='pay') return {t:'待付款', cls:'todo'}; /* CMD-1021-09：KR 待办「在韩加项待付款」状态写待付款 */
  if(it.cat==='visit') return {t:'待接待', cls:'recv'};
  if(it.cat==='today2') return {t:'未到', cls:'wait'}; /* CMD-1015-08：今天到院还没到（只在参考名单里出现） */
  if(it.gray || it.cat==='kr' || it.cat==='waiting') return {t:'等待中', cls:'wait'};
  return {t:'待处理', cls:'todo'};
}
function todoRowHtml(it){
  var i = TODO_ACTS.push(it.go) - 1, st = todoStatusOf(it); TODO_ACT_CASE[i] = it.caseId||'';
  var urgeBtn = it.urge ? '<button class="btn-primary todo-urge" onclick="event.stopPropagation();todoUrge(\''+it.caseId+'\')">'+((calCaseById(it.caseId)||{}).urgedAt ? '再次催办' : '催办')+'</button>' : '';
  var proc = String(it.text||'').replace(/（已超时）|\(已超时\)/g, '').trim();
  return '<div class="todo-row'+(it.pin?' pin':'')+(it.over?' is-over':'')+((it.ref || (todoRefMode() && !it.over))?' is-ref':'')+'" '+(it.go ? 'onclick="todoGo('+i+')" style="cursor:pointer;"' : '')+'>'+
    '<div class="todo-at">'+(todoIsNew(it) ? '<span class="todo-newdot" title="新的待办"></span>' : '')+todoFmtTimeHtml(todoShownAt(it))+'</div>'+
    '<div class="todo-stage" title="'+todoEsc(it.stage||'')+'">'+(it.pin?'📌 ':'')+todoEsc(it.stage||'—')+'</div>'+
    '<div class="todo-text" title="'+todoEsc(proc)+'">'+todoEsc(proc)+'</div>'+
    '<div class="todo-due'+(it.over?' over':'')+'">'+(it.due ? todoFmtTimeHtml(it.due) : '—')+'</div>'+
    '<div class="todo-st '+st.cls+'">'+st.t+urgeBtn+'</div>'+
    '<div class="todo-who">'+(it.name ? '<b>'+todoEsc(it.name)+'</b>' : '<span style="color:var(--muted);">—</span>')+(it.no ? '<span>'+todoEsc(it.no)+'</span>' : '')+'</div></div>';
}
function todoGo(i){ var f = TODO_ACTS[i]; try{ var cid = (TODO_ACT_CASE||{})[i]; if(cid) todoMarkCaseSeen(cid); }catch(e){} if(f) try{ f(); }catch(e){ console.error('[待办跳转]', e); } }
function todoPaneHtml(all){
  TODO_ACTS = []; TODO_ACT_CASE = []; TODO_LAST = all; todoSeenBaseline(all); todoStampAt(all);
  var vis = todoVisible(all), n = vis.length;
  var ubAll = []; try{ ubAll = todoUbItems(); }catch(e){ console.error('[未安排预约]', e); } var ubVis = ubAll.filter(function(it){ return !TODO_UI.mine || it.mine; }), ubTab = TODO_UI.tab==='unbooked' && !todoRefMode();
  if(TODO_UI.collapsed) return '<button class="btn-outline todo-mini" onclick="todoToggle()">待办 '+n+((todoUbDot(ubAll) || todoTabDot(vis)) ? ' <span class="todo-newdot"></span>' : '')+'</button>';
  var boxStyle = ' style="width:auto;"';
  var groups = [[0,'昨日及更早'],[1,'今天'],[2,'之后']];
  var body = groups.map(function(g){
    var list = vis.filter(function(it){ return todoGroupOf(it)===g[0]; }).sort(todoSort);
    if(!list.length) return '';
    return '<div class="todo-group">'+g[1]+' <span>'+list.length+'</span></div>'+list.map(todoRowHtml).join('');
  }).join('') || '<div class="todo-empty">'+(refMode ? '这类名单现在是空的' : '现在没有待办')+'</div>';
  var tag = (TODO_UI.kind && TODO_FILTERS[TODO_UI.kind]) ? '<span class="todo-tag">· '+todoEsc(TODO_FILTERS[TODO_UI.kind].label)+' <span onclick="todoSetKind(\'\')" style="cursor:pointer;">✕</span></span>' : '';
  var refMode = todoRefMode();
  /* CMD-1020-07：标题行两个并排分页「待办 N ｜ 未安排预约 N」，默认待办；数字一直显示，红点只在有新进来的或已逾期的未安排项目时亮 */
  var tabs = '<span class="todo-tabs"><span class="todo-tab'+(ubTab ? '' : ' on')+'" onclick="todoSetTab(\'todo\')">待办 '+n+(todoTabDot(vis) ? '<span class="todo-newdot" title="有新的或已逾期的待办"></span>' : '')+'</span><span class="todo-tab'+(ubTab ? ' on' : '')+'" onclick="todoSetTab(\'unbooked\')">未安排预约 '+todoUbCount(ubVis)+(todoUbDot(ubAll) ? '<span class="todo-newdot" title="有新的或已逾期的"></span>' : '')+'</span></span>';
  var headTitle = refMode ? '<b>'+todoEsc(TODO_FILTERS[TODO_UI.kind].label)+' '+n+'（参考）</b> <span onclick="todoSetKind(\'\')" title="回到待办" style="cursor:pointer;">✕</span>' : tabs+(ubTab ? '' : tag); /* CMD-1015-08：参考名单标题「今天来访 4（参考）✕」 */
  var inner = ubTab ? todoUbListHtml(ubVis) : ((TODO_UI.kind && !tag) ? '<div class="todo-filter">筛选：'+todoEsc(TODO_KIND_LABEL[TODO_UI.kind]||TODO_UI.kind)+' <span onclick="todoSetKind(\'\')" style="cursor:pointer;">✕</span></div>' : '')+
    (vis.length ? '<div class="todo-row todo-headrow"><div>出现时间</div><div>阶段</div><div>进程</div><div>截止时间</div><div>状态</div><div>客人</div></div>' : '')+'<div class="todo-list">'+body+'</div>';
  return '<div class="todo-box'+(refMode?' is-refmode':'')+'"'+boxStyle+'><div class="todo-head">'+headTitle+
    '<span class="todo-seg"><span class="'+(TODO_UI.mine?'':'on')+'" onclick="todoSetMine(false)">全部</span><span class="'+(TODO_UI.mine?'on':'')+'" onclick="todoSetMine(true)">只看我的</span></span>'+
    '<span class="todo-fold" onclick="todoToggle()" title="收起">⟩</span></div>'+inner+'</div>';
}
/* ================= CMD-1020-07：未安排预约（IN / KR）=================
   「该做但还没约时间」的项目，不进待办。每行：客人｜项目（灰字：对应施术 · 术后第 N 天 / 剩 N / 共 M 次）｜建议日期｜来源｜［预约］；按建议日期排，过了建议日期还没约 → 日期变红 */
function todoUbSeenKey(){ var id = ''; try{ id = currentAccountId() || ''; }catch(e){} return 'gmc_cfg_ubseen_'+id; }
function todoUbSeenLoad(){ var o = {}; try{ o = JSON.parse(localStorage.getItem(todoUbSeenKey())||'{}') || {}; }catch(e){} return o; }
function todoUbMark(it){ return it.key+(it.over ? '|over' : ''); }
function todoUbDot(items){ var seen = todoUbSeenLoad(); return items.some(function(it){ return !seen[todoUbMark(it)]; }); } /* 新进来的（没看过）或已逾期的（逾期那一刻算新的）亮红点 */
function todoUbSeenAll(){ var seen = todoUbSeenLoad(); (TODO_UB_LAST||[]).forEach(function(it){ seen[todoUbMark(it)] = 1; }); try{ localStorage.setItem(todoUbSeenKey(), JSON.stringify(seen)); }catch(e){} }
var TODO_UB_LAST = [];
function todoSetTab(t){ TODO_UI.tab = t==='unbooked' ? 'unbooked' : 'todo'; if(TODO_UI.tab==='unbooked') todoUbSeenAll(); todoSaveUi(); todoRefresh(); }
function todoUbMd(d){ return d ? String(d).slice(5).replace('-', '/') : '—'; }
var TODO_UB_OPEN = {};
function todoUbToggle(id){ TODO_UB_OPEN[id] = TODO_UB_OPEN[id]===false ? true : false; todoRefresh(); }
function todoUbCount(list){ return list.reduce(function(n, it){ return n+(it.n||1); }, 0); }
function todoUbListHtml(list){
  if(!todoIsKr()) return todoUbListInHtml(list);
  var rows = list.slice().sort(function(a, b){ return (a.sug||'9999').localeCompare(b.sug||'9999'); });
  var head = '<div class="ub-row ub-head"><div>客人</div><div>项目</div><div>建议日期</div><div>来源</div><div></div></div>';
  var body = rows.map(function(it){
    var i = TODO_ACTS.push(it.book) - 1; TODO_ACT_CASE[i] = it.caseId||'';
    return '<div class="ub-row" onclick="todoGo('+i+')"><div class="ub-who"><b>'+todoEsc(it.name)+'</b><span>'+todoEsc(it.no||'')+'</span></div><div class="ub-item">'+todoEsc(it.label)+(it.sub ? '<div style="font-size:12px;color:var(--muted);font-weight:400;">'+todoEsc(it.sub)+'</div>' : '')+'</div>'+
      '<div class="ub-sug'+(it.over ? ' over' : '')+'">'+todoUbMd(it.sug)+'</div><div class="ub-src">'+todoEsc(it.source)+'</div><div><button class="btn-outline" style="padding:3px 10px;font-size:12px;" onclick="event.stopPropagation();todoGo('+i+')">预约</button></div></div>';
  }).join('');
  return rows.length ? head+'<div class="todo-list">'+body+'</div>' : '<div class="todo-empty">现在没有未安排的预约</div>';
}
/* CMD-1020-18：IN 的未安排预约（只放 KR 交给印尼 / 只能在印尼做的术后管理）按客人（案件）折叠：标题「客人名（Case ID）｜未预约 N ……［全部预约］」，展开每行 施术名称｜术后管理项目｜次数｜建议时间｜操作地点｜［预约］ */
function todoUbListInHtml(list){
  if(!list.length) return '<div class="todo-empty">现在没有未安排的预约</div>';
  var order = [], by = {}; list.slice().sort(function(a, b){ return (a.sug||'9999').localeCompare(b.sug||'9999'); }).forEach(function(it){ if(!by[it.caseId]){ by[it.caseId] = []; order.push(it.caseId); } by[it.caseId].push(it); });
  return '<div class="todo-list">'+order.map(function(cid){
    var arr = by[cid], open = TODO_UB_OPEN[cid]!==false, anyOver = arr.some(function(x){ return x.over; });
    var head = '<div class="ub-grp" onclick="todoUbToggle(\''+cid+'\')"><span class="ub-arrow">'+(open ? '▾' : '▸')+'</span><b>'+todoEsc(arr[0].name)+'（'+todoEsc(arr[0].no||'')+'）</b><span class="ub-n'+(anyOver ? ' over' : '')+'">未预约 '+todoUbCount(arr)+'</span><span style="flex:1;"></span><button class="btn-outline" style="padding:3px 10px;font-size:12px;" onclick="event.stopPropagation();todoCbOpen(\''+cid+'\',\'*\')">全部预约</button></div>';
    var rows = !open ? '' : '<div class="ub6 ub6-head"><div>施术名称</div><div>术后管理项目</div><div>次数</div><div>建议时间</div><div>地点</div><div></div></div>'+arr.map(function(it){
      return '<div class="ub6"><div title="'+todoEsc(it.surg||'')+'">'+todoEsc(it.surg||'—')+'</div><div title="'+todoEsc(it.label)+'">'+todoEsc(it.label)+'</div><div>'+(it.n||1)+'</div><div class="ub-sug'+(it.over ? ' over' : '')+'">'+todoUbMd(it.sug)+'</div><div>'+todoEsc(it.place||'印尼')+'</div><div><button class="btn-outline" style="padding:3px 8px;font-size:12px;" onclick="todoCbOpen(\''+cid+'\',\''+String(it.gid).replace(/'/g,'')+'\')">预约</button></div></div>';
    }).join('');
    return '<div class="ub-card">'+head+rows+'</div>';
  }).join('')+'</div>';
}
function todoUbItems(){
  var out = todoIsKr() ? todoUbKr() : todoUbIn(), today = todayStr();
  out.forEach(function(it){ it.over = !!(it.sug && it.sug < today); });
  TODO_UB_LAST = out; return out;
}
/* IN：这位客人有没有「接续原案件、包含这一项」的预约（IN 代约带 careFor 的，或客人自助预约了术后管理）；到院当天接续后也算 */
function inCareBooked(c, key){ return !!inCareBooking(c, key); } /* CMD-1020-08：判断放在 data.js 的 inCareBooking（赴韩施术 tab、KR 项目卡也要用） */
/* IN 的未安排预约分组：只放术后管理里「要在印尼做」的——KR 交给印尼的（预约时选印尼 / 后来改印尼）+ 地点本来就只能在印尼的名额；韩国持有的管理项目、本地持有的管理项目都不放（CMD-1020-18）。已有预约接续的不算 */
function todoUbGroupsIn(c, closed){
  var gs = {}, order = [];
  var add = function(surg, name, bk, sug){ var gid = (surg||'')+'|'+name; if(!gs[gid]){ gs[gid] = {gid:gid, surg:surg||'', name:name, items:[]}; order.push(gid); } if(inCareBooked(c, bk)) return; gs[gid].items.push({bk:bk, sug:sug||''}); };
  (c.subItems||[]).forEach(function(s){
    if(s.kind!=='术后管理记录' || s.holdUseOf || s.surgUse || s.place!=='IN' || s.done || s.skipped) return;
    var lb = visitRowLabel(c, s); add(s.projectName||'', lb.name, s.id, s.suggest || s.date);
  });
  if(!closed) careUnits(c).unbooked.filter(function(u){ return u.x.place==='IN'; }).forEach(function(u){ add(u.item, u.x.name || u.x.mgmt, careUnitKey(u), careUnitSug(c, u)); });
  return order.map(function(g){ var o = gs[g]; o.items.sort(function(a, b){ return (a.sug||'9999').localeCompare(b.sug||'9999'); }); return o; }).filter(function(g){ return g.items.length; });
}
function todoUbIn(){
  var out = [];
  CASE_ITEMS.forEach(function(c){
    if(c.subState==='cancelled' || c.stage==='cancelled' || !c.krBalancePaid) return;
    var closed = !!(c.visitClosed || isEnded(c)), mine = todoInMine(c); /* 结案后没做的印尼术后管理转成客人持有，继续留在未安排预约 */
    todoUbGroupsIn(c, closed).forEach(function(g){
      out.push({key:'ub|'+c.id+'|grp|'+g.gid, caseId:c.id, name:c.name, no:c.caseNo, surg:g.surg, label:g.name, n:g.items.length, sug:g.items[0].sug, place:'印尼', source:'KR 交给印尼', mine:mine, gid:g.gid, book:function(){ todoCbOpen(c.id, g.gid); }});
    });
  });
  return out;
}
function todoUbKr(){
  var out = [], me = currentAccount(), meId = me ? me.id : '', today = todayStr();
  krAllCases().forEach(function(r){
    var c = r.c; if(c.visitClosed || isEnded(c) || !c.krBalancePaid) return;
    var earliest = stayOutDate(c); if(earliest && today > earliest) return; /* CMD-1020-11：客人在韩期间（到离境日为止；没填离境日用最早可回国日） */
    var mine = (String(r.krCoordinator||'').split(' ')[0]===meId) || (r.director===(me&&me.name));
    careSlotList(c).forEach(function(sl){ /* 地点韩国，或韩国或印尼但还没决定 */
      var nm = (sl.x.name || sl.x.mgmt), sub = [buyName(sl.item), careDayText(c, sl.item, sl.sug)].filter(Boolean).join(' · ');
      out.push({key:'ub|'+c.id+'|care|'+sl.item+'|'+sl.i+'|'+(sl.sug||'')+'|'+(sl.reuse||''), caseId:c.id, clinicId:r.clinicId, name:c.name, no:c.caseNo, label:nm, sub:sub, sug:sl.sug||'', source:r.clinicName||'—', mine:mine,
        book:function(){ krShowCase(r.clinicId, r.id, {here:true, tab:'items', page:'care'}); setTimeout(function(){ krCbOpen({one:{item:sl.item, i:sl.i, reuse:sl.reuse||''}}); }, 120); }});
    });
    krCbMgItems(c).forEach(function(m){
      var it = itemByKey(c, m.iid||m.name) || {};
      if(it.iid && pickedMgmt(c, it)) return; /* CMD-1020-18：已经加进今天到院（今日进行 / 本次使用）的不算未安排 */
      out.push({key:'ub|'+c.id+'|mg|'+(m.iid||m.name), caseId:c.id, clinicId:r.clinicId, name:c.name, no:c.caseNo, label:buyName(m.name), sub:'剩 '+m.max+' / 共 '+(it.qty||1)+' 次', sug:m.sugs[0]||'', source:r.clinicName||'—', mine:mine,
        book:function(){ krShowCase(r.clinicId, r.id, {here:true, tab:'items', page:'mgmt'}); setTimeout(function(){ krCbOpen({mgmtOne:m.iid||m.name}); }, 120); }});
    });
  });
  return out;
}
/* IN［预约］：打开代约，来访目的默认术后管理、带出原案件和建议日期，接续原案件（careFor） */
var TODO_CB = null;
function todoCareBookOpen(caseId, key, editRc){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0]; if(!c) return;
  if(!editRc){ var g0 = todoUbGroupsIn(c, !!(c.visitClosed || isEnded(c))).filter(function(g){ return g.items.some(function(x){ return x.bk===key; }); })[0]; if(g0) return todoCbOpen(caseId, g0.gid, key); } /* 项目卡里的单条［预约］也走新弹窗 */
  var it = (TODO_UB_LAST||[]).filter(function(x){ return x.caseId===caseId && x.key.indexOf('|'+key)>-1; })[0] || {label:'', sug:''};
  var d0 = it.sug && it.sug >= todayStr() ? it.sug : todayStr(), erc = editRc ? CASE_ITEMS.filter(function(x){ return x.id===editRc; })[0] : null; if(erc){ d0 = erc.visitDate; }
  if(!it.label){ var s0 = (c.subItems||[]).filter(function(x){ return x.id===key; })[0]; if(s0){ var lb = visitRowLabel(c, s0); it = {label:lb.name, sub:lb.sub, sug:s0.suggest||s0.date}; } }
  TODO_CB = {caseId:caseId, key:key, date:d0, time:erc ? erc.visitTime : '', label:it.label, sub:it.sub, sug:it.sug, edit:erc ? erc.id : ''};
  todoCareBookRender();
}
function todoCareBookRender(){
  var B = TODO_CB; if(!B) return; var c = CASE_ITEMS.filter(function(x){ return x.id===B.caseId; })[0]; if(!c){ TODO_CB = null; return; }
  var ov = document.getElementById('todo-cb-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'todo-cb-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var times = (WK_HOURS||[]).filter(function(t){ return !slotBlockReason(B.date, t); }); if(times.indexOf(B.time)<0) B.time = times[0] || '';
  var inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;';
  ov.innerHTML = '<div class="modal-box" style="width:460px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">'+(B.edit ? '修改预约时间' : '预约术后管理')+'</b><span style="cursor:pointer;" onclick="todoCareBookClose()">✕</span></div>'+
    '<div style="font-size:13px;line-height:1.8;margin-bottom:8px;">客人 <b>'+todoEsc(c.name)+'</b>　接续原案件 <b>'+todoEsc(c.caseNo)+'</b><br>项目 <b>'+todoEsc(B.label)+'</b>'+(B.sub ? '<span style="color:var(--muted);font-size:12px;">（'+todoEsc(B.sub)+'）</span>' : '')+'<br>来访目的 <b>术后管理</b>　建议日期 '+todoUbMd(B.sug)+'</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:6px;"><input type="date" value="'+B.date+'" min="'+todayStr()+'" onchange="TODO_CB.date=this.value;todoCareBookRender()" style="'+inp+'"><select onchange="TODO_CB.time=this.value" style="'+inp+'">'+(times.length ? times.map(function(t){ return '<option'+(t===B.time?' selected':'')+'>'+t+'</option>'; }).join('') : '<option value="">这天没有可约时间</option>')+'</select></div>'+
    '<div style="font-size:12px;color:var(--slate2);margin-bottom:12px;">'+todoEsc(ymdWeekText(B.date))+'</div>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn-ghost" onclick="todoCareBookClose()">取消</button><button class="btn-primary" '+(B.time ? '' : 'disabled style="opacity:.4;"')+' onclick="todoCareBookGo()">确认预约</button></div></div>';
  ov.classList.add('open');
}
function todoCareBookClose(){ var ov = document.getElementById('todo-cb-overlay'); if(ov) ov.classList.remove('open'); TODO_CB = null; }
function todoCareBookGo(){
  var B = TODO_CB; if(!B || !B.time) return; var c = CASE_ITEMS.filter(function(x){ return x.id===B.caseId; })[0]; if(!c) return;
  if(slotBlockReason(B.date, B.time)){ alert('这个时间不能约，请换一个'); return; }
  if(B.edit){ var erc = CASE_ITEMS.filter(function(x){ return x.id===B.edit; })[0]; if(erc){ var od = erc.visitDate+' '+erc.visitTime; erc.visitDate = B.date; erc.visitTime = B.time; logCaseEvent(c, actingName(), '修改术后管理预约时间：'+B.label+'，'+od+' → '+B.date+' '+B.time, '术后管理'); logCaseEvent(erc, actingName(), '预约修改：'+od+' → '+B.date+' '+B.time); todoCareBookClose(); try{ renderCalendar(); }catch(e){} todoRefresh(); try{ if(getCurrentCase() && getCurrentCase().id===c.id) renderCaseBody(c); }catch(e){} return; } }
  var exm = pendingResvSameDay(c.name, B.date), rc;
  if(exm && (!exm.careFor || exm.careFor.caseId===c.id)){ rc = exm; rc.careFor = {caseId:c.id, keys:((rc.careFor && rc.careFor.keys) || []).concat([B.key])}; logCaseEvent(c, actingName(), '预约术后管理（合并到当天已有的预约 '+exm.visitTime+'）：'+B.label+'，'+B.date, '术后管理'); logCaseEvent(rc, actingName(), '术后管理并入这次预约，接续原案件 '+c.caseNo+'：'+B.label); B.time = exm.visitTime; }
  else { rc = createReservationCase(c.name, null, B.date, B.time, null, '术后管理'); rc.careFor = {caseId:c.id, keys:[B.key]};
  logCaseEvent(c, actingName(), '预约术后管理（接续本案件）：'+B.label+'，'+B.date+' '+B.time, '术后管理'); logCaseEvent(rc, actingName(), '预约术后管理，接续原案件 '+c.caseNo+'：'+B.label); exm = null; }
  todoCareBookClose(); try{ renderCalendar(); }catch(e){} todoRefresh(); try{ if(getCurrentCase() && getCurrentCase().id===c.id) renderCaseBody(c); }catch(e){}
  showToast(exm ? '已合并' : '预约已生成', exm ? c.name+' · '+mergeNoteText(exm) : c.name+' · '+B.date+' '+B.time+'（术后管理，接续 '+c.caseNo+'）', null);
}

/* ================= CMD-1020-18：IN 预约印尼术后管理弹窗（［全部预约］和单条［预约］共用） =================
   每个项目一组；同一个项目有 N 次时：一行选「这一次预约做几次」（− n +）+ 日期 / 时间，还有剩就自动在下面生成下一行，直到分完或取消勾选；同一天合成一次到店 */
var TODO_CB2 = null;
function todoCbDefDate(sug){ var d = sug && sug >= todayStr() ? sug : todayStr(), n = 0; while(n++ < 30 && !todoCbTimes(d).length) d = ymdAdd(d, 1); return d; } /* 默认日期遇到休诊 / 约满就往后找到第一个能约的日子 */
function todoCbTimes(date){ var ts = (WK_HOURS||[]).filter(function(t){ return !slotBlockReason(date, t); }); return ts; }
function todoCbOpen(caseId, gid, onlyKey){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0]; if(!c) return;
  var gs = todoUbGroupsIn(c, !!(c.visitClosed || isEnded(c))); if(!gs.length) return;
  TODO_CB2 = {caseId:caseId, groups:gs.map(function(g){ var on = gid==='*' || g.gid===gid; return {gid:g.gid, surg:g.surg, name:g.name, keys:g.items, lines:[{on:on, qty:1, date:todoCbDefDate(g.items[0].sug), time:''}]}; })};
  todoCbNormalize(); todoCbRender();
}
function todoCbNormalize(){
  (TODO_CB2.groups||[]).forEach(function(g){
    var total = g.keys.length, acc = 0, out = [];
    for(var i = 0; i < g.lines.length; i++){ var l = g.lines[i]; if(acc>=total) break; if(l.on){ l.qty = Math.max(1, Math.min(parseInt(l.qty,10)||1, total-acc)); acc += l.qty; } out.push(l); }
    g.lines = out; g.acc = acc;
    var last = out[out.length-1]; if(last && last.on && acc<total) g.lines.push({on:true, qty:1, date:todoCbDefDate((g.keys[acc]||{}).sug), time:''}); /* 还有剩 → 自动生成下一行 */
    g.lines.forEach(function(l){ var ts = todoCbTimes(l.date); if(ts.indexOf(l.time)<0) l.time = ts[0]||''; });
  });
}
function todoCbSet(gi, li, k, v){ var l = TODO_CB2.groups[gi].lines[li]; if(k==='on') l.on = !!v; else if(k==='qty') l.qty = (parseInt(l.qty,10)||1)+v; else l[k] = v; todoCbNormalize(); todoCbRender(); }
function todoCbRender(){
  var B = TODO_CB2; if(!B) return; var c = CASE_ITEMS.filter(function(x){ return x.id===B.caseId; })[0]; if(!c){ TODO_CB2 = null; return; }
  var ov = document.getElementById('todo-cb-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'todo-cb-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var inp = 'padding:7px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;', anyOn = false, bad = false;
  var body = B.groups.map(function(g, gi){
    return '<div style="border:1px solid var(--border2);border-radius:10px;padding:10px 12px;margin-bottom:10px;"><div style="font-size:13px;font-weight:700;">'+todoEsc(g.name)+' <span style="font-weight:400;color:var(--muted);font-size:12px;">'+(g.surg ? '对应施术 '+todoEsc(buyName(g.surg))+' · ' : '')+'共 '+g.keys.length+' 次未预约，已选 '+(g.acc||0)+' 次</span></div>'+
      g.lines.map(function(l, li){
        if(l.on) anyOn = true;
        var ts = todoCbTimes(l.date), why = l.on && !ts.length; if(why) bad = true;
        return '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;'+(l.on ? '' : 'opacity:.55;')+'"><input type="checkbox" '+(l.on ? 'checked ' : '')+'onchange="todoCbSet('+gi+','+li+',\'on\',this.checked)">'+
          '<span style="white-space:nowrap;"><button class="btn-outline" style="padding:2px 9px;font-size:13px;" '+(l.on ? '' : 'disabled ')+'onclick="todoCbSet('+gi+','+li+',\'qty\',-1)">−</button> <b style="display:inline-block;min-width:22px;text-align:center;">'+l.qty+'</b> <button class="btn-outline" style="padding:2px 9px;font-size:13px;" '+(l.on ? '' : 'disabled ')+'onclick="todoCbSet('+gi+','+li+',\'qty\',1)">+</button> 次</span>'+
          '<input type="date" value="'+l.date+'" min="'+todayStr()+'" style="'+inp+'" onchange="todoCbSet('+gi+','+li+',\'date\',this.value)"><select style="'+inp+'" onchange="todoCbSet('+gi+','+li+',\'time\',this.value)">'+(ts.length ? ts.map(function(t){ return '<option'+(t===l.time?' selected':'')+'>'+t+'</option>'; }).join('') : '<option value="">这天没有可约时间</option>')+'</select><span style="font-size:12px;color:var(--slate2);">'+todoEsc(ymdWeekText(l.date))+'</span></div>';
      }).join('')+'</div>';
  }).join('');
  ov.innerHTML = '<div class="modal-box" style="width:600px;max-height:86vh;overflow:auto;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">预约印尼术后管理</b><span style="cursor:pointer;" onclick="todoCbClose()">✕</span></div>'+
    '<div style="font-size:13px;line-height:1.8;margin-bottom:10px;">客人 <b>'+todoEsc(c.name)+'</b>　接续原案件 <b>'+todoEsc(c.caseNo)+'</b>　来访目的 <b>术后管理</b></div>'+body+
    '<div style="font-size:12px;color:var(--muted);margin-bottom:12px;">同一天的项目合成一次到店；一个项目有多次时，选好这一次做几次，下面会自动生成下一次的预约行。</div>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn-outline" onclick="todoCbClose()">取消</button><button class="btn-primary" '+(anyOn && !bad ? '' : 'disabled style="opacity:.4;"')+' onclick="todoCbGo()">确认预约</button></div></div>';
  ov.classList.add('open');
}
function todoCbClose(){ var ov = document.getElementById('todo-cb-overlay'); if(ov) ov.classList.remove('open'); TODO_CB2 = null; }
function todoCbGo(){
  var B = TODO_CB2; if(!B) return; var c = CASE_ITEMS.filter(function(x){ return x.id===B.caseId; })[0]; if(!c) return;
  var buckets = {}, order = [], err = '';
  B.groups.forEach(function(g){ var p = 0; g.lines.forEach(function(l){ if(!l.on) return;
    if(!l.date || !l.time || slotBlockReason(l.date, l.time)){ err = '「'+g.name+'」'+(l.date||'')+' 这个时间不能约，请换一个'; return; }
    var ks = g.keys.slice(p, p+l.qty).map(function(x){ return x.bk; }); p += l.qty;
    if(!buckets[l.date]){ buckets[l.date] = {date:l.date, time:l.time, keys:[], labels:[]}; order.push(l.date); }
    var bk = buckets[l.date]; ks.forEach(function(k){ bk.keys.push(k); }); bk.labels.push(g.name+(l.qty>1 ? ' ×'+l.qty : '')); }); });
  if(err){ alert(err); return; }
  if(!order.length) return;
  var done = [], mergedAny = false;
  order.forEach(function(ds){ var bk = buckets[ds]; /* 同一天合成一次到店 */
    var exm = pendingResvSameDay(c.name, bk.date), rc;
    if(exm && (!exm.careFor || exm.careFor.caseId===c.id)){ rc = exm; rc.careFor = {caseId:c.id, keys:((rc.careFor && rc.careFor.keys) || []).concat(bk.keys)}; logCaseEvent(c, actingName(), '预约术后管理（合并到当天已有的预约 '+exm.visitTime+'）：'+bk.labels.join('、')+'，'+bk.date, '术后管理'); logCaseEvent(rc, actingName(), '术后管理并入这次预约，接续原案件 '+c.caseNo+'：'+bk.labels.join('、')); done.push(bk.date+' '+exm.visitTime+'（'+mergeNoteText(exm)+'）'); mergedAny = true; }
    else { rc = createReservationCase(c.name, null, bk.date, bk.time, null, '术后管理'); rc.careFor = {caseId:c.id, keys:bk.keys};
    logCaseEvent(c, actingName(), '预约术后管理（接续本案件）：'+bk.labels.join('、')+'，'+bk.date+' '+bk.time, '术后管理'); logCaseEvent(rc, actingName(), '预约术后管理，接续原案件 '+c.caseNo+'：'+bk.labels.join('、'));
    done.push(bk.date+' '+bk.time); } });
  todoCbClose(); try{ renderCalendar(); }catch(e){} todoRefresh(); try{ if(getCurrentCase() && getCurrentCase().id===c.id) renderCaseBody(c); }catch(e){}
  showToast(mergedAny ? '已合并' : '预约已生成', c.name+' · '+done.join('、')+'（术后管理，接续 '+c.caseNo+'）', null);
}
var TODO_KIND_LABEL = {dsurg:'待施术', dconsult:'待面诊', today:'今天到院'};
function todoToggle(){ TODO_UI.collapsed = !TODO_UI.collapsed; todoSaveUi(); todoRefresh(); }
function todoSetMine(v){ TODO_UI.mine = !!v; todoSaveUi(); todoRefresh(); }
function todoSetKind(k){ TODO_UI.kind = k; if(k) TODO_UI.collapsed = false; todoSaveUi(); todoRefresh(); }

/* 把待办栏挂到日历右边（IN：日历卡片外面包一层；KR：渲染时由 todoKrCalWrap 包） */
function todoMountIn(){
  var grid = document.getElementById('wk-grid'); if(!grid) return null;
  var calCard = grid.closest('.card'); if(!calCard) return null;
  var wrap = document.getElementById('cal-todo-wrap');
  if(!wrap){
    wrap = document.createElement('div'); wrap.id = 'cal-todo-wrap'; wrap.style.cssText = 'display:flex;gap:16px;align-items:stretch;';
    calCard.parentNode.insertBefore(wrap, calCard); wrap.appendChild(calCard); calCard.style.flex = '2 1 0'; calCard.style.minWidth = '0'; /* CMD-1015-01：日历 : 待办 = 2 : 1 */
    var p = document.createElement('div'); p.id = 'todo-pane'; wrap.appendChild(p);
  }
  return document.getElementById('todo-pane');
}
function todoKrCalWrap(calHtml){
  return '<div id="cal-todo-wrap" style="display:flex;gap:16px;align-items:stretch;"><div style="flex:2 1 0;min-width:0;">'+calHtml+'</div><div id="todo-pane" style="flex:'+(TODO_UI.collapsed ? '0 0 auto' : '1 1 0')+';min-width:0;">'+todoPaneHtml(todoItems())+'</div></div>';
}

/* ---------------- 卡片 ---------------- */
function todoCardHtml(label, count, tip, onclick, warn, dot, sub){
  return '<div class="card" data-n="'+count+'"'+(warn?' data-warn="1"':'')+' onclick="'+onclick+'" title="'+todoEsc(tip)+'" style="position:relative;padding:14px 16px;cursor:pointer;min-width:0;'+(warn?'border-color:#E8A8A0;':'')+'">'+(dot ? '<span title="有新进来的项目" style="position:absolute;top:10px;right:10px;width:10px;height:10px;border-radius:50%;background:#E5484D;"></span>' : '')+
    '<div style="font-size:12px;color:var(--slate2);">'+label+'</div>'+
    '<div class="ds-cnum" style="font-size:28px;font-weight:700;margin:4px 0;color:'+(warn?'#B2453A':'var(--navy)')+';">'+count+'</div>'+
    '<div style="font-size:12px;color:var(--muted);line-height:1.6;">'+(sub||'&nbsp;')+'</div></div>';
}
var TODO_SEEN = {}, TODO_LIT = {};
/* 红点：有新进来的项目就亮，点卡片后才灭（刷新不会自己灭） */
function todoCardDot(key, ids){
  if(!ids.length){ TODO_LIT[key] = false; TODO_SEEN[key] = ids; return false; } /* CMD-1020-13 三：数字是 0 就绝不亮红点（也清掉之前亮着的） */
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
    if(d[0]==='soon') return '<div class="card" data-n="0" title="'+todoEsc(d[2]||'')+'" style="position:relative;padding:14px 16px;min-width:0;opacity:.75;cursor:default;"><div style="font-size:12px;color:var(--slate2);">'+d[1]+'</div><div style="font-size:18px;font-weight:700;margin:10px 0 8px;color:var(--muted);">即将推出</div><div style="font-size:12px;color:var(--muted);line-height:1.6;">&nbsp;</div></div>';
    var list = vis.filter(function(it){ return it.cat===d[0]; }), warn = list.some(function(it){ return it.over; }) && d[0]!=='msg';
    var sub = '';
    if(kr && list.length){ var per = {}; list.forEach(function(it){ var cid = (it.rowKey||'').split(':')[0]; if(cid) per[cid] = (per[cid]||0) + 1; }); sub = Object.keys(per).map(function(cid){ return '<span style="margin-right:10px;">'+todoEsc(names[cid]||cid)+' <b>'+per[cid]+'</b></span>'; }).join(''); }
    var dot = todoCardDot(d[0], list.map(function(it){ return it.cat+'|'+it.kind+'|'+it.no+'|'+it.text; }));
    return todoCardHtml(d[1], list.length, d[2], 'todoCardFilter(\''+d[0]+'\')', warn, dot && list.length>0, sub);
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
  return todoCatCardsHtml(all, [['todo','待我处理','要我现在动手的事（联络客人选项目、待收款、转告客人、确认日程…）'],['visit','今天来访','今天预约、还没接待的客人（一位一条；按了已到店 / 未到店就消失）'],['kr','等 KR 回复','等报告、等确认施术时间；没超时灰色，超时变红可催办'],['msg','新消息','未读的被 @、未接来电（看了就消失）']], true);
}
/* KR 四张：待我处理 / 今天到院 / 等待报告（超时标红）/ 新消息 */
function todoKrCardsHtml(rows){
  return todoCatCardsHtml(todoItems(), [['todo','待我处理','要我现在处理的事（确认出报告时间、发送诊疗方案、确认施术时间、待付款、安排术后管理…）'],['today2','今天到院','今天要来、还没按到院的施术和术后管理'],['waiting','等待报告','等院长上传面诊（超时变红）'],['msg','新消息','未读的被 @、未接来电（看了就消失）']]);
}
/* 院长工作台四张卡（CMD-1015-15）：待面诊 / 待施术 / 恢复确认（占位，即将推出）/ 新消息 */
function todoKrDirCardsHtml(){
  return todoCatCardsHtml(todoItems(), [['dconsult','待面诊','自己负责、已排好面诊时间、还没上传面诊内容的案件（要动手的事，点了筛选待办）'],['dsurg','待施术','自己负责的全部已确认施术（点了看名单：今天 / 之后）'],['soon','恢复确认','即将推出'],['msg','新消息','被 @ / 未接来电']]);
}
function todoKrToday(){ if(typeof KRC!=='undefined'){ KRC.mode = 'day'; KRC.anchor = krToday(); KRC.person = 'all'; KRC.layer = 'hospital'; krcRender(); } }

/* ---------------- 现在时间线 ---------------- */
function todoNowLabel(){ var d = demoNow(); return pad2(d.getHours())+':'+pad2(d.getMinutes()); }
function todoNowMinutes(){ var d = demoNow(); return d.getHours()*60 + d.getMinutes(); }
function todoPlaceInLine(){
  if(CAL_MODE==='day') return todoPlaceInDay();
  var grid = document.getElementById('wk-grid'); if(!grid || CAL_MODE!=='week') return;
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
    if(todoIsKr()){ if(p){ p.innerHTML = todoPaneHtml(all); p.style.cssText = 'flex:'+(TODO_UI.collapsed ? '0 0 auto' : '1 1 0')+';min-width:0;'; } return; }
    p = todoMountIn(); if(p){ p.innerHTML = todoPaneHtml(all); p.style.cssText = 'flex:'+(TODO_UI.collapsed ? '0 0 auto' : '1 1 0')+';min-width:0;'; }
    var cards = todoMountInCards(); if(cards) cards.innerHTML = todoInCardsHtml(all);
  }catch(e){ console.error('[待办刷新]', e); }
}
/* renderCalendar() 末尾调用：日历重画后补上待办栏 + 现在时间线 */
function todoAfterCalendar(){
  if(todoIsKr()) return;
  try{ todoRefresh(); todoPlaceInLine(); }catch(e){ console.error('[待办日历]', e); }
}
function todoTick(){
  try{
    if(todoIsKr()){ todoKrNowTick(); if(document.getElementById('todo-pane') && !document.querySelector('.modal-overlay.open')) todoRefresh(); return; }
    if(CURRENT_PAGE_ID!=='in-dashboard') return;
    todoRefresh();
    var line = document.querySelector('.todo-nowline');
    if(CAL_MODE==='week' || CAL_MODE==='day') todoPlaceInLine();
  }catch(e){}
}
setInterval(todoTick, 30000);
setInterval(function(){ try{ if(document.getElementById('todo-pane') && !document.hidden) todoRefresh(); }catch(e){} }, 5000);
/* IN 启动：默认打开日视图 */
function todoInBoot(){ if(todoIsKr()) return; try{ if(typeof setCalMode==='function') setCalMode('week'); }catch(e){ console.error('[默认周视图]', e); } }
/* KR：默认日视图（全部院长） */
(function(){ try{ if(typeof KRC!=='undefined'){ KRC.mode = 'week'; KRC.person = 'all'; } }catch(e){} })();

/* ---------------- 转告客人：打开该案件的赴韩施术 tab 即视为已看到 ---------------- */
(function(){
  if(typeof renderCaseBody!=='function') return;
  var base = renderCaseBody;
  renderCaseBody = function(c){
    base.apply(this, arguments);
    /* CMD-1019-12：不再因为打开赴韩施术 tab 就算已转告，要点［发送给客人］ */
  };
})();

/* ---------------- 弹出提示分类（CMD-1013-17 四） ---------------- */
/* 'stay' 被 @ / 未接来电：弹出并停留；'todo' 新待办：弹一次自动收起；'msg' 消息：不弹，只进铃铛 */
function notifTodoKind(n){
  var tx = String(n.text||''), kd = n.kind||'';
  if(kd==='mention' || kd==='missedcall' || /@ 了你|未接来电/.test(tx)) return 'stay';
  if(n.popup==='confirm') return 'confirm'; /* CMD-1015-09：设定更新（IN-23 / KR-14）弹出并停留、手动确认（不是紧急，没有彩色图标） */
  if(n.popup==='once') return 'todo'; /* 今天的自助预约（IN-15 / IN-16）：弹一次、几秒后自动收起 */
  if(/诊疗方案已到|诊疗方案已出|KR 已确认面诊时间|请发送诊疗方案|等待报告超过|无法安排|预约占位快过期|KR 确认(新)?施术时间|待收款|催办|已缴面诊费|面诊费已免除|需要处理|施术日期待确认|改期待确认|在韩加项/.test(tx) || kd==='urge' || kd==='consultpaid') return 'todo';
  return 'msg';
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
