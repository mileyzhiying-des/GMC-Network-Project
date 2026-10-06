/* shared/boot-in.js —— 印尼室长端（in.html）专用启动脚本：初始化渲染、定时器、全局监听
   由 gmc-network-prototype.html 拆分而来（2026-10-05 结构拆分）。classic script，全局函数/变量，不使用 ES module。 */


document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.me-name').forEach(function(el){ el.textContent = ME_NAME; });
  document.querySelectorAll('.in-shell').forEach(function(shell){
    var page = shell.dataset.page;
    var sSlot = shell.querySelector('.sidebar-slot');
    if(sSlot) sSlot.innerHTML = buildSidebar(page);
    var tSlot = shell.querySelector('.topbar-slot');
    if(tSlot) tSlot.innerHTML = buildTopbar(TITLES[page] || '');
  });
  /* 初始化防护（2026-10-02）：每个模块各自 try/catch，一个地方出错只在 console 记录，不让整个页面停下来 */
  [['日历与今日区块',renderCalendar],['客户管理',buildClients],['案件tab',buildCaseTabs],['案件列表',renderCaseRows],['案例库',renderLibrary],['项目库',renderProjLibrary],['通知中心',buildNotifications],['对话未读',updateChatBadge]].forEach(function(m){
    try{ m[1](); }catch(e){ console.error('[初始化失败] '+m[0], e); }
  });
  try{ buildHistoryList(); }catch(e){ console.error('[初始化失败] 医美史', e); }
  [['客户详情Timeline',buildDetailLog]].forEach(function(m){ try{ m[1](); }catch(e){ console.error('[初始化失败] '+m[0], e); } });
});

/* 每秒扫一遍占位倒计时：更新页面上的倒计时文字；超时的从占位里移除（时段自动空出），记入预约历史"占位失效" */
setInterval(function(){
  var changed = false;
  RESERVATION_PLACEHOLDERS = RESERVATION_PLACEHOLDERS.filter(function(p){
    if(!p.warned && p.expiresAt-Date.now() <= 5*60000 && p.expiresAt-Date.now() > 0){ p.warned = true; pushNotif('预约','预约占位快过期（剩 5 分钟）：'+p.phone+' '+dateLabel(p.date)+' '+p.time, {names:workingIN()}); }
    if(Date.now() >= p.expiresAt){ changed = true; PLACEHOLDER_HISTORY.push({id:p.id, phone:p.phone, date:p.date, time:p.time, status:'占位失效', link:p.link, purpose:p.purpose}); return false; }
    return true;
  });
  if(changed && CAL_MODE==='week') buildWeekGrid();
  document.querySelectorAll('[data-ph-countdown]').forEach(function(el){
    var p = RESERVATION_PLACEHOLDERS.filter(function(x){ return x.id===el.getAttribute('data-ph-countdown'); })[0];
    if(p) el.textContent = placeholderCountdownText(p);
  });
  CASE_ITEMS.forEach(function(c){ if(c.consultStatus==='awaiting_report' && !c.overdueNotified && reportOverdueNow(c)){ c.overdueNotified = true; pushNotif('面诊','等待报告超过预计时间：'+c.name+'（预计 '+(c.reportEta||'—')+'）', {caseId:c.id}); } });
  document.querySelectorAll('[data-visit-countdown]').forEach(function(el){
    var left = parseInt(el.getAttribute('data-visit-countdown'),10) + 30*60000 - demoNow().getTime();
    el.textContent = left>0 ? Math.floor(left/60000)+'分'+pad2(Math.floor(left%60000/1000))+'秒' : '已超时';
  });
}, 1000);

setInterval(function(){
  var el = document.getElementById('vc-timer'); if(!el || !VIDEO_CALL.active) return;
  var sec = Math.floor((Date.now()-VIDEO_CALL.startedAt)/1000), pad = function(n){ return (n<10?'0':'')+n; };
  el.textContent = pad(Math.floor(sec/3600))+':'+pad(Math.floor(sec%3600/60))+':'+pad(sec%60);
}, 1000);

document.addEventListener('keydown', function(e){
  var pres = document.getElementById('lib-present-overlay');
  if(pres && pres.style.display==='flex'){
    if(e.key==='Escape') closeLibPresent();
    else if(e.key==='ArrowLeft') libPresentMove(-1);
    else if(e.key==='ArrowRight') libPresentMove(1);
  } else if(e.key==='Escape'){ var v = document.getElementById('lib-viewer-overlay'); if(v) v.classList.remove('open'); }
});

document.addEventListener('click', function(){ closeBellDropdown(); });


/* 新标签页打开时按地址参数进入：?case=A000xxx（&chat=open 自动展开对话窗口；&tab=attachments 打开附件tab）、?page=in-library / in-projectlibrary。
   数据存在 localStorage 里，新标签页和当前标签页共用同一份演示数据 */
document.addEventListener('DOMContentLoaded', function(){ applyTzSetting(); });

document.addEventListener('DOMContentLoaded', function(){
  var q = new URLSearchParams(location.search), cs = q.get('case'), pg = q.get('page');
  if(!cs && !pg) return;
  nav('in-dashboard');
  if(pg && pg.indexOf('admin-')===0){ openAdminPage(pg.slice(6)); return; } /* 无权限会被导回首页 */
  if(pg && document.getElementById(pg)) nav(pg);
  if(cs){
    var c = CASE_ITEMS.filter(function(x){ return x.caseNo===cs || x.id===cs; })[0];
    if(!c){ alert('演示数据里找不到案件 '+cs+'（可能已被重置）'); return; }
    openCaseDetail(c.id);
    if(q.get('tab')){ c.activeCaseTab = q.get('tab'); renderCaseBody(c); }
    if(q.get('chat')==='open') openCaseRoom(c.id);
  }
  if(pg==='in-library' && q.get('project')){ try{ libOpenProject(q.get('project')); }catch(e){ console.error('案例库定位失败', e); } }
});

/* 登录页的"视频沟通界面示例"入口：in.html?demo=call */
document.addEventListener('DOMContentLoaded', function(){
  if(new URLSearchParams(location.search).get('demo')==='call') startDemoCall();
});

/* 点页面其他地方，关闭头像菜单 */
document.addEventListener('click', function(){ closeAvatarMenu(); });
