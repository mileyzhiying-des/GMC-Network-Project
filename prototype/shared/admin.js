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
