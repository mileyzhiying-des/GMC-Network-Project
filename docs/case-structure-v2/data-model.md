# 前端数据结构说明（案件结构 v2）

> 给开发讨论用。这是**原型当前的前端结构**（分支 feature/case-structure-v2，数据版本 56），不是后端设计；后端怎么存之后由开发决定。
> 约定：画面读主案件 / 子案件 / 流程 / 项目汇总，一律通过「第六节 前端数据访问层」里的函数，不直接读旧字段。换后端时只需要重新实现那一层。

## 一、四个概念和它们的关系

```
客人（client，以手机号唯一）
 └─ 主案件 A000001        一段服务：从同一次面诊延伸出来的都算同一个（没有面诊、只做本地的也是一个主案件）
     ├─ 流程（跨天）       面诊安排 / 赴韩施术 / 复诊评估 #1 #2…    ← 现算，不存
     ├─ 子案件（一天一个） A000001-01 … -NN                        ← 现算 + 接待记录
     ├─ 项目汇总           赴韩施术 / 在韩管理 / 术后管理 / 本地管理 的所有项目  ← 现算，不存
     └─ 钱                 面诊费、赴韩定金 / 尾款 / 在韩加项 → 主案件；本地项目的钱 → 当天子案件
```

- **主案件**：承载面诊和赴韩的那个案件对象。KR 端、结算、项目、术后管理都挂在它上面。
- **子案件**：客人来的**一天**（IN 或 KR），一天只有一个（同一主案件、同一天、同一地点合并）。编号 `主案件号-序号`（`A000001-05`），序号在到店时定下、之后不变。
- **流程**：跨天的进度，不受 00:00 影响。三种：面诊安排、赴韩施术、复诊评估（每次复诊一个）。
- **项目汇总**：主案件下所有项目的一张表，一个项目一行，展开是每次使用。

## 二、主案件（Case，存档里 CASE_ITEMS 的一条）

分诊所分区存储（`gmc_clinic_C1/C2/C3`）。下面只列和结构直接相关的字段（其余是面诊 / 项目 / 结算的业务字段，见 CLAUDE.md 各 CMD 记录）：

| 字段 | 含义 |
| --- | --- |
| `id` / `caseNo` | 内部 id；案件号 A000001（子案件的 `caseNo` = `主案件号-序号`） |
| `mainId` | **指向主案件的 id**。没有或等于自己 = 主案件；不等于自己（且那个主案件存在）= 子案件接待记录 |
| `name` / `clinicId` / `hospitalId` / `director` | 客人 / 诊所 / 医院 / 对接院长 |
| `stage` | 六个桶 booked / consult / travel / local / closed / reportonly / cancelled（案件管理 tab 分组键）；`postcare`、`krmgmt` 是术后管理、在韩管理阶段 |
| `consultStatus` / `reportReady` / `consultFeeWaived` … | **面诊安排流程**的状态 |
| `krSchedule` {status, confirmedDate, confirmedTime, address…} / `hasArrived` / `krArrivedDay` / `krProcedureDone` / `krTripEnded` | **赴韩施术流程**的日期和进度 |
| `procedureItems[]` | 项目：`origin:'KR'` 的赴韩施术 / 管理项目（`mgmtPlan`、`heldOver`、`qty`、`holdUsed`、`uses[]`）；术后管理要求在 `it.postcare[]` |
| `subItems[]` | 在韩 / 印尼的术后管理行、管理项目使用行：`{id, kind:'术后管理记录', place:'KR'|'IN', date, time, content, projectName, done, skipped, hold, transferred…}`；韩国的天由它们按日期 / 地点分组出来 |
| `settlementBatches[]` | 赴韩结算单（定金 / 尾款 / 在韩加项）；`financePaid(c)` 汇总 |
| `localMgmt` {batches[], mgmtUses[]…} | 本地管理的购买 / 使用（子案件对象上记当天的钱） |
| `logEntries[]` | Timeline |

### 子案件接待记录（带 `mainId` 的 Case）

IN 回来的一天仍是 CASE_ITEMS 里的一条（保留接待所需字段），加：

| 字段 | 含义 |
| --- | --- |
| `mainId` | 所属主案件 |
| `visitDate` / `visitTime` / `visitPurpose` | 这一天 |
| `subState` (`waiting`/`arrived`/`cancelled`) / `noShow` / `cancelBy` / `arrivedDay` | 到店状态 |
| `leftStore` / `visitClosed` / `autoEnded` {at,day,blockers} / `autoAck` | 客人离店 / 00:00 自动结束 / 次日确认 |
| `resumeFrom` {caseId,type,types} / `followup` / `linkedCase` | 接待方式：接续面诊 / 复诊评估 / 术后管理（旧的"接续"字段，接待流程还在用） |
| `revisitEval` / `recoveryResult` / `revisitQuestion` / `revisitMedia` / `followProjects` / `revisitRec` | **复诊评估流程**的数据（一个子记录一个） |
| `localMgmt` / `settlementBatches` | 当天买 / 用的本地项目和钱 |
| `lightLink` {caseId,caseNo,reason} | 复诊建议赴韩：新主案件对原主案件的轻关联 |

### 其它存储

- `CLIENT_HOLDINGS[客人名]`：印尼本地持有批次 `{itemName, category, batches:[{caseId, date, bought, used, usages[], pkg, spec, voided, refund, transferFrom…}]}`。批次的 `caseId` = 购买它的主案件或子记录。
- `RESUMED_VISITS[]`：接续到进行中主案件的那一天（没有自己的记录）`{name,date,time,purpose,caseId}`。
- `HOSPITAL_DATA[医院]`：院长日程 `directorSchedule`（施术 / 面诊 / 预约 / 不可预约块）、通知 `notifs`、KR 项目库 / 案例库等。

## 三、流程（`flowsOf(m)`，现算）

| kind | 来源 | 返回 |
| --- | --- | --- |
| `consult` 面诊安排 | 主案件 `consultStatus` / `reportReady` | `{label, status, done, caseId}` |
| `krTrip` 赴韩施术 | `procedureItems` 有 KR 项目 / `krDepositPaid` | `{label, status(scheduleState), tripEnded, caseId}` |
| `revisit` 复诊评估 #n | 带 `mainId` 且 `revisitEval` 的子记录，按日期编号 | `{n, label, status(结果), caseId(子记录)}` |

## 四、子案件（`visitsOf(m)`，现算）

返回按日期排序的数组，每项 = 一天：

```js
{ key:'日期|地点', date:'YYYY-MM-DD', time:'HH:mm', place:'IN'|'KR',
  types:['面诊安排','赴韩施术','在韩管理','术后管理','复诊评估','本地管理'],   // 业务类型标签，一天可以有多个
  caseId:'主案件 id', rec:'这一天的接待记录 id（子记录或主案件）',
  state:'waiting|arrived|…', own:true|false, seq:1, no:'A000001-01' }
```

来源（合并同一天同地点）：主案件自己的 IN 日 → 赴韩施术日（`krSchedule`）→ 在韩 / 印尼已做的术后管理行（`subItems`）→ 子记录（`mainId`）→ `RESUMED_VISITS`。`no` 对子记录用它到店时定下的 `caseNo`，其余按位置编号。

子案件状态文字（`visitStateText`）：待到店 / 进行中 / 客人已离店 / 已结束 / 已预约 / 未到店 / 已取消。

## 五、项目汇总（`summaryRowsOf(m)`，现算）

```js
{ name, type:'赴韩施术'|'在韩管理'|'术后管理'|'本地管理', boughtAt:'YYYY-MM-DD', usedAt:'最近一次使用日',
  used:2, total:3, status:'未使用|使用中|已完成|韩国持有|印尼持有|已取消|已退款|已转出',
  uses:[{date, qty, no:'子案件号', caseId}], ref:'item|care|local' }
```

来源：`procedureItems`（赴韩施术 / 在韩管理）、`subItems`（术后管理，韩国 + 印尼）、客人持有批次中 `caseId` 属于主案件或其子记录的（本地管理）。复诊评估不是项目，不放。`projectUnitsOf(m)` = 同一份数据加上 `booked / bookedDate / state(已预约)`。

## 六、前端数据访问层（data.js 末尾，全部只读）

画面读下面这些，不要直接读旧字段：

| 函数 | 作用 |
| --- | --- |
| `mainIdOf(c)` / `isChildVisit(c)` / `mainOf(c)` / `childVisitsOf(m)` / `mainsOf(list)` | 主 / 子关系 |
| `visitsOf(m)` | 子案件列表（第四节） |
| `daysOf(m)` / `dayStateOf(m,v)` | （CMD-1026-19）每一天 + 统一状态：`kind` IN/KR、`state` waiting/arrived/left/ended/cancelled/noShow、`live`、`inProgress`、`reached`；`activeVisitsOf` / `visitStateText` / 页头第三行 / 列表「今天来访」都读它 |
| `visitsOnDate(date,{place})` | 全院某一天的所有到院（带客人名、主案件 id） |
| `visitRowsOf(m, v)` | 某个韩国到院日里要做的项目行 |
| `inVisitOf(c)` | 一条接待记录自己的 IN 那一天：`{date,time,state,arrivedDay,left,purpose,krVisit,cancelBy}` |
| `tripOf(m)` | 赴韩施术：`{status,date,time,address,arrived,arrivedDay,day,ended,done,confirmed}` |
| `flowsOf(m)` / `flowStepOf(m,kind)` / `revisitFlowOf(c)` | 流程列表 / 某流程当前步骤 / 复诊评估流程 `{n,result,status,question,projects,media,mainId}` |
| `relatedOf(c)` | 关联：`{linkedId,mainId,resumeType,types,reason,followup,revisit,lightLinkId}` |
| `summaryRowsOf(m)` / `projectUnitsOf(m,{type})` | 项目汇总 / 带预约信息的项目单元 |
| `clientHoldingsOf(name)` | 客人持有：`{IN:[批次],KR:[在韩持有项]}` |
| `openMainsOf(name)` | 客人未结束的主案件 |
| `visitNoOf(m,date,place)` / `visitNoFor(c)` / `startDayOf(m)` / `ongoingFlowsOf(m)` / `mainHeadLine(m)` / `visitsOnlyOne(m)` | 子案件号 / 通知待办用的号 / 从哪天面诊开始 / 进行中的流程 / 主案件页头一行 / 是否只有一个子案件 |
| `childMoneyOf(m)` / `mainMoneyTotals(m)` | 钱：各子案件当天收的 / 汇总 |

## 七、自动处理（幂等，可重复跑）

- `visitSweep()`：带 `mainId` 的子记录，到店后过了当天 00:00（页面时区 `todayStr()`）→ `autoEnded` + 客人离店；款项没清 / 主线没完不结案；第二天 IN 待办「已自动结束：确认」（`autoAck`）。
- `careOverMonthSweep()`：主案件里印尼的术后管理超过建议日期一个月没做 → 转成管理项目（免费、不能退款）：记客人印尼持有（`pkg`、`transferFrom`），客人有进行中的另一个主案件则持有记在那个主案件，原主案件的行标 `transferred`（项目汇总「已转出」）。

## 八、权限与可见范围

- IN：主案件列表只列主案件（子案件在展开里）；子记录页顶有「属于主案件」提示。
- KR / 院长：案件列表只列主案件，子案件在展开里；印尼的天只读，**本地管理的项目、标签和钱 KR 看不到**；只有本地的主案件 KR 看不到。KR 案件页有「子案件」「项目汇总」两个只读 tab（只有一个子案件时不显示子案件 tab）。
- 操作锁 / 在线登记粒度 = 主案件。
- 经营数据：案件数 = 主案件；钱按各子案件当天收的加总。

## 九、还直接读旧字段的地方

见 `audit-oldfields.md`（98 条画面入口的审计，含改动难度）。本次已改经访问层读的：`visitStateOf`、`pendingResvSameDay`、`krVisitTimeOnDate`、`mainVisitDay`、`relatedFollowers`、`caseVisitNo`、`renderCaseSubtitle`、`caseTypeOf`、`krCaseVisible`、`bizCaseMonth`、`krResumeTag`、`calendarEvents`。仍直接读旧字段的主要是：**写入口**（到店 / 完成 / 改时间等，换后端时整体换 API）和少数读取复杂的画面（KR 项目卡 `krProjCards`、`inTodoItems` / `krTodoItems` 待办生成、KR 到院卡分组 `krCaseGroupsHtml` 等），清单和理由在审计表里。
