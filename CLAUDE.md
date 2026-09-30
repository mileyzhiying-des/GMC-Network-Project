# 工作规则（最高优先级）

1. 语言：所有回复、计划、进度说明、提问、总结、git 提交信息一律使用简体中文。变量名、函数名保持英文；新写的代码注释用中文。
2. Notion 只读：可以打开 Notion 查阅业务规则，但绝对不要创建、修改、删除任何 Notion 页面或数据库。Notion 由用户另外维护。发现指令和 Notion 规格有冲突时，停下来告诉用户，不要自己决定（除非指令里明确写了"以本指令为准"）。
3. 一次只做一个任务：动手前，先列出会改动的文件，以及相关函数和字段的所有引用位置，给用户确认；完成后 git commit，提交信息写清楚改了什么。
4. 不扩大范围：任务里没写的功能、文案、逻辑不要顺手修改。觉得有必要改，先提出来问用户。
5. 完成后汇报：改了哪些文件、怎么自测的、哪里偏离了要求以及原因。

> 以上规则和下面文档里其他部分有冲突时，以这一节为准（2026-09-29 用户要求置顶）。下面正文里的"项目运行、构建、代码结构"等技术设定原样保留（本来就是简体中文写的），历史沿革内容不删除，仅供参照。

---

# GMC Network — 印尼-韩国医美跨境协作平台

## 项目是什么
GMC 是一个独立第三方仲介，连接印尼合作诊所与韩国医院/院长，撮合印尼客户赴韩医美施术的转诊/协作系统。
角色：印尼室长（IN Coordinator）/ 韩国室长（KR Coordinator）/ 院长（KR Director）/ GMC 工作人员。当前原型只做了印尼室长这一端。

## 现状
- `prototype/gmc-network-prototype.html`：单文件 HTML/CSS/JS 原型，纯前端、无后端，所有数据是内存里的 mock（`CASE_ITEMS` 等全局数组），刷新页面会重置。这是迄今为止和用户确认过的交互/业务逻辑最准确的落地形式——业务规则文档和这份代码如果有出入，**以代码实际行为为准去核对，发现不一致要提出来，不要假设文档更新**。
- `docs/` 下是从 Notion（GMC Network workspace）导出的业务规则快照，写这份文档时（2026-09-23）和代码是同步的。Notion 本身还在持续维护，是业务规则的唯一信源；这份导出只是给 Claude Code 一个离线起点，不是替代 Notion。

## 业务规则唯一信源
Notion「GMC Network」根页面（唯一入口，2026-09-28 更新）：
https://www.notion.so/GMC-Network-3e3eda0cf87b800ba75bc500064c901c

结构：Dashboard / Domain Knowledge（业务规则）/ Feature Specs（按页面组织的功能设计）/ Page Structure（具体页面的交互、数据来源、跳转，比如 IN-CASE-02 这种页面编号）/ Change Requests（变更历史）。
`docs/` 里的文件是 Domain Knowledge 相关内容的导出快照，不含 Feature Specs 的 Page Structure 细节。涉及具体页面交互/数据来源/跳转的判断，不要只靠 `docs/` 里的旧快照，去 Notion 读对应 Page Structure 页面——Notion 的读写具体规则见下面「工作规则」。

## 读这个项目的顺序
1. `docs/business-rules.md` —— 客户与案件的关系、费用与决策边界、状态与阶段总纲
2. `docs/case-management-flow.md` —— 案件从预约到结案的完整状态机，包含所有分支
3. `docs/conversation-video-flow.md` —— 案件专属对话房、视频通话 AI 转写的三条触发路径
4. `docs/open-questions.md` —— 还没拍板的业务规则，改动这些相关功能前先确认，不要自己替业务方做决定
5. `prototype/gmc-network-prototype.html` —— 实际代码，单文件，直接搜索关键词定位（比如搜 `consultStatus`、`settlementBatches`）

## 已知的代码 vs 文档差距
- ~~booked/consult/travel/local/closed/cancelled 粗粒度状态 + 视频面诊/已付款判断的历次修订~~ —— 2026-09-29"案件流程对齐"整体重写，之前几轮关于 `consultStatus`（`written_pending`/`video_awaiting_report`）、`projectsSelected`/"项目已选择"、"已付款用 started 变量猜开始时机"的实现判断全部作废，改用下面这套：
  1. `consultStatus` 出报告前的等待态视频/书面统一合并成 `'awaiting_report'`（"等待报告"），不再区分视频/书面两个不同状态名。
  2. 新增 `projectsEnabled→projectsSelected→scheduleStatus(pending/rejected/无=直接生成)→projectsLocked(待付款)→settlementDone(已付款)→arrivedAtHospital(赴韩施术中/本地管理中)` 这条完整链路，对应 Notion 的"项目确认中→待确认施术时间→待付款→已付款→已到医院"。**"已付款"转施术中的触发时机已经确认为"已到医院"（`markArrivedAtHospital()`），不再是待确认项。**
  3. 终态改成 `cancelReason`（预约取消/面诊取消/全额退款，对应"已取消"tab）+ `closeNote`（null/部分退/仅出报告，对应"已结案"tab）两个字段分别判定，废弃了旧的"已取消预约/已取消（全退）"两个独立终态名。
  4. 退款从"按结算批次"整批处理改成 `cancelProcedureItem()` 按单个项目处理。
  5. 新增二次面诊子流程 `c.secondConsult`（增加面诊-付款后 / 再次面诊 共用），不影响案件主状态，"再次面诊"改成结案前随时可用（不再要求"还没结算"）。
  详细状态机见 `docs/case-management-flow.md`（已同步改写，不是增量修订）。
- ~~术后管理阶段的"事件"机制（症状上报→紧急视频复诊→…）~~ —— 2026-09-30（第十轮）Notion 已明确废止这条规则：赴韩案件施术完成即结案，术后出现并发症改走"新建案件→面诊（免面诊费）→正常流程"，不再需要嵌套在原案件里的"事件"机制，这条差距不用补了。
- Reservation ID：2026-09-29 已实现——预约来访（工作台日历新客人/老客人）生成新案件时会生成 `reservationId`（6位数字+REV），Case ID 生成前显示这个。**待确认**：Case ID 生成后 Reservation ID 要不要保留为历史字段，还没拍板（Case ID 生成前显示 Reservation ID 这条本身已确认，不受影响）。
- 结算的具体预付比例（原型里硬编码 `KR_DEPOSIT_RATE = 0.3`）只是演示占位数字，不是业务方拍板的数字——业务方还在确认中，改这个数字之前不要当成已确认的需求。
- 【待确认】`客户管理`列表里"当前面诊·施术进度"这一列实时读该客户名下未结案/未取消案件的 `caseStatusBadge`（没有案件时才落回手填的兜底文案）。这是我按"这一列的表头本来就叫这个名字，应该和案件状态一起动"这个理解做的实现判断，不是业务方明确拍过板的规则，改动/回退前先确认。
- ~~案件专属对话房只在"主动发起过对话"的案件才存在，但代码里面诊自动通知推送到 main 全员房间~~ —— 面诊自动通知推送到 main 房间这部分本来就和"案件房建房入口"是两回事（一个是面诊需求通知，一个是案件房什么时候出现），2026-09-29 已经把案件房的建房规则改对（`sendFloatMsg()` 发第一条消息才建房，`openFloatingChat()` 不再顺手建空房），这条差距已解决。
- 【TODO，2026-09-29 新增，Notion IN-VIDE-01/Conversation Flow 里有但原型没做】
  1. "引用消息到案件对话房"：在其他房间把消息引用到某案件，该消息应该出现在案件房里，原型没做这个跨房引用功能。
  2. 对话房"成员"管理界面：规则上是"院长+全部印尼室长+全部韩国室长"，原型只在"发起视频"参与人弹窗里体现了候选名单，房间本身没有可查看/管理成员的界面。
  3. ~~已有案件内的到访（术后管理、本地项目到店）应该走什么流程还没定~~ —— 2026-09-30（第十轮）已解决：不开特殊的案件内到访流程，术后到店/使用持有项目统一走"预约来访"开新案件，见 `docs/open-questions.md`"已解决"部分。
- 【待确认】`案例库`页面 2026-09-29 从"新标签页独立小窗口"改成了站内 `nav('in-library')` 页面（原来的弹窗装不下分类树/角色切换/编辑这套交互）。里面还有几处我自己的实现判断，没有业务方拍过板：
  1. "院长"这一档第3级节点只在原型加载时从 `DIRECTOR_LIST`（预约改期用的院长下拉源）复制一次种子数据，之后完全独立维护，不双向同步。
  2. 卡片上"点院长名跳转"实现成把顶部三级筛选自动定位到 赴韩施术 > 院长 > 该院长节点，不是单独开一个院长详情页。
  3. 节点删除/批量更改标签时，目标节点只能选"同一个第2级分类下的兄弟节点"（比如"部位"只能改到别的"部位"），不支持跨类目合并。
  4. 需求没提到案例本身的删除功能，只做了新增/编辑，没加案例删除。
- 【待确认】2026-09-29（第五轮）重做了`项目库`页面，以 Notion「Project Library 项目库」规格为准（第6条"非活性化与删除"是 Notion 没有、用户当场给的新规则，已按"以本指令为准"实现）。里面有几处我自己的判断，没有业务方拍过板：
  1. `PROJECT_CATEGORIES` 的分类名称（赴韩：眼部/鼻部/轮廓/面部年轻化/胸部/身体；本地：提升/脱发/去除色素/脱毛/填充/水光/黄金微针）是我从用户给的演示项目清单标题直接提取的，不是 Notion 原文列出的分类名单，请核对。
  2. `simulateKrProjectSwap()`（演示：模拟韩国更换项目）按用户确认精确复现"鼻综合（假体+鼻尖）→假体隆鼻"这一对；如果当次施术链里恰好没有"鼻综合（假体+鼻尖）"，退回成通用逻辑（换成另一个启用中的赴韩项目），这个退回逻辑是我自己加的兜底，不是用户明确要求的。
  3. 原来15个 demo 案例（`ayu/fajar/nadia/dinda/rizky/rina/wulan/lina`）里引用的项目名，按用户"需要，修改"的答复，全部换成了新项目库里的真实项目（不是保留旧名字当"历史快照"处理），价格、批次金额、Timeline 文案跟着重新算过。
  4. `FX_RATES` 是纯前端写死常量（已按要求加了 `TODO: 接入实时汇率API` 注释），没有接任何真实汇率源。
  - 上面"已付款"那条【待确认】（`deriveCaseStage` 用"是否有项目被标记完成"代替"开始施术"）这一轮没有改，还是待业务方给准确定义。
- 【待办，2026-09-29（第七轮）新增】`caseStatusSub(c)` 里 `paid_waiting_kr`/`video_scheduled` 对应的细节文案（"已缴费，等待Kr室长/院长回复"、"面诊时间已确认"）这一轮没有跟着改，现在文字上和新拆出来的两个主状态名"等待确认面诊时间"/"等待面诊"不完全对齐。用户当次任务明确说了这次不改，先留着，下次涉及这块再顺手同步。
- ~~【第八轮】"项目列表tab：院长推荐+已选分组"（`c.directorRecommendation`、只读推荐卡片、项目库"院长推荐"标签）~~ —— 2026-09-29（第九轮）"项目列表/赴韩施术/本地管理重构（以本指令为准）"指令明确废止了这份指令，已把 `directorRecommendation`/`directorRecommendationCardHtml`/`isDirectorRecommended`/`defaultRecommendationItems`/`secondRoundRecommendationItems` 整套代码移除；"不自动预勾选"这条保留，改由新的 `krScope`（赴韩可选范围）机制承接，见下面第九轮条目。
- 【第九轮判断点，2026-09-30 第十轮部分改写】"项目列表/赴韩施术/本地管理重构"里几处是我的实现判断：
  1. 首次出报告（`applyDirectorPlan`）用的演示 krScope 项目清单是我编的demo数据，不是业务方给的清单（第十轮沿用这个做法，只是清单内容变了，见下面第十轮条目）。
  2. "施术日期"用简化月历（`krDateCalendarGridHtml()`，只选日期，未开放日期置灰不可点），不是下拉框——这是我对需求文字的实现选择，第十轮沿用。
  3. ~~"确认后修改日期→KR室长无法确认新日期"按"等同无法协调"实现~~ —— 2026-09-30 第十轮已按用户明确指令改正：KR排不上新日期**不自动取消**，回到可重新选日期状态、原日期继续有效，只有手动点"无法协调"才真正取消退定金，`docs/open-questions.md` 对应条目已移到"已解决"。
  4. ~~两种项目都有的案件，本地管理tab独立于赴韩排期状态~~ —— 2026-09-30 第十轮"本地管理"tab整个取消，本地项目结算后直接转客户持有，这条判断随旧实现一起作废，见下面第十轮条目。
  5. "意向项目"选择器交互用一个新弹窗（多选chip+KR/IN切换），不是下拉框——沿用。
  6. ~~本地管理到店事件复用日历 `type:'post'`~~ —— 2026-09-30 第十轮已按明确指令废止："不再使用'术后管理'事件类型"，改走"预约来访"开新案件，这条判断随旧实现一起作废。
  7. `KR_DEPOSIT_RATE` 沿用现有0.3，不改（这个本来就是待确认项，一直没碰）。
  8. "仅出报告"终态仍然没有活的触发路径——`docs/open-questions.md` 第3条持续待确认。
- 【待确认，2026-09-30（第十一轮）新增】"退款原因+模拟KR标记无法施术"里几处是我的实现判断：
  1. 原型原本没有退款弹窗（用 `confirm()`），我新建了 `#refund-overlay`，退款原因必填、写入 Timeline，不存独立字段；入口有两个：结算区"取消退款"链接、赴韩施术tab顶部提示的"处理退款"。
  2. `c.krUnable={items,reason,at}` 是我新加的字段；无法施术项目只能从未完成的赴韩项目里选；演示按钮在 `krSchedule.status==='confirmed'` 且未结案时显示；标记不改案件主状态，退款处理完自动清掉。
  3. "无法协调"（`cannotCoordinateKrSchedule`）没加退款原因，指令未提。
- 【待确认，2026-09-30（第十轮）新增】"持有项目/案件结案/赴韩施术调整"指令里几处是我的实现判断，不是业务方指定：
  1. 术后管理演示项目（术后消肿护理1次/术后疤痕修复护理1次）及价格是我编的demo数据；"模拟KR补加术后管理项目"固定选项目库里第一个可用的术后管理项目，这个"选哪个"的逻辑也是我的判断——已记入 `docs/open-questions.md` 第5条。
  2. "术后管理"项目虽然归类本地项目，但选购限制我实现成和赴韩项目一样"只能从krScope里选"，且和赴韩项目共用同一个 `krScope.items` 数组（按 `categoryId` 区分二者），不是分开两个字段存——这是我对数据结构的选择，不是业务方指定的存储方式。
  3. "已选择/结算区"的本地项目卡片里，"持有 X 次"目前只是信息提示（告诉室长客人已经有多少），不会在选购这一步直接联动抵扣——真正的抵扣只发生在"持有项目使用"这个独立界面。这是我对"项目名后面显示持有X次"这句话的场景判断：选购新项目和消耗已有持有是两个分开的动作，不在同一步里混合处理。
  4. 持有项目"使用它的案件或项目被取消时，次数退回持有"这条规则只实现了正向的"使用即扣"，没有对应的撤销/退回UI——已记入 `docs/open-questions.md` 第4条。
  5. 客户详情"本院项目记录"点开某个项目的某一购买批次，"已用"明细目前默认展开显示（不是点了才展开），这是简化的演示交互，不是业务方明确要求的点击行为。
  6. demo案例大幅改写：`rizky` 从"本地管理中还有未完成本地项目"（这个概念已经不存在）改成"管理进行中，待用持有项目"；`rina` 补了 `krSchedule`/`krBalancePaid` 并把已完成的本地项目挪到 `CLIENT_HOLDINGS` 种子数据里；`wulan` 从"本地项目部分退款"（本地项目现在不能退）改成"赴韩项目取消一个、完成一个"的部分退演示。

（某项差距在代码里补齐后，把对应条目从这里删掉或改写，让这个列表始终和代码现状一致。）

## 当前进度
（每完成一轮改动更新这里；只记"做到哪一步了"，不重复"已知差距"里的具体内容。）
- 2026-09-28：把 `docs/case-management-flow.md` 确认过的细分状态机同步进了 `caseStatusBadge`/`caseStatusSub`/`deriveCaseStage`（详见上面"已知差距"）。这一轮之后又补了一次 CLAUDE.md：更新 Notion 根页面链接，新增下面「工作规则」一节。
- 2026-09-28（第二轮）：`案件管理`按上面同步好的每个细分状态各加了一个 demo 案例（`CASE_ITEMS` 里新增 `andi/yuni/maya/putri/dedi/budi/ayu/fajar/nadia/rizky/rina/wulan/agus/lina`，共 15 个覆盖全部状态的案例，用 `makeCase()` 工厂函数生成，减少重复字段）；`客户管理`（`CLIENTS`）补了对应客户档案，并把状态列改成实时读案件徽章（见上面"已知差距"的待确认项）；`对话`给已生成 Case ID 的案例都开了对应的案件专属房间（`CHAT_DATA['case-<id>']`），内容和案件当前阶段对得上。顺带修了 `renderClientCases` 里"正在进行案件"会把已取消案件也算进去的小问题。
- 2026-09-29（第三轮）：重做了`案例库`页面——1/2级分类固定（赴韩施术>院长/部位，印尼管理>问题/产品）、3级起可增删改（`LIB_NODES` 扁平表+`parentId`，不写死层数），案例挂节点 id、多选、演示用角色切换（印尼室长/韩国室长·院长）决定新建案例来源和两个分支各自的编辑权限，新增/编辑表单（术前/术后照片+每张术后照片必选恢复时间、院长单选、分类多选），节点删除/批量改标签支持"改到别的节点"或"移除标签"两种处理。原有8个示例案例保留并归到"赴韩施术"。判断点见上面"已知差距"。
- 2026-09-29（第四轮）：按 Notion 已确认的两点改回了 `endVideoConsult`/`deriveCaseStage`：视频面诊结束先进"面诊已结束"（新 `consultStatus:'video_awaiting_report'`），室长上传报告后才是"已出报告"；"已付款"改回可停留的独立状态（新增 demo 案例 `dinda` 覆盖这一状态）。具体判断见上面"已知差距"。
- 2026-09-29（第五轮）：`项目库`从弹窗改成站内页面（`nav('in-projectlibrary')`），数据结构换成 `{id,origin,name,price,categoryId,active}`，加了单层分类（每组一套，增删改+按分类筛选）、非活性化/重新启用/删除（在用中不可删）、演示用角色权限（复用案例库那个角色开关，改名成两处共用的 `DEMO_ROLE`）、三种币种显示切换（`FX_RATES`/`formatCurrency`/`displayAmount`）。案件里选项目/结算/退款/Timeline 全部改成读快照（`toggleProject` 选中时把 `{projectId,name,price,currency,origin,categoryId}` 拷贝进 `recommended`/`procedureItems`，删掉了所有"按项目名回查 `PROJECT_LIBRARY`"的代码），两种币种任何地方都不再相加、一律分行显示。面诊预填项目换成"鼻综合（假体+鼻尖）+切开双眼皮"，`KR_DEPOSIT_RATE`/`案件状态判定`（`deriveCaseStage`）/`案例库`（除角色变量改名）都没有动。15 个 demo 案例的项目引用和金额也跟着换成新项目库数据（用户已确认）。具体判断点见上面"已知差距"。
- 2026-09-29（第六轮，"案件流程对齐"+"工作台预约"整体重写）：
  1. **案件状态机整体重写**：`deriveCaseStage`/`caseStatusBadge`/`caseStatusSub` 按 Notion 当天版 Case Management Flow 重新实现（主线待访问→接待中→[面诊]→项目确认中→待确认施术时间→待付款→已付款→已到医院→赴韩施术中/本地管理中→已结案），终态改成 `cancelReason`+`closeNote` 两个字段，新增字段 `visibleToKR`/`scheduleStatus`/`schedulePrimary`/`scheduleBackup`/`scheduleConfirmedTime`/`arrivedAtHospital`/`secondConsult`/`reservationId`/`reportUploadedBy`。案件头部按钮改成"发起对话"+按阶段的"增加面诊"/"再次面诊"（`renderCaseHeaderActions`），删掉了旧的"发起视频"。项目/结算/退款整套重写：`confirmProjectSelection→scheduleFormHtml/submitSchedule/simulateKrScheduleConfirm/simulateKrScheduleReject/cannotCoordinateSchedule→generateSettlementBatch(待付款)→settleProjects/confirmSettlementPayment(已付款)→markArrivedAtHospital`，退款改成 `cancelProcedureItem()` 按单个项目处理。二次面诊新增 `c.secondConsult` 子流程（`secondConsultTabHtml` 等一整套函数），不碰案件主状态。15 个 demo 案例全部迁移到新字段（详见 `docs/case-management-flow.md`，已整篇重写不是增量）。
  2. **对话房建房规则修正**：`openFloatingChat()` 不再顺手创建空的 `CHAT_DATA[roomId]`，改成 `sendFloatMsg()` 发第一条消息时才建房，符合"只在主动发起过对话的案件才存在"。新增"对话工具栏发起视频"的参与人选择弹窗（`openChatVideoParticipantModal`）。
  3. **工作台预约（④，IN-DASH-01）从零实现**：日历新增"预约来访"事件类型（`WEEK_EVENTS` 的 `type:'reservation'`，点击进案件页，客户到访后变暗标"已到访"，`markArrived()` 联动）；新增"预约占位"（`RESERVATION_PLACEHOLDERS`，15分钟倒计时、超时自动消失、可再次发送/取消、"模拟客户填写完成"演示按钮转正式预约）；预约空档弹窗老客人模式（下拉选客人+选院长，直接生成 Reservation ID）、新客人模式（手机号+短信编辑框，链接自动插入不可删，"保存为默认"选项）；`generateReservationId()`/`createReservationCase()` 生成新案件（状态"待访问"）；图例"来韩施术"改"赴韩施术"。月历"OFF文字/X项目"统计原型里本来就是这么做的（不是圆点），未改动。**"客户改时间通知室长"用一个演示函数 `simulateCustomerReschedule()` 实现（写消息中心，`EXTRA_NOTIFICATIONS`），不是客户端真实触发。**
  3个文档（`case-management-flow.md`/`business-rules.md`/`conversation-video-flow.md`）已按 Notion 当天版整篇同步；`open-questions.md` 更新了已解决/新增待定项。具体实现判断和未做完的部分见上面"已知差距"。
- 2026-09-29（第七轮，基础资料"取消接待" + 面诊主状态细分）：
  1. **基础资料 tab（接待中）**：苦恼/希望预期/面诊需求三项label加红色 `*`（沿用原有的必填校验，未改校验逻辑本身）；`materialsCardHtml()` 新增"取消接待"按钮，只在生成 Case ID 之前出现。新增 `#cancel-intake-overlay` 弹窗 + `openCancelIntakeModal()`/`closeCancelIntakeModal()`/`confirmCancelIntake()`：确认取消后丢弃本轮草稿（`metaviewStatus`/`photoUploaded`/`videoUploaded`/`concern`/`expectation`/`needsConsult` 复位成初始值），`subState` 回 `'waiting'`（案件回到"待访问"），联动把 `WEEK_EVENTS` 里对应预约来访事件的 `arrived` 改回 `false`，Timeline 记一条"取消接待"事件。
  2. **面诊主状态机细分**：`consultStatus==='paid_waiting_kr'` 从原来落到默认分支的"等待面诊"拆出来，`caseStatusBadge` 新增独立分支显示"等待确认面诊时间"；`video_scheduled` 的 badge label 从"面诊已排期"改成"等待面诊"（现在专指"视频面诊时间已确定"）。`awaiting_payment`（等待缴纳面诊费）分支完全没动，它现在走的是 `caseStatusBadge` 里没有专门分支时的默认兜底值，显示还是"等待面诊"这个词（和新的 `video_scheduled` badge 文字巧合相同，但代码分支是分开的，互不影响）。
  3. **面诊 tab 交互**：`paid_waiting_kr` 分支文案改成"等待韩国室长确认面诊形式与时间"，原来两个演示按钮（模拟院长视频面诊/模拟院长回复书面建议）合并成一个"演示：模拟KR室长回复"，点开新增的 `#kr-reply-overlay` 弹窗二选一，选项通过 `prompt()` 输入时间/预计时间（默认值沿用原来写死的 `09.22 14:00`/`2 小时`）后调用参数化后的 `skipToVideoConsult(time)`/`skipToWrittenConsult(eta)`。`video_scheduled` 分支新增"演示：模拟院长视频面诊"快捷按钮 `simulateDirectorVideoConsult()`，跳过手动进入通话直接走完视频面诊全程。二次面诊 `secondConsultTabHtml()` 的 `video_scheduled` 分支同样加了快捷按钮 `simulateSecondConsultVideoDone()`。
  4. **重构去重**：把 `endVideoConsult()` 里"生成AI记录+转等待报告"这段逻辑分别抽成 `finishVideoConsult(c)`（主面诊）和 `finishSecondConsultVideo(c)`（二次面诊），新的快捷演示按钮和真实的通话结束流程共用同一套逻辑，行为完全一致。
  5. `docs/case-management-flow.md` 分支4同步改写（补上"等待缴纳面诊费"节点，"等待面诊"/"等待确认面诊时间"改成新拆法，旧"面诊已排期"标注已废弃），并新增"取消接待"小节（区别于分支1的"取消预约"）。
- 2026-09-29（第八轮，项目列表tab：院长推荐 + 已选分组）：
  1. **取消自动预勾选**：`applyDirectorPlan(c)` 不再把推荐项目塞进 `c.recommended`，改成生成只读的 `c.directorRecommendation`；`defaultRecommendedSnapshot()` 改名重写成 `defaultRecommendationItems()`，输出 `{name,type,price}` 格式，不挂项目库id引用。`projectsEnabled` 照常置 `true`。
  2. **顶部只读卡片**：新增 `directorRecommendationCardHtml(c)`，标题"院长推荐项目·第N次面诊·院长·日期"，赴韩/本地分两组，纯展示无交互；只在 `projectPickerHtml(c,false)`（首次选择界面）顶部插入，`isAddition`（追加项目）不显示。
  3. **项目库标注**：新增 `isDirectorRecommended(c,p)`（按项目名+来源比对），`projectPickerHtml` 左侧项目库每行命中就加"院长推荐"小标签，赴韩/本地两个tab都生效，不影响勾选。
  4. **已选分组**：新增 `selectedGroupedHtml(selected)` 替换掉原来的 `rightRows`+`selectedTotalsHtml`，右侧"已选择"按赴韩/本地分两组各自小计渲染，没选的组整个隐藏，不出两组相加的总计；"确认所选项目"按钮和结算逻辑未动。
  5. **二次面诊联动**：`secondConsultChanged(true)`（有变动）新增用最新报告的推荐覆盖 `c.directorRecommendation`，`round` 取 `c.consultRound||1`，新增 `secondRoundRecommendationItems()` 演示清单。
  6. demo案例 `ayu` 的 `recommended` 清空为 `[]`（体现不再自动预选），改用 `directorRecommendation` 存原来的两个推荐项目；`fajar`（项目已选择态）的 `recommended` 保留不变，额外补了 `directorRecommendation`，方便"修改所选项目"退回picker时标签还在。
  判断点见上面"已知差距"。
  > ⚠️ 本轮整份被第九轮废止：`directorRecommendation` 相关代码已全部移除，`fajar` 也已改成"待付款"demo案例，不再是"项目已选择"（这个中间态本身已经不存在了）。
- 2026-09-29（第九轮，"项目列表/赴韩施术/本地管理重构（以本指令为准）"，废止第八轮"院长推荐"整份指令 + 旧排期规则）：
  1. **取消自动预勾选（换机制）**：不再用"院长推荐只读卡片"，改成 `c.krScope = {items:[{name,price,note}], overallNote, updatedAt}`（KR室长整理的赴韩可选范围，`applyDirectorPlan` 出报告时写演示数据，新增 `simulateKrScopeUpdate()` 演示按钮可随时加项目）。项目列表"赴韩项目"子tab只显示 `krScope.items`，没有krScope显示空状态引导（不面诊案件带"增加面诊"按钮）；"本地项目"子tab不受限，照常显示完整项目库。
  2. **基础资料新增两个字段**：`materialsCardHtml` 在"希望预期"下面加"意向项目"（必填，新增 `#intention-project-overlay` 多选弹窗，KR/IN都能选）+"预算"（选填，Rp区间）；`confirmMaterials` 校验加入意向项目必填；`basicTabHtml`/面诊资料tab（新增 `consultIntentionCardHtml`）只读展示这两项。
  3. **已选择/结算区重写**：新函数 `settlementBigCardHtml(c, items, removable)`（一张大卡包"赴韩项目"/"本地项目"两张二级卡，各自显示合计/定金/全款+备注栏）取代旧的 `selectedGroupedHtml`/`directorRecommendationCardHtml`/批次展示；新增 `noteFieldHtml`/`saveCaseNote` 存 `c.noteKR`/`c.noteIN`/`c.noteOverall` 三个备注；金额一律用固定币种 `formatCurrency`，不再走 `displayAmount`+币种切换——顺带修了"本地项目显示≈¥"那个bug。
  4. **主状态机重写**：`confirmProjectSelection` 确认后不管有没有赴韩项目，统一立即 `generateSettlementBatch`（不再判断hasKR），删除了 `scheduleFormHtml`/`submitSchedule`/`simulateKrScheduleConfirm`/`simulateKrScheduleReject`/`cannotCoordinateSchedule`/`c.scheduleStatus`等旧字段；`deriveCaseStage`/`caseStatusBadge`/`caseStatusSub` 按新顺序重写（有赴韩项目：已付款后进`krSchedule`细分状态"递交施术日期→待确认施术时间→等待施术"，"已到医院"才转`travel`；纯本地：付款后直接`local`，不用等"已到医院"）。
  5. **tab拆分**：`caseTabsHtml`/`caseTabContentHtml` 把旧的"施术"拆成"赴韩施术"（`krProcedureTabHtml`，有赴韩项目才显示）和"本地管理"（`localManagementTabHtml`，有本地项目才显示），删除了 `procedureTabHtml`/`toggleProcSelect`/`batchMarkDone`/`editProcItem`/`moveProcItem`。
  6. **赴韩施术tab**：新增 `krDateCalendarGridHtml()`（简化月历，只选日期，`KR_OPEN_DATES` 演示白名单，未开放置灰）、`submitKrScheduleDate`/`simulateKrScheduleConfirmNew`/`simulateKrScheduleRejectNew`/`startKrScheduleChange`/`submitKrScheduleChangeDate`/`simulateKrScheduleChangeConfirm`/`simulateKrScheduleChangeReject`/`requestCannotCoordinate`/`cannotCoordinateKrSchedule`（取消未完成赴韩项目退定金，有本地项目转本地管理，没有则已取消全额退款）；`markArrivedAtHospital` 改成只在 `krSchedule.status==='confirmed'` 才可用。
  7. **本地管理tab**：新增 `scheduleLocalVisit`/`advanceLocalVisit`（进度 待预约到店→已预约到店→已到店→管理中→完成），联动 `WEEK_EVENTS`（复用 `type:'post'`，加 `caseId`/`itemIndex`，日历点击新增 `openCaseFromCalendar()` 跳转），不生成新Reservation ID/新案件（`docs/open-questions.md` 第3条已解决）。
  8. **加项修复**：`addMoreProjects` 的赴韩侧同样只能从 `krScope` 选；顺带修了一个潜在bug——旧代码"结算追加项目/交定金"直接调 `settleProjects()`，但追加选的项目从没进过 `procedureItems`/`settlementBatches`，永远找不到待付款批次，新增 `confirmAddition()` 先补一步 `generateSettlementBatch` 再打开付款弹窗。
  9. demo案例迁移：`ayu`/`fajar` 改用 `krScope`（`fajar` 从"项目已选择"改成"待付款"，因为这个中间态不存在了）；`nadia`/`dinda`/`rizky`/`rina`/`wulan`/`lina` 的 `activeCaseTab` 从 `'procedure'` 改成 `'kr'`/`'local'`（按各自有没有对应项目分配）；`dinda` 新增 `krSchedule:{status:'pending',...}` 演示"待确认施术时间"这一档。
  10. `docs/case-management-flow.md` 主线/施术日期规则/分支8/分支9 同步重写（旧内容标注已废弃保留），`docs/open-questions.md` 解决第3条、新增第3、4条待确认。
  判断点见上面"已知差距"。
  > ⚠️ 本轮第5/6条（"本地管理"tab、日历联动）已被第十轮废止并整个删除；第7条（`markArrivedAtHospital`）已改成KR端演示按钮，不再是IN端按钮。
- 2026-09-30（第十轮，"持有项目/案件结案/赴韩施术调整"，废止第九轮第6节"标记已到医院"+第7节"本地管理tab"整节）：
  1. **持有项目体系新增**：`CLIENT_HOLDINGS`（按客户姓名存 `{itemName,category,batches:[{caseId,date,bought,used,usages}],krCollected}`）+ `grantHolding()`/`useHolding()`（FIFO扣减）/`holdingRemaining()`/`holdingTotal()`/`clientHoldingsSorted()`（术后管理置顶）。`confirmSettlementPayment()` 结算后把批次里的本地项目（含术后管理）立即 `grantHolding` 并从 `c.procedureItems` 移除，不再进入案件进程；只有KR项目继续留在 `procedureItems`。
  2. **案件结案改用 `visitClosed`**：新字段 `c.visitClosed`/`c.krBalancePaid`/`c.hadPartialCancel`；`deriveCaseStage` 大幅简化——`visitClosed` 直接判 `closed`；有KR项目：`settlementDone` 未到医院前在 `consult` 桶，到医院后在 `travel` 桶，KR标记"施术完成"才 `visitClosed`；纯本地：`settlementDone` 后直接 `local` 桶（"管理进行中"，`CASE_TABS`/`CASE_STAGE_BADGE` 同步改名），付款后不再需要判断项目"是否都done"。
  3. **KR三步操作改端上演示**：新增 `simulateKrMarkArrived()`/`simulateKrMarkBalancePaid()`/`simulateKrMarkProcedureDone()`（施术完成直接 `visitClosed=true`，`closeNote` 按 `hadPartialCancel` 判定"已结案"还是"已结案（部分退）"），删除了IN端的 `markArrivedAtHospital()`按钮；新增 `simulateKrAddPostCare()`（模拟KR补加术后管理项目，直接 `grantHolding` 标 `krCollected:true`）。
  4. **修改日期规则改正**：新增 `cancelKrScheduleChange()`（取消修改，回到confirmed原日期不变）；`simulateKrScheduleChangeReject()` 改成不自动取消——回到 `change_pending` 可重新选日期的状态（`changeSubmitted=false`），原 `confirmedDate` 不变；"无法协调"独立成 `requestCannotCoordinate()`，只有手动点这个才真正取消。`cannotCoordinateKrSchedule()` 简化：本地项目已经不在 `procedureItems` 上，取消完KR项目后必然清空，直接判"已取消（全额退款）"，删掉了原来"有本地项目就转本地管理"的死分支。
  5. **月历默认月份修复**：新增 `nearestOpenMonth()`，首次递交时锚定"最近的可选月份"（`confirmSettlementPayment`/`simulateKrScheduleRejectNew` 里设置），修改日期时锚定"原定日期所在月份"（`startKrScheduleChange`/`simulateKrScheduleChangeReject` 里设置），不再依赖 `KR_SCHED_VIEW_MONTH` 这个全局变量翻页后停留的位置；`KR_OPEN_DATES` 扩到9/10/11三个月。
  6. **本地项目结算细节**：`toggleProject`/`setInItemField` 给本地项目加 `qty`/`discountPct`/`itemNote`；`computeBatchBreakdown`/`inLineTotal`/`settlementItemRow` 按个数×折扣算总价，同时显示原价划线价；已持有的项目在项目库行/结算行都加"持有X次"提示（仅展示，不在选购这步联动扣减，见已知差距）；`cancelProcedureItem` 改成只对KR项目生效（本地项目结算后已经不在 `procedureItems` 上，也不允许退款）。
  7. **术后管理分类+krScope扩权**：`PROJECT_CATEGORIES`新增"术后管理"（`POST_CARE_CAT_ID`），`PROJECT_LIBRARY`加2个演示项目；`projectPickerHtml` 的本地tab拆成"术后管理"（复用 `krScope`，按 `categoryId===POST_CARE_CAT_ID` 过滤）+ "其他本地项目"（不受限）两块；赴韩tab的 `krScope` 取用同步加 `origin==='KR'` 过滤，避免术后管理项目混进赴韩列表。
  8. **不面诊/面诊取消入口改造**：新增 `c.entryChoicePending`/`c.projectEntryMode`，`confirmMaterials`/`afterConsultCancelChoice(true)` 触发后先显示 `localEntryChoiceHtml()`（"持有项目使用"/"新增项目"二选一），新增 `holdingsUseTabHtml()`/`submitHoldingsUse()`/`notUseThisTime()`/`closeVisit()`（结案时复位 `entryChoicePending`，避免结案后再看这个tab又弹回持有界面）；`projectListTabHtml` 的分支顺序调整为"持有项目使用优先于已选择/结算只读视图"。
  9. **客户详情页新增两块**：`renderClientHoldings()`（持有项目卡片，只列剩余>0，术后管理置顶，没有持有项目不显示）、`renderProjectHistory()`+`toggleProjHistory()`（医美史·本院项目记录，按项目分组，展开看购买批次+使用明细，点CaseID跳转案件；本地项目读`CLIENT_HOLDINGS`，赴韩项目读各案件`procedureItems`）。
  10. **日历还原**：删除 `localManagementTabHtml`/`scheduleLocalVisit`/`advanceLocalVisit`/`openCaseFromCalendar`/`VISIT_STAGE_LABEL`，`buildWeekGrid` 里 `type:'post'` 的 `caseId`/点击跳转逻辑还原成纯装饰（不再联动案件）。
  11. demo案例大改：`yuni` 补 `entryChoicePending`+`projectEntryMode:'new'`；`nadia`/`dinda` 补 `krSchedule`/`krBalancePaid`；`rizky` 从"本地管理中"改成"管理进行中"（待用持有项目，procedureItems清空，改用`CLIENT_HOLDINGS`种子数据）；`rina` 补齐KR字段+挪本地项目到持有种子；`wulan` 从本地项目部分退款改写成赴韩项目部分退款演示。新增 `seedDemoHoldings()` 给 `rizky`/`rina` 写持有种子数据。
  12. `docs/case-management-flow.md`/`docs/business-rules.md` 按 Notion 当天版整篇重写，`docs/open-questions.md` 解决第3条（改期粒度）、新增第4、5条待确认，之前"已有案件内到访"那条已解决记录追加了"后来被第十轮废止重做"的说明。
  判断点见上面"已知差距"。

- 2026-09-30（第十一轮，退款原因+模拟KR标记无法施术）：新增退款弹窗（`openRefundModal`/`confirmRefund`，退款原因必填，取代 `confirm()`）；新增演示按钮"模拟KR标记无法施术"（`simulateKrMarkUnable`/`submitKrUnable`/`openKrUnableRefund`），赴韩施术tab顶部显示"KR已标记无法施术，请处理退款"；部分退其余照常、全退转已取消（全额退款）；未新增"术前评估"状态。判断点见上面"已知差距"。

## 工作方式（沿用和 Claude Chat 讨论时定的规矩）
- 涉及业务规则的改动，先对一遍 Domain Knowledge / Open Questions 有没有冲突，有冲突要先问，不要悄悄按自己理解改
- 页面元素改动要说清楚数据来源（谁填的/从哪个接口来）和数据流向（提交后去哪、触发什么状态变化），不要只写"加个按钮"
- 规则整体作废时保留旧文字，标注"已废弃"，不要直接删——历史版本靠 Notion 的 Change Requests 数据库记录，这份离线文档不追踪版本

## 工作规则（2026-09-28 新增）

1. **语言**：始终用中文回复和记录。
   > ⚠️ 待确认：这条和下面「和设计师协作」一节里"用设计师写消息的语言回复（通常是乌兹别克语）"字面上冲突。按规则 12（本节最后一条），旧内容不能改动/删除，所以那句话原样保留了；这条新规则具体怎么和它配合（比如是不是只在和你直接对话、不在设计师协作场景下用中文），还没拍板，标"待确认"，先问清楚再执行成有分歧的那部分。
2. 每完成一轮改动，更新 CLAUDE.md 的"已知差距"和"当前进度"（没有"当前进度"就新建）。
3. 改动涉及业务规则判断（比如状态怎么流转、谁能操作什么）：
   - 单独列出来，标明"这是我的判断，不是已确认的规则"
   - 不默认它已经是确认过的规则，也不直接写进 `docs/` 里当定稿
   - 先向你确认这条判断是否成立，你明确回复后，才能更新 `docs/` 里的对应内容
   - 在你确认之前，记在 CLAUDE.md 的"已知差距"里，标注"待确认"
4. **Notion 的读写规则**：
   - Notion 根页面：https://www.notion.so/GMC-Network-3e3eda0cf87b800ba75bc500064c901c ，下含 Dashboard、Domain Knowledge、Feature Specs、Page Structure、Change Requests
   - 遇到业务规则拿不准时，先读 Domain Knowledge 和 Feature Specs；涉及具体页面的交互、数据来源、跳转时，读 Page Structure 里对应页面（如 IN-CASE-02）。不要只靠 `docs/` 里的旧快照。读不到 Notion 时先告诉你
   - 原型实际改动与 Notion 记录对不上时，不自己判断哪个对，先问你
   - 修改 Notion 之前，先读 Dashboard（https://app.notion.com/p/3e3eda0cf87b81d98ec5c760ffd20b12）"工作流程"一节，严格按其中的互动规则、Page Structure 专项规则、版本管理规则执行，以 Notion 实时内容为准，细节不在这里重复
   - 写之前必须先向你呈现：要改哪个页面、改之前是什么、改之后是什么，以及和 Notion 现有规则有没有冲突
   - 你明确回复"确认"或"更新 Notion"之后才能写。没有明确确认之前一律不写，你说"先不改"就不改
   - 写完后按工作流程在 Change Requests 里记录，并告诉你改了哪些页面
5. 更新 CLAUDE.md 时，"已知差距"和"当前进度"这两部分可以改写，其他部分只能追加，不改动或删除已有的内容。

---

## 和设计师协作（设计师不会写代码）

设计师在对话里描述想要的改动，由你修改原型代码，浏览器自动刷新显示结果。

- 用设计师写消息的语言回复（通常是乌兹别克语），句子简短、口语化，不用技术术语；除非对方要求，不要在回复里贴代码。
- **所有技术操作都由你来做**：不要让设计师打开终端、运行命令或自己改文件。
- 每次改完，用一两句话说明改了哪个页面的什么，以及上面「工作方式」要求的数据来源/流向。浏览器已经自动刷新，不用让对方手动刷新。
- 对方发截图或 Figma 链接时，按原型现有的视觉风格实现（`:root` 里的颜色变量、现有组件的 class），不要另起一套风格。
- 对话中如果确定了新的业务规则或推翻了旧规则：同步更新 `docs/` 里对应的文件（遵守「规则作废保留旧文字、标注已废弃」），然后提醒设计师这条也要更新到 Notion——Notion 才是唯一信源。未经明确要求不要直接写 Notion。

## 开始工作

设计师说开始（"ishni boshladik"、"boshladik"、"boshlaymiz"、"start"、"开始"、"시작" 或类似的话），或想看项目时：

1. 检查服务器是否已经在运行：`curl -s http://localhost:3000/api/health`
2. 如果没有运行：
   - `node_modules/` 不存在就先 `npm install`
   - 用 Bash 工具的 **`run_in_background: true`** 运行 `npm run dev`
   - 等到 `curl -s http://localhost:3000/api/health` 有响应
3. 打开浏览器：`open http://localhost:3000`（会自动跳转到原型页面）
4. 告诉设计师已经打开，问今天要改什么。

如果 3000 端口被其他程序占用，就在 `.env` 里改 `PORT`，上面所有步骤都用新端口。

## 结束工作

设计师说结束（"tugatdik"、"bo'ldi"、"yakunladik"、"结束" 或类似的话）时：

1. 运行 `npm run build` 确认能正常构建，有错误就修好。
2. 停掉开发服务器（停止后台任务，或 `lsof -ti :3000 | xargs kill`）。
3. 简短总结这次改了什么，并列出需要同步到 Notion 的规则变化（如果有）。

## 开发环境说明

```
prototype/gmc-network-prototype.html   原型（单文件，几乎所有改动都在这里）
docs/                                  Notion 业务规则的离线快照
server/                                Express 服务器：开发时内嵌 Vite，生产时提供 dist/
dev/keep-page.js                       仅开发用：自动刷新后回到刚才所在的侧边栏栏目（不会进入构建）
vite.config.js                         Vite 配置
```

- 保存 `prototype/` 里的文件后浏览器会自动刷新。原型数据都在内存里，刷新后 mock 数据会重置；`dev/keep-page.js` 会把页面带回当前所在的侧边栏栏目（比如在案件详情里改动后，会回到「案件管理」列表）。
- 改了 `server/`、`vite.config.js` 或 `dev/` 之后需要重启开发服务器（停掉后台任务，再重新 `npm run dev`）。
- 保持原型是单文件：`docs/` 和上面的工作方式都按单文件来引用代码位置，不要擅自拆分文件。确实需要拆分时先和设计师确认。

## 部署（和开发者一起）

- `npm run build` 把原型打包成纯静态文件，输出到 `dist/`。
- `npm start` 用 Express 在 `PORT`（默认 3000）上提供 `dist/`，访问根路径会跳转到原型。
- `Dockerfile` 用容器构建和运行同样的内容。
- `dist/` 是纯静态文件，也可以直接放到任何静态托管（Nginx、Netlify、Vercel、S3 等）。
