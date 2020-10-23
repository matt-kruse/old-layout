addEventListener('load', function() {
  if (document.querySelector('#pagelet_bluebar')) {
    return;
  }
  let div = document.createElement('div');
  div.id="oldlayout";

  let header = document.createElement('div');
  header.id = "oldlayout-header";
  header.textContent = "Old Layout";
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

  document.body.appendChild(div);

});
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

  if (!dtsg || !c_user) {
    alert("Old Layout could not find the necessary data to switch, sorry!");
    return;
  }
  if (confirm("Old Layout will now attempt to switch you back to the old layout for 48 hours.\nThe page will reload.")) {
    //console.log("Sending Request");

    let payload = `av=${c_user}&__user=${c_user}&__a=1&dpr=1&__ccg=GOOD&__comet_req=1&fb_dtsg=${dtsg}&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=CometTrialParticipationChangeMutation&variables={"input":{"change_type":"OPT_OUT","source":"FORCED_GROUP_ADMIN_OPT_OUT","actor_id":"${c_user}","client_mutation_id":"4"}}&server_timestamps=true&doc_id=2317726921658975`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.facebook.com/api/graphql/');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Origin', 'https://www.facebook.com');
    xhr.setRequestHeader('Referrer', 'https://www.facebook.com/');
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === XMLHttpRequest.DONE){
        location.reload(true);
      }
    });
    xhr.send(payload);
  }
}
