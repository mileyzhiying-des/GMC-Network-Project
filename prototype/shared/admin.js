/* shared/admin.js —— 管理类页面（2026-10-06·A5～A8）：个人设定 / 诊所设定 / 账号管理 / 经营数据 / 操作日志
   通过 ADMIN_RENDER[key] 登记渲染函数（ui.js 的 openAdminPage 调用）。in.html 和 owner.html 都加载。
   classic script，全局函数/变量；加载顺序：rules.js → i18n.js → ui.js → data.js → store.js → admin.js */

function aEsc(s){ return String(s===undefined||s===null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function aSection(title, bodyHtml, note){
  return '<div class="card" style="padding:20px 24px;"><div style="font-size:14px;font-weight:700;margin-bottom:12px;">'+title+'</div>'+bodyHtml+
    (note ? '<div style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.6;">'+note+'</div>' : '')+'</div>';
}
function aField(label, inner, hint){
  return '<div class="field" style="margin-bottom:12px;"><label>'+label+'</label>'+inner+(hint?'<div style="font-size:11px;color:var(--muted);margin-top:4px;">'+hint+'</div>':'')+'</div>';
}
function aInput(attrs){ return '<input '+attrs+' style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;">'; }
function aGrid(cols, inner){ return '<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:0 16px;">'+inner+'</div>'; }

/* ================= 个人设定（所有账号；头像菜单 → 个人设置） ================= */
var PROFILE_POSITIONS = ['前台','咨询师','室长','其他'];
function acctPhotoHtml(a, size){
  var st = 'width:'+size+'px;height:'+size+'px;border-radius:50%;object-fit:cover;background:var(--border2);display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:var(--slate2);';
  return (a.photo && String(a.photo).indexOf('data:')===0)
    ? '<img src="'+a.photo+'" style="'+st+'">'
    : '<span style="'+st+'font-size:'+Math.round(size/2.4)+'px;">'+aEsc((a.name||'?').charAt(0).toUpperCase())+'</span>';
}
ADMIN_RENDER.personal = function(el){
  var a = currentAccount(); if(!a) return;
  var posOpts = PROFILE_POSITIONS.concat(PROFILE_POSITIONS.indexOf(a.position)<0 && a.position ? [a.position] : []).map(function(p){
    return '<option value="'+aEsc(p)+'"'+(p===a.position?' selected':'')+'>'+t(p)+'</option>'; }).join('');
  var profile =
    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;"><span id="pf-photo">'+acctPhotoHtml(a, 64)+'</span>'+
    '<label class="btn-outline" style="cursor:pointer;padding:6px 12px;font-size:12px;">'+t('更换照片')+'<input type="file" accept="image/*" style="display:none;" onchange="profilePhoto(this)"></label>'+
    '<span style="font-size:11px;color:var(--muted);">'+accountLabel(a.id)+' · '+aEsc(ACCOUNT_ROLES[a.role])+'</span></div>'+
    aGrid(2, aField(t('姓名'), aInput('id="pf-name" value="'+aEsc(a.name)+'"'))+aField(t('职位'), '<select id="pf-pos" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;">'+posOpts+'</select>')+
      aField(t('手机'), aInput('id="pf-phone" value="'+aEsc(a.phone)+'"'), '手机号只用来收验证码（激活、忘记密码）')) +
    '<div id="pf-err" class="error-text" style="display:none;margin-bottom:8px;"></div><button class="btn-primary" onclick="saveProfile()">'+t('保存资料')+'</button>';
  var lang = LANG_LABELS, curLang = currentLang();
  var langHtml = Object.keys(lang).map(function(k){
    return '<label style="display:flex;align-items:center;gap:10px;padding:7px 2px;font-size:13px;cursor:pointer;"><input type="radio" name="pf-lang" '+(k===curLang?'checked ':'')+'onchange="setMyLang(\''+k+'\')"> '+lang[k]+'</label>'; }).join('');
  var nt = a.notify || {push:true, sound:true};
  var notifyHtml =
    '<label style="display:flex;align-items:center;gap:10px;padding:7px 2px;font-size:13px;cursor:pointer;"><input type="checkbox" '+(nt.push!==false?'checked ':'')+'onchange="setMyNotify(\'push\',this.checked)"> '+t('推播通知')+'<span style="font-size:11px;color:var(--muted);">（关闭后右下角不再弹出提示，通知中心仍会记录）</span></label>'+
    '<label style="display:flex;align-items:center;gap:10px;padding:7px 2px;font-size:13px;cursor:pointer;"><input type="checkbox" '+(nt.sound!==false?'checked ':'')+'onchange="setMyNotify(\'sound\',this.checked)"> '+t('提示音')+'</label>';
  var pw =
    aGrid(3, aField(t('当前密码'), aInput('id="pw-old" type="password" autocomplete="off"'))+aField(t('新密码'), aInput('id="pw-new" type="password" autocomplete="off"'), '至少 6 位')+aField(t('确认新密码'), aInput('id="pw-new2" type="password" autocomplete="off"')))+
    '<div id="pw-err" class="error-text" style="display:none;margin-bottom:8px;"></div><button class="btn-primary" onclick="changeMyPassword()">'+t('修改密码')+'</button>';
  el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('个人设定')+'</div>'+
    aSection(t('个人资料'), profile, '姓名、职位、照片会显示在对话头像、案件的室长栏位和操作记录里；以前的操作记录保留当时的名字。（演示：照片只保存在内存里，刷新页面后不再显示。）')+
    aSection(t('界面语言'), langHtml, t('只影响自己的界面')+'。目前韩文、印尼文只翻译了侧边栏、按钮和设定页，其余页面仍显示中文。')+
    aSection(t('通知设定'), notifyHtml)+
    aSection(t('修改密码'), pw);
};
function profileErr(id, msg){ var e = document.getElementById(id); if(e){ e.textContent = msg; e.style.display = msg ? 'block' : 'none'; } }
function profilePhoto(inp){
  var f = inp.files && inp.files[0]; if(!f) return;
  var rd = new FileReader();
  rd.onload = function(){
    var a = currentAccount(); if(!a) return;
    a.photo = rd.result; logAcctHistory(a, '资料变更', '更换了证件照');
    var ph = document.getElementById('pf-photo'); if(ph) ph.innerHTML = acctPhotoHtml(a, 64);
    showToast('照片已更新', '（演示：只保存在内存里）', null);
  };
  rd.readAsDataURL(f);
}
function logAcctHistory(a, type, text){ a.history = a.history || []; a.history.push({ts:nowFullDt(), type:type, text:text, by:accountLabel(a.id)}); }
function saveProfile(){
  var a = currentAccount(); if(!a) return;
  var name = document.getElementById('pf-name').value.trim(), pos = document.getElementById('pf-pos').value, phone = document.getElementById('pf-phone').value.trim();
  if(!name){ profileErr('pf-err', '姓名不能为空'); return; }
  if(!phone){ profileErr('pf-err', '手机号不能为空'); return; }
  if(ACCOUNTS.some(function(x){ return x.id!==a.id && x.status!=='disabled' && (x.name||'').toLowerCase()===name.toLowerCase(); })){ profileErr('pf-err', '已有同名的使用人，请加上区分（对话和推播靠姓名区分）'); return; }
  var ch = [];
  if(name!==a.name) ch.push('姓名 '+a.name+' → '+name);
  if(pos!==a.position) ch.push('职位 '+(a.position||'—')+' → '+pos);
  if(phone!==a.phone) ch.push('手机 '+a.phone+' → '+phone);
  profileErr('pf-err', '');
  if(!ch.length){ showToast('没有修改', '资料和之前一样', null); return; }
  a.name = name; a.position = pos; a.phone = phone;
  logAcctHistory(a, '资料变更', ch.join('；'));
  ME_NAME = name; syncInCoordinators(); refreshAllSidebars();
  showToast('个人资料已保存', ch.join('；'), null);
}
function setMyLang(k){
  var a = currentAccount(); if(!a || !LANG_LABELS[k]) return;
  a.lang = k; Store.save(); location.reload(); /* 重新载入后整页按新语言显示 */
}
function setMyNotify(k, v){ var a = currentAccount(); if(!a) return; a.notify = Object.assign({push:true, sound:true}, a.notify||{}); a.notify[k] = !!v; }
function changeMyPassword(){
  var a = currentAccount(); if(!a) return;
  var o = document.getElementById('pw-old').value, n = document.getElementById('pw-new').value, n2 = document.getElementById('pw-new2').value;
  if(o !== a.password){ profileErr('pw-err', '当前密码不正确'); return; }
  if(n.length < 6){ profileErr('pw-err', '新密码至少 6 位'); return; }
  if(n !== n2){ profileErr('pw-err', '两次输入的新密码不一致'); return; }
  if(n === o){ profileErr('pw-err', '新密码不能和当前密码相同'); return; }
  profileErr('pw-err', '');
  a.password = n; logAcctHistory(a, '密码', '本人修改了密码');
  ['pw-old','pw-new','pw-new2'].forEach(function(id){ document.getElementById(id).value = ''; });
  showToast('密码已修改', '下次登录请使用新密码', null);
}

/* ================= 诊所设定（老板、管理者） ================= */
var CLINIC_DRAFT = null;
var CLINIC_FIELD_LABELS = {
  name:'诊所名称', address:'地址', phone:'电话', city:'所在城市', tz:'时区', openTime:'营业开始', closeTime:'营业结束', bookFrom:'可预约最早时段', bookTo:'可预约最晚时段',
  lunchFrom:'午休开始', lunchTo:'午休结束', closedDow:'休诊日', holdMinutes:'预约占位倒计时（分钟）', noShowMinutes:'未到店判定（分钟）', consultFee:'面诊费（印尼盾）',
  slotCapacity:'每个时段的预约上限', remindBeforeHours:'提醒短信发送时间（预约前几小时）', privacyVersion:'同意书版本', privacyPolicy:'隐私政策'
};
var SMS_KIND_LABELS = {link:'预约链接短信', confirm:'预约确认短信', remind:'预约提醒短信', cancel:'预约取消短信'};
var DOW_NAMES = ['周日','周一','周二','周三','周四','周五','周六'];

function clinicDraftFresh(){ CLINIC_DRAFT = JSON.parse(JSON.stringify(CLINIC_SETTINGS)); }
ADMIN_RENDER.clinic = function(el, isRefresh){
  if(!CLINIC_DRAFT || !isRefresh) clinicDraftFresh();
  var d = CLINIC_DRAFT;
  var f = function(k, type, extra){ return aInput('type="'+(type||'text')+'" value="'+aEsc(d[k])+'" data-k="'+k+'" oninput="clinicSet(this)" onchange="clinicSet(this)" '+(extra||'')); };
  var tzOpts = Object.keys(TZ_OPTIONS).map(function(k){ return '<option value="'+k+'"'+(d.tz===k?' selected':'')+'>'+k+'（UTC+'+TZ_OPTIONS[k].off+'）</option>'; }).join('');
  var dow = [1,2,3,4,5,6,0].map(function(i){ return '<label style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;font-size:13px;cursor:pointer;"><input type="checkbox" '+(d.closedDow.indexOf(i)>-1?'checked ':'')+'onchange="clinicToggleDow('+i+',this.checked)"> '+t(DOW_NAMES[i])+'</label>'; }).join('');
  var sms = Object.keys(SMS_KIND_LABELS).map(function(k){
    return aField(SMS_KIND_LABELS[k], '<textarea rows="3" data-k="sms.'+k+'" oninput="clinicSet(this)" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;">'+aEsc(d.sms[k])+'</textarea>'); }).join('');
  var directors = DIRECTOR_INFO.map(function(x){ return aEsc(x.name)+(x.active?'':'（'+t('已停用')+'）'); }).join('、');
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;"><div style="font-size:18px;font-weight:700;">'+t('诊所设定')+'</div>'+
    '<div style="font-size:11px;color:var(--muted);">'+(CLINIC_SETTINGS.updatedAt ? '最后修改：'+aEsc(CLINIC_SETTINGS.updatedBy)+'　'+CLINIC_SETTINGS.updatedAt : '')+'</div></div>'+
    aSection(t('诊所资料'),
      aGrid(2, aField(t('诊所名称'), f('name'))+aField(t('电话'), f('phone'))+aField(t('地址'), f('address'))+aField(t('所在城市'), f('city'), '显示在工作台的天气旁')+
        aField(t('时区'), '<select data-k="tz" onchange="clinicSet(this)" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;">'+tzOpts+'</select>', '日历按诊所所在时区显示，下面一行小字显示 KR 时间'))) +
    aSection(t('营业时间')+' / '+t('可预约时段')+' / '+t('午休'),
      aGrid(3, aField('营业开始', f('openTime','time','step="1800"'))+aField('营业结束', f('closeTime','time','step="1800"'))+'<div></div>'+
        aField('可预约最早时段', f('bookFrom','time','step="1800"'))+aField('可预约最晚时段（最后一个开始时间）', f('bookTo','time','step="1800"'))+'<div></div>'+
        aField('午休开始', f('lunchFrom','time','step="1800"'))+aField('午休结束', f('lunchTo','time','step="1800"'))+'<div></div>')+
      aField(t('休诊日'), dow), '日历的行按营业时间生成；午休不能预约；时段长度固定 30 分钟。')+
    aSection(t('预约规则'),
      aGrid(3, aField(t('预约占位倒计时（分钟）'), f('holdMinutes','number','min="1" max="120"'), '默认 15')+aField(t('未到店判定（分钟）'), f('noShowMinutes','number','min="5" max="240"'), '默认 30')+
        aField(t('面诊费（印尼盾）'), f('consultFee','number','min="0" step="1000"'))+
        aField(t('每个时段的预约上限'), f('slotCapacity','number','min="1" max="50"'), '客户自助预约：时段预约数达到上限就不能再选')+
        aField(t('提醒短信发送时间')+' · '+t('预约开始前（小时）'), f('remindBeforeHours','number','min="1" max="72"'))), '赴韩定金比例不在这里（GMC 统一设定）。')+
    aSection(t('短信模板'), sms, '可用变量：{clinic} 诊所名称、{name} 客人姓名、{time} 预约时间、{address} 地址、{phone} 电话、{url} 客人端网址、{code} 验证码（验证码短信格式固定，不在这里改）。')+
    aSection(t('使用政策与同意书'),
      aGrid(2, aField(t('同意书版本'), f('privacyVersion'), '改版本后，客户详情「隐私协议」仍按客人签署时的版本显示')) +
      aField(t('隐私政策'), '<textarea rows="4" data-k="privacyPolicy" oninput="clinicSet(this)" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;">'+aEsc(d.privacyPolicy)+'</textarea>'),
      '客户自助预约页的「同意」步骤显示这里的隐私政策，并记录同意书版本 + 时间。');
  el.insertAdjacentHTML('beforeend',
    aSection(t('合作医院（只读）'),
      '<div style="font-size:13px;line-height:2;"><b>'+t('韩国医院')+'：</b>'+aEsc(KR_HOSPITAL_NAME)+'<br><b>'+t('韩国室长')+'：</b>'+KR_COORDINATORS.map(aEsc).join('、')+'<br><b>'+t('院长名单')+'：</b>'+directors+'</div>', '来源：韩国端维护，这里只读。')+
    '<div id="clinic-err" class="error-text" style="display:none;"></div>'+
    '<div style="display:flex;gap:10px;align-items:center;"><button class="btn-primary" onclick="saveClinicSettings()">'+t('保存设定')+'</button><button class="btn-outline" onclick="clinicDraftFresh();openAdminPage(\'clinic\',true)">'+t('取消')+'</button>'+
    '<span style="font-size:11px;color:var(--muted);">'+t('保存后立即生效，并通知所有室长')+'</span></div>');
};
/* 草稿：path 形如 'name' 或 'sms.link' */
function clinicSet(inp){
  var k = inp.getAttribute('data-k'), v = inp.value;
  if(inp.type==='number') v = v==='' ? '' : Number(v);
  if(k.indexOf('sms.')===0) CLINIC_DRAFT.sms[k.slice(4)] = v; else CLINIC_DRAFT[k] = v;
}
function clinicToggleDow(i, on){
  var a = CLINIC_DRAFT.closedDow, p = a.indexOf(i);
  if(on && p<0) a.push(i); else if(!on && p>-1) a.splice(p, 1);
  a.sort();
}
function clinicErr(msg){ var e = document.getElementById('clinic-err'); if(e){ e.textContent = msg; e.style.display = msg ? 'block' : 'none'; } }
function clinicValidate(d){
  var tm = /^\d\d:\d\d$/;
  if(!String(d.name).trim()) return '诊所名称不能为空';
  if(!String(d.address).trim()) return '地址不能为空';
  if(!String(d.phone).trim()) return '电话不能为空';
  var keys = ['openTime','closeTime','bookFrom','bookTo','lunchFrom','lunchTo'];
  for(var i=0;i<keys.length;i++) if(!tm.test(d[keys[i]]||'')) return '请填写完整的时间：'+CLINIC_FIELD_LABELS[keys[i]];
  var m = function(k){ return timeToMin(d[k]); };
  if(m('openTime') >= m('closeTime')) return '营业结束必须晚于营业开始';
  if(m('bookFrom') < m('openTime') || m('bookTo') >= m('closeTime') || m('bookFrom') > m('bookTo')) return '可预约时段必须在营业时间内（最晚时段要早于营业结束）';
  if(m('lunchFrom') >= m('lunchTo')) return '午休结束必须晚于午休开始';
  if(m('lunchFrom') < m('openTime') || m('lunchTo') > m('closeTime')) return '午休必须在营业时间内';
  var num = function(k, lo, hi){ var v = d[k]; return typeof v==='number' && isFinite(v) && v>=lo && v<=hi && Math.floor(v)===v; };
  if(!num('holdMinutes',1,120)) return '预约占位倒计时请填 1～120 之间的整数分钟';
  if(!num('noShowMinutes',5,240)) return '未到店判定请填 5～240 之间的整数分钟';
  if(!num('consultFee',0,100000000)) return '面诊费请填不小于 0 的整数';
  if(!num('slotCapacity',1,50)) return '每个时段的预约上限请填 1～50 的整数';
  if(!num('remindBeforeHours',1,72)) return '提醒短信发送时间请填 1～72 小时';
  var ks = Object.keys(SMS_KIND_LABELS);
  for(var j=0;j<ks.length;j++) if(!String(d.sms[ks[j]]||'').trim()) return SMS_KIND_LABELS[ks[j]]+'的模板不能为空';
  if(!String(d.privacyVersion).trim()) return '同意书版本不能为空';
  if(!String(d.privacyPolicy).trim()) return '隐私政策不能为空';
  return '';
}
function clinicDiff(oldS, newS){
  var ch = [], show = function(k, v){ if(k==='closedDow') return v.length ? v.map(function(i){ return DOW_NAMES[i]; }).join('、') : '无'; if(k==='tz') return v; if(k==='consultFee') return fmtRp(v); return String(v); };
  Object.keys(CLINIC_FIELD_LABELS).forEach(function(k){
    if(JSON.stringify(oldS[k]) !== JSON.stringify(newS[k])) ch.push(CLINIC_FIELD_LABELS[k]+'：'+(k==='privacyPolicy' ? '（已修改）' : show(k, oldS[k])+' → '+show(k, newS[k])));
  });
  Object.keys(SMS_KIND_LABELS).forEach(function(k){ if(oldS.sms[k] !== newS.sms[k]) ch.push(SMS_KIND_LABELS[k]+'：（已修改）'); });
  return ch;
}
function saveClinicSettings(){
  if(!canDo('clinic')) return;
  var d = CLINIC_DRAFT; d.name = String(d.name).trim(); d.address = String(d.address).trim();
  var err = clinicValidate(d); clinicErr(err); if(err) return;
  var ch = clinicDiff(CLINIC_SETTINGS, d);
  if(!ch.length){ showToast('没有修改', '设定和之前一样', null); return; }
  var who = accountLabel(currentAccountId());
  Object.keys(d).forEach(function(k){ CLINIC_SETTINGS[k] = (d[k] && typeof d[k]==='object') ? JSON.parse(JSON.stringify(d[k])) : d[k]; });
  CLINIC_SETTINGS.updatedAt = nowFullDt(); CLINIC_SETTINGS.updatedBy = who;
  applyClinicSettings();
  try{ renderCalendar(); }catch(e){}
  logOp('设定变更', '诊所设定：'+ch.join('；'));
  pushNotif('系统', who+' 更新了诊所设定：'+ch.join('；'), {names:IN_COORDINATORS.slice(), link:{kind:'system'}, detail:{title:'诊所设定更新', changes:ch, effective:'保存后立即生效（'+CLINIC_SETTINGS.updatedAt+'，由 '+who+' 修改）'}});
  clinicDraftFresh();
  openAdminPage('clinic', true);
  showToast('诊所设定已保存', '已立即生效，并通知所有室长', null);
}

/* ================= 账号管理（老板、管理者；IN-SETT-01 第 3 节，A6） ================= */
var ROLE_SHORT = {owner:'老板', manager:'管理者', general:'一般室长'};
var STATUS_STYLE = {active:['使用中','var(--sage-bg)','var(--sage)'], pending:['待激活','#FBF0C9','#8F6F0C'], disabled:['已停用','#EDEAE2','var(--muted)']};
var ACCOUNT_PRICE_TEXT = '价格待定'; /* Notion：价格、计费周期待代表确认 */
function acctStatusPill(a){ var s = STATUS_STYLE[a.status]; return '<span class="status-pill" style="background:'+s[1]+';color:'+s[2]+';">'+s[0]+'</span>'; }

/* 老板顶部横幅：管理者申请加购管理者账号时，验证码演示在老板的页面里显示 */
function adminBanner(){
  var a = currentAccount(), r = PURCHASE_REQ;
  if(!a || a.role!=='owner' || !r || r.used || Date.now() > r.exp) return '';
  return '<div style="background:#FBF0C9;color:#8F6F0C;border-radius:10px;padding:12px 16px;font-size:13px;line-height:1.7;">🔐 <b>验证码（演示）</b>：'+aEsc(accountLabel(r.by))+' 申请加购 '+r.qty+' 个管理者账号，需要你确认。验证码 <b style="font-size:16px;letter-spacing:2px;">'+r.code+'</b>（'+Math.max(1, Math.round((r.exp-Date.now())/60000))+' 分钟内有效），请告诉对方。真实版会发到老板的手机/通知。</div>';
}

function acctRowsHtml(){
  var me = currentAccount();
  var order = {owner:0, manager:1, general:2};
  var list = ACCOUNTS.slice().sort(function(x,y){ return (order[x.role]-order[y.role]) || (x.id==='OWN' ? -1 : y.id==='OWN' ? 1 : parseInt(x.id.slice(1),10)-parseInt(y.id.slice(1),10)); });
  var head = '<div class="trow head" style="grid-template-columns:0.7fr 1fr 2.2fr 1fr 1fr;"><span>账号 ID</span><span>类型</span><span>当前使用人</span><span>席位</span><span>状态</span></div>';
  return head + list.map(function(a){
    var who = a.status==='pending' ? '<span style="color:var(--muted);">（还没有使用人）</span>' :
      '<span style="display:inline-flex;align-items:center;gap:10px;">'+acctPhotoHtml(a, 30)+'<span><b>'+aEsc(a.name)+'</b><span style="color:var(--muted);font-size:11px;margin-left:6px;">'+aEsc(a.position||'')+'</span></span></span>';
    return '<div class="trow" style="grid-template-columns:0.7fr 1fr 2.2fr 1fr 1fr;cursor:pointer;" onclick="openAcctDetail(\''+a.id+'\')"><span><b>'+a.id+'</b>'+(a.id===me.id?'<span style="font-size:10px;color:var(--navy);margin-left:6px;">我</span>':'')+'</span><span>'+ROLE_SHORT[a.role]+'</span><span>'+who+'</span><span>'+(a.seat==='basic'?'基础':'加购')+'</span><span>'+acctStatusPill(a)+'</span></div>';
  }).join('');
}
ADMIN_RENDER.accounts = function(el){
  var cnt = function(role, seat){ return ACCOUNTS.filter(function(a){ return a.role===role && a.seat===seat && a.status!=='disabled'; }).length; };
  var addonMgr = cnt('manager','addon'), addonGen = cnt('general','addon'), pend = ACCOUNTS.filter(function(a){ return a.status==='pending'; }).length;
  var stat = function(label, big, sub){ return '<div class="card" style="padding:14px 18px;flex:1;min-width:150px;"><div style="font-size:11px;color:var(--muted);">'+label+'</div><div style="font-size:22px;font-weight:700;margin:4px 0;">'+big+'</div><div style="font-size:11px;color:var(--slate2);">'+sub+'</div></div>'; };
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;"><div style="font-size:18px;font-weight:700;">'+t('账号管理')+'</div>'+
    '<button class="btn-primary" onclick="openBuyAccounts()">＋ 加购账号</button></div>'+
    '<div style="display:flex;gap:12px;flex-wrap:wrap;">'+
      stat('基本席位', '3 个', '老板 1 · 管理者 1 · 一般室长 1（不能退订）')+
      stat('加购管理者', addonMgr+' 个', ACCOUNT_PRICE_TEXT)+
      stat('加购一般室长', addonGen+' 个', ACCOUNT_PRICE_TEXT)+
      stat('待激活', pend+' 个', '已购买/已重设，等使用人激活')+
    '</div>'+
    '<div class="card" style="padding:4px 20px;">'+acctRowsHtml()+'</div>'+
    '<div style="font-size:11px;color:var(--muted);line-height:1.7;">点一行看使用人历史和该账号的操作记录。重设密码：账号变"待激活"，原使用人立即登出，下一位在登录页用"首次激活"接手（自己填手机号、设密码、填姓名/职位/证件照）；只能重设，不能替别人设密码。退订只对加购账号，立即停用，之前的记录保留。</div>';
};

/* ---- 通用弹窗（账号详情、确认、加购共用一个壳） ---- */
function acctModal(html){
  var ov = document.getElementById('acct-overlay');
  if(!ov){ ov = document.createElement('div'); ov.className = 'modal-overlay'; ov.id = 'acct-overlay'; ov.style.zIndex = 90; ov.onclick = function(e){ if(e.target===ov) closeAcctModal(); }; document.body.appendChild(ov); }
  ov.innerHTML = html; ov.classList.add('open');
}
function closeAcctModal(){ var ov = document.getElementById('acct-overlay'); if(ov) ov.classList.remove('open'); }
function acctCanReset(a){ var me = currentAccount(); return !!(me && a.status==='active' && a.role!=='owner' && a.id!==me.id); }
function acctCanUnsub(a){ var me = currentAccount(); return !!(me && a.seat==='addon' && a.status!=='disabled' && a.id!==me.id); }

function openAcctDetail(id){
  var a = accountById(id); if(!a) return;
  var hist = (a.history||[]).slice().reverse().map(function(h){ return '<div style="padding:7px 0;border-bottom:1px solid var(--border2);font-size:12px;line-height:1.6;"><span style="color:var(--muted);">'+h.ts+'</span>　<b>'+aEsc(h.type)+'</b>　'+aEsc(h.text)+'<span style="color:var(--muted);">　—— '+aEsc(h.by||'')+'</span></div>'; }).join('') || '<div style="font-size:12px;color:var(--muted);">暂无</div>';
  var logs = ACCOUNT_LOG.filter(function(l){ return l.target===id; }).map(function(l){ return '<div style="padding:7px 0;border-bottom:1px solid var(--border2);font-size:12px;line-height:1.6;"><span style="color:var(--muted);">'+l.ts+'</span>　'+aEsc(l.text)+'<span style="color:var(--muted);">　—— '+aEsc(l.name||'')+'（'+aEsc(l.accountId)+'）</span></div>'; }).join('') || '<div style="font-size:12px;color:var(--muted);">暂无</div>';
  var btns = (acctCanReset(a) ? '<button class="btn-outline" onclick="confirmResetAcct(\''+id+'\')">重设密码</button>' : '')+
    (a.seat==='addon' && acctCanUnsub(a) ? '<button class="btn-outline" style="color:#C1454A;border-color:#C1454A;" onclick="confirmUnsubAcct(\''+id+'\')">退订</button>' : '');
  acctModal('<div class="modal-box" style="width:560px;max-height:84vh;overflow-y:auto;">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-size:15px;font-weight:700;">账号 '+id+' · '+ROLE_SHORT[a.role]+'</span><span style="cursor:pointer;color:var(--slate);" onclick="closeAcctModal()">✕</span></div>'+
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">'+(a.status==='pending'?'':acctPhotoHtml(a, 52))+'<div style="font-size:13px;line-height:1.8;">'+(a.status==='pending'?'<span style="color:var(--muted);">（还没有使用人）</span>':'<b>'+aEsc(a.name)+'</b> · '+aEsc(a.position||'—')+'<br>手机 '+aEsc(a.phone||'—'))+'<br>'+acctStatusPill(a)+'　'+(a.seat==='basic'?'基础席位（不能退订）':'加购账号')+'</div></div>'+
    '<div style="font-size:13px;font-weight:700;margin:6px 0;">使用人历史</div>'+hist+
    '<div style="font-size:13px;font-weight:700;margin:14px 0 6px;">该账号的操作记录</div>'+logs+
    '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">'+btns+'<button class="btn-primary" onclick="closeAcctModal()">关闭</button></div></div>');
}

function acctConfirm(title, text, okLabel, okJs, danger){
  acctModal('<div class="modal-box" style="width:420px;"><div style="font-size:15px;font-weight:700;margin-bottom:10px;">'+title+'</div><div style="font-size:13px;line-height:1.8;margin-bottom:16px;">'+text+'</div>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn-outline" onclick="closeAcctModal()">取消</button><button class="btn-primary" style="'+(danger?'background:#C1454A;':'')+'" onclick="'+okJs+'">'+okLabel+'</button></div></div>');
}
function confirmResetAcct(id){
  var a = accountById(id); if(!a || !acctCanReset(a)) return;
  acctConfirm('重设密码', '账号 <b>'+id+'</b>（当前使用人 <b>'+aEsc(a.name)+'</b>）将变成「待激活」，原使用人<b>立即登出</b>；下一位使用人需要在登录页用「首次激活」接手。确定重设吗？', '确定重设', 'doResetAcct(\''+id+'\')');
}
function doResetAcct(id){
  var a = accountById(id); if(!a || !acctCanReset(a)) return;
  var me = currentAccount(), old = a.name, ts = nowFullDt();
  a.history.push({ts:ts, type:'重设', text:'重设密码：原使用人 '+old+' 立即登出，账号变待激活', by:accountLabel(me.id)});
  a.status = 'pending'; a.password = null; a.name = ''; a.position = ''; a.photo = ''; a.phone = ''; a.activatedAt = '';
  logOp('账号管理', accountLabel(me.id)+' 重设了账号 '+id+' 的密码（原使用人 '+old+'）', '重设', id);
  syncInCoordinators();
  closeAcctModal(); openAdminPage('accounts', true);
  showToast('已重设 '+id, '账号变为待激活，原使用人已登出', null);
}
function confirmUnsubAcct(id){
  var a = accountById(id); if(!a || !acctCanUnsub(a)) return;
  var who = a.status==='pending' ? '（还没有使用人）' : '（当前使用人 <b>'+aEsc(a.name)+'</b>）';
  acctConfirm('退订账号', '<b>'+id+'</b>'+who+'会立刻无法登录，确定退订吗？之前的记录会保留。', '确定退订', 'doUnsubAcct(\''+id+'\')', true);
}
function doUnsubAcct(id){
  var a = accountById(id); if(!a || !acctCanUnsub(a)) return;
  var me = currentAccount(), old = a.name, ts = nowFullDt();
  a.history.push({ts:ts, type:'退订', text:'退订加购账号'+(old?'（使用人 '+old+'）':''), by:accountLabel(me.id)});
  a.status = 'disabled'; a.disabledAt = ts;
  logOp('账号管理', accountLabel(me.id)+' 退订了加购账号 '+id+(old?'（'+old+'）':''), '退订', id);
  syncInCoordinators();
  closeAcctModal(); openAdminPage('accounts', true);
  showToast('已退订 '+id, '账号已停用，记录保留', null);
}

/* ---- 加购：选类型和数量 →（管理者加购管理者账号：先要老板验证码）→ 演示付款 → 生成新账号（待激活） ---- */
var BUY = {role:'general', qty:1, step:'pick', err:''};
function openBuyAccounts(){ BUY = {role:'general', qty:1, step:'pick', err:''}; renderBuy(); }
function buyNeedsOwnerCode(){ var me = currentAccount(); return BUY.role==='manager' && me && me.role!=='owner'; }
function renderBuy(){
  var err = BUY.err ? '<div class="error-text" style="display:block;margin-bottom:10px;">'+BUY.err+'</div>' : '', body = '';
  if(BUY.step==='pick'){
    body = '<div class="field" style="margin-bottom:12px;"><label>账号类型</label><select onchange="BUY.role=this.value;renderBuy()" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;"><option value="general"'+(BUY.role==='general'?' selected':'')+'>一般室长账号</option><option value="manager"'+(BUY.role==='manager'?' selected':'')+'>管理者账号</option></select></div>'+
      '<div class="field" style="margin-bottom:12px;"><label>数量</label><input type="number" min="1" max="10" value="'+BUY.qty+'" oninput="BUY.qty=parseInt(this.value,10)||0" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;"></div>'+
      '<div style="font-size:12px;color:var(--slate2);margin-bottom:12px;">单价：'+ACCOUNT_PRICE_TEXT+'（演示付款，不收真实款项）。'+(buyNeedsOwnerCode()?'<br><b>管理者加购管理者账号，需要老板确认：</b>点下一步后验证码会发给老板，你输入老板告诉你的验证码后才能付款。':'')+'</div>'+
      err+'<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn-outline" onclick="closeAcctModal()">取消</button><button class="btn-primary" onclick="buyNext()">'+(buyNeedsOwnerCode()?'下一步：发验证码给老板':'下一步：付款')+'</button></div>';
  } else if(BUY.step==='code'){
    body = '<div style="font-size:13px;line-height:1.8;margin-bottom:12px;">验证码已发给老板（演示：老板登录后在页面顶部看到验证码；另一个标签页用老板账号 OWN 登录即可）。请输入老板告诉你的 6 位验证码。</div>'+
      '<div class="field" style="margin-bottom:12px;"><input id="buy-code" type="text" maxlength="6" placeholder="6 位验证码" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:15px;letter-spacing:3px;"></div>'+
      err+'<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn-outline" onclick="closeAcctModal()">取消</button><button class="btn-outline" onclick="buyNext(true)">重新发送</button><button class="btn-primary" onclick="buyVerify()">验证</button></div>';
  } else {
    body = '<div style="font-size:13px;line-height:1.8;margin-bottom:12px;">购买 <b>'+BUY.qty+'</b> 个'+(BUY.role==='manager'?'管理者':'一般室长')+'账号，单价'+ACCOUNT_PRICE_TEXT+'。<br>付款后生成新账号编号（待激活），把编号交给使用人，让 TA 在登录页点「首次激活」。</div>'+
      '<div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn-outline" onclick="closeAcctModal()">取消</button><button class="btn-primary" onclick="buyPay()">演示付款</button></div>';
  }
  acctModal('<div class="modal-box" style="width:440px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-size:15px;font-weight:700;">加购账号</span><span style="cursor:pointer;color:var(--slate);" onclick="closeAcctModal()">✕</span></div>'+body+'</div>');
}
function buyNext(resend){
  if(!(BUY.qty>=1 && BUY.qty<=10)){ BUY.err = '数量请填 1～10'; return renderBuy(); }
  BUY.err = '';
  if(buyNeedsOwnerCode()){
    var me = currentAccount();
    PURCHASE_REQ = {code:String(100000+Math.floor(Math.random()*900000)), by:me.id, qty:BUY.qty, exp:Date.now()+10*60000, used:false};
    var owner = ACCOUNTS.filter(function(x){ return x.role==='owner' && x.name; })[0];
    pushNotif('系统', accountLabel(me.id)+' 申请加购 '+BUY.qty+' 个管理者账号，验证码 '+PURCHASE_REQ.code+'（10 分钟内有效）', {names:owner?[owner.name]:[], silent:true, link:{kind:'system'}});
    BUY.step = 'code'; if(resend) showToast('验证码已重新发送', '给老板', null);
  } else BUY.step = 'pay';
  renderBuy();
}
function buyVerify(){
  var r = PURCHASE_REQ, c = (document.getElementById('buy-code')||{}).value||'';
  if(!r || r.used || Date.now() > r.exp){ BUY.err = '验证码已过期，请重新发送'; return renderBuy(); }
  if(c.trim() !== r.code){ BUY.err = '验证码不对'; return renderBuy(); }
  r.used = true; BUY.err = ''; BUY.step = 'pay'; renderBuy();
}
function buyPay(){
  var me = currentAccount(), ids = [], ts = nowFullDt(), roleName = BUY.role==='manager' ? '管理者' : '一般室长';
  for(var i=0;i<BUY.qty;i++){
    var id = 'A'+(++ACCOUNT_SEQ);
    ACCOUNTS.push({id:id, role:BUY.role, seat:'addon', name:'', position:'', phone:'', status:'pending', password:null, photo:'', createdAt:ts, activatedAt:'',
      history:[{ts:ts, type:'购买', text:'加购账号 '+id+'（'+roleName+'）'+(BUY.role==='manager' && me.role!=='owner' ? '，老板验证码确认' : '')+'，待激活', by:accountLabel(me.id)}]});
    logOp('账号管理', accountLabel(me.id)+' 购买了加购'+roleName+'账号 '+id+(BUY.role==='manager' && me.role!=='owner' ? '（老板验证码确认）' : ''), '购买', id);
    ids.push(id);
  }
  closeAcctModal(); openAdminPage('accounts', true);
  showToast('购买成功', ids.join('、')+' 待激活：把编号交给使用人，在登录页「首次激活」', null);
}

/* ================= 经营数据（老板、管理者；A7 基础版，只显示汇总数字，不显示个别客人） =================
   具体要看哪些数字之后再讨论（Notion Accounts & Settings 第 6 节"待确认"）。口径是我的判断，见 docs/accounts-settings.md。 */
var BIZ_MONTH = 'cur'; /* 'cur' 本月 / 'all' 全部 / 'YYYY-MM' */
function bizCaseMonth(c){ var d = (c.logEntries && c.logEntries[0] && c.logEntries[0].dt) ? c.logEntries[0].dt.slice(0,10) : (c.visitDate || D(0)); return d.slice(0,7); }
function bizSetMonth(v){ BIZ_MONTH = v; openAdminPage('bizdata', true); }
ADMIN_RENDER.bizdata = function(el){
  var curM = D(0).slice(0,7);
  var months = {}; months[curM] = 1; CASE_ITEMS.forEach(function(c){ months[bizCaseMonth(c)] = 1; });
  var monthList = Object.keys(months).sort().reverse();
  var want = BIZ_MONTH==='cur' ? curM : BIZ_MONTH;
  var cs = CASE_ITEMS.filter(function(c){ return want==='all' || bizCaseMonth(c)===want; });
  var cnt = function(st){ return cs.filter(function(c){ return c.stage===st; }).length; };
  var closed = cnt('closed'), report = cnt('reportonly'), cancelled = cnt('cancelled'), ongoing = cs.length - closed - report - cancelled;
  var consultCases = cs.filter(function(c){ return consultFeePaid(c) || c.consultFeeWaived || c.reportReady; });
  var travelCases = consultCases.filter(function(c){ return krAllItems(c).length > 0; });
  var ratio = consultCases.length ? Math.round(travelCases.length*100/consultCases.length) : 0;
  var feeCount = cs.filter(consultFeePaid).length, feeSum = feeCount * CLINIC_SETTINGS.consultFee;
  var localSum = 0, krDeposit = 0;
  cs.forEach(function(c){ var p = financePaid(c); localSum += p.inn; krDeposit += Math.max(0, p.kr - refundSum(c)); });
  var perCoord = {};
  cs.forEach(function(c){ var ops = caseOperators(c, true).inn; if(!ops.length) ops = ['（无操作记录）']; ops.forEach(function(n){ var o = perCoord[n] = perCoord[n] || {total:0, closed:0}; o.total++; if(c.stage==='closed') o.closed++; }); });
  var coordNames = Object.keys(perCoord).sort(function(a,b){ return perCoord[b].total - perCoord[a].total; });
  var maxC = Math.max.apply(null, [1].concat(coordNames.map(function(n){ return perCoord[n].total; })));
  var tile = function(label, big, sub, color){ return '<div class="card" style="padding:14px 18px;flex:1;min-width:140px;"><div style="font-size:11px;color:var(--muted);">'+label+'</div><div style="font-size:24px;font-weight:700;margin:4px 0;'+(color?'color:'+color+';':'')+'">'+big+'</div><div style="font-size:11px;color:var(--slate2);">'+sub+'</div></div>'; };
  var bar = function(label, n, max, color, right){ return '<div style="display:flex;align-items:center;gap:12px;padding:7px 0;font-size:13px;"><span style="width:150px;flex-shrink:0;">'+label+'</span><span style="flex:1;background:var(--border2);border-radius:6px;height:12px;overflow:hidden;"><span style="display:block;height:100%;width:'+Math.round(n*100/max)+'%;background:'+color+';"></span></span><span style="width:110px;text-align:right;font-weight:700;">'+(right||n)+'</span></div>'; };
  var opts = '<option value="cur"'+(BIZ_MONTH==='cur'?' selected':'')+'>本月（'+curM+'）</option><option value="all"'+(BIZ_MONTH==='all'?' selected':'')+'>全部</option>'+
    monthList.filter(function(m){ return m!==curM; }).map(function(m){ return '<option value="'+m+'"'+(BIZ_MONTH===m?' selected':'')+'>'+m+'</option>'; }).join('');
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;"><div style="font-size:18px;font-weight:700;">'+t('经营数据')+'</div>'+
    '<select onchange="bizSetMonth(this.value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;">'+opts+'</select></div>'+
    '<div style="display:flex;gap:12px;flex-wrap:wrap;">'+tile('案件总数', cs.length, '按案件开始的月份统计')+tile('已结案', closed, '客人做了项目/有购买', 'var(--sage)')+tile('仅出报告', report, '只做了面诊出报告')+tile('已取消', cancelled, '未到店/取消/未购买')+tile('进行中', ongoing, '还没到终态')+'</div>'+
    aSection('面诊 → 赴韩', '<div style="display:flex;gap:28px;flex-wrap:wrap;align-items:flex-end;"><div><div style="font-size:11px;color:var(--muted);">面诊案件</div><div style="font-size:24px;font-weight:700;">'+consultCases.length+'</div></div><div><div style="font-size:11px;color:var(--muted);">其中选了赴韩项目</div><div style="font-size:24px;font-weight:700;">'+travelCases.length+'</div></div><div><div style="font-size:11px;color:var(--muted);">赴韩比例</div><div style="font-size:24px;font-weight:700;color:var(--navy);">'+ratio+'%</div></div></div>',
      '面诊案件 = 缴过面诊费、免除面诊费或已出报告的案件；赴韩比例 = 面诊案件里有赴韩项目的占比。')+
    aSection('收入（各币种分开，不相加）', '<div style="display:flex;gap:12px;flex-wrap:wrap;">'+tile('面诊费', fmtRp(feeSum), feeCount+' 个案件缴费（按当前面诊费 '+fmtRp(CLINIC_SETTINGS.consultFee)+' 估算）')+tile('本地项目', fmtRp(localSum), '本地项目已收款（印尼盾）')+tile('赴韩定金', formatCurrency(krDeposit,'KRW'), '已收定金，扣除已退款（韩元）')+'</div>',
      '免除面诊费的案件不计收入；赴韩定金比例是 GMC 统一设定的演示占位值。')+
    aSection('每位室长处理的案件数', coordNames.length ? coordNames.map(function(n){ var o = perCoord[n]; return bar(staffLabel(n), o.total, maxC, 'var(--navy)', o.total+' 件 · 已结案 '+o.closed); }).join('') : '<div style="font-size:12px;color:var(--muted);">这个月份没有案件</div>',
      '按案件 Timeline 里的操作记录统计，一个案件有多位室长操作时每人各算一件。')+
    '<div style="font-size:11px;color:var(--muted);">待讨论：具体要看哪些数字、是否要趋势图/导出（这是基础版）。</div>';
};

/* ================= 操作日志（老板、管理者；A8） =================
   记录：购买 / 退订 / 重设 / 激活（换使用人）/ 诊所设定变更；显示时间、操作账号与当时使用人、内容。数据 ACCOUNT_LOG（logOp 写入）。 */
var OPLOG_FILTER = {cat:'all', sub:'all', from:'', to:''};
var OPLOG_SUBS = ['购买','退订','重设','激活'];
/* 老数据没有 sub：按文字推断；分类：账号 / 设定变更 / 其他 */
function oplogCat(l){ return l.type==='设定变更' ? 'setting' : (l.type==='账号管理' ? 'account' : 'other'); }
function oplogSub(l){
  if(l.sub) return l.sub;
  var s = String(l.text||'');
  return /购买|加购/.test(s) && !/取消|退订/.test(s) ? '购买' : /取消加购|退订/.test(s) ? '退订' : /重设/.test(s) ? '重设' : /激活/.test(s) ? '激活' : '';
}
function oplogSet(k, v){ OPLOG_FILTER[k] = v; if(k==='cat') OPLOG_FILTER.sub = 'all'; openAdminPage('oplog', true); }
ADMIN_RENDER.oplog = function(el){
  var f = OPLOG_FILTER;
  var rows = ACCOUNT_LOG.filter(function(l){
    if(f.cat!=='all' && oplogCat(l)!==f.cat) return false;
    if(f.cat==='account' && f.sub!=='all' && oplogSub(l)!==f.sub) return false;
    var d = String(l.ts||'').slice(0,10);
    if(f.from && d < f.from) return false;
    if(f.to && d > f.to) return false;
    return true;
  }).sort(function(a,b){ return String(b.ts).localeCompare(String(a.ts)); });
  var chip = function(label, active, js){ return '<span class="chip'+(active?' active':'')+'" onclick="'+js+'">'+label+'</span>'; };
  var cats = [['all','全部'],['account','账号'],['setting','设定变更'],['other','其他']];
  var chips = cats.map(function(c){ return chip(c[1], f.cat===c[0], 'oplogSet(\'cat\',\''+c[0]+'\')'); }).join('');
  var subs = f.cat==='account' ? '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><span style="font-size:12px;color:var(--muted);">账号操作：</span>'+chip('全部', f.sub==='all', 'oplogSet(\'sub\',\'all\')')+OPLOG_SUBS.map(function(s){ return chip(s, f.sub===s, 'oplogSet(\'sub\',\''+s+'\')'); }).join('')+'</div>' : '';
  var tableRows = rows.map(function(l){
    var sub = oplogSub(l), tag = l.type==='设定变更' ? '设定变更' : (sub || l.type || '其他');
    return '<div class="trow" style="grid-template-columns:1.1fr 1.3fr 0.8fr 4fr;align-items:flex-start;"><span style="color:var(--slate2);">'+aEsc(l.ts)+'</span><span><b>'+aEsc(l.name||'—')+'</b>（'+aEsc(l.accountId)+'）</span><span><span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+aEsc(tag)+'</span></span><span style="line-height:1.6;">'+aEsc(l.text)+'</span></div>';
  }).join('');
  el.innerHTML = '<div style="font-size:18px;font-weight:700;">'+t('操作日志')+'</div>'+
    '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;"><div style="display:flex;gap:8px;flex-wrap:wrap;">'+chips+'</div>'+
    '<div style="display:flex;gap:8px;align-items:center;font-size:12px;color:var(--slate2);">日期 <input type="date" value="'+f.from+'" onchange="oplogSet(\'from\',this.value)" style="padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:12px;"> ～ <input type="date" value="'+f.to+'" onchange="oplogSet(\'to\',this.value)" style="padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:12px;">'+
    ((f.from||f.to) ? ' <a href="#" onclick="OPLOG_FILTER.from=\'\';OPLOG_FILTER.to=\'\';openAdminPage(\'oplog\',true);return false;" style="color:var(--navy);">清除日期</a>' : '')+'</div></div>'+subs+
    '<div class="card" style="padding:4px 20px;"><div class="trow head" style="grid-template-columns:1.1fr 1.3fr 0.8fr 4fr;"><span>时间</span><span>操作账号（当时使用人）</span><span>类型</span><span>内容</span></div>'+
    (tableRows || '<div style="padding:18px 0;font-size:12px;color:var(--muted);">没有符合条件的记录</div>')+'</div>'+
    '<div style="font-size:11px;color:var(--muted);">共 '+rows.length+' 条。姓名是操作当时的使用人；账号以后换了人，这里仍显示当时的名字。</div>';
};


/* ================= 短信发送记录（老板、管理者，在诊所设定旁边；B4） =================
   所有演示短信（验证码 / 预约链接 / 确认 / 提醒 / 取消）都记在 SMS_LOG，方便检查"发了什么、发给谁"。 */
var SMSLOG_KIND = 'all';
function smslogSet(k){ SMSLOG_KIND = k; openAdminPage('smslog', true); }
function smslogRemindNow(){
  var n = checkReminders(true);
  showToast(n ? '已发送 '+n+' 条提醒短信' : '没有需要发送的提醒', n ? '演示：立刻触发（正常情况下按诊所设定的发送时间自动发）' : '待访问预约都已发过提醒，或预约时间已过', null);
  openAdminPage('smslog', true);
}
ADMIN_RENDER.smslog = function(el){
  var rows = SMS_LOG.filter(function(s){ return SMSLOG_KIND==='all' || s.kind===SMSLOG_KIND; });
  var chip = function(label, active, js){ return '<span class="chip'+(active?' active':'')+'" onclick="'+js+'">'+label+'</span>'; };
  var chips = chip('全部', SMSLOG_KIND==='all', 'smslogSet(\'all\')')+Object.keys(SMS_KIND_NAMES).map(function(k){ return chip(SMS_KIND_NAMES[k], SMSLOG_KIND===k, 'smslogSet(\''+k+'\')'); }).join('');
  var caseNo = function(id){ var c = id ? CASE_ITEMS.filter(function(x){ return x.id===id; })[0] : null; return c ? c.caseNo : '—'; };
  var tr = rows.map(function(s){
    return '<div class="trow" style="grid-template-columns:1.1fr 1.2fr 0.8fr 0.8fr 4fr;align-items:flex-start;"><span style="color:var(--slate2);">'+aEsc(s.ts)+'</span><span>'+aEsc(s.to||'—')+'</span><span><span class="status-pill" style="background:var(--border2);color:var(--slate2);">'+aEsc(SMS_KIND_NAMES[s.kind]||s.kind)+'</span></span><span>'+aEsc(caseNo(s.caseId))+'</span><span style="line-height:1.6;word-break:break-all;">'+aEsc(s.text)+'</span></div>';
  }).join('');
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;"><div style="font-size:18px;font-weight:700;">'+t('短信发送记录')+'</div>'+
    '<button class="btn-outline" onclick="smslogRemindNow()">演示：立即发送提醒短信</button></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+chips+'</div>'+
    '<div class="card" style="padding:4px 20px;"><div class="trow head" style="grid-template-columns:1.1fr 1.2fr 0.8fr 0.8fr 4fr;"><span>时间</span><span>发给</span><span>类型</span><span>Case ID</span><span>内容</span></div>'+
    (tr || '<div style="padding:18px 0;font-size:12px;color:var(--muted);">还没有短信</div>')+'</div>'+
    '<div style="font-size:11px;color:var(--muted);line-height:1.7;">共 '+rows.length+' 条（最多保留最近 300 条）。演示：短信没有真的发出。验证码格式固定；预约链接 / 确认 / 提醒 / 取消的模板在「诊所设定」里编辑。提醒短信按诊所设定的"预约开始前 '+CLINIC_SETTINGS.remindBeforeHours+' 小时"自动发送（演示时钟判断，IN 端页面打开时每 10 秒检查一次）。</div>';
};
