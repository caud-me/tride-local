/* localStorage backend mimic for tride (1:1 parity with routes.js and notifications.js) */

const TRIDE_DB_KEY = "tride_local_db_v1";
const TRIDE_NTF_KEY = "tride_local_notifications_v1";

function localCleanText(val) {
    if (typeof val !== "string") {
        return "";
    }
    return val.trim();
}

function localCleanOptional(val) {
    const trimmed = localCleanText(val);
    if (trimmed === "") {
        return null;
    }
    return trimmed;
}

function buildSeedDatabase() {
    const firstNames = [
        "Juan", "Jose", "Mark", "Arron", "Bryan", "Carlo", "Daniel", "Eduardo", "Fernando", "Gabriel",
        "Hector", "Ivan", "Jerome", "Kevin", "Leonardo", "Marco", "Nathaniel", "Oscar", "Paulo", "Rafael",
        "Roberto", "Samuel", "Tomas", "Victor", "Wilfredo", "Angel", "Bianca", "Camille", "Clarissa", "Diana",
        "Elena", "Fatima", "Grace", "Hannah", "Irene", "Jessa", "Katrina", "Lorna", "Marisol", "Nadine",
        "Olivia", "Patricia", "Queenie", "Rachel", "Sandra", "Teresita", "Ursula", "Vanessa", "Wendy", "Zenaida",
        "Aldrin", "Bong", "Christian", "Dennis", "Erwin", "Francis", "Gerald", "Harold", "Isidro", "Joel",
        "Kenneth", "Lester", "Manny", "Noel", "Orlando", "Pedro", "Quentin", "Ramon", "Sergio", "Tristan",
        "Ulysses", "Virgilio", "Warren", "Xavier", "Yolanda", "Analyn", "Beverly", "Cathy", "Dahlia", "Estela"
    ];
    const lastNames = [
        "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Tomas", "Andres",
        "Marquez", "Castillo", "Salazar", "Miranda", "Manalo", "Ramos", "Navarro", "Aquino", "Villanueva", "Del Rosario",
        "Soriano", "Pascual", "Alvarez", "Padilla", "Macaraeg", "Quinto", "Santiago", "Hernandez", "Velasco", "Labrador",
        "Magalona", "Caudilla", "Dominguez", "De Leon", "Morales", "Perez", "Gonzales", "Rivera", "Diaz", "Flores",
        "Vargas", "Romero", "Estrada", "Lim", "Tan", "Ong", "Chavez", "Jimenez", "Gutierrez", "Mercado",
        "Espiritu", "Cabrera", "Sison", "Valdez", "Belen", "Dizon", "Agoncillo", "Pineda", "Eusebio", "Abad"
    ];
    const streets = [
        "14 Elias Angeles St", "28 Magsaysay Ave", "92 Roxas Ave", "17 P. Burgos St", "55 J. Miranda Ave",
        "103 Diversion Rd", "12 Pacol Rd", "74 Cararayan Rd", "31 Penafrancia Ave", "66 Jacob St",
        "49 Rizal St", "22 Liboton St", "81 Barlin St", "39 Igualdad St", "118 Zamora St",
        "63 Arana St", "85 Taal Ave", "42 San Francisco St", "19 Mabini St", "77 Dayangdang St"
    ];
    const todaSpecs = [
        { id: "T1", name: "Tinago TODA", route: "Tinago - Centro", brgy: "Brgy. Tinago, Naga City" },
        { id: "T2", name: "Pacol TODA", route: "Pacol - Centro", brgy: "Brgy. Pacol, Naga City" },
        { id: "T3", name: "Cararayan TODA", route: "Cararayan - Centro", brgy: "Brgy. Cararayan, Naga City" },
        { id: "T4", name: "Mabolo TODA", route: "Mabolo - Centro", brgy: "Brgy. Mabolo, Naga City" },
        { id: "T5", name: "San Felipe TODA", route: "San Felipe - Centro", brgy: "Brgy. San Felipe, Naga City" },
        { id: "T6", name: "Carolina TODA", route: "Carolina - Upper", brgy: "Brgy. Carolina, Naga City" }
    ];
    const prefixes = ["0917", "0918", "0919", "0920", "0926", "0927", "0928", "0945", "0956", "0966", "0977", "0995"];
    /* T6 stays empty (0 members) to cover Empty TODAs & deletion test cases */
    const activeTodas = todaSpecs.slice(0, 5);

    const todas = [];
    for (let i = 0; i < todaSpecs.length; i += 1) {
        const spec = todaSpecs[i];
        todas.push({
            TODA_ID: spec.id,
            TODA_Name: spec.name,
            Route: spec.route,
            Federation_ID: "FED-01",
            President_Member_ID: null
        });
    }

    const members = [];
    for (let id = 1; id <= 96; id += 1) {
        let first = "";
        let last = "";
        let addr = "";
        let contact = "";
        let license = null;
        let todaId = null;

        if (id === 1) {
            first = "Arron";
            last = "Caudilla";
            addr = "14 Elias Angeles St, Brgy. Dinaga, Naga City";
            contact = "09267229920";
            license = "E05-24-000101";
            todaId = null;
        } else if (id === 2) {
            first = "Rafael";
            last = "Bautista";
            addr = "22 Liboton St, Brgy. Tinago, Naga City";
            contact = "09278293048";
            license = "E05-22-000202";
            todaId = "T1";
        } else {
            const tObj = activeTodas[(id - 3) % activeTodas.length];
            todaId = tObj.id;
            first = firstNames[(id * 7) % firstNames.length];
            last = lastNames[(id * 11 + Math.floor(id / 13)) % lastNames.length];
            const street = streets[(id * 3) % streets.length];
            addr = street + ", " + tObj.brgy;
            const pref = prefixes[id % prefixes.length];
            const tail = String(1000000 + ((id * 7919) % 8999999)).padStart(7, "0");
            contact = pref + tail;
            /* Member 7 is a pure non-licensed Operator; id >= 80 or % 6 === 0 (above 15) omit license for No-role / non-driver tests */
            const isUnlicensed = id === 7 || (id >= 15 && id % 6 === 0) || id >= 82;
            if (!isUnlicensed) {
                const yr = String(18 + (id % 9)).padStart(2, "0");
                const seq = String(100000 + id * 173).slice(-6);
                license = "E05-" + yr + "-" + seq;
            }
        }
        members.push({
            Member_ID: String(id),
            First_Name: first,
            Last_Name: last,
            Address: addr,
            Contact_Number: contact,
            License_Number: license,
            TODA_ID: todaId
        });
    }

    /* Assign presidents to T1..T4; leave T5 president-less and T6 empty */
    todas[0].President_Member_ID = "2";
    for (let ti = 1; ti < 4; ti += 1) {
        const tid = activeTodas[ti].id;
        for (let mi = 0; mi < members.length; mi += 1) {
            const m = members[mi];
            if (m.TODA_ID === tid && Number(m.Member_ID) >= 3) {
                todas[ti].President_Member_ID = m.Member_ID;
                break;
            }
        }
    }

    const tricycles = [
        /* Member 2: President + Operator + Self-driven unit + extra unit */
        { Body_Number: "0001", Chassis_Number: "MH3NAGA2026100001", Franchise_Number: "NC-FR-2026-0001", Owner_Member_ID: "2", Driver_Member_ID: "2" },
        { Body_Number: "0002", Chassis_Number: "MH3NAGA2026100002", Franchise_Number: "NC-FR-2026-0002", Owner_Member_ID: "2", Driver_Member_ID: "12" },
        /* Member 6: Operator at max 3/3 limit */
        { Body_Number: "0003", Chassis_Number: "MH3NAGA2026100003", Franchise_Number: "NC-FR-2026-0003", Owner_Member_ID: "6", Driver_Member_ID: "13" },
        { Body_Number: "0004", Chassis_Number: "MH3NAGA2026100004", Franchise_Number: "NC-FR-2026-0004", Owner_Member_ID: "6", Driver_Member_ID: "14" },
        { Body_Number: "0005", Chassis_Number: "MH3NAGA2026100005", Franchise_Number: "NC-FR-2026-0005", Owner_Member_ID: "6", Driver_Member_ID: null },
        /* Member 7: Unlicensed pure Operator (2 units) */
        { Body_Number: "0006", Chassis_Number: "MH3NAGA2026100006", Franchise_Number: "NC-FR-2026-0006", Owner_Member_ID: "7", Driver_Member_ID: "16" },
        { Body_Number: "0007", Chassis_Number: "MH3NAGA2026100007", Franchise_Number: "NC-FR-2026-0007", Owner_Member_ID: "7", Driver_Member_ID: null }
    ];

    const poolOwners = ["3", "4", "5", "8", "9", "10", "11", "17", "19", "20", "21", "22", "23", "25"];
    const poolDrivers = ["3", "4", "5", "8", "9", "10", "11", "17", "19", "20", "21", "22", "23", "25", "26", "27", "28", "29", "31", "32", "33", "34", "35"];
    let dIdx = 0;
    for (let u = 8; u <= 36; u += 1) {
        const body = String(u).padStart(4, "0");
        const chassis = "MH3NAGA2026" + String(100000 + u);
        const franchise = "NC-FR-2026-" + body;
        const ownerId = poolOwners[(u - 8) % poolOwners.length];
        const driverId = u <= 30 && dIdx < poolDrivers.length ? poolDrivers[dIdx] : null;
        if (driverId) {
            dIdx += 1;
        }
        tricycles.push({
            Body_Number: body,
            Chassis_Number: chassis,
            Franchise_Number: franchise,
            Owner_Member_ID: ownerId,
            Driver_Member_ID: driverId
        });
    }

    return {
        federations: [
            {
                Federation_ID: "FED-01",
                Federation_Name: "Naga City Tricycle Federation",
                Secretary_Member_ID: "1"
            }
        ],
        todas: todas,
        members: members,
        tricycles: tricycles
    };
}

function loadLocalDb() {
    const raw = localStorage.getItem(TRIDE_DB_KEY);
    if (raw === null) {
        const emptyDb = { federations: [], todas: [], members: [], tricycles: [] };
        saveLocalDb(emptyDb);
        return emptyDb;
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.members)) {
            const fallback = { federations: [], todas: [], members: [], tricycles: [] };
            saveLocalDb(fallback);
            return fallback;
        }
        return parsed;
    } catch (err) {
        const emptyDb = { federations: [], todas: [], members: [], tricycles: [] };
        saveLocalDb(emptyDb);
        return emptyDb;
    }
}

function saveLocalDb(dbState) {
    localStorage.setItem(TRIDE_DB_KEY, JSON.stringify(dbState));
}

function loadLocalNotices() {
    const raw = localStorage.getItem(TRIDE_NTF_KEY);
    if (!raw) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        return [];
    }
}

function saveLocalNotices(items) {
    localStorage.setItem(TRIDE_NTF_KEY, JSON.stringify(items));
}

function pushDriverNotice(driverId, bodyNumber, caller) {
    const cleanDriver = localCleanText(driverId);
    const cleanBody = localCleanText(bodyNumber);
    if (!cleanDriver || !cleanBody) {
        return;
    }
    const items = loadLocalNotices();
    const senderName = caller && caller.Member_ID ? "Operator " + caller.Member_ID : "TRIDE";
    items.push({
        id: "NTF-" + String(Date.now()) + "-" + String(items.length + 1),
        title: "Tricycle " + cleanBody + " assigned",
        message: "You have been assigned to drive tricycle " + cleanBody + ".",
        targetType: "member",
        targetId: cleanDriver,
        senderId: caller && caller.Member_ID ? caller.Member_ID : "SYSTEM",
        senderName: senderName,
        createdAt: new Date().toISOString(),
        readBy: []
    });
    saveLocalNotices(items);
}

function findMemberById(dbState, memberId) {
    for (let i = 0; i < dbState.members.length; i += 1) {
        if (dbState.members[i].Member_ID === memberId) {
            return dbState.members[i];
        }
    }
    return null;
}

function findTodaById(dbState, todaId) {
    for (let i = 0; i < dbState.todas.length; i += 1) {
        if (dbState.todas[i].TODA_ID === todaId) {
            return dbState.todas[i];
        }
    }
    return null;
}

function findTricycleByBody(dbState, bodyNumber) {
    for (let i = 0; i < dbState.tricycles.length; i += 1) {
        if (dbState.tricycles[i].Body_Number === bodyNumber) {
            return dbState.tricycles[i];
        }
    }
    return null;
}

function computeLocalRoles(dbState, member) {
    const roles = [];
    const memberId = member.Member_ID;
    let isDriver = Boolean(member.License_Number && member.License_Number.trim() !== "");
    let ownsUnit = false;

    for (let i = 0; i < dbState.tricycles.length; i += 1) {
        const u = dbState.tricycles[i];
        if (u.Driver_Member_ID === memberId) {
            isDriver = true;
        }
        if (u.Owner_Member_ID === memberId) {
            ownsUnit = true;
        }
    }

    if (isDriver) {
        roles.push({ key: "driver", label: "Driver" });
    }
    if (ownsUnit) {
        roles.push({ key: "operator", label: "Operator" });
    }

    for (let i = 0; i < dbState.todas.length; i += 1) {
        if (dbState.todas[i].President_Member_ID === memberId) {
            roles.push({ key: "president", label: "TODA President" });
            break;
        }
    }

    for (let i = 0; i < dbState.federations.length; i += 1) {
        if (dbState.federations[i].Secretary_Member_ID === memberId) {
            roles.push({ key: "secretary", label: "Federation Secretary" });
            break;
        }
    }

    return roles;
}

function resolveLocalCaller(dbState) {
    const callerId = localCleanText(sessionStorage.getItem("tride_member_id"));
    if (!callerId) {
        throw new Error("Sign in is required.");
    }
    const callerRow = findMemberById(dbState, callerId);
    if (!callerRow) {
        throw new Error("Active member session not found.");
    }

    let isSecretary = false;
    for (let i = 0; i < dbState.federations.length; i += 1) {
        if (dbState.federations[i].Secretary_Member_ID === callerId) {
            isSecretary = true;
            break;
        }
    }

    let ledTodaId = null;
    for (let i = 0; i < dbState.todas.length; i += 1) {
        if (dbState.todas[i].President_Member_ID === callerId) {
            ledTodaId = dbState.todas[i].TODA_ID;
            break;
        }
    }

    return {
        Member_ID: callerRow.Member_ID,
        First_Name: callerRow.First_Name,
        Last_Name: callerRow.Last_Name,
        TODA_ID: callerRow.TODA_ID,
        isSecretary: isSecretary,
        ledTodaId: ledTodaId
    };
}

function enrichMemberRow(dbState, m) {
    const toda = m.TODA_ID ? findTodaById(dbState, m.TODA_ID) : null;
    let drivenBody = null;
    for (let i = 0; i < dbState.tricycles.length; i += 1) {
        if (dbState.tricycles[i].Driver_Member_ID === m.Member_ID) {
            drivenBody = dbState.tricycles[i].Body_Number;
            break;
        }
    }
    return {
        Member_ID: m.Member_ID,
        First_Name: m.First_Name,
        Last_Name: m.Last_Name,
        Address: m.Address,
        Contact_Number: m.Contact_Number,
        License_Number: m.License_Number,
        TODA_ID: m.TODA_ID,
        TODA_Name: toda ? toda.TODA_Name : null,
        President_Member_ID: toda ? toda.President_Member_ID : null,
        Driven_Body_Number: drivenBody
    };
}

function enrichUnitRow(dbState, u) {
    const owner = findMemberById(dbState, u.Owner_Member_ID);
    const driver = u.Driver_Member_ID ? findMemberById(dbState, u.Driver_Member_ID) : null;
    return {
        Body_Number: u.Body_Number,
        Chassis_Number: u.Chassis_Number,
        Franchise_Number: u.Franchise_Number,
        Owner_Member_ID: u.Owner_Member_ID,
        Driver_Member_ID: u.Driver_Member_ID,
        Owner_First_Name: owner ? owner.First_Name : "",
        Owner_Last_Name: owner ? owner.Last_Name : "",
        Owner_TODA_ID: owner ? owner.TODA_ID : null,
        Driver_First_Name: driver ? driver.First_Name : null,
        Driver_Last_Name: driver ? driver.Last_Name : null
    };
}

function isNoticeVisible(item, caller) {
    if (item.targetType === "all") {
        return true;
    }
    if (item.targetType === "officers") {
        return Boolean(caller.isSecretary || caller.ledTodaId);
    }
    if (item.targetType === "toda") {
        const inToda = Boolean(caller.TODA_ID && item.targetId === caller.TODA_ID);
        const leadsToda = Boolean(caller.ledTodaId && item.targetId === caller.ledTodaId);
        return inToda || leadsToda;
    }
    if (item.targetType === "member") {
        return item.targetId === caller.Member_ID;
    }
    return false;
}

function routeLocalRequest(method, pathWithQuery, body) {
    const qMark = pathWithQuery.indexOf("?");
    const pathname = qMark !== -1 ? pathWithQuery.slice(0, qMark) : pathWithQuery;
    const queryStr = qMark !== -1 ? pathWithQuery.slice(qMark + 1) : "";
    const query = new URLSearchParams(queryStr);
    const payload = body || {};
    const dbState = loadLocalDb();

    if (method === "GET" && pathname === "/status") {
        const needsOobe = dbState.federations.length === 0 && dbState.members.length === 0;
        return {
            ok: true,
            oobeRequired: needsOobe,
            federationCount: dbState.federations.length,
            memberCount: dbState.members.length
        };
    }

    if (method === "POST" && pathname === "/seed") {
        const seeded = buildSeedDatabase();
        saveLocalDb(seeded);
        saveLocalNotices([]);
        return { ok: true, memberCount: seeded.members.length };
    }

    if (method === "POST" && pathname === "/oobe") {
        const fedId = localCleanText(payload.Federation_ID);
        const fedName = localCleanText(payload.Federation_Name);
        const secId = localCleanText(payload.Member_ID);
        const first = localCleanText(payload.First_Name);
        const last = localCleanText(payload.Last_Name);
        const addr = localCleanText(payload.Address);
        const contact = localCleanText(payload.Contact_Number);
        const license = localCleanOptional(payload.License_Number);

        if (!fedId || !fedName || !secId || !first || !last || !addr || !contact) {
            throw new Error("All required OOBE fields must be filled.");
        }
        if (dbState.federations.length > 0 || dbState.members.length > 0) {
            throw new Error("OOBE is already completed.");
        }

        dbState.federations.push({
            Federation_ID: fedId,
            Federation_Name: fedName,
            Secretary_Member_ID: secId
        });
        dbState.members.push({
            Member_ID: secId,
            First_Name: first,
            Last_Name: last,
            Address: addr,
            Contact_Number: contact,
            License_Number: license,
            TODA_ID: null
        });
        saveLocalDb(dbState);
        return { ok: true, Federation_ID: fedId, Secretary_Member_ID: secId };
    }

    if (method === "POST" && pathname === "/login") {
        const memberId = localCleanText(payload.Member_ID);
        if (!memberId) {
            throw new Error("Member_ID is required.");
        }
        const raw = findMemberById(dbState, memberId);
        if (!raw) {
            throw new Error("Member ID not found.");
        }
        const member = enrichMemberRow(dbState, raw);
        const roles = computeLocalRoles(dbState, raw);
        return { ok: true, member: member, roles: roles };
    }

    const caller = resolveLocalCaller(dbState);

    if (method === "POST" && pathname === "/reset") {
        if (!caller.isSecretary) {
            throw new Error("Only the Federation Secretary can do this action.");
        }
        saveLocalDb({ federations: [], todas: [], members: [], tricycles: [] });
        saveLocalNotices([]);
        return { ok: true };
    }

    if (method === "GET" && pathname.indexOf("/home/") === 0) {
        const targetId = decodeURIComponent(pathname.slice(6));
        const isSelf = caller.Member_ID === targetId;
        const isSec = caller.isSecretary;
        const isPres = Boolean(caller.ledTodaId);
        if (!isSelf && !isSec && !isPres) {
            throw new Error("You can only open your own home dashboard.");
        }
        const raw = findMemberById(dbState, targetId);
        if (!raw) {
            throw new Error("Member not found.");
        }
        const isSameTodaPres = isPres && raw.TODA_ID === caller.ledTodaId;
        if (!isSelf && !isSec && !isSameTodaPres) {
            throw new Error("You can only open members in your own TODA group.");
        }

        const member = enrichMemberRow(dbState, raw);
        const roles = computeLocalRoles(dbState, raw);

        let drivenUnit = null;
        const ownedUnits = [];
        for (let i = 0; i < dbState.tricycles.length; i += 1) {
            const u = dbState.tricycles[i];
            if (u.Driver_Member_ID === targetId) {
                drivenUnit = enrichUnitRow(dbState, u);
            }
            if (u.Owner_Member_ID === targetId) {
                ownedUnits.push(enrichUnitRow(dbState, u));
            }
        }
        ownedUnits.sort(function (a, b) {
            return a.Body_Number.localeCompare(b.Body_Number);
        });

        let ledToda = null;
        for (let i = 0; i < dbState.todas.length; i += 1) {
            if (dbState.todas[i].President_Member_ID === targetId) {
                ledToda = dbState.todas[i];
                break;
            }
        }

        let presidentStats = null;
        if (ledToda) {
            let memCount = 0;
            let licCount = 0;
            let unitCount = 0;
            for (let i = 0; i < dbState.members.length; i += 1) {
                const m = dbState.members[i];
                if (m.TODA_ID === ledToda.TODA_ID) {
                    memCount += 1;
                    if (m.License_Number && m.License_Number.trim() !== "") {
                        licCount += 1;
                    }
                }
            }
            for (let i = 0; i < dbState.tricycles.length; i += 1) {
                const owner = findMemberById(dbState, dbState.tricycles[i].Owner_Member_ID);
                if (owner && owner.TODA_ID === ledToda.TODA_ID) {
                    unitCount += 1;
                }
            }
            presidentStats = { memberCount: memCount, licensedCount: licCount, unitCount: unitCount };
        }

        let targetIsSec = false;
        for (let i = 0; i < dbState.federations.length; i += 1) {
            if (dbState.federations[i].Secretary_Member_ID === targetId) {
                targetIsSec = true;
                break;
            }
        }

        let secretaryStats = null;
        if (targetIsSec) {
            let presCount = 0;
            for (let i = 0; i < dbState.todas.length; i += 1) {
                if (dbState.todas[i].President_Member_ID) {
                    presCount += 1;
                }
            }
            let drvCount = 0;
            for (let i = 0; i < dbState.members.length; i += 1) {
                const lic = dbState.members[i].License_Number;
                if (lic && lic.trim() !== "") {
                    drvCount += 1;
                }
            }
            secretaryStats = {
                todaCount: dbState.todas.length,
                presidentCount: presCount,
                driverCount: drvCount,
                unitCount: dbState.tricycles.length
            };
        }

        return {
            ok: true,
            member: member,
            roles: roles,
            drivenUnit: drivenUnit,
            ownedUnits: ownedUnits,
            ledToda: ledToda,
            presidentStats: presidentStats,
            isSecretary: targetIsSec,
            secretaryStats: secretaryStats
        };
    }

    if (method === "GET" && pathname === "/todas") {
        const list = [];
        for (let i = 0; i < dbState.todas.length; i += 1) {
            const t = dbState.todas[i];
            const pres = t.President_Member_ID ? findMemberById(dbState, t.President_Member_ID) : null;
            let count = 0;
            for (let j = 0; j < dbState.members.length; j += 1) {
                if (dbState.members[j].TODA_ID === t.TODA_ID) {
                    count += 1;
                }
            }
            list.push({
                TODA_ID: t.TODA_ID,
                TODA_Name: t.TODA_Name,
                Route: t.Route,
                Federation_ID: t.Federation_ID,
                President_Member_ID: t.President_Member_ID,
                Pres_First_Name: pres ? pres.First_Name : null,
                Pres_Last_Name: pres ? pres.Last_Name : null,
                Member_Count: count
            });
        }
        list.sort(function (a, b) {
            return a.TODA_ID.localeCompare(b.TODA_ID);
        });
        return { ok: true, todas: list };
    }

    if (method === "POST" && pathname === "/todas") {
        if (!caller.isSecretary) {
            throw new Error("Only the Federation Secretary can do this action.");
        }
        const todaId = localCleanText(payload.TODA_ID);
        const todaName = localCleanText(payload.TODA_Name);
        const route = localCleanText(payload.Route);
        if (!todaId || !todaName || !route) {
            throw new Error("TODA_ID, TODA_Name, and Route are required.");
        }
        if (dbState.federations.length === 0) {
            throw new Error("No Federation exists yet.");
        }
        if (findTodaById(dbState, todaId)) {
            throw new Error("That TODA ID is already taken.");
        }
        dbState.todas.push({
            TODA_ID: todaId,
            TODA_Name: todaName,
            Route: route,
            Federation_ID: dbState.federations[0].Federation_ID,
            President_Member_ID: null
        });
        saveLocalDb(dbState);
        return { ok: true, TODA_ID: todaId };
    }

    if (method === "PUT" && pathname.indexOf("/todas/") === 0 && pathname.endsWith("/president")) {
        if (!caller.isSecretary) {
            throw new Error("Only the Federation Secretary can do this action.");
        }
        const rawSeg = pathname.slice(7, pathname.length - 10);
        const todaId = decodeURIComponent(rawSeg);
        const presId = localCleanOptional(payload.President_Member_ID);
        const toda = findTodaById(dbState, todaId);
        if (!toda) {
            throw new Error("TODA not found.");
        }
        if (presId) {
            const member = findMemberById(dbState, presId);
            if (!member || member.TODA_ID !== todaId) {
                throw new Error("TODA president must belong to the same TODA_ASSOCIATION.");
            }
            for (let i = 0; i < dbState.todas.length; i += 1) {
                if (dbState.todas[i].President_Member_ID === presId && dbState.todas[i].TODA_ID !== todaId) {
                    throw new Error("This member already leads another TODA.");
                }
            }
        }
        toda.President_Member_ID = presId;
        saveLocalDb(dbState);
        return { ok: true };
    }

    if (method === "DELETE" && pathname.indexOf("/todas/") === 0) {
        if (!caller.isSecretary) {
            throw new Error("Only the Federation Secretary can do this action.");
        }
        const todaId = decodeURIComponent(pathname.slice(7));
        const idx = dbState.todas.findIndex(function (t) {
            return t.TODA_ID === todaId;
        });
        if (idx === -1) {
            throw new Error("TODA not found.");
        }
        for (let i = 0; i < dbState.members.length; i += 1) {
            if (dbState.members[i].TODA_ID === todaId) {
                throw new Error("Cannot delete: member or record still has active links.");
            }
        }
        dbState.todas.splice(idx, 1);
        saveLocalDb(dbState);
        return { ok: true };
    }

    if (method === "GET" && pathname === "/drivers") {
        const list = [];
        for (let i = 0; i < dbState.members.length; i += 1) {
            const m = dbState.members[i];
            if (m.License_Number && m.License_Number.trim() !== "") {
                list.push(enrichMemberRow(dbState, m));
            }
        }
        list.sort(function (a, b) {
            const fn = a.First_Name.localeCompare(b.First_Name);
            return fn !== 0 ? fn : a.Last_Name.localeCompare(b.Last_Name);
        });
        return { ok: true, members: list };
    }

    if (method === "GET" && pathname === "/members") {
        const todaId = localCleanText(query.get("todaId"));
        const q = localCleanText(query.get("q")).toLowerCase();
        const sort = localCleanText(query.get("sort"));
        const licensedOnly = query.get("licensedOnly") === "1";
        const role = localCleanText(query.get("role")).toLowerCase();

        let scopedTodaId = todaId;
        if (!caller.isSecretary) {
            if (!caller.ledTodaId) {
                throw new Error("Only a TODA President or Federation Secretary can view the member list.");
            }
            if (todaId && todaId !== "all" && todaId !== caller.ledTodaId) {
                throw new Error("You can only view members in your own TODA group.");
            }
            scopedTodaId = caller.ledTodaId;
        }

        const list = [];
        for (let i = 0; i < dbState.members.length; i += 1) {
            const m = dbState.members[i];
            if (scopedTodaId && scopedTodaId !== "all" && m.TODA_ID !== scopedTodaId) {
                continue;
            }
            const hasLic = Boolean(m.License_Number && m.License_Number.trim() !== "");
            if (licensedOnly && !hasLic) {
                continue;
            }
            if (role) {
                const roles = computeLocalRoles(dbState, m);
                if (role === "none") {
                    if (roles.length > 0) {
                        continue;
                    }
                } else {
                    const matched = roles.some(function (r) {
                        return r.key === role;
                    });
                    if (!matched) {
                        continue;
                    }
                }
            }
            if (q) {
                const hay = (m.Member_ID + " " + m.First_Name + " " + m.Last_Name).toLowerCase();
                if (hay.indexOf(q) === -1) {
                    continue;
                }
            }
            list.push(enrichMemberRow(dbState, m));
        }

        list.sort(function (a, b) {
            if (sort === "id") {
                return a.Member_ID.localeCompare(b.Member_ID);
            }
            const fn = a.First_Name.localeCompare(b.First_Name);
            return fn !== 0 ? fn : a.Last_Name.localeCompare(b.Last_Name);
        });
        return { ok: true, members: list };
    }

    if (method === "GET" && pathname.indexOf("/members/") === 0) {
        const memberId = decodeURIComponent(pathname.slice(9));
        const raw = findMemberById(dbState, memberId);
        if (!raw) {
            throw new Error("Member not found.");
        }
        const isSelf = caller.Member_ID === memberId;
        const isSamePres = Boolean(caller.ledTodaId && raw.TODA_ID === caller.ledTodaId);
        if (!isSelf && !caller.isSecretary && !isSamePres) {
            throw new Error("You do not have permission to view this member.");
        }
        return { ok: true, member: enrichMemberRow(dbState, raw) };
    }

    if (method === "POST" && pathname === "/members") {
        if (!caller.isSecretary && !caller.ledTodaId) {
            throw new Error("Only a TODA President or Federation Secretary can do this action.");
        }
        const memberId = localCleanText(payload.Member_ID);
        const first = localCleanText(payload.First_Name);
        const last = localCleanText(payload.Last_Name);
        const addr = localCleanText(payload.Address);
        const contact = localCleanText(payload.Contact_Number);
        const license = localCleanOptional(payload.License_Number);
        const todaId = localCleanText(payload.TODA_ID);

        if (!memberId || !first || !last || !addr || !contact || !todaId) {
            throw new Error("Member_ID, First_Name, Last_Name, Address, Contact_Number, and TODA_ID are required.");
        }
        if (!caller.isSecretary && (!caller.ledTodaId || todaId !== caller.ledTodaId)) {
            throw new Error("You can only add members to your own TODA group.");
        }
        if (!findTodaById(dbState, todaId)) {
            throw new Error("Referenced TODA or Member does not exist.");
        }
        if (findMemberById(dbState, memberId)) {
            throw new Error("That ID number is already taken.");
        }
        if (license) {
            for (let i = 0; i < dbState.members.length; i += 1) {
                if (dbState.members[i].License_Number === license) {
                    throw new Error("That driver's license is already registered to another member.");
                }
            }
        }

        dbState.members.push({
            Member_ID: memberId,
            First_Name: first,
            Last_Name: last,
            Address: addr,
            Contact_Number: contact,
            License_Number: license,
            TODA_ID: todaId
        });
        saveLocalDb(dbState);
        return { ok: true, Member_ID: memberId };
    }

    if (method === "PUT" && pathname.indexOf("/members/") === 0 && pathname.endsWith("/toda")) {
        if (!caller.isSecretary) {
            throw new Error("Only the Federation Secretary can do this action.");
        }
        const memberId = decodeURIComponent(pathname.slice(9, pathname.length - 5));
        const todaId = localCleanOptional(payload.TODA_ID);
        const member = findMemberById(dbState, memberId);
        if (!member) {
            throw new Error("Member not found.");
        }
        if (todaId && !findTodaById(dbState, todaId)) {
            throw new Error("Referenced TODA or Member does not exist.");
        }
        if (!todaId) {
            const isSec = dbState.federations.some(function (f) {
                return f.Secretary_Member_ID === memberId;
            });
            if (!isSec) {
                throw new Error("Only the Federation Secretary can leave all TODA groups.");
            }
        }
        for (let i = 0; i < dbState.todas.length; i += 1) {
            if (dbState.todas[i].President_Member_ID === memberId && todaId !== dbState.todas[i].TODA_ID) {
                throw new Error(todaId
                    ? "Unassign member as TODA president before changing TODA_ID."
                    : "Remove your TODA president role before leaving the group.");
            }
        }
        member.TODA_ID = todaId;
        saveLocalDb(dbState);
        return { ok: true };
    }

    if (method === "PUT" && pathname.indexOf("/members/") === 0) {
        const memberId = decodeURIComponent(pathname.slice(9));
        const addr = localCleanText(payload.Address);
        const contact = localCleanText(payload.Contact_Number);
        const license = localCleanOptional(payload.License_Number);
        if (!addr || !contact) {
            throw new Error("Address and Contact_Number are required.");
        }
        const member = findMemberById(dbState, memberId);
        if (!member) {
            throw new Error("Member not found.");
        }
        const isSelf = caller.Member_ID === memberId;
        const isSamePres = Boolean(caller.ledTodaId && member.TODA_ID === caller.ledTodaId);
        if (!isSelf && !caller.isSecretary && !isSamePres) {
            throw new Error("You do not have permission to update this member.");
        }
        if (license) {
            for (let i = 0; i < dbState.members.length; i += 1) {
                if (dbState.members[i].License_Number === license && dbState.members[i].Member_ID !== memberId) {
                    throw new Error("That driver's license is already registered to another member.");
                }
            }
        }
        if (!license) {
            for (let i = 0; i < dbState.tricycles.length; i += 1) {
                if (dbState.tricycles[i].Driver_Member_ID === memberId) {
                    throw new Error("Unassign member as driver before removing License_Number.");
                }
            }
        }
        member.Address = addr;
        member.Contact_Number = contact;
        member.License_Number = license;
        saveLocalDb(dbState);
        return { ok: true };
    }

    if (method === "DELETE" && pathname.indexOf("/members/") === 0) {
        if (!caller.isSecretary && !caller.ledTodaId) {
            throw new Error("Only a TODA President or Federation Secretary can do this action.");
        }
        const memberId = decodeURIComponent(pathname.slice(9));
        if (caller.Member_ID === memberId) {
            throw new Error("You cannot delete your own active account.");
        }
        const idx = dbState.members.findIndex(function (m) {
            return m.Member_ID === memberId;
        });
        if (idx === -1) {
            throw new Error("Member not found.");
        }
        const target = dbState.members[idx];
        if (!caller.isSecretary && (!caller.ledTodaId || target.TODA_ID !== caller.ledTodaId)) {
            throw new Error("You can only delete members in your own TODA group.");
        }
        const linkedFed = dbState.federations.some(function (f) {
            return f.Secretary_Member_ID === memberId;
        });
        const linkedToda = dbState.todas.some(function (t) {
            return t.President_Member_ID === memberId;
        });
        const linkedUnit = dbState.tricycles.some(function (u) {
            return u.Owner_Member_ID === memberId || u.Driver_Member_ID === memberId;
        });
        if (linkedFed || linkedToda || linkedUnit) {
            throw new Error("Cannot delete: member or record still has active links.");
        }
        dbState.members.splice(idx, 1);
        saveLocalDb(dbState);
        return { ok: true };
    }

    if (method === "GET" && pathname === "/tricycles") {
        const todaId = localCleanText(query.get("todaId"));
        const ownerId = localCleanText(query.get("ownerId"));
        let scopedTodaId = todaId;
        let restrictToCaller = false;

        if (!caller.isSecretary) {
            if (caller.ledTodaId) {
                if (todaId && todaId !== "all" && todaId !== caller.ledTodaId) {
                    throw new Error("You can only view tricycles in your own TODA group.");
                }
                scopedTodaId = caller.ledTodaId;
            } else {
                if (ownerId && ownerId !== caller.Member_ID) {
                    throw new Error("You can only view your own tricycles.");
                }
                restrictToCaller = true;
            }
        }

        const list = [];
        for (let i = 0; i < dbState.tricycles.length; i += 1) {
            const u = dbState.tricycles[i];
            const row = enrichUnitRow(dbState, u);
            if (scopedTodaId && scopedTodaId !== "all" && row.Owner_TODA_ID !== scopedTodaId) {
                continue;
            }
            if (ownerId && u.Owner_Member_ID !== ownerId) {
                continue;
            }
            if (restrictToCaller && u.Owner_Member_ID !== caller.Member_ID && u.Driver_Member_ID !== caller.Member_ID) {
                continue;
            }
            list.push(row);
        }
        list.sort(function (a, b) {
            return a.Body_Number.localeCompare(b.Body_Number);
        });
        return { ok: true, tricycles: list };
    }

    if (method === "GET" && pathname.indexOf("/tricycles/") === 0) {
        const bodyNum = decodeURIComponent(pathname.slice(11));
        const unit = findTricycleByBody(dbState, bodyNum);
        if (!unit) {
            throw new Error("Tricycle not found.");
        }
        const row = enrichUnitRow(dbState, unit);
        const isOwner = unit.Owner_Member_ID === caller.Member_ID;
        const isDriver = unit.Driver_Member_ID === caller.Member_ID;
        const isSamePres = Boolean(caller.ledTodaId && row.Owner_TODA_ID === caller.ledTodaId);
        if (!caller.isSecretary && !isOwner && !isDriver && !isSamePres) {
            throw new Error("You do not have permission to view this tricycle.");
        }
        return { ok: true, tricycle: row };
    }

    if (method === "POST" && pathname === "/tricycles") {
        const bodyNum = localCleanText(payload.Body_Number);
        const chassis = localCleanText(payload.Chassis_Number);
        const franchise = localCleanText(payload.Franchise_Number);
        const ownerId = localCleanText(payload.Owner_Member_ID);
        const driverId = localCleanOptional(payload.Driver_Member_ID);

        if (!bodyNum || !chassis || !franchise || !ownerId) {
            throw new Error("Body_Number, Chassis_Number, Franchise_Number, and Owner_Member_ID are required.");
        }
        if (bodyNum.length > 4) {
            throw new Error("Body number must be at most 4 characters (e.g. 0226).");
        }
        const owner = findMemberById(dbState, ownerId);
        if (!owner) {
            throw new Error("Referenced TODA or Member does not exist.");
        }
        if (!caller.isSecretary && ownerId !== caller.Member_ID) {
            if (!caller.ledTodaId) {
                throw new Error("You can only register a tricycle under your own Member ID.");
            }
            if (owner.TODA_ID !== caller.ledTodaId) {
                throw new Error("You can only register tricycles for members in your own TODA group.");
            }
        }
        if (findTricycleByBody(dbState, bodyNum)) {
            throw new Error("That body number is already registered.");
        }

        let ownedCount = 0;
        for (let i = 0; i < dbState.tricycles.length; i += 1) {
            const u = dbState.tricycles[i];
            if (u.Chassis_Number === chassis) {
                throw new Error("That chassis number is already registered.");
            }
            if (u.Franchise_Number === franchise) {
                throw new Error("That franchise number is already registered.");
            }
            if (driverId && u.Driver_Member_ID === driverId) {
                throw new Error("This driver is already assigned to another tricycle.");
            }
            if (u.Owner_Member_ID === ownerId) {
                ownedCount += 1;
            }
        }
        if (ownedCount >= 3) {
            throw new Error("Operator already owns the maximum of 3 tricycles.");
        }
        if (driverId) {
            const driver = findMemberById(dbState, driverId);
            if (!driver || !driver.License_Number || driver.License_Number.trim() === "") {
                throw new Error("Assigned driver must have a valid License_Number.");
            }
        }

        dbState.tricycles.push({
            Body_Number: bodyNum,
            Chassis_Number: chassis,
            Franchise_Number: franchise,
            Owner_Member_ID: ownerId,
            Driver_Member_ID: driverId
        });
        saveLocalDb(dbState);
        if (driverId) {
            pushDriverNotice(driverId, bodyNum, caller);
        }
        return { ok: true, Body_Number: bodyNum };
    }

    if (method === "PUT" && pathname.indexOf("/tricycles/") === 0) {
        const bodyNum = decodeURIComponent(pathname.slice(11));
        const unit = findTricycleByBody(dbState, bodyNum);
        if (!unit) {
            throw new Error("Tricycle not found.");
        }
        const owner = findMemberById(dbState, unit.Owner_Member_ID);
        const isOwner = unit.Owner_Member_ID === caller.Member_ID;
        const isSamePres = Boolean(caller.ledTodaId && owner && owner.TODA_ID === caller.ledTodaId);
        if (!caller.isSecretary && !isOwner && !isSamePres) {
            throw new Error("You do not have permission to update this tricycle.");
        }

        const nextChassis = payload.Chassis_Number !== undefined ? localCleanText(payload.Chassis_Number) : unit.Chassis_Number;
        const nextFranchise = payload.Franchise_Number !== undefined ? localCleanText(payload.Franchise_Number) : unit.Franchise_Number;
        const nextDriver = payload.Driver_Member_ID !== undefined ? localCleanOptional(payload.Driver_Member_ID) : unit.Driver_Member_ID;

        if (!nextChassis || !nextFranchise) {
            throw new Error("Chassis_Number and Franchise_Number are required.");
        }
        for (let i = 0; i < dbState.tricycles.length; i += 1) {
            const u = dbState.tricycles[i];
            if (u.Body_Number === bodyNum) {
                continue;
            }
            if (u.Chassis_Number === nextChassis) {
                throw new Error("That chassis number is already registered.");
            }
            if (u.Franchise_Number === nextFranchise) {
                throw new Error("That franchise number is already registered.");
            }
            if (nextDriver && u.Driver_Member_ID === nextDriver) {
                throw new Error("This driver is already assigned to another tricycle.");
            }
        }
        if (nextDriver) {
            const driver = findMemberById(dbState, nextDriver);
            if (!driver || !driver.License_Number || driver.License_Number.trim() === "") {
                throw new Error("Assigned driver must have a valid License_Number.");
            }
        }

        const prevDriver = unit.Driver_Member_ID;
        unit.Chassis_Number = nextChassis;
        unit.Franchise_Number = nextFranchise;
        unit.Driver_Member_ID = nextDriver;
        saveLocalDb(dbState);
        if (nextDriver && nextDriver !== prevDriver) {
            pushDriverNotice(nextDriver, bodyNum, caller);
        }
        return { ok: true };
    }

    if (method === "DELETE" && pathname.indexOf("/tricycles/") === 0) {
        const bodyNum = decodeURIComponent(pathname.slice(11));
        const idx = dbState.tricycles.findIndex(function (u) {
            return u.Body_Number === bodyNum;
        });
        if (idx === -1) {
            throw new Error("Tricycle not found.");
        }
        const unit = dbState.tricycles[idx];
        const owner = findMemberById(dbState, unit.Owner_Member_ID);
        const isOwner = unit.Owner_Member_ID === caller.Member_ID;
        const isSamePres = Boolean(caller.ledTodaId && owner && owner.TODA_ID === caller.ledTodaId);
        if (!caller.isSecretary && !isOwner && !isSamePres) {
            throw new Error("You do not have permission to delete this tricycle.");
        }
        if (unit.Driver_Member_ID) {
            throw new Error("Remove the assigned driver before deleting this tricycle.");
        }
        dbState.tricycles.splice(idx, 1);
        saveLocalDb(dbState);
        return { ok: true };
    }

    if (method === "GET" && pathname === "/notifications") {
        const allItems = loadLocalNotices();
        const visible = [];
        let unreadCount = 0;
        for (let i = allItems.length - 1; i >= 0; i -= 1) {
            const item = allItems[i];
            if (!isNoticeVisible(item, caller)) {
                continue;
            }
            const readBy = Array.isArray(item.readBy) ? item.readBy : [];
            const isRead = readBy.indexOf(caller.Member_ID) !== -1;
            if (!isRead) {
                unreadCount += 1;
            }
            visible.push({
                id: item.id,
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
        if (!caller.isSecretary && !caller.ledTodaId) {
            throw new Error("Only a TODA President or Federation Secretary can send notices.");
        }
        const title = localCleanText(payload.title);
        const message = localCleanText(payload.message);
        const targetType = localCleanText(payload.targetType) || "toda";
        let targetId = localCleanText(payload.targetId);

        if (!title || !message) {
            throw new Error("Title and message are required.");
        }
        if (!caller.isSecretary) {
            if (targetType === "all" || targetType === "officers") {
                throw new Error("Only the Federation Secretary can send federation-wide notices.");
            }
            if (targetType === "toda") {
                targetId = caller.ledTodaId;
            } else if (targetType === "member") {
                if (!targetId) {
                    throw new Error("Member ID is required.");
                }
                const targetMember = findMemberById(dbState, targetId);
                if (!targetMember || targetMember.TODA_ID !== caller.ledTodaId) {
                    throw new Error("You can only notify members in your own TODA group.");
                }
            }
        } else if ((targetType === "toda" || targetType === "member") && !targetId) {
            throw new Error("Target ID is required.");
        }

        const allItems = loadLocalNotices();
        const entry = {
            id: "NTF-" + String(Date.now()) + "-" + String(allItems.length + 1),
            title: title,
            message: message,
            targetType: targetType,
            targetId: targetId || null,
            senderId: caller.Member_ID,
            senderName: caller.First_Name + " " + caller.Last_Name,
            createdAt: new Date().toISOString(),
            readBy: []
        };
        allItems.push(entry);
        saveLocalNotices(allItems);
        return { ok: true, notification: entry };
    }

    if (method === "PUT" && pathname === "/notifications/read-all") {
        const allItems = loadLocalNotices();
        let changed = false;
        for (let i = 0; i < allItems.length; i += 1) {
            const item = allItems[i];
            if (!isNoticeVisible(item, caller)) {
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
        const noticeId = decodeURIComponent(pathname.slice(15, pathname.length - 5));
        const allItems = loadLocalNotices();
        let found = false;
        for (let i = 0; i < allItems.length; i += 1) {
            const item = allItems[i];
            if (item.id === noticeId) {
                if (!isNoticeVisible(item, caller)) {
                    throw new Error("You cannot access this notification.");
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

async function apiRequest(method, path, body) {
    return routeLocalRequest(method, path, body);
}

function apiGetStatus() {
    return apiRequest("GET", "/status");
}

function apiCompleteOobe(payload) {
    return apiRequest("POST", "/oobe", payload);
}

function apiSeedSampleData() {
    return apiRequest("POST", "/seed");
}

function apiLogin(memberId) {
    return apiRequest("POST", "/login", { Member_ID: memberId });
}

function apiGetHome(memberId) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("GET", "/home/" + safeId);
}

function apiResetDatabase(memberId) {
    return apiRequest("POST", "/reset", { Member_ID: memberId });
}

function apiListTodas() {
    return apiRequest("GET", "/todas");
}

function apiCreateToda(payload) {
    return apiRequest("POST", "/todas", payload);
}

function apiAssignPresident(todaId, memberId) {
    const safeToda = encodeURIComponent(todaId);
    return apiRequest("PUT", "/todas/" + safeToda + "/president", { President_Member_ID: memberId });
}

function apiDeleteToda(todaId) {
    const safeToda = encodeURIComponent(todaId);
    return apiRequest("DELETE", "/todas/" + safeToda);
}

function apiListLicensedDrivers() {
    return apiRequest("GET", "/drivers");
}

function apiListMembers(query) {
    const q = query || {};
    const params = new URLSearchParams();
    if (q.todaId) {
        params.set("todaId", q.todaId);
    }
    if (q.q) {
        params.set("q", q.q);
    }
    if (q.sort) {
        params.set("sort", q.sort);
    }
    if (q.licensedOnly) {
        params.set("licensedOnly", "1");
    }
    if (q.role && q.role !== "all") {
        params.set("role", q.role);
    }
    const qs = params.toString();
    const suffix = qs ? "?" + qs : "";
    return apiRequest("GET", "/members" + suffix);
}

function apiGetMember(memberId) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("GET", "/members/" + safeId);
}

function apiCreateMember(payload) {
    return apiRequest("POST", "/members", payload);
}

function apiUpdateMember(memberId, payload) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("PUT", "/members/" + safeId, payload);
}

function apiUpdateMemberToda(memberId, todaId) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("PUT", "/members/" + safeId + "/toda", { TODA_ID: todaId });
}

function apiDeleteMember(memberId) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("DELETE", "/members/" + safeId);
}

function apiListTricycles(query) {
    const q = query || {};
    const params = new URLSearchParams();
    if (q.todaId) {
        params.set("todaId", q.todaId);
    }
    if (q.ownerId) {
        params.set("ownerId", q.ownerId);
    }
    const qs = params.toString();
    const suffix = qs ? "?" + qs : "";
    return apiRequest("GET", "/tricycles" + suffix);
}

function apiGetTricycle(bodyNumber) {
    const safeBody = encodeURIComponent(bodyNumber);
    return apiRequest("GET", "/tricycles/" + safeBody);
}

function apiCreateTricycle(payload) {
    return apiRequest("POST", "/tricycles", payload);
}

function apiUpdateTricycle(bodyNumber, payload) {
    const safeBody = encodeURIComponent(bodyNumber);
    return apiRequest("PUT", "/tricycles/" + safeBody, payload);
}

function apiDeleteTricycle(bodyNumber) {
    const safeBody = encodeURIComponent(bodyNumber);
    return apiRequest("DELETE", "/tricycles/" + safeBody);
}
