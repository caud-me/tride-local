/* home dashboard, role tabs, edit profile, and settings */

function buildDriverTab(homeData) {
    const unit = homeData.drivenUnit;
    if (!unit) {
        return [trEmptyState({
            icon: "\uE7EC",
            title: "No assigned tricycle",
            subtitle: "You are not assigned to any tricycle right now."
        })];
    }

    const unitCard = buildTricycleCard(unit, { mode: "driver" });
    return [trCardGroup({
        headline: "Assigned tricycle",
        card: unitCard,
        footnote: "Contact your operator if you need unit updates."
    })];
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
    const manageGroup = trCardGroup({
        headline: "Ownership",
        card: trCard([manageRow]),
        footnote: "View, register, or assign drivers to your tricycles."
    });

    return [stats, manageGroup];
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

    const main = trEl("main", "content vbox space-xl");
    main.appendChild(trEl("p", "as-tertiary as-gray", "Loading..."));

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
        const profileSection = trSection([profileCard, editBtn]);

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
            trAppend(main, [profileSection, trSection(noRoleState, { flex: true })]);
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

        const tabPanel = trEl("div", "vbox flex1 space-l");

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
            title: "Could not load profile",
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
        subtitle: "for " + member.First_Name,
        onBack: popPage,
        actions: [doneBtn]
    });

    const main = trEl("main", "content vbox space-xl");
    main.appendChild(trSection(trCardGroup({
        headline: "Contact & license",
        card: trListCard([addrRow, contactRow, licenseRow]),
        footnote: "Updates save directly to your member record."
    })));
    return [navBar, main];
}

function renderSettingsPage() {
    const navBar = trNavBar({
        title: "Settings",
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");
    const logoutRow = trActionRow({
        label: "Log out",
        hideChevron: true,
        onClick: function () {
            setSessionMemberId(null);
            setRootPage(renderLoginPage, {});
        }
    });
    main.appendChild(trSection(trCardGroup({
        headline: "Session",
        card: trCard([logoutRow]),
        footnote: "You can sign back in anytime using your Member ID."
    })));

    return [navBar, main];
}
