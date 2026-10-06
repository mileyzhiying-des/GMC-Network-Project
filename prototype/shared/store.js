/* shared/store.js —— 存档与多标签页同步（2026-10-05·一）
   - 全部演示数据（PERSIST_VARS 列出的全局变量）存在 localStorage 的 gmc_state 里，带版本号（DEMO_DATA_VERSION，不符时 data.js 开头已清空，重新生成演示数据）。
   - 多个标签页（in.html / owner.html / booking.html …）共用同一份数据：某个标签页改了数据 → 存档 → 其他标签页收到 storage 事件 → 重读数据并调用 refreshView() 重画。
   - 真实上传的图片（data: 地址）只放内存，不写进 localStorage（存档里换成 @img:编号；刷新后这些图片不再显示）。
   - 超出 localStorage 容量（约 5MB）时：不报错、不卡住，console.warn + 画面上提示"演示数据过大，已重置"，之后这个页面不再存档。
   加载顺序：rules.js → ui.js → data.js → store.js →（in.html 再加 boot-in.js） */
var PERSIST_VARS = [
  'CLINIC_TZ', 'DEMO_SHIFT_MS',
  'RESUMED_VISITS', 'PLACEHOLDER_HISTORY', 'PLACEHOLDER_SEQ', 'RESERVATION_PLACEHOLDERS',
  'CLIENTS', 'CLIENT_HOLDINGS', 'CLIENT_FIX_LOG',
  'CASE_ITEMS', 'CASE_NO_SEQ',
  'LIB_PROBLEM_SEQ', 'LIB_PROBLEMS', 'LIB_PROBLEM_IDS', 'LIB_CASE_SEQ', 'LIB_CASES',
  'PROJCAT_SEQ', 'PROJECT_CATEGORIES', 'PCAT', 'PROJ_SEQ', 'PROJECT_LIBRARY',
  'NOTIF_SEQ', 'NOTIFS',
  'ROOMS', 'STAFF_ROSTER', 'ROOM_UNREAD', 'CHAT_DATA', 'MUTED_ROOMS', 'ROOM_FILE_SEQ',
  'CAL_MEMOS', 'DIRECTOR_LIST',
  'ACCOUNTS', 'ACCOUNT_SEQ', 'ACCOUNT_LOG'
];

var Store = (function(){
  var KEY = 'gmc_state';
  var lastJson = '';      /* 上次存档/读档时的数据（不含时间戳），用来判断有没有变化 */
  var disabled = false;   /* 容量超限后，这个页面不再存档 */
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
  function snapshotVars(){
    var o = {};
    PERSIST_VARS.forEach(function(n){ o[n] = window[n]; });
    return JSON.stringify(o, replacer);
  }
  function assignInPlace(name, val){
    var cur = window[name];
    if(Array.isArray(cur) && Array.isArray(val)){ cur.length = 0; Array.prototype.push.apply(cur, val); }
    else if(cur && typeof cur === 'object' && !Array.isArray(cur) && val && typeof val === 'object' && !Array.isArray(val)){
      Object.keys(cur).forEach(function(x){ delete cur[x]; }); Object.assign(cur, val);
    } else window[name] = val;
  }
  /* 读档：把存档里的数据放回全局变量（数组/对象原地替换，保持其他地方对它们的引用有效） */
  function load(){
    var raw = null;
    try{ raw = localStorage.getItem(KEY); }catch(e){}
    if(!raw) return false;
    try{
      var st = JSON.parse(raw, reviver);
      if(!st || String(st.ver) !== String(DEMO_DATA_VERSION) || !st.vars) return false;
      PERSIST_VARS.forEach(function(n){ if(st.vars.hasOwnProperty(n)) assignInPlace(n, st.vars[n]); });
      lastJson = snapshotVars();
      if(typeof syncInCoordinators === 'function') syncInCoordinators(); /* IN 室长名单由账号算出，不存档 */
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
  /* 存档：数据没变就不写；写失败（容量超限等）→ 清掉存档，提示并停止存档 */
  function save(){
    if(disabled) return;
    var json;
    try{ json = snapshotVars(); }catch(e){ console.warn('[存档] 序列化失败', e); return; }
    if(json === lastJson) return;
    try{
      localStorage.setItem(KEY, JSON.stringify({ver:DEMO_DATA_VERSION, t:Date.now()}).slice(0,-1) + ',"vars":' + json + '}');
      lastJson = json;
    }catch(e){
      console.warn('[存档] localStorage 容量超限，演示数据已重置，此页面之后的操作不再保存', e);
      disabled = true;
      try{ localStorage.removeItem(KEY); }catch(e2){}
      notice('演示数据过大，已重置（这个页面之后的操作不再保存，刷新页面可恢复演示数据）');
    }
  }
  function touch(){ clearTimeout(touch._t); touch._t = setTimeout(save, 60); }

  /* 其他标签页存了新数据：重读 + 重画 */
  window.addEventListener('storage', function(e){
    if(e.key === KEY && e.newValue){
      if(load()){
        if(window.GUARD_ROLES && !guardPage(window.GUARD_ROLES)) return; /* 本账号被停用/重置：回登录页 */
        if(typeof refreshView === 'function') refreshView();
      }
    } else if(e.key === null || (e.key === 'gmc_demo_ver')){ /* 别的标签页重置了演示数据 → 本页也刷新 */
      location.reload();
    }
  });
  /* 操作之后（点击、输入、选择、键盘）稍后存档；另外每 2 秒兜底一次；页面离开/隐藏时再存一次 */
  ['click', 'change', 'input', 'keyup', 'submit', 'drop'].forEach(function(t){ document.addEventListener(t, touch, true); });
  setInterval(save, 2000);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function(){ if(document.hidden) save(); });

  /* 启动：有版本一致的存档就用存档，没有就把刚生成的演示数据存下来 */
  if(!load()) save();
  return {save:save, load:load, touch:touch, isDisabled:function(){ return disabled; }};
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
  if(roles.indexOf(a.role) < 0){ location.replace(a.role==='owner' ? '/owner.html' : '/in.html'); return false; }
  return true;
}
