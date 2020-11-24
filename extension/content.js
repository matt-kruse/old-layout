let enabled = true;
let version = 7.2;
let date = "2020-11-23";
let $ = sel=>document.querySelector(sel);
let faq = '<a href="https://oldlayout.com/#faq" target="_blank" style="font-weight:bold;text-decoration:underline;">Old Layout FAQ</a>';
let review_note = `<b>Please do not leave a negative review!</b> This fix works for many people, but not all. I'm sorry it didn't work for you, but it will work for others. Negative reviews hurt the chances of other people finding a fix. Thanks.`;
let simulate_missing_data = false;
let simulate_failure = false;
let simulate_false_positive = false;

addEventListener('load', function() {
  if (
    !/www\.facebook\.com\/?$/.test(location.href) &&
    !/www\.facebook\.com\/\?/.test(location.href) &&
    !/www\.facebook\.com\/home/.test(location.href)
    ) {
    return;
  }
  // Don't run on login page
  if ($('.UIPage_LoggedOut') || $('form[action^="/login"]')) {
    return;
  }
  chrome.storage.local.get(['disabled'], function(o) {
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
  let message = `<b>IMPORTANT! PLEASE READ!</b><br>
    <p>Click the "Switch to Old Layout" below to trigger Facebook's internal mechanism that allows users to switch back to the old layout for 48 hours. When this period ends, this message will appear again and you can trigger it again to switch.</p>
    <p><b>NOTE: This does NOT work for all Facebook accounts!</b> Unfortunately, Facebook will not allow some accounts to switch to the old layout. This is beyond our control, and not an issue with the Old Layout extension.</p>
    <p>Successfully switching to the Old Layout will change your account, so it will take effect in any browser you use, not just browsers with this extension. If you log into different accounts in this same browser, they may or may not be able to switch. The ability to switch depends on the ACCOUNT being switched.</p>
    <p><b>Styles have been added by Old Layout</b> to the Facebook's layout you're now seeing. This is an attempt to make the new layout more familiar and usable. If you <u>can't</u> switch to the Old Layout, these fixes will at least help it be bearable.</p>
    <p><i>To hide this popup without switching, click the "Disable this popup" button.</i><br>${faq}</p>
    <div>
      <button id="oldlayout-button">Switch to Old Layout</button>
      <button id="oldlayout-disable-button">Disable This Popup</button>
    </div>
    `;
  if (/oldlayout=true/.test(location.href)) {
    message = `<p>Oops! It looks like we tried to switch your account but it didn't actually succeed.</p>
        <p>This happens for some accounts, and we don't know why. This isn't a problem with the Old Layout extension, but a limitation of Facebook itself. It is preventing some accounts from switching.</p>
        <p>Hopefully the styles applied to the new layout will at least be an improvement for you.</p>
        <p>The extension might still work for other accounts on this same browser. Unfortunately we don't yet know why some accounts can't be switched, but we're working on it.</p>
        <p>For now, you can click to hide the panel below and it will go away until a new version is released.</p>
        <p>${faq}</p>
        <p>${review_note}</p>
      <button id="oldlayout-disable-button">Disable This Popup</button>
        `;
  }
  let div = document.createElement("div");
  div.id = "oldlayout";
  div.innerHTML = DOMPurify.sanitize(`
      <div id="oldlayout-header">Old Layout ${version} <span id="oldlayout-release-date">(${date})</span></div>
      <div id="oldlayout-msg">${message}</div>
  `);
  document.body.appendChild(div);
  try {
    if ($('#oldlayout-button')) {
      $('#oldlayout-button').addEventListener('click', old_layout_switch);
    }
    $('#oldlayout-disable-button').addEventListener('click', disable_popup);
  } catch (e) {
    alert(e);
  }

}
function disable_popup() {
  chrome.storage.local.set({"disabled":version});
  document.querySelector('#oldlayout').style.display="none";
  alert("You can make the popup show again by using the extension's Options menu in your browser's toolbar");
}
function msg(m) {
  document.querySelector('#oldlayout-msg').innerHTML = DOMPurify.sanitize(m);
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

  if (simulate_missing_data) {
    c_user = null;
  }

  let common = `Unfortunately the current fix isn't working for everyone, but we're still working on it. It appears that Facebook does NOT allow some accounts to switch back, but we don't know why. This is beyond Old Layout's control. <br>
Click the "Disable This Popup" button below to hide this popup for now.<br><br>
If an update to Old Layout is released, this popup will appear again so you can try again.<br><br>
${review_note}<br><br>
`;

  if (!dtsg || !c_user) {
    let s = "Old Layout could not find the necessary data to switch!<br>Missing: ";
    if (!dtsg) { s += "dtsg "; }
    if (!c_user) { s+= "userid "; }
    s+= `<br><br>${common}${faq}<br><button id="oldlayout-disable-button">Disable This Popup</button>`;
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
      //console.log("Trying "+index);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://www.facebook.com/api/graphql/');
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.setRequestHeader('Referrer', 'https://www.facebook.com/');
      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          //console.log(index);
          //console.log(xhr.responseText);
          if (!/"success":true/.test(xhr.responseText)) {
            //console.log(xhr.responseText);
            //console.log(index);
            //console.log(urls.length);
            if (++index>urls.length-1) {
              msg(`Sorry, but the switch to Old Layout failed.<br><br>${common}${faq}<br><button id="oldlayout-disable-button">Disable This Popup</button>`);
              document.querySelector('#oldlayout-button').style.display="none";
            }
            else {
              fire();
            }
          } else {
            //alert("ID "+index+" worked ");
            location.href = "https://www.facebook.com/?oldlayout=true";
          }
        }
      });
      let url = urls[index];
      if (simulate_failure) {
        url = url.replace("OPT_OUT","XXXXXX");
      }
      xhr.send(url);
    };
    if (simulate_false_positive) {
      location.href = "https://www.facebook.com/?oldlayout=true";
    }
    else {
      fire();
    }
  }
}
