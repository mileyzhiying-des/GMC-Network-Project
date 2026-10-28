# B 模块盘点：面诊 / 复诊（只读盘点，规格列依据 CLAUDE.md 的 CMD 记录；「一致」= CLAUDE.md 有写且与代码一致；「未写」= 仅代码行为）
注：测试编号里 Rxx 在 selftest.js，Cxx/Dxx/Sxx 同；覆盖页 CHECKS 的 C/D/E 组不另列。

## 一、IN 基础资料（面诊）
| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| B-01 | 预约时即生成 Case ID；已到店且基础资料「确认」后才解锁发起对话/加本地管理/增加面诊/附件等 | IN 室长 | data.js:createReservationCase / materialsConfirmed 开关 | R94a | 一致(1015前总纲) | 改成新结构：Case ID 并入主案件 |
| B-02 | 基础资料分「基本信息」「到访目的」两张卡，顺序固定（手写苦恼→关联→메타뷰→面诊需求→苦恼→院长→预算→附件→医美史） | IN 室长 | data.js:materialsCardHtml / basicTabHtml | R85a R94a | 一致(1021-17/20) | 照旧 |
| B-03 | 一般案件 메타뷰 面诊/不面诊都必填，缺了不能确认 | IN 室长 | data.js:confirmMaterials / materialsCardHtml(metaRow) | R88a R85a | 一致(1021-20) | 照旧 |
| B-04 | 关联案件(术后/复诊)来访 메타뷰 选填 | IN 室长 | data.js:followupCardsHtml | R88a R86a | 一致 | 改成新结构：随接续拿掉 |
| B-05 | 面诊需求三选一：面诊/不面诊/沿用原诊疗方案；选了才展开苦恼与院长 | IN 室长 | data.js:concernExpectHtml / setNeedsConsult | R85a R33a | 一致 | 改成新结构：沿用并入新子案件 |
| B-06 | 面诊=按部位卡片(面部/身体→细部位→第三层)+选院长；不面诊=메타뷰+手写苦恼框 | IN 室长 | data.js:toggleConcernGroup / toggleConcernPart / concernCardsHtml | R32a R33a R85a | 一致(1019-01/03,1021-17) | 照旧 |
| B-07 | 每张部位卡：苦恼说明*、希望预期*、视频、各角度照片；≥2部位出现苦恼总memo | IN 室长 | data.js:concernFormHtml / saveConcernMemo | R32a R34a | 一致(1019-04) | 照旧 |
| B-08 | 不面诊时照片/视频选填，苦恼说明与希望预期仍必填 | IN 室长 | data.js:concernMissing / concernMediaOptional | R32a | 一致 | 照旧 |
| B-09 | 部位拍摄要求(角度/是否需视频/参考图/说明)由 KR 项目库设定，项目可另设；上传时现读不快照 | KR 设定,IN 读 | data.js:shootSpec / shootShowAngles; kr.js:krShootTabHtml | R90a R90b | 一致(1021-22) | 照旧 |
| B-10 | 每张上传卡右上［视角参考］Modal，无参考灰掉 | IN 室长 | data.js:shootRefBtn / shootRefOpen | R90a | 一致 | 照旧 |
| B-11 | 院长卡片只能选卡片；今天整天OFF灰显不可选，半天OFF只标 | IN 室长 | data.js:directorCardsHtml / directorTodayOff | R33a R35a | 一致(1012-02) | 照旧 |
| B-12 | 院长按苦恼部位匹配排序(完全对到1分、同大类0.5分)，OFF排后，代表院长默认靠前 | IN 室长 | data.js:docPartMatch / projectPartsOf / hospitalDirectors | R33a R35a R37a | 一致(1019-03/07) | 照旧 |
| B-13 | 复诊/延续既往面诊时院长与医院锁定为原案件院长 | IN 室长 | data.js:directorLockInfo / syncDirectorChoice | C17 R86a | 一致(1021 起) | 改成新结构：同主案件自动同院长 |
| B-14 | 出报告前可换院长；复诊/延续锁定；换院长不是单独流程 | IN 室长 | data.js:directorChangeInfo | R35a | 一致(1002) | 照旧 |
| B-15 | 点院长头像/名字在新分页开院长介绍页，点卡片其他处选中 | IN 室长 | data.js:openDirectorNewTab / directorIntroHtml | R34a R35a | 一致(1019-05) | 照旧 |
| B-16 | 预算选填，区间 Rp 最低～最高；复诊不要预算 | IN 室长 | data.js:budgetRowHtml | R92a | 一致 | 照旧 |
| B-17 | 意向项目栏已拿掉，不再必填/不显示(旧数据不删) | IN 室长 | data.js:intentRowHtml(恒空) / intentionInfoHtml | R33a | 一致(1019-02) | 拿掉：死代码 |
| B-18 | 客人希望的面诊时间：到访目的里选填(只有选面诊/复诊才出现)，确认时随资料送 KR | IN 室长 | data.js:wantDraftRowHtml / saveWantDraft | R91a | 一致(1021-23) | 照旧 |
| B-19 | 面诊资料tab希望面诊时间只读+［修改］；KR确认时间前可改并通知KR，之后锁 | IN 室长 | data.js:wantConsultRowHtml / saveWantConsult / wantConsultLocked | R91a R64a | 一致 | 照旧 |
| B-20 | 医美史：外院补登(年月必选日选填、项目手输多行)+本院做过项目合并，倒序 | IN/KR 室长 | data.js:openBeautyAdd / saveBeautyAdd / cliHistoryHtml | R34a R61a | 一致(1019-04,1020-10) | 照旧 |
| B-21 | 客人基本信息卡：姓名/性别/生日/病史过敏史/联系方式/护照，各行［修改］写回客户档案 | IN 室长 | data.js:clientBasicBlockHtml / openClientEdit / saveClientEdit | R40a R70a | 一致(1019-11) | 照旧 |
| B-22 | 名/姓/性别/生日必填，可勾「我没有姓」；旧资料缺项不补不拦 | IN, 客人预约页 | ui.js:saveClientEdit; booking.js:bkProfileNext | R70a | 一致(1021-01) | 照旧 |
| B-23 | 确认赴韩时护照必填；已有且有效不弹窗，过期/施术前到期才弹，只报红不拦；未登记不能付款 | IN 室长 | ui.js:passportGate / passportAlert; rules.js:batchNeedsPassport | R40a R41a | 一致(1019-11/12) | 改成新结构：护照校验挂项目汇总确认赴韩点 |
| B-24 | 护照仅 IN 室长/KR 室长可见；院长、老板不显示；号码不进列表/通知/Timeline | IN,KR | data.js:passportVisible | R40a R61b | 一致 | 照旧 |
| B-25 | 取消接待只在基础资料确认前；离开接待页弹确认，关分页心跳过期退回待访问 | IN 室长 | ui.js:intakeLeaveOk / receptionOpen / sweepStaleReceptions | R50a | 一致(1008-06) | 照旧 |
| B-26 | 新客自助预约的手写苦恼 `visitNote` 作只读参考显示在到访目的第一行 | IN | data.js:guestConcernRowHtml | R85a | 一致(1021-17) | 照旧 |

## 二、面诊费 / 取消 / 免除

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| B-27 | 面诊费金额选面诊时记入案件，卡与财务栏读 consultFeeOf | IN | data.js:recordConsultFee / consultFeeOf | C14 R85a | 一致(1008-07) | 改成新结构：挂在面诊安排流程上 |
| B-28 | 面诊费卡：待缴费时内联表单选已缴费/免除；免除原因复诊/延续既往面诊，预选可改，原因必填 | IN 室长 | data.js:consultFeeFormHtml / WAIVE_REASONS | C14 R99a | 一致(1018-1020) | 改成新结构：免除条件重定义(同主案件后续面诊) |
| B-29 | 缴/免面诊费自动建案件对话房(不通知)，同时 KR 开始可见该案件 | IN→KR | data.js:ensureCaseRoom; krAllCases | R101a R38a | 一致(1014-14) | 照旧 |
| B-30 | ［面诊取消］只在待缴费时可用，取消后转选择项目+本地管理 | IN 室长 | ui.js:cancelConsult | C13 | 一致(1020) | 照旧 |
| B-31 | 不面诊案件付款前后都可［增加面诊］，增加面诊顺序：预算→院长→面诊费→确认 | IN 室长 | data.js:addConsultMode / addedConsultAfterLocal | B12 R33a | 一致(1029,1013-13) | 改成新结构：增加面诊=主案件新流程 |
| B-32 | 缴费后待KR确认超时(30分钟)可催办，等报告超时可催 | IN 室长 | data.js:urgeInfo / urgeKr | TD4 S41 | 一致(1012-01，待规则) | 照旧 |

## 三、KR 确认时间 / 开始面诊 / 录入 / 发送

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| B-33 | KR 室长确认面诊时间+预计出报告时间；面诊块`kind:面诊`进院长日程，和施术同级不可重叠 | KR 室长 | kr.js:krConsultTimesBlock; data.js:coreSetReportEta / coreConfirmConsultTimes | R64b R65b | 一致(1008-12) | 照旧 |
| B-34 | 确认卡显示「客人希望」「X当天日程」，非营业/午休确认后可约，院长冲突询问 | KR 室长 | kr.js:krConsultTimesBlock / krOffConfirm / krAskClash | R64b R22a | 一致(1013-02,1022) | 照旧 |
| B-35 | KR确认时间后IN收需确认通知；KR修改时间通知院长 | KR→IN | data.js:coreSetReportEta(pushNotif) | R65a | 一致(1020-13,1010) | 照旧 |
| B-36 | 开始面诊(院长或室长谁先按)记consultStartedAt→小状态面诊中，通知对方 | KR | data.js:coreStartConsult; kr.js:krStartConsult | R104b | 一致(1012-05/08) | 照旧 |
| B-37 | 面诊卡开始后折叠成一行，时间/预计时间收进展开区 | KR | kr.js:krEtaStatusBlock / KR_CONSULT_OPEN | R38a | 一致(1019-08) | 照旧 |
| B-38 | 录入面诊=右侧侧边栏(语音/手动)，可收起，草稿存localStorage，离开确认 | KR 室长/院长 | kr.js:krRecOpenModal / krRecModalRender / krRecLeaveOk | R38a | 一致(1019-08) | 照旧 |
| B-39 | 上传内容弹确认后锁定，改［增加内容］；上传=面诊结束，之后才显示发送诊疗方案区块 | KR | kr.js:krRecordBlock; data.js:consultContentAt | R38a | 一致(1012-05) | 照旧 |
| B-40 | 上传后IN进程：已开始=面诊中，上传后=等待报告，其余按有无consultAt | IN | rules.js:caseProcessText | R101a | 一致(1008-13) | 改成新结构：按流程(面诊安排)计进程 |
| B-41 | 等待报告超时只提醒不结案；超时通知只发一条 | IN/KR | data.js:simulateReportTimeout / overdueNotified | E8 | 一致 | 照旧 |
| B-42 | AI整理(演示模板)把所有录入笔数一起整理，可编辑 | KR 室长 | kr.js:krAiOrganize / krRecordBlock | R38a | 一致 | 照旧 |
| B-43 | 发送诊疗方案左1/3 内容 右2/3 可选范围；至少勾1个项目(施术或管理)才能发送 | KR 室长 | kr.js:krSubmitBlock / krSubmitReport; data.js:coreSubmitReport | R16b R25 | 一致(1013-07,1015-16) | 照旧 |
| B-44 | 可选范围分施术项目/管理项目(管理项目含规格/次数/间隔/单价)；每项带麻醉/建议在韩天数/所需术后管理 | KR 室长 | kr.js:krProjDetailHtml / krMgScopeItem; data.js:krScopeCandidates | R16b R39a | 一致(1015-16/22) | 照旧 |
| B-45 | 建议在韩天数≥必须在韩国的术后管理最后一天+1；多于最少需写停留原因 | KR 室长 | rules.js:stayMinOf / stayReasonOk; kr.js:krStayCommit | R46a | 一致(1019-17) | 照旧 |
| B-46 | 麻醉睡眠/全麻可填「需空腹小时」，作短信与打印用 | KR | rules.js:anesFastOf | R43a | 一致(1019-14) | 照旧 |
| B-47 | 补加可选项目(同表单)，只能加不能改已发 | KR 室长 | kr.js:krAddCardHtml; data.js:coreAddScopeItem | R16b | 一致(1015-05) | 照旧 |
| B-48 | 诊疗方案已出：IN 需确认通知(停留)+待办「面诊资料已到」点开进面诊资料tab；消失于选项目/付定金/结束案件 | IN | data.js:coreSubmitReport; todo.js:inTodoItems(plan) | R77a R15d | 一致(1021-09) | 照旧 |
| B-49 | 诊疗方案单独页面+PDF(打印)存附件(演示) | IN | data.js:renderReportPage / reportDocHtml | 无 | 一致(1012-02) | 照旧 |
| B-50 | 报告用「诊疗方案」称谓，状态名仍叫「等待报告/待确认报告时间/仅出报告」 | 全员 | rules.js:caseStageInfo / 文案 | R97b | 一致(1012-02) | 照旧 |
| B-51 | KR 面诊tab只在面诊案件显示，IN 面诊资料tab拿掉「客人资料」块，客人资料只放基础资料 | IN,KR | data.js:caseTabContentHtml; kr.js:krTabConsult | R38a | 一致(1019-08) | 照旧 |

## 四、IN 选项目 / 仅出报告 / 延续既往面诊

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| B-52 | 项目列表只在面诊案件出诊疗方案后出现；选项目含赴韩+本地+管理项目分页 | IN 室长 | data.js:projectPickerHtml / scopeMgmtRowsHtml / localPurchaseHtml | R16a R82 | 一致 | 改成新结构：并入项目汇总 |
| B-53 | 赴韩定金=(施术+管理项目)×30%(演示比例)，其余尾款；术后管理不计价 | IN | data.js:computeBatchBreakdown | R16a | 一致(1015-16) | 照旧 |
| B-54 | 确认赴韩前护照/在韩期间弹窗(可先空) | IN | data.js:confirmProjectSelection / stayGate | R62a | 一致(1020-11) | 改成新结构：挂项目汇总 |
| B-55 | 客人不做项目→仅出报告；项目全取消后问是否做本地管理 | IN 室长 | ui.js:noProjectForClient / afterKrItemsChanged | C15 | 一致 | 照旧 |
| B-56 | 仅出报告：面诊费已缴/免、报告未出时手动结束→仍可收KR报告放进已结束案件 | IN | data.js:computeOutcome / manualEnd | G1-G4 | 一致(1013-16) | 改成新结构：主案件保持开启 |
| B-57 | 延续既往面诊：沿用旧报告(1个月内)/免面诊/超期锁定；`c.reuseReport` | IN | rules.js:reusableReportSrc; data.js:applyReuseReport / continuationInfo | C17 R95a | 一致(1018) | 拿掉：并入同主案件新子案件 |
| B-58 | 延续既往面诊等待报告时 KR/模拟判断无变动/有变动(`judge_pending`) | KR/IN | data.js:coreJudgeContinuation | C17 | 一致(1018-四) | 拿掉：接续案件做法取消 |
| B-59 | 沿用旧报告带入附件，旧报告超一个月提示 | IN | data.js:reportOverMonth / applyReuseReport | C17 | 一致 | 拿掉：同主案件内直接查看 |

## 五、接续面诊(resume)

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| B-60 | 到店弹窗：不接续/接续三选一(接续面诊/复诊评估/术后管理)，可多选类型，以首要类型为主 | IN 室长 | data.js:followupAsk / followupAskDone / resumeTypesOf / resumePrimaryType | R95a R102a | 一致(1022-06/15) | 拿掉：接续案件整个拿掉 |
| B-61 | 接续面诊候选只限「仅出报告」且未付定金、非复诊评估的案件 | IN | data.js:resumeCandidates | R98a | 一致(1022-09) | 改成新结构：同主案件新子案件 |
| B-62 | 术后管理/复诊评估候选只限赴韩已结束(行程结束)案件，或未安排预约约来的 | IN | data.js:resumeCandidates(careFor) | R99a | 一致(1022-12 B5) | 改成新结构：赴韩流程完成的主案件 |
| B-63 | 接续面诊三道检查：①距实际面诊日≤3个月 ②医美史无影响 ③项目无变化，三项通过才可接续 | IN 室长 | data.js:resumeChecksOf / resumeOverdue / resumeConsultDay | R95a | 一致(1022-06) | 改成新结构：保留检查，用于新子案件 |
| B-64 | 接续面诊不收面诊费 | IN | data.js:consultFeeOf(resume) | R99a | 一致 | 改成新结构：子案件继承 |
| B-65 | 接续后原案件号/院长/医院锁定，KR 页头显示「面诊：N次｜施术：N次」 | IN,KR | kr.js:krRenderCaseDetail; data.js:visitNoText | R98b R99b | 一致(1022-09/12) | 改成新结构：由主案件统计取代 |
| B-66 | 同客人进行中案件接续条(resumeBanner)/到访接续(resumeVisit)：旧案件作废、日历改挂 | IN | data.js:resumeBannerHtml / resumeVisit / continueNewVisit | R94a | 一致(1019,1021-18) | 拿掉：接续案件拿掉 |
| B-67 | 来访目的/到店弹窗按客人状态灰掉不适用选项 | IN | data.js:followupAsk | R102a | 一致(1022-15) | 改成新结构：子案件类型选择 |

## 六、术后来访 followup（IN）

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| B-68 | 关联之前案件→改走术后/复诊流程，`c.followup`+`linkedCase` | IN | data.js:setLinkedCase / followupOn / cancelFollowupLink | R86a R94a | 一致(1021-18) | 拿掉：接续案件拿掉 |
| B-69 | 术后来访页：基本信息折叠、客人手写苦恼、面诊需求二选一 | IN | data.js:followupCardsHtml / toggleBasicOpen | R86a | 一致 | 改成新结构：新子案件首页 |
| B-70 | 不面诊的术后来访：메타뷰/苦恼选填，多一张术后恢复卡(项目按部位角度传照片/视频，进附件) | IN | data.js:recoveryCardHtml / mockUploadRecovery | R86a R90a | 一致 | 改成新结构：随复诊评估 |
| B-71 | 术后来访本地管理tab：上半术后管理卡(客人其他案件印尼术后管理行，［做术后管理］扣原案件)，下半本地管理 | IN | data.js:followupCareCardHtml / openCareUse / confirmCareUse | R86a R107a | 一致(1021-18) | 改成新结构：项目汇总统一 |

## 七、复诊评估(新)与复诊面诊(旧)

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| B-72 | 复诊面诊：consultKind=复诊，复诊想问内容必填+要看的项目(原案件做过的施术)+每项目上传卡(视频+角度照片)，无苦恼部位卡 | IN | data.js:followupCardsHtml / saveRevisitQuestion / toggleFollowProject / revisitMediaCardsHtml | R89a R105a | 一致(1021-21,1022-19) | 改成新结构：复诊评估流程 |
| B-73 | 旧复诊数据(存苦恼部位)照旧显示不迁移 | IN,KR | data.js:revisitNewStyle / concernCardsHtml | R89a | 一致 | 拿掉：旧数据兼容 |
| B-74 | 复诊面诊标示(进程前缀「复诊·」、KR标题、通知、院长日程「复诊面诊」) | IN,KR | rules.js:isRevisitConsult / caseProcessText | R87a | 一致(1021-19) | 拿掉：被复诊评估取代 |
| B-75 | 复诊评估案件`c.revisitEval`：不收费、状态/名称/待办/计数/通知按复诊评估走，内部借用面诊时间确认/录入/发送组件 | IN,KR | rules.js:isRevEval / revEvalProcText; data.js:revEvalTabHtml | R96a R96b | 一致(1022-07) | 改成新结构：流程(复诊评估)，每次复诊一个 |
| B-76 | KR 复诊评估tab：先确认评估时间再折叠恢复确认，确认后展开；复诊没有预算 | KR 室长 | kr.js:krRevEvalCard / krRecoveryCard / KR_RV_OPEN | R92a R96b | 一致(1021-24,1022-07) | 改成新结构：流程内页面 |
| B-77 | 评估结论［恢复正常］［需要处理］，院长或室长任一方可选，发送前可改，评估人记 proxy | KR 院长/室长 | kr.js:krSetRecoveryResult; data.js:recoveryResult | R87a R92b R104b | 一致(1021-19/24) | 照旧 |
| B-78 | 院长确认/室长代操作须先勾授意(revAuth)才能开始评估；先选结论，需要处理才弹录入，按确认才结束 | KR 室长/院长 | kr.js:krRecStart; data.js:revAuth | R97b R104b | 一致(1022-08/19) | 改成新结构：授意记在流程上 |
| B-79 | 发送评估：恢复正常=结论+memo预览(AI只整理memo，无memo可直接发)，需要处理=评估说明格；项目方案可不附 | KR 室长 | kr.js:krSubmitBlock / krSubmitReport | R106a R87a | 一致(1022-20) | 照旧 |
| B-80 | 评估结果卡：评估确认后KR画面复诊评估卡在上、项目卡默认折叠 | KR | kr.js:krRevEvalCard / krRecoveryCard | R106a | 一致(1022-20) | 照旧 |
| B-81 | IN 复诊评估结果卡：恢复正常=结论+整理后的memo；推荐本地项目文字/建议赴韩 | IN | data.js:revEvalResultHtml / revResultCardHtml / revResultOpen | R97a | 一致(1022-08) | 改成新结构：赴韩建议→新主案件轻关联 |
| B-82 | 复诊评估推荐赴韩：转走原案件流程(转赴韩)，现为复诊案件内选项 | IN | data.js:revProjCardsHtml / revProjToggle | R97a R100a | 一致 | 改成新结构：复诊建议赴韩=新主案件轻关联 |
| B-83 | 推荐本地项目→［根据推荐选本地项目］走本地选购(localTrack) | IN | data.js:revEvalStartLocal | R97a | 一致 | 改成新结构：本地项目入项目汇总 |
| B-84 | 前后对比：术前(原案件)｜术后恢复照片 左右对比，可放大、跳原案件 | IN,KR | data.js:revCmpHtml / revCmpCollect / revCmpZoom / revCmpGo | R100a R100b | 一致(1022-13) | 改成新结构：来源=同主案件 |
| B-85 | 复诊评估结束按钮［结束复诊评估案件］，结案类型「复诊评估结束」 | IN | data.js:revEvalEnd | R105a | 一致(1022-19) | 改成新结构：流程完成≠主案件结案 |
| B-86 | 复诊评估案件 KR/院长没有项目/结算tab | KR | kr.js:krRenderCaseDetail tab过滤 | R105a R104b | 一致(1022-19) | 照旧 |
| B-87 | 复诊评估的日历块名称不被读档改回「面诊」，一个案件只留一块 | KR | data.js:syncConsultBlock | R105a | 一致(1022-19) | 照旧 |
| B-88 | 复诊评估案件对比/术前照片：原案件为数据源，案件管理多「复诊评估」tab，加结案类型栏 | IN,KR | ui.js:caseTabs; data.js:revCapOf | R105a | 一致 | 改成新结构：同主案件Tab |
| B-89 | 复诊评估结果「已出」IN 需确认通知+待办(联络客人)，不附方案按完成联络后消失(revisitAck) | IN | data.js:coreSubmitReport; todo.js | R87b | 一致(1021-19) | 照旧 |
| B-90 | 院长工作台复诊：确认时间前计入「恢复确认」参考名单，之后为待办「复诊：上传恢复确认内容」 | 院长 | todo.js:krTodoItems(recover/recoverwait) | R92b R15b | 一致(1021-24) | 照旧 |

## 八、客人离店 / 术前照片

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| B-91 | ［客人离店］：没剩项目→直接离店并结案；有剩余则弹窗选原因；复诊评估没出结果则离店不结案(leftStore) | IN 室长 | ui.js:openEndCase / revLeaveStore; data.js:endCaseRows | R105a R102a | 一致(1022-15/19) | 改成新结构：离店=子案件结束 |
| B-92 | 离店/结案后术后管理(来自主案件)与本地管理tab只读，没做的无按钮 | IN | data.js:followupCareCardHtml / 本地管理tab(ro) | R105a R107a | 一致(1022-19/21) | 改成新结构：子案件完成后只读 |
| B-93 | 复诊评估结果出来后确认结案(客人已离店·等复诊评估结果状态) | IN | rules.js:caseStageInfo; data.js:autoFinish | R105a | 一致(1022-19) | 改成新结构：随流程完成 |
| B-94 | 施术当天术前照片：评估为可以手术后(preOpReq)要求每个施术项目上传术前视频/角度照片，未传不能继续 | KR 室长 | data.js:preOpItems / preOpMissing / preOpGate / coreSetPreOp | R103a R103b | 一致(1022-17) | 照旧 |
| B-95 | 术前照片用的角度/视频读 shootSpec(按项目对应部位)，已完成项目不再要求 | KR | data.js:preOpSpecOf | R103a | 一致 | 照旧 |
| B-96 | 术前照片KM1能传，院长可看，传后记Timeline | KR | data.js:coreSetPreOp | R103b | 一致 | 照旧 |

## 九、IN 接续案件 UI（要拿掉）

| 编号 | 规则内容 | 适用角色 | 代码位置 | 对应测试 | 规格 | 与新结构关系 |
|---|---|---|---|---|---|---|
| B-97 | IN 接续案件本地管理tab项目卡(术后管理今日/预约/未预约三组+本地管理项目卡)，右上继续选购/使用持有项目 | IN | data.js:followupCareCardHtml / carriedContinue | R107a R86a | 一致(1022-21) | 拿掉：接续案件整个拿掉 |
| B-98 | 术后管理(来自主案件)标题标注来源，接续案件自动关联原案件，对KR可见只读 | IN→KR | data.js:linkedCase / visibleToKR | R86a R102a | 一致 | 改成新结构：同主案件，无需关联 |
| B-99 | 关联之前案件下拉(含自动关联、带入附件)与关联案件tab(只往前关联) | IN,KR | data.js:relatedTabHtml / showRelatedTab; kr.js:krTabRelated | R94a R94b | 一致(1013-12) | 拿掉：同主案件取代 |
| B-100 | 复诊/延续锁定院长医院 + 项目复诊可只看原案件做过的施术 | IN | data.js:followDoneItems | R105a | 一致(1022-19) | 改成新结构：取自主案件项目汇总 |
