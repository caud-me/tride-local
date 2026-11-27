/* member portal entry point */

// params: none
async function startApp() {
    try {
        const status = await apiStatus();
        if (status.setupRequired) {
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
        const emptyNode = trEmptyState({
            icon: "\uE783",
            title: "Cannot reach backend",
            subtitle: err.message
        });
        appRoot.appendChild(emptyNode);
    }
}

// ive looked up on the internet on this one, DOMContentLoaded wait until HTML elements finish loading before starting the screen
document.addEventListener("DOMContentLoaded", startApp);
