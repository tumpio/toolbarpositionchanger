/**
 * Set toolbar configurations for new browser windows
 */
browser.windows.onCreated.addListener(function () {
    browser.storage.local.get().then(storage => {
        for (let toolbar of Object.values(storage)) {
            if (toolbar.hidden) {
                browser.toolbar.hide(toolbar.id);
            }
            browser.toolbar.move(toolbar.id, {
                index: toolbar.index,
                bottom: toolbar.bottom
            });
        }
    });
});
