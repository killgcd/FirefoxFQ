"use strict";

var gDefaultFullZoomLevelMigration = {
  handleEvent: function(event) {
    switch (event.type) {
      case 'load':
        this.init();
        break;
    }
  },

  init: function() {
    window.removeEventListener("load", this, false);

    try {
      var version = gPrefService.getIntPref("extensions.browser.zoom.fullZoom.browser.migration.version");
    } catch(e) {
      version = 9;
    }

    if (version >= 10)
      return;

    var currentUIVersion = gPrefService.getIntPref("browser.migration.version");
    gPrefService.setIntPref("extensions.browser.zoom.fullZoom.browser.migration.version", currentUIVersion);

    if (gPrefService.getIntPref("extensions.browser.zoom.fullZoom.default") == 100)
      return;


    if (currentUIVersion >= 10) {
      var sm = Cc["@mozilla.org/gfx/screenmanager;1"].getService(Ci.nsIScreenManager);
      try {
        var systemDefaultScale = sm.systemDefaultScale;
        if (systemDefaultScale > 1.0) {
          this.reset(systemDefaultScale);
        }
      } catch(e) {}
    }
  },
  
  reset: function(systemDefaultScale){
    var level = 100; //gPrefService.getIntPref("extensions.browser.zoom.fullZoom.default");
    //level = Math.floor(level / systemDefaultScale);
    gPrefService.setIntPref("extensions.browser.zoom.fullZoom.default", level);
  },
}

window.addEventListener("load", gDefaultFullZoomLevelMigration, false);
