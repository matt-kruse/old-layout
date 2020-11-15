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

/*
// USER-AGENT FIX
// ==============
var useragent = "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko";
var switch_agent = true;
var add_referer = true;
function rewriteUserAgentHeader(o) {
  let add_referer = true;
  if (o.url && /ol-rdr/.test(o.url)) {
    return;
  }
  for (let header of o.requestHeaders) {
    if (switch_agent && header.name.toLowerCase() === "user-agent") {
      header.value = useragent;
    }
    if (add_referer && header.name.toLowerCase() === "referer") {
      header.value = "https://www.facebook.com/";
      add_referer = false;
    }
  }
  if (add_referer) {
    o.requestHeaders.push({name: "Referer", value: "https://www.facebook.com/"});
  }
  return {"requestHeaders": o.requestHeaders};
}
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
*/

/*
// INTERNAL REDIRECT FIX
// =====================
let do_redirect = true;
function clean(url) {
  url = url.replace(/\/\//g,'/');
  return url;
}
function redirect(o) {
  if (!do_redirect) { return; }
  let url = o.url;
  if (/\/(messages|messaging)\//.test(url)) { return; }

  let m = /https:\/\/m\./.test(url);
  let has_params = /\?/.test(url);
  let path = url.replace(/^http.*?facebook\.com/,'');
  let parts = path.split('?');
  path = parts[0] || '';
  let params = parts[1] || '';
  let redirect_url = "https://www.facebook.com/home.php";

  // If we're trying to be on the newsfeed, we need to be on home.php
  if (path==="/" && !/next=/.test(params)) {
    return {
      "redirectUrl": redirect_url
    };
  }
  // If we got redirected to a mobile profile page
  if (m && /__tn__=[^&]*C-R/.test(params)) {
    return {
      "redirectUrl": clean("https://www.facebook.com/" + path + "/timeline")
    }
  }
  // If we get redirected to some other mobile page, try to avoid it
  if (m && !/ol-rdr/.test(url)) {
    return {
      "redirectUrl": clean("http://www.facebook.com/" + path + "?" + params + (has_params ? "&" : "") + "ol-rdr")
    }
  }
}
let requestOptions = ["blocking"];
api.webRequest.onBeforeRequest.addListener(
  redirect,
  {urls: ["*://*.facebook.com/*"]},
  requestOptions
);
*/

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
