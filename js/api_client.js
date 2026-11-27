/* offline api client facade matching version-webapp/public/js/api_client.js 1:1 */

// params: queryMap (optional: object of key-value pairs)
function buildQuerySuffix(queryMap) {
    if (!queryMap) {
        return "";
    }
    const params = new URLSearchParams();
    const keys = Object.keys(queryMap);
    const keyCount = keys.length;
    for (let i = 0; i < keyCount; i += 1) {
        const key = keys[i];
        const val = queryMap[key];
        if (val !== undefined && val !== null && val !== "" && val !== "all") {
            const valStr = String(val);
            params.set(key, valStr);
        }
    }
    const qs = params.toString();
    if (!qs) {
        return "";
    }
    return "?" + qs;
}

// params: method (required), path (required), body (optional)
async function apiRequest(method, path, body) {
    const result = routeLocalApiRequest(method, path, body);
    return result;
}

/* system and auth endpoints */

// params: none
function apiStatus() {
    return apiRequest("GET", "/status");
}

// params: refresh (optional: boolean)
function apiSchema(refresh) {
    let suffix = "";
    if (refresh) {
        suffix = "?refresh=1";
    }
    return apiRequest("GET", "/schema" + suffix);
}

// params: payload (required: object)
function apiOobe(payload) {
    return apiRequest("POST", "/oobe", payload);
}

// params: memberId (optional)
function apiReset(memberId) {
    return apiRequest("POST", "/reset", { Member_ID: memberId || "" });
}

// params: none
function apiSeedSampleData() {
    return apiRequest("POST", "/seed");
}

// params: memberId (required), portal (optional: "member" | "admin")
function apiLogin(memberId, portal) {
    const payload = { Member_ID: memberId };
    if (portal) {
        payload.portal = portal;
    }
    return apiRequest("POST", "/login", payload);
}

// params: memberId (required)
function apiHome(memberId) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("GET", "/home/" + safeId);
}

// params: todaId (optional)
function apiExport(todaId) {
    const suffix = buildQuerySuffix({ todaId: todaId });
    return apiRequest("GET", "/export" + suffix);
}

/* federation endpoints */

// params: none
function apiListFederations() {
    return apiRequest("GET", "/federations");
}

// params: federationId (required)
function apiGetFederation(federationId) {
    const safeId = encodeURIComponent(federationId);
    return apiRequest("GET", "/federations/" + safeId);
}

// params: payload (required)
function apiCreateFederation(payload) {
    return apiRequest("POST", "/federations", payload);
}

// params: federationId (required), payload (required)
function apiUpdateFederation(federationId, payload) {
    const safeId = encodeURIComponent(federationId);
    return apiRequest("PUT", "/federations/" + safeId, payload);
}

// params: federationId (required)
function apiDeleteFederation(federationId) {
    const safeId = encodeURIComponent(federationId);
    return apiRequest("DELETE", "/federations/" + safeId);
}

/* toda association endpoints */

// params: filters (optional: { federationId, status, q })
function apiListTodas(filters) {
    const suffix = buildQuerySuffix(filters);
    return apiRequest("GET", "/todas" + suffix);
}

// params: todaId (required)
function apiGetToda(todaId) {
    const safeId = encodeURIComponent(todaId);
    return apiRequest("GET", "/todas/" + safeId);
}

// params: payload (required)
function apiCreateToda(payload) {
    return apiRequest("POST", "/todas", payload);
}

// params: todaId (required), payload (required)
function apiUpdateToda(todaId, payload) {
    const safeId = encodeURIComponent(todaId);
    return apiRequest("PUT", "/todas/" + safeId, payload);
}

// params: todaId (required)
function apiDeleteToda(todaId) {
    const safeId = encodeURIComponent(todaId);
    return apiRequest("DELETE", "/todas/" + safeId);
}

/* member and driver endpoints */

// params: filters (optional: { todaId, barangay, q, sort, licensedOnly, role })
function apiListMembers(filters) {
    const q = filters || {};
    const queryMap = {
        todaId: q.todaId,
        barangay: q.barangay,
        q: q.q,
        sort: q.sort,
        role: q.role
    };
    if (q.licensedOnly) {
        queryMap.licensedOnly = "1";
    }
    const suffix = buildQuerySuffix(queryMap);
    return apiRequest("GET", "/members" + suffix);
}

// params: todaId (optional)
function apiListDrivers(todaId) {
    const suffix = buildQuerySuffix({ todaId: todaId });
    return apiRequest("GET", "/drivers" + suffix);
}

// params: memberId (required)
function apiGetMember(memberId) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("GET", "/members/" + safeId);
}

// params: payload (required)
function apiCreateMember(payload) {
    return apiRequest("POST", "/members", payload);
}

// params: memberId (required), payload (required)
function apiUpdateMember(memberId, payload) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("PUT", "/members/" + safeId, payload);
}

// params: memberId (required), todaId (required)
function apiUpdateMemberToda(memberId, todaId) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("PUT", "/members/" + safeId + "/toda", { TODA_ID: todaId });
}

// params: memberId (required)
function apiDeleteMember(memberId) {
    const safeId = encodeURIComponent(memberId);
    return apiRequest("DELETE", "/members/" + safeId);
}

/* tricycle endpoints (keyed by Tricycle_ID) */

// params: filters (optional: { todaId, ownerId, driverId, colorZone, status, q })
function apiListTricycles(filters) {
    const suffix = buildQuerySuffix(filters);
    return apiRequest("GET", "/tricycles" + suffix);
}

// params: tricycleId (required)
function apiGetTricycle(tricycleId) {
    const safeId = encodeURIComponent(tricycleId);
    return apiRequest("GET", "/tricycles/" + safeId);
}

// params: payload (required)
function apiCreateTricycle(payload) {
    return apiRequest("POST", "/tricycles", payload);
}

// params: tricycleId (required), payload (required)
function apiUpdateTricycle(tricycleId, payload) {
    const safeId = encodeURIComponent(tricycleId);
    return apiRequest("PUT", "/tricycles/" + safeId, payload);
}

// params: tricycleId (required)
function apiDeleteTricycle(tricycleId) {
    const safeId = encodeURIComponent(tricycleId);
    return apiRequest("DELETE", "/tricycles/" + safeId);
}

/* driver assignment endpoints */

// params: filters (optional: { tricycleId, memberId, todaId, status, driverRole })
function apiListAssignments(filters) {
    const suffix = buildQuerySuffix(filters);
    return apiRequest("GET", "/assignments" + suffix);
}

// params: assignmentId (required)
function apiGetAssignment(assignmentId) {
    const safeId = encodeURIComponent(assignmentId);
    return apiRequest("GET", "/assignments/" + safeId);
}

// params: payload (required)
function apiCreateAssignment(payload) {
    return apiRequest("POST", "/assignments", payload);
}

// params: assignmentId (required), payload (required)
function apiUpdateAssignment(assignmentId, payload) {
    const safeId = encodeURIComponent(assignmentId);
    return apiRequest("PUT", "/assignments/" + safeId, payload);
}

// params: assignmentId (required)
function apiDeleteAssignment(assignmentId) {
    const safeId = encodeURIComponent(assignmentId);
    return apiRequest("DELETE", "/assignments/" + safeId);
}

/* officer term endpoints */

// params: filters (optional: { todaId, memberId, position, activeOnly })
function apiListOfficerTerms(filters) {
    const q = filters || {};
    const queryMap = {
        todaId: q.todaId,
        memberId: q.memberId,
        position: q.position
    };
    if (q.activeOnly) {
        queryMap.activeOnly = "1";
    }
    const suffix = buildQuerySuffix(queryMap);
    return apiRequest("GET", "/officer-terms" + suffix);
}

// params: termId (required)
function apiGetOfficerTerm(termId) {
    const safeId = encodeURIComponent(termId);
    return apiRequest("GET", "/officer-terms/" + safeId);
}

// params: payload (required)
function apiCreateOfficerTerm(payload) {
    return apiRequest("POST", "/officer-terms", payload);
}

// params: termId (required), payload (required)
function apiUpdateOfficerTerm(termId, payload) {
    const safeId = encodeURIComponent(termId);
    return apiRequest("PUT", "/officer-terms/" + safeId, payload);
}

// params: termId (required)
function apiDeleteOfficerTerm(termId) {
    const safeId = encodeURIComponent(termId);
    return apiRequest("DELETE", "/officer-terms/" + safeId);
}

/* notification endpoints */

// params: none
function apiListNotifications() {
    return apiRequest("GET", "/notifications");
}

// params: notificationId (required)
function apiMarkNotificationRead(notificationId) {
    const safeId = encodeURIComponent(notificationId);
    return apiRequest("PUT", "/notifications/" + safeId + "/read");
}

// params: none
function apiMarkAllNotificationsRead() {
    return apiRequest("PUT", "/notifications/read-all");
}
