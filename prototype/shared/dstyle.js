/* ================= CMD-1014-07 设计系统样式（新样式 / 旧样式开关） =================
   只换颜色 / 字体 / 圆角 / 图标；版面、间距、文字、结构、交互不动。
   开关：localStorage.gmc_cfg_newstyle（'0' = 旧样式，默认新样式；gmc_cfg_ 前缀重置不清），在测试覆盖页顶部切换。
   旧样式 = 本文件什么都不做（app.css 和所有写死的色值原样）。
   做法（新样式时）：① 读 app.css，把写死的色值换成语义变量，加上语义变量定义和字体 / 圆角 / 字重覆盖，document.write 成一段 <style>（放在 app.css 后面覆盖）；
   ② 页面里单独的 <style> 和 JS 生成的 style="" 里的色值 / 字重同样替换（MutationObserver）；③ 文字里的 emoji 图标换成 Lucide 线条图标（线宽 1.5，颜色跟随文字，原 emoji 留在隐藏文字里，innerText 不变）。
   色值来源：Notion「UI 规范 Design System」+ CMD-1014-07 的色值表；表里没有的色值不造新的，保持原样并列进汇报（window.DS_UNMAPPED 可在 console 查看当前页面没对上的色值）。 */
(function(){
  var off = false; try{ off = localStorage.getItem('gmc_cfg_newstyle')==='0'; }catch(e){}
  window.DS_NEW = !off;
  if(off) return;
  document.documentElement.classList.add('ds-new');
  var VARS = {
    '--bg-page':'#F7F4EE','--bg-surface':'#FFFFFF','--bg-sidebar':'#F7F4F0','--bg-hover':'#EFEAE4','--bg-disabled':'#EFEAE4','--bg-brand-subtle':'#F6E9DE','--bg-brand-faint':'#FBF5EF',
    '--border-default':'#E3DCD4','--border-strong':'#CFC6BC','--border-focus':'#A0592F',
    '--text-primary':'#221E1B','--text-body':'#3A342F','--text-secondary':'#6E665E','--text-placeholder':'#8E857C','--text-on-action':'#FFFFFF','--text-link':'#A0592F',
    '--action-primary':'#A0592F','--action-primary-hover':'#864A27','--action-danger':'#B83A2E','--action-danger-hover':'#9A2F25',
    '--feedback-success-fg':'#2F7A4D','--feedback-success-bg':'#E4F1EA','--feedback-warning-fg':'#8A6400','--feedback-warning-icon':'#D9A100','--feedback-warning-bg':'#FBF3D5',
    '--feedback-error-fg':'#B83A2E','--feedback-error-bg':'#F9E6E3','--feedback-info-fg':'#2F5E8F','--feedback-info-bg':'#E5EEF8',
    '--status-violet-bg':'#EEEBF7','--status-violet-fg':'#5B4B9A','--status-yellow-bg':'#FBF3D5','--status-yellow-fg':'#7A5A00','--status-blue-bg':'#E5EEF8','--status-blue-fg':'#2F5E8F',
    '--status-green-bg':'#E4F1EA','--status-green-fg':'#2F6B4A','--status-rose-bg':'#F4E6EE','--status-rose-fg':'#8A4069','--status-gray-bg':'#EEECEA','--status-gray-fg':'#5F5852'
  };
  /* 旧色值 → 语义变量（只放用途明确对得上的；其余原样保留） */
  var MAP = {}; function m(v, list){ list.split(' ').forEach(function(h){ MAP['#'+h] = 'var('+v+')'; }); }
  m('--text-primary','1B2635 1C2B40 1E2A44 2A3344 1B2333'); m('--text-body','3B4A5A'); m('--text-secondary','5B6672 6B7A90 6B7A8D'); m('--text-placeholder','8A8F98 9AA6B2');
  m('--bg-page','FAF7F2 FAF8F3 FBF8F2'); m('--bg-brand-faint','FAF6EF'); m('--bg-sidebar','F7F4EF F6F4EF F4F0E8 F4F6F9 F4F6F8 F1F4F8 F3F1EC EFEBE4'); /* 休诊 / 午休 / 不可预约 = #F7F4F0（CMD-1014-08） */
  m('--bg-hover','EDEAE2 EDE6DA E9E5DC E4E2DC F0ECE3 F0ECE2 ECE8DF E6DDD0');
  m('--border-default','E4DED2 E4E8ED'); m('--border-strong','C7BFAF D9CFC1 D3CFD9');
  m('--action-primary','C1694F'); m('--action-primary-hover','8A4A2A'); m('--bg-brand-subtle','F3E4DD F3DFD3');
  m('--action-danger','C1454A B3261E B2453A E5484D'); m('--feedback-error-bg','FBE9E7 FDECEA FBE3E1 FBEAE7 FADADD F6DCDC');
  m('--feedback-warning-fg','8F6F0C A8740A'); m('--feedback-warning-bg','FBF0C9 FBF6EA FFF4E0 FDEBD3');
  m('--feedback-info-fg','2F5FA8 2F6FEB 5B84B1'); m('--feedback-info-bg','E8F0FB E3EAF6 DEE7F0');
  m('--feedback-success-fg','6E8B67'); m('--feedback-success-bg','DCE8D9 E7F3EC E4EEE7'); m('--status-green-fg','2F6B4A');
  m('--status-violet-fg','8B6BA8 8A7650'); m('--status-violet-bg','E9E2F3 F2EADB'); m('--status-rose-bg','E8D5C4'); m('--status-rose-fg','7A4E2D');
  var UNMAPPED = window.DS_UNMAPPED = {};
  function recolor(s){
    return s.replace(/#[0-9A-Fa-f]{6}\b/g, function(h){ var k = h.toUpperCase(), r = MAP[k]; if(r) return r; if(k!=='#FFFFFF') UNMAPPED[k] = (UNMAPPED[k]||0)+1; return h; })
      .replace(/font-weight:\s*(600|800|900)/g, 'font-weight:700');
  }
  var ICONS = {
    '🔔':'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    '🔕':'<path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"/><path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="m2 2 20 20"/>',
    '💬':'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    '📁':'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    '🔍':'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    '📞':'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    '🎥':'<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    '🎙':'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
    '🔒':'<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    '📎':'<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    '📄':'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    '📅':'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    '👤':'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    '✕':'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    '✓':'<path d="M20 6 9 17l-5-5"/>',
    '⚠':'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    '📌':'<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
    '🌐':'<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    '✅':'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    '🚫':'<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    '➤':'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    '🖼':'<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>'
  };
  ICONS['🎤'] = ICONS['🎙']; ICONS['🔐'] = ICONS['🔒'];
  var EMO_RE = new RegExp('('+Object.keys(ICONS).join('|')+')️?', 'g');
  function icon(e){ return '<span class="ds-ic" data-ic="'+e+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[e]+'</svg><span class="ds-ic-t">'+e+'</span></span>'; }
  var SKIP = {SCRIPT:1, STYLE:1, TEXTAREA:1, OPTION:1, SELECT:1, TITLE:1, INPUT:1};
  function swapIcons(root){
    if(!root || !document.createTreeWalker) return;
    var w = document.createTreeWalker(root.nodeType===9 ? root.body : root, NodeFilter.SHOW_TEXT, null), hits = [], n;
    while((n = w.nextNode())){ if(n.nodeValue && EMO_RE.test(n.nodeValue)){ var p = n.parentNode; if(p && !SKIP[p.nodeName] && !(p.closest && p.closest('.ds-ic, [contenteditable]'))) hits.push(n); } EMO_RE.lastIndex = 0; }
    hits.forEach(function(t){
      var html = t.nodeValue.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(EMO_RE, function(x, e){ return icon(e); });
      var span = document.createElement('span'); span.style.display = 'contents'; span.innerHTML = html; t.parentNode.replaceChild(span, t);
    });
  }
  function fixStyleAttrs(root){
    if(!root || root.nodeType!==1) return;
    var list = [root].concat([].slice.call(root.querySelectorAll('[style]')));
    list.forEach(function(el){ var s = el.getAttribute && el.getAttribute('style'); if(s && (s.indexOf('#')>-1 || /font-weight:\s*(600|800|900)/.test(s))){ var r = recolor(s); if(r!==s) el.setAttribute('style', r); } });
  }
  var queue = [], scheduled = false;
  function flush(){ scheduled = false; var q = queue; queue = []; q.forEach(function(r){ if(r.isConnected){ fixStyleAttrs(r); swapIcons(r); } }); }
  function enqueue(r){ queue.push(r); if(!scheduled){ scheduled = true; (window.requestAnimationFrame||setTimeout)(flush); } }
  function pageStyles(){ [].slice.call(document.querySelectorAll('style:not(#ds-css)')).forEach(function(s){ if(!s.dataset.ds){ s.dataset.ds = '1'; var r = recolor(s.textContent); if(r!==s.textContent) s.textContent = r; } }); }
  function start(){
    pageStyles(); fixStyleAttrs(document.body); swapIcons(document.body);
    new MutationObserver(function(ms){ ms.forEach(function(mu){ mu.addedNodes.forEach(function(n){ if(n.nodeType===1 && !(n.classList && n.classList.contains('ds-ic'))) enqueue(n); else if(n.nodeType===3 && n.parentNode && EMO_RE.test(n.nodeValue)){ EMO_RE.lastIndex = 0; enqueue(n.parentNode); } EMO_RE.lastIndex = 0; }); }); }).observe(document.body, {childList:true, subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start); else start();
  /* ① 新样式表：app.css 色值替换 + 语义变量 + 字体 / 圆角 / 字重 / 按钮覆盖 */
  var css = '';
  try{ var x = new XMLHttpRequest(); x.open('GET', '/shared/app.css?direct&ds=' + Date.now(), false); x.send(); if(x.status===200) css = recolor(x.responseText); }catch(e){} /* ?direct：开发服务器（Vite）才会原样返回 CSS；静态托管忽略它 */
  var root = ':root,html.ds-new{'+Object.keys(VARS).map(function(k){ return k+':'+VARS[k]; }).join(';')+';}';
  var extra =
    /* 旧变量 → 语义变量（旧写法 var(--navy) 等都还在用） */
    ':root{--ivory:var(--bg-page);--white:var(--bg-surface);--navy:var(--text-primary);--slate:var(--text-secondary);--slate2:var(--text-body);--terracotta:var(--action-primary);--terracotta-bg:var(--bg-brand-subtle);--sage:var(--feedback-success-fg);--sage-bg:var(--feedback-success-bg);--border:var(--border-default);--border2:var(--bg-hover);--muted:var(--text-placeholder);--dim:var(--border-strong);--purple:var(--status-violet-fg);--purple-bg:var(--status-violet-bg);--blue:var(--feedback-info-fg);--blue-bg:var(--feedback-info-bg);}'+
    'body{font-family:Pretendard,"Noto Sans SC",-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;background:var(--bg-page);color:var(--text-body);}'+
    'button,input,textarea,select{font-family:inherit;}'+
    /* 圆角：徽章 4 / 按钮、输入框 6 / 卡片 8 / 弹窗 12 */
    '.status-pill{border-radius:4px;} .btn-primary,.btn-outline,.btn-ghost,input,select,textarea,.cal-nav-btn{border-radius:6px;} .card{border-radius:8px;} .modal-box{border-radius:12px;} .login-card{border-radius:12px;}'+
    /* 按钮：主按钮用品牌色（品牌色只用在可点击元素） */
    '.btn-primary{background:var(--action-primary);color:var(--text-on-action);} .btn-primary:hover{background:var(--action-primary-hover);}'+
    '.btn-outline{border-color:var(--action-primary);color:var(--action-primary);background:var(--bg-surface);} .btn-ghost{background:var(--bg-hover);color:var(--text-body);}'+
    'input:focus,select:focus,textarea:focus{outline:none;border-color:var(--border-focus);}'+
    'a.info-link,.info-link{color:var(--text-link);}'+

    /* CMD-1014-08 颜色角色：背景 #F7F4EE / 驼色强调 / 侧栏选中 / 今天表头 / 分段切换 / 现在时间线 / 数据卡数字 / 休诊 · 午休 */
    '.nav-item.active{background:var(--bg-sidebar);color:var(--action-primary);font-weight:700;} .nav-item.active .dot{background:var(--action-primary);} .nav-item.active .nav-icon{background:var(--action-primary);color:var(--text-on-action);}'+
    '.wk-head.today,.krc-head-today{background:var(--bg-brand-subtle) !important;color:var(--action-primary) !important;box-shadow:inset 0 -2px 0 var(--action-primary);font-weight:700;} .wk-cell.wk-tcol:not(.wk-lunch):not(.wk-past){background:var(--bg-brand-faint);} .krc-col-today{background:var(--bg-brand-faint) !important;}'+
    '.cal-switch span.active,.todo-seg span.on,.chip.active{background:var(--bg-surface);color:var(--action-primary);border:1px solid var(--border-default);font-weight:700;}'+
    'button[style*="background:var(--navy)"]{background:var(--bg-surface) !important;color:var(--action-primary) !important;border-color:var(--border-default) !important;}'+
    'div[style*="background:var(--navy);color:#fff"]{background:var(--bg-brand-subtle) !important;color:var(--action-primary) !important;}'+
    '.todo-nowline{border-top-color:var(--action-primary);} .todo-nowline span{background:var(--action-primary);}'+
    '.card[data-n]:not([data-warn]) .ds-cnum{color:var(--text-body) !important;} .card[data-n="0"] .ds-cnum.ds-cnum:not(.x):not(.y){color:var(--text-placeholder) !important;}'+ /* CMD-1014-09：有超时才红，没超时正文色；0 = 灰 */
    '.card[onclick*="todoCardFilter(\'todo\')"]:not([data-n="0"]){border-color:var(--border-default) !important;box-shadow:inset 2px 0 0 var(--action-primary);} .card[onclick*="todoCardFilter(\'todo\')"]:not([data-n="0"]) .ds-cnum{color:var(--action-primary) !important;}'+
    '.wk-cell.wk-lunch,.wk-cell.wk-lunch.wk-cell-open:hover,.wk-lunchbar{background:var(--bg-sidebar);}'+
    /* CMD-1014-09 客人预约页选中态改驼色（浅驼底 + 驼色字 + 驼色细框）：语言切换 / 日期 / 时段 / 单选 / 首页大卡 */
    '.bk-lang button.on,.bk-day.on,.bk-slot.on{background:var(--bg-brand-subtle) !important;color:var(--action-primary) !important;border-color:var(--action-primary) !important;font-weight:700;} .bk-radio.on{border-color:var(--action-primary) !important;background:var(--bg-brand-faint) !important;}'+
    '.bk-btn[style*="padding:18px 16px"]:not(.ghost){background:var(--bg-brand-subtle);color:var(--action-primary);box-shadow:inset 0 0 0 1px var(--action-primary);}'+
    /* CMD-1014-10 ①KR / 院长日历白底卡片 ②日视图不染今天 ③不可预约加深（新样式） */
    '#kr-cal{background:var(--bg-surface);border:1px solid var(--border-default);border-radius:8px;padding:16px;box-sizing:border-box;}'+
    '#day-grid .wk-head.today{background:transparent !important;box-shadow:none !important;}'+
    '.krc-busy,.kr-busy{background:var(--bg-hover) !important;border:1px solid var(--border-strong) !important;color:var(--text-secondary) !important;}'+
    /* ④客人预约页主按钮 / 进度条改驼色 */
    '.bk-btn:not(.ghost):not(.danger){background:var(--action-primary) !important;color:var(--text-on-action) !important;} .bk-btn:not(.ghost):not(.danger):hover{background:var(--action-primary-hover) !important;} .bk-bar span{background:var(--action-primary) !important;}'+
    /* CMD-1014-12 视觉修正（新样式）：①时间轴副文字 / 午休文字提到 ≥3:1 ②侧栏底部 / 项目库「只读」 ③KR 院长头像首字母改深色 ⑥「现在」标签放最上层 */
    '[style*="font-size:9px;color:var(--dim)"]{color:var(--text-placeholder) !important;} [title^="午休"]{color:var(--text-secondary) !important;}'+
    '.sidebar-foot{color:var(--text-placeholder);} #in-projectlibrary [style*="font-size:11px;color:var(--dim)"]{color:var(--text-placeholder) !important;}'+
    '.ds-avl{color:var(--text-primary) !important;}'+
    '.wk-time.empty,.wk-time .kr,.wk-lunchbar{color:var(--text-placeholder);}'+
    '.todo-nowline{z-index:30;} .todo-nowline span{z-index:31;}'+
    '.ds-ic{position:relative;display:inline-flex;width:1.15em;height:1.15em;vertical-align:-0.2em;align-items:center;justify-content:center;} .ds-ic svg{width:100%;height:100%;} .ds-ic-t{position:absolute;width:0;height:0;overflow:hidden;font-size:0;opacity:0;}';
  document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">'+'<style id="ds-css">'+css+root+extra+'</style>');
})();
