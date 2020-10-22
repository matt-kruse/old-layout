var enabled = true;
var api = typeof chrome!="undefined" ? chrome : browser;

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
    api.tabs.create( { url: "https://upload.facebook.com/?old-layout-redirect" } );
    api.tabs.remove( details.tabId );
  }
});

b-opera*/

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

    // Don't launch on update from 2.x to 2.x because it is a minor fix
    // if (!/2\./.test(previousVersion)) { show_update = false; }

    if (show_update) {
      api.tabs.create({url: "https://OldLayout.com/update.html?version=5"});
    }
  }
});

// Redirect to upload instead of www
function redirect(details) {
  let url = details.url;
  if (!enabled || /^https:\/\/upload/.test(url)) {
    return;
  }
  if (/facebook\.com\/messages/.test(url)) { return; }
  if (/\/(ajax|graphql|api|messaging|rtc)\//i.test(url)) { return; }
  if (details.documentUrl && /upload\.facebook/.test(details.documentUrl)) { return; }
  if (/^https:\/\/www/.test(url)) {
    console.log("redirecting from "+url);
    console.log(details);
    url = details.url.replace(/^https:\/\/www/, 'https://upload');
    return {
      redirectUrl: url
    };
  }
}

// Instead requests and redrect
api.webRequest.onBeforeRequest.addListener(
  redirect,
  {urls: ["*://*.facebook.com/*"]},
  ["blocking"]
);

// A wrapper around async API calls for Chrome/Firefox compatibility
function async_api(f, arg, cb, err) {
  err = err || function(e){ console.log(e); };
  var callback = function(a,b,c,d) {
    var e = api.runtime.lastError;
    if (e) {
      err(e);
    }
    else {
      cb(a,b,c,d);
    }
  };
  try {
    var promise = f.call(null, arg, callback);
    if (promise && promise.then) {
      promise.then(callback);
    }
  } catch(e) {
    err(e);
  }
}
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
  return enabled;
}
function enable() {
  enabled = true;
}
function disable() {
  enabled = false;
}
