/* shared/rules.js —— 规则层：状态推导、结局、权限/资格判断、日期与格式化等不碰界面的纯函数
   由 gmc-network-prototype.html 拆分而来（2026-10-05 结构拆分）。classic script，全局函数/变量，不使用 ES module。 */

function dowOfDate(ds){ var d = new Date(ds+'T00:00:00'); var wd = d.getDay(); return wd===0 ? 6 : wd-1; }

function dateLabel(ds){ var d = new Date(ds+'T00:00:00'); return (d.getMonth()+1)+'.'+d.getDate()+' 周'+DOW_CN[dowOfDate(ds)]; }
 /* 只含启用的院长（案例库院长节点、选项都读这个） */
function isDirectorActive(name){ return Object.keys(HOSPITAL_DATA).some(function(h){ return hospitalDirectorNames(h).indexOf(name)>-1; }); } /* 院长名字在各医院里不重名；停用的不算 */

function clientCaseStatus(entry){
  var c = clientLatestCase(entry.name);
  if(!c) return {label:entry.fallback.label, bg:entry.fallback.bg, fg:entry.fallback.fg, finance:'<span style="font-size:12px;color:var(--muted);">—</span>'};
  var b = caseStatusBadge(c);
  return {label:b[2], bg:b[0], fg:b[1], finance:financeCellHtml(c)};
}

/* ============ 结局模型（2026-09-30）：终态只有 已结案 / 仅出报告 / 已取消，由系统在案件结束时推算 ============
   判断标准是"客人得到了什么"，退多少钱不影响结局，退款只记入财务字段 financeResult + refunds */
function isEnded(c){ return c.stage==='closed' || c.stage==='reportonly' || c.stage==='cancelled'; }

function isLocalCtxWorkDone(ctx){ return !!ctx && (!!ctx.mgmtDone || ((ctx.mgmtUses||[]).length>0 && ctx.mgmtStatus!=='cancelled_all')); }

function caseHasPurchase(c){
  var any = false, live = false;
  getClientHoldings(c.name).forEach(function(h){ h.batches.forEach(function(b){ if(b.caseId===c.id && !b.kr){ any = true; if(!b.voided && !b.refund) live = true; } }); });
  if(any) return live; /* 买过但已全退 → 视为没有购买 */
  var main = (c.settlementBatches||[]).some(function(b){ return b.status==='active' && b.inTotal>0; });
  var lm = !!c.localMgmt && (c.localMgmt.batches||[]).length>0;
  return main || lm;
}

function computeOutcome(c){
  if(caseWorkDone(c) || caseHasPurchase(c)) return 'closed';
  return c.reportReady ? 'reportonly' : 'cancelled';
}

function hasRefundMark(c){ return refundSum(c)>0 || (c.holdingRefunds||[]).length>0 || c.cancelReason==='仅办理退款'; }

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

function caseStatusLabel(c){
  if(c.stage==='booked') return c.subState==='arrived' ? '接待中' : '待访问';
  if(c.stage==='consult'){
    if(c.localAsk) return '项目确认中'; /* 赴韩项目全退后等待确认是否做本地管理：总览没写，暂留在项目确认中 */
    var inFlow = c.consultRequested && !c.reportReady;
    if(inFlow && (c.consultStatus==='awaiting_payment' || c.consultStatus==='paid_waiting_kr')) return '面诊预约'; /* 小状态：待缴费 → 待确认报告时间 */
    if(inFlow && c.consultStatus==='awaiting_report') return '等待报告';
    if(c.projectsEnabled || c.reportReady) return '项目确认中'; /* 含待付款（小状态）；"已出报告"只是 Timeline 事件 */
    if(c.consultStatus==='cancelled') return '面诊已取消';
    return '面诊预约';
  }
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
  if(consultCarryStage(c)) return 'consult';
  if(c.mgmtActive) return 'local'; /* 使用项目后进入"本地管理" */
  if(c.settlementDone && krActiveItems(c).length>0) return 'travel'; /* 付款完成 → 施术预约；之后读施术日期卡片（Draft/Pending=施术预约，其余=赴韩施术） */
  if(isLocalCase(c)) return 'local'; /* 选择项目（是否持有/使用/选购/付款都在这个状态内） */
  if(c.projectsEnabled) return 'consult'; /* 项目确认中（含待付款小状态） */
  if(c.consultRequested) return 'consult'; /* 面诊预约 / 等待报告 */
  return 'booked';
}

function isRescheduleDateDisabled(d){
  return CLINIC_SETTINGS.closedDow.indexOf(d.getDay()) > -1; /* 休诊日读诊所设定（默认周四） */
}
 /* 演示按钮"模拟时间超过30分钟"会把演示时钟往后拨 */
/* 演示时钟 = 电脑当前时间 + 演示按钮往后拨的毫秒数（2026-10-06 起不再固定在 2026-09-18 11:00） */
function demoNow(){ return new Date(Date.now() + DEMO_SHIFT_MS); }

/* 演示数据的日期一律写成"相对今天"：D(0)=今天、D(-3)=3 天前、D(2)=2 天后；KD(n) 是韩文日期（对话分隔线用） */
function D(n){ var d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+n); return dateStr(d); }
function KD(n){ var d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+n); return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일'; }

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
  var pc = {'待付款':['#FBF0C9','#8F6F0C'], '已付款':['var(--sage-bg)','var(--sage)'], '计入尾款':['var(--blue-bg)','var(--blue)'], '部分退款':['var(--terracotta-bg)','var(--terracotta)'], '全额退款':['#EDEAE2','var(--muted)']}[st];
  var krs = krAllItems(c).filter(function(it){ return it.batchId===b.id; });
  var rows = krs.map(function(it){
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;'+(it.cancelled?'text-decoration:line-through;color:var(--muted);':'')+'">'+it.name+'</span><span style="font-size:12px;color:var(--slate2);">'+(it.price?formatCurrency(it.price,'KRW'):'')+' · '+krItemStatus(it)+'</span></div>';
  }).join('');
  if((b.inItems||[]).length){
    rows += b.inItems.map(function(it){
      var rb = null; getClientHoldings(c.name).forEach(function(h){ if(h.itemName===it.name) h.batches.forEach(function(x){ if(x.caseId===c.id && x.refund && x.bought===it.qty) rb = x.refund; }); });
      return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+it.name+' ×'+it.qty+(it.discountPct<100?'（'+it.discountPct+'折）':'')+'</span><span style="font-size:12px;color:var(--slate2);">本地 · 已转客户持有'+(rb?' · <b style="color:var(--terracotta);">'+'已退款 '+formatCurrency(rb.amount,'IDR')+'</b>':'')+'</span></div>';
    }).join('');
  }
  var amounts = [];
  if(b.noDeposit) amounts.push('更换项目（'+(b.swapOf||'')+'→）：不收定金，金额 '+formatCurrency(b.krTotal,'KRW')+' 直接计入尾款');
  else if(b.krDeposit) amounts.push('赴韩定金 '+formatCurrency(b.krDeposit,'KRW')+'（合计 '+formatCurrency(b.krTotal,'KRW')+'）');
  if(b.inTotal) amounts.push('本地全款 '+formatCurrency(b.inTotal,'IDR'));
  var refunds = (c.refunds||[]).filter(function(r){ return (r.batchIds||[]).indexOf(b.id)>-1; }).map(function(r){
    return '<div style="font-size:12px;color:var(--terracotta);margin-top:4px;">退款 '+formatCurrency(r.amount,'KRW')+'（'+r.items.join('、')+'；原因：'+r.reason+'）</div>';
  }).join('');
  var canCancel = b.status!=='unpaid' && krNotStartedItems(c).some(function(it){ return it.batchId===b.id; }) && !c.hasArrived && !c.visitClosed;
  var actions = b.status==='unpaid'
    ? '<button class="btn-primary" style="margin-top:10px;" onclick="settleProjects(\''+b.id+'\')">确认付款</button>'
    : (canCancel ? '<button class="btn-outline" style="margin-top:10px;" onclick="openCancelItems(\''+b.id+'\')">取消项目</button>' : '');
  return '<div style="border:1px solid var(--border2);border-radius:12px;padding:16px 18px;margin-bottom:12px;">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:13px;font-weight:700;">结算单 '+b.id+' <span style="font-weight:400;color:var(--muted);font-size:11px;">'+b.time+'</span></span><span class="status-pill" style="background:'+pc[0]+';color:'+pc[1]+';">'+st+'</span></div>'+
    (rows || '<div style="font-size:12px;color:var(--muted);">（项目明细略）</div>')+
    '<div style="font-size:12px;color:var(--slate2);margin-top:8px;">'+amounts.join('　')+'</div>'+refunds+actions+'</div>';
}

/* 汇总行（2026-10-01）：项目合计 / 已收定金 / 已退金额 / 应付尾款，跨所有结算单计算（赴韩=韩元，本地=印尼盾，不相加） */
function settlementSummaryHtml(c){
  var info = krBalanceInfo(c), ref = refundSum(c), pd = financePaid(c);
  var hasKr = krAllItems(c).length>0;
  var totalTxt = (hasKr ? formatCurrency(info.total,'KRW') : '') + ((hasKr && pd.inn>0) ? ' ＋ ' : '') + (pd.inn>0 ? formatCurrency(pd.inn,'IDR') : '') || '—';
  var balTxt = !krActiveItems(c).length ? '—' : c.krBalancePaid ? '已结清' : (info.diff>=0 ? formatCurrency(info.diff,'KRW') : '应退 '+formatCurrency(-info.diff,'KRW'));
  var cell = function(k, v){ return '<div style="flex:1;min-width:120px;"><div style="font-size:11px;color:var(--muted);margin-bottom:2px;">'+k+'</div><div style="font-size:14px;font-weight:700;">'+v+'</div></div>'; };
  return '<div style="display:flex;gap:14px;flex-wrap:wrap;background:var(--border2);border-radius:10px;padding:12px 14px;margin-bottom:12px;">'+
    cell('项目合计', totalTxt)+cell('已收定金', hasKr ? formatCurrency(info.deposit,'KRW') : '—')+cell('已退金额', ref>0 ? formatCurrency(ref,'KRW') : '—')+cell('应付尾款', balTxt)+'</div>';
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
    if(removable){
      priceHtml = '<input type="number" min="1" value="'+qty+'" onchange="setInItemField(\''+it.projectId+'\',\'qty\',this.value)" style="width:44px;padding:3px 4px;border:1px solid var(--border);border-radius:5px;font-size:12px;text-align:center;"> 次 × '+
        '<input type="number" min="1" max="100" value="'+pct+'" onchange="setInItemField(\''+it.projectId+'\',\'discountPct\',this.value)" style="width:44px;padding:3px 4px;border:1px solid var(--border);border-radius:5px;font-size:12px;text-align:center;">% ＝ '+
        '<b>'+formatCurrency(lineTotal,ccy)+'</b>'+
        ' <a href="#" class="info-link" onclick="toggleProject(\''+it.projectId+'\');return false;">移除</a>';
    } else {
      priceHtml = qty+'次'+(pct<100?'，'+pct+'折':'')+'　<b>'+formatCurrency(lineTotal,ccy)+'</b>'+(pct<100?' <span style="color:var(--muted);text-decoration:line-through;font-size:11px;">'+formatCurrency(origPrice,ccy)+'</span>':'');
    }
    var held = clientHeldRemaining(c.name, it.name);
    var heldTag = held>0 ? ' <span style="font-size:11px;color:var(--sage);">持有 '+held+' 次</span>' : '';
    var noteRow = removable ? '<div class="case-field-row" style="border-top:none;padding-top:0;padding-bottom:10px;"><input type="text" placeholder="备注（选填）" value="'+(it.itemNote||'')+'" onchange="setInItemField(\''+it.projectId+'\',\'itemNote\',this.value)" style="width:100%;padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:11px;"></div>' : '';
    return '<div class="case-field-row" style="flex-wrap:wrap;gap:6px;"><span style="flex-grow:1;font-size:13px;'+strike+'">'+it.name+heldTag+'</span><span style="font-size:12px;display:flex;align-items:center;gap:4px;">'+priceHtml+'</span></div>'+noteRow;
  }
  var action = removable
    ? ' <a href="#" class="info-link" onclick="toggleProject(\''+it.projectId+'\');return false;">移除</a>'
    : '';
  return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;'+strike+'">'+it.name+(it.done?'（已完成）':'')+'</span><span style="font-size:13px;font-weight:700;">'+formatCurrency(it.price, ccy)+action+'</span></div>';
}

function settlementBigCardHtml(c, items, removable){
  var krItems = items.filter(function(it){ return it.origin==='KR'; });
  var inItems = items.filter(function(it){ return it.origin==='IN'; });
  if(!krItems.length && !inItems.length){
    return '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">尚未选择项目</div>';
  }
  var krCard = '';
  if(krItems.length){
    var krTotal = krItems.reduce(function(s,it){ return s+it.price; },0);
    var krDeposit = Math.round(krTotal*KR_DEPOSIT_RATE);
    krCard = '<div style="border:1px solid var(--border2);border-radius:12px;padding:16px 18px;margin-bottom:12px;">'+
      '<div style="font-size:12px;font-weight:700;color:var(--terracotta);margin-bottom:8px;">赴韩项目</div>'+
      krItems.map(function(it){ return settlementItemRow(c, it, removable); }).join('')+
      '<div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:6px;border-top:1px solid var(--border);font-size:13px;"><span>合计</span><span style="font-weight:700;">'+formatCurrency(krTotal,'KRW')+'</span></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:var(--terracotta);"><span>定金（'+Math.round(KR_DEPOSIT_RATE*100)+'%，比例待业务确认）</span><span>'+formatCurrency(krDeposit,'KRW')+'</span></div>'+
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
  var total = krActiveItems(c).reduce(function(sum,it){ return sum + (it.price||0); }, 0); /* 实际要做的项目合计（不含已取消/已更换） */
  return {deposit:deposit, preRefund:preRefund, effDeposit:effDeposit, total:total, diff:total-effDeposit}; /* diff>0 补尾款；diff<0 退差额 */
}

/* 结算尾款：实际项目合计 − 定金（先抵）；补尾款（KR在韩国收）或退差额（IN 按 KR 判断的金额走退款弹窗） */
function settleKrBalance(){
  var c = getCurrentCase(); if(!c || !c.krJudge || c.krJudge.result!=='changed' || c.krJudge.settled) return;
  var info = krBalanceInfo(c);
  if(info.diff<0){ openRefundModal([], 'diffRefund', false, -info.diff); return; }
  c.krBalancePaid = true; c.krJudge.settled = true;
  logCaseEvent(c, '김민석 원장', 'KR结算尾款：实际项目合计 '+formatCurrency(info.total,'KRW')+'，可抵定金 '+formatCurrency(info.effDeposit,'KRW')+'（定金合计 '+formatCurrency(info.deposit,'KRW')+' − 到院前已退 '+formatCurrency(info.preRefund,'KRW')+'），补尾款 '+formatCurrency(info.diff,'KRW'));
  buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
}
 /* 赴韩项目收预付金比例，演示先用30%，具体比例待业务确认 */
/* items 现在是快照数组（自带 price/origin），不用再回查项目库；本地项目按个数+折扣算总价（2026-09-29 第十轮新增） */
function computeBatchBreakdown(items){
  var krItems = [], inItems = [], krTotal = 0, inTotal = 0;
  items.forEach(function(it){
    if(it.origin==='KR'){ krItems.push(it); krTotal += it.price; }
    else {
      inItems.push(it);
      var qty = it.qty||1, pct = (it.discountPct===undefined||it.discountPct===null) ? 100 : it.discountPct;
      inTotal += Math.round(it.price*qty*pct/100);
    }
  });
  var krDeposit = Math.round(krTotal * KR_DEPOSIT_RATE);
  return {krItems:krItems, krTotal:krTotal, krDeposit:krDeposit, krBalance:krTotal-krDeposit, inItems:inItems, inTotal:inTotal};
}
 /* 会被 nearestOpenMonth()/修改日期时的原定月份实时覆盖，这里只是初值 */
function fmtDateYMD(y,m,d){
  var mm = (m+1)<10 ? '0'+(m+1) : String(m+1);
  var dd = d<10 ? '0'+d : String(d);
  return y+'-'+mm+'-'+dd;
}

/* 施术前2周内不可修改日期：TODAY_DATE 是原型里的"今天"（当天 0 点，取电脑日期；2026-10-06 起不再固定），比较用它 */
function isWithin2WeeksOfToday(dateStr){
  if(!dateStr) return false;
  var diffDays = (new Date(dateStr) - TODAY_DATE) / 86400000;
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

function workingIN(){ var today = nowFullDt().split(' ')[0]; return IN_COORDINATORS.filter(function(n){ return !isOffOn(n, today); }); }

/* ---- 案件对话房规则（2026-10-02 选院长+对话合并版·二） ----
   建房条件：不面诊 = 基础资料确认后；面诊 = 缴费（或免除）后；之前完全不显示［发起对话］和"+新建案件对话"候选；终态案件没有房间。
   成员：不面诊 = 全部IN室长；面诊 = 全部IN室长 + 全部KR室长 + 选定院长（不面诊案件点"增加面诊"并缴费后，KR室长和院长才加入）。
   推播/toast/未读：只给"负责该案件的IN室长"和"确认报告时间或上传报告的KR室长"；其他室长是成员但不推播；院长完全不推播、不提醒、不显示未读。 */
function caseRoomEligible(c){
  if(!c || !c.materialsConfirmed || isEnded(c)) return false;
  if(c.consultRequested && c.consultStatus==='awaiting_payment') return false; /* 面诊案件缴费（或免除）后才能建房 */
  return true;
}

function caseHasKrSide(c){
  return !!c.consultRequested && c.consultStatus!=='awaiting_payment' && c.consultStatus!=='cancelled';
}

function isOffOn(name, date){ var k = offNameKey(name); return CAL_MEMOS.some(function(m){ return m.type==='OFF' && m.date===date && offNameKey(m.person)===k; }); }

function pushTargets(c){
  var today = nowFullDt().split(' ')[0], ops = caseOperators(c);
  var pick = function(opsList, all){
    var work = opsList.filter(function(n){ return !isOffOn(n, today); });
    return work.length ? work : all.filter(function(n){ return !isOffOn(n, today); });
  };
  return {inn: pick(ops.inn, IN_COORDINATORS), kr: (ops.kr.length || caseHasKrSide(c)) ? pick(ops.kr, KR_COORDINATORS) : []};
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
  owner:   {work:false, bizdata:true,  accounts:true,  clinic:true,  oplog:true,  personal:true},
  manager: {work:true,  bizdata:true,  accounts:true,  clinic:true,  oplog:true,  personal:true},
  general: {work:true,  bizdata:false, accounts:false, clinic:false, oplog:false, personal:true}
};
/* 管理类页面（侧边栏"诊所管理"组；老板端的全部导航）。key 同时是 ?page=admin-xxx 的后缀 */
var ADMIN_PAGES = [
  {key:'bizdata',  label:'经营数据', icon:'数', perm:'bizdata'},
  {key:'accounts', label:'账号管理', icon:'账', perm:'accounts'},
  {key:'clinic',   label:'诊所设定', icon:'设', perm:'clinic'},
  {key:'smslog',   label:'短信发送记录', icon:'短', perm:'clinic'}, /* 演示短信集中在这里，老板/管理者在诊所设定旁边看到 */
  {key:'oplog',    label:'操作日志', icon:'志', perm:'oplog'},
  {key:'personal', label:'个人设定', icon:'个', perm:'personal', hidden:true} /* 不在侧边栏，从头像菜单进入 */
];
function canDo(perm, acct){
  var a = acct || currentAccount();
  return !!(a && a.status==='active' && ROLE_PERMS[a.role] && ROLE_PERMS[a.role][perm]);
}
/* 自己的首页：能做日常工作的去 in.html，否则（老板）去 owner.html */
function homeUrl(acct){ var a = acct || currentAccount(); return (a && a.role==='owner') ? '/owner.html' : '/in.html'; }

/* ================= 账号辅助（2026-10-05·二） ================= */
/* 当前页面所属诊所：booking.html 看地址 ?clinic=（正式版必须带诊所，没带应显示错误；原型不带默认 C1）；IN/老板端 = 登录账号的诊所；没登录（登录页）= null */
function resolveClinicId(){
  try{
    if(/booking\.html$/.test(location.pathname)){ var q = new URLSearchParams(location.search).get('clinic'); return q || 'C1'; }
  }catch(e){}
  var a = (typeof currentAccount === 'function') ? currentAccount() : null;
  return a ? (a.clinicId || 'C1') : null;
}
/* 本诊所的账号（账号管理、席位、重名检查、IN 室长名单都只看自己诊所） */
function clinicAccounts(clinicId){ var c = clinicId || CURRENT_CLINIC_ID; return ACCOUNTS.filter(function(a){ return (a.clinicId||'C1')===c; }); }
function clinicAccountPrefix(clinicId){ var c = clinicById(clinicId || CURRENT_CLINIC_ID); return c ? c.accountPrefix : 'A'; }
function accountById(id){ return ACCOUNTS.filter(function(a){ return a.id===id; })[0] || null; }
/* 显示用："Rina（A2）" */
function accountLabel(id){ var a = accountById(id); return a ? (a.name||'（待激活）')+'（'+a.id+'）' : String(id); }
/* 旧演示数据里的操作人只写了名字（Dewi / Rina）：按当时的账号编号显示，不跟随账号后来换人 */
var LEGACY_STAFF_ID = {Dewi:'A1', Rina:'A2'};
/* 日志条目的操作人显示：新条目带 actorId；旧条目按名字查 */
function actorDisplay(entry){
  var n = String(entry.actor||''), id = entry.actorId || LEGACY_STAFF_ID[n];
  return id ? n+'（'+id+'）' : n;
}
function staffLabel(name){ var id = LEGACY_STAFF_ID[name]; return id ? name+'（'+id+'）' : name; }
/* 席位概况：基础 3 + 加购；使用中/待激活占用席位，已停用不占 */
function seatSummary(){
  var used = function(seat){ return clinicAccounts().filter(function(a){ return a.seat===seat && a.status!=='disabled'; }).length; };
  var addonBought = clinicAccounts().filter(function(a){ return a.seat==='addon' && a.status!=='disabled'; }).length;
  return {basicTotal:BASIC_SEATS, basicUsed:used('basic'), addonTotal:addonBought, addonUsed:clinicAccounts().filter(function(a){ return a.seat==='addon' && a.status==='active'; }).length, addonPending:clinicAccounts().filter(function(a){ return a.seat==='addon' && a.status==='pending'; }).length};
}
