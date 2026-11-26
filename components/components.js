/* tride reusable ui components (vanilla dom factories) */

/* constants */
const TR_RISE_DELAY_DEFAULT_MS = 2000;
const TR_RISE_DELAY_MIN_MS = 1000;
const TR_RISE_DELAY_MAX_MS = 6000;
const TR_SHEET_CLOSE_MS = 250;
const TR_WAVE_FALLBACK_MS = 1500;
const TR_ICON_BACK = "\uE76B";
const TR_ICON_CHEVRON_RIGHT = "\uE76C";
const TR_ICON_CHEVRON_DOWN = "\uE70D";
const TR_ICON_CHECK = "\uE73E";
const TR_ICON_SEARCH = "\uE721";
const TR_ICON_FILTER = "\uE71C";
const TR_ICON_EMPTY = "\uE8F1";

/* core primitives */

// params: rawDelay (optional: number in ms)
function trClampRiseDelay(rawDelay) {
    if (typeof rawDelay !== "number" || Number.isNaN(rawDelay)) {
        return TR_RISE_DELAY_DEFAULT_MS;
    }
    if (rawDelay < TR_RISE_DELAY_MIN_MS) {
        return TR_RISE_DELAY_MIN_MS;
    }
    if (rawDelay > TR_RISE_DELAY_MAX_MS) {
        return TR_RISE_DELAY_MAX_MS;
    }
    return rawDelay;
}

// params: tag (required), className (optional), text (optional)
function trEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined && text !== null) {
        const textStr = String(text);
        node.textContent = textStr;
    }
    return node;
}

// params: parent (required), children (optional: node | string | array)
function trAppend(parent, children) {
    if (!children) {
        return;
    }
    const isArr = Array.isArray(children);
    const list = isArr ? children : [children];
    for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (!item) {
            continue;
        }
        const itemIsArr = Array.isArray(item);
        if (itemIsArr) {
            trAppend(parent, item);
        } else if (typeof item === "string") {
            const p = trEl("p", "as-primary", item);
            parent.appendChild(p);
        } else if (item instanceof Node) {
            parent.appendChild(item);
        } else if (item.el && item.el instanceof Node) {
            parent.appendChild(item.el);
        }
    }
}

// params: node (required), handler (required)
function trBindTap(node, handler) {
    if (!node || !handler) {
        return;
    }
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

// params: glyph (required), options (optional: { size (optional: "big"), className (optional), label (optional), onClick (optional) })
function trIcon(glyph, options) {
    const opts = options || {};
    let iconCls = "icon";
    if (opts.size === "big") {
        iconCls = iconCls + " as-display";
    }

    if (opts.onClick) {
        let btnCls = "trIcon thickness-m border-m";
        if (opts.className) {
            btnCls = btnCls + " " + opts.className;
        }
        const btn = trEl("button", btnCls);
        btn.type = "button";
        if (opts.label) {
            btn.setAttribute("aria-label", opts.label);
        }
        const innerIcon = trEl("i", iconCls);
        innerIcon.textContent = glyph;
        innerIcon.setAttribute("aria-hidden", "true");
        btn.appendChild(innerIcon);
        btn.addEventListener("click", opts.onClick);
        return btn;
    }

    iconCls = "trIcon " + iconCls;
    if (opts.className) {
        iconCls = iconCls + " " + opts.className;
    }
    const icon = trEl("i", iconCls);
    icon.textContent = glyph;
    if (opts.label) {
        icon.setAttribute("aria-label", opts.label);
    } else {
        icon.setAttribute("aria-hidden", "true");
    }
    return icon;
}

// params: none
function trSpacer() {
    const div = trEl("div", "trSpacer spacer");
    div.setAttribute("role", "separator");
    return div;
}

// params: text (required)
function trSectionHeading(text) {
    const p = trEl("p", "trSectionHeading as-cardheadline as-secondary as-gray as-bold", text);
    p.setAttribute("role", "heading");
    p.setAttribute("aria-level", "2");
    return p;
}

// params: children (required: node | array), options (optional: { delay (optional: number | string), className (optional) })
function trRise(children, options) {
    const opts = options || {};
    let cls = "trRise anim-rise";
    if (opts.className) {
        cls = cls + " " + opts.className;
    }
    const wrap = trEl("div", cls);
    if (opts.delay !== undefined) {
        const isNum = typeof opts.delay === "number";
        const delayVal = isNum ? opts.delay + "ms" : String(opts.delay);
        wrap.style.animationDelay = delayVal;
    }
    trAppend(wrap, children);
    return wrap;
}

/* layout & navigation */

// params: options (optional: { text (optional), subtext (optional), sub (optional), svg (optional), className (optional) } | string)
function trBrandLogo(options) {
    const isString = typeof options === "string";
    const opts = isString ? { text: options } : (options || {});
    const mainText = opts.text || "TRIDE";
    const subText = opts.subtext || opts.sub || "";

    if (opts.svg) {
        let wrapCls = "trBrandLogo hbox space-s";
        if (opts.className) {
            wrapCls = wrapCls + " " + opts.className;
        }
        const wrap = trEl("div", wrapCls);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(opts.svg, "image/svg+xml");
        const svgEl = svgDoc.documentElement;
        if (svgEl && svgEl.nodeName.toLowerCase() === "svg") {
            const imported = document.importNode(svgEl, true);
            imported.classList.add("trBrandLogo-svg");
            wrap.appendChild(imported);
        }
        if (subText) {
            const subSpan = trEl("span", "as-tertiary as-midgray as-bold", subText);
            wrap.appendChild(subSpan);
        }
        return wrap;
    }

    let cls = "trBrandLogo as-headline as-black as-italic lh-1";
    if (opts.className) {
        cls = cls + " " + opts.className;
    }
    const p = trEl("p", cls, mainText);
    if (subText) {
        const space = document.createTextNode(" ");
        const subSpan = trEl("span", "as-tertiary as-midgray as-bold", subText);
        p.appendChild(space);
        p.appendChild(subSpan);
    }
    return p;
}

// params: options (optional: { title (optional), subtitle (optional), titleNode (optional), center (optional: boolean), onBack (optional), leftActions (optional: array), actions (optional: array) })
function trNavBar(options) {
    const opts = options || {};
    const bar = trEl("header", "trNavBar navigation-bar hbox space-l");

    if (opts.onBack) {
        const backBtn = trEl("button", "thickness-m border-m");
        backBtn.type = "button";
        backBtn.setAttribute("aria-label", "Back");
        const backIcon = trIcon(TR_ICON_BACK);
        backBtn.appendChild(backIcon);
        backBtn.addEventListener("click", opts.onBack);
        bar.appendChild(backBtn);
    }

    if (opts.leftActions) {
        trAppend(bar, opts.leftActions);
    }

    if (opts.titleNode) {
        const hasPushRight = opts.titleNode.classList.contains("push-right");
        const hasPushCenter = opts.titleNode.classList.contains("push-center");
        if (!hasPushRight && !hasPushCenter) {
            const alignCls = opts.center ? "push-center" : "push-right";
            opts.titleNode.classList.add(alignCls);
        }
        bar.appendChild(opts.titleNode);
    } else {
        const alignCls = opts.center ? "push-center" : "push-right";
        const titleBox = trEl("div", "vbox " + alignCls + " space-s");
        const titleEl = trEl("h1", "as-headline lh-1 as-bold", opts.title || "");
        titleBox.appendChild(titleEl);
        if (opts.subtitle) {
            const subEl = trEl("p", "as-tertiary as-gray lh-1", opts.subtitle);
            titleBox.appendChild(subEl);
        }
        bar.appendChild(titleBox);
    }

    if (opts.actions) {
        trAppend(bar, opts.actions);
    }
    return bar;
}

// params: panel (required: node), direction (optional: number)
function trAnimateTabSwitch(panel, direction) {
    if (!panel) {
        return;
    }
    panel.classList.remove("anim-forward", "anim-back", "anim-root");
    void panel.offsetWidth;
    let animCls = "anim-root";
    if (direction > 0) {
        animCls = "anim-forward";
    } else if (direction < 0) {
        animCls = "anim-back";
    }
    panel.classList.add(animCls);
}

// params: options (required: { items (optional: array of { key, label }), tabs (optional: array of { value, label }), activeKey (optional), activeValue (optional), equal (optional), stretch (optional), label (optional), onChange (optional) })
function trTabbed(options) {
    const opts = options || {};
    const list = opts.items || opts.tabs || [];
    const isStretch = Boolean(opts.equal || opts.stretch);
    const activeVal = opts.activeKey !== undefined ? opts.activeKey : opts.activeValue;
    const barCls = isStretch ? "trTabbed tabbed hbox space-l" : "trTabbed tabbed hbox space-l scroll";
    const bar = trEl("div", barCls);
    bar.setAttribute("role", "tablist");
    if (opts.label) {
        bar.setAttribute("aria-label", opts.label);
    }

    let currentIdx = 0;
    for (let i = 0; i < list.length; i += 1) {
        const probeVal = list[i].key !== undefined ? list[i].key : list[i].value;
        if (probeVal === activeVal) {
            currentIdx = i;
        }
    }

    const buttons = [];
    for (let i = 0; i < list.length; i += 1) {
        const tab = list[i];
        const tabVal = tab.key !== undefined ? tab.key : tab.value;
        const isActive = tabVal === activeVal;
        let btnCls = "as-tabbed as-bold thickness-m";
        if (isStretch) {
            btnCls = btnCls + " flex1";
        }
        if (isActive) {
            btnCls = btnCls + " active";
        }
        const btn = trEl("button", btnCls, tab.label);
        btn.type = "button";
        btn.setAttribute("role", "tab");
        const selectedStr = isActive ? "true" : "false";
        btn.setAttribute("aria-selected", selectedStr);

        function onTabClick() {
            const direction = i > currentIdx ? 1 : (i < currentIdx ? -1 : 0);
            currentIdx = i;
            for (let j = 0; j < buttons.length; j += 1) {
                const other = buttons[j];
                other.classList.remove("active");
                other.setAttribute("aria-selected", "false");
            }
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");
            if (opts.onChange) {
                opts.onChange(tabVal, tab, direction);
            }
        }

        btn.addEventListener("click", onTabClick);
        buttons.push(btn);
        bar.appendChild(btn);
    }
    return bar;
}

// params: options (same as trTabbed)
function trTabs(options) {
    return trTabbed(options);
}

// params: options (required: { sections (optional) | groups (optional), icon (optional), label (optional) })
function trMenu(options) {
    const opts = options || {};
    const anchor = trEl("div", "trMenu menu-anchor");
    const panel = trEl("div", "trMenuPanel popup vbox space-xl border-l scroll hidden");
    panel.setAttribute("role", "menu");

    const triggerBtn = trEl("button", "thickness-m border-m");
    triggerBtn.type = "button";
    triggerBtn.setAttribute("aria-label", opts.label || "Menu");
    triggerBtn.setAttribute("aria-haspopup", "menu");
    triggerBtn.setAttribute("aria-expanded", "false");
    const trigIcon = trIcon(opts.icon || TR_ICON_FILTER);
    triggerBtn.appendChild(trigIcon);

    function closeMenu() {
        panel.classList.add("hidden");
        triggerBtn.setAttribute("aria-expanded", "false");
    }

    function toggleMenu(event) {
        event.stopPropagation();
        const isHidden = panel.classList.contains("hidden");
        if (isHidden) {
            const openPanels = document.querySelectorAll(".trMenuPanel:not(.hidden)");
            for (let p = 0; p < openPanels.length; p += 1) {
                const otherPanel = openPanels[p];
                if (otherPanel !== panel) {
                    otherPanel.classList.add("hidden");
                    const parentAnchor = otherPanel.parentElement;
                    if (parentAnchor) {
                        const otherBtn = parentAnchor.querySelector("button[aria-expanded]");
                        if (otherBtn) {
                            otherBtn.setAttribute("aria-expanded", "false");
                        }
                    }
                }
            }
            panel.classList.remove("hidden");
            triggerBtn.setAttribute("aria-expanded", "true");
        } else {
            closeMenu();
        }
    }
    triggerBtn.addEventListener("click", toggleMenu);

    const menuRand = Math.random();
    const menuStr = menuRand.toString(36);
    const menuId = menuStr.slice(2, 8);
    const sections = opts.sections || opts.groups || [];
    for (let s = 0; s < sections.length; s += 1) {
        const section = sections[s];
        const groupWrap = trEl("div", "group vbox space-m");
        if (section.title) {
            const groupTitle = trEl("p", "as-tertiary as-gray", section.title);
            groupWrap.appendChild(groupTitle);
        }
        const items = section.items || [];
        for (let i = 0; i < items.length; i += 1) {
            if (i > 0) {
                const sep = trSpacer();
                groupWrap.appendChild(sep);
            }
            const item = items[i];
            let rowCls = "menu-item hbox space-l";
            if (item.disabled) {
                rowCls = rowCls + " disabled";
            }
            const row = trEl("label", rowCls);
            row.setAttribute("role", "menuitemradio");
            const isChecked = Boolean(item.checked || item.active);
            row.setAttribute("aria-checked", isChecked ? "true" : "false");
            if (item.disabled) {
                row.setAttribute("aria-disabled", "true");
            }

            const radio = document.createElement("input");
            radio.type = "radio";
            const defaultName = "menu-" + menuId + "-group-" + s;
            radio.name = section.name || defaultName;
            radio.value = item.value !== undefined ? item.value : item.label;
            if (item.disabled) {
                radio.disabled = true;
            }
            if (isChecked) {
                radio.checked = true;
            }

            function handleRadioChange() {
                const allRows = groupWrap.querySelectorAll(".menu-item");
                for (let r = 0; r < allRows.length; r += 1) {
                    allRows[r].setAttribute("aria-checked", "false");
                }
                row.setAttribute("aria-checked", "true");
                if (section.onChange) {
                    section.onChange(item.value);
                }
                if (item.onClick) {
                    item.onClick();
                }
                panel.classList.add("hidden");
                triggerBtn.setAttribute("aria-expanded", "false");
            }
            radio.addEventListener("change", handleRadioChange);

            const text = trEl("p", "as-primary push-right", item.label);
            const check = trIcon(TR_ICON_CHECK, { className: "check" });
            row.appendChild(radio);
            row.appendChild(text);
            row.appendChild(check);
            groupWrap.appendChild(row);
        }
        panel.appendChild(groupWrap);
    }

    function cleanupMenuListeners() {
        document.removeEventListener("click", handleOutsideClick);
        document.removeEventListener("keydown", handleMenuKeyDown);
    }
    function handleOutsideClick(event) {
        if (!anchor.isConnected) {
            cleanupMenuListeners();
            return;
        }
        if (!anchor.contains(event.target)) {
            closeMenu();
        }
    }
    function handleMenuKeyDown(event) {
        if (!anchor.isConnected) {
            cleanupMenuListeners();
            return;
        }
        if (event.key === "Escape" && !panel.classList.contains("hidden")) {
            closeMenu();
            triggerBtn.focus();
        }
    }
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleMenuKeyDown);

    anchor.appendChild(triggerBtn);
    anchor.appendChild(panel);
    return anchor;
}

// params: options (same as trMenu)
function trPopupMenu(options) {
    return trMenu(options);
}

/* cards & data display */

// params: children (required: node | array), options (optional: { flex (optional), className (optional), label (optional) })
function trSection(children, options) {
    const opts = options || {};
    let cls = "trSection section vbox space-l";
    if (opts.flex) {
        cls = cls + " flex1";
    }
    if (opts.className) {
        cls = cls + " " + opts.className;
    }
    const sec = trEl("section", cls);
    if (opts.label) {
        sec.setAttribute("aria-label", opts.label);
    }
    trAppend(sec, children);
    return sec;
}

// params: children (required: node | array), options (optional: { layout (optional), className (optional), tag (optional), onClick (optional) })
function trCard(children, options) {
    const opts = options || {};
    const base = opts.layout ? "trCard card " + opts.layout : "trCard card standard vbox space-m border-l";
    const cls = opts.className ? base + " " + opts.className : base;
    const tag = opts.tag || "div";
    const card = trEl(tag, cls);
    if (opts.onClick) {
        trBindTap(card, opts.onClick);
    }
    trAppend(card, children);
    return card;
}

// params: options (required: { card (required: node), headline (optional), footnote (optional) })
function trCardGroup(options) {
    const opts = options || {};
    const group = trEl("div", "trCardGroup group vbox space-m");
    if (opts.headline) {
        const headEl = trSectionHeading(opts.headline);
        group.appendChild(headEl);
    }
    if (opts.card) {
        trAppend(group, opts.card);
    }
    if (opts.footnote) {
        const footEl = trEl("p", "as-cardfootnote as-tertiary as-gray", opts.footnote);
        group.appendChild(footEl);
    }
    return group;
}

// params: items (required: array of nodes)
function trListCard(items) {
    const raw = items || [];
    const spaced = [];
    for (let i = 0; i < raw.length; i += 1) {
        const entry = raw[i];
        if (!entry) {
            continue;
        }
        if (spaced.length > 0) {
            const sep = trSpacer();
            spaced.push(sep);
        }
        spaced.push(entry);
    }
    const card = trCard(spaced, { className: "trListCard" });
    return card;
}

// params: options (required: { title (required: string | node), subtitle (optional: string | array), index (optional: string | number), step (optional: string | number), onClick (optional) })
function trListItem(options) {
    const opts = options || {};
    const stepVal = opts.index !== undefined ? opts.index : opts.step;
    const hasStep = stepVal !== undefined && stepVal !== null && stepVal !== "";

    const item = hasStep ? trEl("div", "trListItem hbox space-m") : trEl("div", "trListItem vbox");
    let textTarget = item;

    if (hasStep) {
        const idxEl = trEl("span", "list-index as-tertiary as-gray as-bold as-centered", String(stepVal));
        item.appendChild(idxEl);
        textTarget = trEl("div", "vbox push-right");
        item.appendChild(textTarget);
    }

    if (opts.title) {
        if (opts.title instanceof Node) {
            textTarget.appendChild(opts.title);
        } else {
            const titleEl = trEl("p", "as-primary", opts.title);
            textTarget.appendChild(titleEl);
        }
    }
    if (opts.subtitle) {
        const isArr = Array.isArray(opts.subtitle);
        const subs = isArr ? opts.subtitle : [opts.subtitle];
        for (let i = 0; i < subs.length; i += 1) {
            const subEl = trEl("p", "as-secondary as-gray", subs[i]);
            textTarget.appendChild(subEl);
        }
    }
    if (opts.onClick) {
        trBindTap(item, opts.onClick);
    }
    return item;
}

// params: target (required: node), value (optional: string | node)
function trAppendSlot(target, value) {
    if (typeof value === "string") {
        const p = trEl("p", "as-tertiary as-gray", value);
        target.appendChild(p);
        return;
    }
    if (value) {
        trAppend(target, value);
    }
}

// params: options (required: { title (optional), bodyNumber (optional), logoText (optional), logoSvg (optional), svg (optional), subtext (optional), role (optional), topRight (optional), subtitle (optional), owner (optional), bottomRight (optional), assignedTo (optional), big (optional), className (optional), onClick (optional) })
function trBrandCard(options) {
    const opts = options || {};
    let cls = "trBrandCard card brandcard grid border-m";
    if (opts.className) {
        cls = cls + " " + opts.className;
    }
    const card = trEl("div", cls);

    const logo = trBrandLogo({
        text: opts.logoText || "TRIDE",
        svg: opts.logoSvg || opts.svg || "",
        subtext: opts.subtext || opts.role || "",
        className: "tl"
    });
    card.appendChild(logo);

    if (opts.topRight) {
        const trSlot = trEl("div", "tr");
        trAppendSlot(trSlot, opts.topRight);
        card.appendChild(trSlot);
    }

    const bl = trEl("div", "vbox space-s bl");
    const isBig = opts.big !== false;
    const titleCls = isBig ? "as-large-title as-bold" : "as-headline as-bold";
    const mainNum = opts.title !== undefined ? opts.title : (opts.bodyNumber || "");
    const titleEl = trEl("p", titleCls, mainNum);
    bl.appendChild(titleEl);
    if (opts.subtitle) {
        trAppendSlot(bl, opts.subtitle);
    } else if (opts.owner) {
        const ownerP = trEl("p", "as-tertiary as-gray", "from ");
        const ownerSpan = trEl("span", "as-bold", opts.owner);
        ownerP.appendChild(ownerSpan);
        bl.appendChild(ownerP);
    }
    card.appendChild(bl);

    if (opts.bottomRight || opts.assignedTo) {
        const br = trEl("div", "br");
        if (opts.bottomRight) {
            trAppendSlot(br, opts.bottomRight);
        } else {
            const assignP = trEl("p", "as-tertiary as-gray", "Assigned to ");
            const assignSpan = trEl("span", "as-bold", opts.assignedTo);
            assignP.appendChild(assignSpan);
            br.appendChild(assignP);
        }
        card.appendChild(br);
    }

    if (opts.onClick) {
        trBindTap(card, opts.onClick);
    }
    return card;
}

// params: options (required: { heading (required), cards (required: array of nodes) })
function trCardStack(options) {
    const opts = options || {};
    const rawCards = opts.cards || [];
    const cards = [];
    for (let i = 0; i < rawCards.length; i += 1) {
        if (rawCards[i]) {
            cards.push(rawCards[i]);
        }
    }
    const wrap = trEl("div", "trCardStack group vbox space-l");
    if (opts.heading) {
        const head = trSectionHeading(opts.heading);
        wrap.appendChild(head);
    }

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

        function expandOnKey(event) {
            if (!stack.classList.contains("collapsed")) {
                return;
            }
            if (event.key === "Enter" || event.key === " ") {
                expandOnFirstTap(event);
            }
        }
        stack.addEventListener("keydown", expandOnKey, true);
    }

    wrap.appendChild(stack);
    return wrap;
}

// params: data (required: { firstName (optional), lastName (optional), name (optional), greeting (optional), address (optional), contact (optional), todaName (optional), license (optional), leftDetails (optional), rightDetails (optional) })
function trProfileCard(data) {
    const d = data || {};
    const section = trEl("section", "trProfileCard card profile grid border-l");
    section.setAttribute("aria-label", "Member profile");

    const tl = trEl("div", "vbox tl");
    const greetEl = trEl("p", "as-tertiary as-gray", d.greeting || "Hey,");
    const joinedName = ((d.firstName || "") + " " + (d.lastName || "")).trim();
    const displayName = d.name || joinedName || "Member";
    const nameEl = trEl("p", "as-primary as-bold", displayName);
    tl.appendChild(greetEl);
    tl.appendChild(nameEl);
    section.appendChild(tl);

    const avatar = trEl("div", "avatar-lg tr");
    avatar.setAttribute("aria-hidden", "true");
    section.appendChild(avatar);

    const bl = trEl("div", "vbox bl");
    const leftList = d.leftDetails || [d.address || "No address", d.contact || "No contact"];
    for (let i = 0; i < leftList.length; i += 1) {
        const line = trEl("p", "as-tertiary as-gray", leftList[i]);
        bl.appendChild(line);
    }
    section.appendChild(bl);

    const br = trEl("div", "vbox br");
    const rightList = d.rightDetails || [d.todaName || "No TODA", d.license || "No license"];
    for (let i = 0; i < rightList.length; i += 1) {
        const line = trEl("p", "as-tertiary as-gray", rightList[i]);
        br.appendChild(line);
    }
    section.appendChild(br);

    return section;
}

// params: items (required: array of { value, label }), options (optional: { label (optional) })
function trStatGroup(items, options) {
    const opts = options || {};
    const list = items || [];
    const wrap = trCard([], {
        layout: "standard hbox space-m border-l",
        className: "trStatGroup"
    });
    if (opts.label) {
        wrap.setAttribute("aria-label", opts.label);
    }
    for (let i = 0; i < list.length; i += 1) {
        const entry = list[i];
        if (!entry) {
            continue;
        }
        const cell = trEl("div", "vbox flex1 space-m");
        const valEl = trEl("p", "as-title lh-1", entry.value);
        const lblEl = trEl("p", "as-tertiary as-bold as-midgray lh-1", entry.label);
        cell.appendChild(valEl);
        cell.appendChild(lblEl);
        wrap.appendChild(cell);
    }
    return wrap;
}

// params: options (required: { label (required), subtitle (optional), hideChevron (optional), critical (optional), disabled (optional), onClick (optional) })
function trActionRow(options) {
    const opts = options || {};
    const row = trEl("div", "trActionRow hbox space-l");
    let lblCls = "as-primary";
    if (opts.critical) {
        lblCls = lblCls + " as-critical";
    }
    if (opts.disabled) {
        lblCls = lblCls + " disabled";
    }
    const textWrap = trEl("div", "vbox push-right space-s");
    const lbl = trEl("p", lblCls, opts.label || "");
    textWrap.appendChild(lbl);
    if (opts.subtitle) {
        const sub = trEl("p", "as-secondary as-gray", opts.subtitle);
        textWrap.appendChild(sub);
    }
    row.appendChild(textWrap);

    if (!opts.hideChevron) {
        const chev = trIcon(TR_ICON_CHEVRON_RIGHT, { className: "as-gray" });
        row.appendChild(chev);
    }
    if (opts.onClick && !opts.disabled) {
        trBindTap(row, opts.onClick);
    } else if (opts.disabled) {
        row.setAttribute("aria-disabled", "true");
    }
    return row;
}

// params: options (required: { title (required), subtitle (optional), metaLines (optional: array), mutedLast (optional), onClick (optional) })
function trEntityRow(options) {
    const opts = options || {};
    const left = trEl("div", "vbox push-right space-s");
    const titleEl = trEl("p", "as-large-title as-bold", opts.title || "");
    left.appendChild(titleEl);
    if (opts.subtitle) {
        const subEl = trEl("p", "as-secondary as-gray", opts.subtitle);
        left.appendChild(subEl);
    }

    const right = trEl("div", "vbox space-s");
    right.style.textAlign = "right";
    const meta = opts.metaLines || [];
    for (let i = 0; i < meta.length; i += 1) {
        const line = meta[i];
        const cls = (opts.mutedLast && i === meta.length - 1) ? "as-tertiary as-gray" : "as-tertiary as-midgray";
        const metaEl = trEl("p", cls, line);
        right.appendChild(metaEl);
    }

    const row = trCard([left, right], {
        layout: "hbox space-l border-l",
        className: "trEntityRow",
        onClick: opts.onClick
    });
    return row;
}

// params: options (required: { items (required: array), getLabel (optional), renderRow (optional), onItemClick (optional) })
function trAlphaList(options) {
    const opts = options || {};
    const items = opts.items || [];
    const getLabel = opts.getLabel || function (item) {
        return String(item || "");
    };
    const groups = {};
    const keys = [];

    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const raw = getLabel(item);
        let trimmed = String(raw || "");
        trimmed = trimmed.trim();
        let letter = "#";
        if (trimmed.length > 0) {
            letter = trimmed.charAt(0);
            letter = letter.toUpperCase();
        }
        if (!groups[letter]) {
            groups[letter] = [];
            keys.push(letter);
        }
        let rowNode = null;
        if (opts.renderRow) {
            rowNode = opts.renderRow(item);
        } else {
            rowNode = trActionRow({
                label: trimmed,
                onClick: opts.onItemClick ? function () { opts.onItemClick(item); } : null
            });
        }
        groups[letter].push(rowNode);
    }
    keys.sort();

    const wrap = trEl("div", "trAlphaList vbox space-l");
    for (let i = 0; i < keys.length; i += 1) {
        const letterKey = keys[i];
        const card = trListCard(groups[letterKey]);
        const group = trCardGroup({ headline: letterKey, card: card });
        wrap.appendChild(group);
    }
    return wrap;
}

// params: options (required: { title (required), subtitle (optional), checked (optional), disabled (optional), onChange (optional) })
function trCheckRow(options) {
    const opts = options || {};
    let cls = "trCheckRow check-row hbox space-l";
    if (opts.disabled) {
        cls = cls + " disabled";
    }
    const row = trEl("label", cls);

    const box = document.createElement("input");
    box.type = "checkbox";
    if (opts.checked) {
        box.checked = true;
    }
    if (opts.disabled) {
        box.disabled = true;
    }
    if (opts.onChange) {
        function handleCheck(event) {
            opts.onChange(box.checked, event);
        }
        box.addEventListener("change", handleCheck);
    }

    const textWrap = trEl("div", "vbox push-right space-s");
    const titleEl = trEl("p", "as-primary", opts.title || "");
    textWrap.appendChild(titleEl);
    if (opts.subtitle) {
        const subEl = trEl("p", "as-secondary as-gray", opts.subtitle);
        textWrap.appendChild(subEl);
    }

    const checkIcon = trIcon(TR_ICON_CHECK, { className: "check" });
    row.appendChild(box);
    row.appendChild(textWrap);
    row.appendChild(checkIcon);
    row.inputEl = box;
    return row;
}

// params: options (required: { items (required: array of { value, title, label, subtitle, disabled }), value (optional), name (optional), label (optional), onChange (optional) })
function trRadioGroup(options) {
    const opts = options || {};
    const items = opts.items || [];
    const randNum = Math.random();
    const randStr = randNum.toString(36);
    const groupName = opts.name || ("tr-radio-" + randStr.slice(2, 8));
    const hasInitial = opts.value !== undefined && opts.value !== null;
    const initialStr = hasInitial ? String(opts.value) : "";

    const rows = [];
    const entries = [];

    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (!item) {
            continue;
        }
        let rowCls = "trRadioRow check-row hbox space-l";
        if (item.disabled) {
            rowCls = rowCls + " disabled";
        }
        const row = trEl("label", rowCls);
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = groupName;
        const itemVal = item.value !== undefined ? item.value : (item.title || item.label || "");
        const itemValStr = String(itemVal);
        radio.value = itemValStr;

        if (item.disabled) {
            radio.disabled = true;
        }
        if (hasInitial && itemValStr === initialStr) {
            radio.checked = true;
        }

        function handleRadioChange() {
            if (radio.checked && opts.onChange) {
                opts.onChange(itemVal, item);
            }
        }
        radio.addEventListener("change", handleRadioChange);

        const textWrap = trEl("div", "vbox push-right space-s");
        const titleText = item.title || item.label || "";
        const titleEl = trEl("p", "as-primary", titleText);
        textWrap.appendChild(titleEl);
        if (item.subtitle) {
            const subEl = trEl("p", "as-secondary as-gray", item.subtitle);
            textWrap.appendChild(subEl);
        }

        const checkIcon = trIcon(TR_ICON_CHECK, { className: "check" });
        row.appendChild(radio);
        row.appendChild(textWrap);
        row.appendChild(checkIcon);
        rows.push(row);
        entries.push({ radio: radio, value: itemVal, valueStr: itemValStr });
    }

    const card = trListCard(rows);
    card.classList.add("trRadioGroup");
    card.setAttribute("role", "radiogroup");
    if (opts.label) {
        card.setAttribute("aria-label", opts.label);
    }

    card.getValue = function () {
        for (let i = 0; i < entries.length; i += 1) {
            if (entries[i].radio.checked) {
                return entries[i].value;
            }
        }
        return null;
    };

    card.setValue = function (nextVal) {
        const nextStr = nextVal !== undefined && nextVal !== null ? String(nextVal) : "";
        for (let i = 0; i < entries.length; i += 1) {
            entries[i].radio.checked = entries[i].valueStr === nextStr;
        }
    };

    return card;
}

// params: options (required: { title (required), subtitle (optional), icon (optional) })
function trEmptyState(options) {
    const opts = options || {};
    const wrap = trEl("div", "trEmptyState group vbox center justify-center flex1 space-m");
    wrap.setAttribute("role", "status");
    const glyph = opts.icon || TR_ICON_EMPTY;
    const iconEl = trIcon(glyph, { className: "as-display as-centered as-gray" });
    wrap.appendChild(iconEl);
    if (opts.title) {
        const titleEl = trEl("p", "as-secondary as-bold as-centered", opts.title);
        wrap.appendChild(titleEl);
    }
    if (opts.subtitle) {
        const subEl = trEl("p", "as-tertiary as-gray as-centered", opts.subtitle);
        wrap.appendChild(subEl);
    }
    return wrap;
}

// params: options (required: { total (required), current (required) })
function trStoryBar(options) {
    const opts = options || {};
    const parsedTotal = Number(opts.total) || 1;
    const total = parsedTotal > 0 ? parsedTotal : 1;
    const rawCurrent = opts.current !== undefined ? Number(opts.current) : 1;
    const nonNegCurrent = rawCurrent > 0 ? rawCurrent : 0;
    const current = nonNegCurrent > total ? total : nonNegCurrent;
    const bar = trEl("div", "trStoryBar story-bar");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "1");
    bar.setAttribute("aria-valuemax", String(total));
    bar.setAttribute("aria-valuenow", String(current));

    for (let i = 1; i <= total; i += 1) {
        const cls = i <= current ? "story-segment active" : "story-segment";
        const seg = trEl("div", cls);
        bar.appendChild(seg);
    }
    return bar;
}

/* controls & inputs */

// params: options (required: { label (optional), icon (optional), variant (optional: "standard" | "primary"), size (optional: "m" | "l"), small (optional), critical (optional), disabled (optional), animate (optional: boolean | { delay }), className (optional), onClick (optional) })
function trButton(options) {
    const opts = options || {};
    const variant = opts.variant === "primary" ? "as-primary" : "as-standard";
    const isSmall = opts.small || opts.size === "m";
    const pad = isSmall ? "thickness-m" : "thickness-l";
    let cls = "trButton " + variant + " " + pad + " border-l";
    if (opts.icon && opts.label) {
        cls = cls + " space-m";
    }
    if (opts.critical) {
        cls = cls + " as-critical";
    }
    if (opts.disabled) {
        cls = cls + " disabled";
    }
    if (opts.animate) {
        cls = cls + " anim-rise";
    }
    if (opts.className) {
        cls = cls + " " + opts.className;
    }

    const btn = trEl("button", cls);
    btn.type = "button";
    if (opts.icon) {
        const iconEl = trIcon(opts.icon);
        btn.appendChild(iconEl);
    }
    if (opts.label) {
        const textNode = document.createTextNode(opts.label);
        btn.appendChild(textNode);
    }
    if (opts.animate && typeof opts.animate === "object" && opts.animate.delay !== undefined) {
        let delayVal = "";
        if (typeof opts.animate.delay === "number") {
            const clampedMs = trClampRiseDelay(opts.animate.delay);
            delayVal = clampedMs + "ms";
        } else {
            delayVal = String(opts.animate.delay);
        }
        btn.style.animationDelay = delayVal;
    }
    if (opts.disabled) {
        btn.disabled = true;
    }
    if (opts.onClick) {
        btn.addEventListener("click", opts.onClick);
    }
    return btn;
}

// params: options (optional: { placeholder (optional), value (optional), label (optional), onInput (optional) })
function trSearchBox(options) {
    const opts = options || {};
    const wrap = trEl("div", "trSearchBox card hbox space-m thickness-m border-l");
    wrap.setAttribute("role", "search");

    const iconEl = trIcon(TR_ICON_SEARCH, { className: "as-gray" });
    const input = trEl("input", "flex1");
    input.type = "search";
    input.placeholder = opts.placeholder || "Search...";
    if (opts.value) {
        input.value = opts.value;
    }
    const ariaLabel = opts.label || input.placeholder;
    input.setAttribute("aria-label", ariaLabel);

    if (opts.onInput) {
        function handleInput() {
            opts.onInput(input.value);
        }
        input.addEventListener("input", handleInput);
    }

    wrap.appendChild(iconEl);
    wrap.appendChild(input);
    wrap.input = input;
    return wrap;
}

// params: options (required: { label (required), value (optional), input (optional: node | config), select (optional: config), error (optional), id (optional) })
function trPropertyRow(options) {
    const opts = options || {};
    const row = trEl("div", "trPropertyRow vbox");
    row.setAttribute("data-tr-field", "true");
    const randPart = Math.random().toString(36).slice(2, 8);
    const fieldId = opts.id || ("tr-field-" + randPart);

    const hasControl = Boolean(opts.input || opts.select);
    if (opts.label) {
        const lbl = trEl("label");
        if (hasControl) {
            lbl.setAttribute("for", fieldId);
        }
        const lblSpan = trEl("span", "as-tertiary as-gray", opts.label);
        lbl.appendChild(lblSpan);
        row.appendChild(lbl);
    }

    let controlEl = null;

    if (opts.input) {
        if (opts.input instanceof Node) {
            controlEl = opts.input;
            if (!controlEl.id) {
                controlEl.id = fieldId;
            }
        } else {
            const cfg = opts.input;
            const input = trEl("input");
            input.id = fieldId;
            input.type = cfg.type || "text";
            if (cfg.placeholder) {
                input.placeholder = cfg.placeholder;
            }
            if (cfg.value !== undefined && cfg.value !== null) {
                input.value = String(cfg.value);
            }
            if (cfg.readOnly) {
                input.readOnly = true;
            }
            if (cfg.disabled) {
                input.disabled = true;
            }
            if (cfg.maxLength) {
                input.maxLength = cfg.maxLength;
            }
            if (cfg.onInput) {
                input.addEventListener("input", cfg.onInput);
            }
            controlEl = input;
        }
        row.appendChild(controlEl);
    } else if (opts.select) {
        const cfg = opts.select;
        const field = trEl("div", "hbox space-m");
        const select = trEl("select", "flex1");
        select.id = fieldId;
        if (cfg.disabled) {
            select.disabled = true;
        }
        const hasTargetVal = cfg.value !== undefined && cfg.value !== null;
        const targetValStr = hasTargetVal ? String(cfg.value) : "";
        const list = cfg.options || [];
        for (let i = 0; i < list.length; i += 1) {
            const ch = list[i];
            if (ch.group) {
                const grp = document.createElement("optgroup");
                grp.label = ch.group;
                const subOpts = ch.options || [];
                for (let j = 0; j < subOpts.length; j += 1) {
                    const sub = subOpts[j];
                    const optEl = trEl("option", "", sub.label);
                    optEl.value = sub.value;
                    if (hasTargetVal && String(sub.value) === targetValStr) {
                        optEl.selected = true;
                    }
                    grp.appendChild(optEl);
                }
                select.appendChild(grp);
            } else {
                const optEl = trEl("option", "", ch.label);
                optEl.value = ch.value;
                if (hasTargetVal && String(ch.value) === targetValStr) {
                    optEl.selected = true;
                }
                select.appendChild(optEl);
            }
        }
        if (cfg.onChange) {
            select.addEventListener("change", cfg.onChange);
        }
        const chev = trIcon(TR_ICON_CHEVRON_DOWN, { className: "as-gray" });
        field.appendChild(select);
        field.appendChild(chev);
        row.appendChild(field);
        controlEl = select;
    } else if (opts.value !== undefined && opts.value !== null) {
        const valEl = trEl("p", "as-primary", opts.value);
        row.appendChild(valEl);
    }

    const errEl = trEl("p", "as-tertiary as-critical");
    errEl.id = fieldId + "-err";
    errEl.setAttribute("role", "alert");

    function setError(msg) {
        if (msg) {
            errEl.textContent = msg;
            if (controlEl) {
                controlEl.setAttribute("aria-invalid", "true");
                controlEl.setAttribute("aria-describedby", errEl.id);
            }
            if (!errEl.parentNode) {
                row.appendChild(errEl);
            }
        } else {
            errEl.textContent = "";
            if (controlEl) {
                controlEl.removeAttribute("aria-invalid");
                controlEl.removeAttribute("aria-describedby");
            }
            if (errEl.parentNode) {
                row.removeChild(errEl);
            }
        }
    }

    if (opts.error) {
        setError(opts.error);
    }

    row.controlEl = controlEl;
    row.setError = setError;
    return row;
}

/* sheets & dialogs */

// params: options (required: { title (optional), description (optional), footnote (optional), icon (optional), headerExtra (optional), body (optional), content (optional), footer (optional), buttons (optional), children (optional), removeOnClose (optional), onClose (optional) })
function trSheet(options) {
    const opts = options || {};
    const backdrop = trEl("div", "trSheet sheet-backdrop hidden");
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    const sheet = trEl("div", "sheet vbox space-xl border-l");

    if (opts.icon) {
        const iconEl = trIcon(opts.icon, { className: "as-display as-centered" });
        sheet.appendChild(iconEl);
    }

    const hasHeader = Boolean(opts.title || opts.description || opts.footnote || opts.headerExtra);
    if (hasHeader) {
        const header = trEl("div", "group sheet-header vbox space-t");
        if (opts.title) {
            const titleEl = trEl("p", "as-headline as-bold", opts.title);
            const randId = Math.random().toString(36).slice(2, 8);
            titleEl.id = "tr-sheet-" + randId;
            backdrop.setAttribute("aria-labelledby", titleEl.id);
            header.appendChild(titleEl);
        }
        if (opts.description) {
            const descEl = trEl("p", "as-secondary as-midgray", opts.description);
            header.appendChild(descEl);
        }
        if (opts.footnote) {
            const footEl = trEl("p", "as-tertiary as-gray", opts.footnote);
            header.appendChild(footEl);
        }
        if (opts.headerExtra) {
            trAppend(header, opts.headerExtra);
        }
        sheet.appendChild(header);
    }

    const bodySource = opts.body || opts.content || opts.children;
    if (bodySource) {
        const bodyWrap = trEl("div", "group sheet-body vbox space-l");
        trAppend(bodyWrap, bodySource);
        sheet.appendChild(bodyWrap);
    }

    const footerSource = opts.footer || opts.buttons;
    if (footerSource) {
        const footCls = opts.buttons ? "group sheet-footer hbox space-m" : "group sheet-footer vbox space-m";
        const footerWrap = trEl("div", footCls);
        trAppend(footerWrap, footerSource);
        sheet.appendChild(footerWrap);
    }

    backdrop.appendChild(sheet);

    let isOpen = false;

    function handleSheetKeyDown(event) {
        if (event.key === "Escape" && isOpen) {
            close();
        }
    }

    function close() {
        if (!isOpen) {
            return;
        }
        isOpen = false;
        document.removeEventListener("keydown", handleSheetKeyDown);
        backdrop.classList.add("hidden");
        if (opts.removeOnClose) {
            // ive looked up on the internet on this one, setTimeout wait until the slide exit finish before removing the element
            setTimeout(function () {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, TR_SHEET_CLOSE_MS);
        }
        if (opts.onClose) {
            opts.onClose();
        }
    }

    function open() {
        isOpen = true;
        if (!backdrop.parentNode) {
            document.body.appendChild(backdrop);
        }
        document.addEventListener("keydown", handleSheetKeyDown);
        requestAnimationFrame(function () {
            if (isOpen) {
                backdrop.classList.remove("hidden");
            }
        });
    }

    function handleBackdropClick(event) {
        if (event.target === backdrop) {
            close();
        }
    }
    backdrop.addEventListener("click", handleBackdropClick);

    return { el: backdrop, open: open, close: close };
}

// params: options (required: { title (required), description (optional), footnote (optional), confirmLabel (optional), cancelLabel (optional), critical (optional), onConfirm (optional), onCancel (optional) })
function trConfirm(options) {
    const opts = options || {};
    let ctrl = null;

    function handleCancel() {
        if (ctrl) {
            ctrl.close();
        }
        if (opts.onCancel) {
            opts.onCancel();
        }
    }

    function handleConfirm() {
        if (ctrl) {
            ctrl.close();
        }
        if (opts.onConfirm) {
            opts.onConfirm();
        }
    }

    const cancelBtn = trButton({
        label: opts.cancelLabel || "Cancel",
        size: "m",
        className: "flex1",
        onClick: handleCancel
    });

    const okBtn = trButton({
        label: opts.confirmLabel || "OK",
        size: "m",
        critical: Boolean(opts.critical),
        className: "flex1",
        onClick: handleConfirm
    });

    ctrl = trSheet({
        title: opts.title,
        description: opts.description || opts.message,
        footnote: opts.footnote,
        buttons: [cancelBtn, okBtn],
        removeOnClose: true
    });

    ctrl.open();
    return ctrl;
}

// params: options (required: { title (required), description (optional), footnote (optional), okLabel (optional), onOk (optional) })
function trAlert(options) {
    const opts = options || {};
    let ctrl = null;

    function handleOk() {
        if (ctrl) {
            ctrl.close();
        }
        if (opts.onOk) {
            opts.onOk();
        }
    }

    const okBtn = trButton({
        label: opts.okLabel || "OK",
        variant: "primary",
        size: "m",
        className: "flex1",
        onClick: handleOk
    });

    ctrl = trSheet({
        title: opts.title,
        description: opts.description || opts.message,
        footnote: opts.footnote,
        buttons: [okBtn],
        removeOnClose: true
    });

    ctrl.open();
    return ctrl;
}

/* distortion wave transitions */

// params: sourceRoot (required: node), cloneRoot (required: node)
function trCopyFormState(sourceRoot, cloneRoot) {
    const srcInputs = sourceRoot.querySelectorAll("input");
    const dstInputs = cloneRoot.querySelectorAll("input");
    for (let i = 0; i < srcInputs.length; i += 1) {
        const srcIn = srcInputs[i];
        const dstIn = dstInputs[i];
        if (dstIn) {
            dstIn.setAttribute("value", srcIn.value);
            if (srcIn.type === "checkbox" || srcIn.type === "radio") {
                if (srcIn.checked) {
                    dstIn.setAttribute("checked", "checked");
                } else {
                    dstIn.removeAttribute("checked");
                }
            }
        }
    }

    const srcSelects = sourceRoot.querySelectorAll("select");
    const dstSelects = cloneRoot.querySelectorAll("select");
    for (let i = 0; i < srcSelects.length; i += 1) {
        const srcSel = srcSelects[i];
        const dstSel = dstSelects[i];
        if (!dstSel) {
            continue;
        }
        const selectedVal = srcSel.value;
        const dstOptions = dstSel.querySelectorAll("option");
        for (let j = 0; j < dstOptions.length; j += 1) {
            const opt = dstOptions[j];
            if (opt.value === selectedVal) {
                opt.setAttribute("selected", "selected");
            } else {
                opt.removeAttribute("selected");
            }
        }
    }
}

// params: options (required: { title (optional), subtitle (optional), icon (optional), content (optional), card (optional), buttons (optional: array), buttonLabel (optional), buttonDelay (optional), onDone (optional), source (optional), origin (optional), type (optional), palette (optional), speed (optional), pointerEvent (optional) })
function trSuccessWave(options) {
    const opts = options || {};
    const appEl = document.getElementById("app");
    const hasWave = typeof trDistortionWave === "function";
    if (!appEl || !hasWave) {
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
    appClone.classList.remove("anim-forward", "anim-back", "anim-root");
    trCopyFormState(appEl, appClone);

    const fromStage = trEl("div", "fullscreen-backdrop");
    fromStage.appendChild(appClone);

    const stage = trEl("div", "fullscreen-stage vbox center justify-center");
    const stageBody = trEl("div", "fullscreen-stage-body trSection section vbox space-xl");

    const iconGlyph = opts.icon === undefined ? TR_ICON_CHECK : opts.icon;
    if (iconGlyph) {
        const iconEl = trIcon(iconGlyph, { className: "as-display as-centered" });
        stageBody.appendChild(iconEl);
    }

    const headerWrap = trEl("div", "fullscreen-stage-header group vbox center space-t");
    const titleEl = trEl("p", "as-headline as-bold as-centered", opts.title || "Saved");
    headerWrap.appendChild(titleEl);

    if (opts.subtitle) {
        const subEl = trEl("p", "as-secondary as-gray as-centered", opts.subtitle);
        headerWrap.appendChild(subEl);
    }
    stageBody.appendChild(headerWrap);

    const stageContent = opts.content !== undefined ? opts.content : opts.card;
    if (stageContent) {
        const contentWrap = trEl("div", "fullscreen-stage-content group vbox space-l");
        trAppend(contentWrap, stageContent);
        stageBody.appendChild(contentWrap);
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

    const actionWrap = trEl("div", "fullscreen-stage-actions group vbox space-l");
    const actionButtons = [];
    if (Array.isArray(opts.buttons) && opts.buttons.length > 0) {
        for (let i = 0; i < opts.buttons.length; i += 1) {
            const entry = opts.buttons[i];
            let btnNode = null;
            if (entry instanceof HTMLElement) {
                btnNode = entry;
            } else {
                const btnOpts = Object.assign({}, entry);
                if (!btnOpts.onClick) {
                    btnOpts.onClick = finishTransition;
                }
                btnNode = trButton(btnOpts);
            }
            btnNode.classList.add("anim-rise-pending");
            actionWrap.appendChild(btnNode);
            actionButtons.push(btnNode);
        }
    } else {
        const continueBtn = trButton({
            label: opts.buttonLabel || "Continue",
            variant: "primary",
            onClick: finishTransition
        });
        continueBtn.classList.add("anim-rise-pending");
        actionWrap.appendChild(continueBtn);
        actionButtons.push(continueBtn);
    }
    stageBody.appendChild(actionWrap);
    stage.appendChild(stageBody);

    const waveOpts = {
        children: fromStage,
        revealedContent: stage,
        source: opts.source || null,
        origin: opts.origin || null,
        followCursor: opts.followCursor,
        type: opts.type || "center",
        palette: opts.palette || "metal",
        speed: typeof opts.speed === "number" ? opts.speed : 1,
        className: "is-fullscreen",
        cornerRadius: 0,
        onFinish: function () {
            const delayMs = opts.buttonDelay !== undefined ? trClampRiseDelay(opts.buttonDelay) : 0;
            for (let i = 0; i < actionButtons.length; i += 1) {
                const btnNode = actionButtons[i];
                btnNode.classList.remove("anim-rise-pending");
                btnNode.style.animationDelay = delayMs + "ms";
                btnNode.classList.add("anim-rise");
            }
        }
    };
    waveCtrl = trDistortionWave(waveOpts);
    document.body.appendChild(waveCtrl.el);
    waveCtrl.play(opts.pointerEvent || null);
    return waveCtrl;
}

// ive looked up on the internet on this one, hold snapshot of old page then warp straight into newly rendered target page
// params: options (required: { navigate (optional: function(done)), source (optional), type (optional), palette (optional), speed (optional), pointerEvent (optional), onFinish (optional) })
function trTransitionWave(options) {
    const opts = options || {};
    const appEl = document.getElementById("app");
    const hasWave = typeof trDistortionWave === "function";
    if (!appEl || !hasWave) {
        if (opts.navigate) {
            opts.navigate(function () {
                if (opts.onFinish) {
                    opts.onFinish();
                }
            });
        } else if (opts.onFinish) {
            opts.onFinish();
        }
        return;
    }

    const existingOverlay = document.querySelector(".distortion-wave.is-fullscreen");
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const fromClone = appEl.cloneNode(true);
    fromClone.removeAttribute("id");
    fromClone.classList.remove("anim-forward", "anim-back", "anim-root");
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
                origin: opts.origin || null,
                followCursor: opts.followCursor,
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

    fallbackTimer = setTimeout(launchWave, TR_WAVE_FALLBACK_MS);
    if (opts.navigate) {
        opts.navigate(launchWave);
    } else {
        launchWave();
    }
}
