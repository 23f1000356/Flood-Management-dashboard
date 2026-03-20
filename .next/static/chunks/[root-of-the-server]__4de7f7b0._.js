(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s({
    "connect": ()=>connect,
    "setHooks": ()=>setHooks,
    "subscribeToUpdate": ()=>subscribeToUpdate
});
function connect(param) {
    let { addMessageListener, sendMessage, onUpdateError = console.error } = param;
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: (param)=>{
            let [chunkPath, callback] = param;
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        var _updateA_modules;
        const deletedModules = new Set((_updateA_modules = updateA.modules) !== null && _updateA_modules !== void 0 ? _updateA_modules : []);
        var _updateB_modules;
        const addedModules = new Set((_updateB_modules = updateB.modules) !== null && _updateB_modules !== void 0 ? _updateB_modules : []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        var _updateA_added, _updateB_added;
        const added = new Set([
            ...(_updateA_added = updateA.added) !== null && _updateA_added !== void 0 ? _updateA_added : [],
            ...(_updateB_added = updateB.added) !== null && _updateB_added !== void 0 ? _updateB_added : []
        ]);
        var _updateA_deleted, _updateB_deleted;
        const deleted = new Set([
            ...(_updateA_deleted = updateA.deleted) !== null && _updateA_deleted !== void 0 ? _updateA_deleted : [],
            ...(_updateB_deleted = updateB.deleted) !== null && _updateB_deleted !== void 0 ? _updateB_deleted : []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        var _updateA_modules1, _updateB_added1;
        const modules = new Set([
            ...(_updateA_modules1 = updateA.modules) !== null && _updateA_modules1 !== void 0 ? _updateA_modules1 : [],
            ...(_updateB_added1 = updateB.added) !== null && _updateB_added1 !== void 0 ? _updateB_added1 : []
        ]);
        var _updateB_deleted1;
        for (const moduleId of (_updateB_deleted1 = updateB.deleted) !== null && _updateB_deleted1 !== void 0 ? _updateB_deleted1 : []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        var _updateB_modules1;
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set((_updateB_modules1 = updateB.modules) !== null && _updateB_modules1 !== void 0 ? _updateB_modules1 : []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error("Invariant: ".concat(message));
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/pages/index.module.css [client] (css module)": ((__turbopack_context__) => {

__turbopack_context__.v({
  "active": "index-module__KWKY6G__active",
  "bar": "index-module__KWKY6G__bar",
  "bounce": "index-module__KWKY6G__bounce",
  "btn": "index-module__KWKY6G__btn",
  "btnPrimary": "index-module__KWKY6G__btnPrimary",
  "btnSecondary": "index-module__KWKY6G__btnSecondary",
  "btnWave": "index-module__KWKY6G__btnWave",
  "container": "index-module__KWKY6G__container",
  "fadeInUp": "index-module__KWKY6G__fadeInUp",
  "featureArrow": "index-module__KWKY6G__featureArrow",
  "featureCard": "index-module__KWKY6G__featureCard",
  "featureContent": "index-module__KWKY6G__featureContent",
  "featureDetails": "index-module__KWKY6G__featureDetails",
  "featureIcon": "index-module__KWKY6G__featureIcon",
  "featuresGrid": "index-module__KWKY6G__featuresGrid",
  "featuresSection": "index-module__KWKY6G__featuresSection",
  "footer": "index-module__KWKY6G__footer",
  "footerBottom": "index-module__KWKY6G__footerBottom",
  "footerColumn": "index-module__KWKY6G__footerColumn",
  "footerContainer": "index-module__KWKY6G__footerContainer",
  "footerExtra": "index-module__KWKY6G__footerExtra",
  "footerJoin": "index-module__KWKY6G__footerJoin",
  "footerLinks": "index-module__KWKY6G__footerLinks",
  "footerMission": "index-module__KWKY6G__footerMission",
  "footerSection": "index-module__KWKY6G__footerSection",
  "footerSocial": "index-module__KWKY6G__footerSocial",
  "gradient": "index-module__KWKY6G__gradient",
  "hamburger": "index-module__KWKY6G__hamburger",
  "hero": "index-module__KWKY6G__hero",
  "heroButtons": "index-module__KWKY6G__heroButtons",
  "heroContent": "index-module__KWKY6G__heroContent",
  "heroSubtitle": "index-module__KWKY6G__heroSubtitle",
  "heroTitle": "index-module__KWKY6G__heroTitle",
  "imageSlider": "index-module__KWKY6G__imageSlider",
  "joinArrow": "index-module__KWKY6G__joinArrow",
  "joinBtn": "index-module__KWKY6G__joinBtn",
  "liveBadge": "index-module__KWKY6G__liveBadge",
  "loginBtn": "index-module__KWKY6G__loginBtn",
  "logoIcon": "index-module__KWKY6G__logoIcon",
  "navContainer": "index-module__KWKY6G__navContainer",
  "navDot": "index-module__KWKY6G__navDot",
  "navItem": "index-module__KWKY6G__navItem",
  "navLink": "index-module__KWKY6G__navLink",
  "navLogo": "index-module__KWKY6G__navLogo",
  "navMenu": "index-module__KWKY6G__navMenu",
  "navbar": "index-module__KWKY6G__navbar",
  "parallaxBg": "index-module__KWKY6G__parallaxBg",
  "pulse": "index-module__KWKY6G__pulse",
  "scrollArrow": "index-module__KWKY6G__scrollArrow",
  "scrollIndicator": "index-module__KWKY6G__scrollIndicator",
  "sectionTitle": "index-module__KWKY6G__sectionTitle",
  "slide": "index-module__KWKY6G__slide",
  "slideContent": "index-module__KWKY6G__slideContent",
  "sliderContainer": "index-module__KWKY6G__sliderContainer",
  "sliderNav": "index-module__KWKY6G__sliderNav",
  "socialIcon": "index-module__KWKY6G__socialIcon",
  "socialIcons": "index-module__KWKY6G__socialIcons",
  "wave": "index-module__KWKY6G__wave",
  "wave1": "index-module__KWKY6G__wave1",
  "wave2": "index-module__KWKY6G__wave2",
  "wave3": "index-module__KWKY6G__wave3",
  "waveContainer": "index-module__KWKY6G__waveContainer",
  "waveContent": "index-module__KWKY6G__waveContent",
  "waveSection": "index-module__KWKY6G__waveSection",
});
}),
"[project]/pages/user.module.css [client] (css module)": ((__turbopack_context__) => {

__turbopack_context__.v({
  "active": "user-module__-1Y2kW__active",
  "aidCard": "user-module__-1Y2kW__aidCard",
  "aidOptions": "user-module__-1Y2kW__aidOptions",
  "alertCard": "user-module__-1Y2kW__alertCard",
  "alertHigh": "user-module__-1Y2kW__alertHigh",
  "alertHistory": "user-module__-1Y2kW__alertHistory",
  "alertItem": "user-module__-1Y2kW__alertItem",
  "alertTime": "user-module__-1Y2kW__alertTime",
  "amountBtn": "user-module__-1Y2kW__amountBtn",
  "applyBtn": "user-module__-1Y2kW__applyBtn",
  "available": "user-module__-1Y2kW__available",
  "chatBot": "user-module__-1Y2kW__chatBot",
  "chatContainer": "user-module__-1Y2kW__chatContainer",
  "chatInput": "user-module__-1Y2kW__chatInput",
  "chatMessage": "user-module__-1Y2kW__chatMessage",
  "closed": "user-module__-1Y2kW__closed",
  "communityReports": "user-module__-1Y2kW__communityReports",
  "compensationSection": "user-module__-1Y2kW__compensationSection",
  "contactCard": "user-module__-1Y2kW__contactCard",
  "contactGrid": "user-module__-1Y2kW__contactGrid",
  "damageForm": "user-module__-1Y2kW__damageForm",
  "damageReport": "user-module__-1Y2kW__damageReport",
  "dashboardLayout": "user-module__-1Y2kW__dashboardLayout",
  "directionsBtn": "user-module__-1Y2kW__directionsBtn",
  "donateBtn": "user-module__-1Y2kW__donateBtn",
  "donationAmounts": "user-module__-1Y2kW__donationAmounts",
  "donationSection": "user-module__-1Y2kW__donationSection",
  "educationCard": "user-module__-1Y2kW__educationCard",
  "educationTabs": "user-module__-1Y2kW__educationTabs",
  "emergencyContacts": "user-module__-1Y2kW__emergencyContacts",
  "emergencySection": "user-module__-1Y2kW__emergencySection",
  "full": "user-module__-1Y2kW__full",
  "greenZone": "user-module__-1Y2kW__greenZone",
  "helplineSection": "user-module__-1Y2kW__helplineSection",
  "inputGroup": "user-module__-1Y2kW__inputGroup",
  "itemCheckboxes": "user-module__-1Y2kW__itemCheckboxes",
  "itemDonation": "user-module__-1Y2kW__itemDonation",
  "legendItem": "user-module__-1Y2kW__legendItem",
  "limited": "user-module__-1Y2kW__limited",
  "locationSection": "user-module__-1Y2kW__locationSection",
  "mainContent": "user-module__-1Y2kW__mainContent",
  "mapBtn": "user-module__-1Y2kW__mapBtn",
  "mapContainer": "user-module__-1Y2kW__mapContainer",
  "mapControls": "user-module__-1Y2kW__mapControls",
  "mapLegend": "user-module__-1Y2kW__mapLegend",
  "mapPlaceholder": "user-module__-1Y2kW__mapPlaceholder",
  "notifIcon": "user-module__-1Y2kW__notifIcon",
  "notificationItem": "user-module__-1Y2kW__notificationItem",
  "notificationList": "user-module__-1Y2kW__notificationList",
  "profileForm": "user-module__-1Y2kW__profileForm",
  "quickActions": "user-module__-1Y2kW__quickActions",
  "quickBtn": "user-module__-1Y2kW__quickBtn",
  "recoveryStatus": "user-module__-1Y2kW__recoveryStatus",
  "recoveryTabs": "user-module__-1Y2kW__recoveryTabs",
  "redZone": "user-module__-1Y2kW__redZone",
  "reportForm": "user-module__-1Y2kW__reportForm",
  "reportItem": "user-module__-1Y2kW__reportItem",
  "reportTime": "user-module__-1Y2kW__reportTime",
  "reportType": "user-module__-1Y2kW__reportType",
  "requestBtn": "user-module__-1Y2kW__requestBtn",
  "requestHistory": "user-module__-1Y2kW__requestHistory",
  "requestItem": "user-module__-1Y2kW__requestItem",
  "resourceCard": "user-module__-1Y2kW__resourceCard",
  "resourceGrid": "user-module__-1Y2kW__resourceGrid",
  "saveBtn": "user-module__-1Y2kW__saveBtn",
  "sectionContent": "user-module__-1Y2kW__sectionContent",
  "settingsGrid": "user-module__-1Y2kW__settingsGrid",
  "shareLocationBtn": "user-module__-1Y2kW__shareLocationBtn",
  "shelterCapacity": "user-module__-1Y2kW__shelterCapacity",
  "shelterCard": "user-module__-1Y2kW__shelterCard",
  "shelterList": "user-module__-1Y2kW__shelterList",
  "shifted": "user-module__-1Y2kW__shifted",
  "sidebar": "user-module__-1Y2kW__sidebar",
  "sidebarIcon": "user-module__-1Y2kW__sidebarIcon",
  "sidebarItem": "user-module__-1Y2kW__sidebarItem",
  "sosBtn": "user-module__-1Y2kW__sosBtn",
  "sosText": "user-module__-1Y2kW__sosText",
  "statusApproved": "user-module__-1Y2kW__statusApproved",
  "statusComplete": "user-module__-1Y2kW__statusComplete",
  "statusItem": "user-module__-1Y2kW__statusItem",
  "statusList": "user-module__-1Y2kW__statusList",
  "statusPending": "user-module__-1Y2kW__statusPending",
  "submitBtn": "user-module__-1Y2kW__submitBtn",
  "submitReportBtn": "user-module__-1Y2kW__submitReportBtn",
  "supportTabs": "user-module__-1Y2kW__supportTabs",
  "timestamp": "user-module__-1Y2kW__timestamp",
  "uploadSection": "user-module__-1Y2kW__uploadSection",
  "volunteerBtn": "user-module__-1Y2kW__volunteerBtn",
  "volunteerOptions": "user-module__-1Y2kW__volunteerOptions",
  "volunteerSection": "user-module__-1Y2kW__volunteerSection",
  "yellowZone": "user-module__-1Y2kW__yellowZone",
});
}),
"[project]/pages/UserDashboard.js [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [client] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wrench.js [client] (ecmascript) <export default as Wrench>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Map$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map.js [client] (ecmascript) <export default as Map>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/phone.js [client] (ecmascript) <export default as Phone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOpen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/book-open.js [client] (ecmascript) <export default as BookOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart.js [client] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.js [client] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/pages/index.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/pages/user.module.css [client] (css module)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
;
;
;
;
const features = [
    {
        icon: "🧠",
        title: "Flood Prediction Agent",
        description: "LSTM Neural Network for time-series weather pattern analysis with multi-feature input processing 15 weather parameters.",
        details: [
            "Real-time risk assessment",
            "Confidence scores",
            "Continuous learning"
        ],
        path: "/disaster-prediction-agent"
    },
    {
        icon: "🛰️",
        title: "Monitoring Agent",
        description: "CNN-based satellite image analysis for fire/flood detection with social media monitoring using advanced NLP.",
        details: [
            "Satellite imagery",
            "Social media tracking",
            "Multi-source fusion"
        ],
        path: "/monitoring-agent"
    },
    {
        icon: "⚙️",
        title: "Resource Allocation Agent",
        description: "Reinforcement Learning (Q-learning) for optimal resource deployment with dynamic management capabilities.",
        details: [
            "Q-learning optimization",
            "Dynamic management",
            "Distance-based routing"
        ],
        path: "/resource"
    },
    {
        icon: "🔧",
        title: "Recovery Support Agent",
        description: "AI-powered recovery planning with phase-based approach, cost estimation, and stakeholder communication.",
        details: [
            "Recovery planning",
            "Cost estimation",
            "Timeline optimization"
        ],
        path: "/recovery"
    }
];
// IndiaRiskMap renders an India GeoChart with specified state colors
const IndiaRiskMap = ()=>{
    _s();
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "IndiaRiskMap.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const draw = {
                "IndiaRiskMap.useEffect.draw": ()=>{
                    if (!window.google || !window.google.visualization) return;
                    const data = window.google.visualization.arrayToDataTable([
                        [
                            'State',
                            'Risk'
                        ],
                        // 2 = Red, 1 = Yellow, 0 = Green
                        [
                            'Kerala',
                            2
                        ],
                        [
                            'Uttar Pradesh',
                            1
                        ],
                        [
                            'Assam',
                            0
                        ],
                        [
                            'Bihar',
                            0
                        ],
                        [
                            'West Bengal',
                            2
                        ],
                        [
                            'Odisha',
                            1
                        ]
                    ]);
                    const el = document.getElementById('india-risk-map');
                    if (!el) return;
                    const width = Math.max(320, el.clientWidth || 0);
                    const height = 420; // explicit numeric height for Google Charts
                    const options = {
                        region: 'IN',
                        resolution: 'provinces',
                        legend: 'none',
                        colorAxis: {
                            colors: [
                                '#10b981',
                                '#f59e0b',
                                '#ef4444'
                            ]
                        },
                        backgroundColor: 'transparent',
                        datalessRegionColor: '#2d3748',
                        enableRegionInteractivity: false,
                        width,
                        height
                    };
                    const chart = new window.google.visualization.GeoChart(el);
                    chart.draw(data, options);
                    const onResize = {
                        "IndiaRiskMap.useEffect.draw.onResize": ()=>{
                            const w = Math.max(320, el.clientWidth || 0);
                            chart.draw(data, {
                                ...options,
                                width: w
                            });
                        }
                    }["IndiaRiskMap.useEffect.draw.onResize"];
                    window.addEventListener('resize', onResize);
                    return ({
                        "IndiaRiskMap.useEffect.draw": ()=>window.removeEventListener('resize', onResize)
                    })["IndiaRiskMap.useEffect.draw"];
                }
            }["IndiaRiskMap.useEffect.draw"];
            const loadAndDraw = {
                "IndiaRiskMap.useEffect.loadAndDraw": ()=>{
                    window.google.charts.load('current', {
                        packages: [
                            'geochart'
                        ]
                    });
                    window.google.charts.setOnLoadCallback(draw);
                }
            }["IndiaRiskMap.useEffect.loadAndDraw"];
            if (!window.google || !window.google.charts) {
                const s = document.createElement('script');
                s.src = 'https://www.gstatic.com/charts/loader.js';
                s.async = true;
                s.onload = loadAndDraw;
                document.body.appendChild(s);
            } else {
                loadAndDraw();
            }
        }
    }["IndiaRiskMap.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].mapContainer,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: "india-risk-map",
                style: {
                    width: '100%',
                    height: '420px'
                }
            }, void 0, false, {
                fileName: "[project]/pages/UserDashboard.js",
                lineNumber: 123,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].mapLegend,
                style: {
                    marginTop: '12px'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].legendItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].redZone
                            }, void 0, false, {
                                fileName: "[project]/pages/UserDashboard.js",
                                lineNumber: 126,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            " Kerala, West Bengal"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/UserDashboard.js",
                        lineNumber: 125,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].legendItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].yellowZone
                            }, void 0, false, {
                                fileName: "[project]/pages/UserDashboard.js",
                                lineNumber: 129,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            " Uttar Pradesh, Odisha"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/UserDashboard.js",
                        lineNumber: 128,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].legendItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].greenZone
                            }, void 0, false, {
                                fileName: "[project]/pages/UserDashboard.js",
                                lineNumber: 132,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            " Assam, Bihar"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/UserDashboard.js",
                        lineNumber: 131,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/pages/UserDashboard.js",
                lineNumber: 124,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/pages/UserDashboard.js",
        lineNumber: 122,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(IndiaRiskMap, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = IndiaRiskMap;
const sidebarSections = {
    alerts: {
        title: "Live Flood Alerts",
        content: null
    },
    profile: {
        title: "User Profile",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "👤 Profile Information"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 148,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].profileForm,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: "Full Name"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 151,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    defaultValue: "John Doe"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 152,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 150,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: "Phone Number"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 155,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    defaultValue: "+91 9876543210"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 156,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 154,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: "Emergency Contact"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 159,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    placeholder: "Emergency contact number"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 160,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 158,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: "Address"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 163,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    rows: "3",
                                    placeholder: "Your complete address"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 164,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 162,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: "Medical Conditions"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 167,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    placeholder: "Any medical conditions (diabetes, etc.)"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 168,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 166,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 149,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].saveBtn,
                    children: "Save Profile"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 171,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 147,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    },
    map: {
        title: "Interactive Map & Risk Zones",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "🗺️ Flood Risk Map"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 180,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(IndiaRiskMap, {}, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 181,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].mapControls,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].mapBtn,
                            children: "🏠 Show Shelters"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 183,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].mapBtn,
                            children: "🛣️ Evacuation Routes"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 184,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].mapBtn,
                            children: "📍 My Location"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 185,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].mapBtn,
                            children: "⚠️ Risk Areas"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 186,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 182,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 179,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    },
    sos: {
        title: "SOS & Emergency Assistance",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "🆘 Emergency Assistance"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 196,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].emergencySection,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sosBtn,
                            children: "🚨 SEND SOS"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 198,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sosText,
                            children: "Press for immediate rescue assistance"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 199,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 197,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].locationSection,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            children: "📍 Location Sharing"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 203,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shareLocationBtn,
                            children: "Share Live Location"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 204,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "Your location: Lat: 19.0760, Lng: 72.8777"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 205,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 202,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].emergencyContacts,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            children: "📞 Emergency Numbers"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 209,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactGrid,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactCard,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Police"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 212,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "tel:100",
                                            children: "100"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 213,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 211,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactCard,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Fire Brigade"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 216,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "tel:101",
                                            children: "101"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 217,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 215,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactCard,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Ambulance"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 220,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "tel:102",
                                            children: "102"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 221,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 219,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactCard,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Disaster Helpline"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 224,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "tel:1078",
                                            children: "1078"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 225,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 223,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 210,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 208,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 195,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    },
    shelters: {
        title: "Shelter & Relief Center Finder",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "🏠 Available Shelters"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 237,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterList,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "Community Center A"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 240,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "📍 2.3 km away"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 241,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterCapacity,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].available,
                                            children: "45 beds available"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 243,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Food: ✅"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 244,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Medical: ✅"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 245,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 242,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].directionsBtn,
                                    onClick: ()=>window.open('https://www.google.com/maps/search/?api=1&query=Community+Center+A+Mumbai', '_blank'),
                                    children: "Get Directions"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 247,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 239,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "School Shelter B"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 256,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "📍 3.7 km away"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 257,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterCapacity,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].limited,
                                            children: "12 beds left"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 259,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Food: ✅"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 260,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Medical: ❌"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 261,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 258,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].directionsBtn,
                                    onClick: ()=>window.open('https://www.google.com/maps/search/?api=1&query=School+Shelter+B+Mumbai', '_blank'),
                                    children: "Get Directions"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 263,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 255,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "Temple Shelter C"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 272,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "📍 5.1 km away"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 273,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterCapacity,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].full,
                                            children: "Full"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 275,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Food: ✅"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 276,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Medical: ✅"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 277,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 274,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].directionsBtn,
                                    disabled: true,
                                    children: "Full"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 279,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 271,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 238,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 236,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    },
    resources: {
        title: "Resource & Aid Request",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "📦 Request Resources"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 290,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resourceForm,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resourceGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resourceCard,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        children: "💧 Water"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 294,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        placeholder: "Bottles needed"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 295,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].requestBtn,
                                        children: "Request"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 296,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/UserDashboard.js",
                                lineNumber: 293,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resourceCard,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        children: "🍞 Food"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 299,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        placeholder: "Meals needed"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 300,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].requestBtn,
                                        children: "Request"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 301,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/UserDashboard.js",
                                lineNumber: 298,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resourceCard,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        children: "💊 Medicine"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 304,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        placeholder: "Medicine name"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 305,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].requestBtn,
                                        children: "Request"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 306,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/UserDashboard.js",
                                lineNumber: 303,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resourceCard,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        children: "🩹 First Aid"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 309,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        placeholder: "Specify requirements"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 310,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].requestBtn,
                                        children: "Request"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/UserDashboard.js",
                                        lineNumber: 311,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/UserDashboard.js",
                                lineNumber: 308,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/UserDashboard.js",
                        lineNumber: 292,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 291,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].requestHistory,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            children: "📋 My Requests"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 317,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].requestItem,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Water - 5 bottles"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 319,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statusPending,
                                    children: "Pending"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 320,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 318,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].requestItem,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Insulin"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 323,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statusApproved,
                                    children: "Approved - Arriving in 2 hours"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 324,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 322,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 316,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 289,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    },
    community: {
        title: "Community Reporting",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "👥 Community Reports"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 335,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportForm,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            children: "📝 Submit Report"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 337,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportType,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    children: "Select Report Type"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 339,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    children: "Blocked Road"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 340,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    children: "Damaged Bridge"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 341,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    children: "Flood Hotspot"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 342,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    children: "Rescue Needed"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 343,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    children: "Other"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 344,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 338,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                            placeholder: "Describe the situation...",
                            rows: "4"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 346,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].uploadSection,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "file",
                                    accept: "image/*,video/*"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 348,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: "📸 Upload Photo/Video Evidence"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 349,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 347,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].submitReportBtn,
                            children: "Submit Report"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 351,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 336,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].communityReports,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            children: "🌍 Recent Community Reports"
                        }, void 0, false, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 355,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportItem,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Road Block - Main Street"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 357,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "Tree fallen, blocking entire road"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 358,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportTime,
                                    children: "30 minutes ago"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 359,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 356,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportItem,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Flood Spot - Park Area"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 362,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "Water level 3 feet, avoid area"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 363,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportTime,
                                    children: "1 hour ago"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 364,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 361,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 354,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 334,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    },
    helpline: {
        title: "Helpline & Communication",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "📞 24/7 Helpline"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 375,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].helplineSection,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].chatBot,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "🤖 AI Assistant"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 378,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].chatContainer,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].chatMessage,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "Bot:"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 381,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " How can I help you with flood safety?"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 380,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].chatMessage,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "You:"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 384,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " What should I pack in emergency kit?"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 383,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].chatMessage,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "Bot:"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 387,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Essential items include: water (1 gallon per person per day), non-perishable food, flashlight, batteries, first aid kit, medications, important documents in waterproof container."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 386,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 379,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].chatInput,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            placeholder: "Ask me anything about flood safety..."
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 391,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            children: "Send"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 392,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 390,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 377,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].quickActions,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "⚡ Quick Help"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 397,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].quickBtn,
                                    children: "What to do before flood?"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 398,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].quickBtn,
                                    children: "How to purify water?"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 399,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].quickBtn,
                                    children: "Safe evacuation tips"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 400,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].quickBtn,
                                    children: "Post-flood recovery"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 401,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 396,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 376,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 374,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    },
    education: {
        title: "Education & Awareness",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "📚 Flood Safety Education"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 412,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].educationTabs,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].educationCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "🎒 Emergency Preparedness"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 415,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Create family emergency plan"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 417,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Prepare emergency kit with 72-hour supplies"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 418,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Identify evacuation routes"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 419,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Keep important documents safe"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 420,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 416,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 414,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].educationCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "⚡ During Flood"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 425,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Move to higher ground immediately"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 427,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Avoid walking/driving through flood water"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 428,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Stay away from electrical lines"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 429,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Listen to emergency broadcasts"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 430,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 426,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 424,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].educationCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "🔧 After Flood"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 435,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Wait for authorities to declare area safe"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 437,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Document damage with photos"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 438,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Boil water before drinking"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 439,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Disinfect everything that got wet"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 440,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 436,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 434,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].educationCard,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "💡 Safety Tips"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 445,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "6 inches of water can knock you down"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 447,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "12 inches can carry away vehicles"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 448,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Turn around, don't drown"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 449,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: "Stay informed through official sources"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 450,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 446,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 444,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 413,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 411,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    },
    donation: {
        title: "Donation & Volunteering",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "❤️ Support Relief Efforts"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 462,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].supportTabs,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].donationSection,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "💰 Make a Donation"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 465,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].donationAmounts,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].amountBtn,
                                            children: "₹500"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 467,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].amountBtn,
                                            children: "₹1000"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 468,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].amountBtn,
                                            children: "₹2000"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 469,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].amountBtn,
                                            children: "₹5000"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 470,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 466,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "number",
                                    placeholder: "Custom amount"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 472,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].donateBtn,
                                    children: "Donate Now"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 473,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 464,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].itemDonation,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "📦 Donate Items"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 477,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].itemCheckboxes,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 479,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Water Bottles"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 479,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 480,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Food Packets"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 480,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 481,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Clothes"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 481,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 482,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Blankets"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 482,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 483,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Medicines"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 483,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 484,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Toiletries"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 484,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 478,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    placeholder: "Specify quantities and pickup address"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 486,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].donateBtn,
                                    children: "Schedule Pickup"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 487,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 476,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].volunteerSection,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "🙋‍♂️ Volunteer Registration"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 491,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].volunteerOptions,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 493,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Rescue Operations"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 493,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 494,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Relief Distribution"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 494,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 495,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Medical Assistance"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 495,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 496,
                                                    columnNumber: 22
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Shelter Management"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 496,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 492,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].volunteerBtn,
                                    children: "Register as Volunteer"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 498,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 490,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 463,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 461,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    },
    recovery: {
        title: "Post-Flood Recovery",
        content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    children: "🏗️ Recovery & Compensation"
                }, void 0, false, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 509,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].recoveryTabs,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].damageReport,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "📋 Damage Assessment"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 512,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].damageForm,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    children: "Property Type"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 515,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: "House"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/UserDashboard.js",
                                                            lineNumber: 517,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: "Apartment"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/UserDashboard.js",
                                                            lineNumber: 518,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: "Commercial"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/UserDashboard.js",
                                                            lineNumber: 519,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: "Vehicle"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/UserDashboard.js",
                                                            lineNumber: 520,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: "Agricultural Land"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/UserDashboard.js",
                                                            lineNumber: 521,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 516,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 514,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    children: "Damage Level"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 525,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: "Minor ( 25%)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/UserDashboard.js",
                                                            lineNumber: 527,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: "Moderate (25-50%)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/UserDashboard.js",
                                                            lineNumber: 528,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: "Major (50-75%)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/UserDashboard.js",
                                                            lineNumber: 529,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            children: "Severe ( 75%)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/UserDashboard.js",
                                                            lineNumber: 530,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 526,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 524,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    children: "Estimated Loss Amount"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 534,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "number",
                                                    placeholder: "Amount in ₹"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 535,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 533,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    children: "Upload Damage Photos"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 538,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "file",
                                                    multiple: true,
                                                    accept: "image/*"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 539,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 537,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].submitBtn,
                                            children: "Submit Damage Report"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 541,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 513,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 511,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].compensationSection,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "💰 Apply for Financial Aid"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 546,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].aidOptions,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].aidCard,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "Government Relief Fund"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 549,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: "Up to ₹50,000 for house damage"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 550,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].applyBtn,
                                                    children: "Apply"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 551,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 548,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].aidCard,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "Insurance Claim"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 554,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: "Submit insurance claim documents"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 555,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].applyBtn,
                                                    children: "File Claim"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 556,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 553,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].aidCard,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "Business Recovery Loan"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 559,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: "Low-interest loans for businesses"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 560,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].applyBtn,
                                                    children: "Apply"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 561,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 558,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 547,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 545,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].recoveryStatus,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "📊 Recovery Status"
                                }, void 0, false, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 567,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statusList,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statusItem,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Damage Assessment"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 570,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statusComplete,
                                                    children: "✅ Complete"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 571,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 569,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statusItem,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Government Aid Application"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 574,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statusPending,
                                                    children: "⏳ Under Review"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 575,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 573,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statusItem,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Insurance Claim"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 578,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statusPending,
                                                    children: "⏳ Processing"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/UserDashboard.js",
                                                    lineNumber: 579,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/UserDashboard.js",
                                            lineNumber: 577,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/UserDashboard.js",
                                    lineNumber: 568,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/UserDashboard.js",
                            lineNumber: 566,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/UserDashboard.js",
                    lineNumber: 510,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/pages/UserDashboard.js",
            lineNumber: 508,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }
};
const UserDashboard = ()=>{
    var _sidebarSections_activeSection;
    _s1();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editProfile, setEditProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        username: '',
        phone: '',
        email: '',
        gender: '',
        password: ''
    });
    const [savingProfile, setSavingProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [alerts, setAlerts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isMenuOpen, setIsMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [activeSection, setActiveSection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('dashboard');
    const [sosSending, setSosSending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [lastSOS, setLastSOS] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [inventory, setInventory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [myRequests, setMyRequests] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [communityReports, setCommunityReports] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [shelters, setShelters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedAmount, setSelectedAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedItems, setSelectedItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedVolunteerAreas, setSelectedVolunteerAreas] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isEditingProfile, setIsEditingProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editedUser, setEditedUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({});
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UserDashboard.useEffect": ()=>{
            // Fetch actual user data from localStorage and backend
            const fetchUserData = {
                "UserDashboard.useEffect.fetchUserData": async ()=>{
                    try {
                        const storedUser = localStorage.getItem('user');
                        if (storedUser) {
                            const parsedUser = JSON.parse(storedUser);
                            const userId = parsedUser.id;
                            // Fetch full user details from backend
                            const response = await fetch("http://localhost:8000/api/users/".concat(userId));
                            if (response.ok) {
                                const userData = await response.json();
                                const formattedUser = {
                                    id: userData.id,
                                    name: userData.name || 'N/A',
                                    email: userData.email || 'N/A',
                                    phone: userData.phone || 'N/A',
                                    gender: userData.gender || 'N/A',
                                    username: userData.username || 'N/A',
                                    emergencyContact: userData.emergency_contact || '',
                                    address: userData.address || '',
                                    medicalConditions: userData.medical_conditions || ''
                                };
                                setUser(formattedUser);
                                setEditedUser(formattedUser);
                            } else {
                                // Fallback to stored user data
                                setUser(parsedUser);
                                setEditedUser(parsedUser);
                            }
                        } else {
                            // Default data if no user is logged in
                            const defaultUser = {
                                name: 'Guest User',
                                email: 'guest@example.com',
                                phone: 'N/A',
                                gender: 'N/A',
                                username: 'guest',
                                emergencyContact: '',
                                address: '',
                                medicalConditions: ''
                            };
                            setUser(defaultUser);
                            setEditedUser(defaultUser);
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                    }
                    setLoading(false);
                }
            }["UserDashboard.useEffect.fetchUserData"];
            fetchUserData();
            fetchAlerts();
            fetchInventory();
            fetchMyRequests();
            fetchCommunityReports();
            fetchShelters();
            const iv = setInterval(fetchAlerts, 5000);
            const iv2 = setInterval(fetchMyRequests, 10000);
            const iv3 = setInterval(fetchCommunityReports, 15000);
            const iv4 = setInterval(fetchShelters, 20000);
            return ({
                "UserDashboard.useEffect": ()=>{
                    clearInterval(iv);
                    clearInterval(iv2);
                    clearInterval(iv3);
                    clearInterval(iv4);
                }
            })["UserDashboard.useEffect"];
        }
    }["UserDashboard.useEffect"], [
        router
    ]);
    const handleLogout = ()=>{
        router.push('/login');
    };
    const handleFeatureClick = (path)=>{
        if (path) {
            router.push(path);
        }
    };
    const toggleMenu = ()=>{
        setIsMenuOpen(!isMenuOpen);
    };
    const fetchAlerts = async ()=>{
        try {
            const res = await fetch('http://localhost:8000/api/alerts');
            const data = await res.json();
            setAlerts(Array.isArray(data.data) ? data.data : []);
        } catch (e) {
        // ignore
        }
    };
    const sendSOS = async ()=>{
        if (sosSending) return;
        setSosSending(true);
        try {
            const getPosition = ()=>new Promise((resolve)=>{
                    if (!navigator.geolocation) return resolve(null);
                    navigator.geolocation.getCurrentPosition((pos)=>resolve({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        }), ()=>resolve(null), {
                        enableHighAccuracy: true,
                        timeout: 5000
                    });
                });
            const coords = await getPosition();
            const message = coords ? "SOS Emergency - Flood situation. Location: ".concat(coords.lat.toFixed(4), ", ").concat(coords.lng.toFixed(4)) : 'SOS Emergency - Flood situation (location unavailable)';
            const resp = await fetch('http://localhost:8000/api/alerts/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'SOS Emergency',
                    message,
                    risk: 'high'
                })
            });
            const data = await resp.json();
            setLastSOS({
                ok: resp.ok,
                data
            });
            if (resp.ok) {
                alert('SOS sent to admin!');
            } else {
                alert("Failed to send SOS: ".concat((data === null || data === void 0 ? void 0 : data.detail) || 'Unknown error'));
            }
        } catch (err) {
            alert('Failed to send SOS');
        } finally{
            setSosSending(false);
        }
    };
    const handleSidebarClick = (section)=>{
        setActiveSection(section);
    };
    const openGoogleMaps = (locationName)=>{
        const mapsUrl = "https://www.google.com/maps/search/?api=1&query=".concat(encodeURIComponent(locationName));
        window.open(mapsUrl, '_blank');
    };
    const fetchInventory = async ()=>{
        try {
            const res = await fetch('http://localhost:8000/api/inventory');
            const data = await res.json();
            setInventory(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch inventory:', e);
        }
    };
    const fetchMyRequests = async ()=>{
        try {
            const res = await fetch('http://localhost:8000/api/resource-requests');
            const data = await res.json();
            setMyRequests(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch requests:', e);
        }
    };
    const requestResource = async (resourceName, quantity)=>{
        if (!quantity || quantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }
        try {
            const resp = await fetch('http://localhost:8000/api/resource-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 1,
                    resource_name: resourceName,
                    quantity: parseInt(quantity)
                })
            });
            if (resp.ok) {
                alert('Resource request submitted!');
                fetchMyRequests();
            } else {
                alert('Failed to submit request');
            }
        } catch (err) {
            alert('Failed to submit request');
        }
    };
    const fetchCommunityReports = async ()=>{
        try {
            const res = await fetch('http://localhost:8000/api/community-reports');
            const data = await res.json();
            setCommunityReports(Array.isArray(data) ? data.slice(0, 5) : []); // Show latest 5
        } catch (e) {
            console.error('Failed to fetch community reports:', e);
        }
    };
    const submitCommunityReport = async (reportType, description)=>{
        if (!description || !reportType || reportType === 'Select Report Type') {
            alert('Please select report type and enter description');
            return;
        }
        try {
            const resp = await fetch('http://localhost:8000/api/community-reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 1,
                    report_type: reportType,
                    description: description
                })
            });
            if (resp.ok) {
                alert('Report submitted successfully!');
                fetchCommunityReports();
                return true;
            } else {
                alert('Failed to submit report');
                return false;
            }
        } catch (err) {
            alert('Failed to submit report');
            return false;
        }
    };
    const fetchShelters = async ()=>{
        try {
            const res = await fetch('http://localhost:8000/api/shelters');
            const data = await res.json();
            setShelters(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch shelters:', e);
        }
    };
    const submitDonation = async (amount)=>{
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return false;
        }
        try {
            const resp = await fetch('http://localhost:8000/api/donations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 1,
                    amount: parseFloat(amount),
                    donor_name: (user === null || user === void 0 ? void 0 : user.name) || 'Anonymous',
                    donor_email: (user === null || user === void 0 ? void 0 : user.email) || ''
                })
            });
            if (resp.ok) {
                alert('Donation submitted successfully! Thank you for your support!');
                return true;
            } else {
                alert('Failed to submit donation');
                return false;
            }
        } catch (err) {
            alert('Failed to submit donation');
            return false;
        }
    };
    const submitItemPickup = async (items, address)=>{
        if (!items || !address) {
            alert('Please select items and enter pickup address');
            return false;
        }
        try {
            const resp = await fetch('http://localhost:8000/api/item-pickups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 1,
                    items: items,
                    pickup_address: address,
                    contact_number: (user === null || user === void 0 ? void 0 : user.phone) || ''
                })
            });
            if (resp.ok) {
                alert('Pickup scheduled successfully!');
                return true;
            } else {
                alert('Failed to schedule pickup');
                return false;
            }
        } catch (err) {
            alert('Failed to schedule pickup');
            return false;
        }
    };
    const submitVolunteerRequest = async (areas, durationMonths)=>{
        if (!areas || areas.length === 0) {
            alert('Please select at least one area of interest');
            return false;
        }
        try {
            const resp = await fetch('http://localhost:8000/api/volunteer-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 1,
                    volunteer_name: (user === null || user === void 0 ? void 0 : user.name) || '',
                    volunteer_email: (user === null || user === void 0 ? void 0 : user.email) || '',
                    volunteer_phone: (user === null || user === void 0 ? void 0 : user.phone) || '',
                    areas_of_interest: areas,
                    duration_months: durationMonths || 1
                })
            });
            if (resp.ok) {
                alert('Volunteer registration submitted successfully!');
                return true;
            } else {
                alert('Failed to submit volunteer request');
                return false;
            }
        } catch (err) {
            alert('Failed to submit volunteer request');
            return false;
        }
    };
    const submitDamageReport = async (propertyType, damageLevel, estimatedLoss, description)=>{
        if (!propertyType || !damageLevel || !estimatedLoss || estimatedLoss <= 0) {
            alert('Please fill all required fields');
            return false;
        }
        try {
            console.log('Submitting damage report:', {
                propertyType,
                damageLevel,
                estimatedLoss,
                description
            });
            const resp = await fetch('http://localhost:8000/api/damage-reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 1,
                    property_type: propertyType,
                    damage_level: damageLevel,
                    estimated_loss: parseFloat(estimatedLoss),
                    description: description || ''
                })
            });
            const data = await resp.json();
            console.log('Response:', data);
            if (resp.ok) {
                alert('Damage report submitted successfully!');
                return true;
            } else {
                alert("Failed to submit damage report: ".concat(data.detail || 'Unknown error'));
                return false;
            }
        } catch (err) {
            console.error('Error submitting damage report:', err);
            alert("Failed to submit damage report: ".concat(err.message));
            return false;
        }
    };
    const applyForFinancialAid = async (aidType, amount)=>{
        if (!aidType || !amount || amount <= 0) {
            alert('Please enter a valid amount');
            return false;
        }
        try {
            console.log('Submitting financial aid:', {
                aidType,
                amount
            });
            const resp = await fetch('http://localhost:8000/api/financial-aid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 1,
                    aid_type: aidType,
                    amount_requested: parseFloat(amount),
                    purpose: "".concat(aidType, " request")
                })
            });
            const data = await resp.json();
            console.log('Response:', data);
            if (resp.ok) {
                alert('Financial aid request submitted successfully!');
                return true;
            } else {
                alert("Failed to submit financial aid request: ".concat(data.detail || 'Unknown error'));
                return false;
            }
        } catch (err) {
            console.error('Error submitting financial aid:', err);
            alert("Failed to submit financial aid request: ".concat(err.message));
            return false;
        }
    };
    const updateProfile = async ()=>{
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                const userId = parsedUser.id;
                // Send update to backend
                const response = await fetch("http://localhost:8000/api/users/".concat(userId), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: editedUser.name,
                        email: editedUser.email,
                        phone: editedUser.phone,
                        gender: editedUser.gender,
                        emergency_contact: editedUser.emergencyContact,
                        address: editedUser.address,
                        medical_conditions: editedUser.medicalConditions
                    })
                });
                if (response.ok) {
                    setUser(editedUser);
                    setIsEditingProfile(false);
                    alert('Profile updated successfully!');
                } else {
                    const error = await response.json();
                    alert("Failed to update profile: ".concat(error.detail || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert("Failed to update profile: ".concat(error.message));
        }
    };
    const handleProfileChange = (field, value)=>{
        setEditedUser((prev)=>({
                ...prev,
                [field]: value
            }));
    };
    const sidebarItems = [
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
            text: 'Live Alerts',
            key: 'alerts'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"],
            text: 'User Profile',
            key: 'profile'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Map$3e$__["Map"],
            text: 'Interactive Map',
            key: 'map'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"],
            text: 'SOS Emergency',
            key: 'sos'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"],
            text: 'Shelters',
            key: 'shelters'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"],
            text: 'Resources',
            key: 'resources'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"],
            text: 'Community',
            key: 'community'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"],
            text: 'Helpline',
            key: 'helpline'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$book$2d$open$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOpen$3e$__["BookOpen"],
            text: 'Education',
            key: 'education'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"],
            text: 'Donation',
            key: 'donation'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__["Wrench"],
            text: 'Recovery',
            key: 'recovery'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"],
            text: 'Logout',
            onClick: handleLogout
        }
    ];
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].container
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].heroContent
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].heroSubtitle
        }, 'Loading...')));
    }
    if (!user) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].container
    }, // Navigation
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('nav', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navbar
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navContainer
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLogo
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].logoIcon
    }, '🌱'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', null, 'ACMS User Dashboard')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('ul', {
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navMenu, " ").concat(isMenuOpen ? __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].active : '')
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('li', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navItem
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('a', {
        href: '/',
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLink
    }, 'Home')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('li', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navItem
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('a', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLink,
        onClick: handleLogout
    }, 'Logout'))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].hamburger, " ").concat(isMenuOpen ? __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].active : ''),
        onClick: toggleMenu
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].bar
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].bar
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].bar
    })))), // Dashboard Layout
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].dashboardLayout
    }, // Sidebar
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('aside', {
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sidebar, " ").concat(isMenuOpen ? '' : __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].closed)
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('ul', {
        style: {
            listStyle: 'none',
            padding: '10px 0'
        }
    }, sidebarItems.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('li', {
            key: index,
            className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sidebarItem, " ").concat(activeSection === item.key ? __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].active : ''),
            onClick: item.onClick || (()=>handleSidebarClick(item.key))
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])(item.icon, {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sidebarIcon
        }), item.text)))), // Main Content
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('main', {
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].mainContent, " ").concat(isMenuOpen ? __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shifted : '')
    }, activeSection === 'dashboard' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h2', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle
    }, '🔥 Complete ACMS Features'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].featuresGrid
    }, features.map((feature, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            key: index,
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].featureCard,
            onClick: ()=>handleFeatureClick(feature.path),
            style: feature.path ? {
                cursor: 'pointer'
            } : {}
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].featureIcon
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', null, feature.icon)), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].featureContent
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, feature.title), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', null, feature.description), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].featureDetails
        }, feature.details.map((detail, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
                key: idx
            }, detail))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].featureArrow
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', null, '→'))))))) : activeSection === 'alerts' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, '🚨 Active Alerts'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, alerts.map((a)=>{
        const color = a.type === 'error' ? '#ff4d4f' : a.type === 'warning' ? '#3b82f6' : '#10b981';
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            key: a.alert_id,
            style: {
                border: "1px solid ".concat(color, "55"),
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '8px'
            }
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            style: {
                fontWeight: 600,
                color
            }
        }, a.title), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            style: {
                opacity: 0.9
            }
        }, a.message), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            style: {
                fontSize: '12px',
                opacity: 0.7
            }
        }, new Date(a.time).toLocaleString()));
    }))) : activeSection === 'sos' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, '🆘 Emergency Assistance'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].emergencySection
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sosBtn,
        onClick: sendSOS,
        disabled: sosSending
    }, sosSending ? 'Sending...' : '🚨 SEND SOS'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sosText
    }, 'Press for immediate rescue assistance')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].locationSection
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', null, '📍 Location Sharing'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shareLocationBtn,
        onClick: sendSOS
    }, 'Share Live Location + Send SOS'), lastSOS ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', null, "Last SOS: ".concat(lastSOS.ok ? 'sent successfully ✅' : 'failed ❌')) : null), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].emergencyContacts
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', null, '📞 Emergency Numbers'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactGrid
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactCard
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', null, 'Police'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('a', {
        href: 'tel:100'
    }, '100')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactCard
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', null, 'Fire Brigade'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('a', {
        href: 'tel:101'
    }, '101')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactCard
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', null, 'Ambulance'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('a', {
        href: 'tel:102'
    }, '102')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].contactCard
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', null, 'Disaster Helpline'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('a', {
        href: 'tel:1078'
    }, '1078'))))) : activeSection === 'resources' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, '📦 Available Resources'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '30px'
        }
    }, inventory.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            key: item.id,
            style: {
                padding: '15px',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                border: '1px solid #334155'
            }
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', {
            style: {
                margin: '0 0 10px 0',
                color: '#10b981'
            }
        }, item.resource_name), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
            style: {
                margin: '5px 0',
                fontSize: '24px',
                fontWeight: 'bold'
            }
        }, item.quantity), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
            style: {
                margin: '0',
                fontSize: '12px',
                opacity: 0.7
            }
        }, item.unit || 'units'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
            type: 'number',
            placeholder: 'Quantity',
            id: "qty-".concat(item.id),
            style: {
                width: '100%',
                padding: '8px',
                marginTop: '10px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: 'white'
            }
        }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
            onClick: ()=>{
                const qty = document.getElementById("qty-".concat(item.id)).value;
                requestResource(item.resource_name, qty);
            },
            style: {
                width: '100%',
                padding: '8px',
                marginTop: '8px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600'
            }
        }, 'Request')))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', {
        style: {
            marginTop: '30px'
        }
    }, '📋 My Requests'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, myRequests.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
        style: {
            opacity: 0.6
        }
    }, 'No requests yet') : myRequests.map((req)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            key: req.id,
            style: {
                padding: '12px',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', null, "".concat(req.resource_name, " - ").concat(req.quantity)), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            style: {
                fontSize: '12px',
                opacity: 0.7,
                marginTop: '4px'
            }
        }, new Date(req.requested_at).toLocaleString())), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
            style: {
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: req.status === 'approved' ? '#10b98144' : req.status === 'rejected' ? '#ef444444' : '#f59e0b44',
                color: req.status === 'approved' ? '#10b981' : req.status === 'rejected' ? '#ef4444' : '#f59e0b'
            }
        }, req.status.toUpperCase()))))) : activeSection === 'shelters' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, '🏠 Available Shelters'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterList
    }, shelters.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
        style: {
            opacity: 0.6,
            padding: '20px',
            textAlign: 'center'
        }
    }, 'No shelters available yet') : shelters.map((shelter)=>{
        const bedsAvailable = shelter.beds_available || shelter.capacity;
        const capacityStatus = bedsAvailable > 50 ? 'available' : bedsAvailable > 0 ? 'limited' : 'full';
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            key: shelter.id,
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterCard,
            style: {
                padding: '15px',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                marginBottom: '15px',
                border: '1px solid #334155'
            }
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', {
            style: {
                margin: '0 0 10px 0'
            }
        }, shelter.name), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
            style: {
                margin: '5px 0',
                fontSize: '14px',
                opacity: 0.8
            }
        }, "📍 ".concat(shelter.distance_km || 'N/A', " km away")), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].shelterCapacity,
            style: {
                display: 'flex',
                gap: '10px',
                margin: '10px 0',
                flexWrap: 'wrap'
            }
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"][capacityStatus],
            style: {
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: capacityStatus === 'available' ? '#10b98144' : capacityStatus === 'limited' ? '#f59e0b44' : '#ef444444',
                color: capacityStatus === 'available' ? '#10b981' : capacityStatus === 'limited' ? '#f59e0b' : '#ef4444'
            }
        }, "".concat(bedsAvailable, " beds available")), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
            style: {
                fontSize: '12px'
            }
        }, "Food: ".concat(shelter.has_food ? '✅' : '❌')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
            style: {
                fontSize: '12px'
            }
        }, "Medical: ".concat(shelter.has_medical ? '✅' : '❌'))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].directionsBtn,
            onClick: ()=>window.open("https://www.google.com/maps/search/?api=1&query=".concat(encodeURIComponent(shelter.name + ' ' + shelter.assigned_region)), '_blank'),
            disabled: bedsAvailable === 0,
            style: {
                padding: '8px 16px',
                backgroundColor: bedsAvailable === 0 ? '#666' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: bedsAvailable === 0 ? 'not-allowed' : 'pointer',
                marginTop: '10px'
            }
        }, bedsAvailable === 0 ? 'Full' : 'Get Directions'));
    }))) : activeSection === 'community' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, '👥 Community Reports'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportForm
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', null, '📝 Submit Report'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('select', {
        id: 'reportType',
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportType,
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', null, 'Select Report Type'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', null, 'Blocked Road'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', null, 'Damaged Bridge'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', null, 'Flood Hotspot'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', null, 'Rescue Needed'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', null, 'Other')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('textarea', {
        id: 'reportDescription',
        placeholder: 'Describe the situation...',
        rows: 4,
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white',
            resize: 'vertical'
        }
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].submitReportBtn,
        onClick: async ()=>{
            const type = document.getElementById('reportType').value;
            const desc = document.getElementById('reportDescription').value;
            const success = await submitCommunityReport(type, desc);
            if (success) {
                document.getElementById('reportType').value = 'Select Report Type';
                document.getElementById('reportDescription').value = '';
            }
        },
        style: {
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
        }
    }, 'Submit Report')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].communityReports,
        style: {
            marginTop: '30px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', null, '🌍 Recent Community Reports'), communityReports.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
        style: {
            opacity: 0.6
        }
    }, 'No reports yet') : communityReports.map((report)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
            key: report.id,
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportItem,
            style: {
                padding: '12px',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                marginBottom: '10px',
                borderLeft: '3px solid #10b981'
            }
        }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', null, "".concat(report.report_type, " - ").concat(report.user_name)), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
            style: {
                margin: '5px 0',
                opacity: 0.9
            }
        }, report.description), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('span', {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].reportTime,
            style: {
                fontSize: '12px',
                opacity: 0.7
            }
        }, new Date(report.reported_at).toLocaleString()))))) : activeSection === 'donation' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, '❤️ Support Relief Efforts'), // Donation Section
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#1e293b',
            borderRadius: '8px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', null, '💰 Make a Donation'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            display: 'flex',
            gap: '10px',
            marginBottom: '15px',
            flexWrap: 'wrap'
        }
    }, [
        500,
        1000,
        2000,
        5000
    ].map((amt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
            key: amt,
            onClick: ()=>setSelectedAmount(amt),
            style: {
                padding: '10px 20px',
                backgroundColor: selectedAmount === amt ? '#10b981' : '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            }
        }, "₹".concat(amt)))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        id: 'customAmount',
        type: 'number',
        placeholder: 'Custom amount',
        onChange: (e)=>setSelectedAmount(parseFloat(e.target.value)),
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: async ()=>{
            const success = await submitDonation(selectedAmount);
            if (success) {
                setSelectedAmount(null);
                document.getElementById('customAmount').value = '';
            }
        },
        style: {
            width: '100%',
            padding: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
        }
    }, 'Donate Now')), // Item Pickup Section
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#1e293b',
            borderRadius: '8px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', null, '📦 Donate Items'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('textarea', {
        id: 'pickupItems',
        placeholder: 'Specify quantities and pickup address',
        rows: 3,
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white',
            resize: 'vertical'
        }
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: async ()=>{
            const items = document.getElementById('pickupItems').value;
            const success = await submitItemPickup(items, items);
            if (success) document.getElementById('pickupItems').value = '';
        },
        style: {
            width: '100%',
            padding: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
        }
    }, 'Schedule Pickup')), // Volunteer Section
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            padding: '20px',
            backgroundColor: '#1e293b',
            borderRadius: '8px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', null, '🙋‍♂️ Volunteer Registration'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('select', {
        id: 'volunteerDuration',
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 1
    }, '1 Month'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 2
    }, '2 Months'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 6
    }, '6 Months')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('textarea', {
        id: 'volunteerAreas',
        placeholder: 'Areas of interest (e.g., Rescue Operations, Medical Assistance)',
        rows: 2,
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white',
            resize: 'vertical'
        }
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: async ()=>{
            const areas = document.getElementById('volunteerAreas').value;
            const duration = document.getElementById('volunteerDuration').value;
            const success = await submitVolunteerRequest(areas, parseInt(duration));
            if (success) document.getElementById('volunteerAreas').value = '';
        },
        style: {
            width: '100%',
            padding: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
        }
    }, 'Register as Volunteer'))) : activeSection === 'profile' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, '👤 Profile Information'), // Display Mode
    !isEditingProfile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#1e293b',
            borderRadius: '8px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '5px',
            opacity: 0.7
        }
    }, 'Full Name'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            fontSize: '16px'
        }
    }, (user === null || user === void 0 ? void 0 : user.name) || 'N/A')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '5px',
            opacity: 0.7
        }
    }, 'Email'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            fontSize: '16px'
        }
    }, (user === null || user === void 0 ? void 0 : user.email) || 'N/A')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '5px',
            opacity: 0.7
        }
    }, 'Phone Number'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            fontSize: '16px'
        }
    }, (user === null || user === void 0 ? void 0 : user.phone) || 'N/A')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '5px',
            opacity: 0.7
        }
    }, 'Gender'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            fontSize: '16px'
        }
    }, (user === null || user === void 0 ? void 0 : user.gender) || 'N/A')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '5px',
            opacity: 0.7
        }
    }, 'Emergency Contact'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            fontSize: '16px'
        }
    }, (user === null || user === void 0 ? void 0 : user.emergencyContact) || 'Not set')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '5px',
            opacity: 0.7
        }
    }, 'Address'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            fontSize: '16px'
        }
    }, (user === null || user === void 0 ? void 0 : user.address) || 'Not set')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '5px',
            opacity: 0.7
        }
    }, 'Medical Conditions'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            fontSize: '16px'
        }
    }, (user === null || user === void 0 ? void 0 : user.medicalConditions) || 'None'))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: ()=>setIsEditingProfile(true),
        style: {
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
        }
    }, '✏️ Edit Profile')), // Edit Mode
    isEditingProfile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            padding: '20px',
            backgroundColor: '#1e293b',
            borderRadius: '8px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', {
        style: {
            marginBottom: '20px'
        }
    }, 'Edit Profile'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            display: 'grid',
            gap: '15px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('label', {
        style: {
            display: 'block',
            marginBottom: '5px',
            fontWeight: '600'
        }
    }, 'Full Name'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        type: 'text',
        value: editedUser.name || '',
        onChange: (e)=>handleProfileChange('name', e.target.value),
        style: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    })), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('label', {
        style: {
            display: 'block',
            marginBottom: '5px',
            fontWeight: '600'
        }
    }, 'Email'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        type: 'email',
        value: editedUser.email || '',
        onChange: (e)=>handleProfileChange('email', e.target.value),
        style: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    })), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('label', {
        style: {
            display: 'block',
            marginBottom: '5px',
            fontWeight: '600'
        }
    }, 'Phone Number'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        type: 'tel',
        value: editedUser.phone || '',
        onChange: (e)=>handleProfileChange('phone', e.target.value),
        style: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    })), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('label', {
        style: {
            display: 'block',
            marginBottom: '5px',
            fontWeight: '600'
        }
    }, 'Emergency Contact'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        type: 'tel',
        value: editedUser.emergencyContact || '',
        onChange: (e)=>handleProfileChange('emergencyContact', e.target.value),
        placeholder: 'Emergency contact number',
        style: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    })), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('label', {
        style: {
            display: 'block',
            marginBottom: '5px',
            fontWeight: '600'
        }
    }, 'Address'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('textarea', {
        value: editedUser.address || '',
        onChange: (e)=>handleProfileChange('address', e.target.value),
        placeholder: 'Your complete address',
        rows: 3,
        style: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white',
            resize: 'vertical'
        }
    })), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', null, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('label', {
        style: {
            display: 'block',
            marginBottom: '5px',
            fontWeight: '600'
        }
    }, 'Medical Conditions'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        type: 'text',
        value: editedUser.medicalConditions || '',
        onChange: (e)=>handleProfileChange('medicalConditions', e.target.value),
        placeholder: 'Any medical conditions (diabetes, etc.)',
        style: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            display: 'flex',
            gap: '10px',
            marginTop: '20px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: updateProfile,
        style: {
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
        }
    }, '✓ Save Changes'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: ()=>{
            setEditedUser(user);
            setIsEditingProfile(false);
        },
        style: {
            padding: '12px 24px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
        }
    }, '✗ Cancel')))) : activeSection === 'recovery' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, '🏗️ Recovery & Compensation'), // Damage Report Section
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#1e293b',
            borderRadius: '8px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', null, '📋 Damage Assessment'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('select', {
        id: 'propertyType',
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: ''
    }, 'Select Property Type'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 'House'
    }, 'House'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 'Apartment'
    }, 'Apartment'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 'Commercial'
    }, 'Commercial'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 'Vehicle'
    }, 'Vehicle'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 'Agricultural Land'
    }, 'Agricultural Land')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('select', {
        id: 'damageLevel',
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: ''
    }, 'Select Damage Level'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 'Minor (<25%)'
    }, 'Minor (<25%)'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 'Moderate (25-50%)'
    }, 'Moderate (25-50%)'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 'Major (50-75%)'
    }, 'Major (50-75%)'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('option', {
        value: 'Severe (>75%)'
    }, 'Severe (>75%)')), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        id: 'estimatedLoss',
        type: 'number',
        placeholder: 'Estimated Loss Amount (₹)',
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('textarea', {
        id: 'damageDescription',
        placeholder: 'Description of damage...',
        rows: 3,
        style: {
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white',
            resize: 'vertical'
        }
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: async ()=>{
            const propertyType = document.getElementById('propertyType').value;
            const damageLevel = document.getElementById('damageLevel').value;
            const estimatedLoss = document.getElementById('estimatedLoss').value;
            const description = document.getElementById('damageDescription').value;
            const success = await submitDamageReport(propertyType, damageLevel, estimatedLoss, description);
            if (success) {
                document.getElementById('propertyType').value = '';
                document.getElementById('damageLevel').value = '';
                document.getElementById('estimatedLoss').value = '';
                document.getElementById('damageDescription').value = '';
            }
        },
        style: {
            width: '100%',
            padding: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
        }
    }, 'Submit Damage Report')), // Financial Aid Section
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            padding: '20px',
            backgroundColor: '#1e293b',
            borderRadius: '8px'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h4', null, '💰 Apply for Financial Aid'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
        }
    }, // Government Relief
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            padding: '15px',
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: '1px solid #334155'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '8px'
        }
    }, 'Government Relief Fund'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
        style: {
            fontSize: '13px',
            opacity: 0.8,
            marginBottom: '10px'
        }
    }, 'Up to ₹50,000 for house damage'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        id: 'govReliefAmount',
        type: 'number',
        placeholder: 'Amount (₹)',
        style: {
            width: '100%',
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: async ()=>{
            const amount = document.getElementById('govReliefAmount').value;
            const success = await applyForFinancialAid('Government Relief Fund', amount);
            if (success) document.getElementById('govReliefAmount').value = '';
        },
        style: {
            width: '100%',
            padding: '8px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }
    }, 'Apply')), // Insurance Claim
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            padding: '15px',
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: '1px solid #334155'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '8px'
        }
    }, 'Insurance Claim'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
        style: {
            fontSize: '13px',
            opacity: 0.8,
            marginBottom: '10px'
        }
    }, 'Submit insurance claim documents'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        id: 'insuranceAmount',
        type: 'number',
        placeholder: 'Amount (₹)',
        style: {
            width: '100%',
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: async ()=>{
            const amount = document.getElementById('insuranceAmount').value;
            const success = await applyForFinancialAid('Insurance Claim', amount);
            if (success) document.getElementById('insuranceAmount').value = '';
        },
        style: {
            width: '100%',
            padding: '8px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }
    }, 'File Claim')), // Business Loan
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        style: {
            padding: '15px',
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: '1px solid #334155'
        }
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('strong', {
        style: {
            display: 'block',
            marginBottom: '8px'
        }
    }, 'Business Recovery Loan'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('p', {
        style: {
            fontSize: '13px',
            opacity: 0.8,
            marginBottom: '10px'
        }
    }, 'Low-interest loans for businesses'), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('input', {
        id: 'businessLoanAmount',
        type: 'number',
        placeholder: 'Amount (₹)',
        style: {
            width: '100%',
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: 'white'
        }
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('button', {
        onClick: async ()=>{
            const amount = document.getElementById('businessLoanAmount').value;
            const success = await applyForFinancialAid('Business Recovery Loan', amount);
            if (success) document.getElementById('businessLoanAmount').value = '';
        },
        style: {
            width: '100%',
            padding: '8px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }
    }, 'Apply'))))) : ((_sidebarSections_activeSection = sidebarSections[activeSection]) === null || _sidebarSections_activeSection === void 0 ? void 0 : _sidebarSections_activeSection.content) || /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('div', {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$user$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])('h3', null, 'Section not found')))));
};
_s1(UserDashboard, "mNLAdMWow0Tlzfdu9cLPCCWBOXo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c1 = UserDashboard;
const __TURBOPACK__default__export__ = UserDashboard;
var _c, _c1;
__turbopack_context__.k.register(_c, "IndiaRiskMap");
__turbopack_context__.k.register(_c1, "UserDashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/UserDashboard.js [client] (ecmascript)\" } [client] (ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const PAGE_PATH = "/UserDashboard";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/UserDashboard.js [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/UserDashboard\" }": ((__turbopack_context__) => {
"use strict";

var { m: module } = __turbopack_context__;
{
__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/UserDashboard.js [client] (ecmascript)\" } [client] (ecmascript)");
}}),
}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__4de7f7b0._.js.map