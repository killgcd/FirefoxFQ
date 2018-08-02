/** Document Zoom Management Code
 *
 * To use this, you'll need to have a getBrowser() function.
 **/
"use strict";
var ZoomManager = {

  get _prefBranch() {
    delete this._prefBranch;
    return this._prefBranch = Components.classes["@mozilla.org/preferences-service;1"]
                                        .getService(Components.interfaces.nsIPrefBranch);
  },

  get MIN() {
    delete this.MIN;
    return this.MIN = this._prefBranch.getIntPref("zoom.minPercent") / 100;
  },

  get MAX() {
    delete this.MAX;
    return this.MAX = this._prefBranch.getIntPref("zoom.maxPercent") / 100;
  },

  get useFullZoom() {
    return this._prefBranch.getBoolPref("browser.zoom.full");
  },

  set useFullZoom(aVal) {
    this._prefBranch.setBoolPref("browser.zoom.full", aVal);
    return aVal;
  },

  getCurrentMode: function getCurrentMode(aBrowser) {
    aBrowser = aBrowser || getBrowser().selectedBrowser;
    return aBrowser.currentMode;
  },

  setCurrentMode: function setCurrentMode(aBrowser, aVal) {
    aBrowser = aBrowser || getBrowser().selectedBrowser;
    aBrowser.currentMode = aVal;
    return aVal;
  },

  get zoom() {
    return this.getZoomForBrowser(getBrowser().selectedBrowser || getBrowser());
  },

  getZoomForBrowser: function ZoomManager_getZoomForBrowser(aBrowser) {
    return (this.getCurrentMode(aBrowser) || aBrowser.isSyntheticDocument)
           ? aBrowser.fullZoom : aBrowser.textZoom;
  },

  set zoom(aVal) {
    this.setZoomForBrowser(getBrowser().selectedBrowser || getBrowser(), aVal);
    return aVal;
  },

  setZoomForBrowser: function ZoomManager_setZoomForBrowser(aBrowser, aVal) {
    if (aVal < this.MIN || aVal > this.MAX)
      throw Components.results.NS_ERROR_INVALID_ARG;

    if (this.getCurrentMode(aBrowser) || aBrowser.isSyntheticDocument) {
      if (aBrowser.textZoom != 1) aBrowser.textZoom = 1;
      if (aBrowser.fullZoom != aVal) aBrowser.fullZoom = aVal;
    } else {
      if (aBrowser.textZoom != aVal) aBrowser.textZoom = aVal;
      if (aBrowser.fullZoom != 1) aBrowser.fullZoom = 1;
    }
  },

  get zoomValues() {
    var zoomValues = this._prefBranch.getCharPref("toolkit.zoomManager.zoomValues")
                                     .split(",").map(parseFloat);
    zoomValues.sort(function (a, b) a - b);

    while (zoomValues[0] < this.MIN)
      zoomValues.shift();

    while (zoomValues[zoomValues.length - 1] > this.MAX)
      zoomValues.pop();

    delete this.zoomValues;
    return this.zoomValues = zoomValues;
  },

  enlarge: function ZoomManager_enlarge() {
    var i = this.zoomValues.indexOf(this.snap(this.zoom)) + 1;
    if (i < this.zoomValues.length)
      this.zoom = this.zoomValues[i];
  },

  reduce: function ZoomManager_reduce() {
    var i = this.zoomValues.indexOf(this.snap(this.zoom)) - 1;
    if (i >= 0)
      this.zoom = this.zoomValues[i];
  },

  reset: function ZoomManager_reset() {
    this.zoom = 1;
  },

  toggleZoom: function ZoomManager_toggleZoom() {
    var zoomLevel = this.zoom;

    this.useFullZoom = !this.useFullZoom;
    this.setCurrentMode(getBrowser().selectedBrowser, !this.getCurrentMode());
    this.zoom = zoomLevel;
  },

  snap: function ZoomManager_snap(aVal) {
    var values = this.zoomValues;
    for (var i = 0; i < values.length; i++) {
      if (values[i] >= aVal) {
        if (i > 0 && aVal - values[i - 1] < values[i] - aVal)
          i--;
        return values[i];
      }
    }
    return values[i - 1];
  }
};
