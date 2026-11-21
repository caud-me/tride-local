# TRIDE UI Components Reference

Reusable vanilla DOM components in [components.js](components.js) styled by [style.css](style.css).

> **Rule:** Never nest a card inside another card (`trCard`, `trListCard`, `trEntityRow`, `trProfileCard` all render `.card` containers).

## DOM & Layout Helpers

- `trEl(tag, className, text)` — create an element with optional CSS class and text content.
- `trAppend(parent, children)` — append a single node or array of nodes safely.
- `trBindTap(node, handler)` — bind click plus `Enter`/`Space` keyboard activation with `role="button"` and `tabindex="0"`.
- `trSpacer()` — horizontal divider line (`1px`) used between rows inside `trListCard`.
- `trSectionHeading(text)` — lowercase section label above a card group.
- `trIcon(glyph, options)` — Segoe MDL2 Assets glyph (`options`: `{ label, className, onClick }`).

## Containers & Feedback

- `trCard(children, options)` — top-level rounded card (`options`: `{ layout, className, tag, onClick }`).
- `trListCard(items)` — wraps flat row components (`trPropertyRow`, `trActionRow`, `trCheckRow`) with `trSpacer()` dividers inside one `.card`. Do **not** pass `trEntityRow` or `trCard` into `trListCard`.
- `trFlatList(items)` — flat row list with `trSpacer()` dividers and no outer `.card` box (used inside `trSheet`).
- `trAlphaList(options)` — groups items alphabetically (`A`–`Z`) with `trSectionHeading(letter)` above each `trListCard` (`{ items, getLabel, renderRow }`).
- `trBanner(text)` — status/loading notice (`role="status"`).
- `trEmptyState(options)` — centered empty view (`{ icon, title, subtitle }`).
- `trHero(options)` — auth/OOBE header (`{ logoText, title }`).
- `trBrandLogo(options)` — standalone brand logo (`{ text, subtext, className }` or string, `24px` logo + optional `12px` subtext with `--tr-s` gap).
- `trBrandCard(options)` — `196px` 2x2 brand card for `DRIVER`, `OPERATOR`, `UNIT`, and `ASSOCIATION` (`{ logoText, subtext, topRight, title, subtitle, bottomRight, className, onClick }`).
- `trCardStack(options)` — overlapped card stack with required section heading (`{ heading, cards }`); expands on first tap and resets on re-render.

## Navigation & Menus

- `trNavBar(options)` — sticky top bar (`{ title, titleNode, onBack, actions }`).
- `trMenu(options)` — popover menu triggered by an icon button (`{ icon, label, sections: [{ name, title, items: [{ value, label, checked }], onChange }] }`).
- `trTabs(options)` — horizontal role/filter tabs (`{ items: [{ key, label }], activeKey, equal, onChange }`; `equal: true` removes scroll and gives each tab `flex: 1`).
- `trSearchBox(options)` — search input (`{ placeholder, value, onInput }`).

## Rows, Inputs & Actions

- `trButton(options)` — action button (`{ label, variant: "primary", small, critical, disabled, onClick }`).
- `trPropertyRow(options)` — label + input/select/display row for `trListCard` (`{ label, value, input, select, onClick }`); returns `{ controlEl, setError(msg), setValue(v) }`.
- `trActionRow(options)` — clickable list row with optional chevron (`{ label, subtitle, critical, hideChevron, onClick }`).
- `trCheckRow(options)` — checkbox row (`{ label, checked, onChange }`).
- `trEntityRow(options)` — standalone clickable `.card` row for lists (`{ title, image, subtitle, metaLines, mutedLast, onClick }`).
- `trProfileCard(data)` — member profile summary card (`{ firstName, lastName, address, contact, todaName, license }`).
- `trStatGroup(stats)` — row of metric tiles (`[{ value, label }]`).
- `trStoryBar(options)` — horizontal quick-select strip (`{ items, activeKey, onSelect }`).

## Modals & Sheets

- `trSheet(options)` — modal/bottom sheet with pinned header, scrollable body, and pinned footer (`{ title, description, headerExtra, body, footer, removeOnClose, onClose }`); returns `{ el, open(), close() }`.
- `trConfirm(options)` — confirmation dialog (`{ title, message, confirmLabel, critical, onConfirm }`).
- `trAlert(options)` — single-button alert dialog (`{ title, message }`).

## Distortion Wave Transitions

Styled by [distortion-wave.css](distortion-wave.css) and implemented in [distortion-wave.js](distortion-wave.js):

- `trDistortionWave(options)` — WebGL2 refractive wave transition container (`{ children, revealedContent, source, origin: { x, y }, type: "center" | "vertical" | "horizontal", palette: "colorful" | "metal" | "monochromatic" | "green" | "ocean" | "sunset" | "#hex", speed, className, cornerRadius, onFinish }`); returns `{ el, play(event), reverse(event), reset(), prepare(), setRevealed(), setType(), setPalette(), setOrigin(), setSpeed(), setStyle() }`.
- `trSuccessWave(options)` — fullscreen confirmation stage (`{ badge, title, subtitle, card, buttonLabel, palette, type, speed, source, pointerEvent, onDone }`) revealing a newly created record card before running `onDone`.
- `trTransitionWave(options)` — morphs directly from the active screen into the next route (`{ palette, type, speed, source, pointerEvent, navigate(onReady), onFinish }`) with no intermediate gate.
