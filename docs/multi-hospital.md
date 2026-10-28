# 多诊所 × 多医院的资料结构（KR 端系列 1/5，2026-10-06）

> 规则来源（Notion）：Role Rules"诊所 × 医院的关系"、Conversation & Video Flow"2026-10-06 修订：多家诊所 × 多家医院"、KR 韩国端功能与接口清单第 0 节、KR-DOC-01 / KR-SRVC-01 / KR-SCHD-01 / KR-SHOW-01。
> 下面标"我的判断"的是实现时我自己定的，没有业务方确认。

## 1. 关系
- **多对多**：一家医院对接多家诊所，一家诊所对接多家医院。演示：医院 H1 `서울 소수 성형외과 / Seoul Sosu Plastic Surgery`、H2 `강남 뷰티의원 / Gangnam Beauty Clinic`（H1 不用"GMC"命名，GMC 是平台名）；诊所 C1 `GMC 合作诊所（雅加达）`、C2 `泗水合作诊所（Surabaya）`；对接 C1→H1、H2，C2→H1（`CLINIC_HOSPITALS`）。
- **资料隔离**：诊所之间完全隔开（C2 看不到 C1 的任何客户、案件、对话、通知、短信、设定、本地项目、印尼案例）；医院只看得到对接诊所里、选了本医院的面诊案件（KR 端之后做，用下面的跨诊所读写接口）。

## 2. 存档结构（`shared/store.js`）
| 键 | 内容 |
|---|---|
| `gmc_state` | **全局部分**（`GLOBAL_VAR_NAMES`）：`HOSPITALS`、`CLINICS`、`CLINIC_HOSPITALS`、`HOSPITAL_DATA`、`ACCOUNTS`（每个账号有 `clinicId`）、`ACCOUNT_LOG`（带 `clinicId`）、案件编号序列 `CASE_NO_SEQ`（**全系统共用一个**，Case ID 全局唯一）、项目分类（`PROJECT_CATEGORIES`、`PCAT`，两家诊所共用）、`PROJ_SEQ`、`LIB_CASE_SEQ`、`DEMO_SHIFT_MS` |
| `gmc_clinic_C1`、`gmc_clinic_C2` … | **每家诊所一个分区**（`CLINIC_VAR_NAMES`）：`CLINIC_SETTINGS`（每家诊所一份）、`PURCHASE_REQ`、`ACCOUNT_SEQ`（账号编号前缀 C1=A、C2=B）、`CLIENTS`、`CLIENT_HOLDINGS`、`CASE_ITEMS`、`RESERVATION_PLACEHOLDERS`、`PLACEHOLDER_HISTORY`、`RESUMED_VISITS`、`NOTIFS`、`ROOMS`、`CHAT_DATA`、`ROOM_UNREAD`、`MUTED_ROOMS`、`STAFF_ROSTER`、`CAL_MEMOS`、`SMS_LOG`、本地项目（`PROJECT_LIBRARY` 里 `origin==='IN'`）、印尼案例（`LIB_CASES` 里 `source==='local'`）、问题标签 |
- 每个页面只把**自己诊所**的分区读进全局变量（名字不变：`CASE_ITEMS`、`CLIENTS`…），IN 端原有代码几乎不用改；`PAGE_CLINIC_ID` = 这个页面的诊所（登录账号的诊所；登录页 = null，只读写全局部分）；`CURRENT_CLINIC_ID` 运行时同值（种子生成期间固定为 C1）。
- **合成数组**：`PROJECT_LIBRARY` / `LIB_CASES` 在内存里 = 本诊所的 IN 项 + 对接医院的 KR 项（读档时 `buildClinicViews()` 合成）；存档时 `viewSplit()` 按 `hospitalId` 把 KR 项拆回 `HOSPITAL_DATA[医院].projects / .libCases`，IN 项留在诊所分区。
- **只写变了的部分**：全局部分和本诊所分区各自比较、各自写；其他标签页收到 `storage` 事件只重读和自己相关的部分（全局 + 自己诊所的分区）。
- **跨诊所读写接口**（给 KR 端用）：`Store.readClinic(cid)` 读某诊所分区（返回变量对象）；`Store.updateClinic(cid, fn)` 在该分区上执行 `fn(变量对象)` 后写回——写进 C1 分区后，C1 的分页即时同步（已用两个标签页验证）；如果 `cid` 就是本页诊所，直接改内存再存档。
- **版本号重置**：`DEMO_DATA_VERSION` 变了 → 业务资料（案件、客户、预约、对话…）重新生成，**保留** `ACCOUNTS`、`ACCOUNT_LOG`（全局）和每个诊所分区里的 `CLINIC_SETTINGS`、`PURCHASE_REQ`、`ACCOUNT_SEQ`；`ACCOUNT_STRUCT_VERSION`（现在 3）变了或手动"重置演示数据"才全部清空。这一次因为账号加了 `clinicId`、设定按诊所分区，账号和设定随结构一起重置过一次。

## 3. 医院资料 `HOSPITAL_DATA[hid]`（按医院归属）
`directors`（`{id, name, active}`，停用的不出现在选项里）、`coordinators`（KR 室长姓名）、`openDates`（**按院长**开放的施术日期 `{院长名:[日期]}`）、`directorSchedule`（院长日程块）、`coordSchedule`（KR 室长日程）、`projects`（赴韩项目，`hospitalId`）、`libCases`（赴韩施术案例，`hospitalId`）。读取函数：`hospitalDirectors / hospitalDirectorNames / hospitalCoordinators / hospitalOpenDates / linkedHospitals / linkedHospitalIds / hospitalName`。演示：H1 院长 KD1 院长、KD1 院长、H1 院长3（停用），KR 室长 KM1 室长、KC1 室长；H2 院长 H2 院长1、H2 院长2、H2 院长3（停用），KR 室长 KM2 室长、KC2 室长；每位院长的开放日期都不一样。

## 4. IN 端的变化
- **选面诊先选医院**（基础资料"面诊需求"= 面诊，以及"增加面诊"缴费前）：先选医院（只列本诊所对接的医院；只对接一家就自动选定），再选该医院启用的院长；案件 `hospitalId`；**复诊 / 延续既往面诊锁定原案件的医院**（院长规则不变：默认原院长并锁定，原院长停用才可改选）；沿用原报告也带出原医院；缺医院不能确认基础资料。案件详情页头显示"医院：… · 对接院长：…"。
- **按医院读各自的资料**：可选范围（默认范围、补加、更换项目）和意向项目只列该医院的赴韩项目；施术日期只能选**该案件所选院长**开放的日期（`caseOpenDates(c)`）。
- **页面**：案件列表加"医院"栏 + 按医院筛选（对接 2 家以上才显示筛选）；项目库"赴韩项目"tab 上方切换医院；案例库可切换赴韩施术的医院、卡片标明医院、院长筛选读所选医院名单；工作台"KR 医院日程"视角先选医院再选院长（日程块、开放日期都按所选）；设定页"合作医院（只读）"列出本诊所对接的每家医院的 KR 室长和院长名单（含停用）。
- **对话**：Main 全员群每组"诊所 × 医院"一个（`main-H1`、`main-H2`；C1 有两个，C2 一个）：成员 = 本诊所 IN 室长 + 该医院的 KR 室长和院长；案件对话房、推播、室长商谈的 KR 成员只有该案件所选医院的人；新建对话的同事名单按对接医院生成（排除自己）。
- **账号/日志**：账号管理、席位、重名检查、操作日志都只看本诊所（`clinicAccounts()`）；账号编号前缀按诊所（`clinicAccountPrefix()`）；C2 没有老板账号，所以管理者加购管理者账号时不要求老板验证码（我的判断）。

## 5. 演示数据与账号
- C1：原有 21 个案件，其中 4 个（客人20、客人10、客人21、客人22）改属 H2（院长、KR 室长、Timeline、对话里的名字换成 H2 的人）；H1 有 16 个赴韩项目和 8 个案例，H2 有 9 个赴韩项目（价格和 H1 不同）和 3 个案例。
- C2：客户 客人17、客人18（已到店选了面诊 H1）、客人19（预约取消），4 个本地项目（泗水）和 1 个印尼案例；只对接 H1，所以选面诊时只能选 H1。
- **演示账号**：C1 = OWN `own123`、A1 A1 室长 `a1123`（管理者）、A2 A2 室长 `a2123`、A5 A5 室长 `a5123`（A3 待激活、A4 已停用）；**C2 = B1 B1 室长 `b1123`（管理者）、B2 B2 室长 `b2123`（一般室长）**，不加老板。

## 6. 客户自助预约页与诊所
- 预约链接带诊所：`booking.html?clinic=C2`；原型不带默认 C1。**正式版链接必须带诊所，没带应显示错误**（原型的默认 C1 只是为了演示方便）。确认/提醒/取消短信里的客人端网址（`?clinic=…&view=…`）也带诊所；新客人建档、预约、短信记录都写进该诊所的分区。

## 7. TODO / 待确认
1. （2026-10-06 已建骨架，见 `docs/kr-side.md`）KR 端页面（KRC/KRD）还没建：这份分区结构 + `Store.readClinic / updateClinic` 是给它们用的；KR 端各处显示来源诊所、按诊所筛选、联系方式遮蔽（`+62 000-****-****`）、KR 日程里他诊所客人的块只显示"不可预约"灰块等，留在后面几份指令。
2. 项目分类（2026-10-06 已按用户答复拆分）：本地项目分类各诊所各自一份（`PROJECT_CATEGORIES`，存在诊所分区），赴韩项目分类 = 全系统共用的标准部位 `KR_CATEGORIES`（全局），让案例库"按部位"能把不同医院的项目放在一起。
3. 案例库"院长详情"（点院长名）仍按名字找案例，两家医院的院长不重名所以没问题。
4. 院长介绍卡（照片、经历、认证、擅长项目排前）是 KR-DOC-01，留给 KR 端系列后面。
5. 案件编号全系统共用一个序列（用户已确认），C2 的案件号会接在 C1 后面。


---

# 一诊所一医院（2026-10-07，取代上面第 1 节"多对多"的说法；旧文字保留作历史，已废弃的部分标"已废弃"）

## 1′. 新关系
- **一家诊所只对接一家医院，一家医院可对接多家诊所**（Notion Role Rules「诊所 × 医院的关系」）。~~诊所和医院多对多~~（已废弃）。
- 演示数据（`CLINIC_HOSPITALS`）：C1 雅加达、C2 泗水 → H1 서울 소수；**C3 巴厘 → H2 강남 뷰티**。`clinicHospital(cid)` 返回诊所对接的那一家；`linkedHospitalIds()` 仍返回数组（长度 1），旧调用不用改。
- C3 管理者账号 **D1 D1 室长（密码 `d1123`，手机 +62 811-0000-0021）**；登录页说明、CLAUDE.md 已写。
- 对 KR 端不变：H1 的 KR 账号看 C1+C2 的案件（来源诊所栏照样显示），H2 的 KR 账号只看 C3。

## 2′. IN 端的变化（取代第 4 节中"选医院"的部分）
- 基础资料选"面诊"、"增加面诊"：**不再选医院**，案件的 `hospitalId` 自动 = 本诊所对接的医院（`caseHospitalId`/`syncDirectorChoice`），只选该医院的院长；复诊/延续既往面诊仍锁定原院长。已删除 `setCaseHospital`/`setConsultHospital`，`hospitalLockInfo` 恒为空。
- 去掉：项目库赴韩 tab 的医院切换、案例库"赴韩施术医院"切换、工作台 KR 医院日程的医院下拉、案件列表的「医院」栏和医院筛选。
- 每家诊所只有一个 Main 群（C1 = `main-H1`，C3 = `main-H2`）。
- IN 项目库不显示「韩国术后管理」分类（`projLibCategories` 在 IN 页面过滤掉 `postcare` 分类；KR 端项目库照常有）。

## 3′. 存档与账号
- 版本号 25 → 26：重置时只清业务演示资料，**账号和诊所设定保留**；缺的种子账号由 `ensureSeedAccounts()` 补进（`SEED_ACCOUNTS_COPY` 是种子账号快照，D1 就这样出现，不需要重置账号）。
- 原来 C1 里对接 H2 的四个案件（客人20 A000005 / 客人10 A000013 / 客人21 A000011 / 客人22 A000012，案件编号不变）+ 客户 + 持有项目 + 案件对话 + 通知，整体迁到 C3（`stashC3Seeds` 抽出、`seedClinicDemo('C3')` 装入）；案件里的 A1 室长 / A2 室长 换成 D1 室长；C1 对话里提到这些案件的消息去掉。

## 4′. TODO / 待确认
1. 案件编号仍是全系统共用一个序列、统一 `A` 开头（沿用上面第 7 节第 5 条）；C3 新案件会接在后面，前缀未区分。
2. 迁到 C3 的案件里，原本的 C1 室长名一律换成 D1 室长（演示数据处理，不代表业务规则）。
