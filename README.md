# Tride Local (`dbms1_tride` Offline PWA Edition)

1:1 offline Progressive Web App mirror of the `dbms1_tride` full-stack web application backed entirely by browser `localStorage` (`tride_local_db_v2` and `tride_local_notifications_v2`), with zero backend server or MySQL installation required.

## Entrypoints

- `./index.html` — Member App (Drivers & Operators)
- `./admin.html` — Admin Portal (Active TODA Board Officers & Federation Secretary)
- `./playground.html` — Distortion Wave visual sandbox

## 6-Table Offline Relational Engine (`js/local_*.js`)

All `dbms1_tride` tables, constraints, referential actions, and triggers run locally in the browser:

- **Tables**: `FEDERATION`, `TODA_ASSOCIATION`, `MEMBER`, `TRICYCLE`, `DRIVER_ASSIGNMENT`, `OFFICER_TERM`.
- **5-Unit Ownership Cap (`OWNS`)**: Enforced on both tricycle registration and ownership transfer (`MAX_OWNED_TRICYCLES = 5`, Ordinance No. 1998-003 Sec. 116).
- **Primary & Alternate (*Relyebo*) Shift Assignments (`DRIVER_ASSIGNMENT`)**: Supports `M:N` driver-to-tricycle shift schedules keyed by `Tricycle_ID` (`Body_Number` up to 15 chars including `013-STF` / `037-STF`), requires a non-null `License_Number` on the assigned driver, prevents clearing `License_Number` while shift records exist, and allows at most one active `Primary` shift per unit alongside unlimited `Alternate` shifts.
- **TODA Officer Boards (`OFFICER_TERM`)**: Tracks all 7 SEC-registered board positions (`President`, `Vice President`, `Secretary`, `Treasurer`, `Auditor`, `Sgt. at Arms`, `Board of Directors`) with `Term_End >= Term_Start`, active-date detection, and same-`TODA` membership enforcement (blocking `MEMBER.TODA_ID` transfer while officer terms exist in the old TODA).
  - `Federation Secretary`: City-wide read/write across all 6 tables.
  - `President`: Full TODA-scoped management including non-President board seats.
  - `Vice President` & `Secretary`: TODA-scoped member, unit, and shift editing.
  - `Treasurer`, `Auditor`, `Sgt. at Arms`, `Board of Directors`: TODA-scoped read-only access in the Admin Portal.
- **`RA 10173` Hard-Delete Integrity**:
  - Deleting a `MEMBER` is blocked (`ON DELETE RESTRICT`) only when they still own franchised `TRICYCLE` units. Otherwise, their `DRIVER_ASSIGNMENT` and `OFFICER_TERM` rows cascade-delete (`ON DELETE CASCADE`) and any `FEDERATION.Secretary_Member_ID` pointer clears (`ON DELETE SET NULL`).
  - Deleting a `TRICYCLE` cascades its `DRIVER_ASSIGNMENT` rows (`ON DELETE CASCADE`).
  - Deleting a `FEDERATION` detaches affiliated TODAs (`TODA_ASSOCIATION.Federation_ID = NULL`).
  - Deleting a `TODA_ASSOCIATION` is blocked (`ON DELETE RESTRICT`) while members still belong to it.

## Cold Start & Official Sample Dataset

Fresh installs start empty on the **First-time setup (OOBE)** wizard (`FEDERATION` -> founding `TODA_ASSOCIATION` -> Secretary `MEMBER` -> bind `Secretary_Member_ID`). Click **Load sample data** on Step 1 to populate the official `dbms1_tride` dataset (`5` federations, `5` TODAs, `6` members, `5` tricycles, `5` shift assignments, `5` officer terms):

- `MEM-001` — Juan Dela Cruz (`FED-01` Federation Secretary + `TODA-01` President + Operator of `TRI-001` / `0224` + Primary Driver)
- `MEM-002` — Maria Santos (Unlicensed pure Operator of `TRI-002` & `TRI-003` + `TODA-01` Treasurer, read-only admin)
- `MEM-003` — Pedro Reyes (`TODA-01` Secretary + Primary Driver on `TRI-002`)
- `MEM-004` — Elena Bautista (Licensed Alternate/*relyebo* Driver on `TRI-002`)
- `MEM-005` — Carlos Mendoza (`TODA-02` President + Operator & Primary Driver on `TRI-004` / `013-STF`)
- `MEM-006` — Ramon Villanueva (`TODA-03` President + Operator of `TRI-005` / `037-STF` `Expired`, inactive shift)

Using **Reset database** in the Admin Portal clears all 6 tables and notifications back to cold-start OOBE.
