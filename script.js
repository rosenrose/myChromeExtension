let domain = document.domain;
let url = document.URL;
let key = new Array();
document.onkeypress = getKey;

if (domain == "bbs.ruliweb.com") {
    key['f'] = "/best";
    let head = '<span style="color:red; font-weight:bold;">';
    let tail = "</span>";
    chrome.storage.sync.get("banList", data => {
        banList = data.banList;
        let banNames = banList.user.map(user => user.name);
        let banWords = banList.word;
        let trs = document.querySelectorAll("tr.table_body");
        for (let tr of trs) {
            let writer = tr.querySelector("td.writer.text_over").textContent.trim();
            let title = tr.querySelector("td.subject > a");
            if (title.textContent.startsWith("★")||title.textContent.startsWith("☆")||
                banWords.some(ban => title.textContent.indexOf(ban) != -1)) {
                tr.style.display = "none";
                console.log(title, writer.slice(0,2));
            }
            if (banNames.includes(writer)) {
                tr.style.display = "none";
                console.log(title, writer.slice(0,2));
                // title.innerHTML+=`${head}←(병신)${tail}`;
            }
        }
        let best = document.querySelector("div.list.best_date.active");
        let items = best.querySelectorAll("a.deco");
        for (let item of items) {
            getNameCode(item.href)
            .then(([writer, code]) => {
                if (banNames.includes(writer)) {
                    item.innerHTML = `${head}()${tail}`;
                    console.log(item, writer.slice(0,2));
                    // item.style.display = "none";
                }
            });
        }
    });    
}
else if (domain == "www.dogdrip.net") {
    key['f'] = "/";
    if (url == "https://www.dogdrip.net/") {
        let main = document.querySelectorAll("div.eq.section.secontent.background-color-content > div.xe-widget-wrapper");
        main[6].style.display = "none";
        main[8].style.display = "none";
        main[9].style.display = "none";

        let boardList = Array.from(document.querySelectorAll("div.eq.overflow-hidden")).slice(2);
        for (let board of boardList) {
            boardList[board.querySelector("a").textContent.trim()] = board.cloneNode(true);
        }

        chrome.storage.sync.get("userBoardList", data => {
            for (let i=0; i<boardList.length; i++) {
                if (i < data.userBoardList.length) {
                    boardList[i].parentNode.appendChild(boardList[data.userBoardList[i]]);
                }
                boardList[i].style.display = "none";
            }
        });
    }
}
else if (url.includes("namu.wiki/history")) {
    let lists = document.querySelectorAll("#app > div > div:nth-child(2) > article > div");
    lists = lists[lists.length-1].querySelectorAll("li");
    for (let list of lists) {
        let id = list.querySelector("div");
        if (id.textContent.trim() == "180.224.237.249") {
            id.querySelector("a").style["text-decoration"] = "line-through";
            list.querySelectorAll(":scope > span")[2].textContent = "";
        }
    }
}
else if (url.includes("namu.wiki/member")) {
    let links = document.querySelectorAll("#app > div > div:nth-child(2) > article > div a");
    for (let link of links) {
        link.href = link.href.replace("/w","/history");
    }
}

let contextMenuElement = null;
document.addEventListener("contextmenu", event => {
    contextMenuElement = event.srcElement;
});

chrome.extension.onMessage.addListener((req, sender, sendResponse) => {
    if (req.url!==location.href || req.cmd!=="myExt") return;
    if (contextMenuElement.className == "writer text_over") {
        let link = contextMenuElement.previousElementSibling.querySelector("a").href;
        getNameCode(link)
        .then(([writer, code]) => {
            let idx = banList.user.indexOf(banList.user.find(user => user.code == code));
            if (idx > -1) {
                console.log([banList.user[idx].name, writer, code]);
                banList.user[idx].name = writer;
            }
            else {
                console.log([writer, code]);
                banList.user.push({name: writer, code: code});
            }
            chrome.storage.sync.set({banList: banList}, ()=>{});
        });
    }
});

function getNameCode(link) {
    return fetch(link)
    .then(response => response.text())
    .then(content => {
        let doc = new DOMParser().parseFromString(content, "text/html");
        let writer = doc.querySelector("strong.nick").textContent.trim();
        let code = doc.querySelector("#member_srl").value;
        return [writer, code];
    });
}

function getKey(keyStroke) {
    if ((event.srcElement.tagName != 'INPUT') && (event.srcElement.tagName != 'TEXTAREA')){
        isNetscape=(document.layers);
        eventChooser = (isNetscape) ? keyStroke.which : event.keyCode;
        which = String.fromCharCode(eventChooser).toLowerCase();
        for (let i in key)
            if (which == i) window.location = key[i];
    }
}

function listAllEventListeners() {
    const allElements = Array.from(document.querySelectorAll("*"));
    allElements.unshift(document);
    const types = [];
    for (let ev in window) {
      if (/^on/.test(ev)) types[types.length] = ev;
    }
  
    let elements = [];
    for (let i = 0; i < allElements.length; i++) {
      const currentElement = allElements[i];
      for (let j = 0; j < types.length; j++) {
        if (typeof currentElement[types[j]] === 'function') {
          elements.push({
            "node": currentElement,
            "type": types[j],
            "func": currentElement[types[j]].toString(),
          });
        }
      }
    }
  
    return elements.sort(function(a,b) {
      return a.type.localeCompare(b.type);
    });
}