# 原型 vs 新版 Notion — 对齐记录

对照基准：2026-10-01 的 Notion 现行正文（不读「📦 历史版本」）。
**2026-10-01：差距清单 1–12 已全部按 Notion 改完**（提交：第1组 Case ID 提前+功能开关、第2组 本地案件 tab 结构、第3组 其余各项），并补做了当天的"未到店 / 06 到医院之后 / 流转规则"补充指令。每一条在原型里的落点见下表。

| # | Notion 现行 | 原型落点（函数/字段） |
|---|---|---|
| A1/A2 | Case ID 预约时生成，取消 Reservation ID；功能以"基础资料确认"为开关 | `createReservationCase()` 直接 `generateCaseNo()`；`c.materialsConfirmed` 控制发起对话/+添加本地管理/附件tab/引用与新建案件对话/关联下拉候选；取消的预约保留 Case ID |
| A3/A4 | 面诊取消只在面诊预约、等待面诊可用；弹窗问是否做本地项目 | `canCancelConsult()`、`cancelConsult()`、`#consult-cancel-overlay` |
| A5 | 本地管理进行中可继续选购/使用 | `setMgmtAdd()`、`c.addUse`/`c.addingMore`、`lm.addUse`/`lm.addBuy` |
| A6 | 更换项目=加项+原项目更换（最终状态） | `simulateKrProjectSwap()`（`it.swapped` + 新项目并入同结算单） |
| A7–A9 | 术后管理进行时间、KR确认、对KR可见、无法协调一并取消 | `b.schedule`/`holdingSchedule()`、`simulateKrConfirmPostCare()`、`c.visibleToKR`、`confirmRefund` 的 `cannotCoordinate` 分支 |
| A10 | 关联复诊/术后管理/延续既往面诊时预选免除面诊费 | `feeDraft()`/`consultFeeFormHtml()`（用户决定：不自动免除，只默认预选，可改，原因必填） |
| A11 | 持有项目卡项目层只列剩余>0，展开显示全部批次 | `renderClientHoldings()`（用户答复） |
| B1 | 本地案件确认后自动打开本地管理tab；项目列表tab只在面诊案件出报告后出现 | `showProjectsTab()`/`showLocalTab()`/`normalizeCaseTab()` |
| B2/B3 | 基础资料上传附件（选填）；缺必填项弹 popup | `materialsCardHtml` 新行、`#materials-missing-overlay` |
| B4 | 面诊进行中小状态 Waiting | `consultRoundSubItems()` "通话中" |
| B5/G1 | 室长商谈：对话房入口 + 报告卡快捷入口 | `toolbarAction('talk')`、`consultTalkShortcut()`（用户答复：同一功能两个入口） |
| C1/C2 | 本地退款显示在对应结算单；按钮[结算]/[使用项目] | `settlementCardHtml()`、`projectPickerHtml`、`holdingsUseHtml` |
| D1/D2 | 待访问行内按钮；Case ID 独立列 | `renderCaseRows()`、`rowAction()` |
| E1–E3 | 列名"当前进度"；医美史案件记录读真实案件；修正留痕 | `buildHistoryList(name)`、`renderClientTimeline()`、`editClientField()` |
| F1/F3 | 预约取消事件消失；占位改选其他时间 | `buildWeekGrid()`（过滤 `cancelled`）、`simulateSlotChange()` |
| 补充1 | 未到店 No Show | `markNoShow()`、`simulateTimePass30()`、`ev.noShow`（日历删除线）、CancelReason 新增"未到店" |
| 补充2 | 06 到医院之后：模拟KR判断能否施术（能·没变动 / 能·有变动 / 不能：重新预约或退定金） | `simulateKrJudge()`、`c.krJudge`、`krArrivedOpsHtml()`、`settleKrBalance()`、`krReschedule()`、`krRefundDeposit()`、`c.hasArrived`，退款弹窗提示"金额按 KR 室长判断填写" |
| 补充3 | 流转规则（终态不重开、面诊取消时机、本地管理继续选购/使用、结算单只往前） | 同上 |

**仍然存在的差距（都已记入 `open-questions.md`）**
- IN 侧发生的更换项目没有演示入口；术后管理"可变更"只做了标注进行时间。
- 客户详情"基础信息"是全局静态演示数据（修改只改显示+写 Timeline）。
- FigJam「GMC Flow」Happy Path 没拿到链接，自测按 Notion 00–09 自行拆步骤（A 16 步、B 7 步）。
