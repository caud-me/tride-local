/* operator units, manage unit, units list, and add tricycle screens */

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

function renderOperatorUnitsPage() {
    const memberId = getSessionMemberId();
    let ownedCount = 0;
    let loaded = false;

    const addIcon = trIcon("\uE710", {
        label: "Add tricycle",
        onClick: function () {
            if (loaded && ownedCount >= 3) {
                trAlert({
                    title: "Tricycle limit reached",
                    message: "You already own 3 tricycles, which is the maximum allowed per operator."
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
    main.appendChild(trEl("p", "as-tertiary as-gray", "Loading units..."));

    apiListTricycles({ ownerId: memberId }).then(function (data) {
        main.replaceChildren();
        const units = data.tricycles || [];
        ownedCount = units.length;
        loaded = true;
        const active = [];
        const unassigned = [];

        for (let i = 0; i < units.length; i += 1) {
            if (units[i].Driver_Member_ID) {
                active.push(units[i]);
            } else {
                unassigned.push(units[i]);
            }
        }

        const unitGroups = [];
        if (active.length > 0) {
            const activeCards = [];
            for (let i = 0; i < active.length; i += 1) {
                const u = active[i];
                const card = buildTricycleCard(u, {
                    mode: "operator",
                    onClick: function () {
                        pushPage(renderManageUnitPage, {
                            bodyNumber: u.Body_Number,
                            ownerFirstName: u.Owner_First_Name,
                            ownerId: memberId
                        });
                    }
                });
                activeCards.push(card);
            }
            unitGroups.push(trCardStack({
                heading: "Actively used",
                cards: activeCards
            }));
        }

        if (unassigned.length > 0) {
            const unassignedCards = [];
            for (let i = 0; i < unassigned.length; i += 1) {
                const u = unassigned[i];
                const card = buildTricycleCard(u, {
                    mode: "operator",
                    onClick: function () {
                        pushPage(renderManageUnitPage, {
                            bodyNumber: u.Body_Number,
                            ownerFirstName: u.Owner_First_Name,
                            ownerId: memberId
                        });
                    }
                });
                unassignedCards.push(card);
            }
            unitGroups.push(trCardStack({
                heading: "Unassigned",
                cards: unassignedCards
            }));
        }

        if (units.length === 0) {
            main.appendChild(trSection(trEmptyState({
                icon: "\uE7EC",
                title: "No tricycle units yet",
                subtitle: "Tap + to register your first tricycle unit (up to 3)."
            }), { flex: true }));
        } else {
            main.appendChild(trSection(unitGroups));
        }
    }).catch(function (err) {
        main.replaceChildren();
        main.appendChild(trSection(trEmptyState({
            icon: "\uE783",
            title: "Could not load units",
            subtitle: err.message
        }), { flex: true }));
    });

    return [navBar, main];
}

function renderManageUnitPage(params) {
    const navBar = trNavBar({
        title: "Manage unit",
        subtitle: formatUnitSubtitle(params.bodyNumber, params.ownerFirstName, params.ownerId),
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    main.appendChild(trEl("p", "as-tertiary as-gray", "Loading unit..."));

    apiGetTricycle(params.bodyNumber).then(function (data) {
        const unit = data.tricycle;
        main.replaceChildren();

        const chassisRow = trPropertyRow({ label: "Chassis No.", input: { value: unit.Chassis_Number } });
        const franRow = trPropertyRow({ label: "Franchise No.", input: { value: unit.Franchise_Number } });

        const doneBtn = trButton({
            label: "Done",
            small: true,
            onClick: async function () {
                const chas = chassisRow.controlEl.value.trim();
                const fran = franRow.controlEl.value.trim();
                chassisRow.setError(chas ? "" : "Required");
                franRow.setError(fran ? "" : "Required");
                if (!chas || !fran) {
                    return;
                }
                try {
                    await apiUpdateTricycle(unit.Body_Number, {
                        Chassis_Number: chas,
                        Franchise_Number: fran
                    });
                    popPage();
                } catch (err) {
                    chassisRow.setError(err.message);
                }
            }
        });

        const updatedNav = trNavBar({
            title: "Manage unit",
            subtitle: formatUnitSubtitle(unit.Body_Number, unit.Owner_First_Name, unit.Owner_Member_ID),
            onBack: popPage,
            actions: [doneBtn]
        });
        navBar.replaceWith(updatedNav);

        const driverName = unit.Driver_Member_ID
            ? formatFullName(unit.Driver_First_Name, unit.Driver_Last_Name) + " (" + unit.Driver_Member_ID + ")"
            : "Tap to assign licensed driver";

        const driverRow = trPropertyRow({
            label: "Assigned driver",
            value: driverName
        });
        trBindTap(driverRow, function () {
            openDriverPicker({
                currentBodyNumber: unit.Body_Number,
                allowClear: false,
                onSelect: async function (candidate) {
                    if (!candidate) {
                        return;
                    }
                    try {
                        await apiUpdateTricycle(unit.Body_Number, { Driver_Member_ID: candidate.Member_ID });
                        refreshPage();
                    } catch (err) {
                        trAlert({ title: "Cannot assign driver", message: err.message });
                    }
                }
            });
        });

        const bodyRow = trPropertyRow({ label: "Body No.", value: unit.Body_Number });
        const detailRows = [driverRow, bodyRow, chassisRow, franRow];
        if (typeof appendExtraColumnRows === "function") {
            appendExtraColumnRows(detailRows, unit, [
                "Body_Number", "Chassis_Number", "Franchise_Number",
                "Owner_Member_ID", "Driver_Member_ID",
                "Owner_First_Name", "Owner_Last_Name", "Owner_TODA_ID",
                "Driver_First_Name", "Driver_Last_Name", "TODA_Name"
            ]);
        }
        const detailsCard = trListCard(detailRows);

        const removeDriverRow = trActionRow({
            label: "Remove driver",
            critical: true,
            disabled: !unit.Driver_Member_ID,
            hideChevron: true,
            onClick: function () {
                trConfirm({
                    title: "Remove driver?",
                    message: "Unassign driver from unit " + unit.Body_Number + "?",
                    confirmLabel: "Remove driver",
                    critical: true,
                    onConfirm: async function () {
                        try {
                            await apiUpdateTricycle(unit.Body_Number, { Driver_Member_ID: "" });
                            refreshPage();
                        } catch (err) {
                            trAlert({ title: "Error", message: err.message });
                        }
                    }
                });
            }
        });

        const hasDriver = Boolean(unit.Driver_Member_ID);
        const removeUnitRow = trActionRow({
            label: "Remove tricycle",
            critical: true,
            disabled: hasDriver,
            hideChevron: true,
            onClick: function () {
                trConfirm({
                    title: "Remove tricycle " + unit.Body_Number + "?",
                    message: "This unit will be permanently removed from your units.",
                    confirmLabel: "Remove tricycle",
                    critical: true,
                    onConfirm: async function () {
                        try {
                            await apiDeleteTricycle(unit.Body_Number);
                            popPage();
                        } catch (err) {
                            trAlert({ title: "Error", message: err.message });
                        }
                    }
                });
            }
        });

        const detailsGroup = trCardGroup({
            headline: "Tricycle details",
            card: detailsCard,
            footnote: "Tap the driver row to assign or switch who drives this unit."
        });
        const dangerCard = trListCard([removeDriverRow, removeUnitRow]);
        const dangerGroup = trCardGroup({
            headline: "Danger zone",
            card: dangerCard,
            footnote: hasDriver
                ? "Remove the assigned driver before deleting this tricycle."
                : "Removing this tricycle permanently deletes its registration."
        });
        trAppend(main, [trSection(detailsGroup), trSection(dangerGroup)]);
    }).catch(function (err) {
        main.replaceChildren();
        main.appendChild(trSection(trEmptyState({
            icon: "\uE783",
            title: "Could not load unit",
            subtitle: err.message
        }), { flex: true }));
    });

    return [navBar, main];
}

function renderUnitsPage(params) {
    const scopeTodaId = params.scopeTodaId || null;
    const pageTitle = scopeTodaId ? "Units" : "All units";
    let filterTodaId = scopeTodaId || "all";

    const navBar = trNavBar({
        title: pageTitle,
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const listWrap = trEl("div", "vbox flex1 space-l card-grid");

    async function loadUnits() {
        listWrap.replaceChildren();
        listWrap.appendChild(trEl("p", "as-tertiary as-gray", "Loading units..."));

        try {
            const unitsRes = await apiListTricycles({ todaId: filterTodaId });
            const units = unitsRes.tricycles || [];

            listWrap.replaceChildren();
            if (units.length === 0) {
                listWrap.appendChild(trEmptyState({
                    icon: "\uE7EC",
                    title: "No tricycle units yet",
                    subtitle: "Add tricycles from a member's profile or Operator desk."
                }));
                return;
            }

            const groupsByOwner = {};
            const ownerOrder = [];
            for (let i = 0; i < units.length; i += 1) {
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

            for (let g = 0; g < ownerOrder.length; g += 1) {
                const group = ownerOrder[g];
                const unitWord = pluralLabel(group.units.length, "unit", "units");

                const groupCards = [];
                for (let j = 0; j < group.units.length; j += 1) {
                    const u = group.units[j];
                    const card = buildTricycleCard(u, {
                        mode: "unit",
                        onClick: function () {
                            pushPage(renderManageUnitPage, {
                                bodyNumber: u.Body_Number,
                                ownerFirstName: u.Owner_First_Name,
                                ownerId: u.Owner_Member_ID
                            });
                        }
                    });
                    groupCards.push(card);
                }

                listWrap.appendChild(trCardStack({
                    heading: group.ownerName + " \u00B7 " + group.units.length + " " + unitWord,
                    cards: groupCards
                }));
            }
        } catch (err) {
            listWrap.replaceChildren();
            listWrap.appendChild(trEmptyState({
                icon: "\uE783",
                title: "Could not load units",
                subtitle: err.message
            }));
        }
    }

    if (!scopeTodaId) {
        apiListTodas().then(function (todaRes) {
            const todas = todaRes.todas || [];
            const todaItems = [{ label: "All TODAs", value: "all", checked: true }];
            for (let i = 0; i < todas.length; i += 1) {
                todaItems.push({ label: todas[i].TODA_Name, value: todas[i].TODA_ID });
            }
            const menu = trMenu({
                icon: "\uE71C",
                label: "Filter TODA",
                sections: [{
                    title: "Filter by TODA",
                    name: "unit-toda",
                    items: todaItems,
                    onChange: function (val) {
                        filterTodaId = val;
                        loadUnits();
                    }
                }]
            });
            const updatedNav = trNavBar({
                title: pageTitle,
                onBack: popPage,
                actions: [menu]
            });
            navBar.replaceWith(updatedNav);
        });
    }

    loadUnits();
    main.appendChild(trSection(listWrap, { flex: true }));
    return [navBar, main];
}

function buildDriverPickerField() {
    let selectedDriverId = null;
    const driverRow = trPropertyRow({
        label: "Assigned driver (Optional)",
        value: "None (Tap to assign licensed driver)"
    });
    trBindTap(driverRow, function () {
        openDriverPicker({
            currentBodyNumber: null,
            allowClear: true,
            onSelect: function (member) {
                const textEl = driverRow.querySelector("p");
                if (!member) {
                    selectedDriverId = null;
                    textEl.textContent = "None (Tap to assign licensed driver)";
                    return;
                }
                selectedDriverId = member.Member_ID;
                const fullName = formatFullName(member.First_Name, member.Last_Name);
                textEl.textContent = fullName + " (" + member.Member_ID + ")";
            }
        });
    });

    return {
        row: driverRow,
        getDriverId: function () {
            return selectedDriverId;
        }
    };
}

function renderAddMyUnitPage(params) {
    const ownerId = params.ownerId || getSessionMemberId();
    const isSelf = ownerId === getSessionMemberId();
    const firstOwnerName = params.ownerFirstName || (params.ownerName ? params.ownerName.split(" ")[0] : "this member");
    const ownerSubtitle = isSelf ? "for your units" : ("for " + firstOwnerName);

    const bodyRow = trPropertyRow({ label: "Body Number", input: { placeholder: "e.g. 0235" } });
    if (bodyRow.controlEl) {
        bodyRow.controlEl.maxLength = 4;
    }
    const chasRow = trPropertyRow({ label: "Chassis Number", input: { placeholder: "e.g. CH0008" } });
    const franRow = trPropertyRow({ label: "Franchise Number", input: { placeholder: "e.g. FR202604" } });
    const driverPicker = buildDriverPickerField();

    const saveBtn = trButton({
        label: "Done",
        small: true,
        onClick: async function () {
            const payload = {
                Body_Number: bodyRow.controlEl.value.trim(),
                Chassis_Number: chasRow.controlEl.value.trim(),
                Franchise_Number: franRow.controlEl.value.trim(),
                Owner_Member_ID: ownerId,
                Driver_Member_ID: driverPicker.getDriverId()
            };

            bodyRow.setError(payload.Body_Number ? "" : "Required");
            chasRow.setError(payload.Chassis_Number ? "" : "Required");
            franRow.setError(payload.Franchise_Number ? "" : "Required");
            driverPicker.row.setError("");

            if (!payload.Body_Number || !payload.Chassis_Number || !payload.Franchise_Number) {
                return;
            }

            if (payload.Body_Number.length > 4) {
                bodyRow.setError("Body number must be at most 4 characters.");
                return;
            }

            try {
                await apiCreateTricycle(payload);
                const ownerLabel = isSelf ? "you" : (params.ownerName || ownerId);
                const driverSummaryEl = driverPicker.row.querySelector("p");
                const hasDriver = Boolean(payload.Driver_Member_ID);
                const driverSummary = hasDriver && driverSummaryEl ? driverSummaryEl.textContent : "No driver";
                const previewCard = trBrandCard({
                    subtext: isSelf ? "OPERATOR" : "UNIT",
                    title: payload.Body_Number,
                    subtitle: "from " + ownerLabel,
                    bottomRight: driverSummary
                });
                presentSuccessScreen({
                    badge: "UNIT",
                    title: "Tricycle added",
                    subtitle: "Unit " + payload.Body_Number + " is now registered.",
                    card: previewCard,
                    buttonLabel: "Done",
                    onDone: popPage
                });
            } catch (err) {
                if (err.message.indexOf("maximum of 3") !== -1) {
                    trAlert({
                        title: "Tricycle limit reached",
                        message: "This operator already owns 3 tricycles, which is the maximum allowed."
                    });
                } else if (err.message.indexOf("driver") !== -1) {
                    driverPicker.row.setError(err.message);
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
    const fields = [];
    if (!isSelf && params.ownerName) {
        const lockedRow = trPropertyRow({
            label: "Operator (Locked)",
            value: params.ownerName + " (" + ownerId + ")"
        });
        fields.push(lockedRow);
    }
    fields.push(bodyRow, chasRow, franRow, driverPicker.row);
    main.appendChild(trSection(trCardGroup({
        headline: "Unit registration",
        card: trListCard(fields),
        footnote: "Operators can register up to 3 tricycles. Driver assignment is optional."
    })));

    return [navBar, main];
}
