# D 盘点：术后管理 / 本地 / 结算
说明：规格列「一致」= CLAUDE.md 对应 CMD 有写且与代码一致；「未写」= 仅代码实现；测试编号来自 CLAUDE.md 各 CMD 的测试记录（selftest R/S/D 或 coverage CHECKS）。

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
## 一、术后管理
| D-01 | KR 在诊疗方案里为每个施术项目设「所需术后管理」：名称/次数/间隔/地点(韩国|韩国或印尼)/具体项目/第N天起，后续日子自动生成 | KR室长 | kr.js:krProjDetailHtml；rules.js:pcDays,pcLabel | R16b,R22b | 一致(1012-02,1015-22) | 照旧 项目属性不变 |
| D-02 | 术后管理按「施术项目+第几条」识别，每次一行，免费不计价不可退款 | 全角色 | data.js:careUnits,careRows | R28b,R52a | 一致(1015-17) | 改成新结构 行归属子案件 |
| D-03 | 术后管理地点「韩国或印尼」由 KR 在预约弹窗决定，默认「请选择」，不选不能确认；IN 不再分配 | KR室长 | kr.js:krCbOpen,krCbGo;data.js:corePcBooking | R56a | 一致(1013-04,1020-05) | 照旧 分配权不变 |
| D-04 | 必须在韩国做的术后管理(最后一次第N天+1)决定最少在韩天数，KR可加不可少，多于最少须写停留原因 | KR室长 | rules.js:stayMinOf,stayPlanOf,stayReasonOk | R46a | 一致(1019-17) | 照旧 属赴韩流程 |
| D-05 | 术后管理预约弹窗：同日项目合并一组共用日期/时间，休诊/营业外红字不可约，晚于离境日橙字或自动转印尼 | KR室长 | kr.js:krCbRender,krCbSyncTimes,krCbGone | R52b,R72b | 一致(1021-02,1021-04) | 改成新结构 一天一子案件 |
| D-06 | 同一天同地点的预约合成一次到院(子案件)，已有到院则并入；同客人同日只允许一个未到店预约 | KR/IN | data.js:coreCareBook,subCaseKey,pendingResvSameDay | R52b,R84a | 一致(1021-16) | 改成新结构 即子案件定义 |
| D-07 | 术后管理不占院长时间，只查医院休诊(硬挡)与午休/营业外(确认后可约) | KR室长 | kr.js:krCbGo;data.js:krDayAgendaHtml | R30b | 一致(1015-30) | 照旧 排程规则 |
| D-08 | 院长操作项目(项目库dirOp)预约需查院长空档，同次到院第二个起弹延长窗，占院长时间 | KR室长 | data.js:dirOpInfo,visitCalBlocks;kr.js:krExtOpen | R56a,R72b | 一致(1020-05) | 照旧 日程规则 |
| D-09 | 选「回印尼做」的行不建韩国到院，进 IN 未安排预约并发一条汇总通知 | KR→IN | data.js:coreCareToIn,handToInNotify,repairHandToIn | R56a,R58a | 一致(1020-05,1020-07) | 改成新结构 印尼行成独立子案件 |
| D-10 | IN 未安排预约列表只放印尼术后管理，按客人折叠，名额一次一key，过建议日期变红 | IN室长 | todo.js:todoUbIn,todoUbListInHtml;data.js:careUnitKey | R58a,R71a | 一致(1020-18) | 改成新结构 项目汇总状态=未预约 |
| D-11 | IN 在未安排预约点[预约]：同项目多次分行、同天合并、接续原案件(careFor) | IN室长 | todo.js:todoCbOpen,todoCbGo | R71a | 一致(1020-18) | 拿掉 接续案件做法去掉 |
| D-12 | IN 术后管理卡栏位 施术项目｜项目｜预约时间｜状态(已完成/已预约/未预约)｜备注，印尼小卡有预约/修改时间 | IN室长 | data.js:inCareCardsHtml | R59a,R60a | 一致(1020-09) | 改成新结构 并入项目汇总 |
| D-13 | IN 修改印尼术后管理预约时间走小弹窗，改的是预约案件日期 | IN室长 | todo.js:todoCareBookOpen | R58a | 一致(1020-08) | 改成新结构 改子案件日期 |
| D-14 | 印尼术后管理做完记原案件、本案件postcareUses，提前做须填原因并通知KR，延后标红 | IN室长 | data.js:openCareUse,confirmCareUse,coreCareVisit,pcBatchSuggest | R17a,R86a | 一致(1013-06,1015-17) | 改成新结构 记当天子案件 |
| D-15 | 持有批次建议日期=原施术日+批次scheduleDays，多次各自第N天 | IN | data.js:pcBatchSuggest(内联),finalizeInnCare | 无 | 一致(1013-07) | 拿掉 术后不再转持有批次 |
| D-16 | 付清尾款后印尼部分术后管理转 0 元「套餐内含」持有批次 | 系统 | data.js:finalizeInnCare | 旧R17c | 一致(1012-02旧) | 拿掉 术后管理不是持有项目已于1015-17作废 |
| D-17 | 术后管理阶段 postcare：施术完成且有术后管理才进，无则直接结案 | 系统 | rules.js:deriveCaseStage;data.js:updateCaseStage | R17a | 一致(1015-17) | 改成新结构 阶段由流程取代 |
| D-18 | 结案不再自动：韩国行程结束需 KR 手动[韩国行程结束]，IN 手动[结案]，每天早上待办询问 | KR/IN室长 | data.js:coreTripEnd,coreInClose,tripAskDue,inCloseDue | R84a | 一致(1021-16) | 改成新结构 主案件结束统一入口 |
| D-19 | careReturnSweep(离境日过自动结案)已删除，careCustomerReturned仅作提示 | 系统 | data.js:careCustomerReturned | R84a | 一致(1021-16) | 照旧 保持不自动 |
| D-20 | 行程结束时没做的印尼术后管理转印尼持有，韩国的转在韩持有，不作废 | KR/IN | data.js:coreTripEnd,coreInClose,clientCareLeft | R84a,R61a | 一致 | 改成新结构 超一个月变管理项目 |
| D-21 | 在韩期间(入境/离境日时间机场)IN填，用于预约警示、未安排预约截止、打印 | IN室长 | data.js:coreSetStay,stayOutDate;calalign.js:openStayModal | R62a,R65a | 一致(1020-11,13) | 照旧 流程属性 |
| D-22 | 管理项目(mgmtPlan)付款后进在韩持有heldOver，每笔唯一iid，次数=规格次数×份数 | KR | data.js:holdLocalAdd,itemIid,mgmtQtyText | R39a,R67a | 一致(1019-10,1020-16) | 照旧 汇总项目沿用 |
| D-23 | 管理项目「第一次使用/间隔」读项目库(可设无关)，建议日期从施术日或上次实际使用日起算 | KR/IN | data.js:krMgSuggest;rules.js:mgSugText | R76a | 一致(1021-08) | 照旧 |
| D-24 | 持有管理项目[本次使用]仅当天有进行中到院出现，剩≥2次弹选次数，做完在到院卡[操作完成]才扣次 | KR室长 | kr.js:krUnitUseNow,krUseQtyOpen;data.js:coreUnitUseNow,holdUseRecord | R82a,R53b | 一致(1020-01,1021-14) | 改成新结构 使用次数记子案件 |
| D-25 | 已使用/剩余次数只从到院卡完成行算，可[撤回完成]退次 | KR室长 | data.js:holdRecalc,coreMgmtUseUndo,coreUseRowUndo,fixUseRecords | R52a | 一致(1019-23) | 照旧 项目汇总使用次数 |
| D-26 | 管理项目[预约时间]走同一预约弹窗，选几次展开几行，日期按建议间隔排 | KR室长 | kr.js:krCbOpen,krCbMgQty;data.js:coreUnitBookUse | R54b | 一致(1020-03) | 照旧 |
| D-27 | 项目卡4tab施术/术后管理/管理项目/已完成，固定高度，默认第一个有内容的 | KR室长 | kr.js:krProjCards | R82a | 一致(1021-14) | 改成新结构 被项目汇总取代 |
| D-28 | IN 赴韩施术tab三大卡：项目卡/术后管理(韩国印尼)/管理项目(持有中/已完成) | IN室长 | data.js:inProjectCardHtml,inMgmtCardsHtml | R60a | 一致(1020-09) | 改成新结构 并入项目汇总 |
| D-29 | 到院卡分今天/已预约/已完成，今日卡可展开，到院按钮只当天能按 | KR室长 | kr.js:krCaseCardHtml,krArriveMainBtn;data.js:mainArriveBlock | R80a,R81a | 一致(1021-12,13) | 改成新结构 到院卡=子案件 |
| D-30 | 到院卡[客人已离院]人工确认，有待付款不能结束；今天已完成可[增加项目]重开，00:00后锁定 | KR室长 | data.js:coreEndVisitToday,endBlockPending,coreReopenVisitAt | R78a,R79a | 一致(1021-10,11) | 照旧 子案件结束 |
| D-31 | 项目排进已完成到院日弹专门提示(选其他日期/增加项目)，非今天只能换日期 | KR室长 | kr.js:krDoneDayAsk;data.js:doneDayInfo | R83a | 一致(1021-15) | 照旧 |
| D-32 | 术后管理行[取消本次]退回未预约，[修改时间]全部延期退回未使用，全延期的到院卡结案 | KR室长 | data.js:coreRowCancel,coreRowPostpone | R22a | 一致(1015-22) | 改成新结构 子案件取消 |
| D-33 | 到院施术/管理项目今日取消=deferUse回未使用，不是退款 | KR室长 | data.js:coreTodayCancel | R29b,R31b | 一致(1015-29) | 照旧 |
| D-34 | 施术做完不自动结案；有待做术后管理/在韩持有仍可继续；术后管理未到当天不能标完成 | KR室长 | data.js:coreSubDone,coreSubArrived | R51a,R57a | 一致(1013-10,12) | 照旧 |
| D-35 | 提前做术后管理只通知KR不批准；延后标红并进IN待办 | IN/KR | data.js:coreCareVisit;todo.js | R17a | 一致(1013-06) | 改成新结构 超一个月转管理项目 |
| D-36 | 旧版「超过建议日期」只标红提醒，无一个月转换规则 | IN | data.js:postcareDueList(renderPcDueCard已空) | 无 | 未写 | 改成新结构 超一月变管理项目 |
| D-37 | KR 术后管理分页栏位 项目｜地点｜对应施术｜次数｜建议日期，按施术分卡 | KR室长 | kr.js:krCareGrid,krCareRow | R28b,R52b | 一致(1015-28,1020-02) | 改成新结构 项目汇总 |
| D-38 | 交给印尼的行在 KR 单独「交给印尼」组，KR只读 | KR | kr.js:krProjCards | R59b | 一致(1020-08) | 照旧 |
| D-39 | 占位预约(IN在KR日程约)来访目的3个：术后管理/持有项目管理/新增访问；KR确认后建在韩管理案件krVisit | IN/KR | krbook.js:coreBookConfirm,coreBookDone,krbPurposeFull | BK1a-c,BK2a-c,H2a/b | 一致(1014-16,1020-18) | 改成新结构 一天一子案件 |
| D-40 | 在韩持有项目使用/占位到院按每笔iid扣次 | KR | krbook.js:krbHoldChoices,coreBookDone | R67a | 一致(1020-17) | 照旧 |
| D-41 | 术后管理阶段/在韩管理：案件列表▼展开子案件，Timeline按到院分页 | IN/KR | data.js:subCaseList,subCaseNums,caseTimelineBlockHtml | R49a,R50a | 一致(1019-20,21) | 改成新结构 子案件为正式实体 |
| D-42 | 接续案件：IN预约默认接续到术后管理阶段案件；followup术后/复诊来访关联原案件 | IN室长 | ui.js:resumeBannerHtml,continueNewVisit;data.js:followupAsk,followupOn,followupCareCardHtml | R18a,R86a | 一致(1015-18,1021-18) | 拿掉 接续案件整个拿掉 |
| D-43 | 在韩管理(krmgmt)KR占位预约案件页干净页：[客人已到院][预约修改][未到店][预约取消] | KR室长 | kr.js:krCleanVisitPage;krbook.js | R24b | 一致(1015-24) | 改成新结构 子案件状态条 |
| D-44 | 超过最早回国日后医美史/客户详情「韩国持有」分施术/术后管理/管理项目三组 | IN/KR | data.js:cliHoldKrHtml,cliHoldKrRows | R61a,R84a | 一致(1021-16) | 照旧 |
## 二、本地
| D-45 | 本地项目库清单：类别→项目→规格(价格万韩元)，IN价=韩元×11.8，选项按规格分组，面议手填价 | IN室长 | data.js:LOCAL_CATALOG_TEXT,buildLocalProjects,optValuesFor | 无(S36类) | 一致(1012-04) | 照旧 项目库不变 |
| D-46 | 本地选购统一画面：类别chips→项目→规格→价格，购物车条目kind=project/package/service | IN室长 | data.js:localPurchaseHtml,localCatalogHtml,cartTotals,inLineTotal | R86a | 一致(1008-09) | 照旧 钱记当天子案件 |
| D-47 | 活动价/套餐只有管理者，过期自动恢复原价靠现算；套餐拆出批次不可退 | 管理者 | data.js:promoStatusOf,localUnitPrice;PROMOS,PACKAGES | roletest | 一致(1008-09) | 照旧 |
| D-48 | 折扣只填1–99，留空不打折；数量1–99；统一qtyInputHtml | IN室长 | data.js:discountText,qtyInputHtml | 无 | 一致(1008-10,1012-01) | 照旧 |
| D-49 | 付款后发放持有批次(规格N次×数量)，pkg/pkgPaid/service不可退款 | 系统 | data.js:grantLocalItems | R39a | 一致 | 改成新结构 批次进项目汇总，钱记子案件 |
| D-50 | 使用持有项目：有选项先选，扣下一个批次，使用后关联原购买案件并对KR可见 | IN室长 | data.js:lmContinue,useHolding(内联),holdingsUseHtml | S36,R20a | 一致(1012-04) | 改成新结构 使用记当天子案件 |
| D-51 | 本地管理流程「选购→使用→本次不使用/不购买」，全部标完才结局，取消=次数归还 | IN室长 | data.js:markMgmtRows,notUseThisTime,noPurchaseThisTime | R18b | 一致 | 照旧 子案件内操作 |
| D-52 | 面诊/赴韩案件本地只能当天加(localAddAllowed)；纯本地不限 | IN室长 | data.js:localAddAllowed | N2 | 一致(1013-16) | 改成新结构 一天一子案件天然成立 |
| D-53 | 不面诊且无赴韩项目时选购只显示本地项目，没有赴韩子tab | IN室长 | data.js:localPurchaseHtml;projectListTabHtml | R88a | 一致(1008-07) | 照旧 |
| D-54 | 增加面诊后本地项目照常使用，显示「本地管理进行中」标签；本地做完标签消失 | IN室长 | data.js:localMgmtTagOn,localMainDone,localCarriedDoneHtml | R17a | 一致(1008-13,1013-14) | 改成新结构 业务类型标签 |
| D-55 | 持有批次退款：有剩余次数可退，退后作废；comp/pkg/service不可退；退款记购买案件 | IN室长 | ui.js:refundableBatches;data.js:holdingRefunds(变量),hasRefundMark | S31,B10 | 一致(1024-04) | 照旧 钱记购买当天 |
| D-56 | 退款服务：基础资料顶部[退款服务]多批次一次退，共用原因，可「仅办理退款」结案 | IN室长 | ui.js:confirmRefundService,openRefundOnlyAsk,refundServiceBarHtml | E10,B10 | 一致(1013-04) | 改成新结构 退款记当天子案件 |
| D-57 | 赴韩取消/无法协调可「转本地置换」：额度=韩元×11.8，不退钱 | IN室长 | data.js:startCompPurchase,compFinalize;rules.js:REFUND_METHOD | CP1,CP2,H1 | 一致(1014-03..06,12) | 照旧 钱记赴韩流程 |
| D-58 | 置换：合计<额度不能结算，>额度补付；可先不换存客户档案compCredits，下次来换 | IN室长 | data.js:compDefer,compUseCredit,compBannerHtml | CP2 | 一致(1014-06) | 照旧 |
| D-59 | 置换标「置换」不标「退款」；财务退款统计只算现金 | 系统 | data.js:refundCashSum,compSum,hasRefundMark | CP1 | 一致(1014-05) | 照旧 |
| D-60 | 结案优先级：施术>面诊>本地；纯本地做完才结案；mainlineOngoing判断主线未了 | 系统 | data.js:mainlineOngoing,autoFinish | N1 | 一致(1013-16,1015-13) | 改成新结构 主案件结束规则取代 |
| D-61 | 钱没清不结束：closeBlockers(面诊费待缴/待付款结算单)；在韩待付款不推IN | 系统 | data.js:closeBlockers,autoFinish | N1,R77a | 一致(1021-09) | 照旧 |
| D-62 | [结束案件]仅接待中且付定金前，IN室长可点，逐项处理款项，原因必填，写manualEnd | IN室长 | data.js:canEndCase;ui.js:openEndCase,confirmEndCase | G1-G4,N3 | 一致(1013-16) | 改成新结构 结束主案件入口 |
| D-63 | 结局推导：已结案/仅出报告/已取消，取消原因6类，financeResult独立 | 系统 | rules.js:computeOutcome,financeLabel | B10,D27-D31 | 一致 | 照旧 |
| D-64 | 客人不做项目→仅出报告(endNote)；面诊后赴韩项目全取消按本地保留/全退/做本地管理三结局 | IN室长 | data.js:noProjectForClient,afterKrItemsChanged,localKeepChoice | D28a-c,D31a-c | 一致(1012-12) | 改成新结构 |
| D-65 | 无法协调[取消赴韩]按KR是否回过日期分按钮，确认后取消用[取消项目] | IN室长 | ui.js:requestCannotCoordinate | D27,D30,R41a | 一致(1019-12) | 照旧 |
| D-66 | 修复启动：repairWronglyClosedCases恢复被误结案主线未了的案件 | 系统 | data.js:repairWronglyClosedCases,repairVisitState | 无 | 一致(1013-13) | 拿掉 新结构数据重建 |
## 三、结算
| D-67 | 结算单(settlementBatches)状态 待付款/已付款/部分退款/全额退款，新的在上，结算tab只读汇总并标来源 | IN室长 | rules.js:settlementCardHtml,settlementSummaryHtml;data.js:settleTabHtml | R104a | 一致(1017,1011) | 改成新结构 分赴韩疗程/本地 |
| D-68 | 定金=赴韩施术+管理项目×30%(KR_DEPOSIT_RATE演示)，术后管理含在套餐不计价 | 系统 | data.js:computeBatchBreakdown | R16a | 一致;比例待拍板 | 照旧 钱记赴韩施术流程 |
| D-69 | 尾款=项目合计−已付定金(effDeposit=定金−到院前已退)；IN可见尾款金额，在韩加项不计 | IN/KR | rules.js:krBalanceInfo;data.js:krPlanMoneyLine | R15d,D18 | 一致(1015-16) | 照旧 |
| D-70 | 换项目不另算差价，尾款按最终项目合计重算，付清时一次生成结算单 | KR室长 | data.js:coreSettleBalance,coreCannotReplace;kr.js:krDoSettle | R26a/b | 一致(1013-03) | 照旧 |
| D-71 | 尾款前读完IN备注才能结算(krNotesGate)，付款Modal只有[取消][确认付款] | KR室长 | kr.js:krSettleOpen,krSettleConfirm | R26b | 一致(1020-08,1015-27) | 照旧 |
| D-72 | 付清尾款后在韩加项=待付款+[已付款]一次生成结算单(addOn)，可[修正]/[取消购买] | KR室长 | data.js:coreAddOnPaid,coreAddOnEdit,coreAddOnDelete | R24b,R69a | 一致(1013-15,1021-01) | 照旧 钱记赴韩流程 |
| D-73 | 麻醉同意书随付款确认(睡眠/全麻须勾)，未确认不能完成项目 | KR室长 | kr.js:krPayOpen,krPayConfirm;data.js:coreAnesConfirm | R23b,R24b | 一致(1015-24) | 照旧 |
| D-74 | 在韩加项金额IN端：通知仍带韩元金额，与「金额仅KR可见」不一致 | IN | data.js:coreAddOnPaid | 无 | 不一致(1021-09留待决定) | 改成新结构 IN只看已付状态 |
| D-75 | IN未付款批次可[重新选择项目]撤销；KR看不到待付款批次的赴韩项目 | IN/KR | ui.js:reselectProjects;data.js:krAllItems | 无 | 一致(1012-02) | 照旧 |
| D-76 | 护照未登记不能付款(batchNeedsPassport)；已有护照有效不弹窗 | IN室长 | data.js:passportGate,batchNeedsPassport | R41a,R40a | 一致(1019-12) | 照旧 |
| D-77 | 财务栏：无收入「–」，仅面诊费/项目收入下写金额，有退款另标，退款分现金/置换 | IN室长 | rules.js:financeLabel,financePaid;ui.js案件列表 | B10 | 一致(1008-06) | 改成新结构 汇总自子案件 |
| D-78 | 面诊费金额选面诊时记入案件consultFeeAmount，consultFeeOf读它，不读设定 | IN | data.js:consultFeeOf,recordConsultFee | S33类 | 一致(1008-07补) | 照旧 钱记面诊子案件 |
| D-79 | 免除面诊费原因3类(复诊/延续既往面诊/其他)，复诊时默认预选 | IN室长 | data.js:WAIVE_REASONS,consultFeeFormHtml | 旧R17 | 一致(1008) | 照旧 |
| D-80 | 经营数据收入口径：IN=面诊费+赴韩定金+本地项目+印尼加做，KR=尾款+韩国加做；按施术完成日(surgeryDoneAt)归月 | 老板/管理者 | admin.js:bizCaseMonth,renderBizData;kr.js:krBizData | S29-S41 | 一致(1007) | 改成新结构 按子案件日期归 |
| D-81 | 医院原因造成的定金退款仍由IN手动退，备注记分担方式 | IN室长 | ui.js:退款弹窗 | 无 | 一致 | 照旧 |
| D-82 | KR端财务栏只显示KR看得到的(尾款/韩国加做)，viewerTextFilter过滤金额，KR看不到IN本地与印尼持有 | KR | kr.js:krFinanceHtml;rules.js:viewerTextFilter,viewerLogHidden | roletest | 一致(1014-16) | 照旧 |
| D-83 | 赴韩定金未付前才可取消项目；到院前取消项目原价退款弹窗提示「金额按KR判断」 | IN室长 | ui.js:openCancelItems,openRefundModal | D22b作废,D27 | 一致(1008) | 照旧 |
| D-84 | 经营数据面诊费汇总=各案件consultFeeOf加总 | 管理者 | admin.js:renderBizData | 无 | 一致(1012-01) | 照旧 |
