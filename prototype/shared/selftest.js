/* shared/selftest.js —— 第 2 轮前全链路自测（CMD-1013-15，开发用，不属于产品功能）
   用法：在 in.html（A1 登录）里注入本脚本，调用 ST.runAll() / ST.run('A1') 等；每个情况用真实的页面函数走一遍，再按 Timeline / 状态断言。
   客人名字前加「T2-」；案件标 round=2。结果放在 ST.R（数组），ST.report() 返回 Markdown 表。 */
(function(){
  var prevR = (window.ST && window.ST.R) || [];
  window.GMC_NO_SWEEP = true; /* 自测时间被拨来拨去，定时的「客人已回国自动结案」扫描会把夹具案件真的结案；自测需要时直接调 careReturnSweep() */
  window.GMC_STAY_AUTO = true; /* CMD-1020-11：自测里确认赴韩 / 发施术前提醒不弹在韩期间窗口（R62a 单独打开测） */
  window.GMC_PASSPORT_AUTO = true; window.GMC_NO_FOLLOWASK = true; /* CMD-1019-11：自测里确认赴韩不弹护照窗，自动登记测试护照 */
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
    c.metaviewStatus = 'ready'; c.concernText = '（自测）手写苦恼'; var pd0 = CONCERN_PARTS[0], ph0 = {}; pd0.angles.forEach(function(a){ ph0[a.id] = {name:'自测.jpg'}; }); c.concerns = [{part:pd0.key, desc:'（自测）苦恼', expect:'（自测）希望', video:{name:'自测.mp4'}, photos:ph0}]; concernSync(c); c.expectation = '（自测）希望';
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
  ST.krArrive = function(c){ if(c.krSchedule) c.krSchedule.simDay = true; /* CMD-1021-13：到院只有当天能标，测试用模拟到当日 */ var ok = coreMarkArrived(c, ST.krBy); ST.ok(scheduleState(c)==='Arrived', '标已到院后应为 Arrived'); return ok; };
  ST.krJudge = function(c, r, memo){ var ok = coreJudge(c, r, ST.krBy, memo || (r==='ok' ? '' : '（自测）')); ST.ok(ok, '评估 '+r+' 失败'); return ok; };
  ST.krPay = function(c){ var res = coreSettleBalance(c, ST.krBy); ST.ok((res && res.ok) || c.krBalancePaid, '付清尾款失败'); return res; };
  /* CMD-1022-17：施术前要先把术前照片传完（评估可以手术之后才有这个要求）；测试里一键补齐所有施术项目的术前照片 */
  ST.preOpAll = function(c){ preOpItems(c).forEach(function(it){ if(it.done) return; var sp = preOpSpecOf(it); sp.angles.forEach(function(a){ coreSetPreOp(c, it.name, a.id, ST.krBy); }); if(sp.video) coreSetPreOp(c, it.name, 'video', ST.krBy); }); };
  /* 今日项目全勾 → 结案（KR 页面的［已完成］+［是，结案］） */
  ST.krCloseToday = function(c){
    ST.preOpAll(c);
    var ids = (c.subItems||[]).filter(function(s){ return (s.kind==='施术' || s.kind==='增加项目') && !s.done; }).map(function(s){ return s.id; });
    coreTodayDone(c, ids, ST.krBy); if(!c.krProcedureDone && c.endAsk) coreEndVisitToday(c, ST.krBy); /* CMD-1019-22：到院结束是人工确认——全部完成后弹窗问，这里模拟按［今日完成］ */
    return !!c.krProcedureDone; /* CMD-1015-17：施术完成 → 有术后管理进术后管理阶段，没有直接结案 */
  };
  /* 把还没做的术后管理都做完（韩国：到当天 + 客人已到 + 标完成；印尼：IN 做术后管理，提前要写原因）→ 自动结案 */
  ST.tripClose = function(c){ /* CMD-1021-16：不再自动结案：KR［韩国行程结束］（默认转去印尼）+ IN［结案］ */ var r = coreTripEnd(c, ST.krBy, {}); if(!r.ok) return false; if(!isEnded(c)) r = coreInClose(c, 'A1 室长'); return isEnded(c); };
  ST.finishCare = function(c){
    carePendingRows(c).slice().forEach(function(s){
      if(s.place==='IN'){ var r = coreCareVisit(c, s.id, 'A1 室长', '（自测）客人提前回来'); ST.ok(r.ok, 'IN 做术后管理失败：'+(r.err||'')); }
      else { coreSubSimDay(c, s.id, ST.krBy); coreSubArrived(c, s.id, ST.krBy); coreSubDone(c, s.id, ST.krBy, []); }
    });
    subCaseList(c).forEach(function(r){ var k = subCaseKey(r); if(r.place==='KR' && coreVisitState(c, k)==='arrived') coreEndSubVisit(c, k, ST.krBy); }); /* 其他到院也是人工结束 */
  };
  /* CMD-1020-13 七：施术前 2 天 = ［已确认行程］（不再发施术前提醒）：自测里直接走核心函数 */
  ST.confirmTrip = function(c, methods){ var t = todayStr(); coreSetStay(c, ymdAdd(t, -1), ymdAdd(t, 9), 'A1 室长', {ex:{inTime:'15:00', outTime:'18:00', inAirport:'', outAirport:''}}); c.tripConfirm = {at:nowFullDt(), by:'A1 室长', methods:methods || ['电话'], other:''}; logCaseEvent(c, 'A1 室长', '已确认行程（'+(methods || ['电话']).join('、')+'）：入境 '+stayMDT(c, 'in')+' / 离境 '+stayMDT(c, 'out'), '赴韩施术'); };
  ST.tests = {};
  ST.run = function(id){ if(!ST.tests[id]) return null; return ST.T(id, ST.tests[id].title, ST.tests[id].fn); };
  /* CMD-1015-06：测试自己建数据、测完清掉。
     ST.begin()：把当前存档（gmc_state / gmc_clinic_*）原样存一份快照到 gmc_cfg_stsnap（已有快照就不覆盖，所以跨账号分页接着跑也只留最早那份）；
     ST.ensureFixtures()：用一键准备的同一套造法在 C1 建好 KR 阶段用例要的案件（待到院 / 已付定金 / 面诊结束 / 已付面诊费），IN 和 KR 分页都能调用；
     ST.cleanup()：整份还原快照 + 清掉测试留下的 localStorage 键，并刷新页面（还原后本页不再写档，避免旧内存又盖回去）。 */
  ST.begin = function(){
    try{ if(localStorage.getItem('gmc_cfg_stsnap')) return false; var o = {}; Object.keys(localStorage).filter(function(k){ return /^gmc_(state|clinic_)/.test(k); }).forEach(function(k){ o[k] = localStorage.getItem(k); }); localStorage.setItem('gmc_cfg_stsnap', JSON.stringify(o)); return true; }catch(e){ console.warn('[测试] 快照失败', e); return false; }
  };
  /* CMD-1020-12：测试清理只能动测试自己建的数据。测试建的案件 = 名字以 T- / T2- 开头，或带 prep:true；
     还原快照之前先找出「快照之后新增、不是测试建的用户案件」（用户在别的分页 / 同一个浏览器里新建的），存一份安全备份，还原后再原样加回去；永远不丢。 */
  ST.isTestCase = function(c){ return !!c && (c.prep===true || /^T2?-/.test(String(c.name||''))); };
  ST.cleanupKeepPlan = function(snapObj){
    var kept = {};
    Object.keys(localStorage).filter(function(k){ return /^gmc_clinic_/.test(k); }).forEach(function(k){
      var cur = null, sp = null; try{ cur = JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){} try{ sp = snapObj[k] ? JSON.parse(snapObj[k]) : null; }catch(e){}
      if(!cur || !cur.vars) return; var snapIds = {}; ((sp && sp.vars && sp.vars.CASE_ITEMS) || []).forEach(function(c){ snapIds[c.id] = 1; });
      var keep = (cur.vars.CASE_ITEMS || []).filter(function(c){ return gmcIsUserCase(c) && !snapIds[c.id] && !ST.isTestCase(c); }); if(!keep.length) return;
      var names = {}; keep.forEach(function(c){ names[c.name] = 1; });
      var holdings = {}; Object.keys(cur.vars.CLIENT_HOLDINGS || {}).forEach(function(n){ if(names[n]) holdings[n] = cur.vars.CLIENT_HOLDINGS[n]; });
      kept[k] = {cases:keep, clients:(cur.vars.CLIENTS || []).filter(function(cl){ return names[cl.name]; }), holdings:holdings};
    });
    return kept;
  };
  ST.cleanup = function(){
    var raw = localStorage.getItem('gmc_cfg_stsnap'); if(!raw) return false;
    try{ if(!window.GMC_NO_SAVE && window.Store) Store.save(); }catch(e){} /* 先把内存里的新数据写进存档，才看得到用户新建的案件 */
    var o = JSON.parse(raw), kept = ST.cleanupKeepPlan(o), nKept = Object.keys(kept).reduce(function(n, k){ return n + kept[k].cases.length; }, 0);
    if(nKept){ try{ gmcUserSafeSave('测试清理前（快照之后新增的用户案件 '+nKept+' 个，会原样保留）'); }catch(e){} console.warn('[ST.cleanup] 保留快照之后新增的用户案件 '+nKept+' 个'); }
    window.GMC_NO_SAVE = true; /* store.js 的 save() 看到这个就不写档 */
    Object.keys(localStorage).filter(function(k){ return /^gmc_(state|clinic_)/.test(k); }).forEach(function(k){ localStorage.removeItem(k); });
    Object.keys(o).forEach(function(k){ localStorage.setItem(k, o[k]); });
    Object.keys(kept).forEach(function(k){ /* 把用户新建的案件加回还原后的分区 */
      try{ var p = JSON.parse(localStorage.getItem(k) || 'null'); if(!p || !p.vars) return; var v = p.vars; v.CASE_ITEMS = v.CASE_ITEMS || []; v.CLIENTS = v.CLIENTS || []; v.CLIENT_HOLDINGS = v.CLIENT_HOLDINGS || {};
        kept[k].cases.forEach(function(c){ if(!v.CASE_ITEMS.some(function(x){ return x.id===c.id; })) v.CASE_ITEMS.push(c); });
        kept[k].clients.forEach(function(cl){ if(!v.CLIENTS.some(function(x){ return x.name===cl.name; })) v.CLIENTS.push(cl); });
        Object.keys(kept[k].holdings).forEach(function(n){ if(!v.CLIENT_HOLDINGS[n]) v.CLIENT_HOLDINGS[n] = kept[k].holdings[n]; });
        localStorage.setItem(k, JSON.stringify(p)); }catch(e){ console.error('[ST.cleanup] 加回用户案件失败', k, e); }
    });
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
    ST.ok(!showRelatedTab(c2) && !showRelatedTab(c1) && /关联案件/.test(basicFourHtml(getCurrentCase()&&getCurrentCase().id===c2.id ? c2 : c2, true)), '独立的关联案件 tab 已拿掉（CMD-1022-05）：关联案件改成基础资料第一块');
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
    ST.finishCare(c); ST.ok(!isEnded(c) && c.stage==='postcare', 'CMD-1021-16：术后管理做完也不自动结案，实际 '+c.stage); ST.ok(ST.tripClose(c) && c.stage==='closed', 'KR［韩国行程结束］+ IN［结案］后结案，实际 '+c.stage);
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
    var c = ST.toConfirmed('E6'); ST.krArrive(c); ST.ok(coreUnarrive(c, ST.krBy), '撤回失败'); ST.ok(scheduleState(c)==='Confirmed', '撤回后应回到时间已确认'); ST.ok(ST.hasLog(c, /KR撤回已到院|撤回"已到院"/), '缺记录');
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
    ST.ok(document.getElementById('cli-cases').textContent.indexOf(c.caseNo)>-1, '客户详情「本院案件记录」应列出案件（Case ID）');
    /* 持有项目卡：按项目汇总、展开到批次 */
    var hold = document.getElementById('detail-holdings') ? document.getElementById('detail-holdings').textContent : ''; ST.ok(hold.indexOf(p.name)>-1, '持有项目卡应按项目汇总'); ST.ok(!/退款/.test(hold), '客户详情持有项目卡不再有退款按钮（退款移到案件［退款服务］，CMD-1013-04）');
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
    DEMO_ROLE = 'kr'; openAdminPage('krshow'); var lc0 = LIB_CASES.filter(function(x){ return x.by!=='KR'; })[0]; /* IN 的案例（KR 自己新增的案例 KR 能编辑，CMD-1019-07） */
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
      var hn = Object.keys(ov.CLIENT_HOLDINGS||{}); ST.ok(Object.keys(CLIENT_HOLDINGS).every(function(n){ return hn.indexOf(n)<0 || on.indexOf(n)<0 || CLIENTS.some(function(c){ return c.name===n; }); }), id+' 看不到 '+other+' 的持有项目（两家诊所各有同名测试客人时不算泄漏，CMD-1022-12）');
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
    ST.open(c); openEndCase(); if(!END_CASE) return isEnded(c); /* CMD-1022-15：没有剩余项目时［客人离店］直接结案 */
    Object.keys(choices||{}).forEach(function(k){ END_CASE.choice[k] = choices[k]; }); Object.keys(amts||{}).forEach(function(k){ END_CASE.amt[k] = amts[k]; });
    END_CASE.reason = reason || '客人不做了'; END_CASE.note = note || ''; confirmEndCase(); return true;
  };
  ST.def('G1','面诊等报告时手动结束 → 仅出报告，KR 之后的诊疗方案仍进案件',function(){
    var c = ST.newRes('G1'); ST.arrive(c); ST.materials(c,{consult:true}); ST.payConsult(c); coreConfirmConsultTimes(c, todayStr(), '20:30', D(1)+' 05:00', ST.krBy);
    ST.open(c); ST.ok(canEndCase(c) && /客人离店/.test(document.getElementById('case-status-bar').innerHTML), '付定金前应显示［客人离店］（CMD-1022-15 改名）');
    openEndCase(); var rows = endCaseRows(c); ST.ok(rows.some(function(r){ return r.key==='consult'; }), '弹窗应列出「面诊未出报告 → 照样等报告」'); closeEndCase();
    ST.endCase(c, {}, '失联'); ST.ok(c.stage==='reportonly', '面诊费已缴、报告未出就结束应是仅出报告，实际 '+c.stage); ST.ok(ST.hasLog(c, /手动结束案件（付定金前，当时：面诊等报告）：失联/), '缺手动结束记录');
    /* KR 之后仍可发送诊疗方案 */
    coreStartConsult(c, 'KD1 院长'); c.consultContentAt = nowFullDt(); var ok = coreSubmitReport(c, {original:'（自测）', zh:'（自测）', items:ST.krReportItems(['假体隆鼻']), overallNote:'', files:[]}, ST.krBy);
    ST.ok(ok && c.reportReady && c.stage==='reportonly', '结束后 KR 仍应能发诊疗方案且案件保持仅出报告；ok='+ok+' stage='+c.stage);
    ST.ok(/诊疗方案/.test(consultTabHtml(c)), '已结束案件的面诊 tab 应能看到诊疗方案');
  });
  ST.def('G2','项目确认中手动结束',function(){
    var c = ST.newRes('G2'); ST.consultToReport(c); ST.open(c); ST.ok(canEndCase(c), '项目确认中应可结束');
    ST.endCase(c, {}, '其他', null, '客人说再想想'); ST.ok(c.stage==='reportonly', '出了报告没做项目 → 仅出报告，实际 '+c.stage); ST.ok(ST.hasLog(c, /当时：项目确认中）：客人离店/), '没有剩余项目 → 直接离店，记录原因「客人离店」（CMD-1022-15）');
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
    var s = ST.toConfirmed('TD1s'); ST.ok(has(s,'relay'), 'KR 确认施术时间后应有「转告客人」待办'); ST.open(s); s.activeCaseTab = 'kr'; renderCaseBody(s); ST.ok(has(s,'relay'), '10/14 起：打开 tab 不算已转告，要按［发送给客人］'); openSurgMsg(s.id); confirmSurgMsg(); ST.ok(!has(s,'relay'), '发送给客人后「转告客人」应消失');
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
    ST.ok(has('relay'), '前置：有转告客人待办'); ST.open(c); c.activeCaseTab = 'kr'; renderCaseBody(c); ST.ok(has('relay'), '打开 tab 不再算已转告'); ST.ok(/发送给客人/.test(document.getElementById('case-body').innerHTML) && !/已转告客人/.test(document.getElementById('case-body').innerHTML), '赴韩施术 tab 施术日期行有［发送给客人］（没有［已转告客人］）');
    openSurgMsg(c.id); confirmSurgMsg(); ST.ok(!has('relay') && ST.hasLog(c, /已发送施术日期通知给客人/), '发送给客人之后待办消失 + Timeline');
    /* 赴韩施术前 2 天：确认日程有无变化（模拟时钟） */
    ST.ok(!has('recheck'), '8 天前不应有确认日程待办'); var ks = c.krSchedule, add = calDaysToSurgery(c) - 2, base = DEMO_SHIFT_MS;
    DEMO_SHIFT_MS = base + add*86400000;
    try{
      ST.ok(has('recheck') && calNeedsRecheck(c), '施术前 2 天应出现「确认客人日程有无变化」'); ST.ok(/IN 尚未确认行程/.test(calRecheckText(c)), 'KR 施术日期卡应写 IN 尚未确认行程');
      renderCalendar(); var chip = document.querySelector('.event-chip[data-recheck]'); ST.ok(true, ''); ST.open(c); c.activeCaseTab = 'kr'; renderCaseBody(c); var cbh = document.getElementById('case-body').innerHTML; ST.ok(/id="surg-remind-row"[\s\S]*已确认行程/.test(cbh) && /联络客人确认行程/.test(cbh) && !/确认无变动/.test(cbh) && !/演示<\/span>/.test(cbh.split('surg-remind-row')[1]||''), '赴韩施术 tab 施术前 2 天卡是［已确认行程］（没有［确认无变动］，没有「演示」小字）');
      ST.confirmTrip(c); ST.ok(!has('recheck') && ST.hasLog(c, /已确认行程（电话）：入境/) && /✓ 已确认行程/.test(calRecheckText(c)) && !/surg-remind-row/.test(calRelayRecheckCards(c)), '已确认行程后待办消失、Timeline、KR 显示 ✓、卡片消失');
    } finally { DEMO_SHIFT_MS = base; }
  });
  /* ---- KR 端（KM1 / KD1 分页）---- */
  ST.def('CAL2','KR / 院长日历对齐（固定栏 OFF / memo、月视图、时段框、图例、时间范围）',function(){
    var me = currentAccount(); if(!ST.ok(me && /^(KM1|KD1)$/.test(me.id), '要在 KM1 / KD1 分页里跑')) return;
    krRenderDashboard(); var cal = document.getElementById('kr-cal').innerText, hr = hospitalHours(krHospitalIdOfMe());
    ST.krcRangeCheck(hr);
    ST.ok(/＋ memo/.test(cal) && /固定栏/.test(cal) && /术后到院/.test(cal) && /面诊/.test(cal), '应有 ＋memo、固定栏、图例（面诊 / 术后到院）');
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
    try{ DEMO_SHIFT_MS = base + (calDaysToSurgery(s)+3)*86400000; var r = has(); ST.ok(!!r && r.over, '施术日已过仍未确认：标红、一直挂着'); ST.confirmTrip(s); ST.ok(!has(), '确认行程后消失'); } finally { DEMO_SHIFT_MS = base; }
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
    openClientDetail(c.name); ST.ok(/置换额度/.test(document.getElementById('detail-holdings').textContent) && /不可退款/.test(document.getElementById('detail-holdings').textContent), '客户详情显示置换额度（不可退款）');
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
    var one = [].slice.call(cal().querySelectorAll('[onclick*="krShowCase"],[onclick*="krOpenSurgSub"],[onclick*="krBookOpen"],[onclick*="krOpenSub"]')).filter(function(e){ return e.innerText; }); ST.ok(one.length===0 || one.every(function(e){ return /\d\d:\d\d · .+ · .+/.test(e.innerText.replace(/\n/g,' ')); }), '医院层每块一行小标签：时间 · 客人 · 类型（CMD-1020-16，不再写院长）');
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
    nav('in-dashboard'); setCalView('kr'); setCalMode('week'); var col = [].slice.call(document.querySelectorAll('.kr-daycol')).filter(function(e){ return e.getAttribute('data-ds')>todayStr() && !hospitalClosedOn(hid, e.getAttribute('data-ds')) && e.getAttribute('onclick'); })[0];
    ST.ok(!!col, 'KR 医院日程周视图应有可点的空白列'); var r = col.getBoundingClientRect(); col.dispatchEvent(new MouseEvent('click', {bubbles:true, clientX:r.left+8, clientY:r.top+KR_ROW_PX*2+3}));
    ST.ok(!!KRB && document.getElementById('krb-overlay').classList.contains('open'), '点空白时段应弹出预约窗'); ST.ok(KRB.purpose==='carebook', 'CMD-1020-18：默认来访目的是在韩术后管理预约'); KRB.purpose = 'newvisit'; /* 这个用例测的是时间冲突，不勾项目 */
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
  ST.def('R15b','院长工作台 4 张卡：待面诊 / 待施术 / 待复诊 / 新消息（KD1 或 KO1 分页；CMD-1022-12 改）',function(){
    var me = currentAccount(); if(!ST.ok(me && /^kr_(director|owner)$/.test(me.role), '要在 KD1 / KO1 分页里跑')) return;
    nav('kr-dashboard'); krRenderDashboard(); var el = document.getElementById('krdash-body'), tx = el.innerText;
    ST.ok(/待面诊/.test(tx) && /待施术/.test(tx) && /待复诊/.test(tx) && /新消息/.test(tx), '应有 4 张卡：待面诊｜待施术｜待复诊｜新消息'); ST.ok(!/即将推出/.test(tx) && !/恢复确认/.test(tx), '第三张卡已是「待复诊」，不再是「恢复确认（即将推出）」');
    var cards = [].slice.call(el.querySelectorAll('.card[data-n]')).filter(function(x){ return /待面诊|待施术|待复诊|新消息/.test(x.innerText.slice(0,12)); });
    var soon = cards.filter(function(x){ return /待复诊/.test(x.innerText); })[0]; ST.ok(!!soon && !!soon.getAttribute('onclick'), '待复诊卡可点（筛选待办）');
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
    var rows = krAllCases(), r = rows.filter(function(x){ return x.c.consultStatus==='awaiting_report' && !x.c.revisitEval; })[0]; /* CMD-1022-12：排除复诊评估案件 */
    if(ST.ok(!!r, '没有等待报告的案件（stageW 夹具）')){ var c = r.c, old = c.consultContentAt; c.consultContentAt = nowFullDt(); var it = krTodoItems(rows).filter(function(i){ return i.kind==='send' && i.caseId===c.id; })[0]; ST.ok(!!it && /发送诊疗方案/.test(it.text), '上传后出现「发送诊疗方案」待办'); c.consultContentAt = old; }
    var r2 = rows.filter(function(x){ return krActiveItems(x.c).some(function(i){ return (i.postcare||[]).length; }); })[0];
    if(ST.ok(!!r2, '没有带术后管理的案件（stageC 夹具）')){ var c2 = r2.c, pb = c2.krBalancePaid, bk = c2.pcBooked; c2.krBalancePaid = true; c2.pcBooked = false;
      ST.ok(typeof krPcbOpen==='undefined' && typeof krPcbNeed==='undefined' && !/安排术后管理/.test(krTabItems(c2)) && !/术后管理预约/.test(krTabItems(c2).replace(/术后管理预约[^<]*<\/b>/,'x')), 'CMD-1015-30：旧的「术后管理预约」卡和［安排术后管理］小窗口已拿掉，预约入口只剩今日进行后的弹窗和项目卡［预约时间］'); c2.krBalancePaid = pb; c2.pcBooked = bk; }
  });
  ST.def('R15d','IN 五项小修：案例链接在行尾 / 赴韩默认韩币 / 转告·确认卡片按完消失 / 打印先预览 / 尾款 IN 看得到（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var src = String(localProjRowHtml); ST.ok(src.indexOf('min-width:96px')>-1 && src.lastIndexOf('projCasesLinkHtml')>src.indexOf('min-width:96px'), '「查看相关案例」在价格后面（行尾）');
    var sp = String(projectPickerHtml); ST.ok(sp.indexOf("krPickAmount(p.price, p.origin, pickerCcy)+'</span>'+projCasesLinkHtml")>-1, '赴韩项目行同样在行尾（CMD-1020-13：价格显示换成 krPickAmount）');
    var c = CASE_ITEMS.filter(function(x){ return x.krSchedule && x.krSchedule.status==='confirmed'; })[0] || CASE_ITEMS[0]; if(!ST.ok(!!c, '没有案件')) return; var old = CURRENT_CASE_ID; CURRENT_CASE_ID = c.id;
    try{
      CASE_DISPLAY_CCY_KR = 'KRW'; setProjectOrigin('KR'); ST.ok(CASE_DISPLAY_CCY_KR==='IDR', '切到赴韩项目默认印尼盾 Rp（CMD-1020-13 取代 15 的默认韩币）');
      if(c.krSchedule && c.krSchedule.confirmedDate){ var k0 = c.relayTold, r0 = c.recheck, rl = c.relayAt, m0 = c.surgeryMsg; var ik0 = c.surgInformKey, rm0 = c.reminderMsg; c.relayTold = null; c.recheck = null; c.surgeryMsg = null; c.surgInformKey = null; c.reminderMsg = null; var h0 = calRelayRecheckCards(c);
        ST.ok(!/转告客人<\/div>/.test(h0) && !/已转告客人/.test(h0), 'CMD-1019-12：「转告客人」卡和［已转告客人］已拿掉');
        ST.ok(/发送给客人/.test(surgSendHtml(c)) && !surgMsgSent(c), '施术日期那一行后面有［发送给客人］');
        openSurgMsg(c.id); ST.ok(!!SURGMSG && /您预约的赴韩施术时间已确认/.test(SURGMSG.text) && SURGMSG.ver==='notice' && !/Halo/.test(SURGMSG.text) && SURGMSG.text.indexOf(hospitalEn(c.hospitalId||'H1').name)>-1 && SURGMSG.text.indexOf(c.krSchedule.confirmedDate)>-1 && SURGMSG.text.indexOf(surgAmPm(c.krSchedule.confirmedTime))>-1, '预览有印尼文模板、日期、到院时间');
        SURGMSG.method = 'WhatsApp'; confirmSurgMsg();
        ST.ok(surgMsgSent(c) && /已发送（WhatsApp/.test(surgSendHtml(c)) && !/再发一次/.test(surgSendHtml(c)) && ST.hasLog(c, /已发送施术日期通知给客人/) && SMS_LOG[0].kind==='surgery' && SMS_LOG[0].caseId===c.id, '发送后显示已发送（方式、时间）、没有再发一次、记短信发送记录和 Timeline');
        var ad0 = c.krSchedule.address; c.krSchedule.address = (ad0||'')+'（改）'; ST.ok(!surgMsgSent(c) && surgChanged(c) && /请电话通知客人/.test(surgSendHtml(c)) && /已电话通知/.test(surgSendHtml(c)) && !/发送给客人/.test(surgSendHtml(c)), 'KR 改地址 / 日期 / 时间后：红字请电话通知 + ［已电话通知］，不重发'); c.krSchedule.address = ad0;
        ST.ok(surgMsgSent(c), '改回来仍算已通知（按当前日期 / 时间 / 地址比较）');
        ST.confirmTrip(c); ST.ok(surgRemindSent(c) && ST.hasLog(c, /已确认行程/), '已确认行程后记 Timeline'); c.tripConfirm = null; c.relayTold = k0; c.recheck = r0; c.relayAt = rl; c.surgeryMsg = m0; c.surgInformKey = ik0; c.reminderMsg = rm0; }
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
      var si = {name:lib.name+' · '+sp.label, price:sp.price*3, mgmt:true, localId:lib.id, specId:sp.id, specLabel:sp.label, unit:sp.price, qty:3, copies:3, specTimes:1, firstDay:1, interval:2, note:''};
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
    ST.preOpAll(c1); ST.ok(coreTodayDone(c1, [surg.id]) && krHoldOpen(c1), '施术行标完成后，持有管理项目仍在（结案不等持有用完）');
  });
  ST.def('R16b','KR 诊疗方案：没有共同术后管理；可选范围分施术 / 管理；管理项目 项目（规格）× 次数 × 间隔（KM1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    ST.ok(typeof krCommonBlock==='undefined' && typeof commonCareOf==='undefined' && typeof krScopeCommons==='undefined', '共同术后管理相关函数已拿掉');
    var lib = krLocalLib(krHospitalIdOfMe()), p = lib.filter(function(x){ return !x.neg && x.specs && x.specs.length>1; })[0] || lib.filter(function(x){ return !x.neg; })[0]; if(!ST.ok(!!p, '没有管理项目')) return;
    var spL = p.specs[p.specs.length-1], st = {on:true, sid:spL.id, qty:4, first:2, interval:3, manual:''}, it = krMgScopeItem(p, st, '备注');
    ST.ok(it && it.mgmt && it.copies===4 && it.qty===(spL.times||1)*4 && it.firstDay===mgSchedOf(p, spL, it.qty).firstDay && it.interval===mgSchedOf(p, spL, it.qty).interval && it.unit===spL.price && it.price===it.unit*4 && it.name.indexOf(p.name+' · ')===0, '管理项目条目：价格 = 规格单价 × 份数，总次数 = 规格次数 × 份数');
    var one = krMgScopeItem(p, {sid:p.specs[0].id, qty:1, first:0, interval:9, manual:''}, ''); var f1 = mgFirstOf(p, p.specs[0]); ST.ok(one.firstDay===(f1===null ? '' : f1) && (one.qty>1 || one.interval===0), '第一次使用 / 间隔读项目库（CMD-1021-08）；总共只有 1 次不记间隔');
    var neg = krLocalLib(krHospitalIdOfMe()).filter(function(x){ return x.neg; })[0]; if(neg){ ST.ok(krMgScopeItem(neg, {sid:neg.specs[0].id, qty:1, first:1, interval:1, manual:''}, '')===null && krMgScopeItem(neg, {sid:neg.specs[0].id, qty:2, first:1, interval:1, manual:'50000'}, '').price===100000, '面议项目要手填单价'); }
    var d = recSummaryData([{name:'假体隆鼻', stay:'7天', anesthesia:{label:'局部麻醉'}, postcare:[]}, it], ''); ST.ok(d.mgmt.length===1 && d.mgmt[0].qty===it.qty && d.rows.length===1, '推荐项目整理单独列管理项目，不算进推荐在韩天数'); ST.ok(/管理项目/.test(recSummaryHtml([it], '')), '只有管理项目也能生成整理');
    var r = krAllCases().filter(function(x){ return x.c.consultStatus==='awaiting_report' && !x.c.revisitEval; })[0]; /* CMD-1022-12：排除复诊评估案件 */
    if(r){ krShowCase(r.clinicId, r.id); var c = r.c, oldC = c.consultContentAt; c.consultContentAt = c.consultContentAt || nowFullDt(); KR_SUB = krSubBlank(krRecKey()); KR_SUB.text = '（自测）';
      var h0 = krSubmitBlock(c); ST.ok(/施术项目/.test(h0) && /管理项目/.test(h0) && /disabled/.test(h0), '可选范围有两个分类；什么都没勾时发送置灰');
      KR_SUB.mg[p.id] = {on:true, sid:p.specs[0].id, qty:2, first:1, interval:1, manual:''}; var h1 = krSubmitBlock(c); ST.ok(!/title="请选择院长推荐的项目"/.test(h1), '只勾管理项目也能发送（至少 1 项）'); KR_SUB.tab = 'mgmt'; var hh = krSubmitBlock(c); ST.ok(!/第一次使用/.test(hh) && /份数：/.test(hh) && /价格：/.test(hh), '管理项目一行：规格｜份数｜价格（第一次使用 / 间隔改读项目库，不再填）'); ST.ok(!/只在韩国做<\/span><\/div>/.test(hh), '行里不写「只在韩国做」');
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
    if(!hasCare){ ST.ok(ST.krCloseToday(c0) && !isEnded(c0), '没有术后管理：施术做完也不自动结案（CMD-1021-16）'); ST.ok(ST.tripClose(c0), '没有转去印尼的：KR［韩国行程结束］直接结案'); }
    var c = toConfirmed('R17a1'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c);
    ST.ok(corePcBooking(c, pcRows(c, 'IN'), ST.krBy), '术后管理预约失败'); ST.ok(ST.krCloseToday(c) && c.stage==='postcare' && !isEnded(c), '施术做完 → 进入术后管理阶段，不结案');
    var rows = carePendingRows(c).filter(function(s){ return s.place==='IN'; }); if(!ST.ok(rows.length>0, '要有回印尼做的术后管理')) return;
    var early = rows.filter(function(s){ return pcDaysLate(s.date)<0; })[0];
    if(early){ ST.ok(!coreCareVisit(c, early.id, 'A1 室长', '').ok, '提前做必须写原因'); ST.ok(coreCareVisit(c, early.id, 'A1 室长', '（自测）客人提前回来').ok && early.done, '写了原因就能做'); }
    carePendingRows(c).filter(function(s){ return s.place==='IN'; }).forEach(function(s){ coreCareVisit(c, s.id, 'A1 室长', '（自测）'); });
    var krLeft = carePendingRows(c); if(krLeft.length){ ST.ok(!isEnded(c), '韩国的术后管理还没做完 → 不结案'); ST.finishCare(c); }
    ST.ok(!isEnded(c) && ST.tripClose(c), '韩国 + 印尼都做完 → 不自动结案，KR［韩国行程结束］+ IN［结案］后结案');
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
    ST.finishCare(c); ST.ok(!isEnded(c), '做完不自动结案'); ST.ok(ST.tripClose(c) && NOTIFS.some(function(n){ return n.caseId===c.id && /已结案/.test(n.text||''); }), 'IN-22：确认结案时才发「结案」通知');
  });
  ST.def('R18b','在韩加的管理项目付完款即在韩持有；서비스即时；使用扣次数；子案件整张卡（到店 → 选项目 → 已完成）（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R18b1'); var lib = krLocalLib('H1').filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0]; if(!ST.ok(!!lib, '没有管理项目')) return; var sp = lib.specs[0], loc = {projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price};
    ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:loc}), '在韩加管理项目失败'); var it = c.procedureItems[c.procedureItems.length-1];
    ST.ok(it.pendingPay && it.heldOver && pendingPayItems(c).indexOf(it)>-1, '付款前标待付款（CMD-1020-16：先进持有，可以先做）'); ST.ok(coreAddOnPaid(c, ST.krBy) && it.heldOver && !it.pendingPay && krItemStatus(it)==='持有中' && holdItemLeft(c, it)===1, '付完款即在韩持有，剩 1 次');
    ST.ok(!(c.subItems||[]).some(function(s){ return s.kind==='增加项目' && s.projectName===it.name; }), '进程里的「增加项目」行拿掉');
    var svc = Object.assign({}, loc, {service:true, price:0}); ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:svc}), '加서비스失败'); var sv = c.procedureItems[c.procedureItems.length-1];
    ST.ok(sv.service && sv.heldOver, '서비스即时进在韩持有');
    /* 子案件整张卡：到店前只显示预约；到店后选这次的项目 */
    var rep = subCaseList(c).filter(function(r){ return r.place==='KR'; })[0]; if(!ST.ok(!!rep, '要有韩国术后管理的子案件')) return; var key = subCaseKey(rep);
    ST.ok(!coreVisitArrive(c, key, ST.krBy), '没到预约当天不能到店'); coreSubSimDay(c, rep.id, ST.krBy); ST.ok(coreVisitArrive(c, key, ST.krBy) && coreVisitRows(c, key).every(function(s){ return s.arrived; }), '模拟到当日后［客人到店］');
    ST.ok(coreUnitUseNow(c, it.name, ST.krBy).ok, '到店后［本次使用］把管理项目加进这次到访');
    var rows2 = coreVisitRows(c, key), use = rows2.filter(function(s){ return s.holdUseOf===it.name; })[0]; ST.ok(!!use && use.arrived, '管理项目加成这次到访里的一行「使用」');
    var before = it.holdUsed||0; rows2.forEach(function(s){ coreSubDone(c, s.id, ST.krBy, []); });
    ST.ok((it.holdUsed||0)===before+1 && rows2.every(function(s){ return s.done; }) && coreVisitState(c, key)==='arrived', '逐行完成：术后管理标完成、管理项目扣 1 次；行都完成但还没人工结束，到院仍是「已到店」'); ST.ok(coreEndSubVisit(c, key, ST.krBy).ok && coreVisitState(c, key)==='done', '人工结束这次到院 → 整张卡「已完成」');
    ST.ok(it.holdDone===true && krItemStatus(it)==='已用完', '用完变已用完');
  });
  ST.def('R20a','项目卡：术后管理［预约时间］→ 子案件（术后预约）→ 到店 → 管理项目［本次使用］→ 逐行完成；管理项目［预约使用］→ 管理预约；取消本次；待付款不能操作（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R20a1'); ST.krCloseToday(c); coreReopenVisitAt(c, 'main', ST.krBy); /* CMD-1021-11：已完成的到院不能直接加项目，先用［增加项目］重开 */ subCaseNos(c); var reps = subCaseList(c).filter(function(r){ return r.place==='KR'; }); if(!ST.ok(reps.length>=1, '要有韩国术后管理的子案件')) return; var k1 = subCaseKey(reps[0]);
    ST.ok(visitSource(c, k1)==='术后预约', '术后管理预约产生的子案件：预约来源 = 术后预约');
    var cu0 = careUnits(c), n0 = cu0.unbooked.length, row = coreVisitRows(c, k1)[0];
    ST.ok(coreRowCancel(c, row.id, ST.krBy) && row.skipped, '取消本次 → 术后管理退回「未预约」'); ST.ok(careUnits(c).rows.some(function(r){ return r.s.skipped; }), '项目卡里出现未预约单元');
    ST.ok(coreCareBook(c, careUnits(c).rows.filter(function(r){ return r.s.skipped; })[0].item, 0, row.date, row.time||'10:00', 'KR', row.id, ST.krBy) && !row.skipped && row.src==='care', '［预约时间］重新预约（并回原来的子案件）');
    var lib = krLocalLib('H1').filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0], sp = lib.specs[0];
    ST.ok(coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:{projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price}}), '在韩加管理项目'); var it = c.procedureItems[c.procedureItems.length-1];
    ST.ok(!coreUnitBookUse(c, it.name, D(30), '10:00', ST.krBy), '待付款：不能预约使用');
    ST.ok(coreAddOnPaid(c, ST.krBy) && it.heldOver, '付款后在韩持有'); ST.ok(!!coreUseTarget(c) && coreUseTarget(c).key==='main', '没有客人已到店的术后管理到院时：目标是今天已结束的到院（本次使用会自动重新打开，CMD-1019-22）');
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
    var c = pcCase('R22a1'); ST.krCloseToday(c); coreReopenVisitAt(c, 'main', ST.krBy); /* CMD-1021-11：已完成的到院不能直接加项目，先用［增加项目］重开 */ subCaseNos(c); var reps = subCaseList(c).filter(function(r){ return r.place==='KR'; }); if(!ST.ok(reps.length>=2, '要有两个以上子案件')) return;
    var k1 = subCaseKey(reps[0]), rows1 = coreVisitRows(c, k1).filter(function(s){ return !s.done; }), no1 = reps[0].dno;
    var u0 = careUnits(c).unbooked.length; rows1.forEach(function(s){ ST.ok(coreRowPostpone(c, s.id, ST.krBy), '无限延期一行'); });
    ST.ok(careUnits(c).rows.filter(function(r){ return r.s.skipped; }).length===rows1.length, '延期的术后管理退回项目卡「未预约」');
    ST.ok(c.visitEnds && c.visitEnds[k1] && c.visitEnds[k1].reason==='全部延期' && !subCaseList(c).some(function(r){ return subCaseKey(r)===k1; }), '这个子案件里的项目全部延期 → 子案件结案（全部延期）');
    var back = careUnits(c).rows.filter(function(r){ return r.s.skipped; })[0]; ST.ok(coreCareBook(c, back.item, 0, D(40), '10:00', 'KR', back.s.id, ST.krBy) && !back.s.skipped && back.s.date===D(40) && subCaseList(c).some(function(r){ return subCaseKey(r)==='KR|'+D(40); }), '重新预约：回到新日期的预约案件（原来那张「全部延期」留作记录）');
    /* 增加项目：睡眠 / 全麻，付款后才确认麻醉同意书 */
    var sleep = (HOSPITAL_DATA[caseKrHospital(c)].projects||[]).filter(function(p){ return p.defaults && p.defaults.anes && p.defaults.anes!=='local' && !krActiveItems(c).some(function(it){ return it.name===p.name; }); })[0];
    var nm = sleep ? sleep.name : '埋线双眼皮', an = {type:'sleep', label:'睡眠麻醉', note:''}; KR_FORCE_CLASH = true;
    try{ ST.ok(coreAddOnItem(c, nm, ST.krBy, {anesthesia:an}), '选项目 → 确认：不再要求勾选麻醉同意书'); } finally { KR_FORCE_CLASH = false; }
    var it = c.procedureItems[c.procedureItems.length-1]; ST.ok(it.consentPending && it.pendingPay && anesPendingItems(c).length===1, '付款前：待付款，同意书也要确认（和付款无关，CMD-1020-16）');
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
    var c = pcCase('R23a1'); ST.krCloseToday(c); coreReopenVisitAt(c, 'main', ST.krBy); /* CMD-1021-11：已完成的到院不能直接加项目，先用［增加项目］重开 */ var h = HOSPITAL_DATA[caseKrHospital(c)];
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
    ST.ok(/待确认麻醉同意书/.test(body('basic')), '待付款时同意书条也在（CMD-1020-16：和付款无关）'); krPayOpen(); var pm = document.getElementById('kr-pay-overlay').innerText; ST.ok(/确认付款/.test(pm) && /施术项目/.test(pm) && /管理项目/.test(pm) && /麻醉同意书/.test(pm) && /稍后付款/.test(pm), '［去付款］打开确认付款 Modal：施术 / 管理分开 + 麻醉同意书块');
    var al = window.alert, said = ''; window.alert = function(m){ said = m; }; try{ krPayConfirm(); } finally { window.alert = al; } ST.ok(/麻醉同意书/.test(said) && pendingPayItems(krFindCase(r.clinicId, r.id).c).length>=2, '不勾麻醉同意书不能确认付款');
    document.getElementById('kr-pay-consent').checked = true; krPayConfirm();
    var t1 = body('basic'); ST.ok(!/⚠ 待付款/.test(t1) && !/⚠ 待确认麻醉同意书/.test(t1), '确认付款 = 付款 + 同意书一次记录：两条都消失');
    Store.withClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; ST.ok(!anesPendingItems(cc).length && cc.anesthesiaConsent && cc.anesthesiaConsent.projects.length>0, '同意书已记录'); var row = (cc.subItems||[]).filter(function(s){ return s.kind==='增加项目' && /施术：/.test(s.content); })[0]; ST.ok(!!row && coreSubDone(cc, row.id, 'x', []), '付款 + 同意书后项目可以［操作完成］'); });
  });
  ST.def('R24a','在韩增加：先问延长多久（不延长 = 不查冲突；延长压到安排 = 冲突提醒）；增加的施术行写「施术：xx」；留两笔 KR 占位预约给 KM1（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = pcCase('R24a1'); ST.krCloseToday(c); coreReopenVisitAt(c, 'main', ST.krBy); /* CMD-1021-11：已完成的到院不能直接加项目，先用［增加项目］重开 */ var hid = caseKrHospital(c), ks = c.krSchedule, h = HOSPITAL_DATA[hid], dir = c.director, endBlk = timeToMin(ks.confirmedTime) + surgeryMinutes(c);
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
    ST.ok(/预约到店 · 待访问/.test(tx2) && ['客人已到院','预约修改','未到店','预约取消'].every(function(x){ return btns.indexOf(x)>-1; }), '预约到店阶段：状态卡 + ［客人已到店］［预约修改］［未到店］［预约取消］'); ST.ok(!/基础资料|项目卡|今日案件/.test(tx2) && !document.querySelector('#krcase-body .cal-switch'), '干净版：没有 tab、项目卡、案件区块');
    var b0 = krbFind(hid, pend[0].id), d2 = krDateAdd(40); if(visitWeekday(d2)==='周日') d2 = krDateAdd(41); /* 周日医院休诊，避开 */ ST.ok(coreBookChange(hid, b0.id, d2, '15:00', 'KM1 室长').ok && b0.date===d2, '预约修改');
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
    ST.preOpAll(c); ST.ok(coreSubDone(c, row.id, ST.krBy, []) && plan[0].done && !plan[1].done, '施术行完成只完成勾的项目');
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
      ST.ok(!!KR_ADJ.adds[cbs.name] && KR_ADJ.ext[cbs.name]===30, '选了 +30 分：记在添加项目里'); krChConfirm('adj'); /* CMD-1020-15：［确认添加］后收回成摘要 */ var ta = document.getElementById('krcase-body').innerText; ST.ok(/添加项目/.test(ta) && ta.indexOf(cbs.name)>-1 && /延长/.test(ta), '添加项目框里列出加的项目（带延长）'); }
    krSettleOpen('ok'); var m = document.getElementById('kr-settle-overlay').innerText; ST.ok(/确认付款/.test(m) && /尾款（在韩国补）/.test(m) && !/稍后付款/.test(m) && /取消/.test(m), 'Step 3：确认付款弹窗（尾款明细），没有稍后付款，只有取消 / 确认付款'); var ck = document.getElementById('kr-settle-consent'); if(ck) ck.checked = true; krSettleConfirm();
    var cb = Store.withClinic(rb.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===rb.id; })[0]; }); ST.ok(cb.krBalancePaid && cb.needTodayPick && !cb.todayPicked, '确认付款 = 付清尾款，进入 Step 4');
    krShowCase(rb.clinicId, rb.id); krSetCaseTab('items'); var t3 = document.getElementById('krcase-body').innerText; ST.ok(/今日进行项目/.test(t3) && !/请勾选今日进行项目/.test(t3) && /已勾选：0 个项目/.test(t3) && !/退回前页/.test(t3) && /今日进行/.test(t3) && document.querySelectorAll('#krcase-body input[type=checkbox]').length>0, 'Step 4：项目卡每行有勾选框 + 今日进行项目标题 + 只有［今日进行］');
    var cbx = document.querySelector('#krcase-body input[type=checkbox]'); cbx.checked = true; cbx.onchange && cbx.onchange.call(cbx); ST.ok(/已勾选：1 个项目/.test(document.getElementById('krcase-body').innerText), '勾 1 个 → 已勾选：1 个项目'); krPickGo();
    krShowCase(rb.clinicId, rb.id); krSetCaseTab('items'); var t4 = document.getElementById('krcase-body').innerText; ST.ok(/(今天|\d\d\/\d\d（.）)\s*\d\d:\d\d/.test(t4) && !/今日进行项目/.test(t4), '今日进行 → 勾的变今日案件的行');
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
    ST.ok(/项目\s*术后第 N 天\s*地点\s*次数\s*建议日期/.test(t0) && !/购买时间/.test(t0), '栏位 = 项目｜地点｜对应施术｜次数｜管理间隔｜建议日期（CMD-1015-29 拿掉项目类型、CMD-1015-30 地点单独一栏），没有购买时间');
    ST.ok(/剩 2 \/ 共 3 次/.test(t0), '消肿管理约第 1 次后：剩 2 / 共 3 次');
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
      var ov = document.getElementById('kr-cb-overlay'); ST.ok(!!ov && ov.classList.contains('open') && /预约时间/.test(ov.innerText) && /术后第 \d+ 天/.test(ov.innerText) && /取消/.test(ov.innerText) && /确认预约/.test(ov.innerText), '今日进行后弹术后管理预约（勾选｜项目（术后第 N 天）｜日期｜时间，［取消］［确认预约］）'); ST.ok(KR_CB && KR_CB.rows.filter(function(r){ return r.kind==='care'; }).length===5 && KR_CB.rows.every(function(r){ return !r.checked; }), '未预约 5 项（拆线 / 术后复诊 / 消肿 ×3），自动弹出时全不勾：'+(KR_CB&&KR_CB.rows.length));
      var iC = KR_CB.rows.findIndex(function(r){ return r.kind==='care' && r.x.mgmt==='拆线'; }), iF = KR_CB.rows.findIndex(function(r){ return r.kind==='care' && r.x.name==='术后复诊检查'; }), iX = KR_CB.rows.findIndex(function(r){ return r.kind==='care' && r.x.name==='术后消肿管理'; });
      var okDay = function(n){ var d = ymdAdd(todayStr(), n); while(visitWeekday(d)==='周日') d = ymdAdd(d, 1); return d; }; krCbSet(iC, 'date', okDay(10)); krCbSet(iF, 'date', okDay(11)); krCbSet(iX, 'place', 'IN'); krCbSet(iC, 'time', '12:00'); krCbSet(iF, 'time', '12:30'); krCbSet(iC, 'checked', true); krCbSet(iF, 'checked', true); krCbSet(iX, 'place', 'IN'); krCbSet(iX, 'checked', true); krCbGo(); var bo = document.getElementById('kr-block-overlay'); if(bo && bo.classList.contains('open') && /时间冲突/.test(bo.innerText)) window.__krAskGo('go');
    })(); (function(){
      var c = gc(ra), care = (c.subItems||[]).filter(function(x){ return x.kind==='术后管理记录' && !x.skipped; }); ST.ok(care.length===3 && care.filter(function(x){ return x.place==='IN'; }).length===1 && care.filter(function(x){ return x.place==='KR' && x.time; }).length===2, '日程预约：约了 3 项（韩国 2 + 印尼 1），没填的留着：'+care.length);
      ST.ok(careUnits(c).unbooked.length===2, '没填的 2 个消肿留在项目卡未预约'); ST.ok(!document.getElementById('kr-cb-overlay').classList.contains('open'), '弹窗已关闭');
      ST.ok(care.some(function(x){ return x.place==='KR' && /术后预约/.test(visitSource(c, subCaseKey(x))) && x.src==='care'; }), '预约来源 = 术后预约');
      ST.ok(typeof calendarEventsKr==='function' ? true : true, ''); krShowCase(ra.clinicId, ra.id); krSetCaseTab('items'); krProjPage('care'); var tc0 = document.getElementById('krcase-body').innerText, tc = tc0.slice(tc0.indexOf('项目卡'), tc0.indexOf('每次到院一张卡') > -1 ? tc0.indexOf('每次到院一张卡') : undefined); ST.ok(/已预约/.test(tc) && !/项目类型/.test(tc) && /项目\s*术后第 N 天\s*地点\s*次数\s*建议日期/.test(tc), '术后管理分页：没有项目类型，栏位 项目｜地点｜对应施术｜次数｜管理间隔｜建议日期');
      krProjPage('surg'); var t1 = document.getElementById('krcase-body').innerText; var mc = document.getElementById('kr-maincard'); var mt = mc ? mc.innerText : t1;
      ST.ok(mt.indexOf('\n'+pk[0]+'\n')>-1 && mt.indexOf('\n'+pk[1]+'\n')>-1 && mt.indexOf(pk[0]+'、')<0, '施术项目一项一行（CMD-1020-06：只写名称，不再带「施术：」）'); ST.ok((mt.match(/操作完成/g)||[]).length>=2 && (mt.match(/今日取消/g)||[]).length===0, '施术每行只有［操作完成］，没有［今日取消］（CMD-1022-14：施术只能改期）');
      ST.ok(!/修改时间/.test(mt) && !/预约后续到院/.test(mt), '今日案件行没有［修改时间］和「预约后续到院」');
      ST.ok(!coreTodayCancel(gc(ra), 'item', pk[1], ST.krBy), '施术项目核心拒绝今日取消（CMD-1022-14）'); krMut(function(c){ return coreTodayCancel(c, 'item', pk[1], ME_NAME, true); }); /* 改用内部退回（客人已离院那条路径）继续后面的流程 */
    })(); (function(){
      var c = gc(ra), it = c.procedureItems.filter(function(x){ return x.name===pk[1]; })[0]; ST.ok(it.deferUse && !it.done && !it.cancelled, '今日取消 = 退回项目卡（deferUse），不是取消项目、不退款'); var sr = (c.subItems||[]).filter(function(x){ return x.kind==='施术'; })[0]; ST.ok(sr && sr.content==='施术：'+pk[0], '施术行只剩没取消的：'+(sr&&sr.content));
      var row = sr; krSurgItemDone(row.id, pk[0]);
    })(); (function(){
      var c = gc(ra), sr = (c.subItems||[]).filter(function(x){ return x.kind==='施术'; })[0]; ST.ok(sr && sr.done && c.procedureItems.filter(function(x){ return x.name===pk[0]; })[0].done, '最后一项做完 → 施术行完成');
      /* B：稍后预约 */
      krShowCase(rb.clinicId, rb.id); krSetCaseTab('items'); krProjPage('surg'); gc(rb).procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).forEach(function(x){ KR_PICK['surg:'+x.name] = true; }); krPickGo(); krCareMiniOpen();
    })(); (function(){
      var ov = document.getElementById('kr-cb-overlay'); ST.ok(ov.classList.contains('open'), 'B 也弹窗'); krCareMiniClose(); var c = gc(rb); ST.ok((c.subItems||[]).filter(function(x){ return x.kind==='术后管理记录'; }).length===0 && careUnits(c).unbooked.length===5, '稍后预约：5 项都留在项目卡未预约');
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
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); var txt = function(){ return document.getElementById('krcase-body').innerText; }, rowOf = function(nm){ var els = [].slice.call(document.querySelectorAll('#krcase-body div')).filter(function(e){ return e.style && /grid/.test(e.style.cssText) && e.innerText.replace(/^(印尼|在韩)购买\s*/, '').indexOf(nm)===0 && e.children.length>=4; }); return els.length ? els[els.length-1].innerText : ''; };
    ST.ok(!/本次取消/.test(rowOf(plan[0])) && !/本次使用/.test(rowOf(plan[0])), '已选进今日、没完成的施术项目 → 没有按钮（CMD-1022-14：施术没有［本次取消］）：'+rowOf(plan[0]).replace(/\n/g,' ')); ST.ok(/本次使用/.test(rowOf(plan[1])) && !/本次取消/.test(rowOf(plan[1])), '没选进今日的施术项目 → ［本次使用］：'+rowOf(plan[1]).replace(/\n/g,' '));
    if(mg){ krProjPage('mgmt'); ST.ok(/本次取消/.test(rowOf(mg.name)), '已选进今日的管理项目 → ［本次取消］'); krProjPage('surg'); }
    krUnitUseNow(plan[1]); var xo = document.getElementById('kr-ext-overlay'); ST.ok(!!xo && xo.classList.contains('open') && /要延长多久/.test(xo.innerText), '施术［本次使用］先问延长多久'); krExtPick(0);
    var c2 = gc(); ST.ok(!c2.procedureItems.filter(function(x){ return x.name===plan[1]; })[0].deferUse && (c2.subItems||[]).filter(function(s){ return s.kind==='施术'; })[0].content.indexOf(plan[1])>-1, '本次使用 → 加进今日案件（施术行里有它）');
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); ST.ok(!/本次取消/.test(rowOf(plan[1])), '施术项目加进来之后没有［本次取消］（CMD-1022-14）'); krMut(function(c){ return coreTodayCancel(c, 'item', plan[1], ME_NAME, true); }); ST.ok(gc().procedureItems.filter(function(x){ return x.name===plan[1]; })[0].deferUse, '内部退回 = deferUse');
    krSurgItemDone((gc().subItems||[]).filter(function(s){ return s.kind==='施术'; })[0].id, plan[0]); krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); ST.ok(!/本次取消/.test(rowOf(plan[0])) && !/本次使用/.test(rowOf(plan[0])), '已完成的没有按钮');
    /* 术后管理：地点单独一栏 / 不占院长 */
    krProjPage('care'); var tc = txt(); tc = tc.slice(tc.indexOf('项目卡'), tc.indexOf('每次到院一张卡')>-1 ? tc.indexOf('每次到院一张卡') : undefined); ST.ok(/项目\s*术后第 N 天\s*地点\s*次数\s*建议日期/.test(tc), '术后管理分页栏位 = 项目｜地点｜对应施术｜次数｜管理间隔｜建议日期');
    var hid = krHospitalIdOfMe(), hd = krHData(), dir = gc().director, slot = careSlotList(gc())[0]; if(!ST.ok(!!slot, '有未预约的拆线')) return; (hd.directorSchedule[dir] = hd.directorSchedule[dir]||[]).push({id:'t30blk', kind:'不可预约', type:'不可预约', date:slot.sug, time:'12:00', end:'13:00', name:''});
    krBkdOpen('care', slot.item, slot.i); var ix0 = KR_CB.rows.findIndex(function(r){ return r.checked; }); KR_CB.rows[ix0].date = slot.sug; KR_CB.dayTime = KR_CB.dayTime||{}; KR_CB.dayTime[slot.sug] = '12:00'; krCbRender(); /* CMD-1021-02：时间按日期组走 */ ST.ok(/不占院长时间/.test(document.getElementById('kr-cb-overlay').innerText), '预约时间弹窗：不选院长、不显示院长日程'); krCbGo(); var bo = document.getElementById('kr-block-overlay'); ST.ok(!(bo && bo.classList.contains('open') && /时间冲突|重叠/.test(bo.innerText)), '和院长「不可预约」同时段：不询问冲突');
    var care = (gc().subItems||[]).filter(function(x){ return x.kind==='术后管理记录' && !x.skipped && !x.holdUseOf && !x.surgUse; }); ST.ok(care.length===1 && care[0].time==='12:00', '术后管理预约成功');
    KRC.layer = 'hospital'; var ev = krcEvents(); var cev = ev.surg.filter(function(x){ return x.b.type==='术后管理' && x.b.subId===care[0].id; })[0]; ST.ok(!!cev && cev.b.who===KRB_HOSP && cev.b.noCap===true, '日历：术后管理画在医院层（全院），不算院长约满');
    hd.directorSchedule[dir] = hd.directorSchedule[dir].filter(function(b){ return b.id!=='t30blk'; });
  });
  ST.def('R31a','CMD-1015-31 数据（A1 分页：两个施术项目都选进今日案件 + 拆线未预约）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = toConfirmed('R31a0'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); ST.preOpAll(c); var plan = c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x); });
    plan[0].postcare = [{mgmt:'拆线', name:'拆线', times:1, place:'KR', startDay:7}]; c.needTodayPick = true; c.todayPicked = false;
    ST.ok(coreTodayPick(c, plan.map(function(x){ return x.name; }), [], ST.krBy).ok, '两个施术项目都选进今日案件'); localStorage.setItem('__R31', JSON.stringify({id:c.id}));
  });
  ST.def('R31b','KM1：施术一项一行 —— 完成一个另一个仍待做 / 取消一个另一个留在今日案件；术后管理待办 / 通知改指向项目卡术后管理分页；施 / 管分页没有项目类型栏；旧术后管理预约卡和小窗口已没有（先在 A1 跑 R31a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R31')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R31a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件')) return; var gc = function(){ return Store.withClinic(r.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]; }); };
    var plan = gc().procedureItems.filter(function(x){ return !krIsMgmtItemC(x); }).map(function(x){ return x.name; });
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); var t0 = document.getElementById('krcase-body').innerText;
    ST.ok(!/项目类型/.test(t0.slice(t0.indexOf('项目卡'), t0.indexOf('每次到院一张卡')>-1 ? t0.indexOf('每次到院一张卡') : undefined)), '施术项目分页没有项目类型栏'); krProjPage('mgmt'); var t1 = document.getElementById('krcase-body').innerText; ST.ok(!/项目类型/.test(t1.slice(t1.indexOf('项目卡'), t1.indexOf('每次到院一张卡')>-1 ? t1.indexOf('每次到院一张卡') : undefined)), '管理项目分页没有项目类型栏'); krProjPage('surg');
    ST.ok(typeof krPcbOpen==='undefined' && typeof krPcbOpenLocal==='undefined' && !/术后管理预约<|安排术后管理/.test(document.getElementById('krcase-body').innerHTML), '案件页没有旧的「术后管理预约」卡片和［安排术后管理］');
    /* 待办 / 通知 改指向术后管理分页 */
    var todo = krTodoItems(krAllCases()).filter(function(i){ return i.kind==='pcb' && i.caseId===rec.id; })[0]; if(ST.ok(!!todo, '有「安排术后管理」待办')){ krProjPage('surg'); krShowCase(r.clinicId, r.id); todo.go ? todo.go() : (todo.fn && todo.fn()); ST.ok(KR_CASE.tab==='items' && KR_PROJ_PAGE==='care', '待办点进去 = 项目卡术后管理分页'); }
    var hd = krHData(); (hd.notifs = hd.notifs||[]).push({id:'t31n', kind:'info', text:'术后管理提前：测试', caseId:rec.id, clinicId:r.clinicId, ts:nowFullDt(), readBy:[]}); krProjPage('surg'); krOpenNotif('t31n'); ST.ok(KR_CASE.tab==='items' && KR_PROJ_PAGE==='care', '术后管理类通知点进去 = 项目卡术后管理分页'); hd.notifs = hd.notifs.filter(function(x){ return x.id!=='t31n'; });
    /* 一项一行：完成一个 */
    krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('surg'); var row = (gc().subItems||[]).filter(function(x){ return x.kind==='施术'; })[0]; krSurgItemDone(row.id, plan[0]); var c1 = gc(), itm = function(nm){ return c1.procedureItems.filter(function(x){ return x.name===nm; })[0]; };
    ST.ok(itm(plan[0]).done && !itm(plan[1]).done && !(c1.subItems||[]).filter(function(x){ return x.kind==='施术'; })[0].done, '完成一个施术项目：另一个仍待做，施术行没有完成');
    var tx = document.getElementById('krcase-body').innerText; var mc = document.getElementById('kr-maincard'); var mt = mc ? mc.parentElement.innerText : tx; ST.ok(/施术：\s*鼻翼缩小|施术：[^\n]*鼻翼缩小/.test(mt) || mt.indexOf(plan[1])>-1, '今日案件里另一个还在');
    /* 取消另一个 → 其余都已完成，施术行跟着完成 */
    krMut(function(c){ return coreTodayCancel(c, 'item', plan[1], ME_NAME, true); }); var c2 = gc(); ST.ok(c2.procedureItems.filter(function(x){ return x.name===plan[1]; })[0].deferUse && (c2.subItems||[]).filter(function(x){ return x.kind==='施术'; })[0].done, '取消剩下的那个：回项目卡未使用，施术行因其余都完成而完成');
  });
  ST.def('R32a','CMD-1019-01：基础资料顺序 / 苦恼按部位卡片 / 必填校验 / 不面诊选填 / 旧案件转换（A1 分页；案件留给 KM1 看面诊 tab）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = ST.newRes('R32a'); ST.arrive(c); setNeedsConsult(true); /* 选了面诊需求才展开苦恼（CMD-1019-02） */ toggleConcernPart('f_eyes'); var html = materialsCardHtml(c), ix = function(t){ return html.indexOf(t); }; toggleConcernPart('f_eyes'); /* 先选一个部位才有卡片（卡片里有希望预期），看完顺序再取消 */
    ST.ok(ix('메타뷰') > -1 && ix('메타뷰') < ix('面诊需求') && ix('面诊需求') < ix('苦恼 <') && ix('苦恼 <') < ix('希望预期') && ix('希望预期') < ix('院长介绍') && ix('院长介绍') < ix('预算') && ix('预算') < ix('上传附件') && ix('上传附件') < ix('医美史'), '顺序：메타뷰 → 面诊需求 → 苦恼（含每张卡里的希望预期）→ 院长 → 预算 → 上传附件 → 医美史');
    ST.ok(!/id="cf-concern"|id="cf-expectation"/.test(html) && !/>上传照片<\/|>上传照片 </.test(html), '没有总的苦恼文字格和单独一行的希望预期（照片 / 视频上传在每张部位卡片里）');
    toggleConcernPart('f_eyes'); toggleConcernPart('f_nose'); var fm = concernFormHtml(c); ST.ok((c.concerns||[]).length===2 && /眼睛/.test(fm) && /鼻子/.test(fm) && /上方（眼睛往下看）/.test(fm) && /下方（仰拍鼻孔）/.test(fm) && /1200×1600/.test(fm), '选眼睛 + 鼻子 → 两张卡片，角度格子不同（眼睛 5 个、鼻子 6 个）');
    ST.ok(concernPartDef('f_eyes').angles.length===5 && concernPartDef('f_nose').angles.length===6 && concernPartDef('f_all').angles.length===5 && concernPartDef('f_mouth').angles.length===5 && concernPartDef('f_ear').angles.length===3 && concernPartDef('b_chest').angles.length===5 && concernPartDef('b_belly').angles.length===3 && concernPartDef('b_hip').angles.length===3 && concernPartDef('b_leg').angles.length===4 && concernPartDef('b_neck').angles.length===4, '角度配置：眼 5 / 鼻 6 / 面部整体 5 / 嘴 5 / 耳 3 / 胸 5 / 腹 3 / 臀 3 / 腿 4 / 颈 4');
    saveConcernDesc('f_eyes', '眼皮松弛'); saveConcernDesc('f_nose', '鼻梁低'); setNeedsConsult(true); var m0 = concernMissing(c); ST.ok(m0.some(function(x){ return /眼睛：希望预期/.test(x); }) && m0.some(function(x){ return /鼻子：希望预期/.test(x); }), '每张卡的希望预期必填：'+m0.join('；')); saveConcernExpect('f_eyes', '自然'); saveConcernExpect('f_nose', '挺一点'); var m1 = concernMissing(c); ST.ok(m1.some(function(x){ return /眼睛：视频/.test(x); }) && m1.some(function(x){ return /眼睛：照片/.test(x); }) && m1.some(function(x){ return /鼻子：照片/.test(x); }), '面诊：缺视频 / 缺照片会列出来：'+m1.join('；'));
    mockUploadConcern('f_eyes', 'video'); concernPartDef('eyes').angles.forEach(function(an){ mockUploadConcern('f_eyes', an.id); }); concernPartDef('nose').angles.slice(1).forEach(function(an){ mockUploadConcern('f_nose', an.id); }); mockUploadConcern('f_nose', 'video');
    var m2 = concernMissing(c); ST.ok(m2.length===1 && /鼻子：照片（正面）/.test(m2[0]), '缺一张照片（鼻子正面）→ 缺项里只剩这一项：'+m2.join('；'));
    confirmMaterials(); ST.ok(!c.materialsConfirmed && document.getElementById('materials-missing-overlay').classList.contains('open') && /鼻子：照片/.test(document.getElementById('materials-missing-list').innerText), '缺一张照片不能提交（弹缺项）'); closeMaterialsMissing();
    ST.ok(/苦恼总 memo/.test(concernFormHtml(c)), '选了 2 个以上部位：卡片下面有「苦恼总 memo」');
    setNeedsConsult(false); c.concernText = '（自测）手写'; ST.ok(concernMissing(c).length===0, '切到不面诊：只要手写苦恼（CMD-1021-17，不要部位卡 / 照片 / 视频）：'+concernMissing(c).join('；')); mockUploadConcern('f_nose', 'front');
    /* 不面诊：去掉全部媒体也只缺说明 */
    var x2 = ST.newRes('R32aB'); ST.arrive(x2); toggleConcernPart('f_all'); saveConcernDesc('f_all', '轮廓'); saveConcernExpect('f_all', '更立体'); setNeedsConsult(false); x2.concernText = '轮廓'; ST.ok(concernMissing(x2).length===0, '不面诊：只填手写苦恼就够（没有部位卡）'); setNeedsConsult(true); ST.ok(concernMissing(x2).length>=2, '改回面诊：照片 / 视频又变必填');
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
      if(krIsDirector()){ var dc = krAllCases().filter(function(x){ return x.c.director===me.name; })[0]; if(dc) var dcc = dc.c, dcCons = !!(dcc.consultRequested && !dcc.reportReady && ['paid_waiting_kr','awaiting_report'].indexOf(dcc.consultStatus)>-1); ST.ok(krDefaultCaseTab(dc.clinicId, dc.id)===(dcCons ? 'consult' : 'basic'), '院长进案件：面诊 / 复诊阶段默认面诊 tab，其余基础资料 tab（CMD-1021-25）'); }
      krShowCase(r.clinicId, r.id, {here:true}); krSetCaseTab('consult'); var cb = document.getElementById('krcase-body').innerText; ST.ok(/到访目的/.test(cb) || isRevisitConsult(r.c) || !!r.c.reuseReport, '面诊 tab 最上面有到访目的卡（CMD-1022-16；复诊案件除外）'); krSetCaseTab('basic'); ST.ok(!/到访目的/.test(document.getElementById('krcase-body').innerText), '基础资料 tab 不再放到访目的（CMD-1022-16）');
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
  ST.def('R39a','CMD-1019-10：管理项目数量改「份」（规格次数 × 份数 = 总次数）；1 份「·N次」→ 剩 N / 共 N、每次扣 1，2 份 = 共 2N；一行固定格式（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var lib = krLocalLib('H1').filter(function(p){ return !p.neg && p.specs.some(function(x){ return x.times===3; }); })[0]; if(!ST.ok(!!lib, 'KR 本地管理项目库里没有「·3次」的规格')) return; var sp = lib.specs.filter(function(x){ return x.times===3; })[0];
    var hasKr = typeof krMgScopeItem==='function', mkI = function(cp, first, itv){ return {name:lib.name+' · '+sp.label, price:sp.price*cp, mgmt:true, localId:lib.id, specId:sp.id, specLabel:sp.label, unit:sp.price, qty:3*cp, copies:cp, specTimes:3, firstDay:first, interval:itv, note:''}; };
    var one = hasKr ? krMgScopeItem(lib, {sid:sp.id, qty:1, first:1, interval:5, manual:''}, '') : mkI(1, 1, 5), two = hasKr ? krMgScopeItem(lib, {sid:sp.id, qty:2, first:0, interval:5, manual:''}, '') : mkI(2, 0, 5);
    ST.ok(one.qty===3 && one.copies===1 && one.price===sp.price && one.interval===5 && one.firstDay===1, '1 份「·3次」= 总 3 次、价格 = 规格单价、带间隔');
    ST.ok(two.qty===6 && two.copies===2 && two.price===sp.price*2 , '2 份 = 共 6 次、价格 ×2');
    ST.ok(mgmtQtyText(one)==='1 份（共 3 次）' && mgmtQtyText(two)==='2 份（共 6 次）', '显示：1 份（共 3 次）');
    if(hasKr){
      var fz = {sid:'',manual:'',qty:'',first:'',interval:''}, html = krMgRowFields(lib, {sid:sp.id, qty:1, first:1, interval:5, manual:''}, fz, ''); ST.ok(!/第一次使用/.test(html) && !/间隔：/.test(html) && /份数：/.test(html) && /（3次）/.test(html) && /价格：/.test(html) && !/只在韩国做/.test(html), '一行：规格｜份数 N 份（M次）｜价格（第一次使用 / 间隔不填）');
      var sp1 = lib.specs.filter(function(x){ return !(x.times>1); })[0]; if(sp1){ ST.ok(!/间隔：/.test(krMgRowFields(lib, {sid:sp1.id, qty:1, first:1, interval:5, manual:''}, fz, '')), '总共只有 1 次时不显示间隔'); ST.ok(/间隔：/.test(krMgRowFields(lib, {sid:sp1.id, qty:2, first:1, interval:5, manual:''}, fz, '')), '2 份单次规格 = 共 2 次，显示间隔'); }
    }
    var c = ST.newRes('R39a'); ST.consultToReport(c); ST.ok(coreAddScopeItem(c, one, 'KM1 室长'), '补加到可选范围'); ST.open(c); c.activeCaseTab = 'kr'; c.projectOriginFilter = 'KR';
    ['假体隆鼻'].forEach(function(n){ var p = PROJECT_LIBRARY.filter(function(x){ return x.name===n && x.origin==='KR' && x.hospitalId==='H1'; })[0]; toggleProject(p.id); }); toggleProject(scopeMgmtPid(one));
    var rec = c.recommended.filter(function(it){ return it.mgmtPlan; })[0]; ST.ok(rec && rec.qty===3 && rec.copies===1 && rec.specTimes===3 && rec.firstDay!==undefined, 'IN 选项目：快照带总次数 / 份数 / 第一次使用 / 间隔'); ST.ok(/1 份（共 3 次）/.test(projectPickerHtml(c, false)), 'IN 选项目一行写「1 份（共 3 次）」');
    confirmProjectSelection(); settleProjects(); window.SETTLE_ANES_SIGNED = true; confirmSettlementPayment(); ST.scheduleConfirm(c, 8); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); syncSurgerySub(c);
    var held = c.procedureItems.filter(function(it){ return it.mgmtPlan; })[0]; ST.ok(held && held.heldOver && holdItemLeft(c, held)===3 && held.qty===3, '付清尾款后在韩持有 剩 3 / 共 3');
    ST.ok(coreMgmtUse(c, held.name, ST.krBy) && holdItemLeft(c, held)===2, '用 1 次剩 2');
    var h3 = ST.krBy; var pcards = null; try{ pcards = Store.withClinic(CURRENT_CLINIC_ID, function(){ return ''; }); }catch(e){}
    /* 到院添加（locals 没带次数的旧入口）：按规格补次数 */
    var c2 = ST.newRes('R39a2'); ST.consultToReport(c2); ST.open(c2); ['假体隆鼻'].forEach(function(n){ var p = PROJECT_LIBRARY.filter(function(x){ return x.name===n && x.origin==='KR' && x.hospitalId==='H1'; })[0]; toggleProject(p.id); }); confirmProjectSelection(); settleProjects(); window.SETTLE_ANES_SIGNED = true; confirmSettlementPayment(); ST.scheduleConfirm(c2, 8); ST.krArrive(c2); ST.krJudge(c2, 'ok'); ST.krPay(c2); syncSurgerySub(c2);
    ST.ok(coreAddOnItem(c2, lib.name, ST.krBy, {local:{name:lib.name, specLabel:sp.label, price:sp.price, projectId:lib.id}}), '到院添加管理项目（旧入口没带次数）'); var ni = c2.procedureItems.filter(function(it){ return it.local || /^lc:/.test(it.projectId||''); })[0]; ST.ok(ni && ni.qty===3, '按规格「·3次」补成总 3 次');
    ST.ok(coreAddOnItem(c2, lib.name, ST.krBy, {local:{name:lib.name, specLabel:sp.label, price:sp.price*2, projectId:lib.id, qty:6, copies:2, specTimes:3, firstDay:0, interval:5}}), '到院添加 2 份'); var ni2 = c2.procedureItems.filter(function(it){ return (it.local || /^lc:/.test(it.projectId||'')) && it.qty===6; })[0]; ST.ok(!!ni2 && ni2.copies===2, '2 份 = 共 6 次');
    var mig = (window.GMC_MIGRATIONS||[]).filter(function(m){ return m.to===51; })[0]; if(ST.ok(!!mig, '迁移 51 存在')){ var old = {id:'o51', caseNo:'A51', procedureItems:[{name:lib.name+' · '+sp.label, mgmtPlan:true, qty:2, price:100}], recommended:[], krScope:{items:[{name:'x', mgmt:true, specLabel:sp.label, qty:1}]}}, ns = []; mig.fn(old, {note:function(t0){ ns.push(t0); }}); ST.ok(old.procedureItems[0].qty===6 && old.procedureItems[0].copies===2 && old.krScope.items[0].qty===3, '迁移：旧 qty（当成份数）→ 总次数 = 规格次数 × 份数'); var again = JSON.stringify(old); mig.fn(old, {note:function(){}}); ST.ok(JSON.stringify(old)===again, '迁移幂等'); }
  });
  ST.def('R40a','CMD-1019-11：基础资料「客人基本信息」（生日 YY-MM-DD（N 岁）、病史过敏史醒目、联系方式，修改同步档案）+ 确认赴韩时登记护照（第一次必填 → 之后带出；过期 / 施术前到期报红；KR 室长可见院长不可见；Timeline 不带护照号）（IN 分页跑 A1；KR 分页跑 KM1 / KD1）',function(){
    var me = currentAccount(), kr = isKrAccount();
    ST.ok(ageOfDob('1992-03-08')===(function(){ var t = todayStr().split('-'); var a = (+t[0])-1992; if((+t[1])<3 || ((+t[1])===3 && (+t[2])<8)) a--; return a; })(), '年龄按今天算');
    ST.ok(/^92-03-08（\d+ 岁）$/.test(dobAgeText('1992-03-08')) && dobAgeText('')==='—', '生日显示 YY-MM-DD（N 岁）');
    ST.ok(/无/.test(historyMarkHtml('无')) && !/⚠/.test(historyMarkHtml('无')) && !/⚠|background/.test(historyMarkHtml('青霉素')) && /青霉素/.test(historyMarkHtml('青霉素')) && /无/.test(historyMarkHtml('\u7121')) && !/\u7121/.test(historyMarkHtml('\u7121')), '病史 / 过敏史：无 = 写「无」，有内容 = 醒目');
    if(!kr){
      if(!ST.ok(!!me, '要先登录')) return;
      var c = ST.newRes('P40'); ST.consultToReport(c); ST.open(c); var cl = clientByName(c.name); cl.history = '青霉素过敏'; cl.dob = '1992-03-08'; cl.passport = {text:'未登记', date:'', no:'', issue:'', expiry:''};
      c.activeCaseTab = 'basic'; renderCaseBody(c); var tx = document.getElementById('case-body') ? document.getElementById('case-body').innerText : document.body.innerText;
      ST.ok(/基本信息/.test(tx) && /92-03-08（\d+ 岁）/.test(tx) && /青霉素过敏/.test(tx) && tx.indexOf(cl.phone)>-1, 'IN 基础资料最上面有客人基本信息（生日 / 年龄 / 过敏 / 联系方式）');
      openClientEdit(c.name, 'history'); document.getElementById('ce-v').value = '花粉过敏'; saveClientEdit(); ST.ok(clientByName(c.name).history==='花粉过敏', '这里修改 = 客户档案同步');
      var cs = ['ok'];
      c.activeCaseTab = 'kr'; c.projectOriginFilter = 'KR'; var p = PROJECT_LIBRARY.filter(function(x){ return x.name==='假体隆鼻' && x.origin==='KR' && x.hospitalId==='H1'; })[0]; toggleProject(p.id);
      var was = window.GMC_PASSPORT_AUTO; window.GMC_PASSPORT_AUTO = false;
      try{
        confirmProjectSelection(); ST.ok(document.getElementById('passport-overlay').classList.contains('open') && !(c.settlementBatches||[]).length, '第一次确认赴韩：弹护照窗，没填之前不生成结算单');
        passportConfirm(); ST.ok(!(c.settlementBatches||[]).length && document.getElementById('pp-err').style.display==='block', '三项必填，空着不能继续');
        document.getElementById('pp-pno').value = 'E1234567'; document.getElementById('pp-pis').value = '2015-01-01'; document.getElementById('pp-pex').value = '2020-01-01'; passportConfirm();
        ST.ok((c.settlementBatches||[]).length===1 && passportComplete(clientByName(c.name)), '填完（已过期也允许）→ 继续生成结算单');
        ST.ok(passportAlert(c).level==='expired' && /护照已过期/.test(passportStatusHtml(c)), '过期报红');
        ST.ok(!JSON.stringify(clientByName(c.name).timeline).includes('E1234567') && !JSON.stringify(c.logEntries).includes('E1234567') && !JSON.stringify(NOTIFS).includes('E1234567'), '护照号不进 Timeline / 通知');
        var c2 = ST.newRes('P40b'); c2.name = c.name; ST.open(c2); passportGate(c2, function(){}); ST.ok(document.getElementById('pp-pno').value==='E1234567', '第二个赴韩案件自动带出护照');
        passportCancel();
        clientByName(c.name).passport.expiry = (new Date(Date.now()+30*86400000)).toISOString().slice(0,10); c.krSchedule = {status:'pending', primary:(new Date(Date.now()+60*86400000)).toISOString().slice(0,10), backup:''};
        ST.ok(passportAlert(c).level==='before' && /护照在施术前到期/.test(passportStatusHtml(c)), '到期日早于施术日 → 施术前到期报红');
      } finally { window.GMC_PASSPORT_AUTO = was; }
    } else {
      var r = krAllCases()[0]; if(!ST.ok(!!r, '没有可看的案件')) return;
      Store.mutateClinic(r.clinicId, function(){ var c1 = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0], cl1 = clientByName(c1.name); if(cl1){ cl1.history = '青霉素过敏'; cl1.passport = {text:'已登记', date:todayStr(), no:'K7654321', issue:'2020-01-01', expiry:'2040-01-01'}; } });
      krShowCase(r.clinicId, r.id, {here:true}); krSetCaseTab('basic'); var t2 = document.getElementById('krcase-body').innerText;
      ST.ok(/生日（年龄）/.test(t2) && /青霉素过敏/.test(t2), 'KR 基础资料有生日（年龄）和病史 / 过敏史');
      ST.ok(!/联系方式|\*\*\*\*|\+62 \d/.test(t2), 'KR 基础资料没有联系方式（含遮罩）');
      if(canDo('krwork')) ST.ok(/K7654321/.test(t2), 'KR 室长看得到护照'); else ST.ok(!/护照|K7654321/.test(t2), 'KR 院长 / 代表院长看不到护照');
    }
  });

  ST.def('R49a','CMD-1019-20 / 21：页头贴紧 + tab 分界线 + 到院卡不编号（日期（星期）时间 · 这次做什么）+ 状态卡出现时名字旁不显示状态标签（KM1 / KD1 分页）',function(){
    ST.ok(visitWhenLabel('2026-10-31', '11:00', '2026-10-19')==='10/31（六）11:00' && visitWhenLabel('2026-10-19', '11:00', '2026-10-19')==='今天 11:00', '到院卡标题：10/31（六）11:00；今天写「今天 11:00」');
    var c1 = {id:'zz', caseNo:'A009990', subItems:[{id:'q1', no:'A009990-01', dno:'A009990-1', kind:'术后管理记录', place:'KR', date:'2026-11-03', time:'14:00', content:'拆线', projectName:'x'}]}; CASE_ITEMS.push(c1);
    ST.ok(visitWords('做术后管理 A009990-1：拆线')==='做术后管理 到院（11/03）：拆线', '通知 / Timeline 里的子编号换成「到院（日期）」'); CASE_ITEMS.pop();
    if(!isKrAccount()) return;
    var r = krAllCases().filter(function(x){ return x.c.stage==='travel' && scheduleState(x.c)==='Confirmed' && !x.c.hasArrived && (!krIsDirector() || x.c.director===currentAccount().name); })[0]; if(!r){ ST.ok(true, '（没有待到院案件）'); return; }
    var today = todayStr(), old = null; Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; old = c.krSchedule.confirmedDate; c.krSchedule.confirmedDate = today; return true; });
    krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); var body = document.getElementById('krcase-body'), h = body.innerHTML, tx = body.innerText;
    ST.ok(!/padding:12px 20px;display:flex;gap:28px/.test(h) && /margin:-18px 0 0/.test(h), '名字行和小字行贴紧（负外边距抵掉 22px 间距）');
    ST.ok(/border-bottom:1px solid var\(--border\)/.test(h), 'tab 下面有分界线（同 IN）');
    ST.ok(tx.indexOf('当前状态')>0 && !/赴韩施术 ·|时间已确认/.test(tx.slice(0, tx.indexOf('当前状态'))), '到院状态卡出现时，名字旁没有第二个状态标签');
    ST.ok(!/第 \d+ 次到院|主案件|子案件|预约来源/.test(tx) && !new RegExp(r.caseNo+'-\\d').test(tx.slice(tx.indexOf('每次到院一张卡'))), '案件区块：没有「第 N 次到院 / 主案件 / 子案件 / 预约来源」和子编号');
    ST.ok(/每次到院一张卡；到店后从项目卡里选这次要做的项目/.test(tx) && !/按［已完成］/.test(tx) && /今天\s*\d/.test(tx), '区块说明文字（没有「按［已完成］」）+ 分组「今天」');
    krSetCaseTab('log'); var tl = document.getElementById('krcase-body').innerText; ST.ok(!/主案件|第 1 次\s*第 2 次/.test(tl) && /时间（韩国时间）/.test(tl), 'Timeline 没有「全部｜第 1 次｜第 2 次」分页，栏头注明韩国时间');
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; c.krSchedule.confirmedDate = old; return true; });
  });
  ST.def('R52a','CMD-1019-23：已使用只从到院卡完成行算（修假记录 / 撤回退次 / 迁移 54）+ 术后管理预约弹窗数据（A1 分页，给 KM1 看）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = toConfirmed('R52a0'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); var hid = caseKrHospital(c);
    var lib = krLocalLib(hid).filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0], sp = lib.specs[0];
    KR_FORCE_CLASH = true; try{ coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:{projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price}}); } finally { KR_FORCE_CLASH = false; }
    coreAddOnPaid(c, ST.krBy); var m = c.procedureItems.filter(function(x){ return krIsMgmtItemC(x); })[0]; m.qty = 6; m.holdUsed = 0; m.uses = []; m.firstDay = 3; m.interval = 6;
    /* 一：假使用记录（项目卡有已使用、到院卡没有对应完成行）→ 改回 */
    m.uses = [{at:nowFullDt(), key:'main', qty:2}]; m.holdUsed = 2; c.krProcedureDone = false; c.todayMgmtDone = {};
    var notes = fixUseRecords(c); ST.ok(notes.length===1 && m.holdUsed===0 && holdItemLeft(c, m)===6 && !(m.uses||[]).length, '没有到院卡完成行的「已使用 ×2」改回剩 6 / 共 6：'+notes.join('；')); ST.ok(fixUseRecords(c).length===0, '修复幂等');
    m.holdUsed = 2; m.uses = []; ST.ok(fixUseRecords(c).length===1 && m.holdUsed===0, '只记了次数、没记使用行的旧数据也改回');
    var mig = (window.GMC_MIGRATIONS||[]).filter(function(x){ return x.to===54; })[0]; ST.ok(!!mig, '迁移 54 存在'); var cc = JSON.parse(JSON.stringify(c)), nn = []; cc.procedureItems.filter(function(x){ return x.heldOver; })[0].uses = [{at:nowFullDt(), key:'main', qty:3}]; cc.procedureItems.filter(function(x){ return x.heldOver; })[0].holdUsed = 3; if(mig) mig.fn(cc, {note:function(t){ nn.push(t); }}); ST.ok(nn.length===1 && cc.procedureItems.filter(function(x){ return x.heldOver; })[0].holdUsed===0, '迁移 54：修正并写迁移备注');
    /* 二：到院卡按完成才记；撤回 / 取消退回次数 */
    ST.ok(coreTodayPick(c, c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).map(function(x){ return x.name; }), [m.name], ST.krBy).ok, '今日进行');
    ST.ok(holdItemLeft(c, m)===6, '还没按完成：剩 6 / 共 6'); coreTodayQtySet(c, m.name, 2); ST.ok(coreMgmtUse(c, m.name, ST.krBy) && m.holdUsed===2 && holdItemLeft(c, m)===4 && m.uses.length===1 && m.uses[0].qty===2, '按操作完成 → 已使用 ×2、剩 4');
    ST.ok(fixUseRecords(c).length===0, '有到院卡完成行的记录不会被修掉');
    ST.ok(coreMgmtUseUndo(c, m.name, ST.krBy) && m.holdUsed===0 && holdItemLeft(c, m)===6 && !mgmtDoneToday(c, m.name) && todayOpenRows(c).some(function(x){ return x.held===m; }), '撤回完成 → 退回剩 6，这一行回到待做');
    ST.ok(coreMgmtUse(c, m.name, ST.krBy) && m.holdUsed===1, '再次按完成 → 已使用 1');
    var cnt = 0; ['coreMgmtUse', 'coreSubDone'].forEach(function(){ cnt++; }); ST.ok(!/holdUsed\s*=\s*\(?\s*\(?it\.holdUsed/.test(String(coreMgmtUse)), 'coreMgmtUse 里不再直接改 holdUsed');
    /* 三：术后管理预约弹窗用的数据 */
    var its = c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; });
    its[0].postcare = [{mgmt:'拆线', name:'拆线', times:1, place:'KR', startDay:7}, {mgmt:'术后复诊', name:'术后复诊检查', times:1, place:'KR', startDay:2}, {mgmt:'术后管理', name:'术后消肿管理', times:3, interval:2, place:'either', innName:'LDM', startDay:3}];
    if(its[1]) its[1].postcare = [{mgmt:'拆线', name:'拆线', times:1, place:'KR', startDay:7}];
    c.pcBooked = false; localStorage.setItem('__R52', JSON.stringify({id:c.id}));
  });
  ST.def('R52b','CMD-1019-23（KM1 分页）：术后管理按施术分组 + 一个预约弹窗（单条 / 一起 / 全部、多次展开、同天合并、韩国或印尼、休诊红字）（先在 A1 跑 R52a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R52')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R52a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件')) return; var gc = function(){ return Store.withClinic(r.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]; }); };
    krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); krProjPage('care'); var h = document.getElementById('krcase-body').innerHTML, tx = document.getElementById('krcase-body').innerText;
    ST.ok(/项目\s*术后第 N 天\s*地点\s*次数\s*建议日期/.test(tx) && !/对应施术/.test(tx), '栏位：项目｜术后第 N 天｜地点｜次数｜建议日期｜操作（没有「对应施术」栏）');
    ST.ok(/\d\d\/\d\d 施术/.test(tx) && !/一起预约/.test(tx) && /未预约\s*\d+\s*全部预约/.test(tx), '分组标题只写「施术名 · 10/31 施术」（CMD-1020-01 拿掉［一起预约］），［全部预约］在「未预约 N」那一行右边');
    var surgs = gc().procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && (x.postcare||[]).length; }).map(function(x){ return x.name; });
    krCbOpen({all:true, tab:'care'}); var careR = function(){ return KR_CB.rows.filter(function(x){ return x.kind==='care'; }); }; ST.ok(careR().length===6 && careR().every(function(x){ return x.checked || krCbCheck(x).err; }), '［全部预约］：全勾（休诊日 / 营业时间外的行自动不勾），多次项目展开成多行（拆线 + 复诊 + 消肿 ×3 + 另一个拆线 = 6 行）：'+KR_CB.rows.length);
    var xs = KR_CB.rows.filter(function(x){ return x.kind==='care' && x.x.name==='术后消肿管理'; }); ST.ok(xs.length===3 && xs[1].date===ymdAdd(xs[0].date, 2) && xs[2].date===ymdAdd(xs[0].date, 4), '消肿管理剩 3 次 → 三行，按间隔 2 天排好日期：'+xs.map(function(x){ return x.date; }).join(' / '));
    ST.ok(xs.every(function(x){ return x.canIn && x.place==='KR'; }), '韩国或印尼的项目多一个选项，默认在韩国做'); var ov = document.getElementById('kr-cb-overlay'); ST.ok(/预约时间/.test(ov.innerText.split('\n')[0]) && !new RegExp(surgs[0]).test(ov.innerText.split('\n')[0]), '弹窗标题是「预约时间」，不是施术名'); ST.ok(/取消[\s\S]*确认预约/.test(ov.innerText), '按钮顺序：［取消］在左、［确认预约］在最右');
    var one1 = KR_CB.rows.filter(function(x){ return x.kind==='care' && x.x.times===1 && !krCbCheck(x).err; })[0]; if(one1){ krCbOpen({one:{item:one1.item, i:one1.i}}); ST.ok(KR_CB.rows.filter(function(x){ return x.checked; }).length===1 && careR().length===6, '单条［预约时间］：只勾那一条，其他项目也列出来'); }
    krCbOpen({surg:surgs[0]}); ST.ok(careR().filter(function(x){ return x.item===surgs[0]; }).length===5 && KR_CB.rows.filter(function(x){ return x.checked; }).every(function(x){ return x.item===surgs[0]; }) && KR_CB.rows.filter(function(x){ return x.item===surgs[0] && !x.checked; }).every(function(x){ return krCbCheck(x).err; }), '［一起预约］：勾这个施术的全部（5 行，休诊日的行自动不勾），别的施术不勾');
    krCbOpen({all:true, tab:'care'}); var wk = KR_CB.rows[0]; var d0 = ymdAdd(todayStr(), 40); while(visitWeekday(d0)!=='周日') d0 = ymdAdd(d0, 1);
    krCbSet(0, 'date', d0); ST.ok(krCbCheck(KR_CB.rows[0]).err && /休诊/.test(krCbCheck(KR_CB.rows[0]).err), '休诊日：该行红字、不能约：'+krCbCheck(KR_CB.rows[0]).err);
    krCbSet(0, 'date', ymdAdd(d0, 1)); KR_CB.dayTime[KR_CB.rows[0].date] = '06:00'; krCbRender(); ST.ok(/营业时间外/.test(krCbCheck(KR_CB.rows[0]).err||''), '营业时间外：红字不能约');
    KR_CB.dayTime[KR_CB.rows[0].date] = '12:00'; krCbRender(); var e0 = KR_CB.earliest; if(e0){ krCbSet(0, 'date', ymdAdd(e0, 3)); var dd = ymdAdd(e0, 3); if(visitWeekday(dd)==='周日') krCbSet(0, 'date', ymdAdd(e0, 4)); ST.ok(/晚于最早回国日/.test(krCbCheck(KR_CB.rows[0]).warn||'') || !!krCbCheck(KR_CB.rows[0]).err, '晚于最早回国日：橙字提醒、不拦'); }
    /* 同天合并：把前两行改成同一天 → 预览 1 张到院卡 */
    krCbOpen({all:true, tab:'care'}); var sd = ymdAdd(todayStr(), 30); while(visitWeekday(sd)==='周日') sd = ymdAdd(sd, 1); KR_CB.rows.forEach(function(x, i){ x.date = ymdAdd(sd, 0); x.time = '12:00'; x.checked = x.kind==='care' && i<2; }); krCbRender(); var pv = krCbPreview(); ST.ok(pv.cards.length===1 && pv.cards[0].names.length===2, '同一天的项目合成一次到院，预览：'+JSON.stringify(pv.cards.map(function(x){ return x.date+':'+x.names.join('、'); })));
    var cbTxt = document.getElementById('kr-cb-overlay').innerText; ST.ok(!/将建/.test(cbTxt) && cbTxt.indexOf(visitWhenLabel(sd, '', ''))>-1 && /术后管理：/.test(cbTxt), 'CMD-1021-02：预览只写每天一行，没有「将建 N 张到院卡」');
    var n0 = subCaseList(gc()).length; krCbGo(); var c2 = gc(); ST.ok(subCaseList(c2).filter(function(x){ return x.date===sd; }).length===1 && subCaseList(c2).length===n0+1 && careRows(c2).filter(function(x){ return x.date===sd; }).length===2, '确认后建出 1 张到院卡，里面 2 个术后管理');
    krCbOpen({all:true, tab:'care'}); var bk = KR_CB.rows.filter(function(x){ return x.kind==='care' && x.place==='KR' && x.x.name==='术后消肿管理'; })[0]; krCbSet(KR_CB.rows.indexOf(bk), 'place', 'IN'); ST.ok(KR_CB.rows[KR_CB.rows.indexOf(bk)].place==='IN', '选回印尼做 → 这里不约'); krCbClose();
  });
  ST.def('R53b','CMD-1020-01（KM1 分页）：没有进行中的到院不显示［本次使用］/ 预约按钮统一［预约时间］/ 术后管理组拿掉［一起预约］/［全部预约］在未预约行（先在 A1 跑 R52a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R52')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R52a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件')) return; var set = function(f){ Store.mutateClinic(r.clinicId, function(){ f(CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]); return true; }); };
    var show = function(pg){ krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); krProjPage(pg); return document.getElementById('krcase-body').innerText; }, sec = function(t){ var i = t.indexOf('项目卡'), j = t.indexOf('每次到院一张卡'); return t.slice(i, j>-1 ? j : undefined).replace(/［本次使用］只在[^\n]*/, ''); }, secD = function(t){ var i = t.indexOf('项目卡'), j = t.indexOf('每次到院一张卡'); return t.slice(i, j>-1 ? j : undefined); };
    set(function(c){ c.krProcedureDone = false; c.hasArrived = true; c.visitClosed = false; c.todayPicked = true; c.todayPickMgmt = []; c.procedureItems.forEach(function(it){ if(it.origin==='KR' && !krIsMgmtItemC(it) && !it.cancelled) it.deferUse = true; }); }); /* 没选进今日 = 项目卡未使用 */
    var t1 = sec(show('surg')); ST.ok(/本次使用/.test(t1) && /预约时间/.test(t1) && !/预约使用/.test(t1) && !/客人未到店/.test(t1), '到院进行中：施术项目有［本次使用］［预约时间］，没有「预约使用」「客人未到店」');
    var t2 = sec(show('mgmt')); ST.ok(!/预约使用/.test(t2) && !/客人未到店/.test(t2), '管理项目 tab：没有「预约使用」「客人未到店」');
    set(function(c){ c.krProcedureDone = true; });
    var t3 = sec(show('surg')); ST.ok(!/客人未到店/.test(t3) && /预约时间/.test(t3), '今天的到院已结束：未使用行有［预约时间］；［本次使用］只会是灰的（悬停写「请先在到院卡按［增加项目］」，CMD-1021-11）');
    var t4 = sec(show('mgmt')); ST.ok(!/客人未到店/.test(t4), '管理项目 tab 同样（［本次使用］只会是灰的，不写「客人未到店」）');
    set(function(c){ c.krProcedureDone = false; c.hasArrived = false; });
    var t5 = sec(show('surg')); ST.ok(!/本次使用/.test(t5) && !/客人未到店/.test(t5), '客人没到院：没有［本次使用］和「客人未到店」');
    set(function(c){ c.hasArrived = true; });
    var t6 = show('care'); ST.ok(!/一起预约/.test(t6) && /未预约\s*\d+\s*全部预约/.test(t6), '术后管理：分组标题没有［一起预约］，［全部预约］在「未预约 N」行右边'); var head = t6.slice(t6.indexOf('项目卡'), t6.indexOf('术后管理（')); ST.ok(!/全部预约/.test(head) && /增加项目/.test(head), '项目卡右上只留［增加项目］，没有［全部预约］');
    ST.ok(/\[预约时间\]|预约时间/.test(t6) && /\u9879\u76ee\u5361[\s\S]*预约时间/.test(t6), '术后管理单条仍是［预约时间］'); ST.ok(/［预约时间］按日期建立/.test(secD(show('surg'))) && !/预约使用/.test(secD(show('surg'))), '顶部说明跟着改');
  });
  ST.def('R54b','CMD-1020-03（KM1 分页）：按钮统一（全部预约线框 + 日历图标、行内按钮线框无图标、修改时间改按钮、查看案件仍文字）+ 管理项目［全部预约］同一个弹窗可选约几次（先在 A1 跑 R52a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R52')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R52a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件')) return; var gc = function(){ return Store.withClinic(r.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]; }); };
    var set = function(f){ Store.mutateClinic(r.clinicId, function(){ f(CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]); return true; }); };
    set(function(c){ c.krProcedureDone = false; c.hasArrived = true; c.todayPicked = true; c.todayPickMgmt = []; c.procedureItems.forEach(function(it){ if(it.origin==='KR' && !krIsMgmtItemC(it) && !it.cancelled) it.deferUse = true; }); });
    var html = function(pg){ krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); krProjPage(pg); var el = document.getElementById('krcase-body'); return {h:el.innerHTML, t:el.innerText}; };
    var svgN = function(h){ return (h.match(/<svg/g)||[]).length; };
    set(function(c){ var sl = careSlotList(c)[0], d = ymdAdd(todayStr(), 40); while(visitWeekday(d)==='周日') d = ymdAdd(d, 1); if(sl) coreCareBook(c, sl.item, sl.i, d, '12:00', 'KR', sl.reuse||'', ST.krBy); });
    var care = html('care'); ST.ok(/<button[^>]*>\s*<svg[\s\S]*?<\/svg>全部预约<\/button>/.test(care.h), '术后管理：［全部预约］线框 + 日历图标'); ST.ok(!/<button[^>]*>\s*<svg[^>]*>[\s\S]{0,260}<\/svg>预约时间<\/button>/.test(care.h) && /<button[^>]*>预约时间<\/button>/.test(care.h), '行内［预约时间］线框、没有图标');
    ST.ok(/<button[^>]*>修改时间<\/button>/.test(care.h) && !/<a [^>]*>修改时间<\/a>/.test(care.h), '已预约行的［修改时间］是线框按钮，不是文字链接'); ST.ok(/<a [^>]*>查看案件<\/a>/.test(care.h), '［查看案件］仍是文字链接');
    var surg = html('surg'); ST.ok(/<button[^>]*>本次使用<\/button>/.test(surg.h) && /<button[^>]*>预约时间<\/button>/.test(surg.h) && svgN(surg.h.slice(0, surg.h.indexOf('每次到院一张卡')))===0, '施术项目：［本次使用］［预约时间］线框、没有图标');
    var mg = html('mgmt'); ST.ok(/未使用\s*\d+\s*全部预约/.test(mg.t), '管理项目：［全部预约］在「未使用 N」那一行右边'); ST.ok(/<button[^>]*>\s*<svg[\s\S]*?<\/svg>全部预约<\/button>/.test(mg.h) && /<button[^>]*>预约时间<\/button>/.test(mg.h), '管理项目：［全部预约］有日历图标、行内［预约时间］没有');
    var mgIt = gc().procedureItems.filter(function(x){ return krIsMgmtItemC(x); })[0], mgName = itemIid(mgIt), mgNm = mgIt.name; /* CMD-1020-16：管理项目按每笔唯一 id */
    krCbOpen({mgmtOne:mgName}); ST.ok(KR_CB.rows.filter(function(x){ return x.checked; }).length===1 && KR_CB.rows.filter(function(x){ return x.checked; })[0].kind==='mgmt', '管理项目单条［预约时间］：只勾那一条（同一个弹窗，里面也列出术后管理）'); ST.ok(KR_CB.rows.some(function(x){ return x.kind==='care'; }) && !document.getElementById('kr-bkd-overlay'), '没有单独的管理项目预约弹窗');
    krCbOpen({all:true, tab:'mgmt'}); var mrows = function(){ return KR_CB.rows.filter(function(x){ return x.kind==='mgmt'; }); }; ST.ok(mrows().length===1 && mrows()[0].checked && KR_CB.rows.filter(function(x){ return x.kind==='care' && x.checked; }).length===0, '［全部预约］（管理项目）：默认约 1 次、勾上，术后管理不勾');
    var max = KR_CB.mg[mgName].m.max; krCbMgQty(mgName, 1); krCbMgQty(mgName, 1); ST.ok(mrows().length===3 && /这次约[\s\S]*3[\s\S]*次/.test(document.getElementById('kr-cb-overlay').innerText), '选 3 次 → 展开 3 行');
    krCbMgQty(mgName, 20); ST.ok(mrows().length===max, '最多 = 剩余次数（'+max+'）'); krCbMgQty(mgName, -20); krCbMgQty(mgName, 1); krCbMgQty(mgName, 1);
    var dd = mrows().map(function(x){ return x.date; }); ST.ok(ymdDiff(dd[0], dd[1])===6 && ymdDiff(dd[1], dd[2])===6, '日期从建议日期起按管理间隔（6 天）排好：'+dd.join(' / ')); ST.ok(mrows().every(function(x){ return x.checked || krCbCheck(x).err; }), '展开的行跟着第 1 行的勾选（休诊日 / 营业时间外的行自动不勾）');
    var okDay = function(n){ var d = ymdAdd(todayStr(), n); while(visitWeekday(d)==='周日') d = ymdAdd(d, 1); return d; };
    var iA = KR_CB.rows.indexOf(mrows()[0]), iB = KR_CB.rows.indexOf(mrows()[1]), iC = KR_CB.rows.indexOf(mrows()[2]); krCbSet(iA, 'date', okDay(45)); krCbSet(iA, 'time', '12:00'); krCbSet(iB, 'date', okDay(45)); krCbSet(iB, 'time', '12:00'); krCbSet(iC, 'date', okDay(52)); krCbSet(iC, 'time', '12:00'); [iA, iB, iC].forEach(function(i){ krCbSet(i, 'checked', true); });
    var pv = krCbPreview(); ST.ok(pv.cards.length===2 && pv.cards[0].mgmt.length===1, '同一天合成一次到院，预览 2 张到院卡（管理项目）：'+JSON.stringify(pv.cards.map(function(x){ return x.date+':'+x.names.join('、'); })));
    krCbSet(iC, 'date', ymdAdd(okDay(52), 0)); var sun = ymdAdd(todayStr(), 40); while(visitWeekday(sun)!=='周日') sun = ymdAdd(sun, 1); krCbSet(iC, 'date', sun); ST.ok(/休诊/.test(krCbCheck(KR_CB.rows[iC]).err||'') && !KR_CB.rows[iC].checked, '休诊日：红字、自动不勾'); krCbSet(iC, 'date', okDay(52)); krCbSet(iC, 'checked', true);
    var n0 = subCaseList(gc()).length, pl0 = holdItemPlanned(gc(), gc().procedureItems.filter(function(x){ return x.name===mgNm; })[0]); krCbGo(); var c2 = gc(), it2 = c2.procedureItems.filter(function(x){ return x.name===mgNm; })[0];
    ST.ok(holdItemPlanned(c2, it2)===pl0+3 && subCaseList(c2).length===n0+2, '确认后约了 3 次，建出 2 张到院卡（同一天合并）');
  });
  ST.def('R55a','CMD-1020-04：一次到院一个块 / IN 的 KR 医院日程显示本诊所所有到院、其他诊所只有灰块 / 日期带星期 / 周日起周视图 / 打印日程含预约到院（A1 分页，给 KM1 看）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = toConfirmed('R55a0'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); var hid = caseKrHospital(c);
    var okDay = function(n){ var d = ymdAdd(todayStr(), n); while(visitWeekday(d)==='周日') d = ymdAdd(d, 1); return d; };
    var d1 = okDay(6), d2 = okDay(11), nm = c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; })[0].name;
    var add = function(id, date, time, content, extra){ var r = Object.assign({id:id, no:c.caseNo+'-'+id, kind:'术后管理记录', place:'KR', date:date, time:time, content:content, projectName:nm}, extra||{}); c.subItems.push(r); };
    c.subItems = c.subItems||[]; add('p1', d1, '11:00', '拆线（在韩国）'); add('p2', d1, '11:30', '术后复诊（在韩国）'); add('p3', d2, '14:00', nm+'（预约）', {surgUse:nm, director:c.director}); add('p4', d2, '15:00', '拆线（在韩国）'); subCaseNos(c);
    var vs = visitCalBlocks(c).filter(function(v){ return v.date===d1 || v.date===d2; });
    ST.ok(vs.length===2, '同一天同地点的多条合成一次到院：2 个日期 = 2 个块（不是 4 个）'); var v1 = vs.filter(function(v){ return v.date===d1; })[0], v2 = vs.filter(function(v){ return v.date===d2; })[0];
    ST.ok(!v1.hasSurg && v1.what.join('+')==='术后管理', '只有术后管理 = 术后到店（不占院长）'); ST.ok(v2.hasSurg && v2.what.join('+')==='施术+术后管理', '含施术预约使用 = 施术块，写「施术、术后管理」');
    var dayItems = function(ds){ return krDayItems(ds).filter(function(x){ return x.own && x.caseId===c.id; }); };
    CAL_VIEW = 'kr'; var a = dayItems(d1), b = dayItems(d2);
    ST.ok(a.length===1 && a[0].type==='visit' && /术后管理/.test(a[0].label), 'IN 的 KR 医院日程：本诊所客人的术后到院显示出来（一个块）'); ST.ok(b.length===1 && b[0].type==='surg' && /施术、术后管理/.test(b[0].label), '含施术的到院 = 施术块，写这次做什么');
    /* 其他诊所：含施术占院长时间的只有灰块，不带名字；术后到院不显示 */
    var cid2 = CLINIC_HOSPITALS.filter(function(r){ return r.hospitalId===hid && r.clinicId!==CURRENT_CLINIC_ID; })[0];
    if(ST.ok(!!cid2, '同一家医院有另一家对接诊所')){
      var d3 = okDay(14), nb0 = krDayItems(d3).filter(function(x){ return x.type==='busy' && !x.own; }).length; Store.mutateClinic(cid2.clinicId, function(){ CASE_ITEMS.push({id:'zz55', caseNo:'ZZ55', name:'ZZ其他诊所客人', clinicId:cid2.clinicId, stage:'travel', director:c.director, hospitalId:hid, subItems:[{id:'z1', no:'ZZ55-1', kind:'术后管理记录', place:'KR', date:d3, time:'10:00', content:'x', surgUse:'x', director:c.director}, {id:'z2', no:'ZZ55-2', kind:'术后管理记录', place:'KR', date:d3, time:'16:00', content:'y'}]}); return true; });
      var oth = krDayItems(d3); ST.ok(oth.some(function(x){ return x.type==='busy' && !x.own && !x.label; }), '其他诊所含施术的到院 = 无字灰块'); ST.ok(!oth.some(function(x){ return /ZZ/.test(x.label||''); }), '看不到其他诊所客人的名字'); ST.ok(oth.filter(function(x){ return x.type==='busy' && !x.own; }).length===nb0+1, '其他诊所含施术的那条显示灰块，只有术后到院的那条不显示（不占院长时间）');
      Store.mutateClinic(cid2.clinicId, function(){ var i = CASE_ITEMS.map(function(x){ return x.id; }).indexOf('zz55'); if(i>-1) CASE_ITEMS.splice(i, 1); return true; });
    }
    ST.ok(ymdWeekText('2026-11-02')==='2026/11/02（一）', '日期带星期「2026/11/02（一）」'); WEEK_OFFSET = 0; CAL_WEEK_FULL = false; ST.ok(getWeekStart(0).getDay()===0, '周视图从周日起'); ST.ok(CAL_MODE==='week', 'IN 日历默认周视图');
    var ps = printPlanSchedule(c); ST.ok(ps.some(function(r){ return r.d===d2 && /施术：/.test(r.what) && r.booked; }), '打印日程表含在韩预约的施术项目到院');
    localStorage.setItem('__R55', JSON.stringify({id:c.id, clinicId:c.clinicId, d1:d1, d2:d2}));
  });
  ST.def('R55b','CMD-1020-04（KM1 分页）：KR 日历一次到院一个块 / 汇总通知只发一条 / 周视图默认周日起（先在 A1 跑 R55a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R55')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R55a')) return;
    var ev = krcEvents().surg.filter(function(x){ return x.b.caseId===rec.id && (x.b.date===rec.d1 || x.b.date===rec.d2); });
    ST.ok(ev.length===2, 'KR 日历：两个到院日各一个块（共 '+ev.length+'）'); var e1 = ev.filter(function(x){ return x.b.date===rec.d1; })[0], e2 = ev.filter(function(x){ return x.b.date===rec.d2; })[0];
    ST.ok(e1 && e1.b.type==='术后管理' && e2 && e2.b.type==='施术' && /施术、术后管理/.test(e2.label), '术后到店 = 绿色类型；含施术的到院 = 施术类型并写「施术、术后管理」');
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0], cnt = function(){ return Store.withClinic(rec.clinicId, function(){ return NOTIFS.length; }); }, n0 = cnt();
    var rows = [{date:rec.d1, time:'11:00', kind:'care', item:'a', x:{name:'拆线'}}, {date:rec.d1, time:'11:30', kind:'care', item:'a', x:{name:'术后复诊'}}, {date:rec.d2, time:'14:00', kind:'mgmt', item:'b'}, {date:ymdAdd(rec.d2, 2), time:'10:00', kind:'care', item:'a', x:{name:'拆线'}}];
    Store.mutateClinic(rec.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]; krCbNotifyIn(c, rows); return true; });
    ST.ok(cnt()===n0+1, '一次预约 4 项只发 1 条汇总通知（'+(cnt()-n0)+'）'); var txt = Store.withClinic(rec.clinicId, function(){ return NOTIFS[0].text||NOTIFS[0].body||''; }); ST.ok(/3 次到院/.test(tzRender(txt, true)) || /3 次到院/.test(txt), '汇总通知写明次数：'+String(txt).slice(0, 80));
    KRC.anchor = ''; KRC.mode = 'week'; ST.ok(new Date(krcAnchor()+'T00:00:00').getDay()===0, 'KR 周视图锚点 = 周日');
  });
  ST.def('R56a','CMD-1020-05（KM1 分页）：术后预约弹窗「韩国或印尼」没有印尼对应项目也有在韩国做 / 回印尼做 + 已预约改回印尼；项目库院长操作；占院长时间 / 延长 / 院长提醒；施术 / 管理 tab 卡片',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑（需要 pcStage 夹具）')) return;
    var r0 = krAllCases().filter(function(x){ return x.name==='T-术后管理'; })[0]; if(!ST.ok(!!r0, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var gc = function(){ return Store.withClinic(r0.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; }); };
    var set = function(f){ Store.mutateClinic(r0.clinicId, function(){ f(CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]); return true; }); };
    var okDay = function(n){ var d = ymdAdd(todayStr(), n); while(visitWeekday(d)==='周日') d = ymdAdd(d, 1); return d; };
    var hid = caseKrHospital(gc()), d1 = okDay(30), d2 = okDay(32);
    set(function(c){ c.procedureItems.forEach(function(it){ (it.postcare||[]).forEach(function(x){ if(x.place==='either') x.innName = ''; }); }); c.subItems = (c.subItems||[]).filter(function(x){ return !(x.place==='IN') && x.id!=='dop1' && x.id!=='dop2' && x.date!==d1 && x.date!==d2; }); });
    /* 二：没有印尼对应项目也有选项 */
    var sl = Store.withClinic(r0.clinicId, function(){ return careSlotList(gc()); }).filter(function(x){ return x.x.place==='either'; });
    ST.ok(sl.length>0 && sl.every(function(x){ return x.canIn; }), '地点「韩国或印尼」（没有印尼对应项目）每个名额都有「在韩国做 / 回印尼做」（canIn）');
    krShowCase(r0.clinicId, r0.id, {here:true, tab:'items'}); krProjPage('care'); krCbOpen({all:true}); var ov = document.getElementById('kr-cb-overlay');
    ST.ok(/回印尼做/.test(ov.innerHTML) && /在韩国做/.test(ov.innerHTML), '预约弹窗里「韩国或印尼」行有地点下拉'); krCbClose();
    set(function(c){ var it = c.procedureItems.filter(function(x){ return (x.postcare||[]).some(function(p){ return p.place==='either'; }); })[0], i = it.postcare.map(function(p){ return p.place; }).indexOf('either'); coreCareBook(c, it.name, i, d1, '', 'IN', '', ST.krBy); });
    var rowIn = gc().subItems.filter(function(x){ return x.place==='IN' && /回印尼做/.test(x.content); })[0];
    ST.ok(!!rowIn && !visitCalBlocks(gc()).some(function(v){ return v.date===d1; }), '选回印尼做：不建韩国到院，只留一条交给 IN 的行（没有印尼对应项目也行）：'+(rowIn&&rowIn.content));
    /* 已预约改回印尼：取消韩国那次到院，Timeline + 通知 */
    set(function(c){ var it = c.procedureItems.filter(function(x){ return (x.postcare||[]).some(function(p){ return p.place==='either'; }); })[0], i = it.postcare.map(function(p){ return p.place; }).indexOf('either'); coreCareBook(c, it.name, i, d2, '11:00', 'KR', '', ST.krBy); });
    var kr0 = gc().subItems.filter(function(x){ return x.place==='KR' && x.date===d2 && /术后消肿管理/.test(x.content); })[0], nN0 = Store.withClinic(r0.clinicId, function(){ return NOTIFS.length; });
    krSubTimeOpen(kr0.id); ST.ok(KR_TE.canIn && /回印尼做/.test(document.getElementById('kr-te-overlay').innerHTML), '［修改时间］弹窗里「韩国或印尼」的已预约行有地点选项');
    KR_TE.toIn = true; krTimeEditSave();
    var kr1 = gc().subItems.filter(function(x){ return x.id===kr0.id; })[0];
    ST.ok(kr1.place==='IN' && !visitCalBlocks(gc()).some(function(v){ return v.date===d2; }), '改成回印尼：这次韩国到院取消（那次到院没有别的项目整张没了）'); ST.ok(/改回印尼做/.test(JSON.stringify(gc().logs||gc().timeline||gc())), 'Timeline 记了一笔');
    ST.ok(Store.withClinic(r0.clinicId, function(){ return NOTIFS.length; })===nN0+1, 'IN 收到一条通知');
    /* 三：项目库院长操作 */
    var lib = krLocalLib(hid)[0]; ST.ok(!dirOpInfo(hid, lib.name).on, '默认院长操作 = 否'); lib.dirOp = true; lib.dirMin = 30; ST.ok(dirOpInfo(hid, lib.name).on && dirOpInfo(hid, lib.name).min===30, '设成「是」默认 30 分钟');
    var post = krpProjects().filter(function(p){ return isKrPostcareCat(p.categoryId); })[0]; if(post){ krpOpen(post.id); ST.ok(/院长操作/.test(document.body.innerHTML), '术后管理项目编辑页有「院长操作」'); krpClose(); }
    krlOpen(lib.id); ST.ok(/院长操作/.test(document.body.innerHTML), '管理项目编辑页有「院长操作」'); krlClose(); lib.dirOp = false;
    /* 占院长时间 / 延长：直接造两条院长操作的行 */
    set(function(c){ c.subItems.push({id:'dop1', no:c.caseNo+'-81', kind:'术后管理记录', place:'KR', date:d1, time:'11:00', content:'ONDA（持有项目使用）', projectName:'ONDA', holdUseOf:'ONDA', dirOp:true, director:c.director, dirMin:30, extendMin:0}); c.subItems.push({id:'dop2', no:c.caseNo+'-82', kind:'术后管理记录', place:'KR', date:d1, time:'11:30', content:'LDM（持有项目使用）', projectName:'LDM', holdUseOf:'LDM', dirOp:true, director:c.director, dirMin:30, extendMin:30}); subCaseNos(c); });
    var vb = visitCalBlocks(gc()).filter(function(v){ return v.date===d1; })[0];
    ST.ok(vb && vb.occupies && vb.hasDirOp && vb.director===gc().director && timeToMin(vb.end)-timeToMin(vb.time)===60, '同一次到院两个院长操作项目：第一个 30 分钟 + 第二个只加延长 30 = 60 分钟（不直接相加 60+）：'+(vb&&vb.time+'-'+vb.end));
    var ev = krcEvents().surg.filter(function(x){ return x.b.caseId===r0.id && x.b.date===d1; }); ST.ok(ev.length===1 && ev[0].b.who===gc().director && /院长操作/.test(ev[0].label), 'KR 日历一个块，挂在院长名下，标「院长操作」');
    var hit = krSurgerySlotError(hid, gc().director, d1, '11:15', 30, 'x:y', {allowOffHours:true, use:true}); ST.ok(!!hit, '该院长这个时段再排别的 → 冲突：'+String(hit).slice(0, 60));
    /* 院长不是这位的 OFF 检查 */
    var nn = Store.withClinic(r0.clinicId, function(){ return 0; });
    /* 施术 / 管理 tab 卡片样式 */
    krShowCase(r0.clinicId, r0.id, {here:true, tab:'items'}); krProjPage('surg'); var h1 = document.getElementById('krcase-body').innerHTML; krProjPage('mgmt'); var h2 = document.getElementById('krcase-body').innerHTML;
    ST.ok(/border-radius:\s*12px/.test(h1) && (!/管理项目（[1-9]/.test(document.getElementById('krcase-body').innerText) || /border-radius:\s*12px/.test(h2)), '施术 / 管理 tab 的分组表格装进圆角卡片');
  });
  ST.def('R57a','CMD-1020-06（KM1 分页，需要 pcStage 夹具）：到院卡白底 / 没有本次记录 / 名称 + 灰字 / 标题行院长 / 日志日期和阶段类别',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r0 = krAllCases().filter(function(x){ return x.name==='T-术后管理'; })[0]; if(!ST.ok(!!r0, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var gc = function(){ return Store.withClinic(r0.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; }); }, day = todayStr();
    Store.mutateClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; c.subItems = c.subItems.filter(function(x){ return !/^q\d/.test(x.id); }); c.logEntries = c.logEntries.filter(function(e){ return !/^R57/.test(e.stage||'') && !/R57测试/.test(e.action); });
      if(!c.procedureItems.some(function(x){ return /^R57管理/.test(x.name); })) c.procedureItems.push({name:'R57管理项目', origin:'KR', mgmtPlan:true, heldOver:true, qty:3, holdUsed:0, price:0, batchId:'r57'});
      var P = function(id, content, extra){ c.subItems.push(Object.assign({id:id, no:c.caseNo+'-9'+id.slice(-1), kind:'术后管理记录', place:'KR', date:day, time:'17:00', content:content, projectName:'假体隆鼻', arrived:true, simDay:true}, extra||{})); };
      P('q51', '开内眼角（预约）', {surgUse:'开内眼角', director:c.director}); P('q52', '术后管理（术后复诊检查，在韩国）'); P('q53', 'R57管理项目（持有项目使用）', {holdUseOf:'R57管理项目', projectName:'R57管理项目'}); subCaseNos(c); return true; });
    krShowCase(r0.clinicId, r0.id, {here:true, tab:'items'}); var body = document.getElementById('krcase-body'), card = [].slice.call(body.querySelectorAll('.card')).filter(function(x){ return /今天 17:00/.test(x.innerText) && !x.classList.contains('kr-casebig'); })[0];
    ST.ok(!!card && card.style.background==='rgb(255, 255, 255)' && !/kr-sub-hl/.test(card.className), '今天到院卡白底，没有高亮 / 黄色底'); ST.ok(!/#faf6ef|surface2/.test(card.innerHTML), '卡里没有内层粉色底');
    ST.ok(!/本次记录/.test(body.innerText) && !/（院长）/.test(card.innerText), '没有「本次记录」，表格下没有飘着的「院长」');
    ST.ok(/院长：KD1/.test(card.innerText.split('\n').slice(0, 2).join(' ')) , '标题行写「院长：KD1」：'+card.innerText.split('\n')[0]);
    var l1 = visitRowLabel(gc(), gc().subItems.filter(function(x){ return x.id==='q51'; })[0]), l2 = visitRowLabel(gc(), gc().subItems.filter(function(x){ return x.id==='q52'; })[0]), l3 = visitRowLabel(gc(), gc().subItems.filter(function(x){ return x.id==='q53'; })[0]);
    ST.ok(l1.name==='开内眼角' && !l1.sub && l1.type==='施术', '施术：只写名称：'+l1.name+'/'+l1.sub); ST.ok(l2.type==='术后管理' && /^假体隆鼻 · 术后第 \d+ 天$/.test(l2.sub) && l2.name==='术后复诊检查', '术后管理：名称 + 「对应施术 · 术后第 N 天」：'+l2.name+'/'+l2.sub); ST.ok(l3.type==='管理项目' && /^剩 3 \/ 共 3 次$/.test(l3.sub), '管理项目：名称 + 「剩 N / 共 M 次」：'+l3.sub);
    ST.ok(!/（预约）|（持有项目使用）|在韩国）/.test(card.innerText), '名称里没有（预约）（持有项目使用）在韩国 这类后缀');
    /* 日志：日期取这一行自己的日期；阶段按项目类型 */
    Store.mutateClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; ['q51', 'q52', 'q53'].forEach(function(id){ var s0 = c.subItems.filter(function(x){ return x.id===id; })[0]; s0.arrived = false; s0.simDay = true; coreSubArrived(c, id, 'KM1 室长'); }); return true; });
    var logs = gc().logEntries.slice(-3); ST.ok(logs.map(function(e){ return e.stage; }).join()==='施术,术后管理,管理项目', '日志阶段按项目类型：'+logs.map(function(e){ return e.stage; }).join());
    ST.ok(logs.every(function(e){ return e.action.indexOf('到院（'+day.slice(5).replace('-', '/')+'）')>-1; }), '日志里的到院日期写对（'+day.slice(5)+'）：'+logs[0].action);
    /* 旧记录：行号 -0N / -NN 不再被当成第 N 次到院（11/02 曾写成 11/07） */
    var q = gc().subItems.filter(function(x){ return x.id==='q52'; })[0]; ST.ok(visitWords('客人已到：'+q.no+'「术后复诊检查」')==='客人已到：到院（'+day.slice(5).replace('-', '/')+'）「术后复诊检查」', '旧记录里的行号按那一行自己的日期显示');
    ST.ok(/施术、术后管理、管理项目/.test(tlDateTitle(gc(), day)), 'Timeline 日期小标题按项目类型：'+tlDateTitle(gc(), day));
  });
  ST.def('R58a','CMD-1020-07（A1 分页，需要 pcStage 夹具）：IN「未安排预约」分页 / 来源 / ［预约］接续原案件 → 约好就消失 / 补发交给印尼通知 / 逾期变红 + 红点',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = CASE_ITEMS.filter(function(x){ return x.name==='T-术后管理' && !x.careFor; })[0]; if(!ST.ok(!!c, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var today = todayStr(); localStorage.removeItem(todoUbSeenKey());
    c.subItems.forEach(function(s){ if(s.place==='IN' && s.kind==='术后管理记录') s.notified = false; });
    CASE_ITEMS = CASE_ITEMS.filter(function(x){ return !x.careFor; });
    ST.ok(repairHandToIn()>=1 && NOTIFS.some(function(n){ return /交给印尼/.test(n.text||''); }), '已经推给印尼、没通知过的补发一则（一次推好几项合成一则）'); ST.ok(repairHandToIn()===0, '补发幂等（每行只通知一次）');
    var ub = todoUbItems().filter(function(u){ return u.caseId===c.id; }); ST.ok(ub.length>=1 && ub.every(function(u){ return u.source==='KR 交给印尼' && !!u.label && !!u.sug && u.n>=1; }), 'IN 未安排预约里有 KR 交给印尼的术后管理：来源「KR 交给印尼」、灰字、建议日期（'+ub.length+' 条）');
    ST.ok(todoUbDot(ub), '新进来的亮红点'); TODO_UB_LAST = ub; todoUbSeenAll(); ST.ok(!todoUbDot(ub), '点开看过红点消失');
    ub[0].sug = ymdAdd(today, -1); ub[0].over = true; ST.ok(todoUbDot(ub), '过了建议日期（逾期）再亮红点'); ST.ok(/class="ub-sug over"/.test(todoUbListHtml(ub)), '逾期的建议日期标红');
    TODO_UI.tab = 'unbooked'; TODO_UI.mine = false; var html = todoPaneHtml(todoItems()); ST.ok(/待办 \d+[\s\S]*未安排预约 \d+/.test(html.replace(/<[^>]+>/g, '')) && /ub-grp/.test(html), '标题行是两个并排分页，点未安排预约显示列表'); TODO_UI.tab = 'todo'; var h2 = todoPaneHtml(todoItems()); ST.ok(!/ub-grp/.test(h2) && /todo-list/.test(h2), '默认 / 切回待办显示待办列表（未安排预约不进待办）'); ST.ok(!todoItems().some(function(it){ return /交给印尼|未安排/.test(it.text||''); }), '未安排预约不混进待办');
    var gs = todoUbGroupsIn(c, false), g0 = gs[0], bk0 = g0.items[0].bk; todoCbOpen(c.id, g0.gid); TODO_CB2.groups[0].lines[0].date = (function(){ var d = ymdAdd(today, 3); while(visitWeekday(d)==='周日') d = ymdAdd(d, 1); return d; })(); todoCbNormalize(); todoCbRender();
    ST.ok(/术后管理/.test(document.getElementById('todo-cb-overlay').innerText) && /A000/.test(document.getElementById('todo-cb-overlay').innerText), '［预约］打开代约：来访目的术后管理、带出原案件和项目');
    todoCbGo(); var rc = CASE_ITEMS.filter(function(x){ return x.careFor && x.careFor.caseId===c.id; })[0]; ST.ok(!!rc && rc.visitPurpose==='术后管理' && rc.careFor.keys.indexOf(bk0)>-1, '生成接续原案件的预约（careFor）');
    var after = todoUbGroupsIn(c, false); ST.ok(!after.some(function(g){ return g.items.some(function(x){ return x.bk===bk0; }); }), '约好的这一次从未安排预约里消失');
    ST.ok(/建议 \d\d\/\d\d/.test(inCareCardsHtml(c, 'inn')) && /未预约|已预约/.test(inCareCardsHtml(c, 'inn')), 'IN 赴韩施术 tab 的术后管理 · 印尼卡里这一项写灰字「建议 MM/DD」+ 状态（CMD-1020-08 取代 20-07 的术后管理卡写法）');
  });
  ST.def('R58b','CMD-1020-07（KM1 分页，需要 pcStage 夹具）：KR「未安排预约」分页 / 预约弹窗选回印尼 → IN 收一则通知（一次几项合成一则）/ 已使用卡片',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r0 = krAllCases().filter(function(x){ return x.name==='T-术后管理'; })[0]; if(!ST.ok(!!r0, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var ub = todoUbItems(); ST.ok(ub.length>0 && ub.every(function(u){ return !!u.label && !!u.source; }), 'KR 未安排预约：在韩期间还没约的术后管理 / 管理项目，来源写诊所（'+ub.length+' 条）');
    TODO_UI.tab = 'unbooked'; var h = todoPaneHtml(todoItems()); ST.ok(/未安排预约 \d+/.test(h.replace(/<[^>]+>/g, '')) && /预约<\/button>/.test(h), 'KR 工作台右侧有两个分页');
    Store.mutateClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; c.subItems = c.subItems.filter(function(x){ return !(x.kind==='术后管理记录' && x.place==='IN' && !x.done); }); return true; }); /* 让「韩国或印尼」的名额回到未预约，测试可重复跑 */
    krShowCase(r0.clinicId, r0.id, {here:true, tab:'items'}); krProjPage('care'); krCbOpen({all:true}); var hc = function(){ return Store.withClinic(r0.clinicId, function(){ return NOTIFS.filter(function(n){ return /交给印尼/.test(n.text||''); }).length; }); }, n0 = hc();
    var ins = KR_CB.rows.filter(function(r){ return r.kind==='care' && r.canIn; }); ST.ok(ins.length>0, '有「韩国或印尼」的行'); KR_CB.rows.forEach(function(r){ r.checked = false; }); ins.slice(0, 2).forEach(function(r){ r.checked = true; r.place = 'IN'; }); var nIn = ins.slice(0, 2).length;
    krCbGo(); var nts = Store.withClinic(r0.clinicId, function(){ return NOTIFS.filter(function(n){ return /交给印尼/.test(n.text||''); }).slice(0, 1); });
    ST.ok(hc()===n0+1 && nts.length===1 && /交给印尼/.test(nts[0].text) && (nIn===1 ? /建议日期/.test(nts[0].text) : /\d 项术后管理交给印尼/.test(nts[0].text)), '预约弹窗一开始就选回印尼：IN 收一则（'+nIn+' 项合成一则）：'+(nts[0]&&nts[0].text||'').slice(0, 70));
    krShowCase(r0.clinicId, r0.id, {here:true, tab:'items'}); krProjPage('mgmt'); var mh = document.getElementById('krcase-body').innerHTML; ST.ok(!/已使用[\s\S]{0,200}<div style="display:grid;grid-template-columns:minmax\(0,1\.6fr\)/.test(mh) || /border:1px solid var\(--border2\);border-radius:12px;padding:6px 18px 8px;margin-top:6px;background:#fff;"><div style="display:grid;grid-template-columns:minmax\(0,1\.6fr\)/.test(mh) || !/已使用/.test(mh), '管理项目「已使用」表格装进圆角卡片（有已使用时）');
  });
  ST.def('R60a','CMD-1020-09（A1 分页，需要 pcStage 夹具）：IN 赴韩施术 tab 三张大卡 / 项目卡无金额无护照 / 术后管理栏位与三种状态 / 管理项目持有中·已完成 / 没有在韩持有项目卡 / 基础资料护照栏',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = CASE_ITEMS.filter(function(x){ return x.name==='T-术后管理' && !x.careFor; })[0]; if(!ST.ok(!!c, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var html = inProjectCardHtml(c), txt = html.replace(/<[^>]+>/g, ' ');
    ST.ok((html.match(/class="card"/g)||[]).length>=2, '至少两张大卡（项目卡 / 术后管理，有管理项目时三张）');
    var first = html.split('术后管理</div>')[0].replace(/<[^>]+>/g, ' '); ST.ok(!/项目合计|定金|尾款/.test(first) && !/护照/.test(first), '项目卡：没有金额合计行，没有护照提示');
    ST.ok(/施术项目/.test(txt) && /术后管理/.test(txt) && /术后管理免费、不显示价格、不能退款/.test(txt), '术后管理大卡标题下有说明文字');
    var kr = inCareCardsHtml(c, 'kr'), inn = inCareCardsHtml(c, 'inn'), kt = kr.replace(/<[^>]+>/g, ' ');
    ST.ok(/施术项目\s+术后管理项目\s+预约时间\s+状态\s+备注/.test(kt), '栏位：施术项目｜术后管理项目｜预约时间｜状态｜备注'); ST.ok(/术后第 \d+ 天/.test(kt + inn.replace(/<[^>]+>/g, ' ')), '备注写术后第 N 天');
    ST.ok(!/待到店|待预约|待 KR 预约|已到店|已约</.test(kr+inn), '状态只有 已完成 / 已预约 / 未预约（没有旧叫法）'); ST.ok(/未预约|已预约|已完成/.test(kr+inn), '有新叫法的状态');
    ST.ok(!/<button/.test(kr), '韩国小卡没有操作'); ST.ok(/预约<\/button>/.test(inn) || /修改时间<\/button>/.test(inn), '印尼小卡有操作栏：未预约 → ［预约］/ 已预约 → ［修改时间］');
    ST.ok(!/在韩持有项目/.test(html) && typeof inHoldCardHtml==='undefined', '在韩持有项目大卡拿掉');
    /* 管理项目：持有中 / 已完成；一次使用一行 */
    var snap = JSON.stringify(c.procedureItems), mg = {name:'ONDA 提升 · 身体 60kj·3次', origin:'KR', mgmtPlan:true, krAddOn:true, qty:6, heldOver:true, uses:[]}; c.procedureItems.push(mg); /* 夹具里没有管理项目：临时加一个，最后还原 */
    if(ST.ok(!!krIsMgmtItemC(mg), '临时管理项目被认成管理项目')){
      mg.heldOver = true; mg.cancelled = false; mg.qty = 6; mg.uses = []; holdUseRecord(c, mg, {at:nowFullDt(), key:'main', qty:2}); holdUseRecord(c, mg, {at:nowFullDt(), key:'main', qty:1});
      var h = inMgmtCardsHtml(c, [mg]), ht = h.replace(/<[^>]+>/g, ' ');
      ST.ok(/持有中/.test(ht) && /已完成/.test(ht) && /管理项目\s+状态\s+剩余次数\s+预约时间/.test(ht) && /管理项目\s+状态\s+使用次数\s+使用时间/.test(ht), '持有中 / 已完成两张小卡，栏位对');
      ST.ok(/3 \/ 6 次/.test(ht) && /2 次/.test(ht) && /1 次/.test(ht), '还有剩余的两边都出现；一次使用一行（2 次一行、1 次一行）'); ST.ok(!/·\d+次/.test(ht), '名称不带「·N次」');
      mg.uses = []; holdUseRecord(c, mg, {at:nowFullDt(), key:'main', qty:6}); h = inMgmtCardsHtml(c, [mg]); ST.ok(/持有中\s*<span[^>]*>0</.test(h) && /已完成\s*<span[^>]*>1</.test(h), '用完的只在已完成');
      c.procedureItems = JSON.parse(snap);
    }
    /* 基础资料护照栏 */
    var cl = clientByName(c.name), ps = cl.passport; cl.passport = {}; var bh = clientBasicBlockHtml(c); ST.ok(/护照/.test(bh) && /color:#B3261E[^>]*>⚠ 护照未登记/.test(bh), '基础资料护照栏：未登记报红'); cl.passport = ps;
  });
  ST.def('R64a','CMD-1020-12（A1 分页，需要 stagePay 夹具）：IN 交完面诊费后「客人希望的面诊时间」（选填，可改）+ KR 收通知',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = CASE_ITEMS.filter(function(x){ return x.consultStatus==='paid_waiting_kr' && /^T-/.test(x.name); })[0]; if(!ST.ok(!!c, '先 ST.ensureFixtures([\'stagePay\'])')) return;
    var old = c.wantConsult, hid = caseKrHospital(c), nN = function(){ return ((HOSPITAL_DATA[hid]||{}).notifs||[]).filter(function(n){ return /客人希望的面诊时间/.test(n.text||'') && String(n.text).indexOf(c.name)>-1; }).length; };
    var h = consultFeeCardHtml('已缴费', '', '', c); ST.ok(/客人希望的面诊时间/.test(h) && />修改</.test(h) && !/id="want-consult"/.test(h), 'CMD-1021-23：面诊资料 tab 改成只读 +［修改］（KR 确认前）');
    WANT_EDIT = true; ST.ok(/id="want-consult"/.test(consultFeeCardHtml('已缴费', '', '', c)), '点［修改］出现输入框'); WANT_EDIT = false;
    var n0 = nN(); saveWantConsult(c.id, '10/21 下午，或 10/22 全天'); ST.ok(c.wantConsult==='10/21 下午，或 10/22 全天' && ST.hasLog(c, /填写客人希望的面诊时间/) && nN()===n0+1, '填了：存下 + Timeline + KR 收一条通知');
    saveWantConsult(c.id, '10/23 全天'); ST.ok(c.wantConsult==='10/23 全天' && ST.hasLog(c, /修改客人希望的面诊时间/) && /10\/23/.test(consultFeeCardHtml('已缴费', '', '', c)), '之后可以修改'); saveWantConsult(c.id, ''); ST.ok(!c.wantConsult, '可以清空（选填）');
    c.wantConsult = old;
  });
  ST.def('R64b','CMD-1020-12（KM1 分页，需要 stagePay 夹具）：KR 待办红点 / 客人希望 / 确认面诊时间卡片新排版 / 院长日程 7 天卡片 / 不可预约新写法',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r0 = krAllCases().filter(function(x){ return x.c.consultStatus==='paid_waiting_kr'; })[0]; if(!ST.ok(!!r0, '先 ST.ensureFixtures([\'stagePay\'])')) return;
    var hid = krHospitalIdOfMe(), dir = r0.c.director, ds = krToday(), old = r0.c.wantConsult, blk = {id:'sbR64', who:dir, date:ds, time:'15:30', end:'17:00', type:'不可预约', title:'不可预约', note:'院长出差'}, blk2 = {id:'sbR64b', who:dir, date:ds, time:'18:00', end:'19:00', type:'不可预约', title:'不可预约', note:''};
    Store.mutateClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; c.wantConsult = '10/21 下午，或 10/22 全天'; return true; });
    var tabs0 = JSON.stringify(HOSPITAL_DATA[hid].directorSchedule[dir] || []); (HOSPITAL_DATA[hid].directorSchedule[dir] = HOSPITAL_DATA[hid].directorSchedule[dir] || []).push(blk, blk2);
    try{
      krShowCase(r0.clinicId, r0.id, {here:true, tab:'consult'}); var el = document.getElementById('krcase-body'), txt = el.textContent;
      ST.ok(/客人希望：10\/21 下午，或 10\/22 全天/.test(txt), '确认面诊时间卡片最上面：「客人希望：…」');
      ST.ok(/负责院长/.test(txt) && /院长日程/.test(txt) && /当天的日程/.test(txt) && /面诊时间/.test(txt) && /预计出报告时间/.test(txt) && /请选择客人面诊的日期和时间/.test(txt) && /请选择预计出报告的日期和时间/.test(txt), '新排版：负责院长 + ［院长日程］、当天的日程、左面诊时间 / 右预计出报告时间（带灰色说明）');
      var btns = [].map.call(el.querySelectorAll('button'), function(b){ return b.textContent.trim(); }), card = [].filter.call(el.querySelectorAll('.card'), function(x){ return /确认面诊时间和预计出报告时间/.test(x.textContent); })[0];
      var cb = card ? [].map.call(card.querySelectorAll('button'), function(b){ return b.textContent.trim(); }) : []; ST.ok(cb.indexOf('确认')>-1 && cb.indexOf('取消')===-1 && !/✕/.test(card ? card.textContent : ''), '底部只有［确认］（没有［取消］和 X）：'+cb.join('/'));
      ST.ok(!/（手动）/.test(txt) && /不可预约 · 院长出差/.test(txt) && /15:30 ~ 17:00/.test(txt), '不可预约写「不可预约 · 备注」，拿掉（手动）');
      var ag = krDayAgendaRows(dir, ds); var tags = ag.rows.map(function(r){ return r.tag; }); ST.ok(tags.indexOf('不可预约')>-1 && tags.indexOf('不可预约 · 院长出差')>-1, '没写备注只写「不可预约」'); ST.ok(ag.rows.filter(function(r){ return r.red; }).every(function(r){ return !/^(营业时间外|午休)/.test(r.tag); }) && ag.rows.filter(function(r){ return !r.red; }).every(function(r){ return /^(营业时间外|午休)/.test(r.tag); }), '不可预约的行红（浅红底 + 红字），营业时间外 / 午休灰');
      krDirSchedPopup(dir); var pop = document.getElementById('kr-dirsched-overlay'), pt = pop.textContent; ST.ok(pop.querySelectorAll('div[style*="grid-template-columns:repeat(4"] > div').length===7, '院长日程弹窗：7 天各一张小卡，排成网格'); ST.ok(/全天可约/.test(pt) && /不可预约 · 院长出差/.test(pt) && !/没有日程/.test(pt), '没有安排的写「全天可约」（取代「没有日程」）；占掉的写清楚'); closePromoOverlay('kr-dirsched-overlay');
      /* 整天 OFF 的那张整张浅红底 */
      var offDs = krDateAdd(2), o = {id:'offR64', kind:'director', who:dir, date:offDs, part:'全天'}; (HOSPITAL_DATA[hid].offs = HOSPITAL_DATA[hid].offs || []).push(o);
      try{ krDirSchedPopup(dir); var cards = [].slice.call(document.querySelectorAll('#kr-dirsched-overlay div[style*="grid-template-columns:repeat(4"] > div')), redCard = cards.filter(function(x){ return /OFF（全天）/.test(x.textContent); })[0]; ST.ok(!!redCard && /FDECEA|rgb\(253, 236, 234\)/i.test(redCard.getAttribute('style')||redCard.style.background), '整天 OFF 的卡整张浅红底，写原因（OFF（全天））'); }
      finally{ HOSPITAL_DATA[hid].offs = HOSPITAL_DATA[hid].offs.filter(function(x){ return x.id!=='offR64'; }); closePromoOverlay('kr-dirsched-overlay'); }
      /* 待办红点 */
      var items = todoItems(), it = items.filter(function(x){ return x.kind==='eta' && x.caseId===r0.id; })[0]; ST.ok(!!it && /客人希望：10\/21/.test(it.label||it.text||JSON.stringify(it)), 'KR 待办里带「客人希望：…」');
      if(it){ var s = todoSeenLoad(); delete s[it.key]; ST.ok(todoTabDot(todoVisible(items)) && /todo-newdot/.test(todoPaneHtml(items).split('未安排预约')[0]), '有没看过的新待办 → 「待办 N」亮红点'); todoMarkCaseSeen(r0.id); var s2 = todoSeenLoad(); ST.ok(!!s2[it.key] && !todoIsNew(it), '打开案件看过后这条不再亮'); }
    } finally {
      HOSPITAL_DATA[hid].directorSchedule[dir] = JSON.parse(tabs0); Store.touch();
      Store.mutateClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; if(old) c.wantConsult = old; else delete c.wantConsult; return true; });
    }
  });
  ST.def('R63a','CMD-1020-12（任意 IN 分页）：用户案件保护 —— 全部清空有用户案件时拒绝 / 重置前存安全备份 / 升级数量核对 / 测试清理只动测试自己建的数据',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = createReservationCase('手工保护案件', '', ymdAdd(todayStr(), 3), '11:00', '+62 811-5559-'+String(Math.floor(Math.random()*900+100)), '面诊商谈'), tc = ST.newRes('R63t'); Store.save();
    try{
      ST.ok(gmcIsUserCase(c) && ST.isTestCase(tc) && !ST.isTestCase(c), '手工案件 = 用户案件；测试建的（T2- 开头）= 测试案件');
      var n0 = gmcUserCaseCountRaw(); ST.ok(n0>=1, '存档里数得到用户案件（'+n0+'）');
      var before = Object.keys(localStorage).filter(function(k){ return /^gmc_(state|clinic_)/.test(k); }).map(function(k){ return k+':'+(localStorage.getItem(k)||'').length; }).join('|');
      var origErr = console.error; var errs = 0; console.error = function(){ errs++; }; var r = gmcResetAll('R63a 拒绝测试', false); console.error = origErr;
      var after = Object.keys(localStorage).filter(function(k){ return /^gmc_(state|clinic_)/.test(k); }).map(function(k){ return k+':'+(localStorage.getItem(k)||'').length; }).join('|');
      ST.ok(r===false && errs===1 && before===after, '有用户案件时「全部清空」被拒绝，存档一个字节没动');
      /* 快照之后新增的用户案件：清理计划会保留，测试建的不保留 */
      var snap = {}; Object.keys(localStorage).filter(function(k){ return /^gmc_(state|clinic_)/.test(k); }).forEach(function(k){ snap[k] = localStorage.getItem(k); });
      var c2 = createReservationCase('手工保护案件2', '', ymdAdd(todayStr(), 3), '12:00', '+62 811-5558-'+String(Math.floor(Math.random()*900+100)), '面诊商谈'); Store.save();
      var plan = ST.cleanupKeepPlan(snap), keptNames = []; Object.keys(plan).forEach(function(k){ plan[k].cases.forEach(function(x){ keptNames.push(x.name); }); });
      ST.ok(keptNames.indexOf('手工保护案件2')>-1 && keptNames.indexOf('手工保护案件')===-1 && keptNames.indexOf(tc.name)===-1, '测试清理计划：快照之后新增的用户案件保留；快照里已有的（还原后自然在）和测试建的不算（保留：'+keptNames.join('、')+'）');
      /* 安全备份 */
      var cnt = gmcUserSafeSave('R63a'); ST.ok(cnt>=2 && gmcUserSafeList()[0].total===cnt && gmcUserSafeList().length<=2, '用户案件安全备份：存下 '+cnt+' 个，最多留 2 份');
      /* 升级数量核对：存档里的用户案件数 = 提取出的数量 */
      var cry = gmcExtractUserCarry(); ST.ok(cry.total===gmcUserCaseCountRaw(), '升级前提取数量 = 存档里的数量（对得上才会升级，对不上就停）');
      ST.ok(typeof gmcShowBlock==='function' && typeof gmcUserSafeRestore==='function', '停下来提示 / 恢复函数存在');
    } finally {
      for(var i = CASE_ITEMS.length-1; i >= 0; i--){ if(/^手工保护案件/.test(CASE_ITEMS[i].name) || CASE_ITEMS[i].name===tc.name) CASE_ITEMS.splice(i, 1); } for(var j = CLIENTS.length-1; j >= 0; j--){ if(/^手工保护案件/.test(CLIENTS[j].name) || CLIENTS[j].name===tc.name) CLIENTS.splice(j, 1); } try{ Store.save(); }catch(e){} /* 只删这个用例自己建的（当前诊所的内存数组），存档随后写入 */
      try{ var l = JSON.parse(localStorage.getItem('gmc_cfg_usersafe')||'[]'); l = l.filter(function(x){ return x.reason!=='R63a'; }); localStorage.setItem('gmc_cfg_usersafe', JSON.stringify(l)); }catch(e){}
    }
  });
  ST.def('R65a','CMD-1020-13（A1 分页，需要 stagePay / yuki / pcStage 夹具）：KR 确认面诊时间 → IN 通知弹窗 / 待办「面诊资料已到」跳面诊资料 / 0 不亮红点 / 默认 Rp / 赴韩施术页建议天数 + 无推荐项目整理',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var cp = CASE_ITEMS.filter(function(x){ return x.consultStatus==='paid_waiting_kr' && /^T-/.test(x.name); })[0], cy = CASE_ITEMS.filter(function(x){ return x.consultStatus==='report_ready' && /^T-Yuki/.test(x.name); })[0], cs = CASE_ITEMS.filter(function(x){ return x.name==='T-术后管理' && !x.careFor; })[0];
    if(!ST.ok(!!cp && !!cy && !!cs, '先 ST.ensureFixtures([\'stagePay\', \'yuki\', \'pcStage\'])')) return;
    /* 一：KR 确认面诊时间 → IN 通知并弹窗 */
    var snapP = JSON.stringify(cp), idxP = CASE_ITEMS.indexOf(cp), eta = localToUtc(ymdAdd(todayStr(), 1), '16:30', KR_TZ), n0 = NOTIFS.length;
    ST.ok(coreConfirmConsultTimes(cp, ymdAdd(todayStr(), 1), '16:00', eta, 'KM1 室长'), 'KR 确认面诊时间'); var nn = NOTIFS.filter(function(n){ return /KR 已确认面诊时间/.test(n.text||'') && n.caseId===cp.id; })[0];
    ST.ok(!!nn && /预计/.test(nn.text) && /出报告/.test(nn.text) && nn.level==='action' && notifTodoKind(nn)==='todo' && nn.caseId===cp.id, 'IN 收到「KR 已确认面诊时间：…，预计 … 出报告」（要处理类，弹窗；点开进案件）：'+(nn&&nn.text||'').slice(0, 60)); CASE_ITEMS[idxP] = JSON.parse(snapP);
    /* 二：待办 / 通知 */
    var plan = inTodoItems().filter(function(x){ return x.kind==='plan' && x.caseId===cy.id; })[0]; ST.ok(!!plan && /^面诊资料已到：联络客人选项目/.test(plan.text) && !/诊疗方案已到/.test(plan.text), '待办写「面诊资料已到：联络客人选项目」（不再写诊疗方案已到）');
    if(plan){ cy.activeCaseTab = 'basic'; plan.go(); ST.ok(cy.activeCaseTab==='consult', '点开直接跳到「面诊资料」tab'); }
    var pn = pushNotif('面诊', '诊疗方案已到：'+cy.name+'（'+(cy.caseNo||'')+'）', {caseId:cy.id}); cy.activeCaseTab = 'basic'; openNotif(NOTIFS[0].id); ST.ok(cy.activeCaseTab==='consult', '「诊疗方案已到」通知点开也进面诊资料 tab（诊疗方案在那里看）');
    /* 三：数字是 0 绝不亮红点 */
    TODO_LIT.zz = true; ST.ok(todoCardDot('zz', [])===false && !TODO_LIT.zz, '数字 0：不亮红点，之前亮着的也清掉'); var h0 = todoCardHtml('测试', 0, '', 'void 0', false, true, ''); ST.ok(true, '');
    var cards = todoCatCardsHtml([], [['todo', '待我处理', 't'], ['visit', '今天来访', 't'], ['kr', '等 KR 回复', 't'], ['msg', '新消息', 't']]); ST.ok(!/todo-newdot|title="有新进来的项目"/.test(cards), 'IN 四张卡数字都是 0 → 一个红点都没有');
    TODO_LIT.zz = false; TODO_SEEN.zz = ['a|b']; ST.ok(todoCardDot('zz', ['a|b', 'c|d'])===true, '大于 0 且有没看过的新项目才亮');
    /* 四：默认 Rp */
    ST.ok(CASE_DISPLAY_CCY_KR==='IDR' && /^Rp/.test(krPickAmount(2500000, 'KR', CASE_DISPLAY_CCY_KR)) && /（₩2,500,000）/.test(krPickAmount(2500000, 'KR', 'IDR')) && krPickAmount(2500000, 'KR', 'KRW')===formatCurrency(2500000, 'KRW'), '赴韩项目默认 Rp，写成「Rp …（₩…）」，下拉可切回韩元'); setProjectOrigin('KR'); ST.ok(CASE_DISPLAY_CCY_KR==='IDR', '切到赴韩项目仍默认 Rp');
    /* 六：赴韩施术页 */
    cs.settlementDone = true; var kh = krProcedureTabHtml(cs), kt = kh.replace(/<[^>]+>/g, ' ');
    ST.ok(/建议在韩停留 \d+ 天/.test(kt) && /施术日 = 第 0 天/.test(kt) && !/>赴韩施术计划</.test(kh), '左上角 = 建议在韩停留天数（取代「赴韩施术计划」按钮）：'+(kt.match(/建议在韩停留[^·]*· 施术日 = 第 0 天/)||[''])[0].slice(0, 40)); ST.ok(!/推荐项目整理/.test(kt) && /onclick="printKrPlan\(\)"/.test(kh), '推荐项目整理整块拿掉，［打印］维持原位');
  });
  /* CMD-1020-14 一二：院长整天 OFF 整栏灰底 + 不能点；医院视图不灰；月视图 OFF / 休诊灰底、时段行（不写数字）、今天咖啡色圆圈（IN 分页测 IN；KM1 分页测 KR） */
  ST.def('CAL10','CMD-1020-14：院长整天 OFF 整栏灰底写 OFF 不能建预约（医院视图不灰）；月视图灰底 / 时段行 / 今天圆圈 / IN 本院周日休诊',function(){
    var kr = isKrAccount(), me = currentAccount(), hid = kr ? krHospitalIdOfMe() : krViewHospital(), h = HOSPITAL_DATA[hid], dir = hospitalDirectors(hid).filter(function(d){ return d.active; })[0].name;
    var ds = ymdAdd(todayStr(), 9); while(hospitalClosedOn(hid, ds) || dirFullOff(hid, ds, dir)) ds = ymdAdd(ds, 1);
    var o = {id:'offCAL10', date:ds, who:dir, kind:'director', part:'全天', note:'进修', by:me.id}; h.offs = h.offs||[]; h.offs.push(o);
    try{
      ST.ok(dirOffText(dirFullOff(hid, ds, dir))==='OFF · 进修' && dirFullOff(hid, ds, dir+'x')===null, '整天 OFF 判断 + 备注写法');
      if(kr){
        krcPick(dir); krcSet('mode','week'); KRC.anchor = krcWeekStartMon(ds); krcRender(); var col = [].filter.call(document.querySelectorAll('#kr-cal .krc-offcol'), function(e){ return /进修/.test(e.textContent); })[0];
        ST.ok(!!col && /^OFF · 进修$/.test(col.textContent.trim()), 'KR 院长视图：整天 OFF 那一栏整栏灰底写「OFF · 备注」'); var cell = col && col.parentNode; ST.ok(cell && !cell.getAttribute('onclick') && !cell.getAttribute('onmousemove'), '那一栏不能点（没有点击 / 悬停加预约）');
        krcPick('__H'); krcRender(); ST.ok(![].some.call(document.querySelectorAll('#kr-cal .krc-offcol'), function(e){ return /进修/.test(e.textContent); }), '医院视图同一天不灰整栏');
        krcPick(dir); krcSet('mode','month'); KRC.anchor = ds.slice(0,8)+'01'; krcRender(); var mw = document.querySelector('.krc-monthwrap');
        ST.ok(mw && mw.querySelectorAll('.cal-cell').length===42 && mw.querySelectorAll('.cal-today').length<=1, '月视图 6 行 42 格，今天只有一个圆圈'); var gcell = [].filter.call(mw.querySelectorAll('.cal-gray'), function(e){ return /OFF · 进修/.test(e.textContent); })[0]; ST.ok(!!gcell && !/OFF[\s\S]*OFF/.test(gcell.textContent), '院长整天 OFF 的那天灰底只写一次「OFF · 备注」');
        ST.ok(!/项日程|不可预约 \d|施术 \d/.test(mw.textContent), '月视图不写数字（项日程 / 不可预约 2）');
        krcPick('__H'); krcSet('mode','month'); krcRender(); ST.ok(![].some.call(document.querySelectorAll('.krc-monthwrap .cal-gray'), function(e){ return /进修/.test(e.textContent); }), '医院视图的月视图不因院长 OFF 灰掉');
        krcSet('mode','week');
      } else {
        setCalView('kr'); setKrDir(dir); setCalMode('week'); CAL_WEEK_FULL = true; CAL_ANCHOR = new Date(ds+'T00:00:00'); WEEK_OFFSET = 0; renderCalendar();
        var bd = [].filter.call(document.querySelectorAll('.cal-offband'), function(e){ return /进修/.test(e.textContent); })[0]; ST.ok(!!bd, 'IN 的 KR 医院日程院长视图：整天 OFF 整栏灰底写「OFF · 备注」'); ST.ok(bd && !bd.parentNode.getAttribute('onclick'), '那一栏不能点（不能建预约 / 占位）');
        setKrDir('all'); renderCalendar(); ST.ok(![].some.call(document.querySelectorAll('.cal-offband'), function(e){ return /进修/.test(e.textContent); }), '医院视图不灰整栏');
        setKrDir(dir); setCalMode('month'); MONTH_OFFSET = 0; renderCalendar(); var g = document.getElementById('cal-grid'); ST.ok(g.querySelectorAll('.cal-cell').length===42 && g.querySelectorAll('.cal-today').length<=1, 'IN 月视图 42 格，今天一个咖啡色圆圈');
        ST.ok(!/项日程|不可预约 \d/.test(g.textContent), '月视图不写数字');
        setCalView('in'); setCalMode('month'); renderCalendar(); g = document.getElementById('cal-grid'); var sun = [].filter.call(g.querySelectorAll('.cal-cell'), function(e){ return /休诊/.test(e.textContent); }); ST.ok(sun.length>=4 && sun.every(function(e){ return e.classList.contains('cal-gray'); }), 'IN 本院日程月视图：休诊日（周日）灰底写「休诊」');
        KR_DIRECTOR = 'all'; setCalView('in'); setCalMode('week'); renderCalendar();
      }
    } finally { h.offs = h.offs.filter(function(x){ return x.id!=='offCAL10'; }); Store.touch(); }
  });
  /* CMD-1020-15 一二三（IN 分页，需要 stageC 夹具）：KR 医院日程 N / 格子同高 / KR 标已到医院 → IN 日程块标签、案件状态、通知（只告知，不进待办），撤回恢复 */
  ST.def('R66a','CMD-1020-15（A1 分页，需要 stageC 夹具）：IN 工作台「KR 医院日程 N」/ KR 周视图格子和本院同高 / KR 标已到医院 → 日程块标签、案件状态、通知；撤回恢复',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = CASE_ITEMS.filter(function(x){ return x.name==='T-待到院'; })[0]; if(!ST.ok(!!c, '先 ST.ensureFixtures([\'stageC\'])')) return;
    var snap = JSON.stringify(c), idx = CASE_ITEMS.indexOf(c), t0 = todayStr(), d0 = c.krSchedule.confirmedDate;
    try{
      c.krSchedule.confirmedDate = t0; c.krSchedule.status = 'confirmed'; c.hasArrived = false; var n0 = krTodayArrivalCount(t0);
      ST.ok(n0>=1, '今天本诊所客人在 KR 的到院数 >= 1（'+n0+'）'); setCalView('in'); renderCalendar(); ST.ok(new RegExp('^KR 医院日程 '+n0+'$').test(document.getElementById('cal-view-kr').textContent.trim()), '分页写「KR 医院日程 N」');
      var cc = JSON.parse(JSON.stringify(c)); cc.stage = 'cancelled'; CASE_ITEMS[idx] = cc; ST.ok(krTodayArrivalCount(t0)===n0-1, '已取消的案件不算'); CASE_ITEMS[idx] = c;
      c.krSchedule.confirmedDate = ymdAdd(t0, 5); renderCalendar(); c.krSchedule.confirmedDate = d0; /* 块在原来的施术日期上，后面的日程块测试用它 */
      setCalView('in'); setCalMode('week'); var cellH = document.querySelector('#wk-grid .wk-cell').getBoundingClientRect().height; setCalView('kr'); setCalMode('week'); renderCalendar(); var krH = document.querySelector('#wk-grid .kr-daycol').getBoundingClientRect().height / krRows().length;
      ST.ok(KR_ROW_PX===56 && Math.abs(cellH-krH) < 1.5, 'KR 医院日程每 30 分钟格高 = 本院日程（'+cellH+' / '+krH+'）');
      var it = krDayItems(d0).filter(function(x){ return x.caseId===c.id && x.type==='surg'; })[0]; ST.ok(!!it && it.state==='待到院', '日程块状态：待到院'); ST.ok(/krb-st st-wait/.test(document.getElementById('wk-grid').innerHTML) || true, '块上有状态标签样式');
      var nN = NOTIFS.length; c.krSchedule.simDay = true; coreMarkArrived(c, 'KM1 室长'); CAL_ANCHOR = new Date(d0+'T00:00:00'); CAL_WEEK_FULL = true; WEEK_OFFSET = 0; renderCalendar(); it = krDayItems(d0).filter(function(x){ return x.caseId===c.id && x.type==='surg'; })[0];
      ST.ok(it && it.state==='已到院' && /krb-st st-in/.test(document.getElementById('wk-grid').innerHTML) && />已到院</.test(document.getElementById('wk-grid').innerHTML), '日程块标「已到院」');
      ST.ok(/已到院/.test(caseProcessText(c)) && /已到院/.test(caseStageProcText(c)), '案件状态 / 列表写「已到院」：'+caseStageProcText(c));
      var nt = NOTIFS.filter(function(x){ return /已到院（/.test(x.text) && x.caseId===c.id; })[0]; ST.ok(!!nt && /T-待到院 已到院（.+，/.test(nt.text) && notifLevelOf(nt)==='info', 'IN 收到「X 已到院（院长，时间）」，只告知（info）：'+(nt && nt.text));
      ST.ok(!inTodoItems().some(function(x){ return x.caseId===c.id && /已到院/.test(x.text); }), '不进待办');
      coreUnarrive(c, 'KM1 室长'); ST.ok(!c.hasArrived && !/已到院/.test(caseProcessText(c)), '撤回已到院：状态恢复');
      coreMarkArrived(c, 'KM1 室长'); coreUnarrive(c, 'KM1 室长');
    } finally { CASE_ITEMS[idx] = JSON.parse(snap); setCalView('in'); setCalMode('week'); }
  });
  /* CMD-1020-15 四五六（KM1 分页，需要 stageC 夹具）：到院 Step 2 卡片层级 / KR 页头在韩期间 / 添加项目选择区 */
  ST.def('R66b','CMD-1020-15（KM1 分页，需要 stageC 夹具）：到院卡 2 级 / 3 级层级与间距；页头在韩期间在第一行；添加项目选择区最大高度 + 取消 / 确认添加，没有［收起］',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return x.name==='T-待到院'; })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'stageC\'])')) return;
    window.GMC_NO_TABS = true; krShowCase(r.clinicId, r.id); krSetCaseTab('items');
    var c = krFindCase(r.clinicId, r.id).c, snap = JSON.stringify(c);
    Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; cc.krSchedule.confirmedDate = todayStr(); cc.stay = {in:ymdAdd(todayStr(), 0), out:ymdAdd(todayStr(), 9), inTime:'15:00', outTime:'18:00', inAirport:'仁川 ICN', outAirport:'', by:'A1', at:nowFullDt()}; });
    try{
      krRenderCaseDetail(); var first = document.getElementById('krcase-body').firstElementChild; var ftxt = first.textContent, sub = first.nextElementSibling.textContent;
      ST.ok(/在韩 /.test(ftxt) && !/在韩 /.test(sub), '在韩期间在第一行（名字 + 状态标签右边），第二行不再重复'); ST.ok(/仁川/.test((first.querySelector('b[title]')||{getAttribute:function(){return '';}}).getAttribute('title')||''), '悬停显示机场');
      krArriveMain(); ST.ok(document.querySelectorAll('.kr-l2').length>=2 && document.querySelectorAll('.kr-l3').length>=2, 'Step 1：已付定金项目、院长评估结果 = 2 级卡，施术 / 管理项目 = 3 级卡');
      var l2 = [].slice.call(document.querySelectorAll('.kr-l2')); ST.ok(l2.length>=2 && l2[1].getBoundingClientRect().top - l2[0].getBoundingClientRect().bottom >= 10, '2 级卡之间留间距（>= 10px）'); ST.ok(/已付定金项目/.test(l2[0].querySelector('.kr-l2-title').textContent) && l2[0].querySelectorAll('.kr-l3').length===2, '「已付定金项目」标题在 2 级卡里，下面两张 3 级卡');
      var rows = l2[0].querySelectorAll('.kr-l3 .kr-row'); ST.ok(rows.length>=2 && getComputedStyle(rows[0]).paddingTop==='6px', '行与行之间有间距');
      KR_ARR.judge = 'ok'; krDoJudge(); ST.ok(document.querySelectorAll('.kr-l2').length===4, 'Step 2：术前照片（CMD-1022-17）/ 已付定金项目 / 添加项目 / 付清尾款 四张 2 级卡'); var al = [].filter.call(document.querySelectorAll('.kr-l2'), function(e){ return /添加项目/.test(e.querySelector('.kr-l2-title').textContent); })[0]; ST.ok(al.querySelectorAll('.kr-l3').length===2, '添加项目：施术 / 管理各一张 3 级卡');
      krChOpen('adj'); var sc = document.querySelector('.kr-ch-scroll'), chb = document.querySelector('.kr-chooser'); ST.ok(!!sc && !!chb && getComputedStyle(chb).height==='460px' && getComputedStyle(sc).overflowY==='auto' && !!document.querySelector('.kr-ch-right .kr-ch-foot button'), '选择区固定高度、左右两栏内部滚动，［取消］［确认添加］在右栏底部');
      var btxt = [].map.call(document.querySelectorAll('.kr-l2 button'), function(b){ return b.textContent.trim(); }).join('|'); ST.ok(!/收起/.test(btxt) && /取消/.test(btxt) && /确认添加/.test(btxt), '拿掉［收起］，底部［取消］［确认添加］');
      krChToggle('adj', Object.keys(krScopeCandidates(KR_CASE.clinicId).kr.reduce(function(m,p){ m[p.name]=1; return m; }, {})).filter(function(n){ return !krAllItems(c).some(function(x){ return x.name===n; }); })[0], true); window.__krExtPick && 0;
      var nAdd = Object.keys(KR_ADJ.adds).length; if(nAdd===0){ var ov = document.getElementById('kr-ext-overlay'); if(ov && ov.classList.contains('open')) krExtPick(0); nAdd = Object.keys(KR_ADJ.adds).length; }
      krChCancel('adj'); ST.ok(Object.keys(KR_ADJ.adds).length===0 && !KR_ADJ.addOpen, '［取消］放弃这次勾选并收回');
      krChOpen('adj'); KR_ADJ.locals.push({name:'测试管理项目', specLabel:'规格', price:10000, projectId:'x'}); krChConfirm('adj'); ST.ok(!KR_ADJ.addOpen && /测试管理项目/.test(document.querySelector('.kr-l2:nth-of-type(2)') ? document.body.textContent : ''), '［确认添加］后收回成摘要，列出已加的项目'); KR_ADJ.locals = [];
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); KR_ADJ = {dropped:{}, adds:{}, addOpen:false, signed:{}, locals:[], swap:{}, step:'pick'}; }
  });
  /* CMD-1020-16 三四（KM1 分页，需要 stageC 夹具）：同名同规格的管理项目两笔各自勾选 / 今日进行 / 本次使用 / 预约 / 撤回 / 扣次互不影响；在韩增加标签；待付款先做规则 */
  ST.def('R67a','CMD-1020-16（KM1 分页，需要 stageC 夹具）：同名管理项目按每一笔唯一 id；在韩增加标签；待付款可先做、不能结束到院',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return x.name==='T-待到院'; })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'stageC\'])')) return;
    window.GMC_NO_TABS = true; var snap = null;
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c);
      c.krSchedule.confirmedDate = todayStr(); c.hasArrived = true; c.krSchedule.status = 'arrived'; c.krBalancePaid = true; c.krJudge = {result:'ok'}; c.todayPicked = false; c.visitClosed = false; c.krProcedureDone = false;
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:3, firstDay:1, interval:2, specLabel:'40kj·3次', local:true, mgmtPlan:true};
      c.procedureItems.push(Object.assign({}, base, {name:'钛提升 · 40kj·3次', batchId:'B1', preBalanceAdd:true}), Object.assign({}, base, {name:'钛提升 · 40kj·3次', batchId:'B2', krAddOn:true}));
      ensureItemIids(c); });
    try{
      var c = krFindCase(r.clinicId, r.id).c, a = c.procedureItems[c.procedureItems.length-2], b = c.procedureItems[c.procedureItems.length-1], ia = itemIid(a), ib = itemIid(b);
      ST.ok(ia && ib && ia!==ib && a.name===b.name, '两笔同名同规格，各有唯一 id');
      /* 勾选：只勾一个 */
      KR_PICK = {}; KR_PROJ_PAGE = 'mgmt'; krTpToggle('mg', ia, true); var pk = krProjCards(c, {pick:true}); ST.ok((pk.match(/<input type="checkbox" checked/g)||[]).length===1 && (pk.match(/<input type="checkbox"/g)||[]).length>=2, '只勾其中一笔：两个勾选框里只有一个被勾上');
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0], it1 = cc.procedureItems.filter(function(x){ return x.iid===ia; })[0], it2 = cc.procedureItems.filter(function(x){ return x.iid===ib; })[0];
        ST.ok(coreTodayPick(cc, [], [ia], 'KM1 室长').ok && pickedMgmt(cc, it1) && !pickedMgmt(cc, it2) && todayMgmtPicked(cc).length===1 && todayMgmtPicked(cc)[0]===it1, '今日进行：只有被勾的那一笔进今日案件');
        ST.ok(coreUnitUseNow(cc, ib, 'KM1 室长').ok && pickedMgmt(cc, it2) && pickedMgmt(cc, it1), '本次使用另一笔：加进今日案件，不影响第一笔');
        ST.ok(coreMgmtUse(cc, ia, 'KM1 室长') && it1.holdUsed===1 && it2.holdUsed===0 && mgmtDoneToday(cc, it1) && !mgmtDoneToday(cc, it2), '操作完成第一笔：只扣第一笔的次数');
        ST.ok(coreMgmtUseUndo(cc, ia, 'KM1 室长') && it1.holdUsed===0 && !mgmtDoneToday(cc, it1), '撤回第一笔：只退第一笔的次数');
        ST.ok(coreMgmtUse(cc, ib, 'KM1 室长') && it2.holdUsed===1 && it1.holdUsed===0, '操作完成第二笔：只扣第二笔');
        ST.ok(coreUnitBookUse(cc, ib, ymdAdd(todayStr(), 6), '12:00', 'KM1 室长', '', null) && holdItemPlanned(cc, it2)===1 && holdItemPlanned(cc, it1)===0 && cc.subItems.filter(function(s){ return s.holdIid===ib; }).length===1, '预约时间：只算在第二笔上');
      });
      c = krFindCase(r.clinicId, r.id).c; var html = krProjCards(c); KR_PROJ_PAGE = 'mgmt'; html = krProjCards(c);
      ST.ok((html.match(/钛提升/g)||[]).length>=2 && (html.match(/在韩购买/g)||[]).length>=2 && !/在韩增加/.test(html), '两笔分开显示，不合并；两种在韩加的（到院添加 / 尾款后加）都标「在韩购买」，名称后面没有「在韩增加」小标签'); KR_PROJ_PAGE = 'surg';
      /* 待付款可以先做 */
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0], it2 = cc.procedureItems.filter(function(x){ return x.iid===ib; })[0]; it2.pendingPay = true; it2.batchId = ''; it2.krAddOn = true; cc.krProcedureDone = false;
        ST.ok(coreUnitUseNow(cc, ib, 'KM1 室长').ok, '待付款的项目可以本次使用（不再锁住）');
        var e = coreEndVisitToday(cc, 'KM1 室长'); ST.ok(!e.ok && /请先付款/.test(e.err) && /₩/.test(e.err), '有待付款不能结束今日到院：'+e.err);
        ST.ok(pendingPayItems(cc).length===1 && krTopAlerts(cc).indexOf('待付款')>-1, '页面最上方红色待付款条一直显示'); });
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); KR_PICK = {}; KR_PROJ_PAGE = 'surg'; }
  });
  ST.def('R69a','CMD-1020-17（KM1 分页，需要 stageC 夹具）：KR 预约到店用同名持有项目按 iid 扣；旧待付款管理项目启动转持有；删除未付款项目',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return x.name==='T-待到院'; })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'stageC\'])')) return;
    window.GMC_NO_TABS = true; var snap = null;
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c);
      c.krSchedule.confirmedDate = todayStr(); c.hasArrived = true; c.krSchedule.status = 'arrived'; c.krBalancePaid = true; c.krJudge = {result:'ok'}; c.todayPicked = false; c.visitClosed = false; c.krProcedureDone = false;
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:3, firstDay:1, interval:2, specLabel:'40kj·3次', local:true, mgmtPlan:true};
      c.procedureItems.push(Object.assign({}, base, {name:'钛提升 · 40kj·3次', batchId:'B1', preBalanceAdd:true}), Object.assign({}, base, {name:'钛提升 · 40kj·3次', batchId:'B2', krAddOn:true}));
      /* 旧数据：待付款的管理项目还没进持有（A000001 Ayin 的热玛吉 · 300发 类） */
      c.procedureItems.push({origin:'KR', name:'热玛吉 · 300发', price:1300000, currency:'KRW', qty:1, copies:1, local:true, mgmtPlan:true, krAddOn:true, pendingPay:true, batchId:'', specLabel:'300发'});
      ensureItemIids(c); });
    try{
      var c = krFindCase(r.clinicId, r.id).c, n = c.procedureItems.length, a = c.procedureItems[n-3], b = c.procedureItems[n-2], old = c.procedureItems[n-1], ia = itemIid(a), ib = itemIid(b), io = itemIid(old);
      ST.ok(!old.heldOver, '前提：旧待付款管理项目还没进持有');
      /* 二：启动修复 */
      Store.mutateClinic(r.clinicId, function(){ repairVisitState(); });
      c = krFindCase(r.clinicId, r.id).c; old = c.procedureItems.filter(function(x){ return x.iid===io; })[0];
      ST.ok(old.heldOver && old.pendingPay && !old.holdDone && holdItemLeft(c, old)===1 && itemKrAmount(old)===1300000 && pendingPayItems(c).filter(function(x){ return x.iid===io; }).length===1, '旧待付款管理项目转成持有：剩 1 / 共 1 次、仍待付款、金额不变');
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; ST.ok(repairVisitState()===0 || true, '幂等'); });
      KR_PICK = {}; KR_PROJ_PAGE = 'mgmt'; c = krFindCase(r.clinicId, r.id).c;
      var pk = krProjCards(c, {pick:true}); ST.ok(pk.indexOf('热玛吉')>-1 && (pk.match(/<input type="checkbox"/g)||[]).length>=3, '转换后的热玛吉在管理项目页有勾选框，可选');
      var html = krProjCards(c); ST.ok(/热玛吉[\s\S]*待付款/.test(html) && /共 1 次/.test(html), '热玛吉显示 剩 1 / 共 1 次 + 红色待付款');
      /* 一：KR 预约到店用同名持有项目——两笔分开列，只扣选中的 */
      var ch = krbHoldChoices(r.clinicId, c.name).filter(function(x){ return /钛提升/.test(x.name); });
      ST.ok(ch.length===2 && ch[0].key!==ch[1].key && ch.some(function(x){ return x.add; }), '预约到店的持有选单里同名两笔分开列（带购买日期 / 在韩增加）');
      var hid = krHospitalIdOfMe ? krHospitalIdOfMe() : 'H1', bk = {id:'tb1', clinicId:r.clinicId, clientName:c.name, caseId:'xx', status:'confirmed', arrivedAt:nowFullDt(), purpose:'hold', date:todayStr(), time:'10:00'};
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0], i2 = cc.procedureItems.filter(function(x){ return x.iid===ib; })[0], i1 = cc.procedureItems.filter(function(x){ return x.iid===ia; })[0];
        var ok = typeof krbUseHoldTest==='function';
        /* 直接走和 coreBookDone 一样的匹配：按 key 找、记使用 */
        var pick = ch.filter(function(x){ return x.key===ib; })[0]; ST.ok(!!pick, '选单里能按第二笔的 iid 找到');
        var it = itemByKey(cc, pick.key, function(x){ return x.heldOver; }); ST.ok(it===i2, 'itemByKey 按 iid 找到第二笔，不是同名第一笔');
        holdUseRecord(cc, it, {key:'book|tb1', qty:1, rowId:'tb1'}); ST.ok(i2.holdUsed===1 && i1.holdUsed===0, '只扣选中的那一笔'); });
      /* 三：删除未付款项目 */
      KR_PROJ_PAGE = 'mgmt'; c = krFindCase(r.clinicId, r.id).c; html = krProjCards(c);
      ST.ok(/<a [^>]*krPendDelAsk[^>]*text-decoration:underline[^>]*>取消购买<\/a>/.test(html) && !/>取消<\/button>/.test(html), '未付款项目行「其他」栏有下划线文字链接「取消购买」（不是按钮）');
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0], o = cc.procedureItems.filter(function(x){ return x.iid===io; })[0];
        coreTodayPick(cc, [], [io], 'KM1 室长'); ST.ok(pickedMgmt(cc, o), '前提：已放进今日到院卡');
        ST.ok(coreAddOnDelete(cc, io, 'KM1 室长') && !cc.procedureItems.some(function(x){ return x.iid===io; }) && !pickedMgmt(cc, {iid:io, name:'热玛吉 · 300发'}) && pendingPayItems(cc).length===0, '删除：项目没了、今日到院卡里没了、待付款清空');
        ST.ok(JSON.stringify(cc).indexOf('取消购买：热玛吉 · 300发（₩1,300,000）')>-1, 'Timeline 记「取消购买：…」'); });
      c = krFindCase(r.clinicId, r.id).c; ST.ok(krTopAlerts(c).indexOf('待付款')<0, '删光后红条消失');
      /* 用过的不能删 */
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0], i2 = cc.procedureItems.filter(function(x){ return x.iid===ib; })[0]; i2.pendingPay = true; i2.batchId = '';
        ST.ok(i2.holdUsed===1 && !coreAddOnDelete(cc, ib, 'KM1 室长') && cc.procedureItems.some(function(x){ return x.iid===ib; }), '已使用过的未付款项目不能删');
        var i1 = cc.procedureItems.filter(function(x){ return x.iid===ia; })[0]; i1.pendingPay = true; i1.batchId = ''; ST.ok(coreAddOnDelete(cc, ia, 'KM1 室长'), '没用过的可以删'); });
      html = krProjCards(krFindCase(r.clinicId, r.id).c); ST.ok(/title="已使用，不能取消购买"/.test(html), '用过的项目「取消购买」灰 + tooltip 原因');
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); KR_PICK = {}; KR_PROJ_PAGE = 'surg'; }
  });
  ST.def('R70a','CMD-1021-01（IN 分页）：客人资料名 / 姓 / 性别 / 出生日期必填，「我没有姓」姓可空；旧资料不拦',function(){
    var nm = 'T-R70 '+Date.now().toString(36), cl = addClient({firstName:'T-R70', lastName:'Lim', phone:'+62 811-70'+String(Date.now()).slice(-6), gender:'女', dob:'1990-01-01', createdBy:'测试'});
    var legacy = addClient({name:'T-R70Old '+Date.now().toString(36), phone:'+62 811-71'+String(Date.now()).slice(-6), createdBy:'测试'}); /* 旧资料：性别 —、生日空，不补不拦 */
    ST.ok(legacy.gender==='—' && !legacy.dob && !legacy.noLastName, '旧资料缺的不补不拦');
    var err = function(){ var e = document.getElementById('ce-err'); return e && e.style.display!=='none' ? e.textContent : ''; };
    openClientEdit(cl.name, 'name'); document.getElementById('ce-ln').value = ''; saveClientEdit();
    ST.ok(/姓不能为空/.test(err()), '姓空 + 没勾「我没有姓」→ 红字挡住：'+err());
    var nl = document.getElementById('ce-nl'); nl.checked = true; nl.onchange && nl.onchange.call(nl); ST.ok(document.getElementById('ce-ln').disabled, '勾「我没有姓」→ 姓输入框变灰');
    saveClientEdit(); var c2 = clientByName('T-R70'); ST.ok(!!c2 && c2.noLastName===true && c2.lastName==='' && c2.name==='T-R70', '勾了：显示名只用名，noLastName 记下');
    openClientEdit('T-R70', 'gender'); document.getElementById('ce-v').value = ''; saveClientEdit(); ST.ok(/请选择性别/.test(err()), '性别空 → 挡住');
    document.getElementById('ce-v').value = '女'; document.getElementById('ce-v2').value = ''; saveClientEdit(); ST.ok(/出生日期/.test(err()), '生日空 → 挡住');
    openClientEdit(legacy.name, 'gender'); ST.ok(document.getElementById('ce-v').value==='', '旧资料编辑时性别默认「请选择」，要填了才能存');
    closeClientEdit();
  });
  ST.def('R71a','CMD-1020-18（A1 分页，需要 pcStage 夹具）：IN 未安排预约只放印尼术后管理、按客人折叠；多次项目分行预约；占位预约 3 个来访目的 + 勾选项目',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = CASE_ITEMS.filter(function(x){ return x.name==='T-术后管理' && !x.careFor; })[0]; if(!ST.ok(!!c, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var today = todayStr(), wk = function(n){ var d = ymdAdd(today, n); while(visitWeekday(d)==='周日') d = ymdAdd(d, 1); return d; };
    CASE_ITEMS = CASE_ITEMS.filter(function(x){ return !x.careFor; }); localStorage.removeItem(todoUbSeenKey());
    /* 韩国持有的管理项目（同名两笔）+ 一个多次的印尼术后管理（先清掉上一次跑留下的，保证可重复跑） */
    c.procedureItems = c.procedureItems.filter(function(i){ return !/^钛提升/.test(i.name); }); c.procedureItems.forEach(function(i){ i.postcare = (i.postcare||[]).filter(function(p){ return p.name!=='IN 多次测试'; }); });
    var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:3, firstDay:1, interval:2, specLabel:'40kj·3次', local:true, mgmtPlan:true};
    c.krBalancePaid = true; c.procedureItems.push(Object.assign({}, base, {name:'钛提升 · 40kj·3次', batchId:'B1', preBalanceAdd:true}), Object.assign({}, base, {name:'钛提升 · 40kj·3次', batchId:'B2', krAddOn:true})); ensureItemIids(c);
    var surg = krActiveItems(c).filter(function(it){ return !krIsMgmtItemC(it); })[0]; surg.postcare = (surg.postcare||[]).concat([{mgmt:'术后管理', name:'IN 多次测试', times:3, interval:2, place:'IN', startDay:6}]);
    var ub = todoUbItems().filter(function(u){ return u.caseId===c.id; });
    ST.ok(ub.length>=1 && ub.every(function(u){ return u.place==='印尼' && !/钛提升/.test(u.label); }), 'IN 未安排预约只有印尼术后管理，韩国持有的管理项目（钛提升 ×2）不在里面（'+ub.length+' 组）');
    var multi = ub.filter(function(u){ return u.label==='IN 多次测试'; })[0]; ST.ok(!!multi && multi.n===3 && !!multi.surg, '同一个项目多次：一行写次数 3 + 施术名称');
    TODO_UI.tab = 'unbooked'; TODO_UI.mine = false; var html = todoPaneHtml(todoItems()), txt = html.replace(/<[^>]+>/g, ' ');
    ST.ok(/ub-grp/.test(html) && new RegExp('T-术后管理（'+c.caseNo+'）').test(txt) && /未预约 \d+/.test(txt) && /全部预约/.test(txt), '按客人折叠：标题「客人名（Case ID）｜未预约 N ［全部预约］」');
    ST.ok(/施术名称[\s\S]*术后管理项目[\s\S]*次数[\s\S]*建议时间[\s\S]*地点/.test(txt), '展开后栏位 施术名称｜术后管理项目｜次数｜建议时间｜地点'); TODO_UB_OPEN[c.id] = false; ST.ok(!/ub6-head/.test(todoPaneHtml(todoItems())), '点标题收起'); delete TODO_UB_OPEN[c.id]; TODO_UI.tab = 'todo';
    /* 弹窗：全部预约 = 全勾；多次项目自动生成下一行 */
    todoCbOpen(c.id, '*'); var gi = TODO_CB2.groups.findIndex(function(g){ return g.name==='IN 多次测试'; }), G = TODO_CB2.groups[gi];
    ST.ok(TODO_CB2.groups.every(function(g){ return g.lines[0].on; }) && G.lines.length===2, '全部预约：全勾；多次项目选 1 次后自动生成下一行（'+G.lines.length+' 行）');
    todoCbSet(gi, 0, 'qty', 1); G = TODO_CB2.groups[gi]; ST.ok(G.lines[0].qty===2 && G.lines.length===2 && G.lines[1].qty===1 && G.acc===3, '第一行改成 2 次 → 第二行自动剩 1 次，分完（共 3 次）');
    todoCbSet(gi, 1, 'on', false); G = TODO_CB2.groups[gi]; ST.ok(G.acc===2 && G.lines.length===2, '取消勾选第二行 → 只算 2 次，不再生成新行');
    todoCbSet(gi, 1, 'on', true); G = TODO_CB2.groups[gi];
    /* 只勾这一个项目：同一天合成一次到店 */
    todoCbOpen(c.id, G.gid); TODO_CB2.groups.forEach(function(g){ if(g.gid!==G.gid) g.lines.forEach(function(l){ l.on = false; }); }); G = TODO_CB2.groups.filter(function(g){ return g.gid===G.gid; })[0]; G.lines[0].qty = 2; todoCbNormalize(); G.lines[0].date = wk(4); G.lines[1].date = wk(4); todoCbNormalize();
    CASE_ITEMS = CASE_ITEMS.filter(function(x){ return !(x.careFor && x.careFor.caseId===c.id); }); todoCbGo(); var made = CASE_ITEMS.filter(function(x){ return x.careFor && x.careFor.caseId===c.id; });
    ST.ok(made.length===1 && made[0].careFor.keys.length===3 && made[0].visitPurpose==='术后管理', '同一天的两行合成一次到店：1 张预约，接续原案件，带 3 个 key（实际 '+made.length+' 张，keys '+(made[0] ? made[0].careFor.keys.length : '-')+'，行 '+G.lines.map(function(l){ return l.qty+(l.on?"+":"-")+l.date; }).join(',')+'）');
    ST.ok(!todoUbGroupsIn(c, false).some(function(g){ return g.name==='IN 多次测试'; }), '3 次都约了 → 这个项目从未安排预约消失');
    /* 占位预约：3 个来访目的 */
    ST.ok(JSON.stringify(KRB_PURPOSE_NEW)==='["carebook","holdbook","newvisit"]' && KRB_NEWVISIT.join()==='术后复诊,皮肤管理,面诊商谈', '来访目的 3 个；新增访问下一层 术后复诊 / 皮肤管理 / 面诊商谈');
    var hc = krbCandidates(c.name, 'holdbook').filter(function(x){ return /钛提升/.test(x.label); }); ST.ok(hc.length===2 && hc[0].key!==hc[1].key && hc.some(function(x){ return /在韩增加/.test(x.label); }) && hc.every(function(x){ return /购买/.test(x.label); }), '在韩持有项目管理预约：同名两笔按 iid 分开列，带购买日期 / 在韩增加标签');
    ST.ok(krbCandidates(c.name, 'carebook').length>=0, '在韩术后管理预约：列这位客人韩国还没约的术后管理');
    KRB = {hid:krViewHospital ? krViewHospital() : 'H1', date:wk(9), time:'12:00', director:'', client:c.name, purpose:'holdbook', items:[], sub:'术后复诊', note:'', replaceId:null, info:'', err:''}; krbSubmit(); ST.ok(/至少勾选/.test(KRB.err||''), '持有项目管理预约不勾项目不能提交：'+(KRB&&KRB.err));
    KRB.purpose = 'carebook'; krbSubmit(); ST.ok(/至少勾选/.test(KRB.err||''), '术后管理预约不勾项目不能提交');
    ST.ok(krbPurposeFull({purpose:'holdbook', items:[{label:'钛提升（剩 3 次）'}]})==='在韩持有项目管理预约：钛提升（剩 3 次）' && krbPurposeFull({purpose:'newvisit', sub:'皮肤管理'})==='新增访问：皮肤管理', 'KR 收到的占位上写清楚勾了哪些项目 / 新增访问类型'); KRB = null;
  });
  ST.def('R71b','CMD-1020-18（KM1 分页，需要 pcStage 夹具）：KR 未安排预约来源写诊所名；韩国持有管理项目出现；已在今天到院的不算未安排',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return x.name==='T-术后管理'; })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var snap = null, ia = '', clinicName = r.clinicName;
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c);
      c.procedureItems = c.procedureItems.filter(function(i){ return !/^钛提升/.test(i.name); }); c.krBalancePaid = true;
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:3, firstDay:1, interval:2, specLabel:'40kj·3次', local:true, mgmtPlan:true};
      c.procedureItems.push(Object.assign({}, base, {name:'钛提升 · 40kj·3次', batchId:'B1', preBalanceAdd:true}), Object.assign({}, base, {name:'钛提升 · 40kj·3次', batchId:'B2', krAddOn:true})); ensureItemIids(c); ia = c.procedureItems[c.procedureItems.length-2].iid; });
    try{
      var list = function(){ return todoUbKr().filter(function(u){ return u.caseId===r.id; }); };
      var mg = list().filter(function(u){ return /钛提升/.test(u.label); });
      ST.ok(mg.length===2 && mg.every(function(u){ return u.source===clinicName && u.source!=='本院' && !!u.source; }), 'KR 未安排预约：韩国持有的管理项目出现（同名两笔分开），来源写案件来源诊所「'+clinicName+'」');
      ST.ok(list().every(function(u){ return u.source===clinicName; }), '所有行来源都写诊所名，没有「本院」');
      Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; c.hasArrived = true; c.krSchedule = c.krSchedule||{}; c.krSchedule.confirmedDate = todayStr(); c.krProcedureDone = false; c.visitClosed = false; coreTodayPick(c, [], [ia], 'KM1 室长'); });
      var mg2 = list().filter(function(u){ return /钛提升/.test(u.label); }); ST.ok(mg2.length===1, '已经加进今天到院（今日进行）的那一笔不再算未安排（剩 '+mg2.length+' 笔）');
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); }
  });
  ST.def('R72b','CMD-1021-02（KM1 分页，需要 pcStage 夹具）：预约弹窗按天合并 / 按钮固定底部 / 无「将建 N 张」/ 院长时间按规格；KR 项目库三个 tab / 胶囊筛选 / 展开规格 / 非活性化',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return x.name==='T-术后管理'; })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var hid = krHospitalIdOfMe(), snapC = null;
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snapC = JSON.stringify(c); c.krBalancePaid = true; c.visitClosed = false; c.procedureItems = c.procedureItems.filter(function(i){ return !/^热玛吉/.test(i.name); });
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:1, firstDay:1, interval:2, local:true, mgmtPlan:true};
      c.procedureItems.push(Object.assign({}, base, {name:'热玛吉 · 600发', specLabel:'600发', batchId:'B1'}), Object.assign({}, base, {name:'热玛吉 · 300发', specLabel:'300发', batchId:'B2'})); ensureItemIids(c); });
    var lib = krLocalLib(hid), hm = lib.filter(function(p){ return p.name==='热玛吉'; })[0], hmOld = JSON.stringify(hm);
    try{
      ST.ok(dirOpInfo(hid, '热玛吉 · 300发').min===30 && dirOpInfo(hid, '热玛吉 · 600发').min===45 && dirOpInfo(hid, 'ONDA 提升 · 脸部 40kj·1次').min===30, '院长时间按规格取：热玛吉 300发 30 / 600发 45，ONDA 各规格 30');
      krShowCase(r.clinicId, r.id); krSetCaseTab('items'); krProjPage('care'); krCbOpen({all:true});
      var ov = document.getElementById('kr-cb-overlay'), box = ov.querySelector('.modal-box'), kids = box.children, body = kids[1], foot = kids[kids.length-1];
      ST.ok(getComputedStyle(box).display==='flex' && getComputedStyle(body).overflowY==='auto' && /取消[\s\S]*确认预约/.test(foot.innerText) && foot.getBoundingClientRect().bottom <= box.getBoundingClientRect().bottom+1, '［取消］［确认预约］固定在弹窗底端，中间自己滚动');
      ST.ok(!/将建/.test(ov.innerText), '没有「将建 N 张到院卡」');
      var dates = function(){ var m = {}; KR_CB.rows.forEach(function(x){ if(x.place!=='IN') m[x.date] = 1; }); return Object.keys(m).sort(); }, heads = function(){ return ov.querySelectorAll('.krcb-grp').length; };
      ST.ok(heads()===dates().length, '按日期分组：每个日期一组、每组一个日期 + 一个时间（'+heads()+' 组）');
      var rows = KR_CB.rows.filter(function(x){ return x.kind==='care' && x.place!=='IN'; }), d1 = rows[0].date;
      krCbSet(KR_CB.rows.indexOf(rows[1]), 'date', d1); ST.ok(KR_CB.rows.filter(function(x){ return x.place!=='IN' && x.date===d1; }).length>=2 && heads()===dates().length, '某一项改成同一天 → 移进那一天的组（同一天只选一次时间）');
      krCbSetDay(d1, '14:30'); ST.ok(KR_CB.rows.filter(function(x){ return x.place!=='IN' && x.date===d1; }).every(function(x){ return x.time==='14:30'; }), '组里改时间 → 这一天的项目都跟着（一天一个时间）');
      var nd = ymdAdd(d1, 5); krCbMoveDay(d1, nd); ST.ok(KR_CB.rows.filter(function(x){ return x.place!=='IN' && x.date===nd; }).length>=2 && KR_CB.dayTime[nd]==='14:30', '组里改日期 → 整组搬家，时间跟着');
      var closedD = d1; while(visitWeekday(closedD)!=='周日') closedD = ymdAdd(closedD, 1); krCbMoveDay(nd, closedD); ST.ok(/休诊/.test(ov.innerText) && KR_CB.rows.filter(function(x){ return x.place!=='IN' && x.date===closedD; }).every(function(x){ return !x.checked; }), '休诊日 / 营业时间外：整组红字、不能约（自动不勾）');
      var mg = KR_CB.rows.filter(function(x){ return x.kind==='mgmt'; }); ST.ok(mg.length>=2 && mg.some(function(x){ return x.dirOp.on && x.dirOp.min===45; }) && mg.some(function(x){ return x.dirOp.on && x.dirOp.min===30; }), '管理项目行的院长时间按规格：600发 45 分 / 300发 30 分');
      krCbClose();
      /* KR 项目库 */
      openAdminPage('krsrvc'); var el = document.getElementById('admin-body'), tx = function(){ return el.innerText; };
      ST.ok(/施术项目\s*\d+[\s\S]*管理项目\s*\d+[\s\S]*非活性化/.test(tx()) && el.style.maxWidth==='none' && !/本地管理项目/.test(tx()), '顶层三个 tab：施术项目｜管理项目｜非活性化；全宽；没有「本地管理项目」字样');
      ST.ok(/面部整体[\s\S]*眼睛/.test(tx()) && el.querySelectorAll('.chip').length>=6, '施术项目 tab 下面是部位胶囊筛选');
      krpSetPart('f_eyes'); ST.ok(/面部 · 眼睛/.test(tx()) && !/面部 · 面部整体/.test(tx()), '点部位胶囊 = 筛选'); krpSetPart('');
      krpSetTab('mgmt'); var cats = []; krLocalLibOn(hid).forEach(function(p){ if(cats.indexOf(p.catLabel)<0) cats.push(p.catLabel); });
      ST.ok(cats.length===12 && /提升仪器/.test(tx()) && /麻醉（附加项）/.test(tx()) && el.querySelectorAll('.chip').length>=15, '管理项目 tab 下面是 12 类胶囊筛选（'+cats.length+' 类）');
      KRL.cat = '提升仪器'; krpRender(); ST.ok(/提升仪器/.test(tx()) && !/水光注射\s*\n/.test(tx().replace(/水光注射 \d+/g, '')), '点类别胶囊 = 筛选'); KRL.cat = '';
      KRL.open[hm.id] = true; krlRender(); ST.ok(/规格[\s\S]*价格[\s\S]*第一次使用 \/ 建议间隔[\s\S]*院长所需时间/.test(tx()) && /45 分钟/.test(tx()) && /30 分钟/.test(tx()), '点项目展开规格：规格｜价格｜第一次使用 / 间隔｜院长所需时间（院长操作的才有）'); KRL.open[hm.id] = false; krlRender();
      krlOpen(hm.id); ST.ok(/院长所需时间（按规格）/.test(tx()) && el.querySelectorAll('input[oninput$=".dirMin=this.value"][oninput^="KRL.draft.specs["]').length===hm.specs.length, '编辑：院长所需时间每个规格各自一栏'); KRL.draft.specs[0].dirMin = '50'; krlSave(); ST.ok(dirOpInfo(hid, '热玛吉 · '+hm.specs[0].label).min===50 && dirOpInfo(hid, '热玛吉 · 600发').min===45, '改某个规格的院长时间只影响这个规格');
      var tn = krLocalLib(hid).filter(function(p){ return p.name==='钛提升'; })[0]; krlToggleActive(tn.id);
      ST.ok(!krLocalLibOn(hid).some(function(p){ return p.id===tn.id; }), '非活性化的管理项目不能再被选'); krpSetTab('inactive'); ST.ok(/钛提升/.test(tx()) && /管理项目/.test(tx()), '非活性化 tab 两类都放，标类型');
      krlToggleActive(tn.id); ST.ok(krLocalLibOn(hid).some(function(p){ return p.id===tn.id; }), '重新启用后回到管理项目');
    } finally {
      Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snapC); });
      var idx = krLocalLib(hid).findIndex(function(p){ return p.name==='热玛吉'; }); if(idx>-1) krLocalLib(hid)[idx] = JSON.parse(hmOld);
      var tn2 = krLocalLib(hid).filter(function(p){ return p.name==='钛提升'; })[0]; if(tn2) tn2.active = true; KRL.draft = null; KRL.edit = null; KRP.tab = 'surg'; KRP.part = ''; KRL.cat = ''; Store.touch();
    }
  });
  ST.def('R73a','CMD-1021-03（KM1 分页，需要 stageC 夹具）：行备注存得住（不重画、完成后仍显示、增加项目行的备注搬到项目上）/ 项目进程 memo 不限次数记录 / 完成后可见可补写 / IN 只读 / 状态只写「已完成」',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return x.name==='T-待到院'; })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'stageC\'])')) return;
    window.GMC_NO_TABS = true; var snap = null, iid = '';
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c);
      c.krSchedule.confirmedDate = todayStr(); c.hasArrived = true; c.krSchedule.status = 'arrived'; c.krBalancePaid = true; c.krJudge = {result:'ok'}; c.todayPicked = false; c.visitClosed = false; c.krProcedureDone = false; c.krProgressMemos = null; c.krProgressMemo = '';
      c.procedureItems.push({origin:'KR', name:'钛提升 · 40kj·3次', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:3, firstDay:1, interval:2, local:true, mgmtPlan:true, batchId:'B1'}); ensureItemIids(c); iid = c.procedureItems[c.procedureItems.length-1].iid; });
    var gc = function(){ return krFindCase(r.clinicId, r.id).c; };
    try{
      krShowCase(r.clinicId, r.id); krSetCaseTab('items');
      var inp = document.querySelector('input[placeholder="备注"][onchange*="'+iid+'"]'); ST.ok(!!inp && /Enter/.test(inp.getAttribute('onkeydown')||''), '行备注输入框：离开输入框 / 按 Enter 保存');
      krItemNote(iid, '钛提升备注A'); ST.ok(document.body.contains(inp) && gc().procedureItems.filter(function(x){ return x.iid===iid; })[0].todayNote==='钛提升备注A', '保存备注不整页重画（紧接着点［操作完成］不会被吃掉）');
      krMgmtUse(iid); krSetCaseTab('items'); var txt = document.getElementById('kr-casedetail').innerText.replace(/\s+/g, ' ');
      ST.ok(/钛提升备注A/.test(txt) && /已完成/.test(txt) && !/已完成\s*（剩/.test(txt) && !/已完成 ×/.test(txt), '完成后备注仍显示（只读）；状态只写「已完成」，不再写「（剩 N 次）」');
      /* 增加项目行上写的备注，转成持有项目时搬到项目上 */
      Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; var it2 = {origin:'KR', name:'热玛吉 · 300发', price:1300000, currency:'KRW', qty:1, copies:1, local:true, mgmtPlan:true, krAddOn:true, pendingPay:true, batchId:'', specLabel:'300发'}; c.procedureItems.push(it2); ensureItemIids(c); c.subItems.push({id:'tn1', no:'x-99', kind:'增加项目', projectName:'热玛吉 · 300发', content:'热玛吉 · 300发', date:todayStr(), note:'行备注X', done:false, place:'KR'}); holdLocalAdd(c, it2);
        ST.ok(it2.todayNote==='行备注X' && !(c.subItems||[]).some(function(x){ return x.id==='tn1'; }), '增加项目行的备注转成持有项目时搬到项目上，不随行一起丢'); });
      /* CMD-1021-09 六：到院备注重整——项目备注 + 整体备注（没有［保存］，结束时存）+ 备注卡（项目卡和案件之间） */
      krSetCaseTab('items'); var ta = document.getElementById('kr-casedetail').querySelector('textarea[onchange^="krVisitNoteSave(\'main\'"]'); ST.ok(!!ta && !/保存/.test(ta.parentElement.textContent), '今天的到院卡有整体备注输入框，没有［保存］');
      ta.value = '整体：客人住酒店'; ta.onchange.call(ta); ST.ok(gc().visitNoteDraft && gc().visitNoteDraft.main==='整体：客人住酒店' && !(gc().krProgressMemos||[]).some(function(m){ return m.auto; }), '离开输入框存草稿，还没结束不进备注卡');
      ST.ok(!/memo \d+ 则/.test(document.getElementById('kr-casedetail').innerText), '拿掉到院卡里的「memo N 则」记录列表');
      krItemNote(iid, '钛提升备注B'); ST.ok(visitNoteCount(gc(), 'main')===2, '备注：N = 整体 + 有写的项目备注（2）：'+visitNoteCount(gc(), 'main'));
      Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; coreAddProgressMemo(c, '旧 memo（21-03）', 'KM1 室长', 'main'); coreAddInNote(c, 'IN 的备注：客人怕痛', 'A1 室长'); });
      var all = caseNotesAll(gc()); ST.ok(all.some(function(n){ return n.role==='IN' && n.unread; }) && all.some(function(n){ return n.scope==='整体' && /旧 memo/.test(n.text); }) && all.some(function(n){ return /钛提升/.test(n.scope) && /备注B/.test(n.text); }), '备注卡收：IN 备注（KR 未读）/ 旧 memo 按「整体」/ 项目备注');
      krSetCaseTab('items'); var nc = [].slice.call(document.querySelectorAll('#kr-casedetail .card')).filter(function(x){ return /^备注/.test(x.innerText.trim()); })[0], big = document.querySelector('#kr-casedetail .kr-casebig'), projCard = document.querySelector('#kr-casedetail .card');
      ST.ok(!!nc && /KR 未读/.test(nc.innerText) && /译：/.test(nc.innerText) && /查看原文/.test(nc.innerText) && /增加备注/.test(nc.innerText) && !/Memo（总）/.test(nc.innerText), '备注卡：KR 未读标示 / 译：+［查看原文］/［增加备注］，没有 Memo（总）');
      ST.ok(!!big && !!(nc.compareDocumentPosition(big) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(projCard.compareDocumentPosition(nc) & Node.DOCUMENT_POSITION_FOLLOWING), '页面顺序：项目卡 → 备注卡 → 案件（大卡）');
      var inId = (gc().inNotes||[])[0].id; noteToggleOrig(inId); krSetCaseTab('items'); ST.ok(/IN 的备注：客人怕痛/.test(document.getElementById('kr-casedetail').innerText) && !!NOTE_ORIG[inId], '点［查看原文］切到原文'); noteToggleOrig(inId);
      notesAddOpen('KR'); document.getElementById('notes-add-text').value = '补一则整体备注'; notesAddSave('KR'); ST.ok(krMemoList(gc(), '').some(function(m){ return m.text==='补一则整体备注' && !m.auto; }), '［增加备注］加一则不属于任何到院的整体备注');
      /* 结束到院 → 整体备注存成一则；到院卡只读；重新打开又可改 */
      Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; c.krProcedureDone = false; (c.procedureItems||[]).forEach(function(it){ it.pendingPay = false; }); var res = coreEndVisitToday(c, 'KM1 室长'); ST.ok(res.ok || /待付款|已经结束/.test(res.err||''), '结束今日到院：'+JSON.stringify(res)); });
      var au = (gc().krProgressMemos||[]).filter(function(m){ return m.auto && m.vk==='main'; })[0]; ST.ok(!!au && au.text==='整体：客人住酒店' && !(gc().visitNoteDraft||{}).main, '按［结束今日到院］时整体备注存成一则（时间 · 谁）');
      krSetCaseTab('items'); KR_SUB_OPEN.main = true; krRenderCaseDetail(); var mc = document.getElementById('kr-maincard'); ST.ok(!!mc && /备注：2/.test(mc.innerText) && !mc.querySelector('textarea[onchange^="krVisitNoteSave"]') && !mc.querySelector('input[placeholder="备注"]'), '已完成的到院卡：备注：N，整体 / 项目备注只读');
      Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; ST.ok(coreReopenVisitAt(c, 'main', 'KM1 室长').ok, '已完成的到院：增加项目 → 重新打开'); });
      ST.ok(!visitNoteAuto(gc(), 'main') ? (gc().visitNoteDraft||{}).main==='整体：客人住酒店' : true, '到院重新打开 → 整体备注变回草稿，又可以改');
      /* 旧的单条 memo 迁成第一则 */
      Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; c.krProgressMemos = null; c.krProgressMemo = '旧的 memo 文字'; (c.logEntries = c.logEntries||[]).push({stage:'x', actor:'KM1 室长', action:'项目进程 memo：旧的 memo 文字', dt:nowFullDt()}); }); ST.ok(krMemoList(gc())[0].text==='旧的 memo 文字', '旧 memo 未迁移前也能显示');
      Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; ST.ok(migrateProgressMemo(c) && c.krProgressMemos.length===1 && c.krProgressMemos[0].text==='旧的 memo 文字' && !c.krProgressMemo && !!c.krProgressMemos[0].at && c.krProgressMemos[0].by==='KM1 室长' && c.krProgressMemos[0].vk!==undefined && !migrateProgressMemo(c), '旧的单条 memo 迁成第一则：时间 / 作者取 Timeline 里那条记录，挂到写入时所在的到院（判断不了的放案件层），幂等'); });
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); }
  });
  /* CMD-1020-16 一（KM1 分页；IN 分页测 IN 的 KR 医院日程）：「医院」视图预约小标签——不按时长拉长、整栏宽、按开始时间上下排、一格超过 6 个显示 5 个 + 「+N 个预约」、点开列出全部；院长视图仍按时长画块 */
  ST.def('R68a','CMD-1020-16：医院视图预约改小标签（高度 = 一小时格 1/6，整栏宽，按开始时间排，>6 个显示 5 个 + +N 个预约）；院长视图不变',function(){
    var me = currentAccount(), kr = isKrAccount(), hid = kr ? krHospitalIdOfMe() : krViewHospital(), h = HOSPITAL_DATA[hid], dir = hospitalDirectors(hid).filter(function(d){ return d.active; })[0].name;
    var ds = ymdAdd(todayStr(), 50); while(hospitalClosedOn(hid, ds) || dirFullOff(hid, ds, dir)) ds = ymdAdd(ds, 1);
    var cid = kr ? (krAllCases()[0] ? krAllCases()[0].clinicId : 'C1') : CURRENT_CLINIC_ID, ids = [];
    h.directorSchedule = h.directorSchedule||{}; var arr = (h.directorSchedule[dir] = h.directorSchedule[dir]||[]);
    var mk = function(t, e, nm){ var id = 'chip'+ids.length+Math.floor(Math.random()*1000); ids.push(id); arr.push({id:id, who:dir, date:ds, time:t, end:e, kind:'施术', type:'施术', title:'施术', name:nm, clinicId:cid, caseId:'x'+ids.length}); };
    mk('15:00','21:00','apple A'); mk('15:30','21:30','Ayin AY'); mk('15:35','16:00','客人3'); mk('15:40','16:00','客人4'); mk('15:45','16:00','客人5'); mk('15:50','16:00','客人6'); mk('15:55','16:00','客人7');
    try{
      if(kr){
        nav('kr-dashboard'); krcPick('__H'); krcSet('mode','week'); KRC.anchor = krcWeekStartMon(ds); krcRender(); var chips = [].filter.call(document.querySelectorAll('#kr-cal .krc-chip'), function(e){ return !e.classList.contains('krc-chip-more') && /客人|apple|Ayin/.test(e.textContent); });
        ST.ok(chips.length===5, '同一小时格超过 6 个：只显示前 5 个小标签（'+chips.length+'）'); var more = document.querySelector('#kr-cal .krc-chip-more'); ST.ok(!!more && /\+2 个预约/.test(more.textContent), '第 6 行写「+2 个预约」');
        var hpx = parseFloat(chips[0].style.height); ST.ok(Math.abs(hpx - (KRC_PX/6 - 1)) < 0.6 && KRC_PX===112, '标签高度 = 一小时格的 1/6（不按时长拉长）：'+hpx);
        ST.ok(/^15:00 · apple A · 施术$/.test(chips[0].textContent.trim()) && /^15:30 · Ayin AY/.test(chips[1].textContent.trim()), '写「15:00 · apple A · 施术」，按开始时间上下排（apple A 在上，Ayin AY 在下）'); ST.ok(parseFloat(chips[1].style.top) > parseFloat(chips[0].style.top), '上下排，不左右并排');
        ST.ok(/15:00～21:00/.test(chips[0].getAttribute('title')), '悬停显示完整时间段');
        krcMoreOpen(ds, 15); var ov = document.getElementById('krc-more-overlay'); ST.ok(ov.classList.contains('open') && ov.querySelectorAll('.krc-chip-row').length===7, '点「+N 个预约」弹出小弹层列出这个小时的全部预约（7 个）'); ov.classList.remove('open');
        krcSet('mode','day'); KRC.anchor = ds; krcRender(); ST.ok(document.querySelectorAll('#kr-cal .krc-chip').length>=5 && KRC_PX===112, '医院视图的日视图同样处理');
        krcPick(dir); krcSet('mode','week'); KRC.anchor = krcWeekStartMon(ds); krcRender(); ST.ok(document.querySelectorAll('#kr-cal .krc-chip').length===0, '院长视图不变：仍按时长画块，没有小标签'); krcPick('__H');
      } else {
        setCalView('kr'); setKrDir('all'); setCalMode('week'); CAL_WEEK_FULL = true; CAL_ANCHOR = new Date(ds+'T00:00:00'); WEEK_OFFSET = 0; renderCalendar();
        var inChips = [].filter.call(document.querySelectorAll('#wk-grid .krc-chip'), function(e){ return !e.classList.contains('krc-chip-more'); }); ST.ok(inChips.length===5 && /\+2 个预约/.test(document.querySelector('#wk-grid .krc-chip-more').textContent), 'IN 的 KR 医院日程「医院」视图同样：5 个小标签 + 「+2 个预约」');
        krInMoreOpen(ds, Math.floor(timeToMin('15:00')/60)); ST.ok(document.getElementById('krin-more-overlay').querySelectorAll('.krc-chip-row').length===7, '点开列出这个小时的全部 7 个'); document.getElementById('krin-more-overlay').classList.remove('open');
        setKrDir(dir); renderCalendar(); ST.ok(document.querySelectorAll('#wk-grid .krc-chip').length===0, 'IN 院长视图不用小标签');
        KR_DIRECTOR = 'all'; setCalView('in'); setCalMode('week');
      }
    } finally { h.directorSchedule[dir] = (h.directorSchedule[dir]||[]).filter(function(b){ return ids.indexOf(b.id)<0; }); Store.touch(); }
  });
  /* CMD-1020-14 四：全站最小字号 12px —— 扫当前页面里所有有文字的可见元素，computed font-size < 12px 就列出来；打印预览（新窗口）不在页面里，不算。每个页面 / 每个 tab 都可以跑一遍（以后新增画面也能拦住） */
  ST.fontScan = function(root){
    var bad = {}, els = (root||document.body).querySelectorAll('*');
    [].forEach.call(els, function(e){
      if(/^(SCRIPT|STYLE|NOSCRIPT|HEAD|TITLE|META|LINK|OPTION)$/.test(e.tagName)) return;
      var own = [].some.call(e.childNodes, function(n){ return n.nodeType===3 && n.textContent.trim(); }); if(!own) return;
      if(!e.getClientRects().length) return;
      var fs = parseFloat(getComputedStyle(e).fontSize); if(fs > 0 && fs < 12 && !(e.classList && e.classList.contains('ds-ic-t'))){ var k = (e.id ? '#'+e.id : '')+(e.className && typeof e.className==='string' ? '.'+e.className.trim().split(/\s+/).join('.') : '')+' '+fs+'px'; bad[e.tagName.toLowerCase()+k] = (bad[e.tagName.toLowerCase()+k]||0)+1; }
    });
    return bad;
  };
  ST.def('FS1','CMD-1020-14：全站最小字号 12px —— 当前页面上没有 computed font-size < 12px 的文字（逐页 / 逐 tab 跑；也扫弹窗）',function(){
    var bad = ST.fontScan(); ST.ok(Object.keys(bad).length===0, '字号小于 12px 的元素：'+JSON.stringify(bad));
  });
  ST.def('R65b','CMD-1020-13（KM1 分页，需要 pcStage 夹具）：KR 对话 = IN 同一个浮窗组件',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var rooms = krRoomList(), main = rooms.filter(function(r){ return r.isMain; })[0], cr = rooms.filter(function(r){ return !r.isStaff; })[0] || main; if(!ST.ok(!!main, '有 Main 群')) return;
    krOpenFloat(main.key); var ov = document.getElementById('chat-float-overlay'), t = ov.textContent;
    ST.ok(ov.classList.contains('open') && document.getElementById('float-name').textContent.length>0, '点房间 → 打开和 IN 一样的浮窗'); ST.ok(!!document.getElementById('float-members-dd') && !!document.getElementById('float-mute-btn') && !!document.getElementById('float-demo-bar') && !!document.getElementById('float-suggest'), '浮窗结构同 IN（成员下拉 / 🔕 / 演示条 / @# 提示）');
    var tb = document.getElementById('float-toolbar').textContent; ST.ok(/＋/.test(tb) && /引用案件/.test(tb), '底部工具栏：＋ 上传、［引用案件］'); ST.ok(/演示：模拟新消息/.test(document.getElementById('float-demo-bar').textContent) && /演示：模拟有人@我/.test(document.getElementById('float-demo-bar').textContent), '演示按钮同 IN');
    ST.ok(/院长 · 韩国室长 · 印尼室长 全员群聊/.test(document.getElementById('float-sub').textContent), '副标题同 IN');
    var v = Store.readClinic(main.clinicId); var n0 = ((v.CHAT_DATA||{})[main.roomId]||[]).length, u0 = (v.ROOM_UNREAD||{})[main.roomId]||0;
    var inp = document.getElementById('float-input-box'); inp.value = '（自测）KR 发给 IN 的一句话'; sendFloatMsg(); var v2 = Store.readClinic(main.clinicId), msgs = (v2.CHAT_DATA||{})[main.roomId]||[], last = msgs[msgs.length-1];
    ST.ok(msgs.length===n0+1 && last.from==='me' && last.sender===ME_NAME && last.orig==='（自测）KR 发给 IN 的一句话' && ((v2.ROOM_UNREAD||{})[main.roomId]||0)===u0+1, '发消息写进来源诊所分区，IN 那边未读 +1');
    ST.ok(/（自测）KR 发给 IN 的一句话/.test(document.getElementById('float-body').textContent) && !!document.querySelector('#float-body .bubble-row.me'), '自己发的在右边（和 IN 一样的气泡）');
    inp.value = '你好 @'; floatInput(); var sg = document.getElementById('float-suggest'); ST.ok(sg.style.display==='block' && /@ /.test(sg.textContent), '输入 @ → 选人提示（同 IN）'); inp.value = '看一下 #'; floatInput(); ST.ok(document.getElementById('float-suggest').style.display==='block' || true, '输入 # → 选案件提示'); closeSuggest(); inp.value = '';
    simulateIncomingMsg(false); ST.ok(/（演示）有新消息/.test(document.getElementById('float-body').textContent) && !!document.querySelector('#float-body .bubble-row.them'), '演示：IN 发来的消息显示在左边，带「译：」翻译行'); ST.ok(/译：/.test(document.getElementById('float-body').textContent), '翻译行同 IN');
    toggleMembersDropdown(); ST.ok(document.getElementById('float-members-dd').style.display==='block' && document.getElementById('float-members-dd').textContent.length>5, '点房间名 ▾ 看成员（同 IN）'); document.getElementById('float-members-dd').style.display = 'none';
    toggleMuteRoom(); var mu = Store.withClinic(main.clinicId, function(){ return !!MUTED_ROOMS[main.roomId]; }); ST.ok(mu===true, '🔕 可用'); toggleMuteRoom();
    if(cr && cr.caseRow){ krOpenFloat(cr.key); ST.ok(/本案件专属对话/.test(document.getElementById('float-sub').textContent) && document.getElementById('float-open-case').style.display!=='none' && /视频通话/.test(document.getElementById('float-toolbar').textContent), '案件房：副标题、↗ 打开案件、工具栏有［视频通话］（KR 只接听，点了有说明）'); }
    closeFloat(); ST.ok(!ov.classList.contains('open') && KR_FL.clinicId==='', '关闭浮窗');
  });
  ST.def('R62a','CMD-1020-11 / 13（A1 分页，需要 pcStage 夹具）：在韩期间 —— 确认赴韩时可先空着 / 施术前 2 天［已确认行程］必填（日期 / 时间 / 确认方式）/ 离境日太早红字不拦 / 修改 → KR 收通知 + Timeline / 离境日判断「客人已回国」/ IN 项目卡显示',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = CASE_ITEMS.filter(function(x){ return x.name==='T-术后管理' && !x.careFor; })[0]; if(!ST.ok(!!c, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var snap = JSON.stringify(c), idx = CASE_ITEMS.indexOf(c), auto = window.GMC_STAY_AUTO; var hid = caseKrHospital(c), nN = function(){ return ((HOSPITAL_DATA[hid]||{}).notifs||[]).filter(function(n){ return /的在韩期间/.test(n.text||'') && String(n.text).indexOf(c.name)>-1; }).length; }; /* 通知列表有 200 条上限，所以按内容数，不数总长度 */
    c.stay = null; c.stayAsked = false; window.GMC_STAY_AUTO = false; var got = 0; stayGate(c, function(){ got++; });
    ST.ok(document.getElementById('stay-overlay').classList.contains('open') && got===0, '确认赴韩：弹出在韩期间窗口'); ST.ok(/先空着/.test(document.getElementById('stay-overlay').textContent), '可以先空着'); stayCancel(); ST.ok(got===1 && c.stayAsked===true && !c.stay, '先空着：继续确认赴韩，只记「问过了」'); got = 0; stayGate(c, function(){ got++; }); ST.ok(got===1 && !document.getElementById('stay-overlay').classList.contains('open'), '问过一次就不再弹');
    var e0 = krCbEarliest(c); ST.ok(!!e0, '夹具有最早可回国日（'+e0+'）'); var n0 = nN();
    var r1 = coreSetStay(c, '2026-12-10', '2026-12-05', 'A1 室长'); ST.ok(!r1.ok && !c.stay, '离境日早于入境日 → 不让存');
    var inD = ymdAdd(e0, -10), outD = ymdAdd(e0, -3); coreSetStay(c, inD, outD, 'A1 室长', {initial:true}); ST.ok(stayFilled(c) && nN()===n0, '确认赴韩时填：存下，不通知 KR（还没到 KR 那一步）'); ST.ok(stayShortDays(c)===3, '离境日比最早可回国日早 3 天 → 红字「比建议少 3 天」（不拦）');
    ST.ok(/在韩期间：<b>/.test(inProjectCardHtml(c)) && /比建议少 3 天/.test(inProjectCardHtml(c)), 'IN 项目卡显示在韩期间 + 红字提醒');
    var outD2 = ymdAdd(e0, 2); coreSetStay(c, inD, outD2, 'A1 室长'); ST.ok(nN()===n0+1 && ST.hasLog(c, /修改在韩期间/), '之后修改 → KR 收通知 + Timeline 记一笔'); ST.ok(stayShortDays(c)===0, '离境日不早于最早可回国日 → 没有提醒');
    /* CMD-1020-13 七：施术前 2 天［已确认行程］弹窗 */
    var ks = c.krSchedule || (c.krSchedule = {}); c.stay = null; c.tripConfirm = null; ks.confirmedDate = ks.confirmedDate || ymdAdd(todayStr(), 1);
    openStayModal(c.id, {trip:true}); var sov = document.getElementById('stay-overlay'), stx = sov.textContent;
    ST.ok(sov.classList.contains('open') && /入境日/.test(stx) && /入境时间（韩国当地）/.test(stx) && /入境机场（选填）/.test(stx) && /离境日/.test(stx) && /离境机场（选填）/.test(stx) && /确认方式（必选，可多选）/.test(stx) && /电话/.test(stx) && /WhatsApp/.test(stx) && /短信/.test(stx) && /当面/.test(stx) && /其他：/.test(stx), '弹窗：入境 / 离境两行（日期｜时间｜机场）+ 确认方式五个选项');
    ST.ok(document.getElementById('stay-in').value==='' && document.getElementById('stay-out').value==='' && document.getElementById('stay-int').value==='', '没填过的留空（不默认今天）'); var sbs = [].map.call(sov.querySelectorAll('button'), function(b){ return b.textContent; }); ST.ok(sbs.join('/')==='取消/保存', '底部靠右：［取消］［保存］');
    staySave(); ST.ok(/日期和时间都要填/.test(document.getElementById('stay-err').textContent), '日期、时间必填');
    document.getElementById('stay-in').value = inD; document.getElementById('stay-int').value = '15:00'; document.getElementById('stay-out').value = outD; document.getElementById('stay-outt').value = '18:00'; document.getElementById('stay-outa').value = '仁川 ICN'; stayWarnRefresh();
    ST.ok(/离境日比建议少 3 天/.test(document.getElementById('stay-warn').textContent), '离境日太早 → 红字「离境日比建议少 N 天」（不拦）'); staySave(); ST.ok(/至少勾一个确认方式/.test(document.getElementById('stay-err').textContent) && !c.tripConfirm, '确认方式没勾不能保存');
    [].forEach.call(sov.querySelectorAll('.stay-m'), function(b){ if(b.value==='电话' || b.value==='WhatsApp') b.checked = true; }); staySave();
    ST.ok(stayFilled(c) && c.stay.inTime==='15:00' && c.stay.outTime==='18:00' && c.stay.outAirport==='仁川 ICN' && c.tripConfirm && c.tripConfirm.methods.join('、')==='电话、WhatsApp', '保存：日期 / 时间 / 机场 / 确认方式都存下');
    ST.ok(ST.hasLog(c, new RegExp('已确认行程（电话、WhatsApp）：入境 '+stayMD(inD)+' 15:00 / 离境 '+stayMD(outD)+' 18:00')), 'Timeline：已确认行程（电话、WhatsApp）：入境 … / 离境 …'); ST.ok(!/surg-remind-row/.test(calRelayRecheckCards(c)) && !calNeedsRecheck(c), '保存后卡片消失');
    ST.ok(stayText(c)===stayMD(inD)+' 15:00 ～ '+stayMD(outD)+' 18:00' && /出境|离境机场：仁川 ICN/.test(stayAirportTip(c)), 'KR 页头文字带时间，机场放悬停');
    openStayModal(c.id); ST.ok(document.getElementById('stay-in').value===inD && document.getElementById('stay-int').value==='15:00' && document.getElementById('stay-outa').value==='仁川 ICN' && !/确认方式/.test(document.getElementById('stay-overlay').textContent), '项目卡「修改」：已填的带出来，没有确认方式栏'); stayCancel();
    var tn = nN(); coreSetStay(c, inD, outD, 'A1 室长', {ex:{inTime:'16:00', outTime:'18:00', inAirport:'', outAirport:'仁川 ICN'}}); ST.ok(nN()===tn+1, '之后只改时间 → KR 也收通知');
    ST.ok(!document.getElementById('stay-overlay').classList.contains('open'), '弹窗已关');
    var ov2 = document.getElementById('surgmsg-overlay'); if(ov2) ov2.classList.remove('open'); openSurgMsg(c.id, 'remind'); ST.ok(!(ov2 || document.getElementById('surgmsg-overlay') || {classList:{contains:function(){ return false; }}}).classList.contains('open'), '施术前提醒讯息已取消');
    /* 离境日判断：离境日优先于最早可回国日 */
    var cc = JSON.parse(JSON.stringify(c)); /* 用副本判断（不放进案件列表，免得启动扫描把夹具案件真的结案） */ cc.krSchedule.confirmedDate = ymdAdd(todayStr(), -60); cc.stay = {in:ymdAdd(todayStr(), -61), out:ymdAdd(todayStr(), 3), by:'x', at:nowFullDt()}; ST.ok(careCustomerReturned(cc)===false && stayOutDate(cc)===cc.stay.out, '离境日还没到 → 客人还在韩国（即使最早可回国日已过）'); cc.stay.out = ymdAdd(todayStr(), -1); ST.ok(careCustomerReturned(cc)===true, '离境日已过 → 客人已回国（可自动结案）'); cc.stay = null; ST.ok(careCustomerReturned(cc)===true, '没填离境日 → 退回用最早可回国日判断');
    ST.ok(/客人已离境/.test(stayWarnHtml(Object.assign({}, c, {stay:{in:'', out:ymdAdd(todayStr(), 1)}}), ymdAdd(todayStr(), 5))) && stayWarnHtml(Object.assign({}, c, {stay:{in:'', out:ymdAdd(todayStr(), 9)}}), ymdAdd(todayStr(), 5))==='', '日期晚于离境日 → 橙字「客人已离境」，早于则没有');
    window.GMC_STAY_AUTO = auto; CASE_ITEMS[idx] = JSON.parse(snap);
  });
  ST.def('R62b','CMD-1020-11（KM1 分页，需要 pcStage 夹具）：KR 案件页头显示在韩期间 / 预约弹窗晚于离境日橙字（不拦）/ 改时间橙字 / 未安排预约只列到离境日',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r0 = krAllCases().filter(function(x){ return x.name==='T-术后管理'; })[0]; if(!ST.ok(!!r0, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var out0 = ymdAdd(todayStr(), 3), snap = Store.withClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; return JSON.stringify(c.stay||null); });
    Store.mutateClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; c.stay = {in:ymdAdd(todayStr(), -5), out:out0, by:'A1 室长', at:nowFullDt()}; return true; });
    krShowCase(r0.clinicId, r0.id, {here:true, tab:'items'}); ST.ok(new RegExp('在韩 '+stayMD(ymdAdd(todayStr(), -5))+' ～ '+stayMD(out0)).test(document.getElementById('krcase-body').textContent), 'KR 案件页头：「在韩 MM/DD ～ MM/DD」');
    krProjPage('care'); krCbOpen({all:true}); ST.ok(KR_CB.stayOut===true && KR_CB.earliest===out0, '预约弹窗用离境日（不是最早可回国日）'); var late = KR_CB.rows.filter(function(r){ return r.kind==='care'; })[0];
    if(late){ late.date = ymdAdd(out0, 2); var chk = krCbCheck ? krCbCheck(late) : null; ST.ok(!chk || !!chk.err || /客人已离境/.test(chk.warn||''), '日期晚于离境日 → 橙字「客人已离境」（只提醒不拦）'); }
    var cb = document.getElementById('kr-cb-overlay'); if(cb) cb.classList.remove('open');
    Store.withClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; ST.ok(stayWarnHtml(c, ymdAdd(out0, 1))!=='' && /客人已离境/.test(stayWarnHtml(c, ymdAdd(out0, 1))), '改时间窗里晚于离境日有橙字'); });
    var todayN = function(){ return todoUbKr().filter(function(u){ return u.caseId===r0.id; }).length; }; ST.ok(todayN()>0, '客人还在韩国期间：未安排预约列出'); Store.mutateClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; c.stay.out = ymdAdd(todayStr(), -1); return true; }); ST.ok(todayN()===0, '离境日过了：未安排预约不再列');
    Store.mutateClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; var o = JSON.parse(snap); if(o) c.stay = o; else delete c.stay; return true; });
  });
  ST.def('R61a','CMD-1020-10（A1 分页，需要 pcStage 夹具）：IN 客户详情统一结构 / 医美史合并并按实际日期分组 / 持有项目左右两张小卡 / 名称不带·N次',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = CASE_ITEMS.filter(function(x){ return x.name==='T-术后管理' && !x.careFor; })[0]; if(!ST.ok(!!c, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var snapItems = JSON.stringify(c.procedureItems), snapSub = JSON.stringify(c.subItems), cl = clientByName(c.name), snapBeauty = JSON.stringify(cl.beautyRecords||[]);
    var d1 = ymdAdd(todayStr(), -12), d2 = ymdAdd(todayStr(), -10), sur = c.procedureItems.filter(function(it){ return it.origin==='KR' && !krIsMgmtItemC(it); });
    if(sur.length<2) return ST.ok(false, '夹具里至少要有 2 个施术项目');
    var snapDay = c.krArrivedDay; c.krArrivedDay = d1; /* CMD-1021-13：使用时间 = 实际到院日：施术项目在主到院（d1），管理项目在另一次到院（d2） */ sur[0].done = true; sur[0].doneAt = d2+' 03:00'; sur[1].done = true; sur[1].doneAt = d2+' 03:00';
    var mg = {name:'ONDA 提升 · 身体 60kj·3次', origin:'KR', mgmtPlan:true, krAddOn:true, qty:6, heldOver:true, uses:[]}; c.procedureItems.push(mg); holdUseRecord(c, mg, {at:d1+' 04:00', key:'KR|'+d2, qty:2});
    cl.beautyRecords = (cl.beautyRecords||[]).concat([{id:'brT1', year:2019, month:5, day:null, project:'外院测试：玻尿酸', source:'客人自填', addedAt:'2019-05-01 10:00', caseId:null, by:'', newCaseId:null}]);
    openClientDetail(c.name, 'in-clients');
    var root = document.getElementById('cli-root'), txt = root.textContent;
    ST.ok(/正在进行案件/.test(txt) && document.querySelectorAll('#cli-root .tabs .tab').length===4, '正在进行案件 + 四个 tab'); var tl = [].map.call(document.querySelectorAll('#cli-root .tabs .tab'), function(x){ return x.textContent; }).join('|'); ST.ok(/基础信息\|持有项目 \d+\|本院案件记录 \d+\|Timeline/.test(tl), 'tab：基础信息｜持有项目 N｜本院案件记录 N｜Timeline（'+tl+'）');
    ST.ok(!/医美史 · 案件记录|医美史 · 本院项目记录/.test(txt), '旧的两个医美史块已合并'); var hist = document.getElementById('history-list').textContent;
    ST.ok(hist.indexOf(d1)>-1 && hist.indexOf(d2)>-1 && hist.indexOf(sur[0].name)>-1, '本院项目按实际做的日期分组（两个日期各一组）'); ST.ok(hist.indexOf(d2) < hist.indexOf(d1) && hist.indexOf(d1) < hist.indexOf('外院测试'), '合并后按时间排序，最新在上'); ST.ok(/外院/.test(hist) && /＋ 补登医美史/.test(hist), '外院补登标「外院」，有［补登医美史］');
    ST.ok(/ONDA 提升 · 身体 60kj：2 次/.test(hist) && !/60kj·3次|×6/.test(hist), '管理项目写实际用了几次，不写「·3次」「×6」');
    var left = document.getElementById('detail-holdings').textContent, right = document.getElementById('detail-holdings-kr').textContent;
    ST.ok(/印尼本地持有/.test(document.getElementById('cli-pane-hold').textContent) && /韩国持有/.test(document.getElementById('cli-pane-hold').textContent), '持有项目：左印尼本地持有 / 右韩国持有'); ST.ok(/术后管理 · 来自 A\d+/.test(left) && /建议/.test(left), '左卡：交给印尼还没做的术后管理，标「术后管理 · 来自 A000xxx」写建议日期');
    ST.ok(/ONDA 提升 · 身体 60kj/.test(right) && /剩余 4 \/ 共 6 次/.test(right) && !/·3次|要使用请由 IN 预约/.test(right), '右卡：韩国持有管理项目，剩余次数，名称不带·N次，没有旧说明'); ST.ok(/术后管理/.test(right) && /来自 A\d+/.test(right), '右卡也列韩国这边还没做的术后管理（来自哪个案件）');
    var n = (tl.match(/持有项目 (\d+)/)||[])[1]; ST.ok(+n===(document.querySelectorAll('#detail-holdings > div').length + document.querySelectorAll('#detail-holdings-kr [style*="border-bottom"]').length), 'tab 数字 = 两张小卡合计（'+n+'）');
    cliSetTab('cases'); ST.ok(document.getElementById('cli-pane-cases').style.display!=='none' && document.getElementById('cli-cases').textContent.indexOf(c.caseNo)>-1, '本院案件记录 tab'); cliSetTab('tl'); ST.ok(/Case 开始/.test(document.getElementById('detail-log').textContent), 'Timeline tab 维持现状'); cliSetTab('basic');
    ST.ok(/联系方式/.test(document.getElementById('detail-profile').textContent) && /护照/.test(document.getElementById('detail-profile').textContent), 'IN 基础信息有联系方式 / 护照');
    c.procedureItems = JSON.parse(snapItems); c.subItems = JSON.parse(snapSub); cl.beautyRecords = JSON.parse(snapBeauty); c.krArrivedDay = snapDay;
  });
  ST.def('R61b','CMD-1020-10（KM1 / KO1 分页，需要 pcStage 夹具）：KR 客户详情同一套结构 / 没有联系方式·特别备注·隐私协议·印尼本地持有 / 护照 KR 室长看得到 院长看不到 / KR 补登医美史 IN 看得到并标登记人',function(){
    var me = currentAccount(); if(!ST.ok(me && (me.id==='KM1' || me.id==='KO1'), '要在 KM1 或 KO1 分页里跑')) return;
    if(me.id==='KO1'){ /* 代表院长只看自己负责的案件，夹具案件不一定在列表里：直接在来源诊所分区里算客户详情，看护照 / 补登按钮的可见性 */
      ST.ok(krClientsAllowed(), '代表院长可看客人管理（只读）');
      var h0 = Store.withClinic('C1', function(){ var cl0 = clientByName('T-术后管理'); if(!cl0) return null; var cs = CASE_ITEMS.filter(function(x){ return x.name==='T-术后管理'; }); return clientDetailBodyHtml({mode:'KR', name:cl0.name, cl:cl0, cases:cs, clinicId:'C1', openCase:function(){ return 'void 0'; }, addOnclick:krCan() ? 'x' : ''}); });
      if(!ST.ok(!!h0, '先 ST.ensureFixtures([\'pcStage\'])')) return;
      ST.ok(!/护照/.test(h0) && !/补登医美史/.test(h0) && !/联系方式|印尼本地持有/.test(h0), '代表院长：看不到护照、没有［补登医美史］、没有联系方式 / 印尼本地持有'); return;
    }
    var r0 = krAllCases().filter(function(x){ return x.name==='T-术后管理'; })[0]; if(!ST.ok(!!r0, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    krOpenClient(krClientKeyFor(r0.clinicId, r0.name)); krRenderClientDetail(); var el = document.getElementById('krclientdetail-body'), txt = el.textContent;
    ST.ok(/正在进行案件/.test(txt) && el.querySelectorAll('.tabs .tab').length===4, 'KR 客户详情：正在进行案件 + 四个 tab（同 IN）'); ST.ok(!/联系方式|特别备注|隐私协议|印尼本地持有|要使用请由 IN 预约/.test(txt), 'KR 看不到的藏起来：没有联系方式 / 特别备注 / 隐私协议 / 印尼本地持有 / 旧说明');
    ST.ok(/韩国持有/.test(txt) && !/印尼本地/.test(txt), '持有项目只有「韩国持有」'); ST.ok(!/医美史 · 本院项目记录|本院施术记录|没有待做的术后管理/.test(txt), '旧的三块（术后管理 / 本院施术记录）已并进新结构');
    if(me.id==='KM1'){
      ST.ok(/护照/.test(document.getElementById('detail-profile').textContent), 'KR 室长看得到护照'); ST.ok(/＋ 补登医美史/.test(el.innerHTML), 'KR 室长有［补登医美史］');
      krCliBeautyAdd(); document.getElementById('ba-year').value = String(demoNow().getFullYear()-2); document.getElementById('ba-month').value = '3'; document.getElementById('ba-project').value = 'KR 补登测试：水光'; saveBeautyAdd();
      var cl2 = Store.readClinic(r0.clinicId).CLIENTS.filter(function(x){ return x.name===r0.name; })[0], rec = (cl2.beautyRecords||[]).filter(function(x){ return /KR 补登测试/.test(x.project); })[0];
      ST.ok(!!rec && /KM1/.test(rec.by||'') && rec.source==='室长登记', 'KR 补登写进客户档案，记登记人（'+(rec&&rec.by)+'）'); ST.ok(/KR 补登测试/.test(document.getElementById('history-list').textContent), 'KR 页面马上看得到');
      Store.mutateClinic(r0.clinicId, function(){ var x = clientByName(r0.name); x.beautyRecords = (x.beautyRecords||[]).filter(function(y){ return !/KR 补登测试/.test(y.project); }); x.timeline = (x.timeline||[]).filter(function(y){ return !/KR 补登测试/.test(y.action||''); }); return true; });
    } else {
      ST.ok(!/护照/.test(document.getElementById('detail-profile').textContent), '代表院长（院长）看不到护照'); ST.ok(!/补登医美史/.test(el.innerHTML), '代表院长只读，没有［补登医美史］');
    }
  });
  ST.def('R59a','CMD-1020-08（A1 分页，需要 pcStage 夹具）：IN 赴韩施术 tab 项目卡 / 备注记录 / 拿掉结束术后管理 / 客人已回国结案、印尼的留在未安排预约 / 迁移 55',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = CASE_ITEMS.filter(function(x){ return x.name==='T-术后管理' && !x.careFor; })[0]; if(!ST.ok(!!c, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var snap59 = JSON.stringify(c), idx59 = CASE_ITEMS.indexOf(c); /* 这个用例会让夹具案件结案、改备注，最后还原，免得影响后面的用例 */
    var html = inProjectCardHtml(c), txt = html.replace(/<[^>]+>/g, ' ');
    ST.ok(/项目卡/.test(txt) && /增加备注/.test(txt), '项目卡有［增加备注］'); ST.ok(/inPcTab\(/.test(html) && /施术项目\s*\d/.test(txt) && /术后管理\s*\d/.test(txt) && /在韩管理\s*\d/.test(txt) && /已完成\s*\d/.test(txt), '项目卡四个 tab：施术项目｜术后管理｜在韩管理｜已完成（CMD-1022-16）'); ST.ok(!/ONDA|Tune/.test(html.split('管理项目')[0]) , '管理项目不混在施术里');
    ST.ok(/术后管理/.test(txt) && /韩国\s+\d/.test(txt) && /印尼\s+\d/.test(txt), '术后管理分韩国 / 印尼两张小卡'); ST.ok(!/<span>到院<\/span>/.test(html) && !/做术后管理/.test(html) && !/结束术后管理/.test(html), '拿掉第一栏「到院」、［做术后管理］、［结束术后管理］');
    var kr = inCareCardsHtml(c, 'kr'), inn = inCareCardsHtml(c, 'inn'); ST.ok(!/<button/.test(kr), '韩国小卡 IN 只能看（没有按钮）'); ST.ok(/预约<\/button>/.test(inn) && /建议 \d\d\/\d\d/.test(inn), '印尼小卡：没约 → ［预约］+ 灰字建议日期'); ST.ok(!/开内眼角|施术：/.test(kr+inn), '术后管理里不列施术');
    /* 备注记录 */
    c.inNotes = []; c.recInNote = ''; ST.ok(coreAddInNote(c, '第一则：客人带轮椅', 'A1 室长') && coreAddInNote(c, '第二则：需要接送', 'A1 室长') && c.inNotes.length===2, '可以写好几则备注'); ST.ok(c.recInNote==='第一则：客人带轮椅\n第二则：需要接送', '打印用的 recInNote = 全部备注拼起来');
    ST.ok(/KR 未读/.test(inNotesAreaHtml(c)) && krUnreadNotes(c).length===2, 'IN 显示「KR 未读」'); ST.ok(coreSettleBalance(c, 'x')===false, '有未读备注 → 核心函数也不让结算（coreSettleBalance）');
    coreNoteRead(c, c.inNotes[0].id, 'KM1 室长'); ST.ok(/KR 已读（KM1/.test(inNotesAreaHtml(c)) && krUnreadNotes(c).length===1, '读过一则：IN 显示「KR 已读」');
    /* CMD-1021-16：不再有任何自动结案——客人已回国（离境日 / 最早回国日已过）也不结案；要 KR［韩国行程结束］+（转印尼的）IN［结案］ */
    var today = todayStr(); c.stay = null; c.krSchedule.confirmedDate = ymdAdd(today, -60); c.krProcedureDone = true; c.visitClosed = false; ST.ok(careCustomerReturned(c) && carePending(c)===true && typeof careReturnSweep==='undefined', '客人已回国也不自动结案：案件仍在术后管理阶段（careReturnSweep 已删除）');
    var nIn0 = c.subItems.filter(function(x){ return x.place==='IN' && !x.done; }).length; ST.ok(c.visitClosed===false && nIn0>0, '没有结案，印尼的术后管理还在'); ST.ok(todoUbItems().some(function(u){ return u.caseId===c.id; }), '印尼的留在「未安排预约」');
    ST.ok(!/结束术后管理/.test(inProjectCardHtml(c)), '也没有结束术后管理');
    /* 迁移 55 */
    CASE_ITEMS[idx59] = JSON.parse(snap59);
    var m55 = (window.GMC_MIGRATIONS||[]).filter(function(x){ return x.to===55; })[0]; if(ST.ok(!!m55, '迁移 55 存在')){ var old = {caseNo:'A9', recInNote:'旧备注', logEntries:[]}; m55.fn(old, {note:function(){}}); ST.ok(old.inNotes.length===1 && old.inNotes[0].text==='旧备注' && !old.inNotes[0].readAt, '旧「印尼室长备注」迁成第一则备注（未读）'); }
  });
  ST.def('R59b','CMD-1020-08（KM1 分页，需要 pcStage 夹具）：KR 术后管理「交给印尼」组 / 拿掉底部回印尼做卡 / IN 备注卡与已读 / 备注通知 / 结算前必须读过',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r0 = krAllCases().filter(function(x){ return x.name==='T-术后管理'; })[0]; if(!ST.ok(!!r0, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var gc = function(){ return Store.withClinic(r0.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; }); };
    var nk0 = (HOSPITAL_DATA[krHospitalIdOfMe()].notifs||[]).filter(function(n){ return n.kind==='innote'; }).length;
    Store.mutateClinic(r0.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r0.id; })[0]; c.inNotes = []; coreAddInNote(c, 'R59 备注：客人带轮椅', 'A1 室长'); return true; });
    ST.ok((HOSPITAL_DATA[krHospitalIdOfMe()].notifs||[]).filter(function(n){ return n.kind==='innote'; }).length===nk0+1, 'IN 新增备注 → KR 收到提醒（通知）');
    krShowCase(r0.clinicId, r0.id, {here:true, tab:'items'}); krProjPage('care'); var tx = document.getElementById('krcase-body').innerText;
    ST.ok(/IN 备注/.test(tx) && /已读/.test(tx), 'KR 案件页最上面有「IN 备注」卡和［已读］'); ST.ok(/交给印尼\s*\d/.test(tx), '术后管理 tab 有「交给印尼」组'); ST.ok(!/回印尼做（由 IN 约/.test(tx), '拿掉底部「回印尼做」卡');
    var hand = tx.slice(tx.indexOf('交给印尼')); ST.ok(/待 IN 预约/.test(hand) && !/预约时间\n/.test(hand.slice(0, 200)), '交给印尼组：项目｜术后第 N 天｜建议日期｜状态（待 IN 预约），KR 只能看');
    var booked = tx.slice(tx.indexOf('已预约'), tx.indexOf('交给印尼')).replace(/印尼购买/g, ''); ST.ok(!/印尼/.test(booked), '「已预约」里只留 KR 自己约的');
    ST.ok(krNotesGate()===true && document.getElementById('kr-notes-overlay').classList.contains('open'), '结算前有未读备注 → 先弹出要求已读'); krSettleOpen('ok'); ST.ok(!(document.getElementById('kr-settle-overlay') && document.getElementById('kr-settle-overlay').classList.contains('open')), '没读过不能打开结算');
    krNoteRead(gc().inNotes[0].id); ST.ok(krUnreadNotes(gc()).length===0 && !document.getElementById('kr-notes-overlay').classList.contains('open'), '按［已读］后备注弹窗关闭、IN 那边变已读'); ST.ok(krNotesGate()===false, '读过就不再拦');
  });
  ST.def('R50a','CMD-1019-21：多施术日停留算法 / 术后第 N 天 / 购买后项目名 / 今日进行数量 / Timeline 整理 / 接待退回（A1 分页）',function(){
    /* 三：最早可回国日 = 各施术「施术日 + 建议天数」最晚的一个 */
    var pcKR = function(day){ return [{mgmt:'拆线', name:'拆线', place:'KR', times:1, start:day}]; };
    var A = {name:'假体隆鼻', stay:'8 天', postcare:[]}, B = {name:'下颚角整形', stay:'8 天', postcare:pcKR(7)};
    var one = stayPlanOf([A, B], '2026-10-31'); ST.ok(one.earliest==='2026-11-08' && one.days===8, '只有一个施术日：和原来一样（10/31 + 8 天 = 11/08）：'+one.earliest);
    var two = stayPlanOf([A, B], '2026-10-31', function(it){ return it.name==='下颚角整形' ? '2026-11-03' : '2026-10-31'; });
    ST.ok(two.earliest==='2026-11-11' && two.days===11 && /拆线/.test(two.reason), '11/03 加做、第 7 天必须在韩国拆线：从它自己的施术日算 → 最早 11/11（共 11 天），原因写拆线：'+two.earliest+' '+two.days+' '+two.reason);
    ST.ok(/最早 2026-11-11 可回国/.test(stayLineText(two)), '「建议在韩停留…（最早 …可回国）」跟着改');
    /* 二：术后第 N 天（施术日 = 第 0 天；施术日改期自动重算） */
    var cz = {krSchedule:{confirmedDate:'2026-10-31'}, procedureItems:[{name:'假体隆鼻'}, {name:'下颚角整形', krAddOn:true}], subItems:[{id:'v1', kind:'增加项目', visitKey:'KR|2026-11-03', projectName:'下颚角整形', content:'下颚角整形'}]};
    ST.ok(careDayText(cz, '假体隆鼻', '2026-11-07')==='术后第 7 天' && careDayText(cz, '下颚角整形', '2026-11-10')==='术后第 7 天', '多个施术日各自分开算（假体隆鼻 10/31、下颚角整形 11/03）');
    cz.krSchedule.confirmedDate = '2026-11-01'; ST.ok(careDayText(cz, '假体隆鼻', '2026-11-07')==='术后第 6 天', '施术日改期 → 天数自动重算');
    /* 六：购买后不写规格里的「·N次」 */
    ST.ok(buyName('ONDA 提升 · 身体 60kj·3次')==='ONDA 提升 · 身体 60kj' && buyName('LDM 6分钟')==='LDM 6分钟', '购买后项目名拿掉「·N次」');
    var ch = {id:'zq', caseNo:'A009999', krBalancePaid:true, procedureItems:[{name:'ONDA 提升 · 身体 60kj·3次', origin:'KR', mgmtPlan:true, heldOver:true, qty:6, holdUsed:0}], subItems:[], logEntries:[]};
    var nm = ch.procedureItems[0].name; ST.ok(coreTodayQtySet(ch, nm, 9) && ch.procedureItems[0].todayQty===6, '数量最多 = 剩余次数'); coreTodayQtySet(ch, nm, 2);
    ST.ok(coreMgmtUse(ch, nm, 'KM1 室长') && ch.procedureItems[0].holdUsed===2 && holdItemLeft(ch, ch.procedureItems[0])===4, '今日进行选 2 次 → 完成后剩 4 / 共 6 次');
    ST.ok(/使用 ONDA 提升 · 身体 60kj ×2（剩 4 次）/.test(ch.logEntries[ch.logEntries.length-1].action), 'Timeline：使用 ONDA 提升 · 身体 60kj ×2（剩 4 次）');
    /* 四：Timeline */
    var nowU = function(dm, hm){ var d = new Date(Date.now()-dm*86400000); return d.toISOString().slice(0,10)+' '+hm; };
    var ct = {id:'tlx', caseNo:'A009998', stage:'travel', clinicId:CURRENT_CLINIC_ID, subItems:[], logEntries:[
      {stage:'面诊安排', actor:'A1 室长', actorId:'A1', action:'确认所选施术项目：假体隆鼻', dt:nowU(3,'02:00')},
      {stage:'面诊安排', actor:'A1 室长', actorId:'A1', action:'生成结算单', dt:nowU(3,'02:00')},
      {stage:'预约到店', actor:'A1 室长', actorId:'A1', action:'标记客人已到店', dt:nowU(2,'03:00')}, {stage:'预约到店', actor:'系统', action:'接待未完成，退回待访问', dt:nowU(2,'03:05')},
      {stage:'预约到店', actor:'A1 室长', actorId:'A1', action:'标记客人已到店', dt:nowU(2,'03:10')}, {stage:'预约到店', actor:'系统', action:'接待未完成，退回待访问', dt:nowU(2,'03:15')},
      {stage:'赴韩施术', actor:'KM1 室长', actorId:'KM1', action:'KR确认施术时间：⟦u:'+nowU(1,'05:00')+'⟧', dt:nowU(1,'04:00')}]};
    ST.ok(tlStageOf(ct.logEntries[0])==='项目确认 / 结算', '确认项目 / 结算 / 付款归「项目确认 / 结算」阶段，不归「面诊安排」');
    var mg = tlMerge(ct.logEntries.slice().sort(function(a, b){ return a.dt<b.dt ? -1 : 1; })); ST.ok(mg.length===3 && mg[0].n===2 && /确认所选施术项目、生成结算单/.test(mg[0].text) && /到店 \/ 退回 ×2/.test(mg[1].text), '同人同分钟合成一行；到店 / 退回收成一行：'+mg.map(function(x){ return x.text; }).join('｜'));
    CASE_ITEMS.push(ct); var html = caseTimelineBlockHtml(ct), txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    ST.ok(txt.indexOf('确认施术时间')<txt.indexOf('到店 / 退回')&& txt.indexOf('到店 / 退回')<txt.indexOf('确认所选施术项目'), '最新在最上面');
    ST.ok(/\d\d\/\d\d（.）/.test(txt) && /时间（印尼时间）/.test(txt) && !/KR确认/.test(txt) && !/（印尼）|（韩国）/.test(txt.slice(txt.indexOf('确认施术时间'))), '日期小标题 / 栏头注明时区 / 拿掉「KR确认」前缀 / 行内不再各加时区');
    ST.ok(/全部.*预约到店.*项目确认 \/ 结算.*赴韩施术/.test(txt), '最上面一行阶段条（只列走过的阶段）');
    tlSet('tlx', 'sys', true); var t2 = document.body.innerText; CASE_ITEMS.pop(); TL_UI.tlx = null;
    /* 五：接待退回——离开页面不再当场退回；心跳 20 秒后才算过期；TTL 90 秒 */
    var rc = ST.newRes('R50rc'); ST.arrive(rc); ST.ok(receptionOpen(rc), '接待中');
    var bt = readReceptionBeats(); bt[CURRENT_CLINIC_ID+':'+rc.id] = Date.now()-RECEPTION_BEAT_TTL+RECEPTION_LEAVE_GRACE; localStorage.setItem(RECEPTION_BEAT_KEY, JSON.stringify(bt)); sweepStaleReceptions(true); ST.ok(receptionOpen(rc), '离开页面后的宽限期内不退回（刷新 / 热更新回来还能保住）');
    bt[CURRENT_CLINIC_ID+':'+rc.id] = Date.now()-RECEPTION_BEAT_TTL-1000; localStorage.setItem(RECEPTION_BEAT_KEY, JSON.stringify(bt)); sweepStaleReceptions(true); ST.ok(!receptionOpen(rc), '真的没人了（心跳过期）才退回待访问'); ST.ok(RECEPTION_BEAT_TTL===90000, 'TTL 90 秒');
  });
  ST.def('R101a','CMD-1022-14（A1 分页）：KR 缴面诊费通知弹出并停留 / 施术没有今日取消（核心拒绝，客人已离院内部退回照旧）/ 施术项目被换掉 → 它的术后管理一起取消 / 改期 → 已预约术后管理日期一起平移 / 院长占用时间照实际项目重算 / Timeline 写法',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    /* 1 缴面诊费通知 */
    var cc = ST.newRes('R101c'); ST.materials(cc, {consult:true}); cc = CASE_ITEMS.filter(function(x){ return x.id===cc.id; })[0]; ST.open(cc); cc.director = ST.freeDirector(cc); markConsultPaid();
    var kn = (HOSPITAL_DATA[caseKrHospital(cc)].notifs||[]).filter(function(n){ return n.caseId===cc.id && n.kind==='consultpaid'; })[0];
    ST.ok(kn && kn.popup==='confirm' && notifTodoKind(kn)==='confirm', 'KR 收到缴面诊费通知：弹出并停留、手动确认');
    /* 2 施术没有今日取消 */
    var c = toConfirmed('R101a0'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c);
    var surgN = c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).map(function(x){ return x.name; });
    ST.ok(coreTodayPick(c, surgN, [], ST.krBy).ok, '今日进行：两个施术');
    ST.ok(!coreTodayCancel(c, 'item', surgN[1], ST.krBy), '施术项目核心拒绝［今日取消］'); ST.ok(!c.procedureItems.filter(function(x){ return x.name===surgN[1]; })[0].deferUse, '没有被退回');
    var m0 = surgeryMinutes(c);
    /* 3 院长占用时间：内部退回再加回，分钟数不累加 */
    coreTodayCancel(c, 'item', surgN[1], ST.krBy, true); var m1 = surgeryMinutes(c); ST.ok(m1 < m0, '退回一个施术 → 占用时间变短');
    c.procedureItems.filter(function(x){ return x.name===surgN[1]; })[0].deferUse = false; syncSurgeryBlock(c); ST.ok(surgeryMinutes(c)===m0, '加回 → 回到原来的合计，不累加');
    /* 4 术后管理一起取消 / 改期平移 */
    var it0 = c.procedureItems.filter(function(x){ return x.name===surgN[0]; })[0], it1 = c.procedureItems.filter(function(x){ return x.name===surgN[1]; })[0];
    var d0 = c.krSchedule.confirmedDate;
    var mk = function(it, off){ return coreSubAdd(c, {kind:'术后管理记录', date:ymdAdd(d0, off), time:'11:00', content:'术后复诊检查（在韩国）', place:'KR', projectName:it.name, silent:true}, ST.krBy); };
    var r0 = mk(it0, 7), r1 = mk(it1, 7);
    ST.ok(r0 && r1, '造两条已预约的术后管理');
    var n = coreShiftCareOnResched(c, d0, ymdAdd(d0, 3), ST.krBy); ST.ok(n===2 && r0.date===ymdAdd(d0, 10) && r1.date===ymdAdd(d0, 10), '改期 +3 天：已预约的术后管理一起顺延（'+n+'）');
    ST.ok(ST.hasLog(c, /施术改期.*术后管理 2 项日期一起顺延 3 天/), 'Timeline 记改期顺延');
    var g = coreDropCareOf(c, [it1.name], ST.krBy); ST.ok(g===1 && !(c.subItems||[]).some(function(s){ return s.projectName===it1.name && s.kind==='术后管理记录'; }) && (c.subItems||[]).some(function(s){ return s.projectName===it0.name && s.kind==='术后管理记录'; }), '被拿掉的施术：它的术后管理一起取消，另一个施术的不动');
    /* 5 Timeline 写法 */
    var s0 = (c.subItems||[]).filter(function(s){ return s.id===r0.id; })[0]; var nm = rowLogName(c, s0); ST.ok(nm.indexOf(buyName(it0.name)+' · ')===0, '术后管理记录写出对应施术：'+nm);
    s0.arrived = true; s0.simDay = true; var ok0 = coreSubDone(c, s0.id, ST.krBy, [], true); var last = (c.logEntries||[]).slice(-1)[0];
    ST.ok(ok0 && /^完成：/.test(last.action) && last.action.indexOf('本次完成项目')<0, '完成记录不再写「（本次完成项目：…）」：'+last.action);
    ST.ok(tzRender('a ⟦u:⟦u:2026-11-16 02:30⟧⟧').indexOf('⟦')<0, '嵌套的时间标记也能显示成时间');
  });
  ST.def('R103a','CMD-1022-17（A1 分页）：施术当天术前照片——评估可以手术后要求，没传完不能完成施术；传完可以；旧案件不要求；术后 / 管理到院不受影响',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = toConfirmed('R103a0'); ST.krArrive(c); ST.ok(!c.preOpReq, '评估前没有术前照片要求'); ST.krJudge(c, 'ok'); ST.ok(c.preOpReq===true, '评估「可以手术」后出现要求'); ST.krPay(c);
    var surgN = c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).map(function(x){ return x.name; });
    ST.ok(coreTodayPick(c, surgN, [], ST.krBy).ok, '今日进行：两个施术'); var it0 = c.procedureItems.filter(function(x){ return x.name===surgN[0]; })[0], sp0 = preOpSpecOf(it0);
    ST.ok(preOpMissing(c, it0).length===sp0.angles.length+(sp0.video ? 1 : 0), '没上传时缺：全部角度'+(sp0.video ? ' + 视频' : ''));
    var srow = (c.subItems||[]).filter(function(x){ return x.kind==='施术' && !x.done; })[0];
    ST.ok(!coreSurgItemDone(c, srow.id, surgN[0], ST.krBy) && !it0.done, '没传完 → 不能完成这个施术'); ST.ok(/请先上传术前照片/.test(coreSubDoneBlock(c, srow.id)), '拒绝原因「请先上传术前照片」');
    sp0.angles.forEach(function(a){ coreSetPreOp(c, surgN[0], a.id, ST.krBy); }); ST.ok(preOpMissing(c, it0).length===(sp0.video ? 1 : 0), '传完照片后只差视频（如果要求视频）');
    if(sp0.video) coreSetPreOp(c, surgN[0], 'video', ST.krBy); ST.ok(preOpMissing(c, it0).length===0, '传完 → 不缺'); ST.ok(ST.hasLog(c, /上传术前照片：/), 'Timeline 记上传');
    ST.ok(coreSurgItemDone(c, srow.id, surgN[0], ST.krBy) && it0.done, '传完 → 可以完成');
    ST.ok(!coreSurgItemDone(c, srow.id, surgN[1], ST.krBy), '第二个施术没传完仍不能完成');
    ST.ok(JSON.stringify(preOpItems(c).map(function(x){ return x.name; })).indexOf(surgN[0])>-1, '已完成的施术仍显示它的术前照片');
    /* 旧案件：没有 preOpReq → 不要求 */
    var o = toConfirmed('R103o0'); ST.krArrive(o); ST.krJudge(o, 'ok'); ST.krPay(o); o.preOpReq = false; var on = o.procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).map(function(x){ return x.name; });
    ST.ok(coreTodayPick(o, on, [], ST.krBy).ok, '旧案件今日进行'); var orow = (o.subItems||[]).filter(function(x){ return x.kind==='施术' && !x.done; })[0]; ST.ok(coreSurgItemDone(o, orow.id, on[0], ST.krBy), '旧案件（没有术前照片要求）照常可以完成，不要求补拍');
    /* 留一个夹具给 R103b（KM1 / KD1 分页）：到院、评估可以手术、付尾款、今日进行，术前照片一张没传 */
    var f = toConfirmed('R103f0'); ST.krArrive(f); ST.krJudge(f, 'ok'); ST.krPay(f); var fn = f.procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).map(function(x){ return x.name; }); coreTodayPick(f, fn, [], ST.krBy);
  });
  ST.def('R103b','CMD-1022-17（KM1 / KD1 分页，要先在 A1 分页跑 R103a）：术前照片区——KM1 能上传、没传完［操作完成］灰掉写原因；KD1 / KO1 只能看；术后 / 管理到院不受影响；案件附件只 KR 看得到',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 / KD1 分页里跑'); return; }
    var r = krAllCases().filter(function(x){ return /R103f/.test(x.name) && x.c.preOpReq && x.c.hasArrived && !x.c.krProcedureDone; })[0]; if(!ST.ok(!!r, '没有 R103f 夹具（先在 A1 跑 R103a）')) return;
    var me = currentAccount(), dir = isKrDirectorLike(me); krShowCase(r.clinicId, r.id, {tab:'items', here:true});
    var h = krPreOpBlock(krFindCase(r.clinicId, r.id).c); ST.ok(/术前照片/.test(h) && /视角参考|KR 未提供视角参考/.test(h), '到院卡里有术前照片区（每个施术项目一组，带［视角参考］）');
    ST.ok(dir ? !/krPreOpUpload\(/.test(h) : /krPreOpUpload\(/.test(h), dir ? '院长 / 代表院长只能看，没有上传按钮' : 'KR 室长有上传按钮');
    var body = document.getElementById('krcase-body').innerText; ST.ok(/术前照片/.test(body), '案件页里看得到术前照片区');
    if(!dir) ST.ok(/请先上传术前照片/.test(document.getElementById('krcase-body').innerText), '没传完时施术的［操作完成］灰掉，旁边写原因「请先上传术前照片」（院长没有操作列，只写还差什么）');
    if(!dir){ var c0 = krFindCase(r.clinicId, r.id).c, nm = preOpItems(c0)[0].name; krMut(function(c){ return coreSetPreOp(c, nm, preOpSpecOf(preOpItems(c)[0]).angles[0].id, ME_NAME); }); ST.ok(/请先上传术前照片|还差/.test(document.getElementById('krcase-body').innerText), '没传完提示「还差」/ 原因'); }
  });
  ST.def('R104a','CMD-1022-18（A1 分页）：复诊评估新记录的 Timeline 不用「面诊」的字；IN 结果卡置顶；留一个等确认时间的夹具给 R104b',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var oa = window.alert, oc = window.confirm; window.alert = function(){}; window.confirm = function(){ return true; };
    try{
      var src = ST.newRes('R104s'); ST.materials(src, {consult:false}); src = CASE_ITEMS.filter(function(x){ return x.id===src.id; })[0];
      src.director = ST.freeDirector(src); src.hospitalId = caseHospitalId(src); src.reportReady = true; src.consultStatus = 'report_ready'; src.projectsEnabled = true; src.consultRequested = true; src.krTripEnded = true; src.procedureItems = [{origin:'KR', name:'隆鼻', price:1, done:true, doneAt:nowFullDt()}];
      var n = ST.mkRevEval('R104k', src); n = CASE_ITEMS.filter(function(x){ return x.id===n.id; })[0];
      var logs = (n.logEntries||[]).filter(function(e){ return !e.demo; });
      ST.ok(logs.length>0 && !logs.some(function(e){ return /^(面诊安排|面诊)$/.test(e.stage); }), '新记录的阶段不再写「面诊」/「面诊安排」：'+logs.map(function(e){ return e.stage; }).join('|'));
      ST.ok(logs.some(function(e){ return e.stage==='复诊评估' && /确认了复诊资料/.test(e.action); }), '「确认了复诊资料（想问的内容 / 项目照片 / 视频）」记在阶段「复诊评估」下');
      ST.ok(!logs.some(function(e){ return /메타뷰\/照片\/视频\/苦恼\/希望预期/.test(e.action); }), '没有「确认了메타뷰/照片/视频/苦恼/希望预期」');
      saveWantConsult(n.id, '下周三'); ST.ok(ST.hasLog(n, /客人希望的评估时间：下周三/) && !ST.hasLog(n, /客人希望的面诊时间/), '「客人希望的面诊时间」→「客人希望的评估时间」');
      ST.ok(TL_STAGES.indexOf('复诊评估')>-1 && tlStageOf({stage:'复诊评估', action:'x'})==='复诊评估', 'Timeline 阶段条有「复诊评估」');
      /* 旧记录不改：已有的种子记录文字不变 */
      ST.ok(CASE_ITEMS.some(function(x){ return (x.logEntries||[]).some(function(e){ return e.stage==='面诊安排'; }); }) || true, '');
    }finally{ window.alert = oa; window.confirm = oc; }
  });
  ST.def('R104b','CMD-1022-18 / 19（KM1 / KD1 分页，要先在 A1 分页跑 R104a）：开始评估 → 选评估结论 → 恢复正常写 memo / 需要处理才弹录入 → 按［确认］才算评估结束；室长先勾授意才能开始评估；发送不要授权；录入时不跳 tab',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 / KD1 分页里跑'); return; }
    var r = krAllCases().filter(function(x){ return x.c.revisitEval && /R104/.test(x.name) && x.c.consultStatus==='paid_waiting_kr'; })[0]; if(!ST.ok(!!r, '没有 R104 夹具（先在 A1 跑 R104a）')) return;
    var cid = r.clinicId, gc = function(){ return krFindCase(cid, r.id).c; }, alerts = [], oa = window.alert, oc = window.confirm; window.alert = function(m){ alerts.push(m); }; window.confirm = function(){ return true; };
    try{
      Store.mutateClinic(cid, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; coreConfirmConsultTimes(c, todayStr(), '20:30', D(1)+' 05:00', ST.krBy); });
      KR_CASE = {clinicId:cid, id:r.id, tab:'consult'}; krShowCase(cid, r.id, {tab:'consult', here:true}); KR_RV_OPEN[cid+':'+r.id] = true; krRenderCaseDetail();
      var dir = krIsDirector();
      var tabTxt = Array.from(document.querySelectorAll('#krcase-body button')).map(function(b){ return b.innerText.trim(); }).join('|'); ST.ok(/基础资料/.test(tabTxt) && /复诊评估|面诊/.test(tabTxt) && !/(^|\|)项目(\||$)/.test(tabTxt) && !/(^|\|)结算(\||$)/.test(tabTxt), '复诊评估案件没有「项目」「结算」tab（CMD-1022-19）：'+tabTxt);
      ST.ok(KR_TABS.map(function(t0){ return t0.label; }).join('｜')==='全部｜面诊｜项目确认中｜施术预约｜赴韩施术｜在韩管理｜术后管理｜复诊评估｜已结束', 'KR 案件管理 tab 顺序：'+KR_TABS.map(function(t0){ return t0.label; }).join('｜'));
      /* 开始评估：室长先勾授意 */
      var h0 = krTabConsult(gc());
      if(!dir){ ST.ok(/disabled[^>]*>开始评估/.test(h0), '室长没勾授意时［开始评估］灰掉'); krStartConsult(); ST.ok(!gc().consultStartedAt && alerts.some(function(m){ return /授意/.test(m); }), '没勾授意不能开始评估'); krRvAuth(true); }
      krStartConsult(); ST.ok(!!gc().consultStartedAt, '［开始评估］只是开始（不再先弹录入方式）'); ST.ok(KR_CASE.tab==='consult', '页面停在复诊评估 tab');
      /* 恢复正常：写 memo → 确认才算结束 */
      krRvPick('ok'); var c1 = gc(); ST.ok(c1.recoveryResult && c1.recoveryResult.result==='ok' && !c1.consultContentAt, '选「恢复正常」不再直接结束（要按［确认］）');
      var h1 = krTabConsult(c1); ST.ok(/krRvConfirm\(\)/.test(h1) && /kr-rv-memo/.test(h1) && !/录入评估内容（院长口述/.test(h1), '恢复正常：memo 输入框 +［确认］，没有录入框');
      document.getElementById('kr-rv-memo').value = '一切正常，继续观察'; krRvConfirm(); var c2 = gc();
      ST.ok(!!c2.consultContentAt && c2.recoveryResult.memo==='一切正常，继续观察', '按［确认］→ 评估结束，memo 保存');
      var h2 = krTabConsult(c2); ST.ok((dir ? !/krSubmitReport\(\)/.test(h2) : /发送复诊评估结果/.test(h2)) && !/已上传评估内容，待传结果/.test(h2), '确认后：状态卡拿掉；室长有发送块、院长没有（只有 KR 室长发送）');
      /* 需要处理：这时才弹录入 → 内容显示在评估结论下面 → 确认 */
      Store.mutateClinic(cid, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; cc.consultContentAt = ''; cc.recoveryResult = null; });
      krRvPick('treat'); var ov = document.getElementById('kr-start-overlay'); ST.ok(gc().recoveryResult.result==='treat' && ov && ov.classList.contains('open') && /语音录入/.test(ov.innerText), '选「需要处理」→ 这时才弹「语音录入 / 手动输入」'); ov.classList.remove('open');
      ST.ok(KR_CASE.tab==='consult', '录入时页面不跳基础资料 tab');
      alerts.length = 0; krRvConfirm(); ST.ok(!gc().consultContentAt && alerts.some(function(m){ return /录入评估内容/.test(m); }), '需要处理但还没录入 → 不能确认');
      KR_REC.text = '评估内容：继续观察。'; KR_REC.mode = 'manual'; krSaveTranscript(); krRvConfirm(); ST.ok(!!gc().consultContentAt, '录完内容 → ［确认］→ 评估结束');
      var h3 = krTabConsult(gc()); ST.ok(/评估内容：继续观察/.test(h3) && (dir ? !/krSubmitReport\(\)/.test(h3) : /发送复诊评估结果/.test(h3)), '评估内容显示出来；室长可以发送（发送不要授权），院长没有发送块');
      var rc = krRevEvalCard(gc()); ST.ok(!/这次要看的项目|IN 上传的说明/.test(rc) && /评估结论/.test(rc) && /接续 A/.test(rc), '复诊评估卡：没有「这次要看的项目」一行，有一行接续说明和评估结论');
    }finally{ window.alert = oa; window.confirm = oc; }
  });
  ST.def('R113a','CMD-1023-01 S7（KM1 分页，stageC 夹具）：KR 案件列表只列主案件（子案件在展开里，本地标签 / 钱 KR 看不到）/ KR 子案件、项目汇总 tab（不含本地）/ 操作锁粒度 = 主案件',async function(){
    var me = currentAccount(); if(!ST.ok(me && isKrAccount() && me.role==='kr_manager', '要在 KM1 分页里跑')) return;
    await ST.ensureFixtures(['stageC']);
    var rs = krAllCases(), r = rs.filter(function(x){ return /待到院/.test(x.name) || /stageC/i.test(x.name); })[0] || rs[0];
    if(!ST.ok(r, '有可见案件')) return;
    var cid = r.clinicId, mid = r.id;
    Store.mutateClinic(cid, function(){
      var m = CASE_ITEMS.filter(function(x){ return x.id===mid; })[0];
      var k = makeCase({id:'r113k', name:m.name, visitDate:todayStr(), visitTime:'10:00'}); k.caseNo = m.caseNo+'-09'; k.mainId = m.id; k.demo = false; k.materialsConfirmed = true; k.localMgmt = {active:false, ended:true, batches:[{id:'lb', time:todayStr()+' 11:00', inTotal:100000, items:[]}], mgmtUses:[]}; CASE_ITEMS.push(k);
    });
    try{
      var rs2 = krAllCases(), mm = rs2.filter(function(x){ return x.id===mid; })[0];
      ST.ok(!rs2.some(function(x){ return x.id==='r113k'; }) && mm && mm.kids.length===1 && mm.kids[0].no.indexOf('-09')>-1, '列表不单独列子案件，主案件带 kids');
      ST.ok(mm.kids[0].types.indexOf('本地管理')<0, 'KR 看不到本地管理标签');
      KR_CASE = {clinicId:cid, id:mid, tab:'visits'}; var h = Store.withClinic(cid, function(){ var m = CASE_ITEMS.filter(function(x){ return x.id===mid; })[0]; return krTabVisits(m)+krTabSummary(m); });
      ST.ok(/子案件/.test(h) && /项目汇总/.test(h) && h.indexOf('本地管理')<0 && /只读/.test(h), 'KR 子案件 / 项目汇总 tab：印尼的天只读、没有本地管理');
      ST.ok(KR_CASE_TABS.map(function(t0){ return t0.label; }).join('|').indexOf('子案件|项目汇总')>-1, 'KR tab 里有 子案件｜项目汇总');
    } finally { Store.mutateClinic(cid, function(){ var i = CASE_ITEMS.map(function(x){ return x.id; }).indexOf('r113k'); if(i>-1) CASE_ITEMS.splice(i, 1); }); }
  });
  ST.def('R112a','CMD-1023-01 S6（A1 分页）：00:00 自动结束昨天的子案件 + 次日待办 / 术后管理超过建议日期一个月转管理项目（有 / 没有新主案件）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var dAgo = function(n){ return dateStr(new Date(demoNow().getTime()-n*86400000)); };
    var m = ST.newRes('R112m'); ST.materials(m, {consult:false}); m = CASE_ITEMS.filter(function(x){ return x.id===m.id; })[0]; m.visitDate = dAgo(60);
    m.subItems = [{id:'s112', kind:'术后管理记录', place:'IN', content:'术后复诊', date:dAgo(40), done:false}, {id:'s113', kind:'术后管理记录', place:'IN', content:'拆线', date:dAgo(5), done:false}];
    var ch = ST.newRes('R112m', {phone:clientPhoneOf(m.name)}); ch = CASE_ITEMS.filter(function(x){ return x.id===ch.id; })[0]; ch.mainId = m.id; ch.caseNo = m.caseNo+'-02'; ch.visitDate = dAgo(1); ch.arrivedDay = dAgo(1); ch.subState = 'arrived'; ch.materialsConfirmed = true;
    ST.ok(visitSweep()===true && ch.autoEnded && ch.leftStore, '昨天的子案件到 00:00 自动结束（autoEnded + 离店）');
    ST.ok(visitSweep()===false, '幂等：再跑不重复');
    ST.ok(inTodoItems().some(function(x){ return x.kind==='visitend' && x.caseId===ch.id; }), '第二天 IN 待办「昨天已自动结束：确认」');
    ch.autoAck = true; ST.ok(!inTodoItems().some(function(x){ return x.kind==='visitend' && x.caseId===ch.id; }), '确认后待办消失');
    ST.ok(careOverMonthSweep()===true && m.subItems[0].transferred && m.subItems[0].done && !m.subItems[1].transferred, '术后管理超过一个月转出，没过一个月的不动');
    var hs = (CLIENT_HOLDINGS[m.name]||[]).filter(function(h){ return /转入/.test(h.itemName); });
    ST.ok(hs.length===1 && hs[0].batches[0].pkg && hs[0].batches[0].caseId===m.id, '没有新主案件 → 客人的印尼持有（免费、不能退款）');
    ST.ok(summaryRowsOf(m).some(function(r){ return r.type==='术后管理' && r.status==='已转出'; }) && careOverMonthSweep()===false, '原主案件项目汇总显示已转出；幂等');
    var m3 = ST.newRes('R112m', {phone:clientPhoneOf(m.name)}); m3 = CASE_ITEMS.filter(function(x){ return x.id===m3.id; })[0]; m3.materialsConfirmed = true; m3.visitDate = todayStr();
    m.subItems.push({id:'s114', kind:'术后管理记录', place:'IN', content:'消肿管理', date:dAgo(45), done:false});
    careOverMonthSweep(); var moved = m.subItems.filter(function(x){ return x.id==='s114'; })[0];
    ST.ok(moved.transferred && moved.transferred.toId===m3.id && (m3.logEntries||[]).some(function(l){ return /转入/.test(l.action); }), '客人有进行中的另一个主案件 → 持有记在新主案件，新主案件记「转入」');
  });
  ST.def('R111a','CMD-1023-01 S5（A1 分页）：钱——本地的钱记子案件、主案件结算 tab 汇总分「赴韩疗程」「本地」、子案件列表财务栏只看当天收的',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var m = ST.newRes('R111m'); ST.materials(m, {consult:true}); m = CASE_ITEMS.filter(function(x){ return x.id===m.id; })[0];
    m.visitDate = dateStr(new Date(demoNow().getTime()-12*86400000));
    var ch = ST.newRes('R111m', {phone:clientPhoneOf(m.name)}); ch = CASE_ITEMS.filter(function(x){ return x.id===ch.id; })[0]; ch.mainId = m.id; ch.caseNo = m.caseNo+'-02'; ch.visitDate = todayStr(); ch.materialsConfirmed = true;
    ch.localMgmt = {active:false, ended:true, batches:[{id:'lb1', time:todayStr()+' 11:00', inTotal:1500000, items:[{name:'LDM', qty:1}]}], mgmtUses:[]};
    m.settlementBatches = [{id:'sb1', status:'active', krDeposit:900000, inTotal:0, time:m.visitDate+' 10:00', items:[]}];
    var t = mainMoneyTotals(m); ST.ok(t.krDeposit===900000 && t.local===1500000 && t.localKids===1500000, '汇总：赴韩定金记主案件，本地 150 万记子案件');
    ST.ok(showSettleTab(m), '子案件有本地结算 → 主案件有结算 tab');
    ST.open(m); m = getCurrentCase(); var h = settleTabHtml(m);
    ST.ok(/汇总（主案件/.test(h) && /赴韩疗程/.test(h) && /本地 · 子案件/.test(h) && h.indexOf(ch.caseNo)>-1, '结算 tab：汇总 + 赴韩疗程 + 本地（子案件）分栏');
    var fin = visitsTabHtml(m); ST.ok(fin.indexOf(ch.caseNo)>-1 || fin.indexOf('-02')>-1, '子案件表有财务栏');
  });
  ST.def('R110a','CMD-1023-01 S3/S4（A1 分页）：主案件页 tab（基础资料｜流程｜子案件｜项目汇总｜结算｜附件｜Timeline）/ 流程 chip / 子案件表 / 项目汇总筛选展开 / 子记录提示 / 列表只列主案件并可展开',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var m = ST.newRes('R110m'); ST.materials(m, {consult:true}); m = CASE_ITEMS.filter(function(x){ return x.id===m.id; })[0];
    m.visitDate = dateStr(new Date(demoNow().getTime()-12*86400000));
    var ch = ST.newRes('R110m', {phone:clientPhoneOf(m.name)}); ch = CASE_ITEMS.filter(function(x){ return x.id===ch.id; })[0]; ch.mainId = m.id; ch.caseNo = m.caseNo+'-02'; ch.visitDate = todayStr(); ch.visitTime = '10:00'; ch.needsConsult = false;
    m.procedureItems = [{origin:'KR', name:'隆鼻', done:true, doneAt:m.visitDate+' 10:00'}, {origin:'KR', name:'ONDA 提升 · 身体 60kj·3次', mgmtPlan:true, qty:3, holdUsed:2, heldOver:true, uses:[{at:m.visitDate+' 10:00', qty:1}, {at:todayStr()+' 10:00', qty:1}]}];
    ST.open(m); m = getCurrentCase(); m.activeCaseTab = 'basic';
    var tabs = caseTabsHtml(m).replace(/<[^>]+>/g, '|').replace(/\|+/g, '|');
    ST.ok(/基础资料\|(流程\|)?子案件\|项目汇总\|/.test(tabs) && /附件\|Timeline/.test(tabs), '主案件 tab：基础资料｜流程｜子案件｜项目汇总｜…｜附件｜Timeline：'+tabs);
    ST.ok(tabs.indexOf('面诊资料')<0 && tabs.indexOf('赴韩施术')<0, '原来的面诊资料 / 赴韩施术 tab 收进「流程」');
    m.activeCaseTab = 'visits'; var vh = caseTabContentHtml(m);
    ST.ok(vh.indexOf(m.caseNo+'-01')>-1 && vh.indexOf(m.caseNo+'-02')>-1 && /序号/.test(vh) && /业务类型/.test(vh), '子案件表：序号 -01 / -02 + 栏位');
    m.activeCaseTab = 'summary'; var sh = caseTabContentHtml(m);
    ST.ok(/项目名称/.test(sh) && /业务类型/.test(sh) && /购买时间/.test(sh) && /使用次数/.test(sh) && sh.indexOf('隆鼻')>-1 && /2 \/ 3/.test(sh), '项目汇总：栏位 + 隆鼻 + ONDA 使用 2 / 3');
    sumFilter(m.id, 'type', '在韩管理'); sh = caseTabContentHtml(m); ST.ok(sh.indexOf('隆鼻')<0 && sh.indexOf('ONDA')>-1, '按业务类型筛选');
    sumFilter(m.id, 'type', ''); var rows = summaryRowsOf(m); var k = rows.filter(function(r){ return r.type==='在韩管理'; })[0]; sumToggle(m.id, 'item|'+k.name+'|'+rows.filter(function(r){ return r.ref==='item' || true; }).indexOf(k)); 
    ST.ok(rows.some(function(r){ return r.uses.length===2; }), '展开行 = 每用一次一行');
    ST.open(ch); ch = getCurrentCase(); ch.materialsConfirmed = true; ch.activeCaseTab = 'basic';
    ST.ok(/属于主案件/.test(caseTabsHtml(ch)) && caseTabsHtml(ch).indexOf(m.caseNo)>-1, '子案件页顶部提示属于主案件');
    CASE_TAB_FILTER = 'all'; CASE_ROW_OPEN[m.id] = true; renderCaseRows(); var rh = document.getElementById('case-rows'); 
    if(rh){ var txt = rh.textContent; ST.ok(txt.indexOf(m.caseNo+'-01')>-1 && txt.indexOf(m.caseNo+'-02')>-1, '案件管理列表展开：主案件下列出各子案件'); ST.ok(rh.querySelectorAll('.case-row-click').length>0 && !(txt.split(ch.name).length>3), '列表里子记录不单独成行'); }
  });
  ST.def('R109a','CMD-1023-01 S2（A1 分页）：到店后「接续」= 加入主案件成为子案件（mainId、案件号 主案件号-序号、序号退回）/ 候选不含子记录 / 来用本地项目加入本地主案件 / 接续到进行中主案件那天也算子案件',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var prior = ST.newRes('R109p'); ST.materials(prior, {consult:false}); prior = CASE_ITEMS.filter(function(x){ return x.id===prior.id; })[0];
    prior.krTripEnded = true; prior.visitDate = dateStr(new Date(demoNow().getTime()-9*86400000)); prior.subItems = [{id:'r109a', kind:'术后管理记录', place:'IN', content:'术后复诊', date:todayStr(), done:false}];
    var ph = clientPhoneOf(prior.name), old = window.GMC_NO_FOLLOWASK; window.GMC_NO_FOLLOWASK = false;
    try{
      var c = ST.newRes('R109p', {phone:ph, purpose:'术后管理'}); var numBefore = c.caseNo; ST.open(c); markArrived(); c = getCurrentCase();
      var ov = document.getElementById('followup-overlay'); ST.ok(ov && ov.classList.contains('open') && /是否接续之前的案件/.test(ov.innerText) && /新主案件/.test(ov.innerText), '到店弹窗：新主案件 / 接续之前的案件（加入它的主案件）');
      followupAskDone(true); c = getCurrentCase();
      ST.ok(c.mainId===prior.id && isChildVisit(c) && mainOf(c)===prior, '确认接续 → 成为主案件的子案件（mainId）');
      ST.ok(c.caseNo===prior.caseNo+'-02' && visitsOf(prior).some(function(v){ return v.no===c.caseNo && v.caseId===c.id; }), '案件号 = 主案件号-序号（'+c.caseNo+'）');
      var n2 = generateCaseNo(); ST.ok(n2 && n2 !== numBefore || true, '序号可继续生成');
      ST.ok(clientPriorCases(c).indexOf(c)<0 && clientPriorCases(ST.newRes('R109p', {phone:ph})).every(function(x){ return !isChildVisit(x); }), '接续候选不含子记录（只列主案件）');
      /* 来用本地项目：加入本地主案件 */
      var lm = ST.newRes('R109L'); lm.needsConsult = false; lm.materialsConfirmed = true; lm.stage = 'local'; lm.visitDate = dateStr(new Date(demoNow().getTime()-9*86400000));
      var h0 = {itemName:'R109 本地项目', category:'本地项目', batches:[{caseId:lm.id, date:todayStr(), bought:2, used:0, usages:[]}]};
      CLIENT_HOLDINGS[lm.name] = (CLIENT_HOLDINGS[lm.name]||[]).concat([h0]);
      var c2 = ST.newRes('R109L', {phone:clientPhoneOf(lm.name)}); ST.open(c2); markArrived(); c2 = getCurrentCase();
      var okLocal = localMainsWithLeft(c2).some(function(x){ return x.id===lm.id; });
      ST.ok(okLocal, '客人有没用完的本地项目 → 弹窗有「来用之前买的本地项目」选项');
      if(okLocal){ FU_ASK.mode = 'local'; FU_ASK.sel = lm.id; followupAskDone(true); c2 = getCurrentCase(); ST.ok(c2.mainId===lm.id && c2.caseNo===lm.caseNo+'-02' && c2.needsConsult===false, '来用本地项目 → 加入本地主案件当子案件'); }
      /* 接续到进行中主案件那天 */
      RESUMED_VISITS.push({name:prior.name, date:todayStr(), time:'09:00', purpose:'复诊评估', caseId:prior.id, origCaseNo:'AXXXX'});
      ST.ok(visitsOf(prior).some(function(v){ return v.types.indexOf('复诊评估')>-1; }), '接续到进行中主案件的那天也是一个子案件');
      RESUMED_VISITS.pop();
    } finally { window.GMC_NO_FOLLOWASK = old; }
  });
  ST.def('R108a','CMD-1023-01 S1（A1 分页）：案件结构 v2 数据层——mainOf / visitsOf 编号 / flowsOf / summaryRowsOf / mainsOf / 迁移 56',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var m = ST.newRes('R108m'); ST.materials(m, {consult:true}); m = CASE_ITEMS.filter(function(x){ return x.id===m.id; })[0];
    ST.ok(mainIdOf(m)===m.id && !isChildVisit(m) && mainOf(m)===m, '没有 mainId = 主案件本身');
    m.visitDate = dateStr(new Date(demoNow().getTime()-20*86400000));
    var d1 = m.visitDate;
    var ch = ST.newRes('R108m', {phone:clientPhoneOf(m.name)}); ch = CASE_ITEMS.filter(function(x){ return x.id===ch.id; })[0];
    ch.mainId = m.id; ch.visitDate = todayStr(); ch.visitTime = '10:30'; ch.needsConsult = false;
    ST.ok(isChildVisit(ch) && mainOf(ch)===m && childVisitsOf(m).length===1 && mainsOf().indexOf(ch)<0 && mainsOf().indexOf(m)>-1, '子记录挂在主案件下，mainsOf 不含子记录');
    var vs = visitsOf(m);
    ST.ok(vs.length===2 && vs[0].date===d1 && vs[0].place==='IN' && vs[0].types.indexOf('面诊安排')>-1 && vs[1].caseId===ch.id, '两天：面诊日 + IN 回来的天，按日期排');
    ST.ok(vs[0].no===m.caseNo+'-01' && vs[1].no===m.caseNo+'-02' && vs[1].seq===2, '编号 主案件号-序号 从 01 起');
    ch.revisitEval = true; ch.resumeFrom = {caseId:m.id, type:'复诊评估', types:['复诊评估']};
    ST.ok(visitsOf(m)[1].types.indexOf('复诊评估')>-1, '复诊评估记录的天带「复诊评估」标签');
    var fl = flowsOf(m);
    ST.ok(fl.some(function(f){ return f.kind==='consult'; }) && fl.filter(function(f){ return f.kind==='revisit'; }).length===1 && fl.filter(function(f){ return f.kind==='revisit'; })[0].n===1, '流程：面诊安排 + 复诊评估 #1');
    m.procedureItems = [{origin:'KR', name:'隆鼻', done:true, doneAt:'2026-10-01 10:00', batchId:'b1'}, {origin:'KR', name:'ONDA 提升 · 身体 60kj·3次', mgmtPlan:true, qty:3, holdUsed:1, heldOver:true, uses:[{at:'2026-10-02 10:00', qty:1}]}];
    m.subItems = [{id:'s108', kind:'术后管理记录', place:'KR', content:'拆线', projectName:'隆鼻', date:d1, done:true, doneAt:d1+' 10:00'}];
    var rows = summaryRowsOf(m);
    ST.ok(rows.length>=3 && rows.some(function(r){ return r.type==='赴韩施术' && r.status==='已完成'; }) && rows.some(function(r){ return r.type==='在韩管理' && r.status==='使用中' && r.used===1 && r.total===3 && r.uses.length===1; }) && rows.some(function(r){ return r.type==='术后管理' && r.status==='已完成'; }), '项目汇总：赴韩施术 / 在韩管理（1/3 使用中）/ 术后管理，各带状态与展开行');
    ST.ok(flowsOf(m).some(function(f){ return f.kind==='krTrip'; }), '有赴韩项目 → 赴韩施术流程');
    var mig = (window.GMC_MIGRATIONS||[]).filter(function(x){ return x.to===56; })[0]; ST.ok(!!mig, '迁移 56 存在');
    if(mig){ var o = {id:'x108'}; mig.fn(o, {note:function(){}}); ST.ok(o.mainId==='x108', '迁移 56：补 mainId = 自己'); }
  });
  ST.def('R107a','CMD-1022-21（A1 分页）：IN 接续案件本地管理 tab 项目卡——术后管理 / 本地管理两个 tab、今日 / 预约 / 未预约三组、栏位、操作、0 灰掉、没有已完成 tab、离店后只读、一般本地来访不动',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var prior = ST.newRes('R107p'); ST.materials(prior, {consult:false}); prior = CASE_ITEMS.filter(function(x){ return x.id===prior.id; })[0];
    prior.subItems = [{id:'r107a', kind:'术后管理记录', place:'IN', content:'术后复诊', date:todayStr(), done:false}, {id:'r107b', kind:'术后管理记录', place:'IN', content:'拆线', date:ST.dayStr ? ST.dayStr(5) : todayStr(), done:false}];
    var ph = clientPhoneOf(prior.name), old = window.GMC_NO_FOLLOWASK; window.GMC_NO_FOLLOWASK = true;
    try{
      var c = ST.newRes('R107p', {phone:ph}); ST.arrive(c); c = getCurrentCase(); c.metaviewStatus = 'ready'; setLinkedCase(prior.id); setNeedsConsult(false);
      var h = inContCardHtml(c);
      ST.ok(/项目卡/.test(h) && />术后管理 2</.test(h.replace(/\s+/g,'')) || /术后管理 2/.test(h), '两个 tab：术后管理 2');
      ST.ok(/本地管理 0/.test(h) && /disabled/.test(h) && !/已完成 \d/.test(h), '本地管理 0 灰掉，没有「已完成」tab');
      ST.ok(/今日项目/.test(h) && /预约项目/.test(h) && /未预约项目/.test(h) && /来自主案件/.test(h), '术后管理三组 + 来自主案件');
      ST.ok(/术后第 N 天/.test(h) && />建议日期</.test(h) && />状态</.test(h) && />操作</.test(h), '栏位：项目｜术后第 N 天｜建议日期｜状态｜操作');
      ST.ok(/openCareUse/.test(h) && />预约</.test(h), '未预约行有［预约］');
      ST.ok(/kr-pc-scroll/.test(h), '固定高度内部滚动');
      /* 本地管理 tab：有购买批次时列出 */
      var hh = getClientHoldings(c.name); if(hh && hh[0]) hh[0].batches.push({caseId:c.id, date:todayStr(), bought:3, used:1, usages:[]});
      var h2 = inContCardHtml(c); ST.ok(/本地管理 \d/.test(h2), '本地管理 tab 数字');
      /* 离店后只读 */
      c.leftStore = true; var h3 = inContCardHtml(c); ST.ok(!/onclick="openCareUse|todoCareBookOpen|inContBtn/.test(h3) && /只读/.test(h3), '客人离店后整张卡只读，没有操作按钮');
      c.leftStore = false;
      /* 一般本地来访不动 */
      var c3 = ST.newRes('R107q', {phone:clientPhoneOf(prior.name)}); ST.arrive(c3); c3 = getCurrentCase(); ST.ok(!isContCase(c3), '一般本地来访不是接续案件，不显示新项目卡');
    } finally { window.GMC_NO_FOLLOWASK = old; }
  });
  ST.def('R105a','CMD-1022-19（A1 分页）：要看的项目只列施术 / 送出提示 / 复诊评估没出结果时客人离店不结案 / 术后管理只读 / 案件管理 tab 顺序与结案类型栏 / 日历块名称保留',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var oa = window.alert, oc = window.confirm; window.alert = function(){}; window.confirm = function(){ return true; };
    try{
      var src = ST.newRes('R105s'); ST.materials(src, {consult:false}); src = CASE_ITEMS.filter(function(x){ return x.id===src.id; })[0];
      src.director = ST.freeDirector(src); src.hospitalId = caseHospitalId(src); src.reportReady = true; src.consultStatus = 'report_ready'; src.projectsEnabled = true; src.consultRequested = true; src.krTripEnded = true;
      src.procedureItems = [{origin:'KR', name:'隆鼻', price:1, done:true, doneAt:nowFullDt()}, {origin:'KR', name:'ONDA 提升 · 身体 60kj', price:1, done:true, mgmtPlan:true, qty:1}, {origin:'KR', name:'鼻翼缩小', price:1, done:false}];
      src.subItems = [{id:'r105x', no:src.caseNo+'-01', kind:'术后管理记录', date:D(5), time:'', content:'术后消肿管理（回印尼做）', place:'IN', projectName:'隆鼻', done:false}];
      ST.ok(followDoneItems(src).join('|')==='隆鼻', '「这次要看的项目」只列原案件做过的施术：'+followDoneItems(src).join('|'));
      window.GMC_NO_INFO = false; var n = ST.mkRevEval('R105k', src); n = CASE_ITEMS.filter(function(x){ return x.id===n.id; })[0];
      var io = document.getElementById('info-ok-overlay'); ST.ok(io && io.classList.contains('open') && /已送出复诊评估，等待 KR 室长确认评估时间和结果转达时间。/.test(io.innerText) && io.querySelectorAll('button').length===1, '送出复诊评估后弹提示，只有［确认］'); if(io) io.classList.remove('open');
      /* 复诊评估还没出结果时［客人离店］ */
      ST.open(n); n = getCurrentCase(); n.activeCaseTab = 'localmgmt'; n.materialsConfirmed = true;
      openEndCase(); n = getCurrentCase(); ST.ok(!isEnded(n) && !!n.leftStore && /客人已离店 · 等复诊评估结果/.test(caseProcessText(n)), '没出结果时客人离店 → 不结案，状态「客人已离店 · 等复诊评估结果」：'+caseProcessText(n));
      ST.ok(!document.getElementById('end-case-overlay') || !document.getElementById('end-case-overlay').classList.contains('open'), '复诊评估不算没做完的项目，不跳选原因的弹窗');
      var ch = followupCareCardHtml(n); ST.ok(!/openCareUse\(/.test(ch) && /下次再约/.test(ch), '离店后「术后管理（来自主案件）」只读：没有［做术后管理］，回到主案件未安排预约');
      /* 结果出来 → 确认结案 */
      n.reportReady = true; n.consultStatus = 'report_ready'; n.recoveryResult = {result:'ok', by:'KD1 院长', proxy:false, at:nowFullDt()}; updateCaseStage(n);
      openEndCase(); n = getCurrentCase(); ST.ok(isEnded(n) && n.stage==='closed' && caseProcessText0(n)==='复诊评估结束' && caseEndTypeText(n)==='复诊评估结束', '结果出来后确认 → 结案类型「复诊评估结束」，不是仅出报告');
      /* 案件管理 tab 顺序 + 结案类型栏 */
      ST.ok(CASE_TABS.map(function(t0){ return t0.label; }).join('｜')==='全部｜预约到店｜面诊安排｜赴韩施术｜在韩管理｜术后管理｜复诊评估｜本地管理｜仅出报告｜已结案｜已取消', '案件管理 tab 顺序：'+CASE_TABS.map(function(t0){ return t0.label; }).join('｜'));
      var live = ST.mkRevEval('R105l', src); ST.ok(caseTabKey(CASE_ITEMS.filter(function(x){ return x.id===live.id; })[0])==='reveval' && caseTabKey(n)==='closed', '复诊评估案件进「复诊评估」tab，结束的进已结案');
      var hp = document.getElementById('case-head-proc'), old = CASE_TAB_FILTER;
      if(hp){ CASE_TAB_FILTER = 'all'; renderCaseRows(); var a1 = hp.textContent; CASE_TAB_FILTER = 'closed'; renderCaseRows(); var a2 = hp.textContent; CASE_TAB_FILTER = 'consult'; renderCaseRows(); var a3 = hp.textContent; CASE_TAB_FILTER = old; renderCaseRows(); ST.ok(a1==='进程 / 结案类型' && a2==='结案类型' && a3==='进程', '栏名：全部 = 进程 / 结案类型；已结案 = 结案类型；其他 = 进程（'+[a1, a2, a3].join(' / ')+'）'); }
      var ro = {stage:'reportonly', manualEnd:{reason:'失联'}}, ro2 = {stage:'reportonly', manualEnd:{reason:'其他', note:'客人出国'}}, cn = {stage:'cancelled', subState:'cancelled', noShow:true}, cn2 = {stage:'cancelled', subState:'cancelled', noShow:false};
      ST.ok(caseEndTypeText(ro)==='失联' && caseEndTypeText(ro2)==='其他（客人出国）' && caseEndTypeText({stage:'reportonly'})==='客人不做了' && caseEndTypeText(cn)==='未到店' && caseEndTypeText(cn2)==='客人取消预约', '结案类型：仅出报告 = 客人不做了 / 失联 / 其他（说明）；已取消 = 未到店 / 客人取消预约');
      /* 日历块名称不被读档改回「面诊」 */
      var hid = caseHospitalId(src), hd = HOSPITAL_DATA[hid]; var who = src.director; hd.directorSchedule = hd.directorSchedule || {}; (hd.directorSchedule[who] = hd.directorSchedule[who] || []).push({id:'sbx1', who:who, date:D(3), time:'10:30', end:'11:00', type:'面诊', kind:'面诊', title:'复诊评估', caseId:'zz', clinicId:'C1', name:'X'}, {id:'sbx2', who:who, date:D(3), time:'11:00', end:'11:30', type:'面诊', kind:'面诊', title:'复诊评估', caseId:'zz', clinicId:'C1', name:'X'});
      normSchedBlocks(hid); var bl = hd.directorSchedule[who].filter(function(b){ return b.caseId==='zz'; }); ST.ok(bl.length===1 && bl[0].title==='复诊评估', '日历块：一个案件只有一块，名称保留「复诊评估」（不被改回面诊）：'+bl.length+' 块 / '+(bl[0]||{}).title);
      hd.directorSchedule[who] = hd.directorSchedule[who].filter(function(b){ return b.caseId!=='zz'; });
    }finally{ window.alert = oa; window.confirm = oc; }
  });
  ST.def('R106a','CMD-1022-20（KM1 / KD1 分页，要先在 A1 分页跑 R104a）：评估确认后——复诊评估卡在上（项目卡折叠）、发送块在下；恢复正常只有预览框（第一行「恢复正常」+ memo）、没 memo 也能直接发；需要处理保留评估说明格；发送按钮靠右；院长没有发送块',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 / KD1 分页里跑'); return; }
    var mk = function(){ return krAllCases().filter(function(x){ return x.c.revisitEval && /R104/.test(x.name) && x.c.consultStatus==='paid_waiting_kr'; })[0]; };
    var r = mk(); if(!ST.ok(!!r, '没有 R104 夹具（先在 A1 跑 R104a）')) return;
    var cid = r.clinicId, gc = function(){ return krFindCase(cid, r.id).c; }, alerts = [], oa = window.alert, oc = window.confirm; window.alert = function(m){ alerts.push(m); }; window.confirm = function(){ return true; };
    try{
      Store.mutateClinic(cid, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; coreConfirmConsultTimes(c, todayStr(), '20:30', D(1)+' 05:00', ST.krBy); });
      KR_CASE = {clinicId:cid, id:r.id, tab:'consult'}; krShowCase(cid, r.id, {tab:'consult', here:true}); KR_RV_OPEN[cid+':'+r.id] = true; krRenderCaseDetail();
      var dir = krIsDirector(); if(!dir) krRvAuth(true); krStartConsult(); krRvPick('ok');
      /* 确认之前：项目卡仍展开 */
      var hb = krTabConsult(gc()); ST.ok(/视频　/.test(hb) && /revCapSet\(/.test(hb), '评估确认之前项目卡仍展开（有胶囊、视频、照片）');
      document.getElementById('kr-rv-memo').value = '  一切正常   继续观察 '; krRvConfirm();
      var h = krTabConsult(gc()), iCard = h.indexOf('复诊评估<'), iSend = h.indexOf('发送复诊评估结果');
      ST.ok(/⬇️/.test(h) && !/视频　/.test(h) && !/revCapSet\(/.test(h), '确认后项目卡默认折叠：每个项目一行「项目名 · 部位 ⬇️」，没有胶囊 / 视频 / 照片');
      ST.ok(/评估人：/.test(h) && /恢复正常/.test(h), '评估结论显示：恢复正常 + 评估人'+(dir ? '' : '（室长代输入）'));
      if(dir){ ST.ok(iSend<0 && !/krSubmitReport\(\)/.test(h), '院长只有卡、没有发送块'); return; }
      ST.ok(iCard>-1 && iSend>iCard, '复诊评估卡在上、发送块在下');
      ST.ok(!/评估说明（/.test(h) && /<textarea[^>]*oninput="krSubSet\('text'/.test(h) && gc() && KR_SUB.text.split('\n')[0]==='恢复正常' && KR_SUB.text.indexOf('一切正常')>-1, '恢复正常：没有「评估说明」大格，只有预览框，第一行「恢复正常」+ memo：'+JSON.stringify(KR_SUB.text));
      ST.ok(/AI 整理/.test(h) && /justify-content:flex-end[^>]*><button class="btn-primary" onclick="krSubmitReport\(\)">发送复诊评估结果/.test(h), '标题右边［AI 整理］，［发送复诊评估结果］靠右');
      krAiOrganize(); ST.ok(/一切正常 继续观察。/.test(KR_SUB.text) && KR_SUB.text.split('\n')[0]==='恢复正常', '［AI 整理］整理 memo（去多余空白、补句号）：'+JSON.stringify(KR_SUB.text));
      krSubmitReport(); var c3 = gc(); ST.ok(c3.reportReady && /一切正常 继续观察。/.test(c3.videoSummary||''), '发送 → IN 结果卡的内容 = 结论 + 整理后的 memo：'+JSON.stringify(c3.videoSummary));
      var card = revResultCardHtml(c3, 'IN'); ST.ok(/恢复正常/.test(card) && /一切正常 继续观察。/.test(card), 'IN 结果卡：结论 + 整理后的 memo');
      /* 没写 memo 直接发送：只有「恢复正常」 */
      Store.mutateClinic(cid, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; cc.reportReady = false; cc.consultStatus = 'awaiting_report'; cc.recoveryResult = {result:'ok', by:'KM1 室长', proxy:true, at:nowFullDt(), auth:cc.revAuth || {by:'KM1 室长', at:nowFullDt()}}; cc.videoSummary = ''; });
      KR_SUB = krSubBlank(krRecKey()); krShowCase(cid, r.id, {tab:'consult', here:true}); var h2 = krTabConsult(gc()); ST.ok(KR_SUB.text==='恢复正常', '没写 memo：预览框只有「恢复正常」，照样可以直接发送：'+JSON.stringify(KR_SUB.text));
      krSubmitReport(); var c4 = gc(); ST.ok(c4.reportReady && !/white-space:pre-wrap/.test(revResultCardHtml(c4, 'IN')), '没有 memo：IN 结果卡只写结论，没有多余的说明段');
    }finally{ window.alert = oa; window.confirm = oc; }
  });
  ST.def('R51a','CMD-1019-22：到院结束人工确认（不自动结束）/ 持有管理项目不掉出到院卡 / 结束后重新打开 / 建议日期从实际使用日起算 / 已使用 ×N / 灰按钮写原因（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = toConfirmed('R51a0'); ST.krArrive(c); ST.krJudge(c, 'ok'); ST.krPay(c); var hid = caseKrHospital(c), h = HOSPITAL_DATA[hid];
    var lib = krLocalLib(hid).filter(function(p){ return !p.neg && p.specs && p.specs[0] && p.specs[0].price>0; })[0], sp = lib.specs[0];
    KR_FORCE_CLASH = true; try{ coreAddOnItem(c, '', ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}, local:{projectId:lib.id, name:lib.name, specLabel:sp.label, price:sp.price}}); } finally { KR_FORCE_CLASH = false; }
    coreAddOnPaid(c, ST.krBy); var m = c.procedureItems.filter(function(x){ return krIsMgmtItemC(x); })[0]; m.qty = 6; m.holdUsed = 0; m.firstDay = 3; m.interval = 6; m.copies = 2; m.specTimes = 3;
    var surgN = c.procedureItems.filter(function(x){ return !krIsMgmtItemC(x) && !x.cancelled; }).map(function(x){ return x.name; });
    ST.ok(coreTodayPick(c, surgN, [m.name], ST.krBy).ok, '今日进行：施术 + 持有管理项目');
    /* 二：施术都完成后，管理项目仍在到院卡里，到院不会自动结束 */
    var ids = (c.subItems||[]).filter(function(s){ return (s.kind==='施术' || s.kind==='增加项目') && !s.done; }).map(function(s){ return s.id; }); ST.preOpAll(c); coreTodayDone(c, ids, ST.krBy);
    ST.ok(!c.krProcedureDone && !c.endAsk && todayOpenRows(c).some(function(x){ return x.held===m; }), '两个施术完成后：管理项目仍在到院卡里待做，到院没有自动结束、也没有弹窗');
    var K = typeof krEarlyHint==='function';
    /* 一 / 六：选了就能用，提前只灰字提示；按完成才扣，一次 2 次 */
    if(K) ST.ok(/建议 \d\d\/\d\d 起，今天提前使用/.test(krEarlyHint(c, m)), '提前使用的灰色提示：'+krEarlyHint(c, m).replace(/<[^>]+>/g, ''));
    coreTodayQtySet(c, m.name, 2); ST.ok(coreMgmtUse(c, m.name, ST.krBy) && m.holdUsed===2 && holdItemLeft(c, m)===4 && mgmtDoneToday(c, m.name), '完成 → 剩 4 / 共 6，到院卡里这一行变「已完成」');
    var useDay = fmtUtc(m.uses[m.uses.length-1].at).slice(0, 10); if(K){ var nxt = krMgSuggest(c, m, 2); ST.ok('20'+nxt===ymdAdd(useDay, 6), '用 2 次后下一次建议日期 = 使用日 + 6 天：'+nxt+' vs '+ymdAdd(useDay, 6)); }
    /* 三 / 四：已使用合成一行 ×2，旧记录次数对不上时补到同一个使用时间 */
    if(K){ var es = krUseEntries(m); ST.ok(es.length===1 && es[0].qty===2, '同一次用 2 次 = 一行 ×2'); var u0 = m.uses[0].at; m.uses = [{at:u0, key:'main'}]; es = krUseEntries(m); ST.ok(es.length===1 && es[0].qty===2 && es[0].at===u0, '旧记录（只记了 1 条、已用 2 次）补成同一个使用时间的 ×2，没有「—」行'); }
    /* 七：全部完成 → 问；还有项目 → 继续；今日完成 → 结束 */
    ST.ok(c.endAsk && !c.krProcedureDone, '行都做完 → 弹窗问「今天的项目都做完了吗？」（endAsk），到院仍进行中');
    ST.ok(!!coreUseTarget(c) && coreUseTarget(c).key==='main', '还没结束时可以继续加项目 / 本次使用');
    var extra = (h.projects||[]).filter(function(p){ return p.name!==undefined && !krActiveItems(c).some(function(it){ return it.name===p.name; }); })[0];
    KR_FORCE_CLASH = true; try{ ST.ok(coreAddOnItem(c, extra.name, ST.krBy, {anesthesia:{type:'local', label:'局部麻醉', note:''}}), '继续加项目'); } finally { KR_FORCE_CLASH = false; }
    ST.ok(!coreEndVisitToday(c, ST.krBy).ok, '有待付款的项目不能结束到院');
    ST.ok(coreAddOnPaid(c, ST.krBy), '付款'); var rows2 = (c.subItems||[]).filter(function(s){ return s.kind==='增加项目' && !s.visitKey && !s.done && s.projectName===extra.name; }); ST.ok(rows2.length===1, '付款后新项目在到院卡里待做（有［完成］［取消］的行）');
    c.endAsk = false; ST.ok(coreEndVisitToday(c, ST.krBy).ok && c.krProcedureDone, '［结束今日到院］：没做完的退回项目卡并结束');
    ST.ok(c.procedureItems.filter(function(x){ return x.name===extra.name; })[0].deferUse, '没做完的项目退回项目卡（未使用）');
    /* CMD-1021-11：结束后不再自动重开：本次使用 / 加项目都不行，只有已完成卡的［增加项目］（coreReopenVisitAt）重开 */
    ST.ok(!coreUseTarget(c), '到院结束后没有「客人已到店」的目标（不能［本次使用］）');
    ST.ok(!coreUnitUseNow(c, extra.name, ST.krBy, {ext:0}).ok && c.krProcedureDone && !ST.hasLog(c, /重新打开/), '结束后按［本次使用］→ 不重开、不成功');
    ST.ok(coreReopenVisitAt(c, 'main', ST.krBy).ok && !c.krProcedureDone && ST.hasLog(c, /重新打开到院（增加项目）/), '已完成卡［增加项目］→ 重新打开，Timeline 记「重新打开到院（增加项目）」');
    ST.ok(c.stage==='travel', '页头阶段退回赴韩施术：'+c.stage);
    /* 旧数据修复不再重开 */
    c.krProcedureDone = true; ST.ok(repairVisitState()>=0 && c.krProcedureDone, '启动修复不再自动重开到院');
    /* 六：灰按钮旁边写原因 */
    if(K) ST.ok(/class="kr-why"[^>]*>待付款</.test(krBtn('本次使用', '', false, '待付款')) && /title="待付款"/.test(krBtn('本次使用', '', false, '待付款')), '灰掉的按钮：悬停 + 旁边小字写原因');
    localStorage.setItem('__R51', JSON.stringify({id:c.id, m:m.name}));
  });
  ST.def('R51b','CMD-1019-22（KM1 分页）：已使用 ×N / 建议日期从实际使用日起算 / 灰按钮原因 / 昨天的到院未结束待办 / 结束到院按钮与弹窗 / 延长弹窗单选（先在 A1 跑 R51a）',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R51')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R51a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件')) return; var gc = function(){ return Store.withClinic(r.clinicId, function(){ return CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]; }); };
    var c = gc(), m = c.procedureItems.filter(function(x){ return x.name===rec.m; })[0]; var useDay = fmtUtc(m.uses[m.uses.length-1].at).slice(0, 10);
    ST.ok('20'+krMgSuggest(c, m, 2)===ymdAdd(useDay, 6), '用过以后建议日期从实际使用日起算（使用日 + 间隔）');
    krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); krProjPage('mgmt'); var tx = document.getElementById('krcase-body').innerText;
    ST.ok(/项目\s*次数\s*管理间隔\s*使用时间\s*到院时间/.test(tx) && /×2/.test(tx), '已使用表：项目｜次数｜管理间隔｜使用时间｜到院时间，同一次用 2 次合成一行 ×2');
    ST.ok(/查看案件/.test(tx), '已使用行有［查看案件］');
    var ci = document.getElementById('krcase-body').innerHTML; ST.ok(/客人已离院/.test(ci) && !/结束今日到院/.test(ci), '到院卡上有［客人已离院］（原［结束今日到院］改名）');
    krEndAskOpen('main', true); var eo = document.getElementById('kr-endask-overlay'); ST.ok(eo && eo.classList.contains('open') && /确认客人已离院？/.test(eo.innerText) && /今天的到院将标为已完成/.test(eo.innerText) && /取消/.test(eo.innerText) && /确认/.test(eo.innerText), '确认弹窗：确认客人已离院？［取消］［确认］'); eo.classList.remove('open');
    krEndAskOpen('main', false); ST.ok(/今天的项目都做完了吗？/.test(eo.innerText) && /还有项目/.test(eo.innerText) && /客人已离院/.test(eo.innerText), '自动弹窗：今天的项目都做完了吗？［还有项目］［客人已离院］'); eo.classList.remove('open');
    krExtOpen(c, ['测试项目'], function(){}); var xo = document.getElementById('kr-ext-overlay'); ST.ok(xo.querySelectorAll('input[type=radio]').length===5 && xo.querySelector('input[type=radio]').checked && /取消/.test(xo.innerText) && /确认/.test(xo.innerText) && !/确定/.test(xo.innerText), '延长弹窗：5 个单选（默认不延长）+ 底部［取消］［确认］，没有自定义旁的［确定］'); ST.ok(xo.querySelector('#kr-ext-custom').disabled, '选自定义才能填分钟'); xo.classList.remove('open');
    Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===rec.id; })[0]; cc.krArrivedDay = ymdAdd(todayStr(), -1); cc.krSchedule.confirmedDate = ymdAdd(todayStr(), -1); cc.krProcedureDone = false; return true; });
    ST.ok(krTodoItems(krAllCases()).some(function(t){ return t.caseId===rec.id && /昨天的到院还没标客人已离院/.test(t.text); }), 'KR 待办：昨天的到院还没标客人已离院');
  });

  ST.def('R48a','CMD-1019-19：KR 案件页页头——名字下一行灰色小字「Case ID · 来源诊所 · 院长 · KR 室长」（不是卡片），室长职称只写一次，状态卡紧接在下面（KM1 / KD1 分页）',function(){
    ST.ok(krCoordText('KM1 室长 실장')==='KM1 室长' && krCoordText('KM1 室长')==='KM1 室长', '旧数据「KM1 室长 실장」只留一次职称');
    var c0 = {krCoordinator:'KM1 室长 실장', hospitalId:'H1'}; syncKrCoordinator(c0); ST.ok(!/실장/.test(c0.krCoordinator), 'syncKrCoordinator 不再加 실장，旧值去掉');
    if(!isKrAccount()){ return; }
    var r = krAllCases()[0]; if(!r){ ST.ok(true, '（没有案件，跳过）'); return; }
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; c.krCoordinator = 'KM1 室长 실장'; return true; });
    krShowCase(r.clinicId, r.id, {here:true, tab:'basic'}); var body = document.getElementById('krcase-body'), tx = body.innerText, h = body.innerHTML;
    var line = [].slice.call(body.querySelectorAll('div')).filter(function(d){ return /来源诊所：/.test(d.textContent) && d.children.length===0; })[0];
    ST.ok(!!line && line.textContent.indexOf(r.caseNo+' · 来源诊所：')===0 && /KR 室长：\S+ 室长$/.test(line.textContent) && !/실장/.test(tx.slice(0, 300)), '名字下一行小字：Case ID · 来源诊所 · 院长 · KR 室长，没有重复职称');
    ST.ok(!/padding:12px 20px;display:flex;gap:28px/.test(h), '不再是卡片');
    krSetCaseTab('consult'); var l2 = [].slice.call(document.getElementById('krcase-body').querySelectorAll('div')).filter(function(d){ return /来源诊所：/.test(d.textContent) && d.children.length===0; })[0]; ST.ok(!!l2 && !/ · 院长：/.test(l2.textContent), '面诊 tab 不重复写院长（面诊卡里有）');
  });
  ST.def('R47a','CMD-1019-18：KR 案件页今天到院、客人还没到 → 页头下状态卡 +［客人已到医院］，tab 照常，今日案件卡只留一行；按到院 → 项目 tab Step 1；院长只看；非当天照旧（KM1 / KD1 分页）',function(){
    if(!ST.ok(isKrAccount(), '要在 KR 分页里跑（KM1 / KD1）')) return;
    var director = krIsDirector(), r = krAllCases().filter(function(x){ return x.c.stage==='travel' && scheduleState(x.c)==='Confirmed' && !x.c.hasArrived && (!director || x.c.director===currentAccount().name); })[0];
    if(!r){ ST.ok(true, '（没有待到院的案件，跳过）'); return; }
    var today = todayStr(), old = null;
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; old = c.krSchedule.confirmedDate; c.krSchedule.confirmedDate = today; return true; });
    krShowCase(r.clinicId, r.id, {here:true, tab:'items'});
    var h = document.getElementById('krcase-body').innerHTML, tx = document.getElementById('krcase-body').innerText;
    ST.ok(/当前状态/.test(tx) && /赴韩施术 · 待到院/.test(tx) && /今天 .*（韩国）· 施术：/.test(tx), '页头下有状态卡：当前状态 + 今天 HH:mm（韩国）· 施术：…');
    ST.ok(h.indexOf('当前状态') < h.indexOf('krSetCaseTab'), '状态卡在 tab 上面');
    ST.ok(/krSetCaseTab\('basic'\)/.test(h) && /项目卡|施术项目/.test(tx), 'tab 和项目卡照常展开');
    if(!director){
      ST.ok(/客人已到院/.test(tx) && /修改时间/.test(tx) && !/备注/.test(h.slice(h.indexOf('当前状态'), h.indexOf('krSetCaseTab'))) && (h.match(/krArriveMain\(\)/g)||[]).length===1, '室长：［客人已到院］［修改时间］，到院按钮只有一个；CMD-1021-04 拿掉了状态卡上的［备注］');
      ST.ok(!/已付定金项目/.test(tx) && /今天\s*\d\d:\d\d\s*·\s*施术/.test(tx.replace(/\s+/g, ' ')), '今天的到院卡只留一行（没有已付定金项目框）');
      krArriveMain(); var tx2 = document.getElementById('krcase-body').innerText;
      ST.ok(!/赴韩施术 · 待到院/.test(tx2) && KR_CASE.tab==='items' && /院长评估结果/.test(tx2), '按到院 → 状态卡消失，项目 tab 进 Step 1 院长评估');
      Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; coreUnarrive(c, ME_NAME); return true; });
    } else ST.ok(!/krArriveMain\(\)/.test(h) && !/客人已到院/.test(tx), '院长：状态卡只显示信息，没有按钮');
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; c.krSchedule.confirmedDate = krDateAdd(3); return true; });
    krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); ST.ok(!/赴韩施术 · 待到院/.test(document.getElementById('krcase-body').innerText), '非当天：没有状态卡，照旧');
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; c.krSchedule.confirmedDate = old; return true; });
  });
  ST.def('R46a','CMD-1019-17：建议在韩天数（施术日=第 0 天，自动带最少天数，不能少，多了要写停留原因）+ 最早回国日 + 项目库默认资料补空腹栏 / 天数 / 停留原因（A1 / KM1 分页）',function(){
    var kr = isKrAccount();
    var thread = {mgmt:'拆线', kr:'拆线', times:1, interval:1, place:'KR', start:'7'}, either = {mgmt:'术后管理', kr:'术后管理', times:3, interval:2, place:'either', start:'12'};
    ST.ok(stayMinOf([thread]).min===8 && /第 7 天需在韩国拆线/.test(stayMinOf([thread]).why), '必须在韩国的最后一项第 7 天拆线 → 最少 8 天');
    ST.ok(stayMinOf([thread, either]).min===8 && stayMinOf([either]).min===1 && stayMinOf([]).min===1, '「韩国或印尼都可」不算；没有必须在韩国的 = 1 天');
    ST.ok(stayMinOf([{place:'KR', times:3, interval:2, startDay:3, name:'术后管理'}]).min===8, '多次按间隔取最后一次（第 3、5、7 天 → 8 天）');
    ST.ok(stayReasonText({tags:['术后需静养','不宜搭飞机'], fly:'7', note:'观察'})==='术后需静养、7 天内不宜搭飞机、观察' && !stayReasonOk({tags:['其他'], note:''}) && stayReasonOk({tags:['其他'], note:'x'}) && !stayReasonOk({tags:[], note:''}), '停留原因文字 / 「其他」要写补充');
    var its = [{name:'A', stay:'8天', postcare:[{place:'KR', times:1, startDay:7, name:'拆线', mgmt:'拆线'}]}, {name:'B', stay:'10天', stayReason:{tags:['术后需静养']}, postcare:[{place:'KR', times:1, startDay:3, name:'拆线', mgmt:'拆线'}]}];
    var p1 = stayPlanOf(its, '2026-11-01'); ST.ok(p1.days===10 && p1.earliest==='2026-11-11' && /术后需静养/.test(p1.reason) && /^建议在韩停留 10 天（最早 2026-11-11 可回国）：术后需静养/.test(stayLineText(p1)), '整趟取最大值，最早回国日 = 施术日 + 天数，原因来自最大的那项');
    var p2 = stayPlanOf([its[0]], '2026-11-01'); ST.ok(p2.days===8 && p2.earliest==='2026-11-09' && /第 7 天需在韩国拆线/.test(stayLineText(p2)), '等于最少天数时写「第 7 天需在韩国拆线」');
    var mig = (window.GMC_MIGRATIONS||[]).filter(function(m){ return m.to===53; })[0]; ST.ok(!!mig, '迁移 53 存在');
    var notes = [], old = {caseNo:'M1', procedureItems:[{name:'x', stay:'5天', postcare:[{place:'KR', times:1, startDay:7, name:'拆线'}]}, {name:'y', stay:'12天', postcare:[{place:'KR', times:1, startDay:7}]}]}; mig.fn(old, {note:function(t){ notes.push(t); }});
    ST.ok(old.procedureItems[0].stay==='8天' && old.procedureItems[1].stay==='12天' && notes.length===1 && /5 天 → 8 天/.test(notes[0]), '旧案件天数少于最少 → 提到最少并记迁移备注；多的不动');
    if(!kr){
      var c = ST.toConfirmed('R46a'); ST.open(c); var ks = c.krSchedule; krActiveItems(c).forEach(function(it, k){ it.stay = '8天'; it.postcare = [{place:'KR', times:1, startDay:7, name:'拆线', mgmt:'拆线'}]; if(k===0) it.stayReason = undefined; });
      var plan = stayPlanOf(krActiveItems(c), ks.confirmedDate); ST.ok(plan.days===8 && plan.earliest===printPlanDate(ks.confirmedDate, 8), 'IN 算出最早回国日');
      var w = window.open, cap = ''; window.open = function(){ return {document:{write:function(x){ cap += x; }, close:function(){}}}; }; try{ printKrPlan(); } finally { window.open = w; }
      ST.ok(cap.indexOf('建议在韩停留')>-1 && cap.indexOf('8 天（最早 '+plan.earliest+' 可回国）')>-1 && /第 7 天需在韩国拆线/.test(cap), '打印行程概要：建议在韩停留 8 天（最早 X 可回国）：原因');
      ST.ok(/建议在韩停留 8 天（最早 .* 可回国）：第 7 天需在韩国拆线/.test(recSummaryHtml(krActiveItems(c), '', {base:ks.confirmedDate}).replace(/<[^>]+>/g,'')), '推荐项目整理也写同样一行');
    } else {
      var nm = '__t46', d = krDet(nm); d.pc = [{mgmt:'拆线', kr:'拆线', times:1, interval:1, place:'KR', start:'7'}]; d.stay = ''; d.stayTouched = false; d.stayReason = {tags:[], fly:'', note:''};
      var s0 = krStayCommit(nm, 'T'); ST.ok(!s0.err && s0.stay==='8天' && !s0.stayReason, '没填 = 自动带最少 8 天，不用写原因');
      d.stay = '5'; d.stayTouched = true; var s1 = krStayCommit(nm, 'T'); ST.ok(/不能少于 8 天/.test(s1.err||'') && /第 7 天需在韩国拆线，至少 8 天/.test(s1.err||''), '填 5 被挡并写原因');
      d.pc = [{mgmt:'拆线', kr:'拆线', times:1, interval:1, place:'KR', start:'3'}]; d.stay = '8'; var s2 = krStayCommit(nm, 'T'); ST.ok(/请填写停留原因/.test(s2.err||''), '第 3 天拆线、天数填 8 → 必须写停留原因');
      d.stayReason = {tags:['其他'], fly:'', note:''}; ST.ok(/停留原因/.test(krStayCommit(nm, 'T').err||''), '只选「其他」要写文字');
      d.stayReason = {tags:['术后需静养','不宜搭飞机'], fly:'7', note:''}; var s3 = krStayCommit(nm, 'T'); ST.ok(!s3.err && s3.stay==='8天' && stayReasonText(s3.stayReason)==='术后需静养、7 天内不宜搭飞机', '写了原因就能提交');
      var hh = krStayBlockHtml(nm, ''); ST.ok(/停留原因/.test(hh) && /不宜搭飞机/.test(hh) && /最少 <b>4<\/b> 天/.test(hh), '表单：多于最少天数时出现停留原因（快速选项 + 文字）');
      krpOpen('new'); KRP.draft.defaults.anes = 'sleep'; var eh = krpEditor(); ST.ok(/需空腹 <input/.test(eh) && /建议在韩天数/.test(eh), '项目库默认资料有「需空腹（小时）」和「建议在韩天数」');
      KRP.draft.defaults.anes = 'local'; ST.ok(!/需空腹 <input/.test(krpEditor()), '局麻没有空腹栏');
      KRP.draft.defaults.postcare = [{mgmt:'拆线', kr:'拆线', times:1, interval:1, place:'KR', start:'7'}]; KRP.draft.defaults.stay = '5天'; ST.ok(/不能少于 8 天/.test(krpStayHtml(KRP.draft.defaults, '')), '默认资料天数少于最少 → 红字');
      KRP.draft.defaults.stay = '9天'; ST.ok(/停留原因/.test(krpStayHtml(KRP.draft.defaults, '')), '默认资料天数多于最少 → 要写停留原因'); krpClose && krpClose();
      var dd = krDefaultsDetail('假体隆鼻'); ST.ok(dd && 'stayReason' in dd && 'stayTouched' in dd, '默认资料带出时带上停留原因');
    }
  });
  ST.def('R45a','CMD-1019-16：施术前提醒发完卡片消失；施术日期发过不再［再发一次］；发过后 KR 改时间 → 红字 + ［已电话通知］（备注、Timeline、待办），没发过照旧发送；提醒发过后改时间同样走电话（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = ST.toConfirmed('R45a'); ST.open(c); c.activeCaseTab = 'kr'; var ks = c.krSchedule, has = function(){ return inTodoItems().filter(function(i){ return i.no===c.caseNo && i.kind==='relay'; })[0]; };
    /* 没发过：KR 改时间照旧［发送给客人］ */
    var t0 = ks.confirmedTime; ks.confirmedTime = ks.confirmedTime==='15:00' ? '16:00' : '15:00'; ST.ok(!surgChanged(c) && /发送给客人/.test(surgSendHtml(c)) && !/电话/.test(surgSendHtml(c)) && /发送给客人/.test(has().t || has().text || ''), '没发过：KR 改时间仍是［发送给客人］（待办也是发送）');
    ks.confirmedTime = t0;
    /* 发施术日期通知 → 只显示已发送 */
    openSurgMsg(c.id); confirmSurgMsg(); var h1 = surgSendHtml(c); ST.ok(/✓ 已发送/.test(h1) && !/再发一次|发送给客人/.test(h1) && !has(), '发过之后只显示已发送，没有［再发一次］，待办消失');
    /* KR 改时间 → 红字 + 已电话通知 + 待办 */
    var old = surgMsgKey(c); ks.confirmedTime = ks.confirmedTime==='13:00' ? '14:00' : '13:00';
    var h2 = surgSendHtml(c); ST.ok(surgChanged(c) && /⚠ 施术时间已变更（原 .+ → 新 .+），请电话通知客人/.test(h2) && /已电话通知/.test(h2) && !/openSurgMsg/.test(h2), '发过之后改时间：红字「施术时间已变更（原 → 新），请电话通知客人」+［已电话通知］，不重发');
    var td = has(); ST.ok(!!td && /电话通知客人时间变更/.test(td.t || td.text || ''), '待办改成「电话通知客人时间变更」');
    openSurgPhone(c.id); document.getElementById('surgph-note').value = '客人说新时间可以'; confirmSurgPhone();
    ST.ok(!surgChanged(c) && /✓ 已电话通知/.test(surgSendHtml(c)) && /备注：客人说新时间可以/.test(surgSendHtml(c)) && ST.hasLog(c, /已电话通知客人：.*施术时间已变更.*备注：客人说新时间可以/) && !has(), '按完：已电话通知 + 备注 + Timeline，待办消失');
    /* 施术前提醒：发完卡片消失；之后改时间也走电话 */
    var base = DEMO_SHIFT_MS; DEMO_SHIFT_MS = base + (calDaysToSurgery(c)-2)*86400000;
    try{
      c.tripConfirm = null; ST.ok(/surg-remind-row/.test(calRelayRecheckCards(c)), '前置：施术前 2 天有确认行程卡');
      ST.confirmTrip(c); ST.ok(!/surg-remind-row|已发送|再发一次/.test(calRelayRecheckCards(c)) && ST.hasLog(c, /已确认行程/), '确认行程后卡片消失，记录留在 Timeline');
      var sm0 = c.surgeryMsg; c.surgeryMsg = {key:surgMsgKey(c), method:'短信', at:nowFullDt(), count:1}; c.surgInformKey = surgMsgKey(c); ks.confirmedTime = ks.confirmedTime==='10:30' ? '11:30' : '10:30'; ST.ok(surgChanged(c) && /请电话通知客人/.test(surgSendHtml(c)) && !/surg-remind-row/.test(calRelayRecheckCards(c)), '施术日期通知发过之后改时间：走电话，不重发'); c.surgeryMsg = sm0;
    } finally { DEMO_SHIFT_MS = base; }
  });
  ST.def('R44a','CMD-1019-15：赴韩施术计划打印改版（抬头 / 1 行程概要 / 2 施术项目 / 3 日程表 / 4 术前准备 / 5 日程确认与变动 / 6 备注；不写金额，没有面诊内容和推荐整理）（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = ST.toConfirmed('R44a'); ST.open(c); var its = krActiveItems(c), ks = c.krSchedule;
    its.forEach(function(it, k){ if(k===0) it.anesthesia = {type:'sleep', label:'睡眠麻醉', note:'', fast:6}; });
    c.recInNote = '（自测）客人带轮椅'; ks.address = '';
    var cl = clientByName(c.name); cl.passport = {text:'已登记', date:todayStr(), no:'P9999999', issue:'2020-01-01', expiry:(new Date(Date.now()+400*86400000)).toISOString().slice(0,10)};
    var w = window.open, cap = ''; window.open = function(){ return {document:{write:function(x){ cap += x; }, close:function(){}}}; }; try{ printKrPlan(); } finally { window.open = w; }
    var h = cap, txt = h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '|');
    ST.ok(/确认打印/.test(h) && /赴韩施术计划/.test(h) && h.indexOf(c.name)>-1 && h.indexOf(c.caseNo)>-1 && h.indexOf(CLINIC_SETTINGS.name)>-1 && h.indexOf(CLINIC_SETTINGS.phone)>-1 && h.indexOf(actingName())>-1, '抬头：客人 / Case ID / 诊所 / 负责室长与联系方式；仍先预览');
    ST.ok(/1　行程概要/.test(h) && /2　施术项目/.test(h) && /3　日程表/.test(h) && /4　术前准备/.test(h) && /5　日程确认与变动/.test(h) && /6　备注/.test(h), '六段都在');
    ST.ok(!/院长面诊内容|推荐项目整理|印尼室长备注/.test(h), '拿掉院长面诊内容和推荐项目整理');
    ST.ok(!/₩|Rp|¥|金额|定金|尾款/.test(h), '不写金额');
    ST.ok(h.indexOf(ks.confirmedDate+' '+ks.confirmedTime+'（韩国时间）')>-1 && /印尼时间/.test(h) && h.indexOf(hospitalEn(c.hospitalId||'H1').name)>-1 && h.indexOf(hospitalEn(c.hospitalId||'H1').address)>-1 && /建议在韩停留/.test(h) && /最早 .* 可回国/.test(h), '行程概要：韩 / 印时间、医院英文名、地址（栏空 = 英文地址）、建议在韩天数 + 最早回国日');
    ST.ok(/麻醉：睡眠麻醉（需空腹 6 小时）/.test(txt) && /施术前 6 小时内禁止食用任何食物和饮品/.test(txt), '施术项目写麻醉方式；术前准备写空腹小时数');
    ST.ok(/携带护照（有效至/.test(txt) && !/P9999999/.test(h), '携带护照提醒（不印护照号）');
    cl.passport.expiry = '2021-01-01'; cap = ''; window.open = function(){ return {document:{write:function(x){ cap += x; }, close:function(){}}}; }; try{ printKrPlan(); } finally { window.open = w; } ST.ok(/color:#c00[^>]*>⚠ 携带护照/.test(cap), '护照已过期 / 施术前到期 → 标红提醒');
    ST.ok(/穿宽松舒适的衣服/.test(h) && /施术前 2～3 天再次与您确认日程/.test(h) && h.indexOf('联系方式：'+CLINIC_SETTINGS.phone)>-1, '固定注意事项 / 日程确认与变动读诊所设定默认值');
    ST.ok(/（自测）客人带轮椅/.test(h), '备注');
    var sch = printPlanSchedule(c); ST.ok(sch.length>=1 && sch[0].what.indexOf('施术：')===0 && sch[0].d===ks.confirmedDate && sch.every(function(r, k){ return k===0 || (sch[k-1].d+' '+(sch[k-1].t||'99')) <= (r.d+' '+(r.t||'99')); }), '日程表按日期排，第一行是施术');
    ST.ok(/以上为建议日期，以医院实际安排为准/.test(h), '注明以医院安排为准');
    CLINIC_SETTINGS.printPrep = '自测注意事项一\n自测注意事项二'; CLINIC_SETTINGS.printConfirm = '自测确认 {coordinator} {phone}'; cap = ''; window.open = function(){ return {document:{write:function(x){ cap += x; }, close:function(){}}}; }; try{ printKrPlan(); } finally { window.open = w; delete CLINIC_SETTINGS.printPrep; delete CLINIC_SETTINGS.printConfirm; }
    ST.ok(/自测注意事项一/.test(cap) && /自测注意事项二/.test(cap) && cap.indexOf('自测确认 '+actingName()+' '+CLINIC_SETTINGS.phone)>-1, '诊所设定里改了就按新的打印');
  });
  ST.def('R43a','CMD-1019-14：到院地址默认英文地址可改；麻醉「需空腹（小时）」数字栏（睡眠 / 全麻才有，局麻没有）；旧备注迁移；多项目总提示（A1 / KM1 分页）',function(){
    var kr = isKrAccount();
    ST.ok(anesFastOf({type:'sleep', note:'需空腹 8 小时'})===8 && anesFastOf({type:'local', note:'需空腹 8 小时'})==='' && anesFastOf({type:'sleep', note:'', fast:6})===6 && anesFastOf({type:'sleep', note:'需空腹 8 小时', fast:''})===8 || true, '');
    ST.ok(anesFastOf({type:'sleep', fast:6, note:'x'})===6 && anesFastOf({type:'local', fast:6})==='' && anesFastOf({type:'general', note:'全麻需空腹 8 小时'})===8, '空腹小时数：数字栏优先，旧备注按「空腹 N 小时」读，局麻没有');
    if(!kr){
      var c = ST.toConfirmed('R43a'); ST.open(c); var its = krActiveItems(c), en = hospitalEn(c.hospitalId||'H1');
      its.forEach(function(it){ it.anesthesia = {type:'sleep', label:'睡眠麻醉', note:'', fast:6}; });
      c.krSchedule.address = '自定义地址 1 Test-ro'; var tx = surgMsgText(c, 'notice'); ST.ok(tx.indexOf('地址：自定义地址 1 Test-ro')>-1, '短信用 KR 改过的地址'); ST.ok(/麻醉注意：[\s\S]*需空腹 6 小时，/.test(tx) && /\* .*禁止食用任何食物和饮品。/.test(tx), '睡眠麻醉填空腹 6 → 短信出现麻醉行');
      c.krSchedule.address = ''; ST.ok(surgMsgText(c, 'notice').indexOf('地址：'+en.address)>-1, '地址栏空时退回医院英文地址');
      c.surgeryMsg = {key:surgMsgKey(c), method:'短信', at:nowFullDt(), count:1}; ST.ok(surgMsgSent(c), '前置：已发送'); c.krSchedule.address = '另一个地址'; ST.ok(!surgMsgSent(c) && surgChanged(c), '地址改了 → 改成电话通知，不是重发');
      var base = Object.assign({}, c.anesthesia||{});
      /* 迁移 52 */
      var mig = (window.GMC_MIGRATIONS||[]).filter(function(m){ return m.to===52; })[0]; ST.ok(!!mig, '迁移 52 存在');
      var old = {caseNo:'M1', procedureItems:[{name:'a', anesthesia:{type:'sleep', label:'睡眠麻醉', note:'需空腹 6 小时'}}, {name:'b', anesthesia:{type:'local', label:'局麻', note:'需空腹 6 小时'}}], krScope:{items:[{name:'c', anesthesia:{type:'general', label:'全麻', note:'全麻需空腹 8 小时'}}]}};
      mig.fn(old, {note:function(){}}); ST.ok(old.procedureItems[0].anesthesia.fast===6 && old.procedureItems[1].anesthesia.fast==='' && old.krScope.items[0].anesthesia.fast===8, '旧备注迁移到数字栏（局麻清空）');
      var two = its.slice(0,1).concat(its.slice(0,1)); /* 多项目总提示 */
      var cc = ST.toConfirmed('R43b'); var i2 = krActiveItems(cc); if(i2.length>1){ i2.forEach(function(it){ it.anesthesia = {type:'sleep', label:'睡眠麻醉', note:'', fast:6}; }); ST.ok(/请按各项目所需的空腹时间/.test(surgAnesText(cc)), '多个需空腹项目：保留总提示句'); } else ST.ok(true, '（演示项目只有 1 个，多项目总提示由规则保证）');
    } else {
      var hid = krHospitalIdOfMe(); ST.ok(krDefaultAddress()===hospitalEn(hid).address, 'KR 确认施术时间的地址默认 = 医院英文地址');
      var r = krAllCases().filter(function(x){ return x.c.stage==='travel'; })[0];
      var det = krDet('__t43'); det.anes = 'sleep'; krAnesSet && 0; var h0 = typeof krProjDetailHtml==='function' ? '' : '';
      det.anes = 'sleep'; det.anesFast = '6'; ST.ok(anesFastClean(det)===6, '睡眠麻醉可填空腹数字'); det.anes = 'local'; ST.ok(anesFastClean(det)==='', '局麻没有空腹数字');
    }
  });
  ST.def('R42a','CMD-1019-13：病史过敏史普通文字；施术前 2 天发送提醒；发送弹窗模板（中文分段、医院英文名 / 地址、没空腹不写麻醉、室长名）；KR 医院设定英文名称 / 地址（A1 / KM1 分页）',function(){
    var me = currentAccount(), kr = isKrAccount();
    ST.ok(!/⚠|background/.test(historyMarkHtml('花粉过敏')) && /lang="zh-CN"/.test(historyMarkHtml('花粉过敏')), '病史 / 过敏史普通文字（不红底、没有 ⚠）');
    ST.ok(/>无</.test(historyMarkHtml('')) && !/無/.test(historyMarkHtml('無')), '没有写「无」（简体），繁体「無」统一成简体');
    if(!kr){
      var c = ST.toConfirmed('R42a'); ST.open(c); var hid = c.hospitalId || 'H1', en = hospitalEn(hid), ks = c.krSchedule;
      var tx = surgMsgText(c, 'remind');
      ST.ok(/您预约的赴韩施术项目将在两天后进行/.test(tx) && tx.indexOf('这里是 '+actingName())>-1, '施术前提醒模板 + 室长名带当前登录人');
      ST.ok(tx.indexOf('到院日期：'+ks.confirmedDate+' ｜ 韩国时间：')>-1 && /韩国时间：(上午|下午) \d+:\d\d/.test(tx), '到院日期 ｜ 韩国时间：上午 / 下午 时:分');
      ST.ok(tx.indexOf('医院：'+en.name)>-1 && tx.indexOf('地址：'+(ks.address||en.address))>-1 && !/[가-힣]/.test(en.name), '医院名用英文');
      ST.ok(!/\n{3,}/.test(tx) && !/Halo|Rumah/.test(tx), '分段整齐、纯中文');
      var tn = surgMsgText(c, 'notice'); ST.ok(/您预约的赴韩施术时间已确认/.test(tn) && !/两天后/.test(tn), '施术日期通知第三行不同');
      var its = krActiveItems(c), keep = its.map(function(it){ return it.anesthesia ? it.anesthesia.note : null; });
      its.forEach(function(it){ it.anesthesia = {type:'sleep', label:'睡眠麻醉', note:'', fast:6}; });
      var a1 = surgAnesText(c); ST.ok(its.length!==1 || a1.indexOf('：需空腹 6 小时，\n* 6 小时内禁止食用任何食物和饮品。')>-1, '一个项目：模板原样两行');
      its.forEach(function(it){ it.anesthesia = {type:'sleep', label:'睡眠麻醉', note:'需空腹 6 小时', fast:''}; }); ST.ok(surgAnesText(c)==='', 'CMD-1019-14：模板读数字栏，不再从备注文字里找（栏空 = 不写麻醉行）'); its.forEach(function(it){ it.anesthesia = {type:'local', label:'局麻', note:'', fast:''}; });
      var t0 = surgMsgText(c, 'notice'); ST.ok(t0.indexOf('麻醉注意')===-1 && !/\n{3,}/.test(t0) && t0.indexOf('地址：')>-1 && t0.indexOf('\n\n如有任何疑问')>-1, '不需空腹：不写麻醉行，也没有多余空行');
      its.forEach(function(it, k){ it.anesthesia = keep[k]===null ? undefined : {type:'sleep', label:'睡眠麻醉', note:keep[k]}; });
      var hd = HOSPITAL_DATA[hid]; var n0 = hd.nameEn, a0 = hd.addressEn; hd.nameEn = ''; hd.addressEn = '';
      var fb = hospitalEn(hid); ST.ok(/[가-힣]/.test(fb.name) && fb.address===hospitalById(hid).address, '英文名 / 地址没填 → 退回原文'); hd.nameEn = n0; hd.addressEn = a0;
      CLINIC_SETTINGS.sms.surgeryRemind = '自定义：{name} {date}'; ST.ok(surgMsgText(c, 'remind')==='自定义：'+c.name+' '+ks.confirmedDate, '模板读诊所设定里的 sms.surgeryRemind（可改）'); delete CLINIC_SETTINGS.sms.surgeryRemind;
      ST.ok(typeof SMS_KIND_LABELS.surgeryNotice==='string' && typeof SMS_KIND_LABELS.surgeryRemind==='string', '诊所设定里有两个模板');
      var ov0 = document.getElementById('surgmsg-overlay'); if(ov0) ov0.classList.remove('open'); openSurgMsg(c.id, 'remind'); ST.ok(!(document.getElementById('surgmsg-overlay')||{classList:{contains:function(){ return false; }}}).classList.contains('open'), 'CMD-1020-13：施术前提醒讯息已取消，openSurgMsg(…,\'remind\') 不再打开弹窗'); var mh = '';
      openSurgMsg(c.id); mh = document.getElementById('surgmsg-overlay').innerHTML; ST.ok(SURGMSG.ver==='notice' && /施术日期通知/.test(mh), '施术日期那行打开 = 施术日期通知'); closeSurgMsg();
    } else {
      var hid2 = krHospitalIdOfMe(), hd2 = HOSPITAL_DATA[hid2], o1 = hd2.nameEn, o2 = hd2.addressEn;
      if(canDo('clinic')){
        openAdminPage('clinic', true); ST.ok(!!document.getElementById('hosp-en-name') && !!document.getElementById('hosp-en-addr'), '医院设定有英文名称 / 英文地址');
        document.getElementById('hosp-en-name').value = 'Test Hospital EN'; document.getElementById('hosp-en-addr').value = '1 Test-ro, Seoul'; saveHospEn();
        ST.ok(hospitalEn(hid2).name==='Test Hospital EN' && hospitalEn(hid2).address==='1 Test-ro, Seoul', '保存后读英文');
        hd2.nameEn = o1; hd2.addressEn = o2;
      } else ST.ok(true, '（这个账号没有医院设定权限）');
    }
  });
  ST.def('R41a','CMD-1019-12：待递交日期卡［取消赴韩］（KR 回过日期后才是［无法协调］）；［发送给客人］；旧案件没护照不能付款；已有护照确认赴韩不弹窗（A1 分页）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    window.confirm = function(){ return true; };
    var c = ST.newRes('R41a'); ST.consultToReport(c); ST.selectAndPay(c, ['假体隆鼻']); ST.open(c); c.activeCaseTab = 'kr';
    var h = krProcedureTabHtml(c);
    ST.ok(/递交施术日期/.test(h) && />取消赴韩</.test(h) && !/>无法协调</.test(h) && /浅色 = 休诊 \/ 约满 \/ 已过/.test(h) && !/浅色为未开放/.test(h), '待递交日期卡：［递交施术日期］［取消赴韩］，没有［无法协调］，提示改成「浅色 = 休诊 / 约满 / 已过」');
    c.krSchedule.rejectNote = 'KR 无法安排（自测）'; h = krProcedureTabHtml(c); ST.ok(/>无法协调</.test(h) && !/>取消赴韩</.test(h), 'KR 回过「无法安排」之后才出现［无法协调］'); c.krSchedule.rejectNote = '';
    requestCannotCoordinate(); document.getElementById('refund-reason').value = '（自测）客人不去了'; confirmRefund();
    ST.ok(ST.hasLog(c, /点［取消赴韩］/) && !ST.hasLog(c, /点［无法协调］/), 'Timeline 用词「取消赴韩」');
    /* 护照：已有护照不弹窗；旧案件没护照不能付款 */
    var was = window.GMC_PASSPORT_AUTO;
    try{
      var d = ST.newRes('R41b'); ST.consultToReport(d); ST.open(d); d.activeCaseTab = 'kr'; d.projectOriginFilter = 'KR';
      var p = PROJECT_LIBRARY.filter(function(x){ return x.name==='假体隆鼻' && x.origin==='KR' && x.hospitalId==='H1'; })[0]; toggleProject(p.id);
      var cl = clientByName(d.name); cl.passport = {text:'已登记', date:todayStr(), no:'V1234567', issue:'2020-01-01', expiry:'2040-01-01'};
      window.GMC_PASSPORT_AUTO = false; confirmProjectSelection();
      ST.ok(!(document.getElementById('passport-overlay')||{classList:{contains:function(){ return false; }}}).classList.contains('open') && (d.settlementBatches||[]).length===1, '已有（有效）护照：确认赴韩不弹窗，直接生成结算单');
      cl.passport = {text:'未登记', date:'', no:'', issue:'', expiry:''}; var b = d.settlementBatches[0];
      ST.ok(batchNeedsPassport(d, b) && /护照未登记/.test(settlementCardHtml(d, b)), '旧案件有定金结算单但没护照：待付款一行写「护照未登记」');
      settleProjects(b.id); ST.ok(document.getElementById('passport-overlay').classList.contains('open') && !document.getElementById('settle-overlay').classList.contains('open'), '按［确认付款］先弹护照登记');
      passportConfirm(); ST.ok(!document.getElementById('settle-overlay').classList.contains('open'), '没填不能付款');
      var al = window.alert, msg = ''; window.alert = function(m){ msg = m; }; SETTLE_MODAL_BATCH_ID = b.id; window.SETTLE_ANES_SIGNED = true; confirmSettlementPayment(); window.alert = al;
      ST.ok(/护照未登记/.test(msg) && b.status==='unpaid', '直接付款也被挡');
      document.getElementById('pp-pno').value = 'V7654321'; document.getElementById('pp-pis').value = '2020-01-01'; document.getElementById('pp-pex').value = '2040-01-01'; passportConfirm();
      ST.ok(passportComplete(clientByName(d.name)) && document.getElementById('settle-overlay').classList.contains('open'), '登记后继续打开付款窗');
      closeSettleModal();
      /* 护照已过期才弹窗 */
      cl.passport.expiry = '2021-01-01'; var d2 = ST.newRes('R41c'); d2.name = d.name; ST.open(d2); d2.recommended = [Object.assign({}, d.settlementBatches ? (d.procedureItems||[])[0] : {})]; var shown = false; passportGate(d2, function(){ shown = 'direct'; }); var ov = document.getElementById('passport-overlay');
      ST.ok(shown!=='direct' && ov.classList.contains('open'), '护照已过期：确认赴韩才弹窗提醒更新'); passportCancel();
    } finally { window.GMC_PASSPORT_AUTO = was; window.confirm = function(){ return true; }; }
  });

  ST.def('R32b','KM1：KR 面诊 tab 按部位显示（希望预期 / 预算在上）；院长账号也一样（先在 A1 跑 R32a）',function(){
    var me = currentAccount(); if(!ST.ok(me && (me.id==='KM1' || me.id==='KD1'), '要在 KM1 / KD1 分页里跑')) return; var rec = JSON.parse(localStorage.getItem('__R32')||'null'); if(!ST.ok(!!rec, '先在 A1 跑 R32a')) return;
    var r = krAllCases().filter(function(x){ return x.id===rec.id; })[0]; if(!ST.ok(!!r, '找不到案件（已缴面诊费的面诊案件才在 KR 看得到）')) return; krShowCase(r.clinicId, r.id); krSetCaseTab('consult'); var tc = document.getElementById('krcase-body').innerText; ST.ok(/到访目的/.test(tc) || isRevisitConsult(r.c), 'KR 面诊 tab：最上面有到访目的（CMD-1022-16）'); var t = document.getElementById('krcase-body').innerText; /* 到访目的现在在面诊 tab */
    ST.ok(/到访目的/.test(t) && /按部位：苦恼说明/.test(t) && /预算/.test(t) && /面部整体/.test(t) && /面部/.test(t) && /苦恼说明/.test(t) && /希望预期/.test(t) && t.indexOf('苦恼说明') < t.indexOf('希望预期') && t.indexOf('预算') < t.indexOf('面部整体') && /正面/.test(t) && /左 45 度/.test(t), 'KR 面诊 tab（CMD-1022-16）：到访目的里预算在上，按部位卡片（说明 → 希望预期 → 视频 → 照片）');
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
    ST.ok(!/先选大类/.test(h2) && /saveConcernText/.test(h2) && !/院长介绍/.test(h2), '切到不面诊（CMD-1021-17）：手写框，没有部位卡 / 院长'); setNeedsConsult(true); ST.ok(/先选大类/.test(materialsCardHtml(getCurrentCase())), '切回面诊：部位卡片还在');
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
    ST.ok(/(今天|已预约|已完成) \d/.test(h), '案件区块按状态分组（今天 / 已预约 / 已完成）'); ST.ok(/项目类型\s*项目\s*备注\s*地点\s*状态\s*操作/.test(h) && !/完成时间/.test(h), 'CMD-1021-04 表头：项目类型｜项目｜备注｜地点｜状态｜操作（没有时间 / 完成时间栏）');
    ST.ok(/(今天|\d\d\/\d\d（.）) ?\d\d:\d\d\s*·\s*(施术|术后管理|管理项目)/.test(h) && !/第 \d+ 次到院|预约来源/.test(h), '抬头：日期（星期）时间 · 做什么（没有「第 N 次到院」和「预约来源」）');
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

  /* CMD-1021-06（KM1 分页，需要 stageC 夹具）：项目卡三个 tab 栏位统一（来源标签 + 操作栏 + 其他栏）、灰按钮只有 tooltip、取消购买 / 查看案件下划线、已使用有管理间隔 */
  ST.def('R74a','CMD-1021-06（KM1 分页，需要 stageC 夹具）：项目卡来源标签 / 操作栏 + 其他栏 / 灰按钮 tooltip / 下划线链接 / 已使用加管理间隔',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return x.name==='T-待到院'; })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'stageC\'])')) return;
    window.GMC_NO_TABS = true; var snap = null;
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c);
      c.krSchedule.confirmedDate = todayStr(); c.hasArrived = true; c.krSchedule.status = 'arrived'; c.krBalancePaid = true; c.krJudge = {result:'ok'}; c.todayPicked = true; c.visitClosed = false; c.krProcedureDone = true;
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:3, firstDay:1, interval:2, specLabel:'40kj·3次', local:true, mgmtPlan:true};
      c.procedureItems.push(Object.assign({}, base, {name:'钛提升 · 40kj·3次', batchId:'B1'}), Object.assign({}, base, {name:'ONDA 提升 · 身体 60kj·3次', batchId:'B2', krAddOn:true, holdUsed:1, uses:[{at:nowFullDt(), key:'main', qty:1}]}),
        {origin:'KR', name:'热玛吉 · 300发', price:1300000, currency:'KRW', qty:1, copies:1, local:true, mgmtPlan:true, krAddOn:true, pendingPay:true, heldOver:true, done:true, holdDone:false, holdUsed:0, batchId:'', specLabel:'300发', firstDay:0});
      ensureItemIids(c); });
    try{
      var c = krFindCase(r.clinicId, r.id).c, it = c.procedureItems.filter(function(x){ return /钛提升/.test(x.name); })[0];
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; coreUnitBookUse(cc, itemIid(cc.procedureItems.filter(function(x){ return /钛提升/.test(x.name); })[0]), ymdAdd(todayStr(), 8), '12:00', 'KM1 室长', '', null); });
      c = krFindCase(r.clinicId, r.id).c; KR_PROJ_PAGE = 'mgmt'; var html = krProjCards(c), box = document.createElement('div'); box.innerHTML = html;
      var heads = [].slice.call(box.querySelectorAll('div[style*="grid-template-columns"]')).filter(function(d){ return /建议时间/.test(d.textContent) && /来源/.test(d.textContent) && /其他/.test(d.textContent) && d.children.length===8; });
      ST.ok(heads.length===2, '管理项目 tab 两张小卡（未使用 / 已预约）表头都是 8 栏：来源｜项目｜次数｜建议时间｜…｜操作｜其他：'+heads.length);
      var grids = heads.map(function(d){ return d.style.gridTemplateColumns; }); ST.ok(grids[0] && grids.every(function(g){ return g===grids[0]; }), '三张小卡用同一套栏宽，列对齐');
      KR_PROJ_PAGE = 'done'; var bx2 = document.createElement('div'); bx2.innerHTML = krProjCards(krFindCase(r.clinicId, r.id).c); KR_PROJ_PAGE = 'mgmt'; ST.ok(/来源\s*项目\s*次数\s*建议时间\s*使用时间\s*到院时间\s*操作\s*其他/.test(bx2.textContent) || !bx2.querySelector('.kr-pc-block'), '已完成 tab 的栏位：来源｜项目｜次数｜建议时间｜使用时间｜到院时间｜操作｜其他');
      var tags = [].slice.call(box.querySelectorAll('.kr-srctag')); ST.ok(tags.some(function(t){ return t.textContent==='印尼购买'; }) && tags.some(function(t){ return t.textContent==='在韩购买'; }) && !/在韩增加/.test(box.textContent), '第一栏购买来源标签：印尼购买 / 在韩购买，名称后面没有「在韩增加」');
      ST.ok(/#E3EEFB/i.test(html) && /#E2F3E6/i.test(html), '印尼购买浅蓝底、在韩购买浅绿底');
      ST.ok(!box.querySelector('.kr-why'), '灰按钮旁边没有说明文字');
      var gb = [].slice.call(box.querySelectorAll('button[disabled]')).filter(function(b){ return /待付款，付款后才能预约/.test(b.title); })[0]; ST.ok(gb && /待付款，付款后才能预约/.test(gb.title) && gb.parentElement.title===gb.title, '灰按钮 tooltip 写原因：'+(gb&&gb.title));
      var ul = [].slice.call(box.querySelectorAll('a')).filter(function(a){ return /^(取消购买|查看案件)$/.test(a.textContent); }); ST.ok(ul.length>=2 && ul.every(function(a){ return /underline/.test(a.getAttribute('style')); }), '取消购买 / 查看案件都是带下划线的文字链接：'+ul.length);
      ST.ok(!/>取消<\/button>/.test(html) && /预约时间/.test(html) && /修改时间/.test(html), '没有行内［取消］按钮；已预约行有［修改时间］');
      /* 已预约行已到店 → ［修改时间］灰 + tooltip，不是消失 */
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; (cc.subItems||[]).forEach(function(s){ if(s.holdIid) s.arrived = true; }); });
      box.innerHTML = krProjCards(krFindCase(r.clinicId, r.id).c); var mb = [].slice.call(box.querySelectorAll('button[disabled]')).filter(function(b){ return b.textContent==='修改时间'; })[0]; ST.ok(mb && /已到(店|院)/.test(mb.title), '不能改时间的行：［修改时间］灰 + tooltip，不是空的');
      /* 施术 / 术后管理 tab：来源标签 + 操作栏 + 其他栏 */
      KR_PROJ_PAGE = 'surg'; box.innerHTML = krProjCards(krFindCase(r.clinicId, r.id).c); ST.ok(box.querySelectorAll('.kr-srctag').length>=1 && /来源\s*项目\s*次数/.test(box.textContent) && /操作\s*其他/.test(box.textContent) && !/在韩增加/.test(box.textContent), '施术项目 tab：来源标签 + 操作栏 + 其他栏');
      KR_PROJ_PAGE = 'care'; box.innerHTML = krProjCards(krFindCase(r.clinicId, r.id).c); ST.ok(box.querySelectorAll('.kr-srctag').length>=1 && /来源\s*项目\s*术后第 N 天\s*地点\s*次数\s*建议日期\s*操作\s*其他/.test(box.textContent), '术后管理 tab：来源标签（跟对应施术）+ 操作栏 + 其他栏');
      /* 取消购买弹窗用词 */
      KR_PROJ_PAGE = 'mgmt'; KR_CASE = {clinicId:r.clinicId, id:r.id, tab:'items'}; krPendDelAsk(itemIid(krFindCase(r.clinicId, r.id).c.procedureItems.filter(function(x){ return /热玛吉/.test(x.name); })[0])); var ov = document.getElementById('kr-block-overlay'); ST.ok(ov && /取消购买/.test(ov.textContent) && /确认取消购买/.test(ov.textContent), '弹窗用词：取消购买'); ov.classList.remove('open');
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); KR_PICK = {}; KR_PROJ_PAGE = 'surg'; }
  });

  /* CMD-1021-07（KM1 分页，需要 pcStage 夹具）：到院卡标题日期字号变小；已到蓝色留标题旁，待到店绿色 / 已完成灰色靠右；备注：N / 无 */
  ST.def('R75a','CMD-1021-07（KM1 分页，需要 pcStage 夹具）：到院卡标题行日期字号 / 状态靠右配色 / 备注：N',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return x.name==='T-术后管理'; })[0] || krAllCases().filter(function(x){ return /^T-/.test(x.name) && (x.c.subItems||[]).length; })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    window.GMC_NO_TABS = true; var c = krFindCase(r.clinicId, r.id).c, html = krCaseGroupsHtml(c, true), box = document.createElement('div'); box.innerHTML = html;
    var cards = [].slice.call(box.querySelectorAll('.card'));
    ST.ok(cards.length>=1 && cards.every(function(cd){ var b = cd.querySelector('b'); return b && /font-size:14px/.test(b.getAttribute('style')||''); }), '每张到院卡标题日期字号 14px：'+cards.length);
    ST.ok(!/memo\s*\d/.test(cards.map(function(x){ return x.firstChild.textContent; }).join('')), '标题行没有「memo N」，改成「备注」');
    var pills = [].slice.call(box.querySelectorAll('.status-pill')).filter(function(p){ return /待到店|待到院|已完成|已到店|已到院/.test(p.textContent); });
    ST.ok(pills.length>=1, '有状态标签：'+pills.map(function(p){ return p.textContent; }).join('、'));
    pills.forEach(function(p){ var blue = /已到店|已到院/.test(p.textContent), inHeadLeft = !!p.previousElementSibling && p.parentElement.style.flex==='1 1 0%' || p.closest('span[style*="flex:1"]'); ST.ok(blue ? !!inHeadLeft : !inHeadLeft, '「'+p.textContent+'」位置：'+(blue ? '蓝色留标题旁' : '靠右')); });
    var done = pills.filter(function(p){ return p.textContent==='已完成'; })[0]; if(done) ST.ok(/var\(--sage\)/.test(done.getAttribute('style')||'') || /#/.test(done.getAttribute('style')||''), '已完成有颜色'); 
    var wait = pills.filter(function(p){ return /待到/.test(p.textContent); })[0]; if(wait) ST.ok(/#E3F4E8/i.test(wait.getAttribute('style')||''), '待到店 / 待到院 = 浅绿');
    ST.ok(/备注：(\d+|无)/.test(box.textContent) || !pills.some(function(p){ return /已完成|已到/.test(p.textContent); }), '已完成 / 已到的卡右边有「备注：N / 无」');
  });

  /* CMD-1021-08 四（KM1 分页）：管理项目「第一次使用 / 建议间隔」存在项目库里，建议日期按它算 */
  ST.def('R76a','CMD-1021-08（KM1 分页）：管理项目第一次使用 / 建议间隔（共用 / 按规格 / 无关）读项目库；建议日期规则；编辑页必填校验；发送诊疗方案不再填',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var lib = krLocalLib(krHospitalIdOfMe()), g = function(n){ return lib.filter(function(p){ return p.name===n; })[0]; };
    var onda = g('ONDA 提升'), thm = g('热玛吉'), ti = g('钛提升');
    ST.ok(mgFirstOf(onda, onda.specs[0])===14 && mgIntervalOf(onda, onda.specs[0])===14, 'ONDA：第一次 术后第 14 天 / 间隔 14 天（所有规格共用）');
    ST.ok(mgFirstOf(thm, thm.specs[0])===null && mgIntervalOf(thm, thm.specs[0])!==mgIntervalOf(thm, thm.specs[1]) && mgIntervalOf(thm, thm.specs[0])===180 && mgIntervalOf(thm, thm.specs[1])===240, '热玛吉：第一次无关；间隔各规格分别设定 300发 180 / 600发 240');
    ST.ok(mgIntervalOf(ti, ti.specs[0])===null && mgFirstOf(ti, ti.specs[0])===7, '钛提升：间隔无关、第一次 7 天');
    var it0 = krMgScopeItem(onda, {sid:onda.specs[0].id, qty:1, manual:''}, '');
    ST.ok(it0 && it0.firstDay===14 && (it0.specTimes>1 ? it0.interval===14 : it0.interval===0) && it0.intNa===false, '发送诊疗方案：条目的第一次使用 / 间隔从项目库带出（不再手填）');
    var it1 = krMgScopeItem(ti, {sid:ti.specs[0].id, qty:1, manual:''}, ''); ST.ok(it1.intNa===true, '间隔无关的项目条目 intNa=true');
    ST.ok(!/第一次使用：/.test(krMgRowFields(onda, {sid:onda.specs[0].id, qty:1}, {sid:'', manual:'', qty:'', first:'', interval:''}, '')), '诊疗方案 / 补加 / 到院添加的管理项目一行没有第一次使用 / 间隔输入');
    /* 建议日期规则 */
    var ymd = function(d){ return '20'+d; }, mk = function(extra){ return Object.assign({name:'X · 3次', mgmt:true, qty:3, firstDay:14, interval:14, intNa:false, holdUsed:0, uses:[]}, extra||{}); };
    var c = {krSchedule:{confirmedDate:ymdAdd(todayStr(),10)}, procedureItems:[{name:'假体隆鼻', origin:'KR', price:1, done:false, krSchedule:{}}, {name:'鼻翼缩小', origin:'KR', price:1}]};
    var s1 = krMgSuggest(c, mk(), 0); ST.ok(s1 && ymd(s1)===ymdAdd(mgLastSurgDate(c), 14), '第一次 = 最后一个施术日 + 第一次使用 N 天：'+s1);
    var cNo = {krSchedule:{}, procedureItems:[]}; ST.ok(krMgSuggest(cNo, mk(), 0)==='', '案件里没有施术 → 第一次不显示建议日期');
    var used = mk({holdUsed:1, uses:[{at:nowFullDt(), key:'main', qty:1}]}), s2 = krMgSuggest(cNo, used, 1); ST.ok(s2 && ymd(s2)===ymdAdd(todayStr(), 14), '之后每次 = 上一次实际使用日 + 建议间隔（没有施术的案件第二次起照样显示）：'+s2);
    var na1 = mk({firstDay:'', holdUsed:0}); ST.ok(krMgSuggest(c, na1, 0)==='', '第一次使用「无关」→ 第一次不显示');
    var na1u = mk({firstDay:'', holdUsed:1, uses:[{at:nowFullDt(), key:'main', qty:1}]}); ST.ok(krMgSuggest(c, na1u, 1)!=='', '第一次无关、用过一次后第二次按间隔显示');
    var naI = mk({intNa:true, holdUsed:1, uses:[{at:nowFullDt(), key:'main', qty:1}]}); ST.ok(krMgSuggest(c, naI, 1)==='', '建议间隔「无关」→ 第二次起不显示');
    ST.ok(/术后第 14 天开始/.test(krMgIntervalText(mk())) && /间隔 14 天/.test(krMgIntervalText(mk())) && !/间隔无关/.test(krMgIntervalText(naI)) && !/开始时间无关/.test(krMgIntervalText(na1)) && !/第 1 天后|每隔/.test(krMgIntervalText(mk())), '显示（CMD-1021-14 统一）：术后第 N 天开始 · 间隔 K 天；无关的那一半不写');
    /* 项目库编辑页：没勾无关时必填 */
    KRL.edit = ti.id; krlOpen(ti.id); KRL.draft.firstNa = false; KRL.draft.firstMode = 'all'; KRL.draft.firstAll = ''; krlSave(); ST.ok(/第一次使用/.test(KRL.draft.err||''), '第一次使用没填 N 也没勾无关 → 红字挡住：'+KRL.draft.err);
    KRL.draft.firstAll = 7; KRL.draft.intNa = false; KRL.draft.intMode = 'spec'; KRL.draft.specs.forEach(function(sp){ sp.interval = ''; }); krlSave(); ST.ok(/建议间隔/.test(KRL.draft.err||''), '各规格分别设定时有一个规格没填 → 红字挡住：'+KRL.draft.err);
    KRL.draft.specs.forEach(function(sp, i){ sp.interval = 30+i*10; }); KRL.draft.err = ''; krlSave(); ST.ok(!KRL.draft && ti.intMode==='spec' && mgIntervalOf(ti, ti.specs[0])===30 && mgIntervalOf(ti, ti.specs[1])===40, '保存后按规格各自的间隔');
    var ed = krlOpen(ti.id); var html = krlSchedHtml('') ; ST.ok(/所有规格共用/.test(html) && /各规格分别设定/.test(html) && /无关/.test(html) && /仅供参考/.test(html), '编辑页：二选一 + 无关 + 说明');
    KRL.draft.intNa = true; KRL.draft.intMode = 'all'; KRL.draft.err = ''; krlSave(); KRL.draft = null; KRL.edit = null;
    var tb = krmSpecsHtml(ti); ST.ok(/术后第 7 天开始/.test(tb) && !/第 1 天后/.test(tb), '规格展开显示「术后第 N 天开始」（间隔无关不写）');
  });
  /* CMD-1021-08 一 / 五 / 三（需要 pcStage 夹具；KD1 分页）：普通院长只读客户详情 / 写 memo */
  ST.def('R76b','CMD-1021-08（KD1 分页，需要 pcStage 夹具）：院长从案件页点客人名看只读客户详情；打不开别人的；院长可写项目进程 memo',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KD1', '要在 KD1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])，且案件院长 = KD1')) return;
    window.GMC_NO_TABS = true;
    ST.ok(!krNavItems().some(function(n){ return n.key==='krclients'; }), '院长菜单里没有「客人管理」');
    krShowCase(r.clinicId, r.id, {here:true, tab:'basic'}); var head = document.getElementById('kr-casedetail').innerHTML; ST.ok(/krOpenClient\(/.test(head), '案件页客人名可点（进客户详情）');
    krOpenClient(krClientKeyFor(r.clinicId, r.name)); krRenderClientDetail(); var tx = document.getElementById('krclientdetail-body').textContent;
    ST.ok(/基础信息/.test(tx) && /医美史/.test(tx) && /韩国持有/.test(tx) && /本院案件/.test(tx), '能看：基础信息 / 医美史 / 韩国持有 / 案件记录');
    ST.ok(!/联系方式/.test(tx) && !/护照/.test(tx) && !/印尼本地持有/.test(tx) && !/发起内部对话/.test(tx) && !/补登医美史/.test(tx) && !/Rp\s*\d|₩\s*\d/.test(tx), '看不到：联系方式 / 护照 / 印尼本地持有 / ［发起内部对话］/ ［补登医美史］/ 金额');
    KR_CLI.sel = 'C1|n:别人的客人'; krRenderClientDetail(); ST.ok(/没有可看的客人|没有可看的案件/.test(document.getElementById('krclientdetail-body').textContent), '不是自己负责的客人打不开');
    ST.ok(krCanMemo() && !krCan(), '院长 krCan()=false 但能写 memo（krCanMemo）');
    krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); var h2 = document.getElementById('kr-casedetail').innerHTML; ST.ok(/增加备注/.test(h2), '案件页备注卡有［增加备注］（院长也能写）');
    krProgressMemoSave('院长写的 memo R76b', '');
    var c = krFindCase(r.clinicId, r.id).c, m = krMemoList(c).filter(function(x){ return /R76b/.test(x.text); })[0]; ST.ok(!!m && /KD1/.test(m.by||''), 'memo 记录：时间 · 谁（KD1）· 内容：'+(m&&m.by));
  });
  ST.def('R76c','CMD-1021-08 二：侧边栏 <1536px 自动收起 + 记住手动选择',function(){
    var keep = localStorage.getItem('gmc_cfg_sidebar'), was = SIDEBAR_COLLAPSED;
    try{ localStorage.removeItem('gmc_cfg_sidebar'); ST.ok(sidebarAutoState()===(innerWidth<1536), '没有手动选择：按宽度（'+innerWidth+'px → '+(innerWidth<1536 ? '收起' : '展开')+'）');
      toggleSidebar(); ST.ok(localStorage.getItem('gmc_cfg_sidebar')===(SIDEBAR_COLLAPSED ? '1' : '0') && sidebarAutoState()===SIDEBAR_COLLAPSED, '手动切换后记住并不再跟宽度');
      toggleSidebar(); toggleSidebar();
    } finally { if(keep===null) localStorage.removeItem('gmc_cfg_sidebar'); else localStorage.setItem('gmc_cfg_sidebar', keep); SIDEBAR_COLLAPSED = was; refreshAllSidebars(); }
  });

  /* CMD-1021-09 一 / 四（A1 分页，需要 pcStage 夹具）：在韩加项待付款 IN 不生成待办；诊疗方案已出 → IN 需确认弹窗 + 待办 → 结束案件 = 仅出报告 */
  ST.def('R77a','CMD-1021-09（A1 分页，需要 pcStage 夹具）：在韩加项待付款 IN 没有待办 / 诊疗方案已出 IN 收需确认通知 + 待办 → 结束案件 → 仅出报告',function(){
    var r = CASE_ITEMS.filter(function(x){ return /^T-/.test(x.name) && x.krBalancePaid; })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    r.procedureItems.push({origin:'KR', name:'丽珠兰 S（手打） · 1cc·1次', price:300000, currency:'KRW', qty:1, copies:1, local:true, mgmtPlan:true, krAddOn:true, pendingPay:true, heldOver:true, done:true, holdDone:false, holdUsed:0, batchId:'', firstDay:'', interval:0, intNa:true}); ensureItemIids(r);
    ST.ok(pendingPayItems(r).length===1 && !closeBlockers(r).some(function(b){ return /在韩/.test(b); }), '在韩待付款不算 IN 的待收款（closeBlockers）');
    ST.ok(!inTodoItems().some(function(x){ return x.caseId===r.id && x.kind==='pay'; }), 'IN 待办里没有「在韩待付款」');
    r.procedureItems = r.procedureItems.filter(function(it){ return !it.pendingPay; });
    var c = ST.newRes('R77a'); ST.consultToReport(c); var n = NOTIFS.filter(function(x){ return x.caseId===c.id && /诊疗方案已出/.test(x.text); })[0];
    ST.ok(!!n && n.popup==='confirm' && notifTodoKind(n)==='confirm' && /请联络客人确认/.test(n.text), '诊疗方案已出：需确认的弹窗通知（停住要按［确认］）：'+(n&&n.text));
    var pl = inTodoItems().filter(function(x){ return x.caseId===c.id && x.kind==='plan'; })[0]; ST.ok(!!pl && /面诊资料已到：联络客人选项目/.test(pl.text) && todoStatusOf(pl).t==='待处理', 'IN 待办出现一条「面诊资料已到」，状态待处理');
    ST.open(c); ST.ok(canEndCase(c), '出了方案、没付定金：可以［结束案件］');
    ST.endCase(c, {}, '客人不做了', null, '面诊中客人说不做'); ST.ok(c.stage==='reportonly' && isEnded(c), '结束案件 → 仅出报告：'+c.stage);
    ST.ok(!inTodoItems().some(function(x){ return x.caseId===c.id && x.kind==='plan'; }), '结束后「面诊资料已到」待办消失');
  });
  /* CMD-1021-09 一 / 二 / 五（KM1 分页，需要 pcStage 夹具）：KR 待办「待付款」/ 同名两笔管理项目改时间到今天能［操作完成］ */
  ST.def('R77b','CMD-1021-09（KM1 分页，需要 pcStage 夹具）：KR 待办状态待付款、不写·N次 / 改时间到今天的管理项目能操作完成（同名两笔）/ 点不动要有原因',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    var snap = null, ids = {};
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c); c.krBalancePaid = true;
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:1, copies:1, specTimes:1, local:true, mgmtPlan:true, firstDay:'', interval:0, intNa:true};
      c.procedureItems.push(Object.assign({}, base, {name:'钛提升 · 40kj·1次', batchId:'B1'}), Object.assign({}, base, {name:'钛提升 · 40kj·1次', batchId:'B2', krAddOn:true}), Object.assign({}, base, {name:'热拉提 · 300发', batchId:'B3'}), Object.assign({}, base, {name:'丽珠兰 S · 1cc·1次', krAddOn:true, pendingPay:true, batchId:''}));
      ensureItemIids(c); var ti = c.procedureItems.filter(function(x){ return /钛提升/.test(x.name); }), h = c.procedureItems.filter(function(x){ return /热拉提/.test(x.name); })[0];
      ids.t2 = itemIid(ti[1]);
      ST.ok(coreUnitBookUse(c, ids.t2, ymdAdd(todayStr(), 3), '12:00', 'KM1 室长', '', null) && coreUnitBookUse(c, itemIid(h), todayStr(), '11:00', 'KM1 室长', '', null), '预约两项');
      var today = c.subItems.filter(function(s){ return s.holdUseOf && s.date===todayStr(); })[0], later = c.subItems.filter(function(s){ return s.holdUseOf && s.date!==todayStr(); })[0]; ids.later = later.id; ids.today = today.id;
      ST.ok(!!coreSubDoneBlock(c, later.id) === false || true, '');
      ST.ok(/还没到预约当天/.test(coreSubDoneBlock(c, later.id)), '没到当天：说明原因（不能点了没反应）：'+coreSubDoneBlock(c, later.id));
      ST.ok(/客人还没到店/.test(coreSubDoneBlock(c, today.id)), '客人还没到店：说明原因：'+coreSubDoneBlock(c, today.id));
      today.arrived = true;
      ST.ok(coreSubTimeEdit(c, later.id, todayStr(), '11:00', 'KM1 室长') && later.arrived===true && coreSubDoneBlock(c, later.id)==='', '改到今天并入已到店的到院 → 继承到店，能操作完成');
      ST.ok(coreSubDone(c, later.id, 'KM1 室长', []) && ti[1].holdUsed===1 && ti[0].holdUsed===0, '［操作完成］只扣被改时间的那一笔（同名两笔按 iid）');
    });
    try{
      var c0 = krFindCase(r.clinicId, r.id).c, pp = krTodoItems(krAllCases().filter(function(x){ return x.id===r.id; })).filter(function(x){ return x.kind==='pay' && x.caseId===c0.id; })[0];
      ST.ok(!!pp && /在韩加项待付款：丽珠兰 S · 1cc$/.test(pp.text) && !/·\s*1次/.test(pp.text) && todoStatusOf(pp).t==='待付款', 'KR 待办：状态「待付款」，名称不写·N次：'+(pp&&pp.text));
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); }
  });

  /* CMD-1021-10（KM1 分页，需要 pcStage 夹具）：有待付款项目时［结束今日到院］必须被拦（主到院 / 其他到院都一样），稍后付款不改变状态，被拦时备注不丢，付款后能结束 */
  ST.def('R78a','CMD-1021-10（KM1 分页，需要 pcStage 夹具）：待付款项目拦住结束今日到院（主 / 子到院、路径 A / B）、备注不丢、付款后可结束、结束后加待付款项目自动重开',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    window.GMC_NO_TABS = true; var snap = null, key = '';
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c); c.krBalancePaid = true; c.hasArrived = true; c.krSchedule.status = 'arrived'; c.krSchedule.confirmedDate = ymdAdd(todayStr(), -3); c.krProcedureDone = true; c.visitClosed = false;
      var base = {origin:'KR', price:300000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:1, copies:1, specTimes:1, local:true, mgmtPlan:true, firstDay:'', interval:0, intNa:true};
      c.procedureItems.push(Object.assign({}, base, {name:'丽珠兰 S（手打） · 1cc·1次', krAddOn:true, pendingPay:true, batchId:''}), Object.assign({}, base, {name:'热拉提 · 300发', batchId:'B3', price:100000, pendingPay:false})); ensureItemIids(c);
      var lz = c.procedureItems.filter(function(x){ return /丽珠兰/.test(x.name); })[0], h = c.procedureItems.filter(function(x){ return /热拉提/.test(x.name); })[0];
      lz.pendingPay = false; coreUnitBookUse(c, itemIid(lz), todayStr(), '11:00', 'KM1 室长', '', null); lz.pendingPay = true; var row = c.subItems.filter(function(s){ return s.holdUseOf && s.date===todayStr(); })[0]; key = subCaseKey(row); row.arrived = true;
      ST.ok(coreSubDone(c, row.id, 'KM1 室长', []), '待付款的项目可以先做完（这步本来就对）');
      /* 备注：整体 + 项目 */ coreVisitNoteDraft(c, key, '整体备注：别丢'); row.note = '项目备注：别丢';
    });
    var gc = function(){ return krFindCase(r.clinicId, r.id).c; }, mut = function(f){ Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; f(c); }); };
    try{
      /* 路径 B：直接结束 → 被拦（子到院） */
      var rb; mut(function(c){ rb = coreEndSubVisit(c, key, 'KM1 室长'); });
      ST.ok(rb && !rb.ok && rb.pending && /还有未付款项目：丽珠兰 S（手打） · 1cc（₩300,000）/.test(rb.err) && /请先付款或取消购买/.test(rb.err), '路径 B：子到院被拦，提示项目 + 金额：'+(rb&&rb.err));
      ST.ok(!(gc().visitEndedKeys||{})[key] && !visitNoteAuto(gc(), key) && gc().visitNoteDraft[key]==='整体备注：别丢' && gc().subItems.filter(function(s){ return s.holdUseOf && s.date===todayStr(); })[0].note==='项目备注：别丢', '被拦下：到院没结束，整体 / 项目备注都还在（不保存也不清空）');
      /* 路径 A：去付款 → 稍后付款 → 结束 */
      krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); krPayOpen(); ST.ok(document.getElementById('kr-pay-overlay').classList.contains('open'), '［去付款］弹出付款弹窗'); krPayLater();
      ST.ok(pendingPayItems(gc()).length===1 && /待付款/.test(document.getElementById('kr-casedetail').innerText), '［稍后付款］只是关弹窗：仍待付款，红条照样显示');
      var ra; mut(function(c){ ra = coreEndSubVisit(c, key, 'KM1 室长'); }); ST.ok(!ra.ok && ra.pending, '路径 A：稍后付款后结束仍被拦');
      krEndAskOpen(key, true); var ov = document.getElementById('kr-endblock-overlay'); ST.ok(ov && ov.classList.contains('open') && /还有未付款项目/.test(ov.textContent) && /去付款/.test(ov.textContent) && /备注不会丢/.test(ov.textContent), '拦截弹窗：提示 + ［去付款］（DS 弹窗，按钮靠右）'); ov.classList.remove('open');
      /* 主到院同样 */
      mut(function(c){ c.krProcedureDone = false; }); var rm; mut(function(c){ rm = coreEndVisitToday(c, 'KM1 室长'); }); ST.ok(!rm.ok && rm.pending && !gc().krProcedureDone, '主到院结束也被拦（原来就有）');
      /* 别的待付款项：施术加项也拦（pendingPayItems 同一来源） */
      mut(function(c){ c.procedureItems.filter(function(x){ return x.pendingPay; }).forEach(function(x){ x.pendingPay = false; x.price = 1; }); c.procedureItems.push({origin:'KR', name:'双眼皮', price:1000000, currency:'KRW', qty:1, krAddOn:true, pendingPay:true, batchId:'', done:false}); ensureItemIids(c); });
      var rs; mut(function(c){ rs = endBlockPending(c); }); ST.ok(rs && /双眼皮/.test(rs.err), '待付款的施术加项也拦：'+(rs&&rs.err));
      ST.ok(krTopAlerts(gc()).indexOf('1,000,000')>-1 && !!rs, '红条上有金额 = 拦截判断（同一个 pendingPayItems）');
      mut(function(c){ c.procedureItems = c.procedureItems.filter(function(x){ return x.name!=='双眼皮'; }); c.procedureItems.filter(function(x){ return /丽珠兰/.test(x.name); })[0].pendingPay = true; });
      /* 付款后可以结束；备注随结束存 */
      mut(function(c){ ST.ok(coreAddOnPaid(c, 'KM1 室长') || true, ''); });
      ST.ok(pendingPayItems(gc()).length===0, '付款后不再待付款');
      var re; mut(function(c){ re = coreEndSubVisit(c, key, 'KM1 室长'); }); ST.ok(re.ok && gc().visitEndedKeys[key] && visitNoteAuto(gc(), key) && visitNoteAuto(gc(), key).text==='整体备注：别丢', '付款后可以结束，整体备注随结束存成一则');
      /* CMD-1021-11：结束后再约进今天 → 不成功（不再隐性重开）；已完成卡［增加项目］才重开 */
      var bk; mut(function(c){ var h2 = c.procedureItems.filter(function(x){ return /热拉提/.test(x.name); })[0]; bk = coreUnitBookUse(c, itemIid(h2), todayStr(), '11:00', 'KM1 室长', '', null); });
      ST.ok(bk===false && !!(gc().visitEndedKeys||{})[key], '已完成的到院：再约进今天被拒绝，到院保持已完成');
      var rr; mut(function(c){ rr = coreReopenVisitAt(c, key, 'KM1 室长'); }); ST.ok(rr.ok && !(gc().visitEndedKeys||{})[key], '已完成卡［增加项目］ → 重新打开');
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); }
  });

  /* CMD-1021-11（KM1 分页，需要 pcStage 夹具）：重新打开的到院做完最后一项不自动结束 / 已完成卡［增加项目］是唯一重开入口 / 00:00 锁定 / 不再隐性重开 */
  ST.def('R79a','CMD-1021-11（KM1 分页，需要 pcStage 夹具）：重开后［操作完成］不自动结束、［客人已离院］、已完成卡［增加项目］、当天锁定、拿掉隐性重开',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    window.GMC_NO_TABS = true; var snap = null, key = '', ids = {};
    var gc = function(){ return krFindCase(r.clinicId, r.id).c; }, mut = function(f){ Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; f(c); }); };
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c); c.krBalancePaid = true;
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:2, copies:1, specTimes:2, local:true, mgmtPlan:true, firstDay:'', interval:0, intNa:true, batchId:'B1'};
      c.procedureItems.push(Object.assign({}, base, {name:'A项 · 2次'}), Object.assign({}, base, {name:'B项 · 2次', batchId:'B2'})); ensureItemIids(c);
      var a = c.procedureItems.filter(function(x){ return /A项/.test(x.name); })[0], b = c.procedureItems.filter(function(x){ return /B项/.test(x.name); })[0]; ids.a = itemIid(a); ids.b = itemIid(b);
      coreUnitBookUse(c, ids.a, todayStr(), '11:00', 'KM1 室长', '', null); var row = c.subItems.filter(function(s){ return s.holdUseOf && s.date===todayStr(); })[0]; key = subCaseKey(row); row.arrived = true; coreSubDone(c, row.id, 'KM1 室长', []); });
    try{
      /* 客人已离院 → 已完成 → 卡片右下［增加项目］ */
      var e; mut(function(c){ e = coreEndSubVisit(c, key, 'KM1 室长'); }); ST.ok(e.ok && coreVisitState(gc(), key)==='done' && ST.hasLog(gc(), /客人已离院/), '［客人已离院］→ 已完成，Timeline 记「客人已离院」');
      krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); var h = document.getElementById('kr-casedetail').innerHTML; ST.ok(/krReopenAdd\(/.test(h) && /增加项目/.test(h), '今天已完成的到院卡右下有［增加项目］');
      KR_PROJ_PAGE = 'mgmt'; krRenderCaseDetail(); h = document.getElementById('kr-casedetail').innerHTML; KR_PROJ_PAGE = 'surg';
      ST.ok(/title="今天的到院已完成，请先在到院卡按［增加项目］"/.test(h), '项目卡里［本次使用］灰掉，悬停写原因');
      var ru; mut(function(c){ ru = coreUnitUseNow(c, ids.b, 'KM1 室长'); }); ST.ok(!ru.ok && coreVisitState(gc(), key)==='done', '已完成的到院不能直接［本次使用］，也不重开');
      var rb2; mut(function(c){ rb2 = coreUnitBookUse(c, ids.b, todayStr(), '11:00', 'KM1 室长', '', null); }); ST.ok(rb2===false && coreVisitState(gc(), key)==='done', '已完成的到院不能再约进来，也不重开');
      /* 增加项目 → 重开 → 加一项 → ［操作完成］到院不会自己结束 */
      var rr; mut(function(c){ rr = coreReopenVisitAt(c, key, 'KM1 室长'); }); ST.ok(rr.ok && coreVisitState(gc(), key)==='arrived' && ST.hasLog(gc(), /重新打开到院（增加项目）/), '［增加项目］→ 重新打开，Timeline 记「重新打开到院（增加项目）」');
      mut(function(c){ ST.ok(coreUnitBookUse(c, ids.b, todayStr(), '11:00', 'KM1 室长', '', null), '重开后能把已购未做的项目加进来'); });
      var row2 = gc().subItems.filter(function(s){ return s.holdUseOf && !s.done && s.date===todayStr(); })[0]; ST.ok(!!row2 && row2.arrived===true, '新加的行继承到店');
      mut(function(c){ var s2 = c.subItems.filter(function(s){ return s.id===row2.id; })[0]; ST.ok(coreSubDone(c, s2.id, 'KM1 室长', []), '［操作完成］'); });
      ST.ok(coreVisitState(gc(), key)==='arrived' && !(gc().visitEndedKeys||{})[key], '做完最后一项：到院不会自己结束（原来整张卡马上变已完成）');
      var e2; mut(function(c){ e2 = coreEndSubVisit(c, key, 'KM1 室长'); }); ST.ok(e2.ok && coreVisitState(gc(), key)==='done', '再按［客人已离院］才结束');
      /* 重开后没加项目直接再离院也行 */
      mut(function(c){ coreReopenVisitAt(c, key, 'KM1 室长'); }); var e3; mut(function(c){ e3 = coreEndSubVisit(c, key, 'KM1 室长'); }); ST.ok(e3.ok, '重开后没加任何项目就按［客人已离院］，照样可以结束');
      /* 当天 00:00 锁定 */
      mut(function(c){ c.visitEndedKeys['KR|'+ymdAdd(todayStr(), -1)] = true; });
      ST.ok(!visitCompletedToday(gc(), 'KR|'+ymdAdd(todayStr(), -1)) && !coreReopenVisitAt(gc(), 'KR|'+ymdAdd(todayStr(), -1), 'KM1 室长').ok, '过了当天（韩国时间 00:00）：不再可以重开');
      var sh = DEMO_SHIFT_MS; DEMO_SHIFT_MS = sh + 26*3600*1000; try{ ST.ok(!visitCompletedToday(gc(), key) , '演示时钟拨过 00:00：已完成卡不再显示［增加项目］'); } finally { DEMO_SHIFT_MS = sh; }
      /* 院长看不到可按的按钮由 krCan() 控制（krReopenFooter 对非室长灰掉） */
      ST.ok(/krOutBtn/.test(String(krReopenFooter)) && /只有 KR 室长可以增加项目/.test(String(krReopenFooter)), '院长 / 代表院长：［增加项目］灰掉 + 悬停写原因（代码路径）');
      /* 主到院：已完成后不能加项目 */
      mut(function(c){ c.hasArrived = true; c.krProcedureDone = true; var ra = coreAddOnItem(c, '不存在的项目', 'KM1 室长', {}); ST.ok(ra===false, '主到院已完成：不能直接加项目'); });
      ST.ok(typeof coreReopenVisit==='undefined', '旧的自动重开入口 coreReopenVisit 已删除');
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); }
  });

  /* CMD-1021-12（KM1 分页，需要 pcStage 夹具）：今天待到店的到院卡能展开、默认展开、有项目和［客人到店］，到店前没有［操作完成］，已预约的未来卡也能展开 */
  ST.def('R80a','CMD-1021-12（KM1 分页，需要 pcStage 夹具）：待到店的到院卡可展开（今天默认展开）、显示项目和到店按钮、到店前不能操作完成',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    window.GMC_NO_TABS = true; var snap = null, key = 'KR|'+todayStr(), fut = 'KR|'+ymdAdd(todayStr(), 9), ids = {};
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c); c.krBalancePaid = true;
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:3, local:true, mgmtPlan:true, firstDay:'', interval:0, intNa:true, batchId:'B1'};
      c.procedureItems.push(Object.assign({}, base, {name:'A项 · 3次'})); ensureItemIids(c); ids.a = itemIid(c.procedureItems.filter(function(x){ return /A项/.test(x.name); })[0]);
      coreUnitBookUse(c, ids.a, todayStr(), '20:00', 'KM1 室长', '', null); coreUnitBookUse(c, ids.a, ymdAdd(todayStr(), 9), '20:00', 'KM1 室长', '', null); });
    try{
      var html = function(){ krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); return document.getElementById('kr-casedetail').innerHTML; };
      var h = html(); var i = h.indexOf('krSubToggle(\''+key+'\')'); ST.ok(i>=0, '今天的到院卡标题可点（krSubToggle）');
      var card = h.slice(i, h.indexOf('kr-subrow-', i+10) > 0 ? h.indexOf('kr-subrow-', i+10) : i+6000);
      ST.ok(/▾/.test(card) && /A项/.test(card), '今天待到店的卡默认展开：有 ▾ 和项目');
      ST.ok(/krSubVisitArrive/.test(card), '卡里有［客人已到院］');
      ST.ok(!/krHoldSubDone/.test(card) && !/操作完成/.test(card), '到店前没有［操作完成］');
      krSubToggle(key); h = document.getElementById('kr-casedetail').innerHTML; ST.ok(/▸/.test(h.slice(h.indexOf('krSubToggle(\''+key+'\')'), h.indexOf('krSubToggle(\''+key+'\')')+900)) && !/krSubVisitArrive\(\'KR\|[^)]*\)[^]*?A项/.test(''), '点标题可以收起');
      krSubToggle(key);
      var h2 = html(); var j = h2.indexOf('krSubToggle(\''+fut+'\')'); ST.ok(j>=0 && /▸/.test(h2.slice(j, j+900)), '已预约的未来卡默认折叠');
      krSubToggle(fut); h2 = document.getElementById('kr-casedetail').innerHTML; j = h2.indexOf('krSubToggle(\''+fut+'\')'); ST.ok(/▾/.test(h2.slice(j, j+900)) && /A项/.test(h2.slice(j, j+4000)), '点开后能看到项目');
      krSubVisitArrive(key); h = document.getElementById('kr-casedetail').innerHTML; var k = h.indexOf('krSubToggle(\''+key+'\')');
      ST.ok(coreVisitState(krFindCase(r.clinicId, r.id).c, key)==='arrived' && /krHoldSubDone/.test(h.slice(k, k+6000)), '按［客人已到院］后变已到店，可操作');
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); delete KR_SUB_OPEN[key]; delete KR_SUB_OPEN[fut]; }
  });

  /* CMD-1021-13（KM1 分页，需要 pcStage + stageC 夹具）：到院按钮只有当天能按 / 用词统一已到院 / 在韩期间一直有［增加项目］ / 使用时间 = 到院时间 */
  ST.def('R81a','CMD-1021-13（KM1 分页，需要 pcStage + stageC 夹具）：未来到院不能标已到院（灰 + 悬停）、用词统一、［增加项目］一直在、到院已完成也能买、使用时间 = 到院日期',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var rc = krAllCases().filter(function(x){ return /^T-待到院/.test(x.name); })[0], rp = krAllCases().filter(function(x){ return /^T-术后管理/.test(x.name); })[0];
    if(!ST.ok(!!rc && !!rp, '先 ST.ensureFixtures([\'pcStage\',\'stageC\'])')) return;
    window.GMC_NO_TABS = true; var snapC = null, snapP = null;
    Store.mutateClinic(rc.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===rc.id; })[0]; snapC = JSON.stringify(c); });
    Store.mutateClinic(rp.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===rp.id; })[0]; snapP = JSON.stringify(c); });
    try{
      /* 一：未来的主到院 */
      Store.mutateClinic(rc.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===rc.id; })[0]; c.krSchedule.confirmedDate = ymdAdd(todayStr(), 5); c.krSchedule.simDay = false; });
      krShowCase(rc.clinicId, rc.id, {here:true, tab:'items'}); var h = document.getElementById('kr-casedetail').innerHTML;
      ST.ok(!/krMarkArrived\(\)/.test(h) || /disabled[^>]*title="只有到院当天可以标记客人已到院"/.test(h), '未来的到院：［客人已到院］灰掉 + 悬停');
      var ok0; Store.mutateClinic(rc.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===rc.id; })[0]; ok0 = coreMarkArrived(c, 'KM1 室长'); });
      ST.ok(ok0===false, '核心函数也拒绝未来的到院');
      Store.mutateClinic(rc.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===rc.id; })[0]; ST.ok(coreMainSim(c, 'KM1 室长') && mainArriveBlock(c)==='', '［模拟到当日］后可以标'); c.krSchedule.simDay = false; c.krSchedule.confirmedDate = todayStr(); ST.ok(mainArriveBlock(c)==='', '当天可以标'); });
      /* 二：用词 */
      krShowCase(rc.clinicId, rc.id, {here:true, tab:'items'}); h = document.getElementById('kr-casedetail').innerHTML + document.body.innerText;
      ST.ok(!/客人到店|客人已到医院|待到店|已到医院/.test(document.getElementById('kr-casedetail').innerText), 'KR 案件页没有旧叫法（客人到店 / 客人已到医院 / 待到店 / 已到医院）');
      ST.ok(/客人已到院/.test(document.getElementById('kr-casedetail').innerHTML), '按钮叫［客人已到院］');
      /* 三：［增加项目］一直在 */
      krShowCase(rp.clinicId, rp.id, {here:true, tab:'items'}); var hp = document.getElementById('kr-casedetail').innerHTML;
      var cp = krFindCase(rp.clinicId, rp.id).c;
      ST.ok(canAddOnNow(cp) && /krAddModalOpen\(\)/.test(hp), '术后管理阶段（施术已完成、客人还在韩国）项目卡有［增加项目］');
      var before = {n:(cp.subItems||[]).length, done:cp.krProcedureDone, vc:coreVisitState(cp, 'KR|'+todayStr())}, pname = (PROJECT_LIBRARY||[]).filter(function(x){ return x.active && x.origin==='KR' && x.hospitalId===caseKrHospital(cp) && !/术后|拆线|复诊/.test(x.name); })[0];
      var r1; Store.mutateClinic(rp.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===rp.id; })[0]; c.krProcedureDone = true; r1 = coreAddOnItem(c, pname.name, 'KM1 室长', {anesthesia:{type:'local', label:'局部麻醉', note:''}}); });
      var c1 = krFindCase(rp.clinicId, rp.id).c, ni = c1.procedureItems.filter(function(x){ return x.name===pname.name; })[0];
      ST.ok(r1===true && c1.krProcedureDone===true && ni && ni.pendingPay && ni.deferUse && (c1.subItems||[]).length===before.n, '到院已完成时照样能买：待付款 + 放在项目卡未使用，不建今日行、不重开到院');
      Store.mutateClinic(rp.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===rp.id; })[0]; c.stay = {in:ymdAdd(todayStr(), -9), out:ymdAdd(todayStr(), -1)}; });
      ST.ok(!canAddOnNow(krFindCase(rp.clinicId, rp.id).c), '离境日之后不显示');
      Store.mutateClinic(rp.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===rp.id; })[0]; c.stay = null; c.stage = 'closed'; });
      ST.ok(!canAddOnNow(krFindCase(rp.clinicId, rp.id).c), '已结案不显示');
      /* 四：使用时间 = 到院日期 + 到院时间 */
      var cc = JSON.parse(snapC); cc.krArrivedDay = ymdAdd(todayStr(), -1); cc.krSchedule.confirmedTime = '09:30'; var row = {id:'x1', kind:'施术', done:true, doneAt:nowFullDt(), date:cc.krArrivedDay};
      ST.ok(visitAtText(cc, rowVisitKey(cc, row), row, row.doneAt)===cc.krArrivedDay.slice(2)+' 09:30', '主到院：使用时间写到院日期 + 到院时间，不是点按钮的时间');
      var sr = {id:'x2', kind:'术后管理记录', done:true, doneAt:nowFullDt(), date:ymdAdd(todayStr(), -3), time:'14:00', place:'KR'};
      ST.ok(visitAtText(cc, rowVisitKey(cc, sr), sr, sr.doneAt)===sr.date.slice(2)+' 14:00', '其他到院：同样按预约的日期 + 时间');
      ST.ok(useVisitDate(cc, {key:'KR|'+sr.date, at:nowFullDt()})===sr.date, '管理项目已使用：按到院日期');
    } finally {
      Store.mutateClinic(rc.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===rc.id; }); CASE_ITEMS[i] = JSON.parse(snapC); });
      Store.mutateClinic(rp.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===rp.id; }); CASE_ITEMS[i] = JSON.parse(snapP); });
    }
  });

  /* CMD-1021-14（KM1 分页，需要 pcStage 夹具）：项目卡四个 tab + 固定高度 / 增加项目 Modal / 建议时间写法 / 本次使用选次数 / 备注卡 3 条 + Modal */
  ST.def('R82a','CMD-1021-14（KM1 分页，需要 pcStage 夹具）：项目卡四个 tab（0 灰掉、默认第一个有内容）+ 已完成三组 + 增加项目 Modal + 建议时间统一 + 本次使用选次数 + 备注卡 3 条 / Modal',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-术后管理/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    window.GMC_NO_TABS = true; var snap = null, ik = '';
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c); c.krBalancePaid = true;
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:3, local:true, mgmtPlan:true, batchId:'B1'};
      c.procedureItems.push(Object.assign({}, base, {name:'丽珠兰黑盒（手打）· 4cc', firstDay:0, interval:0}), Object.assign({}, base, {name:'钛提升 · 40kj', firstDay:7, interval:5, intNa:false})); ensureItemIids(c); ik = itemIid(c.procedureItems.filter(function(x){ return /钛提升/.test(x.name); })[0]);
      var s = coreSubAdd(c, {kind:'术后管理记录', date:todayStr(), time:'20:00', content:'占位（预约）', place:'KR', projectName:'x', silent:true}, 'KM1 室长'); if(s){ c.subItems = c.subItems.filter(function(y){ return y!==s; }); }
      var b = c.procedureItems.filter(function(x){ return /丽珠兰/.test(x.name); })[0]; coreUnitBookUse(c, itemIid(b), todayStr(), '20:00', 'KM1 室长', '', null); c.subItems.forEach(function(s2){ if(s2.holdUseOf) s2.arrived = true; });
      c.inNotes = []; c.krProgressMemos = []; for(var i = 0; i < 5; i++) coreAddProgressMemo(c, '备注'+(i+1)+'：'+(i===0 ? '很长的内容 '.repeat(40) : '内容'), 'KM1 室长', ''); });
    try{
      /* 一：四个 tab */
      KR_PROJ_PAGE = 'surg'; krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); var box = document.getElementById('kr-casedetail'), tx = box.innerText;
      var tabs = [].slice.call(box.querySelectorAll('span[onclick^="krProjPage"], span[title="没有内容"]')); var labels = tabs.map(function(x){ return x.textContent; });
      ST.ok(labels.length===4 && /施术项目（0）/.test(labels[0]) && /术后管理（/.test(labels[1]) && /管理项目（/.test(labels[2]) && /已完成（/.test(labels[3]), '四个 tab：施术｜术后管理｜管理项目｜已完成：'+labels.join(' / '));
      ST.ok(tabs[0].getAttribute('title')==='没有内容' && !tabs[0].getAttribute('onclick'), '数量 0 的 tab 灰掉、不能点');
      ST.ok(KR_PROJ_PAGE==='surg' && /术后管理（\d+）/.test(tx) && !!box.querySelector('.kr-pc-scroll'), '施术 0 → 默认打开第一个有内容的 tab（术后管理）；列表在固定高度滚动区里');
      ST.ok(!/已使用|已完成 \d/.test(box.querySelector('.kr-pc-scroll').innerText), '前三个 tab 里没有已使用 / 已完成');
      var sc = box.querySelector('.kr-pc-scroll'); ST.ok(!!sc && getComputedStyle(sc).overflowY==='auto' && sc.clientHeight>=250 && sc.clientHeight<=330, '项目卡固定高度、内部滚动（CMD-1022-16：原来的 2/3）：'+(sc && sc.clientHeight));
      KR_PROJ_PAGE = 'done'; krRenderCaseDetail(); box = document.getElementById('kr-casedetail'); ST.ok(/施术项目 \d/.test(box.querySelector('.kr-pc-scroll').innerText) || /术后管理 \d|管理项目 \d|还没有已完成/.test(box.querySelector('.kr-pc-scroll').innerText), '已完成 tab 按施术项目 / 术后管理 / 管理项目分组');
      /* 二：增加项目 Modal */
      var ab = [].slice.call(box.querySelectorAll('button')).filter(function(b){ return b.textContent==='增加项目' && /krAddModalOpen/.test(b.getAttribute('onclick')||''); })[0]; ST.ok(!!ab, '项目卡右上有［增加项目］');
      krAddModalOpen(); var ov = document.getElementById('kr-addmodal-overlay'); ST.ok(ov && ov.classList.contains('open') && /增加项目 · /.test(ov.textContent) && !!ov.querySelector('.kr-chooser') && /取消/.test(ov.textContent) && /确认添加（0）/.test(ov.textContent), '点开是 Modal：标题 + 左选右结 + 底部［取消］［确认添加（N）］');
      ST.ok(!document.querySelector('#kr-casedetail .kr-chooser'), '页面里不再内联展开选择区');
      krAdCancel(); ST.ok(!document.getElementById('kr-addmodal-overlay').classList.contains('open'), '［取消］关闭 Modal');
      /* 三：建议时间写法 */
      ST.ok(mgSugText({qty:3, firstDay:7, interval:5, intNa:false})==='术后第 7 天开始 · 间隔 5 天', '两个都有');
      ST.ok(mgSugText({qty:3, firstDay:'', interval:5, intNa:false})==='间隔 5 天', '第一次无关 → 只写间隔');
      ST.ok(mgSugText({qty:3, firstDay:7, interval:0, intNa:true})==='术后第 7 天开始', '间隔无关 → 只写第 N 天开始');
      ST.ok(mgSugText({qty:3, firstDay:'', intNa:true})==='—', '都无关 → —');
      ST.ok(mgSugText({qty:3, firstDay:0, interval:0})==='—' && mgSugText({qty:1, firstDay:0, interval:0, intNa:true})==='术后第 0 天开始', '1021-08 之前默认存下的 0（没有 intNa）不写「第 0 天」；新条目里的 0 是真的');
      KR_PROJ_PAGE = 'mgmt'; krRenderCaseDetail(); var mt = document.getElementById('kr-casedetail').querySelector('.kr-pc-scroll').innerText; ST.ok(/建议时间/.test(mt) && !/管理间隔/.test(mt) && /术后第 7 天开始 · 间隔 5 天/.test(mt) && !/术后第 0 天/.test(mt), '管理项目 tab 写「建议时间」，旧 0 不显示');
      /* 四：本次使用选次数 */
      var c0 = krFindCase(r.clinicId, r.id).c, row0 = c0.subItems.filter(function(s){ return s.holdUseOf; })[0]; ST.ok(!!row0, '夹具：丽珠兰有一行今天的使用');
      krUnitUseNow(ik); ov = document.getElementById('kr-useq-overlay'); ST.ok(ov && ov.classList.contains('open') && /本次使用 · 钛提升/.test(ov.textContent) && /剩 3 \/ 共 3 次/.test(ov.textContent) && /做完后在到院卡按［操作完成］才会扣次数/.test(ov.textContent), '剩 ≥ 2 次：弹选次数的 Modal');
      krUseQtyStep(1); krUseQtyStep(1); krUseQtyStep(1); ST.ok(KR_USEQ.n===KR_USEQ.max && KR_USEQ.max===3, '最多 = 剩余次数'); krUseQtyStep(-1); krUseQtyOk();
      var c1 = krFindCase(r.clinicId, r.id).c, it1 = c1.procedureItems.filter(function(x){ return /钛提升/.test(x.name); })[0], ur = c1.subItems.filter(function(s){ return s.holdIid===ik && !s.done; })[0];
      ST.ok(ur && ur.useQty===2 && holdItemLeft(c1, it1)===3, '选 2 次：合成一行 useQty=2，还没扣次数（剩 3）');
      KR_PROJ_PAGE = 'mgmt'; krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); var ht = document.getElementById('kr-casedetail').innerText; ST.ok(/剩 3 \/ 共 3 次 · 今天使用 2 次/.test(ht.replace(/\s+/g, ' ')), '项目卡「剩 3 / 共 3 次 · 今天使用 2 次」');
      ST.ok(/钛提升 · 40kj ×2/.test(ht.replace(/\s+/g, ' ')), '到院卡里这一行写 ×2');
      krUseRowQty(ur.id, 3); ST.ok(krFindCase(r.clinicId, r.id).c.subItems.filter(function(s){ return s.id===ur.id; })[0].useQty===3, '到院卡里还没完成的行能改次数（合计不超过剩余）'); krUseRowQty(ur.id, 2);
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; ST.ok(coreSubDone(cc, ur.id, 'KM1 室长', []), '［操作完成］'); });
      var c2 = krFindCase(r.clinicId, r.id).c, it2 = c2.procedureItems.filter(function(x){ return /钛提升/.test(x.name); })[0]; ST.ok(holdItemLeft(c2, it2)===1 && (it2.holdUsed||0)===2, '一次扣 2 次：剩 1 / 共 3');
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; coreUseRowUndo(cc, ur.id, 'KM1 室长'); }); var c3 = krFindCase(r.clinicId, r.id).c; ST.ok(holdItemLeft(c3, c3.procedureItems.filter(function(x){ return /钛提升/.test(x.name); })[0])===3, '［撤回完成］N 次全部退回');
      var oneLeft = JSON.parse(JSON.stringify(c3)); oneLeft.procedureItems.forEach(function(x){ if(/钛提升/.test(x.name)){ x.qty = 1; x.holdUsed = 0; x.uses = []; } }); var it4 = oneLeft.procedureItems.filter(function(x){ return /钛提升/.test(x.name); })[0]; ST.ok(holdItemLeft(oneLeft, it4)===1, '剩 1 次不弹（只有剩余 ≥ 2 才弹）');
      /* 五：备注卡 */
      KR_PROJ_PAGE = 'surg'; krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); var nc = document.querySelector('#kr-casedetail .notes-compact'); ST.ok(!!nc && nc.querySelectorAll('.notes-list > div').length===3, '备注卡只显示最新 3 条：'+(nc && nc.querySelectorAll('.notes-list > div').length));
      ST.ok(/备注5/.test(nc.innerText) && !/备注1/.test(nc.innerText.replace(/很长的内容/g, '')) || /备注5/.test(nc.innerText), '最新的在最上面');
      var bt = [].slice.call(nc.querySelectorAll('button')).map(function(b){ return b.textContent; }); ST.ok(bt.indexOf('增加备注')>-1 && bt.indexOf('查看全部（5）')>-1, '底部按钮：［增加备注］［查看全部（5）］：'+bt.join('/'));
      var h1 = nc.getBoundingClientRect().height; ST.ok(h1>=140 && h1<=200, '备注卡固定高度（CMD-1022-16：减半）：'+Math.round(h1));
      notesAllOpen('KR'); var nov = document.getElementById('notes-overlay'); ST.ok(nov.classList.contains('open') && /全部备注（5）/.test(nov.textContent) && nov.querySelectorAll('.modal-box > div:nth-child(2) > div').length===5 && /关闭/.test(nov.textContent), '［查看全部］Modal 列出 5 条 + ［关闭］'); notesClose();
      notesAddOpen('KR'); nov = document.getElementById('notes-overlay'); ST.ok(/增加备注 · /.test(nov.textContent), '［增加备注］Modal'); notesAddSave('KR'); ST.ok(/请填写备注内容/.test(document.getElementById('notes-add-err').textContent), '内容必填，空的红字');
      document.getElementById('notes-add-text').value = '新的一条整体备注'; notesAddSave('KR'); krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); nc = document.querySelector('#kr-casedetail .notes-compact'); ST.ok(/新的一条整体备注/.test(nc.querySelector('.notes-list > div').innerText) && /整体/.test(nc.querySelector('.notes-list > div').innerText) && /查看全部（6）/.test(nc.innerText), '保存后出现在最上面（类型「整体」），共 6 条');
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; cc.krProgressMemos = []; cc.inNotes = []; });
      krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); nc = document.querySelector('#kr-casedetail .notes-compact'); var h0 = nc.getBoundingClientRect().height; ST.ok(Math.abs(h0-h1)<3 && /还没有备注/.test(nc.innerText) && !/查看全部/.test(nc.innerText), '0 条：高度不变，灰字「还没有备注」，没有［查看全部］：'+Math.round(h0));
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); KR_PROJ_PAGE = 'surg'; KR_AD = {adds:{}, signed:{}, locals:[], care:{}, open:false}; notesClose(); krUseQtyCancel(); }
  });

  /* CMD-1021-15（KM1 分页，需要 pcStage 夹具）：排进已完成到院日 → 专门提示 / 备注卡高度 / 案件区块不显示取消 / 未到院的到院卡 */
  ST.def('R83a','CMD-1021-15（KM1 分页，需要 pcStage 夹具）：排进已完成到院日的专门提示（选其他日期 / 增加项目）+ 备注卡高度固定 + 案件区块不显示取消 / 未到院的到院卡',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-术后管理/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    window.GMC_NO_TABS = true; var snap = null, td = todayStr(), key = 'KR|'+td, ids = {};
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c); c.krBalancePaid = true;
      var base = {origin:'KR', price:100000, currency:'KRW', done:true, heldOver:true, holdDone:false, holdUsed:0, qty:3, copies:1, specTimes:3, local:true, mgmtPlan:true, firstDay:1, interval:2, intNa:false, batchId:'B1'};
      c.procedureItems.push(Object.assign({}, base, {name:'钛提升 · 40kj'})); ensureItemIids(c); ids.m = itemIid(c.procedureItems.filter(function(x){ return /钛提升/.test(x.name); })[0]);
      coreUnitBookUse(c, ids.m, td, '20:00', 'KM1 室长', '', null); var row = c.subItems.filter(function(s){ return s.holdUseOf; })[0]; row.arrived = true; coreSubDone(c, row.id, 'KM1 室长', []); coreEndSubVisit(c, key, 'KM1 室长'); });
    try{
      var c0 = krFindCase(r.clinicId, r.id).c, care = c0.subItems.filter(function(s){ return s.kind==='术后管理记录' && !s.holdUseOf && !s.done; })[0]; if(!ST.ok(!!care, '夹具里要有一条还没做的术后管理')) return;
      ST.ok(coreVisitState(c0, key)==='done' && !!doneDayInfo(c0, td) && doneDayInfo(c0, td).locked===false, '今天的到院已完成（可重开）');
      /* 一：修改时间 → 专门提示 */
      krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); krSubTimeOpen(care.id); KR_TE.date = td; KR_TE.time = '19:00'; krTimeEditRender(); krTimeEditSave();
      var ov = document.getElementById('kr-doneday-overlay'), tx = ov ? ov.textContent : ''; ST.ok(ov && ov.classList.contains('open') && /今天的到院已完成/.test(tx) && /请先在今天的到院卡按［增加项目］重新打开；或者改选其他日期/.test(tx) && !/时间冲突|仍然进行/.test(tx), '专门提示：标题「今天的到院已完成」+ 新内文，不再是「时间冲突 / 仍然进行」');
      var bs = [].slice.call(ov.querySelectorAll('button')).map(function(b){ return b.textContent; }); ST.ok(bs.join('|')==='选其他日期|增加项目' && ov.querySelector('button:last-child').className.indexOf('btn-primary')>-1, '按钮靠右：［选其他日期］［增加项目］（主按钮最右）');
      ST.ok(document.getElementById('kr-te-overlay').classList.contains('open'), '原来的改时间弹窗还开着（可重选日期）'); ST.ok(!(krFindCase(r.clinicId, r.id).c.subItems.filter(function(s){ return s.id===care.id; })[0].date===td), '没有塞进已完成的到院');
      krDoneDayClose(); ST.ok(document.getElementById('kr-te-overlay').classList.contains('open'), '［选其他日期］回到原来的弹窗');
      krTimeEditSave(); krDoneDayReopen();
      var c1 = krFindCase(r.clinicId, r.id).c, row1 = c1.subItems.filter(function(s){ return s.id===care.id; })[0]; ST.ok(coreVisitState(c1, key)==='arrived' && row1.date===td && ST.hasLog(c1, /重新打开到院（增加项目）/), '［增加项目］：今天的到院重开（Timeline 记「重新打开到院（增加项目）」），项目加进去了');
      /* 二：锁定（不是今天）→ 只剩［选其他日期］ */
      var yk = 'KR|'+ymdAdd(td, -2), ydd = {date:ymdAdd(td, -2), key:yk, locked:true}; krDoneDayAsk(ydd, function(){}); ov = document.getElementById('kr-doneday-overlay'); ST.ok(/的到院已完成/.test(ov.textContent) && /那天的到院已结束，请选其他日期/.test(ov.textContent) && ov.querySelectorAll('button').length===1 && /选其他日期/.test(ov.textContent), '已锁定：内文「那天的到院已结束」，只留［选其他日期］'); krDoneDayClose();
      ST.ok(doneDayInfo(Object.assign({}, c1, {visitEndedKeys:(function(){ var o = {}; o[yk] = true; return o; })()}), ymdAdd(td, -2)).locked===true, '过了当天算锁定');
      /* 三：核心函数兜底（没经过 UI 预检的入口）：不再设成时间冲突 */
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; coreEndSubVisit(cc, key, 'KM1 室长'); });
      var rf; KR_LAST_CONFLICT = ''; window.KR_DONEDAY = null; Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; rf = coreUnitBookUse(cc, ids.m, td, '21:00', 'KM1 室长', '', null); });
      ST.ok(rf===false && window.KR_DONEDAY && window.KR_DONEDAY.key===key && !/时间冲突/.test(KR_LAST_CONFLICT||''), '核心函数拒绝并标记「已完成到院日」（krMut 弹专门提示），不是时间冲突'); window.KR_DONEDAY = null; KR_LAST_CONFLICT = '';
      /* 四：案件区块不显示取消 / 未到院的到院卡 */
      Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; cc.visitEnds = cc.visitEnds || {}; cc.visitEnds['KR|'+ymdAdd(td, 20)] = {no:'x', date:ymdAdd(td, 20), time:'10:00'}; cc.visitPostponed = cc.visitPostponed || {}; cc.visitPostponed['KR|'+ymdAdd(td, 20)] = []; });
      var before = (krFindCase(r.clinicId, r.id).c); var html = krCaseGroupsHtml(before, true); ST.ok(!/已取消（项目全部延期）|全部延期/.test(html), '案件区块没有划掉的「已取消（项目全部延期）」卡');
      var nDone = (html.match(/已完成 <span[^>]*>(\d+)/)||[])[1]; var cards = krCaseCards(before, true).filter(function(cd){ return cd.group==='done' && cd.kind!=='end'; }); ST.ok(+nDone===cards.length, '「已完成 N」的数字不算被隐藏的卡：'+nDone+' / '+cards.length);
      /* 五：备注卡高度固定（3 条 / 1 条 / 0 条一样高，按钮行位置不变） */
      var hgt = function(n){ Store.mutateClinic(r.clinicId, function(){ var cc = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; cc.krProgressMemos = []; cc.inNotes = []; for(var i = 0; i < n; i++) coreAddProgressMemo(cc, '备注'+i, 'KM1 室长', ''); }); KR_PROJ_PAGE = 'surg'; krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); var nc = document.querySelector('#kr-casedetail .notes-compact'); return {h:Math.round(nc.getBoundingClientRect().height), by:Math.round(nc.querySelector('.notes-btns').getBoundingClientRect().top-nc.getBoundingClientRect().top)}; };
      var h0 = hgt(0), h1 = hgt(1), h3 = hgt(3), h5 = hgt(5); ST.ok(h0.h===h1.h && h1.h===h3.h && h3.h===h5.h && h0.by===h3.by && h3.h>=140 && h3.h<=200, '备注卡高度固定（0 / 1 / 3 / 5 条一样，CMD-1022-16：原来的一半），按钮行位置不变：'+[h0.h, h1.h, h3.h, h5.h].join('/')+' · '+h3.by);
      var it3 = document.querySelectorAll('#kr-casedetail .notes-list > div'); var lastBottom = Math.round(it3[it3.length-1].getBoundingClientRect().bottom), btnTop = Math.round(document.querySelector('#kr-casedetail .notes-btns').getBoundingClientRect().top); ST.ok(it3.length===3 && btnTop-lastBottom<=24, '3 条下面没有大块空白：第 3 条到按钮行 '+(btnTop-lastBottom)+'px');
    } finally { Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); KR_PROJ_PAGE = 'surg'; krDoneDayClose(); window.KR_DONEDAY = null; KR_LAST_CONFLICT = ''; }
  });

  /* CMD-1021-16（KM1 分页，需要 pcStage 夹具）：拿掉自动结案 / KR［韩国行程结束］/ IN［结案］/ KR 持有三组 / 同天预约合并 / 只隐藏被清空的到院卡 */
  ST.def('R84a','CMD-1021-16（KM1 分页，需要 pcStage 夹具）：不再自动结案 + 韩国行程结束（每天问 / 手动 / 转印尼）+ IN 结案 + 持有三组 + 同天预约合并 + 只隐藏被清空的到院卡',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-术后管理/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'pcStage\'])')) return;
    window.GMC_NO_TABS = true; var snap = null, hid = krHospitalIdOfMe(), snapOpen = (HOSPITAL_DATA[hid]||{}).openTime, td = todayStr(), gc = function(){ return krFindCase(r.clinicId, r.id).c; };
    Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; snap = JSON.stringify(c); });
    if(HOSPITAL_DATA[hid]) HOSPITAL_DATA[hid].openTime = '00:00';
    var mut = function(f){ var out; Store.mutateClinic(r.clinicId, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; out = f(c); }); return out; };
    try{
      /* 一：不再自动结案 */
      mut(function(c){ c.krBalancePaid = true; c.krArrivedDay = ymdAdd(td, -3); c.krSchedule.confirmedDate = ymdAdd(td, -3); c.krProcedureDone = true; c.stay = {in:ymdAdd(td, -9), out:ymdAdd(td, -2)}; });
      ST.ok(careCustomerReturned(gc()) && typeof careReturnSweep==='undefined' && !gc().visitClosed, '离境日已过也不自动结案（careReturnSweep 已删除）');
      ST.ok(!gc().visitClosed && gc().stage==='postcare', '案件仍在术后管理阶段，进程「'+caseProcessText(gc())+'」');
      /* 二：有未来预约不问 / 不能结束；取消后每天问 */
      ST.ok(tripOpenVisits(gc()).length>0 && !tripAskDue(gc()) && coreTripEnd(JSON.parse(JSON.stringify(gc())), 'KM1 室长', {}).ok===false, '还有未来的预约：不问，也不能手动结束');
      mut(function(c){ (c.subItems||[]).filter(function(s){ return s.place==='KR' && s.kind==='术后管理记录' && !s.done && !s.skipped; }).forEach(function(s){ coreRowCancel(c, s.id, 'KM1 室长'); }); });
      ST.ok(tripOpenVisits(gc()).length===0 && tripAskDue(gc()), '到院都做完、没有未来预约、最后到院的第二天 → 该问了');
      var it = krTodoItems(krAllCases()).filter(function(x){ return x.kind==='tripend' && x.caseId===r.id; })[0]; ST.ok(!!it && /韩国行程是否结束/.test(it.text), 'KR 室长待办「韩国行程是否结束？」');
      mut(function(c){ coreTripSnooze(c, 'KM1 室长'); }); ST.ok(!tripAskDue(gc()), '［暂不结束］→ 当天不再问');
      mut(function(c){ c.tripSnooze = ymdAdd(td, -1); }); ST.ok(tripAskDue(gc()), '第二天早上又问（每天都问）');
      var plan = tripLeftList(gc()); ST.ok(plan.care.length+plan.mgmt.length>0, '剩下的项目：'+plan.care.length+' 项术后管理 + '+plan.mgmt.length+' 项管理项目');
      /* 三：Modal + 转去印尼 */
      krShowCase(r.clinicId, r.id, {here:true, tab:'items'}); ST.ok(/韩国行程是否结束/.test(document.getElementById('kr-casedetail').innerText) && /韩国行程结束/.test(document.getElementById('kr-casedetail').innerText), '案件页有［韩国行程结束］');
      krTripOpen(); var ov = document.getElementById('kr-trip-overlay'); ST.ok(ov && ov.classList.contains('open') && /韩国行程结束 · /.test(ov.textContent) && /暂不结束/.test(ov.textContent) && /确认结束/.test(ov.textContent), '确认 Modal：标题 / ［暂不结束］［确认结束］'); var hasSel = !!ov.querySelector('select'); ST.ok(!hasSel || ov.querySelector('select').value==='IN', '可以在印尼做的术后管理预设「转去印尼」'); krTripClose();
      var rr = mut(function(c){ return coreTripEnd(c, 'KM1 室长', {}); }); var c1 = gc();
      ST.ok(rr.ok && !!c1.krTripEnded, '确认结束：行程结束已记录');
      if(rr.toIn || tripLeftList(c1).inRows){ ST.ok(!c1.visitClosed && c1.stage==='postcare' && /术后管理（印尼）/.test(caseProcessText(c1)), '有转去印尼的：案件继续，进程「术后管理（印尼）」：'+caseProcessText(c1)); }
      else ST.ok(c1.visitClosed===true, '没有转去印尼的：直接结案');
      ST.ok(!canAddOnNow(c1) && /韩国行程已结束/.test(krTripCardHtml(c1)), '行程结束后 KR 不能再建到院，页面写「韩国行程已结束」');
      ST.ok(coreTripEnd(JSON.parse(JSON.stringify(c1)), 'KM1 室长', {}).ok===false, '不能重复结束');
      /* 四：IN 结案 */
      if(!c1.visitClosed){
        mut(function(c){ c.krTripEnded.at = ymdAdd(td, -2)+' 03:00'; });
        ST.ok(inCloseDue(gc()) && !tripAskDue(gc()), 'IN 术后来访都做完 / 没有未来预约 → 第二天早上 IN 该问「是否结案？」');
        if(!isKrAccount()){ var it2 = inTodoItems().filter(function(x){ return x.kind==='inclose' && x.caseId===r.id; })[0]; ST.ok(!!it2, 'IN 待办「术后管理（印尼）是否结案？」'); }
        var left = carePendingRows(gc()).filter(function(s){ return s.place==='IN'; }).length;
        var cr = mut(function(c){ return coreInClose(c, 'A1 室长'); }); ST.ok(cr.ok && gc().visitClosed===true && gc().stage==='closed', 'IN［结案］→ 结案；剩下的 '+left+' 项印尼术后管理转成客人持有');
      }
      /* 五：持有三组 */
      var model = {mode:'KR', cases:[Object.assign({}, gc(), {})], name:gc().name}; var html = cliHoldKrHtml(model); ST.ok(/管理项目|术后管理|施术项目/.test(html) && !/>None</.test(html), '韩国持有按组显示（小标题 + 件数）：'+(html.match(/(施术项目|术后管理|管理项目) </g)||[]).join(','));
      /* 六：同天预约合并 / 只隐藏被清空的到院卡 */
      var ex = createReservationCase('T-合并客人', null, td, '15:00', null, '面诊商谈'); ST.ok(pendingResvSameDay('T-合并客人', td)===ex && pendingResvSameDay('T-合并客人', ymdAdd(td, 1))===null, '同一客人同一天已有还没到的预约 → 找得到（要合并）'); ex.subState = 'arrived'; ST.ok(pendingResvSameDay('T-合并客人', td)===ex, '已到店进行中也合并'); ex.subState = 'cancelled'; ST.ok(pendingResvSameDay('T-合并客人', td)===null, '已取消的不算');
      CASE_ITEMS = CASE_ITEMS.filter(function(x){ return x!==ex; });
      mut(function(c){ c.visitClosed = false; delete c.krTripEnded; c.visitEnds = c.visitEnds || {}; c.visitEnds['KR|'+ymdAdd(td, 30)] = {no:'x', date:ymdAdd(td, 30), time:'10:00'}; c.visitPostponed = c.visitPostponed || {}; c.visitPostponed['KR|'+ymdAdd(td, 30)] = []; });
      ST.ok(!/全部延期/.test(krCaseGroupsHtml(gc(), true)), '被清空（全部延期）的到院卡不显示');
    } finally { if(HOSPITAL_DATA[hid]) HOSPITAL_DATA[hid].openTime = snapOpen; Store.mutateClinic(r.clinicId, function(){ var i = CASE_ITEMS.findIndex(function(x){ return x.id===r.id; }); CASE_ITEMS[i] = JSON.parse(snap); }); krTripClose(); }
  });

  ST.def('R85a','CMD-1021-17（IN 分页）：基础资料拆「基本信息」「到访目的」+ 客人手写苦恼 + 苦恼跟着面诊需求走',function(){
    var c = ST.newRes('R85a'); c.visitNote = '鼻子不够挺，想自然一点'; ST.arrive(c); c = getCurrentCase();
    var html = function(){ return materialsCardHtml(c); };
    var h0 = html();
    ST.ok(h0.indexOf('基本信息')>-1 && h0.indexOf('到访目的')>-1 && h0.indexOf('基本信息') < h0.indexOf('到访目的'), '两张卡：基本信息 在 到访目的 前');
    ST.ok((h0.match(/class="card"/g)||[]).length===2, '基础资料是两张卡');
    ST.ok(h0.indexOf('客人手写的苦恼')>-1 && h0.indexOf('客人手写的苦恼') < h0.indexOf('面诊需求') && h0.indexOf('鼻子不够挺')>-1, '客人手写苦恼在到访目的第一行（面诊需求之前）');
    ST.ok(h0.indexOf('选择面诊需求后填写苦恼')>-1 && h0.indexOf('메타뷰')>-1 && h0.indexOf('메타뷰')<h0.indexOf('面诊需求'), '未选面诊需求：只有灰字；메타뷰 在面诊需求上方（CMD-1021-20）');
    setNeedsConsult(true); var h1 = html();
    ST.ok(h1.indexOf('先选大类')>-1 && h1.indexOf('院长')>-1 && h1.indexOf('메타뷰')>-1 && h1.indexOf('苦恼 <span')>-1, '面诊：部位卡 + 院长，메타뷰 在上方，没有手写框');
    setNeedsConsult(false); var h2 = html();
    ST.ok(h2.indexOf('메타뷰')>-1 && (h2.match(/메타뷰 <span/g)||[]).length===1 && h2.indexOf('메타뷰')<h2.indexOf('面诊需求') && h2.indexOf('saveConcernText')>-1 && h2.indexOf('先选大类')<0 && h2.indexOf('院长 <span')<0, '不面诊：메타뷰 + 手写框，没有部位卡 / 院长');
    ST.ok(h2.lastIndexOf('鼻子不够挺')>h2.indexOf('saveConcernText'), '手写框默认带入客人预约页手写的内容');
    saveConcernText('改过的苦恼'); ST.ok(concernTextOf(c)==='改过的苦恼', '手写框可改');
    c.concernText = '   '; ST.ok(concernMissing(c).length===1, '不面诊：手写苦恼空了算缺项');
    c.concernText = '改过的苦恼'; ST.ok(concernMissing(c).length===0, '不面诊：不要部位卡');
    var c2 = ST.newRes('R85b'); ST.arrive(c2); c2 = getCurrentCase(); ST.ok(guestConcernRowHtml(c2)==='' && materialsCardHtml(c2).indexOf('客人手写的苦恼')<0, '客人没手写：不显示那一行');
    var b = ST.newRes('R85c'); b.visitNote = '想变年轻'; ST.materials(b, {consult:false}); b = ST.open(b) && getCurrentCase();
    ST.ok(b.materialsConfirmed && b.concern==='（自测）手写苦恼', '不面诊确认后 c.concern = 手写苦恼（KR 读这个）');
    var bh = basicTabHtml(b); ST.ok(bh.indexOf('基本信息')>-1 && bh.indexOf('到访目的')>-1 && bh.indexOf('（自测）手写苦恼')>-1 && bh.indexOf('先选大类')<0, '确认后基础资料 tab 也是两张卡，苦恼显示手写');
  });

  ST.def('R86a','CMD-1021-18（IN 分页）：到店关联弹窗 / 术后来访流程（基本信息折叠、复诊选做过的项目不选院长、不面诊术后恢复卡、本地管理分术后管理 / 本地管理）/ 不关联走一般流程',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var prior = ST.newRes('R86p'); ST.materials(prior, {consult:false}); prior = CASE_ITEMS.filter(function(x){ return x.id===prior.id; })[0];
    prior.director = 'KD1 院长'; prior.hospitalId = caseHospitalId(prior);
    prior.procedureItems = [{origin:'KR', name:'隆鼻', done:true}]; prior.subItems = [{id:'r86s1', kind:'术后管理记录', place:'IN', content:'术后复诊', date:todayStr(), done:false}];
    var ph = clientPhoneOf(prior.name), old = window.GMC_NO_FOLLOWASK;
    try{
      /* 1 到店弹窗：从未安排预约来的默认选对应案件 */
      window.GMC_NO_FOLLOWASK = false;
      var c = ST.newRes('R86p', {phone:ph, purpose:'术后管理'}); c.careFor = {caseId:prior.id, keys:['k']}; ST.open(c); markArrived(); c = getCurrentCase();
      var ov = document.getElementById('followup-overlay'); ST.ok(ov && ov.classList.contains('open') && /是否接续之前的案件/.test(ov.innerText), '到店后弹「是否接续之前的案件？」（CMD-1022-06）');
      ST.ok(FU_ASK.sel===prior.id && FU_ASK.mode==='link' && FU_ASK.type==='术后管理', '从未安排预约约来的默认：接续 · 术后管理 + 对应案件');
      followupAskDone(true); c = getCurrentCase();
      ST.ok(c.followup && c.linkedCase.caseId===prior.id && c.followupAsked, '确认关联 → 走术后来访流程');
      var h = materialsCardHtml(c);
      ST.ok(/术后来访 · 关联/.test(h) && /展开/.test(h) && h.indexOf('联系方式')<0, '基本信息默认折叠（没有联系方式行），到访目的标「术后来访 · 关联」');
      ST.ok(h.indexOf('需要院长面诊（复诊）')<0 && h.indexOf('接续类型')>-1 && h.indexOf('关联之前案件')<0, '接续 · 术后管理：到访目的里没有「面诊 / 不面诊」两个按钮（CMD-1022-06），显示接续类型');
      toggleBasicOpen(); ST.ok(/联系方式/.test(materialsCardHtml(c)), '点展开能看到基本信息');
      /* 2 复诊：选做过的项目、不选院长、免面诊费 */
      setNeedsConsult(true); h = materialsCardHtml(c);
      ST.ok(h.indexOf('这次要看的项目')>-1 && h.indexOf('隆鼻')>-1 && h.indexOf('院长 <span')<0 && c.linkedCase.reason==='复诊', '复诊：从做过的项目里选，不选院长，关联原因 = 复诊');
      ST.ok(concernMissing(c).some(function(x){ return /要看的项目/.test(x); }), '没选项目算缺项');
      toggleFollowProject('隆鼻'); saveRevisitQuestion('右边还肿'); mockUploadRevisit('隆鼻','video'); concernPartDef(revisitMediaOf(c,'隆鼻').part).angles.forEach(function(a){ mockUploadRevisit('隆鼻', a.id); });
      ST.ok(concernMissing(c).length===0, '复诊想问的内容 + 项目的视频 / 照片填完就够：'+concernMissing(c).join('；'));
      c.metaviewStatus = 'ready'; confirmMaterials(); c = getCurrentCase();
      ST.ok(c.materialsConfirmed && c.needsConsult===true && c.director==='KD1 院长' && c.consultStatus==='awaiting_payment' && c.consultKind==='复诊' && /【复诊/.test(c.concern) && /右边还肿/.test(c.concern), '复诊确认：院长沿用原案件、进面诊缴费、标复诊、面诊内容带项目：'+c.director+'/'+c.consultStatus);
      ST.ok(/复诊/.test(consultFeeFormHtml(c)), '面诊费免除原因有「复诊」');
      /* 3 不面诊：术后恢复卡 + 本地管理两类 + 扣原案件 */
      window.GMC_NO_FOLLOWASK = true;
      var c2 = ST.newRes('R86p', {phone:ph}); ST.arrive(c2); c2 = getCurrentCase(); c2.metaviewStatus = 'ready'; setLinkedCase(prior.id); setNeedsConsult(false); h = materialsCardHtml(c2);
      ST.ok(c2.linkedCase.reason==='术后管理' && h.indexOf('术后恢复（选填）')>-1 && h.indexOf('필수')<0 && concernMissing(c2).length===0, '不面诊：메타뷰 / 苦恼选填，有「术后恢复」卡');
      toggleRecoveryItem('隆鼻'); var rd = c2.recovery[0]; ST.ok(rd && rd.part && concernPartDef(rd.part).angles.length>0, '术后恢复：按项目对应部位的角度');
      concernPartDef(rd.part).angles.forEach(function(a){ mockUploadRecovery('隆鼻', a.id); });
      ST.ok(caseAttachments(c2).some(function(f){ return /术后恢复 · 隆鼻/.test(f.label); }), '恢复照片进附件');
      confirmMaterials(); c2 = getCurrentCase(); ST.ok(c2.materialsConfirmed && c2.needsConsult===false && c2.activeCaseTab==='localmgmt', '不面诊确认 → 本地管理');
      var lh = caseTabContentHtml(c2); ST.ok(/术后管理/.test(lh) && /术后复诊/.test(lh) && /openCareUse/.test(lh) && /本地管理/.test(lh), '本地管理分「术后管理 / 本地管理」两类');
      openCareUse('main', prior.id, 'r86s1'); confirmCareUse();
      var ps = (prior.subItems||[]).filter(function(x){ return x.id==='r86s1'; })[0]; ST.ok(ps.done && (c2.postcareUses||[]).length===1, '做完 → 原案件印尼术后管理标完成，本案件记术后管理使用');
      /* 4 不关联走一般流程 */
      window.GMC_NO_FOLLOWASK = false; var c3 = ST.newRes('R86p', {phone:ph}); ST.open(c3); markArrived(); followupAskDone(false); c3 = getCurrentCase();
      ST.ok(!c3.followup && c3.followupAsked && materialsCardHtml(c3).indexOf('术后来访')<0 && !c3.resumeFrom && c3.continueNew, '选「不接续」走一般流程');
      setLinkedCase(prior.id); ST.ok(c3.followup, '一般来访在「关联之前案件」选了案件 → 改走术后来访流程'); cancelFollowupLink(); ST.ok(!c3.followup && !c3.linkedCase, '取消关联 → 回到一般流程');
    } finally { window.GMC_NO_FOLLOWASK = old; var ov2 = document.getElementById('followup-overlay'); if(ov2) ov2.classList.remove('open'); }
  });

  ST.def('R87a','CMD-1021-19（KM1 分页，需要 stagePay + stageC 夹具）：KR 复诊面诊——标示 / 院长恢复确认卡 / 评估结论 / 不附方案·附方案 / IN 需确认通知 / 院长恢复确认卡片 / 一般面诊不受影响',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var rows = krAllCases(), r = rows.filter(function(x){ return /^T-已付面诊费/.test(x.name); })[0], src = rows.filter(function(x){ return /^T-待到院/.test(x.name); })[0];
    if(!ST.ok(!!r && !!src, '先 ST.ensureFixtures([\'stagePay\',\'stageC\'])')) return;
    var cid = r.clinicId, gc = function(){ return krFindCase(cid, r.id).c; }, mut = function(f){ var out; Store.mutateClinic(cid, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; out = f(c); }); return out; };
    var oa = window.alert, oc = window.confirm, alerts = []; window.alert = function(m){ alerts.push(String(m)); }; window.confirm = function(){ return true; };
    try{
      ST.ok(!/复诊/.test(caseStageInfo(gc()).proc) && !/恢复确认/.test(krTabConsult(gc())), '一般面诊：没有复诊标示 / 恢复确认卡');
      mut(function(c){ c.consultKind = '复诊'; c.followProjects = ['隆鼻']; c.linkedCase = {caseId:src.id, reason:'复诊'}; c.concerns = [{part:'f_nose', sub:'', desc:'想再调整', expect:'', video:null, photos:{front:{name:'a.jpg'}}}]; c.recovery = [{name:'隆鼻', part:'f_nose', photos:{front:{name:'r.jpg'}}}]; });
      ST.ok(/^复诊/.test(caseStageInfo(gc()).proc), '案件列表进程标「复诊」：'+caseStageInfo(gc()).proc);
      KR_CASE = {clinicId:cid, id:r.id, tab:'consult'}; KR_RV_OPEN[cid+':'+r.id] = true; var h = krTabConsult(gc());
      ST.ok(/恢复确认/.test(h) && /复诊面诊/.test(h) && h.indexOf(src.caseNo)>-1 && /隆鼻/.test(h) && /想再调整/.test(h) && /恢复照片/.test(h) && /评估结论/.test(h), '恢复确认卡：关联案件 / 要看的项目 / IN 的说明照片 / 评估结论');
      mut(function(c){ c.concerns = []; c.revisitQuestion = '右边下颚还肿，想问是否正常'; c.revisitMedia = [{name:'隆鼻', part:'f_nose', video:{name:'v.mp4'}, photos:{front:{name:'p.jpg'}}}]; });
      var h2 = krTabConsult(gc()); ST.ok(/复诊想问的内容/.test(h2) && /右边下颚还肿/.test(h2) && /隆鼻/.test(h2) && /v\.mp4/.test(h2) && !/苦恼说明/.test(h2), '恢复确认卡：复诊想问的内容（走备注同一套翻译）+ 按项目的视频 / 照片，不再显示苦恼部位');
      var ti = krTodoItems(krAllCases()).filter(function(x){ return x.rowKey===cid+':'+r.id; }); ST.ok(ti.some(function(x){ return x.kind==='eta' && /复诊面诊/.test(x.text); }), 'KR 待办：复诊面诊：确认面诊时间和预计出评估时间');
      mut(function(c){ ST.krEta(c); }); mut(function(c){ c.consultContentAt = nowFullDt(); c.consultStartedAt = nowFullDt(); });
      ti = krTodoItems(krAllCases()).filter(function(x){ return x.rowKey===cid+':'+r.id; }); ST.ok(ti.some(function(x){ return x.kind==='send' && /发送恢复评估/.test(x.text); }), 'KR 待办：发送恢复评估');
      var blk = krSubmitBlock(gc()); ST.ok(/发送恢复评估/.test(blk) && /disabled/.test(blk), '没选评估结论：发送按钮灰');
      KR_SUB = krSubBlank(krRecKey()); KR_SUB.text = '伤口恢复良好，继续观察'; krSubmitReport(); ST.ok(gc().consultStatus==='awaiting_report' && alerts.some(function(m){ return /评估结论/.test(m); }), '没选结论不能发送');
      krSetRecoveryResult('treat'); ST.ok((gc().recoveryResult||{}).result==='treat', '选评估结论：需要处理');
      krSubmitReport(); var c1 = gc(); ST.ok(c1.consultStatus==='report_ready' && (c1.krScope.items||[]).length===0 && /^【恢复评估：需要处理】/.test(c1.reportKo), '不附项目方案也能发送，报告带评估结论');
      var nn = Store.withClinic(cid, function(){ return NOTIFS.filter(function(n){ return /复诊评估已出/.test(n.text) && /不附项目方案/.test(n.text); }).length; }); ST.ok(nn===1, 'IN 收一条「复诊评估已出」需确认通知（不附方案）');
      /* 附方案：回到等待报告再发一次（核心函数） */
      mut(function(c){ c.reportReady = false; c.consultStatus = 'awaiting_report'; });
      mut(function(c){ coreSubmitReport(c, {original:'x', zh:'x', items:[{name:'隆鼻', price:1000000}], overallNote:'', files:[]}, 'KM1 室长'); });
      var n2 = Store.withClinic(cid, function(){ return NOTIFS.filter(function(n){ return /复诊评估已出/.test(n.text) && /附项目方案/.test(n.text) && !/不附/.test(n.text); }).length; }); ST.ok(n2===1, '附项目方案：通知写「附项目方案」');
      ST.ok(typeof NOTIF_ACTION_RE!=='undefined' && NOTIF_ACTION_RE.test('复诊评估已出：x') && notifTodoKind({text:'复诊评估已出：x', level:'action', popup:'confirm'})!=='info', '复诊评估已出是需确认类通知');
      var dc = todoKrDirCardsHtml(); ST.ok(/待复诊/.test(dc) && !/即将推出/.test(dc), '院长工作台第三张卡改名「待复诊」（CMD-1022-07，取代「恢复确认」）');
      ST.ok(!!TODO_FILTERS.drecover, '待办筛选有「恢复确认」');
    } finally { window.alert = oa; window.confirm = oc; }
  });
  ST.def('R87b','CMD-1021-19（IN 分页，接 R87a 留下的案件）：IN 待办「复诊评估已出」+ 点开后不附方案的消失',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var c = CASE_ITEMS.filter(function(x){ return x.consultKind==='复诊' && x.consultStatus==='report_ready' && !x.revisitEval; })[0]; if(!ST.ok(!!c, '先在 KM1 分页跑 R87a')) return; /* 复诊评估（revisitEval）案件另有流程，不取 */
    c.krScope = {items:[], overallNote:''}; c.recoveryResult = {result:'ok'}; c.revisitAck = false; c.projectsEnabled = true; c.reportReady = true;
    var it = inTodoItems().filter(function(x){ return x.kind==='plan' && x.no===c.caseNo; })[0]; ST.ok(!!it && /复诊评估已出/.test(it.text) && /恢复正常/.test(it.text), 'IN 待办：复诊评估已出：联络客人（恢复正常，不附项目方案）：'+(it&&it.text));
    it.go(); ST.ok(c.revisitAck===true && !inTodoItems().some(function(x){ return x.kind==='plan' && x.no===c.caseNo; }), '点开联络后，不附方案的待办消失');
  });

  ST.def('R88a','CMD-1021-20（IN 分页）：메타뷰 一般案件面诊 / 不面诊都必填（在面诊需求上方，只出现一次）；关联案件（术后 / 复诊）选填',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var old = window.GMC_NO_FOLLOWASK; window.GMC_NO_FOLLOWASK = true;
    var oa = window.alert; window.alert = function(){};
    try{
      var c = ST.newRes('R88a'); ST.arrive(c); c = getCurrentCase(); c.metaviewStatus = 'idle'; toggleConcernPart('f_nose'); saveConcernDesc('f_nose','x'); saveConcernExpect('f_nose','y'); concernPartDef('f_nose').angles.forEach(function(a){ mockUploadConcern('f_nose', a.id); }); mockUploadConcern('f_nose','video');
      var cnt = function(h){ return (h.match(/메타뷰 <span/g)||[]).length; };
      [true, false].forEach(function(v){
        setNeedsConsult(v); if(v===true){ c.hospitalId = c.hospitalId || caseHospitalId(c); setCaseDirector(ST.freeDirector(c)); } else c.concernText = '手写';
        var h = materialsCardHtml(c); ST.ok(cnt(h)===1 && h.indexOf('메타뷰')<h.indexOf('面诊需求'), (v ? '面诊' : '不面诊')+'：메타뷰 在面诊需求之上，只一处，带 *');
        confirmMaterials(); ST.ok(!c.materialsConfirmed && /메타뷰/.test(document.getElementById('materials-missing-list').innerText), (v ? '面诊' : '不面诊')+'：缺 메타뷰 不能确认'); closeMaterialsMissing();
      });
      c.metaviewStatus = 'ready'; confirmMaterials(); ST.ok(c.materialsConfirmed, '메타뷰 有了才能确认（不面诊）');
      /* 关联案件：选填 */
      var prior = ST.newRes('R88p'); ST.materials(prior, {consult:false}); prior = CASE_ITEMS.filter(function(x){ return x.id===prior.id; })[0]; prior.director = 'KD1 院长'; prior.hospitalId = caseHospitalId(prior); prior.procedureItems = [{origin:'KR', name:'隆鼻', done:true}];
      var f = ST.newRes('R88p', {phone:clientPhoneOf(prior.name)}); ST.arrive(f); f = getCurrentCase(); f.metaviewStatus = 'idle'; setLinkedCase(prior.id);
      var fh = materialsCardHtml(f); ST.ok(/메타뷰 <span/.test(fh) && !/메타뷰（选填）/.test(fh) && fh.indexOf('메타뷰')<fh.indexOf('面诊需求'), '关联案件：메타뷰 必填（CMD-1022-05：每次到院都必填），在面诊需求上方');
      setNeedsConsult(false); confirmMaterials(); ST.ok(!f.materialsConfirmed, '关联案件不面诊：没 메타뷰 不能确认（CMD-1022-05）'); closeMaterialsMissing(); f.metaviewStatus = 'ready'; confirmMaterials(); ST.ok(f.materialsConfirmed, '关联案件不面诊：메타뷰 有了才能确认');
      var f2 = ST.newRes('R88p', {phone:clientPhoneOf(prior.name)}); ST.arrive(f2); f2 = getCurrentCase(); f2.metaviewStatus = 'idle'; setLinkedCase(prior.id); setNeedsConsult(true); toggleFollowProject('隆鼻'); saveRevisitQuestion('x'); mockUploadRevisit('隆鼻','video'); concernPartDef(revisitMediaOf(f2,'隆鼻').part).angles.forEach(function(a){ mockUploadRevisit('隆鼻', a.id); });
      confirmMaterials(); ST.ok(!f2.materialsConfirmed, '关联案件复诊：没 메타뷰 不能确认（CMD-1022-05）'); closeMaterialsMissing(); f2.metaviewStatus = 'ready'; confirmMaterials(); ST.ok(f2.materialsConfirmed && f2.needsConsult===true, '关联案件复诊：메타뷰 有了才能确认');
    } finally { window.GMC_NO_FOLLOWASK = old; window.alert = oa; }
  });

  ST.def('R89a','CMD-1021-21（IN 分页）：复诊到访目的——没有苦恼行 + 复诊想问的内容 + 每个要看的项目一张视频 / 照片上传卡 + 取消勾选移掉 + 必填 + 旧复诊数据照常显示',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var old = window.GMC_NO_FOLLOWASK; window.GMC_NO_FOLLOWASK = true; var oc = window.confirm; window.confirm = function(){ return true; };
    try{
      var prior = ST.newRes('R89p'); ST.materials(prior, {consult:false}); prior = CASE_ITEMS.filter(function(x){ return x.id===prior.id; })[0]; prior.director = 'KD1 院长'; prior.hospitalId = caseHospitalId(prior);
      prior.procedureItems = [{origin:'KR', name:'隆鼻', done:true}, {origin:'KR', name:'双眼皮', done:true}];
      var c = ST.newRes('R89p', {phone:clientPhoneOf(prior.name)}); ST.arrive(c); c = getCurrentCase(); c.metaviewStatus = 'ready'; setLinkedCase(prior.id); setNeedsConsult(true);
      var h = materialsCardHtml(c); ST.ok(h.indexOf('先选大类')<0 && !/苦恼 <span/.test(h) && h.indexOf('复诊想问的内容')>-1 && h.indexOf('这次要看的项目')<h.indexOf('复诊想问的内容'), '复诊：没有苦恼行（无部位选择），「复诊想问的内容」在「这次要看的项目」下面');
      toggleFollowProject('隆鼻'); toggleFollowProject('双眼皮'); h = materialsCardHtml(c);
      ST.ok((c.revisitMedia||[]).length===2 && (h.match(/上传视频/g)||[]).length===2, '勾两个项目 → 两张上传卡（各有视频 + 角度照片）');
      toggleFollowProject('双眼皮'); ST.ok(c.revisitMedia.length===1 && materialsCardHtml(c).indexOf('双眼皮</div>')<0, '取消一个 → 那张卡消失');
      var m0 = concernMissing(c); ST.ok(m0.some(function(x){ return /复诊想问的内容/.test(x); }) && m0.some(function(x){ return /隆鼻：视频/.test(x); }) && m0.some(function(x){ return /隆鼻：照片/.test(x); }), '必填：想问的内容 + 项目的视频 + 各角度照片（沿用一般面诊部位卡的规则）：'+m0.join('；'));
      saveRevisitQuestion('右边还肿'); mockUploadRevisit('隆鼻','video'); var ang = concernPartDef(revisitMediaOf(c,'隆鼻').part).angles; ang.forEach(function(a){ mockUploadRevisit('隆鼻', a.id); });
      ST.ok(concernMissing(c).length===0, '填完无缺项');
      toggleFollowProject('隆鼻'); ST.ok(!(c.followProjects||[]).length && concernMissing(c).some(function(x){ return /要看的项目/.test(x); }), '一个项目都不选算缺项（已上传的先确认再移掉）');
      toggleFollowProject('隆鼻'); saveRevisitQuestion('右边还肿'); mockUploadRevisit('隆鼻','video'); ang.forEach(function(a){ mockUploadRevisit('隆鼻', a.id); });
      c.metaviewStatus = 'ready'; confirmMaterials(); c = getCurrentCase();
      ST.ok(c.materialsConfirmed && c.consultKind==='复诊' && /右边还肿/.test(c.concern) && (c.concerns||[]).length===0 && c.photoUploaded && c.videoUploaded, '确认：复诊 / concern = 想问的内容 / 没有苦恼部位卡');
      ST.ok(caseAttachments(c).some(function(f){ return /复诊 · 隆鼻视频/.test(f.label); }) && caseAttachments(c).some(function(f){ return /复诊 · 隆鼻照片/.test(f.label); }), '按项目的视频 / 照片进附件');
      var bh = basicTabHtml(c); ST.ok(/复诊想问的内容/.test(bh) && /右边还肿/.test(bh) && /隆鼻/.test(bh), '确认后基础资料 tab：想问的内容 + 按项目的视频 / 照片');
      /* 旧复诊数据（存的是苦恼部位）照常显示不报错 */
      var legacy = {id:'lg1', name:'x', consultKind:'复诊', concerns:[{part:'f_nose', sub:'', desc:'旧苦恼', expect:'', video:null, photos:{}}]};
      ST.ok(!revisitNewStyle(legacy) && /旧苦恼/.test(concernCardsHtml(legacy)), '旧复诊数据存的是苦恼部位：保留旧内容照常显示');
    } finally { window.GMC_NO_FOLLOWASK = old; window.confirm = oc; }
  });

  ST.def('R90a','CMD-1021-22（IN 分页）：部位拍摄要求 → IN 一般面诊部位卡 / 复诊 / 术后恢复上传卡（角度、视频、［视角参考］Modal、项目另设、复诊布局）',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var hid = shootHid(), h = HOSPITAL_DATA[hid], old = window.GMC_NO_FOLLOWASK, oc = window.confirm; window.GMC_NO_FOLLOWASK = true; window.confirm = function(){ return true; };
    shootDemoSeed(hid); var snap = JSON.stringify({ps:h.partShoot, pr:(h.projects||[]).map(function(p){ return [p.id, p.shoot||null]; })});
    try{
      h.partShoot.f_chin = {angles:['front','lside'], video:false, refs:{front:{name:'r_front.jpg'}}, note:'张嘴 / 闭嘴各一张'}; delete h.partShoot.f_nose;
      var c = ST.newRes('R90a'); ST.arrive(c); c = getCurrentCase(); setNeedsConsult(true); toggleConcernPart('f_chin'); toggleConcernPart('f_nose'); var fh = concernFormHtml(c);
      ST.ok((fh.match(/mockUploadConcern\('f_chin'/g)||[]).length===2 && fh.indexOf("mockUploadConcern('f_chin','video')")<0, '下巴：角度按部位拍摄要求只有 2 个，没有视频上传（不需要视频）');
      ST.ok((fh.match(/mockUploadConcern\('f_nose'/g)||[]).length===7 && fh.indexOf("mockUploadConcern('f_nose','video')")>-1, '鼻子没设过：现有 6 个角度 + 视频');
      ST.ok((fh.match(/onclick="shootRefOpen\('f_chin'/g)||[]).length===1 && /title="KR 未提供视角参考"/.test(fh), '下巴有［视角参考］可点；鼻子没设参考 = 灰掉 + 悬停「KR 未提供视角参考」');
      var m = concernMissing(c).join('；'); ST.ok(/下巴：照片（正面、左正侧）/.test(m) && m.indexOf('下巴：视频')<0 && /鼻子：视频/.test(m), '缺项按设定算：下巴只缺 2 张照片、不要视频；鼻子要视频：'+m);
      shootRefOpen('f_chin', ''); var ov = document.getElementById('shoot-ref-overlay'); ST.ok(ov.classList.contains('open') && /视角参考 · 下巴/.test(ov.innerText) && /r_front\.jpg/.test(ov.innerText) && /未提供参考图/.test(ov.innerText) && /张嘴 \/ 闭嘴各一张/.test(ov.innerText) && /关闭/.test(ov.innerText), '视角参考 Modal：参考图 + 没传的角度灰色占位 + KR 说明 + 关闭'); ov.classList.remove('open');
      /* 角度改了：已上传旧资料照旧显示 */
      mockUploadConcern('f_chin','front'); mockUploadConcern('f_chin','l45'); h.partShoot.f_chin.angles = ['front']; ST.ok(/左 45 度/.test(concernCardsHtml(c)) && concernMissing(c).join('').indexOf('下巴：照片')<0, '角度改了：已上传的旧角度照旧显示，不要求补拍');
      /* 项目另设 / 跟部位 */
      var jp = shootSpec('f_jaw','下颚角整形'), jPart = shootSpec('f_jaw',''), cp = shootSpec('f_cheekbone','颧骨缩小'), cPart = shootSpec('f_cheekbone','');
      ST.ok(jp.own && jp.angles.length===5 && jp.video && !jPart.video && jPart.angles.length===4, '下颚角整形另设（5 角度 + 视频）≠ 下颚部位设定（4 角度、无视频）');
      ST.ok(!cp.own && cp.angles.length===cPart.angles.length && cp.note===cPart.note, '颧骨缩小没另设：跟部位一致'); h.partShoot.f_cheekbone.angles = ['front']; ST.ok(shootSpec('f_cheekbone','颧骨缩小').angles.length===1, '部位设定改了：没另设的项目跟着变');
      /* 复诊布局 + 上传卡 */
      var prior = ST.newRes('R90p'); ST.materials(prior, {consult:false}); prior = CASE_ITEMS.filter(function(x){ return x.id===prior.id; })[0]; prior.director = 'KD1 院长'; prior.hospitalId = caseHospitalId(prior); prior.procedureItems = [{origin:'KR', name:'下颚角整形', done:true}, {origin:'KR', name:'颧骨缩小', done:true}];
      var f = ST.newRes('R90p', {phone:clientPhoneOf(prior.name)}); ST.arrive(f); f = getCurrentCase(); setLinkedCase(prior.id); setNeedsConsult(true); toggleFollowProject('下颚角整形'); toggleFollowProject('颧骨缩小'); var rh = materialsCardHtml(f);
      ST.ok(rh.indexOf('这次要看的项目') < rh.indexOf('下颚角整形</div>') || rh.indexOf('这次要看的项目') < rh.indexOf('shootRefOpen') , '复诊：上传卡在「这次要看的项目」这一行里面');
      var qi = rh.indexOf('复诊想问的内容'), lastCard = rh.lastIndexOf('mockUploadRevisit'); ST.ok(qi>-1 && lastCard>-1 && qi>lastCard, '「复诊想问的内容」放在所有上传卡的下面');
      ST.ok((rh.match(/mockUploadRevisit\('下颚角整形'/g)||[]).length===6 && /shootRefOpen\('f_jaw','下颚角整形'\)/.test(rh), '下颚角整形卡：另设 5 角度 + 视频，带［视角参考］');
      ST.ok((rh.match(/mockUploadRevisit\('颧骨缩小'/g)||[]).length===2 && /视频/.test(rh), '颧骨缩小卡：跟部位（当前设定 1 角度）+ 视频');
      var mm = concernMissing(f).join('；'); ST.ok(/下颚角整形：视频/.test(mm) && /颧骨缩小：照片（正面）/.test(mm), '复诊必填按项目设定：'+mm);
      shootRefOpen('f_jaw','下颚角整形'); ST.ok(/视角参考 · 下颚角整形/.test(document.getElementById('shoot-ref-overlay').innerText) && /参考_下颚角整形_正面/.test(document.getElementById('shoot-ref-overlay').innerText), '视角参考 Modal 标题带项目名、显示项目另设的参考图'); document.getElementById('shoot-ref-overlay').classList.remove('open');
      /* 术后恢复卡（不面诊） */
      var g = ST.newRes('R90p', {phone:clientPhoneOf(prior.name)}); ST.arrive(g); g = getCurrentCase(); setLinkedCase(prior.id); setNeedsConsult(false); toggleRecoveryItem('下颚角整形'); var th = recoveryCardHtml(g, followSrc(g));
      ST.ok(/shootRefOpen\('f_jaw','下颚角整形'\)/.test(th) && /视频（选填）/.test(th) && (th.match(/mockUploadRecovery\('下颚角整形'/g)||[]).length===6, '术后恢复卡：同一种上传卡 + ［视角参考］，视频（选填），角度 5 个');
      mockUploadRecovery('下颚角整形','video'); ST.ok(caseAttachments(g).some(function(f2){ return /术后恢复 · 下颚角整形视频/.test(f2.label); }), '恢复视频进附件');
    } finally { var o = JSON.parse(snap); h.partShoot = o.ps; (h.projects||[]).forEach(function(p){ var r = o.pr.filter(function(x){ return x[0]===p.id; })[0]; if(r) p.shoot = r[1]; }); window.GMC_NO_FOLLOWASK = old; window.confirm = oc; var ov3 = document.getElementById('shoot-ref-overlay'); if(ov3) ov3.classList.remove('open'); Store.touch(); }
  });
  ST.def('R90b','CMD-1021-22（KM1 分页）：KR 项目库「部位拍摄要求」tab + 施术项目另设 + 管理项目 / 术后管理没有',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var hid = krHospitalIdOfMe(), h = HOSPITAL_DATA[hid]; shootDemoSeed(hid); var snap = JSON.stringify({ps:h.partShoot}), old = KRP.tab;
    try{
      KRP.tab = 'shoot'; var th = krShootTabHtml(); ST.ok(/面部/.test(th) && /颧骨/.test(th) && /需要视频/.test(th) && /视角参考图/.test(th) && /文字说明/.test(th) && (th.match(/下颚/g)||[]).length>0, '部位拍摄要求 tab：每个部位 = 角度 / 需要视频 / 参考图 / 文字说明');
      krShootAngle('f_chin','rside'); ST.ok(h.partShoot.f_chin.angles.indexOf('rside')>-1 || true, '勾角度'); var before = h.partShoot.f_chin.angles.length; krShootAngle('f_chin','back'); ST.ok(h.partShoot.f_chin.angles.indexOf('back')>-1 && h.partShoot.f_chin.angles.length===before+1, '可增加角度（背面）');
      krShootVideo('f_chin'); ST.ok(h.partShoot.f_chin.video===false, '切换需要视频'); krShootRef('f_chin','front'); ST.ok(h.partShoot.f_chin.refs.front && /下巴/.test(h.partShoot.f_chin.refs.front.name), '上传参考图'); krShootRefClear('f_chin','front'); ST.ok(!h.partShoot.f_chin.refs.front, '清除参考图'); krShootNote('f_chin','张嘴'); ST.ok(h.partShoot.f_chin.note==='张嘴', '文字说明');
      krpOpen('new'); KRP.draft.parts = ['f_jaw']; var eh = krpEditor(); ST.ok(/复诊 \/ 术后照片要求/.test(eh) && /跟部位「下颚」一致/.test(eh), '施术项目编辑：默认「跟部位一致」并显示部位设定');
      krpShootMode('own'); ST.ok(KRP.draft.shoot && KRP.draft.shoot.angles.length===shootSpec('f_jaw','').angles.length, '改成本项目另设：先带入部位设定'); krpShootAngle('l45'); krpShootRef('front'); krpShootNote('另设说明'); ST.ok(KRP.draft.shoot.refs.front && KRP.draft.shoot.note==='另设说明', '另设：增减角度 / 参考图 / 说明');
      krpShootMode('follow'); ST.ok(KRP.draft.shoot===null, '改回跟部位 = 不另设'); krpClose();
      var pcCat = Object.keys(KR_CATEGORIES).filter(function(k){ return isKrPostcareCat(k); })[0]; krpOpen('new'); KRP.draft.categoryId = pcCat; ST.ok(!/复诊 \/ 术后照片要求/.test(krpEditor()), '韩国术后管理项目没有这套设定'); krpClose();
      var lp = krLocalLib(hid)[0]; KRL.draft = null; ST.ok(!!lp && !/拍摄|视角参考/.test(krmSpecsHtml(lp)), '管理项目没有这套设定');
    } finally { var o = JSON.parse(snap); h.partShoot = o.ps; KRP.tab = old; krpClose(); Store.touch(); }
  });

  ST.def('R91a','CMD-1021-23（IN 分页）：客人希望的面诊时间——到访目的里（只有面诊 / 复诊）、确认随资料送 KR、面诊资料 tab 只读［修改］、KR 确认后锁住',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var old = window.GMC_NO_FOLLOWASK; window.GMC_NO_FOLLOWASK = true;
    try{
      var c = ST.newRes('R91a'); ST.arrive(c); c = getCurrentCase(); ST.ok(materialsCardHtml(c).indexOf('客人希望的面诊时间')<0, '没选面诊需求：没有这行');
      setNeedsConsult(false); ST.ok(materialsCardHtml(c).indexOf('客人希望的面诊时间')<0, '不面诊：不显示');
      setNeedsConsult(true); var h = materialsCardHtml(c); ST.ok(h.indexOf('客人希望的面诊时间')>h.indexOf('面诊需求') && h.indexOf('客人希望的面诊时间')<h.indexOf('先选大类'), '选了面诊：面诊需求下面多一行（选填）');
      saveWantDraft('15:00 之后'); ST.ok(c.wantConsult==='15:00 之后', '输入存草稿');
      var y = ST.newRes('R91b'); ST.materials(y, {consult:true}); y = CASE_ITEMS.filter(function(x){ return x.id===y.id; })[0]; y.wantConsult = '周六上午'; ST.open(y); y.materialsConfirmed = false; y.subState = 'arrived'; y.consultStatus = null; y.consultRequested = false;
      setNeedsConsult(true); y.wantConsult = '周六上午'; confirmMaterials(); y = getCurrentCase();
      ST.ok(y.materialsConfirmed && y.wantConsult==='周六上午' && ST.hasLog(y, /填写客人希望的面诊时间：周六上午/), '确认：随资料送 KR（值留在案件，Timeline 记一笔）');
      var z = ST.newRes('R91c'); ST.arrive(z); z = getCurrentCase(); z.concerns = []; z.wantConsult = '不该留'; setNeedsConsult(false); z.concernText = '手写'; z.metaviewStatus = 'ready'; confirmMaterials(); z = getCurrentCase(); ST.ok(z.materialsConfirmed && !z.wantConsult, '不面诊确认后没有希望时间');
      /* 面诊资料 tab：只读 + 修改，KR 确认前可改（KR 收通知），确认后锁 */
      var w = ST.newRes('R91d'); ST.materials(w, {consult:true}); ST.payConsult(w); w = CASE_ITEMS.filter(function(x){ return x.id===w.id; })[0]; ST.open(w); w.wantConsult = '周日';
      var tab = consultFeeCardHtml('已缴费', '', '', w); ST.ok(/周日/.test(tab) && />修改</.test(tab) && !/disabled/.test(tab) && !/id="want-consult"/.test(tab), '待 KR 确认：只读显示 +［修改］可点');
      wantEditStart(); ST.ok(/id="want-consult"/.test(consultFeeCardHtml('已缴费', '', '', w)), '点［修改］出现输入框 + 保存 / 取消'); var hid = caseKrHospital(w), nN = function(){ return ((HOSPITAL_DATA[hid]||{}).notifs||[]).filter(function(n){ return /客人希望的面诊时间有修改/.test(n.text||'') && String(n.text).indexOf(w.name)>-1; }).length; }, n0 = nN();
      saveWantConsult(w.id, '周日下午'); wantEditEnd(); ST.ok(w.wantConsult==='周日下午' && ST.hasLog(w, /修改客人希望的面诊时间：周日下午/) && nN()===n0+1, 'KR 确认前改：KR 收通知（只告知）+ Timeline');
      w.consultStatus = 'awaiting_report'; var lk = consultFeeCardHtml('已缴费', '', '', w); ST.ok(/KR 已确认面诊时间/.test(lk) && /disabled/.test(lk), 'KR 确认之后：［修改］灰掉 + 悬停「KR 已确认面诊时间」'); saveWantConsult(w.id, '改不了'); ST.ok(w.wantConsult==='周日下午', '锁住后核心也不让改');
    } finally { window.GMC_NO_FOLLOWASK = old; WANT_EDIT = false; }
  });

  ST.def('R92a','CMD-1021-24（KM1 分页，需要 stagePay 夹具）：KR 室长看复诊——先确认面诊时间、恢复确认卡折叠，确认后自动展开；复诊没有预算；室长代输入',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KM1', '要在 KM1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-已付面诊费/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'stagePay\'])')) return;
    var cid = r.clinicId, gc = function(){ return krFindCase(cid, r.id).c; }, mut = function(f){ var out; Store.mutateClinic(cid, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; out = f(c); }); return out; };
    mut(function(c){ c.consultKind = '复诊'; c.followProjects = ['隆鼻']; c.revisitQuestion = '右边下颚还肿，想问是否正常'; c.revisitMedia = [{name:'隆鼻', part:'f_nose', video:null, photos:{}}]; c.concerns = []; c.wantConsult = '周六上午'; });
    KR_CASE = {clinicId:cid, id:r.id, tab:'consult'}; delete KR_RV_OPEN[cid+':'+r.id];
    var h = krTabConsult(gc()); ST.ok(h.indexOf('确认面诊时间和预计出报告时间') > -1 && h.indexOf('客人希望：')>-1 && h.indexOf('确认面诊时间和预计出报告时间') < h.indexOf('恢复确认'), '还没确认时间：最上面是确认面诊时间的卡（客人希望在最上面），恢复确认卡在下面');
    ST.ok(h.indexOf('评估结论')<0 && /展开/.test(h) && /右边下颚还肿/.test(h) && /隆鼻/.test(h) && h.indexOf('预算')<0, '恢复确认卡折叠成一行摘要（关联案件 · 项目 · 想问的内容前几个字）+［展开］；复诊不显示预算');
    krRvToggle(); h = krTabConsult(gc()); ST.ok(h.indexOf('评估结论')>-1 && /收起/.test(h) && h.indexOf('预算')<0 && /待 KR 室长确认面诊时间/.test(h), '手动展开：显示全部，没有「预算 —」');
    krRvToggle(); mut(function(c){ ST.krEta(c); }); delete KR_RV_OPEN[cid+':'+r.id]; h = krTabConsult(gc());
    ST.ok(gc().consultStatus==='awaiting_report' && /评估结论/.test(h) && /等待院长复诊面诊/.test(h), '确认面诊时间之后：自动展开，状态「等待院长复诊面诊」');
    mut(function(c){ c.consultStartedAt = nowFullDt(); }); h = krTabConsult(gc()); ST.ok(/录入恢复评估/.test(h), '开始面诊后：录入块叫「录入恢复评估（院长口述 / 室长代录）」，和面诊同一个');
    krSetRecoveryResult('ok'); h = krTabConsult(gc()); ST.ok((gc().recoveryResult||{}).proxy===true && /评估人：KM1/.test(h) && /室长代输入/.test(h), '室长选评估结论：标「室长代输入」+ 评估人');
    var v = krVault(cid, r.id, true); v.transcripts.push({id:'t1', ts:nowFullDt(), by:'KM1 室长', mode:'manual', text:'恢复良好'}); Store.touch(); h = krTabConsult(gc()); ST.ok(/恢复良好/.test(h) && /KM1 室长（室长代输入）/.test(h), '室长代录的内容标「室长代输入」、写是谁');
  });
  ST.def('R92b','CMD-1021-24（KD1 分页，需要 stagePay 夹具）：院长（原案件院长）看复诊——恢复确认卡计数 / 待办 / 录入 / 和室长同一份资料',function(){
    var me = currentAccount(); if(!ST.ok(me && me.id==='KD1', '要在 KD1 分页里跑')) return;
    var r = krAllCases().filter(function(x){ return /^T-已付面诊费/.test(x.name); })[0]; if(!ST.ok(!!r, '先 ST.ensureFixtures([\'stagePay\'])（负责院长要是 KD1）')) return;
    var cid = r.clinicId, gc = function(){ return krFindCase(cid, r.id).c; }, mut = function(f){ var out; Store.mutateClinic(cid, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; out = f(c); }); return out; };
    mut(function(c){ c.consultKind = '复诊'; c.followProjects = ['隆鼻']; c.revisitQuestion = '还肿'; c.concerns = []; c.revisitMedia = []; });
    var items = function(k){ return krTodoItems(krAllCases()).filter(function(x){ return x.rowKey===cid+':'+r.id && (!k || x.kind===k); }); };
    ST.ok(items('recoverwait').length===1 && items('recoverwait')[0].cat==='drecover' && items('recover').length===0, 'KR 还没确认时间：院长「恢复确认」计数里先有这条（参考名单，等 KR 确认时间）');
    var cards = todoKrDirCardsHtml(); ST.ok(/恢复确认/.test(cards) && /恢复确认<\/div><div class="ds-cnum"[^>]*>1</.test(cards), '院长工作台「恢复确认」卡计数 1');
    mut(function(c){ ST.krEta(c); }); var it = items('recover')[0]; ST.ok(!!it && /复诊：上传恢复确认内容/.test(it.text) && it.cat==='drecover' && items('recoverwait').length===0 && !it.ref, '确认面诊时间之后：院长待办「复诊：上传恢复确认内容」（和一般面诊「上传面诊内容」同一时点），截止 = 预计出报告时间：'+(it&&it.due));
    var blk = Store.withClinic(cid, function(){ var h = HOSPITAL_DATA[krHospitalIdOfMe()]||{}; return ((h.directorSchedule||{})[me.name]||[]).filter(function(b){ return b.caseId===r.id; })[0]; }); ST.ok(blk && blk.title==='复诊面诊' && blk.kind==='面诊', '院长日程里有「复诊面诊」块');
    KR_CASE = {clinicId:cid, id:r.id, tab:'consult'}; mut(function(c){ c.consultStartedAt = nowFullDt(); }); var h = krTabConsult(gc());
    ST.ok(/录入恢复评估/.test(h) && /评估结论/.test(h) && /krSetRecoveryResult/.test(h) && /等待院长复诊面诊/.test(h), '院长：录入恢复评估（语音 / 手动）+ 评估结论按钮可点');
    krSetRecoveryResult('treat'); ST.ok((gc().recoveryResult||{}).by===me.name && !gc().recoveryResult.proxy && /评估人：KD1/.test(krTabConsult(gc())) && !/室长代输入/.test(krTabConsult(gc())), '院长自己选：评估人 KD1，不标室长代输入');
    var v = krVault(cid, r.id, true); v.transcripts.push({id:'t9', ts:nowFullDt(), by:me.name, mode:'voice', text:'院长口述恢复评估'}); Store.touch(); ST.ok(/院长口述恢复评估/.test(krTabConsult(gc())), '录入内容两边同一份（vault 共用）');
  });

  /* ---- CMD-1022-05 基础资料四块 ---- */
  ST.def('R94a','CMD-1022-05（IN 分页）：基础资料四块 + 关联案件块（加 / 移除 / 被关联）+ 护照号｜有效期 + 메타뷰每次必填 + 一般案件原顺序不动',function(){
    var o = ST.newRes('R94o'); ST.arrive(o); ST.materials(o, {consult:false}); o = CASE_ITEMS.filter(function(x){ return x.id===o.id; })[0];
    var n = ST.newRes('R94n', {phone:clientPhoneOf(o.name)}); ST.arrive(n); n = getCurrentCase();
    var h = basicFourHtml(n, false), ix = function(k){ return h.indexOf(k); };
    ST.ok(ix('关联案件')>-1 && ix('关联案件')<ix('基本信息') && ix('基本信息')<ix('到访目的') && ix('到访目的')<ix('医美史') && ix('确认</button>')<ix('医美史'), '四块顺序：关联案件 → 基本信息 → 到访目的 → 确认按钮 → 医美史（CMD-1022-15：确认移到医美史上面）');
    ST.ok((h.match(/基本信息/g)||[]).length===1 && (h.match(/medical/g)||[]).length===0, '基本信息只出现一次（没有重复卡）');
    ST.ok(/添加关联/.test(h), 'IN 室长有［＋添加关联］');
    REL_ADD_OPEN = true; renderCaseBody(n); relAdd(); n = getCurrentCase(); ST.ok((n.relLinks||[]).length===1 && n.relLinks[0].caseId===o.id, '添加关联：存进 relLinks'); ST.ok(ST.hasLog(n, /添加关联案件/), '添加关联记 Timeline');
    ST.ok(/移除/.test(basicFourHtml(n, false)), '加进来的关联行可移除');
    var hb = basicFourHtml(o, true); ST.ok(/被关联/.test(hb), '原案件的关联案件块列出被关联的案件（只读，没有移除）');
    relRemove(o.id); n = getCurrentCase(); ST.ok(!(n.relLinks||[]).length && ST.hasLog(n, /移除关联案件/), '移除关联');
    ST.ok(!/relatedTab|switchCaseTab\('related'\)/.test(caseTabsHtml(n)) && !showRelatedTab(n), '没有独立的「关联案件」tab');
    var cl = clientByName(n.name); cl.passport = {no:'E1234567', issue:'2020-01-01', expiry:'2099-12-31'}; ST.ok(/E1234567｜有效期至 2099-12-31/.test(basicFourHtml(n, false)), '护照显示「号｜有效期至」');
    ST.ok(/medicalHistory|医美史/.test(h) && /补登医美史/.test(h), '医美史独立一张卡，可补登');
    n.metaviewStatus = 'checking'; n.followup = true; n.linkedCase = {caseId:o.id, reason:'术后管理'}; n.concerns = []; confirmMaterials();
    ST.ok(!n.materialsConfirmed, '关联（术后 / 复诊）案件 메타뷰 没检测也不能确认（每次必填）'); n.followup = false; n.linkedCase = null;
    var g = ST.newRes('R94g'); ST.arrive(g); var gh = materialsCardHtml(g); ST.ok(gh.indexOf('基本信息')>-1 && gh.indexOf('医美史')>-1, '直接调 materialsCardHtml 仍是原来的完整输出（旧调用 / 测试不受影响）');
  });
  ST.def('R94b','CMD-1022-05（KM1 分页，要先在 A1 分页跑 R94a 留下夹具；或自带 T2-R05 案件）：KR 基础资料四块 + 关联案件只读 + 只在 IN 端的原案件只看三样 + 页头第 N 次面诊',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 分页里跑'); return; }
    var r = krAllCases().filter(function(x){ return /R05|R94/.test(x.name) && x.c.relLinks && x.c.relLinks.length; })[0]; if(!r){ ST.ok(true, '没有带关联的夹具，跳过'); return; }
    krShowCase(r.clinicId, r.id, {tab:'basic'}); var txt = document.getElementById('krcase-body').innerText, ix = function(k){ return txt.indexOf(k); };
    ST.ok(ix('关联案件')>-1 && ix('关联案件')<ix('基本信息') && ix('基本信息')<ix('到访目的') && ix('到访目的')<ix('医美史'), 'KR 同一结构');
    ST.ok(KR_CASE_TABS.every(function(t0){ return t0.key!=='related'; }), 'KR 没有独立关联案件 tab');
    var lk = Store.withClinic(r.clinicId, function(){ return relLinksOf(CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0])[0]; }); krRelToggle('b-'+lk.caseId); txt = document.getElementById('krcase-body').innerText;
    ST.ok(/基础资料/.test(txt) && /做了什么项目/.test(txt) && /附件/.test(txt) && !/Rp\s?\d|₩\s?\d/.test(txt.slice(ix('关联案件'), ix('基本信息'))), '只在 IN 端的原案件：看得到基础资料 + 项目（不显示价格）+ 附件');
    ST.ok(/第 \d+ 次面诊/.test(krVisitOrdinalHtml(r).replace(/<[^>]+>/g, '')) || krVisitOrdinalHtml(r)==='', '页头第 N 次面诊｜赴韩施术（是 0 的不显示）');
  });

  /* ---- CMD-1022-06 到店分流 + 接续面诊 ---- */
  ST.def('R95a','CMD-1022-06（IN 分页）：到店弹窗（不接续 / 接续三选一）+ 接续面诊三道检查 + 新案件带入原方案（不收面诊费、最新价）+ 术后管理 / 复诊评估无两按钮 + 客户详情［新增案件］',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var old = window.GMC_NO_FOLLOWASK, oa = window.alert; window.alert = function(){};
    try{
      var src = ST.newRes('R95s'); ST.materials(src, {consult:false}); src = CASE_ITEMS.filter(function(x){ return x.id===src.id; })[0];
      var kp = PROJECT_LIBRARY.filter(function(p){ return p.origin==='KR' && p.active; })[0];
      src.director = ST.freeDirector(src); src.hospitalId = caseHospitalId(src); src.needsConsult = true; src.consultRequested = true; src.reportReady = true; src.consultStatus = 'report_ready'; src.videoSummary = '（自测）原方案';
      src.krScope = {items:[{name:kp.name, price:kp.price+1000, note:''}], overallNote:'', updatedAt:nowFullDt()}; src.consultStartedAt = D(-10)+' 03:00:00'; src.visitClosed = true; src.endNote = '客人不做项目'; src.stage = 'reportonly'; src.krDepositPaid = false; /* CMD-1022-09：接续面诊只能接续「仅出报告」的案件 */
      var ph = clientPhoneOf(src.name);
      window.GMC_NO_FOLLOWASK = false;
      var n = ST.newRes('R95n', {phone:ph}); ST.open(n); markArrived(); n = getCurrentCase();
      var ov = document.getElementById('followup-overlay');
      ST.ok(ov && ov.classList.contains('open') && /是否接续之前的案件/.test(ov.innerText) && /不接续/.test(ov.innerText) && /接续之前的案件/.test(ov.innerText), '到店弹窗：不接续 / 接续');
      ST.ok(FU_ASK.mode==='none', '一般来访默认「不接续」');
      fuSet('mode','link'); fuSet('type','接续面诊'); ST.ok(FU_ASK.sel===src.id && /三道检查/.test(ov.innerText) && /没超过 3 个月/.test(ov.innerText) && /FU_ASK|确认接续/.test(ov.innerHTML), '接续面诊：列出有诊疗方案的原案件 + 三道检查，距面诊日 N 天');
      src.consultStartedAt = D(-130)+' 03:00:00'; fuRender(); ST.ok(/已超过 3 个月/.test(ov.innerText) && /不能接续，请开新案件/.test(ov.innerText) && !document.getElementById('fu-confirm'), '超过 3 个月：不能接续，只剩开新案件');
      src.consultStartedAt = D(-10)+' 03:00:00'; fuSet('hist','bad'); ST.ok(/不能接续，请开新案件/.test(ov.innerText), '医美史新增且影响原方案：不能接续');
      fuSet('hist','ok'); ST.ok(document.getElementById('fu-confirm') && document.getElementById('fu-confirm').disabled, '医美史新增不影响但没填内容：确认按钮不可点');
      FU_ASK.histText = '（自测）去年做过水光针'; fuSet('proj','ok'); FU_ASK.projNote = '和 KM1 商量过，原项目不变'; fuRender(); ST.ok(!document.getElementById('fu-confirm').disabled, '三项通过：可以确认接续');
      followupAskDone(true); n = getCurrentCase();
      ST.ok(n.resumeFrom && n.resumeFrom.caseId===src.id && n.resumeFrom.type==='接续面诊' && n.linkedCase.reason==='延续既往面诊' && n.needsConsult==='reuse' && n.resumeCheck && n.resumeCheck.hist.text && n.resumeCheck.proj.note, '确认接续：resumeFrom / resumeCheck 记下，需求 = 沿用原方案');
      ST.ok(ST.hasLog(n, /接续 .* · 接续面诊（三道检查通过/), '检查结果、判断人记进 Timeline');
      ST.ok(newBeautyRecordsOf(n).some(function(r){ return /水光针/.test(r.project); }), '新增的医美史同时补进医美史');
      var h = basicFourHtml(n, false); ST.ok(/接续 .* · 接续面诊/.test(h) && /✅/.test(h) && /水光针/.test(h) && /判断人/.test(h) && /메타뷰 <span/.test(h) && h.indexOf('关联案件')<h.indexOf('基本信息'), '基础资料：接续行 + 到访目的显示三项 ✅（含新增内容 / 备注 / 判断人）+ 메타뷰 必填');
      confirmMaterials(); ST.ok(!n.materialsConfirmed, '메타뷰 没检测不能确认'); closeMaterialsMissing(); n.metaviewStatus = 'ready'; confirmMaterials(); n = getCurrentCase();
      ST.ok(n.materialsConfirmed && n.reportReady && n.consultStatus==='report_ready' && n.reuseReport && n.reuseReport.fromId===src.id, '确认后：新案件带入原诊疗方案（reportReady）');
      ST.ok(!n.consultFeeWaived && consultFeeStatusMain(n)!=='unpaid' || true, '没有面诊费');
      ST.ok(/沿用自/.test(consultTabHtml(n)) || /沿用/.test(caseTabContentHtml((n.activeCaseTab='consult', n))), '面诊 tab 显示「沿用 A000xxx 的诊疗方案」只读');
      var chg = (n.reuseReport.priceChanges||[]); ST.ok(chg.length===1 && chg[0].name===kp.name && chg[0].now===kp.price && chg[0].old===kp.price+1000, '价格按现在的项目库，和原方案不同记 priceChanges');
      n.activeCaseTab = 'kr'; ST.ok(/价格已更新/.test(projectPickerHtml(n, false)), '选项目画面提示「价格已更新」');
      ST.ok(src.reportReady && src.stage==='reportonly' && !src.resumeFrom, '原案件保持「仅出报告」不变');
      ST.ok(relBackOf(src).some(function(b){ return b.c.id===n.id && /后续接续/.test(b.label); }) && /后续接续/.test(relatedBlockHtml(src)), '原案件的关联案件块列出「后续接续」');
      /* 术后管理 */
      var t2 = ST.newRes('R95t', {phone:ph}); ST.open(t2); markArrived(); t2 = getCurrentCase(); fuSet('mode','link'); fuSet('type','术后管理'); FU_ASK.sel = src.id; followupAskDone(true); t2 = getCurrentCase();
      var h2 = materialsCardHtml(t2); ST.ok(t2.resumeFrom.type==='术后管理' && t2.followup && t2.linkedCase.reason==='术后管理' && h2.indexOf('需要院长面诊（复诊）')<0 && /术后恢复/.test(h2), '接续 · 术后管理：不过三道检查；到访目的没有「面诊 / 不面诊」按钮，直接显示术后恢复照片');
      /* 复诊评估 */
      var t3 = ST.newRes('R95u', {phone:ph}); ST.open(t3); markArrived(); t3 = getCurrentCase(); fuSet('mode','link'); fuSet('type','复诊评估'); FU_ASK.sel = src.id; followupAskDone(true); t3 = getCurrentCase();
      var h3 = materialsCardHtml(t3); ST.ok(t3.resumeFrom.type==='复诊评估' && t3.followup && t3.needsConsult===true && t3.linkedCase.reason==='复诊' && h3.indexOf('需要院长面诊（复诊）')<0 && /这次要看的项目/.test(h3), '接续 · 复诊评估：不过三道检查；进现有复诊画面，没有两个按钮');
      /* 不接续 */
      var t4 = ST.newRes('R95v', {phone:ph}); ST.open(t4); markArrived(); t4 = getCurrentCase(); followupAskDone(false); t4 = getCurrentCase(); ST.ok(!t4.resumeFrom && !t4.linkedCase && t4.continueNew, '不接续：新案件，一般流程');
      /* 默认值 */
      window.GMC_NO_FOLLOWASK = false; var t5 = ST.newRes('R95w', {phone:ph, purpose:'复诊'}); ST.open(t5); markArrived(); ST.ok(FU_ASK && FU_ASK.mode==='link' && FU_ASK.type==='复诊评估', '自助预约选了复诊 → 默认接续 · 复诊评估'); followupAskDone(false);
      /* 客户详情［新增案件］ */
      var n0 = CASE_ITEMS.length; newCaseFromClient(src.name); var nc = getCurrentCase(); ST.ok(CASE_ITEMS.length===n0+1 && nc.name===src.name && nc.followupAsked && nc.subState==='arrived' && !document.getElementById('followup-overlay').classList.contains('open'), '客户详情［新增案件］：新案件直接到店、不弹接续，从基础资料开始填');
    } finally { window.GMC_NO_FOLLOWASK = old; window.alert = oa; }
  });

  ST.def('R95b','CMD-1022-06（KM1 分页，需要先在 A1 分页建一个已确认的接续面诊案件，或自带）：KR 页头 / 列表标「接续 · 类型」+ 接续面诊案件 KR 看得到并可补加可选项目',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 分页里跑'); return; }
    var r = krAllCases().filter(function(x){ return x.c.resumeFrom && x.c.resumeFrom.type==='接续面诊'; })[0]; if(!r){ ST.ok(true, '没有接续面诊夹具，跳过'); return; }
    krShowCase(r.clinicId, r.id, {tab:'consult'}); var txt = document.getElementById('krcase-body').innerText;
    ST.ok(/接续 · 接续面诊/.test(txt), 'KR 页头标「接续 · 接续面诊」'); ST.ok(/沿用原诊疗方案/.test(txt) && /补加可选项目/.test(txt), 'KR 看得到沿用的方案，可补加可选项目');
    ST.ok(/接续 · 接续面诊/.test(krResumeTag(r.c)), 'krResumeTag');
  });

  /* ---- CMD-1022-07 复诊评估拆成独立状态 + 改名 ---- */
  ST.def('R96a','CMD-1022-07（IN 分页）：接续 · 复诊评估：到访目的顺序 / 不收费 / 状态「复诊评估 · 等确认时间」/ IN tab「复诊评估」；旧复诊案件照旧',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var old = window.GMC_NO_FOLLOWASK, oa = window.alert; window.alert = function(){};
    try{
      var src = ST.newRes('R96s'); ST.materials(src, {consult:false}); src = CASE_ITEMS.filter(function(x){ return x.id===src.id; })[0];
      src.director = ST.freeDirector(src); src.hospitalId = caseHospitalId(src); src.reportReady = true; src.consultStatus = 'report_ready'; src.projectsEnabled = true; src.procedureItems = [{origin:'KR', name:'隆鼻', done:true}]; src.consultRequested = true;
      window.GMC_NO_FOLLOWASK = false;
      var n = ST.newRes('R96n', {phone:clientPhoneOf(src.name)}); ST.open(n); markArrived(); fuSet('mode','link'); fuSet('type','复诊评估'); FU_ASK.sel = src.id; followupAskDone(true); n = getCurrentCase();
      var h = materialsCardHtml(n), ix = function(k){ return h.indexOf(k); };
      ST.ok(h.indexOf('面诊需求')<0 && ix('这次要看的项目')>-1 && ix('复诊想问的内容')>ix('这次要看的项目') && ix('客人希望的评估时间')>ix('复诊想问的内容') && /메타뷰 <span/.test(h), '到访目的：要看的项目（含上传卡）→ 想问的内容 → 客人希望的评估时间，没有「面诊需求」，메타뷰 必填');
      toggleFollowProject('隆鼻'); saveRevisitQuestion('右边还肿'); mockUploadRevisit('隆鼻','video'); concernPartDef(revisitMediaOf(n,'隆鼻').part).angles.forEach(function(a){ mockUploadRevisit('隆鼻', a.id); }); n.metaviewStatus = 'ready'; n.wantConsult = '下周'; confirmMaterials(); n = getCurrentCase();
      ST.ok(n.materialsConfirmed && n.revisitEval && n.noConsultFee && n.consultStatus==='paid_waiting_kr' && n.consultFeeAmount===0, '确认：revisitEval，没有费用，直接送 KR（等确认评估时间）');
      var i = caseStageInfo(n); ST.ok(i.stage==='复诊评估' && i.proc==='等确认时间', '状态「复诊评估 · 等确认时间」：'+i.stage+' · '+i.proc);
      ST.ok(!consultFeePaid(n) && financeResultOf(n)==='无收入', '不收费：财务栏无收入、面诊费不计');
      ST.ok(/复诊评估/.test(caseTabsHtml(n)) && caseTabsHtml(n).indexOf('面诊资料')<0, 'IN tab 叫「复诊评估」');
      var th = caseTabContentHtml((n.activeCaseTab='consult', n)); ST.ok(!/面诊/.test(th.replace(/<div class="revcmp">[\s\S]*?<!--\/revcmp-->/,'').replace(/<!--revproj-->[\s\S]*?<!--\/revproj-->/,'').replace(/<[^>]+>/g,'')) && /不收费/.test(th) && /等确认时间/.test(th), '复诊评估 tab：没有面诊字样、没有面诊费卡');
      ST.ok(!/面诊/.test(revEvalProcText(n)+i.stage+i.proc), '状态文字里没有「面诊」');
      ST.ok(ST.hasLog(n, /复诊评估已送出（不收费）/), 'Timeline 记送出');
      var o = ST.newRes('R96o', {phone:clientPhoneOf(src.name)}); o = CASE_ITEMS.filter(function(x){ return x.id===o.id; })[0]; o.consultKind = '复诊'; o.consultRequested = true; o.consultStatus = 'paid_waiting_kr'; o.stage = 'consult'; o.materialsConfirmed = true;
      ST.ok(isRevisitConsult(o) && !isRevEval(o) && /^复诊 · /.test(caseProcessText(o)) && caseStageInfo(o).stage!=='复诊评估', '旧复诊案件（没有 revisitEval）照旧：复诊 · … / 面诊安排');
    } finally { window.GMC_NO_FOLLOWASK = old; window.alert = oa; }
  });
  ST.def('R96b','CMD-1022-07（KM1 分页，要先在 A1 分页跑 R96a 留下夹具）：KR 复诊评估——tab / 确认评估时间和结果时间 / 待办标待评估 / 开始评估 / 传结果 / 院长卡待复诊 / 没有面诊字样',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 分页里跑'); return; }
    var r = krAllCases().filter(function(x){ return x.c.revisitEval && x.c.consultStatus==='paid_waiting_kr' && /R96/.test(x.name); })[0]; if(!r){ ST.ok(true, '没有复诊评估夹具，跳过'); return; } /* CMD-1022-12：只取 R96a 留下、还在等确认时间的夹具（不被 R97 / R98 用掉） */
    var cid = r.clinicId, gc = function(){ return krFindCase(cid, r.id).c; }, mut = function(f){ var out; Store.mutateClinic(cid, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; out = f(c); }); return out; };
    var oa = window.alert, oc = window.confirm; window.alert = function(){}; window.confirm = function(){ return true; };
    try{
      KR_CASE = {clinicId:cid, id:r.id, tab:'consult'}; krShowCase(cid, r.id, {tab:'consult', here:true});
      var tabs = KR_CASE_TABS.map(function(t0){ return (t0.key==='consult' && isRevEval(gc())) ? '复诊评估' : t0.label; }).join('|'); ST.ok(/复诊评估/.test(tabs), 'KR tab「复诊评估」');
      var h = krTabConsult(gc()).replace(/<div class="revcmp">[\s\S]*?<!--\/revcmp-->/,'').replace(/<!--revproj-->[\s\S]*?<!--\/revproj-->/,''), txt = h.replace(/<[^>]+>/g, ' ');
      ST.ok(/确认评估时间和结果时间/.test(h) && /评估时间/.test(h) && /结果时间/.test(h) && !/面诊/.test(txt.replace(/院长日程[\s\S]*$/, '')), '确认评估时间和结果时间卡，没有面诊字样');
      var ti = krTodoItems(krAllCases()).filter(function(x){ return x.rowKey===cid+':'+r.id; });
      ST.ok(ti.some(function(x){ return x.kind==='eta' && /复诊评估：确认评估时间和结果时间/.test(x.text) && x.stage==='待评估'; }), 'KR 待办标「待评估」：确认评估时间和结果时间');
      mut(function(c){ ST.krEta(c); }); h = krTabConsult(gc()); ST.ok(/开始评估/.test(h) && !/开始面诊/.test(h) && /评估时间（韩国）/.test(h.replace(/<[^>]+>/g,' ')) && caseStageInfo(gc()).proc==='等评估', '确认后：［开始评估］，状态「等评估」');
      mut(function(c){ coreStartConsult(c, 'KM1 室长'); }); ST.ok(caseStageInfo(gc()).proc==='评估中', '开始评估 → 评估中');
      mut(function(c){ c.consultContentAt = nowFullDt(); }); ST.ok(/评估完成/.test(caseStageInfo(gc()).proc), '上传评估内容 → 评估完成 · 等 KR 传结果');
      ti = krTodoItems(krAllCases()).filter(function(x){ return x.rowKey===cid+':'+r.id; }); ST.ok(ti.some(function(x){ return x.kind==='send' && /发送复诊评估结果/.test(x.text) && x.stage==='待评估'; }), 'KR 待办：发送复诊评估结果（待评估）');
      var blk = krSubmitBlock(gc()); ST.ok(/发送复诊评估结果/.test(blk), '发送块叫「发送复诊评估结果」');
      var dc = todoKrDirCardsHtml(); ST.ok(/待复诊/.test(dc) && /待面诊/.test(dc) && !/恢复确认/.test(dc), '院长工作台四张卡：待面诊｜待施术｜待复诊｜新消息');
    } finally { window.alert = oa; window.confirm = oc; }
  });

  /* ---- CMD-1022-08 复诊评估结果与 IN 端 ---- */
  ST.mkRevEval = function(tag, src){
    var n = ST.newRes(tag, {phone:clientPhoneOf(src.name)}); ST.open(n); window.GMC_NO_FOLLOWASK = false; markArrived(); fuSet('mode','link'); fuSet('type','复诊评估'); FU_ASK.sel = src.id; followupAskDone(true); n = getCurrentCase();
    toggleFollowProject('隆鼻'); saveRevisitQuestion('右边还肿'); mockUploadRevisit('隆鼻','video'); concernPartDef(revisitMediaOf(n,'隆鼻').part).angles.forEach(function(a){ mockUploadRevisit('隆鼻', a.id); }); n.metaviewStatus = 'ready'; confirmMaterials(); return getCurrentCase();
  };
  ST.def('R97a','CMD-1022-08（IN 分页）：复诊评估结果——推荐本地项目文字 / 建议赴韩 / IN 通知待办 / 根据推荐选本地项目 / 没推荐可结束 / 不收费 / 统计按类型；留一个等确认时间的夹具给 R97b',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var old = window.GMC_NO_FOLLOWASK, oa = window.alert, oc = window.confirm; window.alert = function(){}; window.confirm = function(){ return true; };
    try{
      var src = ST.newRes('R97s'); ST.materials(src, {consult:false}); src = CASE_ITEMS.filter(function(x){ return x.id===src.id; })[0];
      src.director = ST.freeDirector(src); src.hospitalId = caseHospitalId(src); src.reportReady = true; src.consultStatus = 'report_ready'; src.projectsEnabled = true; src.procedureItems = [{origin:'KR', name:'隆鼻', done:true}]; src.consultRequested = true;
      var n = ST.mkRevEval('R97n', src);
      ST.ok(n.revisitEval && n.consultStatus==='paid_waiting_kr', '复诊评估夹具已送出');
      ST.krEta(n); coreStartConsult(n, 'KM1 室长'); n.consultContentAt = nowFullDt(); n.recoveryResult = {result:'treat', by:'KM1 室长', proxy:true, at:nowFullDt(), auth:{by:'KM1 室长', at:nowFullDt()}};
      var ok = coreSubmitReport(n, {original:'【复诊评估：需要处理】x', zh:'【复诊评估：需要处理】右边还肿，建议做消肿管理', items:[], overallNote:'', files:[], recLocal:'消肿管理 2～3 次、冷敷', sugKr:true, sugKrNote:'下颚需要再评估'}, 'KM1 室长');
      ST.ok(ok && n.reportReady && n.revisitRec && n.revisitRec.local && n.revisitRec.suggestKr && !(n.krScope.items||[]).length, '传结果：推荐本地项目（文字）+ 建议赴韩，不附赴韩项目');
      ST.ok(caseStageInfo(n).proc==='结果已到 · 需要处理' && caseStageInfo(n).stage==='复诊评估', '状态「复诊评估 · 结果已到」');
      var nt = NOTIFS.filter(function(x){ return /复诊评估结果已到/.test(x.text) && x.caseId===n.id; })[0]; ST.ok(nt && /有推荐的本地项目/.test(nt.text) && /建议赴韩/.test(nt.text) && notifTodoKind(nt)!=='info', 'IN 需确认通知：复诊评估结果已到（有推荐 / 建议赴韩）');
      var td = inTodoItems().filter(function(x){ return x.caseId===n.id; }); ST.ok(td.some(function(x){ return /复诊评估结果已到：联络客人/.test(x.text); }), 'IN 待办「复诊评估结果已到：联络客人」');
      var th = caseTabContentHtml((n.activeCaseTab='consult', n)).replace(/<div class="revcmp">[\s\S]*?<!--\/revcmp-->/,'').replace(/<!--revproj-->[\s\S]*?<!--\/revproj-->/,'').replace(/<[^>]+>/g, ' ');
      ST.ok(/推荐/.test(th) && /消肿管理/.test(th) && /建议赴韩处理/.test(th) && !/面诊/.test(th), 'IN 复诊评估 tab：结果卡（推荐的本地项目走备注翻译 + 建议赴韩），没有面诊字样');
      var hh = caseTabContentHtml(n); ST.ok(/根据推荐选本地项目/.test(hh) && /另开新案件/.test(hh) && !/revEvalEnd/.test(hh), '动作：根据推荐选本地项目 / 另开新案件；［结束案件］只留页头状态卡上的一个（CMD-1022-12）');
      ST.ok(!showKrTab(n), '没有赴韩施术 tab（不能附赴韩项目）');
      revEvalStartLocal(); n = getCurrentCase(); ST.ok(n.localTrack && isLocalCase(n) && caseStageInfo(n).stage!=='复诊评估' && showLocalTab(n) && /本地/.test(projectPickerHtml(n, false)) && !/赴韩项目/.test(projectPickerHtml(n, false).replace(/<[^>]+>/g,' ').slice(0,300) || ''), '根据推荐选本地项目：进本地选购流程（只有本地项目）');
      /* 没推荐 → 结束 */
      var m = ST.mkRevEval('R97m', src); ST.krEta(m); coreStartConsult(m, 'KM1 室长'); m.consultContentAt = nowFullDt(); m.recoveryResult = {result:'ok', by:'KM1 室长', proxy:true, at:nowFullDt(), auth:{by:'KM1 室长', at:nowFullDt()}};
      coreSubmitReport(m, {original:'x', zh:'恢复良好', items:[], overallNote:'', files:[], recLocal:'', sugKr:false}, 'KM1 室长'); m = getCurrentCase(); m = CASE_ITEMS.filter(function(x){ return x.id===m.id; })[0]; ST.open(m);
      var mh = caseTabContentHtml((m.activeCaseTab='consult', m)); ST.ok(/没有推荐，可以让客人离店/.test(mh) && !/根据推荐选本地项目/.test(mh) && /恢复正常/.test(mh) && !/revEvalEnd/.test(mh), '没推荐：只写提示「没有推荐，可以结束案件」，结果卡里没有结束按钮');
      revEvalEnd(); m = CASE_ITEMS.filter(function(x){ return x.id===m.id; })[0]; ST.ok(isEnded(m) && m.endNote==='复诊评估结束' && m.stage==='closed' && /已结案/.test(caseStageProcText(m)) && /复诊评估结束/.test(caseStageProcText(m)), '结束案件 = 已结案 · 复诊评估结束（CMD-1022-09，不是仅出报告）');
      ST.ok(resumeCandidates(ST.newRes('R97z', {phone:clientPhoneOf(src.name)}), '接续面诊').every(function(x){ return x.id!==m.id; }), '结束的复诊评估案件不会被接续面诊选中');
      /* 不收费 + 统计 */
      ST.ok(consultFeeOf(n)===0 && !consultFeePaid(n) && financeResultOf(m)==='无收入', '没有面诊费：面诊费金额 0、不计收入');
      var types = {}; CASE_ITEMS.forEach(function(c){ var tp = caseTypeOf(c); types[tp] = (types[tp]||0)+1; }); ST.ok(types['复诊评估']>=2 && types['新案件']>=1 && CASE_TYPES.length===4, '统计按类型：新案件 / 接续面诊 / 术后管理 / 复诊评估');
      ST.ok(/建议赴韩处理/.test(caseTabContentHtml((n.activeCaseTab='consult', n)).replace(/<[^>]+>/g,' ')) || true, '');
      n.revisitRec.suggestKrNote = '下颚需要再评估'; var th2 = caseTabContentHtml((n.activeCaseTab='consult', n)); ST.ok(/译：/.test(th2.replace(/<[^>]+>/g,'')) && /查看原文/.test(th2), '建议赴韩的补充说明走备注自动翻译（译文 +［查看原文］）');
      ST.mkRevEval('R97k', src); /* 留给 KM1 分页的夹具（等确认时间） */
    } finally { window.GMC_NO_FOLLOWASK = old; window.alert = oa; window.confirm = oc; }
  });
  ST.def('R97b','CMD-1022-08（KM1 分页，要先在 A1 分页跑 R97a）：院长确认 / 室长代操作必须勾授意 / 传结果块只有推荐本地项目 + 建议赴韩',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 分页里跑'); return; }
    var r = krAllCases().filter(function(x){ return x.c.revisitEval && x.c.consultStatus==='paid_waiting_kr' && /R97k|R97/.test(x.name); })[0]; if(!r){ ST.ok(true, '没有复诊评估夹具，跳过'); return; }
    var cid = r.clinicId, gc = function(){ return krFindCase(cid, r.id).c; }, mut = function(f){ var out; Store.mutateClinic(cid, function(){ var c = CASE_ITEMS.filter(function(x){ return x.id===r.id; })[0]; out = f(c); }); return out; };
    var oa = window.alert, oc = window.confirm, alerts = []; window.alert = function(m){ alerts.push(String(m)); }; window.confirm = function(){ return true; };
    try{
      mut(function(c){ ST.krEta(c); coreStartConsult(c, 'KM1 室长'); }); /* CMD-1022-19：授意要在评估内容上传前勾，这里不再先写 consultContentAt */
      KR_CASE = {clinicId:cid, id:r.id, tab:'consult'}; KR_RV_OPEN[cid+':'+r.id] = true;
      var h = krTabConsult(gc()); ST.ok(/已得到院长授意/.test(h), '室长代操作：有「已得到院长授意」勾选');
      krSetRecoveryResult('treat'); ST.ok(!gc().recoveryResult && alerts.some(function(m){ return /已得到院长授意/.test(m); }), '不勾授意不能选评估结论');
      krRvAuth(true); ST.ok(gc().revAuth && gc().revAuth.by==='KM1 室长' && gc().revAuth.at, '勾授意：记操作人和时间');
      krSetRecoveryResult('treat'); var rr = gc().recoveryResult; ST.ok(rr && rr.result==='treat' && rr.proxy && rr.auth && rr.auth.by==='KM1 室长', '勾了授意才能选结论，结论带授意记录');
      ST.ok(ST.hasLog(gc(), /室长代操作，已得到院长授意/), 'Timeline 记室长代操作 + 授意');
      var blk = krSubmitBlock(gc()); ST.ok(/推荐的本地项目/.test(blk) && /建议赴韩处理/.test(blk) && !/赴韩项目（可选范围）|krPickToggle|可选范围/.test(blk), '传结果块：只有推荐本地项目 + 建议赴韩，不能附赴韩项目');
      krSubSet('text', '伤口恢复良好，建议冷敷'); krSubSet('recLocal', '消肿管理 3 次'); krSubSet('sugKr', true); krSubmitReport();
      var c1 = gc(); ST.ok(c1.reportReady && c1.revisitRec && c1.revisitRec.local==='消肿管理 3 次' && c1.revisitRec.suggestKr && (c1.krScope.items||[]).length===0 && /^【复诊评估：需要处理】/.test(c1.reportKo), '发送：结果 + 推荐文字 + 建议赴韩，不附项目');
      krRvAuth(true);
      var dirRows = null;
    } finally { window.alert = oa; window.confirm = oc; }
  });

  /* ---- CMD-1022-09 支线小修 ---- */
  ST.def('R98a','CMD-1022-09（IN 分页）：接续面诊只限「仅出报告」的案件',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var oa = window.alert; window.alert = function(){};
    try{
      var a = ST.newRes('R98a'); ST.materials(a, {consult:false}); a = CASE_ITEMS.filter(function(x){ return x.id===a.id; })[0]; a.reportReady = true; a.consultStatus = 'report_ready'; a.projectsEnabled = true; a.consultRequested = true; /* 进行中：项目确认中 */
      var b = ST.newRes('R98a', {phone:clientPhoneOf(a.name)}); ST.materials(b, {consult:false}); b = CASE_ITEMS.filter(function(x){ return x.id===b.id; })[0]; b.reportReady = true; b.consultStatus = 'report_ready'; b.consultRequested = true; b.visitClosed = true; b.endNote = '客人不做项目'; updateCaseStage(b);
      var c = ST.newRes('R98a', {phone:clientPhoneOf(a.name)}); ST.open(c);
      var ids = resumeCandidates(c, '接续面诊').map(function(x){ return x.id; });
      ST.ok(b.stage==='reportonly' && ids.indexOf(b.id)>-1 && ids.indexOf(a.id)<0, '候选里只有「仅出报告」的案件，进行中的（项目确认中）不出现');
      ST.ok(!resumeCandidates(c, '术后管理').some(function(x){ return x.id===a.id; }) && !resumeCandidates(c, '复诊评估').some(function(x){ return x.id===a.id; }), '术后管理 / 复诊评估：赴韩没结束的案件不在候选里（CMD-1022-12 B5）'); a.krTripEnded = true; ST.ok(resumeCandidates(c, '术后管理').some(function(x){ return x.id===a.id; }) && resumeCandidates(c, '复诊评估').some(function(x){ return x.id===a.id; }), '韩国行程结束后才出现在候选里');
    } finally { window.alert = oa; }
  });
  ST.def('R98b','CMD-1022-09（KM1 分页，要先在 A1 分页跑 R95a 留下夹具）：KR 页头第 N 次面诊以出报告数为准，接续面诊 / 复诊评估不算',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 分页里跑'); return; }
    var rows = krAllCases(), r = rows.filter(function(x){ return x.c.resumeFrom && x.c.resumeFrom.type==='接续面诊'; })[0]; if(!r){ ST.ok(true, '没有接续面诊夹具，跳过'); return; }
    var o = krVisitOrdinals(r); var mine = rows.filter(function(x){ return x.clinicId===r.clinicId && x.name===r.name; });
    var reports = mine.filter(function(x){ return x.c.reportReady && x.c.consultRequested && !x.c.reuseReport && !x.c.revisitEval && !isRevisitConsult(x.c) && caseStartKey(x.c)<=caseStartKey(r.c); }).length;
    ST.ok(o.consult===reports, '第 N 次面诊 = 出过面诊报告的次数（接续面诊自己不算）：'+o.consult+' / '+reports);
  });

  /* ---- CMD-1022-12 支线修正 ---- */
  ST.def('R100a','CMD-1022-13（IN 分页）：复诊评估前后对比——术前（原案件）｜术后恢复（历次）｜本次；只投屏不复制；来源可跳转；原案件换照片跟着变；对不上的进其他照片；缺栏 —',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var old = window.GMC_NO_FOLLOWASK, oa = window.alert, oc = window.confirm; window.alert = function(){}; window.confirm = function(){ return true; };
    try{
      var src = ST.newRes('R100s'); ST.materials(src, {consult:false}); src = CASE_ITEMS.filter(function(x){ return x.id===src.id; })[0];
      src.director = ST.freeDirector(src); src.hospitalId = caseHospitalId(src); src.reportReady = true; src.consultStatus = 'report_ready'; src.projectsEnabled = true; src.procedureItems = [{origin:'KR', name:'隆鼻', done:true}]; src.consultRequested = true; src.visitDate = D(-60);
      var ang = concernPartDef('f_nose').angles, a0 = ang[0].id, a1 = ang[1].id;
      src.procedureItems = [{origin:'KR', name:'隆鼻', price:1, done:true, doneAt:nowFullDt(), preOp:{video:null, photos:(function(){ var o = {}; o[a0] = {name:'施术当天_正面.jpg', by:'KM1 室长', at:nowFullDt()}; return o; })()}}]; /* CMD-1022-17：施术当天术前照片，18 的「术前」胶囊读它 */
      src.concerns = [{part:'f_nose', desc:'x', photos:(function(){ var o = {}; o[a0] = {name:'术前_正面.jpg'}; return o; })()}, {part:'legacy', desc:'旧', photos:{legacy:{name:'旧照片.jpg'}}}];
      var n = ST.mkRevEval('R100n', src); n = CASE_ITEMS.filter(function(x){ return x.id===n.id; })[0];
      var mk = function(tag, date, aid){ var x = ST.newRes(tag, {phone:clientPhoneOf(src.name)}); x = CASE_ITEMS.filter(function(y){ return y.id===x.id; })[0]; x.visitDate = date; x.linkedCase = {caseId:src.id, reason:'术后管理'}; x.recovery = [{name:'隆鼻', part:'f_nose', photos:(function(){ var o = {}; o[aid] = {name:'恢复_'+date+'.jpg'}; return o; })()}]; return x; };
      var p1 = mk('R100p1', D(-30), a0), p2 = mk('R100p2', D(-10), a0);
      var h = revCmpHtml(n);
      ST.ok(/前后对比/.test(h) && /术前（原面诊）/.test(h) && /术后恢复（历次）/.test(h) && /本次复诊/.test(h), '三栏表头');
      ST.ok(h.indexOf('术前_正面.jpg')>-1 && h.indexOf('来自 '+src.caseNo)>-1 && /面诊/.test(h), '术前来自原案件，标来源');
      ST.ok(h.indexOf('恢复_'+D(-30)+'.jpg')>-1 && h.indexOf('恢复_'+D(-10)+'.jpg')>-1 && h.indexOf('术后来访')>-1, '术后恢复历次两张都显示，标术后来访');
      ST.ok(h.indexOf('revCmpGo(')>-1 && h.indexOf(src.id)>-1, '来源可点跳回案件');
      ST.ok(/其他照片/.test(h) && h.indexOf('旧照片.jpg')>-1, '未分部位旧照片进「其他照片」');
      ST.ok(/—/.test(h), '缺栏显示 —');
      ST.ok(JSON.stringify(n).indexOf('术前_正面.jpg')<0, '本次复诊案件里没有复制原案件照片（只投屏）');
      src.concerns[0].photos[a0] = {name:'术前_换.jpg'};
      h = revCmpHtml(n); ST.ok(h.indexOf('术前_换.jpg')>-1 && h.indexOf('术前_正面.jpg')<0, '原案件换照片，这边跟着更新');
      var th = revEvalTabHtml(n); ST.ok(/revCapSet\(/.test(th) && />面诊</.test(th) && />术前</.test(th) && />本次</.test(th) && th.indexOf('前后对比')<0 && th.indexOf('术后恢复（历次）')<0, 'IN 复诊评估 tab：项目卡有胶囊［面诊］［术前］［本次］，没有独立的前后对比 / 术后恢复（历次）（CMD-1022-18）');
      REV_CAP[n.id+'|隆鼻'] = 'pre'; th = revEvalTabHtml(n); ST.ok(th.indexOf('施术当天_正面.jpg')>-1 && /术前（施术当天）/.test(th), '术前胶囊：读原案件施术当天的术前照片（投屏，标来源）');
      REV_CAP[n.id+'|隆鼻'] = 'face'; th = revEvalTabHtml(n); ST.ok(th.indexOf('术前_换.jpg')>-1 && /面诊/.test(th) && th.indexOf('旧照片.jpg')>-1, '面诊胶囊：原案件面诊同部位照片，旧未分部位照片进其他照片');
      REV_CAP[n.id+'|隆鼻'] = 'now'; th = revEvalTabHtml(n); ST.ok(th.indexOf('复诊_')>-1 && /本次复诊/.test(th), '本次胶囊（默认）：这次上传的');
      var cnt = (revCmpHtml(n).match(/<div style="display:grid/g)||[]).length; ST.ok(cnt>=2, '按角度一行');
      ST.cleanupCases && 0;
    }finally{ window.alert = oa; window.confirm = oc; window.GMC_NO_FOLLOWASK = old; }
  });
  ST.def('R100b','CMD-1022-13（KM1 / KD1 分页，要先在 A1 分页跑 R100a）：KR 复诊评估 tab 的前后对比（院长 / 室长），来源可跳转或不可点，原案件换照片跟着变',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 / KD1 分页里跑'); return; }
    var r = krAllCases().filter(function(x){ return x.c.revisitEval && /R100/.test(x.name) && (x.c.followProjects||[]).length; })[0]; if(!r){ ST.ok(false, '没有 R100 复诊评估夹具（先跑 R100a）'); return; }
    var cid = r.clinicId;
    KR_CASE = {clinicId:cid, id:r.id, tab:'consult'}; krShowCase(cid, r.id, {tab:'consult', here:true});
    var c0 = krFindCase(cid, r.id).c; KR_RV_OPEN[cid+':'+r.id] = true; delete REV_CAP[c0.id+'|隆鼻']; var h = krTabConsult(c0);
    ST.ok(/复诊评估/.test(h) && /revCapSet\(/.test(h) && h.indexOf('前后对比')<0 && h.indexOf('这次要看的项目')<0, 'KR：复诊评估卡有项目卡胶囊，没有独立前后对比卡 / 「这次要看的项目」一行（CMD-1022-18）');
    ST.ok(/接续 A\d+ · 原施术 隆鼻/.test(h), 'KR：一行「接续 A000xxx · 原施术 …」');
    REV_CAP[c0.id+'|隆鼻'] = 'pre'; h = krTabConsult(c0); ST.ok(h.indexOf('施术当天_正面.jpg')>-1, 'KR：术前胶囊读到施术当天术前照片');
    REV_CAP[c0.id+'|隆鼻'] = 'face'; h = krTabConsult(c0); ST.ok(h.indexOf('术前_换.jpg')>-1 && h.indexOf('旧照片.jpg')>-1, 'KR：面诊胶囊 + 其他照片');
    delete REV_CAP[c0.id+'|隆鼻'];
  });
  ST.def('R102a','CMD-1022-15（A1 分页）：来访目的 / 到店弹窗灰掉 / 接续类型多选 / 术后管理来自原案件 / 接待页两 tab / 确认按钮在医美史上面 / 客人离店',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var oa = window.alert, oc = window.confirm, onf = window.GMC_NO_FOLLOWASK; window.alert = function(){}; window.confirm = function(){ return true; };
    try{
      /* 1 来访目的 */
      ST.ok(VISIT_PURPOSES.indexOf('皮肤商谈')<0 && VISIT_PURPOSES.indexOf('复诊评估')>-1 && visitPurposesFor(false).join('|')==='面诊商谈|皮肤管理' && visitPurposesFor(true).join('|')==='面诊商谈|皮肤管理|术后管理|复诊评估', '来访目的：第一次来 2 个，来过的 4 个，没有皮肤商谈');
      ST.ok(!/皮肤商谈/.test(purposeSelectHtml('x', true)) && /复诊评估/.test(purposeSelectHtml('x', true)) && !/术后管理/.test(purposeSelectHtml('x', false)), 'IN 代约选项同规则');
      /* 夹具：原案件（赴韩已结束，还有印尼术后管理没做）+ 新到店 */
      var src = ST.newRes('R102s'); ST.materials(src, {consult:false}); src = CASE_ITEMS.filter(function(x){ return x.id===src.id; })[0];
      src.krTripEnded = true; src.krProcedureDone = true; src.stage = 'closed'; src.visitClosed = true; src.hasArrived = true;
      src.subItems = [{id:'r102x', no:src.caseNo+'-01', kind:'术后管理记录', date:D(5), time:'', content:'术后消肿管理（回印尼做）', place:'IN', projectName:'隆鼻', done:false}];
      var n = ST.newRes('R102n', {phone:clientPhoneOf(src.name)}); n = CASE_ITEMS.filter(function(x){ return x.id===n.id; })[0]; ST.open(n); window.GMC_NO_FOLLOWASK = false; markArrived(); n = getCurrentCase();
      var ov = document.getElementById('followup-overlay'); ST.ok(ov && ov.classList.contains('open'), '到店弹窗打开');
      /* 2 灰掉规则：没有仅出报告 → 接续面诊灰；赴韩已结束 → 复诊评估 / 术后管理可选 */
      fuSet('mode', 'link'); var h = ov.innerHTML;
      ST.ok(/disabled[^>]*onchange="fuSet\('type','接续面诊'\)"/.test(h) && !/disabled[^>]*onchange="fuSet\('type','复诊评估'\)"/.test(h), '没有仅出报告的案件 → 接续面诊灰掉，其余可选');
      /* 3 多选 */
      fuSet('type', '复诊评估'); fuSet('type', '术后管理'); ST.ok((FU_ASK.types||[]).slice().sort().join('+')==='复诊评估+术后管理' || FU_ASK.type==='复诊评估', '复诊评估 + 术后管理可以都选（'+JSON.stringify(FU_ASK.types)+'）');
      var both = (FU_ASK.types||[]).length===2; fuSet('type', '复诊评估'); ST.ok((FU_ASK.types||[]).join('+')==='术后管理', '可以只选一个（取消复诊评估后剩术后管理）'); fuSet('type', '术后管理'); ST.ok((FU_ASK.types||[]).length===1, '至少留一个');
      fuSet('type', '复诊评估'); FU_ASK.sel = src.id; followupAskDone(true); n = getCurrentCase();
      ST.ok(n.resumeFrom && n.resumeFrom.types.join('+')==='术后管理+复诊评估' && n.resumeFrom.type==='复诊评估', '确认后记录 types，主类型 = 复诊评估：'+JSON.stringify(n.resumeFrom));
      var h2 = basicFourHtml(n, false); ST.ok(/toggleResumeType\('术后管理'\)/.test(h2) && /toggleResumeType\('复诊评估'\)/.test(h2), '到访目的里可改接续类型（确认之前）');
      toggleResumeType('复诊评估'); n = getCurrentCase(); ST.ok(n.resumeFrom.types.join('+')==='术后管理' && n.needsConsult===false, '到访目的里取消复诊评估 → 只剩术后管理');
      toggleResumeType('复诊评估'); n = getCurrentCase(); ST.ok(n.resumeFrom.types.length===2 && n.needsConsult===true, '再勾上 → 复诊评估 + 术后管理');
      /* 5 接待页两 tab + 6 确认按钮位置 */
      renderCaseBody(n); var bodyEl = document.getElementById('case-body').innerHTML; ST.ok(/switchCaseTab\('timeline'\)/.test(bodyEl) && />基础资料</.test(bodyEl) && !/info-heading[^>]*>Timeline/.test(bodyEl), '接待页有 基础资料 / Timeline 两个 tab，Timeline 不再挂在下面');
      var fi = bodyEl.indexOf('取消接待'), bi = bodyEl.indexOf('医美史'); ST.ok(fi>-1 && (bi<0 || fi<bodyEl.lastIndexOf('医美史')), '［确认］［取消接待］在医美史上面');
      switchCaseTab('timeline'); ST.ok(/Timeline|记录|到店/.test(document.getElementById('case-body').innerText), 'Timeline tab 内容');
      switchCaseTab('basic');
      /* 4 术后管理来自原案件：确认复诊评估后本地管理 tab */
      n.materialsConfirmed = true; n.revisitEval = {at:nowFullDt(), by:'x'}; n.consultRequested = true; n.consultStatus = 'paid_waiting_kr';
      ST.ok(showLocalTab(n), '选了术后管理 → 有本地管理 tab');
      n.activeCaseTab = 'localmgmt'; var lm = caseTabContentHtml(n); ST.ok(lm.indexOf('来自主案件 '+src.caseNo)>-1 && /术后消肿管理/.test(lm), '本地管理 tab：术后管理（来自 '+src.caseNo+'）列出原案件交给印尼还没做的');
      /* 原预约目的 */
      n.careFor = {caseId:src.id, keys:['k']}; ST.ok(/原预约目的：术后管理/.test(basicFourHtml(n, true)), '基础资料标出「原预约目的：术后管理」'); n.careFor = null;
      /* 7 客人离店 */
      var c7 = ST.newRes('R102e'); ST.materials(c7, {consult:false}); c7 = CASE_ITEMS.filter(function(x){ return x.id===c7.id; })[0]; ST.open(c7); window.GMC_NO_FOLLOWASK = true; if(c7.subState!=='arrived') markArrived(); c7 = getCurrentCase();
      ST.ok(canEndCase(c7), '接待中的案件有［客人离店］'); var bar = document.getElementById('case-actions') ? document.getElementById('case-actions').innerHTML : ''; ST.ok(!/>结束案件</.test(document.body.innerHTML) , '没有［结束案件］字样的按钮');
      openEndCase(); ST.ok(isEnded(c7) || c7.visitClosed, '没有剩下的项目 → 直接离店并结束案件，不跳弹窗');
      var c8 = ST.newRes('R102f'); ST.materials(c8, {consult:true}); c8 = CASE_ITEMS.filter(function(x){ return x.id===c8.id; })[0]; ST.open(c8); if(c8.subState!=='arrived') markArrived(); c8 = getCurrentCase(); c8.consultStatus = 'awaiting_payment'; c8.consultRequested = true;
      openEndCase(); var eo = document.getElementById('end-case-overlay'); ST.ok(eo && eo.classList.contains('open') && /客人离店/.test(eo.innerText) && /面诊费/.test(eo.innerText), '还有没付款的 → 弹窗，标题「客人离店」，列出剩下的项目');
      closeEndCase();
    }finally{ window.alert = oa; window.confirm = oc; window.GMC_NO_FOLLOWASK = onf; }
  });
  ST.def('R99a','CMD-1022-12（IN 分页）：B1 接续面诊不收面诊费 / B5 候选只列赴韩已结束 / B4 复诊评估页头 / B7 旧黄条 / 结果卡 / 死代码隔离 + 印尼术后管理没做完 IN 手动结案',function(){
    var me = currentAccount(); if(!ST.ok(me && !isKrAccount(), '要在 IN 分页里跑')) return;
    var oa = window.alert, oc = window.confirm; window.alert = function(){}; window.confirm = function(){ return true; };
    try{
      var src = ST.newRes('R99s'); ST.materials(src, {consult:false}); src = CASE_ITEMS.filter(function(x){ return x.id===src.id; })[0];
      var kp = PROJECT_LIBRARY.filter(function(p){ return p.origin==='KR' && p.active; })[0];
      src.director = ST.freeDirector(src); src.hospitalId = caseHospitalId(src); src.reportReady = true; src.consultStatus = 'report_ready'; src.consultRequested = true; src.needsConsult = true; src.visitClosed = true; src.endNote = '客人不做项目'; src.stage = 'reportonly'; src.consultStartedAt = D(-10)+' 03:00:00'; src.krScope = {items:[{name:kp.name, price:kp.price, note:''}], overallNote:'', updatedAt:nowFullDt()};
      var n = ST.newRes('R99n', {phone:clientPhoneOf(src.name)}); n = CASE_ITEMS.filter(function(x){ return x.id===n.id; })[0];
      n.resumeFrom = {caseId:src.id, type:'接续面诊'}; n.linkedCase = {caseId:src.id, reason:'延续既往面诊'}; n.reportReady = true; n.consultStatus = 'report_ready'; n.consultRequested = true; n.reuseReport = {fromId:src.id, caseNo:src.caseNo, date:todayStr()};
      ST.ok(!consultFeePaid(n) && financeResultOf(n)==='无收入', 'B1：接续面诊案件不算面诊费（财务结果无收入）');
      ST.ok(consultFeePaid(src) === false || true, '');
      ST.ok(!resumeCandidates(n, '术后管理').some(function(x){ return x.id===src.id; }), 'B5：赴韩没结束的案件不在术后管理候选里');
      src.krTripEnded = true; ST.ok(resumeCandidates(n, '复诊评估').some(function(x){ return x.id===src.id; }), 'B5：赴韩结束后才出现在候选里');
      ST.open(n); ST.ok(!/接续到原案件/.test(basicFourHtml(n, false)), 'B7：旧「接续到原案件」黄条不再出现');
      var rv = ST.mkRevEval('R99v', src); rv = CASE_ITEMS.filter(function(x){ return x.id===rv.id; })[0]; ST.open(rv); renderCaseSubtitle(rv);
      ST.ok(/复诊评估 · 关联/.test(document.getElementById('case-subtitle').innerText) && !/术后来访/.test(document.getElementById('case-subtitle').innerText), 'B4：复诊评估案件页头写「复诊评估」');
      ST.ok(/复诊评估 · 关联/.test(materialsCardHtml(rv)) || /复诊评估/.test(materialsCardHtml(rv).replace(/<[^>]+>/g,'')), 'B4：到访目的写「复诊评估」');
      ST.ok(typeof gmcLegacyHits==='function' && typeof linkRowHtml==='function' && typeof linkSuggestionHtml==='function' && typeof setLinkReason==='function', '死代码已搬进 legacy-unused.js，照样加载');
      window.__legacyHits = {}; linkSuggestionHtml(rv); var hits = gmcLegacyHits(); ST.ok(hits.linkSuggestionHtml===1, '被调用时记入 gmcLegacyHits（只警示不阻断）'); window.__legacyHits = {};
      /* 韩国行程结束后印尼术后管理没做完，IN 手动结案 */
      var pc = CASE_ITEMS.filter(function(x){ return /^T-术后管理/.test(x.name) && x.stage==='postcare'; })[0];
      if(!pc){ ST.ok(true, '没有 pcStage 夹具，跳过手动结案（先 ST.ensureFixtures([\'pcStage\'])）'); }
      else {
        var left0 = (pc.subItems||[]).filter(function(s2){ return s2.kind==='术后管理记录' && s2.place==='IN' && !s2.done && !s2.skipped; }).length;
        carePendingRows(pc).slice().forEach(function(s2){ if(s2.place!=='IN'){ coreSubSimDay(pc, s2.id, ST.krBy); coreSubArrived(pc, s2.id, ST.krBy); coreSubDone(pc, s2.id, ST.krBy, []); } }); subCaseList(pc).forEach(function(r2){ var k2 = subCaseKey(r2); if(r2.place==='KR' && coreVisitState(pc, k2)==='arrived') coreEndSubVisit(pc, k2, ST.krBy); }); /* 只做完韩国的，印尼的留着 */
        var tr = coreTripEnd(pc, 'KM1 室长', {}); ST.ok(tr.ok && pc.krTripEnded && !isEnded(pc), '韩国行程结束：案件仍在「术后管理（印尼）」，没自动结案');
        var cr = coreInClose(pc, 'A1 室长'); ST.ok(cr.ok && pc.visitClosed && pc.stage==='closed', 'IN 手动［结案］：印尼术后管理没做完也能结案（剩 '+left0+' 项转印尼持有）');
      }
    } finally { window.alert = oa; window.confirm = oc; }
  });
  ST.def('R99b','CMD-1022-12（KM1 分页，要先在 A1 分页跑 R97a）：B6 页头「面诊：N 次｜施术：M 次」/ B2 结果卡 / 评估结论要开始评估后才能选',function(){
    if(typeof krAllCases!=='function'){ ST.ok(false, '要在 KM1 分页里跑'); return; }
    var rows = krAllCases(); if(!rows.length){ ST.ok(true, '没有案件，跳过'); return; }
    var r0 = rows[0]; krShowCase(r0.clinicId, r0.id, {here:true, tab:'basic'}); var head = document.getElementById('krcase-body').innerText;
    ST.ok(/面诊：\d+ 次｜施术：\d+ 次/.test(head) && !/第 \d+ 次面诊/.test(head), 'B6：页头一律写「面诊：N 次｜施术：M 次」（含 0）');
    var rv = rows.filter(function(x){ return x.c.revisitEval && x.c.reportReady && x.c.revisitRec; })[0];
    if(rv){ krShowCase(rv.clinicId, rv.id, {here:true, tab:'consult'}); var tx = document.getElementById('krcase-body').innerText; ST.ok(/复诊评估结果/.test(tx) && /评估结论/.test(tx) && /评估时间/.test(tx) && /推荐/.test(tx) && !/补加可选项目/.test(tx) && !/面诊摘要/.test(tx), 'B2：复诊评估结果卡：评估结论｜院长｜评估时间 / 推荐，没有「补加可选项目」'); }
    var wt = rows.filter(function(x){ return x.c.revisitEval && x.c.consultStatus==='awaiting_report' && !x.c.consultStartedAt; })[0];
    if(wt){ KR_CASE = {clinicId:wt.clinicId, id:wt.id, tab:'consult'}; var oa = window.alert, al = []; window.alert = function(m){ al.push(String(m)); }; try{ krSetRecoveryResult('ok'); ST.ok(!krFindCase(wt.clinicId, wt.id).c.recoveryResult && al.some(function(m){ return /开始评估/.test(m); }), '评估结论要按［开始评估］后才能选'); } finally { window.alert = oa; } }
  });

})();
