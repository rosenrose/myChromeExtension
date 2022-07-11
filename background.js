chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(null, (data) => {
    const initial = {
      etc: {
        isBoard: false,
        isFetch: false,
      },
      userBoardList: [],
    };

    for (const key in initial) {
      if (!(key in data)) {
        chrome.storage.sync.set({ [key]: initial[key] }, () => {});
      }
    }
  });

  chrome.storage.local.get(null, (data) => {
    const initial = {
      banList: {
        user: [],
        word: [],
      },
      cache: {
        main: [],
        top: [],
      },
    };

    for (const key in initial) {
      if (!(key in data)) {
        chrome.storage.local.set({ [key]: initial[key] }, () => {});
      }
    }
  });
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

try {
  chrome.contextMenus.create({
    id: "ruliweb",
    title: "차단",
    contexts: ["link"],
  });
  chrome.contextMenus.create({
    id: "imagePaste",
    title: "이미지 붙여넣기",
    contexts: ["all"],
  });
} catch (e) {}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.tabs.sendMessage(tab.id, { id: info.menuItemId, url: info.pageUrl, cmd: "myExt" });
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
