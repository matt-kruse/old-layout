let enabled = true;
let version = 6.4;
addEventListener('load', function() {
  chrome.storage.local.get('disabled', function(o) {
    if (o.disabled && version <= o.disabled) {
      enabled = false;
    }
    if (enabled) {
      add_panel();
    }
  });

});
function add_panel() {
  if (document.querySelector('#pagelet_bluebar')) {
    return;
  }
  let div = document.createElement('div');
  div.id="oldlayout";

  let header = document.createElement('div');
  header.id = "oldlayout-header";
  header.textContent = "Old Layout "+version;
  div.appendChild(header);

  let button = document.createElement('button');
  button.id="oldlayout-button";
  button.textContent = "Switch to Old Layout";
  button.addEventListener('click',old_layout_switch);
  div.appendChild(button);

  let msg = document.createElement('div');
  msg.id = "oldlayout-msg";
  msg.textContent = "Click the button above to trigger Facebook's internal mechanism that allows users to switch back to the old layout for 48 hours. When this period ends, this message will appear again and you can trigger it again to switch.";
  div.appendChild(msg);

  let disable = document.createElement('button');
  disable.id="oldlayout-disable-button";
  disable.textContent = "Disable This Popup";
  disable.addEventListener('click',disable_popup);
  div.appendChild(disable);

  document.body.appendChild(div);
}
function disable_popup() {
  chrome.storage.local.set({"disabled":version});
  document.querySelector('#oldlayout').style.display="none";
}
function msg(m) {
  document.querySelector('#oldlayout-msg').textContent = m;
}
async function old_layout_switch() {
  let dtsg = null;
  try {
    dtsg = document.body.textContent.match(/"DTSGInitialData".*?"token":"(.*?)"/)[1];
  } catch(e) { }
  try {
    if (!dtsg) {
      dtsg = document.querySelector('[name="fb_dtsg"]').value
    }
  } catch(e) { }

  let c_user = null;
  try {
    c_user = document.cookie.match(/c_user=([0-9]+)/)[1];
  } catch(e) { }

  let common = "Unfortunately the current fix isn't working for everyone, but we're working on it.\nClick the Hide button to hide this popup.\nIf an update to Old Layout is released, this popup will appear again so you can try again.";
  if (!dtsg || !c_user) {
    let s = "Old Layout could not find the necessary data to switch!\nMissing: ";
    if (!dtsg) { s += "dtsg "; }
    if (!c_user) { s+= "userid "; }
    s+= "\n" + common;
    msg(s);
    document.querySelector('#oldlayout-button').style.display="none";
    return;
  }
  if (confirm("Old Layout will now attempt to switch you back to the old layout for 48 hours.\nThe page will reload if successful or display a message if not. If the page reloads and still shows the new layout, then your account may not be able to switch back.")) {
    //console.log("Sending Request");
    msg("Please wait...");
    let index = 0;
    let urls = [
      `__a=1&dpr=1&__comet_req=1&fb_dtsg=${dtsg}&fb_api_req_friendly_name=CometTrialParticipationChangeMutation&variables={"input":{"change_type":"OPT_OUT","source":"SETTINGS_MENU","actor_id":"${c_user}","client_mutation_id":"1"}}&server_timestamps=true&doc_id=2317726921658975`,
      `__a=1&dpr=1&__comet_req=1&fb_dtsg=${dtsg}&fb_api_req_friendly_name=CometTrialParticipationChangeMutation&variables={"input":{"change_type":"OPT_OUT","source":"FORCED_GROUP_ADMIN_OPT_OUT","actor_id":"${c_user}","client_mutation_id":"4"}}&server_timestamps=true&doc_id=2317726921658975`,
      `__a=1&dpr=1&__comet_req=1&fb_dtsg=${dtsg}&fb_api_req_friendly_name=CometTrialParticipationChangeMutation&variables={"input":{"change_type":"OPT_OUT","source":"FORCED_PAGE_ADMIN_OPT_OUT","actor_id":"${c_user}","client_mutation_id":"2"}}&server_timestamps=true&doc_id=2317726921658975`,
      // Just for fun
      `__a=1&dpr=1&__comet_req=1&fb_dtsg=${dtsg}&fb_api_req_friendly_name=CometTrialParticipationChangeMutation&variables={"input":{"change_type":"OPT_OUT","source":"UNKNOWN","actor_id":"${c_user}","client_mutation_id":"3"}}&server_timestamps=true&doc_id=2317726921658975`
    ];

    let fire = function() {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://www.facebook.com/api/graphql/');
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.setRequestHeader('Referrer', 'https://www.facebook.com/');
      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (!/"success":true/.test(xhr.responseText)) {
            console.log(xhr.responseText);
            if (++index>urls.length) {
              msg("Sorry, but the switch to Old Layout failed.\n"+common);
              document.querySelector('#oldlayout-button').style.display="none";
            }
            else {
              fire();
            }
          } else {
            //alert("ID "+index+" worked ");
            location.reload(true);
          }
        }
      });
      xhr.send(urls[index]);
    };
    fire();
  }
}
