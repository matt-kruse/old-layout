// Removed
addEventListener('load', function() {
  document.querySelector('#reset').addEventListener('click',function() {
    chrome.storage.local.set({"disabled":null});
    document.body.textContent = "Reload Facebook to see the popup again";
  });
});
