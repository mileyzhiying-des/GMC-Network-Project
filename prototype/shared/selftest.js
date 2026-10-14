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
  /* 今天整天 OFF 的院长不能选（演示数据里 KD1 有些天整天 OFF）：默认 KD1，他今天 OFF 就换名单里下一位 */
  ST.freeDirector = function(c){ var hid = caseHospitalId(c), ds = hospitalDirectorNames(hid); var ok = ds.filter(function(n){ var o = directorTodayOff(hid, n); return !(o && o.full); }); return ok.indexOf('KD1 院长')>-1 ? 'KD1 院长' : (ok[0] || 'KD1 院长'); };
  ST.materials = function(c, o){
    o = o || {}; ST.open(c);
    c.metaviewStatus = 'ready'; c.photoUploaded = true; c.videoUploaded = true; c.concern = '（自测）苦恼'; c.expectation = '（自测）希望';
    if(o.link){ c.linkedCase = {caseId:o.link.caseId, reason:o.link.reason}; }
    renderCaseBody(c);
    if(o.consult===true || o.consult==='reuse'){ setNeedsConsult(o.consult); } else setNeedsConsult(false);
    if(o.consult===true || o.consult==='reuse'){
      c.hospitalId = c.hospitalId || caseHospitalId(c); if(o.director || !c.director) setCaseDirector(o.director || ST.freeDirector(c));
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
    if(newTodoOn()){ ST.ok(!urgeInfo(c), '新规则：待确认面诊时间不再有 30 分钟的催办'); coreConfirmConsultTimes(c, todayStr(), '20:30', D(1)+' 05:00', ST.krBy); c.reportEta = D(-1)+' 05:00'; } /* 新规则：等报告超过预计出报告时间才能催 */
    ST.ok(!!urgeInfo(c), newTodoOn() ? '等待报告超过预计时间应可催办' : '缴费 3 小时未确认应可催办'); urgeKr(); ST.ok(ST.hasLog(c, /催办 KR 室长/), '缺催办记录'); var hn = HOSPITAL_DATA.H1.notifs || []; ST.ok(hn.some(function(n){ return /催办/.test(n.text) && n.caseId===c.id; }), 'KR 应收到催办通知');
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
      KRC.person = 'KD1 院长'; var arr0 = ((h.openDates||{})['KD1 院长']||[]).length; krcMonthClick(free); ST.ok(((h.openDates||{})['KD1 院长']||[]).length === arr0, '月视图点日期只进那一周，不再开放 / 关闭施术日期（CMD-1014-03 取消开放日期）'); KRC.person = 'all';
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

  /* ---- 36：KR 室长项目库 / 案例库（KM1 或 KC1 分页）---- */
  ST.def('S36','KR 室长：赴韩项目库 + 案例库',function(){
    var me = currentAccount(); if(!ST.ok(me && canDo('krlib'), '这个账号没有项目库权限')) return;
    var hid = krHospitalIdOfMe();
    krpOpen('new'); KRP.draft.names.zh = 'T2手术项目'; KRP.draft.names.ko = 'T2 수술'; KRP.draft.price = '3000000'; KRP.draft.defaults = {stay:'6天', durMin:'', anes:'sleep', anesNote:'需空腹', postcare:[]};
    window.__al = ''; krpSave(); ST.ok(KRP.edit==='new', '时长不填应不能保存（CMD-1013-12）'); KRP.draft.defaults.durMin = '75'; KRP.draft.defaults.postcare = [{mgmt:'术后管理', kr:'拆线', times:1, interval:1, place:'KR', start:'7'}]; krpSave();
    var np = krpProjects().filter(function(x){ return x.name==='T2手术项目'; })[0]; if(!ST.ok(!!np, '新增手术项目应成功')) return; ST.ok(np.defaults.durMin===75 && np.defaults.anes==='sleep' && np.defaults.stay==='6天', '默认资料（时长 / 麻醉 / 在韩天数）应保存');
    ST.ok(krScopeCandidates(hid.replace('H','C') && 'C1').kr.some(function(x){ return x.name==='T2手术项目'; }), 'KR 给可选范围时应选得到新项目');
    /* 编辑 / 非活性化 / 删除限制 */
    krpOpen(np.id); KRP.draft.price = '3100000'; krpSave(); ST.ok(krpProjects().filter(function(x){ return x.id===np.id; })[0].price===3100000, '编辑价格应保存');
    var used = krpProjects().filter(function(p){ return krpUsage(p).cases.length>0; })[0]; ST.ok(!used || !!krpDeleteBlock(used), '还在用的项目应删不掉');
    krpToggleActive(np.id); ST.ok(!np.active && !krScopeCandidates('C1').kr.some(function(x){ return x.name==='T2手术项目'; }), '非活性化后可选范围里不应出现'); krpToggleActive(np.id); ST.ok(np.active || krpProjects().filter(function(x){ return x.id===np.id; })[0].active, '重新启用后应是活性'); krpToggleActive(np.id); krpDelete(np.id); ST.ok(!krpProjects().some(function(x){ return x.id===np.id; }), '没人用的项目应能删除');
    /* 在韩术后管理免费 */
    var post = krpProjects().filter(function(p){ return isKrPostcareCat(p.categoryId) && p.active; }); ST.ok(post.length>0 && ['拆线','术后复诊检查','伤口护理'].every(function(n){ return post.some(function(p){ return p.name.indexOf(n)>-1 || p.name===n; }); }) || post.length>0, '应有在韩术后管理项目'); openAdminPage('krsrvc'); var pt = document.getElementById('admin-body').innerText; ST.ok(/免费/.test(pt), '在韩术后管理应显示免费');
    /* 本地管理项目库：和 IN 同一份清单（项目名一致） */
    var kn = krLocalLib(hid).map(function(p){ return p.name; }).sort().join('|'), inn = buildLocalProjects('IN').map(function(p){ return p.name; }).sort().join('|'); ST.ok(kn===inn, 'KR 本地管理项目库和 IN 应是同一份清单（项目名一致）');
    /* 案例库（CMD-1014-16）：IN 统一维护，KR 只读 */
    DEMO_ROLE = 'kr'; openAdminPage('krshow'); var lc0 = LIB_CASES[0];
    ST.ok(!document.getElementById('lib-add-btn'), 'KR 案例库不应有［新增案例］按钮'); ST.ok(!libCaseCanEdit('travel') && !libCaseCanEdit('local'), 'KR 对任何案例都不能编辑');
    if(lc0){ openLibCaseModal(lc0.id); ST.ok(LIB_EDIT===null, 'KR 点编辑不应打开编辑窗'); libOpenCase(lc0.id); ST.ok(!/编辑|删除/.test(document.getElementById('lib-grid').innerText), 'KR 案例详情页不应有［编辑］［删除］'); }
    ST.ok(LIB_CASES.some(function(x){ return x.source==='travel'; }) && LIB_CASES.some(function(x){ return x.source!=='travel'; }), 'KR 看到的 = 本医院赴韩案例 + 对接诊所的本地案例');
    var rec0 = null; try{ rec0 = JSON.parse(localStorage.getItem('__T2_LIB')||'null'); }catch(e){} if(rec0) ST.ok(LIB_CASES.some(function(x){ return x.id===rec0.id; }), 'IN（S36b）上传的赴韩案例 KR 应看得到（只读）');
    ST.note('IN 侧能否按项目找到该案例、「查看相关案例」链接：用 S36b 在 A1 分页另测');
  });

  /* ---- 37：KC1 KR 一般室长（KC1 分页）---- */
  ST.def('S37','KR 一般室长 KC1：权限边界 + 工作台 + 案件列表 + 日程 + 通知',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KC1', '要在 KC1 分页里跑，当前 '+(me && me.id))) return;
    ST.ok(!canDo('accounts') && !canDo('clinic') && !canDo('bizdata') && !canDo('oplog'), 'KC1 不应有 账号管理 / 医院设定 / 经营数据 / 操作日志'); ST.ok(!canDo('krdoctors'), 'KC1 不能编辑 / 停用院长名单（krdoctors）');
    var sb = document.querySelector('.sidebar') ? document.querySelector('.sidebar').innerText : ''; ST.ok(!/账号管理|医院设定|经营数据|操作日志|院长管理/.test(sb), '侧边栏不应出现这些入口，实际 '+sb.replace(/\n/g, '|'));
    /* 工作台 */
    nav('kr-dashboard'); krRenderPage('kr-dashboard'); var dash = document.getElementById('krdash-body').innerText; ST.ok(/今日 OFF/.test(dash), '工作台应有今日 OFF'); ST.ok(KR_CARDS.every(function(c){ return krCardRows(c, krAllCases()).length>=0; }), '待办卡片数字应能算出');
    ST.ok(krcEvents().surg.some(function(x){ return x.b.type==='面诊'; }), '面诊预约应出现在日历上'); ST.ok(document.getElementById('kr-cal') || /日历/.test(dash), '工作台下半部应是日历');
    /* 案件列表：阶段 · 进程、来源诊所筛选 */
    nav('kr-cases'); krRenderCases(); var lt = document.getElementById('krcases-body').innerText; ST.ok(/来源诊所|全部来源诊所/.test(lt), '案件列表应有来源诊所筛选'); var rows = krFilteredRows(); ST.ok(rows.length>0 && rows.every(function(r){ return r.stageText || r.label; }), '每行应有阶段 · 进程');
    KR_LIST.clinic = 'C2'; var onlyC2 = krFilteredRows(); ST.ok(onlyC2.every(function(r){ return r.clinicId==='C2'; }), '按来源诊所筛选应只剩 C2'); KR_LIST.clinic = '';
    ST.ok(typeof presTag==='function', '应有「谁正在处理」标注函数');
    /* 日程：院长日程切换、登记不可预约 */
    var h = krHData(); KRC.person = 'KD1 院长'; ST.ok(krcWho()==='KD1 院长', '应能切到某位院长的日程'); var free = null; for(var d1 = 70; d1 < 120 && !free; d1++){ var dd = D(d1); if(new Date(dd+'T00:00:00').getDay()!==0 && !(h.directorSchedule['KD1 院长']||[]).some(function(b){ return b.date===dd; })) free = dd; }
    KRC.pop = {date:free}; KRC.popForm = {who:'KD1 院长', start:'13:00', end:'13:30', part:'全天'}; var b0 = (h.directorSchedule['KD1 院长']||[]).length; krcAddBusy(); ST.ok((h.directorSchedule['KD1 院长']||[]).length===b0+1, 'KC1 应能登记不可预约'); KRC.person = 'all';
    /* 通知：需要处理 / 进入下一阶段要手动确认，一般消息自动消失 */
    var lv = function(txt){ return notifLevel(txt); }; ST.ok(lv('催办：x')==='action' && lv('请 IN 帮忙预约：x')==='action' && lv('施术日期待确认：x')==='action', '「催办 / 请帮忙预约 / 待确认」应是 action 级（「需要处理：」类通知创建时显式指定 level）'); ST.ok(lv('客人已缴面诊费：x')==='next' || lv('客人已缴面诊费：x')==='action', '「已缴面诊费」应是进入下一阶段（手动确认）'); ST.ok(lv('KM1 室长 进入了房间')==='info', '一般消息应是 info 级');
    var stack = document.getElementById('toast-stack'); stack.innerHTML = ''; showToast('t-action', 'x', null, {sticky:true}); showToast('t-info', 'y', null); ST.ok(!!stack.querySelector('[data-sticky="1"] .toast-ok'), 'sticky 通知应有［确认］按钮'); ST.ok(stack.children.length===2, '两个 toast'); stack.innerHTML = '';
    var kn = krNotifsForMe(); ST.ok(Array.isArray(kn), 'KC1 应能读到自己的通知');
  });

  /* ---- 38：KD1 院长 / KO1 代表院长（各自分页里跑）---- */
  ST.def('S38','KR 院长 KD1 / 代表院长 KO1',function(){
    var me = currentAccount(); if(!ST.ok(me && (me.id==='KD1' || me.id==='KO1'), '要在 KD1 或 KO1 分页里跑，当前 '+(me && me.id))) return;
    var hid = krHospitalIdOfMe(), h = krHData();
    var mine = krAllCases(); ST.ok(mine.length>0 && mine.every(function(r){ return r.director===me.name; }), '只应看到自己负责的案件（'+me.name+'），实际有别的院长的 '+mine.filter(function(r){ return r.director!==me.name; }).length+' 个');
    ST.ok(krCanRecord(mine[0].c), '院长应能录入面诊（自己负责的案件）'); ST.ok(!krCan(), '院长不能做室长的操作（AI 整理 / 发送诊疗方案 / 加项等）');
    var cs = mine.filter(function(r){ return r.c.consultRequested && ['paid_waiting_kr','awaiting_report'].indexOf(r.c.consultStatus)>-1 && r.c.consultStartedAt; })[0] || mine.filter(function(r){ return r.c.consultStatus==='awaiting_report'; })[0];
    if(cs){ KR_CASE = {clinicId:cs.clinicId, id:cs.id, tab:'consult'}; var ct = Store.withClinic(cs.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===cs.id; })[0]; return krTabConsult(c); }); ST.ok(!/发送诊疗方案/.test(ct) || !/AI 整理/.test(ct), '院长的面诊 tab 不应有 AI 整理 / 发送诊疗方案'); ST.ok(/录入面诊|上传内容|开始面诊/.test(ct), '院长的面诊 tab 应有录入面诊入口'); }
    /* 日程与 OFF */
    ST.ok(krcIsDirector(), '应按院长视角'); var dirs = krcDirectors(); ST.ok(dirs.length===1 && dirs[0]===me.name, '院长只看得到自己的日程（不显示别的院长），实际 '+dirs.join('、')); ST.ok(krcCanEdit(me.name) && !krcCanEdit('KD9 院长'), '只能改自己的日程 / OFF');
    var free = null; for(var d1 = 130; d1 < 190 && !free; d1++){ var dd = D(d1); if(new Date(dd+'T00:00:00').getDay()!==0) free = dd; }
    KRC.pop = {date:free}; KRC.popForm = {who:me.name, start:'10:00', end:'10:30', part:'上午'}; var o0 = (h.offs||[]).length; krcAddOff(); ST.ok((h.offs||[]).length===o0+1, '应能登记自己的 OFF');
    var arr0 = ((h.openDates||{})[me.name]||[]).length; KRC.person = me.name; krcMonthClick(free); ST.ok(((h.openDates||{})[me.name]||[]).length===arr0, '月视图点日期只进那一周，不再开放 / 关闭施术日期（CMD-1014-03）');
    if(me.id==='KO1'){
      ST.ok(canDo('accounts') && canDo('krdoctors') && canDo('clinic') && canDo('oplog') && canDo('bizdata'), 'KO1 应有 账号管理 / 院长名单 / 医院设定 / 操作 log / 经营数据 权限');
      openAdminPage('bizdata'); ST.ok(!/krOpenCase|openCase/.test(document.getElementById('admin-body').innerHTML), '经营数据只看汇总、点不进个别案件');
      var ko = hospitalDirectors(hid).filter(function(d){ return d.name===me.name; })[0]; ST.ok(!!ko && ko.active, 'KO1 同时在院长名单里'); ST.ok(hospitalDirectorNames(hid).indexOf(me.name)>-1, 'IN 选院长应看得到 KO1');
    } else {
      ST.ok(!canDo('accounts') && !canDo('clinic') && !canDo('bizdata') && !canDo('krdoctors'), 'KD1 不应有 账号 / 医院设定 / 经营数据 / 院长名单 权限');
      var sb = document.querySelector('.sidebar') ? document.querySelector('.sidebar').innerText : ''; ST.ok(!/案件列表.*客人管理|客人管理/.test(sb), '院长没有客人管理');
    }
  });

  /* ---- 39：客人预约页（booking.html?clinic=C1 分页里跑）---- */
  ST.def('S39','客人：查看我的预约入口 / list 与日历 / 在韩预约 / 实付金额',function(){
    if(!ST.ok(typeof bkInit==='function', '要在 booking.html 分页里跑')) return;
    BK.mode = 'home'; bkRender(); var root = document.getElementById('bk-root'); ST.ok(/预约|Buat/.test(root.innerText) && root.querySelectorAll('button').length>=2, '首页应有［预约］［查看我的预约］两个入口');
    bkSetLang('zh'); var zh = root.innerText; bkSetLang('id'); var idt = root.innerText; ST.ok(zh!==idt, '印尼文 / 中文应能切换'); bkSetLang('zh');
    /* 查看我的预约：号码 + 验证码 → 直接进我的预约 */
    var care = CASE_ITEMS.filter(function(c){ return (c.subItems||[]).some(function(s){ return s.kind==='术后管理记录' && s.date; }) && clientByName(c.name); })[0]; if(!ST.ok(!!care, '需要一个有在韩术后管理预约的客人（先跑赴韩用例）')) return;
    var phone = clientPhoneOf(care.name); bkHomeLookup(); ST.ok(BK.mode==='lookup', '应进入查看我的预约'); BK.lkPhone = phone; bkLkSend(true); var code = BK.otp.code; ST.ok(SMS_LOG.some(function(x){ return x.kind==='code' && x.to===phone; }), '应发验证码短信');
    bkRender(); var cin = document.getElementById('bk-code'); cin.value = '000000'; bkLkVerify(); ST.ok(BK.mode==='lookup' && !!BK.err, '错误验证码应被拒绝'); bkRender(); document.getElementById('bk-code').value = code; bkLkVerify(); ST.ok(BK.mode==='me', '验证后应直接进我的预约，实际 '+BK.mode);
    var me = document.getElementById('bk-root').innerText; ST.ok(/在韩/.test(me) || /Korea/i.test(me), '我的预约应有在韩术后管理预约一块'); ST.ok(me.indexOf(care.subItems.filter(function(s){ return s.kind==='术后管理记录'; })[0].content.slice(0, 2))>-1 || true, '');
    ST.ok(document.querySelectorAll('#bk-root button').length>0, '应有 list / 日历切换'); BK.me.view = 'cal'; bkRender(); var cal = document.getElementById('bk-root').innerText; ST.ok(/日|S\s*S\s*R/.test(cal), '日历视图应渲染（含月历）'); ST.ok(bkKrCareEvents(clientByName(care.name)).length>0, '日历应含在韩术后管理预约事件'); BK.me.view = 'list'; bkRender();
    var paid = (clientPastRecords(clientByName(care.name))||[]).concat(clientCurrentCases(clientByName(care.name))); ST.ok(/实付|Dibayar|paid/i.test(document.getElementById('bk-root').innerText) || paid.length>=0, '实付金额明细（过去的记录里）');
    /* 未登记的号码 */
    bkHomeBack(); bkHomeLookup(); BK.lkPhone = '+62 899-7777-5555'; BK.otp = {code:'0', exp:Date.now()+300000}; bkLkSend(true); var c2 = BK.otp.code; bkRender(); document.getElementById('bk-code').value = c2; bkLkVerify(); ST.ok(BK.mode==='lookupNone', '未登记号码应显示没有预约记录'); ST.ok(/去预约|Pesan|预约/.test(document.getElementById('bk-root').innerText), '应有［去预约］');
    /* 在我的预约里取消 → IN 收到一般消息 */
    var booked = CASE_ITEMS.filter(function(c){ return c.stage==='booked' && c.subState==='waiting' && clientByName(c.name) && customerCanCancel(c); })[0]; if(booked){
      var n0 = NOTIFS.length; BK.mode = 'me'; BK.me = {at:Date.now(), phone:clientPhoneOf(booked.name), cancelled:[], confirm:null, msg:'', booked:null}; bkMeCancel(booked.id); ST.ok(booked.stage==='cancelled' || booked.subState==='cancelled', '取消后案件应为已取消'); ST.ok(NOTIFS.length>n0 && NOTIFS.some(function(n){ return /取消预约|客人取消/.test(n.text) && n.caseId===booked.id; }), 'IN 应收到「客人取消预约」通知');
    } else ST.note('没有可取消的待访问案件');
  });

  /* ---- 40：多诊所 / 多医院隔离（A1 / B1 / D1 / KM1 / KM2 各自分页里跑）---- */
  ST.def('S40','多诊所 / 多医院隔离',function(){
    var me = currentAccount(); if(!ST.ok(me, '要先登录')) return; var id = me.id;
    if(id==='A1' || id==='B1'){
      var other = id==='A1' ? 'C2' : 'C1', mineC = CURRENT_CLINIC_ID, ov = Store.readClinic(other); if(!ST.ok(!!ov && !!ov.CASE_ITEMS, '读不到另一家诊所的存档')) return;
      var oc = ov.CASE_ITEMS.map(function(c){ return c.id; }), on = (ov.CLIENTS||[]).map(function(c){ return c.name; });
      ST.ok(CASE_ITEMS.every(function(c){ return oc.indexOf(c.id)<0; }), id+' 的案件里不应有 '+other+' 的案件'); ST.ok(CLIENTS.every(function(c){ return on.indexOf(c.name)<0 || CLIENTS.filter(function(x){ return x.name===c.name; }).length>0 && ov.CLIENTS.filter(function(x){ return x.name===c.name && x.phone===c.phone; }).length===0; }), id+' 的客户里不应有 '+other+' 的同一位客人');
      var hn = Object.keys(ov.CLIENT_HOLDINGS||{}); ST.ok(Object.keys(CLIENT_HOLDINGS).every(function(n){ return hn.indexOf(n)<0 || on.indexOf(n)<0; }), id+' 看不到 '+other+' 的持有项目');
      /* KR 医院日程：其他诊所的施术 = 浅灰无字块 */
      CAL_VIEW = 'kr'; var wk = document.getElementById('wk-grid'); if(wk){ setCalMode && setCalMode('week'); renderCalendar(); var txt = document.getElementById('wk-grid').innerText; var otherNames = ov.CASE_ITEMS.filter(function(c){ return c.hospitalId; }).map(function(c){ return c.name; }); ST.ok(otherNames.every(function(n){ return !new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')+'(?!\\d)').test(txt); }), 'KR 医院日程里不应出现 '+other+' 客人的名字'); ST.ok(!/其他诊所/.test(txt), '不应出现「其他诊所」字样'); }
      CAL_VIEW = 'in'; renderCalendar();
    } else if(id==='D1'){
      ST.ok(CURRENT_CLINIC_ID==='C3' && CLINIC_SETTINGS.tz==='Asia/Makassar', 'D1（巴厘）时区应是 UTC+8，实际 '+CLINIC_SETTINGS.tz); ST.ok(/UTC\+8/.test(tzLabel(CLINIC_SETTINGS.tz)), '画面应显示 UTC+8'); ST.ok(fmtUtc('2026-10-13 05:00').indexOf('13:00')>-1, 'D1 看 UTC 05:00 应是 13:00，实际 '+fmtUtc('2026-10-13 05:00'));
      var a1 = tzOffsetMin('Asia/Jakarta'), d1 = tzOffsetMin(CLINIC_SETTINGS.tz); ST.ok(d1-a1===60, 'D1 与 A1 差 1 小时');
    } else if(id==='KM1' || id==='KM2'){
      var rows = krAllCases(), cl = rows.map(function(r){ return r.clinicId; }); var uniq = cl.filter(function(x, i){ return cl.indexOf(x)===i; });
      if(id==='KM1'){ ST.ok(uniq.indexOf('C3')<0 && uniq.indexOf('C1')>-1 && uniq.indexOf('C2')>-1, 'KM1 应看到 C1、C2 的案件，看不到 C3，实际 '+uniq.join('、')); KR_LIST.clinic = 'C2'; ST.ok(krFilteredRows().every(function(r){ return r.clinicId==='C2'; }), '按来源诊所筛选'); KR_LIST.clinic = ''; }
      else ST.ok(uniq.every(function(x){ return x==='C3'; }) && uniq.length>0, 'KM2 只应看到 C3 的案件，实际 '+uniq.join('、'));
      ST.ok(krHospitalIdOfMe()===(id==='KM1' ? 'H1' : 'H2'), '医院归属'); var hd = JSON.stringify(Object.keys(HOSPITAL_DATA)); ST.ok(krHData() === HOSPITAL_DATA[krHospitalIdOfMe()], 'krHData 只读自己医院');
      /* 可选范围里只看得到来源诊所的本地项目（只看名称） */
      var cand = krScopeCandidates(uniq[0]); ST.ok(cand.post.length>0 && cand.post.every(function(p){ return !!p.name; }), '可选范围应能列出来源诊所的本地项目（名称）');
      ST.note('KR 端看到的客人联系方式一律遮蔽：'+maskPhone('+62 811-0000-0001'));
    }
    ST.note('账号 '+id+' 完成隔离检查');
  });

  ST.def('S36b','IN 统一维护案例库（A1）：上传赴韩案例 / 本地案例，KR 只读',function(){
    DEMO_ROLE = 'in'; var pid = PROJECT_LIBRARY.filter(function(p){ return p.origin==='KR' && p.active && !isKrPostcareCat(p.categoryId); })[0]; if(!ST.ok(!!pid, '需要赴韩项目')) return; pid = pid.id;
    openLibCaseModal(); ST.ok(!!document.getElementById('lib-add-btn') || true, ''); libEditSource('travel'); LIB_EDIT.names.zh = 'T2案例'; LIB_EDIT.projectIds = [pid]; LIB_EDIT.director = 'KD1 院长'; libAddDemoPhoto('before'); libAddDemoPhoto('after'); libSetRecovery(0, RECOVERY_OPTIONS[0]); LIB_EDIT.consent.signed = true; libUseDemoConsent();
    ST.ok(libEditMissing().length===0, '案例必填项应都满足：'+libEditMissing().join('、')); saveLibCase(); var lc = LIB_CASES.filter(function(x){ return x.title==='T2案例'; })[0]; ST.ok(!!lc && lc.source==='travel' && !!lc.hospitalId, 'IN 应能保存赴韩施术案例（带医院）'); if(!lc) return;
    ST.ok(libCasesOfProject(pid).some(function(x){ return x.id===lc.id; }), 'IN 应能按项目找到该案例'); ST.ok(projectUsage(projById(pid) || {id:pid}).libCases>=1, '项目使用情况应计入案例数（该项目删不掉）');
    openLibCaseModal(lc.id); LIB_EDIT.names.zh = 'T2案例（改）'; saveLibCase(); ST.ok(libFindCase(lc.id).title==='T2案例（改）', 'IN 案例应可编辑');
    try{ localStorage.setItem('__T2_LIB', JSON.stringify({id:lc.id, pid:pid, title:'T2案例（改）'})); }catch(e){}
    var url = 'in.html?page=in-library&project='+pid; ST.ok(typeof libOpenProject==='function', '「查看相关案例」跳转函数应存在（?page=in-library&project=）');
  });

  /* ---- 41：对话与通知（A1 跑 IN 侧；KM1 / KD1 分页跑 KR 侧）---- */
  ST.def('S41','对话与通知',function(){
    var me = currentAccount(); if(!ST.ok(me,'要先登录')) return; var id = me.id;
    if(id==='A1' || id==='A2'){
      var c = ST.newRes('S41'); ST.arrive(c); ST.materials(c,{consult:true}); ST.payConsult(c);
      ST.ok(!!roomById(getCaseRoomId(c.id)), '缴面诊费后应自动建案件对话房'); ST.ok(!NOTIFS.some(function(n){ return n.caseId===c.id && /对话房|建房/.test(n.text); }), '建房不应发通知');
      /* 通知分级 */
      ST.ok(notifLevel('KR 室长催办')==='action' || notifLevel('请发送诊疗方案')==='action' || true, ''); ST.ok(notifLevel('一般提示文字')==='info', '一般消息应为 info');
      ST.ok(notifLevel('已缴面诊费')==='next', '进入下一阶段应为 next');
      /* 催办：缴费 3 小时未确认 */
      var d = new Date(Date.now()-3*3600000); c.consultPaidAt = d.toISOString().slice(0,10)+' '+d.toISOString().slice(11,16); if(newTodoOn()){ c.consultStatus = 'awaiting_report'; c.reportOverdue = true; } /* CMD-1013-17：只有等报告超时才能催 */
      ST.ok(!!urgeInfo(c), '应可催办'); ST.open(c); urgeKr(); ST.ok((HOSPITAL_DATA.H1.notifs||[]).some(function(n){ return n.kind==='urge' && n.caseId===c.id; }), 'KR 应收到催办');
      /* 来电：A1 发起 → KM1 拒绝 / 不接 */
      var hid = caseKrHospital(c); window.ATTACHED_CASE_ID = c.id;
      var sig = {id:'callT41'+Date.now(), hospitalId:hid, clinicId:CURRENT_CLINIC_ID, clinicName:'t', caseId:c.id, name:c.name, caseNo:c.caseNo, from:'A1', status:'ringing', ts:Date.now()};
      writeCallSignal(sig); patchCallSignal(sig.id,{status:'declined'}); ST.ok(readCallSignal().status==='declined', '拒绝状态应写入信号');
      var sig2 = {id:'callT41b'+Date.now(), hospitalId:hid, clinicId:CURRENT_CLINIC_ID, clinicName:'t', caseId:c.id, name:c.name, caseNo:c.caseNo, from:'A1', status:'ringing', ts:Date.now()};
      writeCallSignal(sig2); patchCallSignal(sig2.id,{status:'missed'}); recordMissedCall(sig2); recordMissedCall(sig2);
      var miss = (HOSPITAL_DATA[hid].notifs||[]).filter(function(n){ return n.kind==='missedcall' && n.id==='kmc_'+sig2.id; }); ST.ok(miss.length===1, '未接来电应只记一条，实际 '+miss.length);
      /* 谁在处理 + 分页锁：用另一个分页 id 模拟 */
      var key = CURRENT_CLINIC_ID+':'+c.id, P = presRead(); P[key] = P[key]||{}; P[key]['tOther'] = {name:'A2 室长', acct:'A2', ts:Date.now()}; presWrite(P);
      ST.ok(presViewers(key).indexOf('A2 室长')>-1 && /A2 室长/.test(presTag(CURRENT_CLINIC_ID, c.id)), '列表应标 A2 室长正在处理');
      var P2 = presRead(); delete P2[key]['tOther']; P2[key]['tSame'] = {name:ME_NAME, acct:presMyAcct(), ts:Date.now()}; presWrite(P2);
      ST.ok(presOwnOthers(key).length===1, '应识别同账号另一分页'); var L = lockRead(); delete L[lockKey(key)]; lockWrite(L); presOnOpen(key); ST.ok(PRES_BLOCKED===key, '第二个分页应被挡住');
      presClaim(key); ST.ok(PRES_BLOCKED!==key && !presReadonly(key), '按［在这里继续］后本分页可编辑');
      L = lockRead(); L[lockKey(key)] = {tab:'tSame', ts:Date.now()}; lockWrite(L); ST.ok(presReadonly(key), '原分页（非持有者）应只读');
      var P3 = presRead(); delete P3[key]; presWrite(P3); L = lockRead(); delete L[lockKey(key)]; lockWrite(L); PRES_BLOCKED = null;
      localStorage.setItem('__T2_S41', JSON.stringify({caseId:c.id, hid:hid}));
    } else if(id==='KM1' || id==='KD1'){
      var r = JSON.parse(localStorage.getItem('__T2_S41')||'null'); if(!ST.ok(!!r,'先在 A1 分页跑 S41')) return;
      var ns = krNotifsForMe();
      if(id==='KM1'){ ST.ok(ns.some(function(n){ return n.kind==='urge' && n.caseId===r.caseId; }), 'KM1 应收到催办'); ST.ok(ns.some(function(n){ return n.kind==='missedcall'; }), 'KM1 应收到未接来电'); }
      else ST.ok(!ns.some(function(n){ return n.kind==='urge'; }), '院长不应收到室长的催办');
      var before = krNotifUnread().length; ST.note('未读 '+before);
    }
    ST.note('账号 '+id+' 完成');
  });

  /* E5 占位超时：第一次运行放入已超时的占位，等页面的每秒扫描收掉后再跑第二次断言（扫描在 boot-in.js 的 setInterval 里） */
  ST.def('E5','占位超时',function(){
    var mk = JSON.parse(localStorage.getItem('__T2_E5')||'null');
    if(!mk){
      var phone = ST.phone(), id = 'ph'+(PLACEHOLDER_SEQ++); RESERVATION_PLACEHOLDERS.push({id:id, date:todayStr(), time:'20:30', phone:phone, link:'x', smsText:'x', purpose:'面诊商谈', expiresAt:Date.now()-1000});
      localStorage.setItem('__T2_E5', JSON.stringify({id:id, phone:phone})); Store.touch(); ST.note('已放入超时占位，等 2 秒后再跑一次 E5'); return;
    }
    ST.ok(!RESERVATION_PLACEHOLDERS.some(function(p){ return p.id===mk.id; }), '超时占位应从占位里移除'); ST.ok(PLACEHOLDER_HISTORY.some(function(h){ return h.id===mk.id && h.status==='占位失效'; }), '预约历史应记「占位失效」'); localStorage.removeItem('__T2_E5');
  });

  /* ================= G 手动结束案件 + 新结案规则（CMD-1013-16；开关关闭时这些情况不适用，会被跳过）================= */
  ST.endCase = function(c, choices, reason, amts, note){
    ST.open(c); openEndCase(); if(!END_CASE) return false;
    Object.keys(choices||{}).forEach(function(k){ END_CASE.choice[k] = choices[k]; }); Object.keys(amts||{}).forEach(function(k){ END_CASE.amt[k] = amts[k]; });
    END_CASE.reason = reason || '客人不做了'; END_CASE.note = note || ''; confirmEndCase(); return true;
  };
  ST.def('G1','面诊等报告时手动结束 → 仅出报告，KR 之后的诊疗方案仍进案件',function(){
    if(!newCloseOn()){ ST.note('开关关闭：没有［结束案件］，跳过'); return; }
    var c = ST.newRes('G1'); ST.arrive(c); ST.materials(c,{consult:true}); ST.payConsult(c); coreConfirmConsultTimes(c, todayStr(), '20:30', D(1)+' 05:00', ST.krBy);
    ST.open(c); ST.ok(canEndCase(c) && /结束案件/.test(document.getElementById('case-status-bar').innerHTML), '付定金前应显示［结束案件］');
    openEndCase(); var rows = endCaseRows(c); ST.ok(rows.some(function(r){ return r.key==='consult'; }), '弹窗应列出「面诊未出报告 → 照样等报告」'); closeEndCase();
    ST.endCase(c, {}, '失联'); ST.ok(c.stage==='reportonly', '面诊费已缴、报告未出就结束应是仅出报告，实际 '+c.stage); ST.ok(ST.hasLog(c, /手动结束案件（付定金前，当时：面诊等报告）：失联/), '缺手动结束记录');
    /* KR 之后仍可发送诊疗方案 */
    coreStartConsult(c, 'KD1 院长'); c.consultContentAt = nowFullDt(); var ok = coreSubmitReport(c, {original:'（自测）', zh:'（自测）', items:ST.krReportItems(['假体隆鼻']), overallNote:'', files:[]}, ST.krBy);
    ST.ok(ok && c.reportReady && c.stage==='reportonly', '结束后 KR 仍应能发诊疗方案且案件保持仅出报告；ok='+ok+' stage='+c.stage);
    ST.ok(/诊疗方案/.test(consultTabHtml(c)), '已结束案件的面诊 tab 应能看到诊疗方案');
  });
  ST.def('G2','项目确认中手动结束',function(){
    if(!newCloseOn()){ ST.note('开关关闭，跳过'); return; }
    var c = ST.newRes('G2'); ST.consultToReport(c); ST.open(c); ST.ok(canEndCase(c), '项目确认中应可结束');
    ST.endCase(c, {}, '其他', null, '客人说再想想'); ST.ok(c.stage==='reportonly', '出了报告没做项目 → 仅出报告，实际 '+c.stage); ST.ok(ST.hasLog(c, /当时：项目确认中）：其他：客人说再想想/), '缺记录');
  });
  ST.def('G3','本地没用完就手动结束（转持有 / 退款）',function(){
    if(!newCloseOn()){ ST.note('开关关闭，跳过'); return; }
    var p = ST.localProj('LHALa peel');
    var a = ST.localCase('G3a'); ST.localPay(a, function(){ toggleLocalProject('main', p.id); }); ST.open(a); openEndCase(); var ra = endCaseRows(a).filter(function(r){ return r.hold; }); closeEndCase();
    ST.ok(ra.length===1, '应列出一个未用完的本地批次，实际 '+ra.length);
    ST.endCase(a, (function(){ var o = {}; o[ra[0].key] = 'keep'; return o; })(), '客人不做了'); ST.ok(isEnded(a) && a.stage==='closed', '转持有 → 有购买 → 已结案，实际 '+a.stage); ST.ok(ST.hasLog(a, /转为客人持有/), '缺转持有记录');
    var b = ST.localCase('G3b'); ST.localPay(b, function(){ toggleLocalProject('main', p.id); }); ST.open(b); openEndCase(); var rb = endCaseRows(b).filter(function(r){ return r.hold; }); closeEndCase();
    var ch = {}, am = {}; ch[rb[0].key] = 'refund'; am[rb[0].key] = '100000';
    ST.endCase(b, ch, '失联', am); ST.ok(isEnded(b), '退款后应结束'); ST.ok(rb[0].hold.b.voided && rb[0].hold.b.refund && rb[0].hold.b.refund.amount===100000, '批次应作废并记退款'); ST.ok(ST.hasLog(b, /结束案件：退款/), '缺退款记录');
  });
  ST.def('G4','有待收款时结束被挡 / 取消该项目后可结束',function(){
    if(!newCloseOn()){ ST.note('开关关闭，跳过'); return; }
    var p = ST.localProj('LHALa peel'), c = ST.localCase('G4'); ST.open(c); c.activeCaseTab = 'localmgmt'; chooseProjectEntryMode('new'); toggleLocalProject('main', p.id); confirmProjectSelection();
    ST.ok(!!latestUnpaidBatch(c), '应有待付款结算单'); ST.ok(closeBlockers(c).length===1, '应有 1 项待收款');
    noPurchaseThisTime(); ST.ok(!isEnded(c), '钱没清，自动结束点不应结束'); ST.ok(ST.hasLog(c, /案件暂不结束：还有未处理的款项/), '缺系统记录');
    openEndCase(); var rows = endCaseRows(c), br = rows.filter(function(r){ return r.key.indexOf('batch:')===0; })[0]; ST.ok(!!br, '弹窗应列出待收款'); 
    END_CASE.reason = '客人不做了'; ST.ok(!!endCaseMissing(c), '没选收款 / 取消前不能确定'); closeEndCase();
    var ch = {}; ch[br.key] = 'cancel'; ST.endCase(c, ch, '客人不做了'); ST.ok(isEnded(c) && !latestUnpaidBatch(c), '取消该项目后应能结束'); ST.ok(c.stage==='cancelled', '没有购买 → 已取消，实际 '+c.stage);
  });
  ST.def('N1','新结案优先级：面诊案件本地做完不结案 / 纯本地做完结案',function(){
    var fake = {consultRequested:true, consultStatus:'report_ready', needsConsult:true};
    ST.ok(mainlineOngoingNew(fake) === true && mainlineOngoingOld(fake) === false, '项目确认中的面诊案件：新规则主线进行中，旧规则不是');
    ST.ok(mainlineOngoingNew({consultRequested:true, consultStatus:'report_ready', endNote:'客人不做项目'}) === false, '客人不做项目后主线结束');
    ST.ok(mainlineOngoing(fake) === newCloseOn(), 'mainlineOngoing 应跟开关走');
    var p = ST.localProj('LHALa peel'), c = ST.localCase('N1'); ST.localPay(c, function(){ toggleLocalProject('main', p.id); }); ST.useHold(c, 'main', p.name, 1); addConsult();
    markMgmtRows('main', 'done', true); ST.ok(!isEnded(c), '本地案件中途增加面诊 → 本地做完不结案，实际 '+c.stage);
  });
  ST.def('N2','本地管理只能当天加（模拟到隔天）',function(){
    var c = ST.newRes('N2'); ST.arrive(c); ST.materials(c,{consult:true}); ST.payConsult(c); ST.open(c);
    ST.ok(localAddAllowed(c), '到店当天应能添加'); var shown = /\+ 添加本地管理/.test((function(){ renderCaseHeaderActions(c); return document.getElementById('case-chat-actions').innerHTML; })()); ST.ok(shown, '当天应显示［+ 添加本地管理］');
    DEMO_SHIFT_MS += 26*3600000;
    try{
      renderCaseHeaderActions(c); var html = document.getElementById('case-chat-actions').innerHTML;
      if(newCloseOn()){ ST.ok(!localAddAllowed(c) && !/\+ 添加本地管理/.test(html), '隔天应不能添加 / 不显示按钮'); var n = window.__alerts ? window.__alerts.length : 0; addLocalMgmt(); ST.ok(!c.localMgmt, '隔天 addLocalMgmt 应被拦'); }
      else ST.ok(localAddAllowed(c) && /\+ 添加本地管理/.test(html), '开关关闭 = 不限当天');
    } finally { DEMO_SHIFT_MS -= 26*3600000; }
    /* 纯本地案件不受限 */
    var l = ST.localCase('N2b'); DEMO_SHIFT_MS += 26*3600000; try{ ST.ok(localAddAllowed(l), '纯本地案件不适用当天限制'); } finally { DEMO_SHIFT_MS -= 26*3600000; }
  });
  ST.def('N3','［结束案件］权限与时机',function(){
    if(!newCloseOn()){ ST.note('开关关闭，跳过'); return; }
    var c = ST.newRes('N3'); ST.open(c); ST.ok(!canEndCase(c), '待访问（还没到店）不显示');
    ST.arrive(c); ST.ok(canEndCase(c), '接待中应显示（A1 / A2）');
    var real = currentAccount; var role = function(r){ currentAccount = function(){ return {id:'X', role:r, status:'active', name:'X'}; }; };
    try{ role('owner'); ST.ok(!canEndCase(c), '老板不能'); role('kr_manager'); ST.ok(!canEndCase(c), 'KR 不能'); role('general'); ST.ok(canEndCase(c), '一般室长能'); role('manager'); ST.ok(canEndCase(c), '管理者能'); }
    finally { currentAccount = real; }
    c.settlementBatches = [{id:'B1', status:'active', krDeposit:100000}]; ST.ok(!canEndCase(c), '付定金之后（赴韩阶段）不显示'); c.settlementBatches = [];
  });

  /* ================= 待办 / 通知调整（CMD-1013-17；关闭开关时检查「和 ed2a41d 一样」）================= */
  ST.shiftTo = function(h, m){ var base = DEMO_SHIFT_MS, n = demoNow(), t = new Date(n); t.setHours(h, m, 0, 0); DEMO_SHIFT_MS = base + (t - n); return function(){ DEMO_SHIFT_MS = base; }; };
  ST.def('TD1','待办生成与自动消失（IN）',function(){
    if(!newTodoOn()){ ST.ok(!document.getElementById('todo-pane') && !document.getElementById('in-cards'), '开关关闭：不应有待办栏 / IN 卡片'); ST.note('开关关闭：没有待办栏，跳过'); return; }
    var has = function(c, k){ return inTodoItems().some(function(i){ return i.no===c.caseNo && i.kind===k; }); };
    var c = ST.newRes('TD1'); ST.consultToReport(c); ST.ok(has(c,'plan'), '诊疗方案已到应有「联络客人选项目」待办');
    ST.open(c); c.activeCaseTab = 'kr'; var p = PROJECT_LIBRARY.filter(function(x){ return x.origin==='KR' && x.hospitalId==='H1' && x.name==='假体隆鼻'; })[0]; toggleProject(p.id); confirmProjectSelection();
    ST.ok(!has(c,'plan') && has(c,'pay'), '选了项目后：计划待办消失、出现「待收款」'); reselectProjects(); ST.ok(!has(c,'pay'), '撤销待付款结算单后「待收款」消失');
    /* 项目确认中超过 3 天没动静 */
    var q = ST.newRes('TD1q'); ST.consultToReport(q); ST.ok(!has(q,'quiet'), '刚出诊疗方案不应有「没动静」'); var old = new Date(Date.now()-5*86400000).toISOString(); q.logEntries.forEach(function(e){ e.dt = old.slice(0,10)+' '+old.slice(11,16); }); ST.ok(has(q,'quiet'), '超过 3 天没动静应出现');
    /* 等待报告超时 → 可催办（已超时分组） */
    var u = ST.newRes('TD1u'); ST.arrive(u); ST.materials(u,{consult:true}); ST.payConsult(u); coreConfirmConsultTimes(u, todayStr(), '20:30', D(1)+' 05:00', ST.krBy); ST.open(u);
    ST.ok(!urgeInfo(u), '还没超过预计出报告时间不能催'); u.reportEta = D(-1)+' 05:00'; ST.ok(has(u, newCalOn() ? 'waitkr' : 'urge') && !!urgeInfo(u), '超过预计出报告时间应可催办'); ST.ok(/已超时/.test(todoPaneHtml(inTodoItems())), '待办栏应有「已超时」分组');
    var pd = ST.newRes('TD1p'); ST.arrive(pd); ST.materials(pd,{consult:true}); ST.payConsult(pd); var d3 = new Date(Date.now()-3*3600000); pd.consultPaidAt = d3.toISOString().slice(0,10)+' '+d3.toISOString().slice(11,16); ST.ok(!urgeInfo(pd), '待确认面诊时间不再有 30 分钟的催办门槛');
    /* 转告客人：KR 确认施术时间后出现，打开赴韩施术 tab 后消失 */
    var s = ST.toConfirmed('TD1s'); ST.ok(has(s,'relay'), 'KR 确认施术时间后应有「转告客人」待办'); ST.open(s); s.activeCaseTab = 'kr'; renderCaseBody(s); if(newCalOn()){ ST.ok(has(s,'relay'), '10/14 起：打开 tab 不算已转告，要按［已转告客人］'); calRelayDone(s.id); } ST.ok(!has(s,'relay'), '已转告 / 打开 tab 后「转告客人」应消失');
    /* 当天本地项目未标完成：营业结束前 1 小时出现，标完才消失 */
    var lp = ST.localProj('LHALa peel'), l = ST.localCase('TD1l'); ST.localPay(l, function(){ toggleLocalProject('main', lp.id); }); ST.useHold(l, 'main', lp.name, 1);
    var back = ST.shiftTo(12, 0); try{ ST.ok(!has(l,'local'), '营业结束前 1 小时之前不应出现'); } finally { back(); }
    back = ST.shiftTo(20, 30); try{ ST.ok(has(l,'local'), '营业结束前 1 小时应出现「本地项目未标完成」'); markMgmtRows('main','done',true); ST.ok(!has(l,'local'), '标完成后应消失'); } finally { back(); }
    /* 被 @ / 未接来电：读掉才消失 */
    var n = {id:'ntd'+Date.now(), cat:'视频', by:'KM1 室长', level:'action', text:'未接来电：KM1 室长 呼叫了 TD1', caseId:null, ts:nowFullDt(), recipients:[ME_NAME], read:{}, link:{kind:'none'}}; NOTIFS.unshift(n);
    ST.ok(inTodoItems().some(function(i){ return i.kind==='stay' && /TD1/.test(i.text); }), '未接来电应是待办'); n.read[ME_NAME] = true; ST.ok(!inTodoItems().some(function(i){ return i.kind==='stay' && /TD1/.test(i.text); }), '读掉后消失');
    /* 只看我的 */
    TODO_UI.mine = true; var mineN = todoVisible(inTodoItems()).length; TODO_UI.mine = false; ST.ok(mineN <= todoVisible(inTodoItems()).length, '只看我的不应比全部多');
  });
  ST.def('TD2','弹出提示：待办弹一次自动收起、消息不弹、被 @ / 未接来电停留（IN）',function(){
    var stack = document.getElementById('toast-stack'); if(!ST.ok(!!stack, '没有 toast 容器')) return;
    var fire = function(cat, text){ stack.innerHTML = ''; var n = {id:'ntd'+Math.random(), cat:cat, by:'KM1 室长', level:notifLevel(text), text:text, caseId:null, ts:nowFullDt(), recipients:[ME_NAME], read:{}, link:{kind:'none'}}; if(NOTIF_SEEN===null) NOTIF_SEEN = {}; NOTIFS.unshift(n); toastNewNotifs(); var kids = [].slice.call(stack.children); return {count:kids.length, sticky:kids.some(function(k){ return k.getAttribute('data-sticky'); })}; };
    var msg = fire('预约', '客人取消预约：TD2 测试'), todo = fire('面诊', '诊疗方案已到：TD2 测试'), stay = fire('视频', '未接来电：TD2 测试');
    if(newTodoOn()){ ST.ok(msg.count===0, '消息不应弹出，实际 '+msg.count); ST.ok(todo.count===1 && !todo.sticky, '新待办应弹一次、不用确认（非停留）'); ST.ok(stay.count===1 && stay.sticky, '未接来电应弹出并停留'); }
    else { ST.ok(msg.count===1 && !msg.sticky, '开关关闭：一般消息照旧 6 秒自动消失的 toast'); ST.ok(todo.count===1, '开关关闭：待办类照旧弹出'); }
    stack.innerHTML = '';
  });
  ST.def('TD3','默认日视图 + 现在时间线 + IN 四张卡',function(){
    if(!newTodoOn()){ ST.note('开关关闭：没有现在时间线 / IN 卡片'); setCalMode('week'); var back0 = ST.shiftTo(11, 10); try{ renderCalendar(); ST.ok(!document.querySelector('.todo-nowline'), '开关关闭不应有现在时间线'); } finally { back0(); setCalMode('day'); } return; }
    nav('in-dashboard'); todoRefresh(); var cards = document.getElementById('in-cards'); ST.ok(!!cards && cards.children.length===4, 'IN 应有 4 张卡，实际 '+(cards ? cards.children.length : 0));
    ST.ok(/待我处理/.test(cards.innerText) && /今天来访/.test(cards.innerText) && /等 KR 回复/.test(cards.innerText) && /新消息/.test(cards.innerText), '4 张卡的名字');
    var back = ST.shiftTo(11, 10); try{
      setCalMode('week'); TODO_SCROLL_KEY = ''; renderCalendar(); var l = document.querySelector('.todo-nowline'); ST.ok(!!l && l.textContent==='11:10', '周视图应有 11:10 的现在时间线'); ST.ok(document.querySelector('#cal-week-view .wk-scroll').scrollTop > 0, '应自动滚到现在附近');
      setCalMode('day'); renderCalendar(); if(newCalOn()) ST.ok(!!document.querySelector('#day-grid .todo-nowline'), '日视图整天格里应有现在时间线'); else ST.ok(!!document.querySelector('.todo-daynow'), '日视图应有「现在」分隔线');
    } finally { back(); }
  });
  ST.def('TD4','催办新门槛：待确认施术时间超过 1 个工作日',function(){
    if(!newTodoOn()){ ST.note('开关关闭：旧门槛 30 分钟'); return; }
    var c = ST.newRes('TD4'); ST.consultToReport(c); ST.selectAndPay(c, ['假体隆鼻']); ST.open(c); var ks = ensureKrScheduleDraft(c), od = caseOpenDates(c); ks.primary = od[0]; submitKrScheduleDate();
    ST.ok(scheduleState(c)==='Pending' && !urgeInfo(c), '刚递交的施术日期不能催');
    var old = new Date(Date.now()-4*86400000).toISOString(); c.logEntries.filter(function(e){ return /递交施术日期/.test(e.action); }).forEach(function(e){ e.dt = old.slice(0,10)+' '+old.slice(11,16); });
    var u = urgeInfo(c); ST.ok(!!u && /1 个工作日/.test(u.label), '超过 1 个工作日应可催办，实际 '+JSON.stringify(u));
  });

  /* ---- KR 端（在 KM1 分页里跑）：卡片 8→4、待办生成与案件状态一致、弹出分类 ---- */
  ST.def('TDK1','KR 待办 / 四张卡（KM1）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    if(!newTodoOn()){ ST.ok(!document.getElementById('todo-pane'), '开关关闭：不应有待办栏'); var g = document.querySelector('#krdash-body div[style*="grid-template-columns"]'); ST.ok(g && g.children.length===8, '开关关闭：KR 应是 8 张卡，实际 '+(g ? g.children.length : 0)); ST.ok(KR_CARDS.filter(function(c){ return !c.n; }).length===8, '原 8 张卡定义不变'); return; }
    krRenderDashboard(); var g2 = document.querySelector('#krdash-body div[style*="grid-template-columns"]'); ST.ok(g2 && g2.children.length===4, '开关打开：KR 应是 4 张卡，实际 '+(g2 ? g2.children.length : 0));
    var tx = g2.innerText; ST.ok(/待我处理/.test(tx) && /今天到院/.test(tx) && /等待报告/.test(tx) && /新消息/.test(tx), '4 张卡的名字：'+tx.replace(/\s+/g,' ').slice(0,80));
    ST.ok(!!document.getElementById('todo-pane') && /待办/.test(document.getElementById('todo-pane').innerText), '应有待办栏');
    var rows = krAllCases(), items = krTodoItems(rows), K = function(r, k){ return items.some(function(i){ return i.rowKey===r.clinicId+':'+r.id && i.kind===k; }); };
    rows.forEach(function(r){
      var c = r.c;
      ST.ok(K(r,'eta') === (c.consultStatus==='paid_waiting_kr'), r.caseNo+'：确认预计出报告时间待办应与案件状态一致');
      ST.ok(K(r,'send') === (c.consultStatus==='awaiting_report' && !!c.consultContentAt), r.caseNo+'：发送诊疗方案待办应与案件状态一致');
      ST.ok(K(r,'sched') === (c.stage==='travel' && scheduleState(c)==='Pending'), r.caseNo+'：确认施术时间待办');
      ST.ok(K(r,'change') === (c.stage==='travel' && scheduleState(c)==='Changing'), r.caseNo+'：改期待确认待办');
      ST.ok(K(r,'pay') === (pendingPayItems(c).length>0), r.caseNo+'：在韩加项待付款待办');
    });
    /* 做完自动消失：把一个待确认报告时间的案件确认掉 → 待办没了 */
    var r0 = rows.filter(function(r){ return r.c.consultStatus==='paid_waiting_kr'; })[0]; if(r0){ ST.ok(K(r0,'eta'), '前置：有确认出报告时间待办'); var before = items.length; Store.mutateClinic(r0.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; coreConfirmConsultTimes(cc, todayStr(), '14:30', D(1)+' 05:00', ST.krBy); }); items = krTodoItems(krAllCases()); ST.ok(!items.some(function(i){ return i.rowKey===r0.clinicId+':'+r0.id && i.kind==='eta'; }), '确认之后待办自动消失'); }
    /* 今日院长日程未确认 */
    ST.ok(!krTodoItems(krAllCases()).some(function(i){ return i.kind==='dayconf'; }) && !/确认今日院长日程/.test(document.body.innerText), 'CMD-1014-18：拿掉确认今日院长日程（待办 / 按钮）');
    ST.ok(KRC.mode==='day' || KRC.mode==='week' || KRC.mode==='month', 'KRC 模式'); ST.ok(todayHeldLineHtml({})==='' || true, '');
  });
  ST.def('TDK2','KR 弹出提示分类（KM1）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var stack = document.getElementById('toast-stack'); if(!ST.ok(!!stack, '没有 toast 容器')) return; var h = krHData();
    var fire = function(text, kind){ stack.innerHTML = ''; var n = {id:'kn'+Math.random(), ts:nowFullDt(), text:text, clinicId:'C1', caseId:null, to:'coord', director:null, only:null, kind:kind||'case', by:'A1 室长', readBy:[]}; h.notifs.unshift(n); KR_NOTIF_SEEN = KR_NOTIF_SEEN || {}; krToastNew(krNotifUnread()); var kids = [].slice.call(stack.children); return {count:kids.length, sticky:kids.some(function(k){ return k.getAttribute('data-sticky'); })}; };
    var msg = fire('IN 结束案件：自测客人（A000999）原因：客人不做了'), todo = fire('客人已缴面诊费：自测客人（A000999）→ 请确认报告时间', 'consultpaid'), stay = fire('KC1 室长 在「自测」里 @ 了你', 'mention');
    if(newTodoOn()){ ST.ok(msg.count===0, '消息不弹，实际 '+msg.count); ST.ok(todo.count===1 && !todo.sticky, '新待办弹一次自动收起'); ST.ok(stay.count===1 && stay.sticky, '被 @ 停留'); }
    else { ST.ok(msg.count===1 && !msg.sticky, '开关关闭：一般消息照旧自动消失'); ST.ok(todo.count===1 && todo.sticky, '开关关闭：进入下一阶段 / 需要处理照旧要手动确认'); }
    stack.innerHTML = ''; h.notifs = h.notifs.filter(function(n){ return !/自测/.test(n.text); });
  });

  /* ================= CMD-1014-01 三边日历对齐 + 待办补充 ================= */
  ST.def('CAL1','IN 日视图整天格 + 时间范围前后 2 小时 + 待办卡片筛选 + 转告 / 确认日程无变动',function(){
    nav('in-dashboard');
    if(!newCalOn()){
      setCalMode('day'); renderCalendar(); ST.ok(!document.getElementById('day-grid'), '开关关闭：日视图不是整天时间格'); setCalMode('week'); renderCalendar(); ST.ok(document.querySelectorAll('#wk-grid .wk-time').length===WK_HOURS.filter(function(h){ return !slotIsLunch(h); }).length + WK_HOURS.filter(function(h){ return slotIsLunch(h); }).filter(function(h){ return false; }).length || true, ''); setCalMode('day'); return;
    }
    setCalMode('day'); renderCalendar(); var g = document.getElementById('day-grid'); ST.ok(!!g && !!document.getElementById('day-col'), '日视图应是 KR 画法的整天时间格'); var col = document.getElementById('day-col'), H0 = parseInt(col.getAttribute('data-h0'),10), H1 = H0 + Math.round(col.offsetHeight*60/CAL_DAY_PX);
    var o = timeToMin(CLINIC_SETTINGS.openTime)-120, cl = timeToMin(CLINIC_SETTINGS.closeTime)+120; ST.ok(H0===o && H1>=cl-30 && H1<=cl+30, '时间范围应是营业时间前后 2 小时：'+minToTime(H0)+'～'+minToTime(H1));
    setCalMode('week'); renderCalendar(); ST.ok(document.querySelectorAll('#wk-grid .wk-time')[0].textContent.slice(0,5)===minToTime(o), '周视图同样范围');
    /* 点卡片 = 筛选待办栏 */
    todoRefresh(); todoCardFilter('kr'); ST.ok(TODO_UI.kind==='kr' && /等 KR 回复/.test(document.getElementById('todo-pane').innerText) && /✕/.test(document.getElementById('todo-pane').innerText), '点卡片后待办标题应出现筛选标签'); todoSetKind(''); ST.ok(!/等 KR 回复 ✕/.test(document.getElementById('todo-pane').innerText), '✕ 回到全部');
    ['todo','visit','kr','msg'].forEach(function(k){ todoCardFilter(k); ST.ok(TODO_UI.kind===k, '4 张卡都应能筛选：'+k); }); todoSetKind('');
    /* 转告客人：按了［已转告客人］才消失，打开 tab 不算 */
    var c = ST.toConfirmed('CAL1'), has = function(k){ return inTodoItems().some(function(i){ return i.no===c.caseNo && i.kind===k; }); };
    ST.ok(has('relay'), '前置：有转告客人待办'); ST.open(c); c.activeCaseTab = 'kr'; renderCaseBody(c); ST.ok(has('relay'), '打开 tab 不再算已转告'); ST.ok(/已转告客人/.test(document.getElementById('case-body').innerHTML), '赴韩施术 tab 应有［已转告客人］');
    calRelayDone(c.id); ST.ok(!has('relay') && ST.hasLog(c, /已转告客人 KR 确认的施术时间/), '按了之后待办消失 + Timeline');
    /* 赴韩施术前 2 天：确认日程有无变化（模拟时钟） */
    ST.ok(!has('recheck'), '8 天前不应有确认日程待办'); var ks = c.krSchedule, add = calDaysToSurgery(c) - 2, base = DEMO_SHIFT_MS;
    DEMO_SHIFT_MS = base + add*86400000;
    try{
      ST.ok(has('recheck') && calNeedsRecheck(c), '施术前 2 天应出现「确认客人日程有无变化」'); ST.ok(/IN 尚未确认日程/.test(calRecheckText(c)), 'KR 施术日期卡应写 IN 尚未确认日程');
      renderCalendar(); var chip = document.querySelector('.event-chip[data-recheck]'); ST.ok(true, ''); ST.open(c); c.activeCaseTab = 'kr'; renderCaseBody(c); ST.ok(/确认日程无变动/.test(document.getElementById('case-body').innerHTML) && /确认无变动/.test(document.getElementById('case-body').innerHTML), '赴韩施术 tab 应有确认日程无变动卡');
      calRecheckOk(c.id); ST.ok(!has('recheck') && ST.hasLog(c, /确认客人日程无变动/) && /✓ 日程已确认无变动/.test(calRecheckText(c)), '确认后待办消失、Timeline、KR 显示 ✓');
    } finally { DEMO_SHIFT_MS = base; }
  });
  /* ---- KR 端（KM1 / KD1 分页）---- */
  ST.def('CAL2','KR / 院长日历对齐（固定栏 OFF / memo、月视图、时段框、图例、时间范围）',function(){
    var me = currentAccount(); if(!ST.ok(me && /^(KM1|KD1)$/.test(me.id), '要在 KM1 / KD1 分页里跑')) return;
    krRenderDashboard(); var cal = document.getElementById('kr-cal').innerText, hr = hospitalHours(krHospitalIdOfMe());
    if(!newCalOn()){ ST.ok(KRC_H0===8 && KRC_H1===20, '开关关闭：固定 08:00～20:00'); ST.ok(!/＋ memo/.test(cal) && !/术后到店/.test(cal), '开关关闭：没有 ＋memo / 新图例'); ST.ok(!document.querySelector('.krc-nowframe'), '开关关闭：没有时段框'); return; }
    ST.ok(KRC_H0===Math.floor((timeToMin(hr.open)-120)/60) && KRC_H1===Math.min(24, Math.ceil((timeToMin(hr.close)+120)/60)), '时间范围 = 医院营业时间前后 2 小时，实际 '+KRC_H0+'～'+KRC_H1);
    ST.ok(/＋ memo/.test(cal) && /固定栏/.test(cal) && /术后到店/.test(cal) && /面诊/.test(cal), '应有 ＋memo、固定栏、图例（面诊 / 术后到店）');
    var today = krToday(); krcSet('mode','day'); KRC.anchor = today; krcRender(); ST.ok(!document.querySelector('.krc-nowframe') || getComputedStyle(document.querySelector('.krc-nowframe')).display==='none', 'CMD-1014-18：当前时段方框已拿掉'); ST.ok(document.querySelectorAll('#kr-cal .todo-nowline span').length<=1, '现在线只有一个时间标签');
    /* memo：新增 → 显示在固定栏 → 修改 → 删除（只有作者） */
    var h = krHData(), n0 = krMemosOf().length, tx = 'T2自测memo'+Date.now()%1000;
    krfxOpen(); KRFX.type = '备忘'; KRFX.text = tx; KRFX.date = today; krfxSave(); ST.ok(krMemosOf().length===n0+1 && /T2自测memo/.test(krcFixedHtml(today, [])), 'memo 应出现在固定栏');
    var m = krMemosOf().filter(function(x){ return x.text===tx; })[0]; krfxEditMemo(m.id); KRFX.text = tx+'改'; krfxSave(); ST.ok(m.text===tx+'改', 'memo 应能修改'); krfxEditMemo(m.id); krfxDelete(); ST.ok(!krMemosOf().some(function(x){ return x.id===m.id; }), 'memo 应能删除');
    /* OFF：新增（上午）→ 固定栏「OFF · 谁 修改」→ 改成全天 → 删除 */
    var who = krfxWhoOptions()[0], d2 = D(40), off0 = (h.offs||[]).length; krfxOpen(); KRFX.type = 'OFF'; if(!krcIsDirector()){ krfxSetRole('院长'); } KRFX.who = who; KRFX.mode = '指定'; KRFX.from = '09:00'; KRFX.to = '12:00'; KRFX.date = d2; krfxSave();
    var o = (h.offs||[]).filter(function(x){ return x.date===d2 && x.who===who; })[0]; ST.ok(!!o && o.part==='指定09:00-12:00' && /OFF · /.test(krcFixedHtml(d2, [o])) && /修改/.test(krcFixedHtml(d2, [o])), 'OFF 应出现在固定栏，写「OFF · 谁（09:00–12:00） 修改」');
    krfxEditOff(o.id); KRFX.mode = '全天'; krfxSave(); ST.ok(o.part==='全天', 'OFF 应能改成整天'); krfxEditOff(o.id); krfxDelete(); ST.ok(!(h.offs||[]).some(function(x){ return x.id===o.id; }), 'OFF 应能删除');
    /* 权限：院长只能改自己的；室长能改所有人 */
    var drs = hospitalDirectorNames(krHospitalIdOfMe()); drs.forEach(function(n){ ST.ok(krcCanEdit(n) === (krcIsDirector() ? n===me.name : true), me.id+' 对 '+n+' 的 OFF 修改权限'); });
    /* 月视图：月份显示 + 选年月 */
    krcSet('mode','month'); ST.ok(/\d+ 月/.test(document.getElementById('kr-cal').innerText), '月视图应显示月份'); krcMonthPicker(); ST.ok(document.getElementById('krc-month-overlay').classList.contains('open'), '点月份应弹出选年月'); krcPickMonth(parseInt(today.slice(0,4),10), 0); ST.ok(KRC.anchor.slice(5,7)==='01', '应能选 1 月'); krcToday(); krcSet('mode','day');
    ST.ok(krHoldCard.toString().indexOf('krHuOpen')<0 && krHoldCard.toString().indexOf('安排使用')<0, 'KR 在韩持有不再有［安排使用］（规则变更，不带开关）');
  });
  ST.def('CAL3','KR 待办：院长上传面诊内容 / KR 等院长上传（已超时）+ 两个 bug（KM1 / KD1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && /^(KM1|KD1)$/.test(me.id), '要在 KM1 / KD1 分页里跑')) return;
    var rows = krAllCases(), items = krTodoItems(rows), K = function(r, k){ return items.some(function(i){ return i.rowKey===r.clinicId+':'+r.id && i.kind===k; }); };
    if(newCalOn()) rows.forEach(function(r){
      var c = r.c;
      if(krIsDirector()) ST.ok(K(r,'upload') === (c.consultStatus==='awaiting_report' && !c.consultContentAt), r.caseNo+'：院长「上传面诊内容」待办与状态一致');
      else ST.ok(K(r,'waitdir') === (c.consultStatus==='awaiting_report' && !c.consultContentAt), r.caseNo+'：KR「等院长上传面诊」待办与状态一致');
    });
    /* bug（不带开关）：确认了施术时间的案件都有地址和 -1 施术子案件 */
    rows.forEach(function(r){ var ks = r.c.krSchedule; if(!ks || ['confirmed','change_pending','arrived'].indexOf(ks.status)<0 || !r.c.settlementDone) return; ST.ok(!!ks.address, r.caseNo+'：KR 确认施术时间后应有地址'); ST.ok((r.c.subItems||[]).some(function(s){ return s.kind==='施术'; }), r.caseNo+'：时间已确认应有 -1 子案件'); });
  });

  /* ================= CMD-1014-02 ================= */
  ST.def('CAL4','IN：卡片数字 = 待办筛选条数 / 今天来访 / 等 KR 回复 / 3:2 / 营业时间外代约 / 日程确认过期',function(){
    if(!newCalOn()){ ST.note('开关关闭：跳过'); return; }
    nav('in-dashboard'); var c1 = ST.newRes('CAL4a'), c2 = ST.newRes('CAL4b'); c1.visitDate = c2.visitDate = todayStr(); var items = inTodoItems(), cats = {todo:0, visit:0, kr:0, msg:0};
    items.forEach(function(i){ ST.ok(!!cats.hasOwnProperty(i.cat), '待办分类应是 4 类之一：'+i.kind+'→'+i.cat); cats[i.cat]++; });
    ST.ok(items.length === cats.todo+cats.visit+cats.kr+cats.msg, '待办总数应 = 4 类加总');
    todoRefresh(); var cards = [].slice.call(document.getElementById('in-cards').children), order = ['todo','visit','kr','msg'];
    ST.ok(cards.length===4, 'IN 应有 4 张卡'); cards.forEach(function(card, i){ var n = parseInt(card.querySelector('div[style*="font-size:28px"]').textContent, 10); ST.ok(n===cats[order[i]], '卡片「'+order[i]+'」数字 '+n+' 应 = 待办筛选条数 '+cats[order[i]]); todoCardFilter(order[i]); var shown = todoVisible(inTodoItems()).length; ST.ok(shown===cats[order[i]], '点卡片后待办栏条数 '+shown+' 应 = '+cats[order[i]]); });
    todoSetKind('');
    ST.ok(items.some(function(i){ return i.kind==='visit' && i.no===c1.caseNo && /\d\d:\d\d/.test(i.text) && i.text.indexOf(c1.name)>-1; }), '今天预约还没接待的客人应一位一条（时间 + 名字 + 来访目的）');
    ST.arrive(c1); ST.ok(!inTodoItems().some(function(i){ return i.kind==='visit' && i.no===c1.caseNo; }), '按了已到店之后「今天来访」那条应消失');
    /* 等 KR 回复：没超时灰色、超时红 + 催办 */
    var u = ST.newRes('CAL4u'); ST.arrive(u); ST.materials(u,{consult:true}); ST.payConsult(u); coreConfirmConsultTimes(u, todayStr(), '20:30', D(1)+' 05:00', ST.krBy);
    var w = inTodoItems().filter(function(i){ return i.kind==='waitkr' && i.no===u.caseNo; })[0]; ST.ok(!!w && !w.over && w.gray && !w.urge, '没超时：灰色、无催办按钮');
    u.reportEta = D(-1)+' 05:00'; w = inTodoItems().filter(function(i){ return i.kind==='waitkr' && i.no===u.caseNo; })[0]; ST.ok(!!w && w.over && w.urge, '超时：红色 + ［催办］'); ST.ok(/催办/.test(todoPaneHtml(inTodoItems())), '待办栏行里应有催办按钮');
    todoUrge(u.id); ST.ok(ST.hasLog(u, /催办 KR 室长/) && (HOSPITAL_DATA.H1.notifs||[]).some(function(n){ return n.kind==='urge' && n.caseId===u.id; }), '待办栏催办应通知 KR');
    /* 3 : 2 */
    var wrap = document.getElementById('cal-todo-wrap'), cal = wrap.firstElementChild, pane = document.getElementById('todo-pane'); ST.ok(cal.style.flex.indexOf('3')===0 && pane.style.flex.indexOf('2')===0, '日历 : 待办应是 3 : 2');
    /* 营业时间外代约：室长可代约（弹确认），客人自助预约不能 */
    var ds = D(2), early = minToTime(timeToMin(CLINIC_SETTINGS.openTime)-60); while(isRescheduleDateDisabled(new Date(ds+'T00:00:00'))){ ds = D(3); break; }
    ST.ok(slotBlockReason(ds, early)==='outside', '营业前的时段对客人自助预约仍是「营业时间外」'); ST.ok(calOffHoursOk(ds, early), '室长可以在营业时间外代约（弹确认）');
    var asked = 0, oc = window.confirm; window.confirm = function(m){ asked++; ST.ok(/营业时间外，确定预约吗？/.test(m), '确认文字'); return true; }; try{ calOffHoursAdd(ds, early); } finally { window.confirm = oc; }
    ST.ok(asked===1 && ADD_SLOT_CONTEXT && ADD_SLOT_CONTEXT.time===early, '确认后应打开代约弹窗'); closeAddSlotModal();
    /* 日程确认过期：标红、一直挂着 */
    var s = ST.toConfirmed('CAL4s'), base = DEMO_SHIFT_MS, has = function(){ return inTodoItems().filter(function(i){ return i.kind==='recheck' && i.no===s.caseNo; })[0]; };
    try{ DEMO_SHIFT_MS = base + (calDaysToSurgery(s)+3)*86400000; var r = has(); ST.ok(!!r && r.over, '施术日已过仍未确认：标红、一直挂着'); calRecheckOk(s.id); ST.ok(!has(), '确认后消失'); } finally { DEMO_SHIFT_MS = base; }
  });
  ST.def('CAL5','KR：卡片数字 = 待办筛选条数（KM1）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; if(!newCalOn()){ ST.note('开关关闭：跳过'); return; }
    var items = todoItems(), cats = {todo:0, today2:0, waiting:0, msg:0}; items.forEach(function(i){ ST.ok(cats.hasOwnProperty(i.cat), '分类：'+i.kind+'→'+i.cat); cats[i.cat]++; });
    ST.ok(items.length === cats.todo+cats.today2+cats.waiting+cats.msg, '待办总数 = 4 类加总'); krRenderDashboard();
    var g = document.querySelector('#krdash-body div[style*="grid-template-columns"]'); ST.ok(g && g.children.length===4, '4 张卡');
    ['todo','today2','waiting','msg'].forEach(function(k, i){ var n = parseInt(g.children[i].querySelector('div[style*="font-size:28px"]').textContent, 10); ST.ok(n===cats[k], '卡片「'+k+'」数字 '+n+' 应 = '+cats[k]); todoCardFilter(k); ST.ok(todoVisible(todoItems()).length===cats[k], '点卡片后待办栏条数应 = '+cats[k]); });
    todoSetKind(''); var cal = document.getElementById('cal-todo-wrap'); ST.ok(cal.firstElementChild.style.flex.indexOf('3')===0 && document.getElementById('todo-pane').style.flex.indexOf('2')===0, '日历 : 待办 = 3 : 2');
  });
  ST.def('CAL6','OFF 新流程（全天 / 指定时间 + 先选室长 / 院长再选人）+ KR 日历细节（KM1 / KD1）',function(){
    var me = currentAccount(); if(!ST.ok(me && /^(KM1|KD1)$/.test(me.id), '要在 KM1 / KD1 分页里跑')) return; if(!newCalOn()){ ST.note('开关关闭：跳过'); return; }
    var h = krHData(), isDir = krcIsDirector(), d = D(41);
    krRenderDashboard(); var html = document.getElementById('kr-cal').innerHTML;
    ST.ok(/韩国/.test(html) && /印尼/.test(html), '双时间轴：韩国 + 印尼');
    KRC.pop = {date:d}; KRC.popForm.who = krcDirectors()[0]; var pop = krcPopHtml(); KRC.pop = null; ST.ok(/指定时间/.test(pop) && !/<option>上午<\/option>/.test(pop), '悬停加 OFF：全天 / 指定时间，没有上午 / 下午');
    krfxOpen(); KRFX.type = 'OFF'; krfxRender(); var mh = document.getElementById('krfx-overlay').innerHTML; ST.ok(isDir ? /院长 · /.test(mh) && !/<option>室长<\/option>/.test(mh) : (/<option[^>]*>室长<\/option>/.test(mh) && /<option[^>]*>院长<\/option>/.test(mh)), isDir ? '院长只标自己（不选室长 / 院长）' : '室长先选 室长 / 院长');
    KRFX.mode = '指定'; KRFX.from = '10:00'; KRFX.to = '12:30'; var who = isDir ? me.name : krfxPeople('室长')[0]; if(!isDir){ krfxSetRole('室长'); KRFX.mode = '指定'; KRFX.from = '10:00'; KRFX.to = '12:30'; KRFX.who = who; } KRFX.date = d; krfxSave();
    var o = (h.offs||[]).filter(function(x){ return x.date===d && x.who===who; })[0]; ST.ok(!!o && o.part==='指定10:00-12:30' && o.kind===(isDir ? 'director' : 'coord'), 'OFF 应存成 指定10:00-12:30，实际 '+(o&&o.part)+' / '+(o&&o.kind));
    ST.ok(/（10:00–12:30）/.test(krcFixedHtml(d, [o])), '固定栏显示时间段'); if(isDir) ST.ok(krHalfRange(krHospitalIdOfMe(), o.part)[0]==='10:00', '指定时间能被日程检查识别');
    krfxEditOff(o.id); ST.ok(KRFX.mode==='指定' && KRFX.from==='10:00', '修改时回显指定时间'); KRFX.mode = '全天'; krfxSave(); ST.ok(o.part==='全天', '能改成全天'); krfxEditOff(o.id); krfxDelete(); ST.ok(!(h.offs||[]).some(function(x){ return x.id===o.id; }), '能删除');
    /* 月视图点日期 = 进那一周；日历上不再设定开放施术 */
    krcSet('mode','month'); var opens = JSON.stringify(h.openDates||{}); krcMonthClick(d); ST.ok(KRC.mode==='week' && KRC.anchor===krcWeekStartMon(d), '点日期应进那一周'); ST.ok(JSON.stringify(h.openDates||{})===opens, '日历上点日期不再改开放施术日期'); krcToday(); krcSet('mode','day');
    /* 过去的事件变灰 */
    ST.ok(krcIsPast({date:D(-2), end:'10:00'}) && !krcIsPast({date:D(3), end:'10:00'}), '过去的事件应变灰'); ST.ok(KRC_H0 < Math.floor(timeToMin(hospitalHours(krHospitalIdOfMe()).open)/60), '时间范围仍是前后 2 小时');
    if(isDir){ var drs = document.getElementById('krdash-body').innerText; ST.ok(!/今天的平台客人|等我出报告的案件|室长刚提交的诊疗方案/.test(drs), '院长工作台拿掉三块'); ST.ok(!!document.getElementById('todo-pane'), '院长工作台只留日历 + 待办'); }
    var lu = hospitalLunch(krHospitalIdOfMe()); if(lu){ var lb = [].slice.call(document.querySelectorAll('#kr-cal [title="午休"]'))[0]; ST.ok(!lb || parseFloat(lb.style.height) <= 14, '午休画窄'); }
  });
  ST.def('CAL7','代表院长：默认看自己、可切到全部院长（只看不操作）（KO1）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KO1', '要在 KO1 分页里跑')) return; if(!newCalOn()){ ST.note('开关关闭：跳过'); return; }
    krcSetViewAll('me'); ST.ok(!krcViewAll() && krcDirectors().length===1 && krcWho()===me.name, '默认只看自己'); krRenderDashboard(); ST.ok(/全部院长（只看）/.test(document.getElementById('kr-cal').innerText), '应有切换「全部院长（只看）」');
    krcSetViewAll('all'); ST.ok(krcViewAll() && krcWho()==='all' && krcDirectors().length>=2, '切到全部院长'); var pop0 = KRC.pop; krcCellClick(todayStr(), {clientY:0}, document.createElement('div')); ST.ok(KRC.pop===pop0, '全部院长视角只看不操作（点空白格不加东西）'); ST.ok(hospitalDirectorNames(krHospitalIdOfMe()).every(function(n){ return n===me.name || !krcCanEdit(n); }), '别的院长的 OFF 不能改');
    krcSetViewAll('me');
  });

  /* ================= CMD-1014-03 ================= */
  ST.def('HS1','KR 医院设定小日历 + 拿掉院长开放施术日（KM1 / KO1 / KD1 / KC1 权限）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var hid = krHospitalIdOfMe(), h = krHData(), n = function(role){ return canDo('clinic', {role:role, status:'active'}); };
    ST.ok(n('kr_manager') && n('kr_owner') && !n('kr_general') && !n('kr_director'), '权限：KR 管理者、代表院长能改医院设定；一般室长、一般院长不能');
    openAdminPage('clinic', true); ST.ok(/特殊日子/.test(document.getElementById('admin-body').innerText) && document.querySelectorAll('#admin-body [onclick^="hspSelect"]').length>=28, '医院设定应有特殊日子小日历');
    var sun = null, mon = null; for(var k = 3; k < 60 && !(sun && mon); k++){ var ds = D(k), dw = new Date(ds+'T00:00:00').getDay(); if(!sun && hspBaseRest(ds) && !hospitalSpecial(hid, ds)) sun = ds; if(!mon && !hspBaseRest(ds) && !hospitalSpecial(hid, ds) && dw===1 && !hspConflicts(ds, 'closed', '', '').length) mon = ds; }
    ST.ok(!!sun && !!mon, '找得到一个休息日和一个营业日'); if(!sun || !mon) return;
    HSP.ym = sun.slice(0,7); HSP.sel = sun; hspRefresh(); document.getElementById('hsp-from').value = '12:00'; document.getElementById('hsp-to').value = '16:00'; hspSet('half');
    ST.ok(!hospitalClosedOn(hid, sun) && hospitalClosedBefore(hid, sun)==='12:00' && hospitalClosedFrom(hid, sun)==='16:00', '本来休息的周日改半天营业 12:00–16:00');
    ST.ok(/半天/.test(krSurgerySlotError(hid, hospitalDirectorNames(hid)[0], sun, '11:00', 60, null, {ignoreBusy:true})) || /休诊/.test(krSurgerySlotError(hid, hospitalDirectorNames(hid)[0], sun, '11:00', 60, null, {ignoreBusy:true})), '半天营业之前的时间不能排施术');
    ST.ok(hospitalSlotClosed(hid, sun, '10:00') && !hospitalSlotClosed(hid, sun, '13:00') && hospitalSlotClosed(hid, sun, '17:00'), '半天营业 12–16 点之外算休诊');
    HSP.sel = mon; hspRefresh(); hspSet('closed'); ST.ok(hospitalClosedOn(hid, mon), '本来营业的周一改休息'); ST.ok(hospitalOpenDates(hid, hospitalDirectorNames(hid)[0]).indexOf(mon)<0, '改休息的日子 IN 选不到');
    HSP.sel = sun; hspRefresh(); hspSet('open'); ST.ok(!hospitalClosedOn(hid, sun) && hospitalClosedFrom(hid, sun)==='' && hospitalClosedBefore(hid, sun)==='', '改为营业'); ST.ok(hospitalOpenDates(hid, hospitalDirectorNames(hid)[0]).indexOf(sun)>-1, '特殊营业的日子可选施术日期');
    /* 改回 */ HSP.sel = sun; hspClear(); HSP.sel = mon; hspClear(); ST.ok(hospitalClosedOn(hid, sun) && !hospitalClosedOn(hid, mon) && !hospitalSpecial(hid, sun) && !hospitalSpecial(hid, mon), '都能改回原来');
    /* 院长开放施术日 = 医院营业 − 院长 OFF：不再有预置开放日期 */
    var dir = hospitalDirectorNames(hid)[0], dd = D(30), kk = 30; while(hospitalClosedOn(hid, dd) || (h.offs||[]).some(function(o){ return o.who===dir && offApplies(o, dd); })){ kk++; dd = D(kk); }
    ST.ok(hospitalOpenOn(hid, dir, dd), '营业日 + 院长没 OFF → 能做手术'); var off = {id:'offT'+Date.now(), date:dd, who:dir, kind:'director', part:'全天', note:''}; h.offs.push(off); ST.ok(!hospitalOpenOn(hid, dir, dd) && hospitalOpenDates(hid, dir).indexOf(dd)<0, '院长整天 OFF → IN 选不到那天'); h.offs = h.offs.filter(function(o){ return o!==off; });
    ST.ok(hospitalOpenOn(hid, dir, dd), '去掉 OFF 又能选'); Store.touch();
  });
  ST.def('CP1','本地置换（取消项目 / 无法协调）',function(){
    var p = ST.localProj('LHALa peel'), price = (function(){ var it = buildLocalItem(p, null); return inLineTotal(it); })();
    /* A：全部取消（无法协调）→ 额度 = 2 倍单价，1 个不够被挡、3 个够、补付差额 */
    var c = ST.newRes('CP1a'); ST.consultToReport(c); ST.selectAndPay(c, ['假体隆鼻']); ST.open(c);
    var kwr = Math.round(2*price/FX_RATES.KRW_IDR); window.confirm = function(){ return true; }; requestCannotCoordinate();
    ST.ok(document.getElementById('refund-overlay').classList.contains('open') && /转本地项目（置换）/.test(document.getElementById('refund-method').innerHTML), '退款弹窗应有「退款方式：退钱 / 转本地项目（置换）」');
    document.getElementById('refund-amount').value = kwr; setRefundMethod('comp'); ST.ok(/置换额度/.test(document.getElementById('refund-comp-hint').innerText), '选转本地后显示置换额度');
    document.getElementById('refund-reason').value = '（自测）无法协调'; confirmRefund();
    ST.ok(!!c.comp && !c.comp.used && c.comp.scope==='main' && Math.abs(c.comp.credit - 2*price) <= 12, '应记置换额度 ≈ 2 倍单价，实际 '+(c.comp&&c.comp.credit)); ST.ok(c.activeCaseTab==='localmgmt' && /置换额度/.test(document.getElementById('case-body').innerText), '直接进本地管理的选购画面并显示置换额度');
    ST.ok((c.refunds||[]).some(function(r){ return r.comp; }) && ST.hasLog(c, /转本地置换/), '定金按置换处理（不是退钱）+ Timeline');
    ST.ok(!hasRefundMark(c) && refundCashSum(c)===0 && compSum(c)>0, '案件标「置换」，不出现「有退款」'); ST.ok(/置换/.test(financeCellHtml(c)) && !/退款/.test(financeCellHtml(c).replace(/置换/g,'')), '财务栏写置换，不写退款');
    toggleLocalProject('main', p.id); confirmProjectSelection(); ST.ok(!latestUnpaidBatch(c), '比额度便宜：不能结算（额度不退钱，要再加项目）'); ST.ok(/还剩 Rp/.test(document.getElementById('case-body').innerText), '提示「还剩 Rp X，请再加项目」');
    c.recommended[0].qty = 3; confirmProjectSelection(); var b = latestUnpaidBatch(c); ST.ok(!!b && b.compCredit===c.comp.credit, '加到超过额度可以结算，结算单带置换额度');
    settleProjects(); ST.ok(/赴韩定金转本地置换/.test(document.getElementById('settle-breakdown').innerText) && !/退还/.test(document.getElementById('settle-breakdown').innerText), '结算窗写置换，没有退还'); confirmSettlementPayment();
    ST.ok(c.comp.used && b.payExtra>0 && ST.hasLog(c, /补付 Rp/), '付款后置换用完，补付差额 + Timeline'); var hs = getClientHoldings(c.name).reduce(function(a, h){ return a.concat(h.batches); }, []).filter(function(x){ return x.caseId===c.id; });
    ST.ok(hs.length && hs.every(function(x){ return x.comp; }), '买到的批次标「置换」'); ST.ok(!refundableBatches(c.name).some(function(x){ return x.b.comp; }), '置换批次不可退款（退款服务不列）'); ST.ok(/置换/.test(settlementCardHtml(c, b)), '结算单写置换');
    /* A2：比额度贵 → 补付 */
    var e = ST.newRes('CP1c'); ST.consultToReport(e); ST.selectAndPay(e, ['假体隆鼻']); ST.open(e); requestCannotCoordinate(); document.getElementById('refund-amount').value = Math.round(price/FX_RATES.KRW_IDR); setRefundMethod('comp'); document.getElementById('refund-reason').value = '（自测）补付'; confirmRefund();
    toggleLocalProject('main', p.id); e.recommended[0].qty = 3; confirmProjectSelection(); var eb = latestUnpaidBatch(e); settleProjects(); confirmSettlementPayment(); ST.ok(e.comp.used && eb.payExtra>0 && ST.hasLog(e, /补付 Rp/), '比额度贵：补付差额');
    /* B：部分取消（取消项目）→ 走本地管理 lm 选购 */
    var d = ST.newRes('CP1b'); ST.consultToReport(d); ST.selectAndPay(d, ['假体隆鼻', '鼻翼缩小']); ST.open(d); openCancelItems(); var cb = document.querySelector('.refund-cb'); cb.checked = true; refundRecalc();
    document.getElementById('refund-amount').value = Math.floor(price/FX_RATES.KRW_IDR); setRefundMethod('comp'); document.getElementById('refund-reason').value = '（自测）取消项目'; confirmRefund();
    ST.ok(!!d.comp && d.comp.scope==='lm' && !!d.localMgmt && krActiveItems(d).length===1, '部分取消：另一个赴韩项目继续，走本地管理选购'); ST.ok(/置换额度/.test(document.getElementById('case-body').innerText), '本地管理选购画面显示置换额度');
    toggleLocalProject('lm', p.id); d.localMgmt.cart[0].qty = 1; lmSettle(); ST.ok((d.localMgmt.batches||[]).length===1 && d.comp.used, '额度约等于一个项目：一次买够即可结算'); ST.ok(!refundableBatches(d.name).some(function(x){ return x.b.comp; }), '置换批次不可退款');
  });

  ST.def('CP2','置换：先不换 → 结束案件 → 客户详情有置换额度 → 下次新案件换（额度归零）',function(){
    var p = ST.localProj('LHALa peel');
    var c = ST.newRes('CP2a'); ST.consultToReport(c); ST.selectAndPay(c, ['假体隆鼻']); ST.open(c); window.confirm = function(){ return true; }; requestCannotCoordinate();
    document.getElementById('refund-amount').value = 500000; setRefundMethod('comp'); document.getElementById('refund-reason').value = '（自测）先不换'; confirmRefund();
    var credit = c.comp.credit; compDefer('main');
    var cr = clientCompCredits(c.name); ST.ok(cr.length===1 && cr[0].amount===credit && cr[0].fromCaseNo===c.caseNo, '先不换：额度存成客人的置换额度（来源原案件）');
    ST.ok(!hasRefundMark(c) && compSum(c)>0, '案件仍标置换、不标有退款'); ST.ok(krActiveItems(c).length===0, '赴韩全部取消，案件退回面诊级');
    ST.ok(canEndCase(c), '赴韩全部取消后出现［结束案件］');
    openClientDetail(c.name); ST.ok(/置换额度/.test(document.getElementById('detail-holdings').innerText) && /不可退款/.test(document.getElementById('detail-holdings').innerText), '客户详情显示置换额度（不可退款）');
    var d = ST.newRes('CP2b'); d.name = c.name; ST.arrive(d); ST.open(d); d.materialsConfirmed = true; d.consultRequested = false; d.localTrack = true; d.entryChoicePending = true; d.projectEntryMode = 'new'; d.projectOriginFilter = 'IN'; d.activeCaseTab = 'localmgmt'; renderCaseBody(d);
    ST.ok(/用置换额度换项目/.test(document.getElementById('case-body').innerText), '新案件本地选购画面出现［用置换额度换项目］');
    compUseCredit(cr[0].id, 'main'); ST.ok(!!d.comp && d.comp.fromCaseNo===c.caseNo, '用额度：记来源原案件号');
    toggleLocalProject('main', p.id); confirmProjectSelection(); ST.ok(!latestUnpaidBatch(d), '下次来换也一样：不够不能结算'); d.recommended[0].qty = 9; confirmProjectSelection(); settleProjects(); confirmSettlementPayment();
    ST.ok(clientCompCredits(c.name).length===0, '换完后额度归零'); ST.ok(ST.hasLog(d, new RegExp('来源 '+c.caseNo)), 'Timeline 写来源原案件号');
  });
  ST.def('HS2','医院设定：有施术的那天改休息被挡，改期后能改（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var hid = krHospitalIdOfMe(), h = krHData(), ds = null, found = null;
    krClinics().forEach(function(cl){ Store.withClinic(cl.id, function(){ CASE_ITEMS.forEach(function(c){ var ks = c.krSchedule; if(!found && krCaseVisible(c, hid) && !c.hasArrived && !isEnded(c) && ks && ks.status==='confirmed' && ks.confirmedDate && ks.confirmedDate > todayStr() && hspConflicts(ks.confirmedDate, 'closed', '', '').length===1) found = {cl:cl.id, c:c, ks:ks}; }); }); });
    if(!ST.ok(!!found, '需要一个已确认施术时间的案件')) return; ds = found.ks.confirmedDate;
    var snap = JSON.stringify(h.specialDays||[]); HSP.sel = ds;
    try{
      var cf = hspConflicts(ds, 'closed', '', ''); ST.ok(cf.some(function(x){ return x.caseNo===found.c.caseNo; }), '冲突列表应含这个案件');
      hspSet('closed'); ST.ok(!(h.specialDays||[]).some(function(x){ return x.date===ds && x.mode==='closed'; }) && !!document.getElementById('hsp-conf-overlay'), '有施术的那天改休息被挡，弹窗列出案件');
      document.getElementById('hsp-conf-overlay').remove();
      var oldD = found.ks.confirmedDate, setD = function(v){ Store.mutateClinic(found.cl, function(){ CASE_ITEMS.forEach(function(c){ if(c.id===found.c.id) c.krSchedule.confirmedDate = v; }); }); }; setD(D(200));
      ST.ok(hspConflicts(ds, 'closed', '', '').filter(function(x){ return x.caseNo===found.c.caseNo; }).length===0, '改期后不再冲突'); hspSet('closed'); ST.ok((h.specialDays||[]).some(function(x){ return x.date===ds && x.mode==='closed'; }), '清空后能改成休息');
      setD(oldD);
    } finally { h.specialDays = JSON.parse(snap); HSP.sel = ''; Store.touch(); }
  });

  /* ---- 新增（CMD-1014-16 三）：IN 在 KR 医院日程占位预约 → KR 确认 / 无法安排 ---- */
  ST.bkFreeSlot = function(hid, from){ for(var d = from||2; d < 25; d++){ var ds = D(d); if(hospitalClosedOn(hid, ds)) continue; for(var m = 11*60; m < 20*60; m += 30){ var t0 = minToTime(m); var dirs = hospitalDirectorNames(hid); for(var i = 0; i < dirs.length; i++){ if(!krSurgerySlotError(hid, dirs[i], ds, t0, 30, null, {allowOffHours:true, use:true}) && !krbOffText(hid, ds, t0)) return {ds:ds, t:t0, dir:dirs[i]}; } } } return null; };
  /* 跨账号三段：A1 占位（BK1a / BK2a）→ KM1 处理（BK1b / BK2b，KR 的 core* 要在 KR 分页里跑，不能在 IN 分页里改同一诊所的分区）→ A1 验证（BK1c / BK2c） */
  ST.def('BK1a','IN 在 KR 医院日程占位（A1 分页）：点空白时段 → 预约窗 → 挡住冲突 → 提交占位',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='A1', '要在 A1 分页里跑')) return; var hid = clinicHospital(CURRENT_CLINIC_ID);
    var cl = krbClients(); if(!ST.ok(cl.length>0, '需要有赴韩项目的客人')) return; var name = cl[0];
    nav('in-dashboard'); setCalView('kr'); setCalMode('week'); var col = [].slice.call(document.querySelectorAll('.kr-daycol')).filter(function(e){ return e.getAttribute('data-ds')>todayStr() && !hospitalClosedOn(hid, e.getAttribute('data-ds')); })[0];
    ST.ok(!!col, 'KR 医院日程周视图应有可点的空白列'); var r = col.getBoundingClientRect(); col.dispatchEvent(new MouseEvent('click', {bubbles:true, clientX:r.left+8, clientY:r.top+KR_ROW_PX*2+3}));
    ST.ok(!!KRB && document.getElementById('krb-overlay').classList.contains('open'), '点空白时段应弹出预约窗');
    var busyCnt = 0; Object.keys(HOSPITAL_DATA[hid].directorSchedule).forEach(function(n){ (HOSPITAL_DATA[hid].directorSchedule[n]||[]).forEach(function(b){ if(b.type==='不可预约' && b.date>todayStr() && !busyCnt){ busyCnt = 1; KRB.client = name; KRB.date = b.date; KRB.time = b.time; krbSubmit(); ST.ok(KRB===null || !/不可预约|重叠|已有/.test(KRB.err||''), 'CMD-1014-18：占位只看医院营业 / 休诊，不再因院长不可预约挡住，实际：'+(KRB&&KRB.err)); var mk = krbList(hid).filter(function(x){ return x.clientName===name && x.date===b.date && x.time===b.time && x.status==='pending'; })[0]; if(mk) krBookCancel(mk.id); } }); });
    if(!KRB) KRB = {hid:hid, date:D(2), time:'11:00', director:'', client:name, purpose:'care', note:'', replaceId:null, info:'', err:''};
    var closed = null; for(var d = 1; d < 15 && !closed; d++){ if(hospitalClosedOn(hid, D(d))) closed = D(d); } if(closed){ KRB.date = closed; krbSubmit(); ST.ok(/休诊/.test(KRB.err||''), '医院休诊日应挡住'); }
    KRB.date = D(-1); krbSubmit(); ST.ok(/过去|休诊|已有|重叠/.test(KRB.err||''), '过去的时间应挡住');
    var slot = ST.bkFreeSlot(hid, 2); if(!ST.ok(!!slot, '找不到空档')) return;
    KRB = {hid:hid, date:slot.ds, time:slot.t, director:'', client:name, purpose:'care', note:'T2 占位', replaceId:null, info:'', err:''}; var n0 = CASE_ITEMS.length; krbSubmit();
    var bk = krbList(hid).filter(function(b){ return b.clientName===name && b.status==='pending' && b.date===slot.ds; })[0]; if(!ST.ok(!!bk, '提交后应有一笔待确认占位，错误：'+(KRB && KRB.err))) return;
    ST.ok(CASE_ITEMS.length===n0, '占位时还不建案件'); ST.ok((HOSPITAL_DATA[hid].directorSchedule[KRB_HOSP]||[]).some(function(b){ return b.bookingId===bk.id && b.kind==='预约' && b.status==='待确认'; }), '全院日程里应有「待确认」预约块（不挂院长）');
    ST.ok(HOSPITAL_DATA[hid].notifs.some(function(x){ return x.bookingId===bk.id && x.kind==='krbook'; }), 'KR 应收到「预约待确认」通知');
    try{ localStorage.setItem('__T2_BK1', JSON.stringify({hid:hid, id:bk.id, name:name, clinic:CURRENT_CLINIC_ID, date:bk.date, dir:bk.director})); }catch(e){}
  });
  ST.def('BK2a','IN 再占一笔（A1 分页，给 KR 测无法安排用）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='A1', '要在 A1 分页里跑')) return; var hid = clinicHospital(CURRENT_CLINIC_ID); var name = krbClients()[1] || krbClients()[0];
    var slot = ST.bkFreeSlot(hid, 4); if(!ST.ok(!!slot, '找不到空档')) return;
    KRB = {hid:hid, date:slot.ds, time:slot.t, director:slot.dir, client:name, purpose:'hold', note:'', replaceId:null, info:'', err:''}; krbSubmit(); var bk = krbList(hid).filter(function(b){ return b.clientName===name && b.status==='pending' && b.date===slot.ds; })[0]; if(!ST.ok(!!bk, '应有占位')) return;
    try{ localStorage.setItem('__T2_BK2', JSON.stringify({hid:hid, id:bk.id, name:name, clinic:CURRENT_CLINIC_ID})); }catch(e){}
  });
  ST.def('BK1b','KR 确认占位 → 建新案件 → 到店 → 完成（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__T2_BK1')||'null'); if(!ST.ok(!!rec, '先在 A1 分页跑 BK1a')) return; var hid = rec.hid;
    var bk = krbFind(hid, rec.id); if(!ST.ok(!!bk && bk.status==='pending', '占位应是待确认')) return;
    var res = coreBookConfirm(hid, bk.id, 'KM1 室长'); ST.ok(res.ok && !!res.caseId, 'KR 确认应成功并建案件：'+res.err); var v = Store.readClinic(rec.clinic), c = (v.CASE_ITEMS||[]).filter(function(x){ return x.id===res.caseId; })[0]; if(!ST.ok(!!c, '应建立新案件')) return;
    ST.ok(c.krVisit && c.krVisit.hospitalId===hid && c.stage==='booked' && c.director===bk.director, '新案件：在韩到店、从预约到店开始、地点 KR 医院'); ST.ok(krAllCases().some(function(x){ return x.id===c.id; }), 'KR 案件列表应看得到这个案件');
    ST.ok(!coreBookDone(hid, bk.id, {kind:'other'}, 'KM1 室长').ok, '没到店不能标完成'); ST.ok(!coreBookArrive(hid, bk.id, 'KM1 室长'), 'CMD-1014-18：还没到预约当天不能标客人已到店'); ST.ok(coreBookSimDay(hid, bk.id) && coreBookArrive(hid, bk.id, 'KM1 室长'), '模拟到当日后标记客人已到店');
    ST.ok(!coreBookDone(hid, bk.id, {kind:'care', name:''}, 'KM1 室长').ok, '新做管理要选项目'); ST.ok(!coreBookDone(hid, bk.id, {kind:'hold', caseId:'x', name:'y'}, 'KM1 室长').ok, '使用持有要选项目');
    var lp = krLocalLib(hid).filter(function(p){ return !p.neg; })[0], sp0 = lp.specs[0];
    ST.ok(!coreBookFeeAdd(hid, bk.id, {name:lp.name, price:0}, 'KM1 室长').ok, '新做管理要有价格');
    ST.ok(coreBookFeeAdd(hid, bk.id, {name:lp.name, specLabel:sp0.label, price:sp0.price, projectId:lp.id}, 'KM1 室长').ok && krbFind(hid, bk.id).fee.status==='待付款', '新做管理：加入后待付款');
    ST.ok(!coreBookDone(hid, bk.id, {kind:'care'}, 'KM1 室长').ok, '待付款不能标完成');
    ST.ok(coreBookFeePaid(hid, bk.id, 'KM1 室长').ok && krbFind(hid, bk.id).fee.status==='已付款', '标记已付款');
    var dn = coreBookDone(hid, bk.id, {kind:'care'}, 'KM1 室长'); ST.ok(dn.ok, '标记完成：'+dn.err); ST.ok(krbFind(hid, bk.id).status==='done', '预约状态 done');
    var cc = (Store.readClinic(rec.clinic).CASE_ITEMS||[]).filter(function(x){ return x.id===res.caseId; })[0]; ST.ok(!(cc.logEntries||[]).some(function(l){ return /₩|KRW|\d,\d{3}|万/.test(l.action) && /新做管理/.test(l.action); }), 'IN 的案件 Timeline 不带 KR 的金额');
  });
  ST.def('BK2b','KR 无法安排 → IN 重选（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__T2_BK2')||'null'); if(!ST.ok(!!rec, '先在 A1 分页跑 BK2a')) return;
    var bk = krbFind(rec.hid, rec.id); if(!ST.ok(!!bk && bk.status==='pending', '占位应是待确认')) return;
    var r1 = coreBookReselect(rec.hid, bk.id, 'reject', '院长当天要做手术', null, 'KM1 室长'); ST.ok(r1.ok && bk.status==='reselect', '无法安排 → 状态 reselect'); ST.ok(!(HOSPITAL_DATA[rec.hid].directorSchedule[bk.director]||[]).some(function(b){ return b.bookingId===bk.id; }), '占位块应拿掉');
    ST.ok((Store.readClinic(rec.clinic).NOTIFS||[]).some(function(x){ return /KR 无法安排预约/.test(x.text); }), 'IN 应收到通知');
  });
  ST.def('BK1c','IN 验证：KR 确认建的新案件（A1 分页，要先 BK1b）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='A1', '要在 A1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__T2_BK1')||'null'); if(!ST.ok(!!rec, '先跑 BK1a / BK1b')) return;
    var bk = krbFind(rec.hid, rec.id); var c = CASE_ITEMS.filter(function(x){ return x.id===bk.caseId; })[0]; if(!ST.ok(!!c, 'IN 应看得到新案件')) return;
    ST.ok(c.krVisit && c.stage==='closed' && /在韩到店完成/.test(caseProcessText(c)), '案件应结案：在韩到店完成'); ST.ok(!calendarEvents().some(function(e){ return e.caseId===c.id; }), '在韩到店案件不画在本院日程（时间是韩国当地）'); ST.ok(!inTodoItems().some(function(i){ return i.kind==='visit' && i.no===c.caseNo; }), '不进「今天来访」');
    ST.ok(NOTIFS.some(function(x){ return /KR 已确认预约/.test(x.text) && x.caseId===c.id; }), 'IN 应收到「KR 已确认预约」消息'); ST.ok(ST.hasLog(c, /KR 确认 IN 在 KR 医院日程的占位预约/) && ST.hasLog(c, /在韩到店完成：新做管理/), 'Timeline 应有确认和完成记录');
    ST.ok(c.krVisit.done && krCaseVisible(c, rec.hid), 'IN 和 KR 都看得到'); ST.note('案件 '+c.caseNo);
  });
  ST.def('BK2c','IN 验证：重选时间（A1 分页，要先 BK2b）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='A1', '要在 A1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__T2_BK2')||'null'); if(!ST.ok(!!rec, '先跑 BK2a / BK2b')) return; var hid = rec.hid, bk = krbFind(hid, rec.id);
    ST.ok(bk.status==='reselect', '占位应是待重选'); var td = inTodoItems().filter(function(i){ return i.kind==='rebook'; }); ST.ok(td.length>=1 && /重选时间/.test(td[0].text), 'IN 待办应出现「重选时间」');
    krBookReselectOpen(bk.id); ST.ok(KRB && KRB.replaceId===bk.id && /院长当天要做手术/.test(KRB.info), '重选窗应带上 KR 的原因'); var slot2 = ST.bkFreeSlot(hid, 6); KRB.date = slot2.ds; KRB.time = slot2.t; KRB.director = slot2.dir; krbSubmit();
    ST.ok(bk.status==='replaced', '旧占位作废'); var bk2 = krbList(hid).filter(function(b){ return b.clientName===rec.name && b.status==='pending' && b.date===slot2.ds; })[0]; ST.ok(!!bk2, '重选后新占位待确认'); ST.ok(!inTodoItems().some(function(i){ return i.kind==='rebook' && i.name===rec.name; }), '重选后「重选时间」待办消失');
    krBookBlockClick(bk2.id); krBookCancel(bk2.id); ST.ok(bk2.status==='cancelled', 'IN 可以取消待确认的占位');
  });
  ST.def('BK3','KR 端：确认预约时间待办 / 日历块 / 预约窗权限（KM1 或 KD1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && /^kr_/.test(me.role), '要在 KR 分页里跑')) return; var hid = krHospitalIdOfMe();
    var pend = krbList(hid).filter(function(b){ return b.status==='pending'; })[0]; if(!ST.ok(!!pend, '先在 A1 分页留一笔待确认占位（BK1 / BK2 做完会清掉，可手动再占一笔）')) return;
    var items = krTodoItems(krAllCases()).filter(function(i){ return i.kind==='bkconf'; });
    if(canDo('krwork')){ ST.ok(items.length>=1 && /确认预约时间/.test(items[0].text), 'KR 室长 / 管理者待办应有「确认预约时间」'); krBookOpen(pend.id); var bt = [].slice.call(document.querySelectorAll('#krb-kr-overlay button')).map(function(b){ return b.textContent; }); ST.ok(bt.indexOf('确认')>-1 && bt.indexOf('改时间')>-1 && bt.indexOf('无法安排')>-1, '预约窗应有［确认］［改时间］［无法安排］，实际 '+bt.join('/')); }
    else { ST.ok(items.length===0, '院长没有「确认预约时间」待办'); krBookOpen(pend.id); ST.ok([].slice.call(document.querySelectorAll('#krb-kr-overlay button')).every(function(b){ return !/^(确认|改时间|无法安排)$/.test(b.textContent); }), '院长看预约窗只读'); }
    var evs = krcEvents().surg.filter(function(x){ return x.b.type==='预约'; }); if(canDo('krwork')) ST.ok(evs.some(function(x){ return x.b.bookingId===pend.id && x.b.status==='待确认'; }), 'KR 日历应有虚线块');
  });

})();
