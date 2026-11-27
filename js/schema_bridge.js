/* client-side schema bridge: maps live 6-table sql metadata to ui rows and exports */

// based on final_dbms1_relational-model.md, relational schema, list all six active tables in foreign key insert order
const SCHEMA_TABLE_ORDER = [
    "federation",
    "toda_association",
    "member",
    "tricycle",
    "driver_assignment",
    "officer_term"
];

const KNOWN_TABLE_COLUMNS = {
    federation: [
        "Federation_ID",
        "Federation_Name",
        "Accreditation_Number",
        "Accreditation_Expiry",
        "Office_Address",
        "Secretary_Member_ID"
    ],
    toda_association: [
        "TODA_ID",
        "TODA_Name",
        "Route",
        "SEC_Reg_Number",
        "Terminal_Location",
        "Accreditation_Expiry",
        "Association_Status",
        "Federation_ID"
    ],
    member: [
        "Member_ID",
        "First_Name",
        "Last_Name",
        "Street",
        "Barangay",
        "City_Municipality",
        "Contact_Number",
        "License_Number",
        "License_Expiry_Date",
        "License_Type",
        "Restriction_Code",
        "PSO_ID_Number",
        "BLS_Cert_ID",
        "TODA_ID"
    ],
    tricycle: [
        "Tricycle_ID",
        "Body_Number",
        "Franchise_Number",
        "Chassis_Number",
        "Plate_Number",
        "Franchise_Expiry_Date",
        "Mayors_Permit_Expiry",
        "Franchise_Status",
        "OR_CR_Expiry",
        "Color_Zone",
        "Owner_Member_ID"
    ],
    driver_assignment: [
        "Assignment_ID",
        "Member_ID",
        "Tricycle_ID",
        "Driver_Role",
        "Shift_Schedule",
        "Date_Assigned",
        "Status"
    ],
    officer_term: [
        "Term_ID",
        "Member_ID",
        "TODA_ID",
        "Position",
        "Term_Start",
        "Term_End"
    ]
};

// params: colName (required)
function formatColumnLabel(colName) {
    if (!colName) {
        return "";
    }
    let raw = String(colName);
    raw = raw.replace(/_/g, " ");
    return raw;
}

// params: schemaTables (optional), tableName (required)
function getTableSchemaEntry(schemaTables, tableName) {
    if (!schemaTables || !tableName) {
        return null;
    }
    const lowerName = String(tableName).toLowerCase();
    if (schemaTables[tableName]) {
        return schemaTables[tableName];
    }
    if (schemaTables[lowerName]) {
        return schemaTables[lowerName];
    }
    return null;
}

// params: tableName (required)
function getKnownTableKeys(tableName) {
    if (!tableName) {
        return [];
    }
    const lowerName = String(tableName).toLowerCase();
    const list = KNOWN_TABLE_COLUMNS[lowerName];
    if (!list) {
        return [];
    }
    return list.slice();
}

// params: schemaTables (optional), tableName (required), rows (optional)
function resolveTableColumns(schemaTables, tableName, rows) {
    const entry = getTableSchemaEntry(schemaTables, tableName);
    if (entry && Array.isArray(entry.columnNames) && entry.columnNames.length > 0) {
        return entry.columnNames;
    }
    const known = getKnownTableKeys(tableName);
    if (known.length > 0) {
        return known;
    }
    if (rows && rows.length > 0) {
        return Object.keys(rows[0]);
    }
    return [];
}

// params: schemaTables (optional), tableName (required), columnName (required)
function findColumnMeta(schemaTables, tableName, columnName) {
    const entry = getTableSchemaEntry(schemaTables, tableName);
    if (!entry || !Array.isArray(entry.columns)) {
        return null;
    }
    const targetLower = String(columnName || "").toLowerCase();
    const colCount = entry.columns.length;
    for (let i = 0; i < colCount; i += 1) {
        const col = entry.columns[i];
        const colLower = String(col.name || "").toLowerCase();
        if (colLower === targetLower) {
            return col;
        }
    }
    return null;
}

// params: schemaTables (optional), tableName (required), columnName (required), fallbackValues (optional)
function getColumnEnumValues(schemaTables, tableName, columnName, fallbackValues) {
    const col = findColumnMeta(schemaTables, tableName, columnName);
    if (col && Array.isArray(col.enumValues) && col.enumValues.length > 0) {
        return col.enumValues;
    }
    if (Array.isArray(fallbackValues)) {
        return fallbackValues;
    }
    return [];
}

// params: schemaTables (optional), tableName (required), columnName (required), fallbackDefault (optional)
function getColumnDefault(schemaTables, tableName, columnName, fallbackDefault) {
    const col = findColumnMeta(schemaTables, tableName, columnName);
    if (col && col.columnDefault !== undefined && col.columnDefault !== null) {
        return col.columnDefault;
    }
    if (fallbackDefault !== undefined) {
        return fallbackDefault;
    }
    return "";
}

// params: rowsList (required), record (required), knownKeys (optional)
function appendExtraColumnRows(rowsList, record, knownKeys) {
    if (!record || !rowsList) {
        return;
    }
    const skip = {};
    let knownCount = 0;
    if (knownKeys) {
        knownCount = knownKeys.length;
    }
    for (let i = 0; i < knownCount; i += 1) {
        const knownKey = knownKeys[i];
        skip[knownKey] = true;
    }

    const keys = Object.keys(record);
    const keyCount = keys.length;
    for (let i = 0; i < keyCount; i += 1) {
        const key = keys[i];
        if (skip[key]) {
            continue;
        }
        const rawVal = record[key];
        if (typeof rawVal === "object" && rawVal !== null) {
            continue;
        }
        let displayVal = "None";
        if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
            displayVal = String(rawVal);
        }
        const colLabel = formatColumnLabel(key);
        const row = trPropertyRow({ label: colLabel, value: displayVal });
        rowsList.push(row);
    }
}
