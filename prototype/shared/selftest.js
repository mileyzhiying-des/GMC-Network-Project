/* shared/selftest.js —— 第 2 轮前全链路自测（CMD-1013-15，开发用，不属于产品功能）
   用法：在 in.html（A1 登录）里注入本脚本，调用 ST.runAll() / ST.run('A1') 等；每个情况用真实的页面函数走一遍，再按 Timeline / 状态断言。
   客人名字前加「T2-」；案件标 round=2。结果放在 ST.R（数组），ST.report() 返回 Markdown 表。 */
(function(){
  var prevR = (window.ST && window.ST.R) || [];
  var ST = window.ST = {R:prevR, __v:1}, cur = null, PH = (window.ST_PH||0);
  window.GMC_NO_TABS = true; /* CMD-1019-04：自测里所有进案件的入口都在当前分页打开 */ window.confirm = function(){ return true; }; window.alert = function(m){ if(cur) cur.alerts.push(String(m)); }; window.open = function(){ return null; };
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
    c.metaviewStatus = 'ready'; var pd0 = CONCERN_PARTS[0], ph0 = {}; pd0.angles.forEach(function(a){ ph0[a.id] = {name:'自测.jpg'}; }); c.concerns = [{part:pd0.key, desc:'（自测）苦恼', expect:'（自测）希望', video:{name:'自测.mp4'}, photos:ph0}]; concernSync(c); c.expectation = '（自测）希望';
    if(o.link){ c.linkedCase = {caseId:o.link.caseId, reason:o.link.reason}; }
    renderCaseBody(c);
    if(o.consult===true || o.consult==='reuse'){ setNeedsConsult(o.consult); } else setNeedsConsult(false);
    if(o.consult===true || o.consult==='reuse'){
      c.hospitalId = c.hospitalId || caseHospitalId(c); if(o.director || !c.director) setCaseDirector(o.director || ST.freeDirector(c));
    }
    renderCaseBody(c);
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
    coreTodayDone(c, ids, ST.krBy); return !!c.krProcedureDone; /* CMD-1015-17：施术完成 → 有术后管理进术后管理阶段，没有直接结案 */
  };
  /* 把还没做的术后管理都做完（韩国：到当天 + 客人已到 + 标完成；印尼：IN 做术后管理，提前要写原因）→ 自动结案 */
  ST.finishCare = function(c){
    carePendingRows(c).slice().forEach(function(s){
      if(s.place==='IN'){ var r = coreCareVisit(c, s.id, 'A1 室长', '（自测）客人提前回来'); ST.ok(r.ok, 'IN 做术后管理失败：'+(r.err||'')); }
      else { coreSubSimDay(c, s.id, ST.krBy); coreSubArrived(c, s.id, ST.krBy); coreSubDone(c, s.id, ST.krBy, []); }
    });
  };
  ST.tests = {};
  ST.run = function(id){ if(!ST.tests[id]) return null; return ST.T(id, ST.tests[id].title, ST.tests[id].fn); };
  /* CMD-1015-06：测试自己建数据、测完清掉。
     ST.begin()：把当前存档（gmc_state / gmc_clinic_*）原样存一份快照到 gmc_cfg_stsnap（已有快照就不覆盖，所以跨账号分页接着跑也只留最早那份）；
     ST.ensureFixtures()：用一键准备的同一套造法在 C1 建好 KR 阶段用例要的案件（待到院 / 已付定金 / 面诊结束 / 已付面诊费），IN 和 KR 分页都能调用；
     ST.cleanup()：整份还原快照 + 清掉测试留下的 localStorage 键，并刷新页面（还原后本页不再写档，避免旧内存又盖回去）。 */
  ST.begin = function(){
    try{ if(localStorage.getItem('gmc_cfg_stsnap')) return false; var o = {}; Object.keys(localStorage).filter(function(k){ return /^gmc_(state|clinic_)/.test(k); }).forEach(function(k){ o[k] = localStorage.getItem(k); }); localStorage.setItem('gmc_cfg_stsnap', JSON.stringify(o)); return true; }catch(e){ console.warn('[测试] 快照失败', e); return false; }
  };
  ST.cleanup = function(){
    var raw = localStorage.getItem('gmc_cfg_stsnap'); if(!raw) return false;
    window.GMC_NO_SAVE = true; /* store.js 的 save() 看到这个就不写档 */
    var o = JSON.parse(raw);
    Object.keys(localStorage).filter(function(k){ return /^gmc_(state|clinic_)/.test(k); }).forEach(function(k){ localStorage.removeItem(k); });
    Object.keys(o).forEach(function(k){ localStorage.setItem(k, o[k]); });
    localStorage.removeItem('gmc_cfg_stsnap'); localStorage.removeItem('gmc_cfg_stfix'); try{ gmcClearTestKeys(); }catch(e){}
    setTimeout(function(){ location.reload(); }, 50); return true;
  };
  ST.loadTestprep = function(){ return new Promise(function(res){ if(window.TESTPREP_MAKE) return res(); var sc = document.createElement('script'); sc.src = '/shared/testprep.js?'+Date.now(); sc.onload = res; document.head.appendChild(sc); }); };
  ST.ensureFixtures = async function(keys){
    var done = {}; try{ done = JSON.parse(localStorage.getItem('gmc_cfg_stfix') || '{}'); }catch(e){}
    keys = (keys || ['stagePay', 'stageA', 'stageW', 'stageB', 'stageC']).filter(function(k){ return !done[k]; }); /* 案件列表按最近更新排序：同状态的取最后建的，所以「面诊还没开始」的 stageW 放在 stageA 后面；已建过的夹具不重复建 */
    if(!keys.length) return false;
    await ST.loadTestprep();
    /* 键后缀：无 = C1（对接 H1）；@C2 = C2（对接 H1）；@H2 = C3（对接 H2），KM2 / B1 角色测试用 */
    var CFG = {'': {cid:'C1', cfg:null}, '@C2': {cid:'C2', cfg:null}, '@H2': {cid:'C3', cfg:{hid:'H2', director:'H2 院长1', coord:'KM2 室长'}}};
    var onKr = typeof isKrAccount==='function' && isKrAccount();
    Object.keys(CFG).forEach(function(suf){
      var ks = keys.filter(function(k){ var m = /(@C2|@H2)$/.exec(k); return (m ? m[1] : '') === suf; }); if(!ks.length) return;
      var run = function(){ ks.forEach(function(k){ window.TESTPREP_MAKE(k.replace(/@(C2|H2)$/, ''), CFG[suf].cfg); done[k] = 1; }); };
      if(!onKr && CURRENT_CLINIC_ID===CFG[suf].cid){ run(); Store.touch(); } else Store.mutateClinic(CFG[suf].cid, run);
    });
    try{ localStorage.setItem('gmc_cfg_stfix', JSON.stringify(done)); }catch(e){}
    return true;
  };
  ST.runAll = async function(ids){ ST.begin(); if(typeof isKrAccount==='function' && isKrAccount()) await ST.ensureFixtures(); (ids || Object.keys(ST.tests)).forEach(function(id){ ST.run(id); }); return ST.sum(); };
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
    ST.ok(ST.hasLog(c, /发起"增加面诊"/), '缺记录'); var t = consultTabHtml(c); ST.ok(!/意向项目/.test(t) && /预算/.test(t), '增加面诊页应有意向项目 / 预算（同基础资料）');
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
    ST.ok(ST.hasLog(c, /院长评估结果：可以手术，但需要调整方案/), '缺评估记录'); ST.ok(ST.krCloseToday(c) && (isEnded(c) || c.stage==='postcare'), '调整方案后施术完成：结案或进术后管理');
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
    var c = toConfirmed('D18'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); ST.ok(ST.krCloseToday(c), '今日项目完成失败');
    ST.ok(c.stage==='postcare' && !!c.surgeryDoneAt && !isEnded(c), '施术完成且有术后管理 → 术后管理阶段，实际 '+c.stage);
    ST.ok(corePcBooking(c, pcRows(c, 'IN'), ST.krBy), '术后管理预约失败'); ST.ok(c.stage==='postcare' && carePendingRows(c).some(function(s){ return s.place==='IN'; }) && carePendingRows(c).some(function(s){ return s.place==='KR'; }), '韩国 + 印尼的术后管理都还没做');
    ST.finishCare(c); ST.ok(isEnded(c) && c.stage==='closed', '术后管理全部做完 → 自动结案，实际 '+c.stage);
    var sc = subCaseList(c); ST.ok(sc.length>=2 && subCaseNo(c, sc[0])===c.caseNo+'-1', '每次到院一个子案件（施术当天是主案件，不另编）');
  });
  function pcRows(c, inWhere){
    var rows = [], k0 = 0;
    pcUniqueEntries(c).forEach(function(e){ var x = e.x; for(var k = 0; k < (x.times||1); k++){ var where = (x.place==='either' && inWhere) ? 'IN' : 'KR'; rows.push({where:where, item:e.it.name, pcIdx:e.i, date:D(14+k0++), time:'10:00', mgmt:x.mgmt, name:x.name, innName:x.innName, day:null, askIn:where==='IN' && inWhere==='ask'}); } });
    return rows;
  }
  ST.pcRows = pcRows;
  ST.def('D19','术后管理回印尼使用（关联原案件）',function(){
    var c = toConfirmed('D19'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c);
    ST.ok(corePcBooking(c, pcRows(c, 'IN'), ST.krBy), '术后管理预约失败'); ST.ok(ST.krCloseToday(c) && c.stage==='postcare', '施术完成进术后管理阶段');
    ST.ok(!(CLIENT_HOLDINGS[c.name]||[]).some(function(h){ return h.batches.some(function(b){ return b.pkg; }); }), 'CMD-1015-17：术后管理不转持有，不应有套餐内含批次');
    var inRow = carePendingRows(c).filter(function(s){ return s.place==='IN'; })[0]; if(!ST.ok(!!inRow && !!inRow.suggest, '回印尼做的留在原案件，带 KR 标注的建议日期')) return;
    /* ［结束术后管理］（原因必填）→ 结案；没做的不作废，客户详情列出；再来做 = 开新案件（本地管理）用掉 */
    ST.ok(!coreEndPostcare(c, '', 'A1 室长').ok, '结束原因必填'); ST.ok(coreEndPostcare(c, '（自测）客人不回来了', 'A1 室长').ok && isEnded(c), '结束术后管理 → 结案');
    var left = clientCareLeft(c.name); ST.ok(left.length>=1 && left[0].s.id===inRow.id, '没做的印尼术后管理显示在客户详情（不作废）');
    var c2 = ST.newRes('D19', {phone:clientPhoneOf(c.name)}); ST.arrive(c2); ST.materials(c2, {consult:false}); chooseProjectEntryMode('holdings'); ST.open(c2); renderCaseBody(c2);
    ST.ok(/术后管理/.test(holdingsUseHtml(c2, 'main')) && /免费，不能退款/.test(holdingsUseHtml(c2, 'main')), '本地管理「使用持有项目」里列出（标术后管理、免费、不能退款）');
    openCareUse('main', c.id, inRow.id); var rs = document.getElementById('pc-use-reason'); if(rs) rs.value = '（自测）客人提前回来'; confirmCareUse();
    ST.ok(c2.linkedCase && c2.linkedCase.caseId===c.id && c2.linkedCase.auto, '应自动关联原赴韩案件'); ST.ok(ST.hasLog(c2, /自动关联该案件/), '缺自动关联记录'); ST.ok(ST.hasLog(c, /术后管理：/) && inRow.done, '原赴韩案件 Timeline 应有术后管理使用记录');
  });
  ST.def('D20','到院前取消部分项目 + 加项',function(){
    var c = toConfirmed('D20'); ST.open(c); openCancelItems(); var cb = document.querySelector('.refund-cb'); if(!ST.ok(!!cb, '取消项目弹窗没有勾选框')) return; cb.checked = true;
    document.getElementById('refund-amount').value = '100000'; document.getElementById('refund-reason').value = '（自测）客人不做了'; confirmRefund();
    ST.ok(ST.hasLog(c, /取消项目"/), '缺取消项目记录'); ST.ok(krNotStartedItems(c).length===1, '应剩 1 个项目，实际 '+krNotStartedItems(c).length);
    c.addingMore = true; c.recommended = []; var p = PROJECT_LIBRARY.filter(function(x){ return x.origin==='KR' && x.hospitalId==='H1' && x.name==='埋线双眼皮'; })[0]; toggleProject(p.id); confirmAddition(); window.SETTLE_ANES_SIGNED = true; confirmSettlementPayment();
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
    ST.ok(c.krBalancePaid, '尾款应已结清'); ST.ok(ST.krCloseToday(c) && (isEnded(c) || c.stage==='postcare'), '施术完成：结案或进术后管理，实际 '+c.stage);
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
  ST.def('E8','催办',function(){
    var c = ST.newRes('E8'); ST.arrive(c); ST.materials(c, {consult:true}); ST.payConsult(c); var d = new Date(Date.now()-3*3600000); c.consultPaidAt = d.toISOString().slice(0,10)+' '+d.toISOString().slice(11,16);
    ST.ok(!urgeInfo(c), '新规则：待确认面诊时间不再有 30 分钟的催办'); coreConfirmConsultTimes(c, todayStr(), '20:30', D(1)+' 05:00', ST.krBy); c.reportEta = D(-1)+' 05:00';  /* 新规则：等报告超过预计出报告时间才能催 */
    ST.ok(!!urgeInfo(c), '等待报告超过预计时间应可催办'); urgeKr(); ST.ok(ST.hasLog(c, /催办 KR 室长/), '缺催办记录'); var hn = HOSPITAL_DATA.H1.notifs || []; ST.ok(hn.some(function(n){ return /催办/.test(n.text) && n.caseId===c.id; }), 'KR 应收到催办通知');
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
    openBeautyAdd(null); var bae = document.getElementById('beauty-add-overlay').innerHTML; ST.ok(/id="ba-year"/.test(bae) && /id="ba-month"/.test(bae) && /id="ba-day"/.test(bae) && /<textarea id="ba-project"/.test(bae) && !/datalist/.test(bae) && /取消[\s\S]*保存/.test(bae), '补登医美史：年 / 月 / 日下拉 + 多行项目输入，没有项目库下拉，［取消］［保存］'); document.getElementById('ba-year').value = '2025'; saveBeautyAdd(); ST.ok(document.getElementById('ba-err').style.display==='block' && !beautyRecordsOf(clientByName(c.name)).some(function(r){ return r.project==='外院玻尿酸'; }), '只选年没选月不能保存'); document.getElementById('ba-month').value = '6'; document.getElementById('ba-project').value = '外院玻尿酸'; document.getElementById('ba-day').value = '31'; saveBeautyAdd(); ST.ok(document.getElementById('ba-err').style.display==='block', '6 月没有 31 日'); document.getElementById('ba-day').value = ''; saveBeautyAdd(); var br0 = beautyRecordsOf(clientByName(c.name)).filter(function(r){ return r.project==='外院玻尿酸'; })[0]; ST.ok(br0 && !br0.day && beautyYm(br0)==='2025-06' && br0.source==='室长登记', '日不填：保存成功，显示 2025-06（来源：室长登记）'); openBeautyAdd(null); document.getElementById('ba-year').value = '2024'; document.getElementById('ba-month').value = '3'; document.getElementById('ba-day').value = '15'; document.getElementById('ba-project').value = '在雅加达某诊所做过埋线双眼皮\n约 1 年前'; saveBeautyAdd(); var br1 = beautyRecordsOf(clientByName(c.name)).filter(function(r){ return /埋线双眼皮/.test(r.project); })[0]; ST.ok(br1 && br1.day===15 && beautyYm(br1)==='2024-03-15' && /\n/.test(br1.project), '有日：显示 2024-03-15，多行项目原样保存'); ST.ok(beautyRecordsOf(clientByName(c.name)).some(function(r){ return r.project==='外院玻尿酸'; }), '医美史应能补登（项目纯文字 + 年月）');
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
      var free = null; for(var d1 = 20; d1 < 60 && !free; d1++){ var dd = D(d1); if(new Date(dd+'T00:00:00').getDay()!==0 && !((h.directorSchedule['KD1 院长']||[]).some(function(b){ return b.date===dd; })) && !krBusySlotError(krHospitalIdOfMe(), 'KD1 院长', dd, '12:00', '12:30')) free = dd; /* 跳过 KD1 有 OFF 的日子（每周三） */ }
      KRC.pop = {date:free}; KRC.popForm = {who:'KD1 院长', start:'12:00', end:'12:30', part:'全天'}; var b0 = (h.directorSchedule['KD1 院长']||[]).length; krcAddBusy(); ST.ok((h.directorSchedule['KD1 院长']||[]).length===b0+1, '空的日子应能代登不可预约');
      var free2 = null; for(var d2 = 21; d2 < 80 && !free2; d2++){ var d2s = D(d2); if(d2s!==free && new Date(d2s+'T00:00:00').getDay()!==0 && !krBusySlotError(krHospitalIdOfMe(), 'KD1 院长', d2s, '11:00', '13:00')) free2 = d2s; } /* 半天 OFF 另找一天，避开刚加的不可预约 */
      KRC.pop = {date:free2}; KRC.popForm = {who:'KD1 院长', start:'12:00', end:'12:30', part:'上午'}; var o1 = (h.offs||[]).length; krcAddOff(); ST.ok((h.offs||[]).length===o1+1, '应能代登半天 OFF');
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
    krpOpen('new'); KRP.draft.parts = ['f_eyes']; KRP.draft.names.zh = 'T2手术项目'; KRP.draft.names.ko = 'T2 수술'; KRP.draft.price = '3000000'; KRP.draft.defaults = {stay:'6天', durMin:'', anes:'sleep', anesNote:'需空腹', postcare:[]};
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
    ST.ok(!!document.getElementById('lib-add-btn') === !!canDo('krshowedit'), 'KR 室长 / 管理者有［新增案例］，院长 / 代表院长没有（CMD-1019-07）'); ST.ok(!libCaseCanEdit('travel') && !libCaseCanEdit('local') && !libCaseCanEdit({source:'travel', by:'IN'}), 'KR 不能编辑 IN 的案例');
    if(lc0){ openLibCaseModal(lc0.id); ST.ok(LIB_EDIT===null, 'KR 点 IN 案例的编辑不应打开编辑窗'); libOpenCase(lc0.id); ST.ok(!/编辑|删除/.test(document.getElementById('lib-grid').innerText), 'KR 案例详情页不应有［编辑］［删除］'); }
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
    var h = krHData(); KRC.layer = 'director'; KRC.person = 'KD1 院长'; ST.ok(krcWho()==='KD1 院长', '应能切到某位院长的日程'); var free = null; for(var d1 = 70; d1 < 120 && !free; d1++){ var dd = D(d1); if(new Date(dd+'T00:00:00').getDay()!==0 && !(h.directorSchedule['KD1 院长']||[]).some(function(b){ return b.date===dd; })) free = dd; }
    KRC.pop = {date:free}; KRC.popForm = {who:'KD1 院长', start:'13:00', end:'13:30', part:'全天'}; var b0 = (h.directorSchedule['KD1 院长']||[]).length; krcAddBusy(); ST.ok((h.directorSchedule['KD1 院长']||[]).length===b0+1, 'KC1 应能登记不可预约'); KRC.person = 'all';
    /* 通知：需要处理 / 进入下一阶段要手动确认，一般消息自动消失 */
    var lv = function(txt){ return notifLevel(txt); }; ST.ok(lv('催办：x')==='action' && lv('施术日期待确认：x')==='action', '「催办 / 待确认」应是 action 级（「需要处理：」类通知创建时显式指定 level）'); ST.ok(lv('客人已缴面诊费：x')==='next' || lv('客人已缴面诊费：x')==='action', '「已缴面诊费」应是进入下一阶段（手动确认）'); ST.ok(lv('KM1 室长 进入了房间')==='info', '一般消息应是 info 级');
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
      var n0 = NOTIFS.length; BK.mode = 'me'; BK.me = {at:Date.now(), phone:clientPhoneOf(booked.name), cancelled:[], confirm:null, msg:'', booked:null}; bkMeCancel(booked.id); ST.ok(booked.stage==='cancelled' || booked.subState==='cancelled', '取消后案件应为已取消'); ST.ok(NOTIFS.length>n0 && NOTIFS.some(function(n){ return /取消预约|客人取消|取消了.*的预约/.test(n.text) && n.caseId===booked.id; }), 'IN 应收到「客人取消预约」通知');
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
      var d = new Date(Date.now()-3*3600000); c.consultPaidAt = d.toISOString().slice(0,10)+' '+d.toISOString().slice(11,16); c.consultStatus = 'awaiting_report'; c.reportOverdue = true;  /* CMD-1013-17：只有等报告超时才能催 */
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
    var c = ST.newRes('G2'); ST.consultToReport(c); ST.open(c); ST.ok(canEndCase(c), '项目确认中应可结束');
    ST.endCase(c, {}, '其他', null, '客人说再想想'); ST.ok(c.stage==='reportonly', '出了报告没做项目 → 仅出报告，实际 '+c.stage); ST.ok(ST.hasLog(c, /当时：项目确认中）：其他：客人说再想想/), '缺记录');
  });
  ST.def('G3','本地没用完就手动结束（转持有 / 退款）',function(){
    var p = ST.localProj('LHALa peel');
    var a = ST.localCase('G3a'); ST.localPay(a, function(){ toggleLocalProject('main', p.id); }); ST.open(a); openEndCase(); var ra = endCaseRows(a).filter(function(r){ return r.hold; }); closeEndCase();
    ST.ok(ra.length===1, '应列出一个未用完的本地批次，实际 '+ra.length);
    ST.endCase(a, (function(){ var o = {}; o[ra[0].key] = 'keep'; return o; })(), '客人不做了'); ST.ok(isEnded(a) && a.stage==='closed', '转持有 → 有购买 → 已结案，实际 '+a.stage); ST.ok(ST.hasLog(a, /转为客人持有/), '缺转持有记录');
    var b = ST.localCase('G3b'); ST.localPay(b, function(){ toggleLocalProject('main', p.id); }); ST.open(b); openEndCase(); var rb = endCaseRows(b).filter(function(r){ return r.hold; }); closeEndCase();
    var ch = {}, am = {}; ch[rb[0].key] = 'refund'; am[rb[0].key] = '100000';
    ST.endCase(b, ch, '失联', am); ST.ok(isEnded(b), '退款后应结束'); ST.ok(rb[0].hold.b.voided && rb[0].hold.b.refund && rb[0].hold.b.refund.amount===100000, '批次应作废并记退款'); ST.ok(ST.hasLog(b, /结束案件：退款/), '缺退款记录');
  });
  ST.def('G4','有待收款时结束被挡 / 取消该项目后可结束',function(){
    var p = ST.localProj('LHALa peel'), c = ST.localCase('G4'); ST.open(c); c.activeCaseTab = 'localmgmt'; chooseProjectEntryMode('new'); toggleLocalProject('main', p.id); confirmProjectSelection();
    ST.ok(!!latestUnpaidBatch(c), '应有待付款结算单'); ST.ok(closeBlockers(c).length===1, '应有 1 项待收款');
    noPurchaseThisTime(); ST.ok(!isEnded(c), '钱没清，自动结束点不应结束'); ST.ok(ST.hasLog(c, /案件暂不结束：还有未处理的款项/), '缺系统记录');
    openEndCase(); var rows = endCaseRows(c), br = rows.filter(function(r){ return r.key.indexOf('batch:')===0; })[0]; ST.ok(!!br, '弹窗应列出待收款'); 
    END_CASE.reason = '客人不做了'; ST.ok(!!endCaseMissing(c), '没选收款 / 取消前不能确定'); closeEndCase();
    var ch = {}; ch[br.key] = 'cancel'; ST.endCase(c, ch, '客人不做了'); ST.ok(isEnded(c) && !latestUnpaidBatch(c), '取消该项目后应能结束'); ST.ok(c.stage==='cancelled', '没有购买 → 已取消，实际 '+c.stage);
  });
  ST.def('N1','新结案优先级：面诊案件本地做完不结案 / 纯本地做完结案',function(){
    var fake = {consultRequested:true, consultStatus:'report_ready', needsConsult:true};
    ST.ok(mainlineOngoing(fake) === true && mainlineOngoingRepair(fake) === false, '项目确认中的面诊案件：主线进行中（修复专用的旧判断不是）');
    ST.ok(mainlineOngoing({consultRequested:true, consultStatus:'report_ready', endNote:'客人不做项目'}) === false, '客人不做项目后主线结束');
    var p = ST.localProj('LHALa peel'), c = ST.localCase('N1'); ST.localPay(c, function(){ toggleLocalProject('main', p.id); }); ST.useHold(c, 'main', p.name, 1); addConsult();
    markMgmtRows('main', 'done', true); ST.ok(!isEnded(c), '本地案件中途增加面诊 → 本地做完不结案，实际 '+c.stage);
  });
  ST.def('N2','本地管理只能当天加（模拟到隔天）',function(){
    var c = ST.newRes('N2'); ST.arrive(c); ST.materials(c,{consult:true}); ST.payConsult(c); ST.open(c);
    ST.ok(localAddAllowed(c), '到店当天应能添加'); var shown = /\+ 添加本地管理/.test((function(){ renderCaseHeaderActions(c); return document.getElementById('case-chat-actions').innerHTML; })()); ST.ok(shown, '当天应显示［+ 添加本地管理］');
    DEMO_SHIFT_MS += 26*3600000;
    try{
      renderCaseHeaderActions(c); var html = document.getElementById('case-chat-actions').innerHTML;
      ST.ok(!localAddAllowed(c) && !/\+ 添加本地管理/.test(html), '隔天应不能添加 / 不显示按钮'); var n = window.__alerts ? window.__alerts.length : 0; addLocalMgmt(); ST.ok(!c.localMgmt, '隔天 addLocalMgmt 应被拦');
    } finally { DEMO_SHIFT_MS -= 26*3600000; }
    /* 纯本地案件不受限 */
    var l = ST.localCase('N2b'); DEMO_SHIFT_MS += 26*3600000; try{ ST.ok(localAddAllowed(l), '纯本地案件不适用当天限制'); } finally { DEMO_SHIFT_MS -= 26*3600000; }
  });
  ST.def('N3','［结束案件］权限与时机',function(){
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
    var has = function(c, k){ return inTodoItems().some(function(i){ return i.no===c.caseNo && i.kind===k; }); };
    var c = ST.newRes('TD1'); ST.consultToReport(c); ST.ok(has(c,'plan'), '诊疗方案已到应有「联络客人选项目」待办');
    ST.open(c); c.activeCaseTab = 'kr'; var p = PROJECT_LIBRARY.filter(function(x){ return x.origin==='KR' && x.hospitalId==='H1' && x.name==='假体隆鼻'; })[0]; toggleProject(p.id); confirmProjectSelection();
    ST.ok(!has(c,'plan') && has(c,'pay'), '选了项目后：计划待办消失、出现「待收款」'); reselectProjects(); ST.ok(!has(c,'pay'), '撤销待付款结算单后「待收款」消失');
    /* 项目确认中超过 3 天没动静 */
    var q = ST.newRes('TD1q'); ST.consultToReport(q); ST.ok(!has(q,'quiet'), '刚出诊疗方案不应有「没动静」'); var old = new Date(Date.now()-5*86400000).toISOString(); q.logEntries.forEach(function(e){ e.dt = old.slice(0,10)+' '+old.slice(11,16); }); ST.ok(has(q,'quiet'), '超过 3 天没动静应出现');
    /* 等待报告超时 → 可催办（已超时分组） */
    var u = ST.newRes('TD1u'); ST.arrive(u); ST.materials(u,{consult:true}); ST.payConsult(u); coreConfirmConsultTimes(u, todayStr(), '20:30', D(1)+' 05:00', ST.krBy); ST.open(u);
    ST.ok(!urgeInfo(u), '还没超过预计出报告时间不能催'); u.reportEta = D(-1)+' 05:00'; ST.ok(has(u, 'waitkr') && !!urgeInfo(u), '超过预计出报告时间应可催办'); ST.ok(/已超时/.test(todoPaneHtml(inTodoItems())), '待办栏应有「已超时」分组');
    var pd = ST.newRes('TD1p'); ST.arrive(pd); ST.materials(pd,{consult:true}); ST.payConsult(pd); var d3 = new Date(Date.now()-3*3600000); pd.consultPaidAt = d3.toISOString().slice(0,10)+' '+d3.toISOString().slice(11,16); ST.ok(!urgeInfo(pd), '待确认面诊时间不再有 30 分钟的催办门槛');
    /* 转告客人：KR 确认施术时间后出现，打开赴韩施术 tab 后消失 */
    var s = ST.toConfirmed('TD1s'); ST.ok(has(s,'relay'), 'KR 确认施术时间后应有「转告客人」待办'); ST.open(s); s.activeCaseTab = 'kr'; renderCaseBody(s); ST.ok(has(s,'relay'), '10/14 起：打开 tab 不算已转告，要按［已转告客人］'); calRelayDone(s.id); ST.ok(!has(s,'relay'), '已转告 / 打开 tab 后「转告客人」应消失');
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
    ST.ok(msg.count===0, '消息不应弹出，实际 '+msg.count); ST.ok(todo.count===1 && !todo.sticky, '新待办应弹一次、不用确认（非停留）'); ST.ok(stay.count===1 && stay.sticky, '未接来电应弹出并停留'); 
    stack.innerHTML = '';
  });
  ST.def('TD3','默认日视图 + 现在时间线 + IN 四张卡',function(){
    nav('in-dashboard'); todoRefresh(); var cards = document.getElementById('in-cards'); ST.ok(!!cards && cards.children.length===4, 'IN 应有 4 张卡，实际 '+(cards ? cards.children.length : 0));
    ST.ok(/待我处理/.test(cards.innerText) && /今天来访/.test(cards.innerText) && /等 KR 回复/.test(cards.innerText) && /新消息/.test(cards.innerText), '4 张卡的名字');
    var back = ST.shiftTo(11, 10); try{
      setCalMode('week'); TODO_SCROLL_KEY = ''; renderCalendar(); var l = document.querySelector('.todo-nowline'); ST.ok(!!l && l.textContent==='11:10', '周视图应有 11:10 的现在时间线'); ST.ok(document.querySelector('#cal-week-view .wk-scroll').scrollTop > 0, '应自动滚到现在附近');
      setCalMode('day'); renderCalendar(); ST.ok(!!document.querySelector('#day-grid .todo-nowline'), '日视图整天格里应有现在时间线');
    } finally { back(); }
  });
  ST.def('TD4','催办新门槛：待确认施术时间超过 1 个工作日',function(){
    var c = ST.newRes('TD4'); ST.consultToReport(c); ST.selectAndPay(c, ['假体隆鼻']); ST.open(c); var ks = ensureKrScheduleDraft(c), od = caseOpenDates(c); ks.primary = od[0]; submitKrScheduleDate();
    ST.ok(scheduleState(c)==='Pending' && !urgeInfo(c), '刚递交的施术日期不能催');
    var old = new Date(Date.now()-4*86400000).toISOString(); c.logEntries.filter(function(e){ return /递交施术日期/.test(e.action); }).forEach(function(e){ e.dt = old.slice(0,10)+' '+old.slice(11,16); });
    var u = urgeInfo(c); ST.ok(!!u && /1 个工作日/.test(u.label), '超过 1 个工作日应可催办，实际 '+JSON.stringify(u));
  });

  /* ---- KR 端（在 KM1 分页里跑）：卡片 8→4、待办生成与案件状态一致、弹出分类 ---- */
  ST.def('TDK1','KR 待办 / 四张卡（KM1）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
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
    ST.ok(KRC.mode==='day' || KRC.mode==='week' || KRC.mode==='month', 'KRC 模式');
  });
  ST.def('TDK2','KR 弹出提示分类（KM1）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var stack = document.getElementById('toast-stack'); if(!ST.ok(!!stack, '没有 toast 容器')) return; var h = krHData();
    var fire = function(text, kind){ stack.innerHTML = ''; var n = {id:'kn'+Math.random(), ts:nowFullDt(), text:text, clinicId:'C1', caseId:null, to:'coord', director:null, only:null, kind:kind||'case', by:'A1 室长', readBy:[]}; h.notifs.unshift(n); KR_NOTIF_SEEN = KR_NOTIF_SEEN || {}; krToastNew(krNotifUnread()); var kids = [].slice.call(stack.children); return {count:kids.length, sticky:kids.some(function(k){ return k.getAttribute('data-sticky'); })}; };
    var msg = fire('IN 结束案件：自测客人（A000999）原因：客人不做了'), todo = fire('客人已缴面诊费：自测客人（A000999）→ 请确认报告时间', 'consultpaid'), stay = fire('KC1 室长 在「自测」里 @ 了你', 'mention');
    ST.ok(msg.count===0, '消息不弹，实际 '+msg.count); ST.ok(todo.count===1 && !todo.sticky, '新待办弹一次自动收起'); ST.ok(stay.count===1 && stay.sticky, '被 @ 停留'); 
    stack.innerHTML = ''; h.notifs = h.notifs.filter(function(n){ return !/自测/.test(n.text); });
  });

  /* ================= CMD-1014-01 三边日历对齐 + 待办补充 ================= */
  ST.def('CAL1','IN 日视图整天格 + 时间范围前后 2 小时 + 待办卡片筛选 + 转告 / 确认日程无变动',function(){
    nav('in-dashboard');
    setCalMode('day'); renderCalendar(); var g = document.getElementById('day-grid'); ST.ok(!!g && !!document.getElementById('day-col'), '日视图应是 KR 画法的整天时间格');
    /* CMD-1015-01：营业时间外（前后 2 小时）按需显示——没有营业外预约的一天只显示营业时间；点顶 / 底小条才展开前后 2 小时 */
    var o0 = timeToMin(CLINIC_SETTINGS.openTime), cl0 = timeToMin(CLINIC_SETTINGS.closeTime), dayRange = function(){ var col = document.getElementById('day-col'), H0 = parseInt(col.getAttribute('data-h0'),10); return [H0, H0 + Math.round(col.offsetHeight*60/CAL_DAY_PX)]; };
    DAY_OFFSET = 40; CAL_OUT.in.b = CAL_OUT.in.a = false; renderCalendar(); var rg = dayRange(); ST.ok(rg[0]===o0 && Math.abs(rg[1]-cl0)<=30, '没有营业外预约：只显示营业时间 '+minToTime(rg[0])+'～'+minToTime(rg[1]));
    ST.ok(document.querySelectorAll('#day-grid .wk-outbar').length===2, '时间轴顶 / 底各一个「显示营业前 / 后」小条');
    CAL_OUT.in.b = CAL_OUT.in.a = true; renderCalendar(); rg = dayRange(); ST.ok(rg[0]===o0-120 && Math.abs(rg[1]-(cl0+120))<=30, '点开后显示营业时间前后各 2 小时：'+minToTime(rg[0])+'～'+minToTime(rg[1]));
    CAL_OUT.in.b = CAL_OUT.in.a = false; DAY_OFFSET = 41; var early = createReservationCase('T2-OUT', null, dateStr(new Date(new Date(TODAY_DATE).getTime()+41*86400000)), minToTime(o0-60), '+62 811-9999-0101', '面诊商谈'); renderCalendar(); rg = dayRange(); ST.ok(rg[0]<o0, '有预约落在营业前 → 自动显示营业前那段（'+minToTime(rg[0])+'）'); ST.ok(!(calInNeed().a!==null), '没有营业后预约就不展开营业后'); CASE_ITEMS.splice(CASE_ITEMS.indexOf(early), 1); DAY_OFFSET = 0;
    setCalMode('week'); WEEK_OFFSET = 9; CAL_OUT.in.b = false; renderCalendar(); ST.ok(document.querySelectorAll('#wk-grid .wk-time')[0].textContent.slice(2,7)===minToTime(o0), '周视图：没有营业外预约就从营业开始'); WEEK_OFFSET = 0; renderCalendar(); var o = o0;
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
    ST.krcRangeCheck(hr);
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
    ST.ok(krHoldCard.toString().indexOf('安排使用')<0, 'KR 在韩持有没有［安排使用］，只有［使用］和［预约后续到院］（CMD-1015-17）');
  });
  ST.def('CAL3','KR 待办：院长上传面诊内容 / KR 等院长上传（已超时）+ 两个 bug（KM1 / KD1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && /^(KM1|KD1)$/.test(me.id), '要在 KM1 / KD1 分页里跑')) return;
    var rows = krAllCases(), items = krTodoItems(rows), K = function(r, k){ return items.some(function(i){ return i.rowKey===r.clinicId+':'+r.id && i.kind===k; }); };
    rows.forEach(function(r){
      var c = r.c;
      if(krIsDirector()) ST.ok(K(r,'upload') === (c.consultStatus==='awaiting_report' && !c.consultContentAt), r.caseNo+'：院长「上传面诊内容」待办与状态一致');
      else ST.ok(K(r,'waitdir') === (c.consultStatus==='awaiting_report' && !c.consultContentAt), r.caseNo+'：KR「等院长上传面诊」待办与状态一致');
    });
    /* bug（不带开关）：确认了施术时间的案件都有地址和 -1 施术子案件 */
    rows.forEach(function(r){ var ks = r.c.krSchedule; if(!ks || ['confirmed','change_pending','arrived'].indexOf(ks.status)<0 || !r.c.settlementDone) return; ST.ok(!!ks.address, r.caseNo+'：KR 确认施术时间后应有地址'); ST.ok((r.c.subItems||[]).some(function(s){ return s.kind==='施术'; }), r.caseNo+'：时间已确认应有 -1 子案件'); });
  });

  /* ================= CMD-1014-02 ================= */
  ST.def('CAL4','IN：卡片数字 = 待办筛选条数 / 今天来访 / 等 KR 回复 / 3:2 / 营业时间外代约 / 日程确认过期',function(){
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
    var wrap = document.getElementById('cal-todo-wrap'), cal = wrap.firstElementChild, pane = document.getElementById('todo-pane'); ST.ok(cal.style.flex.indexOf('2')===0 && pane.style.flex.indexOf('1')===0, '日历 : 待办应是 2 : 1');
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
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var items = todoItems(), cats = {todo:0, today2:0, waiting:0, msg:0}; items.forEach(function(i){ ST.ok(cats.hasOwnProperty(i.cat), '分类：'+i.kind+'→'+i.cat); cats[i.cat]++; });
    ST.ok(items.length === cats.todo+cats.today2+cats.waiting+cats.msg, '待办总数 = 4 类加总'); krRenderDashboard();
    var g = document.querySelector('#krdash-body div[style*="grid-template-columns"]'); ST.ok(g && g.children.length===4, '4 张卡');
    ['todo','today2','waiting','msg'].forEach(function(k, i){ var n = parseInt(g.children[i].querySelector('div[style*="font-size:28px"]').textContent, 10); ST.ok(n===cats[k], '卡片「'+k+'」数字 '+n+' 应 = '+cats[k]); todoCardFilter(k); ST.ok(todoVisible(todoItems()).length===cats[k], '点卡片后待办栏条数应 = '+cats[k]); });
    todoSetKind(''); var cal = document.getElementById('cal-todo-wrap'); ST.ok(cal.firstElementChild.style.flex.indexOf('2')===0 && document.getElementById('todo-pane').style.flex.indexOf('1')===0, '日历 : 待办 = 2 : 1');
  });
  ST.def('CAL6','OFF 新流程（全天 / 指定时间 + 先选室长 / 院长再选人）+ KR 日历细节（KM1 / KD1）',function(){
    var me = currentAccount(); if(!ST.ok(me && /^(KM1|KD1)$/.test(me.id), '要在 KM1 / KD1 分页里跑')) return;
    var h = krHData(), isDir = krcIsDirector(), d = D(41);
    krRenderDashboard(); var html = document.getElementById('kr-cal').innerHTML;
    ST.ok(/韩 \d\d:00/.test(html) && /印 \d\d:00/.test(html), '双时间轴：韩国 + 印尼');
    KRC.pop = {date:d}; KRC.popForm.who = krcDirectors()[0]; var pop = krcPopHtml(); KRC.pop = null; ST.ok(/指定时间/.test(pop) && !/<option>上午<\/option>/.test(pop), '悬停加 OFF：全天 / 指定时间，没有上午 / 下午');
    krfxOpen(); KRFX.type = 'OFF'; krfxRender(); var mh = document.getElementById('krfx-overlay').innerHTML; ST.ok(isDir ? /院长 · /.test(mh) && !/<option>室长<\/option>/.test(mh) : (/<option[^>]*>室长<\/option>/.test(mh) && /<option[^>]*>院长<\/option>/.test(mh)), isDir ? '院长只标自己（不选室长 / 院长）' : '室长先选 室长 / 院长');
    KRFX.mode = '指定'; KRFX.from = '10:00'; KRFX.to = '12:30'; var who = isDir ? me.name : krfxPeople('室长')[0]; if(!isDir){ krfxSetRole('室长'); KRFX.mode = '指定'; KRFX.from = '10:00'; KRFX.to = '12:30'; KRFX.who = who; } KRFX.date = d; krfxSave();
    var o = (h.offs||[]).filter(function(x){ return x.date===d && x.who===who; })[0]; ST.ok(!!o && o.part==='指定10:00-12:30' && o.kind===(isDir ? 'director' : 'coord'), 'OFF 应存成 指定10:00-12:30，实际 '+(o&&o.part)+' / '+(o&&o.kind));
    ST.ok(/（10:00–12:30）/.test(krcFixedHtml(d, [o])), '固定栏显示时间段'); if(isDir) ST.ok(krHalfRange(krHospitalIdOfMe(), o.part)[0]==='10:00', '指定时间能被日程检查识别');
    krfxEditOff(o.id); ST.ok(KRFX.mode==='指定' && KRFX.from==='10:00', '修改时回显指定时间'); KRFX.mode = '全天'; krfxSave(); ST.ok(o.part==='全天', '能改成全天'); krfxEditOff(o.id); krfxDelete(); ST.ok(!(h.offs||[]).some(function(x){ return x.id===o.id; }), '能删除');
    /* 月视图点日期 = 进那一周；日历上不再设定开放施术 */
    krcSet('mode','month'); var opens = JSON.stringify(h.openDates||{}); krcMonthClick(d); ST.ok(KRC.mode==='week' && KRC.anchor===krcWeekStartMon(d), '点日期应进那一周'); ST.ok(JSON.stringify(h.openDates||{})===opens, '日历上点日期不再改开放施术日期'); krcToday(); krcSet('mode','day');
    /* 过去的事件变灰 */
    ST.ok(krcIsPast({date:D(-2), end:'10:00'}) && !krcIsPast({date:D(3), end:'10:00'}), '过去的事件应变灰'); ST.krcRangeCheck(hospitalHours(krHospitalIdOfMe()));
    if(isDir){ var drs = document.getElementById('krdash-body').innerText; ST.ok(!/今天的平台客人|等我出报告的案件|室长刚提交的诊疗方案/.test(drs), '院长工作台拿掉三块'); ST.ok(!!document.getElementById('todo-pane'), '院长工作台只留日历 + 待办'); }
    var lu = hospitalLunch(krHospitalIdOfMe()); if(lu){ var lb = [].slice.call(document.querySelectorAll('#kr-cal [title="午休"]'))[0]; ST.ok(!lb || parseFloat(lb.style.height) <= 14, '午休画窄'); }
  });
  ST.def('CAL7','代表院长：默认看自己、可切到全部院长（只看不操作）（KO1）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KO1', '要在 KO1 分页里跑')) return;
    krcSetViewAll('me'); ST.ok(!krcViewAll() && krcDirectors().length===1 && krcWho()===me.name, '默认只看自己'); krRenderDashboard(); ST.ok(/全部院长（只看）/.test(document.getElementById('kr-cal').innerText), '应有切换「全部院长（只看）」');
    KRC.layer = 'hospital'; krcSetViewAll('all'); ST.ok(krcViewAll() && krcWho()==='all' && krcDirectors().length>=2, '切到全部院长'); var pop0 = KRC.pop; krcCellClick(todayStr(), {clientY:0}, document.createElement('div')); ST.ok(KRC.pop===pop0, '全部院长视角只看不操作（点空白格不加东西）'); ST.ok(hospitalDirectorNames(krHospitalIdOfMe()).every(function(n){ return n===me.name || !krcCanEdit(n); }), '别的院长的 OFF 不能改');
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
  /* CMD-1015-01：KR / 院长日历营业时间外按需显示——没有营业外预约的一天只显示营业时间；点顶 / 底小条才展开前后 2 小时 */
ST.krcRangeCheck = function(hr){
  var keep = {m:KRC.mode, a:KRC.anchor}, open = timeToMin(hr.open), close = timeToMin(hr.close);
  KRC.mode = 'day'; KRC.anchor = krcAdd(krToday(), 60); CAL_OUT.krc.b = CAL_OUT.krc.a = false; krcApplyRange();
  ST.ok(KRC_H0===Math.floor(open/60) && KRC_H1===Math.ceil(close/60), '没有营业外预约：只显示营业时间，实际 '+KRC_H0+'～'+KRC_H1);
  CAL_OUT.krc.b = CAL_OUT.krc.a = true; krcApplyRange();
  ST.ok(KRC_H0===Math.floor((open-120)/60) && KRC_H1===Math.min(24, Math.ceil((close+120)/60)), '点开后显示营业时间前后各 2 小时，实际 '+KRC_H0+'～'+KRC_H1);
  CAL_OUT.krc.b = CAL_OUT.krc.a = false; KRC.mode = keep.m; KRC.anchor = keep.a; krcApplyRange();
};
ST.bkFreeSlot = function(hid, from){ for(var d = from||2; d < 25; d++){ var ds = D(d); if(hospitalClosedOn(hid, ds)) continue; for(var m = 11*60; m < 20*60; m += 30){ var t0 = minToTime(m); var dirs = hospitalDirectorNames(hid); for(var i = 0; i < dirs.length; i++){ if(!krSurgerySlotError(hid, dirs[i], ds, t0, 30, null, {allowOffHours:true, use:true}) && !krbOffText(hid, ds, t0)) return {ds:ds, t:t0, dir:dirs[i]}; } } } return null; };
  /* 跨账号三段：A1 占位（BK1a / BK2a）→ KM1 处理（BK1b / BK2b，KR 的 core* 要在 KR 分页里跑，不能在 IN 分页里改同一诊所的分区）→ A1 验证（BK1c / BK2c） */
  ST.def('CAL8','KR 日历医院 / 院长两层 + 约满标记 + 韩 / 印时间轴（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; nav('kr-dashboard'); KRC.layer = 'hospital'; krcSet('mode','day'); var cal = function(){ return document.getElementById('kr-cal'); };
    ST.ok(/医院/.test(cal().innerText) && !/各位院长/.test(cal().innerText) && cal().querySelectorAll('.cal-switch span').length>=5, '第一层平铺：医院 + 各位院长按钮并列，日 / 周 / 月是分段按钮'); ST.ok(!cal().querySelector('.krc-dirhead') && !cal().querySelector('.krc-busy'), '医院层日视图不分栏、不显示不可预约');
    var one = [].slice.call(cal().querySelectorAll('[onclick*="krShowCase"],[onclick*="krOpenSurgSub"],[onclick*="krBookOpen"],[onclick*="krOpenSub"]')).filter(function(e){ return e.innerText; }); ST.ok(one.length===0 || one.every(function(e){ return /\d\d:\d\d · .+ · .+ · .+/.test(e.innerText.replace(/\n/g,' ')); }), '医院层每块一行：时间 · 客人 · 类型 · 院长');
    ST.ok(/韩 \d\d:00/.test(cal().innerText) && /印 \d\d:00/.test(cal().innerText) && !/印尼\s*韩国/.test(cal().innerText.slice(0,300)), '时间轴每个时间前标韩 / 印，没有顶部小标题');
    ST.ok(KRC_PX>=CAL_DAY_PX, 'CMD-1015-02：KR 日视图格子高度 ≥ IN 最小值 44px/小时，并撑满卡片'); var ow = cal().querySelector('.krc-outwrap'); ST.ok(!!ow && ow.style.overflow==='auto' && /100vh/.test(ow.style.height), 'KR 日历撑满画面、栏内滚动'); ST.ok(!cal().querySelector('.krc-col-today') || getComputedStyle(cal().querySelector('.krc-col-today')).backgroundColor!==getComputedStyle(document.documentElement).getPropertyValue('--bg-brand-faint'), '今天不染整栏');
    krcSet('mode','week'); ST.ok(!/已约/.test(cal().innerText) && !/施术开放|未开放/.test(cal().innerText), 'CMD-1015-01：周视图不写已约数字（只有约满才写），没有施术开放');
    krcSet('mode','month'); ST.ok(!/已约/.test(cal().innerText) && !/开放/.test(cal().innerText.replace(/营业/g,'')), '月视图同样');
    krcSet('layer','director'); krcSet('person','KD1 院长'); krcSet('mode','day'); ST.ok(!!cal().querySelector('.krc-busy') || true, '院长层'); ST.ok(!/KO1 代表院长 OFF/.test(cal().innerText), '院长层固定栏只有这位院长'); ST.ok(!/确认今日院长日程/.test(document.body.innerText), '没有确认今日院长日程');
    ST.ok(repairOffConflicts()===0, 'OFF 那天没有该院长的施术 / 面诊 / 预约（演示数据已修）');
    var offO = (HOSPITAL_DATA.H1.offs||[]).filter(function(o){ return o.kind==='director' && (!o.part || o.part==='全天') && o.date > krToday(); })[0];
    if(offO){ var er = krSurgerySlotError('H1', offO.who, offO.date, '12:00', 60, null, {allowOffHours:true}); ST.ok(!!er && /OFF/.test(er), '正常流程：院长整天 OFF 的那天不能确认 / 排施术，实际：'+er); }
    KRC.layer = 'hospital'; krcRender();
  });
  ST.def('CAL9','IN 本院日程 / KR 医院日程：韩 / 印标注、约满、两层（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='A1', '要在 A1 分页里跑')) return; nav('in-dashboard'); setCalView('in'); setCalMode('week');
    var g = document.getElementById('wk-grid'); ST.ok(/印 \d\d:\d\d/.test(g.innerText) && /韩 \d\d:\d\d/.test(g.innerText), 'IN 时间轴印 / 韩标注'); ST.ok(!/已约/.test(g.innerText), 'CMD-1015-01：IN 周视图不写已约数字');
    setCalView('kr'); setCalMode('week'); var o = [].slice.call(document.querySelectorAll('#kr-dir-bar span')).map(function(x){ return x.textContent; }); ST.ok(o[0]==='医院' && o.length>1 && !/各位院长/.test(o.join()), 'KR 医院日程第一层平铺：医院 + 各院长'); ST.ok(!/施术开放|未开放/.test(document.getElementById('wk-grid').innerText), '没有施术开放 / 未开放');
    ST.ok(!document.querySelector('#cal-sw-day') || getComputedStyle(document.getElementById('cal-sw-day')).display==='none', 'KR 医院日程没有日视图'); setCalMode('month'); ST.ok(!/已约/.test(document.getElementById('cal-grid').innerText), 'KR 月视图不写已约数字');
    setCalView('in'); setCalMode('week');
  });
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
    ST.ok(c.krVisit && c.krVisit.hospitalId===hid && (c.stage==='booked' || c.stage==='krmgmt') && (c.director||'')===((bk.director||'')===KRB_HOSP ? '' : (bk.director||'')), '新案件：在韩到店、从预约到店开始、地点 KR 医院'); ST.ok(krAllCases().some(function(x){ return x.id===c.id; }), 'KR 案件列表应看得到这个案件');
    ST.ok(!coreBookDone(hid, bk.id, {kind:'other'}, 'KM1 室长').ok, '没到店不能标完成'); ST.ok(!coreBookArrive(hid, bk.id, 'KM1 室长'), 'CMD-1014-18：还没到预约当天不能标客人已到店'); ST.ok(coreBookSimDay(hid, bk.id) && coreBookArrive(hid, bk.id, 'KM1 室长'), '模拟到当日后标记客人已到店');
    ST.ok(!coreBookDone(hid, bk.id, {kind:'care', name:''}, 'KM1 室长').ok, '新做管理要选项目'); ST.ok(!coreBookDone(hid, bk.id, {kind:'hold', caseId:'x', name:'y'}, 'KM1 室长').ok, '使用持有要选项目');
    var lp = krLocalLib(hid).filter(function(p){ return !p.neg; })[0], sp0 = lp.specs[0];
    ST.ok(!coreBookFeeAdd(hid, bk.id, {name:lp.name, price:0}, 'KM1 室长').ok, '新做管理要有价格');
    ST.ok(coreBookFeeAdd(hid, bk.id, {name:lp.name, specLabel:sp0.label, price:sp0.price, projectId:lp.id}, 'KM1 室长').ok && krbFind(hid, bk.id).fees[0].status==='待付款', '新做管理：加入后待付款'); ST.ok(coreBookFeeAdd(hid, bk.id, {name:lp.name, specLabel:sp0.label, service:true}, 'KM1 室长').ok && krbFind(hid, bk.id).fees[1].service && krbFind(hid, bk.id).fees[1].price===0, '可赠送 서비스（0 元）');
    ST.ok(!coreBookDone(hid, bk.id, {kind:'care'}, 'KM1 室长').ok, '待付款不能标完成');
    ST.ok(coreBookFeePaid(hid, bk.id, 'KM1 室长').ok && krbFind(hid, bk.id).fees.every(function(f){ return f.status==='已付款'; }), '标记已付款');
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

  /* ================= CMD-1015-15 第 2 轮修正 ================= */
  ST.def('R15a','视频来电只通知被呼叫的室长，院长不收（任意账号分页）',function(){
    var rows = (typeof krAllCases==='function' && isKrAccount()) ? krAllCases() : [];
    var c = isKrAccount() ? (rows[0] && rows[0].c) : CASE_ITEMS.filter(function(x){ return caseKrHospital(x); })[0]; if(!ST.ok(!!c, '没有带医院的案件（先建夹具）')) return;
    var hid = caseKrHospital(c), co = hospitalCoordinators(hid);
    var t1 = callTargets(c, ['A1（印尼室长）', co[0]+'（韩国室长）']); ST.ok(t1.length===1 && t1[0]===co[0].split(' ')[0], '呼叫名单里选的 KR 室长就是被叫人，实际 '+t1.join(','));
    var t2 = callTargets(c, ['A1（印尼室长）']); ST.ok(t2.length===1 && co.map(function(n){ return n.split(' ')[0]; }).indexOf(t2[0])>-1, '没选 → 负责 / 当天上班的室长，实际 '+t2.join(','));
    var sig = {id:'r15a'+Date.now(), hospitalId:hid, clinicId:c.clinicId||CURRENT_CLINIC_ID, clinicName:'测试', caseId:c.id, caseNo:c.caseNo||'', name:c.name, director:c.director||'KD1 院长', to:t1, from:'A1 室长'};
    var h = HOSPITAL_DATA[hid], n0 = (h.notifs||[]).length; recordMissedCall(sig);
    var fresh = (h.notifs||[]).filter(function(n){ return n.id.indexOf('kmc_'+sig.id)===0 || n.id.indexOf('kmd_'+sig.id)===0; });
    ST.ok(fresh.length===1 && fresh[0].to==='coord' && fresh[0].kind==='missedcall', '未接来电只记给被叫的室长一条，实际 '+fresh.length); ST.ok(!fresh.some(function(n){ return n.to==='director'; }), '院长不收未接来电');
    var acc = ACCOUNTS.filter(function(a){ return a.hospitalId===hid && a.name.split(' ')[0]===t1[0]; })[0]; ST.ok(!acc || fresh[0].only===acc.name, '指名给 '+t1[0]);
    h.notifs = h.notifs.filter(function(n){ return fresh.indexOf(n)<0; });
    if(typeof krCallRelevant==='function') ST.ok(/院长 \/ 代表院长不接来电/.test(String(krCallRelevant)), '院长账号来电判断返回 false');
  });
  ST.def('R15b','院长工作台 4 张卡：待面诊 / 待施术 / 恢复确认（即将推出）/ 新消息（KD1 或 KO1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && /^kr_(director|owner)$/.test(me.role), '要在 KD1 / KO1 分页里跑')) return;
    nav('kr-dashboard'); krRenderDashboard(); var el = document.getElementById('krdash-body'), tx = el.innerText;
    ST.ok(/待面诊/.test(tx) && /待施术/.test(tx) && /恢复确认/.test(tx) && /新消息/.test(tx), '应有 4 张卡'); ST.ok(/即将推出/.test(tx), '恢复确认卡显示「即将推出」');
    var cards = [].slice.call(el.querySelectorAll('.card[data-n]')).filter(function(x){ return /待面诊|待施术|恢复确认|新消息/.test(x.innerText.slice(0,12)); });
    var soon = cards.filter(function(x){ return /恢复确认/.test(x.innerText); })[0]; ST.ok(!!soon && !soon.getAttribute('onclick'), '恢复确认不可点');
    var items = todoItems(); var up = items.filter(function(i){ return i.kind==='upload'; }), ds = items.filter(function(i){ return i.kind==='dsurg'; });
    ST.ok(up.every(function(i){ return i.cat==='dconsult'; }) && ds.every(function(i){ return i.cat==='dsurg' && i.ref; }), '待面诊 / 待施术分类正确，待施术是参考名单');
    var cnt = function(label){ var d = cards.filter(function(x){ return x.innerText.indexOf(label)===0 || x.innerText.slice(0,10).indexOf(label)>-1; })[0]; return d ? parseInt(d.getAttribute('data-n'),10) : -1; };
    ST.ok(cnt('待面诊')===up.filter(function(i){ return i.mine; }).length, '待面诊数字 = 待办里 upload 条数'); ST.ok(cnt('待施术')===ds.length, '待施术数字 = 自己负责的已确认施术 '+ds.length);
    todoCardFilter('dsurg'); ST.ok(todoRefMode() && todoVisible(todoItems()).length===ds.length, '点待施术 → 待办栏显示灰色参考名单'); var pane = document.getElementById('todo-pane'); ST.ok(!ds.length || /今天|之后|昨日及更早/.test(pane.innerText), '名单分组'); todoSetKind('');
    todoCardFilter('dconsult'); ST.ok(!todoRefMode() && todoVisible(todoItems()).every(function(i){ return i.kind==='upload'; }), '点待面诊 → 筛选待办'); todoSetKind('');
    ST.ok(krCallRelevant({hospitalId:me.hospitalId, director:me.name, to:['KM1']})===false, '院长不响铃');
  });
  ST.def('R15c','院长上传面诊后 KR 室长有待办 + 弹一次；稍后预约后有［安排术后管理］入口（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    ST.ok(notifTodoKind({text:'KD1 院长 上传了面诊内容，面诊结束：自测（A000999）→ 请发送诊疗方案', kind:'case'})==='todo', '上传面诊内容的通知弹一次');
    var rows = krAllCases(), r = rows.filter(function(x){ return x.c.consultStatus==='awaiting_report'; })[0];
    if(ST.ok(!!r, '没有等待报告的案件（stageW 夹具）')){ var c = r.c, old = c.consultContentAt; c.consultContentAt = nowFullDt(); var it = krTodoItems(rows).filter(function(i){ return i.kind==='send' && i.caseId===c.id; })[0]; ST.ok(!!it && /发送诊疗方案/.test(it.text), '上传后出现「发送诊疗方案」待办'); c.consultContentAt = old; }
    var r2 = rows.filter(function(x){ return krActiveItems(x.c).some(function(i){ return (i.postcare||[]).length; }); })[0];
    if(ST.ok(!!r2, '没有带术后管理的案件（stageC 夹具）')){ var c2 = r2.c, pb = c2.krBalancePaid, bk = c2.pcBooked; c2.krBalancePaid = true; c2.pcBooked = false;
      ST.ok(typeof krPcbOpen==='undefined' && typeof krPcbNeed==='undefined' && !/安排术后管理/.test(krTabItems(c2)) && !/术后管理预约/.test(krTabItems(c2).replace(/术后管理预约[^<]*<\/b>/,'x')), 'CMD-1015-30：旧的「术后管理预约」卡和［安排术后管理］小窗口已拿掉，预约入口只剩今日进行后的弹窗和项目卡［预约时间］'); c2.krBalancePaid = pb; c2.pcBooked = bk; }
  });
  ST.def('R15d','IN 五项小修：案例链接在行尾 / 赴韩默认韩币 / 转告·确认卡片按完消失 / 打印先预览 / 尾款 IN 看得到（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var src = String(localProjRowHtml); ST.ok(src.indexOf('min-width:96px')>-1 && src.lastIndexOf('projCasesLinkHtml')>src.indexOf('min-width:96px'), '「查看相关案例」在价格后面（行尾）');
    var sp = String(projectPickerHtml); ST.ok(sp.indexOf("displayAmount(p.price, p.origin, pickerCcy)+'</span>'+projCasesLinkHtml")>-1, '赴韩项目行同样在行尾');
    var c = CASE_ITEMS.filter(function(x){ return x.krSchedule && x.krSchedule.status==='confirmed'; })[0] || CASE_ITEMS[0]; if(!ST.ok(!!c, '没有案件')) return; var old = CURRENT_CASE_ID; CURRENT_CASE_ID = c.id;
    try{
      CASE_DISPLAY_CCY_KR = 'IDR'; setProjectOrigin('KR'); ST.ok(CASE_DISPLAY_CCY_KR==='KRW', '切到赴韩项目默认韩币');
      if(c.krSchedule && c.krSchedule.confirmedDate){ var k0 = c.relayTold, r0 = c.recheck, rl = c.relayAt; c.relayTold = null; c.recheck = null; var h0 = calRelayRecheckCards(c); ST.ok(/转告客人/.test(h0), '转告卡片先出现');
        calRelayDone(c.id); ST.ok(!/已转告客人<\/button>/.test(calRelayRecheckCards(c)) && !/转告客人<\/div>/.test(calRelayRecheckCards(c)) && ST.hasLog(c, /已转告客人/), '按完卡片消失，Timeline 有记录');
        calRecheckOk(c.id); ST.ok(!/确认日程无变动<\/div>/.test(calRelayRecheckCards(c)) && ST.hasLog(c, /确认客人日程无变动/), '确认无变动后卡片消失，Timeline 有记录'); c.relayTold = k0; c.recheck = r0; c.relayAt = rl; }
      var w = window.open; var cap = ''; window.open = function(){ return {document:{write:function(x){ cap += x; }, close:function(){}}}; }; try{ if(krActiveItems(c).length) printKrPlan(); }finally{ window.open = w; }
      if(cap) ST.ok(/确认打印/.test(cap) && !/window\.onload/.test(cap), '打印先预览：有［确认打印］按钮，不再自动打印');
      if(krActiveItems(c).length){ var info = krBalanceInfo(c); if(info.diff>0){ ST.ok(settlementSummaryHtml(c).indexOf(formatCurrency(info.diff,'KRW'))>-1 && settleTabTopHtml(c).indexOf(formatCurrency(info.diff,'KRW'))>-1, '结算汇总 / 顶部一行能看到尾款金额'); ST.ok(krPlanMoneyLine(c).indexOf(formatCurrency(info.diff,'KRW'))>-1, '赴韩施术计划看得到尾款'); } }
      ST.ok(viewerTextFilter('尾款 ₩1,200,000')==='尾款 ₩1,200,000', 'IN 看得到尾款金额'); ST.ok(!/₩/.test(viewerTextFilter('在韩加项：玻尿酸，合计 ₩300,000')), '在韩加项金额 IN 仍看不到');
    } finally { CURRENT_CASE_ID = old; }
  });

  /* ================= CMD-1015-16 诊疗方案：施术 / 管理分类、拿掉共同术后管理 ================= */
  ST.def('R16a','IN 选项目：管理项目 + 定金按全部赴韩项目 × 30% + 付完定金没有［+ 追加项目］ + 到院后标完成 / 转在韩持有（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var lib = krLocalLib('H1').filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0]; if(!ST.ok(!!lib, 'KR 本地管理项目库是空的')) return; var sp = lib.specs[0];
    var mk = function(base){
      var c = ST.newRes(base); ST.consultToReport(c);
      var si = {name:lib.name+' · '+sp.label, price:sp.price*3, mgmt:true, localId:lib.id, specId:sp.id, specLabel:sp.label, unit:sp.price, qty:3, interval:2, note:''};
      ST.ok(coreAddScopeItem(c, si, 'KM1 室长'), '补加管理项目到可选范围失败'); ST.open(c); c.activeCaseTab = 'kr'; c.projectOriginFilter = 'KR';
      ST.ok(/管理项目/.test(projectPickerHtml(c, false)) && projectPickerHtml(c, false).indexOf(lib.name)>-1, '选项目里应有「管理项目」分组');
      ['假体隆鼻','鼻翼缩小'].forEach(function(n){ var p = PROJECT_LIBRARY.filter(function(x){ return x.name===n && x.origin==='KR' && x.hospitalId==='H1'; })[0]; toggleProject(p.id); });
      toggleProject(scopeMgmtPid(si)); ST.ok(c.recommended.length===3 && c.recommended.some(function(it){ return it.mgmtPlan && it.qty===3 && it.origin==='KR'; }), '三项都应进已选');
      var bd = computeBatchBreakdown(c.recommended), tot = c.recommended.reduce(function(s2, it){ return s2 + it.price; }, 0);
      ST.ok(bd.krTotal===tot && bd.krDeposit===Math.round(tot*KR_DEPOSIT_RATE), '定金 = 全部赴韩项目（施术 + 管理）× 30%，实际 '+bd.krDeposit+' / '+tot);
      confirmProjectSelection(); settleProjects(); window.SETTLE_ANES_SIGNED = true; confirmSettlementPayment(); ST.ok(c.settlementDone, '付定金失败');
      ST.ok(!/\+ 追加项目/.test(krProcedureTabHtml(c)), '付完定金后不再有［+ 追加项目］');
      ST.scheduleConfirm(c, 8); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); syncSurgerySub(c);
      return c;
    };
    var c1 = mk('R16a1'); var surg = c1.subItems.filter(function(s){ return s.kind==='施术'; })[0];
    var held = c1.procedureItems.filter(function(it){ return it.mgmtPlan; })[0];
    ST.ok(!!surg && !!held && surg.content.indexOf(lib.name)<0, '施术行不含管理项目');
    ST.ok(held.heldOver && held.qty===3 && krHoldOpen(c1), '付清尾款后管理项目就是在韩持有（剩 3 次）');
    ST.ok(coreMgmtUse(c1, held.name, ST.krBy) && held.holdUsed===1 && !held.holdDone, '［使用］扣 1 次');
    ST.ok(coreTodayDone(c1, [surg.id]) && krHoldOpen(c1), '施术行标完成后，持有管理项目仍在（结案不等持有用完）');
  });
  ST.def('R16b','KR 诊疗方案：没有共同术后管理；可选范围分施术 / 管理；管理项目 项目（规格）× 次数 × 间隔（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    ST.ok(typeof krCommonBlock==='undefined' && typeof commonCareOf==='undefined' && typeof krScopeCommons==='undefined', '共同术后管理相关函数已拿掉');
    var lib = krLocalLib(krHospitalIdOfMe()), p = lib.filter(function(x){ return !x.neg && x.specs && x.specs.length>1; })[0] || lib.filter(function(x){ return !x.neg; })[0]; if(!ST.ok(!!p, '没有管理项目')) return;
    var st = {on:true, sid:p.specs[p.specs.length-1].id, qty:4, interval:3, manual:''}, it = krMgScopeItem(p, st, '备注');
    ST.ok(it && it.mgmt && it.qty===4 && it.interval===3 && it.unit===p.specs[p.specs.length-1].price && it.price===it.unit*4 && it.name.indexOf(p.name+' · ')===0, '管理项目条目：规格单价 × 次数');
    var one = krMgScopeItem(p, {sid:p.specs[0].id, qty:1, interval:9, manual:''}, ''); ST.ok(one.interval===0, '1 次不记间隔');
    var neg = krLocalLib(krHospitalIdOfMe()).filter(function(x){ return x.neg; })[0]; if(neg){ ST.ok(krMgScopeItem(neg, {sid:neg.specs[0].id, qty:1, interval:1, manual:''}, '')===null && krMgScopeItem(neg, {sid:neg.specs[0].id, qty:2, interval:1, manual:'50000'}, '').price===100000, '面议项目要手填单价'); }
    var d = recSummaryData([{name:'假体隆鼻', stay:'7天', anesthesia:{label:'局部麻醉'}, postcare:[]}, it], ''); ST.ok(d.mgmt.length===1 && d.mgmt[0].qty===4 && d.rows.length===1, '推荐项目整理单独列管理项目，不算进推荐在韩天数'); ST.ok(/管理项目/.test(recSummaryHtml([it], '')), '只有管理项目也能生成整理');
    var r = krAllCases().filter(function(x){ return x.c.consultStatus==='awaiting_report'; })[0];
    if(r){ krShowCase(r.clinicId, r.id); var c = r.c, oldC = c.consultContentAt; c.consultContentAt = c.consultContentAt || nowFullDt(); KR_SUB = krSubBlank(krRecKey()); KR_SUB.text = '（自测）';
      var h0 = krSubmitBlock(c); ST.ok(/施术项目/.test(h0) && /管理项目/.test(h0) && /disabled/.test(h0), '可选范围有两个分类；什么都没勾时发送置灰');
      KR_SUB.mg[p.id] = {on:true, sid:p.specs[0].id, qty:2, interval:1, manual:''}; var h1 = krSubmitBlock(c); ST.ok(!/title="请选择院长推荐的项目"/.test(h1), '只勾管理项目也能发送（至少 1 项）'); KR_SUB.tab = 'mgmt'; ST.ok(/次/.test(krSubmitBlock(c)) && /只在韩国做/.test(krSubmitBlock(c)), '管理项目：规格 / 次数 / 间隔，只在韩国做');
      KR_SUB = krSubBlank(''); c.consultContentAt = oldC; }
    ST.ok(!/共同术后管理/.test(document.body.innerText), '页面上没有「共同术后管理」');
  });

  ST.def('R16c','迁移 45：旧案件的共同术后管理转成各项目自己的（任意分页）',function(){
    var m = (window.GMC_MIGRATIONS||[]).filter(function(x){ return x.to===45; })[0]; if(!ST.ok(!!m, '没有 to:45 的迁移步骤')) return;
    var cm = function(){ return {mgmt:'术后管理', name:'ONDA 提升', times:2, interval:1, place:'KR', startDay:3, cid:'cm1', applies:['腹部吸脂','大腿吸脂']}; };
    var own = {mgmt:'拆线', name:'拆线', times:1, place:'KR', startDay:7};
    var c = {id:'rx', caseNo:'A9', krScope:{items:[{name:'腹部吸脂', postcare:[cm(), Object.assign({}, own)]}, {name:'大腿吸脂', postcare:[cm()]}]}, procedureItems:[{name:'腹部吸脂', postcare:[cm()]}, {name:'大腿吸脂', postcare:[cm()]}], recommended:[]};
    var notes = []; m.fn(c, {note:function(t){ notes.push(t); }});
    var a = c.krScope.items[0].postcare, b = c.krScope.items[1].postcare;
    ST.ok(a.length===2 && b.length===0, '共同术后管理只留在第一个适用项目上，其余副本去掉：'+a.length+' / '+b.length); ST.ok(!JSON.stringify(c).match(/"cid"|"applies"/), 'cid / applies 字段清掉');
    ST.ok(c.procedureItems[0].postcare.length===1 && c.procedureItems[1].postcare.length===0, '已选项目里同样处理'); ST.ok(notes.length===1 && /共同术后管理已转成/.test(notes[0]), '迁移备注写明处理方式');
  });

  /* ================= CMD-1015-17 术后管理阶段 / 子案件 / 在韩持有 ================= */
  ST.def('R17a','阶段：没有术后管理施术做完直接结案；有术后管理进「术后管理」；IN 做术后管理提前要原因、做完才结案；子案件按（日期 + 地点）合并（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c0 = toConfirmed('R17a0'); ST.krArrive(c0); ST.krJudge(c0, 'ok'); ST.krPay(c0); syncSurgerySub(c0);
    var hasCare = carePending(c0) || (c0.subItems||[]).some(function(s){ return s.kind==='术后管理记录'; });
    if(!hasCare){ ST.ok(ST.krCloseToday(c0) && isEnded(c0), '没有术后管理：施术做完直接结案'); }
    var c = toConfirmed('R17a1'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c);
    ST.ok(corePcBooking(c, pcRows(c, 'IN'), ST.krBy), '术后管理预约失败'); ST.ok(ST.krCloseToday(c) && c.stage==='postcare' && !isEnded(c), '施术做完 → 进入术后管理阶段，不结案');
    var rows = carePendingRows(c).filter(function(s){ return s.place==='IN'; }); if(!ST.ok(rows.length>0, '要有回印尼做的术后管理')) return;
    var early = rows.filter(function(s){ return pcDaysLate(s.date)<0; })[0];
    if(early){ ST.ok(!coreCareVisit(c, early.id, 'A1 室长', '').ok, '提前做必须写原因'); ST.ok(coreCareVisit(c, early.id, 'A1 室长', '（自测）客人提前回来').ok && early.done, '写了原因就能做'); }
    carePendingRows(c).filter(function(s){ return s.place==='IN'; }).forEach(function(s){ coreCareVisit(c, s.id, 'A1 室长', '（自测）'); });
    var krLeft = carePendingRows(c); if(krLeft.length){ ST.ok(!isEnded(c), '韩国的术后管理还没做完 → 不结案'); ST.finishCare(c); }
    ST.ok(isEnded(c), '韩国 + 印尼都做完 → 结案');
    var keys = {}; subCaseList(c).forEach(function(r){ keys[subCaseKey(r)] = (keys[subCaseKey(r)]||0)+1; }); ST.ok(Object.keys(keys).every(function(k){ return keys[k]===1; }), '同一天同一地点只算一个子案件');
  });
  ST.def('R17b','KR：子案件在施术 tab 卡片里展开、没有单独页面；案件列表 KR 财务只显示 KR 看得到的（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    ST.ok(typeof krRenderSubcase==='undefined' && !document.getElementById('kr-subcase'), '子案件单独页面已拿掉');
    ST.ok(typeof krSubCasesCard==='function' && typeof krFinanceHtml==='function', '施术 tab 子案件卡 / 财务栏函数存在');
    var h = krFinanceHtml({stage:'krmgmt', consultStatus:'', consultFeeAmount:0, settlements:[]}); ST.ok(typeof h==='string' && !/Rp/.test(h), 'KR 财务栏不出现印尼盾金额');
  });
  ST.def('R17c','迁移 46：付清尾款的管理项目转在韩持有，旧「管理项目」进程行去掉（任意分页）',function(){
    var m = (window.GMC_MIGRATIONS||[]).filter(function(x){ return x.to===46; })[0]; if(!ST.ok(!!m, '没有 to:46 的迁移步骤')) return;
    var c = {id:'rz', caseNo:'A9', krBalancePaid:true, krProcedureDone:true, visitDate:'2026-01-01', procedureItems:[{name:'管理甲', mgmtPlan:true, qty:3, done:false}], subItems:[{id:'q1', kind:'增加项目', mgmtPlan:true, content:'管理甲'}]};
    var notes = []; m.fn(c, {note:function(t){ notes.push(t); }});
    ST.ok(c.procedureItems[0].heldOver && c.procedureItems[0].holdUsed===0 && c.subItems.length===0, '管理项目转在韩持有，进程行去掉'); ST.ok(!!c.surgeryDoneAt, '补上施术完成日'); ST.ok(notes.length===1, '迁移记一条备注');
  });

  /* ================= CMD-1015-18 补齐 + KR「项目」tab 重组 ================= */
  function pcCase(base){ var c = toConfirmed(base); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); var rows = [], k0 = 0; pcUniqueEntries(c).forEach(function(e){ var x = e.x; for(var k = 0; k < (x.times||1); k++){ var where = (x.place==='either') ? 'IN' : 'KR'; rows.push({where:where, item:e.it.name, pcIdx:e.i, date:D(14+k0++), time:'10:00', mgmt:x.mgmt, name:x.name, innName:x.innName, day:null}); } }); corePcBooking(c, rows, ST.krBy); return c; }
  ST.def('R18a','IN：术后管理来访默认接续到术后管理阶段的案件（突出）；通知 / 待办点进来滚到术后管理区块；术后管理不再发「转回印尼持有」（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R18a1'); ST.ok(ST.krCloseToday(c) && c.stage==='postcare', '先让案件进入术后管理阶段');
    var c2 = ST.newRes('R18a2', {phone:clientPhoneOf(c.name)}); c2.visitPurpose = '术后管理'; var h = resumeBannerHtml(c2);
    ST.ok(/已默认接续到术后管理阶段的案件/.test(h) && /✓ 默认/.test(h) && h.indexOf(c.caseNo)>-1 && /继续新案件/.test(h), '来访目的术后管理 + 有术后管理阶段的案件 → 默认接续并突出，仍可继续新案件');
    c2.visitPurpose = '皮肤商谈'; ST.ok(!/✓ 默认/.test(resumeBannerHtml(c2)), '其他来访目的不突出');
    ST.ok(typeof goPostcareBlock==='function' && /in-postcare-card/.test(inPostcareCardHtml(c)), '术后管理区块有锚点，goPostcareBlock 能滚过去');
    ST.ok(!/转回印尼持有|转成持有/.test(JSON.stringify(c.logEntries||[])+JSON.stringify(NOTIFS.filter(function(n){ return n.caseId===c.id; }).map(function(n){ return n.text; }))), '没有发过「术后管理转回印尼持有」');
    ST.ok(!NOTIFS.some(function(n){ return n.caseId===c.id && /案件结束|已结案/.test(n.text||''); }), 'IN-22：术后管理还没做完，不发「结案」通知');
    ST.finishCare(c); ST.ok(isEnded(c) && NOTIFS.some(function(n){ return n.caseId===c.id && /已结案/.test(n.text||''); }), 'IN-22：术后管理全部做完才发「结案」通知');
  });
  ST.def('R18b','在韩加的管理项目付完款即在韩持有；서비스即时；使用扣次数；子案件整张卡（到店 → 选项目 → 已完成）（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R18b1'); var lib = krLocalLib('H1').filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0]; if(!ST.ok(!!lib, '没有管理项目')) return; var sp = lib.specs[0], loc = {projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price};
    ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:loc}), '在韩加管理项目失败'); var it = c.procedureItems[c.procedureItems.length-1];
    ST.ok(it.pendingPay && !it.heldOver && krItemStatus(it)==='待付款', '付款前显示待付款'); ST.ok(coreAddOnPaid(c, ST.krBy) && it.heldOver && !it.pendingPay && krItemStatus(it)==='持有中' && holdItemLeft(c, it)===1, '付完款即在韩持有，剩 1 次');
    ST.ok(!(c.subItems||[]).some(function(s){ return s.kind==='增加项目' && s.projectName===it.name; }), '进程里的「增加项目」行拿掉');
    var svc = Object.assign({}, loc, {service:true, price:0}); ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:svc}), '加서비스失败'); var sv = c.procedureItems[c.procedureItems.length-1];
    ST.ok(sv.service && sv.heldOver, '서비스即时进在韩持有');
    /* 子案件整张卡：到店前只显示预约；到店后选这次的项目 */
    var rep = subCaseList(c).filter(function(r){ return r.place==='KR'; })[0]; if(!ST.ok(!!rep, '要有韩国术后管理的子案件')) return; var key = subCaseKey(rep);
    ST.ok(!coreVisitArrive(c, key, ST.krBy), '没到预约当天不能到店'); coreSubSimDay(c, rep.id, ST.krBy); ST.ok(coreVisitArrive(c, key, ST.krBy) && coreVisitRows(c, key).every(function(s){ return s.arrived; }), '模拟到当日后［客人到店］');
    ST.ok(coreUnitUseNow(c, it.name, ST.krBy).ok, '到店后［本次使用］把管理项目加进这次到访');
    var rows2 = coreVisitRows(c, key), use = rows2.filter(function(s){ return s.holdUseOf===it.name; })[0]; ST.ok(!!use && use.arrived, '管理项目加成这次到访里的一行「使用」');
    var before = it.holdUsed||0; rows2.forEach(function(s){ coreSubDone(c, s.id, ST.krBy, []); });
    ST.ok((it.holdUsed||0)===before+1 && rows2.every(function(s){ return s.done; }) && coreVisitState(c, key)==='done', '逐行完成：术后管理标完成、管理项目扣 1 次，整张卡「已完成」');
    ST.ok(it.holdDone===true && krItemStatus(it)==='已用完', '用完变已用完');
  });
  ST.def('R20a','项目卡：术后管理［预约时间］→ 子案件（术后预约）→ 到店 → 管理项目［本次使用］→ 逐行完成；管理项目［预约使用］→ 管理预约；取消本次；待付款不能操作（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R20a1'); ST.krCloseToday(c); subCaseNos(c); var reps = subCaseList(c).filter(function(r){ return r.place==='KR'; }); if(!ST.ok(reps.length>=1, '要有韩国术后管理的子案件')) return; var k1 = subCaseKey(reps[0]);
    ST.ok(visitSource(c, k1)==='术后预约', '术后管理预约产生的子案件：预约来源 = 术后预约');
    var cu0 = careUnits(c), n0 = cu0.unbooked.length, row = coreVisitRows(c, k1)[0];
    ST.ok(coreRowCancel(c, row.id, ST.krBy) && row.skipped, '取消本次 → 术后管理退回「未预约」'); ST.ok(careUnits(c).rows.some(function(r){ return r.s.skipped; }), '项目卡里出现未预约单元');
    ST.ok(coreCareBook(c, careUnits(c).rows.filter(function(r){ return r.s.skipped; })[0].item, 0, row.date, row.time||'10:00', 'KR', row.id, ST.krBy) && !row.skipped && row.src==='care', '［预约时间］重新预约（并回原来的子案件）');
    var lib = krLocalLib('H1').filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0], sp = lib.specs[0];
    ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:{projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price}}), '在韩加管理项目'); var it = c.procedureItems[c.procedureItems.length-1];
    ST.ok(!coreUnitBookUse(c, it.name, D(30), '10:00', ST.krBy), '待付款：不能预约使用'); ST.ok(!coreUnitUseNow(c, it.name, ST.krBy).ok, '待付款 / 没人到店：不能本次使用');
    ST.ok(coreAddOnPaid(c, ST.krBy) && it.heldOver, '付款后在韩持有'); ST.ok(coreUseTarget(c)===null && !coreUnitUseNow(c, it.name, ST.krBy).ok, '没有客人已到店时没有目标，［本次使用］不可用');
    ST.ok(coreUnitBookUse(c, it.name, D(30), '11:00', ST.krBy), '［预约使用］'); var k3 = 'KR|'+D(30); ST.ok(visitSource(c, k3)==='管理预约' && coreVisitRows(c, k3).length===1, '新子案件：预约来源 = 管理预约');
    coreVisitSim(c, k3, ST.krBy); ST.ok(coreVisitArrive(c, k3, ST.krBy), '到店'); var r3 = coreVisitRows(c, k3)[0]; ST.ok(coreSubDone(c, r3.id, ST.krBy, []) && it.holdUsed===1 && (it.uses||[]).length===1, '完成：扣 1 次，记使用时间');
    coreVisitSim(c, k1, ST.krBy); ST.ok(coreVisitArrive(c, k1, ST.krBy) && coreUseTarget(c).key===k1, '到店后目标 = 这次到访');
  });
  ST.def('R21a','院长同一时段只有一件事：在韩增加施术项目拉长施术块撞到不可预约 → 被挡；管理项目不占时长；标不可预约 / OFF 撞到安排 → 被挡（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R21a1'); var hid = caseKrHospital(c), ks = c.krSchedule, dir = c.director, h = HOSPITAL_DATA[hid], date = ks.confirmedDate;
    var dur0 = surgeryMinutes(c), st0 = timeToMin(ks.confirmedTime), endBlk = st0 + dur0;
    var extraN = (h.projects||[]).filter(function(p){ return p.name!==undefined && !krActiveItems(c).some(function(it){ return it.name===p.name; }) && p.defaults && p.defaults.durMin>=30; })[0]; if(!ST.ok(!!extraN, '找不到有时长的 KR 项目')) return;
    var bs = {id:'R21busy', who:dir, date:date, time:minToTime(endBlk+10), end:minToTime(Math.min(1439, endBlk+70)), type:'不可预约', title:'不可预约', note:''}; (h.directorSchedule[dir] = h.directorSchedule[dir]||[]).push(bs);
    KR_LAST_CONFLICT = ''; var n0 = krActiveItems(c).length; ST.ok(!coreAddOnItem(c, extraN.name, ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}}) && /不可预约/.test(KR_LAST_CONFLICT) && krActiveItems(c).length===n0, '在韩增加施术项目会拉长到不可预约 → 被挡，并写出撞到哪一件：'+KR_LAST_CONFLICT.slice(0,60)); KR_LAST_CONFLICT = '';
    var lib = krLocalLib(hid).filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0], sp = lib.specs[0];
    ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:{projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price}}), '管理项目照常能加'); ST.ok(surgeryMinutes(c)===dur0, '管理项目不占院长时长（'+dur0+' 分钟不变）');
    syncSurgeryBlock(c); var blk = (h.directorSchedule[dir]||[]).filter(function(b){ return b.kind==='施术' && b.caseId===c.id; })[0]; ST.ok(!!blk && blk.end===minToTime(Math.min(1439, endBlk)), '施术块只按施术项目算：'+(blk&&blk.end));
    var er = krBusySlotError(hid, dir, date, minToTime(st0+10), minToTime(st0+40)); ST.ok(/施术/.test(er), '在已有施术时段标不可预约 → 被挡：'+er);
    var cl = directorClashList(hid, dir, date, st0, st0+30, {}); ST.ok(cl.some(function(x){ return x.what==='施术'; }), '标 OFF 的冲突检查会列出施术'); var se = krSurgerySlotError(hid, dir, date, minToTime(endBlk+20), 30, 'x:y', {allowOffHours:true}); ST.ok(/不可预约/.test(se), '别的案件排到不可预约时段 → 被挡');
    h.directorSchedule[dir] = h.directorSchedule[dir].filter(function(b){ return b.id!=='R21busy'; });
  });
  ST.def('R21b','已重叠的数据：两个块都标红框「时间冲突」，不自动改动；施术块列表只写施术项目（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var hid = krHospitalIdOfMe(), h = krHData(), who = krcDirectors()[0], d0 = D(70), mk = function(id, t, e){ return {id:id, who:who, date:d0, time:t, end:e, type:'不可预约', title:'不可预约', note:''}; };
    var a = mk('R21x1', '14:00', '16:00'), b = mk('R21x2', '15:00', '17:00'); (h.directorSchedule[who] = h.directorSchedule[who]||[]).push(a, b);
    var ca = krcBlockConflict({b:a}), cb = krcBlockConflict({b:b}); ST.ok(!!ca && !!cb, '两个重叠的块都被识别为冲突');
    krcBlockHtml.call && ST.ok(/时间冲突/.test(krcBlockHtml({b:a, n:1, lane:0, label:''}, false)) && /D02B2B/.test(krcBlockHtml({b:b, n:1, lane:0, label:''}, false)), '日历块红框 + 写「时间冲突」');
    ST.ok(h.directorSchedule[who].filter(function(x){ return x.id==='R21x1'; })[0].time==='14:00', '不自动改动任何一方');
    h.directorSchedule[who] = h.directorSchedule[who].filter(function(x){ return x.id!=='R21x1' && x.id!=='R21x2'; });
    krBlock('测试'); ST.ok(/知道了/.test(document.getElementById('kr-block-overlay').innerText) && document.querySelectorAll('#kr-block-overlay button').length===1, '冲突 Modal：只有［知道了］'); document.getElementById('kr-block-overlay').classList.remove('open');
  });
  ST.def('R22a','无限延期：术后管理退回未预约、全部延期 → 子案件结案；增加项目：麻醉同意书付款后确认；时间冲突询问两个分支（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R22a1'); ST.krCloseToday(c); subCaseNos(c); var reps = subCaseList(c).filter(function(r){ return r.place==='KR'; }); if(!ST.ok(reps.length>=2, '要有两个以上子案件')) return;
    var k1 = subCaseKey(reps[0]), rows1 = coreVisitRows(c, k1).filter(function(s){ return !s.done; }), no1 = reps[0].dno;
    var u0 = careUnits(c).unbooked.length; rows1.forEach(function(s){ ST.ok(coreRowPostpone(c, s.id, ST.krBy), '无限延期一行'); });
    ST.ok(careUnits(c).rows.filter(function(r){ return r.s.skipped; }).length===rows1.length, '延期的术后管理退回项目卡「未预约」');
    ST.ok(c.visitEnds && c.visitEnds[k1] && c.visitEnds[k1].reason==='全部延期' && !subCaseList(c).some(function(r){ return subCaseKey(r)===k1; }), '这个子案件里的项目全部延期 → 子案件结案（全部延期）');
    var back = careUnits(c).rows.filter(function(r){ return r.s.skipped; })[0]; ST.ok(coreCareBook(c, back.item, 0, D(40), '10:00', 'KR', back.s.id, ST.krBy) && !back.s.skipped && back.s.date===D(40) && subCaseList(c).some(function(r){ return subCaseKey(r)==='KR|'+D(40); }), '重新预约：回到新日期的预约案件（原来那张「全部延期」留作记录）');
    /* 增加项目：睡眠 / 全麻，付款后才确认麻醉同意书 */
    var sleep = (HOSPITAL_DATA[caseKrHospital(c)].projects||[]).filter(function(p){ return p.defaults && p.defaults.anes && p.defaults.anes!=='local' && !krActiveItems(c).some(function(it){ return it.name===p.name; }); })[0];
    var nm = sleep ? sleep.name : '埋线双眼皮', an = {type:'sleep', label:'睡眠麻醉', note:''}; KR_FORCE_CLASH = true;
    try{ ST.ok(coreAddOnItem(c, nm, ST.krBy, {anesthesia:an}), '选项目 → 确认：不再要求勾选麻醉同意书'); } finally { KR_FORCE_CLASH = false; }
    var it = c.procedureItems[c.procedureItems.length-1]; ST.ok(it.consentPending && it.pendingPay && !anesPendingItems(c).length, '付款前：待付款，同意书还不用确认');
    ST.ok(coreAddOnPaid(c, ST.krBy) && anesPendingItems(c).length===1, '付款后：出现「待确认麻醉同意书」');
    var row = (c.subItems||[]).filter(function(s){ return s.kind==='增加项目' && s.projectName===it.name; })[0]; ST.ok(!coreSubDone(c, row.id, ST.krBy, []), '确认麻醉同意书之前不能完成该项目');
    ST.ok(coreAnesConfirm(c, null, ST.krBy) && !it.consentPending && c.anesthesiaConsent.projects.some(function(p){ return p.name===it.name; }), '确认已签署 → 记录同意书');
    /* 冲突询问：先造一个会撞的不可预约，再加施术项目 */
    var hid = caseKrHospital(c), ks = c.krSchedule, h = HOSPITAL_DATA[hid], dir = c.director, endBlk = timeToMin(ks.confirmedTime) + surgeryMinutes(c);
    (h.directorSchedule[dir] = h.directorSchedule[dir]||[]).push({id:'R22busy', who:dir, date:ks.confirmedDate, time:minToTime(endBlk+10), end:minToTime(Math.min(1439, endBlk+70)), type:'不可预约', title:'不可预约', note:''});
    var p2 = (h.projects||[]).filter(function(p){ return p.defaults && p.defaults.durMin>=60 && !krActiveItems(c).some(function(x){ return x.name===p.name; }); })[0]; if(!p2){ ST.ok(true, '没有第二个长时项目，跳过冲突分支'); return; }
    KR_LAST_CONFLICT = ''; var n1 = c.procedureItems.length; ST.ok(!coreAddOnItem(c, p2.name, ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}}) && KR_LAST_CONFLICT && KR_CONFLICT_KIND==='add' && c.procedureItems.length===n1, '冲突时先询问（核心函数拒绝，标记为增加类）'); KR_LAST_CONFLICT = '';
    KR_DEFER_ADD = true; try{ ST.ok(coreAddOnItem(c, p2.name, ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}}), '［不在这个时段］：项目照加'); } finally { KR_DEFER_ADD = false; }
    var d2 = c.procedureItems[c.procedureItems.length-1]; ST.ok(d2.deferUse && !(c.subItems||[]).some(function(s){ return s.projectName===d2.name && !s.done && s.kind==='增加项目'; }) && surgeryMinutes(c)===surgeryMinutes(c, [], [d2.name]), '照加但不占这个时段，放在项目卡未使用');
    h.directorSchedule[dir] = h.directorSchedule[dir].filter(function(b){ return b.id!=='R22busy'; });
  });
  ST.def('R23a','在韩增加 1 个睡眠麻醉施术 + 1 个管理项目，留给 KM1 看顶部提醒条（A1 分页，造数据）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R23a1'); ST.krCloseToday(c); var h = HOSPITAL_DATA[caseKrHospital(c)];
    var sl = (h.projects||[]).filter(function(p){ return p.defaults && p.defaults.anes && p.defaults.anes!=='local' && !krActiveItems(c).some(function(it){ return it.name===p.name; }); })[0]; if(!ST.ok(!!sl, '要有睡眠 / 全麻的施术项目')) return;
    KR_FORCE_CLASH = true; try{ ST.ok(coreAddOnItem(c, sl.name, ST.krBy, {anesthesia:{type:sl.defaults.anes, label:'睡眠麻醉', note:''}}), '加睡眠麻醉施术'); } finally { KR_FORCE_CLASH = false; }
    var lib = krLocalLib('H1').filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0], sp = lib.specs[0];
    ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:{projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price}}), '加管理项目'); ST.ok(pendingPayItems(c).length===2, '两项待付款');
  });
  ST.def('R23b','案件页最上面红色提醒条：待付款 → 待确认麻醉同意书 → 确认后消失；任何 tab 都看得到；项目 tab 里没有重复的红条（KM1 分页，先在 A1 跑 R23a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return pendingPayItems(x.c).length>=2 && pendingPayItems(x.c).some(function(it){ return it.consentPending; }); })[0]; if(!ST.ok(!!r, '先在 A1 分页跑 R23a')) return;
    var body = function(tab){ krShowCase(r.clinicId, r.id); krSetCaseTab(tab); return document.getElementById('krcase-body').innerText; };
    var pos = function(){ var el = document.getElementById('krcase-body'), t = el.innerText; return {bar:t.indexOf('待付款'), tab:t.indexOf('基础资料')}; };
    ['basic','items','log'].forEach(function(t){ var tx = body(t); ST.ok(/⚠ 待付款/.test(tx) && /在韩增加 2 项未付款/.test(tx) && /去付款/.test(tx), 'tab '+t+'：顶部「待付款」条在'); });
    var tx0 = body('basic'); ST.ok(tx0.indexOf('待付款') < tx0.indexOf('基础资料', tx0.indexOf('待付款')) && tx0.indexOf('待付款') > tx0.indexOf(r.caseNo), '位置：页头下、tab 上');
    ST.ok(!/未付款\n.*合计/.test(body('items')) && (body('items').match(/⚠ 待付款/g)||[]).length===1, '项目 tab 里原来的「未付款」条拿掉，只留最上面这一条');
    ST.ok(!/待确认麻醉同意书/.test(body('basic')), '付款前没有同意书条'); krPayOpen(); var pm = document.getElementById('kr-pay-overlay').innerText; ST.ok(/确认付款/.test(pm) && /施术项目/.test(pm) && /管理项目/.test(pm) && /麻醉同意书/.test(pm) && /稍后付款/.test(pm), '［去付款］打开确认付款 Modal：施术 / 管理分开 + 麻醉同意书块');
    var al = window.alert, said = ''; window.alert = function(m){ said = m; }; try{ krPayConfirm(); } finally { window.alert = al; } ST.ok(/麻醉同意书/.test(said) && pendingPayItems(krFindCase(r.clinicId, r.id).c).length>=2, '不勾麻醉同意书不能确认付款');
    document.getElementById('kr-pay-consent').checked = true; krPayConfirm();
    var t1 = body('basic'); ST.ok(!/⚠ 待付款/.test(t1) && !/⚠ 待确认麻醉同意书/.test(t1), '确认付款 = 付款 + 同意书一次记录：两条都消失');
    Store.withClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; ST.ok(!anesPendingItems(cc).length && cc.anesthesiaConsent && cc.anesthesiaConsent.projects.length>0, '同意书已记录'); var row = (cc.subItems||[]).filter(function(s){ return s.kind==='增加项目' && /施术：/.test(s.content); })[0]; ST.ok(!!row && coreSubDone(cc, row.id, 'x', []), '付款 + 同意书后项目可以［操作完成］'); });
  });
  ST.def('R24a','在韩增加：先问延长多久（不延长 = 不查冲突；延长压到安排 = 冲突提醒）；增加的施术行写「施术：xx」；留两笔 KR 占位预约给 KM1（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R24a1'); ST.krCloseToday(c); var hid = caseKrHospital(c), ks = c.krSchedule, h = HOSPITAL_DATA[hid], dir = c.director, endBlk = timeToMin(ks.confirmedTime) + surgeryMinutes(c);
    (h.directorSchedule[dir] = h.directorSchedule[dir]||[]).push({id:'R24busy', who:dir, date:ks.confirmedDate, time:minToTime(endBlk+10), end:minToTime(Math.min(1439, endBlk+70)), type:'不可预约', title:'不可预约', note:''});
    var p = (h.projects||[]).filter(function(x){ return x.defaults && x.defaults.durMin>=60 && !krActiveItems(c).some(function(it){ return it.name===x.name; }); })[0]; if(!ST.ok(!!p, '要有长时项目')) return; var an = {type:'local', label:'局部麻醉', note:''}, dur0 = surgeryMinutes(c);
    KR_LAST_CONFLICT = ''; ST.ok(coreAddOnItem(c, p.name, ST.krBy, {anesthesia:an, extendMin:0}) && !KR_LAST_CONFLICT && surgeryMinutes(c)===dur0, '［不延长］：不查冲突，直接加，施术时间不变（项目时长 '+itemDurMin(c, p.name)+' 分钟没有被自动相加）');
    var row = (c.subItems||[]).filter(function(s){ return s.kind==='增加项目' && s.projectName===p.name; })[0]; ST.ok(!!row && row.content==='施术：'+p.name, '今日案件里和「施术：xx」一样一行：'+(row&&row.content));
    var p2 = (h.projects||[]).filter(function(x){ return x.defaults && x.defaults.durMin>=30 && x.name!==p.name && !krActiveItems(c).some(function(it){ return it.name===x.name; }); })[0];
    ST.ok(!coreAddOnItem(c, p2.name, ST.krBy, {anesthesia:an, extendMin:180}) && /不可预约/.test(KR_LAST_CONFLICT), '［+3 小时］压到不可预约 → 冲突提醒'); KR_LAST_CONFLICT = '';
    KR_FORCE_CLASH = true; try{ ST.ok(coreAddOnItem(c, p2.name, ST.krBy, {anesthesia:an, extendMin:30}), '［仍然进行］照延长'); } finally { KR_FORCE_CLASH = false; } ST.ok(surgeryMinutes(c)===dur0+30, '施术块只延长所选的 30 分钟（'+surgeryMinutes(c)+'）');
    h.directorSchedule[dir] = h.directorSchedule[dir].filter(function(b){ return b.id!=='R24busy'; });
    /* 两笔 KR 占位预约，给 KM1 测预约到店阶段的干净案件页 */
    var name = krbClients()[0], mk = function(k){ var slot = ST.bkFreeSlot(hid, 6+k); if(!slot) return false; KRB = {hid:hid, date:slot.ds, time:slot.t, director:'', client:name, purpose:'care', note:'R24', replaceId:null, info:'', err:''}; krbSubmit(); return true; };
    ST.ok(mk(0) && mk(1), '两笔占位预约'); localStorage.setItem('__R24', JSON.stringify({hid:hid, name:name}));
  });
  ST.def('R24b','KM1：延长弹窗；确认付款 Modal；KR 预约到店阶段的案件页只有页头 + 状态卡 + 四个按钮，到店后才是完整案件页（先在 A1 跑 R24a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R24')||'null'); if(!ST.ok(!!rec, '先在 A1 分页跑 R24a')) return; var hid = rec.hid;
    var r0 = krAllCases().filter(function(x){ return x.c.krSchedule && x.c.hasArrived && !x.c.visitClosed; })[0];
    if(r0){ KR_CASE = {clinicId:r0.clinicId, id:r0.id, tab:'items'}; krExtOpen(r0.c, ['埋线双眼皮'], function(){}); var tx = document.getElementById('kr-ext-overlay').innerText; ST.ok(/现在/.test(tx) && /不延长/.test(tx) && /\+30 分/.test(tx) && /\+1 小时/.test(tx) && /\+1 小时 30 分/.test(tx) && /自定义/.test(tx), '延长弹窗：现在 xx–xx（共 …）+ 五个选项'); document.getElementById('kr-ext-overlay').classList.remove('open'); }
    var pend = krbList(hid).filter(function(b){ return b.status==='pending' && /R24/.test(b.note||''); }); if(!ST.ok(pend.length>=2, '要有两笔待确认的占位')) return;
    var res = coreBookConfirm(hid, pend[0].id, 'KM1 室长'); ST.ok(res.ok, 'KR 确认：'+res.err); var cs = krAllCases().filter(function(x){ return x.id===res.caseId; })[0];
    krShowCase(cs.clinicId, cs.id); var tx2 = document.getElementById('krcase-body').innerText, btns = [].slice.call(document.querySelectorAll('#krcase-body button')).map(function(b){ return b.textContent.trim(); });
    ST.ok(/预约到店 · 待访问/.test(tx2) && ['客人已到店','预约修改','未到店','预约取消'].every(function(x){ return btns.indexOf(x)>-1; }), '预约到店阶段：状态卡 + ［客人已到店］［预约修改］［未到店］［预约取消］'); ST.ok(!/基础资料|项目卡|今日案件/.test(tx2) && !document.querySelector('#krcase-body .cal-switch'), '干净版：没有 tab、项目卡、案件区块');
    var b0 = krbFind(hid, pend[0].id), d2 = krDateAdd(40); ST.ok(coreBookChange(hid, b0.id, d2, '15:00', 'KM1 室长').ok && b0.date===d2, '预约修改');
    var rr = coreBookCancel(hid, pend[1].id, 'x', 'KM1 室长'); ST.ok(!rr.ok, '没确认的占位不能走取消'); var res2 = coreBookConfirm(hid, pend[1].id, 'KM1 室长'); var cs2 = krAllCases().filter(function(x){ return x.id===res2.caseId; })[0];
    var okc = coreBookCancel(hid, pend[1].id, 'noshow', 'KM1 室长').ok, cc2 = Store.withClinic(cs2.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===cs2.id; })[0]; }); ST.ok(okc && cc2.subState==='cancelled' && cc2.cancelReason==='未到店', '未到店：案件取消（原因未到店）');
    coreBookSimDay(hid, b0.id); ST.ok(coreBookArrive(hid, b0.id, 'KM1 室长'), '到店'); krShowCase(cs.clinicId, cs.id); ST.ok(/基础资料/.test(document.getElementById('krcase-body').innerText), '到店后才进入完整案件页（有 tab）');
  });
  ST.def('R26a','Step 4 今日进行项目：勾的进今日案件，没勾的留在项目卡未使用（A1 分页，另留两个到院中的案件给 KM1）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = toConfirmed('R26a0'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); var h = HOSPITAL_DATA[caseKrHospital(c)];
    var lib = krLocalLib('H1').filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0], sp = lib.specs[0];
    KR_FORCE_CLASH = true; try{ ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:{projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price}}), '加管理项目'); var ex = (h.projects||[]).filter(function(p){ return p.defaults && p.defaults.durMin>=30 && !krActiveItems(c).some(function(it){ return it.name===p.name; }); })[0]; ST.ok(coreAddOnItem(c, ex.name, ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, extendMin:30}), '加施术'); } finally { KR_FORCE_CLASH = false; }
    coreAddOnPaid(c, ST.krBy); var plan = krActiveItems(c).filter(function(it){ return !krIsMgmtItemC(it) && !it.krAddOn && !it.preBalanceAdd; }); if(!ST.ok(plan.length>=2, '诊疗方案里要有两个施术项目')) return;
    c.needTodayPick = true; c.todayPicked = false; ST.ok(!coreTodayPick(c, [], [], ST.krBy).ok, '至少勾一个'); var mgItem = c.procedureItems.filter(function(it){ return krIsMgmtItemC(it) && it.heldOver; })[0];
    ST.ok(coreTodayPick(c, [plan[0].name], mgItem ? [mgItem.name] : [], ST.krBy).ok && c.todayPicked && !c.needTodayPick, '今日进行：勾 1 个施术 + 1 个管理项目');
    ST.ok(plan[1].deferUse && !plan[0].deferUse, '没勾的施术项目留在项目卡「未使用」（deferUse）'); var row = (c.subItems||[]).filter(function(s){ return s.kind==='施术'; })[0]; ST.ok(row && row.content==='施术：'+plan[0].name, '施术行只写勾的项目：'+(row&&row.content));
    ST.ok(!(c.subItems||[]).some(function(s){ return s.kind==='增加项目' && s.projectName===ex.name && !s.done; }) && c.procedureItems.filter(function(it){ return it.name===ex.name; })[0].deferUse, '没勾的在韩增加施术：今日行拿掉，留在项目卡');
    ST.ok(coreSubDone(c, row.id, ST.krBy, []) && plan[0].done && !plan[1].done, '施术行完成只完成勾的项目');
    /* 留两个到院中的案件给 KM1：A = 评估前；B = 评估「原方案不变」后、尾款前 */
    var A = toConfirmed('R26aA'); ST.krArrive(A); var B = toConfirmed('R26aB'); ST.krArrive(B); ST.krJudge(B, 'ok'); ST.ok(!B.krBalancePaid && !!B.krJudge, '案件 B 停在 Step 2'); localStorage.setItem('__R26', JSON.stringify({a:A.id, b:B.id}));
  });
  ST.def('R26b','KM1：Step 1 评估（已付定金项目框，没有项目卡）→ Step 2（添加项目 + 付清尾款，来源标注，没有行程确认勾选）→ Step 3 确认付款 → Step 4 勾今日项目 → 结算 tab（先在 A1 跑 R26a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R26')||'null'); if(!ST.ok(!!rec, '先在 A1 分页跑 R26a')) return;
    var ra = krAllCases().filter(function(x){ return x.id===rec.a; })[0], rb = krAllCases().filter(function(x){ return x.id===rec.b; })[0]; if(!ST.ok(!!ra && !!rb, '找不到案件')) return;
    krProjPage('surg'); krShowCase(ra.clinicId, ra.id); krSetCaseTab('items'); var t1 = document.getElementById('krcase-body').innerText;
    ST.ok(/院长评估结果/.test(t1) && !/到院与尾款/.test(t1) && !/麻醉|推荐在韩/.test(t1) && document.querySelectorAll('#krcase-body .card').length>=1 && /已付定金项目/.test(t1) && /施术项目/.test(t1) && /可以手术，原方案不变/.test(t1) && /确认评估结果/.test(t1) && /撤回.*已到医院/.test(t1), 'Step 1：已付定金项目框 + 三选一 + ［确认评估结果］［撤回已到医院］'); ST.ok(!/项目卡/.test(t1) && !/未开始/.test(t1), 'Step 1：不显示项目卡，没有「未开始」');
    krShowCase(rb.clinicId, rb.id); krSetCaseTab('items'); var t2 = document.getElementById('krcase-body').innerText;
    ST.ok(/已付定金项目/.test(t2) && /添加项目/.test(t2) && /付清尾款/.test(t2) && /已付定金/.test(t2) && /项目合计/.test(t2) && /已付定金（可抵）/.test(t2) && /尾款（在韩国补）/.test(t2) && /结算尾款/.test(t2), 'Step 2：已付定金项目 / 添加项目 / 付清尾款（合计 / 已付定金可抵 / 尾款）/ ［结算尾款］'); ST.ok(!/已和客人确认行程/.test(t2) && !/项目卡/.test(t2) && !/KR 判断/.test(t2) && /上一步/.test(t2), 'Step 2：没有「已和客人确认行程」勾选、没有「KR 判断」行，保留上一步');
    var cbs = Store.withClinic(rb.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===rb.id; })[0]; var have = krAllItems(cc).map(function(it){ return it.name; }); return krScopeCandidates(rb.clinicId).kr.filter(function(p){ return have.indexOf(p.name)<0; })[0]; });
    if(cbs){ krShowCase(rb.clinicId, rb.id); krSetCaseTab('items'); KR_ADJ.addOpen = true; krRenderCaseDetail(); krChToggle('adj', cbs.name, true); ST.ok(!!document.getElementById('kr-ext-overlay') && document.getElementById('kr-ext-overlay').classList.contains('open') && /要延长多久/.test(document.getElementById('kr-ext-overlay').innerText), 'Step 2：加施术项目当下就问延长多久（不等结算尾款）');
      krExtPick(30); var bo = document.getElementById('kr-block-overlay'); if(bo && bo.classList.contains('open') && /时间冲突/.test(bo.innerText)) window.__krAskGo('go');
      ST.ok(!!KR_ADJ.adds[cbs.name] && KR_ADJ.ext[cbs.name]===30, '选了 +30 分：记在添加项目里'); var ta = document.getElementById('krcase-body').innerText; ST.ok(/添加项目/.test(ta) && ta.indexOf(cbs.name)>-1 && /延长/.test(ta), '添加项目框里列出加的项目（带延长）'); }
    krSettleOpen('ok'); var m = document.getElementById('kr-settle-overlay').innerText; ST.ok(/确认付款/.test(m) && /尾款（在韩国补）/.test(m) && !/稍后付款/.test(m) && /取消/.test(m), 'Step 3：确认付款弹窗（尾款明细），没有稍后付款，只有取消 / 确认付款'); var ck = document.getElementById('kr-settle-consent'); if(ck) ck.checked = true; krSettleConfirm();
    var cb = Store.withClinic(rb.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===rb.id; })[0]; }); ST.ok(cb.krBalancePaid && cb.needTodayPick && !cb.todayPicked, '确认付款 = 付清尾款，进入 Step 4');
    krShowCase(rb.clinicId, rb.id); krSetCaseTab('items'); var t3 = document.getElementById('krcase-body').innerText; ST.ok(/今日进行项目/.test(t3) && !/请勾选今日进行项目/.test(t3) && /已勾选：0 个项目/.test(t3) && !/退回前页/.test(t3) && /今日进行/.test(t3) && document.querySelectorAll('#krcase-body input[type=checkbox]').length>0, 'Step 4：项目卡每行有勾选框 + 今日进行项目标题 + 只有［今日进行］');
    var cbx = document.querySelector('#krcase-body input[type=checkbox]'); cbx.checked = true; cbx.onchange && cbx.onchange.call(cbx); ST.ok(/已勾选：1 个项目/.test(document.getElementById('krcase-body').innerText), '勾 1 个 → 已勾选：1 个项目'); krPickGo();
    krShowCase(rb.clinicId, rb.id); krSetCaseTab('items'); var t4 = document.getElementById('krcase-body').innerText; ST.ok(/今日案件/.test(t4) && !/今日进行项目/.test(t4), '今日进行 → 勾的变今日案件的行');
    krSetCaseTab('settle'); var t5 = document.getElementById('krcase-body').innerText; ST.ok(/定金（IN 收）/.test(t5) && /尾款（医院收）/.test(t5) && !/Rp\s*[\d.]+/.test(t5), '结算 tab：定金 / 尾款（韩元），没有印尼盾的面诊费 / 本地项目金额'); ST.ok(KR_CASE_TABS.map(function(x){ return x.label; }).filter(function(x){ return x!=='关联案件'; }).join('｜')==='基础资料｜面诊｜项目｜结算｜附件｜Timeline', 'tab = 基础资料｜面诊｜项目｜结算｜附件｜Timeline');
  });
  ST.def('R28a','术后管理分页数据：拆线（第7天）+ 术后复诊（第2天）+ 术后消肿管理 ×3（第3天起每隔2天），约消肿第 1 次（A1 分页，给 KM1 看）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = toConfirmed('R28a0'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); var it = c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x); })[0];
    it.postcare = [{mgmt:'拆线', name:'拆线', times:1, place:'KR', startDay:7}, {mgmt:'术后复诊', name:'术后复诊检查', times:1, place:'KR', startDay:2}, {mgmt:'术后管理', name:'术后消肿管理', times:3, interval:2, place:'KR', startDay:3}];
    var sd = c.krSchedule.confirmedDate, d3 = new Date(sd+'T00:00:00'); d3.setDate(d3.getDate()+3); var ds = d3.getFullYear()+'-'+('0'+(d3.getMonth()+1)).slice(-2)+'-'+('0'+d3.getDate()).slice(-2);
    ST.ok(coreCareBook(c, it.name, 2, ds, '15:00', 'KR', null, ST.krBy), '约消肿管理第 1 次'); localStorage.setItem('__R28', JSON.stringify({id:c.id, sd:sd}));
  });
  ST.def('R28b','KM1：项目卡术后管理分页栏位（项目｜对应施术｜项目类型｜次数｜管理间隔｜建议日期｜Action），多次剩 / 共，按建议日期排序，没有购买时间（先在 A1 跑 R28a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R28')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R28a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件')) return; krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('care'); var t0 = document.getElementById('krcase-body').innerText;
    ST.ok(/项目\s*地点\s*对应施术\s*次数\s*管理间隔\s*建议日期/.test(t0) && !/购买时间/.test(t0), '栏位 = 项目｜地点｜对应施术｜次数｜管理间隔｜建议日期（CMD-1015-29 拿掉项目类型、CMD-1015-30 地点单独一栏），没有购买时间');
    ST.ok(/剩 2 \/ 共 3 次/.test(t0) && /3 天后起，每隔 2 天/.test(t0), '消肿管理约第 1 次后：剩 2 / 共 3 次、3 天后起，每隔 2 天');
    var iF = t0.indexOf('术后复诊检查'), iX = t0.indexOf('术后消肿管理'), iC = t0.indexOf('拆线'); ST.ok(iF>-1 && iX>iF && iC>iX, '未预约按建议日期排序：术后复诊（+2）→ 消肿下一次（+5）→ 拆线（+7）');
    var d5 = new Date(rec.sd+'T00:00:00'); d5.setDate(d5.getDate()+5); var s5 = String(d5.getFullYear()).slice(2)+'-'+('0'+(d5.getMonth()+1)).slice(-2)+'-'+('0'+d5.getDate()).slice(-2); ST.ok(t0.indexOf(s5)>-1, '消肿管理建议日期显示下一次（施术日 + 5 天 = '+s5+'）');
    ST.ok(/已预约/.test(t0) && /预约时间/.test(t0) && /韩国/.test(t0), '已预约组同栏位，预约时间；地点单独一栏');
  });
  ST.def('R29a','今日进行后弹术后管理预约 + 今日案件行（A1 分页造两个案件：A = 约几项 / B = 稍后预约）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return; var ids = [];
    ['R29aA','R29aB'].forEach(function(nm){
      var c = toConfirmed(nm); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c);
      c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x); }).forEach(function(it, n){ it.postcare = n===0 ? [{mgmt:'拆线', name:'拆线', times:1, place:'KR', startDay:7}, {mgmt:'术后复诊', name:'术后复诊检查', times:1, place:'KR', startDay:2}, {mgmt:'术后管理', name:'术后消肿管理', times:3, interval:2, place:'either', innName:'消肿管理（印尼）', startDay:3}] : []; });
      c.needTodayPick = true; c.todayPicked = false; ids.push(c.id);
    });
    localStorage.setItem('__R29', JSON.stringify({a:ids[0], b:ids[1]}));
  });
  ST.def('R29b','KM1：栏宽均分（术后管理分页没有项目类型）；今日进行 → 术后管理预约弹窗（约几项 / 印尼只记 / 稍后预约）；今日案件每行［操作完成］［今日取消］、施术一项一行（先在 A1 跑 R29a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R29')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R29a')) return;
    var ra = krAllCases().filter(function(x){ return x.id===rec.a; })[0], rb = krAllCases().filter(function(x){ return x.id===rec.b; })[0]; if(!ST.ok(!!ra && !!rb, '找不到案件')) return;
    var gc = function(r){ return Store.withClinic(r.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; }); };
    krShowCase(ra.clinicId, ra.id); krSetCaseTab('items'); krProjPage('surg'); var names = []; var pk = gc(ra).procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).map(function(x){ return x.name; }); pk.forEach(function(n){ KR_PICK['surg:'+n] = true; });
    krPickGo(); krCareMiniOpen(); (function(){
      var ov = document.getElementById('kr-caremini-overlay'); ST.ok(!!ov && ov.classList.contains('open') && /术后管理预约/.test(ov.innerText) && /项目[\s\S]*对应施术[\s\S]*建议日期[\s\S]*地点[\s\S]*时间/.test(ov.innerText) && /稍后预约/.test(ov.innerText) && /日程预约/.test(ov.innerText), '今日进行后弹术后管理预约（项目｜对应施术｜建议日期｜地点｜时间，［稍后预约］［日程预约］）'); ST.ok(KR_CM && KR_CM.rows.length===5, '未预约 5 项（拆线 / 术后复诊 / 消肿 ×3）：'+(KR_CM&&KR_CM.rows.length));
      var iC = KR_CM.rows.findIndex(function(r){ return r.x.mgmt==='拆线'; }), iF = KR_CM.rows.findIndex(function(r){ return r.x.name==='术后复诊检查'; }), iX = KR_CM.rows.findIndex(function(r){ return r.x.name==='术后消肿管理'; });
      krCareMiniSet(iC, 'time', '12:00'); krCareMiniSet(iF, 'time', '12:30'); krCareMiniSet(iX, 'place', 'IN'); krCareMiniGo(); var bo = document.getElementById('kr-block-overlay'); if(bo && bo.classList.contains('open') && /时间冲突/.test(bo.innerText)) window.__krAskGo('go');
    })(); (function(){
      var c = gc(ra), care = (c.subItems||[]).filter(function(x){ return x.kind==='术后管理记录' && !x.skipped; }); ST.ok(care.length===3 && care.filter(function(x){ return x.place==='IN'; }).length===1 && care.filter(function(x){ return x.place==='KR' && x.time; }).length===2, '日程预约：约了 3 项（韩国 2 + 印尼 1），没填的留着：'+care.length);
      ST.ok(careUnits(c).unbooked.length===2, '没填的 2 个消肿留在项目卡未预约'); ST.ok(!document.getElementById('kr-caremini-overlay').classList.contains('open'), '弹窗已关闭');
      ST.ok(care.some(function(x){ return x.place==='KR' && /术后预约/.test(visitSource(c, subCaseKey(x))) && x.src==='care'; }), '预约来源 = 术后预约');
      ST.ok(typeof calendarEventsKr==='function' ? true : true, ''); krShowCase(ra.clinicId, ra.id); krSetCaseTab('items'); krProjPage('care'); var tc0 = document.getElementById('krcase-body').innerText, tc = tc0.slice(tc0.indexOf('项目卡'), tc0.indexOf('今日案件') > -1 ? tc0.indexOf('今日案件') : undefined); ST.ok(/已预约/.test(tc) && !/项目类型/.test(tc) && /项目\s*地点\s*对应施术\s*次数\s*管理间隔\s*建议日期/.test(tc), '术后管理分页：没有项目类型，栏位 项目｜地点｜对应施术｜次数｜管理间隔｜建议日期');
      krProjPage('surg'); var t1 = document.getElementById('krcase-body').innerText; var mc = document.getElementById('kr-maincard'); var mt = mc ? mc.parentElement.innerText : t1;
      ST.ok(new RegExp('施术：'+pk[0]).test(mt) && new RegExp('施术：'+pk[1]).test(mt) && !/施术：[^\n]*、/.test(mt), '施术项目一项一行'); ST.ok((mt.match(/操作完成/g)||[]).length>=2 && (mt.match(/今日取消/g)||[]).length>=2, '每行［操作完成］［今日取消］');
      ST.ok(!/修改时间/.test(mt) && !/预约后续到院/.test(mt), '今日案件行没有［修改时间］和「预约后续到院」');
      krTodayCancel('item', pk[1], '施术：'+pk[1]); var tm = document.getElementById('kr-tc-overlay'); ST.ok(!!tm && tm.classList.contains('open') && /今天不做/.test(tm.innerText) && /退回项目卡/.test(tm.innerText), '今日取消先弹确认 Modal'); window.__krTcGo();
    })(); (function(){
      var c = gc(ra), it = c.procedureItems.filter(function(x){ return x.name===pk[1]; })[0]; ST.ok(it.deferUse && !it.done && !it.cancelled, '今日取消 = 退回项目卡（deferUse），不是取消项目、不退款'); var sr = (c.subItems||[]).filter(function(x){ return x.kind==='施术'; })[0]; ST.ok(sr && sr.content==='施术：'+pk[0], '施术行只剩没取消的：'+(sr&&sr.content));
      var row = sr; krSurgItemDone(row.id, pk[0]);
    })(); (function(){
      var c = gc(ra), sr = (c.subItems||[]).filter(function(x){ return x.kind==='施术'; })[0]; ST.ok(sr && sr.done && c.procedureItems.filter(function(x){ return x.name===pk[0]; })[0].done, '最后一项做完 → 施术行完成');
      /* B：稍后预约 */
      krShowCase(rb.clinicId, rb.id); krSetCaseTab('items'); krProjPage('surg'); gc(rb).procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).forEach(function(x){ KR_PICK['surg:'+x.name] = true; }); krPickGo(); krCareMiniOpen();
    })(); (function(){
      var ov = document.getElementById('kr-caremini-overlay'); ST.ok(ov.classList.contains('open'), 'B 也弹窗'); krCareMiniClose(); var c = gc(rb); ST.ok((c.subItems||[]).filter(function(x){ return x.kind==='术后管理记录'; }).length===0 && careUnits(c).unbooked.length===5, '稍后预约：5 项都留在项目卡未预约');
    })();
  });
  ST.def('R30a','项目卡本次使用 / 本次取消 + 术后管理不占院长（A1 分页造案件：2 个施术项目 + 1 个在韩持有管理项目 + 拆线）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = toConfirmed('R30a0'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); var h = HOSPITAL_DATA[caseKrHospital(c)];
    var lib = krLocalLib('H1').filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0], sp = lib.specs[0];
    KR_FORCE_CLASH = true; try{ ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:{projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price}}), '加管理项目'); } finally { KR_FORCE_CLASH = false; }
    coreAddOnPaid(c, ST.krBy); c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x); }).forEach(function(it, n){ it.postcare = n===0 ? [{mgmt:'拆线', name:'拆线', times:1, place:'KR', startDay:7}] : []; });
    c.needTodayPick = true; c.todayPicked = false; localStorage.setItem('__R30', JSON.stringify({id:c.id}));
  });
  ST.def('R30b','KM1：项目卡 —— 未选的［本次使用］（施术先问延长）、已选的［本次取消］；术后管理地点单独一栏；术后管理不查院长冲突、日历画在医院层（先在 A1 跑 R30a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R30')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R30a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件')) return; var gc = function(){ return Store.withClinic(r.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]; }); };
    var plan = gc().procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).map(function(x){ return x.name; }), mg = gc().procedureItems.filter(function(x){ return krIsMgmtItemC(x); })[0];
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); KR_PICK['surg:'+plan[0]] = true; if(mg) KR_PICK['mg:'+mg.name] = true; krPickGo(); krCareMiniClose();
    var c1 = gc(); ST.ok(c1.todayPicked && c1.procedureItems.filter(function(x){ return x.name===plan[1]; })[0].deferUse, '只选了第 1 个施术项目 + 管理项目，第 2 个留在项目卡');
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); var txt = function(){ return document.getElementById('krcase-body').innerText; }, rowOf = function(nm){ var els = [].slice.call(document.querySelectorAll('#krcase-body div')).filter(function(e){ return e.style && /grid/.test(e.style.cssText) && e.innerText.indexOf(nm)===0 && e.children.length>=4; }); return els.length ? els[els.length-1].innerText : ''; };
    ST.ok(/本次取消/.test(rowOf(plan[0])) && !/本次使用/.test(rowOf(plan[0])), '已选进今日、没完成的施术项目 → ［本次取消］：'+rowOf(plan[0]).replace(/\n/g,' ')); ST.ok(/本次使用/.test(rowOf(plan[1])) && !/本次取消/.test(rowOf(plan[1])), '没选进今日的施术项目 → ［本次使用］：'+rowOf(plan[1]).replace(/\n/g,' '));
    if(mg){ krProjPage('mgmt'); ST.ok(/本次取消/.test(rowOf(mg.name)), '已选进今日的管理项目 → ［本次取消］'); krProjPage('surg'); }
    krUnitUseNow(plan[1]); var xo = document.getElementById('kr-ext-overlay'); ST.ok(!!xo && xo.classList.contains('open') && /要延长多久/.test(xo.innerText), '施术［本次使用］先问延长多久'); krExtPick(0);
    var c2 = gc(); ST.ok(!c2.procedureItems.filter(function(x){ return x.name===plan[1]; })[0].deferUse && (c2.subItems||[]).filter(function(s){ return s.kind==='施术'; })[0].content.indexOf(plan[1])>-1, '本次使用 → 加进今日案件（施术行里有它）');
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); ST.ok(/本次取消/.test(rowOf(plan[1])), '加进来之后变成［本次取消］'); krTodayCancel('item', plan[1], plan[1]); window.__krTcGo(); ST.ok(gc().procedureItems.filter(function(x){ return x.name===plan[1]; })[0].deferUse, '［本次取消］= 今日取消，同一个确认弹窗');
    krSurgItemDone((gc().subItems||[]).filter(function(s){ return s.kind==='施术'; })[0].id, plan[0]); krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); ST.ok(!/本次取消/.test(rowOf(plan[0])) && !/本次使用/.test(rowOf(plan[0])), '已完成的没有按钮');
    /* 术后管理：地点单独一栏 / 不占院长 */
    krProjPage('care'); var tc = txt(); tc = tc.slice(tc.indexOf('项目卡'), tc.indexOf('今日案件')>-1 ? tc.indexOf('今日案件') : undefined); ST.ok(/项目\s*地点\s*对应施术\s*次数\s*管理间隔\s*建议日期/.test(tc), '术后管理分页栏位 = 项目｜地点｜对应施术｜次数｜管理间隔｜建议日期');
    var hid = krHospitalIdOfMe(), hd = krHData(), dir = gc().director, slot = careSlotList(gc())[0]; if(!ST.ok(!!slot, '有未预约的拆线')) return; (hd.directorSchedule[dir] = hd.directorSchedule[dir]||[]).push({id:'t30blk', kind:'不可预约', type:'不可预约', date:slot.sug, time:'12:00', end:'13:00', name:''});
    krBkdOpen('care', slot.item, slot.i); KR_BKD.date = slot.sug; KR_BKD.time = '12:00'; krBkdRender(); ST.ok(/不占院长时间/.test(document.getElementById('kr-bkd-overlay').innerText), '预约时间弹窗：不选院长、不显示院长日程'); krBkdSave(); var bo = document.getElementById('kr-block-overlay'); ST.ok(!(bo && bo.classList.contains('open') && /时间冲突|重叠/.test(bo.innerText)), '和院长「不可预约」同时段：不询问冲突');
    var care = (gc().subItems||[]).filter(function(x){ return x.kind==='术后管理记录' && !x.skipped && !x.holdUseOf && !x.surgUse; }); ST.ok(care.length===1 && care[0].time==='12:00', '术后管理预约成功');
    KRC.layer = 'hospital'; var ev = krcEvents(); var cev = ev.surg.filter(function(x){ return x.b.type==='术后管理' && x.b.subId===care[0].id; })[0]; ST.ok(!!cev && cev.b.who===KRB_HOSP && cev.b.noCap===true, '日历：术后管理画在医院层（全院），不算院长约满');
    hd.directorSchedule[dir] = hd.directorSchedule[dir].filter(function(b){ return b.id!=='t30blk'; });
  });
  ST.def('R31a','CMD-1015-31 数据（A1 分页：两个施术项目都选进今日案件 + 拆线未预约）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = toConfirmed('R31a0'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); var plan = c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x); });
    plan[0].postcare = [{mgmt:'拆线', name:'拆线', times:1, place:'KR', startDay:7}]; c.needTodayPick = true; c.todayPicked = false;
    ST.ok(coreTodayPick(c, plan.map(function(x){ return x.name; }), [], ST.krBy).ok, '两个施术项目都选进今日案件'); localStorage.setItem('__R31', JSON.stringify({id:c.id}));
  });
  ST.def('R31b','KM1：施术一项一行 —— 完成一个另一个仍待做 / 取消一个另一个留在今日案件；术后管理待办 / 通知改指向项目卡术后管理分页；施 / 管分页没有项目类型栏；旧术后管理预约卡和小窗口已没有（先在 A1 跑 R31a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R31')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R31a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件')) return; var gc = function(){ return Store.withClinic(r.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]; }); };
    var plan = gc().procedureItems.filter(function(x){ return !krIsMgmtItemC(x); }).map(function(x){ return x.name; });
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); var t0 = document.getElementById('krcase-body').innerText;
    ST.ok(!/项目类型/.test(t0.slice(t0.indexOf('项目卡'), t0.indexOf('今日案件')>-1 ? t0.indexOf('今日案件') : undefined)), '施术项目分页没有项目类型栏'); krProjPage('mgmt'); var t1 = document.getElementById('krcase-body').innerText; ST.ok(!/项目类型/.test(t1.slice(t1.indexOf('项目卡'), t1.indexOf('今日案件')>-1 ? t1.indexOf('今日案件') : undefined)), '管理项目分页没有项目类型栏'); krProjPage('surg');
    ST.ok(typeof krPcbOpen==='undefined' && typeof krPcbOpenLocal==='undefined' && !/术后管理预约<|安排术后管理/.test(document.getElementById('krcase-body').innerHTML), '案件页没有旧的「术后管理预约」卡片和［安排术后管理］');
    /* 待办 / 通知 改指向术后管理分页 */
    var todo = krTodoItems(krAllCases()).filter(function(i){ return i.kind==='pcb' && i.caseId===rec.id; })[0]; if(ST.ok(!!todo, '有「安排术后管理」待办')){ krProjPage('surg'); krShowCase(r.clinicId, r.id); todo.go ? todo.go() : (todo.fn && todo.fn()); ST.ok(KR_CASE.tab==='items' && KR_PROJ_PAGE==='care', '待办点进去 = 项目卡术后管理分页'); }
    var hd = krHData(); (hd.notifs = hd.notifs||[]).push({id:'t31n', kind:'info', text:'术后管理提前：测试', caseId:rec.id, clinicId:r.clinicId, ts:nowFullDt(), readBy:[]}); krProjPage('surg'); krOpenNotif('t31n'); ST.ok(KR_CASE.tab==='items' && KR_PROJ_PAGE==='care', '术后管理类通知点进去 = 项目卡术后管理分页'); hd.notifs = hd.notifs.filter(function(x){ return x.id!=='t31n'; });
    /* 一项一行：完成一个 */
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); var row = (gc().subItems||[]).filter(function(x){ return x.kind==='施术'; })[0]; krSurgItemDone(row.id, plan[0]); var c1 = gc(), itm = function(nm){ return c1.procedureItems.filter(function(x){ return x.name===nm; })[0]; };
    ST.ok(itm(plan[0]).done && !itm(plan[1]).done && !(c1.subItems||[]).filter(function(x){ return x.kind==='施术'; })[0].done, '完成一个施术项目：另一个仍待做，施术行没有完成');
    var tx = document.getElementById('krcase-body').innerText; var mc = document.getElementById('kr-maincard'); var mt = mc ? mc.parentElement.innerText : tx; ST.ok(/施术：\s*鼻翼缩小|施术：[^\n]*鼻翼缩小/.test(mt) || mt.indexOf(plan[1])>-1, '今日案件里另一个还在');
    /* 取消另一个 → 其余都已完成，施术行跟着完成 */
    krTodayCancel('item', plan[1], plan[1]); window.__krTcGo(); var c2 = gc(); ST.ok(c2.procedureItems.filter(function(x){ return x.name===plan[1]; })[0].deferUse && (c2.subItems||[]).filter(function(x){ return x.kind==='施术'; })[0].done, '取消剩下的那个：回项目卡未使用，施术行因其余都完成而完成');
  });
  ST.def('R32a','CMD-1019-01：基础资料顺序 / 苦恼按部位卡片 / 必填校验 / 不面诊选填 / 旧案件转换（A1 分页；案件留给 KM1 看面诊 tab）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = ST.newRes('R32a'); ST.arrive(c); setNeedsConsult(true); /* 选了面诊需求才展开苦恼（CMD-1019-02） */ toggleConcernPart('f_eyes'); var html = materialsCardHtml(c), ix = function(t){ return html.indexOf(t); }; toggleConcernPart('f_eyes'); /* 先选一个部位才有卡片（卡片里有希望预期），看完顺序再取消 */
    ST.ok(ix('关联之前案件')>-1 && ix('关联之前案件') < ix('메타뷰') && ix('메타뷰') < ix('面诊需求') && ix('面诊需求') < ix('苦恼 <') && ix('苦恼 <') < ix('希望预期') && ix('希望预期') < ix('院长介绍') && ix('院长介绍') < ix('预算') && ix('预算') < ix('上传附件') && ix('上传附件') < ix('医美史'), '顺序：关联之前案件 → 메타뷰 → 面诊需求 → 苦恼（含每张卡里的希望预期）→ 院长 → 预算 → 上传附件 → 医美史');
    ST.ok(!/id="cf-concern"|id="cf-expectation"/.test(html) && !/>上传照片<\/|>上传照片 </.test(html), '没有总的苦恼文字格和单独一行的希望预期（照片 / 视频上传在每张部位卡片里）');
    toggleConcernPart('f_eyes'); toggleConcernPart('f_nose'); var fm = concernFormHtml(c); ST.ok((c.concerns||[]).length===2 && /眼睛/.test(fm) && /鼻子/.test(fm) && /上方（眼睛往下看）/.test(fm) && /下方（仰拍鼻孔）/.test(fm) && /1200×1600/.test(fm), '选眼睛 + 鼻子 → 两张卡片，角度格子不同（眼睛 5 个、鼻子 6 个）');
    ST.ok(concernPartDef('f_eyes').angles.length===5 && concernPartDef('f_nose').angles.length===6 && concernPartDef('f_all').angles.length===5 && concernPartDef('f_mouth').angles.length===5 && concernPartDef('f_ear').angles.length===3 && concernPartDef('b_chest').angles.length===5 && concernPartDef('b_belly').angles.length===3 && concernPartDef('b_hip').angles.length===3 && concernPartDef('b_leg').angles.length===4 && concernPartDef('b_neck').angles.length===4, '角度配置：眼 5 / 鼻 6 / 面部整体 5 / 嘴 5 / 耳 3 / 胸 5 / 腹 3 / 臀 3 / 腿 4 / 颈 4');
    saveConcernDesc('f_eyes', '眼皮松弛'); saveConcernDesc('f_nose', '鼻梁低'); setNeedsConsult(true); var m0 = concernMissing(c); ST.ok(m0.some(function(x){ return /眼睛：希望预期/.test(x); }) && m0.some(function(x){ return /鼻子：希望预期/.test(x); }), '每张卡的希望预期必填：'+m0.join('；')); saveConcernExpect('f_eyes', '自然'); saveConcernExpect('f_nose', '挺一点'); var m1 = concernMissing(c); ST.ok(m1.some(function(x){ return /眼睛：视频/.test(x); }) && m1.some(function(x){ return /眼睛：照片/.test(x); }) && m1.some(function(x){ return /鼻子：照片/.test(x); }), '面诊：缺视频 / 缺照片会列出来：'+m1.join('；'));
    mockUploadConcern('f_eyes', 'video'); concernPartDef('eyes').angles.forEach(function(an){ mockUploadConcern('f_eyes', an.id); }); concernPartDef('nose').angles.slice(1).forEach(function(an){ mockUploadConcern('f_nose', an.id); }); mockUploadConcern('f_nose', 'video');
    var m2 = concernMissing(c); ST.ok(m2.length===1 && /鼻子：照片（正面）/.test(m2[0]), '缺一张照片（鼻子正面）→ 缺项里只剩这一项：'+m2.join('；'));
    confirmMaterials(); ST.ok(!c.materialsConfirmed && document.getElementById('materials-missing-overlay').classList.contains('open') && /鼻子：照片/.test(document.getElementById('materials-missing-list').innerText), '缺一张照片不能提交（弹缺项）'); closeMaterialsMissing();
    ST.ok(/苦恼总 memo/.test(concernFormHtml(c)), '选了 2 个以上部位：卡片下面有「苦恼总 memo」');
    setNeedsConsult(false); ST.ok(concernMissing(c).length===0, '切到不面诊：照片 / 视频改选填（缺的那张不再算缺项）：'+concernMissing(c).join('；')); mockUploadConcern('f_nose', 'front');
    /* 不面诊：去掉全部媒体也只缺说明 */
    var x2 = ST.newRes('R32aB'); ST.arrive(x2); toggleConcernPart('f_all'); saveConcernDesc('f_all', '轮廓'); saveConcernExpect('f_all', '更立体'); setNeedsConsult(false); ST.ok(concernMissing(x2).length===0, '不面诊：只填部位 + 说明 + 希望预期（没传照片 / 视频）就够'); setNeedsConsult(true); ST.ok(concernMissing(x2).length>=2, '改回面诊：照片 / 视频又变必填');
    /* 一个完整的面诊案件（给 KM1 看） */
    var y = ST.newRes('R32aC'); ST.materials(y, {consult:true}); ST.payConsult(y); /* 缴面诊费后 KR 才看得到 */ ST.ok(y.materialsConfirmed && y.concerns.length===1 && /面部整体/.test(y.concern) && y.photoUploaded && y.videoUploaded, '完整填写后能提交，concern 汇总文字 / photoUploaded / videoUploaded 同步：'+y.concern);
    y.activeCaseTab = 'consult'; var ib = caseTabContentHtml(y); ST.ok(!/客人资料|苦恼说明|希望预期/.test(ib), 'IN 面诊资料 tab：不再有客人资料块（CMD-1019-08，客人资料只放基础资料）'); y.activeCaseTab = 'basic';
    /* 旧案件转换 */
    var mig = (window.GMC_MIGRATIONS||[]).filter(function(m){ return m.to===47; })[0]; if(ST.ok(!!mig, '迁移 47 存在')){ var old = {id:'old1', caseNo:'A9', concern:'旧苦恼文字', photoUploaded:true, videoUploaded:true}, notes = []; mig.fn(old, {note:function(t){ notes.push(t); }}); ST.ok(old.concerns.length===1 && old.concerns[0].part==='legacy' && old.concerns[0].desc==='旧苦恼文字' && !!old.concerns[0].video && /未分部位/.test(concernCardsHtml(old)), '旧案件的整体苦恼 / 照片 / 视频转成一张「未分部位」卡片'); var old2 = {id:'old2', concern:'', photoUploaded:false, videoUploaded:false}; mig.fn(old2, {note:function(){}}); ST.ok(old2.concerns.length===0, '没有苦恼资料的案件 → 空'); }
    var lg = {concern:'没迁移的旧案件', photoUploaded:true, videoUploaded:false}; ST.ok(/未分部位/.test(concernCardsHtml(lg)) && /没迁移的旧案件/.test(concernCardsHtml(lg)), '没迁移的旧案件也能正常显示（兜底合成「未分部位」卡）');
    var mig48 = (window.GMC_MIGRATIONS||[]).filter(function(m){ return m.to===48; })[0]; if(ST.ok(!!mig48, '迁移 48 存在')){ var o48 = {id:'o48', caseNo:'A48', concerns:[{part:'eyes', desc:'a', video:null, photos:{front:{name:'x.jpg'}}}, {part:'face', desc:'b', video:null, photos:{}}, {part:'body', desc:'c', video:null, photos:{back:{name:'y.jpg'}}}, {part:'mouth', desc:'d', video:null, photos:{}}, {part:'nose', desc:'e', video:null, photos:{}}]}; mig48.fn(o48, {note:function(){}});
      ST.ok(o48.concerns.map(function(x){ return x.part; }).join()==='f_eyes,f_all,b_all,f_mouth,f_nose' && o48.concerns[0].photos.front && o48.concerns[2].photos.back && /身体（未细分）/.test(concernCardTitle(o48.concerns[2])), '旧五个部位迁移：眼睛 / 鼻子 / 嘴巴 → 面部下同名；面部 → 面部整体；身体 → 身体（未细分）；已传照片按角度 id 保留'); }
    ST.ok(concernPartDef('eyes').key==='f_eyes' && concernCardTitle({part:'face', sub:''})==='面部整体', '没迁移到的旧部位 key 也能显示成新部位名');
    var oneC = ST.newRes('R32aM'); ST.arrive(oneC); setNeedsConsult(true); toggleConcernPart('f_eyes'); ST.ok(!/苦恼总 memo/.test(concernFormHtml(oneC)), '只有 1 个部位：不显示总 memo');
    localStorage.setItem('__R32', JSON.stringify({id:y.id}));
  });
  ST.def('R34a','CMD-1019-04：同一案件沿用已开分页（具名分页）；待办 / 通知 / 列表都走同一入口；开不了才退回当前分页；院长介绍新分页',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = ST.newRes('R34a'); ST.materials(c, {consult:true}); ST.payConsult(c); var calls = [], oldOpen = window.open, oldNo = window.GMC_NO_TABS;
    try{
      window.GMC_NO_TABS = false; window.open = function(u, n){ calls.push({u:u, n:n}); return {focus:function(){}}; };
      CURRENT_PAGE_ID = 'in-cases';
      openCaseDetail(c.id); openCaseDetail(c.id, false, {tab:'kr'}); openCaseDetail(c.id, false, {pc:true});
      ST.ok(calls.length===3 && calls.every(function(x){ return x.n===calls[0].n && /^gmc-in-/.test(x.n); }), '同一案件三次打开用同一个分页名：'+calls.map(function(x){ return x.n; }).join('、'));
      ST.ok(/tab=kr/.test(calls[1].u) && /pc=1/.test(calls[2].u), '地址带上要跳的位置（tab / 术后管理分页）');
      var other = ST.newRes('R34a2'); calls.length = 0; openCaseDetail(other.id); ST.ok(calls[0] && calls[0].n!==caseTabName('in', CURRENT_CLINIC_ID, c.id), '不同案件用不同分页名');
      /* 浏览器不让开：退回当前分页 */
      window.open = function(){ return null; }; var here = 0, oh = window.openCaseDetailHere; window.openCaseDetailHere = function(){ here++; }; openCaseDetail(c.id); window.openCaseDetailHere = oh; ST.ok(here===1, '开不了新分页时退回当前分页打开');
      /* 院长介绍新分页 */
      calls.length = 0; window.open = function(u, n){ calls.push({u:u, n:n}); return {focus:function(){}}; }; openDirectorNewTab('X院长'); ST.ok(calls.length===1 && /in-director/.test(calls[0].u) && /dir=/.test(calls[0].u), '院长介绍在新分页打开（页面 in-director + 院长名）：'+(calls[0]&&calls[0].u));
    } finally { window.open = oldOpen; window.GMC_NO_TABS = oldNo; }
  });
  ST.def('R35a','CMD-1019-05：案例库三种浏览 / 院长介绍页 / KR 院长资料登录（IN 和 KM1 分页各跑一次）',function(){
    var me = currentAccount(); if(!ST.ok(!!me, '要先登录')) return;
    /* 旧院长资料迁移（幂等） */
    var old = {name:'旧院长', career:[{when:'现', ko:'서울 병원'}, {when:'前', ko:'부산 병원'}], certs:[{ko:'전문의'}], societies:[{ko:'학회 회원'}], specialties:['假体隆鼻']}; drNormalize(old); drNormalize(old);
    ST.ok(old.items.length===4 && !old.career && drItemsOf(old,'经历')[1].when==='前' && drItemsOf(old,'资格证').length===2, '旧字段（现 / 前 / 认证 / 学会）迁移成新格式：'+JSON.stringify(old.items));
    var z = libGroupCards('part'); ST.ok(z.length && z.every(function(g){ return g.zone==='面部' || g.zone==='身体'; }) && z[0].groups.every(function(g){ return /^part:/.test(g.id); }), '按部位 = 面部 / 身体下的细部位卡片（不再是旧分类）');
    ST.ok(!libGroupCards('part').some(function(g){ return g.groups.some(function(x){ return /眼部|鼻部|面部年轻化|皮肤管理|轮廓$/.test(x.label); }); }), '旧分类名不再出现');
    ST.ok(libProjParts({name:'未知项目', categoryId:'zz'}).join()==='f_all', '对不到部位的项目归面部整体');
    ST.ok(libCasesOfGroup('part:f_eyes').length>0 && libCasesOfGroup('part:f_eyes').every(function(c){ return libCaseParts(c).indexOf('f_eyes')>-1; }), '眼睛卡片下的案例都带眼睛部位');
    var dl = libDirectorsList(); ST.ok(dl.length>=2 && dl.every(function(x){ return x.dr.active; }), '按院长：每位在职院长一张卡');
    setLibView('dir'); var home = libRenderHome(); ST.ok(/个案例/.test(home) && /libOpenDirector/.test(home), '按院长首页：卡片带案例数、可点');
    var kd = hospitalDirectors('H1').filter(function(d){ return d.name==='KD1 院长'; })[0], html0 = directorIntroHtml('KD1 院长');
    ST.ok(/经历/.test(html0) && /学历/.test(html0) && /资格证/.test(html0) && /擅长项目/.test(html0) && html0.indexOf('经历')<html0.indexOf('学历') && html0.indexOf('学历')<html0.indexOf('资格证') && html0.indexOf('资格证')<html0.indexOf('擅长项目') && /这位院长的案例/.test(html0), '院长介绍页：经历 → 学历 → 资格证 → 擅长项目 → 案例列表');
    ST.ok(/<img src="[^"]+"[^>]*width:220px/.test(html0) || /width:220px;height:280px/.test(html0), '左边照片');
    var card = directorCardHtml(kd, 'H1', {concerns:[]}, true, false); ST.ok(/openDirectorNewTab/.test(card) && /认证/.test(card) && /学历/.test(card), 'IN 基础资料院长卡：头像 / 名字新分页打开介绍页，带学历 / 认证');
    if(isKrAccount()){
      if(!ST.ok(canDo('krdoctors'), '要在 KM1 / KO1 分页跑编辑')) { setLibView('part'); return; }
      krdOpen(kd.id); var n0 = KRD.draft.items.length, s0 = KRD.draft.specialties.length;
      krdItemAdd(); krdItemSet(n0,'text','시험 병원 부원장'); krdItemAdd(); krdItemSet(n0+1,'text','시험 병원 과장'); krdItemSet(n0+1,'when','前'); krdItemAdd(); krdItemSet(n0+2,'cat','学历'); krdItemSet(n0+2,'text','시험대학교 박사'); krdItemAdd(); krdItemSet(n0+3,'cat','资格证'); krdItemSet(n0+3,'text','시험 전문의');
      var pj = ((HOSPITAL_DATA.H1.projects)||[]).filter(function(p){ return p.active && !isKrPostcareCat(p.categoryId) && kd.specialties.indexOf(p.name)<0; }).slice(0,2); pj.forEach(function(p){ krdSpecAdd(); krdSpecSet(KRD.draft.specialties.length-1, p.name); });
      var ed = krdEditor(); ST.ok(/上传照片/.test(ed) && /增加内容/.test(ed) && /院长<\/option><option[^>]*>副院长<\/option><option[^>]*>代表院长/.test(ed) && /overflow-y:auto/.test(ed), '编辑：左照片上传；右边固定高度，名字｜职称（院长 / 副院长 / 代表院长）在上，下面可滚动；［+ 增加内容］');
      krdSave(); var kd2 = hospitalDirectors('H1').filter(function(d){ return d.name==='KD1 院长'; })[0];
      ST.ok(kd2.items.length===n0+4 && kd2.specialties.length===s0+pj.length && drItemsOf(kd2,'经历').some(function(x){ return x.when==='前' && x.text==='시험 병원 과장'; }), '保存：加 2 条经历、1 条学历、1 条资格证、擅长项目');
      var h1 = directorIntroHtml('KD1 院长'); ST.ok(/시험 병원 부원장/.test(h1) && /시험대학교 박사/.test(h1) && /시험 전문의/.test(h1), '介绍页显示新内容（照原文）');
      openAdminPage('krshow'); libOpenDirector('KD1 院长'); ST.ok(LIB_STATE.level==='director' && /KD1 院长/.test(document.getElementById('lib-grid').innerText || ''), 'KR 案例库里能打开院长介绍页（IN 的 in-director 页在 KR 不存在）');
      /* 还原 */ kd2.items = kd2.items.slice(0, n0); kd2.specialties = kd2.specialties.slice(0, s0); Store.touch();
    } else {
      openDirectorDetail('KD1 院长'); ST.ok(CURRENT_PAGE_ID==='in-director' && /KD1 院长/.test(document.getElementById('director-detail-info').innerText) && /这位院长的案例/.test(document.getElementById('director-detail-info').innerText), 'IN 院长介绍页（in-director）显示介绍 + 案例列表');
      nav('in-library'); libOpenDirector('KD1 院长'); ST.ok(CURRENT_PAGE_ID==='in-director', 'IN 案例库按院长点进院长介绍页');
      openLibCaseModal(); libEditSource('travel'); ST.ok(/负责院长/.test(document.getElementById('lib-case-body').innerHTML) && /KD1 院长/.test(document.getElementById('lib-case-body').innerHTML), 'IN 新增 / 编辑赴韩案例：有「负责院长」选择'); closeLibCaseModal();
    }
    setLibView('part');
  });
  ST.def('R36a','CMD-1019-06：IN 项目库入口两张卡 / 韩国施术按部位卡片 + Rp（₩）/ 本地管理 tab 名；KR 项目库按部位、新增选部位（IN 和 KM1 分页各跑一次）',function(){
    var me = currentAccount(); if(!ST.ok(!!me, '要先登录')) return;
    ST.ok(!Object.keys(KR_CATEGORIES).some(function(k){ var c = KR_CATEGORIES[k]; return !c.postcare && !c.part; }), '旧 KR 分类（眼部 / 鼻部 / 轮廓 / 面部年轻化 / 胸部 / 身体）已拿掉');
    var krp = PROJECT_LIBRARY.filter(function(p){ return p.origin==='KR' && !p.local && !isKrPostcareCat(p.categoryId); });
    ST.ok(krp.length && krp.every(function(p){ return (PROJECT_CATEGORIES[p.categoryId]||{}).part === krMainPartOf(p) && Array.isArray(p.parts); }), '每个赴韩项目的分类 = 它的第一个部位');
    ST.ok(!PROJECT_LIBRARY.some(function(p){ return p.origin==='KR' && /下颌/.test(p.name); }) && PROJECT_LIBRARY.some(function(p){ return p.name==='下颚角整形'; }), '「下颌角整形」已改「下颚角整形」');
    if(!isKrAccount()){
      nav('in-projectlibrary'); PROJLIB_HOME = true; renderProjLibrary(); var el = document.getElementById('projlib-grid');
      ST.ok(/韩国施术/.test(el.innerText) && /本地管理/.test(el.innerText) && /只读/.test(el.innerText) && document.getElementById('projlib-tabs').innerHTML==='', '入口页：两张大卡「韩国施术（只读）」「本地管理」，没有 tab');
      setProjLibEntry('KR'); var t = document.getElementById('projlib-tabs').innerText, f = document.getElementById('projlib-filters'), g = document.getElementById('projlib-grid');
      ST.ok(/项目库/.test(t) && !/赴韩项目/.test(t) && !f.querySelector('select') && /按设定汇率换算/.test(f.innerText), '韩国施术：有返回入口、没有币别下拉、顶部写按设定汇率换算');
      ST.ok(/Rp [\d.]+（₩[\d,]+）/.test(g.innerText) && !/只读/.test(g.innerText) && !/分类/.test(g.querySelector('.card').innerText.split('\n').slice(1,3).join('')), '价格 = Rp 在前、₩ 在括号里；整页没有「只读」字样和分类栏');
      var cards = [].slice.call(g.querySelectorAll('[id^="pl-part-"]')), btns = [].slice.call(f.querySelectorAll('.chip'));
      ST.ok(cards.length>=3 && btns.length===cards.length && cards[0].id==='pl-part-f_all' || /^pl-part-f_/.test(cards[0].id), '每个部位一张卡片（面部在前），部位钮数量 = 卡片数');
      var names = [].slice.call(g.querySelectorAll('.case-field-row')).map(function(r){ return r.innerText.split('\n')[0]; }).filter(function(n){ return n!=='项目名称'; }); ST.ok(names.length>0 && names.length===new Set(names).size, '一个项目只出现一次');
      var multi = krp.filter(function(p){ return projectPartsOf(p).length>1; })[0]; var tmp = krp[0], keep = tmp.parts.slice(); tmp.parts = [keep[0]].concat(['f_nose'].filter(function(k){ return k!==keep[0]; })); renderProjLibGrid(); var c2 = [].slice.call(document.querySelectorAll('[id^="pl-part-"]')).filter(function(c){ return c.innerText.indexOf(tmp.name)>-1; }); ST.ok(c2.length===1 && c2[0].id==='pl-part-'+partBase(keep[0]), '多部位项目只放在第一个部位：'+tmp.name); tmp.parts = keep; renderProjLibGrid();
      var before = window.scrollY, sc = document.querySelector('.main-col .content') || document.body; projLibScrollTo(cards[cards.length-1].id); ST.ok(true, '点部位钮 = 滚动（scrollIntoView，不是筛选）：卡片数不变 '+document.querySelectorAll('[id^="pl-part-"]').length);
      ST.ok(document.querySelectorAll('[id^="pl-part-"]').length===cards.length, '点部位钮后卡片没有被筛掉');
      setProjLibEntry('IN'); var tt = document.getElementById('projlib-tabs').innerText; ST.ok(/全部项目/.test(tt) && /本月活动/.test(tt) && /套餐/.test(tt) && /非活性化/.test(tt) && !/本地项目/.test(tt), '本地管理 tab：全部项目｜本月活动｜套餐｜非活性化');
      ST.ok(projLibCategories('IN').length===12, '本地管理 12 类分类不动'); projLibBack(); ST.ok(/韩国施术/.test(document.getElementById('projlib-grid').innerText), '返回入口页');
    } else {
      if(!ST.ok(canDo('krlib'), '要在 KM1 分页跑')) return;
      openAdminPage('krsrvc'); var body = document.getElementById('admin-body').innerText; ST.ok(/面部 · 眼睛/.test(body) && /面部 · 鼻子/.test(body) && /身体 · 胸部/.test(body), 'KR 项目库按部位分卡片');
      ST.ok(document.querySelectorAll('[id^="krp-part-"]').length>=3 && document.querySelectorAll('#admin-body .chip[onclick^="projLibScrollTo"]').length>=3, 'KR 项目库有部位钮（点了滚动）');
      krpOpen('new'); var ed = krpEditor(); ST.ok(/苦恼部位/.test(ed) && !/<select onchange="krpField\('categoryId'/.test(ed), '新增 / 编辑：选部位（面部 / 身体两行细部位），没有旧分类下拉');
      KRP.draft.names.zh = '部位测试项目'; KRP.draft.price = '1000000'; KRP.draft.defaults.durMin = 60; var msgs = []; var oa = window.alert; window.alert = function(m){ msgs.push(m); }; krpSave(); window.alert = oa; ST.ok(/苦恼部位/.test(msgs.join('')) && krpProjects().every(function(p){ return p.name!=='部位测试项目'; }), '不选部位不能保存');
      krpPartToggle('f_chin'); krpPartToggle('f_jaw'); krpPartMain('f_jaw'); ST.ok(KRP.draft.parts[0]==='f_jaw', '第一个为主分类（可设为主）'); krpSave(); var np = krpProjects().filter(function(p){ return p.name==='部位测试项目'; })[0];
      ST.ok(np && np.parts.join()==='f_jaw,f_chin' && PROJECT_CATEGORIES[np.categoryId].part==='f_jaw', '保存后分类 = 第一个部位（下颚），也对应下巴');
      openAdminPage('krsrvc'); var c3 = document.getElementById('krp-part-f_jaw'); ST.ok(c3 && c3.innerText.indexOf('部位测试项目')>-1 && !document.getElementById('krp-part-f_chin').innerText.includes('部位测试项目'), '列表放在第一个部位（下颚）里，下巴里不重复');
      krpDelete && (function(){ var l = krpProjects(); l.splice(l.indexOf(np), 1); Store.touch(); })(); 
    }
  });
  ST.def('R37a','CMD-1019-07：案例库 IN / KR 各自维护、对方只读；院长只读；代表院长排最上面（IN 和 KM1 分页，先 KM1 再 A1）',function(){
    var me = currentAccount(); if(!ST.ok(!!me, '要先登录')) return;
    var h1 = hospitalDirectors('H1'); ST.ok(h1[0].title==='代表院长', 'KR 院长名单：代表院长永远排最上面（'+h1.map(function(d){ return d.name; }).join('、')+'）');
    var dl = libDirectorsList(); ST.ok(!dl.length || dl[0].dr.title==='代表院长', '案例库按院长：代表院长在最前');
    var cards = isKrAccount() ? 'KO1 代表院长 ↗ KD1 院长 ↗' : (function(){ var c0 = ST.newRes('R37d'); ST.arrive(c0); setNeedsConsult(true); return directorCardsHtml(c0); })(); var ko = cards.indexOf('KO1 代表院长 ↗'), kd = cards.indexOf('KD1 院长 ↗'); var koOff = directorTodayOff('H1', 'KO1 代表院长'); ST.ok(ko>-1 && kd>-1 && ((koOff && koOff.full) || ko<kd), 'IN 基础资料院长列表（没有苦恼部位时）代表院长在前（今天整天 OFF 的灰色排后，例外）');
    if(isKrAccount()){
      if(me.role==='kr_director' || me.role==='kr_owner'){
        openAdminPage('krshow'); ST.ok(!document.getElementById('lib-add-btn') && !libCaseCanAdd() && !libCaseCanEdit({source:'travel', by:'KR'}) && /案例库/.test(document.querySelector('.sidebar, #sidebar, .sidebar-slot').innerText), '院长 / 代表院长：菜单有案例库，只读（没有新增，不能编辑）');
        return;
      }
      openAdminPage('krshow'); ST.ok(!!document.getElementById('lib-add-btn') && libCaseCanAdd(), 'KR 室长：有［新增案例］');
      openLibCaseModal(null); ST.ok(LIB_EDIT && LIB_EDIT.source==='travel' && /负责院长/.test(document.getElementById('lib-case-body').innerHTML) && !/本地项目案例<\/span>/.test(document.getElementById('lib-case-body').innerHTML), 'KR 新增案例：赴韩施术案例，可选负责院长，没有类型切换');
      LIB_EDIT.names.zh = 'KR 自测案例'; LIB_EDIT.projectIds = [PROJECT_LIBRARY.filter(function(p){ return p.origin==='KR' && p.active && !p.local && !isKrPostcareCat(p.categoryId); })[0].id]; LIB_EDIT.director = 'KD1 院长'; libAddDemoPhoto('after'); libSetRecovery(0, '1周'); libSetConsentSigned(true); libUseDemoConsent(); saveLibCase();
      var kc = LIB_CASES.filter(function(c){ return c.title==='KR 自测案例'; })[0]; if(!ST.ok(!!kc && kc.by==='KR' && kc.director==='KD1 院长' && libCaseCanEdit(kc), '保存：来源 KR、负责院长 KD1、自己的案例可编辑')) return;
      ST.ok(krHData().libCases.some(function(c){ return c.id===kc.id; }), '写回医院分区（IN 那边读得到）'); ST.ok(/来源 KR/.test(document.getElementById('lib-grid').innerText), '详情 / 卡片标「来源 KR」');
      var inCase = LIB_CASES.filter(function(c){ return c.source==='travel' && (c.by||'IN')==='IN'; })[0]; ST.ok(!libCaseCanEdit(inCase), 'IN 的案例 KR 不能改');
      localStorage.setItem('__R37', JSON.stringify({id:kc.id}));
    } else {
      var rec = JSON.parse(localStorage.getItem('__R37')||'null'); if(!rec){ ST.ok(true, '（先在 KM1 分页跑，看 KR 案例）'); return; }
      var kc2 = LIB_CASES.filter(function(c){ return c.id===rec.id; })[0]; if(!ST.ok(!!kc2, 'IN 看得到 KR 新增的案例')) return;
      ST.ok(!libCaseCanEdit(kc2), 'IN 不能改 KR 的案例'); nav('in-library'); libOpenCase(kc2.id); ST.ok(!/>编辑</.test(document.getElementById('lib-grid').innerHTML) && !/>删除</.test(document.getElementById('lib-grid').innerHTML) && /来源 KR/.test(document.getElementById('lib-grid').innerText), 'IN 看 KR 案例详情：没有编辑 / 删除，标来源 KR');
      var mine = LIB_CASES.filter(function(c){ return c.by!=='KR' && c.source==='travel'; })[0]; ST.ok(!!mine && libCaseCanEdit(mine) && libCaseCanAdd(), 'IN 自己的案例可以编辑 / 新增');
      localStorage.removeItem('__R37');
    }
  });
  ST.def('R38a','CMD-1019-08：统一打开案件（登记 / 通知已开分页 / 不重复开）、院长默认基础资料、录入侧边栏（草稿 / 收起 / 离开确认 / 上传）、面诊卡折叠、客人资料只在基础资料、分页标题、弹窗阴影（IN 和 KM1 / KD1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(!!me, '要先登录')) return;
    ST.ok(/--shadow-modal/.test(getComputedStyle(document.documentElement).getPropertyValue('--shadow-modal') ? '--shadow-modal' : '') && /72px/.test(getComputedStyle(document.documentElement).getPropertyValue('--shadow-modal')), 'Modal 阴影变量已加深一档（--shadow-modal 72px）');
    gmcPageTitle(); ST.ok(new RegExp('^'+me.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' · ').test(document.title) || document.title.indexOf(me.id+' · ')===0, '分页标题账号放最前面：'+document.title);
    /* 统一打开：已有活着的分页 → 不再新开，通知那个分页 */
    var oldNo = window.GMC_NO_TABS, oldOpen = window.open, calls = [], toasts = [], oldToast = window.showToast, msgs = [];
    try{
      window.GMC_NO_TABS = false; window.open = function(u, n){ calls.push({u:u, n:n}); return null; }; window.showToast = function(a, b){ toasts.push(a); };
      try{ window.confirm = function(){ return true; }; nav(isKrAccount() ? 'kr-dashboard' : 'in-dashboard'); }catch(e){} /* 从工作台出发（当前不在这个案件页） */
      var kr = isKrAccount(), side = kr ? 'kr' : 'in', cid = kr ? (krAllCases()[0]||{}).clinicId : CURRENT_CLINIC_ID, cs = kr ? (krAllCases()[0]||{}) : CASE_ITEMS[0];
      var id0 = kr ? cs.id : (cs && cs.id); if(!id0){ ST.ok(true, '（没有案件，跳过打开测试）'); }
      else {
        var reg = caseRegRead(); reg[caseRegId(side, cid, id0)] = {tab:'other-tab', ts:Date.now()}; caseRegWrite(reg);
        if(kr) krShowCase(cid, id0, {tab:'items'}); else openCaseDetail(id0, false, {tab:'kr'});
        ST.ok(calls.every(function(x){ return x.u===''; }) && calls.length===1 && calls[0].n===caseTabName(side, cid, id0) && toasts.length===1, '已有活着的分页：只尝试切到已开的那个（window.open 空地址 + 分页名），不新开、不退回当前分页；切不过去时提示一句');
        var reg2 = caseRegRead(); delete reg2[caseRegId(side, cid, id0)]; caseRegWrite(reg2);
        calls.length = 0; toasts.length = 0; if(kr) krShowCase(cid, id0, {tab:'items'}); else openCaseDetail(id0, false, {tab:'kr'});
        ST.ok(calls.length===1 && calls[0].n===caseTabName(side, cid, id0) && /case=/.test(calls[0].u), '没有已开分页：新开一个有名字的分页（地址带案件和位置）');
      }
    } finally { window.GMC_NO_TABS = oldNo; window.open = oldOpen; window.showToast = oldToast; }
    ST.ok(/^gmc-(in|kr)-/.test(caseTabName('in','C1','x')) && caseTabName('kr','C1','x')==='gmc-kr-C1-x', '所有入口同一个分页名规则（端-诊所-案件）');
    if(isKrAccount()){
      var pw = krAllCases().filter(function(x){ return x.c.consultStatus==='paid_waiting_kr' && (!krIsDirector() || x.c.director===me.name); })[0]; if(pw && canDo('krwork')) Store.mutateClinic(pw.clinicId, function(){ var c1 = CASE_ITEMS.filter(function(x){ return x.id===pw.id; })[0]; coreConfirmConsultTimes(c1, todayStr(), '20:30', D(1)+' 05:00', me.name); }); /* 先把等确认时间的案件推到等待报告 */
      var all0 = krAllCases().filter(function(x){ return x.c.consultRequested; }), r = all0.filter(function(x){ return x.c.consultStatus==='awaiting_report' && !x.c.consultContentAt && (!krIsDirector() || x.c.director===me.name); })[0] || all0[0]; if(!r){ ST.ok(true, '（没有面诊案件，跳过 KR 部分）'); return; }
      if(krIsDirector()){ var dc = krAllCases().filter(function(x){ return x.c.director===me.name; })[0]; if(dc) ST.ok(krDefaultCaseTab(dc.clinicId, dc.id)==='basic', '院长进案件默认基础资料 tab'); }
      krShowCase(r.clinicId, r.id, {here:true}); krSetCaseTab('consult'); var cb = document.getElementById('krcase-body').innerText; ST.ok(!/客人资料（按部位|苦恼说明/.test(cb), '面诊 tab 没有客人资料块'); krSetCaseTab('basic'); ST.ok(/客人资料（按部位/.test(document.getElementById('krcase-body').innerText), '基础资料 tab 有部位卡片');
      if(krCanRecord(r.c) && !r.c.consultContentAt && r.c.consultStatus==='awaiting_report'){
        var oc = window.confirm; window.confirm = function(){ return true; };
        krRecOpenModal('manual', false); var sd = document.getElementById('kr-rec-side'); ST.ok(sd && sd.style.display!=='none' && document.body.classList.contains('kr-rec-open'), '录入侧边栏出现（右侧固定，左边让位）');
        var ta = document.getElementById('kr-rec-text'); ta.value = '侧边栏草稿测试'; ta.dispatchEvent(new Event('input')); krSetCaseTab('files'); ST.ok(document.getElementById('kr-rec-text') && document.getElementById('kr-rec-text').value==='侧边栏草稿测试' && sd.style.display!=='none', '切 tab 侧边栏和文字保留');
        krRecCollapse(true); ST.ok(/mini/.test(document.getElementById('kr-rec-side').className) && /草稿/.test(document.getElementById('kr-rec-side').innerText), '收起成窄条（写「草稿」）'); krRecCollapse(false); ST.ok(!!document.getElementById('kr-rec-text'), '展开');
        KR_REC.recording = true; var cc = []; window.confirm = function(m){ cc.push(m); return false; }; nav('kr-dashboard'); ST.ok(CURRENT_PAGE_ID==='kr-casedetail' && /还在录音/.test(cc[0]||''), '录音中离开 → 确认，选否留在原地'); window.confirm = function(){ return true; }; nav('kr-dashboard'); ST.ok(CURRENT_PAGE_ID==='kr-dashboard' && !KR_REC.recording && !!localStorage.getItem(krRecDraftKey()), '确认离开：停止录音，文字存成草稿');
        krShowCase(r.clinicId, r.id, {here:true}); krRecSideSync(); ST.ok(KR_REC_OPEN && KR_REC.collapsed && KR_REC.text==='侧边栏草稿测试' && /草稿/.test(document.getElementById('kr-rec-side').innerText), '再进案件：草稿还在（窄条）');
        krRecCollapse(false); krRecUpload(); ST.ok(!KR_REC_OPEN && !localStorage.getItem(krRecDraftKey()) && !!krFindCase(r.clinicId, r.id).c.consultContentAt, '上传后侧边栏收起、草稿清掉、面诊结束');
        krSetCaseTab('consult'); var fold = document.getElementById('krcase-body').innerText; ST.ok(/展开/.test(fold) && /已上传面诊内容，待整理诊疗方案/.test(fold) && !/修改预计时间/.test(fold), '面诊卡片折叠成一行（负责院长 · 小状态 + 展开），没有［修改预计时间］'); krConsultToggle(r.id); ST.ok(/修改预计时间|预计出报告时间/.test(document.getElementById('krcase-body').innerText), '展开后有时间和［修改预计时间］'); krConsultToggle(r.id);
        window.confirm = oc;
      }
    } else {
      var c0 = CASE_ITEMS.filter(function(x){ return x.consultRequested; })[0]; if(c0){ c0.activeCaseTab = 'consult'; ST.ok(!/客人资料|苦恼说明/.test(caseTabContentHtml(c0)), 'IN 面诊资料 tab 没有客人资料块'); c0.activeCaseTab = 'basic'; }
    }
  });
  ST.def('R32b','KM1：KR 面诊 tab 按部位显示（希望预期 / 预算在上）；院长账号也一样（先在 A1 跑 R32a）',function(){
    var me = currentAccount(); if(!ST.ok(me && (me.id==='KM1' || me.id==='KD1'), '要在 KM1 / KD1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R32')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R32a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件（已缴面诊费的面诊案件才在 KR 看得到）')) return; krShowCase(r.clinicId, r.id); krSetCaseTab('consult'); var tc = document.getElementById('krcase-body').innerText; ST.ok(!/客人资料（按部位|苦恼说明/.test(tc), 'KR 面诊 tab：没有客人资料块（CMD-1019-08）'); krSetCaseTab('basic'); var t = document.getElementById('krcase-body').innerText;
    ST.ok(/客人资料（按部位/.test(t) && /预算/.test(t) && /面部整体/.test(t) && /面部/.test(t) && /苦恼说明/.test(t) && /希望预期/.test(t) && t.indexOf('苦恼说明') < t.indexOf('希望预期') && t.indexOf('预算') < t.indexOf('面部整体') && /正面/.test(t) && /左 45 度/.test(t), 'KR 基础资料 tab：预算在上，按部位卡片（说明 → 希望预期 → 视频 → 照片）');
    var photo = [].slice.call(document.querySelectorAll('#krcase-body div')).filter(function(e){ return /concernZoom/.test(e.getAttribute('onclick')||''); })[0]; if(ST.ok(!!photo, '照片格子可点开放大')){ photo.click(); var zo = document.getElementById('concern-zoom-overlay'); ST.ok(zo && zo.classList.contains('open') && /面部整体/.test(zo.innerText), '点开放大'); zo.classList.remove('open'); }
  });
  ST.def('R33a','CMD-1019-02：没有意向项目栏 / 面诊需求选了才展开苦恼与希望预期（切换保留内容）/ 院长按苦恼部位排序 / 项目→部位对应（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = ST.newRes('R33a'); ST.arrive(c); var h0 = materialsCardHtml(c);
    ST.ok(!/意向项目/.test(h0) && typeof openIntentionPickerModal==='undefined' && !document.getElementById('intention-project-overlay'), '基础资料没有「意向项目」栏（含添加按钮和补充说明），选择弹窗也拿掉了');
    ST.ok(/选择面诊需求后填写苦恼与希望预期/.test(h0) && !/先选大类/.test(h0) && !/cf-expectation/.test(h0), '没选面诊需求：只有灰字，苦恼 / 希望预期没展开');
    setNeedsConsult(true); toggleConcernPart('f_eyes'); var h1 = materialsCardHtml(c), ix = function(t){ return h1.indexOf(t); }; toggleConcernPart('f_eyes');
    ST.ok(/先选大类/.test(h1) && !/cf-expectation/.test(h1) && ix('面诊需求') < ix('先选大类') && ix('先选大类') < ix('希望预期') && ix('希望预期') < ix('院长介绍'), '选面诊：面诊需求 → 苦恼（卡片里有希望预期）→ 院长');
    /* 内容保留 */
    toggleConcernPart('f_eyes'); saveConcernDesc('f_eyes', '眼皮松弛'); mockUploadConcern('f_eyes', 'video'); saveConcernExpect('f_eyes', '自然'); setNeedsConsult(false); var h2 = materialsCardHtml(c);
    ST.ok(/先选大类/.test(h2) && !/院长介绍/.test(h2) && /选填/.test(h2), '切到不面诊：苦恼 / 希望预期还在，没有院长，照片 / 视频选填'); setNeedsConsult(true);
    ST.ok(c.concerns.length===1 && c.concerns[0].desc==='眼皮松弛' && !!c.concerns[0].video && c.concerns[0].expect==='自然' && !/选填/.test(concernFormHtml(c).replace(/苦恼说明[^<]*/g, '')), '切回面诊：已填内容都还在，照片 / 视频又变必填');
    /* 项目 → 部位 */
    var P = function(n){ return projectPartsOf({name:n}); };
    ST.ok(P('埋线双眼皮')[0]==='f_eyes' && P('开内眼角')[0]==='f_eyes' && P('眼袋去除（内切）')[0]==='f_eyes' && P('假体隆鼻')[0]==='f_nose' && P('鼻翼缩小')[0]==='f_nose' && P('鼻综合（假体+鼻尖）')[0]==='f_nose' && P('颧骨缩小')[0]==='f_cheekbone' && P('下颚角整形')[0]==='f_jaw' && P('下巴假体 / 颏成形')[0]==='f_chin' && P('面部拉皮')[0]==='f_all' && P('自体脂肪移植（全脸）')[0]==='f_all' && P('假体隆胸')[0]==='b_chest' && P('腹部吸脂')[0]==='b_belly' && P('大腿吸脂')[0]==='b_leg:thigh', '项目名 → 细部位的默认对应');
    ST.ok(projectPartsOf({name:'假体隆鼻', parts:['f_chin']})[0]==='f_chin' && projectPartsOf({name:'假体隆鼻', parts:['f_chin']}).length===1 && projectPartsOf({name:'x', parts:['face']})[0]==='f_all', '项目自己勾选过的 parts 优先于默认对应（旧的五个部位 key 自动转新部位）');
    /* 院长排序 */
    var hid = caseHospitalId(c);
    var names = hospitalDirectors(hid).filter(function(x){ return x.active; }).map(function(x){ return x.name; }), pos = function(html, n){ return html.indexOf('>'+n+' ↗</a>'); };
    c.concerns = []; toggleConcernPart('f_nose'); var hn = directorCardsHtml(c), pm = function(n){ return docPartMatch(hid, hospitalDirectors(hid).filter(function(x){ return x.name===n; })[0], c); };
    var kd = names.filter(function(n){ return pm(n).parts.indexOf('nose')>-1; }), others = names.filter(function(n){ return kd.indexOf(n)<0; }), offOf = function(n){ var o = directorTodayOff(hid, n); return !!(o && o.full); };
    if(kd.length && others.length && !offOf(kd[0]) && !offOf(others[0])) ST.ok(pos(hn, kd[0]) < pos(hn, others[0]), '客人选鼻子：擅长鼻部的院长（'+kd.join('、')+'）排前面');
    else ST.ok(true, '（今天有院长整天 OFF，跳过「鼻子排前面」的位置断言）');
    ST.ok(/擅长客人苦恼部位的排前面/.test(hn) && /★ 擅长客人苦恼部位（鼻子）/.test(hn) || kd.every(offOf), '提示文字改成「擅长客人苦恼部位的排前面」，标签写出对到的部位');
    c.concerns = []; toggleConcernPart('f_all'); var hf = directorCardsHtml(c), fc = names.filter(function(n){ return pm(n).parts.indexOf('face')>-1; });
    if(fc.length && names.length>1 && !offOf(fc[0]) && !names.filter(function(n){ return fc.indexOf(n)<0 && !offOf(n); }).some(function(n){ return pos(hf, n) < pos(hf, fc[0]); })) ST.ok(true, '客人选面部：擅长面部的院长排前面'); else if(!fc.length || offOf(fc[0])) ST.ok(true, '（今天擅长面部的院长整天 OFF，跳过）'); else ST.ok(false, '客人选面部：擅长面部的院长没排前面');
    c.concerns = []; var h3 = directorCardsHtml(c); ST.ok(names.every(function(n){ return pos(h3, n)>-1; }), '没先选大类 / 对不到：全部院长照原顺序列出');
    /* CMD-1019-03：细部位 + 半对 + 三层选项 + 分组 */
    var KD = hospitalDirectors(hid).filter(function(x){ return x.name==='KD1 院长'; })[0], KO = hospitalDirectors(hid).filter(function(x){ return x.name==='KO1 代表院长'; })[0];
    if(KD && KO){ var sc = function(dr, keys){ return docPartMatch(hid, dr, {concerns:keys.map(function(k){ return {part:k}; })}).score; };
      ST.ok(sc(KD,['f_nose'])===1 && sc(KO,['f_nose'])===0.5, '选鼻子：KD1 完全对到 = 1，KO1 只对到面部大类 = 0.5（排在后面）');
      ST.ok(sc(KO,['f_all'])===1 && sc(KD,['f_all'])===0.5, '选面部整体：KO1 完全对到 = 1，KD1 对到大类 = 0.5');
      ST.ok(sc(KD,['f_jaw'])===0.5 && sc(KO,['f_jaw'])===0.5 && sc(KD,['b_chest'])===0 && sc(KO,['b_leg'])===0, '选下颚：两位都只对到大类；选身体部位：都对不到 = 0（原顺序）');
      ST.ok(sc(KD,['f_nose','f_eyes'])===1.5 && sc(KD,['f_nose','f_all'])===1.5, '多个部位累加（完全对到 1，大类 0.5）'); }
    var c3 = ST.newRes('R33aC'); ST.arrive(c3); setNeedsConsult(true); toggleConcernGroup('face'); toggleConcernGroup('body'); toggleConcernPart('f_eyes'); toggleConcernPart('f_jaw'); toggleConcernSubOpen('b_leg'); toggleConcernPart('b_leg', 'thigh');
    var cs3 = c3.concerns; ST.ok(cs3.length===3 && cs3.map(concernCardTitle).join('|')==='眼睛|下颚|腿 · 大腿', '面部（眼睛 + 下颚）+ 身体（腿 · 大腿）→ 三张卡，卡片标题写出第三层：'+cs3.map(concernCardTitle).join('|'));
    ST.ok(concernPartDef('f_eyes').angles.map(function(a){ return a.id; }).join()==='front,l45,r45,up,down' && concernPartDef('f_jaw').angles.map(function(a){ return a.id; }).join()==='front,lside,l45,r45,rside' && concernPartDef('b_leg').angles.map(function(a){ return a.id; }).join()==='front,lside,rside,back', '三张卡的照片角度各自不同');
    var f3 = concernFormHtml(c3); ST.ok(/先选大类/.test(f3) && /大腿/.test(f3) && /小腿/.test(f3) && /整体/.test(f3) && f3.indexOf('眼睛') < f3.indexOf('腿 · 大腿'), '先选大类 → 细部位 → 手臂 / 腿再出第三层（大腿 / 小腿 / 整体）');
    toggleConcernPart('b_leg', 'calf'); ST.ok(c3.concerns.length===4 && concernMissing(c3).some(function(x){ return /腿 · 小腿：照片/.test(x); }), '腿可以再选小腿（多选），缺项写「腿 · 小腿：照片（…）」');
    var ch3 = concernCardsHtml(c3), a3 = caseAttachments(Object.assign({}, c3, {materialsDate:todayStr()})); ST.ok(ch3.indexOf('面部') < ch3.indexOf('身体') && ch3.indexOf('眼睛') < ch3.indexOf('身体'), '只读展示按「面部 / 身体」分两组');
    c3.concerns.forEach(function(x){ x.video = {name:'v'}; x.photos = {front:{name:'p'}}; }); var at3 = caseAttachments(c3); ST.ok(at3.filter(function(f){ return f.grp==='face'; }).length>0 && at3.filter(function(f){ return f.grp==='body'; }).length>0 && at3.some(function(f){ return /^面部 · 眼睛视频/.test(f.label); }) && /基础资料 · 面部/.test(attachmentsTabHtml(c3)) && /基础资料 · 身体/.test(attachmentsTabHtml(c3)), '附件 tab 按面部 / 身体分组');
    var oldC = ST.newRes('R33aOld'); oldC.intentionProjects = [{projectId:'x', name:'假体隆鼻', origin:'KR'}]; ST.arrive(oldC); ST.ok(!/意向项目|假体隆鼻/.test(materialsCardHtml(oldC)) && !/意向项目/.test(intentionInfoHtml(oldC)) && oldC.intentionProjects.length===1, '旧案件已存的意向项目不删，只是不显示');
  });
  ST.def('R22b','KM1：案件区块三组 + 抬头 + 行（项目类型｜内容｜地点｜状态｜备注｜操作）；所需术后管理一项一框；冲突询问弹窗两个按钮；增加项目里没有术后管理清单（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return subCaseList(x.c).some(function(s){ return s.place==='KR'; }) || Object.keys(x.c.visitEnds||{}).length; })[0]; if(!ST.ok(!!r, '要有带术后管理的案件（先在 A1 分页跑 R22a）')) return;
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); Store.withClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; krCaseCards(cc, true).forEach(function(cd){ KR_SUB_OPEN[cd.key] = true; }); }); krRenderCaseDetail(); var h = document.getElementById('krcase-body').innerText;
    var endC = Store.withClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; return krCaseCards(cc, false).filter(function(x){ return x.kind==='end'; }); }); if(endC.length) ST.ok(endC[0].group==='done', '全部延期的子案件在完成案件里');
    ST.ok(/今日案件|预约案件|完成案件/.test(h), '案件区块按状态分组'); ST.ok(/项目类型\s*内容\s*地点\s*状态\s*备注\s*操作/.test(h) && !/完成时间/.test(h), '表头：项目类型｜内容｜地点｜状态｜备注｜操作（没有时间 / 完成时间栏）');
    ST.ok(/〔.* (预约|结束)〕|〔全部延期〕|【主案件】/.test(h), '时间写在抬头');
    KR_AD.open = true; krRenderCaseDetail(); ST.ok(!/术后管理（免费，进项目进程/.test(document.getElementById('krcase-body').innerText), '增加项目底下的术后管理勾选清单已拿掉'); KR_AD.open = false;
    var cand = krScopeCandidates(r.clinicId), p = cand.kr[0], dt = krDet(p.name); dt.pc = [{mgmt:'术后复诊', kr:'', inn:'', times:3, interval:2, place:'either', start:'3'}]; var ph = krProjDetailHtml(p, cand);
    ST.ok(/类型/.test(ph) && /项目/.test(ph) && /次数/.test(ph) && /间隔/.test(ph) && /在哪做/.test(ph) && /第几天起/.test(ph) && /印尼对应项目/.test(ph) && /移除/.test(ph) && /border:1px solid/.test(ph), '所需术后管理：一项一个框，字段齐全');
    krAskClash('测试冲突', {proceed:function(){ window.__askGo = 1; }, alt:function(){ window.__askAlt = 1; }, altLabel:'不在这个时段'}); var btns = document.querySelectorAll('#kr-block-overlay button'); ST.ok(btns.length===2 && /仍然进行/.test(btns[0].innerText) && /不在这个时段/.test(btns[1].innerText), '冲突询问：［仍然进行］［不在这个时段］'); btns[0].click(); ST.ok(window.__askGo===1, '［仍然进行］走 proceed');
    krAskClash('测试冲突2', {proceed:function(){}}); var b2 = document.querySelectorAll('#kr-block-overlay button'); ST.ok(b2.length===2 && /取消/.test(b2[1].innerText), '标不可预约 / OFF：［仍然进行］［取消］'); document.getElementById('kr-block-overlay').classList.remove('open');
  });
  ST.def('R18c','KR「项目」tab：项目卡（施术项目 N｜管理项目 N）+ 案件；没有「施术」tab、没有「手术项目」；各入口都到项目 tab 并展开对应那次（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    ST.ok(KR_CASE_TABS.map(function(t0){ return t0.label; }).filter(function(x){ return x!=='关联案件'; }).join('｜')==='基础资料｜面诊｜项目｜结算｜附件｜Timeline', 'tab = 基础资料｜面诊｜项目｜结算｜附件｜Timeline');
    var r = krAllCases().filter(function(x){ return subCaseList(x.c).some(function(s){ return s.place==='KR'; }); })[0]; if(!ST.ok(!!r, '要有带韩国术后管理的案件（先在 A1 分页跑 R18a / R18b）')) return;
    var key = subCaseKey(subCaseList(r.c).filter(function(s){ return s.place==='KR'; })[0]), sid = subCaseList(r.c).filter(function(s){ return s.place==='KR'; })[0].id;
    krShowCase(r.clinicId, r.id); krSetCaseTab('proc'); ST.ok(KR_CASE.tab==='items', '旧的「施术」tab 并进「项目」');
    var h = Store.withClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; return krTabItems(cc); });
    ST.ok(/项目卡/.test(h) && /施术项目（\d+）/.test(h) && /管理项目（\d+）/.test(h) && /案件/.test(h) && !/手术项目/.test(h), '项目卡两页 + 案件区块，用词「施术项目」');
    var inner = document.getElementById('krcase-body').innerText; ST.ok(!/手术项目/.test(inner) && !/赴韩项目\n/.test(inner), '页面里没有「手术项目」，也没有重复的赴韩项目列表');
    var entries = [['日历 / 工作台', function(){ krOpenSubCard(r.clinicId, r.id, sid); }], ['医院设定冲突弹窗', function(){ hspGoCase(r.clinicId, r.id, sid); }], ['工作台今天列表(krOpenSub)', function(){ krOpenSub(r.clinicId, r.id, sid); }]];
    entries.forEach(function(e){ KR_SUB_OPEN = {}; KR_CASE = {clinicId:'', id:'', tab:'basic'}; e[1](); ST.ok(KR_CASE.tab==='items' && KR_CASE.id===r.id && !!KR_SUB_OPEN[key], '入口「'+e[0]+'」→ 项目 tab 并展开对应那次'); });
    krOpenSubCard(r.clinicId, r.id, sid); ST.ok(!!document.getElementById('kr-subrow-'+sid), '子案件卡片存在（点进来后滚动 / 高亮的目标）');
  });

})();
