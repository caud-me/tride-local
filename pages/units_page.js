/* operator units, manage unit, shift assignments, units list, and add tricycle screens */

const UNIT_PAGE_MAX_UNITS = 5;
const UNIT_PAGE_ID_MAX = 10;
const UNIT_PAGE_BODY_MAX = 15;
const UNIT_PAGE_DATE_MAX = 10;

// params: bodyNumber (required), ownerFirstName (optional), ownerId (optional)
function formatUnitSubtitle(bodyNumber, ownerFirstName, ownerId) {
    const isSelfOwner = Boolean(ownerId && ownerId === getSessionMemberId());
    if (isSelfOwner) {
        return "for your unit " + bodyNumber;
    }
    if (ownerFirstName) {
        return "for " + ownerFirstName + "'s unit " + bodyNumber;
    }
    return "for unit " + bodyNumber;
}

// params: none
function getTodayIsoString() {
    const now = new Date();
    const yearStr = String(now.getFullYear());
    let monthStr = String(now.getMonth() + 1);
    if (monthStr.length < 2) {
        monthStr = "0" + monthStr;
    }
    let dayStr = String(now.getDate());
    if (dayStr.length < 2) {
        dayStr = "0" + dayStr;
    }
    return yearStr + "-" + monthStr + "-" + dayStr;
}

/* operator self-managed units page */

// params: none
function renderOperatorUnitsPage() {
    const memberId = getSessionMemberId();
    let ownedCount = 0;
    let loaded = false;

    const addIcon = trIcon("\uE710", {
        label: "Add tricycle",
        onClick: function () {
            if (loaded && ownedCount >= UNIT_PAGE_MAX_UNITS) {
                trAlert({
                    title: "Tricycle limit reached",
                    message: "You already own " + UNIT_PAGE_MAX_UNITS + " tricycles, which is the maximum allowed per operator."
                });
                return;
            }
            pushPage(renderAddMyUnitPage, { ownerId: memberId, ownerName: "Me" });
        }
    });

    const navBar = trNavBar({
        title: "Manage my tricycle units",
        onBack: popPage,
        actions: [addIcon]
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading units...");
    main.appendChild(loadingText);

    apiListTricycles({ ownerId: memberId }).then(function (data) {
        main.replaceChildren();
        const units = data.tricycles || [];
        ownedCount = units.length;
        loaded = true;

        const active = [];
        const unassigned = [];
        for (let i = 0; i < ownedCount; i += 1) {
            const activeShifts = getActiveAssignments(units[i].assignments);
            if (activeShifts.length > 0) {
                active.push(units[i]);
            } else {
                unassigned.push(units[i]);
            }
        }

        const unitGroups = [];
        if (active.length > 0) {
            const activeCards = [];
            const aLen = active.length;
            for (let i = 0; i < aLen; i += 1) {
                const u = active[i];
                const card = buildTricycleCard(u, {
                    mode: "operator",
                    onClick: function () {
                        pushPage(renderManageUnitPage, {
                            tricycleId: u.Tricycle_ID,
                            bodyNumber: u.Body_Number,
                            ownerFirstName: u.Owner_First_Name,
                            ownerId: memberId
                        });
                    }
                });
                activeCards.push(card);
            }
            const activeStack = trCardStack({
                heading: "With active shift drivers (" + active.length + ")",
                cards: activeCards
            });
            unitGroups.push(activeStack);
        }

        if (unassigned.length > 0) {
            const unassignedCards = [];
            const uLen = unassigned.length;
            for (let i = 0; i < uLen; i += 1) {
                const u = unassigned[i];
                const card = buildTricycleCard(u, {
                    mode: "operator",
                    onClick: function () {
                        pushPage(renderManageUnitPage, {
                            tricycleId: u.Tricycle_ID,
                            bodyNumber: u.Body_Number,
                            ownerFirstName: u.Owner_First_Name,
                            ownerId: memberId
                        });
                    }
                });
                unassignedCards.push(card);
            }
            const unStack = trCardStack({
                heading: "Unassigned (" + unassigned.length + ")",
                cards: unassignedCards
            });
            unitGroups.push(unStack);
        }

        if (ownedCount === 0) {
            const emptyNode = trEmptyState({
                icon: "\uE7EC",
                title: "No tricycle units yet",
                subtitle: "Tap + to register your first tricycle unit (up to " + UNIT_PAGE_MAX_UNITS + ")."
            });
            const emptySec = trSection(emptyNode, { flex: true });
            main.appendChild(emptySec);
        } else {
            const listSec = trSection(unitGroups);
            main.appendChild(listSec);
        }
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load units",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

/* driver assignment create and edit sheets */

// params: unit (required), onSaved (required)
function openCreateAssignmentSheet(unit, onSaved) {
    let sheetCtrl = null;
    let selectedDriver = null;

    const asnIdRow = trPropertyRow({
        label: "Assignment ID (Optional)",
        input: { placeholder: "Auto or e.g. ASN-06", maxLength: UNIT_PAGE_ID_MAX }
    });
    const driverRow = trPropertyRow({
        label: "Licensed Driver",
        value: "Tap to pick licensed driver"
    });
    trBindTap(driverRow, function () {
        openDriverPicker({
            allowClear: false,
            onSelect: function (member) {
                if (!member) {
                    return;
                }
                selectedDriver = member;
                const fullName = formatFullName(member.First_Name, member.Last_Name);
                const valEl = driverRow.querySelector("p");
                if (valEl) {
                    valEl.textContent = fullName + " (" + member.Member_ID + ")";
                }
                driverRow.setError("");
            }
        });
    });

    // based on final_dbms1_active-baseline-and-naga-city-rules.md, DRIVER_ASSIGNMENT, use radio rows to select primary or alternate shift role
    const roleRadio = trRadioGroup({
        name: "create-shift-role",
        label: "Driver Role",
        value: "Primary",
        items: [
            { value: "Primary", title: "Primary driver", subtitle: "Main regular shift driver for this tricycle." },
            { value: "Alternate", title: "Alternate (Relyebo)", subtitle: "Reliever or weekend/extra shift driver." }
        ]
    });

    const shiftRow = trPropertyRow({
        label: "Shift Schedule",
        input: { placeholder: "e.g. Mon-Sat 06:00-18:00", maxLength: 50 }
    });
    const dateRow = trPropertyRow({
        label: "Date Assigned",
        input: { value: getTodayIsoString(), placeholder: "YYYY-MM-DD", maxLength: UNIT_PAGE_DATE_MAX }
    });
    const statusOptions = buildSelectOptions(ASSIGNMENT_STATUSES);
    const statusRow = trPropertyRow({
        label: "Shift Status",
        select: { value: "Active", options: statusOptions }
    });

    const detailCard = trListCard([asnIdRow, driverRow, shiftRow, dateRow, statusRow]);
    const roleGroup = trCardGroup({
        headline: "Driver role",
        card: roleRadio
    });

    const sheetErrEl = trEl("p", "as-tertiary as-critical hidden");
    sheetErrEl.setAttribute("role", "alert");

    const saveBtn = trButton({
        label: "Assign shift driver",
        variant: "primary",
        onClick: async function () {
            const asnId = asnIdRow.controlEl.value.trim();
            const shiftSched = shiftRow.controlEl.value.trim();
            const dateVal = dateRow.controlEl.value.trim();
            const statusVal = statusRow.controlEl.value;
            const roleVal = roleRadio.getValue() || "Primary";

            let valid = true;
            let firstBadRow = null;
            driverRow.setError("");
            shiftRow.setError("");
            dateRow.setError("");
            sheetErrEl.textContent = "";
            sheetErrEl.classList.add("hidden");

            if (!selectedDriver) {
                driverRow.setError("Pick a licensed driver.");
                firstBadRow = firstBadRow || driverRow;
                valid = false;
            }
            if (!shiftSched) {
                shiftRow.setError("Enter the shift schedule.");
                firstBadRow = firstBadRow || shiftRow;
                valid = false;
            }
            if (!isValidIsoDate(dateVal)) {
                dateRow.setError("Use YYYY-MM-DD date format.");
                firstBadRow = firstBadRow || dateRow;
                valid = false;
            }
            if (!valid) {
                sheetErrEl.textContent = "Fix the highlighted fields above before saving.";
                sheetErrEl.classList.remove("hidden");
                if (firstBadRow && typeof firstBadRow.scrollIntoView === "function") {
                    firstBadRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
                return;
            }

            saveBtn.disabled = true;
            saveBtn.classList.add("disabled");
            saveBtn.textContent = "Saving...";

            try {
                await apiCreateAssignment({
                    Assignment_ID: asnId,
                    Member_ID: selectedDriver.Member_ID,
                    Tricycle_ID: unit.Tricycle_ID,
                    Driver_Role: roleVal,
                    Shift_Schedule: shiftSched,
                    Date_Assigned: dateVal,
                    Status: statusVal
                });
                if (sheetCtrl) {
                    sheetCtrl.close();
                }
                if (onSaved) {
                    onSaved();
                }
            } catch (err) {
                saveBtn.disabled = false;
                saveBtn.classList.remove("disabled");
                saveBtn.textContent = "Assign shift driver";
                shiftRow.setError(err.message);
                sheetErrEl.textContent = err.message;
                sheetErrEl.classList.remove("hidden");
            }
        }
    });

    const cancelBtn = trButton({
        label: "Cancel",
        onClick: function () {
            if (sheetCtrl) {
                sheetCtrl.close();
            }
        }
    });

    sheetCtrl = trSheet({
        title: "Assign shift driver",
        description: "Add a Primary or Alternate (relyebo) shift for unit " + unit.Body_Number + ".",
        body: [detailCard, roleGroup],
        footer: [sheetErrEl, saveBtn, cancelBtn],
        removeOnClose: true
    });
    sheetCtrl.open();
}

// params: assignment (required), unit (required), canWrite (required), onSaved (required)
function openEditAssignmentSheet(assignment, unit, canWrite, onSaved) {
    let sheetCtrl = null;
    const driverName = formatFullName(assignment.First_Name, assignment.Last_Name);

    if (!canWrite) {
        const readCard = trListCard([
            trPropertyRow({ label: "Assignment ID", value: assignment.Assignment_ID }),
            trPropertyRow({ label: "Driver", value: driverName + " (" + assignment.Member_ID + ")" }),
            trPropertyRow({ label: "Driver Role", value: assignment.Driver_Role }),
            trPropertyRow({ label: "Shift Schedule", value: assignment.Shift_Schedule }),
            trPropertyRow({ label: "Date Assigned", value: assignment.Date_Assigned }),
            trPropertyRow({ label: "Status", value: assignment.Status })
        ]);
        const closeBtn = trButton({
            label: "Close",
            onClick: function () {
                if (sheetCtrl) {
                    sheetCtrl.close();
                }
            }
        });
        sheetCtrl = trSheet({
            title: "Shift details",
            description: "Unit " + unit.Body_Number + " · view-only access.",
            body: [readCard],
            footer: [closeBtn],
            removeOnClose: true
        });
        sheetCtrl.open();
        return;
    }

    let chosenMemberId = assignment.Member_ID;
    const idRow = trPropertyRow({ label: "Assignment ID", value: assignment.Assignment_ID });
    const driverRow = trPropertyRow({
        label: "Licensed Driver",
        value: driverName + " (" + assignment.Member_ID + ")"
    });
    trBindTap(driverRow, function () {
        openDriverPicker({
            allowClear: false,
            onSelect: function (member) {
                if (!member) {
                    return;
                }
                chosenMemberId = member.Member_ID;
                const nextName = formatFullName(member.First_Name, member.Last_Name);
                const valEl = driverRow.querySelector("p");
                if (valEl) {
                    valEl.textContent = nextName + " (" + member.Member_ID + ")";
                }
            }
        });
    });

    const roleRadio = trRadioGroup({
        name: "edit-shift-role",
        label: "Driver Role",
        value: assignment.Driver_Role,
        items: [
            { value: "Primary", title: "Primary driver", subtitle: "Main regular shift driver." },
            { value: "Alternate", title: "Alternate (Relyebo)", subtitle: "Reliever or extra shift driver." }
        ]
    });

    const shiftRow = trPropertyRow({
        label: "Shift Schedule",
        input: { value: assignment.Shift_Schedule, maxLength: 50 }
    });
    const dateRow = trPropertyRow({
        label: "Date Assigned",
        input: { value: assignment.Date_Assigned, placeholder: "YYYY-MM-DD", maxLength: UNIT_PAGE_DATE_MAX }
    });
    const statusOptions = buildSelectOptions(ASSIGNMENT_STATUSES);
    const statusRow = trPropertyRow({
        label: "Shift Status",
        select: { value: assignment.Status, options: statusOptions }
    });

    const detailCard = trListCard([idRow, driverRow, shiftRow, dateRow, statusRow]);
    const roleGroup = trCardGroup({
        headline: "Driver role",
        card: roleRadio
    });

    const sheetErrEl = trEl("p", "as-tertiary as-critical hidden");
    sheetErrEl.setAttribute("role", "alert");

    const saveBtn = trButton({
        label: "Save shift",
        variant: "primary",
        onClick: async function () {
            const shiftSched = shiftRow.controlEl.value.trim();
            const dateVal = dateRow.controlEl.value.trim();
            const statusVal = statusRow.controlEl.value;
            const roleVal = roleRadio.getValue() || assignment.Driver_Role;

            let valid = true;
            let firstBadRow = null;
            shiftRow.setError("");
            dateRow.setError("");
            sheetErrEl.textContent = "";
            sheetErrEl.classList.add("hidden");

            if (!shiftSched) {
                shiftRow.setError("Enter the shift schedule.");
                firstBadRow = firstBadRow || shiftRow;
                valid = false;
            }
            if (!isValidIsoDate(dateVal)) {
                dateRow.setError("Use YYYY-MM-DD date format.");
                firstBadRow = firstBadRow || dateRow;
                valid = false;
            }
            if (!valid) {
                sheetErrEl.textContent = "Fix the highlighted fields above before saving.";
                sheetErrEl.classList.remove("hidden");
                if (firstBadRow && typeof firstBadRow.scrollIntoView === "function") {
                    firstBadRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
                return;
            }

            saveBtn.disabled = true;
            saveBtn.classList.add("disabled");
            saveBtn.textContent = "Saving...";

            try {
                await apiUpdateAssignment(assignment.Assignment_ID, {
                    Member_ID: chosenMemberId,
                    Tricycle_ID: unit.Tricycle_ID,
                    Driver_Role: roleVal,
                    Shift_Schedule: shiftSched,
                    Date_Assigned: dateVal,
                    Status: statusVal
                });
                if (sheetCtrl) {
                    sheetCtrl.close();
                }
                if (onSaved) {
                    onSaved();
                }
            } catch (err) {
                saveBtn.disabled = false;
                saveBtn.classList.remove("disabled");
                saveBtn.textContent = "Save shift";
                shiftRow.setError(err.message);
                sheetErrEl.textContent = err.message;
                sheetErrEl.classList.remove("hidden");
            }
        }
    });

    const deleteBtn = trButton({
        label: "Remove shift",
        critical: true,
        onClick: function () {
            if (sheetCtrl) {
                sheetCtrl.close();
            }
            trConfirm({
                title: "Remove shift " + assignment.Assignment_ID + "?",
                message: "Remove " + driverName + " from unit " + unit.Body_Number + "?",
                confirmLabel: "Remove shift",
                critical: true,
                onConfirm: async function () {
                    try {
                        await apiDeleteAssignment(assignment.Assignment_ID);
                        if (onSaved) {
                            onSaved();
                        }
                    } catch (err) {
                        trAlert({ title: "Cannot remove shift", message: err.message });
                    }
                }
            });
        }
    });

    const cancelBtn = trButton({
        label: "Cancel",
        onClick: function () {
            if (sheetCtrl) {
                sheetCtrl.close();
            }
        }
    });

    sheetCtrl = trSheet({
        title: "Edit shift assignment",
        description: "Unit " + unit.Body_Number + " · " + assignment.Assignment_ID,
        body: [detailCard, roleGroup],
        footer: [sheetErrEl, saveBtn, deleteBtn, cancelBtn],
        removeOnClose: true
    });
    sheetCtrl.open();
}

/* manage tricycle unit screen (keyed by Tricycle_ID) */

// params: params (required: { tricycleId, bodyNumber, ownerFirstName, ownerId })
function renderManageUnitPage(params) {
    const safeParams = params || {};
    const targetId = safeParams.tricycleId;
    const navBar = trNavBar({
        title: "Manage unit",
        subtitle: formatUnitSubtitle(safeParams.bodyNumber || targetId, safeParams.ownerFirstName, safeParams.ownerId),
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading unit...");
    main.appendChild(loadingText);

    const viewerId = getSessionMemberId();

    Promise.all([
        apiGetTricycle(targetId),
        apiHome(viewerId)
    ]).then(function (results) {
        const unit = results[0].tricycle;
        const viewerHome = results[1];
        const viewerRoles = viewerHome.roles || {};
        const isSecretary = Boolean(viewerRoles.isSecretary);
        const isOwner = Boolean(viewerHome.member && unit.Owner_Member_ID === viewerHome.member.Member_ID);
        const isSameTodaWriter = Boolean(viewerRoles.canWriteToda && unit.Owner_TODA_ID === viewerRoles.officerTodaId);
        const isSameTodaPres = Boolean(viewerRoles.isPresident && unit.Owner_TODA_ID === viewerRoles.officerTodaId);
        const canWrite = isSecretary || isOwner || isSameTodaWriter;
        const canDelete = isSecretary || isOwner || isSameTodaPres;

        main.replaceChildren();

        const triIdRow = trPropertyRow({ label: "Tricycle ID", value: unit.Tricycle_ID });
        const bodyRow = trPropertyRow({
            label: "Body Number",
            input: { value: unit.Body_Number, maxLength: UNIT_PAGE_BODY_MAX, readOnly: !canWrite }
        });
        const plateRow = trPropertyRow({
            label: "Plate Number",
            input: { value: unit.Plate_Number, maxLength: 15, readOnly: !canWrite }
        });
        const franRow = trPropertyRow({
            label: "Franchise Number",
            input: { value: unit.Franchise_Number, maxLength: 25, readOnly: !canWrite }
        });
        const chassisRow = trPropertyRow({
            label: "Chassis Number",
            input: { value: unit.Chassis_Number, maxLength: 30, readOnly: !canWrite }
        });
        const franExpRow = trPropertyRow({
            label: "Franchise Expiry Date",
            input: { value: unit.Franchise_Expiry_Date, placeholder: "YYYY-MM-DD", maxLength: UNIT_PAGE_DATE_MAX, readOnly: !canWrite }
        });
        const mayorsExpRow = trPropertyRow({
            label: "Mayor's Permit Expiry",
            input: { value: unit.Mayors_Permit_Expiry, placeholder: "YYYY-MM-DD", maxLength: UNIT_PAGE_DATE_MAX, readOnly: !canWrite }
        });
        const orCrExpRow = trPropertyRow({
            label: "OR/CR Expiry",
            input: { value: unit.OR_CR_Expiry, placeholder: "YYYY-MM-DD", maxLength: UNIT_PAGE_DATE_MAX, readOnly: !canWrite }
        });
        const statusOptions = buildSelectOptions(FRANCHISE_STATUSES);
        const statusRow = trPropertyRow({
            label: "Franchise Status",
            select: { value: unit.Franchise_Status || "Active", options: statusOptions, disabled: !canWrite }
        });
        const zoneOptions = buildSelectOptions(COLOR_ZONES, "None");
        const zoneRow = trPropertyRow({
            label: "Color Zone",
            select: { value: unit.Color_Zone || "", options: zoneOptions, disabled: !canWrite }
        });
        // based on final_dbms1_relational-model.md, RA 10173, allow ownership transfer so retiring operator can reassign unit before account erasure
        const ownerRow = trPropertyRow({
            label: "Owner Member ID",
            input: { value: unit.Owner_Member_ID, maxLength: UNIT_PAGE_ID_MAX, readOnly: !canWrite }
        });

        const navActions = [];
        if (canWrite) {
            const doneBtn = trButton({
                label: "Done",
                small: true,
                onClick: async function () {
                    const bodyNum = bodyRow.controlEl.value.trim();
                    const plate = plateRow.controlEl.value.trim();
                    const fran = franRow.controlEl.value.trim();
                    const chas = chassisRow.controlEl.value.trim();
                    const franExp = franExpRow.controlEl.value.trim();
                    const mayorsExp = mayorsExpRow.controlEl.value.trim();
                    const orCrExp = orCrExpRow.controlEl.value.trim();
                    const franStatus = statusRow.controlEl.value;
                    const colorZone = zoneRow.controlEl.value;
                    const ownerIdVal = ownerRow.controlEl.value.trim();

                    let valid = true;
                    bodyRow.setError("");
                    plateRow.setError("");
                    franRow.setError("");
                    chassisRow.setError("");
                    franExpRow.setError("");
                    mayorsExpRow.setError("");
                    orCrExpRow.setError("");
                    ownerRow.setError("");

                    if (!bodyNum) {
                        bodyRow.setError("Enter a body number.");
                        valid = false;
                    }
                    if (!plate) {
                        plateRow.setError("Enter a plate number.");
                        valid = false;
                    }
                    if (!fran) {
                        franRow.setError("Enter a franchise number.");
                        valid = false;
                    }
                    if (!chas) {
                        chassisRow.setError("Enter a chassis number.");
                        valid = false;
                    }
                    if (!isValidIsoDate(franExp)) {
                        franExpRow.setError("Use YYYY-MM-DD date format.");
                        valid = false;
                    }
                    if (!isValidIsoDate(mayorsExp)) {
                        mayorsExpRow.setError("Use YYYY-MM-DD date format.");
                        valid = false;
                    }
                    if (!isValidIsoDate(orCrExp)) {
                        orCrExpRow.setError("Use YYYY-MM-DD date format.");
                        valid = false;
                    }
                    if (!ownerIdVal) {
                        ownerRow.setError("Enter the owner's Member ID.");
                        valid = false;
                    }
                    if (!valid) {
                        return;
                    }

                    doneBtn.disabled = true;
                    doneBtn.classList.add("disabled");
                    doneBtn.textContent = "Saving...";

                    try {
                        await apiUpdateTricycle(unit.Tricycle_ID, {
                            Body_Number: bodyNum,
                            Plate_Number: plate,
                            Franchise_Number: fran,
                            Chassis_Number: chas,
                            Franchise_Expiry_Date: franExp,
                            Mayors_Permit_Expiry: mayorsExp,
                            Franchise_Status: franStatus,
                            OR_CR_Expiry: orCrExp,
                            Color_Zone: colorZone || null,
                            Owner_Member_ID: ownerIdVal
                        });
                        popPage();
                    } catch (err) {
                        doneBtn.disabled = false;
                        doneBtn.classList.remove("disabled");
                        doneBtn.textContent = "Done";
                        if (err.message.toLowerCase().indexOf("owner") !== -1 || err.message.toLowerCase().indexOf("cap") !== -1) {
                            ownerRow.setError(err.message);
                        } else {
                            bodyRow.setError(err.message);
                        }
                    }
                }
            });
            navActions.push(doneBtn);
        }

        const updatedNav = trNavBar({
            title: "Manage unit",
            subtitle: formatUnitSubtitle(unit.Body_Number, unit.Owner_First_Name, unit.Owner_Member_ID),
            onBack: popPage,
            actions: navActions
        });
        navBar.replaceWith(updatedNav);

        const regCard = trListCard([triIdRow, bodyRow, plateRow, franRow, chassisRow, zoneRow, statusRow, ownerRow]);
        const regGroup = trCardGroup({
            headline: "Tricycle registration",
            card: regCard,
            footnote: "Tricycle ID stays fixed even if body placard or motor identifiers update."
        });

        const permitCard = trListCard([franExpRow, mayorsExpRow, orCrExpRow]);
        const permitGroup = trCardGroup({
            headline: "Permit & compliance expiry",
            card: permitCard,
            footnote: "All dates use YYYY-MM-DD format."
        });

        const detailsSec = trSection([regGroup, permitGroup]);
        main.appendChild(detailsSec);

        // based on final_dbms1_relational-model.md, DRIVER_ASSIGNMENT, display primary and alternate shift assignments with external assign button
        const shifts = unit.assignments || [];
        const shiftSectionItems = [];
        if (shifts.length === 0) {
            const emptyItem = trListItem({
                title: "No shift drivers assigned",
                subtitle: "Assign a Primary or Alternate (relyebo) licensed driver below."
            });
            const emptyShiftCard = trListCard([emptyItem]);
            const emptyShiftGroup = trCardGroup({
                headline: "Shift drivers",
                card: emptyShiftCard,
                footnote: "Licensed members can share shifts across Primary and Alternate schedules."
            });
            shiftSectionItems.push(emptyShiftGroup);
        } else {
            const shiftRows = [];
            const sLen = shifts.length;
            for (let i = 0; i < sLen; i += 1) {
                const sh = shifts[i];
                const drvName = formatFullName(sh.First_Name, sh.Last_Name);
                const subLine = sh.Driver_Role + " · " + sh.Shift_Schedule + " · " + sh.Status + " (" + sh.Date_Assigned + ")";
                const row = trActionRow({
                    label: drvName + " (" + sh.Member_ID + ")",
                    subtitle: subLine,
                    onClick: function () {
                        openEditAssignmentSheet(sh, unit, canWrite, refreshPage);
                    }
                });
                shiftRows.push(row);
            }
            const shiftCard = trListCard(shiftRows);
            const shiftGroup = trCardGroup({
                headline: "Shift drivers (" + shifts.length + ")",
                card: shiftCard,
                footnote: "Tap a shift row to update role, schedule, status, or remove it."
            });
            shiftSectionItems.push(shiftGroup);
        }

        if (canWrite) {
            const assignBtn = trButton({
                label: "Assign shift driver",
                onClick: function () {
                    openCreateAssignmentSheet(unit, refreshPage);
                }
            });
            shiftSectionItems.push(assignBtn);
        }

        const shiftSec = trSection(shiftSectionItems);
        main.appendChild(shiftSec);

        if (canDelete) {
            const shiftCount = shifts.length;
            const removeUnitRow = trActionRow({
                label: "Remove tricycle " + unit.Body_Number,
                critical: true,
                hideChevron: true,
                onClick: function () {
                    let confirmMsg = "This unit will be permanently removed from the registry.";
                    if (shiftCount > 0) {
                        confirmMsg = "This permanently deletes unit " + unit.Body_Number + " and cascade-deletes its " + shiftCount + " shift assignment(s).";
                    }
                    trConfirm({
                        title: "Remove tricycle " + unit.Body_Number + "?",
                        message: confirmMsg,
                        confirmLabel: "Remove tricycle",
                        critical: true,
                        onConfirm: async function () {
                            try {
                                await apiDeleteTricycle(unit.Tricycle_ID);
                                popPage();
                            } catch (err) {
                                trAlert({ title: "Error", message: err.message });
                            }
                        }
                    });
                }
            });
            const dangerCard = trCard([removeUnitRow]);
            const dangerGroup = trCardGroup({
                headline: "Danger zone",
                card: dangerCard,
                footnote: "Deleting this tricycle automatically removes its linked shift assignments."
            });
            const dangerSec = trSection(dangerGroup);
            main.appendChild(dangerSec);
        }
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load unit",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

/* units roster with search, color zone, status, and toda filters */

// params: params (optional: { scopeTodaId, scopeTodaName })
function renderUnitsPage(params) {
    const safeParams = params || {};
    const scopeTodaId = safeParams.scopeTodaId || null;
    const pageTitle = scopeTodaId ? "TODA units" : "All units";
    let filterTodaId = scopeTodaId || "all";
    let filterZone = "all";
    let filterStatus = "all";
    let searchQuery = "";

    const navBar = trNavBar({
        title: pageTitle,
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const searchRow = trEl("div", "hbox space-l");
    const searchBox = trSearchBox({
        placeholder: "Find by body, plate, or franchise",
        onInput: function (val) {
            searchQuery = val.trim();
            loadUnits();
        }
    });
    searchBox.classList.add("flex1");
    searchRow.appendChild(searchBox);

    const filterSlot = trEl("div", "hbox");
    searchRow.appendChild(filterSlot);

    const listWrap = trEl("div", "card-grid vbox flex1 space-l");

    async function loadUnits() {
        listWrap.replaceChildren();
        const loadingText = trEl("p", "as-tertiary as-gray", "Loading units...");
        listWrap.appendChild(loadingText);

        try {
            const unitsRes = await apiListTricycles({
                todaId: filterTodaId,
                colorZone: filterZone,
                status: filterStatus,
                q: searchQuery
            });
            const units = unitsRes.tricycles || [];

            listWrap.replaceChildren();
            if (units.length === 0) {
                let emptySub = "Add tricycles from a member's profile or Operator desk.";
                if (searchQuery || filterZone !== "all" || filterStatus !== "all") {
                    emptySub = "Try another search query or filter.";
                }
                const emptyNode = trEmptyState({
                    icon: "\uE7EC",
                    title: "No tricycle units found",
                    subtitle: emptySub
                });
                listWrap.appendChild(emptyNode);
                return;
            }

            const groupsByOwner = {};
            const ownerOrder = [];
            const unitLen = units.length;
            for (let i = 0; i < unitLen; i += 1) {
                const u = units[i];
                const ownerId = u.Owner_Member_ID;
                if (!groupsByOwner[ownerId]) {
                    const ownerName = formatFullName(u.Owner_First_Name, u.Owner_Last_Name) || ownerId;
                    groupsByOwner[ownerId] = {
                        ownerId: ownerId,
                        ownerName: ownerName,
                        units: []
                    };
                    ownerOrder.push(groupsByOwner[ownerId]);
                }
                groupsByOwner[ownerId].units.push(u);
            }

            ownerOrder.sort(function (a, b) {
                return a.ownerName.localeCompare(b.ownerName);
            });

            const grpLen = ownerOrder.length;
            for (let g = 0; g < grpLen; g += 1) {
                const group = ownerOrder[g];
                const unitWord = pluralLabel(group.units.length, "unit", "units");

                const groupCards = [];
                const gUnitsLen = group.units.length;
                for (let j = 0; j < gUnitsLen; j += 1) {
                    const u = group.units[j];
                    const card = buildTricycleCard(u, {
                        mode: "unit",
                        onClick: function () {
                            pushPage(renderManageUnitPage, {
                                tricycleId: u.Tricycle_ID,
                                bodyNumber: u.Body_Number,
                                ownerFirstName: u.Owner_First_Name,
                                ownerId: u.Owner_Member_ID
                            });
                        }
                    });
                    groupCards.push(card);
                }

                const stack = trCardStack({
                    heading: group.ownerName + " · " + group.units.length + " " + unitWord,
                    cards: groupCards
                });
                listWrap.appendChild(stack);
            }
        } catch (err) {
            listWrap.replaceChildren();
            const errEmpty = trEmptyState({
                icon: "\uE783",
                title: "Could not load units",
                subtitle: err.message
            });
            listWrap.appendChild(errEmpty);
        }
    }

    async function setupFilterMenu() {
        const sections = [];

        if (!scopeTodaId) {
            try {
                const todaRes = await apiListTodas();
                const todas = todaRes.todas || [];
                const todaItems = [{ label: "All TODAs", value: "all", checked: true }];
                const tLen = todas.length;
                for (let i = 0; i < tLen; i += 1) {
                    todaItems.push({ label: todas[i].TODA_Name, value: todas[i].TODA_ID });
                }
                sections.push({
                    title: "Filter by TODA",
                    name: "unit-toda",
                    items: todaItems,
                    onChange: function (val) {
                        filterTodaId = val;
                        loadUnits();
                    }
                });
            } catch (err) {
                /* ignore if non-secretary */
            }
        }

        const statusItems = [{ label: "All statuses", value: "all", checked: true }];
        const stLen = FRANCHISE_STATUSES.length;
        for (let i = 0; i < stLen; i += 1) {
            statusItems.push({ label: FRANCHISE_STATUSES[i], value: FRANCHISE_STATUSES[i] });
        }
        sections.push({
            title: "Franchise status",
            name: "unit-status",
            items: statusItems,
            onChange: function (val) {
                filterStatus = val;
                loadUnits();
            }
        });

        const zoneItems = [
            { label: "All zones", value: "all", checked: true },
            { label: "No zone", value: "none" }
        ];
        const zLen = COLOR_ZONES.length;
        for (let i = 0; i < zLen; i += 1) {
            zoneItems.push({ label: COLOR_ZONES[i], value: COLOR_ZONES[i] });
        }
        sections.push({
            title: "Color zone",
            name: "unit-zone",
            items: zoneItems,
            onChange: function (val) {
                filterZone = val;
                loadUnits();
            }
        });

        const menu = trMenu({ icon: "\uE71C", label: "Filter units", sections: sections });
        filterSlot.replaceChildren();
        filterSlot.appendChild(menu);
    }

    setupFilterMenu();
    loadUnits();

    const listSec = trSection([searchRow, listWrap], { flex: true });
    main.appendChild(listSec);
    return [navBar, main];
}

/* register tricycle unit screen */

// params: params (optional: { ownerId, ownerName, ownerFirstName })
function renderAddMyUnitPage(params) {
    const safeParams = params || {};
    const ownerId = safeParams.ownerId || getSessionMemberId();
    const isSelf = ownerId === getSessionMemberId();
    let firstOwnerName = safeParams.ownerFirstName || "this member";
    if (!safeParams.ownerFirstName && safeParams.ownerName) {
        const nameParts = safeParams.ownerName.split(" ");
        firstOwnerName = nameParts[0];
    }
    let ownerSubtitle = "for " + firstOwnerName;
    if (isSelf) {
        ownerSubtitle = "for your units";
    }

    const triIdRow = trPropertyRow({
        label: "Tricycle ID (Optional)",
        input: { placeholder: "Auto or e.g. TRI-006", maxLength: UNIT_PAGE_ID_MAX }
    });
    const bodyRow = trPropertyRow({
        label: "Body Number",
        input: { placeholder: "e.g. 0227 or 013-STF", maxLength: UNIT_PAGE_BODY_MAX }
    });
    const plateRow = trPropertyRow({
        label: "Plate Number",
        input: { placeholder: "e.g. EAB-1006", maxLength: 15 }
    });
    const franRow = trPropertyRow({
        label: "Franchise Number",
        input: { placeholder: "e.g. FRAN-2026-0227", maxLength: 25 }
    });
    const chasRow = trPropertyRow({
        label: "Chassis Number",
        input: { placeholder: "e.g. CHS-TMX-1006", maxLength: 30 }
    });
    const franExpRow = trPropertyRow({
        label: "Franchise Expiry Date",
        input: { placeholder: "YYYY-MM-DD", maxLength: UNIT_PAGE_DATE_MAX }
    });
    const mayorsExpRow = trPropertyRow({
        label: "Mayor's Permit Expiry",
        input: { placeholder: "YYYY-MM-DD", maxLength: UNIT_PAGE_DATE_MAX }
    });
    const orCrExpRow = trPropertyRow({
        label: "OR/CR Expiry",
        input: { placeholder: "YYYY-MM-DD", maxLength: UNIT_PAGE_DATE_MAX }
    });
    const statusOptions = buildSelectOptions(FRANCHISE_STATUSES);
    const statusRow = trPropertyRow({
        label: "Franchise Status",
        select: { value: "Active", options: statusOptions }
    });
    const zoneOptions = buildSelectOptions(COLOR_ZONES, "None");
    const zoneRow = trPropertyRow({
        label: "Color Zone",
        select: { value: "", options: zoneOptions }
    });

    const saveBtn = trButton({
        label: "Done",
        small: true,
        onClick: async function () {
            const triId = triIdRow.controlEl.value.trim();
            const bodyNum = bodyRow.controlEl.value.trim();
            const plate = plateRow.controlEl.value.trim();
            const fran = franRow.controlEl.value.trim();
            const chas = chasRow.controlEl.value.trim();
            const franExp = franExpRow.controlEl.value.trim();
            const mayorsExp = mayorsExpRow.controlEl.value.trim();
            const orCrExp = orCrExpRow.controlEl.value.trim();
            const franStatus = statusRow.controlEl.value;
            const colorZone = zoneRow.controlEl.value;

            let valid = true;
            bodyRow.setError("");
            plateRow.setError("");
            franRow.setError("");
            chasRow.setError("");
            franExpRow.setError("");
            mayorsExpRow.setError("");
            orCrExpRow.setError("");

            if (!bodyNum) {
                bodyRow.setError("Enter a body number.");
                valid = false;
            }
            if (!plate) {
                plateRow.setError("Enter a plate number.");
                valid = false;
            }
            if (!fran) {
                franRow.setError("Enter a franchise number.");
                valid = false;
            }
            if (!chas) {
                chasRow.setError("Enter a chassis number.");
                valid = false;
            }
            if (!isValidIsoDate(franExp)) {
                franExpRow.setError("Use YYYY-MM-DD date format.");
                valid = false;
            }
            if (!isValidIsoDate(mayorsExp)) {
                mayorsExpRow.setError("Use YYYY-MM-DD date format.");
                valid = false;
            }
            if (!isValidIsoDate(orCrExp)) {
                orCrExpRow.setError("Use YYYY-MM-DD date format.");
                valid = false;
            }
            if (!valid) {
                return;
            }

            saveBtn.disabled = true;
            saveBtn.classList.add("disabled");
            saveBtn.textContent = "Saving...";

            try {
                const res = await apiCreateTricycle({
                    Tricycle_ID: triId,
                    Body_Number: bodyNum,
                    Plate_Number: plate,
                    Franchise_Number: fran,
                    Chassis_Number: chas,
                    Franchise_Expiry_Date: franExp,
                    Mayors_Permit_Expiry: mayorsExp,
                    Franchise_Status: franStatus,
                    OR_CR_Expiry: orCrExp,
                    Color_Zone: colorZone || null,
                    Owner_Member_ID: ownerId
                });
                const createdId = res.Tricycle_ID;
                const ownerLabel = isSelf ? "you" : (safeParams.ownerName || ownerId);
                const previewCard = trBrandCard({
                    subtext: isSelf ? "OPERATOR" : "UNIT",
                    topRight: colorZone || undefined,
                    title: bodyNum,
                    subtitle: "from " + ownerLabel,
                    bottomRight: "No active driver"
                });
                presentSuccessScreen({
                    title: "Tricycle added",
                    subtitle: "Unit " + bodyNum + " (" + createdId + ") is now registered.",
                    card: previewCard,
                    buttonLabel: "Manage unit",
                    onDone: function () {
                        replaceTopPage(renderManageUnitPage, {
                            tricycleId: createdId,
                            bodyNumber: bodyNum,
                            ownerFirstName: firstOwnerName,
                            ownerId: ownerId
                        });
                    }
                });
            } catch (err) {
                saveBtn.disabled = false;
                saveBtn.classList.remove("disabled");
                saveBtn.textContent = "Done";
                if (err.message.toLowerCase().indexOf("at most 5") !== -1) {
                    trAlert({
                        title: "Tricycle limit reached",
                        message: "This operator already owns " + UNIT_PAGE_MAX_UNITS + " tricycles, which is the maximum allowed."
                    });
                } else {
                    bodyRow.setError(err.message);
                }
            }
        }
    });

    const navBar = trNavBar({
        title: isSelf ? "Add my tricycle" : "Add tricycle",
        subtitle: isSelf ? undefined : ownerSubtitle,
        onBack: popPage,
        actions: [saveBtn]
    });

    const main = trEl("main", "content vbox space-xl");
    const regFields = [];
    if (!isSelf && safeParams.ownerName) {
        const lockedRow = trPropertyRow({
            label: "Operator (Locked)",
            value: safeParams.ownerName + " (" + ownerId + ")"
        });
        regFields.push(lockedRow);
    }
    regFields.push(triIdRow, bodyRow, plateRow, franRow, chasRow, zoneRow, statusRow);

    const regCard = trListCard(regFields);
    const regGroup = trCardGroup({
        headline: "Unit registration",
        card: regCard,
        footnote: "Operators can register up to " + UNIT_PAGE_MAX_UNITS + " tricycles. Assign shift drivers after registration."
    });

    const permitCard = trListCard([franExpRow, mayorsExpRow, orCrExpRow]);
    const permitGroup = trCardGroup({
        headline: "Permit & compliance expiry",
        card: permitCard,
        footnote: "Enter dates using YYYY-MM-DD format."
    });

    const formSec = trSection([regGroup, permitGroup]);
    main.appendChild(formSec);
    return [navBar, main];
}
