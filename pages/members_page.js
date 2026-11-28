/* members list, barangay/role filtering, member detail, add, edit, and RA 10173 erasure */

const MEMBER_PAGE_MAX_UNITS = 5;
const MEMBER_PAGE_ID_MAX = 10;
const MEMBER_PAGE_DATE_MAX = 10;

// params: member (required)
function buildMemberRoleSubtitle(member) {
    const parts = [];
    if (member.isSecretary) {
        parts.push("Federation Secretary");
    }
    if (member.Active_Officer_Positions) {
        parts.push(member.Active_Officer_Positions);
    }
    if (Number(member.ownedUnitCount) > 0) {
        const uCount = Number(member.ownedUnitCount);
        const uWord = pluralLabel(uCount, "unit", "units");
        parts.push("Operator (" + uCount + " " + uWord + ")");
    }
    if (member.License_Number) {
        const sCount = Number(member.activeShiftCount) || 0;
        if (sCount > 0) {
            parts.push("Driver (" + sCount + " active)");
        } else {
            parts.push("Licensed Driver");
        }
    }
    if (parts.length === 0) {
        parts.push("Member");
    }
    if (member.Barangay) {
        parts.push("Brgy. " + member.Barangay);
    }
    return parts.join(" · ");
}

// params: params (optional: { scopeTodaId, scopeTodaName, activeTab, canWriteToda })
function renderMembersPage(params) {
    const safeParams = params || {};
    const scopeTodaId = safeParams.scopeTodaId || null;
    const scopeTodaName = safeParams.scopeTodaName || null;
    let searchQuery = "";
    let activeTab = safeParams.activeTab || "all";

    const tabFilters = {
        all: {
            sortBy: "name",
            filterToda: scopeTodaId || "all",
            filterBarangay: "all",
            filterRole: "all"
        },
        norole: {
            sortBy: "name",
            filterToda: scopeTodaId || "all",
            filterBarangay: "all"
        }
    };

    const pageTitle = scopeTodaId ? "Manage my members" : "Manage all members";
    const navBar = trNavBar({
        title: pageTitle,
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const searchRow = trEl("div", "hbox space-l");
    const searchBox = trSearchBox({
        placeholder: "Find by name, ID, or barangay",
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
            safeParams.activeTab = nextKey;
            syncFilterVisibility();
            loadMembers(direction);
        }
    });

    const listWrap = trEl("div", "vbox flex1 space-l");

    async function loadMembers(animDirection) {
        listWrap.replaceChildren();
        try {
            const activeCfg = activeTab === "norole" ? tabFilters.norole : tabFilters.all;
            let effectiveRole = tabFilters.all.filterRole;
            if (activeTab === "norole") {
                effectiveRole = "none";
            }
            const res = await apiListMembers({
                todaId: activeCfg.filterToda,
                barangay: activeCfg.filterBarangay,
                q: searchQuery,
                sort: activeCfg.sortBy,
                role: effectiveRole
            });
            const members = res.members || [];
            if (members.length === 0) {
                let emptySub = "Tap + to register a member.";
                if (searchQuery || activeCfg.filterBarangay !== "all" || effectiveRole !== "all") {
                    emptySub = "Try a different search text or filter.";
                }
                const emptyNode = trEmptyState({
                    icon: "\uE716",
                    title: "No members found",
                    subtitle: emptySub
                });
                listWrap.appendChild(emptyNode);
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
                        const fullName = formatFullName(m.First_Name, m.Last_Name);
                        const subText = buildMemberRoleSubtitle(m);
                        return trActionRow({
                            label: fullName,
                            subtitle: subText,
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
            const mCount = members.length;
            for (let i = 0; i < mCount; i += 1) {
                const m = members[i];
                const fullName = formatFullName(m.First_Name, m.Last_Name);
                const subText = m.Member_ID + " · " + buildMemberRoleSubtitle(m);
                const row = trActionRow({
                    label: fullName,
                    subtitle: subText,
                    onClick: function () {
                        pushPage(renderMemberDetailPage, { memberId: m.Member_ID });
                    }
                });
                rows.push(row);
            }
            const listCard = trListCard(rows);
            listWrap.appendChild(listCard);
            if (animDirection) {
                trAnimateTabSwitch(listWrap, animDirection);
            }
        } catch (err) {
            const errEmpty = trEmptyState({
                icon: "\uE783",
                title: "Could not load members",
                subtitle: err.message
            });
            listWrap.appendChild(errEmpty);
        }
    }

    async function initRosterAndFilters() {
        const viewerId = getSessionMemberId();
        let canWrite = Boolean(safeParams.canWriteToda);
        let isSecretary = false;

        try {
            const viewerHome = await apiHome(viewerId);
            const vRoles = viewerHome.roles || {};
            canWrite = Boolean(vRoles.canWriteToda);
            isSecretary = Boolean(vRoles.isSecretary);
        } catch (err) {
            /* keep default role flags */
        }

        const navActions = [];
        if (canWrite) {
            const addIcon = trIcon("\uE710", {
                label: "Add member",
                onClick: function () {
                    pushPage(renderAddMemberPage, { scopeTodaId: scopeTodaId, scopeTodaName: scopeTodaName });
                }
            });
            navActions.push(addIcon);
        }
        const updatedNav = trNavBar({
            title: scopeTodaId ? (canWrite ? "Manage my members" : "TODA members") : "Manage all members",
            onBack: popPage,
            actions: navActions
        });
        navBar.replaceWith(updatedNav);

        let todas = [];
        if (!scopeTodaId && isSecretary) {
            try {
                const todaRes = await apiListTodas();
                todas = todaRes.todas || [];
            } catch (err) {
                todas = [];
            }
        }

        // based on final_dbms1_relational-model.md, Barangay, gather unique barangay names for atomic address filtering
        let barangays = [];
        try {
            const allRes = await apiListMembers({ todaId: scopeTodaId || "all" });
            const allMembers = allRes.members || [];
            const seenBrgy = {};
            const len = allMembers.length;
            for (let i = 0; i < len; i += 1) {
                const rawBrgy = allMembers[i].Barangay;
                if (rawBrgy) {
                    const cleanBrgy = String(rawBrgy).trim();
                    if (cleanBrgy && !seenBrgy[cleanBrgy]) {
                        seenBrgy[cleanBrgy] = true;
                        barangays.push(cleanBrgy);
                    }
                }
            }
            barangays.sort();
        } catch (err) {
            barangays = [];
        }

        function buildTodaItems() {
            const items = [{ label: "All TODAs", value: "all", checked: true }];
            const tLen = todas.length;
            for (let i = 0; i < tLen; i += 1) {
                items.push({ label: todas[i].TODA_Name, value: todas[i].TODA_ID });
            }
            return items;
        }

        function buildBarangayItems() {
            const items = [{ label: "All barangays", value: "all", checked: true }];
            const bLen = barangays.length;
            for (let i = 0; i < bLen; i += 1) {
                items.push({ label: barangays[i], value: barangays[i] });
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

        if (barangays.length > 0) {
            allSections.push({
                title: "Filter by Barangay",
                name: "all-member-barangay",
                items: buildBarangayItems(),
                onChange: function (val) {
                    tabFilters.all.filterBarangay = val;
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
                { label: "TODA President", value: "president" },
                { label: "TODA Officer", value: "officer" },
                { label: "Federation Secretary", value: "secretary" }
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

        if (barangays.length > 0) {
            noRoleSections.push({
                title: "Filter by Barangay",
                name: "norole-member-barangay",
                items: buildBarangayItems(),
                onChange: function (val) {
                    tabFilters.norole.filterBarangay = val;
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

    initRosterAndFilters();
    loadMembers();

    const listSection = trSection([tabs, searchRow, listWrap], { flex: true });
    main.appendChild(listSection);
    return [navBar, main];
}

/* member detail screen */

// params: params (required: { memberId })
function renderMemberDetailPage(params) {
    const safeParams = params || {};
    const navBar = trNavBar({
        title: "Member details",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading member...");
    main.appendChild(loadingText);

    const viewerId = getSessionMemberId();

    Promise.all([
        apiGetMember(safeParams.memberId),
        apiHome(viewerId)
    ]).then(function (results) {
        const detail = results[0];
        const member = detail.member;
        const toda = detail.toda;
        const targetRoles = detail.roles || {};
        const owned = detail.ownedUnits || [];
        const drivenShifts = detail.drivenAssignments || [];
        const officerTerms = detail.officerTerms || [];

        const viewerHome = results[1];
        const viewerRoles = viewerHome.roles || {};
        const isSelfMember = member.Member_ID === viewerHome.member.Member_ID;
        const isSecretary = Boolean(viewerRoles.isSecretary);
        const isSameTodaPres = Boolean(viewerRoles.isPresident && viewerRoles.officerTodaId === member.TODA_ID);
        const isSameTodaWriter = Boolean(viewerRoles.canWriteToda && viewerRoles.officerTodaId === member.TODA_ID);
        const canEditMember = isSelfMember || isSecretary || isSameTodaWriter;
        const canDeleteMember = !isSelfMember && (isSecretary || isSameTodaPres);

        main.replaceChildren();

        const targetFullName = formatFullName(member.First_Name, member.Last_Name);
        const navActions = [];
        if (canEditMember) {
            const editIcon = trIcon("\uE70F", {
                label: "Edit member",
                onClick: function () {
                    pushPage(renderEditMemberPage, { member: member });
                }
            });
            navActions.push(editIcon);
        }
        const updatedNav = trNavBar({
            title: "Member details",
            subtitle: "for " + member.First_Name,
            onBack: popPage,
            actions: navActions
        });
        navBar.replaceWith(updatedNav);

        const addressText = formatMemberAddress(member);
        let todaNameDisplay = member.TODA_Name || member.TODA_ID;
        if (toda && toda.TODA_Name) {
            todaNameDisplay = toda.TODA_Name;
        }
        let licenseDisplay = "Non-driving member";
        if (member.License_Number) {
            licenseDisplay = member.License_Number;
            if (member.License_Type) {
                licenseDisplay = licenseDisplay + " · " + member.License_Type;
            }
        }

        const profileCard = trProfileCard({
            name: targetFullName,
            leftDetails: [addressText, member.Contact_Number],
            rightDetails: [todaNameDisplay, licenseDisplay]
        });

        const badges = targetRoles.badges || [];
        const badgeLabels = [];
        const bCount = badges.length;
        for (let i = 0; i < bCount; i += 1) {
            badgeLabels.push(badges[i].label);
        }
        let roleText = "Member";
        if (badgeLabels.length > 0) {
            roleText = badgeLabels.join(", ");
        }

        const infoRows = [
            trPropertyRow({ label: "Member ID", value: member.Member_ID }),
            trPropertyRow({ label: "Active Roles", value: roleText }),
            trPropertyRow({ label: "Street", value: member.Street }),
            trPropertyRow({ label: "Barangay", value: member.Barangay }),
            trPropertyRow({ label: "City / Municipality", value: member.City_Municipality }),
            trPropertyRow({ label: "Contact Number", value: member.Contact_Number })
        ];
        const infoCard = trListCard(infoRows);
        const infoGroup = trCardGroup({
            headline: "Personal record",
            card: infoCard,
            footnote: "Every human participant is stored once across driver, operator, and officer roles."
        });

        const credRows = [
            trPropertyRow({ label: "License Number", value: member.License_Number || "None" }),
            trPropertyRow({ label: "License Expiry Date", value: member.License_Expiry_Date || "None" }),
            trPropertyRow({ label: "License Type", value: member.License_Type || "None" }),
            trPropertyRow({ label: "Restriction Code", value: member.Restriction_Code || "None" }),
            trPropertyRow({ label: "PSO ID Number", value: member.PSO_ID_Number || "None" }),
            trPropertyRow({ label: "BLS Cert ID", value: member.BLS_Cert_ID || "None" })
        ];
        const credCard = trListCard(credRows);
        const credGroup = trCardGroup({
            headline: "Driver credentials",
            card: credCard,
            footnote: "Non-driving operators leave these fields blank."
        });

        const profileSec = trSection([profileCard, infoGroup, credGroup]);
        main.appendChild(profileSec);

        // based on final_dbms1_relational-model.md, MEMBER, keep TODA_ID required with no leave-to-null choice during transfer
        async function openTodaPickerSheet() {
            let todaSheet = null;
            try {
                const todaRes = await apiListTodas();
                const todas = todaRes.todas || [];
                const rows = [];
                const tCount = todas.length;
                for (let i = 0; i < tCount; i += 1) {
                    const t = todas[i];
                    const isCurrent = t.TODA_ID === member.TODA_ID;
                    const row = trActionRow({
                        label: t.TODA_Name + " (" + t.TODA_ID + ")",
                        subtitle: isCurrent ? "Current association" : t.Route,
                        disabled: isCurrent,
                        hideChevron: true,
                        onClick: async function () {
                            if (todaSheet) {
                                todaSheet.close();
                            }
                            try {
                                await apiUpdateMemberToda(member.Member_ID, t.TODA_ID);
                                refreshPage();
                            } catch (err) {
                                trAlert({ title: "Cannot transfer TODA", message: err.message });
                            }
                        }
                    });
                    rows.push(row);
                }
                const listCard = trListCard(rows);
                const cancelBtn = trButton({
                    label: "Cancel",
                    onClick: function () {
                        if (todaSheet) {
                            todaSheet.close();
                        }
                    }
                });
                todaSheet = trSheet({
                    title: "Transfer TODA group",
                    description: "Every member must belong to a TODA. Remove active officer terms before moving to a different TODA.",
                    body: [listCard],
                    footer: [cancelBtn],
                    removeOnClose: true
                });
                todaSheet.open();
            } catch (err) {
                trAlert({ title: "Error", message: err.message });
            }
        }

        const todaRows = [
            trPropertyRow({ label: "Association", value: todaNameDisplay + " (" + member.TODA_ID + ")" })
        ];
        if (isSecretary) {
            const transferRow = trActionRow({
                label: "Transfer TODA group",
                onClick: openTodaPickerSheet
            });
            todaRows.push(transferRow);
        }
        const todaCard = trListCard(todaRows);
        let todaFoot = "Only the Federation Secretary can transfer a member to another TODA.";
        if (isSecretary) {
            todaFoot = "TODA membership is mandatory. End any officer terms in the current TODA before transferring.";
        }
        const todaGroup = trCardGroup({
            headline: "TODA association",
            card: todaCard,
            footnote: todaFoot
        });

        const termItems = [todaGroup];
        if (officerTerms.length > 0) {
            const otRows = [];
            const otCount = officerTerms.length;
            for (let i = 0; i < otCount; i += 1) {
                const ot = officerTerms[i];
                const stateLabel = ot.isActive ? "Active" : "Ended / Scheduled";
                const item = trListItem({
                    title: ot.Position + " · " + ot.TODA_Name,
                    subtitle: ot.Term_Start + " to " + ot.Term_End + " · " + stateLabel
                });
                otRows.push(item);
            }
            const otCard = trListCard(otRows);
            const otGroup = trCardGroup({
                headline: "Officer terms (" + officerTerms.length + ")",
                card: otCard,
                footnote: "Manage elected board terms from the TODA details page."
            });
            termItems.push(otGroup);
        }
        const assocSec = trSection(termItems);
        main.appendChild(assocSec);

        const unitItems = [];
        if (drivenShifts.length > 0) {
            const shiftCards = [];
            const sCount = drivenShifts.length;
            for (let i = 0; i < sCount; i += 1) {
                const sh = drivenShifts[i];
                const roleLabel = sh.Driver_Role ? sh.Driver_Role.toUpperCase() : "DRIVER";
                const statusText = sh.Status || "Active";
                const ownerName = formatFullName(sh.Owner_First_Name, sh.Owner_Last_Name);
                const ownerDisplay = ownerName || sh.Owner_Member_ID || "Unknown owner";
                const ownerLine = trEl("p", "as-tertiary as-gray");
                const ownerPrefix = document.createTextNode("Owner: ");
                const ownerBold = trEl("span", "as-bold", ownerDisplay);
                ownerLine.appendChild(ownerPrefix);
                ownerLine.appendChild(ownerBold);

                const shiftCard = trBrandCard({
                    subtext: roleLabel,
                    topRight: statusText,
                    title: sh.Body_Number || sh.Tricycle_ID,
                    subtitle: sh.Shift_Schedule + " · " + sh.Date_Assigned,
                    bottomRight: ownerLine,
                    onClick: function () {
                        pushPage(renderManageUnitPage, {
                            tricycleId: sh.Tricycle_ID,
                            bodyNumber: sh.Body_Number,
                            ownerFirstName: sh.Owner_First_Name,
                            ownerId: sh.Owner_Member_ID
                        });
                    }
                });
                shiftCards.push(shiftCard);
            }
            const shiftStack = trCardStack({
                heading: "Shift assignments (" + drivenShifts.length + ")",
                cards: shiftCards
            });
            unitItems.push(shiftStack);
        }

        const remainingUnits = MEMBER_PAGE_MAX_UNITS - owned.length;
        if (owned.length > 0) {
            const unitWord = pluralLabel(owned.length, "Tricycle", "Tricycles");
            const ownedHeading = owned.length + " of " + MEMBER_PAGE_MAX_UNITS + " " + unitWord + " owned · " + remainingUnits + " remaining";
            const ownedCards = [];
            const oCount = owned.length;
            for (let i = 0; i < oCount; i += 1) {
                const ou = owned[i];
                const ownedCard = buildTricycleCard(ou, {
                    mode: "operator",
                    onClick: function () {
                        pushPage(renderManageUnitPage, {
                            tricycleId: ou.Tricycle_ID,
                            bodyNumber: ou.Body_Number,
                            ownerFirstName: member.First_Name,
                            ownerId: member.Member_ID
                        });
                    }
                });
                ownedCards.push(ownedCard);
            }
            const stack = trCardStack({
                heading: ownedHeading,
                cards: ownedCards
            });
            unitItems.push(stack);
        }

        if (canEditMember && owned.length < MEMBER_PAGE_MAX_UNITS) {
            const addUnitBtn = trButton({
                label: "Register tricycle for " + member.First_Name,
                onClick: function () {
                    pushPage(renderAddMyUnitPage, {
                        ownerId: member.Member_ID,
                        ownerName: targetFullName,
                        ownerFirstName: member.First_Name
                    });
                }
            });
            unitItems.push(addUnitBtn);
        }

        if (unitItems.length > 0) {
            const unitSec = trSection(unitItems);
            main.appendChild(unitSec);
        }

        // based on final_dbms1_relational-model.md, RA 10173, block erasure only when member still own tricycle units
        if (canDeleteMember) {
            const ownsUnits = owned.length > 0;
            const removeRow = trActionRow({
                label: "Erase " + targetFullName + " (RA 10173)",
                critical: true,
                disabled: ownsUnits,
                hideChevron: true,
                onClick: function () {
                    trConfirm({
                        title: "Permanently erase " + targetFullName + "?",
                        message: "Under RA 10173, this removes the member permanently. Linked shift assignments and officer terms cascade-delete, and any federation secretary link clears to None.",
                        confirmLabel: "Erase member",
                        critical: true,
                        onConfirm: async function () {
                            try {
                                await apiDeleteMember(member.Member_ID);
                                popPage();
                            } catch (err) {
                                trAlert({ title: "Cannot erase member", message: err.message });
                            }
                        }
                    });
                }
            });
            const dangerCard = trCard([removeRow]);
            let dangerFoot = "Erasing removes linked shift assignments and officer terms automatically.";
            if (ownsUnits) {
                dangerFoot = "This operator owns " + owned.length + " tricycle unit(s). Transfer or delete owned units before erasing.";
            }
            const dangerGroup = trCardGroup({
                headline: "Danger zone (RA 10173)",
                card: dangerCard,
                footnote: dangerFoot
            });
            const dangerSec = trSection(dangerGroup);
            main.appendChild(dangerSec);
        }
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load member",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

/* add member screen */

// params: params (optional: { scopeTodaId, scopeTodaName })
function renderAddMemberPage(params) {
    const safeParams = params || {};
    const navBar = trNavBar({
        title: "Add member",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading TODA groups...");
    main.appendChild(loadingText);

    apiListTodas().then(function (res) {
        main.replaceChildren();
        const todas = res.todas || [];
        const todaOptions = [];
        const tCount = todas.length;
        for (let i = 0; i < tCount; i += 1) {
            const t = todas[i];
            if (!safeParams.scopeTodaId || t.TODA_ID === safeParams.scopeTodaId) {
                todaOptions.push({ label: t.TODA_Name + " (" + t.TODA_ID + ")", value: t.TODA_ID });
            }
        }

        if (todaOptions.length === 0) {
            const emptyNode = trEmptyState({
                icon: "\uE82F",
                title: "No TODA groups yet",
                subtitle: "Register a TODA group first before adding members."
            });
            const emptySec = trSection(emptyNode, { flex: true });
            main.appendChild(emptySec);
            return;
        }

        const idRow = trPropertyRow({
            label: "Member ID (Optional)",
            input: { placeholder: "Auto or e.g. MEM-007", maxLength: MEMBER_PAGE_ID_MAX }
        });
        const firstRow = trPropertyRow({ label: "First Name", input: { placeholder: "e.g. Alex" } });
        const lastRow = trPropertyRow({ label: "Last Name", input: { placeholder: "e.g. Santos" } });
        const streetRow = trPropertyRow({ label: "Street", input: { placeholder: "e.g. 12 Rizal St." } });
        const brgyRow = trPropertyRow({ label: "Barangay", input: { placeholder: "e.g. Mabolo" } });
        const cityRow = trPropertyRow({
            label: "City / Municipality",
            input: { value: DEFAULT_CITY_MUNICIPALITY, placeholder: "e.g. Naga City" }
        });
        const contactRow = trPropertyRow({ label: "Contact Number", input: { placeholder: "09XXXXXXXXX" } });
        const todaRow = trPropertyRow({
            label: "TODA Association",
            select: {
                value: safeParams.scopeTodaId || todaOptions[0].value,
                options: todaOptions
            }
        });

        const licenseRow = trPropertyRow({
            label: "License Number (Optional)",
            input: { placeholder: "Leave blank if non-driver" }
        });
        const licExpRow = trPropertyRow({
            label: "License Expiry Date",
            input: { placeholder: "YYYY-MM-DD", maxLength: MEMBER_PAGE_DATE_MAX }
        });
        const licTypeOptions = buildSelectOptions(LICENSE_TYPES, "None");
        const licTypeRow = trPropertyRow({
            label: "License Type",
            select: { value: "", options: licTypeOptions }
        });
        const restRow = trPropertyRow({
            label: "Restriction Code",
            input: { placeholder: "e.g. 1", maxLength: 10 }
        });
        const psoRow = trPropertyRow({
            label: "PSO ID Number",
            input: { placeholder: "e.g. PSO-2026-007" }
        });
        const blsRow = trPropertyRow({
            label: "BLS Cert ID",
            input: { placeholder: "e.g. BLS-2026-007" }
        });

        const saveBtn = trButton({
            label: "Done",
            small: true,
            onClick: async function () {
                const memberId = idRow.controlEl.value.trim();
                const firstName = firstRow.controlEl.value.trim();
                const lastName = lastRow.controlEl.value.trim();
                const street = streetRow.controlEl.value.trim();
                const barangay = brgyRow.controlEl.value.trim();
                const city = cityRow.controlEl.value.trim();
                const contact = contactRow.controlEl.value.trim();
                const todaId = todaRow.controlEl.value;

                const licNum = licenseRow.controlEl.value.trim();
                const licExp = licExpRow.controlEl.value.trim();
                const licType = licTypeRow.controlEl.value;
                const restCode = restRow.controlEl.value.trim();
                const psoId = psoRow.controlEl.value.trim();
                const blsId = blsRow.controlEl.value.trim();

                let valid = true;
                firstRow.setError("");
                lastRow.setError("");
                streetRow.setError("");
                brgyRow.setError("");
                cityRow.setError("");
                contactRow.setError("");
                licenseRow.setError("");
                licExpRow.setError("");

                if (!firstName) {
                    firstRow.setError("Enter a first name.");
                    valid = false;
                }
                if (!lastName) {
                    lastRow.setError("Enter a last name.");
                    valid = false;
                }
                if (!street) {
                    streetRow.setError("Enter a street address.");
                    valid = false;
                }
                if (!barangay) {
                    brgyRow.setError("Enter a barangay.");
                    valid = false;
                }
                if (!city) {
                    cityRow.setError("Enter a city or municipality.");
                    valid = false;
                }
                if (!contact) {
                    contactRow.setError("Enter a contact number.");
                    valid = false;
                }
                if (licExp && !isValidIsoDate(licExp)) {
                    licExpRow.setError("Use YYYY-MM-DD date format.");
                    valid = false;
                }
                if (!valid) {
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.classList.add("disabled");
                saveBtn.textContent = "Saving...";

                try {
                    const res = await apiCreateMember({
                        Member_ID: memberId,
                        First_Name: firstName,
                        Last_Name: lastName,
                        Street: street,
                        Barangay: barangay,
                        City_Municipality: city,
                        Contact_Number: contact,
                        TODA_ID: todaId,
                        License_Number: licNum || null,
                        License_Expiry_Date: licExp || null,
                        License_Type: licType || null,
                        Restriction_Code: restCode || null,
                        PSO_ID_Number: psoId || null,
                        BLS_Cert_ID: blsId || null
                    });
                    const createdId = res.Member_ID;
                    let todaLabel = todaId;
                    const optLen = todaOptions.length;
                    for (let i = 0; i < optLen; i += 1) {
                        if (todaOptions[i].value === todaId) {
                            todaLabel = todaOptions[i].label;
                        }
                    }
                    const fullName = formatFullName(firstName, lastName);
                    const addrSummary = formatMemberAddress({
                        Street: street,
                        Barangay: barangay,
                        City_Municipality: city
                    });
                    const previewCard = trProfileCard({
                        name: fullName,
                        leftDetails: [addrSummary, contact],
                        rightDetails: [todaLabel, licNum || "Non-driving member"]
                    });
                    presentSuccessScreen({
                        title: "Member added",
                        subtitle: fullName + " (" + createdId + ") joined " + todaLabel + ".",
                        card: previewCard,
                        buttonLabel: "View member",
                        onDone: function () {
                            replaceTopPage(renderMemberDetailPage, { memberId: createdId });
                        }
                    });
                } catch (err) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove("disabled");
                    saveBtn.textContent = "Done";
                    if (err.message.toLowerCase().indexOf("license") !== -1) {
                        licenseRow.setError(err.message);
                    } else if (err.message.toLowerCase().indexOf("contact") !== -1) {
                        contactRow.setError(err.message);
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

        const coreCard = trListCard([idRow, firstRow, lastRow, streetRow, brgyRow, cityRow, contactRow, todaRow]);
        const coreGroup = trCardGroup({
            headline: "Member details",
            card: coreCard,
            footnote: "Leave Member ID blank to auto-assign the next ID."
        });

        const credCard = trListCard([licenseRow, licExpRow, licTypeRow, restRow, psoRow, blsRow]);
        const credGroup = trCardGroup({
            headline: "Driver credentials (Optional)",
            card: credCard,
            footnote: "Leave blank for pure non-driving operators or officers."
        });

        const formSec = trSection([coreGroup, credGroup]);
        main.appendChild(formSec);
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load TODA groups",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

/* edit member screen */

// params: params (required: { member })
function renderEditMemberPage(params) {
    const safeParams = params || {};
    const member = safeParams.member;
    if (!member) {
        popPage();
        return [];
    }

    const idRow = trPropertyRow({ label: "Member ID", value: member.Member_ID });
    const firstRow = trPropertyRow({ label: "First Name", input: { value: member.First_Name } });
    const lastRow = trPropertyRow({ label: "Last Name", input: { value: member.Last_Name } });
    const streetRow = trPropertyRow({ label: "Street", input: { value: member.Street || "" } });
    const brgyRow = trPropertyRow({ label: "Barangay", input: { value: member.Barangay || "" } });
    const cityRow = trPropertyRow({
        label: "City / Municipality",
        input: { value: member.City_Municipality || DEFAULT_CITY_MUNICIPALITY }
    });
    const contactRow = trPropertyRow({ label: "Contact Number", input: { value: member.Contact_Number || "" } });

    const licenseRow = trPropertyRow({
        label: "License Number",
        input: { value: member.License_Number || "", placeholder: "Optional for non-drivers" }
    });
    const licExpRow = trPropertyRow({
        label: "License Expiry Date",
        input: { value: member.License_Expiry_Date || "", placeholder: "YYYY-MM-DD", maxLength: MEMBER_PAGE_DATE_MAX }
    });
    const licTypeOptions = buildSelectOptions(LICENSE_TYPES, "None");
    const licTypeRow = trPropertyRow({
        label: "License Type",
        select: { value: member.License_Type || "", options: licTypeOptions }
    });
    const restRow = trPropertyRow({
        label: "Restriction Code",
        input: { value: member.Restriction_Code || "", placeholder: "e.g. 1", maxLength: 10 }
    });
    const psoRow = trPropertyRow({
        label: "PSO ID Number",
        input: { value: member.PSO_ID_Number || "", placeholder: "e.g. PSO-2026-001" }
    });
    const blsRow = trPropertyRow({
        label: "BLS Cert ID",
        input: { value: member.BLS_Cert_ID || "", placeholder: "e.g. BLS-2026-001" }
    });

    const saveBtn = trButton({
        label: "Done",
        small: true,
        onClick: async function () {
            const firstName = firstRow.controlEl.value.trim();
            const lastName = lastRow.controlEl.value.trim();
            const street = streetRow.controlEl.value.trim();
            const barangay = brgyRow.controlEl.value.trim();
            const city = cityRow.controlEl.value.trim();
            const contact = contactRow.controlEl.value.trim();
            const licNum = licenseRow.controlEl.value.trim();
            const licExp = licExpRow.controlEl.value.trim();
            const licType = licTypeRow.controlEl.value;
            const restCode = restRow.controlEl.value.trim();
            const psoId = psoRow.controlEl.value.trim();
            const blsId = blsRow.controlEl.value.trim();

            let valid = true;
            firstRow.setError("");
            lastRow.setError("");
            streetRow.setError("");
            brgyRow.setError("");
            cityRow.setError("");
            contactRow.setError("");
            licenseRow.setError("");
            licExpRow.setError("");

            if (!firstName) {
                firstRow.setError("Enter a first name.");
                valid = false;
            }
            if (!lastName) {
                lastRow.setError("Enter a last name.");
                valid = false;
            }
            if (!street) {
                streetRow.setError("Enter a street address.");
                valid = false;
            }
            if (!barangay) {
                brgyRow.setError("Enter a barangay.");
                valid = false;
            }
            if (!city) {
                cityRow.setError("Enter a city or municipality.");
                valid = false;
            }
            if (!contact) {
                contactRow.setError("Enter a contact number.");
                valid = false;
            }
            if (licExp && !isValidIsoDate(licExp)) {
                licExpRow.setError("Use YYYY-MM-DD date format.");
                valid = false;
            }
            if (!valid) {
                return;
            }

            saveBtn.disabled = true;
            saveBtn.classList.add("disabled");
            saveBtn.textContent = "Saving...";

            try {
                await apiUpdateMember(member.Member_ID, {
                    First_Name: firstName,
                    Last_Name: lastName,
                    Street: street,
                    Barangay: barangay,
                    City_Municipality: city,
                    Contact_Number: contact,
                    License_Number: licNum || null,
                    License_Expiry_Date: licExp || null,
                    License_Type: licType || null,
                    Restriction_Code: restCode || null,
                    PSO_ID_Number: psoId || null,
                    BLS_Cert_ID: blsId || null
                });
                popPage();
            } catch (err) {
                saveBtn.disabled = false;
                saveBtn.classList.remove("disabled");
                saveBtn.textContent = "Done";
                licenseRow.setError(err.message);
            }
        }
    });

    const navBar = trNavBar({
        title: "Edit member",
        subtitle: "for " + member.First_Name,
        onBack: popPage,
        actions: [saveBtn]
    });

    const main = trEl("main", "content vbox space-xl");
    const personalCard = trListCard([idRow, firstRow, lastRow, streetRow, brgyRow, cityRow, contactRow]);
    const personalGroup = trCardGroup({
        headline: "Personal record",
        card: personalCard,
        footnote: "To move this member to another TODA, use Transfer TODA group on their detail screen."
    });
    const credCard = trListCard([licenseRow, licExpRow, licTypeRow, restRow, psoRow, blsRow]);
    const credGroup = trCardGroup({
        headline: "Driver credentials",
        card: credCard,
        footnote: "Remove active shift assignments before clearing License Number."
    });

    const formSec = trSection([personalGroup, credGroup]);
    main.appendChild(formSec);
    return [navBar, main];
}
