var api = typeof chrome!="undefined" ? chrome : browser;

// When installed or updated, point the user to info/instructions
api.runtime.onInstalled.addListener(function(details){
  var version = "unknown";
  var previousVersion = "1.0";
  try {
    version = api.runtime.getManifest().version;
    previousVersion = details.previousVersion;
  }
  catch (e) { }
  if ("install"===details.reason) {
    api.tabs.create({url: "https://OldLayout.com/install.html"});
  }
  else if ("update"===details.reason) {
    var show_update = true;

    // Don't launch on update from 7.x to 7.x because it is a minor fix
    //if (/7\./.test(previousVersion)) { show_update = false; }

    if (show_update) {
      api.tabs.create({url: "https://OldLayout.com/update.html?version=7"});
    }
  }
});

/*b-opera
// This is a hack to fix the problem of opening Facebook via Speed Dial in Opera
// In that case, extension background pages apparetly don't run, so we need to bounce to a new tab
var opera_startpage_tab_ids = {};
api.webNavigation.onHistoryStateUpdated.addListener(function (details) {
  if (details.url==="chrome://.*?/") {
    opera_startpage_tab_ids[details.tabId] = true;
  }
  if (details.url==="https://www.facebook.com/" && opera_startpage_tab_ids[details.tabId]) {
    delete opera_startpage_tab_ids[details.tabId];
    api.tabs.create( { url: "https://www.facebook.com/home.php?old-layout-redirect" } );
    api.tabs.remove( details.tabId );
  }
});
b-opera*/

function reloadFacebookTabs() {
  api.tabs.query({"url": "https://*.facebook.com/*"}, function(tabs) {
    if (!tabs || !tabs.length) {
      return;
    }
    tabs.forEach((t) => {
      try {
        api.tabs.reload(t.id);
      } catch (e) {
      }
    });
  });
}

function getStatus() {
  return switch_agent;
}
function enable() {
  switch_agent = true;
}
function disable() {
  switch_agent = false;
}
