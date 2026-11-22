/* client-side schema bridge: maps live sql metadata to ui rows and exports */

function formatColumnLabel(colName) {
    if (!colName) {
        return "";
    }
    const raw = String(colName);
    return raw.replace(/_/g, " ");
}

function resolveTableColumns(schemaTables, tableName, rows) {
    if (schemaTables) {
        const lowerName = tableName.toLowerCase();
        const entry = schemaTables[tableName] || schemaTables[lowerName];
        if (entry && Array.isArray(entry.columnNames) && entry.columnNames.length > 0) {
            return entry.columnNames;
        }
    }
    if (rows && rows.length > 0) {
        return Object.keys(rows[0]);
    }
    return [];
}

function appendExtraColumnRows(rowsList, record, knownKeys) {
    if (!record || !rowsList) {
        return;
    }
    const skip = {};
    const knownCount = knownKeys ? knownKeys.length : 0;
    for (let i = 0; i < knownCount; i += 1) {
        skip[knownKeys[i]] = true;
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
        const displayVal = rawVal !== null && rawVal !== undefined && rawVal !== "" ? String(rawVal) : "None";
        const row = trPropertyRow({ label: formatColumnLabel(key), value: displayVal });
        rowsList.push(row);
    }
}
