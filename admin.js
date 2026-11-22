/* dedicated admin portal for TODA presidents and federation secretary */

function buildPresidentTab(homeData) {
    const toda = homeData.ledToda;
    const statsData = homeData.presidentStats;
    if (!toda || !statsData) {
        return [trBanner("No TODA assigned.")];
    }

    const stats = trStatGroup([
        { value: String(statsData.memberCount), label: pluralLabel(statsData.memberCount, "member", "members") },
        { value: String(statsData.licensedCount), label: pluralLabel(statsData.licensedCount, "licensed driver", "licensed drivers") },
        { value: String(statsData.unitCount), label: pluralLabel(statsData.unitCount, "tricycle unit", "tricycle units") }
    ]);

    const membersRow = trActionRow({
        label: "Manage my members",
        onClick: function () {
            pushPage(renderMembersPage, { scopeTodaId: toda.TODA_ID });
        }
    });
    const unitsRow = trActionRow({
        label: "Units",
        onClick: function () {
            pushPage(renderUnitsPage, { scopeTodaId: toda.TODA_ID, scopeTodaName: toda.TODA_Name });
        }
    });
    const navCard = trListCard([membersRow, unitsRow]);
    const items = [stats, navCard];

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
        items.push(trListCard([exportRow]));
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

    const navCard = trListCard([membersRow, unitsRow, todasRow]);
    const items = [stats, navCard];

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
        items.push(trListCard([exportRow]));
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

    const main = trEl("main", "content vbox gap-m");
    main.appendChild(trBanner("Loading..."));

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
            trAppend(main, [blockedState, backBtn]);
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

        const tabPanel = trEl("div", "vbox gap-m");

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
            onChange: function (nextKey) {
                params.activeRole = nextKey;
                showTab(nextKey);
            }
        });

        showTab(activeRole);
        trAppend(main, [profileCard, tabs, tabPanel]);
        if (params && typeof params.onReady === "function") {
            params.onReady();
        }
    }).catch(function (err) {
        main.replaceChildren();
        main.appendChild(trBanner(err.message));
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

    const main = trEl("main", "content vbox gap-m");
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
    main.appendChild(trListCard([appRow, logoutRow]));

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
            main.appendChild(trCard([resetRow]));
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
        appRoot.appendChild(trBanner("Cannot reach backend: " + err.message));
    }
}

// ive looked up on the internet on this one, DOMContentLoaded wait until HTML elements finish loading before starting the screen
document.addEventListener("DOMContentLoaded", startAdminApp);
