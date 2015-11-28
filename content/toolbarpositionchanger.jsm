/*
    This file is part of Toolbar Position Changer.

    Toolbar Position Changer is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Toolbar Position Changer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Toolbar Position Changer.  If not, see <http://www.gnu.org/licenses/>.
*/

var EXPORTED_SYMBOLS = ["ToolbarPositionChanger"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("chrome://toolbarpositionchanger/content/prefs.jsm");
Cu.import("chrome://toolbarpositionchanger/content/toolbardraghandler.jsm");
Cu.import("chrome://toolbarpositionchanger/content/observer.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");

let ToolbarPositionChanger = (function () {

    let myPrefmanager = new PrefManager("extensions.toolbarpositionchanger.",
        "chrome://toolbarpositionchanger/content/defaultprefs.js",
        function (branch, name) {
            switch (name) {
                case "state":
                    forAllWindows(loadState);
                    break;
                case "invertedTabBackground":
                    forAllWindows(invertTabBackground);
                    break;
                case "notificationbarOnBottom":
                    forAllWindows(notificationbarOnBottom);
                    break;
            }
        }
    );

    let myObserver = new Observer("lightweight-theme-styling-update",
        function (subject, topic, data) {
            forAllWindows(setBrighttextBottom);
        }
    );

    function forAllWindows(callback) {
        let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        let enumerator = wm.getEnumerator("navigator:browser");
        while (enumerator.hasMoreElements()) {
            let win = enumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
            callback(win);
        }
    }

    function invertTabBackground(window, opt) {
        let tabsToolbar = window.document.getElementById("TabsToolbar");
        let checkbox = window.document.getElementById("customization-tabbackground-invert-menuitem");

        if (!tabsToolbar) return;

        let option = (typeof opt !== "undefined") ? opt : myPrefmanager.getPref("invertedTabBackground");

        if (option) {
            tabsToolbar.setAttribute("invertedTabBackground", true);
        } else {
            tabsToolbar.removeAttribute("invertedTabBackground");
        }
        setCheckboxState(checkbox, option);
    }

    function notificationbarOnBottom(window, opt) {
        let mainwindow = window.document.getElementById("main-window");
        let checkbox = window.document.getElementById("customization-notificationbar-bottom-menuitem");

        if (!mainwindow) return;

        let option = (typeof opt !== "undefined") ? opt : myPrefmanager.getPref(
            "notificationbarOnBottom");

        if (option) {
            mainwindow.setAttribute("notificationbarOnBottom", true);
        } else {
            mainwindow.removeAttribute("notificationbarOnBottom");
        }
        setCheckboxState(checkbox, option);
    }

    function setBrighttextBottom(window) {
        let mainwindow = window.document.getElementById("main-window");
        let toolbars = window.document.querySelectorAll("#browser-bottombox > toolbar");

        if (!mainwindow) return;

        if (mainwindow.getAttribute("lwthemetextcolor") == "bright") {
            for (let toolbar of toolbars)
                toolbar.setAttribute("brighttext", "true");
        } else {
            for (let toolbar of toolbars)
                toolbar.removeAttribute("brighttext");
        }
    }

    function addOptionsMenu(window) {
        let container = window.document.getElementById("customization-footer");
        let container_spacer = window.document.getElementById("customization-footer-spacer");

        let stringBundleService = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
        let stringBundle = stringBundleService.createBundle(
            "chrome://toolbarpositionchanger/locale/strings.properties");

        if (!container || !container_spacer)
            return;

        let menu = createElement(window, "button", {
            "label": stringBundle.GetStringFromName("options_menu_label"),
            "id": "customization-toolbar-settings-button",
            "class": "customizationmode-button",
            "type": "menu"
        });
        let menuPopup = createElement(window, "menupopup", {
            "id": "customization-toolbar-settings-menu"
        });
        let invertMenuitem = createElement(window, "menuitem", {
            "label": stringBundle.GetStringFromName("options_invert_label"),
            "id": "customization-tabbackground-invert-menuitem",
            "accesskey": "I",
            "type": "checkbox"
        });
        let notificationbarMenuitem = createElement(window, "menuitem", {
            "label": stringBundle.GetStringFromName("options_notification_label"),
            "id": "customization-notificationbar-bottom-menuitem",
            "accesskey": "S",
            "type": "checkbox"
        });

        invertMenuitem.addEventListener("command", function () {
            myPrefmanager.setPref("invertedTabBackground", this.hasAttribute("checked"));
        });
        notificationbarMenuitem.addEventListener("command", function () {
            myPrefmanager.setPref("notificationbarOnBottom", this.hasAttribute("checked"));
        });

        menu.appendChild(menuPopup);
        menuPopup.appendChild(invertMenuitem);
        menuPopup.appendChild(notificationbarMenuitem);
        container.insertBefore(menu, container_spacer);
    }

    function restoreDefaultSettings(event) {
        let state = myPrefmanager.getPref("state");
        let invert = myPrefmanager.getPref("invertedTabBackground");
        let notification = myPrefmanager.getPref("notificationbarOnBottom");
        addEventById(event.currentTarget, "customization-undo-reset-button", "click", function (e) {
            myPrefmanager.setPref("state", state);
            myPrefmanager.setPref("invertedTabBackground", invert);
            myPrefmanager.setPref("notificationbarOnBottom", notification);
            e.target.removeEventListener(e.type, arguments.callee);
        });
        myPrefmanager.restoreDefaults(["state", "invertedTabBackground", "notificationbarOnBottom"]);
    }

    function appendMethod(object, method, append) {
        if (object[method]) {
            object[method + "Original"] = object[method];
            object[method] = function () {
                let original = object[method + "Original"].apply(object, arguments);
                return append(original);
            };
        }
    };

    function restoreMethod(object, method) {
        let original = method + "Original";
        if (object[original]) {
            object[method] = object[original];
            delete object[original];
        }
    }

    function addEventById(window, id, event_type, event_callback) {
        let element = window.document.getElementById(id);
        if (element) {
            element.addEventListener(event_type, event_callback);
        }
    }

    function removeEventById(window, id, type, callback) {
        let element = window.document.getElementById(id);
        if (element) {
            element.addEventListener(type, callback);
        }
    }

    function removeElementById(window, id) {
        let element = window.document.getElementById(id);
        if (element) {
            element.parentNode.removeChild(element);
        }
    }

    function createElement(window, type, attributes) {
        let element = window.document.createElement(type);
        for (let attribute in attributes) {
            element.setAttribute(attribute, attributes[attribute]);
        }
        return element;
    }

    function setCheckboxState(checkbox, state) {
        if (!checkbox) return;
        if (state) {
            checkbox.setAttribute("checkState", 1);
            checkbox.setAttribute("checked", true);
        } else {
            checkbox.removeAttribute("checked");
            checkbox.removeAttribute("checkState");
        }
    }

    function toolbarPositions(window) {
        let positions = {};
        let toolbars = window.document.querySelectorAll(
            "#navigator-toolbox > toolbar, #browser-bottombox > toolbar");
        for (let toolbar of toolbars) {
            let id = toolbar.parentNode.id;
            if (!positions[id])
                positions[id] = [];
            positions[id].push(toolbar.id);
        }
        return JSON.stringify(positions);
    }

    function loadSavedState(window) {
        let state = myPrefmanager.getPref("state");
        if (!state) state = myPrefmanager.getPref("initialState");
        if (!state) return;
        loadState(window, state);
    }

    function loadInitialState(window) {
        let state = myPrefmanager.getPref("initialState");
        if (!state) return;
        loadState(window, state);
    }

    function loadState(window, state) {
        let stateObj = JSON.parse(state);
        for (let key in stateObj) {
            let toolbox = window.document.getElementById(key);
            if (!toolbox) continue;
            for (let id of stateObj[key]) {
                let toolbar = window.document.getElementById(id);
                if (!toolbox) continue;
                toolbox.appendChild(toolbar);
            }
        }
    }

    function saveState(window) {
        myPrefmanager.setPref("state", toolbarPositions(window));
    }

    function customizationStart(event) {
        let window = event.currentTarget;
        ToolbarDragHandler.load(window);
        window.addEventListener("toolbarPositionChange", function (e) {
            saveState(window);
        });
    }

    function customizationEnd(event) {
        ToolbarDragHandler.unload(event.currentTarget);
    }

    function addTitlebarPlaceholders(window) {
        let holders = window.document.getElementsByClassName("titlebar-placeholder");

        if (holders.length <= 0)
            return;

        let holderParents = [];
        for (let holder of holders) {
            holderParents.push(holder.parentNode.id);
        }

        let toolbars = window.document.querySelectorAll(
            "#navigator-toolbox > toolbar:not(#addon-bar), #browser-bottombox > toolbar:not(#addon-bar)");

        for (let toolbar of toolbars) {
            if (holderParents.indexOf(toolbar.id) === -1) {
                let holderClone = holders[0].cloneNode();
                holderClone.classList.add("toolbarpositionchanger-titlebar-placeholder");
                holderClone.id = "titlebar-placeholder-on-" + toolbar.id + "-for-captions-buttons";
                toolbar.appendChild(holderClone);
            }
        }
    }

    function removeTitlebarPlaceholders(window) {
        let holders = window.document.getElementsByClassName("toolbarpositionchanger-titlebar-placeholder");
        for (let holder of holders) {
            holder.parentNode.removeChild(holder);
        }
    }

    function afterCustomizeWINNT(event) {
        forAllWindows(toggleWindowControls);
    }

    function afterToolbarToggled(event) {
        if (!event.target.id.startsWith("toggle"))
            return;

        let timer = Components.classes["@mozilla.org/timer;1"]
            .createInstance(Ci.nsITimer);

        // Needs timer to wait toolbar animation delay
        timer.initWithCallback({
            notify: function () {
                forAllWindows(toggleWindowControls);
            }
        }, 200, Ci.nsITimer.TYPE_ONE_SHOT);
    }

    function toggleWindowControls(window, opt) {
        if (!window) return;
        let mainWindow = window.document.getElementById("main-window");

        if (!mainWindow)
            return;

        let option = (typeof opt !== "undefined") ? opt : true;
        let toolbars = window.document.querySelectorAll("#navigator-toolbox > toolbar:not(#addon-bar)");
        let toolbarsHeight = 0;

        for (let toolbar of toolbars) {
            toolbarsHeight += toolbar.boxObject.height;
        }

        if (option && mainWindow.hasAttribute("tabsintitlebar") && toolbarsHeight <= 5) {
            mainWindow.setAttribute("windowcontrolshidden", "true");
        } else {
            mainWindow.removeAttribute("windowcontrolshidden");
        }
    }

    function onFullscreen(event) {
        let window = event.currentTarget;
        let prefsService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
        let autohide = prefservice.getBoolPref("browser.fullscreen.autohide");
        let bottombox = window.document.getElementById("browser-bottombox");
        let urlbar = bottombox.querySelector("#urlbar");
        let searchbar = bottombox.querySelector("#searchbar");

        if (window.document.mozFullScreen || !bottombox)
            return;

        if (window.fullScreen && autohide) {
            bottombox.addEventListener("mouseenter", onShowBottombox);
            bottombox.addEventListener("mouseleave", onHideBottombox);
            if (urlbar)
                urlbar.addEventListener("focus", onFocusNavbar);
            if (searchbar)
                searchbar.addEventListener("focus", onFocusNavbar);
        } else {
            bottombox.removeEventListener("mouseenter", onShowBottombox);
            bottombox.removeEventListener("mouseleave", onHideBottombox);
            if (urlbar)
                urlbar.removeEventListener("focus", onFocusNavbar);
            if (searchbar)
                searchbar.removeEventListener("focus", onFocusNavbar);
        }
        hideBottombox(bottombox, window.fullScreen && autohide);
    }

    function hideBottombox(bottombox, toggle) {

        if (!bottombox)
            return;

        if (toggle) {
            bottombox.style.marginBottom = -(bottombox.getBoundingClientRect().height - 1) + "px";
        } else {
            bottombox.style.marginBottom = "";
        }
    }

    function onShowBottombox(event) {
        hideBottombox(event.currentTarget, false);
    }

    function onHideBottombox(event) {
        let prefsService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
        hideBottombox(event.currentTarget, prefservice.getBoolPref("browser.fullscreen.autohide"));
    }

    function onFocusNavbar(event) {
        let bottombox = event.currentTarget.ownerDocument.getElementById("browser-bottombox");
        hideBottombox(bottombox, false);
    }

    function loadIntoWindow(window) {
        if (!window) return;
        window.addEventListener("beforecustomization", customizationStart);
        window.addEventListener("aftercustomization", customizationEnd);
        addOptionsMenu(window);
        invertTabBackground(window);
        notificationbarOnBottom(window);
        addEventById(window, "customization-reset-button", "click", restoreDefaultSettings);
        appendMethod(window, "getTogglableToolbars", function (original) {
            let bottombox = window.document.getElementById("browser-bottombox");
            let toolbarNodes = Array.slice(bottombox.childNodes);
            toolbarNodes = toolbarNodes.filter(node => node.getAttribute("toolbarname"));
            return original.concat(toolbarNodes);
        });
        addTitlebarPlaceholders(window);
        setBrighttextBottom(window);
        loadSavedState(window);

        // If addon enabled when already in customization mode
        let mainWindow = window.document.getElementById("main-window");
        if (mainWindow && mainWindow.hasAttribute("customize-entered")) {
            ToolbarDragHandler.load(window);
        }

        // For Windows only
        let xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
            .getService(Components.interfaces.nsIXULRuntime);
        if (xulRuntime.OS == "WINNT") {
            let toolbarcontextmenu = window.document.getElementById("toolbar-context-menu");
            toggleWindowControls(window);
            window.addEventListener("aftercustomization", afterCustomizeWINNT);
            if (toolbarcontextmenu) {
                toolbarcontextmenu.addEventListener("command", afterToolbarToggled);
            }
        }

        // Fullscreen
        window.addEventListener("fullscreen", onFullscreen);
    }

    function unloadFromWindow(window) {
        if (!window) return;
        ToolbarDragHandler.unload(window);
        window.removeEventListener("beforecustomization", customizationStart);
        window.removeEventListener("aftercustomization", customizationEnd);
        removeEventById(window, "customization-reset-button", "click", restoreDefaultSettings);
        removeElementById(window, "customization-toolbar-settings-button");
        invertTabBackground(window, false);
        notificationbarOnBottom(window, false);
        restoreMethod(window, "getTogglableToolbars");
        removeTitlebarPlaceholders(window);
        loadInitialState(window);

        // For Windows only
        let xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
            .getService(Components.interfaces.nsIXULRuntime);
        if (xulRuntime.OS == "WINNT") {
            let toolbarcontextmenu = window.document.getElementById("toolbar-context-menu");
            toggleWindowControls(window, false);
            window.removeEventListener("aftercustomization", afterCustomizeWINNT);
            if (toolbarcontextmenu) {
                toolbarcontextmenu.removeEventListener("command", afterToolbarToggled);
            }
        }

        // Fullscreen
        window.removeEventListener("fullscreen", onFullscreen);
    }

    let windowListener = {
        onOpenWindow: function (aWindow) {
            let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
            domWindow.addEventListener("load", function () {
                domWindow.removeEventListener("load", arguments.callee);
                loadIntoWindow(domWindow);
            });
        },
        onCloseWindow: function (aWindow) {},
        onWindowTitleChange: function (aWindow, aTitle) {}
    };

    return {
        load: function () {
            forAllWindows(loadIntoWindow);
            let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
            wm.addListener(windowListener);
            myPrefmanager.register();
            myObserver.register();

            let sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                .getService(Components.interfaces.nsIStyleSheetService);
            let ios = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
            let uri = ios.newURI("chrome://toolbarpositionchanger/content/toolbarpositionchanger.css", null, null);
            if (!sss.sheetRegistered(uri, sss.USER_SHEET))
                sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
        },

        unload: function () {
            myObserver.unregister();
            myPrefmanager.unregister();
            let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
            wm.removeListener(windowListener);
            forAllWindows(unloadFromWindow);

            let sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                .getService(Components.interfaces.nsIStyleSheetService);
            let ios = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
            let uri = ios.newURI("chrome://toolbarpositionchanger/content/toolbarpositionchanger.css", null, null);
            if (sss.sheetRegistered(uri, sss.USER_SHEET))
                sss.unregisterSheet(uri, sss.USER_SHEET);
        }
    };
})();
