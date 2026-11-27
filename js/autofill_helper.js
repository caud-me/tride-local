/* temporary dev autofill helper for dbms1_tride 6-table forms */

(function () {
    "use strict";

    /* top-of-file config and sample pools */
    const HELPER_WRAP_ID = "tr-dev-autofill-wrap";
    const SEQ_MIN = 200;
    const SEQ_MAX = 899;
    const DEFAULT_CITY = "Naga City";
    const DEFAULT_TERM_START = "2026-01-01";
    const DEFAULT_TERM_END = "2027-12-31";
    const DEFAULT_DATE_ASSIGNED = "2026-06-01";
    const DEFAULT_EXPIRY_DATE = "2029-12-31";

    const FIRST_NAMES = [
        "Alex", "Jamie", "Sam", "Chris", "Pat", "Jordan", "Casey", "Taylor",
        "Morgan", "Riley", "Avery", "Quinn", "Devon", "Robin", "Drew", "Skyler"
    ];
    const LAST_NAMES = [
        "Santos", "Reyes", "Cruz", "Garcia", "Ramos", "Mendoza", "Torres", "Flores",
        "Rivera", "Gomez", "Navarro", "Castillo", "Morales", "Aquino", "Bautista", "Vega"
    ];
    const STREETS = [
        "12 Rizal St.", "45 Penafrancia Ave.", "88 Zone 3", "19 Zone 1",
        "77 Elias Angeles St.", "30 Panganiban Dr.", "14 Burgos St.", "52 Magsaysay Ave."
    ];
    const BARANGAYS = [
        "Mabolo", "Pacol", "Cararayan", "Dayangdang",
        "Concepcion Pequena", "Triangulo", "Tinago", "Sabang"
    ];
    const TODA_NAMES = [
        "Mabolo TODA", "Pacol TODA", "Cararayan TODA", "Dayangdang TODA",
        "Concepcion TODA", "Triangulo TODA", "Tinago TODA", "Sabang TODA"
    ];
    const ROUTES = [
        "Mabolo - Centro", "Pacol - Centro", "Cararayan - Centro", "Dayangdang - Centro",
        "Concepcion - SM Naga", "Triangulo - Plaza", "Tinago - Market", "Sabang - Market"
    ];
    const TERMINALS = [
        "SM City Naga Terminal", "Pacol Barangay Hall Terminal", "Cararayan Junction Terminal",
        "Dayangdang Market Terminal", "Concepcion Subdivision Gate", "Centro Plaza Terminal"
    ];
    const SHIFTS = [
        "Mon-Sat 06:00-18:00", "Mon-Fri 06:00-18:00", "Sat-Sun 06:00-18:00",
        "Mon-Sat 05:30-17:30", "Mon-Fri 12:00-22:00"
    ];

    const span = SEQ_MAX - SEQ_MIN + 1;
    let seqCounter = Math.floor(Math.random() * span) + SEQ_MIN;
    let poolIndex = Math.floor(Math.random() * FIRST_NAMES.length);

    // params: num (required), size (required)
    function padNumber(num, size) {
        let text = String(num);
        while (text.length < size) {
            text = "0" + text;
        }
        return text;
    }

    // params: none
    function nextSequence() {
        const current = seqCounter;
        seqCounter = seqCounter + 1;
        if (seqCounter > SEQ_MAX) {
            seqCounter = SEQ_MIN;
        }
        return current;
    }

    // params: list (required)
    function nextPoolIndex(list) {
        const count = list.length;
        const idx = poolIndex % count;
        return idx;
    }

    // params: none
    function advancePool() {
        poolIndex = poolIndex + 1;
    }

    // params: labelText (required), placeholderText (required), maxLen (required)
    function buildUniqueValue(labelText, placeholderText, maxLen) {
        const seq = nextSequence();
        const seq3 = padNumber(seq, 3);
        const seq4 = padNumber(seq, 4);
        const firstIdx = nextPoolIndex(FIRST_NAMES);
        const lastIdx = nextPoolIndex(LAST_NAMES);
        const streetIdx = nextPoolIndex(STREETS);
        const brgyIdx = nextPoolIndex(BARANGAYS);
        const todaIdx = nextPoolIndex(TODA_NAMES);
        const routeIdx = nextPoolIndex(ROUTES);
        const termIdx = nextPoolIndex(TERMINALS);
        const shiftIdx = nextPoolIndex(SHIFTS);

        if (labelText.indexOf("term start") !== -1) {
            return DEFAULT_TERM_START;
        }
        if (labelText.indexOf("term end") !== -1) {
            return DEFAULT_TERM_END;
        }
        if (labelText.indexOf("date assigned") !== -1) {
            return DEFAULT_DATE_ASSIGNED;
        }
        if (labelText.indexOf("expiry") !== -1 || labelText.indexOf("date") !== -1) {
            return DEFAULT_EXPIRY_DATE;
        }
        if (labelText.indexOf("federation id") !== -1) {
            return "FED-" + seq3;
        }
        if (labelText.indexOf("federation name") !== -1 || labelText.indexOf("federation") !== -1) {
            return "Naga District Federation " + seq3;
        }
        if (labelText.indexOf("accreditation") !== -1) {
            return "SP-RES-2026-" + seq3;
        }
        if (labelText.indexOf("office address") !== -1) {
            return "Magsaysay Ave., " + DEFAULT_CITY;
        }
        if (labelText.indexOf("toda id") !== -1) {
            return "TODA-" + seq3;
        }
        if (labelText.indexOf("toda name") !== -1) {
            return TODA_NAMES[todaIdx] + " " + seq3;
        }
        if (labelText.indexOf("sec reg") !== -1) {
            return "SEC-CN2026" + seq4;
        }
        if (labelText.indexOf("terminal") !== -1) {
            return TERMINALS[termIdx];
        }
        if (labelText.indexOf("route") !== -1) {
            return ROUTES[routeIdx];
        }
        if (labelText.indexOf("assignment id") !== -1) {
            return "ASN-" + seq3;
        }
        if (labelText.indexOf("term id") !== -1) {
            return "TERM-" + seq3;
        }
        if (labelText.indexOf("tricycle id") !== -1) {
            return "TRI-" + seq3;
        }
        if (labelText.indexOf("secretary") !== -1 && labelText.indexOf("id") !== -1) {
            return "MEM-" + seq3;
        }
        if (labelText.indexOf("member id") !== -1 || labelText.indexOf("id number") !== -1 || labelText === "id") {
            return "MEM-" + seq3;
        }
        if (labelText.indexOf("first name") !== -1) {
            return FIRST_NAMES[firstIdx];
        }
        if (labelText.indexOf("last name") !== -1) {
            return LAST_NAMES[lastIdx];
        }
        if (labelText.indexOf("street") !== -1) {
            return STREETS[streetIdx];
        }
        if (labelText.indexOf("barangay") !== -1) {
            return BARANGAYS[brgyIdx];
        }
        if (labelText.indexOf("city") !== -1 || labelText.indexOf("municipality") !== -1) {
            return DEFAULT_CITY;
        }
        if (labelText.indexOf("phone") !== -1 || labelText.indexOf("contact") !== -1) {
            const tail = padNumber(seq, 7);
            return "0917" + tail;
        }
        if (labelText.indexOf("restriction") !== -1) {
            return "1";
        }
        if (labelText.indexOf("pso") !== -1) {
            return "PSO-2026-" + seq3;
        }
        if (labelText.indexOf("bls") !== -1) {
            return "BLS-2026-" + seq3;
        }
        if (labelText.indexOf("license") !== -1) {
            return "E01-26-00" + seq4;
        }
        if (labelText.indexOf("body") !== -1) {
            const val = seq4;
            if (maxLen > 0 && maxLen < val.length) {
                return val.slice(0, maxLen);
            }
            return val;
        }
        if (labelText.indexOf("plate") !== -1) {
            return "EAB-" + seq4;
        }
        if (labelText.indexOf("chassis") !== -1) {
            return "CHS-TMX-" + seq4;
        }
        if (labelText.indexOf("franchise") !== -1) {
            return "FRAN-2026-" + seq4;
        }
        if (labelText.indexOf("shift") !== -1) {
            return SHIFTS[shiftIdx];
        }
        if (placeholderText.indexOf("yyyy-mm-dd") !== -1) {
            return DEFAULT_EXPIRY_DATE;
        }
        return "Sample " + seq3;
    }

    // params: controlEl (required)
    function dispatchControlEvents(controlEl) {
        const inputEvt = new Event("input", { bubbles: true });
        const changeEvt = new Event("change", { bubbles: true });
        controlEl.dispatchEvent(inputEvt);
        controlEl.dispatchEvent(changeEvt);
    }

    // params: selectEl (required), labelText (required)
    function pickSelectOption(selectEl, labelText) {
        const optCount = selectEl.options.length;
        if (optCount === 0) {
            return false;
        }
        if (labelText.indexOf("license type") !== -1) {
            for (let j = 0; j < optCount; j += 1) {
                if (selectEl.options[j].value === "Professional") {
                    selectEl.selectedIndex = j;
                    return true;
                }
            }
        }
        if (selectEl.value === "" && optCount > 1) {
            selectEl.selectedIndex = 1;
            return true;
        }
        if (selectEl.selectedIndex < 0) {
            selectEl.selectedIndex = 0;
            return true;
        }
        return false;
    }

    // params: none
    function getActiveFormRoot() {
        const openSheets = document.querySelectorAll(".sheet-backdrop:not(.hidden)");
        const sheetCount = openSheets.length;
        if (sheetCount > 0) {
            return openSheets[sheetCount - 1];
        }
        const appRoot = document.getElementById("app");
        return appRoot;
    }

    // params: none
    function fillVisibleForm() {
        const targetRoot = getActiveFormRoot();
        if (!targetRoot) {
            return;
        }

        const rows = targetRoot.querySelectorAll("[data-tr-field]");
        const rowCount = rows.length;
        let filledAny = false;

        for (let i = 0; i < rowCount; i += 1) {
            const row = rows[i];
            const labelNode = row.querySelector("label");
            let labelText = "";
            if (labelNode && labelNode.textContent) {
                labelText = labelNode.textContent.trim();
                labelText = labelText.toLowerCase();
            }

            const inputEl = row.querySelector("input");
            if (inputEl && !inputEl.readOnly && !inputEl.disabled) {
                const isExistingOwnerField = labelText.indexOf("owner member id") !== -1 && inputEl.value.trim() !== "";
                if (!isExistingOwnerField) {
                    let placeholderText = "";
                    if (inputEl.placeholder) {
                        placeholderText = inputEl.placeholder.trim();
                        placeholderText = placeholderText.toLowerCase();
                    }
                    let maxLen = 0;
                    if (inputEl.maxLength > 0) {
                        maxLen = inputEl.maxLength;
                    }
                    const nextValue = buildUniqueValue(labelText, placeholderText, maxLen);
                    inputEl.value = nextValue;
                    dispatchControlEvents(inputEl);
                    filledAny = true;
                }
            }

            const selectEl = row.querySelector("select");
            if (selectEl && !selectEl.disabled) {
                const changed = pickSelectOption(selectEl, labelText);
                if (changed) {
                    dispatchControlEvents(selectEl);
                    filledAny = true;
                }
            }
        }

        if (filledAny) {
            advancePool();
        }
    }

    // params: none
    function hasEditableFields() {
        const targetRoot = getActiveFormRoot();
        if (!targetRoot) {
            return false;
        }

        const controls = targetRoot.querySelectorAll("[data-tr-field] input, [data-tr-field] select");
        const controlCount = controls.length;
        for (let i = 0; i < controlCount; i += 1) {
            const el = controls[i];
            if (!el.readOnly && !el.disabled) {
                return true;
            }
        }
        return false;
    }

    // params: none
    function createHelperButton() {
        if (typeof trButton === "function") {
            const btn = trButton({
                label: "Autofill",
                small: true,
                onClick: fillVisibleForm
            });
            return btn;
        }

        const fallbackBtn = document.createElement("button");
        fallbackBtn.type = "button";
        fallbackBtn.className = "as-standard thickness-m border-l";
        fallbackBtn.textContent = "Autofill";
        fallbackBtn.addEventListener("click", fillVisibleForm);
        return fallbackBtn;
    }

    // params: none
    function ensureHelperWidget() {
        let wrap = document.getElementById(HELPER_WRAP_ID);
        if (!wrap) {
            wrap = document.createElement("div");
            wrap.id = HELPER_WRAP_ID;
            wrap.style.position = "fixed";
            wrap.style.right = "var(--tr-space-l, 16px)";
            wrap.style.bottom = "var(--tr-space-l, 16px)";
            wrap.style.zIndex = "9999";
            wrap.style.display = "none";
            wrap.style.borderRadius = "999px";
            wrap.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.45)";

            const btn = createHelperButton();
            wrap.appendChild(btn);
            document.body.appendChild(wrap);
        }

        const showWidget = hasEditableFields();
        if (showWidget) {
            wrap.style.display = "block";
        } else {
            wrap.style.display = "none";
        }
    }

    // params: none
    function startAutofillObserver() {
        ensureHelperWidget();
        const bodyNode = document.body;
        if (!bodyNode || typeof MutationObserver !== "function") {
            return;
        }

        const observer = new MutationObserver(function () {
            ensureHelperWidget();
        });
        observer.observe(bodyNode, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class"]
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startAutofillObserver);
    } else {
        startAutofillObserver();
    }
})();
