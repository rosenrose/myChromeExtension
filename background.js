chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({"color": '#000000'}, () => {console.log('Black');});
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

// chrome.storage.local.get("replace", data => {
//     let replaceJson = data.replace;
//     regexMap = {};
//     for (let ilbe of replaceJson["ilbeReplace"]) {
//         if (ilbe[0].includes("${")) {
//             regexMap[ilbe[0]] = new RegExp(ilbe[0].replace("${ilbe}",replaceJson["ilbe"]).replace("${endSuffix}",replaceJson["endSuffix"]), "g");
//         }
//         else {
//             regexMap[ilbe[0]] = new RegExp(ilbe[0], "g");
//         }
//     }
//     for (let replace of replaceJson["replaceList"]) {
//         regexMap[replace[0]] = new RegExp(replace[0], "gd");
//     }
//     for (let end of replaceJson["ends"]) {
//         regexMap[end[0]] = new RegExp(`${end[0]}(?=${replaceJson["endSuffix"]}*$)`, "g");
//     }
//     console.log(regexMap);
// });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message == "getRegex") {
//         sendResponse(regexMap);
//     }
// });