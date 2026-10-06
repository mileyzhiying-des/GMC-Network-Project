/* shared/i18n.js —— 多语言（2026-10-06·A5，共用）
   - IN 端 / 老板端界面语言：韩 / 印尼 / 中，每个账号各自设定（ACCOUNTS[].lang，个人设定里改，只影响自己）。
     中文是原文；韩文、印尼文目前只翻译了侧边栏、顶栏、头像菜单、常用按钮和设定页，其余页面显示中文（TODO 见 docs/accounts-settings.md）。
     用法：t('中文原文') 返回当前语言的译文（没有译文就返回中文）；另外 i18nStart() 会监视页面，把"整段文字正好等于词典里的中文"的文字节点自动换成译文（按钮、侧边栏等）。
   - 客户自助预约页（booking.html）只有印尼文 / 中文两种，用下面的 BOOK 词典（按 key 取，两种语言都完整），见 bt()。
   classic script，全局函数/变量；加载顺序：rules.js 之后任意位置（需要 currentAccount()，由 data.js 提供，调用时才取）。 */

var LANG_LABELS = {zh:'中文', ko:'한국어', id:'Bahasa Indonesia'};

/* [中文, 韩文, 印尼文] */
var I18N_ROWS = [
  /* 侧边栏 / 顶栏 / 头像菜单 */
  ['工作台','대시보드','Dasbor'], ['客户管理','고객 관리','Manajemen Klien'], ['案件管理','케이스 관리','Manajemen Kasus'],
  ['案例库','사례 라이브러리','Pustaka Kasus'], ['项目库','시술 라이브러리','Pustaka Layanan'], ['通知中心','알림 센터','Pusat Notifikasi'],
  ['诊所管理','클리닉 관리','Manajemen Klinik'], ['经营数据','운영 데이터','Data Operasional'], ['账号管理','계정 관리','Manajemen Akun'],
  ['诊所设定','클리닉 설정','Pengaturan Klinik'], ['操作日志','작업 로그','Log Aktivitas'], ['个人设定','개인 설정','Pengaturan Pribadi'],
  ['个人设置','개인 설정','Pengaturan Pribadi'], ['切换账号','계정 전환','Ganti Akun'], ['退出登录','로그아웃','Keluar'],
  ['管理者','관리자','Manajer'], ['老板','대표','Pemilik'], ['室长','실장','Koordinator'], ['一般室长','일반 실장','Koordinator Umum'],
  ['印尼室长端','인도네시아 실장용','Koordinator Indonesia'], ['老板端','대표용','Pemilik'],
  /* 常用按钮 */
  ['保存','저장','Simpan'], ['取消','취소','Batal'], ['确认','확인','Konfirmasi'], ['关闭','닫기','Tutup'], ['返回','뒤로','Kembali'],
  ['编辑','편집','Edit'], ['删除','삭제','Hapus'], ['搜索','검색','Cari'], ['新增','추가','Tambah'], ['提交','제출','Kirim'],
  ['确定','확정','OK'], ['查看','보기','Lihat'], ['全部','전체','Semua'], ['全部标为已读','모두 읽음 처리','Tandai semua dibaca'],
  ['上一步','이전','Sebelumnya'], ['下一步','다음','Berikutnya'], ['完成','완료','Selesai'], ['重置','초기화','Reset'], ['返回工作台','대시보드로','Kembali ke Dasbor'],
  /* 设定页（个人设定） */
  ['个人资料','프로필','Profil'], ['姓名','이름','Nama'], ['职位','직책','Jabatan'], ['证件照','증명사진','Foto ID'], ['手机','휴대폰','Ponsel'],
  ['账号','계정','Akun'], ['界面语言','화면 언어','Bahasa Antarmuka'], ['只影响自己的界面','내 화면에만 적용됩니다','Hanya berlaku untuk tampilan Anda'],
  ['通知设定','알림 설정','Pengaturan Notifikasi'], ['推播通知','푸시 알림','Notifikasi Push'], ['提示音','알림음','Suara'],
  ['修改密码','비밀번호 변경','Ubah Kata Sandi'], ['当前密码','현재 비밀번호','Kata sandi saat ini'], ['新密码','새 비밀번호','Kata sandi baru'],
  ['确认新密码','새 비밀번호 확인','Konfirmasi kata sandi baru'], ['保存资料','저장','Simpan profil'], ['更换照片','사진 변경','Ganti foto'],
  ['前台','프런트','Resepsionis'], ['咨询师','상담사','Konsultan'], ['其他','기타','Lainnya'],
  /* 诊所设定页 */
  ['诊所资料','클리닉 정보','Info Klinik'], ['诊所名称','클리닉 이름','Nama Klinik'], ['地址','주소','Alamat'], ['电话','전화','Telepon'],
  ['所在城市','도시','Kota'], ['时区','시간대','Zona Waktu'], ['营业时间','영업 시간','Jam Operasional'], ['可预约时段','예약 가능 시간','Jam Reservasi'],
  ['午休','점심시간','Istirahat'], ['休诊日','휴진일','Hari Libur'], ['预约规则','예약 규칙','Aturan Reservasi'],
  ['预约占位倒计时（分钟）','예약 홀드 시간(분)','Waktu tahan reservasi (menit)'], ['未到店判定（分钟）','노쇼 판정(분)','Batas tidak hadir (menit)'],
  ['面诊费（印尼盾）','진료 상담비(IDR)','Biaya konsultasi (IDR)'], ['每个时段的预约上限','시간대별 예약 상한','Batas reservasi per slot'],
  ['提醒短信发送时间','알림 문자 발송 시점','Waktu kirim SMS pengingat'], ['预约开始前（小时）','예약 시작 전(시간)','Sebelum reservasi (jam)'],
  ['短信模板','문자 템플릿','Templat SMS'], ['预约链接','예약 링크','Tautan reservasi'], ['预约确认','예약 확인','Konfirmasi reservasi'],
  ['预约提醒','예약 알림','Pengingat reservasi'], ['预约取消','예약 취소','Pembatalan reservasi'],
  ['使用政策与同意书','이용 정책 및 동의서','Kebijakan & Persetujuan'], ['同意书版本','동의서 버전','Versi persetujuan'], ['隐私政策','개인정보 처리방침','Kebijakan privasi'],
  ['合作医院（只读）','협력 병원(읽기 전용)','Rumah sakit mitra (hanya baca)'], ['韩国医院','한국 병원','RS Korea'], ['韩国室长','한국 실장','Koordinator Korea'],
  ['院长名单','원장 명단','Daftar Direktur'], ['已停用','비활성','Nonaktif'], ['保存设定','설정 저장','Simpan pengaturan'],
  ['保存后立即生效，并通知所有室长','저장 즉시 적용되며 모든 실장에게 알림이 갑니다','Berlaku segera dan semua koordinator diberi tahu'],
  ['周日','일','Min'], ['周一','월','Sen'], ['周二','화','Sel'], ['周三','수','Rab'], ['周四','목','Kam'], ['周五','금','Jum'], ['周六','토','Sab']
];
var I18N_MAP = {ko:{}, id:{}};
I18N_ROWS.forEach(function(r){ I18N_MAP.ko[r[0]] = r[1]; I18N_MAP.id[r[0]] = r[2]; });

function currentLang(){
  try{ var a = (typeof currentAccount === 'function') ? currentAccount() : null; if(a && a.lang && LANG_LABELS[a.lang]) return a.lang; }catch(e){}
  return 'zh';
}
function t(zh){ var l = currentLang(); return (l!=='zh' && I18N_MAP[l] && I18N_MAP[l][zh]) || zh; }

/* 监视页面：把正好等于词典里中文原文的文字节点换成译文（只在非中文时启动；切换语言后页面会重新载入） */
function i18nWalk(root){
  var l = currentLang(), map = I18N_MAP[l]; if(!map || !root) return;
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
  while((n = w.nextNode())) list.push(n);
  list.forEach(function(tn){
    var p = tn.parentNode; if(!p || /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) return;
    var raw = tn.nodeValue, tr = raw.trim();
    if(tr && map[tr]) tn.nodeValue = raw.replace(tr, map[tr]);
  });
  if(root.querySelectorAll) root.querySelectorAll('[title],[placeholder]').forEach(function(el){
    ['title','placeholder'].forEach(function(a){ var v = el.getAttribute(a); if(v && map[v]) el.setAttribute(a, map[v]); });
  });
}
function i18nStart(){
  var l = currentLang(); if(l==='zh') return;
  document.documentElement.lang = l;
  var busy = false;
  var obs = new MutationObserver(function(muts){
    if(busy) return; busy = true;
    try{ muts.forEach(function(m){ m.addedNodes.forEach(function(nd){ if(nd.nodeType===1) i18nWalk(nd); else if(nd.nodeType===3 && nd.parentNode) i18nWalk(nd.parentNode); }); }); }catch(e){}
    busy = false;
  });
  obs.observe(document.body, {childList:true, subtree:true});
  i18nWalk(document.body);
}
