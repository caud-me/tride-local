/* offline api router matching version-webapp/server/api_controller.js and notifications_controller.js 1:1 */

const LOCAL_SESSION_KEY = "tride_member_id";
const LOCAL_DEFAULT_NOTICE_TARGET = "toda";

/* sorting and enrichment helpers */

// params: role (required)
function getRoleSortRank(role) {
    if (role === "Primary") {
        return 0;
    }
    return 1;
}

// params: status (required)
function getStatusSortRank(status) {
    if (status === "Active") {
        return 0;
    }
    return 1;
}

// params: position (required)
function getPositionSortRank(position) {
    const idx = LOCAL_OFFICER_POSITION_VALUES.indexOf(position);
    if (idx === -1) {
        return 99;
    }
    return idx;
}

// params: left (required), right (required)
function compareAssignmentOrder(left, right) {
    const leftStatus = getStatusSortRank(left.Status);
    const rightStatus = getStatusSortRank(right.Status);
    if (leftStatus !== rightStatus) {
        return leftStatus - rightStatus;
    }
    const leftRole = getRoleSortRank(left.Driver_Role);
    const rightRole = getRoleSortRank(right.Driver_Role);
    if (leftRole !== rightRole) {
        return leftRole - rightRole;
    }
    if (left.Date_Assigned !== right.Date_Assigned) {
        return right.Date_Assigned.localeCompare(left.Date_Assigned);
    }
    return left.Assignment_ID.localeCompare(right.Assignment_ID);
}

// params: dbState (required), member (required)
function computeLocalMemberRoles(dbState, member) {
    const memberId = member.Member_ID;
    const today = localGetTodayDateText();
    const badges = [];

    let hasActiveShift = false;
    const asnCount = dbState.driver_assignments.length;
    for (let i = 0; i < asnCount; i += 1) {
        const asn = dbState.driver_assignments[i];
        if (localSameKey(asn.Member_ID, memberId) && asn.Status === "Active") {
            hasActiveShift = true;
            break;
        }
    }

    const licVal = localCleanOptional(member.License_Number);
    const hasLicense = Boolean(licVal);
    // based on final_dbms1_active-baseline-and-naga-city-rules.md, DRIVER_ASSIGNMENT, mark member as driver when holding license or active shift
    const isDriver = hasLicense || hasActiveShift;
    if (isDriver) {
        badges.push({ key: "driver", label: "Driver" });
    }

    let isOperator = false;
    const triCount = dbState.tricycles.length;
    for (let i = 0; i < triCount; i += 1) {
        if (localSameKey(dbState.tricycles[i].Owner_Member_ID, memberId)) {
            isOperator = true;
            break;
        }
    }
    if (isOperator) {
        badges.push({ key: "operator", label: "Operator" });
    }

    // based on final_dbms1_relational-model.md, OFFICER_TERM, collect active elected board terms matching current date
    const officerTerms = [];
    const termCount = dbState.officer_terms.length;
    for (let i = 0; i < termCount; i += 1) {
        const term = dbState.officer_terms[i];
        if (!localSameKey(term.Member_ID, memberId)) {
            continue;
        }
        if (!localIsTermActive(term, today)) {
            continue;
        }
        const toda = findLocalToda(dbState, term.TODA_ID);
        const enriched = localCloneData(term);
        enriched.TODA_Name = toda ? toda.TODA_Name : null;
        enriched.Route = toda ? toda.Route : null;
        officerTerms.push(enriched);
    }

    officerTerms.sort(function (a, b) {
        if (a.Term_Start !== b.Term_Start) {
            return b.Term_Start.localeCompare(a.Term_Start);
        }
        return a.Term_ID.localeCompare(b.Term_ID);
    });

    const isOfficer = officerTerms.length > 0;
    let isPresident = false;
    let canWriteToda = false;
    let officerTodaId = null;
    const officerPositions = [];
    const activeCount = officerTerms.length;

    for (let i = 0; i < activeCount; i += 1) {
        const term = officerTerms[i];
        if (!officerTodaId) {
            officerTodaId = term.TODA_ID;
        }
        const pos = term.Position;
        const listed = localIsInList(pos, officerPositions);
        if (!listed) {
            officerPositions.push(pos);
        }
        if (pos === "President") {
            isPresident = true;
        }
        const canWrite = localIsInList(pos, LOCAL_TODA_WRITE_POSITIONS);
        if (canWrite) {
            canWriteToda = true;
        }
    }

    if (isPresident) {
        badges.push({ key: "president", label: "TODA President", position: "President" });
    }
    const posCount = officerPositions.length;
    for (let i = 0; i < posCount; i += 1) {
        const pos = officerPositions[i];
        if (pos !== "President") {
            badges.push({ key: "officer", label: "TODA " + pos, position: pos });
        }
    }

    const managedFederations = [];
    const fedCount = dbState.federations.length;
    for (let i = 0; i < fedCount; i += 1) {
        const fed = dbState.federations[i];
        if (localSameKey(fed.Secretary_Member_ID, memberId)) {
            managedFederations.push(localCloneData(fed));
        }
    }
    managedFederations.sort(function (a, b) {
        return a.Federation_ID.localeCompare(b.Federation_ID);
    });

    const isSecretary = managedFederations.length > 0;
    if (isSecretary) {
        canWriteToda = true;
        badges.push({ key: "secretary", label: "Federation Secretary" });
    }

    return {
        isDriver: isDriver,
        isOperator: isOperator,
        isOfficer: isOfficer,
        isPresident: isPresident,
        canWriteToda: canWriteToda,
        isSecretary: isSecretary,
        officerTodaId: officerTodaId,
        officerPositions: officerPositions,
        officerTerms: officerTerms,
        managedFederations: managedFederations,
        badges: badges
    };
}

// params: dbState (required)
function resolveLocalCaller(dbState) {
    const rawSession = sessionStorage.getItem(LOCAL_SESSION_KEY);
    const callerId = localCleanText(rawSession);
    if (!callerId) {
        throw new Error("Sign in is required.");
    }
    const callerRow = findLocalMember(dbState, callerId);
    if (!callerRow) {
        throw new Error("Active member session not found.");
    }
    const roles = computeLocalMemberRoles(dbState, callerRow);
    return {
        Member_ID: callerRow.Member_ID,
        First_Name: callerRow.First_Name,
        Last_Name: callerRow.Last_Name,
        TODA_ID: callerRow.TODA_ID,
        isDriver: roles.isDriver,
        isOperator: roles.isOperator,
        isOfficer: roles.isOfficer,
        isPresident: roles.isPresident,
        canWriteToda: roles.canWriteToda,
        isSecretary: roles.isSecretary,
        officerTodaId: roles.officerTodaId,
        officerPositions: roles.officerPositions,
        officerTerms: roles.officerTerms,
        managedFederations: roles.managedFederations
    };
}

// params: caller (required)
function requireLocalSecretary(caller) {
    if (!caller || !caller.isSecretary) {
        throw new Error("Only the Federation Secretary can perform this action.");
    }
}

// params: caller (required)
function requireLocalOfficer(caller) {
    const allowed = Boolean(caller && (caller.isSecretary || caller.isOfficer));
    if (!allowed) {
        throw new Error("Only an active TODA officer or the Federation Secretary can access this resource.");
    }
}

// params: dbState (required), member (required)
function enrichLocalMemberBase(dbState, member) {
    const toda = findLocalToda(dbState, member.TODA_ID);
    const out = localCloneData(member);
    out.TODA_Name = toda ? toda.TODA_Name : null;
    out.Route = toda ? toda.Route : null;
    out.Terminal_Location = toda ? toda.Terminal_Location : null;
    return out;
}

// params: dbState (required), todaId (required)
function buildLocalTodaSummary(dbState, todaId) {
    const toda = findLocalToda(dbState, todaId);
    if (!toda) {
        return null;
    }
    const out = localCloneData(toda);
    const fed = toda.Federation_ID ? findLocalFederation(dbState, toda.Federation_ID) : null;
    out.federationName = fed ? fed.Federation_Name : null;

    const today = localGetTodayDateText();
    const activePresTerms = [];
    const termCount = dbState.officer_terms.length;
    for (let i = 0; i < termCount; i += 1) {
        const term = dbState.officer_terms[i];
        if (!localSameKey(term.TODA_ID, toda.TODA_ID)) {
            continue;
        }
        if (term.Position !== "President") {
            continue;
        }
        if (!localIsTermActive(term, today)) {
            continue;
        }
        activePresTerms.push(term);
    }
    activePresTerms.sort(function (a, b) {
        if (a.Term_Start !== b.Term_Start) {
            return b.Term_Start.localeCompare(a.Term_Start);
        }
        return a.Term_ID.localeCompare(b.Term_ID);
    });

    if (activePresTerms.length > 0) {
        const top = activePresTerms[0];
        const presMem = findLocalMember(dbState, top.Member_ID);
        out.president = {
            Term_ID: top.Term_ID,
            Member_ID: top.Member_ID,
            First_Name: presMem ? presMem.First_Name : "",
            Last_Name: presMem ? presMem.Last_Name : "",
            Term_Start: top.Term_Start,
            Term_End: top.Term_End
        };
    } else {
        out.president = null;
    }
    return out;
}

// params: dbState (required), tricycleId (required)
function buildLocalUnitAssignments(dbState, tricycleId) {
    const list = [];
    const asnCount = dbState.driver_assignments.length;
    for (let i = 0; i < asnCount; i += 1) {
        const asn = dbState.driver_assignments[i];
        if (!localSameKey(asn.Tricycle_ID, tricycleId)) {
            continue;
        }
        const drv = findLocalMember(dbState, asn.Member_ID);
        const row = localCloneData(asn);
        row.First_Name = drv ? drv.First_Name : "";
        row.Last_Name = drv ? drv.Last_Name : "";
        row.Contact_Number = drv ? drv.Contact_Number : "";
        row.License_Number = drv ? drv.License_Number : null;
        row.License_Expiry_Date = drv ? drv.License_Expiry_Date : null;
        row.License_Type = drv ? drv.License_Type : null;
        row.Restriction_Code = drv ? drv.Restriction_Code : null;
        row.PSO_ID_Number = drv ? drv.PSO_ID_Number : null;
        row.BLS_Cert_ID = drv ? drv.BLS_Cert_ID : null;
        row.Member_TODA_ID = drv ? drv.TODA_ID : null;
        list.push(row);
    }
    list.sort(compareAssignmentOrder);
    return list;
}

// params: dbState (required), unit (required), includeOwnerContact (optional)
function enrichLocalTricycle(dbState, unit, includeOwnerContact) {
    const owner = findLocalMember(dbState, unit.Owner_Member_ID);
    const ownerToda = owner ? findLocalToda(dbState, owner.TODA_ID) : null;
    const out = localCloneData(unit);
    out.Owner_First_Name = owner ? owner.First_Name : "";
    out.Owner_Last_Name = owner ? owner.Last_Name : "";
    if (includeOwnerContact) {
        out.Owner_Contact_Number = owner ? owner.Contact_Number : "";
    }
    out.Owner_TODA_ID = owner ? owner.TODA_ID : null;
    out.Owner_TODA_Name = ownerToda ? ownerToda.TODA_Name : null;
    out.assignments = buildLocalUnitAssignments(dbState, unit.Tricycle_ID);
    return out;
}

// params: dbState (required), memberId (required)
function buildLocalDrivenAssignments(dbState, memberId) {
    const list = [];
    const asnCount = dbState.driver_assignments.length;
    for (let i = 0; i < asnCount; i += 1) {
        const asn = dbState.driver_assignments[i];
        if (!localSameKey(asn.Member_ID, memberId)) {
            continue;
        }
        const unit = findLocalTricycle(dbState, asn.Tricycle_ID);
        if (!unit) {
            continue;
        }
        const owner = findLocalMember(dbState, unit.Owner_Member_ID);
        const row = localCloneData(asn);
        row.Body_Number = unit.Body_Number;
        row.Franchise_Number = unit.Franchise_Number;
        row.Chassis_Number = unit.Chassis_Number;
        row.Plate_Number = unit.Plate_Number;
        row.Franchise_Expiry_Date = unit.Franchise_Expiry_Date;
        row.Mayors_Permit_Expiry = unit.Mayors_Permit_Expiry;
        row.Franchise_Status = unit.Franchise_Status;
        row.OR_CR_Expiry = unit.OR_CR_Expiry;
        row.Color_Zone = unit.Color_Zone;
        row.Owner_Member_ID = unit.Owner_Member_ID;
        row.Owner_First_Name = owner ? owner.First_Name : "";
        row.Owner_Last_Name = owner ? owner.Last_Name : "";
        row.Owner_TODA_ID = owner ? owner.TODA_ID : null;
        list.push(row);
    }
    list.sort(compareAssignmentOrder);
    return list;
}

// params: item (required), caller (required)
function isLocalNoticeVisible(item, caller) {
    if (item.targetType === "all") {
        return true;
    }
    if (item.targetType === "officers") {
        return Boolean(caller.isSecretary || caller.isOfficer);
    }
    if (item.targetType === "toda") {
        const inHomeToda = Boolean(caller.TODA_ID && localSameKey(item.targetId, caller.TODA_ID));
        const inOfficerToda = Boolean(caller.officerTodaId && localSameKey(item.targetId, caller.officerTodaId));
        return inHomeToda || inOfficerToda;
    }
    if (item.targetType === "member") {
        return localSameKey(item.targetId, caller.Member_ID);
    }
    return false;
}

/* system, oobe, reset, seed, login, home, and export handlers */

// params: dbState (required)
function handleLocalStatus(dbState) {
    const fedCount = dbState.federations.length;
    const todaCount = dbState.todas.length;
    const memCount = dbState.members.length;
    const setupRequired = fedCount === 0 && memCount === 0;
    return {
        ok: true,
        setupRequired: setupRequired,
        federationCount: fedCount,
        todaCount: todaCount,
        memberCount: memCount
    };
}

// params: dbState (required), payload (required)
function handleLocalOobe(dbState, payload) {
    if (dbState.federations.length > 0 || dbState.members.length > 0) {
        throw new Error("First-time setup is already completed.");
    }

    const fedId = localCleanText(payload.Federation_ID);
    const fedName = localCleanText(payload.Federation_Name);
    const fedAccrNum = localCleanText(payload.Accreditation_Number);
    const fedAccrExp = localCleanText(payload.Accreditation_Expiry);
    const fedAddr = localCleanText(payload.Office_Address);

    const todaId = localCleanText(payload.TODA_ID);
    const todaName = localCleanText(payload.TODA_Name);
    const todaRoute = localCleanText(payload.Route);
    const todaSecReg = localCleanText(payload.SEC_Reg_Number);
    const todaTerminal = localCleanText(payload.Terminal_Location);
    let todaAccrExp = localCleanText(payload.TODA_Accreditation_Expiry);
    if (!todaAccrExp) {
        todaAccrExp = localCleanText(payload.Toda_Accreditation_Expiry);
    }
    if (!todaAccrExp) {
        todaAccrExp = fedAccrExp;
    }
    let todaStatus = localCleanText(payload.Association_Status);
    if (!todaStatus) {
        todaStatus = LOCAL_DEFAULT_TODA_STATUS;
    }

    const secId = localCleanText(payload.Member_ID);
    const firstName = localCleanText(payload.First_Name);
    const lastName = localCleanText(payload.Last_Name);
    const street = localCleanText(payload.Street);
    const barangay = localCleanText(payload.Barangay);
    let city = localCleanText(payload.City_Municipality);
    if (!city) {
        city = LOCAL_DEFAULT_CITY;
    }
    const contact = localCleanText(payload.Contact_Number);

    if (!fedId || !fedName || !fedAccrNum || !fedAccrExp || !fedAddr) {
        throw new Error("All Federation setup fields (ID, Name, Accreditation Number, Expiry, and Office Address) are required.");
    }
    if (!todaId || !todaName || !todaRoute || !todaSecReg || !todaTerminal || !todaAccrExp) {
        throw new Error("Founding TODA fields (ID, Name, Route, SEC Registration Number, Terminal Location, and Accreditation Expiry) are required.");
    }
    if (!secId || !firstName || !lastName || !street || !barangay || !contact) {
        throw new Error("Secretary Member fields (ID, First Name, Last Name, Street, Barangay, and Contact Number) are required.");
    }

    // based on final_dbms1_relational-model.md, Secretary_Member_ID, clone database state so four-step setup stay atomic
    const working = localCloneData(dbState);

    dbInsertFederation(working, {
        Federation_ID: fedId,
        Federation_Name: fedName,
        Accreditation_Number: fedAccrNum,
        Accreditation_Expiry: fedAccrExp,
        Office_Address: fedAddr,
        Secretary_Member_ID: null
    });

    dbInsertToda(working, {
        TODA_ID: todaId,
        TODA_Name: todaName,
        Route: todaRoute,
        SEC_Reg_Number: todaSecReg,
        Terminal_Location: todaTerminal,
        Accreditation_Expiry: todaAccrExp,
        Association_Status: todaStatus,
        Federation_ID: fedId
    });

    dbInsertMember(working, {
        Member_ID: secId,
        First_Name: firstName,
        Last_Name: lastName,
        Street: street,
        Barangay: barangay,
        City_Municipality: city,
        Contact_Number: contact,
        License_Number: payload.License_Number,
        License_Expiry_Date: payload.License_Expiry_Date,
        License_Type: payload.License_Type,
        Restriction_Code: payload.Restriction_Code,
        PSO_ID_Number: payload.PSO_ID_Number,
        BLS_Cert_ID: payload.BLS_Cert_ID,
        TODA_ID: todaId
    });

    dbUpdateFederation(working, fedId, {
        Secretary_Member_ID: secId
    });

    const officerPos = localCleanOptional(payload.Officer_Position);
    const assignPres = payload.assignAsPresident === true;
    let initialPosition = null;
    if (officerPos) {
        initialPosition = officerPos;
    } else if (assignPres) {
        initialPosition = "President";
    }

    if (initialPosition) {
        let termId = localCleanText(payload.Term_ID);
        if (!termId) {
            termId = "TERM-01";
        }
        let termStart = localCleanText(payload.Term_Start);
        if (!termStart) {
            termStart = localGetTodayDateText();
        }
        let termEnd = localCleanText(payload.Term_End);
        if (!termEnd) {
            termEnd = todaAccrExp;
        }
        dbInsertOfficerTerm(working, {
            Term_ID: termId,
            Member_ID: secId,
            TODA_ID: todaId,
            Position: initialPosition,
            Term_Start: termStart,
            Term_End: termEnd
        });
    }

    saveLocalDb(working);
    clearLocalNotices();
    return {
        ok: true,
        Federation_ID: fedId,
        TODA_ID: todaId,
        Secretary_Member_ID: secId
    };
}

// params: dbState (required)
function handleLocalSeed(dbState) {
    const isEmpty = dbState.federations.length === 0 && dbState.members.length === 0;
    if (!isEmpty) {
        const rawSession = sessionStorage.getItem(LOCAL_SESSION_KEY);
        const callerId = localCleanText(rawSession);
        if (!callerId) {
            throw new Error("Database is not empty. Sign in as the Federation Secretary to reload sample records.");
        }
        let isSec = false;
        const fedCount = dbState.federations.length;
        for (let i = 0; i < fedCount; i += 1) {
            if (localSameKey(dbState.federations[i].Secretary_Member_ID, callerId)) {
                isSec = true;
                break;
            }
        }
        if (!isSec) {
            throw new Error("Only the Federation Secretary can reload sample records when data exists.");
        }
    }

    const seeded = seedLocalDb();
    return {
        ok: true,
        counts: {
            federations: seeded.federations.length,
            todas: seeded.todas.length,
            members: seeded.members.length,
            tricycles: seeded.tricycles.length,
            assignments: seeded.driver_assignments.length,
            officerTerms: seeded.officer_terms.length
        }
    };
}

// params: dbState (required), payload (required)
function handleLocalLogin(dbState, payload) {
    const memberId = localCleanText(payload.Member_ID);
    const rawPortal = localCleanText(payload.portal);
    const portal = rawPortal.toLowerCase();

    if (!memberId) {
        throw new Error("Member_ID is required.");
    }
    const rawMember = findLocalMember(dbState, memberId);
    if (!rawMember) {
        throw new Error("Member ID not found.");
    }

    const member = enrichLocalMemberBase(dbState, rawMember);
    const roles = computeLocalMemberRoles(dbState, rawMember);

    if (portal === "admin") {
        const hasAdminAccess = roles.isSecretary || roles.isOfficer;
        if (!hasAdminAccess) {
            throw new Error("Admin Portal access requires an active TODA officer term or Federation Secretary appointment.");
        }
    }

    const rawToda = findLocalToda(dbState, rawMember.TODA_ID);
    const toda = rawToda ? localCloneData(rawToda) : null;
    let federation = null;
    if (roles.managedFederations.length > 0) {
        federation = roles.managedFederations[0];
    }

    return {
        ok: true,
        member: member,
        toda: toda,
        federation: federation,
        roles: roles
    };
}

// params: dbState (required), caller (required), targetId (required)
function handleLocalGetHome(dbState, caller, targetId) {
    const isSelf = localSameKey(caller.Member_ID, targetId);
    if (!isSelf && !caller.isSecretary && !caller.isOfficer) {
        throw new Error("Can only open own home dashboard.");
    }
    const rawMember = findLocalMember(dbState, targetId);
    if (!rawMember) {
        throw new Error("Member not found.");
    }
    const isSameTodaOfficer = Boolean(caller.isOfficer && localSameKey(rawMember.TODA_ID, caller.officerTodaId));
    if (!isSelf && !caller.isSecretary && !isSameTodaOfficer) {
        throw new Error("Can only view members in the same TODA group.");
    }

    const member = enrichLocalMemberBase(dbState, rawMember);
    const roles = computeLocalMemberRoles(dbState, rawMember);
    const toda = buildLocalTodaSummary(dbState, rawMember.TODA_ID);

    let federation = null;
    if (roles.managedFederations.length > 0) {
        federation = roles.managedFederations[0];
    }

    const ownedUnits = [];
    const triCount = dbState.tricycles.length;
    for (let i = 0; i < triCount; i += 1) {
        const unit = dbState.tricycles[i];
        if (localSameKey(unit.Owner_Member_ID, rawMember.Member_ID)) {
            ownedUnits.push(enrichLocalTricycle(dbState, unit, false));
        }
    }
    ownedUnits.sort(function (a, b) {
        return a.Body_Number.localeCompare(b.Body_Number);
    });

    const drivenAssignments = buildLocalDrivenAssignments(dbState, rawMember.Member_ID);
    const today = localGetTodayDateText();

    let officerToda = null;
    let todaStats = null;
    if (roles.isOfficer && roles.officerTodaId) {
        officerToda = buildLocalTodaSummary(dbState, roles.officerTodaId);
        let memCount = 0;
        let licCount = 0;
        const mLen = dbState.members.length;
        for (let i = 0; i < mLen; i += 1) {
            const m = dbState.members[i];
            if (localSameKey(m.TODA_ID, roles.officerTodaId)) {
                memCount += 1;
                if (localCleanOptional(m.License_Number)) {
                    licCount += 1;
                }
            }
        }

        let unitCount = 0;
        for (let i = 0; i < triCount; i += 1) {
            const owner = findLocalMember(dbState, dbState.tricycles[i].Owner_Member_ID);
            if (owner && localSameKey(owner.TODA_ID, roles.officerTodaId)) {
                unitCount += 1;
            }
        }

        let activeAsnCount = 0;
        const asnLen = dbState.driver_assignments.length;
        for (let i = 0; i < asnLen; i += 1) {
            const asn = dbState.driver_assignments[i];
            if (asn.Status !== "Active") {
                continue;
            }
            const unit = findLocalTricycle(dbState, asn.Tricycle_ID);
            const owner = unit ? findLocalMember(dbState, unit.Owner_Member_ID) : null;
            if (owner && localSameKey(owner.TODA_ID, roles.officerTodaId)) {
                activeAsnCount += 1;
            }
        }

        let officerCount = 0;
        const tLen = dbState.officer_terms.length;
        for (let i = 0; i < tLen; i += 1) {
            const term = dbState.officer_terms[i];
            if (localSameKey(term.TODA_ID, roles.officerTodaId) && localIsTermActive(term, today)) {
                officerCount += 1;
            }
        }

        todaStats = {
            memberCount: memCount,
            licensedCount: licCount,
            unitCount: unitCount,
            activeAssignmentCount: activeAsnCount,
            officerCount: officerCount
        };
    }

    let secretaryStats = null;
    if (roles.isSecretary) {
        const presTodas = {};
        let presCount = 0;
        let activeOffCount = 0;
        const tLen = dbState.officer_terms.length;
        for (let i = 0; i < tLen; i += 1) {
            const term = dbState.officer_terms[i];
            if (!localIsTermActive(term, today)) {
                continue;
            }
            activeOffCount += 1;
            if (term.Position === "President" && !presTodas[term.TODA_ID]) {
                presTodas[term.TODA_ID] = true;
                presCount += 1;
            }
        }

        let drvCount = 0;
        const mLen = dbState.members.length;
        for (let i = 0; i < mLen; i += 1) {
            if (localCleanOptional(dbState.members[i].License_Number)) {
                drvCount += 1;
            }
        }

        let activeAsnCount = 0;
        const asnLen = dbState.driver_assignments.length;
        for (let i = 0; i < asnLen; i += 1) {
            if (dbState.driver_assignments[i].Status === "Active") {
                activeAsnCount += 1;
            }
        }

        secretaryStats = {
            federationCount: dbState.federations.length,
            todaCount: dbState.todas.length,
            presidentCount: presCount,
            officerCount: activeOffCount,
            memberCount: dbState.members.length,
            driverCount: drvCount,
            unitCount: dbState.tricycles.length,
            activeAssignmentCount: activeAsnCount
        };
    }

    return {
        ok: true,
        member: member,
        toda: toda,
        federation: federation,
        roles: roles,
        ownedUnits: ownedUnits,
        drivenAssignments: drivenAssignments,
        officerToda: officerToda,
        todaStats: todaStats,
        secretaryStats: secretaryStats
    };
}

// params: dbState (required), caller (required), query (required)
function handleLocalExport(dbState, caller, query) {
    requireLocalOfficer(caller);
    const requestedTodaId = localCleanText(query.get("todaId"));

    let scopedTodaId = null;
    if (!caller.isSecretary) {
        scopedTodaId = caller.officerTodaId;
        if (requestedTodaId && requestedTodaId !== "all" && !localSameKey(requestedTodaId, scopedTodaId)) {
            throw new Error("Can only export records for the officer's own TODA group.");
        }
    } else if (requestedTodaId && requestedTodaId !== "all") {
        scopedTodaId = requestedTodaId;
    }

    const federations = [];
    if (caller.isSecretary && !scopedTodaId) {
        const fedLen = dbState.federations.length;
        for (let i = 0; i < fedLen; i += 1) {
            federations.push(localCloneData(dbState.federations[i]));
        }
    } else if (scopedTodaId) {
        const scopedToda = findLocalToda(dbState, scopedTodaId);
        if (scopedToda && scopedToda.Federation_ID) {
            const linkedFed = findLocalFederation(dbState, scopedToda.Federation_ID);
            if (linkedFed) {
                federations.push(localCloneData(linkedFed));
            }
        }
    }
    federations.sort(function (a, b) {
        return a.Federation_ID.localeCompare(b.Federation_ID);
    });

    const todas = [];
    const todaLen = dbState.todas.length;
    for (let i = 0; i < todaLen; i += 1) {
        const t = dbState.todas[i];
        if (!scopedTodaId || localSameKey(t.TODA_ID, scopedTodaId)) {
            todas.push(localCloneData(t));
        }
    }
    todas.sort(function (a, b) {
        return a.TODA_ID.localeCompare(b.TODA_ID);
    });

    const members = [];
    const memLen = dbState.members.length;
    for (let i = 0; i < memLen; i += 1) {
        const m = dbState.members[i];
        if (!scopedTodaId || localSameKey(m.TODA_ID, scopedTodaId)) {
            members.push(localCloneData(m));
        }
    }
    members.sort(function (a, b) {
        return a.Member_ID.localeCompare(b.Member_ID);
    });

    const tricycles = [];
    const triLen = dbState.tricycles.length;
    for (let i = 0; i < triLen; i += 1) {
        const u = dbState.tricycles[i];
        const owner = findLocalMember(dbState, u.Owner_Member_ID);
        if (!scopedTodaId || (owner && localSameKey(owner.TODA_ID, scopedTodaId))) {
            tricycles.push(localCloneData(u));
        }
    }
    tricycles.sort(function (a, b) {
        return a.Tricycle_ID.localeCompare(b.Tricycle_ID);
    });

    const assignments = [];
    const asnLen = dbState.driver_assignments.length;
    for (let i = 0; i < asnLen; i += 1) {
        const asn = dbState.driver_assignments[i];
        const unit = findLocalTricycle(dbState, asn.Tricycle_ID);
        const owner = unit ? findLocalMember(dbState, unit.Owner_Member_ID) : null;
        if (!scopedTodaId || (owner && localSameKey(owner.TODA_ID, scopedTodaId))) {
            assignments.push(localCloneData(asn));
        }
    }
    assignments.sort(function (a, b) {
        return a.Assignment_ID.localeCompare(b.Assignment_ID);
    });

    const officerTerms = [];
    const termLen = dbState.officer_terms.length;
    for (let i = 0; i < termLen; i += 1) {
        const term = dbState.officer_terms[i];
        if (!scopedTodaId || localSameKey(term.TODA_ID, scopedTodaId)) {
            officerTerms.push(localCloneData(term));
        }
    }
    officerTerms.sort(function (a, b) {
        return a.Term_ID.localeCompare(b.Term_ID);
    });

    return {
        ok: true,
        tables: {
            federation: federations,
            toda_association: todas,
            member: members,
            tricycle: tricycles,
            driver_assignment: assignments,
            officer_term: officerTerms
        }
    };
}

/* federation handlers */

// params: dbState (required)
function handleLocalListFederations(dbState) {
    const list = [];
    const fedLen = dbState.federations.length;
    const todaLen = dbState.todas.length;
    for (let i = 0; i < fedLen; i += 1) {
        const fed = dbState.federations[i];
        const sec = fed.Secretary_Member_ID ? findLocalMember(dbState, fed.Secretary_Member_ID) : null;
        let todaCount = 0;
        for (let j = 0; j < todaLen; j += 1) {
            if (localSameKey(dbState.todas[j].Federation_ID, fed.Federation_ID)) {
                todaCount += 1;
            }
        }
        const row = localCloneData(fed);
        row.Secretary_First_Name = sec ? sec.First_Name : null;
        row.Secretary_Last_Name = sec ? sec.Last_Name : null;
        row.todaCount = todaCount;
        list.push(row);
    }
    list.sort(function (a, b) {
        return a.Federation_ID.localeCompare(b.Federation_ID);
    });
    return { ok: true, federations: list };
}

// params: dbState (required), fedId (required)
function handleLocalGetFederation(dbState, fedId) {
    const fed = findLocalFederation(dbState, fedId);
    if (!fed) {
        throw new Error("Federation not found.");
    }
    const sec = fed.Secretary_Member_ID ? findLocalMember(dbState, fed.Secretary_Member_ID) : null;
    const linkedTodas = [];
    const todaLen = dbState.todas.length;
    for (let i = 0; i < todaLen; i += 1) {
        if (localSameKey(dbState.todas[i].Federation_ID, fed.Federation_ID)) {
            linkedTodas.push(localCloneData(dbState.todas[i]));
        }
    }
    linkedTodas.sort(function (a, b) {
        return a.TODA_ID.localeCompare(b.TODA_ID);
    });

    const out = localCloneData(fed);
    out.Secretary_First_Name = sec ? sec.First_Name : null;
    out.Secretary_Last_Name = sec ? sec.Last_Name : null;
    out.todaCount = linkedTodas.length;
    out.todas = linkedTodas;
    return { ok: true, federation: out };
}

/* toda_association handlers */

// params: dbState (required), query (required)
function handleLocalListTodas(dbState, query) {
    const fedFilter = localCleanText(query.get("federationId"));
    const statusFilter = localCleanText(query.get("status"));
    const rawQ = localCleanText(query.get("q"));
    const q = rawQ.toLowerCase();
    const today = localGetTodayDateText();

    const list = [];
    const todaLen = dbState.todas.length;
    const memLen = dbState.members.length;
    const triLen = dbState.tricycles.length;
    const termLen = dbState.officer_terms.length;

    for (let i = 0; i < todaLen; i += 1) {
        const t = dbState.todas[i];
        if (fedFilter && fedFilter !== "all") {
            if (fedFilter === "none") {
                if (t.Federation_ID !== null) {
                    continue;
                }
            } else if (!localSameKey(t.Federation_ID, fedFilter)) {
                continue;
            }
        }
        if (statusFilter && statusFilter !== "all" && t.Association_Status !== statusFilter) {
            continue;
        }
        if (q) {
            const hayRaw = t.TODA_ID + " " + t.TODA_Name + " " + t.Route + " " + t.Terminal_Location;
            const hay = hayRaw.toLowerCase();
            if (hay.indexOf(q) === -1) {
                continue;
            }
        }

        const summary = buildLocalTodaSummary(dbState, t.TODA_ID);
        let memberCount = 0;
        for (let m = 0; m < memLen; m += 1) {
            if (localSameKey(dbState.members[m].TODA_ID, t.TODA_ID)) {
                memberCount += 1;
            }
        }
        let unitCount = 0;
        for (let u = 0; u < triLen; u += 1) {
            const owner = findLocalMember(dbState, dbState.tricycles[u].Owner_Member_ID);
            if (owner && localSameKey(owner.TODA_ID, t.TODA_ID)) {
                unitCount += 1;
            }
        }
        let officerCount = 0;
        for (let k = 0; k < termLen; k += 1) {
            const term = dbState.officer_terms[k];
            if (localSameKey(term.TODA_ID, t.TODA_ID) && localIsTermActive(term, today)) {
                officerCount += 1;
            }
        }
        summary.memberCount = memberCount;
        summary.unitCount = unitCount;
        summary.officerCount = officerCount;
        list.push(summary);
    }

    list.sort(function (a, b) {
        return a.TODA_ID.localeCompare(b.TODA_ID);
    });
    return { ok: true, todas: list };
}

// params: dbState (required), todaId (required)
function handleLocalGetToda(dbState, todaId) {
    const toda = buildLocalTodaSummary(dbState, todaId);
    if (!toda) {
        throw new Error("TODA association not found.");
    }
    const today = localGetTodayDateText();

    let memberCount = 0;
    const memLen = dbState.members.length;
    for (let i = 0; i < memLen; i += 1) {
        if (localSameKey(dbState.members[i].TODA_ID, toda.TODA_ID)) {
            memberCount += 1;
        }
    }

    let unitCount = 0;
    const triLen = dbState.tricycles.length;
    for (let i = 0; i < triLen; i += 1) {
        const owner = findLocalMember(dbState, dbState.tricycles[i].Owner_Member_ID);
        if (owner && localSameKey(owner.TODA_ID, toda.TODA_ID)) {
            unitCount += 1;
        }
    }

    const officerTerms = [];
    let activeOfficerCount = 0;
    const termLen = dbState.officer_terms.length;
    for (let i = 0; i < termLen; i += 1) {
        const term = dbState.officer_terms[i];
        if (!localSameKey(term.TODA_ID, toda.TODA_ID)) {
            continue;
        }
        const mem = findLocalMember(dbState, term.Member_ID);
        const active = localIsTermActive(term, today);
        if (active) {
            activeOfficerCount += 1;
        }
        const row = localCloneData(term);
        row.First_Name = mem ? mem.First_Name : "";
        row.Last_Name = mem ? mem.Last_Name : "";
        row.Contact_Number = mem ? mem.Contact_Number : "";
        row.isActive = active;
        officerTerms.push(row);
    }

    officerTerms.sort(function (a, b) {
        if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
        }
        if (a.Term_Start !== b.Term_Start) {
            return b.Term_Start.localeCompare(a.Term_Start);
        }
        return a.Term_ID.localeCompare(b.Term_ID);
    });

    toda.memberCount = memberCount;
    toda.unitCount = unitCount;
    toda.officerCount = activeOfficerCount;
    toda.officerTerms = officerTerms;
    return { ok: true, toda: toda };
}

/* member and licensed driver handlers */

// params: dbState (required), caller (required), query (required)
function handleLocalListMembers(dbState, caller, query) {
    requireLocalOfficer(caller);

    const todaId = localCleanText(query.get("todaId"));
    const barangay = localCleanText(query.get("barangay"));
    const rawQ = localCleanText(query.get("q"));
    const q = rawQ.toLowerCase();
    const sort = localCleanText(query.get("sort"));
    const licensedOnly = query.get("licensedOnly") === "1";
    const rawRole = localCleanText(query.get("role"));
    const role = rawRole.toLowerCase();

    let scopedTodaId = todaId;
    if (!caller.isSecretary) {
        if (!caller.officerTodaId) {
            throw new Error("Only an active TODA officer or the Federation Secretary can view the member roster.");
        }
        if (todaId && todaId !== "all" && !localSameKey(todaId, caller.officerTodaId)) {
            throw new Error("Can only view members in the same TODA group.");
        }
        scopedTodaId = caller.officerTodaId;
    }

    const list = [];
    const memLen = dbState.members.length;
    const triLen = dbState.tricycles.length;
    const asnLen = dbState.driver_assignments.length;

    for (let i = 0; i < memLen; i += 1) {
        const m = dbState.members[i];
        if (scopedTodaId && scopedTodaId !== "all" && !localSameKey(m.TODA_ID, scopedTodaId)) {
            continue;
        }
        if (barangay && barangay !== "all" && !localSameKey(m.Barangay, barangay)) {
            continue;
        }
        const hasLic = Boolean(localCleanOptional(m.License_Number));
        if (licensedOnly && !hasLic) {
            continue;
        }

        const roles = computeLocalMemberRoles(dbState, m);
        if (role === "driver" && !roles.isDriver) {
            continue;
        } else if (role === "operator" && !roles.isOperator) {
            continue;
        } else if (role === "president" && !roles.isPresident) {
            continue;
        } else if (role === "officer" && !roles.isOfficer) {
            continue;
        } else if (role === "secretary" && !roles.isSecretary) {
            continue;
        } else if (role === "none") {
            const hasAny = roles.isDriver || roles.isOperator || roles.isOfficer || roles.isSecretary;
            if (hasAny) {
                continue;
            }
        }

        if (q) {
            const hayRaw = m.Member_ID + " " + m.First_Name + " " + m.Last_Name + " " + m.Barangay + " " + m.Contact_Number;
            const hay = hayRaw.toLowerCase();
            if (hay.indexOf(q) === -1) {
                continue;
            }
        }

        let ownedCount = 0;
        for (let u = 0; u < triLen; u += 1) {
            if (localSameKey(dbState.tricycles[u].Owner_Member_ID, m.Member_ID)) {
                ownedCount += 1;
            }
        }

        const drivenBodies = [];
        let activeShiftCount = 0;
        for (let a = 0; a < asnLen; a += 1) {
            const asn = dbState.driver_assignments[a];
            if (localSameKey(asn.Member_ID, m.Member_ID) && asn.Status === "Active") {
                activeShiftCount += 1;
                const unit = findLocalTricycle(dbState, asn.Tricycle_ID);
                if (unit) {
                    drivenBodies.push(unit.Body_Number);
                }
            }
        }
        drivenBodies.sort();

        const toda = findLocalToda(dbState, m.TODA_ID);
        const row = localCloneData(m);
        row.TODA_Name = toda ? toda.TODA_Name : null;
        row.ownedUnitCount = ownedCount;
        row.activeShiftCount = activeShiftCount;
        row.Driven_Body_Numbers = drivenBodies.length > 0 ? drivenBodies.join(", ") : null;
        row.Active_Officer_Positions = roles.officerPositions.length > 0 ? roles.officerPositions.join(", ") : null;
        row.isSecretary = roles.isSecretary;
        list.push(row);
    }

    list.sort(function (a, b) {
        if (sort === "id") {
            return a.Member_ID.localeCompare(b.Member_ID);
        }
        const fn = a.First_Name.localeCompare(b.First_Name);
        if (fn !== 0) {
            return fn;
        }
        return a.Last_Name.localeCompare(b.Last_Name);
    });
    return { ok: true, members: list };
}

// params: dbState (required), query (required)
function handleLocalListDrivers(dbState, query) {
    const todaId = localCleanText(query.get("todaId"));
    const list = [];
    const memLen = dbState.members.length;
    const asnLen = dbState.driver_assignments.length;

    for (let i = 0; i < memLen; i += 1) {
        const m = dbState.members[i];
        if (!localCleanOptional(m.License_Number)) {
            continue;
        }
        if (todaId && todaId !== "all" && !localSameKey(m.TODA_ID, todaId)) {
            continue;
        }

        const drivenBodies = [];
        let activeShiftCount = 0;
        for (let a = 0; a < asnLen; a += 1) {
            const asn = dbState.driver_assignments[a];
            if (localSameKey(asn.Member_ID, m.Member_ID) && asn.Status === "Active") {
                activeShiftCount += 1;
                const unit = findLocalTricycle(dbState, asn.Tricycle_ID);
                if (unit) {
                    drivenBodies.push(unit.Body_Number);
                }
            }
        }
        drivenBodies.sort();

        const toda = findLocalToda(dbState, m.TODA_ID);
        list.push({
            Member_ID: m.Member_ID,
            First_Name: m.First_Name,
            Last_Name: m.Last_Name,
            Contact_Number: m.Contact_Number,
            License_Number: m.License_Number,
            License_Expiry_Date: m.License_Expiry_Date,
            License_Type: m.License_Type,
            Restriction_Code: m.Restriction_Code,
            PSO_ID_Number: m.PSO_ID_Number,
            BLS_Cert_ID: m.BLS_Cert_ID,
            TODA_ID: m.TODA_ID,
            TODA_Name: toda ? toda.TODA_Name : null,
            activeShiftCount: activeShiftCount,
            Driven_Body_Numbers: drivenBodies.length > 0 ? drivenBodies.join(", ") : null
        });
    }

    list.sort(function (a, b) {
        const fn = a.First_Name.localeCompare(b.First_Name);
        if (fn !== 0) {
            return fn;
        }
        return a.Last_Name.localeCompare(b.Last_Name);
    });
    return { ok: true, members: list };
}

// params: dbState (required), caller (required), memberId (required)
function handleLocalGetMember(dbState, caller, memberId) {
    const rawMember = findLocalMember(dbState, memberId);
    if (!rawMember) {
        throw new Error("Member not found.");
    }
    const isSelf = localSameKey(caller.Member_ID, rawMember.Member_ID);
    const isSameTodaOfficer = Boolean(caller.isOfficer && localSameKey(rawMember.TODA_ID, caller.officerTodaId));
    if (!isSelf && !caller.isSecretary && !isSameTodaOfficer) {
        throw new Error("Do not have permission to view this member.");
    }

    const member = enrichLocalMemberBase(dbState, rawMember);
    const roles = computeLocalMemberRoles(dbState, rawMember);
    const toda = buildLocalTodaSummary(dbState, rawMember.TODA_ID);

    const ownedUnits = [];
    const triLen = dbState.tricycles.length;
    for (let i = 0; i < triLen; i += 1) {
        const u = dbState.tricycles[i];
        if (localSameKey(u.Owner_Member_ID, rawMember.Member_ID)) {
            ownedUnits.push(enrichLocalTricycle(dbState, u, false));
        }
    }
    ownedUnits.sort(function (a, b) {
        return a.Body_Number.localeCompare(b.Body_Number);
    });

    const drivenAssignments = buildLocalDrivenAssignments(dbState, rawMember.Member_ID);
    const today = localGetTodayDateText();
    const allTerms = [];
    const termLen = dbState.officer_terms.length;
    for (let i = 0; i < termLen; i += 1) {
        const term = dbState.officer_terms[i];
        if (!localSameKey(term.Member_ID, rawMember.Member_ID)) {
            continue;
        }
        const termToda = findLocalToda(dbState, term.TODA_ID);
        const row = localCloneData(term);
        row.TODA_Name = termToda ? termToda.TODA_Name : null;
        row.isActive = localIsTermActive(term, today);
        allTerms.push(row);
    }
    allTerms.sort(function (a, b) {
        if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
        }
        return b.Term_Start.localeCompare(a.Term_Start);
    });

    return {
        ok: true,
        member: member,
        toda: toda,
        roles: roles,
        ownedUnits: ownedUnits,
        drivenAssignments: drivenAssignments,
        officerTerms: allTerms
    };
}

/* tricycle handlers */

// params: dbState (required), caller (required), query (required)
function handleLocalListTricycles(dbState, caller, query) {
    const todaId = localCleanText(query.get("todaId"));
    const ownerId = localCleanText(query.get("ownerId"));
    const driverId = localCleanText(query.get("driverId"));
    const colorZone = localCleanText(query.get("colorZone"));
    const status = localCleanText(query.get("status"));
    const rawQ = localCleanText(query.get("q"));
    const q = rawQ.toLowerCase();

    let scopedTodaId = todaId;
    let restrictToCallerUnits = false;

    if (!caller.isSecretary) {
        const isSelfOwner = Boolean(ownerId && localSameKey(ownerId, caller.Member_ID));
        const isSelfDriver = Boolean(driverId && localSameKey(driverId, caller.Member_ID));
        const isSelfLookup = isSelfOwner || isSelfDriver;
        if (caller.isOfficer && caller.officerTodaId && !isSelfLookup) {
            if (todaId && todaId !== "all" && !localSameKey(todaId, caller.officerTodaId)) {
                throw new Error("Can only view tricycles in the same TODA group.");
            }
            scopedTodaId = caller.officerTodaId;
        } else {
            if (ownerId && !localSameKey(ownerId, caller.Member_ID)) {
                throw new Error("Can only view own tricycles.");
            }
            restrictToCallerUnits = true;
        }
    }

    const list = [];
    const triLen = dbState.tricycles.length;
    for (let i = 0; i < triLen; i += 1) {
        const u = dbState.tricycles[i];
        const row = enrichLocalTricycle(dbState, u, false);

        if (scopedTodaId && scopedTodaId !== "all" && !localSameKey(row.Owner_TODA_ID, scopedTodaId)) {
            continue;
        }
        if (ownerId && !localSameKey(u.Owner_Member_ID, ownerId)) {
            continue;
        }
        if (driverId) {
            let drivesUnit = false;
            const asnLen = row.assignments.length;
            for (let a = 0; a < asnLen; a += 1) {
                if (localSameKey(row.assignments[a].Member_ID, driverId)) {
                    drivesUnit = true;
                    break;
                }
            }
            if (!drivesUnit) {
                continue;
            }
        }
        if (colorZone && colorZone !== "all") {
            if (colorZone === "none") {
                if (u.Color_Zone !== null) {
                    continue;
                }
            } else if (u.Color_Zone !== colorZone) {
                continue;
            }
        }
        if (status && status !== "all" && u.Franchise_Status !== status) {
            continue;
        }
        if (restrictToCallerUnits) {
            const owns = localSameKey(u.Owner_Member_ID, caller.Member_ID);
            let drives = false;
            const asnLen = row.assignments.length;
            for (let a = 0; a < asnLen; a += 1) {
                if (localSameKey(row.assignments[a].Member_ID, caller.Member_ID)) {
                    drives = true;
                    break;
                }
            }
            if (!owns && !drives) {
                continue;
            }
        }
        if (q) {
            const hayRaw = u.Tricycle_ID + " " + u.Body_Number + " " + u.Plate_Number + " " + u.Franchise_Number;
            const hay = hayRaw.toLowerCase();
            if (hay.indexOf(q) === -1) {
                continue;
            }
        }
        list.push(row);
    }

    list.sort(function (a, b) {
        return a.Body_Number.localeCompare(b.Body_Number);
    });
    return { ok: true, tricycles: list };
}

/* driver assignment handlers */

// params: dbState (required), caller (required), query (required)
function handleLocalListAssignments(dbState, caller, query) {
    const tricycleId = localCleanText(query.get("tricycleId"));
    const memberId = localCleanText(query.get("memberId"));
    const todaId = localCleanText(query.get("todaId"));
    const status = localCleanText(query.get("status"));
    const driverRole = localCleanText(query.get("driverRole"));

    let scopedTodaId = todaId;
    let restrictToCaller = false;

    if (!caller.isSecretary) {
        const isSelfMember = Boolean(memberId && localSameKey(memberId, caller.Member_ID));
        if (caller.isOfficer && caller.officerTodaId && !isSelfMember) {
            if (todaId && todaId !== "all" && !localSameKey(todaId, caller.officerTodaId)) {
                throw new Error("Can only view shift assignments in the same TODA group.");
            }
            scopedTodaId = caller.officerTodaId;
        } else {
            restrictToCaller = true;
        }
    }

    const list = [];
    const asnLen = dbState.driver_assignments.length;
    for (let i = 0; i < asnLen; i += 1) {
        const asn = dbState.driver_assignments[i];
        const drv = findLocalMember(dbState, asn.Member_ID);
        const unit = findLocalTricycle(dbState, asn.Tricycle_ID);
        if (!drv || !unit) {
            continue;
        }
        const owner = findLocalMember(dbState, unit.Owner_Member_ID);
        const ownerTodaId = owner ? owner.TODA_ID : null;

        if (tricycleId && !localSameKey(asn.Tricycle_ID, tricycleId)) {
            continue;
        }
        if (memberId && !localSameKey(asn.Member_ID, memberId)) {
            continue;
        }
        if (scopedTodaId && scopedTodaId !== "all") {
            const ownerMatch = localSameKey(ownerTodaId, scopedTodaId);
            const drvMatch = localSameKey(drv.TODA_ID, scopedTodaId);
            if (!ownerMatch && !drvMatch) {
                continue;
            }
        }
        if (status && status !== "all" && asn.Status !== status) {
            continue;
        }
        if (driverRole && driverRole !== "all" && asn.Driver_Role !== driverRole) {
            continue;
        }
        if (restrictToCaller) {
            const isDrv = localSameKey(asn.Member_ID, caller.Member_ID);
            const isOwn = localSameKey(unit.Owner_Member_ID, caller.Member_ID);
            if (!isDrv && !isOwn) {
                continue;
            }
        }

        const row = localCloneData(asn);
        row.First_Name = drv.First_Name;
        row.Last_Name = drv.Last_Name;
        row.Contact_Number = drv.Contact_Number;
        row.License_Number = drv.License_Number;
        row.License_Expiry_Date = drv.License_Expiry_Date;
        row.License_Type = drv.License_Type;
        row.PSO_ID_Number = drv.PSO_ID_Number;
        row.Member_TODA_ID = drv.TODA_ID;
        row.Body_Number = unit.Body_Number;
        row.Plate_Number = unit.Plate_Number;
        row.Franchise_Number = unit.Franchise_Number;
        row.Franchise_Status = unit.Franchise_Status;
        row.Color_Zone = unit.Color_Zone;
        row.Owner_Member_ID = unit.Owner_Member_ID;
        row.Owner_First_Name = owner ? owner.First_Name : "";
        row.Owner_Last_Name = owner ? owner.Last_Name : "";
        row.Owner_TODA_ID = ownerTodaId;
        list.push(row);
    }

    list.sort(compareAssignmentOrder);
    return { ok: true, assignments: list };
}

/* officer term handlers */

// params: dbState (required), query (required)
function handleLocalListOfficerTerms(dbState, query) {
    const todaId = localCleanText(query.get("todaId"));
    const memberId = localCleanText(query.get("memberId"));
    const position = localCleanText(query.get("position"));
    const rawActive = query.get("activeOnly");
    const activeOnly = rawActive === "1" || rawActive === "true";
    const today = localGetTodayDateText();

    const list = [];
    const termLen = dbState.officer_terms.length;
    for (let i = 0; i < termLen; i += 1) {
        const term = dbState.officer_terms[i];
        const isActive = localIsTermActive(term, today);
        if (todaId && todaId !== "all" && !localSameKey(term.TODA_ID, todaId)) {
            continue;
        }
        if (memberId && !localSameKey(term.Member_ID, memberId)) {
            continue;
        }
        if (position && position !== "all" && term.Position !== position) {
            continue;
        }
        if (activeOnly && !isActive) {
            continue;
        }

        const mem = findLocalMember(dbState, term.Member_ID);
        const toda = findLocalToda(dbState, term.TODA_ID);
        const row = localCloneData(term);
        row.First_Name = mem ? mem.First_Name : "";
        row.Last_Name = mem ? mem.Last_Name : "";
        row.Contact_Number = mem ? mem.Contact_Number : "";
        row.TODA_Name = toda ? toda.TODA_Name : null;
        row.isActive = isActive;
        list.push(row);
    }

    list.sort(function (a, b) {
        if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
        }
        const todaCmp = a.TODA_ID.localeCompare(b.TODA_ID);
        if (todaCmp !== 0) {
            return todaCmp;
        }
        const posA = getPositionSortRank(a.Position);
        const posB = getPositionSortRank(b.Position);
        if (posA !== posB) {
            return posA - posB;
        }
        return b.Term_Start.localeCompare(a.Term_Start);
    });
    return { ok: true, officerTerms: list };
}

/* main offline request router */

// params: method (required), pathWithQuery (required), body (optional)
function routeLocalApiRequest(method, pathWithQuery, body) {
    const qMark = pathWithQuery.indexOf("?");
    let pathname = pathWithQuery;
    let queryStr = "";
    if (qMark !== -1) {
        pathname = pathWithQuery.slice(0, qMark);
        queryStr = pathWithQuery.slice(qMark + 1);
    }
    const query = new URLSearchParams(queryStr);
    const payload = body || {};
    const dbState = loadLocalDb();

    /* public routes */
    if (method === "GET" && pathname === "/status") {
        return handleLocalStatus(dbState);
    }
    if (method === "POST" && pathname === "/oobe") {
        return handleLocalOobe(dbState, payload);
    }
    if (method === "POST" && pathname === "/seed") {
        return handleLocalSeed(dbState);
    }
    if (method === "POST" && pathname === "/login") {
        return handleLocalLogin(dbState, payload);
    }

    /* authenticated routes */
    const caller = resolveLocalCaller(dbState);

    if (method === "GET" && pathname === "/schema") {
        const schemaCopy = getLocalSchemaClone();
        return { ok: true, tables: schemaCopy };
    }

    if (method === "POST" && pathname === "/reset") {
        requireLocalSecretary(caller);
        const bodyMemberId = localCleanText(payload.Member_ID);
        if (bodyMemberId && !localSameKey(bodyMemberId, caller.Member_ID)) {
            throw new Error("Caller identity mismatch.");
        }
        resetLocalDb();
        return { ok: true };
    }

    if (method === "GET" && pathname.indexOf("/home/") === 0) {
        const targetId = decodeURIComponent(pathname.slice(6));
        return handleLocalGetHome(dbState, caller, targetId);
    }

    if (method === "GET" && pathname === "/export") {
        return handleLocalExport(dbState, caller, query);
    }

    /* federations */
    if (method === "GET" && pathname === "/federations") {
        return handleLocalListFederations(dbState);
    }
    if (method === "GET" && pathname.indexOf("/federations/") === 0) {
        const fedId = decodeURIComponent(pathname.slice(13));
        return handleLocalGetFederation(dbState, fedId);
    }
    if (method === "POST" && pathname === "/federations") {
        requireLocalSecretary(caller);
        let fedId = localCleanText(payload.Federation_ID);
        if (!fedId) {
            fedId = localGenerateNextId(dbState.federations, "Federation_ID", "FED-", 2);
        }
        const created = dbInsertFederation(dbState, {
            Federation_ID: fedId,
            Federation_Name: payload.Federation_Name,
            Accreditation_Number: payload.Accreditation_Number,
            Accreditation_Expiry: payload.Accreditation_Expiry,
            Office_Address: payload.Office_Address,
            Secretary_Member_ID: payload.Secretary_Member_ID
        });
        saveLocalDb(dbState);
        return { ok: true, Federation_ID: created.Federation_ID };
    }
    if (method === "PUT" && pathname.indexOf("/federations/") === 0) {
        requireLocalSecretary(caller);
        const fedId = decodeURIComponent(pathname.slice(13));
        const current = findLocalFederation(dbState, fedId);
        if (!current) {
            throw new Error("Federation not found.");
        }
        if (payload.Secretary_Member_ID !== undefined) {
            const reqSec = localCleanOptional(payload.Secretary_Member_ID);
            if (!reqSec && current.Secretary_Member_ID) {
                let otherSecCount = 0;
                const fedLen = dbState.federations.length;
                for (let i = 0; i < fedLen; i += 1) {
                    const f = dbState.federations[i];
                    if (f.Secretary_Member_ID && !localSameKey(f.Federation_ID, current.Federation_ID)) {
                        otherSecCount += 1;
                    }
                }
                if (otherSecCount === 0) {
                    throw new Error("Appoint another Federation Secretary before clearing the last active secretary.");
                }
            }
        }
        dbUpdateFederation(dbState, fedId, payload);
        saveLocalDb(dbState);
        return { ok: true };
    }
    if (method === "DELETE" && pathname.indexOf("/federations/") === 0) {
        requireLocalSecretary(caller);
        const fedId = decodeURIComponent(pathname.slice(13));
        const current = findLocalFederation(dbState, fedId);
        if (!current) {
            throw new Error("Federation not found.");
        }
        if (localSameKey(current.Secretary_Member_ID, caller.Member_ID)) {
            let otherCount = 0;
            const fedLen = dbState.federations.length;
            for (let i = 0; i < fedLen; i += 1) {
                const f = dbState.federations[i];
                if (localSameKey(f.Secretary_Member_ID, caller.Member_ID) && !localSameKey(f.Federation_ID, current.Federation_ID)) {
                    otherCount += 1;
                }
            }
            if (otherCount === 0) {
                throw new Error("Cannot delete the only federation managed by the active Federation Secretary.");
            }
        }
        dbDeleteFederation(dbState, fedId);
        saveLocalDb(dbState);
        return { ok: true };
    }

    /* todas */
    if (method === "GET" && pathname === "/todas") {
        return handleLocalListTodas(dbState, query);
    }
    if (method === "GET" && pathname.indexOf("/todas/") === 0) {
        const todaId = decodeURIComponent(pathname.slice(7));
        return handleLocalGetToda(dbState, todaId);
    }
    if (method === "POST" && pathname === "/todas") {
        requireLocalSecretary(caller);
        let todaId = localCleanText(payload.TODA_ID);
        if (!todaId) {
            todaId = localGenerateNextId(dbState.todas, "TODA_ID", "TODA-", 2);
        }
        const created = dbInsertToda(dbState, {
            TODA_ID: todaId,
            TODA_Name: payload.TODA_Name,
            Route: payload.Route,
            SEC_Reg_Number: payload.SEC_Reg_Number,
            Terminal_Location: payload.Terminal_Location,
            Accreditation_Expiry: payload.Accreditation_Expiry,
            Association_Status: payload.Association_Status,
            Federation_ID: payload.Federation_ID
        });
        saveLocalDb(dbState);
        return { ok: true, TODA_ID: created.TODA_ID };
    }
    if (method === "PUT" && pathname.indexOf("/todas/") === 0) {
        requireLocalOfficer(caller);
        const todaId = decodeURIComponent(pathname.slice(7));
        const isSameTodaPres = Boolean(caller.isPresident && localSameKey(caller.officerTodaId, todaId));
        if (!caller.isSecretary && !isSameTodaPres) {
            throw new Error("Only the Federation Secretary or the active President of this TODA can update association details.");
        }
        const current = findLocalToda(dbState, todaId);
        if (!current) {
            throw new Error("TODA association not found.");
        }
        if (payload.Federation_ID !== undefined && !caller.isSecretary) {
            const reqFed = localCleanOptional(payload.Federation_ID);
            const sameFed = (reqFed === null && current.Federation_ID === null) || localSameKey(reqFed, current.Federation_ID);
            if (!sameFed) {
                throw new Error("Only the Federation Secretary can change TODA federation affiliation.");
            }
        }
        dbUpdateToda(dbState, todaId, payload);
        saveLocalDb(dbState);
        return { ok: true };
    }
    if (method === "DELETE" && pathname.indexOf("/todas/") === 0) {
        requireLocalSecretary(caller);
        const todaId = decodeURIComponent(pathname.slice(7));
        dbDeleteToda(dbState, todaId);
        saveLocalDb(dbState);
        return { ok: true };
    }

    /* drivers and members */
    if (method === "GET" && pathname === "/drivers") {
        return handleLocalListDrivers(dbState, query);
    }
    if (method === "GET" && pathname === "/members") {
        return handleLocalListMembers(dbState, caller, query);
    }
    if (method === "GET" && pathname.indexOf("/members/") === 0) {
        const memberId = decodeURIComponent(pathname.slice(9));
        return handleLocalGetMember(dbState, caller, memberId);
    }
    if (method === "POST" && pathname === "/members") {
        requireLocalOfficer(caller);
        const reqTodaId = localCleanText(payload.TODA_ID);
        if (!caller.isSecretary) {
            if (!caller.canWriteToda) {
                throw new Error("Only the Federation Secretary or an authorized TODA officer (President, Vice President, or Secretary) can register members.");
            }
            if (!localSameKey(reqTodaId, caller.officerTodaId)) {
                throw new Error("Can only register members under the officer's own TODA group.");
            }
        }
        let memberId = localCleanText(payload.Member_ID);
        if (!memberId) {
            memberId = localGenerateNextId(dbState.members, "Member_ID", "MEM-", 3);
        }
        const created = dbInsertMember(dbState, {
            Member_ID: memberId,
            First_Name: payload.First_Name,
            Last_Name: payload.Last_Name,
            Street: payload.Street,
            Barangay: payload.Barangay,
            City_Municipality: payload.City_Municipality,
            Contact_Number: payload.Contact_Number,
            License_Number: payload.License_Number,
            License_Expiry_Date: payload.License_Expiry_Date,
            License_Type: payload.License_Type,
            Restriction_Code: payload.Restriction_Code,
            PSO_ID_Number: payload.PSO_ID_Number,
            BLS_Cert_ID: payload.BLS_Cert_ID,
            TODA_ID: reqTodaId
        });
        saveLocalDb(dbState);
        return { ok: true, Member_ID: created.Member_ID };
    }
    if (method === "PUT" && pathname.indexOf("/members/") === 0 && pathname.endsWith("/toda")) {
        requireLocalSecretary(caller);
        const segLen = pathname.length - 5;
        const memberId = decodeURIComponent(pathname.slice(9, segLen));
        dbTransferMemberToda(dbState, memberId, payload.TODA_ID);
        saveLocalDb(dbState);
        return { ok: true };
    }
    if (method === "PUT" && pathname.indexOf("/members/") === 0) {
        const memberId = decodeURIComponent(pathname.slice(9));
        const target = findLocalMember(dbState, memberId);
        if (!target) {
            throw new Error("Member not found.");
        }
        const isSelf = localSameKey(caller.Member_ID, target.Member_ID);
        const isSameTodaWriter = Boolean(caller.canWriteToda && localSameKey(target.TODA_ID, caller.officerTodaId));
        if (!isSelf && !caller.isSecretary && !isSameTodaWriter) {
            throw new Error("Do not have permission to update this member.");
        }
        dbUpdateMember(dbState, target.Member_ID, payload);
        saveLocalDb(dbState);
        return { ok: true };
    }
    if (method === "DELETE" && pathname.indexOf("/members/") === 0) {
        requireLocalOfficer(caller);
        const memberId = decodeURIComponent(pathname.slice(9));
        if (localSameKey(caller.Member_ID, memberId)) {
            throw new Error("Cannot delete own active account.");
        }
        const target = findLocalMember(dbState, memberId);
        if (!target) {
            throw new Error("Member not found.");
        }
        if (!caller.isSecretary) {
            const isSameTodaPres = Boolean(caller.isPresident && localSameKey(target.TODA_ID, caller.officerTodaId));
            if (!isSameTodaPres) {
                throw new Error("Only the Federation Secretary or the TODA President of that association can permanently delete a member record.");
            }
        }
        dbDeleteMember(dbState, target.Member_ID);
        saveLocalDb(dbState);
        return { ok: true };
    }

    /* tricycles */
    if (method === "GET" && pathname === "/tricycles") {
        return handleLocalListTricycles(dbState, caller, query);
    }
    if (method === "GET" && pathname.indexOf("/tricycles/") === 0) {
        const tricycleId = decodeURIComponent(pathname.slice(11));
        const unit = findLocalTricycle(dbState, tricycleId);
        if (!unit) {
            throw new Error("Tricycle unit not found.");
        }
        const row = enrichLocalTricycle(dbState, unit, true);
        let isAssignedDriver = false;
        const asnLen = row.assignments.length;
        for (let i = 0; i < asnLen; i += 1) {
            if (localSameKey(row.assignments[i].Member_ID, caller.Member_ID)) {
                isAssignedDriver = true;
                break;
            }
        }
        const isOwner = localSameKey(row.Owner_Member_ID, caller.Member_ID);
        const isSameTodaOfficer = Boolean(caller.isOfficer && localSameKey(row.Owner_TODA_ID, caller.officerTodaId));
        if (!caller.isSecretary && !isOwner && !isAssignedDriver && !isSameTodaOfficer) {
            throw new Error("Do not have permission to view this tricycle unit.");
        }
        return { ok: true, tricycle: row };
    }
    if (method === "POST" && pathname === "/tricycles") {
        const ownerId = localCleanText(payload.Owner_Member_ID);
        const owner = findLocalMember(dbState, ownerId);
        if (!owner) {
            throw new Error("Selected Owner_Member_ID does not exist.");
        }
        if (!caller.isSecretary && !localSameKey(owner.Member_ID, caller.Member_ID)) {
            if (!caller.canWriteToda || !localSameKey(owner.TODA_ID, caller.officerTodaId)) {
                throw new Error("Can only register tricycle units for own Member ID or for members in the officer's own TODA group.");
            }
        }
        let tricycleId = localCleanText(payload.Tricycle_ID);
        if (!tricycleId) {
            tricycleId = localGenerateNextId(dbState.tricycles, "Tricycle_ID", "TRI-", 3);
        }
        const created = dbInsertTricycle(dbState, {
            Tricycle_ID: tricycleId,
            Body_Number: payload.Body_Number,
            Franchise_Number: payload.Franchise_Number,
            Chassis_Number: payload.Chassis_Number,
            Plate_Number: payload.Plate_Number,
            Franchise_Expiry_Date: payload.Franchise_Expiry_Date,
            Mayors_Permit_Expiry: payload.Mayors_Permit_Expiry,
            Franchise_Status: payload.Franchise_Status,
            OR_CR_Expiry: payload.OR_CR_Expiry,
            Color_Zone: payload.Color_Zone,
            Owner_Member_ID: owner.Member_ID
        });
        saveLocalDb(dbState);
        return { ok: true, Tricycle_ID: created.Tricycle_ID, Body_Number: created.Body_Number };
    }
    if (method === "PUT" && pathname.indexOf("/tricycles/") === 0) {
        const tricycleId = decodeURIComponent(pathname.slice(11));
        const unit = findLocalTricycle(dbState, tricycleId);
        if (!unit) {
            throw new Error("Tricycle unit not found.");
        }
        const owner = findLocalMember(dbState, unit.Owner_Member_ID);
        const isOwner = localSameKey(unit.Owner_Member_ID, caller.Member_ID);
        const isSameTodaWriter = Boolean(caller.canWriteToda && owner && localSameKey(owner.TODA_ID, caller.officerTodaId));
        if (!caller.isSecretary && !isOwner && !isSameTodaWriter) {
            throw new Error("Do not have permission to update this tricycle unit.");
        }
        if (payload.Owner_Member_ID !== undefined) {
            const nextOwnerId = localCleanText(payload.Owner_Member_ID);
            if (nextOwnerId && !localSameKey(nextOwnerId, unit.Owner_Member_ID)) {
                const newOwner = findLocalMember(dbState, nextOwnerId);
                if (!newOwner) {
                    throw new Error("New Owner_Member_ID does not exist.");
                }
                if (!caller.isSecretary && !isOwner) {
                    if (!localSameKey(newOwner.TODA_ID, caller.officerTodaId)) {
                        throw new Error("TODA officers can only transfer ownership within the same TODA group.");
                    }
                }
            }
        }
        dbUpdateTricycle(dbState, unit.Tricycle_ID, payload);
        saveLocalDb(dbState);
        return { ok: true };
    }
    if (method === "DELETE" && pathname.indexOf("/tricycles/") === 0) {
        const tricycleId = decodeURIComponent(pathname.slice(11));
        const unit = findLocalTricycle(dbState, tricycleId);
        if (!unit) {
            throw new Error("Tricycle unit not found.");
        }
        const owner = findLocalMember(dbState, unit.Owner_Member_ID);
        const isOwner = localSameKey(unit.Owner_Member_ID, caller.Member_ID);
        const isSameTodaPres = Boolean(caller.isPresident && owner && localSameKey(owner.TODA_ID, caller.officerTodaId));
        if (!caller.isSecretary && !isOwner && !isSameTodaPres) {
            throw new Error("Only the unit owner, TODA President, or Federation Secretary can delete this tricycle unit.");
        }
        dbDeleteTricycle(dbState, unit.Tricycle_ID);
        saveLocalDb(dbState);
        return { ok: true };
    }

    /* driver assignments */
    if (method === "GET" && pathname === "/assignments") {
        return handleLocalListAssignments(dbState, caller, query);
    }
    if (method === "GET" && pathname.indexOf("/assignments/") === 0) {
        const assignmentId = decodeURIComponent(pathname.slice(13));
        const asn = findLocalAssignment(dbState, assignmentId);
        if (!asn) {
            throw new Error("Driver assignment not found.");
        }
        const drv = findLocalMember(dbState, asn.Member_ID);
        const unit = findLocalTricycle(dbState, asn.Tricycle_ID);
        const owner = unit ? findLocalMember(dbState, unit.Owner_Member_ID) : null;
        const isOwner = Boolean(unit && localSameKey(unit.Owner_Member_ID, caller.Member_ID));
        const isDriver = localSameKey(asn.Member_ID, caller.Member_ID);
        const sameOwnerToda = Boolean(owner && localSameKey(owner.TODA_ID, caller.officerTodaId));
        const sameDrvToda = Boolean(drv && localSameKey(drv.TODA_ID, caller.officerTodaId));
        const isSameTodaOfficer = Boolean(caller.isOfficer && (sameOwnerToda || sameDrvToda));
        if (!caller.isSecretary && !isOwner && !isDriver && !isSameTodaOfficer) {
            throw new Error("Do not have permission to view this shift assignment.");
        }
        const row = localCloneData(asn);
        row.First_Name = drv ? drv.First_Name : "";
        row.Last_Name = drv ? drv.Last_Name : "";
        row.License_Number = drv ? drv.License_Number : null;
        row.License_Type = drv ? drv.License_Type : null;
        row.PSO_ID_Number = drv ? drv.PSO_ID_Number : null;
        row.Member_TODA_ID = drv ? drv.TODA_ID : null;
        row.Body_Number = unit ? unit.Body_Number : "";
        row.Plate_Number = unit ? unit.Plate_Number : "";
        row.Owner_Member_ID = unit ? unit.Owner_Member_ID : "";
        row.Owner_TODA_ID = owner ? owner.TODA_ID : null;
        return { ok: true, assignment: row };
    }
    if (method === "POST" && pathname === "/assignments") {
        const unit = findLocalTricycle(dbState, localCleanText(payload.Tricycle_ID));
        if (!unit) {
            throw new Error("Tricycle unit not found.");
        }
        const owner = findLocalMember(dbState, unit.Owner_Member_ID);
        const isOwner = localSameKey(unit.Owner_Member_ID, caller.Member_ID);
        const isSameTodaWriter = Boolean(caller.canWriteToda && owner && localSameKey(owner.TODA_ID, caller.officerTodaId));
        if (!caller.isSecretary && !isOwner && !isSameTodaWriter) {
            throw new Error("Only the unit operator, Federation Secretary, or an authorized TODA officer can assign shift drivers.");
        }
        let assignmentId = localCleanText(payload.Assignment_ID);
        if (!assignmentId) {
            assignmentId = localGenerateNextId(dbState.driver_assignments, "Assignment_ID", "ASN-", 2);
        }
        const created = dbInsertAssignment(dbState, {
            Assignment_ID: assignmentId,
            Member_ID: payload.Member_ID,
            Tricycle_ID: unit.Tricycle_ID,
            Driver_Role: payload.Driver_Role,
            Shift_Schedule: payload.Shift_Schedule,
            Date_Assigned: payload.Date_Assigned,
            Status: payload.Status
        });
        saveLocalDb(dbState);
        if (created.Status === "Active") {
            notifyLocalDriverAssigned(created.Member_ID, unit.Body_Number, created.Driver_Role, created.Shift_Schedule, caller);
        }
        return { ok: true, Assignment_ID: created.Assignment_ID };
    }
    if (method === "PUT" && pathname.indexOf("/assignments/") === 0) {
        const assignmentId = decodeURIComponent(pathname.slice(13));
        const current = findLocalAssignment(dbState, assignmentId);
        if (!current) {
            throw new Error("Driver assignment not found.");
        }
        const unit = findLocalTricycle(dbState, current.Tricycle_ID);
        const owner = unit ? findLocalMember(dbState, unit.Owner_Member_ID) : null;
        const isOwner = Boolean(unit && localSameKey(unit.Owner_Member_ID, caller.Member_ID));
        const isSameTodaWriter = Boolean(caller.canWriteToda && owner && localSameKey(owner.TODA_ID, caller.officerTodaId));
        if (!caller.isSecretary && !isOwner && !isSameTodaWriter) {
            throw new Error("Do not have permission to update this shift assignment.");
        }
        const prevMemberId = current.Member_ID;
        const updated = dbUpdateAssignment(dbState, current.Assignment_ID, payload);
        saveLocalDb(dbState);
        if (updated.Status === "Active" && !localSameKey(updated.Member_ID, prevMemberId)) {
            const targetUnit = findLocalTricycle(dbState, updated.Tricycle_ID);
            const bodyNum = targetUnit ? targetUnit.Body_Number : "";
            notifyLocalDriverAssigned(updated.Member_ID, bodyNum, updated.Driver_Role, updated.Shift_Schedule, caller);
        }
        return { ok: true };
    }
    if (method === "DELETE" && pathname.indexOf("/assignments/") === 0) {
        const assignmentId = decodeURIComponent(pathname.slice(13));
        const current = findLocalAssignment(dbState, assignmentId);
        if (!current) {
            throw new Error("Driver assignment not found.");
        }
        const unit = findLocalTricycle(dbState, current.Tricycle_ID);
        const owner = unit ? findLocalMember(dbState, unit.Owner_Member_ID) : null;
        const isOwner = Boolean(unit && localSameKey(unit.Owner_Member_ID, caller.Member_ID));
        const isSameTodaWriter = Boolean(caller.canWriteToda && owner && localSameKey(owner.TODA_ID, caller.officerTodaId));
        if (!caller.isSecretary && !isOwner && !isSameTodaWriter) {
            throw new Error("Do not have permission to delete this shift assignment.");
        }
        dbDeleteAssignment(dbState, current.Assignment_ID);
        saveLocalDb(dbState);
        return { ok: true };
    }

    /* officer terms */
    if (method === "GET" && pathname === "/officer-terms") {
        return handleLocalListOfficerTerms(dbState, query);
    }
    if (method === "GET" && pathname.indexOf("/officer-terms/") === 0) {
        const termId = decodeURIComponent(pathname.slice(15));
        const term = findLocalOfficerTerm(dbState, termId);
        if (!term) {
            throw new Error("Officer term not found.");
        }
        const mem = findLocalMember(dbState, term.Member_ID);
        const toda = findLocalToda(dbState, term.TODA_ID);
        const row = localCloneData(term);
        row.First_Name = mem ? mem.First_Name : "";
        row.Last_Name = mem ? mem.Last_Name : "";
        row.Contact_Number = mem ? mem.Contact_Number : "";
        row.TODA_Name = toda ? toda.TODA_Name : null;
        row.isActive = localIsTermActive(term);
        return { ok: true, officerTerm: row };
    }
    if (method === "POST" && pathname === "/officer-terms") {
        requireLocalOfficer(caller);
        const position = localCleanText(payload.Position);
        const todaId = localCleanText(payload.TODA_ID);
        if (position === "President") {
            if (!caller.isSecretary) {
                throw new Error("Only the Federation Secretary can appoint a TODA President.");
            }
        } else {
            const isSameTodaPres = Boolean(caller.isPresident && localSameKey(caller.officerTodaId, todaId));
            if (!caller.isSecretary && !isSameTodaPres) {
                throw new Error("Only the Federation Secretary or the active President of this TODA can assign board officer terms.");
            }
        }
        let termId = localCleanText(payload.Term_ID);
        if (!termId) {
            termId = localGenerateNextId(dbState.officer_terms, "Term_ID", "TERM-", 2);
        }
        const created = dbInsertOfficerTerm(dbState, {
            Term_ID: termId,
            Member_ID: payload.Member_ID,
            TODA_ID: todaId,
            Position: position,
            Term_Start: payload.Term_Start,
            Term_End: payload.Term_End
        });
        saveLocalDb(dbState);
        const toda = findLocalToda(dbState, created.TODA_ID);
        const todaName = toda ? toda.TODA_Name : created.TODA_ID;
        notifyLocalOfficerAssigned(created.Member_ID, todaName, created.Position, created.Term_Start, created.Term_End, caller);
        return { ok: true, Term_ID: created.Term_ID };
    }
    if (method === "PUT" && pathname.indexOf("/officer-terms/") === 0) {
        requireLocalOfficer(caller);
        const termId = decodeURIComponent(pathname.slice(15));
        const current = findLocalOfficerTerm(dbState, termId);
        if (!current) {
            throw new Error("Officer term not found.");
        }
        let nextPos = current.Position;
        if (payload.Position !== undefined) {
            nextPos = localCleanText(payload.Position);
        }
        let nextTodaId = current.TODA_ID;
        if (payload.TODA_ID !== undefined) {
            nextTodaId = localCleanText(payload.TODA_ID);
        }
        const touchesPres = current.Position === "President" || nextPos === "President";
        if (touchesPres && !caller.isSecretary) {
            throw new Error("Only the Federation Secretary can modify a TODA President term.");
        }
        if (!caller.isSecretary) {
            const sameCur = localSameKey(caller.officerTodaId, current.TODA_ID);
            const sameNext = localSameKey(nextTodaId, current.TODA_ID);
            const isSameTodaPres = Boolean(caller.isPresident && sameCur && sameNext);
            if (!isSameTodaPres) {
                throw new Error("Only the Federation Secretary or the active President of this TODA can update board officer terms.");
            }
        }
        dbUpdateOfficerTerm(dbState, current.Term_ID, payload);
        saveLocalDb(dbState);
        return { ok: true };
    }
    if (method === "DELETE" && pathname.indexOf("/officer-terms/") === 0) {
        requireLocalOfficer(caller);
        const termId = decodeURIComponent(pathname.slice(15));
        const current = findLocalOfficerTerm(dbState, termId);
        if (!current) {
            throw new Error("Officer term not found.");
        }
        if (current.Position === "President" && !caller.isSecretary) {
            throw new Error("Only the Federation Secretary can remove a TODA President term.");
        }
        if (!caller.isSecretary) {
            const isSameTodaPres = Boolean(caller.isPresident && localSameKey(caller.officerTodaId, current.TODA_ID));
            if (!isSameTodaPres) {
                throw new Error("Only the Federation Secretary or the active President of this TODA can remove board officer terms.");
            }
        }
        dbDeleteOfficerTerm(dbState, current.Term_ID);
        saveLocalDb(dbState);
        return { ok: true };
    }

    /* notifications */
    if (method === "GET" && pathname === "/notifications") {
        const allItems = loadLocalNotices();
        const visible = [];
        let unreadCount = 0;
        for (let i = allItems.length - 1; i >= 0; i -= 1) {
            const item = allItems[i];
            if (!isLocalNoticeVisible(item, caller)) {
                continue;
            }
            let readBy = [];
            if (Array.isArray(item.readBy)) {
                readBy = item.readBy;
            }
            const isRead = readBy.indexOf(caller.Member_ID) !== -1;
            if (!isRead) {
                unreadCount += 1;
            }
            visible.push({
                id: item.id,
                kind: item.kind || null,
                title: item.title,
                message: item.message,
                targetType: item.targetType,
                targetId: item.targetId,
                senderId: item.senderId,
                senderName: item.senderName,
                createdAt: item.createdAt,
                isRead: isRead
            });
        }
        return { ok: true, notifications: visible, unreadCount: unreadCount };
    }
    if (method === "POST" && pathname === "/notifications") {
        if (!caller.isSecretary && !caller.canWriteToda) {
            throw new Error("Only the Federation Secretary or an authorized TODA officer (President, Vice President, or Secretary) can send notices.");
        }
        const title = localCleanText(payload.title);
        const message = localCleanText(payload.message);
        let targetType = localCleanText(payload.targetType);
        if (!targetType) {
            targetType = LOCAL_DEFAULT_NOTICE_TARGET;
        }
        let targetId = localCleanText(payload.targetId);

        if (!title || !message) {
            throw new Error("Title and message are required.");
        }
        if (!caller.isSecretary) {
            if (targetType === "all" || targetType === "officers") {
                throw new Error("Only the Federation Secretary can send federation-wide notices.");
            }
            if (targetType === "toda") {
                targetId = caller.officerTodaId;
            } else if (targetType === "member") {
                if (!targetId) {
                    throw new Error("Member ID is required.");
                }
                const targetMem = findLocalMember(dbState, targetId);
                if (!targetMem || !localSameKey(targetMem.TODA_ID, caller.officerTodaId)) {
                    throw new Error("Can only send notices to members in the same TODA group.");
                }
                targetId = targetMem.Member_ID;
            } else {
                throw new Error("Invalid notification target type.");
            }
        } else if ((targetType === "toda" || targetType === "member") && !targetId) {
            throw new Error("Target ID is required.");
        }

        const allItems = loadLocalNotices();
        const nowMs = Date.now();
        const nextNum = allItems.length + 1;
        const noticeId = TRIDE_NOTICE_PREFIX + String(nowMs) + "-" + String(nextNum);
        const nowDate = new Date();
        const createdIso = nowDate.toISOString();
        const entry = {
            id: noticeId,
            title: title,
            message: message,
            targetType: targetType,
            targetId: targetId || null,
            senderId: caller.Member_ID,
            senderName: caller.First_Name + " " + caller.Last_Name,
            createdAt: createdIso,
            readBy: []
        };
        allItems.push(entry);
        saveLocalNotices(allItems);
        return { ok: true, notification: entry };
    }
    if (method === "PUT" && pathname === "/notifications/read-all") {
        const allItems = loadLocalNotices();
        let changed = false;
        const total = allItems.length;
        for (let i = 0; i < total; i += 1) {
            const item = allItems[i];
            if (!isLocalNoticeVisible(item, caller)) {
                continue;
            }
            if (!Array.isArray(item.readBy)) {
                item.readBy = [];
            }
            if (item.readBy.indexOf(caller.Member_ID) === -1) {
                item.readBy.push(caller.Member_ID);
                changed = true;
            }
        }
        if (changed) {
            saveLocalNotices(allItems);
        }
        return { ok: true };
    }
    if (method === "PUT" && pathname.indexOf("/notifications/") === 0 && pathname.endsWith("/read")) {
        const endIdx = pathname.length - 5;
        const noticeId = decodeURIComponent(pathname.slice(15, endIdx));
        const allItems = loadLocalNotices();
        let found = false;
        const total = allItems.length;
        for (let i = 0; i < total; i += 1) {
            const item = allItems[i];
            if (item.id === noticeId) {
                if (!isLocalNoticeVisible(item, caller)) {
                    throw new Error("Notification access denied.");
                }
                if (!Array.isArray(item.readBy)) {
                    item.readBy = [];
                }
                if (item.readBy.indexOf(caller.Member_ID) === -1) {
                    item.readBy.push(caller.Member_ID);
                }
                found = true;
                break;
            }
        }
        if (!found) {
            throw new Error("Notification not found.");
        }
        saveLocalNotices(allItems);
        return { ok: true };
    }

    throw new Error("Unknown endpoint: " + method + " " + pathname);
}
