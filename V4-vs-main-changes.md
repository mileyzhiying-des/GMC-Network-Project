# V4 branch vs main — barcha o'zgarishlar / 所有改动汇总

- Taqqoslash / 对比：`main` (`c9dfcd5`) → `V4` (`6113b96`)
- Commitlar soni / 提交数：**122** (2026-10-29 → 2026-11-06)
- Jami / 合计：**17 fayl, +5650 / −662 qator**
- Eslatma: bu fayl faqat hisobot; hech qanday kod o'zgartirilmagan. / 本文件只是说明，没有改动任何代码。

## 1. Fayllar bo'yicha / 按文件

| Fayl | +qo'shildi | −o'chirildi | Nima o'zgardi / 主要内容 |
|---|---|---|---|
| `prototype/shared/selftest.js` | 2049 | 89 | 自测脚本：新增大量用例（R2xx 系列） |
| `prototype/shared/data.js` | 1387 | 186 | 核心数据与规则：持有施术、行程结束、三选一、退款方式、NIK、面诊/复诊评估核心函数、子案件编号、迁移相关 |
| `prototype/shared/kr.js` | 800 | 206 | KR/院长页面：评估卡（资料卡+评估卡）、项目卡、预约弹窗、行程修正、退回/上传等 |
| `CLAUDE.md` | 373 | 3 | 每个任务（CMD-xxxx）的补充说明与规则记录（文档） |
| `prototype/shared/roletest.js.bak` | 355 | 0 | ⚠️ 备份文件（误入库，不是功能代码） |
| `prototype/shared/ui.js` | 227 | 84 | IN 端界面：付款确认窗、案件页头、客户页、操作入口等 |
| `prototype/shared/krbook.js` | 116 | 14 | IN 在 KR 日程占位预约：关联之前案件、确认后真的约上 |
| `prototype/shared/coverage.js` | 60 | 20 | 测试覆盖页：演示时间（印尼/韩国双向）、存档空间、清空案件按钮等 |
| `prototype/shared/calalign.js` | 56 | 8 | 日历 / 施术前 7 天行程确认 / 在韩期间弹窗 / 发送给客人 |
| `prototype/shared/rules.js` | 52 | 17 | 规则：金额/持有/状态文字、itemKrAmount、computeBatchBreakdown |
| `prototype/shared/booking.js` | 49 | 9 | 客人预约页：来访目的三个、年龄确认、NIK、旧「皮肤管理」显示 |
| `prototype/shared/todo.js` | 35 | 17 | 待办/通知规则：三选一待办、退回待修改、待发送 IN |
| `prototype/shared/store.js` | 33 | 1 | 存档与数据迁移（MIGRATIONS 56→59）、备份保护 |
| `prototype/shared/app.css` | 21 | 0 | 新样式：备注卡、项目卡固定高度、按钮等 |
| `prototype/shared/roletest.js` | 19 | 3 | 角色功能测试：新增/调整格子 |
| `prototype/shared/i18n.js` | 12 | 0 | 预约页词条（印尼文/中文） |
| `prototype/in.html` | 6 | 5 | IN 端页面：新增弹窗容器（添加本地管理 / 剩余项目等） |

## 2. Asosiy yangiliklar (mavzular bo'yicha) / 主要变化（按主题）

### Ma'lumot versiyasi / 数据版本
56 → 59 (migratsiya `store.js` `MIGRATIONS`: 57 待重新预约, 58 行程结束持有施术, 59 只付定金退回等 IN 三选一)。Eski foydalanuvchi keyslari saqlanadi.

### Yo'l-yo'riq: xarid qilingan xizmat / 持有施术 (CMD-1105-03/04/12)
行程结束时没做的施术转韩国持有；下次赴韩直接用该项目，不重算价格（取消价差抵算 heldCredit）；只付定金的由 IN 三选一（无故未到 · 定金不退 / 改日 / 退款）；「已付」统一为实际付过的钱；客人页取消/退款有锁。

### Kelish va kechki jarayon / 到院、关账、行程
到院当天评估锁离院、00:00 关账、确认结束、行程结束自动/手动、行程修正（离开日期冲突处理）、同一天一个到院。

### Mijoz ma'lumoti / 客人资料
NIK（身份证号）、未满 21 岁确认、护照时机调整、医美史补登、메타뷰 改成人工记录并有管理者更正。

### Konsultatsiya / maslahat (CMD-1105-09~14)
面诊与复诊评估统一框架（资料卡+评估卡）；院长语音输入框；上传后院长只读；室长勾「院长授意」代录；退回院长（原因必填）+ 待办/通知；院长不能改时间；推荐项目可选。

### Mijoz bron sahifasi / 客人预约页
来访目的三个（面诊商谈/术后管理/复诊评估）；客人自己预约不挂主案件。

### IN interfeysi / IN 端
添加本地管理弹窗（使用持有 / 购买新项目）、剩余项目卡勾选框、预约空档来访目的三个并直接挂主案件、继续之前的服务对话框。

### KR interfeysi / KR 端
项目卡四个 tab、预约弹窗按日期分组、院长项目库只读、案件列表阶段/进程、术后管理 tab 共用组件、在韩期间与离境日规则。

### Test va asboblar / 测试与工具
selftest 新增大量用例；测试覆盖页：演示时间、存档空间、清空案件；存档容量保护与升级前备份。

## 3. Barcha commitlar / 全部提交（122）

| # | Hash | Sana | Sarlavha / 说明 |
|---|---|---|---|
| 1 | `47feee2` | 2026-10-29 | docs: add developer Git rules to CLAUDE.md (V4 branch only, no push/merge unless told, English commits) |
| 2 | `50bbd48` | 2026-10-29 | test-tool: rework demo time card (Indonesia/Korea two-way inputs, next-day 10:00 based on demo time, no auto-restore, warn on moving time backwards) |
| 3 | `13e10da` | 2026-10-29 | CMD-1029-03 part 1: page header shows both clocks (local city + other side, cross-day date) |
| 4 | `7041780` | 2026-10-29 | CMD-1029-03 part 2: keep 'treatment plan arrived' IN todo when plan comes after the visit was closed as report-only |
| 5 | `6b0252e` | 2026-10-29 | CMD-1029-03 part 3: refund-only case page (basic info / settlement / timeline only), status wording 'ended - refund only', show refund amount |
| 6 | `9c578f6` | 2026-10-29 | CMD-1029-03 part 4: 'use previously purchased items' becomes a read-only list (name / left / purchase date), no case dropdown |
| 7 | `823d603` | 2026-10-29 | CMD-1029-03 part 5: 'use previously purchased items' opens a new standalone case (no join to original main), four-field visit purpose, 'from previously purchased items' header |
| 8 | `4fd8512` | 2026-10-29 | CMD-1029-03: add selftest R181a and CLAUDE.md notes |
| 9 | `0380de9` | 2026-10-29 | CMD-1029-03: update R117a/R133b assertions for the new use-previous-items rule |
| 10 | `2aeeb1b` | 2026-10-29 | CMD-1029-04: add 'buy other items' button to the use-previously-purchased-items case (same local purchase screen, buy then use same day) |
| 11 | `3072f21` | 2026-10-29 | CMD-1029-05: continue-consult (reused plan) consult tab now works like a normal consult (report -> view plan -> pick items), deposit moves to the main case, plan date shows original date |
| 12 | `705eb48` | 2026-10-29 | CMD-1029-06 part 1: 'use previously purchased items' lists only IN local holdings; trip-only holdings grey it out with a hint |
| 13 | `82f69d6` | 2026-10-29 | CMD-1029-06 part 2: local case no longer auto-closes when holdings are all done; ask 'has the client left?' first (still not left / left) |
| 14 | `4085265` | 2026-10-29 | CMD-1029-06 part 3: refund service requires a refund method (cash/transfer/QRIS/other+note); shown in refund-only settle tab, purchase case record and timeline; old refunds show 'not recorded' |
| 15 | `3d7046d` | 2026-10-29 | CMD-1029-06 part 4: continue-consult deposit settlement stays on the paying day's child visit (viaCaseId on the main-case batch), child page gets its settle tab back, main settle tab shows which child it was paid on |
| 16 | `70214f1` | 2026-10-29 | CMD-1029-06: add CLAUDE.md notes |
| 17 | `81d6a2e` | 2026-10-29 | CMD-1029-07: booking page asks marital status for clients under 21 (by booking day), unmarried must tick 'guardian notified'; birthday becomes read-only once created; IN shows the marker |
| 18 | `366b315` | 2026-10-29 | CMD-1029-07: add CLAUDE.md notes |
| 19 | `8363700` | 2026-10-29 | CMD-1029-08: ending a case no longer offers refunds (unused local batches always become client holdings); Korea-cancel 'refund money' requires a refund method (cash/transfer/QRIS/other) |
| 20 | `3ba2f7d` | 2026-10-29 | CMD-1029-08: add CLAUDE.md notes |
| 21 | `bc12bf5` | 2026-10-29 | CMD-1029-09 part 1: passport is optional when paying the deposit (no gate, no payment block); reminder that visa/entry is the client's responsibility |
| 22 | `58bfa36` | 2026-10-29 | CMD-1029-09 part 2: submitting the surgery dates requires a trip state (booked / tentative); booked can fill entry/exit; KR sees a 'tentative' tag on header, date card and calendar |
| 23 | `7756f1b` | 2026-10-29 | CMD-1029-09 part 3: about 30 days before surgery IN gets a 'confirm client trip' todo + card (same date / change / cancel / not decided yet), reminder only |
| 24 | `e82c788` | 2026-10-29 | CMD-1029-09 part 4: 'confirm trip' moves from 2 days to 7 days before surgery; passport number required if missing; surgery dates under 7 days away need the whole trip group at submit time |
| 25 | `f7badcd` | 2026-10-29 | CMD-1029-09 part 5: KR marking the client arrived must fill the passport number + expiry when it is still empty (shown for checking when already filled) |
| 26 | `7c2690c` | 2026-10-29 | CMD-1029-09: update old selftest assertions for the 7-day trip confirmation (R42a template text, TD4 open date) |
| 27 | `d31d386` | 2026-10-29 | CMD-1029-09: document in CLAUDE.md |
| 28 | `c399484` | 2026-10-29 | CMD-1029-10: add client ID number (NIK): optional on booking page, required at IN intake, last-4 display, manager-only edit with reason + operation log, duplicate check, hidden from KR |
| 29 | `76b245b` | 2026-10-29 | CMD-1029-10: selftest helper auto-fills NIK at intake; document in CLAUDE.md |
| 30 | `93b7fab` | 2026-10-29 | CMD-1029-11 part 1: after cancelling all Korea items, local items can be refunded all or per item (unchecked ones stay as client holdings); refund method required and recorded in holdingRefunds |
| 31 | `e560819` | 2026-10-29 | CMD-1029-11 part 2: registered clients booking again are re-confirmed when under 21 on the booking day (marital status prefilled, unmarried must re-tick guardian informed); missing birthday is filled first; same on booking page and IN proxy booking |
| 32 | `32fe172` | 2026-10-29 | CMD-1029-11: document in CLAUDE.md |
| 33 | `3053fbd` | 2026-10-29 | CMD-1029-12: show both-side times in the header of every page (IN / KR / director), next to the chat icon; weather stays on the dashboard only |
| 34 | `782ffc2` | 2026-10-29 | CMD-1029-12: document in CLAUDE.md |
| 35 | `11c9979` | 2026-11-02 | CMD-1029-13: case numbers only count up (never reused): atomic shared counter, merged reservation number kept as alias with Timeline note, per-case batch counter, duplicate case-number warning on the coverage page |
| 36 | `10217e1` | 2026-11-02 | CMD-1029-13: selftest R196a checks general case numbers only |
| 37 | `c085028` | 2026-11-02 | CMD-1029-13: row ids also count up only |
| 38 | `73264ba` | 2026-11-02 | CMD-1029-13: document in CLAUDE.md |
| 39 | `036b7e8` | 2026-11-02 | CMD-1102-01: add report rule for backend-impact and affected-action columns to CLAUDE.md |
| 40 | `4c4b209` | 2026-11-02 | CMD-1102-02 part 2: case list update time derived from real Timeline actions (system fixes ignored), shown relative to demo time, all tabs sorted new to old |
| 41 | `3cf100a` | 2026-11-02 | CMD-1102-02 part 1: client name in the unbooked-appointments group header opens the case on the matching tab (KR and IN) |
| 42 | `45935b6` | 2026-11-02 | CMD-1102-02 part 3: no more 'plan arrived' to-do on the continued-consult record after its projects were handed to the main case (fixes stale IN list process); add selftests R197a/R197b |
| 43 | `7110a7c` | 2026-11-02 | CMD-1102-02: document in CLAUDE.md |
| 44 | `8ef00f1` | 2026-11-02 | CMD-1102-02: older-year update time shows YYYY-MM-DD |
| 45 | `7e18828` | 2026-11-02 | CMD-1102-03 data layer: release surgery time slot when surgeries are gone or refunded, stop repeated 'fix old data' Timeline, comp-credit helper, part/all refund decision, cheaper replacement turns into comp credit |
| 46 | `31e6765` | 2026-11-02 | CMD-1102-03 KR arrival assessment cards: original plan and judgment card, settle+add in one card (original plan unchanged), three-step adjust plan, cannot-operate cancel/replace/refund flows; selftests R198a/b/c |
| 47 | `a51ccd8` | 2026-11-02 | CMD-1102-03: document in CLAUDE.md |
| 48 | `052b40e` | 2026-11-02 | CMD-1102-04 part 1: original plan and judgment card in three levels; judgment shows director name and 'reason' (display only) |
| 49 | `9fde64e` | 2026-11-02 | CMD-1102-04 part 2: replace-item chooser after cancelling uses the adjust-plan chooser look (one chip, grey hint), no empty item cards, one total line |
| 50 | `319be22` | 2026-11-02 | CMD-1102-04: document in CLAUDE.md |
| 51 | `b65daa8` | 2026-11-02 | CMD-1102-05: update time covers child records for main cases; client list update time computed from real actions (newest first); KR client list gets update-time column; selftests R199a/b |
| 52 | `a9be253` | 2026-11-02 | CMD-1102-05: document in CLAUDE.md |
| 53 | `aa3c4c1` | 2026-11-02 | CMD-1102-06: after 'not advised, change time' keep the judgment card, no arrive button on the original day, day-end does not refund items; two Timeline wording fixes; selftests R200a/b |
| 54 | `ad54e5b` | 2026-11-02 | CMD-1102-06: document in CLAUDE.md |
| 55 | `592f27d` | 2026-11-02 | CMD-1102-07 part 1: entry/exit dates are filled only in the confirm-trip popup (trip state keeps only booked/tentative; confirm-project and 1-month reconfirm no longer ask for dates) |
| 56 | `7c54cc1` | 2026-11-02 | CMD-1102-07 part 2: reschedule date lists start from tomorrow (KR rebook dropdown, IN date calendar), based on the demo clock |
| 57 | `5610c90` | 2026-11-02 | CMD-1102-07 parts 3+4: trip fix popup (arrival read-only, departure required) and stay-resolve save no longer silent (stacked confirm dialogs above it, dry run, per-row red errors, same-director overlap check); selftests R201a/R202a/R203a |
| 58 | `d5efa70` | 2026-11-02 | CMD-1102-07: document in CLAUDE.md |
| 59 | `3292379` | 2026-11-02 | CMD-1102-08 part 1: stop auto-close vs repair ping-pong (do not auto-complete while Korea items unfinished; finishCase logs only on real state change); selftest R204a |
| 60 | `ac51484` | 2026-11-02 | CMD-1102-08 part 2: add-consult uses the same concern part cards + photos/videos as normal consult (required), carries earlier no-consult concern text; selftest R205a |
| 61 | `e654cb3` | 2026-11-02 | CMD-1102-08 part 3: revisit evaluation greyed out (with reason) for cases that have no performed surgery; selftest R206a |
| 62 | `06fa907` | 2026-11-02 | CMD-1102-08 part 4: NIK save no longer silent (unique input/error ids so popup and basic-info page do not clash), live digit counter, clear red errors for length/digits/duplicate in all NIK inputs; selftest R207a |
| 63 | `30ff014` | 2026-11-02 | CMD-1102-08: guard refined (held-over management items do not block auto-complete), revisit fixtures get a performed surgery, document in CLAUDE.md |
| 64 | `f17f78a` | 2026-11-02 | CMD-1102-09 part 1: 'use holdings?' always has [New item][Not this time][Use]; New item opens the normal local purchase screen; Not this time asks whether the client has left; selftest R208a |
| 65 | `7a98ad7` | 2026-11-02 | CMD-1102-09 parts 2+3: coordinator page hides record buttons once the director himself starts the consult; coordinator pressing add-content first asks whether the director recorded it personally or the coordinator recorded on his behalf, signed in transcript a… |
| 66 | `909f732` | 2026-11-02 | CMD-1102-09 part 4: in-progress items table, leave reminder and project card use the same per-item status; management items are no longer drawn as surgery items from a mixed surgery row (their done flag only means converted to holding); leave check splits the … |
| 67 | `df57211` | 2026-11-02 | CMD-1102-09: document in CLAUDE.md |
| 68 | `3ecc4b4` | 2026-11-02 | CMD-1102-11 part 1: one open visit per client per day — document the visit key rules (main / KR/date / IN/date, rowVisitKey), add mainDayOpen / sameDayOtherOpenCase guards; care bookings on the main visit day and bookings while another case of the same client … |
| 69 | `3a6298a` | 2026-11-02 | CMD-1102-11 part 2: bookings on the day the client is already in the hospital join the main visit's in-progress items (no second KR/date card); existing booked rows become today's items on [use now]; startup repair moves old same-day cards back to the main vis… |
| 70 | `fc83571` | 2026-11-02 | CMD-1102-11 part 3: surgery row no longer takes management items (added pre-balance surgery counts as surgery; fallback removed); startup repair rewrites old mixed rows once; selftest R212a |
| 71 | `4b568bd` | 2026-11-02 | CMD-1102-11 part 4: disabled buttons and links on project cards and arrive buttons now print the reason next to them (title kept); selftest R213a; old assertions updated for same-day merge and visible reasons |
| 72 | `aacaf8b` | 2026-11-02 | CMD-1102-11: document in CLAUDE.md |
| 73 | `db25ee0` | 2026-11-03 | CMD-1102-12 parts 1-4: [use now] dialog reads its checkboxes only inside the dialog and from the list saved at open (no id loop, no re-computed list); failures (nothing ticked, option missing, item no longer available) show as red text in the dialog instead of… |
| 74 | `a5e8e1a` | 2026-11-03 | CMD-1102-12 part 3: full-report dialog body no longer reuses the id rp-body of the report page (duplicate id in the same document) |
| 75 | `13db164` | 2026-11-03 | CMD-1102-12: document in CLAUDE.md |
| 76 | `f2cc710` | 2026-11-03 | CMD-1103-03: view-angle reference button is no longer grey for parts without a setting (demo references seeded for every body part, only where KR has not set one); a project-specific shoot setting without images falls back to the part's images; the grey button… |
| 77 | `1ba3861` | 2026-11-03 | CMD-1103-03: document in CLAUDE.md |
| 78 | `89e59a3` | 2026-11-03 | CMD-1103-01: KR directors and the representative director can open the KR project library read-only with prices (new krlibview permission; edit/deactivate/delete entry functions refuse without krlib); consultation recording gets a read-only [view project libra… |
| 79 | `6a17b82` | 2026-11-03 | CMD-1103-01: document in CLAUDE.md |
| 80 | `a4feb5b` | 2026-11-03 | CMD-1103-02: lock leaving until the arrival evaluation is done; per-item leave-reason dialog (rebook now / rebook later / cancel with refund or compensation); new 'waiting to rebook' state with KR todo and project-card group; one shared 'surgery not finished' … |
| 81 | `4360334` | 2026-11-03 | CMD-1103-02: document in CLAUDE.md |
| 82 | `5a38f79` | 2026-11-03 | CMD-1103-02: selftest — BK1a default purpose is now link-previous-case; R217b works without the stageC fixture |
| 83 | `b3afadd` | 2026-11-03 | CMD-1103-04: MetaView becomes a manual yes/no record: required every visit; 'yes' opens a confirm dialog and records minute-level time + operator, coordinators cannot undo, IN managers can correct (undo / change time) with a required reason; 'no' records not-t… |
| 84 | `2749cc5` | 2026-11-03 | CMD-1103-04: document in CLAUDE.md |
| 85 | `a44b0c5` | 2026-11-03 | CMD-1103-05: link-previous-case placeholder is really booked when KR confirms (surgery waiting to rebook, post-care, held management items; dir-op items pick a director; KR cancel restores the old state; failure rolls everything back); next-day confirm of the … |
| 86 | `27d8ac2` | 2026-11-03 | CMD-1103-05: document in CLAUDE.md |
| 87 | `779d87a` | 2026-11-03 | CMD-1103-05: selftest R217b follows the new trip-line wording |
| 88 | `bcb5b09` | 2026-11-03 | CMD-1103-06: MetaView admin correction becomes a single [Correct] action: no undo; admins pick the right result (yes/no) and, for yes, the check time; works after the client left / case ended; reason required; fixes keep old value (result, time, operator) and … |
| 89 | `acda653` | 2026-11-03 | CMD-1103-06: document in CLAUDE.md |
| 90 | `61bdeaa` | 2026-11-03 | CMD-1103-07: IN continued-visit 'remaining items' is one project card with tabs [post-care] [local management]; a tab only shows when it has items, no items at all hides the whole card and the [use now] button; description shrinks to one small line; 'post-care… |
| 91 | `8e4bc4f` | 2026-11-03 | CMD-1103-07: document in CLAUDE.md |
| 92 | `5a2bace` | 2026-11-05 | CMD-1103-08: rebooked surgery day needs the arrival evaluation first (ok / needs adjustment / not advised; locks Done and Left-hospital until evaluated; not-advised -> change time or cancel items); unfinished rebooked surgery becomes waiting-to-rebook on leave… |
| 93 | `7633c89` | 2026-11-05 | CMD-1103-08: document in CLAUDE.md |
| 94 | `a8e212b` | 2026-11-05 | CMD-1105-01: case list cleanup - KR list columns re-aligned (extra cell removed, 11 columns), IN KR-coordinator column filled, start time YY-MM-DD and updated time YY-MM-DD HH:mm in both lists, progress cell is one fact only (no reminders / no 'KR follow-up' t… |
| 95 | `9c77296` | 2026-11-05 | CMD-1105-01: document in CLAUDE.md |
| 96 | `b874c19` | 2026-11-05 | CMD-1105-02: rebooked-day visit now reuses the main-visit toolkit - 'needs adjustment' is the real three-step wizard (pick items to replace -> choose again -> settle; extra paid -> top-up batch on that visit, cheaper -> difference becomes exchange credit), 'no… |
| 97 | `b40fb46` | 2026-11-05 | CMD-1105-02: document in CLAUDE.md |
| 98 | `1b2fe82` | 2026-11-05 | CMD-1105-03: unfinished surgery (incl. waiting-to-rebook) becomes Korea-held when the trip ends (money kept), no longer blocks main-case auto close (end text 'Korea trip ended - has held items'); IN reminder todo (reminder only) and client-page cancel / refund… |
| 99 | `b9f2cd2` | 2026-11-05 | CMD-1105-03: document in CLAUDE.md |
| 100 | `5c3350d` | 2026-11-05 | CMD-1105-04: new Korea trip still starts from consultation; when the client picks projects after the director's plan, Korea-held surgery of the same client (other main cases) is listed first as 'paid - Korea held (from A...)', selectable only if the same proje… |
| 101 | `e91d035` | 2026-11-05 | CMD-1105-04: document in CLAUDE.md |
| 102 | `ea0ab41` | 2026-11-05 | CMD-1105-05: IN booking-slot visit purposes are now three (consultation / post-care / revisit evaluation; new clients only consultation; old 'skin care' bookings display as consultation); post-care and revisit pick a main case (label 'A000844 - surgery name (M… |
| 103 | `75c6cfe` | 2026-11-05 | CMD-1105-05: document in CLAUDE.md |
| 104 | `b1eace6` | 2026-11-05 | CMD-1105-06: remove the 'add service' button and dialog from visits that carry a purpose; revisit evaluation visits show only the 'This visit' line with no button; post-care visits get a single 'Add revisit evaluation' button (only when the case has done surge… |
| 105 | `9b02592` | 2026-11-05 | CMD-1105-06: document in CLAUDE.md |
| 106 | `9310909` | 2026-11-05 | CMD-1105-07: the header 'Add local management' button now opens a chooser first - 'use held items' (existing remaining-items card, tick then 'use now') or 'buy new items' (existing purchase screen); with no usable held items it goes straight to purchase; the h… |
| 107 | `01c0b68` | 2026-11-05 | CMD-1105-07: document in CLAUDE.md |
| 108 | `cb62abb` | 2026-11-05 | CMD-1105-08: the 'Add local management' dialog keeps both tabs at the top at all times - 'use held items' lists every item with a checkbox and its bottom-right button is 'Use now' (grey until something is ticked, errors shown in red inside the dialog), and 'bu… |
| 109 | `c1aca49` | 2026-11-05 | CMD-1105-08: document in CLAUDE.md |
| 110 | `44ed9a8` | 2026-11-05 | CMD-1105-09: KR revisit-evaluation screen reordered - doctor sees overall conclusion (required, never auto-picked) -> recorded content listed directly (voice / manual / AI organize, newest first) -> per-item opinions (optional now) -> new 'answer to the client… |
| 111 | `07d76ec` | 2026-11-05 | CMD-1105-09: document in CLAUDE.md |
| 112 | `a90f6c4` | 2026-11-05 | CMD-1105-10: revisit evaluation inputs are now a '🎤 voice input' button plus a plain text box in every text field (recorded content, per-item opinions, answer to question, cautions) - no side panel, no record cards, no manual-add button; transcript goes straig… |
| 113 | `9d4c1d8` | 2026-11-05 | CMD-1105-10 (side items): the booking-slot dialog no longer pre-selects a client (grey 'select client', no under-21 reminder / purpose / main-case picker and a greyed confirm until one is picked); revisit-evaluation visits no longer get the 'project confirming… |
| 114 | `2141ae3` | 2026-11-05 | CMD-1105-10: document in CLAUDE.md |
| 115 | `e629f7a` | 2026-11-05 | CMD-1105-11: KR consultation and revisit screens share one frame - top data card (consultation data / revisit data, status on the top right, collapsed with an expand link for the coordinator once uploaded) and a bottom evaluation card by role and state (doctor… |
| 116 | `3799498` | 2026-11-05 | CMD-1105-11: document in CLAUDE.md |
| 117 | `8aba207` | 2026-11-06 | CMD-1105-12: a held Korea surgery is used as the project itself with no price recalculation (CMD-1105-04 price offset / heldCredit removed; the item is not counted in the new deposit/balance, and any unpaid balance of the original is carried over so KR collect… |
| 118 | `057c8fd` | 2026-11-06 | CMD-1105-12: document in CLAUDE.md |
| 119 | `d45e603` | 2026-11-06 | CMD-1105-13: doctors can no longer modify the consultation / revisit report time (no modify button, and the core function refuses a doctor role); coordinators keep it and still have no start entry anywhere (legacy start buttons and krStartConsult are doctor-on… |
| 120 | `5ce25a1` | 2026-11-06 | CMD-1105-13: document in CLAUDE.md |
| 121 | `e4b5922` | 2026-11-06 | CMD-1105-14: consultation / revisit return and re-upload now raise todos and notifications - a coordinator return needs a reason (red hint, core refuses an empty one); the doctor gets a 'returned, please revise' todo and a bell notification with the reason, th… |
| 122 | `6113b96` | 2026-11-06 | CMD-1105-14: document in CLAUDE.md |
