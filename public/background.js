chrome.runtime.onMessage.addListener( function(request,sender,sendResponse)
{
    var resp = sendResponse;
    if( request.geturl == "GetURL" )
    {
        let tabURL = "";
        chrome.tabs.query({active:true, currentWindow: true},function(tabs){
            if(tabs.length == 0) {
                sendResponse({searchURL: 'nope'});
                return;
            }
            tabURL = tabs[0].url;
            sendResponse( {searchURL:tabURL} );
        });        
    }
    return true;
});

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostContains: '.reddit.com', urlContains: 'search?q', schemes: ['https', 'http'] }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
    chrome.tabs.create({url:chrome.extension.getURL("firstrun.html")},function(){})
  });