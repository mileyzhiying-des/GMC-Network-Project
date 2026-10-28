# 画面直接读旧字段审计（案件结构 v2，基于分支 feature/case-structure-v2）

说明：列＝ 编号｜函数（文件）｜直接读的旧字段｜类(a一天/b流程/c关系/d项目汇总)｜改成用｜难度｜只影响显示？
「新增」指下面末尾「必须新增的 S1 函数」清单里的名字。现状：S1 的 visitsOf/flowsOf/summaryRowsOf **自己内部也读旧字段**（它们是翻译层，后端换结构时只改这几个函数 + 新增函数的内部）。

## ui.js
1. renderCaseStatusBar（ui.js）｜subState、visitDate/visitTime、leftStore、visitClosed、consultStatus｜a,b｜inVisitOf(c)（新增）+ flowStepOf(m,'consult')（新增）｜中｜是（按钮动作另算）
2. caseVisitNo（ui.js）｜按 name 过滤 CASE_ITEMS，用 subState==='arrived'、visitDate/visitTime 排序算「第 N 次来访」｜a｜visitsOf(mainOf(c)) 里 own 且 place==='IN' 的 seq（或新增 visitNoOf）｜易｜是
3. subVisitText（ui.js）｜subItems 的 booked/date、visitDate、linkedCase｜a,c,d｜visitsOf(m) + relatedOf(c)（新增）｜中｜是
4. renderCaseSubtitle（ui.js）｜linkedCase、resumeFrom、followup 拼「术后来访·关联…」副标题｜c｜relatedOf(c)（新增）/ mainOf(c)｜易｜是
5. renderCaseBody（ui.js）｜按 subState 决定显示哪个正文｜a｜inVisitOf(c).state｜易｜是
6. showKrTab / showLocalTab（ui.js，调到 data.js 的 caseTabsHtml）｜consultStatus、procedureItems、本地批次｜b,d｜flowsOf(m)（已有 flowTabKeys 在用）｜易｜是
7. confirmMaterials（ui.js）｜写 linkedCase / followup / consultStatus｜c,b｜—（写入入口，换后端时改成「创建/关联主案件」API）｜难｜否
8. refundServiceBarHtml（ui.js）｜linkedCase、客人持有批次 refundableBatches｜c,d｜clientHoldingsOf(name)（新增）｜中｜是
9. refundableBatches / settleProjects / confirmRefund / refundCard（ui.js）｜直接遍历 CLIENT_HOLDINGS 批次、procedureItems 做退款｜d｜projectUnitsOf(m)（新增）；退款写入保留｜难｜否
10. renderClientHoldings（ui.js）｜CLIENT_HOLDINGS 批次、procedureItems｜d｜clientHoldingsOf(name)｜中｜是
11. saveClientEdit（ui.js）｜写客户档案并遍历案件刷新｜d｜—（客户字段，不属四概念）｜易｜否
12. openRescheduleModal / confirmReschedule（ui.js）｜读写 visitDate、visitTime（预约改期）｜a｜读 inVisitOf(c)；写保留｜难｜否
13. confirmCancel / confirmAddSlotExisting（ui.js）｜写 subState='cancelled'、visitDate｜a｜读 inVisitOf；写保留｜难｜否
14. resumeVisit（ui.js）｜splice CASE_ITEMS、写 RESUMED_VISITS、改 linkedCase/resumeFrom｜a,c｜新主案件/子案件创建 API（新增 createChildVisit(mainId, rec)）｜难｜否
15. revLeaveStore（ui.js）｜写 leftStore｜a｜写保留（改成 endVisit(c) 新增）｜中｜否
16. endCaseRows / openEndCase / confirmEndCase（ui.js）｜consultStatus、procedureItems、批次｜b,d｜flowsOf(m) + projectUnitsOf(m)｜难｜否（写 manualEnd/本地批次）
17. cancelConsult / openCancelItems（ui.js）｜consultStatus、procedureItems｜b,d｜flowStepOf、projectUnitsOf；写保留｜难｜否
18. submitHoldingsUse（ui.js）｜linkedCase + 持有批次｜c,d｜relatedOf(c) + clientHoldingsOf｜难｜否
19. 日历/工作台渲染（ui.js 内 renderCalendar 一族，11 处 visitDate/visitTime）｜直接读 c.visitDate/visitTime 画事件、今日来访｜a｜visitsOnDate(date)（新增，内部用 visitsOf）；calendarEvents 先改｜中｜是
20. gmcPageTitle / 分页登记（ui.js）｜用 caseId 打开分页，粒度已是主案件（S7）｜—｜无需改｜—｜—

## data.js — 列表 / 日历 / 客户（a 为主）
21. visitStateOf（data.js）｜subState、noShow、cancelBy｜a｜inVisitOf(c).state（新增）｜易｜是
22. calendarEvents（data.js）｜遍历 CASE_ITEMS 读 visitDate/visitTime/visitPurpose/krSchedule.confirmedDate/subItems 画来访、施术、术后到院事件｜a｜visitsOf(m)（mainsOf 遍历）+ visitsOnDate（新增）｜中｜是
23. resvHistoryRows（data.js）｜visitDate、subState、占位历史｜a｜visitsOf / inVisitOf｜中｜是
24. clientCurrentCases / clientPastRecords / customerCancelCase（data.js，客人端「我的预约」）｜visitStateOf、visitDate、krAllItems｜a,d｜mainsOf(客人) + visitsOf + summaryRowsOf｜中｜是（cancel 写 subState：否）
25. krVisitTimeOnDate / pendingResvSameDay（data.js）｜按客人+日期找未到店预约，读 visitDate/visitTime/subItems.date｜a｜visitsOnDate(date).filter(name)｜易｜是
26. ksTimeText / krToClinic 使用处（data.js）｜krSchedule.confirmedDate/confirmedTime｜a｜tripOf(m)（新增）.date/time｜易｜是
27. mainVisitDay（data.js）｜krArrivedDay / confirmedDate｜a｜tripOf(m).day（新增）｜易｜是
28. smsVarsOfCase / surgMsgKey / surgMsgText / calKey / calDaysToSurgery（data.js、calalign.js）｜confirmedDate/confirmedTime｜a｜tripOf(m)｜易｜是
29. submitSelfBooking（data.js）｜写 visitDate/visitTime/purpose 新建案件｜a｜—（创建入口，保留；后端换成 create API）｜难｜否
30. makeCase / createReservationCase（data.js）｜写全部旧字段（visitDate、subState、consultStatus、linkedCase…）｜a,b,c｜—（唯一创建口，改后端时整体替换）｜难｜否
31. seedFixVisits / seedSurgeryCase / seedConsultBlocks（data.js 种子）｜写 visitDate/subState/consultStatus｜a,b｜演示数据，随后端丢弃｜—｜否
32. localAddAllowed / canEndCase / finishCase / repairWronglyClosedCases（data.js）｜arrivedDay/visitDate、procedureItems、subState｜a,d｜inVisitOf + flowsOf｜难｜否（finishCase 写结局）
33. caseSubStatusItems / consultCarryStage / consultSubItems / consultTabHtml / wantConsultRowHtml / urgeInfo / reportWaitSubItems（data.js）｜consultStatus 逐状态分支｜b｜flowStepOf(m,'consult')（新增，返回 step 字符串）｜中｜是（consultTabHtml 内按钮动作写 consultStatus：否）
34. coreSubmitReport / 面诊推进函数（data.js）｜写 consultStatus='report_ready' 等｜b｜—（流程推进 API）｜难｜否
35. caseTabsHtml / caseTabContentHtml（data.js，非 v2 分支）｜consultStatus、linkedCase 决定 tab｜b,c｜flowsOf(c)（v2 分支已用 flowTabKeys）｜易｜是
36. closeBlockers（data.js）｜consultStatus、批次待付｜b,d｜flowsOf + summaryRowsOf｜中｜是
37. tlVisitDayText / caseTimelineEntries（data.js）｜subItems 按日期归类 Timeline 日小标题｜a｜visitsOf(m).types｜易｜是
38. caseStartKey / caseUpdatedKey / caseEndTypeText（rules.js）｜visitDate/visitTime 兜底｜a｜visitsOf(m)[0]｜易｜是

## data.js — 关系 / 接续（c）
39. relLinksOf / relatedBlockHtml / relatedTabHtml / cliCasesHtml（data.js）｜linkedCase、relLinks、cliCasesHtml 用关联｜c｜relatedOf(c)（新增）：返回 {mainId, type, reason, kind}｜中｜是
40. setLinkedCase / applyCaseLink / cancelFollowupLink（data.js）｜写 linkedCase / followup｜c｜—（关联写入，保留为一个 API）｜难｜否
41. followupOn / followSrc / followupAsk / followupAskDone / followupCardsHtml / followupCareCardHtml / fuRender / toggleResumeType（data.js）｜linkedCase、followup、resumeFrom、visitDate｜a,c｜relatedOf(c) + inVisitOf(c)；写入保留｜难｜否（followupAskDone 写）
42. resumeBannerHtml / ongoingCasesOf / isResumeConsult / hasResumeType / resumeTypesOf / resumeCandidates / localMainsWithLeft（data.js）｜resumeFrom、subState、RESUMED_VISITS、stage｜a,c｜mainsOf(客人).filter(未结束)（新增 openMainsOf(name)）+ childVisitsOf(m)｜中｜是（resumeBannerHtml 的［接续］按钮写：否）
43. isContCase / inContCardHtml / directorLockInfo / directorRowHtml（data.js）｜linkedCase 锁院长、reuseReport｜c｜relatedOf(c)｜易｜是
44. relatedFollowers（data.js）｜反向找 linkedCase 指向我的案件｜c｜childVisitsOf(m)｜易｜是
45. caseTypeOf（rules.js）｜resumeFrom.type、isRevEval(c)｜b,c｜relatedOf(c).type 或 visitsOf().types｜易｜是
46. isRevEval / isRevisitConsult / revEvalProcText / caseProcessText0 / caseStatusLabel / caseStatusSub / caseStatusBadge / computeOutcome（rules.js）｜revisitEval、consultStatus、recoveryResult、subState｜b｜revisitFlowOf(c)（新增）；consultStatus→flowStepOf｜中｜是
47. revEvalTabHtml / startRevisitEval / revRecText / revResultCardHtml / revEvalResultHtml / revRecCardHtml / revCmpHtml / revSrcLineText（data.js 复诊评估）｜revisitEval、recoveryResult、linkedCase｜b,c｜revisitFlowOf（新增）+ flowsOf kind=revisit；startRevisitEval 写：否｜中｜revEval* 只显示：是；startRevisitEval：否
48. isArrived / isLocalCase / deriveCaseStage（rules.js）｜subState、visitDate、scheduleState｜a,b｜inVisitOf / tripOf｜中｜是（deriveCaseStage 写 stage：否）
49. krCaseVisible / caseHasKrSide / caseRoomEligible / canCancelConsult / caseTabKey（rules.js）｜consultStatus、subState｜b｜flowStepOf｜易｜是
50. tzRender / visitWords / visitOrdText（rules.js）｜用 subCaseNo/行号换「第 N 次到院」｜a｜visitsOf(m).no｜易｜是

## data.js — 一天 / 到院（a，子案件分组）
51. subCaseKey / subCaseList / subCaseRows / subCaseNums / subCaseNo / subCaseNos（data.js）｜subItems 按 date+place 分组｜a｜**这就是 visitsOf(m) 的前身**：两套并存，应合并为 visitsOf（把 rows 挂到 v.rows）｜中｜是
52. visitCalBlocks（data.js）｜subCaseRows → 日历块（施术/术后/管理）｜a｜visitsOf(m) 带 rows（新增 v.rows）｜中｜是
53. visitRowType / visitRowLabel / visitRowLabelHtml / careEntryOfRow（data.js）｜subItems 行的类型/标签｜a,d｜summaryRowsOf 行 or visitsOf rows｜易｜是
54. mainVisitDay / rowVisitKey / visitAtParts / visitAtText / useVisitDate（data.js）｜krArrivedDay、confirmedDate、s.date｜a｜visitsOf(m) 反查 + tripOf｜中｜是
55. coreVisitState / coreVisitRows / coreSubArrived / visitCompletedToday / anyVisitCompletedToday / subVisitAskEnd / visitEndedKeys（data.js）｜按到院 key 读 visitEndedKeys、s.arrived｜a｜visitsOf(m)[i].state（新增 state='pending|arrived|done|cancelled'）｜中｜读：是；write：否
56. tripOpenVisits / tripLastVisitDay / tripLeftList / inCareVisits / inCloseOpenVisits / inCloseOpen（data.js）｜subItems 未做行、visitDate｜a,d｜visitsOf(m).filter(未完成)｜中｜是
57. syncSurgerySub / coreSubAdd / coreSubEdit / coreSubDel / coreSubTimeEdit / coreCareBook / coreUnitBookUse / coreRowCancel / coreRowPostpone / coreCareToIn / holdLocalAdd（data.js）｜**写** subItems / date / place / skipped｜a,d｜—（写入入口，是后端「建/改到院」API）｜难｜否
58. syncSurgeryBlock / sweepStaleSurgeryBlocks / syncConsultBlock（data.js）｜按 confirmedDate 写院长日程块｜a,b｜tripOf(m)；写保留｜中｜否
59. inheritVisitArrival / coreMarkArrived / coreUnarrive / markArrived / markNoShow / autoNoShowSweep（data.js、boot-in.js）｜读写 subState、arrivedDay、leftStore、visitClosed｜a｜读：inVisitOf；写保留｜难｜否
60. visitSweep / careOverMonthSweep（data.js）｜v2 新写，读 ch.arrivedDay/visitDate/leftStore/subItems｜a,d｜inVisitOf / summaryRowsOf（本来在 S1 之后写，可改）｜易｜否（写 autoEnded/transferred）
61. caseArrivedEver（data.js）｜subState/arrivedDay｜a｜inVisitOf / visitsOf｜易｜是
62. inCareBooking / inCareEntries / careDayText / careSlotList / careUnits（data.js）｜读预约案件 visitDate + subItems 判断已约/未约｜a,d｜visitsOf + projectUnitsOf｜中｜是

## data.js — 项目汇总（d）
63. getClientHoldings / clientHoldingsView / holdingsAllSorted / clientHeldRemaining / clientHoldingsSorted / postCareBatchesOf（data.js）｜CLIENT_HOLDINGS 直接遍历（印尼本地持有）｜d｜clientHoldingsOf(name)（新增，含 IN/KR/术后）｜易｜是
64. localPurchasedBatches / localPurchasedBatchesOf / holdingBatchSet / localMgmtTabHtml / localEntryChoiceHtml（data.js）｜按案件 id 挑批次｜d｜summaryRowsOf(m) 里 type='本地管理' 行｜中｜是
65. inProjectCardHtml（data.js）｜procedureItems + 术后 subItems + 备注｜d｜projectUnitsOf(m)（新增）｜难｜是
66. inMgmtCardsHtml / inCareCardsHtml / inHoldCardHtml 一族（data.js）｜procedureItems（管理项目）、it.uses、holdUsed｜d｜projectUnitsOf(m) 过滤 type 管理｜中｜是
67. inPostcareCardHtml / inHoldMgmtHtml / openCareUse / confirmCareUse / postcareDueList / clientCareLeft / clientCareLeftAll / carePending / careRows（data.js）｜subItems 术后管理行、postcareUses、linkedCase｜c,d｜projectUnitsOf(m,{type:'术后管理'}) + relatedOf｜中｜是（confirmCareUse 写：否）
68. cliHoldKrRows / cliProjectGroups / cliItemDoneDate / cliHoldKrHtml（data.js 客户详情）｜遍历 model.cases 的 procedureItems/subItems/uses 自己算 使用日期｜d,a｜按客人遍历 mainsOf → summaryRowsOf(m)（行里已有 usedAt/uses）｜中｜是
69. projectPickerHtml / caseProjectNames / isProjectInUse / caseHasPurchase（data.js、rules.js）｜procedureItems、consultStatus｜b,d｜summaryRowsOf｜易｜是
70. printPlanSchedule / printKrPlan（data.js）｜subItems + confirmedDate 排日程表｜a,d｜visitsOf(m) + summaryRowsOf｜中｜是
71. caseNotesAll / visitProjectNotes / memoVisitGuess / krVisitLabelByKey（data.js、kr.js）｜按 vk（到院 key）归 memo｜a｜visitsOf(m).key（新增 v.key 已有）｜易｜读：是；写 memo.vk：否
72. settlementCardHtml / settleTabHtml 底层（rules.js、data.js）｜settlementBatches + procedureItems｜d｜保留（S5 已按子案件分组）；项目名走 summaryRowsOf｜易｜是
73. caseAttachments（data.js）｜procedureItems、subItems 生成附件名｜d｜summaryRowsOf｜易｜是

## kr.js
74. krKidsOf（kr.js）｜S7 新写，已用 visitsOf/childVisitsOf，仍读 ch.subState/visitDate 展示状态｜a｜visitStateText→ inVisitOf 状态｜易｜是
75. krAllCases（kr.js）｜子案件过滤 + consultStatus 判断「已缴/免面诊费」｜b,a｜flowStepOf + mainsOf｜中｜是
76. krTabOf / krKeyTime / krUrgency / krDefaultCaseTab / krIsDirector / krRenderCaseRows / krArrivalsHtml（kr.js）｜consultStatus、confirmedDate/Time、subItems 算 tab 分类、到院时间排序、紧急程度｜a,b｜flowStepOf + tripOf + visitsOf(m) 最近一天｜中｜是
77. krCaseCards（kr.js，到院卡总入口）｜krSchedule.confirmedDate、subCaseList(c)、visitEnds、visitPostponed 拼 今天/已预约/已完成 三组｜a｜visitsOf(m)（v.state + v.rows，新增 visitRowsOf(m,v)）｜难｜是（但卡内按钮写入）
78. krCaseGroupsHtml / krCaseCardHtml / krTblRow / krMainRowsHtml / krVisitWhat / krVisitDirTag / krVisitDoneSig / krEndAskKey / krMemoVisitLabel（kr.js）｜subCaseKey、行 s.date/place、按钮 id 带 key｜a,d｜visitsOf(m)[].key + rows｜难｜读是，按钮 handler 否
79. krArriveCards / krSurgHead / krSubStatusText / krSurgSub / krOpenSubCard / krOpenSubHl / krDoneDayReopen / krVisitPop / krTodayVisits（kr.js）｜confirmedDate、arrivedDay 判断今天待到院/到店｜a｜tripOf + visitsOf｜中｜是
80. krProjCards（kr.js 项目卡 4 tab）｜procedureItems、subItems、it.uses、holdUsed、careUnits 算 未使用/已预约/已完成｜d,a｜projectUnitsOf(m)（新增）→ units.state/.bookedVisit/.doneVisit｜难｜是（按钮写）
81. krTabItems / krUsedRow / krViewCase / krUnitUseNow / mgTodayQty / krHoldCard / krHoldList / krPayOpen / krFixOpen / krSettleConsentNames（kr.js）｜procedureItems 遍历｜d｜projectUnitsOf｜中｜读是，写否
82. krTabProc / krTabSettle / krTabLog / krProcedureTabHtml / krProcedureTabMain / krTimelineTabHtml（kr.js/data.js）｜confirmedDate、subItems、scheduleState｜a,b,d｜tripOf + visitsOf + summaryRowsOf｜中｜是
83. krConsultTimesBlock / krEtaStatusBlock / krTabConsult0 / krRecOpenModal / krRecUpload / krAiOrganize / krRecordBlock / krSubmitBlock / krSubmitReport / krRvSubmitBlock（kr.js）｜consultStatus 逐态；isRevEval 切换复诊版文案｜b｜flowStepOf(m,'consult') + revisitFlowOf(x)｜中｜读是；krSubmitReport 写：否
84. krRecoveryCard / krRevEvalCard / krSetRecoveryResult / krRvAuth / krRvTitle / krRvMemo / krRvPick / krRvConfirm / krRvNow（kr.js）｜recoveryResult、isRevEval、linkedCase｜b,c｜revisitFlowOf(c)（新增）｜中｜读是，krSetRecoveryResult 写：否
85. krRelBlockHtml / krTabRelated / krResumeTag / krVisitOrdinals（kr.js）｜linkedCase、resumeFrom｜c｜relatedOf(c)｜易｜是
86. krClientRows / krCliStageProc（kr.js 客人管理）｜按 name 聚合案件、读 consultStatus/stage｜a,b｜mainsOf + flowsOf｜中｜是
87. krcEvents / krDayItems（kr.js、ui.js 日历）｜directorSchedule 块 + visitCalBlocks｜a｜visitsOf(m)（带 rows、院长）｜中｜是
88. krCbOpen / krCbVisits / krCbPreview / krCareMiniOpen / krExtOpen / krTimeEditSave / krWizard / krDoSchAdjust / krCleanVisitPage（kr.js 预约弹窗、向导）｜读 subCaseKey、confirmedDate 做冲突/并入判断｜a｜visitsOf(m)；写保留｜难｜否（保存写 subItems）
89. krpUsage / krRenderCaseDetail（kr.js）｜linkedCase 判断是否显示关联 tab｜c｜relatedOf｜易｜是

## todo.js
90. inTodoItems（todo.js）｜遍历 CASE_ITEMS 读 visitDate/visitTime、subState、consultStatus、scheduleState、confirmedDate 生成待办（17+10 处）｜a,b｜mainsOf() + flowsOf(m) + visitsOnDate(today)｜难｜是
91. krTodoItems（todo.js）｜同上，另读 subItems 到院、isRevEval、recoveryResult｜a,b,d｜同上 + revisitFlowOf｜难｜是
92. todoStageOf / todoUbGroupsIn / todoUbIn / todoUbKr / todoCareBookOpen / todoCbOpen / todoCbGo / todoCareBookGo（todo.js）｜careUnits（subItems 未约行）、careFor、visitDate 并入同日预约｜a,d｜projectUnitsOf(m,{unbooked:true}) + visitsOnDate｜中｜读是，*Go 写：否

## calalign.js / krbook.js / booking.js / admin.js / boot-in.js
93. calNeedsRecheck / calRelayRecheckCards / repairScheduleGaps（calalign.js）｜scheduleState、confirmedDate/Time、subItems｜a,b|tripOf｜易｜repair 写：否
94. coreBookConfirm / coreBookDone / coreBookArrive / krbHoldChoices（krbook.js）｜建案件写 krVisit、visitDate；读持有项目 procedureItems｜a,d｜写保留（占位预约=子案件创建）；krbHoldChoices 用 projectUnitsOf｜中｜读 krbHoldChoices：是；其余否
95. bkRenderDone / bkRenderView / bkRebook / bkMeCalHtml / bkRenderMe / bkKrCareEvents（booking.js）｜visitDate/visitTime/visitPurpose/subItems 画「我的预约」列表与日历｜a,d｜mainsOf + visitsOf + visitsOnDate｜中｜是
96. bizCaseMonth / bizSetMonth（admin.js）｜visitDate/surgeryDoneAt 归月，案件数应按主案件｜a｜visitsOf(m) 最后一天 / mainsOf｜易｜是
97. autoNoShowSweep（boot-in.js）｜遍历 CASE_ITEMS 读 visitDate/visitTime/subState 判未到店｜a｜visitsOnDate + inVisitOf；写保留｜中｜否
98. repairVisitState / repairHandToIn / careReturnSweep（boot-in.js 启动修复）｜遍历 subItems/uses 修旧数据｜d｜随旧数据一起丢弃（后端迁移时不需要）｜—｜否

---
## 汇总
- 条目：98 条（其中「—/无需改」2 条）。
- **难：约 27 条**（编号 7, 9, 12, 13, 14, 16, 17, 18, 29, 30, 32, 34, 40, 41, 57, 59, 65, 77, 78, 80, 88, 90, 91 等；其中纯「写入口」类约 17 条＝只能在换后端时整体换 API，不适合现在逐个改；真正「读很复杂但只是显示」的难项是 65、77、78、80、90、91，共 6 条，是 S1 迁移的主战场）。
- 只影响显示、易改（可立刻用现有 S1 函数改）：2, 4, 5, 6, 21, 25, 26, 27, 28, 35, 37, 38, 43, 44, 45, 49, 50, 53, 61, 63, 69, 71, 72, 73, 74, 85, 89, 93, 96 ——其中只用**现有** S1 函数（visitsOf/flowsOf/summaryRowsOf/childVisitsOf/mainOf/mainsOf）即可完成的：2, 37, 44, 53, 60, 74, 96, 72, 73, 69（约 10 条）。
- 其余需先新增函数再改。

## 必须新增的 S1 函数（建议名＋签名＋作用）
1. `inVisitOf(c)` → `{date,time,state:'waiting|arrived|cancelled|noShow',arrivedDay,left:bool,purpose,krVisit:bool}`：读「这条接待记录自己的 IN 那一天」，取代散落的 visitDate/visitTime/subState/arrivedDay/leftStore/visitClosed/visitPurpose。
2. `visitsOnDate(date, opts)` → visits[]（含 mainId、客人名）：全院某天所有到院（IN+KR），供日历/今日来访/待办/预约页/未到店扫描共用。
3. `visitRowsOf(m, v)` → rows[]：某一天里要做的项目行（类型/名称/状态/备注/操作 id），取代 subCaseRows/krTblRow 内部分组；并让 `visitsOf` 的每个 v 带 `rows`、`state('pending|arrived|done|cancelled|postponed')`、`director`。
4. `tripOf(m)` → `{status(scheduleState),date,time,address,hospitalDay,arrived,arrivedDay,ended,confirmed}`：赴韩施术流程的日期/到院/进度，取代 krSchedule.confirmedDate/Time、scheduleState、krArrivedDay、krProcedureDone 的直接读。
5. `flowStepOf(m, kind)` → 字符串步骤（consult: `awaiting_payment|paid_waiting_kr|awaiting_report|report_ready…`；krTrip: 同 tripOf.status）：取代 consultStatus/scheduleState 的字面比较（flowsOf 已有 status 但无统一访问器）。
6. `revisitFlowOf(c)` → `{n,result:'ok|treat|',status,question,projects,media,main:mainId}|null`：取代 isRevEval(c)/c.revisitEval/c.recoveryResult/revisitQuestion/revisitMedia 的直接读。
7. `relatedOf(c)` → `{mainId,type:'术后管理|复诊评估|复诊建议赴韩|延续既往面诊|',reason,followup:bool,lightLinkId}`：取代 linkedCase/resumeFrom/followup/relLinks 的直接读。
8. `projectUnitsOf(m, opts)` → units[]：`{iid,type:'赴韩施术|管理项目|术后管理|本地管理',name,place,total,used,state,suggestDate,bookedVisitKey,doneVisitKey,payState,origin('印尼购买|在韩购买'),canBook,canUse,why}`：给项目卡 krProjCards / inProjectCardHtml / inMgmtCardsHtml / 未安排预约 / 持有项目统一用（summaryRowsOf 只是它的显示子集）。
9. `clientHoldingsOf(name, opts)` → `{IN:[],KR:[],postcare:[]}`：客人在两侧的持有（含套餐/赠送/置换/术后管理转入），取代直接遍历 CLIENT_HOLDINGS 与各案件 procedureItems。
10. `openMainsOf(name)` → 该客人未结束的主案件列表：取代 ongoingCasesOf、resumeBannerHtml、followupAsk 里自己筛 CASE_ITEMS 的写法。
11. （可选）`mainStageOf(m)` → 主案件整体阶段/进程，合并 caseStageInfo / caseProcessText0 / krLastStatusText 对旧字段的读取。
