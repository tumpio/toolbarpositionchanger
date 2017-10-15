const {classes: Cc, interfaces: Ci} = Components;

const TYPE_BROWSER_WINDOW = "navigator:browser";
const TOOLBAR_TAG_NAME = "toolbar";
const TOP_TOOLBAR_CONTAINER_ID = "navigator-toolbox";
const BOTTOM_TOOLBAR_CONTAINER_ID = "browser-bottombox";

/**
 * Toolbar API
 */
class API extends ExtensionAPI {
    getAPI(context) {
        return {
            toolbar: {
                async hide(toolbarId) {
                    return setToolbarVisibility(toolbarId, false);
                },
                async show(toolbarId) {
                    return setToolbarVisibility(toolbarId, true);
                },
                async move(toolbarId, moveProperties) {
                    return moveToolbar(toolbarId, moveProperties);
                },
                async get(toolbarId) {
                    return getToolbar(toolbarId);
                },
                async getAll() {
                    return getAllToolbars();
                }
            }
        };
    }
}

/**
 * Toolbar object type
 * @param toolbar toolbar XUL element
 */
class Toolbar {
    constructor(toolbar) {
        this.id = toolbar.id;
        this.index = getToolbarPosition(toolbar);
        this.bottom = toolbar.parentNode.id == BOTTOM_TOOLBAR_CONTAINER_ID;
        this.hidden = toolbar.getAttribute("hidden") == "true";
    }
}

/**
 * Get toolbar element by id
 * @param toolbarId id of toolbar
 * @param window browser window
 * @returns {Element} toolbar element
 * @throws Error if toolbar not found
 */
function getToolbarElement(toolbarId, window = getBrowserWindow()) {
    let element = window.document.getElementById(toolbarId);
    if (!element || element.tagName !== TOOLBAR_TAG_NAME) {
        throw Error(`Toolbar for Id ${toolbarId} not found.`);
    }
    return element;
}

/**
 * Get Toolbar
 * @param toolbarId toolbar element id
 * @returns {Toolbar}
 */
function getToolbar(toolbarId) {
    return new Toolbar(getToolbarElement(toolbarId));
}

/**
 * Get all toolbars in browser window
 * @returns {[Toolbar]}
 */
function getAllToolbars() {
    let window = getBrowserWindow();
    let toolbars = [];
    for (let element of window.document.getElementsByTagName(TOOLBAR_TAG_NAME)) {
        toolbars.push(new Toolbar(element));
    }
    return toolbars;
}

/**
 * Get index position of toolbar relative to toolbar siblings in parent node
 * @param toolbar element
 * @returns {number} position index
 */
function getToolbarPosition(toolbar) {
    let toolbars = toolbar.parentNode.getElementsByTagName(TOOLBAR_TAG_NAME);

    for (let i = 0; i < toolbars.length; i++) {
        if (toolbar == toolbars[i]) {
            return i;
        }
    }
    return -1;
}

/**
 * Set toolbar visibility
 * @param toolbarId id of toolbar
 * @param visible boolean
 * @returns {Toolbar}
 */
function setToolbarVisibility(toolbarId, visible) {
    let toolbar;
    forAllBrowserWindows(function (window) {
        toolbar = getToolbarElement(toolbarId, window);
        toolbar.setAttribute("hidden", !visible);
    });
    return new Toolbar(toolbar);
}

/**
 * Move toolbar to a new position
 * @param toolbarId id of toolbar element
 * @param moveProperties move properties
 * @returns {Toolbar|[Toolbar]}
 */
function moveToolbar(toolbarId, moveProperties) {
    let index = moveProperties.index;
    let bottom = moveProperties.bottom;
    let parentId;
    let movedToolbars = [];

    if (bottom) {
        parentId = BOTTOM_TOOLBAR_CONTAINER_ID;
    } else {
        parentId = TOP_TOOLBAR_CONTAINER_ID;
    }

    if (typeof index !== "number" || index < -1) {
        throw Error(`Invalid toolbar index ${index}.`);
    }

    forAllBrowserWindows(function (window) {
        let toolbar = getToolbarElement(toolbarId, window);
        let parent = window.document.getElementById(parentId);
        let toolbars = parent.getElementsByTagName(TOOLBAR_TAG_NAME);

        if (toolbars.length <= 0
            || index === -1
            || index >= toolbars.length - 1) {
            parent.appendChild(toolbar);
        } else {
            parent.insertBefore(toolbar, toolbars[index]);
        }
        movedToolbars.push(new Toolbar(toolbar));
    });

    if (movedToolbars.length === 1) {
        return movedToolbars[0];
    } else {
        return movedToolbars;
    }
}

/**
 * Apply callback for all browser windows
 * @param callback for browser window
 */
function forAllBrowserWindows(callback) {
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    let enumerator = wm.getEnumerator(TYPE_BROWSER_WINDOW);
    while (enumerator.hasMoreElements()) {
        let win = enumerator.getNext();
        callback(win);
    }
}

/**
 * Get most recent browser window
 * @returns {Object} Window object
 */
function getBrowserWindow() {
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    return wm.getMostRecentWindow(TYPE_BROWSER_WINDOW);
}
