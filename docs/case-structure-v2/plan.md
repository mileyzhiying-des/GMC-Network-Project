# 案件结构 v2 施工计划（CMD-1023-01，分支 feature/case-structure-v2，基线标签 revisit-1022-done）

## 一、数据怎么存（分组式，不推倒重来）
- **主案件** = 现在承载面诊 / 赴韩流程的那个案件对象（CASE_ITEMS 里的一条，A000001）。面诊费、赴韩定金 / 尾款 / 在韩加项、项目、术后管理子项、KR 到院卡全部继续存在它身上（KR 约 4000 行代码都读这些字段，不搬）。
- **子案件** = 一天一个。统一入口 `visitsOf(m)`：把两类来源合成一个按日期排序的列表，编号现算 `A000001-01…`（不改存档里的老 dno）：
  1. 主案件自己的天：面诊那天（IN）、赴韩施术当天 / 之后每个在韩到院日（现有 subCaseList / 施术日期）；
  2. IN 回来的天：**原来的"接续案件"对象改成子案件记录**——仍是 CASE_ITEMS 里的一条（保留 visitDate / subState / leftStore / localMgmt / 基础资料等接待字段，这样接待流程不用重写），新字段 `mainId`（指向主案件）和 `seq`；它不再有自己的 Case ID，对外只显示 `主案件号-序号`。
- **流程**（跨天）由主案件字段现算成"流程"视图：面诊安排（consultStatus…）、赴韩施术（scheduleState、krSchedule、结算）、复诊评估 #n（数据仍存在对应子案件对象的 revisitEval 上，流程视图 `flowsOf(m)` 按序号汇总；结果出来前客人离店不影响）。
- **项目汇总** = 现算，不存：`summaryRowsOf(m)` 从 procedureItems（赴韩 / 管理 / 서비스）、subItems（术后管理）、客人持有批次（batch.caseId = 主案件或其子案件）收集成 项目名称｜业务类型｜购买时间｜使用时间｜使用次数｜状态；展开行 = 每次使用，［查看案件］跳到那天的子案件。
- **钱**：本地项目记在当天子案件（子案件对象的 localMgmt.batches / 持有批次 caseId）；赴韩定金 / 尾款 / 在韩加项在主案件 settlementBatches；面诊费在主案件。结算 tab 汇总并分"赴韩疗程""本地"两栏。
- **数据版本 55 → 56**（`MIGRATIONS` to:56，用户案件照 1012-09 规则保留）：只加字段（mainId = 自己、seq = 1）；旧的接续案件**不转换**，保持为各自独立的主案件，新结构上线后测试数据重来（不做任何删除）。

## 二、影响的画面和功能
- **IN**：到店后"是否接续"弹窗 → "这次来访属于哪个主案件"弹窗（新主案件 / 加入客人某个进行中主案件；一个月内同一天碰到两个主案件 → 各开一个子案件）；案件管理列表显示主案件（可展开子案件）；案件页：页头 + tab 基础资料｜流程｜子案件｜项目汇总｜结算｜附件｜Timeline，只有一个子案件时合成一页；本地管理 tab、术后管理卡并入项目汇总 / 子案件；客户详情案件记录按主案件。
- **KR / 院长**：案件列表同样主案件 / 子案件（只有本地的主案件不可见；子案件里的本地项目和钱不可见；印尼的子案件只读）；项目卡保留（操作用），新增项目汇总 tab；日历块按子案件日期不变。
- **日历 / 待办 / 通知**：落点改指向子案件 / 主案件（沿用 caseGo 统一入口）；操作锁粒度 = 主案件。

## 三、"接续案件"要拿掉的代码
followupAsk / followupAskDone / fuSet / fuRender / resumeCandidates / resumeChecksOf（接续面诊三道检查改挂主案件）/ resumeBannerHtml / continueNewVisit / resumeVisit / ongoingCasesOf / setLinkedCase / cancelFollowupLink / followupCardsHtml / followupCareCardHtml / inContCardHtml（并入项目汇总）/ c.resumeFrom / c.followup / c.linkedCase 的"接续"语义（linkedCase 保留给"复诊建议赴韩 = 新主案件轻关联"）。接续面诊 = 同一主案件新子案件（沿用 applyReuseReport，不收面诊费）。

## 四、复诊评估 / 术后管理怎么接
- 复诊评估：每次一个流程（挂在回来那天的子案件对象上，主案件 flowsOf 汇总 #1 #2…）；KR 院长评估卡、前后对比、视角参考、术前照片等元件原样沿用；复诊建议赴韩 → 新主案件 + linkedCase 轻关联。
- 术后管理：行仍存主案件 subItems；IN 做 / 预约 → 记在当天子案件（本来就记在原案件 = 主案件，现在改成同一个主案件，不再跨案件扣）；项目汇总里韩国 + 印尼合并显示。

## 五、00:00 与超过一个月
- `visitSweep()`（boot-in 每 5 秒 + KR 启动，幂等，按页面时区 todayStr）：昨天及更早、仍进行中的子案件自动结束（leftStore / visitClosed 兜底），没做完的项目回主案件"未做"；第二天早上一次性弹窗（照 1021-16 的 tripend/inclose 方式，待办 kind 复用）请室长确认。
- 术后管理超过建议日期一个月：`careOverMonthSweep()`（同样幂等）把该行转成"管理项目"（仍免费）：有新主案件 → 记到新主案件（原主案件记"已转出"、新主案件记"转入"）；没有 → 记成客人的印尼持有（带标记），下次开新主案件时带入；转出后原主案件才能结案。

## 六、分段（每段 commit 一次、跑回归）
- S1 数据层：mainId / seq、`mainOf / visitsOf / flowsOf / summaryRowsOf`、编号规则、迁移 56（不改任何画面）。
- S2 到店归属：新弹窗、接续面诊改同主案件、拿掉接续相关代码与入口，复诊评估 / 术后管理改挂子案件。
- S3 主案件页与列表（IN）：页头 / tab / 流程 / 子案件 / 单子案件合并页 / 列表展开。
- S4 项目汇总（IN + KR）并替换 IN 的项目卡 / inContCard。
- S5 钱：子案件财务栏、结算 tab 汇总分栏。
- S6 00:00 结束 + 次日弹窗 + 术后管理一个月转管理项目。
- S7 KR 案件列表 / 日历 / 待办 / 权限；经营数据案件数 = 主案件。
- S8 规则交代表、docs、测试整理。

## 七、风险
1. 接待字段（visitDate/subState/leftStore/localMgmt/materialsConfirmed 等，在 data.js 约 400 处）留在子案件对象上，所以 S2 只改"归属"不改接待；但"一个主案件有多个 CASE_ITEMS 对象"会让所有按 CASE_ITEMS 遍历的地方（统计、列表、待办、日历）重复计数——S1 提供 `mainsOf()` / `isChildVisit(c)`，S3–S7 逐处改。
2. 新编号（面诊日 = -01）和 KR 现有 -1、-2 编号不同，通知 / Timeline 里已存的旧编号文字靠 visitWords 兜底。
3. 测试用例里用到接续、followup、resumeFrom、linkedCase 的约 70 条（R86–R105 一批）会随新结构有意改变，逐条列"改前 / 改后"。
4. 该改造量大，每段都可能碰到提案没写到的规则；碰到就停。
