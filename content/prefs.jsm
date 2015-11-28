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

var EXPORTED_SYMBOLS = ["PrefManager"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");


/**
 * @constructor Preferences Manager
 *
 * @param {string} branch_name extensions preferences branch name (e.g. extensions.myext.)
 * @param {string} default_prefs_uri chrome:// path for default preferences definition file
 * @param {Function} callback must have the following arguments:
 *   branch, pref_leaf_name
 */
function PrefManager(branch_name, default_prefs_uri, callback) {

    let prefsService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
    this.branch = prefsService.getBranch(branch_name);
    this.callback = callback;
    let branch = prefsService.getDefaultBranch(branch_name);
    let prefLoaderScope = {
        pref: function (key, val) {

            if (key.indexOf(branch_name) === 0) {
                key = key.slice(branch_name.length);
            }

            switch (typeof val) {
                case "boolean":
                    branch.setBoolPref(key, val);
                    break;
                case "number":
                    branch.setIntPref(key, val);
                    break;
                case "string":
                    branch.setCharPref(key, val);
                    break;
            }
        }
    };
    // setup default prefs
    if (default_prefs_uri)
        Services.scriptloader.loadSubScript(default_prefs_uri, prefLoaderScope);
}

PrefManager.prototype = {

    observe: function (subject, topic, data) {
        if (topic == "nsPref:changed")
            this.callback(this.branch, data);
    },

    register: function () {
        this.branch.addObserver("", this, false);
    },

    unregister: function () {
        if (this.branch) {
            this.branch.removeObserver("", this);
        }
    },

    getPref: function (pref_name) {
        switch (this.branch.getPrefType(pref_name)) {
            case this.branch.PREF_STRING:
                return this.branch.getCharPref(pref_name);
            case this.branch.PREF_INT:
                return this.branch.getIntPref(pref_name);
            case this.branch.PREF_BOOL:
                return this.branch.getBoolPref(pref_name);
            default:
                return null;
        }
    },

    setPref: function (pref_name, value) {
        switch (typeof value) {
            case "string":
                this.branch.setCharPref(pref_name, value);
                break;
            case "number":
                if (Number.isInteger(value))
                    this.branch.setIntPref(pref_name, value);
                break;
            case "boolean":
                this.branch.setBoolPref(pref_name, value);
                break;
        }
    },

    restoreDefaults: function (prefs) {
        for (let pref of prefs) {
            this.branch.clearUserPref(pref);
        }
    }
};
