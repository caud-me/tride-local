/* members list, member detail, and story-bar add member wizard */

function renderMembersPage(params) {
    const scopeTodaId = params.scopeTodaId || null;
    const scopeTodaName = params.scopeTodaName || null;
    const scopeSubtitle = scopeTodaId ? ("for " + (scopeTodaName || "your TODA")) : "for all TODAs";
    let searchQuery = "";
    let activeTab = params.activeTab || "all";
    const tabFilters = {
        all: {
            sortBy: "name",
            filterToda: scopeTodaId || "all",
            filterRole: "all"
        },
        norole: {
            sortBy: "name",
            filterToda: scopeTodaId || "all"
        }
    };

    const addIcon = trIcon("\uE710", {
        label: "Add member",
        onClick: function () {
            pushPage(renderAddMemberPage, { scopeTodaId: scopeTodaId, scopeTodaName: scopeTodaName });
        }
    });

    const navBar = trNavBar({
        title: scopeTodaId ? "Manage my members" : "Manage all members",
        onBack: popPage,
        actions: [addIcon]
    });

    const main = trEl("main", "content vbox space-xl");
    const searchRow = trEl("div", "hbox space-l");
    const searchBox = trSearchBox({
        placeholder: "Find a member",
        onInput: function (val) {
            searchQuery = val.trim();
            loadMembers();
        }
    });
    searchBox.classList.add("flex1");
    searchRow.appendChild(searchBox);

    const filterSlot = trEl("div", "hbox");
    searchRow.appendChild(filterSlot);

    let allMenu = null;
    let noRoleMenu = null;

    function syncFilterVisibility() {
        if (allMenu) {
            if (activeTab === "all") {
                allMenu.classList.remove("hidden");
            } else {
                allMenu.classList.add("hidden");
            }
        }
        if (noRoleMenu) {
            if (activeTab === "norole") {
                noRoleMenu.classList.remove("hidden");
            } else {
                noRoleMenu.classList.add("hidden");
            }
        }
    }

    const tabs = trTabs({
        equal: true,
        activeKey: activeTab,
        items: [
            { key: "all", label: "All" },
            { key: "norole", label: "No-role members" }
        ],
        onChange: function (nextKey, tabObj, direction) {
            activeTab = nextKey;
            params.activeTab = nextKey;
            syncFilterVisibility();
            loadMembers(direction);
        }
    });
    const listWrap = trEl("div", "vbox flex1 space-l");

    async function loadMembers(animDirection) {
        listWrap.replaceChildren();
        try {
            const activeCfg = activeTab === "norole" ? tabFilters.norole : tabFilters.all;
            const effectiveRole = activeTab === "norole" ? "none" : tabFilters.all.filterRole;
            const res = await apiListMembers({
                todaId: activeCfg.filterToda,
                q: searchQuery,
                sort: activeCfg.sortBy,
                role: effectiveRole
            });
            const members = res.members || [];
            if (members.length === 0) {
                listWrap.appendChild(trEmptyState({
                    icon: "\uE716",
                    title: "No members found",
                    subtitle: searchQuery ? "Try a different name or Member ID." : "Tap + to register a member."
                }));
                if (animDirection) {
                    trAnimateTabSwitch(listWrap, animDirection);
                }
                return;
            }

            if (activeCfg.sortBy === "name") {
                const alphaList = trAlphaList({
                    items: members,
                    getLabel: function (m) {
                        return formatFullName(m.First_Name, m.Last_Name);
                    },
                    renderRow: function (m) {
                        return trActionRow({
                            label: formatFullName(m.First_Name, m.Last_Name),
                            onClick: function () {
                                pushPage(renderMemberDetailPage, { memberId: m.Member_ID });
                            }
                        });
                    }
                });
                listWrap.appendChild(alphaList);
                if (animDirection) {
                    trAnimateTabSwitch(listWrap, animDirection);
                }
                return;
            }

            const rows = [];
            for (let i = 0; i < members.length; i += 1) {
                const m = members[i];
                const fullName = formatFullName(m.First_Name, m.Last_Name);
                rows.push(trActionRow({
                    label: fullName,
                    onClick: function () {
                        pushPage(renderMemberDetailPage, { memberId: m.Member_ID });
                    }
                }));
            }
            listWrap.appendChild(trListCard(rows));
            if (animDirection) {
                trAnimateTabSwitch(listWrap, animDirection);
            }
        } catch (err) {
            listWrap.appendChild(trEmptyState({
                icon: "\uE783",
                title: "Could not load members",
                subtitle: err.message
            }));
        }
    }

    async function setupFilterMenus() {
        let todas = [];
        if (!scopeTodaId) {
            try {
                const todaRes = await apiListTodas();
                todas = todaRes.todas || [];
            } catch (err) {
                todas = [];
            }
        }

        function buildTodaItems() {
            const items = [{ label: "All TODAs", value: "all", checked: true }];
            for (let i = 0; i < todas.length; i += 1) {
                items.push({ label: todas[i].TODA_Name, value: todas[i].TODA_ID });
            }
            return items;
        }

        const allSections = [{
            title: "Sort by",
            name: "all-member-sort",
            items: [
                { label: "Name", value: "name", checked: true },
                { label: "Member ID", value: "id" }
            ],
            onChange: function (val) {
                tabFilters.all.sortBy = val;
                loadMembers();
            }
        }];

        if (!scopeTodaId && todas.length > 0) {
            allSections.push({
                title: "Filter by TODA",
                name: "all-member-toda",
                items: buildTodaItems(),
                onChange: function (val) {
                    tabFilters.all.filterToda = val;
                    loadMembers();
                }
            });
        }

        allSections.push({
            title: "Filter by role",
            name: "all-member-role",
            items: [
                { label: "All roles", value: "all", checked: true },
                { label: "Driver", value: "driver" },
                { label: "Operator", value: "operator" },
                { label: "TODA President", value: "president" }
            ],
            onChange: function (val) {
                tabFilters.all.filterRole = val;
                loadMembers();
            }
        });

        const noRoleSections = [{
            title: "Sort by",
            name: "norole-member-sort",
            items: [
                { label: "Name", value: "name", checked: true },
                { label: "Member ID", value: "id" }
            ],
            onChange: function (val) {
                tabFilters.norole.sortBy = val;
                loadMembers();
            }
        }];

        if (!scopeTodaId && todas.length > 0) {
            noRoleSections.push({
                title: "Filter by TODA",
                name: "norole-member-toda",
                items: buildTodaItems(),
                onChange: function (val) {
                    tabFilters.norole.filterToda = val;
                    loadMembers();
                }
            });
        }

        allMenu = trMenu({ icon: "\uE71C", label: "Filter", sections: allSections });
        noRoleMenu = trMenu({ icon: "\uE71C", label: "Filter", sections: noRoleSections });

        filterSlot.replaceChildren();
        filterSlot.appendChild(allMenu);
        filterSlot.appendChild(noRoleMenu);
        syncFilterVisibility();
    }

    setupFilterMenus();
    loadMembers();
    const listSection = trSection([tabs, searchRow, listWrap], { flex: true });
    main.appendChild(listSection);
    return [navBar, main];
}

function renderMemberDetailPage(params) {
    const navBar = trNavBar({
        title: "Member details",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    main.appendChild(trEl("p", "as-tertiary as-gray", "Loading member..."));

    Promise.all([
        apiGetMember(params.memberId),
        apiGetHome(getSessionMemberId()),
        apiGetHome(params.memberId)
    ]).then(function (results) {
        const member = results[0].member;
        const viewerHome = results[1];
        const targetHome = results[2];
        main.replaceChildren();

        const targetFullName = formatFullName(member.First_Name, member.Last_Name);
        const updatedNav = trNavBar({
            title: "Member details",
            subtitle: "for " + member.First_Name,
            onBack: popPage
        });
        navBar.replaceWith(updatedNav);

        const owned = targetHome.ownedUnits || [];
        const remainingUnits = 3 - owned.length;
        const roleLabels = [];
        const targetRoles = targetHome.roles || [];
        for (let i = 0; i < targetRoles.length; i += 1) {
            roleLabels.push(targetRoles[i].label);
        }
        const roleText = roleLabels.length > 0 ? roleLabels.join(", ") : "Member";

        function openManageRolesSheet() {
            let sheetCtrl = null;
            const roleActions = [];

            if (member.TODA_ID) {
                if (owned.length === 0) {
                    roleActions.push(trActionRow({
                        label: "Become an Operator (add first tricycle)",
                        onClick: function () {
                            if (sheetCtrl) {
                                sheetCtrl.close();
                            }
                            pushPage(renderAddMyUnitPage, { ownerId: member.Member_ID, ownerName: targetFullName });
                        }
                    }));
                } else {
                    const unitWord = pluralLabel(owned.length, "tricycle", "tricycles");
                    roleActions.push(trActionRow({
                        label: "Operator (" + owned.length + " of 3 " + unitWord + ")",
                        disabled: true,
                        hideChevron: true
                    }));
                }
            }

            if (!member.License_Number) {
                roleActions.push(trActionRow({
                    label: "Become a Driver (add license)",
                    onClick: function () {
                        if (sheetCtrl) {
                            sheetCtrl.close();
                        }
                        let licSheet = null;
                        const licInputRow = trPropertyRow({
                            label: "Driver's License",
                            input: { placeholder: "e.g. LIC-001" }
                        });
                        const saveLicBtn = trButton({
                            label: "Save license",
                            variant: "primary",
                            onClick: async function () {
                                const lic = licInputRow.controlEl.value.trim();
                                if (!lic) {
                                    licInputRow.setError("Required");
                                    return;
                                }
                                try {
                                    await apiUpdateMember(member.Member_ID, {
                                        Address: member.Address,
                                        Contact_Number: member.Contact_Number,
                                        License_Number: lic
                                    });
                                    if (licSheet) {
                                        licSheet.close();
                                    }
                                    refreshPage();
                                } catch (err) {
                                    licInputRow.setError(err.message);
                                }
                            }
                        });
                        const cancelLicBtn = trButton({
                            label: "Cancel",
                            onClick: function () {
                                if (licSheet) {
                                    licSheet.close();
                                }
                            }
                        });
                        licSheet = trSheet({
                            title: "Add driver's license",
                            body: licInputRow,
                            footer: [saveLicBtn, cancelLicBtn],
                            removeOnClose: true
                        });
                        licSheet.open();
                    }
                }));
            } else {
                roleActions.push(trActionRow({
                    label: "Licensed driver (" + member.License_Number + ")",
                    disabled: true,
                    hideChevron: true
                }));
            }

            if (viewerHome.isSecretary && member.TODA_ID) {
                const isPres = member.President_Member_ID === member.Member_ID;
                if (isPres) {
                    roleActions.push(trActionRow({
                        label: "Remove president role (" + member.TODA_Name + ")",
                        critical: true,
                        hideChevron: true,
                        onClick: function () {
                            if (sheetCtrl) {
                                sheetCtrl.close();
                            }
                            trConfirm({
                                title: "Remove TODA president?",
                                message: "Unassign " + targetFullName + " as president of " + member.TODA_Name + "?",
                                confirmLabel: "Remove president",
                                critical: true,
                                onConfirm: async function () {
                                    try {
                                        await apiAssignPresident(member.TODA_ID, null);
                                        refreshPage();
                                    } catch (err) {
                                        trAlert({ title: "Error", message: err.message });
                                    }
                                }
                            });
                        }
                    }));
                } else {
                    roleActions.push(trActionRow({
                        label: "Assign as president of " + member.TODA_Name,
                        onClick: function () {
                            if (sheetCtrl) {
                                sheetCtrl.close();
                            }
                            trConfirm({
                                title: "Assign TODA president?",
                                message: "Make " + targetFullName + " president of " + member.TODA_Name + "? This replaces any current president.",
                                confirmLabel: "Assign president",
                                onConfirm: async function () {
                                    try {
                                        await apiAssignPresident(member.TODA_ID, member.Member_ID);
                                        refreshPage();
                                    } catch (err) {
                                        trAlert({ title: "Error", message: err.message });
                                    }
                                }
                            });
                        }
                    }));
                }
            }

            const cancelRolesBtn = trButton({
                label: "Cancel",
                onClick: function () {
                    if (sheetCtrl) {
                        sheetCtrl.close();
                    }
                }
            });

            sheetCtrl = trSheet({
                title: "Manage roles",
                description: !member.TODA_ID ? "Join a TODA group first to become an Operator or TODA President." : "",
                body: trListCard(roleActions),
                footer: cancelRolesBtn,
                removeOnClose: true
            });
            sheetCtrl.open();
        }

        async function openTodaPickerSheet() {
            let todaSheet = null;
            try {
                const todaRes = await apiListTodas();
                const todas = todaRes.todas || [];
                if (todas.length === 0) {
                    pushPage(renderTodasPage, {});
                    return;
                }
                const rows = [];
                if (member.TODA_ID && member.Member_ID === viewerHome.member.Member_ID) {
                    rows.push(trActionRow({
                        label: "None (Leave TODA group)",
                        critical: true,
                        hideChevron: true,
                        onClick: function () {
                            if (todaSheet) {
                                todaSheet.close();
                            }
                            trConfirm({
                                title: "Leave " + member.TODA_Name + "?",
                                message: "Your TODA group will be set to None.",
                                confirmLabel: "Leave group",
                                critical: true,
                                onConfirm: async function () {
                                    try {
                                        await apiUpdateMemberToda(member.Member_ID, null);
                                        refreshPage();
                                    } catch (err) {
                                        trAlert({ title: "Cannot leave group", message: err.message });
                                    }
                                }
                            });
                        }
                    }));
                }
                for (let i = 0; i < todas.length; i += 1) {
                    const t = todas[i];
                    rows.push(trActionRow({
                        label: t.TODA_Name + " (" + t.TODA_ID + ")",
                        hideChevron: true,
                        onClick: async function () {
                            if (todaSheet) {
                                todaSheet.close();
                            }
                            try {
                                await apiUpdateMemberToda(member.Member_ID, t.TODA_ID);
                                refreshPage();
                            } catch (err) {
                                trAlert({ title: "Cannot change TODA", message: err.message });
                            }
                        }
                    }));
                }
                todaSheet = trSheet({
                    title: "Select TODA group",
                    body: trListCard(rows),
                    footer: trButton({
                        label: "Cancel",
                        onClick: function () {
                            if (todaSheet) {
                                todaSheet.close();
                            }
                        }
                    }),
                    removeOnClose: true
                });
                todaSheet.open();
            } catch (err) {
                trAlert({ title: "Error", message: err.message });
            }
        }

        const isSelfMember = member.Member_ID === viewerHome.member.Member_ID;
        const infoRows = [
            trPropertyRow({ label: "Member ID", value: member.Member_ID }),
            trPropertyRow({ label: "Address", value: member.Address }),
            trPropertyRow({ label: "Contact No.", value: member.Contact_Number }),
            trPropertyRow({ label: "License No.", value: member.License_Number || "None (Non-driver)" })
        ];
        if (typeof appendExtraColumnRows === "function") {
            appendExtraColumnRows(infoRows, member, [
                "Member_ID", "First_Name", "Last_Name", "Address",
                "Contact_Number", "License_Number", "TODA_ID", "TODA_Name",
                "President_Member_ID", "Route", "isSecretary", "ledTodaId"
            ]);
        }
        const infoCard = trListCard(infoRows);
        const infoFootnote = isSelfMember
            ? "Read-only here. Update your contact and license details in Edit profile."
            : "Personal contact and license details belong to " + member.First_Name + ".";
        main.appendChild(trSection(trCardGroup({
            headline: "Member details",
            card: infoCard,
            footnote: infoFootnote
        })));

        const rolesGroup = trCardGroup({
            headline: "Roles",
            card: trListCard([
                trPropertyRow({ label: "Assigned roles", value: roleText }),
                trActionRow({ label: "Manage roles", onClick: openManageRolesSheet })
            ]),
            footnote: viewerHome.isSecretary
                ? "Federation Secretary assigns TODA President; units and driver licenses cover the rest."
                : "Drivers hold a license, operators own units, and the Federation Secretary assigns TODA President."
        });

        const todaRows = [
            trPropertyRow({ label: "Association", value: member.TODA_Name || "None" })
        ];
        if (viewerHome.isSecretary) {
            todaRows.push(trActionRow({
                label: member.TODA_ID ? "Change TODA group" : "Assign TODA group",
                onClick: openTodaPickerSheet
            }));
        }
        const todaGroup = trCardGroup({
            headline: "TODA group",
            card: trListCard(todaRows),
            footnote: viewerHome.isSecretary
                ? "Federation Secretary can assign or move this member's TODA group."
                : "Only the Federation Secretary can change TODA group assignments."
        });

        main.appendChild(trSection([rolesGroup, todaGroup]));

        const unitGroups = [];
        if (targetHome.drivenUnit) {
            const du = targetHome.drivenUnit;
            const drivenCard = buildTricycleCard(du, {
                mode: "driver",
                onClick: function () {
                    pushPage(renderManageUnitPage, {
                        bodyNumber: du.Body_Number,
                        ownerFirstName: du.Owner_First_Name,
                        ownerId: du.Owner_Member_ID
                    });
                }
            });
            unitGroups.push(trCardGroup({
                headline: "Driven tricycle",
                card: drivenCard
            }));
        }

        if (owned.length > 0) {
            const unitWord = pluralLabel(owned.length, "Tricycle", "Tricycles");
            const ownedHeading = owned.length + " " + unitWord + " owned \u00B7 " + remainingUnits + " remaining";

            const ownedCards = [];
            for (let i = 0; i < owned.length; i += 1) {
                const ou = owned[i];
                const ownedCard = buildTricycleCard(ou, {
                    mode: "operator",
                    onClick: function () {
                        pushPage(renderManageUnitPage, {
                            bodyNumber: ou.Body_Number,
                            ownerFirstName: member.First_Name,
                            ownerId: member.Member_ID
                        });
                    }
                });
                ownedCards.push(ownedCard);
            }
            unitGroups.push(trCardStack({
                heading: ownedHeading,
                cards: ownedCards
            }));

            if (owned.length < 3 && member.TODA_ID) {
                const addUnitRow = trActionRow({
                    label: "Add tricycle for " + targetFullName,
                    onClick: function () {
                        pushPage(renderAddMyUnitPage, {
                            ownerId: member.Member_ID,
                            ownerName: targetFullName,
                            ownerFirstName: member.First_Name
                        });
                    }
                });
                unitGroups.push(trCardGroup({
                    card: trCard([addUnitRow])
                }));
            }
        }
        if (unitGroups.length > 0) {
            main.appendChild(trSection(unitGroups));
        }

        const removeRow = trActionRow({
            label: "Remove " + targetFullName,
            critical: true,
            hideChevron: true,
            onClick: function () {
                trConfirm({
                    title: "Remove " + targetFullName + "?",
                    message: "Member cannot be deleted while owning, driving, leading, or managing.",
                    confirmLabel: "Remove member",
                    critical: true,
                    onConfirm: async function () {
                        try {
                            await apiDeleteMember(member.Member_ID);
                            popPage();
                        } catch (err) {
                            trAlert({ title: "Cannot remove member", message: err.message });
                        }
                    }
                });
            }
        });
        main.appendChild(trSection(trCardGroup({
            headline: "Danger zone",
            card: trCard([removeRow]),
            footnote: "A member must have no owned units, assigned tricycle, or leadership role before removal."
        })));
    }).catch(function (err) {
        main.replaceChildren();
        main.appendChild(trSection(trEmptyState({
            icon: "\uE783",
            title: "Could not load member",
            subtitle: err.message
        }), { flex: true }));
    });

    return [navBar, main];
}


function renderAddMemberPage(params) {
    const navBar = trNavBar({
        title: "Add member",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    main.appendChild(trEl("p", "as-tertiary as-gray", "Loading TODA groups..."));

    apiListTodas().then(function (res) {
        main.replaceChildren();
        const todas = res.todas || [];
        const todaOptions = [];

        for (let i = 0; i < todas.length; i += 1) {
            const t = todas[i];
            if (!params.scopeTodaId || t.TODA_ID === params.scopeTodaId) {
                todaOptions.push({ label: t.TODA_Name, value: t.TODA_ID });
            }
        }

        if (todaOptions.length === 0) {
            main.appendChild(trSection(trEmptyState({
                icon: "\uE82F",
                title: "No TODA groups yet",
                subtitle: "Register a TODA group first before adding members."
            }), { flex: true }));
            return;
        }

        const idRow = trPropertyRow({ label: "ID Number", input: { placeholder: "e.g. M1" } });
        const firstRow = trPropertyRow({ label: "First Name", input: { placeholder: "e.g. Arron" } });
        const lastRow = trPropertyRow({ label: "Last Name", input: { placeholder: "e.g. Caudilla" } });
        const addrRow = trPropertyRow({ label: "Home Address", input: { placeholder: "Barangay, City" } });
        const contactRow = trPropertyRow({ label: "Phone Number", input: { placeholder: "09XXXXXXXXX" } });
        const licenseRow = trPropertyRow({
            label: "Driver's License (Optional)",
            input: { placeholder: "Leave blank if non-driver" }
        });
        const todaRow = trPropertyRow({
            label: "TODA Group",
            select: {
                value: params.scopeTodaId || todaOptions[0].value,
                options: todaOptions
            }
        });

        const saveBtn = trButton({
            label: "Done",
            small: true,
            onClick: async function () {
                const payload = {
                    Member_ID: idRow.controlEl.value.trim(),
                    First_Name: firstRow.controlEl.value.trim(),
                    Last_Name: lastRow.controlEl.value.trim(),
                    Address: addrRow.controlEl.value.trim(),
                    Contact_Number: contactRow.controlEl.value.trim(),
                    License_Number: licenseRow.controlEl.value.trim(),
                    TODA_ID: todaRow.controlEl.value
                };

                idRow.setError(payload.Member_ID ? "" : "Required");
                firstRow.setError(payload.First_Name ? "" : "Required");
                lastRow.setError(payload.Last_Name ? "" : "Required");
                addrRow.setError(payload.Address ? "" : "Required");
                contactRow.setError(payload.Contact_Number ? "" : "Required");
                licenseRow.setError("");

                const missing = !payload.Member_ID || !payload.First_Name || !payload.Last_Name ||
                    !payload.Address || !payload.Contact_Number;
                if (missing) {
                    return;
                }

                try {
                    await apiCreateMember(payload);
                    let todaLabel = payload.TODA_ID;
                    const optCount = todaOptions.length;
                    for (let i = 0; i < optCount; i += 1) {
                        const optItem = todaOptions[i];
                        if (optItem.value === payload.TODA_ID) {
                            todaLabel = optItem.label;
                        }
                    }
                    const fullName = formatFullName(payload.First_Name, payload.Last_Name);
                    const previewCard = trProfileCard({
                        firstName: payload.First_Name,
                        lastName: payload.Last_Name,
                        address: payload.Address,
                        contact: payload.Contact_Number,
                        todaName: todaLabel,
                        license: payload.License_Number || "No license"
                    });
                    presentSuccessScreen({
                        badge: "MEMBER",
                        title: "Member added",
                        subtitle: fullName + " joined " + todaLabel + ".",
                        card: previewCard,
                        buttonLabel: "View member",
                        onDone: function () {
                            replaceTopPage(renderMemberDetailPage, { memberId: payload.Member_ID });
                        }
                    });
                } catch (err) {
                    if (err.message.indexOf("license") !== -1) {
                        licenseRow.setError(err.message);
                    } else {
                        idRow.setError(err.message);
                    }
                }
            }
        });

        const updatedNav = trNavBar({
            title: "Add member",
            onBack: popPage,
            actions: [saveBtn]
        });
        navBar.replaceWith(updatedNav);

        const formCard = trListCard([idRow, firstRow, lastRow, addrRow, contactRow, licenseRow, todaRow]);
        main.appendChild(trSection(trCardGroup({
            headline: "New member",
            card: formCard,
            footnote: "Leave License No. blank if this member is not an active driver."
        })));
    }).catch(function (err) {
        main.replaceChildren();
        main.appendChild(trSection(trEmptyState({
            icon: "\uE783",
            title: "Could not load TODA groups",
            subtitle: err.message
        }), { flex: true }));
    });

    return [navBar, main];
}