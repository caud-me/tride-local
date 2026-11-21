/* shared helpers for session, formatting, tricycle cards, and driver picker */

const SESSION_KEY = "tride_member_id";

function getSessionMemberId() {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value;
}

function setSessionMemberId(memberId) {
    if (memberId) {
        sessionStorage.setItem(SESSION_KEY, memberId);
        return;
    }
    sessionStorage.removeItem(SESSION_KEY);
}

function formatFullName(first, last) {
    const f = first || "";
    const l = last || "";
    const joined = f + " " + l;
    const trimmed = joined.trim();
    return trimmed;
}

function pluralLabel(count, singular, plural) {
    if (count === 1) {
        return singular;
    }
    return plural;
}

function buildTricycleCard(unit, options) {
    const opts = options || {};
    const currentMemberId = getSessionMemberId();
    const ownerName = formatFullName(unit.Owner_First_Name, unit.Owner_Last_Name);
    const hasDriver = Boolean(unit.Driver_Member_ID);
    const driverName = hasDriver
        ? formatFullName(unit.Driver_First_Name, unit.Driver_Last_Name)
        : "";
    const isOwnerSelf = Boolean(currentMemberId && unit.Owner_Member_ID === currentMemberId);
    const isDriverSelf = Boolean(currentMemberId && unit.Driver_Member_ID === currentMemberId);
    const isSelfDriven = Boolean(hasDriver && unit.Owner_Member_ID && unit.Driver_Member_ID === unit.Owner_Member_ID);

    let roleBadge = "UNIT";
    if (opts.mode === "driver") {
        roleBadge = "DRIVER";
    } else if (opts.mode === "operator") {
        roleBadge = "OPERATOR";
    }

    const fromName = isOwnerSelf ? "you" : ownerName;
    let rightPrefix = "No driver";
    let rightHighlight = "";

    if (hasDriver) {
        rightPrefix = "Assigned to ";
        if (isSelfDriven) {
            rightHighlight = isDriverSelf ? "yourself" : "themselves";
        } else if (isDriverSelf) {
            rightHighlight = "you";
        } else {
            rightHighlight = driverName;
        }
    }

    const fromLine = trEl("small", "");
    fromLine.appendChild(document.createTextNode("from "));
    fromLine.appendChild(trEl("span", "bold", fromName));

    const assignLine = trEl("small", "");
    assignLine.appendChild(document.createTextNode(rightPrefix));
    if (rightHighlight) {
        assignLine.appendChild(trEl("span", "bold", rightHighlight));
    }

    const card = trBrandCard({
        subtext: roleBadge,
        title: unit.Body_Number,
        subtitle: fromLine,
        bottomRight: assignLine,
        onClick: opts.onClick
    });
    return card;
}

function buildAssociationCard(toda, options) {
    const opts = options || {};
    const memberCount = Number(toda.Member_Count) || 0;
    const countText = memberCount + " " + pluralLabel(memberCount, "member", "members");

    const presLine = trEl("small", "");
    if (toda.President_Member_ID) {
        const presName = formatFullName(toda.Pres_First_Name, toda.Pres_Last_Name);
        presLine.appendChild(document.createTextNode("Pres: "));
        presLine.appendChild(trEl("span", "bold", presName));
    } else {
        presLine.textContent = "No president";
    }

    const card = trBrandCard({
        subtext: "ASSOCIATION",
        big: false,
        topRight: countText,
        title: toda.TODA_Name,
        subtitle: toda.Route,
        bottomRight: presLine,
        onClick: opts.onClick
    });
    return card;
}

async function openDriverPicker(options) {
    const opts = options || {};
    let sheetCtrl = null;

    try {
        const res = await apiListLicensedDrivers();
        const members = res.members || [];
        const available = [];

        // based on brain/my-knowledge.md, driver & operator license matrix, filter out unlicensed or already assigned drivers
        for (let i = 0; i < members.length; i += 1) {
            const candidate = members[i];
            const drivenBody = candidate.Driven_Body_Number;
            const isFree = !drivenBody;
            const isSameUnit = Boolean(opts.currentBodyNumber && drivenBody === opts.currentBodyNumber);
            if (isFree || isSameUnit) {
                available.push(candidate);
            }
        }

        const todasMap = {};
        const todaItems = [{ key: "all", label: "All" }];
        for (let i = 0; i < available.length; i += 1) {
            const m = available[i];
            if (m.TODA_ID && !todasMap[m.TODA_ID]) {
                todasMap[m.TODA_ID] = true;
                todaItems.push({
                    key: m.TODA_ID,
                    label: m.TODA_Name || m.TODA_ID
                });
            }
        }

        let searchQuery = "";
        let activeToda = "all";
        const bodyWrap = trEl("div", "vbox gap-m");

        function renderDriverList() {
            bodyWrap.replaceChildren();

            if (opts.allowClear) {
                const clearRow = trActionRow({
                    label: "None (Leave unassigned)",
                    hideChevron: true,
                    onClick: function () {
                        if (sheetCtrl) {
                            sheetCtrl.close();
                        }
                        if (opts.onSelect) {
                            opts.onSelect(null);
                        }
                    }
                });
                bodyWrap.appendChild(trListCard([clearRow]));
            }

            const filtered = [];
            for (let i = 0; i < available.length; i += 1) {
                const member = available[i];
                if (activeToda !== "all" && member.TODA_ID !== activeToda) {
                    continue;
                }
                const fullName = formatFullName(member.First_Name, member.Last_Name);
                const haystack = (fullName + " " + member.Member_ID).toLowerCase();
                if (searchQuery && haystack.indexOf(searchQuery) === -1) {
                    continue;
                }
                filtered.push(member);
            }

            if (filtered.length === 0) {
                const emptyTitle = available.length === 0 ? "No available drivers" : "No matching drivers";
                const emptySub = available.length === 0
                    ? "Every licensed driver is currently assigned to a tricycle."
                    : "Try another name or TODA filter.";
                bodyWrap.appendChild(trEmptyState({
                    icon: "\uE716",
                    title: emptyTitle,
                    subtitle: emptySub
                }));
                return;
            }

            bodyWrap.appendChild(trAlphaList({
                items: filtered,
                getLabel: function (member) {
                    return formatFullName(member.First_Name, member.Last_Name);
                },
                renderRow: function (member) {
                    const fullName = formatFullName(member.First_Name, member.Last_Name);
                    const labelText = fullName + " (" + member.Member_ID + ")";
                    return trActionRow({
                        label: labelText,
                        hideChevron: true,
                        onClick: function () {
                            if (sheetCtrl) {
                                sheetCtrl.close();
                            }
                            if (opts.onSelect) {
                                opts.onSelect(member);
                            }
                        }
                    });
                }
            }));
        }

        const headerControls = [];
        if (available.length > 0) {
            const searchBox = trSearchBox({
                placeholder: "Find a driver",
                onInput: function (val) {
                    searchQuery = val.trim().toLowerCase();
                    renderDriverList();
                }
            });
            headerControls.push(searchBox);

            if (todaItems.length > 2) {
                const todaTabs = trTabs({
                    items: todaItems,
                    activeKey: "all",
                    onChange: function (key) {
                        activeToda = key;
                        renderDriverList();
                    }
                });
                headerControls.push(todaTabs);
            }
        }

        renderDriverList();

        const cancelBtn = trButton({
            label: "Cancel",
            onClick: function () {
                if (sheetCtrl) {
                    sheetCtrl.close();
                }
            }
        });

        sheetCtrl = trSheet({
            title: "Select licensed driver",
            headerExtra: headerControls,
            body: bodyWrap,
            footer: cancelBtn,
            removeOnClose: true
        });
        sheetCtrl.open();
    } catch (err) {
        trAlert({ title: "Error", message: err.message });
    }
}

/* distortion wave success and page transition helpers */
function presentSuccessScreen(options) {
    const opts = options || {};
    if (typeof trSuccessWave === "function") {
        trSuccessWave(opts);
        return;
    }
    if (opts.onDone) {
        opts.onDone();
    }
}

function presentTransitionWave(options) {
    const opts = options || {};
    if (typeof trTransitionWave === "function") {
        trTransitionWave(opts);
        return;
    }
    if (opts.navigate) {
        opts.navigate(null);
    }
}
