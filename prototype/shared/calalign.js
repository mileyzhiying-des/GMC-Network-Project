/* ================= CMD-1014-01 三边日历对齐 + 待办补充（开关 newCalOn()；关 = f3c7ab4 的样子）=================
   规则：IN-DASH-01 / KR-DASH-01 顶部「🧪 2026-10-14 三边日历对齐」、Notification Center 🧪 第 7 点。
   原则：以 IN 室长现有做法为准，IN 只改日视图（整天时间格）和时间范围（营业时间前后各 2 小时）；其余是 KR 室长 / 院长对齐 IN。
   本文件在 todo.js 之后加载；所有入口先检查 newCalOn()。 */

/* ---------------- 时间范围：营业时间前 2 小时 ～ 后 2 小时 ---------------- */
function calHours(){
  if(!newCalOn()) return WK_HOURS;
  var a = Math.max(0, timeToMin(CLINIC_SETTINGS.openTime) - 120), b = Math.min(24*60, timeToMin(CLINIC_SETTINGS.closeTime) + 120);
  return slotsBetween(minToTime(a), b >= 24*60 ? '24:00' : minToTime(b));
}
/* KR / 院长：医院营业时间前后各 2 小时（取代固定 08:00～20:00）；整点取整 */
function krcApplyRange(){
  if(!newCalOn()){ KRC_H0 = 8; KRC_H1 = 20; return; }
  var hr = hospitalHours(krHospitalIdOfMe()), a = Math.max(0, timeToMin(hr.open) - 120), b = Math.min(24*60, timeToMin(hr.close) + 120);
  KRC_H0 = Math.floor(a/60); KRC_H1 = Math.min(24, Math.ceil(b/60));
}

/* ---------------- IN 日视图：整天时间格（同周视图的一列） ---------------- */
function buildDayGridNew(){
  var box = document.getElementById('day-detail'); if(!box) return;
  var d = new Date(TODAY_DATE); d.setDate(d.getDate()+DAY_OFFSET);
  var ds = dateStr(d), closedDay = isRescheduleDateDisabled(d);
  var evs = calendarEvents().filter(function(e){ return e.date===ds && !(e.kind==='reservation' && e.vstate==='预约取消'); });
  var nowD = demoNow(), nowSlot = pad2(nowD.getHours())+':'+(nowD.getMinutes()>=30?'30':'00'), lunchBarDone = false;
  var html = '<div class="wk-scroll"><div class="wk-grid" id="day-grid" style="grid-template-columns:64px minmax(0,1fr);position:relative;">'+
    '<div class="wk-corner">'+axisHeadHtml()+'</div>'+
    '<div class="wk-head'+(sameDate(d, TODAY_DATE)?' today':'')+'">'+(d.getMonth()+1)+'.'+d.getDate()+' 周'+DOW_CN[dowOfDate(ds)]+(closedDay?'<br><span style="font-size:9px;color:var(--terracotta);font-weight:700;">休诊</span>':'')+'</div>'+
    '<div class="wk-memo" style="font-weight:700;color:var(--slate2);">固定栏</div><div class="wk-memo">'+memoCellHtml(ds)+'</div>';
  calHours().forEach(function(hr){
    var rowEvs = evs.filter(function(e){ return slotOf(e.time)===hr; });
    if(slotIsLunch(hr)){
      if(!lunchBarDone){ html += '<div class="wk-lunchbar">午休 '+CLINIC_SETTINGS.lunchFrom+'～'+CLINIC_SETTINGS.lunchTo+'</div>'; lunchBarDone = true; }
      if(!rowEvs.length) return;
    }
    html += '<div class="wk-time'+(rowEvs.length?'':' empty')+((ds===dateStr(nowD) && hr===nowSlot)?' wk-now':'')+'">'+hr+'<span class="kr">'+krTimeOf(hr)+'</span></div>';
    var cell = rowEvs.slice().sort(function(a,b){ return a.time.localeCompare(b.time) || ((a.kind==='placeholder')-(b.kind==='placeholder')) || String(a.name).localeCompare(String(b.name)); });
    var chips = cell.slice(0, 3).map(eventChipHtml).join('') + (cell.length > 3 ? '<div class="wk-more" onclick="event.stopPropagation();openSlotList(\''+ds+'\',\''+hr+'\')">+'+(cell.length-3)+' 更多</div>' : '');
    var why = slotBlockReason(ds, hr), pastSlot = why==='past', fullSlot = why==='full';
    var slotClick = why ? '' : ' onclick="openAddSlotModal(\''+ds+'\',\''+hr+'\')" title="点击预约这个空档"';
    html += '<div class="wk-cell'+(why?'':' wk-cell-open')+(pastSlot?' wk-past':'')+((why==='lunch'||why==='closed')?' wk-lunch':'')+(fullSlot?' wk-full':'')+((ds===dateStr(nowD) && hr===nowSlot)?' wk-now':'')+'"'+slotClick+'>'+chips+(fullSlot?'<div style="font-size:10px;color:var(--muted);text-align:right;">已满</div>':'')+'</div>';
  });
  box.innerHTML = html+'</div></div>';
}

/* ---------------- KR / 院长：固定栏（OFF · 谁 修改）+ memo ---------------- */
function krMemosOf(){ var h = krHData(); if(!h) return []; h.memos = h.memos || []; return h.memos; }
function krMemosOn(ds){ var me = currentAccount(); return krMemosOf().filter(function(m){ return m.date===ds && (m.scope!=='私人' || m.by===me.id); }); }
function krcOffPartText(o){ return (o.part && o.part!=='全天') ? '（'+o.part+'）' : ''; }
/* 固定栏单元格：OFF 标签（带［修改］）+ memo；有权限的才有［修改］，不再点标签直接删除 */
function krcFixedHtml(ds, offs){
  var out = '', me = currentAccount();
  offs.forEach(function(o){
    if(!o.id) o.id = 'off'+Date.now()+Math.floor(Math.random()*1000);
    var can = krcCanEdit(o.who);
    out += '<span class="krfx off" title="OFF">OFF · '+krEsc(o.who)+krcOffPartText(o)+(can ? ' <a href="#" onclick="krfxEditOff(\''+o.id+'\');return false;">修改</a>' : '')+'</span>';
  });
  krMemosOn(ds).forEach(function(m){
    var mine = m.by===me.id;
    out += '<span class="krfx memo" title="'+krEsc(m.text)+'">'+(m.scope==='私人'?'🔒 ':'')+krEsc(m.text)+' <i>'+krEsc(m.author)+'</i>'+(mine ? ' <a href="#" onclick="krfxEditMemo(\''+m.id+'\');return false;">修改</a>' : '')+'</span>';
  });
  return out || '<span style="font-size:10px;color:#ccc;">—</span>';
}
var KRFX = null;
function krfxWhoOptions(){ return krcIsDirector() ? [currentAccount().name] : krcDirectors(); }
function krfxOpen(editKind, id){
  var h = krHData(), today = krToday();
  if(editKind==='off'){
    var o = (h.offs||[]).filter(function(x){ return x.id===id; })[0]; if(!o || !krcCanEdit(o.who)) return;
    KRFX = {edit:'off', id:id, date:o.date||today, type:'OFF', who:o.who, part:o.part||'全天', scope:'公开', text:o.note||''};
  } else if(editKind==='memo'){
    var m = krMemosOf().filter(function(x){ return x.id===id; })[0]; if(!m || m.by!==currentAccount().id) return;
    KRFX = {edit:'memo', id:id, date:m.date, type:'备忘', who:'', part:'全天', scope:m.scope||'公开', text:m.text};
  } else KRFX = {edit:null, date:today, type:'备忘', who:krfxWhoOptions()[0]||'', part:'全天', scope:'公开', text:''};
  krfxRender();
}
function krfxEditOff(id){ krfxOpen('off', id); }
function krfxEditMemo(id){ krfxOpen('memo', id); }
function krfxSet(k, v){ KRFX[k] = v; krfxRender(); }
function krfxRender(){
  var ov = document.getElementById('krfx-overlay'); if(!ov){ ov = document.createElement('div'); ov.id = 'krfx-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  var d = KRFX, isOff = d.type==='OFF', editing = !!d.edit, inp = 'padding:6px 9px;border:1px solid var(--line);border-radius:7px;font-size:12px;';
  var radio = function(name, val, label, checked, disabled){ return '<label style="margin-right:14px;font-size:13px;'+(disabled?'color:var(--dim);':'')+'"><input type="radio" '+(checked?'checked ':'')+(disabled?'disabled ':'')+'onchange="krfxSet(\''+name+'\',\''+val+'\')"> '+label+'</label>'; };
  var whoOpts = krfxWhoOptions();
  ov.innerHTML = '<div class="modal-box" style="width:420px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b>'+(editing ? (d.edit==='off' ? '修改 OFF' : '修改 memo') : '新增 memo')+'</b><span style="cursor:pointer;" onclick="krfxClose()">✕</span></div>'+
    '<div class="field" style="margin-bottom:12px;"><label>日期</label><input type="date" value="'+d.date+'" '+(editing && d.edit==='off' ? 'disabled ' : '')+'onchange="KRFX.date=this.value"></div>'+
    (editing ? '' : '<div style="margin-bottom:12px;"><div style="font-size:12px;color:var(--slate);margin-bottom:4px;">类型</div>'+radio('type','备忘','备忘',d.type==='备忘')+radio('type','OFF','OFF（院长）',d.type==='OFF')+'</div>')+
    (isOff ? '<div style="margin-bottom:12px;font-size:13px;">'+(editing || krcIsDirector() ? '<b>'+krEsc(d.who||whoOpts[0]||'')+'</b>' : '<select onchange="KRFX.who=this.value" style="'+inp+'">'+whoOpts.map(function(n){ return '<option'+(d.who===n?' selected':'')+'>'+krEsc(n)+'</option>'; }).join('')+'</select>')+
      ' <select onchange="KRFX.part=this.value" style="'+inp+'">'+['全天','上午','下午'].map(function(p){ return '<option'+(d.part===p?' selected':'')+'>'+p+'</option>'; }).join('')+'</select></div>' :
      '<div style="margin-bottom:12px;"><div style="font-size:12px;color:var(--slate);margin-bottom:4px;">可见范围</div>'+radio('scope','公开','公开',d.scope==='公开')+radio('scope','私人','私人',d.scope==='私人')+'</div>')+
    '<div class="field" style="margin-bottom:12px;"><label>'+(isOff?'备注（选填）':'内容')+'</label><input type="text" value="'+krEsc(d.text||'')+'" oninput="KRFX.text=this.value"></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-bottom:12px;">作者：'+krEsc(ME_NAME)+'</div>'+
    '<div style="display:flex;gap:10px;"><button class="btn-primary" style="flex:1;" onclick="krfxSave()">保存</button>'+(editing ? '<button class="btn-outline" style="flex:1;color:#C1454A;border-color:#C1454A;" onclick="krfxDelete()">删除</button>' : '')+'</div></div>';
  ov.classList.add('open');
}
function krfxClose(){ var ov = document.getElementById('krfx-overlay'); if(ov) ov.classList.remove('open'); KRFX = null; }
/* 同一位院长同一时间只能有一件事：OFF 时段里已有这位院长的施术 / 面诊 → 挡下（同 krcAddOff） */
function krfxOffClash(who, date, part, exceptId){
  var h = krHData(), hid0 = krHospitalIdOfMe(), part0 = part||'全天', rg0 = part0==='全天' ? ['00:00','24:00'] : krHalfRange(hid0, part0), a0 = rg0[0]==='00:00' ? 0 : timeToMin(rg0[0]), z0 = rg0[1]==='24:00' ? 1440 : timeToMin(rg0[1]);
  return ((h.directorSchedule||{})[who]||[]).filter(function(b){ return (b.kind==='施术' || b.kind==='面诊') && b.date===date && timeToMin(b.time) < z0 && timeToMin(b.end) > a0; })[0] || null;
}
function krfxSave(){
  var d = KRFX, h = krHData(), me = currentAccount(); if(!d || !d.date){ alert('请选择日期'); return; }
  if(d.type==='OFF' || d.edit==='off'){
    var who = d.who || krfxWhoOptions()[0]; if(!who || !krcCanEdit(who)){ alert('没有权限给这位院长标 OFF'); return; }
    var clash = krfxOffClash(who, d.date, d.part); if(clash){ alert('这位院长在这个时段已有'+clash.kind+'（'+clash.time+'–'+clash.end+'），不能标 OFF；请先改期'+clash.kind); return; }
    h.offs = h.offs || [];
    if(d.edit==='off'){ var o = h.offs.filter(function(x){ return x.id===d.id; })[0]; if(!o) return; o.part = d.part; o.note = (d.text||'').trim(); logOp('其他', '修改 OFF：'+who+' '+o.date+' → '+d.part, '日程'); }
    else { h.offs.push({id:'off'+Date.now(), date:d.date, who:who, kind:'director', part:d.part||'全天', note:(d.text||'').trim(), by:ME_NAME}); logOp('其他', '标 OFF：'+who+' '+d.date+' '+(d.part||'全天'), '日程'); }
  } else {
    if(!(d.text||'').trim()){ alert('请填写备忘内容'); return; }
    var ms = krMemosOf();
    if(d.edit==='memo'){ var m = ms.filter(function(x){ return x.id===d.id; })[0]; if(!m || m.by!==me.id) return; m.date = d.date; m.scope = d.scope; m.text = d.text.trim(); }
    else ms.push({id:'km'+Date.now(), date:d.date, scope:d.scope, text:d.text.trim(), author:ME_NAME, by:me.id});
  }
  krfxClose(); Store.touch(); krcRender();
}
function krfxDelete(){
  var d = KRFX; if(!d || !d.edit || !confirm('确认删除？')) return; var h = krHData();
  if(d.edit==='off'){ var o = (h.offs||[]).filter(function(x){ return x.id===d.id; })[0]; if(!o || !krcCanEdit(o.who)) return; h.offs = h.offs.filter(function(x){ return x.id!==d.id; }); logOp('其他', '删除 OFF：'+o.who+' '+o.date, '日程'); }
  else { var m = krMemosOf().filter(function(x){ return x.id===d.id; })[0]; if(!m || m.by!==currentAccount().id) return; h.memos = h.memos.filter(function(x){ return x.id!==d.id; }); }
  krfxClose(); Store.touch(); krcRender();
}

/* ---------------- KR / 院长：月视图照 IN（月份显示、点月份选年月 + 回到今天） ---------------- */
function krcTodayBtnHtml(){
  if(KRC.mode==='month'){ var a = krcAnchor(), y = parseInt(a.slice(0,4),10), m = parseInt(a.slice(5,7),10); return '<button class="btn-ghost" onclick="krcMonthPicker()" title="选择年月">'+((y!==parseInt(krToday().slice(0,4),10)) ? y+'年' : '')+m+'月</button>'; }
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
  if(!newCalOn()) return '';
  var m = todoNowMinutes(); if(m < KRC_H0*60 || m >= KRC_H1*60) return '';
  var top = Math.floor((m - KRC_H0*60)/30) * 30 * KRC_PX / 60;
  return '<div class="krc-nowframe" style="top:'+top+'px;height:'+(KRC_PX/2)+'px;"></div>';
}
(function(){
  if(typeof krCalendarHtml!=='function') return;
  var base = krCalendarHtml;
  krCalendarHtml = function(){
    krcApplyRange();
    var h = base.apply(this, arguments);
    if(!newCalOn()) return h;
    h = h.replace('<button class="btn-ghost" onclick="krcToday()">今天</button>', krcTodayBtnHtml()+'<button class="btn-outline" onclick="krfxOpen()" title="新增备忘 / OFF">＋ memo</button>');
    h = h.replace('图例：', '图例：<span style="background:#E3EAF6;color:#2F4F86;padding:0 5px;border-radius:3px;">面诊</span> <span style="background:#E4EEE7;color:#2F6B4A;padding:0 5px;border-radius:3px;">术后到店</span> ');
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
  var d = calDaysToSurgery(c); return d<=2 && d>=0 && !(c.recheck && c.recheck.key===calKey(c));
}
function calRecheckText(c){ return (c.recheck && c.recheck.key===calKey(c)) ? '✓ 日程已确认无变动（IN · '+c.recheck.at.slice(0,10)+'）' : 'IN 尚未确认日程'; }
function calRelayRecheckCards(c){
  if(!newCalOn() || scheduleState(c)!=='Confirmed' || !c.krSchedule) return '';
  var key = calKey(c), out = '', told = c.relayTold===key, rc = c.recheck && c.recheck.key===key, d = calDaysToSurgery(c);
  out += '<div class="card" style="padding:14px 20px;display:flex;align-items:center;gap:12px;margin-bottom:12px;"><div style="flex:1;"><div style="font-size:13px;font-weight:700;">转告客人</div><div style="font-size:12px;color:var(--slate2);margin-top:2px;">KR 已确认施术时间：'+aEsc(key)+'（韩国时间）'+(told ? ' · <span style="color:var(--sage);">✓ 已转告客人'+(c.relayAt ? '（'+aEsc(c.relayAt.slice(0,16))+'）' : '')+'</span>' : '')+'</div></div>'+(told ? '' : '<button class="btn-primary" onclick="calRelayDone(\''+c.id+'\')">已转告客人</button>')+'</div>';
  if(d<=2 && d>=0 || rc) out += '<div class="card" style="padding:14px 20px;display:flex;align-items:center;gap:12px;margin-bottom:12px;"><div style="flex:1;"><div style="font-size:13px;font-weight:700;">确认日程无变动</div><div style="font-size:12px;color:var(--slate2);margin-top:2px;">'+(rc ? '<span style="color:var(--sage);">'+aEsc(calRecheckText(c))+'</span>' : '施术前 2 天：问一下客人这个日程有没有变化；有变化走下面原来的改期流程')+'</div></div>'+(rc ? '' : '<button class="btn-primary" onclick="calRecheckOk(\''+c.id+'\')">确认无变动</button>')+'</div>';
  return out;
}
function calCaseById(id){ return CASE_ITEMS.filter(function(x){ return x.id===id; })[0]; }
function calRelayDone(id){
  var c = calCaseById(id); if(!c || !newCalOn()) return;
  c.relayTold = calKey(c); c.relayAt = nowFullDt();
  logCaseEvent(c, actingName(), '已转告客人 KR 确认的施术时间：'+calKey(c)+'（韩国时间）');
  Store.touch(); buildCaseLog(c); renderCaseBody(c); try{ todoRefresh(); }catch(e){}
}
function calRecheckOk(id){
  var c = calCaseById(id); if(!c || !newCalOn()) return;
  c.recheck = {key:calKey(c), by:actingName(), at:nowFullDt()};
  logCaseEvent(c, actingName(), '确认客人日程无变动（施术 '+calKey(c)+'）');
  Store.touch(); buildCaseLog(c); renderCaseBody(c); try{ todoRefresh(); renderCalendar(); }catch(e){}
}
(function(){
  if(typeof krTabContent==='function'){
    var base = krTabContent;
    krTabContent = function(c){ var h = base.apply(this, arguments); try{ return newCalOn() ? calRelayRecheckCards(c)+h : h; }catch(e){ return h; } };
  }
  /* 日历上那天标「日程待确认」：事件块加 data-recheck，样式在 app.css（纯 CSS 徽标，不改事件块内容） */
  if(typeof eventChipHtml==='function'){
    var baseChip = eventChipHtml;
    eventChipHtml = function(e){
      var h = baseChip.apply(this, arguments);
      try{ if(newCalOn() && e && e.kind==='travel' && e.caseId){ var c = calCaseById(e.caseId); if(c && calNeedsRecheck(c)) h = h.replace('class="event-chip"', 'class="event-chip" data-recheck="1"'); } }catch(err){}
      return h;
    };
  }
})();
if(newCalOn()){ try{ TODO_UI.kind = ''; }catch(e){} } /* 卡片筛选不跨刷新保留 */
