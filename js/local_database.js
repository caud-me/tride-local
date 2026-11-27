/* localStorage persistence, constraint enforcement, fk actions, and triggers for dbms1_tride */

const TRIDE_DB_KEY = "tride_local_db_v2";
const TRIDE_NTF_KEY = "tride_local_notifications_v2";
const TRIDE_NOTICE_PREFIX = "NTF-";
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/* formatting and date helpers */

// params: val (optional)
function localCleanText(val) {
    if (typeof val === "number") {
        const numText = String(val);
        return numText.trim();
    }
    if (typeof val !== "string") {
        return "";
    }
    return val.trim();
}

// params: val (optional)
function localCleanOptional(val) {
    if (val === null || val === undefined) {
        return null;
    }
    const trimmed = localCleanText(val);
    if (trimmed === "") {
        return null;
    }
    return trimmed;
}

// params: val (required), list (required)
function localIsInList(val, list) {
    const count = list.length;
    for (let i = 0; i < count; i += 1) {
        if (list[i] === val) {
            return true;
        }
    }
    return false;
}

// params: val (optional)
function localIsValidDate(val) {
    if (typeof val !== "string") {
        return false;
    }
    const matches = LOCAL_DATE_PATTERN.test(val);
    if (!matches) {
        return false;
    }
    const parts = val.split("-");
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

// params: none
function localGetTodayDateText() {
    const now = new Date();
    const yearNum = now.getFullYear();
    const year = String(yearNum);
    const monthNum = now.getMonth() + 1;
    let month = String(monthNum);
    if (month.length < 2) {
        month = "0" + month;
    }
    const dayNum = now.getDate();
    let day = String(dayNum);
    if (day.length < 2) {
        day = "0" + day;
    }
    return year + "-" + month + "-" + day;
}

// params: num (required), minDigits (required)
function localPadDigits(num, minDigits) {
    let text = String(num);
    while (text.length < minDigits) {
        text = "0" + text;
    }
    return text;
}

// params: leftVal (optional), rightVal (optional)
function localSameKey(leftVal, rightVal) {
    if (leftVal === null || leftVal === undefined) {
        return false;
    }
    if (rightVal === null || rightVal === undefined) {
        return false;
    }
    const leftStr = String(leftVal);
    const rightStr = String(rightVal);
    const leftLower = leftStr.toLowerCase();
    const rightLower = rightStr.toLowerCase();
    return leftLower === rightLower;
}

// params: obj (required)
function localCloneData(obj) {
    const jsonText = JSON.stringify(obj);
    const copy = JSON.parse(jsonText);
    return copy;
}

// params: term (required), todayText (optional)
function localIsTermActive(term, todayText) {
    if (!term) {
        return false;
    }
    let today = todayText;
    if (!today) {
        today = localGetTodayDateText();
    }
    const afterStart = term.Term_Start <= today;
    const beforeEnd = term.Term_End >= today;
    return afterStart && beforeEnd;
}

/* storage persistence helpers */

// params: none
function createEmptyLocalDb() {
    return {
        federations: [],
        todas: [],
        members: [],
        tricycles: [],
        driver_assignments: [],
        officer_terms: []
    };
}

// params: dbState (required)
function saveLocalDb(dbState) {
    const serialized = JSON.stringify(dbState);
    localStorage.setItem(TRIDE_DB_KEY, serialized);
}

// params: none
function loadLocalDb() {
    const raw = localStorage.getItem(TRIDE_DB_KEY);
    if (raw === null) {
        const emptyDb = createEmptyLocalDb();
        saveLocalDb(emptyDb);
        return emptyDb;
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
            const fallback = createEmptyLocalDb();
            saveLocalDb(fallback);
            return fallback;
        }
        const safeState = {
            federations: Array.isArray(parsed.federations) ? parsed.federations : [],
            todas: Array.isArray(parsed.todas) ? parsed.todas : [],
            members: Array.isArray(parsed.members) ? parsed.members : [],
            tricycles: Array.isArray(parsed.tricycles) ? parsed.tricycles : [],
            driver_assignments: Array.isArray(parsed.driver_assignments) ? parsed.driver_assignments : [],
            officer_terms: Array.isArray(parsed.officer_terms) ? parsed.officer_terms : []
        };
        return safeState;
    } catch (err) {
        const emptyDb = createEmptyLocalDb();
        saveLocalDb(emptyDb);
        return emptyDb;
    }
}

// params: none
function resetLocalDb() {
    const emptyDb = createEmptyLocalDb();
    saveLocalDb(emptyDb);
    clearLocalNotices();
    return emptyDb;
}

// params: none
function seedLocalDb() {
    const seeded = buildLocalSeedState();
    saveLocalDb(seeded);
    clearLocalNotices();
    return seeded;
}

/* notification store helpers */

// params: none
function loadLocalNotices() {
    const raw = localStorage.getItem(TRIDE_NTF_KEY);
    if (!raw) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [];
    } catch (err) {
        return [];
    }
}

// params: items (required)
function saveLocalNotices(items) {
    const serialized = JSON.stringify(items);
    localStorage.setItem(TRIDE_NTF_KEY, serialized);
}

// params: none
function clearLocalNotices() {
    saveLocalNotices([]);
}

// params: driverId (required), bodyNumber (required), driverRole (optional), shiftSchedule (optional), caller (optional)
function notifyLocalDriverAssigned(driverId, bodyNumber, driverRole, shiftSchedule, caller) {
    const cleanDriverId = localCleanText(driverId);
    const cleanBody = localCleanText(bodyNumber);
    let cleanRole = localCleanText(driverRole);
    if (!cleanRole) {
        cleanRole = "Primary";
    }
    const cleanShift = localCleanText(shiftSchedule);
    if (!cleanDriverId || !cleanBody) {
        return;
    }

    const allItems = loadLocalNotices();
    const nowMs = Date.now();
    const nextNum = allItems.length + 1;
    const noticeId = TRIDE_NOTICE_PREFIX + String(nowMs) + "-" + String(nextNum);

    let senderId = "SYSTEM";
    let senderName = "TRIDE";
    if (caller && caller.Member_ID) {
        senderId = caller.Member_ID;
        if (caller.First_Name && caller.Last_Name) {
            senderName = caller.First_Name + " " + caller.Last_Name;
        } else {
            senderName = "Operator " + caller.Member_ID;
        }
    }

    let detailMsg = "Assigned as " + cleanRole + " driver for tricycle " + cleanBody;
    if (cleanShift) {
        detailMsg = detailMsg + " (" + cleanShift + ").";
    } else {
        detailMsg = detailMsg + ".";
    }

    const nowDate = new Date();
    const createdIso = nowDate.toISOString();

    const entry = {
        id: noticeId,
        kind: "driver_assigned",
        title: "Tricycle " + cleanBody + " shift assigned",
        message: detailMsg,
        targetType: "member",
        targetId: cleanDriverId,
        senderId: senderId,
        senderName: senderName,
        createdAt: createdIso,
        readBy: []
    };
    allItems.push(entry);
    saveLocalNotices(allItems);
}

// params: memberId (required), todaName (required), position (required), termStart (required), termEnd (required), caller (optional)
function notifyLocalOfficerAssigned(memberId, todaName, position, termStart, termEnd, caller) {
    const cleanMemId = localCleanText(memberId);
    const cleanToda = localCleanText(todaName);
    const cleanPos = localCleanText(position);
    if (!cleanMemId || !cleanPos) {
        return;
    }

    const allItems = loadLocalNotices();
    const nowMs = Date.now();
    const nextNum = allItems.length + 1;
    const noticeId = TRIDE_NOTICE_PREFIX + String(nowMs) + "-" + String(nextNum);

    let senderId = "SYSTEM";
    let senderName = "TRIDE";
    if (caller && caller.Member_ID) {
        senderId = caller.Member_ID;
        if (caller.First_Name && caller.Last_Name) {
            senderName = caller.First_Name + " " + caller.Last_Name;
        } else {
            senderName = caller.Member_ID;
        }
    }

    let labelToda = cleanToda;
    if (!labelToda) {
        labelToda = "TODA";
    }
    const msg = "Elected/appointed as " + cleanPos + " of " + labelToda + " (" + termStart + " to " + termEnd + ").";
    const nowDate = new Date();
    const createdIso = nowDate.toISOString();

    const entry = {
        id: noticeId,
        kind: "officer_assigned",
        title: "Appointed as " + cleanPos,
        message: msg,
        targetType: "member",
        targetId: cleanMemId,
        senderId: senderId,
        senderName: senderName,
        createdAt: createdIso,
        readBy: []
    };
    allItems.push(entry);
    saveLocalNotices(allItems);
}

/* id generation and lookup helpers */

// params: rows (required), pkCol (required), prefix (required), minDigits (required)
function localGenerateNextId(rows, pkCol, prefix, minDigits) {
    const rowCount = rows.length;
    const prefixLower = prefix.toLowerCase();
    let maxNum = 0;

    for (let i = 0; i < rowCount; i += 1) {
        const rawVal = rows[i][pkCol];
        const idText = String(rawVal || "");
        const idLower = idText.toLowerCase();
        if (idLower.indexOf(prefixLower) !== 0) {
            continue;
        }
        const suffix = idText.slice(prefix.length);
        const parsed = parseInt(suffix, 10);
        const isNum = !isNaN(parsed);
        if (isNum && parsed > maxNum) {
            maxNum = parsed;
        }
    }

    const nextNum = maxNum + 1;
    const padded = localPadDigits(nextNum, minDigits);
    return prefix + padded;
}

// params: dbState (required), fedId (required)
function findLocalFederation(dbState, fedId) {
    const rows = dbState.federations;
    const count = rows.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(rows[i].Federation_ID, fedId)) {
            return rows[i];
        }
    }
    return null;
}

// params: dbState (required), todaId (required)
function findLocalToda(dbState, todaId) {
    const rows = dbState.todas;
    const count = rows.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(rows[i].TODA_ID, todaId)) {
            return rows[i];
        }
    }
    return null;
}

// params: dbState (required), memberId (required)
function findLocalMember(dbState, memberId) {
    const rows = dbState.members;
    const count = rows.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(rows[i].Member_ID, memberId)) {
            return rows[i];
        }
    }
    return null;
}

// params: dbState (required), tricycleId (required)
function findLocalTricycle(dbState, tricycleId) {
    const rows = dbState.tricycles;
    const count = rows.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(rows[i].Tricycle_ID, tricycleId)) {
            return rows[i];
        }
    }
    return null;
}

// params: dbState (required), assignmentId (required)
function findLocalAssignment(dbState, assignmentId) {
    const rows = dbState.driver_assignments;
    const count = rows.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(rows[i].Assignment_ID, assignmentId)) {
            return rows[i];
        }
    }
    return null;
}

// params: dbState (required), termId (required)
function findLocalOfficerTerm(dbState, termId) {
    const rows = dbState.officer_terms;
    const count = rows.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(rows[i].Term_ID, termId)) {
            return rows[i];
        }
    }
    return null;
}

/* constraint validation helpers */

// params: rows (required), colName (required), value (optional), pkCol (required), excludePk (optional), message (required)
function assertLocalUnique(rows, colName, value, pkCol, excludePk, message) {
    if (value === null || value === undefined || value === "") {
        return;
    }
    const count = rows.length;
    for (let i = 0; i < count; i += 1) {
        const row = rows[i];
        if (excludePk && localSameKey(row[pkCol], excludePk)) {
            continue;
        }
        if (localSameKey(row[colName], value)) {
            throw new Error(message);
        }
    }
}

/* federation table mutations */

// params: dbState (required), record (required)
function dbInsertFederation(dbState, record) {
    const fedId = localCleanText(record.Federation_ID);
    const fedName = localCleanText(record.Federation_Name);
    const accrNum = localCleanText(record.Accreditation_Number);
    const accrExp = localCleanText(record.Accreditation_Expiry);
    const officeAddr = localCleanText(record.Office_Address);
    const secId = localCleanOptional(record.Secretary_Member_ID);

    if (!fedId || !fedName || !accrNum || !accrExp || !officeAddr) {
        throw new Error("Federation_ID, Federation_Name, Accreditation_Number, Accreditation_Expiry, and Office_Address are required.");
    }
    if (fedId.length > LOCAL_ID_MAX_LENGTH) {
        throw new Error("Federation_ID must be at most 10 characters.");
    }
    if (accrNum.length > LOCAL_ACCREDITATION_MAX_LENGTH) {
        throw new Error("Accreditation_Number must be at most 30 characters.");
    }
    if (!localIsValidDate(accrExp)) {
        throw new Error("Accreditation_Expiry must use YYYY-MM-DD format.");
    }

    assertLocalUnique(dbState.federations, "Federation_ID", fedId, "Federation_ID", null, "That Federation ID is already taken.");
    assertLocalUnique(dbState.federations, "Federation_Name", fedName, "Federation_ID", null, "That federation name is already registered.");
    assertLocalUnique(dbState.federations, "Accreditation_Number", accrNum, "Federation_ID", null, "That federation accreditation number is already registered.");

    let canonicalSecId = null;
    if (secId) {
        const secMember = findLocalMember(dbState, secId);
        if (!secMember) {
            throw new Error("Selected Secretary_Member_ID does not exist.");
        }
        canonicalSecId = secMember.Member_ID;
        assertLocalUnique(dbState.federations, "Secretary_Member_ID", canonicalSecId, "Federation_ID", null, "That member is already appointed as secretary of another federation.");
    }

    const row = {
        Federation_ID: fedId,
        Federation_Name: fedName,
        Accreditation_Number: accrNum,
        Accreditation_Expiry: accrExp,
        Office_Address: officeAddr,
        Secretary_Member_ID: canonicalSecId
    };
    dbState.federations.push(row);
    return row;
}

// params: dbState (required), fedId (required), patch (required)
function dbUpdateFederation(dbState, fedId, patch) {
    const existing = findLocalFederation(dbState, fedId);
    if (!existing) {
        throw new Error("Federation not found.");
    }

    let nextName = existing.Federation_Name;
    if (patch.Federation_Name !== undefined) {
        nextName = localCleanText(patch.Federation_Name);
    }
    let nextAccrNum = existing.Accreditation_Number;
    if (patch.Accreditation_Number !== undefined) {
        nextAccrNum = localCleanText(patch.Accreditation_Number);
    }
    let nextAccrExp = existing.Accreditation_Expiry;
    if (patch.Accreditation_Expiry !== undefined) {
        nextAccrExp = localCleanText(patch.Accreditation_Expiry);
    }
    let nextAddr = existing.Office_Address;
    if (patch.Office_Address !== undefined) {
        nextAddr = localCleanText(patch.Office_Address);
    }
    let nextSecId = existing.Secretary_Member_ID;
    if (patch.Secretary_Member_ID !== undefined) {
        nextSecId = localCleanOptional(patch.Secretary_Member_ID);
    }

    if (!nextName || !nextAccrNum || !nextAccrExp || !nextAddr) {
        throw new Error("Federation_Name, Accreditation_Number, Accreditation_Expiry, and Office_Address cannot be empty.");
    }
    if (nextAccrNum.length > LOCAL_ACCREDITATION_MAX_LENGTH) {
        throw new Error("Accreditation_Number must be at most 30 characters.");
    }
    if (!localIsValidDate(nextAccrExp)) {
        throw new Error("Accreditation_Expiry must use YYYY-MM-DD format.");
    }

    assertLocalUnique(dbState.federations, "Federation_Name", nextName, "Federation_ID", existing.Federation_ID, "That federation name is already registered.");
    assertLocalUnique(dbState.federations, "Accreditation_Number", nextAccrNum, "Federation_ID", existing.Federation_ID, "That federation accreditation number is already registered.");

    let canonicalSecId = null;
    if (nextSecId) {
        const secMember = findLocalMember(dbState, nextSecId);
        if (!secMember) {
            throw new Error("Selected Secretary_Member_ID does not exist.");
        }
        canonicalSecId = secMember.Member_ID;
        assertLocalUnique(dbState.federations, "Secretary_Member_ID", canonicalSecId, "Federation_ID", existing.Federation_ID, "That member is already appointed as secretary of another federation.");
    }

    existing.Federation_Name = nextName;
    existing.Accreditation_Number = nextAccrNum;
    existing.Accreditation_Expiry = nextAccrExp;
    existing.Office_Address = nextAddr;
    existing.Secretary_Member_ID = canonicalSecId;
    return existing;
}

// params: dbState (required), fedId (required)
function dbDeleteFederation(dbState, fedId) {
    let idx = -1;
    const count = dbState.federations.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(dbState.federations[i].Federation_ID, fedId)) {
            idx = i;
            break;
        }
    }
    if (idx === -1) {
        throw new Error("Federation not found.");
    }
    const canonicalId = dbState.federations[idx].Federation_ID;

    // based on final_dbms1_tride_ddl_dml.sql, fk_toda_federation, clear federation link on affiliated toda when deleting federation
    const todaCount = dbState.todas.length;
    for (let i = 0; i < todaCount; i += 1) {
        if (localSameKey(dbState.todas[i].Federation_ID, canonicalId)) {
            dbState.todas[i].Federation_ID = null;
        }
    }
    dbState.federations.splice(idx, 1);
}

/* toda_association table mutations */

// params: dbState (required), record (required)
function dbInsertToda(dbState, record) {
    const todaId = localCleanText(record.TODA_ID);
    const todaName = localCleanText(record.TODA_Name);
    const route = localCleanText(record.Route);
    const secReg = localCleanText(record.SEC_Reg_Number);
    const terminal = localCleanText(record.Terminal_Location);
    const accrExp = localCleanText(record.Accreditation_Expiry);
    let status = localCleanText(record.Association_Status);
    if (!status) {
        status = LOCAL_DEFAULT_TODA_STATUS;
    }
    const fedId = localCleanOptional(record.Federation_ID);

    if (!todaId || !todaName || !route || !secReg || !terminal || !accrExp) {
        throw new Error("TODA_ID, TODA_Name, Route, SEC_Reg_Number, Terminal_Location, and Accreditation_Expiry are required.");
    }
    if (todaId.length > LOCAL_ID_MAX_LENGTH) {
        throw new Error("TODA_ID must be at most 10 characters.");
    }
    if (secReg.length > LOCAL_SEC_REG_MAX_LENGTH) {
        throw new Error("SEC_Reg_Number must be at most 30 characters.");
    }
    if (!localIsValidDate(accrExp)) {
        throw new Error("Accreditation_Expiry must use YYYY-MM-DD format.");
    }
    const validStatus = localIsInList(status, LOCAL_TODA_STATUS_VALUES);
    if (!validStatus) {
        throw new Error("Association_Status must be Active, Expired, or Suspended.");
    }

    assertLocalUnique(dbState.todas, "TODA_ID", todaId, "TODA_ID", null, "That TODA ID is already taken.");
    assertLocalUnique(dbState.todas, "TODA_Name", todaName, "TODA_ID", null, "That TODA name is already registered.");
    assertLocalUnique(dbState.todas, "SEC_Reg_Number", secReg, "TODA_ID", null, "That SEC registration number is already registered.");

    let canonicalFedId = null;
    if (fedId) {
        const fed = findLocalFederation(dbState, fedId);
        if (!fed) {
            throw new Error("Referenced Federation, TODA, Member, or Tricycle does not exist.");
        }
        canonicalFedId = fed.Federation_ID;
    }

    const row = {
        TODA_ID: todaId,
        TODA_Name: todaName,
        Route: route,
        SEC_Reg_Number: secReg,
        Terminal_Location: terminal,
        Accreditation_Expiry: accrExp,
        Association_Status: status,
        Federation_ID: canonicalFedId
    };
    dbState.todas.push(row);
    return row;
}

// params: dbState (required), todaId (required), patch (required)
function dbUpdateToda(dbState, todaId, patch) {
    const existing = findLocalToda(dbState, todaId);
    if (!existing) {
        throw new Error("TODA association not found.");
    }

    let nextName = existing.TODA_Name;
    if (patch.TODA_Name !== undefined) {
        nextName = localCleanText(patch.TODA_Name);
    }
    let nextRoute = existing.Route;
    if (patch.Route !== undefined) {
        nextRoute = localCleanText(patch.Route);
    }
    let nextSecReg = existing.SEC_Reg_Number;
    if (patch.SEC_Reg_Number !== undefined) {
        nextSecReg = localCleanText(patch.SEC_Reg_Number);
    }
    let nextTerminal = existing.Terminal_Location;
    if (patch.Terminal_Location !== undefined) {
        nextTerminal = localCleanText(patch.Terminal_Location);
    }
    let nextAccrExp = existing.Accreditation_Expiry;
    if (patch.Accreditation_Expiry !== undefined) {
        nextAccrExp = localCleanText(patch.Accreditation_Expiry);
    }
    let nextStatus = existing.Association_Status;
    if (patch.Association_Status !== undefined) {
        const rawStatus = localCleanText(patch.Association_Status);
        if (rawStatus) {
            nextStatus = rawStatus;
        }
    }
    let nextFedId = existing.Federation_ID;
    if (patch.Federation_ID !== undefined) {
        nextFedId = localCleanOptional(patch.Federation_ID);
    }

    if (!nextName || !nextRoute || !nextSecReg || !nextTerminal || !nextAccrExp) {
        throw new Error("TODA_Name, Route, SEC_Reg_Number, Terminal_Location, and Accreditation_Expiry cannot be empty.");
    }
    if (nextSecReg.length > LOCAL_SEC_REG_MAX_LENGTH) {
        throw new Error("SEC_Reg_Number must be at most 30 characters.");
    }
    if (!localIsValidDate(nextAccrExp)) {
        throw new Error("Accreditation_Expiry must use YYYY-MM-DD format.");
    }
    const validStatus = localIsInList(nextStatus, LOCAL_TODA_STATUS_VALUES);
    if (!validStatus) {
        throw new Error("Association_Status must be Active, Expired, or Suspended.");
    }

    assertLocalUnique(dbState.todas, "TODA_Name", nextName, "TODA_ID", existing.TODA_ID, "That TODA name is already registered.");
    assertLocalUnique(dbState.todas, "SEC_Reg_Number", nextSecReg, "TODA_ID", existing.TODA_ID, "That SEC registration number is already registered.");

    let canonicalFedId = null;
    if (nextFedId) {
        const fed = findLocalFederation(dbState, nextFedId);
        if (!fed) {
            throw new Error("Referenced Federation, TODA, Member, or Tricycle does not exist.");
        }
        canonicalFedId = fed.Federation_ID;
    }

    existing.TODA_Name = nextName;
    existing.Route = nextRoute;
    existing.SEC_Reg_Number = nextSecReg;
    existing.Terminal_Location = nextTerminal;
    existing.Accreditation_Expiry = nextAccrExp;
    existing.Association_Status = nextStatus;
    existing.Federation_ID = canonicalFedId;
    return existing;
}

// params: dbState (required), todaId (required)
function dbDeleteToda(dbState, todaId) {
    let idx = -1;
    const count = dbState.todas.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(dbState.todas[i].TODA_ID, todaId)) {
            idx = i;
            break;
        }
    }
    if (idx === -1) {
        throw new Error("TODA association not found.");
    }
    const canonicalId = dbState.todas[idx].TODA_ID;

    // based on final_dbms1_tride_ddl_dml.sql, fk_member_toda, stop deleting toda while member belong to group
    const memCount = dbState.members.length;
    for (let i = 0; i < memCount; i += 1) {
        if (localSameKey(dbState.members[i].TODA_ID, canonicalId)) {
            throw new Error("Cannot delete TODA: registered members still belong to this association.");
        }
    }

    // based on final_dbms1_tride_ddl_dml.sql, fk_officer_toda, clear remaining officer term entries on toda delete
    const remainingTerms = [];
    const termCount = dbState.officer_terms.length;
    for (let i = 0; i < termCount; i += 1) {
        const term = dbState.officer_terms[i];
        if (!localSameKey(term.TODA_ID, canonicalId)) {
            remainingTerms.push(term);
        }
    }
    dbState.officer_terms = remainingTerms;
    dbState.todas.splice(idx, 1);
}

/* member table mutations */

// params: dbState (required), record (required)
function dbInsertMember(dbState, record) {
    const memberId = localCleanText(record.Member_ID);
    const firstName = localCleanText(record.First_Name);
    const lastName = localCleanText(record.Last_Name);
    const street = localCleanText(record.Street);
    const barangay = localCleanText(record.Barangay);
    let city = localCleanText(record.City_Municipality);
    if (!city) {
        city = LOCAL_DEFAULT_CITY;
    }
    const contact = localCleanText(record.Contact_Number);
    const licenseNum = localCleanOptional(record.License_Number);
    const licenseExp = localCleanOptional(record.License_Expiry_Date);
    const licenseType = localCleanOptional(record.License_Type);
    const restrictionCode = localCleanOptional(record.Restriction_Code);
    const psoId = localCleanOptional(record.PSO_ID_Number);
    const blsId = localCleanOptional(record.BLS_Cert_ID);
    const todaId = localCleanText(record.TODA_ID);

    if (!memberId || !firstName || !lastName || !street || !barangay || !contact || !todaId) {
        throw new Error("Member_ID, First_Name, Last_Name, Street, Barangay, Contact_Number, and TODA_ID are required.");
    }
    if (memberId.length > LOCAL_ID_MAX_LENGTH) {
        throw new Error("Member_ID must be at most 10 characters.");
    }
    if (contact.length > LOCAL_CONTACT_MAX_LENGTH) {
        throw new Error("Contact_Number must be at most 15 characters.");
    }
    if (licenseNum && licenseNum.length > LOCAL_LICENSE_MAX_LENGTH) {
        throw new Error("License_Number must be at most 25 characters.");
    }
    if (licenseExp && !localIsValidDate(licenseExp)) {
        throw new Error("License_Expiry_Date must use YYYY-MM-DD format.");
    }
    if (licenseType) {
        const validType = localIsInList(licenseType, LOCAL_LICENSE_TYPE_VALUES);
        if (!validType) {
            throw new Error("License_Type must be Professional or Non-Professional.");
        }
    }
    if (psoId && psoId.length > LOCAL_PSO_BLS_MAX_LENGTH) {
        throw new Error("PSO_ID_Number must be at most 25 characters.");
    }
    if (blsId && blsId.length > LOCAL_PSO_BLS_MAX_LENGTH) {
        throw new Error("BLS_Cert_ID must be at most 25 characters.");
    }

    const toda = findLocalToda(dbState, todaId);
    if (!toda) {
        throw new Error("Referenced Federation, TODA, Member, or Tricycle does not exist.");
    }

    assertLocalUnique(dbState.members, "Member_ID", memberId, "Member_ID", null, "That Member ID is already taken.");
    assertLocalUnique(dbState.members, "Contact_Number", contact, "Member_ID", null, "That contact number is already registered to another member.");
    assertLocalUnique(dbState.members, "License_Number", licenseNum, "Member_ID", null, "That driver license number is already registered to another member.");
    assertLocalUnique(dbState.members, "PSO_ID_Number", psoId, "Member_ID", null, "That PSO ID number is already registered to another member.");
    assertLocalUnique(dbState.members, "BLS_Cert_ID", blsId, "Member_ID", null, "That BLS certificate ID is already registered to another member.");

    const row = {
        Member_ID: memberId,
        First_Name: firstName,
        Last_Name: lastName,
        Street: street,
        Barangay: barangay,
        City_Municipality: city,
        Contact_Number: contact,
        License_Number: licenseNum,
        License_Expiry_Date: licenseExp,
        License_Type: licenseType,
        Restriction_Code: restrictionCode,
        PSO_ID_Number: psoId,
        BLS_Cert_ID: blsId,
        TODA_ID: toda.TODA_ID
    };
    dbState.members.push(row);
    return row;
}

// params: dbState (required), memberId (required), patch (required)
function dbUpdateMember(dbState, memberId, patch) {
    const existing = findLocalMember(dbState, memberId);
    if (!existing) {
        throw new Error("Member not found.");
    }

    let nextFirst = existing.First_Name;
    if (patch.First_Name !== undefined) {
        nextFirst = localCleanText(patch.First_Name);
    }
    let nextLast = existing.Last_Name;
    if (patch.Last_Name !== undefined) {
        nextLast = localCleanText(patch.Last_Name);
    }
    let nextStreet = existing.Street;
    if (patch.Street !== undefined) {
        nextStreet = localCleanText(patch.Street);
    }
    let nextBarangay = existing.Barangay;
    if (patch.Barangay !== undefined) {
        nextBarangay = localCleanText(patch.Barangay);
    }
    let nextCity = existing.City_Municipality;
    if (patch.City_Municipality !== undefined) {
        const cleanedCity = localCleanText(patch.City_Municipality);
        if (cleanedCity) {
            nextCity = cleanedCity;
        } else {
            nextCity = LOCAL_DEFAULT_CITY;
        }
    }
    let nextContact = existing.Contact_Number;
    if (patch.Contact_Number !== undefined) {
        nextContact = localCleanText(patch.Contact_Number);
    }
    let nextLicNum = existing.License_Number;
    if (patch.License_Number !== undefined) {
        nextLicNum = localCleanOptional(patch.License_Number);
    }
    let nextLicExp = existing.License_Expiry_Date;
    if (patch.License_Expiry_Date !== undefined) {
        nextLicExp = localCleanOptional(patch.License_Expiry_Date);
    }
    let nextLicType = existing.License_Type;
    if (patch.License_Type !== undefined) {
        nextLicType = localCleanOptional(patch.License_Type);
    }
    let nextRest = existing.Restriction_Code;
    if (patch.Restriction_Code !== undefined) {
        nextRest = localCleanOptional(patch.Restriction_Code);
    }
    let nextPso = existing.PSO_ID_Number;
    if (patch.PSO_ID_Number !== undefined) {
        nextPso = localCleanOptional(patch.PSO_ID_Number);
    }
    let nextBls = existing.BLS_Cert_ID;
    if (patch.BLS_Cert_ID !== undefined) {
        nextBls = localCleanOptional(patch.BLS_Cert_ID);
    }

    if (!nextFirst || !nextLast || !nextStreet || !nextBarangay || !nextContact) {
        throw new Error("First_Name, Last_Name, Street, Barangay, and Contact_Number are required.");
    }
    if (nextContact.length > LOCAL_CONTACT_MAX_LENGTH) {
        throw new Error("Contact_Number must be at most 15 characters.");
    }
    if (nextLicNum && nextLicNum.length > LOCAL_LICENSE_MAX_LENGTH) {
        throw new Error("License_Number must be at most 25 characters.");
    }
    if (nextLicExp && !localIsValidDate(nextLicExp)) {
        throw new Error("License_Expiry_Date must use YYYY-MM-DD format.");
    }
    if (nextLicType) {
        const validType = localIsInList(nextLicType, LOCAL_LICENSE_TYPE_VALUES);
        if (!validType) {
            throw new Error("License_Type must be Professional or Non-Professional.");
        }
    }
    if (nextPso && nextPso.length > LOCAL_PSO_BLS_MAX_LENGTH) {
        throw new Error("PSO_ID_Number must be at most 25 characters.");
    }
    if (nextBls && nextBls.length > LOCAL_PSO_BLS_MAX_LENGTH) {
        throw new Error("BLS_Cert_ID must be at most 25 characters.");
    }

    // based on final_dbms1_relational-model.md, DRIVER_ASSIGNMENT, stop member from clearing license number while shift assignment exist
    if (!nextLicNum) {
        const asnCount = dbState.driver_assignments.length;
        for (let i = 0; i < asnCount; i += 1) {
            if (localSameKey(dbState.driver_assignments[i].Member_ID, existing.Member_ID)) {
                throw new Error("Remove this member's driver shift assignments before clearing License_Number.");
            }
        }
    }

    assertLocalUnique(dbState.members, "Contact_Number", nextContact, "Member_ID", existing.Member_ID, "That contact number is already registered to another member.");
    assertLocalUnique(dbState.members, "License_Number", nextLicNum, "Member_ID", existing.Member_ID, "That driver license number is already registered to another member.");
    assertLocalUnique(dbState.members, "PSO_ID_Number", nextPso, "Member_ID", existing.Member_ID, "That PSO ID number is already registered to another member.");
    assertLocalUnique(dbState.members, "BLS_Cert_ID", nextBls, "Member_ID", existing.Member_ID, "That BLS certificate ID is already registered to another member.");

    existing.First_Name = nextFirst;
    existing.Last_Name = nextLast;
    existing.Street = nextStreet;
    existing.Barangay = nextBarangay;
    existing.City_Municipality = nextCity;
    existing.Contact_Number = nextContact;
    existing.License_Number = nextLicNum;
    existing.License_Expiry_Date = nextLicExp;
    existing.License_Type = nextLicType;
    existing.Restriction_Code = nextRest;
    existing.PSO_ID_Number = nextPso;
    existing.BLS_Cert_ID = nextBls;
    return existing;
}

// params: dbState (required), memberId (required), nextTodaId (required)
function dbTransferMemberToda(dbState, memberId, nextTodaId) {
    const cleanToda = localCleanText(nextTodaId);
    if (!cleanToda) {
        throw new Error("TODA_ID is required because every member must belong to a TODA association.");
    }
    const existing = findLocalMember(dbState, memberId);
    if (!existing) {
        throw new Error("Member not found.");
    }
    const targetToda = findLocalToda(dbState, cleanToda);
    if (!targetToda) {
        throw new Error("Referenced Federation, TODA, Member, or Tricycle does not exist.");
    }

    if (!localSameKey(existing.TODA_ID, targetToda.TODA_ID)) {
        // based on final_dbms1_active-baseline-and-naga-city-rules.md, OFFICER_TERM, stop toda transfer while member hold officer term in old group
        const termCount = dbState.officer_terms.length;
        for (let i = 0; i < termCount; i += 1) {
            const term = dbState.officer_terms[i];
            const sameMember = localSameKey(term.Member_ID, existing.Member_ID);
            const sameOldToda = localSameKey(term.TODA_ID, existing.TODA_ID);
            if (sameMember && sameOldToda) {
                throw new Error("Remove or end this member's TODA officer term records before transferring to another TODA.");
            }
        }
    }

    existing.TODA_ID = targetToda.TODA_ID;
    return existing;
}

// params: dbState (required), memberId (required)
function dbDeleteMember(dbState, memberId) {
    let idx = -1;
    const count = dbState.members.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(dbState.members[i].Member_ID, memberId)) {
            idx = i;
            break;
        }
    }
    if (idx === -1) {
        throw new Error("Member not found.");
    }
    const canonicalId = dbState.members[idx].Member_ID;

    // based on final_dbms1_relational-model.md, RA 10173, block member delete when operator still own franchised tricycle unit
    const triCount = dbState.tricycles.length;
    for (let i = 0; i < triCount; i += 1) {
        if (localSameKey(dbState.tricycles[i].Owner_Member_ID, canonicalId)) {
            throw new Error("Cannot delete member: this operator still owns franchised tricycle units. Transfer or delete those units first.");
        }
    }

    // based on final_dbms1_tride_ddl_dml.sql, fk_assignment_member, erase shift assignment entries when deleting member
    const keptAssignments = [];
    const asnCount = dbState.driver_assignments.length;
    for (let i = 0; i < asnCount; i += 1) {
        const asn = dbState.driver_assignments[i];
        if (!localSameKey(asn.Member_ID, canonicalId)) {
            keptAssignments.push(asn);
        }
    }
    dbState.driver_assignments = keptAssignments;

    // based on final_dbms1_tride_ddl_dml.sql, fk_officer_member, erase officer term entries when deleting member
    const keptTerms = [];
    const termCount = dbState.officer_terms.length;
    for (let i = 0; i < termCount; i += 1) {
        const term = dbState.officer_terms[i];
        if (!localSameKey(term.Member_ID, canonicalId)) {
            keptTerms.push(term);
        }
    }
    dbState.officer_terms = keptTerms;

    // based on final_dbms1_tride_ddl_dml.sql, fk_federation_secretary, clear secretary link on federation when deleting member
    const fedCount = dbState.federations.length;
    for (let i = 0; i < fedCount; i += 1) {
        if (localSameKey(dbState.federations[i].Secretary_Member_ID, canonicalId)) {
            dbState.federations[i].Secretary_Member_ID = null;
        }
    }

    dbState.members.splice(idx, 1);
}

/* tricycle table mutations */

// params: dbState (required), ownerMemberId (required), excludeTricycleId (optional)
function countLocalOwnerTricycles(dbState, ownerMemberId, excludeTricycleId) {
    let owned = 0;
    const triCount = dbState.tricycles.length;
    for (let i = 0; i < triCount; i += 1) {
        const unit = dbState.tricycles[i];
        if (excludeTricycleId && localSameKey(unit.Tricycle_ID, excludeTricycleId)) {
            continue;
        }
        if (localSameKey(unit.Owner_Member_ID, ownerMemberId)) {
            owned += 1;
        }
    }
    return owned;
}

// params: dbState (required), record (required)
function dbInsertTricycle(dbState, record) {
    const tricycleId = localCleanText(record.Tricycle_ID);
    const bodyNumber = localCleanText(record.Body_Number);
    const franchise = localCleanText(record.Franchise_Number);
    const chassis = localCleanText(record.Chassis_Number);
    const plate = localCleanText(record.Plate_Number);
    const franchiseExp = localCleanText(record.Franchise_Expiry_Date);
    const mayorsExp = localCleanText(record.Mayors_Permit_Expiry);
    let franchiseStatus = localCleanText(record.Franchise_Status);
    if (!franchiseStatus) {
        franchiseStatus = LOCAL_DEFAULT_FRANCHISE_STATUS;
    }
    const orCrExp = localCleanText(record.OR_CR_Expiry);
    const colorZone = localCleanOptional(record.Color_Zone);
    const ownerId = localCleanText(record.Owner_Member_ID);

    if (!tricycleId || !bodyNumber || !franchise || !chassis || !plate || !franchiseExp || !mayorsExp || !orCrExp || !ownerId) {
        throw new Error("Body_Number, Franchise_Number, Chassis_Number, Plate_Number, Franchise_Expiry_Date, Mayors_Permit_Expiry, OR_CR_Expiry, and Owner_Member_ID are required.");
    }
    if (tricycleId.length > LOCAL_ID_MAX_LENGTH) {
        throw new Error("Tricycle_ID must be at most 10 characters.");
    }
    if (bodyNumber.length > LOCAL_BODY_NUMBER_MAX_LENGTH) {
        throw new Error("Body_Number must be at most 15 characters (e.g. 0224 or 013-STF).");
    }
    if (plate.length > LOCAL_PLATE_MAX_LENGTH) {
        throw new Error("Plate_Number must be at most 15 characters.");
    }
    if (franchise.length > LOCAL_FRANCHISE_MAX_LENGTH) {
        throw new Error("Franchise_Number must be at most 25 characters.");
    }
    if (chassis.length > LOCAL_CHASSIS_MAX_LENGTH) {
        throw new Error("Chassis_Number must be at most 30 characters.");
    }
    if (!localIsValidDate(franchiseExp) || !localIsValidDate(mayorsExp) || !localIsValidDate(orCrExp)) {
        throw new Error("Franchise_Expiry_Date, Mayors_Permit_Expiry, and OR_CR_Expiry must use YYYY-MM-DD format.");
    }
    const validStatus = localIsInList(franchiseStatus, LOCAL_FRANCHISE_STATUS_VALUES);
    if (!validStatus) {
        throw new Error("Franchise_Status must be Active, Expired, or Revoked.");
    }
    if (colorZone) {
        const validZone = localIsInList(colorZone, LOCAL_COLOR_ZONE_VALUES);
        if (!validZone) {
            throw new Error("Invalid Color_Zone selection.");
        }
    }

    const owner = findLocalMember(dbState, ownerId);
    if (!owner) {
        throw new Error("Selected Owner_Member_ID does not exist.");
    }

    // based on final_dbms1_tride_ddl_dml.sql, trg_tricycle_owner_cap_ins, stop operator from owning more than five tricycle unit
    const ownedCount = countLocalOwnerTricycles(dbState, owner.Member_ID, null);
    if (ownedCount >= LOCAL_MAX_OWNED_TRICYCLES) {
        throw new Error("Ownership cap exceeded: an operator can own at most 5 tricycles.");
    }

    assertLocalUnique(dbState.tricycles, "Tricycle_ID", tricycleId, "Tricycle_ID", null, "That Tricycle ID is already taken.");
    assertLocalUnique(dbState.tricycles, "Body_Number", bodyNumber, "Tricycle_ID", null, "That body number is already registered.");
    assertLocalUnique(dbState.tricycles, "Franchise_Number", franchise, "Tricycle_ID", null, "That franchise number is already registered.");
    assertLocalUnique(dbState.tricycles, "Chassis_Number", chassis, "Tricycle_ID", null, "That chassis number is already registered.");
    assertLocalUnique(dbState.tricycles, "Plate_Number", plate, "Tricycle_ID", null, "That plate number is already registered.");

    const row = {
        Tricycle_ID: tricycleId,
        Body_Number: bodyNumber,
        Franchise_Number: franchise,
        Chassis_Number: chassis,
        Plate_Number: plate,
        Franchise_Expiry_Date: franchiseExp,
        Mayors_Permit_Expiry: mayorsExp,
        Franchise_Status: franchiseStatus,
        OR_CR_Expiry: orCrExp,
        Color_Zone: colorZone,
        Owner_Member_ID: owner.Member_ID
    };
    dbState.tricycles.push(row);
    return row;
}

// params: dbState (required), tricycleId (required), patch (required)
function dbUpdateTricycle(dbState, tricycleId, patch) {
    const existing = findLocalTricycle(dbState, tricycleId);
    if (!existing) {
        throw new Error("Tricycle unit not found.");
    }

    let nextBody = existing.Body_Number;
    if (patch.Body_Number !== undefined) {
        nextBody = localCleanText(patch.Body_Number);
    }
    let nextFranchise = existing.Franchise_Number;
    if (patch.Franchise_Number !== undefined) {
        nextFranchise = localCleanText(patch.Franchise_Number);
    }
    let nextChassis = existing.Chassis_Number;
    if (patch.Chassis_Number !== undefined) {
        nextChassis = localCleanText(patch.Chassis_Number);
    }
    let nextPlate = existing.Plate_Number;
    if (patch.Plate_Number !== undefined) {
        nextPlate = localCleanText(patch.Plate_Number);
    }
    let nextFranchiseExp = existing.Franchise_Expiry_Date;
    if (patch.Franchise_Expiry_Date !== undefined) {
        nextFranchiseExp = localCleanText(patch.Franchise_Expiry_Date);
    }
    let nextMayorsExp = existing.Mayors_Permit_Expiry;
    if (patch.Mayors_Permit_Expiry !== undefined) {
        nextMayorsExp = localCleanText(patch.Mayors_Permit_Expiry);
    }
    let nextStatus = existing.Franchise_Status;
    if (patch.Franchise_Status !== undefined) {
        const cleanedStatus = localCleanText(patch.Franchise_Status);
        if (cleanedStatus) {
            nextStatus = cleanedStatus;
        }
    }
    let nextOrCrExp = existing.OR_CR_Expiry;
    if (patch.OR_CR_Expiry !== undefined) {
        nextOrCrExp = localCleanText(patch.OR_CR_Expiry);
    }
    let nextColorZone = existing.Color_Zone;
    if (patch.Color_Zone !== undefined) {
        nextColorZone = localCleanOptional(patch.Color_Zone);
    }
    let nextOwnerId = existing.Owner_Member_ID;
    if (patch.Owner_Member_ID !== undefined) {
        nextOwnerId = localCleanText(patch.Owner_Member_ID);
    }

    if (!nextBody || !nextFranchise || !nextChassis || !nextPlate || !nextFranchiseExp || !nextMayorsExp || !nextOrCrExp || !nextOwnerId) {
        throw new Error("Body_Number, Franchise_Number, Chassis_Number, Plate_Number, expiry dates, and Owner_Member_ID cannot be empty.");
    }
    if (nextBody.length > LOCAL_BODY_NUMBER_MAX_LENGTH) {
        throw new Error("Body_Number must be at most 15 characters.");
    }
    if (nextPlate.length > LOCAL_PLATE_MAX_LENGTH) {
        throw new Error("Plate_Number must be at most 15 characters.");
    }
    if (nextFranchise.length > LOCAL_FRANCHISE_MAX_LENGTH) {
        throw new Error("Franchise_Number must be at most 25 characters.");
    }
    if (nextChassis.length > LOCAL_CHASSIS_MAX_LENGTH) {
        throw new Error("Chassis_Number must be at most 30 characters.");
    }
    if (!localIsValidDate(nextFranchiseExp) || !localIsValidDate(nextMayorsExp) || !localIsValidDate(nextOrCrExp)) {
        throw new Error("Expiry dates must use YYYY-MM-DD format.");
    }
    const validStatus = localIsInList(nextStatus, LOCAL_FRANCHISE_STATUS_VALUES);
    if (!validStatus) {
        throw new Error("Franchise_Status must be Active, Expired, or Revoked.");
    }
    if (nextColorZone) {
        const validZone = localIsInList(nextColorZone, LOCAL_COLOR_ZONE_VALUES);
        if (!validZone) {
            throw new Error("Invalid Color_Zone selection.");
        }
    }

    const owner = findLocalMember(dbState, nextOwnerId);
    if (!owner) {
        throw new Error("New Owner_Member_ID does not exist.");
    }

    // based on final_dbms1_tride_ddl_dml.sql, trg_tricycle_owner_cap_upd, check five unit limit on ownership transfer
    const nextOwnerCount = countLocalOwnerTricycles(dbState, owner.Member_ID, existing.Tricycle_ID);
    if (nextOwnerCount >= LOCAL_MAX_OWNED_TRICYCLES) {
        throw new Error("Ownership cap exceeded: an operator can own at most 5 tricycles.");
    }

    assertLocalUnique(dbState.tricycles, "Body_Number", nextBody, "Tricycle_ID", existing.Tricycle_ID, "That body number is already registered.");
    assertLocalUnique(dbState.tricycles, "Franchise_Number", nextFranchise, "Tricycle_ID", existing.Tricycle_ID, "That franchise number is already registered.");
    assertLocalUnique(dbState.tricycles, "Chassis_Number", nextChassis, "Tricycle_ID", existing.Tricycle_ID, "That chassis number is already registered.");
    assertLocalUnique(dbState.tricycles, "Plate_Number", nextPlate, "Tricycle_ID", existing.Tricycle_ID, "That plate number is already registered.");

    existing.Body_Number = nextBody;
    existing.Franchise_Number = nextFranchise;
    existing.Chassis_Number = nextChassis;
    existing.Plate_Number = nextPlate;
    existing.Franchise_Expiry_Date = nextFranchiseExp;
    existing.Mayors_Permit_Expiry = nextMayorsExp;
    existing.Franchise_Status = nextStatus;
    existing.OR_CR_Expiry = nextOrCrExp;
    existing.Color_Zone = nextColorZone;
    existing.Owner_Member_ID = owner.Member_ID;
    return existing;
}

// params: dbState (required), tricycleId (required)
function dbDeleteTricycle(dbState, tricycleId) {
    let idx = -1;
    const count = dbState.tricycles.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(dbState.tricycles[i].Tricycle_ID, tricycleId)) {
            idx = i;
            break;
        }
    }
    if (idx === -1) {
        throw new Error("Tricycle unit not found.");
    }
    const canonicalId = dbState.tricycles[idx].Tricycle_ID;

    // based on final_dbms1_tride_ddl_dml.sql, fk_assignment_tricycle, erase shift assignment entries when deleting tricycle unit
    const keptAssignments = [];
    const asnCount = dbState.driver_assignments.length;
    for (let i = 0; i < asnCount; i += 1) {
        const asn = dbState.driver_assignments[i];
        if (!localSameKey(asn.Tricycle_ID, canonicalId)) {
            keptAssignments.push(asn);
        }
    }
    dbState.driver_assignments = keptAssignments;
    dbState.tricycles.splice(idx, 1);
}

/* driver_assignment table mutations */

// params: dbState (required), record (required)
function dbInsertAssignment(dbState, record) {
    const assignmentId = localCleanText(record.Assignment_ID);
    const memberId = localCleanText(record.Member_ID);
    const tricycleId = localCleanText(record.Tricycle_ID);
    const driverRole = localCleanText(record.Driver_Role);
    const shiftSchedule = localCleanText(record.Shift_Schedule);
    let dateAssigned = localCleanText(record.Date_Assigned);
    if (!dateAssigned) {
        dateAssigned = localGetTodayDateText();
    }
    let status = localCleanText(record.Status);
    if (!status) {
        status = LOCAL_DEFAULT_ASSIGNMENT_STATUS;
    }

    if (!assignmentId || !memberId || !tricycleId || !driverRole || !shiftSchedule) {
        throw new Error("Member_ID, Tricycle_ID, Driver_Role, and Shift_Schedule are required.");
    }
    if (assignmentId.length > LOCAL_ID_MAX_LENGTH) {
        throw new Error("Assignment_ID must be at most 10 characters.");
    }
    const validRole = localIsInList(driverRole, LOCAL_DRIVER_ROLE_VALUES);
    if (!validRole) {
        throw new Error("Driver_Role must be Primary or Alternate.");
    }
    const validStatus = localIsInList(status, LOCAL_ASSIGNMENT_STATUS_VALUES);
    if (!validStatus) {
        throw new Error("Status must be Active or Inactive.");
    }
    if (shiftSchedule.length > LOCAL_SHIFT_MAX_LENGTH) {
        throw new Error("Shift_Schedule must be at most 50 characters.");
    }
    if (!localIsValidDate(dateAssigned)) {
        throw new Error("Date_Assigned must use YYYY-MM-DD format.");
    }

    const unit = findLocalTricycle(dbState, tricycleId);
    if (!unit) {
        throw new Error("Tricycle unit not found.");
    }
    const member = findLocalMember(dbState, memberId);
    if (!member) {
        throw new Error("Driver member not found.");
    }

    // based on final_dbms1_tride_ddl_dml.sql, trg_driver_assignment_license_ins, block shift assignment when driver lack license number
    const memberLic = localCleanOptional(member.License_Number);
    if (!memberLic) {
        throw new Error("Unlicensed member: driver assignment requires a non-null License_Number.");
    }

    assertLocalUnique(dbState.driver_assignments, "Assignment_ID", assignmentId, "Assignment_ID", null, "That Assignment ID is already taken.");

    if (status === "Active") {
        const asnCount = dbState.driver_assignments.length;
        for (let i = 0; i < asnCount; i += 1) {
            const cur = dbState.driver_assignments[i];
            if (cur.Status !== "Active") {
                continue;
            }
            if (!localSameKey(cur.Tricycle_ID, unit.Tricycle_ID)) {
                continue;
            }
            if (localSameKey(cur.Member_ID, member.Member_ID)) {
                throw new Error("This driver already has an active shift on this tricycle unit.");
            }
            if (driverRole === "Primary" && cur.Driver_Role === "Primary") {
                throw new Error("This tricycle already has an active Primary driver. Assign additional drivers as Alternate (relyebo) or mark the existing Primary shift Inactive first.");
            }
        }
    }

    const row = {
        Assignment_ID: assignmentId,
        Member_ID: member.Member_ID,
        Tricycle_ID: unit.Tricycle_ID,
        Driver_Role: driverRole,
        Shift_Schedule: shiftSchedule,
        Date_Assigned: dateAssigned,
        Status: status
    };
    dbState.driver_assignments.push(row);
    return row;
}

// params: dbState (required), assignmentId (required), patch (required)
function dbUpdateAssignment(dbState, assignmentId, patch) {
    const existing = findLocalAssignment(dbState, assignmentId);
    if (!existing) {
        throw new Error("Driver assignment not found.");
    }

    let nextMemberId = existing.Member_ID;
    if (patch.Member_ID !== undefined) {
        nextMemberId = localCleanText(patch.Member_ID);
    }
    let nextTricycleId = existing.Tricycle_ID;
    if (patch.Tricycle_ID !== undefined) {
        nextTricycleId = localCleanText(patch.Tricycle_ID);
    }
    let nextRole = existing.Driver_Role;
    if (patch.Driver_Role !== undefined) {
        nextRole = localCleanText(patch.Driver_Role);
    }
    let nextShift = existing.Shift_Schedule;
    if (patch.Shift_Schedule !== undefined) {
        nextShift = localCleanText(patch.Shift_Schedule);
    }
    let nextDate = existing.Date_Assigned;
    if (patch.Date_Assigned !== undefined) {
        nextDate = localCleanText(patch.Date_Assigned);
    }
    let nextStatus = existing.Status;
    if (patch.Status !== undefined) {
        const cleanedStatus = localCleanText(patch.Status);
        if (cleanedStatus) {
            nextStatus = cleanedStatus;
        }
    }

    if (!nextMemberId || !nextTricycleId || !nextRole || !nextShift || !nextDate) {
        throw new Error("Member_ID, Tricycle_ID, Driver_Role, Shift_Schedule, and Date_Assigned cannot be empty.");
    }
    const validRole = localIsInList(nextRole, LOCAL_DRIVER_ROLE_VALUES);
    if (!validRole) {
        throw new Error("Driver_Role must be Primary or Alternate.");
    }
    const validStatus = localIsInList(nextStatus, LOCAL_ASSIGNMENT_STATUS_VALUES);
    if (!validStatus) {
        throw new Error("Status must be Active or Inactive.");
    }
    if (nextShift.length > LOCAL_SHIFT_MAX_LENGTH) {
        throw new Error("Shift_Schedule must be at most 50 characters.");
    }
    if (!localIsValidDate(nextDate)) {
        throw new Error("Date_Assigned must use YYYY-MM-DD format.");
    }

    const unit = findLocalTricycle(dbState, nextTricycleId);
    if (!unit) {
        throw new Error("Tricycle unit not found.");
    }
    const member = findLocalMember(dbState, nextMemberId);
    if (!member) {
        throw new Error("Driver member not found.");
    }

    // based on final_dbms1_tride_ddl_dml.sql, trg_driver_assignment_license_upd, require valid license number when updating shift assignment
    const memberLic = localCleanOptional(member.License_Number);
    if (!memberLic) {
        throw new Error("Unlicensed member: driver assignment requires a non-null License_Number.");
    }

    if (nextStatus === "Active") {
        const asnCount = dbState.driver_assignments.length;
        for (let i = 0; i < asnCount; i += 1) {
            const cur = dbState.driver_assignments[i];
            if (localSameKey(cur.Assignment_ID, existing.Assignment_ID)) {
                continue;
            }
            if (cur.Status !== "Active") {
                continue;
            }
            if (!localSameKey(cur.Tricycle_ID, unit.Tricycle_ID)) {
                continue;
            }
            if (localSameKey(cur.Member_ID, member.Member_ID)) {
                throw new Error("This driver already has another active shift on this tricycle unit.");
            }
            if (nextRole === "Primary" && cur.Driver_Role === "Primary") {
                throw new Error("This tricycle already has an active Primary driver. Change the existing Primary shift to Alternate or Inactive first.");
            }
        }
    }

    existing.Member_ID = member.Member_ID;
    existing.Tricycle_ID = unit.Tricycle_ID;
    existing.Driver_Role = nextRole;
    existing.Shift_Schedule = nextShift;
    existing.Date_Assigned = nextDate;
    existing.Status = nextStatus;
    return existing;
}

// params: dbState (required), assignmentId (required)
function dbDeleteAssignment(dbState, assignmentId) {
    let idx = -1;
    const count = dbState.driver_assignments.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(dbState.driver_assignments[i].Assignment_ID, assignmentId)) {
            idx = i;
            break;
        }
    }
    if (idx === -1) {
        throw new Error("Driver assignment not found.");
    }
    dbState.driver_assignments.splice(idx, 1);
}

/* officer_term table mutations */

// params: dbState (required), record (required)
function dbInsertOfficerTerm(dbState, record) {
    const termId = localCleanText(record.Term_ID);
    const memberId = localCleanText(record.Member_ID);
    const todaId = localCleanText(record.TODA_ID);
    const position = localCleanText(record.Position);
    const termStart = localCleanText(record.Term_Start);
    const termEnd = localCleanText(record.Term_End);

    if (!termId || !memberId || !todaId || !position || !termStart || !termEnd) {
        throw new Error("Member_ID, TODA_ID, Position, Term_Start, and Term_End are required.");
    }
    if (termId.length > LOCAL_ID_MAX_LENGTH) {
        throw new Error("Term_ID must be at most 10 characters.");
    }
    const validPos = localIsInList(position, LOCAL_OFFICER_POSITION_VALUES);
    if (!validPos) {
        throw new Error("Invalid officer Position selection.");
    }
    if (!localIsValidDate(termStart) || !localIsValidDate(termEnd)) {
        throw new Error("Term_Start and Term_End must use YYYY-MM-DD format.");
    }
    // based on final_dbms1_tride_ddl_dml.sql, chk_officer_term_dates, require end date on or after start date
    if (termEnd < termStart) {
        throw new Error("Term_End must be on or after Term_Start.");
    }

    const member = findLocalMember(dbState, memberId);
    if (!member) {
        throw new Error("Member not found.");
    }
    const toda = findLocalToda(dbState, todaId);
    if (!toda) {
        throw new Error("TODA association not found.");
    }

    // based on final_dbms1_tride_ddl_dml.sql, trg_officer_term_same_toda_ins, require officer member to belong to exact same toda
    if (!localSameKey(member.TODA_ID, toda.TODA_ID)) {
        throw new Error("TODA mismatch: an officer must belong to the same TODA_ASSOCIATION via JOINS.");
    }

    assertLocalUnique(dbState.officer_terms, "Term_ID", termId, "Term_ID", null, "That Term ID is already taken.");

    const today = localGetTodayDateText();
    const termCount = dbState.officer_terms.length;
    for (let i = 0; i < termCount; i += 1) {
        const cur = dbState.officer_terms[i];
        if (!localSameKey(cur.TODA_ID, toda.TODA_ID)) {
            continue;
        }
        const overlaps = cur.Term_Start <= termEnd && cur.Term_End >= termStart;
        if (!overlaps) {
            continue;
        }
        if (position !== "Board of Directors") {
            if (cur.Position === position && cur.Term_End >= today) {
                throw new Error("Another member already holds an overlapping active term for " + position + " in this TODA.");
            }
        } else {
            if (cur.Position === "Board of Directors" && localSameKey(cur.Member_ID, member.Member_ID)) {
                throw new Error("This member already holds an overlapping Board of Directors term in this TODA.");
            }
        }
    }

    const row = {
        Term_ID: termId,
        Member_ID: member.Member_ID,
        TODA_ID: toda.TODA_ID,
        Position: position,
        Term_Start: termStart,
        Term_End: termEnd
    };
    dbState.officer_terms.push(row);
    return row;
}

// params: dbState (required), termId (required), patch (required)
function dbUpdateOfficerTerm(dbState, termId, patch) {
    const existing = findLocalOfficerTerm(dbState, termId);
    if (!existing) {
        throw new Error("Officer term not found.");
    }

    let nextMemberId = existing.Member_ID;
    if (patch.Member_ID !== undefined) {
        nextMemberId = localCleanText(patch.Member_ID);
    }
    let nextTodaId = existing.TODA_ID;
    if (patch.TODA_ID !== undefined) {
        nextTodaId = localCleanText(patch.TODA_ID);
    }
    let nextPos = existing.Position;
    if (patch.Position !== undefined) {
        nextPos = localCleanText(patch.Position);
    }
    let nextStart = existing.Term_Start;
    if (patch.Term_Start !== undefined) {
        nextStart = localCleanText(patch.Term_Start);
    }
    let nextEnd = existing.Term_End;
    if (patch.Term_End !== undefined) {
        nextEnd = localCleanText(patch.Term_End);
    }

    if (!nextMemberId || !nextTodaId || !nextPos || !nextStart || !nextEnd) {
        throw new Error("Member_ID, TODA_ID, Position, Term_Start, and Term_End cannot be empty.");
    }
    const validPos = localIsInList(nextPos, LOCAL_OFFICER_POSITION_VALUES);
    if (!validPos) {
        throw new Error("Invalid officer Position selection.");
    }
    if (!localIsValidDate(nextStart) || !localIsValidDate(nextEnd)) {
        throw new Error("Term_Start and Term_End must use YYYY-MM-DD format.");
    }
    if (nextEnd < nextStart) {
        throw new Error("Term_End must be on or after Term_Start.");
    }

    const member = findLocalMember(dbState, nextMemberId);
    if (!member) {
        throw new Error("Member not found.");
    }
    const toda = findLocalToda(dbState, nextTodaId);
    if (!toda) {
        throw new Error("TODA association not found.");
    }

    // based on final_dbms1_tride_ddl_dml.sql, trg_officer_term_same_toda_upd, enforce same toda membership on officer update
    if (!localSameKey(member.TODA_ID, toda.TODA_ID)) {
        throw new Error("TODA mismatch: an officer must belong to the same TODA_ASSOCIATION via JOINS.");
    }

    const today = localGetTodayDateText();
    const termCount = dbState.officer_terms.length;
    for (let i = 0; i < termCount; i += 1) {
        const cur = dbState.officer_terms[i];
        if (localSameKey(cur.Term_ID, existing.Term_ID)) {
            continue;
        }
        if (!localSameKey(cur.TODA_ID, toda.TODA_ID)) {
            continue;
        }
        const overlaps = cur.Term_Start <= nextEnd && cur.Term_End >= nextStart;
        if (!overlaps) {
            continue;
        }
        if (nextPos !== "Board of Directors") {
            if (cur.Position === nextPos && cur.Term_End >= today) {
                throw new Error("Another member already holds an overlapping active term for " + nextPos + " in this TODA.");
            }
        }
    }

    existing.Member_ID = member.Member_ID;
    existing.TODA_ID = toda.TODA_ID;
    existing.Position = nextPos;
    existing.Term_Start = nextStart;
    existing.Term_End = nextEnd;
    return existing;
}

// params: dbState (required), termId (required)
function dbDeleteOfficerTerm(dbState, termId) {
    let idx = -1;
    const count = dbState.officer_terms.length;
    for (let i = 0; i < count; i += 1) {
        if (localSameKey(dbState.officer_terms[i].Term_ID, termId)) {
            idx = i;
            break;
        }
    }
    if (idx === -1) {
        throw new Error("Officer term not found.");
    }
    dbState.officer_terms.splice(idx, 1);
}
