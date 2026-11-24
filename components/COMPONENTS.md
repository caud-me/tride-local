# TRIDE UI Components Reference

Reusable vanilla DOM components in [components.js](components.js) styled by [styleNext.css](styleNext.css) (or `style.css` in synced projects).

> **Rule:** Never nest a `.card` inside another `.card` (`trCard`, `trListCard`, `trEntityRow`, `trProfileCard`, `trBrandCard`, and `trStatGroup` all render `.card` containers). Never place a `trButton` inside a `trCard`.

## DOM & Layout Helpers

- `trEl(tag, className, text)` — create an element with optional CSS class and text content.
- `trAppend(parent, children)` — append a single node, nested array, or string (`<p>`) safely.
- `trBindTap(node, handler)` — bind click plus `Enter`/`Space` keyboard activation with `role="button"` and `tabindex="0"`.
- `trSpacer()` — horizontal divider line (`1px`, `role="separator"`) used between rows inside `trListCard`.
- `trSectionHeading(text)` — `.as-cardheadline.as-tertiary.as-gray.as-bold` label above a card group.
- `trIcon(glyph, options)` — Segoe Fluent / MDL2 glyph (`{ size: "big", label, className, onClick }`); wraps in `<button type="button">` when `onClick` is supplied.
- `trClampRiseDelay(rawDelay)` — clamps entrance rise delay within safe bounds.

## Containers & Feedback

- `trSection(children, options)` — top-level `<section class="trSection section vbox space-l">` inside `.content.vbox.space-xl` (`{ flex, className, label }`).
- `trCard(children, options)` — base `.card` container (`{ layout, className, tag, onClick }`).
- `trCardGroup(options)` — wraps a card in `.group.vbox.space-m` with optional headline and footnote (`{ headline, card, footnote }`).
- `trRise(children, options)` — entrance wrapper animating from `--tr-rise-distance` below (`{ delay, className }`).
- `trListCard(items)` — wraps flat rows (`trPropertyRow`, `trActionRow`, `trCheckRow`, `trListItem`) separated by `trSpacer()` inside one `.card`.
- `trAlphaList(options)` — groups items alphabetically (`A`–`Z`, `#` fallback) into `trCardGroup` + `trListCard` (`{ items, getLabel, renderRow, onItemClick }`).
- `trStoryBar(options)` — segmented progress bar (`{ total, current }`, clamped to `[0, total]`).
- `trEmptyState(options)` — centered empty/loading/error state (`{ icon, title, subtitle }`).
- `trBrandLogo(options)` — standalone brand wordmark (`{ text, subtext, sub, className }` or string). Use strictly for the brand name.
- `trBrandCard(options)` — `196px` 2x2 brand card (`{ logoText, subtext, topRight, title, subtitle, bottomRight, big, className, onClick }`).
- `trCardStack(options)` — stacked expandable card list (`{ heading, cards }`).

## Navigation & Menus

- `trNavBar(options)` — sticky top bar (`{ title, subtitle, titleNode, onBack, actions }`).
- `trMenu(options)` / `trPopupMenu(options)` — anchored radio popover menu (`{ icon, label, sections, groups }`), auto-cleans detached listeners and closes on `Escape`.
- `trTabbed(options)` / `trTabs(options)` — horizontal tab strip strictly for switching page views or panels (`{ items, tabs, activeKey, activeValue, equal, stretch, label, onChange }`); pairs with `trAnimateTabSwitch(panel, direction)`.
- `trSearchBox(options)` — pill search card (`{ placeholder, value, label, onInput }`).

## Rows, Inputs & Actions

- `trButton(options)` — action button (`{ label, icon, variant: "standard" | "primary", size: "m" | "l", small, critical, disabled, animate, className, onClick }`). Place outside cards as sibling controls or in sheet footers.
- `trPropertyRow(options)` — label + input/select/display row for `trListCard` (`{ id, label, value, input, select, error }`); returns `{ controlEl, setError(msg) }`.
- `trListItem(options)` — static `.as-primary` + `.as-secondary.as-gray` row for `trListCard` (`{ title, subtitle, index, step, onClick }`); pass `index` or `step` for a vertically centered `.hbox.space-m` numbered row with `.list-index`.
- `trActionRow(options)` — clickable list row with optional chevron (`{ label, subtitle, hideChevron, critical, disabled, onClick }`).
- `trCheckRow(options)` — checkbox row (`{ title, subtitle, checked, disabled, onChange }`).
- `trRadioGroup(options)` — mutually exclusive radio `trListCard` (`{ items: [{ value, title, subtitle, disabled }], value, name, label, onChange }`); returns `{ getValue(), setValue(val) }`. Use instead of `trTabbed` for form or setup option selection.
- `trEntityRow(options)` — standalone clickable `.card` row (`{ title, subtitle, metaLines, mutedLast, onClick }`).
- `trProfileCard(options)` — `196px` 2-column summary card (`{ greeting, name, leftDetails, rightDetails }`).
- `trStatGroup(stats, options)` — row of metric tiles (`[{ value, label }]`, `{ label }`).

## Modals & Sheets

- `trSheet(options)` — 4-part bottom sheet / desktop dialog (`{ title, description, footnote, icon, headerExtra, body, content, footer, buttons, children, removeOnClose, onClose }`); supports `Escape` close and double-close guard; returns `{ el, open(), close() }`.
- `trConfirm(options)` — confirm/cancel sheet (`{ title, description, footnote, confirmLabel, cancelLabel, critical, onConfirm, onCancel }`).
- `trAlert(options)` — single-button notice sheet (`{ title, description, footnote, okLabel, onOk }`).

## Distortion Wave Transitions

Styled by [distortion-wave.css](distortion-wave.css) and implemented in [distortion-wave.js](distortion-wave.js) (tuner available in `playground.html`):

- `trDistortionWave(options)` — WebGL2 refractive reveal (`{ children, revealedContent, source, origin: { x, y }, type: "center" | "vertical" | "horizontal", palette: "colorful" | "metal" | "monochromatic" | "green" | "ocean" | "sunset" | "#hex", speed, waveStyle, className, cornerRadius, onFinish }`); returns `{ el, play(event), reverse(event), reset(), prepare(), setRevealed(), setType(), setPalette(), setOrigin(), setSpeed(), setStyle() }`.
- `trSuccessWave(options)` — fullscreen confirmation stage (`{ title, subtitle, icon, content, card, buttons, buttonLabel, buttonDelay, palette, type, speed, source, origin, pointerEvent, onDone }`); uses zero-flicker DOM-to-WebGL handoff (`<html xmlns>` snapshot + instant canvas cut) and supports reversible `WAVE_AIRDROP_EXPERIMENTAL` motion.
- `trTransitionWave(options)` — morphs directly from the active screen into the next route (`{ palette, type, speed, source, origin, pointerEvent, navigate(onReady), onFinish }`).
