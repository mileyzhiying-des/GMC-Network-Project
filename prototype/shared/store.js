/* shared/store.js —— 存档与多标签页同步（2026-10-05·一；2026-10-06 改为按诊所分区）
   - 存档分三种键（都在 localStorage 里，带版本号 DEMO_DATA_VERSION）：
       gmc_state          全局部分（GLOBAL_VAR_NAMES）：账号、操作日志、医院、诊所、诊所×医院对接、医院资料（院长名单、赴韩项目、开放日期、KR 日程、赴韩案例）、案件编号序列…
       gmc_clinic_C1 …    每家诊所一个分区（CLINIC_VAR_NAMES）：客户、案件、预约/占位、对话、通知、诊所设定、本地项目、印尼案例…
     每个页面只把"自己诊所"的分区读进全局变量（CASE_ITEMS、CLIENTS … 名字不变，IN 端代码不用改），诊所之间天然隔开；
     PROJECT_LIBRARY / LIB_CASES 在内存里是合成数组（本诊所的 IN 项 + 对接医院的 KR 项），存档时按 hospitalId 拆回医院（viewSplit）。
   - 多个标签页（in.html / owner.html / booking.html / 之后的 KR 端 …）共用同一份存档：某个标签页改了数据 → 存档（只写变了的部分）→ 其他标签页收到 storage 事件 → 只重读和自己相关的部分（全局部分 + 自己诊所的分区）并 refreshView()。
   - **跨诊所读写接口**（KR 端要看/改各诊所的案件）：Store.readClinic(cid) 读某诊所分区；Store.updateClinic(cid, fn) 在该分区上改完写回，该诊所的分页即时同步。
   - 真实上传的图片（data: 地址）只放内存，不写进 localStorage（存档里换成 @img:编号；刷新后这些图片不再显示）。
   - 超出 localStorage 容量（约 5MB）时：不报错、不卡住，console.warn + 画面上提示"演示数据过大，已重置"，之后这个页面不再存档。
   加载顺序：rules.js → i18n.js → ui.js → data.js → store.js → admin.js →（in.html 再加 boot-in.js） */
var Store = (function(){
  var KEY_G = 'gmc_state';
  var disabled = false;   /* 容量超限后，这个页面不再存档 */
  var lastG = '', lastC = '';  /* 上次存档/读档时全局部分、本诊所分区的内容，用来判断有没有变化 */
  var imgByValue = {}, imgById = {}, imgSeq = 0; /* 内存里的图片登记：data: 地址 ⇄ 编号 */

  function replacer(k, v){
    if(typeof v === 'string' && v.length > 300 && v.indexOf('data:') === 0){
      var id = imgByValue[v];
      if(!id){ id = 'i' + (++imgSeq); imgByValue[v] = id; imgById[id] = v; }
      return '@img:' + id;
    }
    return v;
  }
  function reviver(k, v){
    if(typeof v === 'string' && v.indexOf('@img:') === 0) return imgById[v.slice(5)] || '';
    return v;
  }
  function keyC(cid){ return 'gmc_clinic_' + cid; }
  function pageClinic(){ return (typeof PAGE_CLINIC_ID !== 'undefined') ? PAGE_CLINIC_ID : null; } /* 这个页面所属的诊所（登录页 = null，只读写全局部分） */
  function readRaw(key){ try{ var r = localStorage.getItem(key); return r ? JSON.parse(r, reviver) : null; }catch(e){ return null; } }
  function pick(names){ var o = {}; names.forEach(function(n){ o[n] = window[n]; }); return o; }
  function assignInPlace(name, val){
    var cur = window[name];
    if(Array.isArray(cur) && Array.isArray(val)){ cur.length = 0; Array.prototype.push.apply(cur, val); }
    else if(cur && typeof cur === 'object' && !Array.isArray(cur) && val && typeof val === 'object' && !Array.isArray(val)){
      Object.keys(cur).forEach(function(x){ delete cur[x]; }); Object.assign(cur, val);
    } else window[name] = val;
  }

  /* 合成数组拆回：IN 项留在诊所分区；KR 项写回对应医院（只写本诊所对接的医院） */
  function viewSplit(){
    var inP = [], inC = [], byHP = {}, byHC = {};
    PROJECT_LIBRARY.forEach(function(p){ if(p.origin==='KR'){ var h = p.hospitalId || 'H1'; (byHP[h] = byHP[h] || []).push(p); } else inP.push(p); });
    LIB_CASES.forEach(function(c){ if(c.source==='travel'){ var h = c.hospitalId || 'H1'; (byHC[h] = byHC[h] || []).push(c); } else inC.push(c); });
    linkedHospitalIds(CURRENT_CLINIC_ID).forEach(function(h){ if(HOSPITAL_DATA[h]){ HOSPITAL_DATA[h].projects = byHP[h] || []; HOSPITAL_DATA[h].libCases = byHC[h] || []; } });
    var inCats = {}, krCats = {};
    Object.keys(PROJECT_CATEGORIES).forEach(function(k){ var c = PROJECT_CATEGORIES[k]; if(c.origin==='KR') krCats[k] = c; else inCats[k] = c; });
    Object.keys(KR_CATEGORIES).forEach(function(k){ delete KR_CATEGORIES[k]; }); Object.keys(krCats).forEach(function(k){ KR_CATEGORIES[k] = krCats[k]; });
    return {PROJECT_LIBRARY:inP, LIB_CASES:inC, PROJECT_CATEGORIES:inCats};
  }
  function snapshotG(){ return JSON.stringify(pick(GLOBAL_VAR_NAMES), replacer); }
  function clinicVarsObj(split){ var o = pick(CLINIC_VAR_NAMES); if(split){ o.PROJECT_LIBRARY = split.PROJECT_LIBRARY; o.LIB_CASES = split.LIB_CASES; o.PROJECT_CATEGORIES = split.PROJECT_CATEGORIES; } return o; }
  function wrap(vars){ return JSON.stringify({ver:DEMO_DATA_VERSION, t:Date.now(), vars:vars}, replacer); }
  function snapshot(){ /* 返回 {g, c}：全局部分和本诊所分区的 JSON（c 为 null 表示这个页面没有诊所） */
    var cid = pageClinic(), split = cid ? viewSplit() : null;
    return {g: snapshotG(), c: cid ? JSON.stringify(clinicVarsObj(split), replacer) : null};
  }

  /* ---- 读档 ---- */
  function loadGlobal(){
    var st = readRaw(KEY_G);
    if(!st || String(st.ver) !== String(DEMO_DATA_VERSION) || !st.vars || st.partial) return false;
    GLOBAL_VAR_NAMES.forEach(function(n){ if(st.vars.hasOwnProperty(n)) assignInPlace(n, st.vars[n]); });
    return true;
  }
  function loadClinic(cid){
    var st = readRaw(keyC(cid));
    if(!st || String(st.ver) !== String(DEMO_DATA_VERSION) || !st.vars || st.partial || !st.vars.CASE_ITEMS) return false;
    CLINIC_VAR_NAMES.forEach(function(n){ if(n!=='PROJECT_LIBRARY' && n!=='LIB_CASES' && n!=='PROJECT_CATEGORIES' && st.vars.hasOwnProperty(n)) assignInPlace(n, st.vars[n]); });
    buildClinicViews(st.vars.PROJECT_LIBRARY || [], st.vars.LIB_CASES || [], st.vars.PROJECT_CATEGORIES || {});
    return true;
  }
  function afterLoad(){
    ME_NAME = (currentAccount() || {name:''}).name || ''; /* 账号改过名字（个人设定/激活）后，名字要跟存档走 */
    if(typeof syncInCoordinators === 'function') syncInCoordinators(); /* IN 室长名单由账号算出，不存档 */
    if(typeof applyClinicSettings === 'function') applyClinicSettings(); /* 日历行/时区等由诊所设定派生，不存档 */
    var snap = snapshot(); lastG = snap.g; lastC = snap.c;
  }
  function load(){
    try{
      if(!loadGlobal()) return false;
      var cid = (typeof resolveClinicId === 'function') ? resolveClinicId() : null;   /* 账号读出来之后才知道是哪家诊所 */
      if(cid){ CURRENT_CLINIC_ID = cid; PAGE_CLINIC_ID = cid; if(!loadClinic(cid)) return false; }
      afterLoad();
      return true;
    }catch(e){ console.warn('[存档] 读取失败，使用演示数据', e); return false; }
  }

  function notice(msg){
    var make = function(){
      var el = document.createElement('div');
      el.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:9999;background:#C1454A;color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.25);';
      el.textContent = msg; document.body.appendChild(el);
      setTimeout(function(){ if(el.parentNode) el.remove(); }, 8000);
    };
    if(document.body) make(); else document.addEventListener('DOMContentLoaded', make);
  }
  function writeKey(key, json){
    localStorage.setItem(key, json);
  }
  /* ---- 存档：只写变了的部分；写失败（容量超限等）→ 清掉存档，提示并停止存档 ---- */
  function save(){
    if(disabled) return;
    var snap;
    try{ snap = snapshot(); }catch(e){ console.warn('[存档] 序列化失败', e); return; }
    try{
      if(snap.g !== lastG){ writeKey(KEY_G, '{"ver":'+DEMO_DATA_VERSION+',"t":'+Date.now()+',"vars":'+snap.g+'}'); lastG = snap.g; }
      if(snap.c !== null && snap.c !== lastC){ writeKey(keyC(pageClinic()), '{"ver":'+DEMO_DATA_VERSION+',"t":'+Date.now()+',"vars":'+snap.c+'}'); lastC = snap.c; }
    }catch(e){
      console.warn('[存档] localStorage 容量超限，演示数据已重置，此页面之后的操作不再保存', e);
      disabled = true;
      try{ Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_state')===0 || k.indexOf('gmc_clinic_')===0; }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e2){}
      notice('演示数据过大，已重置（这个页面之后的操作不再保存，刷新页面可恢复演示数据）');
    }
  }
  function touch(){ clearTimeout(touch._t); touch._t = setTimeout(save, 60); }

  /* ---- 启动：补齐缺的存档（第一次打开 / 版本号重置后只保留了账号和诊所设定 / 新增了诊所） ---- */
  function init(){
    var keepClinic = CURRENT_CLINIC_ID;
    CURRENT_CLINIC_ID = 'C1'; /* 此刻全局变量里还是 C1 的演示数据种子 */
    try{
      var g = readRaw(KEY_G);
      if(!g || String(g.ver) !== String(DEMO_DATA_VERSION) || g.partial){
        if(g && g.partial && g.vars) Object.keys(g.vars).forEach(function(n){ window[n] = g.vars[n]; }); /* 版本重置时保留的账号等 */
        var snapC1 = null;
        CLINICS.forEach(function(cl){ /* 先写诊所分区（viewSplit 会把 KR 项拆回医院，全局部分要在它之后序列化） */
          var p = readRaw(keyC(cl.id));
          if(p && String(p.ver)===String(DEMO_DATA_VERSION) && !p.partial && p.vars && p.vars.CASE_ITEMS) return;
          var vars;
          if(cl.id==='C1'){ var split = viewSplit(); vars = clinicVarsObj(split); }
          else vars = buildClinicSeed(cl.id);
          if(p && p.vars) Object.keys(p.vars).forEach(function(n){ vars[n] = p.vars[n]; }); /* 版本重置时保留的诊所设定等 */
          writeKey(keyC(cl.id), wrap(vars));
        });
        writeKey(KEY_G, wrap(pick(GLOBAL_VAR_NAMES)));
      } else {
        CLINICS.forEach(function(cl){ /* 全局在、某个诊所分区缺（或只剩保留下来的部分）→ 补齐这个分区 */
          var p = readRaw(keyC(cl.id));
          if(p && String(p.ver)===String(DEMO_DATA_VERSION) && !p.partial && p.vars && p.vars.CASE_ITEMS) return;
          var vars = (cl.id==='C1') ? clinicVarsObj(viewSplit()) : buildClinicSeed(cl.id);
          if(p && p.vars) Object.keys(p.vars).forEach(function(n){ vars[n] = p.vars[n]; });
          writeKey(keyC(cl.id), wrap(vars));
        });
      }
    }catch(e){ console.warn('[存档] 初始化失败', e); }
    CURRENT_CLINIC_ID = keepClinic;
  }

  /* ---- 跨诊所读写（KR 端要看、要改各诊所的案件）：写进该诊所的分区后，那家诊所的分页收到 storage 事件即时同步 ---- */
  function readClinic(cid){ var p = readRaw(keyC(cid)); return p && p.vars ? p.vars : null; }
  function updateClinic(cid, fn){
    if(cid === pageClinic()){ /* 就是自己这家诊所：直接改内存里的变量，再存档 */
      var v = {}; CLINIC_VAR_NAMES.forEach(function(n){ Object.defineProperty(v, n, {get:function(){ return window[n]; }, set:function(x){ window[n] = x; }}); });
      fn(v); save(); return true;
    }
    var p = readRaw(keyC(cid)); if(!p || !p.vars) return false;
    fn(p.vars);
    try{ writeKey(keyC(cid), JSON.stringify(p, replacer)); return true; }catch(e){ console.warn('[存档] 跨诊所写入失败', e); return false; }
  }

  /* 其他标签页存了新数据：只重读和自己相关的部分 + 重画 */
  window.addEventListener('storage', function(e){
    if(e.key === null || e.key === 'gmc_demo_ver'){ location.reload(); return; } /* 别的标签页重置了演示数据 → 本页也刷新 */
    var cid = pageClinic();
    if(e.key === KEY_G && e.newValue){
      if(loadGlobal()){
        if(cid){ /* 医院资料变了：合成数组按新的医院资料重建（IN 项保持不变） */
          var inCats = {}; Object.keys(PROJECT_CATEGORIES).forEach(function(k){ if(PROJECT_CATEGORIES[k].origin!=='KR') inCats[k] = PROJECT_CATEGORIES[k]; });
          buildClinicViews(PROJECT_LIBRARY.filter(function(p){ return p.origin!=='KR'; }), LIB_CASES.filter(function(c){ return c.source!=='travel'; }), inCats);
        }
        afterLoad();
        if(window.GUARD_ROLES && !guardPage(window.GUARD_ROLES)) return; /* 本账号被停用/重置：回登录页 */
        if(typeof refreshView === 'function') refreshView();
      }
    } else if(cid && e.key === keyC(cid) && e.newValue){
      if(loadClinic(cid)){ afterLoad(); if(typeof refreshView === 'function') refreshView(); }
    }
  });
  /* 操作之后（点击、输入、选择、键盘）稍后存档；另外每 2 秒兜底一次；页面离开/隐藏时再存一次 */
  ['click', 'change', 'input', 'keyup', 'submit', 'drop'].forEach(function(t){ document.addEventListener(t, touch, true); });
  setInterval(save, 2000);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function(){ if(document.hidden) save(); });

  init();
  if(!load()){ /* 读不出来（极少见：存档损坏）就用刚生成的种子重新写一遍 */
    try{ Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_state')===0 || k.indexOf('gmc_clinic_')===0; }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e){}
    init(); load();
  }
  return {save:save, load:load, touch:touch, readClinic:readClinic, updateClinic:updateClinic, isDisabled:function(){ return disabled; }};
})();

/* 重置演示数据：清掉所有 gmc_ 开头的存档，其他标签页收到通知后也会刷新 */
function resetDemoData(){
  try{ Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_')===0; }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e){}
  location.reload();
}

/* 页面守卫（2026-10-05·三）：没登录 → 登录页；角色不对 → 回自己的首页。roles = 允许进入的角色列表 */
function guardPage(roles){
  var a = currentAccount();
  if(!a){ location.replace('/login.html'); return false; }
  if(roles.indexOf(a.role) < 0){ location.replace(homeUrl(a)); return false; }
  return true;
}
