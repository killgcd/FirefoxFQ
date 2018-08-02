"use strict";
var defaultfullzoomlevel_fullZoomBtn = {
  full: null,
  win : null,

  //init
  init: function() {
    window.removeEventListener('load', this, false);
    window.addEventListener('unload', this, false);

    // adding at least one button to the toolbar at first run
    var self = this;
    try {
      Application.getExtensions(function (extensions) {  
        let extension = extensions.get("{D9A7CBEC-DE1A-444f-A092-844461596C4D}");  
      
        if (extension.firstRun) {  
          // add button here.  
          var afterId = "status-bar";
          self.installButton("addon-bar", "statusbarZoomLevel", afterId);
        }  
      });
    } catch(ex) {
      if (self.getPref("extensions.browser.zoom.firstRun", "bool", false)
          && !document.getElementById("statusbarZoomLevel")) {  
        // add button here.  
        var afterId = "status-bar";
        self.installButton("addon-bar", "statusbarZoomLevel", afterId);
      }  
    }
    self.setPref("extensions.browser.zoom.firstRun", "bool", true)
    this.showZoomLevelInStatusbar();
  },

  uninit: function() {
    window.removeEventListener('unload', this, false);
    //stop observing
    if (this.observer1)
      this.observer1.disconnect();
  },

  /** 
   * Installs the toolbar button with the given ID into the given 
   * toolbar, if it is not already present in the document. 
   * 
   * @param {string} toolbarId The ID of the toolbar to install to. 
   * @param {string} id The ID of the button to install. 
   * @param {string} afterId The ID of the element to insert after. @optional 
   */  
  installButton: function installButton(toolbarId, id, afterId) {  
    if (!document.getElementById(id)) {  
      var toolbar = document.getElementById(toolbarId);  

      var before = toolbar.firstChild;  
      if (afterId) {  
        let elem = document.getElementById(afterId);  
        if (elem && elem.parentNode == toolbar)  
            before = elem.nextElementSibling;  
      }  

      toolbar.insertItem(id, before);  
      toolbar.setAttribute("currentset", toolbar.currentSet);  
      document.persist(toolbar.id, "currentset");  

      if (toolbarId == "addon-bar")  
        toolbar.collapsed = false;  
    }  
  },

  handleEvent: function(event){
    switch (event.type){
      case 'load':
        this.init(event);
        break;
      case 'unload':
        this.uninit(event);
        break;
    }
  },

  //show Zoom Level In Statusbar
  showZoomLevelInStatusbar: function(){
    this.updateDefaultButton();
    var statusbarZoomLevel = document.getElementById("statusbarZoomLevel");
    if (!statusbarZoomLevel)
      return;
    var label = Math.floor(ZoomManager.zoom * 100 + 0.5) + "%";
    if (ZoomManager.getCurrentMode(getBrowser().selectedBrowser))
      label = "F"+label;
    else
      label = "T"+label;
    statusbarZoomLevel.setAttribute("label", label);
  },

  updateDefaultButton: function(){
    let label = Math.floor(ZoomManager.zoom * 100 + 0.5) + "%";
    let btn = document.getElementById("zoom-reset-button");
    if (btn)
      btn.setAttribute("label", label);
  },

  clickStatusLabel:function(evt) {
    if (evt.type == "DOMMouseScroll") {
      this.click(evt, ZoomManager.getCurrentMode());
      return;
    }
    if (evt.button == 2/* || evt.button == 0 && evt.clientX- evt.target.boxObject.x  < 12*/) {
      evt.stopPropagation();
      evt.preventDefault();
      //
      document.getElementById("cmd_fullZoomToggle").doCommand();
      return;
    }
    if (evt.button == 1) {
      //
      document.getElementById("cmd_fullZoomReset").doCommand();
      return;
    }
    var btn = evt.target;
    this.full = ZoomManager.getCurrentMode(getBrowser().selectedBrowser);
    var popup = document.getElementById("defaultfullzoomlevel-fullZoomBtn_popup");
    //toggle
    if (popup.status == "open") {
      popup.hidePopup();
      // workaround Bug 622507
      popup.removeAttribute("height");
      popup.removeAttribute("width");
    } else {
      // workaround Bug 622507
      popup.removeAttribute("height");
      popup.removeAttribute("width");
      if (btn.boxObject.screenY > window.screen.availHeight / 2)
        popup.openPopup(btn, "before_start");
      else
        popup.openPopup(btn, "after_start");
    }
  },

  click: function(evt, useFullZoom) {
    if (!!document.getElementById("defaultfullzoomlevel-textZoomBtn_popup2") &&
        document.getElementById("defaultfullzoomlevel-textZoomBtn_popup2").state=="open") {
      return;
    }
    if (!!document.getElementById("defaultfullzoomlevel-fullZoomBtn_popup2") &&
        document.getElementById("defaultfullzoomlevel-fullZoomBtn_popup2").state=="open") {
      return;
    }
    if (evt.type == "DOMMouseScroll") {
      this.toggleZoom(useFullZoom);
      if (evt.detail > 0) {
        //
        document.getElementById("cmd_fullZoomReduce").doCommand();
      } else {
        //
        document.getElementById("cmd_fullZoomEnlarge").doCommand();
      }
      return;
    }

    if (evt.button == 0 && evt.shiftKey) {
      evt.stopPropagation();
      var btn = evt.target;
      if (document.getElementById("defaultfullzoomlevel-fullzoombtn") == btn ||
          document.getElementById("defaultfullzoomlevel-fullzoombtn2") == btn )
        this.full = true;
      else if (document.getElementById("defaultfullzoomlevel-textzoombtn") == btn ||
          document.getElementById("defaultfullzoomlevel-textzoombtn2") == btn )
        this.full = false;

      var popup = document.getElementById("defaultfullzoomlevel-fullZoomBtn_popup");
      // workaround Bug 622507
      popup.removeAttribute("height");
      popup.removeAttribute("width");
      popup.openPopup(btn, "after_end");
    } else if (evt.button == 2 && evt.shiftKey) {
      this.openPrefWindow();
    } else {
      this.zoom(evt.button, useFullZoom)
    }
    evt.preventDefault();
    evt.stopPropagation();
    return false;
  },

  zoom: function(type, useFullZoom) {
    switch(type) {
      case 0:
        //
        this.toggleZoom(useFullZoom);
        document.getElementById("cmd_fullZoomEnlarge").doCommand();
        break;
      case 1: // Middle Click
        //
        this.toggleZoom(useFullZoom);
        document.getElementById("cmd_fullZoomReset").doCommand();
        defaultfullzoomlevel_fullZoomBtn.showZoomLevelInStatusbar();
        break;
      case 2: // Right Click
        //
        this.toggleZoom(useFullZoom);
        document.getElementById("cmd_fullZoomReduce").doCommand();
        break;
    }
  },

  toggleZoom: function ZoomManager_toggleZoom(useFullZoom) {
    if (useFullZoom != ZoomManager.getCurrentMode()) {
      FullZoom.toggleZoom();
    }
  },

  //option
  openPrefWindow: function () {
    window.openDialog(
      "chrome://DefaultFullZoomLevel/content/pref.xul", "DefaultFullZoomLevel:Setting",
      "chrome,titlebar,toolbar,centerscreen,modal"
    );
  },

  //Apply zoom level to current tab
  doFullZoomBy: function(zoom, useFullZoom, aBrowser) {
    var browser = aBrowser || gBrowser.selectedBrowser;
    var ss = Components.classes["@mozilla.org/browser/sessionstore;1"].
                               getService(Components.interfaces.nsISessionStore);
    ZoomManager.setZoomForBrowser(browser, zoom);
    this.toggleZoom(useFullZoom);
    FullZoom._applyZoomToPref(browser);
  },

  //create popup menu
  onPopupShowing: function(event, useFullZoom) {
    //
    function cmp_val(a, b) {
      var aa = Math.floor(a);
      var bb = Math.floor(b);
      return  aa > bb ? -1 : 1;
    }
    var popup = event.target;
    while(popup.lastChild) {
      popup.removeChild(popup.lastChild);
    }

    if (typeof useFullZoom =='undefined') {
      useFullZoom = this.full;
    }
    var p = this.getPref("toolkit.zoomManager.zoomValues", "str", true);
    var s = p.split(',');
    s.sort(cmp_val);

    var arr=[];
    var zoom = Math.floor(ZoomManager.zoom * 100 + 0.5);
    for (var i=0; i<s.length; i++) {
      try{
        var x = Math.floor(s[i] * 100 + 0.5);
        if (x < zoom) {
          arr.push(zoom);
          zoom = 0;
        } else if (x == zoom) {
          zoom = 0;
        }
        arr.push(x);
      }catch(ex) {}
    }
    if (zoom != 0) {
      arr.push(zoom);
    }
    for (var i=0; i<arr.length; i++) {
      var menuitem = document.createElement('menuitem');
      var s = '    '+ (arr[i]).toString();
      menuitem.setAttribute('label',s.substr(s.length - 4, 4) + '%');
      menuitem.setAttribute('type','radio');
      menuitem.setAttribute('val', arr[i]);
      menuitem.setAttribute('useFullZoom', useFullZoom);
      menuitem.addEventListener("click", function(event){defaultfullzoomlevel_fullZoomBtn.doFullZoomBy(event.target.getAttribute("val")/100, event.target.getAttribute("useFullZoom") === "true");});
      if (!ZoomManager.getCurrentMode() == !useFullZoom &&
         arr[i] == Math.floor(ZoomManager.zoom * 100 + 0.5)) {
        menuitem.setAttribute('checked',true);
      }

      popup.appendChild(menuitem);
    }
    var bundle = document.getElementById("bundle_defaultfullzoomlevel");
    var menuitem = document.createElement('menuseparator');
    popup.appendChild(menuitem);

    var menuitem = document.createElement('menuitem');
    menuitem.setAttribute('label',bundle.getString('reset'));
    menuitem.setAttribute('value', FullZoom.globalValue);
    menuitem.setAttribute('useFullZoom',useFullZoom);
    menuitem.addEventListener('click',function(event){defaultfullzoomlevel_fullZoomBtn.doFullZoomBy(event.target.getAttribute("value"), event.target.getAttribute("useFullZoom") === "true");});
    menuitem.setAttribute('type','checkbox');
    popup.appendChild(menuitem);
  },

  //
  getPref: function(aPrefString, aPrefType, aDefault) {
    var xpPref = Components.classes['@mozilla.org/preferences-service;1']
                  .getService(Components.interfaces.nsIPrefService);
    try{
      switch (aPrefType) {
        case 'complex':
          return xpPref.getComplexValue(aPrefString, Components.interfaces.nsILocalFile); break;
        case 'str':
          return xpPref.getCharPref(aPrefString).toString(); break;
        case 'int':
          return xpPref.getIntPref(aPrefString); break;
        case 'bool':
        default:
          return xpPref.getBoolPref(aPrefString); break;
      }
    }catch(e) {
    }
    return aDefault;
  },
  //
  setPref: function(aPrefString, aPrefType, aValue) {
    var xpPref = Components.classes['@mozilla.org/preferences;1'].getService(Components.interfaces.nsIPrefBranch2);
    try{
      switch (aPrefType) {
        case 'complex':
          return xpPref.setComplexValue(aPrefString, Components.interfaces.nsILocalFile, aValue); break;
        case 'str':
          return xpPref.setCharPref(aPrefString, aValue); break;
        case 'int':
          aValue = parseInt(aValue);
          return xpPref.setIntPref(aPrefString, aValue);  break;
        case 'bool':
        default:
          return xpPref.setBoolPref(aPrefString, aValue); break;
      }
    }catch(e) {
    }
    return null;
  },

  debug: function(aMsg) {
    return;

    const Cc = Components.classes;
    const Ci = Components.interfaces;
    Cc["@mozilla.org/consoleservice;1"]
      .getService(Ci.nsIConsoleService)
      .logStringMessage("##### " +aMsg);
  }
};

//Initialize with new FullZoom
window.addEventListener("load", defaultfullzoomlevel_fullZoomBtn, false);
