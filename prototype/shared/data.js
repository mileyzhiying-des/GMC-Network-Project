/* shared/data.js —— 数据层：案件/客户/预约占位/对话/通知/项目库/案例库等全部演示数据 + 读写函数 + 种子数据
   由 gmc-network-prototype.html 拆分而来（2026-10-05 结构拆分）。classic script，全局函数/变量，不使用 ES module。 */
/* ---- 演示数据版本号：版本不符时，localStorage 里所有 gmc_ 开头的数据自动清空并重新生成演示数据（2026-10-05·一，由 3 升到 4；二加入账号数据升到 5；三加购管理者 A5、字段改名，升到 6） ---- */
var DEMO_DATA_VERSION = 6;
(function(){
  try{
    /* 版本不符，或"演示数据生成的那天"不是今天（演示日期都是相对生成当天算的）→ 清空重新生成 */
    var todayKey = dateStr(new Date());
    if(localStorage.getItem('gmc_demo_ver') !== String(DEMO_DATA_VERSION) || localStorage.getItem('gmc_demo_day') !== todayKey){
      Object.keys(localStorage).filter(function(k){ return k.indexOf('gmc_')===0; }).forEach(function(k){ localStorage.removeItem(k); });
      localStorage.setItem('gmc_demo_ver', String(DEMO_DATA_VERSION));
      localStorage.setItem('gmc_demo_day', todayKey);
    }
  }catch(e){}
})();



/* ================= dashboard: calendar (month / week / day) ================= */
var DOW_CN = ['一','二','三','四','五','六','日'];

var TODAY_DATE = (function(){ var d = new Date(); d.setHours(0,0,0,0); return d; })(); /* 真实今天（2026-10-06 起） */

/* 日历事件类型（2026-10-02·六）：预约来访 / 预约占位 / 赴韩施术；删除"视频沟通""术后管理""其他" */
var TYPE_COLOR = {reservation:'var(--navy)', placeholder:'var(--slate)', travel:'var(--terracotta)'};

var TYPE_BG = {reservation:'#E4E8ED', placeholder:'#F4F6F8', travel:'var(--terracotta-bg)'};

var TYPE_LABEL = {reservation:'预约来访', placeholder:'预约占位', travel:'赴韩施术'};

/* 日历行（诊所营业时间生成，见 applyClinicSettings）；KR 医院日程是韩国那边的时间，用固定的 KR_WK_HOURS */
var WK_HOURS = [];
var KR_WK_HOURS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];

/* 诊所时区（设定，默认 WIB，可切换 WITA / WIT）；KR 固定 UTC+9。时差由设定算出，不写死 */
var TZ_OPTIONS = {WIB:{off:7, city:'雅加达', temp:31}, WITA:{off:8, city:'登巴萨（巴厘岛）', temp:30}, WIT:{off:9, city:'查亚普拉', temp:29}};

var KR_TZ_OFF = 9;

/* ================= 诊所设定（2026-10-06·A5，Notion Accounts & Settings 第 5 节；老板/管理者在"诊所设定"页改） =================
   所有"诊所可调"的值都放这里，日历、预约占位、未到店判定、面诊费卡、短信、客户自助预约页都读它；不再写死。
   时区 tz 原来是 CLINIC_TZ + localStorage('gmc_tz')，现在搬到这里，CLINIC_TZ 只是它的镜像（applyClinicSettings 同步）。
   赴韩定金比例不在这里（GMC 统一设定）。 */
var SLOT_MIN = 30; /* 时段长度（分钟），固定 30（我的判断：设定里不提供修改） */
var CLINIC_SETTINGS = {
  name:'GMC 合作诊所（雅加达）', address:'Jl. Jenderal Sudirman Kav. 52, Jakarta Selatan', phone:'+62 21 5550 1234', city:'雅加达', tz:'WIB',
  openTime:'09:00', closeTime:'17:00',   /* 营业时间（日历显示的行） */
  bookFrom:'09:00', bookTo:'16:30',      /* 可预约时段：第一个 / 最后一个可约的开始时间 */
  lunchFrom:'14:00', lunchTo:'15:00',    /* 午休：不可预约 */
  closedDow:[4],                         /* 休诊日（0=周日…6=周六），默认周四 */
  holdMinutes:15, noShowMinutes:30,      /* 预约占位倒计时 / 未到店判定 */
  consultFee:300000,                     /* 面诊费（印尼盾） */
  slotCapacity:2,                        /* 每个时段的预约上限（客户自助预约用） */
  remindBeforeHours:24,                  /* 提醒短信：预约开始前几小时发送 */
  sms:{
    link:'您好，这里是GMC Network，麻烦点击链接填写基础信息，完成后即视为预约成功：',
    confirm:'【{clinic}】{name}，您已预约 {time}。地址：{address}，电话：{phone}。查看/取消预约：{url}',
    remind:'【{clinic}】{name}，提醒您 {time} 的预约。地址：{address}。查看/取消预约：{url}',
    cancel:'【{clinic}】{name}，您 {time} 的预约已取消。如需重新预约：{url}'
  },
  privacyVersion:'v1.0',
  privacyPolicy:'本诊所仅为办理预约、接待和医美咨询收集您的个人资料与健康资料，并按《隐私/数据跨境使用授权同意书》约定处理；您可随时要求查看、更正或删除。',
  updatedAt:'', updatedBy:''
};
var CLINIC_TZ = CLINIC_SETTINGS.tz;
var KR_HOSPITAL_NAME = '首尔 GMC 合作医院（演示）'; /* 合作医院（只读，来源：KR 端维护） */

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
  if(!TZ_OPTIONS[s.tz]) s.tz = 'WIB';
  CLINIC_TZ = s.tz;
  WK_HOURS = slotsBetween(s.openTime, s.closeTime);
  RESCHED_AM = slotsBetween(s.bookFrom, s.lunchFrom).filter(slotBookable);
  RESCHED_PM = slotsBetween(s.lunchTo, minToTime(timeToMin(s.bookTo)+SLOT_MIN)).filter(slotBookable);
  DEFAULT_SMS_TEMPLATE = s.sms.link;
  if(typeof applyTzSetting === 'function') applyTzSetting();
}

function krTimeOf(hr){ /* 诊所时间 hr('HH:mm') → KR 时间 */
  var diff = KR_TZ_OFF - TZ_OPTIONS[CLINIC_TZ].off;
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
   history：这个账号编号上的变更历史（激活、重置密码、停用…）；操作人以"当时的姓名 + 编号"记录，之后账号换了新的人，旧记录仍显示"Rina（A2）"。 */
var ACCOUNT_ROLES = {owner:'老板（诊所管理账号）', manager:'室长（管理者）', general:'一般室长'};
var ACCOUNT_STATUS = {active:'使用中', pending:'待激活', disabled:'已停用'};
var BASIC_SEATS = 3;
var ACCOUNTS = [
  {id:'OWN', role:'owner',   seat:'basic', name:'Hartono', position:'老板',   phone:'+62 811-0000-0001', status:'active',   password:'own123', photo:'证件照', createdAt:D(-48)+' 09:00', activatedAt:D(-48)+' 09:30', history:[{ts:D(-48)+' 09:30', type:'激活', text:'账号激活，设置了登录密码', by:'Hartono（OWN）'}]},
  {id:'A1',  role:'manager', seat:'basic', name:'Dewi',    position:'室长',   phone:'+62 811-0000-0002', status:'active',   password:'a1123',  photo:'证件照', createdAt:D(-48)+' 09:10', activatedAt:D(-48)+' 10:00', history:[{ts:D(-48)+' 10:00', type:'激活', text:'账号激活，设置了登录密码', by:'Dewi（A1）'}]},
  {id:'A2',  role:'general', seat:'basic', name:'Rina',    position:'前台室长', phone:'+62 811-0000-0003', status:'active',   password:'a2123',  photo:'证件照', createdAt:D(-48)+' 09:20', activatedAt:D(-47)+' 09:00', history:[{ts:D(-47)+' 09:00', type:'激活', text:'账号激活，设置了登录密码', by:'Rina（A2）'}]},
  {id:'A3',  role:'general', seat:'addon', name:'',        position:'',       phone:'+62 811-0000-0004', status:'pending',  password:null,     photo:'',           createdAt:D(-2)+' 14:00', activatedAt:'',                 history:[{ts:D(-2)+' 14:00', type:'购买', text:'加购账号 A3（一般室长），待激活，激活手机 +62 811-0000-0004', by:'Dewi（A1）'}]},
  {id:'A4',  role:'general', seat:'addon', name:'Sari',    position:'助理室长', phone:'+62 811-0000-0005', status:'disabled', password:'a4123',  photo:'证件照', createdAt:D(-29)+' 11:00', activatedAt:D(-28)+' 09:00', disabledAt:D(-8)+' 17:00', history:[{ts:D(-28)+' 09:00', type:'激活', text:'账号激活，设置了登录密码', by:'Sari（A4）'},{ts:D(-8)+' 17:00', type:'取消加购', text:'取消加购账号 A4，已停用（历史记录保留）', by:'Dewi（A1）'}]},
  {id:'A5',  role:'manager', seat:'addon', name:'Putri',   position:'副室长', phone:'+62 811-0000-0006', status:'active',   password:'a5123',  photo:'证件照', createdAt:D(-1)+' 10:00', activatedAt:D(-1)+' 11:00', history:[{ts:D(-1)+' 10:00', type:'购买', text:'加购管理者账号 A5（老板收验证码确认）', by:'Dewi（A1）'},{ts:D(-1)+' 11:00', type:'激活', text:'账号激活，设置了登录密码', by:'Putri（A5）'}]}
];
var PURCHASE_REQ = null; /* 管理者加购"管理者账号"时发给老板的验证码：{code, by, qty, exp(毫秒时间戳), used}；演示：老板登录后在页面顶部看到 */
var ACCOUNT_SEQ = 5; /* 下一个加购账号编号 = 'A'+(ACCOUNT_SEQ+1) */
/* 操作日志（owner/管理者在"操作日志"页看；第八部分做页面）：时间、操作账号 + 当时的姓名、内容、类型 */
var ACCOUNT_LOG = [
  {id:'log1', ts:D(-2)+' 14:00', accountId:'A1', name:'Dewi', type:'账号管理', sub:'购买', target:'A3', text:'购买加购账号 A3（一般室长）'},
  {id:'log2', ts:D(-8)+' 17:00', accountId:'A1', name:'Dewi', type:'账号管理', sub:'退订', target:'A4', text:'退订加购账号 A4（Sari）'},
  {id:'log3', ts:D(-1)+' 10:00', accountId:'A1', name:'Dewi', type:'账号管理', sub:'购买', target:'A5', text:'购买加购管理者账号 A5（老板验证码确认）'}
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
/* 演示数据种子（SEEDING=true，data.js 末尾置 false）里的"当前操作人"固定写 Dewi，不随打开页面的账号变化；运行时 = 当前登录的人 */
var SEEDING = true;
function actingName(){ return SEEDING ? 'Dewi' : ME_NAME; }
/* IN 室长名单 = 使用中的非老板账号的姓名（账号被停用/重置/激活后重新计算） */
function syncInCoordinators(){
  var names = ACCOUNTS.filter(function(a){ return a.role!=='owner' && a.status==='active' && a.name; }).map(function(a){ return a.name; });
  IN_COORDINATORS.length = 0; Array.prototype.push.apply(IN_COORDINATORS, names);
}
/* 写操作日志：当前账号 + 当时的姓名 */
function logOp(type, text, sub, target){ /* type：账号管理 / 设定变更 / 其他；sub：购买 / 退订 / 重设 / 激活；target：被操作的账号编号（账号详情里看"该账号的 log"） */
  var a = currentAccount() || {id:'?', name:''};
  ACCOUNT_LOG.unshift({id:'log'+Date.now()+Math.floor(Math.random()*1000), ts:nowFullDt(), accountId:a.id, name:a.name, type:type, sub:sub||'', target:target||'', text:text});
}

function memosOn(date){ return CAL_MEMOS.filter(function(m){ return m.date===date && (m.scope==='公开' || m.author===ME_NAME); }); }

function memoCellHtml(ds){
  return memosOn(ds).map(function(m){
    return m.type==='OFF'
      ? '<div style="color:#C1454A;font-weight:700;">OFF · '+m.person+'</div>'
      : '<div style="color:var(--slate2);">📝 '+m.text+' <span style="color:var(--muted);">'+m.author+(m.scope==='私人'?' · 私人':'')+'</span></div>';
  }).join('');
}

function memoSet(k, v){
  if(k==='text'){ MEMO_DRAFT.text = v; return; }
  MEMO_DRAFT[k] = v;
  if(MEMO_DRAFT.type==='OFF') MEMO_DRAFT.scope = '公开'; /* 类型=OFF 时固定为公开 */
  renderMemoBody();
}

/* ---- KR 医院日程视角（只读，2026-10-02·八）：KR 室长登记的日程、院长日程（下拉切换院长）、KR 开放的施术日期；
   有空 = 白色，已排的事 = 浅灰块，每件事一个独立的块（中间留缝隙）。演示数据：两位院长，김민석 当天几乎满档 ---- */
var CAL_VIEW = 'in', KR_DIRECTOR = '김민석 원장';

var KR_COORD_SCHEDULE = [
  {date:D(-1), time:'10:00', title:'이서연：整理 Budi 报告'}, {date:D(0), time:'09:30', title:'이서연：与 IN 室长对接'},
  {date:D(0), time:'15:00', title:'박준혁：术后回访'}, {date:D(1), time:'11:00', title:'이서연：报告提交'}
];

var KR_DIRECTOR_SCHEDULE = (function(){
  var m = {'김민석 원장':[], '이수진 원장':[]};
  KR_WK_HOURS.forEach(function(h){ if(h!=='13:00' && h!=='16:00') m['김민석 원장'].push({date:D(0), time:h, title:h<'12:00'?'手术':'面诊/手术'}); }); /* 当天几乎满档 */
  m['김민석 원장'].push({date:D(-1), time:'10:00', title:'面诊'}, {date:D(-1), time:'14:00', title:'手术'}, {date:D(1), time:'09:00', title:'手术'});
  m['이수진 원장'].push({date:D(0), time:'11:00', title:'面诊'}, {date:D(-1), time:'15:00', title:'手术'}, {date:D(1), time:'10:30', title:'面诊'});
  return m;
})();

/* ---- 预约历史记录（2026-10-02·八）：全部从案件/占位数据算 ---- */
function resvHistoryRows(){
  var rows = [];
  CASE_ITEMS.forEach(function(c){ if(c.visitDate) rows.push({name:c.name, caseNo:c.caseNo, caseId:c.id, date:c.visitDate, time:c.visitTime, type:visitStateOf(c)}); });
  RESUMED_VISITS.forEach(function(r){ rows.push({name:r.name, caseNo:r.origCaseNo, caseId:r.caseId, date:r.date, time:r.time, type:'已到访'}); }); /* 接续：显示原案件 ID，类型已到访 */
  RESERVATION_PLACEHOLDERS.forEach(function(ph){ rows.push({name:ph.phone, caseNo:null, caseId:null, date:ph.date, time:ph.time, type:'预约占位'}); });
  PLACEHOLDER_HISTORY.forEach(function(ph){ rows.push({name:ph.phone, caseNo:null, caseId:null, date:ph.date, time:ph.time, type:'占位失效'}); });
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
      evs.push({kind:'travel', date:ks.confirmedDate, time:(ks.confirmedTime||'14:00'), name:c.name, caseId:c.id, ended:isEnded(c)});
  });
  RESUMED_VISITS.forEach(function(r){ evs.push({kind:'reservation', date:r.date, time:r.time, name:r.name, caseId:r.caseId, purpose:r.purpose, vstate:'已到访', ended:false}); });
  RESERVATION_PLACEHOLDERS.forEach(function(ph){ evs.push({kind:'placeholder', date:ph.date, time:ph.time, name:ph.phone, phId:ph.id, purpose:ph.purpose}); });
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
  return '<div class="event-chip" title="'+e.time+' '+TYPE_LABEL[e.kind]+' · '+e.name+(e.purpose?' · '+e.purpose:'')+'" style="'+grey+dashed+'border-color:'+TYPE_COLOR[e.kind]+';background:'+TYPE_BG[e.kind]+';" onclick="event.stopPropagation();'+onclick+'"><div class="l1">'+l1+'</div><div class="l2">'+l2+'</div></div>';
}

function calPrev(){ if(CAL_MODE==='week') WEEK_OFFSET--; else if(CAL_MODE==='day') DAY_OFFSET--; renderCalendar(); }

function calNext(){ if(CAL_MODE==='week') WEEK_OFFSET++; else if(CAL_MODE==='day') DAY_OFFSET++; renderCalendar(); }

function calToday(){ WEEK_OFFSET=0; DAY_OFFSET=0; CAL_WEEK_FULL=false; CAL_ANCHOR=null; renderCalendar(); }
 /* 回今天：今天在第一栏 */

/* ================= dashboard: 预约来访 + 预约占位（2026-09-29 新增，IN-DASH-01） ================= */
/* KR 院长名单（演示数据，以后由韩国端维护）：active=false 为停用，停用的不显示在选项里（2026-10-02） */
var DIRECTOR_INFO = [{name:'김민석 원장', active:true}, {name:'이수진 원장', active:true}, {name:'박지훈 원장', active:false}];

var DIRECTOR_LIST = DIRECTOR_INFO.filter(function(d){ return d.active; }).map(function(d){ return d.name; });

/* 老客人（下拉选客人+选院长）或"模拟客户填写完成"占位转正式：生成 Case ID（2026-10-01：取消 Reservation ID，预约时直接生成）、开新案件（状态"待访问"），
   不经过占位；这里只做"开新案件"的预约来访——术后到店/使用持有项目也一律走这条开新案件（第十轮已确认） */
function createReservationCase(name, director, date, time, phone, purpose){
  var caseNo = generateCaseNo();
  var id = 'r'+Date.now()+Math.floor(Math.random()*1000);
  var c = makeCase({id:id, name:name, director:null, updated:'刚刚', visitDate:date, visitTime:time, visitPurpose:purpose||'面诊商谈', /* 2026-10-02：预约不选院长，面诊案件在基础资料里选 */
    basic:{gender:'—', dob:'—', contact:phone||'—', history:'无'},
    logEntries:[{stage:'预约到店', actor:phone?'客人':actingName(), action:(phone?'官网/短信链接自助预约成功':'室长代替预约')+'，生成 Case ID '+caseNo, dt:nowFullDt()}]});
  c.caseNo = caseNo;
  CASE_ITEMS.unshift(c);
  updateCaseStage(c);
  if(!CLIENTS.some(function(x){ return x[0]===name; })) CLIENTS.unshift([name,'资料录入',actingName(),'刚刚','#E4E8ED','var(--slate2)']);
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
  {id:'ph0', date:D(0), time:'14:00', phone:'+62 812-5555-0101', link:'https://gmc.link/demo01', smsText:CLINIC_SETTINGS.sms.link, purpose:'面诊商谈', expiresAt:Date.now()+15*60000} /* 演示：占位中（种子固定 15 分钟） */
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

function guestSet(k, v){ GUEST_FORM[k] = v; if(k==='consent') renderGuestForm(); }

function submitGuestForm(){
  var g = GUEST_FORM; if(!g) return;
  var miss = [];
  if(!(g.name||'').trim()) miss.push('姓名');
  if(!(g.phone||'').trim()) miss.push('手机号');
  if(!g.consent) miss.push('同意勾选');
  if(miss.length){ g.err = '还差：'+miss.join('、'); renderGuestForm(); return; }
  if(g.phId) RESERVATION_PLACEHOLDERS = RESERVATION_PLACEHOLDERS.filter(function(x){ return x.id!==g.phId; }); /* 占位转正式预约 */
  var c = createReservationCase(g.name.trim(), null, g.date, g.time, g.phone.trim(), g.purpose);
  c.basic = {gender:g.gender, dob:g.dob||'—', contact:g.phone.trim(), history:(g.history||'').trim()||'无'};
  var row = CLIENTS.filter(function(x){ return x[0]===c.name; })[0]; if(row) row[2] = '客人自助'; /* 建档：客户自助预约 */
  closeGuestForm(); refreshView();
  pushNotif('预约', (g.phId ? '预约占位的客人填完资料：' : '客人自助预约提交：')+c.name+'（'+c.caseNo+'）'+dateLabel(g.date)+' '+g.time, {caseId:c.id, names:workingIN()});
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
/* CLIENTS 每行：[姓名, 无案件时的兜底状态文案, 建档室长, 更新时间, 兜底底色, 兜底字色]。
   有案件时"当前面诊·施术进度"这一列不用这里的兜底值，而是实时读对应 CASE_ITEMS 的徽章——
   见 clientCaseStatus()，这样客户管理列表和案件管理才不会各说各的、慢慢对不上。 */
var CLIENTS = [
  ['Siti Rahayu','资料录入','Dewi','2 小时前','#E4E8ED','var(--slate2)'],
  ['Andi Wijaya','资料录入','Rina','昨天','#E4E8ED','var(--slate2)'],
  ['Yuni Kartika','资料录入','Dewi','2 小时前','#E4E8ED','var(--slate2)'],
  ['Maya Putri','资料录入','Dewi','昨天','#E4E8ED','var(--slate2)'],
  ['Putri Wulandari','资料录入','Dewi','3 天前','#E4E8ED','var(--slate2)'],
  ['Dedi Prasetyo','资料录入','Rina','昨天','#E4E8ED','var(--slate2)'],
  ['Budi Santoso','资料录入','Rina','3 天前','#E4E8ED','var(--slate2)'],
  ['Ayu Lestari','资料录入','Dewi','昨天','#E4E8ED','var(--slate2)'],
  ['Fajar Nugroho','资料录入','Rina','2 小时前','#E4E8ED','var(--slate2)'],
  ['Dinda Anggraini','资料录入','Dewi','刚刚','#E4E8ED','var(--slate2)'],
  ['Nadia Permata','资料录入','Dewi','今天','#E4E8ED','var(--slate2)'],
  ['Rizky Hidayat','资料录入','Rina','今天','#E4E8ED','var(--slate2)'],
  ['Rina Marlina','资料录入','Dewi','1 周前','#E4E8ED','var(--slate2)'],
  ['Wulan Sari','资料录入','Dewi','5 天前','#E4E8ED','var(--slate2)'],
  ['Agus Salim','资料录入','Rina','4 天前','#E4E8ED','var(--slate2)'],
  ['Lina Kusuma','资料录入','Dewi','6 天前','#E4E8ED','var(--slate2)'],
  ['Hana Permana','资料录入','Rina','3 天前','#E4E8ED','var(--slate2)'],
  ['Tari Wibowo','资料录入','Rina','2 天前','#E4E8ED','var(--slate2)'],
  ['Bayu Aditya','资料录入','Dewi','昨天','#E4E8ED','var(--slate2)']
];

/* 客户持有项目（2026-09-29 新增）：按客户姓名存，结算后本地项目（含术后管理）全部转入这里，不进入案件进程。
   结构：{itemName, category, batches:[{caseId,date,bought,used,usages:[{caseId,date,qty}]}], krCollected} */
var CLIENT_HOLDINGS = {};

function getClientHoldings(name){ return CLIENT_HOLDINGS[name] || []; }

function holdingRemaining(h){ return h.batches.reduce(function(s,b){ return b.voided ? s : s+(b.bought-b.used); }, 0); }
 /* 已退款的批次整批作废，不计入 */
function holdingTotal(h){ return h.batches.reduce(function(s,b){ return b.voided ? s : s+b.bought; }, 0); }

/* 结算/KR代收 时调用：给客户新增一批持有 */
function grantHolding(name, itemName, category, caseId, date, qty, krCollected){
  CLIENT_HOLDINGS[name] = CLIENT_HOLDINGS[name] || [];
  var h = CLIENT_HOLDINGS[name].filter(function(x){ return x.itemName===itemName; })[0];
  if(!h){ h = {itemName:itemName, category:category, batches:[], krCollected:!!krCollected}; CLIENT_HOLDINGS[name].push(h); }
  if(krCollected) h.krCollected = true;
  h.batches.push({caseId:caseId, date:date, bought:qty, used:0, usages:[], kr:!!krCollected});
}

/* 使用持有：先扣最早购买的那一批，跨批次自动结转；记 usages 供客户详情页展开显示 */
function useHolding(name, itemName, caseId, date, qty, tag){
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
    b.usages.push({caseId:caseId, date:date, qty:take, tag:tag||'main'});
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
var CLIENT_FIX_LOG = {};

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
    id:o.id, name:o.name, subState:o.subState||'waiting',
    inCoordinator:o.inCoordinator||actingName(), krInRoom:!!o.krInRoom, chatArchive:null, /* 2026-10-02：负责该案件的IN室长 / KR室长是否已进入案件对话房 / 结案后整理的对话记录 */
    visitDate:o.visitDate||null, visitTime:o.visitTime||null, visitPurpose:o.visitPurpose||'面诊商谈', /* 2026-10-02：日历、案件列表、预约历史都从案件这份数据算 */
    reportEta:o.reportEta||null, reportOverdue:!!o.reportOverdue, /* 2026-10-02：KR确认的预计出报告时间 / 已超时提醒 */
    director:(o.director!==undefined ? o.director : ((o.consultRequested || o.needsConsult===true) ? '김민석 원장' : null)), /* 2026-10-02：本地案件没有院长 */ krCoordinator:o.krCoordinator||'이서연 실장', updated:o.updated||'刚刚', caseNo:o.caseNo||null,
    basic:o.basic||{gender:'女', dob:'1990-01-01', contact:'WhatsApp +62 812-xxxx-xxxx', history:'无'},
    materialsConfirmed:!!o.materialsConfirmed, photoUploaded:!!o.materialsConfirmed, videoUploaded:!!o.materialsConfirmed,
    concern:o.concern||'', expectation:o.expectation||'', metaviewStatus:o.materialsConfirmed?'ready':'idle',
    needsConsult: o.needsConsult===undefined ? null : o.needsConsult, activeCaseTab:o.activeCaseTab||'basic',
    consultRequested:!!o.consultRequested, consultStatus:o.consultStatus||null,
    videoSummary:o.videoSummary||'', consultFiles:o.consultFiles||[], reportReady:!!o.reportReady, krVideoInvited:!!o.krVideoInvited,
    reportUploadedBy:o.reportUploadedBy||(o.reportReady ? (o.krCoordinator||'이서연 실장') : ''), /* 2026-09-30：报告由KR室长上传（Notion），邀请室长视频的候选人只列上传过报告的室长 */
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
    krProcedureDone:!!o.krProcedureDone, /* 2026-09-30：KR标记"施术完成"（至少完成一项赴韩施术），结局判定里算"完成了施术" */
    refunds:o.refunds||[], /* 2026-09-30：赴韩项目退款记录 [{amount,currency,reason,date,items}]，退款只进财务字段，不影响结局 */
    financeResult:null, /* 无收入/仅面诊费/有项目收入/全额退款，由 updateCaseStage→financeResultOf 现算 */
    /* 本地流程（§3）的案件级状态：持有项目使用后进入本地管理；localMgmt 是同日插做的"本地管理"tab，字段同名（见 ctxOf） */
    mgmtUses:o.mgmtUses||[], mgmtActive:!!o.mgmtActive, mgmtDone:!!o.mgmtDone, mgmtStatus:o.mgmtStatus||null, mgmtCancelling:false,
    linkedCase:o.linkedCase||null, /* 2026-09-30 §6：关联之前案件 {caseId, reason:复诊/术后管理/延续既往面诊, auto?} */
    linkedFiles:o.linkedFiles||[], manualAttachments:o.manualAttachments||[], materialsDate:o.materialsDate||null, /* §7 附件 */
    consultFeeWaived:o.consultFeeWaived||null, /* 面诊费免除（2026-09-30）：{reason, note}，免除时财务结果按无收入判断 */
    localTrack:!!o.localTrack, /* 2026-09-30：本地案件标记（面诊取消后做本地项目 / 无法协调后做本地管理），用于状态推算：选择项目→本地管理 */
    newBeautyHistory:o.newBeautyHistory||'', needsConsultTouched:false, /* 2026-10-01 延续既往面诊：基础资料新增医美史 / 室长是否手动选过面诊需求 */
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
  makeCase({id:'siti', name:'Siti Rahayu', caseNo:'A000017', updated:'刚刚',
    basic:{gender:'女', dob:'1992-03-08', contact:'WhatsApp +62 812-xxxx-xxxx', history:'无'},
    logEntries:[{stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(0)+' 09:05'}]}),

  /* 演示（到访接续）：Ayu Lestari 已有进行中案件 ayu（项目确认中），这条是她新的预约来访（待访问） */
  makeCase({id:'ayu2', name:'Ayu Lestari', caseNo:'A000021', updated:'刚刚',
    logEntries:[{stage:'预约到店', actor:'Dewi', action:'老客人预约来访', dt:D(0)+' 09:10'}]}),

  /* 接待中：客人已到店，메타뷰/照片/视频/苦恼/希望预期还没确认完，所以还没生成 Case ID */
  makeCase({id:'andi', name:'Andi Wijaya', subState:'arrived', caseNo:'A000018', updated:'昨天',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-1)+' 10:00'},
      {stage:'预约到店', actor:'Rina', action:'标记客人已到店', dt:D(-1)+' 10:30'}
    ]}),

  /* 待选项目：分支2"不面诊"——基础资料确认时选了不面诊，Case ID 已生成，正在选管理项目、还没点"确认所选项目" */
  makeCase({id:'yuni', name:'Yuni Kartika', subState:'arrived', materialsConfirmed:true, caseNo:'A000001', updated:'2 小时前',
    concern:'皮肤暗沉、毛孔粗大', expectation:'希望肤色均匀、毛孔细致', needsConsult:false, activeCaseTab:'localmgmt', projectsEnabled:true, projectOriginFilter:'IN',
    entryChoicePending:true, projectEntryMode:'new', /* 2026-09-29 第十轮：不面诊后先经过入口选择，这里演示已经点了"新增项目" */
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-2)+' 09:00'},
      {stage:'预约到店', actor:'Dewi', action:'标记客人已到店', dt:D(-2)+' 09:20'},
      {stage:'面诊安排', actor:'Dewi', action:'确认了메타뷰/照片/视频/苦恼/希望预期，面诊需求：不面诊', dt:D(-2)+' 09:35'}
    ]}),

  /* 待确认报告时间：面诊费已缴，已在 Main 对话群通知，等 Kr室长确认预计出报告时间 */
  makeCase({id:'maya', name:'Maya Putri', subState:'arrived', materialsConfirmed:true, caseNo:'A000002', updated:'昨天',
    concern:'轮廓线条不明显', expectation:'想要更立体的轮廓', needsConsult:true, activeCaseTab:'consult', consultRequested:true, consultStatus:'paid_waiting_kr',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-2)+' 14:00'},
      {stage:'预约到店', actor:'Dewi', action:'标记客人已到店', dt:D(-2)+' 14:20'},
      {stage:'面诊安排', actor:'Dewi', action:'确认了메타뷰/照片/视频/苦恼/希望预期，面诊需求：面诊', dt:D(-2)+' 14:35'},
      {stage:'面诊安排', actor:'客人', action:'完成面诊费支付，已在Main对话群自动通知', dt:D(-2)+' 14:40'}
    ]}),

  /* 等待报告：Kr室长已确认预计出报告时间（倒计时中） */
  makeCase({id:'putri', name:'Putri Wulandari', subState:'arrived', materialsConfirmed:true, caseNo:'A000003', updated:'3 天前',
    concern:'法令纹加深', expectation:'希望改善法令纹', needsConsult:true, activeCaseTab:'consult', consultRequested:true, consultStatus:'awaiting_report', reportEta:D(2)+' 14:00',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-4)+' 09:00'},
      {stage:'面诊安排', actor:'客人', action:'完成面诊费支付，已在Main对话群自动通知', dt:D(-4)+' 10:00'},
      {stage:'面诊安排', actor:'이서연', action:'KR确认预计出报告时间：'+D(2)+' 14:00', dt:D(-4)+' 16:00'}
    ]}),

  /* 等待报告：超过预计时间（小状态橘色提醒） */
  makeCase({id:'dedi', name:'Dedi Prasetyo', subState:'arrived', materialsConfirmed:true, caseNo:'A000004', updated:'刚刚',
    concern:'苹果肌塌陷', expectation:'希望恢复饱满', needsConsult:true, activeCaseTab:'consult', consultRequested:true, consultStatus:'awaiting_report', reportEta:D(0)+' 08:00', reportOverdue:true,
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-5)+' 09:00'},
      {stage:'面诊安排', actor:'이서연', action:'KR确认预计出报告时间：'+D(0)+' 08:00', dt:D(-5)+' 11:00'},
      {stage:'面诊安排', actor:'系统', action:'已超过预计出报告时间，报告还没提交（仅提醒，状态不变）', dt:D(0)+' 08:05'}
    ]}),

  /* 等待报告：预计时间未到 */
  makeCase({id:'budi', name:'Budi Santoso', subState:'arrived', materialsConfirmed:true, caseNo:'A000005', updated:'3 天前',
    concern:'轮廓松弛', expectation:'希望紧致轮廓', needsConsult:true, activeCaseTab:'consult', consultRequested:true, consultStatus:'awaiting_report', reportEta:D(2)+' 11:00',
    videoSummary:'轮廓松弛属中度，建议先做超声刀评估，配合居家护理观察 4 周后复诊。',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-6)+' 09:00'},
      {stage:'面诊安排', actor:'이서연', action:'KR确认预计出报告时间：'+D(2)+' 11:00', dt:D(0)+' 09:30'}
    ]}),

  /* 已出报告：报告已出，正在待客人/室长选管理项目 */
  makeCase({id:'ayu', reportDate:D(-8), name:'Ayu Lestari', subState:'arrived', materialsConfirmed:true, caseNo:'A000006', updated:'昨天',
    concern:'皮肤暗沉、细纹', expectation:'希望肤质透亮', needsConsult:true, activeCaseTab:'projects', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'面部凹陷、细纹较明显，建议先做自体脂肪移植改善轮廓，再评估面部拉皮。',
    consultFiles:[{label:'面诊报告'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, krScope:{items:[{name:'自体脂肪移植（全脸）', price:4500000, note:''},{name:'面部拉皮', price:12000000, note:''}], overallNote:'具体术式最终以到院评估为准', updatedAt:D(1)+' 11:20'},
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-7)+' 09:00'},
      {stage:'面诊安排', actor:'김민석 원장', action:'KR室长提交面诊报告，已出报告', dt:D(1)+' 11:20'}
    ]}),

  /* 待付款：已确认所选管理项目、生成结算单，等待付款 */
  makeCase({id:'fajar', name:'Fajar Nugroho', subState:'arrived', materialsConfirmed:true, caseNo:'A000007', updated:'2 小时前',
    concern:'鼻基底低平', expectation:'希望鼻型更立体', needsConsult:true, activeCaseTab:'projects', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议先做假体隆鼻改善鼻基底，再评估鼻翼缩小。',
    consultFiles:[{label:'面诊报告'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true,
    krScope:{items:[{name:'假体隆鼻', price:2500000, note:''},{name:'鼻翼缩小', price:1500000, note:''}], overallNote:'具体术式最终以到院评估为准', updatedAt:D(2)+' 14:20'},
    procedureItems:[
      {name:'假体隆鼻', origin:'KR', done:false, batchId:'B1'},
      {name:'鼻翼缩小', origin:'KR', done:false, batchId:'B1'}
    ],
    settlementBatches:[{id:'B1', orderedBy:'Dewi', settledBy:'客人', time:D(3)+' 10:00', status:'unpaid',
      krTotal:4000000, krDeposit:1200000, krBalance:2800000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-8)+' 09:00'},
      {stage:'面诊安排', actor:'김민석 원장', action:'KR室长提交面诊报告，已出报告', dt:D(2)+' 14:20'},
      {stage:'面诊安排', actor:'Dewi', action:'确认所选管理项目：假体隆鼻、鼻翼缩小', dt:D(3)+' 10:00'}
    ]}),

  /* 赴韩施术中：已付款，韩国项目里还有未完成的 */
  makeCase({id:'nadia', name:'Nadia Permata', subState:'arrived', materialsConfirmed:true, caseNo:'A000008', updated:'今天',
    concern:'轮廓松弛、法令纹', expectation:'希望紧致提升', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议颧骨缩小+下巴假体联合方案改善轮廓。',
    consultFiles:[{label:'面诊报告'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true, settlementDone:true, arrivedAtHospital:true, krBalancePaid:true,
    krSchedule:{status:'confirmed', confirmedDate:D(2), confirmedTime:'10:00', primary:D(2), backup:'', changePrimary:'', changeBackup:'', changeSubmitted:false},
    procedureItems:[
      {name:'颧骨缩小', origin:'KR', done:false, batchId:'B1'},
      {name:'下巴假体 / 颏成形', origin:'KR', done:true, batchId:'B1'}
    ],
    settlementBatches:[{id:'B1', orderedBy:'Dewi', settledBy:'客人', time:D(2)+' 11:00', status:'active',
      krTotal:12000000, krDeposit:3600000, krBalance:8400000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-13)+' 09:00'},
      {stage:'面诊安排', actor:'김민석 원장', action:'KR室长提交面诊报告，已出报告', dt:D(1)+' 10:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩3,600,000），项目清单已锁定', dt:D(2)+' 11:00'},
      {stage:'赴韩施术', actor:'김민석 원장', action:'已完成"下巴假体 / 颏成形"施术，"颧骨缩小"待安排', dt:D(4)+' 16:00'}
    ]}),

  /* 待确认施术时间：已付款，已递交施术日期，正等Kr室长确认（2026-09-29 改用krSchedule细分状态演示） */
  makeCase({id:'dinda', name:'Dinda Anggraini', subState:'arrived', materialsConfirmed:true, caseNo:'A000013', updated:'刚刚',
    concern:'轮廓松弛', expectation:'希望紧致提升', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议面部拉皮+自体脂肪移植联合方案。',
    consultFiles:[{label:'面诊报告'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true, settlementDone:true,
    krSchedule:{status:'pending', primary:D(17), backup:D(18), confirmedDate:'', confirmedTime:'', changePrimary:'', changeBackup:'', changeSubmitted:false},
    procedureItems:[
      {name:'面部拉皮', origin:'KR', done:false, batchId:'B1'},
      {name:'自体脂肪移植（全脸）', origin:'KR', done:false, batchId:'B1'}
    ],
    settlementBatches:[{id:'B1', orderedBy:'Dewi', settledBy:'客人', time:D(5)+' 10:00', status:'active',
      krTotal:16500000, krDeposit:4950000, krBalance:11550000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-10)+' 09:00'},
      {stage:'面诊安排', actor:'김민석 원장', action:'KR室长提交面诊报告，已出报告', dt:D(3)+' 10:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩4,950,000），项目清单已锁定', dt:D(5)+' 10:00'}
    ]}),

  /* 本地管理（2026-09-30 改）：纯本地案件，已使用持有项目、管理尚未完成/取消；原"已付款待使用"不再是本地管理 */
  makeCase({id:'rizky', name:'Rizky Hidayat', subState:'arrived', materialsConfirmed:true, caseNo:'A000009', updated:'今天',
    concern:'术后恢复期护理', expectation:'希望恢复期更舒适', needsConsult:false, activeCaseTab:'localmgmt',
    projectsEnabled:true, projectsLocked:true, settlementDone:true,
    mgmtActive:true, mgmtUses:[{itemName:'好莱坞焕肤 1次', qty:1, date:D(-3)}],
    procedureItems:[],
    settlementBatches:[{id:'B1', orderedBy:'Dewi', settledBy:'客人', time:D(-3)+' 09:00', status:'active',
      krTotal:0, krDeposit:0, krBalance:0, inTotal:860000}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-17)+' 09:00'},
      {stage:'面诊安排', actor:'Dewi', action:'确认了메타뷰/照片/视频/苦恼/希望预期，面诊需求：不面诊', dt:D(-3)+' 08:50'},
      {stage:'面诊安排', actor:'Dewi', action:'选择"新增项目"', dt:D(-3)+' 08:55'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：本地全款 Rp 860.000），项目清单已锁定', dt:D(-3)+' 09:00'},
      {stage:'面诊安排', actor:'Dewi', action:'本地项目已转入客户持有：好莱坞焕肤 1次 x1、Genesis焕肤（Clarity II）1次 x1', dt:D(-3)+' 09:00'},
      {stage:'本地管理', actor:'Dewi', action:'使用了好莱坞焕肤 1次 1次，剩余0次', dt:D(-3)+' 09:20'}
    ]}),

  /* 已结案：赴韩行程施术完成即结案（2026-09-29 第十轮：本地项目已转客户持有，不再算在这个案件的完成条件里） */
  makeCase({id:'rina', director:'박지훈 원장', reportDate:D(-37), name:'Rina Marlina', subState:'arrived', materialsConfirmed:true, caseNo:'A000010', updated:'1 周前',
    concern:'整体抗老', expectation:'希望延缓衰老迹象', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议自体脂肪移植打底，配合本地焕肤护理维持效果。',
    consultFiles:[{label:'面诊报告'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true, settlementDone:true, arrivedAtHospital:true, krBalancePaid:true, visitClosed:true, krProcedureDone:true,
    krSchedule:{status:'confirmed', confirmedDate:D(-24), confirmedTime:'10:00', primary:D(-24), backup:'', changePrimary:'', changeBackup:'', changeSubmitted:false},
    procedureItems:[
      {name:'自体脂肪移植（全脸）', origin:'KR', done:true, batchId:'B1'}
    ],
    settlementBatches:[{id:'B1', orderedBy:'Dewi', settledBy:'客人', time:D(-29)+' 09:00', status:'active',
      krTotal:4500000, krDeposit:1350000, krBalance:3150000, inTotal:540000}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-39)+' 09:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩1,350,000、本地全款 Rp 540.000），项目清单已锁定', dt:D(-29)+' 09:00'},
      {stage:'面诊安排', actor:'Dewi', action:'本地项目已转入客户持有：Genesis焕肤（Clarity II）1次 x1', dt:D(-29)+' 09:00'},
      {stage:'赴韩施术', actor:'김민석 원장', action:'已完成"自体脂肪移植（全脸）"施术', dt:D(-24)+' 10:00'},
      {stage:'赴韩施术', actor:'김민석 원장', action:'KR标记"施术完成"，案件已结案', dt:D(-22)+' 09:00'}
    ]}),

  /* 接待中（演示"关联之前案件"）：Rina 之前有已结案的赴韩案件 A000010，这次再来，基础资料里可关联并看到"可能与 A000010 相关" */
  makeCase({id:'rina2', inCoordinator:'Rina', name:'Rina Marlina', subState:'arrived', caseNo:'A000019', updated:'刚刚',
    logEntries:[
      {stage:'预约到店', actor:'Dewi', action:'老客人预约来访', dt:D(0)+' 09:00'},
      {stage:'预约到店', actor:'Rina', action:'标记客人已到店', dt:D(0)+' 09:30'}
    ]}),

  /* 已结案 + 有退款：分支6——赴韩项目里一个取消退定金，另一个完成后案件结案（2026-09-29 第十轮改用赴韩项目演示，
     本地项目现在不能退款，"部分退"这个终态只能从赴韩项目取消这条路径触发了） */
  makeCase({id:'wulan', name:'Wulan Sari', subState:'arrived', materialsConfirmed:true, caseNo:'A000011', updated:'5 天前',
    concern:'轮廓不对称', expectation:'希望改善轮廓线条', needsConsult:true, activeCaseTab:'kr', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议下颌角整形+颧骨缩小联合方案改善轮廓。',
    consultFiles:[{label:'面诊报告'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    krScope:{items:[{name:'下颌角整形', price:9000000, note:''},{name:'颧骨缩小', price:8000000, note:'不可与下颌角同时做'}], overallNote:'具体术式最终以到院评估为准', updatedAt:D(-10)+' 09:00'},
    projectsEnabled:true, projectsLocked:true, settlementDone:true, arrivedAtHospital:true, krBalancePaid:true, visitClosed:true,
    krProcedureDone:true,
    refunds:[{amount:2400000, currency:'KRW', reason:'客人检查后决定不做颧骨缩小', date:D(-7), items:['颧骨缩小'], batchIds:['B1']}],
    krSchedule:{status:'confirmed', confirmedDate:D(-5), confirmedTime:'11:00', primary:D(-5), backup:'', changePrimary:'', changeBackup:'', changeSubmitted:false},
    procedureItems:[{name:'下颌角整形', origin:'KR', done:true, batchId:'B1'},{name:'颧骨缩小', origin:'KR', done:false, cancelled:true, batchId:'B1'}],
    settlementBatches:[{id:'B1', orderedBy:'Dewi', settledBy:'客人', time:D(-10)+' 09:00', status:'active',
      krTotal:17000000, krDeposit:5100000, krBalance:11900000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-17)+' 09:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩5,100,000），项目清单已锁定', dt:D(-10)+' 09:00'},
      {stage:'赴韩施术', actor:'Dewi', action:'取消项目"颧骨缩小"，退款 ₩2,400,000，退款原因：客人检查后决定不做颧骨缩小', dt:D(-7)+' 09:00'},
      {stage:'赴韩施术', actor:'김민석 원장', action:'已完成"下颌角整形"施术', dt:D(-5)+' 11:00'},
      {stage:'赴韩施术', actor:'김민석 원장', action:'KR标记"施术完成"，案件已结案（退款记入财务字段）', dt:D(-5)+' 15:00'}
    ]}),

  /* 已取消预约：分支1——待访问阶段直接终止，资料保留，没有走到基础资料确认，所以没有 Case ID */
  makeCase({id:'bayu', name:'Bayu Aditya', subState:'cancelled', cancelReason:'未到店', caseNo:'A000022', updated:'昨天',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-1)+' 09:00'},
      {stage:'预约到店', actor:'系统', action:'过预约时间30分钟未点"到访"，系统自动判定：已取消（未到店）', dt:D(-1)+' 10:30'}
    ]}),
  makeCase({id:'agus', name:'Agus Salim', subState:'cancelled', caseNo:'A000020', cancelReason:'预约取消', updated:'4 天前',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(1)+' 09:00'},
      {stage:'预约到店', actor:'Dewi', action:'取消预约，原因：联系不上客人', dt:D(1)+' 18:00'}
    ]}),

  /* 仅出报告（2026-09-30）：分支6——赴韩项目全部取消并退款、没做本地项目，客人只拿到了面诊报告；财务结果=全额退款 */
  makeCase({id:'lina', reportDate:D(-13), name:'Lina Kusuma', materialsConfirmed:true, caseNo:'A000012', updated:'6 天前',
    concern:'眼部松弛', expectation:'希望眼周更年轻', needsConsult:true, activeCaseTab:'basic', consultRequested:true, consultStatus:'report_ready', reportReady:true,
    videoSummary:'建议提眉联合上睑整形。',
    consultFiles:[{label:'面诊报告'},{label:'院长面诊视频'},{label:'院长面诊文本（AI生成，仅供参考）'}],
    projectsEnabled:true, projectsLocked:true, settlementDone:true, visitClosed:true,
    refunds:[{amount:300000, currency:'KRW', reason:'客人因个人原因取消赴韩行程', date:D(-6), items:['提眉手术'], batchIds:['B1']}],
    procedureItems:[{name:'提眉手术', origin:'KR', done:false, cancelled:true, batchId:'B1'}],
    settlementBatches:[{id:'B1', orderedBy:'Dewi', settledBy:'客人', time:D(-8)+' 09:00', status:'active',
      krTotal:1000000, krDeposit:300000, krBalance:700000, inTotal:0}],
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(-14)+' 09:00'},
      {stage:'面诊安排', actor:'客人', action:'完成项目付款（批次 B1：赴韩预付金 ₩300,000），项目清单已锁定', dt:D(-8)+' 09:00'},
      {stage:'赴韩施术', actor:'Dewi', action:'取消项目"提眉手术"，退款 ₩300,000，退款原因：客人因个人原因取消赴韩行程', dt:D(-6)+' 09:00'},
      {stage:'赴韩施术', actor:'Dewi', action:'全部赴韩项目均已取消退款，案件结束：仅出报告', dt:D(-6)+' 09:05'}
    ]}),

  /* 已取消（管理取消）：不面诊案件使用持有项目后，管理全部取消、本次无购买，未做次数已归还持有 */
  makeCase({id:'hana', name:'Hana Permana', subState:'arrived', materialsConfirmed:true, caseNo:'A000015', updated:'3 天前',
    concern:'术后恢复', expectation:'希望恢复期舒适', needsConsult:false, activeCaseTab:'localmgmt', visitClosed:true, cancelReason:'管理取消', mgmtStatus:'cancelled_all',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(2)+' 09:00'},
      {stage:'面诊安排', actor:'Dewi', action:'使用了术后消肿护理 1次 1次，剩余1次', dt:D(2)+' 10:00'},
      {stage:'本地管理', actor:'Dewi', action:'管理取消（全部）：1次已归还持有项目（不是退款）；本次无购买，案件已取消（管理取消）', dt:D(2)+' 10:30'}
    ]}),

  /* 已取消（未购买未使用）：不面诊案件，本次既没购买也没使用 */
  makeCase({id:'tari', name:'Tari Wibowo', subState:'arrived', materialsConfirmed:true, caseNo:'A000016', updated:'2 天前',
    concern:'皮肤暗沉', expectation:'了解项目', needsConsult:false, activeCaseTab:'localmgmt', visitClosed:true, cancelReason:'未购买未使用',
    logEntries:[
      {stage:'预约到店', actor:'客人', action:'自助预约成功', dt:D(3)+' 09:00'},
      {stage:'面诊安排', actor:'Dewi', action:'本次不购买项目，案件已取消（未购买未使用）', dt:D(3)+' 10:00'}
    ]})
];

CASE_ITEMS.forEach(updateCaseStage);

var CASE_NO_SEQ = 23;

/* ---- 演示数据：每个案件一条预约来访（日期/时间/目的）——日历每个事件都对应案件列表里的一个案件（2026-10-02·一） ---- */
var DEMO_VISITS = {
  siti:[D(0),'10:45','面诊商谈'], ayu2:[D(0),'15:00','复诊'], andi:[D(0),'09:30','面诊商谈'], rina2:[D(0),'10:00','复诊'],
  yuni:[D(-2),'09:30','皮肤商谈'], maya:[D(-2),'14:00','面诊商谈'], putri:[D(-4),'10:00','面诊商谈'], dedi:[D(-3),'10:30','面诊商谈'],
  budi:[D(-3),'14:30','面诊商谈'], ayu:[D(-2),'11:00','皮肤商谈'], fajar:[D(-1),'09:30','面诊商谈'], nadia:[D(-4),'14:00','面诊商谈'],
  dinda:[D(-1),'14:00','面诊商谈'], rizky:[D(-1),'11:00','皮肤管理'], rina:[D(-4),'09:30','面诊商谈'], wulan:[D(-3),'09:30','面诊商谈'],
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

function caseWorkDone(c){ return !!c.krProcedureDone || isLocalCtxWorkDone(c) || isLocalCtxWorkDone(c.localMgmt); }

function refundSum(c){ return (c.refunds||[]).reduce(function(sum,r){ return sum+(r.amount||0); }, 0); }

/* 客户详情的持有批次退款，记在"当初购买这个批次的案件"上（2026-10-05）：该案件财务显示"有退款"（财务结果其他标签、结局都不变），两边 Timeline 互相注明 */
function holdingRefundSum(c){ return (c.holdingRefunds||[]).reduce(function(sum,r){ return sum+(r.amount||0); }, 0); }
 /* 案件列表"有退款"筛选：含持有批次退款、仅办理退款 */
function financePaid(c){
  var kr=0, inn=0;
  (c.settlementBatches||[]).forEach(function(b){ if(b.status==='active'){ kr += b.krDeposit||0; inn += b.inTotal||0; } });
  if(c.localMgmt) (c.localMgmt.batches||[]).forEach(function(b){ inn += b.inTotal||0; });
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
  if(ref>0 && net<=0 && pd.inn<=0 && pd.kr>0) return '全额退款';
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
  if(ref>0) t += ' · 已退款 ' + formatCurrency(ref,'KRW');
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
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
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
function krAllItems(c){ return (c.procedureItems||[]).filter(function(it){ return it.origin==='KR'; }); }

function krActiveItems(c){ return krAllItems(c).filter(function(it){ return !it.cancelled && !it.swapped; }); }

function krNotStartedItems(c){ return krActiveItems(c).filter(function(it){ return !it.done; }); }

function krItemStatus(it){ return it.cancelled ? '已取消' : (it.swapped || it.replacedBy) ? '已更换' : it.done ? '已完成' : '未开始'; }

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
  c.logEntries.push({stage:'预约到店', actor: auto ? '系统' : actingName(), action: auto ? '过预约时间30分钟未点"到访"，系统自动判定：已取消（未到店）' : '手动标记未到店：已取消（未到店）', dt:nowFullDt()});
  return true;
}

function rowAction(caseId, kind){
  CURRENT_CASE_ID = caseId;
  if(kind==='arrive'){ markArrived(); renderCaseRows(); }
  else if(kind==='cancel'){ openCancelModal(); }
  else if(kind==='reschedule'){ openRescheduleModal(); }
  else if(kind==='noshow'){ rowMarkNoShow(caseId); }
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

function financeCellHtml(c){
  var f = financeResultOf(c), pd = financePaid(c), ref = refundSum(c), income = [];
  if(pd.kr>0) income.push(formatCurrency(pd.kr,'KRW'));
  if(pd.inn>0) income.push(formatCurrency(pd.inn,'IDR'));
  return '<div style="font-size:12px;font-weight:700;">'+f+'</div>'+
    (income.length ? '<div style="font-size:11px;color:var(--slate2);">收入 '+income.join(' + ')+'</div>' : '')+
    (ref>0 ? '<div style="font-size:11px;color:var(--terracotta);">退款 '+formatCurrency(ref,'KRW')+'</div>' : '')+
    ((c.holdingRefunds||[]).length ? '<div style="font-size:11px;color:var(--terracotta);" title="客户详情里持有批次的退款，记在当初购买的案件上">有退款 '+formatCurrency(holdingRefundSum(c),'IDR')+'（持有批次）</div>' : '')+
    (c.cancelReason==='仅办理退款' ? '<div style="font-size:11px;color:var(--terracotta);">有退款（本次到访只办理退款）</div>' : '');
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
    else if(inFlow && c.consultStatus==='awaiting_report') items = items.concat(reportWaitSubItems(c)); /* 预计出报告时间+倒计时 / 已超过预计时间 */
    else if(c.projectsEnabled || c.reportReady){
      if(c.reportReady) items.push({kind:'Success', text: c.reuseReport ? '沿用原报告（'+c.reuseReport.caseNo+'）' : '报告已出'});
      if(c.projectsLocked && !c.settlementDone) items.push({kind:'Waiting', text:'待付款'});
    }
  } else if(c.stage==='travel'){
    var st = scheduleState(c), ks = c.krSchedule || {};
    if(st==='Draft') items.push({kind:'Waiting', text:'待递交施术日期'}); /* TODO(待确认)：Draft 总览没有小状态文字 */
    if(st==='Pending') items.push({kind:'Waiting', text:'待确认施术时间'});
    if(st==='Confirmed' || st==='Changing' || st==='Arrived') items.push({kind:'Success', text:'施术时间已确认 '+ks.confirmedDate+' '+ks.confirmedTime});
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

function localMgmtTagOn(c){ return !isEnded(c) && ((c.localMgmt && c.localMgmt.active) || (localCarried(c) && (c.mgmtActive || c.settlementDone))); }

var CASE_PROGRESS_ORDER = ['booked','consult','travel','local','closed'];

function filterCases(key){
  CASE_TAB_FILTER = key;
  buildCaseTabs();
  renderCaseRows();
}

function getCurrentCase(){ return CASE_ITEMS.filter(function(x){ return x.id===CURRENT_CASE_ID; })[0]; }

function pickCancelReason(r){ CANCEL_REASON = r; renderCancelReasons(); }

var RESCHED_UNAVAILABLE = ['10:00','12:00','18:00','19:30','20:00'];

var RESCHED_AM = []; /* 由诊所设定生成（applyClinicSettings） */

var RESCHED_PM = [];

function rescheduleMonthShift(dir){
  RESCHED_VIEW_MONTH = new Date(RESCHED_VIEW_MONTH.getFullYear(), RESCHED_VIEW_MONTH.getMonth()+dir, 1);
  renderRescheduleCalendar();
}

function rescheduleDayShift(dir){
  RESCHED_SELECTED_DATE = new Date(RESCHED_SELECTED_DATE.getFullYear(), RESCHED_SELECTED_DATE.getMonth(), RESCHED_SELECTED_DATE.getDate()+dir);
  RESCHED_VIEW_MONTH = new Date(RESCHED_SELECTED_DATE.getFullYear(), RESCHED_SELECTED_DATE.getMonth(), 1);
  renderRescheduleCalendar();
  renderRescheduleTimePanel();
}

function pickRescheduleDate(y,m,d){
  RESCHED_SELECTED_DATE = new Date(y,m,d);
  renderRescheduleCalendar();
  renderRescheduleTimePanel();
}

function slotUnavailable(time){ return RESCHED_UNAVAILABLE.indexOf(time)>-1; }

function pickRescheduleTime(t){ RESCHED_SELECTED_TIME = t; renderRescheduleTimePanel(); }


/* ---- Timeline format: 进程名/具体做了什么/谁/00-00-00 00:00 ---- */
function logLine(e){
  var action = e.kind==='case'
    ? '<a href="#" onclick="openCaseDetail(\''+e.caseId+'\');return false;" style="color:var(--navy);font-weight:700;">'+e.action+' →</a>'
    : e.action;
  return '<div style="padding:11px 0;border-bottom:1px solid var(--border2);font-size:13px;"><b>'+e.stage+'</b>&nbsp;&nbsp;'+action+'&nbsp;&nbsp;<span style="color:var(--slate2);">「'+actorDisplay(e)+'」</span>&nbsp;&nbsp;<span style="color:var(--muted);">'+e.dt+'</span></div>';
}

var DEMO_SHIFT_MS = 0;

function nowFullDt(){ var d = demoNow(); return dateStr(d)+' '+pad2(d.getHours())+':'+pad2(d.getMinutes()); }

function logCaseEvent(c, actor, action){
  c.logEntries = c.logEntries || [];
  c.logEntries.push({stage: stageLogLabel(c), actor: actor, actorId: (actor===ME_NAME ? currentAccountId() : undefined), action: action, dt: nowFullDt()});
}

var KR_COORDINATORS = ['이서연', '박준혁'];

/* 室长商谈（2026-10-01）：入口①案件对话房里发起（工具栏🧑‍⚕️）；入口②报告卡片[邀请室长商谈]快捷入口——点击后进入案件对话房再选室长发起视频（同一个功能） */
function consultTalkShortcut(){
  /* 2026-10-02：报告卡［邀请室长商谈］→ 直接打开视频画面（不经过对话房），只能选上传报告的KR室长 */
  var c = getCurrentCase(); if(!c) return;
  openInviteKrModal();
}

function callTitle(){ var c = VIDEO_CALL.caseId ? CASE_ITEMS.filter(function(x){ return x.id===VIDEO_CALL.caseId; })[0] : null; return c ? c.name : '演示'; }

function startCall(kind, caseId, participants){
  VIDEO_CALL = {active:true, kind:kind, caseId:caseId, participants:participants, status:'ringing', shareBy:null, muted:false, startedAt:Date.now(), transcript:[]};
  INVITE_KR_CONTEXT_CASE_ID = (kind==='talk') ? caseId : null;
  CHAT_VIDEO_CONTEXT_CASE_ID = (kind==='chat') ? caseId : null;
  renderDashCallCard();
  nav('video-consult');
  renderVideoPage();
}

function startDemoCall(){ startCall('demo', null, [ME_NAME+'（印尼室长）', '이서연 실장（韩国室长）']); VIDEO_CALL.status = 'connected'; seedTranscript(); renderVideoPage(); }

function seedTranscript(){
  VIDEO_CALL.transcript = [
    {name:'Dewi', orig:'您好，我们先确认一下客人的情况。', trans:'안녕하세요, 고객 상황부터 확인하겠습니다.'},
    {name:'이서연', orig:'네, 사진은 확인했습니다.', trans:'好的，照片已经确认过了。'}
  ];
}

function simulatePeerJoin(){ if(VIDEO_CALL.status!=='ringing') return; VIDEO_CALL.status = 'connected'; seedTranscript(); renderVideoPage(); }

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
  startCall('talk', CURRENT_CASE_ID, [ME_NAME+'（印尼室长）', name+' 실장（韩国室长）']); /* 室长商谈：直接呼叫上传报告的KR室长 */
}

function endVideoConsult(){
  var touchedCase = null;
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
      postCaseRoomFile(c2.id, '이서연', 'var(--sage)', '이', '室长面诊文本（AI生成，仅供参考）+ 室长面诊视频');
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
   无变动 → 沿用原报告（面诊资料tab显示原报告，标注"沿用自 A000xxx"，项目列表按原方案预填）→ 项目确认中；
   有变动 → 仍在等待报告，由"模拟KR室长提交报告"出新报告 → 项目确认中。没有视频/书面分支 */
function simulateDirectorJudge(changed){
  var c = getCurrentCase();
  if(!c || c.consultStatus!=='awaiting_report' || !isContinuationConsult(c)) return;
  c.contJudged = true;
  if(!changed){
    c.reuseAfterConsult = true;
    logCaseEvent(c, '김민석 원장', '院长判断：无变动');
    applyReuseReport(c);
    buildCaseLog(c); updateCaseStage(c); renderCaseStatusBar(c); renderCaseBody(c);
    return;
  }
  logCaseEvent(c, '김민석 원장', '院长判断：有变动（由KR室长提交新报告）');
  buildCaseLog(c); renderCaseBody(c);
}

function markReportUploaded(){
  /* 等待报告 → KR室长提交报告（院长口述 + 室长整理）→ Timeline 记"已出报告"→ 项目确认中（附可选范围） */
  var c = getCurrentCase();
  if(!c || c.consultStatus!=='awaiting_report') return;
  c.reportReady = true;
  c.consultStatus = 'report_ready';
  c.reportDate = nowFullDt().split(' ')[0];
  c.reportUploadedBy = c.krCoordinator;
  c.videoSummary = c.videoSummary || '轮廓松弛属中度，建议先做超声刀评估，配合居家护理观察 4 周后复诊。';
  c.consultFiles = c.consultFiles || [];
  c.consultFiles.unshift({label:'面诊报告（院长口述 + 室长整理）', date:attDate()});
  applyDirectorPlan(c);
  logCaseEvent(c, c.krCoordinator, 'KR室长提交面诊报告，已出报告');
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
  pushNotif('面诊','报告已出：'+c.name+'（'+(c.caseNo||'')+'）', {caseId:c.id});
}

/* 赴韩项目可选范围（2026-09-29 重写，"项目列表/赴韩施术/本地管理重构"指令）：
   由KR室长直接整理（不经过院长），出报告时写入演示数据，格式 {name,price,note}，不挂项目库id引用。
   演示用的具体项目名单+备注不是业务方指定的（用户确认继续当演示数据） */
function defaultKrScopeItems(){
  return [
    {name:'鼻综合（假体+鼻尖）', note:''},
    {name:'切开双眼皮', note:''},
    {name:'颧骨缩小', note:'不可与下颌角同时做'}
  ].map(function(x){
    var p = PROJECT_LIBRARY.filter(function(y){ return y.name===x.name; })[0];
    return p ? {name:p.name, price:p.price, note:x.note} : null;
  }).filter(Boolean);
}

function applyDirectorPlan(c){
  /* 出报告同时，KR室长给出赴韩可选项目范围，不再自动预勾选到已选列表，改由IN室长自由勾选 */
  c.krScope = {items:defaultKrScopeItems(), overallNote:'具体术式最终以到院评估为准', updatedAt:nowFullDt()};
  c.projectsEnabled = true;
  c.projectOriginFilter = 'KR';
}


/* ---- 查看报告：格式化的报告视图，底部"查看方案"跳转项目列表 ---- */
function reportModalContent(c){
  var body = c.videoSummary;
  return '<div style="font-size:11px;color:var(--muted);margin-bottom:22px;">'+D(0)+'</div>'+
    '<div style="font-size:13px;line-height:1.9;color:var(--navy);margin-bottom:32px;">尊敬的 '+c.name+'：<br><br>'+body+'<br><br>如有任何疑问，欢迎随时联系。</div>'+
    '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;margin-bottom:6px;">'+
    '<span style="font-family:Georgia,\'Times New Roman\',serif;font-size:21px;font-style:italic;color:var(--navy);">'+(c.director||'')+'</span>'+
    '<span style="font-size:11px;color:var(--muted);">主诊院长</span></div>'+
    '<button class="btn-primary" style="width:100%;margin-top:22px;" onclick="closeReportModal();switchCaseTab(\'projects\')">查看方案 →</button>';
}

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
        '<span>'+x.caseNo+' · '+caseStatusBadge(x)[2].split(' · ')[0]+' · 最近更新 '+lastDt+'</span>'+
        '<button class="btn-primary" style="padding:4px 12px;font-size:11px;" onclick="resumeVisit(\''+x.id+'\')">接续</button></div>';
    }).join('')+'</div>';
}

function continueNewVisit(){
  var c = getCurrentCase(); if(!c) return;
  c.continueNew = true; renderCaseBody(c);
}

function markArrived(){
  var c = getCurrentCase(); if(!c) return;
  c.subState = 'arrived';
  renderCaseStatusBar(c);
  logCaseEvent(c, actingName(), '标记客人已到店');
  buildCaseLog(c);
  renderCaseBody(c);
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
    return '<option value="'+x.id+'"'+(c.linkedCase&&c.linkedCase.caseId===x.id?' selected':'')+'>'+x.caseNo+' · '+caseStatusBadge(x)[2].split(' · ')[0]+'</option>';
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

/* 确认基础资料时落实关联：复诊/延续既往面诊 → 把原案件的面诊报告复制进新案件附件 */
function applyCaseLink(c){
  if(!c.linkedCase || !c.linkedCase.caseId) { c.linkedCase = null; return; }
  var src = CASE_ITEMS.filter(function(x){ return x.id===c.linkedCase.caseId; })[0];
  logCaseEvent(c, actingName(), '关联之前案件 '+(src&&src.caseNo?src.caseNo:c.linkedCase.caseId)+'（'+c.linkedCase.reason+'）');
  if(src && (c.linkedCase.reason==='复诊' || c.linkedCase.reason==='延续既往面诊') && DIRECTOR_LIST.indexOf(src.director)>-1 && c.director!==src.director){
    logCaseEvent(c, '系统', '关联'+c.linkedCase.reason+'：院长锁定为原院长 '+src.director+'（原：'+c.director+'）');
    c.director = src.director;
  }
  if(src && (c.linkedCase.reason==='复诊' || c.linkedCase.reason==='延续既往面诊')){
    (src.consultFiles||[]).filter(function(f){ return f.label.indexOf('面诊报告')>-1; }).forEach(function(f){
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
  var statusTxt = caseStatusBadge(other)[2];
  var html = '';
  if(reason==='复诊'){
    html += row('日期', caseFirstDate(other))+row('面诊结论 / 报告摘要', other.reportReady ? (other.videoSummary||'已出报告') : '没有面诊报告')+row('使用的项目', caseProjectNames(other))+row('当前状态', statusTxt);
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
      html += row('沿用的报告', follower.reuseReport ? '沿用自 '+origin.caseNo+' 的面诊报告' : '没有沿用（重新面诊；原报告已带入附件）')+row('选了哪些项目', caseProjectNames(follower))+row('当前状态', statusTxt);
    } else {
      html += row('面诊报告', other.reportReady ? (other.videoSummary||'已出报告') : '没有面诊报告')+row('选了哪些项目', caseProjectNames(other))+row('当前状态', statusTxt);
    }
  }
  return html;
}

function relatedEntryHtml(c, other, link, follower, origin, key){
  var b = caseStatusBadge(other), open = !!REL_OPEN[key];
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

function relatedTabHtml(c){
  var before = '', after = '';
  if(c.linkedCase && c.linkedCase.caseId){
    var src = CASE_ITEMS.filter(function(x){ return x.id===c.linkedCase.caseId; })[0];
    if(src) before = relatedEntryHtml(c, src, c.linkedCase, c, src, 'b-'+src.id);
  }
  relatedFollowers(c).forEach(function(f){ after += relatedEntryHtml(c, f, f.linkedCase, f, c, 'a-'+f.id); });
  var empty = '<div style="font-size:12px;color:var(--muted);padding:10px 0;">—</div>';
  return '<div class="card" style="padding:18px 24px;"><div class="info-heading" style="margin-bottom:6px;">之前关联 <span style="font-weight:400;font-size:11px;color:var(--muted);">本案件关联了谁</span></div>'+(before||empty)+
    '<div class="info-heading" style="margin:16px 0 6px;">后续关联 <span style="font-weight:400;font-size:11px;color:var(--muted);">谁关联了本案件（系统自动生成）</span></div>'+(after||empty)+
    '<div style="font-size:11px;color:var(--muted);margin-top:12px;">只读：不改变被关联案件的状态、财务、结局，也不会在它的 Timeline 里新增记录。</div></div>';
}

function materialsCardHtml(c){
  syncDirectorChoice(c);
  var metaviewText = c.metaviewStatus==='ready'
    ? '<span style="font-weight:700;color:var(--sage);">已检测到</span> <a href="#" class="info-link">查看报告 ↗</a>'
    : c.metaviewStatus==='checking'
      ? '<span style="color:var(--terracotta);">检测中…</span>'
      : '<span style="color:var(--slate2);cursor:pointer;border-bottom:1px dashed var(--dim);" onclick="simulateMetaviewReady()" title="原型演示：点击模拟메타뷰设备完成检测并推送数据">待检测</span>';
  var photoText = c.photoUploaded ? '<span style="font-weight:700;color:var(--sage);">✓ 已上传</span>' : '<button class="btn-ghost" onclick="mockUpload(\'photo\')">上传照片</button>';
  var videoText = c.videoUploaded ? '<span style="font-weight:700;color:var(--sage);">✓ 已上传</span>' : '<button class="btn-ghost" onclick="mockUpload(\'video\')">上传视频</button>';
  var ci0 = continuationInfo(c);
  var btn = function(val, label, key){ var on = (c.needsConsult===val); return '<button class="'+(on?'btn-primary':'btn-outline')+'" onclick="setNeedsConsult('+key+')">'+(on?'✅ ':'')+label+'</button>'; };
  var needsConsultBody = '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+btn(true,'面诊','true')+
    ((ci0 && ci0.overdue) ? '' : btn(false,'不面诊','false'))+
    (reusableReportSrc(c) ? btn('reuse','沿用原报告',"'reuse'") : '')+'</div>'+
    ((ci0 && ci0.overdue) ? '<div style="font-size:11px;color:#C1454A;margin-top:6px;">距原案件 '+ci0.src.caseNo+' 的报告日期（'+ci0.reportDate+'）已超过1个月：只能面诊并付费，不能免除、不能沿用原报告</div>' : '')+
    ((ci0 && !ci0.overdue && ci0.newHistory) ? '<div style="font-size:11px;color:var(--terracotta);margin-top:6px;">有新增医美史，建议面诊（默认面诊并付费，室长可以改）</div>' : '')+
    ((ci0 && !ci0.overdue && !ci0.newHistory) ? '<div style="font-size:11px;color:var(--muted);margin-top:6px;">距原案件报告日期（'+ci0.reportDate+'）1个月内：可面诊（默认免除面诊费）/ 不面诊 / 沿用原报告</div>' : '');

  var intentionChips = (c.intentionProjects||[]).map(function(it,idx){
    return '<span class="chip active" style="display:inline-flex;align-items:center;gap:4px;">'+it.name+'<span style="cursor:pointer;" onclick="removeIntentionProject('+idx+');event.stopPropagation();">✕</span></span>';
  }).join('');

  return '<div class="card" style="padding:22px 24px;">'+
    resumeBannerHtml(c)+
    linkRowHtml(c)+
    '<div class="case-field-row"><span class="fk">메타뷰 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;font-size:13px;">'+metaviewText+'</div></div>'+
    '<div class="case-field-row"><span class="fk">上传照片 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;"><div style="font-size:13px;">'+photoText+'</div><div style="font-size:11px;color:var(--muted);margin-top:3px;">规格：白底正面照，1200×1600px</div></div></div>'+
    '<div class="case-field-row"><span class="fk">上传视频 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;">'+videoText+'</div></div>'+
    '<div class="case-field-row"><span class="fk">苦恼 <span style="color:var(--terracotta);">*</span></span><input type="text" id="cf-concern" placeholder="客人本次的苦恼…" value="'+(c.concern||'')+'" oninput="saveMaterialsDraft(\'concern\',this.value)"></div>'+
    '<div class="case-field-row"><span class="fk">希望预期 <span style="color:var(--terracotta);">*</span></span><input type="text" id="cf-expectation" placeholder="客人希望达到的效果…" value="'+(c.expectation||'')+'" oninput="saveMaterialsDraft(\'expectation\',this.value)"></div>'+
    '<div class="case-field-row" style="align-items:flex-start;"><span class="fk" style="padding-top:9px;">意向项目 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;">'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px;">'+intentionChips+'<button class="btn-ghost" style="padding:4px 10px;font-size:12px;" onclick="openIntentionPickerModal()">+ 添加</button></div>'+
      '<input type="text" id="cf-intention-note" placeholder="补充说明…" value="'+(c.intentionNote||'')+'" oninput="saveMaterialsDraft(\'intentionNote\',this.value)">'+
      '</div></div>'+
    '<div class="case-field-row"><span class="fk">预算（选填）</span><div style="flex-grow:1;display:flex;align-items:center;gap:8px;">'+
      '<span style="font-size:12px;color:var(--muted);">Rp</span><input type="number" id="cf-budget-min" placeholder="最低" value="'+(c.budgetMin||'')+'" style="width:120px;" oninput="saveBudgetDraft(\'budgetMin\',this.value)">'+
      '<span style="font-size:12px;color:var(--muted);">～</span>'+
      '<span style="font-size:12px;color:var(--muted);">Rp</span><input type="number" id="cf-budget-max" placeholder="最高" value="'+(c.budgetMax||'')+'" style="width:120px;" oninput="saveBudgetDraft(\'budgetMax\',this.value)">'+
      '</div></div>'+
    '<div class="case-field-row"><span class="fk">上传附件（选填）</span><div style="flex-grow:1;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><span style="font-size:12px;color:var(--slate2);">'+((c.manualAttachments||[]).length ? (c.manualAttachments||[]).map(function(f){ return f.label; }).join('、') : '外部文件（选填）')+'</span><button class="btn-ghost" style="padding:4px 10px;font-size:12px;" onclick="mockUploadAttachment()">+ 上传</button></div></div>'+
    (ci0 ? '<div class="case-field-row"><span class="fk">新增医美史（选填）</span><input type="text" id="cf-new-history" placeholder="本次新增的医美史（例如：2个月前做了XX）" value="'+(c.newBeautyHistory||'').replace(/"/g,'&quot;')+'" oninput="saveMaterialsDraft(\'newBeautyHistory\',this.value)" onchange="onNewHistoryChanged()"></div>' : '')+
    '<div class="case-field-row" style="border-bottom:none;align-items:flex-start;"><span class="fk" style="padding-top:9px;">面诊需求 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;">'+needsConsultBody+'</div></div>'+
    directorRowHtml(c)+
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
  return '<div class="case-field-row"><span class="fk">意向项目</span><div style="flex-grow:1;font-size:13px;">'+chips+(c.intentionNote?'<div style="font-size:11px;color:var(--muted);margin-top:4px;">'+c.intentionNote+'</div>':'')+'</div></div>'+
    '<div class="case-field-row"><span class="fk">预算</span><span style="flex-grow:1;font-size:13px;">'+budgetText+'</span></div>';
}

/* 延续既往面诊（2026-10-01 修正）：
   - 距原案件报告日期超过 1 个月 → 锁定：只能"面诊"且付费，不能免除、不能沿用
   - 基础资料新增了医美史 → 提示"有新增医美史，建议面诊"，默认面诊（付费），室长可以改
   - 1 个月内（且室长没有改成付费面诊）→ 面诊 / 不面诊 / 沿用原报告 三选一
   - 面诊（付费或免除）结束后多一步"有无变动"：无变动→沿用原报告→项目确认中（不经过等待报告）；有变动→视频进等待报告、书面直接出新报告→项目确认中 */
function reportSrcOf(c){ /* 关联原因=延续既往面诊 且被关联案件有面诊报告 */
  var l = c.linkedCase;
  if(!l || !l.caseId || l.reason!=='延续既往面诊') return null;
  var src = CASE_ITEMS.filter(function(x){ return x.id===l.caseId; })[0];
  return (src && src.reportReady) ? src : null;
}

function reportDateOf(src){ return src.reportDate || ((src.logEntries && src.logEntries[0]) ? src.logEntries[0].dt.split(' ')[0] : nowFullDt().split(' ')[0]); }

function reportOverMonth(src){
  var d = new Date(reportDateOf(src)); d.setMonth(d.getMonth()+1);
  return d < new Date(nowFullDt().split(' ')[0]);
}

function continuationInfo(c){
  var src = reportSrcOf(c); if(!src) return null;
  return {src:src, overdue:reportOverMonth(src), reportDate:reportDateOf(src), newHistory:!!(c.newBeautyHistory && c.newBeautyHistory.trim())};
}

function onNewHistoryChanged(){
  var c = getCurrentCase(); if(!c) return;
  var i = continuationInfo(c);
  if(i && !i.overdue && !c.needsConsultTouched){ /* 有新增医美史：默认面诊（付费），室长可以改 */
    c.needsConsult = c.newBeautyHistory.trim() ? true : null;
  }
  c.feeDraft = null;
  renderCaseBody(c);
}

/* 院长（2026-10-02）：选"面诊"才出现，必选；选项只含启用的院长；复诊/延续既往面诊 → 默认带出原案件院长并锁定，原院长停用时才解锁可改选；
   确认后写入案件的对接院长，选定后不能更换（没有更换院长按钮）；不面诊的本地案件没有院长 */
function directorLockInfo(c){
  var l = c.linkedCase; if(!l || !l.caseId || (l.reason!=='复诊' && l.reason!=='延续既往面诊')) return null;
  var src = CASE_ITEMS.filter(function(x){ return x.id===l.caseId; })[0];
  if(!src || !src.director || !isDirectorActive(src.director)) return null;
  return {name:src.director, caseNo:src.caseNo, reason:l.reason};
}

function syncDirectorChoice(c){
  if(c.materialsConfirmed) return;
  var lk = directorLockInfo(c);
  if(c.needsConsult===true && lk) c.director = lk.name;
  else if(c.needsConsult!==true) c.director = null;
  else if(c.director && !isDirectorActive(c.director)) c.director = null;
}

function setCaseDirector(v){ var c = getCurrentCase(); if(!c) return; c.director = v || null; renderCaseBody(c); }

function directorRowHtml(c){
  if(c.needsConsult!==true) return '';
  var lk = directorLockInfo(c);
  var sel = '<select '+(lk?'disabled ':'')+'onchange="setCaseDirector(this.value)" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;'+(lk?'background:var(--sand);color:var(--muted);':'')+'"><option value="">请选择院长</option>'+
    DIRECTOR_LIST.map(function(d){ return '<option'+(c.director===d?' selected':'')+'>'+d+'</option>'; }).join('')+'</select>';
  var hint = lk ? '<div style="font-size:11px;color:var(--muted);margin-top:6px;">🔒 关联"'+lk.reason+'"（'+lk.caseNo+'）：已锁定原院长；原院长停用时才可改选</div>'
    : ((c.linkedCase && c.linkedCase.caseId && (c.linkedCase.reason==='复诊'||c.linkedCase.reason==='延续既往面诊')) ? '<div style="font-size:11px;color:var(--terracotta);margin-top:6px;">原案件的院长已停用，请重新选择院长</div>' : '<div style="font-size:11px;color:var(--muted);margin-top:6px;">确认后不能更换</div>');
  return '<div class="case-field-row" style="border-bottom:none;align-items:flex-start;"><span class="fk" style="padding-top:9px;">院长 <span style="color:var(--terracotta);">*</span></span><div style="flex-grow:1;">'+sel+hint+'</div></div>';
}

function setNeedsConsult(val){
  var c=getCurrentCase(); if(!c) return;
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

/* 沿用之前报告：面诊资料tab显示旧报告（只读，标注"沿用自 A000xxx"）；项目列表按旧报告的方案预填（价格按现在的项目库重新取）；
   之后流程（付款→施术预约…）同普通面诊案件；旧案件（如仅出报告）保持终态不变，只在它的关联案件tab里出现反向记录 */
function applyReuseReport(c){
  var src = reportSrcOf(c); if(!src) return;
  c.needsConsult = true;
  c.consultRequested = true;
  c.director = src.director || c.director; /* 沿用原报告：院长沿用原案件的 */
  c.reportReady = true;
  c.consultStatus = 'report_ready';
  c.videoSummary = src.videoSummary || '';
  c.reportUploadedBy = src.reportUploadedBy || '';
  c.reuseReport = {fromId:src.id, caseNo:src.caseNo, date:reportDateOf(src)};
  /* 旧报告的方案：旧案件的赴韩项目名（不含已更换的原项目）；没有就取它的可选范围；价格按现在的项目库重新取 */
  var names = [];
  krAllItems(src).forEach(function(it){ if(!it.swapped && names.indexOf(it.name)<0) names.push(it.name); });
  if(!names.length && src.krScope) src.krScope.items.forEach(function(it){ if(names.indexOf(it.name)<0) names.push(it.name); });
  var scopeNames = names.slice();
  if(src.krScope) src.krScope.items.forEach(function(it){ if(scopeNames.indexOf(it.name)<0) scopeNames.push(it.name); });
  var lib = function(n){ return PROJECT_LIBRARY.filter(function(p){ return p.name===n && p.active && p.origin==='KR'; })[0]; };
  c.krScope = {items: scopeNames.map(function(n){ var p = lib(n); return p ? {name:p.name, price:p.price, note:''} : null; }).filter(Boolean), overallNote:'沿用自 '+src.caseNo+' 的方案（价格按现在的项目库）', updatedAt:nowFullDt()};
  c.recommended = names.map(function(n){ var p = lib(n); return p ? {projectId:p.id, name:p.name, price:p.price, currency:currencyOf(p.origin), origin:p.origin, categoryId:p.categoryId} : null; }).filter(Boolean);
  c.projectsEnabled = true;
  c.projectOriginFilter = 'KR';
  c.activeCaseTab = 'projects';
  logCaseEvent(c, actingName(), (c.reuseAfterConsult ? '面诊后院长判断无变动，沿用原报告（' : '沿用原报告（')+src.caseNo+'）：'+(c.reuseAfterConsult ? '' : '不产生面诊费，')+'直接进入项目确认中，不经过等待报告；项目列表按原方案预填 '+c.recommended.length+' 项（价格按现在的项目库）');
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
  if(t==='projects' && !showProjectsTab(c)) c.activeCaseTab = showLocalTab(c) ? 'localmgmt' : 'basic';
  else if(t==='localmgmt' && !showLocalTab(c)) c.activeCaseTab = showProjectsTab(c) ? 'projects' : 'basic';
  else if(t==='related' && !showRelatedTab(c)) c.activeCaseTab = 'basic';
}

function caseTabsHtml(c){
  normalizeCaseTab(c);
  var tabs = '<span class="tab'+(c.activeCaseTab==='basic'?' active':'')+'" onclick="switchCaseTab(\'basic\')">基础资料</span>';
  if(c.consultRequested){
    tabs += '<span class="tab'+(c.activeCaseTab==='consult'?' active':'')+'" onclick="switchCaseTab(\'consult\')">面诊资料</span>';
  }
  if(showProjectsTab(c)){
    tabs += '<span class="tab'+(c.activeCaseTab==='projects'?' active':'')+'" onclick="switchCaseTab(\'projects\')">项目列表</span>';
  }
  var hasKRItems = c.settlementDone && krAllItems(c).length>0;
  if(hasKRItems){
    tabs += '<span class="tab'+(c.activeCaseTab==='kr'?' active':'')+'" onclick="switchCaseTab(\'kr\')">赴韩施术</span>';
  }
  if(showLocalTab(c)){
    tabs += '<span class="tab'+(c.activeCaseTab==='localmgmt'?' active':'')+'" onclick="switchCaseTab(\'localmgmt\')">本地管理</span>';
  }
  if(showRelatedTab(c)){
    tabs += '<span class="tab'+(c.activeCaseTab==='related'?' active':'')+'" onclick="switchCaseTab(\'related\')">关联案件</span>';
  }
  if(c.materialsConfirmed){
    tabs += '<span class="tab'+(c.activeCaseTab==='attachments'?' active':'')+'" onclick="switchCaseTab(\'attachments\')">附件</span>';
  }
  return '<div class="tabs" style="margin-bottom:4px;">'+tabs+'</div>';
}

/* ---- 附件 tab（§7，2026-09-30）：生成 Case ID 之后出现；基础资料里的 메타뷰/照片/视频、关联案件带出的报告、手动上传、面诊阶段产生的文件统一放这里 ---- */
function attDate(){ return nowFullDt().split(' ')[0].slice(2); }
 /* YY-MM-DD */
function caseBaseDate(c){
  var d = c.materialsDate || ((c.logEntries && c.logEntries[0]) ? c.logEntries[0].dt.split(' ')[0] : nowFullDt().split(' ')[0]);
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

function caseTabContentHtml(c){
  if(c.activeCaseTab==='consult' && c.consultRequested) return consultIntentionCardHtml(c)+consultTabHtml(c);
  normalizeCaseTab(c);
  if(c.activeCaseTab==='projects' && showProjectsTab(c)) return projectListTabHtml(c, false);
  if(c.activeCaseTab==='kr' && c.settlementDone && krAllItems(c).length>0) return krProcedureTabHtml(c);
  if(c.activeCaseTab==='localmgmt' && (isLocalCase(c) || localCarried(c))) return projectListTabHtml(c, true); /* 本地案件：选择项目→本地管理的完整流程（07） */
  if(c.activeCaseTab==='localmgmt' && c.localMgmt) return localMgmtTabHtml(c);
  if(c.activeCaseTab==='related' && showRelatedTab(c)) return relatedTabHtml(c);
  if(c.activeCaseTab==='attachments' && c.materialsConfirmed) return attachmentsTabHtml(c);
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
  var consultLabel = c.reuseReport ? '沿用之前报告（'+c.reuseReport.caseNo+'）' : (c.needsConsult===true ? '面诊' : '不需要面诊');
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
  c.activeCaseTab = 'consult';
  var lk0 = directorLockInfo(c); if(lk0) c.director = lk0.name; /* 关联复诊/延续既往面诊：锁定原院长；否则缴费前在面诊费卡里选院长 */
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

function consultFeeCardHtml(status, extraText, actionsHtml){
  var col = CONSULT_FEE_COLORS[status];
  return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border2);">'+
    '<span style="font-size:13px;font-weight:700;">面诊费</span><span style="font-size:12px;color:var(--slate2);">'+fmtRp(CLINIC_SETTINGS.consultFee)+'</span><span class="status-pill" style="background:'+col[0]+';color:'+col[1]+';">'+status+'</span>'+
    (extraText ? '<span style="font-size:11px;color:var(--muted);">'+extraText+'</span>' : '')+
    (actionsHtml ? '<span style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;">'+actionsHtml+'</span>' : '')+'</div>';
}

/* 等待报告的小状态（2026-10-02 面诊改版）：KR确认预计出报告时间后 ✓"预计 X 出报告"+倒计时（Success）；
   超过预计时间还没出报告 → 橘色"已超过预计时间"（Warning），只提醒，状态不变 */
function reportEtaParse(str){ if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(str||'')) return null; var d = new Date(str.replace(' ','T')+':00'); return isNaN(d.getTime()) ? null : d; }

function nowDateObj(){ return new Date(nowFullDt().replace(' ','T')+':00'); }

function reportOverdueNow(c){
  var e = reportEtaParse(c.reportEta);
  return !!c.reportOverdue || (!!e && e < nowDateObj());
}

function reportRemainingText(c){
  var e = reportEtaParse(c.reportEta); if(!e) return '';
  var mins = Math.max(0, Math.round((e - nowDateObj())/60000));
  var days = Math.floor(mins/1440), hrs = Math.floor((mins%1440)/60), m = mins%60;
  return '剩余 '+(days ? days+'天'+hrs+'小时' : (hrs ? hrs+'小时'+m+'分钟' : m+'分钟'));
}

function reportWaitSubItems(c){
  if(reportOverdueNow(c)) return [{kind:'Warning', text:'已超过预计时间（预计 '+(c.reportEta||'—')+' 出报告，报告还没提交）'}];
  return [{kind:'Success', text:'预计 '+(c.reportEta||'—')+' 出报告（'+reportRemainingText(c)+'）'}];
}

function consultSubItems(c){
  var items = [];
  if(c.consultStatus==='awaiting_payment') items.push({kind:'Waiting', text:'待缴费'});
  else if(c.consultStatus==='paid_waiting_kr') items.push({kind:'Waiting', text:'待确认报告时间'});
  else if(c.consultStatus==='awaiting_report') items = items.concat(reportWaitSubItems(c));
  else if(c.consultStatus==='report_ready') items.push({kind:'Success', text:'报告已出'});
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
  if(c.director) return '';
  return '<div style="margin-bottom:12px;padding:10px 12px;background:var(--terracotta-bg);border-radius:10px;font-size:13px;">院长 <span style="color:var(--terracotta);">*</span> '+
    '<select onchange="setConsultDirector(this.value)" style="margin-left:8px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"><option value="">请选择院长</option>'+
    DIRECTOR_LIST.map(function(x){ return '<option>'+x+'</option>'; }).join('')+'</select><span style="font-size:11px;color:var(--muted);margin-left:8px;">缴费前必选，选定后不能更换</span></div>';
}

function consultFeeFormHtml(c){
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
  return consultDirectorPickHtml(c)+'<div style="margin-bottom:12px;">'+
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
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;"><span class="status-pill" style="background:var(--blue-bg);color:var(--blue);">沿用自 '+r.caseNo+'</span><span style="font-size:11px;color:var(--muted);">只读 · 原报告日期 '+r.date+(c.reuseAfterConsult ? ' · 面诊后院长判断无变动' : ' · 没有面诊费')+'</span></div>'+(c.reuseAfterConsult ? consultFeeCardHtml(consultFeeStatusMain(c), c.consultFeeWaived ? '原因：'+c.consultFeeWaived.reason : '', '') : '')+
    subStatusRowHtml([{kind:'Success', text:'沿用原报告'}])+
    '<div style="font-size:13px;color:var(--slate2);margin-bottom:14px;line-height:1.7;">'+(c.videoSummary||'（旧报告没有摘要）')+'</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="btn-primary" onclick="openReportModal()">查看报告 →</button>'+
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
    return wrap(consultFeeCardHtml(fee, '', '')+consultFeeFormHtml(c)+sub);
  }
  if(c.consultStatus==='cancelled'){
    /* 2026-10-02：面诊取消（只在待缴费时）→ 面诊费已取消 → 主状态"选择项目"，本地管理tab已自动打开；这里只留记录 */
    return wrap(consultFeeCardHtml(fee, '只作记录，不影响后续；面诊费由当地自行处理', '')+
      '<div style="font-size:13px;color:var(--slate2);">面诊已取消，案件已进入"选择项目"，请在「本地管理」tab 继续。</div>');
  }
  var feeCard = consultFeeCardHtml(fee, waiverText, '');
  if(c.consultStatus==='paid_waiting_kr'){
    return wrap(feeCard+sub+
      '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;">等待韩国室长确认预计出报告时间（院长看资料后口述，由 KR 室长整理并提交报告；院长不参与视频）</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+
      '<button class="btn-outline" onclick="openFloatingChat(\'main\')">查看 Main 对话 →</button>'+
      '<button class="btn-ghost" onclick="simulateKrConfirmReportEta()">演示：模拟KR确认预计出报告时间</button>'+
      '</div>');
  }
  if(c.consultStatus==='awaiting_report'){
    var judging = isContinuationConsult(c);
    var tip = judging
      ? '延续既往面诊：院长判断相对原报告有无变动（无变动→沿用原报告→项目确认中；有变动→由KR室长提交新报告）'
      : '等待 KR 室长整理并提交报告';
    var btns = '<button class="btn-outline" style="opacity:.5;cursor:not-allowed;" disabled>查看报告 →</button>'+
      (judging
        ? '<button class="btn-ghost" onclick="simulateDirectorJudge(false)">演示：模拟院长判断：无变动</button><button class="btn-ghost" onclick="simulateDirectorJudge(true)">演示：模拟院长判断：有变动</button>'
        : '<button class="btn-ghost" onclick="markReportUploaded()">演示：模拟KR室长提交报告</button>')+
      '<button class="btn-ghost" onclick="simulateReportTimeout()">演示：模拟时间超过预计</button>';
    return wrap(feeCard+sub+
      '<div style="font-size:13px;color:var(--slate2);margin-bottom:14px;">'+tip+(c.contJudged ? '（院长已判断：有变动）' : '')+'</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+btns+'</div>');
  }
  if(c.consultStatus==='report_ready'){
    return wrap(feeCard+sub+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="btn-primary" onclick="openReportModal()">查看报告 →</button><button class="btn-outline" onclick="consultTalkShortcut()">邀请室长商谈</button></div>'+
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
function setInItemField(projectId, field, val){
  var c = getCurrentCase(); if(!c) return;
  var it = (c.recommended||[]).filter(function(x){ return x.projectId===projectId; })[0];
  if(!it) return;
  if(field==='qty') it.qty = Math.max(1, parseInt(val,10)||1);
  else if(field==='discountPct') it.discountPct = Math.min(100, Math.max(1, parseInt(val,10)||100));
  else it.itemNote = val;
  renderCaseBody(c);
}

function inLineTotal(it){
  var qty = it.qty||1, pct = (it.discountPct===undefined||it.discountPct===null) ? 100 : it.discountPct;
  return Math.round(it.price*qty*pct/100);
}

/* ---- 结算单（Settlement，总览第5节）：待付款 / 已付款 / 部分退款 / 全额退款；多张按时间排序，新的在上面，全部显示 ---- */
function batchStatusLabel(c, b){
  if(b.status==='unpaid') return '待付款';
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
  /* 面诊案件只买本地项目后，本地流程（是否使用/本地管理）在"本地管理"tab里进行，这里只看结算单 */
  if(!inLocalTab && isLocalCase(c) && c.reportReady){
    return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:14px;">结算单</div>'+
      '<div style="font-size:12px;color:var(--muted);margin-bottom:12px;">本地项目已转客户持有；使用/本地管理请在「本地管理」tab 进行</div>'+
      settlementCardsHtml(c)+'</div>';
  }
  /* 纯本地案件结算后必须先过一遍"持有项目使用/本次不使用"，这一步优先于"已选择/结算"只读视图；
     案件一旦结束（finishCase 会把 entryChoicePending 复位）之后再看这个tab才落回只读的结算视图 */
  if(c.localAsk) return localAskHtml(c);
  if(c.mgmtActive) return mgmtActiveHtml(c, 'main')+(c.addUse ? '<div style="margin-top:12px;">'+holdingsUseHtml(c,'main')+'</div>' : '')+(c.addingMore ? '<div style="margin-top:12px;" class="card"><div style="padding:18px 24px;">'+projectPickerHtml(c, true)+'</div></div>' : '')+(krAllItems(c).length||(c.settlementBatches||[]).length ? '<div style="margin-top:12px;">'+settlementCardsHtml(c)+'</div>' : '');
  if(c.entryChoicePending && c.projectEntryMode==='holdings') return holdingsUseTabHtml(c);
  if(c.entryChoicePending && !c.projectEntryMode && !c.projectsLocked) return localEntryChoiceHtml(c);
  if(c.projectsLocked){
    var addPicker = c.addingMore ? projectPickerHtml(c, true) : '<button class="btn-outline" style="width:100%;margin-top:14px;" onclick="addMoreProjects()">+ 追加项目</button>';
    return '<div class="card" style="padding:22px 24px;">'+
      '<div class="info-heading" style="margin-bottom:14px;">已选择 / 结算</div>'+
      subStatusRowHtml(caseSubStatusItems(c))+
      noteFieldHtml('整体备注（KR + IN 可见）','noteOverall',c.noteOverall)+
      '<div style="margin-top:12px;">'+settlementCardsHtml(c)+'</div>'+
      addPicker+
      '</div>';
  }
  if(c.entryChoicePending){
    if(c.projectEntryMode==='new') return projectPickerHtml(c, false);
    return localEntryChoiceHtml(c);
  }
  return projectPickerHtml(c, false);
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

function holdingsUseHtml(c, scope){
  var holdings = clientHoldingsSorted(c.name);
  var rows = holdings.map(function(h,i){
    var remaining = holdingRemaining(h);
    var tags = (h.category==='术后管理'?' <span class="status-pill" style="background:var(--terracotta-bg);color:var(--terracotta);font-size:10px;">术后管理</span>':'')+
      (h.krCollected?' <span class="status-pill" style="background:var(--sage-bg);color:var(--sage);font-size:10px;">KR代收</span>':'');
    return '<div class="case-field-row"><input type="checkbox" id="hold-check-'+scope+'-'+i+'" style="flex-grow:0;margin-right:10px;">'+
      '<span style="flex-grow:1;font-size:13px;">'+h.itemName+tags+(holdingSchedule(h)?' <span style="font-size:11px;color:var(--terracotta);">进行时间：'+holdingSchedule(h)+'</span>':'')+'</span>'+
      '<span style="font-size:12px;color:var(--slate2);margin-right:10px;">剩余 '+remaining+' 次</span>'+
      '<input type="number" min="1" max="'+remaining+'" value="1" id="hold-qty-'+scope+'-'+i+'" style="width:60px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:12px;">'+
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

function holdingsUseTabHtml(c){ return holdingsUseHtml(c,'main'); }

/* 本次不使用：已经发生过购买 → 结案；还没购买 → 问"是否选购"（进入新增项目）。本地管理里的走法见 lmNotUse */
function notUseThisTime(scope){
  var c = getCurrentCase(); if(!c) return;
  var ctx0 = ctxOf(c, scope);
  if(ctx0 && ctx0.mgmtActive){ ctx0.addUse = false; renderCaseBody(c); return; } /* 本地管理进行中：只是不再追加使用 */
  if(scope==='lm') return lmNotUse(c);
  logCaseEvent(c, actingName(), '本次不使用任何持有项目');
  if(caseHasPurchase(c)){ finishCase(c); return; }
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
    var cb = st==='进行中' ? '<input type="checkbox" class="mgmt-cb-'+scope+'" value="'+i+'" style="margin-right:8px;">' : '';
    return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;'+(st==='已取消'?'text-decoration:line-through;color:var(--muted);':'')+'">'+cb+u.itemName+'</span>'+
      '<span style="font-size:12px;color:var(--slate2);margin-right:10px;">使用 '+u.qty+' 次</span>'+
      '<span class="status-pill" style="background:'+col[0]+';color:'+col[1]+';">'+st+'</span></div>';
  }).join('');
  var btns = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">'+
    '<button class="btn-outline" onclick="markMgmtRows(\''+scope+'\',\'done\',false)">标记所选完成</button>'+
    '<button class="btn-outline" onclick="markMgmtRows(\''+scope+'\',\'cancelled\',false)">标记所选取消</button>'+
    '<button class="btn-primary" style="margin-left:auto;" onclick="mgmtComplete(\''+scope+'\')">管理完成</button>'+
    '<button class="btn-outline" onclick="startMgmtCancel(\''+scope+'\')">管理取消</button></div>'+
    '<div style="font-size:11px;color:var(--muted);margin-top:8px;">勾选后可逐个标完成或取消；「管理完成 / 管理取消」是对全部进行中项目的批量快捷键。取消的次数归还到客户持有项目，<b>不是退款</b>。</div>'+
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

function lmNotUse(c){
  var lm = c.localMgmt; if(!lm) return;
  logCaseEvent(c, actingName(), '本地管理：本次不使用任何持有项目');
  if(lm.batches.length){ afterLmFinished(c); return; } /* 已经购买过 → 本地管理结束 */
  lm.step = 'buy'; /* 还没购买 → 是否选购 */
  buildCaseLog(c); renderCaseBody(c);
}

function lmSetStep(step){ var c=getCurrentCase(); if(!c||!c.localMgmt) return; c.localMgmt.step = step; renderCaseBody(c); }

function localMgmtTabHtml(c){
  var lm = c.localMgmt;
  if(lm.ended){
    var uses = (lm.mgmtUses||[]).map(function(u){ return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+u.itemName+'</span><span style="font-size:12px;color:var(--slate2);">使用 '+u.qty+' 次'+(u.cancelQty?'（取消 '+u.cancelQty+' 次，已归还持有）':'')+'</span></div>'; }).join('');
    var buys = (lm.batches||[]).map(function(b){ return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">购买 '+b.items.map(function(i){ return i.name+' ×'+i.qty; }).join('、')+'</span><span style="font-size:13px;font-weight:700;">'+formatCurrency(b.inTotal,'IDR')+'</span></div>'; }).join('');
    return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:12px;">本地管理（已结束）</div>'+(buys+uses || '<div style="font-size:12px;color:var(--muted);">本次本地管理没有购买也没有使用</div>')+'</div>';
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

/* 本地管理里的选购：简化版（勾选项目+个数，结算付款后直接转客户持有；不支持折扣/备注，也不走主结算单，避免影响赴韩部分的待付款状态） */
function lmBuyHtml(c){
  var lm = c.localMgmt;
  var list = PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN' && p.active && p.categoryId!==POST_CARE_CAT_ID; });
  var total = 0;
  var rows = list.map(function(p){
    var pk = lm.pick[p.id] || {qty:0, pct:100, note:''};
    var line = Math.round(p.price*pk.qty*pk.pct/100);
    total += line;
    var inputs = pk.qty>0
      ? ' × <input type="number" min="1" max="100" value="'+pk.pct+'" onchange="lmPickField(\''+p.id+'\',\'pct\',this.value)" style="width:48px;padding:3px 4px;border:1px solid var(--border);border-radius:5px;font-size:12px;text-align:center;">% ＝ <b>'+formatCurrency(line,'IDR')+'</b>'
      : '';
    var noteRow = pk.qty>0 ? '<div class="case-field-row" style="border-top:none;padding-top:0;padding-bottom:10px;"><input type="text" placeholder="备注（选填）" value="'+(pk.note||'').replace(/"/g,'&quot;')+'" onchange="lmPickField(\''+p.id+'\',\'note\',this.value)" style="width:100%;padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:11px;"></div>' : '';
    return '<div class="case-field-row" style="flex-wrap:wrap;gap:6px;"><span style="flex-grow:1;font-size:13px;">'+p.name+'</span><span style="font-size:12px;color:var(--slate2);">'+formatCurrency(p.price,'IDR')+'</span>'+
      '<span style="font-size:12px;display:flex;align-items:center;gap:4px;"><input type="number" min="0" value="'+pk.qty+'" onchange="lmPickField(\''+p.id+'\',\'qty\',this.value)" style="width:46px;padding:3px 4px;border:1px solid var(--border);border-radius:5px;font-size:12px;text-align:center;"> 次'+inputs+'</span></div>'+noteRow;
  }).join('');
  return '<div class="card" style="padding:22px 24px;"><div class="info-heading" style="margin-bottom:14px;">本地管理：新增项目</div>'+rows+
    '<div style="text-align:right;font-size:13px;font-weight:700;margin:12px 0;">合计 '+formatCurrency(total,'IDR')+'</div>'+
    '<div style="display:flex;gap:10px;">'+(total>0?'<button class="btn-primary" style="flex:1;" onclick="lmSettle()">结算付款</button>':'')+
    '<button class="btn-outline" style="flex:1;" onclick="lmNoBuy()">本次不购买</button></div></div>';
}

function lmPickField(id, field, v){
  var c = getCurrentCase(); if(!c||!c.localMgmt) return;
  var pk = c.localMgmt.pick[id] || {qty:0, pct:100, note:''};
  if(field==='qty') pk.qty = Math.max(0, parseInt(v,10)||0);
  else if(field==='pct') pk.pct = Math.min(100, Math.max(1, parseInt(v,10)||100));
  else pk.note = v;
  c.localMgmt.pick[id] = pk;
  renderCaseBody(c);
}

function lmNoBuy(){
  var c = getCurrentCase(); if(!c||!c.localMgmt) return;
  if(c.localMgmt.mgmtActive){ c.localMgmt.addBuy = false; renderCaseBody(c); return; } /* 本地管理进行中：只收起选购 */
  logCaseEvent(c, actingName(), '本地管理：本次不购买项目');
  afterLmFinished(c);
}

function lmSettle(){
  var c = getCurrentCase(); if(!c||!c.localMgmt) return;
  var lm = c.localMgmt, items = [], total = 0, today = nowFullDt().split(' ')[0];
  PROJECT_LIBRARY.forEach(function(p){
    var pk = lm.pick[p.id]; if(!pk || pk.qty<=0) return;
    var line = Math.round(p.price*pk.qty*pk.pct/100);
    items.push({name:p.name, qty:pk.qty, price:p.price, discountPct:pk.pct, itemNote:pk.note||'', lineTotal:line}); total += line;
    grantHolding(c.name, p.name, '本地', c.id, today, pk.qty, false);
  });
  if(!items.length) return;
  lm.batches.push({id:'L'+(lm.batches.length+1), items:items, inTotal:total, time:nowFullDt()});
  lm.pick = {};
  if(lm.mgmtActive){ lm.addBuy = false; lm.addUse = true; } /* 本地管理进行中追加购买：付款后问是否继续使用 */
  else lm.step = 'afterBuyUse'; /* 结算后：是否使用？ */
  logCaseEvent(c, actingName(), '本地管理：结算付款 '+formatCurrency(total,'IDR')+'（'+items.map(function(i){ return i.name+' ×'+i.qty+(i.discountPct<100?'（'+i.discountPct+'折）':''); }).join('、')+'），已转客户持有');
  updateCaseStage(c); buildCaseLog(c); renderCaseBody(c);
}

/* 项目确认中（2026-09-29 重写）：确认后不管有没有赴韩项目，都直接生成结算单进入"待付款"；
   施术日期改到付款之后才走（见 krProcedureTabHtml），不再是结算前的门槛 */
function confirmProjectSelection(){
  var c = getCurrentCase(); if(!c || !(c.recommended||[]).length) return;
  logCaseEvent(c, actingName(), '确认所选管理项目：'+c.recommended.map(function(it){ return it.name; }).join('、'));
  generateSettlementBatch(c);
  updateCaseStage(c);
  renderCaseStatusBar(c);
  buildCaseLog(c);
  renderCaseBody(c);
}

/* 生成结算单：把 c.recommended 的快照搬进 procedureItems + 新开一个 settlementBatches 记录，
   projectsLocked=true 代表"结算单已生成"，等真正标记付款（settleProjects→confirmSettlementPayment）才变"已付款" */
function generateSettlementBatch(c){
  var batchId = 'B' + ((c.settlementBatches||[]).length + 1);
  var b = computeBatchBreakdown(c.recommended);
  var newItems = c.recommended.map(function(it){ return Object.assign({}, it, {done:false, batchId:batchId}); });
  c.settlementBatches = c.settlementBatches || [];
  c.settlementBatches.push({id:batchId, afterReport:!!c.reportReady, orderedBy:actingName(), settledBy:'客人', time:nowFullDt(), status:'unpaid',
    krTotal:b.krTotal, krDeposit:b.krDeposit, krBalance:b.krBalance, inTotal:b.inTotal});
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

function projectPickerHtml(c, isAddition){
  var selected = c.recommended || [];
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
      leftRows = '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">需先完成面诊，由韩国室长给出可选项目</div>'+addConsultBtn;
    } else {
      var scopeNote = scope.overallNote ? '<div style="font-size:12px;color:var(--slate2);background:var(--terracotta-bg);border-radius:8px;padding:10px 12px;margin-bottom:12px;">KR室长整体备注：'+scope.overallNote+'</div>' : '';
      var catalog = scope.items.map(function(si){
        var p = PROJECT_LIBRARY.filter(function(x){ return x.name===si.name; })[0];
        return p ? Object.assign({}, p, {krNote:si.note}) : null;
      }).filter(function(p){ return p && p.origin==='KR'; }); /* 赴韩tab只取krScope里origin=KR的，术后管理(IN)另在本地tab处理 */
      if(q) catalog = catalog.filter(function(p){ return p.name.toLowerCase().indexOf(q)>-1; });
      leftRows = scopeNote + (catalog.map(function(p){
        var checked = selected.some(function(it){ return it.projectId===p.id; });
        var noteHtml = p.krNote ? '<div style="font-size:11px;color:var(--muted);margin-top:2px;">'+p.krNote+'</div>' : '';
        return '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border2);font-size:13px;cursor:pointer;">'+
          '<input type="checkbox" onchange="toggleProject(\''+p.id+'\')" '+(checked?'checked':'')+' style="margin-top:2px;">'+
          '<span style="flex-grow:1;">'+p.name+projCasesLinkHtml(p.id)+noteHtml+'</span><span style="color:var(--slate2);">'+displayAmount(p.price, p.origin, pickerCcy)+'</span></label>';
      }).join('') || '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">没有匹配的项目</div>');
    }
    leftRows += '<button class="btn-ghost" style="margin-top:10px;font-size:11px;" onclick="simulateKrScopeUpdate()">演示：模拟KR室长更新可选项目</button>';
  } else {
    /* 本地项目分两块（2026-09-29 第十轮）：普通本地项目不受限，术后管理项目同样只能从krScope里选 */
    function inRow(p){
      var checked = selected.some(function(it){ return it.projectId===p.id; });
      var held = clientHeldRemaining(c.name, p.name);
      var heldTag = held>0 ? ' <span style="font-size:11px;color:var(--sage);">持有 '+held+' 次</span>' : '';
      return '<label style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border2);font-size:13px;cursor:pointer;">'+
        '<input type="checkbox" onchange="toggleProject(\''+p.id+'\')" '+(checked?'checked':'')+'>'+
        '<span style="flex-grow:1;">'+p.name+heldTag+projCasesLinkHtml(p.id)+'</span><span style="color:var(--slate2);">'+displayAmount(p.price, p.origin, pickerCcy)+'</span></label>';
    }
    var normalCatalog = PROJECT_LIBRARY.filter(function(p){ return p.origin==='IN' && p.active && p.categoryId!==POST_CARE_CAT_ID; });
    if(q) normalCatalog = normalCatalog.filter(function(p){ return p.name.toLowerCase().indexOf(q)>-1; });
    var scope2 = c.krScope;
    var postCareCatalog = (scope2 ? scope2.items.map(function(si){
      var p = PROJECT_LIBRARY.filter(function(x){ return x.name===si.name; })[0];
      return p ? Object.assign({}, p, {krNote:si.note}) : null;
    }).filter(function(p){ return p && p.origin==='IN' && p.categoryId===POST_CARE_CAT_ID; }) : []);
    if(q) postCareCatalog = postCareCatalog.filter(function(p){ return p.name.toLowerCase().indexOf(q)>-1; });
    var postCareBlock = '<div style="font-size:11px;font-weight:700;color:var(--terracotta);margin-bottom:4px;">术后管理（需先出报告，仅限KR室长给出的范围）</div>'+
      (postCareCatalog.length
        ? postCareCatalog.map(function(p){ var noteHtml = p.krNote ? '<div style="font-size:11px;color:var(--muted);margin-top:2px;">'+p.krNote+'</div>' : ''; return inRow(p)+(noteHtml?'<div style="margin:-6px 0 6px 30px;">'+noteHtml+'</div>':''); }).join('')
        : '<div style="font-size:12px;color:var(--muted);padding:6px 4px 14px;">暂无可选术后管理项目</div>');
    var normalBlock = '<div style="font-size:11px;font-weight:700;color:var(--sage);margin:14px 0 4px;">其他本地项目</div>'+
      (normalCatalog.map(inRow).join('') || '<div style="font-size:12px;color:var(--muted);padding:14px 4px;">没有匹配的项目</div>');
    leftRows = postCareBlock + normalBlock;
  }
  var expandBtn = '<span style="cursor:pointer;font-size:12px;color:var(--slate);" onclick="toggleProjectsExpand()">'+(c.projectsExpanded?'⮡ 收起':'⮢ 展开满屏')+'</span>';
  var subTabs = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px;">'+
    '<span class="chip'+(originFilter==='IN'?' active':'')+'" onclick="setProjectOrigin(\'IN\')">本地项目</span>'+
    '<span class="chip'+(originFilter==='KR'?' active':'')+'" onclick="setProjectOrigin(\'KR\')">赴韩项目</span>'+
    caseCcySwitchHtml(originFilter)+
    '<a href="#" class="info-link" style="font-size:12px;" onclick="openProjectLibNewTab();return false;">在项目库查看 ↗</a>'+
    '</div>';
  var settleBtn = selected.length ? '<button class="btn-primary" style="width:100%;margin-top:14px;" onclick="'+(isAddition?'confirmAddition()">结算追加项目 / 交定金':'confirmProjectSelection()">结算')+'</button>' : '';
  var noBuyBtn = (!isAddition && c.entryChoicePending && c.projectEntryMode==='new') ? '<button class="btn-outline" style="width:100%;margin-top:10px;" onclick="noPurchaseThisTime()">本次不购买</button>' : '';
  var noProjectBtn = (!isAddition && c.reportReady && !c.entryChoicePending && !c.settlementDone) ? '<button class="btn-outline" style="width:100%;margin-top:10px;" onclick="noProjectForClient()">客人不做项目</button>' : '';
  var wrapOpen = isAddition
    ? '<div class="project-card'+(c.projectsExpanded?' expanded':'')+'" style="border-top:1px dashed var(--border);padding-top:18px;margin-top:4px;">'
    : '<div class="card project-card'+(c.projectsExpanded?' expanded':'')+'" style="padding:22px 24px;">';
  return wrapOpen+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><div class="info-heading">'+(isAddition?'追加项目':'推荐管理项目')+'</div>'+expandBtn+(isAddition?'<span style="cursor:pointer;font-size:12px;color:var(--slate);margin-left:10px;" onclick="cancelAddMore()">取消追加</span>':'')+'</div>'+
    '<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:24px;">'+
    '<div>'+subTabs+
    '<input type="text" placeholder="搜索项目…" value="'+(c.projectSearch||'')+'" oninput="setProjectSearch(this.value)" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-bottom:10px;">'+
    leftRows+'</div>'+
    '<div style="border-left:1px solid var(--border2);padding-left:24px;"><div style="font-size:12px;font-weight:700;color:var(--slate2);margin-bottom:8px;">已选择</div>'+settlementBigCardHtml(c, selected, true)+
    settleBtn+noBuyBtn+noProjectBtn+'</div>'+
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
  c.activeCaseTab = 'projects';
  logCaseEvent(c, actingName(), hasLocal ? '赴韩项目已全部取消并退款；案件里有本地项目/术后管理，请室长决定保留或全部退款' : '赴韩项目已全部取消并退款，询问是否增加本地项目');
  updateCaseStage(c); buildCaseLog(c); renderCaseStatusBar(c); renderCaseBody(c);
  if(hasLocal) openLocalKeepModal(c); else openLocalAskModal(c);
}

function krArrivedOpsHtml(c){
  var j = c.krJudge, btn = function(label, fn, cls){ return '<button class="'+(cls||'btn-ghost')+'" onclick="'+fn+'">'+label+'</button>'; };
  var note = function(t){ return '<div style="font-size:12px;font-weight:700;color:var(--slate2);margin-bottom:8px;">'+t+'</div>'; };
  var inner = '', info = krBalanceInfo(c);
  if(!j){
    inner = btn('演示：模拟KR判断能否施术','simulateKrJudge()','btn-primary')+btn('演示：模拟KR补加术后管理项目','simulateKrAddPostCare()')+btn('演示：模拟KR确认术后管理项目','simulateKrConfirmPostCare()');
  } else if(j.result==='ok'){
    inner = note('KR判断：能施术，项目没变动')+
      (!c.krBalancePaid ? btn('演示：模拟KR标记付清尾款（尾款 '+formatCurrency(info.diff,'KRW')+'）','simulateKrMarkBalancePaid()','btn-primary')
        : '<div style="font-size:12px;color:var(--sage);font-weight:700;margin-bottom:8px;">✓ 已付清尾款</div>'+btn('演示：模拟KR标记完成','simulateKrMarkDone()','btn-primary'));
  } else if(j.result==='changed'){
    var calc = '实际项目合计 '+formatCurrency(info.total,'KRW')+'；定金合计 '+formatCurrency(info.deposit,'KRW')+(info.preRefund>0 ? '，减去到院前已退 '+formatCurrency(info.preRefund,'KRW') : '')+' = '+formatCurrency(info.effDeposit,'KRW')+' 先抵 → '+(info.diff>0 ? '需补尾款 '+formatCurrency(info.diff,'KRW') : info.diff<0 ? '需退差额 '+formatCurrency(-info.diff,'KRW') : '刚好抵平');
    inner = note('KR判断：能施术，但项目有变动')+'<div style="font-size:12px;color:var(--slate2);margin-bottom:10px;">'+calc+'</div>'+
      (!j.settled
        ? '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+btn('演示：模拟KR标记无法施术项目','simulateKrMarkUnable()')+btn('演示：模拟韩国更换项目','simulateKrProjectSwap()')+btn('演示：结算尾款（定金先抵，多退少补）','settleKrBalance()','btn-primary')+'</div>'
        : '<div style="font-size:12px;color:var(--sage);font-weight:700;margin-bottom:8px;">✓ 尾款已结清（按实际项目重算）</div><div style="display:flex;gap:8px;flex-wrap:wrap;">'+btn('演示：KR改施术时间（可选）','krReschedule(false)')+btn('演示：模拟KR标记完成','simulateKrMarkDone()','btn-primary')+'</div>');
  } else { /* cannot */
    inner = note('KR判断：不能施术')+'<div style="display:flex;gap:8px;flex-wrap:wrap;">'+
      btn('演示：KR在韩重新预约施术时间','krReschedule(true)')+btn('演示：退定金（全部退回）','krRefundDeposit(\'all\')','btn-primary')+btn('演示：退定金（不退）','krRefundDeposit(\'none\')')+'</div>';
  }
  return '<div style="border-top:1px solid var(--border2);padding-top:14px;"><div style="font-size:11px;color:var(--muted);margin-bottom:8px;">到院后的判断、尾款、项目完成均由KR端操作，这里只显示结果（原型用演示按钮模拟）</div>'+inner+'</div>';
}

/* 不能施术 → 退定金（全部退回 / 不退，由KR判断）→ IN 按KR判断在退款弹窗里操作 → 仅出报告 */
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

function confirmSettlementPayment(){
  var c = getCurrentCase(); if(!c) return;
  var batch = (c.settlementBatches||[]).filter(function(b){ return b.id===SETTLE_MODAL_BATCH_ID; })[0]; if(!batch) return;
  batch.status = 'active';
  c.settlementDone = true; /* 一旦付过一次款就一直是 true；加项后新批次单独走 unpaid→active，不影响这个总开关 */
  var today = nowFullDt().split(' ')[0];
  var batchInItems = (c.procedureItems||[]).filter(function(it){ return it.batchId===batch.id && it.origin==='IN'; });
  batch.inItems = batchInItems.map(function(it){ return {name:it.name, qty:it.qty||1, price:it.price, discountPct:(it.discountPct===undefined?100:it.discountPct), itemNote:it.itemNote||''}; }); /* 结算单展示用快照（本地项目结算后转持有，不留在 procedureItems） */
  batchInItems.forEach(function(it){
    var cat = PROJECT_CATEGORIES[it.categoryId];
    grantHolding(c.name, it.name, (cat && cat.label==='术后管理') ? '术后管理' : '本地', c.id, today, it.qty||1, false);
  });
  /* 本地项目（含术后管理）结算后立即转客户持有，不进入案件进程（2026-09-29 第十轮） */
  c.procedureItems = (c.procedureItems||[]).filter(function(it){ return it.origin!=='IN'; });
  if(krActiveItems(c).length>0){
    c.activeCaseTab = 'kr';
    KR_SCHED_VIEW_MONTH = nearestOpenMonth(TODAY_DATE); /* 月历默认打开最近的可选月份，不停在上次浏览过的月份 */
  } else {
    /* 纯本地：结算后必须过一遍"持有项目使用/本次不使用"才能结案，即使刚买的项目也要在这一步决定用不用 */
    if(c.mgmtActive){ c.addUse = true; } /* 本地管理进行中追加购买：付款后直接问是否继续使用 */
    else {
      c.entryChoicePending = true;
      c.projectEntryMode = 'holdings';
    }
    c.activeCaseTab = isLocalCase(c) ? 'localmgmt' : 'projects'; /* 本地案件的流程在本地管理tab里 */
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
var KR_OPEN_DATES = [D(1),D(2),D(3),D(4),D(10),D(11),D(17),D(18),D(20),D(24),D(25),D(31),D(32),D(38),D(39),D(45),D(46),D(52),D(53)];

var KR_SCHED_VIEW_MONTH = new Date(TODAY_DATE.getFullYear(), TODAY_DATE.getMonth(), 1);

/* 月历默认打开的月份（2026-09-29 第十轮修复：原来是全局变量，翻页后不会在切换案件/重新进入时复位，
   导致"看起来停在别的月份"；现在每次进入日期选择/修改流程时显式重置，不再依赖上次翻页停留的位置） */
function nearestOpenMonth(fromDate){
  var sorted = KR_OPEN_DATES.slice().sort();
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
  if(KR_OPEN_DATES.indexOf(dateStr)===-1) return; /* 未开放的日期不可选 */
  var c = getCurrentCase(); if(!c) return;
  var ks = ensureKrScheduleDraft(c);
  if(ks[pf]===dateStr) ks[pf] = '';
  else if(ks[bf]===dateStr) ks[bf] = '';
  else if(!ks[pf]) ks[pf] = dateStr;
  else ks[bf] = dateStr; /* 已有首选：点击第二个日期是备选；备选已有时再点别的日期会替换备选 */
  renderCaseBody(c);
}

function krDateCalendarGridHtml(pf, bf, primaryVal, backupVal){
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
      var open = KR_OPEN_DATES.indexOf(dateStr)>-1;
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
function simulateKrScheduleConfirmNew(which){
  var c = getCurrentCase(); if(!c || !c.krSchedule || c.krSchedule.status!=='pending') return;
  var date = c.krSchedule[which]; if(!date) return;
  c.krSchedule.status = 'confirmed';
  c.krSchedule.confirmedDate = date;
  c.krSchedule.confirmedTime = '14:00';
  logCaseEvent(c, '이서연', 'Kr室长确认施术日期：'+date+' 14:00');
  pushNotif('赴韩施术','KR 确认施术时间：'+c.name+' '+date+' 14:00', {caseId:c.id});
  updateCaseStage(c);
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

function simulateKrScheduleRejectNew(){
  var c = getCurrentCase(); if(!c || !c.krSchedule || c.krSchedule.status!=='pending') return;
  c.krSchedule.status = null;
  c.krSchedule.primary = '';
  c.krSchedule.backup = '';
  KR_SCHED_VIEW_MONTH = nearestOpenMonth(TODAY_DATE);
  logCaseEvent(c, '이서연', 'Kr室长回复：两个日期都无法安排，请重新选择');
  updateCaseStage(c);
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

/* 确认后修改日期：施术前2周内置灰不可点；月历默认打开原定日期所在月份（2026-09-29 第十轮修复） */
function startKrScheduleChange(){
  var c = getCurrentCase(); if(!c || !c.krSchedule || c.krSchedule.status!=='confirmed') return;
  if(isWithin2WeeksOfToday(c.krSchedule.confirmedDate)) return;
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

function simulateKrScheduleChangeConfirm(which){
  var c = getCurrentCase(); if(!c || !c.krSchedule || c.krSchedule.status!=='change_pending') return;
  var date = c.krSchedule[which]; if(!date) return;
  c.krSchedule.status = 'confirmed';
  c.krSchedule.confirmedDate = date;
  c.krSchedule.confirmedTime = '14:00';
  c.krSchedule.changePrimary=''; c.krSchedule.changeBackup=''; c.krSchedule.changeSubmitted=false;
  logCaseEvent(c, '이서연', 'Kr室长确认新施术日期：'+date+' 14:00');
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

/* KR排不上不自动取消（2026-09-29 第十轮改正）：回到可重新选日期的状态，原确认日期继续有效，
   界面显示"时间变更待确认"（即 change_pending 状态本身）；只有IN室长手动点"无法协调"才真正取消退定金 */
function simulateKrScheduleChangeReject(){
  var c = getCurrentCase(); if(!c || !c.krSchedule || c.krSchedule.status!=='change_pending') return;
  var orig = new Date(c.krSchedule.confirmedDate);
  KR_SCHED_VIEW_MONTH = new Date(orig.getFullYear(), orig.getMonth(), 1);
  c.krSchedule.changePrimary = '';
  c.krSchedule.changeBackup = '';
  c.krSchedule.changeSubmitted = false;
  logCaseEvent(c, '이서연', 'Kr室长回复：新日期无法安排，请重新选择（原日期 '+c.krSchedule.confirmedDate+' 继续有效）');
  buildCaseLog(c);
  renderCaseBody(c);
}

/* KR端三步操作（2026-09-29 第十轮改）：已到医院/付清尾款/施术完成 都由KR端操作，IN端只显示状态，
   原型里用演示按钮模拟；施术完成即案件结案（"案件=一次赴韩行程"） */
function simulateKrMarkArrived(){
  var c = getCurrentCase(); if(!c || !c.settlementDone || isArrived(c)) return;
  if(!c.krSchedule || c.krSchedule.status!=='confirmed') return;
  c.krSchedule.status = 'arrived'; /* 已到医院 = 施术日期卡片的 Arrived 状态（单一数据源） */
  c.hasArrived = true; /* 到过医院：之后IN不能再改日期/取消项目（即使KR在韩重新预约回到"施术时间已确认"） */
  updateCaseStage(c);
  logCaseEvent(c, '김민석 원장', 'KR标记"已到医院"');
  pushNotif('赴韩施术','客人已到医院：'+c.name, {caseId:c.id});
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

function simulateKrMarkBalancePaid(){
  var c = getCurrentCase(); if(!c || !isArrived(c) || c.krBalancePaid || !c.krJudge || c.krJudge.result!=='ok') return;
  c.krBalancePaid = true;
  logCaseEvent(c, '김민석 원장', 'KR标记"付清尾款"');
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

function krProcedureTabHtml(c){
  var ks = c.krSchedule;
  var st = scheduleState(c);
  var monthLabel = KR_SCHED_VIEW_MONTH.getFullYear()+'年'+(KR_SCHED_VIEW_MONTH.getMonth()+1)+'月';
  var monthNav = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><span style="cursor:pointer;" onclick="krScheduleMonthShift(-1)">‹</span><b>'+monthLabel+'</b><span style="cursor:pointer;" onclick="krScheduleMonthShift(1)">›</span></div>';
  var hasActive = krActiveItems(c).length>0;
  var body = '';
  if(hasActive){
    /* 施术日期卡片（Schedule）：Draft / Pending / Confirmed / Changing / Arrived，案件主状态直接读这里 */
    var canModify = ks && ks.status==='confirmed' && !isWithin2WeeksOfToday(ks.confirmedDate) && !c.hasArrived;
    if(st==='Draft'){
      ks = ensureKrScheduleDraft(c);
      body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+
        '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;">只能选择KR室长已开放的日期（浅色为未开放）</div>'+
        monthNav+
        '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">第一次点击选首选，第二次点击选备选，再点一次已选日期取消选择</div>'+
        krDateCalendarGridHtml('primary','backup', ks.primary, ks.backup)+
        '<button class="btn-primary" style="width:100%;margin-top:16px;" onclick="submitKrScheduleDate()">递交施术日期</button>';
    } else if(st==='Pending'){
      body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+
        '<div style="font-size:13px;color:var(--slate2);margin-bottom:14px;">已提交首选 '+ks.primary+(ks.backup?'　备选 '+ks.backup:'')+'，等待Kr室长确认</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+
        '<button class="btn-ghost" onclick="simulateKrScheduleConfirmNew(\'primary\')">演示：模拟KR室长确认首选</button>'+
        (ks.backup?'<button class="btn-ghost" onclick="simulateKrScheduleConfirmNew(\'backup\')">演示：模拟KR室长确认备选</button>':'')+
        '<button class="btn-ghost" onclick="simulateKrScheduleRejectNew()">演示：模拟KR室长无法安排</button>'+
        '</div>';
    } else if(st==='Confirmed'){
      body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+
        '<div class="card" style="padding:14px 16px;margin-bottom:14px;">施术日期 '+ks.confirmedDate+' '+ks.confirmedTime+'，请转告客人</div>'+
        (c.hasArrived
          ? '<div style="font-size:12px;color:var(--terracotta);margin-bottom:12px;">KR 已在韩国重新预约施术时间；到过医院之后 IN 端不能再修改日期或取消项目，客人再到医院时由 KR 重新标记"已到医院"</div>'
          : '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">'+
            (canModify ? '<button class="btn-outline" onclick="startKrScheduleChange()">修改日期</button>' : '<button class="btn-outline" style="opacity:.5;cursor:not-allowed;" disabled>修改日期</button>')+
            '<button class="btn-outline" onclick="requestCannotCoordinate()">无法协调</button>'+
            '</div>'+
            (!canModify ? '<div style="font-size:11px;color:var(--terracotta);margin-bottom:10px;">施术前2周内不可修改日期</div>' : ''))+
        '<div style="border-top:1px solid var(--border2);padding-top:14px;"><div style="font-size:11px;color:var(--muted);margin-bottom:8px;">已到医院 / 付清尾款 / 项目完成 均由KR端操作，这里只显示状态（原型用演示按钮模拟）</div>'+
        '<button class="btn-ghost" onclick="simulateKrMarkArrived()">演示：模拟KR标记已到医院</button></div>';
    } else if(st==='Changing'){
      if(!ks.changeSubmitted){
        body = '<div class="info-heading" style="margin-bottom:8px;">修改施术日期</div>'+
          '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;">原定 '+ks.confirmedDate+' '+ks.confirmedTime+'，请选择新的日期</div>'+
          monthNav+
          '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">第一次点击选新首选，第二次点击选新备选，再点一次已选日期取消选择</div>'+
          krDateCalendarGridHtml('changePrimary','changeBackup', ks.changePrimary, ks.changeBackup)+
          '<div style="display:flex;gap:10px;margin-top:16px;">'+
          '<button class="btn-primary" style="flex-grow:1;" onclick="submitKrScheduleChangeDate()">提交新日期</button>'+
          '<button class="btn-outline" onclick="cancelKrScheduleChange()">取消修改</button>'+
          '</div>';
      } else {
        body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+
          '<div style="font-size:13px;color:var(--slate2);margin-bottom:14px;">原定 '+ks.confirmedDate+' '+ks.confirmedTime+'，已提交新首选 '+ks.changePrimary+(ks.changeBackup?'　新备选 '+ks.changeBackup:'')+'，等待Kr室长确认（原日期继续有效）</div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">'+
          '<button class="btn-ghost" onclick="simulateKrScheduleChangeConfirm(\'changePrimary\')">演示：模拟KR确认新首选</button>'+
          (ks.changeBackup?'<button class="btn-ghost" onclick="simulateKrScheduleChangeConfirm(\'changeBackup\')">演示：模拟KR确认新备选</button>':'')+
          '<button class="btn-ghost" onclick="simulateKrScheduleChangeReject()">演示：模拟KR无法确认</button>'+
          '</div>'+
          '<div style="display:flex;gap:10px;">'+
          '<button class="btn-outline" onclick="cancelKrScheduleChange()">取消修改</button>'+
          '<button class="btn-outline" onclick="requestCannotCoordinate()">无法协调</button>'+
          '</div>';
      }
    } else { /* Arrived：之后IN不能再操作，只显示状态，KR端用演示按钮模拟 */
      body = '<div class="info-heading" style="margin-bottom:8px;">施术日期</div>'+
        '<div class="card" style="padding:14px 16px;margin-bottom:14px;">施术日期 '+ks.confirmedDate+' '+ks.confirmedTime+'（KR已标记已到医院，IN端不能再修改日期、无法协调或取消项目）</div>'+
        krArrivedOpsHtml(c);
    }
  } else {
    body = '<div style="font-size:13px;color:var(--muted);">没有进行中的赴韩项目</div>';
  }
  /* 赴韩项目行（KRItem）：未开始 / 已完成 / 已取消 / 已更换（原项目名划线），IN 端只读；项目上的黄色小标签 = ItemFlag */
  var pillStyle = {'未开始':['var(--terracotta-bg)','var(--terracotta)'], '已完成':['var(--sage-bg)','var(--sage)'], '已取消':['#EDEAE2','var(--muted)'], '已更换':['var(--blue-bg)','var(--blue)']};
  var itemsHtml = '<div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--border2);">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><div style="font-size:12px;font-weight:700;color:var(--terracotta);">赴韩项目（韩国那边施术，印尼只读，无法操作）</div>'+(c.krJudge && c.krJudge.result==='changed' && !c.visitClosed ? '<span style="cursor:pointer;font-size:11px;color:var(--slate);" onclick="simulateKrProjectSwap()">演示：模拟韩国更换项目</span>' : '')+'</div>'+
    krAllItems(c).map(function(it){
      var stText = krItemStatus(it), pc = pillStyle[stText];
      var nameHtml = it.replacedBy
        ? '<span style="text-decoration:line-through;color:var(--muted);">'+it.name+'</span> → 更换为 <b>'+it.replacedBy+'</b>'
        : '<span style="'+(it.cancelled?'text-decoration:line-through;color:var(--muted);':'')+'">'+it.name+'</span>';
      var flags = krItemFlags(c, it).map(function(f){ return '<span class="status-pill" style="background:#FBF0C9;color:#A8740A;font-size:10px;margin-left:6px;">⚠ '+f+'</span>'; }).join('');
      return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+nameHtml+flags+'</span>'+
        '<span class="status-pill" style="background:'+pc[0]+';color:'+pc[1]+';">'+stText+'</span></div>';
    }).join('')+
    '</div>';
  var unableBanner = '';
  var unableBtn = '';
  return '<div class="card" style="padding:22px 24px;">'+subStatusRowHtml(caseSubStatusItems(c))+body+itemsHtml+'</div>';
}

function markConsultPaid(){
  var c = getCurrentCase(); if(!c) return;
  c.consultStatus = 'paid_waiting_kr';
  updateCaseStage(c); /* 缴费后离开"接待中"，进入面诊安排 */
  logCaseEvent(c, '客人', '完成面诊费支付，已在Main对话群自动通知');
  buildCaseLog(c); renderCaseHeaderActions(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

function applyWaiveFee(c, reason, note){
  c.consultFeeWaived = {reason: reason==='其他' ? '其他：'+note : reason, note:note};
  c.consultStatus = 'paid_waiting_kr'; /* 免除后照正常流程：待确认报告时间 */
  updateCaseStage(c);
  logCaseEvent(c, actingName(), '免除面诊费（原因：'+c.consultFeeWaived.reason+'）');
  buildCaseLog(c); renderCaseHeaderActions(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
}

function krConfirmReportEta(eta, c){
  c = c || getCurrentCase();
  if(!c || c.consultStatus!=='paid_waiting_kr') return;
  c.reportEta = eta;
  c.reportOverdue = false;
  c.consultStatus = 'awaiting_report';
  updateCaseStage(c);
  logCaseEvent(c, '이서연', 'KR确认预计出报告时间：'+eta);
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
  pushNotif('面诊','KR 确认预计出报告时间：'+c.name+' '+eta, {caseId:c.id});
}

/* 演示：超过预计时间还没出报告——小状态变橘色"已超过预计时间"，只提醒，状态不变 */
function simulateReportTimeout(){
  var c = getCurrentCase(); if(!c || c.consultStatus!=='awaiting_report') return;
  c.reportOverdue = true;
  logCaseEvent(c, '系统', '已超过预计出报告时间（'+(c.reportEta||'—')+'），报告还没提交（仅提醒，状态不变）');
  buildCaseLog(c);
  renderCaseStatusBar(c);
  renderCaseBody(c);
  pushNotif('面诊','等待报告超过预计时间：'+c.name+'（预计 '+(c.reportEta||'—')+'）', {caseId:c.id});
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
function libCasesOfProject(pid){ return LIB_CASES.filter(function(c){ return (c.projectIds||[]).indexOf(pid)>-1; }); }

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
  return PROJECT_LIBRARY.filter(function(p){ return p.categoryId===catId; });
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
  if(CURRENT_PAGE_ID!=='in-library') nav('in-library');
  libGo('cases', {groupId:gid, projectId:pid, caseId:null});
}

function libOpenCase(id){
  var c = LIB_CASES.filter(function(x){ return x.id===id; })[0]; if(!c) return;
  var pid = (c.projectIds||[])[0];
  var pr = pid ? projById(pid) : null;
  var gid = LIB_STATE.groupId || (pr ? (pr.origin==='IN' ? (LIB_VIEW==='part'?'skin':'cat:'+pr.categoryId) : 'cat:'+pr.categoryId) : null);
  var projectId = LIB_STATE.projectId || pid;
  if(CURRENT_PAGE_ID!=='in-library') nav('in-library');
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
    dirRow = libDirectorClickable(c)
      ? '<div style="font-size:11px;color:var(--slate2);">院长：<a href="#" class="info-link" onclick="event.stopPropagation();openDirectorDetail(\''+c.director+'\');return false;">'+c.director+'</a></div>'
      : '<div style="font-size:11px;color:var(--muted);">院长：-</div>'; /* 不在名单上（停用/离职）显示"-"，不可点击 */
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
  var dirs = DIRECTOR_LIST.map(function(d){ return {v:d, l:d}; }); /* 院长筛选的数据来自 KR 院长名单（Notion IN-SHOW-01） */
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
  var me = DEMO_ROLE==='kr' ? '이서연（KR室长）' : ME_NAME;
  if(c.id){
    c.editedBy = me; c.editedAt = nowFullDt();
    var idx = LIB_CASES.findIndex(function(x){ return x.id===c.id; });
    if(idx>-1) LIB_CASES[idx] = c;
  } else {
    c.id = newLibCaseId(); c.uploader = me; c.uploadedAt = nowFullDt(); c.editedBy = null; c.editedAt = null;
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

var PROJECT_CATEGORIES = {};

function addProjCategory(label, origin){
  var id = newProjCatId();
  PROJECT_CATEGORIES[id] = {id:id, label:label, origin:origin};
  return id;
}

var PCAT = {};
 // 建种子数据时临时存 label->id，方便下面 PROJECT_LIBRARY 直接引用
['眼部','鼻部','轮廓','面部年轻化','胸部','身体'].forEach(function(l){ PCAT[l] = addProjCategory(l, 'KR'); });

['提升','脱发','去除色素','脱毛','填充','水光','黄金微针','术后管理'].forEach(function(l){ PCAT[l] = addProjCategory(l, 'IN'); });

var POST_CARE_CAT_ID = PCAT['术后管理'];
 /* 2026-09-29：术后管理虽然归类本地项目，但和普通本地项目不同，选购时同样受krScope限制 */

var PROJ_SEQ = 1;

function newProjId(){ return 'p'+(PROJ_SEQ++); }

function makeProj(name, price, origin, catLabel){
  return {id:newProjId(), name:name, price:price, origin:origin, categoryId:PCAT[catLabel], active:true};
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
  makeProj('大腿吸脂', 4500000, 'KR', '身体'),
  /* 本地项目（IDR） */
  makeProj('V-RO超声波 300发 + 高频率 3000发', 3300000, 'IN', '提升'),
  makeProj('Onda提升 60kj', 4800000, 'IN', '提升'),
  makeProj('XERF提升 300发', 8200000, 'IN', '提升'),
  makeProj('Onda提升 60kj + 美版超声刀 300发', 14000000, 'IN', '提升'),
  makeProj('Onda提升 60kj + XERF提升 300发', 12000000, 'IN', '提升'),
  makeProj('干细胞30皮肤注射 / 脱发治疗注射', 4400000, 'IN', '脱发'),
  makeProj('好莱坞焕肤 1次', 320000, 'IN', '去除色素'),
  makeProj('Genesis焕肤（Clarity II）1次', 540000, 'IN', '去除色素'),
  makeProj('比基尼线脱毛 + 焕肤护理', 1100000, 'IN', '脱毛'),
  makeProj('巴西式脱毛 + 焕肤护理', 1400000, 'IN', '脱毛'),
  makeProj('随心所选玻尿酸填充 1个部位（1cc，韩国产）', 870000, 'IN', '填充'),
  makeProj('臀窝 / 臀部提升填充（1cc）', 990000, 'IN', '填充'),
  makeProj('丽珠兰黑盒 + LiliedM 水光注射（2cc）', 1600000, 'IN', '水光'),
  makeProj('LiliedM + 皮肤肉毒（5cc）', 2700000, 'IN', '水光'),
  makeProj('乔雅露蓝瓶 Juvelook Skin（3cc）', 1850000, 'IN', '水光'),
  makeProj('乔雅露蓝瓶 Juvelook Skin（3cc）+ 丽珠兰黑盒（2cc）+ LDM', 3300000, 'IN', '水光'),
  makeProj('黄金微针 毛孔探头', 1600000, 'IN', '黄金微针'),
  makeProj('黄金微针 毛孔探头 + 外泌体（5cc）+ LDM', 4050000, 'IN', '黄金微针'),
  makeProj('黄金微针 Pumping探头 + 乔雅露（3cc）+ LDM', 4250000, 'IN', '黄金微针'),
  makeProj('黄金微针 Pumping探头 + Gouri水光（4cc）+ LDM', 4400000, 'IN', '黄金微针'),
  /* 术后管理（2026-09-29 新增分类）：具体项目名/价格是我编的演示数据，不是业务方给的清单 */
  makeProj('术后消肿护理 1次', 450000, 'IN', '术后管理'),
  makeProj('术后疤痕修复护理 1次', 680000, 'IN', '术后管理')
];


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
  grantHolding('Rizky Hidayat', '好莱坞焕肤 1次', '本地', 'rizky', D(-3), 1, false);
  grantHolding('Rizky Hidayat', 'Genesis焕肤（Clarity II）1次', '本地', 'rizky', D(-3), 1, false);
  grantHolding('Rina Marlina', 'Genesis焕肤（Clarity II）1次', '本地', 'rina', D(-29), 1, false);
  useHolding('Rina Marlina', 'Genesis焕肤（Clarity II）1次', 'rina', D(-22), 1); /* 已用完，演示"已用/购买"显示 */
  useHolding('Rizky Hidayat', '好莱坞焕肤 1次', 'rizky', D(-3), 1, 'main'); /* rizky 本地管理：已使用1次 */
})();


/* 演示数据（2026-10-02·五）：非活性化的项目 + 部分使用的持有批次，用来对应项目库的使用情况/删除规则
   - Genesis焕肤：非活性化，但 Rizky 手上还有 1 个未用批次 → 删除按钮置灰
   - 巴西式脱毛 + 焕肤护理：非活性化，完全没有在用 → 可以删除
   - 鼻修复（赴韩）：非活性化，没有在用 → 可以删除
   - 好莱坞焕肤：Rizky 买2次、用1次（部分使用）→ 客户详情可退款剩余1次 */
(function seedProjectLibraryDemo(){
  function byName(n){ return PROJECT_LIBRARY.filter(function(x){ return x.name===n; })[0]; }
  ['Genesis焕肤（Clarity II）1次','巴西式脱毛 + 焕肤护理','鼻修复'].forEach(function(n){ var q = byName(n); if(q) q.active = false; });
  var h = (CLIENT_HOLDINGS['Rizky Hidayat']||[]).filter(function(x){ return x.itemName==='好莱坞焕肤 1次'; })[0];
  if(h && h.batches[0] && h.batches[0].bought===1){ h.batches[0].bought = 2; } /* 买2用1：部分使用 */
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
    LIB_CASES.push({id:id, title:title, names:{zh:title, ko:demoTranslate(title,'zh','ko'), id:demoTranslate(title,'zh','id')}, source:source,
      projectIds:projNames.map(pid).filter(Boolean), director:director, problemIds:(problems||[]).map(function(l){ return LIB_PROBLEM_IDS[l]; }),
      beforePhotos:[{url:'', color:'#E6DDD0'}, {url:'', color:'#E1D8CB'}], afterPhotos:recs.map(function(r){ return photo(r); }),
      consent:{signed:true, file:'consent-'+id+'.pdf'}, uploader:(source==='travel'?'이서연（KR室长）':actingName()), uploadedAt:'2026-09-'+day+' 10:00',
      editedBy:null, editedAt:null});
  }
  mk('切开双眼皮 · 自然平行型','travel',['切开双眼皮'],'김민석 원장',[],['1周','1个月','3个月'],'16');
  mk('埋线双眼皮 术后恢复','travel',['埋线双眼皮'],'이수진 원장',[],['1周','1个月'],'14');
  mk('假体隆鼻 基底改善','travel',['假体隆鼻'],'김민석 원장',[],['1个月','6个月'],'12');
  mk('鼻综合 鼻尖精修','travel',['鼻综合（假体+鼻尖）'],'박지훈 원장',[],['3个月'],'10'); /* 박지훈 已停用 → 院长显示"-" */
  mk('颧骨缩小 侧面轮廓','travel',['颧骨缩小'],'김민석 원장',[],['1周','3个月'],'09');
  mk('下颌角整形联合方案','travel',['下颌角整形','颧骨缩小'],'이수진 원장',[],['1个月'],'08');
  mk('面部拉皮 提升','travel',['面部拉皮'],'김민석 원장',[],['3个月','6个月'],'07');
  mk('自体脂肪移植 面部填充','travel',['自体脂肪移植（全脸）'],'이수진 원장',[],['1个月'],'06');
  mk('好莱坞焕肤 色素改善','local',['好莱坞焕肤 1次'],null,['色素沉着','暗沉'],['1周','1个月'],'15');
  mk('Genesis焕肤 暗沉改善','local',['Genesis焕肤（Clarity II）1次'],null,['暗沉'],['1个月'],'13'); /* 项目已非活性化 → 卡片标"已非活性" */
  mk('黄金微针 毛孔紧致','local',['黄金微针 毛孔探头'],null,['毛孔粗大','痘印'],['1个月','3个月'],'11');
  mk('干细胞注射 脱发改善','local',['干细胞30皮肤注射 / 脱发治疗注射'],null,['脱发'],['3个月','6个月'],'05');
  mk('Onda提升 面部紧致','local',['Onda提升 60kj'],null,['松弛'],['1个月'],'04');
  mk('乔雅露蓝瓶 水光','local',['乔雅露蓝瓶 Juvelook Skin（3cc）'],null,['暗沉','毛孔粗大'],['1周'],'03');
})();

var FX_RATES = { KRW_IDR:11.8, KRW_CNY:0.0052, IDR_CNY:0.00044 };

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

function setProjLibTab(t){ PROJLIB_TAB = t; PROJLIB_CAT_FILTER = 'all'; renderProjLibrary(); }

function setProjLibCatFilter(id){ PROJLIB_CAT_FILTER = id; renderProjLibrary(); }

function setProjDisplayCcy(origin, ccy){
  if(origin==='KR') PROJ_DISPLAY_CCY_KR = ccy; else PROJ_DISPLAY_CCY_IN = ccy;
  renderProjLibrary();
}

function projLibCategories(origin){
  return Object.keys(PROJECT_CATEGORIES).filter(function(id){ return PROJECT_CATEGORIES[id].origin===origin; }).map(function(id){ return PROJECT_CATEGORIES[id]; });
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
  var priceHtml = '<span style="font-size:13px;font-weight:700;">'+displayAmount(p.price, p.origin, disp)+'</span>'+
    (disp!==native ? '<div style="font-size:10px;color:var(--muted);font-weight:400;">原价 '+formatCurrency(p.price, native)+'</div>' : '');
  var nm = p.names ? '<div style="font-size:10px;color:var(--muted);margin-top:2px;">'+(p.names.ko||'')+' · '+(p.names.id||'')+'</div>' : '';
  return '<div class="case-field-row"><span style="flex-grow:1;font-size:13px;">'+p.name+nm+'</span>'+
    '<span style="font-size:11px;color:var(--muted);width:90px;">'+(cat?cat.label:'—')+'</span>'+
    '<span style="width:130px;text-align:right;">'+priceHtml+'</span>'+
    '<span style="font-size:11px;color:var(--slate2);width:190px;text-align:right;">进行中案件 '+u.cases+' 个 · 持有中批次 '+u.batches+' 个 · 案例 '+u.libCases+' 个</span>'+
    '<span class="fa" style="gap:12px;width:150px;justify-content:flex-end;">'+actions+'</span></div>';
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
  if(!p.price || isNaN(price) || price<0) missing.push('价格');
  if(!p.categoryId) missing.push('分类');
  if(missing.length){
    p.errorMsg = '还差 '+missing.join('、')+' 未完成';
    renderProjEditModal();
    return;
  }
  var fromLang = ['zh','ko','id'].filter(function(k){ return (p.names[k]||'').trim(); })[0];
  ['zh','ko','id'].forEach(function(k){ if(!(p.names[k]||'').trim()) p.names[k] = demoTranslate(p.names[fromLang].trim(), fromLang, k); }); /* 没填的语言保存时自动翻译补全 */
  p.name = p.names.zh.trim(); /* 列表和案件里显示中文名；案件里存的是快照 */
  p.price = Math.round(price);
  p.errorMsg = '';
  if(p.id){
    var idx = PROJECT_LIBRARY.findIndex(function(x){ return x.id===p.id; });
    if(idx>-1) PROJECT_LIBRARY[idx] = p;
  } else {
    p.id = newProjId();
    p.active = true;
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

function notifAlive(n){ return (new Date(nowFullDt().replace(' ','T')+':00') - new Date(n.ts.replace(' ','T')+':00')) <= 90*86400000; }
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
  if(kind==='report') pushNotif('面诊','报告已出：'+ayu.name+'（'+ayu.caseNo+'），已进入项目确认中', {caseId:'ayu'});
  else if(kind==='missed') pushNotif('视频','未接来电：이서연 呼叫了 '+ayu.name+' 的案件视频', {caseId:'ayu', link:{kind:'caseRoom'}});
  else if(kind==='at'){
    ensureCaseRoom(ayu); var roomId = getCaseRoomId('ayu');
    CHAT_DATA[roomId].push({day:KD(0), from:'them', name:'이서연', color:'var(--sage)', init:'이', orig:'@Dewi 这位客人的报告我已经补充了，请看一下。', trans:'（演示译文）', time:nowTime()});
    pushNotif('对话','이서연 在「'+ayu.name+' · '+ayu.caseNo+'」里 @ 了你', {caseId:'ayu', names:[ME_NAME], link:{kind:'mention', roomId:roomId, msgIdx:CHAT_DATA[roomId].length-1}});
  }
  else if(kind==='system') pushNotif('系统','诊所管理账号更新了设定：面诊费 300,000 → 350,000 印尼盾，'+D(15)+' 起生效', {names:IN_COORDINATORS, link:{kind:'system'}, detail:{title:'面诊费调整', changes:['面诊费 300,000 → 350,000 印尼盾'], effective:D(15)+' 起'}});
  else if(kind==='noshow') pushNotif('预约','未到店（自动判定）：Bayu Aditya 过预约时间30分钟未到店，已取消', {caseId:'bayu'});
  else if(kind==='schedule') pushNotif('赴韩施术','KR 确认施术时间：Nadia Permata '+D(2)+' 14:00', {caseId:'nadia'});
  else if(kind==='other') pushNotif('面诊','报告已出：Andi Wijaya（这个案件只有 Rina 操作过 → 只发给 Rina）', {caseId:'andi'});
}

/* 演示通知（各分类至少一条，含已读/未读） */
(function seedNotifs(){
  function add(cat, text, caseId, ts, read, link, detail, names){
    var n = {id:'n'+(++NOTIF_SEQ), cat:cat, text:text, caseId:caseId, ts:ts, recipients:names||['Dewi'], read:read?{Dewi:true}:{}, link:link||(caseId?{kind:'case'}:{kind:'none'}), detail:detail||null};
    NOTIFS.push(n);
  }
  add('预约','客人自助预约提交：Siti Rahayu（A000017）','siti',D(0)+' 09:05',false);
  add('预约','未到店（自动判定）：Bayu Aditya 过预约时间30分钟未到店，已取消','bayu',D(-1)+' 10:31',true);
  add('预约','预约占位快过期（剩 5 分钟）：+62 812-3300-0099','',D(-1)+' 12:55',true,{kind:'none'});
  add('面诊','KR 确认预计出报告时间：Putri Wulandari '+D(2)+' 14:00','putri',D(-4)+' 16:00',true);
  add('面诊','等待报告超过预计时间：Dedi Prasetyo（预计 '+D(0)+' 08:00）','dedi',D(0)+' 08:05',false);
  add('面诊','报告已出：Ayu Lestari（A000006）','ayu',D(-2)+' 11:20',true);
  add('赴韩施术','KR 确认施术时间：Nadia Permata '+D(2)+' 14:00','nadia',D(-3)+' 10:00',true);
  add('赴韩施术','客人已到医院：Nadia Permata','nadia',D(-1)+' 09:30',false);
  add('视频','未接来电：이서연 呼叫了 Ayu Lestari 的案件视频','ayu',D(-1)+' 15:20',false,{kind:'caseRoom'});
  add('对话','이서연 在「Ayu Lestari · A000006」里 @ 了你','ayu',D(-2)+' 13:10',true,{kind:'mention', roomId:'case-ayu', msgIdx:0});
  add('系统','诊所管理账号更新了设定：营业时间 09:00–18:00 → 09:00–19:00，'+D(2)+' 起生效','',D(-2)+' 08:00',true,{kind:'system'},{title:'营业时间调整', changes:['营业时间 09:00–18:00 → 09:00–19:00'], effective:D(2)+' 起'},['Dewi','Rina']);
})();

/* 日历上"等待报告超过预计时间"自动提醒用的标记：dedi 演示案件已经提醒过 */
CASE_ITEMS.filter(function(c){ return c.id==='dedi'; }).forEach(function(c){ c.overdueNotified = true; });


/* ================= chat drawer ================= */

var ROOMS = [
  {id:'main', name:'Main · 全员', isMain:true, color:'var(--slate2)', init:'G', date:'今天 09:20'},
  {id:'kr-lee', name:'이서연 · 韩国室长', color:'var(--sage)', init:'이', date:'今天 14:02'},
  {id:'director-kim', name:'김민석 · 院长', color:'var(--slate2)', init:'김', date:'昨天'},
  {id:'rina', name:'Rina · 印尼室长', color:'var(--terracotta)', init:'R', date:'2 天前'},
  {id:'grp-이서연-rina', name:'이서연、Rina', color:'var(--blue)', init:'G', date:'今天'}
];

function drawerFootAction(){
  if(DRAWER_TAB==='case') openNewCaseChatModal();
  else openNewStaffChatModal();
}

var STAFF_ROSTER = [
  {id:'kr-lee', name:'이서연 · 韩国室长'},
  {id:'director-kim', name:'김민석 · 院长'},
  {id:'rina', name:'Rina · 印尼室长'}
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
    {day:KD(-1), from:'them', name:'이서연', color:'var(--sage)', init:'이', orig:'Siti Rahayu 자료 검토 부탁드립니다.', trans:'Siti Rahayu 的材料麻烦帮忙看一下。', time:'14:00'},
    {day:KD(-1), from:'me', orig:'好的，我这边帮您确认，院长看完资料后会出报告。', time:'14:05'},
    {day:KD(0), from:'them', name:'이서연', color:'var(--sage)', init:'이', orig:'면담 시간은 09.20 14:00 KST로 확정됐습니다.', trans:'预计出报告时间已确认为 09.20 14:00（KST）。', time:'09:12'},
    {day:KD(0), from:'me', orig:'这位客人的报告你看一下是否需要补充？', trans:'이 고객 리포트 보완이 필요한지 확인해 주세요.', time:'10:20', refCaseId:'ayu'},
    {day:KD(0), from:'me', orig:'Lina 之前的报告可以当参考。', trans:'Lina 님의 이전 리포트를 참고하세요.', time:'10:25', refCaseId:'lina'}
  ],
  'main':[
    {day:KD(0), from:'them', name:'김민석 원장', color:'var(--slate2)', init:'김', orig:'이번 주 신규 케이스 3건 검토 예정입니다.', trans:'本周有 3 个新案件待审核。', time:'09:00'},
    {day:KD(0), from:'them', name:'Rina', color:'var(--terracotta)', init:'R', orig:'Budi Santoso 案件资料补充中，晚点提交。', time:'09:20'},
    {day:KD(0), from:'them', name:'Rina', color:'var(--terracotta)', init:'R', orig:'@Dewi 下午的持有项目对账麻烦你过来一下。', trans:'（演示译文）', time:'09:40'}
  ],
  'grp-이서연-rina':[
    {day:KD(0), from:'them', name:'Rina', color:'var(--terracotta)', init:'R', orig:'这周 KR 那边的开放日期都排满了吗？', trans:'이번 주 KR 쪽 개방 일정이 다 찼나요?', time:'10:05'},
    {day:KD(0), from:'them', name:'이서연', color:'var(--sage)', init:'이', orig:'아직 21일, 22일이 비어 있습니다.', trans:'21 日、22 日还有空位。', time:'10:12'}
  ],
  'director-kim':[
    {day:KD(-1), from:'them', name:'김민석', color:'var(--slate2)', init:'김', orig:'Siti Rahayu 자료 잘 받았습니다, 검토하겠습니다.', trans:'Siti Rahayu 的材料已收到，我会审核。', time:'11:40'}
  ],
  'rina':[
    {day:KD(-2), from:'them', name:'Rina', color:'var(--terracotta)', init:'R', orig:'Budi 的材料我再补充一下', time:'16:20'}
  ],

  /* 案件专属房间：只给已经生成 Case ID 的案件开（见 docs/conversation-video-flow.md"只有主动发起过对话的案件才会存在"），
     每个案例配一条和它当前状态对得上的对话记录，这样"对话"抽屉的"案件"分类点进去看到的内容和案件详情页是一致的 */
  'case-yuni':[
    {day:KD(-2), from:'me', orig:'客人想先看一下术后管理的价格，我整理了项目单发给她。', trans:'고객이 시술 후 관리 가격부터 보고 싶어 해서 항목표를 보냈습니다.', time:'09:40'}
  ],
  'case-maya':[
    {day:KD(-2), from:'me', orig:'客人想知道大概多久能出报告。', trans:'고객이 리포트가 언제쯤 나오는지 궁금해합니다.', time:'14:40'},
    {day:KD(-2), from:'them', name:'이서연', color:'var(--sage)', init:'이', orig:'수신했습니다, 원장님께 전달하겠습니다.', trans:'已收到，会转达给院长。', time:'15:10'}
  ],
  'case-putri':[
    {day:KD(-4), from:'them', name:'이서연', color:'var(--sage)', init:'이', orig:'자료 확인했습니다. 원장님과 함께 검토 중입니다.', trans:'资料已确认，正在和院长一起看。', time:'16:05'}
  ],
  'case-dedi':[
    {day:KD(0), from:'me', orig:'客人在问报告什么时候能好，我先回复她还在等。', trans:'고객이 리포트 일정을 물어 아직 기다리는 중이라고 답했습니다.', time:'09:10'}
  ],
  'case-budi':[
    {day:KD(2), from:'them', name:'김민석', color:'var(--slate2)', init:'김', orig:'윤곽 이완은 중등도입니다. 초음파 리프팅 먼저 평가하시죠.', trans:'轮廓松弛属中度，建议先评估超声刀。', time:'09:30'}
  ],
  'case-ayu':[
    {day:KD(1), from:'them', name:'김민석', color:'var(--slate2)', init:'김', orig:'Ayu Lestari 리포트 발송했습니다.', trans:'Ayu Lestari 的面诊报告已发送。', time:'11:20'},
    {day:KD(0), from:'me', kind:'quote', speaker:'Dewi', srcRoomId:'kr-lee', srcRoom:'이서연 · 韩国室长', srcIdx:3, srcDt:'26-09-18 10:20', orig:'这位客人的报告你看一下是否需要补充？', trans:'이 고객 리포트 보완이 필요한지 확인해 주세요.', time:'10:20'} /* 从其他房间引用进来 */
  ],
  'case-fajar':[
    {day:KD(3), from:'me', orig:'客人说想再对比一下鼻翼缩小的价格，稍后回复。', trans:'고객이 콧볼 축소 가격을 다시 비교해 보겠다고 했습니다.', time:'10:00'}
  ],
  'case-dinda':[
    {day:KD(5), from:'me', orig:'客人问施术日期怎么选，我发了日历说明。', trans:'고객이 시술 날짜 선택 방법을 물어 달력 안내를 보냈습니다.', time:'10:05'}
  ],
  'case-nadia':[
    {day:KD(2), from:'me', orig:'客人已经到首尔了，酒店信息我发给 KR 室长。', trans:'고객이 서울에 도착했고 호텔 정보를 KR 실장님께 보냅니다.', time:'11:00'},
    {day:KD(4), from:'them', name:'김민석', color:'var(--slate2)', init:'김', orig:'턱 보형물 시술 완료했습니다, 광대축소술은 다음 주 예정입니다.', trans:'下巴假体已完成，颧骨缩小下周进行。', time:'14:00'}
  ],
  'case-rizky':[
    {day:KD(1), from:'them', name:'Rina', color:'var(--terracotta)', init:'R', orig:'Rizky 的赴韩项目已经全部完成，本地这边还剩一项', time:'09:30'}
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

function caseRoomMembers(c){
  var kr = caseHasKrSide(c);
  return {inn:IN_COORDINATORS.slice(), kr: kr ? KR_COORDINATORS.slice() : [], director: (kr && c.director) ? c.director : null};
}

/* ---- 备忘 / OFF 数据（2026-10-02·七）：IN 室长的 OFF 从"新增 memo"来；KR 院长/KR 室长的 OFF 用演示数据代替（KR 端功能） ----
   {id, date, type:'备忘'|'OFF', scope:'公开'|'私人', role:'IN室长'|'KR室长'|'KR院长'(OFF 用), person:(OFF 的人), author, text} */
var DEMO_MEMOS = [
  {id:'m1', date:D(0), type:'OFF', scope:'公开', role:'KR院长', person:'이수진 원장', author:'KR（演示）', text:''},
  {id:'m2', date:D(0), type:'OFF', scope:'公开', role:'KR室长', person:'이서연', author:'KR（演示）', text:''},
  {id:'m3', date:D(1), type:'OFF', scope:'公开', role:'IN室长', person:'Rina', author:'Rina', text:''},
  {id:'m4', date:D(3), type:'OFF', scope:'公开', role:'KR院长', person:'김민석 원장', author:'KR（演示）', text:''},
  {id:'m5', date:D(0), type:'备忘', scope:'公开', author:'Dewi', text:'下午整理持有项目对账'},
  {id:'m6', date:D(-1), type:'备忘', scope:'私人', author:'Dewi', text:'给 Rizky 回电（私人）'}
];

var CAL_MEMOS = (function(){ try{ var v = JSON.parse(localStorage.getItem('gmc_memos')||'null'); if(v) return v; }catch(e){} return DEMO_MEMOS.map(function(m){ return Object.assign({}, m); }); })();

function saveMemos(){ try{ localStorage.setItem('gmc_memos', JSON.stringify(CAL_MEMOS)); }catch(e){} }

function offNameKey(n){ return String(n||'').split(' ')[0]; }

/* 推播对象（2026-10-02·三）：这个案件所有操作过的室长（只发给当天上班的）；操作过的都 OFF → 改发给同一边当天上班的所有室长；被 @ 的人一定收到 */
function caseOperators(c, strict){
  var inn = [], kr = [];
  (c.logEntries||[]).forEach(function(l){
    var a = String(l.actor||'');
    if(IN_COORDINATORS.indexOf(a)>-1){ if(inn.indexOf(a)<0) inn.push(a); }
    else { var k = offNameKey(a); if(KR_COORDINATORS.indexOf(k)>-1 && kr.indexOf(k)<0) kr.push(k); }
  });
  if(!strict && !inn.length && c.inCoordinator) inn.push(c.inCoordinator); /* 推播用：没有任何操作记录时按案件默认负责室长；列表显示只按真实操作记录 */
  return {inn:inn, kr:kr};
}

function shouldPushToMe(c){ return pushTargets(c).inn.indexOf(ME_NAME)>-1; }
 /* 演示视角：当前登录的是 Dewi（IN室长） */
function roomSysMsg(text){ return {day:KD(0), from:'sys', kind:'sys', orig:text, time:nowTime()}; }

/* 点［发起对话］/新建案件对话时才建房（有房间之后才出现在抽屉里）；建房时IN室长进入房间 */
function ensureCaseRoom(c){
  var roomId = getCaseRoomId(c.id);
  if(!CHAT_DATA.hasOwnProperty(roomId)){
    CHAT_DATA[roomId] = IN_COORDINATORS.map(function(n){ return roomSysMsg(n+' 进入房间'); });
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
  if(CURRENT_ROOM==='main') return IN_COORDINATORS.concat(KR_COORDINATORS).concat(DIRECTOR_LIST);
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
  var msg = {day:q.day, from:'me', sender:ME_NAME, kind:'quote', speaker:q.speaker, srcRoomId:q.srcRoomId, srcRoom:q.srcRoom, srcIdx:q.srcIdx, srcDt:q.srcDt, orig:q.orig, trans:q.trans||'', time:nowTime()};
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
  var ended = isEnded(c), b = caseStatusBadge(c); /* 显示案件"现在的"大状态（渲染时实时读，案件推进后跟着变），样式同案件列表 */
  return '<div style="margin-top:4px;background:#EDEAE2;border-radius:10px;padding:6px 10px;font-size:11px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:var(--slate2);">📄 引用案件 '+(c.caseNo||c.name)+
    ' · <span class="status-pill" style="background:'+b[0]+';color:'+b[1]+';">'+b[2].split(' · ')[0]+'</span>'+
    ' <a href="#" class="info-link" style="color:var(--blue);" onclick="openCaseNewTab(\''+c.id+'\');return false;">查看案件</a>'+
    (ended ? '' : '<button class="btn-outline" style="padding:2px 10px;font-size:11px;background:#fff;" onclick="openCaseChatNewTab(\''+c.id+'\')">转到案件对话</button>')+'</div>';
}

var ROOM_FILE_SEQ = 1;

function krEnterRoomName(c){ return (c.krCoordinator||KR_COORDINATORS[0]).split(' ')[0]; }

/* 演示：KR室长进入/离开案件对话房（进入前 🎥 灰色不可用，进入后可用） */
function simulateKrEnterRoom(){
  var c = CASE_ITEMS.filter(function(x){ return x.id===ATTACHED_CASE_ID; })[0];
  if(!c || !caseHasKrSide(c) || c.krInRoom) return;
  c.krInRoom = true;
  CHAT_DATA[getCaseRoomId(c.id)].push(roomSysMsg(krEnterRoomName(c)+' 进入房间'));
  renderFloatMessages(); renderFloatToolbar(); renderChatCaseChip();
}

function simulateKrLeaveRoom(){
  var c = CASE_ITEMS.filter(function(x){ return x.id===ATTACHED_CASE_ID; })[0];
  if(!c || !c.krInRoom) return;
  c.krInRoom = false;
  CHAT_DATA[getCaseRoomId(c.id)].push(roomSysMsg(krEnterRoomName(c)+' 离开房间'));
  renderFloatMessages(); renderFloatToolbar(); renderChatCaseChip();
}

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
var IN_COORDINATORS = ['Dewi','Rina'];

/* 成员下拉（2026-10-02 增量·三）：点击房间名称 ▾ 显示成员；院长标"静音"，OFF 的人标"今日 OFF"（取代原来的 👤 成员 icon） */
function memberRowsHtml(){
  var roomId = CURRENT_ROOM, r = roomById(roomId) || {name:roomId};
  var today = nowFullDt().split(' ')[0];
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
          var inRoom = c.krInRoom && krEnterRoomName(c)===n;
          return row(n+' 실장 · 韩国室长', n, '<span style="font-size:11px;margin-left:6px;color:'+(inRoom?'var(--sage)':'var(--muted)')+';">'+(inRoom?'已进入':'未进入')+'</span>');
        }).join('');
      }
      if(m.director) html += head('院长（选定院长，选定后不能更换）') + row(m.director+' · 院长', m.director, mute);
      if(!m.kr.length) html += '<div style="font-size:11px;color:var(--muted);margin-top:10px;">这个案件没有面诊：只有印尼室长。点"增加面诊"并缴费后，韩国室长和院长才会加入。</div>';
    }
  } else if(roomId==='main'){
    html += head('院长') + DIRECTOR_LIST.map(function(d){ return row(d, d, mute); }).join('') +
      head('印尼室长') + IN_COORDINATORS.map(function(n){ return row(n, n); }).join('') +
      head('韩国室长') + KR_COORDINATORS.map(function(n){ return row(n, n); }).join('');
  } else {
    html += head('成员') + row(ME_NAME+'（我）', ME_NAME) + row(r.name, r.name.split(' ')[0]);
  }
  return html;
}

/* 🔕（2026-10-02）：对自己关闭这个房间的提醒，可再打开；被 @ 照样提醒 */
var MUTED_ROOMS = {};

function nowTime(){ var d = demoNow(); return pad2(d.getHours())+':'+pad2(d.getMinutes()); }

/* 初始化（2026-10-02）：已是终态的案件整理对话房进附件并删除；仍在进行的演示房间里，KR室长视为已进入 */
CASE_ITEMS.forEach(function(c){
  if(isEnded(c)) archiveCaseRoom(c);
  else if(CHAT_DATA.hasOwnProperty(getCaseRoomId(c.id)) && caseHasKrSide(c)) c.krInRoom = true;
});

/* 种子数据全部跑完：之后的操作人 = 当前登录的人；IN 室长名单按账号重算 */
SEEDING = false;
syncInCoordinators();
applyClinicSettings();
