let topToolbars = document.getElementById("top-toolbars-list");
let bottomToolbars = document.getElementById("bottom-toolbars-list");
let toolbarListItemModel = document.getElementById("toolbar-list-item-model");

browser.toolbar.getAll().then(toolbars => {
    for (let toolbar of toolbars) {
        let listItem = createToolbarListItem(toolbar);
        if (toolbar.bottom) {
            bottomToolbars.appendChild(listItem);
        } else {
            topToolbars.appendChild(listItem);
        }
    }
    sortable('.sortable', {
        forcePlaceholderSize: true,
        connectWith: 'connected-sortable-lists'
    })[0].addEventListener('sortupdate', onToolbarMoved);
});

function onToolbarMoved(e) {
    let bottom = e.detail.endparent == bottomToolbars;
    browser.toolbar.move(e.detail.item.toolbar.id, {
        index: e.detail.index,
        bottom: bottom
    }).then(updateStorage);
}

function onToolbarVisibilityChanged(e) {
    let toolbar = e.target.parentNode.toolbar;
    if (e.target.checked) {
        browser.toolbar.show(toolbar.id).then(updateStorage);
    } else {
        browser.toolbar.hide(toolbar.id).then(updateStorage);
    }
}

function updateStorage(toolbar) {
    let entry = {};
    entry[toolbar.id] = toolbar;
    return browser.storage.local.set(entry);
}

function createToolbarListItem(toolbar) {
    let item = toolbarListItemModel.cloneNode(true);
    item.querySelector(".title").textContent = browser.i18n.getMessage(toolbar.id);
    item.querySelector(".visible").checked = !toolbar.hidden;
    item.toolbar = toolbar;
    return item;
}

document.addEventListener("change", onToolbarVisibilityChanged);