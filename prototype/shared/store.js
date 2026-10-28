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
  var lastDiskG = null, lastDiskC = null; /* CMD-1028-05：本页上次读 / 写时磁盘上的原文；写之前发现磁盘上的原文变了 = 别的分页写过，先合并再写，不能整份覆盖 */
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
  function readRaw(key){ try{ var r = localStorage.getItem(key); return r ? JSON.parse(r, reviver) : null; }catch(e){ (window.GMC_RAW_CORRUPT = window.GMC_RAW_CORRUPT || {})[key] = true; return null; } } /* CMD-1022-12：存档读得到字符串但解析失败 = 损坏，记下来，init() 不能拿种子覆盖它 */
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
  function applyGlobalVars(vars){ GLOBAL_VAR_NAMES.forEach(function(n){ if(vars.hasOwnProperty(n)) assignInPlace(n, vars[n]); }); }
  function applyClinicVars(vars){
    CLINIC_VAR_NAMES.forEach(function(n){ if(n!=='PROJECT_LIBRARY' && n!=='LIB_CASES' && n!=='PROJECT_CATEGORIES' && vars.hasOwnProperty(n)) assignInPlace(n, vars[n]); });
    buildClinicViews(vars.PROJECT_LIBRARY || [], vars.LIB_CASES || [], vars.PROJECT_CATEGORIES || {});
  }
  function loadGlobal(){
    var st = readRaw(KEY_G);
    if(!st || String(st.ver) !== String(DEMO_DATA_VERSION) || !st.vars || st.partial) return false;
    if(st.st!==1){ gmcStampHospitals(st.vars.HOSPITAL_DATA); stampDirty = true; } /* 旧存档：把现在的内容当作基准盖章 */
    applyGlobalVars(st.vars);
    try{ lastDiskG = localStorage.getItem(KEY_G); }catch(e){}
    return true;
  }
  function loadClinic(cid){
    var st = readRaw(keyC(cid));
    if(!st || String(st.ver) !== String(DEMO_DATA_VERSION) || !st.vars || st.partial || !st.vars.CASE_ITEMS) return false;
    if(st.st!==1){ gmcStampVars(st.vars); stampDirty = true; }
    applyClinicVars(st.vars);
    if(cid === pageClinic()){ try{ lastDiskC = localStorage.getItem(keyC(cid)); }catch(e){} }
    return true;
  }

  /* ---- CMD-1028-05：多分页「旧资料覆盖新资料」——存档合并 ----
     原来：每个分页写的是「自己内存里的整份诊所分区」，最后写的赢。分页 A 读档后，分页 B（比如 KR 室长发送了复诊评估结果）写进新内容；A 的 storage 事件还没处理（或 A 里正好有未存的改动）时 A 存档，A 内存里的旧状态把 B 写的新内容整份盖掉。
     现在：写之前比较磁盘原文和「本页上次读 / 写时的原文」，不一样 = 别的分页写过 → 三方合并（base = 本页上次同步时的内容，ours = 本页现在的内容，theirs = 磁盘上现在的内容）：
       本页没改的地方用别人的，别人没改的地方用本页的，两边都改了同一处才以本页（刚操作的人）为准；有 id 的数组（案件、客户…）按 id 逐条合并，别人新增的案件不会被删，没有 id 的数组（Timeline 等）取并集。
     正式版由后端的版本号 / 事务处理，这里只是原型的本地存档方案。 */
  function jeq(a, b){ return a === b || JSON.stringify(a) === JSON.stringify(b); }
  function isObj(x){ return x && typeof x === 'object' && !Array.isArray(x); }
  function hasId(arr){ return arr.every(function(e){ return isObj(e) && (typeof e.id === 'string' || typeof e.id === 'number'); }); }
  function mergeNode(b, o, t){
    if(jeq(o, b)) return t;             /* 本页没改 → 用别人的 */
    if(jeq(t, b)) return o;             /* 别人没改 → 用本页的 */
    if(jeq(o, t)) return o;
    if(isObj(o) && isObj(t)){
      var bb = isObj(b) ? b : {}, r = {}, keys = {};
      Object.keys(t).concat(Object.keys(o)).forEach(function(k){ keys[k] = 1; });
      Object.keys(keys).forEach(function(k){
        var hb = bb.hasOwnProperty(k), ho = o.hasOwnProperty(k), ht = t.hasOwnProperty(k);
        if(ho && ht){ r[k] = mergeNode(bb[k], o[k], t[k]); }
        else if(ho){ if(hb && jeq(o[k], bb[k])) return; r[k] = o[k]; }       /* 别人删了：本页没改过才跟着删 */
        else if(ht){ if(hb && jeq(t[k], bb[k])) return; r[k] = t[k]; }       /* 本页删了：别人没改过才跟着删 */
      });
      return r;
    }
    if(Array.isArray(o) && Array.isArray(t)){
      var ba = Array.isArray(b) ? b : [];
      if(hasId(o) && hasId(t) && hasId(ba)){
        var bm = {}, om = {}, tm = {}; ba.forEach(function(e){ bm[e.id] = e; }); o.forEach(function(e){ om[e.id] = e; }); t.forEach(function(e){ tm[e.id] = e; });
        var out = [];
        t.forEach(function(e){
          var id = e.id;
          if(om.hasOwnProperty(id)) out.push(mergeNode(bm[id], om[id], e));
          else if(bm.hasOwnProperty(id) && jeq(e, bm[id])) return;            /* 本页删了、别人没改 → 删 */
          else out.push(e);                                                    /* 别人新增 / 别人改过 → 留 */
        });
        o.forEach(function(e){
          var id = e.id;
          if(tm.hasOwnProperty(id)) return;
          if(bm.hasOwnProperty(id) && jeq(e, bm[id])) return;                 /* 别人删了、本页没改 → 删 */
          out.push(e);                                                         /* 本页新增 / 本页改过 → 留 */
        });
        return out;
      }
      var seen = {}; ba.concat(t).forEach(function(e){ seen[JSON.stringify(e)] = 1; });
      var res = t.slice(); o.forEach(function(e){ var k = JSON.stringify(e); if(!seen[k]){ seen[k] = 1; res.push(e); } });  /* 没有 id 的数组：别人的 + 本页新增的 */
      return res;
    }
    return o;                            /* 两边都改了同一个值：以本页为准 */
  }
  window.GMC_MERGE_LOG = window.GMC_MERGE_LOG || [];
  /* 把磁盘上的内容（theirs）合并进本页：返回合并后的 vars（字符串 JSON 已按存档形态），失败返回 null */
  function mergeDisk(kind, curRaw, baseStr, oursStr){
    try{
      var st = JSON.parse(curRaw);
      if(!st || String(st.ver) !== String(DEMO_DATA_VERSION) || !st.vars || st.partial) return null;
      var merged = mergeNode(baseStr ? JSON.parse(baseStr) : {}, JSON.parse(oursStr), st.vars);
      window.GMC_MERGE_LOG.push({kind:kind, at:Date.now()}); if(window.GMC_MERGE_LOG.length > 50) window.GMC_MERGE_LOG.shift();
      return JSON.stringify(merged);
    }catch(e){ console.warn('[存档] 合并失败，退回整份写入', e); return null; }
  }
  /* 把合并结果装进内存（clinic / global） */
  function adoptMerged(kind, mergedStr){
    var vars = JSON.parse(mergedStr, reviver);
    if(kind === 'g') applyGlobalVars(vars); else applyClinicVars(vars);
  }
  function afterLoad(){
    if(typeof ensureSeedAccounts === 'function') ensureSeedAccounts(); /* 新增的种子账号补进保留下来的账号里 */
    if(typeof krPartsNormalize === 'function') try{ krPartsNormalize(); }catch(e){ console.warn('[存档] 赴韩项目分类整理失败', e); } /* CMD-1019-06：赴韩项目分类 = 苦恼部位（幂等） */
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
    if(window.GMC_LOAD_PROTECT) return; /* CMD-1022-12：读档失败保护中，不往存档里写任何东西（包括种子） */
    localStorage.setItem(key, json);
  }
  /* ---- 存档：只写变了的部分；写失败（容量超限等）→ 清掉存档，提示并停止存档 ---- */
  /* ---- CMD-1015-05：数据容量（原来写失败就清掉整个存档 → 用户建的案件全没了；现在先腾地方，绝不清用户案件）----
     容量吃在哪里（实测 4.7MB 里）：自动备份 3 份 × 约 1.2MB = 3.7MB（最大头）；诊所 C1 存档 0.7MB（案件 0.5MB，其中案件 Timeline 约 0.16MB）；全局存档 0.18MB（医院数据 0.16MB，其中通知 0.05MB）；其他很小。
     腾地方的顺序：① 删自动备份 / 测试残留键 ② 删最旧的通知 / 短信 / 操作日志 / 对话旧消息 / 演示案件的旧 Timeline ③ 再瘦用户案件的旧 Timeline（只删日志，案件本身一个都不删）。 */
  function totalChars(){ var n = 0, get = window.gmcRawGet || function(k){ return localStorage.getItem(k); }; try{ for(var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); n += k.length + (get(k)||'').length; } }catch(e){} return n; } /* 按压缩后的实际占用算 */
  var SOFT_LIMIT = 3600000, HARD_LIMIT = 4700000; /* 字符数；浏览器上限约 5.24M */
  function dropBackups(all){
    try{ Object.keys(localStorage).filter(function(k){ return /^gmc_backup_\d+$/.test(k); }).sort().slice(0, all ? undefined : -1).forEach(function(k){ localStorage.removeItem(k); }); }catch(e){}
    try{ Object.keys(localStorage).filter(function(k){ return /^(__T|rt_|va_)/.test(k); }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e){}
  }
  function keepLast(arr, n){ if(Array.isArray(arr) && arr.length > n) arr.splice(0, arr.length - n); }
  function pruneLive(level){
    try{ if(typeof NOTIFS!=='undefined') keepLast(NOTIFS, level>=2 ? 60 : 150); }catch(e){}
    try{ if(typeof SMS_LOG!=='undefined') keepLast(SMS_LOG, level>=2 ? 30 : 100); }catch(e){}
    try{ if(typeof ACCOUNT_LOG!=='undefined') keepLast(ACCOUNT_LOG, level>=2 ? 100 : 300); }catch(e){}
    try{ if(typeof CHAT_DATA!=='undefined') Object.keys(CHAT_DATA).forEach(function(r){ keepLast(CHAT_DATA[r], level>=2 ? 60 : 200); }); }catch(e){}
    try{ if(typeof HOSPITAL_DATA!=='undefined') Object.keys(HOSPITAL_DATA).forEach(function(h){ var d = HOSPITAL_DATA[h]; if(d && d.notifs) keepLast(d.notifs, level>=2 ? 60 : 150); }); }catch(e){}
    try{ (typeof CASE_ITEMS!=='undefined' ? CASE_ITEMS : []).forEach(function(c){
      (c.logEntries||[]).forEach(function(l){ if(l.vt) delete l.vt; }); /* 提交时间可以由版本号推出来，不存 */
      var cap = c.demo ? (level>=2 ? 25 : 60) : (level>=3 ? 120 : 400); keepLast(c.logEntries, cap); /* 只删旧 Timeline，案件本身不动 */
    }); }catch(e){}
  }
  function tryWrite(){
    var snap = snapshot(), merged = false;
    /* CMD-1028-05：写之前先看磁盘有没有被别的分页改过（原文和本页上次读 / 写时不一样），改过就合并，不整份覆盖 */
    if(snap.g !== lastG && lastG && lastDiskG !== null){
      var curG = localStorage.getItem(KEY_G);
      if(curG && curG !== lastDiskG){ var mg = mergeDisk('g', curG, lastG, snap.g); if(mg){ adoptMerged('g', mg); merged = true; } }
    }
    if(snap.c !== null && snap.c !== lastC && lastC && lastDiskC !== null){
      var kc = keyC(pageClinic()), curC = localStorage.getItem(kc);
      if(curC && curC !== lastDiskC){ var mc = mergeDisk('c', curC, lastC, snap.c); if(mc){ adoptMerged('c', mc); merged = true; } }
    }
    if(merged) snap = snapshot();
    if(snap.g !== lastG || merged){ writeKey(KEY_G, '{"ver":'+DEMO_DATA_VERSION+',"t":'+Date.now()+',"st":1,"vars":'+snap.g+'}'); lastG = snap.g; try{ lastDiskG = localStorage.getItem(KEY_G); }catch(e){} }
    if(snap.c !== null && (snap.c !== lastC || merged)){ writeKey(keyC(pageClinic()), '{"ver":'+DEMO_DATA_VERSION+',"t":'+Date.now()+',"st":1,"vars":'+snap.c+'}'); lastC = snap.c; try{ lastDiskC = localStorage.getItem(keyC(pageClinic())); }catch(e){} }
    if(merged && typeof refreshView === 'function') setTimeout(function(){ try{ safeRefresh(refreshView); }catch(e){} }, 0); /* 合并进了别的分页的新内容，画面跟着刷新 */
  }
  function makeRoomAndRetry(){
    var steps = [function(){ dropBackups(true); }, function(){ pruneLive(1); }, function(){ pruneLive(2); }, function(){ pruneLive(3); }];
    for(var i = 0; i < steps.length; i++){
      try{ steps[i](); lastG = ''; lastC = ''; tryWrite(); console.warn('[存档] 容量快满，已清理（第 '+(i+1)+' 级）后写入成功'); return true; }catch(e){}
    }
    return false;
  }
  /* ---- 存档：只写变了的部分；写失败（容量超限等）→ 先腾地方再写，绝不清用户案件 ---- */
  function save(){
    if(disabled || window.GMC_NO_SAVE) return; /* GMC_NO_SAVE：测试清理还原快照后，本页不能再把内存里的旧数据写回去（selftest ST.cleanup） */
    try{ snapshot(); }catch(e){ console.warn('[存档] 序列化失败', e); return; }
    try{
      tryWrite();
      if(totalChars() > SOFT_LIMIT){ dropBackups(false); if(totalChars() > HARD_LIMIT){ pruneLive(1); lastG = ''; lastC = ''; try{ tryWrite(); }catch(e0){} } } /* 提前瘦身：超过软上限先删多余备份，快到硬上限再删最旧日志 */
    }catch(e){
      console.warn('[存档] localStorage 容量不够，先腾地方（备份 → 最旧通知 / 日志），不会清用户案件', e);
      if(!makeRoomAndRetry()){
        disabled = true; /* 极端情况：腾完还写不进去——停止存档，已有存档原样保留（不删）*/
        notice('存档容量不足，这个页面之后的操作暂不保存（已有数据没有被清除；请在测试覆盖页导出备份后再「全部清空」）');
      }
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
      if(window.GMC_RAW_CORRUPT && window.GMC_RAW_CORRUPT[KEY_G]){ /* 全局存档损坏：不写种子，交给 load() 失败后的读档失败保护处理 */ }
      else if(!g || String(g.ver) !== String(DEMO_DATA_VERSION) || g.partial){
        if(g && g.partial && g.vars) Object.keys(g.vars).forEach(function(n){ window[n] = g.vars[n]; }); /* 版本重置时保留的账号等 */
        if(typeof ensureSeedAccounts === 'function') ensureSeedAccounts();
        var snapC1 = null;
        CLINICS.forEach(function(cl){ /* 先写诊所分区（viewSplit 会把 KR 项拆回医院，全局部分要在它之后序列化） */
          var p = readRaw(keyC(cl.id));
          if(window.GMC_RAW_CORRUPT && window.GMC_RAW_CORRUPT[keyC(cl.id)]) return; /* CMD-1022-12：这家诊所的存档损坏，不能拿种子覆盖 */
          if(p && String(p.ver)===String(DEMO_DATA_VERSION) && !p.partial && p.vars && p.vars.CASE_ITEMS) return;
          var vars;
          if(cl.id==='C1'){ var split = viewSplit(); vars = clinicVarsObj(split); try{ gmcFillKrMeta(vars.CASE_ITEMS); }catch(e){} }
          else vars = demoMarked(buildClinicSeed(cl.id));
          gmcWipeClinicVars(vars); /* CMD-1015-06：演示数据不带客人 / 案件 */
          if(p && p.vars) Object.keys(p.vars).forEach(function(n){ vars[n] = p.vars[n]; }); /* 版本重置时保留的诊所设定等 */
          gmcStampVars(vars);
          writeKey(keyC(cl.id), wrap(vars));
        });
        gmcWipeHospitals(HOSPITAL_DATA); CASE_NO_SEQ = 1;
        gmcStampHospitals(HOSPITAL_DATA);
        writeKey(KEY_G, wrap(pick(GLOBAL_VAR_NAMES)));
      } else {
        CLINICS.forEach(function(cl){ /* 全局在、某个诊所分区缺（或只剩保留下来的部分）→ 补齐这个分区 */
          var p = readRaw(keyC(cl.id));
          if(window.GMC_RAW_CORRUPT && window.GMC_RAW_CORRUPT[keyC(cl.id)]) return; /* CMD-1022-12：这家诊所的存档损坏，不能拿种子覆盖 */
          if(p && String(p.ver)===String(DEMO_DATA_VERSION) && !p.partial && p.vars && p.vars.CASE_ITEMS) return;
          var vars = gmcWipeClinicVars((cl.id==='C1') ? clinicVarsObj(viewSplit()) : demoMarked(buildClinicSeed(cl.id)));
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
      var dirtyG = false; try{ dirtyG = lastG && snapshotG() !== lastG; }catch(err){}
      if(dirtyG){ /* CMD-1028-05：同上，全局部分有未存的改动 → 合并 */
        var baseG = lastG, mg2 = mergeDisk('g', e.newValue, baseG, snapshotG());
        if(mg2){ adoptMerged('g', mg2); if(cid){ var inC2 = {}; Object.keys(PROJECT_CATEGORIES).forEach(function(k){ if(PROJECT_CATEGORIES[k].origin!=='KR') inC2[k] = PROJECT_CATEGORIES[k]; }); buildClinicViews(PROJECT_LIBRARY.filter(function(p){ return p.origin!=='KR'; }), LIB_CASES.filter(function(c){ return c.source!=='travel'; }), inC2); } lastDiskG = e.newValue; lastG = baseG; tick(); save(); if(typeof refreshView === 'function') safeRefresh(refreshView); return; }
      }
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
      var dirtyC = false; try{ dirtyC = lastC && snapshot().c !== lastC; }catch(err){}
      if(dirtyC){ /* CMD-1028-05：本页还有没存下去的改动（不能被别的分页的内容整份盖掉）→ 合并后马上存 */
        var base = lastC, mc2 = mergeDisk('c', e.newValue, base, snapshot().c);
        if(mc2){ adoptMerged('c', mc2); lastDiskC = e.newValue; lastC = base; tick(); save(); if(typeof refreshView === 'function') safeRefresh(refreshView); return; }
      }
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
    {to:42, fn:function(c, ctx){ /* IN 不再分配术后管理：还没付清尾款、没做术后管理预约的案件，旧的 inTimes 清掉（已生成的持有批次、已预约的子项不动） */
      if(c.krBalancePaid || c.pcBooked) return;
      var n = 0, clr = function(arr){ (arr||[]).forEach(function(x){ if(x && x.inTimes){ x.inTimes = 0; n++; } }); };
      (c.procedureItems||[]).forEach(function(it){ clr(it.postcare); }); ((c.krScope||{}).items||[]).forEach(function(it){ clr(it.postcare); });
      if(n) ctx.note('IN 不再分配术后管理，已清掉 '+n+' 条旧的印尼分配');
    }},
    {to:45, fn:function(c, ctx){ /* CMD-1015-16：拿掉「共同术后管理」——带 cid 的条目只留在第一个适用项目上（原来按一份算：排程 / 转持有只算一次），其他项目里的副本去掉，cid / applies 字段清掉；可选范围里的管理项目是新增结构（mgmt），旧案件没有，无需转换 */
      var n = 0, seen = {};
      var fix = function(list){ (list||[]).forEach(function(it){ if(!it || !it.postcare) return;
        it.postcare = it.postcare.filter(function(x){ if(!x || !x.cid) return true; if(seen[c.id+'|'+x.cid]){ n++; return false; } seen[c.id+'|'+x.cid] = 1; return true; });
        it.postcare.forEach(function(x){ if(x && x.cid){ delete x.cid; delete x.applies; } }); }); };
      /* 三处各自按「第一次见到」去重；可选范围里的先处理，所以已选项目里的保留条目与可选范围一致即可：分开计数，避免互相吞掉 */
      var run = function(list){ seen = {}; fix(list); };
      run((c.krScope||{}).items); run(c.procedureItems); run(c.recommended);
      if(n) ctx.note('共同术后管理已转成各项目自己的术后管理：案件 '+(c.caseNo||c.id)+' 去掉 '+n+' 条重复副本（只留在第一个适用项目上）');
    }},
    {to:56, fn:function(c, ctx){ /* CMD-1023-01 S1：案件结构 v2——补 mainId（没有 = 自己是主案件）；旧的接续案件不转换，各自保持独立主案件 */
      if(!c.mainId) c.mainId = c.id;
    }},
    {to:55, fn:function(c, ctx){ /* CMD-1020-08：IN 室长备注改成备注记录（可写好几则、KR 已读）；原来的「印尼室长备注」内容迁成第一则备注（作者 IN 室长、未读） */
      if(c.recInNote && !(c.inNotes||[]).length){ c.inNotes = [{id:'n0', text:String(c.recInNote), by:'IN 室长', at:nowFullDt(), readAt:'', readBy:''}]; ctx.note('案件 '+(c.caseNo||'')+'：印尼室长备注迁成第一则备注'); }
    }},
    {to:54, fn:function(c, ctx){ /* CMD-1019-23：持有管理项目的已使用只能来自到院卡里「操作完成」的行；没有完成行的使用记录（项目卡有已使用、到院卡没有对应行）去掉，次数改回 */
      var notes = fixUseRecords(c); if(notes.length){ notes.forEach(function(t){ logCaseEvent(c, '系统', '修正使用记录：'+t); }); ctx.note('案件 '+(c.caseNo||'')+'：使用记录修正（'+notes.join('；')+'）'); }
    }},
    {to:53, fn:function(c, ctx){ /* CMD-1019-17：建议在韩天数不能少于最少天数（必须在韩国的最后一项术后管理第 N 天 + 1，施术日 = 第 0 天）。旧案件天数不够的 → 自动提到最少天数并记进迁移备注（比最少多但没写停留原因的不改，显示时就不写原因） */
      var fixed = [], fix = function(it){
        if(!it || !it.stay || it.mgmt || it.mgmtPlan || it.service) return;
        var days = recStayDays(it), mi = stayMinOf(it.postcare);
        if(days && days < mi.min){ fixed.push(it.name+'：'+days+' 天 → '+mi.min+' 天'); it.stay = mi.min+'天'; }
      };
      ['recommended','procedureItems'].forEach(function(k){ (c[k]||[]).forEach(fix); }); ((c.krScope||{}).items||[]).forEach(fix);
      if(fixed.length) ctx.note('案件 '+(c.caseNo||'')+'：建议在韩天数少于最少天数，已提到最少天数（'+fixed.join('；')+'）');
    }},
    {to:52, fn:function(c, ctx){ /* CMD-1019-14：麻醉新增「需空腹（小时）」an.fast；睡眠 / 全麻的旧项目从备注「空腹 N 小时」转过来，局麻清空 */
      var n0 = 0, fix = function(it){ var an = it && it.anesthesia; if(!an || an.fast!==undefined) return; an.fast = (an.type && an.type!=='local') ? anesFastParse(an.note) : ''; if(an.fast!=='') n0++; };
      ['recommended','procedureItems'].forEach(function(k){ (c[k]||[]).forEach(fix); }); ((c.krScope||{}).items||[]).forEach(fix);
      if(n0) ctx.note('案件 '+(c.caseNo||'')+'：'+n0+' 个项目的空腹小时数从麻醉备注转到「需空腹（小时）」栏');
    }},
    {to:51, fn:function(c, ctx){ /* CMD-1019-10：KR 管理项目的数量 = 份数；规格里写「N次」的：总次数 = N × 份数（旧版把「次数」当成手填的份数，买「·3次」×1 只记成 1 次，持有 / 扣次数都少了）。旧 qty = 份数 → copies，qty 改成总次数 */
      var fixed = 0, fix = function(it){
        if(!it || !(it.mgmt || it.mgmtPlan || /^lc:/.test(String(it.projectId||'')) || it.local) || it.copies) return;
        var m = String(it.specLabel || it.name || '').match(/(\d+)\s*次/), n = m ? parseInt(m[1], 10) : 1, cp = it.qty || 1;
        it.copies = cp; it.specTimes = n; if(n>1){ it.qty = n*cp; fixed++; }
      };
      ['recommended','procedureItems'].forEach(function(k){ (c[k]||[]).forEach(fix); }); ((c.krScope||{}).items||[]).forEach(fix);
      if(fixed) ctx.note('案件 '+(c.caseNo||'')+'：'+fixed+' 个带「N次」规格的管理项目，总次数改成 规格次数 × 份数');
    }},
    {to:50, fn:function(c, ctx){ /* CMD-1019-06：「下颌角整形」改名「下颚角整形」（案件里存的项目名同步）；赴韩项目分类改成苦恼部位由 krPartsNormalize 在读档后处理，案件不受影响 */
      var n0 = 0, ren = function(it){ if(it && typeof it.name==='string' && it.name.indexOf('下颌角')>-1){ it.name = it.name.replace(/下颌角/g, '下颚角'); n0++; } };
      ['recommended','procedureItems','intentionProjects','krProjects'].forEach(function(k){ (c[k]||[]).forEach(ren); });
      ((c.krScope||{}).items||[]).forEach(ren); ((c.krScope||{}).addedItems||[]).forEach(ren);
      if(n0) ctx.note('案件 '+(c.caseNo||'')+'：项目名「下颌角整形」改为「下颚角整形」（'+n0+' 处）');
    }},
    {to:49, fn:function(c, ctx){ /* CMD-1019-04：希望预期进每张部位卡片；旧案件的整体希望预期放进「未分部位」卡，有部位卡的放进苦恼总 memo（不丢） */
      var cards = c.concerns || [], exp = String(c.expectation||'').trim();
      if(cards.some(function(x){ return x.expect; })) return;
      if(!cards.length){ if(exp){ c.concerns = [{part:'legacy', sub:'', desc:c.concern||'', expect:exp, video:null, photos:{}, legacy:true}]; ctx.note('希望预期放进「未分部位」卡（案件 '+(c.caseNo||c.id)+'）'); } return; }
      var leg = cards.filter(function(x){ return x.part==='legacy'; })[0];
      if(leg){ leg.expect = exp; if(exp) ctx.note('希望预期放进「未分部位」卡（案件 '+(c.caseNo||c.id)+'）'); }
      else if(exp){ c.concernMemo = (c.concernMemo ? c.concernMemo+'；' : '')+'希望预期：'+exp; ctx.note('希望预期放进苦恼总 memo（案件 '+(c.caseNo||c.id)+'）'); }
      cards.forEach(function(x){ if(x.expect===undefined) x.expect = ''; });
    }},
    {to:48, fn:function(c, ctx){ /* CMD-1019-03：旧五个部位 → 新细部位：眼睛 / 鼻子 / 嘴巴 → 面部下同名；面部 → 面部整体；身体 → 身体（未细分）；已传照片按角度 id 保留（对得上的才留，对不上的不丢，仍在 photos 里） */
      var n = 0; (c.concerns||[]).forEach(function(x){ var k = {eyes:'f_eyes', nose:'f_nose', mouth:'f_mouth', face:'f_all', body:'b_all'}[x.part]; if(k){ x.part = k; x.sub = x.sub||''; n++; } else if(x.sub===undefined) x.sub = ''; });
      if(n) ctx.note('苦恼部位转成新细部位 '+n+' 个（案件 '+(c.caseNo||c.id)+'）');
    }},
    {to:47, fn:function(c, ctx){ /* CMD-1019-01：整体苦恼 / 照片 / 视频 → 一张「未分部位」卡片（旧案件显示仍正常，说明沿用原苦恼文字，没有分角度的照片） */
      if(Array.isArray(c.concerns) && c.concerns.length) return;
      if(c.concern || c.photoUploaded || c.videoUploaded){
        c.concerns = [{part:'legacy', desc:c.concern||'', video:c.videoUploaded ? {name:'视频（旧资料）'} : null, photos:c.photoUploaded ? {legacy:{name:'照片（旧资料）'}} : {}, legacy:true}];
        ctx.note('苦恼转成「未分部位」卡片（案件 '+(c.caseNo||c.id)+'）');
      } else c.concerns = [];
    }},
    {to:46, fn:function(c, ctx){ /* CMD-1015-17：付费管理项目付清尾款后就是在韩持有（不再有「管理项目」进程行）；术后管理持有批次转回原案件见 migrateCareHoldings */
      var n = 0;
      if(c.krBalancePaid){ (c.procedureItems||[]).forEach(function(it){ if(it.mgmtPlan && !it.heldOver && !it.cancelled && !it.swapped){ it.heldOver = true; it.holdDone = !!it.done && false; it.holdUsed = it.holdUsed||0; it.done = true; n++; } }); }
      var before = (c.subItems||[]).length; c.subItems = (c.subItems||[]).filter(function(s){ return !(s.mgmtPlan && s.kind==='增加项目'); });
      if(c.krProcedureDone && !c.surgeryDoneAt) c.surgeryDoneAt = (c.krSchedule && c.krSchedule.confirmedDate) || (c.visitDate||'');
      if(n || before!==c.subItems.length) ctx.note('管理项目转成在韩持有 '+n+' 项（案件 '+(c.caseNo||c.id)+'）');
    }},
    {to:43, fn:function(c, ctx){ /* CMD-1014-16 四：只是补演示缺口（老板账号、C2 可退批次、H2 的两种状态案件）；用户案件无需改动 */ }},
    {to:41, fn:function(c, ctx){ /* 「消肿管理」改名「术后管理」；意向项目只留赴韩手术项目 */
      var fixPc = function(arr){ (arr||[]).forEach(function(x){ if(x && x.mgmt==='消肿管理') x.mgmt = '术后管理'; }); };
      (c.procedureItems||[]).forEach(function(it){ fixPc(it.postcare); });
      ((c.krScope||{}).items||[]).forEach(function(it){ fixPc(it.postcare); });
      if((c.intentionProjects||[]).length){ var n0 = c.intentionProjects.length; c.intentionProjects = c.intentionProjects.filter(function(it){ return it.origin==='KR' && ['术后消肿管理','消肿管理','术后管理','拆线','术后复诊检查','术后复诊','伤口护理'].indexOf(it.name)<0; }); if(c.intentionProjects.length!==n0) ctx.note('意向项目只留赴韩手术项目，已去掉 '+(n0-c.intentionProjects.length)+' 个本地 / 术后管理项目'); }
    }}
  ];
  window.GMC_MIGRATIONS = MIGRATIONS; window.GMC_MIGRATE_CARE = migrateCareHoldings; /* 自测用：selftest R16c 直接跑迁移步骤 */
  /* CMD-1015-17：术后管理不是持有项目——「套餐内含」的 0 元术后管理持有批次转回原案件：已用的次数记成原案件里已做的印尼术后管理，没用的留成待做项（案件已结案的显示在客户详情）；批次从客户持有里拿掉 */
  function migrateCareHoldings(hs, cases, fromVer, report){
    if(fromVer >= 46) return;
    Object.keys(hs).forEach(function(name){
      hs[name] = (hs[name]||[]).filter(function(h){
        if(h.category!=='术后管理') return true;
        h.batches = (h.batches||[]).filter(function(b){
          if(!b.pkg) return true; var src = cases.filter(function(c){ return c.id===b.caseId; })[0]; if(!src) return true;
          src.subItems = src.subItems || [];
          var rows = src.subItems.filter(function(s){ return s.kind==='术后管理记录' && s.place==='IN' && !s.holdUseOf && String(s.content||'').indexOf(h.itemName)>-1; }).sort(function(a, b2){ return (a.date||'').localeCompare(b2.date||''); });
          var used = b.used||0, total = b.bought||used;
          for(var i = rows.length; i < total; i++){ /* 老数据没有对应的行：按建议天数补 */
            var dn = (b.scheduleDays||[])[i], dt = new Date(String((src.krSchedule&&src.krSchedule.confirmedDate)||b.date).slice(0,10)+'T00:00:00'); if(dn!=null) dt.setDate(dt.getDate()+dn);
            var r0 = {id:'s'+Date.now()+Math.floor(Math.random()*1000)+i, no:(src.caseNo||'')+'-'+(90+i), date:dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'), content:'术后管理（回印尼做：'+h.itemName+'）', kind:'术后管理记录', place:'IN', projectName:'', done:false, doneAt:'', doneBy:'', informed:false, pcb:true};
            src.subItems.push(r0); rows.push(r0);
          }
          rows.forEach(function(s, i){ s.innName = h.itemName; s.suggest = s.suggest || s.date; if(i < used){ s.done = true; s.visitDate = ((b.usages||[])[i]||{}).date || s.date; s.doneAt = s.visitDate+' 00:00'; s.doneBy = ((b.usages||[])[i]||{}).by || ''; s.arrived = true; } });
          if(report) report.notes.push({caseNo:src.caseNo, name:name, notes:['术后管理持有批次「'+h.itemName+'」×'+total+'（已用 '+used+'）转回原案件的术后管理']});
          return false;
        });
        return (h.batches||[]).length>0;
      });
      if(!(hs[name]||[]).length) delete hs[name];
    });
  }
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
      migrateHoldings(cc.holdings, fromVer, libIn); migrateCareHoldings(cc.holdings, cc.cases, fromVer, report);
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
    window.GMC_CARRY_CHECK = {expect:carry.total||0, migrated:report.migrated, failed:report.failed.length}; /* CMD-1020-12：升级后数量核对用 */
    try{ localStorage.setItem('gmc_cfg_migration', JSON.stringify(report)); localStorage.removeItem('gmc_cfg_carry'); }catch(e){}
  }

  /* 操作之后（点击、输入、选择、键盘）稍后存档；另外每 2 秒兜底一次；页面离开/隐藏时再存一次 */
  ['click', 'change', 'input', 'keyup', 'submit', 'drop'].forEach(function(t){ document.addEventListener(t, touch, true); });
  setInterval(save, 2000);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function(){ if(document.hidden) save(); });

  init();
  try{ carryRestore(); var cc0 = window.GMC_CARRY_CHECK; if(cc0 && cc0.expect !== cc0.migrated + cc0.failed) gmcShowBlock('升级后用户案件数量对不上（升级前 '+cc0.expect+' 个，迁移 '+cc0.migrated+' 个、失败 '+cc0.failed+' 个）。已停止写档；用户案件的安全备份在 gmc_cfg_usersafe，恢复用 gmcUserSafeRestore(0)。'); }catch(e){ console.warn('[迁移] 合并用户案件失败', e); try{ localStorage.setItem('gmc_cfg_migration', JSON.stringify({from:null, to:DEMO_DATA_VERSION, at:new Date().toISOString(), migrated:0, failed:[{caseNo:'（全部）', name:'', reason:'合并出错：'+e.message+'（旧数据在自动备份里）'}]})); }catch(e2){} }
  if(!load()){ /* 读不出来（极少见：存档损坏）就用刚生成的种子重新写一遍 */
    try{ var rawSafe = {}; Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_state')===0 || k.indexOf('gmc_clinic_')===0; }).forEach(function(k){ rawSafe[k] = localStorage.getItem(k); }); if(Object.keys(rawSafe).length) localStorage.setItem('gmc_cfg_rawsafe', JSON.stringify({at:new Date().toISOString(), data:rawSafe})); }catch(e){ console.error('[用户案件保护] 重建前存原始存档失败', e); } /* CMD-1020-12：重建前把原始存档原样存一份（gmc_cfg_rawsafe，恢复 = 把 data 里的键写回 localStorage） */
    /* CMD-1022-12 读档失败保护：原存档里有客人或案件 → 不清空、不写种子，页面提示「资料读取失败，已保留原资料，请勿重置」；没有客人案件才照旧用种子重建 */
    var hasUser = false;
    try{ Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_clinic_')===0 || k.indexOf('gmc_state')===0; }).forEach(function(k){
      var s = localStorage.getItem(k) || ''; try{ var p = JSON.parse(s), v = (p && p.vars) || {}; if((v.CASE_ITEMS && v.CASE_ITEMS.length) || (v.CLIENTS && v.CLIENTS.length)) hasUser = true; }catch(pe){ if(/"CASE_ITEMS":\[\{|"CLIENTS":\[\{|"caseNo"/.test(s)) hasUser = true; } /* 读不出来的存档：只要里面还能看到案件 / 客人的痕迹就当作有资料 */
    }); }catch(e){ hasUser = true; }
    if(hasUser){
      window.GMC_LOAD_PROTECT = true; window.GMC_NO_SAVE = true;
      console.error('[存档] 读取失败，但原存档里有客人 / 案件：不清空、不写种子；原档已备份在 gmc_cfg_rawsafe。请勿点「重置演示数据」。');
      try{ if(typeof gmcShowBlock==='function') gmcShowBlock('资料读取失败，已保留原资料，请勿重置。（本页不会写档；原存档没有被改动，另有备份 gmc_cfg_rawsafe；请把这条告诉开发者）'); }catch(e2){}
      try{ init(); }catch(e3){ console.error('[存档] 保护模式下生成内存种子失败', e3); }
      return {save:function(){}, load:load, touch:function(){}, readClinic:readClinic, updateClinic:updateClinic, withClinic:withClinic, mutateClinic:mutateClinic, isDisabled:function(){ return true; }};
    }
    try{ Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_state')===0 || k.indexOf('gmc_clinic_')===0; }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e){}
    init(); load();
  }
  return {mergeNode:mergeNode, save:save, load:load, touch:touch, readClinic:readClinic, updateClinic:updateClinic, withClinic:withClinic, mutateClinic:mutateClinic, isDisabled:function(){ return disabled; }};
})();

/* 重置演示数据：清掉所有 gmc_ 开头的存档，其他标签页收到通知后也会刷新 */
function resetDemoData(){
  if(gmcResetAll('手动重置演示数据', false, true)===false) return; /* 先自动备份再清（CMD-1012-06）；CMD-1020-12：用户点的重置，已在界面上确认 */
  location.reload();
}

/* 页面守卫（2026-10-05·三）：没登录 → 登录页；角色不对 → 回自己的首页。roles = 允许进入的角色列表 */
function guardPage(roles){
  var a = currentAccount();
  if(!a){ location.replace('/login.html'); return false; }
  if(roles.indexOf(a.role) < 0){ location.replace(homeUrl(a)); return false; }
  return true;
}
