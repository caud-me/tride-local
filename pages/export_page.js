/* experimental export data screen (standalone, removable) */

const EXPORT_FILE_PREFIX = "tride-export";
const EXPORT_FORMATS = [
    { label: "Excel (.csv)", value: "csv" },
    { label: "PDF (Print)", value: "pdf" },
    { label: "SQL (.sql)", value: "sql" }
];

function escapeCsvCell(rawValue) {
    if (rawValue === null || rawValue === undefined) {
        return "";
    }
    let text = String(rawValue);
    const hasSpecial = text.indexOf(",") !== -1 || text.indexOf("\"") !== -1 || text.indexOf("\n") !== -1;
    if (hasSpecial) {
        text = text.replace(/"/g, "\"\"");
        text = "\"" + text + "\"";
    }
    return text;
}

function buildCsvText(columns, rows) {
    const lines = [];
    const headerCells = [];
    const colCount = columns.length;
    for (let i = 0; i < colCount; i += 1) {
        headerCells.push(escapeCsvCell(columns[i]));
    }
    lines.push(headerCells.join(","));

    const rowCount = rows.length;
    for (let r = 0; r < rowCount; r += 1) {
        const record = rows[r];
        const cells = [];
        for (let c = 0; c < colCount; c += 1) {
            const key = columns[c];
            cells.push(escapeCsvCell(record[key]));
        }
        lines.push(cells.join(","));
    }
    return lines.join("\r\n");
}

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

function buildSqlInserts(tableName, columns, rows) {
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
            values.push(escapeSqlValue(record[key]));
        }
        const stmt = "INSERT INTO `" + tableName + "` (" + colList + ") VALUES (" + values.join(", ") + ");";
        lines.push(stmt);
    }
    return lines.join("\n");
}

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
    htmlParts.push("table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }");
    htmlParts.push("th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }");
    htmlParts.push("th { background: #f2f2f2; }");
    htmlParts.push("</style></head><body>");
    htmlParts.push("<h1>" + escapeHtmlText(reportTitle) + "</h1>");
    htmlParts.push("<p class=\"meta\">Generated " + escapeHtmlText(new Date().toLocaleString()) + "</p>");

    const sectionCount = sections.length;
    for (let i = 0; i < sectionCount; i += 1) {
        const sec = sections[i];
        htmlParts.push(buildHtmlTableSection(sec.title, sec.columns, sec.rows));
    }
    htmlParts.push("</body></html>");

    printWin.document.open();
    printWin.document.write(htmlParts.join(""));
    printWin.document.close();
    printWin.focus();
    printWin.print();
}

function renderExportPage(params) {
    const opts = params || {};
    const isSecretary = opts.role === "secretary";
    const scopeTodaId = isSecretary ? null : (opts.scopeTodaId || null);
    const scopeLabel = isSecretary ? "All TODAs" : (opts.scopeTodaName || scopeTodaId || "My TODA");

    const navBar = trNavBar({
        title: "Export data",
        onBack: popPage
    });

    const main = trEl("main", "content vbox gap-m");
    main.appendChild(trBanner("Experimental: export records for " + scopeLabel + "."));

    const selected = {
        todas: isSecretary,
        members: true,
        units: true
    };

    const checkRows = [];
    if (isSecretary) {
        const todaCheck = trCheckRow({
            title: "TODA associations",
            subtitle: "All registered TODA groups and routes",
            checked: selected.todas,
            onChange: function (checked) {
                selected.todas = checked;
            }
        });
        checkRows.push(todaCheck);
    }

    const memberSubtitle = isSecretary ? "All federation members and roles" : "Members in " + scopeLabel;
    const memberCheck = trCheckRow({
        title: "Members",
        subtitle: memberSubtitle,
        checked: selected.members,
        onChange: function (checked) {
            selected.members = checked;
        }
    });
    checkRows.push(memberCheck);

    const unitSubtitle = isSecretary ? "All tricycle units and assignments" : "Tricycle units in " + scopeLabel;
    const unitCheck = trCheckRow({
        title: "Tricycle units",
        subtitle: unitSubtitle,
        checked: selected.units,
        onChange: function (checked) {
            selected.units = checked;
        }
    });
    checkRows.push(unitCheck);

    let activeFormat = EXPORT_FORMATS[0].value;
    const formatRow = trPropertyRow({
        label: "File format",
        select: {
            value: activeFormat,
            options: EXPORT_FORMATS,
            onChange: function (nextVal) {
                activeFormat = nextVal;
            }
        }
    });

    const statusWrap = trEl("div", "vbox gap-s");

    const exportBtn = trButton({
        label: "Export",
        variant: "primary",
        onClick: async function () {
            statusWrap.replaceChildren();
            const hasSelection = selected.todas || selected.members || selected.units;
            if (!hasSelection) {
                statusWrap.appendChild(trBanner("Select at least one dataset to export."));
                return;
            }

            statusWrap.appendChild(trBanner("Preparing export..."));
            try {
                const schemaRes = typeof apiGetSchema === "function" ? await apiGetSchema() : null;
                const schemaTables = schemaRes && schemaRes.tables ? schemaRes.tables : null;
                const sections = [];
                const sqlBlocks = [];
                const scopeSlug = scopeTodaId ? scopeTodaId.toLowerCase() : "all";

                if (selected.todas && isSecretary) {
                    const todaRes = await apiListTodas();
                    const todas = todaRes.todas || [];
                    const todaCols = resolveTableColumns(schemaTables, "toda_association", todas);
                    sections.push({
                        key: "todas",
                        table: "toda_association",
                        title: "TODA Associations",
                        columns: todaCols,
                        rows: todas
                    });
                }

                if (selected.members) {
                    const memberQuery = scopeTodaId ? { todaId: scopeTodaId } : {};
                    const memRes = await apiListMembers(memberQuery);
                    const members = memRes.members || [];
                    const memberCols = resolveTableColumns(schemaTables, "member", members);
                    sections.push({
                        key: "members",
                        table: "member",
                        title: "Members",
                        columns: memberCols,
                        rows: members
                    });
                }

                if (selected.units) {
                    const unitQuery = scopeTodaId ? { todaId: scopeTodaId } : {};
                    const unitRes = await apiListTricycles(unitQuery);
                    const units = unitRes.tricycles || [];
                    const unitCols = resolveTableColumns(schemaTables, "tricycle", units);
                    sections.push({
                        key: "units",
                        table: "tricycle",
                        title: "Tricycle Units",
                        columns: unitCols,
                        rows: units
                    });
                }

                const secCount = sections.length;
                if (activeFormat === "csv") {
                    for (let i = 0; i < secCount; i += 1) {
                        const sec = sections[i];
                        const csvText = buildCsvText(sec.columns, sec.rows);
                        const filename = EXPORT_FILE_PREFIX + "-" + scopeSlug + "-" + sec.key + ".csv";
                        triggerFileDownload(filename, "\uFEFF" + csvText, "text/csv;charset=utf-8");
                    }
                    statusWrap.replaceChildren(trBanner("Downloaded " + secCount + " Excel (.csv) file(s)."));
                } else if (activeFormat === "sql") {
                    sqlBlocks.push("-- Tride SQL export (" + scopeLabel + ")");
                    sqlBlocks.push("-- Generated " + new Date().toISOString());
                    for (let i = 0; i < secCount; i += 1) {
                        const sec = sections[i];
                        sqlBlocks.push("");
                        sqlBlocks.push("-- " + sec.title);
                        sqlBlocks.push(buildSqlInserts(sec.table, sec.columns, sec.rows));
                    }
                    const sqlName = EXPORT_FILE_PREFIX + "-" + scopeSlug + ".sql";
                    triggerFileDownload(sqlName, sqlBlocks.join("\n"), "application/sql;charset=utf-8");
                    statusWrap.replaceChildren(trBanner("Downloaded " + sqlName + "."));
                } else {
                    openPrintPdfReport("Tride Export - " + scopeLabel, sections);
                    statusWrap.replaceChildren(trBanner("Opened PDF print view."));
                }
            } catch (err) {
                statusWrap.replaceChildren(trBanner(err.message));
            }
        }
    });

    trAppend(main, [
        trSectionHeading("What to export"),
        trListCard(checkRows),
        trSectionHeading("Format"),
        trListCard([formatRow]),
        statusWrap,
        exportBtn
    ]);

    return [navBar, main];
}
