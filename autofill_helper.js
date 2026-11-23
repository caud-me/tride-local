(function () {
    "use strict";

    // top-of-file config and sample pools
    const HELPER_WRAP_ID = "tr-dev-autofill-wrap";
    const SEQ_MIN = 1000;
    const SEQ_MAX = 9999;
    const BODY_NUMBER_MAX_LEN = 4;

    const FIRST_NAMES = [
        "Juan", "Maria", "Pedro", "Ana", "Jose", "Rosa", "Carlos", "Elena",
        "Miguel", "Sofia", "Mateo", "Lucia", "Diego", "Clara", "Rafael", "Teresa"
    ];
    const LAST_NAMES = [
        "Dela Cruz", "Santos", "Reyes", "Garcia", "Ramos", "Mendoza", "Torres", "Flores",
        "Rivera", "Gomez", "Navarro", "Castillo", "Morales", "Aquino", "Villanueva", "Bautista"
    ];
    const BARANGAYS = [
        "Barangay Uno", "Barangay Dos", "Barangay Tres", "Poblacion",
        "San Isidro", "Mabolo", "Tinago", "Concepcion",
        "Triangulo", "Sabang", "Bagumbayan", "Dayangdang"
    ];
    const CITIES = ["Sample City", "Naga City", "Metro Town", "Centro", "San Jose", "Del Rosario"];
    const TODA_NAMES = [
        "Mabolo TODA", "Tinago TODA", "Centro TODA", "San Isidro TODA",
        "Concepcion TODA", "Triangulo TODA", "Sabang TODA", "Bagumbayan TODA",
        "Dayangdang TODA", "Poblacion TODA", "Uno TODA", "Dos TODA"
    ];
    const ROUTES = [
        "Mabolo - Centro", "Tinago - Market", "Poblacion Loop", "San Isidro - Terminal",
        "Concepcion - Centro", "Triangulo - Plaza", "Sabang - Market", "Bagumbayan - Hub",
        "Dayangdang - Centro", "Uno - Terminal", "Dos - Market", "Centro - Diversion"
    ];

    const span = SEQ_MAX - SEQ_MIN + 1;
    let seqCounter = Math.floor(Math.random() * span) + SEQ_MIN;
    let poolIndex = Math.floor(Math.random() * FIRST_NAMES.length);

    function padNumber(num, size) {
        let text = String(num);
        while (text.length < size) {
            text = "0" + text;
        }
        return text;
    }

    function nextSequence() {
        const current = seqCounter;
        seqCounter = seqCounter + 1;
        if (seqCounter > SEQ_MAX) {
            seqCounter = SEQ_MIN;
        }
        return current;
    }

    function nextPoolIndex(list) {
        const count = list.length;
        const idx = poolIndex % count;
        return idx;
    }

    function advancePool() {
        poolIndex = poolIndex + 1;
    }

    function buildUniqueValue(labelText, placeholderText, maxLen) {
        const seq = nextSequence();
        const seqPadded = padNumber(seq, 4);
        const shortSeq = padNumber(seq % 10000, BODY_NUMBER_MAX_LEN);
        const firstIdx = nextPoolIndex(FIRST_NAMES);
        const lastIdx = nextPoolIndex(LAST_NAMES);
        const brgyIdx = nextPoolIndex(BARANGAYS);
        const cityIdx = nextPoolIndex(CITIES);
        const todaIdx = nextPoolIndex(TODA_NAMES);
        const routeIdx = nextPoolIndex(ROUTES);

        if (labelText.indexOf("federation id") !== -1) {
            return "FED-" + seq;
        }
        if (labelText.indexOf("federation") !== -1) {
            return "Sample Tricycle Federation";
        }
        if (labelText.indexOf("secretary") !== -1 && labelText.indexOf("id") !== -1) {
            return "SEC-" + seq;
        }
        if (labelText.indexOf("toda id") !== -1) {
            return "T" + seq;
        }
        if (labelText.indexOf("toda name") !== -1) {
            return TODA_NAMES[todaIdx] + " " + seq;
        }
        if (labelText.indexOf("route") !== -1) {
            return ROUTES[routeIdx];
        }
        if (labelText.indexOf("id number") !== -1 || labelText.indexOf("member id") !== -1 || labelText === "id") {
            return "M" + seq;
        }
        if (labelText.indexOf("first name") !== -1) {
            return FIRST_NAMES[firstIdx];
        }
        if (labelText.indexOf("last name") !== -1) {
            return LAST_NAMES[lastIdx];
        }
        if (labelText.indexOf("address") !== -1) {
            const brgy = BARANGAYS[brgyIdx];
            const city = CITIES[cityIdx];
            return brgy + ", " + city;
        }
        if (labelText.indexOf("phone") !== -1 || labelText.indexOf("contact") !== -1) {
            const tail = padNumber(seq, 7);
            return "0917" + tail;
        }
        if (labelText.indexOf("license") !== -1) {
            const randPart = Math.floor(Math.random() * 90) + 10;
            const suffix = padNumber(seq, 4);
            return "N01-26-" + randPart + suffix;
        }
        if (labelText.indexOf("body") !== -1) {
            if (maxLen > 0 && maxLen < shortSeq.length) {
                return shortSeq.slice(0, maxLen);
            }
            return shortSeq;
        }
        if (labelText.indexOf("chassis") !== -1) {
            return "CH" + seqPadded;
        }
        if (labelText.indexOf("franchise") !== -1) {
            return "FR2026" + padNumber(seq, 2);
        }

        if (placeholderText.indexOf("m1") !== -1) {
            return "M" + seq;
        }
        return "Sample " + seq;
    }

    function dispatchControlEvents(controlEl) {
        const inputEvt = new Event("input", { bubbles: true });
        const changeEvt = new Event("change", { bubbles: true });
        controlEl.dispatchEvent(inputEvt);
        controlEl.dispatchEvent(changeEvt);
    }

    function fillVisibleForm() {
        const appRoot = document.getElementById("app");
        if (!appRoot) {
            return;
        }

        const rows = appRoot.querySelectorAll("[data-tr-field]");
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
                let placeholderText = "";
                if (inputEl.placeholder) {
                    placeholderText = inputEl.placeholder.trim();
                    placeholderText = placeholderText.toLowerCase();
                }
                const maxLen = inputEl.maxLength > 0 ? inputEl.maxLength : 0;
                const nextValue = buildUniqueValue(labelText, placeholderText, maxLen);
                inputEl.value = nextValue;
                dispatchControlEvents(inputEl);
                filledAny = true;
            }

            const selectEl = row.querySelector("select");
            if (selectEl && !selectEl.disabled) {
                const optionCount = selectEl.options.length;
                if (optionCount > 0 && selectEl.selectedIndex < 0) {
                    selectEl.selectedIndex = 0;
                    dispatchControlEvents(selectEl);
                    filledAny = true;
                }
            }
        }

        if (filledAny) {
            advancePool();
        }
    }

    function hasEditableFields() {
        const appRoot = document.getElementById("app");
        if (!appRoot) {
            return false;
        }

        const inputs = appRoot.querySelectorAll("[data-tr-field] input");
        const inputCount = inputs.length;
        for (let i = 0; i < inputCount; i += 1) {
            const inputEl = inputs[i];
            if (!inputEl.readOnly && !inputEl.disabled) {
                return true;
            }
        }
        return false;
    }

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

    function startAutofillObserver() {
        ensureHelperWidget();
        const appRoot = document.getElementById("app");
        if (!appRoot || typeof MutationObserver !== "function") {
            return;
        }

        const observer = new MutationObserver(function () {
            ensureHelperWidget();
        });
        observer.observe(appRoot, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startAutofillObserver);
    } else {
        startAutofillObserver();
    }
})();
