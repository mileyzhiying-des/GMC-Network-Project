# A 模块盘点：案件和状态 / 自动处理 / 数据保护

说明：测试列只写在 selftest.js 里确实找到的编号；「无」= 没有专门用例。规格列：一致/不一致/未写（对照 CLAUDE.md 各 CMD 记录）。新结构 = 主案件(一段服务)+流程(面诊安排/赴韩施术/复诊评估)+子案件(一天一个来访，ID=主案件号-序号)+项目汇总；「接续案件」整个拿掉。

## 一、案件和状态

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系建议 |
|---|---|---|---|---|---|---|
| A-01 | 预约时直接生成 Case ID（A000001 起，取消 Reservation ID）；取消/未到店的预约也保留 Case ID | IN 室长、客人自助 | data.js:createReservationCase / generateCaseNo | A1、A2、E1 | 一致 | 改成新结构：Case ID 改为每个来访的子案件号 |
| A-02 | 一次预约=一个案件（一次到店一个 Case），同一客人可同时有多个进行中案件 | IN | data.js:createReservationCase / ongoingCasesOf | A5 | 一致 | 改成新结构：同一服务只留一个主案件 |
| A-03 | 同一手机号=同一客人，建档沿用已登记姓名 | IN、客人 | data.js:createReservationCase / clientByPhone | E2、S40 | 一致 | 照旧：客户档案不变 |
| A-04 | 案件主状态 stage 六桶（booked/consult/travel/local/closed/reportonly/cancelled）+ postcare/krmgmt 由 deriveCaseStage 推导 | 全角色 | rules.js:deriveCaseStage；ui.js:updateCaseStage | R17a、D18 | 一致 | 改成新结构：stage 变成流程层级，子案件另有来访状态 |
| A-05 | 每次改数据后调 updateCaseStage 重算 stage/financeResult，并同步施术块、归档对话房 | 系统 | ui.js:updateCaseStage | 无 | 未写 | 改成新结构：归到主案件/子案件两层各算一次 |
| A-06 | 阶段·进程两层显示：阶段=彩色标签，进程=文字，一律用 caseStageInfo/caseProcessText 取 | IN、KR | rules.js:caseStageInfo / caseProcessText / caseStageBadge / caseStageProcText | 无专门（R58a 等引用） | 一致(CMD-1008-13) | 改成新结构：阶段来自流程，进程来自子案件 |
| A-07 | KR 看到本地管理（stage=local）案件阶段显示「—」，进程只写 KR 相关事件 | KR | rules.js:caseStageInfo / krLastStatusText | 无 | 一致 | 照旧 |
| A-08 | 复诊评估案件阶段显示「复诊评估」，进程走 revEvalProcText（等确认时间/等评估/评估中/结果已到） | IN、KR | rules.js:caseStageInfo / revEvalProcText；isRevEval | R96a、R96b | 一致 | 改成新结构：复诊评估变流程，不再独立案件 |
| A-09 | 复诊面诊在进程前加「复诊 · 」前缀（isRevisitConsult） | IN、KR | rules.js:caseProcessText | R87a | 一致 | 改成新结构：复诊评估流程已替代复诊面诊 |
| A-10 | 客人离店但复诊评估没出结果：进程「客人已离店 · 等复诊评估结果」，不结案 | IN | rules.js:caseProcessText0；ui.js:revLeaveStore | R105a | 一致 | 改成新结构：离店只关闭当天子案件 |
| A-11 | 结案类型栏：已结案=赴韩完成/本地完成/复诊评估结束；仅出报告=客人不做了/失联/其他；已取消=未到店/客人取消预约 | IN | rules.js:caseEndTypeText | R105a | 一致 | 照旧 |
| A-12 | 终态三种（已结案/仅出报告/已取消）由 computeOutcome 推算，取消原因独立保存 | 全角色 | rules.js:computeOutcome / deriveCaseStage | N1、G1、G2 | 一致 | 改成新结构：终态只在主案件，子案件另有完成/取消 |
| A-13 | 在韩到店占位案件（krVisit）KR 标完成=已结案；复诊评估有结果=已结案 | KR | rules.js:computeOutcome | BK1a/BK2a（跨账号分段） | 一致 | 改成新结构：占位预约并入子案件 |
| A-14 | 面诊费已缴/免除但报告未出时手动结束→仅出报告 | IN | rules.js:computeOutcome（manualEnd） | G1 | 一致 | 照旧 |
| A-15 | 取消原因种类：预约取消/未到店/管理取消/未购买未使用/仅办理退款；预约取消记 cancelBy=客人/室长 | IN | data.js:markNoShow；ui.js 预约取消；rules.js:hasRefundMark | A1、A2、B9、B10 | 一致 | 照旧 |
| A-16 | 预约取消的日历事件划线保留、不倒计时（cancelBy 区分旧数据） | IN | calendar：calEvHidden；boot-in.js 每秒扫描 | 无 | 一致(CMD-1014-18) | 照旧：子案件层显示 |
| A-17 | 未到店：预约时间过 N 分钟（诊所设定 noShowMinutes，默认30）还没点已到店→自动取消，记「未到店」通知 | 系统(IN) | data.js:markNoShow；boot-in.js:autoNoShowSweep；data.js:noShowMs | A2 | 一致 | 改成新结构：只对子案件(来访)判定 |
| A-18 | 在韩到店占位案件（krVisit）不按诊所时间判未到店 | 系统 | boot-in.js:autoNoShowSweep | 无 | 一致 | 拿掉：占位预约并入子案件 |
| A-19 | 未到店案件保留 Case ID，可重新预约 | IN | data.js:markNoShow | A2 | 一致 | 照旧 |
| A-20 | 接待中=已到店且基础资料未保存（receptionOpen），页面离开弹确认 | IN | data.js:receptionOpen；ui.js:intakeLeaveOk | A4 | 一致(CMD-1008-06) | 照旧：来访接待沿用 |
| A-21 | 接待未保存离开→退回待访问并清空草稿(revertIntakeToWaiting)，关分页靠心跳 | IN | data.js:revertIntakeToWaiting / writeReceptionBeat；ui.js:receptionLeaveNow | A4、R50a | 一致 | 照旧 |
| A-22 | 演示数据不能有停在接待中且基础资料未保存的案件 | 系统 | data.js:sweepStaleReceptions | 无 | 一致 | 照旧 |
| A-23 | 只有「已到店后基础资料有保存」的接待才算「操作过」(caseOperators)，代约/预约修改不算 | IN | data.js:caseOperators / caseOperatedLogs | S41 | 一致(CMD-1008-06) | 照旧 |
| A-24 | 到店当天才能点已到店（visitDate≠今天拦截） | IN | data.js:markArrived | A3 | 一致 | 照旧 |
| A-25 | 到店后弹出「是否接续/关联之前案件」（followupAsk），一个案件只问一次(followupAsked) | IN | data.js:followupAsk / followupAskDone | R95a、R86a | 一致(CMD-1022-06) | 拿掉：接续案件整个取消，改为在主案件下新增子案件 |
| A-26 | 接续三类：接续面诊/复诊评估/术后管理；接续面诊单选，复诊评估+术后管理可多选 | IN | data.js:resumePrimaryType / fuSet / resumeTypesOf | R102a、R95a | 一致 | 拿掉：接续案件整个取消 |
| A-27 | 接续候选：接续面诊只列「仅出报告」案件；术后管理/复诊评估只列赴韩已结束(krTripEnded 或已结案)的案件 | IN | data.js:resumeCandidates | R98a、R99a | 一致(CMD-1022-09/12) | 拿掉：候选逻辑变成直接选主案件 |
| A-28 | 接续面诊三道检查：距院长面诊日≤3个月、医美史无影响、项目无变化，不通过不能接续 | IN | data.js:resumeChecksOf / resumeOverdue / resumeDaysSince | R95a | 一致 | 改成新结构：同一次面诊延伸=主案件，检查移到「是否仍属同一次面诊」 |
| A-29 | 接续后 c.resumeFrom={caseId,type,types}，原案件号写关联，新案件走复诊/术后来访流程 | IN | data.js:followupAskDone；revIntent | R95a、R96a | 一致 | 拿掉：接续案件取消 |
| A-30 | 复诊评估接续不收面诊费，状态「复诊评估 · 等确认时间」 | IN、KR | data.js:revIntent；followupAskDone | R96a、R99a | 一致 | 改成新结构：复诊评估作为流程 |
| A-31 | 旧「接续到原案件」条：同客人有进行中案件时提示接续，接续时本次新案件作废(splice)并改挂日历 | IN | data.js:ongoingCasesOf / resumeBannerHtml / continueNewVisit；ui.js:resumeVisit | A5、R18a | 一致(CMD-1015-18;1022-04 已改默认不接续) | 拿掉：接续案件取消，改在主案件加子案件 |
| A-32 | 来访目的=术后管理且客人有术后管理阶段案件→默认接续该案件 | IN | data.js:resumeBannerHtml / followupAsk | R18a、R86a | 一致 | 拿掉 |
| A-33 | 从「未安排预约」预约的来访带 c.careFor，到店默认关联对应案件 | IN | data.js:followupAsk；todo.js:todoCbGo | R58a、R71a | 一致(CMD-1020-07) | 改成新结构：直接挂主案件的子案件 |
| A-34 | 关联之前案件下拉：只列基础资料已确认的同客人案件；选了即改走术后/复诊流程 | IN | data.js:clientPriorCases / setLinkedCase / cancelFollowupLink | A6、R94a | 一致 | 拿掉：关联案件被主案件取代 |
| A-35 | 关联只往前：本案件只显示关联的旧案件，无「后续关联」入口，无关联就不显示关联案件 tab | IN、KR | ui.js:relatedTabHtml；kr.js:krTabRelated | R94a、R94b | 一致(CMD-1013-12) | 拿掉 |
| A-36 | 复诊面诊关联锁定原案件院长/医院；免除面诊费默认「复诊」 | IN | data.js:syncDirectorChoice / applyCaseLink | A6、R86a | 一致 | 改成新结构：同一主案件天然同院长 |
| A-37 | 术后来访：关联案件印尼术后管理在本案件本地管理 tab 做完→记在原案件 | IN | data.js:followupCareCardHtml / confirmCareUse | R86a、R107a | 一致 | 改成新结构：直接在子案件做 |
| A-38 | 案件列表 tab：全部｜预约到店｜面诊安排｜赴韩施术｜在韩管理｜术后管理｜复诊评估｜本地管理｜仅出报告｜已结案｜已取消 | IN | data.js:CASE_TABS；rules.js:caseTabKey；ui.js:renderCaseRows | R105a(2956) | 一致 | 改成新结构：tab 按流程分，主案件一行 |
| A-39 | 列表筛选：「有退款」「仅看我的」(caseOperators)；结束 tab 表头改「结案类型」 | IN | ui.js:renderCaseRows / CASE_ONLY_MINE | S41、R105a | 一致 | 照旧 |
| A-40 | 列表排序：按最近更新(caseUpdatedKey)，开始时间栏 caseStartKey | IN、KR | rules.js:caseUpdatedKey / caseStartKey | 无 | 一致(CMD-1015-05;1015-17) | 改成新结构：▼ 展开子案件即子案件列表 |
| A-41 | 案件列表 Case ID ▼ 展开子案件行，显示「到院 · 日期」+灰字编号 | IN、KR | ui.js:caseRowToggle；kr.js:krRowToggle | R49a、R17b | 一致 | 改成新结构：子案件=一天一个来访，天然匹配 |
| A-42 | 客户详情案件记录：Case ID/日期/状态，有关联的写「关联 A… · 复诊」 | IN、KR | data.js:clientDetailBodyHtml / cliProjectGroups | R61a、R61b | 一致 | 改成新结构：按主案件分组 |
| A-43 | 案件页头：客人名(链接)·第N次来访；小字 Case ID·对接院长；术后来访加「术后来访·关联」 | IN | ui.js:caseVisitNo / renderCaseTitle / renderCaseSubtitle | R86a | 一致(CMD-1013-09) | 改成新结构：第N次来访=子案件序号 |
| A-44 | Timeline 记录统一入口 logCaseEvent（带 stage/actor/actorId/时间/版本章），种子不盖章 | 全角色 | data.js:logCaseEvent / gmcVerStamp | 几乎所有用例 | 一致 | 改成新结构：记录要带子案件号 |
| A-45 | Timeline 阶段推算 tlStageOf：确认项目/结算归「项目确认/结算」；施术/术后/管理项目按项目类型 | IN、KR | data.js:tlStageOf / tlTypeOf / stageLogLabel | R50a、R57a | 一致(CMD-1019-21 四) | 改成新结构：阶段=流程，另按子案件分组 |
| A-46 | Timeline 合并/筛选：类型(进度/金额/沟通/资料)+显示系统记录开关+日期分组，最新在上 | IN、KR、院长 | data.js:caseTimelineBlockHtml / tlMerge | R50a | 一致 | 照旧 |
| A-47 | 复诊评估新记录不用「面诊」字样 | IN | data.js:logCaseEvent(revIntent) | R104a | 一致(CMD-1022-18) | 改成新结构：复诊评估流程内部文案 |
| A-48 | KR 视角 Timeline 隐藏金额类/客户修改记录(viewerLogHidden)，KR 的客户详情只显示案件开始/结案 | KR | data.js:viewerTextFilter / viewerLogHidden | S38 | 一致 | 照旧 |
| A-49 | 客人离店(leftStore)/结束后案件只读：做了显示已完成，没做无按钮 | IN | data.js:inContCardHtml 等（leftStore） | R107a、R105a | 一致(CMD-1022-19) | 改成新结构：子案件完成即只读 |
| A-50 | 结案守卫 mainlineOngoing：面诊/赴韩未完成时本地做完不结案；钱没清不结束(closeBlockers/autoFinish) | IN | data.js:mainlineOngoing / closeBlockers / autoFinish | N1、G4 | 一致(CMD-1013-16) | 照旧：主案件结案条件 |
| A-51 | ［结束案件］只在接待中且付定金前，IN 室长/管理者可用；逐项选收款/取消/转持有/退款并必填原因 | IN | data.js:canEndCase；ui.js:openEndCase / confirmEndCase | G1-G4、N3 | 一致 | 改成新结构：结束主案件 vs 结束某天来访两个入口 |
| A-52 | 手动结束后 c.manualEnd 记录原因，结局由 computeOutcome 判 | IN | ui.js:confirmEndCase；rules.js:computeOutcome | G1、G2、G3 | 一致 | 照旧 |
| A-53 | 本地管理只能当天加（面诊/赴韩案件里）：localAddAllowed | IN | data.js:localDayLimited / localAddAllowed | N2 | 一致 | 改成新结构：按子案件(当天)天然限制 |
| A-54 | 本地案件(isLocalCase)=基础资料确认后选不面诊或面诊取消后做本地，走选择项目→本地管理 | IN | rules.js:isLocalCase；data.js:localTrack | B6、B12 | 一致 | 改成新结构：本地流程变子案件内的项目 |
| A-55 | 面诊费：选面诊时记入案件(consultFeeOf)，免除原因复诊/延续等；一个案件只面诊一次 | IN | data.js:recordConsultFee / consultFeeOf | R64a、R91a | 一致 | 改成新结构：面诊费挂主案件 |
| A-56 | KR 到院状态卡：任意流程到院当天出现，主到院/子到院已有「子案件」概念，画面叫「到院」不叫子案件 | KR | kr.js:krArriveCards / krCaseCardHtml；data.js:subCaseList / subCaseKey / visitWords | R47a、R49a、R80a | 一致(CMD-1019-20) | 改成新结构：与新子案件概念合并，ID 改 主案件号-序号 |
| A-57 | 术后管理阶段：施术完成且有术后管理→postcare；有 KR 术后管理没做完不结案 | IN、KR | rules.js:deriveCaseStage；data.js:carePending | R17a、D19 | 一致 | 改成新结构：术后管理变子案件 |
| A-58 | 韩国行程结束 → 阶段「术后管理（印尼）」；IN 点结案才结（或每日问） | KR、IN | data.js:coreTripEnd / coreInClose | R84a | 一致(CMD-1021-16) | 改成新结构：保留为主案件结案动作 |
| A-59 | 同一客人同一天只有一个预约（没到店的）：新预约合并进去 | IN、KR、客人 | data.js:pendingResvSameDay / krVisitTimeOnDate | R84a | 一致(CMD-1021-16) | 改成新结构：一天一个子案件，天然成立 |
| A-60 | 一个案件结束不影响同一客人的其他预约（已删 cancelFollowUpReservations） | IN | 无（已删函数） | 无 | 一致(CMD-1020 第29轮) | 照旧 |
| A-61 | 案件对话房：缴/免面诊费建房，终态归档(archiveCaseRoom) | IN、KR | ui.js:archiveCaseRoom / ensureCaseRoom | R101a | 一致 | 改成新结构：房间挂主案件 |
| A-62 | 打开案件统一入口(caseGo)：同账号同案件只开一个分页，跨分页定位 | IN、KR | ui.js:caseGo / caseRegBeat | R34a、R38a | 一致(CMD-1019-08) | 照旧 |
| A-63 | 客户页基础信息/护照/医美史只存一份于客户档案，案件内修改同步 | IN、KR | data.js:clientBasicBlockHtml / saveClientEdit | R40a、R61b | 一致 | 照旧 |

## 二、自动处理

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系建议 |
|---|---|---|---|---|---|---|
| A-64 | 每5秒扫未到店（autoNoShowSweep），启动时也扫一次 | 系统(IN) | boot-in.js:autoNoShowSweep（setInterval 5000） | A2 | 一致 | 改成新结构：对象换成子案件 |
| A-65 | 每5秒扫接待心跳过期(90秒)的接待中案件，退回待访问；离开页面只写20秒宽限 | 系统(IN) | boot-in.js；data.js:sweepStaleReceptions / receptionLeaveNow | A4、R50a | 一致(CMD-1019-21 五) | 照旧 |
| A-66 | 占位预约每秒扫：剩5分钟提醒、超时移除记预约历史、已转预约收掉 | 系统(IN) | boot-in.js（setInterval 1000）；data.js:phConverted | E4、E5 | 一致 | 照旧 |
| A-67 | 等待报告超时只发一条通知(overdueNotified)，每秒检查 | 系统 | boot-in.js（同上 interval）；data.js:simulateReportTimeout | R14 等(无) | 一致(CMD-1008-14) | 改成新结构：复诊评估同样判断 |
| A-68 | 启动修复 repairWronglyClosedCases：恢复被误结案的案件（用旧判断 mainlineOngoingRepair） | 系统 | data.js:repairWronglyClosedCases；boot-in.js | 无 | 一致 | 改成新结构：迁移后可删 |
| A-69 | 启动修复 repairVisitState：旧待付款管理项目转持有、旧 memo 迁移、fixUseRecords 修使用记录 | 系统 | data.js:repairVisitState；boot-in.js / krBoot | R52a | 一致 | 改成新结构：迁移时一次性做，之后拿掉 |
| A-70 | 启动修复 repairScheduleGaps：补确认施术时间时缺的地址与 -1 施术子案件 | 系统 | calalign.js:repairScheduleGaps | 无 | 一致 | 改成新结构：子案件改号后需重写 |
| A-71 | 启动修复 repairOffConflicts：删与院长已有施术/面诊/预约重叠的 OFF | 系统 | calalign.js:repairOffConflicts | CAL8 | 一致 | 照旧 |
| A-72 | 启动修复 repairHandToIn：补发「交给印尼」从没通知过的行 | 系统 | data.js:repairHandToIn | R58b | 一致 | 改成新结构：随术后管理重做 |
| A-73 | 启动清理 sweepStaleSurgeryBlocks：清取消/无效案件的院长日程施术块；读不到案件不动 | 系统(KR) | data.js:sweepStaleSurgeryBlocks | 无 | 一致(CMD-1012-10) | 照旧 |
| A-74 | 补项目库/默认资料类修复：backfillLocalLib、krBackfillDurations、gmcFillKrMeta | 系统 | data.js:backfillLocalLib / krBackfillDurations | 无 | 一致 | 照旧 |
| A-75 | careReturnSweep（客人回国自动结案）已删，不再自动结案；改 KR 每日问「韩国行程是否结束」+ IN 每日问「是否结案」 | 系统→KR/IN | data.js:tripAskDue / coreTripEnd / inCloseDue / coreInClose；todo.js | R84a | 一致(CMD-1021-16) | 改成新结构：主案件结案提示保留 |
| A-76 | 暂不结束/暂不结案：当天不再问，次日营业开始时间起再问（tripSnooze/inCloseSnooze） | KR、IN | data.js:tripAskDue / inCloseDue | R84a | 一致 | 照旧 |
| A-77 | 00:00 锁定：到院日=今天才可重开已完成到院；过 00:00 按钮消失 | KR | data.js:coreReopenVisitAt / visitCompletedToday | R79a | 一致(CMD-1021-11) | 改成新结构：子案件关闭规则 |
| A-78 | 昨天到院未标客人已离院→次日 KR 待办提醒（不自动结束） | KR | todo.js；data.js:subVisitAskEnd | R51b | 一致(CMD-1019-22) | 改成新结构：子案件未完成提醒 |
| A-79 | 演示时钟：demoNow/realNow/todayStr；「模拟隔天」和「演示时间」叠加 | 开发/测试 | rules.js:realNow / demoClockShiftMs；coverage.js | N2 | 一致 | 照旧 |
| A-80 | 定时器清单：todoTick 30s/5s、presBeat 5s、opBeat、store save 每2秒、caseRegBeat 3s、版本比对5s | 系统 | todo.js；ui.js；store.js | 无 | 未写 | 照旧 |
| A-81 | 超出一个营业时段的测试辅助：testprep 一键准备案件，prep:true | 开发 | testprep.js | 无 | 一致 | 改成新结构：夹具要重写 |

## 三、数据保护

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系建议 |
|---|---|---|---|---|---|---|
| A-82 | 数据版本 DEMO_DATA_VERSION 变了：自动备份→只重置演示数据→恢复用户案件并按 MIGRATIONS 迁移 | 系统 | data.js 开头版本检查；store.js:MIGRATIONS / carryRestore | R16c、R39a、R52a | 一致(CMD-1012-09) | 改成新结构：新增一条迁移(to:56)把旧案件并成主案件+子案件 |
| A-83 | 每次升版本须加 MIGRATIONS 一条 + 汇报迁移数 | 开发 | store.js:MIGRATIONS | R16c | 一致 | 照旧 |
| A-84 | 迁移前后用户案件数量须对得上，不符则停止升级/不写档并红条提示 | 系统 | data.js:gmcUserCaseCountRaw；store.js:GMC_CARRY_CHECK / gmcShowBlock | R63a | 一致(CMD-1020-12) | 照旧 |
| A-85 | 迁移失败的案件不删，写迁移记录，覆盖页列出 | 系统 | store.js:carryRestore；coverage.js | R63a | 一致 | 照旧 |
| A-86 | gmcResetAll：有用户案件时「全部清空」默认拒绝，测试一律 gmcResetAll(原因,true) | 全角色/测试 | data.js:gmcResetAll | R63a | 一致(MEMORY) | 照旧 |
| A-87 | 每次重置/升级前普通备份(gmc_backup_*，只留1份) + 用户案件安全备份 gmc_cfg_usersafe（最近2份） | 系统 | data.js:gmcBackupMake / gmcBackupKeep / gmcUserSafeSave / gmcUserSafeRestore | R63a | 一致 | 照旧 |
| A-88 | 存档读失败保护：原档有客人/案件时不清空不写种子，原档备份 gmc_cfg_rawsafe，页面不写档 | 系统 | store.js(GMC_LOAD_PROTECT)；data.js:gmcResetAll 拒绝 | 无 | 一致(CMD-1022-12) | 照旧 |
| A-89 | 存档写失败先腾空间（删备份→删旧通知/短信/日志→瘦 Timeline），绝不清用户案件 | 系统 | store.js:save；storepack.js | 无 | 一致(CMD-1015-05) | 照旧 |
| A-90 | 大键透明压缩 lz-string（>30万字符） | 系统 | storepack.js | 无 | 一致 | 照旧 |
| A-91 | 存档 gmc_state(全局)+gmc_clinic_*(每诊所)分区；多标签页 storage 事件同步，弹窗/输入中延后重画 | 系统 | store.js:init / safeRefresh；data.js:GLOBAL_VAR_NAMES / CLINIC_VAR_NAMES | S40 | 一致 | 改成新结构：新变量须登记进 CLINIC_VAR_NAMES |
| A-92 | 升级保留项：账号/诊所设定/项目库/案例库/活动价/套餐/memo（指纹 _h 判断用户改动），客人案件按规则带回 | 系统 | data.js:KEEP_ON_VERSION_RESET；store.js:cfgMergeProjects / cfgMergeById | R63a | 一致(CMD-1012-09 补二) | 照旧 |
| A-93 | 数据版本 44 曾一次性清空所有客人与案件（gmcCarryDropCases），之后恢复保留规则 | 系统 | data.js:gmcCarryDropCases / gmcWipeClinicVars | 无 | 一致(CMD-1015-06) | 拿掉：只是历史一次性 |
| A-94 | 迁移步骤清单（37–55）：项目改名/字段补默认值/术后管理持有转回原案件(migrateCareHoldings)等，幂等 | 系统 | store.js:MIGRATIONS / migrateCareHoldings | R16c、R39a、R52a、R16 系 | 一致 | 改成新结构：旧迁移不动，新迁移追加 |
| A-95 | 同账号同案件第二个分页：presence 遮罩，［在这里继续］抢持有权，原分页只读(inert) | IN、KR | ui.js:presBeat / presTick / presContinueHere / presReadonly | R34a | 一致(CMD-1012-01) | 改成新结构：锁定粒度需决定主案件还是子案件 |
| A-96 | 不同账号室长操作锁 gmc_case_operator(40秒TTL)：第二人只读，点操作弹窗［取消］［接管］，接管写 Timeline | IN 室长间、KR 室长间 | ui.js:opBeat / opTick / opGuard | 无专门 | 一致(CMD-1014-17/18) | 改成新结构：锁主案件 |
| A-97 | 院长/老板不参与操作锁；IN 与 KR 互不锁 | 全角色 | ui.js:opGuard | 无 | 一致 | 照旧 |
| A-98 | 操作人离开后只读者自动升为操作人，toast「你现在可以操作了」 | IN、KR | ui.js:opTick | 无 | 一致 | 照旧 |
| A-99 | 已知：存档为诊所分区「最后写入者覆盖」，无版本号合并（交接给后端处理） | 系统 | store.js:save | 无 | 一致(CMD-1012-01 交接注意) | 照旧：后端重做 |
| A-100 | 测试覆盖页 coverage.js 不加载 data.js，直接读存档，不触发升级；演示案件 demo:true 不计覆盖，用户案件按 id 兜底 | 开发 | coverage.js:parseRaw；store.js:demoMarked | 无 | 一致 | 改成新结构：CHECKS 需按新状态重写 |
