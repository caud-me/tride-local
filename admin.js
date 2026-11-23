/* dedicated admin portal for TODA presidents and federation secretary */

function buildPresidentTab(homeData) {
    const toda = homeData.ledToda;
    const statsData = homeData.presidentStats;
    if (!toda || !statsData) {
        return [trEmptyState({
            icon: "\uE82F",
            title: "No TODA assigned",
            subtitle: "Ask the Federation Secretary to assign your TODA leadership role."
        })];
    }

    const stats = trStatGroup([
        { value: String(statsData.memberCount), label: pluralLabel(statsData.memberCount, "member", "members") },
        { value: String(statsData.licensedCount), label: pluralLabel(statsData.licensedCount, "licensed driver", "licensed drivers") },
        { value: String(statsData.unitCount), label: pluralLabel(statsData.unitCount, "tricycle unit", "tricycle units") }
    ]);

    const membersRow = trActionRow({
        label: "Manage my members",
        onClick: function () {
            pushPage(renderMembersPage, { scopeTodaId: toda.TODA_ID, scopeTodaName: toda.TODA_Name });
        }
    });
    const unitsRow = trActionRow({
        label: "Units",
        onClick: function () {
            pushPage(renderUnitsPage, { scopeTodaId: toda.TODA_ID, scopeTodaName: toda.TODA_Name });
        }
    });
    const navGroup = trCardGroup({
        headline: "Management",
        card: trListCard([membersRow, unitsRow]),
        footnote: "Manage members and tricycle units registered under your TODA."
    });
    const items = [stats, navGroup];

    if (typeof renderExportPage === "function") {
        const exportRow = trActionRow({
            label: "Export data (Experimental)",
            onClick: function () {
                pushPage(renderExportPage, {
                    role: "president",
                    scopeTodaId: toda.TODA_ID,
                    scopeTodaName: toda.TODA_Name
                });
            }
        });
        items.push(trCardGroup({
            headline: "Reports",
            card: trListCard([exportRow]),
            footnote: "Download a snapshot of your TODA records as SQL or PDF."
        }));
    }

    return items;
}

function buildSecretaryTab(homeData) {
    const fallbackStats = { todaCount: 0, presidentCount: 0, driverCount: 0, unitCount: 0 };
    const statsData = homeData.secretaryStats || fallbackStats;

    const stats = trStatGroup([
        { value: String(statsData.todaCount), label: pluralLabel(statsData.todaCount, "toda group", "toda groups") },
        { value: String(statsData.driverCount), label: pluralLabel(statsData.driverCount, "driver", "drivers") },
        { value: String(statsData.unitCount), label: pluralLabel(statsData.unitCount, "tricycle unit", "tricycle units") }
    ]);

    const membersRow = trActionRow({
        label: "Manage all members",
        onClick: function () {
            pushPage(renderMembersPage, { scopeTodaId: null });
        }
    });
    const unitsRow = trActionRow({
        label: "All units",
        onClick: function () {
            pushPage(renderUnitsPage, { scopeTodaId: null });
        }
    });
    const todasRow = trActionRow({
        label: "Manage TODA associations",
        onClick: function () {
            pushPage(renderTodasPage, {});
        }
    });

    const navGroup = trCardGroup({
        headline: "Federation",
        card: trListCard([membersRow, unitsRow, todasRow]),
        footnote: "View and manage every member, tricycle unit, and TODA association."
    });
    const items = [stats, navGroup];

    if (typeof renderExportPage === "function") {
        const exportRow = trActionRow({
            label: "Export data (Experimental)",
            onClick: function () {
                pushPage(renderExportPage, {
                    role: "secretary",
                    scopeTodaId: null,
                    scopeTodaName: null
                });
            }
        });
        items.push(trCardGroup({
            headline: "Reports",
            card: trListCard([exportRow]),
            footnote: "Export federation-wide records as SQL or PDF."
        }));
    }

    return items;
}

function renderHomePage(params) {
    const memberId = getSessionMemberId();
    if (!memberId) {
        setRootPage(renderLoginPage, {});
        return [];
    }

    const settingsIcon = trIcon("\uE713", {
        label: "Settings",
        onClick: function () {
            pushPage(renderAdminSettingsPage, {});
        }
    });
    const navActions = [];
    if (typeof createNotificationBellButton === "function") {
        navActions.push(createNotificationBellButton());
    }
    navActions.push(settingsIcon);
    const navBar = trNavBar({
        titleNode: trBrandLogo({ text: "TRIDE", subtext: "ADMIN" }),
        actions: navActions
    });

    const main = trEl("main", "content vbox space-xl");
    main.appendChild(trEl("p", "as-tertiary as-gray", "Loading..."));

    apiGetHome(memberId).then(function (data) {
        main.replaceChildren();
        const member = data.member;

        const allRoles = data.roles || [];
        const adminRoles = [];
        for (let i = 0; i < allRoles.length; i += 1) {
            const roleItem = allRoles[i];
            if (roleItem.key === "president" || roleItem.key === "secretary") {
                adminRoles.push(roleItem);
            }
        }

        if (adminRoles.length === 0) {
            const blockedState = trEmptyState({
                icon: "\uE72E",
                title: "Officer access required",
                subtitle: "This portal is only for TODA Presidents and the Federation Secretary."
            });
            const backBtn = trButton({
                label: "Open Member App",
                onClick: function () {
                    window.location.href = "index.html";
                }
            });
            main.appendChild(trSection([blockedState, backBtn], { flex: true }));
            if (params && typeof params.onReady === "function") {
                params.onReady();
            }
            return;
        }

        const profileCard = trProfileCard({
            firstName: member.First_Name,
            lastName: member.Last_Name,
            address: member.Address,
            contact: member.Contact_Number,
            todaName: member.TODA_Name || "Federation Office",
            license: member.License_Number || "No license"
        });
        const profileSection = trSection([profileCard]);

        let activeRole = params.activeRole || adminRoles[0].key;
        let found = false;
        for (let i = 0; i < adminRoles.length; i += 1) {
            if (adminRoles[i].key === activeRole) {
                found = true;
            }
        }
        if (!found) {
            activeRole = adminRoles[0].key;
        }

        const tabPanel = trEl("div", "vbox flex1 space-l");

        function showTab(roleKey) {
            tabPanel.replaceChildren();
            if (roleKey === "president") {
                trAppend(tabPanel, buildPresidentTab(data));
            } else if (roleKey === "secretary") {
                trAppend(tabPanel, buildSecretaryTab(data));
            }
        }

        const tabs = trTabs({
            items: adminRoles,
            activeKey: activeRole,
            onChange: function (nextKey, tabObj, direction) {
                params.activeRole = nextKey;
                showTab(nextKey);
                trAnimateTabSwitch(tabPanel, direction);
            }
        });

        showTab(activeRole);
        const roleSection = trSection([tabs, tabPanel], { flex: true });
        trAppend(main, [profileSection, roleSection]);
        if (params && typeof params.onReady === "function") {
            params.onReady();
        }
    }).catch(function (err) {
        main.replaceChildren();
        main.appendChild(trSection(trEmptyState({
            icon: "\uE783",
            title: "Could not load admin portal",
            subtitle: err.message
        }), { flex: true }));
        if (err.message.indexOf("not found") !== -1) {
            setSessionMemberId(null);
            setRootPage(renderLoginPage, {});
        }
        if (params && typeof params.onReady === "function") {
            params.onReady();
        }
    });

    return [navBar, main];
}

function renderAdminSettingsPage() {
    const navBar = trNavBar({
        title: "Admin Settings",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const appRow = trActionRow({
        label: "Open Member App",
        onClick: function () {
            window.location.href = "index.html";
        }
    });
    const logoutRow = trActionRow({
        label: "Log out",
        hideChevron: true,
        onClick: function () {
            setSessionMemberId(null);
            setRootPage(renderLoginPage, {});
        }
    });
    main.appendChild(trSection(trCardGroup({
        headline: "Account",
        card: trListCard([appRow, logoutRow]),
        footnote: "Switch back to the member view or sign out of this session."
    })));

    const memberId = getSessionMemberId();
    if (memberId) {
        apiGetHome(memberId).then(function (data) {
            if (!data.isSecretary) {
                return;
            }
            const resetRow = trActionRow({
                label: "Reset & truncate database",
                critical: true,
                hideChevron: true,
                onClick: function () {
                    trConfirm({
                        title: "Truncate all database tables?",
                        message: "This permanently deletes all federations, TODAs, members, and tricycles and restarts from OOBE.",
                        confirmLabel: "Truncate database",
                        critical: true,
                        onConfirm: async function () {
                            try {
                                await apiResetDatabase(memberId);
                                setSessionMemberId(null);
                                setRootPage(renderOobePage, {});
                            } catch (err) {
                                trAlert({ title: "Error", message: err.message });
                            }
                        }
                    });
                }
            });
            main.appendChild(trSection(trCardGroup({
                headline: "Danger zone",
                card: trCard([resetRow]),
                footnote: "Truncating wipes all federation, TODA, member, and unit records permanently."
            })));
        }).catch(function () {
            /* ignore if offline */
        });
    }

    return [navBar, main];
}

async function startAdminApp() {
    try {
        const status = await apiGetStatus();
        if (status.oobeRequired) {
            setSessionMemberId(null);
            setRootPage(renderOobePage, {});
            return;
        }
        const savedId = getSessionMemberId();
        if (savedId) {
            setRootPage(renderHomePage, { activeRole: null });
            return;
        }
        setRootPage(renderLoginPage, {});
    } catch (err) {
        const appRoot = document.getElementById("app");
        appRoot.replaceChildren();
        appRoot.appendChild(trEmptyState({
            icon: "\uE783",
            title: "Cannot reach backend",
            subtitle: err.message
        }));
    }
}

// ive looked up on the internet on this one, DOMContentLoaded wait until HTML elements finish loading before starting the screen
document.addEventListener("DOMContentLoaded", startAdminApp);
