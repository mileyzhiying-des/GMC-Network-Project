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
1. **赴韩项目的 KR 端维护**：韩国侧页面（KRC/KRD）没建，赴韩项目新增/翻译录入没有入口；原型里"演示用"角色下拉已在第三部分删除，所以不再演示 KR 室长维护（Notion IN-SRVC-01 写"赴韩项目没有操作"，一致）。
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
