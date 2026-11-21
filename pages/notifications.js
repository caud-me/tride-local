/* modular notifications UI (safe to remove without breaking core pages) */

function apiListNotifications() {
    return apiRequest("GET", "/notifications");
}

function apiMarkNotificationRead(id) {
    const safeId = encodeURIComponent(id);
    return apiRequest("PUT", "/notifications/" + safeId + "/read");
}

function apiMarkAllNotificationsRead() {
    return apiRequest("PUT", "/notifications/read-all");
}

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
                        label: "Mark as read",
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

function renderNotificationsPage() {
    const main = trEl("main", "content vbox gap-m");
    const menuSlot = trEl("div", "hbox align-center");

    function updateHeaderMenu(allRead) {
        menuSlot.replaceChildren();
        menuSlot.appendChild(buildHeaderMoreMenu(allRead, loadFeed));
    }

    function loadFeed() {
        main.replaceChildren();
        main.appendChild(trBanner("Loading notifications..."));

        apiListNotifications().then(function (data) {
            main.replaceChildren();
            const items = data.notifications || [];
            const unreadCount = data.unreadCount || 0;
            updateHeaderMenu(unreadCount === 0);

            if (items.length === 0) {
                const emptyView = trEmptyState({
                    icon: "\uEA8F",
                    title: "No notifications yet",
                    subtitle: "Updates such as tricycle assignments will appear here."
                });
                main.appendChild(emptyView);
                return;
            }

            const rows = [];
            for (let i = 0; i < items.length; i += 1) {
                const item = items[i];
                const row = trEl("div", "vbox gap-xs");
                const titleCls = item.isRead ? "as-gray" : "";
                row.appendChild(trEl("p", titleCls, item.title));
                row.appendChild(trEl("small", "as-gray", item.message));

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
            main.appendChild(trListCard(rows));
        }).catch(function (err) {
            main.replaceChildren();
            main.appendChild(trBanner(err.message));
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
