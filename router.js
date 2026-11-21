const pageStack = [];

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

    const topIndex = stackCount - 1;
    const activeEntry = pageStack[topIndex];
    const renderFn = activeEntry.render;
    const entryParams = activeEntry.params;

    appRoot.classList.remove("anim-forward", "anim-back", "anim-root");

    // ive looked up on the internet on this one, replaceChildren wipe old screen elements before placing the next screen
    appRoot.replaceChildren();

    const screenOutput = renderFn(entryParams);
    trAppend(appRoot, screenOutput);

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
    pageStack.length = 0;

    const entry = {
        render: renderFn,
        params: safeParams
    };
    pageStack.push(entry);

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

    renderTopPage("forward");
}

function popPage() {
    const stackCount = pageStack.length;
    if (stackCount <= 1) {
        return;
    }

    // ive looked up on the internet on this one, array pop remove the last saved screen from the stack
    pageStack.pop();

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

    renderTopPage("forward");
}

function refreshPage() {
    renderTopPage("none");
}
