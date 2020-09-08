chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({
        color: '#000000'
    }, function() {
        console.log('Black');
    });
    // chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // 	chrome.declarativeContent.onPageChanged.addRules([{
    // 		conditions: [new chrome.declarativeContent.PageStateMatcher({
    // 			pageUrl: {
    // 				hostEquals: 'namu.wiki',
    // 				urlContains: 'ruliweb.com'
    // 			},
    // 		})],
    // 		actions: [new chrome.declarativeContent.ShowPageAction()]
    // 	}]);
    // });
});

// chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
//     ensureSendMessage(tabs[0].id, {greeting: "hello"});
// });

// function ensureSendMessage(tabId, message, callback) {
//     chrome.tabs.sendMessage(tabId, {ping: true}, (response) => {
//         if(response && response.pong) { //Content script ready
//             chrome.tabs.sendMessage(tabId, message, callback);
//         }
//         else {  //No listener on the other end
//             chrome.tabs.executeScript(tabId, {file: "namu.js"}, () => {
//                 if(chrome.runtime.lastError) {
//                     console.error(chrome.runtime.lastError);
//                     throw Error(`Unable to inject script into tab ${tabId}`);
//                 }
//                 // Now it's injected and ready
//                 chrome.tabs.sendMessage(tabId, message, callback);
//             });
//         }
//     });
// }

chrome.contextMenus.create({
    id: "myExt",
    title: "차단",
    contexts: ["all"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    chrome.tabs.sendMessage(tab.id, {url: info.pageUrl, cmd: "myExt"});
});