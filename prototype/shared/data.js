/* shared/data.js —— 数据层：案件/客户/预约占位/对话/通知/项目库/案例库等全部演示数据 + 读写函数 + 种子数据
   由 gmc-network-prototype.html 拆分而来（2026-10-05 结构拆分）。classic script，全局函数/变量，不使用 ES module。 */
/* ---- 演示数据版本号：版本不符时，localStorage 里所有 gmc_ 开头的数据自动清空并重新生成演示数据（2026-10-05·一，由 3 升到 4；二加入账号数据升到 5；三加购管理者 A5、字段改名，升到 6） ---- */
var DEMO_DATA_VERSION = 42; /* 39（CMD-1012-14）：演示案件的赴韩项目补上推荐在韩 / 麻醉 / 术后管理；38（CMD-1012-04 补）：「使用时选」选项按规格分组（opt.rules）；37（CMD-1012-04/05）：本地管理项目库换成清单 12 类（类别→项目→规格→价格）、KR 术后管理免费、旧项目的种子替换；A1 的演示 OFF 改成每隔 7 天，避免测试当天 A1 在 OFF 收不到通知（升级前自动备份旧数据）。以下为 05 的说明：：A1 的演示 OFF 改成每隔 7 天、从今天 +3 天算起，避免测试当天 A1 在 OFF 收不到通知；36（CMD-1012-02）：术后管理设定加管理项目/间隔/第N天起，附件标签改称诊疗方案；35（CMD-1012-01 后续）：待访问的演示预约按「现在」往后排，避免一打开就被自动判定未到店；34（CMD-1008-12）：KR 面诊块、施术子项自动产生；33（CMD-1008-09）：加本月活动 / 套餐 / 套餐批次 / 서비스批次演示数据；32（CMD-1008-05）：演示营业时间改为 IN 10:00–21:00 / KR 11:00–21:30，诊所设定里的营业时间在版本重置时被强制改写 */
/* 账号 / 诊所设定自己的结构版本：只有它变了，版本号重置时才连账号和设定一起清掉（2026-10-06；3 = 多诊所多医院：账号加 clinicId、设定按诊所分区） */
var ACCOUNT_STRUCT_VERSION = 5;
/* 存档分三种键：gmc_state = 全局部分（账号、医院、诊所、对接关系、医院资料…）；gmc_clinic_C1 / gmc_clinic_C2 … = 每家诊所一个分区（客户、案件、对话、通知、诊所设定…） */
var KEEP_ON_VERSION_RESET = ['ACCOUNTS', 'ACCOUNT_LOG'];                      /* 全局部分里保留的 */
var DEMO_CLINIC_HOURS = {openTime:'10:00', closeTime:'21:00', bookFrom:'10:00', bookTo:'20:30', lunchFrom:'14:00', lunchTo:'15:00'}; /* IN 诊所演示营业时间（印尼当地时间）；周日休诊 */
var KEEP_CLINIC_ON_VERSION_RESET = ['CLINIC_SETTINGS', 'PURCHASE_REQ', 'ACCOUNT_SEQ']; /* 每个诊所分区里保留的 */
/* ---- 重置前自动备份（CMD-1012-06）：任何清掉 gmc_ 存档的地方（数据版本升级、手动「重置演示数据」）都先把当前全部存档备份：
   ① 存进 localStorage 的 gmc_backup_<时间>（重置不清它，只保留最近 3 份）；② 不自动下载文件（需要时到测试覆盖页自己导出）；③ 登录页 / 测试覆盖页顶部提示。 ---- */
/* 版本章 + 测试轮次（CMD-1012-07）：Timeline 记录带上当时的原型版本（最新提交的短 hash + 提交时间，shared/version.js 由 post-commit 钩子写入）；用户新建的案件带上当时的测试轮次（测试覆盖页下拉设置，存 gmc_cfg_round，重置不清） */
function gmcVerStamp(){ return (typeof GMC_BUILD!=='undefined' && GMC_BUILD) ? {ver:GMC_BUILD.h, vt:GMC_BUILD.t} : {}; }
function currentTestRound(){ try{ return parseInt(localStorage.getItem('gmc_cfg_round'), 10) || 1; }catch(e){ return 1; } }
/* ---- 数据升级 / 重置时保留用户测试案件（CMD-1012-09）----
   只重置演示数据：demo:true 的案件、种子客人、种子设定重新生成；用户新建的案件（demo:false，或旧存档里没标记的 r+时间戳 id）连同它们的客人、持有批次、通知、对话房、
   KR 侧的通知 / 院长日程块 / 录入仓库一起「提取」存进 gmc_cfg_carry（gmc_cfg_ 开头的键重置不清），新种子生成后由 store.js 的 carryRestore 合并回去并按「旧版本 → 新版本」迁移。 */
/* ---- 用户改过的设定 / 资料也保留（CMD-1012-09 补）：种子生成时给项目库项目、案例库案例、活动价、套餐、日历 memo 各盖一个指纹 _h（内容的哈希）。
   升级时：没有 _h = 用户新增；有 _h 但现在的哈希不同 = 用户改过；两者都带走，只有没动过的才回到新演示数据。存档整体带 st:1 表示指纹有效。 */
function gmcHash(o){ var s = JSON.stringify(o, function(k, v){ return k==='_h' ? undefined : v; }) || '', h = 5381; for(var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; }
function gmcStamp(arr){ (arr || []).forEach(function(x){ if(x && typeof x==='object' && x._h===undefined) x._h = gmcHash(x); }); }
var GMC_CLINIC_LISTS = ['PROJECT_LIBRARY', 'LIB_CASES', 'PROMOS', 'PACKAGES', 'CAL_MEMOS'], GMC_HOSP_LISTS = ['projects', 'libCases', 'localLib'];
function gmcStampVars(v){ GMC_CLINIC_LISTS.forEach(function(n){ gmcStamp(v && v[n]); }); }
function gmcStampHospitals(hd){ Object.keys(hd || {}).forEach(function(h){ GMC_HOSP_LISTS.forEach(function(n){ gmcStamp(hd[h] && hd[h][n]); }); }); }
function gmcChanged(x){ return x._h===undefined || gmcHash(x)!==x._h; }
/* 没有指纹的旧存档（升级到这个功能之前的数据）：只能按 id 特征认出用户新增的 */
function gmcLegacyUser(listName, x){
  if(listName==='CAL_MEMOS') return /^m\d{10,}/.test(String(x.id));
  if(listName==='PROMOS') return /^pm[a-z0-9]{8,}/.test(String(x.id));
  if(listName==='PACKAGES') return /^pk[a-z0-9]{8,}/.test(String(x.id));
  return false;
}
function gmcUserCfgOfClinic(v, stamped, cats){
  var o = {}, n = 0;
  GMC_CLINIC_LISTS.forEach(function(ln){
    var arr = (v[ln] || []).filter(function(x){ return x && (stamped ? gmcChanged(x) : gmcLegacyUser(ln, x)); });
    if(arr.length){ o[ln] = arr; n += arr.length; }
  });
  var catIds = {}; (o.PROJECT_LIBRARY || []).forEach(function(p){ if(p.categoryId) catIds[p.categoryId] = 1; });
  o.cats = {}; Object.keys(catIds).forEach(function(k){ if(cats && cats[k]) o.cats[k] = cats[k]; });
  o.n = n; return o;
}
function gmcIsUserCase(c){ return !!c && (c.demo===false || (c.demo===undefined && /^r\d{9,}/.test(String(c.id)))); }
function gmcExtractUserCarry(){
  var carry = {from:localStorage.getItem('gmc_demo_ver')||'', at:new Date().toISOString(), clinics:{}, hospitals:{}, seq:0, total:0}, allIds = {};
  Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_clinic_')===0; }).forEach(function(k){
    var p = JSON.parse(localStorage.getItem(k) || 'null'); if(!p || !p.vars || p.partial) return;
    var v = p.vars, cid = k.replace('gmc_clinic_', ''), cases = (v.CASE_ITEMS||[]).filter(gmcIsUserCase);
    var cfg = gmcUserCfgOfClinic(v, p.st===1, v.PROJECT_CATEGORIES); if(cfg.n){ (carry.cfg = carry.cfg || {})[cid] = cfg; carry.cfgN = (carry.cfgN || 0) + cfg.n; }
    if(!cases.length){ if(cfg.n) carry.clinics[cid] = {cases:[], clients:[], holdings:{}, notifs:[], rooms:[], chat:{}, sms:[]}; return; }
    var ids = {}, names = {};
    cases.forEach(function(c){ ids[c.id] = 1; allIds[c.id] = cid; names[c.name] = 1; var n = parseInt(String(c.caseNo||'').slice(1), 10) || 0; if(n > carry.seq) carry.seq = n; });
    var holdings = {}; Object.keys(v.CLIENT_HOLDINGS||{}).forEach(function(n){ if(names[n]) holdings[n] = v.CLIENT_HOLDINGS[n]; });
    var rooms = (v.ROOMS||[]).filter(function(r){ return /^case-/.test(String(r.id)) && ids[String(r.id).slice(5)]; }), chat = {};
    rooms.forEach(function(r){ if((v.CHAT_DATA||{})[r.id]) chat[r.id] = v.CHAT_DATA[r.id]; });
    carry.clinics[cid] = {cases:cases, clients:(v.CLIENTS||[]).filter(function(cl){ return names[cl.name]; }), holdings:holdings,
      notifs:(v.NOTIFS||[]).filter(function(n){ return n.caseId && ids[n.caseId]; }), rooms:rooms, chat:chat, sms:(v.SMS_LOG||[]).filter(function(s){ return s.caseId && ids[s.caseId]; })};
    carry.total += cases.length;
  });
  var g = JSON.parse(localStorage.getItem('gmc_state') || 'null'), hd = g && g.vars && g.vars.HOSPITAL_DATA;
  if(hd){ /* 医院侧：KR 项目库 / 本地管理项目 / 赴韩案例里用户新增或改过的 */
    Object.keys(hd).forEach(function(hid){
      var h = hd[hid], o = {}, n = 0; GMC_HOSP_LISTS.forEach(function(ln){ if(g.st!==1) return; var arr = (h[ln] || []).filter(function(x){ return x && gmcChanged(x); }); if(arr.length){ o[ln] = arr; n += arr.length; } });
      if(n){ var ids = {}; (o.projects || []).concat(o.localLib || []).forEach(function(p){ if(p.categoryId) ids[p.categoryId] = 1; }); o.cats = {}; Object.keys(ids).forEach(function(k){ if(g.vars.KR_CATEGORIES && g.vars.KR_CATEGORIES[k]) o.cats[k] = g.vars.KR_CATEGORIES[k]; });
        (carry.cfgH = carry.cfgH || {})[hid] = o; carry.cfgN = (carry.cfgN || 0) + n; }
    });
  }
  if(!carry.total) return carry;
  if(hd) Object.keys(hd).forEach(function(hid){
    var h = hd[hid], o = {notifs:(h.notifs||[]).filter(function(n){ return n.caseId && allIds[n.caseId]; }), sched:{}, vault:{}};
    Object.keys(h.directorSchedule||{}).forEach(function(dn){ var bl = (h.directorSchedule[dn]||[]).filter(function(b){ return b.caseId && allIds[b.caseId]; }); if(bl.length) o.sched[dn] = bl; });
    Object.keys(h.vault||{}).forEach(function(vk){ if(allIds[vk.split(':')[1]]) o.vault[vk] = h.vault[vk]; });
    if(o.notifs.length || Object.keys(o.sched).length || Object.keys(o.vault).length) carry.hospitals[hid] = o;
  });
  return carry;
}
/* 提取结果存起来；只有真的提取到案件才覆盖（手动「只重置演示数据」后重载会再走一次版本检查，那时存档已空，不能把刚存的清掉） */
function gmcStoreCarry(carry){
  if(!carry || (!carry.total && !carry.cfgN)) return;
  try{ localStorage.setItem('gmc_cfg_carry', JSON.stringify(carry)); }
  catch(e){ try{ localStorage.setItem('gmc_cfg_migration', JSON.stringify({from:carry.from, to:null, at:carry.at, migrated:0, failed:[{caseNo:'（全部）', name:'', reason:'存档容量不够，用户案件没能保留（旧数据在自动备份里）'}]})); }catch(e2){} }
}
function gmcCollectRaw(){ var o = {}; try{ Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_')===0 && k.indexOf('gmc_backup_')!==0 && k.indexOf('gmc_cfg_')!==0; }).forEach(function(k){ o[k] = localStorage.getItem(k); }); }catch(e){} return o; }
function gmcBackupMake(reason){
  try{
    var raw = gmcCollectRaw();
    if(!raw.gmc_state && !Object.keys(raw).some(function(k){ return k.indexOf('gmc_clinic_')===0; })) return null; /* 还没有数据：不用备份 */
    var full = Object.keys(raw).some(function(k){ if(k!=='gmc_state' && k.indexOf('gmc_clinic_')!==0) return false; try{ var q = JSON.parse(raw[k]); return q && !q.partial && q.vars; }catch(e){ return false; } });
    if(!full) return null; /* 只剩一份重置后保留下来的「半成品」存档（不含案件）：不用再备份 */
    var t = new Date(), rec = {kind:'gmc-backup', exportedAt:t.toISOString(), reason:reason, dataVersion:raw.gmc_demo_ver || '', raw:raw};
    return {name:'gmc-backup-'+t.toISOString().slice(0,19).replace(/[:T]/g,'-')+'.json', str:JSON.stringify(rec), t:t.getTime(), reason:reason};
  }catch(e){ return null; }
}
function gmcBackupKeep(bk){
  if(!bk) return;
  try{
    localStorage.setItem('gmc_backup_'+bk.t, bk.str);
    Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_backup_')===0 && k!=='gmc_backup_notice'; }).sort().slice(0, -3).forEach(function(k){ localStorage.removeItem(k); });
  }catch(e){ try{ localStorage.removeItem('gmc_backup_'+bk.t); }catch(e2){} } /* 容量不够：这份备份就存不下了 */
  try{ localStorage.setItem('gmc_backup_notice', JSON.stringify({name:bk.name, t:bk.t, reason:bk.reason})); }catch(e){}
}
function gmcDownloadText(name, text, mime){
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:mime || 'application/json'})); a.download = name; (document.body || document.documentElement).appendChild(a); a.click();
  setTimeout(function(){ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} }, 1500);
}
function gmcResetAll(reason, keepUser){
  var bk = gmcBackupMake(reason || '手动重置演示数据');
  if(keepUser){ try{ gmcStoreCarry(gmcExtractUserCarry()); }catch(e){} } /* ① 只重置演示数据：保留我的测试案件 */
  else { try{ localStorage.removeItem('gmc_cfg_carry'); }catch(e){} } /* ② 全部清空 */
  try{ Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_')===0 && k.indexOf('gmc_backup_')!==0 && k.indexOf('gmc_cfg_')!==0; }).forEach(function(k){ localStorage.removeItem(k); }); }catch(e){}
  gmcBackupKeep(bk);
}
(function(){
  try{
    /* 演示数据版本号变了：清掉业务演示资料（案件、客户、预约…）重新生成，但保留账号资料（密码、使用人、使用人历史、操作日志）和诊所设定；
       账号/设定结构变了（ACCOUNT_STRUCT_VERSION）或手动"重置演示数据"时才全部重置。日期是相对今天写的，不需要每天重置。 */
    var verOk = localStorage.getItem('gmc_demo_ver') === String(DEMO_DATA_VERSION);
    if(!verOk){
      var structOk = localStorage.getItem('gmc_struct_ver') === String(ACCOUNT_STRUCT_VERSION), keptG = null, keptC = {};
      if(structOk){
        try{
          var st = JSON.parse(localStorage.getItem('gmc_state') || 'null');
          if(st && st.vars){ keptG = {}; KEEP_ON_VERSION_RESET.forEach(function(n){ if(st.vars.hasOwnProperty(n)) keptG[n] = st.vars[n]; }); }
          Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_clinic_')===0; }).forEach(function(k){
            var p = JSON.parse(localStorage.getItem(k) || 'null'), o = {};
            if(p && p.vars){ KEEP_CLINIC_ON_VERSION_RESET.forEach(function(n){ if(p.vars.hasOwnProperty(n)) o[n] = p.vars[n]; }); if(o.CLINIC_SETTINGS) Object.assign(o.CLINIC_SETTINGS, DEMO_CLINIC_HOURS, {closedRules:[{dow:0, from:''}], closedDow:[0]}); /* CMD-1008-05：演示营业时间直接覆盖 */ keptC[k] = o; }
          });
        }catch(e){ keptG = null; keptC = {}; }
      }
      var bkv = gmcBackupMake('演示数据版本升级 '+(localStorage.getItem('gmc_demo_ver')||'?')+' → '+DEMO_DATA_VERSION); /* 升级前自动备份旧数据 */
      try{ gmcStoreCarry(gmcExtractUserCarry()); }catch(e){ try{ localStorage.setItem('gmc_cfg_migration', JSON.stringify({from:localStorage.getItem('gmc_demo_ver'), to:DEMO_DATA_VERSION, at:new Date().toISOString(), migrated:0, failed:[{caseNo:'（全部）', name:'', reason:'提取用户案件时出错：'+e.message+'（旧数据在自动备份里）'}]})); }catch(e2){} } /* 用户新建的案件先存起来，新种子生成后合并回去（CMD-1012-09） */
      Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_')===0 && k.indexOf('gmc_backup_')!==0 && k.indexOf('gmc_cfg_')!==0; }).forEach(function(k){ localStorage.removeItem(k); });
      gmcBackupKeep(bkv);
      localStorage.setItem('gmc_demo_ver', String(DEMO_DATA_VERSION));
      localStorage.setItem('gmc_struct_ver', String(ACCOUNT_STRUCT_VERSION));
      /* 保留下来的只是一部分变量；其余变量由 store.js 启动时按种子补齐（见 Store.init） */
      if(keptG) localStorage.setItem('gmc_state', JSON.stringify({ver:DEMO_DATA_VERSION, t:Date.now(), partial:true, vars:keptG}));
      Object.keys(keptC).forEach(function(k){ localStorage.setItem(k, JSON.stringify({ver:DEMO_DATA_VERSION, t:Date.now(), partial:true, vars:keptC[k]})); });
    }
  }catch(e){}
})();



/* ================= dashboard: calendar (month / week / day) ================= */
var DOW_CN = ['一','二','三','四','五','六','日'];

var TODAY_DATE = (function(){ var d = demoNow(); d.setHours(0,0,0,0); return d; })(); /* 真实今天（2026-10-06 起） */

/* 日历事件类型（2026-10-02·六）：预约来访 / 预约占位 / 赴韩施术；删除"视频沟通""术后管理""其他" */
var TYPE_COLOR = {reservation:'var(--navy)', placeholder:'var(--slate)', travel:'var(--terracotta)'};

var TYPE_BG = {reservation:'#E4E8ED', placeholder:'#F4F6F8', travel:'var(--terracotta-bg)'};

var TYPE_LABEL = {reservation:'预约来访', placeholder:'预约占位', travel:'赴韩施术'};

/* 日历行（诊所营业时间生成，见 applyClinicSettings）；KR 医院日程是韩国那边的时间，用固定的 KR_WK_HOURS */
var WK_HOURS = [];
var KR_WK_HOURS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];

/* 诊所时区（设定，默认 WIB，可切换 WITA / WIT）；KR 固定 UTC+9。时差由设定算出，不写死 */
/* （2026-10-07 起诊所时区不再手动选，由地址 / 城市自动判定为 IANA 时区，见 rules.js clinicTzOf；TZ_OPTIONS 已删除） */

var KR_TZ = 'Asia/Seoul'; /* 韩国医院时区 */

/* ================= 诊所设定（2026-10-06·A5，Notion Accounts & Settings 第 5 节；老板/管理者在"诊所设定"页改） =================
   所有"诊所可调"的值都放这里，日历、预约占位、未到店判定、面诊费卡、短信、客户自助预约页都读它；不再写死。
   时区 tz 原来是 CLINIC_TZ + localStorage('gmc_tz')，现在搬到这里，CLINIC_TZ 只是它的镜像（applyClinicSettings 同步）。
   赴韩定金比例不在这里（GMC 统一设定）。 */
var SLOT_MIN = 30; /* 时段长度（分钟），固定 30（我的判断：设定里不提供修改） */
function defaultClinicSettings(o){ /* 每家诊所一份设定（存在诊所分区里）；o 可覆盖名称、地址等 */
 var s = {
  name:'GMC 合作诊所（雅加达）', address:'Jl. Jenderal Sudirman Kav. 52, Jakarta Selatan', phone:'+62 21 5550 1234', city:'雅加达', tz:'Asia/Jakarta', /* tz 由地址/城市自动判定（clinicTzOf），不能手动改 */
  openTime:'10:00', closeTime:'21:00',   /* 营业时间（日历显示的行） */
  bookFrom:'10:00', bookTo:'20:30',      /* 可预约时段：第一个 / 最后一个可约的开始时间 */
  lunchFrom:'14:00', lunchTo:'15:00',    /* 午休：不可预约 */
  closedRules:[{dow:0, from:''}],        /* 定期休诊（每周固定；2026-10-08 起取代只能整天休诊的 closedDow）：dow 0=周日…6=周六；from 为空 = 整天休诊，填 HH:mm = 这天从该时刻起休诊（到营业结束）；默认每周日整天休诊 */
  closedDow:[0],                         /* 派生：整天休诊的星期（由 closedRules 算出，不要直接改） */
  holdMinutes:15, noShowMinutes:30,      /* 预约占位倒计时 / 未到店判定 */
  consultFee:300000,                     /* 面诊费（印尼盾） */
  slotCapacity:2,                        /* 每个时段的预约上限（客户自助预约用） */
  remindBeforeHours:24,                  /* 提醒短信：预约开始前几小时发送 */
  sms:{
    link:'您好，这里是GMC Network，麻烦点击链接填写基础信息，完成后即视为预约成功：',
    confirm:'【{clinic}】Halo {name}, reservasi Anda {time} sudah dikonfirmasi. Alamat: {address}, Telp: {phone}. Lihat/batalkan: {url}　|　您好 {name}，您已预约 {time}，地址：{address}。查看/取消预约：{url}',
    remind:'【{clinic}】Pengingat: reservasi {name} pada {time}. Alamat: {address}. Lihat/batalkan: {url}　|　提醒：您 {time} 有预约。查看/取消：{url}',
    cancel:'【{clinic}】Halo {name}, reservasi {time} telah dibatalkan. Reservasi ulang: {url}　|　您 {time} 的预约已取消，重新预约：{url}'
  },
  privacyVersion:'v1.0',
  privacyPolicy:'本诊所仅为办理预约、接待和医美咨询收集您的个人资料与健康资料，并按《隐私/数据跨境使用授权同意书》约定处理；您可随时要求查看、更正或删除。',
  updatedAt:'', updatedBy:''
 };
 s.sms = Object.assign({}, s.sms); s.closedRules = s.closedRules.map(function(r){ return Object.assign({}, r); }); s.closedDow = s.closedDow.slice();
 return Object.assign(s, o||{});
}
var CLINIC_SETTINGS = defaultClinicSettings();
var CLINIC_TZ = CLINIC_SETTINGS.tz;

/* ================= 多诊所 × 多医院（2026-10-06，KR 端系列 1/5） =================
   诊所（印尼）和医院（韩国）是多对多：CLINIC_HOSPITALS 记对接关系。
   - 按诊所分区存档（客户、案件、预约/占位、对话、通知、诊所设定、本地项目、印尼案例…），IN 账号只看得到自己诊所的分区（见 store.js）；
   - 按医院归属的数据放在 HOSPITAL_DATA[医院ID]（院长名单、KR 室长、赴韩项目、开放施术日期、KR 日程、赴韩案例），KR 端（之后）和各对接诊所共用。 */
var HOSPITALS = [
  {id:'H1', name:{ko:'서울 소수 성형외과', en:'Seoul Sosu Plastic Surgery'}, address:'서울특별시 강남구 압구정로 100', tz:'Asia/Seoul'},
  {id:'H2', name:{ko:'강남 뷰티의원', en:'Gangnam Beauty Clinic'}, address:'서울특별시 강남구 논현로 508', tz:'Asia/Seoul'}
];
var CLINICS = [
  {id:'C1', name:'GMC 合作诊所（雅加达）', accountPrefix:'A'},
  {id:'C2', name:'泗水合作诊所（Surabaya）', accountPrefix:'B'},
  {id:'C3', name:'巴厘合作诊所（Bali）', accountPrefix:'D'}
];
var CLINIC_HOSPITALS = [ /* 对接关系（2026-10-07 起一家诊所只对接一家医院，一家医院可对接多家诊所）：C1、C2 → H1；C3 → H2 */
  {clinicId:'C1', hospitalId:'H1'}, {clinicId:'C2', hospitalId:'H1'}, {clinicId:'C3', hospitalId:'H2'}
];
/* HOSPITAL_DATA[hid]：{directors:[{id,name,active}], coordinators:[姓名], openDates:{院长名:[日期]}, directorSchedule:{院长名:[块]}, coordSchedule:[块], projects:[赴韩项目], libCases:[赴韩案例]}
   （初始值在 data.js 末尾的 initHospitalData() 用上面的老种子变量生成；projects / libCases 在存档时由 PROJECT_LIBRARY / LIB_CASES 的合成数组拆回来，见 store.js） */
var HOSPITAL_DATA = {};
var C3_STASH = null; /* 种子阶段暂存：要迁到 C3 的案件等（见 stashC3Seeds） */
var C3_CASE_IDS = ['budi', 'dinda', 'wulan', 'lina'];
var CURRENT_CLINIC_ID = 'C1'; /* 当前页面所属诊所；在下面 currentAccount() 定义之后由 resolveClinicId() 重新计算 */
function clinicById(id){ return CLINICS.filter(function(c){ return c.id===id; })[0] || null; }
function hospitalById(id){ return HOSPITALS.filter(function(h){ return h.id===id; })[0] || null; }
function hospitalName(id, lang){ var h = hospitalById(id); return h ? (h.name[lang||'ko'] || h.name.ko) : '—'; }
function linkedHospitalIds(clinicId){ return CLINIC_HOSPITALS.filter(function(r){ return r.clinicId===(clinicId||CURRENT_CLINIC_ID); }).map(function(r){ return r.hospitalId; }); }
function linkedHospitals(clinicId){ return linkedHospitalIds(clinicId).map(hospitalById).filter(Boolean); }
function clinicHospital(clinicId){ var ids = linkedHospitalIds(clinicId); return ids[0] || null; } /* 这家诊所对接的那一家医院 */
function hospitalLinked(hid, clinicId){ return linkedHospitalIds(clinicId).indexOf(hid) > -1; }
function hospitalDirectors(hid){ var h = HOSPITAL_DATA[hid]; return h ? h.directors : []; }
function hospitalDirectorNames(hid){ return hospitalDirectors(hid).filter(function(d){ return d.active; }).map(function(d){ return d.name; }); } /* 启用的院长（停用的不出现在选项里） */
function hospitalCoordinators(hid){ var h = HOSPITAL_DATA[hid]; return h ? h.coordinators : []; }
/* 医院休诊日（2026-10-07，CMD-1007-03）：KR 室长在 KR 工作台日历登记整院休诊（可取消）；HOSPITAL_DATA[h].closedDates = [{id, date, by}]；IN 的 KR 医院日程视角和 KR 日历都读这里 */
/* 2026-10-08：医院休诊改成定期休诊（HOSPITAL_DATA[h].closedRules，每周固定，整天或从某时刻起）；取代 CMD-03 的逐日登记 closedDates */
/* CMD-1014-03：KR 医院设定的「特殊日子」（HOSPITAL_DATA[h].specialDays = [{id, date, mode:'open'|'closed'|'half', from, to}]）优先于每周固定休诊：
   open = 本来休息改营业；closed = 本来营业改休息；half = 半天营业（from～to 营业，其余时间休诊）。 */
function hospitalSpecial(hid, ds){ var h = HOSPITAL_DATA[hid]; return (h && (h.specialDays||[]).filter(function(x){ return x.date===ds; })[0]) || null; }
function hospitalClosedOn(hid, ds){ var h = HOSPITAL_DATA[hid]; if(!h) return false; var sp = hospitalSpecial(hid, ds); if(sp) return sp.mode==='closed'; return closedWholeDay(h.closedRules, new Date(ds+'T00:00:00').getDay()); }
function hospitalClosedFrom(hid, ds){ var h = HOSPITAL_DATA[hid]; if(!h) return ''; var sp = hospitalSpecial(hid, ds); if(sp) return sp.mode==='half' ? sp.to : ''; return closedFromOf(h.closedRules, new Date(ds+'T00:00:00').getDay()); } /* 这天从几点（韩国时间）起休诊，没有 = '' */
function hospitalClosedBefore(hid, ds){ var sp = hospitalSpecial(hid, ds); return (sp && sp.mode==='half') ? sp.from : ''; } /* 半天营业：这个时刻之前休诊 */
function hospitalSlotClosed(hid, ds, hm){ if(hospitalClosedOn(hid, ds)) return true; var f = hospitalClosedFrom(hid, ds), b = hospitalClosedBefore(hid, ds); return (!!f && timeToMin(hm) >= timeToMin(f)) || (!!b && timeToMin(hm) < timeToMin(b)); }
/* OFF 在某天是否生效：单次 = date 相同；每周固定 = weekly 且星期相同（2026-10-08，CMD-1007-04） */
function offApplies(o, ds){ return o.weekly ? (o.dow === new Date(ds+'T00:00:00').getDay()) : o.date===ds; }
/* KR 排施术时间的检查：整天休诊 / 休诊时段 / 院长 OFF 不能排；返回错误文字，'' = 可以（KR 端确认、调整、重新预约施术时间前调用） */
function krHoursText(min){ var h = Math.round(min/6)/10; return (h===Math.floor(h) ? String(h) : h.toFixed(1))+' 小时'; }
function krSurgerySlotError(hid, director, date, time, durMin, exceptCaseKey, opts){
  var s = timeToMin(time), e = s + (durMin||60), lu = hospitalLunch(hid), hrs = hospitalHours(hid), soft = !!(opts && opts.allowOffHours); /* soft：午休 / 营业时间外不拦，由界面弹窗确认（CMD-1013-02 二） */
  if(!soft && (s < timeToMin(hrs.open) || e > timeToMin(hrs.close))) return '施术时间要在医院营业时间内（韩国 '+hrs.open+'–'+hrs.close+'）';
  if(!soft && lu && s >= timeToMin(lu.from) && s < timeToMin(lu.to)) return '不能开始于午休时段（韩国 '+lu.from+'–'+lu.to+'）；可以跨过午休';
  if(hospitalClosedOn(hid, date)) return date+' 是医院定期休诊日，不能排施术';
  var cb = soft ? '' : hospitalClosedBefore(hid, date); if(cb && s < timeToMin(cb)) return '这个时间落在医院休诊时段（'+date+' 半天营业，'+cb+' 前休诊）';
  var cf = soft ? '' : hospitalClosedFrom(hid, date); if(cf && e > timeToMin(cf)) return '这个时间落在医院休诊时段（周'+['日','一','二','三','四','五','六'][new Date(date+'T00:00:00').getDay()]+' '+cf+' 起休诊）';
  var h = HOSPITAL_DATA[hid] || {offs:[]}, bad = (h.offs||[]).filter(function(o){ return o.kind==='director' && o.who===director && offApplies(o, date); }).filter(function(o){ var hh = (o.part && o.part!=='全天') ? krHalfRange(hid, o.part) : ['00:00','24:00'], a = hh[0]==='00:00' ? 0 : timeToMin(hh[0]), b = hh[1]==='24:00' ? 24*60 : timeToMin(hh[1]); return s < b && e > a; /* 半天 OFF：上午 = 营业开始→午休开始 / 下午 = 午休结束→营业结束（韩国时间，见 krHalfRange） */ })[0];
  if(bad) return director+' 在这个时间 OFF（'+(bad.part||'全天')+(bad.weekly ? '，每周固定' : '')+'），不能排施术';
  /* 同一位院长同一时间只能有一件事（KR-SCHD-01，2026-10-08）：不能和该院长的「不可预约」或别的施术重叠；不同院长之间可以重叠 */
  var clash = ((h.directorSchedule||{})[director]||[]).filter(function(b){ return b.date===date && timeToMin(b.time) < e && timeToMin(b.end) > s; }).filter(function(b){ return !((b.kind==='施术' || b.kind==='面诊') && exceptCaseKey && (b.clinicId+':'+b.caseId)===exceptCaseKey && (!opts || !opts.exceptKind || opts.exceptKind===b.kind)); })[0];
  /* 冲突说明（CMD-1013-11 一·5）：写清楚「到院时间 + 施术时长」和哪一段重叠 */
  var why = clash ? (opts && opts.use ? time+' 开始，使用约 '+(durMin||30)+' 分钟到 '+minToTime(e)+'，和 ' : time+' 到院，施术约 '+krHoursText(durMin||60)+' 到 '+minToTime(e)+'，和 ')+director+' '+clash.time+'–'+clash.end+' '+(clash.kind==='施术' || clash.kind==='面诊' ? '已有'+clash.kind : '不可预约')+' 重叠' : '';
  if(clash && (clash.kind==='施术' || clash.kind==='面诊')) return why;
  if(clash && !(opts && opts.ignoreBusy)) return why;
  return '';
}
/* 新增 / 修改「不可预约」：不能和该院长已有的施术重叠 */
function krBusySlotError(hid, director, date, time, end, exceptBusyId){
  var s = timeToMin(time), e = timeToMin(end), h = HOSPITAL_DATA[hid] || {directorSchedule:{}}, hrs = hospitalHours(hid);
  if(s < timeToMin(hrs.open) || e > timeToMin(hrs.close)) return '不可预约时间要在医院营业时间内（韩国 '+hrs.open+'–'+hrs.close+'）';
  var clash = ((h.directorSchedule||{})[director]||[]).filter(function(b){ return (b.kind==='施术' || b.kind==='面诊') && b.date===date && timeToMin(b.time) < e && timeToMin(b.end) > s; })[0];
  return clash ? '该时段已有'+clash.kind+'（'+director+' '+clash.time+'–'+clash.end+'，'+(clash.name||'')+'）' : '';
}
/* 演示数据：以施术为准——删掉和施术重叠的不可预约块（施术块之间的冲突在选日期时已避开） */
function seedResolveOverlaps(){
  Object.keys(HOSPITAL_DATA).forEach(function(hid){
    var h = HOSPITAL_DATA[hid];
    Object.keys(h.directorSchedule||{}).forEach(function(n){
      var arr = h.directorSchedule[n]||[], surg = arr.filter(function(b){ return b.kind==='施术' || b.kind==='面诊'; });
      h.directorSchedule[n] = arr.filter(function(b){ return b.kind==='施术' || b.kind==='面诊' || !surg.some(function(x){ return x.date===b.date && timeToMin(x.time) < timeToMin(b.end) && timeToMin(x.end) > timeToMin(b.time); }); });
    });
  });
}
/* KR 医院午休（医院设定里设，韩国时间；演示 H1 / H2 = 13:00–14:00）：施术不能开始于午休，但可以跨过午休 */
/* KR 医院营业时间（韩国时间；2026-10-08 CMD-1008-05，KR 管理者在医院设定里改）：HOSPITAL_DATA[h].openTime / closeTime */
function hospitalHours(hid){ var h = HOSPITAL_DATA[hid] || {}; return {open:h.openTime || '11:00', close:h.closeTime || '21:30'}; }
/* 半天 OFF 对应的韩国时间段（跟着医院设定算，不写死）：上午 = 营业开始 → 午休开始；下午 = 午休结束 → 营业结束；没有午休时以中午 13:00 分界 */
function krHalfRange(hid, part){
  var m0 = /^指定(\d\d:\d\d)-(\d\d:\d\d)$/.exec(part||''); if(m0) return [m0[1], m0[2]]; /* CMD-1014-02：OFF 改成「全天 / 指定时间」，part 写成 指定09:00-13:00 */
  var hr = hospitalHours(hid), lu = hospitalLunch(hid), a = lu ? lu.from : '13:00', b = lu ? lu.to : '13:00';
  return part==='下午' ? [b, hr.close] : [hr.open, a];
}
function hospitalLunch(hid){ var h = HOSPITAL_DATA[hid]; return (h && h.lunch && h.lunch.from && h.lunch.to) ? h.lunch : null; }
/* CMD-1014-03：不再有「院长开放施术日」——院长哪天能做手术 = 医院有营业的日子，扣掉这位院长的整天 OFF 和盖满营业时间的不可预约 */
function hospitalOpenOn(hid, director, ds){
  var h = HOSPITAL_DATA[hid]; if(!h || hospitalClosedOn(hid, ds)) return false;
  if((h.offs||[]).some(function(o){ return o.kind==='director' && o.who===director && offApplies(o, ds) && (!o.part || o.part==='全天'); })) return false;
  var hr = hospitalHours(hid), a = timeToMin(hospitalClosedBefore(hid, ds) || hr.open), z = timeToMin(hospitalClosedFrom(hid, ds) || hr.close);
  return !((h.directorSchedule||{})[director]||[]).some(function(b){ return b.date===ds && (b.type||b.kind)==='不可预约' && timeToMin(b.time) <= a && timeToMin(b.end) >= z; });
}
function hospitalOpenDates(hid, director){ var out = []; for(var k = -30; k <= 240; k++){ var ds = D(k); if(hospitalOpenOn(hid, director, ds)) out.push(ds); } return out; }
function hospitalOfDirector(name){ for(var k in HOSPITAL_DATA){ if(hospitalDirectors(k).some(function(d){ return d.name===name; })) return k; } return null; }

function timeToMin(t){ return parseInt(t.slice(0,2),10)*60 + parseInt(t.slice(3),10); }
function minToTime(m){ return pad2(Math.floor(m/60))+':'+pad2(m%60); }
function slotsBetween(a, b){ var r = []; for(var m = timeToMin(a); m < timeToMin(b); m += SLOT_MIN) r.push(minToTime(m)); return r; }
function slotIsLunch(t){ var m = timeToMin(t); return m >= timeToMin(CLINIC_SETTINGS.lunchFrom) && m < timeToMin(CLINIC_SETTINGS.lunchTo); }
function slotBookable(t){ var m = timeToMin(t); return m >= timeToMin(CLINIC_SETTINGS.bookFrom) && m <= timeToMin(CLINIC_SETTINGS.bookTo) && !slotIsLunch(t); }
function holdMs(){ return CLINIC_SETTINGS.holdMinutes*60000; }
function noShowMs(){ return CLINIC_SETTINGS.noShowMinutes*60000; }
function fmtRp(n){ return 'Rp '+Number(n||0).toLocaleString('en-US'); }
/* 短信模板填值：{clinic} {name} {time} {address} {phone} {url} {code} */
function smsFill(tpl, v){ return String(tpl||'').replace(/\{(\w+)\}/g, function(s, k){ return v && v[k]!==undefined ? v[k] : s; }); }
/* 设定变化后同步各处的派生值：时区镜像、日历行、改约弹窗的上午/下午时段、默认短信 */
function applyClinicSettings(){
  var s = CLINIC_SETTINGS;
  if(!Array.isArray(s.closedRules)) s.closedRules = (s.closedDow||[]).map(function(i){ return {dow:i, from:''}; }); /* 旧存档：整天休诊的星期转成规则 */
  s.closedDow = s.closedRules.filter(function(r){ return !r.from; }).map(function(r){ return r.dow; });
  s.tz = clinicTzOf(s); /* 时区由地址 / 城市自动判定 */
  CLINIC_TZ = s.tz;
  var t0 = demoNow(); t0.setHours(0,0,0,0); TODAY_DATE = t0; /* 日历的"今天"按页面时区算 */
  WK_HOURS = slotsBetween(s.openTime, s.closeTime);
  RESCHED_AM = slotsBetween(s.bookFrom, s.lunchFrom).filter(slotBookable);
  RESCHED_PM = slotsBetween(s.lunchTo, minToTime(timeToMin(s.bookTo)+SLOT_MIN)).filter(slotBookable);
  DEFAULT_SMS_TEMPLATE = s.sms.link;
  if(typeof applyTzSetting === 'function') applyTzSetting();
}

/* KR 的钟点（韩国当地时间，施术块、到院时间）→ 诊所的钟点（本院日程 / IN 的案件页 / 通知要显示的）；2026-10-08 修正：本院日程原来直接把韩国时间当成诊所时间，同一施术在两个视图差了 2 小时 */
function krToClinic(date, hm){
  var u = localToUtc(date, hm||'00:00', KR_TZ), f = fmtUtc(u, clinicTzOf(CLINIC_SETTINGS));
  return {date:f.slice(0,10), time:f.slice(11,16)};
}
/* 施术时间的文字：KR 页面显示韩国时间；IN 页面显示诊所时间并在括号里写韩国时间（forceIn = 通知等只给 IN 看的文字） */
function ksTimeText(ks, forceIn){
  if(!ks || !ks.confirmedDate) return '';
  if(!forceIn && typeof isKrAccount==='function' && isKrAccount()) return ks.confirmedDate+' '+(ks.confirmedTime||'')+(ks.confirmedTime ? '（韩国）' : '');
  if(!ks.confirmedTime) return ks.confirmedDate;
  var r = krToClinic(ks.confirmedDate, ks.confirmedTime);
  return r.date+' '+r.time+'（印尼）（韩国 '+ks.confirmedTime+'）';
}
function krTimeOf(hr){ /* 诊所时间 hr('HH:mm') → KR 时间 */
  var diff = (tzOffsetMin(KR_TZ) - tzOffsetMin(CLINIC_TZ))/60;
  var t = parseInt(hr.slice(0,2),10)*60 + parseInt(hr.slice(3),10) + diff*60;
  t = ((t % 1440) + 1440) % 1440;
  return pad2(Math.floor(t/60))+':'+pad2(t%60);
}


/* ---- 今日区块 + 固定栏 memo + OFF（2026-10-02·七） ----
   "早上好"下面固定"今日"区块：最上面是今天的 OFF（KR 院长 / KR 室长 / IN 室长），下面是今日行程（时间 · 人名 · 类型）；
   周视图 9:00 上面的固定栏每天一格，显示当天 OFF 和 memo；新增 memo：选日期、类型（备忘/OFF）、公开/私人，OFF 固定公开，显示作者；IN 室长的 OFF 就是从这里来 */
/* ================= 账号（2026-10-05·二） =================
   席位：基础 3 个（OWN 老板、A1 管理者、A2 一般室长）+ 加购账号（A3 起顺序编号；一般室长和管理者都可以加购，单独定价，可以有多个）。
   status：active 使用中 / pending 待激活（还没人设密码）/ disabled 已停用（取消加购后）。
   演示密码 = 账号编号小写 + 123（OWN → own123，A1 → a1123）；待激活账号没有密码，激活时用手机验证码（登录/激活在第三部分做）。
   history：这个账号编号上的变更历史（激活、重置密码、停用…）；操作人以"当时的姓名 + 编号"记录，之后账号换了新的人，旧记录仍显示"A2 室长（A2）"。 */
var ACCOUNT_ROLES = {owner:'老板（诊所管理账号）', manager:'室长（管理者）', general:'一般室长', kr_owner:'代表院长（医院管理账号）', kr_manager:'KR 管理者（室长）', kr_general:'KR 室长', kr_director:'院长'};
var ACCOUNT_STATUS = {active:'使用中', pending:'待激活', disabled:'已停用'};
var BASIC_SEATS = 3;
var ACCOUNTS = [
  {id:'OWN', clinicId:'C1', role:'owner',   seat:'basic', name:'OWN 老板', position:'老板',   phone:'+62 811-0000-0001', status:'active',   password:'own123', photo:'证件照', createdAt:D(-48)+' 09:00', activatedAt:D(-48)+' 09:30', history:[{ts:D(-48)+' 09:30', type:'激活', text:'账号激活，设置了登录密码', by:'OWN 老板（OWN）'}]},
  {id:'A1', clinicId:'C1',  role:'manager', seat:'basic', name:'A1 室长',    position:'室长',   phone:'+62 811-0000-0002', status:'active',   password:'a1123',  photo:'证件照', createdAt:D(-48)+' 09:10', activatedAt:D(-48)+' 10:00', history:[{ts:D(-48)+' 10:00', type:'激活', text:'账号激活，设置了登录密码', by:'A1 室长（A1）'}]},
  {id:'A2', clinicId:'C1',  role:'general', seat:'basic', name:'A2 室长',    position:'前台室长', phone:'+62 811-0000-0003', status:'active',   password:'a2123',  photo:'证件照', createdAt:D(-48)+' 09:20', activatedAt:D(-47)+' 09:00', history:[{ts:D(-47)+' 09:00', type:'激活', text:'账号激活，设置了登录密码', by:'A2 室长（A2）'}]},
  {id:'A3', clinicId:'C1',  role:'general', seat:'addon', name:'',        position:'',       phone:'+62 811-0000-0004', status:'pending',  password:null,     photo:'',           createdAt:D(-2)+' 14:00', activatedAt:'',                 history:[{ts:D(-2)+' 14:00', type:'购买', text:'加购账号 A3（一般室长），待激活，激活手机 +62 811-0000-0004', by:'A1 室长（A1）'}]},
  {id:'A4', clinicId:'C1',  role:'general', seat:'addon', name:'A4 室长',    position:'助理室长', phone:'+62 811-0000-0005', status:'disabled', password:'a4123',  photo:'证件照', createdAt:D(-29)+' 11:00', activatedAt:D(-28)+' 09:00', disabledAt:D(-8)+' 17:00', history:[{ts:D(-28)+' 09:00', type:'激活', text:'账号激活，设置了登录密码', by:'A4 室长（A4）'},{ts:D(-8)+' 17:00', type:'取消加购', text:'取消加购账号 A4，已停用（历史记录保留）', by:'A1 室长（A1）'}]},
  {id:'A5', clinicId:'C1',  role:'manager', seat:'addon', name:'A5 室长',   position:'副室长', phone:'+62 811-0000-0006', status:'active',   password:'a5123',  photo:'证件照', createdAt:D(-1)+' 10:00', activatedAt:D(-1)+' 11:00', history:[{ts:D(-1)+' 10:00', type:'购买', text:'加购管理者账号 A5（老板收验证码确认）', by:'A1 室长（A1）'},{ts:D(-1)+' 11:00', type:'激活', text:'账号激活，设置了登录密码', by:'A5 室长（A5）'}]},
  {id:'B1', clinicId:'C2', role:'manager', seat:'basic', name:'B1 室长', position:'室长', phone:'+62 811-0000-0011', status:'active', password:'b1123', photo:'证件照', createdAt:D(-30)+' 09:00', activatedAt:D(-30)+' 09:30', history:[{ts:D(-30)+' 09:30', type:'激活', text:'账号激活，设置了登录密码', by:'B1 室长（B1）'}]},
  {id:'D1', clinicId:'C3', role:'manager', seat:'basic', name:'D1 室长', position:'室长', phone:'+62 811-0000-0021', status:'active', password:'d1123', photo:'证件照', createdAt:D(-30)+' 09:00', activatedAt:D(-30)+' 09:30', history:[{ts:D(-30)+' 09:30', type:'激活', text:'账号激活，设置了登录密码', by:'D1 室长（D1）'}]},
  {id:'B2', clinicId:'C2', role:'general', seat:'basic', name:'B2 室长', position:'前台室长', phone:'+62 811-0000-0012', status:'active', password:'b2123', photo:'证件照', createdAt:D(-30)+' 09:10', activatedAt:D(-29)+' 09:00', history:[{ts:D(-29)+' 09:00', type:'激活', text:'账号激活，设置了登录密码', by:'B2 室长（B2）'}]}
,
  /* KR 医院账号（2026-10-06）：编号 K+角色字母（O 代表院长 / M 管理者 / C 室长 / D 院长）+医院序号，和 IN 的 OWN、A 开头、B 开头编号不冲突；密码 = 编号小写 + 123 */
  {id:'KO1', hospitalId:'H1', role:'kr_owner',    seat:'basic', name:'KO1 代表院长',   position:'代表院长', phone:'+82 10-0000-0001', status:'active', password:'ko1123', photo:'证件照', createdAt:D(-60)+' 09:00', activatedAt:D(-60)+' 09:30', history:[{ts:D(-60)+' 09:30', type:'激活', text:'账号激活，设置了登录密码', by:'KO1 代表院长（KO1）'}]},
  {id:'KM1', hospitalId:'H1', role:'kr_manager',  seat:'basic', name:'KM1 室长',   position:'室长',     phone:'+82 10-0000-0002', status:'active', password:'km1123', photo:'证件照', createdAt:D(-60)+' 09:10', activatedAt:D(-60)+' 10:00', history:[{ts:D(-60)+' 10:00', type:'激活', text:'账号激活，设置了登录密码', by:'KM1 室长（KM1）'}]},
  {id:'KC1', hospitalId:'H1', role:'kr_general',  seat:'basic', name:'KC1 室长',   position:'室长',     phone:'+82 10-0000-0003', status:'active', password:'kc1123', photo:'证件照', createdAt:D(-60)+' 09:20', activatedAt:D(-59)+' 09:00', history:[{ts:D(-59)+' 09:00', type:'激活', text:'账号激活，设置了登录密码', by:'KC1 室长（KC1）'}]},
  {id:'KD1', hospitalId:'H1', role:'kr_director', seat:'addon', name:'KD1 院长', position:'院长',   phone:'+82 10-0000-0004', status:'active', password:'kd1123', photo:'证件照', createdAt:D(-40)+' 09:00', activatedAt:D(-40)+' 09:30', history:[{ts:D(-40)+' 09:30', type:'激活', text:'账号激活，设置了登录密码', by:'KD1 院长（KD1）'}]},
  {id:'KM2', hospitalId:'H2', role:'kr_manager',  seat:'basic', name:'KM2 室长',   position:'室长',     phone:'+82 10-0000-0011', status:'active', password:'km2123', photo:'证件照', createdAt:D(-50)+' 09:10', activatedAt:D(-50)+' 10:00', history:[{ts:D(-50)+' 10:00', type:'激活', text:'账号激活，设置了登录密码', by:'KM2 室长（KM2）'}]},
  {id:'KC2', hospitalId:'H2', role:'kr_general',  seat:'basic', name:'KC2 室长',   position:'室长',     phone:'+82 10-0000-0012', status:'active', password:'kc2123', photo:'证件照', createdAt:D(-50)+' 09:20', activatedAt:D(-49)+' 09:00', history:[{ts:D(-49)+' 09:00', type:'激活', text:'账号激活，设置了登录密码', by:'KC2 室长（KC2）'}]}
];
/* 种子账号补齐（2026-10-07）：版本号重置时账号资料从存档保留，新增的种子账号（如 C3 的 D1）要补进去，已有的不动 */
var SEED_ACCOUNTS_COPY = JSON.parse(JSON.stringify(ACCOUNTS));
function ensureSeedAccounts(){ SEED_ACCOUNTS_COPY.forEach(function(a){ if(!ACCOUNTS.some(function(x){ return x.id===a.id; })) ACCOUNTS.push(JSON.parse(JSON.stringify(a))); }); }
var PURCHASE_REQ = null; /* 管理者加购"管理者账号"时发给老板的验证码：{code, by, qty, exp(毫秒时间戳), used}；演示：老板登录后在页面顶部看到 */
var ACCOUNT_SEQ = 5; /* 本诊所下一个加购账号编号 = 诊所账号前缀 + (ACCOUNT_SEQ+1)；每家诊所各一份（存在诊所分区里；C1 前缀 A，C2 前缀 B） */
/* 操作日志（owner/管理者在"操作日志"页看；第八部分做页面）：时间、操作账号 + 当时的姓名、内容、类型 */
var ACCOUNT_LOG = [
  {id:'log1', clinicId:'C1', ts:D(-2)+' 14:00', accountId:'A1', name:'A1 室长', type:'账号管理', sub:'购买', target:'A3', text:'购买加购账号 A3（一般室长）'},
  {id:'log2', clinicId:'C1', ts:D(-8)+' 17:00', accountId:'A1', name:'A1 室长', type:'账号管理', sub:'退订', target:'A4', text:'退订加购账号 A4（A4 室长）'},
  {id:'log3', clinicId:'C1', ts:D(-1)+' 10:00', accountId:'A1', name:'A1 室长', type:'账号管理', sub:'购买', target:'A5', text:'购买加购管理者账号 A5（老板验证码确认）'}
];
/* 当前登录的账号：存在 sessionStorage 的 gmc_acct（每个标签页各自登录，互不影响）；没登录、账号被停用/被重置成待激活，都返回 null */
function currentAccountId(){
  var id = null;
  try{ id = sessionStorage.getItem('gmc_acct'); }catch(e){}
  var a = id ? ACCOUNTS.filter(function(x){ return x.id===id && x.status==='active'; })[0] : null;
  return a ? a.id : null;
}
function currentAccount(){ return accountById(currentAccountId()); }
var ME_NAME = (currentAccount() || {name:''}).name || '';
/* 演示账号链接（?demo=账号，见 login.html，CMD-1007-02）：必须在下面算出页面所属诊所之前执行（诊所由登录账号决定）。只接受演示数据里存在且已激活的账号（待激活/停用不能这样登录；之后 guardPage 还会按存档里的真实状态再查一次）；在本分页登录（sessionStorage）后把参数从地址栏清掉。登录页自己处理，不在这里 */
(function applyDemoParam(){
  try{
    if(/\/login\.html$/.test(location.pathname)) return;
    var p = new URLSearchParams(location.search), id = p.get('demo'); if(!id) return;
    var a = ACCOUNTS.filter(function(x){ return x.id===String(id).toUpperCase(); })[0];
    if(a && a.status==='active') sessionStorage.setItem('gmc_acct', a.id);
    p.delete('demo'); var q = p.toString();
    history.replaceState(null, '', location.pathname + (q ? '?'+q : '') + location.hash);
  }catch(e){}
})();
var PAGE_CLINIC_ID = resolveClinicId(); /* 这个页面所属的诊所：登录账号的诊所；客户预约页看地址里的 ?clinic=（原型不带默认 C1）；登录页没有 = null */
CURRENT_CLINIC_ID = 'C1'; /* 演示数据种子一律按 C1 生成；种子跑完后（本文件末尾）才改成 PAGE_CLINIC_ID */
/* 演示数据种子（SEEDING=true，data.js 末尾置 false）里的"当前操作人"固定写 A1 室长，不随打开页面的账号变化；运行时 = 当前登录的人 */
var SEEDING = true;
var SEED_ACTOR = 'A1 室长'; /* 种子数据里的"当前操作人"（C1 = A1 室长；生成其他诊所的种子时临时改成那家诊所的室长） */
function actingName(){ return SEEDING ? SEED_ACTOR : ME_NAME; }
/* IN 室长名单 = 使用中的非老板账号的姓名（账号被停用/重置/激活后重新计算） */
function syncInCoordinators(){
  var names = clinicAccounts().filter(function(a){ return a.role!=='owner' && a.status==='active' && a.name; }).map(function(a){ return a.name; });
  IN_COORDINATORS.length = 0; Array.prototype.push.apply(IN_COORDINATORS, names);
}
/* 写操作日志：当前账号 + 当时的姓名 */
function logOp(type, text, sub, target){ /* type：账号管理 / 设定变更 / 其他；sub：购买 / 退订 / 重设 / 激活；target：被操作的账号编号（账号详情里看"该账号的 log"） */
  var a = currentAccount() || {id:'?', name:''};
  ACCOUNT_LOG.unshift({id:'log'+Date.now()+Math.floor(Math.random()*1000), clinicId:(a.hospitalId ? null : (a.clinicId||CURRENT_CLINIC_ID)), hospitalId:(a.hospitalId||null), ts:nowFullDt(), accountId:a.id, name:a.name, type:type, sub:sub||'', target:target||'', text:text});
}

/* KR 医院的 OFF（院长 / 室长，KR 端工作台日历上标的）：IN 的今日 OFF、周视图固定栏、月视图都读这里；原来 CAL_MEMOS 里 KR 角色的演示 OFF 不再用 */
function krOffMemos(date){
  var out = [];
  linkedHospitalIds().forEach(function(hid){ ((HOSPITAL_DATA[hid]||{}).offs||[]).forEach(function(o){ if(offApplies(o, date)) out.push({id:o.id||('off'+o.who+o.date), date:date, weekly:!!o.weekly, type:'OFF', scope:'公开', role:o.kind==='director' ? 'KR院长' : 'KR室长', person:o.who+((o.part && o.part!=='全天') ? '（'+o.part+'）' : ''), author:'KR'}); }); });
  return out;
}
function memosOn(date){ return CAL_MEMOS.filter(function(m){ return (m.weekly ? m.dow===new Date(date+'T00:00:00').getDay() : m.date===date) && !/^KR/.test(m.role||'') && (m.scope==='公开' || m.author===ME_NAME); }).concat(CAL_VIEW==='kr' ? krOffMemos(date) : []); } /* 本院日程只显示 IN 室长的 OFF；KR 人员的 OFF 只在「KR 医院日程」显示（CMD-1013-09 补充 2） */

/* 固定栏里自己写的 memo（备忘 / OFF）后面的小字「修改」；别人写的公开 memo、KR 的 OFF 没有 */
function memoEditLink(m){ return (m.author===ME_NAME && CAL_MEMOS.some(function(x){ return x.id===m.id; })) ? ' <a href="#" onclick="event.stopPropagation();openMemoModal(\''+m.id+'\');return false;" style="font-size:10px;font-weight:400;color:var(--muted);text-decoration:underline;">修改</a>' : ''; }
function memoCellHtml(ds){
  return memosOn(ds).map(function(m){
    return m.type==='OFF'
      ? '<div style="color:#C1454A;font-weight:700;">OFF · '+m.person+(m.from ? '（'+m.from+'–'+m.to+'）' : '')+memoEditLink(m)+'</div>'
      : '<div style="color:var(--slate2);">📝 '+m.text+' <span style="color:var(--muted);">'+m.author+(m.scope==='私人'?' · 私人':'')+'</span>'+memoEditLink(m)+'</div>';
  }).join('');
}

function memoSet(k, v){
  if(k==='text'){ MEMO_DRAFT.text = v; return; }
  MEMO_DRAFT[k] = v;
  if(MEMO_DRAFT.type==='OFF') MEMO_DRAFT.scope = '公开'; /* 类型=OFF 时固定为公开 */
  renderMemoBody();
}

/* ---- KR 医院日程视角（只读，2026-10-02·八）：KR 室长登记的日程、院长日程（下拉切换院长）、KR 开放的施术日期；
   有空 = 白色，已排的事 = 浅灰块，每件事一个独立的块（中间留缝隙）。演示数据：两位院长，KD1 院长 当天几乎满档 ---- */
var CAL_VIEW = 'in', KR_DIRECTOR = '', KR_HOSPITAL = ''; /* KR 医院日程视角：先选医院（只列本诊所对接的），再选该医院的院长 */
function krViewHospital(){ var ids = linkedHospitalIds(); return (KR_HOSPITAL && ids.indexOf(KR_HOSPITAL)>-1) ? KR_HOSPITAL : (ids[0] || ''); }
function krViewDirector(){ var names = hospitalDirectorNames(krViewHospital()); return names.indexOf(KR_DIRECTOR)>-1 ? KR_DIRECTOR : (names[0] || ''); }

var KR_COORD_SCHEDULE = []; /* 室长的内部日程不进平台 */
var KR_DIRECTOR_SCHEDULE = {}; /* KR 医院日程的块全部由 seedKrMonthDemo（不可预约）和案件（施术）生成，不再写死 */

/* ---- 预约历史记录（2026-10-02·八）：全部从案件/占位数据算 ---- */
function resvHistoryRows(){
  var rows = [];
  CASE_ITEMS.forEach(function(c){ if(c.visitDate) rows.push({name:c.name, caseNo:c.caseNo, caseId:c.id, date:c.visitDate, time:c.visitTime, type:visitStateOf(c)}); });
  RESUMED_VISITS.forEach(function(r){ rows.push({name:r.name, caseNo:r.origCaseNo, caseId:r.caseId, date:r.date, time:r.time, type:'已到访'}); }); /* 接续：显示原案件 ID，类型已到访 */
  RESERVATION_PLACEHOLDERS.forEach(function(ph){ if(phConverted(ph)) return; rows.push({name:ph.phone, caseNo:null, caseId:null, date:ph.date, time:ph.time, type:'预约占位'}); });
  PLACEHOLDER_HISTORY.forEach(function(ph){ rows.push({name:ph.phone, caseNo:ph.caseNo||null, caseId:ph.caseId||null, date:ph.date, time:ph.time, type:ph.status||'占位失效'}); });
  return rows.sort(function(a,b){ return (b.date+b.time).localeCompare(a.date+a.time); });
}
 /* 直接进工作台：今天在第一栏往后排7天；从月视图点某一周进来：完整一周（周一到周日） */
function getWeekStart(offset){
  var d = new Date(CAL_WEEK_FULL && CAL_ANCHOR ? CAL_ANCHOR : TODAY_DATE);
  if(CAL_WEEK_FULL){ var wd = d.getDay(); d.setDate(d.getDate() + (wd===0 ? -6 : 1-wd)); } /* 周一 */
  d.setDate(d.getDate()+offset*7);
  return d;
}

function sameDate(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

function slotOf(time){ var h = time.slice(0,2), m = parseInt(time.slice(3),10); return h+':'+(m>=30?'30':'00'); }

/* 接续作废的预约：本案件作废后，这条预约来访改挂到原案件（显示"已到访"） */
var RESUMED_VISITS = [];

/* 预约占位的历史记录（失效/取消的占位），供"预约历史记录"页用 */
var PLACEHOLDER_HISTORY = [{id:'phx1', phone:'+62 812-3300-0099', date:D(-1), time:'13:00', status:'占位失效', link:'https://gmc.link/old01', purpose:'面诊商谈'}];

/* 日历事件：全部从案件数据实时算出来（一份数据，其他页面和日历不会各说各的）：
   预约来访 = 每个案件的 visitDate/visitTime；赴韩施术 = 案件里已确认的施术日期；预约占位 = RESERVATION_PLACEHOLDERS */
function visitStateOf(c){
  if(c.subState==='cancelled') return c.noShow ? '未到店' : '预约取消';
  if(c.subState==='arrived' || c.hasArrived) return '已到访';
  return '待访问';
}

function calendarEvents(){
  var evs = [];
  CASE_ITEMS.forEach(function(c){
    if(c.visitDate && c.visitTime) evs.push({kind:'reservation', date:c.visitDate, time:c.visitTime, name:c.name, caseId:c.id, purpose:c.visitPurpose, vstate:visitStateOf(c), ended:isEnded(c)});
    var ks = c.krSchedule;
    if(ks && ks.confirmedDate && (ks.status==='confirmed' || ks.status==='arrived' || ks.status==='change_pending'))
      (function(){ var r = krToClinic(ks.confirmedDate, ks.confirmedTime||'14:00'); evs.push({kind:'travel', date:r.date, time:r.time, name:c.name, caseId:c.id, ended:isEnded(c)}); })(); /* KR 的到院时间换算成诊所时间 */
  });
  RESUMED_VISITS.forEach(function(r){ evs.push({kind:'reservation', date:r.date, time:r.time, name:r.name, caseId:r.caseId, purpose:r.purpose, vstate:'已到访', ended:false}); });
  RESERVATION_PLACEHOLDERS.forEach(function(ph){ if(phConverted(ph)) return; evs.push({kind:'placeholder', date:ph.date, time:ph.time, name:ph.phone, phId:ph.id, purpose:ph.purpose}); });
  return evs;
}

function eventChipHtml(e){
  var now = demoNow();
  var when = new Date(e.date+'T'+e.time+':00');
  var past = (when < now);
  var grey = (past && e.kind!=='placeholder') ? 'opacity:.5;filter:grayscale(1);' : ''; /* 只有已过去 / 已结束的事件块是灰色，灰色块照样可以点开；超时/取消的占位从日历消失（在预约历史记录里看） */
  var l1, l2, onclick;
  if(e.kind==='reservation'){
    l1 = e.vstate==='未到店' ? '<s>'+e.name+'</s>' : e.name;
    l2 = (e.purpose||'')+(e.vstate==='已到访' ? '（已到访）' : '')+(e.vstate==='未到店' ? ' 未到店' : '');
    if(e.ended) grey = 'opacity:.5;filter:grayscale(1);';
    if(e.vstate==='待访问' && past){
      var left = when.getTime() + noShowMs() - now.getTime();
      if(left > 0){ grey = ''; l2 += ' <b data-visit-countdown="'+when.getTime()+'">'+Math.floor(left/60000)+'分'+pad2(Math.floor(left%60000/1000))+'秒</b>'; } /* 30 分钟内未到访：保持亮色+倒计时 */
    }
    onclick = e.caseId ? 'openCaseDetail(\''+e.caseId+'\')' : 'void(0)';
  } else if(e.kind==='travel'){
    l1 = e.name; l2 = '赴韩施术';
    if(e.ended) grey = 'opacity:.5;filter:grayscale(1);';
    onclick = 'openCaseDetail(\''+e.caseId+'\')';
  } else {
    var ph = RESERVATION_PLACEHOLDERS.filter(function(x){ return x.id===e.phId; })[0];
    l1 = e.name; l2 = (e.purpose||'占位')+' <span data-ph-countdown="'+e.phId+'">'+(ph?placeholderCountdownText(ph):'')+'</span>';
    onclick = 'openPlaceholderModal(\''+e.phId+'\')';
  }
  var dashed = e.kind==='placeholder' ? 'border-style:dashed;' : '';
  return '<div class="event-chip" title="'+e.time+' '+TYPE_LABEL[e.kind]+' · '+e.name+(e.purpose?' · '+e.purpose:'')+'" style="'+grey+dashed+'border-color:'+TYPE_COLOR[e.kind]+';background:'+TYPE_BG[e.kind]+';" onclick="event.stopPropagation();'+onclick+'"><div class="l1"><b>'+l1+'</b>'+(l2 ? ' · '+l2 : '')+'</div></div>'; /* 每个预约一行："名字（粗体）· 来访目的" */
}

function calPrev(){ if(CAL_MODE==='week') WEEK_OFFSET--; else if(CAL_MODE==='day') DAY_OFFSET--; else MONTH_OFFSET--; renderCalendar(); }

function calNext(){ if(CAL_MODE==='week') WEEK_OFFSET++; else if(CAL_MODE==='day') DAY_OFFSET++; else MONTH_OFFSET++; renderCalendar(); }

function calToday(){ WEEK_OFFSET=0; DAY_OFFSET=0; MONTH_OFFSET=0; CAL_WEEK_FULL=false; CAL_ANCHOR=null; renderCalendar(); }
 /* 回今天：今天在第一栏 */


/* ---- 客户档案读写（2026-10-06·K） ---- */
function normPhoneKey(p){ return String(p||'').replace(/\D/g,''); } /* 只比数字：+62 812-3000-0001 和 6281230000001 视为同一个手机号 */
function clientByPhone(phone){ var k = normPhoneKey(phone); if(!k) return null; return CLIENTS.filter(function(c){ return normPhoneKey(c.phone)===k; })[0] || null; }
function clientByName(name){ return CLIENTS.filter(function(c){ return c.name===name; })[0] || null; }
function clientPhoneOf(name){ var c = clientByName(name); return c && c.phone ? c.phone : ''; }
/* 新建客户档案：写"建档"到客户 Timeline；consent 可选 {version, ts, source} */
/* 客人姓名分两栏（2026-10-07，BOOK-01 / IN-CLNT-01）：名（必填）+ 姓（选填，有些印尼人只有一个名字），显示"名 姓"；
   客户档案里 name = 显示用的"名 姓"（案件、持有项目等都按它关联，不变），另存 firstName / lastName；旧资料迁移：原姓名放进"名"。员工账号维持一栏 */
function joinName(first, last){ first = String(first||'').trim(); last = String(last||'').trim(); return last ? first+' '+last : first; }
function normClientNames(){ (CLIENTS||[]).forEach(function(c){ if(c.firstName===undefined){ c.firstName = c.name; c.lastName = ''; } }); }
function addClient(o){
  var ts = nowFullDt();
  if(o.firstName!==undefined) o.name = joinName(o.firstName, o.lastName);
  var c = {id:'cl'+Date.now()+Math.floor(Math.random()*1000), clinicId:CURRENT_CLINIC_ID, name:o.name, firstName:(o.firstName!==undefined ? String(o.firstName).trim() : o.name), lastName:(o.firstName!==undefined ? String(o.lastName||'').trim() : ''), gender:o.gender||'—', dob:o.dob||'', phone:o.phone||'', note:'无', history:o.history||'无',
    passport:{text:'未登记', date:''}, beautyRecords:[], consents:o.consent ? [o.consent] : [], createdBy:o.createdBy||actingName(), updated:'刚刚',
    fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'},
    timeline:[{stage:'建档', actor:o.createdBy||actingName(), actorId:(o.createdBy&&o.createdBy!==actingName()) ? undefined : currentAccountId(), action:'建档 · '+(o.source||'室长建档'), dt:ts, kind:'plain'}]};
  CLIENTS.unshift(c);
  return c;
}
/* 案件的基础资料：客户档案是唯一来源（手机号、性别、出生日期、病史），找不到客户时退回案件上的旧值 */
function caseBasic(c){
  var cl = clientByName(c.name), b = c.basic || {};
  return {gender:cl ? cl.gender : (b.gender||'—'), dob:cl ? (cl.dob||'—') : (b.dob||'—'), contact:cl ? (cl.phone||'—') : (b.contact||'—'), history:cl ? (cl.history||'无') : (b.history||'无')};
}

/* ---- 医美史（结构化，2026-10-06）：客户档案里一笔一笔的记录 {id, year, month, project, source:'客人自填'|'室长登记', addedAt, newCaseId} ----
   newCaseId：老客人在预约页新增（或室长在案件基础资料里补登）时记下那个案件，用来标"本次新增"；室长确认基础资料后标记自动消失 */
function beautyRecordsOf(cl){ return (cl && cl.beautyRecords) || []; }
function addBeautyRecord(cl, o){
  cl.beautyRecords = cl.beautyRecords || [];
  /* 每一笔永久保留来源信息：来源 + 登记时间 + 所属案件 ID（室长登记的再加操作人，如"A1 室长（A1）"）；newCaseId 只管"本次新增"标记 */
  var staff = (o.source||'室长登记')==='室长登记';
  var r = {id:'br'+Date.now()+Math.floor(Math.random()*1000), year:o.year, month:o.month, project:o.project, source:o.source||'室长登记', addedAt:nowFullDt(), caseId:o.caseId||null, by:staff ? accountLabel(currentAccountId()) : '', newCaseId:o.newCaseId||null};
  cl.beautyRecords.push(r); cl.updated = '刚刚';
  return r;
}
function beautyYm(r){ return r.year+'年'+r.month+'月'; }
/* "本次新增"标记：该案件还没结束、基础资料还没确认，才显示 */
function beautyRecordIsNew(r){
  if(!r.newCaseId) return false;
  var c = CASE_ITEMS.filter(function(x){ return x.id===r.newCaseId; })[0];
  return !!c && !isEnded(c) && !c.materialsConfirmed;
}
/* 这个案件"本次新增"的医美史（延续既往面诊判断"有新增医美史"读它；不看标记是否还显示） */
function newBeautyRecordsOf(c){ return beautyRecordsOf(clientByName(c.name)).filter(function(r){ return r.newCaseId===c.id; }); }
function projectNameOptions(){ return PROJECT_LIBRARY.filter(function(p){ return p.active!==false; }).map(function(p){ return p.name; }); }

/* ================= 客户自助预约（2026-10-06·B；页面是 booking.html + shared/booking.js，规则和数据都在这里） ================= */
/* ---- 短信（演示：不真的发，全部记在 SMS_LOG；模板读诊所设定，验证码格式固定） ---- */
var SMS_LOG = [];   /* {id, ts, to, kind, text, caseId} */
var SMS_SEQ = 1;
var SMS_KIND_NAMES = {code:'验证码', link:'预约链接', confirm:'预约确认', remind:'预约提醒', cancel:'预约取消'};
var SMS_CODE_FORMAT = '【GMC Network】Kode verifikasi / 验证码：{code}（5 menit / 5 分钟内有效）。Jangan beritahu siapa pun / 请勿告诉他人。';
function bookingUrl(params){ return location.origin + '/booking.html?' + new URLSearchParams(Object.assign({clinic:CURRENT_CLINIC_ID}, params)).toString(); } /* 链接必须带诊所（?clinic=）；原型不带默认 C1，正式版没带应显示错误 */
function caseViewUrl(c){ return bookingUrl({view:c.caseNo}); }
function logSms(kind, to, text, caseId){
  var s = {id:'sms'+(SMS_SEQ++), ts:nowFullDt(), to:to, kind:kind, text:text, caseId:caseId||null};
  SMS_LOG.unshift(s);
  if(SMS_LOG.length > 300) SMS_LOG.length = 300;
  return s;
}
/* 按类型发短信：code 用固定格式，其余读诊所设定的模板 */
function sendSms(kind, to, vars, caseId){
  var tpl = kind==='code' ? SMS_CODE_FORMAT : CLINIC_SETTINGS.sms[kind];
  var text = smsFill(tpl, Object.assign({clinic:CLINIC_SETTINGS.name, address:CLINIC_SETTINGS.address, phone:CLINIC_SETTINGS.phone}, vars||{}));
  return logSms(kind, to, text, caseId);
}
function smsVarsOfCase(c){ return {name:c.name, time:c.visitDate+' '+c.visitTime, url:caseViewUrl(c)}; }

/* ---- 时段：每个时段的预约数达到诊所设定的上限就不能再选 ---- */
function slotBookingCount(date, time, excludePhId, excludeCaseId){
  var slot = slotOf(time), n = 0;
  CASE_ITEMS.forEach(function(c){
    if(c.id!==excludeCaseId && c.visitDate===date && c.visitTime && slotOf(c.visitTime)===slot){ var v = visitStateOf(c); if(v!=='预约取消' && v!=='未到店') n++; }
  });
  RESERVATION_PLACEHOLDERS.forEach(function(ph){ if(ph.date===date && slotOf(ph.time)===slot && ph.id!==excludePhId) n++; });
  return n;
}
/* 所有选预约时间的地方共用这一套规则（IN 端预约修改、工作台代约、预约占位、booking.html），以演示时钟 demoNow() 为准：
   返回 '' = 可约；否则是不可约的原因：past 已经过去（灰色无文字）/ full 额满（灰色 + "已满"）/ closed 休诊 / lunch 午休 / outside 不在可预约时段。
   excludePhId：室长发的占位自己占着的时段；excludeCaseId：正在改约的案件自己（不算它自己占的名额） */
function dateIsPast(ds){ return ds < dateStr(demoNow()); }
function slotIsPast(date, time){ return new Date(date+'T'+time+':00').getTime() + SLOT_MIN*60000 <= demoNow().getTime(); } /* 时段已结束；现在所在的时段还能选 */
function slotBlockReason(date, time, excludePhId, excludeCaseId){
  var d = new Date(date+'T00:00:00');
  /* 室长发的占位本身占着的时段：就算在午休/可预约时段之外也认（室长特意留的），只检查是否已过、是否约满 */
  var own = excludePhId ? findPlaceholder(excludePhId) : null, ownSlot = !!own && own.ph.date===date && slotOf(own.ph.time)===slotOf(time);
  if(!ownSlot){
    if(isRescheduleDateDisabled(d)) return 'closed';
    var cf = closedFromOf(CLINIC_SETTINGS.closedRules, d.getDay()); if(cf && timeToMin(time) >= timeToMin(cf)) return 'closed'; /* 部分时段休诊 */
    if(slotIsLunch(time)) return 'lunch';
    if(!slotBookable(time)) return 'outside';
  }
  if(slotIsPast(date, time)) return 'past';
  if(slotBookingCount(date, time, excludePhId, excludeCaseId) >= CLINIC_SETTINGS.slotCapacity) return 'full';
  return '';
}
/* 当前时段（到店自己填：时间 = 现在，取整到 30 分钟） */
function currentSlotNow(){ var d = demoNow(); return {date:dateStr(d), time:pad2(d.getHours())+':'+(d.getMinutes()>=30?'30':'00')}; }

/* ---- 找占位（链接里的 ph 参数）：还在 → 活的；超时了 → 在历史里，链接仍有效（第 1 步时间可改选） ---- */
function findPlaceholder(id){
  var live = RESERVATION_PLACEHOLDERS.filter(function(p){ return p.id===id; })[0];
  if(live) return {ph:live, live:true};
  var old = PLACEHOLDER_HISTORY.filter(function(p){ return p.id===id; })[0];
  return old ? {ph:old, live:false} : null;
}

/* ---- 提交自助预约（booking.html 第 7 步）：建客户档案（新客人）/ 更新老客人资料、记同意书、建预约案件、占位转预约、通知 IN、发确认短信 ----
   f：{entry:'web'|'link'|'walkin', phId, date, time, phone, name, gender, dob, history, beauty[{ym:'2024-03', project}], purpose, note, rebookFrom(取消后重新预约的原案件 id)} */
/* 占位已转成预约（c.fromPh）→ 占位不再显示（CMD-1013-13 一·1：提交即转成预约，不留孤儿占位） */
function phConverted(ph){ return CASE_ITEMS.some(function(c){ return c.fromPh===ph.id; }); }
function submitSelfBooking(f){
  if(f.entry==='walkin'){ var cs = currentSlotNow(); f.date = cs.date; f.time = cs.time; }
  else { var why = slotBlockReason(f.date, f.time, f.phId); if(why) return {ok:false, reason:why}; }
  var consent = {version:CLINIC_SETTINGS.privacyVersion, ts:nowFullDt(), source:'客户自助预约'};
  var cl = clientByPhone(f.phone), isNew = !cl;
  if(isNew){
    cl = addClient({name:f.name, firstName:f.firstName, lastName:f.lastName, phone:f.phone, gender:f.gender, dob:f.dob, history:(f.history||'').trim()||'无', createdBy:'客人自助', source:'客户自助预约建档', consent:consent});
  } else {
    /* 老客人资料有变化由室长到店接待时修改，预约页不提供修改：这里只记同意书（版本更新过才会重新勾选），不改客户档案 */
    if(f.consentGiven) cl.consents.push(consent);
    cl.updated = '刚刚';
  }
  var c = createReservationCase(cl.name, null, f.date, f.time, f.phone, f.purpose);
  c.visitNote = (f.note||'').trim(); c.bookEntry = f.entry; c.remindSent = false;
  /* 占位转预约：按占位 id，或同手机号 + 同一时段的占位一起收掉；预约历史里这行记为「已转预约」 */
  var pk = normPhoneKey(f.phone), conv = RESERVATION_PLACEHOLDERS.filter(function(x){ return x.id===f.phId || (normPhoneKey(x.phone)===pk && x.date===f.date && x.time===f.time); });
  RESERVATION_PLACEHOLDERS = RESERVATION_PLACEHOLDERS.filter(function(x){ return conv.indexOf(x)<0; });
  conv.forEach(function(x){ PLACEHOLDER_HISTORY.push({id:x.id, phone:x.phone, date:x.date, time:x.time, status:'已转预约', link:x.link, purpose:x.purpose, caseNo:c.caseNo, caseId:c.id}); });
  if(f.phId){ c.fromPh = f.phId; var hv = PLACEHOLDER_HISTORY.filter(function(x){ return x.id===f.phId && x.status==='占位失效'; })[0]; if(hv){ hv.status = '已转预约'; hv.caseNo = c.caseNo; hv.caseId = c.id; } } /* 已超时的占位链接仍有效：提交后也记为已转预约 */
  c.bookClient = isNew ? 'new' : 'old'; c.consentResigned = !isNew && !!f.consentGiven; /* 记录：新客 / 老客、老客是否重签同意书（测试覆盖页用，CMD-1012-06） */
  /* 医美史（结构化）：年月 + 项目 + 来源"客人自填"；老客人新增的标"本次新增"（到店时室长在基础资料里看得到并确认；延续既往面诊的"有新增医美史"读它） */
  (f.beauty||[]).forEach(function(b){ if(b && b.ym && b.project) addBeautyRecord(cl, {year:+b.ym.slice(0,4), month:+b.ym.slice(5,7), project:b.project, source:'客人自填', caseId:c.id, newCaseId:isNew ? null : c.id}); });
  if(f.entry==='walkin') c.logEntries[0].action = '到店自己填资料（平板/手机）预约成功，生成 Case ID '+c.caseNo;
  else if(f.entry==='link') c.logEntries[0].action = '客人通过预约链接填完资料，预约成功，生成 Case ID '+c.caseNo;
  var when = dateLabel(f.date)+' '+f.time, tail = '：'+cl.name+'（'+c.caseNo+'）'+when+(c.visitNote ? ' · '+c.visitNote : '');
  var old = f.rebookFrom ? CASE_ITEMS.filter(function(x){ return x.id===f.rebookFrom; })[0] : null;
  if(old && old.cancelNotifId && Date.now()-(old.cancelledAt||0) < 30*60000){
    /* 取消后马上重新预约：把"客人取消预约"那条通知收回，只留一条合并的"客人改约" */
    NOTIFS = NOTIFS.filter(function(n){ return n.id!==old.cancelNotifId; }); old.cancelNotifId = null;
    pushNotif('预约', '客人改约：'+cl.name+' 原 '+dateLabel(old.visitDate)+' '+old.visitTime+' → 新 '+when+'（'+c.caseNo+'）', {caseId:c.id, names:workingIN()});
  } else if(f.entry==='walkin') pushNotif('预约', '客人到店自己填完资料'+tail+'，请在客人到店后点［已到店］', {caseId:c.id, names:workingIN()});
  else if(f.phId) pushNotif('预约', '占位客人填完资料'+tail, {caseId:c.id, names:workingIN()});
  else pushNotif('预约', '客人自助预约提交'+tail, {caseId:c.id, names:workingIN()});
  sendSms('confirm', f.phone, smsVarsOfCase(c), c.id);
  return {ok:true, c:c, client:cl, isNew:isNew};
}

/* ---- 客人自己取消预约（booking.html?view=）：预约时间前都可以取消，没有截止时间 ---- */
/* ---- 客人端「我的预约」的数据（BOOK-01 第 3 节，2026-10-07）：只读，只读本诊所的数据 ---- */
/* 目前的预约：待到店的（还没到预约时间） */
function clientCurrentCases(cl){ return CASE_ITEMS.filter(function(c){ return c.name===cl.name && visitStateOf(c)==='待访问' && c.stage==='booked'; }).sort(function(a,b){ return (a.visitDate+a.visitTime).localeCompare(b.visitDate+b.visitTime); }); }
/* 持有项目：剩余次数>0；分印尼 / 韩国（韩国的 = 项目属赴韩 / 分类"韩国…"）；只显示项目名称和剩余次数 */
function clientHoldingsView(cl){
  var out = {IN:[], KR:[]};
  (CLIENT_HOLDINGS[cl.name]||[]).forEach(function(h){ var rem = holdingRemaining(h); if(rem<=0) return; (h.origin==='KR' || /^韩国/.test(h.category||'') ? out.KR : out.IN).push({name:h.itemName, remaining:rem}); });
  return out;
}
/* 过去的记录：只列有到店的案件（不列预约取消、未到店）；日期（赴韩为施术日期）/ Case ID / 做了什么 / 医院 + 院长（赴韩才有）/ 实付金额（按付款币种，有退款标示）；面诊诊疗方案只标"已出诊疗方案"，不显示内容 */
function clientPastRecords(cl){
  return CASE_ITEMS.filter(function(c){ return c.name===cl.name && visitStateOf(c)==='已到访'; }).map(function(c){
    var kr = krAllItems(c).filter(function(it){ return !it.cancelled && !it.swapped; }), travel = kr.length > 0;
    var local = []; (c.settlementBatches||[]).forEach(function(b){ (b.inItems||[]).forEach(function(it){ if(local.indexOf(it.name)<0) local.push(it.name); }); });
    if(c.localMgmt) (c.localMgmt.batches||[]).forEach(function(b){ (b.items||[]).forEach(function(it){ if(local.indexOf(it.name)<0) local.push(it.name); }); });
    var uses = (c.mgmtUses||[]).concat((c.localMgmt && c.localMgmt.mgmtUses) || []).map(function(u){ return u.itemName; });
    var did = [];
    if(travel) did.push(kr.map(function(it){ return it.name; }).join('、'));
    if(local.length) did.push(local.join('、'));
    if(uses.length) did.push(uses.join('、'));
    if(!did.length) did.push(c.consultRequested ? '面诊' : ''); /* 只有面诊才写"面诊" */
    /* 实付金额（按币种分开）= 面诊费 + 定金 + 尾款 + 韩国加做（韩元）/ 面诊费 + 本地项目 + 印尼加做（印尼盾）；有退款显示退款后的金额并标"含退款" */
    var fp = financePaid(c), fee = consultFeePaid(c) ? consultFeeOf(c) : 0, info = krBalanceInfo(c);
    var balance = (c.krBalancePaid && info.diff > 0) ? info.diff : 0; /* 尾款：付清后才算；定金多了退差额的情况已在退款里扣 */
    var addOn = (c.settlementBatches||[]).filter(function(b){ return b.addOn && b.status==='active'; }).reduce(function(t, b){ return t + (b.krTotal||0); }, 0);
    var refKRW = (c.refunds||[]).filter(function(r){ return (r.currency||'KRW')==='KRW'; }).reduce(function(t, r){ return t + (r.amount||0); }, 0), refIDR = holdingRefundSum(c) + (c.refunds||[]).filter(function(r){ return r.currency==='IDR'; }).reduce(function(t, r){ return t + (r.amount||0); }, 0);
    var paidKRW = Math.max(0, fp.kr + balance + addOn - refKRW), paidIDR = Math.max(0, fp.inn + fee - refIDR);
    return {id:c.id, caseNo:c.caseNo, date:(travel && c.krSchedule && c.krSchedule.confirmedDate) ? c.krSchedule.confirmedDate : c.visitDate, did:did.filter(Boolean).join('；'),
      hospital:travel ? hospitalName(caseKrHospital(c), 'ko')+(c.director ? ' '+c.director : '') : '', paidKRW:paidKRW, paidIDR:paidIDR, refund:(refKRW>0 || refIDR>0), report:!!c.reportReady};
  }).sort(function(a,b){ return (b.date||'').localeCompare(a.date||''); });
}

function customerCanCancel(c){ return c.stage==='booked' && c.subState==='waiting' && !!c.visitDate && new Date(c.visitDate+'T'+c.visitTime+':00') > demoNow(); }
function customerCancelCase(caseId){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0];
  if(!c || !customerCanCancel(c)) return {ok:false};
  c.subState = 'cancelled'; c.cancelReason = '预约取消';
  updateCaseStage(c);
  logCaseEvent(c, '客人', '客人自行取消预约（原 '+c.visitDate+' '+c.visitTime+'）');
  var n = pushNotif('预约', '客人取消预约：'+c.name+'（'+c.caseNo+'）原 '+dateLabel(c.visitDate)+' '+c.visitTime, {caseId:c.id, names:workingIN()});
  c.cancelNotifId = n.id; c.cancelledAt = Date.now();
  sendSms('cancel', clientPhoneOf(c.name), smsVarsOfCase(c), c.id);
  return {ok:true, c:c};
}

/* ---- 提醒短信：按诊所设定的"预约前 N 小时"自动发（演示用演示时钟判断）；force=true 是演示按钮：立刻发给所有还没发过的待访问预约 ---- */
function checkReminders(force){
  var now = demoNow().getTime(), n = 0;
  CASE_ITEMS.forEach(function(c){
    if(c.remindSent || c.stage!=='booked' || c.subState!=='waiting' || !c.visitDate || !c.visitTime) return;
    var t = new Date(c.visitDate+'T'+c.visitTime+':00').getTime();
    if(t <= now) return;
    if(!force && now < t - CLINIC_SETTINGS.remindBeforeHours*3600000) return;
    var to = clientPhoneOf(c.name); if(!to) return;
    sendSms('remind', to, smsVarsOfCase(c), c.id); c.remindSent = true; n++;
  });
  return n;
}

/* ================= dashboard: 预约来访 + 预约占位（2026-09-29 新增，IN-DASH-01） ================= */
/* KR 院长名单（演示数据，以后由韩国端维护）：active=false 为停用，停用的不显示在选项里（2026-10-02） */
var DIRECTOR_INFO = [{name:'KD1 院长', active:true}, {name:'KO1 代表院长', active:true}, {name:'H1 院长3', active:false}]; /* H1：KD1 院长、KO1 代表院长（也看诊做手术）、一位停用院长（演示用）；原 KD1 院长 已删除，她的案件改给 KD1 / KO1 */

var DIRECTOR_LIST = DIRECTOR_INFO.filter(function(d){ return d.active; }).map(function(d){ return d.name; });

/* 老客人（下拉选客人+选院长）或"模拟客户填写完成"占位转正式：生成 Case ID（2026-10-01：取消 Reservation ID，预约时直接生成）、开新案件（状态"待访问"），
   不经过占位；这里只做"开新案件"的预约来访——术后到店/使用持有项目也一律走这条开新案件（第十轮已确认） */
function createReservationCase(name, director, date, time, phone, purpose){
  /* 一个手机号对应一个客人：手机号已登记就沿用那位客人的姓名；没有这位客人才建档 */
  var cl = (phone && clientByPhone(phone)) || clientByName(name);
  if(cl){ name = cl.name; if(!cl.phone && phone) cl.phone = phone; }
  else cl = addClient({name:name, phone:phone||'', createdBy:phone?'客人自助':actingName(), source:phone?'客户自助预约建档':'室长建档'});
  var caseNo = generateCaseNo();
  var id = 'r'+Date.now()+Math.floor(Math.random()*1000);
  var c = makeCase({id:id, name:name, director:null, updated:'刚刚', visitDate:date, visitTime:time, visitPurpose:purpose||'面诊商谈', /* 2026-10-02：预约不选院长，面诊案件在基础资料里选 */
    logEntries:[{stage:'预约到店', actor:phone?'客人':actingName(), action:(phone?'官网/短信链接自助预约成功':'室长代替预约')+'，生成 Case ID '+caseNo, dt:nowFullDt()}]});
  c.caseNo = caseNo;
  if(!SEEDING){ c.round = currentTestRound(); Object.assign(c.logEntries[0], gmcVerStamp()); } /* 用户新建的案件：记下当时的测试轮次 + 第一条记录盖版本章 */
  CASE_ITEMS.unshift(c);
  updateCaseStage(c);
  return c;
}

var VISIT_PURPOSES = ['面诊商谈','皮肤商谈','术后管理','复诊','皮肤管理'];
 /* 来访目的：不影响流程；接待时目的是术后管理/复诊 → 基础资料提示"要不要关联之前的案件" */
var DEFAULT_SMS_TEMPLATE = ''; /* 预约链接短信模板：来自诊所设定（applyClinicSettings 同步） */

function setAddSlotMode(mode){ ADD_SLOT_MODE = mode; renderAddSlotBody(); }

function purposeSelectHtml(id){
  return '<div class="field" style="margin-bottom:12px;"><label>来访目的</label><select id="'+id+'">'+VISIT_PURPOSES.map(function(x){ return '<option>'+x+'</option>'; }).join('')+'</select></div>';
}

var PLACEHOLDER_SEQ = 1;

var RESERVATION_PLACEHOLDERS = [
  {id:'ph0', date:D(0), time:'15:00', phone:'+62 812-5555-0101', link:bookingUrl({ph:'ph0'}), smsText:CLINIC_SETTINGS.sms.link, purpose:'面诊商谈', expiresAt:Date.now()+15*60000} /* 演示：占位中（种子固定 15 分钟） */
];

function placeholderCountdownText(p){
  var remain = Math.max(0, p.expiresAt - Date.now());
  var m = Math.floor(remain/60000), s = Math.floor((remain%60000)/1000);
  return '-'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
}

function cancelPlaceholder(id){
  var p = RESERVATION_PLACEHOLDERS.filter(function(x){ return x.id===id; })[0];
  if(p) PLACEHOLDER_HISTORY.push({id:p.id, phone:p.phone, date:p.date, time:p.time, status:'占位失效', link:p.link, purpose:p.purpose}); /* 取消占位记为占位失效 */
  RESERVATION_PLACEHOLDERS = RESERVATION_PLACEHOLDERS.filter(function(x){ return x.id!==id; });
  closeAddSlotModal();
  renderCalendar();
}

/* 客户在链接里自行改时间：案件的预约时间改掉，并通知室长（消息中心）——演示按钮，真实版由客户端触发 */
function simulateCustomerReschedule(caseId, newDow, newTime){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0]; if(!c || !c.visitDate) return;
  var oldLabel = dateLabel(c.visitDate)+' '+c.visitTime;
  var ws = new Date(c.visitDate+'T00:00:00'); ws.setDate(ws.getDate() - dowOfDate(c.visitDate));
  ws.setDate(ws.getDate()+DOW_CN.indexOf(newDow));
  c.visitDate = dateStr(ws); c.visitTime = newTime;
  if(CAL_MODE==='week') buildWeekGrid();
  pushNotif('预约', c.name+' 自行把预约时间从 '+oldLabel+' 改到 '+dateLabel(c.visitDate)+' '+newTime, {caseId:c.id});
}


/* ================= clients ================= */
/* CLIENTS：客户档案（2026-10-06·K，原来是 [姓名, 状态, 建档室长, …] 数组）。一个手机号对应一个客人（phone 唯一）；案件、持有项目仍按姓名关联（姓名在演示里唯一）。
   字段：id、name、gender（女/男）、dob（YYYY-MM-DD，可空）、phone、note 特别备注、history 基础病史和过敏史、passport {text,date}、
   consents 同意记录 [{version, ts, source}]（客户详情"隐私协议"读它，source：客户自助预约 / 到店签署 …）、createdBy 建档室长、updated 更新时间（显示文字）、
   fallback {label,bg,fg}（没有案件时客户列表"当前进度"的兜底状态）、timeline 客户级 Timeline（建档 / 基础信息修改，案件开始/结案由案件算出，见 renderClientTimeline）。
   有案件时"当前面诊·施术进度"这一列实时读对应 CASE_ITEMS 的徽章——见 clientCaseStatus()。 */
var CLIENTS = [
  {id:'cl1', name:'客人1', gender:'女', dob:'1992-03-08', phone:'+62 000-0000-0001', note:'无', beautyRecords:[{id:'brs1', year:2023, month:5, project:'玻尿酸填充（苹果肌）', source:'客人自填', addedAt:D(-17)+' 10:02', caseId:'siti', newCaseId:null},{id:'brs2', year:2024, month:8, project:'水光针', source:'客人自填', addedAt:D(-18)+' 10:02', caseId:'siti', newCaseId:null}], history:'对青霉素过敏；无慢性病', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-17)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'2 小时前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-17)+' 10:02', kind:'plain'},{stage:'基础信息修改', actor:'A1 室长', action:'补录护照信息、确认医美史', dt:D(-16)+' 11:15', kind:'plain'}]},
  {id:'cl2', name:'客人3', gender:'男', dob:'1987-06-10', phone:'+62 812-3000-0002', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-18)+' 10:02', source:'客户自助预约'}], createdBy:'A2 室长', updated:'昨天', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-18)+' 10:02', kind:'plain'}]},
  {id:'cl3', name:'客人4', gender:'女', dob:'1990-11-17', phone:'+62 812-3000-0003', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-19)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'2 小时前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-19)+' 10:02', kind:'plain'}]},
  {id:'cl4', name:'客人5', gender:'女', dob:'1993-04-24', phone:'+62 812-3000-0004', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-20)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'昨天', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-20)+' 10:02', kind:'plain'}]},
  {id:'cl5', name:'客人6', gender:'女', dob:'1996-09-06', phone:'+62 812-3000-0005', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-17)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'3 天前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-17)+' 10:02', kind:'plain'}]},
  {id:'cl6', name:'客人7', gender:'男', dob:'1999-02-13', phone:'+62 812-3000-0006', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-18)+' 10:02', source:'客户自助预约'}], createdBy:'A2 室长', updated:'昨天', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-18)+' 10:02', kind:'plain'}]},
  {id:'cl7', name:'客人20', gender:'男', dob:'1985-07-20', phone:'+62 812-3000-0007', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[], createdBy:'A2 室长', updated:'3 天前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-19)+' 10:02', kind:'plain'}]},
  {id:'cl8', name:'客人2', gender:'女', dob:'1988-12-27', phone:'+62 000-0000-0002', note:'无', beautyRecords:[{id:'bra1', year:2022, month:3, project:'热玛吉', source:'客人自填', addedAt:D(-17)+' 10:02', caseId:'ayu', newCaseId:null},{id:'bra2', year:2025, month:6, project:'肉毒（下颌线）', source:'客人自填', addedAt:D(-18)+' 10:02', caseId:'ayu', newCaseId:null}], history:'轻度哮喘；对海鲜过敏', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v0.9', ts:D(-20)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'昨天', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-20)+' 10:02', kind:'plain'}]},
  {id:'cl9', name:'客人8', gender:'男', dob:'1991-05-09', phone:'+62 812-3000-0009', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-17)+' 10:02', source:'客户自助预约'}], createdBy:'A2 室长', updated:'2 小时前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-17)+' 10:02', kind:'plain'}]},
  {id:'cl10', name:'客人10', gender:'女', dob:'1994-10-16', phone:'+62 812-3000-0010', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-18)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'刚刚', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-18)+' 10:02', kind:'plain'}]},
  {id:'cl11', name:'客人9', gender:'女', dob:'1997-03-23', phone:'+62 812-3000-0011', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-19)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'今天', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-19)+' 10:02', kind:'plain'}]},
  {id:'cl12', name:'客人11', gender:'男', dob:'2000-08-05', phone:'+62 812-3000-0012', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-20)+' 10:02', source:'客户自助预约'}], createdBy:'A2 室长', updated:'今天', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-20)+' 10:02', kind:'plain'}]},
  {id:'cl13', name:'客人12', gender:'女', dob:'1986-01-12', phone:'+62 812-3000-0013', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-17)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'1 周前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-17)+' 10:02', kind:'plain'}]},
  {id:'cl14', name:'客人21', gender:'女', dob:'1989-06-19', phone:'+62 812-3000-0014', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[], createdBy:'A1 室长', updated:'5 天前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-18)+' 10:02', kind:'plain'}]},
  {id:'cl15', name:'客人14', gender:'男', dob:'1992-11-26', phone:'+62 812-3000-0015', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-19)+' 10:02', source:'客户自助预约'}], createdBy:'A2 室长', updated:'4 天前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-19)+' 10:02', kind:'plain'}]},
  {id:'cl16', name:'客人22', gender:'女', dob:'1995-04-08', phone:'+62 812-3000-0016', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-20)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'6 天前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-20)+' 10:02', kind:'plain'}]},
  {id:'cl17', name:'客人15', gender:'女', dob:'1998-09-15', phone:'+62 812-3000-0017', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-17)+' 10:02', source:'客户自助预约'}], createdBy:'A2 室长', updated:'3 天前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-17)+' 10:02', kind:'plain'}]},
  {id:'cl18', name:'客人16', gender:'女', dob:'1984-02-22', phone:'+62 812-3000-0018', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-18)+' 10:02', source:'客户自助预约'}], createdBy:'A2 室长', updated:'2 天前', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-18)+' 10:02', kind:'plain'}]},
  {id:'cl19', name:'客人13', gender:'男', dob:'1987-07-04', phone:'+62 812-3000-0019', note:'无', history:'无', passport:{text:'已登记', date:D(-29)}, consents:[{version:'v1.0', ts:D(-19)+' 10:02', source:'客户自助预约'}], createdBy:'A1 室长', updated:'昨天', fallback:{label:'资料录入', bg:'#E4E8ED', fg:'var(--slate2)'}, timeline:[{stage:'建档', actor:'客人', action:'建档 · 客户自助预约建档', dt:D(-19)+' 10:02', kind:'plain'}]}
];

/* 客户持有项目（2026-09-29 新增）：按客户姓名存，结算后本地项目（含术后管理）全部转入这里，不进入案件进程。
   结构：{itemName, category, batches:[{caseId,date,bought,used,usages:[{caseId,date,qty}]}], krCollected} */
var CLIENT_HOLDINGS = {};

function getClientHoldings(name){ return CLIENT_HOLDINGS[name] || []; }

function holdingRemaining(h){ return h.batches.reduce(function(s,b){ return b.voided ? s : s+(b.bought-b.used); }, 0); }
 /* 已退款的批次整批作废，不计入 */
function holdingTotal(h){ return h.batches.reduce(function(s,b){ return b.voided ? s : s+b.bought; }, 0); }

/* 结算/KR代收 时调用：给客户新增一批持有 */
/* 购买价（CMD-1008-08）：price = {paid 当初实付（折后）, list 原价合计, pct 实付比例（100 = 不打折）, currency}；快照存在批次上，退款弹窗读这里（不读当前项目库价格） */
function grantHolding(name, itemName, category, caseId, date, qty, krCollected, price){
  CLIENT_HOLDINGS[name] = CLIENT_HOLDINGS[name] || [];
  var h = CLIENT_HOLDINGS[name].filter(function(x){ return x.itemName===itemName; })[0];
  if(!h){ h = {itemName:itemName, category:category, batches:[], krCollected:!!krCollected}; CLIENT_HOLDINGS[name].push(h); }
  if(krCollected) h.krCollected = true;
  var nb = {caseId:caseId, date:date, bought:qty, used:0, usages:[], kr:!!krCollected};
  if(price){ nb.paid = price.paid; nb.listPrice = price.list; nb.discountPct = price.pct; nb.currency = price.currency || 'IDR'; }
  h.batches.push(nb);
  return nb;
}

/* 使用持有：先扣最早购买的那一批，跨批次自动结转；记 usages 供客户详情页展开显示 */
function useHolding(name, itemName, caseId, date, qty, tag, optVal){
  var h = (CLIENT_HOLDINGS[name]||[]).filter(function(x){ return x.itemName===itemName; })[0];
  if(!h) return 0;
  var left = qty;
  h.batches.sort(function(a,b){ return a.date<b.date?-1:1; });
  for(var i=0;i<h.batches.length && left>0;i++){
    var b = h.batches[i];
    var avail = b.voided ? 0 : b.bought - b.used;
    if(avail<=0) continue;
    var take = Math.min(avail, left);
    b.used += take;
    b.usages.push({caseId:caseId, date:date, qty:take, tag:tag||'main', opt:optVal||undefined}); /* optVal = 使用时选的选项（模式 / 部位 / 营养针种类） */
    left -= take;
  }
  return qty-left; /* 实际扣掉的次数 */
}

/* 这次使用会扣到哪些购买批次（FIFO，与 useHolding 一致），返回购买案件 id 列表；用于"使用术后管理项目时自动关联原案件" */
function holdingSourceCaseIds(h, qty){
  var ids = [], left = qty;
  h.batches.slice().sort(function(a,b){ return a.date<b.date?-1:1; }).forEach(function(b){
    if(left<=0) return;
    var avail = b.voided ? 0 : b.bought-b.used; if(avail<=0) return;
    if(ids.indexOf(b.caseId)<0) ids.push(b.caseId);
    left -= Math.min(avail,left);
  });
  return ids;
}

/* 归还持有（2026-09-30）：管理取消时，把本案件（同一 tag：main=案件本身 / lm=本地管理）未做的次数退回对应批次，不是退款 */
function returnHolding(name, itemName, caseId, qty, tag){
  var h = (CLIENT_HOLDINGS[name]||[]).filter(function(x){ return x.itemName===itemName; })[0];
  if(!h) return 0;
  var left = qty;
  tag = tag||'main';
  for(var i=h.batches.length-1;i>=0 && left>0;i--){
    var b = h.batches[i];
    for(var j=b.usages.length-1;j>=0 && left>0;j--){
      var u = b.usages[j];
      if(u.caseId!==caseId || (u.tag||'main')!==tag) continue;
      var take = Math.min(u.qty, left);
      u.qty -= take; b.used -= take; left -= take;
      if(u.qty<=0) b.usages.splice(j,1);
    }
  }
  return qty-left;
}

/* 2026-09-30（取代第十一轮"列出所有未结案案件"的做法）：状态列和财务列都以这个客户"最近一次有操作的案件"为准；
   未完成的案件统一在客户详情顶部的"正在进行案件"卡片里看 */
function caseLastActivity(c){
  var le = c.logEntries||[];
  return le.length ? le[le.length-1].dt : '';
}

function clientLatestCase(name){
  var cases = CASE_ITEMS.filter(function(c){ return c.name===name; });
  var best = null;
  cases.forEach(function(c){ if(!best || caseLastActivity(c) >= caseLastActivity(best)) best = c; });
  return best;
}

/* 室长修正客户原填字段：直接覆盖为定论，不做两版对比；谁改了什么由客户 Timeline 的"修正"条目留痕（Client & Case Rules §2） */

function holdingsAllSorted(name){
  var list = getClientHoldings(name).slice();
  list.sort(function(a,b){
    var cat = (b.category==='术后管理')-(a.category==='术后管理'); if(cat) return cat;
    return (holdingRemaining(b)>0)-(holdingRemaining(a)>0);
  });
  return list;
}

function batchStatusOfHolding(b){
  if(b.refund || b.voided) return '已取消（已退款）';
  if(b.used<=0) return '未使用';
  return b.used>=b.bought ? '已用完' : '部分使用';
}

var HOLD_BATCH_COLORS = {'未使用':['var(--sage-bg)','var(--sage)'], '部分使用':['#FBF0C9','#8F6F0C'], '已用完':['#EDEAE2','var(--muted)'], '已取消（已退款）':['var(--terracotta-bg)','var(--terracotta)']};

function caseNoLabel(caseId){
  var cc = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0];
  return cc && cc.caseNo ? cc.caseNo : caseId;
}


/* ================= case management ================= */
/* makeCase()：每个「案件状态」demo案例共用的默认骨架，只需要在 overrides 里写和默认值不一样的字段。
   案件真实的 stage 永远由 deriveCaseStage() 现算，这里不手填 stage，数组建好后统一 forEach(updateCaseStage) 一遍。 */
function makeCase(o){
  return {
    id:o.id, clinicId:o.clinicId||CURRENT_CLINIC_ID, hospitalId:o.hospitalId||null, name:o.name, subState:o.subState||'waiting', /* clinicId=所属诊所；hospitalId=选面诊时选的医院（没选面诊为 null） */
    inCoordinator:o.inCoordinator||actingName(), krInRoom:!!o.krInRoom, chatArchive:null, /* 2026-10-02：负责该案件的IN室长 / KR室长是否已进入案件对话房 / 结案后整理的对话记录 */
    visitDate:o.visitDate||null, visitTime:o.visitTime||null, visitPurpose:o.visitPurpose||'面诊商谈', /* 2026-10-02：日历、案件列表、预约历史都从案件这份数据算 */
    reportEta:o.reportEta||null, reportOverdue:!!o.reportOverdue, /* 2026-10-02：KR确认的预计出报告时间 / 已超时提醒 */
    director:(o.director!==undefined ? o.director : ((o.consultRequested || o.needsConsult===true) ? 'KD1 院长' : null)), /* 2026-10-02：本地案件没有院长 */ krCoordinator:o.krCoordinator||'KM1 室长', updated:o.updated||'刚刚', caseNo:o.caseNo||null,
    basic:o.basic||{gender:'女', dob:'1990-01-01', contact:'WhatsApp +62 812-xxxx-xxxx', history:'无'},
    materialsConfirmed:!!o.materialsConfirmed, photoUploaded:!!o.materialsConfirmed, videoUploaded:!!o.materialsConfirmed,
    concern:o.concern||'', expectation:o.expectation||'', metaviewStatus:o.materialsConfirmed?'ready':'idle',
    needsConsult: o.needsConsult===undefined ? null : o.needsConsult, activeCaseTab:o.activeCaseTab||'basic',
    consultRequested:!!o.consultRequested, consultStatus:o.consultStatus||null,
    videoSummary:o.videoSummary||'', consultFiles:o.consultFiles||[], reportReady:!!o.reportReady, krVideoInvited:!!o.krVideoInvited,
    reportUploadedBy:o.reportUploadedBy||(o.reportReady ? (o.krCoordinator||'KM1 室长') : ''), /* 2026-09-30：报告由KR室长上传（Notion），邀请室长视频的候选人只列上传过报告的室长 */
    /* 2026-09-29 新状态机：visibleToKR 默认跟着"是否需要面诊"走，不面诊案件默认对韩国侧不可见，点"增加面诊"后才变 true */
    visibleToKR: o.visibleToKR!==undefined ? !!o.visibleToKR : (o.needsConsult===true),
    /* 意向项目/预算（2026-09-29 新增，基础资料tab"希望预期"下面）：客人来访时的初步意向，KR可见 */
    intentionProjects:o.intentionProjects||[], intentionNote:o.intentionNote||'', budgetMin:o.budgetMin||null, budgetMax:o.budgetMax||null,
    projectsEnabled:!!o.projectsEnabled, projectsExpanded:false, projectsLocked:!!o.projectsLocked,
    projectOriginFilter:o.projectOriginFilter||'KR', recommended:o.recommended||[],
    krScope:o.krScope||null, /* 2026-09-29：赴韩项目可选范围，由KR室长整理（出报告时写入演示数据），结构 {items:[{name,price,note}], overallNote, updatedAt} */
    noteKR:o.noteKR||'', noteIN:o.noteIN||'', noteOverall:o.noteOverall||'', /* 结算区三个备注：KR+IN可见/仅IN可见/KR+IN可见 */
    /* 施术日期（2026-09-29 重写）：改到已付款之后才递交，不再是结算前的排期门槛 */
    krSchedule:(o.arrivedAtHospital && o.krSchedule) ? Object.assign({}, o.krSchedule, {status:'arrived'}) : (o.krSchedule||null), /* 2026-09-30：已到医院并入施术日期状态（Arrived），案件主状态直接读这里，不再单独存 arrivedAtHospital； {status:null|'pending'|'confirmed'|'change_pending', primary,backup,confirmedDate,confirmedTime,changePrimary,changeBackup,changeSubmitted} */
    krBalancePaid:!!o.krBalancePaid, /* 已到医院/付清尾款，2026-09-29（第十轮）改成KR端演示按钮操作，IN端只显示状态 */
    visitClosed:!!o.visitClosed, /* 2026-09-29（第十轮）新增："案件=一次到店或一次赴韩行程"，KR标记施术完成 / 本地持有项目用完（或本次不使用）时置true，deriveCaseStage 直接判 closed */
    hasArrived:!!(o.hasArrived || (o.arrivedAtHospital && o.krSchedule)), /* 到过医院：种子里 arrivedAtHospital 的案件也算 */
    krProcedureDone:!!o.krProcedureDone, /* 2026-09-30：KR标记"施术完成"（至少完成一项赴韩施术），结局判定里算"完成了施术" */
    refunds:o.refunds||[], /* 2026-09-30：赴韩项目退款记录 [{amount,currency,reason,date,items}]，退款只进财务字段，不影响结局 */
    financeResult:null, /* 无收入/仅面诊费/有项目收入/全额退款，由 updateCaseStage→financeResultOf 现算 */
    /* 本地流程（§3）的案件级状态：持有项目使用后进入本地管理；localMgmt 是同日插做的"本地管理"tab，字段同名（见 ctxOf） */
    mgmtUses:o.mgmtUses||[], mgmtActive:!!o.mgmtActive, mgmtDone:!!o.mgmtDone, mgmtStatus:o.mgmtStatus||null, mgmtCancelling:false,
    linkedCase:o.linkedCase||null, /* 2026-09-30 §6：关联之前案件 {caseId, reason:复诊/术后管理/延续既往面诊, auto?} */
    linkedFiles:o.linkedFiles||[], manualAttachments:o.manualAttachments||[], materialsDate:o.materialsDate||null, /* §7 附件 */
    consultFeeAmount:(typeof o.consultFeeAmount==='number' ? o.consultFeeAmount : undefined), /* 选「面诊」时记下的面诊费金额（读这里，不读诊所设定；诊所之后调价不影响已选面诊的案件） */
    consultFeeWaived:o.consultFeeWaived||null, /* 面诊费免除（2026-09-30）：{reason, note}，免除时财务结果按无收入判断 */
    localTrack:!!o.localTrack, /* 2026-09-30：本地案件标记（面诊取消后做本地项目 / 无法协调后做本地管理），用于状态推算：选择项目→本地管理 */
    needsConsultTouched:false, /* 2026-10-01 延续既往面诊：基础资料新增医美史 / 室长是否手动选过面诊需求 */
    reportDate:o.reportDate||null, contJudged:false, reuseAfterConsult:false,
    settleTab:null, continueNew:false, /* 项目列表tab里结算单2级tab当前选中的序号，null=最新一张 */
    localAsk:!!o.localAsk, /* 赴韩项目"无法协调"退款后，询问是否做本地管理 */
    localMgmt:o.localMgmt||null,
    entryChoicePending:!!o.entryChoicePending, projectEntryMode:o.projectEntryMode||null, /* 不面诊/面诊取消后"持有项目使用"vs"新增项目"的入口选择 */
    settlementDone:!!o.settlementDone, procedureItems:o.procedureItems||[], settlementBatches:o.settlementBatches||[],
    cancelReason:o.cancelReason||null, /* 已取消分支细分（2026-09-30）：'预约取消' | '管理取消' | '未购买未使用' */
    addingMore:false,
    logEntries:o.logEntries||[]
  };
}

var CASE_ITEMS = [
  makeCase({id:'siti', name:'客人1', caseNo:'A000017', updated:'刚刚',
    basic:{gender:'女', dob:'1992-03-08', contact:'WhatsApp +62 812-xxxx-xxxx', history:'无'},
    logEntries:[{stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(0)+' 09:05'}]}),

  /* 演示（到访接续）：客人2 已有进行中案件 ayu（项目确认中），这条是她新的预约来访（待访问） */
  makeCase({id:'ayu2', name:'客人2', caseNo:'A000021', updated:'刚刚',
    logEntries:[{stage:'预约到店', actor:'A1 室长', action:'老客人预约来访', dt:D(0)+' 09:10'}]}),

  /* 接待中：客人已到店，메타뷰/照片/视频/苦恼/希望预期还没确认完，所以还没生成 Case ID */
  makeCase({id:'andi', name:'客人3', subState:'waiting', caseNo:'A000018', updated:'昨天', /* 2026-10-08：接待中不停留，演示数据不再有停在接待中的案件 */
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-1)+' 10:00'}
    ]}),

  /* 待选项目：分支2"不面诊"——基础资料确认时选了不面诊，Case ID 已生成，正在选管理项目、还没点"确认所选项目" */
  makeCase({id:'yuni', name:'客人4', subState:'arrived', materialsConfirmed:true, caseNo:'A000001', updated:'2 小时前',
    concern:'皮肤暗沉、毛孔粗大', expectation:'希望肤色均匀、毛孔细致', needsConsult:false, activeCaseTab:'localmgmt', projectsEnabled:true, projectOriginFilter:'IN',
    entryChoicePending:true, projectEntryMode:'new', /* 2026-09-29 第十轮：不面诊后先经过入口选择，这里演示已经点了"新增项目" */
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-2)+' 09:00'},
      {stage:'预约到店', actor:'A1 室长', action:'标记客人已到店', dt:D(-2)+' 09:20'},
      {stage:'面诊安排', actor:'A1 室长', action:'确认了메타뷰/照片/视频/苦恼/希望预期，面诊需求：不面诊', dt:D(-2)+' 09:35'}
    ]}),

  /* 待确认报告时间：面诊费已缴，已在 Main 对话群通知，等 Kr室长确认预计出报告时间 */
  makeCase({id:'maya', name:'客人5', subState:'arrived', materialsConfirmed:true, caseNo:'A000002', updated:'昨天',
    concern:'轮廓线条不明显', expectation:'想要更立体的轮廓', needsConsult:true, activeCaseTab:'consult', consultRequested:true, consultStatus:'paid_waiting_kr',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-2)+' 14:00'},
      {stage:'预约到店', actor:'A1 室长', action:'标记客人已到店', dt:D(-2)+' 14:20'},
      {stage:'面诊安排', actor:'A1 室长', action:'确认了메타뷰/照片/视频/苦恼/希望预期，面诊需求：面诊', dt:D(-2)+' 14:35'},
      {stage:'面诊安排', actor:'客人', action:'完成面诊费支付，已在Main对话群自动通知', dt:D(-2)+' 14:40'}
    ]}),

  /* 等待报告：Kr室长已确认预计出报告时间（倒计时中） */
  makeCase({id:'putri', name:'客人6', subState:'arrived', materialsConfirmed:true, caseNo:'A000003', updated:'3 天前',
    concern:'法令纹加深', expectation:'希望改善法令纹', needsConsult:true, activeCaseTab:'consult', consultRequested:true, consultStatus:'awaiting_report', reportEta:D(2)+' 14:00',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-4)+' 09:00'},
      {stage:'面诊安排', actor:'客人', action:'完成面诊费支付，已在Main对话群自动通知', dt:D(-4)+' 10:00'},
      {stage:'面诊安排', actor:'KM1 室长', action:'KR确认预计出报告时间：'+D(2)+' 14:00', dt:D(-4)+' 16:00'}
    ]}),

  /* 等待报告：超过预计时间（小状态橘色提醒） */
  makeCase({id:'dedi', name:'客人7', subState:'arrived', materialsConfirmed:true, caseNo:'A000004', updated:'刚刚',
    concern:'苹果肌塌陷', expectation:'希望恢复饱满', needsConsult:true, activeCaseTab:'consult', consultRequested:true, consultStatus:'awaiting_report', reportEta:D(0)+' 08:00', reportOverdue:true,
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-5)+' 09:00'},
      {stage:'面诊安排', actor:'KM1 室长', action:'KR确认预计出报告时间：'+D(0)+' 08:00', dt:D(-5)+' 11:00'},
      {stage:'面诊安排', actor:'系统', action:'已超过预计出报告时间，报告还没提交（仅提醒，状态不变）', dt:D(0)+' 08:05'}
    ]}),

  /* 等待报告：预计时间未到 */
  makeCase({id:'budi', name:'客人20', subState:'arrived', materialsConfirmed:true, caseNo:'A000005', updated:'3 天前',
    concern:'轮廓松弛', expectation:'希望紧致轮廓', needsConsult:true, activeCaseTab:'consult', consultRequested:true, consultStatus:'awaiting_report', reportEta:D(2)+' 11:00',
    videoSummary:'轮廓松弛属中度，建议先做超声刀评估，配合居家护理观察 4 周后复诊。',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-6)+' 09:00'},
      {stage:'面诊安排', actor:'KM1 室长', action:'KR确认预计出报告时间：'+D(2)+' 11:00', dt:D(0)+' 09:30'}
    ]}),

  /* 已出诊疗方案：诊疗方案已到，正在待客人/室长选管理项目 */
  makeCase({id:'ayu', reportDate:D(-8), name:'客人2', subState:'arrived', materialsConfirmed:true, caseNo:'A000006', updated:'昨天',
    concern:'皮肤暗沉、细纹', expectation:'希望肤质透亮', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'面部凹陷、细纹较明显，建议先做自体脂肪移植改善轮廓，再评估面部拉皮。',
    consultFiles:[{label:'面诊诊疗方案'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, krScope:{items:[{name:'自体脂肪移植（全脸）', price:4500000, note:'', stay:'10天', anesthesia:{type:'sleep', label:'睡眠麻醉', note:''}, postcare:[{name:'术后消肿管理', price:150000, times:5, place:'either', day:'第3天', innName:'术后消肿护理 1次', innPrice:450000, inTimes:0}]},{name:'面部拉皮', price:12000000, note:'', stay:'14天', anesthesia:{type:'general', label:'全身麻醉', note:'全麻需空腹 8 小时'}, postcare:[{name:'术后复诊检查', price:80000, times:2, place:'KR', day:'第2天', innName:'', innPrice:0, inTimes:0}]}], overallNote:'具体术式最终以到院评估为准', updatedAt:D(1)+' 11:20'},
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-7)+' 09:00'},
      {stage:'面诊安排', actor:'KD1 院长', action:'KR室长提交面诊诊疗方案，已出诊疗方案', dt:D(1)+' 11:20'}
    ]}),

  /* 待付款：已确认所选管理项目、生成结算单，等待付款 */
  makeCase({id:'fajar', reportDate:D(-1), name:'客人8', subState:'arrived', materialsConfirmed:true, caseNo:'A000007', updated:'2 小时前',
    concern:'鼻基底低平', expectation:'希望鼻型更立体', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议先做假体隆鼻改善鼻基底，再评估鼻翼缩小。',
    consultFiles:[{label:'面诊诊疗方案'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true,
    krScope:{items:[{name:'假体隆鼻', price:2500000, note:'', stay:'7天', anesthesia:{type:'sleep', label:'睡眠麻醉', note:'需空腹 6 小时'}, postcare:[{name:'术后消肿管理', price:150000, times:5, place:'either', day:'第3天', innName:'术后消肿护理 1次', innPrice:450000, inTimes:0},{name:'拆线', price:50000, times:1, place:'KR', day:'第7天', innName:'', innPrice:0, inTimes:0}]},{name:'鼻翼缩小', price:1500000, note:'', stay:'5天', anesthesia:{type:'local', label:'局部麻醉', note:''}, postcare:[{name:'拆线', price:50000, times:1, place:'KR', day:'第7天', innName:'', innPrice:0, inTimes:0}]}], overallNote:'具体术式最终以到院评估为准', updatedAt:D(2)+' 14:20'},
    procedureItems:[
      {name:'假体隆鼻', origin:'KR', done:false, batchId:'B1'},
      {name:'鼻翼缩小', origin:'KR', done:false, batchId:'B1'}
    ],
    settlementBatches:[{id:'B1', orderedBy:'A1 室长', settledBy:'客人', time:D(3)+' 10:00', status:'unpaid',
      krTotal:4000000, krDeposit:1200000, krBalance:2800000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-8)+' 09:00'},
      {stage:'面诊安排', actor:'KD1 院长', action:'KR室长提交面诊诊疗方案，已出诊疗方案', dt:D(2)+' 14:20'},
      {stage:'面诊安排', actor:'A1 室长', action:'确认所选管理项目：假体隆鼻、鼻翼缩小', dt:D(3)+' 10:00'}
    ]}),

  /* 赴韩施术中：已付款，韩国项目里还有未完成的 */
  makeCase({id:'nadia', reportDate:D(-4), name:'客人9', subState:'arrived', materialsConfirmed:true, caseNo:'A000008', updated:'今天',
    concern:'轮廓松弛、法令纹', expectation:'希望紧致提升', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议颧骨缩小+下巴假体联合方案改善轮廓。',
    consultFiles:[{label:'面诊诊疗方案'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true, settlementDone:true, arrivedAtHospital:true, krBalancePaid:true,
    krSchedule:{status:'confirmed', confirmedDate:D(0), confirmedTime:'11:00', primary:D(0), backup:'', changePrimary:'', changeBackup:'', changeSubmitted:false},
    procedureItems:[
      {name:'颧骨缩小', origin:'KR', done:false, batchId:'B1'},
      {name:'下巴假体 / 颏成形', origin:'KR', done:true, batchId:'B1'}
    ],
    settlementBatches:[{id:'B1', orderedBy:'A1 室长', settledBy:'客人', time:D(2)+' 11:00', status:'active',
      krTotal:12000000, krDeposit:3600000, krBalance:8400000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-13)+' 09:00'},
      {stage:'面诊安排', actor:'KD1 院长', action:'KR室长提交面诊诊疗方案，已出诊疗方案', dt:D(1)+' 10:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩3,600,000），项目清单已锁定', dt:D(2)+' 11:00'},
      {stage:'赴韩施术', actor:'KD1 院长', action:'已完成"下巴假体 / 颏成形"施术，"颧骨缩小"待安排', dt:D(4)+' 16:00'}
    ]}),

  /* 待确认施术时间：已付款，已递交施术日期，正等Kr室长确认（2026-09-29 改用krSchedule细分状态演示） */
  makeCase({id:'dinda', name:'客人10', subState:'arrived', materialsConfirmed:true, caseNo:'A000013', updated:'刚刚',
    concern:'轮廓松弛', expectation:'希望紧致提升', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议面部拉皮+自体脂肪移植联合方案。',
    consultFiles:[{label:'面诊诊疗方案'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true, settlementDone:true,
    krSchedule:{status:'pending', primary:D(17), backup:D(18), confirmedDate:'', confirmedTime:'', changePrimary:'', changeBackup:'', changeSubmitted:false},
    procedureItems:[
      {name:'面部拉皮', origin:'KR', done:false, batchId:'B1'},
      {name:'自体脂肪移植（全脸）', origin:'KR', done:false, batchId:'B1'}
    ],
    settlementBatches:[{id:'B1', orderedBy:'A1 室长', settledBy:'客人', time:D(5)+' 10:00', status:'active',
      krTotal:16500000, krDeposit:4950000, krBalance:11550000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-10)+' 09:00'},
      {stage:'面诊安排', actor:'KD1 院长', action:'KR室长提交面诊诊疗方案，已出诊疗方案', dt:D(3)+' 10:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩4,950,000），项目清单已锁定', dt:D(5)+' 10:00'}
    ]}),

  /* 本地管理（2026-09-30 改）：纯本地案件，已使用持有项目、管理尚未完成/取消；原"已付款待使用"不再是本地管理 */
  makeCase({id:'rizky', name:'客人11', subState:'arrived', materialsConfirmed:true, caseNo:'A000009', updated:'今天',
    concern:'术后恢复期护理', expectation:'希望恢复期更舒适', needsConsult:false, activeCaseTab:'localmgmt',
    projectsEnabled:true, projectsLocked:true, settlementDone:true,
    mgmtActive:true, mgmtUses:[{itemName:'LHALa peel', qty:1, date:D(-3)}],
    procedureItems:[],
    settlementBatches:[{id:'B1', orderedBy:'A1 室长', settledBy:'客人', time:D(-3)+' 09:00', status:'active',
      krTotal:0, krDeposit:0, krBalance:0, inTotal:860000}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-17)+' 09:00'},
      {stage:'面诊安排', actor:'A1 室长', action:'确认了메타뷰/照片/视频/苦恼/希望预期，面诊需求：不面诊', dt:D(-3)+' 08:50'},
      {stage:'面诊安排', actor:'A1 室长', action:'选择"新增项目"', dt:D(-3)+' 08:55'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：本地全款 Rp 860.000），项目清单已锁定', dt:D(-3)+' 09:00'},
      {stage:'面诊安排', actor:'A1 室长', action:'本地项目已转入客户持有：LHALa peel x1、艺人水光焕肤 x1', dt:D(-3)+' 09:00'},
      {stage:'本地管理', actor:'A1 室长', action:'使用了LHALa peel 1次，剩余0次', dt:D(-3)+' 09:20'}
    ]}),

  /* 已结案：赴韩行程施术完成即结案（2026-09-29 第十轮：本地项目已转客户持有，不再算在这个案件的完成条件里） */
  makeCase({id:'rina', director:'H1 院长3', reportDate:D(-37), name:'客人12', subState:'arrived', materialsConfirmed:true, caseNo:'A000010', updated:'1 周前',
    concern:'整体抗老', expectation:'希望延缓衰老迹象', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议自体脂肪移植打底，配合本地焕肤护理维持效果。',
    consultFiles:[{label:'面诊诊疗方案'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true, settlementDone:true, arrivedAtHospital:true, krBalancePaid:true, visitClosed:true, krProcedureDone:true,
    krSchedule:{status:'confirmed', confirmedDate:D(-24), confirmedTime:'11:00', primary:D(-24), backup:'', changePrimary:'', changeBackup:'', changeSubmitted:false},
    procedureItems:[
      {name:'自体脂肪移植（全脸）', origin:'KR', done:true, batchId:'B1'}
    ],
    settlementBatches:[{id:'B1', orderedBy:'A1 室长', settledBy:'客人', time:D(-29)+' 09:00', status:'active',
      krTotal:4500000, krDeposit:1350000, krBalance:3150000, inTotal:540000}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-39)+' 09:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩1,350,000、本地全款 Rp 540.000），项目清单已锁定', dt:D(-29)+' 09:00'},
      {stage:'面诊安排', actor:'A1 室长', action:'本地项目已转入客户持有：艺人水光焕肤 x1', dt:D(-29)+' 09:00'},
      {stage:'赴韩施术', actor:'KD1 院长', action:'已完成"自体脂肪移植（全脸）"施术', dt:D(-24)+' 10:00'},
      {stage:'赴韩施术', actor:'KD1 院长', action:'KR标记"施术完成"，案件已结案', dt:D(-22)+' 09:00'}
    ]}),

  /* 待访问（演示"关联之前案件"）：A2 室长 之前有已结案的赴韩案件 A000010，这次再来，点"已到店"后基础资料里可关联并看到"可能与 A000010 相关"（2026-10-08：接待中不停留，改成待访问） */
  makeCase({id:'rina2', inCoordinator:'A2 室长', name:'客人12', subState:'waiting', caseNo:'A000019', updated:'刚刚',
    logEntries:[
      {stage:'预约到店', actor:'A1 室长', action:'老客人预约来访', dt:D(0)+' 09:00'}
    ]}),

  /* 已结案 + 有退款：分支6——赴韩项目里一个取消退定金，另一个完成后案件结案（2026-09-29 第十轮改用赴韩项目演示，
     本地项目现在不能退款，"部分退"这个终态只能从赴韩项目取消这条路径触发了） */
  makeCase({id:'wulan', name:'客人21', subState:'arrived', materialsConfirmed:true, caseNo:'A000011', updated:'5 天前',
    concern:'轮廓不对称', expectation:'希望改善轮廓线条', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议下颌角整形+颧骨缩小联合方案改善轮廓。',
    consultFiles:[{label:'面诊诊疗方案'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    krScope:{items:[{name:'下颌角整形', price:9000000, note:''},{name:'颧骨缩小', price:8000000, note:'不可与下颌角同时做'}], overallNote:'具体术式最终以到院评估为准', updatedAt:D(-10)+' 09:00'},
    projectsEnabled:true, projectsLocked:true, settlementDone:true, arrivedAtHospital:true, krBalancePaid:true, visitClosed:true,
    krProcedureDone:true,
    refunds:[{amount:2400000, currency:'KRW', reason:'客人检查后决定不做颧骨缩小', date:D(-7), items:['颧骨缩小'], batchIds:['B1']}],
    krSchedule:{status:'confirmed', confirmedDate:D(-5), confirmedTime:'11:00', primary:D(-5), backup:'', changePrimary:'', changeBackup:'', changeSubmitted:false},
    procedureItems:[{name:'下颌角整形', origin:'KR', done:true, batchId:'B1'},{name:'颧骨缩小', origin:'KR', done:false, cancelled:true, batchId:'B1'}],
    settlementBatches:[{id:'B1', orderedBy:'A1 室长', settledBy:'客人', time:D(-10)+' 09:00', status:'active',
      krTotal:17000000, krDeposit:5100000, krBalance:11900000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-17)+' 09:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩5,100,000），项目清单已锁定', dt:D(-10)+' 09:00'},
      {stage:'赴韩施术', actor:'A1 室长', action:'取消项目"颧骨缩小"，退款 ₩2,400,000，退款原因：客人检查后决定不做颧骨缩小', dt:D(-7)+' 09:00'},
      {stage:'赴韩施术', actor:'KD1 院长', action:'已完成"下颌角整形"施术', dt:D(-5)+' 11:00'},
      {stage:'赴韩施术', actor:'KD1 院长', action:'KR标记"施术完成"，案件已结案（退款记入财务字段）', dt:D(-5)+' 15:00'}
    ]}),

  /* 已取消预约：分支1——待访问阶段直接终止，资料保留，没有走到基础资料确认，所以没有 Case ID */
  makeCase({id:'bayu', name:'客人13', subState:'cancelled', cancelReason:'未到店', caseNo:'A000022', updated:'昨天',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-1)+' 09:00'},
      {stage:'预约到店', actor:'系统', action:'过预约时间30分钟未点"到访"，系统自动判定：已取消（未到店）', dt:D(-1)+' 10:30'}
    ]}),
  makeCase({id:'agus', name:'客人14', subState:'cancelled', caseNo:'A000020', cancelReason:'预约取消', updated:'4 天前',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(1)+' 09:00'},
      {stage:'预约到店', actor:'A1 室长', action:'取消预约，原因：联系不上客人', dt:D(1)+' 18:00'}
    ]}),

  /* 仅出报告（2026-09-30）：分支6——赴韩项目全部取消并退款、没做本地项目，客人只拿到了面诊诊疗方案；财务结果=全额退款 */
  makeCase({id:'lina', reportDate:D(-13), name:'客人22', materialsConfirmed:true, caseNo:'A000012', updated:'6 天前',
    concern:'眼部松弛', expectation:'希望眼周更年轻', needsConsult:true, activeCaseTab:'basic', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议提眉联合上睑整形。',
    consultFiles:[{label:'面诊诊疗方案'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true, settlementDone:true, visitClosed:true,
    refunds:[{amount:300000, currency:'KRW', reason:'客人因个人原因取消赴韩行程', date:D(-6), items:['提眉手术'], batchIds:['B1']}],
    procedureItems:[{name:'提眉手术', origin:'KR', done:false, cancelled:true, batchId:'B1'}],
    settlementBatches:[{id:'B1', orderedBy:'A1 室长', settledBy:'客人', time:D(-8)+' 09:00', status:'active',
      krTotal:1000000, krDeposit:300000, krBalance:700000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-14)+' 09:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩300,000），项目清单已锁定', dt:D(-8)+' 09:00'},
      {stage:'赴韩施术', actor:'A1 室长', action:'取消项目"提眉手术"，退款 ₩300,000，退款原因：客人因个人原因取消赴韩行程', dt:D(-6)+' 09:00'},
      {stage:'赴韩施术', actor:'A1 室长', action:'全部赴韩项目均已取消退款，案件结束：仅出报告', dt:D(-6)+' 09:05'}
    ]}),

  /* 已取消（管理取消）：不面诊案件使用持有项目后，管理全部取消、本次无购买，未做次数已归还持有 */
  makeCase({id:'hana', name:'客人15', subState:'arrived', materialsConfirmed:true, caseNo:'A000015', updated:'3 天前',
    concern:'术后恢复', expectation:'希望恢复期舒适', needsConsult:false, activeCaseTab:'localmgmt', visitClosed:true, cancelReason:'管理取消', mgmtStatus:'cancelled_all',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(2)+' 09:00'},
      {stage:'面诊安排', actor:'A1 室长', action:'使用了LDM 1次，剩余1次', dt:D(2)+' 10:00'},
      {stage:'本地管理', actor:'A1 室长', action:'管理取消（全部）：1次已归还持有项目（不是退款）；本次无购买，案件已取消（管理取消）', dt:D(2)+' 10:30'}
    ]}),

  /* 已取消（未购买未使用）：不面诊案件，本次既没购买也没使用 */
  makeCase({id:'tari', name:'客人16', subState:'arrived', materialsConfirmed:true, caseNo:'A000016', updated:'2 天前',
    concern:'皮肤暗沉', expectation:'了解项目', needsConsult:false, activeCaseTab:'localmgmt', visitClosed:true, cancelReason:'未购买未使用',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(3)+' 09:00'},
      {stage:'面诊安排', actor:'A1 室长', action:'本次不购买项目，案件已取消（未购买未使用）', dt:D(3)+' 10:00'}
    ]})
];

CASE_ITEMS.forEach(updateCaseStage);

var CASE_NO_SEQ = 23;

/* ---- 演示数据：每个案件一条预约来访（日期/时间/目的）——日历每个事件都对应案件列表里的一个案件（2026-10-02·一） ---- */
var DEMO_VISITS = {
  siti:[D(0),'10:45','面诊商谈'], ayu2:[D(0),'16:00','复诊'], andi:[D(0),'11:30','面诊商谈'], rina2:[D(0),'10:00','复诊'],
  yuni:[D(-2),'10:30','皮肤商谈'], maya:[D(-2),'15:00','面诊商谈'], putri:[D(-4),'10:00','面诊商谈'], dedi:[D(-3),'10:30','面诊商谈'],
  budi:[D(-3),'15:30','面诊商谈'], ayu:[D(-2),'11:00','皮肤商谈'], fajar:[D(-1),'10:30','面诊商谈'], nadia:[D(-4),'15:00','面诊商谈'],
  dinda:[D(-1),'15:00','面诊商谈'], rizky:[D(-1),'11:00','皮肤管理'], rina:[D(-4),'10:30','面诊商谈'], wulan:[D(-3),'11:30','面诊商谈'],
  agus:[D(1),'10:00','面诊商谈'], lina:[D(-3),'16:00','面诊商谈'], hana:[D(-1),'15:30','术后管理'], tari:[D(-1),'16:00','皮肤管理'],
  bayu:[D(-1),'10:00','面诊商谈']
};

CASE_ITEMS.forEach(function(c){ var v = DEMO_VISITS[c.id]; if(v){ c.visitDate = v[0]; c.visitTime = v[1]; c.visitPurpose = v[2]; } });

CASE_ITEMS.filter(function(c){ return c.id==='bayu'; }).forEach(function(c){ c.noShow = true; });

function generateCaseNo(){
  var n = 'A' + String(CASE_NO_SEQ).padStart(6,'0');
  CASE_NO_SEQ++;
  return n;
}

var CASE_TABS = [
  {key:'all', label:'全部'},
  {key:'booked', label:'预约到店'},
  {key:'consult', label:'面诊安排'},
  {key:'travel', label:'赴韩施术'},
  {key:'local', label:'本地管理'}, /* 2026-09-30 总表：选择项目、本地管理 */
  {key:'closed', label:'已结案'},
  {key:'reportonly', label:'仅出报告'}, /* 2026-09-30：从已结案里独立出来，方便回访潜在客户 */
  {key:'cancelled', label:'已取消'}
];

/* ============ 2026-09-29 状态机整体重写：以 Notion Case Management Flow（当天版）为准 ============
   六个 stage 桶（booked/consult/travel/local/closed/cancelled）继续沿用——它们本来就是案件管理
   Tab 分组键，不是状态本身（Status Dictionary 原话），新状态机的"项目确认中/待确认施术时间/待付款/
   已付款"都还在"consult"这个桶（对应"面诊安排"tab），这点没有变。变的是桶内部的细分状态和终态规则。 */
var CASE_STAGE_BADGE = {
  travel:['var(--blue-bg)','var(--blue)','赴韩施术'],
  local:['var(--blue-bg)','var(--blue)','本地管理'] /* 2026-09-29 第十轮：纯本地已付款、待用持有项目 */
};

/* 本 case 是否有发生购买：主流程里已付款的本地项目批次，或同日"本地管理"里的购买 */
function localPurchasedBatches(c){ /* 本案件买的本地项目/术后管理批次（不含KR代收、不含已作废/已退款） */
  var out = [];
  getClientHoldings(c.name).forEach(function(h){ h.batches.forEach(function(b){ if(b.caseId===c.id && !b.kr && !b.voided && !b.refund) out.push({h:h, b:b}); }); });
  return out;
}

/* 面诊（待缴费 / 待确认报告时间 / 等待报告 / 增加面诊后项目确认中）或赴韩还在进行 → 本地管理做完也不自动结案（CMD-1013-13 一·2，临时规则，只加这个保护） */
function mainlineOngoing(c){
  if(newCloseOn()) return mainlineOngoingNew(c);
  return mainlineOngoingOld(c);
}
/* 新规则（CMD-1013-16）：优先级 施术 > 面诊 > 本地。有施术或面诊的案件，本地做完不结束，等施术 / 面诊有结果（客人不做项目、手动结束、赴韩结束才算有结果）；纯本地案件本地做完就结束 */
function mainlineOngoingNew(c){
  if(krNotStartedItems(c).length || (c.settlementDone && krActiveItems(c).length && !c.krProcedureDone)) return true;
  if(c.endNote || c.krProcedureDone || c.manualEnd) return false;
  if(krAllItems(c).length && !krActiveItems(c).length) return false; /* 赴韩项目都取消 / 更换完了：施术已有结果（如无法协调后保留本地） */
  if(c.consultRequested && c.consultStatus!=='cancelled') return true;
  return !!c.reuseReport && !!c.reportReady && c.needsConsult!==false;
}
function mainlineOngoingOld(c){
  if(krNotStartedItems(c).length || (c.settlementDone && krActiveItems(c).length && !c.krProcedureDone)) return true;
  if(!c.consultRequested || c.consultStatus==='cancelled' || c.endNote || c.krProcedureDone) return false;
  return ['awaiting_payment','paid_waiting_kr','awaiting_report'].indexOf(c.consultStatus)>-1 || (c.consultStatus==='report_ready' && !!c.addedConsultAfterLocal);
}
/* 已被误结案的案件（本地管理做完时面诊 / 赴韩还在进行，如 A000009）恢复；启动时执行，幂等 */
function repairWronglyClosedCases(){
  var n = 0;
  CASE_ITEMS.forEach(function(c){
    if(!c.visitClosed || !(c.addedConsultAfterLocal || c.localTrack || c.needsConsult===true) || !mainlineOngoingOld(c)) return;
    if(!c.consultRequested && !krActiveItems(c).length) return;
    c.visitClosed = false; c.cancelReason = null; c.krProcedureDone = c.krProcedureDone && krActiveItems(c).length>0 ? c.krProcedureDone : false;
    updateCaseStage(c); logCaseEvent(c, '系统', '修正：本地管理做完时面诊 / 赴韩还在进行，案件不应结案，已恢复为进行中'); n++;
  });
  return n;
}
/* ===== CMD-1013-16 新结案规则（试行，newCloseOn() 控制）===== */
/* 钱没清：待收款（面诊费待缴 / 待付款结算单 / 在韩待付款加项）。待退款目前没有独立的「待退」状态（退款都是当场办完），所以只列待收 */
function closeBlockers(c){
  var out = [];
  if(c.consultRequested && c.consultStatus==='awaiting_payment') out.push('面诊费待缴');
  (c.settlementBatches||[]).forEach(function(b){ if(b.status==='unpaid') out.push('待付款结算单（批次 '+b.id+'）'); });
  pendingPayItems(c).forEach(function(it){ out.push('在韩待付款：'+it.name); });
  return out;
}
/* 自动结束的统一出口（本地流程里的各个结束点用）：开着新规则时，钱没清 → 不结束，写系统记录 + 提示；其余照旧 finishCase */
function autoFinish(c, reason){
  if(newCloseOn()){
    var bl = closeBlockers(c);
    if(bl.length){
      logCaseEvent(c, '系统', '案件暂不结束：还有未处理的款项（'+bl.join('、')+'），请先收款或取消该项目');
      if(typeof showToast==='function') showToast('钱还没清', '还有未处理的款项：'+bl.join('、')+'。先收款或取消该项目，案件才能结束', null);
      updateCaseStage(c);
      if(typeof document!=='undefined' && document.getElementById('case-body')){ buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c); }
      return false;
    }
  }
  finishCase(c, reason); return true;
}
/* 本地管理只能当天加：面诊 / 赴韩案件里，只有「本地管理第一次添加的当天」或「本案件到店当天」可以加；纯本地案件不适用；开关关 = 不限 */
function localDayLimited(c){ return newCloseOn() && !!c && (c.consultRequested || c.needsConsult===true || krAllItems(c).length>0 || c.addedConsultAfterLocal); }
function localAddAllowed(c){
  if(!localDayLimited(c)) return true;
  var t = todayStr();
  return t===c.localMgmtDay || t===(c.arrivedDay || c.visitDate);
}
/* 手动［结束案件］：只在付定金之前；IN 一般室长 / 管理者 */
function krDepositPaid(c){ return !!c.hasArrived || !!c.krProcedureDone || (c.settlementBatches||[]).some(function(b){ return b.status==='active' && (b.krDeposit||0)>0; }); }
/* 赴韩项目全部取消（定金已退 / 转代偿）且没到院：回到面诊级，仍可手动结束 */
function compAllKrGone(c){ return !c.hasArrived && !c.krProcedureDone && krAllItems(c).length>0 && krActiveItems(c).length===0; }
function canEndCase(c){
  if(!newCloseOn() || !c || isEnded(c) || c.visitClosed || c.subState!=='arrived' || (krDepositPaid(c) && !compAllKrGone(c))) return false;
  var a = currentAccount(); return !!a && a.role.indexOf('kr_')!==0 && a.role!=='owner' && canDo('work');
}
function caseWorkDone(c){ return !!c.krProcedureDone || (c.postcareUses||[]).length>0 || isLocalCtxWorkDone(c) || isLocalCtxWorkDone(c.localMgmt); }

function refundSum(c){ return (c.refunds||[]).reduce(function(sum,r){ return sum+(r.amount||0); }, 0); } /* 财务净额用：含代偿（定金转了本地额度，赴韩定金净额为 0） */
/* CMD-1014-05：代偿不算「退款」——案件标「代偿」，不出现「有退款」；退款显示 / 标记用 refundCashSum，代偿单独 compSum */
function refundCashSum(c){ return (c.refunds||[]).filter(function(r){ return !r.comp; }).reduce(function(sum,r){ return sum+(r.amount||0); }, 0); }
function compSum(c){ return (c.refunds||[]).filter(function(r){ return r.comp; }).reduce(function(sum,r){ return sum+(r.amount||0); }, 0); }

/* 客户详情的持有批次退款，记在"当初购买这个批次的案件"上（2026-10-05）：该案件财务显示"有退款"（财务结果其他标签、结局都不变），两边 Timeline 互相注明 */
function holdingRefundSum(c){ return (c.holdingRefunds||[]).reduce(function(sum,r){ return sum+(r.amount||0); }, 0); }
 /* 案件列表"有退款"筛选：含持有批次退款、仅办理退款 */
function financePaid(c){
  var kr=0, inn=0;
  (c.settlementBatches||[]).forEach(function(b){ if(b.status==='active'){ kr += b.krDeposit||0; inn += (b.inTotal||0) - (b.compRefund||0); } });
  if(c.localMgmt) (c.localMgmt.batches||[]).forEach(function(b){ inn += (b.inTotal||0) - (b.compRefund||0); }); /* compRefund = 代偿余额退还给客人的部分 */
  return {kr:kr, inn:inn};
}

function consultFeePaid(c){
  if(c.consultFeeWaived) return false; /* 免除面诊费：不算收入 */
  return c.reportReady || ['paid_waiting_kr','awaiting_report','report_ready'].indexOf(c.consultStatus)>-1;
}

/* 财务结果：无收入 / 仅面诊费 / 有项目收入 / 全额退款（独立于结局）。
   判断口径是我的实现判断（待确认）：项目收入=已付款批次的赴韩定金+本地全款，赴韩部分扣掉退款；面诊费免除目前没有字段，按"已缴费"推断 */
function financeResultOf(c){
  var pd = financePaid(c), ref = refundSum(c);
  var net = pd.kr - ref;
  if(refundCashSum(c)>0 && net<=0 && pd.inn<=0 && pd.kr>0) return '全额退款';
  if(net>0 || pd.inn>0) return '有项目收入';
  if(consultFeePaid(c)) return '仅面诊费';
  return '无收入';
}

function financeLabel(c){
  var f = financeResultOf(c), pd = financePaid(c), ref = refundSum(c), t = f;
  if(f==='有项目收入'){
    var parts = [];
    if(pd.kr-ref>0) parts.push(formatCurrency(pd.kr-ref,'KRW'));
    if(pd.inn>0) parts.push(formatCurrency(pd.inn,'IDR'));
    if(parts.length) t += ' ' + parts.join(' + ');
  }
  if(refundCashSum(c)>0) t += ' · 已退款 ' + formatCurrency(refundCashSum(c),'KRW');
  if(compSum(c)>0) t += ' · 代偿 ' + formatCurrency(compSum(c),'KRW');
  return t;
}

/* 案件结束的唯一出口：标记结束、推算结局、写 cancelReason（只有结局是已取消才有），再刷新界面 */
/* 进入终态时，该客户名下还没到店的后续预约（待访问）全部自动取消（Notion；"关联"口径是我的判断：同一客户的待访问案件，见待确认清单） */
/* 2026-10-05：已删除 cancelFollowUpReservations——一个案件结束不影响同一客人的其他预约 */
function finishCase(c, cancelReasonIfCancelled){
  c.visitClosed = true;
  c.entryChoicePending = false; c.mgmtActive = false; c.mgmtCancelling = false; c.localAsk = false;
  if(c.localMgmt){ c.localMgmt.active = false; c.localMgmt.mgmtCancelling = false; }
  var out = computeOutcome(c);
  c.cancelReason = out==='cancelled' ? (c.refundVisit ? '仅办理退款' : (cancelReasonIfCancelled || '未购买未使用')) : null; /* 这次到访只办了退款、没有其他购买或使用 → 已取消（仅办理退款） */
  updateCaseStage(c);
  logCaseEvent(c, '系统', '案件结束：'+terminalBadge(c)[2]+(c.stage==='cancelled' ? '（'+endReasonText(c)+'）' : ''));
  if(c.stage==='closed' && c.hasArrived && krAllItems(c).some(function(it){ return it.done; })) pushNotif('赴韩施术','施术完成，案件已结案：'+c.name+'（'+(c.caseNo||'')+'）', {caseId:c.id});
  if(typeof document!=='undefined' && document.getElementById('case-body')){ /* KR 页面没有 IN 的案件详情，不画 */
    buildCaseLog(c);
    renderCaseStatusBar(c);
    renderCaseBody(c);
  }
}

/* 终态标签：结局 + 财务标签，例如"仅出报告 · 有项目收入 ₩300,000" */
/* 状态机总览（Notion State Machines，2026-09-30，取代状态总表）：大状态两层，颜色做成独立属性 Tone */
var TONE_COLORS = {
  Beige:['#F2EADB','#8A7650'], Yellow:['#FBF0C9','#8F6F0C'], Blue:['var(--blue-bg)','var(--blue)'],
  Green:['var(--sage-bg)','var(--sage)'], Brown:['#E8D5C4','#7A4E2D'], Gray:['#EDEAE2','var(--muted)']
};

var STATE_TONE = {
  '待访问':'Beige','接待中':'Beige','面诊预约':'Yellow','等待报告':'Yellow','项目确认中':'Yellow',
  '施术预约':'Blue','赴韩施术':'Blue','选择项目':'Green','本地管理':'Green','仅出报告':'Brown','已结案':'Gray','已取消':'Gray',
  '面诊已取消':'Yellow' /* TODO(待确认)：总览没有这个瞬时态，暂沿用黄色 */
};

/* 赴韩项目：取消的项目不从 procedureItems 里删，标 cancelled（行状态=已取消） */
/* KR 在 IN 确认已付款之后才看得到赴韩项目（CMD-1012-02 C4）：待付款结算单里的项目，KR 账号读不到；IN 端照常 */
function krAllItems(c){
  var kr = typeof isKrAccount==='function' && isKrAccount(), bs = c.settlementBatches || [];
  return (c.procedureItems||[]).filter(function(it){
    if(it.origin!=='KR') return false;
    if(kr && it.batchId){ var b = bs.filter(function(x){ return x.id===it.batchId; })[0]; if(b && b.status==='unpaid') return false; }
    return true;
  });
}

function krActiveItems(c){ return krAllItems(c).filter(function(it){ return !it.cancelled && !it.swapped; }); }

function krNotStartedItems(c){ return krActiveItems(c).filter(function(it){ return !it.done; }); }

function krItemStatus(it){ return it.cancelled ? '已取消' : (it.swapped || it.replacedBy) ? '已更换' : it.done ? '已完成' : it.pendingPay ? '待付款' : '未开始'; }

/* 施术日期卡片状态（Schedule）：Draft / Pending / Confirmed / Changing / Arrived——案件主状态直接读这里 */
function scheduleState(c){
  var ks = c.krSchedule;
  if(!ks || !ks.status) return 'Draft';
  return {pending:'Pending', confirmed:'Confirmed', change_pending:'Changing', arrived:'Arrived'}[ks.status] || 'Draft';
}

/* 终态标签：只显示结局（2026-09-30：状态列只显示主状态/结局；取消原因、财务另外显示） */
function terminalBadge(c){
  if(!isEnded(c)) return null;
  var label = c.stage==='closed' ? '已结案' : c.stage==='reportonly' ? '仅出报告' : '已取消', col = toneColors(label);
  return [col[0],col[1],label];
}

function endReasonText(c){
  if(c.subState==='cancelled') return c.noShow ? '未到店' : '预约取消';
  return c.cancelReason || '未购买未使用';
}

/* ---- 未到店 No Show（2026-10-01）：待访问过了预约时间30分钟还没点"到访" → 系统自动判定为 已取消（未到店）；
   室长也可在列表行/案件页提前手动标记；不能撤回，客人后来才到就重新预约（新案件）；
   日历事件保留在原位显示删除线"未到店"（预约取消的事件才会消失）；
   （2026-10-05：案件结束不再自动取消同一客户的其他预约，未到店同理） ---- */
function markNoShow(caseId, auto){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0];
  if(!c || c.stage!=='booked' || c.subState!=='waiting') return false;
  c.subState = 'cancelled'; c.noShow = true; c.cancelReason = '未到店';
  updateCaseStage(c);
  if(auto) pushNotif('预约','未到店（自动判定）：'+c.name+' 过预约时间30分钟未到店，已取消', {caseId:c.id});
  c.logEntries = c.logEntries || [];
  c.logEntries.push(Object.assign(gmcVerStamp(), {stage:'预约到店', actor: auto ? '系统' : actingName(), action: auto ? '过预约时间30分钟未点"到访"，系统自动判定：已取消（未到店）' : '手动标记未到店：已取消（未到店）', dt:nowFullDt()}));
  return true;
}

/* 项目标签（非主状态）：时间变更待确认 / KR已标记无法施术 / 已更换；有任一标签 → 状态列显示"非正常" */
function caseAbnormalTags(c){
  var tags = [];
  var ks = c.krSchedule;
  if(ks && ks.status==='change_pending' && ks.changeSubmitted) tags.push('时间变更待确认');
  if(krAllItems(c).some(function(it){ return it.unable; })) tags.push('KR已标记无法施术');
  if(krAllItems(c).some(function(it){ return (it.replacedBy || it.swapped) && !it.cancelled; })) tags.push('已更换');
  return tags;
}

/* 项目上的黄色小标签（ItemFlag）：只打在未开始的赴韩项目上 */
function krItemFlags(c, it){
  var flags = [];
  var ks = c.krSchedule;
  if(!it.cancelled && !it.done && ks && ks.status==='change_pending' && ks.changeSubmitted) flags.push('时间变更待确认');
  if(it.unable) flags.push('KR已标记无法施术');
  return flags;
}

/* 本案件的面诊费：选「面诊」的那一刻按当时的诊所设定记进案件（consultFeeAmount），面诊费卡和财务栏都读这个金额；待缴费期间诊所调价也不影响已选面诊的案件；没有记录的老数据才退回读设定 */
function consultFeeOf(c){ return (c && typeof c.consultFeeAmount==='number') ? c.consultFeeAmount : (CLINIC_SETTINGS.consultFee||0); }
function recordConsultFee(c){ if(c && typeof c.consultFeeAmount!=='number') c.consultFeeAmount = CLINIC_SETTINGS.consultFee||0; }
/* 财务栏（2026-10-08，IN-CASE-03 第 2 节）：无收入显示"–"（面诊费已免除 = 无收入）；有收入时标签下方小字写金额：
   仅面诊费 = 本案件实缴面诊费；有项目收入 = 已付款金额（赴韩定金扣退款用韩元 + 本地项目用印尼盾，不换算、不含面诊费）；退款行照旧 */
function financeCellHtml(c){
  var f = financeResultOf(c), pd = financePaid(c), ref = refundSum(c), amt = [];
  if(f==='有项目收入' || f==='全额退款'){
    if(pd.kr-ref>0) amt.push(formatCurrency(pd.kr-ref,'KRW'));
    if(pd.inn>0) amt.push(formatCurrency(pd.inn,'IDR'));
  } else if(f==='仅面诊费'){ amt.push(formatCurrency(consultFeeOf(c),'IDR')); }
  var extra = (refundCashSum(c)>0 ? '<div style="font-size:11px;color:var(--terracotta);">退款 '+formatCurrency(refundCashSum(c),'KRW')+'</div>' : '')+(compSum(c)>0 ? '<div style="font-size:11px;color:#8F6F0C;">代偿 '+formatCurrency(compSum(c),'KRW')+'</div>' : '')+
    ((c.holdingRefunds||[]).length ? '<div style="font-size:11px;color:var(--terracotta);" title="客户详情里持有批次的退款，记在当初购买的案件上">有退款 '+formatCurrency(holdingRefundSum(c),'IDR')+'（持有批次）</div>' : '')+
    (c.cancelReason==='仅办理退款' ? '<div style="font-size:11px;color:var(--terracotta);">有退款（本次到访只办理退款）</div>' : '');
  var head = f==='无收入' ? '<div style="font-size:12px;color:var(--slate2);">–</div>' : '<div style="font-size:12px;font-weight:700;">'+f+'</div>';
  return head+(amt.length ? '<div style="font-size:11px;color:var(--slate2);">'+amt.join(' + ')+'</div>' : '')+extra;
}

/* ---- 小状态行（SubStatus，总览第2节）：统一组件，只有3种样式 Success(✓绿) / Waiting(灰，默认) / Warning(⚠黄)，文字按状态替换 ---- */
function subStatusRowHtml(items){
  if(!items || !items.length) return '';
  var styles = {
    Success:{color:'var(--sage)', icon:'✓ '},
    Waiting:{color:'var(--slate)', icon:''},
    Warning:{color:'#A8740A', icon:'⚠ '}
  };
  return '<div style="display:flex;flex-direction:column;gap:3px;margin-bottom:12px;">'+items.map(function(it){
    var st = styles[it.kind] || styles.Waiting;
    return '<div style="font-size:12px;font-weight:700;color:'+st.color+';">'+st.icon+it.text+'</div>';
  }).join('')+'</div>';
}

function caseSubStatusItems(c){
  var items = [];
  if(c.stage==='consult'){
    var inFlow = c.consultRequested && !c.reportReady;
    if(c.localAsk) items.push({kind:'Warning', text: c.localAsk==='keep' ? '赴韩项目已全部取消并退款，请室长决定保留或全部退款本地项目/术后管理' : '赴韩项目已全部取消并退款，请确认是否做/增加本地项目'});
    else if(inFlow && c.consultStatus==='awaiting_payment') items.push({kind:'Waiting', text:'待缴费'});
    else if(inFlow && c.consultStatus==='paid_waiting_kr') items.push({kind:'Waiting', text:'待确认报告时间'});
    else if(inFlow && c.consultStatus==='awaiting_report'){ if(c.consultStartedAt && !c.consultContentAt) items.push({kind:'Waiting', text:'面诊中'}); items = items.concat(reportWaitSubItems(c)); } /* 面诊中（已按开始面诊、还没上传内容）+ 预计出报告时间+倒计时 / 已超过预计时间 */
    else if(c.projectsEnabled || c.reportReady){
      if(c.reportReady) items.push({kind:'Success', text: c.reuseReport ? '沿用原诊疗方案（'+c.reuseReport.caseNo+'）' : '诊疗方案已到'});
      if(c.projectsLocked && !c.settlementDone) items.push({kind:'Waiting', text:'待付款'});
    }
  } else if(c.stage==='travel'){
    var st = scheduleState(c), ks = c.krSchedule || {};
    if(st==='Draft') items.push({kind:'Waiting', text:'待递交施术日期'}); /* TODO(待确认)：Draft 总览没有小状态文字 */
    if(st==='Pending') items.push({kind:'Waiting', text:'待确认施术时间'});
    if(st==='Confirmed' || st==='Changing' || st==='Arrived') items.push({kind:'Success', text:'施术时间已确认 '+ksTimeText(ks)});
    if(st==='Changing') items.push(ks.changeSubmitted ? {kind:'Warning', text:'施术时间变更待确认（原日期继续有效）'} : {kind:'Waiting', text:'正在选择新的施术日期'});
    if(st==='Arrived') items.push({kind:'Success', text:'已到医院'});
    if(krAllItems(c).some(function(it){ return it.unable; }) && !c.visitClosed) items.push({kind:'Warning', text:'KR已标记无法施术：'+krAllItems(c).filter(function(it){ return it.unable; }).map(function(it){ return it.name; }).join('、')});
  }
  return items;
}

function consultCarryStage(c){
  if(!c.addedConsultAfterLocal || c.visitClosed) return false;
  if(c.consultRequested && !c.reportReady && ['awaiting_payment','paid_waiting_kr','awaiting_report'].indexOf(c.consultStatus)>-1) return true;
  return !!c.reportReady && !hasAfterReportBatch(c); /* 出报告后到选完项目付款前：项目确认中 */
}

function localCarried(c){ return !!c.addedConsultAfterLocal && !isEnded(c); }

/* 本地项目都做完了（使用都已标完、没有进行中）：「本地管理进行中」标签消失（CMD-1013-14 一·1） */
function localMainDone(c){ var us = c.mgmtUses||[]; return us.length>0 && !c.mgmtActive && !us.some(function(u){ return localItemStatus(u)==='进行中'; }); }
function localMgmtTagOn(c){ return !isEnded(c) && ((c.localMgmt && c.localMgmt.active) || (localCarried(c) && !localMainDone(c) && (c.mgmtActive || c.settlementDone))); }

var CASE_PROGRESS_ORDER = ['booked','consult','travel','local','closed'];

function filterCases(key){
  CASE_TAB_FILTER = key;
  buildCaseTabs();
  renderCaseRows();
}

function getCurrentCase(){ return CASE_ITEMS.filter(function(x){ return x.id===CURRENT_CASE_ID; })[0]; }

function pickCancelReason(r){ CANCEL_REASON = r; renderCancelReasons(); }


var RESCHED_AM = []; /* 由诊所设定生成（applyClinicSettings） */

var RESCHED_PM = [];

function rescheduleMonthShift(dir){
  RESCHED_VIEW_MONTH = new Date(RESCHED_VIEW_MONTH.getFullYear(), RESCHED_VIEW_MONTH.getMonth()+dir, 1);
  renderRescheduleCalendar();
}

function rescheduleDayShift(dir){
  var nxt = new Date(RESCHED_SELECTED_DATE.getFullYear(), RESCHED_SELECTED_DATE.getMonth(), RESCHED_SELECTED_DATE.getDate()+dir);
  if(dateIsPast(dateStr(nxt))) return; /* 今天之前的日期不能选 */
  RESCHED_SELECTED_DATE = new Date(RESCHED_SELECTED_DATE.getFullYear(), RESCHED_SELECTED_DATE.getMonth(), RESCHED_SELECTED_DATE.getDate()+dir);
  RESCHED_VIEW_MONTH = new Date(RESCHED_SELECTED_DATE.getFullYear(), RESCHED_SELECTED_DATE.getMonth(), 1);
  renderRescheduleCalendar();
  renderRescheduleTimePanel();
}

function pickRescheduleDate(y,m,d){
  if(dateIsPast(dateStr(new Date(y,m,d)))) return;
  RESCHED_SELECTED_DATE = new Date(y,m,d);
  renderRescheduleCalendar();
  renderRescheduleTimePanel();
}


function pickRescheduleTime(t){ RESCHED_SELECTED_TIME = t; renderRescheduleTimePanel(); }


/* ---- Timeline format: 进程名/具体做了什么/谁/00-00-00 00:00 ---- */
function logLine(e){
  var act = tzRender(e.action); /* 时间标记按看的人的时区显示 */
  var action = e.kind==='case'
    ? '<a href="#" onclick="openCaseDetail(\''+e.caseId+'\');return false;" style="color:var(--navy);font-weight:700;">'+act+' →</a>'
    : act;
  return '<div style="padding:11px 0;border-bottom:1px solid var(--border2);font-size:13px;"><b>'+e.stage+'</b>&nbsp;&nbsp;'+action+'&nbsp;&nbsp;<span style="color:var(--slate2);">「'+actorDisplay(e)+'」</span>&nbsp;&nbsp;<span style="color:var(--muted);">'+fmtUtc(e.dt)+'</span></div>';
}

var DEMO_SHIFT_MS = 0;

/* 系统事件时间点：UTC 字符串（2026-10-07 起）；要显示请用 fmtUtc()；要"页面时区的今天"请用 todayStr() */
function nowFullDt(){ var d = realNow(); return d.toISOString().slice(0,10)+' '+d.toISOString().slice(11,16); }

function logCaseEvent(c, actor, action){
  c.logEntries = c.logEntries || [];
  var ent = {stage: stageLogLabel(c), actor: actor, actorId: (actor===ME_NAME ? currentAccountId() : undefined), action: action, dt: nowFullDt()};
  if(typeof SEEDING==='undefined' || !SEEDING) Object.assign(ent, gmcVerStamp()); /* 演示种子不盖版本章 */
  c.logEntries.push(ent);
}

var KR_COORDINATORS = ['KM1 室长', 'KC1 室长'];

/* 室长商谈（2026-10-01）：入口①案件对话房里发起（工具栏🧑‍⚕️）；入口②诊疗方案卡片[邀请室长商谈]快捷入口——点击后进入案件对话房再选室长发起视频（同一个功能） */
function consultTalkShortcut(){
  /* 2026-10-02：诊疗方案卡［邀请室长商谈］→ 直接打开视频画面（不经过对话房），只能选上传诊疗方案的KR室长 */
  var c = getCurrentCase(); if(!c) return;
  openInviteKrModal();
}

function callTitle(){ var c = VIDEO_CALL.caseId ? CASE_ITEMS.filter(function(x){ return x.id===VIDEO_CALL.caseId; })[0] : null; return c ? c.name : '演示'; }

/* ---- 视频来电信号（CMD-1008-12 A1）：IN 发起视频邀请时写到单独的 localStorage 键 gmc_call，KR 页面（室长 / 院长）的 storage 监听收到后跳来电画面；
   状态 ringing → accepted / declined → ended；不放进 gmc_state，不触发其他分页的整页刷新 ---- */
var CALL_SIGNAL_KEY = 'gmc_call';
function readCallSignal(){ try{ return JSON.parse(localStorage.getItem(CALL_SIGNAL_KEY)||'null'); }catch(e){ return null; } }
function writeCallSignal(sig){ try{ localStorage.setItem(CALL_SIGNAL_KEY, JSON.stringify(sig)); }catch(e){} }
function patchCallSignal(id, patch){ var s = readCallSignal(); if(!s || s.id!==id) return null; Object.keys(patch).forEach(function(k){ s[k] = patch[k]; }); s.ts = Date.now(); writeCallSignal(s); return s; }
/* 来电响铃超时（CMD-1012-01 J-008）：发起方 30 秒没人接 → 发起方看到「对方未接听」，被叫方（KR 室长 / 院长）收到「未接来电」toast + 通知中心；
   发起方响铃中自己挂断也算未接来电；被叫方拒绝 → 发起方看到「对方已拒绝」（被叫方自己拒绝的不再给未接来电，这是我的判断） */
var CALL_RING_MS = 30000;
function recordMissedCall(sig){
  var h = HOSPITAL_DATA[sig.hospitalId]; if(!h) return;
  h.notifs = h.notifs || [];
  var txt = '未接来电：'+(sig.clinicName||'')+' · '+sig.name+'（'+sig.caseNo+'）的视频来电（'+(sig.from||'IN')+'）';
  [['kmc_'+sig.id,'coord',null], (sig.director ? ['kmd_'+sig.id,'director',sig.director] : null)].forEach(function(x){
    if(!x || h.notifs.some(function(n){ return n.id===x[0]; })) return;
    h.notifs.unshift({id:x[0], ts:nowFullDt(), text:txt, clinicId:sig.clinicId, caseId:sig.caseId, to:x[1], director:x[2], kind:'missedcall', readBy:[]});
  });
  Store.touch();
}
function callRingTimeout(sigId){
  if(!VIDEO_CALL.active || VIDEO_CALL.sigId!==sigId || VIDEO_CALL.status!=='ringing') return;
  var sig = patchCallSignal(sigId, {status:'missed', by:ME_NAME}) || readCallSignal();
  if(sig) recordMissedCall(sig);
  VIDEO_CALL.active = false; INVITE_KR_CONTEXT_CASE_ID = null; CHAT_VIDEO_CONTEXT_CASE_ID = null;
  try{ renderDashCallCard(); renderDrawerList(); }catch(e){}
  showToast('📞 对方未接听', callTitle()+' 的视频通话没有人接听（响铃 '+(CALL_RING_MS/1000)+' 秒）', null, {sticky:true});
  goBack();
}
function startCall(kind, caseId, participants){
  VIDEO_CALL = {active:true, kind:kind, caseId:caseId, participants:participants, status:'ringing', shareBy:null, muted:false, startedAt:Date.now(), transcript:[]};
  var cc = caseId ? CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0] : null;
  if(kind!=='demo' && cc && caseKrHospital(cc)){ /* 呼叫 KR 一侧：该医院的 KR 室长 + 案件院长都会收到来电 */
    VIDEO_CALL.sigId = 'call'+Date.now()+Math.floor(Math.random()*1000);
    writeCallSignal({id:VIDEO_CALL.sigId, status:'ringing', clinicId:CURRENT_CLINIC_ID, clinicName:(clinicById(CURRENT_CLINIC_ID)||{}).name||'', caseId:cc.id, caseNo:cc.caseNo||'', name:cc.name, hospitalId:caseKrHospital(cc), director:cc.director||'', from:ME_NAME, kind:kind, ts:Date.now()});
  }
  if(VIDEO_CALL.sigId){ var sid0 = VIDEO_CALL.sigId; VIDEO_CALL.ringTimer = setTimeout(function(){ callRingTimeout(sid0); }, CALL_RING_MS); } /* 响铃超时没人接 → 未接听 */
  INVITE_KR_CONTEXT_CASE_ID = (kind==='talk') ? caseId : null;
  CHAT_VIDEO_CONTEXT_CASE_ID = (kind==='chat') ? caseId : null;
  renderDashCallCard();
  nav('video-consult');
  renderVideoPage();
}

function startDemoCall(){ startCall('demo', null, [ME_NAME+'（印尼室长）', 'KM1 室长（韩国室长）']); VIDEO_CALL.status = 'connected'; seedTranscript(); renderVideoPage(); }

function seedTranscript(){
  VIDEO_CALL.transcript = [
    {name:'A1 室长', orig:'您好，我们先确认一下客人的情况。', trans:'안녕하세요, 고객 상황부터 확인하겠습니다.'},
    {name:'KM1 室长', orig:'네, 사진은 확인했습니다.', trans:'好的，照片已经确认过了。'}
  ];
}

function simulatePeerJoin(){ if(VIDEO_CALL.status!=='ringing') return; clearTimeout(VIDEO_CALL.ringTimer); VIDEO_CALL.status = 'connected'; seedTranscript(); renderVideoPage(); }

function leaveCall(){ goBack(); }
 /* 离开/断线：通话仍在进行，可从抽屉红卡片/工作台卡片重新加入 */
function rejoinCall(){ if(!VIDEO_CALL.active) return; nav('video-consult'); renderVideoPage(); }

function callInitial(n){ return n.replace(/（.*$/,'').replace(/ 실장.*$/,'').charAt(0).toUpperCase(); }

function simulateMissedCall(){
  var c = CASE_ITEMS.filter(function(x){ return x.id===ATTACHED_CASE_ID; })[0]; if(!c) return;
  pushNotif('视频','未接来电：'+krEnterRoomName(c)+' 呼叫了 '+c.name+' 的案件视频', {caseId:c.id, link:{kind:'caseRoom'}});
}

function inviteKrVideo(name){
  /* 邀请室长视频是临时加开的一次沟通，不改变 consultStatus，但结束后要给该案件附上一份AI转写稿文件 */
  closeInviteKrModal();
  startCall('talk', CURRENT_CASE_ID, [ME_NAME+'（印尼室长）', name+' 실장（韩国室长）']); /* 室长商谈：直接呼叫上传诊疗方案的KR室长 */
}

function endVideoConsult(){
  var touchedCase = null;
  clearTimeout(VIDEO_CALL.ringTimer);
  if(VIDEO_CALL.sigId){
    if(VIDEO_CALL.status==='ringing'){ var sg0 = patchCallSignal(VIDEO_CALL.sigId, {status:'missed', by:ME_NAME}); if(sg0) recordMissedCall(sg0); } /* 还没人接就挂断 = 未接来电 */
    else patchCallSignal(VIDEO_CALL.sigId, {status:'ended', by:ME_NAME}); /* 通知 KR 一侧通话结束 */
  }
  VIDEO_CALL.active = false; /* 通话结束后，对话抽屉的红卡片和工作台卡片都消失 */
  if(INVITE_KR_CONTEXT_CASE_ID){
    var c2 = CASE_ITEMS.filter(function(x){ return x.id===INVITE_KR_CONTEXT_CASE_ID; })[0];
    if(c2){
      c2.consultFiles = c2.consultFiles || [];
      c2.consultFiles.unshift({label:'室长面诊视频',date:attDate()});
      c2.consultFiles.unshift({label:'室长面诊文本（AI生成，仅供参考）',date:attDate()});
      c2.krVideoInvited = true;
      logCaseEvent(c2, '系统', '室长视频沟通结束，已生成AI转写稿附件');
      buildCaseLog(c2);
      postCaseRoomFile(c2.id, 'KM1 室长', 'var(--sage)', '이', '室长面诊文本（AI生成，仅供参考）+ 室长面诊视频');
      touchedCase = c2;
    }
    INVITE_KR_CONTEXT_CASE_ID = null;
  }
  if(CHAT_VIDEO_CONTEXT_CASE_ID){
    var c3 = CASE_ITEMS.filter(function(x){ return x.id===CHAT_VIDEO_CONTEXT_CASE_ID; })[0];
    if(c3){
      c3.consultFiles = c3.consultFiles || [];
      var seq = c3.consultFiles.filter(function(f){ return f.label.indexOf('视频通话录像')>-1; }).length + 1;
      c3.consultFiles.unshift({label:'视频通话录像 #'+seq,date:attDate()});
      c3.consultFiles.unshift({label:'视频通话文本 #'+seq+'（AI生成，仅供参考）',date:attDate()});
      logCaseEvent(c3, '系统', '对话内视频通话结束，已生成AI转写稿附件');
      buildCaseLog(c3);
      postCaseRoomFile(c3.id, ME_NAME, 'var(--terracotta)', ME_NAME.charAt(0).toUpperCase(), '视频通话文本 #'+seq+'（AI生成，仅供参考）+ 视频通话录像 #'+seq);
      touchedCase = c3;
    }
    CHAT_VIDEO_CONTEXT_CASE_ID = null;
  }
  renderDashCallCard();
  try{ renderDrawerList(); }catch(e){}
  goBack();
  /* goBack() 切换页面之后 CURRENT_PAGE_ID 才会变成 in-casedetail，
     所以刷新DOM必须放在 goBack() 之后，不然条件永远判断在还是video-consult页时，界面看起来"没反应" */
  if(touchedCase && CURRENT_PAGE_ID==='in-casedetail' && CURRENT_CASE_ID===touchedCase.id){
    renderCaseStatusBar(touchedCase);
    renderCaseBody(touchedCase);
  }
}

/* 延续既往面诊的"有无变动"（2026-10-02 面诊改版）：走面诊时进入等待报告后，演示按钮"模拟院长判断：无变动 / 有变动"：
   无变动 → 沿用原诊疗方案（面诊资料tab显示原诊疗方案，标注"沿用自 A000xxx"，项目列表按原方案预填）→ 项目确认中；
   有变动 → 仍在等待报告，由"模拟KR室长发送诊疗方案"出新诊疗方案 → 项目确认中。没有视频/书面分支 */
/* 延续既往面诊判断有无变动（KR 室长按院长的判断操作，或院长自己，KR-CASE-01）：
   无变动 → 沿用原诊疗方案（面诊资料沿用自 A000xxx，项目列表按原方案预填）→ 项目确认中；有变动 → 仍在等待报告，走录入/提交流程出新诊疗方案 */
function coreJudgeContinuation(c, changed, by){
  if(!c || c.consultStatus!=='awaiting_report' || !isContinuationConsult(c)) return false;
  c.contJudged = true;
  if(!changed){
    c.reuseAfterConsult = true;
    logCaseEvent(c, by, '院长判断：无变动（由KR端确认）');
    applyReuseReport(c);
    updateCaseStage(c);
    pushNotif('面诊','延续既往面诊判断无变动，沿用原诊疗方案：'+c.name+'（'+(c.caseNo||'')+'）', {caseId:c.id});
  } else {
    logCaseEvent(c, by, '院长判断：有变动（由KR室长提交新诊疗方案）');
    pushNotif('面诊','延续既往面诊判断有变动，KR 将提交新诊疗方案：'+c.name+'（'+(c.caseNo||'')+'）', {caseId:c.id});
  }
  return true;
}
/* 项目确认中：KR 室长补加可选项目（只能新增，不能删除；要拿掉在对话里和 IN 室长商量）。item = {name, price, note} */
function coreAddScopeItem(c, item, by){
  if(!c || !c.reportReady || c.stage!=='consult' || !c.krScope) return false;
  if(c.krScope.items.some(function(it){ return it.name===item.name; })) return false;
  c.krScope.items.push(Object.assign({}, item, {note:item.note||''}));
  c.krScope.updatedAt = nowFullDt();
  logCaseEvent(c, by, 'KR室长补加可选项目："'+item.name+'"');
  pushNotif('面诊','KR 补加了可选项目：'+c.name+'（'+item.name+'）', {caseId:c.id});
  return true;
}

/* 提交最终报告（KR 室长 / 管理者，KR-CASE-01 第 3 节）：rep = {original:韩文原文, zh:演示翻译, items:[{name,price,note}]（赴韩项目 + 术后管理项目的可选范围）, overallNote, files:[附件名]}
   报告语言：存原文（c.reportKo）；IN 端显示翻译（c.videoSummary），可切换看原文。不碰界面，KR 页面在 Store.mutateClinic 里调用 */
function coreSubmitReport(c, rep, by){
  if(!c || c.consultStatus!=='awaiting_report') return false;
  syncKrCoordinator(c);
  c.reportReady = true;
  c.consultStatus = 'report_ready';
  c.reportDate = todayStr();
  c.reportUploadedBy = by + ' 실장';
  c.reportKo = rep.original;
  c.videoSummary = rep.zh;
  c.consultFiles = c.consultFiles || [];
  (rep.files||[]).slice().reverse().forEach(function(f){ c.consultFiles.unshift({label:f, date:attDate()}); });
  c.consultFiles.unshift({label:'面诊诊疗方案（院长口述 + 室长整理）', date:attDate()});
  c.krScope = {items:rep.items, overallNote:rep.overallNote||'', updatedAt:nowFullDt()};
  c.projectsEnabled = true;
  c.projectOriginFilter = 'KR';
  logCaseEvent(c, by, 'KR室长提交面诊诊疗方案，已出诊疗方案');
  updateCaseStage(c);
  pushNotif('面诊','诊疗方案已到：'+c.name+'（'+(c.caseNo||'')+'）', {caseId:c.id});
  return true;
}
/* ---- 查看诊疗方案：格式化的报告视图，底部"查看方案"跳转项目列表 ---- */
var REPORT_SHOW_ORIG = false; /* 报告弹窗：false = 翻译，true = 韩文原文 */
/* 诊疗方案正式模板（页面和 PDF 共用）：抬头 / 客人与案件信息 / 正文 / 推荐项目整理 / 院长署名 */
function reportDocHtml(c, showOrigWanted){
  var hasOrig = !!c.reportKo, showOrig = showOrigWanted && hasOrig, esc = function(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;'); };
  var body = esc(showOrig ? c.reportKo : c.videoSummary).replace(/\n/g,'<br>');
  var toggle = (hasOrig && typeof document!=='undefined' && document.getElementById('rp-body')) ? '<div style="display:flex;align-items:center;gap:10px;margin:10px 0;" class="no-print"><span style="font-size:11px;color:var(--muted);">'+(showOrig ? '韩文原文' : '中文翻译（演示翻译，正式版由 AI 翻译）')+'</span><button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="toggleReportOrig()">'+(showOrig ? '看翻译' : '看原文')+'</button></div>' : '';
  var ks = c.krScope || {items:[], overallNote:''}, rec = recSummaryHtml(ks.items||[], ks.overallNote);
  return '<div style="text-align:center;border-bottom:2px solid var(--navy);padding-bottom:12px;margin-bottom:14px;"><div style="font-size:12px;letter-spacing:2px;color:var(--muted);">GMC NETWORK</div><div style="font-size:22px;font-weight:700;color:var(--navy);margin-top:4px;">诊疗方案</div></div>'+
    '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:14px;"><tr><td style="padding:4px 0;color:var(--muted);width:90px;">客人</td><td>'+esc(c.name)+'</td><td style="color:var(--muted);width:90px;">Case ID</td><td>'+esc(c.caseNo||'')+'</td></tr>'+
    '<tr><td style="padding:4px 0;color:var(--muted);">主诊院长</td><td>'+esc(c.director||'')+'</td><td style="color:var(--muted);">出具日期</td><td>'+esc(c.reportDate||D(0))+'</td></tr>'+
    '<tr><td style="padding:4px 0;color:var(--muted);">医院</td><td colspan="3">'+esc(hospitalName(caseKrHospital(c),'ko'))+'</td></tr></table>'+toggle+
    '<div style="font-size:13px;line-height:1.9;color:var(--navy);margin-bottom:18px;">'+(showOrig ? '' : '尊敬的 '+esc(c.name)+'：<br><br>')+body+(showOrig ? '' : '<br><br>如有任何疑问，欢迎随时联系。')+'</div>'+
    (rec ? rec : '')+
    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;margin-top:22px;"><span style="font-family:Georgia,\'Times New Roman\',serif;font-size:21px;font-style:italic;color:var(--navy);">'+esc(c.director||'')+'</span><span style="font-size:11px;color:var(--muted);">主诊院长</span></div>';
}
function reportToPdf(){
  var c = getCurrentCase(); if(!c) return;
  var html = '<html><head><meta charset="utf-8"><title>诊疗方案_'+(c.caseNo||'')+'</title><style>body{font-family:sans-serif;padding:32px;color:#1c2b40;} .no-print{display:none;} table{width:100%;} </style></head><body>'+reportDocHtml(c, false).replace(/<button[^>]*>.*?<\/button>/g,'')+'</body></html>';
  var label = '诊疗方案_'+(c.caseNo||c.id)+'_'+(c.reportDate||D(0))+'.pdf';
  c.consultFiles = c.consultFiles || [];
  if(!c.consultFiles.some(function(f){ return f.label===label; })){ c.consultFiles.unshift({label:label, date:attDate()}); logCaseEvent(c, actingName(), '生成诊疗方案 PDF 并存入附件'); buildCaseLog(c); }
  var w = window.open('', '_blank');
  if(w){ w.document.write(html); w.document.close(); w.focus(); setTimeout(function(){ w.print(); }, 300); } /* 演示：浏览器打印窗口选「另存为 PDF」；正式版由后端生成 */
  showToast('已存入附件', label, null);
}
function toggleReportOrig(){ REPORT_SHOW_ORIG = !REPORT_SHOW_ORIG; if(typeof renderReportPage==='function') renderReportPage(); }

/* "客户到访"不是一个独立状态——点"到访"后直接进入"接待中"（c.subState='arrived'）；
   同时日历上对应的预约来访事件变暗并标"已到访"（2026-09-29 新增） */
/* 到访接续（2026-10-01 完整指令十）：接待中、基础资料确认前，客户有其他进行中（非终态、已到访）的案件时，
   基础资料tab顶部提示可接续到原案件；接续 → 本案件作废（从 CASE_ITEMS 移除，编号空掉不留痕），日历预约改挂到原案件 */
function ongoingCasesOf(c){
  return CASE_ITEMS.filter(function(x){ return x.name===c.name && x.id!==c.id && !isEnded(x) && x.subState!=='waiting' && x.subState!=='cancelled'; });
}

function resumeBannerHtml(c){
  if(c.materialsConfirmed || c.continueNew) return '';
  var list = ongoingCasesOf(c); if(!list.length) return '';
  return '<div style="background:#FFF6E5;border:1px solid #F0D9A8;border-radius:10px;padding:12px 14px;margin-bottom:14px;">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><div style="font-size:13px;font-weight:700;">该客户还有进行中的案件，是否接续到原案件？</div>'+
    '<button class="btn-ghost" style="padding:4px 10px;font-size:11px;" onclick="continueNewVisit()">继续新案件</button></div>'+
    list.map(function(x){
      var lastDt = (x.logEntries && x.logEntries.length) ? x.logEntries[x.logEntries.length-1].dt : '—';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid #F0D9A8;font-size:12px;">'+
        '<span>'+x.caseNo+' · '+caseStageProcText(x)+' · 最近更新 '+lastDt+'</span>'+
        '<button class="btn-primary" style="padding:4px 12px;font-size:11px;" onclick="resumeVisit(\''+x.id+'\')">接续</button></div>';
    }).join('')+'</div>';
}

function continueNewVisit(){
  var c = getCurrentCase(); if(!c) return;
  c.continueNew = true; renderCaseBody(c);
}

function markArrived(){
  var c = getCurrentCase(); if(!c) return;
  if(c.visitDate && c.visitDate!==todayStr()){ alert('只有来访当天才能标记客人已到店（预约日期：'+c.visitDate+'）'); return; }
  c.subState = 'arrived'; c.arrivedDay = todayStr();
  writeReceptionBeat(c); /* 接待开始：立刻写心跳 */
  renderCaseStatusBar(c);
  logCaseEvent(c, actingName(), '标记客人已到店');
  buildCaseLog(c);
  renderCaseBody(c);
}

/* 接待中不停留（CMD-1008-06）：接待中且基础资料还没保存 */
function receptionOpen(c){ return !!c && c.stage==='booked' && c.subState==='arrived' && !c.materialsConfirmed; }
/* 退回待访问的核心（不碰界面）：手动取消接待、页面内离开确认、关分页兜底、心跳过期扫描共用 */
function revertIntakeToWaiting(c, logText, actor){
  c.subState = 'waiting';
  c.metaviewStatus = 'idle'; c.photoUploaded = false; c.videoUploaded = false;
  c.concern = ''; c.expectation = ''; c.intentionProjects = []; c.intentionNote = '';
  c.budgetMin = null; c.budgetMax = null; c.needsConsult = null; c.materialsError = '';
  updateCaseStage(c);
  logCaseEvent(c, actor, logText);
}
/* 心跳：案件页开着且案件在接待中、基础资料未保存时每 5 秒写一次（单独的 localStorage 键，不触发其他分页刷新）；超过 45 秒没更新视为分页已关 → 退回待访问 */
var RECEPTION_BEAT_KEY = 'gmc_reception_beat', RECEPTION_BEAT_TTL = 45000;
function readReceptionBeats(){ try{ return JSON.parse(localStorage.getItem(RECEPTION_BEAT_KEY)||'{}') || {}; }catch(e){ return {}; } }
function writeReceptionBeat(c){
  try{ var b = readReceptionBeats(), now = Date.now(); b[CURRENT_CLINIC_ID+':'+c.id] = now; Object.keys(b).forEach(function(k){ if(now-b[k] > 10*60000) delete b[k]; }); localStorage.setItem(RECEPTION_BEAT_KEY, JSON.stringify(b)); }catch(e){}
}
function clearReceptionBeat(c){ try{ var b = readReceptionBeats(); delete b[CURRENT_CLINIC_ID+':'+c.id]; localStorage.setItem(RECEPTION_BEAT_KEY, JSON.stringify(b)); }catch(e){} }
function sweepStaleReceptions(noRefresh){
  var b = readReceptionBeats(), now = Date.now(), n = 0;
  CASE_ITEMS.forEach(function(c){
    if(!receptionOpen(c)) return;
    var t = b[CURRENT_CLINIC_ID+':'+c.id];
    if(!t || now - t > RECEPTION_BEAT_TTL){ revertIntakeToWaiting(c, '接待未完成，退回待访问', '系统'); clearReceptionBeat(c); n++; }
  });
  if(n){ try{ Store.touch(); }catch(e){} if(!noRefresh){ try{ refreshView(); }catch(e){} } }
  return n;
}

function confirmCancelIntake(){
  var c = getCurrentCase(); if(!c) return;
  closeCancelIntakeModal();
  c.subState = 'waiting';
  c.metaviewStatus = 'idle';
  c.photoUploaded = false;
  c.videoUploaded = false;
  c.concern = '';
  c.expectation = '';
  c.intentionProjects = [];
  c.intentionNote = '';
  c.budgetMin = null;
  c.budgetMax = null;
  c.needsConsult = null;
  c.materialsError = '';
  updateCaseStage(c);
  clearReceptionBeat(c);
  logCaseEvent(c, actingName(), '取消接待，案件回到待访问');
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}


/* ---- 确认前：合并的材料卡（메타뷰/照片/视频/苦恼/希望预期/面诊需求 → 确认） ---- */
/* ---- 关联之前案件（§6，2026-09-30） ---- */
var LINK_REASONS = ['复诊','术后管理','延续既往面诊'];

function clientPriorCases(c){
  return CASE_ITEMS.filter(function(x){ return x.name===c.name && x.id!==c.id && x.materialsConfirmed; }); /* 关联下拉只列基础资料已确认的案件 */
}

/* 系统提示"可能与 XX 相关"：客户有最近结案的赴韩案件，或还有没用完的术后管理项目 */
function linkSuggestionHtml(c){
  var tips = [];
  var lastKr = clientPriorCases(c).filter(function(x){ return x.stage==='closed' && x.krProcedureDone; }).pop();
  if(lastKr) tips.push(lastKr.caseNo+'（最近结案的赴韩案件）');
  clientHoldingsSorted(c.name).forEach(function(h){
    if(h.category!=='术后管理') return;
    var b = h.batches.filter(function(x){ return x.bought-x.used>0; })[0];
    if(b){ var t = caseNoLabel(b.caseId)+'（还有未用完的术后管理项目：'+h.itemName+'）'; if(tips.indexOf(t)<0) tips.push(t); }
  });
  if(!tips.length) return '';
  return '<div style="font-size:11px;color:var(--terracotta);margin-top:6px;">可能与 '+tips.join('、')+' 相关</div>';
}

function setLinkedCase(caseId){
  var c = getCurrentCase(); if(!c) return;
  c.linkedCase = caseId ? {caseId:caseId, reason:(c.linkedCase&&c.linkedCase.reason)||''} : null;
  renderCaseBody(c);
}

function setLinkReason(reason){
  var c = getCurrentCase(); if(!c || !c.linkedCase) return;
  c.linkedCase.reason = reason;
  renderCaseBody(c);
}

function linkRowHtml(c){
  var prior = clientPriorCases(c);
  var opts = '<option value="">（不关联）</option>'+prior.map(function(x){
    return '<option value="'+x.id+'"'+(c.linkedCase&&c.linkedCase.caseId===x.id?' selected':'')+'>'+x.caseNo+' · '+caseStageProcText(x)+'</option>';
  }).join('');
  var reasonSel = (c.linkedCase && c.linkedCase.caseId)
    ? '<select onchange="setLinkReason(this.value)" style="margin-left:8px;padding:7px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"><option value="">选择关联原因 *</option>'+
      LINK_REASONS.map(function(r){ return '<option'+(c.linkedCase.reason===r?' selected':'')+'>'+r+'</option>'; }).join('')+'</select>' : '';
  return '<div class="case-field-row" style="align-items:flex-start;"><span class="fk" style="padding-top:9px;">关联之前案件</span><div style="flex-grow:1;">'+
    '<select onchange="setLinkedCase(this.value)" style="padding:7px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"'+(prior.length?'':' disabled')+'>'+opts+'</select>'+reasonSel+
    (prior.length?'':'<span style="font-size:11px;color:var(--muted);margin-left:8px;">该客户没有以前的案件</span>')+
    ((c.visitPurpose==='术后管理' || c.visitPurpose==='复诊') && !(c.linkedCase && c.linkedCase.caseId) ? '<div style="font-size:11px;color:var(--terracotta);margin-top:6px;">来访目的是「'+c.visitPurpose+'」，要不要关联之前的案件？</div>' : '')+
    linkSuggestionHtml(c)+'</div></div>';
}

/* 确认基础资料时落实关联：复诊/延续既往面诊 → 把原案件的面诊诊疗方案复制进新案件附件 */
function applyCaseLink(c){
  if(!c.linkedCase || !c.linkedCase.caseId) { c.linkedCase = null; return; }
  var src = CASE_ITEMS.filter(function(x){ return x.id===c.linkedCase.caseId; })[0];
  logCaseEvent(c, actingName(), '关联之前案件 '+(src&&src.caseNo?src.caseNo:c.linkedCase.caseId)+'（'+c.linkedCase.reason+'）');
  if(src && src.hospitalId && (c.linkedCase.reason==='复诊' || c.linkedCase.reason==='延续既往面诊') && c.hospitalId!==src.hospitalId){
    logCaseEvent(c, '系统', '关联'+c.linkedCase.reason+'：医院锁定为原案件的医院 '+hospitalName(src.hospitalId,'ko'));
    c.hospitalId = src.hospitalId;
  }
  if(src && (c.linkedCase.reason==='复诊' || c.linkedCase.reason==='延续既往面诊') && isDirectorActive(src.director) && c.director!==src.director){
    logCaseEvent(c, '系统', '关联'+c.linkedCase.reason+'：院长锁定为原院长 '+src.director+'（原：'+c.director+'）');
    c.director = src.director;
  }
  if(src && (c.linkedCase.reason==='复诊' || c.linkedCase.reason==='延续既往面诊')){
    (src.consultFiles||[]).filter(function(f){ return f.label.indexOf('面诊诊疗方案')>-1; }).forEach(function(f){
      c.linkedFiles.push({label:f.label+'（来自 '+src.caseNo+'）', date:attDate()});
    });
  }
  renderCaseSubtitle(c);
}

/* ---- 关联案件tab（2026-10-01）：之前关联（本案件关联了谁）/ 后续关联（谁关联了本案件，系统自动生成）；
   每条：Case ID / 关联原因 / 日期 / 当前大状态；可展开看被关联案件的只读摘要，最下方［查看完整案件］。
   完全只读：原案件即使已是终态也照样显示；不改变原案件的状态、财务、结局，原案件 Timeline 不新增记录。适用所有关联原因 ---- */
function caseFirstDate(x){ return (x.logEntries && x.logEntries[0]) ? x.logEntries[0].dt.split(' ')[0] : '—'; }

function caseProjectNames(x){
  var kr = krAllItems(x).map(function(it){ return it.name+'（'+krItemStatus(it)+'）'; });
  var loc = [];
  getClientHoldings(x.name).forEach(function(h){ h.batches.forEach(function(b){ if(b.caseId===x.id && !b.voided) loc.push(h.itemName+' ×'+b.bought); }); });
  var all = kr.concat(loc);
  return all.length ? all.join('、') : '—';
}

function postCareUsesOf(f){
  var uses = (f.mgmtUses||[]).concat((f.localMgmt && f.localMgmt.mgmtUses) || []);
  var cat = {}; getClientHoldings(f.name).forEach(function(h){ cat[h.itemName] = h.category; });
  var seen = {};
  return uses.filter(function(u){ return cat[u.itemName]==='术后管理'; }).map(function(u){
    seen[u.itemName] = (seen[u.itemName]||0) + 1;
    return u.itemName+' · 第'+seen[u.itemName]+'次使用 · '+localItemStatus(u);
  });
}

function relatedSummaryHtml(c, other, reason, follower, origin){
  var row = function(k, v){ return '<div style="display:flex;gap:10px;font-size:12px;padding:3px 0;"><span style="color:var(--muted);min-width:96px;">'+k+'</span><span style="flex:1;color:var(--slate2);">'+v+'</span></div>'; };
  var statusTxt = caseStageProcText(other);
  var html = '';
  if(reason==='复诊'){
    html += row('日期', caseFirstDate(other))+row('面诊结论 / 报告摘要', other.reportReady ? (other.videoSummary||'已出诊疗方案') : '没有面诊诊疗方案')+row('使用的项目', caseProjectNames(other))+row('当前状态', statusTxt);
  } else if(reason==='术后管理'){
    if(other===follower){
      var uses = postCareUsesOf(follower);
      html += row('使用的术后管理项目', uses.length ? uses.join('<br>') : '尚未使用')+row('当前状态', statusTxt);
    } else {
      var pcs = postCareBatchesOf(origin).map(function(x){ return x.h.itemName+' ×'+x.b.bought+(x.b.schedule?'（'+x.b.schedule+'）':'')+' · 已用 '+x.b.used+'/'+x.b.bought; });
      html += row('提供的术后管理项目', pcs.length ? pcs.join('<br>') : '—')+row('使用情况', '见后续关联案件')+row('当前状态', statusTxt);
    }
  } else { /* 延续既往面诊 */
    if(other===follower){
      html += row('沿用的报告', follower.reuseReport ? '沿用自 '+origin.caseNo+' 的面诊诊疗方案' : '没有沿用（重新面诊；原诊疗方案已带入附件）')+row('选了哪些项目', caseProjectNames(follower))+row('当前状态', statusTxt);
    } else {
      html += row('面诊诊疗方案', other.reportReady ? (other.videoSummary||'已出诊疗方案') : '没有面诊诊疗方案')+row('选了哪些项目', caseProjectNames(other))+row('当前状态', statusTxt);
    }
  }
  return html;
}

function relatedEntryHtml(c, other, link, follower, origin, key){
  var b = caseStageBadge(other), open = !!REL_OPEN[key];
  var head = '<div style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 0;" onclick="toggleRelExpand(\''+key+'\')">'+
    '<span style="font-size:13px;font-weight:700;min-width:84px;">'+other.caseNo+'</span>'+
    '<span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+link.reason+(link.auto?'（自动）':'')+'</span>'+
    '<span style="font-size:12px;color:var(--muted);flex:1;">'+caseFirstDate(other)+'</span>'+
    '<span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';">'+b[2]+'</span><span style="font-size:11px;color:var(--slate);">'+(open?'▴':'▾')+'</span></div>';
  var body = open ? '<div style="background:var(--border2);border-radius:10px;padding:10px 14px;margin-bottom:10px;">'+relatedSummaryHtml(c, other, link.reason, follower, origin)+
    '<div style="margin-top:8px;"><button class="btn-outline" style="padding:4px 12px;font-size:12px;" onclick="viewRelatedCase(\''+other.id+'\')">查看案件</button><span style="font-size:11px;color:var(--muted);margin-left:8px;">'+(isEnded(other) ? '已终态：打开附件里的"对话记录（文本）"' : '进行中：在案件里打开对话')+'</span></div></div>' : '';
  return '<div style="border-bottom:1px solid var(--border2);">'+head+body+'</div>';
}

function viewRelatedCase(id){
  var o = CASE_ITEMS.filter(function(x){ return x.id===id; })[0]; if(!o) return;
  if(isEnded(o)) openCaseNewTab(id, '&tab=attachments');
  else if(caseRoomEligible(o)) openCaseNewTab(id, '&chat=open');
  else openCaseNewTab(id);
}

function relatedTabHtml(c){ /* 关联只往前：只显示本案件关联的旧案件（CMD-1013-12 一·1） */
  var before = '';
  if(c.linkedCase && c.linkedCase.caseId){
    var src = CASE_ITEMS.filter(function(x){ return x.id===c.linkedCase.caseId; })[0];
    if(src) before = relatedEntryHtml(c, src, c.linkedCase, c, src, 'b-'+src.id);
  }
  var empty = '<div style="font-size:12px;color:var(--muted);padding:10px 0;">—</div>';
  return '<div class="card" style="padding:18px 24px;"><div class="info-heading" style="margin-bottom:6px;">关联案件 <span style="font-weight:400;font-size:11px;color:var(--muted);">本案件关联了谁</span></div>'+(before||empty)+
    '<div style="font-size:11px;color:var(--muted);margin-top:12px;">只读：不改变被关联案件的状态、财务、结局，也不会在它的 Timeline 里新增记录。</div></div>';
}

/* 意向项目一行 / 预算一行：基础资料和「增加面诊」共用（CMD-1013-13 二·1） */
function intentRowHtml(c){
  var intentionChips = (c.intentionProjects||[]).map(function(it,idx){
    return '<span class="chip active" style="display:inline-flex;align-items:center;gap:4px;">'+it.name+'<span style="cursor:pointer;" onclick="removeIntentionProject('+idx+');event.stopPropagation();">✕</span></span>';
  }).join('');

  return !intentKrAllowed(c) ? '' : '<div class="case-field-row" style="align-items:flex-start;"><span class="fk" style="padding-top:9px;">意向项目 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;">'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px;">'+intentionChips+'<button class="btn-ghost" style="padding:4px 10px;font-size:12px;" onclick="openIntentionPickerModal()">+ 添加</button></div>'+
      '<input type="text" id="cf-intention-note" placeholder="补充说明…" value="'+(c.intentionNote||'')+'" oninput="saveMaterialsDraft(\'intentionNote\',this.value)">'+
      '</div></div>';
}
function budgetRowHtml(c){
  return '<div class="case-field-row"><span class="fk">预算（选填）</span><div style="flex-grow:1;display:flex;align-items:center;gap:8px;">'+
      '<span style="font-size:12px;color:var(--muted);">Rp</span><input type="number" id="cf-budget-min" placeholder="最低" value="'+(c.budgetMin||'')+'" style="width:120px;" oninput="saveBudgetDraft(\'budgetMin\',this.value)">'+
      '<span style="font-size:12px;color:var(--muted);">～</span>'+
      '<span style="font-size:12px;color:var(--muted);">Rp</span><input type="number" id="cf-budget-max" placeholder="最高" value="'+(c.budgetMax||'')+'" style="width:120px;" oninput="saveBudgetDraft(\'budgetMax\',this.value)">'+
      '</div></div>';
}
function materialsCardHtml(c){
  syncDirectorChoice(c);
  var metaviewText = c.metaviewStatus==='ready'
    ? '<span style="font-weight:700;color:var(--sage);">已检测到</span> <a href="#" class="info-link">查看诊疗方案 ↗</a>'
    : c.metaviewStatus==='checking'
      ? '<span style="color:var(--terracotta);">检测中…</span>'
      : '<span style="color:var(--slate2);cursor:pointer;border-bottom:1px dashed var(--dim);" onclick="simulateMetaviewReady()" title="原型演示：点击模拟메타뷰设备完成检测并推送数据">待检测</span>';
  var photoText = c.photoUploaded ? '<span style="font-weight:700;color:var(--sage);">✓ 已上传</span>' : '<button class="btn-ghost" onclick="mockUpload(\'photo\')">上传照片</button>';
  var videoText = c.videoUploaded ? '<span style="font-weight:700;color:var(--sage);">✓ 已上传</span>' : '<button class="btn-ghost" onclick="mockUpload(\'video\')">上传视频</button>';
  var ci0 = continuationInfo(c);
  var btn = function(val, label, key){ var on = (c.needsConsult===val); return '<button class="'+(on?'btn-primary':'btn-outline')+'" onclick="setNeedsConsult('+key+')">'+(on?'✅ ':'')+label+'</button>'; };
  var needsConsultBody = '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+btn(true,'面诊','true')+
    ((ci0 && ci0.overdue) ? '' : btn(false,'不面诊','false'))+
    (reusableReportSrc(c) ? btn('reuse','沿用原诊疗方案',"'reuse'") : '')+'</div>'+
    ((ci0 && ci0.overdue) ? '<div style="font-size:11px;color:#C1454A;margin-top:6px;">距原案件 '+ci0.src.caseNo+' 的报告日期（'+ci0.reportDate+'）已超过1个月：只能面诊并付费，不能免除、不能沿用原诊疗方案</div>' : '')+
    ((ci0 && !ci0.overdue && ci0.newHistory) ? '<div style="font-size:11px;color:var(--terracotta);margin-top:6px;">有新增医美史，建议面诊（默认面诊并付费，室长可以改）</div>' : '')+
    ((ci0 && !ci0.overdue && !ci0.newHistory) ? '<div style="font-size:11px;color:var(--muted);margin-top:6px;">距原案件报告日期（'+ci0.reportDate+'）1个月内：可面诊（默认免除面诊费）/ 不面诊 / 沿用原诊疗方案</div>' : '');

  var intentRow = intentRowHtml(c);
  return '<div class="card" style="padding:22px 24px;">'+
    resumeBannerHtml(c)+
    linkRowHtml(c)+
    '<div class="case-field-row"><span class="fk">메타뷰 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;font-size:13px;">'+metaviewText+'</div></div>'+
    '<div class="case-field-row"><span class="fk">上传照片 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;"><div style="font-size:13px;">'+photoText+'</div><div style="font-size:11px;color:var(--muted);margin-top:3px;">规格：白底正面照，1200×1600px</div></div></div>'+
    '<div class="case-field-row"><span class="fk">上传视频 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;">'+videoText+'</div></div>'+
    '<div class="case-field-row"><span class="fk">苦恼 <span style="color:var(--terracotta);">*</span></span><input type="text" id="cf-concern" placeholder="客人本次的苦恼…" value="'+(c.concern||'')+'" oninput="saveMaterialsDraft(\'concern\',this.value)"></div>'+
    '<div class="case-field-row"><span class="fk">希望预期 <span style="color:var(--terracotta);">*</span></span><input type="text" id="cf-expectation" placeholder="客人希望达到的效果…" value="'+(c.expectation||'')+'" oninput="saveMaterialsDraft(\'expectation\',this.value)"></div>'+
    budgetRowHtml(c)+
    '<div class="case-field-row"><span class="fk">上传附件（选填）</span><div style="flex-grow:1;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span style="font-size:12px;color:var(--slate2);">'+((c.manualAttachments||[]).length ? (c.manualAttachments||[]).map(function(f){ return f.label; }).join('、') : '外部文件（选填）')+'</span><button class="btn-ghost" style="padding:4px 10px;font-size:12px;" onclick="mockUploadAttachment()">+ 上传</button></div></div>'+
    caseBeautyRowHtml(c)+
    '<div class="case-field-row" style="border-bottom:none;align-items:flex-start;"><span class="fk" style="padding-top:9px;">面诊需求 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;">'+needsConsultBody+'</div></div>'+
    directorRowHtml(c)+
    intentRow+ /* 意向项目在院长选择下面（CMD-1012-08 一·1） */
    '<div style="display:flex;justify-content:flex-end;align-items:center;gap:14px;margin-top:16px;"><span class="error-text" id="materials-error" style="display:'+(c.materialsError?'block':'none')+';">'+(c.materialsError||'')+'</span><button class="btn-outline" onclick="openCancelIntakeModal()">取消接待</button><button class="btn-primary" onclick="confirmMaterials()">确认</button></div>'+
    '</div>';
}

function saveMaterialsDraft(field, val){
  var c = getCurrentCase(); if(!c) return;
  c[field] = val; /* 只存草稿，不重渲染，这样切换面诊/不面诊不会把已输入的内容清空 */
}

function saveBudgetDraft(field, val){
  var c = getCurrentCase(); if(!c) return;
  c[field] = val==='' ? null : Number(val);
}

function setIntentionPickerFilter(o){ INTENTION_PICKER_FILTER = o; renderIntentionPickerModal(); }

function removeIntentionProject(idx){
  var c = getCurrentCase(); if(!c) return;
  c.intentionProjects.splice(idx,1);
  renderCaseBody(c);
}

/* 意向项目/预算只读展示（基础资料tab、面诊资料tab共用，KR可见） */
function intentionInfoHtml(c){
  var chips = (c.intentionProjects||[]).map(function(it){
    return '<span class="status-pill" style="background:var(--terracotta-bg);color:var(--terracotta);margin-right:4px;">'+it.name+'</span>';
  }).join('') || '<span style="color:var(--muted);">—</span>';
  var budgetText = (c.budgetMin||c.budgetMax) ? (formatCurrency(c.budgetMin||0,'IDR')+' ～ '+(c.budgetMax?formatCurrency(c.budgetMax,'IDR'):'不限')) : '—';
  var intentLine = !intentKrAllowed(c) ? '' : '<div class="case-field-row"><span class="fk">意向项目</span><div style="flex-grow:1;font-size:13px;">'+chips+(c.intentionNote?'<div style="font-size:11px;color:var(--muted);margin-top:4px;">'+c.intentionNote+'</div>':'')+'</div></div>';
  return intentLine+
    '<div class="case-field-row"><span class="fk">预算</span><span style="flex-grow:1;font-size:13px;">'+budgetText+'</span></div>';
}

/* 延续既往面诊（2026-10-01 修正）：
   - 距原案件报告日期超过 1 个月 → 锁定：只能"面诊"且付费，不能免除、不能沿用
   - 基础资料新增了医美史 → 提示"有新增医美史，建议面诊"，默认面诊（付费），室长可以改
   - 1 个月内（且室长没有改成付费面诊）→ 面诊 / 不面诊 / 沿用原诊疗方案 三选一
   - 面诊（付费或免除）结束后多一步"有无变动"：无变动→沿用原诊疗方案→项目确认中（不经过等待报告）；有变动→视频进等待报告、书面直接出新诊疗方案→项目确认中 */
function reportSrcOf(c){ /* 关联原因=延续既往面诊 且被关联案件有面诊诊疗方案 */
  var l = c.linkedCase;
  if(!l || !l.caseId || l.reason!=='延续既往面诊') return null;
  var src = CASE_ITEMS.filter(function(x){ return x.id===l.caseId; })[0];
  return (src && src.reportReady) ? src : null;
}

function reportDateOf(src){ return src.reportDate || ((src.logEntries && src.logEntries[0]) ? src.logEntries[0].dt.split(' ')[0] : todayStr()); }

function reportOverMonth(src){
  var d = new Date(reportDateOf(src)); d.setMonth(d.getMonth()+1);
  return d < new Date(todayStr());
}

function continuationInfo(c){
  var src = reportSrcOf(c); if(!src) return null;
  return {src:src, overdue:reportOverMonth(src), reportDate:reportDateOf(src), newHistory:newBeautyRecordsOf(c).length>0};
}

function onNewHistoryChanged(){
  var c = getCurrentCase(); if(!c) return;
  var i = continuationInfo(c);
  if(i && !i.overdue && !c.needsConsultTouched){ /* 有新增医美史：默认面诊（付费），室长可以改 */
    c.needsConsult = i.newHistory ? true : null;
  }
  c.feeDraft = null;
  renderCaseBody(c);
}

/* 医院 + 院长（2026-10-06 多医院）：选"面诊"才出现，都必选；先选医院（只列出本诊所对接的医院；只对接一家就自动选定），再选该医院的院长（只含启用的院长）；
   复诊/延续既往面诊 → 医院锁定为原案件的医院；院长默认带出原案件院长并锁定，原院长停用时才解锁可改选（医院仍锁定）；
   确认后写入案件的医院和对接院长，选定后不能更换；不面诊的本地案件没有医院和院长 */
function hospitalLockInfo(c){ return null; } /* 2026-10-07：一诊所一医院，案件的医院就是本诊所对接的医院，不再选择也无需锁定 */
function directorLockInfo(c){
  var l = c.linkedCase; if(!l || !l.caseId || (l.reason!=='复诊' && l.reason!=='延续既往面诊')) return null;
  var src = CASE_ITEMS.filter(function(x){ return x.id===l.caseId; })[0];
  if(!src || !src.director || !isDirectorActive(src.director)) return null;
  return {name:src.director, hospitalId:src.hospitalId, caseNo:src.caseNo, reason:l.reason};
}
/* 这个案件面诊的医院：已选的；只对接一家医院的诊所自动是那一家 */
function caseHospitalId(c){
  var hl = hospitalLockInfo(c); if(hl) return hl.hospitalId;
  if(c.hospitalId) return c.hospitalId;
  return clinicHospital(c.clinicId || CURRENT_CLINIC_ID);
}
function caseHospitalName(c){ var h = c.hospitalId || caseHospitalId(c); return h ? hospitalName(h, 'ko') : ''; }
/* 这个案件所选院长开放的施术日期（KR 端按院长设定） */
function caseOpenDates(c){ return (c && c.hospitalId && c.director) ? hospitalOpenDates(c.hospitalId, c.director) : []; }

function syncDirectorChoice(c){
  if(c.materialsConfirmed) return;
  if(c.needsConsult!==true){ c.director = null; c.hospitalId = null; return; }
  var hid = caseHospitalId(c); if(hid) c.hospitalId = hid;
  if(c.hospitalId) syncKrCoordinator(c);
  var lk = directorLockInfo(c);
  if(lk && (!c.hospitalId || lk.hospitalId===c.hospitalId)) c.director = lk.name;
  else if(c.director && (!c.hospitalId || hospitalDirectorNames(c.hospitalId).indexOf(c.director)<0)) c.director = null;
}

function setCaseDirector(v){ var c = getCurrentCase(); if(!c) return; var hid0 = caseHospitalId(c), off0 = v && hid0 ? directorTodayOff(hid0, v) : null; if(off0 && off0.full) return; c.director = v || null; renderCaseBody(c); }

/* 医院 + 院长两个下拉（基础资料选面诊时；增加面诊后缴费前也用这两个） */
function hospitalDirectorSelectHtml(c, onHospital, onDirector, selStyle){
  var lk = directorLockInfo(c), hid = caseHospitalId(c);
  var names = hid ? hospitalDirectorNames(hid) : [];
  var dirLocked = !!lk && (!hid || lk.hospitalId===hid);
  var dirSel = '<select '+((dirLocked || !hid)?'disabled ':'')+'onchange="'+onDirector+'(this.value)" style="'+selStyle+((dirLocked||!hid)?'background:var(--sand);color:var(--muted);':'')+'"><option value="">请选择院长</option>'+
    names.map(function(d){ return '<option'+(c.director===d?' selected':'')+'>'+d+'</option>'; }).join('')+'</select>';
  return {hosp:'', dir:dirSel, hid:hid, hl:null, lk:lk};
}

/* IN 选院长的介绍卡（KR-DOC-01 第 2 节）：照片 + 姓名 + 职称 + 经历 + 认证 + 擅长项目；全部院长都列出（停用的不列），擅长客人意向项目的排前面并标示 */
function docIntentMatch(hid, dr, c){
  var h = HOSPITAL_DATA[hid] || {projects:[]}, catOf = function(n){ var p = (h.projects||[]).filter(function(x){ return x.name===n; })[0]; var cc = p && (PROJECT_CATEGORIES[p.categoryId] || KR_CATEGORIES[p.categoryId]); return cc ? cc.label : ''; };
  var intents = (c.intentionProjects||[]).map(function(it){ var p = projById(it.projectId); var cc = p && PROJECT_CATEGORIES[p.categoryId]; return {name:it.name, cat:cc ? cc.label : ''}; });
  return (dr.specialties||[]).filter(function(sn){ return intents.some(function(it){ return it.name===sn || (it.cat && catOf(sn)===it.cat); }); });
}
/* 院长默认头像（演示数据没有照片时用）：灰底剪影，颜色取自院长的代表色 */
function defaultAvatarUri(color){
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="'+(color||'#C9B8A3')+'"/><circle cx="32" cy="24" r="11" fill="#fff" fill-opacity=".92"/><path d="M10 64c0-13 10-22 22-22s22 9 22 22z" fill="#fff" fill-opacity=".92"/></svg>';
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
function directorAvatarHtml(dr, size){
  var a = ACCOUNTS.filter(function(x){ return x.hospitalId && x.name===dr.name; })[0];
  var src = dr.photo || (a && a.photo && String(a.photo).indexOf('data:')===0 ? a.photo : '') || defaultAvatarUri(dr.color);
  return '<img src="'+src+'" style="width:'+size+'px;height:'+size+'px;border-radius:50%;object-fit:cover;flex-shrink:0;">';
}
/* 今天这位院长有没有 OFF（A5）：整天 OFF = 不可选；半天 OFF = 只标出来，还能选 */
function directorTodayOff(hid, name){
  var td = todayStr(), offs = ((HOSPITAL_DATA[hid]||{}).offs||[]).filter(function(o){ return o.kind==='director' && o.who===name && offApplies(o, td); });
  if(!offs.length) return null;
  var full = offs.some(function(o){ return !o.part || o.part==='全天'; });
  return {full:full, part: full ? '全天' : offs.map(function(o){ return o.part; }).join('、')};
}
function directorCardHtml(dr, hid, c, pickable, selected){
  var off = directorTodayOff(hid, dr.name); if(off && off.full){ pickable = false; selected = false; }
  var ph = directorAvatarHtml(dr, 54);
  var m = docIntentMatch(hid, dr, c), li = function(arr){ return (arr||[]).map(function(x){ return '<div>'+(x.when?x.when+'：':'')+(x.zh||x.ko)+'</div>'; }).join(''); };
  return '<div '+(pickable?'onclick="setCaseDirector(\''+dr.name+'\')" ':'')+'style="display:flex;gap:12px;padding:12px;border:1px solid '+(selected?'var(--terracotta)':'var(--border)')+';border-radius:10px;background:'+(selected?'var(--terracotta-bg)':'#fff')+';'+(pickable?'cursor:pointer;':'')+((off&&off.full)?'opacity:.5;filter:grayscale(1);cursor:not-allowed;':'')+'margin-top:8px;">'+ph+
    '<div style="flex:1;font-size:12px;line-height:1.6;"><div style="font-size:14px;font-weight:700;">'+dr.name+' <span style="font-weight:400;color:var(--slate2);">'+(dr.nameEn||'')+(dr.nameZh?' / '+dr.nameZh:'')+'</span> <span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+(dr.title||'院长')+'</span>'+(off ? ' <span class="status-pill" style="background:#F6DCDC;color:#C1454A;">'+(off.full?'今日 OFF':'今日'+off.part+' OFF')+'</span>' : '')+(m.length?' <span class="status-pill" style="background:var(--sage-bg);color:var(--sage);">★ 擅长客人意向项目</span>':'')+(selected?' <span class="status-pill" style="background:var(--terracotta);color:#fff;">已选</span>':'')+'</div>'+
    (dr.career&&dr.career.length ? '<div style="color:var(--slate2);margin-top:3px;">'+li(dr.career)+'</div>' : '')+(dr.certs&&dr.certs.length ? '<div style="color:var(--slate2);margin-top:3px;"><b>认证</b> '+dr.certs.map(function(x){ return x.zh||x.ko; }).join('；')+'</div>' : '')+
    (dr.specialties&&dr.specialties.length ? '<div style="margin-top:4px;"><b>擅长</b> '+dr.specialties.map(function(sn){ return '<span class="chip'+(m.indexOf(sn)>-1?' active':'')+'" style="cursor:inherit;">'+sn+'</span>'; }).join('')+'</div>' : '')+'</div></div>';
}
function directorCardsHtml(c){
  var hid = caseHospitalId(c); if(!hid) return '';
  var lk = directorLockInfo(c), list = hospitalDirectors(hid).filter(function(x){ return x.active; });
  list = list.map(function(dr, i){ return {dr:dr, m:docIntentMatch(hid, dr, c).length, i:i}; }).sort(function(a,b){ return (b.m>0)-(a.m>0) || a.i-b.i; });
  return '<div style="margin-top:10px;"><div style="font-size:12px;font-weight:700;">院长介绍'+(lk?'（已锁定原院长）':'（点卡片选择；擅长客人意向项目的排前面）')+'</div>'+list.map(function(x){ return directorCardHtml(x.dr, hid, c, !lk, c.director===x.dr.name); }).join('')+'</div>';
}
function directorRowHtml(c){
  if(c.needsConsult!==true) return '';
  var o = hospitalDirectorSelectHtml(c, '', 'setCaseDirector', 'padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;');
  var lk = o.lk, hl = o.hl;
  var hint = (hl ? '<div style="font-size:11px;color:var(--muted);margin-top:6px;">🔒 关联"'+hl.reason+'"（'+hl.caseNo+'）：医院已锁定为原案件的医院'+(lk ? '，院长已锁定原院长；原院长停用时才可改选' : '')+'</div>' : '')+
    ((!lk && c.linkedCase && c.linkedCase.caseId && (c.linkedCase.reason==='复诊'||c.linkedCase.reason==='延续既往面诊')) ? '<div style="font-size:11px;color:var(--terracotta);margin-top:6px;">原案件的院长已停用，请在原医院里重新选择院长</div>' : '')+
    ((!hl && !lk) ? '<div style="font-size:11px;color:var(--muted);margin-top:6px;">院长来自本诊所对接的医院（'+hospitalName(o.hid,'ko')+'）；确认基础资料后不能更换</div>' : '');
  return '<div class="case-field-row" style="border-bottom:none;align-items:flex-start;"><span class="fk" style="padding-top:9px;">院长 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;">'+hint+directorCardsHtml(c)+'</div></div>';
}

/* 没选「面诊」时意向项目只能选本地项目（赴韩项目要先面诊）；选了「面诊」或「沿用原诊疗方案」才能选赴韩项目（CMD-1012-08 一·2） */
function intentKrAllowed(c){ return c.needsConsult===true || c.needsConsult==='reuse'; }
function setNeedsConsult(val){
  var c=getCurrentCase(); if(!c) return;
  if(val!==true && val!=='reuse' && (c.intentionProjects||[]).length){ /* 未选面诊：意向项目整个栏位不出现，已选的提示后清空（CMD-1012-12 三·1，取代 08 的「只能选本地项目」） */
    var names = c.intentionProjects.map(function(it){ return it.name; });
    c.intentionProjects = [];
    alert('没选「面诊」，不需要填意向项目，已清空：'+names.join('、'));
  }
  var ci = continuationInfo(c);
  if(ci && ci.overdue && val!==true) return; /* 超过1个月：只能面诊 */
  c.needsConsult = val;
  c.needsConsultTouched = true;
  c.feeDraft = null;
  renderCaseBody(c);
}

function mockUpload(kind){
  var c = getCurrentCase(); if(!c) return;
  if(kind==='photo') c.photoUploaded = true; else c.videoUploaded = true;
  c.materialsError = '';
  renderCaseBody(c);
}

/* 沿用之前诊疗方案：面诊资料tab显示旧诊疗方案（只读，标注"沿用自 A000xxx"）；项目列表按旧诊疗方案的方案预填（价格按现在的项目库重新取）；
   之后流程（付款→施术预约…）同普通面诊案件；旧案件（如仅出报告）保持终态不变，只在它的关联案件tab里出现反向记录 */
function applyReuseReport(c){
  var src = reportSrcOf(c); if(!src) return;
  c.needsConsult = true;
  c.consultRequested = true;
  c.director = src.director || c.director; /* 沿用原诊疗方案：医院和院长沿用原案件的 */
  c.hospitalId = src.hospitalId || c.hospitalId;
  c.reportReady = true;
  c.consultStatus = 'report_ready';
  c.videoSummary = src.videoSummary || '';
  c.reportUploadedBy = src.reportUploadedBy || '';
  c.reuseReport = {fromId:src.id, caseNo:src.caseNo, date:reportDateOf(src)};
  /* 旧诊疗方案的方案：旧案件的赴韩项目名（不含已更换的原项目）；没有就取它的可选范围；价格按现在的项目库重新取 */
  var names = [];
  krAllItems(src).forEach(function(it){ if(!it.swapped && names.indexOf(it.name)<0) names.push(it.name); });
  if(!names.length && src.krScope) src.krScope.items.forEach(function(it){ if(names.indexOf(it.name)<0) names.push(it.name); });
  var scopeNames = names.slice();
  if(src.krScope) src.krScope.items.forEach(function(it){ if(scopeNames.indexOf(it.name)<0) scopeNames.push(it.name); });
  var lib = function(n){ return PROJECT_LIBRARY.filter(function(p){ return p.name===n && p.active && p.origin==='KR' && (!c.hospitalId || p.hospitalId===c.hospitalId); })[0]; };
  c.krScope = {items: scopeNames.map(function(n){ var p = lib(n); return p ? {name:p.name, price:p.price, note:''} : null; }).filter(Boolean), overallNote:'沿用自 '+src.caseNo+' 的方案（价格按现在的项目库）', updatedAt:nowFullDt()};
  c.recommended = names.map(function(n){ var p = lib(n); return p ? {projectId:p.id, name:p.name, price:p.price, currency:currencyOf(p.origin), origin:p.origin, categoryId:p.categoryId} : null; }).filter(Boolean);
  c.projectsEnabled = true;
  c.projectOriginFilter = 'KR';
  c.activeCaseTab = 'kr';
  logCaseEvent(c, actingName(), (c.reuseAfterConsult ? '面诊后院长判断无变动，沿用原诊疗方案（' : '沿用原诊疗方案（')+src.caseNo+'）：'+(c.reuseAfterConsult ? '' : '不产生面诊费，')+'直接进入项目确认中，不经过等待报告；项目列表按原方案预填 '+c.recommended.length+' 项（价格按现在的项目库）');
}


/* ---- 确认后：两个tab ---- */
function switchCaseTab(tab){
  var c = getCurrentCase(); if(!c) return;
  c.activeCaseTab = tab;
  renderCaseBody(c);
}

function relatedFollowers(c){ return CASE_ITEMS.filter(function(x){ return x.linkedCase && x.linkedCase.caseId===c.id; }); }

function normalizeCaseTab(c){
  var t = c.activeCaseTab;
  if(t==='projects'){ t = c.activeCaseTab = 'kr'; } /* 旧存档 / 旧链接里的「项目列表」→ 赴韩施术（本地案件落到本地管理） */
  if(t==='kr' && !showKrTab(c)) c.activeCaseTab = showLocalTab(c) ? 'localmgmt' : 'basic';
  else if(t==='localmgmt' && !showLocalTab(c)) c.activeCaseTab = showKrTab(c) ? 'kr' : 'basic';
  else if(t==='settle' && !showSettleTab(c)) c.activeCaseTab = 'basic';
  else if(t==='related' && !showRelatedTab(c)) c.activeCaseTab = 'basic';
}

function caseTabsHtml(c){
  normalizeCaseTab(c);
  var tabs = '<span class="tab'+(c.activeCaseTab==='basic'?' active':'')+'" onclick="switchCaseTab(\'basic\')">基础资料</span>';
  if(c.consultRequested){
    tabs += '<span class="tab'+(c.activeCaseTab==='consult'?' active':'')+'" onclick="switchCaseTab(\'consult\')">面诊资料</span>';
  }
  if(showKrTab(c)){
    tabs += '<span class="tab'+(c.activeCaseTab==='kr'?' active':'')+'" onclick="switchCaseTab(\'kr\')">赴韩施术</span>';
  }
  if(showLocalTab(c)){
    tabs += '<span class="tab'+(c.activeCaseTab==='localmgmt'?' active':'')+'" onclick="switchCaseTab(\'localmgmt\')">本地管理</span>';
  }
  if(showSettleTab(c)){
    tabs += '<span class="tab'+(c.activeCaseTab==='settle'?' active':'')+'" onclick="switchCaseTab(\'settle\')">结算</span>';
  }
  if(showRelatedTab(c)){
    tabs += '<span class="tab'+(c.activeCaseTab==='related'?' active':'')+'" onclick="switchCaseTab(\'related\')">关联案件</span>';
  }
  if(c.materialsConfirmed){
    tabs += '<span class="tab'+(c.activeCaseTab==='attachments'?' active':'')+'" onclick="switchCaseTab(\'attachments\')">附件</span>';
    tabs += '<span class="tab'+(c.activeCaseTab==='timeline'?' active':'')+'" onclick="switchCaseTab(\'timeline\')">Timeline</span>'; /* 独立 tab（附件后面），各 tab 底部不再挂 Timeline（CMD-1013-08 四·3） */
  }
  return '<div class="tabs" style="margin-bottom:4px;">'+tabs+'</div>';
}

/* ---- 附件 tab（§7，2026-09-30）：生成 Case ID 之后出现；基础资料里的 메타뷰/照片/视频、关联案件带出的报告、手动上传、面诊阶段产生的文件统一放这里 ---- */
function attDate(){ return todayStr().slice(2); }
 /* YY-MM-DD */
function caseBaseDate(c){
  var d = c.materialsDate || ((c.logEntries && c.logEntries[0]) ? c.logEntries[0].dt.split(' ')[0] : todayStr());
  return d.slice(2);
}

function retentionLabel(f){
  if(f.retention) return f.retention;
  return /录像|AI生成|对话记录|视频通话/.test(f.label) ? '结案后 3 年' : '最后就诊起 25 年'; /* 对话记录/录像/AI文本=结案后3年；报告、基础资料等病历类=最后就诊起25年（只显示，不做真正的删除机制） */
}

function caseAttachments(c){
  var base = caseBaseDate(c), list = [];
  if(c.metaviewStatus==='ready') list.push({src:'基础资料', label:'메타뷰 检测报告', date:base});
  if(c.photoUploaded) list.push({src:'基础资料', label:'照片', date:base});
  if(c.videoUploaded) list.push({src:'基础资料', label:'视频', date:base});
  (c.linkedFiles||[]).forEach(function(f){ list.push({src:'基础资料', label:f.label, date:f.date||base}); });
  (c.manualAttachments||[]).forEach(function(f){ list.push({src:f.src||'基础资料', label:f.label, date:f.date||base}); });
  (c.consultFiles||[]).forEach(function(f){ list.push({src:'面诊资料', label:f.label, date:f.date||base}); });
  if(c.chatArchive){
    list.push({src:'对话', label:'对话记录（文本）', date:c.chatArchive.date||base, chatLog:true});
    c.chatArchive.files.forEach(function(fn){ list.push({src:'对话', label:'对话文件链接：'+fn, date:c.chatArchive.date||base, retention:'结案后 3 年'}); });
  }
  return list;
}

function attachmentsTabHtml(c){
  var files = caseAttachments(c);
  var rows = files.map(function(f){
    var tagBg = f.src==='面诊资料' ? 'var(--terracotta-bg)' : 'var(--blue-bg)';
    var tagFg = f.src==='面诊资料' ? 'var(--terracotta)' : 'var(--blue)';
    return '<div class="case-field-row"><span class="status-pill" style="background:'+tagBg+';color:'+tagFg+';font-size:10px;margin-right:8px;">'+f.src+'</span>'+
      '<span style="flex-grow:1;font-size:13px;">'+f.label+'</span>'+
      '<span class="status-pill" style="background:#EDEAE2;color:var(--muted);font-size:10px;margin-right:10px;">保存期限：'+retentionLabel(f)+'</span>'+
      '<span style="font-size:12px;color:var(--muted);margin-right:14px;">'+f.date+'</span>'+
      '<span class="fa" style="gap:12px;"><a href="#" class="info-link" onclick="return false;">下载</a><a href="#" class="info-link" onclick="'+(f.chatLog ? 'openChatArchive(\''+c.id+'\');return false;' : 'return false;')+'">查看</a></span></div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);">暂无附件</div>';
  return '<div class="card" style="padding:22px 24px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div class="info-heading">附件</div>'+
    '<span style="display:flex;gap:8px;align-items:center;"><select id="att-cat" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;"><option>基础资料</option><option>面诊资料</option></select><button class="btn-ghost" onclick="mockUploadAttachment()">+ 上传附件</button></span></div>'+rows+'</div>';
}

function consultIntentionCardHtml(c){
  return '<div class="card" style="padding:14px 24px;margin-bottom:12px;"><div class="info-heading" style="margin-bottom:8px;font-size:12px;">意向项目 / 预算（KR可见）</div>'+intentionInfoHtml(c)+'</div>';
}

function caseTimelineCardHtml(c){ return '<div class="card" style="padding:6px 20px;">'+((c.logEntries||[]).map(logLine).join('') || '<div style="font-size:12px;color:var(--muted);padding:12px 0;">暂无记录</div>')+'</div>'; }
function caseTabContentHtml(c){
  if(c.activeCaseTab==='consult' && c.consultRequested) return consultIntentionCardHtml(c)+consultTabHtml(c);
  normalizeCaseTab(c);
  if(c.activeCaseTab==='kr' && showKrTab(c)) return krTabContent(c);
  if(c.activeCaseTab==='localmgmt' && localCarried(c) && c.localMgmt) return localMgmtTabHtml(c); /* 继续选购 / 使用后进入本地管理流程 */
  if(c.activeCaseTab==='localmgmt' && localCarried(c) && localMainDone(c)) return localCarriedDoneHtml(c); /* 本地项目都做完：列做过的项目 + 继续选购 / 使用（CMD-1013-14 一·2） */
  if(c.activeCaseTab==='localmgmt' && (isLocalCase(c) || localCarried(c))) return projectListTabHtml(c, true); /* 本地案件：选择项目→本地管理的完整流程（07） */
  if(c.activeCaseTab==='localmgmt' && c.localMgmt) return localMgmtTabHtml(c);
  if(c.activeCaseTab==='localmgmt' && showLocalTab(c)) return localBoughtHtml(c);
  if(c.activeCaseTab==='settle' && showSettleTab(c)) return settleTabHtml(c);
  if(c.activeCaseTab==='related' && showRelatedTab(c)) return relatedTabHtml(c);
  if(c.activeCaseTab==='attachments' && c.materialsConfirmed) return attachmentsTabHtml(c);
  if(c.activeCaseTab==='timeline' && c.materialsConfirmed) return caseTimelineCardHtml(c);
  return basicTabHtml(c);
}


/* 基础资料 tab：确认过的资料只读展示，各行带 查看/再上传 或 查看/修正 */
/* 基础资料确认后，메타뷰 / 照片 / 视频 仍在基础资料 tab 显示（附件里也看得到），每一栏保留［补充上传］：只能新增，不能删除原文件；
   补传的文件同时进附件（分类"基础资料"），Timeline 记录谁、什么时候补了什么（2026-10-05） */
var SUPP_LABEL = {metaview:'메타뷰 检测报告', photo:'照片', video:'视频'};

function suppRowHtml(c, kind, label, has){
  var extra = (c.suppUploads && c.suppUploads[kind]) || [];
  return '<div class="case-field-row"><span class="fk">'+label+'</span><span style="flex-grow:1;font-size:13px;">'+(has ? '<span style="color:var(--sage);font-weight:700;">✓ 已有</span>' : '<span style="color:var(--muted);">暂无</span>')+
    (extra.length ? '　<span style="font-size:11px;color:var(--slate2);">补充 '+extra.length+' 个：'+extra.map(function(f){ return f.name; }).join('、')+'</span>' : '')+
    '</span><span class="fa"><a href="#" class="info-link" onclick="return false;">查看</a><a href="#" class="info-link" onclick="supplementUpload(\''+kind+'\');return false;">补充上传</a></span></div>';
}

function supplementUpload(kind){
  var c = getCurrentCase(); if(!c) return;
  c.suppUploads = c.suppUploads || {metaview:[], photo:[], video:[]};
  var n = c.suppUploads[kind].length + 1, ext = {metaview:'pdf', photo:'jpg', video:'mp4'}[kind];
  var name = '补充'+SUPP_LABEL[kind].replace('检测报告','')+' '+n+'.'+ext;
  c.suppUploads[kind].push({name:name, by:actingName(), at:nowFullDt()}); /* 只能新增，不能删除原文件 */
  c.manualAttachments = c.manualAttachments || [];
  c.manualAttachments.push({label:name, src:'基础资料', date:attDate()}); /* 同时进附件（分类"基础资料"） */
  logCaseEvent(c, actingName(), '补充上传'+SUPP_LABEL[kind]+'：'+name);
  buildCaseLog(c); renderCaseBody(c);
}

function basicTabHtml(c){
  var metaviewText = c.metaviewStatus==='ready' ? '已检测到' : '待检测';
  var consultLabel = c.reuseReport ? '沿用之前诊疗方案（'+c.reuseReport.caseNo+'）' : (c.needsConsult===true ? '面诊' : '不需要面诊');
  return '<div class="card" style="padding:4px 24px;">'+
    suppRowHtml(c,'metaview','메타뷰 检测',c.metaviewStatus==='ready')+suppRowHtml(c,'photo','照片',c.photoUploaded)+suppRowHtml(c,'video','视频',c.videoUploaded)+
    '<div class="case-field-row"><span class="fk">苦恼</span><span style="flex-grow:1;font-size:13px;">'+(c.concern||'—')+'</span><span class="fa"><a href="#" class="info-link">查看</a><a href="#" class="info-link" onclick="editConcernField(\'concern\');return false;">修正</a></span></div>'+
    '<div class="case-field-row"><span class="fk">期望</span><span style="flex-grow:1;font-size:13px;">'+(c.expectation||'—')+'</span><span class="fa"><a href="#" class="info-link">查看</a><a href="#" class="info-link" onclick="editConcernField(\'expectation\');return false;">修正</a></span></div>'+
    intentionInfoHtml(c)+
    '<div class="case-field-row" style="border-top:1px solid var(--border2);border-bottom:none;"><span class="fk">面诊</span><span style="flex-grow:1;font-size:13px;">'+consultLabel+(c.consultRequested?'（已申请）':'')+'</span></div>'+
    '</div>';
}

/* 案件头部"增加面诊"按钮：只在"选了不面诊"且还没面诊过的案件上出现，付款前、付款后都显示（2026-10-05）；一个案件只面诊一次。
   点击 → 面诊费在面诊资料tab缴纳或免除，主状态进入面诊预约（已买的本地项目照常使用），案件对 KR 可见 */
function addConsult(){
  var c = getCurrentCase(); if(!c) return;
  c.visibleToKR = true; /* 点了增加面诊，案件对韩国侧从此可见 */
  if(c.settlementDone || c.mgmtActive) c.addedConsultAfterLocal = true; /* 付款后增加面诊：已买的本地项目照常使用 */
  c.needsConsult = true;
  c.consultRequested = true;
  c.consultStatus = 'awaiting_payment';
  c.addConsultMode = true; /* 面诊 tab 用和基础资料选面诊同一套顺序：意向项目 / 预算 → 院长 → 面诊费 → 确认（CMD-1013-13 二·1） */
  recordConsultFee(c); /* 选面诊：把当下的面诊费记进案件 */
  c.activeCaseTab = 'consult';
  var hl0 = hospitalLockInfo(c); if(hl0) c.hospitalId = hl0.hospitalId; else if(!c.hospitalId) c.hospitalId = caseHospitalId(c);
  var lk0 = directorLockInfo(c); if(lk0) c.director = lk0.name; /* 关联复诊/延续既往面诊：锁定原医院和院长；否则缴费前在面诊费卡里选医院和院长 */
  updateCaseStage(c);
  logCaseEvent(c, actingName(), '发起"增加面诊"（面诊费在面诊资料tab缴纳或免除）');
  renderCaseStatusBar(c);
  buildCaseLog(c);
  renderCaseBody(c);
}


/* 面诊资料 tab：按 consultStatus 分支渲染 */
/* ---- 面诊资料 tab（总览第3、4节，2026-09-30）：一个案件只面诊一次，一张面诊费卡（待缴费/已缴费/已免除/已取消）+ 小状态行 ---- */
var CONSULT_FEE_COLORS = {'待缴费':['#FBF0C9','#8F6F0C'], '已缴费':['var(--sage-bg)','var(--sage)'], '已免除':['var(--blue-bg)','var(--blue)'], '已取消':['#EDEAE2','var(--muted)']};

function consultFeeStatusMain(c){
  if(c.consultStatus==='awaiting_payment') return '待缴费';
  if(c.consultStatus==='cancelled') return '已取消';
  return c.consultFeeWaived ? '已免除' : '已缴费';
}

function consultFeeCardHtml(status, extraText, actionsHtml, c){
  var col = CONSULT_FEE_COLORS[status];
  return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border2);">'+
    '<span style="font-size:13px;font-weight:700;">面诊费</span><span style="font-size:12px;color:var(--slate2);">'+fmtRp(c ? consultFeeOf(c) : CLINIC_SETTINGS.consultFee)+'</span><span class="status-pill" style="background:'+col[0]+';color:'+col[1]+';">'+status+'</span>'+
    (extraText ? '<span style="font-size:11px;color:var(--muted);">'+extraText+'</span>' : '')+
    (actionsHtml ? '<span style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;">'+actionsHtml+'</span>' : '')+'</div>';
}

/* 等待报告的小状态（2026-10-02 面诊改版）：KR确认预计出报告时间后 ✓"预计 X 出报告"+倒计时（Success）；
   超过预计时间还没出报告 → 橘色"已超过预计时间"（Warning），只提醒，状态不变 */
function reportEtaParse(str){ if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(str||'')) return null; var d = new Date(str.replace(' ','T')+':00Z'); return isNaN(d.getTime()) ? null : d; } /* 预计出报告时间存 UTC */

function nowDateObj(){ return realNow(); } /* 真实时刻（和 UTC 存的时间点比较用） */

function reportOverdueNow(c){
  var e = reportEtaParse(c.reportEta);
  return !!c.reportOverdue || (!!e && e < nowDateObj());
}

/* 催办（CMD-1012-01）：案件在「待 KR 确认时间」且缴费 / 免除后已超过 URGE_CONFIRM_MIN 分钟（规则没定超时标准，先用 30 分钟），
   或「等待报告」且已超过预计出报告时间 → IN 案件页显示［催办］；在韩中 / 在韩后续不显示 */
var URGE_CONFIRM_MIN = 30;
function consultPaidAtOf(c){
  if(c.consultPaidAt) return c.consultPaidAt;
  var L = (c.logEntries||[]).slice().reverse().find(function(l){ return /完成面诊费支付|免除面诊费/.test(l.action||''); });
  return L ? L.dt : '';
}
function urgeInfo(c){
  if(newTodoOn() && c && !isEnded(c)){ /* CMD-1013-17：等报告超过预计出报告时间才能催；待确认施术时间超过 1 个工作日才能催（取代 30 分钟的演示值） */
    if(c.consultRequested && !c.reportReady && c.consultStatus==='awaiting_report' && reportOverdueNow(c)) return {label:'已超过预计出报告时间', why:'等待报告已超过预计时间'};
    if(c.stage==='travel' && scheduleState(c)==='Pending' && todoWorkdaysSince(todoScheduleSubmittedAt(c)) >= 1) return {label:'待确认施术时间已超过 1 个工作日', why:'待 KR 确认施术时间'};
    return null;
  }
  if(!c || isEnded(c) || !c.consultRequested || c.reportReady) return null;
  if(c.consultStatus==='paid_waiting_kr'){
    var t = utcStrParse(consultPaidAtOf(c));
    if(t && (nowDateObj() - t) >= URGE_CONFIRM_MIN*60000) return {label:'待 KR 确认时间已超过 '+URGE_CONFIRM_MIN+' 分钟', why:'待 KR 确认面诊时间'};
  }
  if(c.consultStatus==='awaiting_report' && reportOverdueNow(c)) return {label:'已超过预计出报告时间', why:'等待报告已超过预计时间'};
  return null;
}
function urgeKr(){
  var c = getCurrentCase(); if(!c) return; var u = urgeInfo(c); if(!u){ showToast('不需要催办','这个案件现在没有超时',null); renderCaseStatusBar(c); return; }
  var hid = caseKrHospital(c); if(!hid) return;
  pushKrNotif(hid, '催办：'+actingName()+' 催促 '+c.name+'（'+c.caseNo+'）——'+u.why, {to:'coord', caseId:c.id, clinicId:c.clinicId||CURRENT_CLINIC_ID, kind:'urge'});
  c.urgedAt = nowFullDt();
  logCaseEvent(c, actingName(), '催办 KR 室长：'+u.why);
  Store.touch(); buildCaseLog(c); renderCaseStatusBar(c);
  showToast('已催办', 'KR 室长会收到提醒（toast + 通知中心），Timeline 已记录', null);
}
function reportRemainingText(c){
  var e = reportEtaParse(c.reportEta); if(!e) return '';
  var mins = Math.max(0, Math.round((e - nowDateObj())/60000));
  var days = Math.floor(mins/1440), hrs = Math.floor((mins%1440)/60), m = mins%60;
  return '剩余 '+(days ? days+'天'+hrs+'小时' : (hrs ? hrs+'小时'+m+'分钟' : m+'分钟'));
}

function reportWaitSubItems(c){
  if(reportOverdueNow(c)) return [{kind:'Warning', text:'已超过预计时间（预计 '+(fmtUtc(c.reportEta)||'—')+' 出报告，报告还没提交）'}];
  return [{kind:'Success', text:'预计 '+(fmtUtc(c.reportEta)||'—')+' 出报告（'+reportRemainingText(c)+'）'}];
}

function consultSubItems(c){
  var items = [];
  if(c.consultStatus==='awaiting_payment') items.push({kind:'Waiting', text:'待缴费'});
  else if(c.consultStatus==='paid_waiting_kr') items.push({kind:'Waiting', text:'待确认报告时间'});
  else if(c.consultStatus==='awaiting_report'){ if(c.consultStartedAt && !c.consultContentAt) items.push({kind:'Waiting', text:'面诊中'}); items = items.concat(reportWaitSubItems(c)); }
  else if(c.consultStatus==='report_ready') items.push({kind:'Success', text:'诊疗方案已到'});
  return items;
}

/* 面诊费表单（2026-10-01）：待缴费时可选"已缴费 / 免除面诊费"；关联原因是复诊/术后管理/延续既往面诊时默认预选"免除面诊费"+对应原因，室长可改，原因仍必填 */
var WAIVE_REASON_BY_LINK = {'复诊':'复诊', '延续既往面诊':'延续既往面诊'};
 /* 2026-10-01 修正：术后管理不预选免除（术后管理不面诊，不会出现面诊费卡片）；下拉里其他选项保持不变 */
var WAIVE_REASONS = ['复诊','延续既往面诊','其他'];
 /* 2026-10-02 面诊改版：去掉一项原因（一个案件只面诊一次）；术后管理不面诊，不在免除原因里 */
function feeDraft(c){
  if(!c.feeDraft){
    var l = c.linkedCase, ci = continuationInfo(c);
    if(ci && ci.overdue) c.feeDraft = {mode:'paid', reason:'', note:'', preset:null, locked:true, hint:'距原案件报告日期已超过1个月：只能面诊并付费，不能免除'};
    else if(ci && ci.newHistory) c.feeDraft = {mode:'paid', reason:'', note:'', preset:null, hint:'有新增医美史，建议面诊并付费（默认付费，室长可以改成免除）'};
    else c.feeDraft = (l && l.caseId && WAIVE_REASON_BY_LINK[l.reason])
      ? {mode:'waive', reason:WAIVE_REASON_BY_LINK[l.reason], note:'', preset:l.reason}
      : {mode:'paid', reason:'', note:'', preset:null}; /* 术后管理不预选免除；没有关联也不预选 */
  }
  return c.feeDraft;
}

function setConsultDirector(v){ var c = getCurrentCase(); if(!c) return; c.director = v || null; renderCaseBody(c); }

function consultDirectorPickHtml(c){
  if(c.director && c.hospitalId) return '';
  return '<div style="margin-bottom:12px;padding:10px 12px;background:var(--terracotta-bg);border-radius:10px;font-size:13px;">院长 <span style="color:var(--terracotta);">*</span> <span style="font-size:11px;color:var(--muted);">缴费前必选（点卡片选择），选定后不能更换</span>'+directorCardsHtml(c)+'</div>';
}

function consultFeeFormHtml(c, noDirPick){
  var d = feeDraft(c);
  var reasons = WAIVE_REASONS;
  var waiveBlock = d.mode==='waive'
    ? '<div style="margin:8px 0 4px 24px;"><select onchange="setFeeReason(this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"><option value="">选择免除原因 *</option>'+
      reasons.map(function(r){ return '<option'+(d.reason===r?' selected':'')+'>'+r+'</option>'; }).join('')+'</select>'+
      (d.reason==='其他' ? ' <input type="text" placeholder="请注明" value="'+(d.note||'').replace(/"/g,'&quot;')+'" oninput="setFeeNote(this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;">' : '')+
      (d.preset ? '<div style="font-size:11px;color:var(--muted);margin-top:4px;">已按关联原因"'+d.preset+'"预选，可修改；原因必填</div>' : '')+'</div>'
    : '';
  var waiveRadio = d.locked
    ? '<div style="font-size:12px;color:#C1454A;padding:4px 0;">'+d.hint+'</div>'
    : '<label style="display:flex;align-items:center;gap:8px;font-size:13px;padding:4px 0;"><input type="radio" name="fee-mode" '+(d.mode==='waive'?'checked':'')+' onchange="setFeeMode(\'waive\')"> 免除面诊费</label>'+waiveBlock;
  return (noDirPick ? '' : consultDirectorPickHtml(c))+'<div style="margin-bottom:12px;">'+
    '<label style="display:flex;align-items:center;gap:8px;font-size:13px;padding:4px 0;"><input type="radio" name="fee-mode" '+(d.mode==='paid'?'checked':'')+' onchange="setFeeMode(\'paid\')"> 已缴费</label>'+waiveRadio+
    ((!d.locked && d.hint) ? '<div style="font-size:11px;color:var(--terracotta);margin:2px 0 4px 24px;">'+d.hint+'</div>' : '')+
    '<div style="display:flex;gap:10px;margin-top:10px;"><button class="btn-primary" onclick="confirmConsultFee()">确认</button><button class="btn-outline" onclick="cancelConsult()">面诊取消</button></div></div>';
}

function setFeeMode(m){ var c=getCurrentCase(); if(!c) return; var d=feeDraft(c); d.mode=m; renderCaseBody(c); }

function setFeeReason(v){ var c=getCurrentCase(); if(!c) return; var d=feeDraft(c); d.reason=v; renderCaseBody(c); }

function setFeeNote(v){ var c=getCurrentCase(); if(!c) return; feeDraft(c).note=v; }

function reuseReportHtml(c){
  var r = c.reuseReport;
  return '<div class="card" style="padding:22px 24px;">'+
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;"><span class="status-pill" style="background:var(--blue-bg);color:var(--blue);">沿用自 '+r.caseNo+'</span><span style="font-size:11px;color:var(--muted);">只读 · 原诊疗方案日期 '+r.date+(c.reuseAfterConsult ? ' · 面诊后院长判断无变动' : ' · 没有面诊费')+'</span></div>'+(c.reuseAfterConsult ? consultFeeCardHtml(consultFeeStatusMain(c), c.consultFeeWaived ? '原因：'+c.consultFeeWaived.reason : '', '') : '')+
    subStatusRowHtml([{kind:'Success', text:'沿用原诊疗方案'}])+
    '<div style="font-size:13px;color:var(--slate2);margin-bottom:14px;line-height:1.7;">'+(c.videoSummary||'（旧诊疗方案没有摘要）')+'</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="btn-primary" onclick="openReportModal()">查看诊疗方案 →</button>'+
    '<button class="btn-outline" onclick="openCaseDetail(\''+r.fromId+'\')">查看原案件 →</button></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-top:12px;">原案件保持终态不变；报告文件已带入「附件」tab</div></div>';
}

function consultTabHtml(c){
  if(c.reuseReport) return reuseReportHtml(c);
  var fee = consultFeeStatusMain(c);
  var waiverText = c.consultFeeWaived ? '原因：'+c.consultFeeWaived.reason : '';
  var sub = subStatusRowHtml(consultSubItems(c));
  var wrap = function(body){ return '<div class="card" style="padding:22px 24px;">'+body+'</div>'; };
  if(c.consultStatus==='awaiting_payment'){
    if(c.addConsultMode){ /* 本地案件［增加面诊］：同基础资料选面诊的顺序和组件 */
      return wrap(consultFeeCardHtml(fee, '', '', c)+'<div style="margin-bottom:6px;font-size:12px;color:var(--muted);">增加面诊：先填意向项目 / 预算，选院长，再缴费或免除面诊费，最后点确认</div>'+
        intentRowHtml(c)+budgetRowHtml(c)+directorRowHtml(c)+'<div style="height:10px;"></div>'+consultFeeFormHtml(c, true)+sub);
    }
    return wrap(consultFeeCardHtml(fee, '', '', c)+consultFeeFormHtml(c)+sub);
  }
  if(c.consultStatus==='cancelled'){
    /* 2026-10-02：面诊取消（只在待缴费时）→ 面诊费已取消 → 主状态"选择项目"，本地管理tab已自动打开；这里只留记录 */
    return wrap(consultFeeCardHtml(fee, '只作记录，不影响后续；面诊费由当地自行处理', '', c)+
      '<div style="font-size:13px;color:var(--slate2);">面诊已取消，案件已进入"选择项目"，请在「本地管理」tab 继续。</div>');
  }
  var feeCard = consultFeeCardHtml(fee, waiverText, '', c);
  if(c.consultStatus==='paid_waiting_kr'){
    return wrap(feeCard+sub+
      '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;">等待韩国室长确认预计出报告时间（院长看资料后口述，由 KR 室长整理并发送诊疗方案；院长不参与视频）</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+
      '<button class="btn-outline" onclick="openFloatingChat(\'main\')">查看 Main 对话 →</button>'+
      '</div>');
  }
  if(c.consultStatus==='awaiting_report'){
    var judging = isContinuationConsult(c);
    var tip = judging
      ? '延续既往面诊：等 KR 判断相对原诊疗方案有无变动（无变动→沿用原诊疗方案→项目确认中；有变动→由KR室长提交新诊疗方案）'
      : '等待 KR 室长整理并发送诊疗方案';
    var btns = '<button class="btn-outline" style="opacity:.5;cursor:not-allowed;" disabled>查看诊疗方案 →</button>'+
      '<button class="btn-ghost" onclick="simulateReportTimeout()">演示：模拟时间超过预计</button>'; /* 保留：这是演示时钟，不是 KR 的操作 */
    return wrap(feeCard+sub+
      '<div style="font-size:13px;color:var(--slate2);margin-bottom:14px;">'+tip+(c.contJudged ? '（院长已判断：有变动）' : '')+'</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+btns+'</div>');
  }
  if(c.consultStatus==='report_ready'){
    return wrap(feeCard+sub+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="btn-primary" onclick="openReportModal()">查看诊疗方案 →</button><button class="btn-outline" onclick="consultTalkShortcut()">邀请室长商谈</button></div>'+
      '<div style="font-size:11px;color:var(--muted);margin-top:12px;">面诊阶段产生的文件统一在「附件」tab 查看</div>');
  }
  return '';
}

/* ---- 已选择/结算区（2026-09-29 重写，"项目列表/赴韩施术/本地管理重构"指令）：
   一张大卡包两张二级卡（赴韩/本地），互不相加；三个备注栏 noteKR/noteIN/noteOverall 贯穿
   选择态和已结算态，随时可编辑；金额一律用固定币种 formatCurrency，不走汇率切换（顺带修掉
   之前"本地项目显示≈¥"那个bug——旧代码在这里调用会跟着 CASE_DISPLAY_CCY 切换走） ---- */
function noteFieldHtml(label, field, value){
  return '<div style="margin-top:10px;">'+
    '<div style="font-size:11px;color:var(--muted);margin-bottom:4px;">'+label+'</div>'+
    '<textarea rows="2" placeholder="选填，记录客人的特殊需求…" oninput="saveCaseNote(\''+field+'\',this.value)" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;resize:vertical;">'+(value||'')+'</textarea>'+
    '</div>';
}

function saveCaseNote(field, val){
  var c = getCurrentCase(); if(!c) return;
  c[field] = val;
}

function clientHeldRemaining(name, itemName){
  var h = getClientHoldings(name).filter(function(x){ return x.itemName===itemName; })[0];
  return h ? holdingRemaining(h) : 0;
}

/* 编辑中的本地项目行：改个数/折扣/备注（2026-09-29 第十轮新增），只在 removable=true（还没结算）时可编辑 */
function setInItemField(projectId, field, val){ setLocalItemField('main', projectId, field, val); } /* 旧入口，转到新的购物车函数 */

/* ================= 本地选购（2026-10-08，CMD-1008-09；Notion IN-CASE-02 第 3 节「本地选购画面」） =================
   两条路径分开（同一个项目库）：本地选购（本地管理 tab：不面诊案件的选择项目 + 面诊 / 赴韩案件的「+添加本地管理」）= 这里；赴韩方案（项目列表 tab）仍是 projectPickerHtml。
   购物车（cart）条目 = 案件里的"已选择"：
     scope 'main' → c.recommended（走主结算单 generateSettlementBatch → confirmSettlementPayment）；
     scope 'lm'   → c.localMgmt.cart（走 lmSettle，直接转客户持有）。
   条目：{kind:'project'|'package'|'service', key, projectId(=key，兼容旧代码), name, price(原价单价；套餐 = 内含项目原价合计), unitPrice(成交单价：活动价 / 套餐价 / 原价；服务 = 0),
         qty, discountPct(实付比例，100 = 不打折；界面留空 = 不打折，填 80 = 八折), itemNote, promoId / promoTo(带入活动价时), pkgItems(套餐内含快照), origin:'IN'}
   快照存成交价：之后改项目库 / 活动价 / 套餐不影响已选进案件的条目和已发放的持有批次 */
function cartOf(c, scope){
  if(scope==='lm'){ c.localMgmt.cart = c.localMgmt.cart || []; return c.localMgmt.cart; }
  c.recommended = c.recommended || []; return c.recommended;
}
function cartKey(it){ return it.key || it.projectId; }
function buildLocalItem(p, specId){
  var sp = specById(p, specId) || defaultSpec(p), u = localUnitPrice(p, sp ? sp.id : null);
  return {kind:'project', key:p.id, projectId:p.id, name:p.name, specId:sp ? sp.id : '', specLabel:sp ? sp.label : '', specTimes:sp ? sp.times : 1, neg:!!p.neg, price:u.orig, unitPrice:u.price, promoId:u.promo ? u.promo.id : null, promoTo:u.promo ? u.promo.to : '', currency:'IDR', origin:'IN', categoryId:p.categoryId, qty:1, discountPct:100, itemNote:''};
}
function buildPackageItem(pk){
  var its = (pk.items||[]).map(function(x){ var pr = projById(x.projectId) || {}, sp = pkgItemSpec(x); return {projectId:x.projectId, specId:sp ? sp.id : '', specLabel:sp ? sp.label : '', specTimes:sp ? sp.times : 1, name:pr.name || '（已删除的项目）', qty:x.qty||1, price:(sp ? sp.price : pr.price)||0, categoryId:pr.categoryId}; });
  return {kind:'package', key:'pk:'+pk.id, projectId:'pk:'+pk.id, pkgId:pk.id, name:pk.name, price:packageListTotal(pk), unitPrice:pk.price, pkgItems:its, currency:'IDR', origin:'IN', categoryId:null, qty:1, discountPct:100, itemNote:''};
}
function buildServiceItem(p, qty){
  var ssp = specPickOf({}, p);
  return {kind:'service', key:'sv:'+p.id, projectId:'sv:'+p.id, srcProjectId:p.id, name:p.name, specId:ssp ? ssp.id : '', specLabel:ssp ? ssp.label : '', specTimes:ssp ? ssp.times : 1, price:(ssp ? ssp.price : p.price), unitPrice:0, currency:'IDR', origin:'IN', categoryId:p.categoryId, qty:qty||1, discountPct:100, itemNote:''};
}
function inLineTotal(it){
  var qty = it.qty||1, pct = (it.discountPct===undefined||it.discountPct===null) ? 100 : it.discountPct;
  var unit = (it.unitPrice===undefined||it.unitPrice===null) ? it.price : it.unitPrice;
  return Math.round(unit*qty*pct/100);
}
/* 已选择里的合计：paidCount = 付费项目（项目 / 套餐）的条数；只有服务没有付费项目时不能结算 */
function cartTotals(items){
  var paid = items.filter(function(it){ return it.origin==='IN' ? it.kind!=='service' : true; });
  return {paidCount:paid.length, total:items.filter(function(it){ return it.origin==='IN'; }).reduce(function(s,it){ return s+inLineTotal(it); }, 0), onlyService:items.length>0 && !paid.length, missingPrice:items.filter(function(it){ return it.origin==='IN' && it.neg && !(it.unitPrice>0); }).length}; /* 面议项目没填价格：不能结算 */
}

function toggleLocalProject(scope, projectId){
  var c = getCurrentCase(); if(!c) return;
  var cart = cartOf(c, scope), idx = cart.findIndex(function(it){ return cartKey(it)===projectId; });
  if(idx>-1) cart.splice(idx, 1);
  else { var p = projById(projectId); if(!p) return; var sp0 = specPickOf(c, p); cart.push(buildLocalItem(p, sp0 ? sp0.id : null)); }
  renderCaseBody(c);
}
/* 选规格：记在案件上；已在购物车里的项目同时换成新规格（数量 / 折扣 / 备注保留） */
function setLocalSpec(scope, projectId, specId){
  var c = getCurrentCase(); if(!c) return;
  c.specPick = c.specPick || {}; c.specPick[projectId] = specId;
  var cart = cartOf(c, scope), idx = cart.findIndex(function(it){ return cartKey(it)===projectId; });
  if(idx>-1){ var old = cart[idx], p = projById(projectId); if(p){ var ni = buildLocalItem(p, specId); ni.qty = old.qty; ni.discountPct = old.discountPct; ni.itemNote = old.itemNote; cart[idx] = ni; } }
  renderCaseBody(c);
}
/* 面议项目：选了之后手动填价（成交单价） */
function setLocalManualPrice(scope, key, val){
  var c = getCurrentCase(); if(!c) return;
  var it = cartOf(c, scope).filter(function(x){ return cartKey(x)===key; })[0]; if(!it) return;
  var n = parseInt(String(val).trim(), 10); if(!(n>0)){ alert('请填大于 0 的价格（印尼盾）'); return; }
  it.price = n; it.unitPrice = n; renderCaseBody(c);
}
function toggleLocalPackage(scope, pkgId){
  var c = getCurrentCase(); if(!c) return;
  var cart = cartOf(c, scope), key = 'pk:'+pkgId, idx = cart.findIndex(function(it){ return cartKey(it)===key; });
  if(idx>-1) cart.splice(idx, 1);
  else { var pk = PACKAGES.filter(function(k){ return k.id===pkgId; })[0]; if(!pk) return; cart.push(buildPackageItem(pk)); }
  renderCaseBody(c);
}
function removeLocalItem(scope, key){
  var c = getCurrentCase(); if(!c) return;
  var cart = cartOf(c, scope), idx = cart.findIndex(function(it){ return cartKey(it)===key; });
  if(idx>-1) cart.splice(idx, 1);
  renderCaseBody(c);
}
var LOCAL_QTY_MAX = 99; /* 本地选购单项数量上限 */
function setLocalItemField(scope, key, field, val){
  var c = getCurrentCase(); if(!c) return;
  var it = cartOf(c, scope).filter(function(x){ return cartKey(x)===key; })[0]; if(!it) return;
  if(field==='qty'){
    var q = String(val).trim(), qn = parseInt(q,10);
    if(!/^\d+$/.test(q) || qn<1 || qn>LOCAL_QTY_MAX){ alert('数量请填 1～'+LOCAL_QTY_MAX+' 之间的整数'); renderCaseBody(c); return; } /* 超出范围挡下并提示（CMD-1012-01） */
    it.qty = qn;
  }
  else if(field==='discountPct'){
    var dv = String(val).trim();
    if(dv===''){ it.discountPct = 100; } /* 留空 = 不打折 */
    else { var n = parseInt(dv,10); if(!/^\d+$/.test(dv) || n<1 || n>99){ alert('折扣请填 1～99（实付比例：80 = 8折），留空 = 不打折'); renderCaseBody(c); return; } it.discountPct = n; }
  }
  else it.itemNote = val;
  renderCaseBody(c);
}
function toggleItemNote(scope, key){
  var c = getCurrentCase(); if(!c) return;
  var it = cartOf(c, scope).filter(function(x){ return cartKey(x)===key; })[0]; if(!it) return;
  c.noteOpen = c.noteOpen || {};
  var open = c.noteOpen[key]!==undefined ? c.noteOpen[key] : !!it.itemNote;
  c.noteOpen[key] = !open;
  renderCaseBody(c);
}
function setLocalNote(scope, val){
  var c = getCurrentCase(); if(!c) return;
  if(scope==='lm') c.localMgmt.noteIN = val; else c.noteIN = val;
}
function setLocalPickTab(tab){ var c = getCurrentCase(); if(!c) return; c.localPickTab = tab; renderCaseBody(c); }

/* 服务（赠送）：本地选购 / 赴韩方案里的本地项目清单下方；金额 Rp 0（小字附原价）；付款后转持有，批次标「서비스」，不显示退款，不计入收入；必须搭配至少一个付费项目才能结算 */
function openSvcAdd(scope){
  var c = getCurrentCase(); if(!c) return;
  var first = PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN' && p.active && p.categoryId!==POST_CARE_CAT_ID; })[0];
  c.svcDraft = {scope:scope, projectId:first ? first.id : '', qty:1};
  renderCaseBody(c);
}
function setSvcDraft(field, val){ var c = getCurrentCase(); if(!c || !c.svcDraft) return; c.svcDraft[field] = field==='qty' ? Math.max(1, parseInt(val,10)||1) : val; }
function cancelSvcAdd(){ var c = getCurrentCase(); if(!c) return; c.svcDraft = null; renderCaseBody(c); }
function confirmSvcAdd(){
  var c = getCurrentCase(); if(!c || !c.svcDraft) return;
  var d = c.svcDraft, p = projById(d.projectId); if(!p) return;
  var cart = cartOf(c, d.scope), key = 'sv:'+p.id, ex = cart.filter(function(it){ return cartKey(it)===key; })[0];
  if(ex) ex.qty = (ex.qty||1) + d.qty; else cart.push(buildServiceItem(p, d.qty));
  c.svcDraft = null; renderCaseBody(c);
}
function serviceBlockHtml(c, scope){
  var cart = cartOf(c, scope), svcs = cart.filter(function(it){ return it.kind==='service'; });
  var draft = (c.svcDraft && c.svcDraft.scope===scope) ? c.svcDraft : null, adder;
  if(draft){
    var opts = PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN' && p.active && p.categoryId!==POST_CARE_CAT_ID; }).map(function(p){ return '<option value="'+p.id+'"'+(p.id===draft.projectId?' selected':'')+'>'+p.name+'（'+fmtRp(p.price)+'）</option>'; }).join('');
    adder = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;"><select onchange="setSvcDraft(\'projectId\',this.value)" style="flex:1;min-width:140px;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:12px;">'+opts+'</select>'+
      qtyInputHtml({value:draft.qty, min:1, max:LOCAL_QTY_MAX, onchange:"setSvcDraft('qty',this.value)"})+'<span style="font-size:12px;">次</span>'+
      '<button class="btn-primary" style="padding:5px 12px;font-size:12px;" onclick="confirmSvcAdd()">添加</button><button class="btn-ghost" style="padding:5px 10px;font-size:12px;" onclick="cancelSvcAdd()">取消</button></div>';
  } else adder = '<button class="btn-ghost" style="margin-top:8px;padding:5px 12px;font-size:12px;" onclick="openSvcAdd(\''+scope+'\')">＋ 添加서비스</button>';
  return '<div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--border);"><div style="font-size:12px;font-weight:700;color:var(--slate2);">서비스（赠送）</div>'+
    '<div style="font-size:11px;color:var(--muted);margin:2px 0 6px;">金额 Rp 0，付款后转持有，批次标「서비스」，不可退款，不计入收入；需搭配付费项目</div>'+
    svcs.map(function(it){ return localRowHtml(c, scope, it); }).join('')+adder+'</div>';
}

/* 已选择卡片的统一一行（本地选购 / 赴韩方案共用）：行首 checkbox（取消即移除）/ 项目名 / 次数 stepper / 折扣 / 金额 / 行尾［备注］；［备注］点了才展开短输入框，已有内容时显示"备注 ✓"并默认展开 */
function localRowHtml(c, scope, it){
  var key = cartKey(it), isSvc = it.kind==='service', isPkg = it.kind==='package', qty = it.qty||1, pct = (it.discountPct===undefined||it.discountPct===null) ? 100 : it.discountPct;
  var tags = (isPkg ? ' <span class="status-pill" style="background:#FBE9E7;color:#C1454A;font-size:10px;">套餐 · 不可退款</span>' : '')+
    (isSvc ? ' <span class="status-pill" style="background:var(--blue-bg);color:var(--blue);font-size:10px;">서비스</span>' : '')+
    (it.promoId ? ' <span class="status-pill" style="background:var(--sage-bg);color:var(--sage);font-size:10px;">本月</span>' : '');
  var held = (isSvc||isPkg) ? 0 : clientHeldRemaining(c.name, it.name);
  var sub = '';
  if(!isSvc && !isPkg && (it.specTimes||1)>1) sub = '付款后持有 '+((it.specTimes||1)*(it.qty||1))+' 次';
  if(it.promoId) sub = '活动价 '+fmtRp(it.unitPrice)+'<span style="text-decoration:line-through;margin-left:6px;">原价 '+fmtRp(it.price)+'</span>'+(it.promoTo ? '　至 '+it.promoTo : '');
  else if(isPkg) sub = (it.pkgItems||[]).map(function(x){ return x.name+' ×'+x.qty; }).join('、')+'　原价合计 '+fmtRp(it.price);
  else if(isSvc) sub = '原价 '+fmtRp(it.price)+'（赠送）';
  if(held>0) sub += (sub ? '　' : '')+'<span style="color:var(--sage);">已持有 '+held+' 次</span>';
  var line = inLineTotal(it), noteOpen = c.noteOpen && c.noteOpen[key]!==undefined ? c.noteOpen[key] : !!it.itemNote;
  var k = key.replace(/'/g, '');
  return '<div class="sel-row"><div class="sel-line">'+
    '<input type="checkbox" checked title="取消勾选即移除" onchange="removeLocalItem(\''+scope+'\',\''+k+'\')">'+
    '<div class="sel-name"><div>'+itemFullName(it)+tags+'</div>'+(sub ? '<div class="sel-sub">'+sub+'</div>' : '')+(it.neg ? '<div class="sel-sub"><input type="number" min="1" placeholder="面议：填价格（Rp）" value="'+(it.unitPrice>0 ? it.unitPrice : '')+'" onchange="setLocalManualPrice(\''+scope+'\',\''+k+'\',this.value)" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;width:150px;"></div>' : '')+'</div>'+
    qtyInputHtml({value:qty, min:1, max:LOCAL_QTY_MAX, onchange:"setLocalItemField('"+scope+"','"+k+"','qty',this.value)"})+
    (isSvc ? '' : '<span class="sel-disc"><input type="number" min="1" max="100" placeholder="折扣" title="填客人实付比例，80 = 8折；留空 = 不打折" value="'+(pct<100 ? pct : '')+'" onchange="setLocalItemField(\''+scope+'\',\''+k+'\',\'discountPct\',this.value)"><i>%</i>'+(discountText(pct) ? '<b class="sel-dtxt">= '+discountText(pct)+'</b>' : '')+'</span>')+
    '<span class="sel-amt">'+formatCurrency(line,'IDR')+'</span>'+
    '<button type="button" class="sel-note-btn" onclick="toggleItemNote(\''+scope+'\',\''+k+'\')">备注'+(it.itemNote ? ' ✓' : '')+'</button></div>'+
    (noteOpen ? '<div class="sel-note"><input type="text" placeholder="备注（选填）" value="'+(it.itemNote||'').replace(/"/g,'&quot;')+'" onchange="setLocalItemField(\''+scope+'\',\''+k+'\',\'note\',this.value)"></div>' : '')+'</div>';
}

function localPriceCellHtml(p, ccy){
  var u = localUnitPrice(p);
  if(!u.promo) return '<span style="color:var(--slate2);">'+displayAmount(p.price, 'IN', ccy)+'</span>';
  return '<span style="text-align:right;"><span style="color:var(--sage);font-weight:700;">'+displayAmount(u.price, 'IN', ccy)+'</span> <span class="status-pill" style="background:var(--sage-bg);color:var(--sage);font-size:10px;">本月</span>'+
    '<div style="font-size:11px;color:var(--muted);"><span style="text-decoration:line-through;">'+displayAmount(p.price, 'IN', ccy)+'</span>　至 '+u.promo.to+'</div></span>';
}

/* 本地项目选择（CMD-1012-04）：先选类别 → 项目（一行一个）→ 规格下拉 → 价格自动出现；面议项目选了之后在右边「已选择」里手动填价 */
function localProjRowHtml(c, scope, p, ccy, forcedSpecId){
  var cart = cartOf(c, scope), inCart = cart.filter(function(it){ return cartKey(it)===p.id; })[0];
  var sp = forcedSpecId ? specById(p, forcedSpecId) : (inCart ? specById(p, inCart.specId) : null) || specPickOf(c, p);
  var held = clientHeldRemaining(c.name, p.name), u = localUnitPrice(p, sp ? sp.id : null);
  var sel = (p.specs||[]).length > 1 && !forcedSpecId ? '<select onchange="setLocalSpec(\''+scope+'\',\''+p.id+'\',this.value)" onclick="event.stopPropagation()" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;max-width:190px;">'+p.specs.map(function(x){ return '<option value="'+x.id+'"'+(sp && sp.id===x.id ? ' selected' : '')+'>'+x.label+'</option>'; }).join('')+'</select>'
    : (sp ? '<span style="font-size:12px;color:var(--slate2);">'+sp.label+'</span>' : '');
  var price = p.neg ? '<span style="color:var(--slate2);">面议</span>'
    : (u.promo ? '<span style="text-align:right;"><span style="color:var(--sage);font-weight:700;">'+displayAmount(u.price, 'IN', ccy)+'</span> <span class="status-pill" style="background:var(--sage-bg);color:var(--sage);font-size:10px;">本月</span><div style="font-size:11px;color:var(--muted);"><span style="text-decoration:line-through;">'+displayAmount(u.orig, 'IN', ccy)+'</span>　至 '+u.promo.to+'</div></span>'
      : '<span style="color:var(--slate2);">'+displayAmount(u.price, 'IN', ccy)+'</span>');
  return '<label class="loc-row" style="gap:8px;"><input type="checkbox" onchange="toggleLocalProject(\''+scope+'\',\''+p.id+'\')" '+(inCart?'checked':'')+'>'+
    '<span style="flex-grow:1;">'+p.name+(p.opt ? ' <span style="font-size:10px;color:var(--muted);">使用时选'+p.opt.label+'</span>' : '')+(held>0 ? ' <span style="font-size:11px;color:var(--sage);">已持有 '+held+' 次</span>' : '')+projCasesLinkHtml(p.id)+'</span>'+sel+'<span style="min-width:96px;text-align:right;">'+price+'</span></label>';
}
function setLocalCat(cat){ var c = getCurrentCase(); if(!c) return; c.localCatFilter = cat; renderCaseBody(c); }
function localCatalogHtml(c, scope, tab, q, ccy){
  var cart = cartOf(c, scope), has = function(key){ return cart.some(function(it){ return cartKey(it)===key; }); };
  var match = function(name){ return !q || name.toLowerCase().indexOf(q)>-1; };
  var locals = PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN' && p.active; });
  if(tab==='promo'){
    var rows = PROMOS.filter(function(pm){ return promoStatusOf(pm)==='进行中'; }).map(function(pm){ var p = projById(pm.projectId); return p && p.active && match(p.name) ? localProjRowHtml(c, scope, p, ccy, pm.specId || null) : ''; }).join('');
    return rows || '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">本月暂无活动价</div>';
  }
  if(tab==='pkg'){
    var pks = activePackages().filter(function(k){ return match(k.name+' '+packageItemsText(k)); });
    return pks.map(function(k){
      return '<label class="loc-row"><input type="checkbox" onchange="toggleLocalPackage(\''+scope+'\',\''+k.id+'\')" '+(has('pk:'+k.id)?'checked':'')+'>'+
        '<span style="flex-grow:1;">'+k.name+' <span class="status-pill" style="background:#FBE9E7;color:#C1454A;font-size:10px;">不可退款</span><div style="font-size:11px;color:var(--muted);margin-top:2px;">'+packageItemsText(k)+(k.to ? '　有效期至 '+k.to : '')+'</div></span>'+
        '<span style="text-align:right;"><b>'+displayAmount(k.price, 'IN', ccy)+'</b><div style="font-size:11px;color:var(--muted);">原价合计 '+displayAmount(packageListTotal(k), 'IN', ccy)+'</div></span></label>';
    }).join('') || '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">暂无可选套餐</div>';
  }
  /* 全部项目：类别 chips → 项目一行一个 */
  var cats = []; locals.forEach(function(p){ if(cats.indexOf(p.catLabel)<0) cats.push(p.catLabel); });
  var cur = c.localCatFilter && cats.indexOf(c.localCatFilter)>-1 ? c.localCatFilter : 'all';
  var chips = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;"><span class="chip'+(cur==='all'?' active':'')+'" onclick="setLocalCat(\'all\')">全部类别</span>'+cats.map(function(ct){ return '<span class="chip'+(cur===ct?' active':'')+'" onclick="setLocalCat(\''+ct.replace(/'/g,'')+'\')">'+ct+'</span>'; }).join('')+'</div>';
  var shown = locals.filter(function(p){ return match(p.name) && (cur==='all' || p.catLabel===cur); });
  var body = cats.filter(function(ct){ return cur==='all' || ct===cur; }).map(function(ct){
    var rows = shown.filter(function(p){ return p.catLabel===ct; }); if(!rows.length) return '';
    return '<div style="font-size:11px;font-weight:700;color:var(--terracotta);margin:10px 0 2px;">'+ct+'</div>'+rows.map(function(p){ return localProjRowHtml(c, scope, p, ccy, null); }).join('');
  }).join('');
  return chips+(body || '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">没有匹配的项目</div>');
}

/* 本地选购画面（scope 'main' = 不面诊案件的选择项目 / 追加；'lm' = 本地管理的新增项目） */
function localPurchaseHtml(c, scope, isAddition){
  var cart = cartOf(c, scope), q = (c.projectSearch || '').toLowerCase(), ccy = CASE_DISPLAY_CCY_IN;
  var tab = c.localPickTab || (PROMOS.some(function(pm){ return promoStatusOf(pm)==='进行中'; }) ? 'promo' : 'all');
  var tabs = [['promo','本月活动'],['pkg','套餐'],['all','全部项目']].map(function(t){ return '<span class="chip'+(tab===t[0]?' active':'')+'" onclick="setLocalPickTab(\''+t[0]+'\')">'+t[1]+'</span>'; }).join('');
  var left = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">'+tabs+caseCcySwitchHtml('IN')+'<a href="#" class="info-link" style="font-size:12px;" onclick="openProjectLibNewTab();return false;">在项目库查看 ↗</a></div>'+
    '<input type="text" placeholder="搜索项目…" value="'+(c.projectSearch||'').replace(/"/g,'&quot;')+'" oninput="setProjectSearch(this.value)" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-bottom:10px;box-sizing:border-box;">'+
    localCatalogHtml(c, scope, tab, q, ccy);
  var items = cart.filter(function(it){ return it.kind!=='service'; }), tot = cartTotals(cart);
  var noteVal = (scope==='lm' ? (c.localMgmt.noteIN||'') : (c.noteIN||'')).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  var canNoBuy = scope==='lm' || (!isAddition && c.entryChoicePending && c.projectEntryMode==='new' && isLocalCase(c) && !caseHasPurchase(c) && !(c.mgmtUses||[]).length && !((c.localMgmt && c.localMgmt.mgmtUses)||[]).length); /* 不面诊的本地案件、选择项目、没付款也没用过持有项目时才显示（CMD-1008-06） */
  var settleFn = scope==='lm' ? 'lmSettle()' : (isAddition ? 'confirmAddition()' : 'confirmProjectSelection()');
  var noBuyFn = scope==='lm' ? 'lmNoBuy()' : 'noPurchaseThisTime()';
  var settleOk = tot.paidCount && !tot.missingPrice, cp = compPending(c, scope), compBanner = '';
  if(cp){ canNoBuy = false; compBanner = compBannerHtml(cp, tot.total, scope); } /* 代偿：一次换完、多退少补；不换用「之后再换」 */
  else compBanner = compUseBarHtml(c, scope);
  var settleBtn = '<button class="btn-primary" style="flex:1;'+(settleOk ? '' : 'opacity:.5;cursor:not-allowed;')+'" '+(settleOk ? 'onclick="'+settleFn+'"' : 'disabled')+'>结算</button>';
  var right = '<div class="sel-card"><div style="font-size:12px;font-weight:700;color:var(--slate2);margin-bottom:8px;">已选择</div>'+
    '<textarea placeholder="备注（仅 IN，选填）" oninput="setLocalNote(\''+scope+'\',this.value)" rows="2" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;box-sizing:border-box;margin-bottom:10px;">'+noteVal+'</textarea>'+
    (items.length ? '<div style="font-size:11px;color:var(--muted);margin-bottom:4px;">折扣栏填客人实付比例：80 = 8折，85 = 8.5折，留空 = 不打折</div>'+items.map(function(it){ return localRowHtml(c, scope, it); }).join('') : '<div style="font-size:12px;color:var(--muted);padding:10px 4px;">尚未选择项目</div>')+
    serviceBlockHtml(c, scope)+
    '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:16px;padding-top:12px;border-top:1px solid var(--border);"><span style="font-size:13px;color:var(--slate2);">全款</span><span style="font-size:22px;font-weight:800;">'+formatCurrency(tot.total,'IDR')+'</span></div>'+
    (tot.onlyService ? '<div style="font-size:12px;color:#A8740A;font-weight:700;margin-top:6px;">서비스需搭配付费项目</div>' : '')+
    '<div style="display:flex;gap:10px;margin-top:14px;">'+settleBtn+(canNoBuy ? '<button class="btn-outline" style="flex:1;" onclick="'+noBuyFn+'">本次不购买</button>' : '')+'</div></div>';
  var wrapOpen = isAddition ? '<div class="project-card" style="border-top:1px dashed var(--border);padding-top:18px;margin-top:4px;">' : '<div class="card project-card'+(c.projectsExpanded?' expanded':'')+'" style="padding:22px 24px;">';
  var head = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><div class="info-heading">本地选购</div>'+
    (scope==='main' ? '<span style="cursor:pointer;font-size:12px;color:var(--slate);" onclick="toggleProjectsExpand()">'+(c.projectsExpanded?'⮡ 收起':'⮢ 展开满屏')+'</span>' : '')+
    (isAddition ? '<span style="cursor:pointer;font-size:12px;color:var(--slate);margin-left:10px;" onclick="cancelAddMore()">取消追加</span>' : '')+'</div>';
  return wrapOpen+head+(compBanner ? compBanner : '')+'<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:24px;"><div>'+left+'</div><div>'+right+'</div></div></div>';
}

/* 把已选择的本地条目发放成客户持有批次（主结算单付款 / 本地管理结算共用）：项目 = 一个批次（实付 = 活动价 / 原价 × 个数 × 折扣）；
   套餐 = 拆成各内含项目的批次（套餐价折后按各项目原价占比分摊，最后一项补尾差），批次标「套餐」；服务 = 批次标「서비스」，实付 0、原价另存，不可退款 */
function grantLocalItems(c, items, today){
  var catLabelOf = function(cid){ var cat = PROJECT_CATEGORIES[cid]; return (cat && cat.label==='术后管理') ? '术后管理' : '本地'; };
  items.forEach(function(it){
    var qty = it.qty||1, line = inLineTotal(it), pct = (it.discountPct===undefined||it.discountPct===null) ? 100 : it.discountPct, b;
    if(it.kind==='package'){
      var parts = it.pkgItems||[], listAll = parts.reduce(function(s,x){ return s + x.price*x.qty*qty; }, 0), left = line;
      parts.forEach(function(x, i){
        var xl = x.price*x.qty*qty, share = i===parts.length-1 ? left : Math.round(line*(listAll ? xl/listAll : 0)); left -= share;
        b = grantHolding(c.name, x.name, catLabelOf(x.categoryId), c.id, today, x.qty*qty*(x.specTimes||1), false, {paid:share, list:xl, pct:100, currency:'IDR'}); /* 次数类规格：N 次 × 数量 */
        if(x.specLabel) b.spec = x.specLabel;
        b.pkgPaid = true; b.pkgName = it.name; /* 购买的套餐拆出的批次：不可退款（批次标「套餐」；b.pkg 只用于 KR 套餐内含的 0 元术后管理） */
      });
    } else if(it.kind==='service'){
      b = grantHolding(c.name, it.name, catLabelOf(it.categoryId), c.id, today, qty*(it.specTimes||1), false, {paid:0, list:it.price*qty, pct:100, currency:'IDR'});
      if(it.specLabel) b.spec = it.specLabel;
      b.service = true; /* 서비스（赠送）：不可退款，不计入收入 */
    } else {
      b = grantHolding(c.name, it.name, catLabelOf(it.categoryId), c.id, today, qty*(it.specTimes||1), false, {paid:line, list:it.price*qty, pct:pct, currency:'IDR'}); /* 规格「N次」→ 付款后持有 N 次（× 数量） */
      if(it.specLabel){ b.spec = it.specLabel; b.units = qty; }
      if(it.promoId) b.promo = true;
    }
  });
}

/* ---- 结算单（Settlement，总览第5节）：待付款 / 已付款 / 部分退款 / 全额退款；多张按时间排序，新的在上面，全部显示 ---- */
function batchStatusLabel(c, b){
  if(b.status==='unpaid') return '待付款';
  if(b.addOn) return '韩国付款'; /* 回诊时 KR 加做的项目：另开新结算单，在韩国付款 */
  var krs = krAllItems(c).filter(function(it){ return it.batchId===b.id; });
  var cancelled = krs.filter(function(it){ return it.cancelled; });
  if(cancelled.length && cancelled.length===krs.length && !(b.inTotal>0)) return '全额退款';
  if(cancelled.length) return '部分退款';
  if(b.noDeposit) return '计入尾款'; /* 到医院后更换项目的新结算单：不收定金，金额计入尾款（2026-10-05，不再显示"已付款"） */
  return '已付款';
}

function setSettleTab(i){ var c = getCurrentCase(); if(!c) return; c.settleTab = i; renderCaseBody(c); }

function unpaidBatchesHtml(c){
  var bs = (c.settlementBatches||[]).filter(function(b){ return b.status==='unpaid'; });
  if(!bs.length) return '';
  return '<div style="margin-top:14px;display:flex;flex-direction:column;gap:8px;">'+bs.map(function(b){
    var parts = [];
    if(b.krDeposit) parts.push('赴韩定金 '+formatCurrency(b.krDeposit,'KRW'));
    if(b.inTotal) parts.push('本地全款 '+formatCurrency(b.inTotal,'IDR'));
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">批次 '+b.id+' 待付款（'+parts.join('、')+'）</span><button class="btn-primary" onclick="settleProjects(\''+b.id+'\')">确认付款</button></div>';
  }).join('')+'</div>';
}

/* ---- 项目列表 tab ---- */
function projectListTabHtml(c, inLocalTab){
  /* CMD-1012-01：终态案件（已结案 / 仅出报告 / 已取消）不能再编辑——只看结算单，没有［+ 追加项目］［添加서비스］［客人不做项目］等入口；持有项目退款在客户详情，不受影响 */
  if(isEnded(c)){
    return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:14px;">已选择项目</div>'+
      '<div style="font-size:12px;color:var(--muted);margin-bottom:12px;">案件已结束（'+terminalBadge(c)[2]+'），不能再选择或追加项目；客人再来请新建预约。结算单在「结算」tab。</div>'+
      (c.noteOverall ? '<div style="font-size:12px;color:var(--slate2);margin-bottom:10px;">整体备注：'+String(c.noteOverall).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</div>' : '')+'</div>';
  }
  /* 面诊案件只买本地项目后，本地流程（是否使用/本地管理）在"本地管理"tab里进行，这里只看结算单 */
  if(!inLocalTab && isLocalCase(c) && c.reportReady){
    return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:14px;">没有赴韩项目</div>'+
      '<div style="font-size:12px;color:var(--muted);">本案件只买了本地项目，已转客户持有；使用/本地管理请到「本地管理」tab，结算单在「结算」tab。</div></div>';
  }
  /* 纯本地案件结算后必须先过一遍"持有项目使用/本次不使用"，这一步优先于"已选择/结算"只读视图；
     案件一旦结束（finishCase 会把 entryChoicePending 复位）之后再看这个tab才落回只读的结算视图 */
  if(c.localAsk) return localAskHtml(c);
  if(c.mgmtActive) return mgmtActiveHtml(c, 'main')+(c.addUse ? '<div style="margin-top:12px;">'+holdingsUseHtml(c,'main')+'</div>' : '')+(c.addingMore ? '<div style="margin-top:12px;" class="card"><div style="padding:18px 24px;">'+(inLocalTab ? localPurchaseHtml(c, 'main', true) : projectPickerHtml(c, true))+'</div></div>' : '');
  if(c.entryChoicePending && c.projectEntryMode==='holdings') return holdingsUseTabHtml(c);
  if(c.entryChoicePending && !c.projectEntryMode && !c.projectsLocked) return localEntryChoiceHtml(c);
  if(c.projectsLocked){
    /* 待付款（已结算、未确认付款）：没有［+ 追加项目］，改为［重新选择项目］回上一步（CMD-1012-02 C3） */
    var unpaidB = latestUnpaidBatch(c);
    var addPicker = c.addingMore ? projectPickerHtml(c, true) : (unpaidB ? '<button class="btn-outline" style="width:100%;margin-top:14px;" onclick="reselectProjects()">重新选择项目</button><div style="font-size:11px;color:var(--muted);margin-top:4px;">回到上一步可以加项目或取消项目；确认付款后 KR 才看得到赴韩项目</div>' : '<button class="btn-outline" style="width:100%;margin-top:14px;" onclick="addMoreProjects()">+ 追加项目</button>');
    return '<div class="card" style="padding:22px 24px;">'+
      '<div class="info-heading" style="margin-bottom:14px;">已选择 / 结算</div>'+
      subStatusRowHtml(caseSubStatusItems(c))+
      noteFieldHtml('整体备注（KR + IN 可见）','noteOverall',c.noteOverall)+
      '<div style="margin-top:12px;">'+settlementCardsHtml(c)+'</div>'+
      addPicker+
      '</div>';
  }
  if(c.entryChoicePending){
    if(c.projectEntryMode==='new') return inLocalTab ? localPurchaseHtml(c, 'main', false) : projectPickerHtml(c, false);
    return localEntryChoiceHtml(c);
  }
  return inLocalTab ? localPurchaseHtml(c, 'main', false) : projectPickerHtml(c, false);
}

/* 赴韩施术 tab（CMD-1012-11）：按阶段依序出现——① 赴韩方案选项目（含「本地项目」分页）→ 结算 / 待付款 ② 付款后：已确定的赴韩项目 + 推荐整理、施术日期、在韩项目与进程（只读，加项 / 取消项目都在这里）。
   付款后一起买的本地项目转客户持有，只出现在「本地管理」tab */
function krTabContent(c){
  if(c.localAsk) return localAskHtml(c);
  if(c.settlementDone && krAllItems(c).length>0){
    return krProcedureTabHtml(c);
  }
  return projectListTabHtml(c, false);
}

/* 本地管理 tab：赴韩案件里买的本地项目（没有进行中的本地管理流程时）只读显示「本次购买」和使用记录 */
function localBoughtHtml(c){
  var rows = localPurchasedBatches(c).map(function(x){
    var b = x.b; return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+x.h.itemName+(b.spec ? '（'+b.spec+'）' : '')+'</span><span style="font-size:12px;color:var(--slate2);">购买 '+b.bought+' 次 · 已用 '+(b.used||0)+' 次</span></div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);">暂无</div>';
  return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:12px;">本次购买的本地项目</div>'+rows+
    '<div style="font-size:11px;color:var(--muted);margin-top:10px;">本地项目已转客户持有，使用请在客户的持有项目里进行；结算单在「结算」tab。</div></div>';
}

/* 结算 tab：本案件所有结算单（赴韩 / 本地 / 加项 / 更换 / 到院调整 / 退款）按时间排，只看不操作，每张标来源并可点回对应 tab */
(function(){
  if(typeof settlementCardHtml!=='function') return;
  var b0 = settlementCardHtml;
  settlementCardHtml = function(c, b){ var h = b0.apply(this, arguments); return (b && b.compCredit) ? h+'<div style="font-size:12px;color:#8F6F0C;background:#FBF0C9;border-radius:8px;padding:8px 12px;margin-top:8px;">'+(b.compFrom ? '代偿额度（来源 '+b.compFrom+'）' : '赴韩定金转本地代偿')+'：−'+formatCurrency(b.compCredit,'IDR')+'；'+(((b.inTotal||0)<b.compCredit) ? '代偿余额退还 '+formatCurrency(b.compCredit-(b.inTotal||0),'IDR') : '本次补付 '+formatCurrency(Math.max(0,(b.inTotal||0)-b.compCredit),'IDR'))+'（买到的项目标「代偿」，不可退款）</div>' : h; };
})();
function settleTabHtml(c){
  var all = [];
  (c.settlementBatches||[]).forEach(function(b){ all.push({t:b.time||'', kind:'sb', b:b, src:((b.krTotal||0)>0 || hasKrBatch(c, b)) ? 'kr' : 'local'}); }); /* 有赴韩部分的算「赴韩施术」，纯本地的算「本地管理」 */
  if(c.localMgmt) (c.localMgmt.batches||[]).forEach(function(b){ all.push({t:b.time||'', kind:'lm', b:b, src:'local'}); });
  all.sort(function(a,b){ return String(a.t).localeCompare(String(b.t)); });
  var link = function(src){ return '<a href="#" class="info-link" style="font-size:11px;margin-left:8px;" onclick="switchCaseTab(\''+(src==='kr'?'kr':'localmgmt')+'\');return false;">'+(src==='kr'?'去赴韩施术':'去本地管理')+' →</a>'; };
  var cards = all.map(function(x){
    if(x.kind==='sb') return '<div style="margin-bottom:4px;"><span class="status-pill" style="font-size:11px;background:'+(x.src==='kr'?'var(--terracotta-bg)':'#E7F3EC')+';">来源：'+(x.src==='kr'?(x.b.addOn ? '在韩加项' : '赴韩施术'):'本地管理')+'</span>'+link(x.src)+'</div>'+settlementCardHtml(c, x.b);
    var b = x.b;
    return '<div style="margin-bottom:4px;"><span class="status-pill" style="font-size:11px;background:#E7F3EC;">来源：本地管理</span>'+link('local')+'</div>'+
      '<div style="border:1px solid var(--border2);border-radius:12px;padding:16px 18px;margin-bottom:12px;"><div style="font-size:13px;font-weight:700;margin-bottom:8px;">本地购买 <span style="font-weight:400;color:var(--muted);font-size:11px;">'+(b.time||'')+'</span></div>'+
      (b.items||[]).map(function(i){ return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+i.name+' ×'+i.qty+'</span></div>'; }).join('')+
      '<div style="font-size:12px;color:var(--slate2);margin-top:8px;">'+(b.inTotal!==undefined ? '合计 '+formatCurrency(b.inTotal,'IDR') : '')+'</div></div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);">尚无结算单</div>';
  return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:14px;">结算</div>'+settleTabTopHtml(c)+cards+'</div>';
}
function hasKrBatch(c, b){ return krAllItems(c).some(function(it){ return it.batchId===b.id; }); }
/* 顶部一行：项目合计 / 已收 / 已退 / 待收尾款（韩元、印尼盾分开写；金额沿用原汇总行的算法） */
function settleTabTopHtml(c){
  var info = krBalanceInfo(c), pd = financePaid(c), hasKr = krAllItems(c).length>0;
  var refKrw = (c.refunds||[]).filter(function(r){ return (r.currency||'KRW')==='KRW'; }).reduce(function(s,r){ return s+(r.amount||0); }, 0);
  var refIdr = (c.refunds||[]).filter(function(r){ return r.currency==='IDR'; }).reduce(function(s,r){ return s+(r.amount||0); }, 0);
  var two = function(krw, idr){ var a = []; if(krw) a.push(formatCurrency(krw,'KRW')); if(idr) a.push(formatCurrency(idr,'IDR')); return a.join(' ＋ ') || '—'; };
  var bal = !krActiveItems(c).length ? '—' : c.krBalancePaid ? '已结清' : (info.diff>=0 ? formatCurrency(info.diff,'KRW') : '应退 '+formatCurrency(-info.diff,'KRW'));
  var cell = function(k, v){ return '<div style="flex:1;min-width:120px;"><div style="font-size:11px;color:var(--muted);margin-bottom:2px;">'+k+'</div><div style="font-size:14px;font-weight:700;">'+v+'</div></div>'; };
  return '<div style="display:flex;gap:14px;flex-wrap:wrap;background:var(--border2);border-radius:10px;padding:12px 14px;margin-bottom:14px;">'+
    cell('项目合计', two(hasKr ? info.total : 0, pd.inn))+cell('已收', two(hasKr ? info.deposit + (c.krBalancePaid ? Math.max(0, info.diff) : 0) : 0, pd.inn))+cell('已退', two(refKrw, refIdr))+cell('待收尾款（医院收）', bal)+'</div>';
}

/* 无法协调、赴韩项目全退后：问客人要不要做本地管理（2026-09-30）：要→同一案件接着走本地流程（从"是否持有项目"开始），不要→按结局推算 */
function localAskHtml(c){
  if(c.localAsk==='keep'){
    return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:10px;">赴韩项目已全部取消并退款</div>'+
      '<div style="font-size:13px;color:var(--slate2);margin-bottom:12px;">案件里还有本地项目/术后管理：保留，还是全部退款？</div>'+
      '<div style="display:flex;gap:10px;"><button class="btn-primary" style="flex:1;" onclick="openLocalKeepModal(getCurrentCase())">选择保留 / 全部退款</button></div></div>';
  }
  var hasLocal = localPurchasedBatches(c).length>0;
  return '<div class="card" style="padding:22px 24px;">'+
    '<div class="info-heading" style="margin-bottom:10px;">赴韩项目已全部取消并退款</div>'+
    '<div style="font-size:13px;color:var(--slate2);margin-bottom:16px;">'+(hasLocal?'是否做本地项目？':'是否增加本地项目？')+'</div>'+
    '<div style="display:flex;gap:10px;"><button class="btn-primary" style="flex:1;" onclick="localAskAnswer(true)">是</button><button class="btn-outline" style="flex:1;" onclick="localAskAnswer(false)">否</button></div></div>';
}

/* 不面诊/面诊取消后的入口选择（2026-09-29 第十轮新增，IN-CASE-01） */
function localEntryChoiceHtml(c){
  var hasHoldings = getClientHoldings(c.name).some(function(h){ return holdingRemaining(h)>0; });
  return '<div class="card" style="padding:22px 24px;">'+
    '<div class="info-heading" style="margin-bottom:14px;">这次到店要做什么？</div>'+
    '<div style="display:flex;flex-direction:column;gap:12px;">'+
    '<button class="'+(hasHoldings?'btn-primary':'btn-outline')+'" style="width:100%;"'+(hasHoldings?'':' disabled') +' onclick="chooseProjectEntryMode(\'holdings\')">持有项目使用'+(hasHoldings?'':'（暂无持有项目）')+'</button>'+
    '<button class="btn-outline" style="width:100%;" onclick="chooseProjectEntryMode(\'new\')">新增项目</button>'+
    '</div></div>';
}

function chooseProjectEntryMode(mode){
  var c = getCurrentCase(); if(!c) return;
  c.projectEntryMode = mode;
  logCaseEvent(c, actingName(), mode==='holdings' ? '选择"持有项目使用"' : '选择"新增项目"');
  buildCaseLog(c);
  renderCaseBody(c);
}

/* 持有项目使用（2026-09-29 第十轮新增）：勾选+填次数→从最早批次扣→记Timeline→结案；也可"本次不使用"直接结案 */
/* 术后管理项目的"进行时间"（KR 在施术完成时标注，如"术后第7天"）：批次上的 schedule 字段；使用时术后管理置顶并按进行时间排序 */
function schedDay(text){ var m = (text||'').match(/(\d+)/); return m ? parseInt(m[1],10) : 9999; }

function holdingSchedule(h){
  var bs = h.batches.filter(function(b){ return !b.voided && (b.bought-b.used)>0 && b.schedule; });
  if(!bs.length) return '';
  bs.sort(function(a,b){ return schedDay(a.schedule)-schedDay(b.schedule); });
  return bs[0].schedule;
}

function clientHoldingsSorted(name){
  var list = getClientHoldings(name).filter(function(h){ return holdingRemaining(h)>0; });
  list.sort(function(a,b){
    var cat = (b.category==='术后管理')-(a.category==='术后管理'); if(cat) return cat;
    return schedDay(holdingSchedule(a))-schedDay(holdingSchedule(b));
  });
  return list;
}

function postCareBatchesOf(c){
  var out = [];
  getClientHoldings(c.name).forEach(function(h){
    if(h.category!=='术后管理') return;
    h.batches.forEach(function(b){ if(b.caseId===c.id && !b.voided) out.push({h:h, b:b}); });
  });
  return out;
}

/* ---- 本地流程组件（§3，2026-09-30）：不面诊案件 与 "+添加本地管理"tab 共用。
   scope='main' 操作案件本身（c），scope='lm' 操作同日插做的本地管理（c.localMgmt）；两者字段同名（mgmtUses/mgmtActive/mgmtDone/mgmtStatus） ---- */
function ctxOf(c, scope){ return scope==='lm' ? c.localMgmt : c; }

/* 术后管理批次的建议日期 = 原手术施术日期 + 术后第 N 天（CMD-1013-06 一）；没有施术日期 / 进行时间的旧批次返回 null */
function pcBatchSuggest(b){
  var src = CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0], m = String(b.schedule||'').match(/(\d+)/); if(!src || !m) return null;
  var base = (src.krSchedule && src.krSchedule.confirmedDate) || b.date; if(!base) return null;
  /* 多次术后管理每次各有建议日期（CMD-1013-07 四）：批次存 scheduleDays（如 ONDA ×2 = 第 10、11 天）；第 k 次按第 k 个天数判断。旧批次没有 scheduleDays：按原手术案件的印尼术后管理明细（innCare.lines 的 days），没有就从第一次的天数按每天一次补算 */
  var k = Math.min(b.used||0, Math.max(0, (b.bought||1)-1)), days = b.scheduleDays;
  if(!days || !days.length){ var hn = '', ln = ((src.innCare||{}).lines||[]).filter(function(l){ return l.days && l.days.length>1 && (l.innName===(b.itemName||l.innName)); })[0]; days = ln ? ln.days.slice() : []; }
  var dayN = days && days.length ? days[Math.min(k, days.length-1)] : parseInt(m[1],10)+k;
  var dt = new Date(String(base).slice(0,10)+'T00:00:00'); dt.setDate(dt.getDate()+dayN); m = [0, dayN];
  var ds = dt.getFullYear()+'-'+pad2(dt.getMonth()+1)+'-'+pad2(dt.getDate());
  return {src:src, day:parseInt(m[1],10), seq:(b.bought>1 ? k+1 : 0), of:b.bought, date:ds, items:krAllItems(src).filter(function(it){ return !it.cancelled && !it.swapped; }).map(function(it){ return it.name; }).join('、')};
}
function pcDaysLate(ds){ var a = String(ds).slice(0,10).split('-'), b0 = todayStr().split('-'); return Math.round((Date.UTC(+b0[0], +b0[1]-1, +b0[2]) - Date.UTC(+a[0], +a[1]-1, +a[2]))/86400000); } /* >0 = 过了建议日期 N 天 */
function pcMD(ds){ return String(ds).slice(5,7)+'/'+String(ds).slice(8,10); }
/* 已过建议日期还没做的术后管理批次（客户详情 / 本地管理列表标红，IN 工作台提醒） */
function postcareDueList(){
  var out = [];
  Object.keys(CLIENT_HOLDINGS).forEach(function(name){ (CLIENT_HOLDINGS[name]||[]).forEach(function(h){ if(h.category!=='术后管理') return;
    h.batches.forEach(function(b, bi){ if(b.voided || b.refund || b.bought-b.used<=0) return; var sg = pcBatchSuggest(b); if(!sg) return; var late = pcDaysLate(sg.date); if(late>0) out.push({name:name, h:h, b:b, bi:bi, sg:sg, late:late}); }); }); });
  return out;
}
function holdingsUseHtml(c, scope){
  var holdings = clientHoldingsSorted(c.name);
  var rows = holdings.map(function(h,i){
    var remaining = holdingRemaining(h);
    if(h.category==='术后管理'){ /* 术后管理照列但不可勾选：每批一行 +［做术后管理］走关联原案件的路径（CMD-1013-06 一） */
      return h.batches.map(function(b, bi){
        if(b.voided || b.refund || b.bought-b.used<=0) return '';
        var sg = pcBatchSuggest(b), late = sg ? pcDaysLate(sg.date) : 0;
        var info = sg ? '属于 '+sg.src.caseNo+(sg.items ? ' '+sg.items : '')+' · 建议术后第 '+sg.day+' 天（'+pcMD(sg.date)+'）'+(sg.seq ? ' · 第 '+sg.seq+' 次' : '')+(late>0 ? ' <b style="color:#C1454A;">已过建议日期 '+late+' 天</b>' : '') : '属于 '+caseNoLabel(b.caseId);
        return '<div class="case-field-row" style="align-items:center;"><span style="flex-grow:1;font-size:13px;">'+h.itemName+' <span class="status-pill" style="background:var(--terracotta-bg);color:var(--terracotta);font-size:10px;">术后管理</span> <span style="font-size:12px;color:var(--slate2);">剩余 '+(b.bought-b.used)+' 次</span><div style="font-size:12px;color:var(--slate2);margin-top:2px;">'+info+'</div></span>'+
          '<button class="btn-outline" style="white-space:nowrap;" onclick="openPostcareUse(\''+scope+'\','+i+','+bi+')">做术后管理</button></div>';
      }).join('');
    }
    var tags = (h.category==='术后管理'?' <span class="status-pill" style="background:var(--terracotta-bg);color:var(--terracotta);font-size:10px;">术后管理</span>':'')+
      (h.krCollected?' <span class="status-pill" style="background:var(--sage-bg);color:var(--sage);font-size:10px;">KR代收</span>':'');
    var pr = PROJECT_LIBRARY.filter(function(p0){ return p0.origin==='IN' && p0.name===h.itemName; })[0];
    var nb = h.batches.slice().sort(function(a,b){ return a.date<b.date?-1:1; }).filter(function(b){ return !b.voided && b.bought-b.used>0; })[0], ovals = pr && pr.opt && nb ? optValuesFor(pr, nb.spec) : []; /* 按下一个会被扣的批次的规格给选项（全身等没有选项的不用选） */
    var optSel = ovals.length ? '<select id="hold-opt-'+scope+'-'+i+'" style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;"><option value="">选择'+pr.opt.label+'</option>'+ovals.map(function(v){ return '<option>'+v+'</option>'; }).join('')+'</select>' : '';
    return '<div class="case-field-row"><input type="checkbox" id="hold-check-'+scope+'-'+i+'" style="flex-grow:0;margin-right:10px;">'+
      '<span style="flex-grow:1;font-size:13px;">'+h.itemName+tags+(holdingSchedule(h)?' <span style="font-size:11px;color:var(--terracotta);">进行时间：'+holdingSchedule(h)+'</span>':'')+'</span>'+
      '<span style="display:flex;align-items:center;gap:8px;white-space:nowrap;">'+optSel+'<span style="font-size:12px;color:var(--slate2);">剩余 '+remaining+' 次</span>'+qtyInputHtml({id:'hold-qty-'+scope+'-'+i, value:1, min:1, max:remaining})+'</span>'+
      '</div>';
  }).join('') || '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">暂无持有项目</div>';
  return '<div class="card" style="padding:22px 24px;">'+
    '<div class="info-heading" style="margin-bottom:14px;">是否使用持有项目？</div>'+
    rows+
    '<div style="display:flex;gap:10px;margin-top:16px;">'+
    (holdings.length ? '<button class="btn-primary" style="flex-grow:1;" onclick="submitHoldingsUse(\''+scope+'\')">使用项目</button>' : '')+
    '<button class="btn-outline" style="flex-grow:1;" onclick="notUseThisTime(\''+scope+'\')">本次不使用</button>'+
    '</div></div>';
}

/* ［做术后管理］：挂在原手术案件下（本案件自动关联原案件、KR 可见），不混进本案件的本地管理；客人在店里当场完成。
   提前做：原因必填，原案件 Timeline 记「比建议日期提前 N 天，原因 xx」，KR 室长收到通知（只通知不批准）；过了没做补做：记「比建议日期延后 N 天」 */
var PC_USE = null;
function openPostcareUse(scope, hi, bi){
  var c = getCurrentCase(); if(!c) return;
  var h = clientHoldingsSorted(c.name)[hi], b = h && h.batches[bi]; if(!b || b.voided || b.bought-b.used<=0) return;
  var sg = pcBatchSuggest(b), delta = sg ? -pcDaysLate(sg.date) : 0; /* delta>0 = 提前 N 天 */
  PC_USE = {scope:scope, hi:hi, bi:bi, early:delta>0};
  var ov = document.getElementById('pc-use-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'pc-use-overlay'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = '<div class="modal-box" style="width:440px;"><div style="display:flex;justify-content:space-between;margin-bottom:10px;"><b style="font-size:15px;">做术后管理</b><span style="cursor:pointer;" onclick="closePostcareUse()">✕</span></div>'+
    '<div style="font-size:13px;line-height:1.8;"><b>'+h.itemName+'</b>（剩余 '+(b.bought-b.used)+' 次，这次用 1 次）<br>'+(sg ? '属于 '+sg.src.caseNo+(sg.items ? ' '+sg.items : '')+'；建议术后第 '+sg.day+' 天（'+sg.date+'）'+(sg.seq ? ' · 第 '+sg.seq+' 次' : '')+'<br>'+(delta>0 ? '<span style="color:#C26A1B;">今天比建议日期提前 '+delta+' 天，请写原因（KR 室长会收到通知）</span>' : (delta<0 ? '<span style="color:#C1454A;">已过建议日期 '+(-delta)+' 天，补做会记「延后 '+(-delta)+' 天」</span>' : '今天正是建议日期')) : '这一批没有建议日期记录')+'</div>'+
    (delta>0 ? '<div style="font-size:12px;font-weight:700;margin:10px 0 4px;">提前原因 <span style="color:#C1454A;">*</span></div><textarea id="pc-use-reason" rows="3" placeholder="必填" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;"></textarea>' : '')+
    '<div style="display:flex;gap:10px;margin-top:14px;"><button class="btn-primary" style="flex:1;" onclick="confirmPostcareUse()">确认完成</button><button class="btn-outline" onclick="closePostcareUse()">取消</button></div></div>';
  ov.classList.add('open');
}
function closePostcareUse(){ var ov = document.getElementById('pc-use-overlay'); if(ov) ov.classList.remove('open'); }
function confirmPostcareUse(){
  var c = getCurrentCase(), ctx = PC_USE; if(!c || !ctx) return;
  var h = clientHoldingsSorted(c.name)[ctx.hi], b = h && h.batches[ctx.bi]; if(!b || b.voided || b.bought-b.used<=0) return;
  var sg = pcBatchSuggest(b), delta = sg ? -pcDaysLate(sg.date) : 0, reasonEl = document.getElementById('pc-use-reason'), reason = reasonEl ? reasonEl.value.trim() : '';
  if(delta>0 && !reason){ alert('提前做术后管理必须写原因'); return; }
  var today = todayStr(), by = actingName();
  b.used += 1; b.usages.push({caseId:c.id, date:today, qty:1, tag:ctx.scope, postcare:true, suggested:sg ? sg.date : undefined, deltaDays:sg ? delta : undefined, reason:reason||undefined, by:by});
  c.postcareUses = c.postcareUses || [];
  c.postcareUses.push({itemName:h.itemName, date:today, srcCaseId:b.caseId, suggested:sg ? sg.date : '', deltaDays:sg ? delta : 0, reason:reason, by:by, byId:currentAccountId()});
  if(!c.linkedCase && b.caseId!==c.id){ c.visibleToKR = true; c.linkedCase = {caseId:b.caseId, reason:'术后管理', auto:true}; logCaseEvent(c, '系统', '使用了 '+caseNoLabel(b.caseId)+' 的术后管理项目，自动关联该案件'); renderCaseSubtitle(c); }
  var when = sg ? (delta>0 ? '比建议日期提前 '+delta+' 天，原因：'+reason : (delta<0 ? '补做，比建议日期延后 '+(-delta)+' 天' : '按建议日期完成')) : '无建议日期记录';
  var line = '术后管理：'+h.itemName+' 1 次（建议 '+(sg ? sg.date : '—')+'，实际 '+today+'，操作人 '+by+'（'+currentAccountId()+'）；'+when+'；办理案件 '+(c.caseNo||'')+'）';
  logCaseEvent(c, by, line);
  var src = sg ? sg.src : CASE_ITEMS.filter(function(x){ return x.id===b.caseId; })[0];
  if(src && src.id!==c.id){
    logCaseEvent(src, by, line); /* 原手术案件 Timeline：KR 看得到（建议日期 / 实际日期 / 操作人 / 原因） */
    if(delta>0){ try{ pushKrNotif(caseKrHospital(src), '术后管理提前：'+src.name+'（'+(src.caseNo||'')+'）的 '+h.itemName+' 比建议日期提前 '+delta+' 天做了，原因：'+reason, {to:'coord', caseId:src.id, clinicId:src.clinicId||CURRENT_CLINIC_ID, level:'info'}); }catch(e){} }
  }
  PC_USE = null; closePostcareUse();
  updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
  if(typeof renderPcDueCard==='function') renderPcDueCard();
}
function holdingsUseTabHtml(c){ return holdingsUseHtml(c,'main'); }

/* 本次不使用：已经发生过购买 → 结案；还没购买 → 问"是否选购"（进入新增项目）。本地管理里的走法见 lmNotUse */
function notUseThisTime(scope){
  var c = getCurrentCase(); if(!c) return;
  var ctx0 = ctxOf(c, scope);
  if(ctx0 && ctx0.mgmtActive){ ctx0.addUse = false; renderCaseBody(c); return; } /* 本地管理进行中：只是不再追加使用 */
  if(scope==='lm') return lmNotUse(c);
  logCaseEvent(c, actingName(), '本次不使用任何持有项目');
  if(caseHasPurchase(c) || (c.postcareUses||[]).length){ if(mainlineOngoing(c)){ updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c); return; } autoFinish(c); return; }
  c.projectEntryMode = 'new'; /* 是否选购？ */
  buildCaseLog(c);
  renderCaseBody(c);
}

/* 本地管理面板：管理完成 / 管理取消（部分或全部，未做的次数归还持有，不是退款） */
/* ---- 本地管理项目行（LocalItem，总览第9节，2026-09-30）：进行中 / 已完成 / 已取消（次数归还，不是退款）；
   可以逐个勾选标完成或取消；「管理完成」「管理取消」保留为批量快捷键（作用于全部进行中的项目）；
   全部项目标完后这一次本地管理结束：本地案件按08规则自动判结局；面诊/赴韩案件里的"本地管理进行中"小标签消失 ---- */
var LOCAL_ITEM_COLORS = {'进行中':['#FBF0C9','#8F6F0C'], '已完成':['var(--sage-bg)','var(--sage)'], '已取消':['#EDEAE2','var(--muted)']};

function localItemStatus(u){ return u.status==='done' ? '已完成' : u.status==='cancelled' ? '已取消' : '进行中'; }

function mgmtActiveHtml(c, scope){
  var ctx = ctxOf(c, scope);
  var rows = (ctx.mgmtUses||[]).map(function(u,i){
    var st = localItemStatus(u), col = LOCAL_ITEM_COLORS[st];
    var rowBtns = st==='进行中' ? '<span style="display:flex;gap:6px;margin-left:10px;"><button class="btn-outline" style="padding:2px 10px;font-size:11px;" onclick="markMgmtRows(\''+scope+'\',\'done\',false,'+i+')">完成</button><button class="btn-outline" style="padding:2px 10px;font-size:11px;" onclick="markMgmtRows(\''+scope+'\',\'cancelled\',false,'+i+')">取消</button></span>' : '';
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;'+(st==='已取消'?'text-decoration:line-through;color:var(--muted);':'')+'">'+u.itemName+'</span>'+
      '<span style="font-size:12px;color:var(--slate2);margin-right:10px;">使用 '+u.qty+' 次</span>'+
      '<span class="status-pill" style="background:'+col[0]+';color:'+col[1]+';">'+st+'</span>'+rowBtns+'</div>';
  }).join('');
  var btns = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">'+
    '<button class="btn-primary" style="margin-left:auto;" onclick="mgmtComplete(\''+scope+'\')">全部完成</button></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-top:8px;">每一行点［完成］或［取消］；［全部完成］把所有进行中的项目一次标完成。取消的次数归还到客户持有项目，<b>不是退款</b>。</div>'+
    '<div style="border-top:1px solid var(--border2);margin-top:14px;padding-top:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;"><span style="font-size:12px;color:var(--slate2);">同一次到店里还可以：</span>'+
    '<button class="btn-ghost" onclick="setMgmtAdd(\''+scope+'\',\'use\')">继续使用持有项目</button>'+
    '<button class="btn-ghost" onclick="setMgmtAdd(\''+scope+'\',\'buy\')">继续选购项目</button></div>';
  return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:14px;">本地管理</div>'+rows+btns+'</div>';
}

function setMgmtAdd(scope, what){
  var c = getCurrentCase(); if(!c) return;
  var ctx = ctxOf(c, scope);
  if(what==='use') ctx.addUse = true;
  else if(scope==='lm') ctx.addBuy = true;
  else { c.addingMore = true; c.recommended = []; c.projectOriginFilter = 'IN'; }
  renderCaseBody(c);
}

/* 购买案件里只读显示本地项目的"已退款 X"（退款本身只能在客户详情"持有项目"卡片操作，2026-09-30） */
function localRefundNoteHtml(c){
  var rows = [];
  getClientHoldings(c.name).forEach(function(h){
    h.batches.forEach(function(b){
      if(b.caseId===c.id && b.refund) rows.push('<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+h.itemName+'（购买 '+b.bought+' 次）</span><span style="font-size:13px;font-weight:700;color:var(--terracotta);">已退款 '+formatCurrency(b.refund.amount,'IDR')+'</span></div>');
    });
  });
  if(!rows.length) return '';
  return '<div class="card" style="padding:14px 24px;margin-bottom:12px;"><div class="info-heading" style="margin-bottom:8px;font-size:12px;">本地项目退款（只读，在客户详情操作）</div>'+rows.join('')+'</div>';
}


/* ---- "+添加本地管理"（§5，2026-09-30）：面诊/赴韩案件同日插做本地项目，复用 §3 的本地流程组件（scope='lm'），
   案件主状态不变，只在状态栏加小标签"本地管理进行中"；购买和使用在案件结案时算进结局判断 ---- */
function addLocalMgmt(){
  var c = getCurrentCase(); if(!c || c.localMgmt || isEnded(c)) return;
  if(!localAddAllowed(c)){ alert('本地管理只能在到店当天添加'); return; }
  if(!c.localMgmtDay) c.localMgmtDay = todayStr();
  c.localMgmt = {active:true, ended:false, step:'entry', mgmtUses:[], mgmtActive:false, mgmtDone:false, mgmtStatus:null, mgmtCancelling:false, batches:[], pick:{}};
  c.activeCaseTab = 'localmgmt';
  logCaseEvent(c, actingName(), '添加本地管理（同日插做本地项目，案件主状态不变）');
  buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
}

function afterLmFinished(c){
  var lm = c.localMgmt; if(!lm) return;
  lm.active = false; lm.ended = true; lm.mgmtActive = false;
  logCaseEvent(c, actingName(), '本地管理结束');
  updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
}

/* ［+ 添加本地管理］后的「本次不使用 / 本次不购买」= 返回：这次添加没有任何购买 / 使用 → 本地管理 tab 消失、案件回到原样、不留记录（CMD-1013-06 二·1） */
function lmNothingYet(lm){ return !(lm.batches||[]).length && !(lm.mgmtUses||[]).length; }
function lmBackOut(c){
  var i = -1; (c.logEntries||[]).forEach(function(e, k){ if(/^添加本地管理（同日插做本地项目/.test(e.action||'')) i = k; });
  if(i>-1) c.logEntries.splice(i, 1); /* 不留记录 */
  c.localMgmt = null; c.activeCaseTab = showKrTab(c) ? 'kr' : (c.consultRequested ? 'consult' : 'basic');
  updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
}
function lmNotUse(c){
  var lm = c.localMgmt; if(!lm) return;
  if(lmNothingYet(lm) && !lm.mgmtActive){ lmBackOut(c); return; }
  logCaseEvent(c, actingName(), '本地管理：本次不使用任何持有项目');
  if(lm.batches.length){ afterLmFinished(c); return; } /* 已经购买过 → 本地管理结束 */
  lm.step = 'buy'; /* 还没购买 → 是否选购 */
  buildCaseLog(c); renderCaseBody(c);
}

function lmContinue(what){ var c = getCurrentCase(); if(!c || !c.localMgmt) return; if(!localAddAllowed(c)){ alert('本地管理只能在到店当天添加'); return; } var lm = c.localMgmt; lm.ended = false; lm.active = true; lm.mgmtActive = false; lm.step = what==='use' ? 'use' : 'buy'; logCaseEvent(c, actingName(), '本地管理：继续'+(what==='use' ? '使用持有项目' : '选购')); updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c); }
function lmSetStep(step){ var c=getCurrentCase(); if(!c||!c.localMgmt) return; c.localMgmt.step = step; renderCaseBody(c); }

function localCarriedDoneHtml(c){
  var uses = (c.mgmtUses||[]).map(function(u){ return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+u.itemName+'</span><span style="font-size:12px;color:var(--slate2);">使用 '+u.qty+' 次'+(u.cancelQty?'（取消 '+u.cancelQty+' 次，已归还持有）':'')+'</span></div>'; }).join('');
  var buys = (c.settlementBatches||[]).filter(function(b){ return (b.inItems||[]).length; }).map(function(b){ return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">购买 '+b.inItems.map(function(i){ return i.name+(i.qty>1 ? ' ×'+i.qty : ''); }).join('、')+'</span><span style="font-size:13px;font-weight:700;">'+formatCurrency(b.inTotal,'IDR')+'</span></div>'; }).join('');
  return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:12px;">本地管理（已完成的项目）</div>'+(buys+uses || '<div style="font-size:12px;color:var(--muted);">没有记录</div>')+
    (localAddAllowed(c) ? '<div style="display:flex;gap:10px;margin-top:14px;"><button class="btn-outline" onclick="carriedContinue(\'buy\')">继续选购</button><button class="btn-outline" onclick="carriedContinue(\'use\')">继续使用持有项目</button></div>' : '<div style="font-size:12px;color:var(--muted);margin-top:12px;">本地管理只能在到店当天添加，今天不能再继续选购 / 使用。</div>')+'</div>';
}
function carriedContinue(what){
  var c = getCurrentCase(); if(!c || c.localMgmt || isEnded(c)) return;
  if(!localAddAllowed(c)){ alert('本地管理只能在到店当天添加'); return; }
  c.localMgmt = {active:true, ended:false, step:what==='use' ? 'use' : 'buy', mgmtUses:[], mgmtActive:false, mgmtDone:false, mgmtStatus:null, mgmtCancelling:false, batches:[], pick:{}};
  c.activeCaseTab = 'localmgmt'; logCaseEvent(c, actingName(), '本地管理：继续'+(what==='use' ? '使用持有项目' : '选购'));
  updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
}
function localMgmtTabHtml(c){
  var lm = c.localMgmt;
  if(lm.ended){ /* 到结案前都可继续加：项目都完成后仍显示已完成列表 + 继续选购 / 使用持有的入口（CMD-1013-06 二·2）；结案后只读 */
    var uses = (lm.mgmtUses||[]).map(function(u){ return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+u.itemName+'</span><span style="font-size:12px;color:var(--slate2);">使用 '+u.qty+' 次'+(u.cancelQty?'（取消 '+u.cancelQty+' 次，已归还持有）':'')+'</span></div>'; }).join('');
    var buys = (lm.batches||[]).map(function(b){ return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">购买 '+b.items.map(function(i){ return i.name+' ×'+i.qty; }).join('、')+'</span><span style="font-size:13px;font-weight:700;">'+formatCurrency(b.inTotal,'IDR')+'</span></div>'; }).join('');
    if(localCarried(c)){ uses = (c.mgmtUses||[]).map(function(u){ return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+u.itemName+'</span><span style="font-size:12px;color:var(--slate2);">使用 '+u.qty+' 次</span></div>'; }).join('')+uses; } /* 增加面诊的本地案件：把之前做过的也列出来 */
    var open = !isEnded(c) && !c.visitClosed && localAddAllowed(c), more = open ? '<div style="display:flex;gap:10px;margin-top:14px;"><button class="btn-outline" onclick="lmContinue(\'buy\')">继续选购</button><button class="btn-outline" onclick="lmContinue(\'use\')">继续使用持有项目</button></div>' : '';
    return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:12px;">'+(open ? '本地管理（已完成的项目）' : '本地管理（本次购买与使用记录）')+'</div>'+(buys+uses || '<div style="font-size:12px;color:var(--muted);">本次本地管理没有购买也没有使用</div>')+more+'</div>';
  }
  if(lm.mgmtActive) return mgmtActiveHtml(c, 'lm')+(lm.addUse ? '<div style="margin-top:12px;">'+holdingsUseHtml(c,'lm')+'</div>' : '')+(lm.addBuy ? '<div style="margin-top:12px;">'+lmBuyHtml(c)+'</div>' : '');
  if(lm.step==='use' || lm.step==='afterBuyUse') return holdingsUseHtml(c, 'lm');
  if(lm.step==='buy') return lmBuyHtml(c);
  /* entry：是否持有项目？是→是否使用？ 否→是否选购？ */
  var hasHoldings = clientHoldingsSorted(c.name).length>0;
  if(!hasHoldings){ lm.step = 'buy'; return lmBuyHtml(c); }
  return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:14px;">本地管理：客人要做什么？</div>'+
    '<div style="display:flex;flex-direction:column;gap:12px;"><button class="btn-primary" style="width:100%;" onclick="lmSetStep(\'use\')">持有项目使用</button>'+
    '<button class="btn-outline" style="width:100%;" onclick="lmSetStep(\'buy\')">新增项目</button></div></div>';
}

/* 本地管理里的选购（2026-10-08 起和不面诊案件共用「本地选购」画面 localPurchaseHtml，购物车 = c.localMgmt.cart，结算 = lmSettle 直接转客户持有） */
function lmBuyHtml(c){ return localPurchaseHtml(c, 'lm', false); }

function lmNoBuy(){
  var c = getCurrentCase(); if(!c||!c.localMgmt) return;
  if(c.localMgmt.mgmtActive){ c.localMgmt.addBuy = false; renderCaseBody(c); return; } /* 本地管理进行中：只收起选购 */
  if(lmNothingYet(c.localMgmt)){ lmBackOut(c); return; } /* 什么都没买 / 没用：返回 */
  logCaseEvent(c, actingName(), '本地管理：本次不购买项目');
  afterLmFinished(c);
}

/* ===== CMD-1014-03 本地代偿：取消项目 / 无法协调时不退钱，赴韩定金转成本地项目额度（c.comp = {kwr, credit, scope, used}） =====
   额度 = 原本应退的韩元 × 汇率，必须一次用完（已选 ≥ 额度才能结算），超过的差额补付；买到的批次标 comp:true，不可退款。 */
function compPending(c, scope){ return (c && c.comp && !c.comp.used && c.comp.scope===scope) ? c.comp : null; }
function holdingBatchSet(c){ var out = []; getClientHoldings(c.name).forEach(function(h){ h.batches.forEach(function(b){ out.push(b); }); }); return out; }
function compBannerHtml(cp, total, scope){
  var left = Math.max(0, cp.credit - total), extra = Math.max(0, total - cp.credit);
  var src = cp.fromCaseNo ? '（来源 '+cp.fromCaseNo+'）' : '（赴韩定金 '+formatCurrency(cp.kwr,'KRW')+' 转本地）';
  return '<div class="card" style="padding:10px 14px;margin-bottom:10px;background:#FBF0C9;border-color:#E8D48A;font-size:12px;line-height:1.7;"><b>代偿额度 '+formatCurrency(cp.credit,'IDR')+'</b>'+src+' · 已选 '+formatCurrency(total,'IDR')+' · '+(extra>0 ? '需补付 <b>'+formatCurrency(extra,'IDR')+'</b>' : '额度剩余 <b>'+formatCurrency(left,'IDR')+'</b>，结算时退还客人')+
    '<br><span style="color:#8F6F0C;">一次换完，多退少补：比额度便宜退差额、比额度贵补付；买到的项目不可退款。</span> <a href="#" class="info-link" onclick="compDefer(\''+scope+'\');return false;">之后再换</a></div>';
}
function compFinalize(c, cp, before, total, batchObj){
  var extra = Math.max(0, total - cp.credit), back = Math.max(0, cp.credit - total);
  getClientHoldings(c.name).forEach(function(h){ h.batches.forEach(function(b){ if(before.indexOf(b)<0 && b.caseId===c.id){ b.comp = true; } }); });
  cp.used = true; cp.usedAt = nowFullDt();
  if(batchObj){ batchObj.compCredit = cp.credit; batchObj.payExtra = extra; batchObj.compRefund = back; if(cp.fromCaseNo) batchObj.compFrom = cp.fromCaseNo; }
  if(cp.creditId){ var cl = clientByName(c.name), cr = cl && (cl.compCredits||[]).filter(function(x){ return x.id===cp.creditId; })[0]; if(cr){ cr.used = true; cr.usedCaseNo = c.caseNo; cr.usedAt = nowFullDt(); } }
  logCaseEvent(c, actingName(), (cp.fromCaseNo ? '用代偿额度换项目（来源 '+cp.fromCaseNo+'）' : '赴韩定金转本地代偿')+'：额度 '+formatCurrency(cp.credit,'IDR')+(cp.fromCaseNo ? '' : '（定金 '+formatCurrency(cp.kwr,'KRW')+'）')+'；本次购买 '+formatCurrency(total,'IDR')+'，'+(back>0 ? '代偿余额退还 '+formatCurrency(back,'IDR') : '补付 '+formatCurrency(extra,'IDR'))+'；买到的项目标「代偿」、不可退款');
}
/* 之后再换：这次不买，额度存成客人的「代偿额度」（客户详情显示，不设期限、不可退款），下次来在本地管理里用 */
function compDefer(scope){
  var c = getCurrentCase(); if(!c || !c.comp || c.comp.used) return;
  var cp = c.comp;
  if(!confirm('这次先不换项目？代偿额度 '+formatCurrency(cp.credit,'IDR')+' 会留给客人，下次来可以换。')) return;
  var cl = clientByName(c.name); if(cl){ cl.compCredits = cl.compCredits || []; }
  if(cp.creditId){ /* 来自客人已有的额度：放回去即可 */
    c.comp = null; logCaseEvent(c, actingName(), '代偿额度 '+formatCurrency(cp.credit,'IDR')+'（来源 '+cp.fromCaseNo+'）这次先不换，仍留给客人');
  } else {
    var id = 'cc'+Date.now()%1000000+Math.floor(Math.random()*100);
    if(cl) cl.compCredits.push({id:id, amount:cp.credit, kwr:cp.kwr, fromCaseId:c.id, fromCaseNo:c.caseNo, reason:cp.reason||'', date:todayStr(), used:false});
    cp.deferred = true; cp.used = true; cp.creditId = id;
    logCaseEvent(c, actingName(), '代偿额度 '+formatCurrency(cp.credit,'IDR')+' 这次先不换，留给客人（客户详情「代偿额度」，不可退款，不设期限，下次来在本地管理里换项目）');
  }
  if(scope==='lm'){ if(c.localMgmt && lmNothingYet(c.localMgmt)){ c.localMgmt = null; c.activeCaseTab = showKrTab(c) ? 'kr' : (c.consultRequested ? 'consult' : 'basic'); } }
  updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c); if(typeof Store!=='undefined') Store.touch();
}
function clientCompCredits(name){ var cl = clientByName(name); return cl ? (cl.compCredits||[]).filter(function(x){ return !x.used; }) : []; }
/* 新案件本地管理选购画面：客人有代偿额度时出现［用代偿额度换项目］ */
function compUseBarHtml(c, scope){
  if(compPending(c, scope) || (c.comp && !c.comp.used)) return '';
  var cr = clientCompCredits(c.name); if(!cr.length) return '';
  return '<div class="card" style="padding:10px 14px;margin-bottom:10px;background:#FBF0C9;border-color:#E8D48A;font-size:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span>客人有代偿额度：'+cr.map(function(x){ return '<b>'+formatCurrency(x.amount,'IDR')+'</b>（来源 '+x.fromCaseNo+'）'; }).join('、')+'</span>'+
    cr.map(function(x){ return '<button class="btn-outline" style="padding:4px 10px;font-size:12px;" onclick="compUseCredit(\''+x.id+'\',\''+scope+'\')">用代偿额度换项目</button>'; }).join('')+'</div>';
}
function compUseCredit(creditId, scope){
  var c = getCurrentCase(); if(!c) return; var cl = clientByName(c.name), cr = cl && (cl.compCredits||[]).filter(function(x){ return x.id===creditId && !x.used; })[0]; if(!cr) return;
  c.comp = {kwr:cr.kwr, credit:cr.amount, reason:cr.reason, date:todayStr(), items:[], scope:scope, used:false, creditId:cr.id, fromCaseNo:cr.fromCaseNo};
  logCaseEvent(c, actingName(), '选择用代偿额度换项目：'+formatCurrency(cr.amount,'IDR')+'（来源 '+cr.fromCaseNo+'）');
  buildCaseLog(c); renderCaseBody(c);
}
(function(){ /* 客户详情持有项目卡上方：代偿额度（不可退款） */
  var r0 = renderClientHoldings;
  renderClientHoldings = function(name){
    r0.apply(this, arguments);
    var cr = clientCompCredits(name), block = document.getElementById('detail-holdings-block'), el = document.getElementById('detail-holdings'); if(!cr.length || !block || !el) return;
    block.style.display = 'block';
    el.innerHTML = cr.map(function(x){ return '<div style="border:1px solid #E8D48A;background:#FBF0C9;border-radius:10px;padding:10px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;"><div><div style="font-size:13px;font-weight:700;">代偿额度 '+formatCurrency(x.amount,'IDR')+'</div><div style="font-size:11px;color:#8F6F0C;">来源 '+x.fromCaseNo+'（'+x.date+'，赴韩定金 '+formatCurrency(x.kwr,'KRW')+' 转本地）· 不设期限 · 下次来在本地管理里换项目</div></div><span class="status-pill" style="background:#F3E3B5;color:#8F6F0C;font-size:11px;">不可退款</span></div>'; }).join('')+el.innerHTML;
  };
})();
/* 退款弹窗选了「转本地项目（代偿）」之后：直接进本地管理 tab 的选购画面 */
function startCompPurchase(c, kwr, reason, names){
  var credit = Math.round(kwr * FX_RATES.KRW_IDR), partial = krActiveItems(c).length>0;
  c.comp = {kwr:kwr, credit:credit, reason:reason, date:todayStr(), items:names, scope:partial ? 'lm' : 'main', used:false};
  if(partial){
    c.localMgmt = {active:true, ended:false, step:'buy', mgmtUses:[], mgmtActive:false, mgmtDone:false, mgmtStatus:null, mgmtCancelling:false, batches:[], pick:{}, cart:[]};
    c.localMgmtDay = c.localMgmtDay || todayStr();
  } else {
    c.krSchedule = null; c.localAsk = false; c.localTrack = true; c.entryChoicePending = true; c.projectEntryMode = 'new'; c.projectsLocked = false; c.recommended = []; c.projectOriginFilter = 'IN'; /* 赴韩项目都取消了：同一案件转本地案件，直接是选购画面（和「增加本地项目」同一套重置） */
  }
  c.activeCaseTab = 'localmgmt';
  logCaseEvent(c, actingName(), '退款方式选「转本地项目（代偿）」：代偿额度 '+formatCurrency(credit,'IDR')+'（'+formatCurrency(kwr,'KRW')+' × '+FX_RATES.KRW_IDR+'），进入本地管理选购画面');
  updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
}
function lmSettle(){
  var c = getCurrentCase(); if(!c||!c.localMgmt) return;
  var lm = c.localMgmt, cart = lm.cart||[], today = todayStr();
  if(!cart.length) return;
  if(cartTotals(cart).onlyService){ alert('서비스需搭配付费项目'); return; }
  var total = cart.reduce(function(s,it){ return s + inLineTotal(it); }, 0);
  var cpL = compPending(c, 'lm');
  var beforeB = cpL ? holdingBatchSet(c) : null;
  var items = cart.map(function(it){ return {name:it.name, kind:it.kind||'project', qty:it.qty||1, price:it.price, unitPrice:it.unitPrice, discountPct:(it.discountPct===undefined||it.discountPct===null)?100:it.discountPct, itemNote:it.itemNote||'', promo:!!it.promoId, pkgItems:it.pkgItems, lineTotal:inLineTotal(it)}; });
  grantLocalItems(c, cart, today);
  lm.batches.push({id:'L'+(lm.batches.length+1), items:items, inTotal:total, time:nowFullDt(), note:lm.noteIN||''});
  if(cpL) compFinalize(c, cpL, beforeB, total, lm.batches[lm.batches.length-1]);
  lm.cart = []; lm.noteIN = '';
  if(lm.mgmtActive){ lm.addBuy = false; lm.addUse = true; } /* 本地管理进行中追加购买：付款后问是否继续使用 */
  else lm.step = 'afterBuyUse'; /* 结算后：是否使用？ */
  logCaseEvent(c, actingName(), '本地管理：结算付款 '+formatCurrency(total,'IDR')+'（'+items.map(function(i){ return i.name+(i.kind==='service' ? '（서비스）' : '')+' ×'+i.qty+(discountText(i.discountPct)?'（'+discountText(i.discountPct)+'）':''); }).join('、')+'），已转客户持有');
  updateCaseStage(c); buildCaseLog(c); renderCaseBody(c);
}

/* 项目确认中（2026-09-29 重写）：确认后不管有没有赴韩项目，都直接生成结算单进入"待付款"；
   施术日期改到付款之后才走（见 krProcedureTabHtml），不再是结算前的门槛 */
function confirmProjectSelection(){
  var c = getCurrentCase(); if(!c || !(c.recommended||[]).length) return;
  if(cartTotals(c.recommended).onlyService){ alert('서비스需搭配付费项目'); return; }
  var cpM = compPending(c, 'main');
  logCaseEvent(c, actingName(), '确认所选管理项目：'+c.recommended.map(function(it){ return it.name; }).join('、'));
  generateSettlementBatch(c);
  if(cpM){ var lb = c.settlementBatches[c.settlementBatches.length-1]; lb.compCredit = cpM.credit; }
  updateCaseStage(c);
  renderCaseStatusBar(c);
  buildCaseLog(c);
  renderCaseBody(c);
}

/* 生成结算单：把 c.recommended 的快照搬进 procedureItems + 新开一个 settlementBatches 记录，
   projectsLocked=true 代表"结算单已生成"，等真正标记付款（settleProjects→confirmSettlementPayment）才变"已付款" */
/* 待付款结算单退回上一步：撤销这张未付款的结算单，项目放回已选择（可加可取消） */
function reselectProjects(){
  var c = getCurrentCase(); if(!c) return;
  var b = latestUnpaidBatch(c); if(!b) return;
  var back = (c.procedureItems||[]).filter(function(it){ return it.batchId===b.id; });
  c.recommended = back.map(function(it){ var o = Object.assign({}, it); delete o.done; delete o.batchId; return o; });
  c.procedureItems = (c.procedureItems||[]).filter(function(it){ return it.batchId!==b.id; });
  c.settlementBatches = (c.settlementBatches||[]).filter(function(x){ return x.id!==b.id; });
  c.projectsLocked = c.settlementBatches.length>0;
  c.addingMore = c.projectsLocked; /* 前面还有已付款的批次：回到「追加项目」选择；没有：回到最初的项目选择 */
  c.settleTab = null;
  logCaseEvent(c, actingName(), '待付款结算单（批次 '+b.id+'）退回重新选择项目');
  updateCaseStage(c); renderCaseStatusBar(c); buildCaseLog(c); renderCaseBody(c);
}
function generateSettlementBatch(c){
  var batchId = 'B' + ((c.settlementBatches||[]).length + 1);
  var b = computeBatchBreakdown(c.recommended);
  var newItems = c.recommended.map(function(it){ return Object.assign({}, it, {done:false, batchId:batchId}); });
  c.settlementBatches = c.settlementBatches || [];
  c.settlementBatches.push({id:batchId, afterReport:!!c.reportReady, orderedBy:actingName(), settledBy:'客人', time:nowFullDt(), status:'unpaid',
    krTotal:b.krTotal, krDeposit:b.krDeposit, krBalance:b.krBalance, krProvisional:b.krProvisional||0, inTotal:b.inTotal});
  c.procedureItems = (c.procedureItems||[]).concat(newItems);
  c.settleTab = null; /* 新结算单：默认打开最新一张 */
  c.recommended = [];
  c.addingMore = false;
  c.projectsLocked = true;
  logCaseEvent(c, actingName(), '已生成结算单（批次 '+batchId+'），等待付款');
}

/* 追加项目确认：先补一步生成结算单，再打开付款弹窗（旧代码这里直接调 settleProjects()，
   但追加选的项目当时还在 c.recommended 里、从没进过 procedureItems/settlementBatches，
   latestUnpaidBatch 永远找不到——这里顺带把这个缺口补上，属于本轮"加项"范围内的修复） */
function confirmAddition(){
  var c = getCurrentCase(); if(!c || !(c.recommended||[]).length) return;
  if(cartTotals(c.recommended).onlyService){ alert('서비스需搭配付费项目'); return; }
  generateSettlementBatch(c);
  settleProjects();
}

function projCasesLinkHtml(pid){ return ' <a href="#" class="info-link" style="font-size:11px;white-space:nowrap;" onclick="event.stopPropagation();event.preventDefault();openProjectCasesNewTab(\''+pid+'\');return false;">查看相关案例 ↗</a>'; }

function caseCcySwitchHtml(origin){
  var opts = origin==='KR' ? ['KRW','IDR','CNY'] : ['IDR','CNY'];
  var cur = origin==='KR' ? CASE_DISPLAY_CCY_KR : CASE_DISPLAY_CCY_IN;
  return '<select onchange="setCaseDisplayCcy(\''+origin+'\',this.value)" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:11px;">'+
    opts.map(function(cc){
      var label = cc==='KRW' ? '韩元（原价）' : (cc==='IDR' ? (origin==='IN'?'印尼盾（原价）':'印尼盾') : '人民币');
      return '<option value="'+cc+'"'+(cur===cc?' selected':'')+'>'+label+'</option>';
    }).join('')+'</select>';
}

function setCaseDisplayCcy(origin, ccy){
  if(origin==='KR') CASE_DISPLAY_CCY_KR = ccy; else CASE_DISPLAY_CCY_IN = ccy;
  var c = getCurrentCase(); if(c) renderCaseBody(c);
}

/* 选项目时最上方的推荐项目整理（随勾选即时重算）：只算已勾选的赴韩项目，资料来自 KR 诊疗方案的可选范围（C2） */
function setRecInNote(v){ var c = getCurrentCase(); if(!c) return; c.recInNote = String(v||'').trim(); logCaseEvent(c, actingName(), '更新推荐项目整理的 IN 室长备注'); renderCaseBody(c); }
function projectRecSummaryHtml(c, selected){
  var scope = c.krScope; if(!scope || !(scope.items||[]).length) return '';
  var items = (selected||[]).map(function(it){ return (scope.items||[]).filter(function(si){ return si.name===it.name; })[0]; }).filter(function(si){ return si && (si.stay || si.anesthesia || (si.postcare||[]).length); });
  return items.length ? recSummaryHtml(items, scope.overallNote) : '<div style="font-size:12px;color:var(--muted);margin:0 0 12px;">勾选赴韩项目后，这里显示「推荐项目整理」（推荐在韩天数、麻醉、术后管理）。</div>';
}
function projectPickerHtml(c, isAddition){
  var selected = c.recommended || [];
  var noKrPicker = isLocalCase(c) && !c.reportReady; /* 不面诊的本地案件（选择项目 / 本地管理）：选购只有本地项目，没有赴韩项目子 tab；面诊案件的项目列表 tab 不变（CMD-1008-07） */
  if(noKrPicker) return localPurchaseHtml(c, 'main', isAddition); /* 不面诊的本地案件 → 独立的「本地选购」画面（CMD-1008-09） */
  var originFilter = c.projectOriginFilter || 'KR';
  var q = (c.projectSearch || '').toLowerCase();
  var pickerCcy = originFilter==='KR' ? CASE_DISPLAY_CCY_KR : CASE_DISPLAY_CCY_IN;
  var leftRows;
  if(originFilter==='KR'){
    /* 赴韩项目只显示KR室长整理的可选范围（krScope），不是完整项目库；没有krScope时给空状态引导 */
    var scope = c.krScope;
    if(!scope || !scope.items.length){
      var addConsultBtn = (c.needsConsult===false && !c.consultRequested)
        ? '<button class="btn-outline" style="margin-top:10px;" onclick="addConsult()">增加面诊</button>' : '';
      leftRows = (c.reportReady ? '<div style="font-size:12px;color:var(--slate2);padding:14px 4px;line-height:1.7;">这份诊疗方案里没有可选的赴韩项目（旧数据）。可以改选本地项目，或点「客人不做项目」。</div>' : '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">需先完成面诊，由韩国室长给出可选项目</div>')+addConsultBtn;
    } else {
      var scopeNote = scope.overallNote ? '<div style="font-size:12px;color:var(--slate2);background:var(--terracotta-bg);border-radius:8px;padding:10px 12px;margin-bottom:12px;">KR室长整体备注：'+scope.overallNote+'</div>' : '';
      var catalog = scope.items.map(function(si){
        var p = PROJECT_LIBRARY.filter(function(x){ return x.name===si.name; })[0];
        return p ? Object.assign({}, p, {krNote:si.note, krMeta:itemMetaText(si)}) : null;
      }).filter(function(p){ return p && p.origin==='KR'; }); /* 赴韩tab只取krScope里origin=KR的，术后管理(IN)另在本地tab处理 */
      if(q) catalog = catalog.filter(function(p){ return p.name.toLowerCase().indexOf(q)>-1; });
      leftRows = scopeNote + (catalog.map(function(p){
        var checked = selected.some(function(it){ return it.projectId===p.id; });
        var noteHtml = (p.krNote ? '<div style="font-size:11px;color:var(--muted);margin-top:2px;">'+p.krNote+'</div>' : '')+((p.krMeta||[]).length ? '<div style="font-size:11px;color:var(--slate2);margin-top:2px;line-height:1.6;">'+p.krMeta.join('<br>')+'</div>' : '');
        return '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border2);font-size:13px;cursor:pointer;">'+
          '<input type="checkbox" onchange="toggleProject(\''+p.id+'\')" '+(checked?'checked':'')+' style="margin-top:2px;">'+
          '<span style="flex-grow:1;">'+p.name+projCasesLinkHtml(p.id)+noteHtml+'</span><span style="color:var(--slate2);">'+displayAmount(p.price, p.origin, pickerCcy)+'</span></label>';
      }).join('') || '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">没有匹配的项目</div>');
    }
  } else {
    /* 赴韩方案里的本地项目：和本地选购同一套画面（类别 → 项目 → 规格 → 价格，CMD-1012-04）；IN 已没有「术后管理」分类，术后管理的具体项目在 KR 设定里选 */
    leftRows = localCatalogHtml(c, 'main', 'all', q, pickerCcy);
  }
  var expandBtn = '<span style="cursor:pointer;font-size:12px;color:var(--slate);" onclick="toggleProjectsExpand()">'+(c.projectsExpanded?'⮡ 收起':'⮢ 展开满屏')+'</span>';
  var subTabs = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px;">'+
    (noKrPicker ? '' : '<span class="chip'+(originFilter==='IN'?' active':'')+'" onclick="setProjectOrigin(\'IN\')">本地项目</span>')+
    (noKrPicker ? '' : '<span class="chip'+(originFilter==='KR'?' active':'')+'" onclick="setProjectOrigin(\'KR\')">赴韩项目</span>')+
    caseCcySwitchHtml(originFilter)+
    '<a href="#" class="info-link" style="font-size:12px;" onclick="openProjectLibNewTab();return false;">在项目库查看 ↗</a>'+
    '</div>';
  var tot = cartTotals(selected);
  var settleOn = isAddition ? 'confirmAddition()' : 'confirmProjectSelection()';
  var settleBtn = '<button class="btn-primary" style="flex:1;'+((tot.paidCount && !tot.missingPrice) ? '' : 'opacity:.5;cursor:not-allowed;')+'" '+((tot.paidCount && !tot.missingPrice) ? 'onclick="'+settleOn+'"' : 'disabled')+'>'+(isAddition ? '结算追加项目 / 交定金' : '结算')+'</button>';
  var noProjectBtn = (!isAddition && c.reportReady && !c.entryChoicePending && !c.settlementDone) ? '<button class="btn-outline" style="flex:1;" onclick="noProjectForClient()">客人不做项目</button>' : '';
  var wrapOpen = isAddition
    ? '<div class="project-card'+(c.projectsExpanded?' expanded':'')+'" style="border-top:1px dashed var(--border);padding-top:18px;margin-top:4px;">'
    : '<div class="card project-card'+(c.projectsExpanded?' expanded':'')+'" style="padding:22px 24px;">';
  return wrapOpen+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><div class="info-heading">'+(isAddition?'追加项目':'赴韩方案')+'</div>'+expandBtn+(isAddition?'<span style="cursor:pointer;font-size:12px;color:var(--slate);margin-left:10px;" onclick="cancelAddMore()">取消追加</span>':'')+'</div>'+
    projectRecSummaryHtml(c, selected)+
    '<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:24px;">'+
    '<div>'+subTabs+
    '<input type="text" placeholder="搜索项目…" value="'+(c.projectSearch||'')+'" oninput="setProjectSearch(this.value)" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-bottom:10px;">'+
    leftRows+'</div>'+
    '<div class="sel-card"><div style="font-size:12px;font-weight:700;color:var(--slate2);margin-bottom:8px;">已选择</div>'+settlementBigCardHtml(c, selected, true)+serviceBlockHtml(c, 'main')+
    (tot.onlyService ? '<div style="font-size:12px;color:#A8740A;font-weight:700;margin-top:10px;">서비스需搭配付费项目</div>' : '')+
    '<div style="display:flex;gap:10px;margin-top:14px;">'+settleBtn+noProjectBtn+'</div></div>'+
    '</div></div>';
}

function cancelAddMore(){
  var c = getCurrentCase(); if(!c) return;
  c.addingMore = false;
  c.recommended = [];
  renderCaseBody(c);
}

function addMoreProjects(){
  var c = getCurrentCase(); if(!c) return;
  c.addingMore = true;
  c.recommended = [];
  renderCaseBody(c);
}

/* 赴韩项目状态变化后统一判断：还有未开始项目 → 照常继续；全部完成/取消 → 有完成的自动判结局，全取消则问是否做本地管理 */
function afterKrItemsChanged(c){
  if(krNotStartedItems(c).length>0){
    updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
    return;
  }
  if(krActiveItems(c).length>0){ /* 至少有一个已完成，其余取消 */
    if(pendingPayItems(c).length) return; /* 有待付款在韩加项，不自动结案 */
    c.krProcedureDone = true;
    finishCase(c);
    return;
  }
  /* 全部赴韩项目都已取消：
     - 案件里有本地项目/术后管理 → 室长选择保留（再问"是否做本地项目"：是→本地管理；否→已结案）或全部退款（→仅出报告）
     - 案件里没有 → 问"是否增加本地项目"：是→选购付款后进本地管理；否→仅出报告
     通用规则：不做本地→仅出报告的前提是本次没有购买本地项目（或已全退），有购买则为已结案（computeOutcome 统一判断） */
  c.krSchedule = null;
  var hasLocal = localPurchasedBatches(c).length>0;
  c.localAsk = hasLocal ? 'keep' : true;
  c.activeCaseTab = 'kr';
  logCaseEvent(c, actingName(), hasLocal ? '赴韩项目已全部取消并退款；案件里有本地项目/术后管理，请室长决定保留或全部退款' : '赴韩项目已全部取消并退款，询问是否增加本地项目');
  updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
  if(hasLocal) openLocalKeepModal(c); else openLocalAskModal(c);
}

function krArrivedOpsHtml(c){
  var j = c.krJudge, btn = function(label, fn, cls){ return '<button class="'+(cls||'btn-outline')+'" onclick="'+fn+'">'+label+'</button>'; };
  var note = function(t){ return '<div style="font-size:12px;font-weight:700;color:var(--slate2);margin-bottom:8px;">'+t+'</div>'; };
  var wait = function(t){ return '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">'+t+'</div>'; };
  var inner = '', info = krBalanceInfo(c);
  if(!j){
    inner = wait('等待 KR 室长判断能否施术（到院后的判断、调整、尾款、子项进行全部由 KR 端操作，这里只显示结果）');
  } else if(j.result==='ok'){
    inner = note('KR判断：能施术，项目没变动')+(c.krBalancePaid ? '<div style="font-size:12px;color:var(--sage);font-weight:700;">✓ 已付清尾款，行程已确认；在韩 timeline 的子项由 KR 逐个标完成，在韩国的子项全部完成后案件结案</div>' : wait('等待 KR 确认行程并标记付清尾款（尾款 '+formatCurrency(info.diff,'KRW')+'）'));
  } else if(j.result==='changed' || j.replaced){
    var calc = '实际项目合计 '+formatCurrency(info.total,'KRW')+'；定金合计 '+formatCurrency(info.deposit,'KRW')+(info.preRefund>0 ? '，减去到院前已退 '+formatCurrency(info.preRefund,'KRW') : '')+' = 可抵定金 '+formatCurrency(info.effDeposit,'KRW')+'；'+(info.diff>=0 ? '尾款 ' : '应退差额 ')+formatCurrency(Math.abs(info.diff),'KRW');
    inner = note('KR判断：能施术，但项目有变动')+'<div style="font-size:12px;color:var(--slate2);margin-bottom:10px;">'+calc+'</div>'+
      (c.krBalancePaid ? '<div style="font-size:12px;color:var(--sage);font-weight:700;">✓ 尾款已结清（按实际项目重算）；在韩 timeline 的子项由 KR 逐个标完成</div>'
        : (j.refundDue ? btn('按 KR 判断退尾款差额 '+formatCurrency(j.refundDue,'KRW'),'settleKrBalance()','btn-primary') : wait('等待 KR 调整项目并结算尾款')));
  } else { /* cannot */
    inner = note('KR判断：不能施术')+(j.refundKind
      ? '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+btn('按 KR 判断退定金（'+(j.refundKind==='all' ? '全部退回' : '不退')+'）','krRefundDeposit(\''+j.refundKind+'\')','btn-primary')+'</div>'
      : wait('等待 KR 判断：在韩国重新预约施术时间，或退定金（全部退回 / 不退）'));
  }
  return '<div style="border-top:1px solid var(--border2);padding-top:14px;">'+inner+'</div>';
}
function krRefundDeposit(kind){
  var c = getCurrentCase(); if(!c || !c.krJudge || c.krJudge.result!=='cannot') return;
  var amount = kind==='all' ? Math.max(0, krBalanceInfo(c).effDeposit) : 0; /* 全部退回=还留在诊所的定金 */
  openRefundModal(krNotStartedItems(c), 'krCannot', false, amount);
}

function setProjectOrigin(o){
  var c = getCurrentCase(); if(!c) return;
  c.projectOriginFilter = o;
  renderCaseBody(c);
}

function setProjectSearch(v){
  var c = getCurrentCase(); if(!c) return;
  c.projectSearch = v;
  renderCaseBody(c);
}

var KR_DEPOSIT_RATE = 0.3;

/* 找当前案件"结算单已生成、还没标付款"的那个批次——generateSettlementBatch() 生成，
   这里只负责展示金额+标记付款，不再重新生成项目 */
function latestUnpaidBatch(c){
  var bs = c.settlementBatches || [];
  for(var i=bs.length-1;i>=0;i--){ if(bs[i].status==='unpaid') return bs[i]; }
  return null;
}

/* 术后管理分配改了（付尾款前）：重算所在结算单的合计；定金不变（可弹性的不算进定金） */
function recomputeBatch(c, batchId){
  var b = (c.settlementBatches||[]).filter(function(x){ return x.id===batchId; })[0]; if(!b) return;
  var bd = computeBatchBreakdown((c.procedureItems||[]).filter(function(it){ return it.batchId===batchId && it.origin==='KR' && !it.cancelled && !it.swapped; }));
  b.krTotal = bd.krTotal; b.krBalance = bd.krTotal - (b.noDeposit ? 0 : b.krDeposit); b.krProvisional = bd.krProvisional;
}
/* 术后管理分配（IN 室长在项目选择/赴韩项目 tab 改；KR 在付尾款确认行程时也能改）：x.inTimes = 分给印尼的次数 */
function corePcAlloc(c, projectId, batchId, i, v, by){
  if(!pcAllocEditable(c)) return false;
  var it = batchId ? (c.procedureItems||[]).filter(function(x){ return x.projectId===projectId && x.batchId===batchId; })[0] : (c.recommended||[]).filter(function(x){ return x.projectId===projectId; })[0];
  var x = it && it.postcare && it.postcare[i]; if(!x || x.place!=='either' || !x.innName) return false;
  var old = x.inTimes||0; x.inTimes = Math.max(0, Math.min(x.times, parseInt(v,10)||0));
  if(batchId){ recomputeBatch(c, batchId); if(old!==x.inTimes) logCaseEvent(c, by, '术后管理分配：'+it.name+'·'+x.name+' 印尼 '+old+' → '+x.inTimes+' 次（韩国 '+(x.times-x.inTimes)+' 次）'); }
  return true;
}
function setPcAlloc(projectId, batchId, i, v){
  var c = getCurrentCase(); if(!c) return;
  if(corePcAlloc(c, projectId, batchId, i, v, actingName()) && batchId) buildCaseLog(c);
  renderCaseBody(c);
}
var SETTLE_ANES_SIGNED = false;
function toggleAnesSign(on){ SETTLE_ANES_SIGNED = !!on; var b = document.getElementById('settle-pay-btn'); if(b){ b.disabled = !on; b.style.opacity = on ? '' : '.5'; } }
function confirmSettlementPayment(){
  var c = getCurrentCase(); if(!c) return;
  var batch = (c.settlementBatches||[]).filter(function(b){ return b.id===SETTLE_MODAL_BATCH_ID; })[0]; if(!batch) return;
  /* 付定金前必须签署麻醉同意书（没签不能付） */
  var batchKr = (c.procedureItems||[]).filter(function(it){ return it.batchId===batch.id && it.origin==='KR'; });
  var need = batch.noDeposit ? [] : anesNeeded(c, batchKr);
  if(need.length){
    if(!SETTLE_ANES_SIGNED){ alert('请先签署麻醉同意书，才能付定金'); return; }
    var prev = (c.anesthesiaConsent && c.anesthesiaConsent.projects) || [];
    c.anesthesiaConsent = {version:ANES_CONSENT_VERSION, ts:nowFullDt(), by:actingName(), projects:prev.concat(anesItemsOf(batchKr).map(function(a){ return {name:a.name, type:a.type, label:a.label, note:a.note}; }))};
    logCaseEvent(c, actingName(), '客人签署麻醉同意书（'+ANES_CONSENT_VERSION+'）：'+need.map(function(a){ return a.name+'：'+a.label; }).join('、'));
  }
  batch.status = 'active';
  c.settlementDone = true; /* 一旦付过一次款就一直是 true；加项后新批次单独走 unpaid→active，不影响这个总开关 */
  var today = todayStr();
  var batchInItems = (c.procedureItems||[]).filter(function(it){ return it.batchId===batch.id && it.origin==='IN'; });
  batch.inItems = batchInItems.map(function(it){ return {name:it.name, specLabel:it.specLabel||'', specTimes:it.specTimes||1, kind:it.kind||'project', qty:it.qty||1, price:it.price, unitPrice:it.unitPrice, discountPct:(it.discountPct===undefined?100:it.discountPct), itemNote:it.itemNote||'', promo:!!it.promoId}; }); /* 结算单展示用快照（本地项目结算后转持有，不留在 procedureItems） */
  var __cb = batch.compCredit ? holdingBatchSet(c) : null;
  grantLocalItems(c, batchInItems, today); /* 本地项目 / 套餐 / 서비스 转客户持有（套餐拆批次） */
  if(batch.compCredit && c.comp){ compFinalize(c, c.comp, __cb, batch.inTotal, batch); }
  /* 本地项目（含术后管理）结算后立即转客户持有，不进入案件进程（2026-09-29 第十轮） */
  c.procedureItems = (c.procedureItems||[]).filter(function(it){ return it.origin!=='IN'; });
  if(krActiveItems(c).length>0){
    c.activeCaseTab = 'kr';
    KR_SCHED_VIEW_MONTH = nearestOpenMonth(TODAY_DATE, caseOpenDates(c)); /* 月历默认打开最近的可选月份，不停在上次浏览过的月份 */
  } else {
    /* 纯本地：结算后必须过一遍"持有项目使用/本次不使用"才能结案，即使刚买的项目也要在这一步决定用不用 */
    if(c.mgmtActive){ c.addUse = true; } /* 本地管理进行中追加购买：付款后直接问是否继续使用 */
    else {
      c.entryChoicePending = true;
      c.projectEntryMode = 'holdings';
    }
    c.activeCaseTab = isLocalCase(c) ? 'localmgmt' : 'kr'; /* 本地案件的流程在本地管理tab里 */
  }
  updateCaseStage(c);
  closeSettleModal();
  renderCaseStatusBar(c);
  var payLog = [];
  if(batch.krDeposit) payLog.push('赴韩预付金 '+formatCurrency(batch.krDeposit,'KRW'));
  if(batch.inTotal) payLog.push('本地全款 '+formatCurrency(batch.inTotal,'IDR'));
  logCaseEvent(c, '客人', '完成项目付款（批次 '+batch.id+'：'+payLog.join('、')+'），项目清单已锁定');
  if(batchInItems.length) logCaseEvent(c, actingName(), '本地项目已转入客户持有：'+batchInItems.map(function(it){ return it.name+' x'+(it.qty||1); }).join('、'));
  buildCaseLog(c);
  renderCaseBody(c);
}


/* ---- 赴韩施术 tab（2026-09-29 重写，原"施术"tab拆分为两个）：施术日期改到已付款之后才递交，
   不再是结算前的排期门槛；日期只能选 KR_OPEN_DATES 里开放的（演示数据，未开放置灰不可选） ---- */
var KR_OPEN_DATES = [D(1),D(2),D(3),D(4),D(10),D(11),D(17),D(18),D(20),D(24),D(25),D(31),D(32),D(38),D(39),D(45),D(46),D(52),D(53)]; /* 种子：H1 KD1 院长 院长的开放日期（初始化后按医院/院长存在 HOSPITAL_DATA 里，读 caseOpenDates(c)） */

var KR_SCHED_VIEW_MONTH = new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), 1);

/* 月历默认打开的月份（2026-09-29 第十轮修复：原来是全局变量，翻页后不会在切换案件/重新进入时复位，
   导致"看起来停在别的月份"；现在每次进入日期选择/修改流程时显式重置，不再依赖上次翻页停留的位置） */
function nearestOpenMonth(fromDate, dates){
  var sorted = (dates || []).slice().sort();
  if(!sorted.length) return new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  var target = sorted.filter(function(d){ return new Date(d) >= fromDate; })[0] || sorted[0];
  var d = new Date(target);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function ensureKrScheduleDraft(c){
  if(!c.krSchedule) c.krSchedule = {status:null, primary:'', backup:'', confirmedDate:'', confirmedTime:'', changePrimary:'', changeBackup:'', changeSubmitted:false};
  return c.krSchedule;
}

function krScheduleMonthShift(dir){
  KR_SCHED_VIEW_MONTH = new Date(KR_SCHED_VIEW_MONTH.getFullYear(), KR_SCHED_VIEW_MONTH.getMonth()+dir, 1);
  var c = getCurrentCase(); if(c) renderCaseBody(c);
}

/* 合并月历（2026-09-30）：首选和备选共用一个月历——第一次点击是首选，第二次点击是备选（不同颜色），再点一次已选日期取消；
   pf/bf 是存放首选/备选的字段名（首次递交：primary/backup；修改日期：changePrimary/changeBackup） */
function pickKrDate(pf, bf, y, m, d){
  var dateStr = fmtDateYMD(y,m,d);
  var c = getCurrentCase(); if(!c) return;
  if(caseOpenDates(c).indexOf(dateStr)===-1) return; /* 未开放的日期不可选（只看该案件所选院长开放的日期） */
  var ks = ensureKrScheduleDraft(c);
  if(ks[pf]===dateStr) ks[pf] = '';
  else if(ks[bf]===dateStr) ks[bf] = '';
  else if(!ks[pf]) ks[pf] = dateStr;
  else ks[bf] = dateStr; /* 已有首选：点击第二个日期是备选；备选已有时再点别的日期会替换备选 */
  renderCaseBody(c);
}

function krDateCalendarGridHtml(pf, bf, primaryVal, backupVal){
  var openDatesNow = caseOpenDates(getCurrentCase());
  var y = KR_SCHED_VIEW_MONTH.getFullYear(), m = KR_SCHED_VIEW_MONTH.getMonth();
  var firstDow = new Date(y,m,1).getDay();
  var daysInMonth = new Date(y,m+1,0).getDate();
  var cells = [];
  for(var i=0;i<firstDow;i++) cells.push(null);
  for(var d=1; d<=daysInMonth; d++) cells.push(d);
  var dowLabels = ['日','一','二','三','四','五','六'];
  var legend = '<div style="display:flex;gap:12px;font-size:11px;color:var(--slate2);margin-bottom:6px;"><span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--navy);margin-right:4px;"></span>首选'+(primaryVal?'：'+primaryVal:'')+'</span><span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--terracotta);margin-right:4px;"></span>备选（选填）'+(backupVal?'：'+backupVal:'')+'</span></div>';
  return legend+'<div style="max-width:280px;display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:11px;">'+
    dowLabels.map(function(w){ return '<div style="color:var(--muted);padding:2px 0;">'+w+'</div>'; }).join('')+
    cells.map(function(d){
      if(!d) return '<div></div>';
      var dateStr = fmtDateYMD(y,m,d);
      var open = openDatesNow.indexOf(dateStr)>-1 && dateStr >= todayStr(); /* 今天以前的日期置灰不可选（CMD-1012-05 三·1） */
      var style = 'padding:5px 0;border-radius:6px;';
      if(!open) style += 'color:var(--dim);';
      else if(dateStr===primaryVal) style += 'background:var(--navy);color:#fff;font-weight:700;cursor:pointer;';
      else if(dateStr===backupVal) style += 'background:var(--terracotta);color:#fff;font-weight:700;cursor:pointer;';
      else style += 'color:var(--navy);cursor:pointer;background:var(--sage-bg);';
      var onclick = open ? ' onclick="pickKrDate(\''+pf+'\',\''+bf+'\','+y+','+m+','+d+')"' : '';
      return '<div style="'+style+'"'+onclick+'>'+d+'</div>';
    }).join('')+
    '</div>';
}

/* 演示按钮：模拟KR室长确认/无法安排施术日期 */
/* ---- KR 日程块（KR-SCHD-01，2026-10-06）：{id, who(院长/室长), date, time(开始), end(结束), type:手术|面诊|会议|占位|其他, title, note, caseId, clinicId, name, kind:'施术'(自动加入的)}；
   按事逐笔登记，允许重叠（并排显示）；时间都是韩国时间 ---- */
var SCHED_TYPES = ['施术', '不可预约']; /* 2026-10-07 修订：日程块只有这两种（OFF 另外存在 offs 里）；原手术/面诊/会议/占位/其他已废弃，演示数据改成不可预约 */
var SCHED_SEQ = 1;
/* 规范化：施术（平台案件，kind:'施术'，确认施术时间后自动加入）/ 不可预约（院长这段时间没空，不写原因、不强制登记）；
   韩国医院自己的本地客人、室长的内部日程不进平台，所以室长日程块清掉；相邻的不可预约块合并成一块 */
function normSchedBlocks(hid){
  var h = HOSPITAL_DATA[hid]; if(!h) return;
  Object.keys(h.directorSchedule||{}).forEach(function(n){
    var arr = (h.directorSchedule[n]||[]);
    arr.forEach(function(b){
      if(!b.id) b.id = 'sb'+(SCHED_SEQ++)+Math.floor(Math.random()*1000);
      b.who = b.who || n;
      if(!b.end) b.end = minToTime(Math.min(24*60-1, timeToMin(b.time)+30));
      if(b.kind==='施术'){ b.type = '施术'; b.title = '施术'; }
      else if(b.kind==='面诊'){ b.type = '面诊'; b.title = '面诊'; } /* 2026-10-08（CMD-1008-12 C）：KR 室长确认的面诊时间也进院长日程，显示「面诊 · 客人 · 院长」 */
      else { b.type = '不可预约'; b.title = '不可预约'; b.note = ''; delete b.kind; }
    });
    var rest = arr.filter(function(b){ return b.type==='施术' || b.type==='面诊'; }), busy = arr.filter(function(b){ return b.type!=='施术' && b.type!=='面诊'; }).sort(function(x,y){ return (x.date+x.time).localeCompare(y.date+y.time); }), merged = [];
    busy.forEach(function(b){ var p = merged[merged.length-1]; if(p && p.date===b.date && timeToMin(b.time) <= timeToMin(p.end)){ if(timeToMin(b.end) > timeToMin(p.end)) p.end = b.end; } else merged.push(b); });
    h.directorSchedule[n] = rest.concat(merged);
  });
  h.coordSchedule = []; /* 室长的内部日程不进平台 */
}
/* 施术块的时长：本案件赴韩项目在医院项目库里的默认施术时长（分钟）合计；没有时长默认 1 小时 */
/* KR 项目库时长必填（CMD-1013-12 三）：旧数据 / 演示数据没填的补上（赴韩项目按类别给演示值，管理项目 30 分钟）；surgeryMinutes 的 60 分钟兜底仅作旧数据保护 */
function krBackfillDurations(){
  var n = 0;
  Object.keys(HOSPITAL_DATA||{}).forEach(function(hid){
    var h = HOSPITAL_DATA[hid]; if(!h) return;
    (h.projects||[]).forEach(function(p){ if(isKrPostcareCat(p.categoryId)) return; p.defaults = p.defaults || {stay:'', durMin:0, anes:'local', anesNote:'', postcare:[]}; if(!(Number(p.defaults.durMin) > 0)){ p.defaults.durMin = 60; n++; } });
    (h.localLib||[]).forEach(function(p){ if(!(Number(p.durMin) > 0)){ p.durMin = 30; n++; } });
  });
  return n;
}
function surgeryMinutes(c){
  var h = HOSPITAL_DATA[caseKrHospital(c)] || {projects:[]}, tot = 0;
  krActiveItems(c).forEach(function(it){ var p = (h.projects||[]).filter(function(x){ return x.name===it.name; })[0]; if(p && p.defaults && p.defaults.durMin) tot += p.defaults.durMin; else if(/^lc:/.test(String(it.projectId||''))){ var lp = (h.localLib||[]).filter(function(x){ return 'lc:'+x.id===it.projectId; })[0]; if(lp && lp.durMin) tot += lp.durMin; } });
  return tot || 60;
}

/* ---- KR 端施术预约操作（2026-10-06，KR-CASE-02 第 3 节）：不碰界面，KR 页面在 Store.mutateClinic 里调用 ----
   krSchedule 新增字段：address（到院地址）、rejectNote（KR 无法安排的原因，IN 重新选日期时显示）；confirmedTime = 到院时间 */
/* 确认施术时间后自动在该院长日程加一个"施术"块（关联案件、来源诊所）；时间或地址调整时同步（KR-SCHD-01） */
/* 清掉已经过期的施术块（旧存档里取消后还留着的）：块对应的案件已取消 / 已无赴韩项目 / 没有施术日期。clinicId 的案件从 getCase 取 */
function sweepStaleSurgeryBlocks(getCase){
  var n = 0;
  Object.keys(HOSPITAL_DATA||{}).forEach(function(hid){ var h = HOSPITAL_DATA[hid]; Object.keys(h.directorSchedule||{}).forEach(function(dn){
    var arr = h.directorSchedule[dn]||[];
    for(var i = arr.length-1; i >= 0; i--){
      var b = arr[i]; if(b.kind!=='施术' || !b.caseId) continue;
      var cs = getCase(b.clinicId, b.caseId); if(!cs) continue; /* 读不到案件（别家诊所读不出）就不动 */
      var ks = cs.krSchedule, live = cs.stage!=='cancelled' && cs.stage!=='reportonly' && krActiveItems(cs).length && ks && ks.confirmedDate===b.date;
      if(!live){ arr.splice(i, 1); n++; }
    }
  }); });
  return n;
}
function syncSurgeryBlock(c){
  var hid = caseKrHospital(c), h = HOSPITAL_DATA[hid]; if(!h || !c.director) return;
  h.directorSchedule = h.directorSchedule || {};
  var arr = (h.directorSchedule[c.director] = h.directorSchedule[c.director] || []);
  for(var i = arr.length-1; i >= 0; i--){ if(arr[i].kind==='施术' && arr[i].caseId===c.id && arr[i].clinicId===c.clinicId) arr.splice(i, 1); }
  var ks = c.krSchedule;
  var dead = c.stage==='cancelled' || c.stage==='reportonly' || !krActiveItems(c).length; /* 案件已取消 / 仅出报告 / 赴韩项目已全部取消：施术不再占院长日程、KR 工作台日历、IN 的 KR 医院日程（CMD-1012-10） */
  if(!dead && ks && (ks.status==='confirmed' || ks.status==='change_pending' || ks.status==='arrived') && ks.confirmedDate){
    var st = ks.confirmedTime||'09:00', en = minToTime(Math.min(24*60-1, timeToMin(st)+surgeryMinutes(c)));
    arr.push({id:'sb'+(SCHED_SEQ++)+Math.floor(Math.random()*1000), who:c.director, date:ks.confirmedDate, time:st, end:en, type:'施术', title:'施术', note:'', kind:'施术', caseId:c.id, clinicId:c.clinicId, name:c.name});
  }
}
function coreScheduleConfirm(c, date, time, address, by){
  var ks = c.krSchedule; if(!ks || ks.status!=='pending') return false;
  ks.status = 'confirmed'; ks.confirmedDate = date; ks.confirmedTime = time; ks.address = address||''; ks.rejectNote = '';
  logCaseEvent(c, by, 'KR确认施术时间：'+date+' '+time+'（韩国时间）到院'+(address?'，地址：'+address:''));
  pushNotif('赴韩施术','KR 确认施术时间：'+c.name+' '+tkK(date, time)+(address?'（'+address+'）':''), {caseId:c.id});
  syncSurgeryBlock(c); updateCaseStage(c);
  syncSurgerySub(c);
  return true;
}
function coreScheduleReject(c, reason, by){
  var ks = c.krSchedule; if(!ks || ks.status!=='pending') return false;
  ks.status = null; ks.primary = ''; ks.backup = ''; ks.rejectNote = reason;
  logCaseEvent(c, by, 'KR无法安排所选日期：'+reason+'（请 IN 重新选日期）');
  pushNotif('赴韩施术','KR 无法安排施术日期：'+c.name+'（'+reason+'），请重新选择', {caseId:c.id});
  updateCaseStage(c);
  return true;
}
/* 时间已确认：同一天之内调整到院时间和地址（不能改日期） */
function coreScheduleAdjust(c, time, address, by){
  var ks = c.krSchedule; if(!ks || ks.status!=='confirmed') return false;
  var oldT = ks.confirmedTime, oldA = ks.address||'';
  ks.confirmedTime = time; ks.address = address||'';
  logCaseEvent(c, by, 'KR调整到院时间/地址：'+tkK(ks.confirmedDate, oldT)+' → '+tkK(ks.confirmedDate, time)+(oldA!==ks.address ? '；地址：'+(oldA||'—')+' → '+(ks.address||'—') : ''));
  pushNotif('赴韩施术','KR 调整了到院时间/地址：'+c.name+'（'+tkK(ks.confirmedDate, time)+(ks.address?'，'+ks.address:'')+'）', {caseId:c.id});
  syncSurgeryBlock(c);
  return true;
}
/* 改期待确认：确认新时间 */
function coreChangeConfirm(c, date, time, address, by){
  var ks = c.krSchedule; if(!ks || ks.status!=='change_pending' || !ks.changeSubmitted) return false;
  var oldD = ks.confirmedDate;
  ks.status = 'confirmed'; ks.confirmedDate = date; ks.confirmedTime = time; ks.address = address||ks.address||'';
  ks.changePrimary = ''; ks.changeBackup = ''; ks.changeSubmitted = false; ks.rejectNote = '';
  logCaseEvent(c, by, 'KR确认新施术时间（韩国时间）：'+oldD+' → '+date+' '+time);
  pushNotif('赴韩施术','KR 确认新施术时间：'+c.name+' '+tkK(date, time), {caseId:c.id});
  syncSurgeryBlock(c); updateCaseStage(c);
  syncSurgerySub(c);
  return true;
}
/* 改期无法安排：原日期继续有效 */
function coreChangeReject(c, reason, by){
  var ks = c.krSchedule; if(!ks || ks.status!=='change_pending' || !ks.changeSubmitted) return false;
  ks.changePrimary = ''; ks.changeBackup = ''; ks.changeSubmitted = false; ks.rejectNote = reason;
  logCaseEvent(c, by, 'KR无法安排新日期：'+reason+'（原日期 '+ks.confirmedDate+' 继续有效）');
  pushNotif('赴韩施术','KR 无法安排新日期：'+c.name+'（'+reason+'），原日期 '+ks.confirmedDate+' 继续有效', {caseId:c.id});
  return true;
}

/* ---- 在韩 timeline 与子项（2026-10-06，KR-CASE-02 第 4 节）----
   付定金后 KR 室长整理：每一行 = 案件下的一个子项 {id, no:'A000001-01', date, content, kind:'施术'|'复诊'|'管理'|'其他', place:'KR'|'IN'|'either', projectName(施术子项关联的项目), done, doneAt, doneBy, informed}
   客人端暂不显示；IN 端在赴韩项目 tab 下的子 tab 只读 */
var SUB_PLACE_LABEL = {KR:'韩国', IN:'印尼', either:'印尼 / 韩国均可'};
/* 子案件（CMD-1013-14 二）：客人在韩每到院一次一个子案件 A000023-1、-2…；-1 = 施术那天，之后每次术后管理 / 持有使用的预约各一个（按日期排）。
   子案件 = 案件的「施术」「术后管理记录」子项，购买 / 加项 / 关联 / 结算都挂主案件；增加项目属于施术当天的流程，不是子案件。显示编号现算，不改存档 */
function subCaseList(c){
  var l = (c.subItems||[]).filter(function(s){ return s.kind==='施术' || s.kind==='术后管理记录'; });
  return l.sort(function(a, b){ return (a.kind==='施术' ? 0 : 1)-(b.kind==='施术' ? 0 : 1) || (a.date||'').localeCompare(b.date||'') || (a.time||'').localeCompare(b.time||'') || String(a.no).localeCompare(String(b.no)); });
}
function subCaseNo(c, s){ var i = subCaseList(c).indexOf(s); return i<0 ? '' : c.caseNo+'-'+(i+1); }
function subCaseNos(c){ subCaseList(c).forEach(function(s, i){ s.dno = c.caseNo+'-'+(i+1); }); }
function subNextNo(c){ var n = 0; (c.subItems||[]).forEach(function(s){ var m = String(s.no).match(/-(\d+)$/); if(m) n = Math.max(n, parseInt(m[1],10)); }); return c.caseNo+'-'+pad2(n+1); }
function coreSubAdd(c, o, by){
  if(!c.settlementDone) return false;
  c.subItems = c.subItems || [];
  var first = c.subItems.length===0;
  var s = {id:'s'+Date.now()+Math.floor(Math.random()*100)+(o.salt||''), no:subNextNo(c), date:o.date, content:o.content, kind:o.kind||'术后管理记录', place:o.place||'KR', projectName:o.projectName||'', done:false, doneAt:'', doneBy:'', informed:false};
  if(o.auto) s.auto = true;
  if(o.time) s.time = o.time;
  if(o.pcb) s.pcb = true; /* 由「术后管理预约」弹窗产生 */
  c.subItems.push(s); c.subItems.sort(function(a,b){ return (a.date||'').localeCompare(b.date||'') || a.no.localeCompare(b.no); });
  if(o.silent) return s;
  logCaseEvent(c, by, 'KR新增'+subKindLabel(s.kind)+' '+s.no+'：'+s.date+' '+s.content+'（'+SUB_PLACE_LABEL[s.place]+'）');
  return true;
}
/* 术后管理预约（CMD-1012-02 D4）：按术后管理设定逐条生成；rows = [{projectId, batchId, pcIdx, mgmt, name, innName, date, time, where:'KR'|'IN', askIn}]
   在韩国做 → 在韩子项（术后管理记录，place KR，带时间）；回印尼做 → 分配给客人在印尼的持有项目（inTimes）+ 子项 place IN，可勾"请 IN 帮忙预约"→ IN 收到"待预约"。重复提交会替换上一次的预约子项 */
function corePcBooking(c, rows, by){
  var afterPay = c.krBalancePaid && c.krJudge && (c.krJudge.result==='changed' || c.krJudge.result==='ok' || c.krJudge.replaced); /* 术后管理预约只在付清尾款后（原方案不变 / 调整方案都是，CMD-1013-03） */
  if(!c.settlementDone || (c.krBalancePaid && !afterPay) || c.visitClosed) return false;
  c.subItems = (c.subItems||[]).filter(function(s){ return !(s.pcb && !s.done && !s.booked); });
  var cnt = {}; pcUniqueEntries(c).forEach(function(e0){ if(e0.x.place==='either' && e0.x.innName) cnt[e0.it.name+'|'+e0.i] = 0; }); /* 共同术后管理只按一份算 */
  var inRows = [], inDaysMap = {};
  rows.forEach(function(r, k){
    if(r.where==='IN'){
      cnt[r.item+'|'+r.pcIdx] = (cnt[r.item+'|'+r.pcIdx]||0) + 1;
      (inDaysMap[r.item+'|'+r.pcIdx] = inDaysMap[r.item+'|'+r.pcIdx] || []).push(r.day); /* 回印尼做的每一次对应的术后第 N 天 */
      var s = coreSubAdd(c, {kind:'术后管理记录', date:r.date, content:(r.mgmt||r.name)+'（回印尼做：'+r.innName+'）', place:'IN', pcb:true, silent:true, salt:'i'+k}, by);
      if(r.askIn && s) inRows.push(s);
    } else {
      coreSubAdd(c, {kind:'术后管理记录', date:r.date, time:r.time, content:(r.mgmt||r.name)+(r.mgmt && r.mgmt!==r.name ? '（'+r.name+'，在韩国）' : '（在韩国）'), place:'KR', pcb:true, silent:true, salt:'k'+k}, by);
    }
  });
  Object.keys(cnt).forEach(function(key){
    var p = key.split('|'), it = krActiveItems(c).filter(function(x){ return x.name===p[0]; })[0], x = it && (it.postcare||[])[parseInt(p[1],10)]; if(!x) return;
    x.inTimes = Math.max(0, Math.min(x.times, cnt[key])); x.inDays = (inDaysMap[key]||[]).filter(function(n){ return n!=null; }).sort(function(a,b){ return a-b; }); if(it.batchId) recomputeBatch(c, it.batchId); /* 回印尼做的次数 = 分配给印尼的次数 */
  });
  c.pcBooked = true;
  if(afterPay) finalizeInnCare(c); /* 付款后才定下回印尼做的次数：这时再把印尼部分转成客人持有项目 */
  logCaseEvent(c, by, 'KR完成术后管理预约：在韩国 '+rows.filter(function(r){ return r.where!=='IN'; }).length+' 次，回印尼做 '+rows.filter(function(r){ return r.where==='IN'; }).length+' 次');
  inRows.forEach(function(s){ coreSubInform(c, s.id, by); });
  return true;
}
/* 「施术」那一行由案件自动产生（日期 = 已确认的施术日期，内容 = 施术项目），KR 不能手动新增、也不能改（CMD-1008-12 D4） */
function syncSurgerySub(c){
  if(!c.settlementDone || !c.krSchedule || !c.krSchedule.confirmedDate || ['confirmed','change_pending','arrived'].indexOf(c.krSchedule.status)<0) return;
  var names = krActiveItems(c).filter(function(it){ return !it.krAddOn && !it.preBalanceAdd && !it.swapped; }).map(function(it){ return it.name; });
  if(!names.length) return;
  c.subItems = c.subItems || [];
  var s = c.subItems.filter(function(x){ return x.kind==='施术'; })[0], content = '施术：'+names.join('、');
  if(s){ if(s.done){ return; } s.date = c.krSchedule.confirmedDate; s.content = content; s.auto = true; }
  else {
    s = {id:'s'+Date.now()+Math.floor(Math.random()*100), no:subNextNo(c), date:c.krSchedule.confirmedDate, content:content, kind:'施术', place:'KR', projectName:'', done:false, doneAt:'', doneBy:'', informed:false, auto:true};
    c.subItems.push(s);
  }
  c.subItems.sort(function(a,b){ return (a.date||'').localeCompare(b.date||'') || a.no.localeCompare(b.no); });
}
function coreSubEdit(c, id, patch, by){
  var s = (c.subItems||[]).filter(function(x){ return x.id===id; })[0]; if(!s || s.done || s.kind==='施术' || s.kind==='增加项目') return false; /* 施术一行自动产生；增加项目的内容来自项目库，都不能手改 */
  var before = s.date+' '+s.content+'（'+SUB_PLACE_LABEL[s.place]+'）';
  Object.keys(patch).forEach(function(k){ s[k] = patch[k]; });
  c.subItems.sort(function(a,b){ return (a.date||'').localeCompare(b.date||'') || a.no.localeCompare(b.no); });
  logCaseEvent(c, by, 'KR修改在韩子项 '+s.no+'：'+before+' → '+s.date+' '+s.content+'（'+SUB_PLACE_LABEL[s.place]+'）');
  return true;
}
function coreSubDel(c, id, by){
  var i = (c.subItems||[]).findIndex(function(x){ return x.id===id; }); if(i<0 || c.subItems[i].done || c.subItems[i].kind==='施术' || c.subItems[i].kind==='增加项目') return false;
  var s = c.subItems.splice(i, 1)[0];
  logCaseEvent(c, by, 'KR删除在韩子项 '+s.no+'：'+s.date+' '+s.content);
  return true;
}
/* IN 赴韩项目 tab 下的子 tab 切换 + 在韩 timeline（只读） */
function setKrSubTab(v){ var c = getCurrentCase(); if(!c) return; c.krSubTab = v; renderCaseBody(c); }
/* 项目进程 / 在韩 timeline 的统一排版（CMD-1008-12 D5；KR-CASE-02 2026-10-08 修订）：按日期一行一件，每行 日期 / 类型 / 内容 / 状态 / 地点；
   子项类型只有三种：施术（案件自动产生，不能手动新增）/ 术后管理记录（免费，日期 + memo；复诊、拆线、消肿都属此类）/ 增加项目（到院后加做，需结账） */
function subKindLabel(k){ return k==='施术' ? '施术' : (k==='增加项目' ? '增加项目' : '术后管理记录'); } /* 旧类型（复诊 / 管理 / 其他）一律算术后管理记录 */
var SUB_GRID_COLS = '104px 92px 1fr 150px 70px auto 84px'; /* 日期 / 类型 / 内容 / 状态（只放标签）/ 地点 / 操作 / 最右侧单独一栏［标记完成］（CMD-1013-06 三·3） */
function subGridHeadHtml(){ return '<div style="display:grid;grid-template-columns:'+SUB_GRID_COLS+';gap:10px;font-size:11px;color:var(--muted);font-weight:700;padding:4px 0 6px;border-bottom:1px solid var(--border);"><span>日期</span><span>类型</span><span>内容</span><span>状态</span><span>地点</span><span></span><span></span></div>'; }
/* cells：可选 {date, content, place, ops} 自定义（KR 可编辑时传入），否则只读 */
function subItemRowHtml(s, cells){
  cells = cells || {};
  var pc = {KR:['var(--terracotta-bg)','var(--terracotta)'], IN:['var(--sage-bg)','var(--sage)'], either:['var(--blue-bg)','var(--blue)']}[s.place] || ['var(--border2)','var(--slate2)'];
  var kc = {'施术':['#F3DFD3','#8A4A2A'], '增加项目':['#FBF0C9','#8F6F0C'], '术后管理记录':['var(--blue-bg)','var(--blue)']}[subKindLabel(s.kind)];
  var st = '<span class="status-pill" style="background:'+(s.done?'var(--sage-bg)':'var(--border2)')+';color:'+(s.done?'var(--sage)':'var(--slate2)')+';">'+(s.done?'已完成':'未开始')+'</span>'+(s.booked ? ' <span class="status-pill" style="background:var(--blue-bg);color:var(--blue);">已预约 '+s.booked+'</span>' : (s.informed ? ' <span class="status-pill" style="background:#FBF0C9;color:#8F6F0C;">KR 已通知预约</span>' : ''));
  return '<div title="编号 '+s.no+'" style="display:grid;grid-template-columns:'+SUB_GRID_COLS+';gap:10px;align-items:center;font-size:13px;padding:8px 0;border-bottom:1px solid var(--border2);">'+
    '<span>'+(cells.date || s.date)+'</span><span class="status-pill" style="background:'+kc[0]+';color:'+kc[1]+';justify-self:start;">'+subKindLabel(s.kind)+'</span>'+
    '<span>'+(s.dno && s.kind!=='增加项目' ? '<b style="font-size:11px;color:var(--slate2);">'+s.dno+'</b> ' : '')+(cells.content || s.content)+'</span><span>'+st+'</span>'+
    '<span>'+(cells.place || '<span class="status-pill" style="background:'+pc[0]+';color:'+pc[1]+';">'+SUB_PLACE_LABEL[s.place]+'</span>')+'</span><span>'+(cells.ops || '')+'</span><span style="text-align:right;">'+(cells.done || '')+'</span></div>'+
    (s.note ? '<div style="font-size:12px;color:var(--slate2);margin:-2px 0 6px 104px;">'+(s.kind==='施术' ? '施术备注' : '备注')+'：'+String(s.note).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</div>' : '');
}
function krTimelineTabHtml(c){
  subCaseNos(c);
  var list = (c.subItems||[]).slice().sort(function(a, b){ return (a.date||'').localeCompare(b.date||'') || (a.time||'').localeCompare(b.time||'') || a.no.localeCompare(b.no); }).map(function(s){ return subItemRowHtml(s); }).join('')+(c.krProgressMemo ? '<div style="font-size:12px;color:var(--slate2);margin-top:8px;white-space:pre-wrap;"><b>项目进程 memo：</b>'+String(c.krProgressMemo).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</div>' : '');
  return '<div class="info-heading" style="margin-bottom:8px;">项目进程（KR 室长整理，只读）</div>'+
    (list ? subGridHeadHtml()+list : '<div style="font-size:13px;color:var(--muted);padding:10px 0;">KR 还没有整理项目进程（付定金后由 KR 室长整理，整理好会通知你）</div>')+
    '<div style="font-size:11px;color:var(--muted);margin-top:10px;">可据此安排机票、住宿；客人端暂不显示。施术一行由案件自动产生；术后管理记录是免费的记录；增加项目是到院后加做、需要结账的项目。每一行是案件下的一个子项（编号 '+(c.caseNo||'A000001')+'-01、-02……，悬停可看）。</div>';
}

/* ---- KR 端：到院、判断、调整、尾款（2026-10-06，KR-CASE-02 第 5 节；沿用 Case Management Flow 06） ---- */
function coreMarkArrived(c, by){
  if(!c.settlementDone || isArrived(c) || !c.krSchedule || c.krSchedule.status!=='confirmed') return false;
  c.arrivedPrev = !!c.hasArrived; /* 撤回时恢复到院前的状态 */
  c.krSchedule.status = 'arrived'; c.hasArrived = true;
  updateCaseStage(c);
  logCaseEvent(c, by, 'KR标记"已到医院"');
  pushNotif('赴韩施术','客人已到医院：'+c.name, {caseId:c.id});
  return true;
}
var KR_JUDGE_TEXT = {ok:'可以手术，原方案不变', changed:'可以手术，但需要调整方案', cannot:'不建议手术'}; /* 院长评估结果（CMD-1012-02 D1）：除第一项外 memo 必填 */
/* "已到医院"可撤回：院长评估 / 结算之前（D3），回到时间已确认，Timeline 记一笔 */
function coreUnarrive(c, by){
  if(!c.krSchedule || c.krSchedule.status!=='arrived' || c.krJudge || c.krBalancePaid || c.visitClosed) return false;
  c.krSchedule.status = 'confirmed'; c.hasArrived = !!c.arrivedPrev; delete c.arrivedPrev;
  updateCaseStage(c);
  logCaseEvent(c, by, 'KR撤回"已到医院"（院长评估之前），回到施术时间已确认');
  pushNotif('赴韩施术','赴韩施术：'+by+' / '+c.name+' 撤回了"已到医院"（回到施术时间已确认）', {caseId:c.id});
  return true;
}
function coreJudge(c, result, by, memo){
  if(!c.hasArrived || c.visitClosed || c.krJudge || !KR_JUDGE_TEXT[result]) return false;
  memo = String(memo||'').trim();
  if(result!=='ok' && !memo) return false; /* 除"原方案不变"外 memo 必填 */
  c.krJudge = {result:result, settled:false, memo:memo, by:by};
  logCaseEvent(c, by, '院长评估结果：'+KR_JUDGE_TEXT[result]+(memo ? '；原因：'+memo : ''));
  pushNotif('赴韩施术','赴韩施术：'+by+' / '+c.name+' '+KR_JUDGE_TEXT[result]+(memo ? ' / 原因：'+memo : ''), {caseId:c.id});
  return true;
}
function coreMarkUnable(c, names, reason, by){
  if(!c.krJudge || c.krJudge.result!=='changed' || c.krJudge.settled) return false;
  var pending = krNotStartedItems(c);
  if(!names.length || names.length>=pending.length) return false; /* 至少保留一个；全部不能做属于"不能施术" */
  pending.forEach(function(it){ if(names.indexOf(it.name)>-1){ it.cancelled = true; it.unable = true; it.unableReason = reason; } });
  logCaseEvent(c, by, 'KR标记无法施术：'+names.join('、')+'（项目→已取消）；原因：'+reason);
  updateCaseStage(c);
  syncSurgerySub(c);
  return true;
}
/* 退回评估重选（CMD-1013-03「上一步」）：评估后、结算 / 确认更换时间 / 退款完成之前都可以退回；结束前的选择不产生结算单、不记为定案（Timeline 记一笔修改） */
function coreJudgeRevert(c, by){
  var j = c.krJudge; if(!j || j.settled || c.krBalancePaid || c.visitClosed || isEnded(c)) return false;
  c.krJudge = null;
  logCaseEvent(c, by, 'KR退回评估重选：原选择「'+KR_JUDGE_TEXT[j.result]+'」'+(j.memo ? '（memo：'+j.memo+'）' : '')+(j.refundKind ? '，原退定金判断（'+(j.refundKind==='all' ? '全部退回' : '不退')+'）作废' : '')+'；还没有结算，没有产生结算单');
  updateCaseStage(c);
  return true;
}
/* 不建议手术 → 取消项目 → 更换项目：原项目全部「已更换」，KR 项目库选新项目（不另算差价，尾款 = 最终项目合计 − 已付定金），判断改记「需要调整方案」后走结算 */
function coreCannotReplace(c, names, byName, by, locals){
  locals = locals || [];
  var j = c.krJudge; if(!j || j.result!=='cannot' || j.replaced || j.settled || c.krBalancePaid || c.visitClosed || (!names.length && !locals.length)) return false;
  var pend = krNotStartedItems(c); if(!pend.length) return false;
  var origNames = pend.map(function(it){ return it.name; });
  var allNames = names.concat(locals.map(function(x){ return x.name+' · '+x.specLabel; })); pend.forEach(function(it){ it.swapped = true; it.replacedBy = allNames.join('、'); });
  var ok = true;
  names.forEach(function(n){ var o = (byName||{})[n] || {}; if(ok && !coreAddOnItem(c, n, by, {anesthesia:o.anesthesia, signed:o.signed, detail:o.detail})) ok = false; });
  locals.forEach(function(x){ if(ok && !coreAddOnItem(c, x.name, by, {local:x})) ok = false; }); /* 管理项目（KR 本地管理项目库，韩元，收费） */
  if(!ok){ pend.forEach(function(it){ delete it.swapped; delete it.replacedBy; }); return false; }
  j.replaced = true; delete j.refundKind; /* 院长评估仍保留「不建议手术 + memo」，不改记为需要调整方案（CMD-1013-04 四·1） */
  logCaseEvent(c, by, '取消项目 → 更换为 '+allNames.join('、')+'（原项目 '+origNames.join('、')+'；评估仍是「不建议手术」；不另算差价，尾款按最终项目合计 − 已付定金）');
  syncSurgerySub(c); updateCaseStage(c);
  return true;
}
/* 更换项目：原项目留在原结算单标「已更换」；新项目另开新结算单，不收定金，金额直接计入尾款（"计入尾款"） */
function coreSwapItem(c, itemName, altName, by, detail, local){
  if(!c.krJudge || c.krJudge.result!=='changed' || c.krJudge.settled) return false;
  var target = krNotStartedItems(c).filter(function(it){ return it.name===itemName; })[0];
  var alt = local ? {id:'lc:'+(local.projectId||local.name), name:local.name+' · '+local.specLabel, price:local.price, origin:'KR', categoryId:null} /* 更换为管理项目（KR 本地管理项目库，韩元，收费） */
    : PROJECT_LIBRARY.filter(function(p){ return p.name===altName && p.active && p.origin==='KR' && (!c.hospitalId || p.hospitalId===c.hospitalId); })[0];
  if(!target || !alt) return false;
  target.swapped = true; target.replacedBy = alt.name;
  var newId = 'B' + ((c.settlementBatches||[]).length + 1);
  var ni = {projectId:alt.id, name:alt.name, price:alt.price, currency:currencyOf(alt.origin), origin:'KR', categoryId:alt.categoryId, done:false, batchId:newId, swappedFrom:target.name};
  if(detail){ if(detail.stay) ni.stay = detail.stay; if(detail.anesthesia) ni.anesthesia = detail.anesthesia; if((detail.postcare||[]).length) ni.postcare = detail.postcare.map(function(x){ return Object.assign({inTimes:0}, x); }); } /* 新项目的所需术后管理、麻醉特性、推荐在韩时间 */
  var amt = itemKrAmount(ni);
  c.settlementBatches.push({id:newId, orderedBy:'KR', settledBy:'KR（计入尾款）', time:nowFullDt(), status:'active', krTotal:amt, krDeposit:0, krBalance:amt, inTotal:0, noDeposit:true, swapOf:target.name});
  c.procedureItems.push(ni);
  c.settleTab = null;
  logCaseEvent(c, by, '更换项目："'+target.name+'" → "'+alt.name+'"（原项目留在原结算单标已更换；新项目另开结算单 '+newId+'，不收定金，金额计入尾款）');
  syncSurgerySub(c);
  return true;
}
/* 付尾款并确认行程：可弹性术后管理的地点在这时确定（锁定分配）；术后管理含在套餐里——分给印尼的部分直接变成客人在 IN 的 0 元持有批次（套餐内含，术后第 N 天），不再收款 */
function innCareLines(c){
  var out = [];
  pcUniqueEntries(c).forEach(function(e0){ var it = e0.it, x = e0.x; (function(){ var s = pcSplit(x); if(x.place==='either' && s.inn>0) out.push({item:it.name, name:x.name, mgmt:x.mgmt||'', innName:x.innName||x.name, times:s.inn, day:pcDayText(x)||x.day||'', days:(x.inDays && x.inDays.length ? x.inDays.slice() : pcDays(x).slice(0, s.inn))}); })(); });
  return out;
}
/* 付清尾款（含 IN 按 KR 判断退差额后视为结清）时：锁定分配，印尼部分术后管理直接发放为 0 元持有批次（只发一次） */
function finalizeInnCare(c){
  var inn = innCareLines(c);
  if(inn.length && !c.innCare){
    var today = todayStr();
    inn.forEach(function(l){
      grantHolding(c.name, l.innName, '术后管理', c.id, today, l.times, false, {paid:0, list:0, pct:100, currency:'IDR'}); /* 套餐内含：0 元 */
      var h = (CLIENT_HOLDINGS[c.name]||[]).filter(function(x){ return x.itemName===l.innName; })[0], b = h && h.batches[h.batches.length-1], m = String(l.day).match(/(\d+)/);
      if(b){ b.pkg = true; b.scheduleDays = (l.days||[]).slice(); var d0 = (l.days && l.days.length) ? l.days[0] : (m ? m[1] : null); if(d0!=null) b.schedule = '术后第'+d0+'天'; } /* 套餐内含（0 元）；持有项目的进行时间；scheduleDays = 每一次各自的建议天数（CMD-1013-07 四） */
    });
    c.innCare = {lines:inn, status:'granted', at:nowFullDt()};
  }
  return inn;
}
function coreSettleBalance(c, by){
  if(!isArrived(c) || c.krBalancePaid || !c.krJudge || c.krJudge.settled) return {ok:false};
  var j = c.krJudge; if(j.result!=='ok' && j.result!=='changed' && !(j.result==='cannot' && j.replaced)) return {ok:false};
  var info = krBalanceInfo(c);
  if(info.diff < 0){ /* 定金多了：金额由 KR 判断，IN 室长按这个金额退差额 */
    j.refundDue = -info.diff;
    logCaseEvent(c, by, 'KR判断：尾款应退差额 '+formatCurrency(-info.diff,'KRW')+'（实际项目合计 '+formatCurrency(info.total,'KRW')+'，可抵定金 '+formatCurrency(info.effDeposit,'KRW')+'），请 IN 室长按此金额退款');
    pushNotif('赴韩施术','KR 判断需退尾款差额 '+formatCurrency(-info.diff,'KRW')+'：'+c.name+'，请按此金额操作退款', {caseId:c.id});
    return {ok:true, refund:true};
  }
  c.krBalancePaid = true; j.settled = true; /* 付清尾款后分配锁定 */
  var inn = finalizeInnCare(c);
  logCaseEvent(c, by, 'KR确认行程并标记"付清尾款"：尾款 '+formatCurrency(info.diff,'KRW')+(inn.length ? '；术后管理印尼部分（套餐内含）已转为客人持有项目：'+inn.map(function(l){ return l.innName+' ×'+l.times; }).join('、') : ''));
  pushNotif('赴韩施术','客人付清尾款、行程已确认：'+c.name+(inn.length ? '；印尼部分术后管理已转为客人持有项目（套餐内含）' : ''), {caseId:c.id});
  return {ok:true};
}
/* KR 在韩重新预约施术时间：回到"施术时间已确认"（新时间），客人再到医院时 KR 重新标记已到医院；IN 不能改 */
function coreRebook(c, date, time, by){
  if(!c.krSchedule || !isArrived(c) || (c.krJudge && (c.krJudge.result!=='cannot' || c.krJudge.replaced) && c.krJudge.settled)) return false;
  var ks = c.krSchedule; ks.status = 'confirmed'; ks.confirmedDate = date; ks.confirmedTime = time;
  c.krJudge = null;
  logCaseEvent(c, by, 'KR在韩国重新预约施术时间：'+date+' '+time+'（韩国时间；回到施术时间已确认，IN端显示更改时间）');
  pushNotif('赴韩施术','赴韩施术：'+by+' / '+c.name+' 在韩国重新预约了施术时间 '+tkK(date, time)+((c.krJudge&&c.krJudge.memo) ? ' / 原因：'+c.krJudge.memo : ''), {caseId:c.id});
  syncSurgeryBlock(c); updateCaseStage(c);
  syncSurgerySub(c); return true;
}
/* 不能施术时退定金：全部退回 / 不退，由 KR 室长判断；IN 室长按这个判断在系统里操作退款 → 仅出报告 */
function coreRefundDecision(c, kind, by){
  if(!c.krJudge || c.krJudge.result!=='cannot' || c.krJudge.refundKind) return false;
  c.krJudge.refundKind = kind;
  logCaseEvent(c, by, 'KR判断：不能施术，定金'+(kind==='all' ? '全部退回' : '不退')+'（请 IN 室长按此判断操作）');
  pushNotif('赴韩施术','KR 判断不能施术、定金'+(kind==='all' ? '全部退回' : '不退')+'：'+c.name+'，请按此操作', {caseId:c.id});
  return true;
}
/* 套餐内含的印尼部分术后管理：付清尾款时自动生成客人持有批次，IN 端只在案件里显示一条说明（没有收款/不买的选择） */
function innCareCardHtml(c){
  var ic = c.innCare; if(!ic || !ic.lines) return '';
  var lines = ic.lines.map(function(l){ return '<div style="font-size:12px;margin:3px 0;">'+l.innName+' × '+l.times+' 次'+(l.day?'（术后第 '+((String(l.day).match(/(\d+)/)||[])[1]||'?')+' 天）':'')+'，来自 '+l.item+' 的术后管理</div>'; }).join('');
  return '<div style="border:1px solid var(--border2);border-radius:12px;padding:14px 16px;margin-top:14px;background:#FBF6EA;"><div style="font-size:12px;font-weight:700;color:var(--sage);margin-bottom:6px;">术后管理 · 印尼部分（套餐内含，已转为客人持有项目，0 元）</div>'+lines+'<div style="font-size:11px;color:var(--muted);margin-top:6px;">'+ic.at+' 发放；不另收款，到印尼使用时在客户详情的持有项目里扣次数。</div></div>';
}

/* ---- 子项进行、回诊与结案（2026-10-06，KR-CASE-02 第 5 节） ----
   结案 = 在韩国的子项（地点=韩国）全部完成（取代"施术完成 → 已结案"）；地点=印尼/均可 的子项不挡结案，仍有未完成的由 KR 按［通知 IN 室长预约］ */
function subKrPending(c){ return (c.subItems||[]).filter(function(s){ return s.place==='KR' && !s.done; }); }
function coreSubDone(c, id, by, itemNames, noClose){
  var s = (c.subItems||[]).filter(function(x){ return x.id===id; })[0];
  if(!s || s.done || !c.krBalancePaid) return false; /* 付清尾款（开始施术）之后才能逐个标完成 */
  var picked = [];
  if(s.kind==='术后管理记录'){ if(!s.simDay && s.date && s.date > todayStr()) return false; if(!s.arrived) return false; } /* 术后管理：到当天 + ［客人已到］才能标完成（原型可用［模拟到当日］，CMD-1013-10 / 12） */
  if(s.kind==='施术'){ /* 施术行标完成 = 本次的施术项目都完成（增加项目各有自己的一行；不再弹「做了哪些项目」勾选，CMD-1013-10 一·4） */
    picked = krNotStartedItems(c).filter(function(it){ return !it.krAddOn; });
  } else if(s.kind==='增加项目'){ /* 增加项目：完成 = 这个加做的项目做完了 */
    picked = krNotStartedItems(c).filter(function(it){ return it.name===s.projectName && (it.preBalanceAdd || it.krAddOn); });
  }
  s.done = true; s.doneAt = nowFullDt(); s.doneBy = by;
  if(s.holdUseOf){ var hi = (c.procedureItems||[]).filter(function(x){ return x.heldOver && x.name===s.holdUseOf; })[0]; if(hi){ hi.holdUsed = (hi.holdUsed||0)+1; if(hi.holdUsed >= (hi.qty||1)){ hi.holdDone = true; } } } /* 持有项目使用一次 */
  picked.forEach(function(it){ it.done = true; });
  s.doneItems = picked.map(function(it){ return it.name; });
  logCaseEvent(c, by, 'KR标记子项已完成 '+s.no+'：'+s.content+(picked.length ? '（本次完成项目：'+s.doneItems.join('、')+'）' : ''));
  if(!noClose) krCloseIfDone(c);
  return true;
}
/* 今日项目（施术 + 增加项目）：勾选后按［已完成］ → 勾的几行变已完成，不自动结案，由 KR 在弹窗里确认「今日的项目都已完成了吗」（CMD-1013-10 一·1） */
function todayProjectSubs(c){ return (c.subItems||[]).filter(function(s){ return s.kind==='施术' || s.kind==='增加项目'; }); }
function coreTodayDone(c, ids, by){
  var n = 0; (ids||[]).forEach(function(id){ if(coreSubDone(c, id, by, [], true)) n++; });
  return n>0;
}
/* 「是，结案」：没勾的增加项目 / 未完成的术后管理 / 已付未做的管理项目转在韩持有（已约时间保留，日历照显示），案件结案 */
function todayFinishInfo(c){
  if(!c.settlementDone || !c.krBalancePaid || c.visitClosed || isEnded(c)) return null;
  var undone = todayProjectSubs(c).filter(function(s){ return !s.done; });
  return {undone:undone, surgeryUndone:undone.some(function(s){ return s.kind==='施术'; }), pendingPay:pendingPayItems(c).length>0};
}
function coreFinishToday(c, by){
  var info = todayFinishInfo(c); if(!info || info.surgeryUndone || info.pendingPay) return false;
  var held = [];
  info.undone.forEach(function(s){ s.hold = true; held.push(s.content); var it = (c.procedureItems||[]).filter(function(x){ return x.name===s.projectName && x.krAddOn && !x.done; })[0]; if(it) it.done = true; });
  (c.subItems||[]).forEach(function(s){ if(s.kind==='术后管理记录' && !s.done && !s.hold){ s.hold = true; held.push(s.content); } });
  krNotStartedItems(c).forEach(function(it){ if(isLocalKrItem(it) && !it.service){ it.heldOver = true; it.holdDone = false; held.push(it.name); } it.done = true; });
  c.krHoldAt = nowFullDt(); c.krProcedureDone = true;
  logCaseEvent(c, by, '今日项目都已完成，结案'+(held.length ? '；剩余 '+held.length+' 项转在韩持有：'+held.join('；') : ''));
  finishCase(c);
  return true;
}
function coreSubArrived(c, id, by){
  var s = (c.subItems||[]).filter(function(x){ return x.id===id; })[0]; if(!s || s.done || s.arrived) return false;
  if(!s.simDay && s.date && s.date > todayStr()) return false;
  s.arrived = true; s.arrivedAt = nowFullDt(); logCaseEvent(c, by, '客人已到：'+s.no+'「'+s.content+'」'); return true;
}
/* 持有项目（在韩持有的已付管理项目）剩余次数；安排使用 = 排一个时间（进 KR 日历和当天工作台），客人到后才标完成 */
function holdItemLeft(c, it){ return (it.qty||1) - (it.holdUsed||0); }
function holdItemPlanned(c, it){ return (c.subItems||[]).filter(function(s){ return s.holdUseOf===it.name && !s.done; }).length; }
function coreHoldUseSchedule(c, name, date, time, by){
  var it = (c.procedureItems||[]).filter(function(x){ return x.heldOver && !x.holdDone && x.name===name; })[0]; if(!it) return false;
  if(holdItemLeft(c, it) - holdItemPlanned(c, it) <= 0) return false;
  var s = coreSubAdd(c, {kind:'术后管理记录', date:date, time:time, content:name+'（持有项目使用）', place:'KR', projectName:name, silent:true}, by);
  if(!s) return false; s.hold = true; s.holdUseOf = name;
  logCaseEvent(c, by, '安排使用持有项目「'+name+'」：'+date+' '+time); return true;
}
function coreSubSimDay(c, id, by){ var s = (c.subItems||[]).filter(function(x){ return x.id===id; })[0]; if(!s || s.done) return false; s.simDay = true; logCaseEvent(c, by, '（仅原型）模拟到当日：'+s.no+'「'+s.content+'」'); return true; }
/* 在韩国的子项（地点=韩国）全部完成，且项目都已完成/取消/更换 → 结案；子项都完成但还有项目没标完成时不自动结案（KR 要勾选项目标完成，或标无法施术） */
function krCloseIfDone(c){
  if(c.visitClosed || subKrPending(c).length || krNotStartedItems(c).length || !krActiveItems(c).length) return false;
  if(pendingPayItems(c).length) return false; /* 有待付款的在韩加项：不结案，要先确认未付款项目（CMD-1012-15 一·4） */
  c.krProcedureDone = true;
  var left = (c.subItems||[]).filter(function(x){ return !x.done; });
  if(left.length) logCaseEvent(c, '系统', '在韩国的子项已全部完成；仍有 '+left.length+' 项在印尼/均可（由 KR 通知 IN 室长预约）');
  finishCase(c);
  return true;
}
/* ---- 主线完成 + 在韩持有（CMD-1013-08 一）----
   施术行已完成、没有待付款时，KR 按［主线完成，剩余转在韩持有］：未完成的项目（术后管理子项、已付未做的管理项目）转入这位客人的「在韩持有」（已约时间保留，KR 日历照显示），案件结案；
   案件列表小标签「在韩后续进行中」，全部做完后消失；到预约那天在 KR 标完成 / 备注 / 改时间，记录写回原案件 Timeline */
function isLocalKrItem(it){ return !!it.local || /^lc:/.test(String(it.projectId||'')); }
function krHoldList(c){
  var out = [];
  (c.subItems||[]).forEach(function(s){ if(s.hold && !s.done) out.push({kind:'sub', s:s}); });
  (c.procedureItems||[]).forEach(function(it){ if(it.heldOver && !it.holdDone) out.push({kind:'item', it:it}); });
  return out;
}
function krHoldOpen(c){ return krHoldList(c).length>0; }
function mainFinishInfo(c){ /* 能不能出现［主线完成，剩余转在韩持有］ */
  if(!c.settlementDone || !c.krBalancePaid || c.visitClosed || isEnded(c)) return null;
  var surg = (c.subItems||[]).filter(function(s){ return s.kind==='施术'; });
  if(!surg.length || !surg.every(function(s){ return s.done; }) || pendingPayItems(c).length) return null;
  var restSubs = (c.subItems||[]).filter(function(s){ return s.kind!=='施术' && !s.done; });
  var restItems = krNotStartedItems(c).filter(isLocalKrItem);
  if(krNotStartedItems(c).some(function(it){ return !isLocalKrItem(it); })) return null; /* 手术项目还没都标完成 */
  if(!restSubs.length && !restItems.length) return null; /* 全部当场做完：照旧自动结案，不出现这个按钮 */
  return {subs:restSubs, items:restItems};
}
function coreMainFinish(c, by){
  var info = mainFinishInfo(c); if(!info) return false;
  info.subs.forEach(function(s){ s.hold = true; });
  info.items.forEach(function(it){ it.heldOver = true; it.holdDone = false; it.done = true; });
  c.krHoldAt = nowFullDt(); c.krProcedureDone = true;
  logCaseEvent(c, by, '主线完成，剩余 '+(info.subs.length+info.items.length)+' 项转在韩持有：'+info.subs.map(function(s){ return (s.date||'')+(s.time ? ' '+s.time : '')+' '+s.content; }).concat(info.items.map(function(it){ return it.name; })).join('；'));
  finishCase(c);
  return true;
}
function coreHoldItemDone(c, name, by){
  var it = (c.procedureItems||[]).filter(function(x){ return x.heldOver && !x.holdDone && x.name===name; })[0]; if(!it) return false;
  it.holdDone = true; logCaseEvent(c, by, '在韩持有完成：'+it.name); return true;
}
/* 改时间（术后管理记录 / 在韩持有）：日期 + 时间；记 Timeline */
function coreSubTimeEdit(c, id, date, time, by){
  var s = (c.subItems||[]).filter(function(x){ return x.id===id; })[0]; if(!s || s.done || s.kind==='施术') return false;
  var before = (s.date||'')+(s.time ? ' '+s.time : '');
  s.date = date; s.time = time || s.time;
  c.subItems.sort(function(a,b){ return (a.date||'').localeCompare(b.date||'') || (a.time||'').localeCompare(b.time||'') || a.no.localeCompare(b.no); });
  logCaseEvent(c, by, '改时间 '+s.no+'「'+s.content+'」：'+before+' → '+date+(s.time ? ' '+s.time : '')+(s.hold ? '（在韩持有）' : ''));
  syncSurgeryBlock && 0;
  return true;
}
/* 勾选项目标"已完成"（没有施术子项的项目、或子项都完成后剩下的项目） */
function coreItemsDone(c, names, by){
  if(!c.krBalancePaid || c.visitClosed) return false;
  var picked = krNotStartedItems(c).filter(function(it){ return (names||[]).indexOf(it.name)>-1; });
  if(!picked.length) return false;
  picked.forEach(function(it){ it.done = true; });
  logCaseEvent(c, by, 'KR标记项目已完成：'+picked.map(function(it){ return it.name; }).join('、'));
  krCloseIfDone(c);
  return true;
}
/* 客人回印尼后要做的子项：KR 通知 IN 室长预约（附子项内容）→ IN 点通知打开预约弹窗，新案件自动关联原赴韩案件 */
function coreSubInform(c, id, by){
  var s = (c.subItems||[]).filter(function(x){ return x.id===id; })[0]; if(!s || s.done || s.place==='KR') return false;
  s.informed = true; s.informedAt = nowFullDt();
  logCaseEvent(c, by, 'KR通知 IN 室长预约 '+s.no+'：'+s.date+' '+s.content);
  pushNotif('赴韩施术','请 IN 帮忙预约：'+by+' / '+c.name+' 回印尼后需要做 '+s.no+'「'+s.content+'」（建议 '+s.date+'）', {caseId:c.id, link:{kind:'subBook', subId:s.id}});
  return true;
}
/* 回诊时加做项目：KR 室长直接新增，另开新结算单、在韩国付款（不经过 IN 选择，原结算单不动）；IN 收到通知、只读可见 */
function coreAddOnItem(c, projectName, by, opt){
  if(!c.hasArrived || c.visitClosed) return false;
  opt = opt || {};
  var an = opt.anesthesia || {type:'local', label:'局部麻醉', note:''};
  if(an.type!=='local' && !opt.signed) return false; /* 睡眠 / 全身麻醉：必须勾选已在现场签署麻醉同意书；局部不用 */
  var p = opt.local ? {id:'lc:'+(opt.local.projectId||opt.local.name), name:opt.local.name+' · '+opt.local.specLabel, price:opt.local.price, origin:'KR', categoryId:null, local:true}
    : PROJECT_LIBRARY.filter(function(x){ return x.name===projectName && x.active && x.origin==='KR' && (!c.hospitalId || x.hospitalId===c.hospitalId); })[0]; if(!p) return false; /* 本地管理项目（清单项目，韩元价格）也能在韩增加 */
  /* 到院 → KR 室长面谈、可推项目（增加项目）→ 一次结算 = 尾款 + 当天增加的项目 → 付清尾款（CMD-1008-12 D3）：
     尾款付清前增加的项目和尾款一次结算（不收定金，金额计入尾款，医院收）；尾款付清后再增加的项目另开新结算单（原结算不变） */
  var svc = !!(opt.local && opt.local.service);
  var pre = !c.krBalancePaid, newId = 'B' + ((c.settlementBatches||[]).length + 1);
  if(pre && !svc) c.settlementBatches.push({id:newId, orderedBy:'KR', settledBy:'KR（计入尾款）', time:nowFullDt(), status:'active', krTotal:p.price, krDeposit:0, krBalance:p.price, inTotal:0, noDeposit:true, preAdd:true});
  /* 尾款付清后加的项目：先进进程标「待付款」，不立刻生成结算单；KR 点［已付款］时一次生成一张（CMD-1012-15 一·2） */
  var ni = {projectId:p.id, name:p.name, price:svc ? 0 : p.price, currency:currencyOf(p.origin), origin:'KR', categoryId:p.categoryId, done:false, batchId:(pre && !svc ? newId : ''), anesthesia:an};
  if(svc){ ni.service = true; ni.name = p.name+'（서비스）'; } else if(!pre) ni.pendingPay = true;
  if(opt.detail){ if(opt.detail.stay) ni.stay = opt.detail.stay; if((opt.detail.postcare||[]).length) ni.postcare = opt.detail.postcare.map(function(x){ return Object.assign({inTimes:0}, x); }); } /* 增加的项目也带推荐在韩 / 所需术后管理 */
  if(pre) ni.preBalanceAdd = true; else ni.krAddOn = true;
  c.procedureItems.push(ni);
  if(an.type!=='local'){ var prev = (c.anesthesiaConsent && c.anesthesiaConsent.projects) || []; c.anesthesiaConsent = {version:(c.anesthesiaConsent&&c.anesthesiaConsent.version)||'KR 现场签署', ts:nowFullDt(), by:by, projects:prev.concat([{name:p.name, type:an.type, label:an.label, note:an.note||'', onSite:true}])}; logCaseEvent(c, by, 'KR勾选「已在现场签署麻醉同意书」：'+p.name+'（'+an.label+'）'); }
  c.settleTab = null;
  /* 子项：增加项目一行（地点韩国；日期默认今天） */
  c.subItems = c.subItems || [];
  var sub = {id:'s'+Date.now()+Math.floor(Math.random()*100), no:subNextNo(c), date:opt.date || todayStr(), content:ni.name, kind:'增加项目', place:'KR', projectName:ni.name, done:false, doneAt:'', doneBy:'', informed:false};
  c.subItems.push(sub); c.subItems.sort(function(a,b){ return (a.date||'').localeCompare(b.date||'') || a.no.localeCompare(b.no); });
  var msg = pre ? 'KR增加项目："'+p.name+'"（与尾款一次结算，另开结算单 '+newId+' 计入尾款；付清尾款后再加的项目另开结算）' : 'KR增加项目："'+p.name+'"（尾款已付清，标「待付款」，KR 点［已付款］后生成结算单，原结算单不变）';
  logCaseEvent(c, by, msg);
  updateCaseStage(c);
  return true;
}
/* 在韩加项后付（CMD-1012-15 一·2/3）：尾款付清后加的项目标「待付款」；有待付款时不能结案；KR 点［已付款］→ 生成一张结算单（来源「在韩加项」），项目变已付款 */
function pendingPayItems(c){ return (c.procedureItems||[]).filter(function(it){ return it.origin==='KR' && it.pendingPay && !it.cancelled && !it.swapped; }); }
function coreAddOnPaid(c, by){
  var items = pendingPayItems(c); if(!items.length || c.visitClosed) return false;
  var newId = 'B' + ((c.settlementBatches||[]).length + 1), amt = items.reduce(function(s, it){ return s + itemKrAmount(it); }, 0);
  c.settlementBatches.push({id:newId, orderedBy:'KR', settledBy:'KR（韩国付款）', time:nowFullDt(), status:'active', krTotal:amt, krDeposit:0, krBalance:amt, inTotal:0, noDeposit:true, addOn:true, addOnItems:items.map(function(it){ return it.name; })});
  items.forEach(function(it){ it.pendingPay = false; it.batchId = newId; });
  c.settleTab = null;
  logCaseEvent(c, by, 'KR确认在韩加项已付款：'+items.map(function(it){ return it.name; }).join('、')+'，合计 '+formatCurrency(amt,'KRW')+'，生成结算单 '+newId+'（在韩加项，韩国付款）');
  pushNotif('赴韩施术','在韩加项已付款：'+c.name+'（'+items.map(function(it){ return it.name; }).join('、')+'，'+formatCurrency(amt,'KRW')+'，结算单 '+newId+'）', {caseId:c.id, level:'info'});
  krCloseIfDone(c); /* 付款确认后，其余都做完了才结案 */
  return true;
}
/* 待付款在韩加项的修正 / 删除（CMD-1013-01）：只有待付款项目能改（按［已付款］后不能改）；改项目仍只能选 KR 项目库的韩国项目；睡眠 / 全麻必须勾已在现场签署 */
function coreAddOnEdit(c, idx, patch, by){
  var it = (c.procedureItems||[])[idx]; if(!it || !it.pendingPay || c.visitClosed) return {ok:false, err:'这个项目不是待付款状态，不能修正'};
  var qty = Math.max(1, parseInt(patch.qty,10) || 1), amount = Math.round(Number(patch.amount));
  if(!(amount >= 0) || isNaN(amount)) return {ok:false, err:'请填写金额'};
  var an = patch.anesthesia || it.anesthesia || {type:'local', label:'局部麻醉', note:''};
  if(an.type!=='local' && !patch.signed && !(it.anesthesia && it.anesthesia.type===an.type && c.anesthesiaConsent)) return {ok:false, err:'睡眠 / 全身麻醉：必须勾选「已在现场签署麻醉同意书」'};
  var p = PROJECT_LIBRARY.filter(function(x){ return x.name===patch.name && x.active && x.origin==='KR' && (!c.hospitalId || x.hospitalId===c.hospitalId); })[0];
  if(!p) return {ok:false, err:'只能选 KR 项目库里的韩国项目'};
  var before = it.name+'（×'+(it.qty||1)+'，'+formatCurrency(it.price,'KRW')+'）', oldName = it.name;
  if(p.name!==it.name){ /* 换了项目：推荐在韩 / 所需术后管理按新项目的默认资料重新带入 */
    it.projectId = p.id; it.name = p.name; it.categoryId = p.categoryId; delete it.stay; delete it.postcare;
    var df = p.defaults; if(df){ it.stay = df.stay; it.postcare = (df.postcare||[]).map(function(x){ var o = {mgmt:x.mgmt||'', name:x.kr, times:x.times, interval:x.times>1 ? (parseInt(x.interval,10)||1) : 0, place:x.place, startDay:parseInt(x.start,10)||0, innName:'', inTimes:0}; o.day = pcDayText(o); return o; }); }
  }
  it.qty = qty; it.price = amount; it.anesthesia = an;
  var cons = c.anesthesiaConsent; if(cons && cons.projects) cons.projects = cons.projects.filter(function(x){ return x.name!==oldName; });
  if(an.type!=='local'){ var prev = (c.anesthesiaConsent && c.anesthesiaConsent.projects) || []; c.anesthesiaConsent = {version:(c.anesthesiaConsent&&c.anesthesiaConsent.version)||'KR 现场签署', ts:nowFullDt(), by:by, projects:prev.concat([{name:it.name, type:an.type, label:an.label, note:an.note||'', onSite:true}])}; }
  var sub = (c.subItems||[]).filter(function(s){ return s.kind==='增加项目' && s.projectName===oldName && !s.done; })[0]; if(sub){ sub.projectName = it.name; sub.content = it.name + (qty>1 ? ' ×'+qty : ''); }
  logCaseEvent(c, by, '待付款在韩加项修正：'+before+' → '+it.name+'（×'+qty+'，'+formatCurrency(amount,'KRW')+'）');
  return {ok:true};
}
function coreAddOnDelete(c, idx, by){
  var it = (c.procedureItems||[])[idx]; if(!it || !it.pendingPay || c.visitClosed) return false;
  c.procedureItems.splice(idx, 1);
  c.subItems = (c.subItems||[]).filter(function(s){ return !(s.kind==='增加项目' && s.projectName===it.name && !s.done); });
  if(c.anesthesiaConsent && c.anesthesiaConsent.projects) c.anesthesiaConsent.projects = c.anesthesiaConsent.projects.filter(function(x){ return x.name!==it.name; });
  logCaseEvent(c, by, '待付款在韩加项删除：'+it.name+'（×'+(it.qty||1)+'，'+formatCurrency(it.price,'KRW')+'）');
  updateCaseStage(c);
  krCloseIfDone(c); /* 待付款删光、其余都完成 → 自动结案 */
  return true;
}
/* 施术备注：KR 室长 / 院长写，IN 只读（CMD-1012-15 一·6） */
function coreSubNote(c, id, text, by){
  var s = (c.subItems||[]).filter(function(x){ return x.id===id; })[0]; if(!s) return false; /* 备注：施术行 / 术后管理行 / 在韩持有都能写（KR 写，IN 只读） */
  s.note = String(text||'').trim(); s.noteBy = by; s.noteAt = nowFullDt();
  logCaseEvent(c, by, (s.note ? '施术备注：'+s.note : '清空施术备注'));
  return true;
}
/* IN：点「通知预约」的通知 → 预约弹窗（带入客人、来访目的），新案件自动关联原赴韩案件 */
var SUB_BOOK = null;
function openSubBookModal(caseId, subId){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0]; if(!c) return;
  var s = (c.subItems||[]).filter(function(x){ return x.id===subId; })[0]; if(!s) return;
  SUB_BOOK = {caseId:caseId, subId:subId};
  var ov = document.getElementById('sub-book-overlay');
  if(!ov){ ov = document.createElement('div'); ov.id = 'sub-book-overlay'; ov.className = 'modal-overlay'; ov.onclick = function(e){ if(e.target===ov) closeSubBookModal(); }; document.body.appendChild(ov); }
  var today = todayStr(), def = s.date > today ? s.date : today;
  ov.innerHTML = '<div class="modal-box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;"><span style="font-size:15px;font-weight:700;">预约来访（KR 通知：回印尼后要做）</span><span style="cursor:pointer;" onclick="closeSubBookModal()">✕</span></div>'+
    '<div style="font-size:13px;line-height:1.8;margin-bottom:12px;"><b>'+c.name+'</b>（'+c.caseNo+'）<br>子项 '+s.no+'：'+s.content+'（KR 建议约 '+s.date+'）</div>'+
    '<div class="field" style="margin-bottom:10px;"><label>日期</label><input type="date" id="sub-book-date" value="'+def+'" min="'+today+'"></div>'+
    '<div class="field" style="margin-bottom:10px;"><label>时间</label><select id="sub-book-time">'+WK_HOURS.filter(slotBookable).map(function(t0){ return '<option>'+t0+'</option>'; }).join('')+'</select></div>'+
    '<div class="field" style="margin-bottom:6px;"><label>来访目的</label><select id="sub-book-purpose"><option>术后管理</option><option>复诊</option></select></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-bottom:12px;">生成的新案件会自动关联原赴韩案件 '+c.caseNo+'（原因随来访目的：术后管理 / 复诊）</div>'+
    '<button class="btn-primary" style="width:100%;" onclick="confirmSubBook()">确认预约</button></div>';
  ov.classList.add('open');
}
function closeSubBookModal(){ var ov = document.getElementById('sub-book-overlay'); if(ov) ov.classList.remove('open'); }
function confirmSubBook(){
  if(!SUB_BOOK) return;
  var c = CASE_ITEMS.filter(function(x){ return x.id===SUB_BOOK.caseId; })[0], s = c && (c.subItems||[]).filter(function(x){ return x.id===SUB_BOOK.subId; })[0]; if(!s) return;
  var date = document.getElementById('sub-book-date').value, time = document.getElementById('sub-book-time').value, purpose = document.getElementById('sub-book-purpose').value;
  var why = slotBlockReason(date, time); if(why){ alert(why); return; }
  var nc = createReservationCase(c.name, null, date, time, null, purpose);
  nc.linkedCase = {caseId:c.id, reason:(purpose==='复诊' ? '复诊' : '术后管理'), auto:true};
  s.booked = nc.caseNo;
  logCaseEvent(c, actingName(), 'IN 室长预约了 '+s.no+'「'+s.content+'」：新案件 '+nc.caseNo+'（'+date+' '+time+'，'+purpose+'），已关联本案件');
  logCaseEvent(nc, actingName(), '由赴韩案件 '+c.caseNo+' 的子项 '+s.no+'「'+s.content+'」预约，自动关联原案件');
  closeSubBookModal(); renderCalendar(); if(typeof renderSubBookCard==='function') renderSubBookCard();
  showToast('预约已生成', c.name+' · '+date+' '+time+'，新案件 '+nc.caseNo+' 已关联 '+c.caseNo, null);
}

/* 确认后修改日期：施术前2周内置灰不可点；月历默认打开原定日期所在月份（2026-09-29 第十轮修复） */
function startKrScheduleChange(){
  var c = getCurrentCase(); if(!c || !c.krSchedule || c.krSchedule.status!=='confirmed') return;
  var orig = new Date(c.krSchedule.confirmedDate);
  KR_SCHED_VIEW_MONTH = new Date(orig.getFullYear(), orig.getMonth(), 1);
  c.krSchedule.status = 'change_pending';
  c.krSchedule.changePrimary = '';
  c.krSchedule.changeBackup = '';
  c.krSchedule.changeSubmitted = false;
  logCaseEvent(c, actingName(), '申请修改施术日期');
  buildCaseLog(c);
  renderCaseBody(c);
}

/* 取消修改：回到等待施术，原日期不变（2026-09-29 第十轮新增） */
function cancelKrScheduleChange(){
  var c = getCurrentCase(); if(!c || !c.krSchedule || c.krSchedule.status!=='change_pending') return;
  c.krSchedule.status = 'confirmed';
  c.krSchedule.changePrimary = '';
  c.krSchedule.changeBackup = '';
  c.krSchedule.changeSubmitted = false;
  logCaseEvent(c, actingName(), '取消修改施术日期，原日期 '+c.krSchedule.confirmedDate+' 继续有效');
  buildCaseLog(c);
  renderCaseBody(c);
}

/* KR排不上不自动取消（2026-09-29 第十轮改正）：回到可重新选日期的状态，原确认日期继续有效，
   界面显示"时间变更待确认"（即 change_pending 状态本身）；只有IN室长手动点"无法协调"才真正取消退定金 */
/* KR端三步操作（2026-09-29 第十轮改）：已到医院/付清尾款/施术完成 都由KR端操作，IN端只显示状态，
   原型里用演示按钮模拟；施术完成即案件结案（"案件=一次赴韩行程"） */
/* ［+ 追加项目］在赴韩项目列表下方（CMD-1012-12 一·4） */
function krAddMoreHtml(c){
  if(c.addingMore) return '<div style="margin-top:14px;border-top:1px solid var(--border2);padding-top:14px;">'+projectPickerHtml(c, true)+'</div>';
  var canAdd = !isEnded(c) && !c.hasArrived && !c.visitClosed && !c.krBalancePaid;
  return canAdd ? '<div style="margin-top:12px;"><button class="btn-outline" onclick="addMoreProjects()">+ 追加项目</button></div>' : '';
}
function krProcedureTabHtml(c){
  var sub = c.krSubTab || 'main';
  var tabsHtml = c.settlementDone ? '<div style="display:flex;gap:8px;margin-bottom:12px;"><span class="chip'+(sub==='main'?' active':'')+'" onclick="setKrSubTab(\'main\')">施术日期与项目</span><span class="chip'+(sub==='timeline'?' active':'')+'" onclick="setKrSubTab(\'timeline\')">在韩 timeline'+((c.subItems||[]).length?'（'+c.subItems.length+'）':'')+'</span></div>' : '';
  if(sub==='timeline' && c.settlementDone) return '<div class="card" style="padding:22px 24px;">'+tabsHtml+krTimelineTabHtml(c)+'</div>';
  return krProcedureTabMain(c, tabsHtml);
}
function krProcedureTabMain(c, tabsHtml){
  var ks = c.krSchedule;
  var st = scheduleState(c);
  var monthLabel = KR_SCHED_VIEW_MONTH.getFullYear()+'年'+(KR_SCHED_VIEW_MONTH.getMonth()+1)+'月';
  var monthNav = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><span style="cursor:pointer;" onclick="krScheduleMonthShift(-1)">‹</span><b>'+monthLabel+'</b><span style="cursor:pointer;" onclick="krScheduleMonthShift(1)">›</span></div>';
  var hasActive = krActiveItems(c).length>0;
  var body = '';
  if(hasActive && c.krBalancePaid && st==='Arrived'){ body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div><div style="font-size:12px;color:var(--sage);">✓ 已到院、尾款已付清（施术日期 '+ks.confirmedDate+'）；详细记录见「Timeline」。</div>'; }
  else if(hasActive){
    /* 施术日期卡片（Schedule）：Draft / Pending / Confirmed / Changing / Arrived，案件主状态直接读这里 */
    var canModify = ks && ks.status==='confirmed' && !c.hasArrived; /* 到医院前都可改日期（CMD-1012-13，拿掉施术前 2 周限制） */
    if(st==='Draft'){
      ks = ensureKrScheduleDraft(c);
      body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+(ks.rejectNote ? '<div style="background:#FDEBD3;color:#A85A10;border-radius:8px;padding:9px 12px;font-size:12px;margin-bottom:10px;">KR 无法安排所选日期：'+ks.rejectNote+'。请在对话里沟通后重新选日期。</div>' : '')+
        '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;">只能选择KR室长已开放的日期（浅色为未开放）</div>'+
        monthNav+
        '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">第一次点击选首选，第二次点击选备选，再点一次已选日期取消选择</div>'+
        krDateCalendarGridHtml('primary','backup', ks.primary, ks.backup)+
        '<button class="btn-primary" style="width:100%;margin-top:16px;" onclick="submitKrScheduleDate()">递交施术日期</button>'+
        '<button class="btn-outline" style="width:100%;margin-top:10px;" onclick="requestCannotCoordinate()">无法协调</button>'; /* ［无法协调］只在时间确认前（待递交 / 待确认）出现 */
    } else if(st==='Pending'){
      body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+
        '<div style="font-size:13px;color:var(--slate2);margin-bottom:14px;">已提交首选 '+ks.primary+(ks.backup?'　备选 '+ks.backup:'')+'，等待Kr室长确认</div>'+
        '<div style="font-size:12px;color:var(--muted);margin-bottom:12px;">等待 KR 室长选定日期、填到院时间和地址（或回复无法安排）</div>'+
        '<button class="btn-outline" onclick="requestCannotCoordinate()">无法协调</button>';
    } else if(st==='Confirmed'){
      body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+
        '<div class="card" style="padding:14px 16px;margin-bottom:14px;">施术日期 '+ks.confirmedDate+'，到院时间 '+ksTimeText({confirmedDate:ks.confirmedDate, confirmedTime:ks.confirmedTime}).replace(ks.confirmedDate+' ','')+(ks.address?'，地址：'+ks.address:'')+'，请转告客人'+(ks.rejectNote?'<div style="font-size:12px;color:#A85A10;margin-top:6px;">KR 无法安排新日期：'+ks.rejectNote+'（原日期继续有效）</div>':'')+'</div>'+
        (c.hasArrived
          ? '<div style="font-size:12px;color:var(--terracotta);margin-bottom:12px;">KR 已在韩国重新预约施术时间；到过医院之后 IN 端不能再修改日期或取消项目，客人再到医院时由 KR 重新标记"已到医院"</div>'
          : '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">'+
            (canModify ? '<button class="btn-outline" onclick="startKrScheduleChange()">修改日期</button>' : '<button class="btn-outline" style="opacity:.5;cursor:not-allowed;" disabled>修改日期</button>')+
            '<button class="btn-outline" onclick="openCancelItems()">取消项目</button>'+ /* 时间确认后：［无法协调］拿掉，同一位置改为［取消项目］（CMD-1012-12） */
            '</div>'+
            '')+
        '<div style="border-top:1px solid var(--border2);padding-top:14px;font-size:12px;color:var(--muted);">已到医院 / 付清尾款 / 子项完成均由 KR 端操作，这里只显示状态；KR 同一天内可调整到院时间和地址（会通知你）</div>';
    } else if(st==='Changing'){
      if(!ks.changeSubmitted){
        body = '<div class="info-heading" style="margin-bottom:8px;">修改施术日期</div>'+
          '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;">原定 '+ksTimeText(ks)+'，请选择新的日期</div>'+
          monthNav+
          '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">第一次点击选新首选，第二次点击选新备选，再点一次已选日期取消选择</div>'+
          krDateCalendarGridHtml('changePrimary','changeBackup', ks.changePrimary, ks.changeBackup)+
          '<div style="display:flex;gap:10px;margin-top:16px;">'+
          '<button class="btn-primary" style="flex-grow:1;" onclick="submitKrScheduleChangeDate()">提交新日期</button>'+
          '<button class="btn-outline" onclick="cancelKrScheduleChange()">取消修改</button>'+
          '</div>';
      } else {
        body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+
          '<div style="font-size:13px;color:var(--slate2);margin-bottom:14px;">原定 '+ksTimeText(ks)+'，已提交新首选 '+ks.changePrimary+(ks.changeBackup?'　新备选 '+ks.changeBackup:'')+'，等待Kr室长确认（原日期继续有效）</div>'+
          '<div style="font-size:12px;color:var(--muted);margin-bottom:12px;">等待 KR 室长确认新时间（或回复无法安排，原日期继续有效）</div>'+
          '<div style="display:flex;gap:10px;">'+
          '<button class="btn-outline" onclick="cancelKrScheduleChange()">取消修改</button>'+
          '<button class="btn-outline" onclick="openCancelItems()">取消项目</button>'+
          '</div>';
      }
    } else { /* Arrived：之后IN不能再操作，只显示状态，KR端用演示按钮模拟 */
      body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+
        '<div class="card" style="padding:14px 16px;margin-bottom:14px;">施术日期 '+ksTimeText(ks)+'（KR已标记已到医院，IN端不能再修改日期、无法协调或取消项目）</div>'+
        krArrivedOpsHtml(c);
    }
  } else {
    body = '<div style="font-size:13px;color:var(--muted);">没有进行中的赴韩项目</div>';
  }
  /* 赴韩项目行（KRItem）：未开始 / 已完成 / 已取消 / 已更换（原项目名划线），IN 端只读；项目上的黄色小标签 = ItemFlag */
  var pillStyle = {'待付款':['#FDECEA','#B3261E'], '未开始':['var(--terracotta-bg)','var(--terracotta)'], '已完成':['var(--sage-bg)','var(--sage)'], '已取消':['#EDEAE2','var(--muted)'], '已更换':['var(--blue-bg)','var(--blue)']};
  var itemsHtml = '<div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--border2);">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><div style="font-size:12px;font-weight:700;color:var(--terracotta);">赴韩项目（韩国那边施术，印尼只读，无法操作）</div>'+'</div>'+
    (function(){ /* 在韩加的项目同一项目（同规格）加多次合并成一行写「×N」，并标「在韩增加」（CMD-1013-09 五） */
      var gl = [];
      krAllItems(c).forEach(function(it){ var added = !!(it.krAddOn || it.preBalanceAdd || it.swappedFrom), g = (added && !it.cancelled) ? gl.filter(function(x){ return x.added && !x.it.cancelled && x.it.name===it.name; })[0] : null; if(g){ g.n += (it.qty||1); g.all.push(it); } else gl.push({it:it, n:(it.qty||1), all:[it], added:added}); });
      return gl;
    })().map(function(g){
      var it = g.it, stText = g.all.length>1 ? (g.all.every(function(x){ return x.done; }) ? '已完成' : (g.all.some(function(x){ return x.pendingPay; }) ? '待付款' : '未开始')) : krItemStatus(it), pc = pillStyle[stText];
      var nameHtml = it.replacedBy
        ? '<span style="text-decoration:line-through;color:var(--muted);">'+it.name+'</span> → 更换为 <b>'+it.replacedBy+'</b>'
        : '<span style="'+(it.cancelled?'text-decoration:line-through;color:var(--muted);':'')+'">'+it.name+(g.n>1 ? ' ×'+g.n : '')+'</span>'+(g.added ? ' <span class="status-pill" style="background:#E8F0FB;color:#2F5FA8;font-size:10px;">在韩增加</span>' : '');
      var flags = krItemFlags(c, it).map(function(f){ return '<span class="status-pill" style="background:#FBF0C9;color:#A8740A;font-size:10px;margin-left:6px;">⚠ '+f+'</span>'; }).join('');
      return '<div class="case-field-row" style="flex-wrap:wrap;"><span style="flex-grow:1;font-size:13px;">'+nameHtml+flags+'</span>'+
        '<span class="status-pill" style="background:'+pc[0]+';color:'+pc[1]+';">'+stText+'</span>'+itemArrangeHtml(it, true)+'</div>';
    }).join('')+
    '</div>';
  var unableBanner = '';
  var unableBtn = '';
  var recHtml = hasActive ? recSummaryHtml(krActiveItems(c).filter(function(it){ return !(c.krScope && c.krScope.items && c.krScope.items.length) || !(it.krAddOn || it.preBalanceAdd || it.swappedFrom); }).map(function(it){ /* 推荐项目整理保持原诊疗方案：在韩加的（到院加项 / 施术中增加 / 更换）不混进来（CMD-1013-09 四） */ return {name:it.name, stay:it.stay, anesthesia:it.anesthesia, postcare:it.postcare, note:it.itemNote||it.note||''}; }), c.krScope && c.krScope.overallNote, {print:true, inNote:c.recInNote}) : ''; /* 推荐项目整理 + ［打印］给客人（CMD-1012-02 C5）；IN 室长备注一起印出（CMD-1012-05 三·3） */
  if(recHtml) recHtml = '<div style="margin:10px 0 0;"><input type="text" placeholder="IN 室长备注（选填，打印时一起印出）" value="'+String(c.recInNote||'').replace(/"/g,'&quot;')+'" onchange="setRecInNote(this.value)" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;box-sizing:border-box;"></div>'+recHtml;
  return '<div class="card" style="padding:22px 24px;">'+(tabsHtml||'')+subStatusRowHtml(caseSubStatusItems(c))+recHtml+body+itemsHtml+krAddMoreHtml(c)+innCareCardHtml(c)+'</div>';
}

function markConsultPaid(){
  var c = getCurrentCase(); if(!c) return;
  c.consultStatus = 'paid_waiting_kr'; c.consultPaidAt = nowFullDt(); /* 催办用：缴费后超过 30 分钟 KR 还没确认时间就可催办 */
  recordConsultFee(c); /* 正常情况下选面诊时已记；没有记录的老数据在缴费时补记 */
  if(!SEEDING) pushKrNotif(caseKrHospital(c), '客人已缴面诊费：'+c.name+'（'+c.caseNo+'，'+((clinicById(c.clinicId)||{}).name||'')+'）→ 请确认报告时间', {caseId:c.id, kind:'consultpaid'});
  updateCaseStage(c); /* 缴费后离开"接待中"，进入面诊安排 */
  ensureCaseRoom(c); /* CMD-1008-14：缴完面诊费自动建案件对话房（不通知、不响铃），KR 一开始就能在房里留言 */
  logCaseEvent(c, '客人', '完成面诊费支付，已在Main对话群自动通知');
  buildCaseLog(c); renderCaseHeaderActions(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

function applyWaiveFee(c, reason, note){
  c.consultFeeWaived = {reason: reason==='其他' ? '其他：'+note : reason, note:note};
  c.consultStatus = 'paid_waiting_kr'; c.consultPaidAt = nowFullDt(); /* 免除后照正常流程：待确认报告时间 */
  if(!SEEDING) pushKrNotif(caseKrHospital(c), '面诊费已免除：'+c.name+'（'+c.caseNo+'，'+((clinicById(c.clinicId)||{}).name||'')+'）→ 请确认报告时间', {caseId:c.id, kind:'consultpaid'});
  updateCaseStage(c);
  ensureCaseRoom(c); /* 免除面诊费同样自动建房 */
  logCaseEvent(c, actingName(), '免除面诊费（原因：'+c.consultFeeWaived.reason+'）');
  buildCaseLog(c); renderCaseHeaderActions(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

/* 确认 / 修改预计出报告时间（KR 端操作，KR-CASE-01）：改案件状态 + 两边 Timeline + IN 通知；不碰界面，KR 页面在 Store.mutateClinic 里调用
   isChange=false：待确认报告时间 → 等待报告；isChange=true：等待报告时修改，Timeline 记原时间和新时间 */
/* ---- 面诊时间（CMD-1008-12 C3；KR-CASE-01 2026-10-08 修订）：KR 室长确认两个时间 ——
   ① 面诊时间 c.consultAt = {date, time}（韩国当地时间，给院长，默认今天；确认后进院长日程 / 院长大盘 / KR 日历）；
   ② 预计出报告时间 c.reportEta（UTC，给客人 / IN，默认 = 面诊时间 + 30 分钟，可手动改；IN 的倒计时按它）。
   面诊块在院长日程里占 [面诊时间, max(面诊时间 + 30 分钟, 预计出报告时间)]，受「同一位院长同一时间只能有一件事」校验 ---- */
function consultBlockMinutes(c){
  var base = 30, ca = c.consultAt; if(!ca || !c.reportEta) return base;
  var eta = fmtUtc(c.reportEta, KR_TZ).split(' '); /* 预计出报告时间换成韩国当地 */
  if(eta[0]===ca.date){ var d = timeToMin(eta[1]) - timeToMin(ca.time); if(d > base) return Math.min(d, 240); }
  return base;
}
function syncConsultBlock(c){
  var hid = caseKrHospital(c), h = HOSPITAL_DATA[hid]; if(!h || !c.director) return;
  h.directorSchedule = h.directorSchedule || {};
  Object.keys(h.directorSchedule).forEach(function(n){ var arr = h.directorSchedule[n]||[]; for(var i = arr.length-1; i >= 0; i--){ if(arr[i].kind==='面诊' && arr[i].caseId===c.id && arr[i].clinicId===c.clinicId) arr.splice(i, 1); } });
  if(!c.consultAt) return;
  var arr2 = (h.directorSchedule[c.director] = h.directorSchedule[c.director] || []);
  var st = c.consultAt.time, en = minToTime(Math.min(24*60-1, timeToMin(st)+consultBlockMinutes(c)));
  arr2.push({id:'sb'+(SCHED_SEQ++)+Math.floor(Math.random()*1000), who:c.director, date:c.consultAt.date, time:st, end:en, type:'面诊', title:'面诊', note:'', kind:'面诊', caseId:c.id, clinicId:c.clinicId, name:c.name});
}
function coreConfirmConsultTimes(c, consultDate, consultTime, etaUtc, by){
  if(!c || c.consultStatus!=='paid_waiting_kr') return false;
  c.consultAt = {date:consultDate, time:consultTime};
  var ok = coreSetReportEta(c, etaUtc, by, false);
  if(!ok) return false;
  logCaseEvent(c, by, 'KR确认面诊时间：'+consultDate+' '+consultTime+'（韩国时间，院长 '+(c.director||'—')+'）');
  syncConsultBlock(c);
  if(c.director) pushKrNotif(caseKrHospital(c), '需要处理：'+consultDate+' '+consultTime+'（韩国时间）面诊 '+c.name+'（'+(c.caseNo||'')+'）', {to:'director', director:c.director, caseId:c.id, clinicId:c.clinicId||CURRENT_CLINIC_ID, level:'action'}); /* 通知该院长：几点要面诊哪位客人（CMD-1012-10 修改2） */
  return true;
}
/* 开始面诊：室长账号室长按、院长账号院长按，谁先按都算 → 小状态「面诊中」；上传内容 = 面诊结束（CMD-1012-05 一·2） */
function coreStartConsult(c, by){
  if(!c || c.consultStatus!=='awaiting_report' || c.consultStartedAt || c.consultContentAt) return false;
  c.consultStartedAt = nowFullDt(); c.consultStartedBy = by;
  logCaseEvent(c, by, '开始面诊');
  updateCaseStage(c);
  pushKrNotif(caseKrHospital(c), by+' 开始面诊：'+c.name+'（'+(c.caseNo||'')+'）', {to:'coord', caseId:c.id, clinicId:c.clinicId||CURRENT_CLINIC_ID, level:'next'}); /* 开始面诊 → KR 室长（自己触发的不收，见 krNotifsForMe） */
  pushNotif('面诊', '开始面诊：'+c.name+'（'+(c.caseNo||'')+'）'+by, {caseId:c.id, level:'info'}); /* IN 一般消息 */
  return true;
}
function coreSetReportEta(c, eta, by, isChange){
  if(!c) return false;
  if(isChange){
    if(c.consultStatus!=='awaiting_report') return false;
    var old = c.reportEta || '—';
    c.reportEta = eta; c.reportOverdue = false; c.overdueNotified = false;
    if(c.director && c.consultAt) pushKrNotif(caseKrHospital(c), '需要处理：面诊 '+c.name+'（'+(c.caseNo||'')+'）的时间有变动（面诊 '+c.consultAt.date+' '+c.consultAt.time+'，预计出诊疗方案 '+tkU(eta)+'）', {to:'director', director:c.director, caseId:c.id, clinicId:c.clinicId||CURRENT_CLINIC_ID, level:'action'}); /* 修改时间也通知院长 */
    logCaseEvent(c, by, 'KR修改预计出报告时间：'+tkU(old)+' → '+tkU(eta));
    syncConsultBlock(c);
    pushNotif('面诊','KR 修改了预计出报告时间：'+c.name+'（'+tkU(old)+' → '+tkU(eta)+'）', {caseId:c.id});
  } else {
    if(c.consultStatus!=='paid_waiting_kr') return false;
    syncKrCoordinator(c);
    c.reportEta = eta; c.reportOverdue = false; c.overdueNotified = false;
    c.consultStatus = 'awaiting_report';
    logCaseEvent(c, by, 'KR确认预计出报告时间：'+tkU(eta));
    pushNotif('面诊','KR 确认预计出报告时间：'+c.name+' '+tkU(eta), {caseId:c.id});
  }
  updateCaseStage(c);
  return true;
}
/* 演示：超过预计时间还没出报告——小状态变橘色"已超过预计时间"，只提醒，状态不变 */
function simulateReportTimeout(){
  var c = getCurrentCase(); if(!c || c.consultStatus!=='awaiting_report') return;
  var first = !c.overdueNotified; /* 超时只发一条通知、只记一条 Timeline：自动检查和这个演示按钮共用 overdueNotified */
  c.reportOverdue = true; c.overdueNotified = true;
  if(first) logCaseEvent(c, '系统', '已超过预计出报告时间（'+tkU(c.reportEta)+'），报告还没提交（仅提醒，状态不变）');
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
  if(first) pushNotif('面诊','等待报告超过预计时间：'+c.name+'（预计 '+tkU(c.reportEta)+'）', {caseId:c.id});
}

/* ================= case library (案例库 · 2026-10-02 重写，取代院长/部位/问题/产品节点结构) =================
   案例必须挂在"项目"上（必选、可多选），项目来自项目库：赴韩施术的案例选赴韩项目，印尼管理的案例选本地项目；部位/分类由项目所属的项目库分类自动带出。
   "院长"：赴韩案例从 KR 院长名单选（或"-"），不在名单上（停用/离职）显示"-"（不可点击）。"问题"：印尼管理案例的标签，手动维护，可多选。
   首页两种查看方式：按部位（赴韩项目分类 + 皮肤管理=全部本地项目）/ 按施术·管理（赴韩施术、印尼管理两区）；部位/分类 → 项目卡片 → 案例列表 → 案例详情，每层有面包屑。 */
var RECOVERY_OPTIONS = ['1周','1个月','3个月','6个月','1年','自定义'];

var RECOVERY_RANK = {'1周':1,'1个月':2,'3个月':3,'6个月':4,'1年':5};

function recoveryText(ph){ return ph.recovery==='自定义' ? (ph.recoveryCustom||'自定义') : (ph.recovery||'—'); }

function recoveryRank(ph){ return RECOVERY_RANK[ph.recovery] || 6; }

function sortedAfter(c){ return (c.afterPhotos||[]).slice().sort(function(a,b){ return recoveryRank(a)-recoveryRank(b); }); }

function libCanEdit(source){ return (DEMO_ROLE==='in' && source==='local') || (DEMO_ROLE==='kr' && source==='travel'); }
 /* IN 只能维护印尼管理；赴韩施术只有 KR 室长维护 */

/* ---- 问题标签（印尼管理案例，手动维护） ---- */
var LIB_PROBLEM_SEQ = 1;

var LIB_PROBLEMS = {};

function addLibProblem(label){ var id = 'pb'+(LIB_PROBLEM_SEQ++); LIB_PROBLEMS[id] = {id:id, label:label}; return id; }

var LIB_PROBLEM_IDS = {};

['色素沉着','暗沉','毛孔粗大','痘印','脱发','松弛'].forEach(function(l){ LIB_PROBLEM_IDS[l] = addLibProblem(l); });

var LIB_CASE_SEQ = 1;

function newLibCaseId(){ return 'lc'+(LIB_CASE_SEQ++); }

var LIB_CASES = [];
 /* 种子数据在项目库建好之后（libSeedDemo） */

/* ---- 项目 → 案例 ---- */
/* 案例库按医院区分（2026-10-06）：赴韩施术的案例/项目属于医院，首页可切换医院，卡片上标明医院；印尼管理的不受影响 */
var LIB_HOSPITAL = 'all';
function libHospOk(x){ var travel = (x.source==='travel') || (x.origin==='KR'); return !travel || LIB_HOSPITAL==='all' || x.hospitalId===LIB_HOSPITAL; }
function setLibHospital(v){ LIB_HOSPITAL = v; libGo('home', {groupId:null, projectId:null, caseId:null}); }
function libCasesOfProject(pid){ return LIB_CASES.filter(function(c){ return libHospOk(c) && (c.projectIds||[]).indexOf(pid)>-1; }); }

function libLatestCase(list){ return list.slice().sort(function(a,b){ return (b.uploadedAt||'').localeCompare(a.uploadedAt||''); })[0] || null; }

function libCoverPhoto(c){ var a = sortedAfter(c); return a.length ? a[a.length-1] : ((c.beforePhotos||[])[0] || null); }
 /* 封面 = 该节点最新案例的术后照片（最后恢复时间那张） */
function libPhotoBox(ph, w, h, cap){
  var inner = (ph && ph.url) ? '<img src="'+ph.url+'" style="width:100%;height:100%;object-fit:cover;display:block;">'
    : '<div style="width:100%;height:100%;background:linear-gradient(135deg,'+((ph&&ph.color)||'#D9CFC1')+',#EFE9DE);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--slate2);">'+(cap||'暂无照片')+'</div>';
  return '<div style="width:'+w+';height:'+h+';border-radius:10px;overflow:hidden;">'+inner+'</div>';
}

/* 部位/分类分组：按部位 = 赴韩项目各分类 + "皮肤管理"（全部本地项目）；按施术/管理 = 赴韩施术(赴韩分类) / 印尼管理(本地分类) */
function libGroupProjects(groupId){
  if(groupId==='skin') return PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN'; });
  var catId = groupId.replace('cat:','');
  return PROJECT_LIBRARY.filter(function(p){ return p.categoryId===catId && libHospOk(p); });
}

function libGroupLabel(groupId){ return groupId==='skin' ? '皮肤管理' : ((PROJECT_CATEGORIES[groupId.replace('cat:','')]||{}).label || groupId); }

function libCasesOfGroup(groupId){
  var ids = libGroupProjects(groupId).map(function(p){ return p.id; });
  return LIB_CASES.filter(function(c){ return (c.projectIds||[]).some(function(x){ return ids.indexOf(x)>-1; }); });
}

function libGroupCards(view){
  /* 返回 [{zone, groups:[{id,label,cases}]}]，没有案例的不显示 */
  var kr = projLibCategories('KR').map(function(cat){ return {id:'cat:'+cat.id, label:cat.label}; });
  var inn = projLibCategories('IN').map(function(cat){ return {id:'cat:'+cat.id, label:cat.label}; });
  var fill = function(arr){ return arr.map(function(g){ g.cases = libCasesOfGroup(g.id); return g; }).filter(function(g){ return g.cases.length; }); };
  if(view==='part') return [{zone:'', groups:fill(kr.concat([{id:'skin', label:'皮肤管理'}]))}];
  return [{zone:'赴韩施术', groups:fill(kr)}, {zone:'印尼管理', groups:fill(inn)}];
}

function libGo(level, patch){
  LIB_STATE = Object.assign({level:level, groupId:LIB_STATE.groupId, projectId:LIB_STATE.projectId, caseId:LIB_STATE.caseId, filters:{director:'all', problem:'all', recovery:'all'}, compare:[]}, patch||{});
  renderLibrary();
}

function setLibView(v){ LIB_VIEW = v; libGo('home', {groupId:null, projectId:null, caseId:null}); }

function libOpenProject(pid){ /* 从任何地方直达某个项目的案例列表（案件里"查看相关案例"、详情页项目链接） */
  var pr = projById(pid); if(!pr) return;
  var gid = pr.origin==='IN' ? (LIB_VIEW==='part' ? 'skin' : 'cat:'+pr.categoryId) : 'cat:'+pr.categoryId;
  if(CURRENT_PAGE_ID!=='in-library' && !(typeof krShowBind==='function' && CURRENT_PAGE_ID==='in-admin')) nav('in-library'); /* KR 端案例库在管理页壳里，不用跳转 */
  libGo('cases', {groupId:gid, projectId:pid, caseId:null});
}

function libOpenCase(id){
  var c = LIB_CASES.filter(function(x){ return x.id===id; })[0]; if(!c) return;
  var pid = (c.projectIds||[])[0];
  var pr = pid ? projById(pid) : null;
  var gid = LIB_STATE.groupId || (pr ? (pr.origin==='IN' ? (LIB_VIEW==='part'?'skin':'cat:'+pr.categoryId) : 'cat:'+pr.categoryId) : null);
  var projectId = LIB_STATE.projectId || pid;
  if(CURRENT_PAGE_ID!=='in-library' && !(typeof krShowBind==='function' && CURRENT_PAGE_ID==='in-admin')) nav('in-library'); /* KR 端案例库在管理页壳里，不用跳转 */
  libGo('detail', {groupId:gid, projectId:projectId, caseId:id});
}

function libCrumbsHtml(){
  var st = LIB_STATE, crumbs = [{label:'案例库', fn:"setLibView(LIB_VIEW)"}];
  if(st.level!=='home'){
    crumbs.push({label: LIB_VIEW==='part' ? '按部位' : '按施术 / 管理', fn:"libGo('home',{groupId:null,projectId:null,caseId:null})"});
    if(st.groupId) crumbs.push({label:libGroupLabel(st.groupId), fn:"libGo('projects',{caseId:null,projectId:null})"});
    if(st.projectId && (st.level==='cases' || st.level==='detail')){ var pr = projById(st.projectId); crumbs.push({label:pr?pr.name:'项目', fn:"libGo('cases',{caseId:null})"}); }
    if(st.level==='detail'){ var c = LIB_CASES.filter(function(x){ return x.id===st.caseId; })[0]; crumbs.push({label:c?c.title:'案例', fn:null}); }
  }
  return '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:13px;">'+crumbs.map(function(cr,i){
    var last = i===crumbs.length-1;
    return (i? '<span style="color:var(--dim);">›</span>' : '')+(cr.fn && !last ? '<a href="#" class="info-link" onclick="'+cr.fn+';return false;">'+cr.label+'</a>' : '<b>'+cr.label+'</b>');
  }).join('')+'</div>';
}


/* ---- 首页 / 项目卡片 / 案例列表 ---- */
function libNodeCardHtml(label, cases, onclick, tag){
  var latest = libLatestCase(cases), cover = latest ? libCoverPhoto(latest) : null;
  return '<div class="card" style="overflow:hidden;cursor:pointer;" onclick="'+onclick+'">'+libPhotoBox(cover,'100%','120px',latest?latest.title:'')+
    '<div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px;"><b style="font-size:13px;">'+label+'</b>'+
    '<span style="display:flex;gap:6px;align-items:center;">'+(tag||'')+'<span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+cases.length+' 个案例</span></span></div></div>';
}

function libRenderHome(){
  var zones = libGroupCards(LIB_VIEW);
  return zones.map(function(z){
    return (z.zone ? '<div class="info-heading" style="margin:6px 0 10px;">'+z.zone+'</div>' : '')+
      '<div style="'+LIB_GRID_CSS+'margin-bottom:18px;">'+(z.groups.map(function(g){ return libNodeCardHtml(g.label, g.cases, "libGo('projects',{groupId:'"+g.id+"'})"); }).join('') || '<div style="font-size:12px;color:var(--muted);">暂无案例</div>')+'</div>';
  }).join('');
}

function libRenderProjects(){
  var projs = libGroupProjects(LIB_STATE.groupId).filter(function(p){ return libCasesOfProject(p.id).length; }); /* 没有案例的项目不显示 */
  return '<div style="'+LIB_GRID_CSS+'">'+(projs.map(function(p){
    return libNodeCardHtml(p.name, libCasesOfProject(p.id), "libGo('cases',{projectId:'"+p.id+"'})", p.active ? '' : '<span class="status-pill" style="background:#EDEAE2;color:var(--muted);">已非活性</span>');
  }).join('') || '<div style="font-size:12px;color:var(--muted);padding:20px 4px;">这个部位 / 分类下还没有案例</div>')+'</div>';
}

function libDirectorClickable(c){ return c.source==='travel' && c.director && isDirectorActive(c.director); }

function libCaseCardHtml(c){
  var recovery = sortedAfter(c).length ? recoveryText(sortedAfter(c).slice(-1)[0]) : '—';
  var srcLabel = c.source==='travel' ? '医院案例' : '印尼案例';
  var srcColor = c.source==='travel' ? ['var(--sage-bg)','var(--sage)'] : ['var(--terracotta-bg)','var(--terracotta)'];
  var dirRow = '';
  if(c.source==='travel'){
    dirRow = '<div style="font-size:11px;color:var(--slate2);">医院：'+hospitalName(c.hospitalId||'H1','ko')+'</div>' + (libDirectorClickable(c)
      ? '<div style="font-size:11px;color:var(--slate2);">院长：<a href="#" class="info-link" onclick="event.stopPropagation();openDirectorDetail(\''+c.director+'\');return false;">'+c.director+'</a></div>'
      : '<div style="font-size:11px;color:var(--muted);">院长：-</div>'); /* 不在名单上（停用/离职）显示"-"，不可点击 */
  }
  return '<div class="card" style="overflow:hidden;cursor:pointer;" onclick="libOpenCase(\''+c.id+'\')">'+libPhotoBox(libCoverPhoto(c),'100%','120px',c.title)+
    '<div style="padding:12px 14px;display:flex;flex-direction:column;gap:5px;"><b style="font-size:13px;">'+c.title+'</b>'+
    '<span style="font-size:11px;color:var(--slate2);">最新术后：'+recovery+'</span>'+dirRow+
    '<div style="margin-top:4px;"><span class="status-pill" style="background:'+srcColor[0]+';color:'+srcColor[1]+';">'+srcLabel+'</span></div></div></div>';
}

function setLibFilterVal(k, v){ LIB_STATE.filters[k] = v; renderLibrary(); }

function libRenderCases(){
  var pr = projById(LIB_STATE.projectId);
  var all = libCasesOfProject(LIB_STATE.projectId).sort(function(a,b){ return (b.uploadedAt||'').localeCompare(a.uploadedAt||''); }); /* 默认按最新上传排序 */
  var f = LIB_STATE.filters, isTravel = pr && pr.origin==='KR';
  var items = all.filter(function(c){
    if(isTravel && f.director!=='all' && c.director!==f.director) return false;
    if(!isTravel && f.problem!=='all' && (c.problemIds||[]).indexOf(f.problem)<0) return false;
    if(f.recovery!=='all' && !(c.afterPhotos||[]).some(function(a){ return a.recovery===f.recovery; })) return false;
    return true;
  });
  var sel = function(k, opts, cur, label){ return '<select onchange="setLibFilterVal(\''+k+'\',this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;"><option value="all">'+label+'：全部</option>'+opts.map(function(o){ return '<option value="'+o.v+'"'+(cur===o.v?' selected':'')+'>'+o.l+'</option>'; }).join('')+'</select>'; };
  var dirHs = LIB_HOSPITAL==='all' ? linkedHospitalIds() : [LIB_HOSPITAL], dirs = [];
  dirHs.forEach(function(h){ hospitalDirectorNames(h).forEach(function(d){ dirs.push({v:d, l:d}); }); }); /* 院长筛选的数据来自所选医院的 KR 院长名单（Notion IN-SHOW-01） */
  var filters = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">'+
    (isTravel ? sel('director', dirs, f.director, '院长') : sel('problem', Object.keys(LIB_PROBLEMS).map(function(id){ return {v:id, l:LIB_PROBLEMS[id].label}; }), f.problem, '问题'))+
    sel('recovery', RECOVERY_OPTIONS.filter(function(r){ return r!=='自定义'; }).map(function(r){ return {v:r, l:r}; }), f.recovery, '恢复时间')+
    (!isTravel && libCanEdit('local') ? '<button class="btn-ghost" style="font-size:11px;" onclick="openLibProblemModal()">管理问题标签</button>' : '')+'</div>';
  return filters+'<div style="'+LIB_GRID_CSS+'">'+(items.map(libCaseCardHtml).join('') || '<div style="grid-column:1/-1;font-size:12px;color:var(--muted);padding:20px 4px;">没有符合条件的案例</div>')+'</div>';
}

/* ---- 案例详情页（页内跳转，2026-10-02） ---- */
function libFindCase(id){ return LIB_CASES.filter(function(x){ return x.id===id; })[0]; }

function libToggleCompare(key){
  var cmp = LIB_STATE.compare, i = cmp.indexOf(key);
  if(i>-1) cmp.splice(i,1); else { cmp.push(key); if(cmp.length>2) cmp.shift(); }
  renderLibrary();
}

function libPhotoByKey(c, key){
  if(key.charAt(0)==='b') return {ph:(c.beforePhotos||[])[+key.slice(1)], cap:'术前 '+(+key.slice(1)+1)};
  var a = sortedAfter(c)[+key.slice(1)]; return {ph:a, cap:'术后 · '+(a?recoveryText(a):'')};
}

function libThumbHtml(c, key){
  var o = libPhotoByKey(c, key), on = LIB_STATE.compare.indexOf(key)>-1;
  return '<div style="width:130px;"><div style="cursor:zoom-in;'+(on?'outline:3px solid var(--terracotta);border-radius:10px;':'')+'" onclick="openLibViewer(\''+key+'\')">'+libPhotoBox(o.ph,'130px','110px',o.cap)+'</div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;font-size:11px;"><span>'+o.cap+'</span><label style="cursor:pointer;color:var(--slate2);"><input type="checkbox" '+(on?'checked ':'')+'onchange="libToggleCompare(\''+key+'\')"> 对比</label></div></div>';
}

function libRenderDetail(){
  var c = libFindCase(LIB_STATE.caseId); if(!c) return '<div style="font-size:12px;color:var(--muted);">案例不存在（可能已删除）</div>';
  var srcLabel = c.source==='travel' ? '医院案例' : '印尼案例';
  var srcColor = c.source==='travel' ? ['var(--sage-bg)','var(--sage)'] : ['var(--terracotta-bg)','var(--terracotta)'];
  var projLinks = (c.projectIds||[]).map(function(id){ var pr = projById(id); return pr ? '<a href="#" class="info-link" onclick="libOpenProject(\''+id+'\');return false;">'+pr.name+(pr.active?'':'（已非活性）')+'</a>' : ''; }).join('、');
  var dirHtml = c.source==='travel' ? (libDirectorClickable(c) ? '<a href="#" class="info-link" onclick="openDirectorDetail(\''+c.director+'\');return false;">'+c.director+'</a>' : '<span style="color:var(--muted);">-</span>') : '';
  var tags = (c.problemIds||[]).map(function(id){ return LIB_PROBLEMS[id] ? '<span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+LIB_PROBLEMS[id].label+'</span>' : ''; }).join(' ');
  var before = (c.beforePhotos||[]).map(function(_,i){ return libThumbHtml(c,'b'+i); }).join('') || '<span style="font-size:12px;color:var(--muted);">没有术前照片</span>';
  var after = sortedAfter(c).map(function(_,i){ return libThumbHtml(c,'a'+i); }).join('');
  var cmp = LIB_STATE.compare;
  var cmpHtml = cmp.length===2 ? '<div style="margin:14px 0;padding:14px;background:var(--border2);border-radius:12px;"><div style="font-size:12px;font-weight:700;margin-bottom:8px;">左右对比</div><div style="display:flex;gap:14px;flex-wrap:wrap;">'+
    cmp.map(function(k){ var o = libPhotoByKey(c,k); return '<div style="flex:1;min-width:200px;">'+libPhotoBox(o.ph,'100%','220px',o.cap)+'<div style="text-align:center;font-size:12px;margin-top:4px;">'+o.cap+'</div></div>'; }).join('')+'</div></div>'
    : '<div style="font-size:11px;color:var(--muted);margin-top:8px;">勾选两张照片的"对比"可以左右对比；点照片放大。</div>';
  var actions = '<div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="btn-primary" onclick="openLibPresent()">展示模式</button>'+
    (libCanEdit(c.source) ? '<button class="btn-outline" onclick="openLibCaseModal(\''+c.id+'\')">编辑</button><button class="btn-outline" style="color:#C1454A;" onclick="deleteLibCase(\''+c.id+'\')">删除</button>' : '')+'</div>';
  return '<div class="card" style="padding:22px 26px;"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:14px;"><div><div style="font-size:20px;font-weight:700;margin-bottom:8px;">'+c.title+'</div>'+
    '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:13px;"><span class="status-pill" style="background:'+srcColor[0]+';color:'+srcColor[1]+';">'+srcLabel+'</span>'+
    (c.source==='travel' ? '<span>院长：'+dirHtml+'</span>' : '')+'<span>项目：'+(projLinks||'—')+'</span>'+(tags ? '<span>问题：'+tags+'</span>' : '')+'</div></div>'+actions+'</div>'+
    '<div class="info-heading" style="margin-bottom:8px;">术前照片</div><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">'+before+'</div>'+
    '<div class="info-heading" style="margin-bottom:8px;">术后照片 <span style="font-weight:400;font-size:11px;color:var(--muted);">按恢复时间排序</span></div><div style="display:flex;gap:12px;flex-wrap:wrap;">'+after+'</div>'+cmpHtml+
    '<div class="info-heading" style="margin:18px 0 8px;">同意书 <span style="font-weight:400;font-size:11px;color:var(--muted);">只有室长看得到</span></div>'+
    '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">📄 '+(c.consent&&c.consent.file||'—')+'</span><span class="fa" style="gap:12px;"><a href="#" class="info-link" onclick="return false;">预览</a><a href="#" class="info-link" onclick="return false;">下载</a></span></div>'+
    '<div class="info-heading" style="margin:18px 0 8px;">记录</div>'+
    '<div style="font-size:12px;color:var(--slate2);line-height:1.9;">上传人：'+(c.uploader||'—')+'　上传时间：'+(c.uploadedAt||'—')+'<br>最后修改：'+(c.editedBy ? c.editedBy+'　'+c.editedAt : '—')+'</div></div>';
}

function libPresentMove(d){ var n = LIB_PRESENT.slides.length; LIB_PRESENT.idx = (LIB_PRESENT.idx+d+n)%n; renderLibPresent(); }

function libEditMissing(){
  var c = LIB_EDIT, m = [];
  if(!['zh','ko','id'].some(function(k){ return (c.names[k]||'').trim(); })) m.push('标题');
  if(!(c.projectIds||[]).length) m.push('项目（至少选一个）');
  var ap = c.afterPhotos||[];
  if(!ap.length) m.push('至少一张术后照片');
  else if(ap.some(function(p){ return !p.recovery || (p.recovery==='自定义' && !p.recoveryCustom); })) m.push('每张术后照片都要选恢复时间');
  if(!c.consent.signed) m.push('勾选"已签署照片同意书"');
  if(!c.consent.file) m.push('上传手写同意书文件');
  return m;
}

function libEditName(k, v){ LIB_EDIT.names[k] = v; }

function libToggleProject(id){
  var a = LIB_EDIT.projectIds, i = a.indexOf(id);
  if(i>-1) a.splice(i,1); else a.push(id);
  renderLibCaseModal();
}

function libToggleProblem(id){
  var a = LIB_EDIT.problemIds, i = a.indexOf(id);
  if(i>-1) a.splice(i,1); else a.push(id);
  renderLibCaseModal();
}

function libEditDirector(v){ LIB_EDIT.director = v || null; }

function libAddDemoPhoto(kind){
  var color = ['#D9CFC1','#CFD9D3','#D3CFD9','#D9D2CF'][Math.floor(Math.random()*4)];
  if(kind==='before') LIB_EDIT.beforePhotos.push({url:'', color:color}); else LIB_EDIT.afterPhotos.push({url:'', color:color, recovery:''});
  renderLibCaseModal();
}

function libRemovePhoto(kind, i){ (kind==='before' ? LIB_EDIT.beforePhotos : LIB_EDIT.afterPhotos).splice(i,1); renderLibCaseModal(); }

function libSetRecovery(i, v){ LIB_EDIT.afterPhotos[i].recovery = v; if(v!=='自定义') LIB_EDIT.afterPhotos[i].recoveryCustom = ''; renderLibCaseModal(); }

function libSetRecoveryCustom(i, v){ LIB_EDIT.afterPhotos[i].recoveryCustom = v; }

function libSetConsentSigned(v){ LIB_EDIT.consent.signed = !!v; renderLibCaseModal(); }

function libUseDemoConsent(){ LIB_EDIT.consent.file = 'consent-demo-signed.pdf'; renderLibCaseModal(); }

function libPhotoThumbEditHtml(p, kind, i){
  var w = kind==='after' ? 100 : 64;
  return '<div style="position:relative;width:'+w+'px;"><div style="position:relative;width:'+w+'px;height:64px;">'+libPhotoBox(p, w+'px', '64px', kind==='after'?'术后':'术前')+
    '<span style="position:absolute;top:-6px;right:-6px;background:#C1454A;color:#fff;border-radius:999px;width:18px;height:18px;font-size:11px;line-height:18px;text-align:center;cursor:pointer;" onclick="libRemovePhoto(\''+kind+'\','+i+')">✕</span></div>'+
    (kind==='after' ? '<select style="width:100%;margin-top:4px;font-size:11px;padding:3px;" onchange="libSetRecovery('+i+',this.value)"><option value="">选择恢复时间</option>'+
      RECOVERY_OPTIONS.map(function(r){ return '<option value="'+r+'"'+(p.recovery===r?' selected':'')+'>'+r+'</option>'; }).join('')+'</select>'+
      (p.recovery==='自定义' ? '<input type="text" placeholder="自定义恢复时间" value="'+(p.recoveryCustom||'')+'" oninput="libSetRecoveryCustom('+i+',this.value)" style="width:100%;margin-top:4px;font-size:11px;padding:3px;box-sizing:border-box;">' : '') : '')+'</div>';
}

function saveLibCase(){
  var c = LIB_EDIT; if(!c) return;
  if(libEditMissing().length) return; /* 缺任一项［保存］不可点 */
  var from = ['zh','ko','id'].filter(function(k){ return (c.names[k]||'').trim(); })[0];
  ['zh','ko','id'].forEach(function(k){ if(!(c.names[k]||'').trim()) c.names[k] = demoTranslate(c.names[from].trim(), from, k); });
  c.title = c.names.zh.trim();
  var me = DEMO_ROLE==='kr' ? ME_NAME+'（KR）' : ME_NAME; /* KR 端上传的案例：上传人记 KR 账号的姓名 */
  if(c.id){
    c.editedBy = me; c.editedAt = nowFullDt();
    var idx = LIB_CASES.findIndex(function(x){ return x.id===c.id; });
    if(idx>-1) LIB_CASES[idx] = c;
  } else {
    c.id = newLibCaseId(); c.uploader = me; c.uploadedAt = nowFullDt(); c.editedBy = null; c.editedAt = null;
    if(c.source==='local') c.clinicId = CURRENT_CLINIC_ID; else c.hospitalId = c.hospitalId || (LIB_HOSPITAL!=='all' ? LIB_HOSPITAL : 'H1'); /* 归属：印尼案例属于本诊所，赴韩案例属于医院 */
    LIB_CASES.unshift(c);
  }
  closeLibCaseModal();
  LIB_SEARCH = '';
  libOpenCase(c.id); /* 保存 → 案例详情页（Notion IN-SHOW-01） */
}

function libProblemCount(id){ return LIB_CASES.filter(function(c){ return (c.problemIds||[]).indexOf(id)>-1; }).length; }


/* ================= project library (项目库) =================
   来源(origin)决定币种：KR=韩元(KRW)，IN=印尼盾(IDR)，不单独存币种字段。
   每组（赴韩/本地）各一套单层分类，项目单选一个分类。 */
function currencyOf(origin){ return origin==='KR' ? 'KRW' : 'IDR'; }

var PROJCAT_SEQ = 1;

function newProjCatId(){ return 'pc'+(PROJCAT_SEQ++); }

var PROJECT_CATEGORIES = {}; /* 内存里的合成对象：本诊所自己的本地项目分类 + 全系统标准部位（KR_CATEGORIES）；存档时按 origin 拆开 */
var KR_CATEGORIES = {};   /* 赴韩项目的分类 = 全系统共用的一套标准部位（案例库"按部位"才能把不同医院的项目放在一起）；本地项目的分类各诊所各自一份（存在诊所分区里） */

function addProjCategory(label, origin){
  var id = newProjCatId();
  PROJECT_CATEGORIES[id] = {id:id, label:label, origin:origin};
  return id;
}

/* TODO: 接入实时汇率API，这里先用固定演示汇率（CMD-1012-04：KRW_IDR = 11.8 印尼盾 / 韩元，写进 CLAUDE.md） */
var FX_RATES = { KRW_IDR:11.8, KRW_CNY:0.0052, IDR_CNY:0.00044 };
/* ============ 本地管理项目库清单（CMD-1012-04，Notion「本地管理项目库清单（KR / IN 对齐版）」2026-10-12 定）============
   结构：类别 → 项目（一行一个）→ 规格（用量 / 次数，一层）→ 价格；价格单位 = 万韩元（49 = ₩490,000）；KR 用韩元，IN = 韩元 × 演示汇率（FX_RATES.KRW_IDR）四舍五入成整数印尼盾，之后各诊所可自行改价。
   花括号 {标签:值,值} = 不影响价格的「使用时选」选项（模式 / 部位 / 营养针种类；这里的值是演示占位，业务方要按实际改）；价格写「面议」= 选了之后手动填价。
   KR 在韩术后管理（拆线、消肿管理、术后复诊检查、伤口护理）另存在 KR 项目库「韩国术后管理」分类，全部免费；KR 手术项目库不动。 */
var LOCAL_CATALOG_TEXT = `# 提升仪器
美版超声刀二代 | 100发 49 | 300发 140 | 600发 258
热玛吉 | 300发 130 | 600发 230 | 眼部 225发 99 | 眼部 450发 159
钛提升 | 40kj 39 | 80kj 69
热拉提（红/蓝） | 20kj·1次 27.9 | 20kj·3次 69 | 60kj·1次 55 | 60kj·3次 130 | 80kj·1次 84.9
ONDA 提升 | 脸部 40kj·1次 45 | 脸部 40kj·3次 115 | 脸部 60kj·1次 60 | 脸部 60kj·3次 155 | 脸部 80kj·1次 79 | 脸部 80kj·3次 199 | 身体 60kj·1次 70 | 身体 60kj·3次 185 | 身体 120kj·1次 130 | 身体 120kj·3次 333
索夫波 Sofwave | 20发 30 | 50发 60 | 100发 110 | 200发 200 | 300发 295
Tune Liner 溶脂探头（整体下颌线） | 1次 14.9
Mjoule BBL 激光 | 1次 60
# 水光注射
丽珠兰黑盒（手打） | 2cc·1次 24.9 | 2cc·3次 62.5 | 4cc·1次 42.9 | 4cc·3次 105
丽珠兰红盒 HB Plus（手打） | 1cc 21.9 | 2cc 40.9 | 4cc 67.9
眼部丽珠兰（手打） | 1cc·1次 17 | 1cc·3次 45.9 | 2cc·1次 32 | 2cc·3次 81.9 | 4cc·1次 50 | 4cc·3次 119
丽珠兰 S（手打） | 1cc·1次 15 | 1cc·3次 40.5
保柔缇 REVIVE（手打） | 1cc·1次 60 | 2cc·1次 110 | 2cc·3次 290
婴儿针 | 1cc Auto MTS 4.5 | 1cc 黄金微针 22.5 | 2cc Auto MTS 8.5 | 2cc 黄金微针 26.5
三文鱼水光 | 1cc 手打 3 | 1cc Auto MTS 6 | 1cc 黄金微针 21 | 3cc 手打 7.9 | 3cc Auto MTS 10.9 | 3cc 黄金微针 25.9
Ultracol 100 5cc（手打） | 1次 23.9 | 3次 59
# 焕肤
LHALa peel | 1次 9.9 | 3次 25.9
黑米醋换肤 | 1次 6.9 | 3次 18.9
艺人水光焕肤 | 1次 14.9 | 3次 40
奶滑焕肤 | 1次 6.9 | 3次 18.9
玫瑰焕肤（脸，含挤压） | 1次 15 | 3次 40.5
玫瑰焕肤（身体，不含挤压） | 胸部·1次 22 | 胸部·3次 59.4 | 背上部·1次 25 | 背上部·3次 67.5 | 上臂·1次 22 | 上臂·3次 59.4
基础祛痘管理 | 1次 4.9 | 3次 13.2
水氧活肤 | 1次 4.9 | 3次 9.9
# 机器管理
O2 Derm 氧气疗法 | 1次 5.9 | 3次 13.9
Cooling Cryo | 1次 4.9 | 3次 9.9
离子美白管理 | 1次 4.9 | 3次 9.9
高级 IONZYME | 1次 6.49 | 3次 15.93
补水超声波管理 | 1次 4.9 | 3次 9.9
# 再生管理
HealFusion Pro（非侵入 MTS，含婴儿针） | 1次 27 | 3次 79
WiQO Uno（含 LDM 再生 6 分钟） | 1次 25 | 3次 69
AstroDome 面部管理 | 1次 18 | 3次 49
LDM {模式:12分钟=痘痘,紧致,提升;6分钟=保湿,再生,舒缓;8分钟=红血丝} | 12分钟·1次 11 | 12分钟·3次 29.7 | 6分钟·1次 6.6 | 6分钟·3次 17.8 | 8分钟（红血丝）·1次 8.8 | 8分钟（红血丝）·3次 23.8
# 营养针
基础营养针 {种类:*=白玉,灰姑娘,胎盘,甘草} | 1次 2.9
高级营养针 {种类:*=免疫力,抗氧化,维生素D,综合维他命,精氨酸} | 1次 5.9
# 疤痕 / 毛孔
黄金微针 面部整体（含镇静面膜） | 1次 27 | 3次 59 | 5次 79
黄金微针 全脸 SFA 尖头（含镇静面膜） | 1次 30 | 3次 59 | 5次 95
VIRTUE RF | 眼周·1次 25 | 眼周·3次 70 | 全脸+眼周·1次 50 | 全脸+眼周·3次 139
皮秒飞梭 全脸 | 1次 12 | 3次 33 | 5次 55
蜂巢皮秒 pro 飞梭（含奶滑换肤 + Cryo） | 1次 19 | 5次 89 | 10次 175
Mjoule MOXI 激光 | 1次 100
# 痘痘
CAPRI 激光（不含挤压） | 1次 8.8 | 5次 34.9
黄金微针 AGNES | 1次 17.9 | 3次 44.9
皮秒飞梭 + 黄金微针 AGNES（含镇静面膜） | 1次 21 | 3次 55 | 5次 89
白金 PTT | 1次 27.9 | 3次 69.9
针清 | 10个以内 3.3 | 10～50个 5.5
消炎针 | 1次 1.1 | 面部整体 3.3
# 肉毒
咬肌（瘦脸针） | 韩国产 50u 2.5 | 韩国产 100u 3.7 | CORETOX 50u 5.9 | CORETOX 100u 9.9 | 西马 50u 9.9 | 西马 100u 17.9 | 保妥适 50u 24.9 | 保妥适 100u 44
除皱 {部位:*=额头,眉间,眉上,眼周,眼下,嘴角,核桃纹,鼻翼} | 韩国产 1部位 2.4 | 韩国产 3部位 5.7 | CORETOX 1部位 3.5 | CORETOX 3部位 8.4 | 西马 1部位 5.9 | 西马 3部位 14 | 保妥适 1部位 9.9 | 保妥适 3部位 23
皮肤肉毒 {部位:1部位=下颌线,脸颊,额头} | 韩国产 1部位 6.9 | 韩国产 全脸 11.9 | CORETOX 1部位 8.9 | CORETOX 全脸 14.9 | 西马 1部位 10.9 | 西马 全脸 18.9 | 保妥适 1部位 19.9 | 保妥适 全脸 34.9
多汗症肉毒 | 韩国产 50u 7 | 韩国产 100u 11.9 | CORETOX 50u 10.9 | CORETOX 100u 19.9 | 西马 50u 15 | 西马 100u 29 | 保妥适 50u 39.9 | 保妥适 100u 69.9
# 身体美白
Lucas {部位:小部位=腋下,肘部,脚踝,膝盖;敏感部位=臀部,Y区,私密} | 小部位·1次 3 | 小部位·10次 25.5 | 敏感部位·1次 7 | 敏感部位·10次 59.5 | 全身·1次 69 | 全身·10次 352
皮秒 {部位:小部位=腋下,肘部,脚踝,膝盖;敏感部位=臀部,Y区,私密} | 小部位·1次 9 | 小部位·10次 76.5 | 敏感部位·1次 21 | 敏感部位·10次 178.5 | 全身·1次 99 | 全身·10次 505
# 干细胞
干细胞静脉注射 | 12cc 180 | 24cc 310
干细胞皮肤注射（手打） | 3cc·1次 70 | 3cc·3次 189 | 6cc·1次 110 | 6cc·3次 297
干细胞头皮注射（手打） | 3cc·1次 80 | 3cc·3次 219
SelfoXome {面议} | 静脉注射 面议 | 直接注射 面议
# 麻醉（附加项）
麻醉膏 | 1次 0.55
麻醉喷雾 | 1次 1.1
局部麻醉 | 1次 3
睡眠麻醉 | 1次 20`;
/* 「使用时选」的选项按规格分组：opt = {label, rules:[{match, values}]}，match 是规格名里包含的文字（'*' = 所有规格）；规格没有匹配的规则 = 不用选（如身体美白「全身」） */
function parseOptRules(txt){
  var i = txt.indexOf(':'), label = txt.slice(0, i), rules = txt.slice(i+1).split(';').map(function(r){ var j = r.indexOf('='); return {match:r.slice(0, j), values:r.slice(j+1).split(',').map(function(x){ return x.trim(); }).filter(Boolean)}; });
  return {label:label, rules:rules};
}
function optRulesText(opt){ return opt ? (opt.rules||[{match:'*', values:opt.values||[]}]).map(function(r){ return r.match+'='+r.values.join(','); }).join(';') : ''; }
function optValuesFor(p, specLabel){
  if(!p || !p.opt) return [];
  var rules = p.opt.rules || [{match:'*', values:p.opt.values||[]}];
  for(var i = 0; i < rules.length; i++){ if(rules[i].match==='*' || String(specLabel||'').indexOf(rules[i].match)>-1) return rules[i].values; }
  return [];
}
var LOCAL_CATALOG = (function(){
  var cats = [], cur = null;
  LOCAL_CATALOG_TEXT.split('\n').forEach(function(line){
    line = line.trim(); if(!line) return;
    if(line.charAt(0)==='#'){ cur = {label:line.slice(1).trim(), items:[]}; cats.push(cur); return; }
    var parts = line.split('|').map(function(x){ return x.trim(); }), head = parts[0], opt = null, neg = false;
    var m = head.match(/\{([^}]*)\}/);
    if(m){ head = head.replace(m[0], '').trim(); if(m[1]==='面议') neg = true; else { opt = parseOptRules(m[1]); } }
    var specs = parts.slice(1).map(function(sp, i){
      var idx = sp.lastIndexOf(' '), label = sp.slice(0, idx).trim(), pr = sp.slice(idx+1).trim(), tm = label.match(/(\d+)次/);
      return {label:label, wan:(pr==='面议' ? null : parseFloat(pr)), times:tm ? parseInt(tm[1],10) : 1};
    });
    cur.items.push({name:head, specs:specs, opt:opt, neg:neg});
  });
  return cats;
})();
var LOCAL_SPEC_SEQ = 1;
/* 按清单生成项目对象：origin 'IN' = 印尼盾（韩元 × FX_RATES.KRW_IDR，整数）、挂 PCAT 里的本地分类；origin 'KR' = 韩元、用 catLabel 分组（存在医院资料里） */
function krwOfWan(w){ return w===null ? 0 : Math.round(w*10000); }
function buildLocalProjects(origin, hospitalId){
  var out = [];
  LOCAL_CATALOG.forEach(function(cat){
    cat.items.forEach(function(it){
      var specs = it.specs.map(function(sp){ var krw = krwOfWan(sp.wan); return {id:'sp'+(LOCAL_SPEC_SEQ++), label:sp.label, price:(origin==='KR' ? krw : Math.round(krw*FX_RATES.KRW_IDR)), times:sp.times}; });
      var p = {id:newProjId(), name:it.name, price:specs.length ? specs[0].price : 0, origin:origin, active:true, specs:specs, opt:it.opt, neg:!!it.neg, catLabel:cat.label};
      if(origin==='IN'){ p.categoryId = PCAT[cat.label]; p.clinicId = CURRENT_CLINIC_ID; } else p.hospitalId = hospitalId || 'H1';
      out.push(p);
    });
  });
  return out;
}
var PCAT = {};
 // 建种子数据时临时存 label->id，方便下面 PROJECT_LIBRARY 直接引用
['眼部','鼻部','轮廓','面部年轻化','胸部','身体'].forEach(function(l){ PCAT[l] = addProjCategory(l, 'KR'); });
/* 「韩国术后管理」分类（2026-10-06，KR 端系列 4/5）：特殊标记 postcare:true——只在 KR 写诊疗方案选所需术后管理时用，IN 项目选择里不出现，案例库按部位没有案例所以也不显示 */
PCAT['韩国术后管理'] = addProjCategory('韩国术后管理', 'KR'); PROJECT_CATEGORIES[PCAT['韩国术后管理']].postcare = true;
function isKrPostcareCat(id){ var c = PROJECT_CATEGORIES[id] || KR_CATEGORIES[id]; return !!(c && c.postcare); }

LOCAL_CATALOG.forEach(function(cat){ PCAT[cat.label] = addProjCategory(cat.label, 'IN'); }); /* IN 本地分类 = 清单 12 类（CMD-1012-04；原「术后管理」等旧分类已去掉） */

var POST_CARE_CAT_ID = ''; /* IN 的「术后管理」分类已去掉（CMD-1012-04），保留变量让旧判断（!== POST_CARE_CAT_ID）继续成立 */
 /* 2026-09-29：术后管理虽然归类本地项目，但和普通本地项目不同，选购时同样受krScope限制 */

var PROJ_SEQ = 1;

function newProjId(){ return 'p'+(PROJ_SEQ++); }

function makeProj(name, price, origin, catLabel, hospitalId){
  /* 归属：本地项目（IN）属于诊所 clinicId；赴韩项目（KR）属于医院 hospitalId（演示数据默认 H1） */
  var p = {id:newProjId(), name:name, price:price, origin:origin, categoryId:PCAT[catLabel], active:true};
  if(origin==='KR') p.hospitalId = hospitalId || 'H1'; else p.clinicId = CURRENT_CLINIC_ID;
  return p;
}

var PROJECT_LIBRARY = [
  /* 赴韩项目（KRW） */
  makeProj('埋线双眼皮', 1000000, 'KR', '眼部'),
  makeProj('切开双眼皮', 1800000, 'KR', '眼部'),
  makeProj('开内眼角', 1200000, 'KR', '眼部'),
  makeProj('眼袋去除（内切）', 2000000, 'KR', '眼部'),
  makeProj('假体隆鼻', 2500000, 'KR', '鼻部'),
  makeProj('鼻综合（假体+鼻尖）', 5000000, 'KR', '鼻部'),
  makeProj('鼻翼缩小', 1500000, 'KR', '鼻部'),
  makeProj('鼻修复', 7000000, 'KR', '鼻部'),
  makeProj('颧骨缩小', 8000000, 'KR', '轮廓'),
  makeProj('下颌角整形', 9000000, 'KR', '轮廓'),
  makeProj('下巴假体 / 颏成形', 4000000, 'KR', '轮廓'),
  makeProj('面部拉皮', 12000000, 'KR', '面部年轻化'),
  makeProj('自体脂肪移植（全脸）', 4500000, 'KR', '面部年轻化'),
  makeProj('假体隆胸', 13000000, 'KR', '胸部'),
  makeProj('腹部吸脂', 4000000, 'KR', '身体'),
  makeProj('大腿吸脂', 4500000, 'KR', '身体')
];
buildLocalProjects('IN').forEach(function(p){ p.names = {zh:p.name, ko:p.name, id:p.name}; PROJECT_LIBRARY.push(p); }); /* 本地项目 = 清单（CMD-1012-04） */


/* TODO: 接入实时汇率API，这里先用固定演示汇率 */
/* CASE_ITEMS（demo 案例）定义在 PROJECT_LIBRARY 之前，那时候项目库还没建好，
   所以 demo 数据里的 recommended/procedureItems 只先写了 {name, origin, done, batchId}，
   这里项目库建完之后按名字一次性把 price/currency/categoryId/projectId 补成完整快照——
   和真实交互路径（toggleProject 选中时当场拷贝）效果一样，只是补种子数据的写法不同 */
(function hydrateDemoProjectSnapshots(){
  function snapOf(name){
    var p = PROJECT_LIBRARY.filter(function(x){ return x.name===name; })[0];
    return p ? {projectId:p.id, price:p.price, currency:currencyOf(p.origin), categoryId:p.categoryId} : null;
  }
  CASE_ITEMS.forEach(function(c){
    (c.recommended||[]).forEach(function(it){ var s = snapOf(it.name); if(s) Object.assign(it, s); });
    (c.procedureItems||[]).forEach(function(it){ var s = snapOf(it.name); if(s) Object.assign(it, s); });
  });
})();


/* demo 客户持有项目种子数据（2026-09-29 第十轮新增）：对应上面几个demo案例结算后应该转入持有的本地项目，
   补种子数据的写法，和真实交互路径（confirmSettlementPayment 里 grantHolding）效果一样 */
(function seedDemoHoldings(){
  /* 价格 = 清单价（万韩元 × 10000 × FX_RATES.KRW_IDR，整数印尼盾）：LHALa peel 1次 9.9 万 = Rp 1.168.200；艺人水光焕肤 1次 14.9 万 = Rp 1.758.200（CMD-1012-04 换成清单项目） */
  var pL = Math.round(99000*FX_RATES.KRW_IDR), pA = Math.round(149000*FX_RATES.KRW_IDR);
  grantHolding('客人11', 'LHALa peel', '本地', 'rizky', D(-3), 1, false, {paid:pL, list:pL, pct:100, currency:'IDR'}).spec = '1次';
  grantHolding('客人11', '艺人水光焕肤', '本地', 'rizky', D(-3), 1, false, {paid:pA, list:pA, pct:100, currency:'IDR'}).spec = '1次';
  grantHolding('客人12', '艺人水光焕肤', '本地', 'rina', D(-29), 1, false, {paid:pA, list:pA, pct:100, currency:'IDR'}).spec = '1次';
  useHolding('客人12', '艺人水光焕肤', 'rina', D(-22), 1); /* 已用完，演示"已用/购买"显示 */
  useHolding('客人11', 'LHALa peel', 'rizky', D(-3), 1, 'main'); /* rizky 本地管理：已使用1次 */
})();


/* 演示数据（2026-10-02·五）：非活性化的项目 + 部分使用的持有批次，用来对应项目库的使用情况/删除规则
   - Genesis焕肤：非活性化，但 客人11 手上还有 1 个未用批次 → 删除按钮置灰
   - 巴西式脱毛 + 焕肤护理：非活性化，完全没有在用 → 可以删除
   - 鼻修复（赴韩）：非活性化，没有在用 → 可以删除
   - 好莱坞焕肤：客人11 买2次、用1次（部分使用）→ 客户详情可退款剩余1次 */
(function seedProjectLibraryDemo(){
  function byName(n){ return PROJECT_LIBRARY.filter(function(x){ return x.name===n; })[0]; }
  ['艺人水光焕肤','黑米醋换肤','鼻修复'].forEach(function(n){ var q = byName(n); if(q) q.active = false; });
  var h = (CLIENT_HOLDINGS['客人11']||[]).filter(function(x){ return x.itemName==='LHALa peel'; })[0];
  if(h && h.batches[0] && h.batches[0].bought===1){ h.batches[0].bought = 2; h.batches[0].paid = 2*h.batches[0].paid; h.batches[0].listPrice = h.batches[0].paid; } /* 买2用1：部分使用（实付 = 2 × 320.000，CMD-1008-08 购买价快照同步） */
  /* 各语言名称：演示翻译 */
  PROJECT_LIBRARY.forEach(function(q){ q.names = {zh:q.name, ko:demoTranslate(q.name,'zh','ko'), id:demoTranslate(q.name,'zh','id')}; });
})();

/* 案例库演示数据（2026-10-02·七）：赴韩 3+ 个部位、院长含已停用的（显示"-"）；印尼 3+ 个本地项目、带问题标签；每个案例附演示同意书；部分案例多张不同恢复时间的术后照片 */
(function libSeedDemo(){
  function pid(n){ var q = PROJECT_LIBRARY.filter(function(x){ return x.name===n; })[0]; return q ? q.id : null; }
  var colors = ['#D9CFC1','#CFD9D3','#D3CFD9','#D9D2CF','#CFD6D9'];
  var ci = 0;
  function photo(rec, custom){ return {url:'', color:colors[(ci++)%colors.length], recovery:rec, recoveryCustom:custom||''}; }
  function mk(title, source, projNames, director, problems, recs, day){
    var id = newLibCaseId();
    LIB_CASES.push({id:id, clinicId:(source==='local' ? CURRENT_CLINIC_ID : undefined), hospitalId:(source==='travel' ? 'H1' : undefined), title:title, names:{zh:title, ko:demoTranslate(title,'zh','ko'), id:demoTranslate(title,'zh','id')}, source:source,
      projectIds:projNames.map(pid).filter(Boolean), director:director, problemIds:(problems||[]).map(function(l){ return LIB_PROBLEM_IDS[l]; }),
      beforePhotos:[{url:'', color:'#E6DDD0'}, {url:'', color:'#E1D8CB'}], afterPhotos:recs.map(function(r){ return photo(r); }),
      consent:{signed:true, file:'consent-'+id+'.pdf'}, uploader:(source==='travel'?'KM1 室长（KR室长）':actingName()), uploadedAt:'2026-09-'+day+' 10:00',
      editedBy:null, editedAt:null});
  }
  mk('切开双眼皮 · 自然平行型','travel',['切开双眼皮'],'KD1 院长',[],['1周','1个月','3个月'],'16');
  mk('埋线双眼皮 术后恢复','travel',['埋线双眼皮'],'KO1 代表院长',[],['1周','1个月'],'14');
  mk('假体隆鼻 基底改善','travel',['假体隆鼻'],'KD1 院长',[],['1个月','6个月'],'12');
  mk('鼻综合 鼻尖精修','travel',['鼻综合（假体+鼻尖）'],'H1 院长3',[],['3个月'],'10'); /* H1 院长3 已停用 → 院长显示"-" */
  mk('颧骨缩小 侧面轮廓','travel',['颧骨缩小'],'KD1 院长',[],['1周','3个月'],'09');
  mk('下颌角整形联合方案','travel',['下颌角整形','颧骨缩小'],'KO1 代表院长',[],['1个月'],'08');
  mk('面部拉皮 提升','travel',['面部拉皮'],'KD1 院长',[],['3个月','6个月'],'07');
  mk('自体脂肪移植 面部填充','travel',['自体脂肪移植（全脸）'],'KO1 代表院长',[],['1个月'],'06');
  mk('LHALa peel 色素改善','local',['LHALa peel'],null,['色素沉着','暗沉'],['1周','1个月'],'15');
  mk('艺人水光焕肤 暗沉改善','local',['艺人水光焕肤'],null,['暗沉'],['1个月'],'13'); /* 项目已非活性化 → 卡片标"已非活性" */
  mk('黄金微针 毛孔紧致','local',['黄金微针 面部整体（含镇静面膜）'],null,['毛孔粗大','痘印'],['1个月','3个月'],'11');
  mk('干细胞注射 脱发改善','local',['干细胞皮肤注射（手打）'],null,['脱发'],['3个月','6个月'],'05');
  mk('ONDA 提升 面部紧致','local',['ONDA 提升'],null,['松弛'],['1个月'],'04');
  mk('婴儿针 水光','local',['婴儿针'],null,['暗沉','毛孔粗大'],['1周'],'03');
})();


function convertCurrency(amount, from, to){
  if(from===to) return amount;
  if(from==='KRW' && to==='IDR') return amount*FX_RATES.KRW_IDR;
  if(from==='KRW' && to==='CNY') return amount*FX_RATES.KRW_CNY;
  if(from==='IDR' && to==='CNY') return amount*FX_RATES.IDR_CNY;
  if(from==='IDR' && to==='KRW') return amount/FX_RATES.KRW_IDR;
  if(from==='CNY' && to==='KRW') return amount/FX_RATES.KRW_CNY;
  if(from==='CNY' && to==='IDR') return amount/FX_RATES.IDR_CNY;
  return amount;
}

function groupThousands(intStr, sep){ return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, sep); }

/* 显示币种切换：赴韩=韩元(原价)/印尼盾/人民币，本地=印尼盾(原价)/人民币。换算后的金额前面加"≈"，原币不加。
   target 由调用方传（项目库页面传 PROJ_DISPLAY_CCY_*，案件里的项目选择/结算传 CASE_DISPLAY_CCY_*），两处切换互不影响 */
function displayAmount(amount, origin, target){
  var native = currencyOf(origin);
  target = target || native;
  if(target===native) return formatCurrency(amount, native);
  return '≈ ' + formatCurrency(convertCurrency(amount, native, target), target);
}

function projById(id){ return PROJECT_LIBRARY.filter(function(p){ return p.id===id; })[0]; }

/* ================= 本月活动价 / 套餐（2026-10-08，CMD-1008-09；Notion Project Library「本月活动价与套餐」、IN-SRVC-01 第 3-1 节） =================
   · 活动价 PROMOS：挂在单一本地项目上 {id, projectId, price, from, to, ended}；状态进行中 / 未开始 / 已结束（按日期算，过期自动恢复原价；ended = 管理者手动结束）；
   · 套餐 PACKAGES：{id, name, items:[{projectId, qty}], price(套餐价), from, to（可空 = 长期有效）, ended}；不可退款；
   · 都按诊所分区存（各诊所自己管），只有 IN 管理者（canDo('promo')）能新增 / 编辑 / 结束，一般室长只看；
   · 案件里选入时存成交价快照（活动价 / 套餐价 / 原价 + 折扣），之后改库不影响已选的案件 */
var PROMOS = [];
var PACKAGES = [];
function newPromoId(prefix){ return prefix+Date.now().toString(36)+Math.floor(Math.random()*10000).toString(36); }
function promoStatusOf(x){
  var t = todayStr();
  if(x.ended) return '已结束';
  if(x.from && t < x.from) return '未开始';
  if(x.to && t > x.to) return '已结束';
  return '进行中';
}
function activePromoOf(projectId, specId){ return PROMOS.filter(function(p){ return p.projectId===projectId && (!specId || !p.specId || p.specId===specId) && promoStatusOf(p)==='进行中'; })[0] || null; }
/* 规格（CMD-1012-04）：项目 p.specs = [{id, label, price, times}]；选了哪个规格 = 成交价；规格里写「N次」付款后持有 N 次（specTimes），其他规格一个规格 = 持有 1 次 */
function specById(p, id){ return (p && p.specs || []).filter(function(x){ return x.id===id; })[0] || null; }
function defaultSpec(p){ return (p && p.specs || [])[0] || null; }
function specPickOf(c, p){ return specById(p, (c.specPick||{})[p.id]) || defaultSpec(p); }
function itemFullName(it){ return it.name+(it.specLabel ? ' · '+it.specLabel : ''); }
/* 本地项目当前的成交单价：有进行中的活动价就用活动价（原价划线 + "本月" 标签），过期自动恢复原价 */
function localUnitPrice(p, specId){
  var sp = specById(p, specId) || defaultSpec(p), base = sp ? sp.price : p.price, pm = activePromoOf(p.id, sp ? sp.id : null);
  return pm ? {price:pm.price, orig:base, promo:pm} : {price:base, orig:base, promo:null};
}
function pkgItemSpec(it){ var pr = projById(it.projectId); return pr ? (specById(pr, it.specId) || defaultSpec(pr)) : null; }
function packageListTotal(pk){ return (pk.items||[]).reduce(function(s, it){ var pr = projById(it.projectId), sp = pkgItemSpec(it); return s + (pr ? (sp ? sp.price : pr.price)*(it.qty||1) : 0); }, 0); }
function packageItemsText(pk){ return (pk.items||[]).map(function(it){ var pr = projById(it.projectId), sp = pkgItemSpec(it); return (pr ? pr.name+(sp ? ' · '+sp.label : '') : '（已删除的项目）')+' × '+(it.qty||1); }).join('、'); }
function activePackages(){ return PACKAGES.filter(function(pk){ return promoStatusOf(pk)==='进行中'; }); }
/* 同一项目的活动价期间不能重叠（已结束的不算） */
function promoOverlap(projectId, from, to, exceptId, specId){
  return PROMOS.filter(function(p){ return p.projectId===projectId && p.id!==exceptId && !p.ended && (!specId || !p.specId || p.specId===specId); }).filter(function(p){ return (p.from||'0000') <= to && (p.to||'9999') >= from; })[0] || null;
}
function shiftMonth(ds, n){
  var d = new Date(ds+'T00:00:00'), day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth()+1, 0).getDate()));
  return dateStr(d);
}
/* 演示数据（CMD-1008-09）：4 条活动价（2 进行中 / 1 未开始 / 1 已结束）、2 个套餐；客人12 持有 1 批「套餐」批次（焕肤护理套餐拆出的好莱坞焕肤 ×3 + 比基尼线脱毛 ×1），客人11 持有 1 批「서비스」批次（好莱坞焕肤 ×1，赠送）；仅 C1 */
(function seedPromoDemo(){
  var byName = function(n){ return PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN' && p.name===n; })[0]; };
  var specOf = function(p, label){ return (p.specs||[]).filter(function(x){ return x.label===label; })[0]; };
  var hol = byName('LHALa peel'), xerf = byName('索夫波 Sofwave'), bik = byName('基础祛痘管理'), onda = byName('ONDA 提升');
  if(!hol || !xerf || !bik || !onda) return;
  var sH = specOf(hol,'1次'), sX = specOf(xerf,'300发'), sB = specOf(bik,'1次'), sO = specOf(onda,'脸部 60kj·1次');
  PROMOS = [
    {id:'pm-demo1', projectId:hol.id, specId:sH.id, price:850000, from:D(-5), to:D(20), ended:false},
    {id:'pm-demo2', projectId:xerf.id, specId:sX.id, price:31000000, from:D(-2), to:D(25), ended:false},
    {id:'pm-demo3', projectId:bik.id, specId:sB.id, price:450000, from:D(5), to:D(35), ended:false},
    {id:'pm-demo4', projectId:onda.id, specId:sO.id, price:5900000, from:D(-40), to:D(-12), ended:false}
  ];
  PACKAGES = [
    {id:'pk-demo1', name:'焕肤护理套餐', items:[{projectId:hol.id, specId:sH.id, qty:3}, {projectId:bik.id, specId:sB.id, qty:1}], price:3600000, from:D(-10), to:D(25), ended:false},
    {id:'pk-demo2', name:'提升体验套餐', items:[{projectId:onda.id, specId:sO.id, qty:1}, {projectId:hol.id, specId:sH.id, qty:1}], price:7500000, from:'', to:'', ended:false}
  ];
  /* 客人12 持有 1 批「套餐」批次（焕肤护理套餐拆出的 LHALa peel ×3 + 基础祛痘管理 ×1，套餐价按原价占比分摊），客人11 持有 1 批「서비스」批次（LHALa peel ×1，赠送） */
  var list1 = sH.price*3, list2 = sB.price, pk = 3600000, sh1 = Math.round(pk*list1/(list1+list2)), sh2 = pk - sh1;
  var b1 = grantHolding('客人12', hol.name, '本地', 'rina', D(-29), 3, false, {paid:sh1, list:list1, pct:100, currency:'IDR'}); b1.pkgPaid = true; b1.pkgName = '焕肤护理套餐'; b1.spec = '1次';
  var b2 = grantHolding('客人12', bik.name, '本地', 'rina', D(-29), 1, false, {paid:sh2, list:list2, pct:100, currency:'IDR'}); b2.pkgPaid = true; b2.pkgName = '焕肤护理套餐'; b2.spec = '1次';
  var b3 = grantHolding('客人11', hol.name, '本地', 'rizky', D(-3), 1, false, {paid:0, list:sH.price, pct:100, currency:'IDR'}); b3.service = true; b3.spec = '1次';
})();
/* ［复制上个月活动］：把"上个自然月内结束的活动价"整体顺延一个月复制成新的活动价（同项目同期间已有的不重复复制），复制后可编辑；返回新增条数 */
function copyLastMonthPromos(){
  var t = new Date(todayStr()+'T00:00:00'), ms = dateStr(new Date(t.getFullYear(), t.getMonth()-1, 1)), me = dateStr(new Date(t.getFullYear(), t.getMonth(), 0)), n = 0;
  PROMOS.slice().forEach(function(p){
    if(!p.to || p.to < ms || p.to > me) return;
    var nf = shiftMonth(p.from, 1), nt = shiftMonth(p.to, 1);
    if(promoOverlap(p.projectId, nf, nt, null, p.specId)) return;
    PROMOS.push({id:newPromoId('pm'), projectId:p.projectId, specId:p.specId, price:p.price, from:nf, to:nt, ended:false}); n++;
  });
  return n;
}


function setProjLibTab(t){ PROJLIB_TAB = t; PROJLIB_CAT_FILTER = 'all'; renderProjLibrary(); }

function setProjLibCatFilter(id){ PROJLIB_CAT_FILTER = id; renderProjLibrary(); }

function setProjDisplayCcy(origin, ccy){
  if(origin==='KR') PROJ_DISPLAY_CCY_KR = ccy; else PROJ_DISPLAY_CCY_IN = ccy;
  renderProjLibrary();
}

function projLibCategories(origin){
  return Object.keys(PROJECT_CATEGORIES).filter(function(id){ return PROJECT_CATEGORIES[id].origin===origin && !(PROJECT_CATEGORIES[id].postcare && DEMO_ROLE!=='kr'); }) /* 「韩国术后管理」只在 KR 端项目库出现（IN 不显示） */.map(function(id){ return PROJECT_CATEGORIES[id]; });
}

/* 使用情况（从案件数据和客户持有数据计算）：进行中案件=还没到终态且引用了这个项目（快照 projectId）；持有中批次=客户持有批次里剩余次数>0 的批次（按项目名称匹配） */
function projectUsage(p){
  var cases = CASE_ITEMS.filter(function(c){
    if(isEnded(c)) return false;
    return (c.procedureItems||[]).some(function(it){ return it.projectId===p.id; }) || (c.recommended||[]).some(function(it){ return it.projectId===p.id; });
  }).length;
  var batches = 0;
  Object.keys(CLIENT_HOLDINGS).forEach(function(nm){
    CLIENT_HOLDINGS[nm].forEach(function(h){
      if(h.itemName!==p.name) return;
      h.batches.forEach(function(b){ if(!b.voided && (b.bought-b.used)>0) batches++; });
    });
  });
  return {cases:cases, batches:batches, libCases:libCasesOfProject(p.id).length}; /* 案例库案例也算在用 */
}

function projLibHeadHtml(){
  return '<div class="case-field-row" style="font-size:11px;color:var(--muted);font-weight:700;"><span style="flex-grow:1;">项目名称</span><span style="width:90px;">分类</span><span style="width:130px;text-align:right;">价格</span><span style="width:190px;text-align:right;">使用情况</span><span style="width:150px;text-align:right;">操作</span></div>';
}

function projDeleteBlockReason(p){
  var u = projectUsage(p), r = [];
  if(u.cases) r.push('还有 '+u.cases+' 个进行中的案件引用它');
  if(u.batches) r.push('还有 '+u.batches+' 个客人持有中的批次（剩余次数>0）');
  if(u.libCases) r.push('还有 '+u.libCases+' 个案例库案例挂在这个项目上');
  var np = PROMOS.filter(function(x){ return x.projectId===p.id; }).length, nk = PACKAGES.filter(function(k){ return (k.items||[]).some(function(it){ return it.projectId===p.id; }); }).length;
  if(np) r.push('还有 '+np+' 条活动价挂在这个项目上'); if(nk) r.push('还有 '+nk+' 个套餐包含这个项目');
  return r.join('；');
}

function projLibRowHtml(p){
  var canEdit = libCanEdit(p.origin==='KR' ? 'travel' : 'local');
  var cat = PROJECT_CATEGORIES[p.categoryId];
  var u = projectUsage(p);
  var actions = '';
  if(canEdit){
    if(p.active){
      actions = '<a href="#" class="info-link" onclick="openProjEditModal(\''+p.id+'\');return false;">编辑</a>'+
        '<a href="#" class="info-link" onclick="deactivateProj(\''+p.id+'\');return false;">非活性化</a>';
    } else {
      var why = projDeleteBlockReason(p);
      actions = '<a href="#" class="info-link" onclick="reactivateProj(\''+p.id+'\');return false;">重新启用</a>'+
        (why
          ? '<span style="font-size:12px;color:var(--muted);cursor:not-allowed;" title="'+why+'，无法删除">删除</span>'
          : '<a href="#" class="info-link" style="color:#C1454A;" onclick="deleteProj(\''+p.id+'\');return false;">删除</a>');
    }
  } else {
    actions = '<span style="font-size:11px;color:var(--dim);">只读</span>';
  }
  var native = currencyOf(p.origin);
  var disp = p.origin==='KR' ? PROJ_DISPLAY_CCY_KR : PROJ_DISPLAY_CCY_IN;
  var priceHtml = projPriceSummaryHtml(p, disp);
  var nm = p.names ? '<div style="font-size:10px;color:var(--muted);margin-top:2px;">'+(p.names.ko||'')+' · '+(p.names.id||'')+'</div>' : '';
  var open = !!PROJLIB_OPEN[p.id], hasSpecs = (p.specs||[]).length>0;
  return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;'+(hasSpecs?'cursor:pointer;':'')+'"'+(hasSpecs ? ' onclick="toggleProjSpecs(\''+p.id+'\')"' : '')+'>'+(hasSpecs ? '<span style="color:var(--muted);">'+(open?'▾':'▸')+'</span> ' : '')+p.name+nm+'</span>'+
    '<span style="font-size:11px;color:var(--muted);width:90px;">'+(cat?cat.label:'—')+'</span>'+
    '<span style="width:130px;text-align:right;">'+priceHtml+'</span>'+
    '<span style="font-size:11px;color:var(--slate2);width:190px;text-align:right;">进行中案件 '+u.cases+' 个 · 持有中批次 '+u.batches+' 个 · 案例 '+u.libCases+' 个</span>'+
    '<span class="fa" style="gap:12px;width:150px;justify-content:flex-end;">'+actions+'</span></div>'+
    (open && hasSpecs ? projSpecsListHtml(p, disp) : '');
}
/* 规格（一层）：一个项目一行，展开看全部规格和价格（CMD-1012-04） */
var PROJLIB_OPEN = {};
function toggleProjSpecs(id){ PROJLIB_OPEN[id] = !PROJLIB_OPEN[id]; if(typeof renderProjLibGrid==='function') renderProjLibGrid(); if(typeof krpRender==='function' && typeof KRP!=='undefined' && document.getElementById('admin-body') && /krsrvc/.test(ADMIN_KEY||'')) krpRender(); }
function specPriceText(p, sp, ccy){ return p.neg ? '面议（手动填价）' : displayAmount(sp.price, p.origin, ccy); }
function projPriceSummaryHtml(p, disp){
  var native = currencyOf(p.origin), sp = p.specs||[];
  if(!sp.length) return '<span style="font-size:13px;font-weight:700;">'+displayAmount(p.price, p.origin, disp)+'</span>'+(disp!==native ? '<div style="font-size:10px;color:var(--muted);font-weight:400;">原价 '+formatCurrency(p.price, native)+'</div>' : '');
  if(p.neg) return '<span style="font-size:13px;font-weight:700;">面议</span><div style="font-size:10px;color:var(--muted);">'+sp.length+' 个规格</div>';
  var ps = sp.map(function(x){ return x.price; }), lo = Math.min.apply(null, ps), hi = Math.max.apply(null, ps);
  return '<span style="font-size:13px;font-weight:700;">'+displayAmount(lo, p.origin, disp)+(hi>lo ? ' 起' : '')+'</span><div style="font-size:10px;color:var(--muted);font-weight:400;">'+sp.length+' 个规格'+(disp!==native ? ' · 原价 '+formatCurrency(lo, native)+(hi>lo?' 起':'') : '')+'</div>';
}
function projSpecsListHtml(p, disp){
  return '<div style="margin:0 0 8px 22px;padding:8px 14px;background:var(--surface2,#faf6ef);border-radius:8px;font-size:12px;">'+''+
    p.specs.map(function(sp){ return '<div style="display:flex;justify-content:space-between;gap:10px;padding:2px 0;"><span>'+sp.label+(sp.times>1 ? ' <span style="color:var(--muted);">（付款后持有 '+sp.times+' 次）</span>' : '')+'</span><span>'+specPriceText(p, sp, disp)+'</span></div>'; }).join('')+'</div>';
}

/* ---- 规格编辑器（IN / KR 项目库编辑共用）：targetExpr = 编辑对象的全局表达式（如 'PROJ_EDIT'），rerender = 重画表达式 ---- */
function specEdHtml(targetExpr, rerender, ccy, obj){
  var inp = 'padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;';
  var rows = (obj.specs||[]).map(function(sp, i){
    return '<div style="display:flex;gap:6px;align-items:center;margin:4px 0;"><input type="text" placeholder="规格（如 300发 / 3次）" value="'+String(sp.label||'').replace(/"/g,'&quot;')+'" oninput="specEdSet('+targetExpr+','+i+',\'label\',this.value)" style="'+inp+'flex:1;min-width:0;">'+
      (obj.neg ? '<span style="font-size:12px;color:var(--muted);width:110px;">面议（手动填价）</span>' : '<input type="number" min="0" placeholder="价格（'+ccy+'）" value="'+(sp.price===''||sp.price==null ? '' : sp.price)+'" oninput="specEdSet('+targetExpr+','+i+',\'price\',this.value)" style="'+inp+'width:110px;">')+
      '<a href="#" onclick="specEdDel('+targetExpr+','+i+');'+rerender+';return false;" style="font-size:12px;">删除</a></div>';
  }).join('');
  return '<div style="font-size:12px;font-weight:700;margin:8px 0 2px;">规格（一层，每个规格一个价格；规格里写「N次」付款后持有 N 次）</div>'+rows+
    '<button class="btn-ghost" style="padding:3px 10px;font-size:11px;" onclick="specEdAdd('+targetExpr+');'+rerender+'">+ 添加规格</button>'+
    '<label style="display:flex;gap:6px;align-items:center;font-size:12px;margin:8px 0;"><input type="checkbox" '+(obj.neg?'checked':'')+' onchange="'+targetExpr+'.neg=this.checked;'+rerender+'"> 面议（选了之后手动填价）</label>'+
    '<div style="display:flex;gap:6px;align-items:center;font-size:12px;margin:4px 0;">使用时选 <input type="text" placeholder="选项名（模式 / 部位，不填 = 没有）" value="'+String((obj.opt&&obj.opt.label)||'').replace(/"/g,'&quot;')+'" oninput="specEdOpt('+targetExpr+',\'label\',this.value)" style="'+inp+'width:130px;"><input type="text" placeholder="规则：规格含的字=选项,选项;…（* = 所有规格）" value="'+optRulesText(obj.opt).replace(/"/g,'&quot;')+'" oninput="specEdOpt('+targetExpr+',\'rules\',this.value)" style="'+inp+'flex:1;min-width:0;"></div>';
}
function specEdSet(o, i, k, v){ if(o.specs && o.specs[i]){ o.specs[i][k] = v; if(k==='label'){ var m = String(v).match(/(\d+)次/); o.specs[i].times = m ? parseInt(m[1],10) : 1; } } }
function specEdAdd(o){ o.specs = o.specs || []; o.specs.push({id:'sp'+(LOCAL_SPEC_SEQ++), label:'', price:'', times:1}); }
function specEdDel(o, i){ if(o.specs){ o.specs.splice(i, 1); } }
function specEdOpt(o, k, v){ o.opt = o.opt || {label:'', rules:[]}; if(k==='label') o.opt.label = v; else o.opt.rules = String(v).split(/[;；]/).map(function(r){ var j = r.indexOf('='); return j<0 ? null : {match:r.slice(0,j).trim(), values:r.slice(j+1).split(/[,，]/).map(function(x){ return x.trim(); }).filter(Boolean)}; }).filter(Boolean); if(!o.opt.label && !(o.opt.rules||[]).length) o.opt = null; }
/* 保存前整理规格：返回错误文字或 '' */
function specEdFinish(o){
  var sp = (o.specs||[]).filter(function(x){ return String(x.label||'').trim() || (x.price!=='' && x.price!=null); });
  if(!sp.length) return '请至少添加一个规格';
  for(var i = 0; i < sp.length; i++){
    if(!String(sp[i].label||'').trim()) return '规格名称不能为空';
    if(!o.neg){ var pr = Number(sp[i].price); if(sp[i].price==='' || isNaN(pr) || pr<0) return '规格「'+sp[i].label+'」缺价格'; sp[i].price = Math.round(pr); } else sp[i].price = 0;
    var m = String(sp[i].label).match(/(\d+)次/); sp[i].times = m ? parseInt(m[1],10) : 1; sp[i].label = String(sp[i].label).trim();
  }
  o.specs = sp; if(o.opt && !String(o.opt.label||'').trim()) o.opt = null;
  o.price = o.neg ? 0 : sp[0].price;
  return '';
}

function reactivateProj(id){
  var p = projById(id); if(!p) return;
  p.active = true;
  renderProjLibrary();
}

/* 项目名称（2026-10-02）：只填一种语言，其他语言（韩/印尼/中）用 AI 翻译，室长可以修改。原型用演示翻译（在原文后加语言标记），不是真实翻译 */
var LANG_LABEL = {zh:'中文', ko:'한국어', id:'Bahasa Indonesia'};

function demoTranslate(text, from, to){
  if(!text) return '';
  var base = text.replace(/（한국어）|（中文）| \(Indonesia\)$/g,'');
  return to==='ko' ? base+'（한국어）' : (to==='id' ? base+' (Indonesia)' : '（中文）'+base);
}

function ensureProjNames(p){
  p.names = p.names || {zh:p.name||'', ko:'', id:''};
  return p.names;
}

function setProjName(lang, v){ ensureProjNames(PROJ_EDIT)[lang] = v; }

function saveProj(){
  var p = PROJ_EDIT; if(!p) return;
  var price = Number(p.price);
  var missing = [];
  var nm0 = ensureProjNames(p);
  if(!['zh','ko','id'].some(function(k){ return (nm0[k]||'').trim(); })) missing.push('项目名称');
  var specErr = (p.specs && p.specs.length || p.neg || p.catLabel!==undefined) ? specEdFinish(p) : '';
  if(!(p.specs && p.specs.length) && (!p.price || isNaN(price) || price<0)) missing.push('价格');
  if(specErr) missing.push(specErr);
  if(!p.categoryId) missing.push('分类');
  if(missing.length){
    p.errorMsg = '还差 '+missing.join('、')+' 未完成';
    renderProjEditModal();
    return;
  }
  var fromLang = ['zh','ko','id'].filter(function(k){ return (p.names[k]||'').trim(); })[0];
  ['zh','ko','id'].forEach(function(k){ if(!(p.names[k]||'').trim()) p.names[k] = demoTranslate(p.names[fromLang].trim(), fromLang, k); }); /* 没填的语言保存时自动翻译补全 */
  p.name = p.names.zh.trim(); /* 列表和案件里显示中文名；案件里存的是快照 */
  if(p.origin==='IN') p.catLabel = (PROJECT_CATEGORIES[p.categoryId]||{}).label || p.catLabel;
  if(!(p.specs && p.specs.length)) p.price = Math.round(price);
  p.errorMsg = '';
  if(p.id){
    var idx = PROJECT_LIBRARY.findIndex(function(x){ return x.id===p.id; });
    if(idx>-1) PROJECT_LIBRARY[idx] = p;
  } else {
    p.id = newProjId();
    p.active = true;
    if(p.origin==='KR') p.hospitalId = p.hospitalId || 'H1'; else p.clinicId = CURRENT_CLINIC_ID; /* 归属：IN 项目属于本诊所，KR 项目属于医院 */
    PROJECT_LIBRARY.push(p);
  }
  closeProjEditModal();
  renderProjLibrary();
}


/* ================= 通知中心（2026-10-03，Notion Notification Center / IN-NOTI-01） =================
   通知数据：类型(cat)、内容、Case ID、时间、收件人、已读状态；事件发生时自动生成，全部弹 toast；保留 90 天。
   收件人：案件事件 = 这个案件所有操作过、当天上班的室长（都 OFF 改发当天上班的所有 IN 室长，同 pushTargets）；被 @ = 被 @ 的人；系统更新 = 所有 IN 室长。
   一般对话消息不进通知中心（对话有自己的未读数），被 @ 进通知中心并弹 toast，对话那边不另外为 @ 亮红点。 */
var NOTIF_SEQ = 0;

var NOTIF_CATS = ['预约','面诊','赴韩施术','视频','对话','系统'];

var NOTIF_ICON = {'预约':'📅','面诊':'🩺','赴韩施术':'✈️','视频':'🎥','对话':'💬','系统':'⚙️'};

var NOTIFS = [];

/* 个人设定里的通知开关（关闭推播后不再弹出右下角提示，通知中心仍记录） */
function notifyPushOn(){ var a = currentAccount(); return !(a && a.notify && a.notify.push===false); }
function notifySoundOn(){ var a = currentAccount(); return !(a && a.notify && a.notify.sound===false); }
function notifMine(n){ return n.recipients.indexOf(ME_NAME)>-1; }

function notifAlive(n){ return (realNow() - (utcStrParse(n.ts)||0)) <= 90*86400000; }
 /* 90 天后自动清除 */
function myNotifs(){ return NOTIFS.filter(function(n){ return notifMine(n) && notifAlive(n); }); }

function unreadCount(){ return myNotifs().filter(function(n){ return !n.read[ME_NAME]; }).length; }

function setNotifFilter(f){ NOTIF_FILTER = f; renderNotifPage(); }

function notifFiltered(){
  var list = myNotifs().sort(function(a,b){ return b.ts.localeCompare(a.ts); });
  if(NOTIF_FILTER==='未读') return list.filter(function(n){ return !n.read[ME_NAME]; });
  if(NOTIF_CATS.indexOf(NOTIF_FILTER)>-1) return list.filter(function(n){ return n.cat===NOTIF_FILTER; });
  return list;
}

function markAllNotifRead(){ notifFiltered().forEach(function(n){ n.read[ME_NAME] = true; }); updateBell(); renderNotifPage(); }

/* 演示按钮：触发几个事件，确认会弹 toast、进通知中心、收件人正确 */
function demoNotif(kind){
  var ayu = CASE_ITEMS.filter(function(x){ return x.id==='ayu'; })[0];
  if(kind==='report') pushNotif('面诊','诊疗方案已到：'+ayu.name+'（'+ayu.caseNo+'），已进入项目确认中', {caseId:'ayu'});
  else if(kind==='missed') pushNotif('视频','未接来电：KM1 室长 呼叫了 '+ayu.name+' 的案件视频', {caseId:'ayu', link:{kind:'caseRoom'}});
  else if(kind==='at'){
    ensureCaseRoom(ayu); var roomId = getCaseRoomId('ayu');
    CHAT_DATA[roomId].push({day:KD(0), from:'them', name:'KM1 室长', color:'var(--sage)', init:'이', orig:'@A1 室长 这位客人的报告我已经补充了，请看一下。', trans:'（演示译文）', time:nowTime(), ts:nowFullDt()});
    pushNotif('对话','KM1 室长 在「'+ayu.name+' · '+ayu.caseNo+'」里 @ 了你', {caseId:'ayu', names:[ME_NAME], link:{kind:'mention', roomId:roomId, msgIdx:CHAT_DATA[roomId].length-1}});
  }
  else if(kind==='system') pushNotif('系统','诊所管理账号更新了设定：面诊费 300,000 → 350,000 印尼盾，'+D(15)+' 起生效', {names:IN_COORDINATORS, link:{kind:'system'}, detail:{title:'面诊费调整', changes:['面诊费 300,000 → 350,000 印尼盾'], effective:D(15)+' 起'}});
  else if(kind==='noshow') pushNotif('预约','未到店（自动判定）：客人13 过预约时间30分钟未到店，已取消', {caseId:'bayu'});
  else if(kind==='schedule') pushNotif('赴韩施术','KR 确认施术时间：客人9 '+D(2)+' 14:00', {caseId:'nadia'});
  else if(kind==='other') pushNotif('面诊','诊疗方案已到：客人3（这个案件只有 A2 室长 操作过 → 只发给 A2 室长）', {caseId:'andi'});
}

/* 演示通知（各分类至少一条，含已读/未读） */
(function seedNotifs(){
  function add(cat, text, caseId, ts, read, link, detail, names){
    var n = {id:'n'+(++NOTIF_SEQ), cat:cat, text:text, caseId:caseId, ts:ts, recipients:names||['A1 室长'], read:read?{'A1 室长':true}:{}, link:link||(caseId?{kind:'case'}:{kind:'none'}), detail:detail||null};
    NOTIFS.push(n);
  }
  add('预约','客人自助预约提交：客人1（A000017）','siti',D(0)+' 09:05',false);
  add('预约','未到店（自动判定）：客人13 过预约时间30分钟未到店，已取消','bayu',D(-1)+' 10:31',true);
  add('预约','预约占位快过期（剩 5 分钟）：+62 812-3300-0099','',D(-1)+' 12:55',true,{kind:'none'});
  add('面诊','KR 确认预计出报告时间：客人6 '+D(2)+' 14:00','putri',D(-4)+' 16:00',true);
  add('面诊','等待报告超过预计时间：客人7（预计 '+D(0)+' 08:00）','dedi',D(0)+' 08:05',false);
  add('面诊','诊疗方案已到：客人2（A000006）','ayu',D(-2)+' 11:20',true);
  add('赴韩施术','KR 确认施术时间：客人9 '+D(2)+' 14:00','nadia',D(-3)+' 10:00',true);
  add('赴韩施术','客人已到医院：客人9','nadia',D(-1)+' 09:30',false);
  add('视频','未接来电：KM1 室长 呼叫了 客人2 的案件视频','ayu',D(-1)+' 15:20',false,{kind:'caseRoom'});
  add('对话','KM1 室长 在「客人2 · A000006」里 @ 了你','ayu',D(-2)+' 13:10',true,{kind:'mention', roomId:'case-ayu', msgIdx:0});
  add('系统','诊所管理账号更新了设定：营业时间 10:00–20:00 → 10:00–21:00，'+D(2)+' 起生效','',D(-2)+' 08:00',true,{kind:'system'},{title:'营业时间调整', changes:['营业时间 10:00–20:00 → 10:00–21:00'], effective:D(2)+' 起'},['A1 室长','A2 室长']);
})();

/* 日历上"等待报告超过预计时间"自动提醒用的标记：dedi 演示案件已经提醒过 */
CASE_ITEMS.filter(function(c){ return c.id==='dedi'; }).forEach(function(c){ c.overdueNotified = true; });


/* ================= chat drawer ================= */

var ROOMS = [
  {id:'main', name:'Main · 全员', isMain:true, color:'var(--slate2)', init:'G', date:'今天 09:20'},
  {id:'kr-lee', name:'KM1 室长 · 韩国室长', color:'var(--sage)', init:'이', date:'今天 14:02'},
  {id:'director-kim', name:'KD1 院长 · 院长', color:'var(--slate2)', init:'김', date:'昨天'},
  {id:'rina', name:'A2 室长 · 印尼室长', color:'var(--terracotta)', init:'R', date:'2 天前'},
  {id:'grp-KM1 室长-rina', name:'KM1 室长、A2 室长', color:'var(--blue)', init:'G', date:'今天'}
];

function drawerFootAction(){
  if(DRAWER_TAB==='case') openNewCaseChatModal();
  else openNewStaffChatModal();
}

var STAFF_ROSTER = [
  {id:'kr-lee', name:'KM1 室长 · 韩国室长'},
  {id:'director-kim', name:'KD1 院长 · 院长'},
  {id:'rina', name:'A2 室长 · 印尼室长'}
];

function confirmNewCaseChat(caseId){
  closeNewCaseChatModal();
  openCaseRoom(caseId); /* 房间按caseId固定，已有对话的案件会直接进入原来的房，不会重开 */
}

/* ---- 对话未读（2026-10-03，IN-CHAT-01）：顶部 💬 显示当前用户所在房间的未读消息数，**不含 @**（@ 在通知中心）；打开房间清零；院长账号不显示未读 ---- */
var ROOM_UNREAD = {'kr-lee':2, 'main':1, 'case-dedi':1};
 /* 演示 */
function totalUnread(){ var t = 0; Object.keys(ROOM_UNREAD).forEach(function(k){ if(CHAT_DATA.hasOwnProperty(k)) t += ROOM_UNREAD[k]||0; }); return t; }

/* 抽屉排序：房间最新一条消息的时间（day + time）→ 可比较的数字 */
function roomLastKey(roomId){
  var msgs = CHAT_DATA[roomId] || []; if(!msgs.length) return 0;
  var m = msgs[msgs.length-1], mm = (m.day||'').match(/(\d+)\D+(\d+)\D+(\d+)/), t = (m.time||'00:00').split(':');
  return mm ? ((+mm[1])*1e8 + (+mm[2])*1e6 + (+mm[3])*1e4 + (+t[0])*100 + (+t[1])) : 0;
}

var CHAT_DATA = {
  'kr-lee':[
    {day:KD(-1), from:'them', name:'KM1 室长', color:'var(--sage)', init:'이', orig:'客人1 자료 검토 부탁드립니다.', trans:'客人1 的材料麻烦帮忙看一下。', time:'14:00'},
    {day:KD(-1), from:'me', orig:'好的，我这边帮您确认，院长看完资料后会出报告。', time:'14:05'},
    {day:KD(0), from:'them', name:'KM1 室长', color:'var(--sage)', init:'이', orig:'면담 시간은 09.20 14:00 KST로 확정됐습니다.', trans:'预计出报告时间已确认为 09.20 14:00（KST）。', time:'09:12'},
    {day:KD(0), from:'me', orig:'这位客人的报告你看一下是否需要补充？', trans:'이 고객 리포트 보완이 필요한지 확인해 주세요.', time:'10:20', refCaseId:'ayu'},
    {day:KD(0), from:'me', orig:'客人22 之前的报告可以当参考。', trans:'客人22 님의 이전 리포트를 참고하세요.', time:'10:25', refCaseId:'lina'}
  ],
  'main':[
    {day:KD(0), from:'them', name:'KD1 院长', color:'var(--slate2)', init:'김', orig:'이번 주 신규 케이스 3건 검토 예정입니다.', trans:'本周有 3 个新案件待审核。', time:'09:00'},
    {day:KD(0), from:'them', name:'A2 室长', color:'var(--terracotta)', init:'R', orig:'客人20 案件资料补充中，晚点提交。', time:'09:20'},
    {day:KD(0), from:'them', name:'A2 室长', color:'var(--terracotta)', init:'R', orig:'@A1 室长 下午的持有项目对账麻烦你过来一下。', trans:'（演示译文）', time:'09:40'}
  ],
  'grp-KM1 室长-rina':[
    {day:KD(0), from:'them', name:'A2 室长', color:'var(--terracotta)', init:'R', orig:'这周 KR 那边的开放日期都排满了吗？', trans:'이번 주 KR 쪽 개방 일정이 다 찼나요?', time:'10:05'},
    {day:KD(0), from:'them', name:'KM1 室长', color:'var(--sage)', init:'이', orig:'아직 21일, 22일이 비어 있습니다.', trans:'21 日、22 日还有空位。', time:'10:12'}
  ],
  'director-kim':[
    {day:KD(-1), from:'them', name:'KD1 院长', color:'var(--slate2)', init:'김', orig:'客人1 자료 잘 받았습니다, 검토하겠습니다.', trans:'客人1 的材料已收到，我会审核。', time:'11:40'}
  ],
  'rina':[
    {day:KD(-2), from:'them', name:'A2 室长', color:'var(--terracotta)', init:'R', orig:'客人20 的材料我再补充一下', time:'16:20'}
  ],

  /* 案件专属房间：只给已经生成 Case ID 的案件开（见 docs/conversation-video-flow.md"只有主动发起过对话的案件才会存在"），
     每个案例配一条和它当前状态对得上的对话记录，这样"对话"抽屉的"案件"分类点进去看到的内容和案件详情页是一致的 */
  'case-yuni':[
    {day:KD(-2), from:'me', orig:'客人想先看一下术后管理的价格，我整理了项目单发给她。', trans:'고객이 시술 후 관리 가격부터 보고 싶어 해서 항목표를 보냈습니다.', time:'09:40'}
  ],
  'case-maya':[
    {day:KD(-2), from:'me', orig:'客人想知道大概多久能出报告。', trans:'고객이 리포트가 언제쯤 나오는지 궁금해합니다.', time:'14:40'},
    {day:KD(-2), from:'them', name:'KM1 室长', color:'var(--sage)', init:'이', orig:'수신했습니다, 원장님께 전달하겠습니다.', trans:'已收到，会转达给院长。', time:'15:10'}
  ],
  'case-putri':[
    {day:KD(-4), from:'them', name:'KM1 室长', color:'var(--sage)', init:'이', orig:'자료 확인했습니다. 원장님과 함께 검토 중입니다.', trans:'资料已确认，正在和院长一起看。', time:'16:05'}
  ],
  'case-dedi':[
    {day:KD(0), from:'me', orig:'客人在问报告什么时候能好，我先回复她还在等。', trans:'고객이 리포트 일정을 물어 아직 기다리는 중이라고 답했습니다.', time:'09:10'}
  ],
  'case-budi':[
    {day:KD(2), from:'them', name:'KD1 院长', color:'var(--slate2)', init:'김', orig:'윤곽 이완은 중등도입니다. 초음파 리프팅 먼저 평가하시죠.', trans:'轮廓松弛属中度，建议先评估超声刀。', time:'09:30'}
  ],
  'case-ayu':[
    {day:KD(1), from:'them', name:'KD1 院长', color:'var(--slate2)', init:'김', orig:'客人2 리포트 발송했습니다.', trans:'客人2 的面诊诊疗方案已发送。', time:'11:20'},
    {day:KD(0), from:'me', kind:'quote', speaker:'A1 室长', srcRoomId:'kr-lee', srcRoom:'KM1 室长 · 韩国室长', srcIdx:3, srcDt:'26-09-18 10:20', orig:'这位客人的报告你看一下是否需要补充？', trans:'이 고객 리포트 보완이 필요한지 확인해 주세요.', time:'10:20'} /* 从其他房间引用进来 */
  ],
  'case-fajar':[
    {day:KD(3), from:'me', orig:'客人说想再对比一下鼻翼缩小的价格，稍后回复。', trans:'고객이 콧볼 축소 가격을 다시 비교해 보겠다고 했습니다.', time:'10:00'}
  ],
  'case-dinda':[
    {day:KD(5), from:'me', orig:'客人问施术日期怎么选，我发了日历说明。', trans:'고객이 시술 날짜 선택 방법을 물어 달력 안내를 보냈습니다.', time:'10:05'}
  ],
  'case-nadia':[
    {day:KD(2), from:'me', orig:'客人已经到首尔了，酒店信息我发给 KR 室长。', trans:'고객이 서울에 도착했고 호텔 정보를 KR 실장님께 보냅니다.', time:'11:00'},
    {day:KD(4), from:'them', name:'KD1 院长', color:'var(--slate2)', init:'김', orig:'턱 보형물 시술 완료했습니다, 광대축소술은 다음 주 예정입니다.', trans:'下巴假体已完成，颧骨缩小下周进行。', time:'14:00'}
  ],
  'case-rizky':[
    {day:KD(1), from:'them', name:'A2 室长', color:'var(--terracotta)', init:'R', orig:'客人11 的赴韩项目已经全部完成，本地这边还剩一项', time:'09:30'}
  ],
  'case-rina':[
    {day:KD(-22), from:'me', orig:'客人对结果很满意，之后回来做护理再约。', trans:'고객이 결과에 매우 만족하며 이후 관리는 다시 예약하겠다고 했습니다.', time:'09:00'}
  ],
  'case-wulan':[
    {day:KD(-5), from:'me', orig:'客人反馈恢复得不错。', trans:'고객이 회복이 좋다고 했습니다.', time:'09:05'}
  ],
  'case-lina':[
    {day:KD(-6), from:'me', orig:'报告已经发给客人了，她想再考虑一下。', trans:'리포트를 고객에게 보냈고 조금 더 고민해 보겠다고 합니다.', time:'09:05'}
  ]

};

function getCaseRoomId(caseId){ return 'case-'+caseId; }

/* ---- 多医院的对话（2026-10-06）：Main 全员群每一组"诊所 × 医院"一个（id = main-医院ID）：本诊所的 IN 室长 + 该医院的 KR 室长 / 院长；
   案件对话房的 KR 成员只有该案件所选医院的人 ---- */
function isMainRoom(id){ return /^main(-|$)/.test(String(id||'')); }
function mainRoomId(hid){ return 'main-'+hid; }
function mainRoomHospital(id){ return String(id).indexOf('main-')===0 ? String(id).slice(5) : null; }
function caseKrHospital(c){ return caseHospitalId(c) || linkedHospitalIds(c.clinicId)[0] || null; } /* 案件的 KR 一侧是哪家医院（没选时只对接一家就是那家） */
/* "演示：模拟KR…"按钮写进案件 Timeline 的 KR 操作人：用该案件所选医院的室长/院长（不再写死 H1 的人） */
function krCoordShort(c){ return (c && c.krCoordinator ? c.krCoordinator.split(' ')[0] : null) || krCoordinatorsOf(c)[0] || 'KM1 室长'; }
/* KR 端通知（2026-10-06，KR 端系列 2/5·六）：写进该医院的资料里（全局存档），KR 页面收到存档变化后即时刷新
   to：'coord' = 该医院的 KR 室长/管理者；'director' = 案件所选院长；kind：'consultpaid' 等。IN 端的事件在这里调用 */
function pushKrNotif(hid, text, opt){
  var h = HOSPITAL_DATA[hid]; if(!h) return null;
  opt = opt || {};
  h.notifs = h.notifs || [];
  var n = {id:'kn'+Date.now()+Math.floor(Math.random()*1000), ts:opt.ts||nowFullDt(), text:text, clinicId:opt.clinicId||CURRENT_CLINIC_ID, caseId:opt.caseId||null, to:opt.to||'coord', director:opt.director||null, only:opt.only||null, kind:opt.kind||'case', by:(typeof currentAccount==='function'&&currentAccount()?currentAccount().name:null), level:opt.level||notifLevel(text), readBy:[]};
  h.notifs.unshift(n); if(h.notifs.length>200) h.notifs.length = 200;
  return n;
}
function krDirName(c){ return (c && c.director) || hospitalDirectorNames(caseKrHospital(c))[0] || 'KD1 院长'; }
function syncKrCoordinator(c){ var hs = hospitalCoordinators(caseKrHospital(c)); if(hs.length && (!c.krCoordinator || hs.indexOf(c.krCoordinator.split(' ')[0])<0)) c.krCoordinator = hs[0]+' 실장'; }
function krCoordinatorsOf(c){ return hospitalCoordinators(caseKrHospital(c)).slice(); }
function allKrCoordinatorNames(){ var out = []; Object.keys(HOSPITAL_DATA).forEach(function(h){ out = out.concat(HOSPITAL_DATA[h].coordinators || []); }); return out; } /* 认操作人用：所有医院的 KR 室长 */
/* 同事名单（新建对话房选人）：本诊所的 IN 室长 + 对接医院的 KR 室长、院长 */
function buildStaffRoster(cid){
  var out = [];
  clinicAccounts(cid).filter(function(a){ return a.role!=='owner' && a.status==='active' && a.name; }).forEach(function(a){ out.push({id:'in-'+a.name.toLowerCase(), name:a.name+' · 印尼室长'}); });
  linkedHospitalIds(cid).forEach(function(h){
    hospitalCoordinators(h).forEach(function(n){ out.push({id:'kr-'+n, name:n+' · 韩国室长'}); });
    hospitalDirectorNames(h).forEach(function(n){ var nm = n.split(' ')[0]; out.push({id:'director-'+nm, name:nm+' · 院长'}); });
  });
  return out;
}

function caseRoomMembers(c){
  var kr = caseHasKrSide(c);
  return {inn:IN_COORDINATORS.slice(), kr: kr ? krCoordinatorsOf(c) : [], director: (kr && c.director) ? c.director : null}; /* KR 成员只有该案件所选医院的室长和选定的院长 */
}

/* ---- 备忘 / OFF 数据（2026-10-02·七）：IN 室长的 OFF 从"新增 memo"来；KR 院长/KR 室长的 OFF 用演示数据代替（KR 端功能） ----
   {id, date, type:'备忘'|'OFF', scope:'公开'|'私人', role:'IN室长'|'KR室长'|'KR院长'(OFF 用), person:(OFF 的人), author, text} */
var DEMO_MEMOS = [
  /* IN 室长的 OFF（2026-10-08 重设）：A1 每周一；A2 单次整天 10/5、10/14、10/23、10/28；其余旧 OFF 清掉。KR 的 OFF 在 HOSPITAL_DATA[h].offs 里 */
  {id:'m2', date:'2026-10-05', type:'OFF', scope:'公开', role:'IN室长', person:'A2 室长', author:'A2 室长', text:''},
  {id:'m3', date:'2026-10-14', type:'OFF', scope:'公开', role:'IN室长', person:'A2 室长', author:'A2 室长', text:''},
  {id:'m4', date:'2026-10-23', type:'OFF', scope:'公开', role:'IN室长', person:'A2 室长', author:'A2 室长', text:''},
  {id:'m4b', date:'2026-10-28', type:'OFF', scope:'公开', role:'IN室长', person:'A2 室长', author:'A2 室长', text:''},
  {id:'m5', date:D(0), type:'备忘', scope:'公开', author:'A1 室长', text:'下午整理持有项目对账'},
  {id:'m6', date:D(-1), type:'备忘', scope:'私人', author:'A1 室长', text:'给 客人11 回电（私人）'}
];

(function(){ for(var d0 = -45; d0 <= 45; d0++){ var ds0 = D(d0); if(d0>=3 && (d0-3)%7===0 || d0<3 && (3-d0)%7===0) DEMO_MEMOS.push({id:'m1_'+ds0, date:ds0, type:'OFF', scope:'公开', role:'IN室长', person:'A1 室长', author:'A1 室长', text:''}); } })();
var CAL_MEMOS = (function(){ try{ var v = JSON.parse(localStorage.getItem('gmc_memos')||'null'); if(v) return v; }catch(e){} return DEMO_MEMOS.map(function(m){ return Object.assign({}, m); }); })();

function saveMemos(){ try{ localStorage.setItem('gmc_memos', JSON.stringify(CAL_MEMOS)); }catch(e){} }

function offNameKey(n){ return String(n||'').split(' ')[0]; }

/* 推播对象（2026-10-02·三）：这个案件所有操作过的室长（只发给当天上班的）；操作过的都 OFF → 改发给同一边当天上班的所有室长；被 @ 的人一定收到 */
/* "操作过"的定义（2026-10-08，IN-CASE-03 第 2 节；同日修正）：从接待开始实际处理过案件的室长，代约不算；
   **只有「已到店后基础资料有保存」的那次接待才算**：接待中还没保存、或被退回待访问的接待只留 Timeline，不计入 IN 室长栏 / 仅看我的 / 推播。
   实现：基础资料已保存（materialsConfirmed）时，从 Timeline 里最后一条"标记客人已到店"（= 这次保存的接待）起的记录才算；从没到店过的案件没有操作过的人；
   种子里没有"已到店"记录的已到店案件，按去掉代约 / 预约修改 / 预约取消 / 手动未到店这类预约到店阶段记录处理。列表、仅看我的、推播共用这一个函数 */
function caseArrivedEver(c){ return !!c.hasArrived || c.subState==='arrived' || (c.stage!=='booked' && !(c.stage==='cancelled' && ['预约取消','未到店'].indexOf(c.cancelReason)>-1)); }
function caseOperatedLogs(c){
  if(!c.materialsConfirmed) return []; /* 基础资料没保存：这次接待不算操作过 */
  var L = c.logEntries||[], k = -1;
  for(var i = L.length-1; i >= 0; i--){ if(/标记客人已到店/.test(L[i].action||'')){ k = i; break; } }
  if(k > -1) return L.slice(k);
  if(!caseArrivedEver(c)) return [];
  return L.filter(function(l){ return !(l.stage==='预约到店' && /代替预约|代约|预约修改|改约|取消预约|未到店|老客人预约/.test(l.action||'')); });
}
function caseOperators(c, strict){
  var inn = [], kr = [], innIds = {};
  caseOperatedLogs(c).forEach(function(l){
    var a = String(l.actor||''), id = l.actorId || LEGACY_STAFF_ID[a], acct = id ? accountById(id) : null;
    /* CMD-1008-14（A-010）：账号换使用人后，旧使用人做过的操作仍算旧使用人——按当时记下的名字 / 账号编号认，不看现在的账号名单 */
    if(IN_COORDINATORS.indexOf(a)>-1 || (acct && !acct.hospitalId)){ if(inn.indexOf(a)<0) inn.push(a); if(id) innIds[a] = id; }
    else { var k = offNameKey(a); if(allKrCoordinatorNames().indexOf(k)>-1 && kr.indexOf(k)<0) kr.push(k); }
  });
  if(!strict && !inn.length && c.inCoordinator) inn.push(c.inCoordinator); /* 推播用：没有任何操作记录时按案件默认负责室长；列表显示只按真实操作记录 */
  return {inn:inn, kr:kr, innIds:innIds};
}

function shouldPushToMe(c){ return pushTargets(c).inn.indexOf(ME_NAME)>-1; }
 /* 演示视角：当前登录的是 A1 室长（IN室长） */
function roomSysMsg(text){ return {day:KD(0), from:'sys', kind:'sys', orig:text, time:nowTime(), ts:nowFullDt()}; }

/* 建房：面诊案件缴费 / 免除面诊费时自动建（CMD-1008-14，不通知、不响铃）；其他案件点［发起对话］/新建案件对话时建；有房间之后才出现在抽屉里；建房时IN室长进入房间。［发起对话］直接打开已建好的房间 */
function ensureCaseRoom(c){
  var roomId = getCaseRoomId(c.id);
  if(!CHAT_DATA.hasOwnProperty(roomId)){
    CHAT_DATA[roomId] = IN_COORDINATORS.map(function(n){ return roomSysMsg(n+' 进入房间'); });
    if(caseHasKrSide(c) && krEnterRoomName(c)){ c.krInRoom = true; CHAT_DATA[roomId].push(roomSysMsg(krEnterRoomName(c)+' 进入房间')); } /* 两边都能真实联动，KR 室长从建房起就在房里（不再有「模拟 KR 进入房间」按钮） */
    (c.pendingQuotes||[]).forEach(function(q){ CHAT_DATA[roomId].push(q); }); c.pendingQuotes = []; /* 还没到建房条件时记下的引用，房间建立后带进房间 */
  }
  return roomId;
}

/* 输入框工具栏（2026-10-02）：职员间对话（Main、1:1、自建群）= [＋][提及案件]；案件对话房 = [＋][🎥 视频通话][提及案件]；
   删除：邀请室长视频、调取 timeline、预约、演示用时钟、原来单独的传文件/传图片（合并进［＋］）、文件库（改成标题栏 📁） */
function roomVideoEnabled(c){ return !!c && caseHasKrSide(c) && !!c.krInRoom; }

function clearRefChip(){ REF_CHIP = null; renderRefChip(); }

function pickRefCase(id){ closeMentionCase(); setRefChip(id); }

/* 输入框快捷键（2026-10-02）：@ 选人、# 选案件（等同［引用案件］）、Esc 关闭选单 */
function atCandidates(){
  if(CURRENT_ROOM.indexOf('case-')===0){
    var c = CASE_ITEMS.filter(function(x){ return x.id===CURRENT_ROOM.slice(5); })[0];
    if(c){ var m = caseRoomMembers(c); return m.inn.concat(m.kr).concat(m.director ? [m.director] : []); }
  }
  if(isMainRoom(CURRENT_ROOM)){ var mh = mainRoomHospital(CURRENT_ROOM); return IN_COORDINATORS.concat(hospitalCoordinators(mh)).concat(hospitalDirectorNames(mh)); }
  var r = roomById(CURRENT_ROOM); return [ME_NAME].concat(r ? [r.name.split(' ')[0]] : []);
}

function floatKey(e){
  if(e.key==='Escape'){ closeSuggest(); return; }
  if(e.key==='Enter'){ if(SUGGEST_ITEMS.length){ pickSuggest(0); return; } sendFloatMsg(); }
}

/* 引用写入案件：见上面的规则 */
function deliverRefQuote(c, q){
  if(!c || isEnded(c)) return 'skip';
  var roomId = getCaseRoomId(c.id);
  var msg = {day:q.day, from:'me', sender:ME_NAME, kind:'quote', speaker:q.speaker, srcRoomId:q.srcRoomId, srcRoom:q.srcRoom, srcIdx:q.srcIdx, srcDt:q.srcDt, orig:q.orig, trans:q.trans||'', time:nowTime(), ts:nowFullDt()};
  if(CHAT_DATA.hasOwnProperty(roomId)){ CHAT_DATA[roomId].push(msg); }
  else if(caseRoomEligible(c)){ ensureCaseRoom(c); CHAT_DATA[roomId].push(msg); }
  else {
    c.pendingQuotes = c.pendingQuotes || []; c.pendingQuotes.push(msg);
    logCaseEvent(c, actingName(), '引用消息（来自「'+q.srcRoom+'」）：'+q.orig+'——案件还没到建房条件，房间建立后带进房间');
    return 'pending';
  }
  logCaseEvent(c, actingName(), '从「'+q.srcRoom+'」引用了一条消息到案件对话房');
  return 'room';
}

function refBarHtml(caseId){
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0]; if(!c) return '';
  var ended = isEnded(c), b = caseStageBadge(c); /* 显示案件"现在的"大状态（渲染时实时读，案件推进后跟着变），样式同案件列表 */
  return '<div style="margin-top:4px;background:#EDEAE2;border-radius:10px;padding:6px 10px;font-size:11px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:var(--slate2);">📄 引用案件 '+(c.caseNo||c.name)+
    ' · <span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';">'+b[2]+'</span>'+
    ' <a href="#" class="info-link" style="color:var(--blue);" onclick="openCaseNewTab(\''+c.id+'\');return false;">查看案件</a>'+
    (ended ? '' : '<button class="btn-outline" style="padding:2px 10px;font-size:11px;background:#fff;" onclick="openCaseChatNewTab(\''+c.id+'\')">转到案件对话</button>')+'</div>';
}

var ROOM_FILE_SEQ = 1;

function krAcctId(name){ var a = ACCOUNTS.filter(function(x){ return x.hospitalId && x.name===name; })[0]; return a ? a.id : String(name||'').split(' ')[0]; }
function krEnterRoomName(c){ return (c.krCoordinator||krCoordinatorsOf(c)[0]||'').split(' ')[0]; }

function roomById(id){
  if(id && id.indexOf('case-')===0){
    var caseId = id.slice(5);
    var cc = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0];
    if(cc) return {id:id, name:cc.name+(cc.caseNo?' · '+cc.caseNo:''), color:'var(--terracotta)', init:cc.name.charAt(0).toUpperCase()};
  }
  return ROOMS.filter(function(r){return r.id===id;})[0];
}

function postCaseRoomFile(caseId, actorName, actorColor, actorInit, label){
  var cc = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0];
  if(!cc || !caseRoomEligible(cc)) return; /* 不符合建房条件（或已结案）的案件没有房间可推送 */
  var roomId = ensureCaseRoom(cc); /* 通话结束：AI文本+录像进附件，同时给房间推送一条消息（房间没建就按规则建） */
  CHAT_DATA[roomId].push(roomSysMsg('AI 文本与录像已存入附件')); /* 视频结束的系统消息（案件状态变化不发进对话房，看通知中心和案件 Timeline） */
  if(CURRENT_ROOM===roomId) renderFloatMessages();
}

function quoteDt(m){
  var mm = (m.day||'').match(/(\d+)\D+(\d+)\D+(\d+)/);
  var d = mm ? (mm[1].slice(-2)+'-'+(mm[2].length<2?'0':'')+mm[2]+'-'+(mm[3].length<2?'0':'')+mm[3]) : '00-00-00';
  return d+' '+(m.time||'00:00');
}

/* ---- 对话房成员（2026-09-30）：案件房成员=客人选择的院长+全部印尼室长+全部韩国室长（案件中途可能换人，院长可更换） ---- */
var IN_COORDINATORS = ['A1 室长','A2 室长'];

/* 成员下拉（2026-10-02 增量·三）：点击房间名称 ▾ 显示成员；院长标"静音"，OFF 的人标"今日 OFF"（取代原来的 👤 成员 icon） */
function memberRowsHtml(){
  var roomId = CURRENT_ROOM, r = roomById(roomId) || {name:roomId};
  var today = todayStr();
  var mute = '<span class="status-pill" style="background:#EDEAE2;color:var(--muted);font-size:10px;margin-left:6px;">静音</span>';
  var offTag = function(n){ return isOffOn(n, today) ? '<span class="status-pill" style="background:#FBE9E7;color:#C1454A;font-size:10px;margin-left:6px;">今日 OFF</span>' : ''; };
  var row = function(label, key, extra){ return '<div style="display:flex;align-items:center;padding:5px 0;font-size:13px;"><span>'+label+'</span>'+offTag(key)+(extra||'')+'</div>'; };
  var head = function(t){ return '<div style="font-size:11px;font-weight:700;color:var(--muted);margin:10px 0 2px;">'+t+'</div>'; };
  var html = '';
  if(roomId.indexOf('case-')===0){
    var c = CASE_ITEMS.filter(function(x){ return x.id===roomId.slice(5); })[0];
    if(c){
      var m = caseRoomMembers(c);
      html += head('印尼室长（全部）') + m.inn.map(function(n){ return row(n+' · 印尼室长', n); }).join('');
      if(m.kr.length){
        html += head('韩国室长（全部）') + m.kr.map(function(n){
          var inRoom = c.krInRoom && krAcctId(n)===krEnterRoomName(c); /* 用账号编号比较（成员名「KM1 室长」≠ 「KM1」，J-003） */
          return row(n+' 실장 · 韩国室长', n, '<span style="font-size:11px;margin-left:6px;color:'+(inRoom?'var(--sage)':'var(--muted)')+';">'+(inRoom?'已进入':'未进入')+'</span>');
        }).join('');
      }
      if(m.director) html += head('院长（选定院长，选定后不能更换）') + row(m.director+' · 院长', m.director, mute);
      if(!m.kr.length) html += '<div style="font-size:11px;color:var(--muted);margin-top:10px;">这个案件没有面诊：只有印尼室长。点"增加面诊"并缴费后，韩国室长和院长才会加入。</div>';
    }
  } else if(isMainRoom(roomId)){
    var mhid = mainRoomHospital(roomId);
    html += head('院长') + hospitalDirectorNames(mhid).map(function(d){ return row(d, d, mute); }).join('') +
      head('印尼室长') + IN_COORDINATORS.map(function(n){ return row(n, n); }).join('') +
      head('韩国室长') + hospitalCoordinators(mhid).map(function(n){ return row(n, n); }).join('');
  } else {
    html += head('成员') + row(ME_NAME+'（我）', ME_NAME) + row(r.name, r.name.split(' ')[0]);
  }
  return html;
}

/* 🔕（2026-10-02）：对自己关闭这个房间的提醒，可再打开；被 @ 照样提醒 */
var MUTED_ROOMS = {};

/* 消息显示的时间：新消息带 ts（UTC），按页面时区显示；旧演示消息只有 time 字符串 */
function msgTime(m){ return m && m.ts ? fmtUtcTime(m.ts) : (m ? m.time : ''); }
function nowTime(){ var d = demoNow(); return pad2(d.getHours())+':'+pad2(d.getMinutes()); } /* 页面时区的当前时间（旧显示用）；新消息同时存 ts（UTC） */

/* 初始化（2026-10-02）：已是终态的案件整理对话房进附件并删除；仍在进行的演示房间里，KR室长视为已进入 */
CASE_ITEMS.forEach(function(c){
  if(isEnded(c)) archiveCaseRoom(c);
  else if(CHAT_DATA.hasOwnProperty(getCaseRoomId(c.id)) && caseHasKrSide(c)) c.krInRoom = true;
});

/* 种子数据全部跑完：之后的操作人 = 当前登录的人；IN 室长名单按账号重算 */
SEEDING = false;
/* 在韩进行中的演示数据（KR 端系列 4/5）：客人9 = 在韩进行中（今天施术，有 timeline）；A2 室长 / 客人21 = 已结案（子项全部完成）；客人10（H2）已付定金还没有 timeline */
(function seedKrProgress(){
  var byId = function(id){ return CASE_ITEMS.filter(function(x){ return x.id===id; })[0]; };
  var mk = function(c, n, date, content, kind, place, done, proj){ return {id:'s'+c.id+n, no:c.caseNo+'-'+pad2(n), date:date, content:content, kind:kind, place:place, projectName:proj||'', done:!!done, doneAt:done?date+' 12:00':'', doneBy:done?'KM1 室长':'', informed:false}; };
  var nad = byId('nadia'); if(nad){
    nad.krJudge = {result:'ok', settled:true};
    var first = krActiveItems(nad)[0];
    nad.subItems = [mk(nad,1,D(0),'施术（'+(first?first.name:'')+'）','施术','KR',false,first?first.name:''), mk(nad,2,D(1),'复诊','复诊','KR',false), mk(nad,3,D(5),'拆线（印尼 / 韩国均可）','管理','either',false)];
  }
  var rina = byId('rina'); if(rina){ rina.subItems = [mk(rina,1,D(-24),'施术','施术','KR',true), mk(rina,2,D(-23),'复诊','复诊','KR',true)]; /* 子项日期和施术日 krSchedule.confirmedDate 对齐（原来错成施术日之前 13 天） */ rina.krJudge = rina.krJudge || {result:'ok', settled:true}; }
  var wulan = byId('wulan'); if(wulan){ wulan.subItems = [mk(wulan,1,D(-5),'施术','施术','KR',true), mk(wulan,2,D(-4),'复诊','复诊','KR',true)]; wulan.krJudge = wulan.krJudge || {result:'ok', settled:true}; }
})();
initHospitalData();
seedKrMonthDemo(); /* 休诊 / OFF / 开放日期 / 不可预约块先就位，后面的施术案件按它们选日期 */
normalizeSeeds();
/* 院长资料（KR-DOC-01 介绍卡）：名单 ≠ 账号。字段：nameEn / nameZh / title（代表院长|院长）/ photo / color / career[{when:现|前, ko, zh, id}] / certs[] / societies[]（{ko, zh, id}）/ specialties[项目名，选自本医院项目库]
   韩文填写，演示翻译成印尼文 / 中文，可修改（demoTranslate，不是真实翻译） */
function trItem(ko){ return {ko:ko, zh:demoTranslate(ko,'ko','zh'), id:demoTranslate(ko,'ko','id')}; }
function seedDoctorProfiles(){
  var P = {
    'KD1 院长':{nameEn:'', nameZh:'', title:'院长', color:'#C9B8A3', career:[['现','서울 소수 성형외과 원장'],['前','강남 ID 병원 원장']], certs:['Ulthera 공식 인증의'], societies:['대한성형외과학회 정회원'], specialties:['假体隆鼻','鼻翼缩小','鼻综合（假体+鼻尖）']},
    'H1 院长3':{nameEn:'', nameZh:'', title:'院长', color:'#C4C4C4', career:[['前','서울 소수 성형외과 원장（퇴직）']], certs:[], societies:[], specialties:['颧骨缩小']},
    'KO1 代表院长':{nameEn:'', nameZh:'', title:'代表院长', color:'#D3B8B8', career:[['现','서울 소수 성형외과 대표원장'],['前','압구정 소수 클리닉 원장']], certs:['Alma Accent Prime Key Doctor'], societies:['한국미용성형레이저의학회 회원'], specialties:['自体脂肪移植（全脸）','面部拉皮']},
    'H2 院长1':{nameEn:'', nameZh:'', title:'院长', color:'#B9C3D6', career:[['现','강남 뷰티의원 원장']], certs:['대한성형외과학회 전문의'], societies:['대한성형외과학회 정회원'], specialties:['切开双眼皮','假体隆鼻','鼻综合（假体+鼻尖）']},
    'H2 院长2':{nameEn:'', nameZh:'', title:'院长', color:'#D6CDB9', career:[['现','강남 뷰티의원 원장']], certs:[], societies:[], specialties:['颧骨缩小','下颌角整形']},
    'H2 院长3':{nameEn:'', nameZh:'', title:'院长', color:'#C4C4C4', career:[['前','강남 뷰티의원 원장（퇴직）']], certs:[], societies:[], specialties:[]}
  };
  Object.keys(HOSPITAL_DATA).forEach(function(hid){
    var h = HOSPITAL_DATA[hid];
    if(hid==='H1' && !h.directors.some(function(x){ return x.name==='KO1 代表院长'; })){ h.directors.push({id:'H1-D4', name:'KO1 代表院长', active:true}); h.openDates['KO1 代表院长'] = []; } /* 代表院长也在名单里（她的老板账号只管营运，两个身份分开） */
    h.directors.forEach(function(dr){
      var p = P[dr.name]; if(!p || dr.nameEn) return;
      dr.nameEn = p.nameEn; dr.nameZh = p.nameZh; dr.title = p.title; dr.color = p.color; dr.photo = '';
      dr.career = p.career.map(function(c0){ var t0 = trItem(c0[1]); t0.when = c0[0]; return t0; });
      dr.certs = p.certs.map(trItem); dr.societies = p.societies.map(trItem); dr.specialties = p.specialties.slice();
    });
  });
}
seedDoctorProfiles();
/* 赴韩项目默认资料（KR-SRVC-01）：所需术后管理 / 麻醉 / 推荐在韩时间 / 施术时长；KR 写诊疗方案、更换、补加、加做时自动带入 */
function seedProjectDefaults(){
  var swell = {mgmt:'术后管理', kr:'术后消肿管理', times:3, interval:2, start:3, place:'either', day:'第3、5、7天'}, thread = {mgmt:'拆线', kr:'拆线', times:1, place:'KR', start:7, day:'第7天'}, check = {mgmt:'术后复诊', kr:'术后复诊检查', times:1, place:'KR', start:2, day:'第2天'};
  var D0 = {
    '切开双眼皮':{stay:'5天', durMin:90, anes:'sleep', anesNote:'需空腹 6 小时', postcare:[check, thread, swell]},
    '埋线双眼皮':{stay:'3天', durMin:45, anes:'local', anesNote:'', postcare:[thread]},
    '假体隆鼻':{stay:'7天', durMin:120, anes:'sleep', anesNote:'需空腹 6 小时', postcare:[check, thread, swell]},
    '鼻翼缩小':{stay:'5天', durMin:60, anes:'local', anesNote:'', postcare:[thread]},
    '鼻综合（假体+鼻尖）':{stay:'10天', durMin:150, anes:'sleep', anesNote:'需空腹 8 小时', postcare:[check, thread, swell]},
    '颧骨缩小':{stay:'10天', durMin:180, anes:'general', anesNote:'全麻需空腹 8 小时', postcare:[check, thread, {kr:'术后消肿管理', times:5, place:'either', day:'第3天'}]},
    '下颌角整形':{stay:'10天', durMin:180, anes:'general', anesNote:'全麻需空腹 8 小时', postcare:[check, thread]},
    '下巴假体 / 颏成形':{stay:'7天', durMin:90, anes:'sleep', anesNote:'需空腹 6 小时', postcare:[check, thread]},
    '自体脂肪移植（全脸）':{stay:'7天', durMin:150, anes:'sleep', anesNote:'需空腹 6 小时', postcare:[check, swell]},
    '面部拉皮':{stay:'14天', durMin:240, anes:'general', anesNote:'全麻需空腹 8 小时', postcare:[check, thread]}
  };
  Object.keys(HOSPITAL_DATA).forEach(function(hid){ (HOSPITAL_DATA[hid].projects||[]).forEach(function(p){ var df = D0[p.name]; if(df && !p.defaults) p.defaults = JSON.parse(JSON.stringify(df)); }); });
}
seedProjectDefaults();
/* 演示案件的赴韩项目补上推荐在韩天数 / 麻醉 / 所需术后管理（从医院项目库默认资料带入；推荐项目整理才有内容，CMD-1012-14） */
function gmcFillKrMeta(cases){
  (cases || []).forEach(function(c){ /* 意向项目只留赴韩手术项目（CMD-1013-02 一）：演示数据里引用到的本地项目 / 术后管理类顺手去掉 */
    if((c.intentionProjects||[]).length) c.intentionProjects = c.intentionProjects.filter(function(it){ return it.origin==='KR' && ['术后消肿管理','消肿管理','术后管理','拆线','术后复诊检查','术后复诊','伤口护理'].indexOf(it.name)<0; });
  });
  var ANES = {local:'局部麻醉', sleep:'睡眠麻醉', general:'全身麻醉'};
  (cases || []).forEach(function(c){
    var h = HOSPITAL_DATA[c.hospitalId || 'H1']; if(!h) return;
    (c.procedureItems || []).forEach(function(it){
      if(it.origin!=='KR' || it.stay || it.anesthesia || (it.postcare || []).length) return;
      var p = (h.projects || []).filter(function(x){ return x.name===it.name && x.defaults; })[0], df = p && p.defaults;
      if(!df) Object.keys(HOSPITAL_DATA).some(function(k){ var q = (HOSPITAL_DATA[k].projects || []).filter(function(x){ return x.name===it.name && x.defaults; })[0]; if(q){ df = q.defaults; return true; } return false; }); /* 本医院项目库里没有这个项目（演示数据）：借用别家医院同名项目的默认资料 */
      if(!df) return;
      it.stay = df.stay; it.anesthesia = {type:df.anes, label:ANES[df.anes], note:df.anesNote || ''};
      it.postcare = (df.postcare || []).map(function(x){
        var o = {mgmt:x.mgmt || '', name:x.kr, times:x.times, interval:x.times>1 ? (parseInt(x.interval,10) || 1) : 0, place:x.place, startDay:parseInt(x.start,10) || 0, innName:'', inTimes:0};
        o.day = pcDayText(o); return o;
      });
    });
  });
}
Object.keys(HOSPITAL_DATA).forEach(normSchedBlocks);
CASE_ITEMS.forEach(function(c){ if(c.krSchedule && c.krSchedule.confirmedDate && ['confirmed','arrived','change_pending'].indexOf(c.krSchedule.status)>-1 && c.director) syncSurgeryBlock(c); }); /* 演示数据里已确认施术时间的案件，院长日程里也有施术块 */
CURRENT_CLINIC_ID = PAGE_CLINIC_ID || 'C1'; /* 种子按 C1 生成完了；之后这个页面属于哪家诊所就是哪家（读档时 store.js 再把那家诊所的分区读进来） */
normClientNames();
syncInCoordinators();
applyClinicSettings();
/* C1 种子 + 全局种子（账号、日志、医院资料）的系统时间点换算成 UTC */
(function(){ try{
  seedFixVisits(); /* 预约 / 占位不能落在休诊时段 */ seedSnapshotConsultFee();
  seedResolveOverlaps(); /* 同一院长同一时间只有一件事：删掉和施术重叠的不可预约 */
  seedTimesToUtc([CASE_ITEMS, CLIENTS, NOTIFS, SMS_LOG, CHAT_DATA], clinicTzOf(CLINIC_SETTINGS));
  seedTimesToUtc(ACCOUNTS.filter(function(a){ return !a.hospitalId; }).concat(ACCOUNT_LOG.filter(function(l){ return !l.hospitalId; })), clinicTzOf(CLINIC_SETTINGS));
  seedTimesToUtc(ACCOUNTS.filter(function(a){ return a.hospitalId; }).concat(ACCOUNT_LOG.filter(function(l){ return l.hospitalId; })).concat([HOSPITAL_DATA]), KR_TZ);
  try{ seedConsultBlocks(); seedSurgerySubs(); }catch(e){ console.warn('[seed] 面诊块 / 施术子项', e); }
}catch(e){ console.error('[种子] 时间换算', e); } })();

/* ================= 多诊所 × 多医院：种子整理（2026-10-06，KR 端系列 1/5） ================= */
var GLOBAL_VAR_NAMES = ['DEMO_SHIFT_MS', 'HOSPITALS', 'CLINICS', 'CLINIC_HOSPITALS', 'HOSPITAL_DATA', 'ACCOUNTS', 'ACCOUNT_LOG', 'CASE_NO_SEQ', 'PROJCAT_SEQ', 'KR_CATEGORIES', 'PROJ_SEQ', 'LIB_CASE_SEQ'];
var CLINIC_VAR_NAMES = ['CLINIC_SETTINGS', 'PURCHASE_REQ', 'ACCOUNT_SEQ', 'RESUMED_VISITS', 'PLACEHOLDER_HISTORY', 'PLACEHOLDER_SEQ', 'RESERVATION_PLACEHOLDERS',
  'CLIENTS', 'CLIENT_HOLDINGS', 'CASE_ITEMS', 'NOTIF_SEQ', 'NOTIFS', 'ROOMS', 'STAFF_ROSTER', 'ROOM_UNREAD', 'CHAT_DATA', 'MUTED_ROOMS', 'ROOM_FILE_SEQ', 'CAL_MEMOS', 'SMS_LOG', 'SMS_SEQ',
  'LIB_PROBLEM_SEQ', 'LIB_PROBLEMS', 'LIB_PROBLEM_IDS', 'PROJECT_CATEGORIES', 'PROJECT_LIBRARY', 'LIB_CASES', 'PROMOS', 'PACKAGES'];
/* PROJECT_LIBRARY / LIB_CASES / PROJECT_CATEGORIES 在内存里是"合成"的（本诊所的 + 对接医院 / 标准部位的）；PCAT（分类名→id）由分类重建，不存档：本诊所的 IN 项 + 对接医院的 KR 项；存档时按 hospitalId 拆回医院（store.js 的 viewSplit） */

function dayList(arr){ return arr.map(function(n){ return D(n); }); }
/* 医院资料（H1 沿用原来的种子变量；H2 是新医院，赴韩项目和案例见"五、演示数据"） */
function initHospitalData(){
  HOSPITAL_DATA = {
    H1:{
      directors: DIRECTOR_INFO.map(function(d, i){ return {id:'H1-D'+(i+1), name:d.name, active:d.active}; }),
      coordinators: KR_COORDINATORS.slice(),
      openTime:'11:00', closeTime:'21:30', openDates: {}, closedRules: [{dow:0, from:''}, {dow:6, from:'16:00'}], lunch: {from:'13:00', to:'14:00'}, /* 营业时间（韩国时间）；医院每周日休诊 + 周六 16:00 起休诊（韩国时间） */
      directorSchedule: {}, coordSchedule: [], projects:[], libCases:[],
      offs: [], /* OFF 在 seedKrMonthDemo 里设（KO1 每周一 + 10/20 年假；KD1 每周三 + 10/15 上午；KM1 每周四；KC1 每周五） */
      dayConfirm: {}, reportRead: {}, chatRead: {},
      notifs: [
        {id:'kn1', ts:D(-2)+' 14:40', text:'客人已缴面诊费：客人5（A000002，GMC 合作诊所（雅加达））→ 请确认报告时间', clinicId:'C1', caseId:'maya', to:'coord', director:null, kind:'consultpaid', readBy:[]},
        {id:'kn2', ts:D(0)+' 08:00', text:'报告已超过预计时间：客人7（A000004）', clinicId:'C1', caseId:'dedi', to:'coord', director:null, kind:'overdue', readBy:[]},
        {id:'kn3', ts:D(0)+' 09:30', text:'等你出报告：客人6（A000003），预计 '+D(2)+' 14:00', clinicId:'C1', caseId:'putri', to:'director', director:'KD1 院长', kind:'waitreport', readBy:[]}
      ]
    },
    H2:{
      directors: [{id:'H2-D1', name:'H2 院长1', active:true}, {id:'H2-D2', name:'H2 院长2', active:true}, {id:'H2-D3', name:'H2 院长3', active:false}],
      coordinators: ['KM2 室长', 'KC2 室长'],
      openTime:'11:00', closeTime:'21:30', openDates: {}, closedRules: [{dow:0, from:''}, {dow:6, from:'16:00'}], lunch: {from:'13:00', to:'14:00'},
      directorSchedule: {}, coordSchedule: [], projects:[], libCases:[],
      offs: [], /* H2 的旧 OFF 清掉 */
      dayConfirm: {}, reportRead: {}, chatRead: {}, notifs: []
    }
  };
}
/* 老的种子变量（DIRECTOR_INFO / KR_COORDINATORS / KR_OPEN_DATES / KR_DIRECTOR_SCHEDULE / KR_COORD_SCHEDULE）只在生成 HOSPITAL_DATA.H1 时用一次；运行时一律读 HOSPITAL_DATA（hospitalDirectors / hospitalCoordinators / hospitalOpenDates 等）。 */
/* 把合成数组（种子全在里面）拆开：KR 项目/案例归医院，IN 的留在诊所里；然后按本诊所对接的医院重新合成 */
function buildClinicViews(inProjects, inCases, inCats){
  if(inCats){ /* 分类：本诊所的本地分类 + 全系统标准部位；PCAT（分类名→id）跟着重建 */
    Object.keys(PROJECT_CATEGORIES).forEach(function(k){ delete PROJECT_CATEGORIES[k]; });
    Object.keys(inCats).forEach(function(k){ PROJECT_CATEGORIES[k] = inCats[k]; });
    Object.keys(KR_CATEGORIES).forEach(function(k){ PROJECT_CATEGORIES[k] = KR_CATEGORIES[k]; });
    Object.keys(PCAT).forEach(function(k){ delete PCAT[k]; });
    Object.keys(PROJECT_CATEGORIES).forEach(function(k){ PCAT[PROJECT_CATEGORIES[k].label] = k; });
  }
  var hs = linkedHospitalIds(CURRENT_CLINIC_ID), pp = inProjects.slice(), cc = inCases.slice();
  hs.forEach(function(h){ var d = HOSPITAL_DATA[h]; if(d){ pp = pp.concat(d.projects || []); cc = cc.concat(d.libCases || []); } });
  PROJECT_LIBRARY.length = 0; Array.prototype.push.apply(PROJECT_LIBRARY, pp);
  LIB_CASES.length = 0; Array.prototype.push.apply(LIB_CASES, cc);
}
/* H2（강남 뷰티의원）的赴韩项目和案例；C1 的几个案件改成属于 H2（名字按 H2 的人换掉） */
function seedHospitalH2(){
  /* 两家医院各自的「韩国术后管理」项目（韩元，演示数据；价格两家不同） */
  [['H1',[['术后消肿管理',0],['拆线',0],['术后复诊检查',0],['伤口护理',0]]], ['H2',[['术后消肿管理',0],['拆线',0],['术后复诊检查',0],['伤口护理',0]]]] /* 在韩术后管理全部免费（手术附带，CMD-1012-04） */.forEach(function(r){
    r[1].forEach(function(x){ var p = makeProj(x[0], x[1], 'KR', '韩国术后管理', r[0]); p.names = {zh:p.name, ko:demoTranslate(p.name,'zh','ko'), id:demoTranslate(p.name,'zh','id')}; PROJECT_LIBRARY.push(p); });
  });
  [['切开双眼皮',2200000,'眼部'],['埋线双眼皮',1200000,'眼部'],['双眼皮修复',3500000,'眼部'],['假体隆鼻',3000000,'鼻部'],['鼻综合（假体+鼻尖）',5800000,'鼻部'],
   ['颧骨缩小',8500000,'轮廓'],['下颌角整形',9500000,'轮廓'],['面部提升线雕',6000000,'面部年轻化'],['自体脂肪移植（全脸）',5000000,'面部年轻化']].forEach(function(r){
    var p = makeProj(r[0], r[1], 'KR', r[2], 'H2');
    p.names = {zh:p.name, ko:demoTranslate(p.name,'zh','ko'), id:demoTranslate(p.name,'zh','id')};
    PROJECT_LIBRARY.push(p);
  });
  var pid = function(n){ var q = PROJECT_LIBRARY.filter(function(x){ return x.name===n && x.hospitalId==='H2'; })[0]; return q ? q.id : null; };
  var colors = ['#D9CFC1','#CFD9D3','#D3CFD9'], ci = 0;
  var mk = function(title, projNames, director, recs, day){
    var id = newLibCaseId();
    LIB_CASES.push({id:id, hospitalId:'H2', title:title, names:{zh:title, ko:demoTranslate(title,'zh','ko'), id:demoTranslate(title,'zh','id')}, source:'travel',
      projectIds:projNames.map(pid).filter(Boolean), director:director, problemIds:[],
      beforePhotos:[{url:'', color:'#E6DDD0'}], afterPhotos:recs.map(function(r){ return {url:'', color:colors[(ci++)%colors.length], recovery:r, recoveryCustom:''}; }),
      consent:{signed:true, file:'consent-'+id+'.pdf'}, uploader:'KM2 室长（KR室长）', uploadedAt:D(-day)+' 10:00', editedBy:null, editedAt:null});
  };
  mk('切开双眼皮 · 自然型（강남）', ['切开双眼皮'], 'H2 院长1', ['1周','1个月'], 12);
  mk('假体隆鼻 · 侧面线条（강남）', ['假体隆鼻'], 'H2 院长2', ['1个月','3个月'], 10);
  mk('颧骨缩小 · 脸型改善（강남）', ['颧骨缩小'], 'H2 院长3', ['3个月'], 8); /* H2 院长3 已停用 → 院长显示"-" */
}
function moveSeedCaseToH2(caseId, director){
  var H2_NAME_MAP = [['KD1 院长','H2 院长1'], ['KO1 代表院长','H2 院长2'], ['H1 院长3','H2 院长3'], ['KM1 室长','KM2 室长'], ['KC1 室长','KC2 室长']];
  var c = CASE_ITEMS.filter(function(x){ return x.id===caseId; })[0]; if(!c) return;
  var swap = function(o){ var j = JSON.stringify(o); H2_NAME_MAP.forEach(function(m){ j = j.split(m[0]).join(m[1]); }); return JSON.parse(j); };
  var nc = swap(c); Object.keys(c).forEach(function(k){ delete c[k]; }); Object.assign(c, nc);
  c.hospitalId = 'H2'; if(director) c.director = director;
  var rk = 'case-'+caseId; if(CHAT_DATA[rk]) CHAT_DATA[rk] = swap(CHAT_DATA[rk]);
}
/* 一诊所一医院（2026-10-07）：原来 C1 里对接 H2 的四个案件（客人20 / 客人10 / 客人21 / 客人22）连同客户、持有项目、对话、通知，整体迁到新诊所 C3（巴厘，对接 H2）；案件编号保持原样。
   normalizeSeeds 先把它们从 C1 的种子里抽出来放进 C3_STASH，buildClinicSeed('C3') 时再装进 C3 的分区 */
/* 种子里的赴韩结算单按新公式重算：定金 = 施术项目 × 比例；尾款 = 其余；术后管理不计价（含已取消的项目——原结算单当时就是按全部项目收的定金） */
function recomputeSeedKrBatches(){
  CASE_ITEMS.forEach(function(c){
    (c.settlementBatches||[]).forEach(function(b){
      if(!b.krTotal || b.noDeposit || b.addOn) return;
      var its = (c.procedureItems||[]).filter(function(it){ return it.batchId===b.id && it.origin==='KR'; });
      if(!its.length || !its.every(function(it){ return it.price>0; })) return;
      var bd = computeBatchBreakdown(its); b.krTotal = bd.krTotal; b.krDeposit = bd.krDeposit; b.krBalance = bd.krBalance; b.krProvisional = 0;
    });
  });
}
function stashC3Seeds(){
  var mine = CASE_ITEMS.filter(function(x){ return C3_CASE_IDS.indexOf(x.id)>-1; }), names = mine.map(function(c){ return c.name; });
  /* C3 的室长是 D1 室长（D1）：原来案件里的 A1 室长 / A2 室长（C1 的室长）一并换掉 */
  var swap = function(o){ var j = JSON.stringify(o).split('A1 室长').join('D1 室长').split('A2 室长').join('D1 室长').replace(/"actorId":"A\d"/g, '"actorId":"D1"'); return JSON.parse(j); };
  C3_STASH = {cases:mine.map(function(c){ var n = swap(c); n.clinicId = 'C3'; n.hospitalId = 'H2'; if(n.inCoordinator) n.inCoordinator = 'D1 室长'; return n; }),
    clients:CLIENTS.filter(function(x){ return names.indexOf(x.name)>-1; }).map(function(x){ var n = swap(x); n.clinicId = 'C3'; return n; }), holdings:{}, chat:{}, notifs:[]};
  names.forEach(function(n){ if(CLIENT_HOLDINGS[n]){ C3_STASH.holdings[n] = JSON.parse(JSON.stringify(CLIENT_HOLDINGS[n])); delete CLIENT_HOLDINGS[n]; } });
  C3_CASE_IDS.forEach(function(id){ var k = 'case-'+id; if(CHAT_DATA[k]){ C3_STASH.chat[k] = swap(CHAT_DATA[k]); delete CHAT_DATA[k]; } delete ROOM_UNREAD[k]; });
  C3_STASH.notifs = NOTIFS.filter(function(n){ return C3_CASE_IDS.indexOf(n.caseId)>-1; }).map(function(n){ return swap(n); });
  for(var i = CASE_ITEMS.length-1; i>=0; i--){ if(C3_CASE_IDS.indexOf(CASE_ITEMS[i].id)>-1) CASE_ITEMS.splice(i,1); }
  for(var j = CLIENTS.length-1; j>=0; j--){ if(names.indexOf(CLIENTS[j].name)>-1) CLIENTS.splice(j,1); }
  for(var k2 = NOTIFS.length-1; k2>=0; k2--){ if(C3_CASE_IDS.indexOf(NOTIFS[k2].caseId)>-1) NOTIFS.splice(k2,1); }
  /* C1 里提到这几个案件的对话消息去掉（引用案件已不在本诊所） */
  Object.keys(CHAT_DATA).forEach(function(k){ CHAT_DATA[k] = (CHAT_DATA[k]||[]).filter(function(m){ return C3_CASE_IDS.indexOf(m.refCaseId)<0 && !/客人20|客人10|客人21|客人22/.test((m.orig||'')+(m.trans||'')); }); });
}
/* 已确认施术时间的演示案件（KR 日程的"施术"块由它们生成）：o = {id, name, phone, clinicId?, director, hospitalId, krCoordinator, date, time, items:[[项目名, 价格]]} */
function seedSurgeryCase(o){
  o.date = seedSurgeryDate(o.hospitalId, o.director, o.date, o.time); /* 避开医院休诊 / 院长 OFF / 未开放日 */
  if(!clientByName(o.name)) addClient({name:o.name, phone:o.phone, gender:'女', dob:'1990-05-05', createdBy:'客人自助', source:'客户自助预约建档', consent:{version:'v1.0', ts:D(-12)+' 10:00', source:'客户自助预约'}});
  var items = o.items.map(function(i){ return {name:i[0], origin:'KR', price:i[1], done:false, batchId:'B1'}; }), total = items.reduce(function(t, i){ return t + i.price; }, 0), dep = Math.round(total*KR_DEPOSIT_RATE);
  var c = makeCase({id:o.id, name:o.name, subState:'arrived', materialsConfirmed:true, caseNo:generateCaseNo(), director:o.director, hospitalId:o.hospitalId, krCoordinator:o.krCoordinator, updated:'3 天前',
    concern:'（演示）', expectation:'（演示）', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true, reportDate:D(-8),
    consultFiles:[{label:'面诊诊疗方案'}], projectsEnabled:true, projectsLocked:true, settlementDone:true,
    krSchedule:{status:'confirmed', confirmedDate:o.date, confirmedTime:o.time, primary:o.date, backup:'', changePrimary:'', changeBackup:'', changeSubmitted:false},
    procedureItems:items, settlementBatches:[{id:'B1', orderedBy:actingName(), settledBy:'客人', time:D(-5)+' 10:00', status:'active', krTotal:total, krDeposit:dep, krBalance:total-dep, inTotal:0}],
    logEntries:[{stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-12)+' 09:00'}, {stage:'面诊安排', actor:o.director, action:'KR室长提交面诊诊疗方案，已出诊疗方案', dt:D(-8)+' 10:00'}, {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1），项目清单已锁定', dt:D(-5)+' 10:00'}, {stage:'赴韩施术', actor:'KR', action:'KR确认施术时间：'+o.date+' '+o.time, dt:D(-4)+' 11:00'}]});
  if(o.clinicId) c.clinicId = o.clinicId;
  CASE_ITEMS.push(c); updateCaseStage(c);
  return c;
}
/* ---- KR 医院日程演示数据（2026-10-07，CMD-1007-03）：今天前后各一个月、排得够密；每次生成结果一样（不随机），重置演示数据后仍是这一套 ----
   · 不可预约块：每位院长大部分工作日都有 1～3 块（含 10:00–13:30 这样的长块），不同院长的块在时间上互相重叠；
   · OFF：整天 / 上午 / 下午都有；开放施术日期：不同院长不同；医院休诊日每家医院至少 2 天（含一个过去的）；
   · 施术块不在这里写：由已确认施术时间的案件生成（syncSurgeryBlock），C1、C2、C3 都有真实案件。 */
function seedKrMonthDemo(){
  /* 休诊：医院每周日 + 周六 16:00 起（在 initHospitalData 里设 closedRules）；OFF（2026-10-08 重设，其余旧 OFF 全部清掉）：
     KO1 代表院长：每周一 + 10/20 年假（整天）；KD1 院长：每周三 + 10/15 上午半休；KM1 室长：每周四；KC1 室长：每周五；H2 没有 OFF */
  var T = [['11:00','12:30'], ['11:00','13:00'], ['11:30','13:00'], ['12:00','13:00'], ['14:00','15:30'], ['14:00','16:30'], ['15:30','17:00'], ['17:00','19:30']]; /* 不可预约块都在医院营业时间（韩国 11:00–21:30）内，不落在午休（13:00–14:00）；周六 16:00 起休诊的由 cf 判断挡掉 */
  var pick = function(seed){ var x = Math.sin(seed*12.9898)*43758.5453; return x - Math.floor(x); };
  var CFG = {
    H1:{offs:[{who:'KO1 代表院长', kind:'director', part:'全天', weekly:true, dow:1}, {who:'KO1 代表院长', kind:'director', part:'全天', date:'2026-10-20', note:'年假'}, {who:'KD1 院长', kind:'director', part:'全天', weekly:true, dow:3}, {who:'KD1 院长', kind:'director', part:'上午', date:'2026-10-15'}, {who:'KM1 室长', kind:'coord', part:'全天', weekly:true, dow:4}, {who:'KC1 室长', kind:'coord', part:'全天', weekly:true, dow:5}],
        open:{'KD1 院长':[1,2,4,5], 'KO1 代表院长':[2,3,4,5,6]}},
    H2:{offs:[], open:{'H2 院长1':[1,3,5], 'H2 院长2':[2,4,6]}}
  };
  Object.keys(CFG).forEach(function(hid, hi){
    var h = HOSPITAL_DATA[hid]; if(!h) return; var cfg = CFG[hid];
    h.offs = []; /* 每周 OFF 展开成单次条目（-45～+45 天，各自可删除）；没有「每周固定」功能 */
    cfg.offs.forEach(function(o, i){
      if(!o.weekly){ h.offs.push(Object.assign({id:'off'+hid+i, note:'', by:o.who}, o)); return; }
      for(var d1 = -45; d1 <= 45; d1++){ var ds1 = D(d1); if(new Date(ds1+'T00:00:00').getDay()===o.dow) h.offs.push({id:'off'+hid+i+'_'+ds1, who:o.who, kind:o.kind, part:o.part, date:ds1, note:'', by:o.who}); }
    });
    h.directorSchedule = {}; h.openDates = {};
    h.directors.filter(function(d){ return d.active; }).map(function(d){ return d.name; }).forEach(function(n, k){
      var arr = (h.directorSchedule[n] = []), open = [], pat = cfg.open[n] || [];
      for(var d = -45; d <= 45; d++){
        var ds = D(d), dow = new Date(ds+'T00:00:00').getDay();
        if(hospitalClosedOn(hid, ds)) continue;
        var offs = h.offs.filter(function(o){ return o.kind==='director' && o.who===n && offApplies(o, ds); }), offAll = offs.some(function(o){ return o.part==='全天'; });
        if(pat.indexOf(dow) > -1 && d >= -30 && !offAll) open.push(ds); /* 不同院长不同的开放施术日期 */
        if(d < -30 || d > 30 || offAll) continue; /* 前后各一个月的工作日 */
        if(pick(d*7 + k*31 + hi*101 + 3) < 0.15) continue; /* 约 15% 的工作日空着 */
        var cnt = 1 + Math.floor(pick(d*5 + k*17 + 9)*3), used = {}, cf = hospitalClosedFrom(hid, ds);
        for(var i = 0; i < cnt; i++){
          var ti = Math.floor(pick(d*11 + k*13 + i*7 + hi)*T.length); if(used[ti]) continue; used[ti] = 1;
          var tpl = T[ti]; if(cf && tpl[1] > cf) continue; /* 周六 16:00 起休诊：不排进休诊时段 */
          if(offs.some(function(o){ var hh = krHalfRange(hid, o.part==='上午' ? '上午' : '下午'); return tpl[0] < hh[1] && tpl[1] > hh[0]; })) continue; /* 半天 OFF 的时段不排（范围跟着医院营业时间 / 午休算） */
          arr.push({date:ds, time:tpl[0], end:tpl[1], type:'不可预约'});
        }
      }
      h.openDates[n] = open;
    });
    h.directors.filter(function(d){ return !d.active; }).forEach(function(d){ h.openDates[d.name] = []; });
  });
}
/* 演示案件的施术日期：顺延到「该院长开放的、不在医院休诊 / 院长 OFF 里」的日子 */
function seedSurgeryDate(hid, director, date, time){
  var d = date;
  for(var i = 0; i < 60; i++){
    if(!krSurgerySlotError(hid, director, d, time, 60, null, {ignoreBusy:true}) && hospitalOpenOn(hid, director, d)) return d; /* 不可预约块以施术为准会被删掉，所以这里只避开休诊 / OFF / 别的施术 */
    var x = new Date(d+'T00:00:00'); x.setDate(x.getDate()+1); d = dateStr(x);
  }
  return date;
}
/* 预约 / 占位不能落在休诊时段（诊所定期休诊）：种子里落在休诊日 / 休诊时段的到店预约，顺延到下一个营业日 */
/* 选了面诊的演示案件：面诊费按当时的设定记进案件（财务栏和面诊费卡读案件里的金额，不读诊所设定） */
function seedSnapshotConsultFee(){ CASE_ITEMS.forEach(function(c){ if(c.consultRequested && c.consultStatus && !c.reuseReport) recordConsultFee(c); }); }
function seedFixVisits(){
  var bad = function(ds, tm){ var dt = new Date(ds+'T00:00:00'); if(isRescheduleDateDisabled(dt)) return true; var cf = closedFromOf(CLINIC_SETTINGS.closedRules, dt.getDay()); return !!cf && timeToMin(tm||'10:00') >= timeToMin(cf); };
  var next = function(ds){ var x = new Date(ds+'T00:00:00'); x.setDate(x.getDate()+1); return dateStr(x); };
  /* 营业时间修正（CMD-1008-05）：早于可预约最早时段 → 挪到最早；落在午休 → 挪到午休结束；晚于最晚时段 → 挪到最晚 */
  var fixTime = function(tm){
    if(!tm) return tm; var m = timeToMin(tm), s0 = CLINIC_SETTINGS;
    if(m < timeToMin(s0.bookFrom)) return s0.bookFrom;
    if(m >= timeToMin(s0.lunchFrom) && m < timeToMin(s0.lunchTo)) return s0.lunchTo;
    if(m > timeToMin(s0.bookTo)) return s0.bookTo;
    return tm;
  };
  CASE_ITEMS.forEach(function(c){ if(c.visitDate){ var g = 0; while(bad(c.visitDate, c.visitTime) && g++ < 7) c.visitDate = next(c.visitDate); c.visitTime = fixTime(c.visitTime); } });
  (RESERVATION_PLACEHOLDERS||[]).forEach(function(p){ var g = 0; while(bad(p.date, p.time) && g++ < 7) p.date = next(p.date); p.time = fixTime(p.time); });
  (RESUMED_VISITS||[]).forEach(function(r){ var g = 0; while(bad(r.date, r.time) && g++ < 7) r.date = next(r.date); r.time = fixTime(r.time); });
  /* 待访问的演示预约一律排在「现在」之后（重置演示数据时自动产生）：已经过了、或快到「未到店判定」时间的，按今天往后排到下一个可预约时段（每个间隔 1 小时、跳过午休 / 休诊 / 非营业时段），
     避免一打开页面就被自动判定成未到店（CMD-1012-01 之后未到店是真实自动判定的） */
  var now0 = demoNow(), limit = now0.getTime() + noShowMs() + 10*60000, cursor = new Date(now0.getTime() + noShowMs() + 30*60000);
  var s1 = CLINIC_SETTINGS, step = 30, nextSlot = function(){
    for(var guard = 0; guard < 400; guard++){
      var ds = dateStr(cursor), tm = pad2(cursor.getHours())+':'+pad2(cursor.getMinutes()), m = timeToMin(tm);
      var ok = m >= timeToMin(s1.bookFrom) && m <= timeToMin(s1.bookTo) && !(m >= timeToMin(s1.lunchFrom) && m < timeToMin(s1.lunchTo)) && !bad(ds, tm);
      if(ok){ var out = {date:ds, time:tm}; cursor = new Date(cursor.getTime() + 60*60000); return out; }
      cursor = new Date(cursor.getTime() + step*60000);
    }
    return null;
  };
  CASE_ITEMS.forEach(function(c){
    if(c.stage!=='booked' || c.subState!=='waiting' || !c.visitDate || !c.visitTime) return;
    var when = new Date(c.visitDate+'T'+c.visitTime+':00').getTime();
    if(isNaN(when) || when >= limit) return;
    var sl = nextSlot(); if(sl){ c.visitDate = sl.date; c.visitTime = sl.time; }
  });
}
function normalizeSeeds(){
  /* 分类：赴韩的标准部位归全局，本地的留在诊所里（C1 种子） */
  var inCats = {};
  Object.keys(PROJECT_CATEGORIES).forEach(function(k){ var c = PROJECT_CATEGORIES[k]; if(c.origin==='KR') KR_CATEGORIES[k] = c; else inCats[k] = c; });
  seedHospitalH2();
  [['budi','H2 院长1'], ['dinda','H2 院长2'], ['wulan','H2 院长1'], ['lina','H2 院长1']].forEach(function(r){ moveSeedCaseToH2(r[0], r[1]); });
  recomputeSeedKrBatches();
  stashC3Seeds();
  /* 对话：原来的 Main 全员群 = C1×H1；再加 C1×H2；同事名单按对接医院重建 */
  (function(){
    var m = ROOMS.filter(function(r){ return r.id==='main'; })[0];
    if(m){ m.id = 'main-H1'; m.hospitalId = 'H1'; m.name = 'Main · '+hospitalName('H1','ko'); }
    if(CHAT_DATA.hasOwnProperty('main')){ CHAT_DATA['main-H1'] = CHAT_DATA.main; delete CHAT_DATA.main; }
    if(ROOM_UNREAD.hasOwnProperty('main')){ ROOM_UNREAD['main-H1'] = ROOM_UNREAD.main; delete ROOM_UNREAD.main; }
    STAFF_ROSTER.length = 0; Array.prototype.push.apply(STAFF_ROSTER, [
      {id:'kr-lee', name:'KM1 室长 · 韩国室长'}, {id:'kr-park', name:'KC1 室长 · 韩国室长'}, {id:'director-kim', name:'KD1 院长 · 院长'},
      {id:'rina', name:'A2 室长 · 印尼室长'}]);
  })();
  CLIENTS.forEach(function(c){ if(!c.clinicId) c.clinicId = 'C1'; });
  CASE_ITEMS.forEach(function(c){ if(!c.clinicId) c.clinicId = 'C1'; if(c.director && !c.hospitalId) c.hospitalId = 'H1'; });
  var inP = [], inC = [];
  PROJECT_LIBRARY.forEach(function(p){ if(p.origin==='KR'){ var h = HOSPITAL_DATA[p.hospitalId||'H1']; (h.projects = h.projects || []).push(p); } else { if(!p.clinicId) p.clinicId = 'C1'; inP.push(p); } });
  LIB_CASES.forEach(function(c){ if(c.source==='travel'){ var h = HOSPITAL_DATA[c.hospitalId||'H1']; (h.libCases = h.libCases || []).push(c); } else { if(!c.clinicId) c.clinicId = 'C1'; inC.push(c); } });
  buildClinicViews(inP, inC, inCats);
  /* C1 的已确认施术案件（KR 日程的施术块由它们生成；今天的 客人9、过去的 A2 室长 在上面的种子里） */
  seedSurgeryCase({id:'sinta', name:'客人23', phone:'+62 812-3100-0001', director:'KO1 代表院长', hospitalId:'H1', krCoordinator:'KC1 室长', date:D(4), time:'14:00', items:[['切开双眼皮', 1800000]]});
  seedSurgeryCase({id:'lukman', name:'客人24', phone:'+62 812-3100-0002', director:'KD1 院长', hospitalId:'H1', date:D(9), time:'11:00', items:[['假体隆鼻', 2500000], ['自体脂肪移植（全脸）', 4500000]]});
  seedSurgeryCase({id:'dewis', name:'客人25', phone:'+62 812-3100-0003', director:'KO1 代表院长', hospitalId:'H1', date:D(15), time:'14:00', items:[['埋线双眼皮', 1000000]]});
}
/* 其他诊所的全新分区（C2）：空白 + 少量演示资料（见"五、演示数据"）；种子函数写的是全局变量，所以临时把全局变量切成这份新分区 */
function emptyClinicVars(cid){
  var cl = clinicById(cid), main = JSON.parse(JSON.stringify(ROOMS.filter(function(r){ return r.isMain; })[0] || {id:'main', name:'Main · 全员', isMain:true, color:'var(--slate2)', init:'G', date:'今天'}));
  return {
    CLINIC_SETTINGS: defaultClinicSettings(cid==='C3' ? {name:cl.name, address:'Jl. Sunset Road No. 88, Kuta, Bali', phone:'+62 361 555 0123', city:'巴厘'} : {name:cl.name, address:'Jl. Basuki Rahmat No. 21, Surabaya', phone:'+62 31 5550 7788', city:'泗水'}),
    PURCHASE_REQ:null, ACCOUNT_SEQ:2, RESUMED_VISITS:[], PLACEHOLDER_HISTORY:[], PLACEHOLDER_SEQ:1, RESERVATION_PLACEHOLDERS:[],
    CLIENTS:[], CLIENT_HOLDINGS:{}, CASE_ITEMS:[], NOTIF_SEQ:0, NOTIFS:[], ROOMS:linkedHospitalIds(cid).map(function(h){ var m = JSON.parse(JSON.stringify(main)); m.id = mainRoomId(h); m.hospitalId = h; m.name = 'Main · '+hospitalName(h,'ko'); return m; }), STAFF_ROSTER:buildStaffRoster(cid), ROOM_UNREAD:{}, CHAT_DATA:linkedHospitalIds(cid).reduce(function(o, h){ o[mainRoomId(h)] = []; return o; }, {}), MUTED_ROOMS:{}, ROOM_FILE_SEQ:1,
    CAL_MEMOS:[], SMS_LOG:[], SMS_SEQ:1, LIB_PROBLEM_SEQ:LIB_PROBLEM_SEQ, LIB_PROBLEMS:JSON.parse(JSON.stringify(LIB_PROBLEMS)), LIB_PROBLEM_IDS:JSON.parse(JSON.stringify(LIB_PROBLEM_IDS)),
    PROJECT_CATEGORIES:Object.keys(PROJECT_CATEGORIES).filter(function(k){ return PROJECT_CATEGORIES[k].origin==='IN'; }).reduce(function(o,k){ o[k] = JSON.parse(JSON.stringify(PROJECT_CATEGORIES[k])); return o; }, {}), /* 新诊所的本地分类：先复制一份标准的，之后各自管理 */
    PROJECT_LIBRARY:[], LIB_CASES:[], PROMOS:[], PACKAGES:[]
  };
}
/* 其他诊所的演示资料（C2：泗水合作诊所，只对接 H1）：几个客户和案件 + 自己的本地项目和一个印尼案例，用来验证诊所之间完全隔开 */
/* 本诊所没有本地项目库就按清单补一份（旧存档里的 C3 就是空的；启动时执行，幂等） */
function backfillLocalLib(){
  if(PROJECT_LIBRARY.some(function(p){ return p.origin==='IN'; })) return false;
  buildLocalProjects('IN').forEach(function(p){ p.names = {zh:p.name, ko:p.name, id:p.name}; PROJECT_LIBRARY.push(p); });
  return true;
}
function seedClinicDemo(cid){
  if(cid === 'C2'){ /* C2 的已确认施术案件（H1 的日程里会有 C2 客人的施术块；C1 的医院日程视角看到的是灰块 + 院长名字） */
    var h2a = seedSurgeryCase({id:'hendra', name:'客人26', phone:'+62 811-2100-0001', director:'KD1 院长', hospitalId:'H1', date:D(5), time:'11:00', items:[['假体隆鼻', 2500000]]});
    var h2b = seedSurgeryCase({id:'citral', name:'客人27', phone:'+62 811-2100-0002', director:'KD1 院长', hospitalId:'H1', date:D(11), time:'15:00', items:[['切开双眼皮', 1800000]]});
    syncSurgeryBlock(h2a); syncSurgeryBlock(h2b);
  }
  if(cid === 'C3'){ /* 巴厘诊所：原 C1 里对接 H2 的案件整体迁入 */
    var st = C3_STASH; if(!st) return;
    st.cases.forEach(function(c){ CASE_ITEMS.push(JSON.parse(JSON.stringify(c))); });
    st.clients.forEach(function(x){ CLIENTS.push(JSON.parse(JSON.stringify(x))); });
    Object.keys(st.holdings).forEach(function(n){ CLIENT_HOLDINGS[n] = JSON.parse(JSON.stringify(st.holdings[n])); });
    Object.keys(st.chat).forEach(function(k){ CHAT_DATA[k] = JSON.parse(JSON.stringify(st.chat[k])); });
    st.notifs.forEach(function(n){ NOTIFS.push(JSON.parse(JSON.stringify(n))); });
    var dn = CASE_ITEMS.filter(function(x){ return x.id==='dinda'; })[0]; if(dn && dn.krSchedule){ dn.krSchedule.status = 'confirmed'; var dd0 = seedSurgeryDate('H2', dn.director, D(18), '11:30'); dn.krSchedule.primary = dd0; dn.krSchedule.confirmedDate = dd0; dn.krSchedule.confirmedTime = '11:30'; /* 避开休诊 / 未开放 */ updateCaseStage(dn); } /* 客人10：KR 已确认施术时间 */
    var rs = seedSurgeryCase({id:'ratna', name:'客人28', phone:'+62 812-3300-0001', director:'H2 院长1', hospitalId:'H2', krCoordinator:'KM2 室长', date:D(6), time:'11:00', items:[['面部拉皮', 12000000]]});
    var fi = seedSurgeryCase({id:'fitri', name:'客人29', phone:'+62 812-3300-0002', director:'H2 院长2', hospitalId:'H2', krCoordinator:'KC2 室长', date:D(11), time:'14:00', items:[['自体脂肪移植（全脸）', 4500000]]});
    CASE_ITEMS.forEach(function(x){ if(x.krSchedule && x.krSchedule.confirmedDate && ['confirmed','arrived','change_pending'].indexOf(x.krSchedule.status)>-1 && x.director) syncSurgeryBlock(x); }); /* C3 全部已确认施术的案件在 H2 日程里生成施术块 */
    CHAT_DATA[mainRoomId('H2')] = [
      {day:KD(0), from:'them', name:'H2 院长1', color:'var(--slate2)', init:'박', orig:'이번 주 수술 일정이 거의 찼습니다.', trans:'本周手术排期基本满了。', time:'10:00'},
      {day:KD(0), from:'them', name:'KM2 室长', color:'var(--sage)', init:'정', orig:'IN 쪽 신규 케이스 확인했습니다.', trans:'已确认 IN 这边的新案件。', time:'10:30'}
    ];
    backfillLocalLib(); /* 巴厘诊所也要有自己的本地项目库（CMD-1013-15：原来这行写在 return 之后，C3 一直是空的） */
    return;
  }
  if(cid !== 'C2') return;
  var cons = function(d){ return {version:'v1.0', ts:D(-d)+' 10:00', source:'客户自助预约'}; };
  var mkClient = function(name, phone, g, dob, d){ var cl = addClient({name:name, phone:phone, gender:g, dob:dob, createdBy:'客人自助', source:'客户自助预约建档', consent:cons(d)}); return cl; };
  mkClient('客人17', '+62 811-2000-0001', '女', '1991-07-14', 5);
  mkClient('客人18', '+62 811-2000-0002', '男', '1988-02-03', 4);
  mkClient('客人19', '+62 811-2000-0003', '女', '1995-11-22', 8);
  var c1 = createReservationCase('客人17', null, D(1), '10:30', '+62 811-2000-0001', '面诊商谈');
  var c2 = createReservationCase('客人18', null, D(0), '10:00', '+62 811-2000-0002', '面诊商谈'); c2.subState = 'arrived'; c2.needsConsult = true; c2.hospitalId = 'H1'; c2.director = 'KD1 院长'; c2.materialsConfirmed = true; c2.concern = '眼睛想变大一点'; c2.expectation = '自然的双眼皮'; c2.consultRequested = true; c2.consultStatus = 'paid_waiting_kr'; /* 已缴面诊费 → KR 端看得到（KR 端系列 2/5 演示） */ updateCaseStage(c2);
  var c3 = createReservationCase('客人19', null, D(-2), '14:00', '+62 811-2000-0003', '皮肤商谈'); c3.subState = 'cancelled'; c3.cancelReason = '预约取消'; updateCaseStage(c3);
  buildLocalProjects('IN').forEach(function(p){ p.names = {zh:p.name, ko:p.name, id:p.name}; PROJECT_LIBRARY.push(p); }); /* 每家诊所一份清单（价格之后可自行改） */
  var lp = PROJECT_LIBRARY.filter(function(x){ return x.origin==='IN' && x.name==='婴儿针'; })[0], lid = newLibCaseId();
  LIB_CASES.push({id:lid, clinicId:'C2', title:'水光注射 · 肤质改善（泗水）', names:{zh:'水光注射 · 肤质改善（泗水）', ko:demoTranslate('水光注射 · 肤质改善（泗水）','zh','ko'), id:demoTranslate('水光注射 · 肤质改善（泗水）','zh','id')}, source:'local',
    projectIds:[lp.id], director:null, problemIds:[], beforePhotos:[{url:'', color:'#E6DDD0'}], afterPhotos:[{url:'', color:'#D9CFC1', recovery:'1个月', recoveryCustom:''}],
    consent:{signed:true, file:'consent-'+lid+'.pdf'}, uploader:'B1 室长', uploadedAt:D(-6)+' 10:00', editedBy:null, editedAt:null});
}
/* 种子里写死的系统时间点（Timeline dt、通知 ts、创建/激活时间…）原来是"诊所当地时间"，现在系统事件时间点存 UTC：种子生成完后一次性换算成 UTC，Timeline 等在雅加达显示就不会多 7 小时（2026-10-08，CMD-1007-04） */
function seedSurgerySubs(){ CASE_ITEMS.forEach(function(c){ if(c.settlementDone && c.subItems && c.subItems.length) syncSurgerySub(c); }); } /* 已有在韩 timeline 的演示案件：补上自动产生的「施术」一行 */
/* 演示：等待报告的案件补上面诊时间和院长日程里的面诊块（面诊时间 = 预计出报告时间 − 30 分钟；排不进去的跳过）——CMD-1008-12 C1 */
function seedConsultBlocks(){
  CASE_ITEMS.forEach(function(c){
    if(c.consultStatus!=='awaiting_report' || !c.director || !c.reportEta || c.consultAt) return;
    var hid = caseKrHospital(c), hr = hospitalHours(hid), e = fmtUtc(c.reportEta, KR_TZ).split(' '), m = timeToMin(e[1]) - 30;
    if(m < timeToMin(hr.open)) m = timeToMin(hr.open);
    if(m > timeToMin(hr.close)-30) m = timeToMin(hr.close)-30;
    var time = minToTime(m);
    if(krSurgerySlotError(hid, c.director, e[0], time, 30, c.clinicId+':'+c.id, {exceptKind:'面诊'})) return;
    c.consultAt = {date:e[0], time:time}; syncConsultBlock(c);
  });
}
function seedTimesToUtc(root, tz){
  var seen = [], SEED_TIME_KEYS = {dt:1, ts:1, time:1, at:1, addedAt:1, uploadedAt:1, editedAt:1, doneAt:1, informedAt:1, updatedAt:1, createdAt:1, activatedAt:1, reportEta:1}; /* 变量放函数里：这个函数在文件前面就会被调用 */
  (function walk(o){
    if(!o || typeof o!=='object' || seen.indexOf(o)>-1) return; seen.push(o);
    if(Array.isArray(o)){ o.forEach(walk); return; }
    Object.keys(o).forEach(function(k){
      var v = o[k];
      if(SEED_TIME_KEYS[k] && typeof v==='string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(v)) o[k] = localToUtc(v.slice(0,10), v.slice(11), tz);
      else if(v && typeof v==='object') walk(v);
    });
  })(root);
}
function buildClinicSeed(cid){
  var vars = emptyClinicVars(cid), saved = {}, keepClinic = CURRENT_CLINIC_ID, keepSeeding = SEEDING, keepActor = SEED_ACTOR, keepIn = IN_COORDINATORS.slice();
  CLINIC_VAR_NAMES.forEach(function(n){ saved[n] = window[n]; window[n] = vars[n]; });
  CURRENT_CLINIC_ID = cid; SEEDING = true; SEED_ACTOR = (clinicAccounts(cid).filter(function(a){ return a.role==='manager' && a.name; })[0] || {name:'A1 室长'}).name;
  var out = {};
  try{ syncInCoordinators(); seedClinicDemo(cid); seedFixVisits(); seedSnapshotConsultFee(); seedResolveOverlaps(); seedTimesToUtc([CASE_ITEMS, CLIENTS, NOTIFS, SMS_LOG, CHAT_DATA], clinicTzOf(CLINIC_SETTINGS)); seedConsultBlocks(); seedSurgerySubs(); }catch(e){ console.error('[种子] '+cid, e); }
  CLINIC_VAR_NAMES.forEach(function(n){ out[n] = window[n]; });
  CLINIC_VAR_NAMES.forEach(function(n){ window[n] = saved[n]; });
  CURRENT_CLINIC_ID = keepClinic; SEEDING = keepSeeding; SEED_ACTOR = keepActor;
  IN_COORDINATORS.length = 0; Array.prototype.push.apply(IN_COORDINATORS, keepIn);
  return out;
}


/* KR 的本地管理项目库（CMD-1012-04）：每家医院一份清单（韩元），KR 项目库页面「本地管理项目」组；缺的补上 */
function krLocalLib(hid){ var h = HOSPITAL_DATA[hid]; if(!h) return []; if(!h.localLib){ h.localLib = buildLocalProjects('KR', hid); gmcStamp(h.localLib); } return h.localLib; }
Object.keys(HOSPITAL_DATA).forEach(function(h){ krLocalLib(h); });

/* 演示案件标记（CMD-1012-06 补）：种子里建立的案件都带 demo:true；用户自己新建的案件（id 为 r+时间戳）没有这个标记，测试覆盖页只计算后者。
   旧存档里没有标记的演示案件，按 id 补上（用户新建的案件 id 一律是 r 加 9 位以上数字）。 */
function markDemoCases(){ try{ (CASE_ITEMS||[]).forEach(function(c){ if(c.demo===undefined) c.demo = !/^r\d{9,}/.test(String(c.id)); }); }catch(e){} }
(CASE_ITEMS||[]).forEach(function(c){ c.demo = true; }); /* 种子刚建立的案件：全部明确标记为演示（含种子里用 createReservationCase 生成的预约案件）；存档读入后用户新建的案件没有这个标记 */
