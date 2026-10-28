# E 组盘点：权限和可见范围 / 日历和预约 / 通知待办

说明：关系建议里「照旧」= 与案件结构无关；「改成新结构」= 需要按 主案件/流程/子案件 重写；「拿掉」= 新结构下不再需要。

## 一、权限和可见范围

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系建议 |
|---|---|---|---|---|---|---|
| E-01 | IN 老板只有管理类页面(经营数据/账号/诊所设定/短信/日志)，无案件、对话、铃铛只收系统类通知 | IN 老板 | rules.js:ROLE_PERMS、canDo；store.js:guardPage | S29、roletest | 一致(CLAUDE.md 1014-16) | 照旧 |
| E-02 | IN 管理者拥有全部权限；一般室长只有工作类+个人设定，直接输 URL 被导回首页 | IN 管理者/一般室长 | rules.js:ROLE_PERMS、canDo；ui.js:openAdminPage；store.js:guardPage | S29、roletest | 一致 | 照旧 |
| E-03 | 活动价/套餐(promo)只有 IN 管理者能新增/编辑 | IN 管理者 | rules.js:ROLE_PERMS.promo | roletest | 一致(1008-09) | 照旧 |
| E-04 | KR 代表院长=院长+老板：看自己负责案件、录入面诊、管理类页面 | KR 代表院长 | rules.js:ROLE_PERMS.kr_owner、isKrDirectorLike | CAL7、roletest | 一致(1012-05) | 照旧 |
| E-05 | KR 管理者/室长(krwork)可处理案件，院长/代表院长只看自己负责的(krviewOwn) | KR 全角色 | rules.js:ROLE_PERMS；kr.js:krAllCases、krCan | S36、roletest | 一致 | 改成新结构：按主案件/子案件过滤 |
| E-06 | KR 案件列表只含选了本医院且已缴/免面诊费的案件 | KR 室长/管理者 | kr.js:krAllCases、krCaseVisible | K1 相关、S36 | 一致(KR 系列 2/5) | 改成新结构：只本地的主案件 KR 看不到 |
| E-07 | 院长只看 director==自己 的案件，复诊沿用原案件院长 | KR 院长/代表院长 | kr.js:krAllCases、krCaseVisible | R92b、roletest | 一致 | 改成新结构：按主案件院长，子案件继承 |
| E-08 | 一般院长无客人管理菜单，但可从自己案件页点客人名进只读客户详情(只列自己负责案件) | KR 院长 | kr.js:krClientDetailAllowed、krClientRows | R76b、R61b | 一致(1021-08) | 照旧 |
| E-09 | KR 客人管理只有室长/管理者(krview)与代表院长(只读)；同一客人=来源诊所+档案id | KR 室长/管理者/代表院长 | kr.js:krClientRows、krOpenClient | R61b | 一致 | 照旧 |
| E-10 | KR 看不到客人联系方式(整行拿掉，不遮罩) | KR 全角色 | kr.js:krTabBasic；rules.js:maskPhone(已无调用) | R40a、roletest | 一致(1019-11) | 照旧 |
| E-11 | KR 看不到 IN 金额：viewerTextFilter 把 Rp/印尼盾 文字删除，面诊费/置换文字改写 | KR 全角色 | rules.js:viewerTextFilter | S39、roletest | 一致 | 改成新结构：子案件内本地项目和钱整体对 KR 隐藏 |
| E-12 | IN 看不到 KR 在韩加项的韩元金额(但尾款金额可见) | IN 全角色 | rules.js:viewerTextFilter；data.js:coreAddOnPaid 通知 | R15d | 不一致(加项已付款通知仍带₩，CLAUDE.md 1021-09 已列待决定) | 照旧 |
| E-13 | Timeline 中带金额/本地内容的记录对 KR 隐藏 | KR 全角色 | rules.js:viewerLogHidden；kr.js:krSubTimeline | roletest | 一致(1014-16) | 改成新结构：随子案件隐藏规则 |
| E-14 | KR 财务栏只显示 KR 看得到的部分 | KR 室长/管理者 | kr.js:krFinanceHtml | R17b | 一致(1015-17) | 改成新结构：按主案件汇总只含赴韩部分 |
| E-15 | KR 看不到 IN 本地项目、印尼本地持有小卡、客户隐私协议/特别备注 | KR 全角色 | data.js:clientDetailBodyHtml(mode KR)、cliHoldKrRows | R61b | 一致(1020-10) | 改成新结构：子案件本地项目 KR 不可见 |
| E-16 | 护照信息只有 IN 室长和 KR 室长可见，院长/代表院长/老板不见；护照号不进列表/通知/Timeline | IN 室长、KR 室长 | data.js:passportVisible、passportGate；kr.js:krTopAlerts | R40a、R41a | 一致(1019-11) | 照旧 |
| E-17 | 护照未登记不能付款；过期/施术前到期只报红不拦 | IN 室长 | data.js:batchNeedsPassport、passportAlert、confirmSettlementPayment | R41a | 一致 | 照旧 |
| E-18 | 跨诊所隔离：IN 页面只读自己诊所分区，KR 经 Store.withClinic 跨读 | IN/KR | store.js:Store.withClinic/readClinic/mutateClinic | S40 | 一致(多诊所补充) | 照旧 |
| E-19 | IN 的 KR 医院日程里其他诊所的施术只显示无字灰块，不出现诊所名/客人/内容 | IN 室长 | ui.js:krDayItems、krBlockStyle | R55a、CAL10 | 一致(1008-03) | 改成新结构：按子案件块显示 |
| E-20 | 一家诊所只对接一家医院，一家医院可对接多诊所 | IN/KR | data.js:CLINIC_HOSPITALS、clinicHospital | S40 | 一致(一诊所一医院) | 照旧 |
| E-21 | 同一账号同一案件只开一个分页(分页登记+BroadcastChannel定位) | IN/KR | ui.js:caseGo、caseRegBeat、openCaseDetail；kr.js:krShowCase | R34a、R38a | 一致(1019-08) | 改成新结构：入口落点按子案件定位 |
| E-22 | 同账号第二个分页弹遮罩，［在这里继续］抢持有权，原分页只读(inert) | IN 室长 | ui.js:presReadonly、presContinueHere、PRES_BLOCKED | 无(手测) | 一致(1012-01) | 照旧 |
| E-23 | 案件操作锁：不同室长同时打开同一案件只有一人可操作，其余只读，可［接管］，Timeline 记接管 | IN 室长、KR 室长 | ui.js:opGuard、opTakeover(op* 一组) | 无 | 一致(1014-18) | 改成新结构：锁粒度=主案件 |
| E-24 | 案件页打开时记「谁在处理」，列表客人名后挂标记 | IN 室长 | ui.js:presTag、gmc_case_presence | 无 | 一致 | 照旧 |
| E-25 | 终态案件页没有编辑入口 | IN 室长 | data.js:projectListTabHtml(isEnded 早返回) | 无 | 一致(1012-01) | 照旧 |
| E-26 | "操作过"=接待开始后实际处理过(代约不算)，用于列表「仅看我的」与推播 | IN 室长 | data.js:caseOperators、caseOperatedLogs | 无 | 一致(1008-06) | 改成新结构：按主案件累计操作人 |
| E-27 | 员工显示名=账号编号+角色，客人=客人N，演示数据不用真名 | 全部 | data.js:accountLabel、staffLabel、actorDisplay | 无 | 一致(1008-04) | 照旧 |
| E-28 | 登录后账号归属诊所/医院，sessionStorage 分页独立登录；?demo= 链接免密 | 全部 | data.js:applyDemoParam；store.js:guardPage | 无 | 一致 | 照旧 |
| E-29 | KR 案例库 IN/KR 各维护自己的案例，KR 室长/管理者可新增，院长/代表院长只读 | KR/IN | rules.js:ROLE_PERMS.krshowedit；data.js:libCaseCanEdit | R37a、roletest | 一致(1019-07) | 照旧 |
| E-30 | 重置演示数据保护用户案件，全部清空默认拒绝 | 开发/测试 | data.js:gmcResetAll、gmcUserSafeSave | R63a | 一致(1020-12) | 照旧 |

## 二、日历和预约

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系建议 |
|---|---|---|---|---|---|---|
| E-31 | 预约时间统一规则：过去不能选/额满显示已满/休诊不可选(客人自助与室长代约一致) | IN/客人 | data.js:slotBlockReason | CAL10、A3 | 一致(10-06) | 照旧 |
| E-32 | 室长可代约营业时间前后 2 小时(确认弹窗)，客人自助只能约营业时间内 | IN 室长/客人 | calalign.js:calOffHoursOk | CAL4 | 一致(1014-02) | 照旧 |
| E-33 | 每时段预约上限(诊所设定)，额满只标已满；占位也计入 | IN | data.js:slotBookingCount；calalign.js:capHtml | E7a/E7b | 一致 | 照旧 |
| E-34 | 约满标记取代「施术开放/未开放」：KR 医院层按在岗院长×段数，院长层按个人，IN 按时段上限×段数 | IN/KR | calalign.js:krCapSlots、capHtml、krCapHeadHtml、inCapHeadHtml | CAL5、CAL6 | 一致(1014-19) | 改成新结构：按子案件块占用计算 |
| E-35 | IN 日历日/周/月视图，默认周视图周日起，日视图按 KR 画法车道布局，同时段>3 个显示「+N 更多」 | IN 室长 | calalign.js:buildDayGridNew；ui.js:getWeekStart | CAL1、CAL4 | 一致 | 改成新结构：事件源改为子案件 |
| E-36 | 日历事件由案件现算(calendarEvents)，三种事件：预约来访/未到店/取消划掉；赴韩施术 travel 事件隐藏 | IN 室长 | data.js:calendarEvents、calEvHidden | CAL1 | 一致 | 改成新结构：日历按子案件显示 |
| E-37 | 取消的预约在日历划掉保留(cancelBy 区分)，不倒计时；旧取消仍消失 | IN 室长 | data.js:calEvHidden；ui.js:data-visit-case 倒计时收口 | 无 | 一致(1014-18) | 改成新结构：按子案件取消 |
| E-38 | 双时间轴：IN 印/韩，KR 韩/印；诊所时区由地址自动判定，画面只显示 UTC+n | IN/KR | calalign.js:axisHeadHtml；ui.js:krRows、krToPageTime | CAL2 | 一致 | 照旧 |
| E-39 | 时间点存 UTC(nowFullDt)，显示走 fmtUtc/tzRender；预约当地钟点存当地 | 全部 | rules.js:tzRender、tkU、tkK；data.js:nowFullDt | 无 | 一致(1007-03) | 照旧 |
| E-40 | 营业时间前后 2 小时按需展开(有预约落在营业外才展开，小条可手动展开)，底色 neutral-25 | IN/KR | ui.js:calOutBar、calHours、krRows；kr.js:krcApplyRange | CAL4 | 一致(1015-01) | 照旧 |
| E-41 | 休诊/午休：IN 休诊日窄列，部分时段休诊，诊所设定 closedRules；KR 医院 specialDays 优先于固定休诊 | IN/KR | data.js:isRescheduleDateDisabled、hospitalClosedOn、hospitalClosedFrom、hospitalClosedBefore | HS1、CAL10 | 一致(1008-04/1014-03) | 照旧 |
| E-42 | 改医院休息/半天营业前，已有排好的施术/术后管理冲突须先清空 | KR 管理者/代表院长 | hospspecial.js:hspConflicts、hspSet | HS2 | 一致(1014-05) | 改成新结构：冲突查子案件 |
| E-43 | IN memo/OFF：只能改自己写的，OFF 指定时间，不再有每周固定 | IN 室长 | ui.js:openMemoModal、deleteMemoDraft；data.js:offApplies | S34 | 一致(1008-04) | 照旧 |
| E-44 | KR 日历两层：医院层(客人预约小标签，不显示院长OFF)/院长层(预约+不可预约+OFF)，日/周/月 | KR 室长/管理者 | kr.js:krcPick、krcGridHtml、krcChipsHtml、krcEvents | CAL5、CAL6、R68a | 一致(1014-19/1020-16) | 改成新结构：块=子案件 |
| E-45 | 院长层点空白格加不可预约/标 OFF，医院层不弹 | KR | kr.js:krcCellClick | CAL5 | 一致 | 照旧 |
| E-46 | 院长整天 OFF 整栏灰底不能点，月视图写 OFF | KR/IN | data.js:dirFullOff、dirOffText；kr.js:krcGridHtml | CAL10 | 一致(1020-14) | 照旧 |
| E-47 | 同一位院长同一时间只能有一件事(施术/面诊/预约/不可预约/OFF/院长操作)，冲突询问或硬挡 | KR | data.js:krSurgerySlotError、krBusySlotError、directorClashList | S35、R21a、CAL8 | 一致(1008-01/1015-21) | 改成新结构：按子案件块占用 |
| E-48 | 冲突用询问弹窗［仍然进行］，休诊/营业时间用硬挡；非营业时间(午休/营业外)确认后可约 | KR | kr.js:krAskClash、krBlock、krOffConfirm；data.js:krOffHoursText | R22a、R22b | 一致(1015-22) | 照旧 |
| E-49 | 一次到院=一个日历块(同天同地点合并)，含施术=施术块占院长，否则术后到院不占院长 | KR/IN | data.js:visitCalBlocks、subCaseKey | R55a、R55b | 一致(1020-04) | 改成新结构：天然对应子案件 |
| E-50 | 术后管理不占院长时间，只看医院休诊/营业时间；院长操作项目(dirOp)才占 | KR | kr.js:krCbGo、krbClosedText；data.js:dirOpInfo | R30b、R56a | 一致(1015-30/1020-05) | 照旧 |
| E-51 | 施术块时长只算施术项目，加项需先问延长多久，管理项目不占时长 | KR | data.js:surgeryMinutes、coreProjectedConflict；kr.js:krExtOpen | R21a、R24a | 一致(1015-21/24) | 改成新结构：属当天子案件 |
| E-52 | IN 的 KR 医院日程只有周/月，分「医院」+各院长视图，本诊所客人到院可点进案件 | IN 室长 | ui.js:krDayItems、setKrDir、krInChipsHtml | R55a、R68a | 不一致(10-08 无日视图 vs 10-14 日视图，待确认) | 改成新结构：块按子案件 |
| E-53 | IN 的 KR 日程时间换算：统一经 krToClinic/ksTimeText 显示诊所时间+括号韩国时间 | IN | rules.js:krToClinic、ksTimeText | R55a | 一致(1007-04) | 照旧 |
| E-54 | 到院卡状态标签：待到院/已到院/已完成，IN 日程块带状态 | KR/IN | data.js:krMainState；ui.js:krDayItems | R66a | 一致(1020-15) | 改成新结构：状态属子案件 |
| E-55 | IN 工作台「KR 医院日程 N」显示今天本诊所客人在 KR 的到院数 | IN | data.js:krTodayArrivalCount | R66a | 一致 | 改成新结构：数子案件 |
| E-56 | 占位预约(krbook)：IN 在 KR 日程占位，KR 确认建新案件(krVisit)、到店、完成；无法安排则回 IN 重选 | IN/KR | krbook.js:coreBookConfirm、coreBookArrive、coreBookDone、coreBookReselect | BK1a-c、BK2a-c、BK3 | 一致(1014-16/18) | 改成新结构：占位确认建子案件 |
| E-57 | 占位预约不选院长，挂「全院」，只看医院休诊 | IN/KR | krbook.js:krbClosedText、KRB_HOSP | BK1b | 一致(1014-18) | 照旧 |
| E-58 | 占位来访目的 3 个：在韩术后预约/持有项目管理预约/新增访问 | IN | krbook.js:KRB_PURPOSE_NEW、krbPurposeFull | R71a | 一致(1020-18) | 改成新结构：目的挂主案件 |
| E-59 | 在韩管理(krmgmt)案件页干净版：只有页头+预约/到店/未到店/取消 | KR 室长 | kr.js:krCleanVisitPage | R24b | 一致(1015-24) | 改成新结构：并入子案件，独立案件类型拿掉 |
| E-60 | 客人自助预约入口：首页(预约/查看我的预约)、?ph=、?walkin=、?view=；语言印尼/中文 | 客人 | booking.js:bkHomeHtml、BK.mode | BK 系列、R70a | 一致(1012-03) | 照旧 |
| E-61 | 预约页流程：新客人 8 步，老客人手机验证+「是本人吗」后跳过个人资料；医美史结构化 | 客人 | booking.js:bkProfileNext、BK.mismatch | R70a | 一致 | 照旧 |
| E-62 | 名/姓/性别/出生日期必填，姓可勾「我没有姓」；旧资料不补不拦 | 客人/IN | booking.js:bkProfileNext；data.js:saveClientEdit | R70a | 一致(1021-01) | 照旧 |
| E-63 | 查看我的预约：手机号+验证码→我的预约(列表/日历)，号码无记录提示去预约；30 分钟内免验证 | 客人 | booking.js:bkLkSend、bkLkVerify、bkMeStart、bkMeCalHtml | BK 系列 | 一致 | 改成新结构：我的预约按子案件显示 |
| E-64 | 客人自助取消，取消后 30 分钟内重约合并通知(只一条「客人改约」) | 客人/IN | data.js:submitSelfBooking；booking.js | BK1c、BK2c | 一致 | 照旧 |
| E-65 | 预约占位 15 分钟倒计时，超时/取消从日历消失进预约历史；占位转预约后收掉并记已转预约 | IN | data.js:phConverted、submitSelfBooking；ui.js:PLACEHOLDER_HISTORY | E5、E7a | 一致(1013-13) | 照旧 |
| E-66 | 同一客人同一天只能有一个没到店的预约：新预约合并进去沿用原时间；已到店加进当次；已完成走提示 | IN/KR/客人 | data.js:pendingResvSameDay、krVisitTimeOnDate | R84a | 一致(1021-16) | 改成新结构：同日合并=同一子案件 |
| E-67 | 预约修改/取消：待访问行内按钮已移到案件页状态栏(已到店/预约取消/未到店/预约修改) | IN 室长 | data.js:markArrived、cancelReservation、markNoShow | A3 | 一致(1008-06) | 改成新结构：作用于子案件 |
| E-68 | 未到店判定：到点 30 分钟(noShowMs)自动判，每 5 秒扫描；日历保留原位+删除线 | IN | boot-in.js:autoNoShowSweep；data.js:markNoShow、simulateTimePass30 | E5、A3 | 一致 | 改成新结构：未到店作用于子案件 |
| E-69 | 接待中不停留：待访问点已到店且基础资料未保存=接待中，离开退回待访问(宽限心跳)，页内离开弹确认 | IN 室长 | data.js:receptionOpen、sweepStaleReceptions、receptionLeaveNow；ui.js:intakeLeaveOk | R50a | 一致(1008-06/1019-21) | 改成新结构：接待对象是子案件 |
| E-70 | 到访接续：来访客人有进行中案件时提示［接续］，接续后作废新案件、日历改挂原案件 | IN 室长 | data.js:ongoingCasesOf、resumeBannerHtml、resumeVisit、continueNewVisit | R18a、E10 | 一致(第19轮) | 拿掉：接续案件做法整个拿掉，改新子案件 |
| E-71 | 术后/复诊来访：到店弹窗选关联之前案件(followup)，进入术后来访页，另一套资料与本地管理 | IN 室长 | data.js:followupAsk、followupCardsHtml、followupCareCardHtml | R86a、R88a | 一致(1021-18) | 拿掉：接续案件做法拿掉 |
| E-72 | 面诊时间(KR韩国当地)+预计出报告时间(UTC)；面诊块在院长日程参与冲突检查 | KR | kr.js:krConsultTimesBlock；data.js:coreSetReportEta | R64b、R92b | 一致(1012-12) | 改成新结构：面诊=首个子案件内容 |
| E-73 | 客人希望的面诊时间：基础资料填(草稿)，确认随资料送出，KR 确认前可改并通知，确认后锁 | IN/KR | data.js:wantDraftRowHtml、saveWantConsult、wantConsultLocked | R91a、R64a | 一致(1021-23) | 照旧 |
| E-74 | 施术前 2 天：已确认行程(入境/离境/机场/确认方式)；在韩期间影响预约弹窗橙字/自动改回印尼/未安排预约范围 | IN/KR | calalign.js:openStayModal、stayGate；data.js:stayOutDate、coreSetStay | R62a、R65a | 一致(1020-11/13) | 改成新结构：属流程(跨天)层 |
| E-75 | 施术日期通知客人：［发送给客人］(短信/WhatsApp)，KR 改日期后红字请电话通知 | IN 室长 | calalign.js:surgSendHtml、surgInformKey、openSurgPhone | R42a、R45a | 一致(1019-16) | 照旧 |
| E-76 | 施术日期卡：KR 未回复前［取消赴韩］，回复后［无法协调］；确认后［取消项目］；不再有施术前 2 周不可改期 | IN 室长 | data.js:requestCannotCoordinate、krScheduleReplied | R41a、D31 | 一致(1012-13/1019-12) | 照旧 |
| E-77 | KR 到院按钮只有当天能按(模拟到当日仅演示)，用词统一［客人已到院］ | KR 室长 | kr.js:krArriveMainBtn、krArriveSubBtn；data.js:mainArriveBlock、coreMarkArrived | R81a | 一致(1021-13) | 改成新结构：到院=子案件到店 |
| E-78 | 到院已完成的日子不能再排进项目，弹专门提示，只有当天可［增加项目］重开，00:00 锁定 | KR 室长 | kr.js:krDoneDayAsk；data.js:doneDayInfo、coreReopenVisitAt | R83a、R79a | 一致(1021-11/15) | 改成新结构：天然=子案件已完成 |
| E-79 | KR 预约弹窗按日期分组同天一起约，晚于离境日橙字/自动改印尼，休诊红字不勾选，并入已有到院 | KR 室长 | kr.js:krCbOpen、krCbRender、krCbGo、krCbGone | R52b、R72b | 一致(1021-02/04) | 改成新结构：同天=同子案件 |
| E-80 | IN 未安排预约：只放印尼术后管理，按客人折叠，预约弹窗多次分行，同天合成一次到店 | IN 室长 | todo.js:todoUbIn、todoUbGroupsIn、todoCbOpen、todoCbGo | R58a、R71a | 一致(1020-18) | 改成新结构：预约生成子案件而非接续 |
| E-81 | KR 子案件行为：术后管理/管理项目到院为第 N 次到院卡，编号 A…-N 仅内部，画面叫「到院」 | KR/IN | data.js:subCaseList、subCaseKey、subCaseNo；kr.js:krCaseCardHtml | R49a、R22b | 一致(1019-20/21) | 改成新结构：正式升格为子案件(ID=主案件号-序号) |
| E-82 | 韩国行程结束／IN 结案：手动确认，不自动结案；待办每天早上问 | KR/IN | data.js:coreTripEnd、coreInClose、tripAskDue、inCloseDue | R84a | 一致(1021-16) | 改成新结构：结束作用于流程 |

## 三、通知待办

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系建议 |
|---|---|---|---|---|---|---|
| E-83 | 通知对象 NOTIFS+pushNotif：自动算收件人(当天上班的室长/操作过案件者)，操作人自己不收，有 OFF 的不收 | IN 室长 | ui.js:pushNotif；rules.js:pushTargets；data.js:caseOperators | TD2、S41 | 一致 | 改成新结构：收件人按主案件 |
| E-84 | 通知分级：action需处理/next进入下一阶段(手动确认 toast)/info(6 秒消失) | IN/KR | rules.js:notifLevel；todo.js:notifTodoKind | TD2、TDK2 | 一致(1012-02) | 照旧 |
| E-85 | popup 两种：'once'(客人预约当天才弹)与'confirm'(设定更新，离线上线补弹) | IN/KR | ui.js:pushNotif、toastNewNotifs；kr.js:krToastNew | TD2 | 一致(1015-09) | 照旧 |
| E-86 | toast：通知类 sticky 点［确认］才消失，操作反馈 6 秒自消，最多 4 个；紧急(来电/@/未接)带彩色图标 | IN/KR | ui.js:showToast、toastNewNotifs；kr.js:krToastNew | TD2 | 一致 | 照旧 |
| E-87 | 新通知 toast 在数据读入后立刻弹，不挂在可延后的画面重绘上 | IN/KR | store.js:storage 事件；ui.js:remoteNotifTick | 无(手测) | 一致(1012-08) | 照旧 |
| E-88 | 通知点击落点：IN openNotif 按类型进 tab/历史页/客户详情；KR krNotifTarget 进面诊/施术/项目/对话/设定 | IN/KR | ui.js:openNotif；kr.js:krNotifTarget、krOpenNotif | R38a | 一致(1013-13) | 改成新结构：落点到子案件卡 |
| E-89 | 通知中的时间用标记 ⟦u:⟧/⟦k:⟧，按看的人时区渲染 | IN/KR | rules.js:tkU、tkK、tzRender | 无 | 一致(1008-14) | 照旧 |
| E-90 | KR 通知可指名(only)，KR 通知存医院分区，卡片红点 cardSeen | KR | kr.js:pushKrNotif、krNotifsForMe；data.js:HOSPITAL_DATA.notifs | K1 | 一致 | 照旧 |
| E-91 | 关键事件通知：缴/免面诊费→KR；KR 确认面诊时间→IN(action)；诊疗方案已出→IN 需确认；上传面诊内容→KR 请发送 | IN/KR | data.js:coreSetReportEta、coreSubmitReport；ui.js:pushNotif | R15c、R77a | 一致(1021-09) | 照旧 |
| E-92 | 开始面诊通知 KR(next)+IN(info)；院长上传内容通知 KR 室长 | KR/IN | data.js:coreStartConsult；kr.js:krRecUpload | R15c | 一致(1012-08) | 照旧 |
| E-93 | 在韩期间/行程/加项等 KR 操作多不通知 IN；保留确认施术时间/到院/判断/退款/结案/付尾款/转印尼 | IN | data.js:各 core* 的 pushNotif 调用 | R59a | 一致(1013-08) | 改成新结构：通知挂子案件 |
| E-94 | 推给印尼的术后管理汇总成一条通知，每行只通知一次；旧数据启动补发 | IN | data.js:handToInNotify；boot-in.js:repairHandToIn | R58b | 一致(1020-07) | 改成新结构：交接即新建 IN 子案件 |
| E-95 | 术后管理提前做 KR 收通知只告知；过建议日期 IN 待办+标红 | KR/IN | data.js:coreCareVisit、postcareDueList | R17a | 一致(1013-06) | 改成新结构：随子案件 |
| E-96 | 待办栏：日历:待办=2:1，6 栏(出现时间/阶段/进程/截止/状态/客人)，分「昨日及更早/今天」，超时红字用截止时间排序 | IN/KR/院长 | todo.js:todoPaneHtml、todoRowHtml、todoGroupOf、todoShownAt、todoSort | TD1、TDK1 | 一致(1015-07) | 照旧 |
| E-97 | 待办=现在需要我动手的事：未超时的等待类(ref)不进待办，只在点卡片时灰名单显示 | IN/KR | todo.js:todoVisible、TODO_REF_CATS、todoRefMode | TD1、TDK1 | 一致(1015-08) | 照旧 |
| E-98 | IN 待办项：面诊资料已到联络客人、等 KR 超时催办、待收款、转告/发送客人、预约占位快过期、被@/未接来电、昨日到院未离院等 | IN | todo.js:inTodoItems | TD1 | 一致 | 改成新结构：待办挂主案件或子案件 |
| E-99 | KR 待办项：确认预计出报告时间、发送诊疗方案、被催办置顶、确认施术/改期、今天到院、在韩加项待付款、院长上传面诊、行程是否结束 | KR | todo.js:krTodoItems | TDK1 | 一致 | 改成新结构：到院类待办挂子案件 |
| E-100 | 院长待办：上传面诊内容/恢复确认(KR 未确认时间计入参考名单)；院长不收「今天到院」待办 | KR 院长 | todo.js:krTodoItems(kind upload/recover/recoverwait/dsurg) | R92b、R15b | 一致(1021-24) | 照旧 |
| E-101 | 4 张卡片=待办 4 类(cat)，数字=筛选后待办条数，0 绝不亮红点；点卡筛选待办栏，参考类显示灰名单 | IN/KR | todo.js:todoCatCardsHtml、todoCardFilter、todoCardDot；TODO_CAT | TD3、TDK1 | 一致(1014-02) | 照旧 |
| E-102 | 院长 4 卡：待面诊/待施术/恢复确认/新消息 | KR 院长 | todo.js:todoKrDirCardsHtml | R15b | 一致(1015-15) | 照旧 |
| E-103 | 待办红点：首次出现/逾期那刻亮，打开案件灭，每账号各记(localStorage todoseen) | IN/KR | todo.js:todoIsNew、todoMarkCaseSeen、todoTabDot | TD3 | 一致(1015-05/1020-12) | 照旧 |
| E-104 | 「待办 N｜未安排预约 N」分页；未安排预约不进待办，红点按新进/逾期；KR 来源写来源诊所 | IN/KR | todo.js:todoPaneHtml、todoUbItems、todoUbKr、todoUbDot | R71a、R71b | 一致(1020-07) | 改成新结构：未安排项挂主案件流程 |
| E-105 | 催办：等报告超预计时间/待确认施术超 1 个工作日才出现；KR 被催办置顶 | IN/KR | data.js:urgeInfo、urgeKr；todo.js:todoWorkdaysSince | TD4、S41 | 一致(1013-17) | 照旧 |
| E-106 | 视频来电信号 gmc_call：ringing→accepted/declined/ended/missed，30 秒超时，只通知被叫室长，院长不响铃 | IN/KR | data.js:callTargets、recordMissedCall；ui.js:startCall、inHandleCallSignal；kr.js:krCallRelevant | R15a | 一致(1015-15) | 照旧 |
| E-107 | 未接来电只给被叫室长记一条指名通知，按信号 id 去重 | KR | data.js:recordMissedCall；kr.js:krCallRingFallback | R15a | 一致 | 照旧 |
| E-108 | 案件房建房条件=基础资料确认或缴/免面诊费；成员=操作过的 IN 室长+KR 室长，院长静音；终态归档 | IN/KR | data.js:ensureCaseRoom、caseRoomMembers、caseRoomEligible、archiveCaseRoom | R38a | 一致(第21轮/1008-14) | 改成新结构：房间挂主案件 |
| E-109 | 职员间(Main 群)按诊所×医院分开，KR 可新建职员对话，成员=本院KR+同一诊所 IN 室长 | IN/KR | kr.js:krOpenNewStaffChat；data.js:ROOMS | K1 | 一致(1014-16) | 照旧 |
| E-110 | @/# 快捷：@ 人必提醒，@ 自己高亮，# 引用案件，被@写 mention 通知；院长房间未读只算@他的 | IN/KR | ui.js:floatInput、pickSuggest、notifyAtMentions；kr.js:krFlCtx | R38a | 一致(第22/28轮) | 照旧 |
| E-111 | 引用案件 chip 显示「阶段 · 进程」，案件房引用消息显示来源房间，建房后带入 pendingQuotes | IN/KR | ui.js:refBarHtml、deliverRefQuote、openMentionCase | 无 | 一致 | 改成新结构：引用到主案件/子案件 |
| E-112 | 对话未读数不含@，抽屉按最后消息排序，静音 🔕 房间不推播 | IN/KR | ui.js:updateChatBadge、roomLastKey、MUTED_ROOMS | 无 | 一致(第28轮) | 照旧 |
| E-113 | 案件状态变化不发进对话房，视频结束只发系统消息 | IN/KR | ui.js(已删 sendMainAnnouncement) | 无 | 一致 | 照旧 |
| E-114 | 备注自动翻译：作者角色与读者不同时显示译文+［查看原文］，翻译 API 仍是占位 | IN/KR | data.js:noteTextHtml、mockTranslate | R82a | 一致(1021-09) | 照旧 |
| E-115 | 备注卡只显示最新 3 条，增加/查看全部为 Modal；到院整体备注离开输入框存草稿、离院时存成一则 | IN/KR | data.js:notesCompactHtml、notesAddOpen、coreVisitNoteCommit | R82a、R73a | 一致(1021-09/14) | 改成新结构：整体备注属子案件 |
| E-116 | IN 备注结算前 KR 必须已读(未读先弹读)，备注卡标 IN 未读 | KR 室长 | kr.js:krNotesGate、krNoteRead；data.js:coreAddInNote | R59b | 一致(1020-08) | 照旧 |
| E-117 | 被 IN 通知「X 已到院」「KR 已确认面诊时间」等 info 通知只告知不进待办 | IN | data.js:coreMarkArrived、coreSetReportEta | R66a | 一致 | 改成新结构：挂子案件 |
| E-118 | 分页标题「账号 角色 · 页面 – GMC IN/KR」，案件分页「账号 · 客人名(Case ID)」，favicon 三色 | 全部 | ui.js:gmcPageTitle | R38a | 一致(1019-08) | 改成新结构：标题可含子案件号 |
| E-119 | 版本变化提示：旧分页每 5 秒比对 version.js hash，提示刷新 | 全部 | ui.js(末尾定时器)；version.js | 无 | 一致(1012-10) | 照旧 |
| E-120 | 页头对话/铃铛/头像统一挂在页面第一行，二级页面第一行=返回+图标 | IN/KR | ui.js:headMount、HEAD_L2 | FS1 | 一致(1015-02/03) | 照旧 |
