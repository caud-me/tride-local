/* app entry point */

async function startApp() {
    try {
        const status = await apiGetStatus();
        if (status.oobeRequired) {
            setSessionMemberId(null);
            setRootPage(renderOobePage, {});
            return;
        }
        const savedId = getSessionMemberId();
        if (savedId) {
            setRootPage(renderHomePage, { activeRole: null });
            return;
        }
        setRootPage(renderLoginPage, {});
    } catch (err) {
        const appRoot = document.getElementById("app");
        appRoot.replaceChildren();
        appRoot.appendChild(trEmptyState({
            icon: "\uE783",
            title: "Cannot reach backend",
            subtitle: err.message
        }));
    }
}

// ive looked up on the internet on this one, DOMContentLoaded wait until HTML elements finish loading before starting the screen
document.addEventListener("DOMContentLoaded", startApp);
