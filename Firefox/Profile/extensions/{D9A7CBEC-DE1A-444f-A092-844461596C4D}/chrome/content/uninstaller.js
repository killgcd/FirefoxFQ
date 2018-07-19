"use strict";

var gDefaultFullZoomLevelUninstaller = {

  handleEvent: function(event) {
    switch (event.type) {
      case 'load':
        this.init();
        break;
      case 'unload':
        this.uninit();
        break;
    }
  },

  init: function() {
    window.removeEventListener("load", this, false);
    window.addEventListener("unload", this, false);
    try {
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.addAddonListener(this.uninstallerListener);
    } catch (ex) {}
  },

  uninit: function() {
    window.removeEventListener("unload", this, false);
    try {
      AddonManager.removeAddonListener(this.uninstallerListener);
    } catch (ex) {}
  },

  uninstallerListener: {
    addonId: "{D9A7CBEC-DE1A-444f-A092-844461596C4D}",
    kPref: "extensions.browser.zoom.fullZoom.shouldCleanUp",

    get prefs() {
      delete this.prefs;
      return this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefBranch2);
    },

    onDisabling: function(addon) {
      if (addon.id == this.addonId) {
        if (gDefaultFullZoomLevelUninstaller.confirmation(false))
          this.prefs.setBoolPref(this.kPref, true);
      }
    },
    onUninstalling: function(addon) {
      if (addon.id == this.addonId) {
        if (gDefaultFullZoomLevelUninstaller.confirmation(true))
          this.prefs.setBoolPref(this.kPref, true);
      }
    },
    onOperationCancelled: function(addon) {
      if (addon.id == this.addonId) {
        let shouldCleanUp = (addon.pendingOperations & AddonManager.PENDING_UNINSTALL) != 0;
        this.prefs.setBoolPref(this.kPref, shouldCleanUp);
      }
    }
  },

  confirmation: function(uninstall) {
    return true;
    /*
    var bundle = document.getElementById("bundle_defaultfullzoomlevel");
    var text;
    if (uninstall)
      text = bundle.getString('confirmationToResetOnUninstall');
    else
      text = bundle.getString('confirmationToResetOnDisable');
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Components.interfaces.nsIPromptService);
 
    return prompts.confirm(null, "Default Full Zoom", text);
    */
  }
}
window.addEventListener("load", gDefaultFullZoomLevelUninstaller, false);


var gDefaultFullZoomLevelObserver = {

  observer: null,

  handleEvent: function(event) {
    switch (event.type) {
      case 'load':
        this.init();
        break;
      case 'unload':
        this.uninit();
        break;
    }
  },

  init: function() {
    window.removeEventListener("load", this, false);
    window.addEventListener("unload", this, false);

    function myObserver() {
      this.register();
    }
    myObserver.prototype = {
      observe: function(subject, aTopic, data) {
        var  observerService = Components.classes["@mozilla.org/observer-service;1"]
                              .getService(Components.interfaces.nsIObserverService);
        switch (aTopic) {
          case "profile-before-change":
            var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                                  getService(Components.interfaces.nsIPrefBranch);
            try {
              var shouldCleanUp = prefs.getBoolPref("extensions.browser.zoom.fullZoom.shouldCleanUp");
            } catch(e) {
              shouldCleanUp = false;
            }
            if (shouldCleanUp) {
              if (!Ci.nsIContentPrefService2) {
                var cps = Cc["@mozilla.org/content-pref/service;1"].
                                           getService(Ci.nsIContentPrefService);
                cps.removePrefsByName("browser.content.full-zoom", null);
                cps.removePrefsByName("browser.content.full-mode", null);
              } else {
                var cps2 = Cc["@mozilla.org/content-pref/service;1"].
                             getService(Ci.nsIContentPrefService2);
                cps2.removeByName("browser.content.full-zoom", null);
                cps2.removeByName("browser.content.full-mode", null);
              }
              prefs.clearUserPref("toolkit.zoomManager.zoomValues");
              prefs.clearUserPref("zoom.maxPercent");
              prefs.clearUserPref("zoom.minPercent");
              prefs.clearUserPref("browser.zoom.full");
              prefs.clearUserPref("browser.zoom.siteSpecific");
              prefs.deleteBranch("extensions.browser.zoom.fullZoom.");
            }
        }
      },
      register: function() {
        var observerService = Components.classes["@mozilla.org/observer-service;1"]
                              .getService(Components.interfaces.nsIObserverService);
        observerService.addObserver(this, "profile-before-change", false);
      },
      unregister: function() {
        var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                .getService(Components.interfaces.nsIObserverService);
        observerService.removeObserver(this,"profile-before-change");
      }
    }
    
    this.observer = new myObserver();
  },

  uninit: function() {
    window.removeEventListener("unload", this, false);
    if (this.getBrowserWindows.length > 1)
      this.observer.unregister();
  },

  getBrowserWindows: function () {
    var browserWindows = [];
    var mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
    var enumerator = mediator.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      browserWindows.push(enumerator.getNext());
    }
    return browserWindows
  }
}
window.addEventListener("load", gDefaultFullZoomLevelObserver, false);
