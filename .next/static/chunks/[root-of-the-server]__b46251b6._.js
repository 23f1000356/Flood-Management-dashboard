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
"[project]/pages/login.module.css [client] (css module)": ((__turbopack_context__) => {

__turbopack_context__.v({
  "btn": "login-module__lgJPRG__btn",
  "btnPrimary": "login-module__lgJPRG__btnPrimary",
  "container": "login-module__lgJPRG__container",
  "fadeInUp": "login-module__lgJPRG__fadeInUp",
  "form": "login-module__lgJPRG__form",
  "formContainer": "login-module__lgJPRG__formContainer",
  "gradient": "login-module__lgJPRG__gradient",
  "input": "login-module__lgJPRG__input",
  "inputGroup": "login-module__lgJPRG__inputGroup",
  "label": "login-module__lgJPRG__label",
  "link": "login-module__lgJPRG__link",
  "parallaxBg": "login-module__lgJPRG__parallaxBg",
  "select": "login-module__lgJPRG__select",
  "signupLink": "login-module__lgJPRG__signupLink",
  "subtitle": "login-module__lgJPRG__subtitle",
  "success": "login-module__lgJPRG__success",
  "title": "login-module__lgJPRG__title",
});
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
"[project]/pages/login.js [client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/pages/login.module.css [client] (css module)");
var __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/pages/index.module.css [client] (css module)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
/**
 * Login component for user authentication
 */ const Login = ()=>{
    _s();
    const [username, setUsername] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [role, setRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("user");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [flashMessage, setFlashMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [showErrorPopup, setShowErrorPopup] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isMenuOpen, setIsMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Login.useEffect": ()=>{
            const message = searchParams.get("message");
            if (message) {
                setFlashMessage(message);
                const timer = setTimeout({
                    "Login.useEffect.timer": ()=>setFlashMessage("")
                }["Login.useEffect.timer"], 3000);
                return ({
                    "Login.useEffect": ()=>clearTimeout(timer)
                })["Login.useEffect"];
            }
        }
    }["Login.useEffect"], [
        searchParams
    ]);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setError("");
        setFlashMessage("");
        setShowErrorPopup(false);
        if (!username.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            setShowErrorPopup(true);
            return;
        }
        try {
            const loginData = {
                username,
                password,
                role
            };
            console.log("Sending login data:", loginData);
            const response = await fetch("http://localhost:8000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Login error:", errorData);
                throw new Error(errorData.detail || "Login failed");
            }
            const data = await response.json();
            // Store user data in localStorage to match Admin.js and UserDashboard.js expectations
            localStorage.setItem("user", JSON.stringify({
                id: data.user_id || Math.floor(Math.random() * 1000),
                username: data.username,
                role: data.role
            }));
            // Use the redirect field from the backend response
            if (data.redirect === "/admin") {
                router.push("/admin");
            } else {
                router.push("/UserDashboard");
            }
            // Optional: Set a success flash message
            setFlashMessage("Login successful!");
        } catch (err) {
            setError(err.message || "Invalid username or password. Please try again.");
            setShowErrorPopup(true);
            console.error("Login error:", err);
        }
    };
    const toggleMenu = ()=>{
        setIsMenuOpen(!isMenuOpen);
    };
    const scrollToSection = (sectionId)=>{
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: "smooth"
            });
        }
        setIsMenuOpen(false);
    };
    const handlePopupClose = ()=>{
        setShowErrorPopup(false);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].container
    }, // Navigation
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("nav", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navbar
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navContainer
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLogo
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("span", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].logoIcon
    }, "🌱"), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("span", null, "ACMS")), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("ul", {
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navMenu, " ").concat(isMenuOpen ? __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].active : "")
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("li", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navItem
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("a", {
        href: "/",
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLink, " ").concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loginBtn)
    }, "Home")), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("li", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navItem
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("a", {
        href: "/signup",
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].navLink, " ").concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].loginBtn)
    }, "Sign Up"))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].hamburger, " ").concat(isMenuOpen ? __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].active : ""),
        onClick: toggleMenu
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("span", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].bar
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("span", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].bar
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("span", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$index$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].bar
    })))), // Main Content
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].parallaxBg
    }), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].formContainer
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("h1", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].title
    }, "Login to ACMS"), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("p", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].subtitle
    }, "Access the Autonomous Climate Mitigation System"), flashMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("p", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].success
    }, flashMessage), error && !showErrorPopup && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("p", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].error
    }, error), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("form", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].form,
        onSubmit: handleSubmit
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("label", {
        htmlFor: "username",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].label
    }, "Username"), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("input", {
        type: "text",
        id: "username",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].input,
        value: username,
        onChange: (e)=>setUsername(e.target.value),
        placeholder: "Enter your username",
        required: true
    })), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("label", {
        htmlFor: "password",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].label
    }, "Password"), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("input", {
        type: "password",
        id: "password",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].input,
        value: password,
        onChange: (e)=>setPassword(e.target.value),
        placeholder: "Enter your password",
        required: true
    })), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].inputGroup
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("label", {
        htmlFor: "role",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].label
    }, "Role"), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("select", {
        id: "role",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].select,
        value: role,
        onChange: (e)=>setRole(e.target.value)
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("option", {
        value: "user"
    }, "User"), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("option", {
        value: "admin"
    }, "Admin"))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("button", {
        type: "submit",
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].btn, " ").concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].btnPrimary)
    }, "Login")), showErrorPopup && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].popup
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].popupContent
    }, /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("h2", null, "Error"), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("p", null, error), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("button", {
        onClick: handlePopupClose,
        className: "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].btn, " ").concat(__TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].btnPrimary)
    }, "OK"))), /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("p", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].signupLink
    }, "New user? ", /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createElement"])("a", {
        href: "/signup",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$pages$2f$login$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].link
    }, "Sign up"))));
};
_s(Login, "8Jr/aVwa4j2T+fxPCKb7FpHSJ0o=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useSearchParams"]
    ];
});
_c = Login;
const __TURBOPACK__default__export__ = Login;
var _c;
__turbopack_context__.k.register(_c, "Login");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/login.js [client] (ecmascript)\" } [client] (ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const PAGE_PATH = "/login";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/login.js [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/login\" }": ((__turbopack_context__) => {
"use strict";

var { m: module } = __turbopack_context__;
{
__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/login.js [client] (ecmascript)\" } [client] (ecmascript)");
}}),
}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__b46251b6._.js.map