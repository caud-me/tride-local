/* TODA associations list, detail, and registration screens */

function renderTodasPage(params) {
    const safeParams = params || {};
    let activeTab = safeParams.activeTab || "all";

    const addIcon = trIcon("\uE710", {
        label: "Add TODA",
        onClick: function () {
            pushPage(renderAddTodaPage, {});
        }
    });
    const navBar = trNavBar({
        title: "TODA associations",
        onBack: popPage,
        actions: [addIcon]
    });

    const main = trEl("main", "content vbox gap-m");
    main.appendChild(trBanner("Loading TODA associations..."));

    apiListTodas().then(function (res) {
        main.replaceChildren();
        const todas = res.todas || [];
        if (todas.length === 0) {
            main.appendChild(trEmptyState({
                icon: "\uE82F",
                title: "No TODA associations yet",
                subtitle: "Tap + to register the first TODA group."
            }));
            return;
        }

        const tabPanel = trEl("div", "vbox gap-m");

        function showTab(tabKey) {
            tabPanel.replaceChildren();
            const visibleTodas = [];
            for (let i = 0; i < todas.length; i += 1) {
                const t = todas[i];
                const memberCount = Number(t.Member_Count) || 0;
                if (tabKey === "empty" && memberCount > 0) {
                    continue;
                }
                visibleTodas.push(t);
            }

            if (visibleTodas.length === 0) {
                tabPanel.appendChild(trEmptyState({
                    icon: "\uE82F",
                    title: "No empty TODA associations",
                    subtitle: "Every TODA association has at least one member."
                }));
                return;
            }

            const grid = trEl("div", "vbox gap-m card-grid");
            for (let i = 0; i < visibleTodas.length; i += 1) {
                const t = visibleTodas[i];
                grid.appendChild(buildAssociationCard(t, {
                    onClick: function () {
                        pushPage(renderTodaDetailPage, { todaId: t.TODA_ID });
                    }
                }));
            }
            tabPanel.appendChild(grid);
        }

        const tabs = trTabs({
            equal: true,
            activeKey: activeTab,
            items: [
                { key: "all", label: "All" },
                { key: "empty", label: "Empty TODAs" }
            ],
            onChange: function (nextKey) {
                activeTab = nextKey;
                safeParams.activeTab = nextKey;
                showTab(nextKey);
            }
        });

        showTab(activeTab);
        trAppend(main, [tabs, tabPanel]);
    }).catch(function (err) {
        main.replaceChildren();
        main.appendChild(trBanner(err.message));
    });

    return [navBar, main];
}

function renderTodaDetailPage(params) {
    const navBar = trNavBar({
        title: "TODA details",
        onBack: popPage
    });

    const main = trEl("main", "content vbox gap-m");
    main.appendChild(trBanner("Loading TODA..."));

    Promise.all([
        apiListTodas(),
        apiListMembers({ todaId: params.todaId })
    ]).then(function (results) {
        const todas = results[0].todas || [];
        const members = results[1].members || [];
        let toda = null;
        for (let i = 0; i < todas.length; i += 1) {
            if (todas[i].TODA_ID === params.todaId) {
                toda = todas[i];
            }
        }
        if (!toda) {
            popPage();
            return;
        }

        main.replaceChildren();
        const updatedNav = trNavBar({
            title: toda.TODA_Name,
            onBack: popPage
        });
        navBar.replaceWith(updatedNav);

        const presLabel = toda.President_Member_ID
            ? formatFullName(toda.Pres_First_Name, toda.Pres_Last_Name) + " (" + toda.President_Member_ID + ")"
            : "None — assign from Members below";

        const presRow = trPropertyRow({
            label: "TODA President",
            value: presLabel
        });
        if (toda.President_Member_ID) {
            trBindTap(presRow, function () {
                pushPage(renderMemberDetailPage, { memberId: toda.President_Member_ID });
            });
        }

        const todaInfoRows = [
            trPropertyRow({ label: "TODA ID", value: toda.TODA_ID }),
            trPropertyRow({ label: "Route", value: toda.Route }),
            presRow
        ];
        if (typeof appendExtraColumnRows === "function") {
            appendExtraColumnRows(todaInfoRows, toda, [
                "TODA_ID", "TODA_Name", "Route", "Federation_ID",
                "President_Member_ID", "Pres_First_Name", "Pres_Last_Name", "Member_Count"
            ]);
        }
        main.appendChild(trListCard(todaInfoRows));

        const membersRow = trActionRow({
            label: "Members in " + toda.TODA_Name + " (" + members.length + ")",
            onClick: function () {
                pushPage(renderMembersPage, { scopeTodaId: toda.TODA_ID });
            }
        });
        const unitsRow = trActionRow({
            label: "Units in " + toda.TODA_Name,
            onClick: function () {
                pushPage(renderUnitsPage, { scopeTodaId: toda.TODA_ID, scopeTodaName: toda.TODA_Name });
            }
        });
        main.appendChild(trListCard([membersRow, unitsRow]));

        const removeTodaRow = trActionRow({
            label: "Remove " + toda.TODA_Name,
            critical: true,
            hideChevron: true,
            onClick: function () {
                trConfirm({
                    title: "Remove " + toda.TODA_Name + "?",
                    message: "This association can only be deleted when it has no members and no president.",
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
        main.appendChild(trCard([removeTodaRow]));
    }).catch(function (err) {
        main.replaceChildren();
        main.appendChild(trBanner(err.message));
    });

    return [navBar, main];
}

function renderAddTodaPage() {
    const idRow = trPropertyRow({ label: "TODA ID", input: { placeholder: "e.g. T01" } });
    const nameRow = trPropertyRow({ label: "TODA Name", input: { placeholder: "e.g. Mabolo TODA" } });
    const routeRow = trPropertyRow({ label: "Route", input: { placeholder: "e.g. Mabolo - Centro" } });

    const saveBtn = trButton({
        label: "Done",
        small: true,
        onClick: async function () {
            const payload = {
                TODA_ID: idRow.controlEl.value.trim(),
                TODA_Name: nameRow.controlEl.value.trim(),
                Route: routeRow.controlEl.value.trim()
            };

            idRow.setError(payload.TODA_ID ? "" : "Required");
            nameRow.setError(payload.TODA_Name ? "" : "Required");
            routeRow.setError(payload.Route ? "" : "Required");

            if (!payload.TODA_ID || !payload.TODA_Name || !payload.Route) {
                return;
            }

            try {
                await apiCreateToda(payload);
                const previewCard = buildAssociationCard({
                    TODA_ID: payload.TODA_ID,
                    TODA_Name: payload.TODA_Name,
                    Route: payload.Route,
                    Member_Count: 0
                });
                presentSuccessScreen({
                    badge: "ASSOCIATION",
                    title: "TODA registered",
                    subtitle: payload.TODA_Name + " is now active.",
                    card: previewCard,
                    buttonLabel: "View TODA",
                    onDone: function () {
                        replaceTopPage(renderTodaDetailPage, { todaId: payload.TODA_ID });
                    }
                });
            } catch (err) {
                idRow.setError(err.message);
            }
        }
    });

    const navBar = trNavBar({
        title: "Register TODA",
        onBack: popPage,
        actions: [saveBtn]
    });

    const main = trEl("main", "content vbox gap-m");
    main.appendChild(trListCard([idRow, nameRow, routeRow]));
    return [navBar, main];
}
