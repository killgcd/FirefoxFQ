"use strict";
var gDefaultFullZoomLevelPreferences = {
  onLoad: function() {
    this.onSiteSpecificClick();
  },

  onAccept: function() {
    var defaultFullZoom, p;
    var gPrefService = Components.classes["@mozilla.org/preferences-service;1"]
                                   .getService(Components.interfaces.nsIPrefBranch2);

    defaultFullZoom = document.getElementById('defaultFullZoomLevel');
    try{
      p = Math.floor(defaultFullZoom.value);
      if(p < 10) p = 10;
      if(p > 1000) p = 1000;
    }catch(e){
      p = 100;
    }
    gPrefService.setIntPref("extensions.browser.zoom.fullZoom.default",p);

    //
    function cmp_val(a, b) {
      var aa = Math.floor(a * 100 + 0.5);
      var bb = Math.floor(b * 100 + 0.5);
      return  aa < bb ? -1 : 1;
    }

    var specifiedFullZoom = document.getElementById('specifiedFullZoomLevel');
    p = specifiedFullZoom.value;
    if (p == "") return;
    if (p.length > 1024) return;
    var zoommin = 999999;
    var zoommax = 0;
    var s = p.split(',');
    var arr=[];
    for (var i=0; i<s.length; i++){
      try{
        var x = Math.floor(s[i] * 100 + 0.5);
        if( x > 1 && x < 10000)
          zoommin = Math.min(zoommin, x);
          zoommax = Math.max(zoommax ,x);
          arr.push(x / 100)
      }catch(ex){}
    }
    arr.sort(cmp_val);
    p = arr.join(',');
    gPrefService.setCharPref("toolkit.zoomManager.zoomValues",p);
    gPrefService.setIntPref("zoom.maxPercent",zoommax);
    gPrefService.setIntPref("zoom.minPercent",zoommin);
  },

  onSiteSpecificClick: function(){
    setTimeout(function(){
      var siteSpecific = document.getElementById('defaultFullZoomSiteSpecific');
      var localFolderSpecific = document.getElementById('defaultFullZoomLocalFolderSpecific');
      var p = siteSpecific.checked;
      if (!p){
        localFolderSpecific.setAttribute('disabled',true);
      } else {
        localFolderSpecific.removeAttribute('disabled');
      }
    },100);
  },
  
  getContentPrefs: function getContentPrefs(aWindow) {
    let context = aWindow ? aWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                                   .getInterface(Components.interfaces.nsIWebNavigation)
                                   .QueryInterface(Components.interfaces.nsILoadContext) : null;
    return new ContentPrefInstance(context);
  },

  reset: function(){
    var gPrefService = Components.classes["@mozilla.org/preferences-service;1"]
                                   .getService(Components.interfaces.nsIPrefBranch2);
    gPrefService.setIntPref("extensions.browser.zoom.fullZoom.default",100);
    document.getElementById('defaultFullZoomLevel').value = 100;
    
    if (!Components.interfaces.nsIContentPrefService2) {
      var cps = Components.classes["@mozilla.org/content-pref/service;1"].
                                 getService(Components.interfaces.nsIContentPrefService);
      cps.removePrefsByName("browser.content.full-zoom", null);
      cps.removePrefsByName("browser.content.full-mode", null);
    } else {
      var cps2 = Components.classes["@mozilla.org/content-pref/service;1"].
                   getService(Components.interfaces.nsIContentPrefService2);
      cps2.removeByName("browser.content.full-zoom", null);
      cps2.removeByName("browser.content.full-mode", null);
    }
  }
}