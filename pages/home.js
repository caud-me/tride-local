/* home dashboard, role tabs, edit profile, and settings */

function buildDriverTab(homeData) {
    const unit = homeData.drivenUnit;
    if (!unit) {
        const emptyMsg = trEl("small", "", "You are not assigned to any tricycle right now");
        const emptyCard = trCard([emptyMsg]);
        emptyCard.setAttribute("role", "status");
        return [emptyCard];
    }

    const heading = trSectionHeading("assigned tricycle");
    const unitCard = buildTricycleCard(unit, { mode: "driver" });
    return [heading, unitCard];
}

function buildOperatorTab(homeData) {
    const owned = homeData.ownedUnits || [];
    let assignedCount = 0;
    for (let i = 0; i < owned.length; i += 1) {
        if (owned[i].Driver_Member_ID) {
            assignedCount += 1;
        }
    }
    const unusedCount = owned.length - assignedCount;

    const stats = trStatGroup([
        { value: String(assignedCount), label: pluralLabel(assignedCount, "driver", "drivers") },
        { value: String(unusedCount), label: "unused" },
        { value: String(owned.length), label: pluralLabel(owned.length, "tricycle", "tricycles") }
    ]);

    const manageRow = trActionRow({
        label: "Manage my tricycle units",
        onClick: function () {
            pushPage(renderOperatorUnitsPage, {});
        }
    });
    const manageCard = trCard([manageRow]);

    return [stats, manageCard];
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
            pushPage(renderSettingsPage, {});
        }
    });
    const navActions = [];
    if (typeof createNotificationBellButton === "function") {
        navActions.push(createNotificationBellButton({ allowCompose: false }));
    }
    navActions.push(settingsIcon);
    const navBar = trNavBar({
        titleNode: trBrandLogo({ text: "TRIDE" }),
        actions: navActions
    });

    const main = trEl("main", "content vbox gap-m");
    main.appendChild(trBanner("Loading..."));

    apiGetHome(memberId).then(function (data) {
        main.replaceChildren();
        const member = data.member;

        const profileCard = trProfileCard({
            firstName: member.First_Name,
            lastName: member.Last_Name,
            address: member.Address,
            contact: member.Contact_Number,
            todaName: member.TODA_Name || "Federation Office",
            license: member.License_Number || "No license"
        });

        const editBtn = trButton({
            label: "Edit profile",
            onClick: function () {
                pushPage(renderEditProfilePage, { member: member });
            }
        });

        const allRoles = data.roles || [];
        const roles = [];
        for (let i = 0; i < allRoles.length; i += 1) {
            const roleItem = allRoles[i];
            if (roleItem.key === "driver" || roleItem.key === "operator") {
                roles.push(roleItem);
            }
        }

        if (roles.length === 0) {
            const noRoleState = trEmptyState({
                icon: "\uE77B",
                title: "No driver or operator roles yet",
                subtitle: "Add your driver's license in Edit profile to drive, or ask an officer to assign you a unit."
            });
            trAppend(main, [profileCard, editBtn, noRoleState]);
            if (params && typeof params.onReady === "function") {
                params.onReady();
            }
            return;
        }

        let activeRole = params.activeRole || roles[0].key;
        let found = false;
        for (let i = 0; i < roles.length; i += 1) {
            if (roles[i].key === activeRole) {
                found = true;
            }
        }
        if (!found) {
            activeRole = roles[0].key;
        }

        const tabPanel = trEl("div", "vbox gap-m");

        function showTab(roleKey) {
            tabPanel.replaceChildren();
            if (roleKey === "driver") {
                trAppend(tabPanel, buildDriverTab(data));
            } else if (roleKey === "operator") {
                trAppend(tabPanel, buildOperatorTab(data));
            }
        }

        const tabs = trTabs({
            items: roles,
            activeKey: activeRole,
            onChange: function (nextKey) {
                params.activeRole = nextKey;
                showTab(nextKey);
            }
        });

        showTab(activeRole);
        trAppend(main, [profileCard, editBtn, tabs, tabPanel]);
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

function renderEditProfilePage(params) {
    const member = params.member;
    if (!member) {
        popPage();
        return [];
    }

    const addrRow = trPropertyRow({ label: "Home Address", input: { value: member.Address } });
    const contactRow = trPropertyRow({ label: "Contact Number", input: { value: member.Contact_Number } });
    const licenseRow = trPropertyRow({
        label: "Drivers License",
        input: { value: member.License_Number || "", placeholder: "Optional for non-drivers" }
    });

    const doneBtn = trButton({
        label: "Done",
        small: true,
        onClick: async function () {
            const addr = addrRow.controlEl.value.trim();
            const contact = contactRow.controlEl.value.trim();
            const lic = licenseRow.controlEl.value.trim();

            addrRow.setError(addr ? "" : "Required");
            contactRow.setError(contact ? "" : "Required");
            licenseRow.setError("");

            if (!addr || !contact) {
                return;
            }

            try {
                await apiUpdateMember(member.Member_ID, {
                    Address: addr,
                    Contact_Number: contact,
                    License_Number: lic
                });
                popPage();
            } catch (err) {
                licenseRow.setError(err.message);
            }
        }
    });

    const navBar = trNavBar({
        title: "Edit profile",
        onBack: popPage,
        actions: [doneBtn]
    });

    const main = trEl("main", "content vbox gap-m");
    main.appendChild(trListCard([addrRow, contactRow, licenseRow]));
    main.appendChild(trEl("small", "text-center as-gray", "Changes save straight to tride-0.1."));
    return [navBar, main];
}

function renderSettingsPage() {
    const navBar = trNavBar({
        title: "Settings",
        onBack: popPage
    });

    const main = trEl("main", "content vbox gap-m");
    const logoutRow = trActionRow({
        label: "Log out",
        hideChevron: true,
        onClick: function () {
            setSessionMemberId(null);
            setRootPage(renderLoginPage, {});
        }
    });
    main.appendChild(trCard([logoutRow]));

    return [navBar, main];
}
