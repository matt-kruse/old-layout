var userAgent = navigator.userAgent;
// Default useragent to use
var default_useragent = "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:54.0) Gecko/20100101 Firefox/54.0"; // Firefox
var useragent;

// Force a working useragent after Facebook started redirecting users to mobile site
useragent = "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:54.0) Gecko/20100101 Firefox/54.0";

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
    api.tabs.create( { url: "https://www.facebook.com/?old-layout-redirect" } );
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
    api.tabs.create({url: "https://OldLayout.com/broken.html"});
  }
  else if ("update"===details.reason) {
    var show_update = true;

    // Don't launch on update from 2.x to 2.x because it is a minor fix
    // if (!/2\./.test(previousVersion)) { show_update = false; }

    if (show_update) {
      api.tabs.create({url: "https://OldLayout.com/broken.html"});
    }
  }
});

// Intercept requests and force them to use our custom user agent
function rewriteUserAgentHeader(o) {
  /*
  if (/\/(ajax|api)\//.test(o.url) || /\.(js|png|gif|jpg|css)/.test(o.url) || "xmlhttprequest"===o.type) {
    //console.log("Using default user agent for "+o.url);
    return;
  }
  */
  for (var header of o.requestHeaders) {
    if (enabled && header.name.toLowerCase() === "user-agent") {
      header.value = useragent;
    }
  }
  return {
    "requestHeaders": o.requestHeaders
  };
}

// This is the API hook to intercept requests
let sendHeadersOptions = ["blocking", "requestHeaders"];
try {
  if (api.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty("EXTRA_HEADERS")) {
    sendHeadersOptions.push("extraHeaders");
  }
} catch (e) { }

api.webRequest.onBeforeSendHeaders.addListener(
  rewriteUserAgentHeader,
  {urls: ["*://*.facebook.com/*"]},
  sendHeadersOptions
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
