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

    // Don't launch on update from 2.x to 2.x because it is a minor fix
    // if (!/2\./.test(previousVersion)) { show_update = false; }

    if (show_update) {
      api.tabs.create({url: "https://OldLayout.com/update.html?version=6"});
    }
  }
});
