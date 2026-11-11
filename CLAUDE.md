# Git 规则（开发要求，2026-10-29，优先于其他规则）/ Git Rules (from the developer, 2026-10-29, override all other rules)

1. 没有被告知之前，绝对不要新建分支，也不要把分支推送到远端。 / Never create a new branch or push any branch to remote unless explicitly told.
2. 绝对不要把分支合并到其他分支。 / Never merge a branch into another branch.
3. 每完成一项大的工作就提交，提交说明用清楚易懂的英文写。 / Commit after each major piece of work, with a clear English commit message.
4. 没被告知也要自己提交；每完成一项大的工作后，告诉用户已提交（提交号 + 说明）。 / If not told to commit, auto-commit after each major piece of work and notify the user (hash + message).
5. 只在 `V5` 分支上工作；用户转达「开发说可以推了」时，只推送 `V5` 到远端。 / Work only on branch `V5`; push only `V5`, and only when the user relays the developer's instruction to push.
6. 开始任何任务前先确认当前分支是 `V5`，不是就停下来问。 / Before any task, confirm the current branch is `V5`; if not, stop and ask.

> 以上和下面所有旧规则冲突时，以这一节为准。旧的「develop / feature 分支、合并到 develop / main、用户说推送才推送 develop、提交说明用中文」等做法已作废。

---

# 工作规则（最高优先级）

1. 语言：所有回复、计划、进度说明、提问、总结一律使用简体中文（git 提交说明例外：按上面「Git 规则」用英文）。变量名、函数名保持英文；新写的代码注释用中文。
2. ~~Notion 只读：可以打开 Notion 查阅业务规则，但绝对不要创建、修改、删除任何 Notion 页面或数据库。~~（**已废弃**，2026-10-07 由 CMD-1007-00 取代，用户已确认；改成下面的「Notion 写入规则」，旧文字保留作历史）Notion 由用户另外维护。发现指令和 Notion 规格有冲突时，停下来告诉用户，不要自己决定（除非指令里明确写了"以本指令为准"）。

   **【Notion 写入规则】（2026-10-07，CMD-1007-00）**
   - 你对 Notion 原则上只读
   - 唯一例外：Dashboard 下的「Code 任务」数据库，只能做两件事：① 修改任务的「状态」栏位；② 在任务正文的「📥 汇报」区写入内容
   - 不能改「📤 指令」区，不能新建或删除任务，不能改其他任何 Notion 页面（**2026-11-02 起 Code 任务行多可改「影响后端」「影响的动作」两栏；2026-11-10 起再多可改「影响流程」栏**，见下面「固定规则：写汇报时要填…」和「影响流程」）
   - 收到"去看 Code 任务"时，按编号顺序执行所有「待执行」任务；跳过「已作废」
   - 开始做时把状态改成「执行中」；动手前需要确认的事项写在汇报区，状态改成「待确认」后停下；做完改成「完成」
   - 若任务有「取代」栏位，以新任务为准
3. 一次只做一个任务：动手前，先列出会改动的文件，以及相关函数和字段的所有引用位置，给用户确认；完成后在 `V5` 分支上 git commit（英文说明写清楚改了什么，不推送、不合并，见上面「Git 规则」）。
4. 不扩大范围：任务里没写的功能、文案、逻辑不要顺手修改。觉得有必要改，先提出来问用户。
5. 完成后汇报：改了哪些文件、怎么自测的、哪里偏离了要求以及原因。

**【固定规则：修改必须写进 Notion 汇报区】（2026-10-12，用户要求，最高优先级，和上面「Notion 写入规则」同级）**
- 每次做完**任何修改**（包括任务以外的补充修改、在对话里答复用户之后做的改动），都要写进对应 Code 任务的 Notion「📥 汇报」区：写清楚**日期、提交编号、改了什么、影响哪些功能**。
- 不属于任何任务的修改，写进**最相关的那个任务**。
- 有问题要问用户时，也写进汇报区，并把任务状态改成「待确认」。
- **不要只写在对话或 CLAUDE.md 里**（CLAUDE.md 是离线备份，Notion 汇报区才是用户看的地方）。

**【固定规则：写汇报时要填「影响后端」「影响的动作」两栏】（2026-11-02，CMD-1102-01，用户要求，和上面「修改必须写进 Notion 汇报区」同级；已和开发交接，启用 Dashboard「交接后的变更同步机制」）/ Rule: fill the "影响后端" and "影响的动作" columns whenever you write a report (2026-11-02, CMD-1102-01)**
- 每个任务写汇报时，**都要填 Notion「Code 任务」这一行的「影响后端」和「影响的动作」两栏**（这是 Code 除了「状态」和「📥 汇报」区以外，唯一可以改的两栏；上面「Notion 写入规则」里的“只能改状态和汇报区”由此放宽到这两栏，其他栏位和「📤 指令」区仍然不能改）。/ In every report, also fill the two columns "影响后端" (affects backend) and "影响的动作" (affected actions) on the task's row — besides "状态" and the "📥 汇报" section, these are the only fields Code may edit.
  - **只改画面层**（样式、文案、排版、显示位置）→ 影响后端 = **否**。/ UI-layer only (style, copy, layout, placement) → 影响后端 = No.
  - **动到资料层**（新增或修改栏位、新增动作、改动作的时机或条件、改计算方式、改权限、改自动规则、改发号方式）→ 影响后端 = **是**，并在「影响的动作」写出影响哪个动作。/ Data-layer changes (new or changed fields, new actions, changed timing or conditions of an action, changed calculations, permissions, automatic rules, numbering) → 影响后端 = Yes, and name the affected action(s) in "影响的动作".
  - **动作名称**以 Notion「开发交接」05 的动作卡为准；05 还没写到的，写动作描述（例：「KR 按［客人已到院］」）。/ Use the action names from the action cards in Notion "开发交接" 05; if 05 does not cover it yet, write a short description of the action (e.g. "KR 按［客人已到院］").
  - 如果任务建立时这两栏**已经填了**，照实际做的结果**核对**，不对就改正，并在汇报里写一句。/ If the task row already has them filled, check against what was actually done; correct them if wrong and say so in one line of the report.
  - **启用前（2026-11-02 之前）的任务不补填。** / Tasks before 2026-11-02 are not back-filled.

**【固定规则：写汇报时要核对并填「影响流程」栏】（2026-11-10，CMD-1110-01，用户要求，和上一条同级）/ Rule: check and fill the "影响流程" (affected flow) column in every report (2026-11-10, CMD-1110-01)**
- Notion「Code 任务」新增栏位「影响流程」（多选：否 / F1 / F2 / F3 / F4 / F5-1 / F5-2 / F5-3 / F6 / F7 / F8 / F9），对应 FigJam「GMC Flow」1110 版流程图。Code 除了「状态」「影响后端」「影响的动作」「📥 汇报」区以外，**还可以改这一栏**（其他栏位和「📤 指令」区仍然不能改）。/ The new multi-select column "影响流程" maps to the FigJam "GMC Flow" 1110 diagram; Code may edit it in addition to status, 影响后端, 影响的动作 and the report section.
- 建任务时 Claude（聊天）已先填。Code 做完后**核对**：实际改动和填的不一样，就改这一栏，并在汇报写「影响流程：原填 X → 改成 Y，原因…」。/ The task creator (Claude chat) fills it first. After finishing, check it against what was really changed; if it differs, correct it and write "影响流程: was X → now Y, because …" in the report.
- **算流程变动**：多一步或少一步、分支或判断条件变了让人走到不同的路、原本挡的不挡了（或反过来）、状态或走向变了、换人做。/ Counts as a flow change: a step added or removed; a branch or condition changed so people take a different path; something that used to block no longer blocks (or the reverse); a status or direction changed; a different person does it.
- **不算**：只改画面、文字、显示方式、提醒文案 → 影响流程 = 「否」。/ Does not count: UI, copy, display or reminder wording only → 影响流程 = No.
- 图的范围：F1 完整旅程 / F2 来访归属 / F3 一天的子案件 / F4 面诊 / F5-1 定金到施术日期 / F5-2 施术变动和行程变动 / F5-3 韩国行程结束 / F6 施术当天 / F7 术后管理 / F8 复诊评估 / F9 本地项目。/ Diagram scope: F1 full journey · F2 visit ownership · F3 one-day sub-case · F4 consultation · F5-1 deposit to surgery date · F5-2 surgery change and trip change · F5-3 Korea trip end · F6 surgery day · F7 aftercare · F8 revisit evaluation · F9 local items.
- 改到流程的任务，汇报里**另外写一句「流程上改了什么」**（哪一步、从什么变成什么），方便更新流程图。/ For tasks that change a flow, add one extra line in the report, "what changed in the flow" (which step, from what to what), so the diagram can be updated.

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

## CMD-1021-09 补充（2026-10-21，追加；取代 CMD-1021-03 / 1021-04 里「项目进程 memo 不限次数、按［保存］存一则」「Memo（总）」「到院卡 memo N 则」，旧文字保留作历史）
- 基准 **8001faf**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（备注都存在原来的字段里，没有改结构；新增可空字段 `c.visitNoteDraft`、memo 的 `auto`、项目 / 行备注的 `todayNoteAt/By`）。
- **一 在韩加项待付款不推给 IN**：`closeBlockers`（data.js）去掉「在韩待付款」那一行 → IN 待办不再生成 `待收款：在韩待付款…`、不算「待我处理」、IN［结束案件］也不被它挡；已生成的待办是现算的，所以自然消失，没有动案件。全站核对：IN 待办只剩 `closeBlockers` 这一个入口；`在韩加项已付款：…（金额，结算单）` 这条 IN 通知（`coreAddOnPaid`，info 级、不弹）**仍会发给 IN 且带韩元金额**，和「金额只有 KR 看得到」不一致，**没改，等业务方决定**。**二** KR 待办 kind `pay`：`todoStatusOf` 状态写「待付款」，名称走 `buyName`（不写 ·N 次）。**三 已完成施术在日历上划线的原因**：CMD-1013-08 当时的规则就是「已完成的面诊 / 施术 / 术后管理加删除线 + 变淡」（`krcBlockStyle`：`r0.done`、`krcSubChip`、IN 的 KR 医院日程 `ui.js` 两处 `it.done`），不是把状态误当取消；现在改成灰色（`opacity .5 + grayscale`），删除线只留给已取消 / 未到店（IN 本院日程原有的不动）。
- **四 诊疗方案已出**：`coreSubmitReport` 的 IN 通知改成「诊疗方案已出：客人（Case ID），请联络客人确认」`level:'action', popup:'confirm'`（弹出停住、按［确认］，点开进面诊资料 tab）；`notifTodoKind` / `NOTIF_ACTION_RE` / `openNotif` 的规则同时认「已到 / 已出」。**原来只是普通通知的原因**：旧文字「诊疗方案已到」被 `notifTodoKind` 归到 `'todo'`（弹一次、几秒自动收起，不是停住）——和 20-13「KR 已确认面诊时间」同一种（那条我当时也只写了 level:'action'，并没有 popup:'confirm'，所以也是自动收起）；通知只发给「操作过这个案件 / 当天上班」的室长。IN 待办沿用「面诊资料已到：联络客人选项目」（`plan`）；消失时机：开始选项目 / 付定金，或［结束案件］（G2：项目确认中结束 → 仅出报告，已验证）。
- **五 管理项目改时间到今天点［操作完成］没反应的原因**：「客人已到店」是按**行**记的（`s.arrived`），到院卡的状态却按整次到院算（有一行到店 = 这次已到店，`coreVisitState`）。把一行改到 / 预约进一次已到店的到院时，这一行自己没标到店，`coreSubDone` 的守卫 `术后管理行必须 s.arrived` 直接 `return false`，按钮实心却什么都不发生（和同名两笔无关——同名两笔的 iid 是对的，复现里扣的是被改时间的那一笔）。**修**：`inheritVisitArrival(c, s)`（`coreSubTimeEdit` / `coreUnitBookUse` 里，改到已到店的到院就继承到店，改到没到店的日子就清掉）；`coreSubDone` 在行没标到店但这次到院已有别的行到店时也放行；新增 `coreSubDoneBlock(c, id)`（和 `coreSubDone` 的拒绝条件一一对应），`krHoldSubDone` 先检查，不能做时弹「暂时不能［操作完成］：原因」，不再没反应。术后管理改到今天 / 今天改到别天再改回来同一套。
- **六 到院备注重整**（data.js「CMD-1021-09 六」一段 + kr.js）：项目备注（`it.todayNote` / `s.note`，带 At / By，行备注结束前都能改，`krCanMemo()` 才能写）；整体备注 = 到院卡下一个输入框（没有［保存］，离开输入框存 `c.visitNoteDraft[vk]`），`coreEndVisitToday` / `coreEndSubVisit` 时 `coreVisitNoteCommit` 存成一条 `c.krProgressMemos {auto:true, vk}`，到院重新打开（`coreReopenVisit` / `coreVisitState` 的重开）`coreVisitNoteReopen` 变回草稿；结束后到院卡里项目备注 / 整体备注只读；到院卡标题「备注：N / 无」= 整体 + 有写的项目备注（`visitNoteCount`）；拿掉到院卡里的「memo N 则」记录列表和 Memo（总）；项目卡下面新「备注」卡（`krNotesCardHtml`，IN 端项目卡里同一份列表 `caseNotesListHtml`）：全部备注只读、最新在上，每条 `时间｜整体 / 项目名 —— 输入人（IN / KR）`，浅色底圆角；来源 = 旧 memo / ［增加备注］（`krProgressMemos`，旧的 21-03 / 21-04 memo 按「整体」）+ 各到院整体备注 + 项目 / 行备注（`caseNotesAll`）+ IN 备注记录（`c.inNotes`，KR 未读标出来，KR 的「IN 备注」已读卡 / 结算前必须读过保留）；底部［增加备注］= 不属于任何到院的整体备注（院长 / 代表院长 / 室长都能写，IN 在自己项目卡的［增加备注］写 IN 备注记录）。**自动翻译**：`noteTextHtml(n, 看的人 IN / KR)`，作者角色和看的人不同 → 「译：…［查看原文］」（`noteToggleOrig`，`NOTE_ORIG` 记切换），相同不显示；**模拟翻译 `mockTranslate(text, 原文语言, 目标语言)` 在 data.js（目前直接返回原文）= 要接真正翻译 API 的位置（交给开发时加进 Integrations & APIs）**；备注卡（KR / IN）和 KR 到院卡整体备注只读显示都走它。
- 测试：selftest 新增 R77a（IN：在韩待付款无待办 / 诊疗方案已出弹窗 + 待办 → ［结束案件］→ 仅出报告）、R77b（KM1：KR 待办待付款 / 改时间到今天操作完成 / 原因提示）；R73a 的 memo 部分按新备注重写，R47a / R76b 断言改过。roletest 9 个账号 0 不符。**R65a / R66a 在带别的用例留下的夹具时会误失败（重新建夹具通过）**。

## CMD-1021-10 补充（2026-10-21，追加；旧文字保留作历史）
- 基准 **c9f326b**，单个提交，**未推送**，不带开关，**数据版本不变（55）**。**bug：有待付款项目时［结束今日到院］没被拦**——**原因**：拦截只写在主到院的 `coreEndVisitToday`，其他到院（术后管理 / 管理项目预约，子到院）走的 `coreEndSubVisit`（CMD-1019-22 `2063585` 加的）**从来没有这道检查**；用户的到院是「今天 11:00 · 管理项目」= 子到院，所以没被拦。**用户的两个怀疑都查了，都不是原因**：① ［去付款］→［稍后付款］（`krPayLater`）只关弹窗、清 `KR_PAY_SVC`，不改项目任何字段（R78a 路径 A：稍后付款后仍待付款、红条在、结束仍被拦）；② 待付款项目转持有（`holdLocalAdd`）后仍带 `pendingPay:true`，`pendingPayItems` 照样找得到（主到院的检查在转持有后也有效，R78a 验证）。**修**：新增 `endBlockPending(c)`（data.js，用 `pendingPayItems` = 红条的同一个来源），`coreEndVisitToday` / `coreEndSubVisit` 都先调它，被拦返回 `{ok:false, pending:true, err:'还有未付款项目：丽珠兰 S（手打） · 1cc（₩300,000），请先付款或取消购买'}`；UI（kr.js）`krEndAskOpen`（按［结束今日到院］时先查）/ `krEndAskYes` 被拦时弹 DS 弹窗 `krEndBlockModal`（［返回］［去付款］，按钮靠右）；整体备注草稿 `c.visitNoteDraft` / 项目备注是离开输入框就存的，**拦下时不保存也不清空**，付款后回来还在，结束时才存成一则。**检查范围**：施术加项待付款也拦（同一个 `pendingPayItems`）；서비스 / 免费术后管理加项本来就不带 `pendingPay`（即时 / 免费），所以不存在「待付款」不需要拦；红条金额和拦截用同一来源。付款后可结束；已结束的到院再出现待做行 → 子到院 `coreVisitState` 自动重新打开（主到院照 1019-22）。**用户 Ayin 那次被错误结束的到院没有动**（她自己付款后到院保持已完成，不会再被拦也不用改）。测试：selftest 新增 R78a；A1 / KM1 相关批次通过。

## CMD-1021-11 补充（2026-10-21，追加；取代 CMD-1021-10 里「结束今日到院」的叫法、CMD-1019-22 第八条「重新打开」的隐性自动重开，旧文字保留作历史）
- 基准 **a4293f3**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（没有改资料结构）。
- **一 重开后［操作完成］就整张到院卡完成的原因**：`coreVisitState` 是纯读取函数，却在里面对「已结束的到院 key」做 `delete visitEndedKeys[key]` + `coreVisitNoteReopen`（给 21-09 的「行继承到店」用）。渲染时拿到的是页面副本，这个 delete 没存档；存档里的 key 仍是已结束，所以重画 / 下一次读取又回到「已完成」，看起来就是点一个［操作完成］整张卡跟着完成。已把 `coreVisitState` 改成纯读取；正常（没重开过的）到院没有这个问题。
- **二 改名**：［结束今日到院］→［客人已离院］（按钮、确认弹窗「确认客人已离院？今天的到院将标为已完成。」DS 弹窗右下［取消］［确认］、被拦弹窗标题、次日 KR 待办「…的到院还没标客人已离院」、Timeline「客人已离院」、提示文字）；有待付款仍拦（`endBlockPending`）；备注在客人已离院时存。
- **三 重开只有一个入口**：今天已完成的到院卡右下线框［增加项目］（`krReopenFooter` → `krReopenAdd` → `coreReopenVisitAt`，只有 KR 室长；院长 / 代表院长灰 + 悬停说明）。重开后和第一次一样：行为「已到院」、要再按［客人已离院］才结束、可以不加项目就结束；Timeline「重新打开到院（增加项目）· 谁 · 几点」。**00:00 锁定**：`visitCompletedToday` 按 `todayStr()`（韩国医院页面时区，演示时钟有效）判断到院日 = 今天才可重开，过了 00:00 按钮消失、核心函数拒绝；已结案的案件没有按钮。重开后不会立刻又弹「都做完了吗」（登记当前完成签名）。
- **拿掉的隐性自动重开**（清单）：`updateCaseStage` 开头的 `todayOpenRows` 自动重开、`coreUnitUseNow`（已完成的到院上［本次使用］）、`coreMgmtUseUndo` / `coreUseRowUndo`（撤回完成后顺带重开）、`repairVisitState` 里的重开、付款 / 在韩加项触发的重开（`coreAddOnItem` 在已完成的到院上直接拒绝，`coreSubTimeEdit` / `coreUnitBookUse` 不能把项目改 / 约进已结束的到院）。旧函数 `coreReopenVisit` 删除。项目卡：今天的到院已完成时［本次使用］灰 + 悬停「今天的到院已完成，请先在到院卡按［增加项目］」。
- 测试：selftest 新增 R79a（重开 / 不自动结束 / 再离院 / 00:00 锁定 / 不再隐性重开），R51a/R51b/R73a/R78a/R20a/R22a/R23a/R24a/R53b 按新规则改过；A1 全套 + KM1 批次（R73a/R78a/R79a/R53b）通过，roletest KR 43 格 0 不符；R51b 要先在 A1 跑 R51a（跨账号依赖）。三家诊所案件数测完为 0。

## CMD-1021-12 补充（2026-10-21，追加；取代 CMD-1019-18 里「到院前的今日案件卡只留一行」，旧文字保留作历史）
- 基准 **505b1a1**，单个提交，**未推送**，不带开关，**数据版本不变（55）**，只改 KR 到院卡显示。
- **原因**：CMD-1019-18 为了把［客人已到医院］放到页头状态卡，给「今天 + 待到院 / 待到店」的卡加了 `pendToday` / `pendSub`：不画项目表、不画按钮；而今天的卡（`g==='today'`）从来没有标题点击和 ▾（1013 起「今天」卡永远展开、不可折叠）。两者叠加 = 今天待到店的卡既没有内容、也没有箭头、点不动。**不是** 1021-07（标题状态靠右）/ 1021-04（案件大卡）/ 09 / 11 造成的，那几次没碰这块。
- **改法**（kr.js `krCaseCardHtml` / `krSubToggle`）：所有到院卡（今天 / 已预约 / 已完成 / 全部延期）标题都可点、有 ▾▸；今天默认展开，已预约默认折叠（主案件的预约卡原来就默认展开）；点开 / 收起记在 `KR_SUB_OPEN`，默认值记在 `KR_SUB_DEF`（`krSubToggle` 按默认值取反）。待到院 / 待到店的今天卡展开后：这次预约要做的项目表（预约模式：［修改时间］［备注］，没有［操作完成］［本次使用］），标题行最右有［客人已到医院］/［客人到店］（页头下的状态卡仍保留，两处同一个函数）；按了之后变已到店，可操作。院长账号同一个函数（无按钮）。
- 测试：selftest 新增 R80a（今天待到店卡默认展开 + 项目 + 到店按钮 + 无［操作完成］、可收起、未来卡可展开、到店后可操作）；顺手修 R67a 过期断言（CMD-1021-10 把拦截文字改成「请先付款或取消购买」）。R22b / R47a / R49a / R57a / R66b / R73a / R78a / R79a 通过。

## CMD-1021-13 补充（2026-10-21，追加；取代 CMD-1013 起「客人提前到院时也可以先标记」、CMD-1021-11 里「项目卡［增加项目］只在到院进行中 / 今天刚完成才有」，旧文字保留作历史）
- 基准 **a4be34c**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（没有改资料结构；新增可空字段 `krSchedule.simDay`，仅演示用）。
- **一 到院按钮只有当天能按**：原因 = 主到院的 `coreMarkArrived` 从一开始就没有日期检查（只有术后管理行 `coreSubArrived` 有，1014-18 说的「未到当天不能按到店」只覆盖了在韩预约 / 子到院），而到院卡的按钮从 CMD-1013 起还特意写「还没到施术当天；客人提前到院时也可以先标记」。现在：`mainArriveBlock(c)`（施术确认日期 > 今天（韩国医院当地，演示时钟有效）且没点模拟 = 不能标）+ 核心函数拒绝；UI 统一用 `krArriveMainBtn` / `krArriveSubBtn`（页头状态卡、到院卡标题行、施术预约卡三处共用），不是当天灰掉 + 悬停「只有到院当天可以标记客人已到院」，旁边有演示链接［模拟到当日（演示用）］（`coreMainSim` / `krSubVisitSim`）；已预约里未来的到院卡也显示灰按钮。
- **二 用词统一**：KR 端按钮一律［客人已到院］（原［客人到店］［客人已到医院］［标记已到医院］［客人已到店］），状态标签一律 待到院 / 已到院 / 已完成；改了：kr.js（页头状态卡、到院卡、预约施术卡、日历 / 工作台弹窗、项目卡、客人详情、在韩管理预约页）、krbook.js（占位预约到院）、data.js（Timeline「KR标记"已到院"」/ 撤回、IN 通知「X 已到院」、IN 施术计划卡文字、`krMainState`、Timeline 合并规则同时认旧 / 新写法）、rules.js（IN 案件进程「在韩中（已到院）」「在韩已到院」、通知分级正则同时认旧 / 新）、ui.js（IN 的 KR 医院日程标签、案件页「在韩到院预约」）、todo.js（「今天到院」卡 / 状态）、日历图例「术后到店」→「术后到院」。**没改**：IN 本院来访（印尼诊所）的「到店 / 已到店」、「未到店」取消原因、预约到店阶段名、客人预约页词条。旧 Timeline 里已存的「已到医院」文字不改（存档历史），覆盖页 / 合并规则两种都认。
- **三 项目卡右上［增加项目］不见的原因**：CMD-1021-11（505b1a1）把按钮条件写成「到院进行中，或今天刚完成（`anyVisitCompletedToday`）」两种情况，**其他情况（例：施术是昨天 / 更早结束的到院，今天只是术后管理 / 管理项目到院）两个分支都不成立 = 整个不画**。现在：`canAddOnNow(c)` = 已到院 + 尾款已付 + 案件没结案 + 离境日没过（`stayOutDate`）→ 一直显示（KR 室长；院长照原权限不显示）；`coreAddOnItem` 不再因到院已完成而拒绝：买了进「未使用」（施术项目 `deferUse`，不建今日行、不问延长、不重开到院）或持有 / 待付款（管理项目、서비스），**不动到院状态**；要用时今天有进行中的到院 → ［本次使用］，今天到院已完成 → 先在到院卡按［增加项目］重开（11），其他日子 →［预约时间］。
- **四 使用时间 = 实际到院日期 + 到院时间**：原因 = 施术项目 / 术后管理的「使用时间」栏读的是行 / 项目的 `doneAt`（点［操作完成］的时间），管理项目已使用读 `uses[].at`（同样是点按钮时间）。新增 `rowVisitKey` / `visitAtParts` / `visitAtText` / `useVisitDate`（data.js）：主到院 = `mainVisitDay` + 施术确认到院时间，其他到院 = 行的日期 + 时间；项目卡施术 / 术后管理已完成、管理项目已使用显示它；用到这个日期的地方一起改：医美史 `cliItemDoneDate` / `cliProjectGroups`、建议日期（`krMgSuggest` 上次使用日、术后管理 `lastDone`）、IN 术后管理卡已完成时间、统计 `surgeryDoneAt`（施术完成那天 = 到院日，不是点按钮日）。**旧数据显示时现算，不改存档**（`surgeryDoneAt` 旧值也不动）；点按钮的时间仍在 Timeline。
- 测试：selftest 新增 R81a（未来到院灰 + 核心拒绝 + 模拟后可标、用词、［增加项目］一直在 / 离境后不显示 / 结案不显示、到院已完成也能买不重开、使用时间 = 到院日期）；`ST.krArrive` 等需要标到院的测试先 `krSchedule.simDay=true`；R47a / R74a / R79a / R80a / E6 的断言改成新叫法。KM1 批次 R22b / R47a / R49a / R57a / R66b / R67a / R73a / R74a / R75a / R78a / R79a / R80a / R81a 通过，roletest KR 43 格 0 不符；IN（A1）全套只剩既有的 S31 / S33 / BK1c / BK2c / R68a（IN 部分）与要在其他账号跑的用例。

## CMD-1021-14 补充（2026-10-21，追加；取代 CMD-1020-02 / 1021-06 里项目卡三个 tab + 每页「已使用 / 已完成」小卡、CMD-1015-20 里项目卡右上［增加项目］在卡里展开、CMD-1021-08 / 1021-09 里「管理间隔」栏与备注卡全列表，旧文字保留作历史）
- 基准 **85ff05c**，单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段：到院里「使用」行 `useQty` / `useNow`）。
- **一 项目卡新结构**（kr.js `krProjCards`）：卡内容固定高度（`.kr-pc-scroll`，430px ≈ 6 行，不管几行都一样高、内容少留白）、内部滚动，标题行 + tab 不动；小标题（未使用 / 已预约…）和表头 sticky（`.kr-pc-block` / `.kr-pc-sec-title` / `.kr-pc-head`，app.css）。四个 tab：施术项目（N）｜术后管理（N）｜管理项目（N）｜已完成（N）；N = 0 的灰掉不能点；默认打开**第一个有内容的**（当前选中的 tab 变空时自动落到下一个；`KR_PROJ_PAGE` 可为 `surg|care|mgmt|done`，前三都 0 → 已完成）；前三个 tab 只放未使用 / 已预约（术后管理里「交给印尼」一组也留着），N = 行数；用掉一部分的留在原 tab（剩 N / 共 M），用掉的几次进已完成。**已完成 tab** 分三组（施术项目 / 术后管理 / 管理项目，0 的组不显示，已取消的施术项目收在最下面一个 details），每次实际使用一行，栏位 来源｜项目｜次数｜建议时间｜使用时间｜到院时间｜｜查看案件（`doneRow` / `krUsedGrid`，使用时间按 13 的实际到院日期 + 到院时间）。原来各 tab 里的「已使用 / 已完成」一组拿掉。**IN 端**：IN 的项目卡（`inProjectCardHtml`）是另一套（不分 tab、没有固定高度），没有一起改；只有备注区和「建议时间」写法共用（见下）。
- **二 ［增加项目］改 Modal**：项目卡右上［增加项目］（`krAddModalOpen`）→ `#kr-addmodal-overlay`：标题「增加项目 · 客人名」，左施术 / 管理 tab + 搜索 + 列表（`krAddChooser` 同一个选择组件），右已选 + 서비스，底部合计 +［取消］［确认添加（N）］靠右；确认后原流程（延长 → 冲突 → 确认付款 Modal）；`krAddOnCard(c)` 现在只负责同步 Modal 的显示 / 关闭（状态仍是 `KR_AD`）。**到院卡 Step 2 / 3-2 / 3-3 的选择区没动**（仍在卡片里展开）。
- **三 「建议时间」**：栏位「管理间隔」改名「建议时间」（项目卡管理项目 tab、已完成 tab）；统一函数 `mgSugText(it)`（rules.js）：「术后第 N 天开始 · 间隔 K 天」；第一次无关 → 只写「间隔 K 天」；间隔无关 / 只用 1 次 → 只写「术后第 N 天开始」；都无关 → 「—」；`mgmtScheduleText` / `krMgIntervalText` / KR 项目库规格展开（`krmSpecFirst`）都走它，所以项目卡、IN 推荐整理 / 打印 / 持有项目共用。**「术后第 0 天」的原因**：1021-08 之前 KR 表单里「第一次使用」输入框默认 0，旧案件的管理项目条目就存了 `firstDay:0`，当时没有「无关」选项也没有 `intNa` 字段，显示照字面写成「术后第 0 天开始」；现在 `mgFirstOfItem(it)`：**没有 `intNa` 字段（= 1021-08 之前建的条目）且 `firstDay===0` → 当作没填**（不显示，建议日期 `krMgSuggest` 也不算），之后新建的条目（有 `intNa`）里的 0 是真的「当天开始」照写。未安排预约 / 预约弹窗 / 客户详情持有项目这次没有单独逐处核对（它们读的是上面这几个函数；预约弹窗读 `krMgSuggest`）。
- **四 ［本次使用］选次数**：管理项目剩余（扣掉已预约的）≥ 2 次才弹 Modal（`krUseQtyOpen`，「本次使用 · 项目名」「剩 3 / 共 3 次」「这次使用：− N +」默认 1、最多 = 剩余、小字「做完后在到院卡按［操作完成］才会扣次数」、底部［取消］［确认］）；剩 1 次直接加；术后管理照 1019-21 不做。确认后：主到院 = 沿用 `todayQty`（到院卡行的 − N + 和 ［操作完成］一次扣 N 次，撤回全部退回）；其他到院 = 加一行「使用」带 `useQty=N`（到院卡写「项目 ×N」，行内也有 − N + 改次数 `krUseRowQty` / `coreUseRowQtySet`，合计不超过剩余），`coreSubDone` 一次记 N 次（`holdUseRecord` qty），`holdItemPlanned` 按 `useQty` 合计算。项目卡这一行「剩 3 / 共 3 次 · 今天使用 2 次」（`mgTodayQty`；本次使用加进来的行 `useNow` 不算已预约，做完才扣）；已完成 tab 次数写「N 次」。
- **五 备注卡**（IN / KR 共用，data.js `notesCompactHtml` / `notesAddOpen` / `notesAllOpen` / `notesAddSave`）：只显示最新 3 条（同一秒写的后写的在上），每条最多 2 行 + 省略号（`.note-clamp`），高度固定 312px（`.notes-compact`），一条都没有中间灰字「还没有备注」；底部［增加备注］［查看全部（N）］（≤ 3 条不显示查看全部）：［增加备注］= DS Modal「增加备注 · 客人名」（内容必填，空的红字，［取消］［保存］，保存 = 整体备注 / IN 走 IN 备注记录进 Timeline）；［查看全部］= Modal「全部备注（N）· 客人名」（列表自己滚动、译文 +［查看原文］在 Modal 里也能切、KR 端 IN 未读标示）+［关闭］。IN 项目卡里的备注区同一张（原来标题行右边的［增加备注］搬到卡片底部）。
- 测试：selftest 新增 R82a（四个 tab / 灰掉 / 默认 tab / 固定高度 / 已完成三组 / 增加项目 Modal / 建议时间各种写法 / 本次使用选次数全流程 / 备注卡 3 条 + 两个 Modal + 0 条高度不变）；R73a / R74a / R76a / R81a / R61a 的断言按新结构 / 新写法改过。KM1 批次（R22b R47a R49a R52b R53b R54b R56a R57a R59b R62b R66b R67a R69a R71b R72b R73a R74a R75a R76a R77b R78a R79a R80a R81a R82a）通过，roletest KR 43 格 0 不符；R64b / R65b（日期 / 跨诊所对话相关）和需要 A1 先建数据的用例不是这次引入。

## CMD-1021-15 补充（2026-10-21，追加；取代 CMD-1020-22 / 1021-11 里把项目排进已完成到院日时借用「时间冲突」弹窗、CMD-1021-14 里备注卡固定 312px 高度，旧文字保留作历史）
- 基准 **af5f45f**，单个提交，**未推送**，不带开关，**数据版本不变（55）**。
- **一 排进已完成到院日的专门提示**（kr.js `krDoneDayAsk` / `krDoneDayReopen`，data.js `doneDayInfo`）：标题「今天的到院已完成」（不是今天写「MM/DD 的到院已完成」），内文「要把项目加进今天，请先在今天的到院卡按［增加项目］重新打开；或者改选其他日期。」，DS Modal 按钮靠右［选其他日期］［增加项目］（主按钮最右）；［增加项目］= 在这张已完成的到院卡按［增加项目］（`coreReopenVisitAt`，Timeline「重新打开到院（增加项目）」）并把正在改时间 / 预约的项目加进去（重跑原来的保存函数），关掉提示、滚到那张到院卡，之后做完要再按［客人已离院］；只有 KR 室长有，院长 / 代表院长只显示［选其他日期］；那天不是今天（00:00 之后锁定）：内文「那天的到院已结束，请选其他日期。」，只留［选其他日期］；［选其他日期］= 关掉提示，**原来的弹窗还开着**（入口都是先预检再关原弹窗）。**入口**：［修改时间］（`krTimeEditSave`）、预约时间 / 全部预约（`krCbGo`，批量保存前先检查所有勾选行的日期，避免保存一半）、施术 / 管理项目单条预约（`krBkdSave`）；核心函数 `coreSubTimeEdit` / `coreUnitBookUse` 兜底：拒绝并设 `KR_DONEDAY`，`krMut` 看到就弹同一个提示（［增加项目］时重开后重跑那次改动）。**没有对应入口的**：IN 代约（IN 的术后管理预约是印尼本院的新来访，不是 KR 到院）和占位确认（`coreBookConfirm` 建的是新案件）不会把项目排进这个案件已完成的到院，所以没改；IN 端本来就没有［增加项目］。**［仍然进行］原来的行为**：核心函数拒绝时设的是 `KR_LAST_CONFLICT`（「那天的到院已完成…」），`krMut` 当成时间冲突弹出「时间冲突［仍然进行］［不在这个时段］」；按［仍然进行］只是带着「跳过冲突检查」再跑一次同一个函数，而这条检查不看那个开关，于是再拒绝一次、再弹一次同样的窗——**项目没有被塞进已完成的到院**（没有污染数据，不用修用户案件）。
- **二 备注卡**：高度 = 标题行 + 3 条（每条按 2 行算，`.notes-list > div` 最小 75px，列表区固定 252px）+ 按钮行（固定 42px），刚好放得下，按钮行紧跟在第 3 条下面；少于 3 条空位在条目下方、按钮行位置不变；0 / 1 / 3 / 5 条同高（约 294px）。顺手修：按钮行里按钮被拉成竖的（`white-space:nowrap` + 固定行高）。
- **三 案件区块不显示取消 / 未到院的到院卡**（`krCaseGroupsHtml`）：已取消（含全部延期，`kind:'end'`）和**客人没到院**（其他到院里状态仍是待到院、日期已经过了）的到院卡直接不显示，数字也不算它们；记录不删（Timeline、`visitEnds` / `visitPostponed` 都在），延期的项目照旧回到项目卡未使用；日历上的块不变。主到院（施术）过了日期没到院的卡**没有**隐藏（它是施术日期卡，还要能标到院 / 改期），待确认。
- 测试：selftest 新增 R83a（今天到院已完成 → 改时间改到今天：专门提示 / 按钮 / 原弹窗还开着 / ［选其他日期］/［增加项目］重开 + 项目加进去 / 锁定只剩一个按钮 / 核心函数兜底不是时间冲突 / 案件区块没有取消卡 + 数字 / 备注卡 0·1·3·5 条同高）。R83a 要在刚建好的 pcStage 夹具上单独跑（别的用例会在同一个案件里留下今天的未完成行，导致「已完成」建不出来）。

## CMD-1021-16 补充（2026-10-21，追加；取代 CMD-1015-17 / 1019-22 / 1020-08 / 1020-11 里「施术做完自动进术后管理 / 客人已回国自动结案 / 离境日过了自动结案」，旧文字保留作历史）
- 基准 **fb34b5d**，单个提交，**未推送**，不带开关，**数据版本不变（55）**。
- **Ayin AY 被自动结案的原因**：`careReturnSweep()`（启动 + 待办 5 秒刷新 + KR 启动都会跑）在「施术已完成、离境日 / 最早可回国日已过、没有挡结案的韩国术后管理」时直接 `finishCase`；另外 `krCloseIfDone` / `coreEndVisitToday` / `coreEndSubVisit` 在项目全做完时也会走 `finishCase`。**已全部拿掉**：`careReturnSweep` 删除；上述三处只 `updateCaseStage`；`careCustomerReturned` 只作提示不触发任何结案。Ayin 的案件没有改动。
- **KR［韩国行程结束］**（data.js `tripOpenVisits / tripLastVisitDay / tripAskDue / tripLeftList / coreTripEnd / coreTripSnooze`，kr.js `krTripCardHtml / krTripOpen / krTripConfirm`）：所有已预约到院都完成且没有未来预约 → 医院营业开始时间起每天早上 KR 待办「韩国行程是否结束？」（`tripend`），［暂不结束］（`c.tripSnooze`）当天不再问、次日再问，离境日过了也不自动结束；KR 室长也可随时手动按案件页［韩国行程结束］（院长无）。确认 Modal「韩国行程结束 · 客人名」列出剩余项目：管理项目 / 只能在韩国做的术后管理 → 韩国持有；「韩国或印尼」的术后管理逐项［转去印尼］／［留在韩国持有］（默认转去印尼）；有待付款不能结束；按钮靠右［暂不结束］［确认结束］。结束后：没有转印尼的 → 直接结案；有转印尼的 → 案件进「术后管理（印尼）」，KR 显示「韩国行程已结束」且不能再建到院（`c.krTripEnded`，`canAddOnNow` 不再允许），IN 收通知。
- **IN［结案］**（`inCareVisits / inCloseDue / coreInClose / inCloseOpen / inCloseLater / inCloseConfirm`）：术后管理（印尼）阶段，诊所营业开始时间起每天 IN 待办「是否结案？」（`inclose`），［暂不结案］次日再问；案件页状态栏手动［结案］；Modal 列出没做的印尼术后管理 → 转印尼持有（标「术后管理」，客户详情里可用），按钮［暂不结案］［确认结案］。
- **KR 客人管理 / IN 客户详情「韩国持有」分三组**：施术项目 / 术后管理 / 管理项目，各带数量，空组不显示（`cliHoldKrHtml`，`cliHoldKrRows` 行带 `type`）。
- **同一客人同一天只有一个预约**（没到店的）：`pendingResvSameDay(name, date)` / `krVisitTimeOnDate`；新的预约（未安排预约［预约］/ 全部预约、KR 预约弹窗与［修改时间］、IN 代约、占位预约确认、客人自助）若同一天已有还没到店的预约 → 合并进去、沿用原时间、toast「已合并到 X:XX 的预约」；已到店进行中 → 加进那次到院；已完成 → 走 CMD-1021-15 的提示；原本就重复的旧预约不动。
- **CMD-1021-15 第 3 部分修正**：案件区块只隐藏「被清空」的到院卡（项目全部延期 / 改到别天），客人取消 / 未到店的卡恢复旧显示，日历不变（`krCaseGroupsHtml` 过滤 `cd.kind!=='end'`）。
- 测试：selftest 新增 R84a；D18 / R17a / R18a / R59a 里原来期待自动结案的断言改成「不会自动结案 + `ST.tripClose`（走手动确认）」；R61a 选择器修正。KM1 / IN 批次、roletest KR 43 格 0 不符；测试数据已清（三家诊所案件 0）。

## CMD-1021-17 补充（2026-10-21，追加；取代 CMD-1019-01 / 1019-04 里「基础资料 메타뷰 在面诊需求上面、苦恼不论面诊与否都是部位卡片」，旧文字保留作历史）
- 基准 **675c794**（CMD-1021-16 之后），单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段 `c.concernText`，没有 = 默认读 `c.visitNote`；旧案件不用迁移）。
- **IN 基础资料拆两张卡**（data.js `materialsCardHtml` / `basicTabHtml`）：**「基本信息」**（`clientBasicBlockHtml`，姓名 / 性别 / 生日 / 病史过敏史 / 联系方式 / 护照，行 + ［修改］不变，标题「客人基本信息」→「基本信息」）；**「到访目的」**顺序：客人手写的苦恼（`guestConcernRowHtml`，读预约页手写的 `c.visitNote`，只读参考，没填不显示）→ 关联之前案件 → 面诊需求 → 苦恼（跟着面诊需求走）→ 院长（只有面诊）→ 预算 → 上传附件 → 医美史 → ［取消接待］［确认］。
- **苦恼跟着面诊需求走**：面诊（含「沿用原诊疗方案」，我的判断）= 部位卡片 + 选院长，**不再要 메타뷰**；不面诊 = 메타뷰 + 手写苦恼文字框（`concernExpectHtml`，`saveConcernText` 存 `c.concernText`，没改过默认带入预约页手写内容，`concernTextOf`），没有部位卡、没有院长；没选面诊需求只有灰字；来回切换已填内容都保留。面诊访问 / 皮肤商谈 / 皮肤管理照同一流程。
- **确认必填**（`confirmMaterials`）：메타뷰检测只在不面诊时要求；不面诊的苦恼缺项 = 手写苦恼空（`concernMissing`，不再要说明 / 希望预期 / 照片 / 视频）；确认后不面诊的 `c.concern` = 手写文字（`concernSync` 不再覆盖，KR 基础资料读它）。确认后的基础资料 tab 同样两张卡，不面诊显示手写苦恼（`concernCardsHtml` 对 `needsConsult===false` 返回手写文字）；取消接待 / 退回待访问清掉 `concernText`。
- **未改**（任务写明）：选了「关联之前案件」时照现在的行为，改走术后 / 复诊流程由 CMD-1021-18 做。
- 测试：selftest 新增 R85a（两张卡 / 手写苦恼第一行 / 没填不显示 / 面诊 = 部位卡 + 院长 / 不面诊 = 메타뷰 + 手写框 + 默认带入 / 缺项 / 确认后 c.concern / 确认后 tab）；`ST.materials` 补 `concernText`；R32a / R33a / R40a 断言按新结构改过。A1 全套 + roletest IN（A1）通过（其余失败只是要在 KM1 等分页跑的用例和既有的 S31 / S33 / BK1c / BK2c / R68a）；测试数据已清（三家诊所案件 0）。

## CMD-1021-18 补充（2026-10-21，追加；取代 CMD-1015-18「到访接续默认接续到术后管理阶段案件」在 IN 到店后的先后顺序，旧文字保留作历史）
- 基准 **65b537f**（CMD-1021-17 之后），单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段：案件 `followup` / `followupAsked` / `followProjects` / `recovery` / `basicOpen` / `consultKind`，旧案件没有 = 一般流程）。
- **术后 / 复诊来访流程**（data.js「CMD-1021-18」一段）：`c.followup`（`followupOn(c)` = followup 且有 linkedCase）。入口两个：① **到店弹窗** `followupAsk`（`markArrived` 之后；客人有基础资料已确认的以前案件才弹；从「未安排预约」约来的（`c.careFor`）默认选对应案件，来访目的术后管理 / 复诊默认选术后管理阶段的案件，否则默认「不关联」；客人自助预约选了术后管理的也一样弹）→ ［不关联］/［确认关联］（`followupAskDone`，`c.followupAsked` 只问一次，Timeline 记「到店：选择关联…/不关联…」）；② 一般来访在「关联之前案件」下拉选了案件（`setLinkedCase`）→ 同样改走本流程；选「不关联」/ ［取消关联（走一般流程）］（`cancelFollowupLink`）回一般流程（17 的两张卡）。**一般流程里的关联原因「延续既往面诊」从 UI 上走不到了**（关联即进本流程；原因由面诊需求决定：面诊 = 复诊，不面诊 = 术后管理），旧数据和 `c.linkedCase` 直接赋值的路径不受影响。
- **术后来访页**（`followupCardsHtml`，`materialsCardHtml` 在 followup 时走它）：「基本信息」卡默认折叠（只有一行姓名 · 性别 · 年龄，［展开］`toggleBasicOpen`）；「到访目的」：客人手写苦恼 → 关联案件（标「术后来访 · 关联 A000xxx」）→ 面诊需求二选一，没有一般流程的关联下拉 / 接续条（`resumeBannerHtml` 对 followup 不显示）。**需要院长面诊（复诊）**：「这次要看的项目」从关联案件做过的项目里选（`followDoneItems`：赴韩已完成项目 + 本院买过并用过的本地项目，都没有就列没取消的赴韩项目；`toggleFollowProject` → `c.followProjects`），**不选院长**（`syncDirectorChoice` 按关联原因「复诊」锁定原案件院长和医院），面诊费免除原因默认「复诊」（原有机制），面诊内容 = 部位卡（苦恼说明 + 各角度照片必填，视频 / 希望预期选填；`concernMissing` 的 followup 分支）；确认后进面诊缴费，`c.consultKind='复诊'`，`c.concern` 前缀「【复诊 · 关联 …；项目：…】」。**不面诊**：메타뷰 / 苦恼手写都选填，多一张「术后恢复（选填）」卡（`recoveryCardHtml`）：选做过的项目 → 按项目对应部位的角度（`followItemPart` = 项目库 `parts` / 名称规则，角度读 `concernPartDef(part).angles`，和苦恼部位卡同一套）上传恢复照片（`c.recovery=[{name, part, photos}]`，`mockUploadRecovery`），照片进附件（`caseAttachments`：「术后恢复 · 项目照片（N 张）」，KR 的附件 tab 读同一函数所以看得到）。
- **本地管理 tab**（followup 且本地案件，`caseTabContentHtml`）：上半「术后管理」卡（`followupCareCardHtml`：客人其它案件里印尼的术后管理行，关联案件排前；未做的有［做术后管理］= 原有 `openCareUse` → `confirmCareUse`，做完记在原案件、标原案件印尼术后管理行完成、本案件 `postcareUses`，提前做要写原因；已做的写完成日期），下半「本地管理」= 原有本地选购流程（持有项目使用 / 新增项目，`projectListTabHtml`）。结案接 16 的「IN 结案」判断（原案件的印尼术后管理做完 / 转持有后，案件才进「是否结案？」）。案件页头小字「A000xxx · 术后来访 · 关联：A000yyy（术后管理 / 复诊）」；画面上没有「子案件」字样。
- **复诊资料现在怎么送出（等 CMD-1021-19 做 KR 端）**：确认后走现有面诊路线（面诊缴费 / 免除 → KR 面诊 tab），KR 面诊 tab 按部位显示苦恼说明 / 照片（现有 `concernBlockHtml`），`c.concern` 带「【复诊…】」前缀、`c.consultKind==='复诊'`、`c.followProjects` 存好；KR 端对「复诊」的专门显示 / 面诊分一般 / 复诊留给 19。
- **我的判断 / 想确认**：① 「关联案件在主案件里也看得到」：1013-12 规定「关联只往前」，本次没改（原案件里能看到术后管理行被做完，但没有新增「后续关联」入口），要不要给主案件加一条「术后来访 A000xxx」请确认；② 本地管理的［增加项目］沿用现有「新增项目 / 继续选购」，没有另做按钮；③ 术后来访不需要预算（页面里去掉）；④ 弹窗选了「不关联」时仍会出现 1015-18 的「接续到原案件」条（那是开新案件还是接续的老选择）；⑤ 自测里 `window.GMC_NO_FOLLOWASK = true`（selftest.js 开头）让到店不弹窗，R86a 单独打开。
- 测试：selftest 新增 R86a（弹窗默认选中 / 折叠 / 复诊选项目不选院长 / 面诊费复诊 / 不面诊恢复卡 + 附件 / 两类本地管理 + 扣原案件 / 不关联走一般流程 / 取消关联）；A1 全套其余失败是要在其它分页跑的用例 + 既有的 S31 / S33 / S36 / BK1c / BK2c / R68a；roletest IN（A1）0 不符；测试数据已清（三家诊所案件 0）。

## CMD-1021-19 补充（2026-10-21，追加；取代 CMD-1021-18 里「复诊资料先按现有面诊路线送出、标复诊」的临时做法，旧文字保留作历史）
- 基准 **a640132**（CMD-1021-18 之后），单个提交，**未推送**，不带开关，**数据版本不变（55）**（新增可空字段 `c.recoveryResult = {result:'ok'|'treat', by, at}`、`c.revisitAck`；`consultKind` / `followProjects` / `recovery` 是 18 已有）。
- **KR 面诊分两种**：`isRevisitConsult(c)`（rules.js，`c.consultKind==='复诊'`）= 复诊面诊。标示：案件进程文字前缀「复诊 · 」（`caseProcessText` 包了一层，IN / KR 列表、待办、引用 chip 共用，只在面诊阶段未出报告前）；KR 面诊 tab 的卡片标题「恢复确认 [复诊面诊]」；KR 通知「客人已缴复诊面诊费 / 复诊面诊费已免除 → 请确认复诊面诊时间和预计出评估时间」、院长通知「需要处理：… 复诊面诊（恢复确认）」；院长日程里的面诊块标题「复诊面诊」；KR 待办「复诊面诊：确认面诊时间和预计出评估时间」「发送恢复评估」。一般面诊完全不变。
- **院长「恢复确认」卡**（kr.js `krRecoveryCard`，KR 面诊 tab 的待确认时间 / 等待报告 / 已出评估三个阶段都显示；室长和院长同一张）：关联案件（号 + 阶段进程）、原案件做过的施术及日期（`cliItemDoneDate`）、这次要看的项目、IN 上传的恢复照片、IN 上传的说明 / 照片（`concernBlockHtml`）、**评估结论**［恢复正常］［需要处理］（`krSetRecoveryResult`，`krCanRecord` 的人能选，发送前可改，记 Timeline）；评估说明 = 下面原有的「录入面诊」（语音 / 手动，侧边栏）内容，流程不变：KR 室长确认面诊时间 + 预计出评估时间 → 院长开始面诊 / 录入 / 上传内容 → 室长发送。
- **发送恢复评估**（`krSubmitBlock` / `krSubmitReport` / `coreSubmitReport`）：复诊时标题「发送恢复评估」，**项目方案可以不附**（`items` 可空；没选评估结论不能发送，按钮灰）；报告原文前加「【恢复评估：恢复正常 / 需要处理】」；Timeline「KR室长提交复诊恢复评估：…（附 / 不附项目方案）」。IN 收**需确认通知**（action + popup confirm）「复诊评估已出：客人（Case ID）：需要处理（附项目方案 / 不附项目方案），请联络客人确认」（`NOTIF_ACTION_RE` / `notifTodoKind` / `openNotif`（进面诊资料 tab）都认「复诊评估已出」）+ IN 待办「复诊评估已出：联络客人（恢复正常，不附项目方案）」（沿用 `plan` 待办）；附了方案 = 之后走现有选项目 / 付款流程；不附方案的待办点开联络后 `c.revisitAck` 即消失（不附方案之后 IN 可走本地管理或「客人不做项目」）。
- **院长工作台**：4 张卡的第三张「恢复确认」启用（取代「即将推出」，`drecover`：自己负责、复诊、还没上传内容的案件，点了筛选待办）；院长待办 kind `recover`（「恢复确认：复诊面诊（项目）」，不再算「待面诊」）；可见范围照现有院长规则（只看自己负责的案件，复诊沿用原案件院长，18 已锁定）。
- **我的判断（请确认）**：① 评估结论由院长或室长任一方都能选（发送前可改），没有单独的「院长确认」步骤；② 「评估说明」沿用原有录入面诊的内容，没另做文字框；③ 不附方案时案件仍进「项目确认中」阶段（IN 用现有「客人不做项目 / 本地管理」收尾），没有新增阶段。
- 测试：selftest 新增 R87a（KM1，stagePay + stageC 夹具：标示 / 恢复确认卡 / 待办 / 没选结论不能发送 / 不附方案 / 附方案 / 需确认通知 / 院长卡片 / 一般面诊不受影响）、R87b（IN，接 R87a：待办出现与消失）；A1 全套其余失败只有要在其它分页跑的用例和既有的 S31 / S33 / S36 / BK1c / BK2c / R68a；roletest KR（KM1）43 格 0 不符；测试数据已清（三家诊所案件 0）。已知：测试辅助 `ST.krEta` 传给 `coreConfirmConsultTimes` 的参数形态和现函数不符，会造出一条时间标记坏掉的「KR 已确认面诊时间」通知，只在测试里出现（铃铛下拉会报错），不是产品问题，未改。

## CMD-1021-20 补充（2026-10-21，追加；取代 CMD-1021-17 的「面诊不要 메타뷰、不面诊才要，放在不面诊块里」，旧文字保留作历史）
- 基准 **ce0d4df**（CMD-1021-19 之后），单个提交，**未推送**，**数据版本不变（55）**。
- **一般案件（没有关联之前案件）메타뷰 一定必填，面诊 / 不面诊都要**：「到访目的」卡顺序 = 客人手写苦恼 → 关联之前案件 → **메타뷰 \*** → 面诊需求 → 苦恼 → 院长（仅面诊）→ 预算 → 附件 → 医美史（`materialsCardHtml` 的 `metaRow` 固定在面诊需求上方，不面诊块里不再重复）；缺 메타뷰 不能确认基础资料（`confirmMaterials` 缺项弹窗列「메타뷰检测」）；确认后的基础资料 tab 也始终显示 메타뷰 行。
- **关联案件（术后 / 复诊，18 的流程）메타뷰 选填**：`followupCardsHtml` 的「메타뷰（选填）」行放在面诊需求上方，复诊和不面诊都显示（原来复诊没有这行）；18 的实现里复诊本来就没把 메타뷰 做成必填（`confirmMaterials` 对 `c.followup` 不检查），核对无需改。17 的判断 ①（沿用原诊疗方案按面诊处理）② 用户接受，不动；沿用原诊疗方案属一般案件，메타뷰 也必填。
- 测试：selftest 新增 R88a（一般案件面诊 / 不面诊都要求 메타뷰、缺了不能确认、位置在关联之前案件之后 / 面诊需求之上只一处；关联案件不面诊 / 复诊没 메타뷰 也能确认）；R32a / R85a 断言按新位置改过；R32a / R33a / R40a / R85a / R86a / R88a 通过；测试数据已清（三家诊所案件 0）。

## CMD-1021-21 补充（2026-10-21，追加；取代 CMD-1021-18 / 1021-19 里复诊「面诊内容 = 苦恼部位卡（说明 + 各角度照片）」，旧文字保留作历史）
- 基准 **cb59f62**（CMD-1021-20 之后），单个提交，**未推送**，**数据版本不变（55）**（新增可空字段 `c.revisitQuestion`、`c.revisitMedia=[{name, part, video, photos}]`）。
- **IN 复诊到访目的**（`followupCardsHtml` 复诊分支）：拿掉「苦恼」行（不再选部位、不再有部位卡）；「这次要看的项目」下面新增「复诊想问的内容」（多行，必填，`saveRevisitQuestion` → `c.revisitQuestion`）；**每勾一个项目出现一张该项目的上传卡**（`toggleFollowProject` 同步 `c.revisitMedia`，`revisitMediaCardsHtml`：视频 + 各角度照片，角度 = `followItemPart(项目)` 对应部位的 `concernPartDef(part).angles`，和 18 的术后恢复卡同一套；取消勾选移掉那张卡，已上传的先确认；`mockUploadRevisit` / `clearRevisitMedia`）。**必填规则用的是「一般面诊部位卡」那条**：想问的内容 + 至少一个项目 + 每个项目的视频 + 全部角度照片（`concernMissing` 的 followup 复诊分支；不再要苦恼说明 / 希望预期）。确认后 `c.concerns=[]`，`c.concern` = 「【复诊 · 关联…；项目：…】」+ 想问的内容，`photoUploaded` / `videoUploaded` 按项目媒体算；按项目的视频 / 照片进附件（「复诊 · 项目视频 / 照片（N 张）」）。不面诊（关联案件）不变。
- **KR / 院长跟着改**（`revisitBlockHtml`，挂在 `concernCardsHtml` 上，所以 IN 基础资料 tab、KR 复诊面诊的恢复确认卡 / 基础资料 tab 都走它）：显示「复诊想问的内容」（走备注同一套 `noteTextHtml`：译文 +［查看原文］，`mockTranslate` 仍是占位）+ 按项目分组的视频 / 照片，不再显示苦恼部位。**旧复诊数据**（存的是苦恼部位，没有 `revisitQuestion` / `revisitMedia`，`revisitNewStyle(c)` 为假）照旧显示苦恼部位卡，不报错、不迁移（用户案件没动）。
- 测试：selftest 新增 R89a（IN：没有苦恼行 / 想问的内容位置 / 勾两个项目两张卡 / 取消一个卡消失 / 必填 / 确认 / 附件 / 基础资料 tab / 旧复诊数据照常）；R87a 加 KR 恢复确认卡显示新资料；R86a / R88a 的复诊夹具改用新字段；R86a / R87a / R88a / R89a / R85a 通过；roletest KR（KM1）43 格 0 不符；测试数据已清（三家诊所案件 0）。

## CMD-1021-22 补充（2026-10-21，追加；取代 CMD-1021-21 里复诊上传卡「角度只按部位套」「想问的内容在项目行下面、卡片在想问的内容之后」，旧文字保留作历史）
- 基准 **449d868**（CMD-1021-21 之后），单个提交，**未推送**，**数据版本不变（55）**（新增可空字段：`HOSPITAL_DATA[h].partShoot`、施术项目 `p.shoot`、术后恢复 `c.recovery[].video`；演示种子在 `shootDemoSeed(hid)` 里「首次读取时补一次」，用 `h._shootDemo` 标记，所以不需要升版本、不动用户资料）。
- **设定放在哪（KR 项目库）**：顶层 tab 变成 施术项目｜管理项目｜**部位拍摄要求**｜非活性化（`KRP.tab==='shoot'`，`krShootTabHtml`）：每个苦恼部位（和苦恼 / 案例库 / 施术分类同一套）一块 = 要拍的角度（勾选，选项 = `CONCERN_ANGLE` 9 个：正面 / 左正侧 / 左 45 / 右 45 / 右正侧 / 背面 / 上方 / 下方 / 仰拍鼻孔，默认 = 现有角度配置）、☐ 需要视频（默认需要）、每个已勾角度的视角参考图（选填，原型只记文件名、`krShootRef` 模拟上传）、文字说明（选填）；存 `HOSPITAL_DATA[h].partShoot[部位 key]`（手臂 / 腿的第三层共用部位设定）；改了写操作日志 + `Store.touch()`；第一期只有一家医院，用本医院的设定（`shootHid()`：KR = 自己医院，IN = 本诊所对接的医院）。**施术项目**编辑页新增「复诊 / 术后照片要求」（`krpShootBlockHtml`）：默认「跟部位一致」（显示部位的设定摘要），可改成「本项目另设」（先带入部位设定，再增减角度 / 视频 / 参考图 / 说明；存 `p.shoot`，选回「跟部位一致」= `null`）；部位设定改了，没另设的项目跟着变。**管理项目和韩国术后管理没有这套设定**（编辑页不显示）。上传时读当前设定（不做快照）。演示数据：下颚 / 颧骨有部位设定（带参考图 + 说明），下颚角整形另设（5 角度 + 视频 + 参考图 + 说明），颧骨缩小跟部位。
- **解析**（data.js `shootSpec(part, projName)` → `{angles, video, refs, note, own}`）：项目另设优先，否则部位设定，否则现有角度配置 + 需要视频；`shootShowAngles(sp, photos)` 只读显示时把已上传但不在当前设定里的旧角度并进来（角度改了，旧资料照旧显示、不要求补拍）。
- **IN 各上传卡**：一般面诊苦恼部位卡（`concernFormHtml`）、复诊每项目卡（`revisitMediaCardsHtml`）、术后恢复卡（`recoveryCardHtml`）都读 `shootSpec`：角度按设定、视频只有设定「需要视频」才显示（一般面诊 / 复诊必填，术后恢复选填，恢复视频进附件「术后恢复 · 项目视频」），卡片第一行名称 + 右边［视角参考］（`shootRefBtn`：有参考图或说明才可点，否则灰 + 悬停「KR 未提供视角参考」）→ DS Modal（`shootRefOpen`：标题「视角参考 · 项目名 / 部位名」，按角度显示参考图，没传的角度灰色「未提供参考图」，KR 文字说明走备注同一套自动翻译，［关闭］）。缺项检查 `concernMissing` 一般 / 复诊都按设定的角度和是否要视频算。
- **复诊布局**：「这次要看的项目」一行 = 项目勾选胶囊 + 紧接着每个勾选项目的上传卡（都在这一行里面）；「复诊想问的内容」放在所有上传卡下面（`followupCardsHtml`）。KR / 院长恢复确认卡（`revisitBlockHtml`）和 IN 基础资料 tab、KR 面诊资料的苦恼部位卡（`concernCardsHtml`）的照片按设定的角度顺序排。**客人自助预约页没有部位照片上传**（只有「来访目的 + 手写备注」），所以没改。
- 测试：selftest 新增 R90a（IN：部位设定 → 一般面诊卡角度 / 视频 / 视角参考按钮 / 缺项 / Modal / 角度改了旧资料照旧 / 项目另设 vs 跟部位 / 复诊布局与卡片 / 术后恢复卡）、R90b（KM1：部位拍摄要求 tab 的编辑、施术项目另设、管理项目 / 术后管理没有）；A1 全套其余失败仍只有既有的 S31 / S33 / S36 / BK1c / BK2c / R68a；roletest KR（KM1）43 格 0 不符；测试数据已清（三家诊所案件 0），测试里改过的部位设定会还原。

## CMD-1021-23 补充（2026-10-21，追加；取代 CMD-1020-12 / 1020-13 里「客人希望的面诊时间」在面诊资料 tab 直接输入、存了就通知 KR，旧文字保留作历史）
- 基准 **48a6090**（CMD-1021-22 之后），单个提交，**未推送**，**数据版本不变（55）**（字段仍是 `c.wantConsult`，已有案件里之前填的值照样显示）。
- **原因**：旧做法是面诊资料 tab 里一个输入框，改完离开输入框就存、只在缴费后才显示，没有「发送」动作，复诊来访的资料里也没有这一项，用户觉得发不出去。
- **位置**：基础资料「到访目的」卡里，选了「面诊」（一般案件）或「需要院长面诊（复诊）」（关联案件）后，面诊需求下面多一行「客人希望的面诊时间」（选填，一行文字，`wantDraftRowHtml` / `saveWantDraft`，只存草稿不通知）；不面诊 / 没选不显示。**随资料送出**：按［确认］（`confirmMaterials`）时：选了面诊 / 复诊 → 值留在案件并记 Timeline「填写客人希望的面诊时间：…（随面诊资料送 KR）」，KR 在缴 / 免面诊费后看到案件，确认面诊时间的卡片最上面显示「客人希望：…」（`krConsultTimesBlock`，一般面诊、复诊面诊都一样，待办「确认预计出报告时间」里也带）；不面诊 → 清空。
- **面诊资料 tab**（`wantConsultRowHtml`）：改成只读显示 +［修改］（`WANT_EDIT`，点了出输入框 +［保存］［取消］）；KR 确认面诊时间之前（`awaiting_payment` / `paid_waiting_kr`）可改，改了 Timeline 记「修改…」、KR 收一条只告知的通知「客人希望的面诊时间有修改：…」（`paid_waiting_kr` 才发，待缴费时 KR 还看不到案件不发）；KR 确认之后（`wantConsultLocked`，等待报告起）［修改］灰掉 + 悬停「KR 已确认面诊时间」，核心 `saveWantConsult` 也拒绝；没值且已锁住整行不显示；已出诊疗方案 / 已取消 / 已结案不显示。
- 测试：selftest 新增 R91a（没选 / 不面诊没有这行、选了面诊在面诊需求下面、确认随资料送出、不面诊清空、面诊资料 tab 只读 +［修改］、KR 确认前改 KR 收通知、确认后锁）；R64a 按新交互改（只读 +［修改］，点了才有输入框）；R91a / R64a 通过，roletest KR（KM1）43 格 0 不符，A1 全套其余失败仍是既有的 S31 / S33 / S36 / BK1c / BK2c / R68a；测试数据已清（三家诊所案件 0）。

## CMD-1021-24 补充（2026-10-21，追加；取代 CMD-1021-19 里「复诊恢复确认卡一直展开、院长待办只在 KR 确认时间之后出现」，旧文字保留作历史）
- 基准 **dbff66f**（CMD-1021-23 之后），单个提交，**未推送**，**数据版本不变（55）**（新增可空字段 `c.recoveryResult.proxy`）。
- **院长看不到复诊的原因（查到的）**：院长待办 / 「恢复确认」卡的数据来自 `krTodoItems` 里的 `recover` 项，它和一般面诊的「上传面诊内容」同一时点——**只有 KR 室长确认面诊时间之后（`awaiting_report`）才进院长待办**；用户测的时候 KM1 还没确认面诊时间（案件在 `paid_waiting_kr`），所以院长工作台「恢复确认」卡 0、待办「现在没有待办」。数据本身是对的（复诊案件的负责院长 = 原案件院长 KD1，`krAllCases` 按 `director` 筛，没有漏）；不是院长没带上、也不是计数没算复诊类型。**修法**：KR 还没确认时间的复诊也先计入院长「恢复确认」卡（新增 `recoverwait` 项，cat `drecover`，参考名单：点卡片在待办栏灰色显示、不算待办；`TODO_REF` 按 kind 判断，`todoRefMode` 认 `drecover`），确认面诊时间之后变成真正的待办「复诊：上传恢复确认内容」（截止 = 预计出报告时间，和一般面诊同一规则，`recover`，红点 / 超时规则同一般面诊），院长日历照一般面诊显示（面诊块标题「复诊面诊」，日历 / 当天日程文字「复诊 · 客人名」，`krcOneLine` / `krcEvents`）；KR 室长待办、KR 工作台计数原来就包含复诊（`eta` / `waitdir` / `send`，文案带「复诊」）。
- **恢复确认的输入 = 和面诊同一套**（没有另写）：开始面诊（院长 / 室长谁先按）→ `krRecordBlock`（标题「录入恢复评估（院长口述 / 室长代录）」，按钮「语音录入评估 / 手动输入评估」，AI 整理 / 侧边栏 / 草稿 / 上传锁定 / ［增加内容］全部共用，`krCanRecord` 院长看自己负责的、室长都可）；**室长代输入**：录入记录显示「时间 · 谁（室长代输入）· 语音 / 手动」（`by` 不含「院长」的复诊记录），评估结论［恢复正常］［需要处理］（`krSetRecoveryResult`，院长或室长能选）下面写「评估人：KD1 院长」/「KM1 室长（室长代输入）」（`recoveryResult.by / proxy`）；**资料两边同一份**：录入内容在 `krVault(clinic, case)`、结论在 `c.recoveryResult`，院长和室长看的是同一份，谁输入都同步；之后室长整理提交（项目方案可不附）→ IN 需确认通知 + 待办（19 的流程，不变）。**共用的地方**：确认面诊时间卡（`krConsultTimesBlock`）、开始面诊 / 面诊卡（`krEtaStatusBlock`）、录入块 + 侧边栏 + 草稿 + vault、AI 整理、发送块 `krSubmitBlock`、待办时点规则、通知（`pushKrNotif`）、日历块；复诊专有的只有恢复确认卡、评估结论、文案。
- **KR 室长看复诊：先预约、恢复确认先折叠**（`krTabConsult` / `krRecoveryCard`，`KR_RV_OPEN`）：还没确认面诊时间（`paid_waiting_kr`）时，最上面是确认面诊时间的卡（客人希望在最上面，23），「恢复确认」卡在它下面、**折叠**成一行摘要「关联案件 · 要看的项目 · 想问内容前 14 个字」+［展开］（可手动展开 / 收起，记在 `KR_RV_OPEN`）；**确认面诊时间之后**自动展开，状态行「等待院长复诊面诊（面诊中）」；院长端不受影响（他在 KR 确认时间之后才有真待办）。复诊没有预算：`concernBlockHtml` 对复诊不再显示「预算 —」。
- 测试：selftest 新增 R92a（KM1：确认卡在上、恢复确认折叠 / 展开、没有预算、确认后自动展开 + 状态、录入块文案、室长代输入）、R92b（KD1：确认前计数 1（参考）/ 确认后待办 / 日程块 / 院长录入 + 评估人 / 两边同一份资料）；R87a 里恢复确认卡要先展开（折叠默认）；R87a / R92a / R92b 通过，roletest KR（KM1）43 格 0 不符，A1 全套其余失败仍是既有的 S31 / S33 / S36 / BK1c / BK2c / R68a；测试数据已清（三家诊所案件 0）。注意：R87a 会留下复诊状态，**R92a 要在干净夹具上先跑**（两条连跑 R92a 会失败）。

## CMD-1023-01 案件结构 v2（2026-10-23，追加；分支 feature/case-structure-v2，基线标签 revisit-1022-done；旧文字保留作历史）
- 分组式实作（数据版本 55 → 56，迁移只补 mainId）：主案件 = 承载面诊 / 赴韩的案件对象；IN 回来的天 = 带 `mainId` 的子记录（案件号 主案件号-序号，`joinMain`）；现算视图 `visitsOf / flowsOf / summaryRowsOf`（data.js 末尾）。S2 到店弹窗（新主案件 / 接续 / 来用本地项目）；S3+S4 IN 主案件页 tab 基础资料｜流程｜子案件｜项目汇总｜结算｜附件｜Timeline、列表只列主案件；S5 结算 tab 汇总分栏；S6 `visitSweep`（00:00 结束子案件）/ `careOverMonthSweep`（术后管理超一个月转管理项目）；S7 KR 列表 / 子案件 / 项目汇总 tab、经营数据案件数、操作锁粒度主案件；补：复诊建议赴韩 = 新主案件轻关联（`lightLink`）。
- **没做完**：接续相关旧函数没删（子记录接待复用）；日历 / 待办 / 通知 / KR 到院卡 / KR 院长评估的落点没改按子案件；逐条交代表见 `docs/case-structure-v2/dispositions.md`（507 条：照旧 460〔其中「建议改、未做」183〕/ 改成新结构 47 / 拿掉 0）。规则盘点见同目录 inventory-A～E.md，计划见 plan.md。

## CMD-1023-02 主案件 4 状态自动判断（2026-10-23，追加；分支 feature/case-structure-v2；旧文字保留作历史）
- **主案件状态**（`mainStatusOf`，data.js 末尾）：进行中 / 已完成（有持有 = 「已完成 · 有持有项目」）/ 仅出报告 / 已取消；自动判断，**拿掉 IN［结案］按钮和每天早上「是否结案」待办**（`inCloseOpen` / `inCloseDue` / `coreInClose` 函数还在但没有入口；［韩国行程结束］保留）。内部 stage 仍是 closed / reportonly / cancelled，对外叫「已完成」；案件管理 tab 已结案 → 已完成、栏位「结案类型」→「结束方式」。
- **自动改状态**：`mainAutoStatus`（updateCaseStage 末尾 + boot-in 每 5 秒 `mainAutoSweep` + joinMain 之后）：已完成 / 仅出报告又有未做的事或新子案件 → `reopenMain` 回到进行中（对话房恢复）；韩国行程已结束、术后管理都做完 → `mainAutoComplete` → finishCase。进行中判断 = 流程没结束 / 术后管理未预约或已预约（`pendingCareOf`）/ 今天或之后的预约（`activeVisitsOf`）。
- **期限**：`joinWindowOf(src, type)`：接续面诊从院长面诊日算、复诊从施术完成日（`surgeryDoneDayOf`）算，3 个月内算同一主案件；超过 → 到店弹窗灰掉写原因，`followupAskNewLight` 开新主案件轻关联（`lightLink`）。持有项目（韩国 / 印尼 / 本地没用完）算在当初买的主案件（`mainHoldOf` / `localMainsWithLeft`），IN 在 KR 日程用持有项目的预约（krbook `holdbook` / `carebook`）同样加入当初的主案件。
- **主案件页**：标题「客人名 · A000001」（拿掉第 N 次来访）；页头「进行中：流程 · 术后管理（印尼）N 项待做」；流程 tab = 一行一个流程可展开（`flowRowsOf` / `flowRowsHtml`，IN `flowTabHtml`、KR `krTabFlow`），本地管理不在流程 tab（IN 另有「本地管理」操作 tab）；案件管理已完成 tab 默认最近 3 个月、按最后来访日排（`CASE_DONE_RANGE`）。

## CMD-1023-03 补充（2026-10-24，追加；取代 CMD-1023-01/02 里流程 tab、「一个主案件页同一种 tab」的做法，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 6b0cd6f；提交 P1+P2 7bb2c28、P3+P4 e98cfd3、P5 3efb64c、P6 见 git log；数据版本不变（56），只加可空字段（`c.boughtFrom`、`c.concerns` 等照旧）。
- **P1/P2**：`isUpgraded(m)`（付赴韩定金 / 赴韩项目已结算 / 有子案件 / 到院≥2 天）决定 tab：未升级 = 一般案件页（基础资料｜面诊｜[本地项目]｜结算｜附件｜Timeline，无子案件号 / 项目汇总）；升级 = 基础资料｜面诊｜赴韩｜术后管理｜复诊｜子案件｜项目汇总｜结算｜附件｜Timeline（✓ ● 标记，没有流程 tab）；术后管理独立 tab（IN `inPostcareTabHtml`，KR `krProjCards(c,{only:'care'})`）；本地管理不单独一个 tab，升级后放在**项目汇总 tab 下面**（我的判断，回归发现缺口后补）。
- **P3/P4 子案件页**：IN `openSubcase(mainId,key)` / `SUBVIEW` / `subPageHtml`（页头「客人 · A000001-05 · 11/14（地点）· 今天做：…」+［回到主案件］；tab 到访｜今日项目｜结算｜附件｜Timeline）；KR `krOpenDay` / `KR_CASE.day`（地址参数 `day`，IN 用 `sub`），韩国那天的到院卡、院长评估、增加项目、客人已离院等 core*/kr* 操作原样放在这一页；KR「赴韩」tab 里仍保留到院卡（待用户决定要不要删）。
- **P5**：`mainAttentionOf(m, side, items)`（今天来访＞等我处理＞等对方处理＞未预约/过期＞已完成）→ 列表「进程」只写一件 + 新栏「其他进行中」（IN / KR 列表）；`openVisitOf(recId)`（日历块 / 今天来访待办进当天）；KR `krOpenSubCard` 升级后进 `krOpenDay`。
- **P6**：只有本地持有的主案件不再是接续候选（`localMainsWithLeft` 只剩有在韩持有的），改标新独立案件「来自 A000xxx 购买」（`markBoughtFrom` / `c.boughtFrom` / `localOnlyHoldMains`）；赴韩持有仍回原主案件（赴韩 ＞ 本地）；KR 客人已离院有没做完的项目 → 必选原因（`KR_LEAVE_REASONS`，Timeline「回到未预约；原因：…」）；00:00 自动结束文字改「回到未预约」；院长按［开始面诊］留在面诊 tab（取代 1019-08 切基础资料）。
- 测试：selftest 新增 R118a R118b R119a R120b R121a；因 UI 有意改变而更新的断言：R60a R82a R59b R74a R110a R116a R109a(本地持有一段)。

## CMD-1025-01 补充（2026-10-25，追加；取代 CMD-1019-08 / 1021-24 里一般面诊 KR 面诊 tab 的布局、CMD-1021-14 备注卡固定高度，旧文字保留作历史）
- 基准 **d776cec**，单个提交（见 Notion 汇报），分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **面诊 tab（KR 室长 / 院长，一般面诊 awaiting_report）** = `krConsultGeneral(c)`：面诊卡 `krConsultCardGen`（标题「面诊｜院长：KD1 院长」，院长账号只写「面诊」；标题行最右［开始面诊］；「预约面诊时间（韩国）… （距离预定时间 HH:mm）」；「预约报告时间（韩国）」只有室长看，旁有［修改］= 原来的［修改预计时间］，资料 `c.reportEta` 照旧保存；开始面诊后只留预约面诊时间 + 「录入面诊内容」［增加内容（语音）］［增加内容（手动）］+ 一笔笔记录，拿掉摘要卡 / 锁住提示 / KR 专用附件说明）在最上面，下面是「到访目的」卡 `krVisitPurposeCard`（메타뷰 检测 → 面部 / 身体部位卡 → 预算；`concernBlockHtml(c,{budgetLast:true, fold, foldKey})`；室长部位卡默认折叠 `KR_CN_OPEN`，开始面诊后整张默认折叠 `KR_VP_OPEN`，院长全展开没有按钮）。待确认时间（paid_waiting_kr）仍是 到访目的 → 确认时间卡。复诊评估 / 复诊面诊 / 沿用原方案 / 延续既往面诊仍走旧布局（`krTabConsult0`）。
- **KR 术后管理 tab 只露出 2 项的原因**：独立 tab 复用了项目卡的固定高度滚动区（`.kr-pc-scroll` 287px，内容 964px），其余项目要在框里滚才看得到；不是读了不同清单。已去掉固定高度。KR 多次的术后管理仍合成一行「剩 N / 共 M 次」（IN 每次一行），两边是同一份资料（`careUnits`）。来源标签原来对所有项目写「印尼购买」（`krSrcTag` 只分在韩增加 / 其他）→ 术后管理改 `krCareSrc`：方案内含 / 在韩增加。
- **付清尾款后才能预约术后管理**（`careBookBlock(c)` / `careBookBtn`，data.js）：KR 项目卡术后管理［预约时间］［全部预约］（`paid` = `krBalancePaid` 且行程没结束，原来就灰；本次把空着没渲染的［全部预约］也画成灰 + 提示）；IN 的术后管理 tab / 工作台「未安排预约」［预约］［全部预约］/ 本地管理接续里的［预约］灰 + 「付清尾款后才能预约」，`todoCbOpen` / `todoCareBookOpen`（新预约）也拒绝，改时间不拦；已结案的案件不受限。其他条件：核心 `coreCareBook` 本来就要 `c.krBalancePaid`；没有「施术完成后才能约」之类的条件。
- **备注卡**（`notesCompactHtml(c, role, title)`）：没有备注只剩一行「备注 ……［增加备注］」；有备注全部列出（`.notes-list` 最高 3 则，超过在卡里滚动），不再只截 3 条；［查看全部］（> 3 则）保留。IN 项目卡里的备注卡同一个组件。
- IN 接续弹窗（`fuRender`）拿掉标题下的灰字说明。`ST.krEta` 参数顺序修正（原来把日期塞成对象，面诊时间坏掉）。测试：selftest 新增 R122a / R123a / R123b。

## CMD-1025-02 补充（2026-10-25，追加；取代 CMD-1023-03 P4 里「子案件页只用一种版面（到访｜今日项目｜结算｜附件｜Timeline）」——只对 KR 的施术当天；旧文字保留作历史）
- 基准 **f02f493**，单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **KR 子案件页（施术当天）重排**（kr.js `krSurgDayPage` / `krSurgDayHeader` / `krSdStatusBar` / `krSdTabs` / `krSdPlan` / `krSdRun` / `krSdAutoTab`）：页头三行（客人名 面诊：N 次｜施术：M 次 在韩… ［对话］ / 来源诊所 · 院长 · KR 室长 / 主案件 A…（点回主案件））；状态列「当前状态 待到院｜［客人已到院］［修改时间］［未到院］」→「已到院｜［客人已离院］」，右边「备注：N / 无」；tab 随进度出现：到院前 到访｜项目方案 → 按［客人已到院］＋附件｜Timeline → 尾款付清 ＋术前状态｜结算 → 术前照片传完 ＋进行项目；默认打开最新出现的 tab（刚到院 → 项目方案、尾款刚付完 → 术前状态…，`KR_CASE.sdSeen`）。项目方案 = 评估 → 确认 / 增加项目 → 付尾款（原 `krWizard`，到院前只列预定项目）；术前状态 = `krPreOpBlock(c,true)`；进行项目 = `krProgressBlock` + 备注 + 项目卡（Step 4 勾选今日项目的画面也在这里）。拿掉了今日项目 tab 里的到院卡这一层、「← 回到主案件」条、子案件页里的「从…面诊开始」行。术后管理 / 管理项目那几天、IN 子案件页不动。客人不是在预定日到院时，`KR_CASE.day` 跟着变成实际的施术日 key。
- **［未到院］**（`coreTripNoShow`，只有施术当天、到院前）：记 `c.krNoShow` + Timeline + 通知 IN（action 级，请联络客人改期或取消赴韩），日期和项目不动。（我的判断：规格没写它做什么。）
- **预约弹窗可约次数**（data.js `holdItemTodayPicked` / `holdItemBookable`）：可约 = 剩余 − 已排的预约行 − 今天已选进到院的次数（原来 `holdItemPlanned` 只数 `subItems` 里的行，主到院的［本次使用］是 `todayPickMgmt` + `todayQty`，不是行，所以今天已排的项目还会出现在弹窗、「可约 1 次」里）；用在 `krCbMgItems`、`coreHoldUseSchedule`、`coreUnitBookUse`、项目卡管理项目的［预约时间］和［全部预约］。IN 的预约弹窗只有术后管理（印尼），没有管理项目，所以不涉及这个问题。
- **IN「未安排预约」尾款前不列术后管理**：`todoUbIn` 本来就有 `!c.krBalancePaid → return`（1025-01 汇报里我写「仍会列出」是错的），已加测试 R124c 确认；KR 的 `todoUbKr` 同样。
- **演示按钮搬家**：案件页状态列和案件列表的［演示：模拟时间超过 30 分钟］拿掉（`simulateTimePass30` 函数留着没入口）；功能放到 `test-prep.html?demo=A1&act=noshow`（新页，列出「待访问」预约，可选一位直接判定未到店，或全部一起 = 原按钮的做法），登录页「🧪 测试覆盖」页里有三家诊所的入口。
- 测试：selftest 新增 R124a（施术当天全流程）、R124b（可约次数）、R124c（IN 尾款前不列 + 按钮已拿掉）。

## CMD-1025-03 补充（2026-10-26，追加；取代 CMD-1023-01 定稿「主案件页头：全部进行中的事列出来」和 CMD-1025-02 里子案件页页头的次数算法，旧文字保留作历史；只改 KR，IN 不动）
- 基准 **8d3bc4f**，单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **子案件页（施术当天）· 进行项目**：今日项目表格 + 整体备注包进一张白底卡（`krSdRun` 的 `card()`），项目卡另一张，上下分开。
- **项目卡 · 管理项目 tab**（`krProjCards`）：「未使用」改「未预约」（= `holdItemBookable`：剩余 − 已排预约行 − 今天已选进到院的次数，照旧显示建议时间 / 建议日期 / 购买时间，按钮［本次使用］［预约时间］，不放［本次取消］）；「已预约」= 预约行［修改时间］+ 今天要用的（主到院的 `todayPickMgmt` / 子到院的 `useNow` 行：预约时间 = 今天到院的日期时间，操作［本次取消］），**表头只有 来源｜项目｜次数｜预约时间｜操作｜其他**（`krMgGridB` / `krMgRowB` / `krMgSecB`，没有建议时间 / 建议日期，也没有「今天提前使用」小字）。一个项目一次已约一次未约（剩 2 次）→ 分别出现在两边；今天已排的那次在「已预约」时，未预约行的［本次使用］灰 + 提示（避免覆盖次数）。选今日进行项目的勾选画面（`pickMode`）仍是旧的一行写法。子案件页进行项目里的项目卡同一个函数，一起套用。
- **预约弹窗**（`krCbOpen` / `krCbRender`）：打开时 `checked:true`，日期有问题的行 `krCbRender` 自动取消并标 `autoOff`，改对日期后自动勾上，自己取消的（`userOff`）不再自动勾；拿掉［全选］［全不选］（`krCbToggleAll` 删除）。适用所有入口（［预约时间］单条 / ［全部预约］ / 今日进行后自动弹出）——我的判断：单条［预约时间］也默认全勾（弹窗里本来就列所有未预约项目）。IN 的预约弹窗不动。
- **KR 主案件页**（`krMainHeader` / `krMainStatusBar` / `krMainNextInfo`）：页头第一行「客人名 · 案件号　面诊：N 次｜施术：M 次（已做完的次数，`krSdCounts`；子案件页头同）　在韩…　［对话］」，第二行「来源诊所 · 院长 · KR 室长」；拿掉名字旁状态标签、「从…面诊开始」行和原到院状态卡。状态列「当前状态 + 主案件状态」，右边一句话 + 按钮：已到医院「查看内容」／ HH:mm（今天）或 MM-DD 预约到院 · 赴韩项目 / 术后管理 …「查看内容」（进那一天的子案件页；同一天多种事用「、」连）／ 后面没有预约且还有未预约术后管理 → 「术后管理［预约时间］」（打开预约弹窗）／ 行程结束 → 「行程已结束［查看内容］」（进最后一次到院）。表里没写的我的判断：面诊阶段 → 待确认面诊时间 / 面诊中 / 预约面诊时间 +［查看内容］（进面诊 tab）；诊疗方案已发 → 一句话无按钮；已付定金但施术日期没确认 → 「等待确认施术日期」+［查看内容］（进赴韩施术 tab）。tab「赴韩」→「赴韩施术」。赴韩施术 tab = 项目卡 → 备注 → 「相关日程」（日期｜地点｜项目（那天实际做的项目，`krDayItemsText`，太长省略号 + 悬停全文）｜状态｜查看 ›；拿掉灰字说明；到院前后各状态都是这个版面，不再只在评估阶段显示向导）。
- 测试：selftest 新增 R125a（主案件页头 / 状态列各状态 / 相关日程）、R125b（管理项目未预约 / 已预约 + 预约弹窗默认勾）。

## CMD-1025-04 补充（2026-10-26，追加；取代 CMD-1023-01 / 1015-17 / 1013-12 里「IN 面诊 tab 跳到诊疗方案页」「IN 赴韩 tab 左上胶囊 + 在韩 timeline」、CMD-1021-06 / 1021-14 里 KR 项目卡「来源放第一栏」「0 项分类灰掉」，旧文字保留作历史）
- 基准 **93c3df2**，单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。测试用 `python3 -m http.server` 静态服务器（不经 Vite，不往任何 node_modules 写缓存）+ 内置浏览器，端口用完按 PID 停。
- **A（只改 IN · 只改一般面诊）** `consultTabHtml` 的 `report_ready` 分支：第一张卡「面诊 · 已出方案」+ 最右［邀请室长商谈］；第二张卡「面诊诊疗报告」+［下载］［查看方案］，报告整张直接显示（`reportDocHtml(c, orig, true)`，不折叠，有翻译 / 原文切换）；拿掉面诊费一行、「诊疗方案已到」、［查看诊疗方案 →］、「面诊阶段产生的文件…」。［下载］= `reportDownload()`（只打印 / 下载；报告在 KR 发送时已自动进附件 `coreSubmitReport` → `consultFiles`，原来的 `reportToPdf` 才会另存一条，保留给 R-F6 / 旧页）；［查看方案］= `reportViewPlan()`（作用同原方案页右上［查看方案 →］：`switchCaseTab('kr')`；没升级的案件选项目的卡就在面诊 tab 报告下面，所以滚到 `#consult-after-report`）。［邀请室长商谈］`consultTalkVisible(c)`：已买项目（`krDepositPaid` 或 `financePaid` > 0）/ 面诊那天（`consultAt` 换成诊所当地日期，没有 `consultAt` 的旧数据用出具日期，我的判断）已过 00:00 / 客人已离店（`leftStore` / `visitClosed`）任一成立就不显示；已发出去还没开始的邀请照旧（视频来电信号 30 秒超时规则，没改）。独立的「诊疗方案」页 `in-report` 现在只剩沿用原方案（`reuseReportHtml`）里的入口；通知 / 待办 / 工作台进「诊疗方案」的入口本来就已指向面诊 tab（`openNotif` planGo）。复诊评估 / 接续面诊没动。
- **B（只改 IN）** `krProcedureTabMain`：施术日期卡（已到院 + 付清尾款时日期时间写大）→ **客人赴韩日程卡 `inStayCardHtml`**（到达 / 离开 日期时间 + 机场、［修改］（`openStayModal`）、「⚠ 离境日比建议少 N 天」、一行小字「建议在韩停留 N 天（原因）」）→ 项目卡 `inProjectCardHtml`。拿掉顶部「建议在韩停留」胶囊和「在韩 timeline（N）」胶囊，保留［打印］（右上）。项目卡分类 tab 施术项目｜在韩管理｜已完成（`IN_PC_TAB`），栏位：施术项目 = 预约时间｜项目｜次数｜备注｜来源；在韩管理「已预约」= 项目｜次数｜预约时间｜购买时间｜备注｜来源，「未预约」= 项目｜次数（剩 N / 共 M 次）｜参考内容（`mgSugText`）｜建议日期（`krMgSuggest`）｜购买时间｜备注｜来源；已完成分「施术项目」「在韩管理」两段，栏位 项目｜次数｜使用时间｜购买时间｜备注｜来源。没有「状态」栏、没有操作按钮；术后管理在自己的 tab，不在项目卡里（1023-03 起）。
- **C（IN + KR）** 项目卡里没有项目的分类整个不显示（IN `counts`、KR `krProjCards` 的 `pill`），默认选第一个有项目的；全部都没有 → IN 写「没有项目」，KR 显示原来的「没有内容」提示。KR「来源」栏一律放最后：`krSrcLast(grid, cells)` 在 `krRowDiv` / `krHeadDiv` 里把以 `KR_SRC_W` 开头的网格的第一格挪到最后（项目卡各 tab、已完成 tab、「交给印尼」小卡共用，`handSec` 单独改）。
- **D（只改 KR）** `krCbRender`：预约弹窗里日期有问题的项目（`krCbCheck(r).err`：离境后 / 休诊 / 营业时间外 / 院长冲突）不混进日期组，单独圈成最上面一块 `.krcb-prob`「需要处理 N 项」（红框 + 每行写原因 + 自己的改日期框）；改对日期后重画时自动回到对应日期的组并勾上（自己取消的不再自动勾回）；「回印尼做」那块不变。默认勾好适用所有入口（沿用 1025-03 的判断，已写进汇报请用户确认）。
- 测试：selftest 新增 R126a（IN：面诊 tab 两张卡 / 邀请室长商谈三种消失）、R126b（IN，pcStage 夹具：赴韩 tab 顺序 / 日程卡 / 项目卡各栏位）、R126c（KM1，pcStage 夹具：KR 来源最后一栏 / 空分类不显示 / 需要处理块）；因这次有意改动而更新的断言：R60a R62a R65a R18c R74a（IN 项目卡 / 赴韩日程卡 / KR 表头来源挪到最后）。

## CMD-1026-01 补充（2026-10-26，追加；取代 CMD-1021-18 / 1022-15 里接续（复诊评估 / 术后管理）资料填在基础资料「到访目的」卡、CMD-1025-04 里一般面诊 tab 报告下面一直挂着赴韩方案卡，旧文字保留作历史）
- 基准 **9554cbb**，单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）；只改 IN。**测试教训**：python http.server 静态服务器没有缓存头，浏览器按「最后修改时间」启发式缓存，同一个端口隔天复用会读到旧的 `boot-in.js` 等没改过的文件——每个任务换新端口（这次 3971 / 3972）。
- **一 接续弹窗**（data.js `openContModal` / `contRender` / `contConfirm` / `contCancel`，状态 `CONT_MODAL`）：［客人已到店］→「是否接续之前的案件？」→ 接续（复诊评估 / 术后管理；接续面诊仍走原来的三道检查）→ 弹窗：메타뷰 + 接续类型（可多选至少一个）+ 复诊评估（这次要看的项目 / 每个项目的视频照片 / 复诊想问的内容 / 客人希望的评估时间，内容照旧）+ 术后管理（今天已经约好的术后管理，默认勾好，今天不做的取消勾；**不能在这里新增没约过的**）；底部［取消接待］［确认］。确认 = `confirmMaterials()`（缺项照旧弹「还缺哪几项」），再把勾选记进 `c.careToday`。弹窗没确认就关 = ［取消接待］。弹窗开着时 `renderCaseBody` 被包了一层会同步重画弹窗。确认后：基础资料 tab 只留基本信息 + 医美史（`basicTabHtml` 对 `contResume(c)` 返回空，确认前 `followupCardsHtml` 返回提示卡 `contPendingHtml`）；tab 依勾选——只复诊：基础资料｜复诊评估｜附件｜Timeline；只术后：基础资料｜术后管理｜附件｜Timeline（原「本地管理」tab 换名，`caseTabsHtml`）；都勾：基础资料｜复诊评估｜术后管理｜附件｜Timeline；有收费项目才有结算 tab（`showSettleTab` 原规则）。术后管理 tab 的「今日项目」= `c.careToday` 勾上的（没勾的留在预约项目），接续案件里拿掉「今天做」按钮（旧的「关联之前案件」下拉入口不动）。［修改］（复诊评估 tab 顶部，或只有术后管理时在术后管理 tab 顶部）重开弹窗（edit 模式：类型不能改、取消 = 还原快照）；KR 开始评估 / 已出结果 / 案件结束后灰掉（`contLocked`）。**我的判断**：术后管理只留「今天的术后管理」，原来的「术后恢复照片」卡拿掉；确认后不能改接续类型。
- **二 取消时接续资料清干净**（`clearResumeState`，`revertIntakeToWaiting` 和 `confirmCancelIntake` 共用）：原因——原来这两处只清了 `followup / followProjects / revisitMedia / …`，没清 `resumeFrom / linkedCase / mainId / 案件号`，所以 `followupAsk` 一看到 `c.linkedCase` 就直接 return（不再问），页头还写「关联：A000011」。现在全清：接续类型、关联、加入的主案件（`joinMain` 记下 `_origCaseNo` / `_seqBack`，案件号还原；原号被占了就取新号）、接续弹窗里填的内容、`careToday`、沿用的诊疗方案；弹窗关掉。
- **三 取消接待不再取消预约**：原因 ①——`autoNoShowSweep`（boot-in，5 秒一扫）把「预约时间 + 30 分钟已过、还是待访问」的案件判成未到店；［取消接待］把案件退回待访问，而客人是在预约时间之后才到店、再取消的，所以 5 秒内就被自动判成「未到店 / 已取消」。现在今天已经到过店（`c.arrivedDay===todayStr()`）的不再自动判（手动［未到店］照旧）；已经被取消的旧预约不修复。②「接续之前的案件」变灰的条件：`resumeCandidates` 里 术后管理 / 复诊评估 只能接续「赴韩已结束（`krTripEnded` 或已结案）」的案件，或这次预约带 `careFor`（从「未安排预约」约来的）指向它；接续面诊只能接续「仅出报告」的案件；三者都没有 = 整个「接续」灰掉。Coco C 的原案件还在有在韩持有、韩国行程没结束，原来那笔预约带 `careFor` 所以能选；预约被取消后重新约的那笔没有 `careFor`，三个候选都空 → 变灰，只剩「不接续」和「来用之前买的持有项目」（`localMainsWithLeft` = 原案件还有在韩持有项，这个选项就会出现）。预约保留后就不会再走到这条路。
- **五 一般面诊 Step 1 / Step 2**（`consultTabHtml` report_ready 分支、`consultPlanOpen` / `reportViewPlan` / `toggleReportOpen`）：Step 1 方案刚出来 = 报告展开 + 右上［下载］［查看方案］，赴韩方案卡不出现；按［查看方案］（`c.planViewed`）= Step 2：报告折叠（标题行［展开］），下面出现赴韩方案卡，［查看方案］拿掉；已勾项目 / 买了项目（`c.recommended` / 结算单）直接是 Step 2；升级后的案件仍保留［查看方案］（跳赴韩施术 tab）、报告默认展开。V2 tab 的 `consult` 分支只在 Step 2 才挂 `krTabContent`。
- 测试：selftest 新增 R127a（弹窗 / tab / 修改 / 锁定）、R127b（取消清干净 / 预约保留 / 重新问接续 / 变灰条件）、R127c（Step 1 → 2）；因这次有意改动而更新：R86a R95a R96a R102a（接续资料从「到访目的」卡改到弹窗）。

## CMD-1026-02 补充（2026-10-26，追加；取代 CMD-1026-01 里接续弹窗的［修改］、IN 项目汇总 tab 的筛选行 / 本地项目卡，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 2af3ad0，单个提交，**未推送**，数据版本不变（56）。
- **A（IN）**：接续弹窗确认后不能重开——复诊评估 / 术后管理 tab 的［修改］、`contLocked` / `contEditBtnHtml` / `openContModal(c, true)` 全部拿掉；勾「术后管理」时弹窗里多一行折叠的［＋ 增加术后恢复照片］（`contToggleRec`，展开用 `recoveryCardHtml`，选填）；取消接待（`contCancel`）先 `confirm('关掉会清掉已填的内容，确定吗？')`，确定 → 清空回待访问，取消 → 留在弹窗（测试可用 `window.GMC_NO_CONFIRM`）。
- **B（IN）**：项目汇总 tab 改项目卡结构（`summaryTabHtml` / `sumUnitsOf`）：胶囊 全部｜赴韩项目｜在韩管理｜术后管理｜本地管理｜已取消（空的不显示，`SUM_UI[id].cap`），分段 未预约｜已预约｜已使用（赴韩无未预约；已取消一段标取消 / 退款），只看不按；去掉两行筛选、「本次购买的本地项目」卡、灰提示；**「展开看每次使用」已拿掉，每次使用单独一行**。`localBoughtHtml` 现在转调 `summaryTabHtml`。
- **C（IN + KR）**：`tripAskWhy(c)` 取代原判断（`tripAskDue` 保留为包装）：'done' = 到院都做完 + 没有未来预约（原规则）；**新增 'left' = 离开日期（`c.stay.out`）已过，第二天早上起提醒，即使还有没到的预约 / 没做完的项目**（提醒里用 `tripLeftoverText` 列出，系统不自动取消）。IN 按［客人已到店］（`markArrived` → `tripAutoEndOnArrive`）：这位客人所有没结束的主案件行程自动结束（`coreTripEnd(..., {auto:true})`，`krTripEnded.auto='IN'`，Timeline 写明 IN 到访触发），KR 收通知「客人已回到印尼（IN 店到访），韩国行程已结束…」并列出剩余；剩下的术后管理 / 持有照原规则；韩国还有约好的 / 待付款 / 未做的 → 案件继续，不自动结案。
- 测试：selftest 新增 R128a/b/c，更新 R127a（去掉［修改］断言）、R110a（项目汇总新结构）、R84a（离开日期已过也提醒）。R82a 备注卡断言过期（1025-01 起，与本次无关，未处理）。

## CMD-1026-03 补充（2026-10-26，追加；取代 CMD-1026-02 B 里项目汇总的栏位、各处项目卡分段名「已预约」，旧文字保留作历史）
- 基准 **69afb28**，单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **IN 项目汇总栏位统一**（`summaryTabHtml`）：「项目类型」只在「全部」胶囊、放第一栏（原「业务类型」）；未预约 = 项目｜次数｜使用参考｜购买时间｜建议时间｜来源；预约中 = 项目｜次数｜预约时间｜购买时间｜使用参考｜来源；已使用 = 项目｜次数｜使用时间｜购买时间｜备注内容｜来源；已取消不动。未预约 / 预约中不放备注。`sumUnitsOf` 预约中的单元补了 `ref`。
- **「已预约」分段改「预约中」**（只改分段标题）：IN 项目汇总、IN 赴韩 tab 在韩管理项目卡（`inProjectCardHtml`）、KR 项目卡施术项目 / 术后管理 / 管理项目三个 tab（`krPcSec` / `careSec` / `krMgSec` / `krMgSecB`，KR 子案件页进行项目里的项目卡同一函数）。**没改**：到院卡分组「今天 / 已预约 / 已完成」（kr.js `krCaseGroupsHtml`，是到院分组不是项目卡）、状态标签 / 通知 / Timeline 的「已预约」。
- **未预约同一项目合一行**（`sumUnitsOf` 末尾合并，只合术后管理 / 本地管理；管理项目本来一个项目一行）：「剩 N / 共 M 次」，共 = 该术后管理项目所有（未预约 + 预约中 + 已使用）次数，建议时间取最早的一次；预约中 / 已使用一次一行。
- 测试：新增 R129a；更新 R82a（备注卡：全部列出、露出 3 则超过滚动、0 条只剩一行；tab 数量 0 不显示（1025-04 起）；预约中）、R125b（预约中）。R58a / R59a 在基线 69afb28 上就失败（术后管理早已搬出赴韩 tab），未处理。

## CMD-1026-04 补充（2026-10-26，追加；取代 CMD-1026-01 / 02 里接续弹窗的版面（接续类型、今天的术后管理、术后恢复照片），旧文字保留作历史）
- 基准 **539ae9a**，单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）；只改 IN（弹窗）+ KR 一个分组标题。
- **KR 到院卡分组**：「今天 / 已预约 / 已完成」→「今天 / 预约中 / 已完成」（`krCaseGroupsHtml`）；IN 术后管理 tab（`inPostcareTabHtml`）的「已预约」分段 03 漏了，这次一起改「预约中」。
- **接续弹窗重排**（data.js `contRender`）：메타뷰 → **接续项目**（原「接续类型」，长说明拿掉）☐ 复诊评估 ☐ 术后管理 → 勾复诊评估展开「这次要看的项目」（含上传卡）→ 勾术后管理展开「今日预约管理」（逐项勾）→ **询问问题**（原「复诊想问的内容」）、**客人希望的评估时间**（只有勾了复诊评估才出现）→［取消接待］［确认］。没勾的不展开。
- **术后管理默认 / 灰掉**：`openContModal` 打开时今天有约好的术后管理（`contTodayCareRows`）→「术后管理」默认勾、项目全勾；没有 → 灰掉不能勾，旁边写「今天没有约好的术后管理」。项目全部取消 → 上面「术后管理」自动取消（`contToggleCare`）；再勾上面的 / 下面任一项会同步。仍不能新增没约过的。可以暂时一个都不勾（`resumeTypesOf` 改成认空数组 `types:[]`），［确认］时拦住「请至少勾选一个接续项目」。新函数 `contSetTypes`；`contToggleRec` / 术后恢复照片整块拿掉（收回 02 A2）。
- 测试：新增 R130a（弹窗）、R130b（KR 分组）；更新 R127a R86a R95a R102a R128b（文案 / 默认勾）、R58a R59a（术后管理早已不在赴韩 tab：改成检查术后管理 tab 和项目卡 tab），R54b 跑过但在基线 539ae9a 上同样失败（1025-03 改默认勾后的旧断言，未处理）。

## CMD-1026-05 补充（2026-10-26，追加；取代 CMD-1026-04 里接续弹窗「今日预约管理可逐项勾选 / 项目全取消则术后管理取消」、旧的状态列［未到店］，旧文字保留作历史）
- 基准 **92de7fc**（CMD-1026-04），单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）；只改 IN。
- **状态列拿掉［未到店］**（`renderCaseStatusBar`）：待访问只留［客人已到店］［预约修改］［预约取消］；未到店只靠 `autoNoShowSweep` / `markNoShow(auto)`（过预约时间 30 分钟、今天已到过店的不判）；测试覆盖页「模拟未到店」、KR［未到院］不动。`rowMarkNoShow` 函数留着没入口。
- **自动未到店后项目退回「未预约」——现状**：本来就会：术后管理行是否「已预约」由 `inCareBooking` 现算，它忽略 `subState==='cancelled'` / `stage==='cancelled'` 的预约，所以预约被取消后这一项自动回到未预约（IN 的「未安排预约」、术后管理 tab、KR 项目卡都跟着变）；预约本身不消耗任何持有项目 / 次数，没有要退的东西。**没改代码**，只加测试 R131a 锁住。
- **工作台已满时段［＋加约］**（ui.js `calOverbookOk` / `calOverbookAsk` / `overbookNote`，周视图格子）：只有**今天、现在这个时段 + 下一个时段**满了才显示；格子底部「已满」旁小按钮，超额时左边显示 `n/上限`（如 3/2）；点了先确认「这个时段已满（n/cap），确定要加约吗？」→ 打开原来的预约表单（时段已带好）；老客人加约后案件 Timeline 记「超额加约：日期 时间 时段已满（n/cap），谁 加约」，新客人（占位）记操作日志（类型「其他」/「超额加约」）。**时段按 30 分钟算（`SLOT_MIN`，和预约规则同一套），任务页例子写的是 1 小时，已在汇报里写明**；日视图没有「已满」标记，没做；案件页预约弹窗仍不能选已满时段。
- **接续弹窗今日预约管理只看不能改**（data.js `openContModal` / `contToggleType` / `contRender`，`contToggleCare` 改成空函数）：今天约好的术后管理只列出来、没有勾选框；有约 → 「术后管理」默认勾好且不能取消（灰勾，写「客人今天约了，不能取消」）；没约 → 灰掉不能勾；拿掉 04 的联动；`CONT_MODAL.care` = 今天约的全部（确认后 `c.careToday` 同）。今天不做某一项 → 确认后在案件里处理。
- 测试：新增 R131a（状态列 / 自动未到店后项目回未预约）、R131b（加约）；更新 R127a R130a；R54b 修好（建议日期落在医院休诊日时按规则自动不勾，断言改为「勾 = 日期没问题」；该用例会真的预约，**重复在同一份数据上跑会失败，要先 A1 跑 R52a 再 KM1 单次跑**）。

## CMD-1026-06 补充（2026-10-26，追加；取代 CMD-1026-05 里加约「现在 + 下一格」写死、CMD-1022-15 / 1026-01 里第一个对话框多选接续类型，旧文字保留作历史）
- 基准 **57f96f9**（CMD-1026-05），单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）；只改 IN。
- **第一个对话框白话**（data.js `followupAsk` / `fuRender` / `fuSet` / `followupAskDone`）：标题「〈客人〉是否继续之前的服务？」；○不继续，开始新的服务 ○继续之前的服务 ○使用之前购买的项目；按钮［开始新的服务］［确认继续］；括号里的系统说明拿掉。选「继续之前的服务」后只有一层单选：○继续面诊 ○复诊 / 术后管理（`FU_ASK.type` = `'接续面诊'` | `'复诊术后'`），用来决定下拉框列哪些案件；复诊评估 / 术后管理细项**只在第二个弹窗「继续项目」里勾**（照 04 / 05）。`fuSet('type','复诊评估'|'术后管理')` 旧写法兼容为「复诊术后」+ 预选（`FU_ASK.pre`）。继续面诊的三道检查不变；复诊超过 3 个月的检查挪到第二个弹窗［确认］。
- **默认值**：今天有约好的术后管理（`contTodayCareRows`）→ 默认「继续之前的服务」+「复诊 / 术后管理」，下拉直接带出那个案件（`resumeCandidates` 把今天有约的案件算进候选，所以不再出现「没有可继续的案件」）；从「未安排预约」约来 / 自助预约选了复诊·术后管理 → 同，选了复诊时第二个弹窗预选复诊评估（`pre`）；其余不默认选继续（`mode:'none'`）；手动选「继续」时只有一种类型有候选案件就选那一种。
- **画面上的「接续」→「继续」**：data.js ui.js rules.js todo.js admin.js in.html 里所有可见文字（含 Timeline / 提示 / 标签 / 弹窗标题「继续之前的服务 · Coco C　关联 A000011」、「继续项目」、「继续面诊」）；**数据值 `'接续面诊'`、变量 / 函数 / 字段名不动**，显示用 `rsDisp()`（rules.js），`tzRender` 在 IN 端把旧 Timeline / 通知里存的「接续」也显示成「继续」。**KR 端 kr.js 的「接续 · 类型」标签（案件列表 / 页头 krResumeTag、关联案件块）还是「接续」，没改**（任务要求先列出）。
- **加约范围成为诊所设定**：诊所设定页（管理者 / 老板，`canDo('clinic')`；一般室长没有这个页，所以「只能看」就是看不到入口）预约规则里新增「可加约的时间范围」下拉 30 分钟 / 1 小时（默认）/ 1.5 小时 / 2 小时（`CLINIC_SETTINGS.overbookMinutes`，旧设定没有这个键时按 60）；`calOverbookOk`：今天、现在这一格 + 从现在起这个范围内开始的格（例：15:20、1 小时 → 15:00 / 15:30 / 16:00），且该格是「已满」才有［＋加约］。
- 测试：新增 R132a（对话框 / 默认 / 第二个弹窗 / 画面没有「接续」）、R132b（加约范围 + 设定页）；更新 R86a R95a R102a R127a R131b 的文案 / 默认值断言；selftest.js 里的「接续」文字一并改成「继续」；coverage.js A5 同时认「接续到访 / 继续到访」。

## CMD-1026-07 补充（2026-10-26，追加；取代 CMD-1026-06 里「继续」第一层三选一 + 第二个弹窗勾继续项目，旧文字保留作历史）
- 基准 **3a05fe5**，单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **一 / 二 第一个对话框重做**（data.js `followupAsk` / `fuRender` / `fuSet` / `fuAvail` / `fuCandsOf` / `fuSvcList` / `followupAskDone`）：[客人已到店] **每次都弹**（新客人也弹）：「请选择本次服务类型」○开始新的服务案件（默认）○继续之前的服务案件 ○使用之前购买的项目；选「继续」→「本次服务内容」面诊 / 术后管理 / 复诊评估（面诊仅可单选；术后管理、复诊评估可都勾；今天有约好的术后管理默认勾好且不能取消）+「选择之前的案件」下拉；只有一个［确认］。没有符合的案件 / 没有持有项目 → 对应选项灰掉；超过 3 个月的案件不列（不是 Belly 的原因，见下）。第二个弹窗（`contRender`）去掉「继续项目」勾选，只按第一个对话框勾的内容展开（复诊评估：要看的项目 / 询问问题 / 希望的评估时间；术后管理：今日预约管理只列出）。
- **Belly 的原因**：她以前的案件只在本地买过（案件已结案、没有赴韩、也不是仅出报告），三类（接续面诊 / 复诊评估 / 术后管理）都没有符合条件的案件，所以「继续」整个灰掉；不是 3 个月规则。「使用之前购买的项目」可选。
- **三 使用之前购买的项目的去处**：赴韩持有（`localMainsWithLeft`）→ 回原主案件加一个子案件（原来就这样）；只有本地持有 → **开新独立案件**，自动标「来自 A000xxx 购买」（`c.boughtFrom`，不加入原主案件）。原来的做法：到店时只要有本地持有就自动标来源（`markBoughtFrom`）、没有选择；现在只有选「使用之前购买的项目」才标，选「开始新的服务案件」不标（持有项目仍可在本地管理使用）。没有动本地选购主线流程。
- **四 照片查看器**（data.js `pvAttr` / `pvShow` / `pvStep` / `pvClose`）：IN / KR 通用，点照片 → 大图，标题「类别（面诊 / 术前 / 术后 / 复诊）· 部位 · 角度」+「3 / 10」，左右方向键 / 两侧箭头翻页，Esc / ✕ 关闭，跨部位连续（同一案件页内所有照片依序），视频不进翻页（单独显示）。接入：苦恼部位卡、复诊项目卡、前后对比（旧 `revCmpZoom` 保留兜底）、KR 术前照片。
- **五 「接续」→「继续」**（KR 画面 6 处可见文字 + `rules.js` `rsDisp()` 经 `tzRender` 对 Timeline / 通知里已存的旧文字显示时转换，存档不改）；IN/KR 画面已无「接续」。
- 测试：selftest 新增 R133a（对话框结构 / 勾选规则 / 第二弹窗展开）、R133b（新客人 / Belly / 本地持有与赴韩持有去处 / 3 个月）、R133c（照片查看器）；因有意改动更新：R86a R95a R102a R109a R117a R127a R127b。A1 全套无新增真实失败（剩余皆跨账号分页用例、既有 R21a / R131b 时间相关、R59a/R71a/R129a 仅在污染数据序列里失败，干净数据单跑通过）；KM1 回归通过。
- 我的判断（未经确认）：术后管理「今天有约」才可勾（无约则灰）；面诊选项只在有「仅出报告且 3 个月内」案件时可勾；旧的「开新主案件（轻关联）」函数留着但对话框已不出现。

## CMD-1026-08 补充（2026-10-26，追加；旧文字保留作历史）
- 基准 **58b5aec**（CMD-1026-07），单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56），只改 IN，没删任何资料。
- **一** 主案件「术后管理」tab 今日行：印尼 + 今天 + 找得到今天的子案件（`careTodayKey`）→ 拿掉［操作完成］，换［查看今天 →］（`careViewToday` → `openSubcase`）；找不到子案件时保留旧按钮。［修改时间］不变。主案件其他 tab 查过：项目汇总下方的本地管理选购/使用（本地项目，主案件自己就是当天时才有）和继续案件里的 `inContCardHtml`（那是子案件页本身）不违反规则，未动。
- **二** 客人页「本院案件记录」（`cliCasesHtml`，IN）：子案件缩进（`└`）放在所属主案件下面，默认全部展开、列该客人所有 IN 子记录，已取消的灰色。**子案件编号规则**：`visitsOf` 按「日期 + 时间」排序后的位置给号，在客人**确认继续（`joinMain`）那一刻**取当时的位置并写进子记录 `caseNo`，之后固定不变——所以不是建立顺序：-05 之前已有 -03/-04 时，后来补进的更早日期也会拿到当时排序位置的号；编号不保证与日期同序、也可能出现跳号（取消接待还原号，被占就换新号）。
- **三** 客人页「正在进行案件」每行前加「案件号 · 日期 ·」（`cliOngoingHtml`）。
- **四（查）** 现在按［取消接待］不会留下子案件号：号在第一个对话框按［确认］继续（`joinMain`）时才分配，［取消接待］/ 退回待访问走 `clearResumeState` 还原原号、清掉 `mainId`，预约保留为待访问；R134a 验证。A000011-05 是 1026-01 修复前取消接待留下 `mainId` 后被自动判未到店的旧数据。建议处理（未做、未动数据）：已取消的子案件在客人页灰色显示（已做）；是否跳号待业务决定。
- **五（查）** 重现：到店→继续→取消接待→再加约/重约，IN 的工作台加约、占位、自助预约、未安排预约［预约］都会合并（`pendingResvSameDay`），不会多出一笔。**唯一缺口**：IN 案件页［预约修改］（`confirmReschedule`）改到客人已有待访问预约的那天不检查 → 已修，现在拦住并提示已有预约（`pendingResvSameDay`）。A000015/A000018 同为 11/26 最可能是预约修改撞日（或旧数据）。
- 测试：新增 R134a；A1 全套无新增失败（R59a/R71a/R129a 污染序列问题同前、单跑通过，R131b 时间相关、S33/S36/BK*c 同前）。

## CMD-1026-09 补充（2026-10-26，追加；取代 CMD-1026-08 一里主案件术后管理今日行的［查看今天 →］，旧文字保留作历史）
- 基准 **be5ec9e**，单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56），只改 IN。
- **A 子案件页（复诊 / 继续子记录）今日项目**：复诊评估卡默认收起（`revEvalTabHtml`，标题「复诊评估 · 等待 KR 室长确认时间」随状态变 + ［展开］，`REV_OPEN`）；项目卡（`inContCardHtml`）入口只留［＋ 添加本地管理项目］（`inAddLocalProject` → 现有 `carriedContinue('buy')` / `lmContinue('buy')`，本地选购 / 付款主线没改），拿掉［继续选购］［使用持有项目］，子记录页右上［＋添加本地管理］也不再显示（`renderCaseHeaderActions` 对复诊 / 继续子案件隐藏）；胶囊没项目就不显示；术后管理：今日项目 / 预约项目 / 未预约（三段标题始终显示），栏位 项目｜对应施术｜次数｜使用参考｜建议时间｜预约时间｜操作，今日行［操作完成］［本次不做］（`careNotToday`：从 `c.careToday` 拿掉并忽略这次到店自己的预约，退回未预约），做完（`usedInCase`）留在今日项目显示「已完成」无按钮；本地管理：今日项目（这次买的 + 今天用的持有）/ 未使用项目（其他案件的持有，［使用持有项目］），空段不显示，没有「预约项目」段（本地项目没有预约）。复诊子记录没有术后管理 / 本地项目时项目卡也在（`subTodayTabHtml`）。旧的「关联之前案件」术后来访流程的未预约行仍保留［今天做］。
- **B 主案件页**：页头三行（`mainPageV2` / `renderCaseTitle` / `renderCaseSubtitle` / `renderCaseStatusBar`）——第一行 客人名 + 状态标签（`caseStageBadge`），第二行 案件号 · 对接院长 + 最右［发起对话］，第三行 今日进行中：A000011-05（…）+［进入案件］/ 今天来访（来访就是主案件自己时无按钮）/ 下次预约：日期 时间 / 下次预约：—；拿掉标题里的案件号、「从…开始 · 进行中」行、单独「当前状态」卡（只剩客人离店 / 催办按钮时放在第三行下面）。业务 tab（面诊 / 赴韩 / 术后管理 / 复诊，升级后的主案件）tab 列下面加「相关子案件」（`tabVisitsHtml`）：只列类型相关的，进行中 → 已预约 → 已完成，进行中 / 已完成［查看内容］，已预约［预约修改］（`openRescheduleModal(子记录 id)`；韩国的只有［查看内容］），已取消 / 未到店不放。术后管理 tab 今日行只留［修改时间］（`careTodayKey` / `careViewToday` 留着没入口）。
- **C 子案件号**：`joinMain` 按确认继续先后给号，下一个 = 该主案件现有最大号 + 1（`visitsOf` 的号和已有子记录号都算），同一天已有同主案件的另一笔来访 → 沿用那个号；给了不再改，已有的号不重编；取消接待 / 退回：该记录不再是子案件，号自然释放——只有它是最大号时下一次才拿回同一个号，**中间的号被取消会留空缺**（不重编，所以做不到永远不跳号）。
- 测试：新增 R135a；因有意改动更新 R86a R96a R100a R107a R116a R127a R134a 的断言。A1 全套无新增真实失败（R132b / R131b 与时间有关）。

## CMD-1026-10 补充（2026-10-26，追加；旧文字保留作历史）
- 基准 **a0f72c0**（CMD-1026-09），单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56），只改 KR（通知文字在 IN 送出那一步生成，一并改了写法）。
- **一 原因**：复诊评估的状态（待确认时间 / 等评估 / 待发结果）记在 IN 送出那一天的**子记录**（带 `mainId`）上，而 `krAllCases()` 只列主案件（1023 S7），`krTodoItems` 只遍历这些行，所以子记录上的 `eta` / `waitdir` / `send` 待办永远没生成；通知（`pushKrNotif`）是送出时直接写的，所以通知中心有、待办没有。**不是 OFF**：KR 待办没有任何 OFF 过滤（测试里 KM1 当天 OFF 待办仍在，OFF 规则没改）；也不是 07 改对话框造成（`startRevisitEval` 仍在 ui.js 确认时调用）。修：`todo.js` 新增 `krRevisitKidRows`，`krTodoItems` 把进行中的复诊评估子记录也当一行（点进去开那一笔复诊评估；院长待办 `recover` 同样靠它）。顺查 07 之后送 KR 这一步：通知、Timeline、对话房、院长待办、工作台卡片计数都走这条（现已补全）；KR 案件列表进程见三；催办 / 倒数是 IN 子记录页自己的，没漏。
- **二 通知写错日子**：根因是子记录号（A000011-05）和主案件某一行的行号（`subItems[].no`，也是 A000011-05）撞号，显示层 `visitWords` 优先按行号换成「到院（11/24）」。修：写通知时子记录号用不换行连字符（`subNoTxt(c)`，U+2011），不被换掉；「复诊评估已送出」改成「（A000011‑05 · 11/26 · 诊所）」；其余复诊相关通知（结果已到 / 开始评估 / 时间变动 / 希望的评估时间 / 需要处理）同样用 `subNoTxt`。**其他可能撞号的**：Timeline / 通知里凡把子记录号写进文字的地方（如「X 已到院」「加入主案件 A000011-05」）仍可能被换成别的日期，没改，列给你决定（根本办法是子记录号和行号用不同格式）。旧通知不改。
- **三 KR 状态标签**：`krTaskStageOf`（kr.js，`krAllCases` 行 `krStage`）：KR 要做的事优先——① 复诊评估 待确认时间 ② 复诊评估 待发送结果；没有才用原来的「阶段 · 进程」（IN 的事在后）。KR 案件列表的阶段 / 进程和主案件页头状态标签都用它（页头写「复诊评估 · 待确认时间」）；IN 端不动。
- **四 KR 复诊 tab 卡片**：标题行状态按实际（`flowRowsHtml` 新增 `pillOf`：待确认时间 / 待评估 / 评估中 / 待发送结果）+ 送出日，下面只放［打开复诊评估］，「送出」不重复。
- 测试：新增 R136a（KM1 分页，pcStage 夹具）；KM1 批次对照 a0f72c0 失败集合完全相同（R53b R75a R79a R80a R87a R92a R122a 都是已有失败），IN 相关批次通过。

## CMD-1026-11 补充（2026-10-26，追加；取代 CMD-1026-09 B1 里「一般案件也有第三行」「当前状态卡里的［客人离店］［催办］」、CMD-1026-10 二里的不换行连字符 subNoTxt，旧文字保留作历史）
- 基准 **8301ed2**，单个提交，分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **IN 一～四**：一般案件（没升级）不显示页头第三行（`renderCaseStatusBar` 里 `mainPageV2 && !isUpgraded` 直接清空）；页头右上角依序［发起对话］［添加本地管理］［增加面诊（原有）］［客人离店 / 确认结案］（`renderCaseHeaderActions`，条件不变 `canEndCase`），状态栏里不再放［客人离店］和［催办］；［催办］放在面诊卡「已超过预计时间」旁（`consultTabHtml` awaiting_report，复诊评估卡标题行同；待办栏的催办不变，所以「待确认施术时间」超时的催办仍可在待办栏用）；面诊卡的［演示：模拟时间超过预计］拿掉（`simulateReportTimeout` 函数留着给测试）。
- **五 KR**：一般面诊报告出来后（`report_ready`）面诊 tab 第一张卡合成「面诊」卡（`krConsultDoneCard`）：负责院长［院长日程］、面诊报告时间（韩国）、到访目的（默认折叠，［展开］后메타뷰 + 各部位（说明 / 希望预期 / 视频 / 照片全部摊开，`fold:false`）+ 预算）；开始面诊前 / 面诊中不动；院长账号同样合成（我的判断）；下面的报告卡等不动。
- **六 IN**：［退款服务］从基础资料 tab 搬到结算 tab（`settleTabHtml` 包装前置 `refundServiceBarHtml`）；有可退批次但没有结算单的案件，结算 tab 也出现（`showSettleTab` 包装，只在基础资料已确认后）；接待中（基础资料未确认、还没有 tab）仍留在接待页顶部（否则「只办退款」的来访没有入口）。
- **七 子案件号一套**：`mainNoMax(m)`：一个主案件下，韩国行（`subItems[].no`）、印尼来访子记录（带 `mainId` 的 `caseNo`，含已取消的）、主案件自己那一天（`visitsOf` 里 `rec===m.id`）共用——下一个号 = 最大号 + 1；`subNextNo`（韩国行）和 `joinMain`（印尼子记录）都从它取；同一天已有同主案件的另一笔来访 → 沿用那个号；给了不再改，已有资料不重编。`visitWords`：真有这个号的子记录就原样显示不再换成「到院（日期）」（KR 也认 `krAllCases` 行的 kids）；`subNoTxt` / U+2011 拿掉，复诊相关通知用普通连字符。旧资料撞号的（例 A000011 两个 -05）不动；显示时子记录优先，主案件行里同号的行号文字也会按子记录原样显示（不再换成到院日期）。**之前一个主案件下有三套号**：① 韩国行的行号（`subNextNo`，只数本案件 `subItems`，两位）② 到院编号 `dno`（`subCaseNums`，每次到院一个 -1 -2…，现算，一位）③ 印尼子记录号（`joinMain`：1026-01～08 按 `visitsOf` 日期排序位置、1026-09 起 最大号 + 1，但只数 `visitsOf` 的号和已有子记录）；①和③互相不知道对方，所以撞号；`visitWords` 又把任何 `A000011-NN` 当行号 / 到院编号处理。**A000011 两个 -05**：我看不到你的数据，推断：11/20 那条在 1026-01 修复前按「日期排序位置」拿到 -05，取消后留着；11/26 那条也按同样的位置规则拿到 -05（取消的那条在位置计算里不占位）。
- **八 IN**：关联案件块（`relBackOf`）不再列自己的子案件；`relatedFollowers` 同样排除。
- 测试：新增 R137a（A1）、R137b（KM1）；更新 G1（［客人离店］在右上角）、R95a（原案件的关联案件不再列「后续继续」）、R136a（普通连字符）。A1 全套无新增失败；KM1 批次失败集合同 8301ed2。

## CMD-1026-12 补充（2026-10-26，追加；取代 CMD-1026-09 里子案件页「今日项目 / 剩余项目」卡的做法和「＋添加本地管理项目」只切换状态不弹窗，旧文字保留作历史）
- 分支 feature/case-structure-v2，接在 CMD-1026-11（dad8f4e）之后，单个提交，**未推送**，数据版本不变（56）；只改 IN。
- **复诊评估子案件页两张卡**（data.js `inContModel / inContTodayHtml / inContRestHtml / inContCardHtml`）：「今日项目」= 术后管理 + 本地管理放在一起，不分胶囊，栏位 项目类型｜项目｜对应施术｜次数｜预约时间｜操作；操作［操作完成］［本次不做］（术后 → 退回未预约 `careNotToday`；本地 → 退回未使用 `markMgmtRows`）；做完的写「已完成」无按钮；「剩余项目」标题行右边［＋添加本地管理项目］［本次使用］，胶囊 术后项目（预约项目［修改时间］/ 未预约项目）、本地管理（未使用项目），空胶囊不显示。
- **［本次使用］**（`inUseOpen / inUseConfirm`，`#in-use-overlay`）：勾选清单（术后 · 未预约、本地 · 未使用），已预约在别的日子的不可选；确认后进今日项目。本地项目沿用持有项目使用规则（次数输入框最多 = 剩余、有选项的必选）。
- **［＋添加本地管理项目］没弹窗的原因**：代码里本来就没有本地选购弹窗；`inAddLocalProject` 只把 `c.localMgmt.step` 切成 'buy' 并在卡片下面重画，原测试 R135a 也只断言了状态。现在 `#lm-buy-overlay`（`lmBuyModalRender`）里放原来的 `lmBuyHtml`，［结算］［本次不购买］（✕ 同本次不购买）走原来的 `lmSettle / lmNoBuy`；结算后弹窗关闭、结算 tab 出现、客人持有增加，买到的先进「剩余项目 · 本地管理 · 未使用」（不自动进今日项目）。
- 测试：新增 R138a（弹窗真的出现 + 全流程），更新 R86a / R107a / R135a（旧卡结构断言）。

## CMD-1026-13 补充（2026-10-26，追加；取代 CMD-1026-11 七里「一个主案件下韩国行 + 印尼子记录共用最大号 + 1（mainNoMax）」、CMD-1026-11 六里接待页顶部放［退款服务］，旧文字保留作历史）
- 分支 feature/case-structure-v2，接在 CMD-1026-12（6814bdd）之后，单个提交，**未推送**，数据版本不变（56）。
- **一 子案件编号一天一个号（IN + KR）**：新主案件（升级之后）`m.dayNoOn=true`、`m.dayNos={'日期|地点':'A000011-02'}`、`m.dayNoSeq`（只增不减的计数器；后端用原子计数器）。`dayNoSync(m)`（`updateCaseStage` / `joinMain` / `coreSubAdd` 里调用）：没升级（`isUpgraded` 假）不编号；升级后第一次调用决定新 / 旧——主案件里还没有旧编号才开始编，升级当天（`m.visitDate`）= -01，之后 `visitsOf` 里还没号的天按日期补；`dayNoAssign(m,date,place)` 同一天同一地点沿用同一个号、取消的号占位不重用、号给了不再改。IN 子记录（`joinMain`）的 `caseNo` = 当天的号（`dayNoAssign`）；`visitsOf` 的 `v.no` 读登记表（子记录自己的号固定不变）；`subCaseNums` 读登记表；`visitWords` 对新主案件原样显示号（不再把 -NN 换成「到院（日期）」）。**项目行不再用子案件号**：`subNextNo` 对新主案件给内部行 id `A000011#3`（带 #，唯一），`rowDayNo(c, s)` 读该行所在那一天的号用于日志 / 悬停提示，项目显示「A000011-02 · 项目名」；`dno` 仍由 `subCaseNums` 派生（兼容）。**旧主案件**（已有旧编号：`dayNoLegacy`）`dayNoOn=false`，仍按旧办法（行号 / 到院编号 / `mainNoMax`）显示，不重编不删；旧资料里撞号的照旧。
- **二** 退款按钮：结算 tab「汇总（主案件 …）」卡标题行最右端（`settleTabHtml` 包装，`refundBtnHtml`）；没有汇总卡的放结算 tab 最上方靠右（我的判断）；接待页顶部不再放。**三** 到店对话框最后一项「退款」（`fuRender`，没有可退批次灰掉）：选了 → `followupRefundGo` → `openRefundFromDialog` 直接跳退款弹窗（不开新案件，退款规则 `refundableBatches` / `confirmRefundService` 没改，钱记回当初购买的案件 `holdingRefunds`，Timeline 记「客人到店办退款」），退完这次预约收尾为「仅办理退款」（`autoFinish`，我的判断）；取消退款（`cancelRefundService`）回到对话框。客人页印尼本地持有批次：可退的（未使用 / 部分使用，非套餐 / 赠送 / 置换）每行［退款］（`openHoldBatchRefund` → 同一个退款弹窗预选那批，没有当前案件时只记购买案件和客人 Timeline）；韩国持有没有。
- 测试：新增 R139a（编号）、R139b（退款三处）；因有意改动更新 D18（-1 → 两位一天一个号）、R135a C（取消的号不再重用）。

## CMD-1026-14 补充（2026-10-26，追加；只改 KR；旧文字保留作历史）
- 分支 feature/case-structure-v2，接在 CMD-1026-13（5f06186）之后，单个提交，**未推送**，数据版本不变（56）。
- **一 复诊评估待办点不进去的原因**：CMD-1026-10 的 `krRevisitKidRows` 把复诊评估子记录当一行交给待办，待办的 `goCase` 用的是子记录 id 调 `krShowCase`；而 `krFindCase` 只在 `krAllCases()`（只有主案件）里找，找不到 → 页面不开。同时发现复诊 tab 的［打开复诊评估］（`krOpenCase(子记录)`）同样打不开，且就算找到，`krRenderCaseDetail` 旧页头里有个没定义的 `c`（子记录页一直会报错）。修：待办 `goCase` 对子记录行改成进**主案件**复诊 tab 并展开那一笔（`krShowCase(..., {tab:'revisit', flow:'revisitN'})`，`todoKidFlowKey`；地址参数 `&flow=`、`krApplyAt` 也认）；`krFindCase` 找不到时用主案件那一行补出子记录行（［打开复诊评估］能开）；旧页头补 `var c = r.c`。
- **二 联络 IN 提醒**：`pcdue`（术后管理已过建议日期）、`today` 里「客人还没到：联络 IN 确认行程」在韩国行程已结束（`c.krTripEnded`，KR 按的或 IN 到访自动结束）后不再出现；`pcb`（安排术后管理）同样不出现。**出现两次的原因**：每一笔过期的印尼术后管理各推一条，而待办 key = `kind|案件id|`（带案件时不含文字），两条 key 相同；现在同一案件合成一条（文字列出全部、天数取最大）。
- **三 ［已处理］**：只给提醒联络类（`it.ack`）：`pcdue`、「客人还没到：联络 IN 确认行程」（施术日 / 术后到店 / 持有预约各一种）；做事类（发送诊疗方案、等院长上传、确认评估时间 / 结果、被催办、确认施术时间…）没有。待办栏有提醒行时多一列（`.has-ack`），按了弹小窗（备注选填，`todoAckOpen` / `todoAckSave`），记在案件 `c.todoAcks[ackKey]={by,at,note}`（KR 经 `Store.mutateClinic`）+ 案件 Timeline「已处理提醒：…；备注：…」（类型沟通）。**不会重新出现**：`ackKey` 按「这一件事」——`pcdue|行id@日期,…`（只压这几笔；有新的过期行 / 日期改了 = 新的事，会再出现）、`arrive|日期|时间`（只压那一次到院）；不按日子，所以第二天（天数变大）不会重新冒出来。
- 测试：新增 R140a（KM1）。

## CMD-1026-15 补充（2026-10-26，追加；只改 IN；旧文字保留作历史）
- 分支 feature/case-structure-v2，接在 CMD-1026-14（460292e）之后，单个提交，**未推送**，数据版本不变（56）。
- **一 页头第三行**：原因——第三行只在 `activeVisitsOf` 里找当天 IN 来访，而 `activeVisitsOf` 只认「带 mainId 的子记录」（`rec.id!==m.id`），升级当天主案件自己的那一天（-01）不在里面，所以落到「下次预约：—」。改（`renderCaseStatusBar`）：主案件自己的今天、`inVisitOf` 状态 arrived、没离店 / 没自动结束 / 没结束 → 「今日进行中：A000020-01（面诊安排 · 本地管理）」+［进入案件］（`openSubcase(主案件, key)`）。没动 `activeVisitsOf`（主案件状态判断照旧）。升级当天的 -01 子案件页（`subTodayTabHtml` 新分支）改用「今日项目 + 剩余项目」两张卡（`inContCardHtml`）：今天买的本地管理项目在「剩余项目 · 本地管理 · 未使用」，［本次使用］［＋添加本地管理项目］可用（原来是只读列表，没有按钮）。
- **二 本地结算付款确认**：`lmSettle()` 校验后弹 `#settle-overlay`（和赴韩定金 / 尾款同一个确认付款弹窗）「确认客人已付款 Rp xxx？」［取消］［确认已付款］（`lmPayCancel` / `lmPayConfirm`，原结算主体拆成 `lmSettleDo`）；取消 = 购物车保留、什么都不记。入口清单：所有本地购买的［结算］都经 `localPurchaseHtml(c,'lm')` → `lmSettle`（页头［添加本地管理］、子案件页［＋添加本地管理项目］弹窗、本地管理 tab 的选购 / 继续选购 / 使用后追加购买）；不面诊的本地案件（scope main）和赴韩方案里的本地项目、［追加］走 `confirmProjectSelection` / `confirmAddition` → 结算单 → `settleProjects` 的［确认付款］，本来就有确认。
- **三** 在韩期间弹窗［先空着］→［出发前再确认］，说明文字「可以先空着」→「可以点［出发前再确认］」（`calalign.js`）；其他「先空着」：只有 `data.js` 的一条代码注释，画面上没有。**四** ［打印］放到赴韩 tab「施术日期」卡（subStatusRow 那张）右上角（`krProcedureTabMain`，`position:absolute`）。**五** IN 术后管理 tab：韩国 + 印尼都有才出现胶囊「在韩术后｜印尼术后」（`IN_PC_CAP` / `setInPcCap`），默认韩国行程没结束 → 在韩术后，已结束 → 印尼术后；只有一边有就照旧。子案件页 / 项目汇总 / KR 没动（`inPostcareTabHtml` 只有这个 tab 用）。
- 测试：新增 R141a；selftest.js 在 `lmSettle` 外包了一层自动点［确认已付款］（`ST.lmSettleRaw` 是原函数，`GMC_LM_PAY_MANUAL` 关掉自动），所以 D28 / D30 / D31 / CP1 / R138a 的断言没改。

## CMD-1026-16 补充（2026-10-26，追加；只改 IN；取代 CMD-1023-03 P4 / CMD-1026-15 里 -01 子案件页的到访 tab 去主案件按钮、只读列表，旧文字保留作历史）
- 分支 feature/case-structure-v2，接在 CMD-1026-15（0285824）之后，单个提交，**未推送**，数据版本不变（56）。
- **一** 子案件页（`subTabListOf`）：这一天有面诊（`ctx.v.types` 含「面诊安排」且 `consultRequested`）才有「面诊」tab：到访｜面诊｜今日项目｜结算｜附件｜Timeline；内容 = 主案件面诊 tab 同一个 `consultTabHtml`（同一份资料，［邀请室长商谈］［查看方案］规则照旧，操作都在这里；升级当天 -01 和「继续面诊」那天都一样）。**二** 升级当天（主案件自己那一天）今日项目 tab：今日项目 → 今日确定的赴韩项目（`todaySureKrHtml`：这一天付定金那批的施术项目 + 定金已付 + 施术日期 / 待确认，只看，带去赴韩 tab 的小链接）→ 剩余项目（`inContCardHtml(c, mid)`）；客人离店 / 过了那天 → 三块仍在、只读（`inContModel` 的 `ro` 加「主案件自己那天已过」；`subTodayTabHtml` 分支不再限「今天」）。**三** 到访 tab 拿掉「去主案件看」和［基础资料 →］［面诊内容 →］。**四** 子案件页（`SUBVIEW[主案件]`）不显示页头第三行「今日进行中」（只放主案件页）；`openCaseDetail(sub/tab)`、`closeSubcase`、`subGoMain` 里补调 `renderCaseStatusBar`（原来进 / 出子案件页状态栏不重画）。
- 测试：新增 R142a；R119a 到访 tab 断言改（原：连回主案件基础资料 / 面诊内容 → 现：不再有）。

## CMD-1026-17 补充（2026-10-26，追加；只改 IN 子案件页，KR 子案件页不动；取代 CMD-1026-12 / 16 里子案件页「今日项目」tab 和「今日项目 / 今日确定的赴韩项目 / 剩余项目」三卡的放法，旧文字保留作历史）
- 分支 feature/case-structure-v2，接在 CMD-1026-16（335f708）之后，单个提交，**未推送**，数据版本不变（56）。
- **子案件页 tab 照这一天发生的事**（`subDayTabs` / `subTabListOf`；`subTabBodyHtml` 出内容；`subDefaultTab` 默认：术后管理 > 复诊评估 > 面诊 > 本地管理 > 赴韩项目 > 赴韩施术 > 在韩管理 > 到访）：到访｜面诊｜赴韩项目｜赴韩施术｜复诊评估｜术后管理｜本地管理 / 在韩管理｜结算｜附件｜Timeline，没发生的不出现，**没有「今日项目」tab**。IN 的天：面诊（这天有面诊）/ 赴韩项目（`todaySureKrHtml`：这天付定金那批，**按付定金那天**，不是主案件自己那天）/ 复诊评估（`revEvalTabHtml`）/ 术后管理（有术后管理或今天要做的）/ 本地管理（`subDayHasLocal`：这天买或用了本地项目）；韩国那天（IN 看 KR，全部只读，`subKrReadonlyHtml` / `subKrSurgHtml`）：赴韩施术（施术日期、院长评估结果、尾款、施术项目状态）/ 术后管理 / 在韩管理（按那天行的类型）；有付钱才有结算（本地购买也算，`subSettleTabHtml` 列 `localMgmt.batches`）。内容：术后管理 tab = 「今天做的术后管理」（［操作完成］［本次不做］）+ 预约中（［修改时间］）/ 未预约；本地管理 tab = 「今天用的本地项目」+ 剩余项目（未使用项目，［本次使用］［＋添加本地管理项目］）；`inContTodayHtml(c,M,kind)` / `inContRestHtml(c,M,kind)` 加 kind（'care' / 'local'）筛选。客人离店 / 过了那天只读（`inContModel` 的 ro）。入口：没有本地管理时［添加本地管理］在页头（复诊 / 继续子案件页也恢复显示，调 `inAddLocalProject`），有了本地管理 tab 后页头按钮消失、入口在 tab 里，不会同时三个。「当天推进的流程」连结行拿掉（tab 取代它）。无业务 tab 的天只有 到访｜（结算）｜附件｜Timeline，默认打开到访。
- **B 线编号确认**：11/30 只面诊（一般案件，没号）→ 12/03 继续面诊 + 付定金：`joinMain` 先 `dayNoSync` 升级补 -01 给 11/30，12/03 = -02（R143a 验证）。
- 测试：新增 R143a（四种日子）；R119a（tab 列表 / 今日项目 / 流程连结）、R141a、R142a 的断言按新 tab 改（原：到访｜面诊｜今日项目｜结算… → 现：到访｜面诊｜赴韩项目｜本地管理｜结算…）。

## CMD-1026-19 补充（2026-10-26，追加；A 取代 CMD-1025-04 D / CMD-1021-04 一二里预约弹窗的时间下拉（原来 06:00–23:30 全列）和红框只有「改日期」；B 取代 CMD-1026-18 查出来的各处「一天」读法，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 **38b14aa**（CMD-1026-18 只查不改，没有提交），单个提交（见 Notion 汇报），**未推送**，数据版本不变（56）。
- **A（只改 KR 预约弹窗）**：`krCbValidTimes(date)` = 那一天营业时间内可约的半小时格（营业开始 → 关门前一格，避开午休、半天休诊的休诊部分；休诊日 = 空），组里和红框里的时间下拉都用它（`krCbTimeOpts`），不再列营业开始前 / 关门后 / 午休；`krCbSnapTime`：原来选的时间在这一天不可约（改日期 / 默认值落在营业时间外）→ 自动带到最近的可约时间（平手取较晚），所以不会再出现「改了时间 → 整组进红框」；红框（`.krcb-prob`）里 `ck.fix==='time'` 的项目（院长时间冲突 / 营业时间外）多「改时间」下拉（同一天一个时间，`krCbSetDay`）和院长下拉，改好后自动回到对应日期的组并勾上；红字写原因 + 该改什么：休诊日「…是医院休诊日，不能约，请改日期」、营业时间外「12/11 营业时间 11:00–19:00，10:30 不能约，请改时间」、离境后「客人 MM/DD 已离境，请改日期（改到离境前）」、院长冲突「…，请改时间或换院长」。午休不再有选项（原来的「午休确认」逻辑留着没触发）。
- **B1 一天的统一读法**（data.js，只统一读不改存放）：`dayStateOf(m, v)` / `daysOf(m)`（= `visitsOf` 每一天 + `kind` IN/KR + `state` waiting/arrived/left/ended/cancelled/noShow + `live` + `inProgress` + `reached`）；`activeVisitsOf` 改读 `daysOf`（认得主案件自己那天和韩国到院）；`mainOngoingOf` 里只数 IN 子记录（不重复算）；`visitStateText` 经 `dayStateOf`；`careTodayKey` 认主案件自己那天；`inVisitOf` 去掉 `|| c.hasArrived`（KR 到院不再被当成 IN 已到店）；`mainAttentionOf`：IN 看列表，今天客人在韩国到院 →「今天在韩国到院…」，主案件自己那天算「今天来访」。IN 主案件页头第三行（`renderCaseStatusBar`）读 `daysOf`：韩国到院日 →「今日进行中：A000020-02（赴韩施术 · 韩国）［查看内容］」；升级当天 -01 离店后不再写进行中。
- **B2 00:00 自动结束**（`visitSweep` 加两段）：升级后的主案件自己那天（到店后过了 00:00 → `autoEnded` + `leftStore`，Timeline 记，面诊 / 复诊评估没出结果的流程不受影响）；韩国**非施术日**的到院（客人到过、没有待付款项目）→ `coreEndSubVisit(…, '系统', …)`，没做完的回到未预约。**韩国施术当天不自动结束**（= 替室长按［客人已离院］，会设 `krProcedureDone` / 进术后管理阶段，动到主线，写进汇报等用户决定）。只在 IN 页面的 5 秒扫描里跑（KR 页面没有扫描）。
- **B3 用词**：IN tab「赴韩」→「赴韩施术」；对话按钮 IN「发起对话」/ KR「💬 对话」→「对话」；项目卡 / 子案件页分段「未使用」→「未预约」（KR 施术 / 管理项目卡、子案件页「未预约项目」「本地管理 · 未预约」）；删除没有入口的 `inCareCardsHtml`（「已预约」旧写法）；KR 术后管理不加胶囊。**B4** IN 页头名字行加「访问：N 次｜面诊：N 次｜施术：N 次」（`caseCountsOf`，KR 页头同函数）：我的判断——访问 = 这个主案件下 IN + 韩国实际到过的天数（不含取消 / 未到店 / 还没到）。**B5** IN 赴韩施术 tab：施术日期 + 到达 / 离开 + 建议在韩停留合成一张「赴韩日程」卡（`inStayInnerHtml`），右上［打印］［修改］；原有按钮照旧放卡里。**B6** `flowMarkOf('postcare')`：韩国和印尼的术后管理都做完（`pendingCareOf` 空且没有未预约名额）才 ✓，不再要求 `krTripEnded`，IN / KR 同一个函数。
- 测试：selftest 新增 R144a（A1）、R144b（KM1，pcStage 夹具）；因这次有意改动而更新（改前 → 改后）：R141a / R138a（「未使用项目」→「未预约项目」）、R141a（［打印］在施术日期卡右上 → 在赴韩日程卡右上）、R126b（施术日期 → 客人赴韩日程 两张卡 → 一张「赴韩日程」卡）、R118a（tab「赴韩」→「赴韩施术」）、R110a（不再断言没有「赴韩施术」tab）；删掉依赖已删函数 `inCareCardsHtml` 的断言（R58a / R59a / R60a 里 4 处）。**这次测试用无头 Chrome（Chrome 的无头模式 + CDP，脚本在 /tmp，不在项目里）**：内置浏览器窗格后台时 setTimeout 被节流，长批次会卡住；同账号开两个分页还会弹「已在另一个分页打开」遮罩挡住测试。

## CMD-1026-20 补充（2026-10-27，追加；取代 CMD-1026-19 B2 的「00:00 自动结束」和 CMD-1023-01 S6 里 IN 子记录的 00:00 自动结束，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 **c3e3cac**，单个提交（见 Notion 汇报），**未推送**，数据版本不变（56）。用户确认过的「结束」主线改动，直接做。
- **一 00:00 = 关账（锁住那一天），不是自动结束**（data.js 末尾「CMD-1026-20」一段）：`inDayLocked(c)`（IN：到店后日期 < 今天、没按离店、没确认结束；子记录 / 主案件自己那天 / 一般案件都算）、`dayLockedKR(c, key)`（KR：`'main'` 施术当天已到院没结束 / `'KR|日期'` 其他到院）现算，没人开页面也成立；`visitSweep` 只负责记一次 Timeline「00:00 关账」（`c.dayLockedAt` / `m.dayLocks[key]`），不再设 `autoEnded` / 离店 / 结案。状态「待确认结束」：`dayStateOf` 新状态 `unconfirmed`（`daysOf` 的 `live` 包含它，`mainOngoingOf` 加一条 `unconfirmed`，所以主案件不会算已完成）、`visitStateText`。锁住的内容：IN = 本地项目选购 / 使用 / 操作完成 / 本次不做 / 术后管理做完 / 继续选购（`inLockGuard`，`inContModel().ro`）；KR = `coreSubDone` / `coreTodayDone` / `coreSurgItemDone` / `coreTodayPick` / `coreAddOnItem` / `coreAddOnPaid` / `coreSettleBalance` / `coreUnitUseNow` / `coreMgmtUse` / `coreEndVisitToday` / `coreEndSubVisit`（`krDayDeny` → `window.KR_DAYLOCK` → `krMut` 弹「这一天已关账」）。**不锁**：面诊报告 / 复诊评估报告、定金 / 结算单的赴韩项目付款（只锁本地项目的收款：`lmSettle` 等走 `inLockGuard`）、对话、附件。页头：IN `renderCaseStatusBar` 外面包了一层，锁住时最上面加「🔒 …待确认结束 ［确认结束］」；主案件页第三行「待确认结束：MM/DD A…［确认结束］/［查看内容］」；KR `krTopAlerts` 加红条。
- **二 第二天提醒主跟室长 + 确认结束**：IN 主跟 = 按［客人已到店］的室长，存在 `c.leadIn = {name, id, at}`（`markArrived` 里没有才写；`leadInOf(c)`：主案件的优先 → 旧案件取第一条「标记客人已到店」的操作人 → 案件负责室长 `inCoordinator`）；KR 主跟 = 现有的 `krCoordinator`（`krLeadOf`）。待办 `dayconfirm`（`TODO_CAT`，IN `inTodoItems` 最前面、KR `krTodoItems` 的 `work` 块里）：「MM/DD A… 还没结束，请确认」，`mine` = 主跟是我 或 主跟今天 OFF（`dayConfirmMineIn` 用 `isOffOn`；`dayConfirmMineKr` 用医院 `offs` 的 coord 整天 OFF），所以主跟 OFF 时其他室长在「只看我的」里也看得到、谁处理都行；点了进确认弹窗。IN 确认弹窗 `openDayConfirm` / `dayConfirmGo`（`#dayc-overlay`）：术后管理 / 本地项目逐项「用了 / 没用（退回未预约，本地项目次数归还持有）」；没付的钱：本地批次［补收款］（走原来的付款窗）/ ［取消该项目］，**还有没付的钱不能确认**（提醒不消失）；确认后 `c.dayConfirmed` + 子记录 / 升级后的主案件记 `leftStore`（`confirmed:true`），子记录没有未处理款项且主线不在进行时照旧结案，Timeline 记「确认结束：用了… 没用… 钱…」。KR 确认弹窗 `krDayConfirmOpen` / `krDayConfirmGo`（`#kr-dayc-overlay`）：施术项目只能选「已完成」或「没做」——已完成 = 项目标 done；没做 = `coreTodayCancel`（回项目卡）+ **这个施术关联的术后管理（`projectName` 相同的行）一起 `coreRowCancel` 回未预约**；管理项目已完成 / 没做；未付款项目要先去项目卡付款或取消购买，才能确认。全部确认后：有施术做完 → `coreEndVisitToday`（客人已离院，**术后管理阶段此时才开始，不自动进入**）；施术都没做 → 回到「施术时间已确认」（`hasArrived=false`，请改日期 / 取消项目走原来的流程）；非施术日到院 → `visitEndedKeys`。Timeline 记「确认结束 韩国到院 MM/DD：做了… 没做（退回）… 钱…」。确认弹窗里的操作用 `window.DAYCONFIRM_BYPASS` 绕过锁。
- **三 上一天没确认，不能接待下一天**：IN `markArrived` 先 `dayConfirmBlockFor(c)`（同一个客人、本诊所全部案子里还待确认结束的 IN 天）；KR `coreMarkArrived` / `coreVisitArrive` / `coreSubArrived` 先 `krUnconfirmedOther`（同一个客人、本医院全部案子里待确认结束的韩国天）；被拦时弹「请先确认 MM/DD A… 的结束」+［去确认］（`dayConfirmBlockModal`）。我的判断：IN 和 KR 各自算（IN 的天不拦 KR、KR 的天不拦 IN）。
- **四 午休可强约**（取代 19 A1 的「午休不列」）：`krCbValidTimes` 把午休时间列回来（`krCbTimeOpts` 标「（午休）」，option 的 value 是时间），确认预约时跳「这是午休时间，确定预约吗？」（`krCbGo` 的 `krCbIsLunch`，沿用原来的逻辑，文字改成任务要求的）；营业时间外 / 休诊日仍不列。选下拉当下不跳确认，只在点［确认预约］时跳（和原规则一致）。IN 没有同样的时间下拉，没改。
- **交接备注（后端）**：原型里 00:00 记录要有人开着 IN 页面（`boot-in.js` 5 秒扫描）才会写 Timeline「00:00 关账」，KR 页面不扫；锁住和待办是现算的，不依赖扫描。正式版：由后端排程在每天 00:00（页面时区）给没结束的天记「关账」状态 + 生成待确认提醒；锁住 / 解锁 / 确认结束的校验放在后端接口里，不要只靠前端判断。
- 测试：新增 R145a（A1）、R145b / R145c（KM1，stageC / pcStage 夹具）；改了 R144a（④ 自动结束 → 关账）、R112a（子记录 00:00 自动结束 → 关账 + 待办 `dayconfirm`）、R144b（午休现在列出）、R78a（用例要测「今天」的到院，到院日订完行后改成今天）。**测试用无头 Chrome + CDP（脚本在 /tmp）**。

## CMD-1027-01 补充（2026-10-27，追加；取代 CMD-1026-20 里非施术日子案件页［客人已离院］在今日卡里、CMD-1025-04 里升级案件面诊 tab 的报告展开 / ［查看方案］，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 2aa9d21，单个提交，**未推送**，数据版本不变（56）。
- **A（只改 KR 非施术日子案件页，kr.js `krSubPageHtml`）**：［客人已离院］放在页头那一条最右边（`krEndBtnHtml`，今日卡里不再放，`cd.noEnd`；关账锁 / 未确认规则不变）；今日项目卡右上［增加今日项目］（`krDayAddToggle`，`KR_DAYADD[案件|天]`），项目卡平常不显示，按了才展开，［本次使用］成功后自动收起（`coreUnitUseNow` 成功设 `window.KR_USED_NOW`，`krMut` 里清 `KR_DAYADD`）；［预约时间］［修改时间］［全部预约］展开后不变；［今日取消］→［本次不做］（`krTodayCancel` 弹窗和行内按钮，效果不变；Timeline 仍记「今日取消：」，核心函数名不改）。项目卡右上［增加项目］本来就是 Modal（CMD-1021-14 `krAddModalOpen`），没改。**我的判断（待确认）**：在韩加的管理项目付款后进「未预约」持有，不会直接进今天，需要再按［本次使用］；非施术日页面里加施术项目则沿用原规则（进当天施术行 / 冲突时选「不在这个时段」放未使用），这次没改主流程。
- **B（只改 IN，升级后的主案件和子案件面诊 tab；一般案件不动）**：`consultTabHtml` 在 `isUpgraded(mainOf(c))` 时走 `consultReportV2Html`：面诊卡不变；报告卡（提交：日期，KR 室长；面诊摘要 + 「AI 翻译」标签；唯一按钮［完整报告查看］ → `openFullReport` Modal `#rptfull-overlay`：完整报告 + 原文切换 +［下载］［打印］［关闭］）；可选范围卡（取代［查看方案］：`krScope.items` 的项目名 / 说明（麻醉、推荐在韩、术后管理）/ 价格 Rp（₩）/ 已选、已选 · 已取消、未选灰色；只列面诊时院长定的，不含在韩加项；小链接「看进度 → 赴韩施术」`consultGoKr`）；拿掉［查看方案］、整份报告展开 / 折叠、报告卡［下载］［展开］。
- 测试：selftest 新增 R146a（KM1，pcStage 夹具）、R146b（A1）。

## CMD-1027-02 补充（2026-10-27，追加；只改 KR 为主，第 3 项 IN + KR；取代 CMD-1025-03 里 KR 状态列「一句话 + 一个按钮」和 CMD-1021-09 里整体备注「离开输入框就存、结束时一起存」，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 **981f35f**（CMD-1027-01），单个提交（见 Notion 汇报），**未推送**，数据版本不变（56）。
- **一 ［行程修正］**（kr.js `krStayFixOpen/Save`，data.js `coreStayFix`）：KR 主案件页头和施术当天页头「在韩 …」后面放［行程修正］（KR 室长；院长无）→ 弹窗改到达 / 离开日期时间 + 更正原因（必填）；确认后 `c.stay` 更新、Timeline「行程修正：旧 → 新；原因」、IN 收通知「X 的在韩期间已改为 …（原 …），原因：…」。**没有拿掉「韩国行程结束」卡**（`krTripCardHtml`）：拿掉会让「离开日期没填、客人也不来 IN 店」的案件永远结束不了，也会让「韩国行程是否结束？」待办没有可按的地方——这是任务要求的停下来写汇报的情况，等用户决定。KR 端本来就没有「在韩期间」的［修改］入口（只有 IN 有 `openStayModal`），不用整理。
- **二 状态卡两行**（`krMainStatusBar`）：第一行「当前状态（进行中 N｜预约中 M）」+［查看］→ 子案件 tab（N / M = `daysOf` 里 arrived·unconfirmed / waiting 的天数，不含取消 / 未到）；第二行三选一：今天有来访 →「今日到访（业务）进行中 / 已完成 / 待到院」+［查看内容］；之后有 →「下次到访（业务）MM/DD」；都没有 →「后续日程：无」。原来的状态标签不再放；还没有任何到访（面诊 / 付定金阶段）时第二行沿用 1025-03 的阶段句子（`krMainNextInfo`），我的判断。
- **三 子案件 tab 四段**（data.js `daySectionsOf` / `daySectionHeadHtml`，IN `visitsTabHtml` + KR `krTabVisits` 共用）：进行中（今日：arrived + 待确认结束）｜已预约（waiting 且日期 ≥ 今天）｜已完成（left / ended）｜已取消（cancelled / noShow / 已过期没到的 waiting，灰色、含未到）；空段不显示；栏位不变，点行进那天。
- **四 整体备注［保存］**（`krVisitMemoHtml` / `krVisitNoteSaveBtn`）：整体备注后面［保存］，存了显示「✓ 已保存 时间」，可再改再存；离开输入框仍自动存草稿（避免重画丢字），所以离院时没按［保存］的内容也在（我的判断：自动存）；`coreVisitNoteDraft` / `coreItemNote` / `coreSubNote` 在客人已离院（`noteVisitEnded`）或 00:00 关账（`dayLockedKR`）后拒绝，项目备注输入框同样变只读。旧说明「按［结束今日到院］时一起存」拿掉。IN 子案件页没有整体备注，没动。
- 测试：新增 R147a（A1）、R147b（KM1，pcStage 夹具）；因这次有意改动而更新（改前 → 改后）：R125a / R47a 状态列「状态标签 + 一句话」→ 两行状态卡；R73a「没有［保存］」→「有［保存］」。

## CMD-1027-03 补充（2026-10-27，追加；只改 KR；取代 CMD-1021-13 三「付清尾款后在韩加施术进未使用」、CMD-1022-14 / 1015-30 里项目卡的［本次取消］［本次使用］给施术项目，旧文字保留作历史）
- 基准 **98b4107**（CMD-1027-02），单个提交（见 Notion 汇报），**未推送**，数据版本不变（56）。
- **一 结束的日子整页只读**（kr.js `krRoWrap` / `krDayRoState`，包住 `krSubPageHtml` / `krSurgDayPage`）：这天状态是已完成（left / ended）/ 待确认结束（unconfirmed）/ 已取消 / 未到，或施术当天 `krProcedureDone` → 页面里所有按钮（除页内导航白名单 `KR_RO_OK`：tab、回到主案件、查看案件、折叠、项目卡分页…）灰掉并写 title「这一天已结束，只能看」，输入框 / 备注 / 文本框禁用，最上面一行提示；待确认结束的提示说要用页头的［确认结束］（红条不在页内，仍可点）。**其他日子的预约（例：12/04 页对 12/11 的［修改时间］）也一起灰掉**（我的判断：整页只读，要改去主案件或那天的页）。**例外**：今天刚结束的到院卡上的［增加项目］（21-11 的重开入口，00:00 前）保留。
- **二 ［增加项目］只增加管理项目**：项目卡右上弹窗（`krAddChooser(c,'ad')`）没有施术 tab，只列管理项目，写「施术项目只能在施术当天的项目方案里增减」；Step 2 / 3-2 / 3-3 的选择区（`sk` 为 adj 等，项目方案阶段）仍可加施术；核心 `coreAddOnItem` 在 `krBalancePaid`（付清尾款后）拒绝非管理项目（`KR_DENY_MSG` → `krMut` 里 `krBlock` 弹提示），自测里 `window.GMC_ALLOW_POSTADD=true` 放行（旧用例靠付款后加施术造数据；R148a 里关掉测真规则）。
- **2b 施术项目没有［本次使用］［本次取消］**：`krProjCards` 的 `useBtns0` 对施术项目不出这两个按钮（只剩［预约时间］），「预约中」里在韩加的施术行也不再有［本次取消］；管理项目 / 术后管理的［本次取消］全站改名［本次不做］。**埋线双眼皮（Disey D · A000021）的来历（读代码推断，没法看用户数据）**：行 `kind:'增加项目'` + `projectName`、项目 `krAddOn:true`（付清尾款后加的，走的是项目卡右上［增加项目］，不是项目方案的调整方案——调整方案加的带 `preBalanceAdd`）；预约时间只有日期，是因为这种行没有时间（`open.time` 为空，只显示 `krShortDt(date, '')`）；它走「增加项目」行的流程，不是施术子项（没有术前照片、施术完成会生成的术后管理是按项目默认资料 `postcare` 带的，但没有 `surgUse` 行）。改完第 2 项后不会再从这个入口加出来。
- **3（只写汇报）卡住的原因**：已完成的日子上买的新施术在 1021-13 之后进「未使用」（`deferUse`），客人再约时间走施术项目的［预约时间］（`krBkdOpen('use')`）建 `surgUse` 行，行挂在原来那一天的到院卡上、日期用的是预约的 12/11，所以出现「挂在旧日子 + 12/11 13:00」；［修改时间］灰掉是因为该行 `arrived` 或这一天的页已结束。改后：付清尾款后不能再加施术；结束的日子页整页只读，不会再产生这种行。用户数据里卡住的那笔不用修（按指示没动）。
- 测试：新增 R148a；因这次有意改动而更新：R30b / 项目卡预约中断言［本次取消］→［本次不做］；R21a / R22a / R23a / R24a / R26a / R51a / D26 靠付款后加施术造数据 → 自测默认放行（`GMC_ALLOW_POSTADD`）。

## CMD-1027-04 补充（2026-10-27，追加；取代 CMD-1027-02 里「保留韩国行程结束卡」、CMD-1021-16 / 1026-02 C1 里「第二天提醒 KR 室长去结束」，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 **9e064fe**（CMD-1027-03），单个提交（见 Notion 汇报），**未推送**，数据版本不变（56）。第 1 项是用户确认过的「结束」主线改动。
- **一 韩国行程结束**（data.js 末尾 `tripAutoByDateDue / coreTripAutoByDate / tripAutoSweep / coreTripEndManual / reopenTripIfNeeded`，kr.js `krStayFixOpen / krStayFixEnd`）：KR 主案件页「客人的韩国行程［韩国行程结束］」卡拿掉（`krTripCardHtml` 留着不调用）；**过了离开日期（离开那天的第二天 00:00 起，`todayStr() > c.stay.out`，现算）→ 自动结束**（`coreTripEnd` 的 `auto + byDate`，效果同原来按结束；不自动取消剩下的预约 / 项目，列在通知里；Timeline 记；KR 室长 + IN 各一条通知）；IN 到店自动结束（1026-02 C2）不变。**手动只剩两种、都在［行程修正］弹窗里**：离开日期没填 → 下半部「客人已离境，结束韩国行程」（原因必填，`coreTripEndManual`，通知 IN）；日期填错 → 把离开日期改到今天或以后 / 清空 → `reopenTripIfNeeded` 行程重新打开（拿掉 `krTripEnded`，KR 又能建到院 / 增加项目，案件阶段重算，因结案的回到进行中；**已转去印尼的术后管理保持在印尼、已留在韩国持有的项目保持持有，不收回**；Timeline 写明）。页头「在韩…」旁结束后显示「韩国行程已结束」小标签。待办「韩国行程是否结束？」**只在离开日期没填时**出现（`tripAskWhy`：填了离开日期一律返回空），点了打开［行程修正］；**1026-02 C1「离开日期第二天提醒」拿掉**（被自动结束取代）。扫描 `tripAutoSweep` 挂在 `todo.js` `tripAutoTick`（启动 1.5 秒后 + 每 30 秒；IN 页扫本诊所，KR 页扫各来源诊所），**原型里要有人开着页面才跑；正式版由后端每天 00:00（页面时区）排程**。
- **二 IN 页头第三行认不出「术后管理 tab 约的今天预约」的原因**：从术后管理 tab /「未安排预约」［预约］约出来的印尼预约，客人到店之前是一个独立的预约案件（`careFor` 指向主案件、还没有 `mainId`，`joinMain` 要到店确认继续才给），而 `visitsOf` 只认带 `mainId` 的子记录 → `daysOf` 读不到 → 第三行「下次预约：—」。修：`visitsOf` 里把 `careFor.caseId===主案件` 且没取消的预约案件先当一天（types 术后管理）；到店 `joinMain` 后走子记录那条，不重复。第三行写「今日预约：HH:mm（术后管理）」，到店后变「今日进行中」；子案件 tab、KR 状态卡第二行、客人页正在进行案件都读 `daysOf`，一起好了。
- **三 IN 项目卡「在韩管理（1）」点开是空的的原因**：胶囊数字 = 全部没取消的管理项目，列表只放「预约中 / 未预约」两段，次数用完的项目有数字没内容。修：`inProjectCardHtml` 先算好两段（`mgBooked / mgUnbooked`）再数，数字 = 列表里实际出现的项目数（用完的在「已完成」tab）。KR 项目卡的数字本来就是按行数算的，没有同样问题。
- **四 术后管理那天加本地项目按［结算］卡住的原因**：本地结算新增的付款确认弹窗（CMD-1026-15）`#settle-overlay` z-index 65，被选购弹窗 `#lm-buy-overlay`（z-index 190）盖在下面，看起来按了没反应。修：`lmSettle` 打开时把 `settle-overlay` 提到 100030，`closeSettleModal` 复位。
- 测试：新增 R149a（A1：二三四）、R149b（KM1：一）；因这次有意改动而更新（改前 → 改后）：R128a / R84a 里「离开日期过了 → 提醒（原因 left）」→「不再提醒、改自动结束」，R84a「案件页有［韩国行程结束］」→「没有这张卡」，「离开日期填了也问」→「没填才问」。**R149b 里「剩下的项目没被自动取消」只数 `skipped` 行不数总行数：自动结束按 `coreTripEnd` 原来的规则（CMD-1021-16 起）会把「韩国或印尼」且没约的术后管理转去印尼（建一条 IN 行），这不是取消，是原规则**。

## CMD-1027-05 补充（2026-10-27，追加；取代 CMD-1027-01 B 里 IN 面诊 tab 的「可选范围」卡、CMD-1022-12 B2 / 1022-18 里 IN 复诊评估 tab 的「结果卡 + 查看复诊评估结果」，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 **c893cd5**（CMD-1027-04），单个提交（见 Notion 汇报），**未推送**，数据版本不变（56）。
- **一 复诊评估正式报告**（data.js 末尾 `revReportDocHtml / reportDocFor`）：和诊疗方案同一种格式（GMC NETWORK 抬头、院长签名），**不放照片**。内容 = 客人 / Case ID（子案件号）/ 评估院长 / 医院 / 出具日期 / 关联案件 + 中文翻译（AI 翻译）［看原文］+ 复诊想问的内容（`c.revisitQuestion`）+ 评估项目（`c.followProjects`，每项写整体评估结论）+ 院长评估意见（`c.videoSummary` 译文 / `c.reportKo` 原文）+ 院长建议（`c.revisitRec`：推荐本地项目文字 / 建议赴韩 + 说明；恢复正常写「恢复正常，无需处理」）+ 院长签名。**现有资料里没有、报告里没写的**：每个项目各自的评估意见（只有一个整体结论 + 一段评估文字）、下次复诊时间、注意事项（不为报告改 KR 填写流程）。完整报告弹窗 `openFullReport(caseId, {clinicId, viewer})` 一个组件 IN / KR 共用（`fullReportCaseRun` 在 KR 端用 `Store.withClinic` 取来源诊所分区的案件；标题按类型写「完整报告 / 复诊评估报告」；下载 / 打印读当前显示的原文或译文）。
- **二 KR 报告卡右上［查看报告］**（kr.js `krCardBoxR / krReportBtn / krOpenReport`）：KR 面诊 tab「报告」卡、复诊评估结果卡、复诊面诊的「恢复评估」/「报告」卡；室长和院长同一个按钮函数，没有权限判断；KR 弹窗默认韩文原文（`REPORT_SHOW_ORIG = viewer==='KR'`），有译文可切［看翻译］。
- **三 IN 复诊评估 tab = 复诊卡 + 报告卡**（`revEvalTabHtml` + `revReportCardHtml / revSummaryText / revEvalActionsHtml`）：结果出来后上面复诊卡（状态 / 展开项目卡，照现在）、下面报告卡（提交日期 + KR 室长、评估摘要标「AI 翻译」、右上［完整报告查看］）；原来放最上面的结果卡和「查看复诊评估结果 →」按钮拿掉；IN 后续动作（根据推荐选本地项目 / 另开新案件（建议赴韩）/ 没推荐可让客人离店的提示）沿用，放在报告卡底部（复诊评估原来就没有「已送达客人」之类的状态 / 按钮，没加）；主案件复诊 tab（`flowDetailIn`）结果出来后直接放同一个 `revEvalTabHtml(子记录)`；`toggleRevOpen` 改成重画当前页。结果没出来时照旧。`revEvalResultHtml / revResultOpen` 留着没有入口。
- **四 「可选范围」→「推荐项目」**（`recProjectsRowsHtml / recBuyState`，IN `consultReportV2Html` 和 KR `krAfterBlock` 共用）：栏位 购买情况｜项目名｜术后管理｜价格（最右）；购买情况：已购买（项目在主案件里且对应结算单没有待付款）/ 未购买 / 已取消（买了又取消 / 被更换）；**还没买之前（面诊刚出）全部写「未购买」**；术后管理列写「拆线 × 1（第7天）」（`pcDayText`），没有写「无」；麻醉 / 推荐在韩等写在项目名下小字；KR 价格韩元，IN 印尼盾为主、韩元括号；IN「看进度 → 赴韩施术」保留；KR 卡的［补加可选项目］按钮名没动（任务没说）。「项目确认中」字样从卡片标题拿掉。
- 测试：新增 R150a（A1）、R150b（KM1，pcStage 夹具）；因这次有意改动而更新：R146b「可选范围 / 已选」→「推荐项目」，R97a「建议赴韩补充说明走备注自动翻译 译文 +［查看原文］」→「在报告卡评估摘要（AI 翻译）里，原文 / 译文在完整报告弹窗切换」。R139a 在整套里偶发失败（子案件号重复），单跑新旧代码都通过，与本次无关。

## CMD-1027-06 补充（2026-10-27，追加；取代 CMD-1027-05 里复诊评估报告「项目表每行写同一个整体结论、没有下次复诊 / 注意事项」，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 **f2c8c24**，单个提交（见 Notion 汇报），**未推送**，数据版本不变（56）（新增可空字段，旧资料当没有）。
- **KR 填写**（kr.js `krRvExtraHtml` 挂在 `krRvSubmitBlock` 的发送按钮前，恢复正常 / 需要处理两种结论都有）：逐项评估意见（`followProjects` 每个项目一个必填文本框，`KR_SUB.rvOp[项目名]`，`krRvOpSet`）+ 录入方式和面诊一样（［增加内容（语音）］［增加内容（手动）］= `krRecOpenModal`）+ ［✨ AI 整理（演示）］（`krAiOrganize` 在复诊评估分支调 `krRvOpFill`：演示句「경과 양호하며 현재 부기는 정상 범위입니다.」→ 译「恢复良好，目前肿胀属于正常范围。」，已写了意见的项目不覆盖）；整体结论沿用原来的［恢复正常］［需要处理］；下次复诊时间下拉（无需复诊 / 2 周后 / 1 个月后 / 3 个月后 / 指定日期，`KR_SUB.rvNextType/rvNextDate`，`krRvNextSet`）；注意事项（选填，`KR_SUB.rvNote`）。`krSubmitReport` 在 `rvE` 时检查：缺哪个项目的意见 / 指定日期没选日期 → alert 拦下。**顺带修了一个遗留 bug**：复诊评估子记录没有 `consultKind`，`rv` 为假，发送时会被「至少勾选 1 个项目」拦下，复诊评估其实发不出去；现在 `rv = isRevisitConsult(c) || rvE`。
- **存放**：`c.revisitOpinions=[{name,text,zh}]`、`c.revisitNext={type:'none|2w|1m|3m|date',label,date}`（日期由 `revNextCalc(type,date,base)` 算：2 周 +14 天、1 个月 / 3 个月按月、指定日期照填）、`c.revisitNotes={text,zh}`（`coreSubmitReport` 里写入）。译文用 `krZhShort`（`KR_ZH_MAP`，没有「演示翻译」后缀）；真实翻译 API 之后接在 `krZhShort`。
- **报告**（data.js `revReportDocHtml`）：项目表改 项目｜评估意见（各自的意见，原文 / 译文随开关）；下面「下次复诊：1 个月后（约 MM/DD）」「注意事项」；仍然没有照片。旧资料（没有 `revisitOpinions`）照 05 的写法显示，不补。IN 报告卡摘要 `revSummaryText`、KR 结果卡 `revResultCardHtml` 同样带这三样。
- **IN 预约复诊**（data.js 末尾 `REV_NEXT_LABEL / revNextRowHtml / revBookOpen / revBookSet / revBookRender / revBookGo`）：复诊卡（`revEvalTabHtml`）出报告后一行「院长建议：1 个月后复诊（约 MM/DD）」+［预约复诊］（选「无需复诊」或旧资料不显示）→ 弹窗 `#rev-book-overlay`：日期默认建议日期（遇休诊 / 约满往后找可约日，`slotBlockReason` / `todoCbTimes`），日期时间都可改；超过继续服务 3 个月（施术完成日起算 `surgeryDoneDayOf`）只在弹窗里提示，不改规则；确认 → `createReservationCase(…,'复诊评估')`（同一天已有预约则合并，`pendingResvSameDay`），新预约带 `revisitFor={caseId:主案件id, evalId}`；行变「已预约复诊：MM/DD HH:mm」，预约取消后回到［预约复诊］。**不自动预约、不生成待办**。`revisitFor` 没有复用 `careFor`（`inCareBooking` 把空 `careFor.keys` 当「术后管理都约了」）；`visitsOf` 把它算作一天（类型复诊评估）；`followupAsk` 客人到店时默认选「继续之前的服务 → 复诊评估 + 这个主案件」。
- 测试：selftest 新增 R151a（A1：报告 / 摘要 / 旧资料 / 预约复诊全流程）、R151b（KM1，pcStage 夹具：表单 / 必填 / AI 整理 / 发送 / 报告）。

## CMD-1027-07 补充（2026-10-27，追加；取代 CMD-1027-06 里「［预约复诊］日期超过 3 个月只在弹窗黄字提示、到店仍按现有规则不能继续」，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 **d0677a1**，单个提交（见 Notion 汇报），**未推送**，数据版本不变（56）。用户确认过的「3 个月继续」规则改动，只改下面范围。
- **规则**：院长建议的复诊（由 ［预约复诊］ 建的预约，带 `revisitFor` 关联主案件）算在原主案件，不受「施术完成日起 3 个月」限制。`joinWindowOf(src, type, visit)` 加第 3 个参数：`type==='复诊评估'` 且 `visit.revisitFor.caseId` = 该主案件 → 直接 `ok`（`advised:true`）；`fuAvail` 的复诊候选、`contConfirm` 的复诊检查都把当前来访 `c` 传进去；`resumeCandidates` 里 `revisitFor` 指向的主案件一定是候选（就算韩国行程没结束 / 没完成）。因此客人按这笔预约到店：第一个对话框「继续之前的服务」可选、默认选好并带出该主案件、复诊评估默认勾（`followupAsk` 对来访目的「复诊评估」本来就读 `revisitFor`），确认后 `joinMain` 成为子案件（编号一天一个号），评估送 KR 照旧。［预约复诊］弹窗（`revBookRender`）黄字警告换成一行「院长建议的复诊，会算在原主案件里（不受 3 个月继续限制）」。改期（`visitDate` 变）关联不丢；预约取消 / 未到 → `revBookingOf` 忽略已取消的，回到［预约复诊］，重约同样带 `revisitFor`。**不在范围的照旧**：没有 `revisitFor` 的来访（客人自己走进来、不是［预约复诊］建的）超过 3 个月仍然不能继续（`joinWindowOf` 不带 visit → 照旧；开新主案件轻关联 `followupAskNewLight`）。
- **主案件已完成时**：没有额外代码——子记录 `joinMain` 后 `mainOngoingOf` 把这笔来访（IN 子记录、arrived / waiting）算进行中的事，`mainAutoStatus`（`updateCaseStage` 末尾 + 5 秒扫描）调 `reopenMain` 回到进行中；做完（子记录离店 / 结束、评估出结果、没有别的未完成）后 `mainAutoComplete` 的条件满足再回已完成（仅限「韩国行程已结束、停在术后管理 / 赴韩阶段」的老路径，没改）。
- 测试：selftest 新增 R152a（A1：弹窗无警告 / 3 个月前提 / 对这笔预约通过其他来访仍超期 / 改期 · 取消 · 重约关联不丢 / 到店默认继续 + 复诊评估 + 原主案件 / 子案件号 / 已完成主案件回到进行中 / daysOf / 对照自己走进来仍不能继续）、R152b（KM1，pcStage 夹具：超过 3 个月的复诊送 KR 后待办 + 复诊 tab）；R151a「3 个月提示」断言改成「没有警告、有一行院长建议说明」。**测试教训**：夹具里原主案件 / 第一次复诊评估的来访日期都是「今天」，会和这次到店被 `visitsOf` 合成同一天，测试里要先把它们的日期改成 140 天前。

## CMD-1027-08 补充（2026-10-27，追加；取代 CMD-1027-07 判断 1 里「主案件自动完成只对韩国行程已结束且停在术后管理 / 赴韩阶段的生效」、CMD-1026-20 里红色条在主案件页也显示、CMD-1027-03 里「这一天已结束，只能看…」提示行，旧文字保留作历史）
- 基准 **b1c23b1**，单个提交（见 Notion 汇报），分支 feature/case-structure-v2，**未推送**，数据版本不变（56；新增可空字段 `reopenedAt`）。第 1、3、6 项是用户确认过的主线改动。
- **七 IN「赴韩施术」tab 点不进去的原因**：不是 1026-19 改名；`switchCaseTab` 设了 `c.activeCaseTab='kr'`，`renderCaseBody` 里先调 `normalizeCaseTab`，它仍是旧版判断（`t==='kr' && !showKrTab(c)` → 弹回基础资料）。V2 的 tab 列表（`caseTabListOf`）只要「showKrTab 或赴韩项目 origin===KR」就列「赴韩施术」，两边出现条件不一致：赴韩项目已有但 `settlementDone`/`projectsEnabled` 不成立的案件（Fiona F）tab 有、点了被弹回。修：`normalizeCaseTab` 对 V2 案件（`useV2Tabs`）提前返回（只保留 `projects`→`kr` 旧映射），V2 的 tab 归一化只由 `canonTabKey` 管。「看进度 → 赴韩施术」走同一路径。测试 R153a / R153b 断言「点 tab 后 activeCaseTab 变了、内容与上一个不同」（IN 主案件 / 子案件页、KR 主案件 / 到院日页）。
- **一 主案件完成规则**（`mainAutoComplete`）：不再要求「停在 postcare/travel、krProcedureDone、非 mgmtActive」；改为：材料已确认、不是已取消、没有进行中的事（`mainOngoingOf` 为空）且满足 ①韩国行程已结束 ②或曾被 `reopenMain` 重新打开过（`m.reopenedAt`）。本地管理剩下的项目（`mgmtActive`）不影响。**我的判断**：不对「面诊已出方案、客人还没选项目」这类从没走过赴韩/没被重开过的进行中案件放开，否则会被误完成。
- **二 复诊评估发送卡住的原因**：旧结构案件「评估内容已上传（`consultContentAt`）但没有开始评估记录（`consultStartedAt`）也没选结论」——`krRevEvalCard` 的 `can` 要求 `started`，结论按钮出不来；发送区 `krRvSubmitBlock` 又要求先选结论，灰按钮提示「请先选评估结论」，死锁（卡上看到的「恢复正常 / 需要处理」是没选中的灰色标签，不是已选结论）。修：`started` 也认 `consultContentAt`；`krSetRecoveryResult` 同；`krRvAuth` 在还没有结论时允许勾授意；发送区读 `c.recoveryResult`，没选时自带［恢复正常］［需要处理］；三处灰色发送按钮旁直接写原因（`.kr-why`，不只悬停）。
- **三 00:00 关账修正**：升级后的主案件页只留第三行「待确认结束」，红色条只在子案件页（子案件页上不再重复第三行）；红色条 / 确认弹窗 / 待办 / Timeline 写子案件号（`dayNoTxt(c)` / `krDayNoTxt(c, key)`）；00:00 时没有需要确认的东西（IN：无今日项目要确认 + 无未付款结算单；KR：`krDayConfirmRows` 为空 + 无待付款）→ 直接结束（`dayAutoEndIn` / `dayAutoEndKr`，挂在 `visitSweep` 和 `tripAutoSweep`，Timeline「00:00 自动结束（没有需要确认的项目）」）。`krDayConfirmRows` 从 kr.js 搬到 data.js。
- **四** 拿掉 `krRoWrap` 的「这一天已结束，只能看…」提示行（按钮仍灰、title 在）。**五** `krStayHeadHtml`：KR 主案件页和施术当天页头都写「在韩 …」；没填且有韩国行程写「在韩：未填写」，后面接［行程修正］。**六** KR 按［客人已到院］时在韩期间没填（`stayNeedFillOnArrive`）→ `krStayArriveOpen` 补填窗（到达日期 + 时间、离开日期必填；离开时间 / 机场选填）→ `coreStayFill`（Timeline + IN 通知），填好继续标已到院。
- 测试：新增 R153a（A1）、R153b（KM1，stageC + pcStage 夹具）；R148a「只能看」断言改成没有那行字。

## CMD-1027-09 补充（2026-10-27，追加；取代 CMD-1026-15 五 / CMD-1026-19 B3 / CMD-1020-09 里 IN `inPostcareTabHtml` 的「今日 / 预约中 / 未预约 / 已完成 + 状态栏 + 地点栏」、KR 术后管理 tab「按施术分卡」`krProjCards({only:'care'})` 和 1026-19「KR 术后管理不加胶囊」，旧文字保留作历史）
- 基准 **0a5c4b0**（CMD-1027-08），单个提交（见 Notion 汇报），分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **IN / KR 主案件术后管理 tab 同一个组件** `pcmHtml(c, side)`（data.js 末尾；`pcmModel` 取数、`pcmGroups` 按日期分组；IN `caseTabContentHtml` 的 postcare 分支 / KR `krTabPostcare` 调用，`inPostcareTabHtml` 和 KR 的 only:'care' 分支留着没入口）：相关子案件（IN 照旧）→ 胶囊 在韩术后｜印尼术后（`PCM_CAP`，两边都有才出现；IN 默认规则照 1026-15，KR 默认在韩术后）→ **预约中**（同一天同地点一组，标题行「12/19 11:00（韩国）· A000022-03」+ 今天标「今天」，最右［查看案件］［修改时间］；项目行 项目｜施术项目｜推荐内容）→ **未预约**（项目｜施术项目｜推荐内容｜次数「剩 N / 共 M」｜推荐时间｜操作［预约时间］，付清尾款前灰掉）→ **已完成**（按完成日期分组，标题行［查看案件］，项目｜施术项目｜备注）。拿掉状态栏、预约中 / 已完成的次数栏、来源栏、「今日」一段（今天放预约中今天那一组）；主案件页不放到院操作。
- **权限**：IN 只能改 / 预约印尼的（［修改时间］走 `todoCareBookOpen(…, 预约案件id)`，改的是整张预约 = 整天），KR 只能改 / 预约韩国的；另一边的［修改时间］［预约时间］不显示。［查看案件］：IN → `openSubcase`；KR 只对韩国的天有（`krOpenDay`），KR 看印尼的天不放（KR 打不开 IN 的天，我的判断）。**整天一起改（KR）** `pcmDayEditOpen / pcmDayEditSave`（kr.js）：同一天的项目一起移到新日期 / 时间，复用 `coreSubTimeEdit`（新增第 6 个参数 `quiet`，只发一条汇总通知「N 个术后管理项目整天从…改到…」）；检查沿用单行改时间（已完成的到院日提示、医院休诊硬挡、营业时间外 / 午休确认、那天已有到院时间以原预约为准）；有一行客人已到院就不能整天改（按钮灰 + 提示）。同一天单独改一笔到别天：没做（整天一起改）。
- **推荐内容** = 「术后第 N 天 · 必须在韩国 / 韩国或印尼都可 / 印尼」（`careDayText` + 所需术后管理的地点）。原「交给印尼」段：并入「印尼术后」胶囊（印尼的行没约 = 未预约，约了 = 预约中，做完 = 已完成）。
- 测试：新增 R154a（A1，pcStage 夹具）、R154b（KM1，pcStage 夹具）；R118a 的栏位断言改成新栏位（原：地点 + 建议日期栏）、「已预约」→「预约中」。KR 日历 / 其他地方对 `krProjCards` 术后管理分支的引用没改（函数留着）。

## CMD-1027-10 补充（2026-10-27，追加；旧文字保留作历史）
- 基准 **ea96209**（CMD-1027-09），单个提交（见 Notion 汇报），分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **Fiona F 点不进去：没能在自建数据里重现「案件页 render 抛错」**（用真实流程 + 12 笔韩国术后管理 + 回印尼预约 + 关账确认结束 + 子记录 + 演示时间拨到 12/14 + 刷新后 `?case=` 直开 + 260 次随机删字段，IN 全部 tab / 每天的子案件页 / 子记录页都打得开；`pcmHtml` 对缺字段也不报错）。**重现出来的「停在工作台」是另一个原因**：`caseGo`（ui.js）看到登记表里写着「另一个分页开着这个案件」（12 秒内）就只发广播 + 尝试切到那个分页，**不管那个分页还在不在**；对方分页卡死 / 没响应 / 白屏（或异常关闭留下的登记）时，这个分页停在工作台、只弹一条 6 秒提示，强制刷新也一样（登记还在）；只有开着的那个案件受影响，点别的客人正常——和现象吻合。自建数据里这样复现：登记表塞一条 `{tab:'别的分页', ts:现在}` 再点案件，修之前一直停在工作台。**这是否就是用户那次的原因我没法确认**（看不到用户浏览器的控制台）。
- **修**：`caseGo` 先问一声（BroadcastChannel 里对方回 `{pong}`），0.6 秒没人回应 = 登记失效：清掉登记、照常新开 / 退回当前分页；有人回应才走原来的「切到那个分页 / 提示」。自测钩子 `window.GMC_CASEGO_SYNC = true` 当作对方一定回应（R38a 用）。
- **保护（案件页某一块出错不影响整页）**：ui.js `gmcSafe(label, fn, fallback)`（出错只那一块显示「这里出错了（xx）：…」、`console.error('[案件页 · xx 出错]')`、记在 `window.GMC_BLOCK_ERRS`）+ `gmcTry`；IN：`openCaseDetailHere` 的标题 / 状态栏 / Timeline / 内容各自保护且 `nav('in-casedetail')` 一定执行；`renderCaseBody` 的 tab 列表 / tab 内容 / 子案件页分开；V2 tab 内容里相关子案件和各业务块分开；`subPageHtml` 页头 / 内容分开；`boot-in.js` 的 `?case=` 每一步各自保护；`applyCaseAt` 定位出错不影响打开。KR：`krRenderCaseDetail` 最外层兜底（出错显示一条错误 + ［返回］）+ `krWC(label, kind, fn)` 把提醒条 / 案件内容 / 这一天的页 / 到院卡 / 这一天的页头 / 主案件页头各自保护（页头出错退回旧页头）。**新写案件页的块时，容易出错的块用 `gmcSafe` 包一层**。
- 测试：新增 R155a（A1，pcStage 夹具：Fiona 型全部 tab / 子案件页 / 子记录页 + 人为让术后管理 / 状态栏 / Timeline / 子案件内容抛错）、R155b（KM1：KR 每个 tab / 到院日页 + 抛错）；用基线 ea96209 代码跑同一份测试：两个注入断言都失败（异常直接抛出）。R38a 加 `GMC_CASEGO_SYNC`。「登记失效不再停在工作台」是异步（0.6 秒）、ST 不支持异步用例，用 adhoc 脚本验证（基线：1 秒后仍在工作台；新版：进了案件页）。

## CMD-1027-11 补充（2026-10-27，追加；旧文字保留作历史）
- 基准 **0030201**（CMD-1027-10），单个提交（见 Notion 汇报），分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **IN 赴韩施术 tab「这里出错了」`md2 is not a function` 的原因**：`inProjectCardHtml`（data.js）里，CMD-1027-04 三（c893cd5，为修「在韩管理胶囊数字有、点开是空的」新加的 `mgBooked / mgUnbooked` 预先计算）把一段 `forEach` 放到了 `var md2 = function…`（和 `var ks0 = …`）**定义之前**。`var` 提升成 `undefined`，只要某个在韩管理项目有「预约中的行」或「今天已选进到院」，那行就调 `md2(...)` → 抛错（`ks0.confirmedTime` 也同样会因 `ks0` 未定义抛错）。**为什么自建的 Fiona 型资料没重现**：之前的夹具里管理项目从没有预约行 / 今天选进到院，forEach 里那两个 `if` 一直没走到；Fiona 有一笔在韩管理项目预约在 12/19 的行，才走到。修：`md2` / `ks0` 挪到 forEach 之前。
- **全局检查（新增 `dev/undef-check.mjs`，已接进 `bash dev/check.sh`）**：用 vite 自带的 rolldown 解析器扫 `prototype/shared/*.js`：① 被调用但全站没定义的函数；② 同一函数里 `var X = function` 在定义位置之前被调用（var 提升）。结果：①只有 `data.js` 的 `setIntentionPickerFilter` → `renderIntentionPickerModal()`（CMD-1019-02 删了意向项目选择弹窗时漏删的死函数，全站没人调用，已删）；②除 md2 外只有 `kr.js` `useBtns` 调 `useBtns0`（在嵌套函数里、之后才调用，没问题）。**新写代码后跑 `node dev/undef-check.mjs`**。限制：只查「调用」，不查「读 var 变量」（`ks0` 这种读属性的提升问题查不到）。
- 测试：selftest 新增 `ST.addMgmtBooked`（造「在韩管理项目有预约中的行 + 今天已选进到院」）+ R156a；R155a 的 Fiona 型夹具补上这种资料；用基线 0030201 代码跑 R156a 失败（`md2 is not a function`），新代码通过。

## CMD-1027-12 补充（2026-10-27，追加；取代 CMD-1027-04 一里「过了离开日期（第二天 00:00 起）就自动结束」「KR 预约弹窗晚于离境日才红字」、CMD-1027-09 里整天改时间只检查休诊，旧文字保留作历史）
- 基准 **54d29a4**（CMD-1027-11），单个提交（见 Notion 汇报），分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。第 2～5 项是用户确认过的主线改动。
- **背景（Fiona F）**：在韩期间是 KR 第一次到院时补填的（12/12 ～ 12/20），之前已经约了 12/19～12/24 的韩国术后管理；过了 12/20 行程自动结束，12/21 KR 照样标到院、12/22 / 12/24 的预约还能改时间——离开日期和韩国预约互相矛盾，系统没拦。
- **一 KR 业务 tab 相关子案件**：`tabVisitsHtml(c, tab, side)`（data.js）加第三个参数，`side='KR'` = KR 端同一个组件：韩国的天［查看内容］→ `krOpenDay`（那天的子案件页），印尼的天照样列出、不放按钮（KR 打不开 IN 的页）；KR 的面诊 / 赴韩施术（tab key `items`）/ 术后管理 / 复诊 tab 最上面都放（kr.js `krRenderCaseDetail0` 里按 tab 映射 `{consult, items→kr, postcare, revisit}`，`gmcSafe('相关子案件')` 包着）。排序 / 状态 / 行写法同 IN。
- **二 预约照离开日期挡**：`stayDayBlockText(c, date)` / `stayLeaveWhen`（data.js）；KR 预约弹窗 `krCbGone` 由「晚于离境日」改成「**离开当天及之后**」（`date >= 离开日期`，离开当天要留去机场的时间，整天不约），红字「客人 12/20 11:00 离开韩国，这天不能约，请改到离开前」；「韩国或印尼」的项目仍照 1021-04 自动变「回印尼做」；离开日期没填：弹窗上方黄条「离开日期未填写，约之前请先确认客人行程（现在可以先约）」，不挡。主案件术后管理整天［修改时间］（`pcmDayEditSave`）、单行［修改时间］（`krTimeEditSave`）、施术 / 管理项目单条预约（`krBkdSave`）也照同样规则挡（`krBlock` 弹提示，日期不动）。**核心函数（`coreCareBook` / `coreSubTimeEdit` …）没有加这条检查，只在界面入口挡**（自测 / 旧用例里造数据不受影响）。
- **三 补填 / 修正离开日期时处理冲突预约**：触发 = KR 到院时补填在韩期间（`krStayArriveSave`）、［行程修正］（`krStayFixSave`）；存之前 `krStayResolveGate`：有「韩国预约排在离开当天或之后」（`stayConflictInfo`：术后管理预约 / 管理项目预约 / 施术项目预约使用的行，没做、没取消、没到院）→ 先弹处理窗（`#kr-stayres-overlay`，项目｜施术项目｜原本预约｜处理方式，每项必选才能保存）：**提前做**（改到离开之前的日子，日期 / 时间照预约弹窗规则：不能选过去、休诊 / 营业时间外不行）/ **回印尼做**（取消这笔韩国预约，转进「印尼术后 · 未预约」由 IN 约；只有「韩国或印尼都可」的术后管理能选，「必须在韩国」的灰掉）/ **保留**（取消这笔预约，项目留在「在韩术后 · 未预约」，之后再决定；**这是我按建议做的，用户没另外说明，待确认**）；［取消（回去改离开日期）］什么都不变。保存 = `coreStayResolve`（先全部校验、都通过才改；`coreCareToIn` 加了第 4 个参数 `quiet`，一次处理多项只发一条「交给印尼」通知）+ 存离开日期；IN 收一条通知（写清楚提前 / 转回印尼 / 保留）、Timeline 记一笔。校验抽成 `stayFixValidate` / `stayFillValidate`（先校验再弹处理窗）。**IN 自己改在韩期间（`coreSetStay`）没有加这个处理窗**（任务只写了 KR 的两个入口）。
- **四 有冲突不自动结束**：`tripAutoByDateDue` 加 `&& !tripDueConflict(c).length`（离开日期已过，但还有离开当天或之后的韩国预约、或已到院没结束的日子）→ 不自动结束；KR 待办新 kind `tripover`「客人离开日期已过（12/20），但还有 12/22 11:00、12/24 11:00，请确认客人是否已离境」，点了进项目 tab 并打开［行程修正］（走第三项的处理窗）；没有冲突的照 04 自动结束。
- **五 行程已结束按到院先拦**：`coreMarkArrived` / `coreSubArrived`（`coreVisitArrive` 走它）在 `krTripEnded` 时设 `window.KR_TRIPBLOCK = tripEndedBlockText(c)` 并返回 false；`krMut` 弹 `krTripEndedModal`（「韩国行程已于 12/20 结束。客人还在韩国吗？请先［行程修正］」+［知道了］［行程修正］）；`krMarkArrived` 也先查一次。行程修正把离开日期改到今天或以后 → `reopenTripIfNeeded` 重新打开 → 才能标到院。
- 测试：selftest 新增 R157a（KM1 分页，pcStage 夹具，五项各验证；用 54d29a4 代码跑失败）。

## CMD-1027-13 补充（2026-10-28，追加；取代 CMD-1020-18 三里 IN 预约印尼术后管理弹窗「按项目分块、每行自己选日期 + 时间」，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 a874c50（CMD-1027-12），单个提交，**未推送**，数据版本不变（56）。只改 IN（todo.js `todoCbOpen / todoCbNormalize / todoCbSet / todoCbSetDay / todoCbRender / todoCbGo`，新增 `todoCbTimes / todoCbDateErr / todoCbSnap / todoCbOptsHtml`）。
- **按日期圈小卡**：一天一张卡（`.krcb-grp`），标题「预约时间：MM/DD（周几）［时间下拉］」，同一天只选一次时间（`TODO_CB2.dayTime[日期]`，取代每行的 time）；卡内表格 勾选｜项目｜施术项目｜推荐内容（术后第 N 天，`careDayText`）｜推荐时间｜次数（− N +，多次自动生成下一行，规则不变）｜预约日期；改某一行日期 → 自动移到那一天的卡（没有就新增）；日期有问题（休诊 / 已满 / 已过）的行单独圈红框「需要处理 N 项」（红字写原因，自动取消勾选，改对后自动勾回，自己取消的不勾回）；时间下拉只列营业时间内，午休列出（标「午休」），确认预约时跳「这是午休时间，确定预约吗？」；底部［取消］［确认预约（N）］；预览同一天并入已有预约。
- **没有和 KR 共用组件**：KR 的 `krCbRender` 绑定 `KR_CB` 状态、离开日期、院长时间、地点、管理项目等大量 KR 专有逻辑，抽成共用组件改动面太大；这次 IN 自己实现，外观（`.kr-fld`、`.krcb-grp`、`.krcb-prob`）和规则（一天一个时间、红框、午休确认）对齐 KR；KR 弹窗未改。入口：未安排预约［预约］/［全部预约］、项目卡 / 术后管理 tab 的［预约］都经 `todoCbOpen`，一起变；修改时间的小弹窗（`todoCareBookOpen`）没动。
- 测试：新增 R158a（A1，pcStage 夹具，单跑通过：两个日期两张卡 / 一卡一个时间 / 栏位 / 改日期移卡 / 周日休诊进红框 / 午休确认 / 同天合成一次到店）；A1 全套对照 a874c50：新增失败只有 R158a（整套里因夹具缺失失败，与其它 pcStage 用例同）。

## CMD-1027-14 补充（2026-10-28，追加；取代 CMD-1027-12 判断 5「IN 自己改在韩期间不弹处理窗」、CMD-1027-02 二 / CMD-1026-09 B / CMD-1026-19 B1 里 IN 主案件页头「今日进行中 / 今日预约 / 下次预约」第三行，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 09ec907（CMD-1027-13），单个提交，**未推送**，数据版本不变（56）。用户确认过的规则，直接做。
- **IN 改在韩期间也弹离开日期冲突处理窗**：IN 所有改在韩期间的入口（赴韩日程卡［修改］、确认赴韩 / 施术前 2 天［已确认行程］、「在韩期间」弹窗）都经 `staySave`（calalign.js）→ 存之前 `stayConflictInfo(c, 离开日期)` 有离开当天及之后的韩国预约 → `inStayResGate` 弹 `#in-stayres-overlay`（`inStayResRender / inStayResSet / inStayResCancel / inStayResSave`），核心处理函数和 KR 共用 `coreStayResolve`（加 `inSide` 判断）。每项必选：［回印尼做］（只有「韩国或印尼都可」，必须在韩国的灰掉，核心也拒绝）/［保留］（取消这笔预约，项目留在「在韩术后 · 未预约」，用户确认对）/［请 KR 提前做］（新 mode `ask`：韩国预约由 KR 安排，IN 不直接改日子；预约原样不动，行上记 `earlyAsk={by,at,before}`）。存完：在韩期间保存、通知 **KR**（`pushKrNotif` action 级，写清转回印尼 / 保留 / 请 KR 提前做）、Timeline 记一笔；［取消（回去改离开日期）］什么都不变。KR 待办新 kind `earlyask`（todo.js）：「IN 请把 XX（MM/DD）改到离开日期（MM/DD）之前」，没改之前一直挂着（行仍在离开当天及之后、没做 / 没取消），KR 改到离开前或取消后自动消失；离开日期过了仍有冲突时照 CMD-1027-12 第 4 项的 `tripover` 待办，不自动结束。
- **主案件「当前状态」两行状态卡 IN + KR 共用取数**（data.js `mainStatusModel / mainPendingBook / mainDayBiz`）：IN 升级后的主案件（ui.js `renderCaseStatusBar0`）改成和 KR 一样的两行：第一行「当前状态（进行中 N｜预约中 N）［查看］→ 子案件 tab」；第二行按优先级：待确认结束（CMD-1026-20，优先，红字 +［确认结束］）> 今日到访（…）进行中 / 已完成 / 待到店［查看内容］> 下次到访（…）MM/DD［查看内容］> **待预约** > 后续日程：无。没升级的一般案件仍没有这张卡。
- **新增「待预约」**：没有今日 / 下次到访但还有未预约的术后管理（付清尾款后；`mainPendingBook`）：IN 写「待预约：印尼术后管理 N 项（最早建议 MM/DD）」+［预约］→ `todoCbOpen`（13 的按日期小卡弹窗）；韩国的未预约只提示「韩国 M 项由 KR 安排」。KR（kr.js `krPendRow / krPendSmall`）：有韩国未预约 →「待预约：韩国术后管理 M 项」+［预约时间］→ `krCbOpen({all:true, tab:'care'})`（印尼的写「印尼 N 项由 IN 安排」小字）；只剩印尼的 →「后续由 IN 安排：印尼术后管理 N 项待预约」（不放按钮）。有今日 / 下次到访又有待预约时，待预约数量跟在后面小字。「后续日程：无」只在没预约也没待预约时显示。
- 测试：新增 R159a（A1，pcStage 夹具）、R159b（KM1，pcStage 夹具）；因这次有意改动而更新的断言（改前 → 改后）：R135a / R144a / R142a / R141a / R149a 里 IN 页头第三行「今日进行中：…［进入案件］/ 今日预约：HH:mm / 下次预约：日期 / 下次预约：—」→ 两行状态卡「今日到访（…）进行中 / 待到店［查看内容］/ 下次到访 MM/DD / 后续日程：无」。

## CMD-1028-01 补充（2026-10-28，追加；取代 CMD-1027-04 二「从主案件约的预约到店前是独立的预约案件、到店才 joinMain」，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 52341d6（CMD-1027-14），单个提交，**未推送**，数据版本不变（56）。用户确认过的主线改动（预约到店）。**用户浏览器里的旧资料（A000023 / A000024 独立预约）没有动，也不迁移**。
- **原则**：预约的内容属于哪个主案件，就自动挂在哪个主案件下面。新函数 `createChildReservation(m, date, time, purpose, ext)`（data.js 末尾）：建预约时直接 `mainId = 主案件`、`preChild = true`、`preTypes = ['术后管理'|'复诊评估']`，案件号用 13 的一天一个号 `dayNoAssign`（旧主案件用 `mainNoMax+1`），**不消耗新的 Case ID**（建完把 `CASE_NO_SEQ` 退回）；`careFor` / `revisitFor` 照旧写（`inCareBooking` 靠它判断哪些项目约了）。
- **走新路径的入口**：IN 预约弹窗 `todoCbGo`（未安排预约［预约］/［全部预约］/ 术后管理 tab / 项目卡［预约］/ 14 的待预约［预约］）、`todoCareBookGo` 新建分支、［预约复诊］`revBookGo`。同一天已有这个主案件的预约子案件（`childResvOf`）→ 并进去（keys 追加）；同一天已有**别的主案件**的预约 → 各自挂在自己的主案件下、不合并（日历那一天各自一格）；同一天已有独立的一般预约 → 照旧并进去。**不变**：客人自己打电话 / 自助约的一般预约仍是独立预约（新 Case ID，到店在服务类型对话框里选）；本地管理不做预约；KR 的韩国预约本来就挂在主案件，不受影响。
- **预建子案件的行为**：`typesOfRecord`（visitsOf）到店前只算它约的类型（`preTypes`），确认后走原规则；客人页「正在进行案件」（`cliOngoingHtml`）子案件缩排（└）在主案件底下，不再是独立案件，已取消的不列；日历 `calendarEvents` 一天一格（原来重复的原因：独立预约既是自己的主案件、又被主案件的 visitsOf 读到，所以一天两格），格子标题「术后管理（N 项）」（`e.n` = `careFor.keys` 数）；到店 `followupAsk` 默认「继续之前的服务」+ 对应服务内容 + 案件选好（主案件），客人当天要加做别的仍可再勾；选「开始新的服务案件」→ `detachPreChild`：脱离主案件、拿新 Case ID、清 `careFor/revisitFor`；取消接待（`clearResumeState`）不退出主案件（`preChild` 保护）；预约取消 / 未到：照原规则作用在这个子案件（号占位不重用，项目退回未预约）；预约改期：号固定不变（跟 joinMain 的子记录一样）。
- **旧路径**：`visitsOf` 里 CMD-1027-04 为独立预约（`careFor` / `revisitFor` 指向主案件、没有 `mainId`）加的读法**保留**（用户浏览器里的旧资料 A000023 / A000024 还靠它显示），新预约不再走它；`joinMain` 对预建子案件是幂等的（号不变）。
- 测试：新增 R160a（A1，pcStage 夹具）；A1 全套对照 52341d6：新增失败只有 R160a（整套里缺夹具），带夹具的 22 个相关用例（R158a/R159a/R71a/R149a/R152a/R154a… 在新旧代码上结果相同），KM1 子集 6 / 6，没有旧断言因这次改动过期。

## CMD-1028-02 补充（2026-10-28，追加；旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 2754c57（CMD-1028-01），单个提交，**未推送**，数据版本不变（56）。
- **离店 / 离院前提醒这一天还没完成的事（只提醒、不挡）**：IN 按［客人离店］（`openEndCase`，ui.js）、KR 按［客人已离院］（`krEndAskOpen(key, manual)`，kr.js）时先检查：有 → 弹「客人离开前请确认：」（`leaveRemindOpen`，逐条具体文字，有的附［去处理］），底部［返回处理］（什么都不变）［确认离开］（Timeline 记「客人离店 / 离院时仍有：…」，再继续原来的离店 / 离院流程：IN 原来的结案弹窗或直接结束；KR 还有没做完的项目 → 原来的「没做完的原因」确认窗，否则直接标已离院）；没有 → 照旧，不多一步。KR 有待付款的在韩加买时仍走原来的硬拦（`endBlockPending`，那是 CMD-1021-10 的规则，不是这次的提醒）。
- **检查清单**（data.js `leaveRemindersIN(c)` / `krLeaveReminders(c, key)`）：IN = ① 复诊评估结果没到（KR 还没确认评估时间 / 等院长评估）② 面诊诊疗方案没出（面诊已开始 / KR 还没确认面诊时间）③ 今天的术后管理没按［操作完成］或［本次不做］（列项目名）、本地管理项目没标完成 ④ 钱没付（面诊费 Rp…、结算单 + 金额）⑤ 下一步没约（印尼术后管理 N 项、最早建议日在 7 天内或已到，附［去处理］→ 预约弹窗；院长建议的复诊没［预约复诊］，附［去处理］）。KR = ① 今天的项目没处理（列项目名）② 钱没付（尾款 ₩…、在韩加买）③ 施术当天术后管理没预约（附［去处理］→ 预约弹窗）④ 在韩期间（离开日期）没填（附［去处理］→ 行程修正）。
- 自测钩子 `window.GMC_NO_LEAVEREMIND`（selftest.js 开头默认 true）：自测里直接按离店不弹窗；R161a / R161b 临时关掉测弹窗。
- 测试：新增 R161a（A1，pcStage 夹具）、R161b（KM1，pcStage 夹具）；A1 全套对照 2754c57：新增失败只有 R161a / R161b（整套里缺夹具，单跑通过），KM1 子集 6 / 6；没有旧断言因这次改动过期（旧用例靠默认关掉的钩子照旧直接离店）。

## CMD-1028-03 补充（2026-10-28，追加；取代 CMD-1027-06 里「逐项意见 / 下次复诊 / 注意事项在发送块里、院长和室长同一张表单」和 CMD-1022-19 里「按评估卡［确认］才算评估结束」，旧文字保留作历史）
- 基准 **d48836f**（CMD-1028-02），单个提交（见 Notion 汇报），分支 feature/case-structure-v2，**未推送**，数据版本不变（56）；只改 KR。
- **分工**：院长写内容、点［完成评估］（没有发送、没有退回）；室长整理文字、［退回院长］、［发送复诊评估结果］（只有室长）；院长当天没用系统时，室长勾「已得到院长授意」代录全部并直接发送（标注「室长代录（院长口述）」）。内容存 `c.revEval = {op:{项目:意见}, text, nextType, nextDate, note, recLocal, sugKr, sugKrNote, role:'doctor'|'proxy', by, at, doneBy, doneAt, ed:{op:{}, 字段…}, log:[], ret:[], retPending}`；整体结论仍是 `c.recoveryResult`；`rvMode(c)`（kr.js）= author（院长；或持授意的室长 / 旧资料）/ editor（室长看院长完成的内容）/ view。
- **核心函数**（data.js，不碰界面）：`rvEvalOf / rvEff / rvOrig / rvEdited / rvMissing`、`coreRvSet`（作者写内容；完成后再改记 log）、`coreRvEdit`（室长只改文字：op / text / note / recLocal / sugKrNote，改动存 `ed` + `log`，改回原文就不算改；代录案件不让改；下次复诊 / 整体结论 / 建议赴韩不让改）、`coreRvFinish`（必填：整体结论 + 每个项目的评估意见 + 指定日期要有日期；写 `consultContentAt`；通知 KR 室长 + IN 一般消息）、`coreRvReturn`（必须写原因；清 `consultContentAt`；通知院长）。`coreSubmitReport` 在 `rep.proxy` 时写 `c.revisitProxy`，报告签名处加「（室长代录，院长口述）」。
- **界面**（kr.js `krRvWorkBlock`，面诊 tab「评估内容」块，取代旧的 `krRvSubmitBlock` / `krRvExtraHtml` / 评估卡里的结论 + ［确认］）：作者 = 逐项意见 + 整体结论 + 说明 / 推荐本地项目 / 建议赴韩 + 下次复诊 + 注意事项 + ［增加内容（语音 / 手动）］［AI 整理］+ 底部按钮（院长［完成评估］，必填没填灰掉、原因写在旁边；代录［发送复诊评估结果］）；editor = 院长写的内容（标 KD1 院长 · 时间）、文字可改（标「已改」+［看院长原文］+ 改动纪录）、整体结论 / 下次复诊 / 建议赴韩只显示并注明「医疗判断，只有院长能改」、［退回院长］（弹窗填原因）［发送复诊评估结果］。写内容 / 改文字都是离开输入框就静默存（`krRvSetQ` / `krRvEditQ`，不整页重画，只刷新按钮区 / 纪录区）。发送 `krSubmitReport` 的复诊评估分支读 `rvEff`（改过的用改后的）；院长按不了发送（`krCan` 直接返回）。
- **待办**：完成后 KR 室长「发送复诊评估结果 · 评估完成（KD1 院长）」（代录写「室长代录」）；被退回后院长「复诊评估被室长退回（原因）：重新评估（…）」，室长变回「等院长评估」。KR 通知「评估完成 → 请发送复诊评估结果」（室长）/「…把复诊评估退回：…」（院长）。
- **旧资料**：评估内容已上传（`consultContentAt`）但没有 `revEval`（室长当时直接填的）= 当成代录：`rvMode` 为 author，页面标「室长代录（旧资料：室长直接填写）」，填完逐项意见即可发送，报告标代录；已发送的不动。**顺带修**：`krSetRecoveryResult` 原来要求 `isRevisitConsult`，复诊评估子记录没有 `consultKind`，选不了结论，已放宽成 `isRevisitConsult || isRevEval`。
- 测试：selftest 新增 R162a（KD1：院长只有录入 + 完成、必填、通知、完成后还能改、发不了）、R162b（KM1：室长看到院长内容 / 改文字留纪录 / 结论 + 下次复诊改不了 / 退回 / 发送 / 报告用改后的 / 代录 / 旧资料）；更新 R104b R106a R151b R153b 的复诊评估旧流程断言（改前：KR_SUB 里填逐项意见 + 评估卡［确认］ + 发送块预览框 → 改后：`c.revEval` + ［完成评估］ + 评估内容块）。R104b / R106a 在基线 d48836f 上本来就跑不了（R104a 造的复诊评估是子记录，`krAllCases` 只列主案件，找不到夹具），这次只改了断言文字，没能实际验证。

## CMD-1028-04 补充（2026-10-28，追加；取代 CMD-1027-05 三里 IN 复诊评估 tab「结果没到只有一张大卡」、CMD-1026-14 一里 KR 复诊评估待办进主案件复诊 tab，旧文字保留作历史）
- 基准 **709acc4**（CMD-1028-03），单个提交（见 Notion 汇报），分支 feature/case-structure-v2，**未推送**，数据版本不变（56）。
- **一 改期不换号（IN + KR）**：原因——`dayNoSync` 只会「visitsOf 里有哪天没号就占一个新号」，一笔预约（或 KR 一整天）改到新日期后，新日期没号 → 又占一个新号（-09 → -10），旧日期的号变成孤号，计数器白白前进。修：`dayNoRelocate(m, vs)`（data.js，`dayNoSync` 先调）——先把「已经没有任何一天对应」的孤号搬给新出现、还没号的日子：子记录用自己的 `caseNo` 精确配对；同一地点只有一个孤号 + 一个没号的日子（KR 整天改时间 / 到院改日子 / 行程修正提前做）也配对；配不上才当新的一天给新号。`joinMain` 对预建子案件（`preChild`）沿用原号并把登记表搬到当前日期；IN 改期入口（`confirmReschedule`、术后管理［修改时间］`todoCareBookGo` 编辑分支、客人改约 `simulateCustomerReschedule`）改完日期立即 `dayNoSync`。取消接待再到店本来就沿用（登记表保留日期登记，不重编）。**旧资料不重编**（旧主案件 `dayNoOn=false` 不走这套）。**边界**：某天所有项目都被延期（行 `skipped`）后，之后新出现的同地点唯一一天会接手那个号；同时有 ≥2 个孤号 / ≥2 个新日子时无法判断谁是谁，按新的一天给新号。
- **二 KR 点复诊评估待办 → 子案件页版面**：待办 `goCase`（kid 行）改成 `krShowCase(clinicId, 子记录 id, {tab:'consult'})`；`krRenderCaseDetail0` 里子记录（`r.c.mainId`，不能用 `isChildVisit`：它读当前诊所的 `CASE_ITEMS`，KR 页面不在来源诊所里）用新页头：「← 回到主案件 A…」+「A…-NN · MM/DD HH:mm（印尼）· 今天做：复诊评估」+ 状态标签 + 客人名 + 对话；tab 基础资料｜复诊评估｜附件｜Timeline，默认复诊评估（KR 要操作的那块）；其他 tab 本来就只读（我的判断：KR 看 IN 的日子——复诊评估 tab 是 KR 参与的、可操作，其余不能改 IN 的事，和 1027-12「印尼的天 KR 不放［查看内容］」不冲突，那条说的是 IN 的非 KR 参与的天）。旧结构的独立复诊案件（没有 `mainId`）照旧。
- **三 IN 复诊评估 tab = 复诊卡 + 报告卡**（`revEvalTabHtml`，子案件页和主案件复诊 tab 同一个组件）：复诊卡 = 状态 + 继续哪个案件 + 复诊想问的内容，项目照片 / 视频默认折叠（`revProjCardsHtml(c,{collapse:true})`，点项目才展开）；报告卡**一定有**——结果没到：`revReportPendingHtml`「等待评估结果（预计 MM/DD HH:mm）」（KR 还没确认时间写「KR 还没确认时间」）+ 状态文字（评估完成 · 等 KR 传结果等）；结果到了：`revReportCardHtml`（提交 + 评估摘要（AI 翻译）+［完整报告查看］→ 弹窗下载 / 打印 / 关闭）。［预约复诊］行仍在复诊卡里。**05 没生效的原因**：① 主案件复诊 tab（`flowDetailIn`）只在结果到了才放这个组件，结果没到只有一个［打开复诊评估］按钮；② 结果没到时只有一张默认收起、展开后摊开全部照片的大卡，没有报告卡；③ 项目卡没折叠。
- **四 发送后**：`krTabConsult0` 的 report_ready 复诊评估分支：「✓ 结果已发送 · MM-DD HH:mm · KM1 室长（代录标注）」+［查看报告］+ 结果卡 + 室长修改纪录（只读 `krRvEdLogHtml`）；评估内容块（`krRvWorkBlock`）因 `reportReady` 不再出现 → ［退回院长］［发送复诊评估结果］［AI 整理］消失、文字只读（院长室长同；`rvMode`=view）；页头标签「复诊评估 · 结果已发送」；发送失败不再静默（`krSubmitReport` 弹「发送没有成功…」）。**原因：没能重现「发送其实没成功」**——主案件自身、子记录、预建子案件（dayNoOn）三种数据上，院长完成 → 室长改文字 → 发送 / 代录发送，状态都写进去、画面都切换（IN 摘要读到室长改后的文字）。最可能的原因（没法确认用户浏览器里的情况）：同一诊所存档「最后写入者覆盖」（上面交接注意事项）——另一个分页（例如开着这个案件的 IN 分页 5 秒扫描）用旧的内存数据写回，把已发送的状态盖掉；或页面还是 1028-03 之前的旧代码。面诊的［发送诊疗方案］：发送后 `consultStatus` 变 report_ready，`krConsultGeneral` / 发送块只在等待报告时出现，不会残留，没有同样问题。
- 测试：新增 R163a（A1，pcStage 夹具；复诊评估部分需先跑 R104a）、R163b（KM1，要先在 A1 跑 R104a，造复诊评估子记录）。

## CMD-1028-05 补充（2026-10-28，追加；取代「交接注意事项」里「存档是整个诊所分区最后写入者覆盖、原型不修」，旧文字保留作历史）
- 分支 feature/case-structure-v2，基准 8894ab9，单个提交（见 Notion 汇报），**未推送**，数据版本不变（56）。
- **一 多分页旧资料覆盖新资料（store.js）**：原因——每个分页存档写的是「自己内存里的整份诊所分区」，最后写的赢；分页 A 读档之后，分页 B（例如 KR 室长发送了复诊评估结果，经 `Store.mutateClinic` 直接写盘）写进新内容，A 在处理 storage 事件之前存档（任何一次 60ms touch / 2 秒定时存档 / 5 秒扫描里有改动的写入），A 内存里的旧状态就把 B 的新内容整份盖掉；反过来 A 有未存的改动时 B 的写入事件来了，`loadClinic` 又把 A 未存的改动整份盖掉。两个方向都用两个分页真实复现过（改前：别人写的 / 本页写的各丢一边）。**修**：记下本页上次读 / 写时磁盘上的原文（`lastDiskC` / `lastDiskG`），`tryWrite` 写之前发现磁盘原文变了 = 别的分页写过 → 三方合并（base = 本页上次同步的内容 `lastC`，ours = 本页现在，theirs = 磁盘）：本页没改的用别人的，别人没改的用本页的，两边都改了同一个值以本页为准；有 `id` 的数组（案件、客户…）按 id 逐条合并（别人新增的不会被删；一边删、另一边没改才删；一边删、另一边改过则保留改过的），没有 id 的数组（Timeline 等）取并集；合并结果装回内存并刷新画面。storage 事件进来时本页有未存的改动也走合并（`dirtyC` / `dirtyG`），合并后马上存。没有改动的存档（扫描）本来就不写盘（`snap !== lastC` 才写），空闲 20 秒实测写盘次数改前改后相同。合并记在 `window.GMC_MERGE_LOG`；`Store.mergeNode` 暴露给自测。
- **交接注意事项（后端）**：这是**原型用 localStorage 的本地存档方案**，只为了让几个人同时开多个分页测试时不互相覆盖；正式版由后端的版本号 / 事务 / 按字段更新处理（每次写入带版本号，落后就重读再合并，不能整份覆盖），不需要照搬这套合并。
- **二 独立案件还从哪里冒出来（IN 预约入口清单）**：**主案件内容入口（直接是子案件，`createChildReservation`）**：未安排预约［预约］/［全部预约］、术后管理 tab / 项目卡 / 状态卡「待预约」［预约］（都经 `todoCbGo`）、术后管理改时间（`todoCareBookGo` 编辑分支）、复诊卡［预约复诊］（`revBookGo`）。**一般预约（独立案件，`createReservationCase`）**：工作台日历空格 / 加约［老客人］代约（`confirmAddSlotExisting`）、新客人占位 → 客人自助预约页（`submitSelfBooking`）、客户详情［新增案件］（`newCaseFromClient`，设计上就是独立的）、KR 占位预约（`krbook.js`，在韩管理案件）。**漏的是：日历代约 / 自助预约的「来访目的」下拉有「术后管理」「复诊评估」，选了仍建独立案件**（Fiona F 的 A000025、Apple A 的 A000026 日志「室长代替预约，生成 Case ID」就是 `confirmAddSlotExisting` 的文字）。**修**：新增 `mainForBookingPurpose(name, purpose)`（data.js）：目的是术后管理 / 复诊评估，且这位客人恰好只有一个对得上的主案件（术后管理：还有没做的术后管理；复诊评估：施术做完且 3 个月内）→ `createChildReservation` 直接挂在它下面（子案件号一天一个号、不占新 Case ID）；没有 / 有多个对得上的 / 目的是面诊商谈、皮肤管理 → 仍是独立的一般预约，到店时在服务类型对话框里选。日历代约和客人自助预约（老客人）都走它。不动已经建好的独立案件。
- **三 KR 客人页结构同 IN**：`krRenderClientDetail` 把「KR 参与的子案件」（`krKidVisible`：送给 KR 的复诊评估、已缴 / 免面诊费的继续面诊）加进 `model.cases`，`cliCasesHtml` / `cliOngoingHtml` 的缩进显示（`└`）对 KR 也生效；纯 IN 的（只买本地项目、印尼术后管理预约、没送 KR 的预约、已取消的预约）不显示，韩国的天不是子记录、在主案件里看；点子案件走 `krShowCase` → 1028-04 的复诊子案件页；状态文字两边都是 `caseStageBadge`（同一个函数）。`cliHoldKrRows` 跳过子记录。KR 案件列表的状态仍是 `krTaskStageOf`（KR 要做的事优先，设计如此）。
- 测试：新增 R164a（任意 IN 分页：合并规则单元 + 竞态 A / B + 不写盘 + 单分页不变）、R164b（A1，pcStage 夹具）、R164c（KM1，要先在 A1 跑 R104a）。

## CMD-1028-08 补充（2026-10-28，追加；取代 CMD-1020-11 / 1020-13 里入境 / 离境日期「选了什么就存什么」、CMD-1027-09 / 1025-03 里 KR 子案件项目卡只有 施术｜管理｜已完成、CMD-1020-07 / 1020-18 里 KR 未安排预约「一行一项各自一个［预约］」，旧文字保留作历史）
- 基准 develop 6b88262，三个提交：**一** 345f03f、**二** 1a12407、**三** 7e4d7fc（测试 R166a 在第三个提交里），**未推送**，数据版本不变（56）。
- **一 离境日年份**：入境 / 离境用 `<input type="date">`，浏览器的日历默认停在**真实今天**，不是原型时间（演示时间 / 拨时钟开着时差好几个月），点日历选 02/10 就存成「真实年份」的 02/10（演示 2027-02-04 时存成 2026-02-10）；之后预约弹窗「离开当天及之后不能约」、待办「离开日期已过」、行程自动结束都当成早已过去（症状和大测完全一致；用［行程修正］重存正确年份后消失）。所有写入点（IN 在韩期间 / 已确认行程弹窗 `staySave`、KR 补填 `krStayArriveSave`、KR ［行程修正］`krStayFixSave`、核心 `coreSetStay` / `stayFixValidate` / `stayFillValidate`）存的都是输入框原值，没有补年份的代码；修法：`stayDateRange()`（今天前 120 天 ～ 后 730 天，以原型今天为准）→ 三个弹窗的日期框带 min / max（日历默认落在原型时间附近），存之前 `stayDateErr` 年份离原型今天太远直接拦住并写明。**已存错的旧数据不自动修**：`staySuspect(c)`（年份不对，或离开日期早于已确认的施术日期）在 KR 页头「在韩 …」后标红「⚠ 日期可能存错」、IN 赴韩日程卡同样红字提示，请用［行程修正］改。其他用到离境日的地方（`stayDayBlockText` / `tripAutoByDateDue` / `stayOutDate` 没填时退回 `krCbEarliest` / `tripDueConflict`）本来就是同一个比较，没改。规则不变（离境日当天和之后不能约，之前照常可约）。
- **二 KR 子案件项目卡加回术后管理**：`krProjCards(c, {care:true})`（只有子案件页的项目卡传，kr.js `krSdRun` 和非施术日页「增加今日项目」展开的那张；主案件「赴韩施术」tab 的项目卡不传，主案件有自己的术后管理 tab）：tab 施术项目｜术后管理｜管理项目｜已完成，件数 0 的分类不显示（沿用 1025-04，没有改回灰掉）；术后管理页 = 原来的 `careBody`（按施术分组、［全部预约］、在韩国做 / 回印尼做、已约［修改时间］），预约弹窗就是 `krCbOpen`，数据是主案件的 `careUnits`，所以任何一天的子案件都显示这个主案件没约的术后管理；约好的挂回主案件。付清尾款前预约按钮仍灰（1025-01 规则，没改）。
- **三 KR 未安排预约按客人 × 主案件合并**（todo.js `todoUbKr` / 新 `todoUbListKrHtml`，app.css `.ub6k` `.ub5k` `.ub-sub`）：组 id `gid` = 诊所 id | 主案件 id；组标题「客人名（主案件号）未预约 N」+［全部预约］（= `krCbOpen({all:true})`，先打开主案件术后管理 tab），点标题展开 / 收起；两段——术后管理（施术名称｜术后管理项目｜次数｜建议时间｜地点｜［预约］，同一个项目多次合成一行，`krCbOpen` 的 `one.n` 一次带上这几次）、管理项目（项目｜剩余次数｜建议时间｜地点｜［预约］）；建议时间已过标红；同客人两个主案件分两组；「包含哪些项目」不变（1020-07）；IN 不动。
- 测试：新增 R165a（任意分页：日期范围 / 年份校验 / 离境日前·当天·之后 / 跨年 / 演示时间开关）、R165b（KM1，pcStage 夹具）、R166a（KM1，pcStage 夹具：二 + 三）。

## CMD-1028-09 补充（2026-10-28，追加；取代 CMD-1020-09 / 1026-03 / 1027-12 里 IN 赴韩施术 tab 项目卡「施术项目｜在韩管理｜已完成」、KR 项目 tab 里管理项目分页，旧文字保留作历史）
- 基准 **16fe228**（CMD-1028-08），单个提交（见 Notion 汇报），分支 develop，**未推送**，数据版本不变（56）。
- **新 tab「在韩管理」**（主案件，IN + KR）：有在韩管理项目（`hasMgmtFlow(c)` = `mgmtFlowItems(c)` 非空：赴韩来源的管理项目、已转持有、未取消 / 未更换）才出现；位置在术后管理后面；✓ / ●（`flowMarkOf(c,'kmgmt')`）：韩国行程已结束，或管理项目都用完 = ✓，不挡主案件「已完成」（剩下的留在韩国持有）。内容：IN = 相关子案件 + 在韩管理项目卡（预约中 / 未预约 / 已完成，只读）；KR = 相关子案件 + 项目卡管理项目（`krProjCards(c,{only:'mgmt'})`，KR 可预约 / 本次使用 / 增加项目）+ 备注卡。
- **赴韩施术 tab 只剩施术**：IN 项目卡只有 施术项目｜已完成，KR `krTabItems` 用 `{noMgmt:true}`；相关子案件 / 相关日程只列含施术的天。**相关子案件按流程筛**（`dayFlowKinds(m,v)` → {surg, care, mgmt}，`TAB_VISIT_FLOW`）：每个业务 tab 只列含该流程项目的天，同一天可以出现在几个 tab。
- **状态 / 进程 / 待办**：`mainPendingBook` 加 `mgN`（在韩管理未预约），页头状态卡「待预约」、`mainAttentionOf`（进程「在韩管理未预约 N 项」）、KR 工作台「未安排预约」（`krPendSmall` / `krPendRow`）、预约按钮（`krCbOpen({all:true,tab})`）都把在韩管理和术后管理同等对待；`todoUbKr` 的管理项目［预约］进在韩管理 tab 后打开只带那一项的弹窗。
- 测试：新增 R167a（KM1）、R167b（A1），pcStage 夹具。

## CMD-1028-10 补充（2026-10-28，追加；取代 CMD-1027-12 三 / CMD-1027-14 里离开日期处理窗「保留 = 取消预约、项目留在在韩未预约」、CMD-1026-03 里项目汇总「未预约｜预约中｜已使用」分段与「项目类型」栏、CMD-1027-02 三里子案件 tab 的分栏表格，旧文字保留作历史）
- 基准 **37ff028**（CMD-1028-09），单个提交（见 Notion 汇报），分支 develop，**未推送**，数据版本不变（56；新增可空字段 `c.stayKeep`、术后管理行 `kept`）。第 4 部分是用户 10/28 加入的行为改动，1～3 只改画面。
- **一 项目汇总按状态分二级卡片**（IN `summaryTabHtml` / KR `krTabSummary`）：外层卡不变，里面按状态 使用中 → 未使用 → 韩国持有 → 印尼持有 → 已完成 → 已取消 → 已退款（`SUM_STATES`）分组，没有项目的组不显示，每组「状态 N」+ 一张圆角小卡；栏位 项目名称｜业务类型｜购买时间｜使用时间｜使用次数，状态栏拿掉；上方胶囊筛选照旧。KR 状态沿用 `summaryRowsOf` 的 `status`；IN 的状态由 `sumStateOf` 从原来的分段推：使用中 = 预约中 / 今天要用，未使用 = 没预约，韩国持有 = 行程结束后没用完的在韩管理 / 韩国术后管理，印尼持有 = 本地项目没用完 + 行程结束后转印尼的术后管理（**这是我的判断，未经确认**）。KR 另有「已转出」组放最后，免得丢。
- **二 / 三 子案件 tab**：`visitStateText` 把「客人已离店」改「已结束」；行样式改成「相关子案件」那种（`subVisitRowHtml`：状态标签｜日期时间（韩国 / 印尼）｜业务类型 ·｜子案件号灰字｜［查看内容］），保留 进行中（今日）/ 已预约 / 已完成 / 已取消 分组；原来的序号 / 日期 / 地点 / 状态 / 财务 / 对接院长 / 开始 / 结束 / 更新 分栏拿掉；KR 看印尼的天不再写「（只读）」，只读规则不变，tab 顶部说明保留。行里的状态标签沿用相关子案件的用词（进行中 / 已预约 / 已完成），所以已结束的天标签写「已完成」（**我的判断**：按任务页第 3 部分的例子；第 2 部分的「已结束」落在 `visitStateText`）。
- **四 改离境日时逐项选择超出行程的项目**：原来已有这个弹窗（IN `inStayResGate`、KR `krStayResolveGate`，选项 提前做 / 回印尼做 / 保留，IN 多一个「请 KR 提前做」），但只列**已经约好**的预约，「保留」= 取消预约后项目回到未预约（所以 Gabby 的 4 项又回到 KR 工作台「未安排预约」）。现在：`stayConflictInfo` 还列出**还没预约、建议日期在离境日当天或之后（或根本没有建议日期）**的术后管理 / 管理项目（没保留过的；管理项目每剩一次一行），每项必选；提前做 = 当场约（`coreCareBook` / `coreUnitBookUse`，休诊 / 营业时间硬挡）；回印尼做 = 只有「韩国或印尼」的术后管理，交给印尼并通知 IN；**保留** = 已有预约先取消，项目记进 `c.stayKeep`（`'care|施术项目|第几条':N` / `'mg|iid':N`，N = 保留几次，总是名额里建议日期最晚的 N 个，按没预约的数量封顶）。保留的：不进 KR 工作台「未安排预约」/ 待预约提示 / 待办（`careSlotList(c)` / `krCbMgItems(c)` 默认不含保留的，`{all:true}` 全部、`{kept:true}` 只看保留的），在主案件术后管理 tab、在韩管理 tab（KR / IN）、子案件项目卡（KR）里另分一组「保留 N」；KR 仍可在「保留」组或项目卡手动［预约时间］（`krCbOpen` 的 `one` / `mgmtOne` / `kept` 会把保留的也列进去），约了就回到预约中、保留自动少一个；按［韩国行程结束］仍照现有规则（`tripLeftList` 用 `{all:true}`：管理项目 → 韩国持有；术后管理逐项选转印尼 / 留着）；没选完关掉弹窗 = 离境日不改；Timeline 记「离境日从 X 改到 Y，超出行程的项目逐项处理：每一项选了什么」。**没有自动判断**，只按室长选的。
- 测试：新增 R168a（KM1，pcStage：三种选项各一次、必选校验、保留不进未安排预约 / 待办 / 待预约、各 tab 的保留组、手动预约保留的、行程结束）、R168b（A1 / KM1：项目汇总分组、子案件 tab 行样式）、R168c（A1：IN 弹窗）；因这次有意改动更新 R110a / R147a（子案件表 / 项目汇总的栏位断言）。

## CMD-1028-11 补充（2026-10-28，追加；取代 CMD-1027-01 A 里非施术日子案件页「项目卡（含术后管理）平常不显示、按［增加今日项目］才展开」，旧文字保留作历史）
- 基准 **3aa9347**（CMD-1028-10），单个提交（见 Notion 汇报），分支 develop，**未推送**，数据版本不变（56），只改画面。
- KR **非施术日**的子案件页（`krSubPageHtml` 今日项目 tab）：术后管理**一直显示**（`krDayCareCardHtml`：条件 = `pcmModel` 里有预约中 / 未预约 / 保留；一天都没有未做的术后管理 → 不显示），内容就是 CMD-1028-08 二的那一块（`krProjCards(c,{only:'care'})`：按施术分组、［全部预约］、在韩国做 / 回印尼做、已约［修改时间］、「保留 N」组，同一个预约弹窗 `krCbOpen`），放在到院卡下面。［增加今日项目］其他行为不变：展开的项目卡（`krProjCards(c,{care:true,noCare:true})`）去掉里面的术后管理 tab 以免重复，施术 / 管理项目照旧只在展开后显示。施术当天的子案件页不动。
- 我的判断（未经确认）：这块在非施术日的**每一天**都显示（不限今天，过去 / 未来的到院日也有；已结束的日子整页只读，按钮灰）；IN 看的韩国天、印尼的天不加。
- 测试：新增 R169a（KM1，pcStage 夹具）。

## CMD-1028-12 补充（2026-10-28，追加；取代 CMD-1027-12 二 / CMD-1028-08 一里「离开当天及之后都不能约」、CMD-1028-10 里子案件标签「已完成」与「无限延期」，旧文字保留作历史）
- 基准 **dc0e2a5**（CMD-1028-11），四个部分各一次提交（一 b4decc2、二 8454f38、三 fe6629a、四 b257a34），分支 develop，**未推送**，数据版本不变（56）。
- **一** 子案件结束的天，标签一律写「已结束」（子案件 tab 和各流程 tab 的「相关子案件」：`tabVisitsHtml` / `subVisitRowHtml`）；取消 / 未到店照原词。
- **二 离开当天改「提醒后由室长确认」**：`stayRel(c,日期,时间,[离境日,离境时间])` → before / same / after；离境时间之后（含之后的日子）才不能约（`stayDayBlockText`，文字「这个时间不能约」）；离境当天、离境时间之前（或没填离境时间的离境当天）= `stayDayConfirmText`「客人当天 HH:MM 离境，请确认来得及」→ ［取消］［确认预约］（`krOffConfirm`）。接入：KR 预约弹窗（`krCbRel` / `krCbGone` / `krCbSameDayText`，`KR_CB.outTime`；「韩国或印尼」的项目只有 after 才自动改回印尼做）、单行［修改时间］（`krTimeEditSave`）、整天改时间（`pcmDayEditSave`）、单条预约（`krBkdSave`）、改离开日期弹窗里「提前做」选了离境当天（`krStayResSave`）。**超出行程只算离境时间之后的**：`stayConflictRows` / `stayConflictInfo` / `coreStayResolve` 都带离境时间；没有时间 = 离境当天的不算；建议日期正好是离境当天的未预约项目也不算（我的判断：日期没有时间，当天约的时候再由室长确认）。休诊 / 营业时间仍硬挡。
- **三 改离开日期弹窗补强**：上方写「新的离境：MM/DD HH:mm」（没填时间有提示）；没有建议日期的项目（例：热玛吉）多一个选项「这趟还会做（之后再约）」（mode `will`，只有这类能选；维持未预约、留在 KR 工作台未安排预约；下次再改离开日期仍会再问，和保留不同），其余选项 提前做｜保留（「韩国或印尼」再加回印尼做）；每项必选；IN 弹窗同。
- **四 「无限延期」并入「保留」**：调查——CMD-1015-22 的「无限延期」勾选一直还在［修改时间］小弹窗（`krTimeEditRender`，只有术后管理 / 增加项目行）里，没有被拿掉；用户看不到是因为 CMD-1027-09 把主案件「术后管理」tab 的［修改时间］换成整天改时间弹窗（`pcmDayEditOpen`，没有这个勾选），只有子案件项目卡 / 到院卡的单行［修改时间］才有。旧数据：延期的行 = subItems 里 `postponed:true + skipped:true + postponedFrom`，快照 `c.visitPostponed[到院key]`，全部延期的到院 `c.visitEnds[key].reason`。现在：用词全部叫「保留」（勾选、状态「已保留」、「全部保留」结案、Timeline、通知）；延期 / 保留都记 `c.stayKeep`（`stayKeepRow`）；旧行由 `migrateOldPostpone` 并进来（`repairVisitState` 里跑，幂等，标 `keepMig`）。手动：术后管理 tab、在韩管理 tab、子案件项目卡（含非施术日的术后管理块）每个**未预约**行有［保留］，保留组每行［预约时间］［取消保留］（`krKeepBtn` / `krKeepToggle` → `coreKeepSet`：整行一起保留 / 取消，Timeline 记「保留：… / 取消保留：…」），KR 才有、IN 只读；从保留组预约，保留自动少一个（`krCbOpen({kept:true})` → `stayKeepDec`）。定稿「术后管理超过建议时间一个月 → 转管理项目」（`careOverMonthSweep`）只看印尼行，不看 `stayKeep`，所以对保留的项目照样适用（保留的 KR 名额本来就不在它的范围里）。
- 测试：新增 R170a（离境当天规则）、R170b（弹窗补强）、R171a（手动保留 / 迁移）；更新 R157a R165a（「离开当天不能约」→ 提醒后确认；Timeline 文字）、R168a（提前做的日期）、R22a（「全部延期」→「全部保留」）。

## CMD-1028-07 补充（2026-10-28，追加；只改测试工具；旧文字保留作历史）
- 基准 **48e2296**（CMD-1028-12 之后），分支 develop，单个提交，**未推送**，数据版本不变（56）。
- **测试覆盖页「演示时间」卡新增［到第二天 10:00］**（coverage.js `demoNextDay`）：一天 = 印尼时间（雅加达）10:00 开始到第二天 00:00。按一次 = 先把演示时间拨到下一天 00:00:03（经过 00:00）→ 4 秒后拨到下一天 10:00（韩国 12:00），之后照常往前走。写 `gmc_cfg_demotime`（保留还没到的自动恢复点），所有分页同步。旁边［今天 = 第 1 天］、状态行「演示第 N 天 · MM/DD（周X）」（起点存 `gmc_cfg_demoday`；［设定并开始］自动把起点日记为第 1 天；［立刻恢复真实时间］清掉）。过 00:00 时各分页立刻扫描（todo.js `demoJumpSweep`，监听 `storage` 的 `gmc_cfg_demotime`；后台分页的定时器会被浏览器降速，storage 事件不会）：IN = 关账 / 没东西确认自动结束（`visitSweep`）、超过建议日期一个月转管理项目、主案件自动状态、未到店判定；KR / IN = 过离开日期自动结束行程（`tripAutoTick`）。旧的 `shiftOneDay`（页面上本来就没有按钮，只剩函数）删除，按钮合并进新按钮。
- **测试覆盖页新增［清空案件和客人（保留基础设定）］**：先下载完整备份 → 设 `gmc_cfg_wipecases` 旗标并删 `gmc_demo_ver` → 已开的原型分页收到通知刷新，走 data.js 版本升级路径（那一行 `oldV < 44 || wipecases` 丢掉案件 / 客人，先存 `gmc_cfg_usersafe` 安全备份）；账号、诊所 / 医院设定、用户改过的项目库 / 活动价 / 案例保留，案件号从 A000001 重来。登录页原有的「全部清空」（`gmcResetAll`）不变：它会把设定也退回种子默认值（实测诊所设定改过的值会回到默认），要保留设定请用测试覆盖页这个按钮。

## CMD-1028-13 补充（2026-10-28，追加；取代 CMD-1028-09 里 IN 的「在韩管理」tab、CMD-1019-23 / 1021-11 里麻醉同意书「占位文案」，旧文字保留作历史）
- 基准 **f838f07**，三个部分各一次提交（一 6d32f0e、二 a7bc2a7、三 2324310，测试 + 文档另一个提交），分支 develop，**未推送**，数据版本不变（56，没有改资料结构）。
- **一 麻醉同意书可点开看全文**：`anesLink()`（rules.js）= 带下划线的链接，`openAnesConsent()` 弹窗 `#anes-text-overlay`（只读，［关闭］）。全文照 Notion「Data Retention & Consent」页「赴韩施术 · 麻醉事前说明与同意书（草案，2026-10-28）」（开发交接 06 / 00 都指向这份草案的所在页；Change Request「分期最终由开发决定 + 麻醉同意书草案」写明）；草案提示照抄（待 KR 医院与法务确认、不取代医院正式同意书）；第一段基本信息自动带案件资料（客人、案件号、出生日期、医院、施术日期、施术项目、预定麻醉方式，空着的写＿＿＿，护照号不印），空腹小时取项目 `anesthesia.fast`。版本 `ANES_CONSENT_VERSION` = 'v0.2（草案 2026-10-28）'（Notion 页没写版本号，这是我标的；旧案件记录里的 v0.1 不动）。改了 5 处：IN 确认付款弹窗（`ui.js` 标题 + 勾选框）、KR 在韩加项确认付款（`krPayOpen` 标题 + 勾选）、KR 尾款确认付款（`krSettleOpen` 标题 + 勾选）、KR 付款后「确认麻醉同意书」弹窗（`krAnesOpen` 标题 + 正文）、KR 待付款项目［修正］弹窗的勾选。勾选框 / 记录版本和时间的逻辑没动。
- **二 已到店 / 已到院的预约块变灰**（和已结束同一种灰 `opacity:.5;filter:grayscale(1)`）：IN 本院日程（`eventChipHtml`：`vstate==='已到访'`）、IN 的 KR 医院日程（`krItGrey`：state 以「已到 / 已完成」开头，日 / 周 / 医院小标签 + 月视图行 `g`）、KR 日历与院长工作台日历（`krcEvents` 给施术块加 `arrived`，`krcBlockHtml` / `krcChipStyle` / 月视图行）。撤回后自然恢复（状态现算）；未到店 / 取消仍划掉。
- **三 IN 主案件「管理项目」tab**：IN tab 顺序 …赴韩施术｜术后管理｜**管理项目**｜子案件｜项目汇总…（key 仍是 `kmgmt`，IN 的标签改「管理项目」，KR 的标签仍是「在韩管理」）。内容 `inMgmtTabHtml(c)`（data.js）：**在韩管理**段（`mgmtFlowItems`）：项目｜次数（剩 N / 共 M）｜状态（待付尾款 / 待付款（在韩加购未付）/ 在韩持有 / 预约中 / 已完成 / 韩国持有 / 保留）｜预约时间｜来源；**本地管理**段（`localMgmtBatchesOf`：这个主案件和它的子记录买的批次）：持有中 / 已完成，项目｜剩余次数｜购买日期｜来源（单品 / 活动价 / 套餐 / 서비스 / 置换，`localBatchSrc`），点开看每一次使用（日期 + 次数 +［查看案件］= `sumGoCase`）。只读，没有预约 / 使用按钮；两段有一段就显示 tab，没有的那段不显示；✓ / ●：`flowMarkOf(c,'kmgmt','IN')` 另含本地项目有没有用完。**付定金那天起就列出**：`mgmtFlowItems` 原来要 `heldOver`（付清尾款 / 在韩加购才有），现在也包含「付定金批次已付、`mgmtPlan` / 本地管理」的项目（`itemBatchPaid`）；KR 的「在韩管理」tab 因此一买就出现，项目卡里这些行写「待付尾款」（`待付款` 只留给在韩加购未付的）、［预约时间］灰（`krCbMgItems` 仍要求 `heldOver`，付清尾款后才能约，1025-01 规则不变）。本地项目的使用仍在当天子案件按［本次使用］，记在那一天的子案件（`b.usages[].caseId`）并出现在这里的使用纪录里。KR 看不到本地段。
- 测试：新增 R172a（A1，stageC 夹具）；R167b 三条断言跟着 IN tab 改名（改前 → 改后：「术后管理 ｜ 在韩管理 ●」→「术后管理 ｜ 管理项目 ●」、「在韩管理 ✓」→「管理项目 ✓」、「没有 在韩管理 tab」→「没有 管理项目 tab」）。

## CMD-1028-14 补充（2026-10-28，追加；旧文字保留作历史）
- 基准 **9f1f6ac**（CMD-1028-13），八个提交（一 7a3735e、二 de0502b、三 99c3935、四 044430c、五 c0b0348、六 32acad1、七 489bcdc、八 a423a57），分支 develop，**未推送**，数据版本不变（56）。
- **一** KR 时间冲突弹窗文字按类型写（面诊 / 复诊评估 / 使用 / 院长操作，不再一律写「到院」「施术」），按钮右对齐（`krClashHead`）。**二** KR 预约弹窗红框每项可［保留］（`krCbKeep`，存进同一份 `c.stayKeep`，`coreKeepUnits`）；第一次填在韩期间的逐项选择弹窗本来就覆盖。
- **三（bug）** KR「客人还没到」待办：只看这一行有没有 `arrived`，没看这次到院的状态（`todo.js` `krTodayVisits` 循环）——这次到院里别的行已到院 / 做完（`coreVisitState` 为 arrived / done）后，另一行仍出提醒。改成看到院状态。
- **四** 院长 / 代表院长：待办只留面诊 / 复诊评估类（+ 待施术参考名单、被 @ / 未接来电），拿掉「院长操作」待办（取代 CMD-1020-05）；没有「未安排预约」分页（`todoPaneHtml` 的 `noUb`）；日历已到院 / 已完成块变灰不划线（`krcBlockHtml` / `krbook.js`），只有取消 / 未到划线。
- **五（bug）** ① 改时间后待办没重算：`postcareDueList` 和 KR `pcdue` 只看「建议日期过了」，不看这一项是否已被预约（`inCareBooking`）→ 已约好的不再算过期（取消预约后回到过期）；② 「今天来访」0：待办 `mine` 只认「我操作过」，代约的预约没人操作过，「只看我的」时被漏掉 → 没人操作过 / 所属主案件是我的都算我的；KR「今天到院」同（没有 KR 负责室长时）；③ 日历块变灰：KR 日历按 `krcIsPast` 过了时间就灰，改成只有已到院 / 已完成才灰，IN 本院也一致，过时没到仍原色，KR 标了未到院才划线。
- **六** IN 子案件页「当前状态」写这一天实际在做的事（`subPageActive` 时 `visitStateText` + 当天业务类型），不再写主案件阶段（本地管理 · 选择项目）；没有剩余项目时不显示「剩余项目」卡（`inContRestHtml`，本地管理 tab 且还能添加时保留）。
- **七** IN 术后管理那一天子案件页头：去掉［增加面诊］（所有子案件页头一律不出），加［增加项目］（`inAddItemOpen`：购买本地项目 / 使用持有项目；顺序 对话｜增加项目｜客人离店）；到访 tab 来访目的可勾［复诊评估］（`addRevisitToDay` / `revAddConfirm`：当场增加并送 KR，取消 = 还原；接待确认后来访目的本来不能改，所以放在到访 tab）。
- **八（bug）** IN 在施术时间确认后、到院前点［取消项目］只把项目标成已取消（`ui.js confirmRefund`），施术一行（`kind:'施术'` 子项）内容不重写，KR 施术当天「进行项目」按这一行内容拆行，已取消的项目仍显示「待做」+［操作完成］。新增 `coreAfterItemsRemoved`（术后管理一起取消、麻醉同意书不用确认、施术一行 + 院长占用时间重算），IN 取消走它；KR 行显示加守卫（`krRemovedRow`：已取消 / 已更换只显示一行）；旧数据启动修复 `repairRemovedItems`（IN `boot-in.js` / KR `krBoot`，幂等）。KR 评估那几条路（无法施术 / 更换）原来就会收尾。
- 测试：selftest 新增 R174a / R175a / R176a / R176b / R177a / R178a / R179a / R179b。

## CMD-1028-16 补充（2026-10-28，追加；取代「升级前先把用户案件另存一份 carry 再清存档」在容量不够时直接停下的做法，旧文字保留作历史）
- 基准 **12bb0e9**（CMD-1028-14），单个提交（见 Notion 汇报），分支 develop，**未推送**，数据版本不变（56）。
- **原因**：升级 / ［清空案件和客人］要先把用户案件整份提取成 `gmc_cfg_carry` 再清存档；存档快满（实测填到 91%、560 个案件）时，carry 和正在用的存档大小差不多放不下两份，`gmcStoreCarry` 失败 → 停在「数据升级已停止」，清空同样（清空走同一条升级路径，旗标 `gmc_cfg_wipecases`）。另外多分页时旧分页可能把旧状态写回。
- **修法（data.js / store.js / coverage.js）**：① 腾空间分层 `gmcFreeLevel(n)` / `gmcSetRoom(key,val,maxLevel)`：1 = 旧的自动备份 `gmc_backup_*`、2 = 测试缓存（`rt_res_` / `rt_st_` / `__T2_` / `gmc_cfg_stsnap` / `gmc_cfg_stfix` / `gmc_cfg_rawsafe`）、3 = 用户案件安全备份 `gmc_cfg_usersafe`（只在存 carry 时用，清空模式不动它）；**永远不碰 `gmc_state` / `gmc_clinic_*`**。② carry 存不下时：已有保险（下载过完整备份 `GMC_UPGRADE_BK`，或安全备份 `safeN>0`）→ carry 暂存内存 `window.GMC_CARRY_MEM`，`carryRestore` 从内存取；没有保险 → 停下，不动存档、不丢案件。③ 清空模式没有保险也停（`gmcCarryDropCases` 改为返回新对象，不改原 carry，先存完整安全备份）。④ 停下时红条（`gmcShowBlock`）写明原因 + 当前存档用量 +［下载备份］［继续升级］（下载后才能点；点了带 `sessionStorage gmc_upgrade_ok` 重载，清空的旗标 `gmc_cfg_wipecases` 到成功才移除）。⑤ 纪元守卫 `gmc_cfg_epoch` / `GMC_EPOCH`：升级 / 清空成功换新纪元，旧分页写档前发现纪元变了就不写、重载（`GMC_EPOCH_STALE`）。⑥ `gmcResetAll(…, true)` 保留用户案件时 carry 存不下会拒绝并提示先下载备份（什么都不动）。⑦ 测试覆盖页新增一行「存档空间：已用 X MB / 约 5 MB（pct%）」，≥80% 橙、≥90% 红 + 提示，列最大的 3 个键；［清空案件和客人］先下载完整备份再置旗标。
- 实测（隔离端口，自建 560 案件填到 91%）：旧版本升级 → 红条停下，下载 + 继续后完成（版本 56、560 案件迁移、设定保留、新纪元）；清空 → 完成（案件 0、设定保留、备份保留）；无保险的清空 → 停下；正常容量升级 / 清空照旧；旧分页写回被纪元守卫挡住。
- **我的判断（待确认）**：存档上限按约 5 MB（5,242,880 字符）估算；carry 暂存内存只在刷新前有效，所以必须先有下载文件 / 安全备份才允许。
- 测试：selftest 新增 R180a（腾空间分层 / carry 不被改 / 用量文字）。

## CMD-1029-02 补充（2026-10-29，追加；取代 CMD-1015-11 / 1028-07 里测试覆盖页「演示时间」的韩国时间单输入、「到真实时间自动恢复」，旧文字保留作历史）
- 只改测试工具（`coverage.js` 演示时间卡、`rules.js` `demoClockShiftMs`），分支 V4，不动产品规则、数据版本不变（56）。
- 印尼 / 韩国两组时间并排双向换算（时差按雅加达 UTC+7 与韩国 UTC+9 = 2 小时，跨日一起变）；状态行大字同时显示两边（每秒走）；输入框默认带入现在的演示时间。拿掉「到真实时间自动恢复」：演示时间一直有效，直到按［恢复真实时间］（旁边每秒显示真实的印尼 / 韩国时间）；**旧存档 `gmc_cfg_demotime` 里的 `restoreUtc` 一律忽略**，演示时间照旧继续（没有重置）。
- ［到第二天 10:00（印尼）］以现在的演示时间为准（没开演示 = 真实今天），先经过 00:00 再到下一天印尼 10:00；设定 / 恢复时如果新时间比现在的演示时间早，弹窗「时间会往回调…」［取消］［仍然设定］（右对齐、主操作最右）。
- 我的判断（未经确认）：时差固定按雅加达（巴厘 +8 的诊所不跟着变）。

## CMD-1029-03 补充（2026-10-29，追加；旧文字保留作历史）
- 分支 **V4**，基准 50bbd48，五个部分各一次提交（一 13e10da、二 7041780、三 6b0252e、四 9c578f6、五 823d603），不推送不合并，数据版本不变（56）。
- **一 页头两边时间**（ui.js `dashClockText`）：IN「雅加达 10/29（周四） 11:10:15｜韩国 13:10」，KR / 院长「首尔 10/29（周四） 13:10:15｜印尼 11:10」；另一边跨日加日期；城市取页面时区的城市（巴厘显示「登巴萨」）；「演示时间」标记、天气照旧。
- **二 bug：「诊疗方案已出」没进 IN 待办**：原因——客人在方案出来之前按了［客人离店］，案件按「仅出报告」结束（`visitClosed` + `isEnded`），`inTodoItems` 对已结束案件一进来就 `return`，「面诊资料已到：联络客人选项目」待办根本没生成；弹窗通知是 `coreSubmitReport` 直接发的，不看案件状态，所以只有弹窗。现在（todo.js）：仅出报告、方案已到、没选项目、结束原因不是明确的「客人不做了 / 客人不做项目」（`endedPlanDeclined`）→ 照样生成这条待办，点了去面诊 tab，行尾［客人不做］（`ackKey 'plandecl'`，记 Timeline）才消失；IN 选了项目、或结束原因本来就是客人不做，也消失。复诊评估「结果已到」查过：正常 / 客人离店 / 00:00 自动结束三种都有待办，只有 IN［确认结案］后才消失（设计如此），不是同一个问题。
- **三 仅办理退款案件页**（rules.js `isRefundOnly`；data.js `refundOnlyBodyHtml` / `refundOnlyRows` / `refundOnlyAmountText`；ui.js `renderCaseBody` 提前分支）：tab 只有 基础资料｜结算｜Timeline；基础资料只放基本信息（只读，没有到访目的 / 取消接待 / 确认）；结算 = 退了哪一批 / 金额 / 原因 / 记回哪个购买案件（链接），退款方式系统没有记录（只记金额和原因），页面如实写「方式：系统未记录」；页头 / 列表 / 客户页 / Timeline 结案记录统一写「已结束 · 仅办理退款」（`caseStageInfo` / `terminalBadge`），财务栏写「已退款 + 金额」，案件列表归「已完成」tab；内部 `stage` 仍是 `cancelled`（`computeOutcome` 不变，`hasRefundMark` 等不受影响）。
- **四 服务类型弹窗「使用之前购买的项目」**：拿掉案件下拉，改只读清单（`fuHoldList`：项目名称｜剩几次｜购买日期），本地持有批次 + 转到印尼的术后管理，不同案件买的全列；韩国持有不列；没有可用的则整项灰掉。
- **五 bug：使用之前购买的项目挂进已完成的主案件**：原因——CMD-1026-07 的规则是「持有在赴韩主案件里的 → 回到原主案件加子案件，只有本地持有的才开新案件」，Betty B 的 A000002 还有在韩持有项，所以走了 `joinMain`：加子案件 A000002-08、把已完成的主案件重新打开，`linkedCase` 的原因是空字符串所以页头出现「关联：A000002 ()」；到访目的沿用了一般案件的「面诊需求 + 苦恼必填」。现在（`followupAskDone` local 分支）一律开新的独立案件：`c.usePrev` / `c.boughtFrom`，不 `joinMain`、不设 `linkedCase`，原主案件不动；`relLinks` 写参考链接（「关联案件」卡照旧）；页头「A000009 · 来自之前购买的项目（A000002）」；到访目的只有 메타뷰（必填）｜苦恼（选填）｜预算（选填）｜上传附件（选填），`confirmMaterials` 只查 메타뷰；持有项目行写「购买于 A000002 · 10/09」（`holdSrcTag`）。副标题空括号一并修（原因为空不再写括号）。**旧资料没有自动修**，见汇报。
- 测试：新增 R181a（A1 分页）；回归对照 V4 基线 50bbd48。
- 因第 5 部分规则有意改变而更新的旧用例：R117a（持有项目不再加入当初买的主案件）、R133b（赴韩持有不列、本地持有清单只读）。

## CMD-1029-04 补充（2026-10-29，追加；旧文字保留作历史）
- 分支 **V4**，基准 0380de9，不推送不合并，数据版本不变（56）。「使用之前购买的项目」开的独立案件（`c.usePrev`）本地项目 tab 的「是否使用持有项目？」清单加［购买其他项目］（`usePrevBuyOk` / `usePrevBuy`，data.js）：按钮同一排 ［购买其他项目］［本次不使用］［使用项目］（主操作最右，`holdingsUseHtml`）；打开和一般本地选购同一个弹窗（`lmBuyModalRender` + `localPurchaseHtml(c,'lm')`，单品 / 活动价 / 套餐 / 서비스），结算走 `lmSettle`（确认付款 → 客人持有 + 记在本案件 `c.localMgmt.batches`，结算 tab 出现）；买完弹窗关掉回到清单（`lm.fromUsePrev` / `step:'usePrevDone'`，`lmSettleDo` 与 `lmNoBuy` 各加一个分支），新买的项目当天可接着用，持有行写「购买于 本案件号」。已使用状态的面板（`mgmtActiveHtml`）里「继续选购项目」对这类案件改名［购买其他项目］走同一个弹窗；「本次不使用」后进入的就是一般本地选购画面（原有流程）。**到客人离店前**：本案件只要没结束就能按；但本地案件「持有项目全部标完成」时会按原规则自动结案（`markMgmtRows` → `autoFinish`），结案后没有入口——没改这条结案规则，见汇报。
- 测试：新增 R182a；回归对照 0380de9：A1 全套只多 R182a，KM1 / KD1 批次一致（R83a 旧问题，两边同样失败），roletest 8 个账号 0 不符。

## CMD-1029-05 补充（2026-10-29，追加；取代 CMD-1022-06 / 1019-xx 里「沿用原诊疗方案 = 面诊 tab 只读卡 `reuseReportHtml`」，旧文字保留作历史）
- 分支 **V4**，基准 2aeeb1b，不推送不合并，数据版本不变（56）。**bug 原因**：继续面诊（沿用原方案）会 `joinMain`，原案件（仅出报告的主案件）因为有了这个子记录就算「升级」（`isUpgraded`），子记录的面诊 tab 在升级后走 `consultReportV2Html`（只读摘要，没有选项目区块），`consultTabHtml` 对沿用方案的案件更是先返回只读卡 `reuseReportHtml`；子案件页又没有「赴韩项目」tab（要先付定金才有），所以选项目的入口哪里都没有；方案页［查看方案 →］只是 `switchCaseTab('kr')`，又回到面诊 tab（绕圈）。
- 改法：`consultTabHtml` 沿用方案且 `report_ready` 时走正常面诊的画面（面诊 + 已出方案 +「沿用自 A000xxx · 原方案 MM/DD · 不收面诊费」+ 报告卡［下载］［查看方案］［收起 / 展开］+ 小链接「查看原案件」+ 价格已更新提示）；`consultPlanOpen` 对沿用方案不把预填的 `recommended` 算 Step 2（要按［查看方案］才进）；`reuseStepOn(c)`（沿用方案的子记录、还没有结算单）时不走升级版只读，子案件页面诊 tab（`subTabBodyHtml`）Step 2 后面挂 `krTabContent`（同一个选项目区块）；方案页［查看方案 →］改接 `reportViewPlan()`；`applyReuseReport` 把 `c.reportDate` 设成原方案日期、`reuseReport.usedAt` 记沿用那天，方案页「出具日期」显示原日期 +「（沿用于 MM/DD）」。
- **付定金后升级的是哪个案件**：主案件（被继续的原案件，例 A000010）。子记录（A000010-02）选项目、付定金，付款成功后 `reuseHandOffToMain(c)` 把赴韩项目和结算单整体交给主案件（批次号接着主案件往后排，`c.paidOnMain` 留说明），因为 KR 和主案件的赴韩施术 tab 都只读主案件；主案件进入赴韩施术阶段、定金记在主案件。选本地项目则留在子记录（客人持有）；客人不做 → 子记录仅出报告。
- 测试：新增 R183a；回归对照 2aeeb1b 无新增失败。

## CMD-1029-06 补充（2026-10-29，追加；取代 CMD-1029-03 第 4、5 部分里「赴韩疗程持有也列进『使用之前购买的项目』」、CMD-1029-04 我的判断 1「持有项目全部标完成自动结案」、CMD-1029-05 我的判断 1、2「继续面诊定金结算单交给主案件」，旧文字保留作历史）
- 分支 V4，基准 705eb48 之前为 3072f21；四个提交：**一** 705eb48、**二** 82f69d6、**三** 4085265、**四** 3d7046d；**未推送**，数据版本不变（56，没有改资料结构，只加可空字段 `batch.viaCaseId/viaCaseNo`、`refund.method/methodNote`）。
- **一** `fuHoldList` 只列 IN 本地持有（CLIENT_HOLDINGS）；只有赴韩疗程持有时「使用之前购买的项目」灰掉 + 小字「要做术后管理请选继续之前的服务案件」（`fuTripHoldOnly`）。
- **二** `notUseThisTime` / `markMgmtRows`（本地案件持有项目都标完成、有购买或术后管理使用）不再 `autoFinish`，改 `localLeaveAsk(c)` 弹窗「今天的项目都做完了。客人是否已离店？」［还没离店］（案件照旧进行中，可继续购买，之后按页头［客人离店］）［已离店］（`localLeaveYes` → `autoFinish`，钱没清照旧不结）。主线还在进行（`mainlineOngoing`）的案件仍不结案。自测里 `localLeaveAsk` 默认自动答「已离店」（`GMC_LOCAL_LEAVE_MANUAL` 关掉测弹窗）。
- **三** 退款服务弹窗加必填「退款方式」现金 / 转账 / QRIS / 其他（其他要说明）：`rsMethodPick` / `refundMethodText`（没有 = 「未记录」）；写进批次 `refund.method`、购买案件 `holdingRefunds`、两边 Timeline、仅办理退款 结算 tab。**结束案件弹窗里的批次退款（`confirmEndCase` 的 hold 退款）这次没加方式**（任务只写退款服务）。自测 `GMC_REFUND_METHOD_MANUAL`。
- **四** `reuseHandOffToMain` 仍把赴韩项目和结算单放主案件 `settlementBatches`（和一般赴韩定金同一套存法），批次多记 `viaCaseId` = 付款那天的子记录；`dayPaidBatches(c)` 找回（旧资料没有 viaCaseId 时按 `paidOnMain.batches` 编号找，**所以旧资料不用搬**）；子案件页 `subDayTabs` 的「结算」tab 恢复、`subSettleTabHtml` 显示这一天的定金；主案件结算卡标题写「记在子案件 A…-02」。

## CMD-1029-07 补充（2026-10-29，追加；旧文字保留作历史）
- 分支 V4，提交 81d6a2e（CLAUDE.md 文档另一个提交），不推送不合并，**数据版本不变（56）**（新增可空字段，旧客人没有 = 空，不猜，不用迁移）。
- 客户预约页（booking.js，IN 室长代约新客也是开这个页）：新客人填完生日后 `bkMinor()`（`isMinorOn(dob, todayStr())`，data.js `ageOnDate` 算到月日，**以建立预约当天（印尼时间）为准**，满 21 岁生日当天算满 21）→ 未满 21 岁出现必选「婚姻状况 已婚 / 未婚」，选未婚再出现必勾「我已通知监护人（父母或法定监护人）」，没选 / 没勾红字挡住（`bkProfileNext`）；改生日 `bkDobChange` 重新判断，满 21 岁就收起并清掉选项。已登记的老客人不走这一步。
- 记录：客户资料 `cl.minorInfo = {bookedOn, ageAtBooking, marital, guardianNotified, guardianAt}`（`submitSelfBooking` 建档时写；之后改到店日期不重算）；预约案件 Timeline 和客户 Timeline 各记一笔。IN `minorMarkText(cl)`：基础资料生日旁 / 客户档案「性别 / 出生日期」旁显示「未满 21 岁 · 未婚 · 已通知监护人（时间）」或「未满 21 岁 · 已婚」，客人现在满 21 岁后不再显示（记录保留）；KR 端不显示。
- 生日建立后不能改：基础资料「生日」行没有［修改］；`openClientEdit('gender')` 对有生日的客人只改性别（生日只显示）；**没有生日的旧资料仍可补填**（我的判断）。
- 测试：selftest 新增 R187a；R70a「生日空 → 挡住」改用没有生日的旧资料；预约页 UI 用 booking.html 脚本验证。

## CMD-1029-08 补充（2026-10-29，追加；取代 CMD-1022-15 / 1026-20 里结束案件弹窗对没用完的批次「转持有 / 退款」二选一，旧文字保留作历史）
- 分支 V4，提交 8363700（第 1、2 部分同一个提交），不推送不合并，数据版本不变（56）。**主原则：购买的项目不退款**；退款只从两处办：客人页退款服务（06 已加退款方式）、赴韩取消选「退钱」。
- 结束案件（`endCaseRows` / `confirmEndCase`）：拿掉退款选项，没用完的本地批次一律转客人持有——弹窗只有一行告知「还有 N 项没用完，会转成客人持有：项目 剩余 N 次。要退款之后到客人页用［退款服务］办」（row key `holdall`，`holds` 列表，无选项）；Timeline 仍记「转为客人持有」；`refundableBatches` 仍可退。
- 赴韩取消退款弹窗（`confirmRefund`）：「处理方式」退钱 / 置换（原来叫「退款方式」，改名避免和新字段混）；退钱（含尾款差额退还 / 不能施术退定金）必填「退款方式」现金 / 转账 / QRIS / 其他（其他要说明），`REFUND_PAY` / `refundPayRender`，复用 06 的 `REFUND_PAY_METHODS` / `refundMethodText`；记 `c.refunds[].method/methodNote`、Timeline「方式：…」、结算单退款行（`settlementCardHtml`，旧资料「未记录」，置换不显示）。
- 测试：selftest 新增 R188a；G3 改成「没有退款选项、一律转持有、客人页仍可退」；自测默认自动选「现金」（`GMC_REFUND_PAY_MANUAL` 关掉）。第 3 部分（其他退款入口盘点）只写在 Notion 汇报，没改代码。

## CMD-1029-09 补充（2026-10-29，追加；取代 CMD-1020-13 / 1019-12 里「施术前 2 天确认行程」「付定金前必须登记护照」，旧文字保留作历史）
- 分支 **V4**，基准 bc12bf5 之前；提交：一 bc12bf5、二 58bfa36、三 7756f1b、四 e82c788、五 f7badcd、测试修正 7c2690c。不推送不合并，数据版本不变（56，只新增可空字段 `krSchedule.tripState/confirmedOn/reconfirm`）。
- **一** 付定金不再要护照（`batchNeedsPassport` 恒 false，付款窗加「签证和入境由客人自行负责」提醒；过期只红字）。**二** 递交施术日期必选行程状态（`setTripState`：已定 booked / 暂定 tentative，已定可填入境·离境）；KR 在页头、日期卡、日历块标「暂定」，不影响流程。**三** 施术前约 30 天 IN 待办「确认客人行程」（`reconfirm`；选项 照原日期 / 改期 / 取消赴韩 / 还没定，还没定 7 天前再问）。**四** `TRIP_CONFIRM_DAYS = 7`（calalign.js）取代所有「2 天」：待办出现、提醒、超时、文字、短信模板（七天后）；［已确认行程］必填 入境/离境 + 韩国时间 + 确认方式 + 护照号码（没有才填）；施术日本来不到 7 天 → 递交日期时 `submitKrScheduleDate` 先弹 `openStayModal(trip)`。**五** KR 按［客人已到院］时护照号码空 → 必填（`krPassNeed` / `krStayArriveOpen` / `corePassportFill`），已有号码只显示核对。
- 测试钩子：`GMC_TRIP_MANUAL`（selftest 包装默认 tripState=tentative）、`GMC_TRIP_NO7`。新增 R189a/b、R190a、R191a、R192b；R40a/R41a 改可选护照；R42a/TD4 按 7 天改。

## CMD-1029-10 补充（2026-10-29，追加；旧文字保留作历史）
- 分支 **V4**，提交 c399484（功能 + 测试 + roletest）、其后一个提交（自测辅助 `ST.autoNik`）、文档一个提交；不推送不合并，**数据版本不变（56）**（客户档案新增可空字段 `nik` / `nikAt` / `nikBy`；旧客人没有 = 空，下次接待时补，不用迁移）。
- **字段与规则**（data.js「CMD-1029-10」一段）：`cl.nik` = 16 位数字字符串（`nikClean` 去空格 / 横线，`nikValid`）；`nikVisible()` = IN 室长 / 管理者（`canDo('work') && !canDo('krwork')`，老板、KR 室长、院长、代表院长都看不到）；`nikCanEdit()` = IN 管理者；`nikMask` 默认只显示后 4 码（`••••••••••••1234`），`nikToggle` 点「显示」才看全部（完整号码不写在 HTML 里，点了才从档案取）；`nikCheck` 格式 + 查重（本诊所 `CLIENTS` 里已属于别人 → 「这个身份证号已属于客人 XXX」；预约页 `forBooking` 用不带对方名字的提示）；`setClientNik(cl, raw, {reason})` 统一写入：第一次登记任何 IN 室长都可以，改已有号码只有管理者且原因必填，原值 → 新值 + 原因写进操作日志（`logOp('其他', …, '身份证号')`，管理者 / 老板可见），客户 Timeline 只记「登记 / 修改身份证号」（登记写后 4 码，不写完整号码）。
- **预约页**（booking.js / i18n.js `nik.*`）：新客人个人资料步骤加「身份证号（NIK）— 选填」+ 小字（印尼文 / 中文）；填了要 16 位数字，重复不能过（红字，不透露对方是谁）；`submitSelfBooking` 再查一次，重复就不存；老客人不走这一步。IN 代约新客就是开这个页，所以同一套。
- **IN 接待**：`clientBasicBlockHtml` 的「身份证号（NIK）」行：客人还没有 → 输入栏 + ［保存］（`nikSaveInline`）+ 小字「请看着客人的 KTP / KIA 当场输入」；`confirmMaterials` 缺 NIK 列入缺项（「身份证号（NIK）」），没填不能确认；已有的显示后 4 码，管理者有［修改］（`openClientEdit(name,'nik')`：新号码 + 原因）。继续（复诊 / 术后）的流程：折叠的基本信息在缺 NIK 时强制展开；继续资料弹窗最上面也有 NIK 输入行。客户档案（IN `cliProfileHtml`）同样只显示后 4 码，旧客人写「未登记 · 下次接待时由室长当场补登记」。
- **KR 端**：`cliProfileHtml` 的 KR 分支、KR 案件 / 客人页都没有 NIK（`nikVisible()` 为假时整行不画）；roletest KR 各账号新增「NIK 完全不显示」一格。**导出 / 打印**：`printKrPlan`、诊疗方案、KR 各页本来就不读客户档案的证件字段，没有 NIK；测试覆盖页的「完整备份」是开发工具，会带整个存档（含 NIK）。
- **客户合并建议（这次没做）**：重复 NIK 现在只能阻止存入；若真有两份档案是同一个人，建议之后做「合并客户」：以 NIK 为主键提示合并，管理者确认，案件 / 持有批次 / 医美史 / Timeline 并到保留的那份，被合并的那份留下操作日志；手机号唯一规则也要一起处理。
- 测试：selftest 新增 R193a；`ST.arrive` / `ST.materials` 默认自动补唯一 NIK（`GMC_NIK_MANUAL` 关掉，`ST.autoNik`）；roletest 加 NIK 可见范围 / 修改权限两格（IN）与 KR 不显示一格。

## CMD-1029-11 补充（2026-10-29，追加；取代 CMD-1022-15 / 1021-xx 里赴韩全部取消后「本地项目只能全部保留或全部退款」、CMD-1029-07 我的判断 2「老客人在预约页不被问」，旧文字保留作历史）
- 分支 **V4**，两个提交：第 1 部分 93b7fab、第 2 部分 e560819（文档另一个提交）；不推送不合并，**数据版本不变（56）**（没有新字段：退款纪录沿用 `b.refund` / `holdingRefunds` 加 `method`，`minorInfo` 沿用 07）。
- **一 赴韩全部取消后的本地项目退款**（ui.js `localKeepChoice('refund')` / `confirmLocalRefundAll` / 新 `localRefundAllToggle` / `localRefundRowSync` / `localRefundPayRender`，in.html 两个弹窗）：保留弹窗上的［全部退款］改名［选择退款］；弹窗列出可退批次（`localPurchasedBatches` 里没用过、非置换 / 套餐内含 / 套餐拆出 / 赠送的单品批次，和 `refundableBatches` 同一套），每行勾选框 + 上方「全选」，勾选的填金额（不超过实付）；有勾选 → 必填退款方式（`REFUND_PAY_METHODS`，其他要说明）+ 原因；勾选的批次整批作废，退款记进批次 `refund`（带 method）、购买案件 `holdingRefunds`（和退款服务同一份）、案件 Timeline、客户 Timeline（含方式）；**没勾的留在客人持有**。一项都没勾 = 全部转持有（等于保留，不用填方式，接着问是否做本地项目）；部分退或还有保留 / 用过的批次 → 接着问是否做本地项目（案件不结案）；全部退完 → 仅出报告（原行为）。没有可退批次 → 提示后只能保留。赴韩项目本身的退钱 / 置换流程不动（自动全部包含）。Timeline 文字「赴韩取消后本地项目退款（全部 / 部分）」取代旧的「室长选择全部退款」（`coverage.js` D28c / D31c 两种都认）。
- **二 老客人预约未满 21 岁再确认**（data.js `minorNeed` / `minorPrefill` / `applyMinorConfirm`；booking.js 新步骤 `minor`；ui.js 代约老客 `addSlotMinorRefresh`）：判断时点 = 建立这次预约的当天（`todayStr()`），不是来店日。已登记老客人：没有生日 → 先补生日（预约页新步骤里填；IN 代约在弹窗里填；补完存进档案）；未满 21 岁 → 婚姻状况带入上次（`minorInfo.marital`，可改），未婚每次都要重新勾「已通知监护人」，已婚不用；满 21 岁不出现、标记不显示（记录保留，07 规则）。通过后每次都更新 `minorInfo`（这次的预约日、年龄、婚姻状况、勾选时间）、客户 Timeline 和预约案件 Timeline 各记一笔。预约页步骤顺序 …个人资料 → **年龄确认**（只有需要时）→ 来访目的…；新客人仍在个人资料步骤里填（`bkMinor()` 不再排除老客人）；`submitSelfBooking` 对老客人也校验（缺项返回 `{ok:false, reason:中文原因}`，预约页兜底显示）。IN 代约老客（`confirmAddSlotExisting`）同一套校验，通不过不建预约；合并进同一天已有预约时也记 Timeline。
- 测试：selftest 新增 R194a、R195a；D28c / D31c 改成先全选 + 选退款方式 + 新 Timeline 文字；预约页「年龄确认」步骤另用脚本验证。

## CMD-1029-12 补充（2026-10-29，追加；取代 CMD-1029-03 一里「只有工作台页头有两边时间」，旧文字保留作历史）
- 分支 **V4**，提交 3053fbd（功能）+ 文档一个提交；不推送不合并；只改画面，数据版本不变（56）。
- **做法**：不另做一套——`headMount()`（ui.js）的 `mkActions` 在页头 `.head-actions` 的最前面（对话图标前面）放一个 `<span class="head-clock" data-clock="1">`，内容就是 `dashClockHtml()`（`dashClockText` + 演示时间标记），原来每秒刷新 `[data-clock]` 的定时器顺带让它走字。工作台（`HEAD_OWN` 里的页面）自己有时钟，不重复放；**天气 `#dash-weather` 本来就只在工作台**，其他页没有。写法：KR / 院长「首尔 10/29（周四） 13:10:15｜印尼 11:10」，IN「雅加达 10/29（周四） 11:10:15｜韩国 13:10」，巴厘诊所「登巴萨 …」，另一边跨日加日期，演示时间生效时后面带「演示时间」小标。
- **窄屏**（app.css `.head-clock`）：`white-space:nowrap`；宽度 ≤ 1180px 时时钟最宽 260px（超出省略号）；≤ 980px 整个隐藏，不挤开对话 / 铃铛 / 头像；`.head-actions` 本身 `flex-shrink:0` 不变。「XX 也在查看这个案件」提示是页头下面单独一条，不受影响。
- **有页头时间的页面**：只要页面走 `headMount`（有页头图标）就有——IN：案件管理（列表 / 主案件页 / 子案件页）、客户管理（列表 / 客户页）、通知中心、项目库、案例库、预约历史记录、诊疗方案页、院长详情、上次项目史、管理类（经营数据 / 账号管理 / 诊所设定 / 短信发送记录 / 操作日志 / 个人设定）；KR / 院长 / 代表院长：案件管理（列表 / 案件页 / 到院日页）、客人管理（列表 / 客人页）、通知中心、管理类（经营数据 / 账号管理 / 医院设定 / 操作日志 / 院长管理 / 项目库 / 案例库 / 个人设定）；老板端 owner.html 的管理类页面。工作台用自己原有的时钟。**不加**：客人预约页 booking.html、登录页、测试覆盖页（不走 `headMount`）。
- 测试：没有新增用例（纯画面）；用脚本分别以 A1 / D1 / OWN / KM1 / KD1 登录逐页检查，每页都有时间且和工作台一致，设置演示时间后出现「演示时间」标记；回归 A1 全套 + KM1 / KD1 批次 + roletest 与上一轮完全一致。

## CMD-1029-13 补充（2026-11-02，追加；取代 CMD-1026-01 二 / 1028-01 里「并进主案件时把刚发的最后一个案件号放回计数器」，旧文字保留作历史）
- 分支 **V4**，提交 11c9979（修复 + 自测 + 覆盖页提醒）、一个自测修正提交、c085028（行 id）、文档一个提交；不推送不合并；**数据版本不变（56）**（新增可空字段 `formerCaseNos` / `batchSeq` / `subSeq` / `rowSeq`；旧资料不改号）。
- **原因（bug）**：预约先拿一般案件号（例 A000016）；客人到店「继续」→ `joinMain` 把它换成子案件号 A000010-02 时，发现旧号正好是「刚发出的最后一个」（`old === 'A'+(CASE_NO_SEQ-1)`）就把计数器减 1（`CASE_NO_SEQ--`，并记 `_seqBack`）；下一个预约就又拿到 A000016。`createChildReservation` 也有同样的 `CASE_NO_SEQ--`（先建一般案件再减回去）；`clearResumeState` 还要靠 `_seqBack` 再把计数器加回去。**R139a 偶发失败的结论**：同一个机制（R139a 里连续 `ST.newRes` + `joinMain`，计数器退到比现有案件号还小，下一个测试建的案件就和已有案件撞号）；单跑时通过、整套里受前面用例影响才露出——基线上跑完 R139a 计数器是 3 而案件号已用到 A000005，修复后是 6。我没能抓到那次偶发失败的原始信息，这是按机制和复现得出的判断。
- **修法**（data.js）：`generateCaseNo` 改成只增不减的计数器：取号 = max(本分页 `CASE_NO_SEQ`、浏览器共用的 `gmc_caseseq`、本诊所现有最大号 + 1)，取完立刻写回 `gmc_caseseq`（多分页同时建预约也不会拿到同一个号；重置 / 升级清掉 `gmc_` 存档时它一起清，`store.js` 的清空路径也 `removeItem`）。删掉所有 `CASE_NO_SEQ--`。并进主案件：旧号**不放回**，记进子记录 `formerCaseNos`（别名），Timeline 写「预约时的 A000016 已并入 A000010，改为 A000010-02（A000016 不再发给别的案件，搜 A000016 可以找到这个子案件）」；#选单 / 对话抽屉的搜索认别名。取消接待：原号一直没发给别人，直接还原（`clearResumeState`，撞号的旧资料才重新取号）。`createChildReservation`：用 `window.CASENO_SKIP` 让 `generateCaseNo` 不取号（主案件下的预约一开始就是子案件号，不占一般案件号、也不回退计数器）。`detachPreChild` 走 `generateCaseNo`。
- **各种编号的发号方式**：一般案件号 A000xxx = 全局计数器（上面）✓；子案件号 -NN（新主案件 `dayNoOn`）= `dayNoSeq` 只增不减，同一天同地点共用一个号（设计如此，所以同一主案件同一天的几笔来访子案件号相同）✓；子案件号（旧主案件）原来 `mainNoMax+1`（取消接待退出后会重用）→ 改 `mainNoNext`（`m.subSeq` 高水位）；项目行 id（A000011#3）→ `c.rowSeq` 高水位；结算批次号 B1… 原来「现有批次个数 + 1」（未付款批次被删后会重用）→ `nextBatchId`（`c.batchSeq` 只增不减，`generateSettlementBatch` 和 `reuseHandOffToMain` 都用）；本地管理批次 L1…（`lm.batches` 随 `c.localMgmt` 一次性对象，只在一次本地管理流程内用，没改）；持有批次没有编号（对象引用）；案件 / 客户 id = 时间戳 + 随机数（不是计数器，同一毫秒同一随机数才会撞，没改）；`PLACEHOLDER_SEQ`（预约占位）是每家诊所一个计数器，两个分页同时建占位仍可能拿到同一个（没改，列出）。
- **旧资料**：不自动改号。测试覆盖页顶部新增提醒（`fillSources`）：扫浏览器里所有诊所分区，同一个案件号出现两次以上就列出「号码：客人（诊所，状态）＋ …」。建议处理：确认哪一个是后来的案件，请开发在后台把后来的那个改成新号（同时在两边 Timeline 记一笔、保留旧号作别名）；系统不自动改是因为改号会动到用户案件。
- 测试：新增 R196a（重现：预约 → 并进主案件 → 另一位客人新预约号码不重复；取消接待 / 主案件下约预约后再建新预约；子案件号 / 批次号高水位；共用计数器被别的分页推高后取号不会更低）。**测试工具说明**：回归用的无头 Chrome 脚本（scratchpad 里的 cdp3.js / runall.sh 等）被清掉了，这次重写了；A1 全套对照基线 782ffc2 用同一套脚本，失败集合完全一致（R21a、R132b 在基线上今天也失败：与日期 / 时间有关）；KM1 / KD1 批次与基线一致（缺夹具的用例两边同样失败）；roletest 8 个账号 0 不符。

## CMD-1102-01 补充（2026-11-02，追加；旧文字保留作历史）
- 只改 CLAUDE.md，不改产品代码，分支 V4。在最上面的「固定规则」区新增「写汇报时要填『影响后端』『影响的动作』两栏」（中英并列），并在「Notion 写入规则」里注明 Code 任务行除「状态」「📥 汇报」外多可改这两栏；规则内容：只改画面层 = 影响后端「否」；动到资料层（栏位、动作及其时机 / 条件、计算、权限、自动规则、发号方式）= 「是」并写影响的动作；动作名以 Notion「开发交接」05 动作卡为准，没有就写动作描述；任务建立时已填的要核对并在汇报写一句；2026-11-02 之前的任务不补填。

## CMD-1102-02 补充（2026-11-02，追加；取代 CMD-1015-05 十一「更新时间 = c.updated」的写死字符串和 CMD-1023-02 里已完成 tab「照最后来访日排」，旧文字保留作历史）
- 分支 **V4**，基准 73264ba（= 036b7e8 的代码），三个提交：第 2 部分 4c4b209、第 1 部分 3cf100a、第 3 部分 45935b6（实际先做了 2，提交顺序和任务页编号不同）；不推送不合并，**数据版本不变（56）**，没有新字段。
- **1 未安排预约点客人名**（todo.js `todoUbListKrHtml` / `todoUbListInHtml`，app.css `.ub-name`）：组标题里的「客人名（Case ID）」是可点的链接（主色 + 下划线），点它打开主案件，三角形仍只管展开 / 收起，［预约］［全部预约］不变。KR：有术后管理就停在 `postcare`，只有管理项目就停在 `kmgmt`（`todoUbKr` 的 base 带 `nameCare` / `nameMg`）；IN 的未安排预约只放印尼术后管理，所以停在 `postcare`（`openCaseDetail(id,false,{tab:'postcare'})`）。
- **2 更新时间（bug 原因）**：案件列表「更新时间」栏显示的是 `c.updated`——**写死的字符串**，`makeCase` 默认就是「刚刚」（`updated:o.updated||'刚刚'`）、种子也写「刚刚」，之后没有任何地方按真实时间更新它，所以每个案件永远是「刚刚」。代码里**没有** `updatedAt` 字段（任务页的推测不成立：打开页面 / 升级 / 修正不会改这个字符串）。**排序**原来用 `caseUpdatedKey` = Timeline 最晚一笔的时间，但包含系统自动写的「修正旧数据 / 修正使用记录 / 00:00 关账 / 超过预计出报告时间」这类记录（启动修复 `repairVisitState` 等每次都可能新增，例 Carry 的「修正旧数据」42 次），会把案件顶到最上面；已完成 tab 另按「最后来访日」排。**会往 Timeline 加记录的函数**（`logCaseEvent`）很多，真动作都算更新；新规则：`caseLogIsNoise(e)` 把系统的 `^(修正旧数据|修正使用记录|修正：|00:00 关账|已超过预计出报告时间)` 排除，`caseUpdatedKey(c)` = 最晚的非噪音记录（UTC），没有就用预约来访时间——**现算，不存字段，所以旧资料不用修、打开 / 刷新 / 升级都不会刷新它**。显示 `caseUpdatedText(c)`（rules.js）：1 分钟内「刚刚」→「N 分钟前」→ 今天「今天 HH:mm」→ 今年「MM/DD」→ 往年「YYYY-MM/DD」（页面时区）；按演示时间 `realNow()` 算；未来时间直接显示日期。IN 案件列表（ui.js）和 KR 案件列表（kr.js 行 `updated`）都用它；三端列表（IN / KR / 院长）和各 tab（含已完成）统一 `caseUpdatedDesc`（新 → 旧）。已完成 tab 的提示文字改「按更新时间排」，仍保留日期筛选。**没改**：客户管理列表的「更新时间」（`CLIENTS[].updated`，同样是写死的「刚刚」，任务只写案件管理，待决定）；主案件的更新时间只看主案件自己的 Timeline，不含子记录的（子记录里的动作多数也会在主案件 Timeline 留一笔）。
- **3 IN 列表进程停在「面诊资料已到：联络客人选项目」（bug 原因）**：IN 和 KR 列表的「进程」本来就是同一个函数 `mainAttentionOf`，只是传入的待办不同（`side` 不同时“等 IN / 等 KR”写法不同是设计）。出问题的是**继续面诊的子记录**（Fanny A000010-02）：选了项目并付定金后 `reuseHandOffToMain` 把赴韩项目和结算单整体交给主案件、**并清空子记录自己的 `settlementBatches` / `recommended`**，而 `inTodoItems` 里「面诊资料已到」待办的条件正是“方案已出且本记录没有结算单 / 没选项目”，于是子记录又满足条件，待办一直挂着，`mainAttentionOf` 把它当主案件的进程。修：条件加 `!c.paidOnMain`（`reuseHandOffToMain` 写的标记）。其他状态（赴韩施术 / 术后管理 / 在韩管理 / 复诊评估）两边走同一套 `caseStageInfo` / `mainAttentionOf`，没有发现单独的 IN 写法。**「KR 已确认施术时间：发送给客人」**待办：`scheduleState==='Confirmed' && !surgMsgSent(c)` 才出现，发送给客人（短信 / WhatsApp）或电话通知后 `surgMsgSent` 为真就消失；Fanny 如果还没按［发送给客人］，它是应该在的——我没法看用户浏览器里的数据，没有改。
- 测试：selftest 新增 R197a（A1，pcStage 夹具）、R197b（KM1，pcStage 夹具）；回归对照基线 73264ba 见 Notion 汇报。

## CMD-1102-03 补充（2026-11-02，追加；取代 CMD-1015-27 / 1013-03 里 Step 2～3-3 的「已付定金项目 / 添加项目 / 到院与尾款」三张旧卡、3-2 的「勾选保留 + 每行更换为下拉」、3-3 的「应退差额 / 不退」和 CMD-1015-27 里评估前的卡片不动以外的版面，旧文字保留作历史）
- 分支 **V4**，基准 8ef00f1，提交见 Notion 汇报；不推送不合并，**数据版本不变（56）**，没有新增必备字段（新增可空字段 `krJudge.refundAmount / refundMemo / compId / compKrw`）。依据 Notion「开发交接」05 的 5-6 第 2 点 / 5-10（11/02）。
- **评估前（Step 1「院长评估结果」）不动**；评估之后三种判断都是**卡片 1「原本方案及判断」**（kr.js `krOrigCard`：上半原定项目 施术 N / 管理 N，被取消 / 换掉的标「（取消）」；下半到院判断 结果 + memo）+ **卡片 2**；旧的独立「已付定金项目」「添加项目」两张卡在评估之后拿掉。`krL2Box(title, body, right)` 新增右上角按钮参数。按钮都在最右，主操作最右。
- **1 原方案不变**：卡片 2「结算」= 结算和添加项目合成一张卡（右上［添加项目］，`krAddChooser(c,'adj',footer,{onlyMgmt:true})` 只有管理项目没有施术 tab，要加施术请选「需要调整方案」）；`krWzSettleGroups` 施术项目 N / 管理项目 N 两块，每行「标签｜项目名」价格靠右，标签「已付定金」「添加项目」；下面 项目合计 / 已付定金（可抵）/ 尾款（在韩国补），最右［结算尾款］。尾款算法不变。
- **2 需要调整方案**：三步，每次只展开当前这一步（`KR_ADJ.step` = pick / add / settle），做完的收成一行摘要 + ［修改］（`krAdjGo`），按了［结算尾款］才锁住：① 选择需要更换的项目（施术 / 管理逐项勾选，勾了 = 取消，什么都不勾也能下一步 = 只增加项目，`krAdjNext`）② 重新选择项目（上半保留项目只读；选择器 = 原来的 KR 项目库 / 管理项目库两 tab，一换多多换一不限，서비스照旧，下一步 `krAdjNext2` 要求保留 + 新选至少 1 项；什么都没勾时标题叫「添加项目」）③ 结算（标签「已付定金」保留的 /「更换项目」换来的 /「添加项目」单纯加的；右上［添加项目］回第 2 步）。`krDoSettle`：拿掉「更换为」下拉和 `coreSwapItem` 路径（`coreSwapItem` 留给旧测试），勾了的项目 = `coreMarkUnable`（先加新项目再取消旧的，所以施术项目可以全部换掉）。加施术项目问延长多久的规则不变。钱：项目合计 − 已付定金（原项目的 30%，被换掉的也算）= 尾款；截图例子 ₩660,000 定金、1,000,000 换 2,000,000 + 1,200,000 保留 → 合计 3,200,000、尾款 2,540,000（R198a）。
- **3 不建议手术**：卡片 2 先二选一「更换时间 / 取消项目」；取消项目 → 卡片 1 全部标「（取消）」→ 三选一：**更换项目**（选择器只有管理项目，不弹「延长施术时间」；新项目比定金便宜时差额转置换额度，`coreSettleBalance` 的 `cheaper` 分支：直接结清，不写「应退差额」，`j.compKrw` / `j.compId`）/ **全部退回**（［确认］，`coreRefundDecision(c,'all')`）/ **部分退回**（金额 > 0 且 < 已付定金 + memo 必填，剩下的马上转置换额度）。**没有「不退」**（旧数据 `refundKind==='none'` 仍照旧显示）。KR 只记判断，IN 室长按现有退款流程退（退款方式必填，CMD-1029-08；`krRefundDeposit` 部分退回用 `refundAmount`）；KR 给 IN 发通知。**置换额度**：新函数 `coreCompCreate(c, krw, reason, by)` 往客人的 `compCredits` 加一笔（IDR = 韩元 × `FX_RATES.KRW_IDR`，不退款、没有期限，客户页看得到）；退回重选（`coreJudgeRevert`）时还没用的额度作废。
- **取消施术后时间段没放掉的原因（bug）**：① `syncSurgeryBlock` 只在「赴韩项目全没了」才拿掉院长日程里的施术块，但换成管理项目后 `krActiveItems` 里仍有管理项目，施术块被留下、按 0 分钟重画（KR 日历 / 院长时间 / 弹窗里「施术时间现在 10:00–11:45」就是它）。现在：施术项目都没了（只剩管理项目）、或 KR 已判断全部 / 部分退回 → 放掉（`surgEver && !surgNow`、`refunding`）。② `syncSurgerySub` 在「没有可写的施术项目」时只有 `anySurg` 为真才拿掉施术行，全换成管理项目后施术行留着旧内容（「施术：埋线双眼皮」）。现在不论如何都拿掉。**这也是 M4「修正旧数据」重复 Timeline 的原因**：施术行留着被取消项目的名字 → `repairRemovedItems` 每次启动都发现它、重写不掉、又记一笔（Carry 的 42 次）；现在被换掉的施术一次就拿干净，`repairRemovedItems` 只在内容真的变了才记。已经记下的旧重复 Timeline 不删。
- 测试：selftest 新增 R198a（A1：钱 / 全换 / 更换便宜 → 置换额度 / 部分、全部退回 / 退回重选 / 时间段放掉 / 不重复修正）、R198b（KM1，stageC 夹具：三种判断的版面）、R198c（KM1，stageC + stageC@C2：真的点［结算尾款］走完调整方案和更换项目）；回归对照基线见 Notion 汇报。

## CMD-1102-04 补充（2026-11-02，追加；取代 CMD-1102-03 里卡片 1 的平铺结构和「更换项目」选择器的外观，旧文字保留作历史）
- 分支 **V4**，基准 a51ccd8，提交 052b40e（第 1 部分）、9fde64e（第 2 部分），文档另一个提交；不推送不合并，**只改画面和文案，数据版本不变（56）**。
- **1 卡片 1 三层**（kr.js `krOrigCard`，app.css 新增 `.kr-l4`）：1 级白底「原本方案及判断」→ 2 级（灰底 `.kr-l3`）「原定项目」，里面 3 级（白底 + 细边线 `.kr-l4`）「施术项目 N」「管理项目 N」（没有写「没有」，被取消 / 换掉的标「（取消）」）+ 2 级「到院判断」（只有两行：「**对接院长：判断结果**」「原因：…」，没填写「—」）；三种判断同一个结构。**对接院长的名字** = `c.director`（例「KD1 院长」），没有对接院长时写「院长」；原来的「KR 判断」标签取消。**「原因」就是原来的 `krJudge.memo` 字段**，只改显示文字（和 Timeline 里已写的「原因：…」一致），字段名和旧资料不动。
- **2 不建议手术 → 更换项目的选择器**：`krAddChooser(c,'adj',footer,{onlyMgmt:true, hint})` 有 `hint` 时左上角不再是单独一行「管理项目」+ 说明，而是和「需要调整方案」同样的胶囊（只留「管理项目」一颗，选中样式）+「搜索项目」+ 搜索框下面一行小灰字（hint：「不再手术，只能换成管理项目；要换成别的手术请选「需要调整方案」」）；原方案不变的［添加项目］选择器也用同一外观（hint「原方案不变不能加施术项目…」）。`krWzSettleCard(c,'replace',true)` 的 compact 版：选择器下面不再有「施术项目 0 / 管理项目 0」两张灰卡，只留一行「项目合计 ₩X；已付定金（可抵）₩Y；剩余转置换额度 ₩Z（或 尾款）」+ 最右［结算尾款］。取消项目后的三个选项、「没退出去的钱一律转成置换额度」那行、不问延长等逻辑都没动。
- 测试：R198b 加了卡片三层 / 判断行 / 只有一颗胶囊 / 没有灰卡的断言；回归对照基线 a51ccd8：A1 全套 376 项无差异，KM1 / KD1 批次只有 R198b（新断言）不同，roletest 8 个账号 0 不符。

## CMD-1102-05 补充（2026-11-02，追加；取代 CMD-1102-02 里「主案件的更新时间只看自己的 Timeline」和客户列表写死的「刚刚」，旧文字保留作历史）
- 分支 **V4**，代码提交 b65daa8（文档另一个提交），不推送不合并，**数据版本不变（56）**（更新时间都是现算，不存字段）。
- **主案件更新时间** = 自己 + 全部子记录（`childVisitsOf`）里最新的「真动作」（`caseUpdatedKey`，`caseLogKey` 只看一条 log；系统自动记录 `caseLogIsNoise` 不算）；子记录行自己的时间只看自己。IN / KR 案件列表、tab、排序共用；KR 在 `krAllCases` 里经 `Store.withClinic` 预先算好 `updKey`（KR 页面自己的 CASE_ITEMS 不是来源诊所分区）。
- **客人更新时间** = `clientUpdatedKey(cl)`：这位客人名下所有案件（含子记录）最新的真动作 + 客人页 Timeline 的真动作（改基础资料等）；都没有时用客户 Timeline 里最早一条（建档）；显示 `updatedTextOfKey`（刚刚 / N 分钟前 / 今天 HH:mm / MM/DD / YYYY-MM-DD，按演示时间）。IN 客户列表、KR 客人列表（新增「更新时间」栏）都按它新 → 旧排序。**写死的位置**：`data.js` 客户建档 `updated:'刚刚'` 及若干修改处（约 718 / 760 / 839 / 891 / 985 / 1179 行）、`ui.js` 897 / 928；字段保留但列表不再读。
- **给后端的备注（如何算「更新时间」）**：主案件 = max(自己和所有子记录里 Timeline 记录的时间，剔除系统自动记录)；客人 = max(名下所有案件含子记录同上, 客人 Timeline 的真动作)，没有案件 / 动作用建档时间；都不存字段，列表查询时现算（或用触发器维护）。Timeline 每条应带类型标记 `human | system`，目前原型用「操作人 = 系统 + 文字前缀」判断，现有噪音前缀：`修正旧数据`、`修正使用记录`、`修正：`、`00:00 关账`、`已超过预计出报告时间`。
- 测试：新增 R199a（IN：子记录冒泡 / 子记录自己不变 / 系统记录不算 / 排序 / 客人 key / 建档回退 / 演示时间 / 列表新 → 旧）、R199b（KM1：KR 客人列表有更新时间栏）；R197a 的 5 分钟、刚刚断言改成容忍分钟取整（时间点只精确到分钟）。回归对照 319be22：A1 全套失败集合一致（仅多出 R199b = 缺夹具），KM1 / KD1 批次一致，roletest 0 不符。

## CMD-1102-06 补充（2026-11-02，追加；取代 CMD-1013-03 3-3「更换时间」之后页面仍是评估前的旧卡，旧文字保留作历史）
- 分支 **V4**，代码提交 aa3c4c1（文档另一个提交），不推送不合并，**数据版本不变（56）**（新增可空字段 `c.krRebook` / `c.krRebookPrev`）。
- **原因（bug）**：`coreRebook`（不建议手术 · 更换时间）把状态改回 confirmed、`krJudge` 清空，但 `hasArrived` / `krArrivedDay`（= 原预约当天）原样保留。结果：① 页面因 `krJudge` 没了回到评估前的旧卡（项目方案 Step 1），看不到到院判断；② `krArrivedDay` 仍是 12/30，当天的“施术日”=12/30，但时间取 `ks.confirmedTime`（新预约 12/31 的 11:00）→ 状态栏写「已到院 今天 11:00」；③ 旧卡 `krWizard` 的 Confirmed 分支无条件画［客人已到院］（灰着，旁边是「模拟到当日」链接）；④ 状态栏仍按已到院画［客人已离院］，按下去 `coreEndVisitToday` 会 `krProcedureDone=true` 并把所有施术项目退回「未预约」、进术后管理——都是错的。
- **改法**：`coreRebook` 存 `c.krRebook = {judge(改期前的判断), oldDate/oldTime, newDate/newTime, arrivedDay, ended}`；`rebookActive(c)` = 改期当天客人仍在医院。当天：卡片 1 `krOrigCard` 读存下来的判断（不标取消）+ 卡片 2「施术日期」（已重新预约 / 原预约时间 / ［再次修改］，`krRebookCards`），`krArriveMainBtn` 在 `rebookActive` 时返回空（不出［客人已到院］），状态栏写「今天 · 不建议手术，已改期 MM/DD HH:mm」；［客人已离院］= `coreRebookEndDay`（只结束今天：`hasArrived` / `krArrivedDay` 清掉，不动项目、不进术后管理）；过了 00:00 没按也自动结束（`updateCaseStage` 开头；`dayLockedKR` / `dayStateOf` 对改期当天不关账）。新预约日：卡片 1 + 卡片 2（［再次修改］+ 日期到了才有的［客人已到院］），按了走正常施术当天流程，改期记录收进 `krRebookPrev`。
- Timeline 小文字（只改新记录）：退回评估重选「（memo：…）」→「（原因：…）」；确认结束没有项目时写「没有使用项目；没有退回未预约的项目」（IN `dayConfirmGo` 和 KR `krDayConfirmGo` 两处），有项目照旧列名字。
- 测试：新增 R200a（KM1，stageC 夹具）、R200b；回归对照 a9be253：A1 全套失败集合一致（基线多一个 R200b），KM1 / KD1 批次一致，roletest 0 不符。

## CMD-1102-07 补充（2026-11-02，追加；取代 CMD-1029-09 二 / CMD-1020-13 里「递交施术日期表单里填入境 / 离境」「确认赴韩弹在韩期间窗口」，旧文字保留作历史）
- 分支 **V4**，提交 592f27d（一）、7c54cc1（二）、5610c90（三 + 四合并为一个提交（两部分改的是同几个函数，没法干净拆开）；不推送不合并，**数据版本不变（56）**。
- **一 入境 / 离境只在「确认行程」窗口填**：行程状态只剩已定 / 暂定（拿掉 `draftIn` / `draftOut` 两栏和递交时的校验）；`stayGate`（确认赴韩）变成直接继续；1 个月前的「照原日期」窗只剩护照号 + 一个［填写 / 修改］按钮打开同一个窗口。**剩下的入口**：施术日不到 7 天递交时 / 7 天前［已确认行程］（`openStayModal(trip)`，必填）、赴韩日程卡［修改］（修正用）、KR 到院补填（`krStayArriveOpen`，旧资料没填过时的补救）、KR［行程修正］。
- **二 改期日期从明天开始**：KR 不建议手术 → 更换时间的下拉（两处）、`krDoRebook` 兜底、IN 施术日期日历（`krDateCalendarGridHtml` / `pickKrDate`）都 `> todayStr()`（演示时钟）。
- **三 行程修正**：到达日期 / 时间已记录就只读（`stayFixValidate` 拒改）；旧资料没记过到达时间的这一次可补；离开日期 + 时间必填。数据仍是同一份 `c.stay`，IN 的确认行程窗口读的也是它。
- **四 bug 原因**：保存时的「离境当天」确认窗（`krOffConfirm`）、冲突询问窗、已完成到院日提示等普通弹窗 z-index 65，被处理窗（100030）盖住 → 按保存看起来没反应（Ella：两项都提前到离境当天 → 弹确认窗被盖住）。修：这些弹窗层级提到 100100（app.css）；保存先在复本上试一遍（dry run，`krStayResRun`），失败在窗里红字写哪一行；`coreStayResolve` 排不进去会整体失败；新增 `krStayResClash`：只有占同一位院长时间（院长操作 / 施术预约使用）的才算重叠，同一天不占院长的术后管理本来合并不挡。成功 → 窗关闭 + toast。
- 测试：新增 R201a / R202a / R203a；R190a、R189a、selftest 的 stayGate 断言按新规则改。

## CMD-1102-08 补充（2026-11-02，追加；旧文字保留作历史）
- 分支 **V4**，提交 3292379（一）、ac51484（二）、e654cb3（三）、06fa907（四）、之后一个修正 guard + 旧断言的提交；不推送不合并，**数据版本不变（56）**，只加可空字段 `c.addConsultRef`。
- **一 自动结案 / 自动修正互相拉扯（bug）**：两条规则——① `mainAutoComplete`（主案件自动状态，`updateCaseStage` 末尾 + 每 5 秒 `mainAutoSweep`）在「韩国行程已结束 / 曾重新打开」且 `mainOngoingOf` 为空时 `finishCase`，而 `mainOngoingOf` 只看流程 / 术后管理 / 预约，**不看赴韩项目是否还没做完**（Fanny：施术退回未预约）；② 启动修复 `repairWronglyClosedCases`（boot-in 页面打开时跑）按 `mainlineOngoingRepair` 发现赴韩项目没做完 → 恢复进行中并记「修正」。于是每次打开页面：修复恢复 → 5 秒扫描又结案 → 各记一条 Timeline，成对重复，最后停在已完成。修：`mainAutoComplete` 在赴韩施术项目（不含持有管理项目）没做完时不结案；`finishCase` 状态没变（已 `visitClosed` 且 stage 相同）不再重复写「案件结束」。旧重复记录不删。**其他每次打开都跑的自动修正**（`repairVisitState` / `repairRemovedItems` / `repairScheduleGaps` / `repairHandToIn` / `repairOffConflicts`）已逐个看过：都只在条件真的命中、改完条件就不再成立时才写 Timeline（幂等），不会成对重复。
- **二 增加面诊**：`addConsult()` 是所有入口的唯一函数（案件页头［增加面诊］、本地管理 tab 里的按钮；子案件页头早在 1028-14 拿掉，术后管理那天没有）；面诊 tab 的增加面诊页（`addConsultMode`）现在顺序 部位卡（`concernFormHtml`，和一般面诊同一套，说明 / 希望预期 / 照片 / 视频必填）→ 预算 → 院长 → 面诊费 → ［确认］；`confirmConsultFee` 在 `addConsultMode` 下用 `concernMissing` 拦。不面诊时填的苦恼文字存 `c.addConsultRef`，页上灰字参考，选第一个部位时带进说明（可改）。
- **三 复诊评估**：`fuAvail` 的 `revisitC` 只含做过施术的案件（`followDoneItems` 非空）；候选案件都没做过施术 → `noSurg`，对话框里复诊评估灰掉并写「这个案件还没有做过的施术」。
- **四 NIK**：原因——「继续之前的服务」弹窗里的 NIK 输入框和后面基础资料页的输入框 id 都叫 `nik-in` / `nik-err`，`getElementById` 取到页面里被弹窗盖住的那个（空的），保存得到「请填写身份证号」，错误又写进被盖住的那个里 → 弹窗里没有任何反应。修：id 带 uid（`nik-in-p` / `nik-in-cont`）；输入时 `nikLive` 显示「N / 16」并即时红字；错误文字写现在几位 / 只能是数字 / 已属于客人 XXX；预约页（印尼文）同样 `bkNikLive` + 写现在几位。
- 测试：新增 R204a / R205a / R206a / R207a；旧断言改：R95a / R102a 夹具补一个做过的施术项目（复诊评估现在要求做过施术）、NIK 旧测试的 id（`nik-in-p`）。

## CMD-1102-09 补充（2026-11-02，追加；取代 CMD-1029-04 里本地项目「是否使用持有项目？」的［购买其他项目］、CMD-1012-08 / 1013-02 里室长录入面诊不分谁录，旧文字保留作历史）
- 分支 **V4**，基准 30ff014；提交：一 f17f78a、二三 7a98ad7、四 909f732（文档另一个提交）；不推送不合并，**数据版本不变（56）**（没有新字段）。
- **一** 本地项目「是否使用持有项目？」永远是三个按钮 ［新增项目］［本次不使用］［使用项目］（`holdingsUseHtml`，没有可用持有项目时［使用项目］不出现）；［新增项目］（`holdingsAddNew`）打开和没有持有项目的客人同一个本地选购画面，付款后成为持有可当天使用；［购买其他项目］全部改名［新增项目］（`usePrevBuy` 同入口）；［本次不使用］（`notUseThisTime`）没有购买且主线不在进行时弹「客人要离开了吗？」（`localLeaveAsk(c,'notuse')`），只有「已离店」才结案。适用所有会问持有项目的本地案件。
- **二** 院长自己按［开始面诊］（`consultStartedBy` 含「院长」，`krDirStarted`）后，室长页面（面诊卡 `krConsultCardGen`、录入块 `krRecordBlock`）没有［增加内容（语音 / 手动）］，只显示「院长已接手录入，这里只读」；室长代按的开始保留按钮；院长自己的页面不变（`krRecBtnsOk`）。
- **三** 室长按［增加内容］先弹「是否是院长亲自录入？」（`krRecWhoAsk`，`#kr-recwho-overlay`，二选一，没选［确认］灰）；选择记在 `KR_REC.who`（self / proxy）：转写记录署名院长、`rec` 记录入人、`who` 记方式（`krSaveTranscript`），Timeline「KD1 院长 · 语音录入（KM1 室长代录）」或「… 手动录入（院长亲自）」（`krRecUpload`），列表里也带标签（`krRecWhoTag`）。院长账号和复诊评估（`revEval`）不问。自测钩子 `window.GMC_REC_WHO_SKIP`（selftest.js 开头默认 true；R209a 关掉测弹窗）。
- **四（bug）预约后项目显示已完成 / 离院提醒与表不一致 / 热玛吉类型不一致**：
  - 没能用自建数据重现「预约把项目标成已完成」：管理项目 / 施术项目预约（`coreUnitBookUse`，含同时两笔同名）之后 `it.done` / 行 `done` / 次数全不变（R210a 锁住）。
  - 查到的真问题是口径不一致：① 持有的管理项目 `it.done=true` 只表示「已转成持有」（`holdLocalAdd`），但进行项目表的施术一行按项目拆开时用 `vdone = s.done || it.done`，行内容里混进管理类项目（旧 / 混合数据）就把它按「施术项目」画成已完成+灰；② 离院提醒（`krLeaveReminders` / `krEndAskOpen`）用 `todayOpenRows`，把整条施术行当一项（「A、B、热玛吉」），不看每个项目是否做完；③ 项目卡按 `krIsMgmtItemC` 把它放在管理项目，表按行的 `kind` 判断类型。
  - 改：`todayOpenRows` 施术一行按项目拆开（已完成 / 已取消 / 管理类的不算没处理，`krDayConfirmRows` 本来就是这口径）；`krMainRowsHtml` 管理类项目不再按「施术项目」画（持有项目行显示）。
  - 两笔同名同时间的「预约中」（一笔印尼购买一笔在韩购买）不是重复预约：是两笔购买各约一次（`holdItemBookable` 按每笔 iid 算，同一笔不会被约两次）；同一天同地点合并成一次到院，所以显示两条。
  - **没有自动修已坏的状态**：用户的旧案件里如果有 `s.done` 被误设的施术行，需要看导出的 Timeline 再决定。测试：selftest R210a（旧代码跑 3 条失败，新代码通过）。

## CMD-1102-11 补充（2026-11-02，追加；取代 CMD-1021-06「灰按钮只变灰，原因放 tooltip」、CMD-1020-04 / 1026-19 里「约在主到院当天会另生成 KR|同日期 的到院卡」，旧文字保留作历史）
- 分支 **V4**，基准 df57211；提交：一 3ecc4b4、二 3a6298a、三 fc83571、四（见 git log）；不推送不合并；**数据版本不变（56）**，没有新字段（旧数据靠启动修复 `repairVisitState` 归位）。依据 Notion 开发交接 05 的 5-2「一天一个」；**不做「把 done 的两种含义拆开」**（另开任务）。
- **规则**：同一个客人同一天只能有一个还没结束的到院。**到院 key 规则**（data.js `mainDayOpen` 上方注释）：`main` = 主到院（`mainVisitDay(c)` = `krArrivedDay` 或确认的施术日期，行 = 施术 / 增加项目，持有的管理项目靠 `todayPickMgmt` 进今日）；`KR|日期` = 其他韩国到院（`subCaseKey(s)`，术后管理记录 / 持有项目使用 / 施术预约使用行，同一天同地点一张卡）；`IN|日期` = 印尼来访；`rowVisitKey(c,s)` 决定行属于哪张卡。
- **入口清单与处理**：① 管理 / 施术项目［预约时间］`coreUnitBookUse`（KR 预约弹窗 / 项目卡）：主到院进行中且约的是那一天 → **并入**（`mainDayAddMgmt` 进 `todayPickMgmt`，不建行，Timeline「预约时间：…——客人已在院，并入今天的进行项目」）；② 术后管理预约 `coreCareBook`（韩国）约在施术当天 → **拦住**，`KR_DENY_MSG`「客人今天在院做施术，术后管理请约施术之后的日期」；③ `coreHoldUseSchedule`（旧入口）同 `sameDayDenyText`；④ 同一客人别的案件当天已有主到院进行中 → 这三个入口都**拦住**「客人今天已在 A… 到院…」（`sameDayOtherOpenCase`）；⑤ 改时间 `coreSubTimeEdit` 把使用行改到进行中的主到院当天 → **并入**（`absorbRow`）；⑥ 客人到院那一刻 `coreMarkArrived` → `mergeMainDayRows` 把已有的同天使用行并回；⑦ 启动修复 `repairVisitState` → `mergeMainDayRows`；⑧ IN 预约类（日历代约 / 占位 / 自助 / 未安排预约［预约］/ 预约复诊 / KR 占位预约 / 预约改期）本来就走 `pendingResvSameDay` 同一天合并（CMD-1021-16 / 1026-08），没改；继续之前的服务 `joinMain` 同一天同地点沿用同一个号（`dayNoAssign`）；「使用之前购买的项目」开新案件 / 本地新增项目是 IN 当天同一案件内的操作，不生成新到院。
- **［本次使用］**（`coreUnitUseNow0`）：这一项已有约在主到院当天的预约行 → 先 `absorbItemRows` 转成今天的进行项目，不再「没有可用次数」。
- **三 `syncSurgerySub`**：不再有「只有管理项目时施术行写管理项目名」的兜底（也去掉 `anySurg`）；调整方案取消原施术、尾款前新增施术时施术行拿掉（新增的有自己的「增加项目」行）。`repairSurgRowMix`：旧数据的混合行重写，只在内容变了写一次 Timeline（幂等）。
- **四 灰按钮写原因**：`krOutBtn`（项目卡三个 tab 的按钮）、`krLink`、到院卡的［客人已到院］灰按钮（`krArriveMainBtn` / `krArriveSubBtn`）旁边写一行小灰字（`.kr-btn-off` / `.kr-why`），悬停 title 保留；`krBtn` 本来就写。没动：整页只读（`krRoWrap`，CMD-1027-08 用户要求拿掉提示行）、表单里被禁用的输入框。
- **「只灰一笔」查证**：［修改时间］灰 = 这一行 `arrived` 为真。把一整张卡标到院的 `coreVisitArrive` 会把同一张卡的所有未做行一起标；但**逐行标到院的入口有两个**：日历块弹窗［客人已到院］（`krVisitArrive` → `coreSubArrived(单行)`）和 `krCliAct('krSubArrived')`，只作用到点的那一行；`inheritVisitArrival` 只对被改时间 / 新建的那一行生效（别的行到店它才继承）。所以两笔同时间的行可以只灰一笔。
- 测试：selftest 新增 R211a / R212a / R213a；因同一天并入而改的旧断言：R77b（约未来两天来测「并入已到店的到院」）、R79a（先让主到院结束，才会有 KR|今天 这张卡）、R74a（灰按钮旁边「没有说明文字」→「写说明文字」）。用 Carry C 备份（隔离端口导入）验证：启动修复后 A000844 只剩主到院一张卡，进行项目里有两行热玛吉（管理项目、［操作完成］），施术行混入已重写，Timeline 各写一次。

## CMD-1102-12 补充（2026-11-03，追加；取代 CMD-1020-xx 里 IN［本次使用］弹窗「按 id 连续往下找勾选框」的读法，旧文字保留作历史）
- 分支 **V4**，基准 aacaf8b；提交 db25ee0（1～4）、a5e8e1a（3 的重复 id）；不推送不合并，**数据版本不变（56）**。第 5 部分只查不改，没有改产品代码。
- **［本次使用］弹窗（data.js `inUseOpen` / `inUseConfirm`）**：没能用自建数据 / 备份重现「勾了却说请至少勾选一项」（弹窗内 id 没有重复，页面其他地方也没有 `iu-*`）。原来的读法有三个脆弱点：`document.getElementById` 在整个页面找（页面上任何同 id 元素都会盖住）、`for(i=0; el=getElementById(...); i++)` 遇到第一个缺的 id 就停、确认时重新算名单再按名字对。改成：只在 `#in-use-overlay` 里找（`ov.querySelector`）、按打开时记下的名单 `IN_USE_LIST` 对应、失败提示写进弹窗里的红字 `#iu-err`（`inUseErr`），不再用 `alert`。
- **重复 id 清单**：静态 id 在多处出现的有 `pc-use-reason`（两个术后管理弹窗，同一时间只开一个）、`consult-after-report`（面诊 tab 两个版本，互斥）、`settle-pay-btn`（同一个付款弹窗两种内容）、`ce-v`（三个分支，互斥）、`rp-body`（报告页 in.html 里一个，data.js 完整报告弹窗又一个，**会同时存在，已把弹窗的改名 `rptfull-body`**）；动态 id 前缀（`iu-care-` 等 20 个）都只有一个生成处。IN 和 KR 的 chat / lib / float 等重复是 in.html 与 kr.html 各一份，不在同一页面。
- **alert 清单**：全站仍有约 186 处 `alert(`（kr.js 92、ui.js 54、data.js 27、calalign.js 7、todo.js 2、krbook.js / hospspecial.js 各 1），多数是表单校验（"请填…""请先勾选…"）；本次只改了［本次使用］弹窗，其他没动。
- 测试：新增 R214a。
- **第 5 部分结论（B，结构性缺口）**：repairWronglyClosedCases 与 mainAutoComplete 的判断不一致——前者看 `krNotStartedItems`（含 `deferUse` 回到未预约的项目）认为案件还在进行并重开，后者的 CMD-1102-08 保护写成 `!m.krProcedureDone && …`，`krProcedureDone=true` 时保护整段跳过，于是重开时 repair 自己调的 `updateCaseStage` 立刻又 `finishCase`。详见 Notion CMD-1102-12 汇报。

## CMD-1103-03 补充（2026-11-03，追加；取代 CMD-1021-22 里「上传卡［视角参考］只有 KR 设过的部位才可点」，旧文字保留作历史）
- 分支 **V4**，基准 13db164；代码提交见下一行 git log；不推送不合并，**数据版本不变（56）**。
- **灰掉的原因**：不是按项目找图找错——`followItemPart('切开双眼皮')` 正确得到眼睛（`f_eyes`），灰是因为 `HOSPITAL_DATA[h].partShoot` 里只有颧骨 / 下颚有演示参考图（`shootDemoSeed`），眼睛等其他部位 KR 没设过，`shootHasRef` 为假。**一般面诊的部位卡对眼睛一样是灰的**（用户看到的「照旧能用」是颧骨 / 下颚）。
- 修：① `shootDemoSeed` 再补一次（`h._shootDemo2`）：每个苦恼部位（除旧资料 `b_all`）没设过的就补一份演示参考（默认角度各一张占位图 `参考_部位_角度.jpg`，需要视频），KR 自己设的不动；真实示范图仍由 KR 在项目库「部位拍摄要求」上传。② `shootSpec`：项目另设（`p.shoot`）里没传的参考图 / 说明退回部位的（原来整个换成项目的，项目没传图就灰）。③ 灰按钮悬停写原因「KR 还没有为「眼睛」设定视角参考（KR 项目库 → 部位拍摄要求）」。
- 上传卡入口清单：一般面诊 / 增加面诊（`concernFormHtml` 的部位卡）、复诊评估每项目卡（`revisitMediaCardsHtml`，部位取 `followItemPart`）、术后恢复卡（`recoveryCardHtml`）、复诊评估结果里的项目卡（`revProjCardsHtml`）、KR 术前照片（`krPreOpBlock`）全部走同一个 `shootRefBtn`；继续面诊没有上传卡（沿用原资料）；主案件页 / 客人页进入复诊评估是同一个弹窗 / 页面。
- 测试：新增 R215a；R90a 的悬停文字断言改成新的原因文字。

## CMD-1103-01 补充（2026-11-03，追加；取代开发交接 02「院长 / 代表院长看不到项目库」，旧文字保留作历史）
- 分支 **V4**，基准 1ba3861；提交见 git log（`CMD-1103-01: KR directors…`）；不推送不合并，**数据版本不变（56）**，没有新字段。
- **权限**（rules.js `ROLE_PERMS`）：新权限 `krlibview`，四个 KR 角色（kr_owner / kr_manager / kr_general / kr_director）都有；`ADMIN_PAGES` 里「项目库」(`krsrvc`) 的 perm 从 `krlib` 改成 `krlibview`，所以院长 / 代表院长侧栏出现「项目库」。`krlib`（维护）仍只有 KR 管理者、室长。IN 本地项目库不变（KR 的「管理项目」是 KR 自己的管理项目库）。
- **只读**：`ADMIN_RENDER.krsrvc` 本来就用 `can = canDo('krlib')` 决定新增 / 编辑 / 停用 / 删除按钮（没权限是不出现，不是灰掉）；本次在函数入口再挡：`krpOpen` / `krpDelete` / `krlOpen` 没有 `krlib` 直接返回（`krpToggleActive` / `krlToggleActive` / `krpSave` / `krlSave` / `krShoot*` 原来就判断）。价格是项目库本身的定价（韩元），案件里的定金 / 尾款 / 在韩加项金额院长仍看不到（`viewerTextFilter` 等没改）。
- **面诊内容录入**：`krRecordBlock` 上方一行［查看项目库］，录入侧边栏（`krRecModalRender`）标题行也有；点开 = 右侧只读侧边栏 `#kr-lib-side`（`krLibSideOpen` / `krLibSideSet` / `krLibSideRender`，状态 `KRLIB_SIDE`）：施术项目｜术后管理｜管理项目三个 tab、按分类 / 部位胶囊、搜索、价格；不能在里面选项目；关掉不影响录入内容（录入文字在 `KR_REC`，是另一个元素）；离开案件页自动收起（`krRecSideSync`）；录入侧边栏展开 / 收起时位置跟着让位。
- 测试：新增 R216a（KR 分页，KD1 / KO1 / KM1 各跑）；roletest 院长对项目库的旧断言「项目库（维护）院长 ❌」改成「所有 KR 角色可看 ✅」，新增「新增 / 编辑 / 停用按钮（院长 / 代表院长不出现）」「显示价格」两格。

## CMD-1103-02 补充（2026-11-03，追加；取代 CMD-1102-11 / 1019-22 里「离院时没做的施术静静退回『未预约』」、CMD-1014-16 / 1020-18 里 IN 占位的三个来访目的，旧文字保留作历史）
- 分支 **V4**，基准 6a17b82，代码提交 a4feb5b；不推送不合并；**数据版本 56 → 57**（`MIGRATIONS` to:57 → `oldLeaveToRebookWait`：旧资料里「离院后回到未预约（`deferUse`）」的施术项目转成「待重新预约」，Timeline 记一笔，迁移备注列案号；用户案件照旧保留）。用户确认过的「到院当天」主线改动。
- **一 锁离院**：KR［客人已离院］在院长评估（`krJudge`）完成前灰掉并写「请先完成到院评估」（不适合手术的在评估里选「不建议手术」）；`coreEndVisitToday` 返回 `evalFirst`。评估后如果当天施术都做完，照旧；其他日子的预约、管理项目、持有项目不挡；待付款仍挡。
- **二 离院原因**：评估完成后还有施术没做 → 弹窗（kr.js `krLeaveWhyOpen`，`#kr-leave-overlay`）逐项选原因（`LEAVE_REASONS`）：身体不适 → 重新预约（当场约：日期必须在明天或以后、在客人在韩期间内、避开院长日程冲突；或之后再约 = 新状态「待重新预约」`it.rebookWait`）；客人本人放弃 → 取消项目（更换项目 / 全部退回 / 部分退回，没退的钱转置换额度，KR 只记判断，IN 照退款流程办）；其他 → memo 必填，再选重新预约或取消。校验 `leaveValidate`，错误红字写在弹窗里；Timeline 只记一条。系统结束 / 确认结束（`by==='系统'` 或 `DAYCONFIRM_BYPASS`）不弹窗，没做的一律标「待重新预约」。自测钩子 `GMC_LEAVE_SKIP`（selftest 默认 true；R217a 里临时关掉）。
- **待重新预约**：`rebookWaitItems(c)` / `surgUndone(c)`（data.js）；项目卡施术 tab 单独一组「待重新预约」，KR 待办 kind `rebookwait`（点了进项目 tab）；约上时间（`coreUnitBookUse` 或 IN 占位被 KR 确认）后 `rebookWait` 自动清掉，待办消失；已付的钱保留，案件继续。
- **三 B50 来回结案（Fanny A000010）**：`repairWronglyClosedCases`（`mainlineOngoingRepair`）和 `mainAutoComplete` 现在共用同一个「赴韩施术没做完」判断 `surgUndone`，不再带 `!krProcedureDone` 前提 → 恢复进行中后不会在同一次 `updateCaseStage` 里又被结案。在备份 gmc-export-2026-11-02-07-58-28.json（隔离端口）上验证：升级 56 → 57，用户案件 25 → 25，迁移 25、失败 0；Fanny A000010 转了 2 个「待重新预约」（埋线双眼皮、开内眼角），状态停在术后管理，20 秒内 Timeline 不再新增（151 条不变）。
- **四 IN 占位（krbook.js）**：客人名单只含「韩国行程没结束」的（`krbClients`/`krbMainCases`）；来访目的只有两个（`KRB_PURPOSE_NEW`）：关联之前案件（选主案件 → 三组可混选：待重新预约施术 / 已完成施术的韩国术后管理（「对应施术 · 术后第 N 天」）/ 韩国持有管理项目；空组不显示，全空的案件下拉灰掉）、新增访问；旧的「在韩术后管理预约 / 持有项目管理预约」只用来显示旧占位。占位日期限制在入境～离境（`krbDateInput`），没有在韩期间 → 日期灰掉写「请先确认客人行程」。KR 确认（`coreBookConfirm`）：关联案件时算在该主案件的子案件，待重新预约的施术用 `coreUnitBookUse` 约上时间（待办消失）。
- 我的判断（未经确认）：关联之前案件里勾的术后管理 / 持有管理项目，KR 确认时只记在预约上，没有自动建成预约行（到院时照旧流程做）；当场约时院长默认用案件的对接院长。
- 测试：selftest 新增 R217a（KM1，stageC）、R217b（A1，stageC）。

## CMD-1103-04 补充（2026-11-03，追加；取代 CMD-1021-17 / 1021-20 / 1022-05 里「메타뷰 = 自动带入的检测状态（待检测 → 检测中 → 已检测到）+ 补充上传检测报告」，旧文字保留作历史）
- 分支 **V4**，基准 5a38f79，代码提交 b3afadd；不推送不合并；**数据版本不变（57）**，没有迁移（旧资料靠读取时兼容）。依据开发交接 05 的 5-3。
- **메타뷰 = 人工记录**（data.js 末尾「CMD-1103-04」一段）：`c.meta = {v:'yes'|'no', at:UTC 时间（记到分钟）, by:账号使用人名字, byId, fixes:[{at,by,reason,from,to}]}`；`metaState(c)` 读它，没有 `c.meta` 时 `metaviewStatus==='ready'` 算「是」（旧资料，显示「已检测 · 旧资料」，不补造时间），其余算没选。`c.metaviewStatus` 继续同步（yes→'ready'、no→'no'、没选→'idle'），别处还在读它。**每次来访必选**（一般 / 复诊 / 术后 / 继续 / 使用之前购买的项目都一样，取代 1022-05 的「关联案件选填」）：`confirmMaterials` 缺项里写「메타뷰（请选 是 / 否）」（原来就是缺项弹窗，不是浏览器 alert）。
- **画面**：`metaFieldHtml(c)` 一处出所有 메타뷰 栏——没选：［是（本次已检测）］［否（本次没做）］；选「是」弹确认窗（`metaPick('yes')`，`#meta-confirm-overlay`，文字照任务原文，［取消］不变、［确认已检测］记时间 + 人 + Timeline「确认已完成 MetaView 检测」）；选「否」不弹窗，直接记「未检测」（也记时间 + 人，Timeline「记录 MetaView：本次未检测」），离店前（案件没结束 / 没离店）可点「改成「是」」，同样弹确认窗；「是」之后室长不能撤销、不能改回「否」；**IN 管理者**（`nikCanEdit()` 同一个判断）显示「更正（管理者）」→ `metaFixOpen` / `metaFixSave`：撤销（回到没选）或更正检测时间（按页面时区转 UTC），原因必填（红字在弹窗里），记 `fixes`、Timeline「管理者更正 MetaView 记录」和操作日志（类型「其他」/「MetaView」）。**接入的画面**：IN 基础资料「到访目的」卡（一般 `materialsCardHtml`、术后 / 复诊 `followupCardsHtml`、使用之前购买的项目 `usePrevCardsHtml`、继续面诊 `resumeConsultCardsHtml`）、「继续之前的服务」弹窗（`contRender`）、确认后的基础资料 tab（`basicTabHtml`）、子案件页到访 tab（`metaPlainText`）。
- **拿掉**：自动「检测中… → 已检测到」的模拟（`simulateMetaviewReady` 只剩一个指向 `metaPick('yes')` 的空壳）、「查看检测结果 ↗」链接、基础资料 / KR 面诊里的「메타뷰 检测报告」补充上传行（`suppRowHtml('metaview')` 不再被调用，photo / video 的补充上传不变）、附件 tab 里自动生成的「메타뷰 检测报告」。`in.html` 里一段静态示例行「메타뷰资料 已检测 查看检测结果 →」（案件信息抽屉旧残留）没动，页面上不再显示。
- **KR 只看「已检测 · 时间（韩国时间）」或「未检测」**（`metaKrText`，院长 / 室长 / 案件页 / 面诊 tab 到访目的 / 概要行），不显示检测结果。
- **测试 / 工具里自动填 메타뷰 的地方**：`selftest.js` 里大量 `c.metaviewStatus = 'ready'` 直接赋值（走旧资料兼容，仍算「是」，所以没逐个改）；`ST.materials` 现在同时写 `c.meta = {v:'yes', at:现在, by:'自测'}`；新增 R218a。一键准备（`testprep.js`）不碰 메타뷰（案件靠 `materialsConfirmed` 造，`makeCase` 里 `materialsConfirmed` 为真时 `metaviewStatus:'ready'`），所以这些案件显示「已检测 · 旧资料」。
- 我的判断（未经确认）：① 「否」可以在案件没离店 / 没结束前改成「是」，管理者的更正只做在「是」上（撤销 / 改时间），没做「否」的更正；② 更正时间用页面时区的 datetime-local 输入；③ 撤销后回到没选，室长要重新选 是 / 否，不用再另外弹窗；④ 「是」的确认窗没有区分谁点（任何 IN 室长都能点「是」，包含一般室长）。

## CMD-1103-05 补充（2026-11-03，追加；取代 CMD-1103-02 里「我的判断 ①（占位里勾的项目 KR 确认后只记在预约上）」「判断 ③（隔天确认时没做的施术一律标待重新预约、不弹原因窗）」和占位弹窗的版面，旧文字保留作历史）
- 分支 **V4**，基准 2749cc5，代码提交 a44b0c5；不推送不合并；**数据版本不变（57）**，没有迁移（新增可空字段：占位 `b.linked / bookedRows / wasRebook / bookDir`）。依据开发交接 05 的 5-1、5-6、5-8。
- **一 占位勾的项目 KR 确认后真的约上**（krbook.js `coreBookConfirmLinked` / `coreBookCancelLinked`）：`purpose==='linkcase'` 且有勾项目时，`coreBookConfirm` 不再另建「在韩管理」案件，直接在关联的主案件上约：待重新预约的施术 → `coreUnitBookUse`（院长固定用案件的对接院长，不能换）；未预约的术后管理 → `coreCareBook`（韩国）；在韩持有的管理项目 → `coreUnitBookUse`（院长操作的管理项目 `dirOpInfo(...).on` 可在 KR 确认窗选院长 `opts.dir`，占院长时间，先用 `krSurgerySlotError` 预检）。约上的行由日期自动并进当天的到院（5-2）、从未预约列表消失、到院那天出现在今天的进行项目；持有项目照 5-9（先扣最早买的批次、完成才扣次）。**任何一项约不上 → 整笔回滚**（`subItems` / `procedureItems` 快照还原）、占位仍是待确认，错误显示在 KR 窗口里。占位记 `b.linked=true` + `bookedRows`（新建行 id）+ `wasRebook`（原来是待重新预约的施术）；`krbBlockSync` 对 linked 不再另画占位块（到院自己显示在日历），待办「今天到店：预约」也跳过 linked。KR 没确认 / 无法安排 / IN 取消占位 = 项目一直没动，自然还是原状态。KR 确认后的取消（KR 窗口［取消预约］→ `coreBookCancel` → `coreBookCancelLinked`）：行用 `coreRowCancel` 退回（施术回到「待重新预约」、持有回到未预约、术后管理回到未预约）；已有项目到院 / 完成就不能取消。
- **二 隔天确认前一天也要选原因**（kr.js）：`krDayConfirmGo` 在主到院里还有施术选了「没做」（评估没做完的也一样）时，先弹和离院一样的原因窗（`krLeaveWhyOpen(items, {K})`，标题「确认结束 · 那一天还有施术没做」，同一套行：身体不适 → 重新预约（当场约日期从确认当天的明天起、在在韩期间内；之后再约）/ 客人本人放弃 → 取消项目 / 其他 memo 必填），［确认结束］ → `krLeaveWhyGo` → `krDayConfirmRun(K, leave)`；原因没选完红字在窗里、什么都不动（`leaveValidate(c, leave, names)` 预检）。`coreEndVisitToday` 在 `DAYCONFIRM_BYPASS` 下带了 `leave` 也照原因处理（不再一律标待重新预约）；没带原因的老路径（理论上不再有）标「待重新预约」，reason 写「关账后确认：没做（未选原因）」。**系统自己结束的路径**：只有 `dayAutoEndKr`（00:00，且那一天没有任何需要确认的项目才会自动结束）→ 没有未做的施术，所以不涉及原因；`tripAutoSweep`（离开日期过了自动结束行程）不动项目。**评估没做完、重新预约后客人再来「从评估重新开始」没有另外实现**：重新预约的施术走子到院（`surgUse` 行），评估向导只属于主到院，原型没有“重新预约后再评估”的流程，列在汇报里待确认。
- **三 占位弹窗版面**（krbook.js `krbRender` 等）：顺序 客人（只列赴韩行程中的）→ 来访目的 → 关联的案件（+ 三组可约项目）→ 日期 + 时间（日期下面标示「客人行程：入境 MM/DD HH:mm ～ 离境 MM/DD HH:mm（韩国时间）」，没确认行程时日期灰掉 + 红字「还没确认客人行程（入境～离境），请先确认」）→ 备注。`krbClientPick`：选客人时若没有任何可约项目（`krbClientHasItems`，所有行程案件合起来看）→ 默认「新增访问」，「关联之前案件」灰掉、写「（目前没有可约的项目）」；关联的案件只有一个时自动选上。
- 测试：selftest 新增 R219a（KM1，pcStage：确认真的约上 / 休诊日约不上回滚 / 无法安排不动 / 取消回原状态）、R219b（A1，pcStage + stageC：弹窗顺序 / 行程线 / 灰掉默认新增访问 / 自动选案件）、R219c（KM1，stageC：隔天确认弹原因窗 / 没选完不能确认 / 身体不适 → 待重新预约 / 客人放弃 → 取消项目）。
- 我的判断（未经确认）：① 关联占位的 KR 确认窗里，院长下拉默认「案件的对接院长」，只对院长操作的管理项目生效；② 同一占位勾了好几个施术时，院长时间冲突预检按单个项目的时长各查一次，没有合起来查；③ 关联占位确认后不再有“占位自己的到院 / 完成”流程（到院、完成都在案件里处理），旧的“新增访问”占位仍走原流程。

## CMD-1103-06 补充（2026-11-03，追加；取代 CMD-1103-04 里「IN 管理者更正 = 撤销（回到没选）/ 改检测时间」，旧文字保留作历史）
- 分支 **V4**，基准 779d87a，代码提交 bcb5b09；不推送不合并；**数据版本不变（57）**，没有迁移。依据开发交接 05 的 5-3（11/03 更新）。
- **拿掉「撤销」**：`metaFixOpen` / `metaFixSave`（data.js）改成一个［更正］——管理者（`metaCanFix()` = `nikCanEdit()`）在弹窗里直接选正确的结果 是 / 否，选「是」可改检测时间（到分钟，datetime-local，页面时区）；更正原因必填（红字在弹窗里 `#meta-fix-err`）；结果一旦选过不会再回到没选；什么都没改（同结果同时间）不能存。**客人离店 / 案件结束后也能更正**（原来「否」在离店后谁都改不了）；室长部分不变（选「是」弹确认窗、确认后不能自己改；选「否」离店前可自己改成「是」）。
- **记录**：`c.meta.fixes[]` 每条 `{at, by, byId, reason, from, to, fromV, fromAt, fromBy, toV, toAt}`（原结果 / 原时间 / 原操作人员 + 更正后结果 / 时间 + 谁 + 何时 + 原因）；案件 Timeline「管理者更正 MetaView 记录：…；原因：…（原：…）」（人为）；操作日志（类型「其他」/「MetaView」）。更正后 `c.meta.v/at` 是新值，`c.meta.by` 仍是原操作人（更正人在 `fixes` 里）；室长之后的「否 → 是」/ 记「否」会带着旧的 `fixes`（`metaFixesOf`），不丢更正历史。栏位显示更正后的结果，旁边小字「已更正」，点开 `metaFixLogOpen` 看更正记录（所有 IN 角色都看得到这个小字，一般室长没有［更正］）。KR（`metaKrText`）照旧只看「已检测 · 时间 / 未检测」，所以看到的是更正后的结果。
- **旧数据**：1103-04 之后若已有被「撤销」回到没选的记录，维持没选（不补造）；我这边的测试浏览器里没有这样的数据（撤销功能只存在于 1103-04 的测试用例里），用户浏览器里的数量看不到。没选的案件室长照旧可选 是 / 否，管理者在没选状态下没有［更正］（因为室长自己就能选）。
- 测试：selftest R218a 改（改前 → 改后）：「管理者撤销：回到没选」→「管理者把「是」更正成「否」：不回到没选、记原值 + 新值 + 原因 + 更正窗里没有「撤销」」；新增离店后 否 → 是 + 时间（原因必填）、只改时间、没改动不能存、「已更正」记录窗、一般室长没有［更正］、KR 看更正后的结果。

## CMD-1103-07 补充（2026-11-03，追加；取代 CMD-1026-12 / 1026-17 / 1028-14 里「剩余项目」卡的胶囊「术后项目」和「本地管理页 / 术后管理页各只放自己那一类」，旧文字保留作历史）
- 分支 **V4**，基准 acda653，代码提交见 git log（`CMD-1103-07`）；不推送不合并；**只改画面，数据版本不变（57），没有动资料**。
- **原因（截图 A000844-07，术后管理 tab 下半部只有说明 + 一片空白 + ［本次使用］）**：`inContRestHtml(c, M, kind)` 在子案件页的「术后管理」tab 里 `kind='care'`，但「有没有剩余项目」是看**两类合计**（`counts.care || counts.local`）；客人没有印尼术后管理剩余、却有本地管理持有（`M.unused` 有）时，卡片照出，`care` 页的内容区却是空的，只剩说明文字。
- **改法**（data.js `inContRestHtml`）：「剩余项目」= 一张项目卡，两个 tab［术后管理］［本地管理］（原来叫「术后项目」），**哪个没有项目就不出现哪个 tab**（`tabBtn` 本来就按数量；现在 `kind` 页也画 tab，默认落在当前页对应的 tab，那个没有就落到另一个，`IN_CONT_TAB` 记手点的）；**两个都没有 → 整张卡不出现，［本次使用］也不出现**。唯一例外：本地管理页、一个都没有、但今天还能添加本地项目 → 只留一行［＋ 添加本地管理项目］（不画卡、没有［本次使用］），免得没有入口（1026-17 起本地管理 tab 有了之后页头不再放这个按钮）。术后管理 tab 下面的说明文字缩成标题「剩余项目」旁一行小字（来自主案件 · 免费 · 不能退款 · 做完记在原案件，扣原案件次数）。［本次使用］的行为不变（`inUseOpen` / `inUseConfirm` 沿用 CMD-1102-12）。
- **今天做的术后管理表格**：项目类型标签 `white-space:nowrap`，第一栏 70px → 88px，不再换成两行。
- **同类画面检查**：用 `inContRestHtml` / `inContCardHtml` 的只有 ① 子案件页「术后管理」「本地管理」tab（`subTabBodyHtml`）② 术后来访（followup 本地案件）的本地管理 tab ③ 复诊评估 + 术后管理的案件 tab（3986–3991 行那几处），都走同一个函数，一起改了。「使用之前购买的项目」（`holdingsUseHtml` 的「是否使用持有项目？」）是另一块清单，不是「剩余项目」，没改。KR 在韩术后管理子案件（`krDayCareCardHtml` / `krProjCards`）没有「剩余项目」独立区块，且 1028-11 起没有未做术后管理就不显示，没改。
- 测试：新增 R220a；R107a / R138a 的断言「术后项目」→「术后管理」。回归对照 acda653（b1103f）：A1 全套只有这两条因标签文字不同而失败（已改），KM1 / KD1 批次一致，roletest 8 个账号 0 不符。

## CMD-1103-08 补充（2026-11-05，追加；补 CMD-1103-05 判断 ②④，旧文字保留作历史）
- 分支 **V4**，基准 8e4bc4f；代码提交见 git log（`CMD-1103-08`），文档另一个提交；不推送不合并；**数据版本不变（57）**（新增可空字段 `c.visitEval[到院key]`）。会动「到院当天」主线，用户已确认。
- **一 重新预约那天的到院评估**（data.js `visitEvalNames/visitEvalOf/visitEvalNeed/visitEvalLockText/coreVisitEval/visitSurgWait/evalBypass`；kr.js `krVisitEvalCard/krVEvSet/krVEvGo`）：子到院（`KR|日期`）里有重新预约的施术（`surgUse` 行）→ 客人到院后先评估（同 5-6 第 2 步的三种判断：原方案不变 / 需要调整方案 / 不建议手术；后两种 memo 必填）。评估前 `coreSubDone`（surgUse 行）拒绝（`KR_DENY_MSG`）、`coreEndSubVisit` 返回 `evalFirst`，界面［操作完成］灰掉写「请先完成到院评估」，［客人已离院］（`krEndBtnHtml`）灰掉同。评估卡显示在这次到院卡里（到院后、评估前），评估后只留一行结果；Timeline 记「到院评估（重新预约 MM/DD：项目）：结果」。同一天另外约的术后管理 / 管理项目不需要评估。系统 / 确认结束（`by==='系统'` 或 `DAYCONFIRM_BYPASS`）不拦。**不建议手术**：必选「更换时间」（这天的施术行拿掉，项目回到「待重新预约」）或「取消项目」（项目取消、术后管理一起取消，款项通知 IN 照退款流程办）；**原方案不变**：尾款已付，直接做、不产生结算单。
- **离院 / 隔天确认时没做的重新预约施术**：`coreEndSubVisit`（离院）和 `krDayConfirmRun` 子到院分支（隔天确认「没做」）现在把对应项目标成「待重新预约」（`visitSurgWait`），原来静静退回「未使用」。
- **二 同一位院长的多个项目合起来查**（data.js `dirSeqCheck(hid, [{dir,min,label}], date, time, exceptKey)`）：同一位院长的项目所需分钟加起来，从开始时间起整段检查；冲突红字「KD1 院长 14:00～16:30 已有安排（A、B 合计 150 分钟）：…」。接入：KR 确认占位 `coreBookConfirmLinked`（原来按单项各查一次）、IN 占位提交 `krbSubmit`（关联之前案件时，提交就查一遍）、离院「当场约」`leaveValidate`（同院长同一天几项合起来查）。**其他一次约多项的地方（预约弹窗 `krCbGo` 等）原本就按“同一天一次到院”各自查，这次没改，待确认要不要一起合并算。**
- 测试：selftest 新增 R221a（KM1，stageC 夹具）、R221b（任意分页）；回归对照 8e4bc4f：A1 全套 / KM1 / KD1 批次 / roletest 失败集合一致（只有日期·时刻相关的偶发项 CAL8/CAL6/R144b/R107a/R131b/R132b/R138a 两边互有出入，今天 07:30 不在营业时间）。

## CMD-1105-01 补充（2026-11-05，追加；取代 CMD-1023-03 P5 里列表「其他进行中」栏、CMD-1026-10 三里 KR 状态标签只认复诊评估、CMD-1013-08 / 1015-17 里「在韩后续进行中」标签，旧文字保留作历史）
- 分支 **V4**，代码提交 a8e212b，文档另一个提交；不推送不合并；**数据版本不变（57）**，没有改资料结构（都是读取规则 / 显示）。
- **KR 栏位错位原因**：行里在「进程」后面多画了一格（IN 的「其他进行中」那一格，KR 表头从来没有这一栏），12 格对 11 个表头，所以「财务」起整行往右挪一格。现在 KR 行删掉那一格、grid 11 栏。IN 列表「KR 室长」原来只读 caseOperators(c).kr（按操作记录），多数案件是空的 → 空时退回案件的 krCoordinator。
- **时间格式**（只改案件管理列表）：rules.js caseStartYmd「YY-MM-DD」、caseUpdatedFull「YY-MM-DD HH:mm」（页面时区）；其他地方的 caseStartText / caseUpdatedText 不动。
- **进程一格一件事**（data.js mainProgressText / mainEndProgressText）：进行中 = 现在停在哪一步（待重新预约：A、B → 复诊评估：… → 术后管理未预约 N 项 / 在韩管理未预约 N 项 → 在韩持有 N 项 → 阶段自己的进程）；已结束 = 结束方式（有在韩持有写「在韩持有 N 项」）。不再用 mainAttentionOf（那是待办 / 提醒）；列表里拿掉「在韩后续进行中」标签、KR 行里的「今天到院」按钮和子项小字（工作台待办 / 案件页里仍有）。
- **IN「下一个日程」**（nextScheduleText）：最近一个还没到的预约 / 来访「MM/DD HH:mm 做什么（子案件号）」，没有写「—」。IN 阶段标不动。
- **KR 阶段标**（kr.js krListStage，krAllCases 里在来源诊所分区内算）：只写阶段名；KR 还有事 = 彩色，没有了 = 灰色（#EDEAE2 / #6E665E），字不变。「有事要做」判断：面诊安排 = 面诊已申请且诊疗方案没出（待确认时间 / 等面诊 / 面诊中 / 等发送）；赴韩施术 = 有待重新预约、IN 占位待 KR 确认、施术时间待确认 / 改期待确认、或施术还没离院；在韩管理 = 行程没结束且还有持有项目 / 到院预约没做完；术后管理 = 韩国这边的术后管理还有没约 / 没做；复诊评估 = krTaskStageOf（待确认时间 / 待发送结果）。灰色时进程：方案已出 / 施术已完成（· 已离境）/ 在韩管理已结束（· 在韩持有 N 项）/ 术后管理照现在进度；仅出报告 = 灰色「面诊安排」+「仅出报告」。
- **详情页**：mainPendingBook 新增 rebN / rebNames；IN 主案件状态卡和 KR krMainStatusBar 第一行都显示红字「待重新预约 N 项：…」。
- **操作锁**：presTag（列表客人名后「XX 室长正在处理」）排除自己账号（同账号别的分页也不算别人）。
- **Fanny A000010 过期提醒原因**：todo.js 的「项目确认中超过 3 天没动静」条件是「面诊报告已出 + projectsEnabled + 没有结算单」，继续面诊的子记录（A000010-02）选项目付定金后，赴韩项目和结算单整体交给主案件（paidOnMain），子记录自己没有结算单 → 一直满足条件。现在加 !c.paidOnMain。
- 测试：selftest 新增 R222a（A1）、R222b（KM1，stageC）；R121a 断言「其他进行中」→「下一个日程」；回归对照 7633c89：A1 全套 / KM1 / KD1 / roletest 失败集合一致。

## CMD-1105-02 补充（2026-11-05，追加；取代 CMD-1103-08 里重新约那天的简化做法——调整方案只记 memo、取消项目只通知 IN、隔天确认不弹原因窗，旧文字保留作历史）
- 分支 **V4**，代码提交 b874c19，文档另一个提交；不推送不合并；**数据版本不变（57）**（新增可空字段：`c.visitEval[key].phase/adj/dec/payDue/paid/newTotal/compKrw`）。用户确认过的「到院当天」主线改动。
- **原则**：重新约那天（子到院 / surgUse 行）不另写简化版，接回主到院那一套既有积木，只是范围限定在「这次到院重新约的这几项施术」：接回的有——选择器 krAddChooser（施术 / 管理项目）、krDetailOf、coreAddOnItem、coreUnitBookUse、coreAfterItemsRemoved、coreCompCreate（置换额度）、coreLeaveCancel / leaveValidate / krLeaveWhyOpen（原因窗）、krExtOpen（问延长）。**接不回去的**：主到院那套的核心（coreJudge / coreSettleBalance / coreRefundDecision / coreCannotReplace / coreMarkUnable）全部绑在 `c.krJudge`、整案件的 `krBalancePaid` 和整案件的定金 / 尾款计算上，重新约那天尾款早就付清、范围只是几项，所以这几个核心没法直接调，用 `visit*` 版本（同样的三步 / 三选一，钱按「这几项已付的」算）。
- **评估状态机**（data.js）：`visitEvalPhase` = ''（还没评估）/ `adjust`（需要调整方案，向导中）/ `pay`（等补付差额）/ `cancel`（不建议手术 · 取消项目，等款项去向）/ `done`；`visitEvalNeed` 在前四个阶段都为真（锁［操作完成］和［客人已离院］），`visitEvalLockText` 写对应原因。
- **需要调整方案**（`coreVisitAdjust`）：① 选要更换的项目（只列这次到院重新约的施术；什么都不勾 = 只增加项目）② 重新选择（krAddChooser，一换多多换一不限，选施术问延长 → `visitAdjConflict` 把保留的 + 要加的 + 延长合起来查院长时间）③ 结算 `visitMoneyStep`：新合计 − 被更换项目已付：多 → `pay` 阶段，`coreVisitAdjustPay` 生成 addOn 结算单（差额，`visitAdj` 记这天）；少 → 差额 `coreCompCreate` 转置换额度；没差额直接 done。新加的施术直接挂在这天（已到院）。
- **不建议手术 → 取消项目**（`coreVisitCancelDecide`）：更换项目（只选管理项目，不问延长，同钱的算法）/ 全部退回 / 部分退回（金额 > 0 且小于这几项已付、memo 必填）；没退的钱转置换额度；KR 只记判断，IN 收 action 级通知「请按此操作退款（退款方式必填）」；取消的施术时间段放掉、对应术后管理一起取消。**更换时间**除「之后再约」外可「当场约」（`visitRebookErr`：日期从明天起、在在韩期间内、避开休诊、院长固定对接院长、同一位院长合计查），校验不过整笔不改。
- **离院 / 隔天确认**：`coreEndSubVisit(c, key, by, reason, leave)` 在评估之后、还有重新约的施术没做 → 返回 `needLeave`；kr.js `krEndAskOpen` 对子到院弹 `krLeaveWhyOpen(items, {sub:key})`，选完才结束（身体不适 → 当场约 / 之后再约；客人放弃 → 取消项目三选一；其他 memo 必填，`visitLeaveApply`）；隔天确认 `krDayConfirmGo` 对子到院选了「没做」的施术同样先弹这个窗，`krDayConfirmRun` 校验并处理。系统结束（`by==='系统'`）不弹、标待重新预约、写「未选原因」。**离院在评估之前仍锁住**（1103-08 / 1103-02 的规则），所以「评估也没做」的只出现在隔天确认路径。
- **四 KR 预约弹窗**：`krCbCheck` 同一天同一位院长勾了几项院长操作项目 → `dirSeqCheck` 合计（并进已有到院时加上那次到院自己的时长）。一次约多项同一位院长的入口清单（都已用 dirSeqCheck）：KR 预约弹窗 krCbCheck、KR 确认占位 coreBookConfirmLinked、IN 占位提交 krbSubmit、离院当场约 leaveValidate、重新约那天调整方案 visitAdjConflict、更换时间当场约 visitRebookErr。没接的：到院 Step 2 添加项目（coreProjectedConflict，按主到院的施术块整体算，本来就是合计）。
- 测试：selftest 新增 R223a（KM1，stageC）、R223b；回归对照 CMD-1105-01：A1 全套 / KM1 / KD1 批次 / roletest 失败集合一致。

## CMD-1105-03 补充（2026-11-05，追加；取代 CMD-1103-02 里「待重新预约的施术挡主案件结案」在行程结束之后的部分，旧文字保留作历史）
- 分支 **V4**，代码提交 1b2fe82，文档另一个提交；不推送不合并；**数据版本 57 → 58**（新字段 `it.heldSurg = {at, by, why, rw}`）。用户确认过的「行程结束 / 主案件自动结案」改动。
- **行程结束时没做的赴韩施术转「韩国持有」**（data.js `coreHoldSurgOnTripEnd`，在 `coreTripEnd` 里调用——过了离境时间自动结束、KR［行程修正］手动结束、IN 到访自动结束都走它）：待重新预约的 + 其他没做、没取消、没约时间的施术 → `heldSurg`（钱留着不退不扣），Timeline 记一条「行程结束：N 项施术没做，转成韩国持有」。`surgUndone` / `rebookWaitItems` 不再算它们 → 不挡 `mainAutoComplete`（待重新预约在行程没结束时仍算没做完）；术后管理 / 复诊评估等照旧挡。结案后结束方式「赴韩结束 · 有持有项目」（`caseProcessText0` 有 heldSurg 时写「赴韩结束」，`mainHoldOf` 含这几项）。`reopenTripIfNeeded`：行程重新打开 → 持有的施术回到待重新预约。
- **IN**：待办 `heldsurg`「客人行程已结束，还有没做的施术（已转韩国持有）：…」，只提醒不挡结案，点开去客人页，［标记已联系］（ackKey `heldsurg`）关掉；客人页「韩国持有 · 施术项目」列出（`cliHoldKrRows` 的 `heldIid`），IN 室长有［取消 / 退款］（`openHeldSurgCancel` → `coreHeldSurgCancel`）：更换项目（全额转置换额度）/ 全部退回 / 部分退回（金额 > 0 且不超过这项已付、memo 必填）；退款方式必填（现金 / 转账 / QRIS / 其他）；没退的转置换额度；退款记回原主案件（`c.refunds`）。`coreLeaveCancel` 加 `r.silent`（不再给 IN 自己发退款通知）。
- **KR**：待办「待重新预约」消失；列表（`krListStage`）：已结案的赴韩案件一律灰色「赴韩施术」（不再写「已完成」），进程写结束方式；行程结束但案件还在进行（术后管理）且有持有的施术 → 灰色「赴韩施术」、进程「行程结束 · 施术未做 N 项（转持有）」；仅出报告仍是灰色「面诊安排」。KR 客人页持有里看得到（同 `cliHoldKrRows`）。
- **迁移 58**（store.js）：行程已结束的案件调 `coreHoldSurgOnTripEnd`（迁移按列表顺序跑，58 在 57 前面，所以先补跑 `oldLeaveToRebookWait`）；用 11/02 07:58 备份在隔离端口验证：56 → 58，25 个案件迁移、0 失败；Fanny A000010 的两项待重新预约先转 57 的 rebookWait；备份里 Fanny 离境日是 2027-01-19、行程还没结束，所以把离境日改到昨天再跑自动结束：2 项转持有、案件结案「赴韩结束 · 有持有项目」、Timeline 只写一次、之后重算不再写。
- **没做 / 现在的处理（⑤）**：「继续之前的案件」对有韩国持有施术的案件**现在选不到**（B27 规则不变）：面诊只列仅出报告的案件；复诊评估要求做过施术（followDoneItems）且 3 个月内；术后管理要求今天有约好的印尼术后管理——一个只有持有施术的主案件三个条件都不满足。下次赴韩用持有施术（递交日期 → KR 确认 → 到院评估）这条路这次没做，等用户定。
- 测试：selftest 新增 R224a（A1，stageC）、R224b（KM1，stageC）；回归对照 CMD-1105-02：A1 全套 / KM1 / KD1 / roletest 失败集合一致。

## CMD-1105-04 补充（2026-11-05，追加；取代 CMD-1105-03 的「下次赴韩用持有施术没有入口」，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1105-04`），文档另一个提交；不推送不合并；**数据版本不变（58）**（新增可空字段：项目 `heldFrom={caseId,caseNo,iid,paid,origName}`、原案件项目 `heldTransferred={toId,toNo,at,by,paid}`、结算单 `heldCredit`；旧资料不用迁移）。会动「选项目 → 付定金 → 升级主案件」的结算，用户已确认。
- **流程不变、没有新入口**：下次赴韩仍从面诊开始（一般面诊，或复诊评估「建议赴韩」开新主案件）；「继续之前的服务」里没有直接赴韩的入口（R225a 锁住）。
- **IN 选项目**（data.js `heldPickerHtml` / `clientHeldSurgPool` / `heldMatchScope` / `toggleHeldSurg`，挂在 `projectPickerHtml` 赴韩项目最上面）：列出这位客人名下**其他主案件**的韩国持有施术，标「已付 · 韩国持有（来自 A00xxxx）」+ 已付金额。**「同一项目」= 这次院长方案（`krScope.items`）里有同名的施术项目**（同一项目库项目；施术项目没有规格，所以不分规格；管理项目不参与）；方案里没有 → 灰掉，悬停和行内写「这次院长的方案里没有这一项；不做的话请从客人页取消 / 退款」；同一项目已用另一笔持有抵扣 → 灰掉。勾了 = 该项目进已选并带 `heldFrom`，行内写比已付高 / 低 / 一样。
- **抵钱**（rules.js `computeBatchBreakdown`）：这一项按这次价格计入赴韩合计；`heldCredit = Σ min(已付, 这次价格)` **先抵定金、剩下的抵尾款**：结算单 `krDeposit`（IN 这次收的定金）= 30% × 合计 − 抵定金部分，`krBalance` = 合计 − 定金 − heldCredit，`b.heldCredit` 另存；`krBalanceInfo` 的可抵定金 = krDeposit + heldCredit，所以 KR 尾款 = 项目合计 − 定金 − 持有抵扣；`krDepositPaid` 认 heldCredit；`financePaid` 只算 krDeposit（持有已付的钱留在原案件，不重复计入）。这次价格比已付高 → 只付差额；比已付低 → 差额（已付 − 这次价格）付款确认时 `coreCompCreate` 转置换额度。**已付** = `heldPaidOf`：尾款已付清 / 找不到结算单 = 项目价格，否则 = 该项目的定金份额（批次 krDeposit × 项目价 ÷ 批次 krTotal）。（注意：CMD-1105-03 的客人页取消 / 退款仍把「已付」当项目价格，这次没改。）
- **只勾持有、没有别的要付的钱**：`confirmProjectSelectionGo` 生成结算单后，发现 `krDeposit=0 且无本地款且 heldCredit>0` → 自动打开确认付款窗（显示「本次应付 ₩0（已用韩国持有抵扣）」，需要麻醉同意书的照旧要勾），点［确认付款］就升级成赴韩案件（`settlementDone`、`isUpgraded`）——也就是「确认赴韩项目那天升级」只限这种情况，做法是同一个付款确认窗，不是另一套流程。自测钩子 `window.GMC_NO_HELD_AUTO`。
- **持有转进新主案件**（`applyHeldTransfer`，在 `confirmSettlementPayment` 里 `batch.status='active'` 后）：原案件那一笔 `delete heldSurg; swapped=true; heldTransferred={…}`（不再是持有、不再算进行中项目，原案件重算状态），原案件 Timeline 记「已转到 A00xxxx」、新案件 Timeline 记「使用韩国持有的施术…抵扣」（都是人为记录）；新案件的赴韩项目带 `heldFrom`，之后照新案件流程（递交施术日期 → KR 确认 → 到院评估）。**付款前不动原案件**（取消结算单不会丢持有）。没勾的持有留在原案件，仍可从客人页取消 / 退款。
- **KR**：项目卡来源标签写「来自 A00xxxx 韩国持有」（`krSrcTag`）；不显示 IN 的金额细节（照旧）。
- 测试：selftest 新增 R225a（A1，stageC 夹具）。

## CMD-1105-05 补充（2026-11-05，追加；取代 CMD-1022-15 / 1028-01 里 IN 预约空档来访目的四个、CMD-1028-01 里「从主案件约的预约到店默认选好服务类型」仍弹对话框，旧文字保留作历史）
- 分支 **V4**，代码提交 ea0ab41，文档另一个提交；不推送不合并；**数据版本不变（58）**（新增可空字段 `purposeLocked`，旧资料不用迁移）。会动预约和到店归属，用户已确认。
- **一 IN「预约空档」来访目的三个**（ui.js `renderAddSlotBody` / `addSlotPurposeRefresh` / `confirmAddSlotExisting`，data.js `purposeSelectHtml` / `addSlotCands`）：老客人 = 面诊商谈 / 术后管理 / 复诊评估，新客人 tab 只有面诊商谈。面诊商谈照旧（独立 Case ID，到店弹服务类型）。术后管理 / 复诊评估多一个「选择主案件」下拉，写法 `mainPickLabel`：「A000844 · 切开双眼皮（01/15 施术）」（没做过施术写面诊日期），术后管理再列出该主案件未预约的印尼术后管理（`todoUbGroupsIn`，标「对应施术 · 术后第 N 天」）勾要做的（至少一项）；确认后 `createChildReservation` 直接挂在主案件下新开子案件（不占新 Case ID），勾的项目 `careFor.keys` → 变已预约、从未安排预约消失（取消 / 未到店回未预约，沿用 inCareBooking）；同一天已有该主案件的预约就并进去。没有可选主案件 → 选项灰掉并写原因（「没有未预约的术后管理」「没有做过施术的案件」「距施术完成日超过 3 个月」）；弹窗底下的说明按目的改写（「确认后挂在 A00xxxx，进入待访问」）。`mainForBookingPurpose`（客人自己预约页、旧入口）保留。
- **旧数据**：已约的「皮肤管理」预约照旧有效，画面显示成「面诊商谈」（`purposeDisp`：日历、日历格子、待办、来访目的行）；已约的「术后管理 / 复诊评估」但没挂案件的（独立预约，没有 `mainId`）到店时照旧弹服务类型，不自动猜案件（本地存档里的数量要用户那边的数据才知道，我这边隔离数据里没有这类）。
- **二 带着目的的预约到店不再弹「请选择本次服务类型」**（data.js `followupAsk` → `followupAutoLink`）：条件 = `c.preChild && c.purposeLocked!==false`（`createChildReservation` 默认 `purposeLocked=true`，所以［预约复诊］、术后管理预约、IN 空档选术后管理 / 复诊评估、KR 占位关联案件建的都算；旧的 preChild 没有这个字段也算）；客人自己在预约页约的（`submitSelfBooking` 传 `purposeLocked:false`）、面诊商谈、临时到店仍弹。到店后自动按预约的类型继续主案件（等于原来对话框默认值一键确认），然后弹原来的继续资料窗（메타뷰 + 复诊的项目 / 视频照片 / 询问问题，术后管理项目只读列出；没有「面诊需求」）。`contTodayCareRows` 补了按名额（`unit|项目|第几条`）预约的术后管理（原来只认现成的行）。
- **页头横幅**（`thisVisitBannerHtml`，`renderCaseSubtitle`）：「本次：复诊评估 · A000844（院长建议 02/22）」/「本次：术后管理 · A00xxxx · 拆线」，旁边［增加本次服务］（`addServiceOpen`：术后管理 / 使用持有项目 → `inUseOpen`、购买本地项目 → `inAddLocalProject`、复诊评估 → `addRevisitToDay`）；术后管理的来访加做复诊评估只在该案件做过施术时出现（`revAddPossible` 加了 followDoneItems 判断）。**没有放「面诊」**：1028-14 已特意拿掉子案件页的［增加面诊］，这次沿用（见汇报）。
- **三 案件下拉写法**：「继续之前的服务」弹窗的案件下拉改 `mainPickLabel`（取代「A000844 · 术后管理 · 术后管理（印尼）· 等 IN 结案」）；预约弹窗的「选择主案件」同一写法。
- 测试：selftest 新增 R226a；R151a / R152a 的断言按新规则改（改前：到店 `FU_ASK` 默认选复诊评估 + 主案件；改后：不弹窗，`resumeFrom` 直接是复诊评估 + 主案件，测试里要先 `ST.open(rc)`）。

## CMD-1105-06 补充（2026-11-05，追加；取代 CMD-1105-05 里的［增加本次服务］和 CMD-1028-14 七里「到访 tab 来访目的勾复诊评估」，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1105-06`），文档另一个提交；不推送不合并；数据版本不变（58）；只改画面入口。
- 拿掉［增加本次服务］按钮和弹窗（`addServiceOpen` / `addServiceClose` 删除）。复诊来访页头只显示「本次：复诊评估 · A00xxxx（院长建议 MM/DD）」，没有按钮。术后管理的来访页头「本次：术后管理 · …」旁边有［加复诊评估］（`thisVisitBannerHtml`：术后管理来访 + `revAddPossible`（该案件做过施术、这一天还没有复诊评估）才出现；按了走原来的 `addRevisitToDay`，多一个复诊评估 tab，算在同一个子案件，按完按钮消失——`revAddConfirm` 后重画页头）。不是「带目的预约」的术后管理子案件（例如客人自己约、走服务类型弹窗的）也有这个按钮（只显示按钮，没有「本次」文字）。到访 tab 来访目的里原来可勾的「复诊评估」（1028-14 七）拿掉，入口合并成页头这一个；已有复诊评估时仍只读显示。
- 本地管理 / 持有项目 / 购买本地项目一律用现有［+ 添加本地管理］，不另设入口。
- 测试：R226a 改（改前：③ 弹窗有复诊评估 / 购买本地项目；改后：没有［增加本次服务］，术后管理来访有［加复诊评估］；④ 复诊来访页头没有任何按钮）；1028-14 的到访 tab 断言改前「来访目的里有可勾的复诊评估」→ 改后「没有，页头有［加复诊评估］」。

## CMD-1105-07 补充（2026-11-05，追加；取代 CMD-1026-17 里「有了本地管理 tab 后页头入口消失」、CMD-1028-14 七里术后管理那天页头的［增加项目］，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1105-07`），文档另一个提交；不推送不合并；数据版本不变（58）；只改入口和画面，规则和资料都没动。
- **［+ 添加本地管理］**（ui.js `renderCaseHeaderActions` → data.js 新 `inLocalEntry` / `inLocalBuyGo` / `inLocalClose`）：客人有可用持有（术后管理未预约 / 本地管理未用）→ 先开小窗分两块：「使用持有」（沿用 `inContRestHtml` 剩余项目卡，术后管理 / 本地管理两个 tab，勾选 →［本次使用］→ `inUseOpen/inUseConfirm` 移进今天做的，确认后小窗关掉）/「购买新项目」（点了关掉小窗，进现有选购画面：子案件或已有本地管理走 `inAddLocalProject`，否则 `addLocalMgmt`）；没有可用持有（或只读）→ 直接进购买，不多一步。两块用上下排（顶部两个按钮 + 下面持有卡）。`inLocalEntry('buy')` 直接进购买（剩余项目卡里的［＋ 添加本地管理项目］用它，避免小窗套小窗）。
- **按钮一直都在**：原来 CMD-1026-17 的条件 `!c.localMgmt` 才画页头按钮（加过本地管理、多了本地管理 tab 后入口以为在 tab 里），而 tab 里的入口只在「两类剩余项目都没有」时才画，所以会整个消失。现在：来访进行中（子案件，或面诊 / 赴韩主案件）、没离店、没结束、没被 00:00 锁住、仍在可添加的当天（`localAddAllowed`）→ 页头一直有；本地管理 tab 空时那一行也走同一个入口。术后管理那天页头原来的［增加项目］（`inAddItemOpen`）并进这个按钮（函数留着没入口）。
- **适用画面**：复诊评估来访、术后管理来访、面诊商谈 / 面诊案件、赴韩案件主页、继续面诊的子案件；纯本地案件（含「使用之前购买的项目」）有自己的选购 / 使用清单（［新增项目］［使用项目］），不画这个按钮。
- 测试：新增 R227a；R138a / 1026-17 相关旧断言不变，全部通过。

## CMD-1105-08 补充（2026-11-05，追加；取代 CMD-1105-07 里「添加本地管理」小窗用剩余项目卡 + ［关闭］、购买换成另一个弹窗，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1105-08`），文档另一个提交；不推送不合并；数据版本不变（58）；只改画面，沿用现有勾选 / 本次使用 / 选购 / 结算函数。
- **一个弹窗两个 tab 一直在**（data.js `inLocalEntry` / `inleTab` / `inleRender`，状态 `INLE={caseId,tab}`，弹窗 `#in-localentry-overlay`）：「使用持有」（每一行前面有勾选框，清单就是 `inUseOpen` 的清单，`IN_USE_EMBED` 时只返回清单 HTML；右下角按钮是［本次使用］，没勾时灰，勾了才能按，按了走原来的 `inUseConfirm` 移进今天做的并关弹窗；失败提示是弹窗里的红字；关闭用右上 ✕）/「购买新项目」（现有选购画面 `lmBuyHtml` 嵌在同一个弹窗里，结算 / 本次不购买照旧，随时可以点 tab 切回「使用持有」：`inleTab('use')` 先收起选购 `lmNoBuy`）。购买 / 本次不购买之后 → 回到「使用持有」，刚买的项目在列表里（先进未预约）；客人没有持有时关掉弹窗。`lmBuyModalRender` 在弹窗开着时把选购画面画进这个弹窗（不再另开 `#lm-buy-overlay`）；`lmNoBuy` / `lmSettleDo` 外面包了一层兜底（lmBackOut 等路径不经过选购重画）。客人没有持有 → 打开就在「购买新项目」，「使用持有」tab 灰掉并写「没有持有项目」。购买一律走 `inAddLocalProject`（`inLocalBuyGo`）。「剩余项目」卡本身（子案件页里）没改。
- 测试：R227a 按新画面改写并通过（勾选框 / ［本次使用］灰 / tab 来回切 / 买完回使用持有 / 没有持有灰掉）；回归与 1105-07 基准一致。

## CMD-1105-09 补充（2026-11-05，追加；取代 CMD-1028-03 / 1027-06 里 KR 复诊评估「评估内容」块的顺序、必填项和［完成评估］、CMD-1019-24 里评估前的［开始评估］摘要卡，旧文字保留作历史；规则见开发交接 05 的 5-15）
- 分支 **V4**，代码提交见 git log（`CMD-1105-09`），文档另一个提交；不推送不合并；**数据版本不变（58）**（新增可空字段 `c.revEval.ans`、`c.revisitAnswer={text,zh}`、录入内容 `tgt:'ans'`；旧资料不补造）。
- **拿掉重复摘要卡**：复诊评估 tab 不再画 `krEtaStatusBlock`（「复诊评估 · 院长 · 评估中［展开］」），只留完整的复诊评估 card（`krRevEvalCard`）+「评估内容」块。**页头状态**：KR 的复诊评估子案件页头原来读主案件那一行的 `krStage`（显示「术后管理 · 术后管理（印尼）· 等 IN 结案」），改成 `krRevChildStage(ch)`（待确认评估时间 / 等待院长评估 / 院长评估中 / 院长已上传 · 待发送 IN / 结果已发送）。**其他 KR 子案件页头查过**：非施术日到院页（`krSubPageHtml0`）和施术当天页（`krSdStatusBar`）的状态标签本来就读这一天的状态（`visitStateText` / 到院状态），没有同样问题；只有复诊评估这个分支用了主案件的 `r.krStage`。
- **院长「评估内容」从上到下**（kr.js `krRvWorkBlock`）：1 整体结论（必填，院长自己选，AI 不自动选）→ 2 录入内容（［🎤 增加内容（语音）］［⌨ 增加内容（手动）］［✨ AI 整理（演示）］，录入的每一笔直接列出、不收起，新的在最上面）→ 3 逐项评估意见（选填，去掉 *）→ 4 回答疑问（新栏位，只有 IN 填了 `revisitQuestion` 才出现：自己的语音 / 手动 / AI 整理 + 回答文字；录入时 `KR_REC_TGT='ans'`，transcript 带 `tgt:'ans'`，不混进上面的录入内容）→ 5 注意事项（选填）→ 6 下次复诊时间（必填，下拉「请选择」+ 不需要再复诊 / 2 周后 / 1 个月后 / 3 个月后 / 指定日期，`REV_NEXT_LABEL.none` 改成「不需要再复诊」）→ 右下［上传评估］（原［完成评估］）；整体结论 / 下次复诊时间没填 → 灰掉，旁边写「还缺：…」（`rvMissing` 现在只查这两样 + 指定日期要有日期）。**开始 = 第一次动作**（`rvAutoStart`：写字 / 选结论 / 录入上传任一项，记 `consultStartedBy`），不再有单独的［开始评估］。
- **AI 整理**（`krRvAiOrganize(tgt)`）：按了才跑；录入内容的 → 填逐项评估意见、注意事项、建议下次复诊时间（演示：1 个月后）；回答疑问的 → 只填回答疑问；整体结论不碰；已写的字不覆盖（有字时补在后面，已包含的不重复补）。
- **室长三种状态**（`rvMode` / `krRvWorkBlock`）：A 院长还没开始 = 「等待院长评估」+ 勾「已得到院长授意」（`krRvAuth`，记操作人和时间），勾了出现和院长一样的 1～6 +［上传评估］，记「室长代录 · 院长授意」，上传后［发送给 IN］；B 院长已开始 = 「院长评估中」，勾选消失、没有任何输入栏位——**判断条件 = `krDirStarted(c)`：`consultStartedBy` 带「院长」**（和面诊「院长开始后室长录入按钮消失」同一条）；室长已经勾了授意、院长才开始 → 勾选消失，室长代录的栏位立刻变只读（已录的内容保留，`c.revAuth` 记录还在但不再生效）；C 院长已上传 = 1～6 只读（逐项意见 / 回答疑问 / 注意事项文字可整理并留纪录、结论 / 下次复诊不能改），［退回院长］［发送给 IN］（原［发送复诊评估结果］）。旧数据：已完成 / 已发送的（没有下次复诊时间、没有回答疑问）照旧显示，不补造；室长代录的旧资料（上传了但没有 revEval）发送时仍要补齐结论 / 下次复诊。
- **IN**：`krSubmitReport` 把回答疑问存成 `c.revisitAnswer={text:韩文原文, zh:中文译文}`（`krZhShort`，真翻译 API 之后接在这里）；IN 的复诊评估报告（`revReportDocHtml`「回答疑问」一节，译文 / 原文随开关）和评估摘要（`revSummaryText`「回答疑问：…」）都有。
- 测试：新增 R228a（KD1）/ R228b（KM1）；旧断言更新（改前 → 改后）：［完成评估］→［上传评估］、「评估完成 · 待室长发送」→「院长已上传 · 待发送 IN」、［发送复诊评估结果］→［发送给 IN］、逐项意见必填 → 选填而下次复诊时间必填（R151b / R153b / R162a / R162b / R163b 里补 nextType）、「无需复诊」→「不需要再复诊」。R104b / R106a / R100b 在基准上就因为夹具缺失被跳过（没跑），断言没改。

## CMD-1105-10 补充（2026-11-05，追加；取代 CMD-1105-09 里复诊评估「增加内容（语音/手动）+ 右侧录入侧栏 + 一笔笔录入卡片」和回答疑问的 AI 整理，旧文字保留作历史；规则见开发交接 05 的 5-15「输入方式」）
- 分支 **V4**，两个代码提交（复诊输入一个、顺带两项一个）+ 文档提交；不推送不合并；**数据版本不变（58）**（新增可空字段 `c.revEval.rec` / `migrated`；旧录入记录不删）。
- **复诊评估每个文字栏** = ［🎤 语音输入］+ 输入框（kr.js `krRvField` / `krRvMic` / `krRvMicStop`，输入框 id `rvta-<key>`，key = `rec` 录入内容 / `op0…` 逐项评估意见 / `ans` 回答疑问 / `note` 注意事项）：按钮变［■ 停止］，转写直接出现在输入框（接光标位置，没光标接在后面），不弹右侧栏；可直接打字，语音和打字混着用（离开输入框 / 停止就存）；同一时间只有一个框在录（开另一个先停前一个，整页重画前也先停并存好）；没有语音识别的浏览器填入演示韩文。拿掉「增加内容（手动）」、录入侧栏、一笔一笔的录入卡片（`krRvRec` 删除，`KR_REC_TGT` 留着没用）。**室长看院长已上传的内容（C 状态）**仍是只读 + 可整理文字，录入内容只读显示。
- **AI 整理**：只有「录入内容」框有，整理这个框里的字 → 逐项评估意见 / 注意事项 / 建议下次复诊时间（按了才跑、不选结论、不覆盖）；**回答疑问没有 AI 整理**。
- **旧录入记录合并**（`krRvMigrate`，打开复诊评估 tab 时每个案件合并一次，`revEval.migrated={n,na}`）：vault 里的一笔笔记录按时间旧到新、换行分隔合并进 `revEval.rec`（`tgt!=='ans'`）和 `revEval.ans`（`tgt==='ans'`），不丢；vault 里的原始记录保留不删；案件 Timeline 记一条系统记录写合并了几笔。
- **Timeline**：每次语音输入记一条「语音输入：<哪一栏>（语音识别 / 演示文字）」（谁、什么时候，不记整段内容，类型 = 人为）。
- **和面诊是否共用组件**：不共用。复诊评估这套是新的 `krRvField` / `krRvMic`（页内），面诊内容录入仍是右侧栏 `krRecOpenModal` / `krRecordBlock`，没有动（`KR_REC` 只在 `krSaveTranscript` 多带了 `tgt` 字段，面诊行为不变）。
- **顺带 7：IN「预约空档」不预选客人**（ui.js `renderAddSlotBody` / `addSlotClientChanged` / `addSlotPurposeRefresh`）：「选择客人」默认空（灰字「选择客人」）；没选前不显示未满 21 岁提醒、来访目的 / 选主案件（只写一行「请先选择客人」），［确认预约］灰掉；选了客人才出现。新客人 tab 没有客人下拉（只有手机号），没改。**其他「选择客人」下拉**：KR 日程占位（`krbRender`）本来就默认「请选择」，不预选；全站只有这两处按客人名下拉。
- **顺带 8：复诊评估子案件错挂「项目确认中超过 3 天」**：原因 = `coreSubmitReport` 对所有报告都设 `projectsEnabled=true`（复诊评估也算），而待办 `quiet` 的条件只看 `consultStatus==='report_ready' && projectsEnabled && 没结算单 && 没 endNote`，不看这是不是复诊评估——和 1105-01 修的 Fanny（继续面诊定金交给主案件 `paidOnMain`）是同一类（条件没排除「这一笔本来就没有项目确认」的子记录）。现在排除 `isRevEval(c)` 和「没附项目方案的复诊面诊」；条件是现算的，所以 Carry A000844-07 / Betty A000002-07 的提醒自动消失，真的在项目确认中的（一般面诊出方案没选项目 / 没结算单）照旧提醒。**待办里其他「项目确认中超过 3 天」**：这条规则只剩 `report_ready` + 有项目方案 + 没选没付的案件会触发（一般面诊、继续面诊没付定金）；Grace A000011 如果是一般面诊出了方案没选项目就是对的——用户数据我看不到，请用户对一下。
- 测试：新增 R229a（KD1）/ R229b（A1）；更新 R162a（［语音输入］取代［增加内容（语音/手动）］）、R228a（录入内容是输入框）、R195a / 其它「预约空档」旧测试（选了客人后要调 `addSlotClientChanged()`）。R132b 在基准上就因时间失败（与本次无关）。

## CMD-1105-11 补充（2026-11-05，追加；以任务页面为准，取代开发交接 05 的 5-4 / 5-15 里与下面不一致的部分，以及 CMD-1105-09 里「院长上传后还能改」「室长可以代按［开始面诊］」「面诊录入走右侧栏」，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1105-11`），文档另一个提交；不推送不合并；**数据版本不变（58）**（新增可空字段 `c.consultEval={rec,sub,role,by,at,doneBy,doneAt,ret[],retPending,migrated}`；旧案件没有它照旧当「已上传 / 进行中」）。
- **共同框架**：上 = 资料卡（面诊 =「面诊资料」，复诊 =「复诊资料」，右上角状态：等待院长评估 / 院长正在评估 / 评估完了；室长 ③ 默认收起，有［展开］，`krDataCard` / `krDataOpen`），下 = 评估卡。状态 `krEvState`：idle（没有 `consultStartedAt`）/ doing / done（`consultContentAt`）。「院长已开始」沿用 `krDirStarted`（`consultStartedBy` 带「院长」）。
- **三种状态 × 角色**：① 院长 =「面诊（复诊）｜院长：X」「等待院长评估」+ 两行时间（预约面诊 / 报告时间，复诊 = 评估 / 结果时间；报告 / 结果时间旁［修改］，**院长也能改自己案件的时间**，`krDoEta`）+ 最右［开始面诊］/［开始复诊］（直接开始，不再弹选择录入方式 / 不开侧栏）；室长 ① =「评估内容」「等待院长评估」+ 同样两行时间 +［修改］（**没有［开始］**）+ 勾「已得到院长授意」（`revAuth`，记操作人和时间）→ 出现和院长 ② 一样的画面，上传记「室长代录 · 院长授意」；② 院长评估中 → 院长：面诊 = 录入内容（［🎤 语音输入］+ 输入框，`krRvField('gcrec')`）→ 推荐项目（项目库，`krGcPickColumn`，选择快照每次重画存进 `consultEval.sub`，换分页 / 刷新不丢）→ ［上传评估］（缺 录入内容 / 推荐项目 灰掉写缺什么，`gcMissing`）；复诊 = 1105-09 / 10 的样子；室长 ② = 「院长正在评估」，勾选消失、没有输入栏位；③ 院长已上传 → **院长全部只读**（`rvMode`/`krGcMode` 返回 `locked`：没有输入框 / 语音 / 按钮，`coreRvSet` 对院长写的内容上传后拒绝），状态「评估完了」；室长：资料卡收起，评估卡「面诊评估 / 复诊评估」「评估完了」只读，下面「发送诊疗方案」（`krSubmitBlock`，院长选的推荐项目已带入）/「发送复诊评估结果」，另有［退回院长］（面诊新增 `coreGcReturn`，复诊沿用 `coreRvReturn`；`krRvReturnGo` 按类型分发）→ 院长回到 ②。
- **面诊录入**：不再走右侧栏 / 一笔笔卡片 / 「增加内容（手动）」，和复诊同一套 `krRvField` / `krRvMic`（key `gcrec`）；旧的一笔笔录入（vault `transcripts`）打开时合并一次进 `consultEval.rec`（`krGcMigrate`，按时间旧到新、换行分隔，原始记录保留，Timeline 记一条系统记录）。`krStartChooseOpen` / `krRecordBlock` 对一般面诊不再使用（延续既往面诊 / 恢复评估等旧分支没动）。室长 AI 整理报告（`krAiOrganize`）整理的是院长的「录入内容」。
- **共用组件**：`krDataCard`、`krEvState` / `krEvPill`、`krEvTimes`、`krRvField` / `krRvMic`、`krRvAuth`、`krRvReturnOpen`、`krRvFootRefresh`（按类型出脚部）、`krSubmitBlock`；面诊独有：`krGcScreen` / `krGcEvalBlock` / `krGcUpload` / `coreGcUpload`。
- **和开发交接 05（5-4、5-15）不一致、先照任务做的清单**：1 院长不能改预计出报告时间 → 院长可以改自己案件的两个时间；2 5-15「院长上传后发送前还可以修改」→ 上传后院长全部只读；3 面诊「室长可以代按［开始面诊］/ 谁先按都算」→ 室长不能开始，只能勾授意代录；4 5-4 面诊由室长整理报告并选项目 → 院长录入内容 + 选推荐项目 + 上传，室长发送（室长仍可在发送时调整）；5 面诊录入右侧栏 / 弹窗选方式 → 语音进输入框；6 面诊增加室长［退回院长］。
- 测试：新增 R230a（KD1）/ R230b（KM1）；更新（改前 → 改后）：R162a 上传后「院长还能改 / 还能改结论」→ 改不了、状态「评估完了」；R162b / R228b 状态「评估完成 · 待室长发送」「院长已上传 · 待发送 IN」→「评估完了」；R228a / R229a 院长要先按［开始复诊］才有输入栏位（新增 ① 断言）；R122a（面诊前布局）按资料卡 + 评估卡重写；R151b 录入方式文字；roletest「面诊：［开始面诊］」室长 ✅ → ❌（院长 ✅）。**回归发现并修了一个真 bug**：第一版的「上传后拒绝再写」误伤了室长代录的旧资料（revEval.role 还是空），现在只锁 role==='doctor' 的。

## CMD-1105-12 补充（2026-11-06，追加；取代 CMD-1105-04 的价差抵算（heldCredit / 补差额 / 差额转置换额度）和 CMD-1105-03 的「只付定金也自动转持有」，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1105-12`），文档另一个提交；不推送不合并；**数据版本 58 → 59**（`MIGRATIONS` to:59，升级前自动备份，用户案件不丢）。会动结算 / 持有 / 行程结束，用户已确认。
- **一 持有的施术 = 项目本身，不重算价格**：`computeBatchBreakdown` 对带 `heldFrom` 的项目：不进 `krFixed`（不计入这次定金）、只把 `itemKrAmount(it)` 计入 `krTotal`；`itemKrAmount`（rules.js）对 `heldFrom` 项目返回 `heldFrom.balance`（原来没付的尾款，付清 = 0），项目的完整价格用新函数 `itemFullPrice`；`heldCredit` 不再产生（旧结算单仍带这个字段，显示代码保留）。`toggleHeldSurg` 的 `heldFrom` = `{caseId, caseNo, iid, paid, balance, price, origName}`；`heldBalanceOf(c, it)` = 尾款付清 0，否则项目价 − 已付定金份额（`heldFrom` 项目直接读 `heldFrom.balance`）。`krBalanceInfo` 的 `total` 通过 `itemKrAmount` 自然带上这笔尾款（施术那天 KR 照原金额收，不照这次价格）。选项目画面提示「直接用这个项目，不重新算价格」；结算单卡片 / 付款窗写「韩国持有，这次不另收钱」，只勾持有时自动打开 ₩0 确认窗（`batchHasHeld`）。`applyHeldTransfer`：原案件那一笔 `swapped + heldTransferred{toId,toNo,paid,balance}`，状态文字显示「已转到 A00xxxx」（`krItemStatus` / 项目汇总标签 / KR 项目卡），不再生成置换额度。`krDepositPaid` 认 `batchHasHeld`。
- **二 只付定金没做、行程结束 → IN 三选一**：`coreHoldSurgOnTripEnd` 分流——`itemPaidInFull`（尾款已付清 / 在韩加购全额 / `heldFrom` 无欠款）→ 照 1105-03 自动 `heldSurg`；否则 `it.tripWait = {at,by,why,rw}`（不转持有、不结案；`surgUndone` 仍算它所以案件不结案，`rebookWaitItems` 排除它）。`tripWaitItems(c)`；IN 待办 `tripdecide`（没有［已处理］，点开 `openTripDecide(caseId)` 逐项选择弹窗 `#tdc-overlay`）；`coreTripDecide(c, iid, dec, o, by)`：**noshow** 无故未到 · 定金不退（项目 `cancelled` + `noShowForfeit{amount}`，不转持有、不退，Timeline「客人无故未到 · 定金不退」）/ **rebook** 改日（原因必填）→ `heldSurg{reason, unpaid:true, balance}`（「已付定金 · 尾款未付」，客人页写尾款金额）/ **refund** 退款（原因 + 退款方式必填）→ 退 `heldPaidOf` = 定金份额，记在原案件 `c.refunds`（带方式）。处理完照 `mainAutoComplete` 结案 / 转持有。KR：`krListStage` 灰色、进程「行程结束 · 施术只付了定金，等 IN 决定 N 项」；IN 进程「等你决定：…」（`mainProgressText`）；`reopenTripIfNeeded` 把 `tripWait` 退回 `rebookWait`。
- **三 「已付」统一 = 实际付过的钱**：`heldPaidOf(c, it)`：`heldFrom` 项目 = `paid + (尾款已付 ? balance : 0)`；其他 = 尾款付清 / 在韩加购 = 项目价格，否则 = 定金 × 价格 ÷ 本批次里非持有赴韩项目的价格合计（取代以前按 `b.krTotal` 分摊）。`coreHeldSurgCancel` 用它（不再用项目价格），`coreLeaveCancel` 新增 `r.paid` 覆盖；`hscRender` 同。`heldSurgLockedBy(src, iid)`：这项持有在别的案件被勾选（`recommended` 里或未付款结算单里 `heldFrom.done` 之前）→ 返回那个案件号；客人页［取消 / 退款］灰掉 + 「已在 A… 被选用」，`coreHeldSurgCancel` 也拒绝。
- **四（画面）**：客人预约页来访目的 `visitPurposesFor`：老客人 面诊商谈 / 术后管理 / 复诊评估，新客人只有面诊商谈；旧「皮肤管理」预约用 `purposeDisp` 显示成面诊商谈；`submitSelfBooking` 不再挂主案件（`selfMain=null`，客人自己约的一律独立预约，到店照旧弹服务类型）。子案件「剩余项目」卡（`inContRestHtml`）：行前加勾选框（`inrest-ck`）、底下一个［本次使用］（`inRestUse`，没勾灰；术后管理直接移进今日，有「使用时选」选项的本地项目先开原弹窗并预选，`INUSE_PRE`），［＋ 添加本地管理项目］改为 `inLocalEntry()`（同一个「添加本地管理」弹窗）；`inUseConfirm` 的尾部抽成 `inUseApply(c, careIds, picks)`。
- **迁移 59**（store.js）：① 旧的 `heldSurg`（没有 `reason`，即 1105-03 自动转的）+ 只付了定金（`!itemPaidInFull`）→ 退回 `tripWait`，案件已结案 / 仅出报告的用 `reopenMain` 重新打开，Timeline 只写一条「修正旧数据…」；记入 `window.GMC_TRIPWAIT_CONV` / `GMC_TRIPWAIT_CASES`；② 带 `heldFrom` 的项目补 `heldFrom.balance`（读原案件那一笔的价格 − 已付），未付款的结算单按新规则重算（`GMC_HELDCREDIT_RECALC`），已付款且带 `heldCredit` 的只记 `GMC_HELDCREDIT_PAID`、不改（需要人工看），客人「韩国持有的施术转入新案件」置换额度只计数（`GMC_HELDCOMP`）。用 11/02 07:58 备份（隔离端口）验证：56 → 59，25 个案件迁移、0 失败；备份里没有 1105-04 的价差资料；Fanny A000010 在这份备份里行程还没结束，用 1105-03 的结果状态（两项自动转持有、案件结案）模拟后跑迁移 59：两项（埋线双眼皮 已付 ₩300,000 · 尾款 ₩700,000、开内眼角 已付 ₩360,000 · 尾款 ₩840,000，合计尾款 ₩1,540,000）退回「等 IN 三选一」，案件重新未结案，再跑一次不重复。
- 测试：新增 R231a（三选一全流程 / 实际付过的钱 / 被勾选灰掉 / 迁移 59）、R231b（预约页三个目的 / 剩余项目卡）；R225a 改成不重算价格（改前：比已付高补差额 / 差额转置换额度 → 改后：直接用、定金 0、只带原尾款、没有置换额度）；R102a 来访目的 2/4 个 → 1/3 个。回归对照 b1105m：A1 / KM1 / KD1 / roletest 失败集合一致，只多 R132b（与时间有关，基准代码现在跑也失败）。

## CMD-1105-13 补充（2026-11-06，追加；取代 CMD-1105-11 里「院长也可以改自己案件的两个时间」和「上传评估必须选推荐项目」，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1105-13`，排在 CMD-1105-12 之后——12 先做完提交了，13 没法插到前面，除非改历史），文档另一个提交；不推送不合并；数据版本不变（59）。
- **院长的［修改］拿掉**：`krEvTimes` / `krEtaBlock` / `krDoEta` 只认 `krCan()`（室长 / 管理者）；院长 / 代表院长两行时间只显示。程序里也挡：`coreSetReportEta(..., isChange=true)` 在当前账号是院长角色时返回 false。室长的［修改］保留。
- **室长开始入口清单**（都核对过）：① 一般面诊 ① 评估卡 `krGcEvalBlock`（院长分支才有［开始面诊］）② 复诊评估 ① 卡 `krRvWorkBlock`（院长分支［开始复诊］，室长分支只有两行时间 + 授意勾选）③ 旧面诊卡 `krConsultCardGen`（`canStart` 现在要求 `krIsDirector()`）④ 旧 `krEtaStatusBlock`（同）⑤ `krStartConsult()` 本身：非院长直接 return ⑥ 工作台 / 案件列表 / 今日到访 / 待办 / 日历 / 通知：搜 `开始面诊|开始复诊|开始评估|krStartConsult|coreStartConsult`，没有别的按钮入口。室长勾授意后第一次录入 / 选结论 / 写字，由 `rvAutoStart` / `coreGcSetRec` 间接记开始（不是按钮，1105-11 已确认）。
- **推荐项目可选可不选**：`gcMissing` 只查「录入内容」；院长（和室长代录）只要录入内容有字就能［上传评估］，「还缺」里没有推荐项目；室长 ③ 发送诊疗方案的规则不变（CMD-1013-07：发送时至少勾 1 个赴韩项目，院长没选就由室长自己加）。面诊退回院长不动。
- 测试：R230a 改（改前：两行时间旁有［修改］；还缺 录入内容、推荐项目 → 改后：没有［修改］、程序也改不了；还缺只有 录入内容，没选项目也能上传）；R230b 改（室长 ① 有［修改］、调用开始入口开始不了、代录不选项目也能上传）。

## CMD-1105-14 补充（2026-11-06，追加；补 CMD-1105-11 / 13：面诊 / 复诊 退回和重新上传的待办 + 通知，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1105-14`，排在 CMD-1105-13 之后；12 先做完提交了，所以实际顺序是 12 → 13 → 14），文档另一个提交；不推送不合并；数据版本不变（59）。
- **退回**：原因必填（弹窗红字「请填写退回原因」，`coreGcReturn` / `coreRvReturn` 没原因直接拒绝）。院长（案件的对接院长，`to:'director'`）：铃铛通知「KM1 室长 退回了 A… 的面诊 / 复诊评估：原因：…」；工作台待办「退回待修改 · A… · 面诊 / 复诊（原因前 20 字）」（原来面诊是普通的「上传面诊内容」、复诊写「复诊评估被室长退回」，现在统一；kind 仍是 `upload` / `recover`，所以卡片计数不变）；评估卡最上面已有一行「室长已退回（谁 · 时间）：原因」（`retReasonText`：旧资料没有原因 → 「（旧资料，未填原因）」，待办照样出现）。院长重新上传后 `retPending` 清空，待办自动消失。
- **上传 / 重新上传**：第一次上传本来就有通知（`coreGcUpload` / `coreRvFinish` 里 `pushKrNotif`），也有「发送」待办，这次只改了文字；重新上传（`consultEval.ret` / `revEval.ret` 有记录）通知改成「KD1 院长 已重新上传 A… 的面诊 / 复诊评估」，Timeline 记「重新上传评估」。室长待办（kind `send`）：「院长已上传 · 待发送 IN · A… · 面诊 / 复诊」/「院长已重新上传 · 待发送 IN · …」/「室长代录 · 待发送 IN · …」；发送后（`consultStatus` 变 `report_ready`）自动消失。室长代录上传：通知因 `n.by` = 自己所以自己的铃铛没有（其他 KR 室长有），待办留着。
- 新增 `retPendingOf(c)` / `retReasonText(rp)`（data.js）；`notifTodoKind` 认「退回了 … 的面诊 / 复诊评估」「请发送复诊评估结果」（弹出提示）。
- 测试：新增 R232a（KM1：上传 → 待办 + 通知 → 退回原因必填 → 院长通知）、R232b（KD1：待办 / 铃铛 / 评估卡原因 → 重新上传 → 待办消失 → 旧资料没原因）、R232c（KM1：重新上传待办 + 通知 → 发送后消失 → 室长代录 → 复诊同样）；R228a 补 1105-13 漏改的旧断言（院长 ① 没有［修改］）。

## CMD-1106-02 补充（2026-11-06，追加；只改画面 / 文字，不改规则；取代 CMD-1102-08 四里预约页 NIK 的「超过 16 位红字提示」，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1106-02`），文档另一个提交；不推送不合并；数据版本不变（59）。CMD-1106-01 在等你回答（置换额度能不能抵赴韩项目），没有提交，所以这一条直接排在 CMD-1105-14 之后。
- **预约页错误提示跟着语言**（booking.js）：`BK.err` 可以是函数（`bkL(key)` / 闭包），画面每次重画时按当前语言现算（`bkErrText` 在 `bkFooter` 和 6 处直接显示的地方），所以切换语言时已显示的提示会跟着变；原来 32 处 `BK.err = bt('…')` 全部改成 `bkL('…')`。NIK 不足 16 位的提示改成两种语言都有的词条（`nik.errLen`：中文「身份证号（NIK）要刚好 16 位数字（现在 N 位）」/ 印尼文维持原样；`nik.dup`）；`submitSelfBooking` 兜底返回的中文原因（婚姻状况 / 监护人 / 出生日期）改映射到词条（`err.generic` 新增）。
- **混语言清单**（用脚本把 8 步 + 首页 / 查看我的预约 / 手机验证 × 中文 / 印尼文 × 新 / 老客人 × 有 / 无错误提示全部渲染一遍，扫描另一种语言的字）：① 印尼文界面的同意书步骤显示中文隐私说明（诊所设定里那段默认文字）→ 新增词条 `consent.policyText`，默认文字时印尼文界面显示印尼文版（诊所自己改过的文字原样显示，没法翻译）② 6 处错误直接 `bkH(BK.err)` 显示（查看 / 我的预约 / 手机验证）改成 `bkErrText` ③ 中文界面剩下的拉丁字母只有手机号占位 `xxxx` 和测试用的名字；印尼文界面剩下的中文只有首页左上的诊所名（数据，来自诊所设定「GMC 合作诊所（雅加达）」）。
- **NIK 输入框**：预约页——只能数字、最多 16 位（`maxlength=16`，`bkNikLive` 把非数字去掉、第 17 位进不去），右下角「N/16」没满灰色、刚好 16 位绿色；**原来输入框上有两个 `oninput`，后一个（位数提示）从来没生效过**，这次改成一个专用输入框；选填不变（空着能下一步，有填就要刚好 16 位，错误提示在按［下一步］时按当前语言出现）。IN 端三处：基础资料 / 接待的 `nik-in-p`、继续之前的服务弹窗的 `nik-in-cont`（`nikInputRowHtml` / `nikLive`）、管理者更正的 `ce-nik`（`nikCeLive`，新增右下角计数）——同样数字限制 + 灰 / 绿计数；保存时的校验（`nikCheck` / `setClientNik`）没动。
- 测试：新增 R233a（IN 端三种输入框）；R207a 的「输入 17 位红字」改成「第 17 位进不去、16/16、没有红字」，另加「程序直接赋 17 位保存仍被拦」。预约页本身用脚本验证（切语言、15 位 / 16 位 / 贴上带空格字母、错误提示随语言变）。

## CMD-1106-03 补充（2026-11-06，追加；取代 CMD-1015-05 四 / 1015-16 里的［补加可选项目］下拉卡，旧文字保留作历史；规则见开发交接 05 的 5-16）
- 分支 **V4**，代码提交见 git log（`CMD-1106-03`），文档另一个提交；不推送不合并；数据版本不变（59，新增可空字段 `c.scopeLock`，不需要迁移）。CMD-1106-01 仍在等回答，没有提交，所以排在 CMD-1106-02 之后。
- **KR 推荐项目每行［编辑］**（`recProjectsRowsHtml` 的 KR 视图加一栏，`recEditBtn`；只有 KR 室长 / 管理者、诊疗方案已发、案件还在面诊阶段）：只有「未购买」（`recBuyState==='none'`）能编辑，已购买 / 已取消灰掉并写原因；IN 正在选项目 / 付款时也灰掉。弹窗 `#kr-scedit-overlay`（`krScEditSync` 在 `krAfterBlock` 里同步，`KR_SCE` 状态）：施术项目 = 建议在韩天数（含「最少 N 天」自动计算 / 停留原因）、麻醉、麻醉备注、需空腹、所需术后管理（`krProjDetailHtml({name:'__edit'})`，状态用 `krDetailFromItem` 从推荐项目反推）；管理项目 = 份数 + 术后第几天开始（价格 = 项目库单价 × 份数，自动算，不能手改）；施术项目价格不动。保存 = `coreScopeEdit(c, name, patch, by)`：改 `c.krScope.items`，同时把改动同步到 IN 已经勾选但没付款的购物车 / 未付款结算单里的同名项目；Timeline 记「KR 编辑推荐项目「X」：建议在韩 7天 → 9天；麻醉 局麻 → …；术后管理 … → …」（人为）；IN 铃铛「KM1 室长 更新了 A… 的推荐项目：X（术后管理 / 麻醉 / 在韩天数）」。
- **［补加］改用项目购买卡**：`krAddChooser(c, 'sc')`（`KR_SC` 状态，和项目卡右上［增加项目］同一种分页 / 搜索 / 勾选 / 右边已选的卡，内容是 KR 项目库的施术 + 管理项目），弹窗 `#kr-scadd-overlay`，右下［补加（N）］；不显示结算 / 付款 / 赠送；已经在推荐里的项目灰掉标「已在推荐里」（`krSgListHtml` sk=sc；管理项目按「项目 + 规格」灰掉，`krScMgBtn`）；补加的施术先带项目库默认设定（`krDefaultsDetail` → `krDetailOf`），要改再按那一行［编辑］；仍用 `coreAddScopeItem`（只增不减），原有的下拉卡 `krAddCardHtml` 留着没入口；旧「术后管理（在印尼）」补加选项没有了（购买卡只有施术 / 管理项目）。
- **KR ↔ IN 编辑锁**（data.js 末尾）：`c.scopeLock = {side:'KR'|'IN', by, kind, at}` 存在案件对象上（IN / KR 读写的是同一份诊所分区，跨分页靠存档同步）；`scopeLockInfo` 现算过期（`at` 超过 `SCOPE_LOCK_MS` = 10 分钟视为没有锁），`scopeLockSet`（谁先开始谁先锁：对方有锁就不能设）/ `scopeLockClear` / `scopeLockBy`。KR：按［编辑］/［补加］时 `krScLockStart`（IN 锁着就提示「A1 室长正在帮客人选项目，请稍后」），存好 / 取消 / 补加成功清锁，弹窗里点击 / 输入刷新 `at`（`krScLockTouch`），`krScopeLockTick`（data.js 末尾每 20 秒）发现过期就关掉弹窗并提示（没存的不保留）。IN：`toggleProject` / `toggleHeldSurg` / `settleProjects` 记 IN 锁（`scopeLockInStart`，只对有诊疗方案的案件），付款完成 / 关结算窗清锁，其余靠 10 分钟过期；KR 锁着时 IN 的 `toggleProject` / `toggleHeldSurg` / `confirmProjectSelection` / `settleProjects` / `confirmSettlementPayment` 在程序里直接拒绝（`scopeLockGuardIN`），案件页最上面加横幅「KM1 室长正在编辑推荐项目，编辑完成前不能选项目、付定金」并把选项目 / 结算 / 付款按钮灰掉（`scopeLockApply`，包在 `renderCaseBody` 外面）。
- **正式版后端建议**：锁做成一张表（案件 id、锁方 KR / IN、持有人、类型、`expires_at`），加锁 = 一个原子的「没有未过期的锁才插入」（数据库唯一约束或条件更新），另一方要加锁时返回「谁在用」；每次编辑动作续期（`expires_at = now + 10 分钟`），保存 / 取消 / 关画面主动释放，过期靠查询时判断（不用定时任务）；所有写推荐项目 / 选项目 / 付款的接口都要在服务端校验锁（不能只靠前端灰按钮），并带版本号避免覆盖。
- 测试：新增 R234a（KM1：编辑 / 价格不动 / 已购买灰掉 / 补加 / IN 锁灰掉 / 11 分钟解锁）、R234b（A1：横幅 + 程序拒绝 + 自动解锁 + IN 开始选项目记锁）、R234c（KM1：IN 锁 → KR 灰掉，跨分页同步）。

## CMD-1106-04 补充（2026-11-06，追加；取代 CMD-1106-03 里 IN 顶部黄色横幅、补加卡没有「术后管理（在印尼）」、编辑后 IN 的术后管理分配被重设的做法，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1106-04`），文档另一个提交；不推送不合并；数据版本不变（59）。CMD-1106-01 是「待代表决策」，没有碰。
- **一 遮罩**（data.js `scopeLockOverlayHtml`，`projectPickerHtml` 的赴韩方案卡 `position:relative` + 遮罩，取代 `scopeLockBannerHtml`）：KR 锁着时，IN「赴韩方案」整张卡（推荐项目整理 + 选项目区 + 右边已选）盖灰色半透明遮罩，正中「🔒 KM1 室长正在编辑推荐项目 / 编辑完成后会自动解开（已编辑 N 分钟）/ ［对话］」（`openCaseRoom`；不满足建房条件时按钮灰）；N 从 `scopeLock.start`（第一次加锁时间，续期不变）算，`data.js` 末尾每 20 秒更新。只盖这一张卡：其他 tab / 面诊诊疗报告 / 页头［对话］［+ 添加本地管理］照常。顶部黄色横幅拿掉。**遮罩覆盖的画面清单**：赴韩方案卡（`projectPickerHtml`，面诊 tab 的 Step 2 和升级后的赴韩 tab 都用这一个函数，所以两处都盖）。**没有遮罩、用灰掉 + 原因的画面**（`scopeLockApply`）：待付款结算单的［确认付款］（结算 / 赴韩 tab 里的批次，`rules.js`）、结算弹窗（`#settle-overlay`，确认付款灰 + 一行「KM1 室长正在编辑推荐项目，暂时不能付款」，`scopeLockSettleModal`）、重新选择项目按钮；程序里照旧由 `scopeLockGuardIN` 拒绝。KR 存好 / 取消 / 自动解锁后遮罩消失；有改到内容时 `coreScopeEdit` 写 `c.scopeEditNote`，IN 页面（`scopeEditToast`，每个案件每个分页只提示一次，刚打开页面时已有的旧提示不弹）右下角弹「推荐项目已更新：下颌角整形（术后管理）」，被改到的那一行（用勾选框 `toggleProject('项目id')` 找到）亮 3 秒（`app.css` `.scope-flash`）。KR 那边（IN 在选项目）仍是［编辑］［补加］灰 + 原因。
- **二 补加卡加回「术后管理（在印尼）」分页**（`krAddChooser(…,'sc')` 第三个分页 + `krScPostListHtml` / `krScPostPool`）：列表 = 来源诊所「术后管理」分类的本地项目（`cand.postCat`），**这个分类现在是空的（10/12 起本地项目库换成 12 类），所以没有时退回列来源诊所全部本地项目**（`cand.post`）；已在推荐里的灰掉标「已在推荐里」；勾选后右边选「对应施术」（推荐里已有的施术 + 这次一起补加的施术）和术后第几天（必填），补加成 `{name, price, post:true, forSurg, startDay}`（旧下拉没有对应施术 / 第几天，这是新加的字段），推荐列表里写「术后管理（印尼）：对应 X，术后第 N 天」。
- **三 KR 编辑后保留 IN 原本的分配**（`coreScopeEdit` 同步到 IN 购物车 / 未付款结算单时）：术后管理「同一行」= **类型（`mgmt`）+ 具体项目（`name`）+ 第几天起（`startDay`，旧数据从 `day` 里取数字）**（`pcRowKey`）。同一行且次数、地点都没变、地点是「韩国或印尼」→ 保留 IN 的 `inTimes` / `innName`；KR 新增或改掉的行（key 变了 / 次数变了 / 地点变了）用新设定（必须在韩国的强制在韩，`inTimes:0`）；原来分配给印尼的行因此被重设时：Timeline 追加「IN 原本分配给印尼的术后管理被重设：…（请重新确认分配）」，IN 通知升为需要处理级别并写「X 的术后管理已更新，请重新确认分配」。
- **四 补加时术后内容一起出来**：左边每个施术项目下面显示项目库默认设定（`krDefaultsMetaHtml`：麻醉含空腹小时 / 推荐在韩天数 / 所需术后管理 类型 · 项目 · 在哪做 · 次数 · 第几天）；管理项目行显示「术后第 N 天开始」（`krScMgBtn`）；勾选后右边「已选」直接展开和［编辑］同一套的设定（`krProjDetailHtml`，含「最少 N 天」自动计算），管理项目的份数 / 开始天可以改（`krScPaidRow` / `krScLocalSet`，价格 = 单价 × 份数）；按［补加］时一起存；底部说明改成「右边可以直接改术后管理等设定…」。
- 测试：新增 R235a（KM1：三个分页、左边默认设定、右边展开、管理项目份数 / 开始天、印尼术后管理必填、补加结果）、R235b（A1：遮罩 / 提示 / 保留分配）；R234b 的「顶部横幅」改成「没有横幅、赴韩方案卡有遮罩」。

## CMD-1106-05 补充（2026-11-06，追加；取代 CMD-1106-03 里「IN 选项目 / 每次勾选就记 IN 锁、IN 锁 10 分钟自动解开」，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1106-05`），文档另一个提交；不推送不合并；数据版本不变（59）。CMD-1106-01 没碰。
- **KR 的［补加］［编辑］跟着 IN 的进度**（不再存 IN 锁，按案件状态现算，data.js `scopeInLock` / `scopeFrozen`）：① IN 还在勾项目、没按结算 → KR 可以按（`scopeLockInStart` 变成空函数，`toggleProject` / `toggleHeldSurg` / `settleProjects` 不再记锁）② IN 按了［结算］（`confirmProjectSelectionGo` 生成结算单，状态 `unpaid`）→ 灰掉，滑过「A1 室长正在结算，请稍后」（`b.orderedBy`），`coreScopeEdit` / `coreAddScopeItem` / `krScLockStart` 程序里也拒绝；**没有 10 分钟自动解开**：结算单还在（未付款、没取消）就一直锁，关掉结算弹窗但结算单还在仍然锁 ③ **「重新选项目 / 取消结算单」就是 `reselectProjects()`**（待付款结算单上的［重新选择项目］：撤销这张未付款结算单、项目回到购物车）→ 结算单没了，KR 又可以按 ④ IN 确认付款完成（结算单状态不再是 `unpaid`）→ **冻结**：KR 的［编辑］列和［补加］按钮直接消失（没买的项目也没有），「只能新增…」说明换成「已付定金，推荐项目已冻结；要加项目请用项目卡［增加项目］」（付款后阶段已不是面诊，`krAfterBlock` 照样显示这行说明）；之后要加项目走项目卡［增加项目］。
- **付款后部分退款 / 重新结算**：先维持冻结——`scopeFrozen` 只看「有赴韩项目的结算单已经不是未付款」，之后退款（取消项目、部分退回）或另开新结算单都不会解冻。
- KR 编辑的锁不变（10 分钟没动作解开；`c.scopeLock` 只剩 KR 一种）；KR 编辑时 IN 赴韩方案卡有遮罩、按不了［结算］（1106-04）。
- 测试：R234a 改（IN 勾项目不锁 KR → IN 按结算灰掉 + 程序拒绝 + 过 10 分钟仍灰 → 撤销结算单恢复 → 付款后两个按钮消失 / 说明改冻结 / 程序拒绝；「已购买的［编辑］灰掉」改成「冻结后没有［编辑］列」）、R234b（IN 勾选不再记锁；模拟按结算留给 R234c）、R234c（IN 按了结算 → KR 灰掉，跨分页）。

## CMD-1106-06 补充（2026-11-06，追加；取代 CMD-1106-05 里「IN 只要有未付款结算单就灰掉 KR 的［编辑］［补加］」和库里「管理项目 / 术后管理是两套互不相干的项目」的做法，旧文字保留作历史）
- 分支 **V4**，代码提交 5410e91（文档另一个提交）；不推送不合并；**数据版本 59 → 60**（`MIGRATIONS` to:60 对案件是空迁移；库的旧项目靠 `usesNormalize()` 补用途，种子和每次读档都跑、幂等；转换数量在 `window.GMC_USES_CONV`）。CMD-1106-01 仍「待代表决策」，没碰。
- **用途 `p.uses = ['mgmt'|'post']`**（至少一个，可都选）：旧资料默认——KR「韩国术后管理」分类的项目 = 术后管理；KR 管理项目库、IN 本地项目 = 管理项目（`projUses/hasUse/usesText`）。KR 的两个库仍是两份存放（`HOSPITAL_DATA[h].projects` 里的术后管理分类 + `localLib`），用途决定出现在哪些入口：术后管理库的项目勾了「管理项目」→ 多填类别 + 规格（`p.mg={cat,specs,durMin}`），以管理项目视图出现在 `krLocalLib`（同一个 id，`fromPost:true`，可单独卖，编辑 / 非活性化转到术后管理库那条）；管理项目库 / IN 本地项目勾了「术后管理」→ 出现在「所需术后管理」的具体项目下拉（`krScopeCandidates`：`krPost/krLocal/post` 是按用途筛过的，`*All` 是全部——校验已存设定时用，旧设定里的名字不会因为改了用途就报错；下拉里已选的名字仍保留）。当术后管理用时照施术里设定的地点 / 次数 / 第几天，通常免费。
- **KR 项目库页**：新增「术后管理」tab（术后管理库项目 + 管理项目库里勾了术后管理的；［+ 新增术后管理项目］= `krpOpen('newpost')`）；「管理项目」tab 只列用途含管理项目的（`krLocalLibOn` 同）；施术项目 tab 不再带「韩国术后管理」那张卡；编辑器里「用途」两个勾选，一个都没选保存被拦并红字「用途至少选一个」，勾了「管理项目」要填类别 + 至少一个规格（名称 / 价格 > 0 / 次数）。**IN 本地项目库**：编辑器加「用途」（必选，保存时缺则列入「还差…」）；列表上方「用途 全部 / 管理项目 / 术后管理」筛选；本地选购、活动价 / 套餐下拉、`localCatalogHtml` 只列用途含管理项目的（`hasUse(p,'mgmt')`）；KR 补加卡「术后管理（在印尼）」分页只列用途含术后管理的 IN 项目（`krScPostPool`）。
- **只有含赴韩项目的结算单才锁 KR**（`scopeInLock`）：未付款结算单里没有 `origin==='KR'` 的项目（只买本地项目）不再锁 KR 的［编辑］［补加］；含赴韩项目照 1106-05（锁到付款或重新选项目，付款后冻结）。
- 用 11/02 07:58 备份（隔离端口）验证：56 → 60，用户案件 25 → 25，迁移 25、失败 0；用途转换：术后管理库 8 项（H1 + H2 各 4）→ 术后管理，管理项目库 122 项（61 × 2）→ 管理项目，IN 本地项目 61 → 管理项目。
- 测试：selftest 新增 R236a（任意 IN 分页）、R236b（KM1），R235a 先给来源诊所一个 IN 项目勾「术后管理」再看下拉（没勾时下拉是空的）；回归对照 CMD-1106-05：A1 全套新增失败只有 R236b（要在 KM1 分页跑）、KM1 / KD1 批次与基线一致、roletest 8 个账号 0 不符。
- 我的判断（未经确认）：① 两库不合并存放，用途只决定入口（避免迁移 / 复制记录）；② 术后管理库项目勾了管理项目后，规格里的次数 / 价格是单独卖时用的，当术后管理用仍免费；③ 旧资料一律按所在库的类别给默认用途，没有办法分辨用户当时「想让它是哪种」。

## CMD-1106-07 补充（2026-11-06，追加；旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1106-07`，在 1106-06 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，没有新字段（检查都是现算）。
- **1 冻结后未购买折叠**：`recProjectsRowsHtml`——`scopeFrozen(c)`（付完定金）后先列已购买 / 已取消的，未购买的收进 `<details class="rec-unbought">`「未购买 N 项（点开查看）」；冻结前全部显示。KR 的「推荐项目」卡和 IN 的诊疗方案推荐项目共用这个函数。
- **2 施术日期 × 客人行程**（data.js `tripStayDays / tripWin / tripDateIssue / tripDateIssueText / tripMismatchList / tripMismatchHtml`）：合法 = 施术日 ≥ 到达日；到达当天到院时间要晚于到达时间；施术日 + 推荐在韩天数 ≤ 离开日。**推荐在韩天数 = 这个案件各施术项目建议天数的最大值（`recStayDays`，即画面「建议在韩停留 N 天」，含「第 N 天需在韩国拆线」的最少天数）**，最早可回国日 = 施术日 + 天数（和 `stayPlanOf` 一致）。行程「暂定」（`tripState==='tentative'` 且没有确认行程）只是预估：不挡，灰字提醒；行程没填：不挡。
- 入口：① IN 递交首选 / 备选（`krDateCalendarGridHtml` 范围外灰掉并在格子里写原因，`pickKrDate` 拒绝；改期的 pf/bf 同一个函数）；② 存行程（`staySave`）：已递交 / KR 已确认的日期跑到范围外 → 弹窗红字 + ［去修改施术日期］（`stayGoEditDate`），存不了；③ KR 确认 / 改期确认（`krSchForm` 红字 + 范围外时间选项灰掉，`krDoSchConfirm` 走核心 `coreScheduleConfirm / coreChangeConfirm` 拒绝，原因经 `KR_DENY_MSG` 弹出）。旧数据：不自动改，IN 赴韩日程卡和 KR 页头红字「施术日期和行程不合，请修改」（暂定的灰字）；用 11/02 备份检查 0 个案件不合（Halin H 不在备份里）。
- **与任务页例子不一致（待确认）**：例子「03/22 离开、建议 8 天 → 03/12～03/15 可选、03/16 之后灰掉」按公式「施术日 + 8 天 ≤ 离开日」应是 03/14 为最后一个可选日（03/15 + 8 = 03/23 > 03/22）；我按公式（和画面上「最早 N 日可回国」一致）做，例子差一天，如果要「施术日算第 1 天」（offset = 天数 − 1），改 `tripDateIssue` 一行即可。
- 测试：selftest R237a（A1 分页，stageC 夹具）；回归对照 1106-06（61a97a2）：A1 全套新增失败只有 R237a（要带夹具，A1 全套里失败属预期），KM1 / KD1 批次与基线一致，roletest 8 个账号 0 不符。

## CMD-1106-08 补充（2026-11-06，追加；取代 CMD-1021-16 二 / 1020-10 里 KR 持有「施术 / 术后管理 / 管理项目」三组平铺，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1106-08`），文档另一个提交；不推送不合并；**数据版本不变（60）**，只改读取和画面，没动资料层。
- **持有 = 已买（付了定金）、还没做完**：印尼本地还没用完的管理项目 +（韩国还没做的施术 + 施术底下没做完的术后管理 + 韩国还没用完的管理项目）；行程没结束、施术时间还在等 KR 确认的也算；已取消 / 已更换 / 已做完的不列。IN 客户详情和 KR 客人管理共用 `cliHoldKrHtml`（`cliHoldKrBlocks` 取数：`cliSurgBought / cliSurgState / cliCareEntries`；旧的 `cliHoldKrRows` 留着给旧测试和统计）。
- **韩国持有分两组**：「赴韩项目」每个施术一格（`来自 A00xxxx`，点了进案件 + 状态），术后管理收在它底下、只列没做完的（同名同天数合并 `× N`，已预约写 MM/DD HH:mm，没约写「未预约」）；施术做完后这一格只剩没做完的术后管理，全部做完这一格消失。「赴韩管理」一项一格，写「剩 N / 共 M 次」+ 状态 + 已预约时间。取消 / 退款［取消 / 退款］（行程结束转持有的施术，被别的案件选用时灰）和［处理］（只付了定金等 IN 决定）按钮照 1105-12，放在施术名字旁。
- **状态对照**：施术——`heldSurg`「韩国持有（行程已结束）」/ `tripWait`「行程已结束 · 等 IN 决定」/ `rebookWait`「待重新预约」/ 已做完「施术已完成」/ 已到院「已到院」/ 施术日期状态 Confirmed「已预约 MM/DD HH:mm」· Pending「待确认施术时间」· Changing「改期待确认」/ `deferUse`「已购买 · 还没安排」/ 其余「待递交施术日期」；管理项目——`pendingPay`「待付款」/ 没付尾款「待付尾款」/ 有预约「已预约 MM/DD」/ 行程已结束「韩国持有（行程已结束）」/ 其余「持有中」。
- **在印尼做的术后管理**：跟着施术放在这里（标「· 在印尼」；「韩国或印尼」的标「· 韩国或印尼」），不再单独列在印尼持有（`renderClientHoldings` 用 `inIds` 过滤）；没有对应施术格的（例如施术项目已取消）仍留在印尼持有。
- **tab 数字**（「持有项目 N」）= 印尼持有 + 赴韩项目格数 + 赴韩管理条数 +（IN）置换额度 + 没挂在施术底下的印尼术后管理；术后管理不单独算（施术做完后只剩术后管理的那一格算 1）。
- 测试：selftest R238a（A1，stageC 夹具）；回归对照 CMD-1106-07 文档提交：A1 全套新增失败只有 R238a（需带夹具，全套里失败属预期），KM1 / KD1 批次与基线一致，roletest 8 个账号 0 不符，没有旧断言需要改。
- 我的判断（未经确认）：① 施术做完后术后管理还有没做完的，这一格状态写「施术已完成」；② 已买的施术包括在韩加购已付款的；③ KR 页面的「来自」链接走 `krShowCase(clinicId, id)`。

## CMD-1106-09 补充（2026-11-06，追加；取代 CMD-1106-07 里 KR 确认 / 改期确认「天数不够也拒绝」、CMD-1013-11 里 KR 施术日期卡的版面，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-09`），文档另一个提交；不推送不合并；**数据版本不变（60）**（新增可空字段 `krSchedule.durMin`）。CMD-1106-10（IN 端天数不够也不灰掉、旧数据红字改黄字、术后管理预约时的冲突处理）**没做**，只在这里先做了任务页说的「KR 确认时天数不够不挡」那一点。
- **卡片**（kr.js `krSchForm`，Pending / Changing 共用）：行程状态（`krTripLine`：已定 / 预估（MM-DD HH:mm ～ MM-DD HH:mm），没填「未定」）→ 施术时间预计约 [小时 0～12] 小时 [分钟 0/10/…/50] 分钟 +（估算时间 …，改过显示「已改为 …」）→ 首选 / 备选单选 + 院长当天不可预约 → 「施术日期 MM/DD」+ 时间选择 → 红字（早于到达 / 到达当天到院时间早于到达时间 / 撞到院长不可预约或其他安排，写在时间这一行下面，［确认］灰掉并写原因）或黄字（`tripShortText`：做完需要在韩 N 天，客人 MM/DD 离开，第 N 天的 xx 不在行程内（必须在韩国的写「只能提前做」）；之后预约术后管理时，再决定提前做或回印尼做；暂定行程的提醒也是黄字）→ 到院地址一行 +［修改］（点了变输入框，医院设定自动带入）→ ［确认］［无法安排］放最右。［无法安排］→ 弹窗（`krSchRejectOpen`）「无法安排的原因」必填（红字在弹窗里）+［送出］［取消］，页面上原本的原因输入框拿掉；送出后照原 `coreScheduleReject` / `coreChangeReject`。
- **施术预计时长**：估算 `krEstDur(c)` = 这次赴韩项目所需分钟合计（`surgeryMinutes`，没资料按 60 分钟）以 10 分钟往上取整；KR 改的值随［确认］存进 `ks.durMin`（和估算一样就不存，`coreSetSurgDur`）；`surgeryMinutes(c)` 优先用它（在韩加项的延长另加），所以院长时间占用 / 冲突检查（`krTimeOptionsFor`、`krDayFullNote`、`krSurgerySlotError`）/ 院长日程施术块长度都用改过的值；改过的写 Timeline「施术时间预计从 X 改成 Y（估算 Z）」。
- **核心函数**：`coreScheduleConfirm / coreChangeConfirm` 加第 6 个参数 `durMin`，只拒绝「早于到达 / 到达当天时间早于到达时间」（`tripDateIssue().kind` = early / time / short）；天数不够（short）不拒绝。IN 端日历 / 存行程对天数不够的处理仍是 1106-07（灰掉 / 拦住），留给 CMD-1106-10。
- 测试：selftest R239a（KM1 分页，stageC 夹具）；回归对照 CMD-1106-08 文档提交：A1 全套新增失败只有 R239a（要带夹具，全套里失败属预期），KM1 / KD1 批次与基线一致，roletest 8 个账号 0 不符，没有旧断言需要改。
- 我的判断（未经确认）：① 估算 5.3 小时（318 分钟）取整到 320 分钟 = 5 小时 20 分钟；② 小时下拉 0～12 时，估算超过 12 小时只能显示 12 小时（输入框装不下）；③ 时长最少 10 分钟；④ 改期确认（Changing）也用同一张卡 / 同一个时长。

## CMD-1106-10 补充（2026-11-06，追加；取代 CMD-1106-07 里 IN 日历 / 存行程 / 旧数据对「做完在韩天数不够」也挡住 / 红字的部分，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-10`，在 1106-09 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，没有新字段。KR 确认 / 改期确认的「天数不够不挡」已在 1106-09 做了。
- **规则**：只有「施术日早于到达日」和「到达当天到院时间早于到达时间」挡住（`tripDateIssue().kind` = early / time）；「施术日 + 推荐在韩天数 > 离开日」（kind = short）不挡，只显示黄字（`tripShortText`：列出排不进行程的术后管理，「必须在韩国」的写「只能提前做」；之后预约术后管理时再决定提前做或回印尼做）。行程「暂定」仍然什么都不挡，灰字。
- ① IN 递交首选 / 备选（`krDateCalendarGridHtml` / `pickKrDate`）：只有早于到达的日子灰掉并写原因；天数不够的日子可以选，格子里小字黄色「在韩天数不够」（悬停全文），选了之后日历下面显示黄字；② 存行程（`staySave`）：只有已递交 / KR 已确认的日期早于到达才存不了（红字 + ［去修改施术日期］）；天数不够可以存，保存后赴韩日程卡显示黄字；④ 旧数据 `tripMismatchHtml`：早于到达仍红字「施术日期和行程不合，请修改」，天数不够改成黄字「拆线等术后管理排不进行程，预约时请决定提前或回印尼」（暂定的灰字不变）；`tripMismatchList` 的项多了 `kind`，天数不够的 `msg` 是 `tripShortText`。
- ⑤ **术后管理预约时的冲突处理**：不需要新做——KR 预约弹窗（`krCbOpen`）本来就按离开日期判断每个项目（`krCbGone` 离境时间之后不能约：「韩国或印尼」的自动转回印尼，必须在韩国的红字「请改到离境前」，另有［保留］（1028-12）），和「离开日往前改」用的是同一个判断，所以「一开始就排不进」（建议日期已经在离开之后）也会出现；改离开日期时的冲突处理窗（`krStayResolveGate`）则只在离开日往前改时出现。R240b 验证了前者。
- 测试：selftest R240a（A1，stageC 夹具）、R240b（KM1，stageC 夹具）；R237a 原有断言（天数不够返回 issue、早于到达挡住）仍成立，无需改；回归对照 CMD-1106-09 文档提交：A1 全套新增失败只有 R240a/R240b（要带夹具，全套里失败属预期），KM1 / KD1 批次与基线一致，roletest 8 个账号 0 不符。
- 我的判断（未经确认）：① 「必须在韩国」的术后管理排不进行程时，现有弹窗是红字「请改到离境前」+［保留］，没有单独写「只能提前做」这几个字（黄字里有）；② 保存行程时对「天数不够」不弹任何窗，只在日程卡上显示黄字。

## CMD-1106-11 补充（2026-11-06，追加；取代 CMD-1106-10 的黄字长写法和 CMD-1106-09 时间下拉里「✕ 需约 X 小时，会撞到…」的写法，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-11`，在 1106-10 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，只改画面和文字。
- **短版提醒一行**（data.js `tripShortLine(c, items)` / `tripCurItems`）：「⚠️ 拆线安排在第 7 天，建议预留 8 天行程（首选 03/16～03/22，共 6 天；备选 03/17～03/22，共 5 天）」。「拆线」= 最晚一项「必须在韩国」的术后管理（没有就取最晚的术后管理），「第 N 天」「建议预留 M 天」= 现有算法（`pcDays` 最后一天 / `tripStayDays`）；括号 = 施术日 ～ 客人离开日、共 X 天（离开日 − 施术日）；首选备选都不够 → 分号隔开，只有一个不够只写那个，KR 已确认只写确认的那天；「之后预约术后管理时再决定…」不再写进提醒。出现的地方：IN 递交日历下面（首选 / 备选）、IN 赴韩日程卡 / KR 页头的旧数据提醒（`tripMismatchHtml`）、KR 施术日期卡、存行程弹窗（`stayWarnRefresh`，随入境 / 离境输入实时更新）。**日历格子**只写「⚠️ 共 X 天，建议 M 天」（悬停是整行）。IN 赴韩日程卡下面灰字「建议在韩停留 …」：有黄字提醒时拿掉，没有时照旧。
- **KR 时间下拉**（kr.js `krTimeOptionsFor` / `krTimeShortWhy` / app.css `.kr-time-sel`）：明显的框 + ▾（CSS 类）；框里只显示时间；点开每个时间一行，不能用的灰掉、后面小字短原因（撞到不可预约 / 撞到 OFF / 撞到面诊 / 撞到施术 / 休诊 / 早于到达 / 早于到达时间）；选中的时间即使不能用，框里也只显示时间；红字一行写在下拉框下面（「会撞到 KO1 代表院长 11:00～13:00（不可预约），不能确认」），［确认］灰；撞不撞按改过的预计时长算；到院地址挪到下拉框右边小字（`krSchForm`）。
- **小数小时清单**：`krHoursText` 现在直接转调 `krHM`（「H 小时 M 分钟」，例 318 分钟 → 5 小时 18 分钟），所以以下地方都不再有小数：`krSurgeryHoursNote`（没有入口）、`krSurgerySlotError` 的冲突文字（「施术约 X 到 …」）、`krDayFullNote`、`krTimeOptionsFor`（已不再写时长）、`coreSetSurgDur` 的 Timeline；其他 `krHM` 的地方本来就是 H 小时 M 分钟。没有找到别的小数写法。
- 测试：selftest R241a（KM1 分页，stageC 夹具）；R239a / R240a 的旧断言改前 → 改后：「黄字含『做完需要在韩…之后预约术后管理时』」→「一行短版『建议预留 N 天行程（…）』且不含『之后预约术后管理时』」，日历格子「在韩天数不够」→「共 X 天，建议 M 天」。回归对照 1106-10 文档提交：A1 全套新增失败只有 R241a（要带夹具，全套里失败属预期），KM1 / KD1 批次与基线一致，roletest 8 个账号 0 不符。
- 我的判断（未经确认）：① 没有「必须在韩国」的术后管理时，「拆线」取最晚的术后管理；② 括号里的「共 X 天」按「离开日 − 施术日」算（03/16～03/22 = 6 天），和建议天数（施术日 + 8 天才可回国）不是同一种算法，照任务页例子；③ 灰掉的时间后面的短原因只分 6 类，更细的写在选中后的红字里。
- **CMD-1106-11 补（2026-11-06，用户加在任务页）**：KR 施术日期卡（`krSchForm`）不再显示「到院地址 … 修改」那一行（拿掉 1106-09 加的）；KR 确认时自动用医院设定里的地址（`krDefaultAddress()` → `KR_SCH.address`）存进 `ks.address`，已确认的日期改时间 / 改期沿用原地址。IN 赴韩日程、打印的行程单、给客人的通知照旧读 `ks.address` 显示。selftest R241a 同步（改前「到院地址一行 + ［修改］」→ 改后「卡上没有到院地址，确认后 `ks.address` = 医院设定地址」）；回归对照 de3f3d5：A1 / KM1 / KD1 失败集合一致，roletest 0 不符；数据版本不变（60）。

## CMD-1106-12 补充（2026-11-06，追加；取代 CMD-1106-11 里 KR 施术日期卡「默认带入 10:00」「下拉框下面一排黄字」，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-12`，在 1106-11 补充之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，只改画面（`krSchForm` / `krSchReset` / `krSchSet` / `krTimeOptionsFor`，app.css `.kr-time-sel.is-empty`）。
- **时间不预选**：待确认的 KR 时间下拉默认灰字「选择时间」（`krSchReset` 的 `time` 传 `''`）；没选时间前［确认］灰（title「请先选择时间」）、不显示红字（红字依赖时间）；切换首选 / 备选（`krSchSet('pick')` 且日期变了）时间清空回「选择时间」；改期待确认 / 已确认改时间仍带入原来的时间（`ks.confirmedTime`）。
- **黄字**：只写单选选中的那一天，放在那一天的院长行下面（`krSchedDayHtml` 后面），格式「⚠️ 拆线安排在第 N 天，建议预留 M 天行程（MM/DD～MM/DD，共 X 天）」（没有「首选 / 备选」字样）；选的那天天数够就不显示；下拉框下面那排黄字拿掉，下拉框下面只留红字（会撞到… / 早于到达…，不能确认）；暂定行程的灰色提醒仍在下拉框下面。IN 赴韩日程的一行提醒（首选 / 备选都写）不变。
- 测试：selftest R242a（KM1，stageC 夹具）；R239a 旧断言改前 → 改后：「早于到达：红字在日期选中后就出现」→「先选一个时间才出现红字」。回归对照 1106-11 补充文档提交：A1 全套新增失败只有 R242a（要带夹具，全套里失败属预期），KM1 / KD1 批次一致，roletest 8 个账号 0 不符。
- 我的判断（未经确认）：① 改期待确认（Changing）切换新首选 / 新备选时间也清空（任务只写了首选 / 备选）；② 只有日期本身早于到达、还没选时间时不显示红字（按「没选时间前不显示红字」）。

## CMD-1106-13 补充（2026-11-06，追加；取代 CMD-1029-09 二 / CMD-1027-08 五 / CMD-1106-07 里 KR 案件页头「在韩 … 挂在第一行 + 整句提醒」，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-13`，在 1106-12 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，只改画面（kr.js `krTripRowHtml` 新增，`krMainHeader` / `krSurgDayHeader` 改三行；旧 `krStayHeadHtml` 留着没有入口）。
- **KR 案件页头三行**：① 客人名 · 案件号 + 面诊 / 施术次数，［对话］放最右；② 「在韩行程：MM/DD HH:mm ～ MM/DD HH:mm」+［行程修正］（行程暂定写「在韩行程（预估）：…」，没填写「在韩行程：未定」；行程已结束标签也在这一行；机场悬停；年份可能存错的红字保留）；③ 来源诊所 · 院长 · KR 室长（照旧；施术当天页另有「主案件 …」链接）。主案件页和施术当天页共用。
- **页头拿掉的提醒**：KR 页头里「⚠️ 拆线安排在第 N 天…」（天数不够，CMD-1106-11 的旧数据提醒 `tripMismatchHtml(c, true)`）和 CMD-1106-07 的「施术日期和行程不合，请修改」长句；改成：真的错（施术日期早于到达 / 到院时间早于到达时间）只在［行程修正］后面放小红字「⚠️ 施术日期早于到达」/「⚠️ 到院时间早于到达时间」。会出现这个小红字的地方：KR 主案件页头、KR 施术当天页头（共用 `krTripRowHtml`）。天数不够的提醒仍在 KR 施术日期卡（选中那天下面）和 IN 赴韩日程卡（`inStayInnerHtml`）。**IN 案件页头本来就没有挂这些长句**（它们只在 IN 赴韩日程卡里），所以 IN 没改。
- 测试：selftest R243a（KM1，stageC 夹具）；旧断言改前 → 改后：R66b「在韩 … 在第一行、第二行不再重复」→「在韩行程在第二行」，R62b / R147b / R153b 里页头「在韩 MM/DD」→「在韩行程：MM/DD」。回归对照 1106-12 文档提交：A1 全套新增失败只有 R243a（要带夹具，全套里失败属预期），KM1 / KD1 批次一致（R147b「子案件 tab 按段显示」在基线上本来就失败），roletest 8 个账号 0 不符。
- 我的判断（未经确认）：① 行程已结束的标签放在第二行（任务没写它放哪）；② 暂定行程以前页头有「暂定」标签，现在改成「（预估）」写法，不再有单独标签。

## CMD-1106-14 补充（2026-11-06，追加；取代 CMD-1106-09 / 12 里 KR 施术日期卡的排版，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-14`，在 1106-13 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，只改画面（kr.js `krSchForm`）。
- **排版**（待确认 / 改期待确认共用）：标题 + 行程状态 → 分隔线 → 首选 / 备选单选（院长行 + 选中那天的黄字，照 1106-12）→ 分隔线 →「施术时间：预计约 [小时] 小时 [分钟] 分钟（估算时间 …）」→「施术日期 MM/DD [选择时间 ▾] ～ 结束时间」→ 红字（照旧在时间行下面）→ 右下［确认］［无法安排］。小时 / 分钟下拉改用 `.kr-time-sel`（和时间下拉同一个有框有 ▾ 的样式，`min-width:72px`）。
- **结束时间** = 选的开始时间 + 预计时长（`KR_SCH.dur`，没改过就是估算），写在时间下拉右边 `～ HH:mm`；没选时间「～ --:--」；跨过午夜写「～ 隔天 HH:mm」；改开始时间 / 预计时长整张卡重画，结束时间马上跟着变。
- 测试：selftest R244a（KM1，stageC 夹具）；旧测试选择器改前 → 改后：「卡里第一个 `select.kr-time-sel`」→「最后一个（时间下拉；现在前面还有小时 / 分钟）」，R239a「施术时间预计约」→「施术时间：预计约」，R241a 黄字期望值改成不带「首选」字样的单日版本（1106-12 起如此）。回归对照 1106-13 文档提交：A1 全套新增失败只有 R244a（要带夹具，全套里失败属预期），KM1 / KD1 批次一致，roletest 8 个账号 0 不符。
- 我的判断（未经确认）：① 结束时间用 `预计时长` 但不含在韩加项的延长（确认时只用预计时长）；② 跨午夜时写「隔天」而不是日期。

## CMD-1106-15 补充（2026-11-06，追加；取代 CMD-1105-11 / 1105-13 里院长 ② 的「推荐项目（从项目库选，可选可不选）」展开细节的做法，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-15`，在 1106-14 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，只改画面（kr.js `krGcPickColumn` 包一层 `window.KR_PICK_SIMPLE`，`krGcPickColumn0` 是原函数；`krMgListHtml`、`krScopeTabsHtml`、`krGcPickNames`、`krGcEvalBlock`）。
- **只勾 + 备注**：面诊评估卡 ② 的推荐项目（院长录入，和室长勾授意代录同一张卡）每行 = 勾选框 + 项目名 + 价格 + 备注；勾了施术项目不展开建议在韩天数 / 麻醉 / 麻醉备注 / 所需术后管理（`krProjDetailHtml`），勾了管理项目不展开规格 / 份数 / 第一次使用（`krMgFormHtml`，管理项目这一行新增备注框，备注存在 `KR_SUB.notes['mg:'+项目id]`，发送时 `krMgScopeItem` 带进条目 `note`）；「推荐项目整理」（`#kr-rec-sum`）也不显示。整体备注保留。
- **细节默认怎么存**：勾选时 `krPickToggle` 照旧把项目库默认设定（`krDefaultsDetail`）存进 `KR_SUB.detail[项目名]`，上传时随 `consultEval.sub` 一起存（管理项目是 `sub.mg[id]` 的默认规格 / 份数 1）；室长 ③ 发送诊疗方案的画面（`krSubmitBlock`，完整展开细节）**没改**，可以像以前一样调整，发出后用 1106-03～05 的［编辑］（未购买才能改）。院长写的备注带到室长发送画面和诊疗方案（`KR_SUB.notes` → 条目 `note`）。
- **标题 / 小标题**：「推荐项目（从项目库选，可选可不选）*」→「推荐项目（选择勾选）」，红色 * 拿掉；「赴韩项目可选范围」小标题只在院长这张卡里拿掉（分页［施术项目（已选 N）］［管理项目（已选 N）］照旧）；室长 ③ 发送画面里的「赴韩项目可选范围」小标题没动（任务只写了院长选择画面）。③ 院长上传后只读：项目 + 备注（`krGcPickNames` 带「— 备注：…」）。
- 测试：selftest R245a（KD1，stagePay 夹具）；回归对照 1106-14 文档提交：A1 全套新增失败只有 R245a（要带夹具，全套里失败属预期），KM1 / KD1 批次一致，KM1 的 R230b / R228b / R232a / R162b 与基线一致，roletest 8 个账号 0 不符。
- 我的判断（未经确认）：① 「赴韩项目可选范围」小标题只在院长选择画面拿掉，室长 ③ 画面保留；② 管理项目的备注框是新增的（原来管理项目这一行没有备注）。
- **CMD-1106-15 补（2026-11-06，用户加在任务页）**：院长选推荐项目的「管理项目」分页（`krMgListHtml` 简化模式）和施术项目一样排：一行 = 勾选框 + 项目名 + 价格（左）+ 备注框（右，同一行，宽 42%），备注不再另起一行；价格 = 规格里最低价（多个规格价格不同写「… 起」，面议写「面议」）；分类小标题和搜索框照旧。数据版本不变（60）；selftest R245a 同步；回归对照 5b60bef：A1 / KM1 / KD1 失败集合一致，roletest 0 不符。

## CMD-1106-16 补充（2026-11-06，追加；取代 CMD-1019-17「建议在韩天数可手填、比最少多要写停留原因」，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-16`，在 1106-15 补充之后），文档另一个提交；不推送不合并；**数据版本不变（60）**（没有迁移：旧资料照旧显示，下次编辑才换成自动算）。
- **建议在韩天数自动算**（rules.js `stayMinOf`，新增 `stayAutoLine`）：= 最晚一项「必须在韩国」（`place` 不是 `either` / `IN`）的术后管理是第几天 + 1（施术日 = 第 0 天；拆线第 7 天 → 8 天）；没有「必须在韩国」的 = 1 天；「韩国或印尼」和「在印尼」的不算。画面只有一行、不能填：「建议在韩：8 天（第 7 天在韩国拆线）」（`autoWhy` 带最晚那项的名字）。**设定施术细节的地方（都改了）**：KR 施术项目库编辑（`krpEditor` 默认资料，保存时 `sd.stay` 按所需术后管理算、删掉 `stayReason`）、补加（`krProjDetailHtml`）、［编辑］（`KR_SCE` → `krDetailFromItem`）、室长发送诊疗方案前的调整（同 `krProjDetailHtml`）、到院添加 / 更换（`krDetailOf('__add'/'__swap')`）。共用 `krStayState`（一律自动）/ `krStayCommit`（不再报错、不带停留原因）/ `krStayBlockHtml`（一行）；「建议在韩天数」输入框、停留原因勾选和补充说明、「施术日 = 第 0 天；最少 N 天…」那行都拿掉。改了所需术后管理（新增 / 移除 / 改第几天 / 改在哪做）整张表单重画，天数马上跟着变。后面用到天数的地方照旧读已存的 `it.stay`（`recStayDays`：案件「建议在韩停留 N 天」取各施术最大值、施术日期和行程提醒「建议预留 N 天」）。
- **旧资料**：已手填的天数 / 停留原因照旧显示（`itemStayInfo` / `stayReasonText` 没动，不自动改）；下次有人编辑那一项时换成自动算（`krDetailFromItem` 不再带旧天数 / 原因）。用 11/02 备份检查：17 个赴韩项目条目里手填过天数 / 带停留原因的 = 0 个。
- **推荐项目列表标「在哪做」**（data.js `recProjectsRowsHtml` + 新增 `recPcPlace`，KR 和 IN 是同一个函数）：「拆线 × 1（第 7 天 · 必须在韩国）」「术后消肿管理 × 1（第 7 天 · 韩国或印尼）」；「韩国或印尼」的如果 IN 已经分配好（同一项目同一行在购物车 / 结算单 / 已买里），改写分配结果：全部分给印尼「在印尼做」、部分「印尼 N 次 · 韩国 M 次」、已买且没分给印尼「在韩国做」（只在购物车里没分配的仍写「韩国或印尼」）。其他列术后管理的地方：`pcLineText`（推荐项目整理 / 打印）和 `itemMetaText`（项目资料行）本来就带「必须在韩国 / 韩国或印尼」，KR 项目卡术后管理页有地点栏，没有再改。
- 测试：selftest R246a（任意分页）；旧断言改前 → 改后：R46a「填 5 被挡 / 第 3 天拆线填 8 要写停留原因 / 表单出现停留原因 / 默认资料天数少于最少红字」→「手填被忽略，一律自动算；表单一行；默认资料一行」，R150a「拆线 × 1（第7天）」→「拆线 × 1（第 7 天 · 必须在韩国）」，R234a 编辑保存的「9天」→ 按所需术后管理自动算。回归对照 1106-15 补充文档提交：A1 / KM1 / KD1 失败集合一致，roletest 8 个账号 0 不符。
- 我的判断（未经确认）：① 「必须在韩国」= `place` 不是 `either` / `IN`（旧资料没有 `place` 的算必须在韩国）；② IN 分配只在已买或在购物车里能看到时才改写，KR 刚写完诊疗方案还没被 IN 选的仍写「韩国或印尼」；③ 已发出的推荐项目里手填的天数不会自动改，除非有人编辑。

## CMD-1106-17 补充（2026-11-06，追加；取代 CMD-1015-05 / 1106-07 里日历 ‹ › 翻月和 IN 赴韩日程卡的排法，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-17`，在 1106-16 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，只改画面（data.js `krSchedYM` / `krScheduleSetYM` / `krSchedMonthNavHtml` 新增，`krProcedureTabMain`、`tripStateBlockHtml` 改）。
- **日历年 / 月下拉**：拿掉 ‹ ›，改成 `[年 ▾]年[月 ▾]月`（样式 `.kr-time-sel`，和 KR 时间下拉一样）；年 = 今年（演示时间）～明年；月：选今年从这个月起、选明年 1～12 月；从明年切回今年、月比这个月早 → 自动变成这个月；一打开停在这个月，已经选了首选日的停在首选日那个月（用户自己改过下拉之后不再自动跳，`KR_SCHED_NAV_CASE`）；改年 / 月后日历马上换，日期能不能选、颜色、黄字规则不变。**用这个日历函数（`krProcedureTabMain` 的 `monthNav`）的地方**：IN 递交施术日期（待递交）、IN 改期（修改施术日期，Changing 未提交）。KR 的日历（`krcMonth…`，工作台 / 日程月视图）、IN 工作台日历的月份选择（`openMonthPicker`）、客人预约页的日期选择是各自独立的另一套，没改。`krScheduleMonthShift` 留着没入口。
- **IN 赴韩日程卡重排（待递交）**：标题 +［打印］［修改］→ 分隔线 → 行程状态 *（已定 / 暂定单选）+ 到达 / 离开 + 建议在韩停留 → 分隔线 → 施术日期 + 年 / 月下拉 + 图例 + 日历（含黄字）→ 分隔线 →［递交施术日期］［取消赴韩］。拿掉：「待递交施术日期」状态行、「只能选择KR室长可接待的日期（浅色 = …）」、「给 KR 看的标记，不影响流程」、「入境 / 离境…在「确认行程」窗口里填…」。保留：图例、行程状态必填 *、日历里的黄字提醒。
- **各状态排法**：待递交 = 上面；已递交（Pending）= 标题 → 分隔线 → 行程块（到达 / 离开 / 建议停留）→ 分隔线 → 状态行 + 已提交首选 / 备选 + 按钮；KR 已确认（Confirmed）、改期（Changing）、已到院（Arrived）= 同样行程块在施术日期上面、有分隔线，其余内容照旧。
- 测试：selftest R247a（A1，stageC 夹具）；R41a 旧断言改前 → 改后：待递交日期卡「提示含『浅色 = 休诊 / 约满 / 已过』」→「不含」。回归对照 1106-16 文档提交：A1 全套 / KM1 / KD1 失败集合一致，roletest 8 个账号 0 不符（KC1 一次超时是两套测试同时跑造成，单跑通过）。
- 我的判断（未经确认）：① 行程状态单选只在待递交（还没递交过）时出现，递交后的状态里不再放单选（原来也是这样）；② 年下拉只有今年和明年，已经选了更晚日期的旧数据会被钳在明年 12 月。

## CMD-1106-18 补充（2026-11-06，追加；取代 CMD-1102-07 一 / CMD-1029-09 四 里「递交时（施术日不到 7 天）弹『确认行程』窗口填入境 / 离境」和 CMD-1106-07「暂定 = 行程只是预估、仍有日期」，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-18`，在 1106-17 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**（新增可空字段 `krSchedule.tripDraft` / `tripErr`，旧资料不用迁移）。
- **行程直接在卡片上填**（data.js `tripStateBlockHtml` / `tripDraftFieldsHtml` / `tripDraftSet` / `tripDraftCheck`；待递交时）：「行程状态 *」后面小字写建议在韩停留（`krStayHint`，天数照 1106-16）；选「已定」才出现 到达日｜时间｜机场、离开日｜时间｜机场（日期、时间必填，机场选填；样式和下拉一致）；离开早于到达红字；填在草稿 `ks.tripDraft`，`tripWin` 在待递交时读草稿，所以日历马上检查（早于到达灰、天数不够黄字）；按［递交施术日期］（ui.js `submitKrScheduleDate`）时先 `tripDraftCheck`——没选状态 / 已定没填全 / 离开早于到达 → 红字、递交不了——通过后用 `coreSetStay` 把到达 / 离开存进 `c.stay`，再递交。选「暂定」：不出现这两行、不填日期、可直接递交、日历不做行程检查；旧资料里暂定但已有预估日期的保留，卡上写「到达 / 离开（预估）：…」，KR 页头照旧「在韩行程（预估）」。
- **「确认行程」窗口（`openStayModal(…, {trip:true})`）还在哪里用**：① 施术前 7 天 / 30 天的「确认客人行程」待办和卡片（`calalign.js` 的 `reconfirm` / 已确认行程，需要确认方式 + 护照号码）；② 测试里直接调用。**递交施术日期时不再弹**（原来施术日不到 7 天会弹）。
- **递交后［修改］**（`openStayModal(id)` 的「在韩期间」窗口）：新增「行程状态」单选；暂定改已定 → 到达 / 离开日期和时间必填（没填红字、存不了），改成「已定」记 Timeline；已定改暂定只改状态、日期保留；原来已定的案件改日期仍是原来的宽松规则。
- **年 / 月下拉置中**（`krSchedMonthNavHtml`，`justify-content:center`）。
- 测试：selftest R248a（A1，stageC 夹具）；旧断言改前 → 改后：R189a「行程状态下面没有入境 / 离境日期栏 / 已定递交时不填入境 / 离境」→「选已定才出现到达 / 离开；没填递交不了；填好递交成功」；R191a「施术日不到 7 天递交时先弹确认行程窗口」→「在卡片上直接填、不弹窗、递交成功」；R247a 顺序检查先选已定。回归对照 1106-17 文档提交：A1 / KM1 / KD1 失败集合一致（R114a 在基线上偶发失败），roletest 8 个账号 0 不符。
- 旧资料数量（11/02 备份）：25 个案件里 暂定 1 个（没有预估日期）、已定 3 个、已递交但没有状态的 3 个；暂定且带预估日期的 = 0 个。
- 我的判断（未经确认）：① 递交时不再设置 `tripConfirm`（确认方式 / 护照号码仍由施术前 7 天 / 30 天的「确认行程」补）；② ［修改］窗口里已定的案件改日期仍保持原来宽松规则，只有暂定改已定才要求日期 + 时间必填。

## CMD-1106-19 补充（2026-11-06，追加；取代 CMD-1106-17 里日历上方的图例行和 KR 施术日期卡「（待 IN 递交）」写法，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1106-19`，在 1106-18 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，只改画面。
- **KR 施术日期卡（IN 还没递交）**（kr.js，`Draft` 分支）：只有一行「施术日期 [待印尼室长递交]」，「待印尼室长递交」是状态标签（`status-pill`，和其他状态标签一个样式）；拿掉「（待 IN 递交）」括号和「IN 还没有递交施术日期（IN 室长付定金后在月历里选首选 / 备选日期）。」说明（IN 上次被回复「无法安排」的提示仍保留）。待确认施术时间 / 改期待确认的标题不变。
- **IN 施术日期标题行放图例**（data.js 新增 `krSchedLegendHtml` / `krSchedHeadRowHtml`）：「施术日期」同一行最右边放「■ 首选日  ■ 备选日」（文字从「首选日 ✅ / 备选（选填）」改成「首选日」「备选日」，不再带选中的日期）；拿掉「点选 1～2 天；选了两天时，在其中一天格子左上角勾选「首选日」；只选一天就是首选日」这句（格子左上角的勾选照旧）；`krDateCalendarGridHtml` 本身不再带图例行（日历里的黄字提醒、客人行程那行照旧）；年 / 月下拉仍在中间。IN 改期（修改施术日期）的标题行同样放图例。
- 测试：selftest R249a（A1 + KM1 分页，stageC 夹具）；旧测试没有断言图例文字，不需要改。回归对照 1106-18 文档提交：A1 / KM1 / KD1 失败集合一致，roletest 8 个账号 0 不符。
- 我的判断（未经确认）：图例不再显示选中的日期（原来写「首选日 ✅：YYYY-MM-DD」），因为选中的日期在日历里已经高亮。

## CMD-1106-20 补充（2026-11-06，追加；取代 CMD-1025-01 九 / CMD-1021-06 / CMD-1102-11 四 里「付款没完成时画灰按钮 + 一句原因」的做法，旧文字保留作历史）
- 分支 **V4**，代码提交 d842d63（文档另一个提交）；不推送不合并；**数据版本不变（60）**，只改画面。
- **规则**：项目还没付款时，操作栏不再画灰色［预约时间］/［全部预约］，只写状态文字「待付款」（新增 `krPayWait()`，data.js；12px）；付款后照旧出现［预约时间］。长句「待付款，付款后才能预约」「付清尾款后才能预约」从这些位置拿掉。
- **改了的位置**：① KR 项目卡 施术 / 管理项目页的未预约行（kr.js `useBtns0`，条件 `pend || payU || !paid`；「剩余次数都已安排」这类不是付款原因的灰按钮保留）；② KR 术后管理页未预约行（`krCareRow` 的 op）与［全部预约］（尾款没付清不画；行程已结束仍按原写法）；③ 主案件术后管理 tab / 在韩管理 tab 的未预约与保留行（data.js `pcmModel` 系列里的 op）；④ IN 术后管理［预约时间］（`careBookBtn`）。不属于付款原因的灰按钮、`careBookBlock` 的 toast 拦截、核心函数检查都没动。
- 测试：新增 R250a（KM1）；旧断言改前 → 改后：R74a「灰按钮 tooltip 写原因」→「不画灰按钮，只写待付款」、R123a「尾款没付清：灰按钮 + 提示」→「不画灰按钮，只写待付款」、R107a「未预约行有［预约］」→「有［预约］或（尾款没付清时）待付款」。回归对照 V4 基线（a63decd）：A1 全套只多 R250a（KM1 专用）、KM1 / KD1 批次一致、roletest 8 个账号 0 不符。
- 我的判断（未经确认）：任务只写「待付款」，所以连「尾款还没付清（待付尾款）」的行也统一写「待付款」，没有另写「待付尾款」。

## CMD-1106-21 补充（2026-11-06，追加；取代 CMD-1106-11 / 12 / 19 里 IN 日历格子内的天数提醒、日历上方「客人行程」行与黄字，旧文字保留作历史）
- 分支 **V4**，代码提交见 git log（`CMD-1106-21`，在 1106-20 之后），文档另一个提交；不推送不合并；**数据版本不变（60）**，只改画面（data.js `krDateCalendarGridHtml` 精简，新增 `tripSubmitYellowHtml`）。
- 灰格子不写字（原因只放悬停 title）；格子里不再写「共 X 天，建议 N 天」；选中的格子：首选粉色「首选日」、备选棕色「备选日」，备选日右上角小字「设为首选」（`setKrPrimaryDate`，两天互换），取代原来的「✅ / ☐ 首选日」勾选；日历上面「客人行程…」和黄字两行拿掉。
- ［递交施术日期］（和改期的［提交新日期］）上面一行黄字：「⚠️ 建议在韩停留 N 天：首选日 MM/DD～MM/DD，共 X 天；备选日 …。」，选好日期且天数不够才出现，只有一天不够只写那天；同行最右［咨询韩国室长］= `openCaseRoom(案件)`。
- 测试：新增 R251a；旧断言改前 → 改后：R237a「暂定时日历上方灰字提醒」→ 不再有；R240a「格子里写共 X 天」→ 格子里没有，黄字在递交上面。回归对照 V4 基线：A1 全套只多 R251a（A1 全套里缺夹具，单跑通过）、KM1 / KD1 批次一致、roletest 8 个账号 0 不符。

## CMD-1106-23 补充（2026-11-06，追加；只改画面）
- 分支 **V4**，代码提交见 git log（`CMD-1106-23`，排在 1106-21 之后、1106-22 之前），文档另一个提交；不推送不合并；**数据版本不变（60）**。
- **原因**：代码里 68+ 处写 `border:1px solid var(--line)`（kr.js 68、calalign.js 2、krbook.js 5、hospspecial.js 1、todo.js 1），但 CSS 里**从来没有定义 `--line`**，声明在计算时无效、边框退回 `none`——所以 KR「无法安排」原因框以及大量 KR 输入框 / 下拉 / 文字区都没有框。其他位置（IN、预约页、管理页）用的是 `var(--border)`，本来就有框。
- **改法**（app.css）：`:root` 加 `--line:var(--border)`（一处改，全部带上框）；所有 `<textarea>` 默认带框（`textarea{border…}`，行内 style 自己写了边框就以它为准）+ `::placeholder` 灰色。「无法安排」文字区加提示字「请写无法安排的原因」；IN 在 KR 日程占位弹窗的备注加提示字。**新写输入框用 `var(--border)`，不要再用 `var(--line)`**（现在虽有定义，但不是设计变量）。
- 测试：新增 R253a（KM1）；回归对照 V4 基线：A1 全套 / KM1 / KD1 批次失败集合一致，roletest 8 个账号 0 不符（KM2 / R132b 各有一次环境波动，单独重跑一致）。

## CMD-1106-22 补充（2026-11-06，追加；取代 CMD-1105-02 / 1105-03 / 1105-04 / 1105-12 / 1106-08 里的「调整方案三步」「不建议手术 · 更换时间 / 取消项目三选一」「施术转韩国持有」「IN 三选一」「下次赴韩勾持有施术」「客人页持有施术取消 / 退款」，旧文字保留作历史；规则见开发交接 05 的 5-18）
- 分支 **V4**，代码提交 c17d2df（文档另一个提交）；不推送不合并；**数据版本 60 → 61**（`MIGRATIONS` to:61，升级前自动备份；新增可空字段 `c.depositDue / noShowDue / krRefundDue / krRefunds / krTailPaid`、`krJudge.route`、`visitEval.route/inRefund/krDiff`、项目 `tripEndUndone`）。
- **到院评估只分两条路**（`KR_JUDGE_TEXT`：ok =「可以做（含加项目）」，changed =「项目有变动」，cannot 只给旧数据显示，`coreJudge` 不再接受新选）。**项目有变动**是一张卡（kr.js `krWizard` 的 changed 分支）：勾这次实际要做的项目（`KR_ADJ.dropped` 反向，一项都不勾也行，原因 = 评估 memo 必填）+ 添加项目（施术 / 管理）+ 结算，画面直接写走哪条路。`coreDropItems`（取消，可全部不做）→ `coreSettleBalance` 里先 `coreChangeRoute`：合计 ≥ 定金 → 定金抵、韩国补差额（不退款）；合计 < 定金或没做 → `c.depositDue = {status:'pending', amount: 定金}`，`krBalanceInfo` 在 `depositDue` 时可抵定金 = 0（韩国全额收），韩国新开全额结算单（`newFull`，没做任何项目就不开），IN 弹出通知（action + popup:'confirm'）+ 待办 `depositdue`。
- **IN 处理退定金**（data.js `openDepositDue / ddmRender / ddmGo`，核心 `coreDepositDecide`）：退款（方式必填，记 `c.refunds` 带 `dep:true`）或置换（`coreCompCreate`，只能在印尼用）二选一。处理完之前主案件不结案（`mainOngoingOf` 把待处理的 `depositDue / noShowDue` 算进行中）。
- **谁收的谁退**：韩国收的尾款由 KR 登记退款——`c.krTailPaid`（付清尾款时记）、`coreKrRefund`（金额 ≤ 已收尾款、原因 + 方式必填）、KR「结算」tab 的「韩国退款（尾款）」卡 + ［记录韩国退款］（`krRefundOpen`）；KR 待办 `krrefund`（`c.krRefundDue`，可［不退（已处理）］写原因）。**KR 退款入口原来没有，这次新增。**
- **无故不来 / 行程结束没做**（`coreTripEndUndone` 取代 `coreHoldSurgOnTripEnd`）：没做的施术项目取消；有原因（离院选了身体不适 → `rebookWait`）→ 当「项目有变动」：定金份额开退定金待办，尾款部分开 KR 退款待办；没原因（客人没来）→ `c.noShowDue`，**IN 管理者账号**（`nikCanEdit()`）收到待办 `noshowdue`，`coreNoShowDecide`：退（方式必填）/ 不退，原因必填。已付份额按 `itemPaidSplit`（定金份额 / 尾款部分）。
- **重新约那天的到院评估**同样两条路（`coreVisitEval` 不再接受 cannot；`coreVisitAdjust` 允许一项都不做；`visitMoneyStep` 新算法：d / t = 这几项已付定金份额 / 尾款，n = 保留 + 新加的合计，定金留 min(n, d)，多的印尼退，韩国 n − 留下的定金 − t：多 → 补付、少 → KR 退款待办）；`coreVisitCancelDecide` 删除；离院「客人本人放弃」取消项目（`coreLeaveCancel`）同样按份额开退定金 / 韩国退款，不再选更换 / 全部 / 部分。「身体不适 → 重新预约（当场约 / 之后再约）」不变。
- **拿掉**：不建议手术（更换时间 / 取消项目三选一 / 部分退回 / 差额转置换额度的评估入口）、调整方案三步、`coreTripDecide` / `openTripDecide`（IN 三选一）、`coreHeldSurgCancel` / 客人页持有施术［取消 / 退款］、`toggleHeldSurg` / `heldPickerHtml`（下次赴韩勾持有施术）、`applyHeldTransfer`、`coreVisitCancelDecide`、改日 / 保留项目 / 保留金额。`heldSurgItems / tripWaitItems / clientHeldSurgPool / heldPickerHtml / applyHeldTransfer / heldSurgLockedBy` 留着空壳（恒为空 / 空操作），旧代码里读它们的地方（客人页、列表、进程文字）因此自动不再出现。**不动**：管理项目的韩国持有。
- **迁移 61**（store.js）：案件里的 `heldSurg` / `tripWait` 的施术（没做、没取消、没转走）→ 项目取消 + 有原因的开 `depositDue`（定金份额）+ `krRefundDue`（尾款部分），没原因的开 `noShowDue`；已被新案件使用的（`heldTransferred` / `heldFrom`）和已付款的结算单**不动，只记数量**（`window.GMC_HELD61_USED / FROM / CONV / CASES`，写进迁移备注）；已结案的案件重新打开；幂等。用 11/02 备份（隔离端口）验证：56 → 61，25 个案件迁移、0 失败、核对数 25 = 25；备份里没有持有施术，Fanny A000010 用模拟的旧状态（2 项持有，1 有原因 / 1 没原因）跑迁移：退定金 ₩300,000、无故不来定金 ₩360,000，再跑一次不重复。
- 测试：新增 R252a（A1）、R254a（KM1，重新约那天）；R198b 改成新的单卡画面；F3 / F4 改新文字，F5 / D24 / D25 / R198a 按新规则重写；**删除**已无对象的旧用例 R198c、R200a、R221a、R223a、R224a、R224b、R225a、R231a，R238a 去掉「行程结束转持有」一段。回归对照 V4 基线 2565b7e：A1 只少了被删的用例、多了 R252a（通过）；KM1 / KD1 批次里被牵动的旧用例用同样夹具单跑与基线一致；roletest 8 个账号 0 不符。

## CMD-1106-24 补充（2026-11-09，追加；取代 CMD-1106-22 里「无故不来 · IN 管理者（nikCanEdit）决定」，旧文字保留作历史）
- 分支 **V4**，代码提交 e9b8eae，文档另一个提交；不推送不合并；**数据版本不变（61）**，没有新字段。
- 「无故不来」全部改名「无故不做项目」（待办、通知、Timeline、决定窗、迁移备注；字段名 `noShowDue` / `coreNoShowDecide` 不改）；「IN 院长」写法一律改「IN 室长」。待办 `noshowdue` 和退定金待办一样给这个案件的 IN 室长（`todoInMine`），不再要求 `nikCanEdit()`，`openNoShowDue` 的管理者拦截拿掉；二选一照旧（退：方式必填 / 不退：原因必填）。
- 来了（已到院）但没做、也没选原因：系统 / 确认结束标的「未选原因」待重新预约（`rwNoReason(rw)`）在行程结束时按「无故不做项目」处理，不再当作「有原因 → 退定金」。
- `git stash list` 为空（1106-22 的 WIP 早已并入 c17d2df），没有需要 drop 的 stash。
- 测试：selftest 新增 R255a；A1 全套对照基线失败集合一致，KM1 全套一致（R255a 在 KM1 里失败属预期，要在 IN 分页跑）。roletest 这次没重跑。

## CMD-1109-01 补充（2026-11-09，追加；取代 CMD-1106-17 / 1106-19 / 1019-16 里 IN「赴韩日程」卡 KR 已确认后的版面和「发过之后不再有按钮」，旧文字保留作历史）
- 分支 **V4**，代码提交 19ee5fe，文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面。待递交（Draft）的版面不动。
- 三段（`krProcedureTabMain`，data.js）：标题「赴韩日程」+［打印］｜「行程」+［日程变动］（原标题行［修改］改名搬下来，功能不变 `openStayModal`）+ 到达日 / 离境日两行（日期 时间 机场）+ **只一行**「⚠️ 离境日比建议少 N 天」（`inStayInnerHtml(c, true)`：拿掉拆线黄字和建议在韩停留小字，年份可能存错的红字保留）｜「施术日期」+ 状态标签（待 KR 确认 / 已确认 / 改期待确认 / 已到院）+ 右边按钮（`sdHead`）。已确认：［修改施术日期］［取消施术计划］（原［修改日期］［取消项目］改名，功能不变）；框里第一行「施术日期 …，到院时间 HH:mm（印尼）（韩国 HH:mm）」+［发送信息给客人］，第二行「地址：…」。拿掉：绿字「✓ 施术时间已确认…」（`subStatusRowHtml` 过滤掉）、「已到院 / 付清尾款… 均由 KR 端操作」说明、框右边的「✓ 已发送」。
- `surgSendHtml`（calalign.js）：按钮改名［发送信息给客人］，发过之后**按钮还在（可以再发）**，下面小字「已发送 MM/DD HH:mm」（电话通知写「已电话通知 MM/DD HH:mm」）；KR 改了时间后仍是红字 + ［已电话通知］。
- 测试：新增 R256a；旧断言改前 → 改后：R15d / R42a 等的「已发送（WhatsApp」→「已发送 MM/DD HH:mm」、R45a「✓ 已发送 / 没有发送给客人」→ 按钮还在 + 小字、R144a「建议在韩停留 + 修改」→「到达日 / 离境日 + 日程变动」、「发送给客人」→「发送信息给客人」。

## CMD-1109-02 补充（2026-11-09，追加；取代 CMD-1109-01 里赴韩日程卡的按钮尺寸、框里的时间 / 地址写法，旧文字保留作历史）
- 分支 **V4**，代码提交 3f5a7f3，文档另一个提交；不推送不合并；**数据版本不变（61）**（新增可空字段 `HOSPITAL_DATA[h].addressKo`，没填 = 读医院基本资料里的韩文地址，不需要迁移）。
- **按钮**：［打印］［日程变动］［修改施术日期］［取消施术计划］［发送信息给客人］（含待递交的取消赴韩 / 已电话通知）都用 `.sd-btn`（app.css，padding 5×12、12px）；［发送信息给客人］仍是深色主按钮。
- **框**（`.sd-box`，13px 同上下字号，浅棕底 + 棕色边框）：「施术日期 YYYY-MM-DD HH:mm（韩国时间）」+ 小标签「印尼时间 HH:mm」（跨天带 MM-DD，`sdTimeLine`）；「地址：英文（韩文）」。已到院框同款。
- **地址**：`addrBoth(hid, ks.address)`（data.js）：`ks.address` 等于英文 / 韩文地址或空 → 「英文（韩文）」；KR 手改成别的文字则原样显示。用于 IN 框、打印行程单（`printKrPlan`）、给客人的信息（`surgMsgText`）、KR 的施术日期显示（kr.js 三处）。`hospitalKoAddr(hid)`：医院设定「韩文地址」（选填，KR 医院设定的「英文名称 / 英文地址 / 韩文地址」卡，`saveHospEn` 记操作日志和通知），清空 = 只显示英文。
- **「X 也在查看这个案件」提示**（ui.js `presRender`）：opacity .2 + `pointer-events:none`（不挡下面按钮），鼠标距提示 40px 内变 .7（`document` 的 mousemove，IN / KR 共用一个函数）。
- 测试：新增 R257a；A1 全套对照基线失败集合一致，KM1 一致（R257a 要在 IN 分页跑）。

## CMD-1109-03 补充（2026-11-09，追加；取代 CMD-1109-01 / 02 里赴韩日程卡的［修改施术日期］［取消施术计划］、CMD-1019-12 里待递交 / 待确认的［取消赴韩］［无法协调］、CMD-1014-03 里取消项目退款弹窗的「退钱 / 转本地项目（置换）」二选一，旧文字保留作历史）
- 分支 **V4**，代码提交 1131992，文档另一个提交；不推送不合并；**数据版本不变（61）**，没有新字段（仅 `krSchedule.changeReason` 可空文字）。没有动任何已付款的结算单。
- **［施术变动］弹窗**（data.js 末尾 `svbOpen / svbRender / svbGo / svbDoTime / svbDoCancel`，`#svb-overlay`，状态 `SVB`；`renderCaseBody` 外包一层让弹窗跟着重画）：○ 更改时间（理由必填；首选必选、备选选填；用递交同一个日历，年 / 月下拉、灰格子、天数不够黄字 +［咨询韩国室长］；日期草稿暂存在 `ks.svbPrimary / svbBackup`，关弹窗清掉）→ 已确认 / 改期待确认：走原改期流程（`change_pending` + `changeSubmitted`，KR 室长确认到院时间，原日期继续有效，理由写进 Timeline 和 KR 通知）；待 KR 确认：直接替换已递交的首选 / 备选并通知 KR。○ 取消施术（整个施术计划；只取消几项仍在项目卡 / 结算单［取消项目］操作）：理由必填；显示已付定金（`krBalanceInfo.effDeposit`）；「退款」（金额、退款方式必填）与「不退款，置换项目」可一起勾，置换 = 已付 − 退款，两笔加起来 = 已付；只勾退款且少于已付要提示勾置换；都不勾送不出；没有已付定金就只填理由。
- 取消的处理：项目标取消 + `coreAfterItemsRemoved`（施术块 / 院长时间释放）；`c.refunds` 记一笔真退款（带方式）和一笔 `comp:true`（定金按退款入账，财务净额不重复）；置换额度走 `coreCompCreate`，记在客人资料 `compCredits`（客户详情持有项目上方「置换额度」，不可退款，只能抵印尼本地项目，下次本地选购有［用置换额度换项目］）；KR 收到「施术已取消」通知；之后 `afterKrItemsChanged`（问是否做本地项目等，照旧）。Timeline 开头用词：KR 没回过日期 =「室长点［取消赴韩］…」，回过但未确认 =「室长点［无法协调］…」，已确认 =「取消施术计划…」（测试覆盖页 D27～D31 的正则仍认得）。
- **入口**：待递交只有取消（日期行右边［施术变动］，下面只剩［递交施术日期］）；待 KR 确认 / 已确认 / 改期待确认 = 更改时间 + 取消施术；已到院不显示（IN 不能改）。**收进来的入口**：待递交 / 待确认的［取消赴韩］/［无法协调］、已确认的［修改施术日期］［取消施术计划］、改期待确认的［取消施术计划］、施术前 30 天「确认客人行程」里的「要改期 / 取消赴韩」（`reconfirmPick` 改成打开弹窗）。**保留**：结算单卡片上的［取消项目］（按批次、只取消其中几项）、改期待确认的［取消修改］、旧函数 `requestCannotCoordinate / startKrScheduleChange / openCancelItems / confirmRefund`（给旧测试和结算单入口用）。
- 测试：新增 R258a；旧断言改前 → 改后：R41a「待递交［取消赴韩］/ 回过后［无法协调］」→ 两种都是［施术变动］；R256a / R257a「［修改施术日期］［取消施术计划］」→「［施术变动］」（五个按钮 → 四个）。

## CMD-1109-04 补充（2026-11-09，追加；取代 CMD-1106-07 里「行程和施术日期对不上就存不了行程」、CMD-1106-10 里日历把早于到达的日子灰掉，旧文字保留作历史）
- 分支 **V4**，代码提交 cbe2090，文档另一个提交；不推送不合并；**数据版本不变（61）**，没有新字段（仅 `krSchedule.rebookFlag` 可空文字，防重复通知）。
- **「碰到」** = 施术日不在行程内：早于到达日、**晚于离境日（`tripDateIssue` 新增 kind `late`）**、到达当天到院时间早于到达时间；暂定行程（soft）不算；「天数不够」（kind `short`）照旧只黄字。辅助：`tripHardIssue / tripRedText / tripRedHtml`。
- **行程变动碰到施术日期**：`staySave`（calalign.js）不再拦，存之前 `confirm`「施术日期 … 不在新行程内，存好后需要重新预约施术时间。仍要保存吗？」；存好后（`coreSetStay / coreStayFix` 末尾 `rebookAfterStay`）：`ksRebookNeeded(c)` 为真（已确认 / 改期中的 `confirmedDate` 在行程外且还没提交新日期；待确认时首选和备选都在行程外）→ 赴韩日程卡「施术日期」标签「需重新预约」+ 红字「⚠️ 施术日期 03/16 不在新行程内（03/18～04/01），请重新预约施术时间」；Timeline「行程变动：…」+ KR 通知（action 级）；KR 待办 / IN 待办 `rebooktrip`；`syncSurgeryBlock` 在需要重新预约时不再画施术块（**旧时段从院长日程释放**；IN 重新约并被 KR 确认后 `coreChangeConfirm` 重新同步）；`coreScheduleConfirm / coreChangeConfirm` 本来就拒绝「碰到」的日期（现在也含晚于离境），所以 KR 确认不了旧日期；［施术变动］→ 更改时间的理由预填「行程变动」（可改）。IN 重新约（提交新日期）后 `ksRebookNeeded` 回到 null，红字消失，状态变「改期待确认」。
- **施术变动 / 递交日历选行程外的日子**：日历格子不再灰掉（`pickKrDate` 不再拒绝），选了的日子格子字变红，日历下面红字「⚠️ 03/25 在客人离境之后，请先修改行程」（早于到达写「在客人到达之前」）+ 最右［行程变动］（`tripOpenStayFromCal`，打开行程编辑，z-index 在施术变动弹窗之上）；`svbGo / submitKrScheduleDate / submitKrScheduleChangeDate` 碰到时送不出；行程改好回来红字消失即可送出。KR 确认时的检查不变（`coreScheduleConfirm` 拒绝）。
- KR 案件页头［行程修正］后面的小红字改用 `ksRebookNeeded`：「⚠️ 施术日期 MM/DD 不在行程内，等 IN 重新预约」。按钮［日程变动］→［行程变动］（功能不变）。
- 测试：新增 R259a；旧断言改前 → 改后：R243a「施术日期早于到达」→「施术日期 … 不在行程内，等 IN 重新预约」；R144a / R256a / R257a / R259a 里「日程变动」→「行程变动」；R256a / R257a 夹具的到达日改成施术日前一天（不然到达当天的到院时间早于 11:20 会变成「需重新预约」）。

## CMD-1109-05 补充（2026-11-09，追加；取代 CMD-1106-21 里备选日格子的「设为首选」、CMD-1106-18 里暂定时不显示到达 / 离开、CMD-1109-04 里碰到行程时的［送出］只在点的时候报错，旧文字保留作历史）
- 分支 **V4**，代码提交 0fa72be，文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面。
- **日历**（`krDateCalendarGridHtml`，递交日历和施术变动日历共用）：备选日格子只写「备选日」，拿掉「设为首选」；点法不变——第一个点 = 首选、第二个 = 备选、再点已选的 = 取消，取消首选时备选自动变首选（`pickKrDate` 原逻辑）；`setKrPrimaryDate` 留着没有入口。
- **送出灰掉**（`disabled` + opacity .5 + not-allowed，和其他不能按的按钮一样）：`sdSubmitOff(c, 首选, 备选)` = 没选首选 或 有「请先修改行程」红字；用在［递交施术日期］、改期卡的［提交新日期］、［施术变动］弹窗更改时间的［送出］（后者另加「理由没填」，`svbSendOff` / `svbBtnRefresh`，理由输入时即时更新）；行程改好、红字消失就恢复；点灰掉的按钮不触发（原来点了才 alert / 红字，函数里的拦截保留作兜底）。
- **在韩行程弹窗**（`openStayModal`，calalign.js）：标题「在韩期间」→「在韩行程」（「确认行程」窗口标题不变）；拿掉「行程有变可以修改…」和「改成「已定」要填…」两句；标题下一行灰色小字 ℹ️「考虑到术后管理及拆线安排，建议预留 N 天以上的行程。」（N = `tripStayDays`，已定 / 暂定都显示；「确认行程」窗口不加）；入境 / 离境两行包在 `<fieldset id="stay-rows">`，选「暂定」→ 灰掉不能填（不隐藏），红字 / 黄字都不显示（`stayTsToggle` / `stayTsOff`）；选「已定」→ 可填，只留一行红字「⚠ 离境日比建议少 N 天（最早可回国日 MM/DD）」，拿掉「拆线安排在第 7 天…」黄字；暂定保存时只改状态、不存日期（`staySave`，暂定本来就在状态已是暂定时也不动日期）。
- **IN 赴韩日程卡待递交的行程区**（`tripStateBlockHtml` / `tripDraftFieldsHtml(c, ks, dis)`）：同样——ℹ️ 提示一行（`tripHintLine`）→ 行程状态 * → 已定 / 暂定单选 → 到达 / 离开两行一直显示（`<fieldset>`，暂定或还没选时灰掉），取代原来「行程状态 * 建议在韩停留…」小字和「到达 / 离开（预估）：…」一行。
- 测试：新增 R260a；A1 / KM1 全套对照基线失败集合一致（没有旧断言需要改）。

## CMD-1109-06 补充（2026-11-09，追加；补 CMD-1109-04 / 05 里红字旁［行程变动］的流程，旧文字保留作历史）
- 分支 **V4**，代码提交 7aa7ee9，文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面流程。
- **从［施术变动］红字旁打开的「在韩行程」**（`tripOpenStayFromCal` → `openStayModal(id, {fromSvb:true})`）：［保存］（含「暂定」那条保存路径）和［取消］之后都 `svbResume()` 回到施术变动弹窗——理由 / 首选 / 备选 / 日历年月保留（`SVB` 与 `ks.svbPrimary / svbBackup` 本来就不随行程弹窗清掉），用新行程重新检查（红字消失、［送出］恢复）；取消 = 行程不改，红字还在。（实测：旧版因为 `renderCaseBody` 外包会重画 `SVB`，保存后其实已经回得来；这次把它写成明确的流程，取消和暂定路径也补上。）
- **卡片［行程变动］**（`openStayModal(id)` 不带 fromSvb / trip / initial）保存后（`staySaveDo` 末尾）：新行程碰到施术日期（`ksRebookNeeded`，1109-04 的“需重新预约”）→ `svbAutoOpen`：自动打开［施术变动］的「更改时间」，理由预填「行程变动」（可改），日历停在新行程到达月（到达日在今天之后，否则明天所在月）；不碰到就只关掉弹窗（照旧）。「确认行程」窗口（`o.trip`）、第一次填写（`o.initial`）、带 `then` 回调的入口不触发。
- **待递交的卡片**：红字旁［行程变动］不再开弹窗（到达 / 离开本来就是卡片上的输入框，定位 + 聚焦到第一个日期输入），保存后无需“回到递交画面”——已选首选 / 备选本来就在卡片上。
- 测试：新增 R261a（①保存回来 ②取消回来 ③卡片碰到自动打开 / 不碰到只关掉 ④待递交定位）；基线上 ①②④本来就通过，只有 ③失败。

## CMD-1109-07 补充（2026-11-09，追加；取代 CMD-1109-04 里存行程碰到施术日期时的浏览器 confirm，旧文字保留作历史）
- 分支 **V4**，代码提交 84d78ed，文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面。
- `staySave`（calalign.js）不再弹 `confirm`「…不在新行程内，存好后需要重新预约施术时间。仍要保存吗？」，直接存；存好后照 1109-04 / 06：施术标红「需重新预约」、KR 通知 / 待办、院长日程释放，并 `svbAutoOpen` 自动打开施术变动（更改时间 + 理由「行程变动」）。
- ［施术变动］弹窗标题行右边（`svbTripText`，`#svb-trip`）：「行程 MM-DD HH:mm ～ MM-DD HH:mm」（客人到达 ～ 离境，韩国当地时间）；暂定写「行程 暂定」，没填写「行程 未定」；从弹窗里改了行程回来（`svbResume` → `svbRender`）马上更新。递交日历在卡片上不是弹窗，没加。
- **这套流程里剩下的原生 confirm / alert（没动，等你决定）**：ui.js `submitKrScheduleDate`（碰到行程的 alert，按钮已灰所以点不到；没选行程状态时的 alert 提示）、`submitKrScheduleChangeDate`（没选首选 / 碰到行程的 alert，按钮已灰，兜底）、`requestCannotCoordinate`（取消赴韩的 confirm，旧入口，页面上已经没有按钮指向它）。施术变动弹窗、在韩行程弹窗、处理冲突的弹窗里的校验都是弹窗内红字，没有原生弹窗。
- 测试：新增 R262a；R259a 的“存之前提醒一句”断言改成“没有确认框 + 自动打开施术变动”。

## CMD-1109-08 补充（2026-11-09，追加；取代 CMD-1106-09 / 12 / 14 里 KR 施术日期卡的排版、「和院长已有预约重叠也挡住」，以及 CMD-1109-01 里 IN 赴韩日程卡「改期待确认」那一段，旧文字保留作历史）
- 分支 **V4**，代码提交 c211ea7，文档另一个提交；不推送不合并；**数据版本不变（61）**，没有新字段（只有 Timeline 多一句）。依据开发交接 05 的 5-5（11/09「和院长时段重叠」），用户已确认。
- **KR 施术日期确认卡**（kr.js `krSchForm` / `krTabProc`，初次确认 Pending 和改期确认 Changing 共用）：标题行 =「施术日期确认」+ 状态标签（待确认 / 改期待确认）+［行程修正］（`krStayFixOpen`，和页头同一功能），最右「赴韩日程：MM-DD HH:mm ～ MM-DD HH:mm」（`svbTripText` 换前缀；暂定写「暂定」，没填「未定」）；拿掉「原日期…继续有效。IN 提出的新日期：」和「行程状态：」两行。首选 / 备选：「首选施术日：YYYY-MM-DD（周N）」「备选施术日：…」，**只有选中的那天**列院长不能预约的时段，每段一行「HH:mm–HH:mm（原因）」（`krSchDayLines`，原因 = 不可预约 / 已有预约 / 医院休诊 / 院长 OFF；整天 OFF / 休诊写「全天不可预约（原因）」；都没有写「X 院长：全天可预约」）。强调框（`.kr-sch-box`，浅底 + 边框，字号 13px 同上下）：施术时间下拉、施术日期 MM/DD（周N）+ 时间下拉 + ～ 结束时间、提醒行。按钮［确认新时间］/［确认］→［**确认施术时间**］，［无法安排］照旧，两个都用 `.sd-btn` 小尺寸。改期确认的时间沿用原时间（CMD-1106-12 不变）。
- **重叠规则（规则变更）**：新函数 `krSchHard(er)`（kr.js）——错误文字含 休诊 / OFF / 营业时间内 / 午休时段 / 到院已完成 = **硬冲突，照旧挡**（框里红字、［确认施术时间］灰、时间下拉灰掉）；其余（`krSurgerySlotError` 返回的和院长已有施术 / 面诊 / 预约 / 不可预约 / 院长操作行重叠）= **只提醒**：`krSchOverlaps` 用 `directorClashList`（排除 OFF 和本案件自己）列出重叠段，框里黄字「⚠️ KO1 院长 14:00–15:30 有预约，请确认重叠的情况下是否可以预约。」，［确认施术时间］可以按，时间下拉里这些时间不灰、后面小字「（有预约）」。`krDoSchConfirm` 不再走 `krSlotAsk` 询问弹窗：硬冲突直接 `krBlock`，重叠把重叠段（如「14:00–15:30」）传给 `coreScheduleConfirm / coreChangeConfirm` 的新参数 `overlap`，Timeline 多记一句「确认时和院长 14:00–15:30 的预约重叠」。早于到达 / 不在行程内照 1109-04（仍挡），天数不够照旧黄字；午休 / 营业时间外仍是确认后可约。**核心函数本来就不检查院长时间重叠**（只检查行程），所以 IN 以外的入口不受影响。判断位置：`krSchHard` + `krTimeOptionsFor` + `krSchForm` + `krDoSchConfirm`。
- **IN 赴韩日程卡「改期待确认」**（data.js `krProcedureTabMain` 的 Changing 且已提交分支）：标签「改期待确认」→「**等待 KR 室长确认**」，右边［取消修改］［施术变动］；第一行「原定赴韩施术时间：YYYY-MM-DD HH:mm（韩国时间）［印尼时间 HH:mm］」（1109-02 写法），第二行「更改赴韩施术时间：YYYY-MM-DD［首选］，YYYY-MM-DD［备选］」（没备选只写首选）；原来行程下面那行「⚠️ 施术时间变更待确认（原日期继续有效）」（`subRow` 过滤）和最下面灰字拿掉，提醒只留一行放最下面「⚠️ 施术时间确认变更前，原日期继续有效。」；行程变动导致的重新预约（`ksRebookNeeded`）：原定那行加红字「（已不在行程内）」，不写「继续有效」。其他地方的「改期待确认」文字（待办、KR 列表筛选、日志）没动。
- 测试：selftest 新增 R263a（KM1，stageC 夹具：标题 / 只列选中那天 / 强调框 / 重叠黄字可确认 + 下拉 / OFF 挡 / Timeline / 改期确认同一张卡）、R263b（A1，stageC 夹具）；旧断言改前 → 改后：R239a「行程状态：已定（…）」→「赴韩日程：…」、「首选施术日期：」→「首选施术日：」、「估算时间」→「估算」；R241a「预计时长改长后 14:00 撞到不可预约而灰掉」→「不灰掉，（有预约）」；R241a / R242a 找按钮改认「确认施术时间」；R242a 标签文字；R244a 顺序检查用新文字；R256a「改期待确认」标签→「等待 KR 室长确认」。
- 我的判断（未经确认）：① 改期确认的时间下拉沿用原时间（任务没说要清空）；② 硬冲突用错误文字关键词判断（休诊 / OFF），不是单独的类型字段；③ 「有预约」重叠段用 `directorClashList` 列出，包含院长操作到院和不可预约；④ 备选施术日选中后同样只列那一天，未选中的不列。

## CMD-1109-09 补充（2026-11-09，追加；取代 CMD-1106-11 / 1109-08 里 KR 开始时间下拉「06:00～23:30 全列、按整个时长标有预约」，旧文字保留作历史）
- 分支 **V4**，代码提交 45db416，文档另一个提交；不推送不合并；**只改画面，数据版本不变（61）**。
- **下拉范围**（kr.js `krTimeOptionsFor` / `krSchEffHours`）：那天医院营业开始前 2 小时 ～ 营业结束后 2 小时，每 30 分钟一个（上限 23:30）；营业时间读医院设定 `hospitalHours(hid)`，半天营业（`hospitalClosedBefore / hospitalClosedFrom`）按收窄后的时间；午休读医院设定 `hospitalLunch(hid)`（本来就有，没有新加栏位）。
- **标注只看开始时间本身**（`krSchStartTag`）：营业外 →（营业外）；医院午休 →（午休时间）；院长不可预约 / 已有其他预约 →（已有预约）；其余只写时间。灰掉不能选：院长 OFF（含时长内碰到 OFF）→（院长 OFF）、医院休诊 →（休诊）、早于到达 / 晚于离境（1109-04）。营业外 / 午休 / 已有预约都可选。
- **黄字**（`krSchForm`）：选了之后按整个施术时长列重叠段：「⚠️ 11:00 开始：KO1 院长 11:00–13:00 有预约、13:00–14:00 午休，请确认重叠的情况下是否可以预约。」（营业时间外也列），［确认施术时间］可按；`krDoSchConfirm` 的硬冲突判断（`krSchHard`）不变。首选 / 备选下面的院长时段（`krSchDayLines`）加上午休「HH:mm–HH:mm（午休时间）」，营业外不列。
- 测试：selftest 新增 R264a（KM1，stageC）；R241a「14:30 有预约」改看 15:00（标注按开始时间本身，改前按整个时长）。
- 我的判断（未经确认）：① 范围下限取整到 30 分钟；② 灰掉时院长 OFF 只要整个时长碰到就灰、标（院长 OFF）；③ 营业外与午休同时成立时先标营业外。

## CMD-1109-10 补充（2026-11-09，追加；取代 CMD-1019-16 里「发过之后 KR 改了时间 → 红字请电话通知客人 + ［已电话通知］」，旧文字保留作历史）
- 分支 **V4**，代码提交 d580b90，文档另一个提交；不推送不合并；**只改画面，数据版本不变（61）**。
- KR 确认新时间后，IN 赴韩日程卡的框和第一次确认后一样（calalign.js `surgSendHtml`）：拿掉红字「⚠ 施术时间已变更（原 … → 新 …），请电话通知客人」和［已电话通知］，右边是［发送信息给客人］（发送内容用现有发送流程，读当前新日期 / 时间 / 地址）；`surgMsgSent(c)` 只认新时间的发送记录，所以新时间还没发送时按钮下面不写「已发送」，发送后「已发送 MM/DD HH:mm」（`surgInformKey` 在发送时更新，函数不变）。`openSurgPhone` / `confirmSurgPhone` 函数留着，页面没有入口。
- **待办**（todo.js `relay`）：原来改了时间的「电话通知客人时间变更：…」改成「请发送新的施术时间给客人：（原 → 新）」，按［发送信息给客人］发送后 `surgMsgSent` 为真，待办消失；第一次确认的「KR 已确认施术时间：发送给客人」不变。Timeline 照旧记改期确认和发送。
- 测试：新增 R265a；R45a 与 selftest 里两处旧断言改前 → 改后：红字 + ［已电话通知］ → 和第一次一样的发送按钮，待办文字「电话通知客人时间变更」→「请发送新的施术时间给客人」，按完「已电话通知 + 备注」→「已发送 MM/DD HH:mm」。
- 我的判断（未经确认）：① 改时间后不再有任何“电话通知”入口（含施术前提醒后改时间的情况）；② 地址变更也走同一个［发送信息给客人］。

## CMD-1109-11 补充（2026-11-09，追加；取代 CMD-1109-01 里「发过之后按钮还在，下面小字已发送」，旧文字保留作历史）
- 分支 **V4**，代码提交 a144aab，文档另一个提交；不推送不合并；**只改画面，数据版本不变（61）**。
- IN 赴韩日程卡框里的发送区（calalign.js `surgSendHtml`）：当前这一版施术时间已发送（`surgMsgSent`）→ 不再显示深色［发送信息给客人］，改成第一行绿色小字「MM/DD HH:mm 已发送」（电话通知过的旧记录写「MM/DD HH:mm 已电话通知」+ 备注），第二行下划线文字「再次发送」（`openSurgMsg`，走现有发送流程，发完时间更新）；还没发送（含 KR 改期确认后新时间还没发）→ 深色按钮 + 演示小标。
- 其他「发送 / 已发送」地方清单（**先不动**）：KR 端［发送诊疗方案］（`krSubmitBlock`）和［发送复诊评估结果］（`krRvWorkBlock` / `krSubmitReport`）——发出后整块换成「✓ … 已发送」只读文字，没有再发按钮；IN 面诊 tab 的报告卡只有［完整报告查看］［下载］，没有发送；预约页确认短信（booking.js，客人端文字）；诊所设定「重新发送提醒短信」（admin.js 的手动触发 toast）；施术前提醒讯息已在 CMD-1020-13 取消。没有别的同样“深色按钮 + 已发送小字”的地方。
- 测试：新增 R266a（发送前深色 / 发送后已发送 + 再次发送 / 再次发送时间更新 / 改期确认后又变回深色）；R15d、R45a、R256a、R265a 里「已发送 MM/DD HH:mm」的格式与“按钮还在”的断言改前 → 改后：「已发送 MM/DD HH:mm + 按钮还在」→「MM/DD HH:mm 已发送 + 再次发送、没有深色按钮」。R41a 单独跑时在基线上也失败（既有，classList 为 null）。
- 我的判断（未经确认）：电话通知过的旧记录同样写成「MM/DD HH:mm 已电话通知」+ 再次发送。

## CMD-1109-12 补充（2026-11-09，追加；取代 CMD-1015-27 里「Step 4 另有一张『今日进行项目』卡」和 CMD-1020-xx 里项目卡的［本次使用］叫法，旧文字保留作历史）
- 分支 **V4**，代码提交 49ab2aa，文档另一个提交；不推送不合并；**只改画面，数据版本不变（61）**。
- KR 选今日进行项目的画面（kr.js `krTodayPickBar` / `krProjCards` pickMode）：拿掉项目卡下面独立的「今日进行项目」卡；项目卡最下面加汇总区「今日进行（N）」：施术、管理两行都写出名字（哪类没勾不写那行；管理项目仍带数量加减 + 提前使用小字），名字后面 × 取消勾选（`krTpToggle`，列表里的勾跟着拿掉），最右［今日进行］（`krPickGo`，动作不变）；没勾任何项目汇总区不出现；`KR_PICK` 是全局的，切换施术 / 管理分页勾选不清。`krSdRun` 与非施术日页面里原来的 `krTodayPickBar` 外部调用已去掉。
- **用词统一「今日进行」**（只改 KR 这张项目卡）：拿掉卡标题旁「［本次使用］只在客人已到院…［预约时间］按日期建立…」说明；项目卡行内按钮［本次使用］→［今日进行］（`krOutBtn`，含到院已结束时灰掉的那个）、管理项目选次数弹窗标题「本次使用 · X」→「今日进行 · X」、到院结束弹窗提示「继续加项目 / 本次使用」→「今日进行」。**没动**：IN 本地管理的「本次使用」（`inUseOpen` 弹窗、子案件页「剩余项目」卡的［本次使用］、IN 本地管理 tab、KR 代码里的注释和日志文字「本次使用」）；核心函数名 `coreUnitUseNow` / `krUnitUseNow` 不改；Timeline 里已存的「本次使用」不改。
- 测试：新增 R267a（KM1，stageC）；R81a「按钮叫［客人已到院］」原来靠整页文字碰巧含项目卡标题旁的说明，改成读 `krArriveMainBtn`；R82a 弹窗标题、R53b / R30b 里 KR 按钮文字「本次使用」→「今日进行」。
- 我的判断（未经确认）：① 汇总里管理项目名字后面保留数量加减和提前使用小字；② ［本次使用］按钮也一起改名为［今日进行］（任务写“KR 这张卡里其他地方如果还写本次使用就改”）。

## CMD-1109-13 补充（2026-11-09，追加；取代 CMD-1109-12 里「没勾任何项目汇总区不出现」，旧文字保留作历史）
- 分支 **V4**，代码提交 95576b3，文档另一个提交；不推送不合并；**只改画面，数据版本不变（61）**。
- kr.js `krTodayPickBar`：到院进行中的项目卡底部汇总区一直显示。没勾 = 标题行「今日进行（0）」+ 最右灰掉的［今日进行］（disabled，悬停「请先勾选今日进行项目」），下面居中灰字「请勾选今日进行项目」；有勾 = 照 1109-12（施术 / 管理两行名字 + ×），按钮可按；按钮固定在标题那一行最右，有勾没勾位置不变（名字行移到标题行下面）。`krPickGo` 不变。
- 测试：R267a 最后一段改前 → 改后：「全部取消 → 汇总区不出现」→「汇总区还在：今日进行（0）+ 居中提示 + 按钮灰；再勾一项提示消失、按钮可按」。
- 我的判断（未经确认）：只读账号（院长，`krCan()` 假）仍不显示按钮，汇总区本身也显示。

## CMD-1109-14 补充（2026-11-09，追加；取代 CMD-1109-12 / 13 里汇总区「施术：… / 管理：…」挤一行 + ×，旧文字保留作历史）
- 分支 **V4**，代码提交 7b6745b，文档另一个提交；不推送不合并；**只改画面，数据版本不变（61）**。
- kr.js `krTodayPickBar`：标题「今日进行项目（N）」，［今日进行］在标题同一行最右；一项一行，前缀【施术项目】/【管理项目】（施术在前、管理在后），**没有 ×**（取消就在上面列表拿掉勾）；管理项目的「（建议 MM/DD 起，今天提前使用）」放在那一项下一行、灰色小字加括号、和名字对齐（`krEarlyHint` 的文字加括号只在这里做）；管理项目的数量加减保留在名字后面；没勾 = 标题（0）+ 居中灰字「请勾选今日进行项目」+ 灰掉的按钮（照 1109-13）；没有「已勾选：N 个项目」那行。`krTpToggle` 保留给列表里的勾选框用。
- 测试：R267a 重写（标题 + 按钮同行、一项一行带前缀、没有 ×、施术在前管理在后、切换分页勾还在、空状态）。提前使用的括号写法没有真实管理项目数据的单测，只验证了替换逻辑（夹具里没有带建议日期的在韩持有管理项目）。
- 我的判断（未经确认）：① 提前使用说明的括号只改汇总区，到院卡行里的写法不变；② 数量加减保留。

## CMD-1109-15 补充（2026-11-09，追加；取代 CMD-1109-14 里汇总区「【施术项目】前缀、没有勾选框」和「增加项目」弹窗旧排法，旧文字保留作历史）
- 分支 **V4**，代码提交 8c1353a，文档另一个提交；不推送不合并；**只改画面，数据版本不变（61）**。
- **汇总区**（kr.js `krTodayPickBar`）：每行 = 勾选框（默认勾着；拿掉勾 = `krTpToggle` 取消这一项，这一行消失、上面列表的勾同步）+ 小标签［施术项目］/［管理项目］（`status-pill`，施术在前）+ 名字 + 同一行「（建议 MM/DD 起，今天提前使用）」灰色小字加括号（`krEarlyHint` 去掉 display:block）；每行上下 7px。标题 / 按钮 / 空状态照 1109-13 / 14，没有 ×。
- **「增加项目」弹窗**（`krAddChooser` 非 sc 分支 + `krMgRowsHtml` + 新 `krChSelRow`）：左边每项两行（第一行名字 + 最右［加入］［赠送］；第二行规格下拉｜面议单价｜份数 + 最右「价格：₩X」；项目之间分隔线；分类小标题和搜索框照旧）；右边「增加项目（N）」「赠送项目（N）」两块，每项第一行「名字｜规格 × 份数（共 N 次）」+ 金额 + ×（移除），第二行灰色小字「（术后第 N 天开始 · 间隔 N 天 · 管理）」（`mgSugText`）；赠送项目金额写 ₩0；没有就居中灰字「目前没有增加项目」「目前没有赠送项目」；拿掉「已选（和结算一起）」「还没有选项目」「서비스（赠送）…」和绿色「管理（收费）」标签。最下面的说明 + 合计 + ［取消］［确认添加（N）］本来就是这个排法。补加推荐项目（sk=sc）的版面没动。
- **卷动位置**：kr.js 末尾给 `krRenderCaseDetail` 包一层——重画前记下所有 `.kr-ch-scroll` 和「增加项目」弹窗 `.modal-box` 的 scrollTop，重画后还原（改规格 / 份数 / 加入 / 移除都会整页重画）；搜索框 `krChQ` 本来只更新列表 innerHTML，不重画整页，所以不丢焦点。IN 端：data.js 末尾给 `lmBuyModalRender`（本地选购单独弹窗 #lm-buy-overlay）和 `inleRender`（嵌在「添加本地管理」弹窗 #in-localentry-overlay 里的选购）同样包一层还原 `.modal-box` 卷动。**IN 端其他选购画面**（赴韩方案选项目 `projectPickerHtml`、本地案件的选购页、活动价 / 套餐选择）是案件页里的整页内容，不是弹窗，卷动由整页重画决定，这次没动。
- 测试：R267a 重写（勾选框 + 小标签 + 取消勾同步 + 行距）；新增 R268a（弹窗两行 / 右边两块 / 空状态 / 无韩文 / 加入与 × / 改份数后卷动不变）；R67a「只勾其中一笔」只数项目列表里的勾选框（汇总区的不算）。
- 我的判断（未经确认）：① 右边新排法也用在 Step 2 / 3-2 / 3-3 的添加项目（和弹窗是同一个函数，施术项目的右边渲染不变）；② 管理项目第二行灰字里没有开始时间 / 间隔时只写「（管理）」；③ 卷动位置测试在列表不够长时会跳过。

## CMD-1109-16 补充（2026-11-09，追加；取代 CMD-1109-15 里汇总区「次数加减跟在名字后面」，旧文字保留作历史）
- 分支 **V4**，代码提交 696ca62，文档另一个提交；不推送不合并；**只改画面，数据版本不变（61）**。
- 汇总区（kr.js `krTodayPickBar`）剩余次数 > 1 的管理项目：顺序 勾选框 → 标签 → 名字 →（灰字说明）→ 那一行最右「− N + 次」；`krQtyStepper(c, it, {right:true, unit:'次'})` 新增可选参数（`margin-left:auto` 靠右 + 单位）；上限 = 剩余次数（扣掉已安排的）、下限 1；剩 1 次不出现。到院卡行里的数量加减（`krQtyStepper` 不带参数）不变。名字列 `flex:1`，所以有加减和没有加减的行名字起始位置一致。
- 测试：新增 R269a（KM1，pcStage 夹具）。全套里 R269a 缺夹具而失败（和其他夹具用例一样），带夹具单跑通过。

## CMD-1109-17 补充（2026-11-09，追加；取代 CMD-1020-03 里弹窗「管理项目这次约几次（− N +）」、CMD-1028-12 / 1028-14 里需要处理区和保留卡的写法，旧文字保留作历史）
- 分支 **V4**，代码提交 0b0d720，文档另一个提交；不推送不合并；**只改画面，数据版本不变（61）**。
- **多次管理项目剩几次列几行**（kr.js `krCbOpen` / `krCbMgRows`）：每次一行、各自有日期（`krMgSuggest`：第一次未用 = 术后第 N 天开始，之后每次 + 间隔，已用 / 已约后从实际日期起算，逻辑没改）；拿掉「管理项目这次约几次」卡（`krCbMgQty` 留着没入口）和最下面按日期的整理卡（`krCbPreview` 留着不显示）。**「第几次」算法** = 已用 + 已约 + 今天选进到院 + 1（`krCbMgItems` 新增 `nth0` = holdUsed + holdItemPlanned + holdItemTodayPicked，`total` = 总次数，`sched` = `mgSugText`）；总次数 > 1 才写「（第 N 次）」。**其他显示「第几次」的地方**：弹窗普通行 / 需要处理区 / 离境冲突处理窗里的管理项目名（data.js 离境冲突窗口原来用 `n0+1`，同样改成 `nth0+n0+1`）；保留卡不写第几次；打印行程单（`printPlanSchedule`）写「第 k+1/总数 次」本来就是绝对序号，没改。
- **需要处理区**：标题「需要处理 N 项」+ 一行说明「* 客人将于 MM/DD HH:mm 离境，按常规时间安排无法完成以下项目预约，请确认如何调整。」（有离境类问题时；只有休诊 / 营业时间 / 院长冲突时写「以下项目按现在的日期 / 时间不能约」）；每项两行：第一行 标签 + 名字（第 N 次）+ 灰字括号（推荐内容：术后第 X 天开始 · 间隔 Y 天；院长操作 N 分钟放同一括号）+ 最右「推荐预约日期：YYYY-MM-DD」；第二行最右「更改日期［日期］｜保留项目」；没有勾选框，离境类的行内红字去掉（别的类型的红字保留）；时间类问题多一个「改时间」下拉。改到行程内 → 自动移到那天的组并勾上；保留项目 = 先不约；全部处理完才能确认（逻辑没改）。
- **保留卡**：标题「保留（N）」，N = 项目数；同一行最右灰字「* 本次暂不使用，保留至下次访韩时使用。」；一个项目一行「名字（N 次）」，最右［取消保留］（新函数 `krCbKeepGroup`：这个项目保留的几次一起回去）；保留后的处理（`coreKeepUnits`、不进未安排预约、不生成待办）没动。
- **同一天两次**：第 2、3 次改成同一天不挡，在那一天的组里列两行（各自一行、各自有「第 N 次」）；没有「同一项同一天只能一次」的拦截（`coreUnitBookUse` 本来就没有，按两次建两行预约，同一天同地点合成一次到院）。
- 测试：新增 R270a（KM1，pcStage 夹具）；R144b 里两处 `!ov.querySelector('.krcb-prob')` 改成只看这一行的 `krCbCheck`（多次项目列满后别的行可能在红框里）。
- 我的判断（未经确认）：① 弹窗打开时多次项目所有剩余次数都默认勾选（原来默认 1 次）；② 术后管理的「推荐内容」写「术后第 N 天 · 施术名」；③ 需要处理区没有离境类问题时的说明文字是我写的。

## CMD-1109-18 补充（2026-11-09，追加；取代 CMD-1021-04 / 1015-22 里「进行项目表六栏」和 CMD-1109-12～16 里项目卡三分页的栏位，旧文字保留作历史）
- 分支 **V4**，代码提交 0d428f8，文档另一个提交；不推送不合并；**数据版本不变（61）**，没有新字段（只有今日取消施术时给项目写 `rebookWait.memo`）。
- **进行项目表四栏**（kr.js `krTblHead(mode)` / `KR_TBL_COLS4` / `krTblRow` today 分支 / `krMainRowsHtml` 持有行）：项目类型｜项目｜备注（输入）｜操作；today 模式拿掉「地点」「状态」两栏（完成 / 待付款 / 待确认麻醉同意书的状态字写在操作栏前面）；管理项目名后面只写今天做几次「（N 次）」，拿掉加减、「剩 N / 共 M 次」、「建议…今天提前使用」和［今日取消］（持有行的 `krQtyStepper` / `krEarlyHint`、行内 `krRowQtyStepper`）；booked / done 模式仍是六栏。整体备注区另一个提交 b04104e：标题「整体备注：」、拿掉「存了之后还可以再改…」说明、［保存］在最右（离院 / 关账后不能改的规则照旧）。
- **项目卡三分页**：`krPcGrid` 与 `krMgGridB` 同一套列宽（项目｜次数｜预约时间｜操作｜其他｜来源）；「预约中」排在最上面（施术：预约中 → 待重新预约 → 未预约；术后管理：预约中 → 未预约 → 保留 → 交给印尼；管理：预约中 → 未预约 → 保留），预约中按预约时间排序，越近越上面，今天写「今日」且排最前（`pushB` / `mBk` + `tdKey` / `tdTxt`）；「其他」没有就写「-」；术后管理预约中那行「查看案件」改「查看方案」（`krViewBtn(key, label)`）。
- **施术项目［今日取消］**（做法：**先不做钱**，用户 11/09 决定）：施术项目分页今天那行（已到院 + 尾款已付 + 还没做完）操作栏［今日取消］→ 弹窗 `#kr-stc-overlay`，**原因必填**（红字挡住）→ `coreSurgTodayCancel(c, name, reason, by)`：这项施术从今天拿掉（`deferUse`，预约使用行直接删除）并标 `rebookWait = {reason:'今日取消', memo:原因}`（项目卡「待重新预约」），Timeline「今日取消施术：X；原因：…（退回待重新预约，不退款、不动定金 / 尾款）」；**不退款也不动定金 / 尾款**，要退款请走到院评估「项目有变动」。
- **管理项目保留**（`krMgGridK` / `krMgRowK` / `krMgSecK`）：项目｜次数（保留了几次「N 次」，不写「保留 2 / 共 3 次」）｜建议时间｜购买时间｜操作｜来源，拿掉「建议日期」栏和［取消保留］；操作 = ［今日进行］［预约时间］。**今天已经排了同一项也可以再按［今日进行］**（同一天做两次 = 量加倍）：`useBtns0` 不再因「今天已排」灰掉（只在剩余次数 − 今天已排 ≤ 0 时灰），`krUnitUseNow` 的次数选择上限扣掉今天已排，`coreUnitUseNow0` 判断「按之前已排进今天」（`wasPicked`）→ `mainDayAddMgmt(..., {additive:true})` 把次数加上去（上限 = 剩余）。
- 测试：新增 R271a（KM1，pcStage 夹具）；R125b「预约中表头没有建议时间」改成只看预约中那一段（预约中现在在未预约前面）。
- 我的判断（未经确认）：① 施术［今日取消］只在已到院且尾款已付清后出现（尾款前走到院评估）；② 其他栏空白统一写「-」（含未预约行）；③ 术后管理的［今日取消］没有加（任务只写施术）；④ 整体备注的［保存］放最右时，「✓ 已保存 …」小字放在它左边。

## CMD-1109-19 补充（2026-11-09，追加；取代 CMD-1109-18 里项目卡「施术项目｜术后管理｜管理项目 + 已完成」分页、CMD-1027-09 / 1028-13 里 IN 术后管理 tab 的胶囊和 IN 管理项目 tab 的旧排法，旧文字保留作历史）
- 分支 **V4**，代码见 git log（`CMD-1109-19`，在 1109-18 之后），文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面。
- **一 KR 按钮统一小尺寸**：`krBtn` / `krOutBtn` 和进行项目表里手写的 `btn-outline`（修改时间 / 备注 / 本次不做）统一 `padding:5px 12px;font-size:12px;border-radius:8px`（同 `.sd-btn`）；主要动作深色、其他描边不变。
- **二 IN 三个 tab 卡片间距 12px**：赴韩施术 / 术后管理 / 管理项目的内容包进 `.in-tabstack`（app.css，gap 12、里面的 `.card` 不再带 margin-bottom），相关子案件 / 日程 / 项目卡 / 备注之间都是 12px；IN 项目卡去掉固定高度（原来 `kr-pc-scroll` 287px）。
- **三 IN 项目卡三分页**（`inProjectCardHtml`）：施术项目｜术后管理｜管理项目（0 的分页不显示；原「已完成」分页拿掉，做完的施术项目并进施术项目分页）。术后管理分页 `in19CareCardPage`：每个预约时间一张二级 card（`inL2`，标题时间 + 最右［查看案件］，栏位 项目｜施术项目｜推荐内容｜地点｜来源），没预约的放最后一张「未预约」，已完成的组标「已完成」；管理项目分页 `inMgmtL2Cards`：二级 card 预约中 / 未预约 / 保留，栏位 项目｜次数｜状态｜预约时间｜来源，次数 = 这一行的次数。来源：术后管理 = 方案内含 / 在韩增加（`pcmModel` 新增 `src`），管理项目 = 印尼购买 / 在韩购买（照实际资料）。
- **四 IN 术后管理 tab**（`pcmInHtml`，`pcmHtml(c,'IN')` 转调；KR 页面照旧）：两张一级 card「术后管理 · 韩国」「术后管理 · 印尼」，里面每个预约时间一张二级 card（栏位 项目｜施术项目｜推荐内容｜来源）；印尼的已预约行保留［修改时间］、未预约放「未预约」二级 card（保留预约入口）；韩国只读（未预约 / 保留也列出但没有按钮）；哪边没有就居中灰字「目前没有…」；拿掉「免费、不显示价格…」长说明和「在韩术后｜印尼术后」胶囊。
- **五 IN 管理项目 tab**（`inMgmtTabHtml` 重写）：一级 card「在韩管理」：二级 card 预约中 / 未预约 / 保留 / 已使用（栏位 项目｜次数｜状态｜预约时间｜来源；已使用 项目｜次数｜状态｜使用时间）；一级 card「印尼本地管理」：持有中（N）栏位 项目｜剩余 / 总次数｜购买日期｜来源，「3 / 3」写法，**总次数只有 1 次的批次没有 ▸**；用完 / 已退款的放在同一张一级 card 里的二级 card「已完成」。拿掉两张大卡的长说明。
- **我的判断（未经确认）**：① 任务只列了预约中 / 保留 / 已使用，我另加了「未预约」二级 card（付定金还没付尾款、待付款、没约的管理项目，免得这些行看不到）；② 项目卡里已完成的施术项目并进「施术项目」分页（任务没提已完成）；③ 项目卡术后管理分页的已完成组、IN 术后管理 tab 的已完成组按完成日期放在最后；④ 项目卡术后管理的［修改时间］不放（只在 IN 术后管理 tab 的印尼二级 card 里）。
- 测试：selftest 新增 R272a（A1，pcStage 夹具）；R118a 断言改前 → 改后：「约了的出现『预约中』分组标题」→「约了的变成按预约时间的二级 card（印尼的有［修改时间］）」。回归对照 1109-18：A1 全套失败集合一致、KM1 全套只多 R272a（A1 专用用例）。

## CMD-1109-20 补充（2026-11-09，追加；取代 CMD-1027-03 里项目卡管理项目今天那行［本次不做］的叫法，旧文字保留作历史）
- 分支 **V4**，数据版本不变（61），只改画面。KR：项目卡「管理项目」今天已排进今日进行的那行按钮［本次不做］→［今日取消］（`krBtn` → `krOutBtn`，描边、padding 5×12，同施术分页的［今日取消］）；确认弹窗标题「本次不做」→「今日取消」（文字「今天不做「X」？」）；进行项目表里术后管理等行的同名按钮一起改。点了的动作不变（`coreTodayCancel`），Timeline 新记录本来就写「今日取消：…」；旧 Timeline 不改。**没改**：IN 子案件页术后管理的［本次不做］（`careNotToday`，IN 的另一件事，退回未预约）。
- IN 补「查看案件」：① IN 管理项目 tab → 在韩管理 → 预约中栏位 项目｜次数｜状态｜预约时间｜其他｜来源，「其他」= 下划线链接「查看案件」（`in19ViewLink`，打开这个日期的韩国子案件，找不到写「—」；保留 / 已使用 / 项目卡里的管理项目分页不动，`inMgmtL2Cards` 新增第 4 参数）；② IN 赴韩施术项目卡·施术项目栏位 预约时间｜项目｜次数｜备注｜其他｜来源。
- 测试：新增 R273a（KM1 + A1，pcStage 夹具）；旧断言改前 → 改后：「管理项目 → ［本次不做］」→「［今日取消］」（两处），R146a「画面上没有『今日取消』字样」→「没有『本次不做』字样」。回归：A1 / KM1 全套失败集合与基线一致。

## CMD-1109-21 补充（2026-11-09，追加；取代 CMD-1109-19 里项目卡术后管理分页「韩国 + 印尼一起放」和 CMD-1109-02 里施术日期框「（韩国时间）印尼时间 HH:mm」写法，旧文字保留作历史）
- 分支 **V4**，数据版本不变（61），只改画面。
- **项目卡术后管理分页只放在韩国处理的**（`in19CareCardPage`）：预约中 / 保留 / 已完成只取 `place==='KR'`；分配到印尼的（`place==='IN'`，地点由 KR 预约时选「回印尼做」、或改回印尼后记在行上）不显示（在「术后管理」tab 的印尼卡里看）；「未预约」只放 地点未定（`pcmModel` 新增 `pl`，`either` = 韩国或印尼还没分配）→ 地点栏写「-」、韩国没约 → 「韩国」；没有就不显示；分页数字只算显示的。术后管理 tab 不变。
- **时间写法**（`in21Time` / `in19When`）：韩国时间为主、印尼时间灰色小字（`.sd-tag`，跨天带日期）。项目卡：施术项目预约时间 / 术后管理二级 card 标题 / 管理项目预约时间一律「MM/DD HH:mm（韩国）」，今天「今日 HH:mm（韩国）」（以前施术项目换成印尼时间、没标时区）；术后管理标题按所在地标（韩国）/（印尼）。赴韩日程卡：到达日 / 离境日「YYYY-MM-DD HH:mm（韩国） 印尼 HH:mm」+ 机场；施术日期（已确认 / 改期 / 已到院 / 原定）「YYYY-MM-DD HH:mm（韩国） 印尼 HH:mm」，今天「今日（…）」；已到院那行字号 13px（原 15px 粗体）。**没改**：`ksTimeText`（待办 / 通知 / 客户页等用的旧写法）。
- 测试：新增 R274a（A1，pcStage 夹具）；R256a / R257a 断言改前 → 改后：「（韩国时间）…印尼时间 HH:mm」→「（韩国） 印尼 HH:mm」。回归：A1 / KM1 全套失败集合与基线一致（KM1 只多 A1 专用的 R274a）。

## CMD-1109-22 补充（2026-11-09，追加；取代 CMD-1109-20 里「项目卡的管理项目分页不动」，旧文字保留作历史）
- 分支 **V4**，数据版本不变（61），只改画面。IN「赴韩施术」tab 项目卡「管理项目」分页的「预约中」加「其他：查看案件」（`inProjectCardHtml` 里 `inMgmtL2Cards(..., true)`，栏位 项目｜次数｜状态｜预约时间｜其他｜来源，保留 / 未预约不加）；预约时间写法 1109-21 已经是「今日 14:00（韩国）」「04/13 11:00（韩国）」，管理项目 tab 同一个函数，不用再改。测试：R273a 断言改前 → 改后「项目卡管理项目分页没有『其他』栏」→「有『其他：查看案件』」；A1 全套失败集合与基线一致。

## CMD-1109-23 补充（2026-11-09，追加；取代 CMD-1019-23 里持有项目行「撤回完成」文字链接和 CMD-1109-18 里管理项目行做完后备注只读，旧文字保留作历史）
- 分支 **V4**，数据版本不变（61），不涉及钱。KR 施术当天「进行项目」表（`krTblRow` / `krMainRowsHtml`）所有类型一样：没做 → ［操作完成］；做完 → 绿字「已完成」+ 描边小按钮［撤回完成］（`krOutBtn`），拿掉灰掉的［操作完成］和文字链接。撤回只在**客人离院之前**（`krUndoOk` = `krCan()` 且 `undoDeny` 为假：`c.visitClosed` / 主到院 `krProcedureDone` / 该到院已结束 / 00:00 关账都拒绝；核心 `coreMgmtUseUndo` / `coreUseRowUndo` 也加了同一道拒绝）；撤回后回到待做，Timeline 记「撤回完成：…（回到待做）」。
- **施术撤回退回了什么**（新增 `coreSurgItemUndo`：施术一行里的单个项目；`coreRowUndo`：在韩加的施术项目 / 术后管理记录 / 重新预约的施术，持有项目使用行转调原来的 `coreUseRowUndo`）：项目 `done` / `doneAt`、行 `done` / `doneAt` / `doneBy` / `doneItems`、`c.endAsk`（「今天的项目都做完了吗」提示）、Timeline。**没有碰钱**，也**没有要退回的术后管理预约 / 待办**：施术标完成时本来就不生成它们（术后管理预约是按预约时间另外约的，进入术后管理阶段要等［客人已离院］），所以没遇到「已有预约处理不干净」的情况。
- **备注栏**：管理项目行（持有项目，`krMainRowsHtml`）做完之后备注输入框还在（存 `it.todayNote`，`coreItemNote`），客人离院 / 关账后变只读（有内容写内容，没有「—」）；施术 / 术后管理行本来就是这样。
- 测试：新增 R275a（KM1，pcStage 夹具）；旧断言改前 → 改后：R179b「另一个项目仍可操作（灰掉的［操作完成］）」→ 接受「已完成 / 撤回完成」（夹具里项目已做完，且该到院已 00:00 关账所以没有撤回按钮）、R73a「完成后备注只读显示」→「备注输入框还在」。回归：A1 全套失败集合与基线一致（多出的 R275a 是 KM1 专用），KM1 全套一致。

## CMD-1110-04 补充（2026-11-10，追加；旧文字保留作历史）
- 分支 **V5**，代码提交 d7334be；不推送不合并；**数据版本不变（61）**，只改画面和文案。
- **面诊录入［AI 整理］**：查明——面诊（一般面诊）的「录入内容」院长和室长代录**都没有**这个按钮（不是录音中暂藏；复诊评估的 `krRvWorkBlock` 本来就有，两种身份都有）。现在 `krGcEvalBlock` 的录入内容下面有［✨ AI 整理（演示）］→ `krGcAiOrganize()`：把输入框里的字按句 / 按行整理成「· 条目」（正式版接 LLM），第一次整理时把原文留在 `consultEval.recRaw`，Timeline 记「AI 整理：面诊录入内容（演示）」，已整理过再按不重复；录音中按会先停止录音。
- **推荐项目备注**：院长 / 室长选推荐项目每行（施术、管理项目，含项目库侧栏之外的几处同类输入框）提示字「请输入备注内容」；输入框 + 右边［查看备注（N）］排版放得下。
- **「整体备注」→「方案备注」**：KR 录入画面（推荐项目整理下面的输入）、室长发送画面、IN 收到的诊疗方案 / 推荐项目整理（`recSummaryHtml`）、IN 选项目页的「KR室长方案备注」；存放仍是 `overall` / `krScope.overallNote`。**没改**：结算区的 `noteOverall`（整体备注（KR + IN 可见））和来访备注。
- 测试：新增 R280a（KD1）/ R280b（KM1），R245a 的备注提示断言更新。

## CMD-1110-05 补充（2026-11-10，追加；取代 CMD-1105-07 前后本地管理卡的「全部完成」和「继续」入口，旧文字保留作历史）
- 分支 **V5**，数据版本不变（61），只改画面。IN 本地管理卡（`mgmtActiveHtml`）：拿掉［全部完成］、说明文字「每一行点…不是退款」、「同一次到店里还可以：［继续使用持有项目］［继续选购项目］」整行，只剩逐行［完成］［取消］（备注框、使用次数、状态、按钮同一行）；`mgmtComplete` 函数留着（旧测试直接调用），界面没有入口。
- 页头［+ 添加本地管理］（`inLocalEntry`：使用持有 / 购买新项目）是统一入口，出现条件 = `inHeaderLocalOk(c)`（和 `renderCaseHeaderActions` 的 `lmOkCase` 同一个判断：子记录，或不是纯本地的面诊 / 赴韩案件）；这类案件的已完成项目列表（`localCarriedDoneHtml` / `localMgmtBody`）里的［继续选购］［继续使用持有项目］也一起拿掉。**纯本地案件（页头没有该按钮）保留「继续」那一行**，免得没有入口。持有项目都完成 →「客人是否已离店？」不变。
- 测试：新增 R281a；A1 全套对照基准失败集合完全一致。

## CMD-1110-06 补充（2026-11-10，追加；取代 CMD-1109-01 / 1106-17 里「赴韩日程」卡里的「行程」段、CMD-1109-25 在施术前 7 天确认行程窗口里的［发送行程提醒给客人］、CMD-1109-11 的发送状态写法，旧文字保留作历史）
- 分支 **V5**，代码提交 9a73dc2；不推送不合并；**数据版本不变（61）**，没有新字段（新增可空字段 `c.informLast`，旧资料按 `surgeryMsg` / `tripRemindMsg` 推算）。
- **页头第三行**（data.js `inTripHeaderRowHtml`，ui.js `renderCaseSubtitle` 调用；只有赴韩案件、主案件页）：「在韩行程：MM/DD HH:mm（机场）印尼灰字 ～ …」+ 离境日不够 / 年份存错的红字 + ［行程变动］（= `openStayModal`，弹窗里有行程状态已定 / 暂定和到达 / 离开）。待递交时递交画面（`tripStateBlockHtml`）里直接填行程的写法**保留**，页头也同步显示。
- **施术日期卡**（`krProcedureTabMain`）：标题「施术日期」，［打印］在标题最右；已递交之后不再有「行程」段（待递交时仍有行程状态单选 + 到达 / 离开输入）。**「施术项目（N）」**（`inProjectCardHtml` 默认 kind）：只列施术，拿掉三个分页；术后管理 / 管理项目只在自己的 tab。tab 标记 `flowMarkOf(c,'kr')`：施术项目都做完或取消 → ✓，否则 ●（原：韩国行程结束才 ✓）。
- **［发送信息给客人］**（calalign.js `openSurgMsg(id, pre)` / `surgMsgRender` / `surgMsgToggle` / `confirmSurgMsg`）：两项可勾——「施术日期与到院地址」（`surgCanNotice`：KR 确认施术时间后）、「行程与天气」（`surgCanTrip`：行程已定且到达 / 离开日期时间填全；内容和天气 = 1109-25 的 `tripRemindText` / `weatherFetch`）；都勾合成一则，预览可改，短信 / WhatsApp；`pre='date'|'trip'` 从待办进来先勾对应项；发送后写 `c.surgeryMsg`（含施术日期）/ `c.tripRemindMsg`（含行程，key = `tripRemindKey(c.stay)`）/ `c.informLast = {at, method, kinds}`；状态显示「MM/DD 已通知客人（施术日期 · 行程）」+ 下划线「再次发送」；记短信发送记录（含施术日期 = 施术日期通知，只有行程 = 行程提醒）+ Timeline。**确认行程窗口里的［发送行程提醒给客人］整块拿掉**（`stayRemindHtml` / `openTripRemind` 函数留着没入口）。
- **两个 IN 待办**（todo.js `inTodoItems`）：① `relay`「发送施术日期信息给客人」——`scheduleState==='Confirmed' && !surgMsgSent(c)`（KR 确认含改期确认后；再改时间 `surgInformKey` 对不上就再出现）；② `tripremind`「发送行程提醒给客人」——Confirmed、没到院、`surgCanTrip`、离施术日 ≤ `TRIP_CONFIRM_DAYS`（7 天）、`!tripInformed(c)`（发出含行程的信息后 key 对上就消失；之后改行程 key 变了 → 再出现，写「行程已改，请重新通知客人」）。点待办 = 打开同一个弹窗，对应项先勾好。旧资料：已有发送记录且 key 对得上的不补出待办。
- **当前状态卡**（IN `renderCaseStatusBar0`，KR `krMainStatusBar`）：上下间距缩小；［查看］［查看内容］= 下划线文字；第二行：今天有到访且还没结束 →「今日到访（…）状态」；今天的到访已结束或今天没有 →「下一个预约：MM/DD HH:mm（韩国）· 名称 编号」（［查看内容］跳到那个子案件；KR 看不到印尼的天就没有按钮），没有写「下一个预约：—」；右边灰字「待预约：…」照旧（IN 另有下划线［预约］，KR 无下一个预约时仍有［预约时间］）。今日到访的名称沿用原 `mainDayBiz` / `krMainDayTypes`（「赴韩项目」写法），只有「下一个预约」用 `dayNameOf`（子案件名称）。
- 测试：新增 R282a（IN）/ R282b（KR）；14 个旧断言跟着改（发送状态文字「已通知客人（施术日期）」、tab 标记、「下一个预约」、卡片标题「施术日期」、行程搬到页头）。
- **测试工具提示**：在同一个隔离端口反复跑很多 KR 用例后，该端口的 KR 页面可能一打开就卡死（用 git stash 退回基准代码一样卡，所以不是这次改动；原因是某个用例留下的存档状态）；换新端口 + 新分页即可，不要在卡住的分页里重载。

## CMD-1110-07 补充（2026-11-10，追加；取代 CMD-1109-19 四里 IN 术后管理 tab 的「韩国 / 印尼两张一级卡、印尼卡里有未预约」排法，旧文字保留作历史）
- 分支 **V5**，数据版本不变（61），只改画面。
- **术后管理 tab 顺序**（IN，`pcmInHtml(c, M, part)`）：① 红框「待预约（N）」（`part='pending'`，`#in-care-pending`：印尼没预约的术后管理，每行［预约时间］，红字 + 红框用设计系统状态红 `--feedback-error-fg`，都约完整块不显示）② 相关子案件 ③ 术后管理 · 韩国（韩国未预约留在这里、不标红）④ 术后管理 · 印尼（`part='main'`，只剩保留 / 已预约 / 已完成；只有待预约、没有已预约时这张卡不画）。案件页分三段调（`caseTabContentHtml` 的 postcare 分支）；`pcmHtml(c,'IN')` 不传 part = 三块连在一起（旧测试用）。
- **页头**：［对话］（`#case-chat-actions`）`align-self:flex-start`，和页头第一行齐平、靠最右（原 flex-end 在第二行）；［行程变动］紧贴在行程文字后面（和 KR 页头「在韩行程：… ［行程修正］」同样间距），红字在按钮后面。
- 测试：新增 R283a（A1，pcStage 夹具，要在干净数据上先跑）；因 06 / 07 改动更新的旧断言：R118a R247a R249a R272a R273a R59a R159a。**注意**：依赖夹具的旧用例（R154a R58a R71a R163a 等）在整套里本来就失败（基准也一样），要在新端口 + 夹具上单独跑；A1 全套跑完后同一端口的 KR 页面会卡死（测试遗留状态，与改动无关），KR 批次要用另一个新端口。

## CMD-1110-08 补充（2026-11-10，追加；取代 CMD-1110-05 里「纯本地案件保留『继续』行」、CMD-1110-02 判断③「备注内容 tab 只在升级后的主案件」、CMD-1110-04 判断③「结算区整体备注不改名」，旧文字保留作历史）
- 分支 **V5**，数据版本不变（61）；新增可空字段 `HOSPITAL_DATA[h].city` / `_cityDemo`（没有就退回时区对应的城市，不需要迁移）。
- **纯本地案件页头［+ 添加本地管理］**：`inHeaderLocalOk(c)` 对纯本地案件（`pureLocalMain`：不是子记录、`isLocalCase`）= `c.mgmtActive && !isEnded(c)`（「本地管理进行中」，有逐行完成的卡片）；还没开始时（「是否使用持有项目？」清单自带［新增项目］［本次不使用］［使用项目］）和已结束时页头不放，避免两处入口重复。`mgmtActiveHtml` 的「继续」行对它也拿掉。**重复清单问题的处理**：纯本地案件走自己的 main 流程——页头按钮 → `inLocalEntryMain` 小弹窗（使用持有项目 / 购买新项目；没有持有时前者灰掉）→ `inLocalEntryMainGo` → 原来的 `setMgmtAdd('main', …)` / `usePrevBuy()`，回到本案件页里已有的「是否使用持有项目？」清单 / 本地选购画面；**不会像其他案件那样另建 `c.localMgmt`**，所以同一案件里不会出现两套（main + lm）购买 / 使用清单。`inLocalEntry` 对纯本地案件直接转到这个小弹窗。
- **未升级的一般案件也有「备注内容」tab**（`caseTabListOf`，需基础资料已确认）：顺序 基础资料｜面诊｜本地项目｜**备注内容**｜结算｜附件｜Timeline；升级后：基础资料｜面诊｜施术项目｜术后管理｜管理项目｜备注内容｜子案件｜项目汇总｜结算｜附件｜Timeline。内容 / 格式同 1110-02（项目备注 / 来访备注，`mainNotesTabHtml`，本案件 `mgmtUses` 的备注看得到）。
- **「整体备注（KR + IN 可见）」→「结算备注」**：结算区 `settlementBigCardHtml` 的备注栏和已结束案件的显示；字段仍是 `c.noteOverall`。（推荐项目下面的「方案备注」是 1110-04 改的，不是这个。）
- **医院设定「城市」**：KR 医院设定「英文名称 / 英文地址 / 韩文地址」卡里加「城市」输入；存 `HOSPITAL_DATA[h].city`；`hospitalCity(hid)` 读它（行程提醒的天气用），空 = 退回医院时区对应的城市（首尔）；演示医院首次读取时补「首尔」；保存记操作日志 + KR-14 通知（含城市改动）。
- 测试：新增 R284a；R281a / R182a / R118a 的旧断言随之更新（页头有按钮、没有「继续」行、tab 列表含备注内容）。

## CMD-1110-09 补充（2026-11-10，追加；取代 CMD-1110-02 的「备注内容 tab 上下两块 a. 项目备注 / b. 来访备注」、CMD-1110-06 / 07 里 IN 页头的［行程变动］按钮名，旧文字保留作历史）
- 分支 **V5**，数据版本不变（61），只改画面。
- **备注内容左右分页**（`notesTabHtml`，主案件 / 客户管理、IN / KR 共用，未升级的一般案件同）：分页按钮「项目备注（N）｜来访备注（N）」（样式同项目卡分页胶囊），默认项目备注，点击 `notesPage(key, k)` 重画；内容 / 格式不变；0 条的分页照样可点，里面居中灰字「没有项目备注」/「没有来访备注」。当前分页记在 `notesTabHtml.pg[viewer:页面:案件或客人]`（界面状态，不存档）。
- **IN 页头［行程变动］→［行程修正］**：`inTripHeaderRowHtml` 的按钮改名，尺寸 = KR 页头 `krTripRowHtml` 的［行程修正］（`btn-outline` + `padding:3px 10px;font-size:12px`）；功能不变（`openStayModal`，IN 的「在韩行程」弹窗）。画面上同指这个按钮的地方一起改：红字旁的按钮（`tripRedHtml`）、发送弹窗里「先在页头［行程修正］里填好」提示、旧的卡片按钮文字。**留着不改**：Timeline / 通知 / 待办里「行程变动：…」（是事件描述不是按钮）、施术变动里自动带的理由「行程变动」、［施术变动］按钮。
- **备注时间照 5-19**（`noteTimeHtml(at, role)`）：IN 页面上 KR 写的备注（项目备注 / 来访备注）以韩国时间为主「MM/DD HH:mm（韩国） 印尼 hh:mm」（日期不同时印尼带日期）；IN 自己写的、以及 KR 页面看的照旧（页面时区）。用在：备注卡 / 查看全部（`caseNotesListHtml`）、备注内容 tab、「查看备注（N）」展开（KR 写的带时间，IN 写的仍是 MM-DD）、施术那天子案件页的来访备注卡。
- **当前状态卡**（IN `renderCaseStatusBar0` 的 `lk`、KR `krMainStatusBar` 的 `btn`）：［查看］［查看内容］和「待预约 … 预约」改 12px（小一号）、品牌棕 `var(--terracotta)`、仍下划线。
- 测试：新增 R285a；10 个旧断言跟着改（行程变动 → 行程修正、a/b 两段 → 分页、MM-DD → 日期）。

## CMD-1110-10 补充（2026-11-10，追加；取代 CMD-1105-07 / 1110-02 里本地管理卡「一行一行：名称 + 备注框 + 使用 N 次 + 状态 + 按钮」的排法，旧文字保留作历史）
- 分支 **V5**，数据版本不变（61），只改画面 + 一个读取函数。
- **本地管理卡改表格**（data.js `localMgmtTableHtml(c, rows, ro)`，排法同「在韩管理」：标题行 + 外框 `inSmallCard` + 行间分隔线，复用 `in19Th` / `in19Tr`）：项目｜历史施术次数｜备注｜状态｜操作。项目名后面灰字「· 本次 N 次」（原「使用 N 次」）；备注沿用 1110-02 的 `inLocalNoteCell`（按［完成］时存，完成后变文字、点一下回输入框）；状态沿用 `LOCAL_ITEM_COLORS` 标签（进行中 / 已完成 / 已取消）；操作 = 进行中［完成］［取消］（`padding:5px 12px;font-size:12px;border-radius:8px`，和在韩管理同尺寸），已完成 / 已取消空着。用在：`mgmtActiveHtml`（本地项目 tab 的本地管理卡）和子案件页「本地管理」tab 今天用的本地项目（`inContTodayHtml` kind='local'，含已取消的行）。`inContTodayHtml` 不传 kind 的旧写法（今日项目合并卡）没动。
- **历史施术次数怎么算**（`localHistCount(clientName, itemName, exceptRow)`）：数据来源 = 这位客人的全部案件（`CASE_ITEMS` 里同名，含子记录）的 `mgmtUses` / `localMgmt.mgmtUses` 里 `status==='done'` 的 `qty` 合计；**不算今天这一次**（这一行自己，以及 `date` 是今天的使用记录）；项目名按 `clientProjectKey`（去掉「· 规格 / 次数」后缀，和 1110-02「查看备注」同一个匹配）对；已取消的不算；没做过 = 0 次。**正式版后端**：按「客人 + 项目名（去后缀；有项目 id 就按 id）」在本地项目使用记录里查 状态=已完成 且 使用日期 < 今天 的次数合计，一次聚合查询。
- 测试：新增 R286a；R143a（今天用的本地项目的按钮）、R281a（「使用 N 次」）的旧断言跟着改。

## CMD-1110-11 补充（2026-11-10，追加；取代 CMD-1110-06 判断③「今日到访沿用赴韩项目写法」、CMD-1110-09 判断②「查看备注里 KR 写的带完整时间」、CMD-1110-10 判断③「旧合并今日项目卡不改」，旧文字保留作历史）
- 分支 **V5**，数据版本不变（61），只改画面。
- **当前状态卡「今日到访（…）」**（IN `renderCaseStatusBar0`、KR `krMainStatusBar`）：括号里用 `dayNameOf`（和「下一个预约」同一个名称函数，例「施术项目 · 在韩管理」），不再写「赴韩项目」「· 韩国」；IN 的「待确认结束」行也改用 `dayNameOf`（保留「· 韩国」位置标记）。`mainDayBiz` / `krMainDayTypes` 留着，只剩列表里「下一个日程」文字（`nextScheduleText`）等少数地方还在用旧写法。
- **「查看备注（N）」展开**（`viewNotesPanelHtml`）：每行一律「MM-DD 备注内容 查看案件」（`noteMDText(at, role)`：KR 写的用韩国日期 `Asia/Seoul`，IN 写的用诊所时区）；完整时间只留在备注卡和「备注内容」。
- **所有本地管理行都用 `localMgmtTableHtml` 表格**：① 子案件页旧的合并「今日项目」卡（`inContTodayHtml` 不传 kind）——术后管理行仍是原来的「项目类型｜项目｜…」表，本地行拆成下面单独一张「本地管理」表（项目｜历史施术次数｜备注｜状态｜操作）；② 本地管理 tab 的已完成项目列表（`localMgmtTabHtml` 的 `lm.ended`，含增加面诊的本地案件之前做过的）；③ 增加面诊的本地案件的已完成列表（`localCarriedDoneHtml`）；之前 1110-10 已改的：本地管理卡（`mgmtActiveHtml`）和子案件页「本地管理」tab 今天用的本地项目。已搜过、没有同类旧样式的：剩余项目卡（是持有项目清单，不是使用行）、管理项目 tab 的本地管理段（是购买批次表）、项目汇总（汇总表）、结算 tab（结算单）。购买记录行（「购买 … 金额」）不是管理行，没改。
- 测试：新增 R287a；R141a / R144a / R47a 的旧断言（今日到访括号里的名称）跟着改。

## CMD-1110-12 补充（2026-11-10，追加；取代 CMD-1021-07 里到院卡右上「备注：N / 无」、CMD-1021-04 里来访备注标题下的灰色说明行，旧文字保留作历史）
- 分支 **V5**，代码提交 09799c6，文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面和读取，没有新字段。
- **「查看案件」点了没反应的原因**：`viewNotesGo(caseId)` 点击时用 `CASE_ITEMS` 按 id 找案件，找不到就静默 return；KR 页面的案件数组不是来源诊所分区（只有渲染时包在 `Store.withClinic` 里才对），点击时早已不在分区里，所以什么都不发生。现在渲染时就算好：`noteCaseOnclick(c, 诊所)`（data.js）KR 用 `krFindCase(诊所, id)` 判断这一端看不看得到，看得到 → `viewNotesGo('诊所','id')`（KR → `krShowCase`，IN → `openCaseDetail`，子记录的 `openCaseDetail` 就是子案件页），看不到 → `noteCaseLinkHtml` 只显示案件号、不做链接。用在「查看备注（N）」展开（`viewNotesPanelHtml`）和「备注内容」tab 的「来自 A00xxxx」（`notesTabHtml`，KR 客人页从 `openCase` 里取诊所 id）。其他「查看案件 / 来自 A…」链接（`in19ViewLink`、`krViewBtn`、持有项目「来自」、关联案件）原来就带诊所 / 主案件 id，没有同样的问题，未改。
- **KR 今日项目**（`krTblRow`）：操作栏 `KR_TBL_COLS4` 末列 `minmax(200px,auto)` + `flex-wrap:nowrap`，［操作完成］［今日取消］并排；`krVisitMemoHtml` 拿掉标题下的灰色说明行（只留输入框 placeholder，主到院「进行项目」同一个函数）；到院卡右上「备注：N / 无」（`krCaseCardHtml` 的 `noteH`、`krSdStatusBar` 的 `note`）拿掉。
- **预约中按时间排**：已经排好的——KR 项目卡施术 / 管理项目预约中（`sBk` / `mBk`）、KR 到院卡「预约中」组、IN 管理项目预约中（`inMgmtModel`）、IN 术后管理（`pcmGroups`，卡片按日期 + 时间）、项目汇总、子案件 tab。**这次改的**：① KR 项目卡术后管理「预约中」（`careSec`）原来按施术日期排卡，改成按卡里最早预约时间排（卡内本来按时间）；② `pcmGroups` 卡内行按时间排；③ IN 项目卡施术项目列表（`surgList`）按预约日期排。
- **「今天做」**：KR 子案件页头（`kr.js`）和 IN 子案件页头（`data.js`）都改用 `dayNameOf`（「术后管理 · 在韩管理」，空写「—」），不再用「、」连。
- 测试：selftest 新增 R288a（任意分页；KR 部分在 KR 分页里才跑）；R75a 的「备注：N / 无」断言改成「没有」。A1 / KM1 批次对照基线 2781a89：R73a / R75a / R271a 在基线上同样失败（夹具状态相关），其余一致。

## CMD-1110-13 补充（2026-11-10，追加；取代 CMD-1105-07 / 1102-09 / 1021-14 里的按钮叫法［新增项目］［购买其他项目］［增加项目］［+ 追加项目］，旧文字保留作历史）
- 分支 **V5**，代码提交 2536789，文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面和入口。
- **买新的一律叫［+ 购买新项目］**：KR 项目卡右上（`krAddModalOpen`，弹窗标题「购买新项目 · 客人名」）；IN「是否使用持有项目？」（`holdingsUseHtml`）标题行最右［+ 购买新项目］，下面［不使用］［使用］（取代［新增项目］［本次不使用］［使用项目］，功能不变）；IN 本地「已选择 / 结算」卡（`projectListTabHtml` 的 `projectsLocked` 分支）；「这次到店要做什么？」和本地管理入口里的［新增项目］改［购买新项目］；使用之前购买的项目案件「继续」行的［新增项目］改［+ 购买新项目］。**不改**：IN 页头［+ 添加本地管理］、到院评估结算卡「添加项目」、推荐项目［补加］［编辑］、［增加面诊］［加复诊评估］、面诊后选项目、项目库自己的［+ 新增项目］（维护项目库，不是买）。
- **［+ 追加项目］点了没反应的原因**：按钮 `onclick="addMoreProjects()"`，而 `addMoreProjects` 在 CMD-1015-16「付完定金后拿掉 IN 的追加项目」时被删掉了，这个按钮漏删，点了调用不存在的函数。现在按钮挪到卡片标题行右边、改名［+ 购买新项目］，调用新函数 `localBuyNew()`（`c.addingMore = true`，打开 `localPurchaseHtml(c,'main',true)`）；只在本地项目 tab、没有待付款结算单时出现。
- **本地「已选择 / 结算」卡重排**：标题 + 按钮 → 结算单 → 合计 → 结算备注（`settlementCardsHtml(c, {sumLast:true})`）；没有赴韩项目时合计只显示「项目合计」「已付」（`settlementSummaryHtml`，所有用它的地方一致）；本地项目 tab 不再放「✓ 预计 … 出报告」那行面诊进度（只在面诊 tab）。
- **KR 子案件［增加今日项目］改弹窗**（`krDayAddOpen / krDayAddRender / krDayAddConfirm / krDayAddClose`，`#kr-dayadd-overlay`）：弹窗内容 = 项目卡的勾选画面（`krProjCards({pick:true, noCare:true, modal:true})`，已约 / 保留 / 持有，分页同项目卡），勾选后［确认（N）］→ 逐项 `coreUnitUseNow`（院长操作的管理项目带默认院长和时长、不延长）→ 出现在「今日项目」表；弹窗里项目卡右上也有［+ 购买新项目］。页面下方的项目卡不再随按钮展开，改成今天的子案件页一直显示（我的判断：任务写「页面下方的项目卡照旧保留」）。
- 测试：新增 R289a（A1 分页）；R146a 改成弹窗流程；R82a / R182a / 持有项目按钮顺序的断言跟着改文字。回归：IN 批次、KM1 批次对照基线——R138a、R79a、R80a、R82a（备注卡高度）在基线上同样失败，R30b / R53b / R54b 要先在 A1 跑 R30a / R52a（跨账号前置），其余通过。

## CMD-1110-14 补充（2026-11-10，追加；取代 CMD-1110-08「纯本地案件页头按钮只在本地管理进行中」、CMD-1110-13「本地『已选择 / 结算』卡的［+ 购买新项目］」和 CMD-1102-09 / 1029-06 里［不使用］的「客人是否已离店？」弹窗，旧文字保留作历史）
- 分支 **V5**，代码提交 c9121ec，文档另一个提交；不推送不合并；**数据版本不变（61）**，没有新字段，旧资料不用迁移（靠读取规则兜底）。
- **页头按钮固定**（`inHeaderLocalOk`，ui.js `renderCaseHeaderActions`）：来访进行中（没结束 / 没离店 / 没被锁）就一直有［+ 添加本地管理］［客人离店］，纯本地案件也有；［增加面诊］只在案件没有面诊时有；［对话］照旧。
- **tab 跟着实际发生的事**（ui.js `showLocalTab`）：纯本地案件的「本地项目」tab 只在 有持有要用（入口选择时客人有可用持有）/ 正在使用（`mgmtActive`、`mgmtUses`）/ 「是否使用持有项目？」卡在等（`entryChoicePending` + 模式 holdings）/ 主案件内选购进行中（模式 new、`addingMore`、置换 `c.comp`）/ 继续服务 followup / `localAsk` / `addUse` 时出现；没用就没有；买了才有「结算」tab（本来就是）。其他案件（面诊 / 赴韩 / 子案件）规则不变。
- **购买一律弹窗**（data.js `modalBuyOk` = `c.usePrev` 或纯本地）：`usePrevBuyOk / usePrevBuy / holdingsAddNew / chooseProjectEntryMode('new') / localBuyNew / inLocalEntryMainGo('buy')` 对纯本地案件都走 `lm-buy-overlay`，买的记在 `c.localMgmt.batches`；付款后（`lmSettleDo` 的 fromUsePrev 分支）纯本地案件回到「是否使用持有项目？」（`entryChoicePending=true, projectEntryMode='holdings'`），买的先进持有。**本地项目 tab 不再放结算单**：`projectListTabHtml` 的 `projectsLocked` 分支在没有待付款结算单时直接返回 `holdingsUseHtml`（旧资料卡在「已选择 / 结算」或选购画面的从这里回来）；有待付款结算单仍是原来那张卡（［重新选择项目］）。页头［+ 添加本地管理］→ 使用持有（`inLocalEntryMainGo('use')`）会把案件设回「是否使用持有项目？」并切到本地项目 tab。
- **［不使用］**（`notUseThisTime`，ui.js `localLeaveAsk(c,'notuse')`）：纯本地案件先收起卡片（`entryChoicePending=false`，本地项目 tab 随之消失）；没有别的事在进行（`mainlineOngoing` 为假）→ 弹「客人准备离店了吗？」+ 说明 +［还有项目］（关弹窗、来访继续）［客人已离店］（= `autoFinish`，钱没清照旧不结）；有面诊在进行时不弹，只关掉卡片。其他调用 `localLeaveAsk` 的地方（逐行完成的最后一项等）仍是旧弹窗「客人是否已离店？」。
- **Apple A（A002435）卡住的原因**：旧流程里纯本地案件在页内「已选择 / 结算」+ 选购画面（main 流程，`projectsLocked=true`）买东西，付款后结算卡里只有已被删除的 `addMoreProjects`（CMD-1015-16）和重新选择项目，本地项目没有进「使用持有」，页头也没有［+ 添加本地管理］（条件是「本地管理进行中」），所以买了没用、增加面诊后一直停在选购。现在：页头一直有按钮；本地项目 tab 在 `projectsLocked` 且无待付款结算单时回到「是否使用持有项目？」；［+ 添加本地管理］→ 使用持有可回到卡片。
- **Ella E（A001321）本地管理不是表格的原因**：1110-10 只改了本地管理进行中的卡；1110-11 第 3 项把已完成列表（`localMgmtTabHtml` ended / `localCarriedDoneHtml`）和子案件页合并今日项目卡也改成 `localMgmtTableHtml`。这条路（不面诊 → 使用 → 增加面诊）我这次在页面上重走了一遍：使用中的行和增加面诊后的行都是表格（项目｜历史施术次数｜备注｜状态｜操作），所以 1110-11 已经修到，这次没有再改。
- 测试：新增 R290a（A1；走法一～四 + 旧资料）；更新 R86a / R118a / R182a / R208a / R284a 的断言（页头始终有按钮、没用没有本地项目 tab、购买弹窗、新弹窗文字）。CP1 / CP2（置换额度选购）因 `showLocalTab` 初版漏了「主案件内选购进行中」而失败，已补；完整 A1 全套对照基线（HEAD 的代码）失败集合：新增失败只有上面几个有意变化的用例，其余是基线上就失败的跨账号 / 夹具依赖用例。

## CMD-1110-15 补充（2026-11-10，追加；取代 CMD-1110-13 里［增加今日项目］弹窗「已完成分页 / 剩余次数不扣今天已加的」，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1110-15`），文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面 / 弹窗列表筛选。
- **可选次数怎么算**（kr.js `krProjCards0` 的 pickMode 管理项目行）：`left`（持有剩余 − 已排到其他天的预约行）**再减** `mgTodayQty`（今天已经加进「今日项目」表的次数：主到院的 `todayPickMgmt` + 今天的 `useNow` 行，不管做完没）；`availN = left − todayN`，`availN > 0` 才列，行里写「剩 availN / 共 总数 次」；原来的「今天使用 N 次」小字拿掉。例：共 1 次今天已加 1 次 → 不列；共 3 次加了 1 次 → 「剩 2 / 共 3 次」。已做完的次数本来就在 `holdItemLeft` 里扣掉了，不会重复扣。
- **弹窗**（`krProjCards(c, {pick:true, noCare:true, modal:true})`）：不显示「已完成」分页（`nCnt.done=0`，空时写「今天没有还能再加的项目」）、不列「预约中」小节（已加进今天的和排在别天的）；表格去掉「操作」「其他」两栏——`krProjCards` 包了一层设 `KR_PC_MODAL`，`krRowDiv / krHeadDiv` 在把「来源」挪到最后之前先 `krModalTrim`（去掉来源后面的最后两栏，表头和数据行同步）。页面下方的项目卡不受影响（含已完成分页）。
- **今日项目卡标题**：`krVisitWhat` 改成和子案件名称同一个写法（施术→施术项目、管理项目→在韩管理，用「 · 」连，例「术后管理 · 在韩管理」），所有用到的地方（到院卡标题、离院提醒、日志里的到院名）一起变。
- 测试：新增 R291a（KM1，pcStage 夹具）；KM1 批次 R146a / R288a / R267a / R22b / R66b / R67a / R78a / R81a / R125b / R57a 通过；R53b 需要先在 A1 跑 R52a（基线同样如此）。IN 页面不加载 kr.js，A1 没有受影响，没有重跑。

## CMD-1110-16 补充（2026-11-10，追加；取代 CMD-1110-14 第 2 项「本地项目 tab 里放『是否使用持有项目？』卡」、CMD-1105-07 / 1105-08 里页头［+ 添加本地管理］的「使用持有 / 购买新项目」小弹窗入口，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1110-16`），文档另一个提交；不推送不合并；**数据版本不变（61）**，没有新字段。
- **弹窗尺寸四档**（ui.js 末尾 `MODAL_SIZES` / `modalSizeApply` / `modalSizeScan` + app.css `.msz-S/M/L/XL`）：S 400（确认）/ M 560（小表单）/ L 800（大表单、列表）/ **XL 1120（新增）**，宽度都是 `min(尺寸, 92vw)`；`.modal-box` 默认宽度也改成 S。**新弹窗直接写 class `msz-X`**；老弹窗里写死的行内宽度由 MutationObserver 自动吸附到最近一档（≤440 → S，≤640 → M，≤900 → L，更大 → XL；`width:100%` / `!important` 的不动）——只调宽度、不改内容。用 XL：本地选购购买弹窗（`lm-buy-overlay` 和 `in-localentry-overlay` 的购买 tab）、KR［增加今日项目］（`kr-dayadd-overlay`）、KR［+ 购买新项目］（1040 吸附成 XL）、补加推荐项目弹窗；确认类（「客人准备离店了吗？」等 ≤440）= S；其余按原宽度吸附到 M / L。
- **购买弹窗**（`localPurchaseHtml(c,'lm')`）：拿掉里面那层「本地选购」带框卡片和标题（`.lm-buy-body`），左边项目列表约 60%、右边「已选择 / 合计」约 40%（`minmax(0,3fr) minmax(0,2fr)`）；标签 / 芯片 `white-space:nowrap`。
- **「今天如何安排项目？」弹窗**（data.js `planModalOpen / planRender / planUse / planBuy / planNotUse / planBack / planClose`，状态 `PLAN` / `PLAN_RETURN`，overlay `#local-plan-overlay`，M）：［使用持有项目］（没持有灰掉）［购买新项目］，左下角灰字「今天不使用」（✕ 同）。**自动弹**：基础资料确认完、服务类型是本地（`confirmMaterials` 末尾，纯本地案件；自测钩子 `GMC_NO_PLAN_AUTO`）、买完付完款（或取消购买）后（`usePrevBuy` 记 `PLAN_RETURN`，`lmSettleDo / lmNoBuy` 包装里回来）；页头［+ 添加本地管理］打开同一个弹窗（`inLocalEntry()` 对纯本地案件也转它）。纯本地案件：［使用持有项目］→ 同一个弹窗里变成勾选清单（`holdingsUseHtml('main')`，id `hold-check-main-N`），使用后弹窗关闭、出现「本地项目」tab + 本地管理表格；［购买新项目］→ 购买弹窗（XL）→ 付款 → 结算单进「结算」tab → 回到这个弹窗（刚买的已是持有）；「今天不使用」→ `notUseThisTime('main')` → 「客人准备离店了吗？」（来访还有别的事在进行时不弹，只关掉）。其他案件（面诊 / 赴韩 / 子案件）：弹窗先出来，［使用持有项目］/［购买新项目］转到原来的 `inLocalEntry('use' / 'buy')` 弹窗（INLE，use 为 L、buy 为 XL）。
- **「本地项目」tab 只在使用持有之后才出现**（ui.js `showLocalTab`）：`mgmtActive / mgmtUses / localMgmt 的使用 / localAsk / addUse / followup 术后管理` 才有；不再因为「有持有要用 / 入口卡在等 / usePrev」出现。**保留**：置换额度页内选购（`c.comp / addingMore / projectEntryMode==='new'`）仍需要这个 tab——它走的是页内选购画面，不是购买弹窗，这次没改（待你决定要不要也改成弹窗）。旧资料（`entryChoicePending` + holdings 卡在等的）没有 tab 也没有自动弹窗，从页头［+ 添加本地管理］进同一个弹窗即可。
- 测试：新增 R292a；R290a / R284a / R182a / R208a 的断言按新流程改；`ST.openHold(c)`（自测辅助）= 打开弹窗的持有清单；`ST.useHold` 对纯本地案件自动用它。A1 全套对照上一轮基线失败集合：新增失败只有因弹窗入口变化的 B6 / B7 / D28a / D31a / R182a / R185a / TD1（`submitHoldingsUse` 包装先清了弹窗内容导致读不到勾选框，已改成函数跑完再清）；改完后这些和 R292a / R290a / R289a / R284a / CP1 / CP2 / R86a / R99a 全部通过；KM1 批次 R291a R146a R288a R267a R22b R66b R67a R78a R81a R125b R57a R216a 通过。浏览器窗格隐藏时没法量真实宽度 / 截图，92vw 靠 CSS 保证，没有在 1280 宽下目测。

## CMD-1110-17 补充（2026-11-10，追加；取代 CMD-1110-13 第 2 项「页面下方的项目卡照旧保留」、CMD-1028-11「非施术日术后管理一直显示」、CMD-1025-02 / 1109-18 里施术当天「进行项目」下面的项目卡，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1110-17`），文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面。
- **KR 子案件页只放今天的事**（kr.js）：非施术日「今日项目」tab 拿掉下面的「术后管理」总览卡（`krDayCareCardHtml`，函数留着没入口）和「项目卡」（`krProjCards({care:true,noCare:true})`）；施术当天「进行项目」tab（`krSdRun`）拿掉 `krProjCards({care:true})`。选今日进行项目的勾选步骤（`needTodayPick`，Step 4）仍是 `krProjCards({pick:true})`——那是必经的一步，不是「下面的项目卡」。
- **「查看全部项目（主案件）」**（`krAllItemsLinkHtml` / `krAllItemsTab`）：卡片下面一行下划线文字，`krShowCase(诊所, 案件, {tab})` 跳主案件：今天有术后管理 →「术后管理」tab；只有在韩管理 →「管理项目」（KR 叫「在韩管理」）tab；都有 → 术后管理；今天什么类型都没有 → 有术后管理就术后管理、有管理项目就管理项目、否则施术项目。施术当天页新增［增加今日项目］（`krDayAddToggle(案件|main)`，已到院 + 没完成 + `krCan()`），非施术日本来就有（卡片标题行）。
- **项目卡里的功能搬到哪**：［今日进行］（`krUnitUseNow`）/ 勾选今日进行 → 弹窗［增加今日项目］（勾选 → 确认 → 出现在今日项目表）；［+ 购买新项目］→ 弹窗里项目卡右上；［今日取消］→ 今日项目表每行本来就有；保留 / ［预约时间］/［修改时间］/［全部预约］/ 术后管理总览 → 主案件「术后管理」tab（`pcmHtml`）、「在韩管理」tab（`krProjCards({only:'mgmt'})`）、「赴韩施术」tab 的项目卡（施术项目）；已完成 / 已使用 → 主案件项目卡的已完成分页。改以后的预约时间只在主案件 tab 做。
- 测试：R169a 重写（没有术后管理总览卡 / 项目卡、有链接、onclick 跳对 tab、主案件术后管理 tab 有这些项目和［预约时间］［全部预约］［修改时间］、保留组在主案件 tab）；R124a 的「进行项目 + 项目卡」断言改成「没有项目卡、有［增加今日项目］和链接」。KM1 批次 R169a R124a R146a R291a R288a R267a R166a R22b R57a R66b R67a R78a R81a R125b R216a 通过；对照基线（改动暂存后同一批用例）新增失败只有 R169a / R124a（有意改动）。A1 / KD1 没跑（只改了 kr.js；KD1 同一页面代码，没有单独验证）。

## CMD-1110-18 补充（2026-11-10，追加；取代 CMD-1110-16 里「今天如何安排项目？」弹窗的内容（客人名一行、并排按钮、左下角「今天不使用」）和 CMD-1110-08 / 1110-02 里「备注内容」「附件」tab 永远显示，旧文字保留作历史）
- 分支 **V5**，代码提交 3942d71，文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面。
- **「今日如何安排项目？」弹窗**（data.js `planRender`，M 档）：只有标题 + 右上 ×；两个按钮上下排、同宽（［使用持有项目］没持有灰掉写 title、［购买新项目］）；拿掉客人名一行和「今天不使用」链接；× = 今天不使用（`planNotUse` → 1110-14 的「客人准备离店了吗？」，来访还有别的事在进行时不弹）。标题字面从「今天」改「今日」（旧测试的文字匹配跟着改）。
- **全站弹窗 ×**：新增 `.modal-x`（app.css，无底色无边框，只有图标）；把原来 `btn-ghost` 的 ✕ 按钮（添加本地管理弹窗两处、计划弹窗）改成它。其余 ✕ 本来就是没有底色的 `<span>` / `<a>`，没改；`booking.js` 里表单行的删除 `bk-x` 和图片缩略图右上角的红色小圆 ✕ 不是弹窗 ×，没动。
- **「备注内容」「附件」tab 没内容不出现**（基础资料 / Timeline 永远在）：新增 `hasNotesFor(m, viewer)`、`hasAttachFor(c, viewer)`（data.js）。IN：`caseTabListOf`（未升级的一般案件、升级后的主案件）、`subDayTabs`（子案件页，附件）；KR：`krTabListOf`（主案件）、`krSdTabs` / `krSubTabsOf`（施术当天和其他到院日的子案件页，附件）；客户页（IN / KR 共用 `clientDetailBodyHtml`）备注内容 tab 没备注不出现。**附件有没有 = `caseAttachments(c)`**：基础资料里传的苦恼部位照片 / 视频、复诊项目媒体、术后恢复、手工上传、诊疗方案、对话记录都算，所以只要客人传过部位照片就有附件 tab。
- **基础资料最下面一行「附件：［+ 上传］」**（`basicAttachRowHtml`，确认后的基础资料页最下面、医美史后面）：按钮就是附件 tab 里同一个 `mockUploadAttachment()`（默认类别「基础资料」），上传后附件 tab 出现；确认前的接待页本来就有「上传附件（选填）」同一函数的一行，没动。
- **会消失的上传入口**：KR 室长的附件 tab 里的［+ 上传附件］（`krUploadFile`）——附件 tab 没有任何文件时整个 tab 不出现，KR 就没有上传入口了（KR 到院当天术前照片上传不变；IN 先上传过或有部位照片等附件时 KR 的 tab 才出现）。IN 附件 tab 里的类别下拉（面诊资料 / 基础资料等）同样要先有文件才看得到，基础资料页的上传一律记「基础资料」。
- 测试：selftest 新增 R293a；旧断言改（改前 → 改后）：弹窗文字「今天如何安排项目」→「今日如何安排项目」、「有『今天不使用』链接」→「没有」（R284a / R290a / R292a）、R118a / R119a / R143a / R278b 的 tab 顺序（备注内容 / 附件 没内容不出现）。回归：A1 全套对照 V5 基线（HEAD 3942d71 之前的代码）失败集合完全一致（除了上面更新后的 R118a / R119a / R143a）；KM1 全套对照基线只多 R278b（已按新规则更新）和 R293a（IN 专用）；KM1 / KD1 夹具类用例同基线。

## CMD-1110-19 补充（2026-11-10，追加；取代 CMD-1025-02 / 1028-04 / 1109 里 KR 非施术日子案件页和复诊子案件页各自的页头，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1110-19`），文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面 / 入口。
- **页头共用**（kr.js）：KR 子案件页 = 主案件同一个 `krMainHeader`（名字 · 案件号 + 面诊 / 施术次数 + ［对话］；第二行「在韩行程：…」+［行程修正］；第三行来源诊所 · 院长 · KR 室长；没有赴韩行程时第二行不显示）。换了三处：非施术日子案件页（原来是最后一个旧页头，带「从…面诊开始 · 进行中 · 今天：…」那行，现在拿掉，子案件条下面已经有）、施术当天页（`krSurgDayHeader` = 共用页头 + 一行「← 回到主案件」链接）、复诊子案件页（共用页头 + 原来的子案件条，条里去掉重复的客人名 / 对话按钮）。IN 端页头本来就是另一套，没动。
- **［+ 购买新项目］没反应的原因**：购买弹窗（`#kr-addmodal-overlay`）只在整页重画时由页面里的「项目卡」（`krProjCards` → `krAddOnCard`）顺带建出来；「增加今日项目」弹窗里的项目卡是 `modal` 模式（不调 `krAddOnCard`），子案件页（1110-17 起）又没有项目卡，所以点了只设了 `KR_AD.open`，没有任何东西画出来。修：`krAddModalOpen` 先关掉增加今日项目弹窗（记 `KR_DAM_RETURN`），直接建购买弹窗；`krRenderCaseDetail` 的包装在购买弹窗开着 / 刚关时同步它；取消购买（`krAdCancel`）、稍后付款（`krPayLater`）、确认付款（`krPayConfirm`）后 `krDayAddBack()` 回到增加今日项目弹窗，刚买的项目在列表里（不自动勾）。
- **弹窗拿掉内层框**：`krProjCards` 的 `modal` 模式不再包 `krCardBox`（没有「项目卡」标题和外层框），只有分页胶囊 + 列表；［+ 购买新项目］放在弹窗**标题行**（× 左边），标题行右边新增 `.modal-x` ×（`krDayAddClose`）。
- **全站其他［+ 购买新项目］**：KR 项目卡右上（主案件「赴韩施术」「在韩管理」tab，同一个 `krAddModalOpen`）、IN 的 ［+ 购买新项目］（本地选购 / 添加本地管理 / 计划弹窗，走 `usePrevBuy` / `inLocalEntry` / `planBuy`，前几轮的 R182a/R208a/R284a/R290a/R292a/R293a 都点过）；本轮 R294a 点了 KR 子案件页弹窗里这个按钮并验证。
- 测试：新增 R294a（KM1，pcStage 夹具）；KM1 全套对照改动前 V5：失败集合完全一致（R294a 在全套里缺夹具而失败，单跑通过）；KM1 批次 R294a R146a R169a R124a R66b 通过；A1 不加载 kr.js（本轮只改 kr.js），A1 抽测 R293a R292a R290a R118a R289a R182a 通过，没有重跑 A1 全套。

## CMD-1110-20 补充（2026-11-10，追加；取代 CMD-1110-06 的 tab 标记 ●、CMD-1110-09 的「备注内容」分页先项目备注、CMD-1021-14 的项目卡下备注卡，旧文字保留作历史）
- 分支 **V5**，代码提交 5cdd6c1，文档另一个提交；不推送不合并；**数据版本不变（61）**，没有迁移。
- **来访备注只放两处**：主案件「备注内容」tab、那一天的子案件页（IN 到访 tab 新增「来访备注」卡 `inVisitNotesCardHtml`，KR 端本来就有整体备注区）。IN 项目卡（`inProjectCardHtml`）和 KR 的施术项目 / 术后管理 / 在韩管理 tab 的「备注」卡拿掉（`krNotesCardHtml` / `notesCompactHtml` 函数留着没入口）；项目备注照旧在项目表备注栏。
- **IN［增加备注］**搬到「备注内容 → 来访备注」分页右上（`notesTabHtml` 的 `o.add`，主案件页才有，客户管理没有）。`notesInTarget(c)`：今天有 IN 来访（`daysOf` 里 place IN、不是取消 / 未到）→ 记在那个来访（子案件 / 主案件自己的这一天）；没有 → 记在主案件、`scope:'main'`，来访备注里标「主案件备注」。KR 在同一位置也有［增加备注］（我的判断：不然 KR 失去添加入口），记 `vk:''` + `scope:'main'`。
- **分页**「来访备注（N）｜项目备注（N）」，默认来访备注（主案件、客户管理，IN / KR）。
- **未读怎么记**：`m.notesSeen = {'IN:A1':'UTC 时间','KR:KM1':…}` 存在**主案件**上，每个账号最后一次打开「备注内容」tab 的时间；未读 = 对方（role 不同的一边）写的、`at` 晚于这个时间的备注条数（来访 + 项目，含子案件的）；没有记录 = 以 `NOTES_EPOCH`（2026-11-10 08:30 UTC，升级时间）为界，所以旧备注一律已读、不冒红数字。打开 tab 的入口：`switchCaseTab('notes')`（IN）、`krSetCaseTab('notes')`（KR，经 `Store.mutateClinic`）、`cliSetTab('notes')`（客户管理，`cliNotesSeen`，对客人名下所有主案件）。同一秒写的会被当成已看（`at > seen` 才算未读）。深链直接打开备注内容 tab 时不自动标已读（要点一下 tab）。**正式版后端**：「备注 × 账号」已读表，或每个账号一条 `last_seen_at`（按主案件）；未读数 = 对方写的、created_at > last_seen_at 的条数；打开 tab 时写 last_seen_at。
- **通知**：只有来访备注发。IN 存（`coreAddInNote`）→ KR 铃铛 kind `visitnote`，文字「A1 室长新增来访备注（客人 案件号）」，案件号是备注所在的子案件；KR 存（`coreAddProgressMemo`、整体备注［保存］`coreVisitNoteSaveNow`）→ IN 铃铛，新类别「备注」📝，文字「KM1 室长新增来访备注（客人 案件号）」；整体备注改了文字再存 = 同一笔更新，文字写「…更新了来访备注（…）」，文字没变（只刷新时间）不发；点击跳到那个案件 / 子案件。项目备注不发通知。原来 IN 增加备注发给 KR 的「IN 备注：…」(kind `innote`) 改成这条（KR「IN 备注」已读卡和结算前必须读的规则不变，但记在子案件上的 IN 备注不进主案件的已读检查，我的判断：待确认）。
- **tab 标记**（`flowMarkOf` 返回 '✓' 或数字字符串，灰色）：= 这一类还没做完的项数（已约 + 未约合起来）：面诊 0/1、施术项目 = 没做完没取消的施术项目数、术后管理 = 已约没做 + 还没约、管理项目 = 没用完的在韩管理项目数（IN 另含没用完的本地批次数；行程结束 → ✓）、复诊 = 没出结果的复诊评估数；0 → ✓。红色数字只给「备注内容」。tab 列表项多 `unread` 字段，IN V2 tab 栏（`caseTabListOf`）、KR `krTabListOf` / `krRenderCaseDetail0`、客户页 tab 栏都显示。KR 施术当天页的 tab 标记（`krSdTabs`）是另一套，没改。
- 测试：新增 R295a（A1）、R295b（KM1，pcStage 夹具）；旧断言改（改前 → 改后）：● → 数字（R118a R144a R282a 的 tab 标记）、备注内容默认项目备注 → 默认来访备注（R284a R285a）。回归（隔离端口，对照改动前 V5）：A1 全套、KM1 全套失败集合一致（仅新增的 R295a R295b 在全套里缺夹具而失败，单跑通过）；KD1 页面同一份代码，没单独跑批次。

## CMD-1110-21 补充（2026-11-10，追加；取代 CMD-1110-16 / 18 里「买完付完款（或取消购买）后回到『今日如何安排项目？』」，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1110-21`），文档另一个提交；不推送不合并；**数据版本不变（61）**，只改入口和弹窗。
- **买完付完款 → 弹「使用持有项目吗？」**（data.js `useAskOpen` / `useAskYes` / `useAskNo`，`#use-ask-overlay`，S 400）：标题 + 右上 ×（= 不使用）；按钮［不使用］［使用］（主按钮最右）。触发：`lmSettleDo` 的外包装（同一处管 1110-16 的计划弹窗回来和 INLE 弹窗买完），条件是这次买完来自计划弹窗的购买（`PLAN_RETURN`）或「添加本地管理」弹窗的购买 tab（`INLE.tab==='buy'`）；买之前拍 `holdSnap`（每个项目名的剩余次数），买之后增加的就是「刚买的」。客人没有任何持有 → 不问。**取消购买（`lmNoBuy`）什么都不弹**（原来会回计划弹窗）。
- ［使用］：纯本地案件 → `PLAN={state:'use'}` 的勾选清单（`holdingsUseHtml('main')`），刚买的项目名对应的行 `hold-check-main-N` 已勾，其他持有也列出可加勾 → 确认后出现「本地项目」tab + 本地管理表格；其他案件（面诊 / 赴韩 / 子案件）→ `inLocalEntry('use')` 的使用持有弹窗，刚买的 `iu-hold-N` 已勾。［不使用］/ × ：纯本地 → `notUseThisTime('main')` →「客人准备离店了吗？」（来访还有别的事在进行时不弹）；其他案件只关掉（它们本来就有别的事在进行）。
- **「今日如何安排项目？」弹窗现在只在两处出现**：① 基础资料确认完、服务类型是本地（自动弹）② 页头［+ 添加本地管理］。KR 的购买（在韩加项）不套这个窗（照 1110-19 回「增加今日项目」弹窗）。
- 测试：新增 R296a；旧断言改（改前 → 改后）：买完「回到今日如何安排项目 / 回到使用持有」→「弹使用持有项目吗？」（R182a R227a R290a R292a）。回归（隔离端口，对照改动前 V5）：A1 全套失败集合一致（仅 R227a 因上面更新已改）；KM1 批次通过（R146a 在 R295b 之后连跑偶发失败，单跑通过，与本次无关）。

## CMD-1110-22 补充（2026-11-10，追加；取代 CMD-1110-13 / 15 / 19 里 KR［增加今日项目］弹窗「项目卡 + 标题行放购买按钮 + 确认（N）」的写法，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1110-22`），文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面。
- **弹窗**（kr.js `krDayAddRender` 重写，XL）：标题只写「增加今日项目」+ 右上 ×（去掉客人名和下面的说明）；分页行「施术项目（N）｜管理项目（N）」最右［+ 购买新项目］（没有项目的分页不显示）；没有「未预约 N」小标题和外层框；一张表，栏位 勾选框｜项目｜次数｜使用次数｜建议时间｜建议日期｜购买时间｜来源；右下［取消］［确认］，一项都没勾［确认］灰、按钮上不写数字。弹窗里没有术后管理分页（`noCare`），以后加了用同一套栏位，只有 1 次的使用次数勾了就是「1」不显示加减。
- **行从哪来**：不另写一套判断——`krDamRows(c)` 调一次 `krProjCards(c,{pick:true,noCare:true,modal:true})`，让 `krPcRow` / `krMgRow` 在带勾选框的行（`pk`）里把内容登记进 `window.KR_DAM_COLLECT`，弹窗按这份清单画（所以可选范围规则仍是 1110-15 那套：可选次数 = 剩余 − 已排预约 − 今天已加）。
- **次数 / 使用次数**：次数只写「剩 N 次」（管理项目 N = `holdItemLeft − holdItemPlanned − mgTodayQty`；施术项目 1 次）。使用次数：没勾「-」；勾了变加减器「− 1 +」（`krDamQty`，状态 `KR_PICKQ`，默认 1、最少 1、最多 = 剩余次数，到顶 + 灰；剩 1 次时只写「1」）；取消勾选回「-」。确认（`krDayAddConfirm`）把每项的数量作为 `coreUnitUseNow` 的 `qty` 传进去，今日项目表里这一项的次数 = 这个数（和今日进行的加减同一套数据 `todayQty` / `useQty`）。
- 测试：新增 R297a（KM1，pcStage 夹具）；旧断言改（改前 → 改后）：R146a / R294a 里「标题含客人名 / 确认（N）/ 购买按钮在标题行」→ 新排版。回归（隔离端口，对照改动前 V5）：KM1 全套失败集合一致（仅新增的 R297a 在全套里缺夹具而失败，单跑通过）；A1 不加载 kr.js，没有重跑。

## CMD-1110-23 补充（2026-11-10，追加；取代 CMD-1110-12 第 2 项「［操作完成］［今日取消］左右并排」和 CMD-1106-13 页头第一行不放状态标签，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1110-23`），文档另一个提交；不推送不合并；**数据版本不变（61）**，只改画面。
- **操作栏**（kr.js `krTblRow` today 模式，子案件「今日项目」表和施术当天「进行项目」表共用）：没做的行 = 下划线文字「今日取消」（`<a>`，12px，同其他下划线按钮）放在［操作完成］**左边**、同一行；做完 = 「已完成」（绿字）+［撤回完成］，不显示「今日取消」；客人离院 / 关账后照旧没有按钮。点「今日取消」的行为不变（`krTodayCancel`，原因 / 退回规则照旧）。**表格里本来没有「今日取消」的行（施术项目行、管理项目行，CMD-1027-03 / 1109-18 用户定的）这次没加回**，它们的「今日取消」仍在项目卡里。
- **页头**：KR 子案件页的页头本来就和主案件是同一个函数 `krMainHeader`（CMD-1110-19 起；施术当天页 = 共用页头 + 回主案件链接，复诊子案件页 = 共用页头 + 子案件条）。没有状态标签的原因：CMD-1106-13 把主案件页头第一行的状态标签拿掉了（主案件页有自己的两行状态卡），1110-19 复用时子案件页也跟着没有，所以不是“没共用到”，是共用的那个函数本身没有标签。现在 `krHeadStageTag(r, c)` 在 `krMainHeader` 里补回（`krStage` 的「阶段 · 进程」，已结案用原来的状态文字），主案件页和所有子案件页同时有。
- 测试：新增 R298a；旧断言改：R125a「页头没有状态标签」→「有状态标签、没有『从…面诊开始』」。回归（隔离端口，对照改动前 V5）：KM1 全套失败集合一致（仅 R125a 已更新、R298a 在全套里缺夹具失败单跑通过）；A1 不加载 kr.js，没有重跑。

## CMD-1110-24 补充（2026-11-10，追加；补 CMD-1110-23「表格里的施术行、管理项目行没有今日取消」，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1110-24`），文档另一个提交；不推送不合并；**数据版本不变（61）**，只加入口，规则和钱都没动。
- **所有类型的行都有「今日取消」**（kr.js `krTblRow` today 模式 + `krMainRowsHtml` 的持有管理项目行；排法同 1110-23：下划线「今日取消」在［操作完成］左边）：施术行（`_item` 一项一行 / 在韩加的施术）→ `krSurgTodayCancelOpen`（= `coreSurgTodayCancel`：原因必填、`deferUse` + `rebookWait` 退回待重新预约、**不退款、不动定金 / 尾款**；条件同项目卡：已到院 + 尾款已付 + 今天没结束 / 没关账）；管理项目行 → `krTodayCancel`（持有行 / 在韩加项行走 `item`：从 `todayPickMgmt` 拿掉；使用行 `holdUseOf` 走 `row`：`coreRowCancel` 直接删掉这一行，持有次数本来就没扣，退回持有）；术后管理行照旧（`row` → `coreRowCancel`，退回未预约）。做完的行没有。
- **任务页「默认走『项目有变动』」**：施术今日取消没有走到院评估的「项目有变动」（那条会动钱：退定金 / 补尾款），用的是 1109-18 的现有函数，所以**不会动到钱**，没有触发“先停下来问”。
- 测试：新增 R299a（KM1，pcStage + stageC 夹具）；回归（隔离端口，对照改动前 V5）：KM1 全套失败集合一致（仅 R299a 在全套里缺夹具失败，单跑通过）；A1 不加载 kr.js，没有重跑。

## CMD-1110-25 补充（2026-11-10，追加；取代 CMD-1110-16 里「置换额度走页内选购」、CMD-1110-06 / 1109 里 KR 已完成到院卡的［增加项目］、CMD-1110-17 里 KR 施术当天页签的 ●，旧文字保留作历史）
- 分支 **V5**，基准 862f357；代码提交 + 本文档提交；不推送不合并；**数据版本不变（61）**，没有新字段。
- 1 「下一个预约 / KR 阶段进程」里的名称统一用 `dayNameOf`（`mainDayBiz` / `krMainDayTypes`），不再写「赴韩项目 / · 韩国」。2 KR 已完成到院卡的［增加项目］拿掉（`krCaseCardHtml` / `krSdRun0` 不再调用 `krReopenFooter`；`krReopenFooter` / `krReopenAdd` 函数留在文件里没有入口，是否删除待你决定）。3 「客人准备离店了吗？」→［客人已离店］（`localLeaveYes`）：当前案件能走页头［客人离店］就直接打开 `openEndCase`，和页头同一条流程；否则才 `autoFinish`。
- 4 置换额度（`startCompPurchase`）改走 XL 购买弹窗（`c.comp.scope='lm'` + `c.localMgmt` + `LM_BUY_OPEN`，`COMP_BUY` 标记），付完款走 1110-21 的「使用持有项目吗？」（`lmNoBuy` / `lmSettleDo` 包装认 `COMP_BUY`）；纯本地案件的 `showLocalTab` 不再因 `addingMore` / `comp` / `entryChoicePending+new` 出现。页内选购旧分支（`localBuyNew` 的 addingMore、`chooseProjectEntryMode('new')` / `holdingsAddNew`、`projectListTabHtml` 的 main 选购）现在只有旧资料 / 非纯本地案件会走到。
- 5 KR 基础资料最下面「附件：［+ 上传］」（`krBasicAttachRow`，同一个 `krUploadFile`，上传后附件 tab 出现）。6 KR 今日项目上方「IN 室长备注：…」一行（`krInNoteLine`：最新一条、译文 + 查看原文、「全部（N）」跳备注内容、没有就不显示）；结算前已读检查（`krUnreadNotes` / `coreNoteRead`）只算 IN 的来访备注（主案件 + 全部子案件，`inVisitNotesAll`），不算项目备注。7 KR 施术当天页签标记（`krSdTabs`）改灰色数字 / ✓（项目方案、术前状态、进行项目）。
- 回归（隔离端口，对照 5ac10c4 / 862f357）：KM1 全套 862f357 为 494 项 95 通过，本次 496 项 93 通过（新增失败 R124a / R125a 是上面 1、7 的有意改动，断言已更新并单跑通过；R300a 是 IN 专用用例，R300b 单跑通过）；KD1（67 个相关用例）本次与 862f357 完全一致（58 失败 / 9 通过），5ac10c4 为 61 失败；A1 全套本次 496 项 247 通过，862f357 为 494 项 251 通过。
- A1 全套对照 862f357 的新增失败 B7 / D28b / D31b / CP1 / CP2 也是这次的有意改动（离店弹窗自动应答改直接 autoFinish；置换额度改走购买弹窗、scope 'lm'），断言已改并单跑通过。
- 我的判断（未经确认）：项目方案页签在已到院未付尾款时标 1；KR 结算前已读检查把子案件上的 IN 来访备注也算进去。

## CMD-1110-26 补充（2026-11-10，追加；取代 CMD-1106-15 里推荐项目备注框一直显示、CMD-1013-13 / 1102-08 里增加面诊带入不面诊的苦恼和面诊费表单的 radio，旧文字保留作历史）
- 分支 **V5**，基准 11a69ce；**数据版本不变（61）**；新增可空字段 `c.visitNoteDraftIn`、IN 备注记录的 `src:'face'`（不需要迁移）。
- **1 推荐项目备注框勾了才出现**（kr.js，院长评估 / 室长代录 `krGcPickColumn`、室长发送画面 `krSubmitBlock`、管理项目 `krMgListHtml`）：没勾的行只有项目名 + 价格；勾了出现「请输入备注内容」；取消勾选收起，已打的字仍在 `KR_SUB.notes`，再勾回来还在；上传 / 发送本来只读已勾项目的备注，所以没勾的不存。「查看备注（N）」不管勾没勾。
- **2 室长发送诊疗方案画面上下排**（`krSubmitBlock`）：上 = 报告内容 +［AI 整理报告］全宽；下 = 赴韩项目可选范围（施术 / 管理分页、勾选、设定）→ 附件 → 方案备注 → 发送按钮。
- **3 增加面诊不带入苦恼**：`toggleConcernPart` 的说明保持空白；参考那行拿掉；`addConsult` 不再存 `addConsultRef`。
- **4 面诊内容加「来访备注」**（data.js 末尾 `visitNoteRowHtml` 等）：一般面诊的到访目的（预算下面）和增加面诊（预算下面、院长上面）；选填多行；确认（`confirmMaterials` 选面诊 / `confirmConsultFee` 缴费或免除）时 `visitNoteCommit` 存成这一天的 IN 来访备注（`coreAddInNote` + `src:'face'`，发铃铛给 KR、计入备注内容和未读数），之后在基础资料的到访目的里改 = 更新同一条并再通知一次；KR 面诊画面「到访目的」预算下面一行「来访备注（IN）：…」（`faceVisitNoteKrHtml`，译文 + 查看原文），到院当天走 1110-25 的「IN 室长备注」行。
- **5 面诊费改弹窗**（`feeModalOpen` 等，`#fee-overlay`，M 560）：表单最下面只留［确认］（拿掉 radio、［面诊取消］和下面「待缴费」那行）；点［确认］先查部位卡 / 院长，再弹「面诊费 Rp X ［未缴费］」+ ○已缴费 ○免除面诊费（选了要原因，「其他」要说明）+［面诊取消］（红色线框，`canCancelConsult` 时才有）［确认］（没选 / 没原因灰）；× = 先不缴，面诊费仍是未缴费，之后从面诊 tab 再按［确认］；确认仍走 `confirmConsultFee`（功能不变）。
- 我的判断（未经确认）：一般面诊的到访目的里，来访备注放在预算下面，而这张表里预算在院长下面，所以顺序是 院长 → 预算 → 来访备注（增加面诊是 预算 → 来访备注 → 院长）；关联案件预设了免除原因时弹窗默认选中免除；面诊费弹窗里「未缴费」是固定文字。
- 回归（隔离端口，对照 11a69ce）：A1 全套 498 项，253 通过 / 245 失败（基线 496 项，252 / 244）；KM1 全套 498 项，96 通过 / 402 失败（基线 496 项，95 / 401）；KD1 相关 67 个用例 + 新用例，失败集合与基线一致。新增失败只有 IN 专用的 R301a（在 KM1 分页）和 KR 专用的 R301b（在 A1 分页），属预期。更新的旧断言：R205a（苦恼不再带入、面诊费弹窗）、R46a/R280b（备注框勾了才有、面诊费免除原因在弹窗里）。

## CMD-1110-27 补充（2026-11-10，追加；取代 CMD-1110-25 里「krReopenFooter / krReopenAdd 留着没入口」，旧文字保留作历史）
- 分支 **V5**，基准 b82c831；数据版本不变（61）；只删代码，不改画面、不改规则。kr.js 删掉 `krReopenFooter` / `krReopenAdd`（全站搜索：产品代码里没有任何调用；`krRoWrap` 里只有一条匹配 `krReopenAdd(` 的放行条件和它用的 `reopenOk` 变量，一并拿掉）；自测里一条检查这个函数代码的断言改成「函数已不存在」。`coreReopenVisitAt` 等核心函数不动。旧的页内选购分支（`localBuyNew` addingMore、`chooseProjectEntryMode('new')` / `holdingsAddNew`、`projectListTabHtml` main 选购）按指示没动。
- 回归（隔离端口）：KM1 全套 498 项，96 通过 / 402 失败，失败集合与 b82c831 完全一致；KD1 相关 67 个用例 + 新用例，58 失败，集合一致。

## CMD-1111-01 补充（2026-11-11，追加；取代 CMD-1020-18 三 / CMD-1027-13 里 IN 未安排预约「按客人折叠展开项目表 + ［全部预约］」和预约印尼术后管理弹窗「按日期圈小卡、同一天共用一个时间、次数加减」，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1111-01`），不推送不合并；**数据版本不变（61）**，只改画面 / 预约入口，没有新字段。
- **工作台「未安排预约」（IN）**：一行一个客人（一个主案件一行，`todoUbListInHtml`）：「MM/DD　客人名（案件号，可点打开术后管理 tab）　未预约 N　［预约］」；日期 = 这位客人没约的项目里最早的建议日（逾期标红）；拿掉展开的项目表、三角形、［全部预约］。KR 的未安排预约列表不动。
- **「预约印尼术后管理」弹窗**（`todoCbOpen` / `todoCbRender`，L 档）：标题行 + 「客人：X　［查看案件］」+ 一张表 勾选｜项目｜施术项目｜推荐内容（术后第 N 天）｜推荐时间｜预约日期（日期框 + 时间下拉）；拿掉「继续原案件 / 来访目的」、说明文字、共用的「预约时间」卡、汇总条、次数栏。**一行一次**：多次项目拆成多行（`TODO_CB2.rows[]`，每行自己的推荐时间）；日期默认带推荐时间（遇休诊 / 约满往后找可约日），时间默认「选择时间」自己选；日期有问题（休诊 / 已满 / 已过）的行红字、自动取消勾选，改对后自动勾回；午休时间可选，确认时跳「这是午休时间」确认。**［确认预约（N）］的 N = 勾了、且日期和时间都填好的行数**，0 行灰；没填时间的勾了行确认时跳过。**确认后的归并**：按日期归——同一天的行归到同一个到访 / 子案件（沿用 `childResvOf` / `pendingResvSameDay`：同一客人同一天只能有一个没到店的预约；已有就并入、沿用已有时间），**同一天不同时间时，到访时间取最早的那一行的时间**，各行自己选的时间写进案件 Timeline（「项目 HH:mm」）。［查看案件］用 `openCaseNewTab`（沿用已开分页，新分页打开主案件，不关弹窗；浏览器拦截新分页时退回当前分页）。入口不变：工作台［预约］、主案件术后管理 tab / 项目卡［预约时间］、当前状态卡「预约」、待办里的预约都走 `todoCbOpen`，一起用新版；`todoCbSet(ri,k,v)`（取代 `(gi,li,k,v)`）、`todoCbSetDay` 删除。KR 预约弹窗（`krCbOpen`）是另一个函数，没有动。
- 测试：新增 R302a；R158a / R71a / R197a / 其它旧断言按新结构改（`groups[].lines` → `rows[]`；一行一客人；点名字只打开案件）。

## CMD-1111-02 补充（2026-11-11，追加；取代 CMD-1026-01 五 / CMD-1025-04 A 里一般面诊「Step 1 报告默认展开、按［查看方案］反而折叠」和 CMD-1025-04 里面诊后「这次到店要做什么？」入口卡，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1111-02`），不推送不合并；**数据版本不变（61）**，只改画面 / 入口。
- **面诊 tab（IN，一般面诊 report_ready）合成一张卡**（`consultTabHtml`）：第一行「面诊」+ 状态标签「已出方案」（+ 沿用方案标注 / ［邀请室长商谈］），最右「面诊时间：YY-MM-DD HH:MM（韩国） 印尼 HH:MM」（`consultTimeLineHtml`，照 5-19：韩国为主、印尼灰字；还没定写「面诊时间：待确认」）；第二行 📄「面诊诊疗报告」，最右 Button S：**还没看方案 =［下载］［查看方案］，报告不展开、没有［收起］**；按［查看方案］（`reportViewPlan`）= `planViewed=true`、**报告展开**、按钮变［下载］［收起］，之后［展开］［收起］切换（`toggleReportOpen`；离开再回来 `reportOpen` 为空时默认展开）；案件照旧进入项目确认中。等报告（待确认面诊时间 / 等待报告）时在原卡最上面加一行「面诊 + 状态标签 + 面诊时间」，没有第二行报告。升级后的主案件（`consultReportV2Html`）和复诊评估不动。
- **按［查看方案］后弹「今日如何安排项目？」**（`planModalOpen`，和 1110-18 同一个；到店当天才弹，`localAddAllowed` 假或案件已结束时不弹）：［使用持有项目］（没持有灰）→ 本地项目 tab / 原「使用持有」弹窗；［购买新项目］→ 面诊后（没升级、报告已出、没结算单）= **照诊疗方案选项目的画面**（面诊 tab 里 `projectPickerHtml`，赴韩 + 本地都能选，弹窗关掉后滚到 `#consult-after-report`），其他情况仍是本地购买弹窗；× → `notUseThisTime`（来访还有别的事在进行时不弹「客人准备离店了吗？」）。
- **旧入口卡换成弹窗入口**：`localEntryChoiceHtml`（「这次到店要做什么？」「持有项目使用 / 购买新项目」两个并排按钮）改成一行「今日要使用持有项目或购买新项目？［安排今日项目］」（打开弹窗）；面诊 tab 的选项目路径（`projectListTabHtml` 的 `entryChoicePending` 且没选入口）不再出这张卡，直接是选项目画面；本地管理 `lm` 流程里的「本地管理：客人要做什么？」同样换成这个入口。全站搜过：「这次到店要做什么」「本地管理：客人要做什么」「持有项目使用」两个按钮的旧卡就这两处。
- **KR**：KR 没有「没看就有收起」——KR 的面诊 / 复诊资料卡和报告走 krConsultDoneCard + ［查看报告］弹窗，没有内联收起；面诊 / 复诊评估已经是合并的一张卡（CMD-1026-11 / 1105-11），没有改。
- 测试：新增 R303a；R127c 重写；G1 / R126a 的旧断言改成「看过方案前报告不展开、看过后展开」。

## CMD-1111-03 补充（2026-11-11，追加；取代 CMD-1110-06 里「行程已定随时可发、不限 7 天内」，旧文字保留作历史）
- 分支 **V5**，代码提交见 git log（`CMD-1111-03`），不推送不合并；**数据版本不变（61）**，只改弹窗的可勾条件。
- IN 施术日期卡［发送信息给客人］弹窗（calalign.js `surgMsgRender` / `openSurgMsg`）：「行程与天气」**可勾 = 施术前 7 天内（`calDaysToSurgery ≤ TRIP_CONFIRM_DAYS`）且行程已定**（`surgTripOk`）；不满足时灰掉、不能勾、**不隐藏**，旁边灰字原因（`surgTripWhy`）：超过 7 天写「施术前 7 天内才能发」，行程暂定 / 日期时间没填写「行程确定后才能发」，两个条件都不满足时写前者。「施术日期与到院地址」不变（KR 确认施术时间后随时可勾）。弹窗右上加 ×（`.modal-x`，= 取消）。待办「发送行程提醒给客人」本来就是施术前 7 天才出现，点待办进来「行程与天气」先勾好，不变。`surgCanTrip` 仍只表示「行程已定且日期时间填全」（待办用），弹窗用新的 `surgTripOk`。
- 测试：新增 R304a；R282a 等原有断言本来就在 7 天内的设定里，没有假设「随时可发」，不需要改。

## CMD-1111-04 补充（2026-11-11，追加；取代 CMD-1111-01 里「预约弹窗每行各自选日期和时间」、CMD-1111-02 里「今日要使用持有项目或购买新项目？［安排今日项目］」那一行、CMD-1110-26 里增加面诊表单顺序，旧文字保留作历史）
- 分支 **V5**，基准提交 e82f683；**这次不提交**（用户自己提交）；**数据版本不变（61）**，只改画面和 Timeline 用词。
- **预约印尼术后管理弹窗改回「一天一个框、一个时间」**（todo.js `todoCbRender` / `todoCbGo` / `todoCbSetDay`）：同一天的行在同一个框，框标题行「MM/DD（周几） 预约时间［时间］」选一次时间（`TODO_CB2.dayTime[日期]`）；每行可改日期，改了移到那天的框（没有就新开）；日期有问题的行进红框「需要处理 N 项」；当天已有这个主案件的到访就并入、沿用已有时间（框里写「并入当天已有预约，沿用已有时间」）；多次项目照样一次一行、不显示次数栏；［确认预约（N）］的 N = 勾了、日期没问题、且这一天的时间选好（或并入已有预约）的行数，0 灰；午休确认保留；不再把不同时间写进 Timeline。客人行下面：离开日期没填 → 黄条「离开日期未填写，约之前请先确认客人行程（现在可以先约）」，有最早可回国日就写「最早可回国日 MM/DD」。1111-01 的精简（查看案件、没有说明 / 汇总条 / 次数栏）不变。KR 预约弹窗没动。
- **拿掉「安排今日项目」那一行**：`localEntryChoiceHtml` 恒返回空（本地项目 tab 的入口卡和 lm 流程的入口卡两处）。入口只剩页头［+ 添加本地管理］（`inHeaderLocalOk` 控制）和自动弹出的「今日如何安排项目？」；检查过：弹窗关掉后页头按钮仍在（来访进行中、没离店、没被锁），没有出现「拿掉后没有任何入口」的状态。
- **增加面诊表单顺序**：部位卡 → 院长 → 预算 → 来访备注（`consultTabHtml` 的 addConsultMode 分支），和一般面诊一致；提示文字同步。
- **Timeline 用词**：施术 / 术后管理行备注（`coreSubNote`）和项目备注（`coreItemNote`）写「项目备注：…」「项目备注（项目名）：…」（原「施术备注」「备注（名）」）；IN 本地项目备注原来就是「本地项目备注」没动；KR 子项备注 prompt 和 IN 子项备注显示标签同步叫「项目备注」；旧 Timeline 不改。
- 测试：新增 R305a；R158a / R302a / R71a / R197a / R303a / R205a / R301a 的旧断言按新结构改。

## CMD-1111-05 补充（2026-11-11，追加；取代 CMD-1015-07 / 1014-15 里待办「六栏（含截止时间 + 案件号）、已超时排最上」、CMD-1110-26 五里面诊 tab 卡上完全没有面诊费、CMD-1022-15 / 1026-20 里没选项目的离店直接结束，旧文字保留作历史）
- 分支 **V5**，基准提交 50384a0；**这次不提交**（用户自己提交）；**数据版本不变（61）**，新增可空字段 `c.leaveConsider`。
- **待办列表**（IN / KR 共用 `todoPaneHtml` / `todoRowHtml`，todo.js；样式 app.css 末尾）：五栏 出现时间（MM-DD 换行 HH:MM，今天也写日期）｜阶段｜进程｜状态｜客人；拿掉「截止时间」栏（超时仍红字 +「已超时」）、客人只写名字不带案件号；**新的在上**：置顶 → 出现时间由新到旧（`todoSort`），分组顺序也倒过来「之后 / 今天 / 昨日及更早」，组内同样新的在上；阶段写短名（`TODO_STAGE_SHORT`：面诊安排→面诊、赴韩施术→赴韩、复诊评估 / 待评估→复诊、项目确认→选项目、在韩管理→在韩、预约到店→预约、术后管理（印尼）→术后管理）；进程写短句（`todoShortText` + `TODO_SHORT_RULES`，按文字开头匹配，没匹配到取第一个「：（·」之前那段、最多 14 字），只显示一行，太长「…」，悬停是全文（`title`）；［催办］改成状态下面的下划线小字（`.todo-urge-link`）。
- **面诊 tab 的面诊费**（`consultFeeLineHtml`，data.js）：卡片最上面只读一行「面诊费 Rp X［未缴费］」；缴完 /［已缴费］，免除 /［已免除］原因：…；一般面诊待缴费页、增加面诊页、合并后的面诊卡（1111-02）都有；下面是「客人希望的面诊时间」，最下面［确认］（照旧跳面诊费弹窗）。等报告的两个状态原来就有面诊费卡，没动。
- **看完方案没选项目就离店**（ui.js `leaveNoProjectNeeded` / `leaveNoProjectOpen` / `nopjOk`；影响后端 = 是、影响流程 F1）：已出方案（`report_ready`）、没升级、没选项目也没买任何东西（`recommended` / 结算单 / 本地购买 / 本地使用都空）时，页头［客人离店］（`openEndCase`，「客人准备离店了吗？」的［客人已离店］也走它）先弹「客人这次没有选项目」（S 档，× 关闭）：○ 客人还在考虑 → `c.leaveConsider` + `leftStore`，案件留在项目确认中（不结案、不设自动结束期限；之后「项目确认中超过 3 天没动静」的跟进待办照旧；页头不再出现［客人离店］）；○ 客人不做 → `noProjectForClient(true)`（原来的结果：`endNote='客人不做项目'`、仅出报告、面诊费照收、方案保留、Timeline 记「客人不做项目」）；没选之前［确认］灰。已选项目 / 已买东西不弹。**拿掉面诊后选项目画面里的［客人不做项目］按钮**；`noProjectForClient` 现在只从这个弹窗进（`ui.js` 的 `noPurchaseThisTime`、`localAskAnswer` 等别的结案入口是另外的函数没动；待办里提醒「客人不做」［已处理］的 `plandecl` 是针对已结束案件的，保留）。自测钩子 `window.GMC_NO_NOPJ`。
- 测试：新增 R306a；G2 / R126a / R183a 的旧断言按新规则改。
