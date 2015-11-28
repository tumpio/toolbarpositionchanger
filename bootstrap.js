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

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

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
}

function install(aData, aReason) {
    if (aReason == ADDON_INSTALL) {
        ToolbarPositionChanger.init();
    }
}

function uninstall(aData, aReason) {
    // Remove extension preferences on addon uninstall
    if (aReason == ADDON_UNINSTALL) {
        let prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
        prefs.deleteBranch("extensions.toolbarpositionchanger.");
    }
}
