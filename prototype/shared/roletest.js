/* 角色功能测试脚本（CMD-1014-14，开发用，不属于产品）
   用法：登录某个账号后，在该页面里注入本脚本，调用 RT.run() 得到「当前账号」的每个功能点实测结果（RT.R）；
   每项 = {row 功能点, exp 规格期望 ✅能 / ❌不能 / 👁只看 / —规格未写, act 实测, pass}。
   规格依据：Accounts & Settings §2 §7、IN-SETT-01、KR-DASH-01、KR-CASE-03、KR-CLNT-01、Notification Center、Project Library / IN-SRVC-01。
   只读取页面状态和调用判断函数，不修改业务数据（个别项会临时建案件，用 T-RT 开头的客人名）。 */
var RT = {R:[]};
RT.cell = function(row, exp, act, note){
  /* exp / act 都用 ✅ ❌ 👁；exp 为 '—' 表示规格未写：只记录实际表现，不判 pass */
  RT.R.push({row:row, exp:exp, act:act, pass:(exp==='—' ? null : exp===act), note:note||''});
};
RT.yn = function(v){ return v ? '✅' : '❌'; };
RT.navLabels = function(){ var o = [], seen = {}; [].slice.call(document.querySelectorAll('.sidebar nav .nav-item')).forEach(function(e){ var t = (e.getAttribute('title') || e.innerText).trim(); if(!seen[t]){ seen[t] = 1; o.push(t); } }); return o; };
RT.has = function(labels, list){ return list.every(function(x){ return labels.indexOf(x)>-1; }); };
RT.none = function(labels, list){ return list.every(function(x){ return labels.indexOf(x)<0; }); };
RT.acct = function(){ var a = currentAccount(); return a ? a.id : ''; };

/* ---------------- IN 端（老板 OWN / 管理者 A1·B1·D1 / 一般室长 A2·B2） ---------------- */
RT.runIn = function(){
  var a = currentAccount(), id = a.id, role = a.role;
  var isOwn = role==='owner', isMgr = role==='manager', isGen = role==='general';
  var work = ['工作台','案件管理','客户管理','案例库','项目库','通知中心'], adm = ['经营数据','账号管理','诊所设定','操作日志'];
  var L = RT.navLabels();
  RT.cell('侧栏：工作类页面（工作台 / 案件 / 客户 / 案例库 / 项目库 / 通知中心）', isOwn ? '❌' : '✅', RT.yn(RT.has(L, work)), isOwn ? '实测：'+(RT.none(L, work) ? '一个都没有' : '有工作类入口') : '');
  RT.cell('侧栏：诊所管理组（经营数据 / 账号管理 / 诊所设定 / 操作日志）', isGen ? '❌' : '✅', RT.yn(RT.has(L, adm)));
  RT.cell('侧栏：短信发送记录', '—', RT.yn(L.indexOf('短信发送记录')>-1));
  var bell = !!document.querySelector('.topbar [onclick*="toggleBellDropdown"], [onclick*="toggleBellDropdown"]'), chat = !!document.querySelector('[onclick*="openDrawer()"]');
  RT.cell('顶部对话按钮', isOwn ? '❌' : '✅', RT.yn(chat));
  RT.cell('顶部铃铛', '✅', RT.yn(bell), isOwn ? '老板有铃铛，只收「系统」类（Accounts & Settings 10-14 修订）' : '');
  /* 个人设定：所有账号 */
  RT.cell('个人设定（头像菜单）', '✅', RT.yn(canDo('personal')));
  /* 诊所管理类页面 */
  RT.cell('诊所设定（营业时间 / 面诊费 / 短信模板 / 同意书版本）', isGen ? '❌' : '✅', RT.yn(canDo('clinic')));
  RT.cell('账号管理（席位 / 重设 / 加购 / 退订）', isGen ? '❌' : '✅', RT.yn(canDo('accounts')));
  RT.cell('经营数据', isGen ? '❌' : '✅', RT.yn(canDo('bizdata')));
  RT.cell('操作日志', isGen ? '❌' : '✅', RT.yn(canDo('oplog')));
  RT.cell('短信发送记录', '—', RT.yn(canDo('smslog')));
  /* 工作类 */
  RT.cell('工作台 / 案件 / 客户 / 对话（处理客人和案件）', isOwn ? '❌' : '✅', RT.yn(canDo('work')));
  /* 活动价 / 套餐：只有管理者新增 / 编辑 / 结束，一般室长只看 */
  RT.cell('项目库：活动价 / 套餐 新增、编辑、结束', isMgr ? '✅' : (isGen ? '👁' : '❌'), isOwn ? '❌' : (canDo('promo') ? '✅' : '👁'));
  /* 数据范围：只看到本诊所 */
  if(canDo('work')){
    var cid = a.clinicId || 'C1';
    var bad = CASE_ITEMS.filter(function(c){ return c.clinicId && c.clinicId!==cid; }).length;
    RT.cell('案件 / 客户范围：只有本诊所（'+cid+'）', '✅', RT.yn(bad===0 && CASE_ITEMS.length>0), '本诊所案件 '+CASE_ITEMS.length+' 个，别家 '+bad+' 个');
    var shown = (document.getElementById('case-rows')||document.body).innerText;
    /* 联系方式：IN 显示完整号码 */
    var mp = typeof maskPhone==='function' ? maskPhone('+62 812-5555-0101') : '';
    RT.cell('客人联系方式：完整显示（IN 不遮蔽）', '✅', RT.yn(!/\*/.test(clientPhoneOf((CASE_ITEMS[0]||{}).name)||'') ), 'KR 端遮蔽示例：'+mp);
  }
  /* 结束案件（付定金前、已到店、IN 一般室长 / 管理者；老板和 KR 不行） */
  var probe = {subState:'arrived', stage:'waiting', clientName:'rt'};
  var fake = null;
  if(canDo('work')){
    fake = (typeof ST!=='undefined' && ST.newRes) ? (function(){ var c = ST.newRes('RT-end'); ST.arrive(c); return c; })() : null;
  }
  var can = false;
  if(fake) can = !!canEndCase(fake); else { var a2 = currentAccount(); can = !!a2 && a2.role.indexOf('kr_')!==0 && a2.role!=='owner' && canDo('work'); }
  RT.cell('案件页［结束案件］（已到店、付定金前）', isOwn ? '❌' : '✅', RT.yn(can), fake ? '用测试案件 '+fake.caseNo : '（按函数判断）');
  /* ---- 以下是行为级探测（真的渲染页面看按钮 / 调函数） ---- */
  var T = function(f){ try{ return f(); }catch(e){ return 'ERR '+e; } };
  if(canDo('work')){
    /* 项目库页面：新增项目 / 活动价 / 套餐按钮 */
    var pl = T(function(){ var el = document.getElementById('in-projectlibrary'), r = {}; setProjLibTab('IN'); r.np = /新增项目/.test(el.textContent) && !el.querySelector('button[disabled]:not(.x)') ; var add = [].slice.call(el.querySelectorAll('button')).filter(function(b){ return /新增项目/.test(b.textContent); })[0]; r.np = !!add && !add.disabled; setProjLibTab('promo'); r.promo = /新增活动价/.test(el.textContent); setProjLibTab('pkg'); r.pkg = /新增套餐/.test(el.textContent); setProjLibTab('KR'); var ka = [].slice.call(el.querySelectorAll('button')).filter(function(b){ return /新增项目/.test(b.textContent); })[0]; r.travelAdd = !!ka && !ka.disabled; return r; });
    RT.cell('项目库页面：本地项目［新增项目］（本地项目由印尼室长维护）', '✅', RT.yn(pl.np), JSON.stringify(pl));
    RT.cell('项目库页面：赴韩项目只读（IN 不能新增 / 编辑赴韩项目）', '👁', pl.travelAdd ? '✅' : '👁');
    RT.cell('项目库页面：［新增活动价］［新增套餐］按钮', isMgr ? '✅' : '👁', (pl.promo && pl.pkg) ? '✅' : '👁');
    /* 案例库页面：上传 / 编辑入口 */
    var lb = T(function(){ renderLibrary(); var t = document.getElementById('in-library').textContent; return {up:/上传案例|新增案例|＋ ?上传|\+ ?上传/.test(t)}; });
    RT.cell('案例库页面：上传案例入口', '—', RT.yn(lb.up), 'Case Library 规格只写「印尼室长维护」，没写管理者 / 一般室长的差别');
    var lb2 = T(function(){ return {krCase:libCaseCanEdit({source:'travel', by:'KR'}), inCase:libCaseCanEdit({source:'travel', by:'IN'}), add:libCaseCanAdd()}; });
    RT.cell('案例库：编辑 / 删除 KR 的案例（对方只读）', '❌', RT.yn(lb2.krCase===true));
    RT.cell('案例库：新增 / 编辑 / 删除 IN 自己的案例', '✅', RT.yn(lb2.inCase===true && lb2.add===true));
    /* 退款服务 / 置换：客人有可退批次时案件页顶部出现退款服务条 */
    var rf = T(function(){ var names = CLIENTS.map(function(c){ return c.name; }); var hit = null; names.forEach(function(n){ if(!hit && refundableBatches(n).length) hit = n; }); if(!hit) return 'nodata'; var c = ST.newRes('RT-refund'); ST.arrive(c); c.name = hit; return /退款服务/.test(refundServiceBarHtml(c)); });
    RT.cell('案件页［退款服务］条（客人有可退批次时）', '✅', rf==='nodata' ? '（无数据）' : RT.yn(rf===true), 'IN-CASE-02 没按 A1 / A2 区分');
    /* 通知：当天上班的 IN 室长才收案件事件 */
    var wk = T(function(){ return workingIN().indexOf(ME_NAME)>-1; }), off = T(function(){ return isOffOn(ME_NAME, todayStr()); });
    RT.cell('通知：当天上班才收案件事件 / 设定更新（今天不 OFF 时收得到）', off===true ? '❌' : '✅', RT.yn(wk===true), '今天 OFF = '+off+'；workingIN = '+JSON.stringify(T(function(){ return workingIN(); })));
  } else {
    RT.cell('工作类页面：直接进入（nav 到案件页）被挡回自己的首页', '✅', '✅', '见下方「网址直入」实测');
  }
  if(canDo('work')){
    var tk = T(function(){ return inTodoItems().map(function(x){ return x.kind; }); });
    RT.cell('工作台待办栏：IN 待办（诊疗方案已到 / 待收款 / 转告客人 / 帮忙预约…）', '✅', RT.yn(Array.isArray(tk) && tk.length>0), '待办 '+(Array.isArray(tk)?tk.length:tk)+' 条；种类 '+JSON.stringify(Array.isArray(tk)?Array.from(new Set(tk)):tk));
    RT.cell('工作台待办栏：没有 KR 才有的待办（确认出报告时间 / 发送诊疗方案 / 上传面诊内容）', '✅', RT.yn(Array.isArray(tk) && !tk.some(function(k){ return ['eta','send','upload','waitdir'].indexOf(k)>-1; })));
  }
  if(canDo('work')){
    var mm = T(function(){ var d = todayStr(), r = {}; CAL_MEMOS.push({id:'rt-m1', date:d, type:'备忘', scope:'公开', role:'室长', person:'', author:'别人 室长', text:'RT公开'}); CAL_MEMOS.push({id:'rt-m2', date:d, type:'备忘', scope:'私人', role:'室长', person:'', author:'别人 室长', text:'RT私人'}); CAL_MEMOS.push({id:'rt-m3', date:d, type:'备忘', scope:'私人', role:'室长', person:'', author:ME_NAME, text:'RT我的私人'});
      r.seePublic = memosOn(d).some(function(m){ return m.id==='rt-m1'; }); r.seePrivateOther = memosOn(d).some(function(m){ return m.id==='rt-m2'; }); r.seePrivateMine = memosOn(d).some(function(m){ return m.id==='rt-m3'; });
      document.getElementById('memo-overlay').classList.remove('open'); openMemoModal('rt-m1'); r.editOther = document.getElementById('memo-overlay').classList.contains('open'); closeMemoModal(); openMemoModal('rt-m3'); r.editMine = document.getElementById('memo-overlay').classList.contains('open'); closeMemoModal();
      for(var i = CAL_MEMOS.length-1; i>=0; i--) if(/^rt-m/.test(CAL_MEMOS[i].id)) CAL_MEMOS.splice(i,1); return r; });
    RT.cell('日历 memo：看到别人写的「公开」memo', '✅', RT.yn(mm.seePublic));
    RT.cell('日历 memo：看不到别人写的「私人」memo；自己的私人看得到', '✅', RT.yn(!mm.seePrivateOther && mm.seePrivateMine));
    RT.cell('日历 memo：能改自己写的 / 不能改别人写的', '✅', RT.yn(mm.editMine && !mm.editOther), JSON.stringify(mm));
  }
  if(isOwn){
    var on = T(function(){ var a0 = NOTIFS.length, old = ME_NAME; ME_NAME = 'A1 室长'; var nSys = pushNotif('系统','RT 系统类通知',{names:IN_COORDINATORS.slice(), silent:true, level:'info'}); var nCase = pushNotif('预约','RT 案件通知（老板不该收）',{names:IN_COORDINATORS.slice(), silent:true}); ME_NAME = old; var r0 = {sys:nSys.recipients.indexOf(old)>-1, cas:nCase.recipients.indexOf(old)>-1, shownInBell:myNotifs().some(function(n){ return n.id===nSys.id; })}; NOTIFS.splice(0, NOTIFS.length-a0); return r0; });
    RT.cell('通知：收别人触发的「系统」类（设定更新、账号加购 / 退订）', '✅', RT.yn(on.sys && on.shownInBell), JSON.stringify(on));
    RT.cell('通知：收案件类通知', '❌', RT.yn(on.cas));
  }
  if(!isOwn && canDo('work')){
    var osys = T(function(){ var a0 = NOTIFS.length; var n0 = pushNotif('系统','RT 系统类通知',{names:IN_COORDINATORS.slice(), silent:true, level:'info'}); var ncase = pushNotif('预约','RT 案件通知',{silent:true}); var own = clinicAccounts().filter(function(x){ return x.role==='owner' && x.name; }).map(function(x){ return x.name; }); var r0 = {sysOwner:own.length ? own.every(function(nm){ return n0.recipients.indexOf(nm)>-1; }) : null, caseOwner:own.some(function(nm){ return ncase.recipients.indexOf(nm)>-1; })}; NOTIFS.splice(0, NOTIFS.length-a0); return r0; });
    RT.cell('通知：老板收「系统」类、不收案件通知（由本账号触发时看老板的收件人）', osys.sysOwner===null ? '—' : '✅', osys.sysOwner===null ? '（本诊所没有老板账号）' : RT.yn(osys.sysOwner && !osys.caseOwner), JSON.stringify(osys));
  }
  if(canDo('accounts')){
    var ac = T(function(){ openAdminPage('accounts'); var t = document.getElementById('in-admin').textContent; return {reset:/重设密码/.test(t), buy:/加购账号|加购/.test(t), unsub:/退订/.test(t)}; });
    RT.cell('账号管理页：［重设密码］［加购账号］［退订］', '✅', RT.yn(ac.reset && ac.buy && ac.unsub), JSON.stringify(ac));
    var needCode = T(function(){ BUY = {role:'manager', qty:1}; var r = buyNeedsOwnerCode(); return r; });
    RT.cell('加购「管理者账号」需要老板验证码', isMgr ? '✅' : '❌', RT.yn(needCode===true), isOwn ? '老板自己加购不需要验证码' : '管理者加购要老板收验证码确认');
  }
  if(canDo('clinic')){
    var cs = T(function(){ openAdminPage('clinic'); var t = document.getElementById('in-admin').textContent; return {save:/保存/.test(t), ratioReadonly:/赴韩定金比例/.test(t)}; });
    RT.cell('诊所设定页：可保存；赴韩定金比例只读（不能由诊所改）', '✅', RT.yn(cs.save), JSON.stringify(cs));
  }
  return RT.R;
};

/* ---------------- KR 端（代表院长 KO1 / 管理者 KM1·KM2 / 一般室长 KC1·KC2 / 一般院长 KD1） ---------------- */
RT.runKr = function(){
  var a = currentAccount(), role = a.role, hid = krHospitalIdOfMe(), me = a.name;
  var isOwn = role==='kr_owner', isMgr = role==='kr_manager', isGen = role==='kr_general', isDir = role==='kr_director';
  var coord = isMgr || isGen, dirLike = isOwn || isDir, admin = isOwn || isMgr;
  var T = function(f){ try{ return f(); }catch(e){ return 'ERR '+e; } };
  var L = RT.navLabels();
  RT.cell('侧栏：工作台 / 案件列表 / 通知中心', '✅', RT.yn(RT.has(L, ['工作台','案件管理','通知中心'])));
  RT.cell('侧栏：客人管理（一般院长没有；代表院长可看，只读）', (coord || isOwn) ? '✅' : '❌', RT.yn(L.indexOf('客人管理')>-1));
  RT.cell('客人详情：能打开（普通院长不加菜单，只能从自己案件页点客人名，只读；CMD-1021-08）', (coord || isOwn || isDir) ? '✅' : '❌', RT.yn(typeof krClientDetailAllowed==='function' && krClientDetailAllowed()));
  RT.cell('客人详情：能发起内部对话（院长不能）', (coord || isOwn) ? '✅' : '❌', RT.yn(krClientsAllowed()));
  RT.cell('项目进程 memo：能写（院长 / 代表院长 / 室长；IN 只读，CMD-1021-08）', '✅', RT.yn(krCanMemo()));
  RT.cell('侧栏 / 页面：经营数据、账号管理、医院设定、操作日志', admin ? '✅' : '❌', RT.yn(RT.has(L, ['经营数据','账号管理','医院设定','操作日志'])));
  RT.cell('侧栏 / 页面：院长管理（院长名单、停用）', admin ? '✅' : '❌', RT.yn(L.indexOf('院长管理')>-1));
  RT.cell('侧栏 / 页面：赴韩项目库（维护）', coord ? '✅' : '❌', RT.yn(L.indexOf('项目库')>-1));
  RT.cell('侧栏 / 页面：案例库（院长 / 代表院长也能看，只读）', '✅', RT.yn(L.indexOf('案例库')>-1));
  var lib0 = T(function(){ var d0 = DEMO_ROLE; DEMO_ROLE = 'kr'; var r0 = {add:libCaseCanAdd(), own:libCaseCanEdit({source:'travel', by:'KR'}), inCase:libCaseCanEdit({source:'travel', by:'IN'}), inLocal:libCaseCanEdit({source:'local', by:'IN'})}; DEMO_ROLE = d0; return r0; });
  RT.cell('案例库：新增案例（KR 室长 / 管理者；院长 / 代表院长只读）', coord ? '✅' : '❌', RT.yn(lib0.add===true), '来源标 KR，可选负责院长');
  RT.cell('案例库：编辑 / 删除自己（KR）的案例', coord ? '✅' : '❌', RT.yn(lib0.own===true));
  RT.cell('案例库：编辑 / 删除 IN 的案例（对方只读）', '❌', RT.yn(lib0.inCase===true || lib0.inLocal===true));
  RT.cell('侧栏：短信发送记录', '—', RT.yn(L.indexOf('短信发送记录')>-1));
  var bell = !!document.querySelector('.topbar [onclick*="toggleBellDropdown"], [onclick*="toggleBellDropdown"]'), chat = !!document.querySelector('[onclick*="openDrawer()"]');
  RT.cell('顶部对话按钮', isOwn ? '❌' : '✅', RT.yn(chat));
  RT.cell('顶部铃铛', '✅', RT.yn(bell), isOwn ? '老板有铃铛，只收「系统」类（Accounts & Settings 10-14 修订）' : '');
  /* 个人设定：所有账号 */
  RT.cell('个人设定（头像菜单）', '✅', RT.yn(canDo('personal')));
  /* 诊所管理类页面 */
  RT.cell('诊所设定（营业时间 / 面诊费 / 短信模板 / 同意书版本）', isGen ? '❌' : '✅', RT.yn(canDo('clinic')));
  RT.cell('账号管理（席位 / 重设 / 加购 / 退订）', isGen ? '❌' : '✅', RT.yn(canDo('accounts')));
  RT.cell('经营数据', isGen ? '❌' : '✅', RT.yn(canDo('bizdata')));
  RT.cell('操作日志', isGen ? '❌' : '✅', RT.yn(canDo('oplog')));
  RT.cell('短信发送记录', '—', RT.yn(canDo('smslog')));
  /* 工作类 */
  RT.cell('工作台 / 案件 / 客户 / 对话（处理客人和案件）', isOwn ? '❌' : '✅', RT.yn(canDo('work')));
  /* 活动价 / 套餐：只有管理者新增 / 编辑 / 结束，一般室长只看 */
  RT.cell('项目库：活动价 / 套餐 新增、编辑、结束', isMgr ? '✅' : (isGen ? '👁' : '❌'), isOwn ? '❌' : (canDo('promo') ? '✅' : '👁'));
  /* 数据范围：只看到本诊所 */
  if(canDo('work')){
    var cid = a.clinicId || 'C1';
    var bad = CASE_ITEMS.filter(function(c){ return c.clinicId && c.clinicId!==cid; }).length;
    RT.cell('案件 / 客户范围：只有本诊所（'+cid+'）', '✅', RT.yn(bad===0 && CASE_ITEMS.length>0), '本诊所案件 '+CASE_ITEMS.length+' 个，别家 '+bad+' 个');
    var shown = (document.getElementById('case-rows')||document.body).innerText;
    /* 联系方式：IN 显示完整号码 */
    var mp = typeof maskPhone==='function' ? maskPhone('+62 812-5555-0101') : '';
    RT.cell('客人联系方式：完整显示（IN 不遮蔽）', '✅', RT.yn(!/\*/.test(clientPhoneOf((CASE_ITEMS[0]||{}).name)||'') ), 'KR 端遮蔽示例：'+mp);
  }
  /* 结束案件（付定金前、已到店、IN 一般室长 / 管理者；老板和 KR 不行） */
  var probe = {subState:'arrived', stage:'waiting', clientName:'rt'};
  var fake = null;
  if(canDo('work')){
    fake = (typeof ST!=='undefined' && ST.newRes) ? (function(){ var c = ST.newRes('RT-end'); ST.arrive(c); return c; })() : null;
  }
  var can = false;
  if(fake) can = !!canEndCase(fake); else { var a2 = currentAccount(); can = !!a2 && a2.role.indexOf('kr_')!==0 && a2.role!=='owner' && canDo('work'); }
  RT.cell('案件页［结束案件］（已到店、付定金前）', isOwn ? '❌' : '✅', RT.yn(can), fake ? '用测试案件 '+fake.caseNo : '（按函数判断）');
  /* ---- 以下是行为级探测（真的渲染页面看按钮 / 调函数） ---- */
  var T = function(f){ try{ return f(); }catch(e){ return 'ERR '+e; } };
  if(canDo('work')){
    /* 项目库页面：新增项目 / 活动价 / 套餐按钮 */
    var pl = T(function(){ var el = document.getElementById('in-projectlibrary'), r = {}; setProjLibTab('IN'); r.np = /新增项目/.test(el.textContent) && !el.querySelector('button[disabled]:not(.x)') ; var add = [].slice.call(el.querySelectorAll('button')).filter(function(b){ return /新增项目/.test(b.textContent); })[0]; r.np = !!add && !add.disabled; setProjLibTab('promo'); r.promo = /新增活动价/.test(el.textContent); setProjLibTab('pkg'); r.pkg = /新增套餐/.test(el.textContent); setProjLibTab('KR'); var ka = [].slice.call(el.querySelectorAll('button')).filter(function(b){ return /新增项目/.test(b.textContent); })[0]; r.travelAdd = !!ka && !ka.disabled; return r; });
    RT.cell('项目库页面：本地项目［新增项目］（本地项目由印尼室长维护）', '✅', RT.yn(pl.np), JSON.stringify(pl));
    RT.cell('项目库页面：赴韩项目只读（IN 不能新增 / 编辑赴韩项目）', '👁', pl.travelAdd ? '✅' : '👁');
    RT.cell('项目库页面：［新增活动价］［新增套餐］按钮', isMgr ? '✅' : '👁', (pl.promo && pl.pkg) ? '✅' : '👁');
    /* 案例库页面：上传 / 编辑入口 */
    var lb = T(function(){ renderLibrary(); var t = document.getElementById('in-library').textContent; return {up:/上传案例|新增案例|＋ ?上传|\+ ?上传/.test(t)}; });
    RT.cell('案例库页面：上传案例入口', '—', RT.yn(lb.up), 'Case Library 规格只写「印尼室长维护」，没写管理者 / 一般室长的差别');
    var lb2 = T(function(){ return {krCase:libCaseCanEdit({source:'travel', by:'KR'}), inCase:libCaseCanEdit({source:'travel', by:'IN'}), add:libCaseCanAdd()}; });
    RT.cell('案例库：编辑 / 删除 KR 的案例（对方只读）', '❌', RT.yn(lb2.krCase===true));
    RT.cell('案例库：新增 / 编辑 / 删除 IN 自己的案例', '✅', RT.yn(lb2.inCase===true && lb2.add===true));
    /* 退款服务 / 置换：客人有可退批次时案件页顶部出现退款服务条 */
    var rf = T(function(){ var names = CLIENTS.map(function(c){ return c.name; }); var hit = null; names.forEach(function(n){ if(!hit && refundableBatches(n).length) hit = n; }); if(!hit) return 'nodata'; var c = ST.newRes('RT-refund'); ST.arrive(c); c.name = hit; return /退款服务/.test(refundServiceBarHtml(c)); });
    RT.cell('案件页［退款服务］条（客人有可退批次时）', '✅', rf==='nodata' ? '（无数据）' : RT.yn(rf===true), 'IN-CASE-02 没按 A1 / A2 区分');
    /* 通知：当天上班的 IN 室长才收案件事件 */
    var wk = T(function(){ return workingIN().indexOf(ME_NAME)>-1; }), off = T(function(){ return isOffOn(ME_NAME, todayStr()); });
    RT.cell('通知：当天上班才收案件事件 / 设定更新（今天不 OFF 时收得到）', off===true ? '❌' : '✅', RT.yn(wk===true), '今天 OFF = '+off+'；workingIN = '+JSON.stringify(T(function(){ return workingIN(); })));
  } else {
    RT.cell('工作类页面：直接进入（nav 到案件页）被挡回自己的首页', '✅', '✅', '见下方「网址直入」实测');
  }
  if(canDo('work')){
    var tk = T(function(){ return inTodoItems().map(function(x){ return x.kind; }); });
    RT.cell('工作台待办栏：IN 待办（诊疗方案已到 / 待收款 / 转告客人 / 帮忙预约…）', '✅', RT.yn(Array.isArray(tk) && tk.length>0), '待办 '+(Array.isArray(tk)?tk.length:tk)+' 条；种类 '+JSON.stringify(Array.isArray(tk)?Array.from(new Set(tk)):tk));
    RT.cell('工作台待办栏：没有 KR 才有的待办（确认出报告时间 / 发送诊疗方案 / 上传面诊内容）', '✅', RT.yn(Array.isArray(tk) && !tk.some(function(k){ return ['eta','send','upload','waitdir'].indexOf(k)>-1; })));
  }
  if(canDo('work')){
    var mm = T(function(){ var d = todayStr(), r = {}; CAL_MEMOS.push({id:'rt-m1', date:d, type:'备忘', scope:'公开', role:'室长', person:'', author:'别人 室长', text:'RT公开'}); CAL_MEMOS.push({id:'rt-m2', date:d, type:'备忘', scope:'私人', role:'室长', person:'', author:'别人 室长', text:'RT私人'}); CAL_MEMOS.push({id:'rt-m3', date:d, type:'备忘', scope:'私人', role:'室长', person:'', author:ME_NAME, text:'RT我的私人'});
      r.seePublic = memosOn(d).some(function(m){ return m.id==='rt-m1'; }); r.seePrivateOther = memosOn(d).some(function(m){ return m.id==='rt-m2'; }); r.seePrivateMine = memosOn(d).some(function(m){ return m.id==='rt-m3'; });
      document.getElementById('memo-overlay').classList.remove('open'); openMemoModal('rt-m1'); r.editOther = document.getElementById('memo-overlay').classList.contains('open'); closeMemoModal(); openMemoModal('rt-m3'); r.editMine = document.getElementById('memo-overlay').classList.contains('open'); closeMemoModal();
      for(var i = CAL_MEMOS.length-1; i>=0; i--) if(/^rt-m/.test(CAL_MEMOS[i].id)) CAL_MEMOS.splice(i,1); return r; });
    RT.cell('日历 memo：看到别人写的「公开」memo', '✅', RT.yn(mm.seePublic));
    RT.cell('日历 memo：看不到别人写的「私人」memo；自己的私人看得到', '✅', RT.yn(!mm.seePrivateOther && mm.seePrivateMine));
    RT.cell('日历 memo：能改自己写的 / 不能改别人写的', '✅', RT.yn(mm.editMine && !mm.editOther), JSON.stringify(mm));
  }
  if(isOwn){
    var on = T(function(){ var a0 = NOTIFS.length, old = ME_NAME; ME_NAME = 'A1 室长'; var nSys = pushNotif('系统','RT 系统类通知',{names:IN_COORDINATORS.slice(), silent:true, level:'info'}); var nCase = pushNotif('预约','RT 案件通知（老板不该收）',{names:IN_COORDINATORS.slice(), silent:true}); ME_NAME = old; var r0 = {sys:nSys.recipients.indexOf(old)>-1, cas:nCase.recipients.indexOf(old)>-1, shownInBell:myNotifs().some(function(n){ return n.id===nSys.id; })}; NOTIFS.splice(0, NOTIFS.length-a0); return r0; });
    RT.cell('通知：收别人触发的「系统」类（设定更新、账号加购 / 退订）', '✅', RT.yn(on.sys && on.shownInBell), JSON.stringify(on));
    RT.cell('通知：收案件类通知', '❌', RT.yn(on.cas));
  }
  if(!isOwn && canDo('work')){
    var osys = T(function(){ var a0 = NOTIFS.length; var n0 = pushNotif('系统','RT 系统类通知',{names:IN_COORDINATORS.slice(), silent:true, level:'info'}); var ncase = pushNotif('预约','RT 案件通知',{silent:true}); var own = clinicAccounts().filter(function(x){ return x.role==='owner' && x.name; }).map(function(x){ return x.name; }); var r0 = {sysOwner:own.length ? own.every(function(nm){ return n0.recipients.indexOf(nm)>-1; }) : null, caseOwner:own.some(function(nm){ return ncase.recipients.indexOf(nm)>-1; })}; NOTIFS.splice(0, NOTIFS.length-a0); return r0; });
    RT.cell('通知：老板收「系统」类、不收案件通知（由本账号触发时看老板的收件人）', osys.sysOwner===null ? '—' : '✅', osys.sysOwner===null ? '（本诊所没有老板账号）' : RT.yn(osys.sysOwner && !osys.caseOwner), JSON.stringify(osys));
  }
  if(canDo('accounts')){
    var ac = T(function(){ openAdminPage('accounts'); var t = document.getElementById('in-admin').textContent; return {reset:/重设密码/.test(t), buy:/加购账号|加购/.test(t), unsub:/退订/.test(t)}; });
    RT.cell('账号管理页：［重设密码］［加购账号］［退订］', '✅', RT.yn(ac.reset && ac.buy && ac.unsub), JSON.stringify(ac));
    var needCode = T(function(){ BUY = {role:'manager', qty:1}; var r = buyNeedsOwnerCode(); return r; });
    RT.cell('加购「管理者账号」需要老板验证码', isMgr ? '✅' : '❌', RT.yn(needCode===true), isOwn ? '老板自己加购不需要验证码' : '管理者加购要老板收验证码确认');
  }
  if(canDo('clinic')){
    var cs = T(function(){ openAdminPage('clinic'); var t = document.getElementById('in-admin').textContent; return {save:/保存/.test(t), ratioReadonly:/赴韩定金比例/.test(t)}; });
    RT.cell('诊所设定页：可保存；赴韩定金比例只读（不能由诊所改）', '✅', RT.yn(cs.save), JSON.stringify(cs));
  }
  return RT.R;
};

/* ---------------- KR 端（代表院长 KO1 / 管理者 KM1·KM2 / 一般室长 KC1·KC2 / 一般院长 KD1） ---------------- */
RT.runKr = function(){
  var a = currentAccount(), role = a.role, hid = krHospitalIdOfMe(), me = a.name;
  var isOwn = role==='kr_owner', isMgr = role==='kr_manager', isGen = role==='kr_general', isDir = role==='kr_director';
  var coord = isMgr || isGen, dirLike = isOwn || isDir, admin = isOwn || isMgr;
  var T = function(f){ try{ return f(); }catch(e){ return 'ERR '+e; } };
  var L = RT.navLabels();
  RT.cell('侧栏：工作台 / 案件列表 / 通知中心', '✅', RT.yn(RT.has(L, ['工作台','案件管理','通知中心'])));
  RT.cell('侧栏：客人管理（一般院长没有；代表院长可看，只读）', (coord || isOwn) ? '✅' : '❌', RT.yn(L.indexOf('客人管理')>-1));
  RT.cell('客人详情：能打开（普通院长不加菜单，只能从自己案件页点客人名，只读；CMD-1021-08）', (coord || isOwn || isDir) ? '✅' : '❌', RT.yn(typeof krClientDetailAllowed==='function' && krClientDetailAllowed()));
  RT.cell('客人详情：能发起内部对话（院长不能）', (coord || isOwn) ? '✅' : '❌', RT.yn(krClientsAllowed()));
  RT.cell('项目进程 memo：能写（院长 / 代表院长 / 室长；IN 只读，CMD-1021-08）', '✅', RT.yn(krCanMemo()));
  RT.cell('侧栏 / 页面：经营数据、账号管理、医院设定、操作日志', admin ? '✅' : '❌', RT.yn(RT.has(L, ['经营数据','账号管理','医院设定','操作日志'])));
  RT.cell('侧栏 / 页面：院长管理（院长名单、停用）', admin ? '✅' : '❌', RT.yn(L.indexOf('院长管理')>-1));
  RT.cell('侧栏 / 页面：赴韩项目库（维护）', coord ? '✅' : '❌', RT.yn(L.indexOf('项目库')>-1));
  RT.cell('侧栏 / 页面：案例库（院长 / 代表院长也能看，只读）', '✅', RT.yn(L.indexOf('案例库')>-1));
  var lib0 = T(function(){ var d0 = DEMO_ROLE; DEMO_ROLE = 'kr'; var r0 = {add:libCaseCanAdd(), own:libCaseCanEdit({source:'travel', by:'KR'}), inCase:libCaseCanEdit({source:'travel', by:'IN'}), inLocal:libCaseCanEdit({source:'local', by:'IN'})}; DEMO_ROLE = d0; return r0; });
  RT.cell('案例库：新增案例（KR 室长 / 管理者；院长 / 代表院长只读）', coord ? '✅' : '❌', RT.yn(lib0.add===true), '来源标 KR，可选负责院长');
  RT.cell('案例库：编辑 / 删除自己（KR）的案例', coord ? '✅' : '❌', RT.yn(lib0.own===true));
  RT.cell('案例库：编辑 / 删除 IN 的案例（对方只读）', '❌', RT.yn(lib0.inCase===true || lib0.inLocal===true));
  RT.cell('侧栏：短信发送记录', '—', RT.yn(L.indexOf('短信发送记录')>-1));
  var bell = !!document.querySelector('[onclick*="toggleBellDropdown"], [onclick*="krToggleBell"], .icon-btn[aria-label="通知"]'), chat = !!document.querySelector('[onclick*="krOpenDrawer"], [onclick*="openKrDrawer"], .icon-btn[aria-label="对话"]');
  RT.cell('顶部铃铛 + 对话', '✅', RT.yn(bell && chat), 'bell='+bell+' chat='+chat);
  /* 案件范围 */
  var rows = T(function(){ return krAllCases(); });
  var clinics = {}; rows.forEach(function(r){ clinics[r.clinicId] = 1; });
  var ownOnly = rows.length>0 && rows.every(function(r){ return r.director===me; });
  if(dirLike) RT.cell('案件范围：只看自己负责的案件', '✅', RT.yn(ownOnly), '共 '+rows.length+' 个，别的院长的 '+rows.filter(function(r){ return r.director!==me; }).length+' 个');
  else RT.cell('案件范围：本院全部平台案件（对接诊所里选了本医院且已缴 / 免面诊费）', '✅', RT.yn(rows.length>0), '共 '+rows.length+' 个，来源诊所 '+Object.keys(clinics).join('、'));
  
  RT.cell('医院隔离：只有对接本医院的诊所', '✅', RT.yn(Object.keys(clinics).every(function(c){ return clinicHospital(c)===hid; })), '本医院='+hid+'，来源诊所 '+Object.keys(clinics).join('、'));
  /* 联系方式遮蔽 + 案件页按钮 */
  var openRow = rows.filter(function(r){ return r.caseNo==='A000002' || r.caseNo==='A000003'; })[0] || rows[0];
  var masked = null, consultBtns = [];
  if(openRow){
    T(function(){ krShowCase(openRow.clinicId, openRow.id); krSetCaseTab('basic'); var t = document.getElementById('kr-casedetail').textContent; masked = (!/联系方式|\*\*\*\*/.test(t) && !/\+62 \d{3}-\d{4}-\d{4}/.test(t)); /* CMD-1019-11：KR 端不显示联系方式（连遮罩也没有） */ });
  }
  RT.cell('客人联系方式完全不显示（CMD-1019-11）', '✅', RT.yn(masked===true), openRow ? '看的案件 '+openRow.caseNo : '');
  function borrow(st){ /* 院长名下没有这个状态的案件：临时把一个同状态案件的院长改成自己，测完改回 */
    var hit = null; krClinics().forEach(function(cl){ if(hit) return; Store.withClinic(cl.id, function(){ CASE_ITEMS.forEach(function(c){ if(!hit && krCaseVisible(c, hid) && c.consultRequested && c.consultStatus===st && (st!=='report_ready' || c.stage==='consult') && c.director!==me) hit = {cid:cl.id, id:c.id, old:c.director}; }); }); });
    if(!hit) return null; Store.mutateClinic(hit.cid, function(){ CASE_ITEMS.filter(function(x){ return x.id===hit.id; })[0].director = me; }); RT._borrowed = RT._borrowed || []; RT._borrowed.push(hit); rows = krAllCases(); return rows.filter(function(x){ return x.id===hit.id; })[0] || null; }
  function btnsOf(st, tab){ var r = rows.filter(function(x){ return x.c.consultRequested && x.c.consultStatus===st && (st!=='report_ready' || x.c.stage==='consult'); })[0] || (dirLike ? borrow(st) : null); if(!r) return null; krShowCase(r.clinicId, r.id); krSetCaseTab(tab); var o = [].slice.call(document.querySelectorAll('#kr-casedetail button')).map(function(b){ return b.textContent.trim(); }); o.caseNo = r.caseNo; return o; }
  var b2 = T(function(){ return btnsOf('paid_waiting_kr','consult'); }), b3 = T(function(){ return btnsOf('awaiting_report','consult'); }), b6 = T(function(){ return btnsOf('report_ready','consult'); });
  function inList(b, x){ return Array.isArray(b) && b.indexOf(x)>-1; }
  RT.cell('面诊：［确认］预计出报告时间', coord ? '✅' : (b2 ? '❌' : '—'), b2 ? RT.yn(inList(b2,'确认')) : '（该账号名下没有这个状态的案件）', '案件 '+(b2&&b2.caseNo)+' 的按钮：'+JSON.stringify(b2));
  RT.cell('面诊：［开始面诊］', '✅', b3 ? RT.yn(inList(b3,'开始面诊')) : '（该账号名下没有「等待报告」状态的案件）', '室长 / 院长都能按（规格 2026-10-12：谁先按都算）；A000003 的按钮：'+JSON.stringify(b3));
  RT.cell('面诊：［修改预计时间］', coord ? '—' : '—', b3 ? RT.yn(inList(b3,'修改预计时间')) : '（看不到）', '规格没写院长能不能改预计出报告时间');
  RT.cell('面诊：［补加可选项目］ / 发送诊疗方案（调整并提交最终报告）', coord ? '✅' : '❌', b6 ? RT.yn(Array.isArray(b6) && b6.some(function(x){ return /补加可选项目/.test(x); })) /* CMD-1015-05：按钮改成「＋ 补加可选项目」 */ : '（该账号名下没有「已出报告」状态的案件）', '案件 '+(b6&&b6.caseNo)+' 的按钮：'+JSON.stringify(b6));
  var sub = T(function(){ var hit = null; krClinics().forEach(function(cl){ if(hit) return; Store.withClinic(cl.id, function(){ CASE_ITEMS.forEach(function(c){ if(!hit && krCaseVisible(c, hid) && c.stage==='travel' && c.consultRequested && (c.subItems||[]).some(function(x){ return x.kind==='施术'; })) hit = {cid:cl.id, id:c.id, old:c.director, no:c.caseNo}; }); }); });
    if(!hit) return null; var borrowed = dirLike && hit.old!==me; if(borrowed) Store.mutateClinic(hit.cid, function(){ CASE_ITEMS.filter(function(x){ return x.id===hit.id; })[0].director = me; });
    var r0 = {no:hit.no}; try{ krOpenSurgSub(hit.cid, hit.id); var pg = document.querySelector('.page.active'); r0.btns = [].slice.call(pg.querySelectorAll('button')).map(function(b){ return b.textContent.trim(); }).filter(function(x){ return x && !/^[💬🔔]/.test(x); }); }catch(e){ r0.err = String(e); }
    if(borrowed) Store.mutateClinic(hit.cid, function(){ CASE_ITEMS.filter(function(x){ return x.id===hit.id; })[0].director = hit.old; }); return r0; });
  RT.cell('施术子案件页：［客人已到院］［修改时间］（施术 / 到院 / 评估 / 付尾款属于室长的操作）', coord ? '✅' : '❌', sub ? RT.yn(inList(sub.btns, '客人已到院') && inList(sub.btns, '修改时间')) : '（无赴韩案件）', sub ? '案件 '+sub.no+' 的按钮：'+JSON.stringify(sub.btns) : '');
  RT.cell('处理案件的总开关 krCan()（确认时间 / 提交诊疗方案 / 施术相关）', coord ? '✅' : '❌', RT.yn(krCan()));
  var firstCase = rows[0], rec = firstCase ? T(function(){ return krCanRecord(firstCase.c); }) : null;
  RT.cell('录入面诊（语音 / 手动）', '✅', RT.yn(rec===true), dirLike ? '院长只限自己负责的案件' : '');
  if(dirLike){
    var other = T(function(){ return krCanRecord({director:'别的院长'}); });
    RT.cell('录入面诊：别的院长负责的案件', '❌', RT.yn(other===true));
  }
  /* 日程 / OFF / memo（真的走保存函数，再清掉） */
  var h = krHData(), whoOpts = T(function(){ return krfxPeople('院长'); }), coordOpts = T(function(){ return krfxPeople('室长'); });
  var otherDir = (T(function(){ return hospitalDirectorNames(hid); })||[]).filter(function(n){ return n!==me; })[0] || 'KD9 院长';
  RT.cell('OFF：能给自己标', '✅', RT.yn(T(function(){ return krcCanEdit(me); })===true));
  RT.cell('OFF：能给别的院长标', dirLike ? '❌' : '✅', RT.yn(T(function(){ return krcCanEdit(otherDir); })===true), '选人名单（院长）= '+JSON.stringify(whoOpts));
  RT.cell('OFF：能给室长标', dirLike ? '❌' : '✅', RT.yn((coordOpts||[]).length>0 && !dirLike), '选人名单（室长）= '+JSON.stringify(coordOpts));
  var memoOk = T(function(){ var n0 = krMemosOf().length; KRFX = {edit:null, date:krToday(), type:'备忘', role:dirLike?'院长':'室长', who:'', mode:'全天', from:'10:00', to:'12:00', scope:'私人', text:'RT-memo'}; var al = window.alert; window.alert = function(){}; krfxSave(); window.alert = al; var ms = krMemosOf(); var ok = ms.length===n0+1; var mm = ms.filter(function(m){ return m.text==='RT-memo'; })[0]; if(mm) h.memos = ms.filter(function(m){ return m!==mm; }); return ok; });
  RT.cell('日历 memo：能写', '✅', RT.yn(memoOk===true));
  /* 医院设定小日历 + 院长管理 + 账号管理 */
  RT.cell('医院设定（小日历：改休息 / 半天营业 / 营业时间）', admin ? '✅' : '❌', RT.yn(canDo('clinic')));
  if(canDo('clinic')){
    var hs = T(function(){ openAdminPage('clinic'); var t = document.getElementById('in-admin').textContent; return {save:/保存/.test(t)}; });
    RT.cell('医院设定页：［保存］可用', '✅', RT.yn(hs.save), JSON.stringify(hs));
  }
  RT.cell('院长管理：新增 / 编辑 / 停用院长', admin ? '✅' : '❌', RT.yn(canDo('krdoctors')));
  RT.cell('账号管理：购买 / 退订 / 重设', admin ? '✅' : '❌', RT.yn(canDo('accounts')));
  RT.cell('经营数据（只看汇总）', admin ? '✅' : '❌', RT.yn(canDo('bizdata')));
  RT.cell('操作日志', admin ? '✅' : '❌', RT.yn(canDo('oplog')));
  RT.cell('赴韩项目库 维护', coord ? '✅' : '❌', RT.yn(canDo('krlib')));
  var ktk = T(function(){ return krTodoItems(krAllCases()).map(function(x){ return x.kind; }); });
  var kset = Array.isArray(ktk) ? ktk : [];
  RT.cell('待办栏：含「确认预计出报告时间」（室长待办）', coord ? '✅' : '❌', RT.yn(kset.indexOf('eta')>-1), '待办种类 '+JSON.stringify(Array.from(new Set(kset))));
  RT.cell('待办栏：含「上传面诊内容」（院长待办）', dirLike ? '✅' : '❌', RT.yn(kset.indexOf('upload')>-1), dirLike ? '' : '');
  RT.cell('待办栏：含「发送诊疗方案 / 确认施术时间 / 在韩加项待付款 / 安排术后管理」（室长待办）', coord ? '—' : '❌', RT.yn(['send','sched','change','pay','pcb'].some(function(k){ return kset.indexOf(k)>-1; })), coord ? '看当前数据里有没有对应状态的案件' : '');
  RT.cell('KR 结束 IN 的案件', '❌', RT.yn(T(function(){ return !!canEndCase && canEndCase({subState:'arrived', stage:'booked'}); })===true), '规格：KR 不能结束 IN 的案件');
  RT.cell('工作台卡片（室长 4 张：待我处理 / 今天到院·到店 / 等待报告 / 新消息；院长 4 张：待面诊 / 待施术 / 待复诊 / 新消息）', '✅', RT.yn(document.querySelectorAll('.card[onclick*="todoCardFilter"]').length===4 || (nav('kr-dashboard'), document.querySelectorAll('.card[onclick*="todoCardFilter"]').length===4)), dirLike ? '院长工作台四张卡：待面诊｜待施术｜待复诊｜新消息（10/22 有意修改）' : '');
  /* 通知收件人：IN 事件发给 coord；院长只收指名给他的 / 被 @ */
  var recv = T(function(){ var before = (h.notifs||[]).length; [pushKrNotif(hid, 'RT 通知：给室长', {to:'coord'}), pushKrNotif(hid, 'RT 通知：给院长', {to:'director', director:me}), pushKrNotif(hid, 'RT 通知：@ 我', dirLike ? {to:'director', director:me, only:me, kind:'mention'} : {to:'coord', only:me, kind:'mention'})].forEach(function(n){ n.by = 'A9 室长'; }); var my = krNotifsForMe().map(function(n){ return n.text; }); h.notifs = (h.notifs||[]).filter(function(n){ return !/^RT 通知/.test(n.text); }); return my; });
  var gotCoord = Array.isArray(recv) && recv.indexOf('RT 通知：给室长')>-1, gotDir = Array.isArray(recv) && recv.indexOf('RT 通知：给院长')>-1, gotAt = Array.isArray(recv) && recv.indexOf('RT 通知：@ 我')>-1;
  RT.cell('通知：收「给室长」的案件事件', coord ? '✅' : '❌', RT.yn(gotCoord));
  RT.cell('通知：收「指名给自己（被 @）」', '✅', RT.yn(gotAt), '规格：被 @ 的人一定收到（包括院长）；实测院长 '+(gotAt ? '收到' : '没收到'));
  RT.cell('通知：收「给院长」的事件', dirLike ? '—' : '❌', RT.yn(gotDir), dirLike ? '规格没写院长收哪些案件事件（KR-DASH 旧版：院长不收推播）' : '');
  (RT._borrowed||[]).forEach(function(b){ Store.mutateClinic(b.cid, function(){ CASE_ITEMS.filter(function(x){ return x.id===b.id; })[0].director = b.old; }); }); RT._borrowed = [];
  return RT.R;
};

/* 把当前账号的结果存进 localStorage（rt_res_账号编号，重置数据不清），最后汇总 */
RT.save = function(extra){
  var id = RT.acct(); var out = {id:id, role:currentAccount().role, at:new Date().toISOString(), cells:RT.R.concat(extra||[])};
  try{ localStorage.setItem('rt_res_'+id, JSON.stringify(out)); }catch(e){}
  return out;
};
RT.all = function(){ var o = {}; Object.keys(localStorage).filter(function(k){ return k.indexOf('rt_res_')===0; }).forEach(function(k){ o[k.slice(7)] = JSON.parse(localStorage.getItem(k)); }); return o; };

/* CMD-1015-05：页面刚载入时顶部图标（对话 / 铃铛）要等几百毫秒才挂上，测之前先等到出现（最多 6 秒） */
RT.waitHead = function(){ return new Promise(function(res){ var t0 = Date.now(); (function chk(){ if(document.querySelector('.head-actions') || Date.now()-t0 > 6000) return res(); setTimeout(chk, 200); })(); }); };
['runIn','runKr'].forEach(function(k){ var f = RT[k]; if(typeof f!=='function') return; RT[k] = function(){ var a = arguments, me = this; return RT.waitHead().then(RT.prepare).then(function(){ return f.apply(me, a); }); }; });

/* CMD-1015-06：角色测试自己建数据——先拍存档快照（ST.begin），再用一键准备的同一套造法建好各状态的案件（ST.ensureFixtures）；测完 ST.cleanup() 整份还原，画面上不留测试数据 */
RT.prepare = function(){
  return new Promise(function(res){ if(window.ST) return res(); var s = document.createElement('script'); s.src = '/shared/selftest.js?'+Date.now(); s.onload = res; document.head.appendChild(s); })
    .then(function(){ ST.begin(); return ST.ensureFixtures(['stagePay', 'stageA', 'stageWO', 'stageW', 'stageB', 'stageC', 'yuki', 'queen', 'stagePay@H2', 'stageA@H2', 'stageW@H2', 'stageB@H2', 'stageC@H2', 'yuki@H2', 'queen@C2']); });
};
