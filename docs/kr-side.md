# KR 端（韩国医院端）骨架（2026-10-06，KR 端系列 2/5）

本轮目标：KR 端"看得到"——登录、角色、大盘、案件列表、案件详情框架、对话与通知。**KR 的操作**（确认报告时间、提交报告、施术相关）在系列 3/4，IN 端的"模拟 KR…"演示按钮保留。依据 Notion：Accounts & Settings 第 7 节、Role Rules「诊所 × 医院的关系」、KR-DASH-01、KR-CASE-03、KR-CASE-01 第 1 节。

## 1. 账号与登录
| 账号 | 角色 | 医院 | 姓名 | 密码 |
|---|---|---|---|---|
| KO1 | 代表院长 | H1 | 박소현 | ko1123 |
| KM1 | 管理者 | H1 | 이서연 | km1123 |
| KC1 | 室长 | H1 | 박준혁 | kc1123 |
| KD1 | 院长（加购席位） | H1 | 김민석 원장 | kd1123 |
| KM2 | 管理者 | H2 | 정하늘 | km2123 |
| KC2 | 室长 | H2 | 최민준 | kc2123 |

编号 K 开头，不和 IN 的 OWN / A* / B* 冲突；密码规则同 IN（编号小写 + 123）。账号带 `hospitalId`、没有 `clinicId`。
登录后：代表院长 → `owner.html`（只有管理类页面，范围 = 本医院）；管理者/室长/院长 → `kr.html`。
权限（`ROLE_PERMS`）：

| 角色 | 大盘 | 案件列表/通知/对话 | 经营数据/账号管理/医院设定/操作日志 |
|---|---|---|---|
| 代表院长 | 无 | 无（不看个别案件） | 有 |
| 管理者 | 有 | 有 | 有 |
| 室长 | 有 | 有 | 无 |
| 院长 | 只有院长版大盘 | 只看自己的案件（经大盘/通知进详情） | 无 |

账号管理、医院设定在 KR 端本轮是只读页（购买/退订/重设等操作留给后面）；经营数据只是占位；操作日志按 `hospitalId` 过滤。界面文字都走 `t()`，之后补韩文词条。

> **正式版说明**：C2 演示账号没有老板账号、没有验证码流程只是为了演示；正式版每家诊所一定有老板账号（OWN），管理者加购管理者需老板验证码。

## 2. 跨诊所读取与遮罩
- `Store.readClinic(cid)` 读诊所分区；**`Store.withClinic(cid, fn)`** 临时把该诊所分区的变量换进全局，让 KR 端借用 IN 端的状态/显示函数（`caseStatusBadge`、`caseSubStatusItems`、`krActiveItems`、`caseAttachments`…），fn 返回后立即还原，fn 里只读。
- `krAllCases()`（kr.js）：对本医院对接的每家诊所，取案件 `hospitalId===本医院` 且 `krCaseVisible`（`rules.js`：面诊费已缴/已免除，或已出报告/沿用报告）的案件；**院长只看 `director` 是自己的**。未缴面诊费、不面诊的本地案件、选了别家医院的都看不到。
- `maskPhone(p)`（`rules.js`）：KR 端所有位置的联系方式统一显示 `+国家码 000-****-****`。
- KR 页面没有自己的诊所分区：任何 `gmc_clinic_*` 变化 → `krRefreshAll()` 重画（storage 事件）。

## 3. 大盘（KR-DASH-01）
- 今日 OFF：`HOSPITAL_DATA[h].offs`（院长/KR 室长）。
- 横幅"今日院长日程尚未确认"：日程管理是系列 5，这里先用［确认］按钮，写 `dayConfirm[日期]={by,at}` 并记操作日志，确认后横幅换成"已由 X 于 HH:mm 确认"。
- 六张卡（`KR_CARDS`，案件列表用同一份判断）：待确认报告时间 / 报告快到期·已超时（24 小时内）/ 待确认施术时间 / 改期待确认 / 今天到院 / 术后管理待确认（批次还没有"进行时间"）；每张按来源诊所分开数字，点击带筛选进案件列表。
- 今日到院时间线：时间、客户、来源诊所、院长、项目。
- 院长版：今日自己的日程（含到院客人）、等我出报告的案件（按预计时间）、室长刚提交的报告（近 7 天，未读加粗，点击标已读并进详情；已读状态 `reportRead[账号]`）。

## 4. 案件列表（KR-CASE-03）
tab：全部 / 面诊 / 项目确认中 / 施术预约 / 赴韩施术 / 已结束；列：客户姓名、Case ID、来源诊所、院长、状态（大 + 小）、关键时间、KR 室长、更新时间；筛选：来源诊所、院长（院长账号不显示）、搜索（姓名/Case ID）、仅看我的（院长账号不显示）；默认按紧急程度（已超时 → 快到期 → 改期待确认 → 待确认施术时间 → 今天到院 → 待确认报告时间 → 其他）。

## 5. 案件详情框架（KR-CASE-01 第 1 节）
头部：客户名 · Case ID · 状态 · 来源诊所 · 院长 · KR 室长；tab：基础资料（联系方式遮罩；医美史结构化，"本次新增" = 记录的 `newCaseId` 等于本案件）/ 面诊 / 项目 / 施术 / 附件 / 关联案件 / Timeline，全部只读；［对话］打开该案件房。

## 6. 对话与通知
- 通知存 `HOSPITAL_DATA[h].notifs`（全局存档）：`{id, ts, text, clinicId, caseId, to:'coord'|'director'|'all', director, kind, readBy:[账号]}`；室长/管理者看 `coord`，院长看自己案件的 `director`。`pushKrNotif(hid, text, opt)` 在 data.js。
- **K1 钩子**：IN 的 `markConsultPaid`（客人缴面诊费）和 `applyWaiveFee`（免除）→ 该案件所选医院的 KR 室长收到"客人已缴面诊费/面诊费已免除…请确认报告时间"，KR 大盘"待确认报告时间"同步 +1；两个标签页即时同步，并弹 toast。
- 对话抽屉（`kr.js` 精简版）：每家对接诊所一个 Main 群（`main-医院ID`，院长账号不列 Main）+ 本医院看得到的案件房；消息读写走各诊所分区（`Store.updateClinic`），IN 端即时看到并增加未读；KR 自己人发的消息 `from:'them'` + `name`，IN 室长发的显示韩文译文；未读标记存 `chatRead[账号][诊所|房间]`。

## 7. 我的判断（待确认）
1. 案件列表 tab 把 本地管理 / 选择项目 / 面诊已取消 / 已结案 / 仅出报告 / 已取消 都归"已结束"（KR 不再需要处理）。
2. 报告"快到期" = 预计时间 24 小时内（Notion 没写阈值）。
3. "术后管理待确认" = 该案件的术后管理批次还没有"进行时间"。
4. 院长账号没有案件列表入口，只能从大盘/通知点进自己案件的详情；院长也不列 Main 群。
5. 对话只做了文字消息 + 引用标记显示，没有文件/视频/@/引用案件/静音（后面按需要补）。
6. KR 通知目前只有：客人缴/免面诊费（真实钩子）+ 演示种子；报告超时、改期、术后管理等钩子在系列 3/4 随各操作一起加。
7. 医院设定/账号管理在 KR 端只读；KR 账号购买/退订/重设的规则按 Accounts & Settings 第 7 节，放在后面做。

---

# KR 端系列 3/5：面诊联动（2026-10-06）
依据 Notion KR-CASE-01（含分工表和测试情境 K9～K15）、Data Retention & Consent、Integrations & APIs。**KR 端操作 → 改来源诊所的案件**：`Store.mutateClinic(cid, fn)`（store.js）把该诊所分区换进全局变量（连 `CURRENT_CLINIC_ID`、`IN_COORDINATORS`、按该诊所合成的项目库一起换），fn 里直接调 IN 端的业务函数（`updateCaseStage`、`logCaseEvent`、`pushNotif`…），改完写回分区，IN 分页收到 storage 事件即时同步。业务逻辑放在 data.js 的 `core*` 函数（不碰界面）。

## 一 确认 / 修改预计出报告时间（室长、管理者）
`coreSetReportEta(c, eta, by, isChange)`：待确认报告时间 → 等待报告（IN 倒计时 + 通知）；等待报告时修改 → 两边 Timeline 记"原时间 → 新时间"+ IN 通知。面诊 tab 显示院长今天/明天的日程和 OFF；超时橘色提醒（IN 端规则不变，仍按时钟）。

## 二 录入面诊 → AI 草稿（院长：自己的案件；室长：全部）
语音（Web Speech API，韩语；不支持 / 没有麦克风权限 / 没识别到内容 → 演示文字，画面注明）、手动输入、［AI 整理成报告草稿］（固定韩文模板，注明演示；正式版接 LLM）。原始录音（演示占位，没有真实音频）、转写、草稿、修改过程存进 **KR 专用附件仓库** `HOSPITAL_DATA[h].vault['诊所:案件']`（IN 端不读不显示，结案后 3 年）。

## 三 提交最终报告（只有室长、管理者）
草稿上调整（韩文原文）+ 可选范围（赴韩项目选自 `HOSPITAL_DATA[h].projects`；术后管理项目选自来源诊所本地项目库「术后管理」分类）+ 各项备注 + 整体备注 + 附件（演示只记名称）→ `coreSubmitReport`：IN 变项目确认中、"报告已出"通知、院长大盘"室长刚提交的报告"出现。报告存 `c.reportKo`（原文），IN 看 `c.videoSummary`（演示翻译：只翻译模板固定词，注明），报告弹窗可切换看原文（`toggleReportOrig`）。可选范围的"所需术后管理 / 麻醉特性 / 推荐在韩时间"留给第 4 份。

## 四 延续既往面诊与补加可选项目
`coreJudgeContinuation`：无变动 → `applyReuseReport` 沿用原报告，IN 直接项目确认中；有变动 → 仍在等待报告，走二、三出新报告（院长自己的案件也可判断）。`coreAddScopeItem`：项目确认中（报告已出、还没进施术预约）补加，只增不减，IN 可选列表即时多出。

## 五 权限
院长：能录入、看草稿和仓库、判断延续既往（仅自己的案件）；不能确认/修改时间、提交、补加（界面不显示，函数里也再检查一次）。代表院长：进不了 kr.html（导去 owner.html），没有任何案件页。越权地址（`kr.html?case=诊所:案件号`）→ 导回首页。

## 六 拿掉 IN 端面诊相关的"模拟 KR"
删除：`simulateKrConfirmReportEta`（ui.js）、`krConfirmReportEta`、`markReportUploaded`、`simulateDirectorJudge`、`applyDirectorPlan`/`defaultKrScopeItems`（data.js，随之作废）、`simulateKrScopeUpdate`（ui.js）及它们在面诊 tab / 项目选择里的按钮。**保留**：「模拟时间超过预计」（`simulateReportTimeout`，是演示时钟不是 KR 操作）、所有施术相关的模拟按钮（第 4 份处理）。

## 我的判断（待确认）
1. "补加可选项目"的时机 = 报告已出且案件还在项目确认中（进施术预约后不能再补）。
2. 提交报告至少要勾一个可选项目（赴韩或术后管理）。
3. 演示翻译只翻模板固定词；正式版 AI 翻译整篇。
4. 语音识别用韩语（`ko-KR`）；院长口述语言以后可设定。
5. 仓库按"诊所:案件号"存在医院资料里，院长账号能看到自己案件的；管理者/室长看全部。

---

# KR 端系列 4/5：施术预约与在韩项目进程（2026-10-06）
依据 Notion KR-CASE-02（测试情境 K16～K23）、Case Management Flow 06 与「2026-10-06 修订：赴韩项目进程」、Data Retention & Consent「麻醉同意书」、KR-SCHD-01 第 2 节。KR 的操作同样经 `Store.mutateClinic` 改来源诊所的案件，业务逻辑在 data.js 的 `core*` 函数；**IN 端面诊 + 施术相关的"演示：模拟 KR…"按钮已全部拿掉**。

## 一 可选范围加项目资料
每个推荐赴韩项目：推荐在韩时间、麻醉特性（局部/睡眠/全身 + 备注）、所需术后管理 `postcare:[{name, price(韩元/次), times, place:'KR'|'either', day, innName, innPrice(印尼盾/次), inTimes}]`。在韩做的术后管理选自本医院项目库新增的「韩国术后管理」分类（`postcare:true` 特殊标记，案例库按部位和 IN 项目选择里不出现，两家医院各 4 个演示项目）；印尼做的选自来源诊所「术后管理」分类（`innName`，只有"均可"的项目才能选）。补加可选项目也带麻醉和在韩时间。

## 二 IN 项目选择与定金
项目选择显示 KR 写的资料；IN 室长按项目把"均可"的术后管理分配 韩国 n + 印尼 m（`corePcAlloc`，付尾款前可改，改后 `recomputeBatch` 重算合计）。**定金 =（施术项目 + 必须在韩国的术后管理）× `KR_DEPOSIT_RATE`**；均可的显示"暂定"，不算进定金（所以改分配不影响定金）。付定金前必须勾选签署麻醉同意书（`ANES_CONSENT_VERSION` = v0.1 占位文案，案件上记 `anesthesiaConsent` = 版本 + 时间 + 各项目麻醉方式；追加项目时只对还没签的项目再签）；没签不能付。

## 三 KR 端施术预约（施术 tab）
待确认施术时间：看 IN 递交的首选/备选、项目、院长当天日程 → 选日期 + 到院时间（30 分钟间隔）+ 地址（默认医院地址可改）→ `coreScheduleConfirm`，或［无法安排］+ 原因 → `coreScheduleReject`（IN 回到重新选日期并显示原因）。时间已确认：同一天内 `coreScheduleAdjust`（到院时间/地址，IN 通知；没有改日期入口）。改期待确认：`coreChangeConfirm` / `coreChangeReject`（原日期继续有效）。确认后 `syncSurgeryBlock` 在该院长日程自动加"施术"块（`directorSchedule` 的块多了 `kind/caseId/clinicId/name`，没有结束时间，第 5 份补）。

## 四 在韩 timeline 与子项
付定金后 KR 室长在「项目进程」整理：`c.subItems` = `{id, no:'A000001-01', date, content, kind:施术|复诊|管理|其他, place:KR|IN|either, projectName, done, informed, booked}`；新增/修改/删除（已完成不能改），每次 IN 收通知。IN 赴韩项目 tab 下新增「在韩 timeline」子 tab（只读，`c.krSubTab`）。

## 五 到院、尾款与调整（KR 端）
`coreMarkArrived` → `coreJudge`（能·没变动 / 能·有变动 / 不能）；有变动：`coreMarkUnable`、`coreSwapItem`（新结算单"计入尾款"）；`coreSettleBalance`：定金够 → 付清尾款并**确认行程**（KR 也可调分配，确认后锁定）；定金多 → KR 判断应退差额（`krJudge.refundDue`），IN 室长按此金额在系统里退（`settleKrBalance`），退后视为结清。不能施术：`coreRebook`（KR 在韩重新预约，回到时间已确认）或 `coreRefundDecision`（退定金 全部/不退，IN 按判断操作 `krRefundDeposit` → 仅出报告）。付尾款时（`finalizeInnCare`）印尼部分术后管理生成 `c.innCare`（待 IN 室长收印尼盾）：IN 点［已收款］（`confirmInnCare(true)`）才转成客人持有批次（`schedule` = 术后第 N 天）；［客人当下不买］不生成，之后回印尼当一般本地项目买。

## 六 子项进行、回诊与结案
`coreSubDone`：付清尾款后 KR 逐个标子项完成（施术子项带动项目完成）；**在韩国的子项（地点=韩国）全部完成 → 结案**（取代"施术完成 → 已结案"；地点=印尼/均可 的不挡结案）；没有整理 timeline 的案件可 `coreMarkAllDone`。回印尼的子项：`coreSubInform` 通知 IN 室长 → 通知点开预约弹窗（`openSubBookModal`/`confirmSubBook`），新案件自动关联原赴韩案件（来访目的 复诊/术后管理）。到院后加做项目：`coreAddOnItem`，KR 直接新增、另开新结算单（`addOn`，状态"韩国付款"，不进尾款，IN 只读，原结算单不动）。

## 七 大盘卡片
"术后管理待确认" → "timeline 待整理"（已付定金、没有 timeline）+ "今日在韩子项"（今天要做且没完成的子项）。

## 八 删除的 IN 端模拟按钮/函数
模拟KR确认首选/备选/无法安排（`simulateKrScheduleConfirmNew/RejectNew`）、确认新首选/新备选/无法确认（`…ChangeConfirm/ChangeReject`）、标记已到医院（`simulateKrMarkArrived`）、判断能否施术（`simulateKrJudge`/`submitKrJudge`）、标记无法施术（`simulateKrMarkUnable`/`submitKrUnable`）、更换项目（`simulateKrProjectSwap`）、付清尾款（`simulateKrMarkBalancePaid`）、标记完成（`simulateKrMarkDone`/`submitKrMarkDone`）、补加术后管理（`simulateKrAddPostCare`/`confirmPostCare`）、确认术后管理（`simulateKrConfirmPostCare`/`submitPostCareConfirm`）、KR 在韩重新预约（`krReschedule`）及 5 个弹窗。保留：IN 室长按 KR 判断操作的退款（退尾款差额、退定金，去掉"演示"字样）、「模拟时间超过预计」、对话/来电相关演示。

## 九 演示数据
H1 的 Fajar/Ayu 可选范围带麻醉、在韩时间、术后管理；Nadia = 在韩进行中（今天施术、有 timeline、已判断能施术）；Rina / Wulan = 已结案（子项全部完成）；Dinda（H2）已付定金没有 timeline。数据版本 20。

## 我的判断（待确认）
1. 地点=印尼/均可 的子项不挡结案；"均可"的子项 KR 可在标完成前改成韩国/印尼。
2. 施术子项可关联项目；没关联的施术子项标完成时视为该案件所有未开始项目完成。
3. 更换项目后原项目的术后管理不再计入（原项目 swapped，不算 `krActiveItems`）；更换的新项目没有术后管理资料。
4. 回诊加做的项目不经过麻醉同意书、不进尾款计算（`krAddOn`），在韩国单独付款。
5. 印尼部分术后管理的价格取来源诊所「术后管理」项目的单次价格（印尼盾）× 次数；收款 / 不买之后不能再改。
6. 麻醉同意书只存在案件上，没有同步写进客户的同意书记录（等文案和版本规则）。
