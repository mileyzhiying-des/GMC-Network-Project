/* shared/rules.js —— 规则层：状态推导、结局、权限/资格判断、日期与格式化等不碰界面的纯函数
   由 gmc-network-prototype.html 拆分而来（2026-10-05 结构拆分）。classic script，全局函数/变量，不使用 ES module。 */

function dowOfDate(ds){ var d = new Date(ds+'T00:00:00'); var wd = d.getDay(); return wd===0 ? 6 : wd-1; }

function dateLabel(ds){ var d = new Date(ds+'T00:00:00'); return (d.getMonth()+1)+'.'+d.getDate()+' 周'+DOW_CN[dowOfDate(ds)]; }
 /* 只含启用的院长（案例库院长节点、选项都读这个） */
function isDirectorActive(name){ return Object.keys(HOSPITAL_DATA).some(function(h){ return hospitalDirectorNames(h).indexOf(name)>-1; }); } /* 院长名字在各医院里不重名；停用的不算 */

function clientCaseStatus(entry){
  var c = clientLatestCase(entry.name);
  if(!c) return {label:entry.fallback.label, bg:entry.fallback.bg, fg:entry.fallback.fg, finance:'<span style="font-size:12px;color:var(--muted);">—</span>'};
  var b = caseStageBadge(c);
  return {label:b[2], bg:b[0], fg:b[1], finance:financeCellHtml(c)};
}

/* ============ 结局模型（2026-09-30）：终态只有 已结案 / 仅出报告 / 已取消，由系统在案件结束时推算 ============
   判断标准是"客人得到了什么"，退多少钱不影响结局，退款只记入财务字段 financeResult + refunds */
/* CMD-1013-16：新结案规则（试行）开关。存在浏览器（gmc_cfg_ 前缀，重置 / 版本升级都不清），默认开；关掉 = 完全照 de648c4 的旧逻辑。
   开关切换不动已存的案件状态，只影响之后的判断和显示。测试覆盖页顶部可切换。 */
function isEnded(c){ return c.stage==='closed' || c.stage==='reportonly' || c.stage==='cancelled'; }

function isLocalCtxWorkDone(ctx){ return !!ctx && (!!ctx.mgmtDone || ((ctx.mgmtUses||[]).length>0 && ctx.mgmtStatus!=='cancelled_all')); }

/* 数量输入框（CMD-1008-07）：窄版（约 3 位数宽）带 ± 的统一样式，用在使用持有项目数量、项目列表个数、本地管理选购个数；
   max 为空 = 不限；改值时夹在 min~max 之间（不能超过剩余次数）。onchange 为选填的 JS 字符串，值改完后执行。样式见 app.css 的 .qty-box */
function qtyInputHtml(o){
  var min = (o.min===undefined ? 0 : o.min), max = (o.max===undefined || o.max===null) ? '' : o.max;
  return '<span class="qty-box"><button type="button" tabindex="-1" onclick="qtyStep(this,-1)">−</button>'+
    '<input type="number" class="qty-in"'+(o.id?' id="'+o.id+'"':'')+' min="'+min+'"'+(max!=='' ? ' max="'+max+'"' : '')+' value="'+o.value+'" onchange="qtyClamp(this);'+(o.onchange||'')+'">'+
    '<button type="button" tabindex="-1" onclick="qtyStep(this,1)">＋</button></span>'+(o.unit ? '<span class="qty-unit" style="font-size:12px;margin-left:4px;">'+o.unit+'</span>' : ''); /* CMD-1019-10：数量单位统一写「份」，放在数字后面 */
}
function qtyClamp(el){
  var mn = parseInt(el.min, 10), mx = el.max==='' ? Infinity : parseInt(el.max, 10), v = parseInt(el.value, 10);
  if(isNaN(mn)) mn = 0; if(isNaN(v)) v = mn;
  el.value = Math.max(mn, Math.min(mx, v));
}
function qtyStep(btn, d){
  var inp = btn.parentNode.querySelector('input'); if(!inp) return;
  inp.value = (parseInt(inp.value, 10) || 0) + d; qtyClamp(inp);
  inp.dispatchEvent(new Event('change', {bubbles:true}));
}

/* 折扣显示统一（CMD-1008-10）：输入仍填实付比例（80），所有显示的地方一律写「8折」（85 → 8.5折，90 → 9折）；没有折扣（100 / 空）不显示 */
function discountText(pct){
  if(pct===undefined || pct===null || pct==='' || Number(pct)>=100 || Number(pct)<=0) return '';
  return (Math.round(Number(pct))/10).toFixed(1).replace(/\.0$/, '')+'折';
}
function caseHasPurchase(c){
  var any = false, live = false;
  getClientHoldings(c.name).forEach(function(h){ h.batches.forEach(function(b){ if(b.caseId===c.id && !b.kr){ any = true; if(!b.voided && !b.refund) live = true; } }); });
  if(any) return live; /* 买过但已全退 → 视为没有购买 */
  var main = (c.settlementBatches||[]).some(function(b){ return b.status==='active' && b.inTotal>0; });
  var lm = !!c.localMgmt && (c.localMgmt.batches||[]).length>0;
  return main || lm;
}

function computeOutcome(c){
  if(c.krVisit && c.krVisit.done) return 'closed'; /* 在韩到店案件：KR 标完成 = 已结案 */
  if(caseWorkDone(c) || caseHasPurchase(c)) return 'closed';
  /* CMD-1013-16：手动结束（付定金前）时面诊费已缴 / 免除、报告还没出 → 仅出报告；标记 c.manualEnd 只在新规则开着时才会写入，之后切开关也不变 */
  if(c.manualEnd && !c.reportReady && c.consultRequested && ['paid_waiting_kr','awaiting_report'].indexOf(c.consultStatus)>-1) return 'reportonly';
  return c.reportReady ? 'reportonly' : 'cancelled';
}

function hasRefundMark(c){ return refundCashSum(c)>0 || (c.holdingRefunds||[]).length>0 || c.cancelReason==='仅办理退款'; }

function toneColors(label){ return TONE_COLORS[STATE_TONE[label]] || TONE_COLORS.Gray; }

function isArrived(c){ return scheduleState(c)==='Arrived'; }

/* 本地案件：基础资料确认后选"不面诊"（或面诊取消/无法协调后做本地）——状态走 选择项目 → 本地管理 */
function isLocalCase(c){
  if(!c.materialsConfirmed) return false;
  if(c.localTrack || (c.needsConsult===false && !c.consultRequested)) return true;
  /* 面诊案件只买了本地项目（没有赴韩项目）并已付款：按本地案件走"选择项目"（总览没写这种情况，见待确认） */
  return !!c.settlementDone && krActiveItems(c).length===0 && !c.localAsk && !c.visitClosed;
}

function caseStatusBadge(c){
  var t = terminalBadge(c); if(t) return t;
  var label = caseStatusLabel(c), col = toneColors(label);
  return [col[0], col[1], label];
}

/* 阶段 + 进程（CMD-1008-13，IN-CASE-03 第 2 节）：案件列表"当前状态"拆成两栏——阶段（彩色标签，同顶部 tab）+ 进程（一般文字）。
   只是换一种显示：案件主状态（caseStatusLabel / stage / consultStatus / scheduleState）一概不改；KR 端仍用 caseStatusBadge。 */
var STAGE_LABELS = {booked:'预约到店', consult:'面诊安排', travel:'赴韩施术', postcare:'术后管理', krmgmt:'在韩管理', local:'本地管理', closed:'已结案', reportonly:'仅出报告', cancelled:'已取消'};
var STAGE_TONE_LABEL = {booked:'待访问', consult:'面诊预约', travel:'施术预约', postcare:'赴韩施术', krmgmt:'赴韩施术', local:'选择项目', closed:'已结案', reportonly:'仅出报告', cancelled:'已取消'}; /* 借现有主状态取颜色，保证和 tab / 旧标签同色 */
function consultAtPassed(c){ /* KR 确认的面诊时间（韩国当地）是否已到 */
  if(!c.consultAt || !c.consultAt.date || !c.consultAt.time) return false;
  var u = utcStrParse(localToUtc(c.consultAt.date, c.consultAt.time, KR_TZ)); return !!u && u <= realNow();
}
/* 术后管理阶段的进程文字：还有几项没做（韩国 / 印尼）、下一次什么时候；印尼的过了建议日期标出来 */
function postcareProcText(c){
  var rows = carePendingRows(c), kr = rows.filter(function(s){ return s.place!=='IN'; }), inn = rows.filter(function(s){ return s.place==='IN'; });
  if(!rows.length) return c.krBalancePaid && !c.pcBooked ? '待 KR 预约' : '等待完成';
  var late = inn.filter(function(s){ return pcDaysLate(s.date)>0; }).length;
  return rows.length+' 项待做（韩国 '+kr.length+' / 印尼 '+inn.length+'）'+(late ? ' · '+late+' 项已过建议日期' : '');
}
function caseProcessText(c){
  if(c.krVisit && (c.stage==='booked' || c.stage==='krmgmt')) return c.krVisit.arrived ? '在韩已到店' : '待在韩到店（KR 医院）';
  if(c.stage==='postcare') return postcareProcText(c);
  if(c.krVisit && c.krVisit.done && c.stage==='closed') return '在韩到店完成';
  if(c.stage==='booked') return c.subState==='arrived' ? '接待中' : '待访问';
  if(c.stage==='consult'){
    if(c.localAsk) return '项目确认中';
    var inFlow = c.consultRequested && !c.reportReady;
    if(inFlow && c.consultStatus==='awaiting_payment') return '待缴费';
    if(inFlow && c.consultStatus==='paid_waiting_kr') return '待 KR 确认时间';
    if(inFlow && c.consultStatus==='awaiting_report'){
      if(c.consultContentAt) return '等待报告'; /* 院长已上传内容 = 面诊结束 */
      if(c.consultStartedAt) return '面诊中';
      if(!c.consultAt || reportOverdueNow(c)) return '等待报告'; /* 没有面诊时间的旧数据 / 超时：直接当作等待报告 */
      return '等面诊'; /* 「面诊中」由 KR 按［开始面诊］触发，不再按时间自动判定（CMD-1012-05） */
    }
    if(c.projectsEnabled || c.reportReady) return '项目确认中';
    if(c.consultStatus==='cancelled') return '面诊已取消';
    return '面诊预约';
  }
  if(c.stage==='travel'){
    var st = scheduleState(c);
    if(st==='Draft') return '待递交日期';
    if(st==='Pending') return '待确认施术时间';
    if(st==='Arrived'){
      var sg = (c.subItems||[]).filter(function(x){ return x.kind==='施术'; });
      return (sg.length && sg.every(function(x){ return x.done; })) ? '在韩后续' : '在韩中（已到医院）'; /* CMD-1020-15：KR 标了已到医院，IN 案件页 / 列表同步写「已到医院」 */
    }
    return '时间已确认'; /* Confirmed / Changing */
  }
  if(c.stage==='local') return c.mgmtActive ? '本地管理中' : '选择项目';
  if(c.stage==='cancelled') return endReasonText(c);
  if(c.stage==='closed'){ /* 赴韩完成 / 本地完成 / 本地项目保留（取消赴韩后保留本地项目、本次没使用；CMD-1012-12 二） */
    if(c.krProcedureDone || krAllItems(c).some(function(it){ return it.done; })) return '赴韩完成';
    var kept = localPurchasedBatches(c);
    if(krAllItems(c).length && !c.localMgmt && kept.length && kept.every(function(x){ return !(x.b.used>0); })) return '本地项目保留';
    return '本地完成';
  } /* CMD-1008-13 确认 */
  if(c.stage==='reportonly') return c.endNote || '只出报告'; /* 仅出报告写原因 */
  return '';
}
function caseStageInfo(c){
  var col = toneColors(STAGE_TONE_LABEL[c.stage] || caseStatusLabel(c));
  var pr = caseProcessText(c);
  if(typeof isKrAccount==='function' && isKrAccount()) pr = String(pr).replace(/本地项目(全退|保留)|本地完成|本地项目[^，；·]*/g,'IN 已处理'); /* CMD-1014-16：KR 不显示 IN 本地项目的内容，只显示事件 */
  if(typeof isKrAccount==='function' && isKrAccount() && c.stage==='local'){ var kt = krLastStatusText(c); return {bg:'#EDEAE2', fg:'#6E665E', stage:'—', proc:kt}; } /* CMD-1014-18 四·1：KR 不显示 IN 的「本地管理」阶段，进程写和 KR 有关的最后状态 */
  return {bg:col[0], fg:col[1], stage:STAGE_LABELS[c.stage] || c.stage, proc:pr};
}
function krLastStatusText(c){
  try{ if((c.procedureItems||[]).length && typeof krActiveItems==='function' && !krActiveItems(c).length) return '赴韩项目已取消'; }catch(e){}
  if(c.consultStatus==='cancelled') return '面诊已取消';
  if(c.reportReady) return '已出诊疗方案';
  return '—';
}
/* 其他显示案件状态的地方统一写法：「阶段 · 进程」（已结案 / 仅出报告 / 已取消的进程就是结束原因） */
function caseStageBadge(c){ var i = caseStageInfo(c); return [i.bg, i.fg, caseStageProcText(c)]; } /* [底色, 字色, 「阶段 · 进程」]，替代 IN 端显示用的 caseStatusBadge */
function caseStageProcText(c){ var i = caseStageInfo(c); return i.stage + (i.proc ? ' · '+i.proc : ''); }

function caseStatusLabel(c){
  if(c.stage==='booked') return c.subState==='arrived' ? '接待中' : '待访问';
  if(c.stage==='consult'){
    if(c.localAsk) return '项目确认中'; /* 赴韩项目全退后等待确认是否做本地管理：总览没写，暂留在项目确认中 */
    var inFlow = c.consultRequested && !c.reportReady;
    if(inFlow && (c.consultStatus==='awaiting_payment' || c.consultStatus==='paid_waiting_kr')) return '面诊预约'; /* 小状态：待缴费 → 待确认报告时间 */
    if(inFlow && c.consultStatus==='awaiting_report') return '等待报告';
    if(c.projectsEnabled || c.reportReady) return '项目确认中'; /* 含待付款（小状态）；"已出诊疗方案"只是 Timeline 事件 */
    if(c.consultStatus==='cancelled') return '面诊已取消';
    return '面诊预约';
  }
  if(c.stage==='postcare') return '术后管理';
  if(c.stage==='krmgmt') return '在韩管理';
  if(c.stage==='travel'){
    var st = scheduleState(c);
    return (st==='Draft' || st==='Pending') ? '施术预约' : '赴韩施术'; /* Confirmed/Changing/Arrived 都是赴韩施术（改期待确认期间主状态不变） */
  }
  if(c.stage==='local') return c.mgmtActive ? '本地管理' : '选择项目';
  return c.stage;
}

function caseStatusSub(c){
  if(c.stage==='closed') return '完成了施术/管理，或本次购买了本地项目';
  if(c.stage==='reportonly') return '只完成了面诊（有报告），没有施术/管理，也没有购买本地项目';
  if(c.stage==='cancelled'){
    if(c.subState==='cancelled') return '客人取消到店，资料已保留';
    if(c.cancelReason==='管理取消') return '管理全部取消，本次无购买；未做次数已归还持有（不是退款）';
    if(c.cancelReason==='仅办理退款') return '本次到访只办理了持有批次退款，没有其他购买或使用';
    return '本次既没购买也没使用';
  }
  if(c.stage==='booked'){
    if(c.consultStatus==='awaiting_payment') return '接待中：请缴纳或免除面诊费';
    return c.subState==='arrived' ? (c.materialsConfirmed ? '资料已确认' : '客人已到店 · 正在确认资料') : '等待客人到店';
  }
  if(c.stage==='consult' || c.stage==='travel'){
    var its = caseSubStatusItems(c);
    var label = caseStatusLabel(c);
    return label + (its.length ? '（'+its.map(function(i){ return i.text; }).join('；')+'）' : '');
  }
  if(c.stage==='local') return c.mgmtActive ? '本地管理（管理完成 / 管理取消）' : '选择项目（是否持有/使用/选购/付款都在这里完成）';
  return c.sub || '';
}

/* 案件的 stage 跟着实际进度走，不是建档时定死的。2026-09-29（第十轮）按新指令重写：
   "案件=一次到店或一次赴韩行程"——本地项目结算后立即转客户持有，不再挂在案件进程里；
   项目确认中→待付款→已付款→[有赴韩项目：递交施术日期→待确认施术时间→等待施术→(已到医院)赴韩施术中→(KR标记施术完成)已结案]
                    →[纯本地：本地管理(待用持有项目)→(使用/本次不使用)已结案] */
/* 不面诊的案件（含已买本地项目）后来"增加面诊"（2026-10-05）：主状态进入面诊预约 → … → 报告出来后项目确认中（选赴韩项目）；
   已买的本地项目照常可以使用（"本地管理"tab 继续），列表显示"本地管理进行中"小标签（同"+添加本地管理"）；点击后案件对 KR 可见 */
function hasAfterReportBatch(c){ return (c.settlementBatches||[]).some(function(b){ return b.afterReport && b.status==='active'; }); }

function deriveCaseStage(c){
  if(c.subState==='cancelled') return 'cancelled'; /* 分支1：预约阶段直接取消 */
  if(c.visitClosed){ /* 案件结束：结局由 computeOutcome 推算（已结案/仅出报告/已取消） */
    var out = computeOutcome(c);
    return out==='closed' ? 'closed' : out==='reportonly' ? 'reportonly' : 'cancelled';
  }
  if(c.krVisit) return 'krmgmt'; /* IN 在 KR 医院日程占位、KR 确认后开的新案件（CMD-1015-17：在韩管理阶段） */
  if(c.krProcedureDone && c.settlementDone && typeof carePending==='function' && carePending(c) && !(typeof todayOpenRows==='function' && todayOpenRows(c).length)) return 'postcare'; /* 今天还有待做项目时不能进术后管理阶段（CMD-1019-22 八） */ /* 施术完成且还有术后管理没做完 */
  if(consultCarryStage(c)) return 'consult';
  if(c.mgmtActive) return 'local'; /* 使用项目后进入"本地管理" */
  if(c.settlementDone && krActiveItems(c).length>0) return 'travel'; /* 付款完成 → 施术预约；之后读施术日期卡片（Draft/Pending=施术预约，其余=赴韩施术） */
  if(isLocalCase(c)) return 'local'; /* 选择项目（是否持有/使用/选购/付款都在这个状态内） */
  if(c.projectsEnabled) return 'consult'; /* 项目确认中（含待付款小状态） */
  if(c.consultRequested) return 'consult'; /* 面诊预约 / 等待报告 */
  return 'booked';
}

/* 定期休诊（每周固定，诊所设定 / KR 医院设定）：rules = [{dow, from}]；from 为空 = 整天休诊，否则这天从 from 起休诊 */
function closedRuleOf(rules, dow){ return (rules||[]).filter(function(r){ return r.dow===dow; })[0] || null; }
function closedWholeDay(rules, dow){ var r = closedRuleOf(rules, dow); return !!r && !r.from; }
function closedFromOf(rules, dow){ var r = closedRuleOf(rules, dow); return r && r.from ? r.from : ''; }
function closedRulesText(rules){ var N = ['周日','周一','周二','周三','周四','周五','周六']; return (rules||[]).slice().sort(function(a,b){ return a.dow-b.dow; }).map(function(r){ return N[r.dow]+(r.from ? ' '+r.from+' 起' : '整天'); }).join('、') || '无'; }
function isRescheduleDateDisabled(d){
  return closedWholeDay(CLINIC_SETTINGS.closedRules, d.getDay()); /* 整天休诊读诊所设定的定期休诊（默认每周日）；部分时段休诊由 slotBlockReason 判断 */
}
 /* 演示按钮"模拟时间超过30分钟"会把演示时钟往后拨 */
/* 演示时钟 = 电脑当前时间 + 演示按钮往后拨的毫秒数（2026-10-06 起不再固定在 2026-09-18 11:00） */
/* ---- 时区（2026-10-07，CMD-1007-03；Notion Integrations & APIs 时区一行）----
   · 诊所 / 医院存标准时区（IANA：Asia/Jakarta、Asia/Makassar、Asia/Jayapura、Asia/Seoul），原型用浏览器 Intl 算（模拟时区 API）；诊所时区由地址 / 城市自动判定（clinicTzOf），不能手动选。
   · 系统事件时间点（Timeline、通知、对话、报告预计时间、操作日志）一律存 UTC（nowFullDt() = UTC 字符串 'YYYY-MM-DD HH:mm'），显示时按页面时区换算（fmtUtc）。
   · 预约、施术等"当地钟点"仍存当地时间（诊所 / 医院当地），不改成 UTC。
   · demoNow() 返回一个"本地字段 = 页面时区墙上时钟"的 Date：这样所有按本地字段（getHours、dateStr、new Date('YYYY-MM-DDTHH:mm')）算的日历 / 时段 / 倒计时逻辑，
     不管电脑本身在哪个时区，都以诊所（IN 页面）或韩国（KR 页面）的当地时间为准；真正的时刻（UTC）用 realNow()。 */
var TZ_INFO = {
  'Asia/Jakarta':{city:'雅加达', temp:31}, 'Asia/Makassar':{city:'登巴萨（巴厘岛）', temp:30}, 'Asia/Jayapura':{city:'查亚普拉', temp:29}, 'Asia/Seoul':{city:'首尔', temp:18}
};
var _TZ_FMT = {};
function _tzFmt(tz){ return _TZ_FMT[tz] || (_TZ_FMT[tz] = new Intl.DateTimeFormat('en-US', {timeZone:tz, hourCycle:'h23', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit'})); }
function tzParts(date, tz){ var o = {}; _tzFmt(tz).formatToParts(date).forEach(function(p){ o[p.type] = p.value; }); return {y:+o.year, mo:+o.month, d:+o.day, h:+o.hour, mi:+o.minute, s:+o.second}; }
function tzOffsetMin(tz, date){ var dt = date || new Date(), p = tzParts(dt, tz); return Math.round((Date.UTC(p.y, p.mo-1, p.d, p.h, p.mi, p.s) - Math.floor(dt.getTime()/1000)*1000)/60000); }
function tzLabel(tz){ var m = tzOffsetMin(tz), h = m/60; return 'UTC'+(h>=0?'+':'-')+(Math.abs(h) % 1 ? Math.abs(h).toFixed(1) : Math.abs(h)); }
/* CMD-1015-11 演示时间（测试工具，不属于业务功能）：测试覆盖页设定 {startUtc 演示起点（UTC 毫秒）, setAt 设定时的真实毫秒, restoreUtc 真实时间到这一刻自动恢复}；
   存 localStorage gmc_cfg_demotime（同一浏览器所有分页立即生效、刷新不掉、重置演示数据不清）；演示时间 = 起点 + 设定之后真实走过的时间（照常往前走）；
   和 DEMO_SHIFT_MS（［模拟到隔天］等拨时钟按钮）叠加 */
var DEMO_CLOCK_KEY = 'gmc_cfg_demotime', DEMO_CLOCK_CACHE = null, DEMO_CLOCK_AT = 0;
function demoClockCfg(){ var n = Date.now(); if(DEMO_CLOCK_AT && n - DEMO_CLOCK_AT < 400) return DEMO_CLOCK_CACHE; DEMO_CLOCK_AT = n; try{ var raw = localStorage.getItem(DEMO_CLOCK_KEY); DEMO_CLOCK_CACHE = raw ? JSON.parse(raw) : null; }catch(e){ DEMO_CLOCK_CACHE = null; } return DEMO_CLOCK_CACHE; }
function demoClockShiftMs(){ var c = demoClockCfg(); if(!c || !c.startUtc || !c.setAt) return 0; if(c.restoreUtc && Date.now() >= c.restoreUtc) return 0; return c.startUtc - c.setAt; }
function demoTimeActive(){ return demoClockShiftMs() !== 0 || (+DEMO_SHIFT_MS || 0) !== 0; }
try{ window.addEventListener('storage', function(e){ if(e.key === DEMO_CLOCK_KEY || e.key === null) DEMO_CLOCK_AT = 0; }); }catch(e){}
function realNow(){ return new Date(Date.now() + demoClockShiftMs() + (+DEMO_SHIFT_MS || 0)); }
function pageTz(){ try{ if(typeof isKrAccount==='function' && isKrAccount()) return 'Asia/Seoul'; }catch(e){} return (typeof CLINIC_TZ==='string' && CLINIC_TZ) ? CLINIC_TZ : 'Asia/Jakarta'; }
function demoNow(){ var p = tzParts(realNow(), pageTz()); return new Date(p.y, p.mo-1, p.d, p.h, p.mi, p.s); }
function todayStr(){ return dateStr(demoNow()); } /* 页面时区的"今天" */
/* UTC 字符串 'YYYY-MM-DD HH:mm' ⇄ 页面时区显示；旧格式不符的原样返回 */
function utcStrParse(s){ if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s||'')) return null; var d = new Date(String(s).slice(0,16).replace(' ','T')+':00Z'); return isNaN(d.getTime()) ? null : d; }
function fmtUtc(s, tz){ var d = utcStrParse(s); if(!d) return s||''; var p = tzParts(d, tz || pageTz()); return p.y+'-'+pad2(p.mo)+'-'+pad2(p.d)+' '+pad2(p.h)+':'+pad2(p.mi); }
function fmtUtcTime(s, tz){ var f = fmtUtc(s, tz); return f.length>=16 ? f.slice(11,16) : f; }
/* 时间标记（CMD-1008-14）：写进通知 / Timeline 的时间不再写死成某个时区的文字，而是写标记，显示时按"看的人"的时区换算：
   ⟦u:UTC 时间点⟧ → 页面时区（IN 看印尼时间、KR 看韩国时间）；⟦k:日期|钟点⟧ → 韩国当地钟点（IN 显示诊所时间 +（韩国 X），KR 显示韩国时间）。
   新写含时间的通知 / Timeline 文字：用 tkU / tkK 生成标记，不要直接拼 fmtUtc(...) 或韩国钟点。 */
/* 通知分级（Notification Center 2026-10-12）：action = 需要你处理（手动确认）；next = 进入下一阶段（手动确认）；info = 一般消息（6 秒自动消失，铃铛仍留记录）。
   通知事件创建时记在 n.level（可在 opts.level 显式指定），没有记的（旧数据）按文字推断 */
var NOTIF_ACTION_RE = /待确认|催办|诊疗方案已到|无法安排|未接来电|@ 了你|调整了到院时间|请确认报告时间|请按此|重新选择/;
var NOTIF_INFO_RE = /自助预约了|已填完预约资料|取消了.*的预约|客人自助预约|占位客人填完资料|客人到店自己填|客人改约|自行把预约时间|客人取消预约|修改了预计出报告时间|预约占位快过期|进入了|更新了诊所设定|加购/;
function notifLevel(text){ var t0 = String(text||''); if(NOTIF_ACTION_RE.test(t0)) return 'action'; if(NOTIF_INFO_RE.test(t0)) return 'info'; return /已缴面诊费|免除|确认.*施术时间|确认预计出报告时间|已到医院|可以手术|不建议手术|施术完成|结案|仅出报告|已取消|未到店|付清尾款|更换项目|无法施术|重新预约了施术|术后管理已预约|增加项目|延续既往面诊判断|补加了可选项目|完成在韩子项|timeline/.test(t0) ? 'next' : 'info'; }
function notifLevelOf(n){ return (n && n.level) || notifLevel(n && n.text); }
function tkU(s){ return s ? '⟦u:'+s+'⟧' : '—'; }
function tkK(date, hm){ return '⟦k:'+date+'|'+(hm||'')+'⟧'; }
/* ---------- CMD-1014-16：金额 / 内容可见范围（Case Management Flow「IN / KR 金额可见范围」） ----------
   KR 看不到：面诊费、IN 本地项目及金额、置换换了哪些本地项目及金额（只显示事件）；赴韩定金金额 KR 可看。
   IN 看不到：KR 在韩加项的金额（项目名照样显示）。（CMD-1015-15：KR 收的尾款金额 IN 现在看得到，Case Management Flow 10-15）
   通知文字、Timeline 文字都过滤；只改显示，存档和判断逻辑读原文。 */
function viewerLogHidden(e){
  if(!(typeof isKrAccount==='function' && isKrAccount())) return false;
  var a = String((e && e.action) || ''), st = String((e && e.stage) || '');
  if(/转本地置换|置换额度/.test(a)) return false; /* 置换：改写成一句事件（viewerTextFilter） */
  if(/在韩|赴韩|KR/.test(a) && !/本地项目|本地管理/.test(a)) return false; /* 赴韩 / 在韩的事照常显示 */
  return st==='本地管理' || /本地项目|本地管理|选购|活动价|套餐|本地购买|持有批次|使用.*持有|做本地|置换/.test(a);
}
function viewerTextFilter(x){
  var s = String(x==null ? '' : x), kr = (typeof isKrAccount==='function' && isKrAccount());
  if(kr){
    if(/转本地置换|置换额度/.test(s)) s = '定金已转本地置换';
    s = s.replace(/客人已缴面诊费/g,'客人已开始面诊').replace(/面诊费已免除/g,'面诊已开始').replace(/完成面诊费支付|面诊已确认并收款/g,'面诊已确认（已收款）').replace(/免除面诊费（原因：[^）]*）/g,'面诊已开始（免费）').replace(/免除面诊费/g,'面诊已开始（免费）').replace(/面诊费/g,'费用');
    s = s.replace(/Rp\.?\s?[\d.,]+/g,'').replace(/[\d.,]+\s?印尼盾/g,'');
  } else if(typeof isKrAccount==='function'){
    if(/在韩加项|在韩增加|在韩加做|韩国加做/.test(s)) s = s.replace(/[，,]\s*(合计\s*)?₩\s?[\d,]+/g,'').replace(/（金额\s*₩\s?[\d,]+[，,]?/g,'（').replace(/₩\s?[\d,]+/g,'');
  }
  return s;
}
/* CMD-1019-21：到院块不编号，用「日期（星期）时间 · 这次做什么」；今天写「今天 11:00」。存档里的子编号（A000001-1）和资料结构不动 */
function visitOrdNum(dno){ var m = /-(\d+)$/.exec(String(dno||'')); return m ? parseInt(m[1], 10)+1 : 1; } /* 内部排序用，不再显示 */
/* 购买后显示项目名：拿掉规格里的「·N次」（次数已经写在「次数」栏）；购买前（诊疗方案 / 补加 / 结算单选择）照旧 */
function buyName(n){ return String(n==null ? '' : n).replace(/\s*[·・]\s*\d+\s*次(?=$|[\s（(×,，、；）)])/g, ''); }
function visitWeekday(d){ var x = new Date(d+'T00:00:00'); return isNaN(x) ? '' : ['周日','周一','周二','周三','周四','周五','周六'][x.getDay()]; }
/* CMD-1020-04：日期带星期「2026/11/02（一）」 */
function ymdWeekText(d){ if(!d) return ''; return d.replace(/-/g,'/')+'（'+visitWeekday(d).replace('周','')+'）'; }
function visitWhenLabel(date, time, today){
  var d = date || ''; if(!d) return time || '';
  if(d===today) return '今天'+(time ? ' '+time : '');
  return d.slice(5).replace('-', '/')+'（'+visitWeekday(d).replace('周', '')+'）'+(time || '');
}
function visitOrdText(dno, c){ /* 兼容旧调用：有案件就写日期，没有就写「到院」 */
  var rep = c && dno ? subCaseList(c).filter(function(r){ return r.dno===dno; })[0] : null;
  return rep ? '到院（'+String(rep.date||'').slice(5).replace('-', '/')+'）' : '到院';
}
function visitWords(t){
  return String(t==null ? '' : t).replace(/(A\d{6})-(\d+)/g, function(m, no, n){
    var pool = (typeof CASE_ITEMS!=='undefined' ? CASE_ITEMS : []).slice(); try{ if(typeof isKrAccount==='function' && isKrAccount() && typeof krAllCases==='function') krAllCases().forEach(function(r){ pool.push(r.c); }); }catch(e){}
    var cands = pool.filter(function(x){ return x && x.caseNo===no; }), c = cands.filter(function(x){ return (x.subItems||[]).some(function(r){ return r.no===m; }); })[0] || cands[0], dno = no+'-'+parseInt(n, 10); /* 案件号每家诊所各自从 A000001 起，同号的案件优先取那一行所在的 */
    if(c) try{ subCaseNos(c); }catch(e){}
    /* CMD-1020-06：写成 -01 -02（两位）的是「行号」（subNextNo），不是到院编号；旧记录里行号 -03 曾被误当成第 3 次到院，日期写错（11/02 写成 11/07）→ 按行号找那一行自己的日期 */
    if(c && n.length>=2){ var row = (c.subItems||[]).filter(function(r){ return r.no===m; })[0]; if(row) return row.date ? '到院（'+row.date.slice(5).replace('-', '/')+'）' : '到院'; }
    var rep = c ? subCaseList(c).filter(function(r){ return r.dno===dno; })[0] : null;
    return rep && rep.date ? '到院（'+rep.date.slice(5).replace('-', '/')+'）' : '到院';
  });
}
function tzRender(t, noZone){
  return viewerTextFilter(visitWords(String(t==null ? '' : t)).replace(/⟦u:([^⟧]*)⟧/g, function(m, u){ var f = fmtUtc(u); return f ? f+(noZone ? '' : (typeof isKrAccount==='function' && isKrAccount() ? '（韩国）' : '（印尼）')) : '—'; })
    .replace(/⟦k:([^|⟧]*)\|([^⟧]*)⟧/g, function(m, d, h){ return ksTimeText({confirmedDate:d, confirmedTime:h}) || d; }));
}
/* 当地钟点（日期 + HH:mm，某时区的墙上时间）→ UTC 字符串（KR 室长输入的预计出报告时间等） */
function localToUtc(date, hm, tz){
  var a = String(date).split('-'), t = String(hm).split(':'), guess = Date.UTC(+a[0], +a[1]-1, +a[2], +t[0], +t[1]);
  var off = tzOffsetMin(tz, new Date(guess)); var u = new Date(guess - off*60000);
  off = tzOffsetMin(tz, u); u = new Date(guess - off*60000);
  return u.toISOString().slice(0,10)+' '+u.toISOString().slice(11,16);
}
/* 诊所时区：按地址 / 城市关键词自动判定（原型没有地图 API，用关键词对照表模拟）；查不到默认 Asia/Jakarta */
function clinicTzOf(s){
  var t = String((s && s.address)||'')+' '+String((s && s.city)||''), low = t.toLowerCase();
  var has = function(arr){ return arr.some(function(k){ return low.indexOf(k.toLowerCase())>-1; }); };
  if(has(['jayapura','papua','ambon','maluku','merauke','sorong','查亚普拉','巴布亚','安汶'])) return 'Asia/Jayapura';
  if(has(['bali','denpasar','kuta','ubud','seminyak','makassar','lombok','mataram','balikpapan','samarinda','manado','kupang','巴厘','登巴萨','望加锡','龙目','万鸦老'])) return 'Asia/Makassar';
  return 'Asia/Jakarta';
}

/* 演示数据的日期一律写成"相对今天"：D(0)=今天、D(-3)=3 天前、D(2)=2 天后；KD(n) 是韩文日期（对话分隔线用） */
function D(n){ var d = demoNow(); d.setHours(0,0,0,0); d.setDate(d.getDate()+n); return dateStr(d); }
function KD(n){ var d = demoNow(); d.setHours(0,0,0,0); d.setDate(d.getDate()+n); return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일'; }

function pad2(n){ return (n<10?'0':'')+n; }

function dateStr(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }

function stageLogLabel(c){
  var t = CASE_TABS.filter(function(x){ return x.key===c.stage; })[0];
  return t ? t.label : (c.stage||'');
}

function reusableReportSrc(c){ var i = continuationInfo(c); return (i && !i.overdue) ? i.src : null; }
 /* 超过1个月不能沿用 */
function isContinuationConsult(c){ return !!continuationInfo(c) && c.needsConsult===true && c.consultRequested && !c.reuseReport && !c.contJudged; }

function settlementCardHtml(c, b){
  var st = batchStatusLabel(c, b);
  var pc = {'待付款':['#FBF0C9','#8F6F0C'], '已付款':['var(--sage-bg)','var(--sage)'], '计入尾款':['var(--blue-bg)','var(--blue)'], '韩国付款':['var(--blue-bg)','var(--blue)'], '部分退款':['var(--terracotta-bg)','var(--terracotta)'], '全额退款':['#EDEAE2','var(--muted)']}[st];
  var krs = krAllItems(c).filter(function(it){ return it.batchId===b.id; });
  /* 本地项目（CMD-1008-12 A2）：付款后读结算单里的快照 b.inItems；待付款时还没发放持有，直接读这张结算单的 procedureItems（origin IN）——原来只读快照，待付款的结算单会漏掉本地项目 */
  var locals = (b.inItems && b.inItems.length) ? b.inItems : (c.procedureItems||[]).filter(function(it){ return it.batchId===b.id && it.origin==='IN'; });
  var krRows = krs.map(function(it){
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;'+(it.cancelled?'text-decoration:line-through;color:var(--muted);':'')+'">'+it.name+'</span><span style="font-size:12px;color:var(--slate2);">'+((it.price && !(b.addOn || b.preAdd || b.noDeposit || it.krAddOn || it.preBalanceAdd)) ? formatCurrency(it.price,'KRW')+' · ' : '')+krItemStatus(it)+'</span></div>';
  }).join('');
  var localRows = locals.map(function(it){
    var rb = null; getClientHoldings(c.name).forEach(function(h){ if(h.itemName===it.name) h.batches.forEach(function(x){ if(x.caseId===c.id && x.refund && x.bought===(it.qty||1)*(it.specTimes||1)) rb = x.refund; }); });
    var tag = it.kind==='package' ? ' <span style="font-size:12px;color:#C1454A;">套餐</span>' : (it.kind==='service' ? ' <span style="font-size:12px;color:var(--blue);">서비스</span>' : (it.promo || it.promoId ? ' <span style="font-size:12px;color:var(--sage);">本月</span>' : ''));
    var held = b.status==='unpaid' ? '待付款' : '已转客户持有';
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+itemFullName(it)+tag+' ×'+(it.qty||1)+(discountText(it.discountPct)?'（'+discountText(it.discountPct)+'）':'')+'</span><span style="font-size:12px;color:var(--slate2);">'+formatCurrency(inLineTotal(it),'IDR')+' · 本地 · '+held+(rb?' · <b style="color:var(--terracotta);">'+'已退款 '+formatCurrency(rb.amount,'IDR')+'</b>':'')+'</span></div>';
  }).join('');
  var grp = function(t){ return '<div style="font-size:12px;font-weight:700;color:var(--slate2);margin:8px 0 2px;">'+t+'</div>'; };
  var rows = (krRows && localRows) ? grp('赴韩项目（₩）')+krRows+grp('本地项目（Rp）')+localRows : (krRows + localRows);
  var amounts = [];
  if(b.addOn) amounts.push('韩国加做（KR 新增，另开结算单）：客人在韩国单独付款，医院收款（不进尾款应付额，算 KR 收入）；金额由医院收，这里不显示');
  else if(b.preAdd) amounts.push('到院后增加项目（KR 新增）：与尾款一次结算（不收定金，计入尾款，医院收）');
  else if(b.noDeposit) amounts.push('更换项目（'+(b.swapOf||'')+'→）：不收定金，直接计入尾款（医院收）');
  else if(b.krDeposit) amounts.push('赴韩定金 '+formatCurrency(b.krDeposit,'KRW')+'（诊所收）；尾款 '+formatCurrency(Math.max(0,(b.krTotal||0)-(b.krDeposit||0)),'KRW')+'（'+(c.krBalancePaid ? '已付清' : '未付')+'，赴韩后医院收）');
  if(b.inTotal) amounts.push('本地全款 '+formatCurrency(b.inTotal,'IDR'));
  var refunds = (c.refunds||[]).filter(function(r){ return (r.batchIds||[]).indexOf(b.id)>-1; }).map(function(r){
    return '<div style="font-size:12px;color:'+(r.comp ? '#8F6F0C' : 'var(--terracotta)')+';margin-top:4px;">'+(r.comp ? '转本地置换 ' : '退款 ')+formatCurrency(r.amount,'KRW')+'（'+r.items.join('、')+'；原因：'+r.reason+(r.note ? '；备注：'+r.note : '')+'）</div>';
  }).join('');
  var canCancel = b.status!=='unpaid' && krNotStartedItems(c).some(function(it){ return it.batchId===b.id; }) && !c.hasArrived && !c.visitClosed;
  var actions = b.status==='unpaid'
    ? '<div style="display:flex;align-items:center;gap:10px;margin-top:10px;"><button class="btn-primary" onclick="settleProjects(\''+b.id+'\')">确认付款</button>'+(batchNeedsPassport(c, b) ? '<span style="font-size:12px;color:#B3261E;font-weight:700;">护照未登记（点确认付款先登记护照）</span>' : '')+'</div>'
    : (canCancel ? '<button class="btn-outline" style="margin-top:10px;" onclick="openCancelItems(\''+b.id+'\')">取消项目</button>' : '');
  return '<div id="settle-card-'+b.id+'" style="border:1px solid var(--border2);border-radius:12px;padding:16px 18px;margin-bottom:12px;">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:13px;font-weight:700;">结算单 '+b.id+' <span style="font-weight:400;color:var(--muted);font-size:12px;">'+b.time+'</span></span><span class="status-pill" style="background:'+pc[0]+';color:'+pc[1]+';">'+st+'</span></div>'+
    (rows || '<div style="font-size:12px;color:var(--muted);">（项目明细略）</div>')+
    '<div style="font-size:12px;color:var(--slate2);margin-top:8px;">'+amounts.join('　')+'</div>'+refunds+actions+'</div>';
}

/* 汇总行（2026-10-01）：项目合计 / 已收定金 / 已退金额 / 应付尾款，跨所有结算单计算（赴韩=韩元，本地=印尼盾，不相加） */
function settlementSummaryHtml(c){
  var info = krBalanceInfo(c), ref = refundCashSum(c), compK = compSum(c), pd = financePaid(c);
  var hasKr = krAllItems(c).length>0;
  var totalTxt = (hasKr ? formatCurrency(info.total,'KRW') : '') + ((hasKr && pd.inn>0) ? ' ＋ ' : '') + (pd.inn>0 ? formatCurrency(pd.inn,'IDR') : '') || '—';
  var balTxt = !krActiveItems(c).length ? '—' : (info.diff>=0 ? formatCurrency(info.diff,'KRW')+'（'+(c.krBalancePaid ? '已付清' : '未付')+'）' : (c.krBalancePaid ? '已退差额 ' : '应退 ')+formatCurrency(-info.diff,'KRW')); /* CMD-1015-15：尾款金额 IN 看得到 */
  var cell = function(k, v){ return '<div style="flex:1;min-width:120px;"><div style="font-size:12px;color:var(--muted);margin-bottom:2px;">'+k+'</div><div style="font-size:14px;font-weight:700;">'+v+'</div></div>'; };
  return '<div style="display:flex;gap:14px;flex-wrap:wrap;background:var(--border2);border-radius:10px;padding:12px 14px;margin-bottom:12px;">'+
    cell('项目合计', totalTxt)+cell('已收定金（诊所收）', hasKr ? formatCurrency(info.deposit,'KRW') : '—')+cell('已退金额', ref>0 ? formatCurrency(ref,'KRW') : '—')+(compK>0 ? cell('已转置换', formatCurrency(compK,'KRW')) : '')+cell('应付尾款（医院收）', balTxt)+'</div>';
}

function settlementCardsHtml(c){
  var bs = c.settlementBatches || [];
  if(!bs.length) return '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">尚无结算单</div>';
  var idx = c.settleTab; if(idx===null || idx===undefined || idx<0 || idx>=bs.length) idx = bs.length-1; /* 默认打开最新一张 */
  var tabs = bs.length>=2
    ? '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">'+bs.map(function(b,i){
        return '<span class="chip'+(i===idx?' active':'')+'" onclick="setSettleTab('+i+')">第'+(i+1)+'张</span>';
      }).join('')+'</div>' : '';
  return settlementSummaryHtml(c)+tabs+settlementCardHtml(c, bs[idx]);
}

function settlementItemRow(c, it, removable){
  var strike = it.done ? 'text-decoration:line-through;color:var(--muted);' : '';
  var ccy = it.origin==='KR' ? 'KRW' : 'IDR';
  if(it.origin==='IN'){
    /* 本地项目不能退款，只有赴韩项目能退（2026-09-29 第十轮），所以这里永远不出"取消退款"链接 */
    var qty = it.qty||1;
    var pct = (it.discountPct===undefined||it.discountPct===null) ? 100 : it.discountPct;
    var lineTotal = inLineTotal(it);
    var origPrice = it.price*qty;
    var priceHtml;
    if(removable) return localRowHtml(c, 'main', it); /* 2026-10-08：赴韩方案 / 本地选购的「已选择」统一一行（行首 checkbox / 次数 / 折扣 / 金额 / ［备注］） */
      priceHtml = qty+'次'+(discountText(pct)?'，'+discountText(pct):'')+'　<b>'+formatCurrency(lineTotal,ccy)+'</b>'+(pct<100?' <span style="color:var(--muted);text-decoration:line-through;font-size:12px;">'+formatCurrency(origPrice,ccy)+'</span>':'');
    var held = clientHeldRemaining(c.name, it.name);
    var heldTag = held>0 ? ' <span style="font-size:12px;color:var(--sage);">持有 '+held+' 次</span>' : '';
    var noteRow = removable ? '<div class="case-field-row" style="border-top:none;padding-top:0;padding-bottom:10px;"><input type="text" placeholder="备注（选填）" value="'+(it.itemNote||'')+'" onchange="setInItemField(\''+it.projectId+'\',\'itemNote\',this.value)" style="width:100%;padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;"></div>' : '';
    return '<div class="case-field-row" style="flex-wrap:wrap;gap:6px;"><span style="flex-grow:1;font-size:13px;'+strike+'">'+itemFullName(it)+heldTag+'</span><span style="font-size:12px;display:flex;align-items:center;gap:4px;">'+priceHtml+'</span></div>'+noteRow;
  }
  if(removable) return '<div class="sel-row"><div class="sel-line"><input type="checkbox" checked title="取消勾选即移除" onchange="toggleProject(\''+it.projectId+'\')"><div class="sel-name"><div>'+it.name+'</div></div><span class="sel-amt">'+formatCurrency(it.price, ccy)+'</span></div></div>';
  return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;'+strike+'">'+it.name+(it.done?'（已完成）':'')+'</span><span style="font-size:13px;font-weight:700;">'+formatCurrency(it.price, ccy)+'</span></div>';
}

function settlementBigCardHtml(c, items, removable){
  var krItems = items.filter(function(it){ return it.origin==='KR'; });
  var inItems = items.filter(function(it){ return it.origin==='IN' && it.kind!=='service'; }); /* 서비스（赠送）不进本地项目卡，在下方单独的 서비스 区 */
  if(!krItems.length && !inItems.length){
    return '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">尚未选择项目</div>';
  }
  var krCard = '';
  if(krItems.length){
    var bd = computeBatchBreakdown(krItems), krTotal = bd.krTotal, krDeposit = bd.krDeposit;
    krCard = '<div style="border:1px solid var(--border2);border-radius:12px;padding:16px 18px;margin-bottom:12px;">'+
      '<div style="font-size:12px;font-weight:700;color:var(--terracotta);margin-bottom:8px;">赴韩项目</div>'+
      krItems.map(function(it){ return settlementItemRow(c, it, removable)+itemArrangeHtml(it, false)+pcLinesHtml(c, it); }).join('')+
      '<div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:6px;border-top:1px solid var(--border);font-size:13px;"><span>合计</span><span style="font-weight:700;">'+formatCurrency(krTotal,'KRW')+'</span></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:var(--terracotta);"><span>定金（诊所收；'+Math.round(KR_DEPOSIT_RATE*100)+'% × 全部赴韩项目（施术 + 管理），术后管理含在套餐内，比例待业务确认）</span><span>'+formatCurrency(krDeposit,'KRW')+'</span></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--slate2);"><span>尾款（赴韩后由医院收；赴韩项目的其余部分）</span><span>'+formatCurrency(krTotal-krDeposit,'KRW')+'</span></div>'+(bd.krProvisional ? '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);"><span>可弹性术后管理（暂定，不算进定金，付尾款时确定）</span><span>'+formatCurrency(bd.krProvisional,'KRW')+'</span></div>' : '')+
      noteFieldHtml('备注（KR + IN 可见）','noteKR',c.noteKR)+
      '</div>';
  }
  var inCard = '';
  if(inItems.length){
    var inTotal = inItems.reduce(function(s,it){ return s+inLineTotal(it); },0);
    inCard = '<div style="border:1px solid var(--border2);border-radius:12px;padding:16px 18px;">'+
      '<div style="font-size:12px;font-weight:700;color:var(--sage);margin-bottom:8px;">本地项目（含术后管理，结算后转客户持有，不可退款）</div>'+
      inItems.map(function(it){ return settlementItemRow(c, it, removable); }).join('')+
      '<div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:6px;border-top:1px solid var(--border);font-size:13px;font-weight:700;"><span>全款</span><span>'+formatCurrency(inTotal,'IDR')+'</span></div>'+
      noteFieldHtml('备注（仅 IN 可见）','noteIN',c.noteIN)+
      '</div>';
  }
  return noteFieldHtml('整体备注（KR + IN 可见）','noteOverall',c.noteOverall)+
    '<div style="margin-top:12px;">'+krCard+inCard+'</div>';
}

/* ---- 06 在韩国（2026-10-01，KR 的操作全部用演示按钮模拟）----
   已到医院 → 「模拟KR判断能否施术」三个结果：
   ① 能施术·项目没变动 → 付清尾款 → 各项目标完成 → 已结案
   ② 能施术·项目有变动（部分不能做 / 更换）→ 不能做的标"无法施术"（项目→已取消）→ 尾款按实际项目重算（定金先抵，多退少补；需退差额时 IN 按 KR 判断的金额走退款弹窗）→ 可选改施术时间（回到施术时间已确认）→ 施术完成 → 已结案
   ③ 不能施术 → KR 在韩重新预约（回到施术时间已确认，再标已到医院）/ 退定金（全部退回或不退）→ IN 退款 → 仅出报告 */
/* 尾款公式（2026-10-01 确认）：尾款 = 实际做的项目合计 −（定金合计 − 到医院前已退金额）；到医院之后不单独退款，差额在尾款里多退少补。
   到医院前在结算单［取消项目］退过的金额（refunds 里 afterArrival 不为真）从定金里扣掉一次，且被取消的项目不在"实际项目合计"里——不重复扣减。 */
function krBalanceInfo(c){
  var deposit = 0;
  (c.settlementBatches||[]).forEach(function(b){ if(b.status==='active') deposit += b.krDeposit||0; });
  var preRefund = (c.refunds||[]).filter(function(r){ return !r.afterArrival && (r.currency||'KRW')==='KRW'; }).reduce(function(sum,r){ return sum + (r.amount||0); }, 0);
  var effDeposit = deposit - preRefund; /* 仍留在诊所、可抵尾款的定金 */
  var total = krActiveItems(c).filter(function(it){ return !it.krAddOn; }).reduce(function(sum,it){ return sum + itemKrAmount(it); }, 0); /* 回诊加做的项目在韩国单独付款，不进尾款 */ /* 实际要做的项目合计（不含已取消/已更换） */
  return {deposit:deposit, preRefund:preRefund, effDeposit:effDeposit, total:total, diff:total-effDeposit}; /* diff>0 补尾款；diff<0 退差额 */
}

/* 结算尾款：实际项目合计 − 定金（先抵）；补尾款（KR在韩国收）或退差额（IN 按 KR 判断的金额走退款弹窗） */
function settleKrBalance(){
  /* 尾款多退少补：定金多了，金额由 KR 判断（krJudge.refundDue），IN 室长按这个金额在系统里退差额；退款后视为尾款已结清 */
  var c = getCurrentCase(); if(!c || !c.krJudge || c.krJudge.result!=='changed' || c.krJudge.settled || !c.krJudge.refundDue) return;
  openRefundModal([], 'diffRefund', false, c.krJudge.refundDue);
}
 /* 赴韩项目收预付金比例，演示先用30%，具体比例待业务确认 */
/* items 现在是快照数组（自带 price/origin），不用再回查项目库；本地项目按个数+折扣算总价（2026-09-29 第十轮新增） */
/* 赴韩项目的术后管理（2026-10-07 改：术后管理包含在套餐里，不另收费）：it.postcare = [{name, times, place:'KR'|'either', day, innName, inTimes}]
   place='KR' 必须在韩国做；'either' 韩国或印尼都可，由 IN 室长分配（inTimes = 分给印尼的次数，其余在韩国），付尾款前都可以改——分配只为排程，不涉及金额
   赴韩项目金额 = 施术项目价格；定金 = 施术项目 × 比例；尾款 = 施术项目 × (1 − 比例)（术后管理不计价；只有"加做"的术后管理才收费，见 coreAddOnItem） */
/* 术后管理设定（CMD-1012-02 B6）：管理项目（不写地点）/ 次数 / 多次时每隔几天 / 地点 / 具体项目 / 第 N 天起，之后的日子自动生成 */
function pcDays(x){
  var st = parseInt(x.startDay || (String(x.day||'').match(/(\d+)/)||[])[1], 10) || 0, n = Math.max(1, x.times||1), gap = Math.max(1, parseInt(x.interval,10)||1), out = [];
  if(!st) return out;
  for(var i = 0; i < n; i++) out.push(st + i*gap);
  return out;
}
function pcDayText(x){ var d = pcDays(x); return d.length ? '第'+d.join('、')+'天' : (x.day||''); }
function pcLabel(x){ return x.mgmt || x.name; }
function pcSplit(x){ var inn = (x.place==='either' && x.innName) ? Math.min(x.times, Math.max(0, x.inTimes||0)) : 0; return {kr:x.times-inn, inn:inn}; }
function itemKrParts(it){ return {base:it.price||0, must:0, elastic:0}; }
function itemKrAmount(it){ return it.price||0; } /* 这个赴韩项目在韩国要付的合计 = 施术项目价格 */
function computeBatchBreakdown(items){
  var krItems = [], inItems = [], krTotal = 0, inTotal = 0, krFixed = 0, krProvisional = 0;
  items.forEach(function(it){
    if(it.origin==='KR'){ krItems.push(it); var pp = itemKrParts(it); krTotal += pp.base + pp.must + pp.elastic; krFixed += pp.base + pp.must; krProvisional += pp.elastic; }
    else {
      inItems.push(it);
      inTotal += inLineTotal(it); /* 成交单价（活动价 / 套餐价 / 原价）× 个数 × 实付比例；서비스 = 0 */
    }
  });
  var krDeposit = Math.round(krFixed * KR_DEPOSIT_RATE);
  return {krItems:krItems, krTotal:krTotal, krDeposit:krDeposit, krBalance:krTotal-krDeposit, krFixed:krFixed, krProvisional:krProvisional, inItems:inItems, inTotal:inTotal};
}
 /* 会被 nearestOpenMonth()/修改日期时的原定月份实时覆盖，这里只是初值 */
function fmtDateYMD(y,m,d){
  var mm = (m+1)<10 ? '0'+(m+1) : String(m+1);
  var dd = d<10 ? '0'+d : String(d);
  return y+'-'+mm+'-'+dd;
}

/* 施术前2周内不可修改日期：TODAY_DATE 是原型里的"今天"（当天 0 点，取电脑日期；2026-10-06 起不再固定），比较用它 */
/* 已废弃（CMD-1012-13）：施术前 2 周不可改期的限制已拿掉，这个函数不再被调用 */
function isWithin2WeeksOfToday(dateStr){
  if(!dateStr) return false;
  /* CMD-1012-01：按页面（诊所）时区的「今天」和 YYYY-MM-DD 的纯日期差来算，不依赖浏览器时区；距今天 ≤ 14 天算 2 周内 */
  var a = String(dateStr).slice(0,10).split('-'), b = todayStr().split('-');
  var diffDays = (Date.UTC(+a[0], +a[1]-1, +a[2]) - Date.UTC(+b[0], +b[1]-1, +b[2])) / 86400000;
  return diffDays <= 14;
}

/* 面诊取消只在"待缴费"时可用（2026-10-02）；一旦缴费/免除后不能取消 */
function canCancelConsult(c){ return c.consultStatus==='awaiting_payment' && !c.reportReady; }

/* 币种格式：韩元 ₩1,000,000；印尼盾 Rp 1.000.000（点分千位）；人民币 ¥5,200.00 */
function formatCurrency(amount, currency){
  if(currency==='CNY'){
    var parts = amount.toFixed(2).split('.');
    return '¥' + groupThousands(parts[0], ',') + '.' + parts[1];
  }
  var rounded = String(Math.round(amount));
  if(currency==='IDR') return 'Rp ' + groupThousands(rounded, '.');
  return '₩' + groupThousands(rounded, ','); // KRW 默认
}
 // 案件详情页"项目列表/施术"tab 自己的币种切换，两处独立

/* 项目是否"在用"：有引用它的案件还没到终态（已完结/已取消预约/已取消(全退)/已结案(部分退)——
   这四个终态在代码里都归到 stage==='closed' 或 stage==='cancelled'），在用的项目不能删除，只能非活性化 */
function isProjectInUse(projectId){ /* 旧版只看案件；新版见 projDeleteBlockReason()（案件+客人持有批次） */
  return CASE_ITEMS.some(function(c){
    if(isEnded(c)) return false;
    return (c.procedureItems||[]).some(function(it){ return it.projectId===projectId; })
        || (c.recommended||[]).some(function(it){ return it.projectId===projectId; });
  });
}

function workingIN(){ var today = todayStr(); return IN_COORDINATORS.filter(function(n){ return !isOffOn(n, today); }); }

/* ---- 案件对话房规则（2026-10-02 选院长+对话合并版·二） ----
   建房条件：不面诊 = 基础资料确认后；面诊 = 缴费（或免除）后；之前完全不显示［发起对话］和"+新建案件对话"候选；终态案件没有房间。
   成员：不面诊 = 全部IN室长；面诊 = 全部IN室长 + 全部KR室长 + 选定院长（不面诊案件点"增加面诊"并缴费后，KR室长和院长才加入）。
   推播/toast/未读：只给"负责该案件的IN室长"和"确认报告时间或上传诊疗方案的KR室长"；其他室长是成员但不推播；院长完全不推播、不提醒、不显示未读。 */
function caseRoomEligible(c){
  if(!c || !c.materialsConfirmed || isEnded(c)) return false;
  if(c.consultRequested && c.consultStatus==='awaiting_payment') return false; /* 面诊案件缴费（或免除）后才能建房 */
  return true;
}

function caseHasKrSide(c){
  return !!c.consultRequested && c.consultStatus!=='awaiting_payment' && c.consultStatus!=='cancelled';
}

function isOffOn(name, date){ var k = offNameKey(name); return CAL_MEMOS.some(function(m){ return m.type==='OFF' && (m.weekly ? m.dow===new Date(date+'T00:00:00').getDay() : m.date===date) && offNameKey(m.person)===k; }); /* 每周固定的 OFF 也算 */ }

function pushTargets(c){
  var today = todayStr(), ops = caseOperators(c);
  var pick = function(opsList, all){
    var work = opsList.filter(function(n){ return all.indexOf(n)>-1 && !isOffOn(n, today); }); /* 已换掉的旧使用人不再收推播 */
    return work.length ? work : all.filter(function(n){ return !isOffOn(n, today); });
  };
  return {inn: pick(ops.inn, IN_COORDINATORS), kr: (ops.kr.length || caseHasKrSide(c)) ? pick(ops.kr, krCoordinatorsOf(c)) : []};
}

/* ================= 手机号输入（2026-10-06）：一律拆成两栏——国码下拉 + 号码；存成完整格式"国码 号码" =================
   预约页、员工激活/忘记密码、客户详情的联系方式都用它。号码栏只输入后面的数字（可带 - 或空格），默认国码 +62（印尼）。 */
var PHONE_CCS = ['+62', '+86', '+65', '+82'];
function splitPhone(full){
  var m = String(full||'').trim().match(/^(\+\d{1,3})[\s-]*(.*)$/);
  if(m && PHONE_CCS.indexOf(m[1])>-1) return {cc:m[1], num:m[2]};
  return {cc:'+62', num:String(full||'').trim().replace(/^\+/, '')};
}
function phoneInputHtml(id, full, opt){
  opt = opt || {}; var p = splitPhone(full), ro = opt.readonly ? ' disabled' : '';
  return '<div class="phone-row"><select id="'+id+'-cc"'+ro+'>'+PHONE_CCS.map(function(c){ return '<option value="'+c+'"'+(c===p.cc?' selected':'')+'>'+c+'</option>'; }).join('')+'</select>'+
    '<input type="tel" id="'+id+'-num" value="'+String(p.num).replace(/"/g,'&quot;')+'" placeholder="'+(opt.placeholder||'812-xxxx-xxxx')+'"'+(opt.readonly?' readonly':'')+(opt.onEnter?' onkeydown="if(event.key===\'Enter\')'+opt.onEnter+'"':'')+'></div>';
}
function phoneInputGet(id){
  var cc = document.getElementById(id+'-cc'), num = document.getElementById(id+'-num');
  var n = num ? num.value.trim() : ''; return n ? ((cc ? cc.value : '+62')+' '+n) : '';
}

/* ================= 权限（2026-10-06·A4，Notion Accounts & Settings 第 2 节） =================
   work=处理客人和案件（工作台/客户/案件/案例库/项目库/通知/对话）；bizdata=经营数据；accounts=账号管理；clinic=诊所设定；oplog=操作日志；personal=个人设定。
   老板：只有管理类（看汇总，看不到个别客人和案件）；管理者：全部；一般室长：work + personal。没有权限的入口完全不显示。 */
var ROLE_PERMS = {
  owner:   {work:false, bizdata:true,  accounts:true,  clinic:true,  oplog:true,  personal:true,  smslog:true},
  manager: {work:true,  bizdata:true,  accounts:true,  clinic:true,  oplog:true,  personal:true,  smslog:true,  promo:true}, /* promo = 项目库「本月活动 / 套餐」的新增 / 编辑 / 结束（只有 IN 管理者，CMD-1008-09） */
  general: {work:true,  bizdata:false, accounts:false, clinic:false, oplog:false, personal:true,  smslog:false},
  /* KR 医院账号（2026-10-06，Notion Accounts & Settings 第 7 节）：krwork = 处理案件（确认报告时间、上传诊疗方案、施术相关）；krview = 看所有案件；krviewOwn = 只看自己负责的；
     krsched = 日程/OFF；krdoctors = 院长名单/停用；krlib = 赴韩项目库（维护）；krshowview = 案例库只读（IN 统一维护，KR 全部只读，CMD-1014-16）；bizdata/accounts/clinic（= 医院设定）/oplog = 管理类。 */
  kr_owner:    {work:false, krshowview:true, krshowedit:false, krwork:false, krview:false, krviewOwn:true, krsched:true,  krdoctors:true,  krlib:false, bizdata:true,  accounts:true,  clinic:true,  oplog:true,  personal:true, smslog:false},
  kr_manager:  {work:false, krshowview:true, krshowedit:true, krwork:true,  krview:true,  krviewOwn:false, krsched:true,  krdoctors:true,  krlib:true,  bizdata:true,  accounts:true,  clinic:true,  oplog:true,  personal:true, smslog:false},
  kr_general:  {work:false, krshowview:true, krshowedit:true, krwork:true,  krview:true,  krviewOwn:false, krsched:true,  krdoctors:false, krlib:true,  bizdata:false, accounts:false, clinic:false, oplog:false, personal:true, smslog:false},
  kr_director: {work:false, krshowview:true, krshowedit:false, krwork:false, krview:false, krviewOwn:true,  krsched:'own', krdoctors:false, krlib:false, bizdata:false, accounts:false, clinic:false, oplog:false, personal:true, smslog:false}
};
/* 代表院长 = 院长 + 老板（CMD-1012-05 五）：院长功能（自己负责的案件、开始 / 录入面诊、自己的日程与 OFF）+ 保留老板的管理类页面 */
function isKrDirectorLike(a){ return !!a && (a.role==='kr_director' || a.role==='kr_owner'); }
/* 管理类页面（侧边栏"诊所管理"组；老板端的全部导航）。key 同时是 ?page=admin-xxx 的后缀 */
var ADMIN_PAGES = [
  {key:'bizdata',  label:'经营数据', icon:'数', perm:'bizdata'},
  {key:'accounts', label:'账号管理', icon:'账', perm:'accounts'},
  {key:'clinic',   label:'诊所设定', icon:'设', perm:'clinic'},
  {key:'smslog',   label:'短信发送记录', icon:'短', perm:'smslog'}, /* 演示短信集中在这里，老板/管理者在诊所设定旁边看到 */
  {key:'oplog',    label:'操作日志', icon:'志', perm:'oplog'},
  /* KR 医院端的管理类页面（2026-10-06，KR 端系列 5/5）：只有 KR 账号有这些权限，IN 账号 canDo 为 false 不会出现 */
  {key:'krdoctors',  label:'院长管理', icon:'院', perm:'krdoctors'},
  {key:'krsrvc',     label:'项目库', icon:'项', perm:'krlib'},
  {key:'krshow',     label:'案例库', icon:'案', perm:'krshowview'},
  {key:'personal', label:'个人设定', icon:'个', perm:'personal', hidden:true} /* 不在侧边栏，从头像菜单进入 */
];
function canDo(perm, acct){
  var a = acct || currentAccount();
  return !!(a && a.status==='active' && ROLE_PERMS[a.role] && ROLE_PERMS[a.role][perm]);
}
/* 自己的首页：能做日常工作的去 in.html，否则（老板）去 owner.html */
function homeUrl(acct){
  var a = acct || currentAccount();
  if(a && a.role==='owner') return '/owner.html';   /* 老板端：IN 老板 = 诊所营运；KR 代表院长 = 医院营运 */
  if(a && a.role.indexOf('kr_')===0) return '/kr.html';                      /* KR 室长 / 管理者 / 院长 */
  return '/in.html';
}
/* KR 医院账号（带 hospitalId，没有 clinicId） */
function isKrAccount(acct){ var a = acct || currentAccount(); return !!(a && a.hospitalId); }
function krHospitalIdOfMe(){ var a = currentAccount(); return a && a.hospitalId ? a.hospitalId : null; }
function hospitalAccounts(hid){ return ACCOUNTS.filter(function(a){ return a.hospitalId===hid; }); }
/* 管理类页面的标题：KR 的"诊所设定"叫"医院设定" */
function adminPageLabel(p){ return (p.key==='clinic' && isKrAccount()) ? '医院设定' : p.label; }

/* ================= 账号辅助（2026-10-05·二） ================= */
/* 当前页面所属诊所：booking.html 看地址 ?clinic=（正式版必须带诊所，没带应显示错误；原型不带默认 C1）；IN/老板端 = 登录账号的诊所；没登录（登录页）= null */
function resolveClinicId(){
  try{
    if(/booking\.html$/.test(location.pathname)){ var q = new URLSearchParams(location.search).get('clinic'); return q || 'C1'; }
  }catch(e){}
  var a = (typeof currentAccount === 'function') ? currentAccount() : null;
  if(a && a.hospitalId) return null; /* KR 医院账号没有诊所分区：跨诊所数据用 Store.readClinic / withClinic 读 */
  return a ? (a.clinicId || 'C1') : null;
}
/* 本诊所的账号（账号管理、席位、重名检查、IN 室长名单都只看自己诊所） */
function clinicAccounts(clinicId){ var c = clinicId || CURRENT_CLINIC_ID; return ACCOUNTS.filter(function(a){ return !a.hospitalId && (a.clinicId||'C1')===c; }); } /* KR 医院账号不属于任何诊所 */
function clinicAccountPrefix(clinicId){ var c = clinicById(clinicId || CURRENT_CLINIC_ID); return c ? c.accountPrefix : 'A'; }
function accountById(id){ return ACCOUNTS.filter(function(a){ return a.id===id; })[0] || null; }
/* 显示用："A2 室长（A2）" */
/* 员工显示名 = 账号编号 + 角色（如「A1 室长」）：名字本身已经带编号时，括号里不再重复编号 */
function nameWithId(n, id){ return String(n||'').indexOf(String(id)+' ')===0 ? n : n+'（'+id+'）'; }
function accountLabel(id){ var a = accountById(id); return a ? (a.name ? nameWithId(a.name, a.id) : '（待激活）（'+a.id+'）') : String(id); }
/* 旧演示数据里的操作人只写了名字（A1 室长 / A2 室长）：按当时的账号编号显示，不跟随账号后来换人 */
var LEGACY_STAFF_ID = {'A1 室长':'A1', 'A2 室长':'A2'};
/* 日志条目的操作人显示：新条目带 actorId；旧条目按名字查 */
function actorDisplay(entry){
  var n = String(entry.actor||''), id = entry.actorId || LEGACY_STAFF_ID[n];
  return id ? nameWithId(n, id) : n;
}
function staffLabel(name){ var id = LEGACY_STAFF_ID[name]; return id ? nameWithId(name, id) : name; }
/* 席位概况：基础 3 + 加购；使用中/待激活占用席位，已停用不占 */
function seatSummary(){
  var used = function(seat){ return clinicAccounts().filter(function(a){ return a.seat===seat && a.status!=='disabled'; }).length; };
  var addonBought = clinicAccounts().filter(function(a){ return a.seat==='addon' && a.status!=='disabled'; }).length;
  return {basicTotal:BASIC_SEATS, basicUsed:used('basic'), addonTotal:addonBought, addonUsed:clinicAccounts().filter(function(a){ return a.seat==='addon' && a.status==='active'; }).length, addonPending:clinicAccounts().filter(function(a){ return a.seat==='addon' && a.status==='pending'; }).length};
}


/* ---------- KR 端用的共用规则（2026-10-06，KR 端系列 2/5） ---------- */
/* 手机号遮罩：KR 端所有位置都不显示客人的真实联系方式，只留国家码 → +62 000-****-****（真实联系方式由印尼室长处理） */
/* KR 室长显示名：去掉旧数据里多余的「 실장」后缀（职称只写一次，如 KM1 室长） */
function krCoordText(s){ return String(s||'').replace(/\s*실장\s*$/, ''); }
function maskPhone(p){
  var m = String(p||'').match(/^\s*(\+\d{1,4})/);
  return (m ? m[1] : '+--') + ' 000-****-****';
}
/* KR 端能看到的案件：选了本医院，且面诊费已缴或已免除（KR 在客人缴费后才看得到案件；未缴费 / 不面诊的本地案件 / 选了别家医院的都看不到） */
function krCaseVisible(c, hid){
  if(c && c.krVisit && c.krVisit.hospitalId===hid) return true; /* CMD-1014-16：IN 在 KR 日程占位、KR 确认后建的「在韩到店」案件，KR 和 IN 都看得到 */
  if(!c || c.hospitalId !== hid) return false;
  if(c.consultFeeWaived || c.reportReady || c.reuseReport) return true;
  return !!c.consultRequested && ['paid_waiting_kr','awaiting_report','report_ready'].indexOf(c.consultStatus) > -1;
}


/* ---- 赴韩项目资料与术后管理分配（2026-10-06，KR-CASE-02 第 1、2 节） ---- */
var ANES_LABEL = {local:'局部麻醉', sleep:'睡眠麻醉', general:'全身麻醉'};
/* 项目资料一行小字：麻醉特性、推荐在韩时间、所需术后管理（KR 写诊疗方案时填的） */
/* 术后管理条目：每个赴韩项目各自的「所需术后管理」逐条列出（CMD-1015-16：共同术后管理已拿掉）；返回 [{it, x, i}] */
function pcUniqueEntries(c){
  var out = [];
  krActiveItems(c).forEach(function(it){ (it.postcare||[]).forEach(function(x, i){ out.push({it:it, x:x, i:i}); }); });
  return out;
}
/* CMD-1019-10：管理项目的数量单位 = 「份」，写在数字后面；规格带次数（如「身体 60kj·3次」）时括号里写总次数 = 规格次数 × 份数。
   项目条目：qty = 总次数（持有 / 扣次数一直读它）、copies = 份数、specTimes = 规格次数、firstDay = 第一次使用（施术日 / 到院日之后几天，0 = 当天）、interval = 间隔天数（总次数 > 1 才有） */
function mgmtCopies(it){ if(it.copies) return it.copies; var st = it.specTimes||1; return st>1 ? Math.max(1, Math.round((it.qty||1)/st)) : (it.qty||1); }
function mgmtQtyText(it){ var cp = mgmtCopies(it), tt = it.qty||1; return cp+' 份'+(tt!==cp ? '（共 '+tt+' 次）' : ''); }
function mgmtScheduleText(it){ var tt = it.qty||1; return (it.firstDay!==undefined && it.firstDay!==null && it.firstDay!=='' ? '，第一次使用：'+(Number(it.firstDay)===0 ? '当天' : it.firstDay+' 天后') : '')+(tt>1 && it.interval ? '，每隔 '+it.interval+' 天' : ''); }
function pcLineText(x){ return pcLabel(x)+' × '+x.times+(x.times>1 && x.interval ? '（每隔 '+x.interval+' 天）' : '')+(pcDayText(x) ? ' '+pcDayText(x) : '')+'｜'+(x.place==='KR' ? '必须在韩国' : '韩国或印尼都可'); }
function itemMetaText(it){
  var bits = [];
  if(it.anesthesia) bits.push('麻醉：'+anesDisplay(it.anesthesia));
  if(it.stay) bits.push('推荐在韩：'+it.stay);
  if(it.mgmt) bits.push('管理项目：'+mgmtQtyText(it)+mgmtScheduleText(it)+'（付费）');
  (it.postcare||[]).forEach(function(x){ /* 术后管理挂在赴韩项目下显示（CMD-1008-12 C7）：每项标「在韩国 / 在印尼」，如「好莱坞焕肤（在印尼）」 */
    var where = (x.mgmt ? x.mgmt+'：' : '')+(x.place==='KR' ? x.name+'（在韩国，必须）' : (x.innName ? x.name+'（在韩国）或 '+x.innName+'（在印尼）' : x.name+'（在韩国；没有印尼对应项目）'));
    bits.push('术后管理：'+where+' × '+x.times+(x.times>1 && x.interval ? '（每隔 '+x.interval+' 天）' : '')+(pcDayText(x) ? '，'+pcDayText(x) : '')); });
  return bits;
}
/* ---- CMD-1019-17：建议在韩天数（施术日 = 第 0 天） ----
   最少天数 = 这个施术「必须在韩国」（place 不是 either）的术后管理里最后一次的第 N 天 + 1；没有 = 1 天。
   entries 可以是表单行（start）或项目快照里的行（startDay / day）。KR 可以往上加、不能少于最少天数；比最少多要写「停留原因」。 */
var STAY_REASON_TAGS = ['术后需静养', '不宜搭飞机', '消肿观察', '其他'];
function stayMinOf(entries){
  var best = {min:1, why:''};
  (entries||[]).forEach(function(x){
    if(!x || x.place==='either') return;
    var st = x.startDay!==undefined && x.startDay!==null && x.startDay!=='' ? x.startDay : x.start;
    var days = pcDays({startDay:st, day:x.day, times:x.times, interval:x.interval}); if(!days.length) return;
    var last = days[days.length-1];
    if(last+1 > best.min) best = {min:last+1, why:'第 '+last+' 天需在韩国'+(x.mgmt||x.name||'做术后管理')};
  });
  return best;
}
/* 停留原因 {tags:[], fly:'', note:''} → 文字：术后需静养、7 天内不宜搭飞机、…；其他 + 补充 */
function stayReasonText(r){
  if(!r) return ''; var out = [];
  (r.tags||[]).forEach(function(t){ if(t==='不宜搭飞机') out.push((parseInt(r.fly,10)>0 ? parseInt(r.fly,10)+' 天内' : '')+'不宜搭飞机'); else if(t!=='其他') out.push(t); });
  var note = String(r.note||'').trim(); if(note) out.push(note);
  return out.join('、');
}
function stayReasonOk(r){ if(!r) return false; var tags = (r.tags||[]).length, note = String(r.note||'').trim(); if((r.tags||[]).indexOf('其他')>-1 && !note) return false; return !!(tags || note); }
/* 一个施术项目的建议天数信息：days 建议天数、min 最少、why 为什么至少这么多、reason 为什么比最少还多 */
function itemStayInfo(it){
  var days = recStayDays(it), mi = stayMinOf(it.postcare), more = days > mi.min;
  return {days:days, min:mi.min, why:mi.why, more:more, reason:more ? stayReasonText(it.stayReason) : ''};
}
/* 整趟：各施术项目的最大值；原因来自最大的那些项目（多个时合并，带项目名）。no 日期时 earliest 为空 */
function ymdAdd(ds, n){ var t = new Date(ds+'T00:00:00'); t.setDate(t.getDate()+n); return t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2); }
function ymdDiff(a, b){ return Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00'))/86400000); }
/* CMD-1019-21 三：每个施术从「它自己的施术日」算起（dateOf(it) → 日期，没有就用 base）；最早可回国日 = 各施术「施术日 + 建议天数」里最晚的一个；
   停留天数 = 最早可回国日 − 最早的施术日（只有一个施术日时和原来一样 = 各项目最大值）；原因取决定最早回国日的那些项目 */
function stayPlanOf(items, base, dateOf){
  var rows = (items||[]).filter(function(it){ return !it.mgmt && !it.mgmtPlan && !it.service && it.stay; }).map(function(it){ var i = itemStayInfo(it); i.name = it.name; i.date = (dateOf ? dateOf(it) : '') || base || ''; return i; });
  if(!rows.length) return {days:0, earliest:'', reason:''};
  var dated = rows.every(function(x){ return x.date; });
  var key = function(x){ return dated ? ymdAdd(x.date, x.days) : ''; };
  var top, days, earliest = '';
  if(dated){
    earliest = rows.reduce(function(m, x){ var k = key(x); return k > m ? k : m; }, '');
    top = rows.filter(function(x){ return key(x)===earliest; });
    var first = rows.reduce(function(m, x){ return x.date < m ? x.date : m; }, rows[0].date);
    days = ymdDiff(first, earliest);
  } else { days = rows.reduce(function(m, x){ return Math.max(m, x.days); }, 0); top = rows.filter(function(x){ return x.days===days; }); }
  var texts = top.map(function(x){ return x.more ? (x.reason || '') : x.why; }), uniq = texts.filter(function(t, i){ return t && texts.indexOf(t)===i; });
  var parts = uniq.length<=1 ? uniq : top.map(function(x, i){ return texts[i] ? x.name+'：'+texts[i] : ''; }).filter(Boolean); /* 原因都一样就只写一次，不同才带项目名 */
  return {days:days, earliest:earliest, reason:parts.filter(function(x, i){ return parts.indexOf(x)===i; }).join('；')};
}
/* 「建议在韩停留 8 天（最早 2026-11-08 可回国）：第 7 天需在韩国拆线」 */
function stayLineText(p){ if(!p || !p.days) return ''; return '建议在韩停留 '+p.days+' 天'+(p.earliest ? '（最早 '+p.earliest+' 可回国）' : '')+(p.reason ? '：'+p.reason : ''); }
/* 推荐项目整理（CMD-1012-02 B7）：根据选中的赴韩项目自动生成——推荐在韩天数 = 各项最大值；逐项「项目｜推荐在韩 N 天｜麻醉 + 备注｜术后管理明细」；整体备注 */
function recStayDays(it){ var m = String(it.stay||'').match(/(\d+)/); return m ? parseInt(m[1], 10) : 0; }
function recSummaryData(items, overall, base, dateOf){
  var mg = items.filter(function(it){ return it.mgmt; }); items = items.filter(function(it){ return !it.mgmt; }); /* 管理项目（KR 本地管理项目）单独列一段，不算推荐在韩天数 */
  var days = items.reduce(function(m, it){ return Math.max(m, recStayDays(it)); }, 0);
  var rows = items.map(function(it){
    var an = it.anesthesia ? anesDisplay(it.anesthesia) : '—';
    var pc = (it.postcare||[]).map(pcLineText);
    return {name:it.name, stay:it.stay ? recStayDays(it)+' 天' : '—', stayWhy:it.stay ? (function(i){ return i.more ? i.reason : i.why; })(itemStayInfo(it)) : '', anes:an, pc:pc, note:it.note||''};
  });
  return {days:days, stay:stayPlanOf(items, base, dateOf), rows:rows, overall:overall||'', mgmt:mg.map(function(it){ return {name:it.name, qty:it.qty||1, copies:it.copies, specTimes:it.specTimes, firstDay:it.firstDay, interval:it.interval||0, note:it.note||''}; })};
}
function recSummaryHtml(items, overall, opt){
  opt = opt || {};
  var d = recSummaryData(items, overall, opt.base, opt.dateOf), e = function(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;'); };
  if(!d.rows.length && !d.mgmt.length) return '';
  return '<div class="rec-summary" style="border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin:10px 0;background:#fff;">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><b style="font-size:13px;">推荐项目整理</b>'+(opt.print ? '<button class="btn-outline" style="padding:3px 10px;font-size:12px;" onclick="printRecSummary()">打印</button>' : '')+'</div>'+
    '<div style="font-size:13px;margin:6px 0;">'+(d.stay.days ? '<b>'+e(stayLineText(d.stay))+'</b>' : '推荐在韩天数：<b>—</b>')+' <span style="color:var(--muted);font-size:12px;">（各项目最大值；施术日 = 第 0 天）</span></div>'+
    d.rows.map(function(r){ return '<div style="font-size:12px;padding:6px 0;border-top:1px solid var(--border2);"><b>'+e(r.name)+'</b>｜推荐在韩 '+e(r.stay)+(r.stayWhy ? '（'+e(r.stayWhy)+'）' : '')+'｜麻醉：'+e(r.anes)+(r.note ? '｜备注：'+e(r.note) : '')+(r.pc.length ? '<div style="color:var(--slate2);margin-top:2px;">术后管理：'+r.pc.map(e).join('；')+'</div>' : '<div style="color:var(--muted);margin-top:2px;">术后管理：无</div>')+'</div>'; }).join('')+
    (d.mgmt.length ? '<div style="font-size:12px;border-top:1px solid var(--border2);padding:6px 0;"><b>管理项目</b>（付费，只在韩国做）'+d.mgmt.map(function(m){ return '<div style="color:var(--slate2);margin-top:2px;">'+e(m.name)+' × '+mgmtQtyText(m)+mgmtScheduleText(m)+(m.note ? '｜'+e(m.note) : '')+'</div>'; }).join('')+'</div>' : '')+
    (d.overall ? '<div style="font-size:12px;border-top:1px solid var(--border2);padding-top:6px;margin-top:2px;">整体备注：'+e(d.overall)+'</div>' : '')+
    (opt.inNote ? '<div style="font-size:12px;padding-top:6px;margin-top:2px;">IN 室长备注：'+e(opt.inNote)+'</div>' : '')+'</div>';
}
/* 打印推荐项目整理（给客人）：只打印这一块 */
function printRecSummary(){
  var el = document.querySelector('.rec-summary'); if(!el) return;
  var w = window.open('', '_blank'); if(!w) return;
  w.document.write('<html><head><meta charset="utf-8"><title>推荐项目整理</title></head><body style="font-family:sans-serif;padding:24px;">'+el.outerHTML.replace(/<button[^>]*>.*?<\/button>/g, '')+'</body></html>'); w.document.close(); w.focus(); w.print();
}
/* 赴韩项目行下方写出具体安排（推荐在韩 / 麻醉 / 所需术后管理）；full=false 时不含术后管理（那里另有 pcLinesHtml） */
function itemArrangeHtml(it, full){
  var bits = itemMetaText(it).filter(function(b){ return full || b.indexOf('术后管理：')!==0; });
  if(!bits.length) return '';
  return '<div style="flex-basis:100%;font-size:12px;color:var(--slate2);margin:2px 0 4px 2px;line-height:1.6;">'+bits.map(function(b){ return String(b).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }).join('<br>')+'</div>';
}
function pcAllocEditable(c){ return !c.krBalancePaid && !isEnded(c); } /* 付尾款前都可以改 */
/* 已选 / 结算单里每个赴韩项目下面的术后管理行：显示韩国 n + 印尼 m；可弹性的（且有印尼对应项目）IN 室长可调 */
function pcLinesHtml(c, it, fn){
  /* IN 不再分配术后管理（CMD-1013-04 五）：只读显示 必须在韩国 / 韩国或印尼都可、次数、第 N 天起；「韩国或印尼都可」一律由 KR 在付清尾款后的预约弹窗决定 */
  if(!(it.postcare||[]).length) return '';
  return '<div style="margin:-2px 0 8px 12px;padding:6px 10px;background:var(--bg2,#faf6ef);border-radius:8px;font-size:12px;color:var(--slate2);"><div style="color:var(--muted);margin-bottom:2px;">术后管理（含在套餐内，不另收费；地点由 KR 在付清尾款后预约时决定）</div>'+it.postcare.map(function(x){
    var head = (x.mgmt ? x.mgmt+'｜' : '')+x.name+' × '+x.times+' 次'+(pcDayText(x)?'（'+pcDayText(x)+'）':'');
    return '<div style="margin:3px 0;">'+head+'：'+(x.place==='KR' ? '必须在韩国' : '韩国或印尼都可')+'</div>';
  }).join('')+'</div>';
}
/* 麻醉同意书（占位文案，等用户撰写；记录版本 + 签署时间存在案件上） */
var ANES_CONSENT_VERSION = 'v0.1（占位文案）';
/* CMD-1019-14：睡眠 / 全麻的「需空腹（小时）」数字（an.fast）；旧数据没有 fast 时从备注「空腹 N 小时」里读（迁移 52 也会写进去） */
function anesFastParse(note){ var m = /空腹\s*(\d+)\s*小时/.exec(String(note||'')); return m ? parseInt(m[1], 10) : ''; }
function anesFastOf(an){ if(!an || !an.type || an.type==='local') return ''; var f = an.fast!==undefined && an.fast!==null ? parseInt(an.fast, 10) : anesFastParse(an.note); /* fast 有这个键（含空）= 以数字栏为准；没有这个键的旧数据才读备注 */ return f>0 ? f : ''; }
function anesFastClean(d){ if(!d || d.anes==='local') return ''; var f = parseInt(d.anesFast, 10); return f>0 ? f : ''; }
/* 麻醉显示文字：麻醉方式（备注；有空腹小时数而备注里没写就补「需空腹 N 小时」） */
function anesDisplay(an){ if(!an) return '—'; var f = anesFastOf(an), note = an.note||'', bits = [note]; if(f && !/空腹/.test(note)) bits.push('需空腹 '+f+' 小时'); bits = bits.filter(Boolean); return (an.label||'')+(bits.length ? '（'+bits.join('，')+'）' : ''); }
function anesItemsOf(items){ return (items||[]).filter(function(it){ return it.origin==='KR' && it.anesthesia; }).map(function(it){ return {name:it.name, type:it.anesthesia.type, label:it.anesthesia.label, note:it.anesthesia.note||''}; }); }
function anesNeeded(c, items){
  var list = anesItemsOf(items); if(!list.length) return [];
  var signed = (c.anesthesiaConsent && c.anesthesiaConsent.projects) || [];
  return list.filter(function(a){ return !signed.some(function(s){ return s.name===a.name && s.type===a.type; }); });
}


/* CMD-1014-15 三：日视图标题的相对日子（前天 / 昨天 / 今天 / 明天 / 后天；再往外不写）：n = 距离今天的天数 */
function relDayLabel(n){ return {'-2':'前天','-1':'昨天','0':'今天','1':'明天','2':'后天'}[String(n)] || ''; }
/* CMD-1014-18：周 / 月标题后缀。周：这一周含今天 = 本周，往前一周 = 上周，往后一周 = 下周，再往外不写；月同理 */
function relWeekLabel(startDs, todayDs){ var w = Math.floor(relDayDiff(todayDs, startDs) / 7); return {'0':'本周','1':'上周','-1':'下周'}[String(w)] || ''; }
function relMonthLabel(ym, todayYm){ var a = parseInt(ym.slice(0,4),10)*12 + parseInt(ym.slice(5,7),10), b = parseInt(todayYm.slice(0,4),10)*12 + parseInt(todayYm.slice(5,7),10); return {'0':'本月','-1':'上个月','1':'下个月'}[String(a-b)] || ''; }
function relDayDiff(ds, todayDs){ return Math.round((new Date(ds+'T00:00:00') - new Date(todayDs+'T00:00:00')) / 86400000); }

/* CMD-1015-05 十一：案件管理按「最近更新」排序（最近有变动的在最上面）——取 Timeline 里最晚的一条时间；没有记录的排最后 */
function caseUpdatedKey(c){ var m = ''; ((c && c.logEntries)||[]).forEach(function(e){ if(e.dt && e.dt > m) m = e.dt; }); return m || ((c && c.visitDate) ? c.visitDate+' '+(c.visitTime||'00:00') : ''); }
/* 案件开始时间（CMD-1015-17）：Timeline 里最早的一条（UTC），没有就用预约来访时间；列表显示按页面时区换算 */
function caseStartKey(c){ var m = ''; ((c && c.logEntries)||[]).forEach(function(e){ if(e.dt && (!m || e.dt < m)) m = e.dt; }); return m || ((c && c.visitDate) ? c.visitDate+' '+(c.visitTime||'00:00') : ''); }
function caseStartText(c){ var k0 = caseStartKey(c); return k0 ? (fmtUtc(k0) || k0) : '—'; }
function caseUpdatedDesc(a, b){ return caseUpdatedKey(b).localeCompare(caseUpdatedKey(a)); }
