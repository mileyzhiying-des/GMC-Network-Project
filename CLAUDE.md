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

## CMD-1014-04 补充（2026-10-14，追加；旧文字保留作历史）
- **第 2 轮前 Code 先跑一遍**：三个开关全开 + 第 2 轮 + 全新演示数据 + 单分页。IN 全套 73/73；角色功能 S29–S41、E5、G1–G4、N1–N3、TD/TDK、CAL1–CAL7、HS1 按账号（A1/A2/OWN/KC1/KM1/KD1/KO1/booking）分别跑过。开关全关再跑 IN 全套 72/73（S31 是重复运行占满数据，非程序问题）。
- **修的是测试，不是程序**：S35、S38 的「开放 / 关闭施术日期」是 CMD-1014-03 已取消的功能，断言改成「点日期只进那一周，openDates 不变」；S41 催办在开关开时（CMD-1013-17）只有「等报告超时」才能催，用例改为先把案件置成 awaiting_report + reportOverdue。程序代码无改动，数据版本不变（42）。
- 注意：HS1 会跳到管理页，之后同一分页跑 CAL2 会因找不到工作台元素失败，先 `nav('kr-dashboard')` 或把 HS1 放最后。

## CMD-1014-05 补充（2026-10-14，追加；旧文字保留作历史）
- 规则变更，**不带开关**；基准 c7e41cc，单独一个提交；数据版本不变（42），新增可空字段：客户档案 `compCredits`（`[{id, amount, kwr, fromCaseId, fromCaseNo, reason, date, used, usedCaseNo}]`）、`c.comp.deferred / creditId / fromCaseNo`、结算批次 `compRefund / compFrom`。
- **代偿标「代偿」不标「退款」**：定金仍以 `c.refunds` 带 `comp:true` 入账（财务净额 `refundSum` 不变、经营数据算法不变）；新增 `refundCashSum`（只算真退款）/ `compSum`（代偿）——`hasRefundMark`、「有退款」筛选、财务栏、`financeLabel`、结算汇总行「已退金额」只认现金退款，代偿另写「代偿 ₩X」/「已转代偿」。
- **当场换 = 一次换完、多退少补**：`compFinalize` 算 `extra`（补付）与 `back`（代偿余额退还，记在结算批次 `compRefund`，`financePaid` 的本地收入扣掉它）；去掉「不到额度不能结算」。结算窗 / 结算单写「代偿余额退还 Rp X」。
- **先不换**：选购画面代偿横幅上［之后再换］（`compDefer`）→ 额度存成客人的 `compCredits`（不设期限、不可退款），客户详情持有项目卡最上方显示（`renderClientHoldings` 包装）；赴韩全部取消后案件退回面诊级，`canEndCase` 用 `compAllKrGone(c)` 放行（定金已退 / 转代偿、没到院时也出现［结束案件］）。
- **下次来换**：本地选购画面（main / lm）出现［用代偿额度换项目］（`compUseBarHtml` / `compUseCredit`），同一个选购画面，`compFinalize` 把客人额度标 used；结算单 / Timeline 写来源原案件号（`cp.fromCaseNo`）。
- **医院设定改休息 / 半天营业先清空**：`hspSet` 改前调 `hspConflicts(日期, 模式, from, to)`（该日已确认未到院的施术、没做完的术后管理 / 在韩持有使用；半天营业只算营业时段以外的），有冲突弹 `#hsp-conf-overlay` 列出案件（点开进子案件），改期 / 取消后才能改。
- 测试：`selftest.js` CP1 改写（便宜退差额 / 贵补付 / 标代偿不标退款）、新增 CP2（先不换→结束案件→客户详情→新案件换→归零）、HS2（KM1 分页）；HS1 选没有排期的周一。

## CMD-1014-06 补充（2026-10-14，追加；取代 CMD-1014-05 里「多退少补 / 代偿余额退还」的部分，旧文字保留作历史）
- **代偿换项目不退钱**：已选合计 < 代偿额度 → 不能结算（`localPurchaseHtml` 结算按钮灰、`lmSettle` / `confirmProjectSelection` 弹提示「还剩 Rp X，请再加项目」），横幅写「还剩 Rp X，请再加项目」；> 额度 → 补付差额。当场换、［之后再换］留给下次、下次［用代偿额度换项目］三处同一规则。`compRefund` / 「代偿余额退还」已拿掉（`financePaid` 恢复原样）；其余（标代偿不标退款、客户详情代偿额度、结束案件放行、医院设定挡住）不动。数据版本不变（42）。

## CMD-1014-07 补充（2026-10-14，追加；旧文字保留作历史）
- **🎨 新样式 / 旧样式开关**：基准 5eb85b2，单独一个提交；开关 `localStorage.gmc_cfg_newstyle`（`'0'` = 旧样式，默认新样式；`gmc_cfg_` 前缀重置 / 升级不清），在**测试覆盖页顶部**（和其他开关并排）切换，切换后原型分页刷新生效。数据版本不变（42）。
- 新文件 `shared/dstyle.js`（in / kr / owner / login / booking / test-prep 在 `app.css` 后立刻加载；`dev/check.sh` 已纳入）：新样式时 ① 同步读 `app.css`（`?direct` 让 Vite 开发服务器回原样 CSS），把写死色值换成语义变量，追加语义变量定义（`--bg-* / --border-* / --text-* / --action-* / --feedback-* / --status-*`）、旧变量（`--ivory/--navy/--terracotta…`）改指向语义变量、字体（Pretendard + Noto Sans SC，CDN 加载，离线回退系统字体）、圆角（徽章 4 / 按钮输入框 6 / 卡片 8 / 弹窗 12）、字重 600 / 800 → 700、主按钮改品牌色，`document.write` 成 `<style id="ds-css">` 盖在 app.css 后面；② 页面自带 `<style>` 和 JS 生成的 `style=""` 里的色值 / 字重用 MutationObserver 同样替换（`window.DS_UNMAPPED` 是没对上的色值，保持原样）；③ 文字里的 emoji 换成 Lucide 线条图标（线宽 1.5、颜色跟随文字，原 emoji 留在隐藏文字里，`innerText` 不变，所以自测不受影响）。旧样式 = `dstyle.js` 直接返回，什么都不做。
- `data.js`：`TONE_COLORS`（Violet / Yellow / Blue / Green / Rose / Gray，键名 Beige / Brown 保持不变）和日历事件 `TYPE_COLOR / TYPE_BG`（预约来访 = Violet、赴韩施术 = Blue）按 `window.DS_NEW` 取值。**新写颜色 / 图标时：颜色优先用语义变量，图标要在 `dstyle.js` 的 `ICONS` 里加映射**。

## CMD-1014-08 补充（2026-10-14，追加；旧文字保留作历史）
- **颜色角色重新分配**（只换颜色，挂 07 的「新样式」开关，旧样式全部恢复；基准 ecb41cd；数据版本不变 42）：`--bg-page` 改 #F7F4EE；侧栏选中 = 底 `bg-sidebar` + 驼色字 / 圆点 + 粗体；今天表头（IN `.wk-head.today`、KR `.krc-head-today`）= `bg-brand-subtle` + 驼色字 + 底部 2px inset 细线，今天那一列格子 `bg-brand-faint`（IN 周视图格子加 `wk-tcol` 类、KR 今天列加 `krc-col-today` 类，旧样式下没有样式）；分段切换选中（`.cal-switch` / `.todo-seg` / `.chip` / KR 里行内 `background:var(--navy)` 的按钮）= 白底 + 驼色字 + 细框；现在时间线驼色；数据卡数字（`todoCardHtml` 加 `data-n` / `.ds-cnum`）0 = 灰、「待我处理」>0 = 驼色 + 左侧 2px inset 细条、其他警示保持红；休诊 / 午休 / 不可预约（`#F3F1EC`、`#EFEBE4`）→ `bg-sidebar`。所有样式在 `shared/dstyle.js` 的 `extra` 里，加新「选中 / 当前」状态时用同一套语义变量。

## CMD-1014-09 补充（2026-10-14，追加；旧文字保留作历史）
- 基准 56e9505，单独一个提交，数据版本不变（42）。①②③ 不带开关，④⑤ 挂在 07 的「新样式」开关下。
- **KR 案件列表**（含院长账号，同一个 `krRenderCaseRows`）：「状态」拆成「阶段」（徽章，`caseStageInfo(r.c).stage`，颜色同 IN）+「进程」（`caseStageInfo(r.c).proc` 一般文字 + 在韩后续标签 + 原来徽章下面的小字 `krSubHtml` / 今天到店）；其他栏位、tab、筛选、排序不动。
- **IN 客户管理列表**（`renderClientRows`，in.html 表头）、**KR 客人管理列表**（`krClientListHtml` / 新函数 `krCliStageProc`）：「当前进度 / 状态」拆成阶段 + 进程，**只列进行中（未结束）的案件**，一位客人有多个进行中案件就一行叠几行；没有进行中案件两栏都显示「—」，不再显示最后一个已结束案件的状态。IN 的财务栏照旧读最近一个案件（`clientCaseStatus`）。
- ④ 数据卡数字：`todoCardHtml` 加 `data-warn`，新样式下有超时项（`warn`）才红，没超时用正文色 `text-body`，0 = 灰；「待我处理」> 0 仍是驼色 + 左细条。⑤ 客人预约页选中态（语言切换 / 日期 / 时段 / 单选 / 首页大卡）= 浅驼底 #F6E9DE + 驼色字 + 驼色细框，CSS 在 `dstyle.js`（用 `!important` 盖过 `booking.html` 自带样式）；旧样式恢复黑底。

## CMD-1014-10 补充（2026-10-14，追加；旧文字保留作历史）
- 基准 8cf07ae，**两个提交**，数据版本不变（42）。**（一）** 新样式开关下只换颜色：`#kr-cal` 白底卡片（白底 + `border-default` + 圆角 8 + 内边距 16，工具列 / 图例 / 日历 / 说明都在里面）；日视图不染今天（`#day-grid .wk-head.today` 透明；KR 的今天表头 / 列类名 `krc-head-today` / `krc-col-today` 只在多天视图加）；不可预约块（KR `krc-busy`、IN 的 KR 医院日程 `kr-busy`）= `bg-hover` + 1px `border-strong` + 次要文字色；客人预约页 `.bk-btn`（非 ghost / danger）改 `action-primary`（hover `action-primary-hover`）、进度条驼色。**（二）** 不带开关、改版面高度：待办栏和日历一样高——`#cal-todo-wrap` 在「日历对齐」开着时 `align-items:stretch`，`.todo-box`（带 `width:auto` 的）绝对定位铺满待办栏（不撑高那一行），标题行固定、`.todo-list` 在框内滚动；收起行为不变。

## CMD-1014-11 补充（2026-10-14，追加；旧文字保留作历史）
- **第 2 轮跑完（四开关全开含新样式 + 轮次 2 + 全新数据）**：IN（A1）套件 73/73、E5 两步、A2/OWN/KC1/KM1/KD1/KO1/B1/D1/booking 角色用例全部通过；新样式切到旧样式后再跑 IN 73/73 + E5 + A2 + KM1 全部通过。跑法仍是 `selftest.js` 调页面函数（不是手点），另加视觉审计：对比度 / 截断脚本 + 截图（IN 工作台 / 案件列表 / 案件各 tab / 弹窗，KR 工作台 KM1·KD1 / 案件 tab / 院长管理，预约页手机宽度）。
- **修的 bug（commit 20c30ad）**：工作台「待预约（KR 请帮忙预约术后管理）」`#dash-subbook-card` 和「术后管理已过建议日期」`#dash-pcdue-card` 只在事件（预约后 / 做术后管理 / 拒绝来电）时才渲染，**刷新页面后消失**（冷启动检查没覆盖）。现在 `boot-in.js` 初始化列表和 `ui.js` `refreshView` 都会渲染。数据版本不变（42）。
- **测试方法教训**：在 in.html 里 `gmcResetAll` 后直接跳转，旧页面离开时会把内存里的旧数据**再存回去**，所以「重置」不干净（案件数 114 而不是 20，S31 / A3 因此失败）。**正确做法：先到 login.html 执行 `gmcResetAll(...)`，再进 in.html?demo=A1**，开头检查 `CASE_ITEMS.length===20`。S31 / A3 在脏数据上会失败（S31 的「T2自测项目」重名、A3 的 19:00 时段被占满），不是程序问题。
- 测试顺序提醒：CAL2 要在工作台页面上跑（前面 S36 / TDK 之后要先 `nav('kr-dashboard')`），否则「当前时段框 / 月份」会失败；S41 要先 A1、再 KM1。

## CMD-1014-12 补充（2026-10-14，追加；旧文字保留作历史）
- 基准 2c78e61（20c30ad 之后）；两个提交，数据版本不变（42）。**（二）890cac4 用语「代偿」→「置换」**：画面、Timeline、通知、提示文字、持有批次标签、客户详情「置换额度」、［用置换额度换项目］、结算单「赴韩定金转本地置换」全部改了；变量名（`c.comp`、`compFinalize`、`compSum` 等）不改；覆盖页 H1 同时认旧记录里的「代偿」；selftest CP1/CP2 断言跟着改。**用户已有的旧 Timeline 文字里的「代偿」不会自动改（存档里的历史文字）**；以后新写文案一律用「置换」。
- **（一）58cc16b 视觉修正**（`dstyle.js` 新样式 CSS，旧样式不受影响）：时间轴副文字（`font-size:9px;color:var(--dim)` 的 inline 样式、`.wk-time.empty`、`.wk-time .kr`）、`.wk-lunchbar` 和 `[title^="午休"]` 提到对比度 ≥3:1；`.sidebar-foot`、IN 项目库「只读」同；KR 院长管理头像首字母加 class `ds-avl`（深色字）；KR 周视图休诊窄列表头新样式下写「休诊」+ 悬停 title 显示「MM-DD 医院休诊」（`kr.js` `krcGridHtml`）；`.todo-nowline` z-index 30/31。**IN 日视图「+N 更多」（不挂开关，在 `calalign.js` `buildDayGridNew`）**：同一 30 分钟时段超过 3 个事件只画前 3 个 + 一个「+N 更多」块（占该时段的车道，点开 `openSlotList`），规则同周视图。
- 没做（不在范围）：KR 周视图 / 工作台固定栏空格的「—」对比度 1.51（`color:#ccc`，旧路径里的占位）、IN 日视图块在大量重叠时仍很窄（正常数据影响不大）。

## CMD-1014-14 补充（2026-10-14，追加；旧文字保留作历史）
- **角色功能测试**（取代 CMD-1014-13）：新增开发工具 `prototype/shared/roletest.js`（不属于产品，不改业务数据；临时造的案件 / memo / 通知用完会清掉或改回）。用法：用某个账号登录后，在该页面注入 `/shared/roletest.js`（IN 账号再加 `/shared/selftest.js`，用来建测试案件），调用 `RT.R.length=0; RT.runIn()`（IN / 老板）或 `RT.runKr()`（KR），再 `RT.save()` 存进 localStorage（键 `rt_res_账号编号`，不带 `gmc_` 前缀，重置演示数据不清）；`RT.all()` 汇总。每一格 = 规格期望（✅ 能 / ❌ 不能 / 👁 只看 / — 规格未写）× 实测。依据 Accounts & Settings §2 §7、IN-SETT-01、KR-DASH-01、KR-CASE-03、KR-CLNT-01、Notification Center、IN-SRVC-01（活动价 / 套餐只有管理者）。
- 结果：IN（OWN / A1 / A2 / B1）、KR（KO1 / KM1 / KC1 / KD1 / KM2）逐格实测，**与规格不符的 = 0**；规格没写的几项只记录实测（见 Notion 汇报）。KM2 / B1 里「演示数据没有这个情形」的格子（H2 没有等确认出报告时间的案件、C2 没有可退批次、C2 / C3 没有老板账号）无法实测，不是程序问题。
- 测试时注意：① 在控制台里不要 `var t = ...`（覆盖全局翻译函数 `t()`，管理页会报 `t is not a function`）；② KR 页面（kr.html）不支持 `?page=` 地址参数，直接输入网址测不了 KR 的页面守卫，要在页面里调 `nav()` / `openAdminPage()`；③ 院长账号名下没有某状态的案件时，`roletest.js` 会临时把一个同状态案件的院长改成自己，测完改回（`RT._borrowed`）。
- 没改程序代码；数据版本不变（42）。

## CMD-1014-15 补充（2026-10-14，追加；旧文字保留作历史）
- 基准 c8c7ca9，三部分各自提交（28ac407 / 08341fa / 19a04cd），不带开关，数据版本不变（42）。
- **一 KR 日视图按院长分栏**（`kr.js` `krcDayColsHtml`，`krcGridHtml` 在 `KRC.mode==='day'` 时走它）：栏 = `krcWho()==='all' ? krcDirectors() : [某位]`（KM / KC 选「全部院长」= 每位在职院长一栏；单一院长 / 一般院长 / 代表院长「看自己」= 一栏；代表院长切「全部（只看）」= 全部栏，点空白格不弹）；栏顶写院长名字（`.krc-dirhead`）；**固定栏放法**：每位院长的 OFF / memo 在自己那一栏（OFF 按 `o.kind==='director' && o.who===名字`，memo 按 `m.author===名字`），**室长的 OFF / memo 放最上面一行「全院」**（轴格写「全院」，内容横跨全部院长栏；其他院长写的 memo 不会出现在全院行）；事件按 `b.who` 放进负责院长那一栏，同栏内照原来的并排；午休 / 休诊 / 现在时间线 / 当前时段框每栏都画（同高，看起来横贯；现在时间的标签只在第一栏）；栏宽 `minmax(180px,1fr)` + 外层横向滚动，时间轴格 `position:sticky;left:0`；点空白格 `krcCellClick(ds,e,el,院长)` 预设院长 = 点的那一栏。`krcFixedHtml(ds, offs, memoPred)` 加了可选的 memo 过滤函数。周 / 月视图没动。
- **IN 的「KR 医院日程」日视图没做**：IN-DASH-01 的 10-14 修订写「切到 KR 医院日程、日视图、全部院长时每位院长一栏」，但同页 10-08 修订写「KR 医院日程只有月 / 周（拿掉日视图）」，原型现在是后者（`setCalMode` 在 KR 视角下把日改成周）。两条矛盾，没改，列在汇报问题清单。
- **二 KR / 院长对话、通知照 IN**：对话 = 右侧抽屉（`#kr-chat.chat-drawer` + `#kr-chat-overlay.drawer-overlay`，共用 `app.css` 的 IN 抽屉样式；「职员间」tab = Main 群，「案件」tab = 案件房，卡片 / 搜索 / 未读圆点同 IN；点房间在抽屉里看消息并发送，房间内容、成员、权限、院长静音不变）；**没做［新建职员对话］［新建案件对话］按钮**：KR 现在没有创建房间的数据结构（只有 Main 群和 IN 建的案件房），规格也没写 KR 能新建什么，列在问题清单。铃铛 = IN 的「最近通知」样式（`krToggleBell`，图标按通知类型 `krNotifIcon`）；对话和通知一次只开一个（`krToggleBell` 关抽屉、`krOpenDrawer` / `openDrawer` 关下拉，IN 补了同样的互斥）。
- **三 待办栏 / 日视图标题**：待办行四栏 grid（`.todo-row`：事项｜预计时间 `MM-DD HH:mm`｜状态｜客人 + Case ID；`todoStatusOf`：已超时（红，催办按钮放状态栏）/ 待接待（visit）/ 等待中（gray 或 kr / waiting 类）/ 待处理），分组标题 `.todo-group` 整行底色带（已超时 `--feedback-error-bg`，今天 / 之后 `--bg-brand-subtle`，旧样式有 hex 兜底）；事项文字统一正文色（`.todo-row.gray` 变灰已拿掉）；「今天来访」待办不再清空 `name`（客人栏显示名字）。日视图标题：KR `krCalendarHtml` 日期后加（前天 / 昨天 / 今天 / 明天 / 后天，`relDayLabel` / `relDayDiff` 在 rules.js）；IN 日视图时 `updateCalNavLabel` 把 `.cal-nav` 换成 ‹ 日期（相对日子） › + ［今天］，周 / 月还原。

## CMD-1014-16 补充（2026-10-14，追加；旧文字保留作历史）
- 基准 75e0e1a，四个提交（70a717f 权限与可见范围、73dab3c KR［新建职员对话］、0b1856e IN 在 KR 日程占位预约、a884cd4 演示数据）+ 一个修复提交；不带开关；**数据版本 42 → 43**（`MIGRATIONS` 空迁移，升级前自动备份并保留用户案件；用户在 `HOSPITAL_DATA` 里新建的占位预约 `krBookings` 重置后会丢）。
- **权限**：IN 老板有铃铛只收「系统」类；案例库统一由 IN 维护（新增时选本地 / 赴韩），KR 全角色只读（`krshowview`）；代表院长可看 KR 客人管理（只读）；金额可见范围走 `viewerTextFilter` / `viewerLogHidden`（只改显示，不改存的文字）；开放施术日期残留清掉。
- **KR［新建职员对话］**：成员 = 本院 KR 人员 + 对接诊所的 IN 室长（同一房只能选同一家诊所的 IN 室长），房间放在所选 IN 室长的诊所分区（`ROOMS` 带 `members`）。
- **IN 在 KR 医院日程占位预约**（新文件 `shared/krbook.js`，in.html / kr.html 在 kr.js 后加载）：IN 点 KR 医院日程空白时段 → 选客人 / 目的 → 院长日程里出现 `kind:'预约'` 待确认块；KR `coreBookConfirm` 确认后用 `createReservationCase` 在来源诊所分区建新案件（`c.krVisit`，时间是韩国当地，不进本院日历 / 今天来访 / 未到店自动判定），到店 `coreBookArrive` → 完成 `coreBookDone`（使用持有 / 新做管理 / 其他）→ `finishCase`；KR `coreBookReselect`（无法安排 / 建议改时间）→ IN 待办「重选时间」。覆盖表 H2a / H2b；selftest BK1a-c、BK2a-c、BK3（跨账号分页分段跑：A1 → KM1 → A1）。**KR 的 `core*` 要在 KR 分页跑，IN 分页里改同一诊所分区不会刷新自己的活数组。**
- 演示数据：OWN2 / OWN3（C2 / C3 老板）、C2 客人17 可退批次（婴儿针 ×3）、H2 客人30 等确认出报告时间 / 客人31 已出诊疗方案；登录页加按钮。修过一个种子 bug：`catLabelOf` 是函数内局部变量，C2 种子抛错导致后面案例库种子被截断。
- 简化 / 待确认：新做管理只记项目名不计价；使用持有扣在韩持有项一次；占位预约的目的选项为我自拟。

## CMD-1014-17 / 18 补充（2026-10-14，追加；旧文字保留作历史）
- **17（191e6f4）**：新样式开关下品牌主色 #A0592F → #9A6A4B（hover #7E563C，链接 / 聚焦 / 选中 / 今天表头 / 现在线等读变量跟着变）；案件详情右上「对话」、「催办」改线框（inset 阴影，不加 border，尺寸不变）。只改 `dstyle.js`。
- **18 一 操作锁（f13837d，ui.js 末尾 `op*`）**：localStorage `gmc_case_operator`，每「案件|IN 或 KR」一条 `{tab, acct, name, ts}`；案件页打开时没有操作人（或 40 秒 `OP_TTL` 没心跳）就成为操作人，心跳随 5 秒定时器刷新，`pagehide` 立即放开；别的室长 → 只读（顶部「xx 正在操作此案件，本页只读」），点操作按钮 / 输入框（`opGuard` 捕获阶段拦，导航类 `OP_ALLOW` 放行）→ 弹窗「当前案件正在被操作」［取消（只读）］［接管操作］；接管后原操作人变只读 +「xx 已接管操作」，案件 Timeline 记「xx 接管操作（原操作人：yy）」。IN 室长（管理者 / 一般）之间、KR 室长（管理者 / 一般）之间；IN 与 KR 互不锁；院长 / 代表院长 / 老板不参与。**与 CMD-1012-01 的「同账号两分页锁」并存**（同账号不触发本锁）。已知：只读的人在操作人离开后会自动升为操作人（不是「下一位打开的人」）；后台分页定时器降速，所以 TTL 取 40 秒。
- **18 二（0ed4b95）**：取消的预约（`c.cancelBy` = 客人 / 室长）在日历上划掉保留，写「客人取消预约」/「预约取消」，不倒计时（`calEvHidden`：旧取消没有 cancelBy 仍消失）；倒计时每秒按案件状态收掉（`data-visit-case`）。原因：取消的事件原来整块从日历滤掉，只有旧分页里没重画的块还在数倒计时；本次改成划掉保留 + 倒计时自己看状态。
- **18 三（2084a4f）**：现在线一条横贯、一个时间标签（`todoKrNowTick` 只给第一条写字）、拿掉当前时段方框；IN 日视图块宽 = 1 / `slotCapacity`、文字「15:00｜客人2｜复诊」（`eventChipHtml(e,{day:true})`）；`CAL_MODE_BY` 本院 / KR 医院日程各记视图；KR 日程可占位时段 hover 粉（`krBookHover`）；日 / 周 / 月标题统一（`relWeekLabel` / `relMonthLabel`）；拿掉 KR 确认今日院长日程（按钮 / 横幅 / 待办 / 文字，`dayConfirm` 数据留着不读）。
- **18 四（051f6c4）**：KR 看 `stage==='local'` 的案件 → 阶段「—」、进程 `krLastStatusText`；占位预约不选院长：块挂 `directorSchedule[KRB_HOSP='__全院']`，`krbClosedText` 只看医院休诊（午休 / 营业时间外 `krbOffText` 弹确认），KR 日视图另放「全院预约」栏；到店后：新做管理 `coreBookFeeAdd` / `coreBookFeePaid`（`b.fee`，金额只存在预约记录里，KR 弹窗看得到，案件 Timeline 不带金额），使用在韩持有 `did.qty` 可扣多次；`coreBookArrive` 要到预约当天（`coreBookSimDay` 模拟）；拿掉请 IN 帮忙预约（KR 勾选 / 通知按钮、`renderSubBookCard` / `renderPcDueCard` 变成空函数、待办 subbook）。数据版本不变（43）。

## CMD-1014-19 补充（2026-10-14，追加；旧文字保留作历史）
- **一 日历两层（提交见 Notion 汇报）**：KR 室长 / 管理者日历：第一层［医院］（`KRC.layer='hospital'`，默认，`krcWho()==='all'`）｜［各位院长］（`layer='director'` + `KRC.person` 下拉），第二层 日（默认）｜周｜月；医院层日 / 周 / 月都不分栏（`krcDayColsHtml` 不再路由，函数留着），只画客人预约（面诊 / 施术 / 术后到店 / IN 占位），同时段并排，每块一行 `krcOneLine`「时间 · 客人 · 类型 · 院长（IN 占位写全院）」，不显示院长 OFF / 不可预约，固定栏 = 所有 memo + 室长 OFF；院长层 = 他的预约 + 不可预约 + 他的 OFF / memo，点空白格加不可预约 / 标 OFF 只在这里（`krcCellClick` 医院层直接返回）。院长账号没有第一层；代表院长切「全部」同室长两层（只看）。IN「KR 医院日程」：下拉第一项「医院」+ 各院长，只有周 / 月；医院层不显示院长 OFF / 其他诊所预约（沿用原可见规则：其他诊所的施术只在选单一院长时画浅灰无字块）。
- **约满标记**（`calalign.js` `krCapSlots` / `capHtml` / `krCapHeadHtml` / `inCapHeadHtml`、`ui.js` `krOpenTag`）：取代「施术开放 / 未开放」。KR 医院层：已约 = 预约块占用的营业时间内（不含午休 / 休诊时段）30 分钟段数合计，上限 = 在岗院长数 × 段数；院长层：已约 = 他的预约 + 不可预约占用段数，上限 = 段数，整天 OFF 写「OFF」；IN 本院：已约 = 各时段有效预约 + 占位数（`slotBookingCount`），上限 = 诊所「每个时段上限」× 可约段数。已约 ≥ 上限 → 约满。
- **时间轴「韩 / 印」**：每个时间前两行（KR：韩 09:00 / 印 07:00，IN：印 09:00 / 韩 11:00），拿掉顶部「印尼 / 韩国」小标题（`axisHeadHtml` 返回空）；`todoPlaceInLine` 按「印 hh:mm」解析时间行。**营业时间外前后 2 小时浅灰 `#F1EEE8`**（IN：`wk-outside`、日视图带；KR：每列底带），仍可约（弹确认）。
- **OFF 那天有施术的数据**：演示数据 KD1 每周三 OFF 而种子 10-14 有客人9 施术；`repairOffConflicts()`（启动幂等）删去和该院长已有施术 / 面诊 / 预约重叠的那一条 OFF；正常流程 `krSurgerySlotError` 本来就拦院长整天 OFF（自测 CAL8 验证）。
- **二**：KR Timeline `logLine` 把阶段「本地管理」显示成「—」、正文「本地管理」换成「IN 处理」；操作锁自动升级弹 toast「你现在可以操作了」；占位预约到店「新做管理」选项目同 IN 本地选购（KR 本地管理项目库、按类别一行一项目 + 规格 + 加入 / 赠送서비스，`b.fees[]`，可多项，全部已付款才能标完成）。数据版本不变（43）。

## CMD-1015-01 补充（2026-10-15，追加；旧文字保留作历史）
- 只改日历，不带开关，数据版本不变（43）。**约满**只写「约满」不写已约数字（`capHtml`，整天 OFF 的院长层仍写 OFF）。**营业时间外按需显示**（`CAL_OUT` 界面状态 + `calOutBar`）：IN 本院（`calHours` / `calInNeed`）、IN 的 KR 医院日程（`krRows` / `krOutNeed`，KR 时间）、KR / 院长（`krcApplyRange` / `KRC_NEED`）——这一周 / 这一天有预约落在营业前（后）才展开前（后）2 小时，没有就只显示营业时间；时间轴顶 / 底有「▼ 显示营业前 / ▲ 显示营业后」小条，点开才展开（再点收起），自动展开时不显示小条。底色 `--neutral-25`（app.css，取 text-placeholder #8E857C 的 14% 透明度；设计规范里的 neutral/25 具体取值仓库里没有，需要时改这一个变量）。第一层平铺：KR `krcPick`、IN `setKrDir` + `#kr-dir-bar`；KR 日 / 周 / 月和第一层用 `.cal-switch` 分段按钮；`calEvHidden` 把 `travel` 事件藏掉（IN 本院日程不显示赴韩施术，图例也拿掉）。
- **CMD-1015-01 第二部分（2026-10-15）**：⑥ 今天不染整栏（`dstyle.js`：`.wk-tcol` / `.krc-col-today` 不再有底色；表头只用主色加粗 + 2px 底线，无底色）；hover 色只在 `.wk-cell-open`（可预约格）。⑦ 日历 : 待办 = 2 : 1（`todo.js`：`2 1 0` / `1 1 0`）。⑧ KR / 院长日历格子高度同 IN（`krcApplyRange` 设 `KRC_PX`：日视图 = `CAL_DAY_PX` 44px/小时，周视图 112px/小时 = IN 周视图 56px/半小时），`.krc-outwrap` 高度 `calc(100vh - 330px)`、最小 420、栏内滚动；待办栏与日历同高（原来的 stretch）。KR 滚动区里表头不吸顶（IN 的 `.wk-scroll` 也没有特别处理）。

## CMD-1015-02 补充（2026-10-15，追加；旧文字保留作历史）
- **拿掉顶栏**（IN / KR / 院长 / 老板端所有页面）：`buildTopbar` / `buildKrTopbar` 返回空，in.html 里四个自带顶栏（院长详情 / 案件详情 / 客户详情 / 上次项目史）删掉；对话 / 通知 / 头像（`.head-actions`）由 `ui.js` 末尾 `headMount()` 挂进当前页第一行最右（`HEAD_OWN`：工作台 `.dash-top`、案件详情 / 客户详情 / 预约历史 / KR 案件详情 / 客人详情 / 子案件 = 内容区第一个元素；其他页补一行 `.page-title-row`，标题见 `HEAD_TITLES`，管理类页面标题 = `HEAD_ADMIN_TITLE`）；IN 的返回链接放第一行最左（`HEAD_BACK`）；KR 页面整块重画后靠 `.content` 上的 MutationObserver 重新挂（幂等）；`showPage` 也会调。KR 图标 HTML 在 `krHeadIconsHtml()`。
- **KR / 院长工作台对齐 IN**：问候行用 IN 的 `.dash-top` 结构（问候 h1 + 右上日期 / 医院名）；今日 OFF 同 IN 一行文字（没有人 OFF 整行不显示）；日历卡片拿掉标题和底部说明，工具列 = 左图例 `.cal-legend`｜中第一层｜右 月周日 → ＋memo → ‹ 日期 › 今天（`.cal-switch` / `.cal-nav` / `.cal-nav-btn`，和 IN 同类名）；日历包在 `.card`（内距 20px 22px）里；4 张卡的提示行一行省略（和 IN 同高）；日视图格子高度按可用高度平均分配（`calDayPx(hours)`，最小 44px/小时），IN 日视图同。

## CMD-1015-03 补充（2026-10-15，追加；旧文字保留作历史）
- 只修 UI。**页面第一行分两级**（`ui.js` `headMount`）：一级页面 = 左页面名（工作台 = 问候）+ 右三个图标；二级页面（`HEAD_L2`：IN 案件详情 / 客户详情 / 院长详情 / 预约历史记录，KR 案件详情 / 客人详情 / 子案件）= 第一行（`.page-head-row`）「← 返回」+ 右三个图标，第二行 = 页面自己原来的第一行（客人名 · Case ID · 阶段·进程、「💬 对话」/「发起内部对话」等跟着在第二行；原来第二行里的 goBack 按钮拿掉，返回去处照旧 `goBack()`）；新标签页打开的诊疗方案 / 上次项目史 = 一级页面样式，不放返回。内容里自带的同名标题（管理类页面等）自动去掉，只留页面名一次。
- 案件列表页名改「案件管理」（IN / KR 页面名，KR 侧栏也改）；KR 案件管理页外观照 IN（下划线 `.tab`、不带件数、筛选在 tab 同一行右边；tab 分法 / 栏位 / 筛选内容 / 排序没动）。KR 工作台右上天气 = `TZ_INFO['Asia/Seoul']`（☁ 首尔 18℃，演示数据），取代医院名。

## CMD-1015-05 补充（2026-10-15，追加；旧文字保留作历史）
- 基准 **8778a78**（第 1 项已提交），其余各项分组提交，**未推送**；不带开关，数据版本不变（43），没有改资料结构（只新增 localStorage `gmc_cfg_todoseen_<账号>`）。
- **1 数据容量**：新增 `shared/storepack.js`（所有页面第一个加载；`Storage.prototype` 透明压缩，单键 > 30 万字符自动 lz-string，读写代码不用改；`gmcRawGet` 取真实大小）；`store.js` 的 `save()` 写失败不再清整个存档，先腾地方（删备份 → 删最旧通知 / 短信 / 日志 → 瘦 Timeline），绝不清用户案件；自动备份只留 1 份。原因：3 份备份各约 1.2MB 占了 4.7MB 上限的大半 + 诊所分区（案件 527KB、Timeline 162KB、通知 60KB）。
- **2～4 KR 表单**：没勾推荐项目时［发送诊疗方案］置灰（提示"请选择院长推荐的项目"），共同术后管理空行 / "至少勾 2"弹窗拿掉；共同术后管理蓝底 `--feedback-info-bg:#E5EEF8`；术后管理行改两行排布（名称｜N 次｜隔几天｜具体项目｜移除 / 所在地｜第 N 天起｜自动日子）；［补加可选项目］改成可展开卡片（`krAddCardHtml`，字段同发送表单 + 共同术后管理勾选，只能加）。
- **5～7 IN 赴韩施术计划**：选日期点 1～2 天、✅首选日、单选自动首选（`pickKrDate` / `setKrPrimaryDate`）；tab 改名「赴韩施术计划」三张卡（状态+日期+［无法协调］/［取消项目］；可收起的推荐项目整理；确认赴韩项目 + 印尼室长备注 `c.recInNote` + ［+追加项目］）；「在韩 timeline」tab 只在 KR 确认施术时间后出现；最右［打印］`printKrPlan()`（面诊内容翻译版 + 推荐整理 + 确定项目 + 备注，**无金额**）。
- **8 通知**白底，紧急的（来电 / @ / 未接来电，`urgent` 或标题以 📞 开头）前面彩色图标 `.toast-ico`。
- **9 待办**：第一栏「阶段｜事项」（`todoStageOf`，读 `caseStageInfo(c).stage`，没有案件的按类型）；新待办红点 `.todo-newdot`，打开案件（待办 / 案件列表 / 日历任一入口，包了 `openCaseDetail` / `krShowCase`）后灭，每账号各自记（`todoSeenKey`，第一次先把现有的都当已看）。
- **10** 右上角「26-10-15（周四）14:32:05」每秒走字（`dashClockText` + `[data-clock]`），时区按页面时区（IN = 诊所印尼，KR / 院长 = 韩国），下一行天气。**11** 案件管理按最近更新排序（`caseUpdatedKey` = Timeline 最晚一条，IN / KR / 院长）。**12** 院长卡片「今天 09:00–13:00 OFF（韩）」（`directorTodayOff().text`）。**13** 客人预约页首页：棕榈叶背景 `prototype/public/booking-bg.jpg`、左上诊所名（`bkClinicName`）、右上语言、大标题 + 欢迎语、两张大卡；内页统一暖色底，功能不变。
- **顺带修的 bug**：页头（对话 / 铃铛 / 头像）只在启动后 50 / 400ms 各挂一次且用 `requestAnimationFrame`（页面在后台不触发），数据多或页面隐藏时挂不上；改 `setTimeout` + `load` 事件 + 1 秒巡检补挂。
- **测试**：selftest 过时断言两处修正（S37：双层日历要 `KRC.layer='director'`；删「请 IN 帮忙预约」已在 1014-18 取消的断言）；roletest 补 `waitHead`（等页头挂好）、［＋ 补加可选项目］按钮文字探测。注意 selftest 一次性全跑时 BK2c 会提前消耗占位，跨账号用例要按 A1(BK1a/BK2a) → KM1(BK3/BK1b/BK2b) → A1(BK1c/BK2c) 分段跑；CAL3 之后同页跑 CAL6 会取到 CAL3 留下的 OFF，要重载页面单独跑。

## CMD-1015-06 补充（2026-10-15，追加；旧文字保留作历史）
- 基准 **c8802fc**（CMD-1015-05 之后），单独一个提交，**未推送**，不带开关。**数据版本 43 → 44**：一次性清空所有客人与案件，**不保留任何案件**（`gmcCarryDropCases`：升级前版本 < 44 时把提取到的用户案件 / 客人 / 通知等丢掉，只保留用户改过的项目库 / 活动价 / 套餐 / 案例 / memo 的 cfg）；之后再升级仍照 CMD-1012-09 的规则保留用户案件。
- **清空做法**（`data.js` 的 `gmcWipeClinicVars` / `gmcWipeHospitals`，`store.js` `init()` 写种子存档前调用）：种子仍由原来的代码生成，写档前统一清掉 `CLIENTS` / `CLIENT_HOLDINGS` / `CASE_ITEMS` / `RESUMED_VISITS` / `PLACEHOLDER_HISTORY` / `RESERVATION_PLACEHOLDERS` / `NOTIFS` / `SMS_LOG` / `ROOM_UNREAD`，案件对话房删除、职员间对话房保留但消息清空；医院侧清掉院长日程里的施术 / 面诊 / 预约块（保留「不可预约」）、`notifs` / `vault` / `krBookings` / `dayConfirm` / `reportRead` / `chatRead` / `cardSeen`；`CASE_NO_SEQ = 1`（案件号从 A000001 起）。保留：账号、`ACCOUNT_LOG`、院长与 OFF / memo、项目库（IN / KR / 本地管理）、活动价 / 套餐、诊所 / 医院设定、案例库（案例里没有引用任何客人 / 案件，故未删）。`gmcClearTestKeys()` 重置 / 升级时一并清掉 `rt_res_*` / `rt_st_*` / `__T2_*`。**以后新写演示数据不要再带客人 / 案件**，需要时用一键准备或测试脚本自己建。
- **一键准备**（`testprep.js`）：原有各项都自己建客人，不依赖演示数据；新增第 2 轮四个按钮（覆盖页 C 组）：`r2_02`（R2-02 Bunga / Citra / Dewi / Eka，待到院）、`r2_03`（R2-03 13 位，已付定金待确认施术时间）、`r2_07`（R2-07 Yanti = 3 个可退批次 / Zahra = 只有持有 / Rosa = 同意书 v0.5 / Melati = 有进行中案件 / Intan = 上月出过方案），`r2_09`（R2-09 Wati = 回印尼术后管理持有）；重名自动加 (2)、(3)（`uniqFull`）。修了准备脚本的老 bug：olivia / mini 的赴韩项目没清，启动时 `repairWronglyClosedCases` 会把「客人不做项目」案件重新打开。新增内部夹具键 `stagePay`（已缴面诊费）/ `stageW`（面诊还没开始）/ `stageWO`（负责院长 KO1），`TESTPREP_MAKE(key, cfg)` 可建到 H2 / C3。
- **测试自己建数据、测完清掉**（`selftest.js`）：`ST.begin()` 拍存档快照（`gmc_cfg_stsnap`，已有快照不覆盖，跨账号分页只留最早那份；`ST.runAll` 自动调用）；`ST.ensureFixtures(keys)` 用一键准备同一套造法建夹具（`gmc_cfg_stfix` 记已建的，键后缀 `@C2` = C2、`@H2` = C3 对接 H2，KR 分页也能调）；`ST.cleanup()` 整份还原快照 + 清测试键并刷新（`window.GMC_NO_SAVE` 让还原后本页不再写档，`store.js` `save()` 检查它）。`ST.runAll` 现在是 async（要 `await`）；KR 账号分页会自动建夹具。`roletest.js` 的 `RT.runIn / runKr` 先 `RT.prepare()`（拍快照 + 建各状态夹具），测完同样 `ST.cleanup()`。跑完整套后画面和存档里不留任何测试数据（已验证三家诊所案件 / 客人 / 通知 = 0，容量回到 ≈200KB）。
- **空画面**：案件列表「暂无案件」、客户列表「暂无客户」、预约历史「暂无预约记录」（原来是只有表头 / 旧的开发提示）；工作台 4 卡 = 0、待办「现在没有待办」、日历、KR 工作台 / 案件管理 / 客人管理 / 通知中心 / 经营数据、预约页「我的预约」（列表 / 日历）空状态都检查过，无报错。
- 测试顺序提醒同 CMD-1015-05（BK 三段 A1 → KM1 → A1；CAL2 要先 `nav('kr-dashboard')`）。数据版本 44。

## CMD-1015-07 补充（2026-10-15，追加；取代 CMD-1015-05 第 9 项「阶段｜待办事项」写法，旧文字保留作历史）
- 基准 **2a38b09**，单独一个提交，**未推送**，不带开关，数据版本不变（44）。三端待办（`todo.js` `todoRowHtml` / `todoPaneHtml`）一行 6 栏：**出现时间｜阶段｜进程｜截止时间｜状态｜客人名 + Case ID**（表头一行；红点仍在出现时间前）。出现时间今天只写「HH:mm」、其他日子「MM-DD HH:mm」（`todoFmtTime`）；进程 = 原来「｜」后面那段，去掉「（已超时）」（渲染时正则剥掉，`key` 也剥，所以超时前后是同一条）；截止没有写「—」；状态 / ［催办］照旧。
- **出现时间 = 这条待办第一次出现的时间**：每账号各记（localStorage `gmc_cfg_todoat_账号`，`todoStampAt`，不在列表里的会清掉；用 `demoNow()`，所以拨时钟 / 隔天会跟着走）。**超时**（`it.over`）且截止时间已过（`it.due <= 现在`）→ 显示 / 排序用截止时间（`todoShownAt`），整行红字（`.is-over`）；超时但「截止」是将来的日期（例如待确认施术时间的 due = 施术日期）时仍用出现时间。
- **分组** = 昨日及更早 / 今天 / 未来（拿掉单独的已超时组，「之后」改名「未来」）：依据显示的出现时间（`todoGroupOf`）；**我的判断（未经确认）**：没超时、截止在将来日期的待办（如等 KR 确认施术时间 due = 首选施术日）仍放「未来」，沿用旧「之后」的含义。**组内**：置顶 → 超时的最上面（按显示时间旧→新）→ 其余按出现时间旧→新（`todoSort`）。红点、全部 / 只看我的、4 张卡片计数不变。
- 栏宽（app.css 末尾 `.todo-row` 覆盖）：42 / 48 / 自适应 / 38 / 42 / 52px，窄栏里进程和客人名换行 / 省略；测试：拨时钟 +90 分钟（等待报告超时 → 时间改成截止时间、红字、排组内最上）、+26 小时（没处理的进「昨日及更早」）。

## CMD-1015-08 补充（2026-10-15，追加；旧文字保留作历史）
- 基准 **f34a213**，单独一个提交，**未推送**，不带开关，数据版本不变（44）。**待办 = 现在需要我动手做的事**（`todo.js`）：没超时的 `visit` / `kr` / `waiting` / `today2` 类条目（状态「待接待 / 等待中 / 未到」）标 `it.ref`，**不进待办栏**（`todoVisible` 过滤，`TODO_REF_CATS`）；超时才进。IN：今天预约过了预约时间还没按已到店 / 未到店 → 阶段「预约」、进程「客人还没到：联络客人」、截止 = 预约时间、已超时红字（`todoNowStr() >= due`）；等 KR 出方案 / 确认施术时间 / 改期超时 → 已超时 +［催办］（原来的 `urgeInfo`）。KR：今天到院（施术）/ 到店（术后管理、占位预约）过了时间还没标到 → 进程「客人还没到：联络 IN 确认行程」（`todoNotArrivedOver`）；等院长上传面诊超时才进（不变）；**院长（含代表院长）今天到院不进待办**（`krIsDirector()`，看日历）。
- **分组只留 昨日及更早 / 今天**（拿掉「未来」，`todoGroupOf`）；红点、全部 / 只看我的、6 栏、超时重排不变。**工作台 4 张卡片数字不变**（仍按全部条目算，含未超时的）；点〔IN〕今天来访 / 等 KR 回复、〔KR〕今天到院·到店 / 等待报告 → 待办栏改显示那份名单：标题「今天来访 4（参考）✕」（`todoRefMode`）、整份灰色（`.is-ref`）、已超时的几条仍红字，按 ✕ 回到待办；待我处理 / 新消息点了照旧筛选待办。**我的判断（未经确认）**：KR 的「等待报告」卡也一样当参考名单处理（任务页只写了今天来访 / 等 KR 回复 / 今天到院·到店，等待报告原来对应的就是等院长上传面诊这类等待中的条目）。

## CMD-1015-09 补充（2026-10-15，追加；旧文字保留作历史）
- 基准 **313825a**，单独一个提交，**未推送**，不带开关，数据版本不变（44）。依据 Notion「Notification Center」总表（IN-01～23 / KR-01～14 / DR-01～03）。
- **弹窗两种新写法**（通知对象上的 `n.popup`，`pushNotif` / `pushKrNotif` 的 `opts.popup`；`notifTodoKind` 认）：`'once'` = 弹一次、几秒后自动收起（客人自助预约 IN-15 / 占位客人填完资料 IN-16，**只有预约日期 = 今天才带**，其他日子不弹只进铃铛；`submitSelfBooking`）；`'confirm'` = 弹出并停留、手动［确认］、不是紧急（没有彩色图标）——设定更新 IN-23（`saveClinicSettings`，文案加「，日期 起生效」）和 KR-14（`kr.js` `krSettingsNotif`：医院设定保存 + 特殊日子改动，通知该医院所有室长，操作人自己不收）。**没上线的人下次上线要弹**：`toastNewNotifs` / `krToastNew` 第一次调用时，已有通知只登记不补弹，**例外**是 `popup:'confirm'` 且没按过［确认］的（`showToast` 新增 `opts.onOk`，确认 = 标已读，`notifMarkRead` / `krMarkNotifRead`）。其他通知离线仍不补弹。
- **点了去哪**：IN-08 待收款 → 待付款结算单所在 tab（有赴韩项目 = 赴韩施术计划 `kr`，只有本地 = 本地管理 `localmgmt`）并滚到 `#settle-card-批次`（`todoPayGo`；`settlementCardHtml` 加了这个 id，结算 tab 一次只显示一张，目标不在当前可见那张时不滚动）；IN-11 → 客户详情并滚到持有块；IN-12 → 工作台日历日视图（`todoGoPlaceholder`）；IN-17 客人改约 / 取消 → 预约历史记录（通知 `link:{kind:'resvHistory'}`，`openNotif` 新增分支；文案也改成总表写法：`客人改约：X 原 … → 新 …`、`X 取消了 … 的预约`，`NOTIF_INFO_RE` 同步）。
- 原型里没有 KR-09（今日院长日程未确认）的产生处（`TODO_CAT.dayconf` 只是个遗留映射，不产生待办），确认已废弃。**与总表不一致的清单写在 Notion CMD-1015-09 汇报里**（未改，等用户决定）。

## CMD-1015-11 补充（2026-10-15，追加；旧文字保留作历史）
- 基准 **592012e**，单独一个提交，**未推送**；只动测试工具，不改业务功能，不升级数据版本（44）。**演示时间**（测试覆盖页新增卡片「演示时间」，`coverage.js` `fillDemoTime`）：以**韩国时间**设开始时间，按［设定并开始］后原型时间从那一刻**照常往前走**；另设「到真实时间（韩国时间）自动恢复」，留空 = 不自动恢复；［立刻恢复真实时间］。存 `localStorage.gmc_cfg_demotime`（`{startUtc, setAt, restoreUtc, startKr, restoreKr}`，`gmc_cfg_` 前缀：同一浏览器所有分页立即生效、刷新不掉、重置演示数据 / 升级不清）。实现：`rules.js` `realNow()` = `Date.now() + demoClockShiftMs() + DEMO_SHIFT_MS`，`demoClockShiftMs()` = `startUtc − setAt`（到恢复点后为 0）；**和［模拟到隔天］等 `DEMO_SHIFT_MS` 拨时钟按钮叠加**，状态栏会写出叠加的小时数。所有「现在」的判断（`demoNow()` / `nowFullDt()` / `todayStr()` / 日历现在线 / 可约时段 / 超时判断）本来就走 `realNow()`，所以不用逐处改；仍直接用 `Date.now()` 的只有占位倒计时、对话消息等不看日期的地方。右上时钟旁标「演示时间」小标（`dashClockHtml()` + `.demo-time-tag`，演示时间或拨时钟按钮生效时都会标）。注意：恢复点一到，时间会从演示时间直接跳回真实时间（中间产生的记录时间戳不会改）。
- 这次设定：韩国时间 2026-10-15 12:00（= 印尼 10:00）起走，真实 2026-10-16 00:00（韩国）自动恢复。

## CMD-1015-12 补充（2026-10-15，追加；旧文字保留作历史）
- 基准 **2fd8c30**，单独一个提交，**未推送**，不带开关，数据版本不变（44）。bug：KR 工作台 / 日历点施术块（或术后到店块）进到子案件单独页（`kr-subcase`），和从案件管理进的主案件详情不一致。修法：新增 `krOpenSubCard(clinicId, caseId, subId)`（kr.js）——打开**主案件详情的施术 tab**（`krShowCase` + `krSetCaseTab('proc')`），`KR_SUB_HL` 记下要高亮的子案件，`krSubEntriesCard` 里该行带 `id="kr-subrow-子案件id"` 和 `.kr-sub-hl` 高亮样式，打开后 `scrollIntoView` 到看得见；`subId` 省略 = 施术子案件。改了的入口：日历块（施术 / 术后管理 / 持有使用，`kr.js` 日历块 click）、工作台「今天到院 / 术后」列表（`kr.js` 两处 `krOpenSurgSub` / `krOpenSub`）、待办「今天到院 / 到店」（`todo.js`）。子案件的操作仍从卡片点进去（`krOpenSub` → `kr-subcase`）；`krShowCase` 会清掉高亮。**仍直接打开子案件单独页的入口**（未改，留给子案件改版）：① 主案件施术 tab 的子案件卡片（`krSubEntriesCard`，这是预期入口）；② 通知点击：评估 / 待付款 / 尾款 / 无法施术 / 更换项目 / 已到医院类通知（`krOpenNotif` → `krOpenSurgSub`）；③ 医院设定「不能改：已有排好的安排」弹窗里点案件（`hspGoCase`）；④ `krOpenSub` 被卡片和上面两处共用；⑤ `krOpenSurgSub` 自身（只剩通知、`hspGoCase` 调用）。

## CMD-1015-13 补充（2026-10-15，追加；旧文字保留作历史）
- **四个测试开关已收掉**（新结案规则 / 新待办·通知 / 日历对齐 + 新待办 10/14 / 新样式）：保留「开」的逻辑，删掉「关」时的旧程序和旧样式；`newCloseOn` / `newTodoOn` / `newCalOn` / `DS_NEW` 不存在了，浏览器里的 `gmc_cfg_newclose|newtodo|newcal|newstyle` 启动时清掉、不再读取。**新写代码不要再加开关判断。** 基准 74e3676；提交 8ec4c80（新结案）/ fc0a101（新待办通知）/ 4730460（日历对齐）/ cb248dc（新样式），均未推送，数据版本不变（44）。`mainlineOngoing` 现在就是原来的「新」版；原来的旧版改名 `mainlineOngoingRepair`，只给 `repairWronglyClosedCases` 用。
- `app.css` 里的旧色值仍靠 `dstyle.js` 运行时映射成语义变量（静态改写不在这次范围）。
- **遗留弹窗清理**：删了 本地项目退款弹窗（`openHoldingRefundByIdx` / `openHoldingRefundModal` / `closeHoldingRefundModal` / `confirmHoldingRefund` / `HOLDING_REFUND_CTX` + in.html `holding-refund-overlay`）、主线完成（`krMainFinishBtn` / `krMainFinish` / `mainFinishInfo` / `coreMainFinish`）。**保留并列入汇报**：请 IN 帮忙预约（`openSubBookModal` 等，界面已无入口但 selftest 仍有用例）、report-overlay 壳、peek-overlay / 案件信息抽屉、`krHuOpen` 一组（selftest / store.js 仍引用）。

## CMD-1015-15 补充（2026-10-16，追加；旧文字保留作历史）
- 基准 **21cdc31**，单个提交，**未推送**，不带开关，数据版本不变（44）。第 2 轮修正 9 项：
- **1 视频来电只通知被叫的室长**：`callTargets(cc, participants)`（data.js）算被叫人短名（呼叫名单里选了的 KR 室长 → 没选则负责该案件的 `krCoordinator` → 他今天整天 OFF 则当天上班的室长），写进来电信号 `sig.to`；`krCallRelevant` 只让 `sig.to` 里的室长响铃，**院长 / 代表院长一律不响**；`recordMissedCall` 只给被叫室长记一条指名的未接来电（`only`），不再有给院长的 `kmd_` 那条。旧信号没有 `to` 时仍给全体室长。
- **2 院长工作台 4 张卡**（`todoKrDirCardsHtml`，kr.js `krRenderDashboard` 的院长分支）：待面诊（`upload` 待办改 cat `dconsult`，点了筛选待办）/ 待施术（新待办 `dsurg`：自己负责的全部已确认 / 已到院施术，`ref` 参考名单，点了待办栏显示灰色名单，分「今天 / 之后」`todoGroupOf` 返回 0/1/2）/ 恢复确认（占位，写「即将推出」、不可点，`todoCatCardsHtml` 里 key `soon`）/ 新消息。`TODO_REF_CATS` 加 `dsurg`。
- **3 院长上传面诊后 KR 室长有提醒（bug）**：原因是通知文字「…上传了面诊内容，面诊结束：…→ 请发送诊疗方案」没被 `notifTodoKind` 的正则认成待办类，归成「消息」所以不弹；正则加了「请发送诊疗方案」。「发送诊疗方案」待办本来就有（`send`）。
- **4 安排术后管理入口**：`krPcbNeed(c)`（尾款已付 + 没约完 + 有术后管理项目）；项目 tab「术后项目」卡和施术 tab（Confirmed / Arrived）都加［安排术后管理］（`krPcbNeedBar` / `krPcbNeedCard`），调原来的 `krPcbOpen()` 小窗口；约完 / 没付尾款不显示。
- **5～8 IN**：「查看相关案例」移到每行最后（`localProjRowHtml`、赴韩项目行）；`setProjectOrigin('KR')` 把 `CASE_DISPLAY_CCY_KR` 重置成 `'KRW'`；赴韩施术 tab 的［已转告客人］［确认无变动］卡片按完就消失（`calRelayRecheckCards`，记录仍进 Timeline，KR 那边「日程确认」读 `c.recheck` 不变）；［打印］`printKrPlan` 先开预览窗口，顶部工具条［确认打印］［关闭］（打印时工具条隐藏），不再自动打印。
- **9 尾款 IN 看得到**：`viewerTextFilter` 不再把「尾款 ₩xx」改成「已付清」；结算单卡片、结算汇总行（`settlementSummaryHtml`）、结算 tab 顶部（`settleTabTopHtml`）、付款弹窗、待付款批次一行都显示尾款金额（项目合计 − 定金，在韩加项不计入）；赴韩施术计划「确认赴韩项目」卡下加一行「项目合计 / 定金 / 尾款」（`krPlanMoneyLine`）。选项目那处原来就有。**在韩加项金额 IN 仍看不到**。
- 顺手修 S39 过期正则（取消通知文字改成「X 取消了 … 的预约」）；`selftest.js` 新增 R15a（来电）/ R15b（院长 4 卡，KD1 / KO1 分页）/ R15c（上传面诊通知 + 安排术后管理，KM1 分页）/ R15d（IN 五项）。
- **测试教训**：`ST.cleanup` 还原的是「`ST.begin` 拍快照那一刻」的存档，所以**跑 `ST.ensureFixtures` 之前要先 `ST.begin()`**（或直接用 `ST.runAll`，它会先拍快照），否则夹具会被快照带进「还原后」的数据里。

## CMD-1015-16 补充（2026-10-16，追加；取代 CMD-1013-03「共同术后管理」和 CMD-1015-05「补加可选项目可勾共同术后管理」的部分，旧文字保留作历史）
- 基准 **d536c90**，单个提交，**未推送**，不带开关。**数据版本 44 → 45**（`store.js` `MIGRATIONS` 加 `to:45`；用户案件照 CMD-1012-09 规则保留并迁移）。
- **拿掉共同术后管理**：KR 发送诊疗方案 / 补加里的蓝色块、适用项目勾选、至少勾 2 项的校验、`krCommonBlock` / `krCommonEntries` / `krScopeCommons` / `krAddJoin` / `krAddCmApply` / `krPcRowHtml` / `commonCareOf` 全部删除；`rules.js` 的 `pcUniqueEntries` 不再按 `cid` 去重，推荐项目整理（IN 选项目 / 赴韩施术计划 / 打印 / 诊疗方案）不再有「共同术后管理」段。每个施术项目的「所需术后管理」不动。**旧案件**：迁移 45 把带 `cid` 的条目只留在第一个适用项目上（原来排程 / 转持有就只算一份），其余项目里的副本去掉，`cid` / `applies` 清掉（可选范围、已选项目、待选项目三处各自处理），迁移备注写明案件号和去掉几条。
- **可选范围分［施术项目］［管理项目］**（kr.js，`KR_SUB.tab` / `KR_SUB.mg`，`krSubBlank()` 统一初始化）：管理项目 = KR 本地管理项目库（`krLocalLib`，12 类、韩元、付费）；勾选后填 项目（规格）｜次数｜间隔（1 次不记间隔），面议项目要手填单价；只在韩国做、不选地点。条目存进 `krScope.items`：`{name:'项目 · 规格', price:单价×次数, mgmt:true, localId, specId, specLabel, unit, qty, interval, note}`；`krMgScopeItem(p, st, note)` 生成。发送条件至少勾 1 项（施术或管理都算）；推荐项目整理里「管理项目」单独一段（`recSummaryData` 的 `mgmt`，不算推荐在韩天数）。**［补加可选项目］** 用同一套表单（`krAddCardHtml` 分施术 / 管理两个 tab，管理项目可再补加其他规格），拿掉「是否要做共同术后管理」。
- **IN 选项目**：赴韩项目里多一组「管理项目」（`scopeMgmtRowsHtml`，来自 KR 可选范围）；勾选 → `toggleProject('lc:本地项目id:规格id')` 进已选（`origin:'KR'`、`local:true`、`mgmt:true`、`mgmtPlan:true`、`qty`、`interval`，`isLocalKrItem` 认得）；**定金 = 全部赴韩项目（施术 + 管理）× 30%**（`computeBatchBreakdown` 本来就按所有 origin KR 项目算，这次只是改文案），其余为尾款。
- **KR 到院后**：管理项目计划（`mgmtPlan`）在 `syncSurgerySub` 里各生成一行进程（kind「增加项目」+ `mgmtPlan:true`），今日项目里和施术一样勾选标完成（`coreSubDone` 增加项目行认 `mgmtPlan`；**施术行标完成不再带上管理项目**）；没做完点「是，结案」→ `coreFinishToday` 转在韩持有（`heldOver`，剩余次数 = `qty`），对应进程行拿掉（持有项目卡里显示）。管理项目不占院长施术时间（`surgeryMinutes` 跳过 `mgmtPlan`）。
- **IN 付完定金后拿掉「确认赴韩项目」的［+ 追加项目］**：`krAddMoreHtml` / `addMoreProjects` 删除；要加赴韩项目请在对话里跟 KR 说，由 KR 到院当天添加（在韩加项）；本地项目仍用右上角［+ 添加本地管理］。
- 我的判断（未经确认）：管理项目的「次数」按「同一规格买几次」算（价格 = 规格单价 × 次数）；只有管理项目、没有施术项目时，施术行写管理项目名（保证还能走施术日期流程）。
- 测试：`selftest.js` 新增 R16a（IN 选项目 + 定金 + 无追加 + 标完成 / 转持有）、R16b（KR 表单，KM1 分页）、R16c（迁移 45）；D20 的「追加项目」改成直接置 `c.addingMore`（追加入口已拿掉）。`store.js` 暴露 `window.GMC_MIGRATIONS` 供 R16c 用。**CAL2 / CAL6 会被前面用例在 D(40) 留下的 OFF 影响**（KM1 分页连跑时先清掉 `HOSPITAL_DATA[h].offs` 里 D(40) 那天的条目再跑）。

## CMD-1015-17 补充（2026-10-16，追加；旧文字保留作历史）
- 基准 **7bc6d2f**，提交 cebe393（1/5 数据结构 + 子案件并入施术 tab）、3f0aece（2/5 案件列表 / Timeline / KR 财务 / 删遗留）、本提交（3/5 测试 + 文档）；**未推送**，不带开关；**数据版本 45 → 46**（保留用户案件，`MIGRATIONS` to:46 + `migrateCareHoldings`：旧术后管理持有批次转回原案件 IN 行、管理项目转在韩持有、补 `surgeryDoneAt`）。
- **阶段**：新增「术后管理」（`c.stage==='postcare'`：施术完成且有术后管理）和「在韩管理」（`krmgmt`，KR 占位预约案件）；没有术后管理施术做完直接结案；施术当天不再有［是，结案］。韩国 + 印尼都做完才结案；［结束术后管理］（`coreEndPostcare`，原因必填，仅 IN）= 结案，没做的不作废：印尼的在客户详情 / 本地管理「使用持有项目」里列出（免费、不能退款），韩国的转在韩持有。
- **术后管理不是持有项目**：留在原案件的 `subItems`（`kind:'术后管理记录'`，`place` KR / IN）；IN 在案件里［做术后管理］（`coreCareVisit`，提前做原因必填并通知 KR，延后标红 + IN / KR 待办）；付费管理项目付清尾款后就是在韩持有（`heldOver`，KR 按［使用］`coreMgmtUse` 扣次数，［预约后续到院］走 `krHuOpen`），结案不等持有用完；IN 看得到在韩持有（项目 + 剩余次数，不显示金额）。
- **子案件**：每次新预约的到院一个，同一天同一地点合并（`subCaseKey` / `subCaseList` / `subCaseNo`，编号 -1 -2…）；施术当天 = 主案件；子案件不再是单独页面（`kr-subcase` 页和 `krOpenSub` 删除），在施术 tab 卡片里展开（IN `inPostcareCardHtml`，KR `krSubCasesCard`）；Timeline 分页 全部｜主案件｜-1｜-2（`setTlPage` / `krSetTlPage`）。
- **案件列表**（IN 10 列 / KR 11 列保留来源诊所）：Case ID 加 ▼（`caseRowToggle` / `krRowToggle`）展开子案件，新增「开始时间」（`caseStartKey` / `caseStartText`），KR 财务栏只显示 KR 看得到的（`krFinanceHtml`）；tab 新增「术后管理」「在韩管理」；KR 施术 tab 第一张卡「施术预约」一行；KR 客人管理阶段规则 `krCliStageProc`；经营数据按施术完成日（`bizCaseMonth` 用 `surgeryDoneAt`）。
- **删除遗留**（CMD-1015-13 保留的）：请 IN 帮忙预约整组（`openSubBookModal` / `coreSubInform` / `krSubInform` / `askIn` / 工作台待预约卡）、旧诊疗方案弹窗壳 `report-overlay`、案件信息抽屉 `peek-overlay`。仍保留：`krHuOpen` 一组（现在是［预约后续到院］）。
- **测试**：selftest 新增 R17a（阶段 / 提前原因 / 结案 / 子案件合并）、R17b（KM1：无子案件页）、R17c（迁移 46）；改了 D18/D19/D23/F4/R16a/TDK1/CAL2，删 E7c/E7d。**R17a 要先 `ST.begin()` 再建案件；KR 分页别跑 IN 的案件用例（会报 style 为空）**。roletest 9 个账号（OWN/A1/A2/B1/KO1/KM1/KC1/KD1/KM2）全部 0 不符。
- 我的判断（待确认）：［结束术后管理］只有 IN 有；只有管理项目的案件，施术行写管理项目名；KR 持有项目的［预约后续到院］沿用 `krHuOpen`。

## CMD-1015-18 补充（2026-10-16，追加；旧文字保留作历史）
- 基准 **aa8e977**，提交 9acb08a（1/2 代码）+ 本提交（2/2 文档）；**未推送**，不带开关；**数据版本不变（46）**，没有改资料结构（新增可空字段 / 行字段 `projectName` 在术后管理行上记所属施术项目，旧行没有就归「其他术后管理」）。
- **KR 案件页 tab**：基础资料｜面诊｜**项目**｜附件｜Timeline（关联案件有往前关联才出现）；「施术」tab 删除，`krSetCaseTab('proc')` 与旧入口一律映射到 `items`。项目 tab = `krTabItems(c)` = **项目卡**（`krProjCards`：施术项目（N）｜管理项目（N）两页，`KR_PROJ_PAGE` / `krProjPage`；术后管理按 `projectName` 放在各自施术项目下，其余归「其他术后管理」；管理项目 = `krIsMgmtItem`（`mgmtPlan` / `service` / 本地管理项目），显示「待付款」/「剩余 x / n 次」/ 서비스「赠送 · 即时」/「已用完」）+ **案件**（原 `krTabProc`：主案件 + `krSubCasesCard` 子案件；到店后主案件不再显示 `krSurgHead` 预约栏；赴韩项目重复列表已拿掉）。用词一律「施术项目」。
- **子案件整张卡**（`krSubCasesCard`）：到店前显示预约时间 +［客人到店］（`krSubVisitArrive` → `coreVisitArrive`，没到当天灰 +［模拟到当日］）；到店后不再显示预约栏，出现「这次要做的项目（从项目卡里选）」：这次的术后管理（默认勾）+ 有剩余次数的持有管理项目（勾 = 扣 1 次）+［已完成］（`krSubVisitDone` → `coreVisitDone`）。
- **在韩加的管理项目**：`holdLocalAdd(c, it)`——付完款（`coreAddOnPaid` / 付尾款 `coreSettleBalance` 里 `mgmtPlan` 或本地管理项目）即 `heldOver`，进程里的「增加项目」行拿掉；서비스 加入时即时进持有（`coreAddOnItem` svc）；付款前显示待付款。
- **IN 约术后管理默认接续**：`resumeBannerHtml`——来访目的 = 术后管理且客人有 `stage==='postcare'` 的案件 → 排最前、高亮「✓ 默认」+ 大号［接续］，标题改「已默认接续到术后管理阶段的案件」，仍有［继续新案件］。术后管理类通知 / IN 待办（过建议日期）点进来 → `goPostcareBlock(caseId)`（案件「赴韩施术计划」tab，滚到 `#in-postcare-card`）；新标签页参数 `?tab=kr&pc=1`。**通知核对**：结案通知只在 `finishCase`（术后管理全部做完 / ［结束术后管理］）发一次；「术后管理转回印尼持有」通知已不存在。
- **一键准备**：新增 `pcStage`（术后管理阶段，韩国 1 + 回印尼 2 未做）、`heldMg`（已付清尾款 + 在韩持有管理项目剩 3 次）；`r2_09`（Wati）改成 `pcStage`；`c42` 改成「赴韩已结案 + 回印尼术后管理 3 次没做」（`postcareEnded` + IN 待做行，留在原案件）；其余全部复核可建。**测试覆盖页**新增 I 组（I1～I9，术后管理阶段 / 子案件 / 结束术后管理 / 再来开新案件 / 在韩管理 / ［使用］/ ▼ 与 Timeline 分页（I9 只能手动））。
- **测试**：selftest 新增 R18a（默认接续 + 通知）、R18b（在韩加管理项目 → 持有 → 子案件整张卡）、R18c（KM1：tab、各入口展开）；A1 全套无真实失败，roletest 9 个账号 0 不符。**BK3 / S37 等换账号用例仍要在对应分页跑；CAL2 要先 `nav('kr-dashboard')`**。

## CMD-1015-19 补充（2026-10-16，追加；旧文字保留作历史）
- 基准 **1abba58**，提交见 Notion 汇报；**未推送**，不带开关；数据版本不变（46），新增可空字段：行 `skipped`（这次到访里取消勾选）/ `visitKey`（这次到访里新增的增加项目行）、案件 `c.visits[key]={confirmed,at,by}`（`key` = `place|日期`）。
- **统一案件卡表格**（kr.js `krTblHead` / `krTblRow` / `krTblWrap`，外包横向滚动）：时间（26-10-24 12:00）｜项目类型（施术 / 术后管理 / 管理项目，三色标签 `KR_TYPE_STYLE`）｜内容｜状态（待做 / 已到店 / 待付款 / 已完成 + 行内［已完成］）｜地点｜完成时间｜备注 + 行尾［改时间］［备注］［修正］。**取代**子案件展开后散放的内容和主案件的「今日项目」表。类型由 `krRowType` 判断（`施术` / `holdUseOf` 或本地增加项目 = 管理项目 / 其余术后管理）。
- **主案件卡**（`krProgressBlock`）：抬头「主案件 · 编号 + 待到院 / 已到院 / 已完成」，行 = 施术 + 在韩增加 + 在韩持有的管理项目（剩余 N 次，［使用］扣 1 次、［预约后续到院］）；每行［已完成］= `krTodayDoneOne` → `coreTodayDone`（原来的勾选 + 全选 + 批量按钮拿掉）。
- **子案件卡**（`krSubCasesCard`）：术后管理排好预约后按日期自动出现（`subCaseList`，同天同地点一个，已有）；抬头 编号 + 时间 + 待到店 / 已到店 / 已完成（`coreVisitState`）。待到店：表格显示预约好的项目 +［客人到店］（没到当天灰 +［模拟到当日（演示用）］）；已到店未确认：表格 +「① 确认这次要做的项目（可取消勾选，取消的 `skipped`，留在项目卡待做）② 是否增加项目（从项目卡选未做的术后管理 = 提前到这次、有剩余次数的管理项目 = 这次使用；或新增施术 / 管理项目［加入］）」+［确认］（`coreVisitConfirm`，至少要做一项，先检查再改）；确认后逐行［已完成］（术后管理 / 使用行 → `coreSubDone`，管理项目扣 1 次）。新增的项目先待付款（`coreVisitAddItem` → `coreAddOnItem`，行带 `visitKey`），付款后（`coreAddOnPaid` → `holdLocalAdd`）施术项目照常完成；管理项目变成这次到访里的一行「使用」。
- 取消勾选 / 拉进来的行不会丢：`careRows` 仍把它们算未做，案件不会结案，项目卡里还看得到。
- 测试：selftest 新增 R19a（IN：自动建子案件、到店、确认、拉进来、增加施术 + 管理项目、逐行完成）、R19b（KM1：表格表头 / 抬头 / 标签）；R18b 改成新流程。roletest 9 个账号 0 不符。

## CMD-1015-20 补充（2026-10-16，追加；取代 CMD-1015-19 里「到店后确认 / 是否增加项目」面板，旧文字保留作历史）
- 基准 **3a0af00**，单个提交（见 Notion 汇报），**未推送**，不带开关，数据版本不变（46）；新增可空字段：行 `src`（`care` 术后预约 / `use` 管理预约）、`surgUse`（施术项目预约使用的行）、持有项目 `uses`（每次使用 `{at, key, rowId}`）。
- **项目卡**（kr.js `krProjCards`）右上角［增加项目］（展开原 `krAddOnCard` 选择卡，主案件的增减项目方式不变）；分页「施术项目｜术后管理｜管理项目」（`KR_PROJ_PAGE`：surg / care / mgmt）。每页分段：施术 / 管理 = 未使用（项目｜类型｜次数｜购买时间｜［本次使用］［预约使用］）→ 已预约（［修改时间］）→ 已完成 / 已使用（管理项目一次一行；［查看案件］`krViewCase` 滚到对应子案件 / 主案件）；施术另有「已取消」收起；术后管理 = 未预约（［预约时间］）→ 已预约 → 已完成，行内写「对应施术：xx」（术后管理从施术项目下面搬出来）；待付款项目次数旁标红「待付款」，两个按钮灰。
- **［本次使用］**（`krUnitUseNow` → `coreUnitUseNow`）：目标 `coreUseTarget` = 客人已到店的子案件，否则主案件（已到院、施术没做完）；没有目标 = 灰色。主案件 = 直接扣 1 次（`coreMgmtUse`，记 `uses`）；子案件 = 加一行「使用」（`holdUseOf`，到店状态）逐行完成时扣。**［预约使用］/［预约时间］**（`krBkdOpen` / `krBkdSave`）：日期 + 时间（施术加选院长，术后管理可选韩国 / 印尼），冲突检查同 `krHuSave`，按日期建立 / 并入子案件（`coreUnitBookUse` / `coreCareBook`）。
- **术后管理单元**（data.js `careUnits`）：已有行 + 还没预约的名额（所需术后管理次数 − 已有行；旧行没有 `projectName` 的按顺序补）；表里行［取消本次］（`coreRowCancel`）：术后管理行 `skipped`（退回未预约，项目卡里［预约时间］重新预约沿用这一行），使用 / 预约使用行直接删除（退回未使用）。
- **子案件**：抬头加「预约来源：术后预约 / 管理预约」（`visitSource`：组里有术后管理预约行 = 术后预约，否则 = 管理预约）；拿掉 19 的「确认 / 是否增加项目」面板和 `coreVisitConfirm` / `coreVisitAddItem`（`coreVisitExtra` 只给旧数据用）；到店后行直接可［已完成］，加项目一律走项目卡［本次使用］。案件卡表格、逐行完成、子案件自动建立照 19。
- 测试：selftest 新增 R20a（术后管理预约时间 → 术后预约 → 取消本次 → 重新预约 → 管理项目待付款不能用 → 预约使用 → 管理预约 → 到店 → 完成扣次数 → 目标）；R18b 改走［本次使用］；R19a 删除（被 R20a 取代）。roletest 9 个账号 0 不符。

## CMD-1015-21 补充（2026-10-16，追加；旧文字保留作历史）
- 基准 **50ebae9**，单个提交，**未推送**，不带开关，数据版本不变（46），没有改资料结构（新增可空字段：术后管理 / 预约使用行 `director`，只有「施术项目预约使用」选了院长才写）。
- **重叠原因**（Ayu）：`surgeryMinutes(c)` 只排除了 `it.mgmtPlan`（诊疗方案里的管理项目），**在韩增加的本地管理项目 / 서비스没排除**，而且本地项目库每个项目都有 `durMin`（30 分钟起）→ 每加一个管理项目施术块就被拉长 30 分钟，`syncSurgeryBlock` 直接按新时长重画块，**没有任何冲突检查**；块里列的项目名（日历 / 工作台 / 待办）也直接取 `krActiveItems`，所以把美版超声刀等管理项目一起列了出来。
- **修法**：① `surgeryMinutes(c, extra, drop)` 只算施术项目（`krIsMgmtItemC` 排除管理项目 / 서비스 / 本地项目），日历块 / 待办 / KR 工作台列表只列施术项目（KR 医院层日历 / 约满按块算，自然不再占管理项目时间）② 新增 `directorClashList(hid, 院长, 日期, 起, 止, 选项)`（施术 / 面诊 / 预约 / 不可预约 / OFF / 指定了院长的术后管理行，列出撞到的每一件）+ `clashLines`；`krBusySlotError`（标 / 改不可预约）、`krSurgerySlotError`（排 / 改施术、面诊、术后管理、预约使用）、`krcAddOff`（标 OFF）都改成查全部种类 ③ `coreProjectedConflict(c, 加, 减)`：在韩增加施术项目（`coreAddOnItem`）、更换（`coreSwapItem`、`coreCannotReplace`、到院调整方案 `krDoSettle`）会拉长施术块 → 先预估新时长，撞到就拒绝并把说明写在 `KR_LAST_CONFLICT`，**拒绝发生在改任何数据之前** ④ `krMut` 读到 `KR_LAST_CONFLICT` → `krBlock(msg)` Modal（挡住类，只有［知道了］，列出撞到哪一件、请先调整时间再加）；原来 KR 端排 / 改时间、标不可预约 / OFF 的 `alert` 一律改成同一个 Modal ⑤ 已经重叠的（旧数据）：KR 日历 `krcBlockHtml` 对两个块都标红框 +「⚠ 时间冲突」+ 悬停说明（`krcBlockConflict`），不自动改动任何一方（旧块的时长要等下次同步才重算）。
- **我的判断（未经确认）**：术后管理 / 子案件行只有指定了院长（施术项目预约使用选的院长）才占院长时间，其余术后管理（没指定院长）不占——按现有数据它们没有院长字段；日历上它们仍画在案件的院长栏下但不参与冲突检查。
- 测试：selftest 新增 R21a（A1：在韩增加施术撞不可预约被挡、管理项目照加且不占时长、块只按施术项目、标不可预约 / OFF / 排施术撞到被挡）、R21b（KM1：已重叠两块红框、不自动改、Modal 只有［知道了］）。roletest 9 个账号 0 不符。

## CMD-1015-22 补充（2026-10-16，追加；取代 CMD-1015-21「冲突挡住 Modal」、CMD-1015-19 的案件区块排法，旧文字保留作历史）
- 基准 **767f66e**，单个提交（见 Notion 汇报），**未推送**，不带开关，数据版本不变（46）；新增可空字段：项目 `consentPending`（麻醉同意书待确认）/ `deferUse`（冲突时选［不在这个时段］，不占施术时段）、行 `skipped` + `postponed`、案件 `visitEnds[key]`（全部延期结案的子案件）/ `visitPostponed[key]`（延期当时的快照）。
- **所需术后管理一项一框**（`krProjDetailHtml`，增加项目 / 发送诊疗方案 / 补加可选项目共用）：框里 类型｜项目｜次数｜间隔｜在哪做｜第几天起（+ 自动日子）｜印尼对应项目｜移除，每格带小标题，宽度不够框内换行，框与框之间 10px 间隔。**增加项目**底下的术后管理勾选清单（`KR_AD.care` / `krAdCare`）已拿掉。
- **增加项目 = 选项目 → 确认 → 付款 → 麻醉同意书**：选项目画面不再有「已在现场签署」勾选；睡眠 / 全麻项目加进来标 `consentPending`，付款后（`anesPendingItems`）出现红条（`krAnesBanner`）+ 自动弹窗（`krAnesPrompt`，每次 `krMut` 后检查，`KR_ANES_ASKED` 防重复）→［已在现场签署］`coreAnesConfirm` 才写同意书记录，**确认之前不能完成该项目**（`coreSubDone` 拦、行状态「待确认麻醉同意书」）。
- **时间冲突改询问**（`krAskClash` / `krSlotAsk`，`KR_HARD_ERR` 里的休诊 / 营业时间仍用 `krBlock` 只有［知道了］）：「时间冲突 …… 仍要这样排吗？」［仍然进行］= 重跑一次并设 `KR_FORCE_CLASH`（`krSurgerySlotError` / `krBusySlotError` / `coreProjectedConflict` 跳过冲突类）→ 照排，日历红框；［不在这个时段］= 排 / 改时间类只是关掉重选；**在韩增加施术项目**类（`KR_CONFLICT_KIND==='add'`）= `KR_DEFER_ADD` 重跑 → 项目照加但 `deferUse`（不占院长时间、不建今日行），放在项目卡「未使用」稍后预约；标不可预约 / OFF 冲突只有［仍然进行］［取消］。核心函数仍是「先查后改」。
- **案件区块分三组**（kr.js `krCaseCards` / `krCaseCardHtml` / `krCaseGroupsHtml`，取代主案件表 + 子案件列表）：**今日案件**（主案件抬头「【主案件】编号 + 时间」，右边［客人已到医院］；子案件当天或已到店，右边［客人到店］）/ **预约案件**（抬头「编号〔日期 时间 预约〕」+ 预约来源；主案件也可提前［客人已到医院］）/ **完成案件**（抬头「〔日期 时间 结束〕」；全部延期的写「〔全部延期〕」）。行 = 项目类型（施术项目 / 术后管理 / 管理项目）｜内容｜地点｜状态｜备注｜操作（`krTblRow`，`mode` today / booked / done）：今日 = 备注直接输入 + ［操作完成］［修改时间］；预约 = ［修改时间］［备注］；完成 = 只读。表里没有时间 / 完成时间栏（完成时间继续记在 Timeline）。主案件今日卡里到院评估 / 尾款的向导（`krSurgeryFlowHtml`）照旧，付清尾款后是同样的行表 + 持有管理项目行 + 项目进程 memo。
- **［修改时间］无限延期**（`krTimeEditRender` 勾选 → `coreRowPostpone`）：术后管理行 `skipped` 退回项目卡「未预约」，使用 / 预约使用行同样标 `skipped` 退回「未使用」（`holdItemPlanned` 不再算它们）；预约案件里的项目全部延期且没有已完成的 → `visitEnds[key]`（子案件结案，移到完成案件，抬头「全部延期」，行取 `visitPostponed` 快照）；子案件编号 `subCaseNums` 让出被结案那张的号（不顶替）；重新预约（`coreCareBook` / `coreUnitBookUse`）回到新日期的预约案件，旧的「全部延期」卡留作记录。
- 测试：selftest 新增 R22a（A1：无限延期 / 全部延期 / 重新预约 / 睡眠麻醉 → 付款 → 同意书 / 冲突询问两个分支）、R22b（KM1：三组 + 表头 + 一项一框 + 询问弹窗两个按钮）；R19b 删除（被 R22b 取代）；roletest 9 个账号 0 不符。

## CMD-1015-23 补充（2026-10-16，追加；取代 CMD-1015-22 里「项目 tab 内的麻醉同意书红条 / 未付款条」，旧文字保留作历史）
- 基准 **8a05b3b**，单个提交，**未推送**，不带开关，不升级数据版本（46）。
- **KR 案件页最上面的红色提醒条**（kr.js `krTopAlerts`，`krRenderCaseDetail` 里放在页头卡和 tab 之间，任何 tab 都显示，只在 KR 端）：① 「⚠ 待付款」＋「在韩增加 N 项未付款：项目（合计 ₩…）」＋［去付款］（`krPayOpen` 弹出明细 →［确认已付款］`krPayConfirm` → `krDoAddOnPaid`）；② 「⚠ 待确认麻醉同意书」＋「项目（睡眠 / 全麻）尚未确认麻醉同意书」＋［确认］（`krAnesOpen` → ［已在现场签署］`krAnesConfirm`）。两件都有叠放（待付款在上），处理完下次重画自动消失；院长看得到条，但没有按钮（`krCan()`）。
- **拿掉重复提醒**：`krUnpaidBanner` 现在返回空（项目 tab / 主案件 / 向导里的「未付款」红条拿掉）；项目 tab 里的 `krAnesBanner` 删除；付款后自动弹出的麻醉同意书弹窗也去掉（`krAnesPrompt` 只是 `krAnesOpen` 的别名，只有点［确认］才弹）。
- **未处理前项目照旧不能完成**：待付款项目行状态「待付款」、［操作完成］灰；`coreSubDone` 对 `consentPending` 项目仍拒绝（行状态「待确认麻醉同意书」）。
- 测试：selftest 新增 R23a（A1：造 1 个睡眠麻醉施术 + 1 个管理项目待付款）、R23b（KM1：基础资料 / 项目 / Timeline 都有「待付款」条且位置在页头下 tab 上 → 项目 tab 没有重复条 → ［去付款］ → 变成「待确认麻醉同意书」条 → 确认前不能完成 → ［确认］ → 条消失）。roletest 9 个账号 0 不符。**roletest / selftest 换账号跑之前先 `ST.cleanup()` 并清掉 `gmc_cfg_stfix`**（上一个账号中途出错没清理，会让下一个账号找不到「等待确认出报告时间」的夹具——本次 KC1 误报就是这个原因）。

## CMD-1015-24 补充（2026-10-16，已含原 CMD-1015-25；追加；取代 CMD-1015-22 的「付款后另弹麻醉同意书」两步和 21 里按项目时长自动算延长的做法，旧文字保留作历史）
- 基准 **c6cd9fe**，单个提交，**未推送**，不带开关，不升级数据版本（46）；新增可空字段：项目 `extendMin`（在韩增加的施术项目让施术块延长多少分钟，0 = 不延长）。
- **增加施术项目先问延长多久**（kr.js `krDoAddonCommit` → `krExtOpen`）：弹窗「施术时间：现在 hh:mm–hh:mm（共 x 小时 x 分）。加了 {项目} 要延长多久？」［不延长］［+30 分］［+1 小时］［+1 小时 30 分］［自定义］，**不按项目时长自动相加**（`surgeryMinutes` 对在韩增加的施术项目读 `extendMin`，没有该字段的旧数据仍按项目时长）。选［不延长］= 不查冲突；选延长 → `coreProjectedConflict(c, 名, [], 延长分钟)` 压到院长下一个安排 → 冲突询问（［仍然进行］照延长、日历红框；［不在这个时段］项目放项目卡未使用 `deferUse`，不占时段）。多个项目一起加时只有第一个带延长分钟。管理项目 / 서비스不问。
- **确认付款 Modal**（`krPayOpen` / `krPayConfirm` / `krPayLater`，增加成功后自动弹出，顶部「待付款」条的［去付款］打开同一个）：施术项目 / 管理项目分开列金额（서비스 0 元）、合计；睡眠 / 全麻项目时出现「麻醉同意书」块（列出各项目麻醉方式 +「客人已签署麻醉同意书」勾选，**不勾不能确认**）；按钮［稍后付款］［确认付款］（主操作在右）；确认 = `coreAddOnPaid` + `coreAnesConfirm` 一次完成。待付款条里的［修正］入口移到这个 Modal 的项目行（`krPayFix` → `krFixOpen`）；行上的「修正」链接拿掉。顶部「待确认麻醉同意书」条只在旧数据（已付款但没勾同意书）上出现。
- **今日案件里增加的施术行**和原施术行一样：内容写「施术：假体隆鼻」，操作［操作完成］（待付款 / 待确认同意书时灰）；管理项目 / 서비스行写项目名。
- **KR 预约到店阶段的案件页**（`krCleanVisitPage`，`c.krVisit && !arrived && 没取消`，如 IN 占位后 KR 确认建出的在韩管理案件）：只有页头 + 状态卡「当前状态 预约到店 · 待访问」+ 预约时间 / 目的，右边［客人已到店］（实心；没到当天灰，旁边［模拟到当日（演示用）］）［预约修改］（`coreBookChange` + `krbook` 占位块同步）［未到店］［预约取消］（`coreBookCancel`：案件取消，原因「未到店」/「预约取消」）；不显示 tab 和项目卡 / 案件区块；到店（`coreBookArrive`）后才是完整案件页。
- 测试：selftest 新增 R24a（A1：不延长不查冲突、延长压到安排被询问、仍然进行只延长所选分钟、「施术：xx」行、留两笔 KR 占位）、R24b（KM1：延长弹窗五个选项、干净案件页四个按钮、预约修改 / 未到店 / 到店后才有 tab）；R23b 改成新付款 Modal 流程。roletest 9 个账号 0 不符。

## CMD-1015-26 补充（2026-10-16，追加；旧文字保留作历史）
- 基准 **a362b40**，单个提交，**未推送**，不带开关，数据版本不变（46）。KR 主案件「已到院」拆 4 步：**Step 1 院长评估**（已付定金项目框 + 三选一 + memo，［确认评估结果］［撤回已到医院］，不显示项目卡）→ **Step 2**（已付定金项目框 + 添加项目框，加施术项目照 CMD-1015-24 先问延长；付清尾款区行标「已付定金 / 添加项目」，项目合计 / 已付定金（可抵）/ 尾款，［结算尾款］，不再有「已和客人确认行程」勾选）→ **Step 3** 确认付款 Modal（尾款明细 + 麻醉同意书，［稍后付款］［确认付款］，`krSettleOpen/krSettleConfirm`）→ **Step 4** 项目卡勾选今日进行项目（`KR_PICK`、`krTpToggle`、［退回前页］［今日进行］ → `coreTodayPick`）：勾的进今日案件，没勾的留未使用（`deferUse`）；付完尾款后再加项目照 24 单独付款。新增 KR「结算」tab（基础资料｜面诊｜项目｜结算｜附件｜Timeline，`krTabSettle`）：定金 / 尾款 / 在韩加项，不含面诊费和本地。
- 我的判断（未经确认）：Step 4 的［退回前页］只清空勾选（尾款已付，不能回退结算）；术后管理行不可勾（用［预约时间］）；`needTodayPick` 只由 UI 的 `krDoSettle` 设置（`coreSettleBalance` 不变，旧案件不受影响）；Step 2 添加施术项目的延长询问在点［结算尾款］时问。
- 测试：selftest 新增 R26a（A1）/ R26b（KM1），R18c tab 列表更新；A1 全套 + KM1 相关用例通过；roletest KM1 38 格无不符。

## CMD-1015-27 补充（2026-10-16，追加；取代 CMD-1015-26 里 Step 1～4 的版面和「延长在结算尾款时问」的判断，旧文字保留作历史）
- 基准 **af905e1**，单个提交，**未推送**，不带开关，数据版本不变（46）。
- **Step 1**（`krStep1Card`）：一张卡，标题只有「院长评估结果」（没有「到院与尾款」那一层），卡里「已付定金项目」框（`krPaidBoxHtml`：施术项目 / 管理项目两组，**只列项目名**，不显示麻醉 / 推荐在韩 / 术后管理，细节在项目卡）+ 三选一 + memo +［确认评估结果］［撤回已到医院］。**Step 2**：已付定金框同上（`krStepItemsCard` 现在也是只列名）；「添加项目」框（`krAddBoxHtml`）列出已加的施术 / 管理项目（带「延长 +N」，可移除）+［添加项目］；**加施术项目当下就问延长多久**（`krChToggle('adj', …)` → `krExtOpen`，结果存 `KR_ADJ.ext[项目名]`；选了延长且压到别的安排 → `krAskClash`），`krSettleOpen` 不再问；`krDoSettle` 按 `KR_ADJ.ext` 逐项传 `extendMin`。付清尾款区拿掉「KR 判断」那一行（Step 2 原方案不变时），［← 上一步］保留。
- **Step 3**：尾款确认付款 Modal 只有［取消］［确认付款］（拿掉［稍后付款］，`krSettleLater` 现在只是关闭）；付完尾款后另外加项目的 24 付款 Modal 不变（仍有［稍后付款］）。**Step 4**：标题「今日进行项目」，已勾项目纵向一行一个，只留［今日进行］，`krPickBack` 删除。
- **页头**：KR 案件页头拿掉「在韩后续进行中」（来源：CMD-1013-08 的 `KR_HOLD_TAG`，`krHoldOpen`=有在韩持有项目就挂，10/15 改成术后管理阶段 / 在韩持有后已是旧说法），只留一个阶段·进程标签。**案件列表行（IN `ui.js` / KR 列表）和 KR 客人详情里的同名小标签没动**（任务只写页头），待用户决定要不要一起拿掉。
- 测试：R26b 按新版改断言并新增「加施术项目当下问延长」；A1 全套 128 行无真实失败；KM1 用例 13 个通过；roletest 9 个账号 0 不符。

## CMD-1015-28 补充（2026-10-16，追加；取代 CMD-1015-20 里项目卡「术后管理」分页栏位，旧文字保留作历史）
- 基准 **5e382be**，单个提交，**未推送**，不带开关，数据版本不变（46）。KR 项目卡「术后管理」分页（kr.js `krProjCards` 的 `careBody`，新增 `krCareGrid` / `krCareHead` / `krCareRow`）栏位 = **项目｜对应施术｜项目类型｜次数｜管理间隔｜建议日期｜Action**：项目 = `x.name || x.mgmt`（具体项目名）+ 地点小标签（在韩国 / 韩国或印尼）；对应施术单独一栏；项目类型 = `x.mgmt`（诊疗方案「所需术后管理」里的类型）；同一条所需术后管理一行，多次写「剩 N / 共 M 次」；管理间隔 =「N 天后」/「N 天后起，每隔 K 天」；建议日期 = 施术日 + `pcDays(x)[下一次]`；拿掉购买时间；未预约按建议日期从早到晚排；已预约 / 已完成同栏位（建议日期换成预约时间 / 使用时间，已预约按预约时间排）。多次的约一次，约好的那次移到「已预约」，未预约行剩余次数 −1、建议日期换成下一次。
- **顺带修 `careUnits`（data.js）**：已有的预约行原来固定占用第一个名额（所以约了消肿管理，反而是拆线名额被扣掉、消肿仍显示剩 3 / 共 3）；现在按行内容对上它属于哪一条所需术后管理再扣名额。
- **我的判断（未经确认）**：「项目」写具体项目名（`x.name`），「项目类型」写类型（`x.mgmt`）；演示数据里两者常相同（如拆线 / 拆线），所以这两栏会显示同样的字。同一诊疗方案里两个施术项目都有「拆线」时会各占一行（对应施术不同）。
- 测试：selftest 新增 R28a（A1 造数据）/ R28b（KM1 断言栏位、剩 2 / 共 3、排序、没有购买时间）；顺手修三处过期断言（R26b 先切回施术项目分页、BK1b 的占位案件阶段现在是「在韩管理」`krmgmt` 且无院长）。A1 全套 + KM1 用例（含 BK 三段）通过，roletest 9 个账号 0 不符。

## CMD-1015-29 补充（2026-10-16，追加；取代 CMD-1015-28 里「项目类型」栏和 CMD-1015-22 里今日案件行的［修改时间］，旧文字保留作历史）
- 基准 **464522c**，单个提交，**未推送**，不带开关，数据版本不变（46）。
- **项目卡栏宽**：术后管理分页拿掉「项目类型」栏（栏位 = 项目｜对应施术｜次数｜管理间隔｜建议日期｜Action，`krCareGrid` 用 `minmax(0,Nfr)` 近似均分，Action 固定 112px 靠右）；施术项目 / 管理项目分页同样改成均分栏宽 + 固定 150px 靠右 Action（这两页的「项目类型」栏保留，任务只写术后管理拿掉）。今日 / 预约表格 `KR_TBL_COLS` 也改窄一点，操作栏按钮可换行（`flex-wrap`）。
- **［今日进行］后弹「术后管理预约」**（kr.js `krCareMiniOpen` / `krCareMiniRender` / `krCareMiniGo`，`careSlotList(c)` 列出未预约名额）：列 项目｜对应施术｜建议日期｜地点｜时间；韩国或印尼都可的要选地点（印尼只记建议日期、由 IN 约，`coreCareBook` place IN），必须在韩国的默认韩国；日期默认带建议日期，时间默认「不约」；［日程预约］只约填了时间 / 选了印尼的几项（院长时间冲突按 21 / 22 询问，休诊类硬挡），按日期建立 / 并入预约案件（预约来源：术后预约），KR 日历随子项出现；［稍后预约］/ 没填的留项目卡「未预约」。没有未预约术后管理（或没付尾款 / 没选过今日项目）不弹。是新的页内弹窗，不是 `krPcbOpen` 那个小窗口（那个仍在「安排术后管理」按钮上）。
- **今日案件每行 =［操作完成］［今日取消］**（`krTblRow` today 模式）：拿掉［修改时间］、［预约后续到院］和行内「取消本次」链接（预约案件的［修改时间］［备注］不变）。**施术项目一项一行**（显示层按 `施术：A、B` 拆开，数据里仍是一条「施术」子项；`coreSurgItemDone`：单项完成，最后一项完成时整条施术行完成并 `krCloseIfDone`）。**［今日取消］** = 弹确认 Modal（「今天不做 X？会退回项目卡，之后可以再约」）→ `coreTodayCancel`：施术 / 在韩加项 → `deferUse`（回项目卡「未使用」，今日行拿掉，施术行内容跟着变）；持有管理项目 → 从 `todayPickMgmt` 拿掉；术后管理 / 使用行 → `coreRowCancel`（回「未预约」）；不是取消项目、不退款。**备注**每行都能直接输入（施术 / 增加项目 / 持有管理项目各存在项目上 `it.todayNote`，`coreItemNote`）。
- 我的判断（未经确认）：施术项目的行拆分只在显示层，单项备注存项目上；今日取消已「待付款」的在韩增加项目也允许（只是 deferUse，付款状态不变）。
- 测试：selftest 新增 R29a（A1 造 A / B 两个案件）、R29b（KM1：弹窗列项目 / 约 3 项含 1 个印尼 / 稍后预约 / 施术一项一行 / 今日取消 Modal / 最后一项完成）；R28b 栏位断言去掉项目类型；A1 全套、KM1 用例（含 BK 三段）通过，roletest 9 个账号 0 不符。

## CMD-1015-30 补充（2026-10-16，追加；取代 CMD-1015-21 里「指定了院长的术后管理行也占院长时间」的做法，旧文字保留作历史）
- 基准 **85ee987**，单个提交，**未推送**，不带开关，数据版本不变（46）。29 的第 3 项（今日案件行［操作完成］［今日取消］、施术一项一行）**已在 85ee987 做过**，这次没有重做。
- **项目卡本次使用 / 本次取消**（kr.js `krProjCards` 的 `useBtns` / `cancelBtn`，data.js `coreTodayState(c, it)`）：有客人已到店的今日案件（`coreUseTarget`）时，施术 / 管理分页：没选进今日案件的 →［本次使用］（主案件：施术项目先问延长多久 `krUnitUseNow` → `krExtOpen`，延长压到院长下一个安排 → 冲突询问；加回今日案件：计划内项目取消 `deferUse`、在韩增加项目补回今日行；管理项目加进 `todayPickMgmt`，完成时才扣 1 次，**不再点一下就直接扣次数**）；已选进今日、没完成的 →［本次取消］（`krTodayCancel`，和今日案件行的［今日取消］同一个确认弹窗、同一个动作 `coreTodayCancel`）；已完成的没有按钮；没有客人到店时照旧（［本次使用］灰、［预约使用］可用）。子案件到店时同样：已有这次的使用行 →［本次取消］（`coreRowCancel`）。新增 `extraMin`（计划内施术项目本次使用时选的延长，`surgeryMinutes` 加进去）。
- **术后管理分页地点单独一栏**：项目｜地点｜对应施术｜次数｜管理间隔｜建议日期｜Action（`krCareGrid` 7 栏，`krCareRow(nm, plc, surg, cnt, iv, dt, ops)`），地点 = 韩国 / 韩国或印尼（未预约）、韩国 / 印尼（已预约，按实际）。
- **术后管理不占院长时间**（取代 21 的相关规则）：［预约时间］（`krBkdOpen('care')`）、今日进行后的预约弹窗（`krCareMiniGo`）、修改时间（`krTimeEdit`，`KR_TE.care`）不选院长、不查院长冲突，只看医院休诊（`krbClosedText`，硬挡）和午休 / 营业时间外（`krOffHoursText`，确认后可约）；`krDayAgendaHtml` 不再列术后管理；KR 日历（`krcEvents`）术后管理挂在 `KRB_HOSP`（全院）画在医院层，带 `noCap`，`krCapUsed` 不计入约满。**持有项目使用（`holdUseOf`）和施术项目预约使用（`surgUse`）不在此列**，仍按原规则。
- 测试：selftest 新增 R30a（A1 造案件）/ R30b（KM1：本次使用 / 本次取消 / 地点栏 / 和院长「不可预约」同时段的术后管理不询问冲突 / 日历医院层）；R28b / R29b 栏位断言加「地点」；R29b / R30b 的预约时间改在营业时间内（早于开门的时间会弹「营业时间外」确认）。A1 全套 + KM1 用例（BK 三段）通过，roletest 9 个账号 0 不符。
- 我的判断（未经确认）：管理项目（持有）在主案件上［本次使用］= 加进今日案件，按今日行的［操作完成］才扣次数；术后管理预约在医院层显示「全院」，院长账号（KD1）日历看不到它。

## CMD-1015-30 续（2026-10-19，Notion 任务页补了 4～6 项后重跑；追加；旧文字保留作历史）
- 基准 **e7537ee**（1～3 项已在 e7537ee 做完），本次单个提交，**未推送**，不带开关，数据版本不变（46）。
- **④ 施术 / 管理分页拿掉「项目类型」栏**（`krPcGrid` 4 栏：项目｜次数｜购买 / 预约 / 使用时间｜Action；`krPcHead` 过滤掉「项目类型」，`krPcRow` 不再画类型标签）。
- **⑤ 拿掉旧的「术后管理预约」卡片 +［安排术后管理］小窗口**：先全文搜索确认没有别处在用——用到的只有 `krPcbNeedCard`（施术 tab）、`krPcbButtonHtml`（`krArrivalBlock` 旧路径两处）、`?pcb=1&win=1` 地址参数、selftest R15c 一条断言，都已改；删除 `krPcbNeed` / `krPcbNeedBar` / `krPcbNeedCard` / `krPcbButtonHtml` / `krPcbBuild` / `krPcbOpen` / `krPcbOpenLocal` / `krPcbRender` / `krPcbSet` / `krPcbGroupTime` / `krPcbToggleSingle` / `krPcbClose` / `krPcbConfirm` / `KR_PCB`（`krInnDayStatus` 只被它们用，一并没了）。**保留** `data.js` 的 `corePcBooking`（核心函数，selftest 造「已预约的术后管理」夹具要用，界面已无入口）和工作台待办「安排术后管理」（提醒，点了去案件，不是预约入口）。术后管理预约入口现在只剩：今日进行后的弹窗（`krCareMiniOpen`）、项目卡术后管理分页的［预约时间］。
- **⑥ 施术一项一行单独今日取消**：29 / 30 的做法本来就支持（显示层拆开，取消 = 该项目 `deferUse`，施术行内容只剩没取消的；`coreSurgItemDone` 单项完成；最后一个也取消时施术行 / 施术块一起拿掉），所以没有把数据拆成一项一条；本次补了截图验证（两个施术取消「鼻翼缩小」：另一个「假体隆鼻」留在今日案件，取消的回项目卡「未使用」［本次使用］［预约使用］）。
- 测试：R15c 改成断言旧卡 / 小窗口已不存在；A1 全套、KM1 用例（BK 三段）通过，roletest 9 个账号 0 不符。**测试顺序教训**：BK1a 要有「有赴韩项目的客人」，清理后单跑要先带一个造案件的用例（如 R30a）。

## CMD-1015-31 补充（2026-10-19，追加；旧文字保留作历史）
- 基准 **689421c**（30 补做的 4～6 项已在 689421c：施术 / 管理分页拿掉项目类型、拿掉旧术后管理预约卡和 krPcbOpen 小窗口、施术一项一行单独取消），本次单个提交，**未推送**，不带开关，数据版本不变（46）。
- **krPcbOpen 入口清单与改向**（689421c 已全删，本次补查"待办 / 通知跳转"）：原调用点 = ① 施术 tab 的「术后管理预约」卡（`krPcbNeedCard`，CMD-1015-15 加的 + 项目 tab「术后项目」卡里的入口）② `krArrivalBlock` 旧路径里的两处 `krPcbButtonHtml` ③ 地址参数 `?pcb=1&win=1`（`krPcbOpenLocal`）④ 工作台待办「安排术后管理」只是跳到案件（没调用 krPcbOpen）。**本次改向**：待办「安排术后管理」（`todo.js` `pcb`）→ 直接到项目 tab 的术后管理分页（`krProjPage('care')`）；术后管理类通知（`krNotifTarget` 'proc' + 文字含「术后管理」，`krOpenNotif`）→ 同样到术后管理分页，用［预约时间］约。
- **施术一项一行单独今日取消 / 操作完成**：没有拆数据（不升级版本）——显示层按 `施术：A、B` 拆成一项一行；完成一个 = `coreSurgItemDone`（该项目 `done`，其余仍待做、施术行不完成，全部做完才完成）；取消一个 = `coreTodayCancel`（该项目 `deferUse`，回项目卡未使用，施术行只剩没取消的）。**本次补一个边界**：取消的是最后一个没做的、其余都已完成时，施术行跟着完成（`coreTodayCancel` 里 `coreSubDone` + `krCloseIfDone`），否则施术行会一直停在「待做」。
- 测试：selftest 新增 R31a / R31b（先完成一个另一个仍待做、再取消剩下的 → 施术行完成；待办 / 通知 → 术后管理分页；施术 / 管理分页没有项目类型；旧卡和小窗口不存在）；A1 全套 136 行、KM1 用例、BK 三段通过，roletest 9 个账号 0 不符。

## CMD-1019-01 补充（2026-10-19，追加；取代旧的「基础资料 上传照片 / 上传视频 / 总的苦恼文字」，旧文字保留作历史）
- 基准 **dd2ee57**，单个提交，**未推送**，不带开关；**数据版本 46 → 47**（用户案件保留，`MIGRATIONS` to:47）。客人预约页（booking.html）这次不动。
- **IN 基础资料顺序**（`materialsCardHtml`）：关联之前案件 → 메타뷰 * → 面诊需求 *（面诊 / 不面诊 / 沿用原诊疗方案，院长 / 意向项目跟在它后面，只有选面诊才出现）→ 苦恼 * → 希望预期 * → 预算（选填，Rp 最低 ～ 最高，原来就是区间）→ 上传附件（选填）→ 医美史。拿掉单独的「上传照片 / 上传视频」两行和总的苦恼文字格（`cf-concern` 没有了）。
- **苦恼按部位**：`c.concerns = [{part, desc, video:{name}|null, photos:{角度id:{name}}}]`；部位和各部位的照片角度写成配置 `CONCERN_PARTS`（data.js，眼睛 5 / 鼻子 6 / 面部 5 / 嘴巴 5 / 身体 4 个角度，角度存 id，改名不丢已传照片；规格文字 `CONCERN_PHOTO_SPEC`「白底，1200×1600px」）。先选部位（`toggleConcernPart`，可多选）→ 每个部位一张卡片：苦恼说明 *、视频 *、各角度照片 *（一个角度一个格子，`mockUploadConcern`，可重传 `clearConcernMedia`）。必填校验 `concernMissing(c)`（缺项弹窗里写「眼睛：视频」「鼻子：照片（正面）」…）；**选「不面诊」**（`concernMediaOptional`）照片 / 视频改选填，说明和部位仍必填；沿用原诊疗方案按必填算（我的判断）。`concernSync(c)` 把 `c.concern`（汇总文字，KR 基础资料 / 韩文摘要还在读）、`c.photoUploaded`、`c.videoUploaded` 同步算出来。
- **按部位显示（只读）**：`concernCardsHtml` / `concernBlockHtml`——IN 基础资料 tab（每张卡带［补充照片］［补充视频］，沿用 `supplementUpload`）、IN 面诊资料 tab 的「客人资料」卡（`consultIntentionCardHtml`：希望预期 / 预算在上，部位卡在下）、KR 面诊 tab 最上面新增「客人资料（按部位）」卡（`KR_TAB_FN.consult` 包了一层，院长账号一样）；照片格子带角度名，点开放大（`concernZoom`，原型占位图）。附件 tab 按部位列「眼睛视频」「眼睛照片（N 张）」。KR 基础资料 tab 的「本次需求」仍显示汇总文字（没改）。
- **旧案件转换**：迁移 47 把 `concern` / `photoUploaded` / `videoUploaded` 转成一张「未分部位」卡片（`part:'legacy'`：说明 = 原苦恼文字，视频 = 「视频（旧资料）」，照片 = 一个「照片（旧资料）」占位，没有分角度）；没有苦恼资料的案件 `concerns=[]`；没迁移到的旧数据也能显示（`concernCards` 兜底合成同样的卡片）。取消接待 / 退回待访问时 `concerns` 清空。
- 测试：selftest 新增 R32a（顺序 / 两张卡角度不同 / 缺一张照片不能提交 / 不面诊选填 / 完整提交同步汇总 / 旧案件转换）、R32b（KM1 / KD1：KR 面诊 tab 按部位显示、点开放大）；`ST.materials` 改成填 `concerns`；A1 全套 138 行、KM1 用例、BK 三段通过，roletest 9 个账号 0 不符。

## CMD-1019-02 补充（2026-10-19，追加；取代 CMD-1019-01 里「面诊需求下面跟意向项目」和旧的「擅长客人意向项目的排前面」，旧文字保留作历史）
- 基准 **fdd95ac**，单个提交，**未推送**，不带开关，数据版本不变（47；没有改资料结构，旧案件已存的 `intentionProjects` 不删，只是不显示 / 不必填）。
- **拿掉基础资料的「意向项目」**：`intentRowHtml` 恒为空串；意向项目选择弹窗（`openIntentionPickerModal` 等 5 个函数 + in.html 弹窗）删除；缺项检查和「增加面诊」的「至少一个意向项目」检查删除；`intentionInfoHtml` 不再显示意向项目；`setNeedsConsult` 不再清意向项目；`intentKrAllowed` 留着恒返回 false（旧调用兜底）。「增加面诊」（面诊 tab 待缴费）现在是 预算 → 院长 → 面诊费。
- **院长卡片按苦恼部位排序**：`projectPartsOf(p)`（项目自己的 `parts` 优先，没勾过的按项目名关键词默认对应，`PROJECT_PART_RULES`）；`docPartMatch(hid, dr, c)` 返回这位院长擅长项目覆盖了客人选的哪些部位；`directorCardsHtml` 排序 = 整天 OFF 的灰色排后 → 对到的部位越多越前 → 对到的擅长项目越多越前 → 原顺序；标签写「★ 擅长客人苦恼部位（鼻子）」，提示写「擅长客人苦恼部位的排前面」。KR / IN 项目库编辑（赴韩项目）新增「对应苦恼部位」多选（`projPartsToggle`，存 `p.parts`）；KR 院长管理里的擅长项目提示文字同步改。
- **苦恼 / 希望预期移到面诊需求下面，选了才展开**：`concernExpectHtml`——没选面诊需求时只有灰字「选择面诊需求后填写苦恼与希望预期」；选了（面诊 / 不面诊 / 沿用原诊疗方案，`consultChosen`）才出现苦恼（面诊时院长在苦恼上面）和希望预期；来回切换已填内容保留，只改照片 / 视频是否必填。
- **意向项目用到的地方清单**：基础资料输入行（拿掉）、意向项目选择弹窗（拿掉）、确认时缺项检查（拿掉）、增加面诊输入行与缺项检查（拿掉）、IN 面诊资料 tab / 基础资料 tab 只读展示 `intentionInfoHtml`（拿掉意向项目行，预算保留）、选院长排序与标签 `docIntentMatch`（改按苦恼部位）、KR 院长管理擅长提示文字（改）、`makeCase` / 取消接待 / 数据迁移 41 里对 `intentionProjects` 的清理（保留，只是旧数据维护）。**检查过没有用到**：KR 面诊 tab / 基础资料（本来就没显示）、诊疗方案 / AI 报告模板、案例库筛选、通知文案、客人预约页、测试覆盖页。
- 测试：selftest 新增 R33a（没有意向项目栏 / 未选面诊只有灰字 / 切换保留内容 / 项目→部位对应 / 院长排序 / 旧案件意向项目不显示不删）；R32a 改成先选面诊需求；`ST.materials` 去掉意向项目；A1 全套 139 行、KM1 用例、BK 三段通过，roletest 9 个账号 0 不符。

## CMD-1019-03 补充（2026-10-19，追加；取代 CMD-1019-01 里的五个部位和 CMD-1019-02 里的粗部位对应，旧文字保留作历史）
- 基准 **e30462d**，单个提交，**未推送**，不带开关；**数据版本 47 → 48**（用户案件保留，`MIGRATIONS` to:48）。
- **苦恼加一层「面部 / 身体」**：先选大类（`toggleConcernGroup`，可都选；已有卡片的大类不能收起）→ 细部位（可多选，`toggleConcernPart(key, sub)`）；手臂 / 腿再出第三层（`CONCERN_SUBS`：大臂 / 小臂 / 整体、大腿 / 小腿 / 整体，`toggleConcernSubOpen` 展开，卡片标题「手臂 · 大臂」）。卡片记录 `{part:'f_eyes', sub:'', desc, video, photos}`，卡片编号 `concernCid(x)` = part 或 part|sub。**部位 / 第三层 / 各部位照片角度全写在 `CONCERN_PARTS` / `CONCERN_SUBS` / `CONCERN_ANGLE`（data.js 暂定配置，之后会细化）**：面部整体 / 额头 / 太阳穴 / 颧骨 / 脸颊 / 下巴 / 下颚 = 正面｜左正侧｜左 45｜右 45｜右正侧；眼睛 / 鼻子 / 嘴巴同 01；耳朵 = 正面｜左正侧｜右正侧；颈部 / 肩背 / 手臂 / 腰部 / 腿 = 正面｜左正侧｜右正侧｜背面；胸部 = 正面｜左 45｜右 45｜左正侧｜右正侧；腹部 = 正面｜左正侧｜右正侧；臀部 = 背面｜左正侧｜右正侧。部位 key：面部 `f_all / f_forehead / f_temple / f_eyes / f_nose / f_cheekbone / f_cheek / f_mouth / f_chin / f_jaw / f_ear`，身体 `b_neck / b_back / b_chest / b_arm / b_belly / b_waist / b_hip / b_leg`，旧资料专用 `b_all`（身体（未细分），选择界面不列）。
- **旧部位迁移（迁移 48）**：眼睛 / 鼻子 / 嘴巴 → 面部下同名（`f_eyes / f_nose / f_mouth`）；「面部」→ 面部整体（`f_all`）；「身体」→「身体（未细分）」卡片（`b_all`，保留，角度 正面｜左正侧｜右正侧｜背面）；已传照片按角度 id 原样保留（对得上的显示，对不上的不丢）。没迁移到的旧 key 也能显示（`CONCERN_OLD_KEY` 别名）。
- **院长排序对应改细部位**：`projectPartsOf` 默认对应按项目名关键词（`PROJECT_PART_RULES`），部位值可带第三层如 `b_leg:thigh`；项目库（赴韩项目）编辑的「对应苦恼部位」改成面部 / 身体两行细部位多选（`projPartsToggle`，旧五个部位 key 自动转新部位）。`docPartMatch`：客人选的细部位，院长擅长项目对到同一细部位 = 1，只对到同一大类下别的细部位 = 0.5（排在完全对到之后）；排序 = 整天 OFF 排后 → 总分高在前 → 对到的擅长项目多在前 → 原顺序；标签完全对到「★ 擅长客人苦恼部位（鼻子）」，只对到大类「◐ 擅长相近部位（面部）」。
- **显示分组**：IN 基础资料 / IN 面诊资料 / KR 面诊 tab 的部位卡片按「面部 / 身体」分两组（旧资料「未分部位」单独一组）；附件 tab 里苦恼附件带分组小标题「基础资料 · 面部 / 身体」，名称写「面部 · 眼睛视频」。
- 测试：selftest R32a / R32b / R33a 改用新部位并新增（三层选项、三张卡角度各自不同、半对分数、分组显示、附件分组、迁移 48）；A1 全套 139 行、KM1 用例、BK 三段通过，roletest 9 个账号 0 不符。

## CMD-1019-04 补充（2026-10-19，追加；旧文字保留作历史）
- 基准 **bd7afc3**，单个提交，**未推送**，不带开关。**数据版本 48 → 49**（`MIGRATIONS` to:49，用户案件保留并迁移）。
- **补登医美史**：`openBeautyAdd` / `saveBeautyAdd`，年、月必选，日选填（显示 2024-03-15 / 2024-03），项目是多行手输（无项目库选择），存 `day` 字段（`beautyYm` / `beautySortKey` 排序），日期不能超过月份天数、不能晚于今天。
- **同一案件沿用已开分页**：`caseTabName` / `caseTabOpen`，`window.open(url, 'gmc-in-诊所-案件id')` 具名分页；IN 的 `openCaseDetail(id, noPush, {tab, pc, scroll})` 和 KR 的 `krShowCase(clinicId, id, {tab, page})` 是统一入口（工作台 / 日历 / 待办 / 通知 / 案件列表 / 客户详情都走它），本页已是该案件时直接在当前页切到位置；浏览器不让开新分页（`window.open` 返回 null）退回当前分页，并保留「已在另一个分页打开」弹窗兜底（操作锁规则不变）。测试里 `window.GMC_NO_TABS = true` 让入口一律在当前分页打开。Chrome / Edge / Firefox 会把已有同名分页切到前台，Safari 可能只导航不切换（此时靠兜底弹窗）。
- **메타뷰**：检测完成时「查看检测结果 ↗」放最右（已检测到在左），待检测不显示链接。
- **基础资料新顺序**：面诊需求 → 苦恼（部位卡片，每张卡片：说明* → 希望预期* → 视频 → 照片）→ 苦恼总 memo（选填，≥2 个部位才出现，`c.concernMemo` / `saveConcernMemo`）→ 院长 → 预算 → 上传附件 → 医美史；单独一行的希望预期拿掉（每张卡的 `expect` / `saveConcernExpect`，`c.expectation` 现在是各卡汇总文字）；不面诊时照片 / 视频选填，**苦恼说明、希望预期仍必填**。院长头像 / 名字（带 ↗）点了在新分页打开院长介绍（`openDirectorNewTab` → `in.html?page=in-director&dir=名字`，不选中），点卡片其他地方照旧选中。IN 面诊资料 / KR 面诊 tab / 诊疗方案模板按部位显示希望预期，总 memo 在卡片上方。
- **旧案件转换（迁移 49）**：只有一张「未分部位」卡的旧案件，旧「希望预期」放进这张卡的 `expect`；已经有部位卡片的案件，旧希望预期以「希望预期：…」追加进苦恼总 memo。
- 测试：selftest 新增 R34a（具名分页 / 地址位置 / 退回当前分页 / 院长新分页），R32a / R33a 按新顺序重写；A1 全套 + KM1 / KD1 回归（R32b、R26b 等，R26b 单独跑通过，连跑会被前面用例留下的表单状态影响）+ BK1a/b/c；roletest 9 个账号（A1 A2 OWN B1 KM1 KC1 KD1 KO1 KM2）0 不符；`bash dev/check.sh` 通过。**BK2b/BK2c 本次没重跑**（占位预约未改动）。自测教训：新建案件会把仍在接待中的上一个案件重置（接待未保存离开），同一用例里要先做完旧案件再开新的。

## CMD-1019-05 补充（2026-10-19，追加；取代 CMD-1014-16「KR 院长管理」里的院长资料编辑方式和案例库「按部位 = 项目库分类」，旧文字保留作历史）
- 基准 **c97205d**，单个提交，**未推送**，不带开关，**数据版本不变（49）**（部位分类按项目现算，院长旧资料读取时自动迁移，不需要改存档结构）。
- **案例库三种浏览**（`LIB_VIEW`：`part` / `dir` / `method`）：**按部位** = 苦恼部位分类（`CONCERN_GROUPS` 面部 / 身体两组，各细部位一张卡 + 案例数，分组 id `part:部位key`）；案例的部位由项目带出：`libProjParts(p)`（`projectPartsOf` 项目自己勾选 / 名称规则，对不到时按旧分类表，再对不到归 `f_all`）、`libCaseParts(c)`。**旧分类对应表 `LIB_OLD_PART_MAP`**：眼部→眼睛｜鼻部→鼻子｜轮廓→颧骨 + 下颚 + 下巴｜面部年轻化→面部整体｜皮肤管理→面部整体｜其他 / 对不到→面部整体。**按院长** = 每位在职院长一张卡（照片 / 名字 / 职称 / 案例数，`libRenderDirHome`，范围 = 对接医院，KR 端 = 本医院）→ 院长介绍页。**按施术 / 管理**不变。案例的「负责院长」就是 `c.director`（IN 新增 / 编辑赴韩案例时选，标签改名「负责院长」；演示案例已分配给 KD1 / KO1 等，印尼本地案例仍没有负责院长）。
- **院长介绍页**（`directorIntroHtml(name)`，IN 的 `in-director` 页面和 KR 案例库里的院长层级 `LIB_STATE.level==='director'` 共用；`libOpenDirector(name)` 统一入口，`openDirectorDetail` 在没有 `in-director` 的 KR 页里改走案例库层级）：左 220×280 照片；右 名字｜职称 → 经历（现｜… / 前｜…）→ 学历 → 资格证 → 擅长项目（标签），分组细线隔开；下面是这位院长的案例（`libCasesOfDirector`）。IN 基础资料院长卡片头像 / 名字（04 做的 `openDirectorNewTab`）打开这一页（新分页，`?page=in-director&dir=`）。
- **院长资料新格式**（data.js）：`dr.items = [{cat:'经历'|'学历'|'资格证', text, when:'现'|'前'(只有经历)}]`（内容照原文，不翻译）；`dr.title` 院长 / 副院长 / 代表院长；擅长项目仍是 `dr.specialties`（项目名，排序读它）。**旧字段迁移** `drNormalize(dr)`（幂等，`hospitalDirectors` 读取时自动调用）：`career` → 经历（现 / 前）、`certs` + `societies` → 资格证（学会 / 培训并入资格证），旧字段删除；用 `drItemsOf(dr, cat)` 读取。演示种子写新格式并给 KD1 / KO1 / H2 院长1 加了 `EDU_SEED` 演示学历。
- **KR 医院设定 → 院长管理**（kr.js `krdEditor`）：左边照片 + ［上传照片］；右边高度固定（`KRD_H`=280，和照片一样）：最上面固定「名字｜职称（下拉）」，下面可滚动 = 每行「类别（经历 / 学历 / 资格证，下拉）｜［现 / 前，只有经历］｜内容（输入）｜删除」按类别排在一起 + ［+ 增加内容］，擅长项目每行从 KR 施术项目库下拉选一个（按分类 optgroup）+ ［+ 增加内容］；保存后带到 IN 院长卡片（现 / 前 / 学历 / 认证 / 擅长）、院长介绍页、按苦恼部位排序（擅长项目）。
- 测试：selftest 新增 R35a（IN / KM1 分页各跑一次：旧资料迁移、三种浏览、介绍页顺序、KM1 编辑 KD1 加 2 条经历 / 1 学历 / 1 资格证 / 2 擅长后介绍页显示、IN 院长介绍页、负责院长选择）；顺手修 S35 的日期相关旧断言（挑「空的日子」时要避开 KD1 每周三 OFF，半天 OFF 另挑一天，1015-21 起会被院长冲突检查拦住）。roletest 9 个账号 0 不符。**roletest 在重置过数据的浏览器里要先清 `gmc_cfg_stfix` / `gmc_cfg_stsnap`（cfg 键重置不清，会让夹具被当成已建好）**。

## CMD-1019-06 补充（2026-10-19，追加；取代旧「赴韩项目分类 = 眼部 / 鼻部 / 轮廓 / 面部年轻化 / 胸部 / 身体」和 IN 项目库「赴韩项目」tab，旧文字保留作历史）
- 基准 **5948d1f**，单个提交，**未推送**，不带开关；**数据版本 49 → 50**（用户案件保留；`MIGRATIONS` to:50 把案件里的项目名「下颌角整形」改「下颚角整形」）。
- **IN 项目库入口**（ui.js `projLibEntryHtml` / `setProjLibEntry` / `projLibBack`，`PROJLIB_HOME`）：进来先看到居中两张大卡「韩国施术」（只读）「本地管理」，点进去用左上「← 项目库」返回；拿掉「赴韩项目（只读）」tab；`setProjLibTab` 会退出入口页。
- **韩国施术（只读）**：价格 `krIdrText` =「Rp 25.000.000（₩2,500,000）」（`FX_RATES.KRW_IDR` = 1 ₩ = 11.8 Rp 的演示常量；系统里还没有「汇率设定」，以后接实时汇率时只改这一处），顶部小字「按设定汇率换算，以韩币原价为准」，没有币别下拉；每个部位一张卡（`krPartCardsData`，CONCERN_PARTS 面部 → 身体顺序，没有项目的部位不显示），顶部部位钮 = `projLibScrollTo` 滚动（不是筛选），搜索保留；多部位项目只放第一个部位（`krMainPartOf`）；每行 项目名（韩 / 印名小字）｜价格｜使用情况，没有「分类」栏和「只读」字样。**本地管理**：tab 改名 全部项目｜本月活动｜套餐｜非活性化（`IN` tab 的 id 不变），12 类分类和画面不动；非活性化 tab 只列本地项目。
- **KR 施术项目分类 = 苦恼部位**（data.js `krPartsNormalize`，幂等，种子 `normalizeSeeds` 和每次读档 `afterLoad` 都跑）：项目的 `p.parts` 就是分类，第一个 = 主分类，`p.categoryId` = `'kp_'+部位key`（`krEnsurePartCat`，分类对象带 `part`）；旧分类（眼部 / 鼻部 / 轮廓 / 面部年轻化 / 胸部 / 身体）从 `KR_CATEGORIES` / `PROJECT_CATEGORIES` 删除。旧项目的部位取法：项目自己的 `p.parts` → `PROJECT_PART_RULES`（项目名关键词）→ 旧分类对应表 `KR_OLD_PART_MAP`（眼部→眼睛｜鼻部→鼻子｜轮廓→颧骨 + 下颚 + 下巴｜面部年轻化→面部整体｜胸部→胸部｜身体→身体（未细分））→ 都对不到归「面部整体」并记 `window.KR_PART_UNMAPPED`（演示数据里是 0 个）。「韩国术后管理」分类保留（不是施术项目，列表最后单独一张卡，所需术后管理要选它）；KR 管理项目（本地管理项目 12 类 `localLib`）不动。`projLibCategories('KR')` 按 CONCERN_PARTS 顺序。
- **KR 项目库**（kr.js `ADMIN_RENDER.krsrvc`）：每个部位一张卡 + 部位钮滚动（`projLibScrollTo('krp-part-…')`），多部位项目行上写「也对应：…」；新增 / 编辑项目去掉分类下拉，改「分类 = 苦恼部位」面部 / 身体两行细部位多选（`krpPartToggle`，第一个 ★ 为主，`krpPartMain` 设为主），不选部位不能保存；保存时 `categoryId = krEnsurePartCat(第一个部位)`。
- **用字**：「鳍骨」代码里本来就没有（只有「颧骨」）；「下颌」统一成「下颚」：项目名「下颌角整形」→「下颚角整形」（种子、演示案例、selftest、迁移 50）、部位说明「下颌线」→「下颚线」；`PROJECT_PART_RULES` 的下颚规则保留 `/下颚|下颌/` 两种写法（老项目名也认得）。**没改**：本地管理项目清单（价格表文字）里的「Tune Liner 溶脂探头（整体下颌线）」「皮肤肉毒 部位=下颌线」（这是业务价格表原文，客人持有批次按名字对应，改了会对不上，待确认）和 in.html 静态示例文字。
- 测试：selftest 新增 R36a（IN / KM1 分页各跑一次：入口两张卡、韩国施术按部位卡 + Rp（₩）+ 无币别下拉 + 滚动不筛选 + 多部位只放第一个、本地管理 tab 名、KR 按部位卡 / 新增必须选部位 / 主分类 / 不重复）；S36 的新增项目补上部位；A1 全套、KM1 回归、roletest 9 个账号 0 不符。

## CMD-1019-07 补充（2026-10-19，追加；取代 CMD-1014-16「案例库单一由 IN 管理，KR 全角色只读」，旧文字保留作历史）
- 基准 **f8939ec**，单个提交，**未推送**，不带开关，**数据版本不变（50）**（新增可空字段 `c.by` / `c.fromClinic`，旧案例没有 `by` 算 IN，不需要迁移）。
- **案例库 IN / KR 各自维护**：案例带来源 `c.by`（`'IN'` | `'KR'`），卡片 / 详情标「来源 IN / KR」（`libByLabel`）；`libCaseCanEdit(c)` / `libCaseCanAdd()`（data.js）：IN 只能编辑 / 删除来源 IN 的案例（赴韩案例还记 `fromClinic` = 新增时的诊所，同一医院对接的另一家诊所也只读），KR 只能编辑 / 删除来源 KR 的案例；两边都看得到全部（KR = 本医院赴韩案例 + 对接诊所的本地案例，IN = 本诊所本地案例 + 对接医院的赴韩案例）。**KR 室长 / 管理者**新增案例（kr.js 案例库页 ［+ 新增案例］，只能是赴韩施术案例，可选负责院长 `c.director`，上传人带「（KR）」），新增 / 修改 / 删除写回医院分区（`libKrPersist` → `HOSPITAL_DATA[h].libCases`；KR 案例 id 用 `lck` 前缀避免和 IN 的 `lcN` 撞号）。新权限键 `krshowedit`（rules.js `ROLE_PERMS`）：`kr_manager` / `kr_general` = true，`kr_owner`（代表院长）/ `kr_director` = false。
- **院长 / 代表院长可看案例库**：本来 `krshowview` 就是 true，侧栏有「案例库」（含按院长、院长介绍页），本次核对没改动，只是不再有新增 / 编辑入口；KR 页面的说明文字改成「IN 和 KR 各自维护自己的案例…，你的账号只能查看」。
- **代表院长永远最上面**：`hospitalDirectors(hid)` 读取时稳定排序（代表院长在前，其余保持原顺序），所以 KR 院长管理列表、案例库按院长、IN 基础资料院长列表（没有苦恼部位时的默认顺序）都跟着；IN 选院长时「今天整天 OFF 的灰色排后」的规则优先于它（所以代表院长当天整天 OFF 时会排到后面）。
- 测试：selftest 新增 R37a（KM1 新增案例选 KD1 → A1 看得到不能改、A1 的案例 KM1 不能改、院长菜单有案例库只读、代表院长排最上面；先 KM1 再 A1 再 KD1），S36 里的 KR 案例库断言更新；roletest 案例库权限格更新（KR：新增 / 编辑自己的 = 室长 ✅ 院长 ❌；编辑 IN 的 ❌；IN：编辑 KR 的 ❌）。`roletest.js` 里有两份重复的 `RT.runKr` 定义（后一份生效），改 KR 格子要两处都看。

## CMD-1019-08 补充（2026-10-19，已含原 CMD-1019-09；追加；取代 CMD-1019-04 的「具名分页」细节、CMD-1012-08 / 1013-02 的「面诊录入独立小窗口」、CMD-1015-02 / 1019-01 的面诊 tab「客人资料」块，旧文字保留作历史）
- 基准 **15fe64d**，分一个提交，**未推送**，不带开关，**数据版本不变（50）**（录入草稿放 localStorage `gmc_rec_draft|账号|诊所:案件`，不进存档）。**流程**：开始执行任何任务先把任务页状态改「执行中」（工作规则里本来就写了，核对过）。
- **1 统一打开案件**（ui.js `caseGo`）：所有端所有入口都经 `openCaseDetail` / `openCaseNewTab`（IN）或 `krShowCase`（KR / 院长）→ `caseGo`；入口清单：IN = 工作台卡片 / 今日来访 / 日历块 / 待办 / 通知（铃铛、通知中心、toast）/ 案件管理行 / 客户详情案件记录 / 关联案件 / 对话里的案件链接与引用 chip；KR / 院长 = 工作台卡片 / 日历块 / 待办 / 通知 / 案件管理行 / 客人管理 / 对话。同账号同案件只开一个分页：案件页每 3 秒在 localStorage `gmc_case_tabs` 登记「账号|分页名 → 分页」（`caseRegBeat`，同时把 `window.name` 设成分页名 `gmc-端-诊所-案件`，离开案件页还回去）；再点同一案件 → 有活着的登记（12 秒内）→ `BroadcastChannel('gmc-case')` 通知那个分页跳到这次要去的位置（`caseApplyAt` / `krApplyAt`），再 `window.open('', 分页名)` 尝试切到前台（不重新加载页面）；切不过去（Safari 等 / 不同浏览器分组）→ toast 提示「已在另一个分页打开，那个分页已定位好」；没有已开分页才 `window.open(url, 分页名)` 新开；连新开都被拦才退回当前分页（最后备用）；当前分页就是这个案件只定位。「已在另一个分页打开」presence 弹窗只在真的出现两个分页时才出现。院长从待面诊 / 日历进案件默认基础资料 tab（`krDefaultCaseTab`）。**验证说明**：Claude in Chrome 扩展没连上，没法在你的 Chrome 里点；在内置浏览器里用两个分页验证了登记 / 通知 / 定位（内置浏览器的 `window.open` 行为和 Chrome 不同，没法验证「自动切到前台」）。
- **2 录入面诊侧边栏**（kr.js `krRecOpenModal` / `krRecModalRender` / `krRecCollapse` / `krRecSideSync` / `krRecLeaveOk`，app.css `.kr-rec-side`）：取代弹窗 + 独立小窗口（`krRecNewTab` / `krRecUrl` / `rec=` 分页 / `__krRecInTab` / `kr-recwin` 作废，boot 的 `rec=` 参数不再处理）：案件页右侧固定侧边栏（宽 400px，`body.kr-rec-open .main-col` 让位，≤1000px 改成盖在内容上的抽屉）；内容 录音 / 停止、状态条、转写文字（可改）、［取消］［上传内容］，上传后自动收起；可收起成右侧窄条（「🎙 录音中」/「草稿」），点一下展开；切 tab 保留（侧边栏在 body 层，不随 tab 重画）；离开 = 分页关掉（`beforeunload`）或同分页跳别的页面 / 换案件（`nav` / `krShowCaseHere` → `krRecLeaveOk`：录音中确认「还在录音，确定离开吗？」，确认后停录音、文字存成草稿）；开别的案件分页不算离开；草稿 `krRecDraftSave` 每次输入就存，下次进该案件以「草稿」窄条出现。**KR 室长侧同一个函数**（录入面诊 / 增加内容 / 语音 / 手动）；院长［开始面诊］选方式后切基础资料 tab + 开侧边栏。KR 面诊相关输入的小窗清单：录入面诊 / 增加内容（语音、手动）弹窗、院长录入独立小窗口 —— 都改成侧边栏；［开始面诊］选方式的小 Modal、AI 整理（页内按钮）、发送诊疗方案（页内表单）、对话窗口没动。
- **3 客人资料只放基础资料**：IN 面诊资料 tab 拿掉「客人资料」块（`consultIntentionCardHtml` 不再调用，函数留着），KR 面诊 tab 拿掉该块，KR 基础资料 tab 的「本次需求」摘要换成部位卡片（`concernBlockHtml`，院长账号同样）。
- **4 面诊卡折叠**（kr.js `krEtaStatusBlock`）：院长（或室长）按过［开始面诊］或已上传内容后，面诊卡片折叠成一行「负责院长 · 面诊中 / 已上传面诊内容，待整理诊疗方案」+［展开］（`KR_CONSULT_OPEN`，界面状态）；面诊时间 / 预计出报告时间 / 倒计时 /［修改预计时间］收进展开区，折叠行上没有［修改预计时间］；开始前照旧全展开。
- **5 弹窗阴影加重**：`app.css` 新变量 `--shadow-modal`（`0 28px 72px rgba(0,0,0,.40), 0 6px 20px rgba(0,0,0,.18)`，原来 `0 24px 60px rgba(0,0,0,.25)`），`.modal-box` 和代码里自己拼的小弹窗（来电 / 案件锁 / 登录页弹窗）都读它；遮罩深浅没动。
- **6 分页标题 / favicon**（ui.js `gmcPageTitle`，每秒更新）：一般页面「KM1 室长 · 工作台 – GMC KR」「KD1 院长 · …」「A1 室长 · 案件管理 – GMC IN」「OWN 老板 · 经营数据 – GMC IN」；案件分页「KM1 · 客人名（Case ID）」；登录页 / 没登录不动；favicon 三端不同颜色字母（IN 棕 I、KR 室长蓝 K、院长绿 D）。
- 测试：selftest 新增 R38a（IN / KM1 分页各跑一次；KR 部分要有面诊案件，KM1 会自己把等确认时间的案件推到等待报告），R32a / R32b 改成新位置；roletest 9 个账号 0 不符。

## CMD-1019-10 补充（2026-10-19，追加；取代 CMD-1015-16「管理项目：项目（规格）｜次数｜间隔」的字段含义，旧文字保留作历史）
- 基准 **0aa1cde**，单个提交，**未推送**，不带开关，**数据版本 50 → 51**（用户案件保留，迁移 51）。
- **管理项目数量 = 「份」**（写在数字后面）：条目字段 `qty` = **总次数**（持有 / 扣次数一直读它：`holdItemLeft` = `qty − holdUsed`）、`copies` = 份数、`specTimes` = 规格里的「N次」、`firstDay` = 第一次使用（施术日 / 到院日之后几天，可 0 = 当天）、`interval` = 间隔天数（总次数 > 1 才有）；价格 = 规格单价 × 份数；总次数 = 规格次数 × 份数。显示统一走 `mgmtQtyText(it)`（「1 份（共 3 次）」）/ `mgmtScheduleText(it)`（rules.js），不带次数的规格也写「份」；`qtyInputHtml({unit:'份'})` 在数字后面带单位（IN 本地选购、赠送 서비스、套餐内项目都改了；持有项目「剩余 N 次」「使用 N 次」是次数，没改）。
- **原来次数算错**：旧版 KR 管理项目的「次数」是手填的 1、2…（默认 1），而规格里写「·3次」时没有乘上去：买 1 份「身体 60kj·3次」只记 `qty:1` → 项目卡 / 持有只显示 1 次、只能扣 1 次（IN 本地选购 `grantLocalItems` 本来就是规格次数 × 数量，是对的）。已修；迁移 51 把旧案件（`recommended` / `procedureItems` / `krScope.items` 里带「N次」规格的管理项目）的旧 qty 当成份数，`qty` 改成 N × 份数，写进迁移备注；幂等。到院添加 / 更换里没带次数的旧入口（`coreAddOnItem`）按规格里的「N次」补。
- **KR 管理项目一行固定格式**（`krMgRowFields`，发送诊疗方案 / 补加 / 到院添加共用）：左 规格（下拉）｜第一次使用：[N] 天后｜间隔：[N] 天（**总次数 > 1 就显示**，不再等选了 2 份）；最右 份数：[N] 份（M次）｜价格 ₩（只写韩元）；不写「只在韩国做」。到院添加（`krMgRowsHtml`）也是这一行 + ［加入］［赠送］。
- **项目卡管理项目分页**：栏位 项目｜次数｜管理间隔（「1 天后起，每隔 5 天」）｜建议日期｜购买 / 预约 / 使用时间｜Action（`krMgGrid`）；建议日期 = 施术日（没有施术 = 到院当天）+ 第一次使用天数 + 已用 / 已约次数 × 间隔（`krMgSuggest`）；IN 赴韩施术计划 / 打印 / 推荐项目整理也写「N 份（共 M 次），第一次使用：…，每隔 …」。KR 端金额只写韩元（印尼盾换算的要求用户已撤回）。
- 测试：selftest 新增 R39a（1 份「·3次」→ 剩 3 / 共 3、用 1 次剩 2、2 份 = 共 6、单次规格 2 份 = 共 2 次显示间隔、旧入口补次数、迁移 51）；R16a / R16b 改成新字段；S36 取 IN 的案例（R37a 会留下 KR 的案例）；roletest 9 个账号 0 不符。

## CMD-1019-11 补充（2026-10-19，追加；旧文字保留作历史）
- 基准 **7922e0a**，单个提交，**未推送**，不带开关，**数据版本不变（51）**（护照是客户档案 `passport` 里新增的可空字段 `no / issue / expiry`，旧数据只有 `text` = 算未登记，按需填写，不需要迁移）。
- **客人基本信息**（data.js `clientBasicBlockHtml`，IN 基础资料最上面：确认前 `materialsCardHtml` / 确认后 `basicTabHtml` 都有）：姓名 / 性别 / 生日 `YY-MM-DD（N 岁）`（`dobAgeText` / `ageOfDob`，按 `todayStr()` 算）/ 病史过敏史（`historyMarkHtml`：有内容红底「⚠ …」，没有写「无」）/ 联系方式；资料读客户档案只存一份，每行［修改］走 `openClientEdit` → `saveClientEdit` → `refreshAfterClientEdit`（客户详情 + 当前案件页同步，客户 Timeline 记修改）。**KR（室长 / 院长）基础资料** `krTabBasic`：姓名 / 性别 / 生日（年龄）/ 病史过敏史只读，**联系方式整行拿掉**（原来是遮罩 `+62 000-****-****`）。
- **KR 端联系方式清单**（逐处核对）：只有 `krTabBasic` 一处显示（已拿掉）；KR 案件列表 / 客人管理 / 客人详情 / 案件页头 / 通知 / 对话引用 / 日历块 / 诊疗方案 / 打印（`printKrPlan`）本来就没有联系方式；`maskPhone` 函数留着但已无调用；IN 工作台待办里的「预约占位快过期：手机号」只在 IN 端。roletest KR「联系方式遮蔽」格改成「完全不显示」。
- **护照**：登记时机 = IN 确认赴韩（`confirmProjectSelection`：已选里有 `origin==='KR'` 的项目，生成定金结算单之前）→ `passportGate(c, cb)`：档案没有护照 → 弹窗必填（护照号 / 起始日期（签发日）/ 结束日期（到期日），`passportFormRead` 校验：三项必填、到期 > 签发、签发不晚于今天）；已有 → 带出来让室长确认（可改）；取消 = 不生成结算单。过期 / 施术前到期**不拦**，只报红（`passportAlert`：level none / expired / before / ok；施术日 = `passportSurgeryDate` = 确认日期，没有则首选日期）：登记弹窗里、IN 赴韩施术计划「确认赴韩项目」卡下（`passportStatusHtml`）、KR 案件页最上红色提醒条（`krTopAlerts`）、KR 基础资料「护照」行（号 + 签发 / 到期 +红字）。**可见范围** `passportVisible()` = `canDo('work')`（IN 室长）或 `canDo('krwork')`（KR 室长）；KR 院长 / 代表院长、IN 老板不显示（含基础资料行和红条）。客户详情「护照信息」行（IN）显示号 + 日期，［修改］= 三项表单（`passportFormHtml` / `passportSave`）。**护照号不进列表 / 通知 / Timeline**：Timeline 只记「已登记护照」「修改护照信息」「已确认护照信息（确认赴韩）」。
- 测试钩子：`window.GMC_PASSPORT_AUTO = true`（selftest.js 开头设置）= 确认赴韩时不弹窗、自动登记测试护照；R40a 里临时关掉它测弹窗流程。**新写自测里要走「确认赴韩」的用例不用再管护照**。selftest 新增 R40a（IN：基本信息块 / 同步档案 / 第一次必填 / 过期报红 / 第二案件带出 / 施术前到期；KR：KM1 看得到护照、KD1 看不到、都没有联系方式）。

## CMD-1019-12 补充（2026-10-19，追加；取代 CMD-1019-11 里「已有护照每次确认赴韩都弹窗」和 CMD-1015-05 / CMD-1014-01 的「转告客人」卡，旧文字保留作历史）
- 基准 **aad9717**，单个提交，**未推送**，不带开关，**数据版本不变（51）**（新增可空字段 `c.surgeryMsg`）。
- **［取消赴韩］**：待递交 / 待确认的施术日期卡按 `krScheduleReplied(c)`（`ks.confirmedDate` 或 `ks.rejectNote`，即 KR 回过日期 / 回过「无法安排」）分按钮：没回过 = ［取消赴韩］（客人决定不去了），回过之后才是［无法协调］；同一个 `requestCannotCoordinate()`，后续照无法协调流程（退定金 / 置换 → 本地管理 / 仅出报告），只是确认弹窗和 Timeline 用词变「室长点［取消赴韩］：客人决定不赴韩…」（`REFUND_CANCEL_KR`）；测试覆盖页 D27～D31 的正则同时认「点［无法协调］」「点［取消赴韩］」。日期卡提示改「浅色 = 休诊 / 约满 / 已过」。
- **［发送给客人］**（calalign.js，取代顶部「转告客人」卡 + ［已转告客人］，两者已删，`calRelayDone` 不存在了）：施术日期那一行（`#surg-send-row`）右边按钮 → 弹窗选短信 / WhatsApp → 预览印尼文 + 中文模板（可改）→［发送］（原型模拟，标「演示」）；模板放 `CLINIC_SETTINGS.sms.surgery`（和其他短信模板同一处，诊所设定里可改，旧设定没有这个键时用 `SMS_SURGERY_DEFAULT`；变量 `{clinic}{name}{date}{time_kr}{time_id}{hospital}{address}{anes}{phone}`，麻醉注意取项目 `anesthesia.note`）。发送后 `c.surgeryMsg = {key, method, at, count}`、`c.relayTold` 同步（待办「转告客人」消失），行上显示「✓ 已发送（方式，时间）」+［再发一次］，记短信发送记录（类型「施术日期」，WhatsApp 的 `to` 前缀「WhatsApp 」）和案件 Timeline。`surgMsgKey(c)` = 日期 | 到院时间 | 地址，KR 改了任何一项 → `surgMsgSent` 变假 → 显示「日期已变更，请重新发送」，待办重新出现；改回原样又算已发送。打开赴韩施术 tab 不再自动算已转告（todo.js 里那段删除）。待办点进来定位到这一行（`scroll:'surg-send-row'`）。
- **护照未登记不能付款**：`batchNeedsPassport(c, b)`（未付款、有定金、含赴韩项目、客人没登记护照）；`settleProjects` 先 `passportGate(…, {missingOnly:true})` 弹登记窗，填完才打开付款窗；`confirmSettlementPayment` 也再挡一道（alert「护照未登记」）；结算单上［确认付款］旁红字「护照未登记（点确认付款先登记护照）」（`settlementCardHtml`，rules.js）。
- **护照只在第一次弹窗**：`passportGate`：档案已有护照且有效 → 不弹窗直接继续；只有护照已过期 / 施术前到期才弹窗（标题「护照需要更新」）；没有护照仍必填。
- 测试：selftest 新增 R41a（取消赴韩 / 无法协调按钮、Timeline 用词、已有护照不弹窗、旧案件没护照不能付款、过期才弹窗）；R15d / TD1 / CAL1 的转告相关断言改成发送流程。注意：A1 全套要在干净数据上跑（`gmcResetAll` 后），否则 S40（多诊所持有项目隔离）会因为各账号测试遗留的同名客人失败。

## CMD-1019-13 补充（2026-10-19，追加；取代 CMD-1019-12 里的短信模板内容（印尼文 + 中文混写）、「确认日程无变动」卡和 `calRecheckOk`，旧文字保留作历史）
- 基准 **7d2712c**，单个提交，**未推送**，不带开关，**数据版本不变（51）**（医院英文名 / 地址按「从没填 = 演示默认值，清空 = 退回原文」读，不需要迁移；新增可空字段 `c.reminderMsg`）。
- **病史 / 过敏史**：`historyMarkHtml` 改成普通文字（不红底、没有 ⚠），没有写「无」；繁体「無」统一成简体「无」（代码里本来没有繁体字，用户看到的应是客人 / 室长录入的值或字体回退，现在显示时统一转换并加 `lang="zh-CN"`）。
- **施术前 2 天**：「确认日程无变动」卡改「施术前提醒」卡（`calRelayRecheckCards`，`#surg-remind-row`）：［发送给客人］→ 同一个弹窗，预选「施术前提醒」模板；发送后卡片显示「✓ 已发送（方式，时间）」+［再发一次］，待办「施术前提醒：发送给客人」消失，短信发送记录类型「施术前提醒」（`surgeryRemind`），Timeline「已发送施术前提醒给客人…」；`c.reminderMsg = {key, method, at, count}`（key = 日期 | 到院时间 | 地址，KR 改了任何一项变回未发送）；`calNeedsRecheck` / `calRecheckText` 读它（KR 施术日期卡写「✓ 已发送施术前提醒」/「IN 尚未发送施术前提醒」）；`c.recheck` 仍写入（兼容）。`calRecheckOk` 和［确认无变动］已删；客人说要改期走原来的改期流程。
- **发送弹窗**：顶部模板版本按钮（施术日期通知 / 施术前提醒，按入口预选，`surgMsgVer` 切换会重新生成），语言先只有「中文」（结构 `SURG_TPLS` / `surgTplOf(ver, lang)`，之后加印尼文 = 诊所设定里加 `surgeryNotice_id` 之类的键）；内容纯中文分段（用户给的模板原文）：诊所名 / 您好 客人名 / 这里是 室长名（`actingName()` = 当前登录人）/ 一句话 / 到院日期｜韩国时间（上午 / 下午 时:分，`surgAmPm`）/ 医院英文名 / 英文地址（始终用医院英文地址，不再用 KR 填的施术地址）/ 麻醉注意 / 如有疑问 / 诊所电话；麻醉行只写备注里有「空腹 N 小时」的非局麻项目（`surgAnesText`：一个项目 = 模板原样两行，多个项目一项一行 + 一句总提示），没有就整段不写、不留空行。**模板放诊所设定的短信模板**（`CLINIC_SETTINGS.sms.surgeryNotice` / `surgeryRemind`，`SMS_SURGERY_NOTICE_ZH` / `SMS_SURGERY_REMIND_ZH` 是默认值，变量 `{clinic}{name}{coordinator}{date}{time}{hospital}{address}{anes}{phone}`；旧的 `sms.surgery` 键作废不再读）。
- **KR 医院设定**新增「英文名称 / 英文地址」（`hospEnCardHtml` / `saveHospEn`，存 `HOSPITAL_DATA[h].nameEn / addressEn`，要 `canDo('clinic')`，记操作日志和 KR-14 通知）；`hospitalEn(hid)`：演示默认 H1 = SOSU Plastic Surgery / 100 Apgujeong-ro, Gangnam-gu, Seoul，H2 = Gangnam Beauty Clinic / 508 Nonhyeon-ro…；清空保存 = 退回韩文原文。
- 测试：selftest 新增 R42a；R15d / CAL1 / TD1 / R40a / R41a 的断言按新模板 / 新卡改过。A1 全套要在干净数据上跑（先 `gmcResetAll`），剩下的失败只有既有的 BK1c / BK2c / R21a。

## CMD-1019-14 补充（2026-10-19，追加；取代 CMD-1019-13 的「发送弹窗可切模板 / 语言」「地址一律用医院英文地址」「空腹小时从备注读」，旧文字保留作历史）
- 基准 **c490fcd**，单个提交，**未推送**，不带开关。**数据版本 51 → 52**（`MIGRATIONS` to:52：案件 `recommended` / `procedureItems` / `krScope.items` 里的麻醉旧备注「空腹 N 小时」转进新字段 `anesthesia.fast`，局麻清空；用户案件保留）。
- **发送弹窗**：拿掉模板版本按钮和「中文 / 印尼文之后加」，从哪张卡打开就用哪个模板（施术日期那行 `openSurgMsg(id)` = 施术日期通知；施术前 2 天卡 `openSurgMsg(id,'remind')` = 施术前提醒），标题写模板名，保留［短信］［WhatsApp］、预览可改、「模板在诊所设定里改」；`surgMsgVer` 删除；`SURG_TPLS` / `surgTplOf(ver, lang)` 的语言结构还在（之后加印尼文用）。
- **到院地址**：KR 确认 / 修改施术时间的到院地址默认 = 医院英文地址（`krDefaultAddress()` 读 `hospitalEn`），KR 可改；发给客人的模板读 `ks.address`（空才退回医院英文地址）；KR 改了地址 → `surgMsgKey` 变 → 照旧「请重新发送」。
- **麻醉「需空腹（小时）」**：新字段 `anesthesia.fast`（数字，选填）；KR 表单（发送诊疗方案 / 补加可选项目 / 到院添加、更换，共用 `krProjDetailHtml`）选睡眠 / 全麻才出现这一栏，局麻没有（`krAnesSet` 换麻醉方式会重画表单、局麻清空数字；`krDet.anesFast`，`anesFastClean(d)`）；规则 `anesFastOf(an)`（rules.js）：有 `fast` 键 = 以数字栏为准，没有这个键的旧数据才从备注读「空腹 N 小时」；`anesDisplay(an)` 显示麻醉时补「需空腹 N 小时」。项目默认资料 `p.defaults.anesNote` 带出到表单时用 `anesFastParse` 转数字。短信的麻醉行（`surgAnesText`）只读数字栏；多个项目时仍有总提示句。待付款在韩加项的［修正］保留原空腹数字（`coreAddOnEdit`）。**项目库默认资料编辑页没有加这一栏**（任务没写）。
- 测试：selftest 新增 R43a；R42a / R41a / R15d 等按新弹窗改过。A1 全套在干净数据上只剩既有的 BK1c / BK2c / R21a。

## CMD-1019-15 补充（2026-10-19，追加；取代 CMD-1015-15 的［打印］内容（面诊内容翻译版 + 推荐整理 + 确定项目 + 备注），旧文字保留作历史）
- 基准 **f8f09fe**，单个提交，**未推送**，不带开关，**数据版本不变（52）**（诊所设定新字段按需读取，没有就用默认值）。
- **IN 赴韩施术 tab［打印］**（data.js `printKrPlan`，仍先预览再［确认打印］）改成「给客人带去韩国用」，**不写金额、先只中文**：抬头（客人 / Case ID / 诊所 / 负责室长 `actingName()` 与诊所电话）→ 1 行程概要（到院日期时间韩国 / 印尼、医院英文名 `hospitalEn`、到院地址 `ks.address`（空退回医院英文地址）、建议在韩天数 = 施术项目 `stay` 最大值 + 最早可回国日期 = 施术日 + 天数）→ 2 施术项目（施术写麻醉方式 + 空腹小时，管理项目写 `mgmtQtyText`「N 份（共 M 次）」）→ 3 日程表（`printPlanSchedule(c)`：施术 + 术后管理（已预约用预约时间和地点，没预约 = 施术日 + 所需术后管理的第 N 天，地点「韩国」或「韩国或印尼（以预约为准）」）+ 管理项目（施术日 + 第一次使用天数 + 间隔，每次一行）；按日期时间排，表下注明「以上为建议日期，以医院实际安排为准」）→ 4 术前准备（空腹 `anesFastOf`、携带护照（`passportAlert`：过期 / 施术前到期 / 未登记红字提醒，不印护照号）、诊所设定里的固定注意事项）→ 5 日程确认与变动（诊所设定模板，变量 `{coordinator}` `{phone}`）→ 6 备注（IN 室长备注 `c.recInNote`）。拿掉了院长面诊内容、推荐项目整理。
- **诊所设定新增「赴韩施术计划打印」两栏**：`CLINIC_SETTINGS.printPrep`（术前准备注意事项，一行一条，默认 `PRINT_PREP_DEFAULT`）、`printConfirm`（日程确认与变动，默认 `PRINT_CONFIRM_DEFAULT`）；旧设定没有这两个键时用默认值（`clinicDraftFresh` 补默认、`clinicDiff` 不把默认算修改）。
- 测试：selftest 新增 R44a（抬头 / 六段 / 无金额 / 无面诊内容和推荐整理 / 麻醉与空腹 / 护照提醒与红字 / 日程表排序 / 诊所设定改了就按新的打印）。

## CMD-1019-16 补充（2026-10-19，追加；取代 CMD-1019-12 / 13 / 14 里「KR 改日期 / 时间 / 地址后变回未发送、请重新发送」「［再发一次］」「施术前 2 天卡发完显示已发送」，旧文字保留作历史）
- 基准 **6fe763c**，单个提交，**未推送**，不带开关，**数据版本不变（52）**（新增可空字段 `c.surgInformKey` / `c.surgPhone`，旧数据取两条发送记录里较新的那条的 key）。
- **「通知过客人的那一版」**（calalign.js `surgInformKey(c)`）：施术日期通知 / 施术前提醒 / 电话通知三者里最近一次的 `date|到院时间|地址`；`surgMsgSent(c)` = 当前这一版已通知过；`surgChanged(c)` = 通知过之后 KR 又改了（`surgChangeText` 写「施术时间已变更（原 … → 新 …，韩国时间）」/「到院地址已变更（原 → 新）」）。
- **施术日期那一行**（`surgSendHtml`）：从没通知过 =［发送给客人］（含「没发过时 KR 改时间」）；通知过且没变 = 只显示「✓ 已发送（方式，时间）」，**没有［再发一次］**；通知过后 KR 改了日期 / 时间 / 地址 = 红字「⚠ 施术时间已变更（原 → 新），请电话通知客人」+［已电话通知］（`openSurgPhone` 小 Modal 可填备注 → `confirmSurgPhone`：`c.surgPhone = {key, from, at, note, by}`、`c.surgInformKey` 更新，Timeline「已电话通知客人：…；备注：…」，之后显示「✓ 已电话通知（时间）」+ 备注）。施术前提醒发过之后改时间同样走电话，不重发提醒。
- **待办**：没通知过 =「KR 已确认施术时间：发送给客人」；通知过后又改 =「电话通知客人时间变更：…」，按完消失。
- **施术前 2 天卡**：`surgRemindSent(c)` = 发过一次就不再出现（`c.reminderMsg` 存在即算，不看 key）；发完卡片整个消失，记录留在 Timeline 和短信发送记录（类型「施术前提醒」）。
- 测试：selftest 新增 R45a（没发过改时间仍是发送 / 发过只显示已发送 / 改时间红字 + 已电话通知 + 待办 + 备注 + Timeline / 提醒发完卡片消失 / 提醒发过后改时间走电话）；R15d / R42a 等引用「再发一次 / 变回未发送」的断言改过。

## CMD-1019-17 补充（2026-10-19，追加；取代 CMD-1019-15 的「最早可回国日 = 施术日 + 天数（含自由文字天数）」写法和 CMD-1012-02 的「推荐在韩时间」自由文字，旧文字保留作历史）
- 基准 **beba5cd**，单个提交，**未推送**，不带开关。**数据版本 52 → 53**（`MIGRATIONS` to:53，用户案件保留）。
- **建议在韩天数规则**（rules.js）：施术日 = 第 0 天；最少天数 `stayMinOf(entries)` = 这个施术「必须在韩国」（`place` 不是 `either`）的术后管理里最后一次的第 N 天 + 1，没有 = 1 天（entries 可以是表单行 `start` 或项目快照行 `startDay` / `day`）；KR 可往上加、**不能少**；比最少多**必须写停留原因** `stayReason = {tags:[术后需静养 / 不宜搭飞机（带 X 天）/ 消肿观察 / 其他], fly, note}`（`STAY_REASON_TAGS`、`stayReasonText`、`stayReasonOk`：只选「其他」要写文字）。项目快照新字段 `it.stayReason`（只有天数 > 最少才存）。
- **KR 表单**（kr.js，诊疗方案 / 补加 / 到院添加、更换共用 `krProjDetailHtml`）：「建议在韩天数」数字栏（取代自由文字「推荐在韩时间」），没动过 = 自动跟着最少天数走（`krStayState`：`d.stayTouched`），下面一行写「施术日 = 第 0 天；最少 N 天（第 7 天需在韩国拆线，至少 N 天）」，填少了红字挡住，多了出现「停留原因」勾选 + 补充；提交时 `krStayCommit(name, label)`（`krSubmitReport` / 补加 / `krDetailOf` 都调）：少了 / 多了没写原因 → 报错挡住；通过后存 `it.stay = 'N天'` + `it.stayReason`。多项目：整趟 = 各施术项目最大值（`stayPlanOf(items, 施术日)`：原因来自最大的那些项目，原因相同只写一次，不同带项目名）。
- **显示**：`stayLineText(plan)`「建议在韩停留 8 天（最早 2026-11-08 可回国）：第 7 天需在韩国拆线」/「…：术后需静养、7 天内不宜搭飞机」——IN 推荐项目整理（`recSummaryHtml(..., {base: 施术日})`）、赴韩施术计划、打印行程概要（取代 15 的算法）；逐项行里写「推荐在韩 N 天（原因）」。最早回国日 = 施术日 + 建议天数。
- **项目库默认资料**（`krpEditor`）：新增「需空腹（小时）」（睡眠 / 全麻才有）、「建议在韩天数」（数字，不填 = 发诊疗方案时自动最少天数）+ 停留原因（`krpStayHtml`，保存时同样校验：少于最少天数 / 多于最少没写原因都挡住）；发诊疗方案时 `krDefaultsDetail` 带出（天数 ≥ 最少才算动过）。演示默认资料用 `stayDefaultsFix` 整理：天数不足提到最少，多的补默认原因「术后需静养」。
- **旧案件处理（迁移 53）**：案件里 `recommended` / `procedureItems` / `krScope.items` 的施术项目，建议天数少于最少天数的 → **自动提到最少天数**并写进迁移备注（案号 + 项目 + 原天数 → 新天数）；多于最少天数但没有停留原因的不改（显示时不写原因）。
- 测试：selftest 新增 R46a（最少天数算法、整趟取最大值、最早回国日、迁移 53、打印 / 推荐整理的行程文字；KM1：自动 8 天 / 填 5 被挡 / 第 3 天拆线填 8 要写原因 / 项目库默认资料有空腹栏和天数栏）。

## CMD-1019-18 补充（2026-10-19，追加；取代 CMD-1015-22 / 1015-26 里「到院前今日案件卡列已付定金框 + 项目表 + 卡内［客人已到医院］」，旧文字保留作历史）
- 基准 **1c25286**，单个提交，**未推送**，不带开关，**数据版本不变（53）**。
- **KR 案件页「到院」状态卡**（kr.js `krArriveCards` / `krArriveCardsHtml`，`krRenderCaseDetail` 把它放在页头下、tab 上）：今天有一次到院、客人还没到时出现——主案件 = 施术时间已确认（`scheduleState==='Confirmed'`）、没标已到院、日期 ≤ 今天；子案件 = 今日案件组里 `coreVisitState==='pending'`。卡内：当前状态（赴韩施术 · 待到院 / 术后管理 · 待到店）+ 一行重点「今天 11:00（韩国）· 施术：…」（子案件「今天 15:00（韩国）· A000006-1 术后复诊…」）+ 室长才有的［客人已到医院］/［客人到店］（实心）［修改时间］（主案件：展开 `krSurgHead(c, true)` 的编辑区；子案件：`krSubTimeOpen`）［备注］（`krArriveMemoOpen` → `c.krProgressMemo`，IN 只读）；子案件没到当天时按钮灰 +「模拟到当日（演示用）」。**院长 / 代表院长只显示信息，没有按钮**；**非当天照旧**（没有状态卡，今日 / 预约案件卡照现在）。tab 和内容照常展开，不收起。
- **拿掉重复**：到院前的今日案件卡（主案件 / 子案件）只留一行「【主案件】A000001 今天 11:00 待到院」，不再列已付定金项目框 / 项目表，卡内的到院按钮拿掉（只留状态卡那一个）。按到院（`krArriveMain` / `krArriveSub`）→ 先切到项目 tab 再标已到 → 状态卡消失，进 Step 1 院长评估（子案件进入确认项目）。
- 测试：selftest 新增 R47a（KM1 / KD1：状态卡位置、按钮、今日案件只留一行、按到院进 Step 1、院长无按钮、非当天没有状态卡）；子案件的状态卡 / 到店用 `pcStage` 夹具手动验证过，没有单独写断言。

## CMD-1019-19 补充（2026-10-19，追加；取代 CMD-1014-17 之前 KR 案件页「来源诊所 / 院长 / KR 室长」卡片和名字旁的 Case ID，旧文字保留作历史）
- 基准 **986c354**，单个提交，**未推送**，不带开关，**数据版本不变（53）**。
- **KR 案件页页头**（kr.js `krRenderCaseDetail`，含院长账号）：名字旁不再放 Case ID；「来源诊所 / 院长 / KR 室长」那行卡片拿掉，改成名字下面一行灰色小字（同 IN 案件页）：「A000004 · 来源诊所：GMC 合作诊所（雅加达）· 院长：KD1 院长 · KR 室长：KM1 室长」（面诊 tab 里院长不重复写，面诊卡里有）；到院状态卡（18）紧接在这行下面，间距缩小。
- **职称只写一次**：「KM1 室长 실장」的来源是 `syncKrCoordinator` 给 `krCoordinator` 加了「 실장」、`coreSubmitReport` 的 `reportUploadedBy` 加了「 실장」（名字里本来就有「室长」）。已改：写入时不再加；旧数据显示时用 `krCoordText()`（rules.js，去掉结尾「 실장」）；`syncKrCoordinator` 顺手把旧值的后缀去掉；对话成员行「KM1 室长 실장 · 韩国室长」→「KM1 室长 · 韩国室长」；邀请室长视频的呼叫名单「X 室长 실장（韩国室长）」→「X 室长（韩国室长）」；KR 案件列表、案件页「提交」行都走 `krCoordText`。保留的「실장」：界面语言切成韩文时 `i18n.js` 里「室长 → 실장」的翻译（正常翻译，不是重复）、`callInitial` 取首字母时的兼容、演示的韩文对话原文。
- 测试：selftest 新增 R48a（页头一行小字、不是卡片、没有 실장、面诊 tab 不重复院长；`krCoordText` / `syncKrCoordinator`）。

## CMD-1019-20 补充（2026-10-19，追加；取代 CMD-1015-17 / 1015-22 里画面上的「主案件 / 子案件 / -1」叫法，旧文字保留作历史）
- 基准 **cf16f98**，单个提交，**未推送**，不带开关，**数据版本不变（53）**。
- **画面叫法**：不再叫「主案件 / 子案件 / -1」，叫「第 N 次到院」（施术当天 = 第 1 次，A000004-1 = 第 2 次…；rules.js `visitOrdNum` / `visitOrdText` / `visitWords`）。**资料结构 / 规格里「子案件」名称、存档里的编号（`dno` / `subCaseKey`）不动**。通知 / Timeline 里的子编号文字统一在 `tzRender` 里换成「第 N 次到院」（`visitWords`）。
- **KR 项目 tab 案件区块**：抬头「第 1 次到院 · 10/31 11:00 · 施术」/「第 2 次到院 · 预约来源：… · 11/02 14:00 · 术后管理」（今天写「今天 11:00」；最后一段 = 这次做什么：施术 / 术后管理 / 管理项目，多种用「、」连，`krVisitWhat`）；**案件页里不显示 Case ID / 子编号**；分组「今日案件 / 预约案件 / 完成案件」→「今天 / 已预约 / 已完成」；区块说明「每次到院一张卡；到店后从项目卡里选这次要做的项目，按［已完成］」；项目卡「预约时间」栏「（主案件）」→「（第 1 次到院）」；到院状态卡的一行重点也带「第 N 次到院」；回印尼做那块写「客人来做了才算一次到院」。
- **Timeline 分页**：全部｜第 1 次｜第 2 次｜第 3 次（`timelineTabsHtml`，IN / KR 共用）。**案件列表 ▼ 展开行**（IN / KR）：「第 2 次到院 · 11/02」+ 灰色小字 A000004-1；KR 案件列表搜索可以搜子编号。IN 端：术后管理卡 / 在韩 timeline 行里的 -1 编号也换成「第 N 次到院」（编号留在 title 提示里）。
- **页头**：名字行和下面小字行上下贴紧（小字行 `margin:-18px 0 0` 抵掉 `.content` 的 22px 间距，约 4px）；到院状态卡紧接在小字行下面（一般卡片间距）；**tab 下面加分界线**（原来用的 `--line` 变量根本没定义，所以看不到；改用 `--border`，同 IN）；**状态卡出现时（到院当天客人还没到）名字旁的状态标签不显示**，客人到了、状态卡消失后恢复。院长账号一样。
- 用词换掉的清单（写在汇报里）：KR 案件区块抬头 / 分组 / 说明、项目卡预约时间栏、回印尼做提示、持有管理项目说明、预约使用提示、Timeline 分页、案件列表展开行（IN / KR）、IN 术后管理卡 / 在韩 timeline 行、术后管理做完 / 无限延期的 Timeline 文字、通知 / Timeline 里的 A000004-1。
- 测试：selftest 新增 R49a；R47a / R17b 等引用「今日案件 / 【主案件】」的断言改过。

## CMD-1019-21 补充（2026-10-19，追加；取代 CMD-1019-20 第三部分「第 N 次到院」、CMD-1019-20 的 Timeline 分页「全部｜第 1 次｜第 2 次」，旧文字保留作历史）
- 基准 **5a5554d**，单个提交，**未推送**，不带开关，**数据版本不变（53）**（Timeline 阶段 / 类型 / 合并、术后第 N 天、多施术日最早回国日都是显示时推算，不改存档；唯一的存档改动是新写入的两类 Timeline 执行人 / 文字，旧记录靠显示层兜底）。
- **一 到院卡不编号**：标题 = 日期（星期）时间 · 这次做什么（`visitWhenLabel`：「10/31（五）11:00」，今天写「今天 11:00」；做什么按 施术 → 术后管理 → 管理项目 排序）；拿掉「第 N 次到院」「预约来源」；区块说明只写「每次到院一张卡；到店后从项目卡里选这次要做的项目」；已取消的到院（`kind:'end'`）整行划掉 +「已取消（项目全部延期）」，不影响其他卡；案件列表展开行、IN 在韩 timeline 行写「到院」，通知 / Timeline 里的子编号（A000004-1）由 `visitWords` 换成「到院（11/03）」（按案件号找到对应到院日期，找不到只写「到院」）；`visitOrdNum` 只留内部排序用。保留：列表展开行灰色小字编号、表格行悬停编号、资料结构里的「子案件」名称。
- **二 术后第 N 天**：`careDayText(c, 项目名, 日期)` / `careDayTag`（data.js）——术后管理项目旁写「（假体隆鼻 · 术后第 7 天）」，从**它对应的施术**的施术日算起（`itemSurgDate`：到院后另加的施术看它的 `visitKey` / 增加项目行日期，预约使用的施术看预约行，其余 = 主施术日），施术日 = 第 0 天，显示时推算，改期自动重算；用在 KR 项目卡术后管理分页（未预约 / 已预约 / 已完成）、KR 案件区块表格行、IN 术后管理卡。
- **三 多施术日的在韩停留算法**（`stayPlanOf(items, base, dateOf)`）：**原来**所有施术项目共用主施术日，最早回国日 = 主施术日 + 各项目建议天数的最大值；**现在**每个施术从自己的施术日算起，最早回国日 = 各施术「施术日 + 建议天数」里最晚的一个，停留天数 = 最早回国日 − 最早的施术日；只有一个施术日时结果和原来一样。打印 / 行程概要 / 推荐整理的「建议在韩停留 N 天（最早 … 可回国）：原因」都带 `dateOf`。旧案件：只有「到院后另加施术」的案件会变（最早回国日往后）；演示数据里没有这种案件，用户案件没有存这个值，所以不需要迁移。
- **四 Timeline 整理**（`caseTimelineBlockHtml`，IN / KR / 院长共用；`TL_UI` 记每个案件的阶段 / 类型 / 系统记录开关）：最上面一行阶段条（全部｜预约到店｜面诊｜项目确认 / 结算｜赴韩施术｜术后管理｜在韩管理｜本地管理｜结案，只列走过的，当前阶段标「● 当前」）；右边类型筛选 全部 / 进度 / 金额 / 沟通 / 资料（`tlTypeOf`，按文字关键词推算）+「显示系统记录」开关（默认关）；最新在最上面；按日期分组，小标题「10/31（五）· 施术」（`tlDateTitle`，到院日附做什么）；每行 时间｜谁｜做了什么，栏头注明「时间（印尼时间 / 韩国时间）」，行内时间不再各加（印尼）/（韩国）（`tzRender(t, true)`），约定的施术时间照旧写明；拿掉「KR确认 / KR标记 / KR室长提交…」前缀（`tlTextOf`）；合并（`tlMerge`，都可展开）：同一个人同一分钟 → 一行「确认所选施术项目、生成结算单…」；到店 / 退回 → 「到店 / 退回 ×N」；已到医院撤回 →「标记已到医院（撤回 N 次）」（先合并再过滤系统记录，所以系统退回也能收进去）；阶段推算 `tlStageOf`：确认项目 / 结算 / 付款归「项目确认 / 结算」不再归「面诊安排」；`logCaseEvent(c, actor, action, stage)` 新增可选第 4 个参数指定阶段。拿掉 20 的分页 `timelineTabsHtml` / `setTlPage` / `krSetTlPage`；案件里「本次记录」（`krSubTimelineHtml`）不动。
- **修正的文字 / 执行人**：「确认所选管理项目：自体脂肪移植」→ 按项目类型写「确认所选施术项目 / 管理项目」；「完成面诊费支付」「完成项目付款」原来写成执行人「客人」（实际是 IN 室长在系统里记的收款）→ 改记 `actingName()`，文字「面诊已确认并收款」；KR 视角原来把它改成「客人 开始面诊」（`viewerTextFilter`）→ 改成「面诊已确认（已收款）」；旧记录显示层把执行人「客人 + 这几句」显示成「IN 室长」；「Kr室长」→「KR 室长」（代码 + 显示层兜底旧记录）。
- **五 查「到店后反复被退回待访问」**：原因 = 离开页面（`beforeunload` / `pagehide`）时 `receptionLeaveNow` **当场**退回待访问；开发服务器（Vite）保存文件会让页面整页热重载，每次重载都触发一次「离开」→ 退回，所以测试时改代码、保存文件（间隔几分钟）就会出现「到店 → 退回」一轮一轮，每轮重新检测 메타뷰；另一个次要原因：后台分页的定时器被浏览器降速，心跳 45 秒过期偏紧。**修法**：离开页面不再当场退回，只把心跳设成「约 20 秒后过期」（`RECEPTION_LEAVE_GRACE`），刷新 / 热重载回来的页面马上写新心跳就保住；真的关了分页 → 任意分页的扫描按过期退回；心跳 TTL 45 → 90 秒。是测试操作造成 + 系统过早退回的合力，不是业务规则问题；已修。
- **六 多次项目**：购买后的显示项目名拿掉规格里的「·N次」（`buyName`，rules.js）：KR 项目卡管理项目分页、已付定金项目框、案件表格行、IN 持有批次规格显示 / 退款 / 结束案件文字 / 使用明细、Timeline；购买前（诊疗方案 / 补加 / 结算单选择）不动。今日进行项目里剩余次数（扣掉已安排的）> 1 的在韩持有管理项目可选这次用几次（`krQtyStepper` − 1 +，默认 1，最多 = 剩余；今日进行项目栏和今日案件的行都有；`coreTodayQtySet` / `it.todayQty`）；按［操作完成］才扣（`coreMgmtUse(c, name, by, qty)`），Timeline「使用 ONDA 提升 · 身体 60kj ×2（剩 4 次）」。**术后管理项目没做数量**：术后管理是一次一行的预约（不是一个有剩余次数的持有项目），每次预约 / 完成一行，所以没有「这次用几次」。
- **我的判断（待确认）**：用了 2 次以上后，下一次的建议日期按「已用次数 × 间隔」顺延（`krMgSuggest(c, it, used+已安排)`：原来就是这么算的，一次用 2 次 = 已用 2 次，下一次 = 第一次使用天数 + 2 × 间隔），不是「今天 + 间隔」；因为用 2 次是同一天做了两次，原计划的节奏（每隔 N 天）里这两次已经用掉，后面照原来的日期往后排。
- **顺带修**：IN 打开含「在韩持有」管理项目（状态「持有中 / 已用完」）的案件的赴韩施术 tab 会报错（`pillStyle` 缺这两项，`data.js` 赴韩项目行）；已补。
- 测试：selftest 新增 R50a（多施术日算法 / 术后第 N 天 / `buyName` / 今日进行 2 次 → 剩 4 / 共 6 / Timeline 阶段·合并·最新在上·日期小标题·栏头 / 接待退回宽限期）；R49a 改成新写法；R22b / R29b / R31b 的断言按新文字调整。coverage I8 同时认旧 / 新使用记录文字。**R21a 在整套里偶尔失败**（依赖 KR 营业时间 / 日期，单跑和基线都通过，与本次无关）。

## CMD-1019-22 补充（2026-10-19，追加；取代 CMD-1019-21 第六部分里「我的判断：用 2 次后下一次建议日期按已用次数 × 间隔顺延」和 CMD-1015-10 / 1015-17「施术做完自动结束到院、进术后管理」，旧文字保留作历史）
- 基准 **aa98507**，单个提交，**未推送**，不带开关，**数据版本不变（53）**（新增可空字段：案件 `endAsk` / `krArrivedDay` / `todayMgmtDone` / `visitEndedKeys`，持有项目 `uses[].qty`；旧数据靠运行时修复 `repairVisitState()`，不需要迁移）。
- **一 建议日期只是建议**：选进今日的项目就算这次到院用，不会因为没到建议日期被移出；提前只在项目名下写一行灰字「建议 10/25 起，今天提前使用」（`krEarlyHint`，今日进行项目栏和到院卡行都有），不拦、不弹确认。用过以后，后面的建议日期从**实际使用日**重新起算（管理项目 `krMgSuggest`：使用日 + 间隔；一次用 N 次 = 同一天用了 N 次，下一次 = 使用日 + 间隔；术后管理 `krProjCards`：同一条所需术后管理做完一次后，下一次 = 实际做的那天 + 间隔），**取代 21 里「已用次数 × 间隔」的判断**。
- **二 ONDA 从到院卡掉回项目卡的原因**：不是建议日期在挡，是「施术都完成就把这次到院当结束」——`holdLocalAdd` 把在韩持有的管理项目标成 `done:true`，`krCloseIfDone` 看项目都 done、行都完成就自动 `krProcedureDone`，到院卡变「已完成」，而已完成卡不画持有管理项目行，所以 ONDA 消失、回项目卡。现在每个项目各自完成：到院卡的行 = 施术 / 增加项目行 + 选进今日的持有管理项目（`todayOpenRows`），持有管理项目按完成后记 `c.todayMgmtDone[name] = {qty, at}`，到院卡里显示「已完成 ×2（剩 4 次）」（`mgmtDoneToday`）。
- **三 / 四 已使用**：一次用 N 次 = 同一个使用时间，`uses[].qty` 记次数；已使用表（`krUseEntries` / `krUsedRow`）栏位 项目｜次数｜使用时间｜在哪次到院（「10/31（五）· 施术」，`krVisitLabelByKey`）｜［查看案件］，同一次用 N 次合成一行 ×N（可展开明细），拿掉建议日期栏。旧记录次数对不上（一次用 2 次只记 1 条 → 原来显示成 2 行、第二行「—」）：显示时补到同一个使用时间，`repairVisitState()` 也把存档里的 `uses` 补齐（幂等）。
- **五 延长施术时间弹窗**（`krExtOpen`）：上半部分单选 不延长（默认）/ +30 分 / +1 小时 / +1 小时 30 分 / 自定义［　］分（选自定义才能填），点选项只是选中；底部靠右［取消］［确认］（确认实心）；拿掉自定义旁的［确定］和整行取消。`krExtPick(m)` 仍可直接调（测试用）。
- **六 灰按钮写原因**：`krBtn` 灰色时旁边加小字（`.kr-why`，同时 title）；项目卡［本次使用］的原因：待付款 / 未签麻醉同意书 / 客人未到店 / 次数用完（剩余次数都已安排）。
- **七 到院结束改人工确认**（`krCloseIfDone` 不再自动结束，只设 `c.endAsk`）：行都完成 / 取消后弹窗「今天的项目都做完了吗？」［还有项目］（到院保持进行中，可继续加项目 / 付款 / 本次使用）［今日完成］（`coreEndVisitToday`：没做完的退回项目卡、`krProcedureDone`、有术后管理进术后管理阶段，没有就结案）；到院卡一直有［结束今日到院］（手动弹窗，列出没做完的项目，有待付款项目不能结束）；其他到院（术后管理 / 管理项目预约）同样人工结束（`c.visitEndedKeys[key]`、`coreEndSubVisit`、`coreVisitState` 行都做完但没结束仍是「已到店」）；营业结束不自动结束，第二天 KR 待办「昨天的到院未结束：确认是否结束」（`todo.js` kind `endvisit`，主到院 + 其他到院）。**自动结束的触发点（原来）**：`coreSubDone`（逐行完成）、`coreSurgItemDone`、`coreTodayDone`、`coreTodayCancel`（取消最后一个）、`coreAddOnPaid`、`coreAddOnEdit / Delete`、`coreMgmtUse` 之后调 `krCloseIfDone` 都会直接结束，现在这些点都只设 `endAsk`。
- **八 重新打开**：结束后今天又有待做（加项目 / 付款后加进今天 / 本次使用）→ `updateCaseStage` 开头检测 `todayOpenRows`，`coreReopenVisit` 自动重开（`krProcedureDone=false`、阶段退回赴韩施术 · 在韩中、Timeline 记「重新打开今日到院」）；只重开今天的到院（`mainVisitDay` = `krArrivedDay` 或确认的施术日期）；`coreUseTarget` 在今天已结束时仍返回主到院，［本次使用］会重开。`deriveCaseStage`：今天还有待做项目时不进术后管理阶段。**数据修复** `repairVisitState()`（IN `boot-in.js` / KR `krBoot` 启动执行，幂等）：到院被标结束但今天还有待做的案件（A000004 类）→ 重新打开 + Timeline「重新打开今日到院（修正旧数据：…）」；同类案件一并检查（对所有案件跑一遍）。
- **顺带修**：`coreTodayCancel` 原来拿不到在韩持有的管理项目（`done:true` 被过滤），［今日取消］对持有管理项目实际是空操作，已修。
- 测试：selftest 新增 R51a（A1：到院不自动结束 / 管理项目仍在到院卡 / 提前灰字 / 按完成扣次 / 下一次 = 使用日 + 间隔 / 已使用 ×2 / 待付款不能结束 / 手动结束 / 本次使用自动重开 / 修复）、R51b（KM1：已使用表 / 结束弹窗 / 延长弹窗单选 / 昨天的到院未结束待办）；`ST.krCloseToday` 改成「完成 + 模拟按［今日完成］」，`ST.finishCare` 补结束其他到院；R18b / R20a 断言按新规则调整。

## CMD-1019-23 补充（2026-10-19，追加；取代 CMD-1019-22 里持有管理项目「已使用」的记法、CMD-1015-28 / 1019-21 项目卡术后管理分页的栏位和旧的单条［预约时间］小弹窗，旧文字保留作历史）
- 基准 **2063585**，单个提交，**未推送**，不带开关，**数据版本 53 → 54**（`MIGRATIONS` to:54，用户案件保留并迁移，迁移备注写明修了哪些案件）。
- **一 / 二 已使用 / 剩余次数只从到院卡的完成行算**（data.js）：`it.uses` = 每条对应到院卡里一行「操作完成」{at, key(main / 地点|日期 / book|占位id), qty, rowId}；`holdUsed` / `holdDone` 一律由 `holdRecalc(it)` 从 uses 重新算；记录只有 `holdUseRecord`（完成时）、撤回只有 `holdUseUndo`。**原来直接扣次数的地方（4 处）**：① `coreMgmtUse`（主到院按完成，直接 `holdUsed += q`）② `coreSubDone` 里持有项目使用行（`holdUsed++` + 记 uses）③ `krbook.js` 在韩到店预约完成时「使用在韩持有」只加 `holdUsed`、不记使用行 ④ 旧数据里有 `holdUsed` 没有对应完成行（含 21 之前施术做完后持有管理项目被漏算 / 掉回项目卡留下的记录）。①②③ 已改走 `holdUseRecord`；④ 由 `fixUseRecords(c)` 修：主到院的记录要有到院卡的完成行（`c.todayMgmtDone[name]`）或到院已结束；子到院的要有对应已完成的使用行（`rowId`）；占位预约的 `book|…` 保留；没有的去掉并把次数改回。**撤回 / 取消退次数**：到院卡里已完成的持有管理项目行（主到院）和使用行（子到院）都有［撤回完成］（`coreMgmtUseUndo` / `coreUseRowUndo`，`krMgmtUndo` / `krUseUndo`）：次数退回、行回到待做、主到院结束后撤回会重新打开；今日取消 / 取消本次本来就没扣过次数。
- **一 修 A000004 的 ONDA**：到院卡没有完成行、项目卡却显示「已使用 ×2、剩 4 / 共 6」→ 改回「没有已使用、剩 6 / 共 6」，建议日期按原规则（施术日 + 第一次使用天数）重算（没有使用记录就不会再从使用日起算）。**同类案件一并修**：迁移 54（`fixUseRecords` 跑遍所有用户案件）+ 启动修复 `repairVisitState()`（IN / KR 启动都跑，幂等，Timeline 记「修正使用记录：…」）。
- **三 项目卡术后管理按施术分组**（kr.js `krProjCards`）：分组标题「施术名 · 10/27 施术」+［一起预约］（未预约组），卡片右上［全部预约］；组内 项目｜术后第 N 天｜地点｜次数｜建议日期｜操作（拿掉「对应施术」「管理间隔」栏和项目名后括号里的施术名）；已预约 / 已完成同样分组。
- **三 只留一个预约弹窗**（kr.js `krCbOpen` / `krCbRender` / `krCbGo`，旧的单条小弹窗 `krBkdOpen('care')` 和今日进行后的 `krCareMini*` 都转到它）：打开就列出所有未预约项目（`careSlotList`，多次项目自动展开成多行，按间隔排日期，日期默认建议日期，用过后从实际使用日起算）；入口：单条［预约时间］只勾那一条、［一起预约］勾这个施术的全部、［全部预约］全勾、今日进行后自动弹出全不勾；每行 勾选｜项目（术后第 N 天）｜日期｜时间（默认医院营业开始时间）；「韩国或印尼」的项目多一个「在韩国做 / 回印尼做」，默认在韩国做，选回印尼的这里不约、交给 IN；休诊日 / 营业时间外 → 该行红字、自动不勾、不能约；晚于最早回国日 → 橙字提醒不拦；术后管理不占院长时间；**同一天的项目合成一次到院**（`coreCareBook` 按「地点 + 日期」建 / 并入到院，弹窗下方预览「将建 N 张到院卡」+ 每张「11/30（一）· 术后管理：拆线、术后消肿管理」，那天已有到院写「并入」）；底部靠右［取消］［确认预约］。顺修：弹窗标题不再写成施术名、日期默认建议日期、按钮顺序。
- 测试：selftest 新增 R52a（A1：假记录修复 / 迁移 54 / 撤回退次 / 完成才记）、R52b（KM1：分组栏位 / 三种入口勾选 / 多次展开 / 休诊红字 / 同天合并预览 / 确认后建到院卡）；R28b / R29b / R30b 的栏位断言和预约弹窗步骤按新弹窗改过。

## CMD-1020-01 补充（2026-10-20，追加；取代 CMD-1019-22 里「灰按钮写原因：客人未到店」和 CMD-1019-23 里每个施术组的［一起预约］、卡片右上［全部预约］，旧文字保留作历史）
- 基准 **4f72de9**，单个提交，**未推送**，不带开关，数据版本不变（54），只改画面（没跑 roletest）。原则：按钮只在当下真的能用时才出现，不摆灰按钮再写原因（到院进行中但暂时不能用的除外）。
- **一 没有进行中的到院不显示［本次使用］**（kr.js `krProjCards` 的 `useBtns`）：进行中 = 主到院 `hasArrived && !krProcedureDone`，或子到院 `coreVisitState==='arrived'`；今天没有进行中的到院（客人没到院 / 今天的到院已结束）→ 施术项目、管理项目的「未使用」行只留［预约时间］，没有［本次使用］，也没有「客人未到店」小字；有进行中的到院 → 照常显示［本次使用］，暂时不能用（待付款 / 未签麻醉同意书 / 次数用完）灰按钮 + 原因。项目卡顶部说明改成「［本次使用］只在客人已到院、到院进行中时出现；［预约时间］按日期建立 / 并入那天的到院」。（核心 `coreUnitUseNow` 的「结束后自动重新打开」仍保留，只是画面上结束后不再出现［本次使用］，要继续加项目走［增加项目］。）
- **二 预约按钮统一叫［预约时间］**：施术项目 / 管理项目的［预约使用］改名；弹窗标题「预约时间：项目名」；案件 Timeline「预约使用：…」→「预约时间：…」；预约产生的行内容「（预约使用）」→「（预约）」；管理项目预约弹窗（`krBkdRender`）按钮顺序改成［取消］［确认预约］（和术后管理弹窗一致）。
- **三 术后管理分组标题** 只写「施术名 · 10/27 施术」，拿掉［一起预约］；单条［预约时间］照旧，点了打开同一个弹窗、只勾那一条（`krCbOpen({surg})` 入口保留在代码里，界面没有入口）。
- **四 ［全部预约］** 移到「未预约 N」那一行右边（只在术后管理 tab）；项目卡右上角只留［增加项目］。
- 测试：selftest 新增 R53b（KM1：到院进行中 / 已结束 / 没到院三种状态下施术、管理两个 tab 的按钮，术后管理分组标题和［全部预约］位置）；R52b 里的断言改成「没有［一起预约］、［全部预约］在未预约行」；顺手让 R24b / R29b 避开周日（医院休诊，原来按今天 +40 天 / 建议日期会落在周日而随日期偶发失败）。

## CMD-1020-02 补充（2026-10-20，追加；取代 CMD-1019-23 里术后管理分组的「灰色分隔行」样式和 `cal-switch` 分段 tab，旧文字保留作历史）
- 基准 **3560ea4**，单个提交，**未推送**，不带开关，数据版本不变（54），**只改项目卡样式**（不动功能 / 数据 / 文字，没跑 roletest）。设计图我这边读不到，按任务文字实现。
- **术后管理 tab：每个施术一张独立的卡**（kr.js `careSec`）：白底圆角 12 的卡，卡标题 = 施术名（加粗放大 15px）+ 旁边浅色标签「10/29 施术」；卡里有自己的表头（栏名沿用：项目｜术后第 N 天｜地点｜次数｜建议日期｜按钮）；卡和卡之间留 10px 间距（取代灰色分隔行）；已预约 / 已完成分组同样样式；［全部预约］仍在「未预约 N」那一行右边。
- **按钮**（`krOutBtn`，三个 tab 一致）：线框按钮、比原来大一点（padding 6×14、圆角 8）；［预约时间］前面带日历图标（`KR_ICON_CAL`，内联 SVG，线条跟随文字色）；［本次使用］同样线框样式（没有图标）；灰按钮旁仍写原因；不加「…」更多菜单。操作列加宽（术后管理 150px、施术 / 管理 tab 230px）以放下两个按钮。
- **tab**：施术项目 / 术后管理 / 管理项目改胶囊形（选中实心深色 `var(--navy)` + 白字，未选中浅色底 `bg-sidebar`），代替 `.cal-switch`。
- 不变：栏名、日期格式（26-11-02）、整体行距 / 字号 / 卡片底色；施术项目、管理项目两个 tab 不分组。
- 测试：R52b 的分组标题断言改成「10/29 施术」标签（不再是「施术名 · 10/29 施术」同一行文字）。A1 全套 119、KM1 批次 34 全部通过。

## CMD-1020-03 补充（2026-10-20，追加；取代 CMD-1020-02 里按钮图标放在［预约时间］前面的写法、CMD-1019-22 / 23 里管理项目［预约使用］的单独弹窗，旧文字保留作历史）
- 基准 **3987cca**，单个提交，**未推送**，不带开关，数据版本不变（54），没跑 roletest。
- **按钮统一**（kr.js `krOutBtn`）：［全部预约］线框 + 日历图标（术后管理 tab、管理项目 tab 都有）；**每一行的按钮都不加图标**，只用线框：［预约时间］［本次使用］［修改时间］；已预约行的［修改时间］从文字链接改成线框按钮（施术项目 / 术后管理 / 管理项目三处）；［查看案件］仍是文字链接。
- **管理项目 tab 加［全部预约］**（在「未使用 N」那一行右边，`krMgSec` 第 4 个参数）→ 打开**同一个预约弹窗**（`krCbOpen({all:true, tab:'mgmt'})`）；管理项目行的单条［预约时间］ = `krCbOpen({mgmtOne:名})`（只勾那一项）；原来管理项目的单独预约弹窗（`krBkdOpen('use')`）不再用于管理项目（施术项目的预约仍走原弹窗，因为要选院长）。弹窗里每个有剩余次数的持有管理项目一组：「可约 N 次，这次约 [− n +] 次」，默认 1，最多 = 剩余次数 − 已预约；选几次展开几行（`krCbMgQty` / `krCbMgRows`），日期从建议日期起按管理间隔排（`krMgSuggest`，用过以后从实际使用日起算；ONDA 间隔 6 天选 3 次 → 12/04、12/10、12/16 类），每行日期 / 时间可改、可取消勾选；展开的行跟着第 1 行的勾选。弹窗标题改叫「预约时间」（里面既有术后管理也有管理项目），术后管理的规则不变（休诊 / 营业时间外红字不能约且自动不勾、晚于最早回国日橙字、同一天合成一次到院、那天已有到院并入）；预览写「术后管理：…；管理项目：…」。确认时管理项目逐行 `coreUnitBookUse(c, 项目名, 日期, 时间, 人, '')`（不占院长时间：和术后管理一致，不查院长冲突，只查休诊 / 营业时间 —— 我的判断，原来管理项目预约会按院长日程查冲突，待确认）。
- 弹窗行数据多了 `kind`（`'care'` / `'mgmt'`）；care 行才有 `x` / `i` / `sdate`；测试里按 kind 过滤。
- 测试：selftest 新增 R54b（按钮图标 / 线框 / 修改时间按钮 / 查看案件文字；管理项目全部预约 / 单条 / 选 3 次展开 / 同天合并 / 休诊红字 / 确认后建 2 张到院卡 / 没有单独弹窗）；R29b / R52b 里按 kind 过滤、弹窗标题断言改成「预约时间」。A1 全套 119、KM1 批次 35 全部通过。

## CMD-1020-04 补充（2026-10-20，追加；取代 CMD-1013-08 / 1014-19 里「术后管理每个子项一个日历块」「IN 本院周起始 = 今天 / 周一」，旧文字保留作历史）
- 基准 **bda9187**，单个提交，**未推送**，不带开关，**数据版本不变（54）**（没有改资料结构，日历块都由现有子项现算）。
- **一次到院 = 一个块**（data.js `visitCalBlocks(c)`，按 `subCaseList` / `subCaseRows` 分组：同一天同地点（韩国）合并）：块里写这次做什么（`what`：施术 / 术后管理 / 管理项目，「、」连）；含施术预约使用（`surgUse`）= 施术块（`type:'施术'`，占院长时间，按 60 分钟占位）、否则 = 术后到店（`type:'术后管理'`，画在医院层、不占院长、`noCap`）；和主施术同一天的并进主施术块（label 加「同日：…」）。**根因**：`krcEvents` 原来对每个在韩子项各画一块，同一天两条术后管理就是两块，而且 `surgUse` 行也被当成术后到店（绿色），所以 11/02 开内眼角施术那天是绿色块。KR 日历（`krcEvents` / `krcOneLine`）和 IN 的 KR 医院日程（`krDayItems`）共用这个函数；旧数据不用修（现算）。
- **IN 的 KR 医院日程**（ui.js `krDayItems`）：除了 `directorSchedule` 里的施术 / 面诊 / 占位块，再加本诊所所有案件的到院（不管谁约的；原来看不到的是 KR 在韩国预约的术后到院 / 管理到院 / 施术预约使用，它们只存在子项里没有 `directorSchedule` 块）：含施术 = 施术色（`krBlockStyle` 的本诊所施术改成 KR 图例的施术色 `#F3DFD3`，原来是绿色）、术后 / 管理到院 = 绿色（新类型 `visit`，不占容量 / 不计入约满），点开进 IN 案件页。**其他诊所**：只有含施术、占院长时间的到院显示无字灰块（经 `Store.readClinic` 读同一医院对接的其他诊所分区，单一院长视角才画），术后到院不占院长时间不显示；不显示名字 / 内容 / 金额。
- **IN 汇总通知**（kr.js `krCbNotifyIn`）：KR 在预约弹窗一次确认多项 → 只发一条「KM1 室长 为 客人 在韩国预约了 N 次到院：日期时间（项目）、…」（N = 到院次数，同一天合并；回印尼做的不算）；改时间 `coreSubTimeEdit` / 取消本次 `coreRowCancel` / 延期 `coreRowPostpone` 各发一条；都带 `caseId`（点开进 IN 案件页）。IN 赴韩施术计划［打印］的日程表（`printPlanSchedule`）加入 KR 在韩预约的施术项目 / 管理项目到院（用预约时间，已预约的次数不再重复列建议日期）。
- **预约弹窗日期带星期**：每行日期输入框下一行小字「2026/11/21（六）」（rules.js `ymdWeekText`），改日期重画时跟着变。
- **周视图统一周日起、默认当前周**：`getWeekStart` 恒为周日（原来直接进工作台是「今天在第一栏」，从月视图点进来才是周一起）；KR 日历 `krcAnchor()` 在周视图永远返回该周周日（`krcWeekStartMon` 现在是周日起，函数名沿用），月视图表头 / 起始改周日在前；IN / KR 默认都是周视图（`todo.js` 原来启动时切日视图）。
- **KR 周视图格子高度**：`KRC_PX` 周视图 = 112px/小时 = IN 本院周视图每 30 分钟 56px（`.wk-cell` min-height）；用户看到的「IN 约 76px」是 IN 默认日视图（`calDayPx`），现在两边默认都是周视图；日历外层 `.wk-scroll` / `.krc-outwrap` 高度同为 `calc(100vh - 300px)`，卡片内部滚动、待办栏同高（1440×900 实测：日历内容区 600px，待办栏 732px，页面不被撑高）。
- 测试：selftest 新增 R55a（A1：合并、IN 日程显示、其他诊所灰块、星期、周日起、打印）、R55b（KM1：KR 日历一个块、汇总通知只一条、周锚点周日）；A1 全套 + KM1 批次通过，roletest 9 个账号 316 格 0 不符。

## CMD-1020-05 补充（2026-10-20，追加；取代 CMD-1020-03「管理项目不占院长时间」的判断和 CMD-1019-23 里「地点：韩国或印尼」需要有印尼对应项目才有地点选项，旧文字保留作历史）
- 基准 **656e6cc**，单个提交，**未推送**，不带开关，**数据版本不变（54）**（新增字段都是项目库 / 子项行上的可空字段：项目 `dirOp` / `dirMin`、行 `dirOp` / `dirMin` / `extendMin` / `director`、案件 `todayDirOp`，没有项目的一律等于「否」，旧数据行为不变）。
- **一 施术 / 管理 tab 分组卡片化**：`krPcSec` / `krMgSec` 标题（未使用 N / 已预约 N / 已完成 N）放卡外，表格装进圆角 12 卡片，栏位 / 按钮不动，［全部预约］仍在「未使用 N」行右边。
- **二 地点选项没出现的原因**：23 / 24 做的弹窗里「在韩国做 / 回印尼做」要求条目有**印尼对应项目**（`canIn = place==='either' && !!innName`，`coreCareBook` 也是 `place==='IN' && x.innName` 才算回印尼）；Ayin 的「术后消肿管理」地点是「韩国或印尼」但没填印尼对应项目，所以弹窗没有下拉、预约后一律变韩国。**修**：`canIn` 只看 `place==='either'`；`coreCareBook` 选回印尼 = 只看 `place==='either'`（印尼对应项目名可空，内容写「（回印尼做）」）；选回印尼的这里不约（交给 IN，只记建议日期）。**已预约改地点**：［修改时间］弹窗对「韩国或印尼」的术后管理行加「在韩国做 / 回印尼做」（`careEntryOfRow`），改回印尼 = `coreCareToIn`：这行 place 改 IN（韩国那次到院按 `subCaseKey` 自然消失，那次到院没有别的项目整张没了）、Timeline 记「术后管理改回印尼做…」、IN 收一条通知（`caseId`，点开进案件）。
- **三 项目库「院长操作」**：KR 项目库术后管理项目（「韩国术后管理」分类）和本地管理项目（管理项目）的编辑页都加「院长操作 否 / 是」（默认否），是 → 「院长所需时间（分钟）」默认 30（`dirOpEditHtml` / `krpDirOp` / `krlDirOp`；字段 `p.dirOp` / `p.dirMin`；`dirOpInfo(hid, 名字)` 按名字查，术后管理按「具体项目」`x.name`，管理项目按项目名取「·」前）。**预约**（`krCbOpen` / `krCbCheck` / `krCbGo`）：院长操作行多一个院长下拉（默认案件的院长，`r.dir`）+「院长操作 N 分钟」；用 `krSurgerySlotError` 查院长是否有空（OFF / 已有施术或面诊 / 预约 / 其他院长操作到院重叠 → 红字、自动不勾、不能约；并进已有到院时那次到院自己不算冲突，`exceptRowIds`）；日历 / 冲突检查 / 当天日程（`krDayAgendaHtml`）统一读 `visitCalBlocks(c)` 的 `occupies`（含施术预约使用或院长操作行），**不再按行 +30 分钟**（`krDirectorRowsAll` 改成每次到院一条带起止）。**一次到院多个院长操作项目**：第一个按项目库时长（施术预约使用 60 分钟），第二个以后（含并进已有的施术日 / 院长操作到院）弹窗「延长院长时间？」（`krExtOpen` 加 `{start, dur, day}` 参数，和施术延长同一个弹窗；单选不延长 / +30 分 / +1 小时 / +1 小时 30 分 / 自定义，默认不延长，［取消］［确认］），**一天弹一次并标明日期**，延长存在第二个行的 `extendMin`，到院总长 = 第一个时长 + 其余延长（`visitCalBlocks`）；延长后整段还要对得上院长日程（冲突直接 `krBlock` 挡住）；并进主施术日的延长由 `surgeryMinutes` 读行的 `extendMin`；院长操作 = 否的项目不占时间不弹。［修改时间］（`krTimeEditSave`）对院长操作行按 `dirMin + extendMin` 查院长冲突。**［本次使用］**加进今天的院长操作管理项目（`krUnitUseNow`）：已有占院长时间的到院（主施术日 / 子到院）→ 弹同一个延长弹窗；主到院记 `c.todayDirOp[名]`（`surgeryMinutes` 加上延长，主施术块标「院长操作：…」），子到院的「使用」行带 `dirOp` 字段。**日历**：KR 日历（`krcEvents`）/ IN 的 KR 医院日程（`krDayItems`）一次到院一个块，含院长操作 = 挂在院长名下、标「（院长操作：项目）」，不再进「医院层」；其他诊所的院长操作到院在 IN 只显示无字灰块。**院长工作台今日提醒**：`todo.js` 新待办 kind `dirop`（院长账号，今天的院长操作到院，「院长操作：ONDA 提升」，截止 = 到院时间，点开进案件）。
- 我的判断（待确认）：项目库「院长操作」只加在术后管理项目 / 管理项目的编辑页，施术项目不需要；院长操作行的院长名读行上的 `director`（弹窗里选的）；院长操作到院的块在 KR 医院层日历也显示在该院长名下（以前术后管理画在医院层「全院」）。
- 测试：selftest 新增 R56a（KM1 分页，需要 pcStage 夹具：地点选项 / 选回印尼不建到院 / 已预约改回印尼 / 项目库院长操作 / 30 + 延长 30 = 60 分钟 / 日历一个块 / 冲突 / 卡片样式）；A1 全套 121 通过，KM1 批次 20 个 + CAL2/3/5/8 通过，roletest 9 个账号 316 格 0 不符。

## CMD-1020-06 补充（2026-10-20，追加；取代 CMD-1020-04 里到院卡「院长」写在表格下、CMD-1015-17 / 1019-19 里子案件卡「本次记录」，旧文字保留作历史）
- 基准 **c02f592**，单个提交，**未推送**，不带开关，**数据版本不变（54）**，没有迁移（旧 Timeline 记录靠显示时修正，见下）。
- **一 白底**：今天到院卡（`krCaseCardHtml`）固定白底，拿掉 `.kr-sub-hl` 高亮类（黄色底 + 左边条；`KR_SUB_HL` 只用来滚动定位，不再改样式）和表格外层的内层粉色底（`var(--surface2)`），「已到店」状态标签保留。
- **二 拿掉「本次记录」**：到院卡里不再列 `krSubTimelineHtml`（函数留着没调用），也拿掉表格下飘着的「KD1 院长（院长）」；院长写在**标题行**「· 院长：KD1」（`krVisitDirTag`：这次到院有施术或院长操作项目才写，没有不写）。IN 的术后管理卡原来就没有本次记录。
- **三 / 四 名称写法统一**（data.js `visitRowType` / `visitRowLabel` / `visitRowLabelHtml`；KR 到院卡表格 `krTblRow`、主到院的持有管理项目行、IN 的术后管理卡 `inPostcareCardHtml` 共用，`krRowType` 改成转调 `visitRowType`）：施术只写名称（「开内眼角」，去掉「（预约）」「施术：」）；术后管理 = 具体项目名（`careEntryOfRow` 对到所需术后管理的 `x.name`）+ 灰字「对应施术 · 术后第 N 天」；管理项目 = 名称 + 灰字「剩 N / 共 M 次」；地点单独一栏，名称里不写「在韩国」，不写「（持有项目使用）」。**「术后第 N 天」只出现在术后管理行**（原来 `careDayTag` 给所有子项挂，施术行写「第 0 天」、管理项目写「第 2 天」）。
- **六 Timeline 日期写错的原因**：日志文字里写的是这一行的「行号」`A000001-03`（`subNextNo`，每加一行 +1），而显示时 `visitWords` 把 `A000001-3` 当成「到院编号」（第 3 次到院）去找日期，所以第 3 次到院是 11/07 时，11/02 那一行就被写成 11/07。**修**：`visitWords` 对两位数字的编号先按行号找那一行自己的日期（`row.no===编号`，同一案件号有多家诊所时取含这一行的那个案件），找不到再按到院编号；旧记录不用迁移，显示时就对了。**类别**：这些行的阶段原来都按案件当前阶段写「术后管理」；现在完成 / 客人已到 / 改时间 / 预约时间 / 本次使用的日志按项目类型写阶段「施术」/「术后管理」/「管理项目」（`rowStageLabel`），`tlStageOf` 把「施术」归到「赴韩施术」，Timeline 阶段条多一个「管理项目」；日期小标题（`tlVisitDayText`）改按到院里的项目类型写「施术、术后管理、管理项目」；日志文字精简（`完成：名称`、`客人已到：到院（10/20）「名称」`、`改时间「名称」：…`，不再带整串内容）。旧记录里的阶段（案件阶段）不会改，只有新记录按项目类型。
- `careEntryOfRow` 顺带修：内容写成「类型（具体项目，在韩国）」时先按具体项目对上（同一类型有多条时原来取第一条）。
- 测试：selftest 新增 R57a（KM1，需要 pcStage 夹具）；R29b 的「施术项目一项一行」断言改成只写名称；A1 全套 121、KM1 批次 21 + CAL2/3/5/8 通过，roletest 9 个账号 316 格 0 不符。

## CMD-1020-07 补充（2026-10-20，追加；旧文字保留作历史）
- 基准 **c8a3648**，单个提交，**未推送**，不带开关，**数据版本不变（54）**（新增可空字段：案件 `careFor`（IN 从未安排预约点［预约］生成的预约，接续哪个原案件、哪几项）、术后管理行 `notified`（已通知过 IN）；localStorage `gmc_cfg_ubseen_<账号>`、`gmc_todo_ui` 里的 `tab`）。
- **一 已使用 / 已完成装卡片**：管理项目 tab 的「已使用 N」表格装进圆角 12 卡片（施术项目 / 术后管理 tab 的「已完成」在 1020-05 的 `krPcSec` / 每施术一张卡里已经是卡片）。
- **二 工作台「待办 N ｜ 未安排预约 N」分页**（todo.js `todoPaneHtml`，三端工作台共用；`TODO_UI.tab` 默认 `todo`，`todoSetTab`）：数字一直显示；「全部 / 只看我的」两个分页都适用（IN = `todoInMine`，KR = 案件的 KR 室长或院长）；**红点**：`todoUbDot`——有「新进来的（`gmc_cfg_ubseen_<账号>` 里没看过）或已逾期的」才亮，点开未安排预约就全部记成看过，逾期那一刻（key 带 `|over`）重新亮一次。未安排预约**不进待办**（独立列表 `todoUbItems`）。每行（`todoUbListHtml`）：客人（名 + 案件号）｜项目（灰字：对应施术 · 术后第 N 天 / 剩 N / 共 M 次）｜建议日期（过了还没约 → 红字）｜来源｜［预约］；按建议日期排。**IN 来源**（`todoUbIn`）：术后管理行 `place==='IN'` 且没做完 / 没取消的（不分先后：预约时选回印尼、［修改时间］后来改成回印尼，来源统一写「KR 交给印尼」）；`careUnits` 里地点只能在印尼的未预约名额、本案件在韩持有且有建议日期还有剩余次数的管理项目（`krCbMgItems`）来源写「本院」。**约好的判断**（`inCareBooked`）：本院有这位客人的预约案件（`x.careFor.caseId` = 原案件且 keys 含这一项，或客人自助预约了术后管理且还没接待）或当天已接续（`RESUMED_VISITS`）。**IN［预约］**（`todoCareBookOpen` / `todoCareBookGo`）：弹窗带出原案件、项目、来访目的「术后管理」、默认建议日期，选日期 / 时间（`slotBlockReason` 过滤）→ `createReservationCase(..., '术后管理')` + `careFor`，两边 Timeline 记一笔。**KR 来源**（`todoUbKr`）：客人在韩期间（到最早回国日为止，`krCbEarliest`）还没约的术后管理（`careSlotList`：地点韩国，或韩国或印尼但还没决定）和有剩余的管理项目，来源写案件来源诊所，［预约］= 打开案件项目 tab 后 `krCbOpen({one})` / `krCbOpen({mgmtOne})`（只勾这一条）。为此把 `careSlotList` / `krMgSuggest` / `krCbEarliest` / `krCbMgItems` 从 kr.js **搬到 data.js**（IN 也要算建议日期；行为不变）。
- **三 推给印尼 IN 收通知**（data.js `handToInNotify`）：预约弹窗里一开始就选「回印尼做」（`krCbGo` 里预约完调用）和［修改时间］改成回印尼（`coreCareToIn`）统一走同一则通知「KM1 室长将 客人 的『术后消肿管理（自体脂肪移植（全脸）· 术后第 7 天）』交给印尼，建议日期 11/07」，一次推好几项合成一则「…的 N 项术后管理交给印尼：『…』建议 11/07、…」；每行只通知一次（`row.notified`）；只告知，不进待办；点开进 IN 案件页。**补发**：`repairHandToIn()`（`boot-in.js` 启动执行，幂等）给「已经推过去、从没通知过」的行（Ayin A 那笔）补发一则。IN 术后管理卡（`inPostcareCardHtml`）这一项写「待在印尼做 · 建议 MM/DD」。
- 测试：selftest 新增 R58a（A1 分页，需要 pcStage 夹具）、R58b（KM1 分页）；`R51a` 里 KR 专属断言的开关改成 `typeof krEarlyHint`（搬函数后 `krMgSuggest` 在 IN 也有了）；A1 全套 122、KM1 批次 22 + 日历 4 通过，roletest 9 个账号 316 格 0 不符。

## CMD-1020-08 补充（2026-10-20，追加；取代 CMD-1015-17 里 IN「术后管理」卡 / ［结束术后管理］ / 「韩国 + 印尼都做完才结案」、CMD-1015-05 的「印尼室长备注」输入框、CMD-1020-07 里 IN 术后管理卡写「待在印尼做 · 建议」，旧文字保留作历史）
- 基准 **ea89121**，单个提交，**未推送**，不带开关，**数据版本 54 → 55**（`MIGRATIONS` to:55：旧 `c.recInNote` → 第一则备注 `inNotes[0]`（作者「IN 室长」、未读），用户案件保留）。
- **一 IN「赴韩施术」tab 项目卡**（data.js `inProjectCardHtml`，取代原来的「确认赴韩项目」卡 + 术后管理卡 + 持有管理项目卡）：大卡「项目卡」［增加备注］+ 备注区；**施术项目 N**（只放施术，每行 `<details>` 默认折叠：名称 · 在韩增加 · 状态，展开看麻醉 / 推荐在韩天数 / 所需术后管理 `itemArrangeHtml`）；项目合计 / 定金 / 尾款 + 护照未登记提示放在施术项目小卡下方；**术后管理 · 韩国 N** / **术后管理 · 印尼 N**（`inCareCardsHtml`，每个施术一张小卡，组标题「施术名 · 10/31 施术」；栏位 项目｜术后第 N 天｜时间｜状态｜操作，时间统一一栏：已约写预约时间、没约灰字「建议 11/07」；韩国只能看；印尼没约 =［预约］（同 20-07 的 `todoCareBookOpen`，来访目的术后管理、接续原案件）、已约 = 预约时间 +［修改时间］（`todoCareBookOpen(caseId, key, 预约案件id)` 改那条预约案件的日期时间）；没有第一栏「到院」、没有［做术后管理］、不列施术）；**管理项目 N**（在韩购买的管理项目含在韩增加 / 서비스 + 使用记录日期，状态 持有中 / 已用完）；**在韩持有项目**另一张大卡（`inHoldCardHtml`，剩余次数不写金额，名称不带「·N次」）。标题都在小卡外面，样式同 KR 项目卡。`inPostcareCardHtml` / `inHoldMgmtHtml` / `setRecInNote` / `openEndPostcare` 函数留着但已没有入口。**约好的判断**抽成 data.js `inCareBooking(c, key)`（IN / KR 通用，KR 页面从来源诊所分区读预约案件）。
- **二 备注记录 + KR 已读**：`c.inNotes = [{id, text, by, at, readAt, readBy}]`；`coreAddInNote`（记 Timeline、更新 `c.recInNote` = 全部备注拼起来，打印 / 其他地方沿用、`pushKrNotif` kind `innote`，KR 点开进案件页 `krNotifTarget`）；IN 备注区每则显示时间 / 作者 /「KR 已读（KM1 时间）」或「KR 未读」；KR 案件页最上面「IN 备注」卡（`krInNotesHtml`，室长可按［已读］ `krNoteRead` → `coreNoteRead`）；**结算前必须读过**：`krSettleOpen`（到院 Step 2 尾款）和 `krPayOpen`（在韩加项付款）开头 `krNotesGate()`，有未读先弹「先读 IN 备注」逐则［已读］，读完再点一次；核心函数 `coreSettleBalance` / `coreAddOnPaid` 也在有未读时返回 false。打印赴韩施术计划照旧（读 `recInNote`）。
- **三 结案规则**：IN 不再有［结束术后管理］（`coreEndPostcare` 保留只给测试准备用）。`carePending(c)` 改成只看**韩国的**：韩国术后管理没做完 / 没约（`!pcBooked`）且客人还没回国才挡结案，印尼的不挡；**客人已回国** = `careCustomerReturned(c)`：最早可回国日（`krCbEarliest`，由各施术项目的建议在韩天数 / 停留原因算出）已经过了（没有这个日期 = 还在韩国，不自动结）。`careReturnSweep()`（IN `boot-in.js` 启动 + 待办 5 秒刷新、KR `krBoot`，幂等）：施术已完成、已回国、没有挡结案的 → `finishCase`，Timeline 记「客人已回国…」；没做的**印尼术后管理不作废**（已是 place IN 的行保留；「韩国或印尼」没约的转成 IN 行，建议日期 = 原建议日期）、韩国没做完的转在韩持有；结案后印尼没做的留在 IN「未安排预约」（`todoUbIn` 现在也含已结案案件的 IN 行，过建议日期变红）和客户详情（`clientCareLeft`）。客人之后来做：照现有流程（IN 代约 / 接待选术后管理；案件已结案时走客户详情 / 本地管理「使用持有项目」里的术后管理）。KR 端没有同类手动结束术后管理的入口（只有「结束今日到院」是到院级的），不动。
- **四 KR 项目卡术后管理**：印尼的行（`place==='IN'`）从「已预约」/「已完成」拿出来，单独一组**「交给印尼 N」**（排在已预约和已完成之间，按施术分组各自小卡，栏位 项目｜术后第 N 天｜建议日期｜状态 = 待 IN 预约 / IN 已约 MM/DD / 已在印尼完成，KR 只能看，改回韩国先不做）；「已预约」只留 KR 自己约的；案件页最下面「回印尼做（由 IN 约…）」卡拿掉（`krCaseGroupsHtml`）。院长账号同一页一致。
- 我的判断（待确认）：① 「客人已回国」= 最早可回国日已过（没有最早可回国日的案件不会因此自动结案）；② 「韩国或印尼」没约的名额在回国后转成 IN 行（只有这类能转，只能在韩国做的没约的不再安排）；③ 备注已读只有 KR 室长能按（院长只看）；④ 案件已结案后 IN［预约］建出来的预约案件仍是新案件（原案件已结案不能接续），到店时走「使用持有项目」。
- 测试：selftest 新增 R59a（A1，需要 pcStage 夹具）、R59b（KM1）；R58a 的断言改成新卡；A1 全套 123、KM1 批次 23 + 日历 4 通过，roletest 9 个账号 316 格 0 不符。

## CMD-1020-09 补充（2026-10-20，追加；取代 CMD-1020-08 里 IN 项目卡「项目合计 / 定金 / 尾款 + 护照提示」、术后管理「按施术分组」和「在韩持有项目」大卡，旧文字保留作历史）
- 基准 **fb62ef7**，单个提交，**未推送**，不带开关，**数据版本不变（55）**，只改 IN 显示。IN「赴韩施术」tab 改成**三张大卡**（data.js `inProjectCardHtml`）：
- **【项目卡】**：备注区 +［增加备注］+ 施术项目（默认折叠，同 08）；**拿掉金额合计行**（项目合计 / 定金 / 尾款，金额看「结算」tab；`krPlanMoneyLine` 函数留着没调用）；**拿掉「护照未登记」提示**——护照状态放回**基础资料的「客人基本信息」护照一行**（`clientBasicBlockHtml` 新增，`passportVisible()` 才显示，未登记 / 过期 / 施术前到期红字 + 带［修改］走 `openClientEdit('passport')`）；规则不变：过期只报红、没登记不能结算（`batchNeedsPassport`）。
- **【术后管理】**：标题下说明「术后管理免费、不显示价格、不能退款；韩国的由 KR 安排，印尼的由本院预约」，里面两张小卡「韩国」「印尼」（`inCareCardsHtml(c, 'kr'|'inn')`）；**不再按施术分组**，栏位 **施术项目｜术后管理项目｜预约时间｜状态｜备注**（施术项目一栏下面灰字写施术日期；预约时间已约写时间、未约灰字「建议 MM/DD」；备注写「术后第 N 天」）；**状态只有 已完成 / 已预约 / 未预约**（原「待到店」「已到店」→ 已预约，「待预约」「待 KR 预约」→ 未预约）；**只有印尼小卡**最右多一栏操作：未预约［预约］/ 已预约［修改时间］，韩国小卡没有操作。
- **【管理项目】**（`inMgmtCardsHtml`，没有管理项目时整张不出现）：两张小卡「持有中」「已完成」；持有中 = 管理项目｜状态（持有中 / 待付款）｜剩余次数（N / 共 M 次）｜预约时间（没约写「–」，约了几次列出每个时间）；已完成 = 管理项目｜状态｜使用次数｜使用时间，**一次使用一行**（`it.uses` 一条一行：ONDA 11/01 用 2 次 = 一行「2 次」）；还有剩余的（ONDA）两边都出现，用完的只在已完成；名称不带「·N次」，「在韩增加」/「서비스」标签照旧。
- **拿掉【在韩持有项目】大卡**（`inHoldCardHtml` 删除，和「持有中」重复）。
- 测试：selftest 新增 R60a（A1，需要 pcStage 夹具；管理项目用临时加的条目）；R58a / R59a 的状态 / 标题断言改成新写法；A1 全套通过（47 个「失败」都是要在 KM1 / A2 / OWN 等其他账号分页跑的用例），KM1 批次 26 个（R26b 连跑时偶发被前面用例留下的表单状态影响，单独跑通过，同之前）+ CAL2/3/5/8 通过，roletest 9 个账号 316 格 0 不符，已 ST.cleanup。

## CMD-1020-10 补充（2026-10-20，追加；取代 CMD-1012-12 / 1013-12 里客户详情「医美史 · 案件记录 / 本院项目记录」分开的写法、CMD-1013-11 / 1013-12 里 KR 客人详情的「本院所有案件 / 术后管理 / 持有项目 / 本院施术记录」四块，旧文字保留作历史）
- 基准 **e45e12f**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段：施术项目 `it.doneAt`，旧案件没有就按 Timeline 等推算，不用迁移）。
- **IN / KR 客户详情同一套结构**（data.js 末尾 `clientDetailBodyHtml(model)`，`model.mode` = `'IN'` | `'KR'`）：客人名 · 基本标签（性别 / 年龄）［发起内部对话］→ **正在进行案件**（固定在最上面）→ tab **基础信息｜持有项目 N｜本院案件记录 N｜Timeline**（`CLI_TAB` / `cliSetTab`）。IN = `renderClientDetailIn(name)`（in.html 的 `#cli-root`；原 `renderClientProfile / Cases / Timeline / ProjectHistory / buildHistoryList` 都改成转调它）；KR = `krRenderClientDetail`（kr.js，整页在 `Store.withClinic(来源诊所)` 里算，因为客户档案在诊所分区里；KR 的［发起内部对话］= `krOpenNewStaffChat`）。in.html 里 `#detail-profile / #history-list / #detail-cases / #detail-holdings(-kr) / #detail-log` 这些 id 现在由 JS 画进各 tab 里（测试要用 `textContent`，隐藏的 tab 用 `innerText` 读不到）。
- **基础信息 tab**：基础信息卡（`cliProfileHtml`）+ 下面**医美史**（`cliHistoryHtml`）= 外院补登（`beautyRecords`，标「外院」+ 来源 / 登记人 / 本次新增）+ 本院做过的项目（`cliProjectGroups`）合并，按时间倒序（最新在上）；本院项目**按实际做的日期分组**（一次到院一组，右边案件号可点）：施术项目日期 = `cliItemDoneDate`（`it.doneAt` → Timeline「施术项目已完成：xx / 本次完成项目：xx」→ 预约施术行 / 施术行的完成时间 → 最后才退回确认的施术日期）、管理项目每次使用一条（`it.uses`，写「ONDA 提升 · 身体 60kj：2 次」，只列做过的，不写「·N次」「×6」）、术后管理（做完的）；IN 另含印尼本地持有批次的使用记录；KR 不含 IN 本地项目和印尼做的术后管理。［＋ 补登医美史］**IN 和 KR 室长都能用**（KR：`krCliBeautyAdd` → `BEAUTY_ADD_KR` → `saveBeautyAdd` 里 `Store.mutateClinic` 写进来源诊所的客户档案，`by` = KR 账号，客户 Timeline 记「补登医美史…（KR 登记）」；代表院长 / 院长只读没有按钮）。取代原来分开的「医美史 · 案件记录」「医美史 · 本院项目记录」和 KR 的「本院施术记录」。
- **持有项目 tab**：IN = 左右两张小卡「印尼本地持有」（本院买的本地项目批次 + 置换额度 + 交给印尼 / 还没做的术后管理，标「术后管理 · 来自 A000004」写建议日期，`clientCareLeftAll`）/「韩国持有」（在韩买的管理项目：剩余次数、已安排的预约时间、来自哪个案件；韩国这边还没做的术后管理也列在这里，已预约写时间、没约写「建议 MM/DD」，`cliHoldKrRows`）；**KR 只显示「韩国持有」**，没有印尼本地持有小卡；tab 数字 = 两张小卡合计（`cliHoldCount`）；名称不写「·N次」；拿掉 KR 旧说明「要使用请由 IN 预约」。
- **本院案件记录 tab**：案件卡片列表（KR 只看得到这家医院的案件）；**Timeline tab**：IN 维持现状；KR 只显示案件开始 / 进行中 / 结案（不显示客户档案修改记录，那里可能带联系方式 / 病史修改）。
- **KR 看不到的藏起来（不留空栏）**：联系方式、特别备注、隐私协议、IN 本地项目、印尼本地持有小卡、诊所内部资料；护照 KR 室长看得到（`passportVisible()`），院长 / 代表院长看不到。**KD1（普通院长）本来就没有客人管理入口（`krClientsAllowed`），所以看不到任何客户详情**；代表院长 KO1 有入口、只读，看不到护照和［补登医美史］。
- **KR 客户详情三处数据错误的原因**：① 「术后管理：没有待做的术后管理」——只列了 `s.hold`（结案时转成「在韩持有」的子项），而 Ayin 韩国这边 3 项待到店的术后管理是普通的韩国预约行（`place:'KR'`、没有 `hold` 标记）被漏掉；现在并进「韩国持有」小卡。② 「本院施术记录」只有腹部吸脂——只读 `kind==='施术' && done` 的施术行，而自体脂肪移植 / 埋线双眼皮 / 开内眼角是「单项完成」（施术行没全做完）或「预约施术」行（`surgUse` 行，类型是术后管理记录）完成的，所以都漏了；现在按**施术项目自己的完成状态**读（`it.done`），日期取项目自己的完成日期。③ 持有项目写「要使用请由 IN 预约」、名称带「·3次」——旧文字没跟着 CMD-1014-18 / 1019-21 一起改；已拿掉并统一用 `buyName`。IN 的「本院项目记录」6 个项目全挂在 10/31 下的原因：日期取的是「第一个完成的施术行」的完成时间（`dt = sd.doneAt`，同案件所有项目共用），改成每个项目各自的完成日期。
- 我的判断（待确认）：① 医美史里外院补登的「来源」统一标「外院」（客人自填 / 室长登记都算外院，旁边小字保留原来源）；② 韩国这边还没做的术后管理也放进「韩国持有」小卡（任务只写了管理项目，但 Ayin 的 3 项待到店需要有地方显示）；③ KR 客户详情的 Timeline 只放案件开始 / 结案；④ KR 补登的医美史标「室长登记」+ 登记人 KM1，IN 客户详情同样显示。
- 测试：selftest 新增 R61a（A1，需要 pcStage 夹具：结构 / 合并排序 / 实际日期分组 / 实际次数 / 左右小卡 / tab 数字）、R61b（KM1：KR 同结构 / 藏起来的内容 / 护照 / KR 补登 → IN 档案可见并标登记人；KO1：看不到护照和补登按钮）；S32 / 持有项目相关旧断言改用 `textContent`。A1 全套 + KM1 批次 26 个 + CAL2/3/5/8 通过（R26b 连跑时偶发失败，单独重跑通过，同之前），roletest 9 个账号 316 格 0 不符，已 ST.cleanup。

## CMD-1020-11 补充（2026-10-20，追加；取代 CMD-1020-08「我的判断 ①：客人已回国 = 最早可回国日已过」和 CMD-1019-23 / 1020-07 里 KR 预约弹窗「晚于最早回国日」「未安排预约到最早可回国日为止」的判断，旧文字保留作历史）
- 基准 **864fbc8**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段 `c.stay = {in, out, by, at}`、`c.stayAsked`，旧案件留空）。
- **在韩期间（入境日 ～ 离境日）** 辅助函数在 data.js 末尾：`stayFilled` / `stayText` / `stayOutDate`（离境日，没填退回 `krCbEarliest` 最早可回国日）/ `stayOutIsSet` / `stayShortDays`（离境日比最早可回国日早几天）/ `stayWarnHtml`（日期晚于离境日 → 橙字）/ `coreSetStay`（校验离境日不早于入境日；改了 → Timeline「填写 / 修改在韩期间：A → B」+ KR 通知 `kind:'stay'`；`{initial:true}` 不通知）。输入窗口在 calalign.js（`openStayModal` / `stayGate` / `staySave` / `stayCancel`，`#stay-overlay`）。
- **IN 输入**：① **确认赴韩时**（`confirmProjectSelection`：护照之后 `stayGate`）弹「在韩期间」窗口，**可以先空着**（［先空着］只记 `c.stayAsked`，问过一次就不再弹，之后随时在 IN 项目卡「在韩期间 ［填写 / 修改］」补）；② **施术前 2 天发施术前提醒前必填**：`openSurgMsg(id,'remind')` 没填完整（入境日 + 离境日）→ 先弹填写窗，只填一个会提示「都要填」，填完才继续打开提醒窗；③ 之后行程有变 IN 可随时修改，**改了 → KR 收通知 + Timeline 记一笔**；④ 离境日早于最早可回国日（施术日 + 建议天数）→ 红字「离境日比建议少 N 天」（窗口里和项目卡上），**不拦**。
- **用在哪里**：KR 案件页头小字加「在韩 10/16 ～ 10/26」（没填不显示，院长账号同一页一致）；KR 预约弹窗（`KR_CB.earliest` 现在 = `stayOutDate`，`KR_CB.stayOut` 标是不是真离境日）和［修改时间］窗（`stayWarnHtml`）日期晚于离境日 → 橙字「客人已离境（离境日 MM/DD）」，没填离境日时仍是「晚于最早可回国日」，都不拦；KR / IN 工作台「未安排预约」（`todoUbKr`）只列到离境日为止；**自动结案**（`careCustomerReturned` / `careReturnSweep`）：韩国的术后管理全部做完，或**离境日已过**；没填离境日退回最早可回国日判断；「韩国或印尼」没约的名额转成印尼行同样按离境日；打印赴韩施术计划行程概要加「在韩期间」。
- 20-08「我的判断 ④」维持（案件结案后 IN［预约］印尼术后管理 = 开新案件、关联原案件）。
- **和旧文字不一致、我的判断（待确认）**：任务里写「施术前 2 天『确认日程无变动』时必填：没填不能按［确认无变动］」，但原型里［确认无变动］已在 CMD-1019-13 改成「施术前提醒」［发送给客人］（没有［确认无变动］按钮了），所以必填挂在**发施术前提醒**上（那是施术前 2 天的同一个步骤）。
- 测试：selftest 新增 R62a（A1，需要 pcStage 夹具）、R62b（KM1）；自测默认 `window.GMC_STAY_AUTO = true`（确认赴韩 / 发施术前提醒不弹在韩期间窗口，R62a 里临时关掉测；其他用例里发施术前提醒不用再管）；KR 通知列表只留 200 条，所以测试按内容数通知，不数总长度。A1 全套通过（只剩 BK1c / BK2c 跨账号依赖）、KM1 批次 27 个 + CAL2/3/5/8 通过，roletest 9 个账号 316 格 0 不符，已 ST.cleanup。

## CMD-1020-12 补充（2026-10-20，追加；取代 CMD-1014-11 / 1015-06 里的测试流程「先到 login.html 执行 `gmcResetAll(...)`（全部清空）再测」和 ST.cleanup「整份还原快照」的做法，旧文字保留作历史）
- 基准 **81e0c99**（CMD-1020-11 已先做完，它没升级数据版本，所以和「优先在 11 之前」不冲突），单个提交，**未推送**，不带开关，**数据版本不变（55）**，不恢复数据（用户决定从干净数据重测）。
- **用户案件被清空的原因（我的判断，没法 100% 确认用户用的是哪个浏览器）**：不是升级迁移的 bug——我专门造了一个手工用户案件、把版本号改回 54 再刷新，案件被正确迁移（migrated 1，之后又用 3 个案件重复验证）。最可能的原因是**我自己的测试流程**：这份文档里（CMD-1014-11 教训）一直写着「先到 login.html 执行 `gmcResetAll('…', false)` 再进 in.html 测」，`keepUser=false` = **全部清空，连用户案件一起删**，而我每轮回归（20-04 之后的每个任务，尤其 20-07 / 20-08 / 20-09 / 20-10 / 20-11）开头都这么做；如果用户的测试数据和我的自动化测试在同一个浏览器（Claude 桌面应用的内置浏览器、地址 localhost:3000）里，这一步就把用户案件删光了。证据：内置浏览器里 `gmc_cfg_migration` 记录 54 → 55（20-08 的升级）`migrated:0`——升级时那里已经没有用户案件了。13:52 导出（v54，5 个用户案件）之后、20-08 第一次升级之前，只有我的「全部清空」重置会让案件数从 5 变 0。次要风险（这次一并堵上）：`ST.cleanup` 原来是「整份还原 `ST.begin` 那一刻的快照」，用户在快照之后新建的案件（比如 15:35 之后的 Ayin AY）也会被还原掉。**如果用户是在自己的 Chrome 里测，那我的重置动不到那份数据——请确认用的是哪个浏览器**，那种情况下我没找到别的可复现原因（升级路径已验证），需要用户导出一份当时的存档再查。
- **保护（data.js / store.js / selftest.js）**：① `gmcResetAll(reason, keepUser, confirmed)`：**有用户案件时「全部清空」（keepUser 假）默认拒绝**（console.error + 返回 false，存档一个字节不动）；只有第三个参数传 `true` 才执行（登录页「全部清空」按钮、`resetDemoData` 在用户点了确认之后才传）。**测试以后一律 `gmcResetAll(原因, true)`（保留用户案件）**。② 用户案件单独安全备份 `gmc_cfg_usersafe`（`gmc_cfg_` 开头，重置 / 升级 / 测试清理都不清，最近 2 份，每份 = 提取出的 carry，含案件 / 客人 / 持有批次 / 通知 / 对话）：`gmcUserSafeSave(reason)` 在**每次重置、数据版本升级、`ST.cleanup`（有快照之后新增的用户案件时）之前**自动存；**恢复**：控制台 `gmcUserSafeList()` 看有哪几份，`gmcUserSafeRestore(0)`（0 = 最新）→ 刷新页面（会先做普通备份，再清存档，由启动时的 carryRestore 合并回来；注意会覆盖现有案件）。③ 存档读不出来、要重建之前（store.js `if(!load())`）把原始存档原样存一份 `gmc_cfg_rawsafe`（恢复 = 把 `data` 里的键写回 localStorage）。④ **升级前后用户案件数量必须对得上**：升级前先数存档里的用户案件（`gmcUserCaseCountRaw`）、提取（`gmcExtractUserCarry`）、存进 `gmc_cfg_carry`；提取出错 / 数量不符 / 存不下 → **停下来**：不清存档、不写新版本（`gmc_demo_ver` 保持旧的）、页面不写档（`GMC_NO_SAVE`）、顶部红条「数据升级已停止：…」、`gmc_cfg_migration` 记 `blocked:true`；升级后再核对一次（`GMC_CARRY_CHECK`：期望数 = 迁移数 + 失败数，否则同样停止写档并提示恢复方法）。⑤ **`ST.cleanup` 只动测试自己建的数据**：测试建的案件 = 名字以 `T-` / `T2-` 开头或带 `prep:true`（`ST.isTestCase`）；还原快照之前找出「快照之后新增、不是测试建的用户案件」（`ST.cleanupKeepPlan`），先存安全备份，还原后原样加回对应诊所分区；roletest 用的就是这个 cleanup。⑥ 启动修复类代码（`repair*` / `careReturnSweep` / `sweepStaleReceptions`）已逐个看过，没有删除案件的逻辑（`CASE_ITEMS.splice` 只有用户点［接续］的 `resumeVisit`、`stashC3Seeds` 删的是种子案件 id）。
- **验证（手工造的用户案件当哨兵）**：造 3 个手工用户案件（我自己建的）→ 跑完整套 selftest（A1 全套 + KM1 批次 + CAL）+ roletest 9 个账号 + 每个账号的 `ST.cleanup`，跑前跑后用户案件数量都是 **3 个**；模拟版本升级（版本号改回 54 刷新）→ 3 个迁移成功（`migrated:3`）、`gmc_cfg_usersafe` 有「升级 54 → 55 前」那份；故意让数量对不上（塞一个坏的诊所分区让提取出错）→ 升级停下来（版本仍 54、所有分区字节数不变、红条提示）；验证完**只删了我自己建的这 3 个手工案件**，现在内置浏览器里用户案件 = 0（和我动手前一样，没有留下任何东西）。
- **三·1 待办也要红点**：`todoIsNew` 现在 = 没看过，或已逾期而「逾期那一刻」没看过（`key|over`）；IN / KR 同一套：「待办 N」分页标题亮红点（`todoTabDot`，收起的小按钮也亮），行内红点同规则，打开案件（`todoMarkCaseSeen`）后消失。
- **三·2 客人希望的面诊时间**：`c.wantConsult`（选填自由文字，可改可清空，不升级数据版本）；IN 面诊费卡下面一行输入（`wantConsultRowHtml`，已缴费 / 已免除、没出诊疗方案前显示）；填 / 改 → Timeline + KR 收一条通知「客人希望的面诊时间：…（客人名，Case ID）」（`saveWantConsult`）；KR 确认面诊时间卡片最上面「客人希望：…」，KR 待办「确认预计出报告时间（客人希望：…）」。
- **三·3 院长日程弹窗**（`krDirSchedPopup`）：7 天各一张小卡排成 4 列网格；日期 + 星期，下面列当天占掉的时段；整天 OFF / 休诊整张浅红底写原因；没有安排写「全天可约」。
- **三·4 不可预约写法**：拿掉「（手动）」，写「不可预约 · 备注」（没填备注只写「不可预约」，`krBusyLabel`；加 / 改不可预约的表单新增「备注（选填）」，块字段 `note`，`normSchedBlocks` 不再把备注清掉）；被预约占掉的写「施术 · 客人名」「面诊 · 客人名」；用在当天日程（`krDayAgendaRows` / `krDayAgendaHtml`）、院长日程弹窗、KR 日历块文字 / 提示、冲突提示（`directorClashList`）；营业时间外 / 午休不变。
- **三·5 确认面诊时间卡片重排**（`krConsultTimesBlock`，页面里的卡片，不是弹窗，没有 X）：最上面「客人希望」黄条；浅底区域：负责院长 + ［院长日程］｜左「X 当天的日程」+ 日期大字、右列时段（时间 ~ 说明，不可预约 / OFF / 休诊 / 占用的行浅红底 + 红字，营业时间外 / 午休灰）；下方左右两块浅底卡片「面诊时间」「预计出报告时间」（粗体标题 + 灰色说明 + 大号日期 / 时间输入）；底部分隔线下只有［确认］靠右。
- 测试：selftest 新增 R63a（任意 IN 分页：全部清空被拒绝 / 清理计划只保留用户案件 / 安全备份 / 升级数量核对）、R64a（A1，需要 stagePay 夹具）、R64b（KM1，需要 stagePay 夹具）；A1 全套通过（只剩 BK1c / BK2c 跨账号依赖）、KM1 批次 28 个 + CAL2/3/5/8 通过，roletest 9 个账号 316 格 0 不符。**以后重置一律用 `gmcResetAll(原因, true)`；R63a 里造的用例案件名以「手工保护案件」开头。**

## CMD-1020-13 补充（2026-10-20，追加；取代 CMD-1020-11 / 12 里「施术前 2 天［发送给客人］提醒」、IN「赴韩施术计划」左上「推荐项目整理」、IN 选项目默认韩币，旧文字保留作历史）
- 基准 **aff9c57**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段：`c.stay` 加 `inTime/outTime/inAirport/outAirport`，`c.tripConfirm={at,by,methods,other}`）。
- **一** KR 确认面诊时间（`coreSetReportEta` 非「修改」分支）→ IN 收一条通知（`level:'action'`，文字「KR 已确认面诊时间…」，`notifTodoKind` 认得，弹出需点［确认］）。**二** 待办「诊疗方案已到：联络客人选项目」→「面诊资料已到：联络客人选项目」，点开进「面诊资料」tab（`openNotif` planGo 同）。**三** 数字是 0 的卡片绝不亮红点（`todoCardDot` / `todoCatCardsHtml`，IN / KR / 院长）。**四** IN 选项目默认币别 Rp，价格写「Rp（₩）」（`krPickAmount`，`CASE_DISPLAY_CCY_KR='IDR'`）。
- **五 KR 对话窗口 = IN 同一个组件**：kr.html 复制 IN 的浮窗 / 引用案件 / 文件 / 提及案件结构；kr.js 的 `krFlCtx` 在 `Store.mutateClinic(KR_FL.clinicId)` 里调用 IN 的浮窗函数（有重入深度保护），IN 专属 DOM / 函数在 kr.js 里重写（`krOpenFloat` 等）。保留差异：KR 不能新建案件房 / 视频只接听 / 成员静音规则（院长静音）。`dev/check.sh` 的「duplicate functions」就是这批 IN / KR 同名函数（KR 页面后加载 kr.js 覆盖，预期）。
- **六** IN 赴韩施术页左上改「建议在韩停留 N 天（原因）· 施术日 = 第 0 天」（`krStayHint`，读 `stayPlanOf`），拿掉「推荐项目整理」，［打印］保留。**七** 施术前 2 天卡「确认行程」→［已确认行程］弹窗（`openStayModal(id,{trip:true})`）：入境 / 离境 日期｜时间｜机场（选填）、确认方式必选多选（电话 / WhatsApp / 短信 / 当面 / 其他）、带出已填、离境日比建议少红字不拦、保存写 Timeline「已确认行程（电话、WhatsApp）：入境 … / 离境 …」；确认赴韩 / 项目卡「修改」同一组字段但没有确认方式；KR 页头「在韩 10/29 15:00 ～ 11/08 18:00」（机场悬停，`stayText` / `stayAirportTip`）；之后改动 KR 收通知；原施术前提醒［发送给客人］取消。
- 测试：selftest 新增 R65a（IN）/ R65b（KM1）；R15d / CAL1 / CAL4 / TD1 / R42a / R45a / R59a / R62a 断言按新写法调整；`ST.confirmTrip`、`GMC_STAY_AUTO` / `GMC_NO_SWEEP` 测试钩子。A1 全套（已含 R58a/R59a/R60a/R61a/R62a/R64a/R65a）、KM1 批次（R57a/R58b/R59b/R62b/R64b/R65b 等）通过；roletest 9 个账号 0 不符。
- **测试注意**：① KM1 分页的 R57a/R58b/R59b/R62b/R65b 需要 `await ST.ensureFixtures(['pcStage','stagePay'])` 先建夹具；② CAL4 / TD1 会受上一个用例留下的 `TODO_UI.kind` 筛选影响，单跑前先 `TODO_UI.kind=''`；③ TD3（日视图现在线）、R21a 与当前时刻有关，不在营业时间内会偶发失败；④ 别在 KR 分页里跑 IN 用例（`ST.runAll()` 不带 id 会全跑）。

## CMD-1020-14 补充（2026-10-20，追加；取代 CMD-1015-01 / 1020-04 里月视图「N 项日程 / 不可预约 N」写法和今天格子边框、CMD-1015-07 里待办列表栏宽，旧文字保留作历史）
- **【UI 规则：全站最小字号 12px】（用户 10/20 定，以后每个任务都遵守）**：IN / KR / 院长 / 老板 / 客户预约页 / 登录页所有文字 computed font-size 不得小于 12px（打印预览窗口 `printKrPlan` / `reportDocHtml` 除外，它们是新窗口里的文件）；标签、灰字说明、表头、日历小字、徽章都算。写新画面时 `font-size` 最小写 12px，不要用 10 / 11px，也不要用 em / scale 缩到 12px 以下；挤了就调排版（栏宽、换行、省略号 + title），不要缩字。**可重复检查**：`selftest.js` 的 `ST.fontScan()`（扫当前页面所有有文字的可见元素，computed < 12px 的列出来，跳过 dstyle 的隐藏 emoji 文字 `.ds-ic-t`）和用例 `FS1`；每个新画面上线前在对应页面跑一次 `ST.runAll(['FS1'])`。本次已把源码里所有 < 12px 的 `font-size`（app.css / 各 js / html，约 540 处）改成 12px（`font-size:\s*N px` 一律抬到 12px），剩下 3 处 < 12px 都在打印预览模板里。
- 基准 **0743169**，单个提交，**未推送**，不带开关，**数据版本不变（55）**。
- **院长整天 OFF 整栏灰底**（data.js `dirFullOff(hid, ds, 院长)` / `dirOffText`）：院长视图（KR 工作台 / 院长自己的工作台 `krcGridHtml`，IN 的 KR 医院日程院长视图 `krDayColHtml(…, dirOff)`）里，整天 OFF 那一栏营业时间内整栏灰底（类 `krc-busy krc-offcol` / `kr-busy cal-offband`，和不可预约同色）写「OFF」/「OFF · 备注」，**不能点**（去掉点击 / 悬停加预约、占位）；已有的块照样画在灰底上（撞到 OFF 的照现有规则标红）；**医院视图不灰**（固定栏维持）；室长 OFF 不灰整栏。IN 看不到院长不可预约 / OFF 的备注（只看到「不可预约」「OFF」整块），OFF 备注只在 KR 端显示。
- **月视图整理**（IN 本院日程 `buildMonthGrid`、IN 的 KR 医院日程 `buildKrMonthGrid`、KR 工作台 / 院长工作台 `krcMonthHtml`，共用 ui.js 的 `calDayNumHtml` / `calMonthLinesHtml` / `krMonthLines`）：休诊日灰底写「休诊」；院长视图里院长整天 OFF 那天和休诊一样灰底写「OFF」（有备注「OFF · 备注」），不再重复三行；有日程的日子**一行一个时段**（「11:00～13:00 不可预约」「15:30 施术 · 客人名」「14:00 预约 · 客人」，写法同 20-12：没有「手动」，KR 端有备注写备注），最多 3 行，放不下写「还有 N 项」，**不写数字**；医院视图月视图不因院长 OFF 灰；KR 月视图 `.krc-monthwrap` 6 行上下填满（高度 `calc(100vh - 300px)`，和 IN 同）；今天的日期数字 = 咖啡色实心圆圈 + 白字（`.cal-today`，取代 KR 的今天格子外框）；IN 本院日程月视图按诊所设定休诊（`isRescheduleDateDisabled`）灰底 + 「休诊」。IN 的 KR 月视图时间换算成诊所时间。
- **待办 / 未安排预约列表**（todo.js `todoFmtTimeHtml`，app.css 末尾覆盖）：6 栏固定宽度 48 / 54 / 自适应 / 48 / 46 / 52px，时间栏日期和钟点上下两行（今天只写钟点），阶段 / 状态 / 客人不换行（省略号 + title），进程占剩余宽度最多 3 行（title 看全文），表头 12px 不换行，内容 13px；`#todo-pane .todo-box` 左右内距 10px。在 1440 宽下待办栏约 374px，进程列约 78px（窄，靠 3 行 + title）；若要更宽需要改日历 : 待办 = 2 : 1 的比例（没动）。
- 测试：selftest 新增 CAL10（IN / KM1 分页：整栏灰底 / 不能点 / 医院视图不灰 / 月视图灰底、无数字、今天圆圈 / IN 本院周日休诊）、FS1（最小字号扫描，另手工在 IN 8 个页面 + 3 个案件 7 个 tab、KR 工作台日 / 周 / 月 + 案件 6 个 tab 逐页扫过 = 0 个）；BK1a 选空白列时跳过没有点击事件的院长 OFF 列。注意：CAL3（KM1）「时间已确认应有 -1 子案件」是 CMD-1015-17 子案件改版后遗留的过期断言（本任务前就失败，非本次引入）。

## CMD-1020-15 补充（2026-10-20，追加；取代 CMD-1020-13 里 KR 页头「在韩期间放第二行灰字」、CMD-1015-27 里 Step 2 的「已付定金项目框 / 添加项目框」版面和［收起］，旧文字保留作历史）
- 基准 **d893694**，单个提交，**未推送**，不带开关，**数据版本不变（55）**。最小字号 12px（20-14 规范）继续遵守。
- **一** IN 工作台「KR 医院日程」分页写「KR 医院日程 N」（`renderCalendar` 里更新 `#cal-view-kr`；`krTodayArrivalCount(ds)`，data.js）：今天本诊所客人在 KR 的到院数（施术 / 面诊 / 术后 / 管理 / KR 占位预约，一个案件一个，已取消不算，0 不显示数字）。**二** IN 的 KR 医院日程每 30 分钟格高 `KR_ROW_PX` 36 → 56，和本院周视图 `.wk-cell`（56px）一致，两个分页同一个日历卡片 / 滚动容器 / 固定栏 / 营业前后小条位置。KR 工作台日历 `KRC_PX`（周 112px / 小时）早就和 IN 一致，核对无需改。**三** KR 标「已到医院」：IN 的 KR 医院日程块加状态标签（`krMainState`：待到院 / 已到医院 / 已完成；术后 / 管理到院 = 待到院 / 已到店 / 已完成；`krb-st` 样式），案件页 / 列表进程写「在韩中（已到医院）」（`rules.js`，取代「已到院」），IN 收一条通知「X 已到医院（院长，时间）」（`coreMarkArrived`，`level:'info'`，只告知不进待办；撤回 `coreUnarrive` 状态恢复）。
- **四 KR 到院卡层级**（kr.js `krL2Box` / `krL3Box`，app.css `.kr-l2` `.kr-l3` `.kr-row`）：今天的到院卡 = 1 级；Step 1～4 里的「已付定金项目」「院长评估结果」「添加项目」「付清尾款」「今日进行项目」和 3-2 / 3-3 的卡 = 2 级（标题放在卡里，卡间距 14px）；2 级卡里的「施术项目 N」「管理项目 N」= 3 级卡；每行 `.kr-row` 上下 6px 内距 + 分隔线。`krPaidBoxHtml` 现在只返回 3 级卡，外面包 `krStepItemsCard` = 2 级「已付定金项目」卡。
- **五** KR 案件页头：「在韩 10/29 15:00 ～ 11/08 18:00」放第一行（名字 + 状态标签右边，机场悬停 title），第二行不再重复；没填不显示；院长账号同一页。
- **六** 添加项目选择区：`.kr-chooser-scroll` 最大高度 360px、内部滚动（左右两栏各自滚）；拿掉［收起］；Step 2 的「添加项目」2 级卡：关闭时显示施术项目 N / 管理项目 N 两张 3 级卡（每行可移除）+［添加项目］；打开（`krChOpen('adj')` 记快照）后底部左［取消］（`krChCancel` 还原快照）右［确认添加］（`krChConfirm`，收回成摘要）；在韩加项（项目卡右上［增加项目］，`krAddOnCard`）选择区同样，底部左［取消］（`krAdCancel` 清掉勾选）右［确认添加（N 项）］（= 原来的 `krDoAddonCommit`，去掉了顶部［收起］）。3-2 / 3-3 的 `krAddChooser` 只加了最大高度滚动。
- 测试：selftest 新增 R66a（IN，需要 stageC 夹具）、R66b（KM1，需要 stageC 夹具）；R26b 里「添加项目框里列出加的项目」先调 `krChConfirm('adj')`。A1 全套、KM1 批次（R22b/R23b/R24b/R26b/R28b/R29b/R30b/R31b、R47a～R49a、R57a～R65b、R56a、CAL2/5/6/8/10、FS1、TDK1/2）通过；roletest 9 个账号 0 不符。**注意**：KM1 里依赖 A1 先建案件的 b 用例（R23b、R24b、R26b、R28b、R29b、R30b、R31b）要先在 A1 分页跑 R23a / R24a / R26a / R28a / R29a / R30a / R31a，且不要同时开两个 `ST.runAll`（超时的那个会继续在后台跑，互相踩数据）；长批次用 `ST.runAll(...).then(()=>{window.__done=true})` + 分次轮询。

## CMD-1020-16 补充（2026-10-20，追加；取代 CMD-1020-15 里添加项目选择区「最大高度 + 底部整块右下角按钮」、CMD-1019-22 里「待付款项目［本次使用］灰掉」、CMD-1014-19 里医院层「每块一行 时间 · 客人 · 类型 · 院长」，旧文字保留作历史）
- 基准 **208664e**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段 `procedureItems[].iid`、行 `holdIid`；旧数据用到时按「同名按出现顺序编号」补，存档后固定）。
- **一 「医院」视图预约小标签**（kr.js `krcChipsHtml` / `krcMoreOpen`，ui.js `krInChipsHtml` / `krInMoreOpen`，app.css `.krc-chip`）：KR 工作台医院层（周 / 日）和 IN 的 KR 医院日程「医院」视图，每个预约 = 一个小标签：高度 = 一小时格的 1/6（医院视图固定 112px / 小时 → 约 18.7px，日视图也是），**不按时长拉长**，整栏宽，放在开始时间所在小时格里按开始时间上下排；文字「15:30 · Ayin AY · 施术」（IN 里时间是诊所时间，并带状态标签待到院 / 已到医院 / 已完成），颜色沿用图例；一格超过 6 个 → 显示 5 个 + 第 6 行「+N 个预约」，**点开 = 小弹层**（`#krc-more-overlay` / `#krin-more-overlay`，列出这个小时全部，可点进案件）；悬停显示完整时间段（15:30～21:30）和项目；点标签照旧进案件。**院长视图不变**（仍按时长画块）。
- **二 添加项目选择区左右结构**（kr.js `krAddChooser(c, sk, footer)`，`.kr-chooser` 固定 460px 高）：左栏 = 施术 / 管理切换 + 搜索（两个 tab 都有，`krChQ` / `krSgListHtml`）+ 列表，上下填满、栏内滚动；右栏 = 「已选（和结算一起）」+「서비스（赠送）」栏内滚动，**［取消］［确认添加］固定在右栏底部**（`.kr-ch-foot`）；Step 2 的添加项目卡和在韩加项（项目卡右上［增加项目］）都这样；3-2 / 3-3 同一个选择区但没有底部按钮。
- **三 同名管理项目按每一笔唯一 id**：原因 = 全站用项目名称识别项目（勾选 `KR_PICK['mg:'+名]`、`todayPickMgmt` / `todayMgmtDone` 都是名字数组 / 键、本次使用 `coreUnitUseNow(c, name)`、预约行 `holdUseOf = 名字`、扣次 `x.name===name` 找第一个），所以两笔「钛提升 · 40kj」（付定金时选的 / 到院后加的）勾一个两个一起亮、使用扣在第一笔上。修：新增 `itemIid(it)` / `ensureItemIids(c)`（`updateCaseStage` 和 `krAllCases` 里补，同名按出现顺序编号、删除后新增不撞号）/ `itemByKey(c, key, pred)`（先按 iid 找，没有再按名字）/ `rowOwnedBy(it, s)` / `rowItem(c, s)`（行带 `holdIid`，没有的旧行退回按名字）/ `tmdGet` / `pickedMgmt`；勾选、今日进行（`coreTodayPick`）、本次使用（`coreUnitUseNow`）、预约时间（`coreUnitBookUse` + 预约弹窗 `KR_CB.mg` 按 iid）、操作完成 / 撤回（`coreMgmtUse` / `coreMgmtUseUndo` / `coreUseRowUndo`，`todayMgmtDone` 按 iid）、今日取消 / 备注 / 数量（`coreTodayCancel` / `coreItemNote` / `coreTodayQtySet`）、扣次 / 退次（`holdUseRecord` / `holdUseUndo` / `fixUseRecords` / `holdItemPlanned`）都按 iid。**施术项目**添加时已去重（项目库里同名的不能再加），**术后管理**按「施术项目名 + 第几条」本来就唯一，所以只有管理项目会同名多笔；退款 / 结算单是按批次（`batchId`）不是按名字，没改。两笔分开显示不合并；项目卡管理项目「在韩增加」标签原来只认 `krAddOn`，到院 Step 2 加的是 `preBalanceAdd`，所以漏了，现在两种都标。
- **四 在韩加项「待付款」规则**：只有尾款付清之后加的才有待付款（Step 2 加的并进尾款，付款弹窗只有［取消］［确认付款］）；待付款的管理项目加进来时就进在韩持有（`coreAddOnItem` 里 `holdLocalAdd`，仍带 `pendingPay`），项目卡行显示「待付款」红字但［本次使用］可点，到院卡行［操作完成］不再灰；预约时间仍要先付款（不在这次范围）；**麻醉同意书独立于付款**（`anesPendingItems` 不再要求已付款，红条随时可确认，没确认前不能完成）；页面最上方红色「待付款」条一直显示到付清；**有待付款不能结束今日到院**：提示「还有 ₩1,300,000 待付款，请先付款」（`coreEndVisitToday`，结算 / 全部完成弹窗选［今日完成］同一个）。
- 测试：selftest 新增 R67a（同名管理项目各自勾选 / 使用 / 撤回 / 预约 / 标签 / 待付款规则，KM1 分页，需要 stageC 夹具）、R68a（医院视图小标签，KM1 和 IN 分页各跑一次）；R18b / R20a / R22a / R23b / R54b / CAL8 的断言按新规则改过（待付款先进持有、同意书独立、预约弹窗按 iid、医院层不再写院长）。A1 全套 + KM1 批次（R23b / R24b / R26b / R28b～R32b / R51b～R55b / R66b / R67a / R68a、R22b / R47a～R49a / R56a～R64b、CAL5 / 6 / 8 / 10、TDK1 / 2、FS1）通过；roletest 9 个账号 0 不符。**CAL4 / TD1 连跑偶发**（待办筛选状态残留，单跑通过，同前）。

## CMD-1020-17 补充（2026-10-20，追加；旧文字保留作历史）
- 基准 **7f81229**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（没有改资料结构）。
- **一 KR 预约到店「使用在韩持有」按每笔 iid**（krbook.js）：`krbHoldChoices` 每笔返回 `key`（项目 = iid；术后管理转持有行 = `row:行id`）+ 购买日期 + 在韩增加 / 待付款标记，同名项目分开列；`coreBookDone` 按 `did.key` 匹配，用 `itemByKey` 找项目、`holdUseRecord` 只记在选中的那一笔。**全站再查按名字对管理项目的地方**：管理项目的持有 / 今日进行 / 使用 / 预约 / 撤回 / 扣次（`rowOwnedBy`、`holdIid`、`tmdGet`、`pickedMgmt`、`krCbMgItems`、IN `inMgmtCardsHtml` / 客户详情 `cliHoldKrRows`、未安排预约 `todoUbKr`）在 1020-16 已全部走 iid / 对象，这次只剩 krbook.js 一处按名字，已改。仍按名字的（施术项目按名字去重、不会重名，或只是类型判断）：`data.js` `visitRowType` 里按 `projectName` 判管理 / 施术、`visitRowLabel` 的 `x.name===base` 兜底（旧行没有 `holdIid`）、`kr.js` 今日案件施术行 `x.name===nm`（施术）。
- **二 旧待付款管理项目转持有**：`repairVisitState()`（IN / KR 启动都跑，幂等）把 `pendingPay && !heldOver` 的管理项目（Ayin A000001 热玛吉 · 300发 类）用 `holdLocalAdd` 转成持有项目：剩 N / 共 N 次、红色待付款、可勾选；只转换不删除，待付款标记和金额不变，Timeline 记「修正旧数据：…」。**「睡眠麻醉」为什么出现在管理项目里**：不是系统生成，是本地管理项目库清单（`LOCAL_CATALOG_TEXT`，Notion「本地管理项目库清单」）里有一个类别「麻醉（附加项）」，下面有 麻醉膏 / 麻醉喷雾 / 局部麻醉 / 睡眠麻醉（1 次 20 万韩元），KR 在「增加项目 → 管理项目」里把它当普通管理项目加，所以带管理间隔 / 建议日期。是项目库的分类设计问题，没改，等业务方决定（要不要从管理项目里拿掉，或改成施术的麻醉选项）。
- **三 删除未付款项目**：KR 室长（`krCanFix()`，院长 / 代表院长没有）在项目卡的未付款项目行有［删除］（施术项目 / 管理项目 / 서비스一样）→ 确认弹窗「删除未付款项目：热玛吉 · 300发（₩1,300,000）？」［取消］［删除］（`krPendDelAsk`）；已使用过（施术 `done`、持有项目有使用记录 / 今日已完成，`addOnUsed`）灰色 + 悬停「已使用，不能删除」，已付款的项目没有［删除］。`coreAddOnDelete(c, iid|idx, by)`：同时从今日进行勾选 / 今日到院卡里没做的行拿掉，Timeline 记「删除未付款项目：…」，项目卡 / 持有项目 / 待付款结算 / 红条金额重算（没有就消失），IN 结算 / 赴韩施术 tab 同步；在韩加的施术项目被删后，施术块的延长时间（`extendMin`）随项目一起没了，`updateCaseStage` 重新同步施术块，释放院长时间。
- 测试：selftest 新增 R69a（KM1 分页，stageC 夹具）；A1 全套、KM1 批次（R26b / R29b / R66b 要先在 A1 跑对应的 a 用例）、roletest 9 个账号 0 不符。TD1 / CAL4（待办栏「已超时」分组）在基线 7f81229 上本来就失败（CMD-1015-07 改成「昨日及更早 / 今天」后断言过期），与本次无关。

## CMD-1021-01 补充（2026-10-21，追加；取代 CMD-1020-17 里「［删除］」的用词和显示条件，旧文字保留作历史）
- 基准 **d0cbcce**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段：客户档案 `noLastName`，旧资料没有 = 假）。
- **项目卡待付款行［取消］**（kr.js `krProjCards` 的 `delBtn`）：待付款的项目（施术 / 管理 / 서비스）行最右边一律放［取消］（线框无图标；选今日项目的勾选画面里也放）；没权限（院长 / 代表院长）灰掉悬停「只有 KR 室长可以取消」，用过的灰掉悬停「已使用，不能取消」，已付款的没有；点了弹「取消未付款项目：热玛吉 · 300发（₩1,300,000）？」［返回］［确认取消］，处理同 20-17（`coreAddOnDelete`），Timeline「取消未付款项目：…」；红条［去付款］弹窗里的入口（`krFixDelete`）保留，用词改「取消」。**20-17 的行上按钮没出现的原因（我没法在 KM1 复现，R69a 实测按钮在）**：原条件是 `pickMode`（选今日项目画面）/ `c.visitClosed` / `!krCanFix()`（院长、代表院长账号）任一成立就整个不画，而不是灰掉；最可能是用户用 KO1 / KD1 看，或页面还是 20-17 之前的旧代码；这次去掉 `pickMode` / `visitClosed` 条件，没权限改成灰按钮写原因。
- **名 / 姓 / 性别 / 出生日期都必填**：客户自助预约页第 3 步（`bkProfileNext`）姓必填、性别默认「请选择」必填、生日必填；姓旁勾「我没有姓」（`BK.f.noLast`，勾了姓输入框变灰、显示名只用名，客户档案 `noLastName:true`，印尼文 / 中文词条 `profile.noLast / errLast / errGender`）；缺项红字挡住；老客人跳过个人资料的规则不变。IN 客户基础信息编辑（`openClientEdit` / `saveClientEdit`）：名 / 姓同样必填 + 「我没有姓」勾选，性别 / 生日合并编辑项两个都必填（性别默认「请选择」）；**旧资料缺的不补不拦**，只在下次编辑那一项时要求填。IN 代约新客走 booking.html，同一套规则。
- 测试：selftest 新增 R70a（IN 分页：姓空挡住 / 我没有姓 / 性别生日必填 / 旧资料不拦）；R69a 的断言改成「取消」。**教训**：`gmcResetAll(…, true)` 会把测试案件（`demo:false`，名字 T-）当用户案件保留，测试之后要用 `ST.cleanup()` 清；数据脏了（案件很多）时 R66a 会误失败，先清掉再跑。

## CMD-1020-18 补充（2026-10-21，追加；取代 CMD-1020-07 / 1020-08 里 IN 未安排预约「本院持有管理项目也放」「按条列出」的做法和 CMD-1014-16 / 18 里占位预约来访目的「使用在韩持有 / 新做管理 / 其他」，旧文字保留作历史）
- 基准 **53ce44d**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段：占位 `bk.items` / `bk.sub`，案件 `krVisit.items` / `sub`；旧占位的 hold / care / other 来访目的仍能显示和完成）。
- **一 IN 未安排预约只放印尼术后管理**（todo.js `todoUbGroupsIn` / `todoUbIn`）：KR 交给印尼的（预约时选印尼 / 后来改印尼，`s.place==='IN'` 的行）+ 地点本来就只能在印尼的名额；**韩国持有的管理项目、IN 本地持有的管理项目都不放**（原来 20-07 把在韩持有当成本院持有、来源写「本院」是错的）。已有预约接续的不算（`inCareBooked`）。
- **二 按客人折叠**（`todoUbListInHtml`）：一个案件一组，标题「客人名（Case ID）｜未预约 N ……［全部预约］」，点标题展开 / 收起（`TODO_UB_OPEN`，默认展开）；展开每个项目一行：施术名称｜术后管理项目｜次数｜建议时间｜地点｜［预约］；过了建议日期日期变红；标签数字 = 全部次数合计（`todoUbCount`）；红点规则照旧。**KR 的未安排预约仍是平铺列表**。
- **三 预约弹窗**（`todoCbOpen` / `todoCbNormalize` / `todoCbGo`，取代 `todoCareBookOpen` 的非修改分支，项目卡里的单条［预约］也走它；修改时间仍是原来的小弹窗）：全部预约 = 全勾，单条 = 只勾那一项；同一项目多次：一行「− N +」次 + 日期 / 时间，还有剩自动在下面生成下一行（日期默认下一次的建议日期、遇到休诊 / 约满往后找可约日），取消勾选不再生成、分完 / 总数封顶；确认时按日期合成一次到店（`careFor.keys` 带这次全部 key），接续原案件、来访目的术后管理。**每一次一个独立 key**：`careUnits` 的名额加 `k`，`careUnitKey(u)`（第 0 次沿用旧 key `unit|项目|条目`，旧预约不受影响）、`careUnitSug`（建议日期按第几次）；项目卡 / 待办用同一个 key。
- **四 占位预约来访目的 3 个**（krbook.js）：`KRB_PURPOSE_NEW` = 在韩术后管理预约（`carebook`，列这位客人韩国还没约的术后管理 `careSlotList`，可多选）/ 在韩持有项目管理预约（`holdbook`，列韩国持有的管理项目 `krCbMgItems`，同名两笔按 iid 分开，带购买日期 / 在韩增加 / 待付款标签）/ 新增访问（`newvisit`，下一层 术后复诊 / 皮肤管理 / 面诊商谈）；前两个至少勾一项才能提交；占位 / 通知 / KR 确认 / 案件 Timeline / 待办里的目的文字走 `krbPurposeFull(b)`（带项目 / 类型）；KR 到店完成时新目的映射到旧的「做了什么」默认项（`krbDidDefault`：holdbook → 使用在韩持有，其余 → 其他）。
- **五 / 六 KR 未安排预约**：来源本来就写 `r.clinicName`（案件来源诊所），确认无「本院」；管理项目按 iid 找（不再按名字）；已经加进今天到院（`pickedMgmt`：今日进行 / 本次使用）的不算未安排；术后管理已有预约行的本来就不算；只列在韩期间（20-11）不变。
- 测试：selftest 新增 R71a（A1，pcStage 夹具：只放印尼术后管理 / 折叠 / 多次分行 / 同天合并 / 占位 3 个来访目的 + 勾选 + 不勾不能提交）、R71b（KM1，pcStage 夹具：来源写诊所名 / 同名两笔分开 / 已在今天到院不算）；R58a 改成新模型，BK1a 在时间冲突检查前把目的改成 newvisit。**测试教训**：`ST.cleanup` 在 `gmc_cfg_stsnap` 里已有旧快照时只还原到旧快照，残留的 T- 测试案件会越积越多（这次清掉 167 个，都不是用户案件）并让 roletest 误判「施术子案件页」；测完用 `Store.mutateClinic` 把 T- / T2- / `prep` 案件和客人删掉再清 `gmc_cfg_stsnap` / `gmc_cfg_stfix`。R68a 在 IN 分页（1440 视口）基线上也失败，与本次无关。

## CMD-1021-02 补充（2026-10-21，追加；取代 CMD-1019-23 / 1020-03 / 1020-05 里预约弹窗「每行各自选日期 / 时间、底部预览『将建 N 张到院卡』」和 CMD-1012-04 / 1020-05 里项目库「本地管理项目」「院长所需时间在项目层」，旧文字保留作历史）
- 基准 **f1d0209**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段：KR 管理项目规格 `specs[].dirMin`；演示数据的院长操作设定在 `krLocalLib` 里按「项目从没设过」懒补，所以不需要升版本）。
- **一 KR 术后 / 管理预约弹窗**（kr.js `krCbRender` 重写）：① 底部［取消］［确认预约（N）］固定在弹窗底端（`.modal-box` 改 flex 列，中间项目区自己滚动）；② 拿掉「将建 N 张到院卡」，预览只剩每天一行「10/31（六）· 术后管理：… ；管理项目：…」，并入已有到院的那天行末写「（并入已有到院）」；③ **同一天的项目一起约**：列表按日期分组（早 → 晚），每组一个日期 + 一个时间（`KR_CB.dayTime[日期]`，`krCbSyncTimes` 把时间同步到组里每一行），组里项目（勾选框 + 术后管理 / 管理项目标签 + 项目名 + 术后第 N 天或第 k 次）；某一项改日期（`krCbSet(i,'date')`）移到那一天的组（没有就新建），组里改日期（`krCbMoveDay`）整组搬家并合并；休诊日 / 营业时间外 → 整组红底红字（`krCbDateErr`，该组项目自动不勾不能约）；晚于离境日 → 整组橙字；回印尼做的单独一组「不在这里约，交给 IN」；管理项目「这次约几次」（− N +）移到列表下方一个小块。④ **院长操作**：组里有院长操作项目 → 这一组有院长下拉（`krCbSetDir`，改整组）+ 项目行写「院长操作 N 分钟」；检查院长是否有空、占用时长、第二个以后弹延长窗都沿用 20-05（`krCbGo` 没动，只是按组取时间）。
- **二 KR 项目库**（`ADMIN_RENDER.krsrvc` 重写，`krpSetTab` / `krpSetPart`）：① **规格各自的院长时间**：管理项目「院长操作 是 / 否」仍在项目层，「院长所需时间」项目层是默认值，编辑页多一块「院长所需时间（按规格）」每个规格一栏（`sp.dirMin`，不填 = 项目层的值，`krlSave` 清理）；`dirOpInfo(hid, 名字)` 名字带「 · 规格」时按规格取（预约弹窗、冲突检查、日历占用全部走它）。演示数据（`DEMO_DIROP`，`krLocalLib` 懒补）：热玛吉 300发 30 / 600发 45 / 眼部 225发 30 / 眼部 450发 45，ONDA 提升各规格 30；② **顶层三个 tab**：施术项目｜管理项目｜非活性化（`KRP.tab`），非活性化里两类都放、标类型（施术项目 / 韩国术后管理 / 管理项目）；「本地管理项目」字样在 KR 页面改「管理项目」；管理项目新增［非活性化］/［重新启用］（`krlToggleActive`，`p.active===false`），非活性化的管理项目不能再被选（`krLocalLibOn(hid)`：术后管理设定候选、加项目选择器、更换为、预约占位、可选范围都改用它；按 id / 名字查已有项目仍用 `krLocalLib`）；③ 施术项目 tab 下面是部位胶囊筛选（全部 + 各部位 + 韩国术后管理，`KRP.part`），管理项目 tab 下面是 12 类胶囊筛选（`KRL.cat`）；④ 全宽：`#admin-body` 内联 `max-width:1000px`，项目库页渲染时改 `none`，`openAdminPage` 每次进管理页先复位 1000px；⑤ 项目可展开看规格（点 ▸ / 项目名，`krlToggle`）：规格｜价格｜第一次使用 / 间隔｜院长所需时间（院长操作的才有）；施术项目如果有规格同样可展开（目前施术项目没有规格数据）；第一次使用 / 间隔目前是显示（规格里有 `firstDay` / `interval` 才用，没有显示默认「第 1 天后 · 每隔 1 天」），KR 发诊疗方案 / 到院加项目时的默认值没有读它（没做）。
- 测试：selftest 新增 R72b（KM1，pcStage 夹具）；R52b / R30b 里直接设行时间的断言改成设 `KR_CB.dayTime`、「将建 N 张」断言改成无该文字。**测试教训**：`ST.cleanup` 在 `gmc_cfg_stsnap` 已有旧快照时只还原到旧快照，T- 案件 / 占位残留越积越多（这次又清掉一批，都不是用户案件），BK 用例会留下和 stageC 同名的 T-待到院案件，导致后面的 R66a / R66b / R67a / R69a 找错案件——先跑这几个，再跑 BK；跑前先清残留。

## CMD-1021-03 补充（2026-10-21，追加；取代 CMD-1013-08 三·3 里「项目进程 memo = 一段文字（KR 写，IN 只读）」和 CMD-1015-27 / 1020-xx 里管理项目已完成「已完成 ×N（剩 N 次）」，旧文字保留作历史）
- 基准 **2f64277**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（新字段 `c.krProgressMemos`；旧的单条 `c.krProgressMemo` 在启动修复 `repairVisitState` 里迁成第一则，读取时也兼容未迁移的）。
- **备注 / memo 没存上的原因**（我没法在 KM1 复现“完全存不上”——行备注和 memo 在正常路径都存得住，下面是实际查到的三条会让它“看起来没存上”的路径）：① 增加项目（`kind:'增加项目'`）行上写的备注存在行的 `s.note`，而项目转成持有项目（`holdLocalAdd`：待付款管理项目一加进来就持有 / 20-17 的旧待付款转持有）时这几行被整行删掉，备注跟着丢，到院卡里持有项目行读的是 `it.todayNote`（Ayin 10/30 那张卡最可能是这个）→ 现在转持有时把行备注搬到 `it.todayNote`；② 行备注只在 `change` 事件保存，保存走 `krMut` 整页重画，输入后直接点［操作完成］时，重画把按钮换掉，点击被吃掉（要点两次，看起来像没保存）→ 行备注改成静默保存（`krNoteQuiet`，不整页重画），并加 Enter 保存（`onkeydown` → blur）；③ 项目进程 memo 只放在「今天」到院卡里的 `krProgressBlock`，到院结束 / 已完成后卡片移到「已完成」，memo 就不显示了（以为没存）→ memo 挪成案件区块下面独立一张卡，任何状态都在。
- **项目进程 memo 改记录**（kr.js `krMemoCardHtml` / `krMemoAdd`，data.js `krMemoList` / `coreAddProgressMemo` / `migrateProgressMemo`）：输入框 +［保存］，保存后列成一则一则（时间 · 谁 · 内容），不限次数、最新在上，输入框清空可继续写；到院结束 / 已完成之后照样显示、仍可补写；**KR 室长 / 管理者可写（`krCan()`），院长 / 代表院长仍是只读**（现有规则照旧，没改）；IN 只读，显示在「赴韩施术」tab 的项目进程区（`krTimelineTabHtml`）；到院状态卡上的［备注］（`krArriveMemoOpen`）现在也是追加一则 memo，卡上显示最新一则；每则 memo 进案件 Timeline「项目进程 memo：…」，**类型归「沟通」**（`tlTypeOf` 加了关键词）。
- **状态栏**：管理项目完成后只写「已完成」（去掉「（剩 N 次）」和「×N」；剩余次数在项目名下方灰字）。
- 测试：selftest 新增 R73a（KM1，stageC 夹具）。**注意**：在 KR 页面的测试里，`Store.mutateClinic(...)` 回调里不要用 `krFindCase(...).c`（拿到的是拷贝，改了不落盘），要在回调里直接 `CASE_ITEMS.filter(...)`；脚本里不要用变量名 `t`（覆盖翻译函数）；案件页内容用 `#kr-casedetail`，`document.querySelector('.content')` 取到的是工作台。

## CMD-1021-04 补充（2026-10-21，已含原 CMD-1021-05；追加；取代 CMD-1021-03 里「项目进程 memo 是案件区块下面独立一张卡」、CMD-1021-02 里预约弹窗组标题「日期输入框 + 时间下拉」，旧文字保留作历史）
- 基准 **b4009e8**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（memo 新增字段 `vk`；旧 memo 在启动修复 / 读取时补）。
- **一 预约弹窗［全选］［全不选］**改成线框小按钮，放在说明文字下一行、和列表有间距。**二 晚于离境日**（`krCbGone`：只在填了真正的离境日 `stayOut` 时判断，只有「最早可回国日」的仍是橙字提醒）：「韩国或印尼」的项目自动变「回印尼做」（`krCbSyncTimes`，`r.autoIn`）、下拉锁住灰字「客人 MM/DD 已离境」，提交后走交给印尼（不建韩国到院、IN 收通知、进 IN 未安排预约），把日期改回离境日之前就恢复；「必须在韩国」的项目和管理项目红字「客人 MM/DD 已离境，请改到离境前」、不能勾选；改离境日后重新打开弹窗按新离境日判断。**三 日期 / 时间输入框**：组标题日期只写一次「10/29（四）」，右边有边框的时间选择框（时钟图标 + 时间 + ⌄，`.kr-fld`），院长选择同样样式；每行「改日期 [日历图标 日期]」有边框（`krFldDate`，整个框可点开日期选择），拿掉「→ 移到那一天的组」（说明放弹窗顶部）；`.kr-fld` 悬停 / 聚焦边框变品牌色 + 外圈（app.css）；组标题上的整组改日期框拿掉（`krCbMoveDay` 保留给测试）。
- **四 memo 跟着那一次到院**：`c.krProgressMemos[]` 每则 `{id, at, by, text, vk}`，`vk` = `'main'`（施术当天）/ 到院 key（`subCaseKey`）/ `''`（案件层）；到院卡（`krCaseCardHtml`）里放这次到院的 memo（`krVisitMemoHtml`：「memo N 则」+ 输入框 +［保存］（只有 KR 室长 `krCan()`）+ 列表 时间 · 谁 · 内容），卡标题显示「memo N」（0 不显示，收起的卡也显示），**每次到院各自的 memo 只在自己的卡里**；到院卡表格栏位改 **项目类型｜项目｜备注｜地点｜状态｜操作**（`KR_TBL_COLS` / `krTblHead` / `krTblRow` / 持有项目行）。**旧 memo 怎么归属**：`migrateProgressMemo`（启动修复 + 写入时）补 `vk`：有写入时间的按日期对上施术日 / 到院日（`memoVisitGuess`），判断不了的放案件层 `''`；最早那条单行文字 `c.krProgressMemo` 迁成第一则，时间 / 作者取 Timeline 里「项目进程 memo：…」那条记录（找不到才是「—」· KR 室长）。**五 Memo（总）**（`krMemoTotalHtml`）放在 **项目卡 → Memo（总）→ 案件** 之间：按时间列出这个案件所有 memo，每则标是哪次到院（「10/30（五）· 施术」）或「案件层」，这里也可以写（写的是案件层 memo）；页头「到院」状态卡（`krArriveCardsHtml`）不再显示备注内容，卡上的［备注］按钮拿掉（`krArriveMemoOpen` 留着没有入口，`krArriveMemoSave` 写成「施术当天」的一则 memo）。**六 memo 时间 / 作者**：`MM/DD HH:mm · 账号名`（`memoTimeText`；IN 的项目进程只读区也一样）。**七 案件大卡**：`krTabItems` 里「案件」标题 + 今天 / 已预约 / 已完成的所有到院卡外面包一张大卡（`.kr-casebig`，和项目卡同样式），到院卡是里面的小卡。
- 测试：selftest 新增 / 改 R73a（memo 跟着到院、各到院不串、Memo（总）位置 / 内容、完成后补写、IN 只读、旧 memo 迁移带时间作者）、R72b（组数改按 `.krcb-grp`）、R22b（表头）、R29b / R57a（到院卡取内层卡，不取大卡）、R47a（状态卡没有［备注］）。**R57a 在今天（周三）用 pcStage 夹具失败**：夹具里施术日在 6 天后、而用例造的到院行在今天，「术后第 N 天」算出负数不显示——和本次改动无关，是用例对日期的依赖。**教训**：用 Python 补丁做「区间替换」时，区间里夹着别的函数（这次 `krProgressMemoSave` 到 `krItemNote` 之间夹了 15 个函数）会被一起删掉——靠 `bash dev/check.sh` 的 removed 清单发现并从 HEAD 补回。

## CMD-1021-06 补充（2026-10-21，追加；取代 CMD-1021-01 里行内［取消］按钮、CMD-1020-02 / 03 里项目卡栏位和灰按钮旁写原因，旧文字保留作历史）
- 基准 **24e771c**，单个提交，**未推送**，不带开关，**数据版本不变（55）**，只改显示（没跑 roletest）。
- **项目卡三个 tab 统一栏位**（kr.js：`krSrcTag` / `krRowDiv` / `krHeadDiv` / `krOpsCell`；常量 `KR_SRC_W 76px` / `KR_OPS_W 190px`（两个按钮宽）/ `KR_OTH_W 76px`）：第一栏「来源」标签——印尼购买（浅蓝 `#E3EEFB`，付定金时在印尼选的）/ 在韩购买（浅绿 `#E2F3E6`，`krAddOn` / `preBalanceAdd`），名称后面的「在韩增加」小标签拿掉；术后管理跟对应施术项目的来源；最右两栏 = 操作（按钮）+ 其他（带下划线的文字链接）。管理项目三张小卡（未使用 / 已预约 / 已使用）共用同一套 8 栏栏宽（`krMgGrid`，`krUsedGrid` = 同一个），已使用加回「管理间隔」，栏位 来源｜项目｜次数｜管理间隔｜使用时间｜到院时间｜操作（留空，保持两个按钮宽）｜其他（查看案件）。
- **灰按钮只变灰**：`krOutBtn` 不再在旁边写 `.kr-why` 说明，原因只放 `title`（悬停；按钮和外面的 span 各一份，空 tip 用「暂时不能操作」兜底）；`krBtn`（到院卡等）不动。不能改时间的行（已到店 / 没权限）［修改时间］灰 + tooltip，不再整个消失。
- **［取消］→ 下划线链接「取消购买」**（`krLink`，其他栏，只在待付款未使用行；用过 / 没权限灰 + tooltip）；确认弹窗和事后处理同 1021-01，用词改「取消购买」，Timeline 记「取消购买：xxx（₩…）」。`krViewBtn` 加下划线，三个 tab 的「查看案件」都放其他栏。
- 测试：selftest 新增 R74a；R67a / R69a / R54b 等断言按新写法改；`rowOf`（R30b）和 R59b 去掉来源标签文字的干扰。KM1 批次 R22b / R28b～R31b / R47a / R49a / R52b～R54b / R56a～R59b / R67a / R69a / R72b / R73a / R74a 通过（R50a 是 A1 用例，不在 KR 分页跑）；测试数据已清（三家诊所案件 0）。

## CMD-1021-07 补充（2026-10-21，追加；取代 CMD-1021-04 里到院卡标题的「memo N」小标签，旧文字保留作历史）
- 基准 **a383b5a**，单个提交，**未推送**，不带开关，**数据版本不变（55）**，只改显示。到院卡标题行（`krCaseCardHtml`）：日期时间字号 14px（`<b style="font-size:14px">`）；状态标签（待到店 / 待到院 = 浅绿 `#E3F4E8`，tone `ok`；已完成 / 全部延期 = 灰绿 / 灰，其他照旧）**移到标题行最右边**；**已到店 / 已到院（蓝）维持紧跟标题**；标题里的「memo N」拿掉，改成最右边标签前的「备注：N / 无」（`mvk!==null`；收起也显示；待到店 / 待到院且 0 则不显示，其他状态 0 则写「无」）；到院卡里面 memo 区块的「memo N 则」不动。顺修：非今天的卡（可折叠）标题行原来写了两个 `style` 属性，第二个（flex）被忽略，所以右侧元素不靠右，已合并。测试：selftest 新增 R75a，R73a 的「memo 3」断言改成「备注：3」。

## CMD-1021-08 补充（2026-10-21，追加；取代 CMD-1021-03 里「院长 / 代表院长只读 memo」、CMD-1020-10 里「普通院长没有任何客户详情」、CMD-1020-16 / 1019-10 里 KR 诊疗方案管理项目一行「第一次使用 N 天后 / 间隔」手填，旧文字保留作历史）
- 基准 **2998d7d**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（项目库新字段按「没设过就读取时补演示值」，用户改过的不动；案件条目新增可空字段 `intNa`）。
- **一 院长只读客户详情**（kr.js `krClientDetailAllowed`）：不加菜单；院长自己负责案件页的客人名可点 → `kr-clientdetail`（`krClientRows` 本来只含他负责的案件，所以别人的客人打不开）；基础信息（无联系方式 / 护照）、医美史、韩国持有、本院案件记录（只列他负责的）；没有［发起内部对话］［补登医美史］（`krCan()` 假）；KO1 维持原样（有菜单，可发起对话）。**二 侧边栏**（ui.js `sidebarAutoState` / `SIDEBAR_COLLAPSED`）：宽度 < 1536px 自动收成图标窄条（悬停 title 显示菜单名，点 ‹ › 展开），手动展开 / 收起后记在 `localStorage.gmc_cfg_sidebar`（`'1'` 收起 / `'0'` 展开，之后不再跟宽度走）；窗口缩放时没有手动选择就跟着变；IN / KR / 院长 / 老板同一个 `buildSidebar`。分页标题 `gmcPageTitle` 和 `roletest.js` 的 `navLabels` 改读 `title`（收起时文字是图标）。1440 宽工作台：侧栏 60px，待办栏 426px、日历 851px（2 : 1），待办「进程」栏 128px。
- **三 Step 3-2**：KR 到院「需要调整方案」勾选保留 → 下一步 的「添加项目」改用和 Step 2 同一个块 `krAddBoxHtml`（同一份状态 `KR_ADJ`）：收起时施术项目 N / 管理项目 N 两张 3 级卡（可移除）+［添加项目］，打开后底部左［取消］右［确认添加（N）］；Step 2 的按钮也加了（N）。3-3（不建议手术 → 取消项目 → 更换项目）维持原来的 `krAddChooser` 直接展开。**这一块和项目卡右上［增加项目］（`krAddOnCard`，付清尾款后在韩加项）不是同一块**：3-2 / 3-3 只在 KR 到院评估之后、付清尾款之前的向导里出现。
- **四 管理项目第一次使用 / 建议间隔**（KR 项目库）：项目层 `firstNa / firstMode('all'|'spec') / firstAll`、`intNa / intMode / intAll`，规格层 `sp.firstDay / sp.interval`（各规格分别设定时用）；解析 `mgFirstOf(p, sp)` / `mgIntervalOf(p, sp)`（null = 无关）、`mgSchedOf(p, sp, 总次数)` → `{firstDay, interval, intNa}`；编辑页 `krlSchedHtml`（所有规格共用 / 各规格分别设定二选一 + 「无关」，没勾无关必填，红字校验在 `krlSave`）；规格展开显示「术后第 N 天开始 · 建议间隔 K 天 / 无关」（`krmSpecFirst`，拿掉假默认值）。演示数据（`DEMO_MGSCHED`，`krLocalLib` 里 `h._mgDemo` 一次性补，只补没设过的）：ONDA 提升 第一次 14 天 / 间隔 14 共用；热玛吉 第一次无关 / 间隔按规格 180 / 240；钛提升 第一次 7 天 / 间隔无关；其他项目默认 7 / 7。**原来第一次使用存在哪里**：KR 发送诊疗方案 / 补加 / 到院添加的管理项目一行里手填（`KR_SUB.mg[id].first` / `interval`，`krMgRowFields` 的输入框）→ `krMgScopeItem` 写进条目 `firstDay` / `interval` → IN 选项目复制（`c.recommended`，ui.js）→ 付款后 `procedureItems[].firstDay / interval`；读的地方：`krMgSuggest`（建议日期，预约弹窗 / 项目卡 / 未安排预约共用）、`krMgIntervalText`（项目卡「管理间隔」栏）、`mgmtScheduleText`（IN 推荐整理 / 打印）、`printPlanSchedule`、`recSummaryData`。**这次**：诊疗方案 / 补加 / 到院添加不再填也不显示（`krMgRowFields` 拿掉两个输入，`krMgScopeItem` / 到院添加改读项目库）；条目仍存 `firstDay`（'' = 无关）/ `interval` / 新字段 `intNa`（付款后不回头读项目库）；`krMgSuggest`：第一次 = 案件最后一个施术日（`mgLastSurgDate`）+ 第一次使用 N 天，没有施术 / 无关 → 不显示；之后每次 = 上一次实际使用日 + 建议间隔，间隔无关 → 第二次起不显示。`krMgIntervalText` 改写「术后第 N 天开始，建议间隔 K 天 / 间隔无关 / 开始时间无关」。
- **五 院长写 memo**：`krCanMemo()` = `krCan()` 或院长 / 代表院长；到院卡 memo、Memo（总）、`krProgressMemoSave` 都改用它（IN 仍只读，KR 室长照旧）；记录显示「时间 · 账号名（院长名）」。
- 测试：selftest 新增 R76a（项目库调度 / 建议日期规则 / 必填校验）、R76b（KD1：客户详情 / memo）、R76c（侧边栏）；R16b / R72b 等按新规则改断言；roletest 新增 3 格（客人详情能打开 / 能发起对话 / 项目进程 memo 能写），KR 5 个 + IN 4 个账号 0 不符（只有「规格没写」的格子）。**R58a / R59a 在基线 2998d7d 上也失败（IN 印尼卡灰字「建议」，和日期有关，非本次引入）；R64b 在残留夹具多的环境里失败（院长 7 天没有空日子），单独清干净重跑应通过（本次清理后未再复跑）**。
