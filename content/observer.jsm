var EXPORTED_SYMBOLS = ["Observer"];

function Observer(topic, observe) {
    this.topic = topic;
    this.observe = observe;
}
Observer.prototype = {
    register: function () {
        let observerService = Components.classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService);
        observerService.addObserver(this, this.topic, false);
    },
    unregister: function () {
        let observerService = Components.classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService);
        observerService.removeObserver(this, this.topic);
    }
}
