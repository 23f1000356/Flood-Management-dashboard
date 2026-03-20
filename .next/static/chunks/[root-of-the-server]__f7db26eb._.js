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
"[project]/pages/monitoring-agent.module.css [client] (css module)": ((__turbopack_context__) => {

__turbopack_context__.v({
  "bounce": "monitoring-agent-module__cIWdCW__bounce",
  "chart": "monitoring-agent-module__cIWdCW__chart",
  "container": "monitoring-agent-module__cIWdCW__container",
  "formButton": "monitoring-agent-module__cIWdCW__formButton",
  "formGrid": "monitoring-agent-module__cIWdCW__formGrid",
  "formInput": "monitoring-agent-module__cIWdCW__formInput",
  "formLabel": "monitoring-agent-module__cIWdCW__formLabel",
  "formSelect": "monitoring-agent-module__cIWdCW__formSelect",
  "hero": "monitoring-agent-module__cIWdCW__hero",
  "heroText": "monitoring-agent-module__cIWdCW__heroText",
  "heroTitle": "monitoring-agent-module__cIWdCW__heroTitle",
  "highRisk": "monitoring-agent-module__cIWdCW__highRisk",
  "historyContainer": "monitoring-agent-module__cIWdCW__historyContainer",
  "historyDetails": "monitoring-agent-module__cIWdCW__historyDetails",
  "historyHeader": "monitoring-agent-module__cIWdCW__historyHeader",
  "historyItem": "monitoring-agent-module__cIWdCW__historyItem",
  "lowRisk": "monitoring-agent-module__cIWdCW__lowRisk",
  "moderateRisk": "monitoring-agent-module__cIWdCW__moderateRisk",
  "nav": "monitoring-agent-module__cIWdCW__nav",
  "navBrand": "monitoring-agent-module__cIWdCW__navBrand",
  "navContent": "monitoring-agent-module__cIWdCW__navContent",
  "navLink": "monitoring-agent-module__cIWdCW__navLink",
  "paramItem": "monitoring-agent-module__cIWdCW__paramItem",
  "paramLabel": "monitoring-agent-module__cIWdCW__paramLabel",
  "paramValue": "monitoring-agent-module__cIWdCW__paramValue",
  "paramsGrid": "monitoring-agent-module__cIWdCW__paramsGrid",
  "pulse": "monitoring-agent-module__cIWdCW__pulse",
  "resultsGrid": "monitoring-agent-module__cIWdCW__resultsGrid",
  "resultsIcon": "monitoring-agent-module__cIWdCW__resultsIcon",
  "resultsMetric": "monitoring-agent-module__cIWdCW__resultsMetric",
  "resultsMetricLabel": "monitoring-agent-module__cIWdCW__resultsMetricLabel",
  "resultsMetricValue": "monitoring-agent-module__cIWdCW__resultsMetricValue",
  "resultsRisk": "monitoring-agent-module__cIWdCW__resultsRisk",
  "resultsText": "monitoring-agent-module__cIWdCW__resultsText",
  "rotate": "monitoring-agent-module__cIWdCW__rotate",
  "section": "monitoring-agent-module__cIWdCW__section",
  "sectionSubtitle": "monitoring-agent-module__cIWdCW__sectionSubtitle",
  "sectionTitle": "monitoring-agent-module__cIWdCW__sectionTitle",
  "statsGrid": "monitoring-agent-module__cIWdCW__statsGrid",
  "statsItem": "monitoring-agent-module__cIWdCW__statsItem",
  "titleGlow": "monitoring-agent-module__cIWdCW__titleGlow",
  "waterGauge": "monitoring-agent-module__cIWdCW__waterGauge",
  "waterGaugeFill": "monitoring-agent-module__cIWdCW__waterGaugeFill",
});
}),
"[project]/pages/monitoring-agent.js [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>MonitoringAgent
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$chartjs$2d$2$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-chartjs-2/dist/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-toastify/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/pages/monitoring-agent.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
// Register Chart.js components
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"].register(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CategoryScale"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["LinearScale"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["BarElement"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ArcElement"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Title"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Tooltip"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Legend"]);
function MonitoringAgent() {
    _s();
    const [systemStatus, setSystemStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [metrics, setMetrics] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [reports, setReports] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [externalSources, setExternalSources] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [alerts, setAlerts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [modelStats, setModelStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        status: false,
        metrics: false,
        reports: false,
        sources: false,
        alerts: false,
        model: false
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MonitoringAgent.useEffect": ()=>{
            loadSystemStatus();
            loadMetrics();
            loadReports();
            loadExternalSources();
            loadAlerts();
            loadModelStats();
            const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])('http://localhost:8000', {
                transports: [
                    'websocket'
                ]
            });
            socket.on('connect', {
                "MonitoringAgent.useEffect": ()=>console.log('SocketIO connected')
            }["MonitoringAgent.useEffect"]);
            socket.on('alert', {
                "MonitoringAgent.useEffect": (data)=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].info("New Alert: ".concat(data.message, " (").concat(data.type, ")"));
                    setAlerts({
                        "MonitoringAgent.useEffect": (prev)=>[
                                ...prev,
                                {
                                    ...data,
                                    time: new Date().toISOString()
                                }
                            ]
                    }["MonitoringAgent.useEffect"]);
                }
            }["MonitoringAgent.useEffect"]);
            socket.on('new_prediction', {
                "MonitoringAgent.useEffect": (data)=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].info("New Prediction: ".concat(data.region, " - ").concat(data.risk_level.toUpperCase(), " Risk"));
                    setReports({
                        "MonitoringAgent.useEffect": (prev)=>{
                            if (!prev) return prev;
                            const updated = {
                                ...prev.region_summary
                            };
                            if (!updated[data.region]) {
                                updated[data.region] = {
                                    high_risk_count: 0,
                                    moderate_risk_count: 0,
                                    low_risk_count: 0,
                                    latest_prediction: null
                                };
                            }
                            if (data.risk_level === 'high') updated[data.region].high_risk_count += 1;
                            else if (data.risk_level === 'moderate') updated[data.region].moderate_risk_count += 1;
                            else updated[data.region].low_risk_count += 1;
                            if (!updated[data.region].latest_prediction || new Date(data.predicted_at) > new Date(updated[data.region].latest_prediction.predicted_at)) {
                                updated[data.region].latest_prediction = data;
                            }
                            return {
                                ...prev,
                                region_summary: updated
                            };
                        }
                    }["MonitoringAgent.useEffect"]);
                }
            }["MonitoringAgent.useEffect"]);
            socket.on('connect_error', {
                "MonitoringAgent.useEffect": (err)=>console.error('SocketIO connection error:', err)
            }["MonitoringAgent.useEffect"]);
            return ({
                "MonitoringAgent.useEffect": ()=>socket.disconnect()
            })["MonitoringAgent.useEffect"];
        }
    }["MonitoringAgent.useEffect"], []);
    const loadSystemStatus = async ()=>{
        setLoading((prev)=>({
                ...prev,
                status: true
            }));
        try {
            const response = await fetch('http://localhost:8000/api/system-status');
            if (!response.ok) throw new Error('Failed to load system status');
            const data = await response.json();
            setSystemStatus(data);
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Error loading system status');
            console.error(error);
        } finally{
            setLoading((prev)=>({
                    ...prev,
                    status: false
                }));
        }
    };
    const loadMetrics = async ()=>{
        setLoading((prev)=>({
                ...prev,
                metrics: true
            }));
        try {
            const response = await fetch('http://localhost:8000/api/monitoring/metrics');
            if (!response.ok) throw new Error('Failed to load metrics');
            const data = await response.json();
            setMetrics(data);
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Error loading metrics');
            console.error(error);
        } finally{
            setLoading((prev)=>({
                    ...prev,
                    metrics: false
                }));
        }
    };
    const loadReports = async ()=>{
        setLoading((prev)=>({
                ...prev,
                reports: true
            }));
        try {
            const response = await fetch('http://localhost:8000/api/monitoring/reports');
            if (!response.ok) throw new Error('Failed to load reports');
            const data = await response.json();
            setReports(data);
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Error loading reports');
            console.error(error);
        } finally{
            setLoading((prev)=>({
                    ...prev,
                    reports: false
                }));
        }
    };
    const loadExternalSources = async ()=>{
        setLoading((prev)=>({
                ...prev,
                sources: true
            }));
        try {
            const response = await fetch('http://localhost:8000/api/monitoring/external-sources');
            if (!response.ok) throw new Error('Failed to load external sources');
            const data = await response.json();
            setExternalSources(data.sources);
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Error loading external sources');
            console.error(error);
        } finally{
            setLoading((prev)=>({
                    ...prev,
                    sources: false
                }));
        }
    };
    const loadAlerts = async ()=>{
        setLoading((prev)=>({
                ...prev,
                alerts: true
            }));
        try {
            const response = await fetch('http://localhost:8000/api/alerts');
            if (!response.ok) throw new Error('Failed to load alerts');
            const { data } = await response.json();
            setAlerts(data || []);
        } catch (error) {
            console.warn('Alerts endpoint not available, skipping:', error);
            setAlerts([]); // Fallback to empty array
        } finally{
            setLoading((prev)=>({
                    ...prev,
                    alerts: false
                }));
        }
    };
    const loadModelStats = async ()=>{
        setLoading((prev)=>({
                ...prev,
                model: true
            }));
        try {
            const response = await fetch('http://localhost:8000/api/flood-model/stats');
            if (!response.ok) throw new Error('Failed to load model stats');
            const data = await response.json();
            setModelStats(data);
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Error loading model stats');
            console.error(error);
        } finally{
            setLoading((prev)=>({
                    ...prev,
                    model: false
                }));
        }
    };
    const handleRetrain = async ()=>{
        try {
            const response = await fetch('http://localhost:8000/api/monitoring/retrain-model', {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to retrain model');
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].success('Model retrained successfully');
            loadReports();
            loadModelStats(); // Refresh model stats after retrain
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Error retraining model');
            console.error(error);
        }
    };
    const getColor = (value, thresholdHigh, thresholdLow)=>{
        if (value > thresholdHigh) return '#f44336';
        if (value > thresholdLow) return '#ff9800';
        return '#4caf50';
    };
    const statusChartData = systemStatus ? {
        labels: [
            'CPU %',
            'Memory %'
        ],
        datasets: [
            {
                label: 'Usage',
                data: [
                    systemStatus.cpu_percent,
                    systemStatus.memory_percent
                ],
                backgroundColor: [
                    getColor(systemStatus.cpu_percent, 90, 70),
                    getColor(systemStatus.memory_percent, 90, 70)
                ]
            }
        ]
    } : null;
    const metricsChartData = metrics ? {
        labels: [
            'Satellites',
            'Weather Stations',
            'Data Points/min'
        ],
        datasets: [
            {
                data: [
                    metrics.satellites_active,
                    metrics.weather_stations,
                    metrics.datapoints_per_min / 1000
                ],
                backgroundColor: [
                    '#4caf50',
                    '#ff9800',
                    '#00C4B4'
                ]
            }
        ]
    } : null;
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                color: '#FFFFFF'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#FFFFFF'
                },
                grid: {
                    color: 'rgba(255,255,255,0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#FFFFFF'
                },
                grid: {
                    display: false
                }
            }
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["ToastContainer"], {
                position: "top-right",
                autoClose: 3000,
                theme: "dark"
            }, void 0, false, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 215,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].nav,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navContent,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navBrand,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "🔍"
                                }, void 0, false, {
                                    fileName: "[project]/pages/monitoring-agent.js",
                                    lineNumber: 220,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Monitoring Agent"
                                }, void 0, false, {
                                    fileName: "[project]/pages/monitoring-agent.js",
                                    lineNumber: 221,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/monitoring-agent.js",
                            lineNumber: 219,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "/",
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLink,
                            children: "← Back to Dashboard"
                        }, void 0, false, {
                            fileName: "[project]/pages/monitoring-agent.js",
                            lineNumber: 223,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/monitoring-agent.js",
                    lineNumber: 218,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 217,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].hero,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].heroTitle,
                        children: "AI-Powered System Monitoring"
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 231,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].heroText,
                        children: "Monitor system health, data sources, alerts, and predictions in real-time for reliable flood disaster management."
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 232,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 230,
                columnNumber: 7
            }, this),
            loading.status ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loadingSpinner
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 240,
                        columnNumber: 11
                    }, this),
                    "Loading system status..."
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 239,
                columnNumber: 9
            }, this) : systemStatus && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "System Status"
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 245,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Uptime:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 248,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    Math.floor(systemStatus.uptime_seconds / 3600),
                                    " hours"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 247,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "CPU:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 251,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    systemStatus.cpu_percent,
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 250,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Memory:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 254,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    systemStatus.memory_percent,
                                    "% (",
                                    systemStatus.memory_used_gb,
                                    "GB used)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 253,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Hostname:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 257,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    systemStatus.hostname
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 256,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 246,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].chart,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$chartjs$2d$2$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Bar"], {
                            data: statusChartData,
                            options: {
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    title: {
                                        text: 'Resource Usage'
                                    }
                                }
                            }
                        }, void 0, false, {
                            fileName: "[project]/pages/monitoring-agent.js",
                            lineNumber: 261,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 260,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 244,
                columnNumber: 11
            }, this),
            loading.metrics ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loadingSpinner
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 273,
                        columnNumber: 11
                    }, this),
                    "Loading metrics..."
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 272,
                columnNumber: 9
            }, this) : metrics && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Environmental Metrics"
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 278,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Satellites Active:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 281,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    metrics.satellites_active
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 280,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Weather Stations:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 284,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    metrics.weather_stations
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 283,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Data Points/min:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 287,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    metrics.datapoints_per_min
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 286,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 279,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].chart,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$chartjs$2d$2$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Doughnut"], {
                            data: metricsChartData,
                            options: {
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    title: {
                                        text: 'Data Sources'
                                    }
                                }
                            }
                        }, void 0, false, {
                            fileName: "[project]/pages/monitoring-agent.js",
                            lineNumber: 291,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 290,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 277,
                columnNumber: 11
            }, this),
            loading.sources ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loadingSpinner
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 303,
                        columnNumber: 11
                    }, this),
                    "Loading external sources..."
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 302,
                columnNumber: 9
            }, this) : externalSources && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "External Data Sources"
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 308,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyContainer,
                        children: externalSources.map((source, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyItem,
                                style: {
                                    backgroundColor: source.status === 'operational' ? '#4caf50' : source.status === 'degraded' ? '#ff9800' : '#f44336'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyHeader,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                source.name,
                                                " - ",
                                                source.status
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/monitoring-agent.js",
                                            lineNumber: 320,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 319,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyDetails,
                                        children: [
                                            "Latency: ",
                                            source.latency_ms,
                                            "ms"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 324,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, index, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 311,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 309,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 307,
                columnNumber: 11
            }, this),
            loading.reports ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loadingSpinner
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 335,
                        columnNumber: 11
                    }, this),
                    "Loading reports..."
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 334,
                columnNumber: 9
            }, this) : reports && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Monitoring Reports"
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 340,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsGrid,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Active Alerts:"
                                }, void 0, false, {
                                    fileName: "[project]/pages/monitoring-agent.js",
                                    lineNumber: 343,
                                    columnNumber: 17
                                }, this),
                                " ",
                                reports.active_alerts
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/monitoring-agent.js",
                            lineNumber: 342,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 341,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionSubtitle,
                        children: "High Risk Predictions by Region"
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 346,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramsGrid,
                        children: Object.entries(reports.high_risk_predictions).map((param)=>{
                            let [region, count] = param;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramLabel,
                                        children: region
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 350,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramValue,
                                        children: count
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 351,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, region, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 349,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 347,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionSubtitle,
                        children: "Latest Flood Predictions"
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 355,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyContainer,
                        children: reports.flood_predictions && reports.flood_predictions.length > 0 ? reports.flood_predictions.map((pred)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyItem, " ").concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"]["".concat(pred.risk_level, "Risk")]),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyHeader,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    pred.region,
                                                    " - ",
                                                    pred.risk_level.toUpperCase(),
                                                    " Risk"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/monitoring-agent.js",
                                                lineNumber: 364,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyDetails,
                                                children: new Date(pred.predicted_at).toLocaleString()
                                            }, void 0, false, {
                                                fileName: "[project]/pages/monitoring-agent.js",
                                                lineNumber: 367,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 363,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyDetails,
                                        children: [
                                            "Probability: ",
                                            (pred.probability * 100).toFixed(1),
                                            "% | Water Level: ",
                                            pred.estimated_water_level,
                                            "m | River Level: ",
                                            pred.current_river_level,
                                            "m"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 371,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, pred.id, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 359,
                                columnNumber: 19
                            }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyItem,
                            children: "No recent flood predictions available"
                        }, void 0, false, {
                            fileName: "[project]/pages/monitoring-agent.js",
                            lineNumber: 377,
                            columnNumber: 17
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 356,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 339,
                columnNumber: 11
            }, this),
            loading.alerts ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loadingSpinner
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 387,
                        columnNumber: 11
                    }, this),
                    "Loading alerts..."
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 386,
                columnNumber: 9
            }, this) : alerts.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Active Alerts"
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 392,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyContainer,
                        children: alerts.map((alert, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyItem,
                                style: {
                                    backgroundColor: alert.type === 'error' ? '#f44336' : alert.type === 'warning' ? '#ff9800' : '#4caf50'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyHeader,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: alert.title || alert.message
                                        }, void 0, false, {
                                            fileName: "[project]/pages/monitoring-agent.js",
                                            lineNumber: 404,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 403,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyDetails,
                                        children: [
                                            "Type: ",
                                            alert.type,
                                            " | Time: ",
                                            new Date(alert.time).toLocaleString()
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 406,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, index, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 395,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 393,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 391,
                columnNumber: 11
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleRetrain,
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formButton,
                    children: "Retrain Flood Model"
                }, void 0, false, {
                    fileName: "[project]/pages/monitoring-agent.js",
                    lineNumber: 418,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 417,
                columnNumber: 7
            }, this),
            loading.model ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loadingSpinner
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 426,
                        columnNumber: 11
                    }, this),
                    "Loading model information..."
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 425,
                columnNumber: 9
            }, this) : modelStats && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Flood Model Information"
                    }, void 0, false, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 431,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Model Type:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 434,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    modelStats.model_type
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 433,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Accuracy:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 437,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    modelStats.accuracy,
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 436,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Training Period:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 440,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    modelStats.training_data_period
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 439,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Region:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 443,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    modelStats.region
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 442,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Model Status:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/monitoring-agent.js",
                                        lineNumber: 446,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    modelStats.model_status
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 445,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 432,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$monitoring$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Features:"
                            }, void 0, false, {
                                fileName: "[project]/pages/monitoring-agent.js",
                                lineNumber: 450,
                                columnNumber: 15
                            }, this),
                            " ",
                            modelStats.features.join(', ')
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/monitoring-agent.js",
                        lineNumber: 449,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/monitoring-agent.js",
                lineNumber: 430,
                columnNumber: 11
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/monitoring-agent.js",
        lineNumber: 214,
        columnNumber: 5
    }, this);
}
_s(MonitoringAgent, "D/6+GBa4z5b+5gN1VBcIkoQ9lt4=");
_c = MonitoringAgent;
var _c;
__turbopack_context__.k.register(_c, "MonitoringAgent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/monitoring-agent.js [client] (ecmascript)\" } [client] (ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const PAGE_PATH = "/monitoring-agent";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/monitoring-agent.js [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/monitoring-agent\" }": ((__turbopack_context__) => {
"use strict";

var { m: module } = __turbopack_context__;
{
__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/monitoring-agent.js [client] (ecmascript)\" } [client] (ecmascript)");
}}),
}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f7db26eb._.js.map