/* shared/coverage.js —— 测试覆盖页（CMD-1012-06，开发用，不属于产品功能）
   只读浏览器 localStorage 里的存档（gmc_state / gmc_clinic_*），不加载 data.js，所以不会触发「演示数据版本重置」。
   按每个案件的 Timeline（logEntries）和状态字段，对照情况清单逐条判断是否发生过。 */
(function(){
  var SRC = {raw:null, label:''};          /* 当前分析的数据：raw = {存档键: JSON 字符串} */
  var DATA = null, RESULT = null;

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  function pj(s){ try{ return JSON.parse(s); }catch(e){ return null; } }

  /* ---------- 读取 ---------- */
  function collectLive(){ var o = {}; Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_')===0 && k.indexOf('gmc_backup_')!==0 && k.indexOf('gmc_cfg_')!==0; }).forEach(function(k){ o[k] = localStorage.getItem(k); }); return o; }
  function parseRaw(raw){
    var d = {cases:[], clients:[], holdings:{}, phHistory:[], notifs:[], hospitalNotifs:[], ver:raw.gmc_demo_ver || '', clinics:[]};
    Object.keys(raw).filter(function(k){ return k.indexOf('gmc_clinic_')===0; }).sort().forEach(function(k){
      var p = pj(raw[k]); if(!p || !p.vars) return; var cid = k.replace('gmc_clinic_',''), v = p.vars; d.clinics.push(cid);
      (v.CASE_ITEMS||[]).forEach(function(c){ c.__clinic = cid; d.cases.push(c); });
      (v.CLIENTS||[]).forEach(function(c){ c.__clinic = cid; d.clients.push(c); });
      Object.keys(v.CLIENT_HOLDINGS||{}).forEach(function(n){ d.holdings[cid+'|'+n] = v.CLIENT_HOLDINGS[n]; });
      (v.PLACEHOLDER_HISTORY||[]).forEach(function(h){ d.phHistory.push(Object.assign({__clinic:cid}, h)); });
      (v.NOTIFS||[]).forEach(function(n){ d.notifs.push(Object.assign({__clinic:cid}, n)); });
    });
    var g = pj(raw.gmc_state); var hd = g && g.vars && g.vars.HOSPITAL_DATA;
    if(hd) Object.keys(hd).forEach(function(h){ (hd[h].notifs||[]).forEach(function(n){ d.hospitalNotifs.push(Object.assign({__hospital:h}, n)); }); });
    /* 一键准备的案件（prep:true，CMD-1013-05）：准备阶段自动产生的 Timeline（prep:true）不算覆盖；用户还没动过的准备案件整个跳过（只单独列出），动过之后只算用户亲手做的步骤 */
    d.prepCases = [];
    d.cases.forEach(function(c){ c.__prep = !!c.prep; c.__prepOnly = c.__prep && !(c.logEntries||[]).some(function(e){ return !e.prep; }); if(c.__prepOnly) d.prepCases.push(c); });
    d.cases = d.cases.filter(function(c){ return !c.__prepOnly; });
    d.cases.forEach(function(c){ c.__t = (c.logEntries||[]).filter(function(e){ return !e.prep; }).map(function(e){ return e.action||''; }).join('\n'); c.__demo = c.demo===true || (c.demo===undefined && !/^r\d{9,}/.test(String(c.id))); /* 演示案件 = 种子建立的（demo 标记）；用户自己新建的案件 id 是 r+时间戳 */ });
    return d;
  }

  /* ---------- 情况清单 ---------- */
  /* eval 返回 {hits:[{c, note, dt}]}；auto:false = 无法自动判断（note 写原因） */
  function T(c){ return c.__t; }
  function re(c, rx){ return rx.test(T(c)); }
  function firstDt(c, rx){ var e = (c.logEntries||[]).filter(function(x){ return !x.prep && rx.test(x.action||''); })[0]; return e ? e.dt : ''; }
  function krItems(c){ return (c.procedureItems||[]).filter(function(i){ return i.origin==='KR'; }); }
  function byCase(pred, rx){ return function(d){ return {hits:d.cases.filter(pred).map(function(c){ return {c:c, dt:rx ? firstDt(c, rx) : '', rx:rx||null}; })}; }; };
  function logHit(rx, extra){ return byCase(function(c){ return re(c, rx) && (!extra || extra(c)); }, rx); }
  function holdFlag(flag){
    return function(d){ var hits = [];
      d.cases.forEach(function(c){ var hs = d.holdings[c.__clinic+'|'+c.name] || []; hs.forEach(function(h){ (h.batches||[]).forEach(function(b){ if(b.caseId===c.id && b[flag] && !hits.some(function(x){ return x.c===c; })) hits.push({c:c, dt:b.date||'', note:h.itemName}); }); }); });
      return {hits:hits}; };
  }
  function postBook(pred){
    return function(d){ return {hits:d.cases.filter(function(c){ return (c.subItems||[]).some(function(s){ return s.pcb && pred(s); }); }).map(function(c){ return {c:c, dt:firstDt(c, /术后管理预约/)}; })}; };
  }
  var CHECKS = [
    ['A','到店前 / 接待'],
    ['A1','室长取消预约', logHit(/取消该客人的到店预约/), '看 Timeline「取消该客人的到店预约」'],
    ['A2','未到店 → 重新预约', function(d){ var hits = [];
        d.cases.filter(function(c){ return c.cancelReason==='未到店' || c.noShow; }).forEach(function(c){
          var t0 = (c.logEntries||[])[0] ? c.logEntries[0].dt : '';
          if(d.cases.some(function(o){ return o!==c && o.name===c.name && o.__clinic===c.__clinic && (((o.logEntries||[])[0]||{}).dt > t0 || (((o.logEntries||[])[0]||{}).dt === t0 && String(o.caseNo) > String(c.caseNo))); })) hits.push({c:c, dt:firstDt(c, /未到店/)}); });
        return {hits:hits}; }, '案件取消原因「未到店」+ 同一客人之后又有新案件'],
    ['A3','预约修改后到店', logHit(/修改预约为/, function(c){ return /标记客人已到店/.test(T(c)); }), 'Timeline「修改预约为」且之后「标记客人已到店」'],
    ['A4','接待未保存离开 → 退回待访问', logHit(/接待未完成，退回待访问|取消接待，案件回到待访问/), 'Timeline「接待未完成，退回待访问」/「取消接待…」'],
    ['A5','接续另一个进行中案件 → 本案作废', logHit(/接续到访/), '原案件 Timeline「接续到访」（作废的新案件已从列表移除，只能从原案件侧判断）'],
    ['B','不面诊（本地）'],
    ['B6','选购 → 付款 → 使用 → 结案', logHit(/本地项目已转入客户持有/, function(c){ return c.stage==='closed' && /使用了/.test(T(c)); }), '结案 + Timeline「本地项目已转入客户持有」+「使用了」'],
    ['B7','只用以前持有的项目 → 结案', logHit(/使用了/, function(c){ return c.stage==='closed' && !/本地项目已转入客户持有|完成项目付款/.test(T(c)) && !krItems(c).length; }), '结案 + 有「使用了」+ 没有本次付款'],
    ['B8','使用中管理取消（次数归还）', logHit(/标记取消（次数已归还持有/), 'Timeline「标记取消（次数已归还持有…」'],
    ['B9','本次不购买 → 已取消', logHit(/本次不购买项目/, function(c){ return c.stage==='cancelled'; }), 'Timeline「本次不购买项目」+ 主状态已取消'],
    ['B10','只办退款 → 已取消（仅办理退款）', byCase(function(c){ return c.stage==='cancelled' && /仅办理退款/.test(String(c.cancelReason||'')); }), '案件最终为已取消（取消原因「仅办理退款」）；还在接待 / 面诊中、只是办过退款的不算（CMD-1013-04）'],
    ['B11a','买活动价项目', holdFlag('promo'), '持有批次标记 promo（购买案件）'],
    ['B11b','买套餐', holdFlag('pkgPaid'), '持有批次标记 pkgPaid'],
    ['B11c','送서비스', holdFlag('service'), '持有批次标记 service'],
    ['B12','本地案件中途增加面诊', logHit(/发起"增加面诊"/), 'Timeline「发起"增加面诊"」'],
    ['C','面诊到出诊疗方案'],
    ['C13','待缴费时取消面诊 → 转不面诊', logHit(/面诊取消（面诊费已取消）/), 'Timeline「面诊取消（面诊费已取消）」'],
    ['C14','面诊费免除', logHit(/免除面诊费/), 'Timeline「免除面诊费」'],
    ['C15','出诊疗方案后客人不做项目 → 仅出报告', logHit(/客人不做项目/, function(c){ return c.stage==='reportonly'; }), 'Timeline「客人不做项目」+ 仅出报告'],
    ['C17','延续既往面诊、沿用原诊疗方案', logHit(/沿用原(诊疗方案|报告)|沿用之前(诊疗方案|报告)/), 'Timeline「沿用原诊疗方案」'],
    ['D','赴韩'],
    ['D18','赴韩无变动 → 结案', byCase(function(c){ return c.stage==='closed' && c.krJudge && c.krJudge.result==='ok' && c.krBalancePaid; }), '结案 + 到院评估「原方案不变」+ 已付清尾款'],
    ['D19','术后管理回印尼使用（关联原案件）', logHit(/术后管理项目，自动关联|由赴韩案件.*子项.*自动关联原案件/), '新案件 Timeline「自动关联」到赴韩案件'],
    ['D20','到院前取消部分项目 + 加项', logHit(/取消项目"/, function(c){ return /已生成结算单（批次 B[2-9]/.test(T(c)); }), 'Timeline「取消项目」+ 有第 2 张以上结算单'],
    ['D21','KR 无法安排 → 重选日期', logHit(/KR无法安排所选日期/), 'Timeline「KR无法安排所选日期」'],
    ['D22a','时间确认后改期', logHit(/申请修改施术日期/, function(c){ return /KR确认新施术时间/.test(T(c)); }), 'Timeline「申请修改施术日期」+「KR确认新施术时间」'],
    ['D22b','改期时 2 周内被挡', function(){ return {void:true, note:'施术前 2 周不可改期的限制已拿掉（CMD-1012-13），不计入覆盖率'}; }, '已作废'],
    ['D23','到院后调整方案 → 多退少补 → 结案', byCase(function(c){ return c.stage==='closed' && c.krJudge && c.krJudge.result==='changed'; }), '结案 + 到院评估「需要调整方案」'],
    ['D24','全部不能做 → 在韩重新约', logHit(/KR在韩国重新预约施术时间/), 'Timeline「KR在韩国重新预约施术时间」'],
    ['D25','全部不能做 → 退定金 → 仅出报告', logHit(/KR判断：不能施术，定金/, function(c){ return c.stage==='reportonly'; }), 'Timeline「KR判断：不能施术，定金…」+ 仅出报告'],
    ['D26','在韩加做项目', logHit(/KR增加项目/), 'Timeline「KR增加项目」'],
    ['D27a','到院前取消全部赴韩项目（无本地项目）→ 做本地', logHit(/询问是否增加本地项目/, function(c){ return !/点［无法协调］/.test(T(c)) && /客人要做\/增加本地项目/.test(T(c)); }), 'Timeline「询问是否增加本地项目」（没有「点［无法协调］」）+「客人要做/增加本地项目」'],
    ['D27b','到院前取消全部赴韩项目（无本地项目）→ 不做', logHit(/询问是否增加本地项目/, function(c){ return !/点［无法协调］/.test(T(c)) && /客人不做\/不增加本地项目/.test(T(c)); }), 'Timeline「询问是否增加本地项目」（没有「点［无法协调］」）+「客人不做/不增加本地项目」'],
    ['D28a','无法协调（时间确认前，有本地项目）→ 保留并使用', logHit(/室长选择保留本案件的本地项目/, function(c){ return /点［无法协调］/.test(T(c)) && /使用了/.test(T(c)); }), 'Timeline「室长点［无法协调］」+「室长选择保留」+「使用了」（无法协调只在施术时间确认前出现，CMD-1012-12）'],
    ['D28b','无法协调（时间确认前，有本地项目）→ 保留但这次不做', logHit(/室长选择保留本案件的本地项目/, function(c){ return /点［无法协调］/.test(T(c)) && /本次不使用任何持有项目/.test(T(c)); }), 'Timeline「室长点［无法协调］」+「室长选择保留」+「本次不使用任何持有项目」'],
    ['D28c','无法协调（时间确认前，有本地项目）→ 全退', logHit(/室长选择全部退款/, function(c){ return /点［无法协调］/.test(T(c)); }), 'Timeline「室长点［无法协调］」+「室长选择全部退款」'],
    ['D29a','无法协调（时间确认前，无本地项目）→ 增加本地', logHit(/点［无法协调］/, function(c){ return /询问是否增加本地项目/.test(T(c)) && /客人要做\/增加本地项目/.test(T(c)); }), 'Timeline「室长点［无法协调］」+「询问是否增加本地项目」+「客人要做/增加本地项目」（CMD-1012-06 补记）'],
    ['D29b','无法协调（时间确认前，无本地项目）→ 不加', logHit(/点［无法协调］/, function(c){ return /询问是否增加本地项目/.test(T(c)) && /客人不做\/不增加本地项目/.test(T(c)); }), 'Timeline「室长点［无法协调］」+「询问是否增加本地项目」+「客人不做/不增加本地项目」'],
    ['D31a','取消项目（时间确认后，取消全部赴韩，有本地项目）→ 保留并使用', logHit(/室长选择保留本案件的本地项目/, function(c){ return !/点［无法协调］/.test(T(c)) && /使用了/.test(T(c)); }), 'Timeline「室长选择保留」+「使用了」，且没有「点［无法协调］」（取消项目在施术时间确认后，CMD-1012-12）'],
    ['D31b','取消项目（时间确认后，有本地项目）→ 保留但这次不做', logHit(/室长选择保留本案件的本地项目/, function(c){ return !/点［无法协调］/.test(T(c)) && /本次不使用任何持有项目/.test(T(c)); }), 'Timeline「室长选择保留」+「本次不使用任何持有项目」，没有「点［无法协调］」'],
    ['D31c','取消项目（时间确认后，有本地项目）→ 全退', logHit(/室长选择全部退款/, function(c){ return !/点［无法协调］/.test(T(c)); }), 'Timeline「室长选择全部退款」，没有「点［无法协调］」'],
    ['D30','面诊或赴韩案件中添加本地管理', logHit(/添加本地管理（同日插做本地项目/), 'Timeline「添加本地管理」'],
    ['E','其他可从记录判断的'],
    ['E1','客人自助预约（新客）', byCase(function(c){ return c.bookClient==='new'; }), '案件字段 bookClient=new（CMD-1012-06 起记录）'],
    ['E2','客人自助预约（老客）', byCase(function(c){ return c.bookClient==='old'; }), '案件字段 bookClient=old（预约时这位客人已有档案）；和 E1 不会同时成立（CMD-1013-04）；没有 bookClient 的旧案件不计入 E1 / E2'],
    ['E3','老客旧版同意书重签', byCase(function(c){ return c.consentResigned; }), '案件字段 consentResigned（CMD-1012-06 起记录）'],
    ['E4','占位链接提交', byCase(function(c){ return c.bookEntry==='link' || /通过预约链接填完资料/.test(((c.logEntries||[])[0]||{}).action||''); }), '第一条记录「通过预约链接填完资料」'],
    ['E5','占位超时', function(d){ return {hits:d.phHistory.filter(function(h){ return h.status==='占位失效'; }).map(function(h){ return {c:null, label:h.phone+' '+h.date+' '+h.time, dt:h.date}; })}; }, '预约占位历史「占位失效」'],
    ['E6','已到医院撤回', logHit(/撤回"已到医院"/), 'Timeline「KR撤回已到医院」'],
    ['E7a','术后管理预约 — 在韩国', postBook(function(s){ return s.place==='KR'; }), '子项 pcb + place=KR'],
    ['E7b','术后管理预约 — 回印尼做', postBook(function(s){ return s.place==='IN'; }), '子项 pcb + place=IN'],
    ['E7c','术后管理预约 — 请 IN 代约', postBook(function(s){ return !!s.informed; }), '子项 pcb + informed'],
    ['E7d','IN 代约成功（关联原案件）', logHit(/IN 室长预约了/), 'Timeline「IN 室长预约了」'],
    ['E8','催办', logHit(/催办 KR 室长/), 'Timeline「催办 KR 室长」'],
    ['E9','未接来电', function(d){ var hits = [];
        d.notifs.concat(d.hospitalNotifs).forEach(function(n){ if(/未接来电/.test(n.text||'')){ var c = d.cases.filter(function(x){ return x.id===n.caseId && x.__clinic===(n.__clinic||x.__clinic); })[0]; if(c) hits.push({c:c, label:(n.text||'').slice(0,40), dt:n.ts||''}); } });
        return {hits:hits}; }, '通知里有「未接来电」（通知保留 90 天）'],
    ['E10','持有项目退款', logHit(/持有批次退款|退款服务：/), 'Timeline「…办理持有批次退款」或「退款服务：…」'],
    ['E11','重新选择项目（待付款）', logHit(/待付款结算单.*退回重新选择项目/), 'Timeline「待付款结算单…退回重新选择项目」'],
    ['F','新增功能（CMD-1012-02 / 05）'],
    ['F1','开始面诊', logHit(/开始面诊/), 'Timeline「开始面诊」'],
    ['F2','上传面诊内容 → 面诊结束', logHit(/上传面诊内容，面诊结束/), 'Timeline「上传面诊内容，面诊结束」'],
    ['F3','院长评估：可以手术，原方案不变', logHit(/院长评估结果：可以手术，原方案不变/), 'Timeline「院长评估结果」'],
    ['F4','院长评估：需要调整方案', logHit(/院长评估结果：可以手术，但需要调整方案/), 'Timeline「院长评估结果」'],
    ['F5','院长评估：不建议手术', logHit(/院长评估结果：不建议手术/), 'Timeline「院长评估结果」'],
    ['F6','生成诊疗方案 PDF', logHit(/生成诊疗方案 PDF/), 'Timeline「生成诊疗方案 PDF」'],
    ['H','赴韩取消 / 无法协调的退款方式（CMD-1014-03）'],
    ['H1','无法退款 → 转本地项目（代偿）', logHit(/赴韩定金转本地代偿：−Rp/), 'Timeline「赴韩定金转本地代偿：−Rp …」（取消项目 / 无法协调选「转本地项目（代偿）」并买完）'],
    ['G','手动结束案件（CMD-1013-16，新结案规则试行；开关关闭时不会出现）'],
    ['G1','面诊等报告时手动结束 → 仅出报告', logHit(/手动结束案件（付定金前，当时：面诊等报告）/, function(c){ return c.stage==='reportonly'; }), 'Timeline「手动结束案件（付定金前，当时：面诊等报告）」且结局仅出报告'],
    ['G2','项目确认中手动结束', logHit(/手动结束案件（付定金前，当时：项目确认中）/), 'Timeline「手动结束案件（付定金前，当时：项目确认中）」'],
    ['G3','本地没用完就手动结束（转持有 / 退款）', logHit(/结束案件：.*(转为客人持有|退款 )/), 'Timeline「结束案件：…转为客人持有」或「结束案件：退款 …」'],
    ['G4','有待收 / 待退时结束被挡', logHit(/案件暂不结束：还有未处理的款项/), 'Timeline「案件暂不结束：还有未处理的款项」']
  ];

  /* 把数据拆成「我的案件」和「演示案件」两份，各自判断；覆盖率只算我的 */
  function subset(d, demo){
    var o = Object.assign({}, d); o.cases = d.cases.filter(function(c){ return c.__demo===demo; });
    o.phHistory = d.phHistory.filter(function(h){ return /^phx/.test(String(h.id))===demo; });
    return o;
  }
  var ROUNDS = [1, 2];
  /* 给每次测到的记录补上：首次 / 最后一次的时间、版本章（提交 hash + 时间）、轮次（案件上的 round，没有的按第 1 轮） */
  function decorate(h){
    var c = h.c; h.round = c ? (parseInt(c.round,10) || 1) : 1;
    if(!c) return h;
    var ents = c.logEntries || [], m = h.rx ? ents.filter(function(e){ return h.rx.test(e.action||''); }) : [];
    var first = m[0], last = m[m.length-1];
    if(!last){ var st = ents.filter(function(e){ return e.ver; }); last = st[st.length-1]; first = first || st[0]; }
    h.ver = first && first.ver || ''; h.vt = first && first.vt || ''; h.lver = last && last.ver || ''; h.lvt = last && last.vt || ''; h.ldt = last && last.dt || h.dt || '';
    return h;
  }
  function evaluateOne(d){
    var groups = [], cur = null, covered = 0, total = 0, unjudge = [];
    CHECKS.forEach(function(ch){
      if(ch.length===2){ cur = {id:ch[0], title:ch[1], items:[]}; groups.push(cur); return; }
      var r = ch[2](d), item = {id:ch[0], title:ch[1], basis:ch[3]||'', auto:r.auto!==false && !r.void, void:!!r.void, note:r.note||'', hits:(r.hits||[]).map(decorate)};
      cur.items.push(item); if(!item.void) total++; /* 已作废的情况不计入覆盖率 */
      item.rounds = {}; ROUNDS.forEach(function(rd0){ item.rounds[rd0] = item.hits.filter(function(h){ return h.round===rd0; }).length; });
      item.last = item.hits.slice().sort(function(a,b){ return String(b.ldt||'').localeCompare(String(a.ldt||'')); })[0] || null;
      if(item.void){} else if(!item.auto) unjudge.push(item); else if(item.hits.length) covered++;
    });
    var roundCov = {}; ROUNDS.forEach(function(rd0){ roundCov[rd0] = 0; groups.forEach(function(g){ g.items.forEach(function(it){ if(it.auto && it.rounds[rd0]) roundCov[rd0]++; }); }); });
    return {groups:groups, covered:covered, total:total, unjudge:unjudge, roundCov:roundCov};
  }

  function evaluate(d){
    var u = evaluateOne(subset(d, false)), m = evaluateOne(subset(d, true));
    u.groups.forEach(function(g, gi){ g.items.forEach(function(it, ii){ it.demoHits = m.groups[gi].items[ii].hits; }); });
    u.demoCovered = m.covered; return u;
  }

  /* ---------- 案件路径 ---------- */
  function casePath(c){
    var seq = [], last = null;
    (c.logEntries||[]).forEach(function(e){ var st = e.stage || ''; if(st && st!==last){ seq.push(st); last = st; } });
    return seq;
  }
  function caseLink(c){
    var acct = c.__clinic==='C2' ? 'B1' : c.__clinic==='C3' ? 'D1' : 'A1';
    return '/in.html?demo='+acct+'&case='+encodeURIComponent(c.caseNo||c.id);
  }
  function caseTag(c){ return esc((c.caseNo||c.id)+' · '+c.name)+(c.prep ? ' <span class="pill">🧪一键准备</span>' : ''); }

  /* ---------- 渲染 ---------- */
  function render(){
    RESULT = evaluate(DATA);
    document.getElementById('sum').textContent = '已覆盖 '+RESULT.covered+' / 共 '+RESULT.total+'（其中 '+RESULT.unjudge.length+' 条无法自动判断；只算你自己新建的案件）　第 1 轮 '+RESULT.roundCov[1]+'　第 2 轮 '+RESULT.roundCov[2];
    document.getElementById('sumsub').textContent = '数据来源：'+SRC.label+'；数据版本 '+(DATA.ver||'?')+'；你的案件 '+DATA.cases.filter(function(c){ return !c.__demo; }).length+' 个、演示案件 '+DATA.cases.filter(function(c){ return c.__demo; }).length+' 个（诊所 '+DATA.clinics.join('、')+'）；演示案件另外显示，不计入覆盖率（演示案件里已有 '+RESULT.demoCovered+' 条情况）';
    document.getElementById('checks').innerHTML = RESULT.groups.map(function(g){
      return '<div class="grp">'+esc(g.id+' '+g.title)+'</div><div class="card" style="padding:4px 18px;">'+g.items.map(function(it){
        var mk = it.void ? '🚫' : !it.auto ? '❔' : it.hits.length ? '✅' : '⬜';
        var first = it.hits.slice().sort(function(a,b){ return String(a.dt||'').localeCompare(String(b.dt||'')); })[0];
        var demoLine = it.auto && it.demoHits && it.demoHits.length ? '<div class="muted" style="opacity:.7;">演示案件里也有 '+it.demoHits.length+' 次（不计入覆盖率）：'+it.demoHits.slice(0,3).map(function(h){ return h.c ? '<a href="'+caseLink(h.c)+'" target="_blank">'+caseTag(h.c)+'</a>' : esc(h.label||''); }).join('、')+'</div>' : '';
        var rmk = it.auto ? ROUNDS.map(function(r0){ return '第'+r0+'轮 '+(it.rounds[r0] ? '✅'+it.rounds[r0] : '⬜'); }).join('　') : '';
        var lastLine = it.auto && it.last ? '最后一次：'+(it.last.c ? '<a href="'+caseLink(it.last.c)+'" target="_blank">'+caseTag(it.last.c)+'</a>' : esc(it.last.label||''))+' · '+esc(String(it.last.ldt||'').slice(0,16))+' · 版本 '+esc(it.last.lver||'（无版本章）')+(it.last.lvt ? '（'+esc(it.last.lvt)+'）' : '')+' · 第 '+it.last.round+' 轮' : '';
        var who = it.hits.length ? '第一次：'+(first.c ? '<a href="'+caseLink(first.c)+'" target="_blank">'+caseTag(first.c)+'</a>' : esc(first.label||''))+(first.dt ? ' · '+esc(String(first.dt).slice(0,16)) : '')+(first.note ? ' · '+esc(first.note) : '')+' · 发生 '+it.hits.length+' 次' : '';
        return '<div class="row"><span class="mk">'+mk+'</span><span class="id">'+esc(it.id)+'</span><span style="flex:1;"><b>'+esc(it.title)+'</b><div class="muted">'+(!it.auto ? esc(it.note) : who || '没发生过')+'</div>'+(lastLine ? '<div class="muted">'+lastLine+'</div>' : '')+(rmk ? '<div class="muted" style="font-weight:700;">'+rmk+'</div>' : '')+demoLine+'<div class="muted" style="opacity:.7;">判断依据：'+esc(it.basis||'—')+'</div></span></div>';
      }).join('')+'</div>';
    }).join('');
    var caseCard = function(cs){ return cs.slice().sort(function(a,b){ return String(a.caseNo).localeCompare(String(b.caseNo)); }).map(function(c){
      var path = casePath(c);
      return '<div class="card" style="padding:8px 14px;"><details><summary><b>'+caseTag(c)+'</b> <span class="pill">'+esc(c.__clinic)+'</span><span class="pill">'+esc(c.stage)+'</span>'+(c.__demo ? '' : '<span class="pill" style="background:#E6EEFB;">第 '+(parseInt(c.round,10)||1)+' 轮</span>')+' <span class="muted">'+esc(path.join(' → '))+'</span> <a href="'+caseLink(c)+'" target="_blank">打开</a></summary>'+
        (c.__demo ? '' : '<div style="font-size:12px;margin:6px 0 0 12px;">改这个案件的轮次：<select onchange="setCaseRound(\''+c.__clinic+'\',\''+String(c.id).replace(/'/g,'')+'\',this.value)">'+ROUNDS.map(function(r0){ return '<option value="'+r0+'"'+((parseInt(c.round,10)||1)===r0?' selected':'')+'>第 '+r0+' 轮</option>'; }).join('')+'</select></div>')+
        '<div class="path">'+(c.logEntries||[]).map(function(e){ return esc((e.dt||'').slice(0,16)+'　['+(e.stage||'')+'] '+(e.actor||'')+'：'+(e.action||'')+(e.ver ? '　〔'+e.ver+'〕' : '')); }).join('<br>')+'</div></details></div>'; }).join(''); };
    var mine = DATA.cases.filter(function(c){ return !c.__demo; }), demo = DATA.cases.filter(function(c){ return c.__demo; });
    var prepList = (DATA.prepCases||[]).map(function(c){ return '<div class="row"><span style="flex:1;">'+caseTag(c)+' <span class="muted">· 用户还没动过，不计入覆盖</span></span></div>'; }).join('');
    document.getElementById('cases').innerHTML = '<div class="grp">我的案件（'+mine.length+'）</div>'+(caseCard(mine) || '<div class="muted">还没有你新建的案件</div>')+
      '<details style="margin-top:14px;"><summary class="grp" style="display:inline-block;">🧪 一键准备的案件（'+(DATA.prepCases||[]).length+'，未动过，不计入覆盖率）</summary>'+(prepList || '<div class="muted">没有</div>')+'</details>'+
      '<details style="margin-top:14px;"><summary class="grp" style="display:inline-block;">演示案件（'+demo.length+'，不计入覆盖率）</summary>'+caseCard(demo)+'</details>';
    document.getElementById('unjudge').innerHTML = '<b>无法自动判断的情况</b>：'+(RESULT.unjudge.length ? RESULT.unjudge.map(function(i){ return esc(i.id+' '+i.title+'（'+i.note+'）'); }).join('；') : '无');
  }

  /* ---------- 数据来源 ---------- */
  function listBackups(){ return Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_backup_')===0 && k!=='gmc_backup_notice'; }).sort().reverse(); }
  /* 当前原型版本 + 测试轮次下拉（存浏览器 gmc_cfg_round，之后新建的案件自动带上当时的轮次） */
  function fillRound(){
    var cur = parseInt(localStorage.getItem('gmc_cfg_round'), 10) || 1, b = (typeof GMC_BUILD!=='undefined' && GMC_BUILD) ? GMC_BUILD : null;
    document.getElementById('roundbar').innerHTML = '当前测试轮次：<select onchange="localStorage.setItem(\'gmc_cfg_round\',this.value);fillRoundBar()">'+ROUNDS.map(function(r0){ return '<option value="'+r0+'"'+(cur===r0?' selected':'')+'>第 '+r0+' 轮</option>'; }).join('')+'</select> <span class="muted">之后新建的案件自动标上这个轮次；选错可在下面案件里改</span>　<span class="muted">当前原型版本：'+(b ? esc(b.h)+'（'+esc(b.t)+'）' : '未知')+'</span>';
    fillNewClose(); fillNewTodo(); fillNewCal(); fillNewStyle();
  }
  /* CMD-1013-16：新结案规则开关（gmc_cfg_newclose，默认开，'0' = 关；切换不动已存案件）+ 模拟到隔天（演示时钟 +24 小时，改 gmc_state 里的 DEMO_SHIFT_MS，打开的原型页面会同步） */
  function fillNewClose(){
    var on = localStorage.getItem('gmc_cfg_newclose')!=='0', el = document.getElementById('roundbar'); if(!el) return;
    el.innerHTML += '<div style="margin-top:8px;">新结案规则：<b>'+(on ? '开' : '关')+'</b> <button onclick="toggleNewClose()">'+(on ? '关闭（回到旧逻辑）' : '开启')+'</button> <span class="muted">默认开；关闭 = 完全照 de648c4 的旧逻辑；切换不动已存的案件状态</span>　<button onclick="shiftOneDay()">模拟到隔天</button> <span class="muted">演示时钟 +24 小时（测「本地管理只能当天加」）</span></div>';
  }
  /* CMD-1013-17：新待办 / 通知开关（gmc_cfg_newtodo，默认开）；切换后已打开的原型分页要刷新才生效 */
  function fillNewTodo(){
    var on = localStorage.getItem('gmc_cfg_newtodo')!=='0', el = document.getElementById('roundbar'); if(!el) return;
    el.innerHTML += '<div style="margin-top:8px;">新待办 / 通知：<b>'+(on ? '开' : '关')+'</b> <button onclick="toggleNewTodo()">'+(on ? '关闭（回到 ed2a41d 的样子）' : '开启')+'</button> <span class="muted">默认开；待办栏 / 默认日视图 / 现在时间线 / KR 卡片 8→4 / IN 4 张卡 / 弹出精简 / 催办新门槛；切换后原型分页刷新生效</span></div>';
  }
  /* CMD-1014-01：日历对齐 + 新待办 10/14 开关（gmc_cfg_newcal，默认开） */
  function fillNewCal(){
    var on = localStorage.getItem('gmc_cfg_newcal')!=='0', el = document.getElementById('roundbar'); if(!el) return;
    el.innerHTML += '<div style="margin-top:8px;">日历对齐 + 新待办 10/14：<b>'+(on ? '开' : '关')+'</b> <button onclick="toggleNewCal()">'+(on ? '关闭（回到 f3c7ab4 的样子）' : '开启')+'</button> <span class="muted">默认开；KR / 院长固定栏 + memo + 月视图 + 时段框 + 图例、IN 日视图整天格、时间范围前后 2 小时、点卡片筛选待办、已转告客人、确认日程无变动、院长 / KR 面诊待办；切换后原型分页刷新生效（KR 不能安排使用、两个 bug 修复不带开关）</span></div>';
  }
  /* CMD-1014-07：新样式 / 旧样式开关（gmc_cfg_newstyle，默认新样式） */
  function fillNewStyle(){
    var on = localStorage.getItem('gmc_cfg_newstyle')!=='0', el = document.getElementById('roundbar'); if(!el) return;
    el.innerHTML += '<div style="margin-top:8px;">设计系统样式：<b>'+(on ? '新样式' : '旧样式')+'</b> <button onclick="toggleNewStyle()">'+(on ? '切回旧样式' : '切到新样式')+'</button> <span class="muted">默认新样式；只换颜色 / 字体 / 圆角 / 图标；切换后原型分页要刷新</span></div>';
  }
  window.toggleNewStyle = function(){ localStorage.setItem('gmc_cfg_newstyle', localStorage.getItem('gmc_cfg_newstyle')==='0' ? '1' : '0'); fillRound(); };
  window.toggleNewCal = function(){ localStorage.setItem('gmc_cfg_newcal', localStorage.getItem('gmc_cfg_newcal')==='0' ? '1' : '0'); fillRound(); };
  window.toggleNewTodo = function(){ localStorage.setItem('gmc_cfg_newtodo', localStorage.getItem('gmc_cfg_newtodo')==='0' ? '1' : '0'); fillRound(); };
  window.toggleNewClose = function(){ localStorage.setItem('gmc_cfg_newclose', localStorage.getItem('gmc_cfg_newclose')==='0' ? '1' : '0'); fillRound(); };
  window.shiftOneDay = function(){
    var g = pj(localStorage.getItem('gmc_state')); if(!g || !g.vars){ alert('没有找到存档'); return; }
    g.vars.DEMO_SHIFT_MS = (+g.vars.DEMO_SHIFT_MS || 0) + 86400000; localStorage.setItem('gmc_state', JSON.stringify(g)); alert('演示时钟已往后拨 1 天（累计 '+Math.round(g.vars.DEMO_SHIFT_MS/86400000)+' 天）。已打开的原型页面会自动同步。');
  };
  window.fillRoundBar = fillRound;
  window.setCaseRound = function(clinic, caseId, round){
    var key = 'gmc_clinic_'+clinic, p = pj(localStorage.getItem(key)); if(!p || !p.vars) return;
    var c = (p.vars.CASE_ITEMS||[]).filter(function(x){ return String(x.id)===String(caseId); })[0]; if(!c) return;
    c.round = parseInt(round, 10) || 1;
    try{ localStorage.setItem(key, JSON.stringify(p)); }catch(e){ alert('保存失败：存档太大'); return; }
    if(SRC.label==='当前浏览器数据'){ SRC.raw[key] = localStorage.getItem(key); DATA = parseRaw(SRC.raw); render(); } else window.loadSource();
  };
  function fillSources(){
    var sel = document.getElementById('src'), opts = '<option value="live">当前浏览器里的数据</option>';
    listBackups().forEach(function(k){ var r = pj(localStorage.getItem(k)); opts += '<option value="'+k+'">自动备份 '+esc((r&&r.exportedAt||'').slice(0,19).replace('T',' '))+'（'+esc(r&&r.reason||'')+'）</option>'; });
    if(SRC.imported) opts += '<option value="imported" selected>导入的文件：'+esc(SRC.imported.name)+'</option>';
    sel.innerHTML = opts; if(SRC.imported) sel.value = 'imported';
    var n = pj(localStorage.getItem('gmc_backup_notice'));
    var mg = pj(localStorage.getItem('gmc_cfg_migration')), mgHtml = '';
    if(mg){
      var bad = mg.failed || [];
      mgHtml = '<div class="warn" style="'+(bad.length ? '' : 'background:#E7F3EC;color:#2F6B4A;')+'">数据版本 '+esc(mg.from||'?')+' → '+esc(mg.to||'?')+'（'+esc((mg.at||'').slice(0,19).replace('T',' '))+'）：用户案件已迁移 '+mg.migrated+' 个'+(bad.length ? '；<b>以下案件未能迁移：</b>'+bad.map(function(f){ return esc((f.caseNo||'')+' '+(f.name||'')+'（'+f.reason+'）'); }).join('；')+'。它们没有丢，仍在升级前的自动备份里（下拉选「自动备份」查看 / 导出）。' : '。')+
        ((mg.notes||[]).length ? '<div style="margin-top:4px;">迁移备注：'+mg.notes.map(function(x){ return esc(x.caseNo+' '+x.name+'：'+x.notes.join('、')); }).join('；')+'</div>' : '')+'</div>';
    }
    document.getElementById('notice').innerHTML = mgHtml+(n ? '<div class="warn">ℹ 最近一次自动备份：'+esc(n.name)+'（'+esc(n.reason)+'，'+esc(new Date(n.t).toLocaleString())+'）。浏览器里存了一份（最近 3 份），下拉里选它即可查看；需要文件时点「导出完整备份」自己下载。</div>' : '');
  }
  window.loadSource = function(){
    var v = document.getElementById('src').value;
    if(v==='live'){ SRC = {raw:collectLive(), label:'当前浏览器数据'}; }
    else if(v==='imported'){ /* 保持 */ }
    else { var r = pj(localStorage.getItem(v)); SRC = {raw:(r&&r.raw)||{}, label:'自动备份 '+v}; }
    DATA = parseRaw(SRC.raw); render();
  };
  window.importFile = function(inp){
    var f = inp.files && inp.files[0]; if(!f) return;
    var rd = new FileReader();
    rd.onload = function(){
      var j = pj(rd.result); if(!j){ alert('不是有效的 JSON 文件'); return; }
      var raw = j.raw || (j.kind==='gmc-test-record' && j.raw) || null;
      if(!raw){ alert('这个文件里没有完整存档（只有「导出完整备份」或自动备份的文件才能重新分析 / 恢复）'); return; }
      SRC = {raw:raw, label:'导入文件 '+f.name, imported:{name:f.name}};
      DATA = parseRaw(raw); fillSources(); render();
      if(confirm('已载入并重新分析。要把这份存档「恢复」到当前浏览器吗？\n（会覆盖浏览器里现有的演示数据；覆盖前会先自动留一份备份）')) restore(raw);
    };
    rd.readAsText(f); inp.value = '';
  };
  function restore(raw){
    var bk = {t:Date.now(), name:'gmc-backup-before-restore.json', reason:'恢复导入文件前', str:JSON.stringify({kind:'gmc-backup', exportedAt:new Date().toISOString(), reason:'恢复导入文件前', raw:collectLive()})};
    try{ localStorage.setItem('gmc_backup_'+bk.t, bk.str); }catch(e){}
    Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_')===0 && k.indexOf('gmc_backup_')!==0 && k.indexOf('gmc_cfg_')!==0; }).forEach(function(k){ localStorage.removeItem(k); });
    Object.keys(raw).forEach(function(k){ if(k.indexOf('gmc_')===0 && k.indexOf('gmc_backup_')!==0 && k.indexOf('gmc_cfg_')!==0) localStorage.setItem(k, raw[k]); });
    alert('已恢复。请回到演示页面刷新。（注意：如果文件里的数据版本和当前代码版本不同，刷新时会按版本升级流程重置，但会先自动备份。）');
  }

  /* ---------- 导出 ---------- */
  function stamp(){ return new Date().toISOString().slice(0,19).replace(/[:T]/g,'-'); }
  function download(name, text, mime){ var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:mime||'application/json'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function slimCase(c){ var o = {}; Object.keys(c).forEach(function(k){ if(k!=='__t') o[k] = c[k]; }); return o; }
  function coverageOut(){ return RESULT.groups.reduce(function(a,g){ return a.concat(g.items.map(function(it){ return {id:it.id, group:g.id, title:it.title, covered:it.auto ? it.hits.length>0 : null, autoJudged:it.auto, count:it.hits.length, demoCount:(it.demoHits||[]).length, note:it.note, basis:it.basis,
      rounds:it.rounds, occurrences:it.hits.map(function(h){ return {caseNo:h.c&&h.c.caseNo, name:h.c&&h.c.name, clinic:h.c&&h.c.__clinic, round:h.round, firstAt:h.dt||'', firstVersion:h.ver||'', firstVersionTime:h.vt||'', lastAt:h.ldt||'', lastVersion:h.lver||'', lastVersionTime:h.lvt||'', label:h.label||''}; })}; })); }, []); }
  window.exportJson = function(){
    download('gmc-test-record-'+stamp()+'.json', JSON.stringify({kind:'gmc-test-record', exportedAt:new Date().toISOString(), dataVersion:DATA.ver, currentBuild:(typeof GMC_BUILD!=='undefined' ? GMC_BUILD : null), currentRound:parseInt(localStorage.getItem('gmc_cfg_round'),10)||1, roundCoverage:RESULT.roundCov, source:SRC.label, summary:{covered:RESULT.covered, total:RESULT.total, unjudged:RESULT.unjudge.length}, coverage:coverageOut(), note:'覆盖率只计算用户自己新建的案件；演示案件（demo:true）另外列出，不计入',
      cases:DATA.cases.concat(DATA.prepCases||[]).map(function(c){ return {prep:!!c.prep, prepOnly:!!c.__prepOnly, demo:!!c.__demo, round:c.__demo ? null : (parseInt(c.round,10)||1), caseNo:c.caseNo, name:c.name, clinic:c.__clinic, stage:c.stage, subState:c.subState, cancelReason:c.cancelReason||null, path:casePath(c), timeline:c.logEntries||[]}; })}, null, 1));
  };
  window.exportMd = function(){
    var md = '# GMC 测试覆盖记录\n\n导出时间：'+new Date().toISOString()+'　数据版本：'+DATA.ver+'　来源：'+SRC.label+'\n\n**已覆盖 '+RESULT.covered+' / 共 '+RESULT.total+'**（'+RESULT.unjudge.length+' 条无法自动判断）；第 1 轮 '+RESULT.roundCov[1]+'，第 2 轮 '+RESULT.roundCov[2]+'；当前原型版本 '+((typeof GMC_BUILD!=='undefined' && GMC_BUILD) ? GMC_BUILD.h+'（'+GMC_BUILD.t+'）' : '未知')+'\n\n';
    RESULT.groups.forEach(function(g){
      md += '## '+g.id+' '+g.title+'\n\n';
      g.items.forEach(function(it){
        var first = it.hits.slice().sort(function(a,b){ return String(a.dt||'').localeCompare(String(b.dt||'')); })[0];
        md += '- '+(it.void ? '🚫' : !it.auto ? '❔' : it.hits.length ? '✅' : '⬜')+' **'+it.id+' '+it.title+'**'+(it.void ? '（已作废：'+it.note+'）' : !it.auto ? '（无法自动判断：'+it.note+'）' : it.hits.length ? '——'+it.hits.length+' 次；第一次 '+(first.c ? first.c.caseNo+' '+first.c.name : (first.label||''))+(first.dt ? ' '+String(first.dt).slice(0,16) : '') : '——未发生')+'\n';
        if(it.auto && it.hits.length){ it.hits.forEach(function(h){ md += '    - '+(h.c ? h.c.caseNo+' '+h.c.name : (h.label||''))+' · 第 '+h.round+' 轮 · 最早 '+String(h.dt||'').slice(0,16)+' 版本 '+(h.ver||'—')+' · 最后 '+String(h.ldt||'').slice(0,16)+' 版本 '+(h.lver||'—')+'\n'; }); md += '    - 轮次汇总：'+ROUNDS.map(function(r0){ return '第'+r0+'轮 '+(it.rounds[r0]||0)+' 次'; }).join('，')+'\n'; }
      });
      md += '\n';
    });
    md += '## 各案件实际走过的路径\n\n';
    DATA.cases.slice().sort(function(a,b){ return String(a.caseNo).localeCompare(String(b.caseNo)); }).forEach(function(c){
      md += '### '+(c.__demo ? '［演示］' : '')+c.caseNo+' · '+c.name+'（'+c.__clinic+'，当前 '+c.stage+(c.cancelReason ? '，'+c.cancelReason : '')+'）\n\n路径：'+casePath(c).join(' → ')+'\n\n';
      (c.logEntries||[]).forEach(function(e){ md += '- '+(e.dt||'').slice(0,16)+' ['+(e.stage||'')+'] '+(e.actor||'')+'：'+(e.action||'')+(e.ver ? ' 〔'+e.ver+(e.vt ? ' '+e.vt : '')+'〕' : '')+'\n'; });
      md += '\n';
    });
    download('gmc-test-record-'+stamp()+'.md', md, 'text/markdown');
  };
  window.exportBackup = function(){ download('gmc-export-'+stamp()+'.json', JSON.stringify({kind:'gmc-backup', exportedAt:new Date().toISOString(), reason:'手动导出完整备份', dataVersion:SRC.raw.gmc_demo_ver||'', raw:SRC.raw})); };

  fillRound(); fillSources(); window.loadSource();
})();
