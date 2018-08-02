"use strict";
//Replace FullZoom

/**
 * Controls the "full zoom" setting and its site-specific preferences.
 */
var FullZoom = {
  /*nsIContentPrefService2*/
  _cps2: Cc["@mozilla.org/content-pref/service;1"].
               getService(Ci.nsIContentPrefService2),

  // cache for url
  cacheZoomForUrl:[],

  /**
   * Gets the load context from the given Browser.
   *
   * @param Browser  The Browser whose load context will be returned.
   * @return        The nsILoadContext of the given Browser.
   */
  _loadContextFromBrowser: function FullZoom__loadContextFromBrowser(browser) {
    return browser.loadContext;
  },

  // Identifies the setting in the content prefs database.
  name: "browser.content.full-zoom",
  mode: "browser.content.full-mode",

  // The global value (if any) for the setting.  Lazily loaded from the service
  // when first requested, then updated by the pref change listener as it changes.
  // If there is no global value, then this should be undefined.

  get globalValue() {
    try {
      var globalValue = this._prefBranch.getIntPref("extensions.browser.zoom.fullZoom.default") / 100;
    } catch(e) {}
    if (typeof globalValue == "undefined")
      globalValue =  1.0;
    else
      globalValue = this._ensureValid(globalValue);
    delete this.globalValue;
    return this.globalValue = globalValue;
  },
  get globalMode() {
    //this.globalMode ; Text zoom or not
    let globalMode = !this._prefBranch.getBoolPref("extensions.browser.zoom.fullZoom.Textmode");
    if (typeof globalMode == "undefined")
      globalMode = true;
    delete this.globalMode;
    return this.globalMode = globalMode;
  },
  //For Bug 416661 Site-specific zoom level shouldn't apply to image documents
  get ignoreImageDocument() {
    let ignoreImageDocument = this._prefBranch.getBoolPref("extensions.browser.zoom.fullZoom.ignoreImageDocument");
    if (typeof ignoreImageDocument == "undefined")
      ignoreImageDocument =  true;
    delete this.ignoreImageDocument;
    return this.ignoreImageDocument = ignoreImageDocument;
  },

  isMozSyntheticDocument: function(aBrowser) {
    try {
      return aBrowser.isSyntheticDocument ||
             aBrowser.documentContentType == "application/pdf";
    } catch(e) {
      return aBrowser.isSyntheticDocument;
    }
  },

  get _prefBranch() {
    delete this._prefBranch;
    return this._prefBranch = Cc["@mozilla.org/preferences-service;1"].
                              getService(Ci.nsIPrefBranch);
  },

  // browser.zoom.siteSpecific preference cache
  _siteSpecificPref: undefined,

  // browser.zoom.updateBackgroundTabs preference cache
  updateBackgroundTabs: undefined,

  prevBrowser: null,
  prevURI: null,

  get siteSpecific() {
    return this._siteSpecificPref;
  },


  //**************************************************************************//
  // nsISupports

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIDOMEventListener,
                                         Ci.nsIObserver,
                                         Ci.nsIContentPrefObserver,
                                         Ci.nsISupportsWeakReference,
                                         Ci.nsISupports]),
  //**************************************************************************//
  // Initialization & Destruction

  init: function FullZoom_init() {
    //on load
    window.addEventListener("ZoomChangeUsingMouseWheel", this);
    gBrowser.tabContainer.addEventListener('TabSelect', this, false);

    // Register ourselves with the service so we know when our pref changes.
    this._cps2.addObserverForName(this.name, this);
    this._cps2.addObserverForName(this.mode, this);

    this._siteSpecificPref =
      this._prefBranch.getBoolPref("browser.zoom.siteSpecific");
    this.localFolderSpecific =
      this._prefBranch.getBoolPref("extensions.browser.zoom.localFolderSpecific");
    try {
      this.updateBackgroundTabs =
        this._prefBranch.getBoolPref("browser.zoom.updateBackgroundTabs");
    } catch (e) { }
    // Listen for changes to the browser.zoom branch so we can enable/disable
    // updating background tabs and per-site saving and restoring of zoom levels.
    this._prefBranch.addObserver("browser.zoom.", this, true);
    this._prefBranch.addObserver("extensions.browser.zoom.", this, true);

    //When the default browser confirmation dialog is showwn on startup, Site specific zoom does not be allpied.
    //So, Force apply for the first tab
    if (gBrowser.mTabs.length == 1) {
        setTimeout(function(){
          this.prevBrowser = null;
          this.onLocationChange(gBrowser.currentURI, true, gBrowser.selectedBrowser);
        }.bind(this), 0);
    }
  },

  destroy: function FullZoom_destroy() {
    this._prefBranch.removeObserver("browser.zoom.", this);
    this._prefBranch.removeObserver("extensions.browser.zoom.", this);
    this._cps2.removeObserverForName(this.name, this);
    this._cps2.removeObserverForName(this.mode, this);
    window.removeEventListener("ZoomChangeUsingMouseWheel", this);
    gBrowser.tabContainer.removeEventListener('TabSelect', this, false);
  },


  //**************************************************************************//
  // Event Handlers

  // nsIDOMEventListener

  handleEvent: function FullZoom_handleEvent(event) {
    switch (event.type) {
      case 'TabSelect':
        this.tabSelect();
        break;
      case "ZoomChangeUsingMouseWheel":
        let browser = this._getTargetedBrowser(event);
        this._applyZoomToPref(browser);
        break;
    }
  },

  tabSelect: function(){
    if (this.updateBackgroundTabs && this.prevBrowser != gBrowser.selectedBrowser) {
      FullZoom.onLocationChange(gBrowser.selectedBrowser.currentURI, true, gBrowser.selectedBrowser);
    }
    this.prevBrowser = gBrowser.selectedBrowser;
    if (isBlankPageURL(gBrowser.selectedBrowser.currentURI.spec)) {
      this.prevBrowser = null;
    }

  },

  // nsIObserver

  observe: function (aSubject, aTopic, aData) {
    switch (aTopic) {
      case "nsPref:changed":
        switch (aData) {
          case "browser.zoom.siteSpecific":
            this._siteSpecificPref =
              this._prefBranch.getBoolPref("browser.zoom.siteSpecific");
            break;
          case "extensions.browser.zoom.localFolderSpecific":
            try {
              this.localFolderSpecific =
                this._prefBranch.getBoolPref("extensions.browser.zoom.localFolderSpecific");
            } catch(e) {
              this.localFolderSpecific = true;
            }
            break;
          case "browser.zoom.updateBackgroundTabs":
            this.updateBackgroundTabs =
              this._prefBranch.getBoolPref("browser.zoom.updateBackgroundTabs");
            break;
          case "extensions.browser.zoom.fullZoom.default":
            try {
              this.globalValue =
                this._prefBranch.getIntPref("extensions.browser.zoom.fullZoom.default") / 100;
            } catch(e) {
              this.globalValue = 1;
            }
            break;
          case "extensions.browser.zoom.fullZoom.Textmode":
            try {
              this.globalMode =
                !this._prefBranch.getBoolPref("extensions.browser.zoom.fullZoom.Textmode");
            } catch(e) {
              this.globalMode = true;
            }
            break;
          case "extensions.browser.zoom.fullZoom.ignoreImageDocument":
            try {
              this.ignoreImageDocument =
                this._prefBranch.getBoolPref("extensions.browser.zoom.fullZoom.ignoreImageDocument");
            } catch(e) {
              this.ignoreImageDocument = false;
            }
            break;
        }
        if(aData != "browser.zoom.updateBackgroundTabs" &&
           aData != "browser.zoom.full" &&
           aData != "extensions.browser.zoom.fullZoom.Textmode") {
          defaultfullzoomlevel_fullZoomBtn.debug("nsPref:changed " + aData);
		      this.cacheZoomForUrl = [];
			    this.onLocationChange(gBrowser.selectedBrowser.currentURI, true, gBrowser.selectedBrowser);
       }
    }
  },

  //Ensure local file url convert to aURI
  convURI: function(aURI) {
    const ioService = Components.classes['@mozilla.org/network/io-service;1']
                      .getService(Components.interfaces.nsIIOService);
    if (!!aURI && !this.localFolderSpecific) {
      if (/^file:/i.test(aURI.spec)) {
        let tmp = aURI.spec.split('/');
        tmp.pop();
        let url = tmp.join('/');
        aURI = ioService.newURI(url, null, null)
      }
    }
    return aURI;
  },

  // nsIContentPrefObserver
  _onContentPrefChanged: function FullZoom_onContentPrefSet(aGroup, aName, aValue) {
		let browser = gBrowser.selectedBrowser;
		let url = this.convURI(browser.currentURI);
		let ctxt = this._loadContextFromBrowser(browser);
		let domain = this._cps2.extractDomain(url.spec);
    if (aGroup) {
      delete this.cacheZoomForUrl[aGroup];
      if (aGroup == domain && aName == this.name) {
        defaultfullzoomlevel_fullZoomBtn.debug("_onContentPrefChanged " + aGroup + " " + aName + " " + aValue);
		    this.onLocationChange(gBrowser.selectedBrowser.currentURI, true, gBrowser.selectedBrowser);
      }
    } else if (aGroup == null && aName == this.name) {
      defaultfullzoomlevel_fullZoomBtn.debug("_onContentPrefChanged " + aGroup + " " + aName + " " + aValue);
      this.cacheZoomForUrl = [];
	    this.onLocationChange(gBrowser.selectedBrowser.currentURI, true, gBrowser.selectedBrowser);
    }
  },

  onContentPrefSet: function FullZoom_onContentPrefSet(aGroup, aName, aValue) {
    this._onContentPrefChanged(aGroup, aName, aValue);
  },

  onContentPrefRemoved: function FullZoom_onContentPrefRemoved(aGroup, aName) {
    this._onContentPrefChanged(aGroup, aName, undefined);
  },

  /**
   * Called when the location of a tab changes.
   * When that happens, we need to update the current zoom level if appropriate.
   *
   * @param aURI
   *        A URI object representing the new location.
   * @param aIsTabSwitch
   *        Whether this location change has happened because of a tab switch.
   * @param aBrowser
   *        (optional) browser object displaying the document
   */
  onLocationChange: function FullZoom_onLocationChange(aURI, aIsTabSwitch, aBrowser) {
    if (!aURI)
      return;
   defaultfullzoomlevel_fullZoomBtn.debug("onLocationChange " + aURI.spec);

    aBrowser = aBrowser || gBrowser.selectedBrowser;
    aURI = this.convURI(aURI);
    this.prevBrowser = aBrowser;

    // We don't save a pref for image documents, so don't try to restore it
    // after switching to a different tab.
    if (!this.ignoreImageDocument && aIsTabSwitch && this.isMozSyntheticDocument(aBrowser)) {
      ZoomManager.setCurrentMode(aBrowser, true);
    } else if (!this.ignoreImageDocument && !aIsTabSwitch && this.isMozSyntheticDocument(aBrowser)) {
      ZoomManager.setCurrentMode(aBrowser, true);
      ZoomManager.setZoomForBrowser(aBrowser, 1.0);
    } else {
      if (!this.siteSpecific) { 
        if (!this.isAlreadyApplied(aBrowser)) {
          //set default zoomlevel for Tab, if siteSpecific is false.
          var useFullZoom = this.globalMode;
          ZoomManager.setCurrentMode(aBrowser, useFullZoom);
          //ZoomManager.setZoomModeForBrowser(aBrowser, useFullZoom)
          ZoomManager.setZoomForBrowser(aBrowser, this.globalValue);
          //ZoomManager.useFullZoom = useFullZoom;
          //Save zoomlevel for Tab, if siteSpecific is false.
          this.setApplied(aBrowser);
        } else {
          this.getApplied(aBrowser);
        }
      } else {
        // Avoid the cps roundtrip and apply the default/global pref.
        if ("isBlankPageURL" in window ? isBlankPageURL(aURI.spec) : aURI.spec == "about:blank") {
          this._applyPrefToZoom(this.mode, undefined , aBrowser, false);
          this._applyPrefToZoom(this.name, undefined , aBrowser);
          return;
        }
        if (true || aBrowser == gBrowser.selectedBrowser){
			    let url = this.convURI(aBrowser.currentURI);
			    let domain = this._cps2.extractDomain(url.spec);
          if (this.cacheZoomForUrl[domain]) {
				    let {name: name, mode: mode} = this.cacheZoomForUrl[domain];
	          this._applyPrefToZoom(this.mode, mode, aBrowser, false);
	          this._applyPrefToZoom(this.name, name, aBrowser);
	        } else {
	          let ctxt = this._loadContextFromBrowser(gBrowser.selectedBrowser);
	          let value1, value2, value3;
	          value1 = value2 = value3 = undefined;
	          this._cps2.getByDomainAndName(aURI.spec, this.mode, ctxt, {
	            handleResult: function (resultPref) value1 = resultPref.value,
	            handleCompletion: function () {
	              this._cps2.getByDomainAndName(aURI.spec, this.name, ctxt, {
	                handleResult: function (resultPref) value2 = resultPref.value,
	                handleCompletion: function () {
                    this.cacheZoomForUrl[domain] = {name: value2, mode: value1};
                    this._applyPrefToZoom(this.mode, value1, aBrowser, false);
                    this._applyPrefToZoom(this.name, value2, aBrowser);
                    return;
	                }.bind(this)
	              });
	            }.bind(this)
	          });
          }
        }
        return;
      }
    }
    if (aBrowser == gBrowser.selectedBrowser) {
      defaultfullzoomlevel_fullZoomBtn.showZoomLevelInStatusbar();
    }
  },

  //When not Site Specific Mode, Does already applied zooming facor for aBrowser or not.
  isAlreadyApplied: function FullZoom_isAlreadyApplied(aBrowser) {
    let ss = Components.classes["@mozilla.org/browser/sessionstore;1"].
                               getService(Components.interfaces.nsISessionStore);

    let browser = aBrowser || gBrowser.selectedBrowser;
    let aTab = gBrowser.getTabForBrowser(browser);

    try {
      if (ss.getTabValue(aTab, "FullZoomMode") == "true" ||
        ss.getTabValue(aTab, "FullZoomMode") == "false") {
        return true;
      }
    } catch(ex) {
      return aTab.hasAttribute("FullZoomMode");
    }
    return false;
  },

  //When not Site Specific Mode, Get ZoomLevel for curennt aBrowser
  getApplied: function FullZoom_getApplied(aBrowser) {
    let ss = Components.classes["@mozilla.org/browser/sessionstore;1"].
                               getService(Components.interfaces.nsISessionStore);

    let browser = aBrowser || gBrowser.selectedBrowser;
    let aTab = gBrowser.getTabForBrowser(browser);

    let value, useFullZoom;
    try {
      value       = ss.getTabValue(aTab, "FullZoomLevel");
      useFullZoom = ss.getTabValue(aTab, "FullZoomMode") == 'true';
    } catch(ex) {
      value       = aTab.getAttribute("FullZoomLevel");
      useFullZoom = aTab.getAttribute("FullZoomMode") == 'true';
    }
    ZoomManager.setCurrentMode(browser, useFullZoom);
    //ZoomManager.setZoomModeForBrowser(browser, useFullZoom)
    if (value)
      ZoomManager.setZoomForBrowser(browser, this._ensureValid(value));
    else
      ZoomManager.setZoomForBrowser(browser, this.globalValue);
    //ZoomManager.useFullZoom = useFullZoom;
  },

  //When not Site Specific Mode, Save ZoomLevel for curennt aBrowser
  setApplied: function FullZoom_setApplied(aBrowser) {
    let ss = Components.classes["@mozilla.org/browser/sessionstore;1"].
                               getService(Components.interfaces.nsISessionStore);

    let browser = aBrowser || gBrowser.selectedBrowser;
    let aTab = gBrowser.getTabForBrowser(browser);

    try {
      ss.setTabValue(aTab, "FullZoomLevel", ZoomManager.getZoomForBrowser(browser).toString());
      ss.setTabValue(aTab, "FullZoomMode", !!ZoomManager.getCurrentMode(browser) ? "true" : "false");

    } catch(ex) {}
    aTab.setAttribute("FullZoomLevel", ZoomManager.getZoomForBrowser(browser));
    aTab.setAttribute("FullZoomMode", !!ZoomManager.getCurrentMode(browser));
  },

  //When not Site Specific Mode, Remove ZoomLevel for curennt aBrowser
  removeApplied: function FullZoom_removeApplied() {
    let ss = Components.classes["@mozilla.org/browser/sessionstore;1"].
                               getService(Components.interfaces.nsISessionStore);
    let aTab = gBrowser.mCurrentTab;
    try {
      ss.deleteTabValue(aTab, "FullZoomLevel");
      ss.deleteTabValue(aTab, "FullZoomMode");
    } catch(ex) {}
    aTab.removeAttribute("FullZoomLevel");
    aTab.removeAttribute("FullZoomMode");
  },

  // update state of zoom type menu item
  updateMenu: function FullZoom_updateMenu() {
    let menuItem = document.getElementById("toggle_zoom");

    menuItem.setAttribute("checked", !ZoomManager.getCurrentMode(getBrowser().selectedBrowser));
  },

  //**************************************************************************//
  // Setting & Pref Manipulation

  reduce: function FullZoom_reduce() {
    ZoomManager.reduce();
    this._applyZoomToPref();
  },

  enlarge: function FullZoom_enlarge() {
    ZoomManager.enlarge();
    this._applyZoomToPref();
  },

  toggleZoom: function FullZoom_toggleZoom() {
    ZoomManager.toggleZoom();
    this._applyZoomToPref();
  },

  resetZoom: function FullZoom_resetZoom() {
    if (typeof this.globalValue != "undefined")
      ZoomManager.zoom = this.globalValue;
    else
      ZoomManager.reset();
    this._applyZoomToPref();
    defaultfullzoomlevel_fullZoomBtn.showZoomLevelInStatusbar();
  },

  reset: function FullZoom_reset() {
    if (typeof this.globalValue != "undefined")
      ZoomManager.zoom = this.globalValue;
    else
      ZoomManager.reset();

    if (!(this.ignoreImageDocument && this.isMozSyntheticDocument(gBrowser.selectedBrowser))) {
      this._removePref();

      //Remove saved zoomlevel for Tab
      this.removeApplied();
    }
  },

  /**
   * Set the zoom level for the current tab.
   *
   * Per nsPresContext::setFullZoom, we can set the zoom to its current value
   * without significant impact on performance, as the setting is only applied
   * if it differs from the current setting.  In fact getting the zoom and then
   * checking ourselves if it differs costs more.
   *
   * And perhaps we should always set the zoom even if it was more expensive,
   * since DocumentViewerImpl::SetTextZoom claims that child documents can have
   * a different text zoom (although it would be unusual), and it implies that
   * those child text zooms should get updated when the parent zoom gets set,
   * and perhaps the same is true for full zoom
   * (although DocumentViewerImpl::SetFullZoom doesn't mention it).
   *
   * So when we apply new zoom values to the browser, we simply set the zoom.
   * We don't check first to see if the new value is the same as the current
   * one.
   **/
  _applyPrefToZoom: function FullZoom__applyPrefToZoom(aName, aValue, aBrowser, aUpdateUI) {
    if (gInPrintPreviewMode)
      return;
      
    let browser = aBrowser || gBrowser.selectedBrowser;

    let resetZoom = (this.ignoreImageDocument && this.isMozSyntheticDocument(browser));

    if (aName == this.name) {
      try {
        if (resetZoom)
          ZoomManager.setZoomForBrowser(browser, this.globalValue);
        else if (typeof aValue != "undefined")
          ZoomManager.setZoomForBrowser(browser, this._ensureValid(aValue));
        else
          ZoomManager.setZoomForBrowser(browser, this.globalValue);
      }
      catch(ex) {}
    } else if (aName == this.mode) {
      let zoomMode;
      try {
        if (resetZoom)
          zoomMode = this.globalMode;
        else if (typeof aValue != "undefined")
          zoomMode = !!aValue;
        else
          zoomMode = this.globalMode;

        ZoomManager.setCurrentMode(browser, zoomMode);
      }
      catch(ex) {}
    }
    aUpdateUI = (typeof aUpdateUI == "undefined") ? true : aUpdateUI;
    if (browser == gBrowser.selectedBrowser && aUpdateUI) {
      defaultfullzoomlevel_fullZoomBtn.showZoomLevelInStatusbar();
    }
  },

  _applyZoomToPref: function FullZoom__applyZoomToPref(aBrowser) {
    if (gInPrintPreviewMode)
      return;
      
    let browser = aBrowser || gBrowser.selectedBrowser;
    let url = this.convURI(browser.currentURI);

    if (!this.ignoreImageDocument && this.isMozSyntheticDocument(browser)) {
      ZoomManager.setCurrentMode(browser, true);
      if (browser == gBrowser.selectedBrowser) {
        defaultfullzoomlevel_fullZoomBtn.showZoomLevelInStatusbar();
      }
      return;
    } else if (!(this.ignoreImageDocument && this.isMozSyntheticDocument(browser))) {
      if (!this.siteSpecific) {
        //Save zoomlevel for Tab
        this.setApplied(browser);
      } else {
        let ctxt = this._loadContextFromBrowser(browser);
        let url = this.convURI(browser.currentURI);
		    let domain = this._cps2.extractDomain(url.spec);
        this.cacheZoomForUrl[domain] = {
                                         name: ZoomManager.getZoomForBrowser(browser),
                                         mode: ZoomManager.getCurrentMode(browser)
                                       };
        if (Math.floor(ZoomManager.getZoomForBrowser(browser) * 100) != Math.floor(this.globalValue * 100) ) {
          this._cps2.set(url.spec, this.name, ZoomManager.getZoomForBrowser(browser), ctxt, {
            handleCompletion: function () {
            }.bind(this),
          });
        } else {
          this._removePrefZoom(url);
        }
        if (ZoomManager.getCurrentMode(browser) != this.globalMode ) {
          this._cps2.set(url.spec, this.mode, ZoomManager.getCurrentMode(browser), ctxt, {
            handleCompletion: function () {
            }.bind(this),
          });
        } else {
          this._removePrefMode(url);
        }
      }
    }


    if (browser == gBrowser.selectedBrowser) {
      defaultfullzoomlevel_fullZoomBtn.showZoomLevelInStatusbar();
    }

  },

  _removePref: function FullZoom_removePref(url) {
    if (gBrowser.selectedBrowser.isSyntheticDocument)
      return;
    if (!url)
      url = this.convURI(gBrowser.currentURI);
    let ctxt = this._loadContextFromBrowser(gBrowser.selectedBrowser);
    this._cps2.removeByDomainAndName(url.spec, this.mode, ctxt, {
      handleCompletion: function () {
        this._cps2.removeByDomainAndName(url.spec, this.name, ctxt, {
          handleCompletion: function () {
            return;
          }.bind(this),
        });
      }.bind(this),
    });
  },

  _removePrefZoom: function FullZoom_removePrefZoom(url) {
    if (gBrowser.selectedBrowser.isSyntheticDocument)
      return;
    if (!url)
      url = this.convURI(gBrowser.currentURI);
    let ctxt = this._loadContextFromBrowser(gBrowser.selectedBrowser);
    this._cps2.removeByDomainAndName(url.spec, this.name, ctxt, {
      handleCompletion: function () {
        return;
      }.bind(this),
    });
  },

  _removePrefMode: function FullZoom_removePrefMode(url) {
    if (gBrowser.selectedBrowser.isSyntheticDocument)
      return;
    if (!url)
      url = this.convURI(gBrowser.currentURI);
    let ctxt = this._loadContextFromBrowser(gBrowser.selectedBrowser);
    this._cps2.removeByDomainAndName(url.spec, this.mode, ctxt, {
      handleCompletion: function () {
        return;
      }.bind(this),
    });
  },


  /*
   * Returns the browser that the supplied zoom event is associated with.
   * @param event  The ZoomChangeUsingMouseWheel event.
   * @return  The associated browser element, if one exists, otherwise null.
   */
  _getTargetedBrowser: function FullZoom__getTargetedBrowser(event) {
    let target = event.originalTarget;

    // With remote content browsers, the event's target is the browser
    // we're looking for.
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    if (target instanceof window.XULElement &&
        target.localName == "browser" &&
        target.namespaceURI == XUL_NS)
      return target;

    // With in-process content browsers, the event's target is the content
    // document.
    if (target.nodeType == Node.DOCUMENT_NODE)
      return gBrowser.getBrowserForDocument(target);

    throw new Error("Unexpected ZoomChangeUsingMouseWheel event source");
  },


  //**************************************************************************//
  // Utilities

  _ensureValid: function FullZoom__ensureValid(aValue) {
    if (isNaN(aValue))
      return this.globalValue;

    if (aValue < ZoomManager.MIN)
      return ZoomManager.MIN;

    if (aValue > ZoomManager.MAX)
      return ZoomManager.MAX;

    return parseFloat(aValue);
  }
};
