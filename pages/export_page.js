/* 6-table export data screen (SQL in FK order, JSON with preview, CSV, and printable PDF) */

const EXPORT_FILE_PREFIX = "tride-dbms1-export";
const EXPORT_PREVIEW_MAX_CHARS = 1200;

const EXPORT_DATASETS = [
    { key: "federation", title: "Federations", subtitle: "City and district federations", secretaryOnly: false },
    { key: "toda_association", title: "TODA associations", subtitle: "SEC-registered TODAs, routes, and terminals", secretaryOnly: false },
    { key: "member", title: "Members", subtitle: "Atomic address and driver credential profiles", secretaryOnly: false },
    { key: "tricycle", title: "Tricycle units", subtitle: "Franchised tricycles, color zones, and permits", secretaryOnly: false },
    { key: "driver_assignment", title: "Driver assignments", subtitle: "Primary and alternate (relyebo) shifts", secretaryOnly: false },
    { key: "officer_term", title: "Officer terms", subtitle: "Elected TODA board positions and term dates", secretaryOnly: false }
];

const EXPORT_FORMATS = [
    { label: "SQL (.sql)", value: "sql" },
    { label: "JSON (.json)", value: "json" },
    { label: "Excel (.csv)", value: "csv" },
    { label: "PDF (Print)", value: "pdf" }
];

// params: rawValue (optional)
function escapeCsvCell(rawValue) {
    if (rawValue === null || rawValue === undefined) {
        return "";
    }
    let text = String(rawValue);
    const hasComma = text.indexOf(",") !== -1;
    const hasQuote = text.indexOf("\"") !== -1;
    const hasNewline = text.indexOf("\n") !== -1;
    if (hasComma || hasQuote || hasNewline) {
        text = text.replace(/"/g, "\"\"");
        text = "\"" + text + "\"";
    }
    return text;
}

// params: columns (required), rows (required)
function buildCsvText(columns, rows) {
    const lines = [];
    const headerCells = [];
    const colCount = columns.length;
    for (let i = 0; i < colCount; i += 1) {
        const cell = escapeCsvCell(columns[i]);
        headerCells.push(cell);
    }
    const headerLine = headerCells.join(",");
    lines.push(headerLine);

    const rowCount = rows.length;
    for (let r = 0; r < rowCount; r += 1) {
        const record = rows[r];
        const cells = [];
        for (let c = 0; c < colCount; c += 1) {
            const key = columns[c];
            const cell = escapeCsvCell(record[key]);
            cells.push(cell);
        }
        const rowLine = cells.join(",");
        lines.push(rowLine);
    }
    return lines.join("\r\n");
}

// params: rawValue (optional)
function escapeSqlValue(rawValue) {
    if (rawValue === null || rawValue === undefined || rawValue === "") {
        return "NULL";
    }
    if (typeof rawValue === "number") {
        return String(rawValue);
    }
    let text = String(rawValue);
    text = text.replace(/\\/g, "\\\\");
    text = text.replace(/'/g, "''");
    return "'" + text + "'";
}

// params: tableName (required), columns (required), rows (required), nullOutColumn (optional)
function buildSqlInserts(tableName, columns, rows, nullOutColumn) {
    const lines = [];
    const rowCount = rows.length;
    const colCount = columns.length;
    if (rowCount === 0) {
        return "-- no rows for " + tableName;
    }

    const colList = columns.join(", ");
    for (let r = 0; r < rowCount; r += 1) {
        const record = rows[r];
        const values = [];
        for (let c = 0; c < colCount; c += 1) {
            const key = columns[c];
            if (nullOutColumn && key === nullOutColumn) {
                values.push("NULL");
            } else {
                const escaped = escapeSqlValue(record[key]);
                values.push(escaped);
            }
        }
        const valText = values.join(", ");
        const stmt = "INSERT INTO `" + tableName + "` (" + colList + ") VALUES (" + valText + ");";
        lines.push(stmt);
    }
    return lines.join("\n");
}

// params: federationRows (required)
function buildFederationSecretaryUpdates(federationRows) {
    const lines = [];
    const count = federationRows.length;
    for (let i = 0; i < count; i += 1) {
        const row = federationRows[i];
        if (row && row.Secretary_Member_ID) {
            const secVal = escapeSqlValue(row.Secretary_Member_ID);
            const fedVal = escapeSqlValue(row.Federation_ID);
            const stmt = "UPDATE `federation` SET `Secretary_Member_ID` = " + secVal + " WHERE `Federation_ID` = " + fedVal + ";";
            lines.push(stmt);
        }
    }
    return lines.join("\n");
}

// params: filename (required), content (required), mimeType (required)
function triggerFileDownload(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 1000);
}

// params: rawValue (optional)
function escapeHtmlText(rawValue) {
    if (rawValue === null || rawValue === undefined) {
        return "";
    }
    let text = String(rawValue);
    text = text.replace(/&/g, "&amp;");
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    return text;
}

// params: title (required), columns (required), rows (required)
function buildHtmlTableSection(title, columns, rows) {
    const parts = [];
    parts.push("<h2>" + escapeHtmlText(title) + " (" + rows.length + ")</h2>");
    parts.push("<table><thead><tr>");
    const colCount = columns.length;
    for (let c = 0; c < colCount; c += 1) {
        parts.push("<th>" + escapeHtmlText(columns[c]) + "</th>");
    }
    parts.push("</tr></thead><tbody>");

    const rowCount = rows.length;
    for (let r = 0; r < rowCount; r += 1) {
        const record = rows[r];
        parts.push("<tr>");
        for (let c = 0; c < colCount; c += 1) {
            const key = columns[c];
            parts.push("<td>" + escapeHtmlText(record[key]) + "</td>");
        }
        parts.push("</tr>");
    }
    parts.push("</tbody></table>");
    return parts.join("");
}

// params: reportTitle (required), sections (required)
function openPrintPdfReport(reportTitle, sections) {
    const printWin = window.open("", "_blank");
    if (!printWin) {
        trAlert({
            title: "Popup blocked",
            message: "Allow popups in your browser to open the PDF print view."
        });
        return;
    }

    const htmlParts = [];
    htmlParts.push("<!DOCTYPE html><html><head><meta charset=\"UTF-8\">");
    htmlParts.push("<title>" + escapeHtmlText(reportTitle) + "</title>");
    htmlParts.push("<style>");
    htmlParts.push("body { font-family: Segoe UI, sans-serif; padding: 24px; color: #111; }");
    htmlParts.push("h1 { font-size: 20px; margin-bottom: 4px; }");
    htmlParts.push("p.meta { color: #555; font-size: 12px; margin-bottom: 20px; }");
    htmlParts.push("h2 { font-size: 15px; margin: 20px 0 8px; }");
    htmlParts.push("table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }");
    htmlParts.push("th, td { border: 1px solid #ccc; padding: 5px 6px; text-align: left; }");
    htmlParts.push("th { background: #f2f2f2; }");
    htmlParts.push("</style></head><body>");
    htmlParts.push("<h1>" + escapeHtmlText(reportTitle) + "</h1>");
    const nowText = new Date().toLocaleString();
    htmlParts.push("<p class=\"meta\">Generated " + escapeHtmlText(nowText) + "</p>");

    const sectionCount = sections.length;
    for (let i = 0; i < sectionCount; i += 1) {
        const sec = sections[i];
        const htmlSec = buildHtmlTableSection(sec.title, sec.columns, sec.rows);
        htmlParts.push(htmlSec);
    }
    htmlParts.push("</body></html>");

    printWin.document.open();
    printWin.document.write(htmlParts.join(""));
    printWin.document.close();
    printWin.focus();
    printWin.print();
}

// params: params (optional: { role, scopeTodaId, scopeTodaName })
function renderExportPage(params) {
    const opts = params || {};
    const isSecretary = opts.role === "secretary";
    const scopeTodaId = isSecretary ? null : (opts.scopeTodaId || null);
    let scopeLabel = "all TODAs";
    if (!isSecretary) {
        scopeLabel = opts.scopeTodaName || "your TODA";
    }

    const navBar = trNavBar({
        title: "Export data",
        subtitle: "for " + scopeLabel,
        onBack: popPage
    });

    const main = trEl("main", "content vbox space-xl");

    const selected = {};
    const checkRows = [];
    const dsCount = EXPORT_DATASETS.length;
    for (let i = 0; i < dsCount; i += 1) {
        const ds = EXPORT_DATASETS[i];
        selected[ds.key] = true;
        const row = trCheckRow({
            title: ds.title,
            subtitle: ds.subtitle,
            checked: true,
            onChange: function (checked) {
                selected[ds.key] = checked;
            }
        });
        checkRows.push(row);
    }

    let activeFormat = EXPORT_FORMATS[0].value;
    const formatRow = trPropertyRow({
        label: "File format",
        select: {
            value: activeFormat,
            options: EXPORT_FORMATS,
            onChange: function (event) {
                activeFormat = event.target.value;
            }
        }
    });

    const statusWrap = trEl("div", "vbox space-m");
    const previewWrap = trEl("div", "vbox space-l");

    function setExportStatus(message, isCritical) {
        statusWrap.replaceChildren();
        let cls = "as-tertiary as-gray";
        if (isCritical) {
            cls = "as-tertiary as-critical";
        }
        const msgEl = trEl("p", cls, message);
        msgEl.setAttribute("role", "status");
        statusWrap.appendChild(msgEl);
    }

    function renderJsonPreview(exportObj, sectionList) {
        previewWrap.replaceChildren();
        const countRows = [];
        const sLen = sectionList.length;
        for (let i = 0; i < sLen; i += 1) {
            const sec = sectionList[i];
            const row = trPropertyRow({
                label: sec.title,
                value: String(sec.rows.length) + " " + pluralLabel(sec.rows.length, "row", "rows")
            });
            countRows.push(row);
        }

        let jsonStr = JSON.stringify(exportObj, null, 2);
        if (jsonStr.length > EXPORT_PREVIEW_MAX_CHARS) {
            jsonStr = jsonStr.slice(0, EXPORT_PREVIEW_MAX_CHARS) + "\n...";
        }
        const snippetRow = trListItem({
            title: "JSON preview",
            subtitle: jsonStr
        });
        countRows.push(snippetRow);

        const prevCard = trListCard(countRows);
        const prevGroup = trCardGroup({
            headline: "Export summary",
            card: prevCard,
            footnote: "Full JSON snapshot downloaded to your device."
        });
        previewWrap.appendChild(prevGroup);
    }

    const exportBtn = trButton({
        label: "Export",
        variant: "primary",
        onClick: async function () {
            statusWrap.replaceChildren();
            previewWrap.replaceChildren();

            let anySelected = false;
            for (let i = 0; i < dsCount; i += 1) {
                if (selected[EXPORT_DATASETS[i].key]) {
                    anySelected = true;
                }
            }
            if (!anySelected) {
                setExportStatus("Select at least one dataset to export.", true);
                return;
            }

            setExportStatus("Preparing 6-table export...", false);

            try {
                const exportRes = await apiExport(scopeTodaId);
                const rawTables = exportRes.tables || {};
                let schemaTables = null;
                if (typeof apiSchema === "function") {
                    const schemaRes = await apiSchema();
                    if (schemaRes && schemaRes.tables) {
                        schemaTables = schemaRes.tables;
                    }
                }

                // based on final_dbms1_relational-model.md, relational schema, assemble selected datasets in strict foreign key insert order
                const sections = [];
                const jsonPayload = {};
                const scopeSlug = scopeTodaId ? String(scopeTodaId).toLowerCase() : "all";

                for (let i = 0; i < dsCount; i += 1) {
                    const ds = EXPORT_DATASETS[i];
                    if (!selected[ds.key]) {
                        continue;
                    }
                    const rows = rawTables[ds.key] || [];
                    const cols = resolveTableColumns(schemaTables, ds.key, rows);
                    sections.push({
                        key: ds.key,
                        table: ds.key,
                        title: ds.title,
                        columns: cols,
                        rows: rows
                    });
                    jsonPayload[ds.key] = rows;
                }

                const secCount = sections.length;
                if (activeFormat === "sql") {
                    const sqlBlocks = [];
                    sqlBlocks.push("-- Tride dbms1_tride SQL export (" + scopeLabel + ")");
                    const isoNow = new Date().toISOString();
                    sqlBlocks.push("-- Generated " + isoNow);

                    let fedRowsForUpdate = null;
                    let memberEmitted = false;
                    let updateEmitted = false;

                    for (let i = 0; i < secCount; i += 1) {
                        const sec = sections[i];
                        sqlBlocks.push("");
                        sqlBlocks.push("-- " + sec.title);

                        if (sec.table === "federation") {
                            // based on final_dbms1_relational-model.md, MANAGES, insert federation with null secretary first to avoid circular foreign key error
                            fedRowsForUpdate = sec.rows;
                            const fedSql = buildSqlInserts(sec.table, sec.columns, sec.rows, "Secretary_Member_ID");
                            sqlBlocks.push(fedSql);
                        } else {
                            const tblSql = buildSqlInserts(sec.table, sec.columns, sec.rows, null);
                            sqlBlocks.push(tblSql);
                        }

                        if (sec.table === "member") {
                            memberEmitted = true;
                            if (fedRowsForUpdate) {
                                const updSql = buildFederationSecretaryUpdates(fedRowsForUpdate);
                                if (updSql) {
                                    sqlBlocks.push("");
                                    sqlBlocks.push("-- Bind appointed federation secretaries");
                                    sqlBlocks.push(updSql);
                                    updateEmitted = true;
                                }
                            }
                        }
                    }

                    if (fedRowsForUpdate && !memberEmitted && !updateEmitted) {
                        const tailUpd = buildFederationSecretaryUpdates(fedRowsForUpdate);
                        if (tailUpd) {
                            sqlBlocks.push("");
                            sqlBlocks.push("-- Bind appointed federation secretaries");
                            sqlBlocks.push(tailUpd);
                        }
                    }

                    const sqlName = EXPORT_FILE_PREFIX + "-" + scopeSlug + ".sql";
                    triggerFileDownload(sqlName, sqlBlocks.join("\n"), "application/sql;charset=utf-8");
                    setExportStatus("Downloaded " + sqlName + " in FK insert order.", false);
                } else if (activeFormat === "json") {
                    const jsonName = EXPORT_FILE_PREFIX + "-" + scopeSlug + ".json";
                    const jsonText = JSON.stringify(jsonPayload, null, 2);
                    triggerFileDownload(jsonName, jsonText, "application/json;charset=utf-8");
                    renderJsonPreview(jsonPayload, sections);
                    setExportStatus("Downloaded " + jsonName + ".", false);
                } else if (activeFormat === "csv") {
                    for (let i = 0; i < secCount; i += 1) {
                        const sec = sections[i];
                        const csvText = buildCsvText(sec.columns, sec.rows);
                        const filename = EXPORT_FILE_PREFIX + "-" + scopeSlug + "-" + sec.key + ".csv";
                        triggerFileDownload(filename, "\uFEFF" + csvText, "text/csv;charset=utf-8");
                    }
                    setExportStatus("Downloaded " + secCount + " Excel (.csv) file(s).", false);
                } else {
                    openPrintPdfReport("Tride dbms1_tride Export - " + scopeLabel, sections);
                    setExportStatus("Opened PDF print view.", false);
                }
            } catch (err) {
                setExportStatus(err.message, true);
            }
        }
    });

    const tablesCard = trListCard(checkRows);
    const tablesGroup = trCardGroup({
        headline: "What to export (6 tables)",
        card: tablesCard,
        footnote: "Select one or more tables. SQL exports follow strict foreign key insert order."
    });

    const formatCard = trListCard([formatRow]);
    const formatGroup = trCardGroup({
        headline: "Format",
        card: formatCard,
        footnote: "SQL builds replayable inserts; JSON shows a live preview and downloads a snapshot."
    });

    const formSec = trSection([tablesGroup, formatGroup]);
    const actionSec = trSection([exportBtn, statusWrap, previewWrap]);
    trAppend(main, [formSec, actionSec]);

    return [navBar, main];
}
