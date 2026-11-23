const pageStack = [];
let navEpoch = Date.now();

function canUseHistory() {
    if (typeof window === "undefined") {
        return false;
    }
    if (!window.history || typeof window.history.pushState !== "function") {
        return false;
    }
    return true;
}

function syncHistoryState(mode) {
    if (!canUseHistory()) {
        return;
    }
    const depth = pageStack.length > 0 ? pageStack.length - 1 : 0;
    const stateObj = {
        trideEpoch: navEpoch,
        trideDepth: depth
    };
    try {
        if (mode === "push") {
            window.history.pushState(stateObj, "");
        } else {
            window.history.replaceState(stateObj, "");
        }
    } catch (err) {
        /* ignore restricted history environments */
    }
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("popstate", function (event) {
        const openSheet = document.querySelector(".sheet-backdrop:not(.hidden)");
        if (openSheet) {
            openSheet.classList.add("hidden");
            setTimeout(function () {
                if (openSheet.parentNode) {
                    openSheet.parentNode.removeChild(openSheet);
                }
            }, 220);
            syncHistoryState("push");
            return;
        }
        const st = event.state;
        if (pageStack.length <= 1) {
            return;
        }
        if (!st || st.trideEpoch !== navEpoch) {
            pageStack.pop();
            renderTopPage("back");
            syncHistoryState("replace");
            return;
        }
        const targetLen = st.trideDepth + 1;
        if (targetLen < pageStack.length && targetLen >= 1) {
            while (pageStack.length > targetLen) {
                pageStack.pop();
            }
            renderTopPage("back");
        } else if (targetLen > pageStack.length) {
            syncHistoryState("replace");
        }
    });
}

function getAppRoot() {
    const root = document.getElementById("app");
    return root;
}

function renderTopPage(direction) {
    const stackCount = pageStack.length;
    if (stackCount === 0) {
        return;
    }

    const appRoot = getAppRoot();
    if (!appRoot) {
        return;
    }

    const lingeringSheets = document.querySelectorAll(".sheet-backdrop");
    for (let i = 0; i < lingeringSheets.length; i += 1) {
        lingeringSheets[i].remove();
    }

    const topIndex = stackCount - 1;
    const activeEntry = pageStack[topIndex];
    const renderFn = activeEntry.render;
    const entryParams = activeEntry.params;

    appRoot.classList.remove("anim-forward", "anim-back", "anim-root");

    // ive looked up on the internet on this one, replaceChildren wipe old screen elements before placing the next screen
    appRoot.replaceChildren();

    const screenOutput = renderFn(entryParams);
    trAppend(appRoot, screenOutput);
    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
        window.scrollTo(0, 0);
    }

    if (direction && direction !== "none") {
        // ive looked up on the internet on this one, offsetWidth read force browser reflow so CSS animation replay on each step
        void appRoot.offsetWidth;
        appRoot.classList.add("anim-" + direction);
    }
}

function setRootPage(renderFn, params) {
    let safeParams = params;
    if (!safeParams) {
        safeParams = {};
    }

    // based on brain/my-knowledge.md, initial landing gate, clear the whole stack so the screen start fresh at the root
    navEpoch = navEpoch + 1;
    pageStack.length = 0;

    const entry = {
        render: renderFn,
        params: safeParams
    };
    pageStack.push(entry);
    syncHistoryState("replace");

    renderTopPage("root");
}

function pushPage(renderFn, params) {
    let safeParams = params;
    if (!safeParams) {
        safeParams = {};
    }

    const entry = {
        render: renderFn,
        params: safeParams
    };
    pageStack.push(entry);
    syncHistoryState("push");

    renderTopPage("forward");
}

function popPage() {
    const stackCount = pageStack.length;
    if (stackCount <= 1) {
        return;
    }

    if (canUseHistory()) {
        const curState = window.history.state;
        const hasSynced = curState && curState.trideEpoch === navEpoch && curState.trideDepth > 0;
        if (hasSynced) {
            window.history.back();
            return;
        }
    }

    // ive looked up on the internet on this one, array pop remove the last saved screen from the stack
    pageStack.pop();
    syncHistoryState("replace");

    renderTopPage("back");
}

function replaceTopPage(renderFn, params) {
    let safeParams = params;
    if (!safeParams) {
        safeParams = {};
    }

    const stackCount = pageStack.length;
    const entry = {
        render: renderFn,
        params: safeParams
    };

    if (stackCount === 0) {
        pageStack.push(entry);
    } else {
        pageStack[stackCount - 1] = entry;
    }
    syncHistoryState("replace");

    renderTopPage("forward");
}

function refreshPage() {
    renderTopPage("none");
}
