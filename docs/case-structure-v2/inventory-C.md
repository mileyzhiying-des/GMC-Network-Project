# 业务规则盘点 C：赴韩 / 到院 / 韩国行程结束

说明：代码位置只写 文件:函数名；规格栏以 CLAUDE.md 的 CMD 记载为准（Notion 未逐条核对）。新结构 = 主案件(一段服务)+流程(面诊安排/赴韩施术/复诊评估)+子案件(一天一个来访)+项目汇总。
selftest 编号为按 CLAUDE.md 记载推断，coverage.js 里 D18–D31、H1 为 Timeline 覆盖条目。

## 一、赴韩：项目确认 / 定金 / 尾款 / 在韩加项

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| C-01 | 赴韩项目金额=施术项目价格，定金=（施术+管理项目）×30%，尾款=70%；术后管理含在套餐里不计价 | IN室长 | rules.js:computeBatchBreakdown；data.js:confirmProjectSelection | R16a | 一致（比例30%为演示占位待业务拍板） | 照旧，记赴韩施术流程 |
| C-02 | 确认赴韩时生成定金结算单，待付款批次可「重新选择项目」撤销 | IN室长 | data.js:confirmProjectSelection；ui.js:reselectProjects | R16a | 一致 | 照旧，主案件层结算 |
| C-03 | 意向项目已拿掉；IN选项目时赴韩项目分「施术/管理项目」，管理项目来自KR可选范围 | IN室长 | ui.js:scopeMgmtRowsHtml、toggleProject | R16a、R33a | 一致 | 照旧，项目汇总来源 |
| C-04 | 定金诊所(IN)收、尾款医院(KR)收；IN经营数据只算定金，KR算尾款与韩国加做 | IN/KR管理者 | admin.js/kr.js:krBizData | 无 | 一致 | 照旧，主案件层资金归属 |
| C-05 | 付定金前医院原因造成的退款由IN手动退并写备注分担方式 | IN室长 | ui.js:openRefund* / confirmRefund | 无 | 一致 | 照旧 |
| C-06 | 尾款=项目合计−已付定金（换项目不另算差价）；IN端可见尾款金额，在韩加项金额IN不可见 | IN/KR | data.js:krBalanceInfo；kr.js:krWzSettleCard | R15d | 一致（在韩加项通知含韩元金额与「IN不可见」不一致，待定） | 照旧，赴韩流程层 |
| C-07 | 到院前取消项目的退定金：定金净额=定金−到院前已退（afterArrival标记） | IN室长 | data.js:krBalanceInfo | D18 | 一致 | 照旧 |
| C-08 | 在韩加项分两种结算：尾款前并入尾款(preBalanceAdd)；付清后另开结算单且先「待付款」 | KR室长 | data.js:coreAddOnItem、coreAddOnPaid | R23b、R24a | 一致 | 改成新结构：记赴韩施术流程，不记当天子案件 |
| C-09 | 待付款在韩加项：红条［去付款］→确认付款Modal，施术/管理分列，睡眠/全麻勾麻醉同意书才能确认 | KR室长 | kr.js:krPayOpen、krPayConfirm、krTopAlerts | R23b、R24a | 一致 | 照旧 |
| C-10 | 管理项目加进来即转在韩持有(heldOver)，待付款标红但可本次使用 | KR室长 | data.js:holdLocalAdd | R16b、R67a | 一致 | 改成新结构：持有归项目汇总 |
| C-11 | 서비스（赠送）加入即进持有，0元不生成结算单 | KR室长 | data.js:coreAddOnItem | R24a | 一致 | 照旧 |
| C-12 | 待付款项目行［取消购买］(下划线链接)；已使用灰、院长灰；确认弹窗；处理=coreAddOnDelete并释放延长时间 | KR室长 | kr.js:krPendDelAsk；data.js:coreAddOnDelete | R69a、R74a | 一致 | 照旧 |
| C-13 | 待付款［修正］：改项目/数量/金额/麻醉/删除，仅KR室长，付款后不能改 | KR室长 | kr.js:krFixOpen；data.js:coreAddOnEdit | R69a | 一致 | 照旧 |
| C-14 | 在韩加项待付款不推IN待办，也不挡IN［结束案件］ | IN | data.js:closeBlockers | R77a | 一致 | 照旧 |
| C-15 | 有待付款项目时不能［客人已离院］（主/子到院同一检查endBlockPending） | KR室长 | data.js:endBlockPending、coreEndVisitToday、coreEndSubVisit | R78a | 一致 | 照旧，子案件级校验 |
| C-16 | 付尾款前必须读过IN备注，未读弹「先读IN备注」 | KR室长 | kr.js:krNotesGate；data.js:coreAddInNote、coreNoteRead | R59b | 一致 | 照旧 |
| C-17 | 本地代偿→「置换」：取消赴韩/无法协调选「转本地项目」，额度=韩元×汇率，标置换不标退款 | IN室长 | data.js:startCompPurchase、compFinalize；ui.js:openRefund | CP1、CP2、H1(覆盖) | 一致 | 改成新结构：本地项目钱记当天子案件，额度挂主案件 |
| C-18 | 置换：已选合计<额度不能结算，>额度补付；之后再换存客人compCredits | IN室长 | data.js:compFinalize、compDefer、compUseCredit | CP1、CP2 | 一致 | 照旧 |
| C-19 | 置换批次不可退款；退款服务/持有显示「置换·不可退款」 | IN室长 | data.js:refundableBatches | CP1 | 一致 | 照旧 |
| C-20 | 管理项目一行：份数×规格次数=总次数qty；第一次使用/间隔读KR项目库(mgSchedOf)，诊疗方案不再手填 | KR室长 | data.js:mgSchedOf；kr.js:krMgRowFields | R39a、R76a | 一致 | 照旧 |
| C-21 | 管理项目购买后显示名去掉「·N次」(buyName)，购买前不动 | IN/KR | rules.js:buyName | R50a | 一致 | 照旧 |

## 二、赴韩：施术日期 / 通知客人

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| C-22 | 施术日期选1~2天，✅首选日，单选自动首选；今天以前置灰 | IN室长 | data.js:pickKrDate、setKrPrimaryDate | 无（R-组间接） | 一致 | 照旧，赴韩流程层 |
| C-23 | KR确认施术时间（到院时间/地址）；可无法安排；确认后IN转告 | KR室长 | data.js:coreScheduleConfirm | D19、TDK1 | 一致 | 照旧 |
| C-24 | 确认施术时间：撞院长不可预约时到院时间下拉灰掉写原因；午休/营业外确认后可约 | KR室长 | kr.js:krTimeOptionsFor、krSurgeryHoursNote；data.js:krSurgerySlotError | R24b | 一致 | 照旧 |
| C-25 | 同一位院长同一时间只能有一件事，冲突改询问（仍然进行/不在这个时段），休诊/营业外硬挡 | KR室长 | kr.js:krAskClash、krBlock；data.js:krSurgerySlotError、directorClashList | R21a/b、R22a | 一致（1015-22取代1015-21挡住Modal） | 照旧 |
| C-26 | 施术块时长只按施术项目算，管理项目/서비스不占；在韩加施术先问延长多久（extendMin），不按项目时长自动加 | KR室长 | data.js:surgeryMinutes、coreProjectedConflict；kr.js:krExtOpen | R24a/b | 一致 | 照旧 |
| C-27 | 改期：到院前可改，无「施术前2周不可改」限制；改后等KR确认，KR可无法安排 | IN/KR | data.js:coreChangeConfirm；ui.js:startKrScheduleChange | 无 | 一致 | 照旧 |
| C-28 | 未回过日期=［取消赴韩］，KR回过后才是［无法协调］；确认后同位置为［取消项目］，不并存 | IN室长 | ui.js:requestCannotCoordinate、krScheduleReplied | R41a、D27~D31(覆盖) | 一致 | 照旧 |
| C-29 | 无法协调三种结局：保留/全退/置换本地；赴韩全取消后问是否做本地管理 | IN室长 | ui.js:requestCannotCoordinate；data.js:afterKrItemsChanged | D27、D29、D31 | 一致 | 改成新结构：转本地走子案件 |
| C-30 | ［发送给客人］施术日期通知(短信/WhatsApp)，纯中文模板在诊所设定，麻醉空腹行按字段 | IN室长 | calalign.js:openSurgMsg、surgSendHtml | R42a、R45a | 一致 | 照旧 |
| C-31 | 通知过客人后KR改日期/时间/地址→红字「请电话通知」+［已电话通知］，不再重发 | IN室长 | calalign.js:surgChanged、surgInformKey、openSurgPhone | R45a | 一致（1019-16取代旧「再发一次」） | 照旧 |
| C-32 | 施术前2天提醒卡：发过一次整张消失；已改为13取消，行程确认走［已确认行程］ | IN室长 | calalign.js:calNeedsRecheck、surgRemindSent、openStayModal | R45a、R65a | 一致 | 照旧 |
| C-33 | KR改施术时间/地址通知IN；IN递交日期/改期通知KR（action级） | IN/KR | data.js:coreScheduleConfirm、pushKrNotif | R41a | 一致 | 照旧 |
| C-34 | KR主案件到院施术日期卡显示「日程确认」状态（IN是否已确认行程） | KR | kr.js:krSurgHead | R65b | 一致 | 照旧 |

## 三、赴韩：在韩期间 / 停留 / 护照 / 麻醉 / 项目库

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| C-35 | 在韩期间c.stay{in,out,时间,机场}：确认赴韩时可先空着(只问一次)，施术前2天确认行程时必填，改动通知KR+Timeline | IN室长 | calalign.js:stayGate、openStayModal；data.js:coreSetStay | R62a、R65a | 一致 | 照旧，赴韩流程层字段 |
| C-36 | 离境日早于最早可回国日只红字不拦 | IN室长 | data.js:stayShortDays；calalign.js:openStayModal | R62a | 一致 | 照旧 |
| C-37 | 离境日用于KR预约弹窗(晚于离境日橙字/自动转回印尼)、未安排预约截止、careCustomerReturned提示 | KR/IN | kr.js:krCbRender、krCbGone；data.js:stayOutDate | R62b、R71b | 一致 | 照旧 |
| C-38 | 建议在韩天数：施术日=第0天，最少=必须在韩国的术后管理最后一次第N天+1，不能少，多于最少必须写停留原因 | KR室长 | rules.js:stayMinOf、stayPlanOf、stayReasonOk；kr.js:krStayCommit | R46a | 一致 | 照旧 |
| C-39 | 多施术日：每个施术从自己施术日起算，最早回国日取最晚者 | KR/IN | rules.js:stayPlanOf | R50a | 一致 | 改成新结构：多日施术按子案件日期算 |
| C-40 | IN赴韩施术页左上显示「建议在韩停留N天（原因）」；取代推荐项目整理 | IN室长 | data.js:krStayHint | R65a | 一致 | 照旧 |
| C-41 | 护照：确认赴韩/付款前必须登记；有效不弹窗，过期/施术前到期报红不拦；护照号不进列表/通知/Timeline | IN/KR室长 | ui.js:passportGate；data.js:batchNeedsPassport | R40a、R41a | 一致 | 照旧，客户层字段 |
| C-42 | 护照仅IN/KR室长可见，院长/老板不可见 | 多角色 | rules.js:passportVisible | R40a、R61b | 一致 | 照旧 |
| C-43 | 麻醉同意书：睡眠/全麻项目付款时勾「已签署」，未确认前项目不能完成；独立于付款 | KR室长 | data.js:coreAnesConfirm、anesPendingItems；kr.js:krAnesOpen | R23b | 一致（1015-24合并入付款Modal） | 照旧，记赴韩流程 |
| C-44 | 麻醉「需空腹小时」anesthesia.fast数字字段，局麻无；短信读该字段 | KR室长 | rules.js:anesFastOf；kr.js:krProjDetailHtml | R43a | 一致 | 照旧 |
| C-45 | 所需术后管理一项一框：类型/项目/次数/间隔/地点/第几天/印尼对应项目 | KR室长 | kr.js:krProjDetailHtml、krPcRowHtml | R16b | 一致 | 照旧 |
| C-46 | KR项目库：赴韩项目分类=苦恼部位，必填部位与施术时长；术后管理项目「院长操作」+规格时长 | KR管理者 | kr.js:ADMIN_RENDER.krsrvc、krpEditor；data.js:krPartsNormalize | R36a、R72b | 一致 | 照旧 |
| C-47 | 项目库默认资料（推荐在韩/麻醉/术后管理/时长）自动带入报告、更换、补加、加做 | KR室长 | kr.js:krDefaultsDetail；data.js:gmcFillKrMeta | S36 | 一致 | 照旧 |
| C-48 | 复诊/术后照片要求（部位拍摄要求+项目另设）影响IN上传卡 | KR管理者 | data.js:shootSpec；kr.js:krShootTabHtml | R90a/b | 一致 | 改成新结构：属复诊评估流程，非赴韩 |

## 四、到院：到院卡与到院流程

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| C-49 | 案件区块三组（今天/已预约/已完成）；每次到院一张卡，标题=日期时间·做什么，不编号 | KR | kr.js:krCaseGroupsHtml、krCaseCardHtml | R49a、R22b | 一致（1019-21取代20） | 改成新结构：一天一个子案件=一张卡 |
| C-50 | 被清空(项目全部延期/改到别天)的到院卡不显示，其他不显示规则恢复 | KR | kr.js:krCaseGroupsHtml | R83a | 一致 | 照旧 |
| C-51 | 卡标题右侧状态标签（待到院绿/已到院蓝/已完成灰），非今天可折叠，今天默认展开 | KR | kr.js:krCaseCardHtml、krSubToggle | R75a、R80a | 一致 | 照旧 |
| C-52 | 页头「到院」状态卡：今天有到院且客人未到时出现，室长有［客人已到院］［修改时间］ | KR | kr.js:krArriveCards | R47a | 一致 | 照旧 |
| C-53 | ［客人已到院］只能当天按（韩国医院当地+演示时钟），未到当天灰+悬停+［模拟到当日］ | KR室长 | data.js:mainArriveBlock、coreMarkArrived；kr.js:krArriveMainBtn | R81a | 一致 | 照旧，子案件级 |
| C-54 | 标已到院→IN收「已到院」info通知，IN医院日程块状态标签同步；可撤回(未评估前) | KR/IN | data.js:coreMarkArrived、coreUnarrive | R66a | 一致 | 照旧 |
| C-55 | 术后管理/管理项目到院=子到院，［客人已到院］按行 arrived，改到已到店的到院时继承到店 | KR室长 | data.js:coreSubArrived、inheritVisitArrival、coreVisitState | R77b、R81a | 一致 | 改成新结构：即子案件到店 |
| C-56 | Step1院长评估：三选一(可手术原方案/需调整/不建议)，非原方案memo必填；可撤回已到院 | KR室长/院长 | kr.js:krStep1Card、krDoJudge；data.js:coreJudge | R26b、R27 | 一致（1015-26/27） | 照旧，赴韩流程 |
| C-57 | 评估上一步：付清尾款/确认更换/退款前可退回重选(coreJudgeRevert)，Timeline记退回 | KR室长 | data.js:coreJudgeRevert | R26b | 一致 | 照旧 |
| C-58 | Step2添加项目：加施术项目当下问延长；3-2调整方案勾选保留+同一添加块；结算时一次生成结算单 | KR室长 | kr.js:krAddBoxHtml、krChToggle、krDoSettle | R26b、R66b | 一致 | 照旧 |
| C-59 | 3-3不建议手术：重新预约/取消项目→更换项目(新项目另开结算计入尾款)/退款(coreRefundDecision) | KR室长 | data.js:coreRebook、coreCannotReplace、coreRefundDecision | D20、D21 | 一致 | 照旧 |
| C-60 | Step3尾款确认付款Modal（只有取消/确认付款），含麻醉同意书；付款前须读IN备注 | KR室长 | kr.js:krSettleOpen、krSettleConfirm；data.js:coreSettleBalance | R26b、R27 | 一致 | 照旧 |
| C-61 | Step4勾选今日进行项目（KR_PICK）：勾的进今日行，没勾留未使用(deferUse) | KR室长 | kr.js:krTpToggle；data.js:coreTodayPick | R26b | 一致 | 照旧，子案件当天项目 |
| C-62 | 施术当天术前照片（评估为可以手术后）KR上传，R103 | KR室长 | 待查（CMD-1022-17，未读） | R103a/b | 未写（CLAUDE.md近期条目未收录） | 改成新结构：挂施术当天子案件 |
| C-63 | 今日案件每行［操作完成］［今日取消］；施术项目一项一行(显示层拆)，单项完成/取消 | KR室长 | data.js:coreSurgItemDone、coreTodayCancel；kr.js:krTblRow | R29b、R31b | 一致 | 照旧 |
| C-64 | 今日取消=项目deferUse回项目卡，不是取消购买/不退款；持有管理项目从todayPickMgmt移出 | KR室长 | data.js:coreTodayCancel | R29b、R31b | 一致 | 照旧 |
| C-65 | 项目卡［本次使用］/［本次取消］：有进行中到院才出现，管理项目剩≥2次弹Modal选次数，做完才扣 | KR室长 | kr.js:krProjCards、krUnitUseNow、krUseQtyOpen；data.js:coreUnitUseNow | R53b、R82a | 一致 | 改成新结构：使用记当天子案件 |
| C-66 | ［预约时间］/［全部预约］统一预约弹窗，按日期分组、同天合并一次到院、休诊/营业外红字不勾 | KR室长 | kr.js:krCbOpen、krCbRender、krCbGo；data.js:coreCareBook、coreUnitBookUse | R52b、R54b、R72b | 一致 | 改成新结构：即建子案件 |
| C-67 | 同一客人同一天只有一个预约，合并进已有预约；已到店加进该次到院；已完成走提示 | KR/IN | data.js:pendingResvSameDay | R84a | 一致 | 照旧，一天一子案件 |
| C-68 | 排进已完成到院日：专门提示［选其他日期］［增加项目］(重开)，不是时间冲突 | KR室长 | kr.js:krDoneDayAsk；data.js:doneDayInfo | R83a | 一致 | 照旧 |
| C-69 | 增加项目Modal：左施术/管理tab+搜索，右已选+서비스，底部合计与确认；院长操作项目延长询问 | KR室长 | kr.js:krAddModalOpen、krAddChooser | R82a | 一致 | 照旧 |
| C-70 | ［增加项目］一直显示：已到院+尾款已付+未结案+离境日未过；买了进未使用不重开到院 | KR室长 | data.js:canAddOnNow、coreAddOnItem | R81a | 一致 | 照旧 |
| C-71 | 同名管理项目按每笔iid唯一识别（勾选/使用/预约/撤回/扣次均按iid） | KR室长 | data.js:itemIid、ensureItemIids、itemByKey、rowOwnedBy | R67a | 一致 | 改成新结构：项目汇总按iid |
| C-72 | 已使用次数只从到院卡完成行算(uses)，holdRecalc重算；撤回完成退次；假记录自动修复 | KR/系统 | data.js:holdUseRecord、holdUseUndo、fixUseRecords、holdRecalc | R52a | 一致 | 照旧 |
| C-73 | 下一次建议日期从上次实际使用日(到院日)+间隔起算；提前使用只灰字提示不拦 | KR | data.js:krMgSuggest；kr.js:krEarlyHint | R51a/b | 一致 | 照旧 |
| C-74 | 使用时间显示=实际到院日期+到院时间（不是点按钮时间） | KR/IN | data.js:visitAtText、useVisitDate | R81a | 一致 | 照旧 |
| C-75 | 项目卡四tab（施术/术后管理/管理项目/已完成），固定高度滚动，默认打开第一个有内容的 | KR | kr.js:krProjCards | R82a | 一致 | 改成新结构：成为项目汇总视图 |
| C-76 | 项目卡栏位：来源标签(印尼购买/在韩购买)、建议时间、操作+其他两栏；灰按钮只悬停提示 | KR | kr.js:krSrcTag、krOutBtn、krLink | R74a | 一致 | 照旧 |
| C-77 | 术后管理tab按施术一张卡，术后第N天，［全部预约］；交给印尼单独一组 | KR | kr.js:krPcSec、careSec | R52b、R59b | 一致 | 照旧 |
| C-78 | 到院卡备注：行备注静默保存，整体备注离开输入框存草稿，客人已离院时存成一则；备注卡最新3条+增加备注+查看全部；自动翻译 | KR/IN | data.js:coreItemNote、coreVisitNoteCommit、notesCompactHtml；mockTranslate | R73a、R82a | 一致 | 改成新结构：备注挂子案件，Timeline挂主案件 |
| C-79 | 院长账号可写memo；IN只读；备注写入进Timeline类型「沟通」 | KR | kr.js:krCanMemo；data.js:coreAddProgressMemo | R76b | 一致 | 照旧 |
| C-80 | 主案件IN备注记录inNotes，KR已读/未读，结算前必须读 | IN/KR | data.js:coreAddInNote；kr.js:krInNotesHtml | R59b | 一致 | 照旧 |
| C-81 | KR案件页顶部红条：待付款/待确认麻醉同意书，任何tab可见，院长无按钮 | KR | kr.js:krTopAlerts | R23b | 一致 | 照旧 |
| C-82 | 同一施术块撞别的安排标红框「⚠时间冲突」，不自动改；旧重叠数据不修 | KR | kr.js:krcBlockConflict | R21b | 一致 | 照旧 |
| C-83 | 一次到院=一个日历块(visitCalBlocks)，含施术=施术色占院长，否则术后到院不占院长；IN医院日程同源 | KR/IN | data.js:visitCalBlocks；ui.js:krDayItems | R55a/b | 一致 | 改成新结构：块=子案件 |
| C-84 | 术后管理不占院长时间(只看医院休诊/午休/营业外)；施术预约使用与院长操作项目占院长 | KR | kr.js:krCbGo；data.js:dirOpInfo | R56a、R30b | 一致 | 照旧 |

## 五、到院：离院 / 重开 / 锁定 / 删除

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| C-85 | ［客人已离院］人工确认结束到院，项目做完不自动结束；未做的退回项目卡；次日KR待办提醒未标离院 | KR室长 | data.js:coreEndVisitToday、coreEndSubVisit、coreVisitState；kr.js:krEndAskOpen | R51a/b、R78a | 一致 | 改成新结构：离院=子案件结束 |
| C-86 | 重新打开到院：仅今天(韩国00:00前)已完成的卡，卡上［增加项目］，仅KR室长，需再按客人已离院 | KR室长 | data.js:coreReopenVisitAt、visitCompletedToday；kr.js:krReopenFooter | R79a | 一致（1021-11取代自动重开） | 照旧 |
| C-87 | 已拿掉隐性自动重开（updateCaseStage/coreUnitUseNow/撤回完成等） | 系统 | data.js:updateCaseStage、coreUnitUseNow | R79a | 一致 | 照旧 |
| C-88 | 旧数据修复repairVisitState（启动幂等）：被错误结束的到院、待付款转持有、使用记录 | 系统 | data.js:repairVisitState | R52a、R77b | 一致 | 改成新结构：迁移时一并处理 |
| C-89 | 施术做完不再自动结案/进术后管理，由人工确认（取代早期自动逻辑） | 系统 | data.js:krCloseIfDone | R84a | 一致 | 照旧 |

## 六、韩国行程结束 / 结案

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| C-90 | 所有预约到院完成且无未来预约→每天KR待办「韩国行程是否结束？」，［暂不结束］次日再问；离境日过了也不自动结束 | KR室长 | data.js:tripAskDue、coreTripSnooze；todo.js:krTodoItems(tripend) | R84a | 一致 | 改成新结构：主案件「行程结束」判定 |
| C-91 | 手动［韩国行程结束］Modal：列剩余项目，管理项目/只能在韩国的术后管理转韩国持有，「韩国或印尼」逐项转印尼或留韩国；有待付款不能结束 | KR室长 | data.js:coreTripEnd、tripLeftList；kr.js:krTripOpen、krTripConfirm | R84a | 一致 | 改成新结构：未做项目进项目汇总 |
| C-92 | 行程结束后无转印尼→直接结案；有转印尼→进「术后管理(印尼)」阶段，KR不能再建到院(krTripEnded) | KR/IN | data.js:coreTripEnd、canAddOnNow | R84a | 一致 | 改成新结构：印尼术后管理转子案件 |
| C-93 | IN每天待办「是否结案？」，［暂不结案］次日再问；案件页状态栏手动［结案］Modal：没做的印尼术后管理转印尼持有 | IN室长 | data.js:inCloseDue、coreInClose、inCloseOpen、inCloseLater | R84a | 一致 | 改成新结构：结案=主案件结案 |
| C-94 | 不再自动结案：careReturnSweep已删；careCustomerReturned只作提示（离境日已过/最早回国日已过） | 系统 | data.js:careCustomerReturned | R84a | 一致（1021-16取代1020-08/11） | 拿掉自动逻辑，保留提示 |
| C-95 | IN不再有［结束术后管理］（coreEndPostcare仅测试夹具用）；韩国术后管理没做完转在韩持有，印尼的不作废 | IN | data.js:coreEndPostcare、coreInClose | R17a(改写) | 一致 | 拿掉，换行程结束/结案 |
| C-96 | 结案类型由computeOutcome推算：已结案/仅出报告/已取消；取消原因含预约取消/未到店/面诊取消/管理取消/未购买未使用/仅办理退款/复诊评估结束 | 系统 | rules.js:computeOutcome；data.js:finishCase | G1~G4(覆盖)、D18/D19 | 一致（复诊评估结束为近期新增，规格未核） | 改成新结构：结局挂主案件 |
| C-97 | 手动［结束案件］：接待中且付定金前，逐项处理（面诊费/待付款/本地批次转持有或退款），原因必填；老板/KR看不到 | IN室长 | ui.js:canEndCase、openEndCase、confirmEndCase | G1~G4、N3 | 一致 | 改成新结构：仅限主案件早期 |
| C-98 | 钱没清不结束：closeBlockers（面诊费待缴/待付款结算单）；autoFinish统一；暂不结束写系统记录 | IN | data.js:closeBlockers、autoFinish | N1、N2 | 一致 | 照旧 |
| C-99 | 结案优先级：施术>面诊>本地；有面诊/赴韩项目未完成的案件，本地做完不结案；mainlineOngoing | IN | data.js:mainlineOngoing | N1 | 一致 | 改成新结构：主案件完成态=各流程都完成 |
| C-100 | 结案后印尼未做术后管理留IN「未安排预约」(过建议日期变红)和客户详情；再来做→新案件关联原案件 | IN | todo.js:todoUbIn；data.js:clientCareLeft | R58a、R71a | 一致 | 改成新结构：回到主案件内开新子案件 |
| C-101 | 赴韩项目被置换/取消完且已无赴韩后：canEndCase用compAllKrGone放行［结束案件］ | IN | data.js:compAllKrGone | CP2 | 一致 | 照旧 |
| C-102 | 术后管理(印尼)阶段：韩国与印尼分别记地点，IN卡「术后管理·韩国/印尼」，状态只有已完成/已预约/未预约 | IN | data.js:inCareCardsHtml、inCareBooking | R59a | 一致 | 改成新结构：术后管理成子案件标签 |
| C-103 | 子案件显示叫「到院」不叫主/子案件；编号现算subCaseList，同天同地点合并 | KR/IN | data.js:subCaseList、visitCalBlocks；rules.js:visitWords | R49a、R17a | 一致 | 改成新结构：正式叫子案件，ID=主-序号 |
