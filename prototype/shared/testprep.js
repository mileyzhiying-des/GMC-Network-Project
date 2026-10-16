/* shared/testprep.js —— 一键准备测试客人（CMD-1013-05，开发用，不属于产品功能）
   test-prep.html?demo=A1&make=<key>：以 A1 身份（C1 诊所）建好测试客人和前置条件，页面上写明"请用 A1 / KM1 登录，从 xx 开始"。
   客人名字前加「T-」（重复建自动编号 T-Queen 2）；案件标 prep:true + demo:false（不是演示数据，数据升级时和用户案件一样保留）；
   准备阶段自动产生的 Timeline 都带 prep:true，测试覆盖页判断时跳过，只算之后用户亲手做的。 */
(function(){
  var HID = 'H1', DIRECTOR = 'KD1 院长', COORD = 'KM1 室长', N1 = '假体隆鼻', N2 = '鼻翼缩小'; /* TESTPREP_MAKE(key, {hid:'H2', ...}) 可改成 H2 / C3 的夹具（KM2 角色测试用） */
  function qs(k){ return new URLSearchParams(location.search).get(k); }
  function uniqName(base){ var n = 'T-'+base, i = 1; while(clientByName(n)){ i++; n = 'T-'+base+' '+i; } return n; }
  var NAMER = null; /* 第 2 轮一键准备：客人名由 R2- 命名，重名在后面加 (2)、(3) */
  function uniqFull(full){ var n = full, i = 1; while(clientByName(n)){ i++; n = full+' ('+i+')'; } return n; }
  function newPhone(){ var p; do{ p = '+62 898-'+String(Math.floor(1000+Math.random()*9000))+'-'+String(Math.floor(1000+Math.random()*9000)); }while(clientByPhone(p)); return p; }
  function mkClient(base, o){
    o = o || {}; var name = NAMER ? NAMER(base) : uniqName(base), phone = newPhone();
    var cl = addClient({name:name, phone:phone, gender:'女', dob:'1991-04-12', createdBy:'测试准备', source:'测试准备', consent:{version:o.consentVer||'v1.0', ts:D(-60)+' 10:00', source:'测试准备'}});
    cl.prep = true; cl.phone = phone; return cl;
  }
  var touched = [];
  function mark(c){ c.prep = true; c.demo = false; (c.logEntries||[]).forEach(function(e){ e.prep = true; }); touched.push(c); return c; }
  function localName(pref){ var p = PROJECT_LIBRARY.filter(function(x){ return x.origin==='IN' && x.name===pref && x.active; })[0] || PROJECT_LIBRARY.filter(function(x){ return x.origin==='IN' && x.active; })[0]; return p ? p.name : pref; }
  function grant(cl, c, itemName, qty, used, paid){
    var nb = grantHolding(cl.name, itemName, '本地', c.id, c.visitDate, qty, false, {paid:paid, list:paid, pct:100, currency:'IDR'});
    nb.used = used || 0; nb.usages = used ? [{date:c.visitDate, caseId:c.id, qty:used}] : []; nb.prep = true; return nb;
  }
  /* 过去已结束的案件（本地购买）：带持有批次 */
  function pastLocalCase(cl, holds, daysAgo){
    var c = createReservationCase(cl.name, null, D(-(daysAgo||12)), '11:00', cl.phone, '皮肤商谈');
    c.subState = 'arrived'; c.materialsConfirmed = true; c.needsConsult = false; c.localTrack = true; c.projectsEnabled = true; c.settlementDone = true;
    holds.forEach(function(h){ grant(cl, c, localName(h.name), h.qty, h.used, h.paid); });
    logCaseEvent(c, '测试准备', '测试准备：过去的本地购买案件'); finishCase(c, '未购买未使用');
    return mark(c);
  }
  function krProj(name){ return ((HOSPITAL_DATA[HID]||{}).projects||[]).filter(function(p){ return p.name===name; })[0]; }
  function krItemList(names, batchId){ return names.map(function(n){ var p = krProj(n); return {projectId:p.id, name:n, price:p.price, currency:'KRW', origin:'KR', categoryId:p.categoryId, done:false, batchId:batchId||'B1'}; }); }
  function krBase(cl, stage){
    var c = createReservationCase(cl.name, DIRECTOR, D(-3), '11:00', cl.phone, '面诊商谈');
    Object.assign(c, {subState:'arrived', materialsConfirmed:true, concern:'（测试准备）', expectation:'（测试准备）', needsConsult:true, consultRequested:true, hospitalId:HID, director:DIRECTOR, krCoordinator:COORD, consultFeeAmount:CLINIC_SETTINGS.consultFee||0, consultPaidAt:nowFullDt(), krInRoom:true});
    return c;
  }
  function withReport(c, names){
    var items = krItemList(names); gmcFillKrMeta([{hospitalId:HID, procedureItems:items}]);
    /* 其中一项带术后管理（印尼对应项目名）：韩国或印尼都可，由 KR 在付清尾款后的预约弹窗决定（IN 不再分配） */
    var inn = localName('艺人水光焕肤'); items.forEach(function(it, i){ (it.postcare||[]).forEach(function(x){ if(x.place==='either') x.innName = inn; }); });
    if(!items.some(function(it){ return (it.postcare||[]).length; })) items[0].postcare = [{mgmt:'术后管理', name:'术后消肿管理', times:3, interval:2, place:'either', startDay:3, innName:inn, inTimes:0, day:'第3、5、7天'}];
    c.reportReady = true; c.reportDate = D(-1); c.consultStatus = 'report_ready'; c.projectsEnabled = true; c.projectsLocked = true; c.activeCaseTab = 'kr';
    c.consultFiles = [{label:'面诊诊疗方案'}]; c.videoSummary = '（测试准备）建议做所选项目。';
    c.krScope = {items:items.map(function(it){ return {name:it.name, price:it.price, note:'', stay:it.stay, anesthesia:it.anesthesia, postcare:(it.postcare||[]).map(function(x){ return Object.assign({}, x); })}; }), overallNote:''};
    c.procedureItems = items; return items;
  }
  function pay(c, items){
    var total = items.reduce(function(s, it){ return s + it.price; }, 0), dep = Math.round(total*KR_DEPOSIT_RATE);
    c.settlementDone = true; c.settlementBatches = [{id:'B1', orderedBy:'A1 室长', settledBy:'客人', time:nowFullDt(), status:'active', krTotal:total, krDeposit:dep, krBalance:total-dep, inTotal:0}];
  }
  var MAKERS = {
    queen: function(){ var cl = mkClient('Queen'); var n1 = localName('LHALa peel'), n2 = localName('艺人水光焕肤'); var c = pastLocalCase(cl, [{name:'LHALa peel', qty:3, used:1, paid:2336400}, {name:'艺人水光焕肤', qty:2, used:0, paid:1758200}]); return {cl:cl, cases:[c], where:'IN（A1）', start:'新增预约（手机号 '+cl.phone+'）→ 到店 → 基础资料 → 选「持有项目使用」/ 新增项目。客人持有 '+n1+' 剩余 2 次、'+n2+' 剩余 2 次。'}; },
    zoe: function(){ var cl = mkClient('Zoe', {consentVer:'v0.5'}); var c = pastLocalCase(cl, [{name:'LHALa peel', qty:1, used:1, paid:2336400}]); return {cl:cl, cases:[c], where:'客人预约页 booking.html（手机号 '+cl.phone+'）', start:'用这个手机号在预约页验证 → 会要求重新签署同意书（客人档案里的同意书是旧版本 v0.5）。'}; },
    yuki: function(){ var cl = mkClient('Yuki'); var c = krBase(cl); withReport(c, [N1]); c.consultStatus = 'report_ready'; logCaseEvent(c, '测试准备', '测试准备：诊疗方案已到，项目确认中'); mark(c); updateCaseStage(c); return {cl:cl, cases:[c], where:'IN（A1）', start:'新增预约（手机号 '+cl.phone+'）→ 到店 → 接待时会提示「客人有进行中的案件」，可测接续。进行中案件 '+c.caseNo+'（项目确认中）。'}; },
    sara: function(){ var cl = mkClient('Sara'); var c = pastLocalCase(cl, [{name:'LHALa peel', qty:3, used:0, paid:2336400}, {name:'艺人水光焕肤', qty:2, used:0, paid:1758200}, {name:'LHALa peel', qty:1, used:0, paid:800000}]); return {cl:cl, cases:[c], where:'IN（A1）', start:'新增预约（手机号 '+cl.phone+'）→ 到店 → 基础资料顶部［退款服务］。客人有 3 个可退批次（都没用过：'+localName('LHALa peel')+' ×3、'+localName('艺人水光焕肤')+' ×2、'+localName('LHALa peel')+' ×1）。'}; },
    olivia: function(){ var cl = mkClient('Olivia'); var c = krBase(cl); withReport(c, [N1]); c.reportDate = D(-12); c.endNote = '客人不做项目'; c.procedureItems = []; /* 客人不做项目：没有赴韩项目（否则启动时 repairWronglyClosedCases 会把它当「赴韩进行中」重新打开） */ c.consultStatus = 'report_ready'; logCaseEvent(c, '测试准备', '测试准备：诊疗方案已出（12 天前），客人不做项目'); mark(c); finishCase(c, '未购买未使用'); return {cl:cl, cases:[c], where:'IN（A1）', start:'新增预约（手机号 '+cl.phone+'）→ 基础资料选「面诊」→ 关联之前案件 '+c.caseNo+'（延续既往面诊 / 沿用原诊疗方案，诊疗方案 12 天前，1 个月内）。'}; },
    mini: function(){ /* 老客，40 天前面诊过、KR 已发诊疗方案、案件已结束（仅出报告）：测「超过一个月不能沿用原诊疗方案」（Olivia 的反例，CMD-1013-09 补充 3） */
      var cl = mkClient('MINI'); var c = krBase(cl); withReport(c, [N1]); c.visitDate = D(-40); c.reportDate = D(-40); c.endNote = '客人不做项目'; c.procedureItems = []; c.consultStatus = 'report_ready';
      logCaseEvent(c, '测试准备', '测试准备：诊疗方案已出（40 天前），客人不做项目'); mark(c); finishCase(c, '未购买未使用');
      return {cl:cl, cases:[c], where:'IN（A1）', start:'新增预约（手机号 '+cl.phone+'）→ 基础资料选「面诊」→ 关联之前案件 '+c.caseNo+'：诊疗方案是 40 天前出的（超过 1 个月），不能沿用原诊疗方案、不能延续免除，只能重新面诊。'}; },
    c42: function(){
      var cl = mkClient('Case42'); var c = krBase(cl); var items = withReport(c, [N1, N2]); pay(c, items);
      c.krSchedule = {status:'arrived', confirmedDate:D(-4), confirmedTime:'11:00', primary:D(-4), backup:'', changePrimary:'', changeBackup:'', changeSubmitted:false}; c.hasArrived = true; c.krBalancePaid = true; c.krJudge = {result:'ok', settled:true, memo:'', by:'KM1 室长'};
      items.forEach(function(it){ it.done = true; }); c.krProcedureDone = true; c.pcBooked = true;
      var inn = localName('艺人水光焕肤'); var nb = grantHolding(cl.name, inn, '术后管理', c.id, D(-4), 3, false, {paid:0, list:0, pct:100, currency:'IDR'}); nb.pkg = true; nb.schedule = '术后第3天'; nb.prep = true;
      c.innCare = {lines:[{item:items[0].name, name:'术后消肿管理', mgmt:'术后管理', innName:inn, times:3, day:'第3、5、7天', days:[3,5,7]}], status:'granted', at:nowFullDt()};
      logCaseEvent(c, '测试准备', '测试准备：赴韩已完成，术后管理回印尼的部分已转为 0 元持有批次'); mark(c); finishCase(c, '未购买未使用');
      return {cl:cl, cases:[c], where:'IN（A1）', start:'新增预约（手机号 '+cl.phone+'）→ 到店；客人持有「'+inn+'」3 次（术后管理 · 套餐内含 0 元），来自已结案赴韩案件 '+c.caseNo+'，可测术后管理预约 / 使用并自动关联原案件。'}; },
    stagePay: function(){ var cl = mkClient('已付面诊费'); var c = krBase(cl); c.consultStatus = 'paid_waiting_kr'; logCaseEvent(c, '测试准备', '测试准备：客人已缴面诊费，待 KR 确认预计出报告时间'); mark(c); updateCaseStage(c);
      return {cl:cl, cases:[c], where:'KR（KM1 登录）', start:'案件 '+c.caseNo+' → 面诊 tab：确认预计出报告时间。'}; },
    stageW: function(){ var cl = mkClient('等待面诊'); var c = krBase(cl); c.consultStatus = 'awaiting_report'; c.consultAt = {date:D(1), time:'15:00'}; c.reportEta = D(2)+' 05:00';
      logCaseEvent(c, '测试准备', '测试准备：KR 已确认出报告时间，面诊还没开始'); mark(c); updateCaseStage(c);
      return {cl:cl, cases:[c], where:'KR（KM1 / KD1 登录）', start:'案件 '+c.caseNo+' → 面诊 tab：［开始面诊］。'}; },
    stageWO: function(){ var cl = mkClient('代表院长的面诊'); var c = krBase(cl); c.director = 'KO1 代表院长'; c.consultStatus = 'awaiting_report'; c.consultAt = {date:D(1), time:'16:00'}; c.reportEta = D(2)+' 05:00';
      logCaseEvent(c, '测试准备', '测试准备：负责院长是代表院长，面诊还没开始'); mark(c); updateCaseStage(c);
      return {cl:cl, cases:[c], where:'KR（KO1 登录）', start:'案件 '+c.caseNo+' → 代表院长只看自己负责的案件。'}; },
    stageA: function(){ var cl = mkClient('面诊结束'); var c = krBase(cl); c.consultStatus = 'awaiting_report'; c.consultAt = {date:todayStr(), time:'11:00'}; c.consultStartedAt = nowFullDt(); c.consultContentAt = nowFullDt(); c.reportEta = D(1)+' 05:00';
      var v = ((HOSPITAL_DATA[HID].vault = HOSPITAL_DATA[HID].vault || {})[(c.clinicId||CURRENT_CLINIC_ID)+':'+c.id] = {audio:[], transcripts:[{id:'tr'+Date.now(), ts:nowFullDt(), by:DIRECTOR, mode:'manual', text:'（测试准备）面诊内容：建议假体隆鼻 + 鼻翼缩小。', demo:true}], drafts:[], history:[{ts:nowFullDt(), by:DIRECTOR, action:'测试准备：已上传面诊内容'}]});
      logCaseEvent(c, '测试准备', '测试准备：面诊已结束，院长已上传面诊内容，待 KR 室长发送诊疗方案'); mark(c); updateCaseStage(c);
      return {cl:cl, cases:[c], where:'KR（KM1 登录）', start:'案件列表 / 工作台 → '+c.caseNo+' → 面诊 tab：AI 整理 → 勾选项目（施术项目 + 管理项目）→ 发送诊疗方案。'}; },
    stageB: function(){ var cl = mkClient('已付定金'); var c = krBase(cl); var items = withReport(c, [N1, N2]); pay(c, items);
      c.krSchedule = {status:'pending', primary:D(10), backup:D(11), confirmedDate:'', confirmedTime:'', changePrimary:'', changeBackup:'', changeSubmitted:false};
      logCaseEvent(c, '测试准备', '测试准备：客人已付定金并递交施术日期（首选 '+D(10)+'，备选 '+D(11)+'），待 KR 确认施术时间'); mark(c); updateCaseStage(c);
      return {cl:cl, cases:[c], where:'KR（KM1 登录）', start:'案件 '+c.caseNo+' → 施术 tab：选日期、到院时间、地址 → 确认（可试非营业时间确认弹窗）。'}; },
    stageC: function(){ var cl = mkClient('待到院'); var c = krBase(cl); var items = withReport(c, [N1, N2]); pay(c, items);
      var date = seedSurgeryDate(HID, DIRECTOR, D(8), '11:00'); c.krSchedule = {status:'confirmed', primary:date, backup:'', confirmedDate:date, confirmedTime:'11:00', address:'（测试准备）首尔市江南区', changePrimary:'', changeBackup:'', changeSubmitted:false};
      logCaseEvent(c, '测试准备', '测试准备：施术时间已确认 '+date+' 11:00，待客人到院（2 个赴韩项目，其中有术后管理）'); mark(c); updateCaseStage(c); try{ syncSurgeryBlock(c); }catch(e){} try{ syncSurgerySub(c); }catch(e){} /* 施术一行（项目进程里的「施术」子项） */
      return {cl:cl, cases:[c], where:'KR（KM1 登录）', start:'案件 '+c.caseNo+' → 施术 tab Step 1：［客人已到医院］→ 评估（3-1 / 3-2 / 3-3）→ 付清尾款 → 术后管理预约。IN 不再分配术后管理（弹窗默认未选）。'}; }
  };
  /* CMD-1015-06：第 2 轮一键准备——一个按钮建好这条故事线要的全部客人，名字固定（任务页表格）；再按一次 → 名字后加 (2) */
  function batch(group, names, maker, where, start){
    return function(){
      var cls = [], cases = [];
      names.forEach(function(nm){
        NAMER = function(){ return uniqFull('R2-'+group+' '+nm); };
        try{ var r = MAKERS[maker](); cls.push(r.cl); cases = cases.concat(r.cases); }finally{ NAMER = null; }
      });
      return {cl:cls[0], cls:cls, cases:cases, where:where, start:start};
    };
  }
  MAKERS.r2_02 = batch('02', ['Bunga','Citra','Dewi','Eka'], 'stageC', 'KR（KM1 登录）', '4 位客人都是「施术时间已确认，待到院」：案件 → 施术 tab：［客人已到医院］→ 评估 → 付清尾款 → 术后管理预约。');
  MAKERS.r2_03 = batch('03', ['Fitri','Gita','Indah','Jelita','Kirana','Lina','Mega','Nur','Okta','Prita','Ririn','Suci','Tiara'], 'stageB', 'KR（KM1 登录）', '13 位客人都已付定金、已递交施术日期，待 KR 确认施术时间：案件 → 施术 tab：选日期、到院时间、地址 → 确认。');
  function oldCust(group, pairs, where, start){
    return function(){
      var cls = [], cases = [];
      pairs.forEach(function(p){
        NAMER = function(){ return uniqFull('R2-'+group+' '+p[0]); };
        try{ var r = MAKERS[p[1]](); cls.push(r.cl); cases = cases.concat(r.cases); }finally{ NAMER = null; }
      });
      return {cl:cls[0], cls:cls, cases:cases, where:where, start:start};
    };
  }
  MAKERS.r2_07 = oldCust('07', [['Yanti','sara'],['Zahra','queen'],['Rosa','zoe'],['Melati','yuki'],['Intan','olivia']], 'IN（A1）/ 客人预约页', 'Yanti = 有 3 个可退持有批次；Zahra = 只有持有（LHALa peel 剩 2 次、艺人水光焕肤 2 次）；Rosa = 同意书旧版本 v0.5（预约页验证后要重签）；Melati = 已有进行中案件（项目确认中）；Intan = 12 天前出过诊疗方案、客人不做项目。新增预约（手机号见下）→ 到店 → 基础资料。');
  MAKERS.r2_09 = oldCust('09', [['Wati','c42']], 'IN（A1）', 'Wati：赴韩已结案，客人持有回印尼的术后管理（0 元，套餐内含）。新增预约 → 到店 → 本地管理 → 做术后管理。');
  var MAKERS_END = true;
  var LABEL = {queen:'Queen（老客 + 有剩余持有项目）', zoe:'Zoe（老客 + 同意书旧版本）', yuki:'Yuki（已有进行中的案件）', sara:'Sara（老客 + 3 个可退批次）', olivia:'Olivia（上个月出过诊疗方案）', mini:'MINI（40 天前出过诊疗方案，已超过一个月）', c42:'第 42 条（赴韩已结案 + 回印尼术后管理持有）', stagePay:'已缴面诊费，待 KR 确认出报告时间', stageA:'面诊结束，待发送诊疗方案', stageB:'已付定金，待确认施术时间', stageC:'施术时间已确认，待到院'};
  LABEL.r2_02 = '第 2 轮 02：待到院 ×4'; LABEL.r2_03 = '第 2 轮 03：已付定金 ×13'; LABEL.r2_07 = '第 2 轮 07：老客 ×5'; LABEL.r2_09 = '第 2 轮 09：回印尼术后管理';
  window.TESTPREP_LABEL = LABEL; window.TESTPREP_MAKE = function(key, cfg){
    var keep = [HID, DIRECTOR, COORD, N1, N2];
    if(cfg){ HID = cfg.hid; DIRECTOR = cfg.director; COORD = cfg.coord; var ps = ((HOSPITAL_DATA[HID]||{}).projects||[]).filter(function(p){ return p.price>0; }); N1 = (ps[0]||{}).name; N2 = (ps[1]||ps[0]||{}).name; }
    try{ var r = MAKERS[key](); touched.forEach(function(c){ (c.logEntries||[]).forEach(function(e){ e.prep = true; }); }); return r; }
    finally{ HID = keep[0]; DIRECTOR = keep[1]; COORD = keep[2]; N1 = keep[3]; N2 = keep[4]; }
  }; /* selftest / roletest 自建数据用 */
  window.testPrepRun = function(){
    var key = qs('make'), out = document.getElementById('out');
    if(!MAKERS[key]){ out.innerHTML = '<p>没有这个选项：'+key+'</p>'; return; }
    try{
      var r = MAKERS[key]();
      touched.forEach(function(c){ (c.logEntries||[]).forEach(function(e){ e.prep = true; }); }); /* finishCase 等之后补写的系统记录也算准备 */
      Store.touch();
      setTimeout(function(){ Store.touch(); }, 400);
      out.innerHTML = '<h2>已建好：'+LABEL[key]+'</h2>'+
        '<p>客人：'+(r.cls || [r.cl]).map(function(c){ return '<b>'+c.name+'</b>（'+c.phone+'）'; }).join('、')+'</p>'+
        '<p>案件：'+r.cases.map(function(c){ return '<b>'+c.caseNo+'</b>'; }).join('、')+'（标记为测试准备，不算覆盖、不是演示数据，数据升级时会保留）</p>'+
        '<p>'+(clientByName(r.cl.name) ? '✓ 已写入诊所 '+CURRENT_CLINIC_ID+' 的客户列表（共 '+CLIENTS.length+' 位客人，客户列表 / 代约下拉里都找得到）' : '<span style="color:#C1454A;">⚠ 客人没有写进客户列表，请重试</span>')+'；IN 端必须用和这个页面<b>同一个地址</b>（'+location.origin+'）打开，localhost 和 127.0.0.1 的数据是分开的。</p>'+
        '<p>请用 <b>'+r.where+'</b> 登录，从这里开始：</p><div class="start">'+r.start+'</div>'+
        '<p class="muted">登录页：<a href="/login.html" target="_blank">/login.html</a>；可以关掉这个页面。再按一次同一个按钮，客人名字后会加 '+(/^r2_/.test(key) ? '(2)' : '编号')+'，不会撞名。</p>';
    }catch(e){ console.error(e); out.innerHTML = '<p style="color:#C1454A;">创建失败：'+(e&&e.message||e)+'</p>'; }
  };
})();
