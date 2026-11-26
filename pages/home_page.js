/* home dashboard, role tabs, edit profile, and settings */

const TRIDE_BRAND_SVG = '<svg width="34" height="11" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.40071e-06 4.86V3.792L1.392 3.228L2.448 1.2H3.84V3.048H6.72V4.86H3.84V6.876C3.84 7.372 3.94 7.72 4.14 7.92C4.34 8.12 4.704 8.22 5.232 8.22C5.568 8.22 5.864 8.192 6.12 8.136C6.384 8.072 6.624 7.992 6.84 7.896V9.744C6.6 9.832 6.284 9.912 5.892 9.984C5.5 10.056 5.096 10.092 4.68 10.092C3.92 10.092 3.296 9.976 2.808 9.744C2.328 9.512 1.972 9.18 1.74 8.748C1.508 8.308 1.392 7.796 1.392 7.212V4.86H1.40071e-06ZM7.02647 3.048H9.52247L9.93047 5.496V9.9H7.48247V5.352L7.02647 3.048ZM13.1465 2.94V5.028C12.9065 4.98 12.6785 4.948 12.4625 4.932C12.2545 4.908 12.0625 4.896 11.8865 4.896C11.5345 4.896 11.2105 4.968 10.9145 5.112C10.6185 5.248 10.3785 5.476 10.1945 5.796C10.0185 6.116 9.93047 6.544 9.93047 7.08L9.46247 6.504C9.52647 6.008 9.62247 5.544 9.75047 5.112C9.87847 4.672 10.0505 4.284 10.2665 3.948C10.4905 3.604 10.7665 3.336 11.0945 3.144C11.4225 2.944 11.8225 2.844 12.2945 2.844C12.4305 2.844 12.5705 2.852 12.7145 2.868C12.8585 2.884 13.0025 2.908 13.1465 2.94ZM13.5033 2.94L14.7393 3.18L15.9633 2.94V9.9H13.5033V2.94ZM14.7273 2.376C14.3033 2.376 13.9593 2.272 13.6953 2.064C13.4313 1.848 13.2993 1.556 13.2993 1.188C13.2993 0.828001 13.4313 0.540001 13.6953 0.324001C13.9593 0.108001 14.3033 9.53674e-07 14.7273 9.53674e-07C15.1673 9.53674e-07 15.5153 0.108001 15.7713 0.324001C16.0353 0.540001 16.1673 0.828001 16.1673 1.188C16.1673 1.556 16.0353 1.848 15.7713 2.064C15.5153 2.272 15.1673 2.376 14.7273 2.376ZM23.0719 9.9L22.7479 7.332L23.1679 6.492L22.7599 5.436L23.3359 0.660001H25.8799L25.1719 6.288L25.6039 9.9H23.0719ZM23.5999 6.48C23.4879 7.2 23.2639 7.832 22.9279 8.376C22.5999 8.92 22.1799 9.344 21.6679 9.648C21.1639 9.944 20.5879 10.092 19.9399 10.092C19.2679 10.092 18.6759 9.944 18.1639 9.648C17.6599 9.344 17.2639 8.92 16.9759 8.376C16.6879 7.824 16.5439 7.192 16.5439 6.48C16.5439 5.752 16.6879 5.116 16.9759 4.572C17.2639 4.028 17.6599 3.604 18.1639 3.3C18.6759 2.996 19.2679 2.844 19.9399 2.844C20.5879 2.844 21.1639 2.996 21.6679 3.3C22.1799 3.596 22.6039 4.016 22.9399 4.56C23.2759 5.096 23.4959 5.736 23.5999 6.48ZM19.0279 6.48C19.0279 6.816 19.0959 7.116 19.2319 7.38C19.3759 7.644 19.5719 7.852 19.8199 8.004C20.0679 8.148 20.3519 8.22 20.6719 8.22C21.0079 8.22 21.3239 8.148 21.6199 8.004C21.9159 7.852 22.1759 7.644 22.3999 7.38C22.6239 7.116 22.7919 6.816 22.9039 6.48C22.7919 6.136 22.6239 5.832 22.3999 5.568C22.1759 5.304 21.9159 5.096 21.6199 4.944C21.3239 4.792 21.0079 4.716 20.6719 4.716C20.3519 4.716 20.0679 4.792 19.8199 4.944C19.5719 5.096 19.3759 5.304 19.2319 5.568C19.0959 5.832 19.0279 6.136 19.0279 6.48ZM30.2625 10.092C29.4305 10.092 28.6865 9.94 28.0305 9.636C27.3825 9.332 26.8705 8.908 26.4945 8.364C26.1185 7.812 25.9305 7.172 25.9305 6.444C25.9305 5.732 26.1105 5.108 26.4705 4.572C26.8305 4.028 27.3225 3.604 27.9465 3.3C28.5785 2.996 29.2905 2.844 30.0825 2.844C30.9065 2.844 31.6065 3.024 32.1825 3.384C32.7665 3.736 33.2145 4.236 33.5265 4.884C33.8465 5.532 34.0065 6.296 34.0065 7.176H27.9105V5.7H32.6265L31.8225 6.216C31.7905 5.864 31.7025 5.568 31.5585 5.328C31.4145 5.08 31.2225 4.892 30.9825 4.764C30.7505 4.636 30.4705 4.572 30.1425 4.572C29.7825 4.572 29.4745 4.644 29.2185 4.788C28.9625 4.932 28.7625 5.132 28.6185 5.388C28.4745 5.636 28.4025 5.928 28.4025 6.264C28.4025 6.696 28.4985 7.064 28.6905 7.368C28.8905 7.664 29.1785 7.892 29.5545 8.052C29.9385 8.212 30.4065 8.292 30.9585 8.292C31.4625 8.292 31.9625 8.228 32.4585 8.1C32.9625 7.964 33.4185 7.776 33.8265 7.536V9.096C33.3545 9.416 32.8145 9.664 32.2065 9.84C31.6065 10.008 30.9585 10.092 30.2625 10.092Z" fill="white"/></svg>';

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

    const settingsIcon = trIcon("\uE712", {
        label: "Settings",
        onClick: function () {
            pushPage(renderSettingsPage, {});
        }
    });
    const navActions = [];
    if (typeof createNotificationBellButton === "function") {
        navActions.push(createNotificationBellButton({ allowCompose: false }));
    }
    const navBar = trNavBar({
        leftActions: [settingsIcon],
        titleNode: trBrandLogo({ svg: TRIDE_BRAND_SVG }),
        center: true,
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
