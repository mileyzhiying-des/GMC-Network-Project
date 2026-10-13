/* shared/selftest.js —— 第 2 轮前全链路自测（CMD-1013-15，开发用，不属于产品功能）
   用法：在 in.html（A1 登录）里注入本脚本，调用 ST.runAll() / ST.run('A1') 等；每个情况用真实的页面函数走一遍，再按 Timeline / 状态断言。
   客人名字前加「T2-」；案件标 round=2。结果放在 ST.R（数组），ST.report() 返回 Markdown 表。 */
(function(){
  var prevR = (window.ST && window.ST.R) || [];
  var ST = window.ST = {R:prevR, __v:1}, cur = null, PH = (window.ST_PH||0);
  window.confirm = function(){ return true; }; window.alert = function(m){ if(cur) cur.alerts.push(String(m)); }; window.open = function(){ return null; };
  try{ localStorage.setItem('gmc_cfg_round', '2'); }catch(e){}
  ST.today = function(){ return todayStr(); };
  ST.ok = function(cond, msg){ if(!cond && cur) cur.fails.push(msg); return !!cond; };
  ST.note = function(m){ if(cur) cur.notes.push(m); };
  ST.T = function(id, title, fn){
    cur = {id:id, title:title, fails:[], notes:[], alerts:[], cases:[]};
    try{ fn(cur); }catch(e){ cur.fails.push('异常：'+(e && e.message || e)+(e && e.stack ? ' @'+String(e.stack).split('\n')[1] : '')); }
    cur.result = cur.fails.length ? '失败' : '通过'; ST.R = ST.R.filter(function(x){ return x.id!==id; }); ST.R.push(cur); var r = cur; cur = null; return r;
  };
  ST.logs = function(c){ return (c.logEntries||[]).map(function(e){ return String(e.action||''); }).join('\n'); };
  ST.hasLog = function(c, re){ return re.test(ST.logs(c)); };
  ST.track = function(c){ if(cur && c && cur.cases.indexOf(c.caseNo)<0) cur.cases.push(c.caseNo); return c; };
  /* 新预约（真实 createReservationCase）：今天 20:00（不触发自动未到店）；每个情况一位新客人 */
  ST.phone = function(){ PH++; return '+62 897-'+String(Math.floor(1000+Math.random()*8999))+'-'+String(1000+PH); };
  ST.newRes = function(base, o){
    o = o || {}; var phone = o.phone || ST.phone(), name = o.name;
    if(!name){ if(o.phone){ name = ('T2-'+base); } else { name = 'T2-'+base; var n = 1; while(clientByName(name)){ n++; name = 'T2-'+base+' '+n; } } }
    var c = createReservationCase(name, null, o.date || todayStr(), o.time || '20:00', phone, o.purpose || '面诊商谈');
    c.round = 2; ST.track(c); return c;
  };
  ST.open = function(c){ openCaseDetail(c.id); return c; };
  ST.arrive = function(c){ ST.open(c); markArrived(); return c; };
  /* 填基础资料并确认：opts {consult:true|false|'reuse', intents:[项目名], link:{caseId, reason}, director:'KD1 院长'} */
  ST.materials = function(c, o){
    o = o || {}; ST.open(c);
    c.metaviewStatus = 'ready'; c.photoUploaded = true; c.videoUploaded = true; c.concern = '（自测）苦恼'; c.expectation = '（自测）希望';
    if(o.link){ c.linkedCase = {caseId:o.link.caseId, reason:o.link.reason}; }
    renderCaseBody(c);
    if(o.consult===true || o.consult==='reuse'){ setNeedsConsult(o.consult); } else setNeedsConsult(false);
    if(o.consult===true || o.consult==='reuse'){
      c.hospitalId = c.hospitalId || caseHospitalId(c); if(o.director || !c.director) setCaseDirector(o.director || 'KD1 院长');
      (o.intents || ['假体隆鼻']).forEach(function(n){ var p = intentSurgeryProjects(c).filter(function(x){ return x.name===n; })[0]; if(p && !(c.intentionProjects||[]).some(function(it){ return it.projectId===p.id; })) toggleIntentionProject(p.id); });
    }
    renderCaseBody(c);
    var a = document.getElementById('cf-concern'), b = document.getElementById('cf-expectation'); if(a) a.value = c.concern; if(b) b.value = c.expectation;
    confirmMaterials(); return c;
  };
  ST.payConsult = function(c){ ST.open(c); c.activeCaseTab = 'consult'; confirmConsultFee(); };
  ST.waiveConsult = function(c, reason){ ST.open(c); var d = feeDraft(c); d.mode = 'waive'; d.reason = reason || '其他'; d.note = '（自测）'; confirmConsultFee(); };
  /* KR 一侧用 core 函数（KR 页面按钮调用的就是它们）：在本诊所分区里直接改案件，再 Store.touch */
  ST.krBy = 'KM1 室长';
  ST.krEta = function(c){ coreConfirmConsultTimes(c, {date:todayStr(), time:'20:30'}, D(1)+' 05:00', ST.krBy); };
  ST.report = function(){
    var rows = ST.R.slice().sort(function(a, b){ return String(a.id).localeCompare(String(b.id), 'zh', {numeric:true}); });
    return rows.map(function(r){ return '| '+r.id+' | '+r.result+' | '+r.cases.join('、')+' | '+r.title+(r.fails.length ? ' ——'+r.fails.join('；') : '')+(r.notes.length ? ' ['+r.notes.join('；')+']' : '')+(r.alerts.length ? ' (提示：'+r.alerts.slice(0,3).join(' / ')+')' : '')+' |'; }).join('\n');
  };
  ST.sum = function(){ var s = {通过:0, 失败:0}; ST.R.forEach(function(r){ s[r.result] = (s[r.result]||0)+1; }); return s; };

  /* ---------- 赴韩主线辅助（IN 用真实按钮函数，KR 用 core*）---------- */
  ST.krReportItems = function(names){
    var h = HOSPITAL_DATA.H1, items = names.map(function(n){ var p = h.projects.filter(function(x){ return x.name===n; })[0]; return {projectId:p.id, name:n, price:p.price, currency:'KRW', origin:'KR', categoryId:p.categoryId}; });
    gmcFillKrMeta([{hospitalId:'H1', procedureItems:items}]);
    var inn = PROJECT_LIBRARY.filter(function(x){ return x.origin==='IN' && x.active && x.name==='艺人水光焕肤'; })[0]; inn = inn ? inn.name : '艺人水光焕肤';
    items.forEach(function(it){ (it.postcare||[]).forEach(function(x){ if(x.place==='either') x.innName = inn; }); });
    return items.map(function(it){ return {name:it.name, price:it.price, note:'', stay:it.stay, anesthesia:it.anesthesia, postcare:(it.postcare||[]).map(function(x){ return Object.assign({}, x); })}; });
  };
  /* 面诊：缴费 → KR 确认时间 → 开始 → 上传内容 → 提交诊疗方案 */
  ST.consultToReport = function(c, names){
    ST.arrive(c); ST.materials(c, {consult:true}); ST.payConsult(c);
    ST.ok(c.consultStatus==='paid_waiting_kr', '缴面诊费后应为待确认报告时间，实际 '+c.consultStatus);
    coreConfirmConsultTimes(c, todayStr(), '20:30', D(1)+' 05:00', ST.krBy);
    coreStartConsult(c, 'KD1 院长'); c.consultContentAt = nowFullDt(); logCaseEvent(c, 'KD1 院长', '上传面诊内容，面诊结束'); updateCaseStage(c);
    var items = ST.krReportItems(names || ['假体隆鼻', '鼻翼缩小']);
    var ok = coreSubmitReport(c, {original:'（自测）', zh:'（自测）建议所选项目', items:items, overallNote:'', files:[]}, ST.krBy);
    ST.ok(ok && c.consultStatus==='report_ready', '提交诊疗方案失败');
    return c;
  };
  /* IN 选项目 → 生成结算单 → 付定金（真实函数） */
  ST.selectAndPay = function(c, names){
    ST.open(c); c.activeCaseTab = 'kr';
    names.forEach(function(n){ var p = PROJECT_LIBRARY.filter(function(x){ return x.name===n && x.origin==='KR' && x.hospitalId==='H1'; })[0]; toggleProject(p.id); });
    confirmProjectSelection();
    var b = latestUnpaidBatch(c); ST.ok(!!b, '没有生成待付款结算单'); if(!b) return c;
    settleProjects(); window.SETTLE_ANES_SIGNED = true; confirmSettlementPayment();
    ST.ok(c.settlementDone, '付定金后 settlementDone 应为 true'); return c;
  };
  /* IN 递交施术日期 → KR 确认 */
  ST.scheduleConfirm = function(c, daysAhead){
    ST.open(c); var ks = ensureKrScheduleDraft(c), od = caseOpenDates(c), dur = surgeryMinutes(c), key = c.clinicId+':'+c.id, d = null, tm = null;
    od.filter(function(x){ return x >= D(daysAhead || 8); }).some(function(x){ for(var m = 10*60; m <= 17*60; m += 30){ var tt = minToTime(m); if(!krSurgerySlotError('H1', c.director, x, tt, dur, key, {allowOffHours:true})){ d = x; tm = tt; return true; } } return false; });
    if(!ST.ok(!!d, '找不到有空档的开放日期')) return c;
    ks.primary = d; submitKrScheduleDate(); ST.ok(scheduleState(c)==='Pending', '递交后应为待确认施术时间，实际 '+scheduleState(c));
    coreScheduleConfirm(c, d, tm, '（自测）首尔', ST.krBy); ST.ok(scheduleState(c)==='Confirmed', '确认后应为时间已确认，实际 '+scheduleState(c)); return c;
  };
  ST.krArrive = function(c){ var ok = coreMarkArrived(c, ST.krBy); ST.ok(scheduleState(c)==='Arrived', '标已到院后应为 Arrived'); return ok; };
  ST.krJudge = function(c, r, memo){ var ok = coreJudge(c, r, ST.krBy, memo || (r==='ok' ? '' : '（自测）')); ST.ok(ok, '评估 '+r+' 失败'); return ok; };
  ST.krPay = function(c){ var res = coreSettleBalance(c, ST.krBy); ST.ok((res && res.ok) || c.krBalancePaid, '付清尾款失败'); return res; };
  /* 今日项目全勾 → 结案（KR 页面的［已完成］+［是，结案］） */
  ST.krCloseToday = function(c){
    var ids = (c.subItems||[]).filter(function(s){ return (s.kind==='施术' || s.kind==='增加项目') && !s.done; }).map(function(s){ return s.id; });
    coreTodayDone(c, ids, ST.krBy); return coreFinishToday(c, ST.krBy);
  };
  ST.tests = {};
  ST.run = function(id){ if(!ST.tests[id]) return null; return ST.T(id, ST.tests[id].title, ST.tests[id].fn); };
  ST.runAll = function(ids){ (ids || Object.keys(ST.tests)).forEach(function(id){ ST.run(id); }); return ST.sum(); };
  ST.def = function(id, title, fn){ ST.tests[id] = {title:title, fn:fn}; };

  /*TESTS*/
  /* ================= A 到店前 / 接待 ================= */
  ST.def('A1','室长取消预约',function(){
    var c = ST.newRes('A1'); ST.open(c); window.CANCEL_REASON = '客人要求取消'; confirmCancel();
    ST.ok(c.stage==='cancelled' || c.subState==='cancelled', '应为已取消，实际 '+c.stage+'/'+c.subState);
    ST.ok(ST.hasLog(c, /取消该客人的到店预约/), 'Timeline 缺「取消该客人的到店预约」');
  });
  ST.def('A2','未到店 → 重新预约',function(){
    var c = ST.newRes('A2'); var ok = markNoShow(c.id); ST.ok(ok && c.cancelReason==='未到店', '应标未到店，原因 '+c.cancelReason);
    var c2 = ST.newRes('A2', {phone:clientPhoneOf(c.name)}); ST.ok(c2.name===c.name, '重新预约应沿用同一客人'); ST.ok(c2.stage==='booked', '新预约应为待访问');
    ST.ok(c.visitState!=='x' && ST.hasLog(c, /未到店|标记/), '原案件缺未到店记录');
  });
  ST.def('A3','预约修改后到店',function(){
    var c = ST.newRes('A3'); ST.open(c); window.RESCHED_CASE_ID = c.id; window.RESCHED_SELECTED_DATE = new Date(); window.RESCHED_SELECTED_TIME = '19:00';
    confirmReschedule(); ST.ok(c.visitTime==='19:00', '时间应改为 19:00，实际 '+c.visitTime+(c.visitTime==='20:00' ? '（'+(slotBlockReason(todayStr(),'19:00',null,c.id)||'无原因')+'）' : ''));
    ST.ok(ST.hasLog(c, /修改预约为/), '缺「修改预约为」'); markArrived(); ST.ok(c.subState==='arrived', '应能标已到店'); ST.ok(ST.hasLog(c, /标记客人已到店/), '缺到店记录');
  });
  ST.def('A4','接待未保存离开 → 退回待访问',function(){
    var c = ST.newRes('A4'); ST.arrive(c); ST.ok(receptionOpen(c), '到店后基础资料未保存应是接待中');
    nav('in-clients'); ST.ok(c.subState==='waiting', '离开页面应退回待访问，实际 '+c.subState); ST.ok(ST.hasLog(c, /接待未完成，退回待访问/), '缺退回记录');
    var c2 = ST.newRes('A4b'); ST.arrive(c2); ST.open(c2); openCancelIntakeModal(); confirmCancelIntake(); ST.ok(c2.subState==='waiting' && ST.hasLog(c2, /取消接待，案件回到待访问/), '取消接待应回到待访问');
  });
  ST.def('A5','接续另一个进行中案件 → 本案作废',function(){
    var c1 = ST.newRes('A5'); ST.arrive(c1); ST.materials(c1, {consult:false});
    var c2 = ST.newRes('A5', {phone:clientPhoneOf(c1.name)}); ST.arrive(c2); ST.ok(ongoingCasesOf(c2).length>0, '应检测到进行中的案件');
    var n0 = CASE_ITEMS.length; resumeVisit(c1.id); ST.ok(CASE_ITEMS.indexOf(c2)<0 && CASE_ITEMS.length===n0-1, '新案件应作废并从列表移除'); ST.ok(ST.hasLog(c1, /接续到访/), '原案件缺「接续到访」');
  });
  ST.def('A6','关联之前案件（复诊 / 术后管理）',function(){
    var c1 = ST.newRes('A6'); ST.arrive(c1); ST.materials(c1, {consult:false}); noPurchaseThisTime(); ST.ok(isEnded(c1), '前一个案件应已结束');
    var c2 = ST.newRes('A6', {phone:clientPhoneOf(c1.name)}); ST.arrive(c2); ST.materials(c2, {consult:false, link:{caseId:c1.id, reason:'术后管理'}});
    ST.ok(c2.linkedCase && c2.linkedCase.caseId===c1.id, '应关联上一个案件'); ST.ok(ST.hasLog(c2, /关联之前案件/), '缺关联记录');
    ST.ok(showRelatedTab(c2) && !showRelatedTab(c1), '只有往前关联的案件有关联 tab');
  });


  /* ---------- 本地辅助 ---------- */
  function $(id){ return document.getElementById(id); }
  ST.localCase = function(base, o){ o = o || {}; var c = ST.newRes(base, o); ST.arrive(c); ST.materials(c, {consult:false}); return c; };
  ST.localProj = function(name){ return PROJECT_LIBRARY.filter(function(x){ return x.origin==='IN' && x.active && x.name===name; })[0] || PROJECT_LIBRARY.filter(function(x){ return x.origin==='IN' && x.active && !x.neg; })[0]; };
  ST.localPay = function(c, ops){ /* ops(fn(c)) 往购物车里加东西，然后确认选项目 → 结算 → 付款 */
    ST.open(c); c.activeCaseTab = 'localmgmt'; chooseProjectEntryMode('new'); ops(c); confirmProjectSelection();
    var b = latestUnpaidBatch(c); ST.ok(!!b, '没有生成本地结算单'); if(!b) return c; settleProjects(); confirmSettlementPayment(); return c;
  };
  ST.useHold = function(c, scope, itemName, qty){
    ST.open(c); renderCaseBody(c); var hs = clientHoldingsSorted(c.name), i = hs.findIndex(function(h){ return h.itemName===itemName; });
    if(!ST.ok(i>-1, '客人没有持有「'+itemName+'」')) return;
    var ce = $('hold-check-'+scope+'-'+i), qe = $('hold-qty-'+scope+'-'+i), oe = $('hold-opt-'+scope+'-'+i);
    if(!ST.ok(!!ce && !!qe, '持有项目使用界面没有渲染（scope '+scope+'）')) return;
    ce.checked = true; qe.value = String(qty || 1); if(oe && !oe.value && oe.options.length>1) oe.value = oe.options[1].value; submitHoldingsUse(scope);
  };
  ST.def('B6','选购 → 付款 → 使用 → 结案',function(){
    var c = ST.localCase('B6'), p = ST.localProj('LHALa peel');
    ST.localPay(c, function(){ toggleLocalProject('main', p.id); });
    ST.ok(ST.hasLog(c, /本地项目已转入客户持有/) || ST.hasLog(c, /完成项目付款/), '缺付款 / 转持有记录');
    ST.useHold(c, 'main', p.name, 1); ST.ok(ST.hasLog(c, /使用了/), '缺使用记录');
    markMgmtRows('main', 'done', true); ST.ok(c.stage==='closed', '做完应结案，实际 '+c.stage);
  });
  ST.def('B7','只用以前持有的项目 → 结案',function(){
    var c0 = ST.newRes('B7'); var p = ST.localProj('LHALa peel'); ST.arrive(c0); ST.materials(c0, {consult:false}); ST.localPay(c0, function(){ toggleLocalProject('main', p.id); setLocalItemField('main', p.id, 'qty', 2); });
    ST.open(c0); notUseThisTime('main'); ST.ok(isEnded(c0), '前一次到访应已结案（买了没用）：'+c0.stage);
    var c = ST.newRes('B7', {phone:clientPhoneOf(c0.name)}); ST.arrive(c); ST.materials(c, {consult:false}); chooseProjectEntryMode('holdings');
    ST.useHold(c, 'main', p.name, 1); markMgmtRows('main', 'done', true);
    ST.ok(c.stage==='closed', '只用持有应结案，实际 '+c.stage); ST.ok(!ST.hasLog(c, /完成项目付款|本地项目已转入客户持有/), '本次不应有付款记录');
  });
  ST.def('B8','使用中管理取消（次数归还）',function(){
    var c0 = ST.newRes('B8'), p = ST.localProj('LHALa peel'); ST.arrive(c0); ST.materials(c0, {consult:false}); ST.localPay(c0, function(){ toggleLocalProject('main', p.id); setLocalItemField('main', p.id, 'qty', 2); });
    ST.open(c0); notUseThisTime('main');
    var c = ST.newRes('B8', {phone:clientPhoneOf(c0.name)}); ST.arrive(c); ST.materials(c, {consult:false}); chooseProjectEntryMode('holdings');
    var left0 = holdingRemaining(getClientHoldings(c.name).filter(function(h){ return h.itemName===p.name; })[0]);
    ST.useHold(c, 'main', p.name, 1); markMgmtRows('main', 'cancelled', false, 0);
    var left1 = holdingRemaining(getClientHoldings(c.name).filter(function(h){ return h.itemName===p.name; })[0]);
    ST.ok(ST.hasLog(c, /标记取消（次数已归还持有/), '缺取消归还记录'); ST.ok(left1===left0, '次数应归还：'+left0+' → '+left1);
  });
  ST.def('B9','本次不购买 → 已取消',function(){
    var c = ST.localCase('B9'); chooseProjectEntryMode('new'); noPurchaseThisTime();
    ST.ok(c.stage==='cancelled', '应为已取消，实际 '+c.stage); ST.ok(ST.hasLog(c, /本次不购买项目/), '缺「本次不购买项目」');
  });
  ST.def('B10','只办退款 → 已取消（仅办理退款）',function(){
    var c0 = ST.newRes('B10'), p = ST.localProj('LHALa peel'); ST.arrive(c0); ST.materials(c0, {consult:false}); ST.localPay(c0, function(){ toggleLocalProject('main', p.id); }); ST.open(c0); notUseThisTime('main');
    var c = ST.newRes('B10', {phone:clientPhoneOf(c0.name)}); ST.arrive(c); ST.open(c);
    ST.ok(refundableBatches(c.name).length>0, '应有可退批次'); openRefundService();
    document.querySelectorAll('.rs-cb').forEach(function(cb){ cb.checked = true; }); var r = $('rs-reason'); if(r) r.value = '（自测）客人要求退款'; document.querySelectorAll('[id^=rs-amt-]').forEach(function(i){ i.value = '0'; });
    confirmRefundService(); refundOnlyAnswer(true);
    ST.ok(c.stage==='cancelled' && /仅办理退款/.test(String(c.cancelReason||'')), '应为已取消（仅办理退款），实际 '+c.stage+'/'+c.cancelReason);
  });
  ST.def('B11a','买活动价项目',function(){
    var pm = PROMOS.filter(function(x){ return promoStatusOf(x)==='进行中'; })[0]; if(!ST.ok(!!pm, '没有进行中的活动价（演示数据）')) return;
    var c = ST.localCase('B11a'); ST.localPay(c, function(){ toggleLocalProject('main', pm.projectId); });
    var hs = getClientHoldings(c.name); ST.ok(hs.some(function(h){ return h.batches.some(function(b){ return b.promo; }); }), '持有批次应标 promo');
  });
  ST.def('B11b','买套餐',function(){
    var pk = activePackages()[0]; if(!ST.ok(!!pk, '没有可用套餐（演示数据）')) return;
    var c = ST.localCase('B11b'); ST.localPay(c, function(){ toggleLocalPackage('main', pk.id); });
    var hs = getClientHoldings(c.name); ST.ok(hs.some(function(h){ return h.batches.some(function(b){ return b.pkgPaid; }); }), '持有批次应标 pkgPaid'); ST.ok(refundableBatches(c.name).length===0, '套餐批次不应可退款');
  });
  ST.def('B11c','送서비스',function(){
    var c = ST.localCase('B11c'), p = ST.localProj('LHALa peel'), sp = PROJECT_LIBRARY.filter(function(x){ return x.origin==='IN' && x.active && x.id!==p.id && !x.neg; })[0];
    ST.localPay(c, function(cc){ toggleLocalProject('main', p.id); cartOf(cc, 'main').push(buildServiceItem(sp, 1)); });
    var hs = getClientHoldings(c.name); ST.ok(hs.some(function(h){ return h.batches.some(function(b){ return b.service; }); }), '持有批次应标 service'); ST.ok(refundableBatches(c.name).every(function(x){ return !x.b.service; }), '서비스批次不应可退款');
  });
  ST.def('B12','本地案件中途增加面诊',function(){
    var c = ST.localCase('B12'); addConsult(); ST.ok(c.consultRequested && c.consultStatus==='awaiting_payment', '增加面诊后应待缴费');
    ST.ok(ST.hasLog(c, /发起"增加面诊"/), '缺记录'); var t = consultTabHtml(c); ST.ok(/意向项目/.test(t) && /预算/.test(t), '增加面诊页应有意向项目 / 预算（同基础资料）');
  });

  /* ================= C 面诊 / F 新流程 ================= */
  ST.def('C13','待缴费时取消面诊 → 转不面诊',function(){
    var c = ST.newRes('C13'); ST.arrive(c); ST.materials(c, {consult:true}); ST.ok(c.consultStatus==='awaiting_payment', '应待缴费'); cancelConsult();
    ST.ok(c.consultStatus==='cancelled', '面诊应取消'); ST.ok(ST.hasLog(c, /面诊取消（面诊费已取消）/), '缺记录'); ST.ok(c.entryChoicePending && c.localTrack, '应转本地管理（选择项目）');
  });
  ST.def('C14','面诊费免除',function(){
    var c = ST.newRes('C14'); ST.arrive(c); ST.materials(c, {consult:true}); ST.waiveConsult(c, '其他');
    ST.ok(c.consultStatus==='paid_waiting_kr' && !!c.consultFeeWaived, '免除后应待确认报告时间'); ST.ok(ST.hasLog(c, /免除面诊费/), '缺记录');
  });
  ST.def('C15','出诊疗方案后客人不做项目 → 仅出报告',function(){
    var c = ST.newRes('C15'); ST.consultToReport(c); ST.open(c); noProjectForClient();
    ST.ok(isEnded(c) && c.stage==='reportonly', '应为仅出报告，实际 '+c.stage); ST.ok(ST.hasLog(c, /客人不做项目/), '缺记录');
  });
  ST.def('C17','延续既往面诊、沿用原诊疗方案',function(){
    var c1 = ST.newRes('C17'); ST.consultToReport(c1); ST.open(c1); noProjectForClient();
    var c2 = ST.newRes('C17', {phone:clientPhoneOf(c1.name)}); ST.arrive(c2); ST.materials(c2, {consult:'reuse', link:{caseId:c1.id, reason:'延续既往面诊'}});
    ST.ok(!!c2.reuseReport, '应沿用原诊疗方案'); ST.ok(ST.hasLog(c2, /沿用/), '缺沿用记录'); ST.ok(c2.reportReady, '沿用后应是项目确认中（诊疗方案已到）');
  });
  ST.def('F1','开始面诊',function(){
    var c = ST.newRes('F1'); ST.arrive(c); ST.materials(c, {consult:true}); ST.payConsult(c); coreConfirmConsultTimes(c, todayStr(), '20:30', D(1)+' 05:00', ST.krBy);
    ST.ok(coreStartConsult(c, 'KD1 院长'), '开始面诊失败'); ST.ok(ST.hasLog(c, /开始面诊/), '缺记录'); ST.ok(/面诊中/.test(caseProcessText(c)), '进程应是面诊中，实际 '+caseProcessText(c));
  });
  ST.def('F2','上传面诊内容 → 面诊结束',function(){
    var c = ST.newRes('F2'); ST.arrive(c); ST.materials(c, {consult:true}); ST.payConsult(c); coreConfirmConsultTimes(c, todayStr(), '20:30', D(1)+' 05:00', ST.krBy); coreStartConsult(c, 'KD1 院长');
    c.consultContentAt = nowFullDt(); logCaseEvent(c, 'KD1 院长', '上传面诊内容，面诊结束'); updateCaseStage(c); ST.ok(/等待报告/.test(caseProcessText(c)), '上传后进程应是等待报告，实际 '+caseProcessText(c));
  });
  function toConfirmed(base, names){ var c = ST.newRes(base); ST.consultToReport(c, names); ST.selectAndPay(c, names || ['假体隆鼻', '鼻翼缩小']); ST.scheduleConfirm(c, 8); return c; }
  ST.toConfirmed = toConfirmed;
  ST.def('F3','院长评估：可以手术，原方案不变',function(){
    var c = toConfirmed('F3'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.ok(ST.hasLog(c, /院长评估结果：可以手术，原方案不变/), '缺评估记录');
  });
  ST.def('F4','院长评估：需要调整方案',function(){
    var c = toConfirmed('F4'); ST.krArrive(c); ST.krJudge(c, 'changed', '（自测）调整');
    ST.ok(coreMarkUnable(c, ['鼻翼缩小'], '（自测）不适合'), '标无法施术失败'); ST.krPay(c); ST.ok(c.krBalancePaid, '付清尾款失败');
    ST.ok(ST.hasLog(c, /院长评估结果：可以手术，但需要调整方案/), '缺评估记录'); ST.ok(ST.krCloseToday(c) && isEnded(c), '调整方案后应能结案');
  });
  ST.def('F5','院长评估：不建议手术',function(){
    var c = toConfirmed('F5'); ST.krArrive(c); ST.krJudge(c, 'cannot', '（自测）不建议'); ST.ok(ST.hasLog(c, /院长评估结果：不建议手术/), '缺评估记录');
    ST.ok(coreRefundDecision(c, 'all', ST.krBy), '退款判断失败');
  });
  ST.def('F6','生成诊疗方案 PDF',function(){
    var c = ST.newRes('F6'); ST.consultToReport(c); ST.open(c); reportToPdf(); ST.ok(ST.hasLog(c, /生成诊疗方案 PDF/), '缺记录');
  });
  /* ================= D 赴韩 ================= */
  ST.def('D18','赴韩无变动 → 结案',function(){
    var c = toConfirmed('D18'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); ST.ok(ST.krCloseToday(c), '今日项目结案失败'); ST.ok(isEnded(c) && c.stage==='closed', '应已结案，实际 '+c.stage);
  });
  function pcRows(c, inWhere){
    var rows = [], k0 = 0;
    pcUniqueEntries(c).forEach(function(e){ var x = e.x; for(var k = 0; k < (x.times||1); k++){ var where = (x.place==='either' && inWhere) ? 'IN' : 'KR'; rows.push({where:where, item:e.it.name, pcIdx:e.i, date:D(14+k0++), time:'10:00', mgmt:x.mgmt, name:x.name, innName:x.innName, day:null, askIn:where==='IN' && inWhere==='ask'}); } });
    return rows;
  }
  ST.pcRows = pcRows;
  ST.def('D19','术后管理回印尼使用（关联原案件）',function(){
    var c = toConfirmed('D19'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c);
    ST.ok(corePcBooking(c, pcRows(c, 'IN'), ST.krBy), '术后管理预约失败'); ST.ok(ST.krCloseToday(c), '结案失败');
    var inn = (CLIENT_HOLDINGS[c.name]||[]).filter(function(h){ return h.batches.some(function(b){ return b.pkg; }); })[0]; if(!ST.ok(!!inn, '付清尾款后应有套餐内含的 0 元持有批次')) return;
    var c2 = ST.newRes('D19', {phone:clientPhoneOf(c.name)}); ST.arrive(c2); ST.materials(c2, {consult:false}); chooseProjectEntryMode('holdings'); ST.open(c2); renderCaseBody(c2);
    var hs = clientHoldingsSorted(c2.name), hi = hs.findIndex(function(h){ return h.itemName===inn.itemName; }), bi = hs[hi].batches.findIndex(function(b){ return b.pkg; });
    openPostcareUse('main', hi, bi); var rs = document.getElementById('pc-use-reason'); if(rs) rs.value = '（自测）客人提前回来'; confirmPostcareUse();
    ST.ok(c2.linkedCase && c2.linkedCase.caseId===c.id && c2.linkedCase.auto, '应自动关联原赴韩案件'); ST.ok(ST.hasLog(c2, /自动关联该案件/), '缺自动关联记录'); ST.ok(ST.hasLog(c, /术后管理：/), '原赴韩案件 Timeline 应有术后管理使用记录');
  });
  ST.def('D20','到院前取消部分项目 + 加项',function(){
    var c = toConfirmed('D20'); ST.open(c); openCancelItems(); var cb = document.querySelector('.refund-cb'); if(!ST.ok(!!cb, '取消项目弹窗没有勾选框')) return; cb.checked = true;
    document.getElementById('refund-amount').value = '100000'; document.getElementById('refund-reason').value = '（自测）客人不做了'; confirmRefund();
    ST.ok(ST.hasLog(c, /取消项目"/), '缺取消项目记录'); ST.ok(krNotStartedItems(c).length===1, '应剩 1 个项目，实际 '+krNotStartedItems(c).length);
    addMoreProjects(); var p = PROJECT_LIBRARY.filter(function(x){ return x.origin==='KR' && x.hospitalId==='H1' && x.name==='埋线双眼皮'; })[0]; toggleProject(p.id); confirmAddition(); window.SETTLE_ANES_SIGNED = true; confirmSettlementPayment();
    ST.ok((c.settlementBatches||[]).length>=2, '应有第 2 张结算单，实际 '+(c.settlementBatches||[]).length);
  });
  ST.def('D21','KR 无法安排 → 重选日期',function(){
    var c = ST.newRes('D21'); ST.consultToReport(c); ST.selectAndPay(c, ['假体隆鼻']); ST.open(c); var ks = ensureKrScheduleDraft(c); ks.primary = caseOpenDates(c).filter(function(x){ return x >= D(8); })[0]; submitKrScheduleDate();
    ST.ok(coreScheduleReject(c, '（自测）院长那天不行', ST.krBy), 'KR 无法安排失败'); ST.ok(scheduleState(c)==='Draft', '应回到待 IN 递交，实际 '+scheduleState(c)); ST.ok(ST.hasLog(c, /KR无法安排所选日期/), '缺记录');
    ST.scheduleConfirm(c, 9);
  });
  ST.def('D22a','时间确认后改期',function(){
    var c = toConfirmed('D22a'); ST.open(c); startKrScheduleChange(); var od = caseOpenDates(c).filter(function(x){ return x >= D(10) && x!==c.krSchedule.confirmedDate; })[0]; c.krSchedule.changePrimary = od; submitKrScheduleChangeDate();
    var tm = null; for(var m = 10*60; m <= 17*60; m += 30){ var tt = minToTime(m); if(!krSurgerySlotError('H1', c.director, od, tt, surgeryMinutes(c), c.clinicId+':'+c.id, {allowOffHours:true})){ tm = tt; break; } }
    ST.ok(coreChangeConfirm(c, od, tm || '10:00', '（自测）', ST.krBy), 'KR 确认新时间失败'); ST.ok(ST.hasLog(c, /申请修改施术日期/) && ST.hasLog(c, /KR确认新施术时间/), '缺改期记录');
  });
  ST.def('D23','到院后调整方案 → 多退少补 → 结案',function(){
    var c = toConfirmed('D23'); ST.krArrive(c); ST.krJudge(c, 'changed', '（自测）'); coreMarkUnable(c, ['假体隆鼻'], '（自测）');
    var res = coreSettleBalance(c, ST.krBy); ST.ok(res && res.ok, '结算失败');
    if(res.refund){ ST.open(c); openRefundModal([], 'diffRefund', false, c.krJudge.refundDue); document.getElementById('refund-reason').value = '（自测）多退'; confirmRefund(); }
    ST.ok(c.krBalancePaid, '尾款应已结清'); ST.ok(ST.krCloseToday(c) && isEnded(c), '应能结案，实际 '+c.stage);
  });
  ST.def('D24','全部不能做 → 在韩重新约',function(){
    var c = toConfirmed('D24'); ST.krArrive(c); ST.krJudge(c, 'cannot', '（自测）');
    var od = caseOpenDates(c).filter(function(x){ return x >= D(12); })[0]; ST.ok(coreRebook(c, od, '10:00', ST.krBy), '重新预约失败'); ST.ok(ST.hasLog(c, /KR在韩国重新预约施术时间/), '缺记录');
    ST.ok(scheduleState(c)==='Confirmed', '应回到时间已确认');
  });
  ST.def('D25','全部不能做 → 退定金 → 仅出报告',function(){
    var c = toConfirmed('D25'); ST.krArrive(c); ST.krJudge(c, 'cannot', '（自测）'); coreRefundDecision(c, 'all', ST.krBy);
    ST.open(c); openRefundModal(krNotStartedItems(c), 'krCannot', false, 1200000); document.getElementById('refund-reason').value = '（自测）定金全退'; confirmRefund();
    ST.ok(isEnded(c) && c.stage==='reportonly', '应为仅出报告，实际 '+c.stage); ST.ok(ST.hasLog(c, /KR判断：不能施术/), '缺 KR 判断记录');
  });
  ST.def('D26','在韩加做项目',function(){
    var c = toConfirmed('D26'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c);
    ST.ok(coreAddOnItem(c, '埋线双眼皮', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}}), '加做失败'); ST.ok(ST.hasLog(c, /KR增加项目/), '缺记录'); ST.ok(pendingPayItems(c).length===1, '付清后加的项目应待付款');
    ST.ok(coreAddOnPaid(c, ST.krBy), '标已付款失败');
  });
  function cancelAllKr(c, mode){ /* 到院前取消全部赴韩项目（mode 'cannot' = ［无法协调］，否则 ［取消项目］） */
    ST.open(c); if(mode==='cannot') requestCannotCoordinate(); else openCancelItems();
    document.querySelectorAll('.refund-cb').forEach(function(cb){ cb.checked = true; }); document.getElementById('refund-amount').value = '100000'; document.getElementById('refund-reason').value = '（自测）取消'; confirmRefund();
  }
  ST.def('D27a','到院前取消全部赴韩项目（无本地项目）→ 做本地',function(){
    var c = toConfirmed('D27a'); cancelAllKr(c); ST.ok(ST.hasLog(c, /询问是否增加本地项目/), '缺询问记录'); ST.ok(!ST.hasLog(c, /点\[无法协调\]|点［无法协调］/), '不应是无法协调');
    localAskAnswer(true); ST.ok(c.localTrack && !isEnded(c), '选做本地应继续走本地流程');
  });
  ST.def('D27b','到院前取消全部赴韩项目（无本地项目）→ 不做',function(){
    var c = toConfirmed('D27b'); cancelAllKr(c); localAskAnswer(false); ST.ok(isEnded(c) && c.stage==='reportonly', '应为仅出报告，实际 '+c.stage); ST.ok(ST.hasLog(c, /客人不做\/不增加本地项目/), '缺记录');
  });
  ST.def('D29a','无法协调（无本地项目）→ 增加本地',function(){
    var c = toConfirmed('D29a'); cancelAllKr(c, 'cannot'); ST.ok(ST.hasLog(c, /室长点［无法协调］/), '缺无法协调记录'); localAskAnswer(true); ST.ok(c.localTrack && !isEnded(c), '应继续走本地流程');
  });
  ST.def('D29b','无法协调（无本地项目）→ 不加',function(){
    var c = toConfirmed('D29b'); cancelAllKr(c, 'cannot'); localAskAnswer(false); ST.ok(isEnded(c) && c.stage==='reportonly', '应为仅出报告，实际 '+c.stage);
  });
  /* 赴韩案件里先买本地项目（添加本地管理 → 选购付款 → 本次不使用） */
  function withLocal(base){
    var c = toConfirmed(base); ST.open(c); addLocalMgmt(); c.activeCaseTab = 'localmgmt'; lmSetStep('buy'); var p = ST.localProj('LHALa peel'); toggleLocalProject('lm', p.id); lmSettle(); lmNotUse(c);
    ST.ok(localPurchasedBatches(c).length>0, '赴韩案件里应已买到本地项目'); return c;
  }
  ST.def('D30','面诊或赴韩案件中添加本地管理',function(){
    var c = withLocal('D30'); ST.ok(ST.hasLog(c, /添加本地管理/), '缺记录'); ST.ok(!isEnded(c), '赴韩案件还在进行，不应结案（本地管理结束后）');
  });
  ST.def('D28a','无法协调（有本地项目）→ 保留并使用',function(){
    var c = withLocal('D28a'); cancelAllKr(c, 'cannot'); ST.ok(c.localAsk==='keep', '应询问保留 / 全退'); localKeepChoice('keep'); localAskAnswer(true);
    var p = ST.localProj('LHALa peel'); chooseProjectEntryMode('holdings'); ST.useHold(c, 'main', p.name, 1); markMgmtRows('main', 'done', true); ST.ok(ST.hasLog(c, /室长选择保留/) && ST.hasLog(c, /使用了/), '缺保留 / 使用记录'); ST.ok(isEnded(c), '应结案，实际 '+c.stage);
  });
  ST.def('D28b','无法协调（有本地项目）→ 保留但这次不做',function(){
    var c = withLocal('D28b'); cancelAllKr(c, 'cannot'); localKeepChoice('keep'); localAskAnswer(true); chooseProjectEntryMode('holdings'); notUseThisTime('main');
    ST.ok(ST.hasLog(c, /室长选择保留/) && ST.hasLog(c, /本次不使用任何持有项目/), '缺记录'); ST.ok(isEnded(c), '应结案（有购买），实际 '+c.stage);
  });
  ST.def('D28c','无法协调（有本地项目）→ 全退',function(){
    var c = withLocal('D28c'); cancelAllKr(c, 'cannot'); localKeepChoice('refund'); document.querySelectorAll('[id^=lra-]').forEach(function(i){ i.value = '0'; }); document.getElementById('local-refund-all-reason').value = '（自测）'; confirmLocalRefundAll();
    ST.ok(ST.hasLog(c, /室长选择全部退款/), '缺记录'); ST.ok(isEnded(c) && c.stage==='reportonly', '应为仅出报告，实际 '+c.stage);
  });
  ST.def('D31a','时间确认后取消全部赴韩（有本地项目）→ 保留并使用',function(){
    var c = withLocal('D31a'); cancelAllKr(c); localKeepChoice('keep'); localAskAnswer(true); var p = ST.localProj('LHALa peel'); chooseProjectEntryMode('holdings'); ST.useHold(c, 'main', p.name, 1); markMgmtRows('main', 'done', true);
    ST.ok(ST.hasLog(c, /室长选择保留/) && !ST.hasLog(c, /点［无法协调］/), '记录不对'); ST.ok(isEnded(c), '应结案');
  });
  ST.def('D31b','时间确认后取消全部赴韩（有本地项目）→ 保留但这次不做',function(){
    var c = withLocal('D31b'); cancelAllKr(c); localKeepChoice('keep'); localAskAnswer(true); chooseProjectEntryMode('holdings'); notUseThisTime('main'); ST.ok(isEnded(c) && ST.hasLog(c, /本次不使用任何持有项目/), '应结案并有记录');
  });
  ST.def('D31c','时间确认后取消全部赴韩（有本地项目）→ 全退',function(){
    var c = withLocal('D31c'); cancelAllKr(c); localKeepChoice('refund'); document.querySelectorAll('[id^=lra-]').forEach(function(i){ i.value = '0'; }); document.getElementById('local-refund-all-reason').value = '（自测）'; confirmLocalRefundAll();
    ST.ok(ST.hasLog(c, /室长选择全部退款/) && isEnded(c) && c.stage==='reportonly', '应为仅出报告');
  });

  /* ================= E 其他功能 ================= */
  ST.freeSlot = function(){ for(var k = 1; k < 20; k++){ var d = D(k); for(var i = 0; i < WK_HOURS.length; i++){ if(!slotBlockReason(d, WK_HOURS[i])) return {date:d, time:WK_HOURS[i]}; } } return {date:D(30), time:'10:00'}; };
  function selfBook(base, o){ o = o || {}; var phone = o.phone || ST.phone(); var nm = o.name || ('T2-'+base); var fs = ST.freeSlot(); o.date = o.date || fs.date; o.time = o.time || fs.time;
    var r = submitSelfBooking({consentGiven:!!o.consent, entry:o.entry || 'web', phId:o.phId || null, date:o.date || todayStr(), time:o.time || '20:30', phone:phone, name:nm, firstName:nm, lastName:'', gender:'女', dob:'1992-02-02', history:'', beauty:[], purpose:'面诊商谈', note:''});
    if(r && r.c){ r.c.round = 2; ST.track(r.c); } return r; }
  ST.def('E1','客人自助预约（新客）',function(){
    var r = selfBook('E1', {consent:true}); ST.ok(r.ok && r.isNew, '新客预约应成功'); ST.ok(r.c.bookClient==='new', 'bookClient 应是 new'); ST.ok(!!clientByPhone(r.c && clientPhoneOf(r.c.name)), '应建客户档案');
  });
  ST.def('E2','客人自助预约（老客）',function(){
    var r1 = selfBook('E2', {consent:true}); var r2 = selfBook('E2', {phone:clientPhoneOf(r1.c.name), name:r1.c.name}); ST.ok(r2.ok && !r2.isNew, '老客预约应成功'); ST.ok(r2.c.bookClient==='old', 'bookClient 应是 old');
  });
  ST.def('E3','老客旧版同意书重签',function(){
    var r1 = selfBook('E3', {consent:true}); var r2 = selfBook('E3', {phone:clientPhoneOf(r1.c.name), name:r1.c.name, consent:true}); ST.ok(r2.c.consentResigned===true, 'consentResigned 应为 true');
    var cl = clientByName(r1.c.name); ST.ok(cl.consents.length>=2, '应多一条同意记录');
  });
  ST.def('E4','占位链接提交',function(){
    var phone = ST.phone(), phId = 'ph'+(PLACEHOLDER_SEQ++); RESERVATION_PLACEHOLDERS.push({id:phId, date:todayStr(), time:'20:30', phone:phone, link:'x', smsText:'x', purpose:'面诊商谈', expiresAt:Date.now()+600000});
    var r = selfBook('E4', {entry:'link', phId:phId, phone:phone, consent:true}); ST.ok(r.ok, '提交应成功'); ST.ok(ST.hasLog(r.c, /通过预约链接填完资料/), '缺「通过预约链接填完资料」');
    ST.ok(!RESERVATION_PLACEHOLDERS.some(function(p){ return p.id===phId; }), '占位应已转成预约'); ST.ok(!calendarEvents().some(function(e){ return e.kind==='placeholder' && e.phId===phId; }), '日历不应再有占位');
  });
  ST.def('E6','已到医院撤回',function(){
    var c = ST.toConfirmed('E6'); ST.krArrive(c); ST.ok(coreUnarrive(c, ST.krBy), '撤回失败'); ST.ok(scheduleState(c)==='Confirmed', '撤回后应回到时间已确认'); ST.ok(ST.hasLog(c, /KR撤回已到医院|撤回"已到医院"/), '缺记录');
  });
  function toPaid(base){ var c = ST.toConfirmed(base); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); return c; }
  ST.def('E7a','术后管理预约 — 在韩国',function(){
    var c = toPaid('E7a'); ST.ok(corePcBooking(c, ST.pcRows(c, null), ST.krBy), '预约失败'); ST.ok((c.subItems||[]).some(function(s){ return s.pcb && s.place==='KR'; }), '应有在韩国的术后管理子项'); ST.ok(ST.hasLog(c, /KR完成术后管理预约/), '缺记录');
  });
  ST.def('E7b','术后管理预约 — 回印尼做',function(){
    var c = toPaid('E7b'); ST.ok(corePcBooking(c, ST.pcRows(c, 'IN'), ST.krBy), '预约失败'); ST.ok((c.subItems||[]).some(function(s){ return s.pcb && s.place==='IN'; }), '应有回印尼做的子项'); ST.ok(!!c.innCare, '印尼部分应已转持有');
  });
  ST.def('E7c','术后管理预约 — 请 IN 代约',function(){
    var c = toPaid('E7c'); ST.ok(corePcBooking(c, ST.pcRows(c, 'ask'), ST.krBy), '预约失败'); ST.ok((c.subItems||[]).some(function(s){ return s.pcb && s.place==='IN' && s.informed; }), '应有已通知 IN 代约的子项'); ST.ok(ST.hasLog(c, /KR通知 IN 室长预约/), '缺通知记录');
  });
  ST.def('E7d','IN 代约成功（关联原案件）',function(){
    var c = toPaid('E7d'); corePcBooking(c, ST.pcRows(c, 'ask'), ST.krBy); var s = (c.subItems||[]).filter(function(x){ return x.pcb && x.informed; })[0]; if(!ST.ok(!!s, '没有待代约的子项')) return;
    openSubBookModal(c.id, s.id); var dt = null, tm = null; for(var k = 1; k < 12 && !dt; k++){ var d0 = D(k); ['10:00','11:00','15:30','16:00'].some(function(t0){ if(!slotBlockReason(d0, t0)){ dt = d0; tm = t0; return true; } return false; }); }
    document.getElementById('sub-book-date').value = dt; document.getElementById('sub-book-time').innerHTML = '<option>'+tm+'</option>'; confirmSubBook();
    ST.ok(ST.hasLog(c, /IN 室长预约了/), '缺代约记录'); ST.ok(!!s.booked, '子项应记录新案件号'); var nc = CASE_ITEMS.filter(function(x){ return x.caseNo===s.booked; })[0]; ST.ok(nc && nc.linkedCase && nc.linkedCase.caseId===c.id, '新案件应自动关联原案件'); if(nc) ST.track(nc);
  });
  ST.def('E8','催办',function(){
    var c = ST.newRes('E8'); ST.arrive(c); ST.materials(c, {consult:true}); ST.payConsult(c); var d = new Date(Date.now()-3*3600000); c.consultPaidAt = d.toISOString().slice(0,10)+' '+d.toISOString().slice(11,16);
    ST.ok(!!urgeInfo(c), '缴费 3 小时未确认应可催办'); urgeKr(); ST.ok(ST.hasLog(c, /催办 KR 室长/), '缺催办记录'); var hn = HOSPITAL_DATA.H1.notifs || []; ST.ok(hn.some(function(n){ return /催办/.test(n.text) && n.caseId===c.id; }), 'KR 应收到催办通知');
  });
  ST.def('E9','未接来电',function(){
    var c = ST.newRes('E9'); ST.arrive(c); ST.materials(c, {consult:true}); ST.payConsult(c); window.ATTACHED_CASE_ID = c.id; simulateMissedCall(); ST.ok(NOTIFS.some(function(n){ return /未接来电/.test(n.text) && n.caseId===c.id; }), '通知里应有未接来电');
  });
  ST.def('E10','持有项目退款（退款服务）',function(){
    ST.tests['B10'].fn.call(null); var last = null;
  });
  ST.def('E11','重新选择项目（待付款）',function(){
    var c = ST.newRes('E11'); ST.consultToReport(c); ST.open(c); c.activeCaseTab = 'kr'; var p = PROJECT_LIBRARY.filter(function(x){ return x.origin==='KR' && x.hospitalId==='H1' && x.name==='假体隆鼻'; })[0]; toggleProject(p.id); confirmProjectSelection();
    ST.ok(!!latestUnpaidBatch(c), '应有待付款结算单'); reselectProjects(); ST.ok(!latestUnpaidBatch(c) && (c.recommended||[]).length===1, '应退回重新选择'); ST.ok(ST.hasLog(c, /退回重新选择项目/), '缺记录');
  });

  /* ================= 角色功能 29～31（A1 管理者）================= */
  function restoreClinic(snap){ Object.keys(snap).forEach(function(k){ CLINIC_SETTINGS[k] = JSON.parse(JSON.stringify(snap[k])); }); applyClinicSettings(); Store.touch(); }
  function clinicChange(mut){ openAdminPage('clinic'); clinicDraftFresh(); mut(CLINIC_DRAFT); var err = clinicValidate(CLINIC_DRAFT); if(err) ST.note('校验：'+err); saveClinicSettings(); }
  ST.def('S29','IN 管理者 A1：诊所设定',function(){
    var snap = JSON.parse(JSON.stringify(CLINIC_SETTINGS)), ids0 = NOTIFS.map(function(n){ return n.id; });
    try{
      /* 1 资料：地址 → 时区自动判定、只读；城市 → 工作台天气 */
      var tz0 = CLINIC_SETTINGS.tz; clinicChange(function(d){ d.address = 'Jl. Raya Kuta No. 8, Kuta, Bali'; d.city = 'Denpasar'; });
      ST.ok(CLINIC_SETTINGS.tz==='Asia/Makassar' && CLINIC_SETTINGS.tz!==tz0, '改成巴厘地址后时区应自动变为 UTC+8，实际 '+CLINIC_SETTINGS.tz);
      var pageTxt = document.getElementById('admin-body').innerText; ST.ok(!/WIB|WITA|WIT\b/.test(pageTxt), '画面不应出现 WIB / WITA / WIT 字样'); ST.ok(!document.querySelector('#admin-body [data-k="tz"]'), '时区应只读（没有输入框）');
      renderCalendar(); var w = document.getElementById('dash-weather'); ST.ok(!w || /Denpasar/.test(w.textContent), '工作台天气应跟着城市变，实际 '+(w && w.textContent));
      /* 2 营业时间 / 午休 / 定期休诊 → 日历行、可约时段跟着变 */
      clinicChange(function(d){ d.openTime = '09:00'; d.closeTime = '20:00'; d.bookFrom = '09:00'; d.bookTo = '19:00'; d.lunchFrom = '13:00'; d.lunchTo = '14:00'; d.closedRules = [{dow:0, from:''}, {dow:6, from:'15:00'}]; });
      ST.ok(WK_HOURS[0]==='09:00' && WK_HOURS[WK_HOURS.length-1]==='19:30', '日历行应按营业时间生成，实际 '+WK_HOURS[0]+'～'+WK_HOURS[WK_HOURS.length-1]); ST.ok(slotIsLunch('13:30') && !slotIsLunch('12:30'), '午休时段应是 13:00～14:00');
      var sat = null, sun = null; for(var k = 1; k < 15; k++){ var dd = new Date(D(k)+'T00:00:00'); if(dd.getDay()===6 && !sat) sat = D(k); if(dd.getDay()===0 && !sun) sun = D(k); }
      ST.ok(slotBlockReason(sun, '10:00')==='closed', '周日应整天休诊'); ST.ok(slotBlockReason(sat, '15:30')==='closed' && slotBlockReason(sat, '10:00')!=='closed', '周六 15:00 起应休诊，之前可约');
      /* 3 预约规则 */
      clinicChange(function(d){ d.holdMinutes = 20; d.noShowMinutes = 45; d.slotCapacity = 1; d.remindBeforeHours = 12; });
      ST.ok(holdMs()===20*60000, '占位倒计时应是 20 分钟'); ST.ok(noShowMs()===45*60000, '未到店判定应是 45 分钟');
      var fs = ST.freeSlot(); var cx = createReservationCase('T2-S29cap', null, fs.date, fs.time, ST.phone(), '面诊商谈'); ST.track(cx); cx.round = 2; ST.ok(slotBlockReason(fs.date, fs.time)==='full', '上限改成 1 后同一时段应显示已满');
      /* 4 面诊费：新案件用新价，已选面诊的案件不变 */
      var cOld = ST.newRes('S29fee'); ST.arrive(cOld); ST.materials(cOld, {consult:true}); var oldFee = consultFeeOf(cOld);
      clinicChange(function(d){ d.consultFee = 410000; });
      var cNew = ST.newRes('S29fee2'); ST.arrive(cNew); ST.materials(cNew, {consult:true}); ST.ok(consultFeeOf(cOld)===oldFee, '已选面诊的案件面诊费不应变'); ST.ok(consultFeeOf(cNew)===410000, '新案件应用新面诊费，实际 '+consultFeeOf(cNew));
      /* 5 短信模板 */
      clinicChange(function(d){ d.sms.confirm = '（自测）{name} 的预约 {time} 已确认 {clinic}'; });
      var n1 = SMS_LOG ? SMS_LOG.length : 0; sendSms('confirm', '+62 000-0000-0000', smsVarsOfCase(cOld), cOld.id); ST.ok(SMS_LOG.length>=n1 && /（自测）/.test(SMS_LOG[0].text), '确认短信应使用新模板，实际 '+SMS_LOG[0].text);
      /* 6 同意书版本 → 客人要重新勾选 */
      var cl = clientByName(cOld.name); cl.consents = [{version:snap.privacyVersion, ts:nowFullDt(), source:'自测'}]; clinicChange(function(d){ d.privacyVersion = 'v9.9'; });
      var last = cl.consents[cl.consents.length-1]; ST.ok(last.version !== CLINIC_SETTINGS.privacyVersion, '同意书版本更新后客人最近一次签署的版本应不等于当前版本（预约页据此要求重新勾选）');
      /* 7 每次保存 → A2 收到系统通知 */
      var sysN = NOTIFS.filter(function(n){ return ids0.indexOf(n.id)<0 && n.text && /更新了诊所设定/.test(n.text); }); ST.ok(sysN.length>=5, '每次保存都应有系统通知，实际 '+sysN.length+' 条'); ST.ok(sysN.every(function(n){ return (n.names||n.to||[]).indexOf('A2 室长')>-1 || JSON.stringify(n).indexOf('A2')>-1; }), 'A2 应在收件人里');
      ST.ok(sysN.every(function(n){ return /A1/.test(n.text); }), '通知应写明谁改的'); ST.ok(!!(sysN[0].detail && sysN[0].detail.effective), '通知详情应写明生效时间');
      /* 8 合作医院只读；定金比例看得到、不能改 */
      openAdminPage('clinic'); var body = document.getElementById('admin-body').innerText; ST.ok(/合作医院（只读）/.test(body), '应有合作医院（只读）'); ST.ok(!document.querySelector('#admin-body [data-k="depositRate"]') && /赴韩定金比例：30%/.test(body), '定金比例应看得到（30%）但不能改');
    } finally { restoreClinic(snap); }
  });
  ST.def('S30','IN 管理者 A1：账号管理（购买 / 退订 / 重设 / 验证码）',function(){
    var n0 = ACCOUNTS.length;
    openAdminPage('accounts'); openBuyAccounts(); BUY.role = 'general'; BUY.qty = 1; buyNext(); ST.ok(BUY.step==='pay', '一般室长加购应直接到付款'); buyPay();
    var a = ACCOUNTS[ACCOUNTS.length-1]; ST.ok(ACCOUNTS.length===n0+1 && a.status==='pending' && a.seat==='addon', '应生成待激活的加购账号 '+(a && a.id));
    ST.ok(acctCanUnsub(a), '加购账号应可退订'); doUnsubAcct(a.id); ST.ok(accountById(a.id).status==='disabled', '退订后应立即停用'); ST.ok(accountById(a.id).history.some(function(h){ return h.type==='退订'; }), '记录应保留');
    var base = ACCOUNTS.filter(function(x){ return x.seat!=='addon' && x.clinicId===CURRENT_CLINIC_ID; })[0]; ST.ok(!!base && !acctCanUnsub(base), '基本账号不能退订');
    /* 管理者加购管理者 → 老板验证码 */
    openBuyAccounts(); BUY.role = 'manager'; BUY.qty = 1; ST.ok(buyNeedsOwnerCode(), 'A1 加购管理者应需要老板验证码'); buyNext(); ST.ok(BUY.step==='code' && !!PURCHASE_REQ, '应进入验证码步骤'); var code0 = PURCHASE_REQ.code;
    var inp = document.getElementById('buy-code'); inp.value = '000000'; buyVerify(); ST.ok(BUY.step==='code' && /验证码不对/.test(BUY.err), '错误验证码应被拒绝'); inp = document.getElementById('buy-code'); inp.value = code0; buyVerify(); ST.ok(BUY.step==='pay', '正确验证码应放行');
    var n1 = ACCOUNTS.length; buyPay(); var m = ACCOUNTS[ACCOUNTS.length-1]; ST.ok(ACCOUNTS.length===n1+1 && m.role==='manager' && m.status==='pending', '验证码确认后应生成待激活的管理者账号'); doUnsubAcct(m.id);
    var owner = ACCOUNTS.filter(function(x){ return x.role==='owner' && x.clinicId===CURRENT_CLINIC_ID; })[0]; ST.ok(!!owner && !acctCanReset(owner), '老板账号不能被重设（只能重设管理者 / 一般室长）');
    ST.ok(OP_LOG_HAS('购买') && OP_LOG_HAS('退订'), '购买 / 退订都应记入操作 log');
    ST.note('停用 / 换使用人 / 激活 / 登录拦截需要 login.html 页面，另测');
  });
  function OP_LOG_HAS(sub){ return (typeof ACCOUNT_LOG !== 'undefined' ? ACCOUNT_LOG : []).some(function(l){ return JSON.stringify(l).indexOf(sub)>-1; }) || (typeof OP_LOG !== 'undefined' && OP_LOG.some(function(l){ return JSON.stringify(l).indexOf(sub)>-1; })); }
  ST.def('S31','IN 管理者 A1：项目库',function(){
    var cats = projLibCategories('IN'); ST.ok(cats.length===12, '本地项目库应是 12 类，实际 '+cats.length);
    /* 新增项目 */
    openProjNewModal(); PROJ_EDIT.names = {zh:'T2自测项目', ko:'', id:''}; PROJ_EDIT.categoryId = cats[0].id; PROJ_EDIT.specs = [{id:'spx1', label:'1次', price:'100000'}, {id:'spx2', label:'3次', price:'270000'}]; saveProj();
    var p = PROJECT_LIBRARY.filter(function(x){ return x.name==='T2自测项目'; })[0]; if(!ST.ok(!!p, '新增项目应成功')) return; ST.ok(p.specs.length===2 && p.names.ko && p.names.id, '规格 2 个、其他语言应自动补全');
    var c = ST.localCase('S31'); ST.localPay(c, function(){ toggleLocalProject('main', p.id); }); var b0 = getClientHoldings(c.name)[0].batches[0]; var paid0 = b0.paid;
    /* 编辑价格 → 已买批次实付不变 */
    openProjEditModal(p.id); PROJ_EDIT.specs[0].price = 150000; saveProj(); ST.ok(projById(p.id).specs[0].price===150000, '价格应已改'); ST.ok(b0.paid===paid0, '已买批次实付不应变');
    /* 非活性化 / 重新启用 */
    var ids = function(){ return PROJECT_LIBRARY.filter(function(x){ return x.origin==='IN' && x.active; }).map(function(x){ return x.id; }); };
    deactivateProj(p.id); ST.ok(!projById(p.id).active && ids().indexOf(p.id)<0, '非活性化后选购里应看不到'); reactivateProj(p.id); ST.ok(projById(p.id).active && ids().indexOf(p.id)>-1, '重新启用后应又能选到');
    /* 删除限制：客人还在持有 → 删不掉；没人用的才能删 */
    deactivateProj(p.id); ST.ok(!!projDeleteBlockReason(projById(p.id)) && /持有/.test(projDeleteBlockReason(projById(p.id))), '还有客人持有时应提示删不掉'); window.__a=''; deleteProj(p.id); ST.ok(!!projById(p.id), '被持有的项目不应被删除');
    openProjNewModal(); PROJ_EDIT.names = {zh:'T2临时项目', ko:'', id:''}; PROJ_EDIT.categoryId = cats[0].id; PROJ_EDIT.specs = [{id:'spx3', label:'1次', price:'50000'}]; saveProj(); var q = PROJECT_LIBRARY.filter(function(x){ return x.name==='T2临时项目'; })[0];
    deactivateProj(q.id); deleteProj(q.id); ST.ok(!projById(q.id), '没人用的非活性化项目应能删除');
    /* 活动价 / 套餐 */
    openPromoModal(); PROMO_EDIT.projectId = p.id; PROMO_EDIT.specId = p.specs[0].id; PROMO_EDIT.price = 90000; PROMO_EDIT.from = D(0); PROMO_EDIT.to = D(10); savePromo(); var pm = PROMOS.filter(function(x){ return x.projectId===p.id; })[0]; ST.ok(!!pm && promoStatusOf(pm)==='进行中', '活动价应新增并进行中');
    ST.ok(localUnitPrice(projById(p.id), p.specs[0].id).price===90000, '本地选购应带入活动价'); endPromo(pm.id); ST.ok(localUnitPrice(projById(p.id), p.specs[0].id).price===150000, '结束活动后应恢复原价');
    var nCopy = copyLastMonthPromos(); ST.note('复制上个月活动：新增 '+nCopy+' 条');
    openPkgModal(); PKG_EDIT.name = 'T2套餐'; PKG_EDIT.items = [{projectId:p.id, specId:p.specs[0].id, qty:2}]; PKG_EDIT.price = 200000; PKG_EDIT.from = D(0); PKG_EDIT.to = D(30); savePkg(); var pk = PACKAGES.filter(function(x){ return x.name==='T2套餐'; })[0]; ST.ok(!!pk, '套餐应新增');
    ST.ok(!!projDeleteBlockReason(projById(p.id)) && /套餐|活动价/.test(projDeleteBlockReason(projById(p.id))), '被套餐 / 活动引用的项目应删不掉');
    ST.ok(!document.getElementById('projlib-role-select'), '没有演示用角色下拉'); 
    /* 赴韩项目 tab：IN 只读 */
    ST.note('赴韩项目 tab 只读 / A2 只能看：另测（A2 账号）');
  });

  /* ---- 32：A2 一般室长（在 A2 登录的分页里跑）---- */
  ST.def('S32','IN 一般室长 A2：权限边界 + 客户管理 + 持有项目 + 工作台 + 案例库',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='A2', '这个测试要在 A2 登录的分页里跑，当前 '+(me && me.id))) return;
    var forbidden = ADMIN_PAGES.filter(function(p){ return !p.hidden && canDo(p.perm); }).map(function(p){ return adminPageLabel(p); });
    ST.ok(!forbidden.some(function(l){ return /账号管理|诊所设定|经营数据|操作日志/.test(l); }), 'A2 的侧边栏不应有账号管理 / 诊所设定 / 经营数据 / 操作日志，实际 '+forbidden.join('、'));
    var sb = document.querySelector('.sidebar') ? document.querySelector('.sidebar').innerText : ''; ST.ok(!/账号管理|诊所设定|经营数据/.test(sb), '侧边栏文字里不应出现这些入口');
    ST.ok(!canDo('accounts') && !canDo('clinic') && !canDo('bizdata') && !canDo('oplog') && !canDo('promo'), 'A2 不应有账号 / 诊所设定 / 经营数据 / 操作日志 / 活动套餐权限'); ST.note('直接输入管理页网址会被 location.replace 挡回首页（本测试会因此刷新页面，所以只检查权限）');
    var c = ST.localCase('S32'); var p = ST.localProj('LHALa peel'); ST.localPay(c, function(){ toggleLocalProject('main', p.id); setLocalItemField('main', p.id, 'qty', 2); }); ST.open(c); notUseThisTime('main');
    /* 客户管理：名字 / 电话搜索 */
    nav('in-clients'); var si = document.getElementById('client-search'); si.value = c.name; renderClientRows(); ST.ok(document.querySelectorAll('#client-rows .trow').length>=1 && document.getElementById('client-rows').innerText.indexOf(c.name)>-1, '按名字应搜得到');
    si.value = clientPhoneOf(c.name).replace(/\D/g, '').slice(-6); renderClientRows(); ST.ok(document.getElementById('client-rows').innerText.indexOf(c.name)>-1, '按电话应搜得到'); si.value = ''; renderClientRows();
    /* 客户详情：改基本信息、补登医美史 */
    openClientDetail(c.name, 'in-clients'); openClientEdit(c.name, 'history'); document.getElementById('ce-v').value = '（自测）无过敏'; saveClientEdit(); ST.ok(clientByName(c.name).history==='（自测）无过敏', '基本信息应能改');
    openBeautyAdd(null); document.getElementById('ba-ym').value = '2025-06'; document.getElementById('ba-project').value = '外院玻尿酸'; saveBeautyAdd(); ST.ok(beautyRecordsOf(clientByName(c.name)).some(function(r){ return r.project==='外院玻尿酸'; }), '医美史应能补登（项目纯文字 + 年月）');
    ST.ok(document.getElementById('history-list').innerText.indexOf(c.caseNo)>-1, '客户详情应列出案件（Case ID）');
    /* 持有项目卡：按项目汇总、展开到批次 */
    var hold = document.getElementById('detail-holdings') ? document.getElementById('detail-holdings').innerText : ''; ST.ok(hold.indexOf(p.name)>-1, '持有项目卡应按项目汇总'); ST.ok(!/退款/.test(hold), '客户详情持有项目卡不再有退款按钮（退款移到案件［退款服务］，CMD-1013-04）');
    /* 退款服务入口 */
    var c2 = ST.newRes('S32b', {phone:clientPhoneOf(c.name)}); ST.arrive(c2); ST.open(c2); openRefundService(); var rb = document.getElementById('refund-svc-overlay') ? document.getElementById('refund-svc-overlay').innerText : ''; ST.ok(/实付/.test(rb), '退款服务弹窗应显示当初实付'); closeRefundService();
    ST.ok(refundableBatches(c.name).every(function(x){ return !x.b.pkg && !x.b.pkgPaid && !x.b.service; }), '套餐 / 서비스 / 套餐内含批次不应可退款');
    /* 工作台：预约历史搜索；memo 权限 */
    nav('in-resvhistory'); var rs = document.getElementById('resv-search'); rs.value = c.name; renderResvHistory(); ST.ok(document.getElementById('resv-rows').innerText.indexOf(c.name)>-1, '预约历史应能按人名搜到');
    var mine = {id:'m_s32', date:todayStr(), type:'备忘', scope:'公开', text:'自测', author:ME_NAME}; CAL_MEMOS.push(mine); var other = {id:'m_s32o', date:todayStr(), type:'备忘', scope:'公开', text:'别人的', author:'A1 室长'}; CAL_MEMOS.push(other);
    openMemoModal('m_s32'); ST.ok(!!MEMO_DRAFT && MEMO_DRAFT.editId==='m_s32', '自己写的 memo 应能改'); closeMemoModal(); MEMO_DRAFT = null; openMemoModal('m_s32o'); ST.ok(!MEMO_DRAFT || MEMO_DRAFT.editId!=='m_s32o', '别人写的 memo 不应能改');
    CAL_MEMOS.splice(CAL_MEMOS.indexOf(mine), 1); CAL_MEMOS.splice(CAL_MEMOS.indexOf(other), 1);
    /* 案例库 */
    nav('in-library'); ST.ok(LIB_CASES.length>0, '案例库应有案例'); ST.ok(LIB_CASES.some(function(x){ return x.source==='KR' || x.origin==='KR' || x.krUploaded || x.hospitalId; }) || HOSPITAL_DATA.H1.libCases.length>0, '应看得到 KR 上传的案例（医院案例库）');
  });

  /* ---- 33：个人设定（当前登录账号；A2 / KC1 / KD1 各在自己的分页里跑一次）---- */
  ST.def('S33','个人设定：资料 / 头像 / 语言 / 通知 / 改密码',function(){
    var a = currentAccount(), snap = JSON.parse(JSON.stringify(a)), me0 = ME_NAME, role = a.role;
    try{
      openAdminPage('personal'); ST.ok(!!document.getElementById('pf-name'), '个人设定页应渲染');
      document.getElementById('pf-name').value = a.name+'乙'; document.getElementById('pf-phone').value = '+62 811-9999-0001'; saveProfile();
      ST.ok(a.name===snap.name+'乙' && ME_NAME===a.name, '姓名应已改并同步 ME_NAME'); ST.ok((a.history||[]).some(function(h){ return h.type==='资料变更'; }), '资料变更应记入使用人历史');
      var sb = document.querySelector('.sidebar') ? document.querySelector('.sidebar').innerText : ''; ST.ok(sb.indexOf(a.name)>-1, '侧边栏应显示新名字');
      /* 头像 → 院长同步到 IN 选院长的介绍卡 */
      if(isKrDirectorLike(a) && a.hospitalId){ var dr = hospitalDirectors(a.hospitalId).filter(function(x){ return x.name===a.name || x.name===snap.name; })[0]; a.photo = 'data:image/png;base64,AAAA'; if(dr) dr.photo = a.photo; ST.ok(!dr || dr.photo===a.photo, '院长头像应同步到介绍卡'); }
      /* 语言：韩 / 印尼 / 中（不 reload，直接验证翻译表） */
      var l0 = a.lang; ['ko','id','zh'].forEach(function(k){ a.lang = k; var x = t('工作台'); ST.ok(!!x, k+' 语言翻译不应报错'); if(k!=='zh') ST.ok(x!=='工作台', k+' 语言的「工作台」应有译文，实际 '+x); }); a.lang = l0;
      /* 通知设定 */
      setMyNotify('push', false); setMyNotify('sound', false); ST.ok(a.notify.push===false && a.notify.sound===false, '通知设定应保存'); setMyNotify('push', true); setMyNotify('sound', true);
      /* 改密码：旧密码错 / 太短 / 不一致 / 成功 */
      var oldPw = a.password; var set = function(o, n, n2){ document.getElementById('pw-old').value = o; document.getElementById('pw-new').value = n; document.getElementById('pw-new2').value = n2; };
      set('wrong', 'abcdef', 'abcdef'); changeMyPassword(); ST.ok(a.password===oldPw && /当前密码不正确/.test(document.getElementById('pw-err').textContent), '旧密码错应被拒绝');
      set(oldPw, '123', '123'); changeMyPassword(); ST.ok(a.password===oldPw, '太短应被拒绝'); set(oldPw, 'newpass1', 'newpass2'); changeMyPassword(); ST.ok(a.password===oldPw, '两次不一致应被拒绝');
      set(oldPw, 'newpass1', 'newpass1'); changeMyPassword(); ST.ok(a.password==='newpass1', '正确修改后密码应变'); ST.ok(findLoginOk(a.id, 'newpass1') && !findLoginOk(a.id, oldPw), '新密码能登录、旧密码不能');
    } finally { a.name = snap.name; a.phone = snap.phone; a.position = snap.position; a.password = snap.password; a.photo = snap.photo; a.lang = snap.lang; a.notify = snap.notify; a.history = snap.history; ME_NAME = me0; syncInCoordinators && syncInCoordinators(); Store.touch(); }
  });
  function findLoginOk(id, pw){ var a = accountById(id); return !!a && a.status==='active' && a.password===pw; }

  /* ---- 34：老板 OWN（在 owner.html?demo=OWN 的分页里跑）---- */
  ST.def('S34','IN 老板 OWN：经营数据 / 账号与席位 / 验证码 / 诊所设定 / 操作 log',function(){
    var me = currentAccount(); if(!ST.ok(me && me.role==='owner', '要在老板分页里跑，当前 '+(me && me.id))) return;
    var sb = document.querySelector('.sidebar') ? document.querySelector('.sidebar').innerText : ''; ST.ok(!/案件管理|客户管理|对话|案例库|项目库/.test(sb) && /经营数据/.test(sb) && /账号管理/.test(sb) && /诊所设定/.test(sb) && /操作日志/.test(sb), '老板侧边栏应只有 经营数据 / 账号管理 / 诊所设定 / 操作日志，实际：'+sb.replace(/\n/g, '|'));
    ST.ok(!document.getElementById('in-cases') || document.getElementById('in-cases').style.display==='none', '老板分页不应有案件管理');
    /* 经营数据：只看汇总，口径 = 面诊费(各案件实收) + 赴韩定金 + 本地项目 + 印尼加做 */
    openAdminPage('bizdata'); BIZ_MONTH = 'all'; openAdminPage('bizdata', true); var body = document.getElementById('admin-body'), txt = body.innerText;
    var feeSum = CASE_ITEMS.filter(consultFeePaid).reduce(function(s, c){ return s + (consultFeeOf(c)||0); }, 0); ST.ok(txt.indexOf(fmtRp(feeSum).replace(/\s/g, ''))>-1 || txt.replace(/\s/g, '').indexOf(fmtRp(feeSum).replace(/\s/g, ''))>-1, '面诊费汇总应等于各案件实收之和 '+fmtRp(feeSum));
    var localSum = 0; CASE_ITEMS.forEach(function(c){ localSum += financePaid(c).inn; }); ST.ok(txt.replace(/\s/g, '').indexOf(fmtRp(localSum).replace(/\s/g, ''))>-1, '本地项目汇总应等于各案件本地已付之和 '+fmtRp(localSum));
    ST.ok(!/openCaseDetail|openClientDetail/.test(body.innerHTML), '经营数据不应能点进个别客人 / 案件');
    /* 账号管理 + 席位 */
    openAdminPage('accounts'); var n0 = ACCOUNTS.length; openBuyAccounts(); BUY.role = 'manager'; BUY.qty = 1; ST.ok(!buyNeedsOwnerCode(), 'OWN 自己加购管理者不需要验证码'); buyNext(); ST.ok(BUY.step==='pay', '应直接到付款'); buyPay(); var nm = ACCOUNTS[ACCOUNTS.length-1]; ST.ok(ACCOUNTS.length===n0+1 && nm.status==='pending', 'OWN 加购应成功');
    ST.ok(acctCanUnsub(nm), 'OWN 可退订加购账号'); doUnsubAcct(nm.id); ST.ok(accountById(nm.id).status==='disabled', '退订后停用');
    var mgr = ACCOUNTS.filter(function(x){ return x.role==='manager' && x.seat!=='addon' && x.clinicId===CURRENT_CLINIC_ID && x.status==='active'; })[0]; ST.ok(!!mgr && acctCanReset(mgr), 'OWN 可重设管理者密码（不会在测试里真的重设）');
    /* A1 加购管理者 → OWN 收验证码（S30 在 A1 分页里发过一次；这里检查机制） */
    PURCHASE_REQ = {code:'123456', by:'A1', qty:1, exp:Date.now()+600000, used:false}; var bn = adminBanner(); ST.ok(/123456/.test(bn), '老板页面应显示验证码横幅'); PURCHASE_REQ = null;
    /* 诊所设定同管理者；操作 log */
    ST.ok(canDo('clinic') && canDo('oplog') && canDo('accounts') && canDo('bizdata'), '老板应有诊所设定 / 操作日志 / 账号 / 经营数据权限');
    openAdminPage('oplog'); var lg = document.getElementById('admin-body').innerText; ST.ok(/购买|退订|设定变更|诊所设定/.test(lg), '操作 log 应看得到谁改了什么'); ST.ok(ACCOUNT_LOG.some(function(l){ return /退订/.test(JSON.stringify(l)) && /OWN|老板/.test(JSON.stringify(l)); }), '操作 log 应记下 OWN 的退订');
  });

  /* ---- 35：KM1 管理者（在 kr.html?demo=KM1 的分页里跑）---- */
  ST.def('S35','KR 管理者 KM1：医院设定 / 院长名单 / 代登日程与 OFF / 账号管理 / 经营数据',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑，当前 '+(me && me.id))) return;
    var hid = krHospitalIdOfMe(), h = krHData(), snap = JSON.parse(JSON.stringify({openTime:h.openTime, closeTime:h.closeTime, closedRules:h.closedRules, lunch:h.lunch}));
    try{
      /* 1 医院设定：营业时间 / 午休 / 周六 16:00 起休诊 → IN 侧换算正确 */
      openAdminPage('clinic'); window.hospSetHours('openTime', '11:00'); window.hospSetHours('closeTime', '21:30'); window.hospSetLunch('from', '13:00'); window.hospSetLunch('to', '14:00'); window.hospSetClosed(6, 'from', '16:00'); window.hospSetClosed(0, 'whole'); window.saveHospClosed();
      var hr = hospitalHours(hid); ST.ok(hr.open==='11:00' && hr.close==='21:30', '营业时间应已保存，实际 '+hr.open+'～'+hr.close); var sat = null; for(var k = 1; k < 15 && !sat; k++){ if(new Date(D(k)+'T00:00:00').getDay()===6) sat = D(k); }
      ST.ok(hospitalClosedFrom(hid, sat)==='16:00', '周六应 16:00 起休诊，实际 '+hospitalClosedFrom(hid, sat)); var kc = krToClinic(D(10), '11:00'); ST.ok((kc && kc.time ? kc.time : kc)==='09:00', '韩国 11:00 在印尼（UTC+7）应是 09:00，实际 '+JSON.stringify(kc));
      /* 2 院长名单：新增 / 停用 */
      krdOpen('new'); krdField('name', 'T2院长'); krdField('nameEn', 'T2 Doctor'); krdField('specialties', ['鼻整形']); krdSave(); var nd = hospitalDirectors(hid).filter(function(x){ return x.name==='T2院长'; })[0]; ST.ok(!!nd && nd.active, '应新增院长');
      ST.ok(directorCardsHtml && hospitalDirectorNames(hid).indexOf('T2院长')>-1, '新院长应出现在 IN 选院长的名单里'); krdToggleActive(nd.id); ST.ok(!nd.active && hospitalDirectorNames(hid).indexOf('T2院长')<0, '停用后 IN 选院长名单里不应再有');
      krdToggleActive(nd.id); hospitalDirectors(hid).splice(hospitalDirectors(hid).indexOf(nd), 1);
      /* 3 日程：代登 OFF / 不可预约；与已有施术重叠挡下 */
      var surg = Object.keys(h.directorSchedule||{}).map(function(n){ return (h.directorSchedule[n]||[]).filter(function(b){ return b.type==='施术' || b.kind==='施术'; }).map(function(b){ return Object.assign({who:n}, b); }); }).reduce(function(a, b){ return a.concat(b); }, [])[0];
      if(ST.ok(!!surg, '应有一个已排的施术块用来测重叠')){
        KRC.pop = {date:surg.date}; KRC.popForm = {who:surg.who, start:surg.time, end:surg.end, part:'全天'}; var n0 = (h.directorSchedule[surg.who]||[]).length; krcAddBusy(); ST.ok((h.directorSchedule[surg.who]||[]).length===n0, '与施术重叠的不可预约应被挡下');
        KRC.pop = {date:surg.date}; KRC.popForm = {who:surg.who, start:'10:00', end:'11:00', part:'全天'}; var o0 = (h.offs||[]).length; krcAddOff(); ST.ok((h.offs||[]).length===o0, '有施术的当天标全天 OFF 应被挡下');
      }
      var free = null; for(var d1 = 20; d1 < 60 && !free; d1++){ var dd = D(d1); if(new Date(dd+'T00:00:00').getDay()!==0 && !((h.directorSchedule['KD1 院长']||[]).some(function(b){ return b.date===dd; }))) free = dd; }
      KRC.pop = {date:free}; KRC.popForm = {who:'KD1 院长', start:'12:00', end:'12:30', part:'全天'}; var b0 = (h.directorSchedule['KD1 院长']||[]).length; krcAddBusy(); ST.ok((h.directorSchedule['KD1 院长']||[]).length===b0+1, '空的日子应能代登不可预约');
      KRC.pop = {date:free}; KRC.popForm = {who:'KD1 院长', start:'12:00', end:'12:30', part:'上午'}; var o1 = (h.offs||[]).length; krcAddOff(); ST.ok((h.offs||[]).length===o1+1, '应能代登半天 OFF');
      /* 开放施术日期 */
      KRC.person = 'KD1 院长'; var arr0 = ((h.openDates||{})['KD1 院长']||[]).length; krcMonthClick(free); ST.ok(((h.openDates||{})['KD1 院长']||[]).length !== arr0, '单一院长视角点日期应能开放 / 关闭施术'); krcMonthClick(free); KRC.person = 'all';
      /* 4 账号管理 */
      openAdminPage('accounts'); var accTxt = document.getElementById('admin-body').innerText; var hasActions = /购买|加购|退订|重设|换使用人/.test(document.getElementById('admin-body').innerHTML) && !!document.querySelector('#admin-body button[onclick*="openBuyAccounts"], #admin-body button[onclick*="openAcctDetail"], #admin-body [onclick*="openAcctDetail"]');
      ST.ok(hasActions, 'KR 账号管理应有 邀请 / 停用 / 换使用人 / 重设密码 / 加购院长账号 的操作入口');
      var hacc = hospitalAccounts(hid), nA = ACCOUNTS.length; openBuyAccounts(); BUY.role = 'kr_director'; BUY.qty = 1; buyNext(); ST.ok(BUY.step==='pay', '加购院长账号应直接到付款'); buyPay(); var na = ACCOUNTS[ACCOUNTS.length-1];
      ST.ok(ACCOUNTS.length===nA+1 && na.status==='pending' && na.role==='kr_director' && na.hospitalId===hid && /^KD\d+$/.test(na.id), '应生成待激活的院长账号 KDn，实际 '+(na && na.id)); ST.ok(acctCanUnsub(na), '加购院长账号可退订'); doUnsubAcct(na.id); ST.ok(accountById(na.id).status==='disabled', '退订后应停用');
      var ko = hacc.filter(function(x){ return x.role==='kr_owner'; })[0], kc1 = accountById('KC1'); ST.ok(!acctCanReset(ko), '代表院长账号不能被重设'); ST.ok(kc1 && acctCanReset(kc1), '室长账号可被管理者重设');
      openBuyAccounts(); BUY.role = 'kr_manager'; BUY.qty = 1; ST.ok(buyNeedsOwnerCode(), 'KM1 加购管理者应需要代表院长验证码'); buyNext(); ST.ok(BUY.step==='code' && !!purchaseReq(), '应进入验证码步骤'); var code = purchaseReq().code; document.getElementById('buy-code').value = code; buyVerify(); ST.ok(BUY.step==='pay', '正确验证码放行'); buyPay(); var nm = ACCOUNTS[ACCOUNTS.length-1]; ST.ok(/^KM\d+$/.test(nm.id) && nm.status==='pending', '应生成待激活的管理者账号'); doUnsubAcct(nm.id);
      /* 5 经营数据：医院收入 = 尾款 + 韩国加做 */
      openAdminPage('bizdata'); var bt = document.getElementById('admin-body').innerText; ST.ok(/尾款/.test(bt) && /加做/.test(bt), '经营数据应写出 尾款 / 韩国加做 的口径'); ST.ok(!/openCase|krOpenCase/.test(document.getElementById('admin-body').innerHTML), '经营数据不应能点进个别案件');
      /* 6 操作 log */
      openAdminPage('oplog'); ST.ok(/院长|日程|医院设定|设定变更/.test(document.getElementById('admin-body').innerText), '操作 log 应看到上面这些修改');
    } finally { Object.assign(h, snap); HOSP_DRAFT = null; Store.touch(); }
  });

})();
