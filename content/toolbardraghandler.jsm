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

var EXPORTED_SYMBOLS = ["ToolbarDragHandler"];
const excludedToolbars = ["addon-bar", "aios-toolbar", "aios-sbhtoolbar"];

let ToolbarDragHandler = (function () {

    function toolbarGrip(window, toolboxes) {
        let grip = window.document.createElement("menu");
        let label = window.document.createElement("label");

        grip.appendChild(label);
        label.setAttribute("value", String.fromCharCode(10495));
        grip.setAttribute("align", "center");
        grip.setAttribute("ordinal", "0");
        grip.setAttribute("class", "toolbardrag-grip");

        grip.addEventListener("dragstart",
            function (event) {
                let draggedToolbar = event.target.parentNode;
                draggedToolbar.setAttribute("dragged", "true");
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.dropEffect = "move";
                event.dataTransfer.mozSetDataAt("application/x-toolbar", draggedToolbar, 0);
                event.dataTransfer.setDragImage(draggedToolbar, 5, 20);

                for (let id of toolboxes) {
                    let toolbox = window.document.getElementById(id);
                    if (toolbox) {
                        toolbox.setAttribute("toolbar-dragged", "true");
                    }
                }
            });

        grip.addEventListener("dragend",
            function (event) {
                if (!event.dataTransfer.mozTypesAt(0).contains("application/x-toolbar"))
                    return true;
                let draggedToolbar = event.dataTransfer.mozGetDataAt("application/x-toolbar", 0);
                draggedToolbar.removeAttribute("dragged");

                for (let id of toolboxes) {
                    let toolbox = window.document.getElementById(id);
                    if (toolbox) {
                        toolbox.removeAttribute("toolbar-dragged");
                    }
                }
            });

        return grip;
    }

    function onDragEnterToolbar(event) {
        if (!event.dataTransfer.mozTypesAt(0).contains("application/x-toolbar"))
            return true;

        let draggedToolbar = event.dataTransfer.mozGetDataAt("application/x-toolbar", 0);
        let enteredToolbar = event.currentTarget;
        if (enteredToolbar != draggedToolbar) {
            event.preventDefault();
        } else {
            event.stopPropagation();
        }
    }

    function onDragOverToolbar(event) {
        if (!event.dataTransfer.mozTypesAt(0).contains("application/x-toolbar"))
            return true;

        let draggedToolbar = event.dataTransfer.mozGetDataAt("application/x-toolbar", 0);
        let overToolbar = event.currentTarget;

        if (overToolbar != draggedToolbar) {

            let centerY = overToolbar.boxObject.y + overToolbar.boxObject.height / 2;

            if (event.clientY < centerY) {
                let nextSibling = nextSiblingByTagName(draggedToolbar, "toolbar");
                if (overToolbar != nextSibling) {
                    overToolbar.setAttribute("dragover", "top");
                } else {
                    overToolbar.setAttribute("dragover", "bottom");
                }
            } else {
                let prevSibling = previousSiblingByTagName(draggedToolbar, "toolbar");
                if (overToolbar != prevSibling) {
                    overToolbar.setAttribute("dragover", "bottom");
                } else {
                    overToolbar.setAttribute("dragover", "top");
                }
            }
            event.preventDefault();
        } else {
            event.stopPropagation();
        }
    }

    function onDragLeaveToolbar(event) {
        if (!event.dataTransfer.mozTypesAt(0).contains("application/x-toolbar"))
            return true;
        event.currentTarget.removeAttribute("dragover");
        event.preventDefault();
    }

    function onDragEnterArea(event) {
        if (!event.dataTransfer.mozTypesAt(0).contains("application/x-toolbar"))
            return true;
        event.preventDefault();
    }

    function onDragOverArea(event) {
        if (!event.dataTransfer.mozTypesAt(0).contains("application/x-toolbar"))
            return true;
        event.preventDefault();
    }

    function onDropToToolbar(event) {
        if (!event.dataTransfer.mozTypesAt(0).contains("application/x-toolbar"))
            return true;

        let droppedToolbar = event.dataTransfer.mozGetDataAt("application/x-toolbar", 0);
        let targetToolbar = event.currentTarget;
        let oldParent = droppedToolbar.parentNode;
        let dropAbove = targetToolbar.getAttribute("dragover") == "top";

        if (dropAbove) {
            targetToolbar.parentNode.insertBefore(droppedToolbar, targetToolbar);
        } else {
            targetToolbar.parentNode.insertBefore(droppedToolbar, nextSiblingByTagName(targetToolbar, "toolbar"));
        }
        targetToolbar.removeAttribute("dragover");
        event.preventDefault();
        event.stopPropagation();
        droppedToolbar.dispatchEvent(new Event("toolbarPositionChange", {"bubbles":true, "cancelable":false}));
    }

    function onDropToArea(event) {
        if (!event.dataTransfer.mozTypesAt(0).contains("application/x-toolbar"))
            return true;
        let droppedToolbar = event.dataTransfer.mozGetDataAt("application/x-toolbar", 0);
        event.currentTarget.appendChild(droppedToolbar);
        event.preventDefault();
        droppedToolbar.dispatchEvent(new Event("toolbarPositionChange", {"bubbles":true, "cancelable":false}));
    }

    function nextSiblingByTagName(element, tagName) {
        let sibling = element.nextSibling;
        while (sibling) {
            if (sibling.localName == tagName && isVisible(sibling)) return sibling;
            else sibling = sibling.nextSibling;
        }
    }

    function previousSiblingByTagName(element, tagName) {
        let sibling = element.previousSibling;
        while (sibling) {
            if (sibling.localName == tagName && isVisible(sibling)) return sibling;
            else sibling = sibling.previousSibling;
        }
    }

    function isVisible(element) {
        return element.boxObject.height > 0
    }

    return {
        load: function (window, toolboxes = ["navigator-toolbox", "browser-bottombox"]) {
            let toolbarSelector = "";

            for (let id of toolboxes) {
                let toolbox = window.document.getElementById(id);
                if (toolbox) {
                    toolbox.addEventListener("dragenter", onDragEnterArea);
                    toolbox.addEventListener("dragover", onDragOverArea);
                    toolbox.addEventListener("drop", onDropToArea);
                    toolbarSelector += "#" + toolbox.id + " toolbar,";
                }
            }
            toolbarSelector = toolbarSelector.slice(0, -1);

            let toolbars = window.document.querySelectorAll(toolbarSelector);

            for (let toolbar of toolbars) {
                if (excludedToolbars.includes(toolbar.id)) {
                    continue;
                }
                toolbar.appendChild(toolbarGrip(window, toolboxes));
                toolbar.addEventListener("dragenter", onDragEnterToolbar);
                toolbar.addEventListener("dragover", onDragOverToolbar);
                toolbar.addEventListener("dragleave", onDragLeaveToolbar);
                toolbar.addEventListener("drop", onDropToToolbar);
            }
        },

        unload: function (window, toolboxes = ["navigator-toolbox", "browser-bottombox"]) {
            let toolbarSelector = "";

            for (let id of toolboxes) {
                let toolbox = window.document.getElementById(id);
                if (toolbox) {
                    toolbox.removeEventListener("dragenter", onDragEnterArea);
                    toolbox.removeEventListener("dragover", onDragOverArea);
                    toolbox.removeEventListener("drop", onDropToArea);
                    toolbarSelector += "#" + toolbox.id + " toolbar,";
                }
            }
            toolbarSelector = toolbarSelector.slice(0, -1);

            let toolbars = window.document.querySelectorAll(toolbarSelector);

            for (let toolbar of toolbars) {
                if (excludedToolbars.includes(toolbar.id)) {
                    continue;
                }
                toolbar.removeEventListener("dragenter", onDragEnterToolbar);
                toolbar.removeEventListener("dragover", onDragOverToolbar);
                toolbar.removeEventListener("dragleave", onDragLeaveToolbar);
                toolbar.removeEventListener("drop", onDropToToolbar);
                let grips = toolbar.getElementsByClassName("toolbardrag-grip");
                for (let grip of grips) {
                    toolbar.removeChild(grip);
                }
            }
        }
    };
})();
