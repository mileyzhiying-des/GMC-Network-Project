# V4 → V5 差异底稿（diff-base）

- 范围：`3cab87f`（开发目前的基准，2026-11-06 10:36）之后 → 标签 `v5-handoff-1111`（指向 `c0afb8f`，2026-11-11）。
- 提交数：161；Code 任务数（提交说明里找到的 CMD-xxxx-xx 去重）：84；说明里没有任务编号的提交：3 个。
- 数据版本（`DEMO_DATA_VERSION`）：`3cab87f` 是 59 → `v5-handoff-1111` 是 61（见第三节）。
- 本文件由脚本从 git 历史和 `CLAUDE.md` 各任务补充整理，没有改任何原型代码。「资料结构的变化」来自各任务在 `CLAUDE.md` 里写的「新增可空字段 / 新字段 / 数据版本」说明，不是逐行比对 data.js 得来的，可能有遗漏。

## 一、提交清单（按时间）

| 提交 | 日期 | Code 任务 | 提交说明 |
|---|---|---|---|
| `b51263d` | 2026-11-06 11:19 | CMD-1106-02 | CMD-1106-02: client booking page no longer mixes languages - error messages are stored as language-aware functions so they follow the langua… |
| `1456faa` | 2026-11-06 11:19 | CMD-1106-02 | CMD-1106-02: document in CLAUDE.md |
| `5b41fd5` | 2026-11-06 11:37 | CMD-1106-03 | CMD-1106-03: after the recommended projects are sent KR coordinators can edit each unpurchased project (surgery: stay days, anesthesia, post… |
| `e954e45` | 2026-11-06 11:37 | CMD-1106-03 | CMD-1106-03: document in CLAUDE.md |
| `7434759` | 2026-11-06 12:00 | CMD-1106-04 | CMD-1106-04: while KR edits the recommended projects the IN 'Korea plan' card is covered by a grey overlay with a chat button and minutes-ed… |
| `91652a6` | 2026-11-06 12:00 | CMD-1106-04 | CMD-1106-04: document in CLAUDE.md |
| `faece71` | 2026-11-06 12:06 | CMD-1106-05 | CMD-1106-05: the KR add-more / edit buttons now follow the IN progress instead of an IN edit lock - they stay available while IN is only tic… |
| `c36f11d` | 2026-11-06 12:06 | CMD-1106-05 | CMD-1106-05: document in CLAUDE.md |
| `5410e91` | 2026-11-06 12:42 | CMD-1106-06 | CMD-1106-06: add a 'use' (management item / after-care, one or both, at least one required) to the KR and IN project libraries - after-care … |
| `61a97a2` | 2026-11-06 12:42 | CMD-1106-06 | CMD-1106-06: document in CLAUDE.md |
| `8b17a7e` | 2026-11-06 12:50 | CMD-1106-07 | CMD-1106-07: once the recommended projects are frozen (deposit paid) the not-yet-bought ones fold into one 'not bought N' row that expands o… |
| `934597e` | 2026-11-06 12:50 | CMD-1106-07 | CMD-1106-07: document in CLAUDE.md |
| `73085cf` | 2026-11-06 13:00 | CMD-1106-08 | CMD-1106-08: rebuild the client page 'holding items' Korea section - 'Korea trip projects' (one block per bought, not-yet-finished surgery w… |
| `e27c7fd` | 2026-11-06 13:00 | CMD-1106-08 | CMD-1106-08: document in CLAUDE.md |
| `2c79a47` | 2026-11-06 13:08 | CMD-1106-09 | CMD-1106-09: rework the KR 'surgery date' card - the trip line (booked/estimated, arrival ~ leave), an editable expected surgery duration (h… |
| `c319f69` | 2026-11-06 13:08 | CMD-1106-09 | CMD-1106-09: document in CLAUDE.md |
| `92fac1f` | 2026-11-06 13:15 | CMD-1106-10 | CMD-1106-10: a stay that is too short for the surgery no longer blocks - the IN date calendar only greys out days before arrival (days where… |
| `14a4912` | 2026-11-06 13:15 | CMD-1106-10 | CMD-1106-10: document in CLAUDE.md |
| `dcfbcc1` | 2026-11-06 13:32 | CMD-1106-11 | CMD-1106-11: the 'stay too short' reminder is now one short line ('after-care is on day 7, reserve 8 days (preferred 03/16~03/22, 6 days; ba… |
| `de3f3d5` | 2026-11-06 13:32 | CMD-1106-11 | CMD-1106-11: document in CLAUDE.md |
| `fdb9778` | 2026-11-06 13:35 | CMD-1106-11 | CMD-1106-11 (addendum): the KR surgery date card no longer shows the arrival address line - on confirm the address from the hospital setting… |
| `f36ef6a` | 2026-11-06 13:35 | CMD-1106-11 | CMD-1106-11 (addendum): document in CLAUDE.md |
| `1bd0683` | 2026-11-06 13:46 | CMD-1106-12 | CMD-1106-12: the KR surgery date card no longer preselects a time - the dropdown shows a grey 'choose time' placeholder, confirm stays greye… |
| `f7e4dc0` | 2026-11-06 13:46 | CMD-1106-12 | CMD-1106-12: document in CLAUDE.md |
| `0760d72` | 2026-11-06 13:53 | CMD-1106-13 | CMD-1106-13: the KR case page header is now three lines - name + case no + visit/surgery counts with the chat button on the far right, then … |
| `6d09ddf` | 2026-11-06 13:53 | CMD-1106-13 | CMD-1106-13: document in CLAUDE.md |
| `aac66a6` | 2026-11-06 14:04 | CMD-1106-14 | CMD-1106-14: reorganise the KR surgery date card - trip line, a divider, the preferred/backup dates with their director rows and the selecte… |
| `e82eb3a` | 2026-11-06 14:04 | CMD-1106-14 | CMD-1106-14: document in CLAUDE.md |
| `842c9c7` | 2026-11-06 14:10 | CMD-1106-15 | CMD-1106-15: when the director (or the manager recording on the director's behalf) picks recommended projects, each row is now only a checkb… |
| `5b60bef` | 2026-11-06 14:10 | CMD-1106-15 | CMD-1106-15: document in CLAUDE.md |
| `ea365da` | 2026-11-06 14:13 | CMD-1106-15 | CMD-1106-15 (addendum): in the director's recommended-project picker the management-item tab now lays out like the surgery tab - one row = c… |
| `7dba1d8` | 2026-11-06 14:13 | CMD-1106-15 | CMD-1106-15 (addendum): document in CLAUDE.md |
| `c94c73e` | 2026-11-06 14:30 | CMD-1106-16 | CMD-1106-16: the recommended-project list now says where each after-care is done (e.g. 'removal x1 (day 7 - must be in Korea)', 'either plac… |
| `6147263` | 2026-11-06 14:30 | CMD-1106-16 | CMD-1106-16: document in CLAUDE.md |
| `c72c679` | 2026-11-06 14:49 | CMD-1106-17 | CMD-1106-17: the surgery-date calendar no longer has the left/right month arrows - it now has year and month dropdowns in the same style as … |
| `8a4b678` | 2026-11-06 14:49 | CMD-1106-17 | CMD-1106-17: document in CLAUDE.md |
| `a8117e5` | 2026-11-06 14:57 | CMD-1106-18 | CMD-1106-18: on the IN trip card the arrival / leave are now filled directly on the card and only when the trip status is 'booked' (date and… |
| `50880b8` | 2026-11-06 14:57 | CMD-1106-18 | CMD-1106-18: document in CLAUDE.md |
| `f45c8af` | 2026-11-06 15:00 | CMD-1106-19 | CMD-1106-19: the KR surgery date card, while IN has not submitted the date yet, is now a single line 'Surgery date [waiting for the Indonesi… |
| `a63decd` | 2026-11-06 15:00 | CMD-1106-19 | CMD-1106-19: document in CLAUDE.md |
| `d842d63` | 2026-11-06 15:11 | CMD-1106-20 | CMD-1106-20: in the KR 'in-Korea management' (and care / IN care) action column, an unpaid item no longer shows a greyed 'book time' button … |
| `399329a` | 2026-11-06 15:11 | CMD-1106-20 | CMD-1106-20: document in CLAUDE.md |
| `011abd6` | 2026-11-06 16:10 | CMD-1106-21 | CMD-1106-21: IN trip-date calendar cleanup - grey cells carry no text (reason only in the hover), no 'N days / suggested M days' inside cell… |
| `90ccf10` | 2026-11-06 16:10 | CMD-1106-21 | CMD-1106-21: document in CLAUDE.md |
| `19cdfcd` | 2026-11-06 16:32 | CMD-1106-23 | CMD-1106-23: multi-line inputs in modals now have a visible box - the CSS variable --line used in ~70 inline border styles was never defined… |
| `2565b7e` | 2026-11-06 16:32 | CMD-1106-23 | CMD-1106-23: document in CLAUDE.md |
| `c17d2df` | 2026-11-06 16:43 | CMD-1106-22 | CMD-1106-22: money rules when a surgery cannot go ahead or changes (5-18) - the arrival evaluation is now two routes (can do / items changed… |
| `3b7ce0a` | 2026-11-06 16:43 | CMD-1106-22 | CMD-1106-22: document in CLAUDE.md |
| `e9b8eae` | 2026-11-09 09:30 | CMD-1106-24 | CMD-1106-24: rename "no-show" to "no-show on projects" and let any IN coordinator decide refund or keep - the deposit decision for items ski… |
| `88f7381` | 2026-11-09 09:30 | CMD-1106-24 | CMD-1106-24: document in CLAUDE.md |
| `19ee5fe` | 2026-11-09 10:34 | CMD-1109-01 | CMD-1109-01: re-lay the IN "Korea trip schedule" card once Korea has confirmed the surgery time - three sections separated by lines: title w… |
| `ed5a380` | 2026-11-09 10:34 | CMD-1109-01 | CMD-1109-01: document in CLAUDE.md |
| `3f5a7f3` | 2026-11-09 10:44 | CMD-1109-02 | CMD-1109-02: unify the buttons on the IN Korea trip schedule card, show the surgery time in Korean time first with the Indonesian time as a … |
| `297503a` | 2026-11-09 10:44 | CMD-1109-02 | CMD-1109-02: document in CLAUDE.md |
| `1131992` | 2026-11-09 11:08 | CMD-1109-03 | CMD-1109-03: merge the IN "Change surgery date" and "Cancel surgery plan" buttons into one "Surgery change" dialog - choose "Change time" (r… |
| `aa37026` | 2026-11-09 11:08 | CMD-1109-03 | CMD-1109-03: document in CLAUDE.md |
| `cbe2090` | 2026-11-09 11:20 | CMD-1109-04 | CMD-1109-04: check the trip and the surgery date against each other and rename the itinerary button - a trip change that leaves the surgery … |
| `fa53f0d` | 2026-11-09 11:20 | CMD-1109-04 | CMD-1109-04: document in CLAUDE.md |
| `0fa72be` | 2026-11-09 11:40 | CMD-1109-05 | CMD-1109-05: drop "set as preferred" from the backup-date cell, grey out send buttons when the dates hit the itinerary, and rework the itine… |
| `a03982e` | 2026-11-09 11:40 | CMD-1109-05 | CMD-1109-05: document in CLAUDE.md |
| `7aa7ee9` | 2026-11-09 11:55 | CMD-1109-06 | CMD-1109-06: return to the surgery change dialog after saving or cancelling the Korea itinerary opened from its red line, and open the surge… |
| `9f59e66` | 2026-11-09 11:55 | CMD-1109-06 | CMD-1109-06: document in CLAUDE.md |
| `84d78ed` | 2026-11-09 12:09 | CMD-1109-07 | CMD-1109-07: save the Korea itinerary without the browser "save anyway?" prompt and show the itinerary in the surgery change dialog title - … |
| `4be897d` | 2026-11-09 12:09 | CMD-1109-07 | CMD-1109-07: document in CLAUDE.md |
| `c211ea7` | 2026-11-09 13:57 | CMD-1109-08 | CMD-1109-08: redo the KR surgery-date confirmation card and make overlap with a director's existing booking a warning instead of a block - t… |
| `d65a30f` | 2026-11-09 13:58 | CMD-1109-08 | CMD-1109-08: document in CLAUDE.md |
| `45db416` | 2026-11-09 14:08 | CMD-1109-09 | CMD-1109-09: list the KR surgery start-time dropdown from two hours before opening to two hours after closing and label each time by where t… |
| `d518693` | 2026-11-09 14:08 | CMD-1109-09 | CMD-1109-09: document in CLAUDE.md |
| `d580b90` | 2026-11-09 14:20 | CMD-1109-10 | CMD-1109-10: after KR confirms a changed surgery time, show the same box on the IN schedule card as the first confirmation - the red 'please… |
| `c504ff1` | 2026-11-09 14:20 | CMD-1109-10 | CMD-1109-10: document in CLAUDE.md |
| `a144aab` | 2026-11-09 14:51 | CMD-1109-11 | CMD-1109-11: when the surgery message has been sent, the IN schedule card shows 'MM/DD HH:mm sent' with an underlined 'Send again' link inst… |
| `95466a7` | 2026-11-09 14:51 | CMD-1109-11 | CMD-1109-11: document in CLAUDE.md |
| `49ab2aa` | 2026-11-09 15:19 | CMD-1109-12 | CMD-1109-12: put the today's-action summary back at the bottom of the KR project card instead of a separate card and unify the wording to 'D… |
| `b2c0a04` | 2026-11-09 15:19 | CMD-1109-12 | CMD-1109-12: document in CLAUDE.md |
| `95576b3` | 2026-11-09 15:22 | CMD-1109-13 | CMD-1109-13: keep the today's-action summary on the KR project card visible when nothing is ticked - it shows 'Do today (0)', a centred grey… |
| `6882063` | 2026-11-09 15:22 | CMD-1109-13 | CMD-1109-13: document in CLAUDE.md |
| `7b6745b` | 2026-11-09 15:32 | CMD-1109-14 | CMD-1109-14: lay out the today's-action summary on the KR project card as the user specified - title 'Do today items (N)' with the Do today … |
| `990d224` | 2026-11-09 15:32 | CMD-1109-14 | CMD-1109-14: document in CLAUDE.md |
| `8c1353a` | 2026-11-09 15:58 | CMD-1109-15 | CMD-1109-15: finish the KR today's-action summary, rework the Add Items dialog and keep scroll positions - each summary line now has a check… |
| `f7557ba` | 2026-11-09 15:58 | CMD-1109-15 | CMD-1109-15: document in CLAUDE.md |
| `696ca62` | 2026-11-09 16:05 | CMD-1109-16 | CMD-1109-16: move the quantity stepper of multi-use items in the KR today's-action summary to the far right of the row - the row order is no… |
| `2ba0d57` | 2026-11-09 16:05 | CMD-1109-16 | CMD-1109-16: document in CLAUDE.md |
| `0b0d720` | 2026-11-09 16:28 | CMD-1109-17 | CMD-1109-17: rework the KR appointment-time dialog - a multi-use management item now lists one row per remaining use (e.g. 3 total with 1 us… |
| `d362e6f` | 2026-11-09 16:28 | CMD-1109-17 | CMD-1109-17: document in CLAUDE.md |
| `0d428f8` | 2026-11-09 16:54 | CMD-1109-18 | CMD-1109-18: align the KR in-progress items table to four columns, unify the three project-card pages, add today-cancel with a required reas… |
| `f6bd956` | 2026-11-09 16:54 | CMD-1109-18 | CMD-1109-18: document in CLAUDE.md |
| `b04104e` | 2026-11-09 16:55 | CMD-1109-18 | CMD-1109-18: tidy the overall-note block of the KR in-progress items - the title is now 'Overall note:' without the explanatory sentence and… |
| `13ea7a5` | 2026-11-09 16:55 | CMD-1109-18 | CMD-1109-18: correct the overall-note line in CLAUDE.md |
| `5902b68` | 2026-11-09 17:27 | CMD-1109-19 | CMD-1109-19: unify KR in-progress/project-card button size and rebuild the IN overseas-surgery, aftercare and management-item tabs - KR butt… |
| `d00b4ae` | 2026-11-09 17:27 | CMD-1109-19 | CMD-1109-19: document in CLAUDE.md |
| `6800b5d` | 2026-11-09 17:32 | CMD-1109-20 | CMD-1109-20: rename the KR today row button 'Not today' to 'Cancel today' (outline, same size as the surgery page) and add a 'View case' lin… |
| `088ddcc` | 2026-11-09 17:32 | CMD-1109-20 | CMD-1109-20: document in CLAUDE.md |
| `3d660cb` | 2026-11-09 17:42 | CMD-1109-21 | CMD-1109-21: show only Korea-handled aftercare in the IN overseas-surgery project card and write Korean-time first on IN schedule displays -… |
| `b169462` | 2026-11-09 17:42 | CMD-1109-21 | CMD-1109-21: document in CLAUDE.md |
| `a90f952` | 2026-11-09 17:46 | CMD-1109-22 | CMD-1109-22: add the 'View case' column to the booked management items on the IN overseas-surgery project card - the management page of the … |
| `b84797d` | 2026-11-09 17:46 | CMD-1109-22 | CMD-1109-22: document in CLAUDE.md |
| `85c9b6e` | 2026-11-09 17:56 | CMD-1109-23 | CMD-1109-23: make every KR in-progress item show 'Done' plus a 'Undo done' button before the guest leaves - surgery, aftercare and managemen… |
| `fa9209f` | 2026-11-09 17:56 | CMD-1109-23 | CMD-1109-23: document in CLAUDE.md |
| `1b8202b` | 2026-11-10 11:30 | 无 | Switch Git rules in CLAUDE.md from branch V4 to V5 |
| `61557d6` | 2026-11-10 10:23 | CMD-1109-24 | CMD-1109-24: KR in-progress notes are drafts until the single Save button - row notes and the overall note are saved together and only then … |
| `f21ad10` | 2026-11-10 10:32 | CMD-1109-25 | CMD-1109-25: add a 'Send trip reminder to guest' button to the 7-day confirm-trip window - SMS or WhatsApp preview (editable) with arrival, … |
| `33c0964` | 2026-11-10 11:36 | CMD-1110-01 | CMD-1110-01: add the 'affected flow' column rule to CLAUDE.md - Code may edit it and must check it in every report |
| `2b37cc3` | 2026-11-10 11:50 | CMD-1110-02 | CMD-1110-02: re-position notes - rename the overall note to visit note, IN notes card shows visit notes only, project notes follow the usage… |
| `cd98928` | 2026-11-10 12:00 | CMD-1110-03 | CMD-1110-03: name sub-cases after the work done that day (one shared function), rename the 'overseas surgery' tab and sub-case status to 'su… |
| `d7334be` | 2026-11-10 13:19 | CMD-1110-04 | CMD-1110-04: add the AI Organize button to the consultation 'recorded content' (doctor and secretary-proxy, same as the revisit evaluation w… |
| `4526a01` | 2026-11-10 13:19 | CMD-1110-04 | CMD-1110-04: document in CLAUDE.md |
| `509551d` | 2026-11-10 13:29 | CMD-1110-05 | CMD-1110-05: clean up the IN local management card - remove the 'Complete all' button, the explanation line and the 'continue using held ite… |
| `142d61b` | 2026-11-10 13:29 | CMD-1110-05 | CMD-1110-05: document in CLAUDE.md |
| `9a73dc2` | 2026-11-10 13:59 | CMD-1110-06 | CMD-1110-06: restructure the IN main case page - the trip moves to a third header line with a 'Trip change' button, the schedule card is tit… |
| `7500224` | 2026-11-10 14:00 | CMD-1110-06 | CMD-1110-06: document in CLAUDE.md |
| `a919155` | 2026-11-10 14:10 | CMD-1110-07 | CMD-1110-07: on the IN main case page, uncancelled Indonesia aftercare items now sit in a red-bordered 'To book (N)' card at the very top of… |
| `7026a97` | 2026-11-10 14:10 | CMD-1110-07 | CMD-1110-07: document in CLAUDE.md |
| `31034d4` | 2026-11-10 14:17 | CMD-1110-08 | CMD-1110-08: pure local cases get the header '+ Add local management' while local management is in progress (modal: use held / buy new, rout… |
| `86bf0b5` | 2026-11-10 14:17 | CMD-1110-08 | CMD-1110-08: document in CLAUDE.md |
| `027fe17` | 2026-11-10 14:24 | CMD-1110-09 | CMD-1110-09: the Notes content tab becomes left/right pages (Project notes (N) \| Visit notes (N), pill buttons like the project card, defau… |
| `03c2b00` | 2026-11-10 14:24 | CMD-1110-09 | CMD-1110-09: document in CLAUDE.md |
| `cd1933d` | 2026-11-10 14:44 | CMD-1110-10 | CMD-1110-10: the IN local management card becomes a table laid out like the Korea management table (Item \| Past surgery count \| Note \| St… |
| `5ac10c4` | 2026-11-10 14:44 | CMD-1110-10 | CMD-1110-10: document in CLAUDE.md |
| `8ca939f` | 2026-11-10 14:54 | CMD-1110-11 | CMD-1110-11: the current-status card (IN and KR) now names today's visit with the sub-case name function (the same dayNameOf as 'Next appoin… |
| `2781a89` | 2026-11-10 14:54 | CMD-1110-11 | CMD-1110-11: document in CLAUDE.md |
| `09799c6` | 2026-11-10 15:21 | CMD-1110-12 | CMD-1110-12: the 'View case' link in the 'View notes (N)' expansion now works on KR (the target is resolved at render time inside the right … |
| `9eca761` | 2026-11-10 15:21 | CMD-1110-12 | CMD-1110-12: document in CLAUDE.md |
| `2536789` | 2026-11-10 16:00 | CMD-1110-13 | CMD-1110-13: buying something new is now always called '+ Buy new item' - KR project card (button and modal title), IN 'Use held items?' car… |
| `643eb7f` | 2026-11-10 16:01 | CMD-1110-13 | CMD-1110-13: document in CLAUDE.md |
| `c9121ec` | 2026-11-10 16:32 | CMD-1110-14 | CMD-1110-14: IN case header buttons are fixed while a visit is in progress (Chat always, '+ Add consultation' only when the case has no cons… |
| `3889bc0` | 2026-11-10 16:32 | CMD-1110-14 | CMD-1110-14: document in CLAUDE.md |
| `bd1f1b1` | 2026-11-10 16:44 | CMD-1110-15 | CMD-1110-15: KR 'Add today's item' modal - the selectable count of a held management item is its remaining count minus the count already add… |
| `c173278` | 2026-11-10 16:44 | CMD-1110-15 | CMD-1110-15: document in CLAUDE.md |
| `150adcd` | 2026-11-10 17:00 | CMD-1110-16 | CMD-1110-16: modal sizes become four tiers shared site-wide (S 400 / M 560 / L 800 / new XL 1120, width min(size, 92vw); old fixed-width mod… |
| `f9fed36` | 2026-11-10 17:00 | CMD-1110-16 | CMD-1110-16: document in CLAUDE.md |
| `d709e91` | 2026-11-10 17:09 | CMD-1110-17 | CMD-1110-17: KR sub-case 'Today items' tab and the surgery-day 'In-progress items' tab only show today's items - the 'Post-op care' overview… |
| `da36275` | 2026-11-10 17:09 | CMD-1110-17 | CMD-1110-17: document in CLAUDE.md |
| `3942d71` | 2026-11-10 17:23 | CMD-1110-18 | CMD-1110-18: simplify the 'How do you want to arrange items today?' modal (title + X only, two stacked equal-width buttons 'Use held items' … |
| `df5318f` | 2026-11-10 17:24 | CMD-1110-18 | CMD-1110-18: document in CLAUDE.md |
| `1fc56a0` | 2026-11-10 17:31 | CMD-1110-19 | CMD-1110-19: KR sub-case pages (non-surgery day, surgery day, revisit sub-case) now share the main-case three-line header (name / case no / … |
| `d253e44` | 2026-11-10 17:31 | CMD-1110-19 | CMD-1110-19: document in CLAUDE.md |
| `5cdd6c1` | 2026-11-10 17:44 | CMD-1110-20 | CMD-1110-20: visit notes now live only in the main case 'Notes' tab and on the day's sub-case page (the 'Notes' card under the Surgery / Pos… |
| `614f5e2` | 2026-11-10 17:44 | CMD-1110-20 | CMD-1110-20: document in CLAUDE.md |
| `c4123ef` | 2026-11-10 17:50 | CMD-1110-21 | CMD-1110-21: after buying new local items and paying, a small 'Use held items?' modal (S) pops up with [Do not use] [Use] and a close X (X =… |
| `ad4a235` | 2026-11-10 17:50 | CMD-1110-21 | CMD-1110-21: document in CLAUDE.md |
| `0221d19` | 2026-11-10 17:58 | CMD-1110-22 | CMD-1110-22: rework the KR 'Add today's items' modal - title is just 'Add today's items' with a close X (no client name, no hint line); '+ B… |
| `3a0a9a4` | 2026-11-10 17:58 | CMD-1110-22 | CMD-1110-22: document in CLAUDE.md |
| `e6717cb` | 2026-11-10 18:05 | CMD-1110-23 | CMD-1110-23: KR today-items table action cell now puts the underlined text link 'Cancel for today' to the left of the [Mark done] button on … |
| `df030eb` | 2026-11-10 18:05 | CMD-1110-23 | CMD-1110-23: document in CLAUDE.md |
| `b046f74` | 2026-11-10 18:15 | CMD-1110-24 | CMD-1110-24: KR today-items / in-progress items tables now give surgery rows and management-item rows the same underlined 'Cancel for today'… |
| `862f357` | 2026-11-10 18:15 | CMD-1110-24 | CMD-1110-24: document in CLAUDE.md |
| `6f55770` | 2026-11-10 18:42 | CMD-1110-25 | CMD-1110-25: next-schedule / KR stage names use dayNameOf; remove KR completed-visit [Add item]; leave-store prompt reuses header flow; repl… |
| `11a69ce` | 2026-11-10 18:45 | CMD-1110-25 | CMD-1110-25: update selftest for leave-store prompt auto-answer and replacement-credit purchase modal (B7, D28b, D31b, CP1, CP2); note in CL… |
| `b82c831` | 2026-11-10 19:05 | CMD-1110-26 | CMD-1110-26: KR recommended-item note box only appears when ticked (typed text kept when unticked); KR send-plan screen stacked top-to-botto… |
| `e50dc46` | 2026-11-10 19:08 | CMD-1110-27 | CMD-1110-27: remove unused krReopenFooter / krReopenAdd (and the dead reopenOk allowance in krRoWrap); selftest assertion updated; old in-pa… |
| `4445006` | 2026-11-11 10:13 | CMD-1111-01 | CMD-1111-01: IN workbench unbooked list is one row per client (earliest suggested date, [Book]); IN overseas-care booking modal is one row p… |
| `3704a28` | 2026-11-11 10:39 | CMD-1111-02 | CMD-1111-02: IN consult tab is one merged card (title row with status and consult time; report row with [Download]/[View plan]); report stay… |
| `e82f683` | 2026-11-11 10:49 | CMD-1111-03 | CMD-1111-03: send-info modal 'trip and weather' is only tickable within 7 days before surgery and with a fixed trip (otherwise greyed with a… |
| `50384a0` | 2026-11-11 11:38 | CMD-1111-04 | CMD-1111-04: booking modal back to one box and one time per day (rows movable by date, existing visit merged, no per-row times); remove the … |
| `6ed227e` | 2026-11-11 15:20 | CMD-1111-05 | CMD-1111-05: IN/KR todo list is five columns (appear time, stage, process, status, client), newest first, with short stage/process text and … |
| `a23fe45` | 2026-11-11 15:21 | 无 | docs: Git rules - commit after every task, never push (user pushes V5 daily), never merge; commit leftover changes of the previous task firs… |
| `f0ebded` | 2026-11-11 15:25 | CMD-1111-06 | CMD-1111-06: IN client page gets a "held amount" tab for compensation credits (list, remaining total, expandable usage, linked source case) … |
| `12d27af` | 2026-11-11 15:30 | CMD-1111-07 | CMD-1111-07: customer "My reservations" page gets a full-width Log out button at the bottom (clears the phone-verified session, back to home… |
| `d317836` | 2026-11-11 16:17 | 无 | Add handoff docs sample for G-Booking-01-H01 and G-Booking-01-C02 (README, snapshot.html, screenshots) |
| `69dfbaf` | 2026-11-11 16:42 | CMD-1111-09 | CMD-1111-09: customer self-booking no longer merges into a same-day visit that has already arrived (new reservation was missing from 'Curren… |
| `c0afb8f` | 2026-11-11 17:21 | CMD-1111-10 | CMD-1111-10: customer booking page follows the Figma design system (Noto Sans SC, font sizes 12/13/14/16/22, radii 4/6/8/12/16, DS color var… |

## 二、每个 Code 任务改了哪些文件

（同一任务有多个提交时合并；`docs/handoff` 不算；原型专用文件加 †，见第四节）

- **CMD-1106-02**（2026-11-06；提交 `b51263d`, `1456faa`）：`prototype/shared/booking.js`、`prototype/shared/data.js`、`prototype/shared/i18n.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1106-03**（2026-11-06；提交 `5b41fd5`, `e954e45`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1106-04**（2026-11-06；提交 `7434759`, `91652a6`）：`prototype/shared/app.css`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-05**（2026-11-06；提交 `faece71`, `c36f11d`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-06**（2026-11-06；提交 `5410e91`, `61a97a2`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/store.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1106-07**（2026-11-06；提交 `8b17a7e`, `934597e`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-08**（2026-11-06；提交 `73085cf`, `e27c7fd`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1106-09**（2026-11-06；提交 `2c79a47`, `c319f69`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-10**（2026-11-06；提交 `92fac1f`, `14a4912`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-11**（2026-11-06；提交 `dcfbcc1`, `de3f3d5`, `fdb9778`, `f36ef6a`）：`prototype/shared/app.css`、`prototype/shared/calalign.js`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-12**（2026-11-06；提交 `1bd0683`, `f7e4dc0`）：`prototype/shared/app.css`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-13**（2026-11-06；提交 `0760d72`, `6d09ddf`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-14**（2026-11-06；提交 `aac66a6`, `e82eb3a`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-15**（2026-11-06；提交 `842c9c7`, `5b60bef`, `ea365da`, `7dba1d8`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-16**（2026-11-06；提交 `c94c73e`, `6147263`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`prototype/shared/rules.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-17**（2026-11-06；提交 `c72c679`, `8a4b678`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-18**（2026-11-06；提交 `a8117e5`, `50880b8`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1106-19**（2026-11-06；提交 `f45c8af`, `a63decd`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-20**（2026-11-06；提交 `d842d63`, `399329a`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-21**（2026-11-06；提交 `011abd6`, `90ccf10`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-23**（2026-11-06；提交 `19cdfcd`, `2565b7e`）：`prototype/shared/app.css`、`prototype/shared/kr.js`、`prototype/shared/krbook.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1106-22**（2026-11-06；提交 `c17d2df`, `3b7ce0a`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`prototype/shared/rules.js`、`†prototype/shared/selftest.js`、`prototype/shared/store.js`、`prototype/shared/todo.js`、`CLAUDE.md`
- **CMD-1106-24**（2026-11-09；提交 `e9b8eae`, `88f7381`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`prototype/shared/store.js`、`prototype/shared/todo.js`、`CLAUDE.md`
- **CMD-1109-01**（2026-11-09；提交 `19ee5fe`, `ed5a380`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-02**（2026-11-09；提交 `3f5a7f3`, `297503a`）：`prototype/shared/app.css`、`prototype/shared/calalign.js`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1109-03**（2026-11-09；提交 `1131992`, `aa37026`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-04**（2026-11-09；提交 `cbe2090`, `fa53f0d`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/todo.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1109-05**（2026-11-09；提交 `0fa72be`, `a03982e`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-06**（2026-11-09；提交 `7aa7ee9`, `9f59e66`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-07**（2026-11-09；提交 `84d78ed`, `4be897d`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-08**（2026-11-09；提交 `c211ea7`, `d65a30f`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-09**（2026-11-09；提交 `45db416`, `d518693`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-10**（2026-11-09；提交 `d580b90`, `c504ff1`）：`prototype/shared/calalign.js`、`†prototype/shared/selftest.js`、`prototype/shared/todo.js`、`CLAUDE.md`
- **CMD-1109-11**（2026-11-09；提交 `a144aab`, `95466a7`）：`prototype/shared/calalign.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-12**（2026-11-09；提交 `49ab2aa`, `b2c0a04`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-13**（2026-11-09；提交 `95576b3`, `6882063`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-14**（2026-11-09；提交 `7b6745b`, `990d224`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-15**（2026-11-09；提交 `8c1353a`, `f7557ba`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-16**（2026-11-09；提交 `696ca62`, `2ba0d57`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-17**（2026-11-09；提交 `0b0d720`, `d362e6f`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-18**（2026-11-09；提交 `0d428f8`, `f6bd956`, `b04104e`, `13ea7a5`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-19**（2026-11-09；提交 `5902b68`, `d00b4ae`）：`prototype/shared/app.css`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-20**（2026-11-09；提交 `6800b5d`, `088ddcc`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-21**（2026-11-09；提交 `3d660cb`, `b169462`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-22**（2026-11-09；提交 `a90f952`, `b84797d`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-23**（2026-11-09；提交 `85c9b6e`, `fa9209f`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1109-24**（2026-11-10；提交 `61557d6`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`
- **CMD-1109-25**（2026-11-10；提交 `f21ad10`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`
- **CMD-1110-01**（2026-11-10；提交 `33c0964`）：`CLAUDE.md`
- **CMD-1110-02**（2026-11-10；提交 `2b37cc3`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`
- **CMD-1110-03**（2026-11-10；提交 `cd98928`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`
- **CMD-1110-04**（2026-11-10；提交 `d7334be`, `4526a01`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`prototype/shared/rules.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-05**（2026-11-10；提交 `509551d`, `142d61b`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-06**（2026-11-10；提交 `9a73dc2`, `7500224`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/todo.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1110-07**（2026-11-10；提交 `a919155`, `7026a97`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1110-08**（2026-11-10；提交 `31034d4`, `86bf0b5`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`prototype/shared/rules.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1110-09**（2026-11-10；提交 `027fe17`, `03c2b00`）：`prototype/shared/calalign.js`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1110-10**（2026-11-10；提交 `cd1933d`, `5ac10c4`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-11**（2026-11-10；提交 `8ca939f`, `2781a89`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1110-12**（2026-11-10；提交 `09799c6`, `9eca761`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-13**（2026-11-10；提交 `2536789`, `643eb7f`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`prototype/shared/rules.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-14**（2026-11-10；提交 `c9121ec`, `3889bc0`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1110-15**（2026-11-10；提交 `bd1f1b1`, `c173278`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-16**（2026-11-10；提交 `150adcd`, `f9fed36`）：`prototype/shared/app.css`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`、`CLAUDE.md`
- **CMD-1110-17**（2026-11-10；提交 `d709e91`, `da36275`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-18**（2026-11-10；提交 `3942d71`, `df5318f`）：`prototype/shared/app.css`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-19**（2026-11-10；提交 `1fc56a0`, `d253e44`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-20**（2026-11-10；提交 `5cdd6c1`, `614f5e2`）：`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-21**（2026-11-10；提交 `c4123ef`, `ad4a235`）：`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-22**（2026-11-10；提交 `0221d19`, `3a0a9a4`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-23**（2026-11-10；提交 `e6717cb`, `df030eb`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-24**（2026-11-10；提交 `b046f74`, `862f357`）：`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`CLAUDE.md`
- **CMD-1110-25**（2026-11-10；提交 `6f55770`, `11a69ce`）：`CLAUDE.md`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`
- **CMD-1110-26**（2026-11-10；提交 `b82c831`）：`CLAUDE.md`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`
- **CMD-1110-27**（2026-11-10；提交 `e50dc46`）：`CLAUDE.md`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`
- **CMD-1111-01**（2026-11-11；提交 `4445006`）：`CLAUDE.md`、`prototype/shared/app.css`、`†prototype/shared/selftest.js`、`prototype/shared/todo.js`
- **CMD-1111-02**（2026-11-11；提交 `3704a28`）：`CLAUDE.md`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`
- **CMD-1111-03**（2026-11-11；提交 `e82f683`）：`CLAUDE.md`、`prototype/shared/calalign.js`、`†prototype/shared/selftest.js`
- **CMD-1111-04**（2026-11-11；提交 `50384a0`）：`CLAUDE.md`、`prototype/shared/data.js`、`prototype/shared/kr.js`、`†prototype/shared/selftest.js`、`prototype/shared/todo.js`
- **CMD-1111-05**（2026-11-11；提交 `6ed227e`）：`CLAUDE.md`、`prototype/shared/app.css`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`prototype/shared/todo.js`、`prototype/shared/ui.js`
- **CMD-1111-06**（2026-11-11；提交 `f0ebded`）：`CLAUDE.md`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`、`prototype/shared/ui.js`
- **CMD-1111-07**（2026-11-11；提交 `12d27af`）：`CLAUDE.md`、`prototype/booking.html`、`prototype/shared/booking.js`、`prototype/shared/i18n.js`
- **CMD-1111-09**（2026-11-11；提交 `69dfbaf`）：`CLAUDE.md`、`prototype/shared/booking.js`、`prototype/shared/data.js`、`†prototype/shared/selftest.js`
- **CMD-1111-10**（2026-11-11；提交 `c0afb8f`）：`CLAUDE.md`、`prototype/booking.html`、`prototype/shared/booking.css`、`prototype/shared/booking.js`

## 三、资料结构的变化

### 数据版本

| 提交 | 日期 | 任务 | 版本 |
|---|---|---|---|
| `5410e91` | 2026-11-06 12:42 | CMD-1106-06 | 59 → 60 |
| `c17d2df` | 2026-11-06 16:43 | CMD-1106-22 | 60 → 61 |

共：59 → 61。迁移写在 `prototype/shared/store.js` 的 `MIGRATIONS`（`to:60`、`to:61`）；升级前会自动备份并保留用户案件。

### 各任务的字段变化（摘自 CLAUDE.md 该任务的补充）

**CMD-1106-02**
- 数据版本不变（59）。

**CMD-1106-03**
- 数据版本不变（59，新增可空字段 `c.scopeLock`，不需要迁移）。

**CMD-1106-04**
- 数据版本不变（59）。

**CMD-1106-05**
- 数据版本不变（59）。
- - **KR 的［补加］［编辑］跟着 IN 的进度**（不再存 IN 锁，按案件状态现算，data.js `scopeInLock` / `scopeFrozen`）：① IN 还在勾项目、没按结算 → KR 可以按（`scopeLockInStart` 变成空函数，`toggleProject` / `toggleHeldSurg` / `settleProjects` 不再记锁）② IN 按了［结算］（`confirmProjectSelectionGo` 生成结算单，状态 `unpaid`）→ 灰掉，滑过「A1 室长正在结算，请稍后」（`b.orderedBy`），`coreScopeEdit` / `coreAddScopeItem` / `krScLockStart` 程序里也拒绝；

**CMD-1106-06**
- **数据版本 59 → 60**（`MIGRATIONS` to:60 对案件是空迁移；

**CMD-1106-07**
- **数据版本不变（60）**，没有新字段（检查都是现算）。

**CMD-1106-08**
- **数据版本不变（60）**，只改读取和画面，没动资料层。

**CMD-1106-09**
- **数据版本不变（60）**（新增可空字段 `krSchedule.durMin`）。

**CMD-1106-10**
- **数据版本不变（60）**，没有新字段。

**CMD-1106-11**
- **数据版本不变（60）**，只改画面和文字。
- 数据版本不变（60）。

**CMD-1106-12**
- **数据版本不变（60）**，只改画面（`krSchForm` / `krSchReset` / `krSchSet` / `krTimeOptionsFor`，app.css `.kr-time-sel.is-empty`）。

**CMD-1106-13**
- **数据版本不变（60）**，只改画面（kr.js `krTripRowHtml` 新增，`krMainHeader` / `krSurgDayHeader` 改三行；

**CMD-1106-14**
- **数据版本不变（60）**，只改画面（kr.js `krSchForm`）。

**CMD-1106-15**
- **数据版本不变（60）**，只改画面（kr.js `krGcPickColumn` 包一层 `window.KR_PICK_SIMPLE`，`krGcPickColumn0` 是原函数；
- 数据版本不变（60）；

**CMD-1106-16**
- **数据版本不变（60）**（没有迁移：旧资料照旧显示，下次编辑才换成自动算）。

**CMD-1106-17**
- **数据版本不变（60）**，只改画面（data.js `krSchedYM` / `krScheduleSetYM` / `krSchedMonthNavHtml` 新增，`krProcedureTabMain`、`tripStateBlockHtml` 改）。

**CMD-1106-18**
- **数据版本不变（60）**（新增可空字段 `krSchedule.tripDraft` / `tripErr`，旧资料不用迁移）。

**CMD-1106-19**
- **数据版本不变（60）**，只改画面。

**CMD-1106-20**
- **数据版本不变（60）**，只改画面。

**CMD-1106-21**
- **数据版本不变（60）**，只改画面（data.js `krDateCalendarGridHtml` 精简，新增 `tripSubmitYellowHtml`）。

**CMD-1106-23**
- **数据版本不变（60）**。

**CMD-1106-22**
- **数据版本 60 → 61**（`MIGRATIONS` to:61，升级前自动备份；
- 新增可空字段 `c.depositDue / noShowDue / krRefundDue / krRefunds / krTailPaid`、`krJudge.route`、`visitEval.route/inRefund/krDiff`、项目 `tripEndUndone`）。

**CMD-1106-24**
- **数据版本不变（61）**，没有新字段。
- - 「无故不来」全部改名「无故不做项目」（待办、通知、Timeline、决定窗、迁移备注；

**CMD-1109-01**
- **数据版本不变（61）**，只改画面。
- - 三段（`krProcedureTabMain`，data.js）：标题「赴韩日程」+［打印］｜「行程」+［日程变动］（原标题行［修改］改名搬下来，功能不变 `openStayModal`）+ 到达日 / 离境日两行（日期 时间 机场）+ **只一行**「⚠️ 离境日比建议少 N 天」（`inStayInnerHtml(c, true)`：拿掉拆线黄字和建议在韩停留小字，年份可能存错的红字保留）｜「施术日期」+ 状态标签（待 KR 确认 / 已确认 / 改期待确认 / 已到院）+ 右边按钮（`sdHead`）。
- 已确认：［修改施术日期］［取消施术计划］（原［修改日期］［取消项目］改名，功能不变）；
- - `surgSendHtml`（calalign.js）：按钮改名［发送信息给客人］，发过之后**按钮还在（可以再发）**，下面小字「已发送 MM/DD HH:mm」（电话通知写「已电话通知 MM/DD HH:mm」）；

**CMD-1109-02**
- **数据版本不变（61）**（新增可空字段 `HOSPITAL_DATA[h].addressKo`，没填 = 读医院基本资料里的韩文地址，不需要迁移）。

**CMD-1109-03**
- **数据版本不变（61）**，没有新字段（仅 `krSchedule.changeReason` 可空文字）。

**CMD-1109-04**
- **数据版本不变（61）**，没有新字段（仅 `krSchedule.rebookFlag` 可空文字，防重复通知）。

**CMD-1109-05**
- **数据版本不变（61）**，只改画面。

**CMD-1109-06**
- **数据版本不变（61）**，只改画面流程。

**CMD-1109-07**
- **数据版本不变（61）**，只改画面。

**CMD-1109-08**
- **数据版本不变（61）**，没有新字段（只有 Timeline 多一句）。

**CMD-1109-09**
- **只改画面，数据版本不变（61）**。

**CMD-1109-10**
- **只改画面，数据版本不变（61）**。

**CMD-1109-11**
- **只改画面，数据版本不变（61）**。

**CMD-1109-12**
- **只改画面，数据版本不变（61）**。
- ② ［本次使用］按钮也一起改名为［今日进行］（任务写“KR 这张卡里其他地方如果还写本次使用就改”）。

**CMD-1109-13**
- **只改画面，数据版本不变（61）**。

**CMD-1109-14**
- **只改画面，数据版本不变（61）**。

**CMD-1109-15**
- **只改画面，数据版本不变（61）**。

**CMD-1109-16**
- **只改画面，数据版本不变（61）**。

**CMD-1109-17**
- **只改画面，数据版本不变（61）**。

**CMD-1109-18**
- **数据版本不变（61）**，没有新字段（只有今日取消施术时给项目写 `rebookWait.memo`）。

**CMD-1109-19**
- **数据版本不变（61）**，只改画面。

**CMD-1109-20**
- - 分支 **V4**，数据版本不变（61），只改画面。

**CMD-1109-21**
- - 分支 **V4**，数据版本不变（61），只改画面。

**CMD-1109-22**
- - 分支 **V4**，数据版本不变（61），只改画面。

**CMD-1109-23**
- - 分支 **V4**，数据版本不变（61），不涉及钱。

**CMD-1110-04**
- **数据版本不变（61）**，只改画面和文案。

**CMD-1110-05**
- - 分支 **V5**，数据版本不变（61），只改画面。

**CMD-1110-06**
- **数据版本不变（61）**，没有新字段（新增可空字段 `c.informLast`，旧资料按 `surgeryMsg` / `tripRemindMsg` 推算）。

**CMD-1110-07**
- - 分支 **V5**，数据版本不变（61），只改画面。

**CMD-1110-08**
- - 分支 **V5**，数据版本不变（61）；
- 新增可空字段 `HOSPITAL_DATA[h].city` / `_cityDemo`（没有就退回时区对应的城市，不需要迁移）。

**CMD-1110-09**
- - 分支 **V5**，数据版本不变（61），只改画面。
- - **IN 页头［行程变动］→［行程修正］**：`inTripHeaderRowHtml` 的按钮改名，尺寸 = KR 页头 `krTripRowHtml` 的［行程修正］（`btn-outline` + `padding:3px 10px;font-size:12px`）；

**CMD-1110-10**
- - 分支 **V5**，数据版本不变（61），只改画面 + 一个读取函数。

**CMD-1110-11**
- - 分支 **V5**，数据版本不变（61），只改画面。

**CMD-1110-12**
- **数据版本不变（61）**，只改画面和读取，没有新字段。

**CMD-1110-13**
- **数据版本不变（61）**，只改画面和入口。
- 现在按钮挪到卡片标题行右边、改名［+ 购买新项目］，调用新函数 `localBuyNew()`（`c.addingMore = true`，打开 `localPurchaseHtml(c,'main',true)`）；

**CMD-1110-14**
- **数据版本不变（61）**，没有新字段，旧资料不用迁移（靠读取规则兜底）。

**CMD-1110-15**
- **数据版本不变（61）**，只改画面 / 弹窗列表筛选。

**CMD-1110-16**
- **数据版本不变（61）**，没有新字段。

**CMD-1110-17**
- **数据版本不变（61）**，只改画面。

**CMD-1110-18**
- **数据版本不变（61）**，只改画面。

**CMD-1110-19**
- **数据版本不变（61）**，只改画面 / 入口。

**CMD-1110-20**
- **数据版本不变（61）**，没有迁移。

**CMD-1110-21**
- **数据版本不变（61）**，只改入口和弹窗。

**CMD-1110-22**
- **数据版本不变（61）**，只改画面。

**CMD-1110-23**
- **数据版本不变（61）**，只改画面。

**CMD-1110-24**
- **数据版本不变（61）**，只加入口，规则和钱都没动。

**CMD-1110-25**
- **数据版本不变（61）**，没有新字段。

**CMD-1110-26**
- **数据版本不变（61）**；
- 新增可空字段 `c.visitNoteDraftIn`、IN 备注记录的 `src:'face'`（不需要迁移）。
- `addConsult` 不再存 `addConsultRef`。

**CMD-1110-27**
- 数据版本不变（61）；

**CMD-1111-01**
- **数据版本不变（61）**，只改画面 / 预约入口，没有新字段。

**CMD-1111-02**
- **数据版本不变（61）**，只改画面 / 入口。

**CMD-1111-03**
- **数据版本不变（61）**，只改弹窗的可勾条件。

**CMD-1111-04**
- **数据版本不变（61）**，只改画面和 Timeline 用词。

**CMD-1111-05**
- **数据版本不变（61）**，新增可空字段 `c.leaveConsider`。

**CMD-1111-06**
- **数据版本不变（61）**，只改显示位置。

**CMD-1111-07**
- **数据版本不变（61）**，没有新字段。

**CMD-1111-09**
- **数据版本不变（61）**，没有新字段，只修 bug，不改规则。

**CMD-1111-10**
- **数据版本不变（61）**，只改客人预约页画面，不改规则 / 流程 / 文字内容。


> 说明：新增的栏位绝大多数是「可空字段」，旧资料没有就当没有，不需要迁移；真正改了旧资料的只有数据版本 60、61 两次迁移。栏位名称、含义以各任务的 CLAUDE.md 补充和 Notion 汇报为准。

## 四、原型专用（正式版不用做）

这些文件 / 功能只为了在没有后端的原型里测试和演示：

- `prototype/shared/selftest.js`：84 个提交

另外属于原型专用的功能（不在上面文件里，但正式版不用做）：演示时间 / 拨时钟（`demoNow`、`gmc_cfg_demotime`、`realNow`）、演示账号一键登录、「重置演示数据 / 清空案件和客人」、自动备份与 `gmc_cfg_usersafe`、多分页 localStorage 三方合并（`store.js`，正式版由后端版本号 / 事务处理）、测试覆盖页、一键准备测试客人、手机预览页 `phone.html`、各种「模拟…」按钮和 `window.GMC_*` 测试钩子。

