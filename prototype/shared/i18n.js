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
  ['短信发送记录','문자 발송 기록','Riwayat SMS'], ['合作医院（只读）','협력 병원(읽기 전용)','Rumah sakit mitra (hanya baca)'], ['韩国医院','한국 병원','RS Korea'], ['韩国室长','한국 실장','Koordinator Korea'],
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

/* ================= 客户自助预约页（booking.html）词典：只有印尼文 / 中文，两种都完整（2026-10-06·B1） =================
   bt('key', {var:值}) 取当前预约页语言的文字；变量写成 {name} 这样。 */
var BOOK_LANG = 'id';
var BOOK_DICT = {
  'brand.sub':   {id:'Reservasi online', zh:'在线预约'},
  'lang.id':     {id:'Bahasa Indonesia', zh:'Bahasa Indonesia'},
  'lang.zh':     {id:'中文', zh:'中文'},
  'step.of':     {id:'Langkah {n} dari {total}', zh:'第 {n} 步，共 {total} 步'},
  'btn.next':    {id:'Lanjut', zh:'下一步'},
  'btn.back':    {id:'Kembali', zh:'返回'},
  'btn.confirm': {id:'Konfirmasi', zh:'确认'},
  'tz':          {id:'Waktu setempat klinik ({tz})', zh:'诊所当地时间（{tz}）'},
  'entry.walkin':{id:'Check-in mandiri: waktu kunjungan = sekarang ({time})', zh:'到店自己填：预约时间 = 现在（{time}）'},
  'entry.link':  {id:'Waktu dari tautan: {time}', zh:'链接里的预约时间：{time}'},
  'entry.change':{id:'Ubah waktu', zh:'改选时间'},
  /* 1 选时间 */
  's.time':      {id:'Pilih tanggal & waktu', zh:'选择日期和时间'},
  'time.hint':   {id:'Jam praktik {open}–{close}. Slot yang penuh tidak dapat dipilih.', zh:'营业时间 {open}–{close}，已满的时段不能选。'},
  'time.full':   {id:'Penuh', zh:'已满'},
  'time.closed': {id:'Libur', zh:'休诊'},
  'time.lunch':  {id:'Istirahat', zh:'午休'},
  'time.none':   {id:'Tidak ada slot tersedia pada hari ini.', zh:'这一天没有可约的时段。'},
  'time.pick':   {id:'Pilih satu slot waktu.', zh:'请选择一个时段。'},
  'time.chosen': {id:'Dipilih: {time}', zh:'已选：{time}'},
  'time.taken':  {id:'Slot ini baru saja penuh. Silakan pilih waktu lain.', zh:'这个时段刚刚被约满了，请重新选择时间。'},
  /* 2 验证手机 */
  's.phone':     {id:'Verifikasi nomor ponsel', zh:'验证手机号'},
  'phone.label': {id:'Nomor ponsel', zh:'手机号'},
  'phone.locked':{id:'Nomor dari tautan reservasi', zh:'来自预约链接的手机号'},
  'phone.send':  {id:'Kirim kode verifikasi', zh:'发送验证码'},
  'phone.demo':  {id:'Demo: kode dikirim ke {phone}. Kode Anda: {code}', zh:'演示：验证码已发送到 {phone}，验证码：{code}'},
  'phone.code':  {id:'Kode verifikasi (6 digit)', zh:'验证码（6 位）'},
  'phone.verify':{id:'Verifikasi', zh:'验证'},
  'phone.resend':{id:'Kirim ulang kode', zh:'重新发送验证码'},
  'phone.bad':   {id:'Masukkan nomor ponsel yang valid.', zh:'请输入有效的手机号。'},
  'code.bad':    {id:'Kode salah.', zh:'验证码不对。'},
  'code.expired':{id:'Kode kedaluwarsa. Kirim ulang kode.', zh:'验证码已过期，请重新发送。'},
  'code.first':  {id:'Kirim kode verifikasi terlebih dahulu.', zh:'请先获取验证码。'},
  'phone.other': {id:'Silakan gunakan nomor ponsel lain.', zh:'请改用其他手机号。'},
  /* 3 个人资料 */
  's.profile':   {id:'Data diri', zh:'个人资料'},
  'profile.back':{id:'Data Anda sudah tersimpan. Periksa lalu konfirmasi.', zh:'已带出您登记过的资料，请确认。'},
  'profile.name':{id:'Nama lengkap', zh:'姓名'},
  'profile.gender':{id:'Jenis kelamin', zh:'性别'},
  'gender.f':    {id:'Perempuan', zh:'女'},
  'gender.m':    {id:'Laki-laki', zh:'男'},
  'profile.dob': {id:'Tanggal lahir', zh:'出生日期'},
  'profile.errName':{id:'Nama wajib diisi.', zh:'请填写姓名。'},
  'profile.errDob':{id:'Tanggal lahir wajib diisi.', zh:'请填写出生日期。'},
  'mismatch.q':  {id:'Nomor ini sudah terdaftar atas nama {reg}. Apakah itu Anda?', zh:'这个手机号已登记为 {reg}，是本人吗？'},
  'mismatch.yes':{id:'Ya, itu saya', zh:'是，本人'},
  'mismatch.no': {id:'Bukan, gunakan nomor lain', zh:'不是，换一个手机号'},
  /* 4 来访目的 */
  's.purpose':   {id:'Tujuan kunjungan', zh:'来访目的'},
  'purpose.面诊商谈':{id:'Konsultasi tindakan', zh:'面诊商谈'},
  'purpose.皮肤商谈':{id:'Konsultasi kulit', zh:'皮肤商谈'},
  'purpose.术后管理':{id:'Perawatan pasca tindakan', zh:'术后管理'},
  'purpose.复诊':{id:'Kontrol ulang', zh:'复诊'},
  'purpose.皮肤管理':{id:'Perawatan kulit', zh:'皮肤管理'},
  'purpose.note':{id:'Hal yang ingin dikonsultasikan (opsional)', zh:'想咨询的内容（选填）'},
  /* 5 健康资料 */
  's.health':    {id:'Data kesehatan', zh:'健康资料'},
  'health.prev': {id:'Ini isian Anda sebelumnya. Ubah jika ada perubahan.', zh:'这是您上次填写的内容，有变化再修改。'},
  'health.history':{id:'Riwayat penyakit / alergi', zh:'病史 / 过敏史'},
  'health.beauty':{id:'Riwayat tindakan estetik sebelumnya', zh:'过往医美史'},
  'health.ph':   {id:'Tulis "tidak ada" jika tidak ada', zh:'没有请写"无"'},
  /* 6 同意 */
  's.consent':   {id:'Persetujuan', zh:'同意'},
  'consent.policy':{id:'Kebijakan privasi (versi {v})', zh:'隐私政策（版本 {v}）'},
  'consent.c1':  {id:'Saya menyetujui pengumpulan data pribadi saya.', zh:'我同意收集我的个人资料。'},
  'consent.c2':  {id:'Saya menyetujui pemrosesan data kesehatan saya.', zh:'我同意处理我的健康资料。'},
  'consent.err': {id:'Kedua persetujuan wajib dicentang.', zh:'两项同意都必须勾选。'},
  'consent.note':{id:'Surat persetujuan resmi (privasi / transfer data lintas negara) akan ditandatangani langsung di klinik.', zh:'正式《隐私/数据跨境使用授权同意书》到店后当面签署。'},
  /* 7 确认 */
  's.confirm':   {id:'Konfirmasi & kirim', zh:'确认并提交'},
  'sum.time':    {id:'Waktu', zh:'预约时间'},
  'sum.name':    {id:'Nama', zh:'姓名'},
  'sum.phone':   {id:'Ponsel', zh:'手机号'},
  'sum.purpose': {id:'Tujuan', zh:'来访目的'},
  'sum.note':    {id:'Catatan', zh:'咨询内容'},
  'btn.submit':  {id:'Kirim reservasi', zh:'提交预约'},
  /* 8 完成 */
  'done.title':  {id:'Reservasi berhasil!', zh:'预约成功！'},
  'done.walkin': {id:'Terima kasih. Silakan lapor ke resepsionis; staf akan mendaftarkan kedatangan Anda.', zh:'谢谢。请告知前台，工作人员会为您登记到店。'},
  'done.case':   {id:'Nomor kasus', zh:'案件编号'},
  'done.addr':   {id:'Alamat klinik', zh:'诊所地址'},
  'done.tel':    {id:'Telepon', zh:'电话'},
  'done.sms':    {id:'SMS konfirmasi telah dikirim (demo):', zh:'已发送确认短信（演示）：'},
  'done.manage': {id:'Lihat / batalkan reservasi', zh:'查看 / 取消预约'},
  /* 查看 / 取消 / 重新预约 */
  'view.title':  {id:'Reservasi Anda', zh:'您的预约'},
  'view.verify': {id:'Verifikasi nomor ponsel Anda untuk melihat reservasi.', zh:'验证手机号后查看预约。'},
  'view.notfound':{id:'Reservasi tidak ditemukan.', zh:'找不到这个预约。'},
  'view.mismatch':{id:'Nomor ponsel tidak sesuai dengan reservasi ini.', zh:'手机号和这个预约不符。'},
  'view.status.waiting':{id:'Menunggu kunjungan', zh:'待到店'},
  'view.status.arrived':{id:'Sudah hadir', zh:'已到店'},
  'view.status.cancelled':{id:'Dibatalkan', zh:'已取消'},
  'view.status.noshow':{id:'Tidak hadir', zh:'未到店'},
  'view.cancel': {id:'Batalkan reservasi', zh:'取消预约'},
  'view.cancelQ':{id:'Batalkan reservasi ini?', zh:'确定取消这个预约吗？'},
  'view.cancelT':{id:'Anda dapat membatalkan kapan saja sebelum jam reservasi.', zh:'预约时间前都可以取消。'},
  'view.cancelYes':{id:'Ya, batalkan', zh:'确定取消'},
  'view.cancelNo':{id:'Tidak', zh:'不取消'},
  'view.cancelled':{id:'Reservasi telah dibatalkan. SMS pembatalan dikirim (demo).', zh:'预约已取消，已发送取消短信（演示）。'},
  'view.cant':   {id:'Reservasi ini tidak dapat dibatalkan lagi.', zh:'这个预约已经不能取消了。'},
  'view.rebook': {id:'Buat reservasi baru', zh:'重新预约'},
  'view.rebookHint':{id:'Data Anda akan terisi otomatis.', zh:'您的资料会自动带入。'}
};
function bt(key, vars){
  var e = BOOK_DICT[key], s = e ? (e[BOOK_LANG] || e.zh) : key;
  return s.replace(/\{(\w+)\}/g, function(m, k){ return vars && vars[k]!==undefined ? vars[k] : m; });
}
