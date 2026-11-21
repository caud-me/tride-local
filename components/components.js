/* tride reusable ui components (vanilla dom factories) */

function trEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined && text !== null) {
        node.textContent = String(text);
    }
    return node;
}

function trAppend(parent, children) {
    if (!children) {
        return;
    }
    const list = Array.isArray(children) ? children : [children];
    for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (!item) {
            continue;
        }
        if (Array.isArray(item)) {
            trAppend(parent, item);
        } else if (typeof item === "string") {
            const p = trEl("p", "", item);
            parent.appendChild(p);
        } else {
            parent.appendChild(item);
        }
    }
}

function trBindTap(node, handler) {
    if (!node || !handler) {
        return;
    }
    node.classList.add("clickable");
    node.setAttribute("role", "button");
    node.setAttribute("tabindex", "0");
    node.addEventListener("click", handler);

    // ive looked up on the internet on this one, keydown check let keyboard users press Enter or Space on role button elements
    function onKeyDown(event) {
        const key = event.key;
        if (key === "Enter" || key === " ") {
            event.preventDefault();
            handler(event);
        }
    }

    node.addEventListener("keydown", onKeyDown);
}

function trIcon(glyph, options) {
    const opts = options || {};
    let cls = "icon";
    if (opts.size === "big") {
        cls = cls + " as-big";
    }
    if (opts.className) {
        cls = cls + " " + opts.className;
    }
    const icon = trEl("i", cls);
    icon.textContent = glyph;
    if (opts.label) {
        icon.setAttribute("aria-label", opts.label);
    } else {
        icon.setAttribute("aria-hidden", "true");
    }
    if (opts.onClick) {
        trBindTap(icon, opts.onClick);
    }
    return icon;
}

function trSpacer() {
    const div = trEl("div", "spacer");
    div.setAttribute("role", "separator");
    return div;
}

function trSectionHeading(text) {
    const heading = trEl("small", "section-heading", text);
    heading.setAttribute("role", "heading");
    heading.setAttribute("aria-level", "2");
    return heading;
}

function trCard(children, options) {
    const opts = options || {};
    const base = opts.layout ? "card " + opts.layout : "card vbox gap-s";
    const cls = opts.className ? base + " " + opts.className : base;
    const tag = opts.tag || "div";
    const card = trEl(tag, cls);
    if (opts.onClick) {
        trBindTap(card, opts.onClick);
    }
    trAppend(card, children);
    return card;
}

function trListCard(items) {
    const raw = items || [];
    const spaced = [];
    for (let i = 0; i < raw.length; i += 1) {
        const entry = raw[i];
        if (!entry) {
            continue;
        }
        if (spaced.length > 0) {
            spaced.push(trSpacer());
        }
        spaced.push(entry);
    }
    const card = trCard(spaced);
    return card;
}

function trListItem(options) {
    const opts = options || {};
    const item = trEl("div", "list-item");
    if (opts.title) {
        item.appendChild(trEl("p", "", opts.title));
    }
    const rawSubs = opts.subtitles || opts.subtitle;
    const subs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
    for (let i = 0; i < subs.length; i += 1) {
        if (subs[i]) {
            item.appendChild(trEl("small", "", subs[i]));
        }
    }
    return item;
}

function trAlphaList(options) {
    const opts = options || {};
    const items = opts.items || [];
    const getLabel = opts.getLabel || function (item) {
        return String(item || "");
    };
    const renderRow = opts.renderRow || function (item) {
        return trActionRow({ label: getLabel(item) });
    };

    const groups = {};
    const letters = [];

    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const rawLabel = String(getLabel(item) || "").trim();
        const firstChar = rawLabel ? rawLabel.charAt(0).toUpperCase() : "#";
        const isLetter = firstChar >= "A" && firstChar <= "Z";
        const key = isLetter ? firstChar : "#";
        if (!groups[key]) {
            groups[key] = [];
            letters.push(key);
        }
        groups[key].push(renderRow(item));
    }

    letters.sort();

    const wrap = trEl("div", "vbox gap-m card-grid");
    for (let i = 0; i < letters.length; i += 1) {
        const letterKey = letters[i];
        const groupBox = trEl("div", "vbox gap-m");
        groupBox.appendChild(trSectionHeading(letterKey));
        groupBox.appendChild(trListCard(groups[letterKey]));
        wrap.appendChild(groupBox);
    }
    return wrap;
}

function trBanner(text) {
    const banner = trEl("div", "banner");
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    const msg = trEl("small", "", text);
    banner.appendChild(msg);
    return banner;
}

function trStoryBar(options) {
    const opts = options || {};
    const total = opts.total || 1;
    const current = opts.current || 1;
    const bar = trEl("div", "story-bar");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "1");
    bar.setAttribute("aria-valuemax", String(total));
    bar.setAttribute("aria-valuenow", String(current));

    for (let i = 1; i <= total; i += 1) {
        const cls = i <= current ? "story-segment active" : "story-segment";
        bar.appendChild(trEl("div", cls));
    }
    return bar;
}

function trCheckRow(options) {
    const opts = options || {};
    const row = trEl("label", "check-row hbox gap-m align-center clickable");

    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = Boolean(opts.checked);
    box.addEventListener("change", function () {
        if (opts.onChange) {
            opts.onChange(box.checked);
        }
    });

    const textWrap = trEl("div", "vbox flex1");
    textWrap.appendChild(trEl("p", "", opts.title || ""));
    if (opts.subtitle) {
        textWrap.appendChild(trEl("small", "", opts.subtitle));
    }

    const checkIcon = trIcon("\uE73E", { className: "check" });

    row.appendChild(box);
    row.appendChild(textWrap);
    row.appendChild(checkIcon);
    return row;
}

function trEmptyState(options) {
    const opts = options || {};
    const wrap = trEl("div", "empty-state vbox center gap-s");
    wrap.setAttribute("role", "status");

    const icon = trIcon(opts.icon || "\uE8F1", { size: "big" });
    wrap.appendChild(icon);

    if (opts.title) {
        wrap.appendChild(trEl("p", "bold", opts.title));
    }
    if (opts.subtitle) {
        wrap.appendChild(trEl("small", "", opts.subtitle));
    }
    if (opts.action) {
        wrap.appendChild(opts.action);
    }
    return wrap;
}

function trButton(options) {
    const opts = options || {};
    let cls = opts.variant === "primary" ? "button-primary" : "button-regular";
    if (opts.small) {
        cls = cls + " small";
    }
    if (opts.critical) {
        cls = cls + " critical";
    }
    if (opts.disabled) {
        cls = cls + " disabled";
    }
    const btn = trEl("button", cls, opts.label || "");
    btn.type = "button";
    if (opts.disabled) {
        btn.disabled = true;
    }
    if (opts.onClick) {
        btn.addEventListener("click", opts.onClick);
    }
    return btn;
}

function trNavBar(options) {
    const opts = options || {};
    const header = trEl("header", "navigation-bar hbox gap-m align-center");
    if (opts.onBack) {
        const backIcon = trIcon("\uE72B", { label: "Back", onClick: opts.onBack });
        header.appendChild(backIcon);
    }
    if (opts.titleNode) {
        opts.titleNode.classList.add("flex1");
        header.appendChild(opts.titleNode);
    } else {
        const title = trEl("h1", "flex1", opts.title || "");
        header.appendChild(title);
    }
    if (opts.actions) {
        trAppend(header, opts.actions);
    }
    return header;
}

function trMenu(options) {
    const opts = options || {};
    const anchor = trEl("div", "menu-anchor");
    const panel = trEl("div", "menu card vbox gap-l scroll hidden");
    panel.setAttribute("role", "menu");

    const trigger = trIcon(opts.icon || "\uE71C", {
        label: opts.label || "Menu",
        onClick: function (event) {
            event.stopPropagation();
            const isHidden = panel.classList.contains("hidden");
            if (isHidden) {
                panel.classList.remove("hidden");
                trigger.setAttribute("aria-expanded", "true");
            } else {
                panel.classList.add("hidden");
                trigger.setAttribute("aria-expanded", "false");
            }
        }
    });
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");

    const sections = opts.sections || [];
    for (let s = 0; s < sections.length; s += 1) {
        const section = sections[s];
        const groupWrap = trEl("div", "vbox gap-m");
        if (section.title) {
            const groupTitle = trEl("small", "", section.title);
            groupWrap.appendChild(groupTitle);
        }
        const itemsWrap = trEl("div", "vbox gap-xs");
        const items = section.items || [];
        for (let i = 0; i < items.length; i += 1) {
            if (i > 0) {
                itemsWrap.appendChild(trSpacer());
            }
            const item = items[i];
            const rowCls = item.disabled ? "menu-item hbox gap-m align-center disabled" : "menu-item hbox gap-m align-center";
            const row = trEl("label", rowCls);
            row.setAttribute("role", "menuitemradio");
            row.setAttribute("aria-checked", item.checked ? "true" : "false");
            if (item.disabled) {
                row.setAttribute("aria-disabled", "true");
            }

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = section.name || "menu-group";
            radio.value = item.value;
            if (item.disabled) {
                radio.disabled = true;
            }
            if (item.checked) {
                radio.checked = true;
            }
            radio.addEventListener("change", function () {
                const allRows = itemsWrap.querySelectorAll(".menu-item");
                for (let r = 0; r < allRows.length; r += 1) {
                    allRows[r].setAttribute("aria-checked", "false");
                }
                row.setAttribute("aria-checked", "true");
                if (section.onChange) {
                    section.onChange(item.value);
                }
                panel.classList.add("hidden");
                trigger.setAttribute("aria-expanded", "false");
            });

            const text = trEl("p", "flex1", item.label);
            const check = trIcon("\uE73E", { className: "check" });

            row.appendChild(radio);
            row.appendChild(text);
            row.appendChild(check);
            itemsWrap.appendChild(row);
        }
        groupWrap.appendChild(itemsWrap);
        panel.appendChild(groupWrap);
    }

    document.addEventListener("click", function (event) {
        if (!anchor.contains(event.target)) {
            panel.classList.add("hidden");
            trigger.setAttribute("aria-expanded", "false");
        }
    });

    anchor.appendChild(trigger);
    anchor.appendChild(panel);
    return anchor;
}

function trProfileCard(data) {
    const d = data || {};
    const section = trEl("section", "card grid2 grid2-right gap-m");
    section.setAttribute("aria-label", "Member profile");

    const nameBox = trEl("div", "vbox");
    nameBox.appendChild(trEl("small", "", "Hey,"));
    const fullName = [d.firstName || "", d.lastName || ""].join(" ").trim();
    nameBox.appendChild(trEl("p", "", fullName || "Member"));

    const avatar = trEl("div", "avatar-lg");
    avatar.setAttribute("aria-hidden", "true");

    const leftMeta = trEl("div", "vbox");
    leftMeta.appendChild(trEl("small", "", d.address || "No address"));
    leftMeta.appendChild(trEl("small", "", d.contact || "No contact"));

    const rightMeta = trEl("div", "vbox");
    rightMeta.appendChild(trEl("small", "", d.todaName || "No TODA"));
    rightMeta.appendChild(trEl("small", "", d.license || "No license"));

    section.appendChild(nameBox);
    section.appendChild(avatar);
    section.appendChild(leftMeta);
    section.appendChild(rightMeta);
    return section;
}

function trPropertyRow(options) {
    const opts = options || {};
    const row = trEl("div", "property-row");
    const fieldId = opts.id || "tr-field-" + Math.random().toString(36).slice(2, 8);

    const labelEl = trEl("label");
    labelEl.setAttribute("for", fieldId);
    labelEl.appendChild(trEl("small", "", opts.label || ""));
    row.appendChild(labelEl);

    let controlEl = null;

    if (opts.select) {
        const wrap = trEl("div", "hbox align-center");
        const selectEl = trEl("select", "flex1");
        selectEl.id = fieldId;
        const choices = opts.select.options || [];
        for (let i = 0; i < choices.length; i += 1) {
            const optData = choices[i];
            if (optData.options) {
                const groupEl = document.createElement("optgroup");
                groupEl.label = optData.label || "";
                const subOpts = optData.options;
                for (let j = 0; j < subOpts.length; j += 1) {
                    const sub = subOpts[j];
                    const subEl = document.createElement("option");
                    subEl.value = sub.value;
                    subEl.textContent = sub.label;
                    if (opts.select.value !== undefined && sub.value === opts.select.value) {
                        subEl.selected = true;
                    }
                    groupEl.appendChild(subEl);
                }
                selectEl.appendChild(groupEl);
            } else {
                const optEl = document.createElement("option");
                optEl.value = optData.value;
                optEl.textContent = optData.label;
                if (opts.select.value !== undefined && optData.value === opts.select.value) {
                    optEl.selected = true;
                }
                selectEl.appendChild(optEl);
            }
        }
        if (opts.select.onChange) {
            selectEl.addEventListener("change", function () {
                opts.select.onChange(selectEl.value);
            });
        }
        wrap.appendChild(selectEl);
        wrap.appendChild(trIcon("\uE70D", { className: "as-gray" }));
        row.appendChild(wrap);
        controlEl = selectEl;
    } else if (opts.input) {
        const inputEl = document.createElement("input");
        inputEl.id = fieldId;
        inputEl.type = opts.input.type || "text";
        if (opts.input.placeholder) {
            inputEl.placeholder = opts.input.placeholder;
        }
        if (opts.input.value !== undefined && opts.input.value !== null) {
            inputEl.value = String(opts.input.value);
        }
        if (opts.input.readOnly) {
            inputEl.readOnly = true;
        }
        if (opts.input.onInput) {
            inputEl.addEventListener("input", function () {
                opts.input.onInput(inputEl.value);
            });
        }
        row.appendChild(inputEl);
        controlEl = inputEl;
    } else {
        row.appendChild(trEl("p", "", opts.value || ""));
    }

    const errorEl = trEl("small", "critical hidden");
    errorEl.id = fieldId + "-err";
    errorEl.setAttribute("role", "alert");
    row.appendChild(errorEl);

    row.setError = function (msg) {
        if (msg) {
            errorEl.textContent = msg;
            errorEl.classList.remove("hidden");
            if (controlEl) {
                controlEl.setAttribute("aria-invalid", "true");
                controlEl.setAttribute("aria-describedby", errorEl.id);
            }
        } else {
            errorEl.textContent = "";
            errorEl.classList.add("hidden");
            if (controlEl) {
                controlEl.removeAttribute("aria-invalid");
                controlEl.removeAttribute("aria-describedby");
            }
        }
    };

    if (opts.error) {
        row.setError(opts.error);
    }

    row.controlEl = controlEl;
    return row;
}

function trActionRow(options) {
    const opts = options || {};
    const row = trEl("div", "action-row");
    let labelCls = "flex1";
    if (opts.critical) {
        labelCls = labelCls + " critical";
    }
    if (opts.disabled) {
        labelCls = labelCls + " disabled";
    }
    const label = trEl("p", labelCls, opts.label || "");
    row.appendChild(label);

    if (!opts.hideChevron) {
        row.appendChild(trIcon("\uE76C"));
    }

    if (opts.onClick && !opts.disabled) {
        trBindTap(row, opts.onClick);
    } else if (opts.disabled) {
        row.setAttribute("aria-disabled", "true");
    }
    return row;
}

function trEntityRow(options) {
    const opts = options || {};
    const left = trEl("div", "vbox gap-xs");
    if (opts.image) {
        const imgSrc = typeof opts.image === "string" ? opts.image : opts.image.src;
        const imgAlt = typeof opts.image === "string" ? "" : (opts.image.alt || "");
        const titleWrap = trEl("div", "hbox gap-s align-center");
        titleWrap.appendChild(trEl("p", "as-big bold", opts.title || ""));
        const imgEl = document.createElement("img");
        imgEl.src = imgSrc;
        imgEl.alt = imgAlt;
        imgEl.className = "entity-title-img";
        titleWrap.appendChild(imgEl);
        left.appendChild(titleWrap);
    } else {
        left.appendChild(trEl("p", "as-big bold", opts.title || ""));
    }
    if (opts.subtitle) {
        left.appendChild(trEl("small", "", opts.subtitle));
    }

    const right = trEl("div", "vbox gap-xs right");
    const meta = opts.metaLines || [];
    for (let i = 0; i < meta.length; i += 1) {
        const line = meta[i];
        const cls = opts.mutedLast && i === meta.length - 1 ? "as-gray" : "";
        right.appendChild(trEl("small", cls, line));
    }

    return trCard([left, right], {
        layout: "entity-row",
        onClick: opts.onClick
    });
}

function trStatGroup(stats) {
    const group = trEl("div", "stat-group");
    const list = stats || [];
    for (let i = 0; i < list.length; i += 1) {
        const stat = list[i];
        const cell = trEl("div", "stat-cell");
        cell.appendChild(trEl("p", "as-big bold", stat.value));
        cell.appendChild(trEl("p", "as-small", stat.label));
        group.appendChild(cell);
    }
    return group;
}

function trTabs(options) {
    const opts = options || {};
    const barCls = opts.equal ? "tabbed hbox gap-m" : "tabbed hbox gap-m scroll";
    const bar = trEl("div", barCls);
    bar.setAttribute("role", "tablist");
    const items = opts.items || [];

    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const isActive = item.key === opts.activeKey;
        let btnCls = isActive ? "tab-button active" : "tab-button";
        if (opts.equal) {
            btnCls = btnCls + " flex1";
        }
        const btn = trEl("button", btnCls, item.label);
        btn.type = "button";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", isActive ? "true" : "false");

        btn.addEventListener("click", function () {
            const buttons = bar.querySelectorAll(".tab-button");
            for (let b = 0; b < buttons.length; b += 1) {
                buttons[b].classList.remove("active");
                buttons[b].setAttribute("aria-selected", "false");
            }
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");
            if (opts.onChange) {
                opts.onChange(item.key);
            }
        });
        bar.appendChild(btn);
    }
    return bar;
}

function trSearchBox(options) {
    const opts = options || {};
    const box = trEl("div", "searchbox hbox gap-s align-center");
    box.setAttribute("role", "search");

    box.appendChild(trIcon("\uE721", { className: "as-gray" }));

    const input = document.createElement("input");
    input.type = "search";
    input.className = "flex1";
    input.placeholder = opts.placeholder || "Search...";
    input.setAttribute("aria-label", input.placeholder);
    if (opts.value) {
        input.value = opts.value;
    }
    if (opts.onInput) {
        input.addEventListener("input", function () {
            opts.onInput(input.value);
        });
    }
    box.appendChild(input);
    return box;
}

function trBrandLogo(options) {
    const isString = typeof options === "string";
    const opts = isString ? { text: options } : (options || {});
    const text = opts.text || "TRIDE";
    const subtext = opts.subtext || "";

    if (!subtext) {
        const cls = opts.className ? "brand-logo " + opts.className : "brand-logo";
        return trEl("p", cls, text);
    }

    const wrapCls = opts.className ? "brand-logo-wrap " + opts.className : "brand-logo-wrap";
    const wrap = trEl("div", wrapCls);
    wrap.appendChild(trEl("p", "brand-logo", text));
    wrap.appendChild(trEl("span", "brand-logo-sub", subtext));
    return wrap;
}

function appendBrandSlot(target, value) {
    if (typeof value === "string") {
        target.appendChild(trEl("small", "", value));
        return;
    }
    if (value) {
        target.appendChild(value);
    }
}

function trBrandCard(options) {
    const opts = options || {};
    const topLeft = trBrandLogo({
        text: opts.logoText || "TRIDE",
        subtext: opts.subtext || "",
        className: "brand-card-tl"
    });

    const children = [topLeft];

    if (opts.topRight) {
        const topRight = trEl("div", "brand-card-tr");
        appendBrandSlot(topRight, opts.topRight);
        children.push(topRight);
    }

    const bottomLeft = trEl("div", "vbox gap-xs brand-card-bl");
    const isBig = opts.big !== false;
    const titleClass = isBig ? "as-big bold" : "bold";
    bottomLeft.appendChild(trEl("p", titleClass, opts.title || ""));
    if (opts.subtitle) {
        appendBrandSlot(bottomLeft, opts.subtitle);
    }
    children.push(bottomLeft);

    if (opts.bottomRight) {
        const bottomRight = trEl("div", "brand-card-br");
        appendBrandSlot(bottomRight, opts.bottomRight);
        children.push(bottomRight);
    }

    const card = trCard(children, {
        layout: "brand-card",
        className: opts.className,
        onClick: opts.onClick
    });
    return card;
}

function trCardStack(options) {
    const opts = options || {};
    if (!opts.heading) {
        throw new Error("trCardStack requires a heading.");
    }

    const cards = opts.cards || [];
    const wrap = trEl("div", "vbox gap-m");
    wrap.appendChild(trSectionHeading(opts.heading));

    const stack = trEl("div", "card-stack");
    if (cards.length > 1) {
        stack.classList.add("collapsed");
    }

    for (let i = 0; i < cards.length; i += 1) {
        const card = cards[i];
        card.style.zIndex = String(cards.length - i);
        stack.appendChild(card);
    }

    if (cards.length > 1) {
        function expandOnFirstTap(event) {
            if (!stack.classList.contains("collapsed")) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            stack.classList.remove("collapsed");
        }

        stack.addEventListener("click", expandOnFirstTap, true);
        stack.addEventListener("keydown", function (event) {
            if (!stack.classList.contains("collapsed")) {
                return;
            }
            if (event.key === "Enter" || event.key === " ") {
                expandOnFirstTap(event);
            }
        }, true);
    }

    wrap.appendChild(stack);
    return wrap;
}

function trHero(options) {
    const opts = options || {};
    const box = trEl("div", "vbox center gap-s");
    box.appendChild(trBrandLogo({ text: opts.logoText || "TRIDE" }));
    box.appendChild(trEl("p", "hero-title", opts.title || ""));
    return box;
}

function trSheet(options) {
    const opts = options || {};
    const backdrop = trEl("div", "sheet-backdrop hidden");
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    const sheet = trEl("div", "sheet vbox gap-m");

    const header = trEl("div", "sheet-header vbox gap-s");
    const handle = trEl("div", "sheet-handle");
    handle.setAttribute("aria-hidden", "true");
    header.appendChild(handle);

    if (opts.title) {
        const titleEl = trEl("p", "bold", opts.title);
        titleEl.id = "tr-sheet-" + Math.random().toString(36).slice(2, 8);
        backdrop.setAttribute("aria-labelledby", titleEl.id);
        header.appendChild(titleEl);
    }

    if (opts.description) {
        header.appendChild(trEl("small", "as-gray", opts.description));
    }

    if (opts.headerExtra) {
        trAppend(header, opts.headerExtra);
    }
    sheet.appendChild(header);

    const hasStructuredSlots = Boolean(opts.body || opts.footer);
    if (hasStructuredSlots) {
        if (opts.body) {
            const bodyWrap = trEl("div", "sheet-body vbox gap-s");
            trAppend(bodyWrap, opts.body);
            sheet.appendChild(bodyWrap);
        }
        if (opts.footer) {
            const footerWrap = trEl("div", "sheet-footer vbox gap-s");
            trAppend(footerWrap, opts.footer);
            sheet.appendChild(footerWrap);
        }
    } else if (opts.children) {
        const bodyWrap = trEl("div", "sheet-body vbox gap-s");
        trAppend(bodyWrap, opts.children);
        sheet.appendChild(bodyWrap);
    }

    backdrop.appendChild(sheet);

    function close() {
        backdrop.classList.add("hidden");
        if (opts.removeOnClose) {
            // ive looked up on the internet on this one, setTimeout wait until the slide exit finish before removing the element
            setTimeout(function () {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 250);
        }
        if (opts.onClose) {
            opts.onClose();
        }
    }

    function open() {
        if (!backdrop.parentNode) {
            document.body.appendChild(backdrop);
        }
        requestAnimationFrame(function () {
            backdrop.classList.remove("hidden");
        });
    }

    backdrop.addEventListener("click", function (event) {
        if (event.target === backdrop) {
            close();
        }
    });

    return { el: backdrop, open: open, close: close };
}

function trConfirm(options) {
    const opts = options || {};
    let sheetCtrl = null;

    const actions = trEl("div", "vbox gap-s");
    const confirmBtn = trButton({
        label: opts.confirmLabel || "Confirm",
        critical: Boolean(opts.critical),
        onClick: function () {
            if (sheetCtrl) {
                sheetCtrl.close();
            }
            if (opts.onConfirm) {
                opts.onConfirm();
            }
        }
    });
    const cancelBtn = trButton({
        label: opts.cancelLabel || "Cancel",
        onClick: function () {
            if (sheetCtrl) {
                sheetCtrl.close();
            }
        }
    });

    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);

    sheetCtrl = trSheet({
        title: opts.title || "Confirm",
        description: opts.message || "",
        footer: actions,
        removeOnClose: true
    });
    sheetCtrl.open();
    return sheetCtrl;
}

function trAlert(options) {
    const opts = options || {};
    let sheetCtrl = null;

    const okBtn = trButton({
        label: opts.buttonLabel || "OK",
        onClick: function () {
            if (sheetCtrl) {
                sheetCtrl.close();
            }
            if (opts.onClose) {
                opts.onClose();
            }
        }
    });

    sheetCtrl = trSheet({
        title: opts.title || "Notice",
        description: opts.message || "",
        footer: okBtn,
        removeOnClose: true
    });
    sheetCtrl.open();
    return sheetCtrl;
}

function trCopyFormState(sourceRoot, cloneRoot) {
    const srcInputs = sourceRoot.querySelectorAll("input");
    const dstInputs = cloneRoot.querySelectorAll("input");
    const inputCount = srcInputs.length;
    for (let i = 0; i < inputCount; i += 1) {
        const srcIn = srcInputs[i];
        const dstIn = dstInputs[i];
        if (dstIn) {
            dstIn.setAttribute("value", srcIn.value);
        }
    }

    const srcSelects = sourceRoot.querySelectorAll("select");
    const dstSelects = cloneRoot.querySelectorAll("select");
    const selectCount = srcSelects.length;
    for (let i = 0; i < selectCount; i += 1) {
        const srcSel = srcSelects[i];
        const dstSel = dstSelects[i];
        if (!dstSel) {
            continue;
        }
        const selectedVal = srcSel.value;
        const dstOptions = dstSel.querySelectorAll("option");
        const optCount = dstOptions.length;
        for (let j = 0; j < optCount; j += 1) {
            const opt = dstOptions[j];
            if (opt.value === selectedVal) {
                opt.setAttribute("selected", "selected");
            } else {
                opt.removeAttribute("selected");
            }
        }
    }
}

function trSuccessWave(options) {
    const opts = options || {};
    const appEl = document.getElementById("app");
    if (!appEl) {
        if (opts.onDone) {
            opts.onDone();
        }
        return null;
    }

    const existingOverlay = document.querySelector(".distortion-wave.is-fullscreen");
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const appClone = appEl.cloneNode(true);
    appClone.removeAttribute("id");
    trCopyFormState(appEl, appClone);

    const fromStage = trEl("div", "fullscreen-backdrop");
    fromStage.appendChild(appClone);

    const stage = trEl("div", "fullscreen-stage vbox center gap-m");

    const headerWrap = trEl("div", "vbox center gap-s");
    const titleText = opts.title || "Saved";
    const titleEl = trEl("p", "hero-title", titleText);
    headerWrap.appendChild(titleEl);

    if (opts.subtitle) {
        const subEl = trEl("p", "as-small as-gray text-center", opts.subtitle);
        headerWrap.appendChild(subEl);
    }
    stage.appendChild(headerWrap);

    if (opts.card) {
        const cardWrap = trEl("div", "fullscreen-stage-card");
        cardWrap.appendChild(opts.card);
        stage.appendChild(cardWrap);
    }

    let waveCtrl = null;
    let isClosing = false;

    function finishTransition() {
        if (isClosing) {
            return;
        }
        isClosing = true;
        if (opts.onDone) {
            opts.onDone();
        }
        if (waveCtrl && waveCtrl.el) {
            const overlayEl = waveCtrl.el;
            overlayEl.classList.add("is-closing");
            setTimeout(function () {
                overlayEl.remove();
            }, 200);
        }
    }

    const btnLabel = opts.buttonLabel || "Continue";
    const continueBtn = trButton({
        label: btnLabel,
        variant: "primary",
        onClick: finishTransition
    });
    const actionWrap = trEl("div", "fullscreen-stage-actions");
    actionWrap.appendChild(continueBtn);
    stage.appendChild(actionWrap);

    const waveOpts = {
        children: fromStage,
        revealedContent: stage,
        source: opts.source || null,
        origin: opts.origin || null,
        type: opts.type || "center",
        palette: opts.palette || "metal",
        speed: typeof opts.speed === "number" ? opts.speed : 1,
        className: "is-fullscreen",
        cornerRadius: 0
    };
    waveCtrl = trDistortionWave(waveOpts);

    document.body.appendChild(waveCtrl.el);
    waveCtrl.play(opts.pointerEvent || null);
    return waveCtrl;
}

// ive looked up on the internet on this one, hold snapshot of old page then warp straight into newly rendered target page
function trTransitionWave(options) {
    const opts = options || {};
    const appEl = document.getElementById("app");
    if (!appEl) {
        if (opts.navigate) {
            opts.navigate(null);
        }
        return;
    }

    const existingOverlay = document.querySelector(".distortion-wave.is-fullscreen");
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const fromClone = appEl.cloneNode(true);
    fromClone.removeAttribute("id");
    trCopyFormState(appEl, fromClone);

    const fromStage = trEl("div", "fullscreen-backdrop");
    fromStage.appendChild(fromClone);

    const coverEl = trEl("div", "distortion-wave is-fullscreen");
    const coverView = trEl("div", "distortion-wave-view");
    coverView.appendChild(fromStage);
    coverEl.appendChild(coverView);
    document.body.appendChild(coverEl);

    let hasStarted = false;
    let fallbackTimer = 0;

    function launchWave() {
        if (hasStarted) {
            return;
        }
        hasStarted = true;
        if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = 0;
        }

        requestAnimationFrame(function () {
            appEl.classList.remove("anim-forward", "anim-back", "anim-root");
            const toClone = appEl.cloneNode(true);
            toClone.removeAttribute("id");
            trCopyFormState(appEl, toClone);

            const toStage = trEl("div", "fullscreen-backdrop");
            toStage.appendChild(toClone);

            let waveCtrl = null;
            const waveOpts = {
                children: fromStage,
                revealedContent: toStage,
                source: opts.source || null,
                type: opts.type || "center",
                palette: opts.palette || "ocean",
                speed: typeof opts.speed === "number" ? opts.speed : 1,
                className: "is-fullscreen",
                cornerRadius: 0,
                onFinish: function () {
                    if (waveCtrl && waveCtrl.el) {
                        waveCtrl.el.remove();
                    }
                    if (opts.onFinish) {
                        opts.onFinish();
                    }
                }
            };
            waveCtrl = trDistortionWave(waveOpts);
            coverEl.replaceWith(waveCtrl.el);
            waveCtrl.play(opts.pointerEvent || null);
        });
    }

    fallbackTimer = setTimeout(launchWave, 1500);
    if (opts.navigate) {
        opts.navigate(launchWave);
    } else {
        launchWave();
    }
}
