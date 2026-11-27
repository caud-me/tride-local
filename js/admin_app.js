/* dedicated admin portal for TODA board officers and federation secretary */

const TRIDE_ADMIN_BRAND_SVG = '<svg width="34" height="11" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.40071e-06 4.86V3.792L1.392 3.228L2.448 1.2H3.84V3.048H6.72V4.86H3.84V6.876C3.84 7.372 3.94 7.72 4.14 7.92C4.34 8.12 4.704 8.22 5.232 8.22C5.568 8.22 5.864 8.192 6.12 8.136C6.384 8.072 6.624 7.992 6.84 7.896V9.744C6.6 9.832 6.284 9.912 5.892 9.984C5.5 10.056 5.096 10.092 4.68 10.092C3.92 10.092 3.296 9.976 2.808 9.744C2.328 9.512 1.972 9.18 1.74 8.748C1.508 8.308 1.392 7.796 1.392 7.212V4.86H1.40071e-06ZM7.02647 3.048H9.52247L9.93047 5.496V9.9H7.48247V5.352L7.02647 3.048ZM13.1465 2.94V5.028C12.9065 4.98 12.6785 4.948 12.4625 4.932C12.2545 4.908 12.0625 4.896 11.8865 4.896C11.5345 4.896 11.2105 4.968 10.9145 5.112C10.6185 5.248 10.3785 5.476 10.1945 5.796C10.0185 6.116 9.93047 6.544 9.93047 7.08L9.46247 6.504C9.52647 6.008 9.62247 5.544 9.75047 5.112C9.87847 4.672 10.0505 4.284 10.2665 3.948C10.4905 3.604 10.7665 3.336 11.0945 3.144C11.4225 2.944 11.8225 2.844 12.2945 2.844C12.4305 2.844 12.5705 2.852 12.7145 2.868C12.8585 2.884 13.0025 2.908 13.1465 2.94ZM13.5033 2.94L14.7393 3.18L15.9633 2.94V9.9H13.5033V2.94ZM14.7273 2.376C14.3033 2.376 13.9593 2.272 13.6953 2.064C13.4313 1.848 13.2993 1.556 13.2993 1.188C13.2993 0.828001 13.4313 0.540001 13.6953 0.324001C13.9593 0.108001 14.3033 9.53674e-07 14.7273 9.53674e-07C15.1673 9.53674e-07 15.5153 0.108001 15.7713 0.324001C16.0353 0.540001 16.1673 0.828001 16.1673 1.188C16.1673 1.556 16.0353 1.848 15.7713 2.064C15.5153 2.272 15.1673 2.376 14.7273 2.376ZM23.0719 9.9L22.7479 7.332L23.1679 6.492L22.7599 5.436L23.3359 0.660001H25.8799L25.1719 6.288L25.6039 9.9H23.0719ZM23.5999 6.48C23.4879 7.2 23.2639 7.832 22.9279 8.376C22.5999 8.92 22.1799 9.344 21.6679 9.648C21.1639 9.944 20.5879 10.092 19.9399 10.092C19.2679 10.092 18.6759 9.944 18.1639 9.648C17.6599 9.344 17.2639 8.92 16.9759 8.376C16.6879 7.824 16.5439 7.192 16.5439 6.48C16.5439 5.752 16.6879 5.116 16.9759 4.572C17.2639 4.028 17.6599 3.604 18.1639 3.3C18.6759 2.996 19.2679 2.844 19.9399 2.844C20.5879 2.844 21.1639 2.996 21.6679 3.3C22.1799 3.596 22.6039 4.016 22.9399 4.56C23.2759 5.096 23.4959 5.736 23.5999 6.48ZM19.0279 6.48C19.0279 6.816 19.0959 7.116 19.2319 7.38C19.3759 7.644 19.5719 7.852 19.8199 8.004C20.0679 8.148 20.3519 8.22 20.6719 8.22C21.0079 8.22 21.3239 8.148 21.6199 8.004C21.9159 7.852 22.1759 7.644 22.3999 7.38C22.6239 7.116 22.7919 6.816 22.9039 6.48C22.7919 6.136 22.6239 5.832 22.3999 5.568C22.1759 5.304 21.9159 5.096 21.6199 4.944C21.3239 4.792 21.0079 4.716 20.6719 4.716C20.3519 4.716 20.0679 4.792 19.8199 4.944C19.5719 5.096 19.3759 5.304 19.2319 5.568C19.0959 5.832 19.0279 6.136 19.0279 6.48ZM30.2625 10.092C29.4305 10.092 28.6865 9.94 28.0305 9.636C27.3825 9.332 26.8705 8.908 26.4945 8.364C26.1185 7.812 25.9305 7.172 25.9305 6.444C25.9305 5.732 26.1105 5.108 26.4705 4.572C26.8305 4.028 27.3225 3.604 27.9465 3.3C28.5785 2.996 29.2905 2.844 30.0825 2.844C30.9065 2.844 31.6065 3.024 32.1825 3.384C32.7665 3.736 33.2145 4.236 33.5265 4.884C33.8465 5.532 34.0065 6.296 34.0065 7.176H27.9105V5.7H32.6265L31.8225 6.216C31.7905 5.864 31.7025 5.568 31.5585 5.328C31.4145 5.08 31.2225 4.892 30.9825 4.764C30.7505 4.636 30.4705 4.572 30.1425 4.572C29.7825 4.572 29.4745 4.644 29.2185 4.788C28.9625 4.932 28.7625 5.132 28.6185 5.388C28.4745 5.636 28.4025 5.928 28.4025 6.264C28.4025 6.696 28.4985 7.064 28.6905 7.368C28.8905 7.664 29.1785 7.892 29.5545 8.052C29.9385 8.212 30.4065 8.292 30.9585 8.292C31.4625 8.292 31.9625 8.228 32.4585 8.1C32.9625 7.964 33.4185 7.776 33.8265 7.536V9.096C33.3545 9.416 32.8145 9.664 32.2065 9.84C31.6065 10.008 30.9585 10.092 30.2625 10.092Z" fill="white"/></svg>';
const ADMIN_RESET_TABLES_TEXT = "federations, TODAs, members, tricycles, shift assignments, and officer terms";
const ADMIN_MEMBER_PORTAL_URL = "./index.html";

// params: filename (required), content (required), mimeType (required)
function downloadAdminFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 1000);
}

// params: memberId (required)
function openResetDatabaseConfirm(memberId) {
    trConfirm({
        title: "Reset all 6 database tables?",
        message: "This permanently clears all " + ADMIN_RESET_TABLES_TEXT + " and restarts from setup.",
        confirmLabel: "Reset database",
        critical: true,
        onConfirm: async function () {
            try {
                await apiReset(memberId);
                setSessionMemberId(null);
                setRootPage(renderOobePage, {});
            } catch (err) {
                trAlert({ title: "Error", message: err.message });
            }
        }
    });
}

// params: todaId (optional), scopeLabel (required)
async function exportSixTableJson(todaId, scopeLabel) {
    try {
        const res = await apiExport(todaId);
        const jsonText = JSON.stringify(res.tables, null, 2);
        let slug = "all";
        if (todaId) {
            const todaStr = String(todaId);
            slug = todaStr.toLowerCase();
        }
        const filename = "tride-dbms1-" + slug + ".json";
        downloadAdminFile(filename, jsonText, "application/json;charset=utf-8");
        trAlert({
            title: "Export downloaded",
            message: "Saved 6-table JSON snapshot (" + scopeLabel + ") as " + filename + "."
        });
    } catch (err) {
        trAlert({ title: "Export failed", message: err.message });
    }
}

// params: homeData (required)
function buildOfficerTab(homeData) {
    const roles = homeData.roles || {};
    const toda = homeData.officerToda;
    const statsData = homeData.todaStats;
    if (!toda || !statsData) {
        const emptyNode = trEmptyState({
            icon: "\uE82F",
            title: "No active TODA term",
            subtitle: "Ask the Federation Secretary to record your active officer term."
        });
        return [emptyNode];
    }

    const positions = roles.officerPositions || [];
    let positionLabel = "TODA Officer";
    if (positions.length > 0) {
        positionLabel = positions.join(", ");
    }
    const canWrite = Boolean(roles.canWriteToda);
    let accessText = "View-only access for " + toda.TODA_Name;
    if (roles.isPresident) {
        accessText = "Full TODA management for " + toda.TODA_Name;
    } else if (canWrite) {
        accessText = "Member and unit editing for " + toda.TODA_Name;
    }

    const termSummaryCard = trListCard([
        trPropertyRow({ label: "Active Position", value: positionLabel }),
        trPropertyRow({ label: "TODA Association", value: toda.TODA_Name + " (" + toda.TODA_ID + ")" }),
        trPropertyRow({ label: "Access Level", value: accessText })
    ]);
    const termGroup = trCardGroup({
        headline: "Officer board role",
        card: termSummaryCard,
        footnote: "Scope is locked to your active officer term."
    });

    const stats = trStatGroup([
        { value: String(statsData.memberCount), label: pluralLabel(statsData.memberCount, "member", "members") },
        { value: String(statsData.licensedCount), label: pluralLabel(statsData.licensedCount, "driver", "drivers") },
        { value: String(statsData.unitCount), label: pluralLabel(statsData.unitCount, "unit", "units") }
    ]);

    const navRows = [];
    const membersRow = trActionRow({
        label: canWrite ? "Manage my members" : "View TODA members",
        onClick: function () {
            pushPage(renderMembersPage, {
                scopeTodaId: toda.TODA_ID,
                scopeTodaName: toda.TODA_Name,
                canWriteToda: canWrite,
                isPresident: Boolean(roles.isPresident)
            });
        }
    });
    navRows.push(membersRow);

    const unitsRow = trActionRow({
        label: canWrite ? "Manage TODA units" : "View TODA units",
        onClick: function () {
            pushPage(renderUnitsPage, {
                scopeTodaId: toda.TODA_ID,
                scopeTodaName: toda.TODA_Name,
                canWriteToda: canWrite,
                isPresident: Boolean(roles.isPresident)
            });
        }
    });
    navRows.push(unitsRow);

    if (typeof renderTodaDetailPage === "function") {
        const boardRow = trActionRow({
            label: "TODA details & officers",
            onClick: function () {
                pushPage(renderTodaDetailPage, {
                    todaId: toda.TODA_ID,
                    canWriteToda: canWrite,
                    isPresident: Boolean(roles.isPresident)
                });
            }
        });
        navRows.push(boardRow);
    }

    const navCard = trListCard(navRows);
    let navFootnote = "Read-only board access for viewing TODA records.";
    if (canWrite) {
        navFootnote = "Manage members, tricycle units, and shifts under your TODA.";
    }
    const navGroup = trCardGroup({
        headline: "Management",
        card: navCard,
        footnote: navFootnote
    });

    const items = [termGroup, stats, navGroup];

    if (typeof renderExportPage === "function") {
        const exportRow = trActionRow({
            label: "Export TODA data",
            onClick: function () {
                pushPage(renderExportPage, {
                    role: roles.isPresident ? "president" : "officer",
                    scopeTodaId: toda.TODA_ID,
                    scopeTodaName: toda.TODA_Name
                });
            }
        });
        const exportCard = trListCard([exportRow]);
        const exportGroup = trCardGroup({
            headline: "Reports",
            card: exportCard,
            footnote: "Download a snapshot of your TODA records as CSV, SQL, or PDF."
        });
        items.push(exportGroup);
    }

    return items;
}

// params: homeData (required), memberId (required)
function buildSecretaryTab(homeData, memberId) {
    const fallbackStats = {
        federationCount: 0,
        todaCount: 0,
        presidentCount: 0,
        officerCount: 0,
        memberCount: 0,
        driverCount: 0,
        unitCount: 0,
        activeAssignmentCount: 0
    };
    const statsData = homeData.secretaryStats || fallbackStats;

    const stats = trStatGroup([
        { value: String(statsData.todaCount), label: pluralLabel(statsData.todaCount, "toda", "todas") },
        { value: String(statsData.driverCount), label: pluralLabel(statsData.driverCount, "driver", "drivers") },
        { value: String(statsData.unitCount), label: pluralLabel(statsData.unitCount, "unit", "units") }
    ]);

    const membersRow = trActionRow({
        label: "Manage all members",
        onClick: function () {
            pushPage(renderMembersPage, { scopeTodaId: null, canWriteToda: true, isSecretary: true });
        }
    });
    const unitsRow = trActionRow({
        label: "All units",
        onClick: function () {
            pushPage(renderUnitsPage, { scopeTodaId: null, canWriteToda: true, isSecretary: true });
        }
    });
    const todasRow = trActionRow({
        label: "TODAs & federations",
        onClick: function () {
            pushPage(renderTodasPage, { isSecretary: true });
        }
    });

    const navCard = trListCard([membersRow, unitsRow, todasRow]);
    const navGroup = trCardGroup({
        headline: "Federation",
        card: navCard,
        footnote: "Manage all federations, TODA associations, officer boards, members, and units."
    });

    const reportRows = [];
    if (typeof renderExportPage === "function") {
        const exportPageRow = trActionRow({
            label: "Export 6-table SQL / CSV / PDF",
            onClick: function () {
                pushPage(renderExportPage, {
                    role: "secretary",
                    scopeTodaId: null,
                    scopeTodaName: null
                });
            }
        });
        reportRows.push(exportPageRow);
    }
    const jsonRow = trActionRow({
        label: "Download 6-table JSON snapshot",
        hideChevron: true,
        onClick: function () {
            exportSixTableJson(null, "all TODAs");
        }
    });
    reportRows.push(jsonRow);

    const reportCard = trListCard(reportRows);
    const reportGroup = trCardGroup({
        headline: "Reports & backup",
        card: reportCard,
        footnote: "Export all 6 tables for monthly federation archives."
    });

    return [stats, navGroup, reportGroup];
}

// params: params (optional)
function renderHomePage(params) {
    const safeParams = params || {};
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
        const bellBtn = createNotificationBellButton();
        navActions.push(bellBtn);
    }
    const brandNode = trBrandLogo({ svg: TRIDE_ADMIN_BRAND_SVG });
    const navBar = trNavBar({
        leftActions: [settingsIcon],
        titleNode: brandNode,
        center: true,
        actions: navActions
    });

    const main = trEl("main", "content vbox space-xl");
    const loadingText = trEl("p", "as-tertiary as-gray", "Loading...");
    main.appendChild(loadingText);

    apiHome(memberId).then(function (data) {
        main.replaceChildren();
        const member = data.member;
        const toda = data.toda;
        const roles = data.roles || {};

        // based on final_dbms1_relational-model.md, OFFICER_TERM, admit federation secretary and all seven active officer positions
        const adminTabs = [];
        if (roles.isOfficer) {
            let officerTabLabel = "TODA Officer";
            if (roles.isPresident) {
                officerTabLabel = "TODA President";
            } else if (roles.officerPositions && roles.officerPositions.length > 0) {
                officerTabLabel = "TODA " + roles.officerPositions[0];
            }
            adminTabs.push({ key: "officer", label: officerTabLabel });
        }
        if (roles.isSecretary) {
            adminTabs.push({ key: "secretary", label: "Federation Secretary" });
        }

        if (adminTabs.length === 0) {
            const blockedState = trEmptyState({
                icon: "\uE72E",
                title: "Officer access required",
                subtitle: "This portal is only for active TODA board officers and the Federation Secretary."
            });
            const backBtn = trButton({
                label: "Open Member App",
                onClick: function () {
                    window.location.href = ADMIN_MEMBER_PORTAL_URL;
                }
            });
            const blockedSec = trSection([blockedState, backBtn], { flex: true });
            main.appendChild(blockedSec);
            if (typeof safeParams.onReady === "function") {
                safeParams.onReady();
            }
            return;
        }

        const fullName = formatFullName(member.First_Name, member.Last_Name);
        const addressText = formatMemberAddress(member);
        const contactText = member.Contact_Number || "No contact";
        let todaLabel = "No TODA";
        if (toda && toda.TODA_Name) {
            todaLabel = toda.TODA_Name;
        }
        let licenseLabel = "Non-driving member";
        if (member.License_Number) {
            licenseLabel = member.License_Number;
        }

        const profileCard = trProfileCard({
            name: fullName,
            leftDetails: [addressText, contactText],
            rightDetails: [todaLabel, licenseLabel]
        });
        const profileSection = trSection([profileCard]);

        let activeRole = safeParams.activeRole || adminTabs[0].key;
        if (activeRole === "president") {
            activeRole = "officer";
        }
        let found = false;
        for (let i = 0; i < adminTabs.length; i += 1) {
            if (adminTabs[i].key === activeRole) {
                found = true;
            }
        }
        if (!found) {
            activeRole = adminTabs[0].key;
        }

        const tabPanel = trEl("div", "vbox flex1 space-l");

        function showTab(roleKey) {
            tabPanel.replaceChildren();
            if (roleKey === "officer") {
                const officerItems = buildOfficerTab(data);
                trAppend(tabPanel, officerItems);
            } else if (roleKey === "secretary") {
                const secItems = buildSecretaryTab(data, memberId);
                trAppend(tabPanel, secItems);
            }
        }

        const tabs = trTabs({
            items: adminTabs,
            activeKey: activeRole,
            onChange: function (nextKey, tabObj, direction) {
                safeParams.activeRole = nextKey;
                showTab(nextKey);
                trAnimateTabSwitch(tabPanel, direction);
            }
        });

        showTab(activeRole);
        const roleSection = trSection([tabs, tabPanel], { flex: true });
        trAppend(main, [profileSection, roleSection]);
        if (typeof safeParams.onReady === "function") {
            safeParams.onReady();
        }
    }).catch(function (err) {
        main.replaceChildren();
        const errEmpty = trEmptyState({
            icon: "\uE783",
            title: "Could not load admin portal",
            subtitle: err.message
        });
        const errSec = trSection(errEmpty, { flex: true });
        main.appendChild(errSec);
        if (err.message.indexOf("not found") !== -1) {
            setSessionMemberId(null);
            setRootPage(renderLoginPage, {});
        }
        if (typeof safeParams.onReady === "function") {
            safeParams.onReady();
        }
    });

    return [navBar, main];
}

// params: params (required: { memberId })
function renderAdminMorePage(params) {
    const safeParams = params || {};
    const memberId = safeParams.memberId || getSessionMemberId();

    const navBar = trNavBar({
        title: "More",
        subtitle: "Advanced federation tools",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const resetRow = trActionRow({
        label: "Reset & wipe database",
        critical: true,
        hideChevron: true,
        onClick: function () {
            openResetDatabaseConfirm(memberId);
        }
    });
    const dangerCard = trCard([resetRow]);
    const dangerGroup = trCardGroup({
        headline: "Danger zone",
        card: dangerCard,
        footnote: "Wiping clears all 6 tables permanently and restarts from setup."
    });
    const dangerSec = trSection(dangerGroup);
    main.appendChild(dangerSec);

    return [navBar, main];
}

// params: none
function renderAdminSettingsPage() {
    const navBar = trNavBar({
        title: "Admin Settings",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const appRow = trActionRow({
        label: "Open Member App",
        onClick: function () {
            window.location.href = ADMIN_MEMBER_PORTAL_URL;
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
    const accountCard = trListCard([appRow, logoutRow]);
    const accountGroup = trCardGroup({
        headline: "Account",
        card: accountCard,
        footnote: "Switch back to the member view or sign out of this session."
    });
    const accountSec = trSection(accountGroup);
    main.appendChild(accountSec);

    const memberId = getSessionMemberId();
    if (memberId) {
        apiHome(memberId).then(function (data) {
            const roles = data.roles || {};
            if (!roles.isSecretary) {
                return;
            }
            const moreRow = trActionRow({
                label: "Database & advanced",
                onClick: function () {
                    pushPage(renderAdminMorePage, { memberId: memberId });
                }
            });
            const moreCard = trListCard([moreRow]);
            const moreGroup = trCardGroup({
                headline: "More",
                card: moreCard,
                footnote: "Destructive database tools are tucked away here."
            });
            const moreSec = trSection(moreGroup);
            main.appendChild(moreSec);
        }).catch(function () {
            /* ignore if offline */
        });
    }

    return [navBar, main];
}

// params: none
async function startAdminApp() {
    try {
        const status = await apiStatus();
        if (status.setupRequired) {
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
        const emptyNode = trEmptyState({
            icon: "\uE783",
            title: "Cannot reach backend",
            subtitle: err.message
        });
        appRoot.appendChild(emptyNode);
    }
}

// ive looked up on the internet on this one, DOMContentLoaded wait until HTML elements finish loading before starting the screen
document.addEventListener("DOMContentLoaded", startAdminApp);
