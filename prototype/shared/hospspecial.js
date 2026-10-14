/* ================= CMD-1014-03 KR 医院设定：特殊日子小日历 =================
   最上面「定期休诊（每周）」保留；下面一个月历：照每周固定休诊的日子变灰；点某天 → 本来休息：［改为营业］［改为半天营业（几点到几点）］；
   本来营业：［改为休息］；改过的日子标颜色，点了可改回。营业时间、午休照旧在下面。KR 管理者 / 代表院长可改（canDo('clinic')）。
   数据：HOSPITAL_DATA[h].specialDays = [{id, date, mode:'open'|'closed'|'half', from, to, by}]（data.js 的 hospitalClosedOn / From / Before 已经读它）。 */
var HSP = {ym:'', sel:''};
function hspYm(){ if(!HSP.ym) HSP.ym = todayStr().slice(0,7); return HSP.ym; }
function hspBaseRest(ds){ var h = krHData(); return closedWholeDay(h.closedRules, new Date(ds+'T00:00:00').getDay()); }
function hspCalHtml(){
  var h = krHData(), hid = krHospitalIdOfMe(), ym = hspYm(), first = new Date(ym+'-01T00:00:00'), start = new Date(first); start.setDate(1 - first.getDay());
  var can = canDo('clinic'), cells = '', today = todayStr();
  for(var i = 0; i < 42; i++){
    var d = new Date(start); d.setDate(start.getDate()+i); var ds = dateStr(d), inM = d.getMonth()===first.getMonth(), sp = hospitalSpecial(hid, ds), rest = hspBaseRest(ds);
    var bg = sp ? (sp.mode==='open' ? 'var(--sage-bg)' : sp.mode==='closed' ? '#F6DCDC' : '#FBF0C9') : (rest ? '#EFEBE4' : '#fff');
    var tag = sp ? (sp.mode==='open' ? '特殊营业' : sp.mode==='closed' ? '临时休息' : '半天 '+sp.from+'–'+sp.to) : (rest ? '休' : '');
    cells += '<div onclick="hspSelect(\''+ds+'\')" style="min-height:46px;padding:3px 5px;border:1px solid var(--line);background:'+bg+';cursor:pointer;font-size:11px;'+(inM ? '' : 'opacity:.45;')+(HSP.sel===ds ? 'outline:2px solid var(--navy);outline-offset:-2px;' : '')+(ds===today ? 'font-weight:700;' : '')+'"><div>'+d.getDate()+'</div><div style="font-size:9px;color:'+(sp ? '#8F6F0C' : 'var(--muted)')+';">'+tag+'</div></div>';
  }
  var panel = '';
  if(HSP.sel){
    var ds0 = HSP.sel, sp0 = hospitalSpecial(hid, ds0), rest0 = hspBaseRest(ds0), inp = 'padding:5px 8px;border:1px solid var(--border);border-radius:7px;font-size:12px;', hr = hospitalHours(hid);
    var half = '<span style="white-space:nowrap;"><input type="time" id="hsp-from" step="1800" value="'+(sp0 && sp0.from || hr.open)+'" style="'+inp+'"> – <input type="time" id="hsp-to" step="1800" value="'+(sp0 && sp0.to || hr.close)+'" style="'+inp+'"> <button class="btn-outline" onclick="hspSet(\'half\')">改为半天营业</button></span>';
    var status = sp0 ? (sp0.mode==='open' ? '特殊营业（本来休息）' : sp0.mode==='closed' ? '临时休息（本来营业）' : '半天营业 '+sp0.from+'–'+sp0.to) : (rest0 ? '本来休息（每周固定）' : '本来营业');
    var btns = !can ? '<span style="color:var(--muted);">只有 KR 管理者 / 代表院长可以改</span>' : sp0 ? '<button class="btn-outline" onclick="hspClear()">改回原来</button>' + (sp0.mode!=='half' ? ' '+half : '') :
      (rest0 ? '<button class="btn-outline" onclick="hspSet(\'open\')">改为营业</button> '+half : '<button class="btn-outline" onclick="hspSet(\'closed\')">改为休息</button>');
    panel = '<div style="margin-top:10px;padding:10px 12px;border:1px solid var(--border2);border-radius:10px;font-size:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><b>'+ds0+'</b><span style="color:var(--slate2);">'+status+'</span>'+btns+'</div>';
  }
  return '<div style="margin:10px 0 12px;"><div style="font-size:13px;font-weight:700;margin-bottom:6px;">'+t('特殊日子（点某天改营业 / 休息 / 半天营业）')+'</div>'+
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><button class="btn-ghost" onclick="hspShift(-1)">‹</button><b style="font-size:13px;">'+ym+'</b><button class="btn-ghost" onclick="hspShift(1)">›</button></div>'+
    '<div style="display:grid;grid-template-columns:repeat(7,1fr);">'+['日','一','二','三','四','五','六'].map(function(x){ return '<div style="text-align:center;font-size:11px;color:var(--muted);padding:3px;">周'+x+'</div>'; }).join('')+cells+'</div>'+panel+
    '<div style="font-size:11px;color:var(--muted);margin-top:6px;">特殊日子优先于每周固定休诊：KR / 院长日历、IN 的 KR 医院日程（休诊窄列、半天营业浅灰）、IN 选施术日期、KR 确认时间都照这里判断。院长哪天能做手术 = 医院有营业的日子，扣掉这位院长的 OFF 和不可预约。</div></div>';
}
function hspRefresh(){ openAdminPage('clinic', true); }
function hspShift(n){ var d = new Date(hspYm()+'-01T00:00:00'); d.setMonth(d.getMonth()+n); HSP.ym = d.getFullYear()+'-'+pad2(d.getMonth()+1); HSP.sel = ''; hspRefresh(); }
function hspSelect(ds){ HSP.sel = ds; hspRefresh(); }
function hspSet(mode){
  if(!canDo('clinic') || !HSP.sel) return; var h = krHData(), ds = HSP.sel, from = '', to = '';
  if(mode==='half'){ from = (document.getElementById('hsp-from')||{}).value; to = (document.getElementById('hsp-to')||{}).value; if(!/^\d\d:\d\d$/.test(from||'') || !/^\d\d:\d\d$/.test(to||'') || timeToMin(to) <= timeToMin(from)){ alert('请填完整的营业开始和结束时间，结束要晚于开始'); return; } }
  if(mode==='closed' || mode==='half'){ var cf = hspConflicts(ds, mode, from, to); if(cf.length){ hspConflictModal(ds, mode, from, to, cf); return; } } /* CMD-1014-05：那天已有排好的施术 / 术后管理，先改期清空才能改 */
  h.specialDays = (h.specialDays||[]).filter(function(x){ return x.date!==ds; });
  h.specialDays.push({id:'sd'+Date.now(), date:ds, mode:mode, from:from, to:to, by:ME_NAME});
  logOp('设定变更', '医院特殊日子：'+ds+' → '+(mode==='open' ? '改为营业' : mode==='closed' ? '改为休息' : '半天营业 '+from+'–'+to)); Store.touch(); hspRefresh();
}
/* 改成休息 / 半天营业前检查：那天（半天营业时指营业时段以外）已排好的施术、没做完的术后管理（含在韩持有使用） */
function hspConflicts(ds, mode, from, to){
  var out = [], hid = krHospitalIdOfMe(), outside = function(tm){ return mode==='closed' || (tm && (timeToMin(tm) < timeToMin(from) || timeToMin(tm) >= timeToMin(to))); };
  krClinics().forEach(function(cl){
    Store.withClinic(cl.id, function(){
      CASE_ITEMS.forEach(function(c){
        if(!krCaseVisible(c, hid) || isEnded(c) && !(c.subItems||[]).some(function(s){ return !s.done && s.date===ds; })) return;
        var ks = c.krSchedule;
        if(ks && ks.confirmedDate===ds && ['confirmed','change_pending'].indexOf(ks.status)>-1 && !c.hasArrived && outside(ks.confirmedTime||'')) out.push({clinicId:cl.id, id:c.id, caseNo:c.caseNo, name:c.name, what:'施术', time:ks.confirmedTime||'', dir:c.director||'', surg:true});
        (c.subItems||[]).forEach(function(s){ if(s.kind==='术后管理记录' && !s.done && !s.cancelled && s.date===ds && outside(s.time||'')) out.push({clinicId:cl.id, id:c.id, caseNo:c.caseNo, name:c.name, what:'术后管理 · '+(s.projectName||s.content||''), time:s.time||'', dir:c.director||'', subId:s.id}); });
      });
    });
  });
  return out.sort(function(a, b){ return String(a.time).localeCompare(String(b.time)); });
}
function hspConflictModal(ds, mode, from, to, cf){
  var old = document.getElementById('hsp-conf-overlay'); if(old) old.remove();
  var rows = cf.map(function(x){ return '<a href="#" onclick="hspGoCase(\''+x.clinicId+'\',\''+x.id+'\',\''+(x.subId||'')+'\');return false;" style="display:flex;gap:10px;padding:8px 10px;border:1px solid var(--border2);border-radius:8px;margin-bottom:6px;font-size:12px;color:inherit;text-decoration:none;"><b>'+(x.time||'未定时间')+'</b><span>'+x.what+'</span><span style="color:var(--slate2);">'+x.name+' · '+x.caseNo+(x.dir ? ' · '+x.dir : '')+'</span></a>'; }).join('');
  document.body.insertAdjacentHTML('beforeend', '<div id="hsp-conf-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:3000;display:flex;align-items:center;justify-content:center;"><div style="background:#fff;border-radius:14px;padding:20px 22px;width:min(520px,92vw);max-height:80vh;overflow:auto;"><div style="font-size:15px;font-weight:700;margin-bottom:6px;">不能改：'+ds+' 已有排好的安排</div><div style="font-size:12px;color:var(--slate2);margin-bottom:10px;">'+(mode==='closed' ? '改成休息' : '改成半天营业 '+from+'–'+to)+'前，请先把下面'+cf.length+'项改期或取消（点开进入案件），清空后再改。</div>'+rows+'<div style="text-align:right;margin-top:8px;"><button class="btn-outline" onclick="document.getElementById(\'hsp-conf-overlay\').remove()">知道了</button></div></div></div>');
}
function hspGoCase(clinicId, id, subId){ var o = document.getElementById('hsp-conf-overlay'); if(o) o.remove(); if(subId) krOpenSub(clinicId, id, subId); else krOpenSurgSub(clinicId, id); }
function hspClear(){
  if(!canDo('clinic') || !HSP.sel) return; var h = krHData(), ds = HSP.sel; h.specialDays = (h.specialDays||[]).filter(function(x){ return x.date!==ds; });
  logOp('设定变更', '医院特殊日子：'+ds+' 改回原来'); Store.touch(); hspRefresh();
}
(function(){
  if(typeof ADMIN_RENDER==='undefined' || !ADMIN_RENDER.clinic) return;
  var base = ADMIN_RENDER.clinic;
  ADMIN_RENDER.clinic = function(el, r){
    var out = base.apply(this, arguments);
    try{
      if(isKrAccount()){
        var marks = [].slice.call(el.querySelectorAll('div')).filter(function(x){ return x.children.length===0 && /整天休诊：IN 的 KR 医院日程里显示 1\/3 宽的窄列/.test(x.textContent); });
        if(marks[0]) marks[0].insertAdjacentHTML('afterend', hspCalHtml());
      }
    }catch(e){ console.error('[医院特殊日子]', e); }
    return out;
  };
})();
