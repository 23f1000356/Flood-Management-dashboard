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
"[project]/pages/disaster-prediction-agent.module.css [client] (css module)": ((__turbopack_context__) => {

__turbopack_context__.v({
  "bounce": "disaster-prediction-agent-module__-60tqq__bounce",
  "chart": "disaster-prediction-agent-module__-60tqq__chart",
  "container": "disaster-prediction-agent-module__-60tqq__container",
  "formButton": "disaster-prediction-agent-module__-60tqq__formButton",
  "formGrid": "disaster-prediction-agent-module__-60tqq__formGrid",
  "formInput": "disaster-prediction-agent-module__-60tqq__formInput",
  "formLabel": "disaster-prediction-agent-module__-60tqq__formLabel",
  "formSelect": "disaster-prediction-agent-module__-60tqq__formSelect",
  "hero": "disaster-prediction-agent-module__-60tqq__hero",
  "heroText": "disaster-prediction-agent-module__-60tqq__heroText",
  "heroTitle": "disaster-prediction-agent-module__-60tqq__heroTitle",
  "highRisk": "disaster-prediction-agent-module__-60tqq__highRisk",
  "historyContainer": "disaster-prediction-agent-module__-60tqq__historyContainer",
  "historyDetails": "disaster-prediction-agent-module__-60tqq__historyDetails",
  "historyHeader": "disaster-prediction-agent-module__-60tqq__historyHeader",
  "historyItem": "disaster-prediction-agent-module__-60tqq__historyItem",
  "lowRisk": "disaster-prediction-agent-module__-60tqq__lowRisk",
  "moderateRisk": "disaster-prediction-agent-module__-60tqq__moderateRisk",
  "nav": "disaster-prediction-agent-module__-60tqq__nav",
  "navBrand": "disaster-prediction-agent-module__-60tqq__navBrand",
  "navContent": "disaster-prediction-agent-module__-60tqq__navContent",
  "navLink": "disaster-prediction-agent-module__-60tqq__navLink",
  "paramItem": "disaster-prediction-agent-module__-60tqq__paramItem",
  "paramLabel": "disaster-prediction-agent-module__-60tqq__paramLabel",
  "paramValue": "disaster-prediction-agent-module__-60tqq__paramValue",
  "paramsGrid": "disaster-prediction-agent-module__-60tqq__paramsGrid",
  "pulse": "disaster-prediction-agent-module__-60tqq__pulse",
  "resultsGrid": "disaster-prediction-agent-module__-60tqq__resultsGrid",
  "resultsIcon": "disaster-prediction-agent-module__-60tqq__resultsIcon",
  "resultsMetric": "disaster-prediction-agent-module__-60tqq__resultsMetric",
  "resultsMetricLabel": "disaster-prediction-agent-module__-60tqq__resultsMetricLabel",
  "resultsMetricValue": "disaster-prediction-agent-module__-60tqq__resultsMetricValue",
  "resultsRisk": "disaster-prediction-agent-module__-60tqq__resultsRisk",
  "resultsText": "disaster-prediction-agent-module__-60tqq__resultsText",
  "rotate": "disaster-prediction-agent-module__-60tqq__rotate",
  "section": "disaster-prediction-agent-module__-60tqq__section",
  "sectionSubtitle": "disaster-prediction-agent-module__-60tqq__sectionSubtitle",
  "sectionTitle": "disaster-prediction-agent-module__-60tqq__sectionTitle",
  "statsGrid": "disaster-prediction-agent-module__-60tqq__statsGrid",
  "statsItem": "disaster-prediction-agent-module__-60tqq__statsItem",
  "titleGlow": "disaster-prediction-agent-module__-60tqq__titleGlow",
  "waterGauge": "disaster-prediction-agent-module__-60tqq__waterGauge",
  "waterGaugeFill": "disaster-prediction-agent-module__-60tqq__waterGaugeFill",
});
}),
"[project]/pages/disaster-prediction-agent.js [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>DisasterPredictionAgent
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$chartjs$2d$2$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-chartjs-2/dist/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-toastify/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/pages/disaster-prediction-agent.module.css [client] (css module)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
// Register Chart.js components
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"].register(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CategoryScale"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["LinearScale"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["BarElement"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Title"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Tooltip"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Legend"]);
function DisasterPredictionAgent() {
    _s();
    const [prediction, setPrediction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        predict: false,
        stats: false,
        history: false
    });
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        mar_may_rainfall: 350,
        june_10days_rainfall: 250,
        may_june_increase: 400,
        region: 'Kerala'
    });
    const [history, setHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [modelStats, setModelStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [historyPage, setHistoryPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const itemsPerPage = 10;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DisasterPredictionAgent.useEffect": ()=>{
            loadModelStats();
            loadPredictionHistory();
        }
    }["DisasterPredictionAgent.useEffect"], []);
    const loadModelStats = async ()=>{
        setLoading((prev)=>({
                ...prev,
                stats: true
            }));
        try {
            const response = await fetch('http://localhost:8000/api/flood-model/stats');
            if (!response.ok) throw new Error("HTTP error! Status: ".concat(response.status));
            const stats = await response.json();
            setModelStats({
                ...stats,
                features: Array.isArray(stats.features) ? stats.features : []
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Error loading model stats: ' + error.message);
            setModelStats({
                model_type: 'N/A',
                accuracy: 0,
                training_data_period: 'N/A',
                region: 'N/A',
                features: []
            });
        } finally{
            setLoading((prev)=>({
                    ...prev,
                    stats: false
                }));
        }
    };
    const loadPredictionHistory = async ()=>{
        setLoading((prev)=>({
                ...prev,
                history: true
            }));
        try {
            const response = await fetch("http://localhost:8000/api/flood-predictions/history?limit=".concat(itemsPerPage, "&offset=").concat((historyPage - 1) * itemsPerPage));
            if (!response.ok) throw new Error("HTTP error! Status: ".concat(response.status));
            const { data } = await response.json();
            setHistory(data);
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Error loading prediction history: ' + error.message);
        } finally{
            setLoading((prev)=>({
                    ...prev,
                    history: false
                }));
        }
    };
    const handlePredict = async ()=>{
        if (formData.mar_may_rainfall < 0 || formData.mar_may_rainfall > 1000 || formData.june_10days_rainfall < 0 || formData.june_10days_rainfall > 500 || formData.may_june_increase < 0 || formData.may_june_increase > 1000) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Please enter valid rainfall values: March-May (0-1000mm), June 10-day (0-500mm), May-June Increase (0-1000mm)');
            return;
        }
        setLoading((prev)=>({
                ...prev,
                predict: true
            }));
        try {
            const response = await fetch('http://localhost:8000/api/predict-flood', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error("HTTP error! Status: ".concat(response.status));
            const result = await response.json();
            setPrediction(result);
            loadPredictionHistory();
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].success('Prediction completed successfully');
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["toast"].error('Error making prediction: ' + error.message);
        } finally{
            setLoading((prev)=>({
                    ...prev,
                    predict: false
                }));
        }
    };
    const handleInputChange = (e)=>{
        const { name, value } = e.target;
        setFormData((prev)=>({
                ...prev,
                [name]: name === 'region' ? value : parseFloat(value) || 0
            }));
    };
    const getRiskColor = (level)=>{
        switch(level){
            case 'high':
                return '#f44336';
            case 'moderate':
                return '#ff9800';
            case 'low':
                return '#4caf50';
            default:
                return '#666666';
        }
    };
    const getWaterColor = (level)=>{
        if (level > 2) return '#f44336';
        if (level > 1) return '#ff9800';
        return '#4caf50';
    };
    const chartData = prediction ? {
        labels: [
            'Flood Probability',
            'Model Confidence'
        ],
        datasets: [
            {
                label: 'Prediction Metrics',
                data: [
                    prediction.probability * 100,
                    prediction.confidence * 100
                ],
                backgroundColor: [
                    getRiskColor(prediction.risk_level),
                    '#00C4B4'
                ],
                borderColor: [
                    getRiskColor(prediction.risk_level),
                    '#00C4B4'
                ],
                borderWidth: 1
            }
        ]
    } : null;
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Flood Prediction Metrics',
                color: '#FFFFFF'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Percentage (%)',
                    color: '#FFFFFF'
                },
                ticks: {
                    color: '#FFFFFF'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
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
    const regions = [
        'Kerala',
        'Assam',
        'Bihar',
        'Uttar Pradesh',
        'West Bengal',
        'Odisha'
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].container,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$toastify$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["ToastContainer"], {
                position: "top-right",
                autoClose: 3000,
                theme: "dark"
            }, void 0, false, {
                fileName: "[project]/pages/disaster-prediction-agent.js",
                lineNumber: 176,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].nav,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navContent,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navBrand,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "💧"
                                }, void 0, false, {
                                    fileName: "[project]/pages/disaster-prediction-agent.js",
                                    lineNumber: 180,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Disaster Prediction Agent"
                                }, void 0, false, {
                                    fileName: "[project]/pages/disaster-prediction-agent.js",
                                    lineNumber: 181,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/disaster-prediction-agent.js",
                            lineNumber: 179,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "/",
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLink,
                            children: "← Back to Dashboard"
                        }, void 0, false, {
                            fileName: "[project]/pages/disaster-prediction-agent.js",
                            lineNumber: 183,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/disaster-prediction-agent.js",
                    lineNumber: 178,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/disaster-prediction-agent.js",
                lineNumber: 177,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].hero,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].heroTitle,
                        children: "AI-Powered Flood Prediction System"
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 190,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].heroText,
                        children: "Predict flood likelihood using rainfall patterns based on historical data (1901-2015). Enhanced with water level estimates and other parameters."
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 191,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/disaster-prediction-agent.js",
                lineNumber: 189,
                columnNumber: 7
            }, this),
            loading.stats ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loadingSpinner
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 198,
                        columnNumber: 11
                    }, this),
                    "Loading model stats..."
                ]
            }, void 0, true, {
                fileName: "[project]/pages/disaster-prediction-agent.js",
                lineNumber: 197,
                columnNumber: 9
            }, this) : modelStats && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Model Information"
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 203,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Model Type:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 206,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    modelStats.model_type
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 205,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Accuracy:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 209,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    (modelStats.accuracy * 100).toFixed(1),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 208,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Training Period:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 212,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    modelStats.training_data_period
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 211,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Region:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 215,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    modelStats.region
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 214,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 204,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].statsItem,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "Features:"
                            }, void 0, false, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 219,
                                columnNumber: 15
                            }, this),
                            ' ',
                            modelStats.features && Array.isArray(modelStats.features) ? modelStats.features.join(', ') : 'N/A'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 218,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/disaster-prediction-agent.js",
                lineNumber: 202,
                columnNumber: 11
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Rainfall Input Parameters"
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 229,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formLabel,
                                        children: "March-May Rainfall (mm):"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 232,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "mar_may_rainfall",
                                        value: formData.mar_may_rainfall,
                                        onChange: handleInputChange,
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formInput,
                                        min: "0",
                                        max: "1000"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 233,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 231,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formLabel,
                                        children: "June 10-day Average (mm):"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 244,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "june_10days_rainfall",
                                        value: formData.june_10days_rainfall,
                                        onChange: handleInputChange,
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formInput,
                                        min: "0",
                                        max: "500"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 245,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 243,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formLabel,
                                        children: "May-June Increase (mm):"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 256,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        name: "may_june_increase",
                                        value: formData.may_june_increase,
                                        onChange: handleInputChange,
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formInput,
                                        min: "0",
                                        max: "1000"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 257,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 255,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formGroup,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formLabel,
                                        children: "Region:"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 268,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        name: "region",
                                        value: formData.region,
                                        onChange: handleInputChange,
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formSelect,
                                        style: {
                                            color: 'black'
                                        },
                                        children: regions.map((region)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: region,
                                                style: {
                                                    color: 'black'
                                                },
                                                children: region
                                            }, region, false, {
                                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                                lineNumber: 277,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 269,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 267,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 230,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handlePredict,
                        disabled: loading.predict,
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formButton,
                        children: loading.predict ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loadingSpinner
                                }, void 0, false, {
                                    fileName: "[project]/pages/disaster-prediction-agent.js",
                                    lineNumber: 291,
                                    columnNumber: 15
                                }, this),
                                "Predicting..."
                            ]
                        }, void 0, true) : 'Predict Flood Risk'
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 284,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/disaster-prediction-agent.js",
                lineNumber: 228,
                columnNumber: 7
            }, this),
            prediction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Prediction Results"
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 301,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    textAlign: 'center'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsIcon, " ").concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"]["".concat(prediction.risk_level, "Risk")]),
                                        children: prediction.prediction === 1 ? '⚠️' : '✅'
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 304,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsText,
                                        children: prediction.interpretation
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 309,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsRisk,
                                        children: [
                                            "Risk Level:",
                                            ' ',
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"]["".concat(prediction.risk_level, "Risk")],
                                                children: prediction.risk_level.toUpperCase()
                                            }, void 0, false, {
                                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                                lineNumber: 312,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 310,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 303,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: chartData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].chart,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$chartjs$2d$2$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Bar"], {
                                        data: chartData,
                                        options: chartOptions
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 320,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/pages/disaster-prediction-agent.js",
                                    lineNumber: 319,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 317,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 302,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsMetric,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsMetricValue,
                                        children: [
                                            (prediction.probability * 100).toFixed(1),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 327,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsMetricLabel,
                                        children: "Flood Probability"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 330,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 326,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsMetric,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsMetricValue,
                                        children: [
                                            (prediction.confidence * 100).toFixed(1),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 333,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].resultsMetricLabel,
                                        children: "Model Confidence"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 336,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 332,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 325,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionSubtitle,
                        children: "Additional Flood Parameters"
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 339,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramsGrid,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramLabel,
                                        children: "Estimated Water Level (m)"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 342,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramValue,
                                        style: {
                                            color: getWaterColor(prediction.estimated_water_level)
                                        },
                                        children: prediction.estimated_water_level
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 343,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].waterGauge,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].waterGaugeFill,
                                            style: {
                                                width: "".concat(Math.min(prediction.estimated_water_level / 3 * 100, 100), "%"),
                                                backgroundColor: getWaterColor(prediction.estimated_water_level)
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/pages/disaster-prediction-agent.js",
                                            lineNumber: 347,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 346,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 341,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramLabel,
                                        children: "Current River Level (m)"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 357,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramValue,
                                        style: {
                                            color: getWaterColor(prediction.current_river_level - 5)
                                        },
                                        children: prediction.current_river_level
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 358,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].waterGauge,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].waterGaugeFill,
                                            style: {
                                                width: "".concat(Math.min((prediction.current_river_level - 5) / 2 * 100, 100), "%"),
                                                backgroundColor: getWaterColor(prediction.current_river_level - 5)
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/pages/disaster-prediction-agent.js",
                                            lineNumber: 362,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 361,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 356,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramLabel,
                                        children: "Evacuation Recommended"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 372,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramValue,
                                        style: {
                                            color: prediction.evacuation_recommendation === 'Yes' ? '#f44336' : '#4caf50'
                                        },
                                        children: prediction.evacuation_recommendation
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 373,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 371,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramItem,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramLabel,
                                        children: "Estimated Affected Population"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 378,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].paramValue,
                                        children: prediction.affected_population_estimate.toLocaleString()
                                    }, void 0, false, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 379,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 377,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 340,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/disaster-prediction-agent.js",
                lineNumber: 300,
                columnNumber: 9
            }, this),
            loading.history ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loadingSpinner
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 389,
                        columnNumber: 11
                    }, this),
                    "Loading prediction history..."
                ]
            }, void 0, true, {
                fileName: "[project]/pages/disaster-prediction-agent.js",
                lineNumber: 388,
                columnNumber: 9
            }, this) : history.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                        children: "Recent Predictions"
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 394,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyContainer,
                        children: history.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyItem, " ").concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"]["".concat(item.flood_probability > 0.7 ? 'high' : item.flood_probability > 0.3 ? 'moderate' : 'low', "Risk")]),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyHeader,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    item.region,
                                                    " - ",
                                                    item.flood_prediction === 1 ? 'Flood Expected' : 'No Flood'
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                                lineNumber: 402,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyDetails,
                                                children: new Date(item.predicted_at).toLocaleString()
                                            }, void 0, false, {
                                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                                lineNumber: 405,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 401,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyDetails,
                                        children: [
                                            "Probability: ",
                                            (item.flood_probability * 100).toFixed(1),
                                            "% | Confidence:",
                                            ' ',
                                            (item.confidence * 100).toFixed(1),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 409,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].historyDetails,
                                        children: [
                                            "Water Level: ",
                                            item.estimated_water_level,
                                            "m | River Level: ",
                                            item.current_river_level,
                                            "m"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/disaster-prediction-agent.js",
                                        lineNumber: 413,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, item.id, true, {
                                fileName: "[project]/pages/disaster-prediction-agent.js",
                                lineNumber: 397,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 395,
                        columnNumber: 13
                    }, this),
                    history.length >= historyPage * itemsPerPage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setHistoryPage((prev)=>prev + 1),
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$disaster$2d$prediction$2d$agent$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formButton,
                        style: {
                            width: '150px',
                            marginTop: '1rem'
                        },
                        children: "Load More"
                    }, void 0, false, {
                        fileName: "[project]/pages/disaster-prediction-agent.js",
                        lineNumber: 420,
                        columnNumber: 15
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/disaster-prediction-agent.js",
                lineNumber: 393,
                columnNumber: 11
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/disaster-prediction-agent.js",
        lineNumber: 175,
        columnNumber: 5
    }, this);
}
_s(DisasterPredictionAgent, "jIiFntYgujSzgySyf5/yjQViGQI=");
_c = DisasterPredictionAgent;
var _c;
__turbopack_context__.k.register(_c, "DisasterPredictionAgent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/disaster-prediction-agent.js [client] (ecmascript)\" } [client] (ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const PAGE_PATH = "/disaster-prediction-agent";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/disaster-prediction-agent.js [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/disaster-prediction-agent\" }": ((__turbopack_context__) => {
"use strict";

var { m: module } = __turbopack_context__;
{
__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/disaster-prediction-agent.js [client] (ecmascript)\" } [client] (ecmascript)");
}}),
}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__ce0f0915._.js.map