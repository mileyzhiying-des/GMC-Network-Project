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
  var disabled = false, stampDirty = false;   /* 容量超限后，这个页面不再存档 */
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
  function wrap(vars){ return JSON.stringify({ver:DEMO_DATA_VERSION, t:Date.now(), st:1, vars:vars}, replacer); }
  function snapshot(){ /* 返回 {g, c}：全局部分和本诊所分区的 JSON（c 为 null 表示这个页面没有诊所） */
    var cid = pageClinic(), split = cid ? viewSplit() : null;
    return {g: snapshotG(), c: cid ? JSON.stringify(clinicVarsObj(split), replacer) : null};
  }

  /* ---- 读档 ---- */
  function loadGlobal(){
    var st = readRaw(KEY_G);
    if(!st || String(st.ver) !== String(DEMO_DATA_VERSION) || !st.vars || st.partial) return false;
    if(st.st!==1){ gmcStampHospitals(st.vars.HOSPITAL_DATA); stampDirty = true; } /* 旧存档：把现在的内容当作基准盖章 */
    GLOBAL_VAR_NAMES.forEach(function(n){ if(st.vars.hasOwnProperty(n)) assignInPlace(n, st.vars[n]); });
    return true;
  }
  function loadClinic(cid){
    var st = readRaw(keyC(cid));
    if(!st || String(st.ver) !== String(DEMO_DATA_VERSION) || !st.vars || st.partial || !st.vars.CASE_ITEMS) return false;
    if(st.st!==1){ gmcStampVars(st.vars); stampDirty = true; }
    CLINIC_VAR_NAMES.forEach(function(n){ if(n!=='PROJECT_LIBRARY' && n!=='LIB_CASES' && n!=='PROJECT_CATEGORIES' && st.vars.hasOwnProperty(n)) assignInPlace(n, st.vars[n]); });
    buildClinicViews(st.vars.PROJECT_LIBRARY || [], st.vars.LIB_CASES || [], st.vars.PROJECT_CATEGORIES || {});
    return true;
  }
  function afterLoad(){
    if(typeof ensureSeedAccounts === 'function') ensureSeedAccounts(); /* 新增的种子账号补进保留下来的账号里 */
    if(typeof normClientNames === 'function') try{ normClientNames(); }catch(e){} /* 旧客户资料补上名 / 姓两栏 */
    ME_NAME = (currentAccount() || {name:''}).name || ''; /* 账号改过名字（个人设定/激活）后，名字要跟存档走 */
    if(typeof syncInCoordinators === 'function') syncInCoordinators(); /* IN 室长名单由账号算出，不存档 */
    if(typeof applyClinicSettings === 'function') applyClinicSettings(); /* 日历行/时区等由诊所设定派生，不存档 */
    if(typeof markDemoCases === 'function') markDemoCases(); /* 旧存档里的演示案件补上 demo 标记 */
    var snap = snapshot(); lastG = snap.g; lastC = snap.c;
    if(stampDirty){ stampDirty = false; lastG = ''; lastC = ''; setTimeout(function(){ save(); }, 300); } /* 刚盖的章要存下去 */
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
      if(snap.g !== lastG){ writeKey(KEY_G, '{"ver":'+DEMO_DATA_VERSION+',"t":'+Date.now()+',"st":1,"vars":'+snap.g+'}'); lastG = snap.g; }
      if(snap.c !== null && snap.c !== lastC){ writeKey(keyC(pageClinic()), '{"ver":'+DEMO_DATA_VERSION+',"t":'+Date.now()+',"st":1,"vars":'+snap.c+'}'); lastC = snap.c; }
    }catch(e){
      console.warn('[存档] localStorage 容量超限，演示数据已重置，此页面之后的操作不再保存', e);
      disabled = true;
      try{ Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_state')===0 || k.indexOf('gmc_clinic_')===0; }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e2){}
      notice('演示数据过大，已重置（这个页面之后的操作不再保存，刷新页面可恢复演示数据）');
    }
  }
  function touch(){ clearTimeout(touch._t); touch._t = setTimeout(save, 60); }

  /* ---- 启动：补齐缺的存档（第一次打开 / 版本号重置后只保留了账号和诊所设定 / 新增了诊所） ---- */
  function demoMarked(vars){ try{ (vars.CASE_ITEMS||[]).forEach(function(c){ c.demo = true; }); gmcFillKrMeta(vars.CASE_ITEMS); }catch(e){} return vars; } /* 其他诊所的种子案件也标记为演示（CMD-1012-06 补） */
  function init(){
    var keepClinic = CURRENT_CLINIC_ID;
    CURRENT_CLINIC_ID = 'C1'; /* 此刻全局变量里还是 C1 的演示数据种子 */
    try{
      var g = readRaw(KEY_G);
      if(!g || String(g.ver) !== String(DEMO_DATA_VERSION) || g.partial){
        if(g && g.partial && g.vars) Object.keys(g.vars).forEach(function(n){ window[n] = g.vars[n]; }); /* 版本重置时保留的账号等 */
        if(typeof ensureSeedAccounts === 'function') ensureSeedAccounts();
        var snapC1 = null;
        CLINICS.forEach(function(cl){ /* 先写诊所分区（viewSplit 会把 KR 项拆回医院，全局部分要在它之后序列化） */
          var p = readRaw(keyC(cl.id));
          if(p && String(p.ver)===String(DEMO_DATA_VERSION) && !p.partial && p.vars && p.vars.CASE_ITEMS) return;
          var vars;
          if(cl.id==='C1'){ var split = viewSplit(); vars = clinicVarsObj(split); try{ gmcFillKrMeta(vars.CASE_ITEMS); }catch(e){} }
          else vars = demoMarked(buildClinicSeed(cl.id));
          if(p && p.vars) Object.keys(p.vars).forEach(function(n){ vars[n] = p.vars[n]; }); /* 版本重置时保留的诊所设定等 */
          gmcStampVars(vars);
          writeKey(keyC(cl.id), wrap(vars));
        });
        gmcStampHospitals(HOSPITAL_DATA);
        writeKey(KEY_G, wrap(pick(GLOBAL_VAR_NAMES)));
      } else {
        CLINICS.forEach(function(cl){ /* 全局在、某个诊所分区缺（或只剩保留下来的部分）→ 补齐这个分区 */
          var p = readRaw(keyC(cl.id));
          if(p && String(p.ver)===String(DEMO_DATA_VERSION) && !p.partial && p.vars && p.vars.CASE_ITEMS) return;
          var vars = (cl.id==='C1') ? clinicVarsObj(viewSplit()) : demoMarked(buildClinicSeed(cl.id));
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

  /* 临时把某家诊所的分区数据换进全局变量里执行 fn（KR 端借用 IN 端的状态/显示/业务函数处理别家诊所的案件）：
     换进去的有：诊所分区变量、CURRENT_CLINIC_ID、IN_COORDINATORS、按该诊所对接医院合成的项目库/案例库/分类；fn 返回后全部还原。
     withClinic 只读；要改数据用 mutateClinic（改完写回该诊所的分区，该诊所的分页即时同步） */
  function enter(vars, cid){
    var ctx = {saved:{}, keepCid:CURRENT_CLINIC_ID, keepIn:IN_COORDINATORS.slice(), keepPL:PROJECT_LIBRARY.slice(), keepLC:LIB_CASES.slice(), keepCats:Object.assign({}, PROJECT_CATEGORIES), keepPCAT:Object.assign({}, PCAT)};
    CLINIC_VAR_NAMES.forEach(function(n){
      if(n==='PROJECT_LIBRARY' || n==='LIB_CASES' || n==='PROJECT_CATEGORIES') return; /* 这三个是"诊所+医院"合成数组，下面按该诊所重新合成 */
      if(vars.hasOwnProperty(n)){ ctx.saved[n] = window[n]; window[n] = vars[n]; }
    });
    CURRENT_CLINIC_ID = cid;
    try{ buildClinicViews(vars.PROJECT_LIBRARY || [], vars.LIB_CASES || [], vars.PROJECT_CATEGORIES || null); }catch(e){ console.warn('[withClinic] 合成项目库失败', e); }
    try{ syncInCoordinators(); }catch(e){}
    return ctx;
  }
  function leave(ctx, vars, writeBack){
    Object.keys(ctx.saved).forEach(function(n){ if(writeBack) vars[n] = window[n]; window[n] = ctx.saved[n]; });
    CURRENT_CLINIC_ID = ctx.keepCid;
    PROJECT_LIBRARY.length = 0; Array.prototype.push.apply(PROJECT_LIBRARY, ctx.keepPL);
    LIB_CASES.length = 0; Array.prototype.push.apply(LIB_CASES, ctx.keepLC);
    Object.keys(PROJECT_CATEGORIES).forEach(function(k){ delete PROJECT_CATEGORIES[k]; }); Object.assign(PROJECT_CATEGORIES, ctx.keepCats);
    Object.keys(PCAT).forEach(function(k){ delete PCAT[k]; }); Object.assign(PCAT, ctx.keepPCAT);
    IN_COORDINATORS.length = 0; Array.prototype.push.apply(IN_COORDINATORS, ctx.keepIn);
  }
  function withClinic(cid, fn){
    var vars = readClinic(cid); if(!vars) return undefined;
    var ctx = enter(vars, cid);
    try{ return fn(vars); } finally{ leave(ctx, vars, false); }
  }
  function mutateClinic(cid, fn){
    var p = readRaw(keyC(cid)); if(!p || !p.vars) return undefined;
    var ctx = enter(p.vars, cid), out;
    try{ out = fn(p.vars); } finally{ leave(ctx, p.vars, true); }
    try{ writeKey(keyC(cid), JSON.stringify(p, replacer)); }catch(e){ console.warn('[存档] 跨诊所写入失败', e); }
    return out;
  }

  /* 联动刷新的"不打断"规则（2026-10-07）：别的标签页写入后，数据立即重读，但画面重画要等——① 有弹窗打开（.modal-overlay.open / 预览抽屉）；② 正在输入（聚焦在输入框/文本框/下拉里，聊天输入框除外，因为聊天要实时收消息）。
     等到弹窗关了、输入框失焦再重画；重画前后保留滚动位置（窗口、.content、周视图、聊天窗口）。当前所在页面/案件/tab 不变（重画只刷新当前页面）。 */
  var SCROLL_SEL = '.content, .wk-scroll, .float-body, .drawer-list';
  function refreshBusy(){
    if(document.querySelector('.modal-overlay.open, .peek-overlay.open')) return true;
    var el = document.activeElement; if(!el || el===document.body) return false;
    var tag = (el.tagName||'').toLowerCase(), editable = tag==='input' || tag==='textarea' || tag==='select' || el.isContentEditable;
    if(!editable) return false;
    if(el.type==='checkbox' || el.type==='radio' || el.type==='button' || el.type==='file') return false;
    if(el.id==='float-input-box' || el.id==='kr-chat-in' || (el.closest && el.closest('#chat-float-overlay, #chat-drawer, #kr-chat'))) return false;
    return true;
  }
  function scrollSnap(){ var arr = []; Array.prototype.forEach.call(document.querySelectorAll(SCROLL_SEL), function(e, i){ arr.push([i, e.scrollTop]); }); return {y:window.scrollY, els:arr}; }
  function scrollBack(sn){ try{ var all = document.querySelectorAll(SCROLL_SEL); sn.els.forEach(function(p){ if(all[p[0]]) all[p[0]].scrollTop = p[1]; }); window.scrollTo(0, sn.y); }catch(e){} }
  var pendingRefresh = null, pendingTimer = null;
  function safeRefresh(fn){
    if(refreshBusy()){
      pendingRefresh = fn; /* 数据已读进来，画面等一等；只记最新一次 */
      if(!pendingTimer) pendingTimer = setInterval(function(){ if(refreshBusy()) return; clearInterval(pendingTimer); pendingTimer = null; var f = pendingRefresh; pendingRefresh = null; if(f) safeRefresh(f); }, 500);
      return;
    }
    var sn = scrollSnap(); try{ fn(); }catch(e){ console.error('[联动刷新]', e); } scrollBack(sn);
  }

  /* 后台标签页的定时器会被浏览器降速：弹窗关闭 / 输入框失焦 / 切回本标签页时也立即补一次延后的重画 */
  function flushPending(){ if(!pendingRefresh || refreshBusy()) return; if(pendingTimer){ clearInterval(pendingTimer); pendingTimer = null; } var f = pendingRefresh; pendingRefresh = null; safeRefresh(f); }
  ['click', 'focusout', 'keyup', 'visibilitychange'].forEach(function(t){ document.addEventListener(t, function(){ setTimeout(flushPending, 60); }, true); });
  window.addEventListener('focus', function(){ setTimeout(flushPending, 60); });

  /* 其他标签页存了新数据：只重读和自己相关的部分 + 重画 */
  window.addEventListener('storage', function(e){
    if(e.key === null || e.key === 'gmc_demo_ver'){ location.reload(); return; } /* 别的标签页重置了演示数据 → 本页也刷新 */
    var cid = pageClinic();
    var tick = function(){ if(typeof remoteNotifTick === 'function') try{ remoteNotifTick(); }catch(err){} }; /* 通知弹出不能等画面重画：正在输入 / 有弹窗时画面会延后，但新通知必须马上弹（CMD-1012-08 第 0 条） */
    if(e.key === KEY_G && e.newValue){
      if(loadGlobal()){
        if(cid){ /* 医院资料变了：合成数组按新的医院资料重建（IN 项保持不变） */
          var inCats = {}; Object.keys(PROJECT_CATEGORIES).forEach(function(k){ if(PROJECT_CATEGORIES[k].origin!=='KR') inCats[k] = PROJECT_CATEGORIES[k]; });
          buildClinicViews(PROJECT_LIBRARY.filter(function(p){ return p.origin!=='KR'; }), LIB_CASES.filter(function(c){ return c.source!=='travel'; }), inCats);
        }
        afterLoad(); tick();
        if(window.GUARD_ROLES && !guardPage(window.GUARD_ROLES)) return; /* 本账号被停用/重置：回登录页 */
        if(typeof refreshView === 'function') safeRefresh(refreshView);
      }
    } else if(!cid && e.key && e.key.indexOf('gmc_clinic_')===0 && e.newValue){ /* KR 页面没有自己的诊所：任何对接诊所的分区变了都要重画 */
      tick(); if(typeof krRefreshAll === 'function') safeRefresh(krRefreshAll);
    } else if(cid && e.key === keyC(cid) && e.newValue){
      if(loadClinic(cid)){ afterLoad(); tick(); if(typeof refreshView === 'function') safeRefresh(refreshView); }
    }
  });
  /* ---- 数据升级 / 重置后：把提取出来的用户案件合并回新种子，并按「旧版本 → 新版本」迁移（CMD-1012-09） ---- */
  var OLD_LOCAL_NAME_MAP = { /* 36 → 37：本地项目换成清单项目（旧名称 → [新名称, 规格]） */
    '好莱坞焕肤 1次':['LHALa peel','1次'], 'Genesis焕肤（Clarity II）1次':['艺人水光焕肤','1次'], '巴西式脱毛 + 焕肤护理':['黑米醋换肤','1次'], '比基尼线脱毛 + 焕肤护理':['基础祛痘管理','1次'],
    'XERF提升 300发':['索夫波 Sofwave','300发'], 'Onda提升 60kj':['ONDA 提升','脸部 60kj·1次'], '术后消肿护理 1次':['LDM','6分钟·1次'], '术后疤痕修复护理 1次':['补水超声波管理','1次'],
    'V-RO超声波 300发 + 高频率 3000发':['美版超声刀二代','300发'], '干细胞30皮肤注射 / 脱发治疗注射':['干细胞皮肤注射（手打）','3cc·1次'], '丽珠兰黑盒 + LiliedM 水光注射（2cc）':['丽珠兰黑盒（手打）','2cc·1次'],
    '乔雅露蓝瓶 Juvelook Skin（3cc）':['婴儿针','1cc Auto MTS'], '黄金微针 毛孔探头':['黄金微针 面部整体（含镇静面膜）','1次'], '玻尿酸填充 1cc（泗水）':['丽珠兰 S（手打）','1cc·1次'], '水光注射 2cc（泗水）':['丽珠兰黑盒（手打）','2cc·1次'], '好莱坞焕肤 1次（泗水）':['LHALa peel','1次'], '黄金微针 1次（泗水）':['黄金微针 面部整体（含镇静面膜）','1次']
  };
  /* 每次升级写一个迁移步骤：to = 迁移到的版本；fn(case, ctx) 补齐新增字段的默认值 / 替换旧引用；ctx.fromVer 是升级前版本，ctx.note(text) 记一条备注 */
  var MIGRATIONS = [
    {to:37, fn:function(c, ctx){ /* 本地项目 → 清单项目 */
      var libIn = ctx.libIn;
      var fix = function(it){
        if(!it || it.origin!=='IN' || it.specId!==undefined) return;
        var m = OLD_LOCAL_NAME_MAP[it.name], p = libIn.filter(function(x){ return x.name===(m ? m[0] : it.name); })[0];
        if(!p){ it.migrateNote = '项目已不在项目库'; ctx.note('项目「'+it.name+'」已不在项目库，保留原名称'); return; }
        var sp = (m && (p.specs||[]).filter(function(x){ return x.label===m[1]; })[0]) || (p.specs||[])[0];
        if(m) it.name = p.name; it.projectId = p.id; it.specId = sp ? sp.id : ''; it.specLabel = sp ? sp.label : ''; it.specTimes = sp ? sp.times : 1;
        if(it.key && /^p\d+$/.test(it.key)) it.key = p.id;
      };
      (c.recommended||[]).forEach(fix); (c.procedureItems||[]).forEach(fix); ((c.localMgmt && c.localMgmt.cart)||[]).forEach(fix);
      (c.settlementBatches||[]).forEach(function(b){ (b.inItems||[]).forEach(function(it){ var m = OLD_LOCAL_NAME_MAP[it.name]; if(it.specLabel===undefined){ if(m){ it.name = m[0]; it.specLabel = m[1]; } it.specLabel = it.specLabel||''; it.specTimes = it.specTimes||1; } }); });
      var rn = function(u){ var m = u && OLD_LOCAL_NAME_MAP[u.itemName]; if(m) u.itemName = m[0]; };
      (c.mgmtUses||[]).forEach(rn); ((c.localMgmt && c.localMgmt.mgmtUses)||[]).forEach(rn);
      (c.intentionProjects||[]).forEach(function(it){ var m = OLD_LOCAL_NAME_MAP[it.name], p = libIn.concat(ctx.libKr).filter(function(x){ return x.name===(m ? m[0] : it.name) && x.origin===it.origin; })[0]; if(p){ it.name = p.name; it.projectId = p.id; } });
    }},
    {to:38, fn:function(c, ctx){ /* 「使用时选」选项按规格分组：案件里没有存选项，无需改动 */ }},
    {to:39, fn:function(c, ctx){ /* 演示案件补推荐在韩 / 麻醉 / 术后管理：用户案件的项目本来就带资料，无需改动 */ }},
    {to:40, fn:function(c, ctx){ /* 同上（补全剩余演示项目的默认资料），无需改动 */ }},
    {to:41, fn:function(c, ctx){ /* 「消肿管理」改名「术后管理」；意向项目只留赴韩手术项目 */
      var fixPc = function(arr){ (arr||[]).forEach(function(x){ if(x && x.mgmt==='消肿管理') x.mgmt = '术后管理'; }); };
      (c.procedureItems||[]).forEach(function(it){ fixPc(it.postcare); });
      ((c.krScope||{}).items||[]).forEach(function(it){ fixPc(it.postcare); });
      if((c.intentionProjects||[]).length){ var n0 = c.intentionProjects.length; c.intentionProjects = c.intentionProjects.filter(function(it){ return it.origin==='KR' && ['术后消肿管理','消肿管理','术后管理','拆线','术后复诊检查','术后复诊','伤口护理'].indexOf(it.name)<0; }); if(c.intentionProjects.length!==n0) ctx.note('意向项目只留赴韩手术项目，已去掉 '+(n0-c.intentionProjects.length)+' 个本地 / 术后管理项目'); }
    }}
  ];
  function migrateHoldings(hs, fromVer, libIn){
    if(fromVer >= 37) return;
    Object.keys(hs).forEach(function(n){ (hs[n]||[]).forEach(function(h){
      var m = OLD_LOCAL_NAME_MAP[h.itemName]; if(!m) return;
      var p = libIn.filter(function(x){ return x.name===m[0]; })[0]; h.itemName = m[0];
      (h.batches||[]).forEach(function(b){ if(!b.spec) b.spec = m[1]; });
    }); });
  }
  /* 用户改过 / 新增的设定资料合并回新种子（CMD-1012-09 补）：项目（按名称对上种子项目就覆盖字段，对不上就新增；新增的 id 加 u 前缀避免撞号，案件 / 活动价 / 套餐里的引用同步改）、案例、活动价、套餐、memo */
  function cfgRemap(obj, idMap){
    if(!obj || typeof obj !== 'object') return;
    if(Array.isArray(obj)){ obj.forEach(function(x){ cfgRemap(x, idMap); }); return; }
    Object.keys(obj).forEach(function(k){
      var v = obj[k];
      if((k==='projectId' || k==='key') && typeof v === 'string' && idMap[v]) obj[k] = idMap[v];
      else if(k==='projectIds' && Array.isArray(v)) obj[k] = v.map(function(x){ return idMap[x] || x; });
      else if(v && typeof v === 'object') cfgRemap(v, idMap);
    });
  }
  function cfgCat(cats, oldId, srcCats, extraList){
    if(!oldId) return oldId;
    if(cats[oldId] && srcCats[oldId] && cats[oldId].label===srcCats[oldId].label) return oldId;
    var src = srcCats[oldId]; if(!src) return cats[oldId] ? oldId : oldId;
    var hit = Object.keys(cats).filter(function(k){ return cats[k].label===src.label && cats[k].origin===src.origin; })[0];
    if(hit) return hit;
    var nid = 'u' + oldId; cats[nid] = Object.assign({}, src, {id:nid}); return nid;
  }
  function cfgMergeProjects(target, carried, cats, srcCats, idMap, noteFn){
    carried.forEach(function(p){
      delete p._h;
      p.categoryId = cfgCat(cats, p.categoryId, srcCats || {});
      var ex = target.filter(function(x){ return x.name===p.name && x.origin===p.origin && (x.hospitalId||'')===(p.hospitalId||'') && (x.clinicId||'')===(p.clinicId||''); })[0];
      if(ex){ var id = ex.id; Object.keys(p).forEach(function(k){ if(k!=='id' && k!=='categoryId') ex[k] = p[k]; }); ex.id = id; ex.categoryId = ex.categoryId || p.categoryId; if(p.id !== id) idMap[p.id] = id; noteFn('更新项目「'+p.name+'」'); }
      else { var nid = 'u' + p.id; idMap[p.id] = nid; p.id = nid; target.push(p); noteFn('新增项目「'+p.name+'」'); }
    });
  }
  function cfgMergeById(target, carried, idPrefix, noteFn, label){
    carried.forEach(function(x){ delete x._h; var i = target.findIndex(function(y){ return y.id===x.id; });
      if(i > -1){ target[i] = x; noteFn('更新'+label); } else { if(idPrefix && target.some(function(y){ return y.id===x.id; })) x.id = idPrefix + x.id; target.push(x); noteFn('新增'+label); } });
  }
  function carryRestore(){
    var raw = null; try{ raw = localStorage.getItem('gmc_cfg_carry'); }catch(e){} if(!raw) return;
    var carry = null; try{ carry = JSON.parse(raw); }catch(e){}
    var report = {from:carry && carry.from, to:DEMO_DATA_VERSION, at:new Date().toISOString(), migrated:0, failed:[], notes:[]};
    if(!carry || !carry.clinics){ try{ localStorage.removeItem('gmc_cfg_carry'); }catch(e){} return; }
    var fromVer = parseInt(carry.from, 10) || 0, g = readRaw(KEY_G), idMap = {};
    Object.keys(carry.clinics).forEach(function(cid){
      var cc = carry.clinics[cid], p = readRaw(keyC(cid));
      if(!p || !p.vars){ cc.cases.forEach(function(c){ report.failed.push({caseNo:c.caseNo, name:c.name, reason:'诊所分区 '+cid+' 不存在'}); }); return; }
      var v = p.vars; v.CASE_ITEMS = v.CASE_ITEMS || []; v.CLIENTS = v.CLIENTS || []; v.CLIENT_HOLDINGS = v.CLIENT_HOLDINGS || {}; v.NOTIFS = v.NOTIFS || []; v.ROOMS = v.ROOMS || []; v.CHAT_DATA = v.CHAT_DATA || {};
      var libIn = (v.PROJECT_LIBRARY || []).filter(function(x){ return x.origin==='IN'; }), libKr = [];
      Object.keys((g && g.vars && g.vars.HOSPITAL_DATA) || {}).forEach(function(hid){ libKr = libKr.concat(g.vars.HOSPITAL_DATA[hid].projects || []); });
      var ctx = {fromVer:fromVer, libIn:libIn, libKr:libKr, note:null};
      /* 通知换新 id（旧 id 会和新种子的通知撞）；案件里引用旧通知 id 的字段同步改 */
      var nmap = {}; var seq = v.NOTIF_SEQ || 0;
      cc.notifs.forEach(function(n){ var nid = 'n'+(++seq); nmap[n.id] = nid; n.id = nid; });
      v.NOTIF_SEQ = seq; Array.prototype.unshift.apply(v.NOTIFS, cc.notifs);
      var cfg = (carry.cfg || {})[cid], cfgIdMap = {}, cfgNotes = [];
      if(cfg){
        var cn = function(t){ cfgNotes.push(t); }, cats = v.PROJECT_CATEGORIES = v.PROJECT_CATEGORIES || {};
        if(cfg.PROJECT_LIBRARY) cfgMergeProjects(v.PROJECT_LIBRARY = v.PROJECT_LIBRARY || [], cfg.PROJECT_LIBRARY, cats, cfg.cats, cfgIdMap, cn);
        ['LIB_CASES','PROMOS','PACKAGES','CAL_MEMOS'].forEach(function(ln){
          if(!cfg[ln]) return; cfgRemap(cfg[ln], cfgIdMap);
          cfgMergeById(v[ln] = v[ln] || [], cfg[ln], ln==='LIB_CASES' ? 'u' : '', cn, ({LIB_CASES:'案例',PROMOS:'活动价',PACKAGES:'套餐',CAL_MEMOS:'日历 memo'})[ln]);
        });
        cc.cases.forEach(function(c){ cfgRemap(c, cfgIdMap); });
        report.cfg = (report.cfg || 0) + cfgNotes.length;
      }
      cc.cases.forEach(function(c){
        var notes = []; ctx.note = function(t){ notes.push(t); };
        try{
          if(c.cancelNotifId && nmap[c.cancelNotifId]) c.cancelNotifId = nmap[c.cancelNotifId];
          MIGRATIONS.forEach(function(m){ if(m.to > fromVer) m.fn(c, ctx); });
          if(notes.length){ c.migrationNotes = (c.migrationNotes||[]).concat(notes.map(function(t){ return '数据升级 '+carry.from+' → '+DEMO_DATA_VERSION+'：'+t; })); report.notes.push({caseNo:c.caseNo, name:c.name, notes:notes}); }
          if(v.CASE_ITEMS.some(function(x){ return x.id===c.id; })) throw new Error('案件 id 与新种子重复');
          v.CASE_ITEMS.push(c); report.migrated++;
        }catch(e){ report.failed.push({caseNo:c.caseNo, name:c.name, reason:String(e && e.message || e)}); }
      });
      /* 客人：新种子里已有同手机号 / 同名的就合并（时间线、同意记录、医美史补进去），没有就加进去 */
      cc.clients.forEach(function(cl){
        var ex = v.CLIENTS.filter(function(x){ return (cl.phone && x.phone===cl.phone) || x.name===cl.name; })[0];
        if(!ex){ v.CLIENTS.push(cl); return; }
        var has = function(arr, f){ return arr.some(f); };
        (cl.timeline||[]).forEach(function(t){ ex.timeline = ex.timeline||[]; if(!has(ex.timeline, function(y){ return y.dt===t.dt && y.action===t.action; })) ex.timeline.push(t); });
        (cl.consents||[]).forEach(function(t){ ex.consents = ex.consents||[]; if(!has(ex.consents, function(y){ return y.ts===t.ts; })) ex.consents.push(t); });
        (cl.beautyRecords||[]).forEach(function(t){ ex.beautyRecords = ex.beautyRecords||[]; if(!has(ex.beautyRecords, function(y){ return y.id===t.id; })) ex.beautyRecords.push(t); });
      });
      migrateHoldings(cc.holdings, fromVer, libIn);
      Object.keys(cc.holdings).forEach(function(n){
        var cur = v.CLIENT_HOLDINGS[n] = v.CLIENT_HOLDINGS[n] || [];
        (cc.holdings[n]||[]).forEach(function(h){ var ex = cur.filter(function(x){ return x.itemName===h.itemName; })[0]; if(ex) ex.batches = (ex.batches||[]).concat(h.batches||[]); else cur.push(h); });
      });
      cc.rooms.forEach(function(r){ if(!v.ROOMS.some(function(x){ return x.id===r.id; })) v.ROOMS.push(r); });
      Object.keys(cc.chat).forEach(function(rid){ v.CHAT_DATA[rid] = cc.chat[rid]; });
      v.SMS_LOG = (v.SMS_LOG || []).concat(cc.sms || []);
      writeKey(keyC(cid), JSON.stringify(p, replacer));
    });
    /* 全局：案件编号接着往后排；KR 侧的通知 / 院长日程块 / 录入仓库 */
    if(g && g.vars){
      g.vars.CASE_NO_SEQ = Math.max(g.vars.CASE_NO_SEQ || 0, (carry.seq || 0) + 1);
      var hd = g.vars.HOSPITAL_DATA || {};
      Object.keys(carry.cfgH || {}).forEach(function(hid){
        var o = carry.cfgH[hid], h = hd[hid]; if(!h) return; var idMap = {}, cats = g.vars.KR_CATEGORIES = g.vars.KR_CATEGORIES || {}, cn = function(){ report.cfg = (report.cfg || 0) + 1; };
        if(o.projects) cfgMergeProjects(h.projects = h.projects || [], o.projects, cats, o.cats, idMap, cn);
        if(o.localLib) cfgMergeProjects(h.localLib = h.localLib || [], o.localLib, cats, o.cats, idMap, cn);
        if(o.libCases){ cfgRemap(o.libCases, idMap); cfgMergeById(h.libCases = h.libCases || [], o.libCases, 'u', cn, '赴韩案例'); }
      });
      Object.keys(carry.hospitals || {}).forEach(function(hid){
        var o = carry.hospitals[hid], h = hd[hid]; if(!h) return;
        h.notifs = (o.notifs || []).concat(h.notifs || []);
        h.directorSchedule = h.directorSchedule || {};
        Object.keys(o.sched || {}).forEach(function(dn){ var arr = h.directorSchedule[dn] = h.directorSchedule[dn] || []; o.sched[dn].forEach(function(b){ b.id = 'sbc'+Date.now()+Math.floor(Math.random()*1000); arr.push(b); }); });
        h.vault = h.vault || {}; Object.keys(o.vault || {}).forEach(function(vk){ h.vault[vk] = o.vault[vk]; });
      });
      writeKey(KEY_G, JSON.stringify(g, replacer));
    }
    try{ localStorage.setItem('gmc_cfg_migration', JSON.stringify(report)); localStorage.removeItem('gmc_cfg_carry'); }catch(e){}
  }

  /* 操作之后（点击、输入、选择、键盘）稍后存档；另外每 2 秒兜底一次；页面离开/隐藏时再存一次 */
  ['click', 'change', 'input', 'keyup', 'submit', 'drop'].forEach(function(t){ document.addEventListener(t, touch, true); });
  setInterval(save, 2000);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function(){ if(document.hidden) save(); });

  init();
  try{ carryRestore(); }catch(e){ console.warn('[迁移] 合并用户案件失败', e); try{ localStorage.setItem('gmc_cfg_migration', JSON.stringify({from:null, to:DEMO_DATA_VERSION, at:new Date().toISOString(), migrated:0, failed:[{caseNo:'（全部）', name:'', reason:'合并出错：'+e.message+'（旧数据在自动备份里）'}]})); }catch(e2){} }
  if(!load()){ /* 读不出来（极少见：存档损坏）就用刚生成的种子重新写一遍 */
    try{ Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_state')===0 || k.indexOf('gmc_clinic_')===0; }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e){}
    init(); load();
  }
  return {save:save, load:load, touch:touch, readClinic:readClinic, updateClinic:updateClinic, withClinic:withClinic, mutateClinic:mutateClinic, isDisabled:function(){ return disabled; }};
})();

/* 重置演示数据：清掉所有 gmc_ 开头的存档，其他标签页收到通知后也会刷新 */
function resetDemoData(){
  gmcResetAll('手动重置演示数据'); /* 先自动备份再清（CMD-1012-06） */
  location.reload();
}

/* 页面守卫（2026-10-05·三）：没登录 → 登录页；角色不对 → 回自己的首页。roles = 允许进入的角色列表 */
function guardPage(roles){
  var a = currentAccount();
  if(!a){ location.replace('/login.html'); return false; }
  if(roles.indexOf(a.role) < 0){ location.replace(homeUrl(a)); return false; }
  return true;
}
