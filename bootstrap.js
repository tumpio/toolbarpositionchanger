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

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

function startup(aData, aReason) {
    Cu.import("chrome://toolbarpositionchanger/content/main.jsm");
    ToolbarPositionChanger.load();
}

function shutdown(aData, aReason) {
    if (aReason == APP_SHUTDOWN) return;
    ToolbarPositionChanger.unload();
    // Flush localized strings stringbundle
    let stringBundleService = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
    stringBundleService.flushBundles();
    // Unload modules
    Cu.unload("chrome://toolbarpositionchanger/content/main.jsm");
    Cu.unload("chrome://toolbarpositionchanger/content/observer.jsm");
    Cu.unload("chrome://toolbarpositionchanger/content/prefs.jsm");
    Cu.unload("chrome://toolbarpositionchanger/content/toolbardraghandler.jsm");
}

function install(aData, aReason) {
    // Save initial toolbar state on addon install
    if (aReason == ADDON_INSTALL) {
        let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        let window = wm.getMostRecentWindow("navigator:browser");
        let prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
        let positions = {};
        let toolbars = window.document.querySelectorAll(
            "#navigator-toolbox > toolbar, #browser-bottombox > toolbar");
        for (let toolbar of toolbars) {
            let id = toolbar.parentNode.id;
            if (!positions[id])
                positions[id] = [];
            positions[id].push(toolbar.id);
        }
        prefs.setCharPref("extensions.toolbarpositionchanger.initialState", JSON.stringify(positions));
    }
}

function uninstall(aData, aReason) {
    // Remove extension preferences on addon uninstall
    if (aReason == ADDON_UNINSTALL) {
        let prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
        prefs.deleteBranch("extensions.toolbarpositionchanger.");
    }
}
