/* shared helpers for session, formatting, validation, cards, and driver picker */

const SESSION_KEY = "tride_member_id";
// based on final_dbms1_active-baseline-and-naga-city-rules.md, OWNS, cap each operator at five franchised units
const MAX_OWNED_TRICYCLES = 5;
const ID_MAX_LENGTH = 10;
const BODY_NUMBER_MAX_LENGTH = 15;
const DEFAULT_CITY_MUNICIPALITY = "Naga City";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const LICENSE_TYPES = ["Professional", "Non-Professional"];
const ASSOCIATION_STATUSES = ["Active", "Expired", "Suspended"];
const FRANCHISE_STATUSES = ["Active", "Expired", "Revoked"];
const COLOR_ZONES = ["Red", "Blue", "Green", "Yellow", "STF-Blue", "STF-White", "White"];
const DRIVER_ROLES = ["Primary", "Alternate"];
const ASSIGNMENT_STATUSES = ["Active", "Inactive"];
const OFFICER_POSITIONS = [
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Auditor",
    "Sgt. at Arms",
    "Board of Directors"
];

/* session helpers */

// params: none
function getSessionMemberId() {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value;
}

// params: memberId (optional)
function setSessionMemberId(memberId) {
    if (memberId) {
        sessionStorage.setItem(SESSION_KEY, memberId);
        return;
    }
    sessionStorage.removeItem(SESSION_KEY);
}

/* text, date, and select formatting helpers */

// params: first (optional), last (optional)
function formatFullName(first, last) {
    const f = first || "";
    const l = last || "";
    let joined = f + " " + l;
    joined = joined.trim();
    return joined;
}

// params: member (optional: object with Street, Barangay, City_Municipality)
function formatMemberAddress(member) {
    if (!member) {
        return "No address";
    }
    const parts = [];
    if (member.Street) {
        const streetText = String(member.Street).trim();
        if (streetText) {
            parts.push(streetText);
        }
    }
    if (member.Barangay) {
        const brgyText = String(member.Barangay).trim();
        if (brgyText) {
            parts.push(brgyText);
        }
    }
    if (member.City_Municipality) {
        const cityText = String(member.City_Municipality).trim();
        if (cityText) {
            parts.push(cityText);
        }
    }
    if (parts.length === 0) {
        return "No address";
    }
    const combined = parts.join(", ");
    return combined;
}

// params: count (required), singular (required), plural (required)
function pluralLabel(count, singular, plural) {
    if (count === 1) {
        return singular;
    }
    return plural;
}

// params: text (required)
function isValidIsoDate(text) {
    if (!text) {
        return false;
    }
    const raw = String(text);
    const cleaned = raw.trim();
    const matches = DATE_PATTERN.test(cleaned);
    if (!matches) {
        return false;
    }
    const parts = cleaned.split("-");
    const yearNum = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);
    const dayNum = parseInt(parts[2], 10);
    if (monthNum < 1 || monthNum > 12) {
        return false;
    }
    if (dayNum < 1 || dayNum > 31) {
        return false;
    }
    const probe = new Date(yearNum, monthNum - 1, dayNum);
    const sameYear = probe.getFullYear() === yearNum;
    const sameMonth = probe.getMonth() === monthNum - 1;
    const sameDay = probe.getDate() === dayNum;
    if (!sameYear || !sameMonth || !sameDay) {
        return false;
    }
    return true;
}

// params: values (required: array of strings), emptyLabel (optional: string)
function buildSelectOptions(values, emptyLabel) {
    const options = [];
    if (emptyLabel) {
        options.push({ label: emptyLabel, value: "" });
    }
    const list = values || [];
    const count = list.length;
    for (let i = 0; i < count; i += 1) {
        const val = list[i];
        options.push({ label: val, value: val });
    }
    return options;
}

// params: assignments (optional: array of driver assignment rows)
function getActiveAssignments(assignments) {
    const list = assignments || [];
    const primaries = [];
    const alternates = [];
    const count = list.length;
    for (let i = 0; i < count; i += 1) {
        const row = list[i];
        if (!row || row.Status !== "Active") {
            continue;
        }
        if (row.Driver_Role === "Primary") {
            primaries.push(row);
        } else {
            alternates.push(row);
        }
    }
    const combined = primaries.concat(alternates);
    return combined;
}

/* shared domain cards */

// params: unit (required), options (optional: function | { mode, onClick, assignment })
function buildTricycleCard(unit, options) {
    let opts = {};
    if (typeof options === "function") {
        opts = { onClick: options };
    } else if (options) {
        opts = options;
    }

    const currentMemberId = getSessionMemberId();
    const ownerName = formatFullName(unit.Owner_First_Name, unit.Owner_Last_Name);
    const isOwnerSelf = Boolean(currentMemberId && unit.Owner_Member_ID === currentMemberId);

    let roleBadge = "UNIT";
    if (opts.mode === "driver") {
        roleBadge = "DRIVER";
    } else if (opts.mode === "operator") {
        roleBadge = "OPERATOR";
    }

    const zoneParts = [];
    if (unit.Color_Zone) {
        zoneParts.push(unit.Color_Zone);
    }
    if (unit.Franchise_Status && unit.Franchise_Status !== "Active") {
        zoneParts.push(unit.Franchise_Status);
    }
    const topRightText = zoneParts.join(" · ");

    let fromName = ownerName;
    if (isOwnerSelf) {
        fromName = "you";
    }
    if (!fromName && unit.Owner_Member_ID) {
        fromName = unit.Owner_Member_ID;
    }

    const fromLine = trEl("p", "as-tertiary as-gray");
    const fromPrefix = document.createTextNode("from ");
    const fromBold = trEl("span", "as-bold", fromName);
    fromLine.appendChild(fromPrefix);
    fromLine.appendChild(fromBold);

    const assignLine = trEl("p", "as-tertiary as-gray");

    if (opts.assignment) {
        const shift = opts.assignment;
        const shiftRole = shift.Driver_Role || "Driver";
        const shiftSched = shift.Shift_Schedule || "";
        const roleBold = trEl("span", "as-bold", shiftRole);
        assignLine.appendChild(roleBold);
        if (shiftSched) {
            const schedText = document.createTextNode(" · " + shiftSched);
            assignLine.appendChild(schedText);
        }
    } else {
        const activeShifts = getActiveAssignments(unit.assignments);
        if (activeShifts.length === 0) {
            assignLine.textContent = "No active driver";
        } else {
            const lead = activeShifts[0];
            const leadName = formatFullName(lead.First_Name, lead.Last_Name);
            const isLeadSelf = Boolean(currentMemberId && lead.Member_ID === currentMemberId);
            const isSelfDriven = Boolean(unit.Owner_Member_ID && lead.Member_ID === unit.Owner_Member_ID);

            let leadDisplay = leadName || lead.Member_ID;
            if (isSelfDriven) {
                if (isLeadSelf) {
                    leadDisplay = "yourself";
                } else {
                    leadDisplay = "themselves";
                }
            } else if (isLeadSelf) {
                leadDisplay = "you";
            }

            const prefixNode = document.createTextNode("Assigned to ");
            const leadBold = trEl("span", "as-bold", leadDisplay);
            assignLine.appendChild(prefixNode);
            assignLine.appendChild(leadBold);

            const extraCount = activeShifts.length - 1;
            if (extraCount > 0) {
                const extraNode = document.createTextNode(" (+" + extraCount + " alt)");
                assignLine.appendChild(extraNode);
            }
        }
    }

    const card = trBrandCard({
        subtext: roleBadge,
        topRight: topRightText || undefined,
        title: unit.Body_Number || unit.Tricycle_ID,
        subtitle: fromLine,
        bottomRight: assignLine,
        onClick: opts.onClick
    });
    return card;
}

// params: toda (required), options (optional: function | { onClick })
function buildAssociationCard(toda, options) {
    let opts = {};
    if (typeof options === "function") {
        opts = { onClick: options };
    } else if (options) {
        opts = options;
    }

    const memberCount = Number(toda.memberCount) || 0;
    const unitCount = Number(toda.unitCount) || 0;
    const memWord = pluralLabel(memberCount, "member", "members");
    const unitWord = pluralLabel(unitCount, "unit", "units");
    let countText = memberCount + " " + memWord + " · " + unitCount + " " + unitWord;
    if (toda.Association_Status && toda.Association_Status !== "Active") {
        countText = toda.Association_Status + " · " + countText;
    }

    const presLine = trEl("p", "as-tertiary as-gray");
    if (toda.president && toda.president.Member_ID) {
        const presName = formatFullName(toda.president.First_Name, toda.president.Last_Name);
        const presPrefix = document.createTextNode("Pres: ");
        const presBold = trEl("span", "as-bold", presName);
        presLine.appendChild(presPrefix);
        presLine.appendChild(presBold);
    } else {
        presLine.textContent = "No active president";
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

/* shared licensed driver picker sheet */

// params: options (optional: { todaId, allowClear, onSelect })
async function openDriverPicker(options) {
    const opts = options || {};
    let sheetCtrl = null;

    try {
        const res = await apiListDrivers(opts.todaId);
        // based on final_dbms1_active-baseline-and-naga-city-rules.md, DRIVER_ASSIGNMENT, show all licensed drivers including active shift drivers for relyebo shifts
        const drivers = res.members || [];

        const todasMap = {};
        const todaOptions = [{ label: "All TODAs", value: "all" }];
        const driverCount = drivers.length;
        for (let i = 0; i < driverCount; i += 1) {
            const drv = drivers[i];
            if (drv.TODA_ID && !todasMap[drv.TODA_ID]) {
                todasMap[drv.TODA_ID] = true;
                todaOptions.push({
                    label: drv.TODA_Name || drv.TODA_ID,
                    value: drv.TODA_ID
                });
            }
        }

        let searchQuery = "";
        let activeToda = "all";
        const resultsWrap = trEl("div", "vbox space-l");

        function renderDriverList() {
            resultsWrap.replaceChildren();

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
                const clearCard = trListCard([clearRow]);
                resultsWrap.appendChild(clearCard);
            }

            const filtered = [];
            for (let i = 0; i < drivers.length; i += 1) {
                const member = drivers[i];
                if (activeToda !== "all" && member.TODA_ID !== activeToda) {
                    continue;
                }
                const fullName = formatFullName(member.First_Name, member.Last_Name);
                let haystack = fullName + " " + member.Member_ID;
                if (member.License_Number) {
                    haystack = haystack + " " + member.License_Number;
                }
                haystack = haystack.toLowerCase();
                if (searchQuery && haystack.indexOf(searchQuery) === -1) {
                    continue;
                }
                filtered.push(member);
            }

            if (filtered.length === 0) {
                let emptyTitle = "No matching drivers";
                let emptySub = "Try another name, license, or TODA filter.";
                if (drivers.length === 0) {
                    emptyTitle = "No licensed drivers";
                    emptySub = "Register a member with a driver's license first.";
                }
                const emptyNode = trEmptyState({
                    icon: "\uE716",
                    title: emptyTitle,
                    subtitle: emptySub
                });
                resultsWrap.appendChild(emptyNode);
                return;
            }

            const alphaList = trAlphaList({
                items: filtered,
                getLabel: function (member) {
                    return formatFullName(member.First_Name, member.Last_Name);
                },
                renderRow: function (member) {
                    const fullName = formatFullName(member.First_Name, member.Last_Name);
                    const labelText = fullName + " (" + member.Member_ID + ")";
                    const shiftCount = Number(member.activeShiftCount) || 0;
                    const shiftWord = pluralLabel(shiftCount, "active shift", "active shifts");
                    const subParts = [];
                    if (member.License_Type) {
                        subParts.push(member.License_Type);
                    }
                    subParts.push(shiftCount + " " + shiftWord);
                    const subText = subParts.join(" · ");
                    return trActionRow({
                        label: labelText,
                        subtitle: subText,
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
            });
            resultsWrap.appendChild(alphaList);
        }

        const headerControls = [];
        const bodyItems = [];
        if (drivers.length > 0) {
            const searchBox = trSearchBox({
                placeholder: "Find a licensed driver",
                onInput: function (val) {
                    let nextQuery = val.trim();
                    nextQuery = nextQuery.toLowerCase();
                    searchQuery = nextQuery;
                    renderDriverList();
                }
            });
            headerControls.push(searchBox);

            if (!opts.todaId && todaOptions.length > 2) {
                const todaSelectRow = trPropertyRow({
                    label: "Filter by TODA",
                    select: {
                        value: "all",
                        options: todaOptions,
                        onChange: function (event) {
                            activeToda = event.target.value;
                            renderDriverList();
                        }
                    }
                });
                const filterCard = trListCard([todaSelectRow]);
                bodyItems.push(filterCard);
            }
        }

        renderDriverList();
        bodyItems.push(resultsWrap);

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
            body: bodyItems,
            footer: cancelBtn,
            removeOnClose: true
        });
        sheetCtrl.open();
    } catch (err) {
        trAlert({ title: "Error", message: err.message });
    }
}

/* distortion wave success and page transition helpers */

// params: options (optional)
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

// params: options (optional)
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
