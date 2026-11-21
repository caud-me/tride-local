# TRIDE Local (`localStorage` Edition)

1:1 frontend mimic of the TRIDE full-stack web application backed entirely by `localStorage` (`tride_local_db_v1` and `tride_local_notifications_v1`), with no backend server or database required.

## Entrypoints

- `index.html` — Member app (Drivers & Operators)
- `admin.html` — Officer portal (TODA Presidents & Federation Secretary)
- `components/distortion-wave-demo.html` — Distortion wave sandbox

## Fresh Start & Placeholder Loader

Fresh users start on the **First-time setup (OOBE)** screen with an empty `localStorage` database. Click **Load placeholder data (96 members)** on the setup screen to populate sample records into `localStorage` anytime.

## Sample Accounts (After Loading Placeholder Data)

- `1` — Arron Caudilla (Federation Secretary, no TODA)
- `2` — Rafael Bautista (Tinago TODA President, Operator & self-driver on unit `0001`, owns 2 units)
- `6` — Operator at max 3/3 unit limit (`0003`–`0005`, `0005` unassigned)
- `7` — Unlicensed pure Operator (`0006`–`0007`)
- `3`–`96` — Naga City members across `T1`–`T5` (assigned drivers, available licensed drivers, and no-role members); `T5` has no president yet, and `T6` starts empty (`Empty TODAs`)

Using **Reset & truncate database** in Admin Settings clears all records back to OOBE.
