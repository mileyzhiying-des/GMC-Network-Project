# 工作规则（最高优先级）

1. 语言：所有回复、计划、进度说明、提问、总结、git 提交信息一律使用简体中文。变量名、函数名保持英文；新写的代码注释用中文。
2. ~~Notion 只读：可以打开 Notion 查阅业务规则，但绝对不要创建、修改、删除任何 Notion 页面或数据库。~~（**已废弃**，2026-10-07 由 CMD-1007-00 取代，用户已确认；改成下面的「Notion 写入规则」，旧文字保留作历史）Notion 由用户另外维护。发现指令和 Notion 规格有冲突时，停下来告诉用户，不要自己决定（除非指令里明确写了"以本指令为准"）。

   **【Notion 写入规则】（2026-10-07，CMD-1007-00）**
   - 你对 Notion 原则上只读
   - 唯一例外：Dashboard 下的「Code 任务」数据库，只能做两件事：① 修改任务的「状态」栏位；② 在任务正文的「📥 汇报」区写入内容
   - 不能改「📤 指令」区，不能新建或删除任务，不能改其他任何 Notion 页面
   - 收到"去看 Code 任务"时，按编号顺序执行所有「待执行」任务；跳过「已作废」
   - 开始做时把状态改成「执行中」；动手前需要确认的事项写在汇报区，状态改成「待确认」后停下；做完改成「完成」
   - 若任务有「取代」栏位，以新任务为准
3. 一次只做一个任务：动手前，先列出会改动的文件，以及相关函数和字段的所有引用位置，给用户确认；完成后 git commit，提交信息写清楚改了什么。
4. 不扩大范围：任务里没写的功能、文案、逻辑不要顺手修改。觉得有必要改，先提出来问用户。
5. 完成后汇报：改了哪些文件、怎么自测的、哪里偏离了要求以及原因。

**【固定规则：修改必须写进 Notion 汇报区】（2026-10-12，用户要求，最高优先级，和上面「Notion 写入规则」同级）**
- 每次做完**任何修改**（包括任务以外的补充修改、在对话里答复用户之后做的改动），都要写进对应 Code 任务的 Notion「📥 汇报」区：写清楚**日期、提交编号、改了什么、影响哪些功能**。
- 不属于任何任务的修改，写进**最相关的那个任务**。
- 有问题要问用户时，也写进汇报区，并把任务状态改成「待确认」。
- **不要只写在对话或 CLAUDE.md 里**（CLAUDE.md 是离线备份，Notion 汇报区才是用户看的地方）。

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
> 【2026-10-01 追加】Notion 已整理：正文只保留现行规则，旧规则移到各页面下的「📦 历史版本」子页面——**那些内容已作废，不要读、不要引用**。状态名称/颜色/小状态/流转规则以「状态机总览 State Machines」为准；术语见「Glossary 术语表」（原 Status Dictionary）；流程见「Case Management Flow」（按 00–09 编号）；页面细节见 IN-CASE-01/02/03、IN-CLNT-01、IN-DASH-01、IN-VIDE-01。

## 读这个项目的顺序
1. `docs/business-rules.md` —— 客户与案件的关系、费用与决策边界、状态与阶段总纲
2. `docs/case-management-flow.md` —— 案件从预约到结案的完整状态机，包含所有分支
3. `docs/conversation-video-flow.md` —— 案件专属对话房、视频通话 AI 转写的三条触发路径
4. `docs/open-questions.md` —— 还没拍板的业务规则，改动这些相关功能前先确认，不要自己替业务方做决定
5. `docs/prototype-vs-notion-gaps.md` —— （2026-10-01 追加）原型和新版 Notion 的不一致清单，按 Notion 页面分组；改原型前先看它
5. `prototype/gmc-network-prototype.html` —— 实际代码，单文件，直接搜索关键词定位（比如搜 `consultStatus`、`settlementBatches`）

## 已知的代码 vs 文档差距
（2026-10-05 第二十九轮按现状重写：只留还真的存在的差距。业务规则已全部写进 Notion；我自己的实现判断在 `docs/open-questions.md` 第 2 节和各轮小节里，标"待确认"的才需要业务方看。）

**仍然存在的差距 / 待确认**
1. **赴韩项目的 KR 端维护**：（2026-10-07 KR 端页面已全部做完，见 `docs/kr-side.md`）赴韩项目新增/翻译录入没有入口；原型里"演示用"角色下拉已在第三部分删除，所以不再演示 KR 室长维护（Notion IN-SRVC-01 写"赴韩项目没有操作"，一致）。
2. **Notion 待业务方拍板**：赴韩定金比例（`KR_DEPOSIT_RATE=0.3` 只是演示占位，用户确认维持）；KR 代收术后管理项目的对账方式；赴韩取消时定金没退的部分归印尼诊所还是韩国医院。
3. **只有演示、没接真实服务**：即时汇率（`FX_RATES` 写死）、AI 翻译（演示翻译）、视频通话/来电铃声/即时转录/录像、AI 转写（见 `docs/conversation-video-flow.md` 的 Integrations & APIs 背景，方案 A/B 待选）。
4. **数据在浏览器 localStorage 里**（第三十轮起，多标签页同步；没有后端，换浏览器/清缓存就没了；真实上传图片只在内存）；设定和 memo 同样带版本号 `DEMO_DATA_VERSION`。
5. **没做的页面/字段**：院长端（只记在 docs）、KR 端页面。客户自助预约页、客户详情的隐私协议/基础信息已在第三十三轮做完（见下）。
6. **通知**：系统更新的"没上线的人下次登录弹出"没做离线队列；"未接来电"没有真实超时判断；通知 90 天清除只是显示时过滤。
7. **对话**：抽屉 🔍 只搜房间名；未读数只有演示数据 + "模拟新消息"会增加。
8. **术后管理**："KR 确认（可变更）"只做了标注进行时间，没做改项目/改次数；IN 侧的"更换项目"没有演示入口（只有 KR 发起）。
9. **账号/权限/设定/经营数据/操作 log**（第三十二、三十三轮已全部做完）：仍待确认的见 `docs/accounts-settings.md` 各部分「我的判断」；经营数据只是基础版（具体看哪些数字待讨论）；韩文/印尼文界面只翻译了侧边栏、按钮和设定页（其余显示中文）；提示音开关只存了值，没有真实铃声；老板没有铃铛，加购验证码用页面横幅演示。

**旧名称已清理**（对照表见 `docs/case-management-flow.md` 末尾）：Reservation ID、等待确认面诊时间/等待缴纳面诊费（主状态）、待付款/已付款/待确认施术时间/等待施术（大状态）、赴韩施术中、管理进行中、已出报告（状态）、AI整理中、邀请室长视频、等待面诊、面诊进行中、视频/书面面诊、二次面诊、再次面诊、提及案件、"预计 X 内提交"。

## 当前进度
（2026-10-01 压缩重写：只记"做到哪一步了"，用现行术语；逐轮改动细节看 git 提交信息。）

**已落地的结构（原型 `prototype/gmc-network-prototype.html`，纯前端 mock）**
- **Case ID**：预约时直接生成（`createReservationCase()`），取消 Reservation ID；取消的预约、未到店的案件都保留 Case ID；发起对话/+添加本地管理/增加面诊/附件tab/引用与新建案件对话/关联下拉候选都以"基础资料已确认"（`c.materialsConfirmed`）为开关，取消接待只在确认前。
- **案件主状态两层**（状态机总览）：14个大状态 + Tone 颜色 + 小状态行统一组件（Success/Waiting/Warning）；施术日期卡片（`scheduleState`：Draft/Pending/Confirmed/Changing/Arrived）是主状态的单一来源；终态只有已结案/仅出报告/已取消，由 `computeOutcome()` 推算，`financeResult`/`refunds`/`cancelReason`（预约取消/未到店/面诊取消/管理取消/未购买未使用）独立。
- **案件列表**：8个tab+"有退款"筛选（含持有批次退款记在购买案件上的、仅办理退款的案件）+"仅看我的"；列 = 客户名/Case ID/当前状态（大状态+取消原因+"本地管理进行中"小标签）/状态正常·非正常/财务（有退款另标）/对接院长（本地案件为空）/IN 室长/KR 室长（按操作记录自动标注）/更新时间；待访问行内按钮 [已到店][预约取消][未到店][预约修改]；演示按钮「模拟时间超过30分钟」。取消原因：预约取消/未到店/管理取消/未购买未使用/仅办理退款。
- **未到店**：`markNoShow()`/`simulateTimePass30()`，日历事件保留原位+删除线（预约取消的事件消失）。
- **面诊资料tab**（只有一种面诊：付面诊费 → 待确认报告时间 → KR 确认预计出报告时间 → 等待报告（倒计时，超时只提醒）→ KR 室长提交报告；一个案件只面诊一次）：面诊费卡（待缴费/已缴费/已免除/已取消）；待缴费时内联表单选"已缴费/免除面诊费"（免除原因：复诊/延续既往面诊/其他；关联复诊/延续既往面诊时默认预选，可改，原因必填）；［面诊取消］只在待缴费时可用，取消后案件转"选择项目"+本地管理；延续既往面诊等待报告时可"模拟院长判断：无变动/有变动"；不面诊案件付款前后都可点［增加面诊］（付款后主状态也进面诊预约，已买本地项目照常使用，显示"本地管理进行中"小标签）；室长商谈入口只有报告卡［邀请室长商谈］（直接开视频）。
- **项目列表tab**（只在面诊案件出报告后）：KR 可选范围、本地项目个数/折扣/备注、结算单列表（待付款/已付款/部分退款/全额退款，新的在上）、结算单「取消项目」（到院后隐藏）、「客人不做项目」；赴韩项目全取消后弹窗问是否做本地管理。
- **赴韩施术tab**：施术日期合并月历；赴韩项目行（未开始/已完成/已取消/已更换）+ ItemFlag；**到院后（06）**：「模拟KR判断能否施术」三结果（能·没变动→付清尾款→标完成；能·有变动→标无法施术/更换项目→尾款按实际项目重算多退少补→可选改施术时间→标完成；不能→KR在韩重新预约 或 退定金→仅出报告）；到院后 IN 端隐藏修改日期/无法协调/取消项目；退款弹窗提示"金额按 KR 室长判断填写"。
- **本地管理tab**：本地案件（选"不面诊"/面诊取消后做本地/无法协调后做本地管理）的"选择项目→本地管理"完整流程；面诊/赴韩案件的「+添加本地管理」；项目行 进行中/已完成/已取消（次数归还，不是退款）；同一次到店里可继续选购/继续使用；全部标完自动判结局。
- **术后管理**：持有批次的"进行时间"（KR 确认并标注）、使用时置顶并按进行时间排序、使用后自动关联原案件并对 KR 可见（只读）；无法协调时术后管理按本地项目规则处理（保留，或整批退款填金额+原因），不再自动作废。
- **客户详情/列表**：持有项目卡（项目层只列剩余>0，展开显示全部批次，有剩余次数（未使用/部分使用）的批次都可退款，退款后作废）、本院项目记录（已用明细tab）、医美史·案件记录读真实案件、客户Timeline（案件开始/结案/进行中 + 基础信息修正）；客户列表取最近一次有操作的案件。
- **其他**：关联之前案件（含自动关联、报告带入附件）、附件tab（上传选分类、保存期限标签）、基础资料 메타뷰/照片/视频 确认后仍显示并保留［补充上传］（只增不删、进附件、Timeline 记录）、案例库（分类用项目库、按部位/按施术管理两种首页、案例详情/展示模式、同意书必填）、项目库（两组、非活性化与删除规则、使用情况）、对话（案件房/职员间、引用案件、@ / # 快捷键、视频来电）、通知中心、预约占位（倒计时/再次发送/取消/转正式/客户改选其他时间；超时或取消的占位从日历消失，在预约历史里看）；一个案件结束不影响同一客人的其他预约。

**最近几轮**
- 第十五、十六轮（2026-10-01）：Notion 整理后重新对照 → 差距清单 1–12 全部改完（Case ID 提前+功能开关、本地案件 tab 结构、面诊取消时机、本地管理继续选购、到院后判断流程、术后管理、室长商谈、列表行内按钮、未到店等）。
- 第十七轮（2026-10-01，一→七，每部分各一次提交）：**一** 结算单2级tab（`setSettleTab`/`settlementCardsHtml`）+汇总行（`settlementSummaryHtml`）+更换项目另开新结算单（`noDeposit`）；**二** 尾款公式（`krBalanceInfo`：`effDeposit = 定金合计 − 到院前已退`，退款记录 `afterArrival`）；**三** 小状态文字；**四** 面诊流程修正（`simulateKrConfirmConsultTime`/`krChooseConsultMethod`/`written_in_progress`，书面路径直接出报告，删除付费后两个演示按钮）；**五** 免除原因6项（`WAIVE_REASONS`）+"随案件退款"；**六** 关联案件tab（`relatedTabHtml`，`CASE_RETURN` 返回栈）；**七** 延续既往面诊沿用旧报告（`reusableReportSrc`/`applyReuseReport`/`reuseReportHtml`，`c.reuseReport`）。
- 自测：FigJam Happy Path A（16步）视频路径 + 书面路径、B（7步）、延续既往面诊→沿用之前报告、复诊关联→原案件关联案件tab、未到店、到院后部分不能做/不能施术（重新预约/退定金）、更换项目（结算单tab+汇总）都跑过，每步检查大/小状态；全案件全tab渲染无报错。
- 第十八轮（2026-10-01 修正，一→五各一次提交）：**一** 免除原因预选只剩复诊/延续既往面诊；**二** 撤回无法协调自动作废术后管理+删"随案件退款"；**三** 赴韩项目全取消后的结局（保留/全退、是否做/增加本地项目，`localPurchasedBatches`/`caseHasPurchase`/`localKeepChoice`）；**四** 延续既往面诊改造（`continuationInfo`/`reportOverMonth`/`onNewHistoryChanged`/`simulateDirectorJudge`/`judge_pending`，新字段 `reportDate`/`newBeautyHistory`/`contJudged`/`reuseAfterConsult`）；**五** 二次面诊有无变动两条路径（`secondChooseMethod`/`secondConsultJudge`，状态 `written_in_progress`/`judge`/`awaiting_report`）。自测：延续（1个月内沿用/1个月内免除面诊视频·书面各有无变动/超期锁定/新增医美史提示）、无法协调三种结局、二次面诊书面·视频各有/无变动，每步查大状态、小状态和结局。
- 第十九轮（2026-10-01 完整指令，前九部分已在上几轮完成，本轮补 七/十）：**七** `WAIVE_REASONS` 改4项；**十** 到访接续（`ongoingCasesOf`/`resumeBannerHtml`/`continueNewVisit`/`resumeVisit`，接续时 `CASE_ITEMS.splice` 作废本案件、日历事件改挂原案件；演示数据 `ayu2`=Ayu Lestari 新预约，原案件 `ayu`=项目确认中）。自测：无进行中案件不出提示条、接续后列表少一行/原案件状态不变/日历改挂/客户案件里没有作废案件、继续新案件、确认后不再出现。
- 第二十轮（2026-10-02 面诊改版）：面诊只有一种（`simulateKrConfirmReportEta`→`awaiting_report`+`reportEta`/`reportOverdue`→`markReportUploaded`）；删除等待面诊/面诊进行中/视频书面/二次面诊（`secondConsult*`、`consultRounds*`、`requestAnotherConsult`）；面诊取消只在待缴费→选择项目+本地管理（`cancelConsult`，取消原因"面诊取消"废弃）；延续既往面诊走面诊时在等待报告里 `simulateDirectorJudge`；`directorChangeInfo`（出报告前可换院长，复诊/延续锁定原院长）；免除原因3项。详见 `docs/open-questions.md` 第1c节。
- 第二十一轮（2026-10-02 选院长+对话合并版，一→六各一次提交，七八为文档）：**一** 选院长（`DIRECTOR_INFO` 停用标记、`directorLockInfo`/`syncDirectorChoice`/`directorRowHtml`，预约不选院长，本地案件无院长，删除更换院长）；**二** 建房条件与成员（`caseRoomEligible`/`caseRoomMembers`/`ensureCaseRoom`、系统消息、推播 `shouldPushToMe`、成员面板院长静音）；**三** 对话窗口布局（`renderFloatToolbar`、📁 `openRoomFiles`、＋ `sendRoomFile`）；**四** 视频（呼叫名单只有室长、院长可加入、室长商谈直接开视频、🎥 `roomVideoEnabled`）；**五** 提及案件（`openMentionCase`/`mentionCardHtml`）、引用候选、关联tab［查看案件］；**六** 终态归档（`archiveCaseRoom`、`retentionLabel`、对话记录弹窗）。详见 `docs/open-questions.md` 第1d节、`docs/conversation-video-flow.md`。
- 第二十二轮（2026-10-02 增量：引用案件+视频）：**一/二** 提及案件改引用案件（`REF_CHIP`/`openMentionCase`/`deliverRefQuote`/`refBarHtml`、消息 `refCaseId`、案件房引用消息显示"发言人 ｜ 来源房间 ↗"、`pendingQuotes` 建房后带入）+ @/# 选单（`floatInput`/`pickSuggest`/`floatKey`）+ @必提醒（`notifyAtMentions`）；**三** 新标签页（`openCaseNewTab`/`openCaseChatNewTab`/`openSidebarPage`，地址参数 `?case=&chat=open&tab=`/`?page=`）；**四** 视频改来电模式（`VIDEO_CALL`/`startCall`/`renderVideoPage`/`simulateIncomingCall`，抽屉红卡片+工作台卡片 `renderDashCallCard`）；**五** 日历删视频沟通。详见 `docs/open-questions.md` 第1e节。
- 第二十三轮（2026-10-02 对话增量+工作台改版，二/四/五上一轮已完成，本轮做 一/三/六/七/八/九）：**一** 数据对齐（`calendarEvents()` 从案件算事件、`DEMO_VISITS`、`demoNow()` 演示时钟、`DEMO_DATA_VERSION`、新增 Bayu 未到店案件、占位历史 `PLACEHOLDER_HISTORY`、`RESUMED_VISITS`）；**三** 推播对象（`caseOperators`/`pushTargets`）、标题栏房间名▾下拉成员（`memberRowsHtml`）、🔕（`MUTED_ROOMS`）；**六** 日历（三种事件、来访目的、并排、过去灰、30分钟倒计时、撑满、双时间轴 `krTimeOf`+设定 `CLINIC_TZ`、天气）；**七** 今日区块 `renderTodayBlock`、固定栏、memo/OFF（`CAL_MEMOS`）；**八** KR医院日程 `buildKrWeekGrid`、预约历史记录页 `in-resvhistory`；**九** 案件列表 IN/KR 室长两栏+仅看我的。详见 `docs/open-questions.md` 第1f节。
- **提交前自测清单（2026-10-02 紧急修复后新增，必做）**：① 冷启动检查——刷新页面，**不调用任何渲染函数**，直接看工作台、客户管理、案件管理、案例库、项目库、通知中心、对话抽屉有没有数据；② 用浏览器的 console（read_console_messages，只看 error）确认**页面加载和逐页切换都没有报错**；③ 逐页点一遍：工作台、客户管理、客户详情、案件管理（每个 tab）、案件详情（每个 tab）、案例库、项目库、通知中心、预约历史、对话抽屉；④ 删除/改名函数前先全文搜索调用处（含 `setInterval`、`DOMContentLoaded` 初始化、HTML 里的 `onclick`），并跑 `/tmp/check.sh`（函数清单差异+语法+DOM id）；⑤ 初始化代码里每个模块各自 `try/catch`，出错只 `console.error`，不中断整个页面。
- 事故记录（2026-10-02）：第二十二轮 `ca5d343`（四·视频）删掉了 `tickCountdown()`（工作台旧的"距离开始"倒计时）但没删 `DOMContentLoaded` 里对它的调用，初始化中断，客户管理/案件管理/案例库等列表全部为空；当时的自测都是手动调用渲染函数，没做冷启动检查所以没发现。已修：删调用、初始化各模块加 try/catch、全文扫描未发现其他"有调用无定义"。倒计时现在由各自的函数负责：等待报告 `reportWaitSubItems`、预约占位 15 分钟和未到店 30 分钟的 `setInterval`（`data-ph-countdown`/`data-visit-countdown`）。
- 第二十四轮（2026-10-02 项目库，一→六各一次提交，文档在 1g）：**一** 规则（演示角色选项改名）；**二** 项目库页面（搜索、管理分类弹窗、币种切换原币小字、使用情况 `projectUsage`、删除规则 `projDeleteBlockReason`、项目名各语言 `names`+AI翻译演示）；**三** 案件项目选择旁"在项目库查看"→新标签页；**四** 持有批次退款（有剩余次数就能退，退后作废）；**五** 演示数据（非活性化的 Genesis焕肤（客人持有中，删除置灰）/巴西式脱毛/鼻修复（可删除）、Rizky 好莱坞焕肤买2用1）；详见 `docs/open-questions.md` 第1g节。
- 第二十五轮（2026-10-02 案例库重写，docs 1h）：案例挂项目库项目（`LIB_CASES.projectIds`）、院长=名单里的名字/不在名单显示"-"、问题标签 `LIB_PROBLEMS`；首页 `LIB_VIEW`（part/method）+ `LIB_STATE` 层级（home→projects→cases→detail）+ 面包屑；详情页（`libRenderDetail`、对比 `libToggleCompare`、放大、展示模式 `openLibPresent`）；上传/编辑 `LIB_EDIT`（`libEditMissing` 控制保存可点、同意书必填）；联动：项目库使用情况加案例数、删除条件、案件项目选择"查看相关案例"（`?page=in-library&project=`）。已删除旧的 LIB_NODES/院长节点/部位产品节点管理。
- 第二十六轮（2026-10-02 深夜 工作台细节+客户档案，docs 1i）：删除今日区块改"今日 OFF"一行（`renderTodayOff`）、通话卡片在其下；月/周视图同高；背景不整片灰、hover 过去灰/可约粉、当前时段外框（`wk-now`）；事件块两行（名字粗体+目的）；周起始日（`CAL_WEEK_FULL`/`openWeekOf`）；删除［+新建客户档案］，新客人/占位走客人自己填资料表单（`openGuestForm`/`submitGuestForm`）。
- 第二十七轮（2026-10-03 通知中心，docs 1j）：`NOTIFS` 通知数据 + `pushNotif()`（自动算收件人、弹 toast）+ 铃铛下拉 `toggleBellDropdown` + 通知中心页（筛选/全部标已读/点通知打开 `openNotif`，页内/新标签页规则）+ 系统更新详情；事件钩子挂在 `krConfirmReportEta`/`markReportUploaded`/`simulateReportTimeout`+每秒超时检查/`markNoShow(auto)`/`submitGuestForm`/占位剩5分钟/KR 确认施术时间/已到医院/无法施术/更换项目/术后管理确认/`finishCase`/被@/未接来电；删除旧的 `notifyConsultUpdate`（KR 回复面诊时间/面诊信息已更新/面诊前15分钟提醒）。toast 叠放最多 4 个、6 秒消失。\n- **localStorage 提醒**：设定和 memo 存在 localStorage（版本号 `DEMO_DATA_VERSION`），自测时如果登记过"Dewi OFF"，推播/通知收件人会改成 Rina，测试前先清掉 `gmc_memos`。
- 第二十八轮（2026-10-03 对话页面结构，docs 1k）：💬 未读数不含@（`ROOM_UNREAD`/`updateChatBadge`）、抽屉排序 `roomLastKey`、新建案件对话候选无房间、案件房标题 ↗、引用 chip 显示当前大状态（`refBarHtml`，`updateCaseStage` 会刷新打开着的窗口）、案件状态变化不发进对话房（删 `sendMainAnnouncement`/KR 回复消息/结构化卡片，视频结束只发系统消息）、@ 自己高亮；案件房种子消息改成普通沟通内容。
- 第二十九轮（2026-10-05 收尾，TODO 盘点答复 + 清理，docs 1l）：**一** 删除 `cancelFollowUpReservations`（案件结束不再自动取消同客人其他预约）；**二** 不面诊案件付款后也可［增加面诊］（`addedConsultAfterLocal`/`consultCarryStage`/`localMgmtTagOn`，主状态→面诊预约→…→项目确认中，本地项目照常使用）；**三** 持有批次退款记在购买案件（`holdingRefunds`/`hasRefundMark`，两边 Timeline，仅办理退款=取消原因 `refundVisit`）；**四** 到医院后更换项目的新结算单状态"计入尾款"；**五** 基础资料［补充上传］（`supplementUpload`）；**六** 清理死代码（in-newclient、旧免除面诊费弹窗、二次面诊/视频书面遗留字段）；**七** 文档清理（open-questions 1c–1f 标已写入 Notion、已被取代的内容标已作废、第2节 #3 #16 #17 #21 已解决，本文件"已知差距"重写）。
- 第三十轮（2026-10-05 结构拆分·一，账号与设定指令的第一部分；二→八等用户检查后再做）：把单文件原型拆成 `prototype/shared/`（`rules.js` 规则层、`ui.js` 界面层、`data.js` 数据层、`store.js` 存档与多标签页同步、`boot-in.js` IN 端启动、`app.css`）+ 入口页 `login.html`（暂为按角色进入的占位登录页）/`in.html`（IN 端全部页面）/`owner.html`、`kr.html`（占位）/`booking.html`（客户自助预约表单，参数 `?date=&time=&phone=&purpose=&ph=`）；旧的 `gmc-network-prototype.html` 已删除（git 历史里还在）。功能和拆分前完全一致（函数清单 638 个一个没少，只多了 `refreshView`/`resetDemoData`，并删掉一个重复定义的 `toggleAttachMenu`）。数据存 localStorage（`gmc_state`，带版本号 `DEMO_DATA_VERSION`=4），刷新不再重置；多标签页实时同步；超容量提示"演示数据过大，已重置"；真实上传图片只在内存。新增 `start.command` 一键启动，`dev/check.sh` 取代 `/tmp/check.sh`。
- 第三十一轮（2026-10-05 账号与设定·二 账号数据与演示账号）：`ACCOUNTS`（OWN 老板/A1 Dewi 管理者/A2 Rina 一般/A3 待激活加购/A4 已停用加购/A5 Putri 加购管理者）、`ACCOUNT_LOG`、`currentAccountId()`（sessionStorage）、`accountLabel`/`actorDisplay`/`staffLabel`/`seatSummary`/`logOp`；Timeline 和案件列表 IN 室长列显示"Rina（A2）"，新记录带 `actorId`。用词：**OWN = 老板（诊所管理账号）**，院长 = 韩国医院医生；激活上传**证件照**（字段 `photo`），不收集身份证。
- 第三十二轮（2026-10-06 账号与设定·三 登录与激活，`docs/accounts-settings.md`）：`login.html` 登录/首次激活（手机验证码显示在屏幕上 → 设密码+姓名+职位+证件照）/忘记密码；sessionStorage 登录、`guardPage()` 守卫（in.html 只许管理者/一般室长，owner.html 只许老板）；头像菜单（个人设置只读资料卡/切换账号/退出登录）；删除案例库/项目库的"演示用角色"下拉；`ME_NAME` 跟登录账号走，种子外的写死 Dewi 全部改成 `actingName()`/`ME_NAME`；对话消息带 `sender`；`IN_COORDINATORS` 由账号算出；数据版本 6。演示密码 = 编号小写 + 123（own123/a1123/a2123/a4123/a5123）。四～八待做。
- 第三十三轮（2026-10-06，账号与设定四～八 + 演示时钟；客户自助预约页还没开始，等 `CLIENTS` 改对象后做，顺序 C → A4 → A5 → A6 → A7 → A8 → K → B1–B5）：**C** `demoNow()` 取电脑当前时间（只加演示按钮往后拨的 `DEMO_SHIFT_MS`），`TODAY_DATE` 取真实今天，全部演示数据日期改成相对今天 `D(n)`/`KD(n)`，演示数据不再每天重置（日期是相对今天写的）：只有版本号改变或手动「重置演示数据」才重置，版本号改变时保留账号资料（`ACCOUNTS` 等）和诊所设定，只重置业务演示资料，账号/设定结构变了（`ACCOUNT_STRUCT_VERSION`）才一起重置；**A4** 权限 `ROLE_PERMS`/`canDo()`/`ADMIN_PAGES`，管理页壳 `#in-admin` + `ADMIN_RENDER`，老板端 owner.html 只有管理类；**A5** 个人设定 + 诊所设定（`CLINIC_SETTINGS` 取代写死的营业时间/午休/15·30 分钟/面诊费/CLINIC_TZ），新增 `shared/i18n.js`、`shared/admin.js`；**A6** 账号管理（重设/加购/退订，管理者加购管理者需老板验证码）；**A7** 经营数据基础版；**A8** 操作日志（按类型/子类型/日期筛选）。详见 `docs/accounts-settings.md` 四～八。
- 第三十三轮后续（2026-10-06）：**取消每日重置**（见上）；**K** 客户档案 `CLIENTS` 改对象（手机号唯一、同意记录、客户 Timeline，客户详情基础信息读真实档案，修改存回客户）、案件联系方式改读客户、周视图休诊日读诊所设定；**B1–B5 客户自助预约页** `booking.html` + `shared/booking.js`（入口 `?ph=`/无参数/`?walkin=1`/`?view=`，印尼文/中文，八步，客人端查看/取消/重新预约，取消后 30 分钟内重约合并通知，短信发送记录页 + 提醒短信，IN 端临时表单已删除改开 booking.html），详见 `docs/accounts-settings.md` 第九、十部分。
- 工作台与时间选择修正（2026-10-06）：**一** 选预约时间统一规则 `slotBlockReason`（过去不能选/额满显示"已满"/休诊），适用于预约修改、工作台代约、占位、booking.html；**二** 周视图午休改窄横条、表头与固定栏层级修正、"休诊"完整显示；**三** 同一时段多个预约上下排列（每个一行，>3 个显示"+N 更多"）。详见 `docs/accounts-settings.md` 第十三部分。
- 预约页修订（2026-10-06）：步骤调整（新客人 8 步 + 完成，老客人跳过个人资料和病史/过敏史）、**医美史结构化**（`beautyRecords`：年月+项目+来源，预约页新增"医美史"步骤，老客人新增标"本次新增"，IN 端客户详情/基础资料显示并可补登，延续既往面诊读"本次新增"）、手机版面（主按钮固定底部、390px 检查）；详见 `docs/accounts-settings.md` 第十四部分。
- **KR 端系列 1/5：多诊所 × 多医院（2026-10-06，一→六各一次提交）**：医院 H1/H2、诊所 C1/C2、对接多对多；存档拆成全局 `gmc_state` + 每家诊所分区 `gmc_clinic_*`（IN 页面只读自己诊所，名字不变）；跨诊所读写接口 `Store.readClinic/updateClinic`；账号/日志/案件/客户/项目/案例加 clinicId，医院资料 `HOSPITAL_DATA`（院长、KR 室长、按院长的开放日期、赴韩项目、案例）；IN 端选面诊先选医院、复诊延续锁定医院、案件列表加医院栏、项目库/案例库/KR 日程按医院区分、Main 群按诊所×医院分开；C2 账号 B1/B2。详见 `docs/multi-hospital.md`。
- **KR 端系列 2/5：KR 端骨架（2026-10-06，一→六各一次提交，详见 `docs/kr-side.md`）**：**一** KR 账号（`hospitalId`，KO1 代表院长/KM1 管理者/KC1 室长/KD1 院长（H1）、KM2/KC2（H2），密码 = 编号小写 + 123）+ 登录分流（代表院长→owner.html，其余→kr.html）+ `ROLE_PERMS` KR 角色；**二** `Store.withClinic`、`krAllCases()`（只取选了本医院且已缴/免除面诊费的案件，院长只看自己的）、`maskPhone`；**三** KR 大盘（今日 OFF、日程确认横幅、六张卡、到院时间线、院长版三块）；**四** 案件列表（tab/筛选/紧急程度排序）；**五** 案件详情骨架（七个只读 tab）；**六** KR 通知（`HOSPITAL_DATA[h].notifs`，IN 缴/免面诊费 → `pushKrNotif`）+ 对话抽屉（经 `Store.updateClinic` 写进诊所分区）。新增 `prototype/shared/kr.js`；`kr.html` 从占位变成 KR 端（大盘/案件列表/案件详情/通知中心/管理类共用壳）；`owner.html` 加载 kr.js（代表院长的管理页）。数据版本 18，账号结构版本 4。KR 的操作（确认报告时间/提交报告/施术）还没做，IN 的"模拟 KR"按钮保留。
- **KR 演示账号**：KO1 박소현 代表院长（`ko1123`）、KM1 이서연 管理者（`km1123`）、KC1 박준혁 室长（`kc1123`）、KD1 김민석 원장 院长（`kd1123`）——H1；KM2 정하늘 管理者（`km2123`）、KC2 최민준 室长（`kc2123`）——H2。登录页说明里也写了。**正式版每家诊所一定有老板账号（OWN）**，C2 演示没有只是为了演示。
- **KR 自测清单补充**：① 四个 KR 账号各登录一次（KO1 只有管理类；KD1 只有院长版大盘；KC1 没有管理类；KM1 全有），console 无报错；② K1：一个标签页 IN（A1）缴面诊费，另一个标签页 KM1 大盘"待确认报告时间"+1、铃铛+1、弹 toast，不刷新；③ KM1 案件列表只有 H1 案件（含 C2 的 Yoga），没有 H2 案件/未缴费案件；联系方式一律 `+62 000-****-****`；④ KD1 只看到自己的案件；⑤ KR 对话发消息后 IN 端未读 +1；⑥ `bash dev/check.sh`（已含 kr.js）。
- **KR 端系列 3/5：面诊联动（2026-10-06，前置 + 一→六各一次提交，详见 `docs/kr-side.md` 末尾）**：前置：院长账号有案件列表（只自己的、只读）、Main 群含院长（静音）、`kr.html?case=诊所:案件号`；**一** `Store.mutateClinic`（KR 操作写进来源诊所分区）+ `coreSetReportEta`；**二** 语音/手动录入 + AI 草稿（演示模板）+ KR 专用附件仓库（`HOSPITAL_DATA[h].vault`，IN 不显示）；**三** `coreSubmitReport`（可选范围含术后管理项目、韩文原文 + IN 演示翻译可切原文）；**四** `coreJudgeContinuation`/`coreAddScopeItem`；**五** 院长/代表院长权限；**六** 删除 IN 端面诊相关"模拟 KR"按钮（保留「模拟时间超过预计」和全部施术相关模拟）。数据版本 18 不变。Happy Path A 现在用 KR 端操作跑通面诊段，施术段仍用 IN 的模拟按钮。
- **KR 端系列 4/5：施术预约与在韩项目进程（2026-10-06，修正 + 一→九各一次提交，详见 `docs/kr-side.md` 系列 4/5）**：修正：提交报告可 0 个可选项目（确认弹窗）；**一** 可选范围加项目资料（推荐在韩时间/麻醉/所需术后管理，「韩国术后管理」特殊分类）；**二** IN 项目选择显示资料 + 术后管理韩国/印尼分配 + 新定金公式（施术 + 必须在韩国的术后管理）× 比例 + 麻醉同意书（v0.1 占位）；**三** KR 端施术预约（确认/无法安排/同天调整/改期确认，自动加院长日程"施术"块）；**四** 在韩 timeline 与子项（`c.subItems`，A000001-01…，IN 子 tab 只读）；**五** KR 端到院/判断/调整/尾款（确认行程锁分配，印尼部分 `c.innCare` 由 IN 收款后转持有）；**六** 子项完成 → 在韩子项全部完成才结案、通知 IN 预约（新案件自动关联）、回诊加做另开结算；**七** 大盘卡片改 timeline 待整理 / 今日在韩子项；**八** 删除 IN 端所有施术相关"模拟 KR"按钮和函数；**九** 演示数据迁移 + 文档。数据版本 20。核心函数命名：`core*`（data.js，不碰界面）+ KR 页面 `krMut()` 包装。
- **KR 端系列 5/5：日程、院长、项目库、案例库（2026-10-07，前置修正 + 一→五各一次提交，六为文档；详见 `docs/kr-side.md` 系列 5/5 和"KR 端完成状态"K1～K36 表）**：前置修正：标「施术」子项完成必须勾选做了哪些项目（`coreSubDone`/`coreItemsDone`/`krCloseIfDone`）、更换项目时 KR 填新项目的术后管理/麻醉/在韩时间、回诊加做睡眠/全身麻醉要勾现场签署；**一** KR 日程管理（日/周/月、日程块带结束时间、允许重叠并排、OFF、开放日期、［确认今日院长日程］）；**二** IN 端 KR 医院日程只显示无文字灰块 + 本诊所客人的施术块、第二行显示韩国时间；**三** KR 院长管理（介绍卡资料，IN 选院长显示介绍卡，擅长的排前面）；**四** KR 项目库（项目默认资料自动带入报告/更换/补加/加做；施术块时长）；**五** KR 案例库（kr.html 复用 IN 案例库函数和弹窗，`krShowBind()`）。KR 端页面全部齐全。新增页面挂在 `ADMIN_PAGES`（`krschedule`/`krdoctors`/`krsrvc`/`krshow`），用 `ADMIN_RENDER` 渲染；`CURRENT_CLINIC_ID` 在 KR 案例库页面里被设成 `'__KR'`。数据版本 24。
- **KR 工作台加日历 + 日程管理合并（2026-10-07，一→四各一次提交，详见 `docs/kr-side.md` 末尾）**：原则——韩国医院自己的本地客人不进平台，KR 工作台/日历只显示平台案件；日程块只有施术（自动）/不可预约/OFF 三种（手术/面诊/会议/占位/其他废弃）；KR 室长/管理者工作台下半部是日历（`KRC`：月/周/日、周视图今天在第一栏、按院长筛选、hover 空白格加不可预约/标 OFF、月视图设开放日期、点事件开案件），待处理卡片新增「等待报告」；独立的日程管理页删除，［确认今日院长日程］在工作台；院长工作台第一块改「今天的平台客人」并有自己的日历；IN 的今日 OFF/周月视图读 KR 的 OFF。数据版本 25。
- **客户预约页 · 医美史修正 + 名姓分开 + 我的预约（2026-10-07，详见 `docs/accounts-settings.md` 十五、十六）**：医美史项目改纯文字输入、时间改年/月两个下拉；客人姓名分「名（必填）+ 姓（选填）」（预约页/到店自填/客户详情，旧资料迁移，`name` 仍是"名 姓"显示名，另存 `firstName`/`lastName`）；预约提交后直接进「我的预约」（30 分钟内免验证，超过要重新手机验证；目前的预约/持有项目/过去的记录三块，过去的记录只列有到店的案件、报告只写"已出报告"）。
- **一诊所一医院 + 术后管理套餐化 + 资金归属（2026-10-07，一→五各一次提交，以 Notion 为准；详见 `docs/multi-hospital.md` 末段、`docs/kr-side.md` 末段）**：**一** 一家诊所只对接一家医院（C1/C2→H1，新诊所 **C3 巴厘→H2**，管理者账号 **D1 Dian / `d1123`**），IN 端基础资料/增加面诊不再选医院（只选院长），去掉项目库/案例库/KR 日程的医院切换和案件列表的医院栏筛选，IN 项目库不显示「韩国术后管理」；`ensureSeedAccounts()` 版本重置时补种子账号；**二** 定金 = 施术项目 × 30%，术后管理含在套餐里不计价（所需术后管理去掉价格，IN 分配只为排程），付尾款时分给印尼的部分直接发放 0 元持有批次（「套餐内含」，术后第 N 天，`finalizeInnCare`），删 `confirmInnCare` 收款流程；**三** 定金（诊所收）/ 尾款（医院收）标注，韩国加做单独标注算 KR 收入，退款弹窗新增备注（分担方式），IN 经营数据收入口径更新，KR 经营数据 `krBizData`；**四** 原 C1 的 H2 案件（Budi/Dinda/Wulan/Lina，案件号不变）迁到 C3（`stashC3Seeds`），种子结算单按新公式重算，数据版本 26（账号保留）。
- 教训：补丁用 `region(start,end)` 替换时结束标记必须紧邻；**第四部分的补丁曾误删一整段弹窗 HTML**，已恢复；现在 `/tmp/check.sh` 除了函数清单还检查 DOM id 是否缺失。

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


---

## 结构拆分（2026-10-05，追加；以下取代文档里"单文件原型"的说法，旧文字保留作历史）

**文件结构**（原来写 `prototype/gmc-network-prototype.html` 的地方，现在对应下面这些文件；按函数名/变量名搜索即可，在 `prototype/shared/` 下全局搜）：
```
prototype/login.html      登录页（2026-10-05·三已做：登录/首次激活/忘记密码；演示账号和重置演示数据在页脚）
prototype/in.html         印尼室长端：全部页面（工作台/客户/案件/案例库/项目库/通知/对话/视频…）的 HTML
prototype/owner.html      老板端（诊所管理账号 OWN；占位）        prototype/kr.html  韩国室长端（占位）
prototype/booking.html    客户自助预约表单（复用 ui.js 的 renderGuestForm / data.js 的 submitGuestForm）
prototype/shared/rules.js 规则层：状态推导、结局、资格判断、日期格式化等不碰界面的函数
prototype/shared/ui.js    界面层：页面切换、渲染、弹窗、toast、对话浮窗、日历；界面状态变量；refreshView()
prototype/shared/data.js  数据层：所有演示数据数组 + 读写函数 + 种子数据；开头是演示数据版本号检查
prototype/shared/store.js 存档（PERSIST_VARS 列出的全局变量 ⇄ localStorage 的 gmc_state）+ 多标签页同步 + resetDemoData()
prototype/shared/boot-in.js  IN 端专用启动脚本（初始化渲染、定时器、全局监听）
prototype/shared/app.css  共用样式
```
- 都是 classic script（全局函数/变量，不是 ES module），加载顺序固定：`rules.js → ui.js → data.js → store.js →（in.html 再加）boot-in.js`。新加全局变量如果要跨刷新保存，必须加进 `store.js` 的 `PERSIST_VARS`；只放界面状态的变量（当前页、筛选条件、弹窗上下文）不要加。
- **分层并不绝对纯**：少数 `data.js`/`rules.js` 里的函数在数据变化后会调用刷新函数（如 `pushNotif` → `updateBell`），暂不再拆；`booking.html` 等没有对应元素的页面里这些调用会静默跳过。
- **分类是按函数体自动判断的**（碰 `document.`/`alert`/`innerHTML` 等或名字以 render/build/open/close/show/toggle 开头 → ui；名字像 derive/is/can/caseStatus… → rules；其余 → data）。新函数放哪个文件，参照这条。
- 页面不能再双击 html 打开（共享脚本用绝对路径 `/shared/…`），必须用本地服务器：**双击 `start.command`**（第一次自动 `npm install`，再启动 `npm run dev` 并打开浏览器到 http://localhost:3000/login.html）。第一次要先装 Node.js（https://nodejs.org，LTS）。README 里也写了。
- `npm run build` 把五个入口页打包到 `dist/`，`shared/` 原样复制到 `dist/shared/`（`vite.config.js` 里的 `gmc-copy-shared` 插件）；`server/index.js` 的根路径跳转到 `/login.html`。
- 存档规则：每次点击/输入/选择后 60ms 内、以及每 2 秒，如果数据有变化就存档；其他标签页收到 `storage` 事件后重读数据并 `refreshView()`；页面离开时再存一次。容量超限（约 5MB，`QuotaExceeded`）时：console.warn + 画面顶部红色提示"演示数据过大，已重置"，清掉存档，这个页面之后不再存档（刷新页面恢复演示数据）。真实上传的图片（data: 地址）只放内存，存档里是 `@img:编号`，刷新后不再显示。
- **自测补充**：提交前改跑 `bash dev/check.sh`（函数清单对比 `prototype/shared/*.js` 与 HEAD、语法、DOM id 缺失；`add-slot-purpose`、`bell-dd` 是动态生成的 id，属正常）；多标签页同步用两个标签页验证（一个改数据，另一个不刷新就能看到）；改完后冷启动检查用 `in.html`。
- 演示账号/密码（已做，见 `docs/accounts-settings.md`）：密码 = 账号编号小写 + `123`，例如 A1 → `a1123`；A3 待激活（手机 +62 811-0000-0004，验证码显示在屏幕上）；A4 已停用。登录入口 `/login.html`；每个标签页各自登录（sessionStorage），可同时登不同账号测多人。**自测时先登录再测**（in.html 没登录会跳回登录页）。


---

## 账号与设定补充（2026-10-06，追加；以下取代前文关于 owner.html"占位"和文件列表的说法，旧文字保留作历史）

**文件结构新增**：`prototype/shared/i18n.js`（共用多语言：韩/印尼/中，IN 端用；预约页印尼/中词典之后加在同一文件）、`prototype/shared/admin.js`（管理类页面：个人设定、诊所设定、账号管理、经营数据、操作日志，用 `ADMIN_RENDER[key]` 登记）。`owner.html` 现在是老板端壳（侧边栏 = 经营数据/账号管理/诊所设定/操作日志，个人设定在头像菜单）；`in.html` 里管理者在侧边栏"诊所管理"组看到同样四项。脚本加载顺序：`rules.js → i18n.js → ui.js → data.js → store.js → admin.js →（in.html 再加 boot-in.js）`。`dev/check.sh` 的文件清单已含 i18n/admin。
**权限**：老板 = 只有管理类；管理者 = 全部；一般室长 = 工作类 + 个人设定；没权限的入口不显示，直接输入网址会被 `guardPage()`/`openAdminPage()` 导回自己的首页。
**演示时钟**：现在是真实时间；打开原型时数据都落在"今天附近"；不再每天重置；版本号改变时只重置业务演示资料，保留账号和诊所设定（`data.js` 开头的 `KEEP_ON_VERSION_RESET`），手动「重置演示数据」才全部清空。
**演示账号/密码**：OWN 老板 `own123`；A1 管理者 Dewi `a1123`；A2 一般室长 Rina `a2123`；A3 待激活（手机 +62 811-0000-0004）；A4 已停用；A5 管理者 Putri `a5123`。新购买/重设后的账号手机号为空，激活时接手人自己填手机号（验证码显示在屏幕上）。
**自测清单补充**：① 三种角色各登录一次：一般室长看不到"诊所管理"组，直接输入 `in.html?page=admin-accounts` 会回首页；老板登录后只有四个管理页，没有铃铛/对话；② 诊所设定改值保存 → 日历行/午休斜纹/占位倒计时/面诊费卡立即变化、"系统"通知和操作日志各一条；③ 两个标签页（老板重设 A2、A2 在另一个标签页）验证"原使用人立即登出"；④ 设置里切换韩文/印尼文，侧边栏和设定页变译文；⑤ 冷启动检查 + console 无报错 + `bash dev/check.sh`。

**第三十三轮补充（2026-10-06）**：booking.html 加载 `rules → i18n → ui → data → store → booking.js`（不加载 admin.js / boot-in.js）；地址参数 `?ph=` `?walkin=1` `?view=` `?lang=id|zh`。自测补充：① 用两个标签页（in.html 登录 A1 + booking.html）验证提交/取消后 IN 端日历、预约历史、通知、铃铛不刷新就同步；② 把诊所设定的预约上限改成 1，再约同一时段，应该显示「已满」；③ 取消预约后马上点［重新预约］重约，IN 端通知里只应有一条「客人改约」；④ 短信发送记录页能看到验证码/确认/取消/提醒短信。

## 多诊所 × 多医院补充（2026-10-06，追加；以下取代前文关于存档和 PERSIST_VARS 的说法，旧文字保留作历史）
- **存档**：`store.js` 不再有 `PERSIST_VARS`；改为 `data.js` 末尾的 `GLOBAL_VAR_NAMES`（全局，存 `gmc_state`）+ `CLINIC_VAR_NAMES`（每家诊所一个分区，存 `gmc_clinic_C1/C2…`）。**新加全局变量要跨刷新保存时**：属于某家诊所的（客户、案件、对话…）加进 `CLINIC_VAR_NAMES`，并在 `emptyClinicVars()` 里给新诊所一个初值；全诊所共用的加进 `GLOBAL_VAR_NAMES`。详见 `docs/multi-hospital.md` 第 2 节。
- **演示账号（新增）**：C2 = `B1` Citra 管理者（`b1123`）、`B2` Bagas 一般室长（`b2123`），只对接医院 H1，看不到 C1 的任何资料；C1 的账号不变（OWN/A1/A2/A3/A4/A5）。登录页说明里也写了。
- **自测清单补充**：① 用 A1（C1）和 B1（C2）各登录一个标签页：B1 只看到 C2 的 3 位客户和 3 个案件，没有 Siti 等 C1 的客户；A1 选面诊时可选 H1、H2，选 H2 后只列 H2 的院长；B1 选面诊时只有 H1（自动选定）；② 复诊/延续既往面诊关联到 H2 的原案件后，医院和院长都锁定；③ 案件列表的「医院」栏和筛选、项目库切换医院、案例库切换医院、KR 医院日程先选医院再选院长；④ 对话抽屉：C1 有两个 Main 群（C1×H1、C1×H2，成员各自正确），B1 只有一个；⑤ `booking.html?clinic=C2` 提交预约后，只有 B1 的标签页即时多出这条预约和通知，A1 的标签页没有；⑥ 跨诊所写入：`Store.updateClinic('C1', fn)` 后 A1 的标签页即时同步；⑦ 冷启动检查 + console 无报错 + `bash dev/check.sh`；⑧ 版本号变了只重置业务资料，账号和各诊所设定保留。
- **预约页链接必须带诊所**（正式版）：`booking.html?clinic=Cx`；原型不带默认 C1。


## 一诊所一医院补充（2026-10-07，追加；以下取代前文"诊所×医院多对多""C1 对接 H1、H2"的说法，旧文字保留作历史）
- **关系**：一家诊所只对接一家医院，一家医院可对接多家诊所：`CLINIC_HOSPITALS` = C1→H1、C2→H1、C3→H2；`clinicHospital(cid)`。KR 端不变（H1 账号看 C1+C2，H2 账号只看 C3，来源诊所栏照样显示）。
- **演示账号（新增）**：C3 巴厘 = `D1` Dian 管理者（`d1123`）；案件 Budi/Dinda/Wulan/Lina 现在属于 C3（H2）。登录页说明已写。
- **定金与术后管理**：赴韩项目金额 = 施术项目价格，定金 = 施术项目 × 30%，尾款 = 70%；术后管理含在套餐里不计价；付尾款后分给印尼的部分直接成为客人的 0 元持有批次（套餐内含）。
- **资金归属**：定金诊所收、尾款医院收；IN 收入 = 面诊费 + 赴韩定金 + 本地项目 + 印尼加做；KR 收入 = 尾款 + 韩国加做；医院原因造成的定金退款仍由 IN 手动退，备注里记分担方式。
- **自测清单补充**：① D1 / KM2 / KM1 各登录一次：D1 只看到 4 个 C3 案件，KM2 只看到 C3 案件，KM1 只看到 C1+C2 案件；② IN 端案件列表没有「医院」栏和筛选，基础资料选"面诊"只有院长下拉（来自对接医院）；③ IN 项目库赴韩 tab 没有「韩国术后管理」分类；④ 新定金公式：KR 报告项目带术后管理，IN 选项目后定金 = 施术价格 × 30%、结算单不显示术后管理金额；⑤ 付清尾款后客户详情持有项目里出现 0 元「套餐内含」批次；⑥ 退款弹窗有备注框；⑦ 旧版本存档升级到 26 后账号不丢、D1 自动出现；⑧ `bash dev/check.sh` + console 无报错。


## 登录页演示账号区 + 跨分页联动 + 启动方式补充（2026-10-07，追加；旧文字保留作历史）
- **登录页**：演示账号区改成三个 tab（印尼诊所 / 韩国医院 / 客人），每个账号一个按钮，点一下直接登录（`quickLogin`，不输入密码；原账号+密码登录框保留，正式版不会有这些按钮）；C1、H1 默认展开，C2、C3、H2 收起；A3 按钮直接进首次激活的验证码步骤，A4 按钮提示已停用；客人 tab 放预约页按钮、老客人（Siti `000-0000-0001`、Ayu `000-0000-0002`）和新客人说明；［重置演示数据］在 tab 区下方。
- **跨分页联动**（`store.js`，原有 `storage` 事件机制 + 2026-10-07 补强）：别的分页写入后，本页立即重读数据；画面重画遇到「弹窗打开 / 正在输入（聊天输入框除外）」就延后，弹窗关闭 / 失焦 / 切回本分页时立即补刷新（后台分页的定时器会被浏览器降速，所以不只靠定时器）；重画前后保留滚动位置；当前所在页面、案件、tab 不变。覆盖：IN（in.html）、老板端和代表院长端（owner.html）、KR（kr.html，大盘/案件列表/案件详情/通知/管理类页面）、客户预约页「我的预约」。
- **必须用本地服务器打开，不能双击 html**：共享脚本用 `/shared/…` 绝对路径，`file://` 下加载不到，各页面之间也不共用数据。**一键启动：双击项目根目录的 `start.command`**（Mac；自动 `npm install` + `npm run dev` + 打开 http://localhost:3000/login.html）；或终端一行：`npm run dev` 后打开 http://localhost:3000/login.html。**所有分页必须用同一个地址**（`localhost` 和 `127.0.0.1` 的浏览器存档是分开的，会表现为"另一个分页没反应"）。各页面现在遇到 `file://` 会在顶部显示红色提示。

## 演示账号链接 + 启动提示补充（2026-10-07，CMD-1007-02，追加）
- 登录页的演示账号是真正的链接 `<a href>`：已激活账号 → `/in.html?demo=A1`、`/kr.html?demo=KM1`、`/owner.html?demo=KO1`（路径由 `homeUrl()` 决定）；A3/A4 → `/login.html?demo=A3`。普通点击 = 当前分页登录；**Cmd / Ctrl + 点击、中键、右键「在新标签页中打开」= 新分页直接以该账号登录，原登录页不动**（可同时开 IN / KR / 代表院长多个分页测联动）。
- 目标页读到 `?demo=` 后在本分页写 sessionStorage 登录并用 `history.replaceState` 清掉地址栏参数（`data.js` 里的 `applyDemoParam`，**必须在算 `PAGE_CLINIC_ID` 之前执行**，否则诊所归属算不出来、该分页的改动不会存档）；只接受演示数据里存在且已激活的账号，待激活/停用账号不能这样登录（A3 去首次激活、A4 显示停用提示）；各页面 head 里原来"没登录就跳登录页"的内联脚本对带 `demo` 参数的网址放行。正式的账号 + 密码登录框不变。
- 根目录 `http://localhost:3000/` 自动 302 跳 `login.html`（`server/index.js` 原有）。
- `start.command`：启动后在终端窗口印出服务器地址和「测试期间请勿关闭此窗口，关闭后新页面会打不开」；服务器已在运行（重复双击）时不报错，只印提示并打开已运行服务器的登录页。

## IN 工作台 KR 医院日程 + 休诊日 + 时区补充（2026-10-07，CMD-1007-03，追加；旧文字保留作历史）
- 休诊日：IN 周视图休诊日窄列（1/3 宽）；KR 医院休诊日 `closedDates`，KR 室长/管理者在 KR 日历登记/取消。
- IN 的 KR 医院日程视角：全部 / 各院长，月/周/日；灰块只写院长名字，本诊所客人施术块写客人名 + 院长；在韩子项不进院长日程（KR-SCHD-01 已废弃）。
- 时区：IANA 时区 + 浏览器 Intl；诊所时区由地址/城市自动判定（只读）；画面只显示 UTC+n；系统事件时间点存 UTC（`nowFullDt()`），显示走 `fmtUtc()`；预约/施术当地钟点仍存当地时间；`demoNow()` = 页面时区墙上时钟，`realNow()` = 真实时刻，`todayStr()` = 页面时区今天。新写时间点代码：存用 `nowFullDt()`，显示用 `fmtUtc()`，不要再用 `nowFullDt().split(' ')[0]` 取日期（用 `todayStr()`）。
- 演示数据版本 27：KR 医院日程前后各一个月（`seedKrMonthDemo`），施术块来自 C1/C2/C3 真实案件（`seedSurgeryCase`）。
- 自测补充：① A1 / B1 各看一次 KR 医院日程（全部、单一院长、月/周/日），C1 看 C2 客人 = 灰块 + 院长名；② KM1 登记医院休诊日 → A1 周视图该天即时变窄列；③ D1（巴厘 UTC+8）和 A1（UTC+7）的 Timeline 时间差 1 小时、第二行韩国时间对；④ 画面上搜不到 WIB/WITA/WIT；⑤ `bash dev/check.sh` + console 无报错。

## CMD-1007-04 补充（2026-10-08，追加；旧文字保留作历史）
- **同一施术在本院日程和 KR 医院日程差 2 小时**：原因是本院日程直接把 KR 的到院时间（韩国当地时间）当成诊所时间，现统一经 `krToClinic()` / `ksTimeText()` 换算（IN 页面显示诊所时间 + 括号韩国时间，KR 页面显示韩国时间）。**以后凡是 IN 端显示施术 / 到院时间，一律走 `ksTimeText` 或 `krToClinic`，不要直接显示 `ks.confirmedTime`。**
- IN 的 KR 医院日程视角周/日视图：一个事一整块（`krDayColHtml`），整天 OFF 只在固定栏。
- **定期休诊**：`closedRules`（诊所设定 / 医院设定，每周固定，整天或从某时刻起）取代 `closedDow`（派生）和逐日的 `closedDates`；`isRescheduleDateDisabled` 只管整天休诊，部分时段由 `slotBlockReason` / `hospitalClosedFrom` 判断。
- **OFF 每周重复**：`weekly` + `dow`，一律用 `offApplies(o, ds)` 判断。
- **匿名化**：员工显示名 = 账号编号 + 角色（A1 室长、KD1 院长、KO1 代表院长…），客人 = 客人N；**新写演示数据不要再用真实感人名**。旧人名（Dewi、Rina、Siti、Nadia、김민석、이수진…）只存在于上面的历史文字里，对应关系：Dewi=A1、Rina=A2、Putri=A5、Sari=A4、Citra=B1、Bagas=B2、Dian=D1、Hartono=OWN；김민석=KD1、박소현=KO1、이서연=KM1、박준혁=KC1、정하늘=KM2、최민준=KC2；이수진 已删除。演示数据版本 28，账号结构版本 5（账号会重置）。
- 自测补充：① A2 周视图：本院日程与 KR 医院日程的同一施术时间一致（客人9 = 09:00）；周日窄列；KR 视角周六 16:00 后灰；整天 OFF 只在固定栏；② 客户预约页 / 代约周日不可选；③ 画面和存档里搜不到旧人名；④ `bash dev/check.sh` + console 无报错。

## CMD-1008-01 / 02 补充（2026-10-08，追加；旧文字保留作历史）
- IN 的 KR 医院日程：「全部」时间格只画施术，固定栏写所有"不在"（整天 OFF、半休时间段、室长 OFF）；单一院长才画不可预约（浅灰无字）；块写法「谁 · 做什么 · 医生」/「其他诊所 · 医生」；时间轴表头「印尼 / 韩国」；灰色统一 `#F3F1EC`。
- **同一位院长同一时间只能有一件事**（施术 vs 不可预约、施术 vs 施术都不能重叠，不同院长可以）；新写排施术 / 不可预约的代码一律走 `krSurgerySlotError` / `krBusySlotError`。演示数据版本 29。
- 旧数据自动更新：版本号不符时下次打开页面自动重置业务演示资料（账号保留），旧分页会被 storage 事件自动刷新；用户看到旧人名 = 浏览器页面还没刷新过。

## CMD-1008-03 / 04 补充（2026-10-08，追加；旧文字保留作历史）
- **IN 不能看到其他诊所任何信息**：KR 医院日程里其他诊所的施术 = 浅灰无字块（单一院长才显示），不能出现"其他诊所"字样；新加任何 IN 端的 KR 日程相关显示都要先想"会不会带出别的诊所"。
- 本诊所施术块可点进案件；额满只标"已满"、背景白色；**KR 午休**（`hospitalLunch`）施术不能开始于午休、可跨过。
- **memo 可修改 / 删除**（`openMemoModal(editId)` / `deleteMemoDraft`，只能改自己写的）；**不再有"每周固定"OFF**（演示数据的每周 OFF 展开成单次条目）。`krHospital()` 是医院基本信息，医院的休诊规则 / 午休等资料在 `krHData()`（`HOSPITAL_DATA`）。
- 演示数据版本 31。

## CMD-1008-05 补充（2026-10-08，追加；旧文字保留作历史）
- **KR 医院日程只有月 / 周**（没有日视图）；KR 周视图时间轴 = KR 医院营业时间（韩国时间）换算成页面时区（`krRows()` / `krToPageTime()`），本院日程时间轴 = 诊所营业时间（`WK_HOURS`）。
- **演示营业时间**（数据版本 32）：IN 诊所 10:00–21:00、午休 14:00–15:00、周日休诊、可预约 10:00–20:30；KR 医院 11:00–21:30、午休 13:00–14:00、周六 16:00 起休诊、周日休诊（`HOSPITAL_DATA[h].openTime/closeTime`，`hospitalHours(hid)`，KR 管理者在医院设定里编辑）。版本重置时诊所设定里的营业时间被 `DEMO_CLINIC_HOURS` 强制改写。
- **半天 OFF** 用 `krHalfRange(hid, part)`（上午 = 营业开始→午休开始，下午 = 午休结束→营业结束），不再有写死的 `KR_HALF`。
- **新写演示数据**：预约来访放进 IN 营业时间且避开午休，施术 / 不可预约放进 KR 营业时间、避开午休 / 周六 16:00 后；排完跑 `dev/audit-hours.js`（console 执行，要求"营业时间外 = 0"）。
- 未改：KR 端自己的日历 `KRC_H0/KRC_H1` 仍是 08:00–20:00（医院营业到 21:30，晚于 20:00 的块会被截断），待确认。

## CMD-1008-06 补充（2026-10-08，追加；旧文字保留作历史）
- IN 侧边栏顺序：案件管理在客户管理上面；案件列表没有行内按钮（已到店 / 预约取消 / 未到店 / 预约修改只在案件页状态栏里做）。
- 财务栏：无收入「–」；仅面诊费 / 有项目收入下方写金额。**面诊费金额读案件缴费记录 `consultFeePaidAmount`（`consultFeeOf(c)`），不读诊所设定**；新写缴面诊费的代码要记下这个字段。
- **"操作过" = 从接待开始实际处理过案件**（`caseOperators` / `caseOperatedLogs`，代约不算）；列表、仅看我的、推播共用。新写 Timeline 记录时，代约 / 预约修改 / 预约取消类动作的文字里要带这些关键词（见 `caseOperatedLogs`），否则会被算成"处理过"。
- **接待中不停留**：`receptionOpen(c)` = 待访问点了已到店且基础资料未保存；页面内离开弹确认（`intakeLeaveOk`，挂在 `nav` / `goBack` / `openCaseDetail` / `openAdminPage`）；关分页 `beforeunload` + 心跳过期（45 秒）扫描退回（`sweepStaleReceptions`）。**演示数据不能有停在接待中且基础资料未保存的案件**（会被扫描退回待访问）。
- 测试时用浏览器的 `window.confirm = ...` 覆盖确认框。

## CMD-1008-07 补充（2026-10-08，追加；旧文字保留作历史）
- 不面诊的本地案件（`isLocalCase(c) && !c.reportReady`）选购只显示本地项目，没有赴韩项目子 tab；面诊案件的项目列表 tab 不变。
- **使用 / 选购数量的输入框一律用 `qtyInputHtml({id, value, min, max, onchange})`**（窄版带 ±，自动夹在 min～max；样式 `.qty-box`），不要再手写 `<input type="number">`；`.case-field-row input{flex-grow:1}` 会让裸输入框撑满整行。
- （同日修正）"操作过"只算「已到店后基础资料有保存」的接待；面诊费改为**选面诊时**记进案件（`consultFeeAmount` / `recordConsultFee`，面诊费卡和财务栏读 `consultFeeOf(c)`，取代缴费时记 `consultFeePaidAmount`）；不面诊案件选购没有任何 chip。经营数据页面诊费汇总仍读当前设定（待决定）。

## CMD-1008-09 补充（2026-10-08，追加；旧文字保留作历史）
- **两条选购路径**：本地选购 = `localPurchaseHtml(c, scope, isAddition)`（scope `main` = 不面诊案件的选择项目，购物车 `c.recommended`；`lm` = 本地管理的新增项目，购物车 `c.localMgmt.cart`）；赴韩方案 = `projectPickerHtml`（项目列表 tab）。「已选择」一行统一用 `localRowHtml`；折扣留空 = 不打折（`discountPct` 100）。**新增选购相关函数优先改 `localRowHtml` / `grantLocalItems` / `cartTotals`，不要再手写行**。
- **购物车条目**：`{kind:'project'|'package'|'service', key, projectId(=key), price(原价), unitPrice(成交单价：活动价 / 套餐价 / 原价；服务 0), qty, discountPct, itemNote, promoId, pkgItems}`；总价一律走 `inLineTotal(it)`（读 `unitPrice`）。
- **活动价 / 套餐**：`PROMOS` / `PACKAGES`（诊所分区变量，`CLINIC_VAR_NAMES` / `emptyClinicVars`），权限 `promo`（只有 manager）；过期自动恢复原价靠 `promoStatusOf` / `localUnitPrice` 现算，不用定时器。
- **持有批次标记**：`pkg`（KR 套餐内含 0 元）/ `pkgPaid`（购买的套餐拆出）/ `service`（赠送）/ `promo`（活动价）；`pkg` / `pkgPaid` / `service` 一律不可退款。批次发放统一走 `grantLocalItems`。
- 演示数据版本 33（4 条活动价含 1 个已结束、2 个套餐、客人12 持有套餐批次、客人11 持有서비스批次）。
- （CMD-1008-10）折扣显示一律走 `discountText(pct)`（80 → 8折、85 → 8.5折，100/空不显示）；输入仍是实付比例。新写显示折扣的地方不要自己拼「X折」。

## CMD-1008-12 补充（2026-10-08，追加；旧文字保留作历史）
- **视频来电信号** `gmc_call`（localStorage，不进 `gmc_state`）：`startCall` 写、KR 页面 `krCallHandle` 响铃，状态 ringing → accepted / declined → ended；IN 的 `inHandleCallSignal` 接收。
- **面诊两个时间**：`c.consultAt = {date,time}`（韩国当地）+ `c.reportEta`（UTC）；面诊块 `kind:'面诊'` 在 `HOSPITAL_DATA[h].directorSchedule`，和施术同级参与「同一位院长同一时间只能有一件事」；新排院长日程的代码继续走 `krSurgerySlotError` / `krBusySlotError`。
- **KR 术后管理候选**：`krScopeCandidates` 的 `post` = 来源诊所全部本地项目（KR 只看名称），`postCat` = 术后管理分类，`krPost` = KR 项目库术后管理。
- **子项类型只有三种**（施术 / 术后管理记录 / 增加项目），施术一行由 `syncSurgerySub` 自动产生（在 `coreScheduleConfirm` / `coreChangeConfirm` / `coreRebook` / `coreMarkUnable` / `coreSwapItem` 里同步）；`coreAddOnItem` 按 `c.krBalancePaid` 分两种结算（尾款前一次结算、付清后另开）。
- 测试时不要在 console 里 `var t = ...`（会覆盖全局 `t()` 翻译函数导致 KR 页面刷新报错）。
- 数据版本 34。


## CMD-1008-13 补充（2026-10-12，追加；旧文字保留作历史）
- IN 案件列表「当前状态」拆成**阶段**（彩色标签，同顶部 tab）+ **进程**（文字），拿掉「状态」栏（正常 / 非正常标签只留在案件页状态栏）和「查看 →」，整行可点（`.case-row-click` hover 浅粉）。推导函数 `caseStageInfo` / `caseProcessText` / `caseStageBadge` / `caseStageProcText`（`rules.js`），**不改主状态**（`caseStatusLabel` / `stage` / `consultStatus` / `scheduleState` 照旧，KR 端仍用 `caseStatusBadge`）。
- 其他 IN 显示（案件页状态栏、客户详情案件 / 案件记录、关联案件、引用 chip、对话抽屉、@ 案件选单、接续提示）统一写「阶段 · 进程」。
- 面诊进程：待缴费 → 待 KR 确认时间 → 等面诊（`consultAt` 之前）→ 面诊中（到了 `consultAt`，`consultAtPassed`）→ 等待报告（院长按［上传内容］，`krRecUpload` 写 `c.consultContentAt`）→ 项目确认中。没有 `consultAt` 的旧数据直接显示等待报告。
- 新写 IN 端显示案件状态：用 `caseStageBadge` / `caseStageProcText`，不要再直接用 `caseStatusBadge`。

## CMD-1008-14 补充（2026-10-12，追加；旧文字保留作历史）
- **通知 / Timeline 里的时间用标记**（`rules.js`）：`tkU(UTC 时间点)` / `tkK(韩国日期, 韩国钟点)` 生成 `⟦u:…⟧` / `⟦k:…|…⟧`，显示时 `tzRender()` 按看的人的时区换算（`logLine`、IN 通知下拉 / 通知中心 / 详情 / toast、KR 通知行、KR Timeline）。**新写含时间的通知 / Timeline 文字不要直接拼 `fmtUtc(...)` 或韩国钟点**。
- 操作人：`caseOperators` 按日志的 `actor` + `actorId` 认 IN 室长，账号换使用人后旧使用人的操作保留（返回 `innIds`）；推播只发给现在的室长。
- 预约页：手机号验证成功且是老客人 → 先出「是本人吗？」（`BK.mismatch`），是本人才跳过个人资料。
- 缴面诊费 / 免除面诊费自动建案件对话房（`ensureCaseRoom`，不通知；有 KR 一侧时 `c.krInRoom = true`）；对话房里的「演示：模拟 KR…」按钮和 `simulateKrEnterRoom` / `simulateKrLeaveRoom` 已删除。
- 超时通知只发一条：`simulateReportTimeout` 与 `boot-in.js` 自动检查共用 `c.overdueNotified`。

## CMD-1012-01 补充（2026-10-12，追加；旧文字保留作历史）
- **toast**：`showToast(title, text, onClick, {sticky:true})` = 通知类，必须点［确认］才消失（`.toast-ok`），不挤掉、可滚动；不带 `sticky` 的是操作反馈（6 秒消失，最多 4 个）。IN 用 `toastNewNotifs()`（`NOTIF_SEEN` 登记已处理的通知，`refreshView` 末尾调用），KR 用 `krToastNew()`；**新写通知不要再用 `silent:true`**（只有验证码类例外）。
- **来电**：`startCall` 起 30 秒响铃计时（`CALL_RING_MS`，`callRingTimeout`）；信号状态 ringing → accepted / declined / ended / **missed**；`recordMissedCall(sig)` 往医院通知里记「未接来电」（按信号 id 去重）；KR 页面 `krCallRingFallback` 兜底。
- **KR 通知**可以指名：`pushKrNotif(..., {only:'KM1 室长'})`（`krNotifsForMe` 按 `only` 过滤）；IN 在案件房 / Main 群 @ KR 人员时 `notifyAtMentions` 写 `kind:'mention'` 通知；院长的房间未读只算 @ 他的消息。成员「已进入」按账号编号比较（`krAcctId`）。
- **催办**：`urgeInfo(c)` / `urgeKr()`；缴费 / 免除时记 `c.consultPaidAt`；待 KR 确认超过 `URGE_CONFIRM_MIN`（30 分钟，规则未定）或等待报告超时才出现按钮。
- **谁在处理 + 分页锁**（`ui.js` 末尾）：`gmc_case_presence`（心跳，每案件每分页一条）+ `gmc_case_lock`（每「案件|账号」一条持有者）；`TAB_ID` 每个分页一个；同账号第二个分页 `PRES_BLOCKED` 弹遮罩，［在这里继续］ = `presContinueHere()` 抢持有权，原分页 `presReadonly()` → 内容区 `inert` + `.case-ro`。列表客人名后用 `presTag(clinicId, caseId)`。
- **终态案件页**没有编辑入口（`projectListTabHtml` 开头 `isEnded(c)` 早返回）。IN 项目库赴韩列表不列「韩国术后管理」。IN 经营数据面诊费 = 各案件 `consultFeeOf(c)` 加总。
- **边界**：`autoNoShowSweep()`（boot-in，5 秒一扫，按 `noShowMs()`）；折扣 1～99、数量 1～`LOCAL_QTY_MAX`（99）；`isWithin2WeeksOfToday` 用 `todayStr()` 的纯日期差；`krTimeOptions(sel, kind)`；KR 加 OFF 检查与施术 / 面诊重叠。
- **交接注意事项（正式开发后端要处理）**：存档是整个诊所分区「最后写入者覆盖」，没有版本号 / 合并——两个分页几乎同时写同一诊所的数据，或一个分页卡住期间另一个分页写入，较晚保存的一方会覆盖对方（实测过）；原型不修。离线登录不补弹未读系统通知（按规则不做）。
- （CMD-1012-01 后续）演示数据里**待访问**的预约在生成种子时（`seedFixVisits`）按「现在」往后排：已过时或离「未到店判定」不到 10 分钟的，改排到今天后面 / 之后的可预约时段（每个间隔 1 小时、跳过午休 / 休诊 / 非营业时间）；版本号 35。重置演示数据时自动产生，避免一打开就被自动判定未到店；种子里本来就是「未到店」的案件（客人 Bayu 那条）不受影响。

## CMD-1012-03 补充（2026-10-12，追加；旧文字保留作历史）
- 客户预约页（`booking.html` 无参数入口）先到**首页** `bkHomeHtml()`：［预约］［查看我的预约］（`BK.mode='home'`）；带 `?ph=` / `?walkin=1` / `?view=` / `?date&time` 的入口不变，直接进原流程。
- ［查看我的预约］：手机号（默认 +62）→ 验证码（`bkLkSend` / `bkLkVerify`，`BK.mode='lookup'`）→ 直接进"我的预约"（`bkMeStart`）；号码没登记 → `lookupNone`："没有预约记录" + ［去预约］。
- "我的预约"加 列表 / 日历 切换（`BK.me.view`，`bkMeCalHtml` 月历：来院蓝条、在韩橙条、已完成灰绿条）；新增"在韩术后管理预约"（`bkKrCareEvents`，读客人案件的 `subItems`）和当前预约卡的"实付金额"（`bkCasePaidText`）。
- **CMD-1012-02 的"我的预约 list / 日历"部分可直接复用 `bkMeCalHtml`**；IN 端待预约流程那部分 02 还没做。

## CMD-1012-02 补充（2026-10-12，追加；旧文字保留作历史）
- **院长卡片**：IN 选院长只有卡片（头像 `directorAvatarHtml`，默认剪影 `defaultAvatarUri`；院长账号「上传头像」同步到介绍卡）；今天整天 OFF 的院长灰显不可选 + 标「今日 OFF」（`directorTodayOff`），半天 OFF 只标不禁。［客人已到店］只在来访当天（`markArrived` 也拦）；案件列表点击新分页打开。
- **KR**：大盘改名「工作台」；确认面诊时间卡片只列「谁 当天的日程 / HH:mm～HH:mm 不可预约」，去掉右侧说明；KR 案件状态显示「阶段 · 进程」（`stageText`，筛选仍用旧 `label`）；「KR 专用附件」是 Timeline 旁独立 tab。时间标地点：`tzRender` / `ksTimeText` 加「（印尼）/（韩国）」。
- **「报告」→「诊疗方案」**只改**文档名词**（发送诊疗方案、查看诊疗方案、面诊诊疗方案、诊疗方案已到、沿用原诊疗方案…）；**状态 / 进程名保留**（等待报告、待确认报告时间、预计出报告时间、仅出报告——Notion 仍是这些写法）。
- **术后管理设定**（`pcDays` / `pcDayText` / `pcLabel`，rules.js）：管理项目 `mgmt`（不写地点）/ 次数 / 多次 `interval` 天 / 地点 `place` / 具体项目 `name`（`innName` 为来源诊所本地项目）/ `startDay` 第 N 天起，之后日子自动生成；项目库默认资料里存 `{mgmt, kr, times, interval, place, start}`，报告里 `krPcToItem` 转成项目快照。**推荐项目整理** `recSummaryHtml`（KR 可选范围下、IN 选项目最上方 `projectRecSummaryHtml`、赴韩施术 tab + ［打印］）。
- **诊疗方案单独页面** `in-report`（`openReportModal` → `renderReportPage`，`reportDocHtml` 模板），［生成 PDF 并存入附件］= 浏览器打印窗口（另存为 PDF）+ 在案件附件里记一条（演示）。待付款结算单 `reselectProjects()`（撤销未付款批次回到选择）；**KR 账号 `krAllItems` 读不到待付款批次的赴韩项目**（`isKrAccount()` 判断）。
- **到院与在韩**：`KR_JUDGE_TEXT` 三项（可以手术，原方案不变 / 可以手术，但需要调整方案 / 不建议手术），除第一项外 memo 必填（`j.memo`）；`coreUnarrive` 撤回已到医院（评估之前）；评估为可以手术后弹 `krPcbOpen` 术后管理预约（`corePcBooking`：在韩国做 → 在韩子项带 `time`；回印尼做 → `inTimes` + 子项 place IN，勾「请 IN 帮忙预约」→ `coreSubInform` → IN 通知 + 工作台待办 `renderSubBookCard`，代约沿用 `openSubBookModal`）；付清尾款前必须完成术后管理预约；付清尾款后施术日期 / 到院卡收成一行，详细记录在 KR「Timeline」tab。
- **通知分级** `notifLevel`（rules.js）：`action` 需要处理、`next` 进入下一阶段（两类 toast 手动确认），`info` 一般消息（6 秒消失）；通知创建时写 `n.level`，可用 `opts.level` 显式指定；操作人自己不收（`n.by`）；判断类通知文字带操作人 + 原因。数据版本 36。

## CMD-1012-05 补充（2026-10-12，追加；旧文字保留作历史）
- **通知不见的原因**：演示数据里 A1 每周一 OFF（`DEMO_MEMOS` 的 `m1_*`），测试当天正好是周一，A1 不是「当天上班的室长」，收不到任何 IN 通知（规则本身没错）；改成每隔 7 天、从「今天 + 3 天」起算，打开原型当天 A1 一定在上班（数据版本 37）。用 A1 + KM1 两分页实测双向都有 toast + 铃铛。
- **开始面诊**：`c.consultStartedAt`（`coreStartConsult` / `krStartConsult`；室长账号室长按、院长账号院长按，谁先按都算）→ 小状态「面诊中」；［上传内容］弹确认「上传后内容不能再修改」→ `c.consultContentAt` = 面诊结束；**面诊结束后才显示「发送诊疗方案」区块**；IN 进程 `caseProcessText`：上传后 = 等待报告、已开始 = 面诊中、其余（有 `consultAt`）= 等面诊，不再按时间自动判定。KR 面诊 tab：面诊时间 / 预计出报告时间 / 倒计时 / 当前小状态 /［开始面诊］/［修改预计时间］合成一张卡，去掉面诊费卡片和重复的负责院长。院长账号［录入面诊］在新分页打开（`?rec=voice|manual`）；KR 附件可点开查看（`krOpenAttachment`）。
- **术后管理格式**：管理项目名称下拉（`KR_PC_NAMES`：术后复诊 / 拆线 / 消肿管理 / 伤口护理）｜N 次｜隔几天下拉｜具体项目下拉｜所在地｜第 N 天起｜自动日子，网格对齐；可选范围底部「术后管理项目」整块已拿掉；KR 项目 tab 每个赴韩项目下写出安排，「KR 可选范围」读 `c.krScope.items`。IN：选施术日期今天以前置灰；项目 / 结算单 / 赴韩施术 tab 的赴韩项目行下写安排（`itemArrangeHtml`）；推荐项目整理可加 IN 室长备注（`c.recInNote`），打印一起印出。
- **调整方案流程**（`krAdjustBlock` → `krAdjBlock`）：原项目勾选 = 保留 → ［增加项目］（KR 项目库 + 所需术后管理 / 麻醉 / 在韩时间，非局麻要勾现场签署）→ 结算单预览 →［结算并标记已付款］（`krDoSettle` 一次完成：增加 `coreAddOnItem(detail)`、未勾选的 `coreMarkUnable`、`coreSettleBalance`）→ **付款后才弹术后管理预约**（`corePcBooking` 允许 `krBalancePaid && result==='changed'`，之后再 `finalizeInnCare`）；删掉「更换」下拉和［标记无法施术］。
- **代表院长 KO1 = 院长 + 老板**：`isKrDirectorLike()`（`kr_director` / `kr_owner`）；`kr_owner` 的 `krviewOwn:true`，登录进 `kr.html`（`homeUrl`），看自己负责的案件、录入面诊、自己的日程 / OFF，管理类页面照旧。

## CMD-1012-06 补充（2026-10-12，追加；旧文字保留作历史）
- **重置 / 版本升级前自动备份**（`data.js` 开头 `gmcBackupMake` / `gmcBackupKeep` / `gmcResetAll`）：任何会清掉 `gmc_` 存档的地方（`DEMO_DATA_VERSION` 变了、登录页 / `store.js` 的「重置演示数据」）先备份旧数据：① 存进 localStorage `gmc_backup_<时间>`（重置不清它，只留最近 3 份，容量不够则只剩下载那份）② 尝试自动下载 `gmc-backup-….json` ③ 登录页顶部提示一次（`gmc_backup_notice`）。**以后升数据版本不需要再手动导出**，但仍建议提醒用户。登录页「重置演示数据」先问「重置会清掉测试记录，要先导出吗？」。
- **测试覆盖页** `prototype/test-coverage.html` + `shared/coverage.js`（开发用，登录页底部［🧪 测试覆盖］进入）：**不加载 data.js**，直接读 localStorage 存档，所以不会触发版本重置；按案件 Timeline（`logEntries`）和状态字段对照情况清单（A–F，共 56 条，其中 D22b / D29 无法自动判断）；数据来源可选「当前浏览器 / 自动备份 / 导入的文件」；导出测试记录（JSON）、可读版（Markdown）、完整备份（JSON，可再导入分析并「恢复」到浏览器）。**新增情况 = 在 `coverage.js` 的 `CHECKS` 里加一行**（id、标题、判断函数、依据文字）。
- 补的记录字段：自助预约案件 `c.bookClient`（new / old）、`c.consentResigned`（老客重签同意书），供覆盖页判断 E1–E3。
- 注意：种子演示数据里本来就有的案件也会算「已覆盖」（覆盖页看不出是种子还是手测）。
- （CMD-1012-06 补）**演示案件标记**：种子建立的案件一律带 `demo:true`（`data.js` 末尾 + `store.js` 的 `demoMarked`，其他诊所种子也标）；用户新建的案件没有这个标记。测试覆盖页覆盖率**只算用户自己新建的案件**，演示案件另外显示（每条下面写「演示案件里也有 N 次」，案件列表分「我的案件 / 演示案件」，导出里带 `demo` 字段）。旧存档里没有标记的案件按 id 兜底（`r`+9 位以上数字 = 用户新建）——旧存档里种子生成的预约案件（id 也是 r+时间戳）会被误算成「我的」，重置后（带标记的新数据）才准确。
- **［无法协调］记 Timeline**：退款确认时写「室长点［无法协调］：施术日期始终无法协调，取消全部未完成赴韩项目并退款」；覆盖页据此把 D27（逐个取消）和 D29（无法协调，无本地项目）分开判断，D29 现在自动判断；D22b 维持手动。

## CMD-1012-04 补充（2026-10-12，追加；旧文字保留作历史）
- **演示汇率**：`FX_RATES.KRW_IDR = 11.8`（1 韩元 = 11.8 印尼盾，data.js，**写死的演示常量**，以后接实时汇率）。本地管理项目 IN 价格 = 韩元 × 11.8 四舍五入成整数印尼盾（例：美版超声刀二代 300 发 140 万韩元 = Rp 16.520.000）；之后各诊所可自行改价，KR 改价不同步 IN。
- **本地管理项目库清单**（data.js 的 `LOCAL_CATALOG_TEXT` → `LOCAL_CATALOG`，Notion「本地管理项目库清单（KR / IN 对齐版）」）：类别 → 项目 → 规格（一层，价格单位万韩元）；`{标签:值,值}` = 使用时选的选项（模式 / 部位 / 种类，**值是演示占位，业务方要按实际改**：LDM 模式 = 再生 / 红血丝 / 美白；除皱、Lucas、皮秒的部位列表是我编的），价格写「面议」= 手动填价（SelfoXome）。**改清单只改这段文字**。`buildLocalProjects('IN'|'KR')` 生成项目对象（`specs:[{id,label,price,times}]`、`opt`、`neg`、`catLabel`）；IN 每家诊所一份（C1 / C2 / C3 种子都用它，分类 = PCAT 里的 12 类，原「术后管理」等旧分类已去掉，`POST_CARE_CAT_ID = ''`）；KR 每家医院一份 `HOSPITAL_DATA[h].localLib`（`krLocalLib(hid)`），在 KR 项目库页面「本地管理项目」组；KR 在韩术后管理（拆线、消肿管理、术后复诊检查、伤口护理）保留在「韩国术后管理」分类，价格 0 显示「免费」。
- **购物车 / 持有**：条目带 `specId / specLabel / specTimes / neg`，成交价 = 规格价（活动价按「项目 + 规格」，`PROMOS[].specId`；套餐内含项目带 `specId`）；规格名里写「N次」→ 付款后持有 N 次 × 数量（`grantLocalItems`），其他规格一个规格 = 持有 1 次；持有仍按项目名归在一起，批次记 `spec`；面议项目没填价格不能结算（`cartTotals().missingPrice`）。使用持有项目时有选项的项目要先选好（`hold-opt-*`，记进 `usages[].opt` / `mgmtUses[].opt` / Timeline）。
- **选择画面**统一：类别 chips → 项目一行一个 → 规格下拉 → 价格（`localCatalogHtml` / `localProjRowHtml`，本地选购、赴韩方案里的本地项目共用）；KR 术后管理设定的「具体项目」下拉含本地管理项目名称；KR 在韩「增加项目」和调整方案的「增加项目」可选本地管理项目（`krLocalPickerHtml`，`coreAddOnItem` 的 `opt.local`）。项目库页面（IN / KR）按类别分组、一项目一行、点开看规格（`PROJLIB_OPEN`），编辑可增删规格（`specEdHtml`）。
- 旧种子对照：好莱坞焕肤 1次 → LHALa peel 1次；Genesis焕肤 → 艺人水光焕肤；巴西式脱毛 → 黑米醋换肤；比基尼线脱毛 → 基础祛痘管理；XERF → 索夫波 Sofwave 300发；Onda提升 60kj → ONDA 提升 脸部 60kj·1次；术后消肿护理 → LDM；案例库本地案例同理。数据版本 37（升级前自动备份旧数据）。
- （CMD-1012-04 补，2026-10-12）**「使用时选」选项按规格分组**：`opt = {label, rules:[{match, values}]}`（`optValuesFor(p, 规格名)`；match 是规格名里含的文字，`*` = 全部，没匹配 = 不用选）。真实值（用户给的价格表）：LDM 12 分钟→痘痘/紧致/提升、6 分钟→保湿/再生/舒缓、8 分钟→红血丝；除皱部位 额头/眉间/眉上/眼周/眼下/嘴角/核桃纹/鼻翼；皮肤肉毒「1部位」→下颌线/脸颊/额头（全脸不用选）；Lucas、皮秒 小部位→腋下/肘部/脚踝/膝盖、敏感部位→臀部/Y区/私密、全身不用选；基础 / 高级营养针种类。使用持有项目时按「下一个会被扣的批次」的规格给选项。客户详情持有批次行显示规格名、使用明细显示所选选项。**KR 增加面议项目必须手动填价格**（`KRLP[key].manual`），没填不能增加 / 结算。**自动备份只存浏览器（最近 3 份），不再自动下载文件**，需要文件时到测试覆盖页导出。数据版本 38。

## CMD-1012-07 补充（2026-10-12，追加；旧文字保留作历史）
- **版本章**：`prototype/shared/version.js`（`var GMC_BUILD = {h:'短hash', t:'提交时间'}`）由 `.git/hooks/post-commit` 调 `dev/stamp-version.sh` 在**每次提交后自动写入**最新提交的 hash + 时间（钩子在 `.git/hooks/`，不进版本库；新机器要自己 `cp` 或手动跑 `bash dev/stamp-version.sh`；文件已 `git update-index --assume-unchanged`，不会让 `git status` 变脏）。所有页面在 `rules.js` 前加载它。`logCaseEvent` / 新建预约案件的第一条 / 未到店记录会带 `ver`（hash）和 `vt`（提交时间）；种子不盖章。
- **测试轮次**：测试覆盖页顶部下拉「当前测试轮次」（第 1 / 第 2 轮，存 `localStorage.gmc_cfg_round`，**`gmc_cfg_` 前缀的键重置 / 版本升级都不清**）；之后用户新建的案件自动带 `c.round`（`createReservationCase`，`currentTestRound()`）；覆盖页每种情况分别显示第 1 / 第 2 轮是否测到 + 「最后一次」案件 / 时间 / 版本 / 轮次；案件列表有轮次标签，可手动改（`setCaseRound` 直接改存档分区）。没有 `round` 的旧案件按第 1 轮算。
- **导出**：JSON 每种情况带 `occurrences`（案件、诊所、轮次、首次 / 最后一次的时间和版本）、`rounds`、顶层 `currentBuild` / `currentRound` / `roundCoverage`；Markdown 每种情况下列出各次记录和轮次汇总，Timeline 行末带〔版本〕。
- 只加记录，业务逻辑没改。自动备份只存浏览器（04 补充时已改）。

## CMD-1012-08 补充（2026-10-12，追加；旧文字保留作历史）
- **通知不弹出的原因**：新通知的 toast 原来挂在「画面重画」上（`store.js` 的 `safeRefresh` → `refreshView` / `krRefreshAll` 末尾才调 `toastNewNotifs` / `krToastNew`），而画面重画遇到「有弹窗打开 / 焦点在输入框、下拉里」就**延后**（`refreshBusy`）——测试时焦点几乎总停在某个输入框 / 下拉上，所以任何通知（含 6 秒的一般消息）都弹不出来。已验证：KM1 焦点在输入框里，旧逻辑不弹，新逻辑立刻弹。修法：`store.js` 的 storage 事件处理里数据读进来后**立刻**调 `remoteNotifTick()`（ui.js：IN 调 `toastNewNotifs` + `updateBell`，KR 调 `krToastNew` + `krUpdateBadges`），不再等画面；toast 栈 z-index 提到 100000（原来 80，盖不过 z-index 200 的案件锁遮罩）。**以后通知相关改动不要把 toast 放进可被延后的刷新里**。
- 开始面诊现在会通知：KR 室长（`coreStartConsult` → `pushKrNotif`，next 级）+ IN 一般消息；院长上传内容 → KR 室长「请发送诊疗方案」（action 级）+ IN 一般消息。
- **IN 基础资料**：「意向项目」行移到「院长」行下面；没选「面诊」（且不是「沿用原诊疗方案」）时只能选本地项目（`intentKrAllowed`），选择弹窗不显示赴韩 tab，已选的韩国项目改成不面诊时提示并移除。
- **KR 面诊 tab**：大字院长卡片拿掉，改成面诊卡片第一行「负责院长：… ［院长日程］」（`krDirLine`）；按［开始面诊］之前不显示「录入面诊」「发送诊疗方案」；发送诊疗方案改左右两栏（左 = 诊疗方案内容，输入区加高到 380px；右 = 赴韩项目可选范围 + 推荐整理 + 备注 + 附件；窄屏上下排）。
- **院长端开始面诊**：［开始面诊］→ 弹窗选语音 / 手动 → 新分页打开输入页（`?rec=`）+ 原案件页自动切「基础资料」tab；输入页（`window.__krRecInTab`）不登记案件在线、不触发「同一账号两分页」锁；院长上传后 KR 室长分页即时变「面诊结束」并出现发送诊疗方案。

## CMD-1012-09 补充（2026-10-12，追加；旧文字保留作历史）
- **数据升级 / 重置只重置演示数据，保留用户测试案件**：`data.js` 顶部 `gmcExtractUserCarry()`（用户案件 = `demo:false`，或旧存档里没标记的 `r`+9 位以上数字 id）把用户案件连同它们的客人、持有批次、通知、案件对话房、短信、KR 侧的通知 / 院长日程块 / 录入仓库提取成 `gmc_cfg_carry`（`gmc_cfg_` 开头的键重置不清）；新种子生成后 `store.js` 的 `carryRestore()` 合并回去（通知换新 id、案件编号 `CASE_NO_SEQ` 接着往后排、同手机号 / 同名的客人合并进种子客人），并按 `MIGRATIONS`（`{to, fn(case, ctx)}`）从升级前版本迁到当前版本。结果写在 `gmc_cfg_migration`（迁移几个 / 未能迁移的案件和原因 / 迁移备注），登录页顶部提示、**测试覆盖页顶部列出「以下案件未能迁移」**；未能迁移的案件不会删，仍在升级前的自动备份里。
- **每次升级数据版本要做两件事**：① 在 `store.js` 的 `MIGRATIONS` 里加一条 `{to:新版本, fn}`，补新增字段的默认值 / 旧项目名替换；② 汇报里写「数据版本 X → Y、用户案件已迁移 N 个 / 有 M 个未能迁移」。种子里改了项目名时同步更新 `OLD_LOCAL_NAME_MAP`。
- **登录页「重置演示数据」两个选项**：① 只重置演示数据（保留我的测试案件）② 全部清空（先问要不要导出）；`gmcResetAll(reason, keepUser)`。测试覆盖的轮次（`gmc_cfg_round`）、版本章、轮次字段都跟案件一起保留。
- 没有保留的：用户改过的项目库价格 / 活动价 / 套餐、日历 memo、案例库上传（都当设定 / 演示数据处理，升级后回到种子）。

## CMD-1012-10 补充（2026-10-12，追加；旧文字保留作历史）
- 取消的案件 / 无有效赴韩项目 → `syncSurgeryBlock` 不再留施术块，`sweepStaleSurgeryBlocks` 在 KR 启动时清掉旧残留；`updateCaseStage` 会同步施术块。
- 赴韩施术 tab 到院前有［取消项目］（`openCancelItems()` 不传批次 = 所有已付款未开始赴韩项目）；KR 确认 / 修改面诊时间通知院长（action）。
- KR 工作台卡片红点：`HOSPITAL_DATA[h].cardSeen[账号][卡片key]` 记录已看案件，点进卡片消失。toast 改橙黄底白字。
- `ui.js` 末尾每 5 秒比对 `version.js` 的 hash，不同就提示"原型代码已更新，刷新"（旧分页跑旧代码是通知没弹的可能原因）。未升级数据版本（仍为 38）。

## CMD-1012-09 补充二（2026-10-12，追加；旧文字保留作历史）
- 升级 / 重置时，项目库（IN 项目 + KR 项目 + KR 本地管理项目）、案例库案例、活动价、套餐、日历 memo 里**用户新增或改过的**也一起保留，没动过的回到新演示数据。判断靠**指纹**：种子生成时每项盖 `_h`（内容哈希，`gmcStamp`），存档带 `st:1`；没有 `_h` = 用户新增，哈希变了 = 用户改过（`gmcChanged`）。旧存档（没有 `st`）读档时把当时内容盖章当基准，**盖章之前用户做过的修改无法识别**（只能靠 id 特征认出活动价 / 套餐 / memo 的新增）。
- 恢复（`store.js` `cfgMergeProjects` / `cfgMergeById`）：改过的种子项目按名称对上就覆盖字段，对不上或新增的 id 加 `u` 前缀（避免撞号），案件 / 活动价 / 套餐 / 案例里的 `projectId` / `key` / `projectIds` 同步改（`cfgRemap`）；分类按名称对上，没有就新建。用户删掉的种子项目升级后会回来。
- `krLocalLib` 懒生成的本地项目库也会盖章。数据版本不变（38）。

## CMD-1012-11 补充（2026-10-12，追加；旧文字保留作历史）
- IN 案件页 tab 新顺序：基础资料｜面诊资料｜**赴韩施术**｜**本地管理**｜**结算**｜（关联案件）｜附件；「项目列表」tab 删除，旧存档 / 旧链接里的 `activeCaseTab==='projects'` 在 `normalizeCaseTab` 映射到 `kr`。出现条件（`ui.js`）：`showKrTab`（面诊案件出诊疗方案后或已有赴韩项目）、`showLocalTab`（加上「本案件买过本地项目批次」）、`showSettleTab`（有任何结算单）。
- 赴韩施术 tab = `krTabContent(c)`：付款前走 `projectListTabHtml(c,false)`（赴韩方案选项目含「本地项目」分页、待付款 / 重新选择项目、`localAsk`）；付款后 = ［+ 追加项目］ + `krProcedureTabHtml`（已确定项目 + 推荐整理、施术日期、在韩进程、［取消项目］）。本地管理 tab 只用 `localPurchaseHtml(c,'main')` 本地选购画面（`projectListTabHtml(c,true)` 不再出现赴韩方案 / 结算汇总）；赴韩案件里买的本地项目显示 `localBoughtHtml`（本次购买，只读）。结算 tab = `settleTabHtml`（顶部 `settleTabTopHtml`：项目合计 / 已收 / 已退 / 待收尾款，韩元印尼盾分开；每张结算单标来源并可点回对应 tab，只读）。
- 业务规则不变；数据版本不变（38）。

## CMD-1012-12 补充（2026-10-12，追加；旧文字保留作历史）
- 赴韩施术 tab：［无法协调］只在施术时间确认前（待递交 / 待确认）；确认后（Confirmed / Changing）同一位置改为［取消项目］（`openCancelItems()`，不传批次 = 全部已付款未开始的赴韩项目），两者不并存；取消全部赴韩项目走 `afterKrItemsChanged`（有本地项目 → 保留 / 全退 → 是否做本地管理；无 → 是否增加本地项目）。本地项目全部退款弹窗每项显示当初实付（规格、折扣、原价）。［+ 追加项目］在赴韩项目列表下方（`krAddMoreHtml`）。
- 已结案进程文字（`caseProcessText`）：赴韩完成 / 本地完成 / **本地项目保留**（取消赴韩后保留本地项目且一次没用）。
- IN 基础资料：未选面诊（且不是沿用诊疗方案）时意向项目整个栏位不出现（表单、只读展示、必填检查），从面诊改成不面诊时已选的意向项目提示后清空；预算栏不变。取代 08 的「只能选本地项目」（`intentKrAllowed` 仍用于判断）。
- 测试覆盖：D28a–c 要求 Timeline 有「点［无法协调］」（确认前）；新增 D30a–c = 取消项目（确认后）有本地项目的三种结局（没有「点［无法协调］」）；D27 / D29 判断依据不变，名称标明「时间确认前」。数据版本不变（38）。

## CMD-1012-13 补充（2026-10-12，追加；旧文字保留作历史）
- 拿掉「施术前 2 周不可改期」：赴韩施术 tab 的［修改日期］到医院前都可按（`canModify` 不再看 `isWithin2WeeksOfToday`，红字提示删除，`startKrScheduleChange` 的拦截删除）；`isWithin2WeeksOfToday` 已废弃保留、不再调用。修改后照旧等 KR 确认，KR 可［无法安排］。
- 测试覆盖：D22b 标「已作废」（`coverage.js` 检查函数返回 `{void:true}`，不计入覆盖率、不算无法判断，页面 🚫 / 导出写「已作废」）；CMD-1012-12 新增的三种结局编号 D30a–c 改为 **D31a–c**（原 D30 = 添加本地管理）。数据版本不变（38）。

## CMD-1012-14 补充（2026-10-12，追加；旧文字保留作历史）
- ［取消项目］点了没反应的原因：CMD-1012-10 把 `openCancelItems(batchId)` 改成「不传批次 = 全部已付款未开始的赴韩项目」时，补丁脚本写回 `ui.js` 前又重新读了一次文件，改动被覆盖掉，实际代码仍要求传批次（A000023 的 tab 按钮不传，所以直接 return）。已补回。**教训：用补丁脚本改多个文件，写回前不要重新读已修改过的变量。**
- 演示案件的赴韩项目补上推荐在韩天数 / 麻醉 / 所需术后管理：`gmcFillKrMeta(cases)`（data.js，从医院项目库的默认资料 `p.defaults` 带入，本医院没有同名项目就借别家医院的）在 `store.js` 生成种子时调用；`seedProjectDefaults` 补了「下巴假体 / 颏成形」「自体脂肪移植（全脸）」默认资料。已取消的「提眉手术」（A000012）两家医院都没有这个项目，保持空白。数据版本 40（39 → 40，用户案件迁移 1 个 / 未能迁移 0 个）。

## CMD-1012-15 补充（2026-10-13，追加；旧文字保留作历史）
- **零·施术行勾选**：`coreSubDone` / `krSubDone`：施术行标完成时，只要还有未完成项目就必须勾选；项目已先被处理完（旧版「未完成的项目」勾选块把项目先标完成，施术行的勾选列表因此为空，只剩［确认完成］［取消］）时直接完成。这是我对「勾选框不出现」的判断（没法读用户浏览器里的案件，演示案件 A000008 等实测勾选框正常）。KR 项目进程下方的「未完成的项目」勾选块已拿掉，只用每行［标记完成］。
- **在韩加项后付**：新增只有「术后管理记录」「增加项目」两种，**本地管理项目选项已拿掉**。尾款付清后加的项目 `pendingPay:true`、`batchId:''`（状态「待付款」）、不立刻生成结算单；KR 施术 tab 最上方红色「未付款」（`krUnpaidBanner`）+［已付款］→ `coreAddOnPaid` 一次生成一张结算单（`addOn:true`，IN 结算 tab 来源「在韩加项」）。有待付款（`pendingPayItems`）时 `krCloseIfDone` / `afterKrItemsChanged` 不结案。到院当天尾款未付时加的照旧并入尾款（`preBalanceAdd`）。
- **施术备注**：`s.note`（`coreSubNote`，KR 进程里施术行［备注］写 / 改；`subItemRowHtml` 在 KR / IN 两边显示，IN 只读）。
- **IN 本地管理进行中**：每行［完成］［取消］（`markMgmtRows(scope, action, all, oneIdx)`），底部只留［全部完成］，拿掉勾选框和［标记所选…］［管理完成］［管理取消］；取消 = 次数归还持有。数据版本不变（40）。

## CMD-1013-01 补充（2026-10-13，追加；旧文字保留作历史）
- 在韩待付款项目［修正］：KR 项目进程里「增加项目」行（对应项目 `pendingPay`）行尾红色［修正］→ 弹窗（`krFixOpen`）改项目（只能选 KR 项目库的韩国项目）/ 数量（`it.qty`）/ 金额（合计，直接存在 `it.price`）/ 麻醉（睡眠 / 全麻必须勾已在现场签署）/ 删除；`coreAddOnEdit` / `coreAddOnDelete`（Timeline 记「改前 → 改后」或「删除 xx」，同步增加项目子项和麻醉同意书记录；换项目会按项目库默认资料重带推荐在韩 / 术后管理）。只有 KR 室长有按钮（`krCanFix()` 排除院长 / 代表院长），按［已付款］后项目不再 `pendingPay`，不能改。删光待付款后 `krCloseIfDone` 自动结案。IN 只读显示（数量写在项目名后）。数据版本不变（40）。

## CMD-1013-02 补充（2026-10-13，追加；旧文字保留作历史）
- **意向项目**只列赴韩手术项目（`intentSurgeryProjects`）：没有本地项目，也没有 消肿管理 / 拆线 / 术后复诊检查 / 伤口护理 等术后管理类（只在意向选择里过滤；这几项仍在 KR 项目库「韩国术后管理」分类里，因为所需术后管理要从那里选）。演示数据 / 迁移里已选的这类意向项目会被去掉。
- **非营业时间确认**：KR 面诊时间 / 施术（到院）时间可以选午休、营业前、营业后（时间下拉 06:00–23:30），确认时 `krOffHoursText` 判断后弹窗（`krOffConfirm`：［确认］就约 /［更换时间］）；`krSurgerySlotError(..., {allowOffHours:true})` 对午休 / 营业时间外只提醒，其他冲突（院长 OFF / 已有施术 / 整天休诊 / 院长不可预约）仍拦。
- **面诊录入独立小窗口**：`krRecNewTab(mode, add)` = `window.open(?…&rec=&win=1, 'krrec', 'popup=yes,width=640,height=720')`（院长和 KR 室长一样），原案件页不跳转；小窗口里 `body.kr-recwin` 只显示录入弹窗，上传 / 取消后 `window.close()`，原页靠存档同步自动更新。上传后「录入面诊」锁住，改显示［增加内容］（语音 / 手动，同样小窗口，`KR_REC.add`），每笔带时间 + 录入人，发送诊疗方案后不再显示；AI 整理把所有笔都算进去。
- 「消肿管理」→「术后管理」（`KR_PC_NAMES`、演示数据 `mgmt`；迁移 41 同步改用户案件）。发送诊疗方案左 1/3 右 2/3；推荐项目整理（`#kr-rec-sum`）随推荐在韩 / 麻醉 / 术后管理 / 整体备注填写即时重算（`krSumRefresh`）。
- IN 递交施术日期 / 改期日期后 KR 室长收到「施术日期待确认 / 改期待确认」（action 级）；KR 基础资料「检测与上传」各行和附件点开直接查看（`krUploadRow`）；IN 客户详情进行中案件里，术后管理 / 复诊预约到店的案件写「10/24 14:00 到店 · ONDA 提升 第 1 次（来自 A000038 腹部吸脂）」（`subVisitText`，读赴韩案件子项的 `booked`）。数据版本 40 → 41。

## CMD-1013-03 补充（2026-10-13，追加；旧文字保留作历史）
- **KR 施术 tab 分步式**（`krWizard(c)`，付尾款前、状态 Confirmed / Arrived 时代替原来的整页卡片；`krTabProc` 里 `ub+krWizard(c)`）：Step 1 到院前（施术日期卡 + ［修改］到院时间 / 地址 +［客人已到医院］；施术项目卡 `krStepItemsCard` 每项 麻醉｜推荐在韩｜术后管理｜状态）→ Step 2 已到医院（项目卡 + 到院与尾款 `krArrivalBlock` 选院长评估，非「原方案不变」memo 必填）→ 3-1 原方案不变（项目 / ［添加项目］可不加 / ［付清尾款］）；3-2 需要调整方案（勾选保留，没勾的可选「更换为」KR 项目库里的项目或直接取消 → ［下一步］→ 添加项目 → 结算）；3-3 不建议手术（memo → ［更换时间］重新预约 / ［取消项目］→［更换项目］（KR 项目库选新项目，`coreCannotReplace`：原项目全部「已更换」，判断改记「需要调整方案」后结算）/［退款］（`coreRefundDecision`））。
- **［上一步］**：`coreJudgeRevert`，付清尾款 / 确认更换时间 / 退款完成前都可退回重选；评估后选的保留 / 更换 / 添加项目只在界面状态里（`KR_ADJ`），**点［付清尾款］（`krDoSettle`）时才一次生成结算单**；Timeline 记「退回评估重选」。
- **金额**：换项目不另算差价，尾款 = 最终项目合计 − 已付定金（`krWzSettleCard` 预览，不含本地管理项目）；付清尾款后施术中再加的继续走「待付款 + ［修正］」。**术后管理预约弹窗只在付清尾款后出现**（`krDoJudge` 不再自动弹；`corePcBooking` 付款后原方案不变 / 调整方案都允许；`krPcbButtonHtml` 付款前不显示）。
- **共同术后管理**：发送诊疗方案右侧各项目下方一块（`krCommonBlock`，行格式同所需术后管理 + 适用项目勾选至少 2 项，数据在 `KR_SUB.detail['__common']`）；提交时给每个适用项目的 `postcare` 各带一份（`x.cid` 相同、`x.applies`）。显示 / 预约 / 转持有按 cid 只算一次（`pcUniqueEntries(c)`、`commonCareOf(items)`；`itemMetaText` / `recSummaryData` / `pcLinesHtml` 跳过 cid 条目，推荐项目整理另列「共同术后管理」段，KR 施术项目卡一行）；适用项目取消后只剩一个仍保留，全部取消一起拿掉（按活跃项目现算）。数据版本不变（41）。

## CMD-1013-04 补充（2026-10-13，追加；旧文字保留作历史）
- **退款服务**：IN 案件基础资料 tab 顶部［退款服务（可退批次 N 个）］（`refundServiceBarHtml`，接待中 / 基础资料未确认时也有；只有客人有可退批次 `refundableBatches` 才出现）→ 弹窗勾选批次（日期 / 购买案件 / 已用/购买 / 实付 / 参考值）、逐批填金额（可为 0、不超实付）、共用一个必填原因，可一次退多批（`confirmRefundService`）→ 问「这次只办退款吗？」（`openRefundOnlyAsk`）：是 → `finishCase` 结局已取消（仅办理退款）；还有别的 → 照常接待（`c.refundVisit` 保留，之后没有其他购买 / 使用结案时仍是仅办理退款）。Timeline 记三边：本案件、客人 Timeline（`stage:'退款服务'`）、购买批次的案件（`holdingRefunds`，退款仍记在购买案件财务上）。
- 客户详情持有项目卡拿掉［退款］（`openHoldingRefundByIdx` / `openHoldingRefundModal` 留在代码里但没有入口）；医美史「本院项目记录」只列已使用 / 已完成的批次和赴韩项目（`renderProjectHistory`）。
- 测试覆盖：E1 / E2 按 `c.bookClient` 分开（旧案件没有该字段的不计入，避免同一案件既算新客又算老客）；B10 只算案件最终 `stage==='cancelled'` 且取消原因「仅办理退款」；E10 同时认「退款服务：」记录。
- **不建议手术 → 取消项目 → 更换项目**：院长评估保留「不建议手术 + memo」（`j.result` 仍是 `cannot`，新增 `j.replaced=true`），Timeline 记「取消项目 → 更换为 xx」；`coreSettleBalance` / 预约弹窗 / IN 显示按 `replaced` 当作调整后的结算处理。**更换时间**（`krDoRebook`）也弹非营业时间确认。
- **IN 不再分配术后管理**：`pcLinesHtml` 只读（必须在韩国 / 韩国或印尼都可、次数、第 N 天起）；「韩国或印尼都可」（含共同）一律由 KR 在付清尾款后的预约弹窗决定，弹窗里默认「请选择」（`where:''`），没选不能确认；迁移 42 清掉还没付尾款 / 没预约案件里旧的 `inTimes`（已生成的持有批次、已预约子项不动）。共用 ONDA 回印尼做 → 持有批次只生成一次（`pcUniqueEntries`）。数据版本 41 → 42。

## CMD-1013-05 补充（2026-10-13，追加；旧文字保留作历史）
- **一键准备测试客人**（纯测试工具，不属于产品功能）：`prototype/test-coverage.html` 顶部「🧪 一键准备测试客人」按钮 → 新页面 `prototype/test-prep.html?demo=A1&make=<key>`（加载 rules / i18n / ui / data / store + `shared/testprep.js`，以 A1 身份写进 C1 诊所存档）建好客人和前置条件，并写明「请用 A1 / KM1 登录，从 xx 开始」。A 组：`queen`（老客 + 剩余持有项目）、`zoe`（同意书旧版本 v0.5）、`yuki`（已有进行中案件，项目确认中）、`sara`（3 个可退批次）、`olivia`（12 天前出过诊疗方案，客人不做项目 → 仅出报告）、`c42`（赴韩已结案 + 回印尼术后管理 0 元持有批次）；B 组：`stageA`（面诊结束待发送诊疗方案）、`stageB`（已付定金待确认施术时间）、`stageC`（施术时间已确认待到院，2 个赴韩项目，其中有术后管理「韩国或印尼都可」+ 印尼对应项目；用 CMD-1013-03 的分步结构，IN 不分配）。
- **规则**：客人名 `T-xxx`（重复自动编号 `T-Queen 2`）；案件 `prep:true` + `demo:false`（不是演示数据，升级时和用户案件一样保留）；准备阶段的 Timeline 都带 `prep:true`（`testPrepRun` 末尾把所有 `touched` 案件的记录统一标 prep，包括 `finishCase` 补写的系统记录）。
- **覆盖页**（`coverage.js`）：`parseRaw` 把「用户还没动过」的准备案件（所有记录都是 prep）整个排除并单独列出（🧪 一键准备的案件，不计入）；用户动过的准备案件只按非 prep 记录判断（`__t` / `firstDt` 跳过 prep）；案件旁标 🧪；导出的案件行带 `prep` / `prepOnly`。`vite.config.js` 的 input 加了 `test-prep`。数据版本不变（42）。

## CMD-1013-06 补充（2026-10-13，追加；旧文字保留作历史）
- **IN 术后管理使用路径**：本地管理「是否使用持有项目」（`holdingsUseHtml`）里术后管理批次照列但不可勾选，每批一行「属于 A000xxx 手术名 · 建议术后第 N 天（MM/DD）」+［做术后管理］（`openPostcareUse` → `confirmPostcareUse`）；建议日期 = 原手术施术日期 + 批次 `schedule` 的第 N 天（`pcBatchSuggest`）。当场用 1 次（`b.usages` 带 `postcare/suggested/deltaDays/reason/by`），本案件自动关联原案件（`linkedCase` 术后管理 + `visibleToKR`），记在 `c.postcareUses`，**不混进本案件的本地管理**（`caseWorkDone` 认 `postcareUses`，「本次不使用」时有术后管理使用也会结案）。提前做 → 原因必填，原案件 Timeline 记「比建议日期提前 N 天，原因 xx」+ KR 室长通知（`pushKrNotif` info，只通知不批准）；过了没做 → 客户详情持有项目卡 + 使用列表标红「已过建议日期 N 天」，IN 工作台 `#dash-pcdue-card`（`renderPcDueCard` / `postcareDueList`）提醒，补做记「延后 N 天」。每次记建议日期 / 实际日期 / 操作人 / 原因，原案件 Timeline（KR 可见）。
- **IN 本地管理**：［+ 添加本地管理］后「本次不使用 / 本次不购买」没有任何购买或使用 = 返回（`lmBackOut`：`c.localMgmt=null`，并删掉「添加本地管理」那条记录，不留记录）；`lm.ended` 后到结案前仍显示「已完成的项目」列表 + ［继续选购］［继续使用持有项目］（`lmContinue`），结案后只读（「本次购买与使用记录」）。
- **KR 施术**：到院添加项目 / 调整方案 / 不建议手术→更换项目 / 施术中增加项目共用 `krAddChooser(c, sk)`，左侧分「手术项目」（KR 赴韩项目库）/「管理项目」（KR 本地管理项目库 `krLocalPickerHtml`，韩元，收费，免费术后管理不在里面），右侧已选 + 结算；分步结算（`krDoSettle` / `coreCannotReplace(..., locals)`）一并带管理项目。项目进程：地点列只显示标签（拿掉下拉，术后管理记录新增不选地点，一律 KR）、状态列只放标签、最右侧单独一栏实心［标记完成］（`SUB_GRID_COLS` 7 列，`cells.done`），完成后消失；「增加项目」独立成一张卡（`krAddOnCard`，状态 `KR_AD`，项目进程卡下方，付清尾款后可用，加的项目标待付款 + ［修正］），术后管理记录新增留在进程卡底部。数据版本不变（42）。
- 一键准备「待到院」案件补上 `syncSurgerySub`（项目进程里有「施术」一行）。

## CMD-1013-07 补充（2026-10-13，追加；旧文字保留作历史）
- **发送诊疗方案至少勾 1 个赴韩项目**（`krSubmitReport`：没勾弹提示拦住，取消「0 个可选项目」确认）；拿掉「KR 不给项目 → 仅出报告」：`caseProcessText` / `noProjectForClient` 不再写 `KR 无可选项目`，IN 项目选择里的旧提示改成中性文字（只剩旧数据才会出现）；覆盖页 C16 已删，总数 59 → 58。
- **3-2 更换为 分手术 / 管理**：下拉分「手术项目（KR 赴韩项目库）」「管理项目（KR 本地管理项目库，收费，值 `L|项目id|规格id`，面议项目不列）」；`krSwapLocal` 解析、`coreSwapItem(..., local)` 新项目另开结算单计入尾款（和其他加项入口一致）。**更正**：CMD-1013-06 里 `krDoSettle` 的 `lcs` 变量声明位置错了，3-2（调整方案）结算会报错，本次一并修好。
- **多次术后管理每次各有建议日期**：持有批次存 `scheduleDays`（每一次各自的术后第 N 天，如 ONDA ×2 = [10, 11]；来源是 KR 预约弹窗里回印尼那几次的 `r.day`，记在 `x.inDays`，`finalizeInnCare` 写入批次）；`pcBatchSuggest(b)` 按「下一次」`b.used` 取对应天数，返回 `seq` / `of`，显示「建议术后第 11 天（MM/DD）· 第 2 次」，提前 / 延后 / 标红都按这一次判断。旧批次没有 `scheduleDays`：按原手术案件 `innCare.lines[].days` 补算，没有就从第一次的天数起每天一次（运行时推算，没有升数据版本，仍为 42）。

## CMD-1013-08 补充（2026-10-13，追加；旧文字保留作历史）
- **主线完成 + 在韩持有**：施术行已完成、没有待付款、手术项目都完成但还有没做完的（术后管理子项 / 已付未做的管理项目）→ KR 项目进程上方出现［主线完成，剩余转在韩持有］（`mainFinishInfo` / `krMainFinishBtn` / `coreMainFinish`）：未完成子项标 `hold:true`（已约时间保留、KR 日历照显示），未做的管理项目标 `heldOver`（视为完成但记 `holdDone:false`），案件结案（`finishCase`）；全部当场做完 → 照旧自动结案、不出现按钮。案件列表（KR / IN）小标签「在韩后续进行中」（`krHoldOpen`，全做完后消失）；KR 案件施术 tab 的「在韩持有」卡（`krHoldCard`）：标完成（`coreSubDone` / `coreHoldItemDone`）/ 备注 / 改时间（`coreSubTimeEdit`），记录写回原案件 Timeline。
- **术后管理预约**：付清尾款后改独立小窗口（`?pcb=1&win=1`，`krPcbOpen` → 弹出窗 → `krPcbOpenLocal`，预约后自动关闭，被拦时退回页内弹窗）；按日期分组（早→晚），一组默认选一个统一时间（`krPcbGroupTime`），同一位置可切换成每项单独选（`krPcbToggleSingle`）。
- **项目进程**：按日期早→晚排序；术后管理行拿掉［删除］，改［备注］［改时间］（改时间：`krSubTimeOpen`，非营业时间弹确认 + 该院长新日期当天日程 `krDayAgendaHtml`）；拿掉「新增术后管理记录」，位置改「项目进程 memo」（`c.krProgressMemo`，KR 写 IN 只读）；「增加项目」卡默认折叠（`KR_AD.open`），展开分手术 / 管理（收费）/ 术后管理（免费，直接进进程不变待付款，`KR_AD.care`）。
- **附件 / 通知 / Timeline**：KR 拿掉「KR 专用附件」tab，附件 tab 可上传（`krUploadFile`，文件标 `src:'KR · 账号'` + 时间，IN 可见）；不再发给 IN 的通知：子项标完成 / 施术中加项（含修正 / 删除）/ 到院加项或更换 / KR 确认术后管理项目 / 子项改时间 / 新增 / 删除；保留：确认施术时间、已到医院、判断结果 / 退款、结案、付清尾款、请 IN 帮忙预约、转回印尼持有。IN 案件页 Timeline 改成独立 tab（`caseTimelineCardHtml`，附件后面）；基础资料确认前没有 tab 的状态仍挂在下面。
- **KR 日历**：已完成的面诊 / 施术 / 术后管理加删除线 + 变淡（`x.done`）；有时间的在韩术后管理也进日历（绿色块）；「全部」视图每位院长固定一栏（不可预约块画在该院长自己的栏）；确认时间时的当天日程按时间排序、每行写类型（营业时间外 / 午休 / 不可预约（手动）/ 面诊·客人 / 施术·客人 / 术后管理·客人）。数据版本不变（42）。

## CMD-1013-09 补充（2026-10-13，追加；旧文字保留作历史）
- IN 案件页头两行：第一行「客人名（链接，点进客户详情，[返回] 回原案件）· 第 N 次来访」，第二行小字「Case ID · 对接院长」，不显示医院名；`caseVisitNo(c)` = 本诊所同一客人已到店（`subState==='arrived'`）案件按来访时间排序的序号，未到店不显示；右侧案件信息抽屉入口（点名字）拿掉。
- 推荐项目整理只含诊疗方案内的项目（过滤 `krAddOn`/`preBalanceAdd`/`swappedFrom`）；赴韩项目列表在韩加的同名项目合并一行「×N」并标「在韩增加」。
- 工作台月视图：`MONTH_OFFSET`；月视图 [今天] 位置显示「N月」，‹ › 切月，点月份弹 `openMonthPicker`（选年月 + [回到今天]）；周/日仍是 [今天]。本院日程 `memosOn` 只含 IN OFF，KR OFF 只在 `CAL_VIEW==='kr'`。
- 测试工具：一键准备新增 `mini`（T-MINI，40 天前出诊疗方案、仅出报告），覆盖页加按钮。未升级数据版本（仍为 42）。

## CMD-1013-10 补充（2026-10-13，追加；旧文字保留作历史）
- **KR 项目进程拆两块**（`krProgressBlock`）：「今日项目」（施术 + 增加项目，每行勾选框 + ［全选］，［已完成］→ `coreTodayDone` 只标勾的行完成、不自动结案 → 弹窗 `krTodayAsk`「客人今日的项目都已完成了吗？」：［是，结案］（还有没勾的先列出提醒再确认；有待付款或施术行没完成时不能结案）→ `coreFinishToday`：没勾的增加项目 / 未完成术后管理 / 已付未做的管理项目转在韩持有（`s.hold` / `heldOver`），`finishCase`；［不是，继续］关闭弹窗）；「术后管理」单独一张卡（日期 / 项目 /［备注］［改时间］/［标记完成］），**未到当天不能标完成**（`coreSubDone` 判断 `s.date > todayStr()`，按钮灰 + 提示），原型每行［模拟到当日］（`coreSubSimDay`，`s.simDay`，仅原型）；在韩持有卡同样规则。拿掉：［主线完成，剩余转在韩持有］横幅（`krMainFinishBtn` 不再调用，函数保留）、施术行标完成时的「做了哪些项目」勾选（施术行完成 = 非增加项目的未完成项目都完成）。
- **增加项目卡版面**（`krAddChooser`，到院 3-1 / 3-2 / 3-3 更换与施术中增加共用）：左侧［手术项目］［管理项目］tab；管理项目改列表（`krMgRowsHtml`，每行一个项目、规格行内下拉、可搜索，［加入］收费 /［赠送］= 서비스），拿掉类别 / 项目 / 规格三个下拉；右侧「已选」下方「서비스（赠送）」（`locals` 条目 `service:true, price:0`；`coreAddOnItem` 项目标 `service`、名称加「（서비스）」、不生成结算单 / 不待付款）；免费术后管理仍在增加项目卡最下方。数据版本不变（42）。

## CMD-1013-11 补充（2026-10-13，追加；旧文字保留作历史）
- **确认施术时间**：撞「院长不可预约」的原因 = 到院时间 + 施术时长（`surgeryMinutes(c)`：本案件未取消项目在 KR 项目库默认资料 `durMin` 合计，没资料按 60 分钟）与该院长日程重叠（`krSurgerySlotError`）；KD1 测试案件合计 3 小时，所以 10:00 / 13:00 都撞上 11:00–13:00、14:00–17:00。现在上方写「这次赴韩项目合计预计约 X 小时」（`krSurgeryHoursNote`），到院时间下拉（`krTimeOptionsFor`）会撞的时间灰掉并写原因，整天排不进提示（`krDayFullNote`），弹窗写「10:00 到院，施术约 3 小时 到 13:00，和 KD1 院长 11:00–13:00 不可预约重叠」；午休 / 营业时间外仍确认后可约。
- **结案弹窗**只问「客人今日的项目都已完成了吗？」［是，结案］［否，返回］（有待付款 / 施术行未完成仍挡住并写原因）；未勾项目结案后在持有项目卡。
- **KR 案件「项目」tab 三张卡**（`krTabItems`）：手术项目（在韩加的标「在韩增加」）/ 术后项目 / 持有项目（`krHoldCard(c,'持有项目')`，没有不显示）；拿掉「KR 可选范围」卡；施术 tab 不动。
- **KR 客人管理**（KR-CLNT-01）：`kr-clients` / `kr-clientdetail` 页面，只有室长 / 管理者（`canDo('krview')`），案件页客人名可点；`krClientRows()` 由 `krAllCases()` 聚合（只含本院可见案件）；详情有本院案件 / 在韩持有（`krCliAct` 把 `KR_CASE` 指到对应案件再调案件页函数）/ 施术记录 / 附件。数据版本不变（42）。
- **教训**：补丁脚本用「起点 index → 另一个很远的标记」做区间替换会误删中间几百行（本次一度删掉 kr.js 650 行，已从 git HEAD 恢复并重做）；区间替换的结束点必须取该函数自己的结尾。

## CMD-1013-12 补充（2026-10-13，追加；旧文字保留作历史）
- **关联只往前**：`relatedTabHtml` / `krTabRelated` 只显示本案件关联的旧案件（不再有「后续关联」）；`showRelatedTab` 只看 `c.linkedCase`，没有往前关联的案件不显示关联案件 tab（IN / KR 一样，KR 的 tab 在 `krRenderCaseDetail` 里过滤）。客户详情案件记录每行 Case ID / 日期 / 状态，有关联的加「关联 A000033 · 复诊」，拿掉「本院案件」字样。
- **医美史·本院项目记录**（`renderProjectHistory`）：按「日期 + 案件」分组（最新在上），组头日期 + Case ID，下面列这次做完的项目（持有批次的使用明细 + 赴韩已完成项目）；`source==='室长登记'` 的补登医美史单独成组，右侧「外部项目」；不再按项目名统计「N 批」。
- **KR 客人管理**：同一客人 = IN 客人档案（来源诊所 + 档案 id，`krClientRows` / `krClientKeyFor` / `krOpenClient(key)`），名字旁显示生日；详情去掉附件卡，分「术后管理」「持有项目」两张卡。
- **术后管理**（所有 care 子项，案件页 / 客人页共用 `krCareActHtml`）：到当天 +［客人已到］（`coreSubArrived`，`s.arrived`）才能［标记完成］（`coreSubDone` 同时拦），未到当天按钮灰，［模拟到当日］（`s.simDay`）仅原型。**持有项目**（`heldOver` 的已付管理项目）只列项目 + 剩余次数（`holdItemLeft` / `holdItemPlanned`），没有标完成；［安排使用］（`krHuOpen` / `coreHoldUseSchedule`）选日期时间（弹当天日程、非营业时间确认、撞院长日程挡住）→ 生成一条带 `holdUseOf` 的在韩持有子项（进 KR 日历和当天日程）→ 客人已到 → 标完成时持有项目 `holdUsed` +1，用完 `holdDone`。KR 案件页：项目 tab「持有项目」卡（`krHoldCard(c,'items')`）、施术 tab「术后管理（在韩持有）」（`krHoldCard(c,'care')`）。
- **KR 项目库时长必填**：赴韩项目（非术后管理类）保存必须填施术时长，管理项目编辑必须填时长（`p.durMin`，`surgeryMinutes` 也读 `lc:` 项目）；`krBackfillDurations()`（KR 启动时执行）给旧数据 / 演示数据没填的补上（赴韩 60 分钟、管理 30 分钟）；`surgeryMinutes` 的 60 分钟兜底仅作旧数据保护。数据版本不变（42）。

## CMD-1013-13 补充（2026-10-13，追加；旧文字保留作历史）
- **占位转预约**：`submitSelfBooking` 提交后收掉占位（按占位 id，或同手机号 + 同时段），预约历史里这行记为「已转预约」（`PLACEHOLDER_HISTORY` status，带 caseNo）；案件记 `c.fromPh`；`phConverted(ph)` 让日历 / 预约历史 / 每秒扫描都不再显示已转的占位（孤儿保护）。单页复现不出残留，判断是跨分页写入的覆盖（旧分页拿着旧占位列表写回）；原来只按 id 移除，没有任何兜底。
- **不自动结案保护**：`mainlineOngoing(c)`（赴韩项目进行中，或面诊在待缴费 / 待确认报告时间 / 等待报告 / 本地案件增加面诊后的项目确认中）为真时，本地管理做完（`markMgmtRows` main）/ 本次不使用（`notUseThisTime`）不 `finishCase`；`repairWronglyClosedCases()`（boot-in 启动执行，幂等）恢复已被误结案的这类案件（A000009 类）。其他结案逻辑不动。
- **增加面诊**：`c.addConsultMode`，面诊 tab 待缴费时用和基础资料选面诊同一套组件（`intentRowHtml` / `budgetRowHtml` / `directorRowHtml` / `consultFeeFormHtml(c,true)`），顺序 意向项目 / 预算 → 院长 → 面诊费 → 确认；确认时意向项目至少一个。
- **KR 在韩预约到店**：日历上的术后管理 / 持有使用块点开弹 `krVisitPop`（客人 / 项目 / 时间 +［客人已到店］，状态存 `s.arrived`，四处同步）；「今天到院」卡片（`KR_CARDS.today`）含今天来做术后管理 / 持有使用的客人，案件列表行上有［客人已到店］；撞院长日程提示写「使用约 30 分钟」（`opts.use`）。
- **KR 通知点击进对应 tab**：`krNotifTarget(n)`（面诊相关 → 面诊；施术日期 / 改期 / 到院 / 评估 / 待付款 / 术后管理提前 → 施术；选定项目 / 付定金 → 项目；@ / 未接来电 → 对话；系统 → 医院设定），通知中心点击和 toast 的确认共用 `krOpenNotif`。
- 一键准备结果页提示「已写入客户列表」并写明必须用同一个地址（localhost / 127.0.0.1 数据分开）。数据版本不变（42）。

## CMD-1013-14 补充（2026-10-13，追加；旧文字保留作历史）
- **IN 本地管理**：`localMainDone(c)`（本地使用都标完）后「本地管理进行中」标签消失（`localMgmtTagOn`）；增加面诊的本地案件（`localCarried`）本地管理 tab 本地项目做完后显示 `localCarriedDoneHtml`（做过的购买 / 使用 +［继续选购］［继续使用持有项目］，`carriedContinue` 建 `c.localMgmt` 进入本地管理流程），不再显示「已选择 / 结算」组件。
- **KR 子案件**（CMD-1013-14 二）：**子案件 = 案件的「施术」「术后管理记录」子项**（不新增数据、不用迁移，数据版本不变 42）；显示编号现算 `subCaseList(c)` / `subCaseNo` / `subCaseNos`（施术 = -1，之后术后管理 / 持有使用按日期排）；增加项目不是子案件（属于施术当天流程）。新页面 `kr-subcase`（`krOpenSub` / `krOpenSurgSub` / `krRenderSubcase`，`KR_SUBV`）：施术子案件状态条「赴韩施术 · 待到院」+［客人已到医院］［修改时间］，按已到后才进入施术流程（`krSurgeryFlowHtml`：评估 / 加项 / 付尾款 / 今日项目 / 结案）；术后管理 / 持有使用子案件「待到店」+［客人已到店］［修改时间］，到店后［标记完成］；不放未到 / 取消。主案件施术 tab（`krTabProc`）只显示施术日期、状态和子案件入口（`krSubEntriesCard`），没有［修改］［客人已到医院］；KR 案件列表只有主案件。日历（施术 / 术后管理块）、工作台今日块、到院 / 评估 / 待付款类通知都直接进子案件。子案件 Timeline = 主案件日志按编号过滤（`krSubTimeline`），主案件 Timeline 仍含全部。IN 赴韩施术 tab 项目进程只读，行内带子案件编号（`s.dno`），不推通知。

## CMD-1013-15 补充（2026-10-13，追加；旧文字保留作历史）
- **全链路自测脚本** `prototype/shared/selftest.js`（开发用，不属于产品；`ST` 对象）：在 `in.html`（A1 登录）里注入 `<script src="/shared/selftest.js">`，`ST.runAll([ids])` → `ST.report()`（Markdown 表）；每个情况用真实页面函数（IN 用 UI 函数 + 弹窗存根，KR 用 `core*`）走一遍再按 Timeline / 状态断言。覆盖表 58 情况（A1–A6、B6–B12、C13–C17、D18–D31、E1–E11、F1–F6）+ 角色功能 S29–S41；E5（占位超时）要跑两次（中间等 2 秒让 `boot-in.js` 的每秒扫描收掉）；S32 / S33 要在 A2 分页、S40 在 A1/B1/D1/KM1/KM2 各自分页、S41 在 A1 然后 KM1 分页跑。**重复运行会把今天的时段 / 开放日期占满**，出现 A3 / E7c / E7d / S31 失败时先 `gmcResetAll('…', false)` 再跑。
- 修的 bug：KR 医院设定改第二项报错（`hospDraft` 每次重建）、KR 账号管理补购买 / 退订 / 重设入口（`admin.js` KR 角色）、诊所设定显示赴韩定金比例（只读）、C3 巴厘诊所没有本地项目库（`backfillLocalLib()`，种子 + 启动时补）、覆盖页 A2 同分钟判断。数据版本不变（42）。

## CMD-1013-16 补充（2026-10-13，追加；旧文字保留作历史）
- **🧪 新结案规则（试行，带开关）**：基准版本 **de648c4**，本任务单独一个提交，`git revert` 该提交或把开关关掉都能完整退回。开关 `newCloseOn()`（rules.js）读 `localStorage.gmc_cfg_newclose`（`'0'` = 关，其他 = 开，默认开；`gmc_cfg_` 前缀重置 / 版本升级都不清），在**测试覆盖页顶部**切换（同一行有［模拟到隔天］：演示时钟 +24 小时，改存档里的 `DEMO_SHIFT_MS`）；切换不动已存案件状态，只影响之后的判断和显示。**关 = 完全照 de648c4**：`mainlineOngoing` → `mainlineOngoingOld`（CMD-1013-13 临时保护）、没有［结束案件］、本地不限当天、自动结束点不查款项。
- 开的时候：① 优先级（`mainlineOngoingNew`）施术 > 面诊 > 本地：有面诊（含项目确认中）或赴韩项目未完成的案件，本地做完不结案；赴韩项目都取消 / 更换完了、客人不做项目（`endNote`）、手动结束（`manualEnd`）才算主线有结果；纯本地做完就结案。`repairWronglyClosedCases` 固定用旧判断（避免开关一开把已结案的老案件重开）。② **钱没清不结束**：`closeBlockers(c)`（面诊费待缴、待付款结算单、在韩待付款加项）；本地流程的各个结束点统一走 `autoFinish(c, reason)`（`notUseThisTime` / `markMgmtRows` main / `noPurchaseThisTime` / `noProjectForClient` / `localAskAnswer` 否 / `confirmLocalRefundAll` / `refundOnlyAnswer`），钱没清 → 不结束 + 系统记录「案件暂不结束：还有未处理的款项…」+ toast；KR 阶段的结束函数不动。③ **［结束案件］**（`canEndCase` / `openEndCase` / `confirmEndCase`，ui.js；弹窗 `#end-case-overlay`）：只在接待中且付定金之前（`krDepositPaid` 为假）显示在案件状态条，IN 一般室长 / 管理者，老板和 KR 看不到；弹窗逐项选（面诊费待缴 → 收款 / 取消面诊；待付款结算单 → 收款（只限本地）/ 取消该项目；本案件买的未用完本地批次 → 转持有 / 退款（填金额）；使用中的项目自动标取消归还持有）+ 结束原因必填（客人不做了 / 失联 / 其他 + 补充），选完才能确定；确定后写 `c.manualEnd` + `c.endNote`，Timeline「手动结束案件（付定金前，当时：面诊等报告 / 项目确认中 / 面诊待缴费 / 纯本地 / 接待中）：原因」，结局由 `computeOutcome` 判断（面诊费已缴 / 免除、报告未出 → 仅出报告，KR 之后仍能发诊疗方案放进已结束案件）。④ **本地只能当天加**：`localAddAllowed(c)`（面诊 / 赴韩案件，当天 = 本地管理第一次添加那天 `c.localMgmtDay` 或到店当天 `c.arrivedDay`，旧案件回退 `visitDate`）控制［+ 添加本地管理］、本地管理 tab 的［继续选购］［继续使用持有项目］（`lmContinue` / `carriedContinue` 也拦）；纯本地案件不限。
- 测试：覆盖页新增 G1～G4（手动结束）；`selftest.js` 新增 G1–G4、N1（优先级）、N2（当天限制）、N3（按钮权限 / 时机），开 / 关各跑一遍。**自测时只开一个原型分页**：同一账号的旧分页会在后台把旧状态写回存档，造成 S31 之类随机失败（本次踩过）。数据版本不变（42），没有改资料结构（只新增 `manualEnd` / `arrivedDay` / `localMgmtDay` 三个可空字段）。

## CMD-1013-17 补充（2026-10-14，追加；旧文字保留作历史）
- **🧪 新待办 / 通知（试行，只加不改 + 开关）**：基准 **ed2a41d**，本任务单独一个提交；开关 `newTodoOn()`（rules.js）读 `localStorage.gmc_cfg_newtodo`（`'0'` = 关，默认开；`gmc_cfg_` 前缀重置 / 升级不清），在**测试覆盖页顶部**（和「新结案规则」并排）切换，切换后原型分页刷新生效。关 = 完全是 ed2a41d：所有新入口先检查开关（`todo.js` 的定时器 / 渲染 / `renderCaseBody` 包装、`renderCalendar` 末尾钩子、`pushNotif` / `toastNewNotifs` / `krToastNew` 的分支、`urgeInfo` 分支、KR 工作台分支、`krcGridHtml` 现在线、`krTodayAsk` 一行）。
- 新文件 `prototype/shared/todo.js`（in.html / kr.html / owner.html 里在 admin.js / kr.js 之后加载；`dev/check.sh` 已纳入）：**待办栏**（IN：`todoMountIn` 把日历卡片外面包一层 `#cal-todo-wrap` 再挂 `#todo-pane`；KR：`todoKrCalWrap`）——分已超时 / 今天 / 之后，［全部 / 只看我的］，可收起成「待办 N」；条目由案件状态现算（`inTodoItems` / `krTodoItems`），做完自动消失，每 5 秒 + 日历重画时刷新；点一行跳到对应案件 / tab（KR 在韩的到院 / 到店进子案件）。IN 待办：诊疗方案已到、等待报告超时 / 待确认施术时间超时（可催办）、KR 无法安排、KR 已确认施术时间（转告客人：打开该案件的赴韩施术 tab 即视为已转告，记 `c.relayTold`）、请帮忙预约印尼术后管理、待收款（`closeBlockers`）、当天本地未标完成（营业结束前 1 小时出现）、项目确认中超过 3 天没动静、术后管理过了建议日期、预约占位快过期、被 @ / 未接来电（读掉才消失）。KR 待办：确认预计出报告时间、发送诊疗方案（面诊内容上传后；超时标红）、被催办（置顶）、确认施术时间 / 改期待确认、今天到院 / 到店、在韩加项待付款、安排术后管理、今日院长日程未确认、被 @ / 未接来电。
- **日历**：IN 启动默认日视图（`todoInBoot`），KR `KRC.mode` 默认 `day`（全部院长）；日 / 周视图「现在时间线」：IN 周视图（本院 / KR 医院日程都标，按时间轴行定位 `todoPlaceInLine`）、IN 日视图（列表里的「现在」分隔线）、KR 日 / 周视图今天那一列（`todoNowLineHtml`）；每 30 秒重算位置（IN 周视图打开时自动滚到约 1/3 处；KR 日历没有自己的滚动条，不需要滚）；现在不在时间轴（午休 / 营业外）时不画。**卡片**：KR 8 → 4（待我处理 / 今天到院、到店 / 等待报告 / 新消息；`KR_CARDS` 里新增 `n:true` 的两张，旧 8 张定义不动）；IN 新增同样 4 张（`#in-cards`，今日 OFF 下方；待我处理 / 今天来访 / 等 KR 回复 / 新消息）；红点持续到点卡片。
- **弹出提示**（`notifTodoKind`）：被 @ / 未接来电 = 弹出并停留；新待办（诊疗方案已到、无法安排、确认施术时间、请帮忙预约、待收款、催办、已缴面诊费、需要处理…）= 弹一次、6 秒自动收起；其余消息不弹（仍进铃铛 / 通知中心）；操作反馈照旧。**催办**（`urgeInfo`）：等报告超过预计出报告时间；待确认施术时间超过 1 个工作日（`todoWorkdaysSince`，休诊日不算；递交时间读 Timeline「递交施术日期」）；取代 30 分钟（`URGE_CONFIRM_MIN` 开着时不再用）。**KR 结案弹窗**加一行「未完成的 N 项会转入在韩持有」（`todayHeldLineHtml`，N=0 不显示）。
- 测试：`selftest.js` 新增 TD1–TD4（IN 待办生命周期 / 弹出分类 / 现在线 + 四张卡 / 催办门槛）、TDK1–TDK2（在 KM1 分页里跑：KR 待办与案件状态一致、四张卡、弹出分类）；E8 按开关分支；`ST.freeDirector`（KD1 当天整天 OFF 时换下一位院长，之前整套测试在 KD1 OFF 的日子会失败）。数据版本不变（42），没有改资料结构（只新增可空字段 `relayTold`）。

## CMD-1014-01 补充（2026-10-14，追加；旧文字保留作历史）
- **🧪 日历对齐 + 新待办 10/14（只加不改 + 开关）**：基准 **f3c7ab4**，本任务单独一个提交；开关 `newCalOn()`（rules.js）读 `localStorage.gmc_cfg_newcal`（`'0'` = 关，默认开），测试覆盖页顶部第三行切换（切换后分页刷新）。关 = f3c7ab4；第 7 点（KR 不能安排使用）和两个 bug 不带开关。新文件 `prototype/shared/calalign.js`（in / kr / owner.html 在 todo.js 后加载，`dev/check.sh` 已纳入）。
- **三边日历对齐**（以 IN 室长为准）：IN 日视图改整天时间格（`buildDayGridNew`，`#day-grid`，同周视图的一列，现在时间线画在格子里）；时间范围 = 营业时间前后各 2 小时（IN：`calHours()` 只用于日历行，`WK_HOURS` 不变；KR / 院长：`krcApplyRange()` 改 `KRC_H0/H1`）；范围里营业时间外的行仍是「不可预约」（IN `slotBlockReason`='outside'，白底不可点；KR 确认时间弹窗里营业时间外照旧弹确认）。KR / 院长：固定栏（`krcFixedHtml`：「OFF · 谁（上午）修改」+ memo，修改弹窗 `#krfx-overlay` 可改整天 / 上午 / 下午或删除，不再点标签就删；KR 室长可改所有人的 OFF，院长只能写 / 改自己的 OFF 和 memo；memo 存 `HOSPITAL_DATA[h].memos`，作者本人可改，公开 / 私人）、［＋ memo］、月视图（月份按钮 + 选年月 + 回到今天，`krcMonthPicker`）、当前时段颜色框（`.krc-nowframe`）、图例加面诊 / 术后到店。
- **待办补充**：点卡片 = 筛选待办栏（`TODO_FILTERS` / `todoCardFilter`，标题后「· 待我处理 ✕」，4 张卡 IN / KR 都一样，不再跳案件列表 / 切日历 / 开对话）；IN「转告客人」加［已转告客人］（`calRelayDone`，记 `c.relayTold` / `relayAt` + Timeline，取代「打开 tab 即算」）；IN 新待办「确认客人日程有无变化」（`calNeedsRecheck`：赴韩施术前 2 天、时间已确认、`c.recheck.key`≠现在的日期时间；IN 日历那个施术块带 `data-recheck` 徽标；赴韩施术 tab 上方「确认日程无变动」卡 + ［确认无变动］（`calRecheckOk`，`c.recheck = {key, by, at}` + Timeline）；KR 主案件施术日期卡多一行「日程确认」✓ / IN 尚未确认日程，只显示）；院长待办「上传面诊内容」（等待报告且 `consultContentAt` 空）；KR 室长待办「等院长上传面诊（已超时）」（超过预计出报告时间且 `consultStartedAt` 空，院长开始面诊就消失）。
- **规则变更（不带开关）**：KR 在韩持有（案件页持有项目卡、客人管理）拿掉［安排使用］，改显示「要使用请由 IN 预约」；术后管理［客人已到店］→ 标完成照旧。**bug（不带开关）**：旧案件 `repairScheduleGaps()`（`boot-in.js` 启动 / `krBoot` 里执行，幂等）补上确认施术时间时没填的地址（取医院地址）和缺的 -1 施术子案件（A000023～27 类）。
- 测试：`selftest.js` 新增 CAL1（IN）、CAL2 / CAL3（KM1 / KD1 分页）；TD1 / TD3 按开关分支。数据版本不变（42），新增可空字段 `relayAt`、`recheck`、`HOSPITAL_DATA[h].memos`。

## CMD-1014-02 补充（2026-10-14，追加；旧文字保留作历史）
- 基准 **7078420**，单独一个提交；全部挂在现有开关「日历对齐 + 新待办 10/14」（`newCalOn()`，`gmc_cfg_newcal`）下，关 = f3c7ab4；唯一不带开关的是 `krHalfRange` 能解析 `指定HH:MM-HH:MM`、`offPartArg`（纯新增，旧数据不受影响）。
- **卡片 = 待办 4 类**（最重要）：每条待办带 `cat`（`TODO_CAT`），IN：todo 待我处理 / visit 今天来访 / kr 等 KR 回复 / msg 新消息；KR：todo / today2 今天到院、到店 / waiting 等待报告 / msg；每条恰好属于一类，待办总数 = 4 类加总；卡片数字 = 点下去 `todoVisible` 筛出来的条数（跟着［只看我的］），`todoCatCardsHtml` 画卡（IN 的 `#in-cards` 和 KR 工作台共用），红点 = 这一类有新条目（点卡片才灭）。新条目：IN `visit`（今天预约还没接待，一位一条「10:30 客人 · 来访目的」，到店 / 未到店后消失）、IN `waitkr`（等报告 / 等确认出报告时间 / 等确认施术时间 / 等确认改期；没超时灰色，超时红 +［催办］，`todoUrge` 借用 `urgeKr`）；KR `waitdir`（awaiting_report 且院长还没上传面诊内容，超时红）。院长只有待办栏。
- **工作台版面**：日历 : 待办 = 3 : 2（IN / KR / 院长）；IN 日视图改 KR 画法（`buildDayGridNew`：`#day-col` 按分钟 / 时长画块、车道布局、午休细条、营业时间外淡底，固定栏保留 IN 设计）；院长工作台拿掉「今天的平台客人 / 等我出报告的案件 / 室长刚提交的诊疗方案」，只留日历 + 待办；代表院长（`kr_owner`）默认看自己，可切「全部院长（只看）」（`KRC.viewAll`，只看不操作）。
- **OFF**：改「全天 / 指定时间」（part 存 `指定09:00-13:00`，旧的上午 / 下午数据照旧能读）；KR 新增 OFF 先选室长 / 院长 → 再选人（KR 室长可标自己、其他室长、院长；院长只标自己）；悬停加 OFF 同；IN memo 的 OFF 也加时间（`m.from/to`，固定栏写「OFF · 谁（13:00–15:30）」，只有指定时间才多这一段）。
- **KR / 院长日历细节**：过去事件变灰；双时间轴（韩国 + 印尼，印尼 = 对接诊所时区，C3 巴厘 UTC+8）；午休画成 14px 细条；月视图点日期 = 进那一周，**日历上不再点日期设定开放施术**——医院设定里目前**没有**开放施术日期的入口（只有院长管理加院长时的初始日期），没自己加，见汇报。
- **规则**：IN 营业时间前后 2 小时的行室长可代约（`calOffHoursOk` → 确认「营业时间外，确定预约吗？」→ 代约弹窗），客人自助预约仍只能约营业时间内（`slotBlockReason` 不变）；「确认日程无变动」过期（施术日已到 / 已过）仍未确认 → 标红一直挂着，直到确认或改期 / 取消（`calNeedsRecheck` 不再要求 d>=0）。
- 测试：`selftest.js` 新增 CAL4（IN）、CAL5 / CAL6（KM1 / KD1）、CAL7（KO1）；`ST.freeDirector` 等同上。数据版本不变（42）。

## CMD-1014-03 补充（2026-10-14，追加；旧文字保留作历史）
- 规则变更，**不带开关**；基准 5582c57，单独一个提交；数据版本不变（42），没有改旧数据结构（新增可空字段：`HOSPITAL_DATA[h].specialDays`、`c.comp`、持有批次 `b.comp`、结算单 `compCredit` / `payExtra`、退款记录 `comp:true`）。
- **KR 医院设定小日历**（新文件 `shared/hospspecial.js`，kr.html / owner.html 加载，`dev/check.sh` 已纳入）：每周固定休诊的下拉保留；下面一个月历（‹ ›），固定休息的日子灰；点某天 → 本来休息：［改为营业］［改为半天营业（几点到几点）］；本来营业：［改为休息］；改过的日子标色（特殊营业绿 / 临时休息红 / 半天黄），点了［改回原来］；`HOSPITAL_DATA[h].specialDays = [{id,date,mode:'open'|'closed'|'half',from,to,by}]`，**优先于**每周固定休诊：`hospitalClosedOn` / `hospitalClosedFrom`（半天 = `to` 起休诊）/ 新增 `hospitalClosedBefore`（半天 = `from` 前休诊）/ `hospitalSlotClosed` / `krSurgerySlotError` / `krDirUnavail` / `krDayAgendaHtml` / `krOffHoursText` / KR 日历覆盖层 / IN 的 KR 医院日程（`krDayColHtml` 加第 6 个参数 `closedBefore`）都读它。权限 `canDo('clinic')`：KR 管理者、代表院长；一般室长 / 一般院长没有；代表院长本来就有医院设定入口。
- **拿掉院长开放施术日**：`hospitalOpenOn(hid, 院长, 日期)` = 医院当天有营业 − 这位院长的整天 OFF − 盖满营业时间的不可预约；`hospitalOpenDates` 改成按它算（今天 −30 ～ +240 天）；`h.openDates` 不再被读，院长管理新建院长不再预置开放日期；KR 日历月视图点日期一律进那一周（不再设定开放）。IN 选施术日期 / KR 确认时间都照这个判断。
- **本地代偿**：IN［取消项目］［无法协调］的退款弹窗新增「退款方式：退钱 / 转本地项目（代偿）」（`REFUND_METHOD`，只在 `normal` / `cannotCoordinate` 两种模式出现；选代偿要金额 > 0）；确认后 `startCompPurchase`：`c.comp = {kwr, credit = 韩元 × FX_RATES.KRW_IDR, scope, used}`；赴韩项目都取消 → 同一案件转本地案件、`scope:'main'`（走原来的本地选购 + 结算单 `compCredit`，并重置 `projectsLocked` / `recommended`）；还有赴韩项目继续 → `scope:'lm'`（走本地管理选购 `lmSettle`）。选购画面顶部「代偿额度 Rp X · 已选 · 剩余 · 需补付」（`compBannerHtml`）；已选 < 额度不能结算（`confirmProjectSelection` / `lmSettle` 都挡），超过补付，不能「本次不购买」；付款时结算窗写「赴韩定金转本地代偿：−Rp X」、应付扣掉额度（`compFinalize`：买到的持有批次标 `comp`、`c.comp.used`、Timeline「赴韩定金转本地代偿：−Rp X…」）；`comp` 批次不可退款（`refundableBatches` / 退款服务 / 全部退款 / 持有项目显示「代偿 · 不可退款」）。定金按「退款」入账（`c.refunds` 带 `comp:true`，所以定金净额为 0、本地全额计入收入，不重复算）；代偿之后照现有流程（使用 / 本次不使用 / 退回）。
- 测试覆盖页新增 H1（无法退款 → 本地代偿，认 Timeline「赴韩定金转本地代偿：−Rp」）；`selftest.js` 新增 HS1（KM1 分页）、CP1（IN）。
