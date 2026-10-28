/* ================= CMD-1014-01 三边日历对齐 + 待办补充（10/15 正式采用）=================
   规则：IN-DASH-01 / KR-DASH-01 顶部「🧪 2026-10-14 三边日历对齐」、Notification Center 🧪 第 7 点。
   原则：以 IN 室长现有做法为准，IN 只改日视图（整天时间格）和时间范围（营业时间前后各 2 小时）；其余是 KR 室长 / 院长对齐 IN。
   本文件在 todo.js 之后加载。 */

/* ---------------- 时间范围：营业时间前 2 小时 ～ 后 2 小时 ---------------- */
/* CMD-1015-01：营业时间外（前后 2 小时）按需显示——这一周 / 这一天有预约落在营业前才显示营业前那段，营业后同理；没有就只显示营业时间。
   室长要约营业时间外：时间轴顶 / 底有「▲ 显示营业前 / ▼ 显示营业后」小条，点开才展开（再点收起）。CAL_OUT 只是界面状态，不存档。 */
var CAL_OUT = {in:{b:false,a:false}, kr:{b:false,a:false}, krc:{b:false,a:false}};
function calOutToggle(key, side){ CAL_OUT[key][side] = !CAL_OUT[key][side]; if(key==='krc') krcRender(); else renderCalendar(); }
function calOutBar(key, side, auto){
  if(auto) return ''; var on = CAL_OUT[key][side];
  return '<div class="wk-outbar" onclick="calOutToggle(\''+key+'\',\''+side+'\')">'+(side==='b' ? (on ? '▲ 收起营业前' : '▼ 显示营业前') : (on ? '▼ 收起营业后' : '▲ 显示营业后'))+'</div>';
}
function calInDates(){
  if(CAL_MODE==='day'){ var d = new Date(TODAY_DATE); d.setDate(d.getDate()+DAY_OFFSET); return [dateStr(d)]; }
  var st = getWeekStart(WEEK_OFFSET), out = []; for(var i = 0; i < 7; i++){ var dd = new Date(st); dd.setDate(st.getDate()+i); out.push(dateStr(dd)); } return out;
}
function calInNeed(){
  var open = timeToMin(CLINIC_SETTINGS.openTime), close = timeToMin(CLINIC_SETTINGS.closeTime), ds = calInDates(), b = null, a = null;
  calendarEvents().forEach(function(e){ if(calEvHidden(e) || ds.indexOf(e.date)<0) return; var m = timeToMin(e.time); if(m < open) b = (b===null ? m : Math.min(b, m)); if(m >= close) a = (a===null ? m : Math.max(a, m)); });
  return {b:b, a:a};
}
function calHours(){
  var open = timeToMin(CLINIC_SETTINGS.openTime), close = timeToMin(CLINIC_SETTINGS.closeTime), nd = calInNeed(), a = open, z = close;
  if(CAL_OUT.in.b || nd.b!==null) a = Math.max(0, Math.min(open-120, nd.b!==null ? Math.floor(nd.b/30)*30 : open-120));
  if(CAL_OUT.in.a || nd.a!==null) z = Math.min(24*60, Math.max(close+120, nd.a!==null ? Math.floor(nd.a/30)*30+30 : close+120));
  return slotsBetween(minToTime(a), z >= 24*60 ? '24:00' : minToTime(z));
}
/* KR / 院长：医院营业时间前后各 2 小时（取代固定 08:00～20:00）；整点取整 */
function krcApplyRange(){
  var hr = hospitalHours(krHospitalIdOfMe()), open = timeToMin(hr.open), close = timeToMin(hr.close), a = open, z = close, b = null, af = null;
  if(KRC.mode!=='month'){ /* 按需显示营业时间外（CMD-1015-01）：当前这一天 / 这一周有预约落在营业前 / 后才展开 */
    try{ var a0 = krcAnchor(), ds = KRC.mode==='week' ? [0,1,2,3,4,5,6].map(function(i){ return krcAdd(a0, i); }) : [a0]; var ev = krcEvents();
      ev.surg.concat(ev.busy).forEach(function(x){ var bb = x.b || x; if(ds.indexOf(bb.date)<0) return; var s = timeToMin(bb.time), e = timeToMin(bb.end || bb.time); if(s < open) b = (b===null ? s : Math.min(b, s)); if(e > close) af = (af===null ? e : Math.max(af, e)); });
    }catch(err){}
  }
  KRC_NEED = {b:b!==null, a:af!==null};
  if(CAL_OUT.krc.b || b!==null) a = Math.max(0, Math.min(open-120, b!==null ? b : open-120));
  if(CAL_OUT.krc.a || af!==null) z = Math.min(24*60, Math.max(close+120, af!==null ? af : close+120));
  KRC_H0 = Math.floor(a/60); KRC_H1 = Math.min(24, Math.ceil(z/60));
  KRC_PX = (KRC.mode==='day' && krcWho()!=='all') ? calDayPx(KRC_H1-KRC_H0) : 112; /* CMD-1020-16：医院视图的日视图也用 112px / 小时，保证一格放得下 6 个小标签 */  /* CMD-1020-04：周视图每小时 112px = IN 本院周视图每 30 分钟 56px（.wk-cell min-height）；原先看到的 IN 76px 是 IN 默认日视图（calDayPx），现在两边默认都是周视图；CMD-1015-01·8：格子高度同 IN（日视图 44px/小时，周视图 56px/半小时） */
}
var KRC_NEED = {b:false, a:false};

/* ---------------- IN 日视图：用 KR 日视图的画法（时间格 + 按时长画块；固定栏保留 IN 现在的设计） ---------------- */
var CAL_DAY_PX = 44; /* 一小时 44px（最小值；日视图会把显示的时段平均分配、撑满整个日历卡片，见 calDayPx） */
function calDayPx(hours){ var avail = Math.max(420, window.innerHeight - 300) - 100; return Math.max(44, Math.floor(avail / Math.max(1, hours))); } /* CMD-1015-02·3：日视图撑满卡片，放不下才在卡片内滚动 */
function calEventMinutes(e){
  if(e.kind==='placeholder') return 30;
  if(e.kind==='travel'){ var c = e.caseId ? calCaseById(e.caseId) : null; try{ return c ? Math.max(30, surgeryMinutes(c)) : 120; }catch(err){ return 120; } }
  return 30;
}
/* 营业时间外（营业前 / 营业后的两个小时）室长可代约，弹「营业时间外，确定预约吗？」；客人自助预约不受影响（只能约营业时间内） */
function calOffHoursOk(ds, hr){ return slotBlockReason(ds, hr)==='outside' && !slotIsPast(ds, hr); }
function calOffHoursAdd(ds, hr){ if(confirm('营业时间外，确定预约吗？')) openAddSlotModal(ds, hr); }
function buildDayGridNew(){
  var box = document.getElementById('day-detail'); if(!box) return;
  var d = new Date(TODAY_DATE); d.setDate(d.getDate()+DAY_OFFSET);
  var ds = dateStr(d), closedDay = isRescheduleDateDisabled(d), hrs = calHours(), H0 = timeToMin(hrs[0]), H1 = timeToMin(hrs[hrs.length-1]) + SLOT_MIN, PX = (CAL_DAY_PX = calDayPx((H1-H0)/60));
  var evs = calendarEvents().filter(function(e){ return e.date===ds && !calEvHidden(e); });
  var nowD = demoNow(), nowMin = nowD.getHours()*60 + nowD.getMinutes(), isToday = ds===dateStr(nowD);
  /* CMD-1014-12：同一时段（30 分钟）事件超过 3 个时，和周视图同一规则：只画前 3 个 + "+N 更多"（点开看全部） */
  var bySlot = {}; evs.forEach(function(e){ (bySlot[slotOf(e.time)] = bySlot[slotOf(e.time)] || []).push(e); });
  var moreItems = [], keep = [];
  Object.keys(bySlot).forEach(function(sl){
    var g = bySlot[sl].sort(function(a,b){ return a.time.localeCompare(b.time) || ((a.kind==='placeholder')-(b.kind==='placeholder')) || String(a.name).localeCompare(String(b.name)); });
    keep = keep.concat(g.slice(0,3));
    if(g.length > 3){ var ms = Math.max(timeToMin(sl), H0); moreItems.push({more:{hr:sl, n:g.length-3}, s:ms, e_:ms+SLOT_MIN, end:Math.min(ms+SLOT_MIN, H1)}); }
  });
  var items = keep.map(function(e){ var s0 = Math.max(timeToMin(e.time), H0), e0 = Math.min(timeToMin(e.time)+calEventMinutes(e), H1); if(e0 <= s0) e0 = s0 + 20; return {e:e, s:s0, e_:e0, end:e0}; }).concat(moreItems);
  var lay = krLaneLayout(items.map(function(x){ return {s:x.s, e:x.end, x:x}; }));
  var blocks = lay.map(function(r){ var x = r.it.x, w = 100 / Math.max(Math.max(1, CLINIC_SETTINGS.slotCapacity||1), r.n), /* CMD-1014-18：每块宽 = 1 / 诊所「每个时段上限」 */ top = (x.s - H0) * PX / 60, hgt = Math.max(18, (x.end - x.s) * PX / 60 - 2);
    return '<div class="dayblk" style="position:absolute;left:calc('+(r.lane*w)+'% + 1px);width:calc('+w+'% - 3px);top:'+top+'px;height:'+hgt+'px;overflow:hidden;z-index:2;">'+(x.more ? '<div class="wk-more" onclick="event.stopPropagation();openSlotList(\''+ds+'\',\''+x.more.hr+'\')">+'+x.more.n+' 更多</div>' : eventChipHtml(x.e,{day:true}))+'</div>'; }).join('');
  var lines = '', axis = '';
  for(var m = H0; m < H1; m += 60){ lines += '<div style="position:absolute;left:0;right:0;top:'+((m-H0)*PX/60)+'px;border-top:1px solid #f0ece3;"></div>'; axis += '<div style="height:'+PX+'px;box-sizing:border-box;border-top:1px solid #eee;font-size:12px;color:var(--slate2);padding:2px 6px 0 0;text-align:right;"><b>印 '+minToTime(m)+'</b><span style="display:block;font-size:12px;color:var(--dim);">韩 '+krTimeOf(minToTime(m))+'</span></div>'; }
  var open0 = timeToMin(CLINIC_SETTINGS.openTime), close0 = timeToMin(CLINIC_SETTINGS.closeTime);
  if(open0 > H0) lines += '<div style="position:absolute;left:0;right:0;top:0;height:'+((open0-H0)*PX/60)+'px;background:var(--neutral-25);pointer-events:none;"></div>';
  if(close0 < H1) lines += '<div style="position:absolute;left:0;right:0;top:'+((close0-H0)*PX/60)+'px;bottom:0;background:var(--neutral-25);pointer-events:none;"></div>';
  var lf = timeToMin(CLINIC_SETTINGS.lunchFrom), lt = timeToMin(CLINIC_SETTINGS.lunchTo);
  if(!closedDay && lt > lf) lines += '<div title="午休 '+CLINIC_SETTINGS.lunchFrom+'～'+CLINIC_SETTINGS.lunchTo+'" style="position:absolute;left:0;right:0;top:'+((lf-H0)*PX/60)+'px;height:14px;background:#F3F1EC;color:#b5b0a4;font-size:12px;text-align:center;pointer-events:none;z-index:1;">午休 '+CLINIC_SETTINGS.lunchFrom+'～'+CLINIC_SETTINGS.lunchTo+'</div>';
  if(closedDay) lines += '<div style="position:absolute;inset:0;background:#F3F1EC;pointer-events:none;z-index:1;"></div>';
  var h = '<div class="wk-scroll"><div class="wk-grid" id="day-grid" style="grid-template-columns:64px minmax(0,1fr);position:relative;">'+
    '<div class="wk-corner">'+axisHeadHtml()+'</div>'+
    '<div class="wk-head'+(isToday?' today':'')+'">'+(d.getMonth()+1)+'.'+d.getDate()+' 周'+DOW_CN[dowOfDate(ds)]+(closedDay?'<br><span style="font-size:12px;color:var(--terracotta);font-weight:700;">休诊</span>':inCapHeadHtml(ds))+'</div>'+
    '<div class="wk-memo" style="font-weight:700;color:var(--slate2);">固定栏</div><div class="wk-memo">'+memoCellHtml(ds)+'</div>'+
    calOutBar('in','b', calInNeed().b!==null)+'<div>'+axis+'</div>'+
    '<div id="day-col" data-h0="'+H0+'" style="position:relative;height:'+((H1-H0)*PX/60)+'px;background:#fff;border-left:1px solid var(--border2);border-bottom:1px solid var(--border2);cursor:cell;" onmousemove="calDayHover(this,event)" onmouseleave="calDayHoverOff(this)" onclick="calDayClick(\''+ds+'\',event,this)">'+lines+'<div class="krc-hl" style="display:none;position:absolute;left:0;right:0;height:'+(PX/2)+'px;background:rgba(229,72,77,.10);pointer-events:none;"></div>'+blocks+'</div>'+
    calOutBar('in','a', calInNeed().a!==null)+'</div></div>';
  box.innerHTML = h;
}
function calDaySlot(el, e){ var y = e.clientY - el.getBoundingClientRect().top, H0 = parseInt(el.getAttribute('data-h0'),10); return {slot:Math.floor(y/(CAL_DAY_PX/2)), time:minToTime(H0 + Math.floor(y/(CAL_DAY_PX/2))*30)}; }
function calDayHover(el, e){ var hl = el.querySelector('.krc-hl'); if(!hl) return; hl.style.display = 'block'; hl.style.top = (calDaySlot(el, e).slot * CAL_DAY_PX/2)+'px'; }
function calDayHoverOff(el){ var hl = el.querySelector('.krc-hl'); if(hl) hl.style.display = 'none'; }
function calDayClick(ds, e, el){
  var t = calDaySlot(el, e).time, why = slotBlockReason(ds, t);
  if(!why){ openAddSlotModal(ds, t); return; }
  if(calOffHoursOk(ds, t)) calOffHoursAdd(ds, t);
}

/* ---------------- KR / 院长：固定栏（OFF · 谁 修改）+ memo ---------------- */
function krMemosOf(){ var h = krHData(); if(!h) return []; h.memos = h.memos || []; return h.memos; }
function krMemosOn(ds){ var me = currentAccount(); return krMemosOf().filter(function(m){ return m.date===ds && (m.scope!=='私人' || m.by===me.id); }); }
/* 固定栏单元格：OFF 标签（带［修改］）+ memo；有权限的才有［修改］，不再点标签直接删除 */
function krcFixedHtml(ds, offs, memoPred){
  var out = '', me = currentAccount();
  offs.forEach(function(o){
    if(!o.id) o.id = 'off'+Date.now()+Math.floor(Math.random()*1000);
    var can = krcCanEdit(o.who);
    out += '<span class="krfx off" title="OFF">OFF · '+krEsc(o.who)+krcOffPartText(o)+(can ? ' <a href="#" onclick="krfxEditOff(\''+o.id+'\');return false;">修改</a>' : '')+'</span>';
  });
  krMemosOn(ds).filter(function(m){ return !memoPred || memoPred(m); }).forEach(function(m){
    var mine = m.by===me.id;
    out += '<span class="krfx memo" title="'+krEsc(m.text)+'">'+(m.scope==='私人'?'🔒 ':'')+krEsc(m.text)+' <i>'+krEsc(m.author)+'</i>'+(mine ? ' <a href="#" onclick="krfxEditMemo(\''+m.id+'\');return false;">修改</a>' : '')+'</span>';
  });
  return out || '<span style="font-size:12px;color:#ccc;">—</span>';
}
var KRFX = null;
function krfxWhoOptions(){ return krcIsDirector() ? [currentAccount().name] : krcDirectors(); }
function krfxEditOff(id){ krfxOpen('off', id); }
function krfxEditMemo(id){ krfxOpen('memo', id); }
function krfxSet(k, v){ KRFX[k] = v; krfxRender(); }
function krfxClose(){ var ov = document.getElementById('krfx-overlay'); if(ov) ov.classList.remove('open'); KRFX = null; }
/* 同一位院长同一时间只能有一件事：OFF 时段里已有这位院长的施术 / 面诊 → 挡下（同 krcAddOff） */
function krfxDelete(){
  var d = KRFX; if(!d || !d.edit || !confirm('确认删除？')) return; var h = krHData();
  if(d.edit==='off'){ var o = (h.offs||[]).filter(function(x){ return x.id===d.id; })[0]; if(!o || !krcCanEdit(o.who)) return; h.offs = h.offs.filter(function(x){ return x.id!==d.id; }); logOp('其他', '删除 OFF：'+o.who+' '+o.date, '日程'); }
  else { var m = krMemosOf().filter(function(x){ return x.id===d.id; })[0]; if(!m || m.by!==currentAccount().id) return; h.memos = h.memos.filter(function(x){ return x.id!==d.id; }); }
  krfxClose(); Store.touch(); krcRender();
}

/* ---------------- KR / 院长：月视图照 IN（月份显示、点月份选年月 + 回到今天） ---------------- */
function krcTodayBtnHtml(){
  return '<button class="btn-ghost" onclick="krcToday()">今天</button>';
}
function krcMonthPicker(){
  var ov = document.getElementById('krc-month-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'krc-month-overlay'; ov.className = 'modal-overlay'; ov.onclick = function(e){ if(e.target===ov) ov.classList.remove('open'); }; document.body.appendChild(ov); }
  var cur = krcAnchor(), y0 = parseInt(krToday().slice(0,4),10), cy = parseInt(cur.slice(0,4),10), cm = parseInt(cur.slice(5,7),10)-1;
  ov.innerHTML = '<div class="modal-box" style="width:340px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b>选择年月</b><span style="cursor:pointer;" onclick="document.getElementById(\'krc-month-overlay\').classList.remove(\'open\')">✕</span></div>'+
    '<select id="krc-pick-year" onchange="krcMonthPickerMonths()" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">'+[y0-2,y0-1,y0,y0+1,y0+2].map(function(y){ return '<option'+(y===cy?' selected':'')+'>'+y+'</option>'; }).join('')+'</select>'+
    '<div id="krc-pick-months" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;"></div>'+
    '<button class="btn-outline" style="width:100%;margin-top:12px;" onclick="krcToday();document.getElementById(\'krc-month-overlay\').classList.remove(\'open\')">回到今天</button></div>';
  krcMonthPickerMonths(); ov.classList.add('open');
}
function krcMonthPickerMonths(){
  var y = parseInt(document.getElementById('krc-pick-year').value, 10), cur = krcAnchor(), cy = parseInt(cur.slice(0,4),10), cm = parseInt(cur.slice(5,7),10)-1, html = '';
  for(var m = 0; m < 12; m++) html += '<button class="'+((y===cy && m===cm) ? 'btn-primary' : 'btn-outline')+'" style="padding:8px 0;" onclick="krcPickMonth('+y+','+m+')">'+(m+1)+'月</button>';
  document.getElementById('krc-pick-months').innerHTML = html;
}
function krcPickMonth(y, m){ KRC.anchor = y+'-'+pad2(m+1)+'-01'; document.getElementById('krc-month-overlay').classList.remove('open'); krcRender(); }

/* ---------------- KR / 院长：当前时段颜色框 + 图例 + ［＋memo］ ---------------- */
function krcNowFrameHtml(){
  return ''; /* CMD-1014-18：拿掉当前时段方框 */
}
(function(){
  if(typeof krCalendarHtml!=='function') return;
  var base = krCalendarHtml;
  krCalendarHtml = function(){
    krcApplyRange();
    var h = base.apply(this, arguments);
    h = h.replace('<button class="btn-ghost" onclick="krcToday()">今天</button>', krcTodayBtnHtml()+'<button class="btn-outline" onclick="krfxOpen()" title="新增备忘 / OFF">＋ memo</button>');
    h = h.replace('图例：', '图例：<span style="background:#E3EAF6;color:#2F4F86;padding:0 5px;border-radius:3px;">面诊</span> <span style="background:#E4EEE7;color:#2F6B4A;padding:0 5px;border-radius:3px;">术后到院</span> ');
    return h;
  };
})();

/* ---------------- 旧案件补洞（不带开关，CMD-1014-01 四）：确认了施术时间但没有地址 / 没有 -1 子案件 ---------------- */
function repairScheduleGaps(){
  var n = 0;
  CASE_ITEMS.forEach(function(c){
    var ks = c.krSchedule; if(!ks || ['confirmed','change_pending','arrived'].indexOf(ks.status)<0 || !ks.confirmedDate) return;
    if(!ks.address){ var hh = hospitalById(caseKrHospital(c)); if(hh && hh.address){ ks.address = hh.address; n++; } }
    if(!(c.subItems||[]).some(function(s){ return s.kind==='施术'; }) && c.settlementDone && krActiveItems(c).length){ syncSurgerySub(c); if((c.subItems||[]).some(function(s){ return s.kind==='施术'; })){ n++; logCaseEvent(c, '系统', '补齐施术子案件（-1）'); } }
  });
  return n;
}

/* ---------------- IN：转告客人 + 确认客人日程有无变化（赴韩施术 tab 上方两张卡） ---------------- */
function calDaysToSurgery(c){ var ks = c.krSchedule; if(!ks || !ks.confirmedDate) return 999; return Math.round((new Date(ks.confirmedDate+'T00:00:00') - new Date(todayStr()+'T00:00:00'))/86400000); }
function calKey(c){ var ks = c.krSchedule; return ks ? ks.confirmedDate+' '+ks.confirmedTime : ''; }
/* 赴韩施术前 2 天（含当天）、时间已确认、IN 还没确认「日程无变动」 */
function calNeedsRecheck(c){
  if(!c || isEnded(c) || scheduleState(c)!=='Confirmed') return false;
  var d = calDaysToSurgery(c); return d<=2 && !c.tripConfirm; /* CMD-1019-13：施术前 2 天改成［发送给客人］（施术前提醒） */ /* 10/14：过期（施术日已到 / 已过）仍未确认 → 标红、一直挂着，直到确认或案件改期 / 取消 */
}
function calRecheckText(c){ return c.tripConfirm ? '✓ 已确认行程（IN · '+String(c.tripConfirm.at||'').slice(0,10)+'）' : 'IN 尚未确认行程'; } /* CMD-1020-13 七：施术前 2 天 = 联络客人确认行程（不再发提醒讯息） */
function calRelayRecheckCards(c){
  if(scheduleState(c)!=='Confirmed' || !c.krSchedule) return '';
  var out = '', d = calDaysToSurgery(c);
  /* CMD-1015-15：按了［已转告客人］［确认无变动］后卡片就消失，记录在 Timeline */
  /* CMD-1019-12：「转告客人」卡拿掉，改在施术日期那一行后面放［发送给客人］（surgSendHtml） */
  if(d<=2 && !c.tripConfirm){ /* CMD-1020-13 七：施术前 2 天 = 联络客人确认行程（入境 / 离境），不再发施术前提醒讯息；保存后卡片消失，Timeline 记一笔 */
    out += '<div class="card" id="surg-remind-row" style="padding:14px 20px;display:flex;align-items:center;gap:12px;margin-bottom:12px;"><div style="flex:1;"><div style="font-size:13px;font-weight:700;">确认行程</div><div style="font-size:12px;color:var(--slate2);margin-top:2px;">施术前 2 天：联络客人确认行程（入境 / 离境）；客人说要改期，走下面原来的改期流程</div></div><button class="btn-primary" onclick="openStayModal(\''+c.id+'\', {trip:true})">已确认行程</button></div>';
  }
  return out;
}
function calCaseById(id){ return CASE_ITEMS.filter(function(x){ return x.id===id; })[0]; }
/* ---- CMD-1019-12：施术日期发送给客人（短信 / WhatsApp，原型模拟不真的发） ---- */
/* 日期 / 时间 / 地址任一变了（KR 改了）就变回「未发送」 */
function surgMsgKey(c){ var ks = c.krSchedule || {}; return [ks.confirmedDate||'', ks.confirmedTime||'', ks.address||''].join('|'); }
/* CMD-1019-16：「通知过客人的那一版」= 施术日期通知 / 施术前提醒 / 电话通知里最近一次的 key（旧数据没有 surgInformKey 就取两条发送记录里较新的）。
   从没通知过 → 发送给客人；通知过之后 KR 又改了日期 / 时间 / 地址 → 不重发，改成打电话（［已电话通知］） */
function surgInformKey(c){
  if(c.surgInformKey) return c.surgInformKey;
  var a = c.surgeryMsg, b = c.reminderMsg, m = a && b ? ((a.at||'') >= (b.at||'') ? a : b) : (a || b);
  return m ? m.key : '';
}
function surgMsgSent(c){ var k = surgInformKey(c); return !!k && k===surgMsgKey(c); } /* 当前这一版已经通知过客人 */
function surgChanged(c){ var k = surgInformKey(c); return !!k && k!==surgMsgKey(c); } /* 通知过之后 KR 又改了 → 要电话通知 */
function surgKeyText(k){ var p = String(k||'').split('|'); return (p[0]||'—')+' '+(p[1]||''); }
function surgChangeText(c){
  var o = String(surgInformKey(c)).split('|'), n = surgMsgKey(c).split('|'), bits = [];
  if(o[0]!==n[0] || o[1]!==n[1]) bits.push('施术时间已变更（原 '+surgKeyText(surgInformKey(c)).trim()+' → 新 '+surgKeyText(surgMsgKey(c)).trim()+'，韩国时间）');
  if(o[2]!==n[2]) bits.push('到院地址已变更（原 '+(o[2]||'—')+' → 新 '+(n[2]||'—')+'）');
  return bits.join('；');
}
/* 模板读诊所设定 CLINIC_SETTINGS.sms.surgery（和其他短信模板同一处），填入变量 */
function surgRemindSent(c){ return !!c.tripConfirm; } /* 施术前提醒发过一次就不再出现；之后改时间走电话 */
/* 「上午 / 下午 时:分」：14:00 → 下午 2:00，09:30 → 上午 9:30 */
function surgAmPm(hm){ var m = /^(\d\d):(\d\d)$/.exec(hm||''); if(!m) return hm||'—'; var h = +m[1]; return (h<12 ? '上午 ' : '下午 ')+(h%12===0 ? 12 : h%12)+':'+m[2]; }
/* 麻醉注意：只写需要空腹的项目（备注里有「空腹 N 小时」）；一个项目 = 模板原样两行，多个项目一项一行；没有就整段不写 */
function surgAnesText(c){
  var rows = krActiveItems(c).map(function(it){ var h = anesFastOf(it.anesthesia); return h ? {name:it.name, h:h} : null; }).filter(Boolean); /* 读麻醉的「需空腹（小时）」数字栏，不再从备注文字里找 */
  if(!rows.length) return '';
  if(rows.length===1) return '麻醉注意：'+rows[0].name+'：需空腹 '+rows[0].h+' 小时，\n* '+rows[0].h+' 小时内禁止食用任何食物和饮品。';
  return '麻醉注意：\n'+rows.map(function(r){ return r.name+'：需空腹 '+r.h+' 小时，'; }).join('\n')+'\n* 请按各项目所需的空腹时间，期间禁止食用任何食物和饮品。';
}
/* 读诊所设定里的模板（版本 ver = notice / remind，语言 lang 先只有 zh），填入变量；医院名 / 地址用英文（没填退回原文） */
function surgMsgText(c, ver, lang){
  var ks = c.krSchedule || {}, hid = c.hospitalId || clinicHospital(CURRENT_CLINIC_ID), en = hospitalEn(hid);
  var text = smsFill(surgTplOf(ver||'notice', lang||'zh'), {clinic:CLINIC_SETTINGS.name, name:c.name, coordinator:actingName(), date:ks.confirmedDate, time:surgAmPm(ks.confirmedTime), hospital:en.name, address:ks.address || en.address, anes:surgAnesText(c), phone:CLINIC_SETTINGS.phone});
  return text.replace(/\n{3,}/g, '\n\n').replace(/\n\n$/,'');
}
function surgSendHtml(c){
  if(c.hasArrived) return '';
  var tag = '<span style="font-size:12px;color:var(--muted);">演示</span>', box = function(x){ return '<div style="text-align:right;max-width:340px;">'+x+'</div>'; };
  if(surgChanged(c)) return box('<div style="font-size:12px;color:#B3261E;font-weight:700;margin-bottom:6px;text-align:left;">⚠ '+aEsc(surgChangeText(c))+'，请电话通知客人</div><button class="btn-primary" onclick="openSurgPhone(\''+c.id+'\')">已电话通知</button>');
  if(surgMsgSent(c)){ /* 发过之后只显示已发送，不再有［再发一次］ */
    var ph = c.surgPhone && c.surgPhone.key===surgMsgKey(c) ? c.surgPhone : null, m = surgMsgOfKey(c);
    return box('<div style="font-size:12px;color:var(--sage);font-weight:700;white-space:nowrap;">'+(ph ? '✓ 已电话通知（'+aEsc(fmtUtc(ph.at))+'）' : '✓ 已发送（'+aEsc(m.method)+'，'+aEsc(fmtUtc(m.at))+'）')+'</div>'+(ph && ph.note ? '<div style="font-size:12px;color:var(--muted);">备注：'+aEsc(ph.note)+'</div>' : ''));
  }
  return box('<button class="btn-primary" onclick="openSurgMsg(\''+c.id+'\')">发送给客人</button> '+tag);
}
/* 当前这一版是用哪次发送通知的（施术日期通知 / 施术前提醒） */
function surgMsgOfKey(c){ var k = surgMsgKey(c); return [c.surgeryMsg, c.reminderMsg].filter(function(m){ return m && m.key===k; }).sort(function(a, b){ return (b.at||'') > (a.at||'') ? 1 : -1; })[0] || {method:'—', at:''}; }
/* ［已电话通知］：小 Modal 可填一句备注（选填）→ 记 Timeline，待办消失 */
var SURGPH = null;
function openSurgPhone(id){
  var c = calCaseById(id); if(!c) return; SURGPH = {id:id};
  var ov = document.getElementById('surgph-overlay');
  if(!ov){ ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'surgph-overlay'; ov.style.zIndex = 95; document.body.appendChild(ov); }
  ov.innerHTML = '<div class="modal-box" style="width:420px;"><div style="font-size:15px;font-weight:700;margin-bottom:8px;">已电话通知客人</div><div style="font-size:12px;color:var(--slate2);line-height:1.7;margin-bottom:8px;">'+aEsc(surgChangeText(c))+'</div>'+
    '<textarea id="surgph-note" rows="3" placeholder="备注（选填，例如：客人已知晓、新时间可以）" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;"></textarea>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;"><button class="btn-outline" onclick="closeSurgPhone()">取消</button><button class="btn-primary" onclick="confirmSurgPhone()">确认已电话通知</button></div></div>';
  ov.classList.add('open');
}
function closeSurgPhone(){ var ov = document.getElementById('surgph-overlay'); if(ov) ov.classList.remove('open'); SURGPH = null; }
function confirmSurgPhone(){
  var s = SURGPH; if(!s) return; var c = calCaseById(s.id); if(!c) return; var n = (document.getElementById('surgph-note')||{}).value || '';
  var txt = surgChangeText(c);
  c.surgPhone = {key:surgMsgKey(c), from:surgInformKey(c), at:nowFullDt(), note:String(n).trim(), by:actingName()};
  c.surgInformKey = surgMsgKey(c); c.relayTold = calKey(c); c.relayAt = c.surgPhone.at;
  logCaseEvent(c, actingName(), '已电话通知客人：'+txt+(c.surgPhone.note ? '；备注：'+c.surgPhone.note : ''));
  closeSurgPhone(); Store.touch(); buildCaseLog(c); renderCaseBody(c); try{ todoRefresh(); renderCalendar(); }catch(e){}
}
var SURGMSG = null;
function openSurgMsg(id, ver){
  var c = calCaseById(id); if(!c || !c.krSchedule) return;
  if(ver==='remind') return; /* CMD-1020-13 七：施术前提醒讯息已取消（改成［已确认行程］），只留施术日期确认后那一次［发送给客人］ */
  ver = ver || 'notice'; var prev = ver==='remind' ? c.reminderMsg : c.surgeryMsg;
  SURGMSG = {id:id, ver:ver, lang:'zh', method:(prev && prev.method) || '短信', text:surgMsgText(c, ver, 'zh')};
  var ov = document.getElementById('surgmsg-overlay');
  if(!ov){ ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'surgmsg-overlay'; ov.style.zIndex = 95; document.body.appendChild(ov); }
  surgMsgRender(); ov.classList.add('open');
}
function surgMsgRender(){
  var ov = document.getElementById('surgmsg-overlay'), s = SURGMSG; if(!ov || !s) return;
  var c = calCaseById(s.id), cl = clientByName(c.name), to = (cl && cl.phone) || '—';
  var seg = function(k){ return '<button class="'+(s.method===k ? 'btn-primary' : 'btn-outline')+'" onclick="surgMsgMethod(\''+k+'\')">'+k+'</button>'; };
  ov.innerHTML = '<div class="modal-box" style="width:520px;"><div style="font-size:15px;font-weight:700;margin-bottom:10px;">'+SURG_TPLS[s.ver].label+' <span style="font-size:12px;font-weight:400;color:var(--muted);">演示：不会真的发出</span></div>'+
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">'+seg('短信')+seg('WhatsApp')+'<span style="font-size:12px;color:var(--slate2);margin-left:6px;">发给 '+aEsc(to)+'</span></div>'+
    '<div style="font-size:12px;color:var(--slate2);margin-bottom:4px;">预览（可以修改；模板在「诊所设定」里）</div>'+
    '<textarea id="surgmsg-text" rows="14" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;" oninput="SURGMSG.text=this.value">'+aEsc(s.text)+'</textarea>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;"><button class="btn-outline" onclick="closeSurgMsg()">取消</button><button class="btn-primary" onclick="confirmSurgMsg()">发送</button></div></div>';
}
function surgMsgMethod(k){ if(SURGMSG){ var t = document.getElementById('surgmsg-text'); if(t) SURGMSG.text = t.value; SURGMSG.method = k; surgMsgRender(); } }
function closeSurgMsg(){ var ov = document.getElementById('surgmsg-overlay'); if(ov) ov.classList.remove('open'); SURGMSG = null; }
function confirmSurgMsg(){
  var s = SURGMSG; if(!s) return; var c = calCaseById(s.id); if(!c) return;
  var t = document.getElementById('surgmsg-text'); if(t) s.text = t.value;
  if(!String(s.text||'').trim()) return;
  var cl = clientByName(c.name), to = (cl && cl.phone) || '', remind = s.ver==='remind', tp = SURG_TPLS[s.ver];
  logSms(tp.kind, (s.method==='WhatsApp' ? 'WhatsApp ' : '')+to, s.text, c.id); /* 短信发送记录页：类型「施术日期通知 / 施术前提醒」 */
  var prev = remind ? c.reminderMsg : c.surgeryMsg, rec = {key:surgMsgKey(c), method:s.method, at:nowFullDt(), count:(prev ? (prev.count||1)+1 : 1)};
  c.surgInformKey = rec.key; /* CMD-1019-16：这一版已通知客人；之后 KR 再改 = 电话通知 */
  if(remind){ c.reminderMsg = rec; c.recheck = {key:calKey(c), by:actingName(), at:rec.at, via:'施术前提醒'}; }
  else { c.surgeryMsg = rec; c.relayTold = calKey(c); c.relayAt = rec.at; } /* 通知发送 = 已转告：待办「转告客人」消失 */
  logCaseEvent(c, actingName(), '已发送'+tp.label+'给客人（'+s.method+'，演示）：'+calKey(c)+'（韩国时间）'+(prev ? '，再次发送' : ''));
  closeSurgMsg(); Store.touch(); buildCaseLog(c); renderCaseBody(c); try{ todoRefresh(); renderCalendar(); }catch(e){}
  showToast('已发送'+tp.label+'（演示）', s.method+' → '+(to||'客人'), null);
}
(function(){
  if(typeof krTabContent==='function'){
    var base = krTabContent;
    krTabContent = function(c){ var h = base.apply(this, arguments); try{ return calRelayRecheckCards(c)+h; }catch(e){ return h; } };
  }
  /* 日历上那天标「日程待确认」：事件块加 data-recheck，样式在 app.css（纯 CSS 徽标，不改事件块内容） */
  if(typeof eventChipHtml==='function'){
    var baseChip = eventChipHtml;
    eventChipHtml = function(e){
      var h = baseChip.apply(this, arguments);
      try{ if(e && e.kind==='travel' && e.caseId){ var c = calCaseById(e.caseId); if(c && calNeedsRecheck(c)) h = h.replace('class="event-chip"', 'class="event-chip" data-recheck="1"'); } }catch(err){}
      return h;
    };
  }
})();
try{ TODO_UI.kind = ''; }catch(e){} /* 卡片筛选不跨刷新保留 */

/* ================= CMD-1014-02 ================= */
function offPartArg(p){ return (p && p.indexOf('指定')===0) ? p : (p==='下午' ? '下午' : '上午'); }
function krcViewAll(){ var me = currentAccount(); return !!(KRC.viewAll && me && me.role==='kr_owner'); }
function krcSetViewAll(v){ KRC.viewAll = (v==='all'); krcRender(); }
function krcIsPast(b){ var t = krToday(); return b.date < t || (b.date===t && timeToMin(b.end) <= todoNowMinutes()); }
/* KR / 院长日历的双时间轴（韩国 + 印尼，和 IN 的反过来）：印尼 = 对接诊所所在时区（C3 巴厘 UTC+8，其余雅加达 UTC+7） */
function krCounterTz(){ var cl = krClinics()[0]; return (cl && cl.id==='C3') ? 'Asia/Makassar' : 'Asia/Jakarta'; }
function krCounterTime(min){ var diff = tzOffsetMin(krCounterTz()) - tzOffsetMin(KR_TZ), t = (((min+diff)%1440)+1440)%1440; return minToTime(t); }
function krcOffPartText(o){
  var p = o.part || '全天'; if(p==='全天') return '';
  var m = /^指定(\d\d:\d\d)-(\d\d:\d\d)$/.exec(p); return m ? '（'+m[1]+'–'+m[2]+'）' : '（'+p+'）';
}
(function(){
  /* 月视图：提示文字改成「点日期 = 进那一周」 */
  if(typeof krcMonthHtml==='function'){ var bm = krcMonthHtml; krcMonthHtml = function(){ var h = bm.apply(this, arguments); return h.replace(/点日期看当天；[^<]*|点日期 = 开放[^<]*/, '点日期 = 进那一周；营业 / 休诊 / 特殊营业只在医院设定里改。'); }; }
  /* 悬停加 OFF：「全天 / 指定时间」（取代上午 / 下午），指定时间用左边的开始–结束 */
  if(typeof krcPopHtml==='function'){ var bp = krcPopHtml; krcPopHtml = function(){ var h = bp.apply(this, arguments); return h.replace('<option>全天</option><option>上午</option><option>下午</option>', '<option>全天</option><option>指定时间</option>').replace('标 OFF</button>', '标 OFF</button><span style="font-size:12px;color:var(--muted);">（指定时间 = 用左边的开始–结束）</span>'); }; }
  if(typeof krcAddOff==='function'){ var ba = krcAddOff; krcAddOff = function(){
    { var f = KRC.popForm; if(f.part==='指定时间'){ if(timeToMin(f.end) <= timeToMin(f.start)){ alert('结束时间要晚于开始时间'); return; } f.part = '指定'+f.start+'-'+f.end; } else if(f.part!=='全天') f.part = '全天'; }
    var r = ba.apply(this, arguments); KRC.popForm.part = '全天'; return r; }; }
  /* 代表院长：看自己 / 全部院长（只看不操作） */
  if(typeof krCalendarHtml==='function'){ var b2 = krCalendarHtml; krCalendarHtml = function(){
    var h = b2.apply(this, arguments); var me = currentAccount();
    if(me && me.role==='kr_owner') h = h.replace('<span style="font-size:12px;color:var(--muted);">图例：', '<select onchange="krcSetViewAll(this.value)" style="padding:6px 9px;border:1px solid var(--line);border-radius:7px;font-size:12px;"><option value="me"'+(krcViewAll()?'':' selected')+'>看自己</option><option value="all"'+(krcViewAll()?' selected':'')+'>全部院长（只看）</option></select><span style="font-size:12px;color:var(--muted);">图例：');
    return h; }; }
})();

/* ---- KR / 院长新增 / 修改 OFF、memo（取代 10/14 第一版）：先选 室长 / 院长 → 再选人 → 全天或指定时间 ---- */
function krfxParsePart(p){ var m = /^指定(\d\d:\d\d)-(\d\d:\d\d)$/.exec(p||''); if(m) return {mode:'指定', from:m[1], to:m[2]}; if(p==='上午' || p==='下午'){ var rg = krHalfRange(krHospitalIdOfMe(), p); return {mode:'指定', from:rg[0], to:rg[1]}; } return {mode:'全天', from:'10:00', to:'12:00'}; }
function krfxCoordNames(){ return hospitalCoordinators(krHospitalIdOfMe()).slice(); }
function krfxPeople(role){ return role==='室长' ? krfxCoordNames() : (krcIsDirector() ? [currentAccount().name] : krcDirectors()); }
function krfxOpen(editKind, id){
  var h = krHData(), today = krToday(), isDir = krcIsDirector();
  if(editKind==='off'){
    var o = (h.offs||[]).filter(function(x){ return x.id===id; })[0]; if(!o || !krcCanEdit(o.who)) return;
    var pp = krfxParsePart(o.part);
    KRFX = {edit:'off', id:id, date:o.date||today, type:'OFF', role:o.kind==='coord' ? '室长' : '院长', who:o.who, mode:pp.mode, from:pp.from, to:pp.to, scope:'公开', text:o.note||''};
  } else if(editKind==='memo'){
    var m = krMemosOf().filter(function(x){ return x.id===id; })[0]; if(!m || m.by!==currentAccount().id) return;
    KRFX = {edit:'memo', id:id, date:m.date, type:'备忘', role:'院长', who:'', mode:'全天', from:'10:00', to:'12:00', scope:m.scope||'公开', text:m.text};
  } else { var role = isDir ? '院长' : '室长'; KRFX = {edit:null, date:today, type:'备忘', role:role, who:krfxPeople(role)[0]||'', mode:'全天', from:'10:00', to:'12:00', scope:'公开', text:''}; }
  krfxRender();
}
function krfxSetRole(r){ KRFX.role = r; KRFX.who = krfxPeople(r)[0] || ''; krfxRender(); }
function krfxRender(){
  var ov = document.getElementById('krfx-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'krfx-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var d = KRFX, isOff = d.type==='OFF', editing = !!d.edit, isDir = krcIsDirector(), inp = 'padding:6px 9px;border:1px solid var(--line);border-radius:7px;font-size:12px;';
  var radio = function(name, val, label, checked){ return '<label style="margin-right:14px;font-size:13px;"><input type="radio" '+(checked?'checked ':'')+'onchange="krfxSet(\''+name+'\',\''+val+'\')"> '+label+'</label>'; };
  var people = krfxPeople(d.role);
  var offBlock = '';
  if(isOff){
    offBlock = '<div style="margin-bottom:12px;font-size:13px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">'+
      (editing || isDir ? '<b>'+krEsc(d.role)+' · '+krEsc(d.who||people[0]||'')+'</b>' :
        '<select onchange="krfxSetRole(this.value)" style="'+inp+'">'+['室长','院长'].map(function(r){ return '<option'+(d.role===r?' selected':'')+'>'+r+'</option>'; }).join('')+'</select>'+
        '<select onchange="KRFX.who=this.value" style="'+inp+'">'+people.map(function(n){ return '<option'+(d.who===n?' selected':'')+'>'+krEsc(n)+'</option>'; }).join('')+'</select>')+'</div>'+
      '<div style="margin-bottom:12px;font-size:13px;">'+radio('mode','全天','全天',d.mode==='全天')+radio('mode','指定','指定时间',d.mode==='指定')+
      (d.mode==='指定' ? '<span style="white-space:nowrap;"><input type="time" value="'+d.from+'" onchange="KRFX.from=this.value" style="'+inp+'"> – <input type="time" value="'+d.to+'" onchange="KRFX.to=this.value" style="'+inp+'"></span>' : '')+'</div>';
    if(!d.who) d.who = people[0] || '';
  }
  ov.innerHTML = '<div class="modal-box" style="width:440px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b>'+(editing ? (d.edit==='off' ? '修改 OFF' : '修改 memo') : '新增 memo')+'</b><span style="cursor:pointer;" onclick="krfxClose()">✕</span></div>'+
    '<div class="field" style="margin-bottom:12px;"><label>日期</label><input type="date" value="'+d.date+'" '+(editing && d.edit==='off' ? 'disabled ' : '')+'onchange="KRFX.date=this.value"></div>'+
    (editing ? '' : '<div style="margin-bottom:12px;"><div style="font-size:12px;color:var(--slate);margin-bottom:4px;">类型</div>'+radio('type','备忘','备忘',d.type==='备忘')+radio('type','OFF','OFF',d.type==='OFF')+'</div>')+
    (isOff ? offBlock : '<div style="margin-bottom:12px;"><div style="font-size:12px;color:var(--slate);margin-bottom:4px;">可见范围</div>'+radio('scope','公开','公开',d.scope==='公开')+radio('scope','私人','私人',d.scope==='私人')+'</div>')+
    '<div class="field" style="margin-bottom:12px;"><label>'+(isOff?'备注（选填）':'内容')+'</label><input type="text" value="'+krEsc(d.text||'')+'" oninput="KRFX.text=this.value"></div>'+
    '<div style="font-size:12px;color:var(--muted);margin-bottom:12px;">作者：'+krEsc(ME_NAME)+'</div>'+
    '<div style="display:flex;gap:10px;"><button class="btn-primary" style="flex:1;" onclick="krfxSave()">保存</button>'+(editing ? '<button class="btn-outline" style="flex:1;color:#C1454A;border-color:#C1454A;" onclick="krfxDelete()">删除</button>' : '')+'</div></div>';
  ov.classList.add('open');
}
function krfxSave(){
  var d = KRFX, h = krHData(), me = currentAccount(); if(!d || !d.date){ alert('请选择日期'); return; }
  if(d.type==='OFF' || d.edit==='off'){
    var who = d.who || krfxPeople(d.role)[0]; if(!who || !krcCanEdit(who)){ alert('没有权限给 '+(who||'这个人')+' 标 OFF'); return; }
    if(d.mode==='指定' && timeToMin(d.to) <= timeToMin(d.from)){ alert('结束时间要晚于开始时间'); return; }
    var part = d.mode==='指定' ? '指定'+d.from+'-'+d.to : '全天';
    if(d.role==='院长'){ var clash = krfxOffClash(who, d.date, part); if(clash){ alert('这位院长在这个时段已有'+clash.kind+'（'+clash.time+'–'+clash.end+'），不能标 OFF；请先改期'+clash.kind); return; } }
    h.offs = h.offs || [];
    if(d.edit==='off'){ var o = h.offs.filter(function(x){ return x.id===d.id; })[0]; if(!o) return; o.part = part; o.note = (d.text||'').trim(); logOp('其他', '修改 OFF：'+who+' '+o.date+' → '+part, '日程'); }
    else { h.offs.push({id:'off'+Date.now(), date:d.date, who:who, kind:d.role==='室长' ? 'coord' : 'director', part:part, note:(d.text||'').trim(), by:ME_NAME}); logOp('其他', '标 OFF：'+who+' '+d.date+' '+part, '日程'); }
  } else {
    if(!(d.text||'').trim()){ alert('请填写备忘内容'); return; }
    var ms = krMemosOf();
    if(d.edit==='memo'){ var m = ms.filter(function(x){ return x.id===d.id; })[0]; if(!m || m.by!==me.id) return; m.date = d.date; m.scope = d.scope; m.text = d.text.trim(); }
    else ms.push({id:'km'+Date.now(), date:d.date, scope:d.scope, text:d.text.trim(), author:ME_NAME, by:me.id});
  }
  krfxClose(); Store.touch(); krcRender();
}
/* 同一位院长同一时间只能有一件事（part 可以是 指定HH:MM-HH:MM，krHalfRange 已能解析） */
function krfxOffClash(who, date, part){
  var h = krHData(), hid0 = krHospitalIdOfMe(), part0 = part||'全天', rg0 = part0==='全天' ? ['00:00','24:00'] : krHalfRange(hid0, part0), a0 = rg0[0]==='00:00' ? 0 : timeToMin(rg0[0]), z0 = rg0[1]==='24:00' ? 1440 : timeToMin(rg0[1]);
  return ((h.directorSchedule||{})[who]||[]).filter(function(b){ return (b.kind==='施术' || b.kind==='面诊') && b.date===date && timeToMin(b.time) < z0 && timeToMin(b.end) > a0; })[0] || null;
}

/* ---- IN memo 的 OFF：同样「全天 / 指定时间」（只在选了 OFF 时多一行；其余 IN 固定栏设计不动） ---- */
function memoOffSet(k, v){ MEMO_DRAFT[k] = v; if(k==='offMode') renderMemoBody(); }
(function(){
  if(typeof renderMemoBody!=='function') return;
  var br = renderMemoBody, bo = openMemoModal, bs = saveMemoDraft;
  renderMemoBody = function(){
    br.apply(this, arguments); if(!MEMO_DRAFT || MEMO_DRAFT.type!=='OFF') return;
    var d = MEMO_DRAFT; d.offMode = d.offMode || '全天'; d.offFrom = d.offFrom || '10:00'; d.offTo = d.offTo || '12:00'; var inp = 'padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:12px;';
    var radio = function(val, label){ return '<label style="margin-right:14px;font-size:13px;"><input type="radio" '+(d.offMode===val?'checked ':'')+'onchange="memoOffSet(\'offMode\',\''+val+'\')"> '+label+'</label>'; };
    document.getElementById('memo-body').insertAdjacentHTML('afterbegin', '<div style="margin-bottom:12px;"><div style="font-size:12px;color:var(--slate);margin-bottom:4px;">时间</div>'+radio('全天','全天')+radio('指定','指定时间')+(d.offMode==='指定' ? '<span style="white-space:nowrap;"><input type="time" value="'+d.offFrom+'" onchange="MEMO_DRAFT.offFrom=this.value" style="'+inp+'"> – <input type="time" value="'+d.offTo+'" onchange="MEMO_DRAFT.offTo=this.value" style="'+inp+'"></span>' : '')+'</div>');
  };
  openMemoModal = function(editId){
    bo.apply(this, arguments); if(!MEMO_DRAFT) return;
    var m = editId ? CAL_MEMOS.filter(function(x){ return x.id===editId; })[0] : null; if(m && m.type==='OFF' && m.from){ MEMO_DRAFT.offMode = '指定'; MEMO_DRAFT.offFrom = m.from; MEMO_DRAFT.offTo = m.to; renderMemoBody(); }
  };
  saveMemoDraft = function(){
    var dd = MEMO_DRAFT, n0 = CAL_MEMOS.length, timed = dd && dd.type==='OFF' && dd.offMode==='指定';
    if(timed && timeToMin(dd.offTo) <= timeToMin(dd.offFrom)){ alert('结束时间要晚于开始时间'); return; }
    var r = bs.apply(this, arguments);
    if(dd && dd.type==='OFF'){
      var m = dd.editId ? CAL_MEMOS.filter(function(x){ return x.id===dd.editId; })[0] : (CAL_MEMOS.length>n0 ? CAL_MEMOS[CAL_MEMOS.length-1] : null);
      if(m){ if(timed){ m.from = dd.offFrom; m.to = dd.offTo; } else { delete m.from; delete m.to; } try{ saveMemos(); }catch(e){} try{ Store.touch(); }catch(e){} try{ renderCalendar(); }catch(e){} }
    }
    return r;
  };
})();


/* ================= CMD-1014-19：约满标记（取代「施术开放 / 未开放」） =================
   上限的算法：
   · KR 医院层：已约 = 当天各客人预约块（面诊 / 施术 / 术后到院 / IN 占位）占用的「营业时间内、不含午休 / 休诊时段」的 30 分钟段数合计；上限 = 当天在岗院长数（没有整天 OFF 的）× 这些 30 分钟段数；
   · KR 院长层：已约 = 这位院长的预约块 + 不可预约块占用的段数；上限 = 这些 30 分钟段数（整天 OFF = 「OFF」）；
   · IN 本院日程：已约 = 当天各时段的有效预约 + 占位数（不含取消 / 未到店）；上限 = 诊所设定「每个时段的预约上限」× 当天可约的 30 分钟时段数（营业时间内、不含午休，休诊日不显示）。
   已约 ≥ 上限 → 「约满」。 */
function krCapSlots(hid, ds){
  if(hospitalClosedOn(hid, ds)) return [];
  var hr = hospitalHours(hid), lu = hospitalLunch(hid), cf = hospitalClosedFrom(hid, ds), cb = hospitalClosedBefore(hid, ds), out = [];
  for(var m = timeToMin(hr.open); m < timeToMin(hr.close); m += 30){
    if(lu && m >= timeToMin(lu.from) && m < timeToMin(lu.to)) continue;
    if(cf && m + 30 > timeToMin(cf)) continue; if(cb && m < timeToMin(cb)) continue; out.push(m);
  }
  return out;
}
function krCapUsed(slots, blocks){ var used = 0; blocks.forEach(function(b){ if(b && ((b.b && b.b.noCap) || b.noCap)) return; var s = timeToMin(b.time), e = timeToMin(b.end || minToTime(s+30)); slots.forEach(function(m){ if(s < m+30 && e > m) used++; }); }); return used; }
function capHtml(used, cap, off){
  if(off) return '<br><span style="font-size:12px;font-weight:700;color:#B5483E;">OFF</span>';
  if(!cap || used < cap) return ''; /* CMD-1015-01：只在约满时写「约满」，不写已约数字 */
  return '<br><span style="font-size:12px;font-weight:700;color:#B5483E;">约满</span>';
}
function krCapDirOff(h, ds, name){ return (h.offs||[]).some(function(o){ return o.kind==='director' && o.who===name && offApplies(o, ds) && (!o.part || o.part==='全天'); }); }
function krCapHeadHtml(ds, blocks, who){
  var hid = krHospitalIdOfMe(), h = krHData(), slots = krCapSlots(hid, ds); if(!slots.length) return '';
  var bl = blocks.map(function(b){ return b._x ? b : b; });
  if(who==='all'){ var duty = krcDirectors().filter(function(n){ return !krCapDirOff(h, ds, n); }).length; return capHtml(krCapUsed(slots, bl), slots.length*duty, false); }
  if(krCapDirOff(h, ds, who)) return capHtml(0, 0, true);
  return capHtml(krCapUsed(slots, bl), slots.length, false);
}
function inCapHeadHtml(ds){
  var slots = []; if(typeof isRescheduleDateDisabled==='function' && isRescheduleDateDisabled(new Date(ds+'T00:00:00'))) return '';
  var lf = timeToMin(CLINIC_SETTINGS.lunchFrom), lt = timeToMin(CLINIC_SETTINGS.lunchTo);
  for(var m = timeToMin(CLINIC_SETTINGS.openTime); m < timeToMin(CLINIC_SETTINGS.closeTime); m += 30){ if(lt > lf && m >= lf && m < lt) continue; slots.push(m); }
  var used = 0; slots.forEach(function(m){ used += slotBookingCount(ds, minToTime(m)); });
  return capHtml(used, slots.length * (CLINIC_SETTINGS.slotCapacity||1), false);
}

/* ---------------- 院长 OFF 那天不该有他的施术 / 面诊 / 预约（CMD-1014-19 一·9，不带开关；幂等）----------------
   演示数据里 KD1 每周三 OFF，而种子里 10-14 有客人9 的施术 → 数据自相矛盾。启动时把「和院长已有施术 / 面诊 / 预约重叠的 OFF 条目」去掉（只删这一次的 OFF 条目，不删案件）。
   正常流程是挡得住的：krSurgerySlotError 遇到院长 OFF 会拦（整天 OFF 拦整天、指定时间 OFF 拦重叠时段），所以只有演示种子 / 旧数据会有这种矛盾。 */
function repairOffConflicts(){
  var n = 0;
  Object.keys(HOSPITAL_DATA||{}).forEach(function(hid){
    var h = HOSPITAL_DATA[hid]; if(!h || !h.offs) return;
    h.offs = h.offs.filter(function(o){
      if(o.kind!=='director') return true;
      var rg = (!o.part || o.part==='全天') ? [0,1440] : (function(){ try{ var r = krHalfRange(hid, offPartArg(o.part)); return [timeToMin(r[0]), r[1]==='24:00' ? 1440 : timeToMin(r[1])]; }catch(e){ return [0,1440]; } })();
      var clash = ((h.directorSchedule||{})[o.who]||[]).some(function(b){ return (b.kind==='施术' || b.kind==='面诊' || b.kind==='预约' || b.type==='施术' || b.type==='面诊') && b.date===o.date && timeToMin(b.time) < rg[1] && timeToMin(b.end||b.time) > rg[0]; });
      if(clash){ n++; return false; } return true;
    });
  });
  return n;
}

/* ---- CMD-1020-11 / 13：在韩期间输入（确认赴韩时可空 / 项目卡随时可改 / 施术前 2 天［已确认行程］必填）----
   两行：入境 = 入境日｜入境时间（韩国当地）｜入境机场（选填）；离境同。［已确认行程］多一栏「确认方式」（电话 / WhatsApp / 短信 / 当面 / 其他：文字，必选至少一个）。 */
var STAY_CTX = null, TRIP_METHODS = ['电话', 'WhatsApp', '短信', '当面'];
function stayGate(c, cb){
  if(window.GMC_STAY_AUTO || c.stay || c.stayAsked){ cb(); return; } /* GMC_STAY_AUTO：自测用，不弹在韩期间窗口 */
  openStayModal(c.id, {initial:true, then:cb});
}
function openStayModal(caseId, o){
  var c = calCaseById(caseId); if(!c) return; o = o || {}; STAY_CTX = {id:caseId, o:o};
  var ov = document.getElementById('stay-overlay'); if(!ov){ ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'stay-overlay'; ov.style.zIndex = 96; document.body.appendChild(ov); }
  var inp = 'padding:9px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;min-width:0;', s = c.stay || {}, tc = c.tripConfirm || {};
  var row = function(k, lab){ return '<div style="display:grid;grid-template-columns:44px 1.3fr 1fr 1.2fr;gap:8px;align-items:end;margin-bottom:10px;"><b style="font-size:13px;padding-bottom:9px;">'+lab+'</b><div><label style="font-size:12px;color:var(--slate2);">'+lab+'日</label><input type="date" id="stay-'+k+'" value="'+(s[k]||'')+'"'+stayRangeAttr()+' style="'+inp+'width:100%;" onchange="stayWarnRefresh()"></div><div><label style="font-size:12px;color:var(--slate2);">'+lab+'时间（韩国当地）</label><input type="time" id="stay-'+k+'t" value="'+(s[k+'Time']||'')+'" style="'+inp+'width:100%;"></div><div><label style="font-size:12px;color:var(--slate2);">'+lab+'机场（选填）</label><input id="stay-'+k+'a" value="'+aEscC(s[k+'Airport']||'')+'" placeholder="例：仁川 ICN" style="'+inp+'width:100%;"></div></div>'; };
  var methods = o.trip ? '<div style="margin-top:4px;"><div style="font-size:12px;font-weight:700;margin-bottom:6px;">确认方式（必选，可多选）</div><div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;font-size:13px;">'+TRIP_METHODS.map(function(m, i){ return '<label style="display:flex;gap:5px;align-items:center;"><input type="checkbox" class="stay-m" value="'+m+'"'+((tc.methods||[]).indexOf(m)>-1 ? ' checked' : '')+'> '+m+'</label>'; }).join('')+'<label style="display:flex;gap:5px;align-items:center;"><input type="checkbox" id="stay-mo"'+(tc.other ? ' checked' : '')+'> 其他：<input id="stay-mot" value="'+aEscC(tc.other||'')+'" style="'+inp+'width:120px;padding:5px 8px;"></label></div></div>' : '';
  var title = o.trip ? '确认行程' : '在韩期间', tip = o.trip ? '联络客人确认行程（入境 / 离境）；日期、时间必填，机场选填，至少勾一个确认方式。' : (o.initial ? '客人在韩国的入境 / 离境。航班还没定，可以点［出发前再确认］，之后随时能改。' : '行程有变可以修改，修改后 KR 会收到通知。');
  ov.innerHTML = '<div class="modal-box" style="width:560px;"><div style="font-size:15px;font-weight:700;margin-bottom:6px;">'+title+'</div><div style="font-size:12px;color:var(--muted);margin-bottom:12px;">'+tip+'</div>'+row('in', '入境')+row('out', '离境')+methods+
    '<div id="stay-warn" style="font-size:12px;margin-top:8px;"></div><div id="stay-err" class="error-text" style="display:none;margin-top:8px;"></div>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;"><button class="btn-outline" onclick="stayCancel()">'+(o.initial ? '出发前再确认' : '取消')+'</button><button class="btn-primary" onclick="staySave()">保存</button></div></div>';
  ov.classList.add('open'); stayWarnRefresh();
}
function stayWarnRefresh(){
  var w = document.getElementById('stay-warn'), c = STAY_CTX && calCaseById(STAY_CTX.id); if(!w || !c) return;
  var n = stayShortDays(c, (document.getElementById('stay-out')||{}).value||'');
  w.innerHTML = n ? '<span style="color:#B3261E;font-weight:700;">⚠ 离境日比建议少 '+n+' 天（最早可回国日 '+stayMD(krCbEarliest(c))+'）</span>' : '';
}
function stayCancel(){
  var x = STAY_CTX, ov = document.getElementById('stay-overlay'); if(ov) ov.classList.remove('open'); STAY_CTX = null; if(!x) return;
  var c = calCaseById(x.id); if(x.o.initial && c){ c.stayAsked = true; if(x.o.then) x.o.then(); } /* 出发前再确认（原「先空着」）：只记「问过了」 */
}
function staySave(){
  var x = STAY_CTX; if(!x) return; var c = calCaseById(x.id), e = document.getElementById('stay-err'), g = function(i){ return (document.getElementById(i)||{}).value||''; }; if(!c) return;
  var d = {inD:g('stay-in'), outD:g('stay-out'), ex:{inTime:g('stay-int'), outTime:g('stay-outt'), inAirport:g('stay-ina').trim(), outAirport:g('stay-outa').trim()}}, methods = [], other = '';
  var bad = function(t){ e.textContent = t; e.style.display = 'block'; };
  if(x.o.trip){
    if(!d.inD || !d.outD || !d.ex.inTime || !d.ex.outTime) return bad('入境、离境的日期和时间都要填');
    [].forEach.call(document.querySelectorAll('#stay-overlay .stay-m'), function(b){ if(b.checked) methods.push(b.value); });
    if((document.getElementById('stay-mo')||{}).checked){ other = g('stay-mot').trim(); if(!other) return bad('勾了「其他」要写是什么方式'); methods.push('其他：'+other); }
    if(!methods.length) return bad('请至少勾一个确认方式');
  }
  if(d.inD && d.outD && d.outD < d.inD) return bad('离境日不能早于入境日');
  var ye = stayDateErr('入境日', d.inD) || stayDateErr('离境日', d.outD); if(ye) return bad(ye);
  var finish = function(){ staySaveDo(x, c, d, methods, other, bad); };
  if(d.outD && stayConflictInfo(c, d.outD, (d.ex||{}).outTime).length){ inStayResGate(c, d, finish); return; } /* CMD-1027-14：离开日期之后还有韩国预约 → 先弹处理窗（和 KR 的行程修正同一套规则） */
  finish();
}
function staySaveDo(x, c, d, methods, other, bad){
  var r = coreSetStay(c, d.inD, d.outD, actingName(), {initial:!!x.o.initial, ex:d.ex}); if(!r.ok) return bad(r.err);
  if(x.o.trip){ c.tripConfirm = {at:nowFullDt(), by:actingName(), methods:methods, other:other}; logCaseEvent(c, actingName(), '已确认行程（'+methods.join('、')+'）：入境 '+stayMDT(c, 'in')+' / 离境 '+stayMDT(c, 'out'), '赴韩施术'); }
  var ov = document.getElementById('stay-overlay'); if(ov) ov.classList.remove('open'); STAY_CTX = null;
  if(x.o.then) x.o.then(); else { try{ renderCaseBody(c); }catch(er){} }
}


/* ================= CMD-1027-14：IN 改在韩期间——离开当天及之后还有韩国预约 → 处理弹窗（对应 KR 的 krStayResolveGate / coreStayResolve，核心处理函数共用） =================
   每一项必选：［回印尼做］（只有「韩国或印尼都可」的；取消这笔韩国预约，进「印尼术后 · 未预约」）/［保留］（取消这笔预约，项目留在「在韩术后 · 未预约」）/
   ［请 KR 提前做］（韩国的预约由 KR 安排，IN 不直接改日子：预约原样不动，发通知给 KR + KR 待办，KR 改到离开前之前仍算冲突）。 */
var IN_STAYRES = null;
function inStayResGate(c, d, then){
  var list = stayConflictInfo(c, d.outD, (d.ex||{}).outTime); if(!list.length){ then(); return; }
  IN_STAYRES = {caseId:c.id, vals:d, then:then, rows:list.map(function(f){ return {f:f, mode:''}; })};
  inStayResRender();
}
function inStayResSet(i, v){ IN_STAYRES.rows[i].mode = v; inStayResRender(); }
function inStayResRender(){
  var S = IN_STAYRES; if(!S) return; var c = calCaseById(S.caseId); if(!c) return;
  var ov = document.getElementById('in-stayres-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'in-stayres-overlay'; ov.className = 'modal-overlay'; ov.style.zIndex = 100030; document.body.appendChild(ov); }
  var leave = stayLeaveWhen(c, S.vals.outD, (S.vals.ex||{}).outTime);
  var rows = S.rows.map(function(r, i){
    var f = r.f, radio = function(v, lb, dis, tip){ return '<label style="display:flex;gap:4px;align-items:center;'+(dis ? 'color:#A89F94;cursor:not-allowed;' : 'cursor:pointer;')+'"'+(tip ? ' title="'+tip+'"' : '')+'><input type="radio" name="isr'+i+'" '+(r.mode===v ? 'checked ' : '')+(dis ? 'disabled ' : '')+'onchange="inStayResSet('+i+',\''+v+'\')">'+lb+'</label>'; };
    return '<div style="padding:10px 0;border-top:1px solid var(--border2);"><div style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 110px;gap:8px;font-size:13px;align-items:center;"><span><b>'+cesc(f.name)+'</b></span><span style="font-size:12px;color:var(--slate2);">'+cesc(f.surg||'—')+'</span><span style="font-size:12px;">'+cesc(f.unbooked ? (f.date ? '建议 '+stayMD(f.date) : '无建议日期') : stayMD(f.date)+(f.time ? ' '+f.time : ''))+'</span></div>'+
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;font-size:12px;">'+radio('toIn', '回印尼做', !f.canIn, f.canIn ? '' : '必须在韩国做，不能回印尼')+radio('keep', '保留（不进未安排预约，另放「保留」组）')+radio('ask', '请 KR 提前做（通知 KR，预约暂时不动）')+(f.unbooked && !f.date ? radio('will', '这趟还会做（之后再约）') : '')+'</div></div>';
  }).join('');
  var ok = S.rows.every(function(r){ return !!r.mode; });
  ov.innerHTML = '<div class="modal-box" style="width:680px;max-width:96vw;max-height:86vh;overflow-y:auto;"><div style="font-size:16px;font-weight:700;margin-bottom:4px;">以下项目超出新行程，请逐项决定怎么处理</div><div style="background:var(--bg-sidebar,#f3efe6);border-radius:8px;padding:8px 12px;font-size:13px;margin:6px 0;">新的离境：<b>'+cesc(leave || '（未填）')+'</b></div><div style="font-size:12px;color:var(--muted);margin-bottom:6px;">每一项都要选才能保存。韩国的预约由 KR 安排：IN 不直接改日子，选「请 KR 提前做」会通知 KR。也可以不改，取消后回去改离开日期。</div>'+
    '<div style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 110px;gap:8px;font-size:12px;color:var(--muted);padding:4px 0;"><span>项目</span><span>施术项目</span><span>原本预约 / 建议日期</span></div>'+rows+
    '<div id="isr-err" style="font-size:12px;color:#B3261E;min-height:16px;margin-top:8px;"></div><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;"><button class="btn-outline" onclick="inStayResCancel()">取消（回去改离开日期）</button><button class="btn-primary" '+(ok ? '' : 'disabled style="opacity:.5;cursor:not-allowed;" ')+'onclick="inStayResSave()">确认处理并保存</button></div></div>';
  ov.classList.add('open');
}
function inStayResCancel(){ IN_STAYRES = null; var ov = document.getElementById('in-stayres-overlay'); if(ov) ov.classList.remove('open'); }
function inStayResSave(){
  var S = IN_STAYRES; if(!S) return; var c = calCaseById(S.caseId); if(!c) return; var picks = {}; S.rows.forEach(function(r){ picks[r.f.id] = {mode:r.mode}; });
  var res = coreStayResolve(c, picks, S.vals.outD, (S.vals.ex||{}).outTime, actingName());
  if(!res.ok){ var er = document.getElementById('isr-err'); if(er) er.textContent = res.err; return; }
  var then = S.then; IN_STAYRES = null; var ov = document.getElementById('in-stayres-overlay'); if(ov) ov.classList.remove('open');
  then();
}
