/* modular notifications UI for shift assignments and officer term notices */

const NOTIF_EMPTY_TITLE = "No notifications yet";
const NOTIF_EMPTY_SUBTITLE = "Updates such as shift assignments and officer appointments appear here.";

// params: none
function createNotificationBellButton() {
    const bellBtn = trIcon("\uEA8F", {
        label: "Notifications",
        className: "notif-bell",
        onClick: function () {
            pushPage(renderNotificationsPage, {});
        }
    });

    const dot = trEl("span", "notif-dot hidden", "");
    dot.setAttribute("aria-hidden", "true");
    bellBtn.appendChild(dot);

    apiListNotifications().then(function (data) {
        if (data && data.unreadCount > 0) {
            dot.classList.remove("hidden");
        }
    }).catch(function () {
        /* ignore if offline or unauthenticated */
    });

    return bellBtn;
}

// params: allRead (required: boolean), onMarkedRead (optional: function)
function buildHeaderMoreMenu(allRead, onMarkedRead) {
    return trMenu({
        icon: "\uE712",
        label: "Notification options",
        sections: [
            {
                name: "ntf-header-actions",
                items: [
                    {
                        value: "read-all",
                        label: "Mark all as read",
                        checked: false,
                        disabled: allRead
                    }
                ],
                onChange: async function (val) {
                    if (val === "read-all") {
                        try {
                            await apiMarkAllNotificationsRead();
                            if (onMarkedRead) {
                                onMarkedRead();
                            }
                        } catch (err) {
                            trAlert({ title: "Error", message: err.message });
                        }
                    }
                }
            }
        ]
    });
}

// params: none
function renderNotificationsPage() {
    const main = trEl("main", "content vbox space-xl");
    const menuSlot = trEl("div", "hbox align-center");

    function updateHeaderMenu(allRead) {
        menuSlot.replaceChildren();
        const menuNode = buildHeaderMoreMenu(allRead, loadFeed);
        menuSlot.appendChild(menuNode);
    }

    function loadFeed() {
        main.replaceChildren();
        const loadingText = trEl("p", "as-tertiary as-gray", "Loading notifications...");
        main.appendChild(loadingText);

        apiListNotifications().then(function (data) {
            main.replaceChildren();
            const items = data.notifications || [];
            const unreadCount = data.unreadCount || 0;
            updateHeaderMenu(unreadCount === 0);

            if (items.length === 0) {
                const emptyView = trEmptyState({
                    icon: "\uEA8F",
                    title: NOTIF_EMPTY_TITLE,
                    subtitle: NOTIF_EMPTY_SUBTITLE
                });
                const emptySec = trSection(emptyView, { flex: true });
                main.appendChild(emptySec);
                return;
            }

            const rows = [];
            const itemCount = items.length;
            for (let i = 0; i < itemCount; i += 1) {
                const item = items[i];
                const row = trEl("div", "vbox space-s");
                let titleCls = "as-primary";
                if (item.isRead) {
                    titleCls = "as-primary as-gray";
                }
                const titleEl = trEl("p", titleCls, item.title);
                const msgEl = trEl("p", "as-secondary as-gray", item.message);
                row.appendChild(titleEl);
                row.appendChild(msgEl);

                if (!item.isRead) {
                    trBindTap(row, async function () {
                        try {
                            await apiMarkNotificationRead(item.id);
                            loadFeed();
                        } catch (err) {
                            trAlert({ title: "Error", message: err.message });
                        }
                    });
                }
                rows.push(row);
            }
            const feedCard = trListCard(rows);
            const feedGroup = trCardGroup({
                headline: "Recent updates",
                card: feedCard,
                footnote: "Tap an unread notice to mark it as read."
            });
            const feedSec = trSection(feedGroup);
            main.appendChild(feedSec);
        }).catch(function (err) {
            main.replaceChildren();
            const errEmpty = trEmptyState({
                icon: "\uE783",
                title: "Could not load notifications",
                subtitle: err.message
            });
            const errSec = trSection(errEmpty, { flex: true });
            main.appendChild(errSec);
        });
    }

    updateHeaderMenu(true);
    const navBar = trNavBar({
        title: "Notifications",
        onBack: popPage,
        actions: [menuSlot]
    });

    loadFeed();
    return [navBar, main];
}
