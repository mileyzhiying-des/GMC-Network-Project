/* 演示数据一致性审计：营业时间外 = 0（CMD-1008-05）
   用法：登录任意 IN / KR 账号打开原型页面，在浏览器 console 里粘贴本文件整段（或用 javascript_tool 执行），结果直接返回；
   检查对象：
   · 各诊所预约来访 / 预约占位 / 接续来访：时间在可预约时段内、不落在午休、不在定期休诊日 / 休诊时段；
   · 各医院院长日程的施术 / 不可预约块：在医院营业时间内、不开始于午休（施术可跨过午休；不可预约不能落在午休里）、不在整天休诊日、不超过休诊起始时刻、不和院长 OFF 重叠、同一位院长同一时间只有一件事。
   返回 {outsideHours, total, problems:[…]}，problems 为空 = 通过。 */
(function(){
  var problems = [], total = 0;
  var bad = function(kind, where, msg){ problems.push(kind+' · '+where+' · '+msg); };

  /* ---- IN：各诊所的预约 / 占位 / 接续来访 ---- */
  (CLINICS || []).forEach(function(cl){
    var v = Store.readClinic(cl.id); if(!v) return;
    var st = v.CLINIC_SETTINGS || {}, from = timeToMin(st.bookFrom || '10:00'), to = timeToMin(st.bookTo || '20:30'), lf = timeToMin(st.lunchFrom || '14:00'), lt = timeToMin(st.lunchTo || '15:00');
    var check = function(label, date, time){
      if(!date || !time) return; total++;
      var m = timeToMin(time), dow = new Date(date+'T00:00:00').getDay(), rules = st.closedRules || [], r = rules.filter(function(x){ return x.dow===dow; })[0];
      if(m < from || m > to) bad('IN '+cl.id, label+' '+date+' '+time, '不在可预约时段 '+st.bookFrom+'–'+st.bookTo);
      if(m >= lf && m < lt) bad('IN '+cl.id, label+' '+date+' '+time, '落在午休 '+st.lunchFrom+'–'+st.lunchTo);
      if(r && (!r.from || m >= timeToMin(r.from))) bad('IN '+cl.id, label+' '+date+' '+time, '落在定期休诊（周'+dow+(r.from ? ' '+r.from+' 起' : ' 整天')+'）');
    };
    (v.CASE_ITEMS || []).forEach(function(c){ check('案件 '+c.id, c.visitDate, c.visitTime); });
    (v.RESERVATION_PLACEHOLDERS || []).forEach(function(p){ check('占位 '+p.id, p.date, p.time); });
    (v.RESUMED_VISITS || []).forEach(function(r){ check('接续来访 '+r.caseId, r.date, r.time); });
  });

  /* ---- KR：医院院长日程 ---- */
  Object.keys(HOSPITAL_DATA || {}).forEach(function(hid){
    var h = HOSPITAL_DATA[hid], hr = hospitalHours(hid), lu = hospitalLunch(hid), o0 = timeToMin(hr.open), c0 = timeToMin(hr.close);
    Object.keys(h.directorSchedule || {}).forEach(function(n){
      var arr = h.directorSchedule[n] || [];
      arr.forEach(function(b, i){
        total++;
        var where = hid+' '+n+' '+b.date+' '+b.time+'–'+b.end+' '+(b.kind || b.type), s = timeToMin(b.time), e = timeToMin(b.end);
        if(s < o0 || e > c0) bad('KR', where, '不在营业时间 '+hr.open+'–'+hr.close);
        if(lu){ var ls = timeToMin(lu.from), le = timeToMin(lu.to); if(b.kind==='施术' ? (s >= ls && s < le) : (s < le && e > ls)) bad('KR', where, '落在午休 '+lu.from+'–'+lu.to); }
        if(hospitalClosedOn(hid, b.date)) bad('KR', where, '落在整天休诊日');
        var cf = hospitalClosedFrom(hid, b.date); if(cf && e > timeToMin(cf)) bad('KR', where, '超过休诊起始 '+cf);
        (h.offs || []).filter(function(o){ return o.kind==='director' && o.who===n && offApplies(o, b.date); }).forEach(function(o){
          var rg = (o.part && o.part!=='全天') ? krHalfRange(hid, o.part) : ['00:00', '24:00'], a = rg[0]==='00:00' ? 0 : timeToMin(rg[0]), z = rg[1]==='24:00' ? 1440 : timeToMin(rg[1]);
          if(s < z && e > a) bad('KR', where, '和院长 OFF（'+(o.part || '全天')+'）重叠');
        });
        arr.forEach(function(b2, j){ if(j > i && b2.date===b.date && timeToMin(b2.time) < e && timeToMin(b2.end) > s) bad('KR', where, '和同一院长另一件事重叠 '+b2.time+'–'+b2.end); });
      });
    });
  });
  return {outsideHours: problems.length, total: total, problems: problems.slice(0, 40)};
})();
