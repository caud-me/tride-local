/* toda associations, federations, and officer_term board roster screens */

const TODA_PAGE_ID_MAX = 10;
const TODA_PAGE_DATE_MAX = 10;
const TODA_PAGE_DEFAULT_STATUS = "Active";

/* helper for federation card display */

// params: fed (required), onClick (optional)
function buildFederationCard(fed, onClick) {
    const todaCount = Number(fed.todaCount) || 0;
    const todaWord = pluralLabel(todaCount, "TODA", "TODAs");
    const countText = todaCount + " " + todaWord;

    const secLine = trEl("p", "as-tertiary as-gray");
    if (fed.Secretary_Member_ID) {
        const secName = formatFullName(fed.Secretary_First_Name, fed.Secretary_Last_Name);
        const displaySec = secName || fed.Secretary_Member_ID;
        const prefixNode = document.createTextNode("Sec: ");
        const boldNode = trEl("span", "as-bold", displaySec);
        secLine.appendChild(prefixNode);
        secLine.appendChild(boldNode);
    } else {
        secLine.textContent = "No secretary appointed";
    }

    const card = trBrandCard({
        subtext: "FEDERATION",
        big: false,
        topRight: countText,
        title: fed.Federation_Name,
        subtitle: fed.Accreditation_Number + " · exp " + fed.Accreditation_Expiry,
        bottomRight: secLine,
        onClick: onClick
    });
    return card;
}

/* top-level todas and federations hub */

// params: params (optional: { activeTab, todaFilter })
function renderTodasPage(params) {
    const safeParams = params || {};
    let activeTab = safeParams.activeTab || "todas";
    let todaFilter = safeParams.todaFilter || "all";

    const navBar = trNavBar({
        title: "TODAs & federations",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading associations...");
    main.appendChild(loadingText);

    const viewerId = getSessionMemberId();

    Promise.all([
        apiHome(viewerId),
        apiListTodas(),
        apiListFederations()
    ]).then(function (results) {
        const viewerHome = results[0];
        const viewerRoles = viewerHome.roles || {};
        const isSecretary = Boolean(viewerRoles.isSecretary);
        const todas = results[1].todas || [];
        const federations = results[2].federations || [];

        main.replaceChildren();

        if (!isSecretary) {
            activeTab = "todas";
        }

        function updateHeaderActions() {
            const actions = [];
            // based on final_dbms1_active-baseline-and-naga-city-rules.md, FEDERATION, allow secretary to register toda while federation stays accredited by city council
            if (isSecretary && activeTab !== "federations") {
                const addTodaIcon = trIcon("\uE710", {
                    label: "Add TODA",
                    onClick: function () {
                        pushPage(renderAddTodaPage, {});
                    }
                });
                actions.push(addTodaIcon);
            }
            const nextNav = trNavBar({
                title: isSecretary ? "TODAs & federations" : "TODA associations",
                onBack: popPage,
                actions: actions
            });
            const currentNav = document.querySelector(".trNavBar");
            if (currentNav) {
                currentNav.replaceWith(nextNav);
            }
        }

        updateHeaderActions();

        const tabPanel = trEl("div", "vbox flex1 space-l");

        function renderTodasPanel() {
            tabPanel.replaceChildren();

            const filterMenu = trMenu({
                icon: "\uE71C",
                label: "Filter TODAs",
                sections: [{
                    title: "Show TODAs",
                    name: "toda-list-filter",
                    items: [
                        { label: "All TODAs", value: "all", checked: todaFilter === "all" },
                        { label: "Active", value: "Active", checked: todaFilter === "Active" },
                        { label: "Expired", value: "Expired", checked: todaFilter === "Expired" },
                        { label: "Suspended", value: "Suspended", checked: todaFilter === "Suspended" },
                        { label: "Unaffiliated", value: "unaffiliated", checked: todaFilter === "unaffiliated" },
                        { label: "Empty (0 members)", value: "empty", checked: todaFilter === "empty" }
                    ],
                    onChange: function (val) {
                        todaFilter = val;
                        safeParams.todaFilter = val;
                        renderTodasPanel();
                    }
                }]
            });

            const filterRow = trEl("div", "hbox space-l");
            const countLabel = trEl("p", "as-tertiary as-gray push-right", todas.length + " registered");
            filterRow.appendChild(countLabel);
            filterRow.appendChild(filterMenu);
            tabPanel.appendChild(filterRow);

            const visibleTodas = [];
            const todaCount = todas.length;
            for (let i = 0; i < todaCount; i += 1) {
                const t = todas[i];
                const memCount = Number(t.memberCount) || 0;
                if (todaFilter === "empty" && memCount > 0) {
                    continue;
                }
                if (todaFilter === "unaffiliated" && t.Federation_ID) {
                    continue;
                }
                const isStatusFilter = todaFilter === "Active" || todaFilter === "Expired" || todaFilter === "Suspended";
                if (isStatusFilter && t.Association_Status !== todaFilter) {
                    continue;
                }
                visibleTodas.push(t);
            }

            if (visibleTodas.length === 0) {
                let emptySub = "Tap + to register a TODA association.";
                if (todaFilter !== "all") {
                    emptySub = "No TODA matches the active filter.";
                }
                const emptyNode = trEmptyState({
                    icon: "\uE82F",
                    title: "No TODA associations found",
                    subtitle: emptySub
                });
                tabPanel.appendChild(emptyNode);
                return;
            }

            const grid = trEl("div", "card-grid vbox space-l");
            const visLen = visibleTodas.length;
            for (let i = 0; i < visLen; i += 1) {
                const item = visibleTodas[i];
                const card = buildAssociationCard(item, function () {
                    pushPage(renderTodaDetailPage, { todaId: item.TODA_ID });
                });
                grid.appendChild(card);
            }
            tabPanel.appendChild(grid);
        }

        function renderFederationsPanel() {
            tabPanel.replaceChildren();
            if (federations.length === 0) {
                const emptyNode = trEmptyState({
                    icon: "\uE82F",
                    title: "No federations yet",
                    subtitle: "Federations are accredited by the LGU during initial setup."
                });
                tabPanel.appendChild(emptyNode);
                return;
            }

            const grid = trEl("div", "card-grid vbox space-l");
            const fedLen = federations.length;
            for (let i = 0; i < fedLen; i += 1) {
                const fed = federations[i];
                const card = buildFederationCard(fed, function () {
                    pushPage(renderFederationDetailPage, { federationId: fed.Federation_ID });
                });
                grid.appendChild(card);
            }
            tabPanel.appendChild(grid);
        }

        function showTab(tabKey) {
            if (tabKey === "federations" && isSecretary) {
                renderFederationsPanel();
            } else {
                renderTodasPanel();
            }
        }

        if (isSecretary) {
            const tabs = trTabs({
                equal: true,
                activeKey: activeTab,
                items: [
                    { key: "todas", label: "TODAs" },
                    { key: "federations", label: "Federations" }
                ],
                onChange: function (nextKey, tabObj, direction) {
                    activeTab = nextKey;
                    safeParams.activeTab = nextKey;
                    updateHeaderActions();
                    showTab(nextKey);
                    trAnimateTabSwitch(tabPanel, direction);
                }
            });
            showTab(activeTab);
            const hubSection = trSection([tabs, tabPanel], { flex: true });
            main.appendChild(hubSection);
        } else {
            showTab("todas");
            const listSection = trSection([tabPanel], { flex: true });
            main.appendChild(listSection);
        }
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load associations",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

/* federation detail, create, and edit flows */

// params: params (required: { federationId })
function renderFederationDetailPage(params) {
    const safeParams = params || {};
    const navBar = trNavBar({
        title: "Federation details",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading federation...");
    main.appendChild(loadingText);

    const viewerId = getSessionMemberId();

    Promise.all([
        apiGetFederation(safeParams.federationId),
        apiHome(viewerId),
        apiListTodas()
    ]).then(function (results) {
        const fed = results[0].federation;
        const viewerRoles = results[1].roles || {};
        const allTodas = results[2].todas || [];
        const isSecretary = Boolean(viewerRoles.isSecretary);

        main.replaceChildren();

        const navActions = [];
        if (isSecretary) {
            const editIcon = trIcon("\uE70F", {
                label: "Edit federation",
                onClick: function () {
                    pushPage(renderEditFederationPage, { federation: fed });
                }
            });
            navActions.push(editIcon);
        }
        const updatedNav = trNavBar({
            title: "Federation details",
            subtitle: "for " + fed.Federation_Name,
            onBack: popPage,
            actions: navActions
        });
        navBar.replaceWith(updatedNav);

        let secDisplay = "None appointed";
        if (fed.Secretary_Member_ID) {
            const secName = formatFullName(fed.Secretary_First_Name, fed.Secretary_Last_Name);
            secDisplay = secName + " (" + fed.Secretary_Member_ID + ")";
        }

        const fedRows = [
            trPropertyRow({ label: "Federation ID", value: fed.Federation_ID }),
            trPropertyRow({ label: "Accreditation Number", value: fed.Accreditation_Number }),
            trPropertyRow({ label: "Accreditation Expiry", value: fed.Accreditation_Expiry }),
            trPropertyRow({ label: "Office Address", value: fed.Office_Address }),
            trPropertyRow({ label: "Appointed Secretary", value: secDisplay })
        ];
        const fedCard = trListCard(fedRows);
        const fedGroup = trCardGroup({
            headline: "Federation profile",
            card: fedCard,
            footnote: "Official accreditation and appointed secretary record."
        });

        const topItems = [fedGroup];

        const linkedTodas = [];
        const allTodaCount = allTodas.length;
        for (let i = 0; i < allTodaCount; i += 1) {
            const candidate = allTodas[i];
            if (candidate.Federation_ID === fed.Federation_ID) {
                linkedTodas.push(candidate);
            }
        }
        if (linkedTodas.length > 0) {
            const todaCards = [];
            const tLen = linkedTodas.length;
            for (let i = 0; i < tLen; i += 1) {
                const t = linkedTodas[i];
                const card = buildAssociationCard(t, function () {
                    pushPage(renderTodaDetailPage, { todaId: t.TODA_ID });
                });
                todaCards.push(card);
            }
            const todaStack = trCardStack({
                heading: "Affiliated TODAs (" + linkedTodas.length + ")",
                cards: todaCards
            });
            topItems.push(todaStack);
        }

        const topSec = trSection(topItems);
        main.appendChild(topSec);
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load federation",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

// params: none
function renderAddFederationPage() {
    const navBar = trNavBar({
        title: "Register federation",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading members...");
    main.appendChild(loadingText);

    apiListMembers({}).then(function (memRes) {
        main.replaceChildren();
        const members = memRes.members || [];
        const secOptions = [{ label: "None (Appoint later)", value: "" }];
        const memCount = members.length;
        for (let i = 0; i < memCount; i += 1) {
            const m = members[i];
            const fullName = formatFullName(m.First_Name, m.Last_Name);
            secOptions.push({ label: fullName + " (" + m.Member_ID + ")", value: m.Member_ID });
        }

        const idRow = trPropertyRow({
            label: "Federation ID (Optional)",
            input: { placeholder: "Auto or e.g. FED-06", maxLength: TODA_PAGE_ID_MAX }
        });
        const nameRow = trPropertyRow({
            label: "Federation Name",
            input: { placeholder: "e.g. West Naga TODA Federation" }
        });
        const accredNoRow = trPropertyRow({
            label: "Accreditation Number",
            input: { placeholder: "e.g. SP-RES-2026-630" }
        });
        const accredExpRow = trPropertyRow({
            label: "Accreditation Expiry",
            input: { placeholder: "YYYY-MM-DD", maxLength: TODA_PAGE_DATE_MAX }
        });
        const officeRow = trPropertyRow({
            label: "Office Address",
            input: { placeholder: "e.g. Magsaysay Ave., Naga City" }
        });
        const secRow = trPropertyRow({
            label: "Appointed Secretary",
            select: { value: "", options: secOptions }
        });

        const saveBtn = trButton({
            label: "Done",
            small: true,
            onClick: async function () {
                const fedId = idRow.controlEl.value.trim();
                const fedName = nameRow.controlEl.value.trim();
                const accrNum = accredNoRow.controlEl.value.trim();
                const accrExp = accredExpRow.controlEl.value.trim();
                const office = officeRow.controlEl.value.trim();
                const secId = secRow.controlEl.value;

                let valid = true;
                idRow.setError("");
                nameRow.setError("");
                accredNoRow.setError("");
                accredExpRow.setError("");
                officeRow.setError("");

                if (!fedName) {
                    nameRow.setError("Enter a federation name.");
                    valid = false;
                }
                if (!accrNum) {
                    accredNoRow.setError("Enter an accreditation number.");
                    valid = false;
                }
                if (!isValidIsoDate(accrExp)) {
                    accredExpRow.setError("Use YYYY-MM-DD date format.");
                    valid = false;
                }
                if (!office) {
                    officeRow.setError("Enter an office address.");
                    valid = false;
                }
                if (!valid) {
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.classList.add("disabled");
                saveBtn.textContent = "Saving...";

                try {
                    const res = await apiCreateFederation({
                        Federation_ID: fedId,
                        Federation_Name: fedName,
                        Accreditation_Number: accrNum,
                        Accreditation_Expiry: accrExp,
                        Office_Address: office,
                        Secretary_Member_ID: secId || null
                    });
                    const createdId = res.Federation_ID;
                    const previewCard = buildFederationCard({
                        Federation_ID: createdId,
                        Federation_Name: fedName,
                        Accreditation_Number: accrNum,
                        Accreditation_Expiry: accrExp,
                        todaCount: 0,
                        Secretary_Member_ID: secId || null
                    });
                    presentSuccessScreen({
                        title: "Federation registered",
                        subtitle: fedName + " is now saved.",
                        card: previewCard,
                        buttonLabel: "View federation",
                        onDone: function () {
                            replaceTopPage(renderFederationDetailPage, { federationId: createdId });
                        }
                    });
                } catch (err) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove("disabled");
                    saveBtn.textContent = "Done";
                    nameRow.setError(err.message);
                }
            }
        });

        const updatedNav = trNavBar({
            title: "Register federation",
            onBack: popPage,
            actions: [saveBtn]
        });
        navBar.replaceWith(updatedNav);

        const formCard = trListCard([idRow, nameRow, accredNoRow, accredExpRow, officeRow, secRow]);
        const formGroup = trCardGroup({
            headline: "New federation",
            card: formCard,
            footnote: "Leave Federation ID blank to auto-assign the next ID."
        });
        const formSec = trSection(formGroup);
        main.appendChild(formSec);
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load form",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

// params: params (required: { federation })
function renderEditFederationPage(params) {
    const safeParams = params || {};
    const fed = safeParams.federation;
    if (!fed) {
        popPage();
        return [];
    }

    const navBar = trNavBar({
        title: "Edit federation",
        subtitle: "for " + fed.Federation_Name,
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading members...");
    main.appendChild(loadingText);

    apiListMembers({}).then(function (memRes) {
        main.replaceChildren();
        const members = memRes.members || [];
        const secOptions = [{ label: "None (Unappointed)", value: "" }];
        const memCount = members.length;
        for (let i = 0; i < memCount; i += 1) {
            const m = members[i];
            const fullName = formatFullName(m.First_Name, m.Last_Name);
            secOptions.push({ label: fullName + " (" + m.Member_ID + ")", value: m.Member_ID });
        }

        const idRow = trPropertyRow({ label: "Federation ID", value: fed.Federation_ID });
        const nameRow = trPropertyRow({ label: "Federation Name", input: { value: fed.Federation_Name } });
        const accredNoRow = trPropertyRow({ label: "Accreditation Number", input: { value: fed.Accreditation_Number } });
        const accredExpRow = trPropertyRow({
            label: "Accreditation Expiry",
            input: { value: fed.Accreditation_Expiry, placeholder: "YYYY-MM-DD", maxLength: TODA_PAGE_DATE_MAX }
        });
        const officeRow = trPropertyRow({ label: "Office Address", input: { value: fed.Office_Address } });
        const secRow = trPropertyRow({
            label: "Appointed Secretary",
            select: { value: fed.Secretary_Member_ID || "", options: secOptions }
        });

        const saveBtn = trButton({
            label: "Done",
            small: true,
            onClick: async function () {
                const fedName = nameRow.controlEl.value.trim();
                const accrNum = accredNoRow.controlEl.value.trim();
                const accrExp = accredExpRow.controlEl.value.trim();
                const office = officeRow.controlEl.value.trim();
                const secId = secRow.controlEl.value;

                let valid = true;
                nameRow.setError("");
                accredNoRow.setError("");
                accredExpRow.setError("");
                officeRow.setError("");

                if (!fedName) {
                    nameRow.setError("Enter a federation name.");
                    valid = false;
                }
                if (!accrNum) {
                    accredNoRow.setError("Enter an accreditation number.");
                    valid = false;
                }
                if (!isValidIsoDate(accrExp)) {
                    accredExpRow.setError("Use YYYY-MM-DD date format.");
                    valid = false;
                }
                if (!office) {
                    officeRow.setError("Enter an office address.");
                    valid = false;
                }
                if (!valid) {
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.classList.add("disabled");
                saveBtn.textContent = "Saving...";

                try {
                    await apiUpdateFederation(fed.Federation_ID, {
                        Federation_Name: fedName,
                        Accreditation_Number: accrNum,
                        Accreditation_Expiry: accrExp,
                        Office_Address: office,
                        Secretary_Member_ID: secId || null
                    });
                    popPage();
                } catch (err) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove("disabled");
                    saveBtn.textContent = "Done";
                    nameRow.setError(err.message);
                }
            }
        });

        const updatedNav = trNavBar({
            title: "Edit federation",
            subtitle: "for " + fed.Federation_Name,
            onBack: popPage,
            actions: [saveBtn]
        });
        navBar.replaceWith(updatedNav);

        const formCard = trListCard([idRow, nameRow, accredNoRow, accredExpRow, officeRow, secRow]);
        const formGroup = trCardGroup({
            headline: "Federation details",
            card: formCard,
            footnote: "Each member can be appointed secretary of at most one federation."
        });
        const formSec = trSection(formGroup);
        main.appendChild(formSec);
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load form",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

/* officer term create and edit sheets */

// params: toda (required), sameTodaMembers (required), isSecretary (required), onSaved (required)
function openCreateOfficerTermSheet(toda, sameTodaMembers, isSecretary, onSaved) {
    let sheetCtrl = null;
    const memberOptions = [];
    const memCount = sameTodaMembers.length;
    for (let i = 0; i < memCount; i += 1) {
        const m = sameTodaMembers[i];
        const fullName = formatFullName(m.First_Name, m.Last_Name);
        memberOptions.push({ label: fullName + " (" + m.Member_ID + ")", value: m.Member_ID });
    }

    if (memberOptions.length === 0) {
        trAlert({
            title: "No members in this TODA",
            message: "Register a member in " + toda.TODA_Name + " first. Every officer must belong to the same TODA."
        });
        return;
    }

    // based on final_dbms1_relational-model.md, OFFICER_TERM, limit president seat creation to federation secretary
    const allowedPositions = [];
    const posCount = OFFICER_POSITIONS.length;
    for (let i = 0; i < posCount; i += 1) {
        const pos = OFFICER_POSITIONS[i];
        if (pos === "President" && !isSecretary) {
            continue;
        }
        allowedPositions.push(pos);
    }
    const posOptions = buildSelectOptions(allowedPositions);

    const termIdRow = trPropertyRow({
        label: "Term ID (Optional)",
        input: { placeholder: "Auto or e.g. TERM-06", maxLength: TODA_PAGE_ID_MAX }
    });
    const memberRow = trPropertyRow({
        label: "TODA Member",
        select: { value: memberOptions[0].value, options: memberOptions }
    });
    const positionRow = trPropertyRow({
        label: "Position",
        select: { value: posOptions[0].value, options: posOptions }
    });
    const startRow = trPropertyRow({
        label: "Term Start",
        input: { placeholder: "YYYY-MM-DD", maxLength: TODA_PAGE_DATE_MAX }
    });
    const endRow = trPropertyRow({
        label: "Term End",
        input: { placeholder: "YYYY-MM-DD", maxLength: TODA_PAGE_DATE_MAX }
    });

    const formCard = trListCard([termIdRow, memberRow, positionRow, startRow, endRow]);

    const saveBtn = trButton({
        label: "Save officer term",
        variant: "primary",
        onClick: async function () {
            const termId = termIdRow.controlEl.value.trim();
            const memberId = memberRow.controlEl.value;
            const position = positionRow.controlEl.value;
            const termStart = startRow.controlEl.value.trim();
            const termEnd = endRow.controlEl.value.trim();

            let valid = true;
            startRow.setError("");
            endRow.setError("");
            termIdRow.setError("");

            if (!isValidIsoDate(termStart)) {
                startRow.setError("Use YYYY-MM-DD date format.");
                valid = false;
            }
            if (!isValidIsoDate(termEnd)) {
                endRow.setError("Use YYYY-MM-DD date format.");
                valid = false;
            }
            if (valid && termEnd < termStart) {
                endRow.setError("Term end date must be on or after start date.");
                valid = false;
            }
            if (!valid) {
                return;
            }

            saveBtn.disabled = true;
            saveBtn.classList.add("disabled");
            saveBtn.textContent = "Saving...";

            try {
                await apiCreateOfficerTerm({
                    Term_ID: termId,
                    Member_ID: memberId,
                    TODA_ID: toda.TODA_ID,
                    Position: position,
                    Term_Start: termStart,
                    Term_End: termEnd
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
                saveBtn.textContent = "Save officer term";
                endRow.setError(err.message);
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
        title: "Add officer term",
        description: "Assign an elected board seat for " + toda.TODA_Name + ".",
        body: [formCard],
        footer: [saveBtn, cancelBtn],
        removeOnClose: true
    });
    sheetCtrl.open();
}

// params: term (required), toda (required), sameTodaMembers (required), isSecretary (required), canEdit (required), onSaved (required)
function openEditOfficerTermSheet(term, toda, sameTodaMembers, isSecretary, canEdit, onSaved) {
    let sheetCtrl = null;
    const isPresTerm = term.Position === "President";
    const allowedModify = canEdit && (!isPresTerm || isSecretary);
    const fullName = formatFullName(term.First_Name, term.Last_Name);

    if (!allowedModify) {
        const readRows = [
            trPropertyRow({ label: "Term ID", value: term.Term_ID }),
            trPropertyRow({ label: "Officer", value: fullName + " (" + term.Member_ID + ")" }),
            trPropertyRow({ label: "Position", value: term.Position }),
            trPropertyRow({ label: "Term Dates", value: term.Term_Start + " to " + term.Term_End }),
            trPropertyRow({ label: "Status", value: term.isActive ? "Active" : "Ended / Scheduled" })
        ];
        const readCard = trListCard(readRows);
        const closeBtn = trButton({
            label: "Close",
            onClick: function () {
                if (sheetCtrl) {
                    sheetCtrl.close();
                }
            }
        });
        sheetCtrl = trSheet({
            title: "Officer term details",
            description: isPresTerm ? "Only the Federation Secretary can modify a TODA President term." : "View-only board record.",
            body: [readCard],
            footer: [closeBtn],
            removeOnClose: true
        });
        sheetCtrl.open();
        return;
    }

    const memberOptions = [];
    const memCount = sameTodaMembers.length;
    for (let i = 0; i < memCount; i += 1) {
        const m = sameTodaMembers[i];
        const mName = formatFullName(m.First_Name, m.Last_Name);
        memberOptions.push({ label: mName + " (" + m.Member_ID + ")", value: m.Member_ID });
    }

    const allowedPositions = [];
    const posCount = OFFICER_POSITIONS.length;
    for (let i = 0; i < posCount; i += 1) {
        const pos = OFFICER_POSITIONS[i];
        if (pos === "President" && !isSecretary) {
            continue;
        }
        allowedPositions.push(pos);
    }
    const posOptions = buildSelectOptions(allowedPositions);

    const idRow = trPropertyRow({ label: "Term ID", value: term.Term_ID });
    const memberRow = trPropertyRow({
        label: "TODA Member",
        select: { value: term.Member_ID, options: memberOptions }
    });
    const positionRow = trPropertyRow({
        label: "Position",
        select: { value: term.Position, options: posOptions }
    });
    const startRow = trPropertyRow({
        label: "Term Start",
        input: { value: term.Term_Start, placeholder: "YYYY-MM-DD", maxLength: TODA_PAGE_DATE_MAX }
    });
    const endRow = trPropertyRow({
        label: "Term End",
        input: { value: term.Term_End, placeholder: "YYYY-MM-DD", maxLength: TODA_PAGE_DATE_MAX }
    });

    const formCard = trListCard([idRow, memberRow, positionRow, startRow, endRow]);

    const saveBtn = trButton({
        label: "Save changes",
        variant: "primary",
        onClick: async function () {
            const memberId = memberRow.controlEl.value;
            const position = positionRow.controlEl.value;
            const termStart = startRow.controlEl.value.trim();
            const termEnd = endRow.controlEl.value.trim();

            let valid = true;
            startRow.setError("");
            endRow.setError("");

            if (!isValidIsoDate(termStart)) {
                startRow.setError("Use YYYY-MM-DD date format.");
                valid = false;
            }
            if (!isValidIsoDate(termEnd)) {
                endRow.setError("Use YYYY-MM-DD date format.");
                valid = false;
            }
            if (valid && termEnd < termStart) {
                endRow.setError("Term end date must be on or after start date.");
                valid = false;
            }
            if (!valid) {
                return;
            }

            saveBtn.disabled = true;
            saveBtn.classList.add("disabled");
            saveBtn.textContent = "Saving...";

            try {
                await apiUpdateOfficerTerm(term.Term_ID, {
                    Member_ID: memberId,
                    TODA_ID: toda.TODA_ID,
                    Position: position,
                    Term_Start: termStart,
                    Term_End: termEnd
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
                saveBtn.textContent = "Save changes";
                endRow.setError(err.message);
            }
        }
    });

    const deleteBtn = trButton({
        label: "Remove officer term",
        critical: true,
        onClick: function () {
            if (sheetCtrl) {
                sheetCtrl.close();
            }
            trConfirm({
                title: "Remove " + term.Position + " term?",
                message: "Delete term " + term.Term_ID + " for " + fullName + "?",
                confirmLabel: "Remove term",
                critical: true,
                onConfirm: async function () {
                    try {
                        await apiDeleteOfficerTerm(term.Term_ID);
                        if (onSaved) {
                            onSaved();
                        }
                    } catch (err) {
                        trAlert({ title: "Cannot remove term", message: err.message });
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
        title: "Edit officer term",
        description: toda.TODA_Name + " · " + term.Term_ID,
        body: [formCard],
        footer: [saveBtn, deleteBtn, cancelBtn],
        removeOnClose: true
    });
    sheetCtrl.open();
}

/* toda detail, create, and edit flows */

// params: params (required: { todaId })
function renderTodaDetailPage(params) {
    const safeParams = params || {};
    const navBar = trNavBar({
        title: "TODA details",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading TODA...");
    main.appendChild(loadingText);

    const viewerId = getSessionMemberId();

    Promise.all([
        apiGetToda(safeParams.todaId),
        apiListMembers({ todaId: safeParams.todaId }),
        apiHome(viewerId)
    ]).then(function (results) {
        const toda = results[0].toda;
        const members = results[1].members || [];
        const viewerRoles = results[2].roles || {};
        const isSecretary = Boolean(viewerRoles.isSecretary);
        const isSameTodaPres = Boolean(viewerRoles.isPresident && viewerRoles.officerTodaId === toda.TODA_ID);
        const canEditToda = isSecretary || isSameTodaPres;
        const canManageBoard = isSecretary || isSameTodaPres;

        main.replaceChildren();

        const navActions = [];
        if (canEditToda) {
            const editIcon = trIcon("\uE70F", {
                label: "Edit TODA",
                onClick: function () {
                    pushPage(renderEditTodaPage, { toda: toda, isSecretary: isSecretary });
                }
            });
            navActions.push(editIcon);
        }
        const updatedNav = trNavBar({
            title: "TODA details",
            subtitle: "for " + toda.TODA_Name,
            onBack: popPage,
            actions: navActions
        });
        navBar.replaceWith(updatedNav);

        let fedDisplay = "None (Unaffiliated)";
        if (toda.Federation_ID) {
            fedDisplay = toda.federationName ? (toda.federationName + " (" + toda.Federation_ID + ")") : toda.Federation_ID;
        }

        const todaInfoRows = [
            trPropertyRow({ label: "TODA ID", value: toda.TODA_ID }),
            trPropertyRow({ label: "Route", value: toda.Route }),
            trPropertyRow({ label: "SEC Reg. Number", value: toda.SEC_Reg_Number }),
            trPropertyRow({ label: "Terminal Location", value: toda.Terminal_Location }),
            trPropertyRow({ label: "Accreditation Expiry", value: toda.Accreditation_Expiry }),
            trPropertyRow({ label: "Status", value: toda.Association_Status }),
            trPropertyRow({ label: "Federation", value: fedDisplay })
        ];
        const detailsCard = trListCard(todaInfoRows);
        const detailsGroup = trCardGroup({
            headline: "Association details",
            card: detailsCard,
            footnote: "City accreditation and SEC registration record for this association."
        });

        const membersRow = trActionRow({
            label: "Members in " + toda.TODA_Name + " (" + members.length + ")",
            onClick: function () {
                pushPage(renderMembersPage, {
                    scopeTodaId: toda.TODA_ID,
                    scopeTodaName: toda.TODA_Name
                });
            }
        });
        const unitsRow = trActionRow({
            label: "Units in " + toda.TODA_Name + " (" + (Number(toda.unitCount) || 0) + ")",
            onClick: function () {
                pushPage(renderUnitsPage, {
                    scopeTodaId: toda.TODA_ID,
                    scopeTodaName: toda.TODA_Name
                });
            }
        });
        const dirCard = trListCard([membersRow, unitsRow]);
        const directoryGroup = trCardGroup({
            headline: "Directory",
            card: dirCard,
            footnote: "Browse members and tricycle units registered under this association."
        });

        const topSec = trSection([detailsGroup, directoryGroup]);
        main.appendChild(topSec);

        // based on final_dbms1_relational-model.md, OFFICER_TERM, list elected board roster with term dates and external add action
        const officerTerms = toda.officerTerms || [];
        const boardItems = [];
        if (officerTerms.length === 0) {
            const emptyBoard = trListItem({
                title: "No officer terms recorded",
                subtitle: "Add a TODA officer term to assign board positions."
            });
            const emptyBoardCard = trListCard([emptyBoard]);
            const emptyBoardGroup = trCardGroup({
                headline: "Officer board",
                card: emptyBoardCard,
                footnote: "Every elected officer must belong to " + toda.TODA_Name + "."
            });
            boardItems.push(emptyBoardGroup);
        } else {
            const termRows = [];
            const tLen = officerTerms.length;
            for (let i = 0; i < tLen; i += 1) {
                const term = officerTerms[i];
                const memName = formatFullName(term.First_Name, term.Last_Name);
                let stateTag = "Ended / Scheduled";
                if (term.isActive) {
                    stateTag = "Active";
                }
                const subLine = memName + " (" + term.Member_ID + ") · " + term.Term_Start + " to " + term.Term_End + " · " + stateTag;
                const row = trActionRow({
                    label: term.Position,
                    subtitle: subLine,
                    onClick: function () {
                        openEditOfficerTermSheet(term, toda, members, isSecretary, canManageBoard, refreshPage);
                    }
                });
                termRows.push(row);
            }
            const boardCard = trListCard(termRows);
            const boardGroup = trCardGroup({
                headline: "Officer board (" + officerTerms.length + ")",
                card: boardCard,
                footnote: "Tap an officer term to review, edit, or end it."
            });
            boardItems.push(boardGroup);
        }

        if (canManageBoard) {
            const addTermBtn = trButton({
                label: "Add officer term",
                onClick: function () {
                    openCreateOfficerTermSheet(toda, members, isSecretary, refreshPage);
                }
            });
            boardItems.push(addTermBtn);
        }

        const boardSec = trSection(boardItems);
        main.appendChild(boardSec);

        if (isSecretary) {
            const hasMembers = members.length > 0;
            const removeTodaRow = trActionRow({
                label: "Remove " + toda.TODA_Name,
                critical: true,
                disabled: hasMembers,
                hideChevron: true,
                onClick: function () {
                    trConfirm({
                        title: "Remove " + toda.TODA_Name + "?",
                        message: "This association can only be deleted when zero members belong to it.",
                        confirmLabel: "Remove TODA",
                        critical: true,
                        onConfirm: async function () {
                            try {
                                await apiDeleteToda(toda.TODA_ID);
                                popPage();
                            } catch (err) {
                                trAlert({ title: "Cannot remove TODA", message: err.message });
                            }
                        }
                    });
                }
            });
            const dangerCard = trCard([removeTodaRow]);
            let dangerFoot = "Removing this TODA deletes its association record permanently.";
            if (hasMembers) {
                dangerFoot = "Transfer or erase all " + members.length + " members before deleting this TODA.";
            }
            const dangerGroup = trCardGroup({
                headline: "Danger zone",
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
            title: "Could not load TODA",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

// params: none
function renderAddTodaPage() {
    const navBar = trNavBar({
        title: "Register TODA",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading federations...");
    main.appendChild(loadingText);

    apiListFederations().then(function (fedRes) {
        main.replaceChildren();
        const feds = fedRes.federations || [];
        const fedOptions = [{ label: "None (Unaffiliated)", value: "" }];
        const fedCount = feds.length;
        for (let i = 0; i < fedCount; i += 1) {
            const f = feds[i];
            fedOptions.push({ label: f.Federation_Name + " (" + f.Federation_ID + ")", value: f.Federation_ID });
        }

        const idRow = trPropertyRow({
            label: "TODA ID (Optional)",
            input: { placeholder: "Auto or e.g. TODA-06", maxLength: TODA_PAGE_ID_MAX }
        });
        const nameRow = trPropertyRow({ label: "TODA Name", input: { placeholder: "e.g. Mabolo TODA" } });
        const routeRow = trPropertyRow({ label: "Route", input: { placeholder: "e.g. Mabolo - Centro" } });
        const secRegRow = trPropertyRow({ label: "SEC Reg. Number", input: { placeholder: "e.g. SEC-CN202600106" } });
        const terminalRow = trPropertyRow({ label: "Terminal Location", input: { placeholder: "e.g. SM City Naga Terminal" } });
        const accrExpRow = trPropertyRow({
            label: "Accreditation Expiry",
            input: { placeholder: "YYYY-MM-DD", maxLength: TODA_PAGE_DATE_MAX }
        });
        const statusOptions = buildSelectOptions(ASSOCIATION_STATUSES);
        const statusRow = trPropertyRow({
            label: "Association Status",
            select: { value: TODA_PAGE_DEFAULT_STATUS, options: statusOptions }
        });
        const fedRow = trPropertyRow({
            label: "Federation Affiliation",
            select: { value: feds.length > 0 ? feds[0].Federation_ID : "", options: fedOptions }
        });

        const saveBtn = trButton({
            label: "Done",
            small: true,
            onClick: async function () {
                const todaId = idRow.controlEl.value.trim();
                const todaName = nameRow.controlEl.value.trim();
                const route = routeRow.controlEl.value.trim();
                const secReg = secRegRow.controlEl.value.trim();
                const terminal = terminalRow.controlEl.value.trim();
                const accrExp = accrExpRow.controlEl.value.trim();
                const status = statusRow.controlEl.value;
                const fedId = fedRow.controlEl.value;

                let valid = true;
                nameRow.setError("");
                routeRow.setError("");
                secRegRow.setError("");
                terminalRow.setError("");
                accrExpRow.setError("");

                if (!todaName) {
                    nameRow.setError("Enter a TODA name.");
                    valid = false;
                }
                if (!route) {
                    routeRow.setError("Enter a route.");
                    valid = false;
                }
                if (!secReg) {
                    secRegRow.setError("Enter the SEC registration number.");
                    valid = false;
                }
                if (!terminal) {
                    terminalRow.setError("Enter a terminal location.");
                    valid = false;
                }
                if (!isValidIsoDate(accrExp)) {
                    accrExpRow.setError("Use YYYY-MM-DD date format.");
                    valid = false;
                }
                if (!valid) {
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.classList.add("disabled");
                saveBtn.textContent = "Saving...";

                try {
                    const res = await apiCreateToda({
                        TODA_ID: todaId,
                        TODA_Name: todaName,
                        Route: route,
                        SEC_Reg_Number: secReg,
                        Terminal_Location: terminal,
                        Accreditation_Expiry: accrExp,
                        Association_Status: status,
                        Federation_ID: fedId || null
                    });
                    const createdId = res.TODA_ID;
                    const previewCard = buildAssociationCard({
                        TODA_ID: createdId,
                        TODA_Name: todaName,
                        Route: route,
                        Association_Status: status,
                        memberCount: 0,
                        unitCount: 0,
                        president: null
                    });
                    presentSuccessScreen({
                        title: "TODA registered",
                        subtitle: todaName + " is now active.",
                        card: previewCard,
                        buttonLabel: "View TODA",
                        onDone: function () {
                            replaceTopPage(renderTodaDetailPage, { todaId: createdId });
                        }
                    });
                } catch (err) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove("disabled");
                    saveBtn.textContent = "Done";
                    nameRow.setError(err.message);
                }
            }
        });

        const updatedNav = trNavBar({
            title: "Register TODA",
            onBack: popPage,
            actions: [saveBtn]
        });
        navBar.replaceWith(updatedNav);

        const formCard = trListCard([idRow, nameRow, routeRow, secRegRow, terminalRow, accrExpRow, statusRow, fedRow]);
        const formGroup = trCardGroup({
            headline: "New association",
            card: formCard,
            footnote: "Federation affiliation can be left as None for newly chartered TODAs."
        });
        const formSec = trSection(formGroup);
        main.appendChild(formSec);
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load form",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}

// params: params (required: { toda, isSecretary })
function renderEditTodaPage(params) {
    const safeParams = params || {};
    const toda = safeParams.toda;
    const isSecretary = Boolean(safeParams.isSecretary);
    if (!toda) {
        popPage();
        return [];
    }

    const navBar = trNavBar({
        title: "Edit TODA",
        subtitle: "for " + toda.TODA_Name,
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading details...");
    main.appendChild(loadingText);

    apiListFederations().then(function (fedRes) {
        main.replaceChildren();
        const feds = fedRes.federations || [];
        const fedOptions = [{ label: "None (Unaffiliated)", value: "" }];
        const fedCount = feds.length;
        for (let i = 0; i < fedCount; i += 1) {
            const f = feds[i];
            fedOptions.push({ label: f.Federation_Name + " (" + f.Federation_ID + ")", value: f.Federation_ID });
        }

        const idRow = trPropertyRow({ label: "TODA ID", value: toda.TODA_ID });
        const nameRow = trPropertyRow({ label: "TODA Name", input: { value: toda.TODA_Name } });
        const routeRow = trPropertyRow({ label: "Route", input: { value: toda.Route } });
        const secRegRow = trPropertyRow({ label: "SEC Reg. Number", input: { value: toda.SEC_Reg_Number } });
        const terminalRow = trPropertyRow({ label: "Terminal Location", input: { value: toda.Terminal_Location } });
        const accrExpRow = trPropertyRow({
            label: "Accreditation Expiry",
            input: { value: toda.Accreditation_Expiry, placeholder: "YYYY-MM-DD", maxLength: TODA_PAGE_DATE_MAX }
        });
        const statusOptions = buildSelectOptions(ASSOCIATION_STATUSES);
        const statusRow = trPropertyRow({
            label: "Association Status",
            select: { value: toda.Association_Status || TODA_PAGE_DEFAULT_STATUS, options: statusOptions }
        });
        const fedRow = trPropertyRow({
            label: "Federation Affiliation",
            select: { value: toda.Federation_ID || "", options: fedOptions, disabled: !isSecretary }
        });

        const saveBtn = trButton({
            label: "Done",
            small: true,
            onClick: async function () {
                const todaName = nameRow.controlEl.value.trim();
                const route = routeRow.controlEl.value.trim();
                const secReg = secRegRow.controlEl.value.trim();
                const terminal = terminalRow.controlEl.value.trim();
                const accrExp = accrExpRow.controlEl.value.trim();
                const status = statusRow.controlEl.value;
                const fedId = fedRow.controlEl.value;

                let valid = true;
                nameRow.setError("");
                routeRow.setError("");
                secRegRow.setError("");
                terminalRow.setError("");
                accrExpRow.setError("");

                if (!todaName) {
                    nameRow.setError("Enter a TODA name.");
                    valid = false;
                }
                if (!route) {
                    routeRow.setError("Enter a route.");
                    valid = false;
                }
                if (!secReg) {
                    secRegRow.setError("Enter the SEC registration number.");
                    valid = false;
                }
                if (!terminal) {
                    terminalRow.setError("Enter a terminal location.");
                    valid = false;
                }
                if (!isValidIsoDate(accrExp)) {
                    accrExpRow.setError("Use YYYY-MM-DD date format.");
                    valid = false;
                }
                if (!valid) {
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.classList.add("disabled");
                saveBtn.textContent = "Saving...";

                const payload = {
                    TODA_Name: todaName,
                    Route: route,
                    SEC_Reg_Number: secReg,
                    Terminal_Location: terminal,
                    Accreditation_Expiry: accrExp,
                    Association_Status: status
                };
                if (isSecretary) {
                    payload.Federation_ID = fedId || null;
                }

                try {
                    await apiUpdateToda(toda.TODA_ID, payload);
                    popPage();
                } catch (err) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove("disabled");
                    saveBtn.textContent = "Done";
                    nameRow.setError(err.message);
                }
            }
        });

        const updatedNav = trNavBar({
            title: "Edit TODA",
            subtitle: "for " + toda.TODA_Name,
            onBack: popPage,
            actions: [saveBtn]
        });
        navBar.replaceWith(updatedNav);

        const formCard = trListCard([idRow, nameRow, routeRow, secRegRow, terminalRow, accrExpRow, statusRow, fedRow]);
        let footnoteText = "Only the Federation Secretary can change federation affiliation.";
        if (isSecretary) {
            footnoteText = "Changes save directly to the association record.";
        }
        const formGroup = trCardGroup({
            headline: "Association details",
            card: formCard,
            footnote: footnoteText
        });
        const formSec = trSection(formGroup);
        main.appendChild(formSec);
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load form",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
    });

    return [navBar, main];
}
