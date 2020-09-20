let domain = document.domain;
let url = document.URL;
let shortcut = {};
let ctrl = false;
document.addEventListener("keydown", event => {
    if ((event.target.tagName != 'INPUT') && (event.target.tagName != 'TEXTAREA')){
        key = event.key.toLowerCase();
        if (key == "control") ctrl = true;
        for (let i in shortcut) {
            if (key == i && !ctrl) window.location = shortcut[i];
        }
        switch (key) {
            case "x":
                if (ctrl) window.open(document.URL);
                break;
            case "backspace":
                window.history.back();
                break;
        }
    }
});
document.addEventListener("keyup", event => {
    if ((event.target.tagName != 'INPUT') && (event.target.tagName != 'TEXTAREA')){
        key = event.key.toLowerCase();
        if (key == "control") ctrl = false;
    }
})

if (domain == "bbs.ruliweb.com") {
    shortcut['f'] = "/best";
    let head = '<span style="color:red; font-weight:bold;">';
    let tail = "</span>";
    let trs = document.querySelectorAll("tr.table_body");
    chrome.storage.sync.get("banList", data => {
        banList = data.banList;
        let banNames = banList.user.map(user => user.name);
        let banWords = banList.word;
        for (let tr of trs) {
            let writer = tr.querySelector("td.writer.text_over").textContent.trim();
            let title = tr.querySelector("td.subject > a");
            if (// /^[★☆]/.test(title.textContent)||
                banWords.some(ban => title.textContent.indexOf(ban) != -1)||
                banNames.includes(writer)) {
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
                }
            });
        }
    });

    // for (let i=0; i<trs.length; i++) {
    //     appendTooltip(trs[i].querySelector("td.subject > a"), i);
    // }

    contextMenuElement = null;
    document.addEventListener("contextmenu", event => {
        // console.log(event.target);
        contextMenuElement = event.target;
    });

    chrome.extension.onMessage.addListener((req, sender, sendResponse) => {
        if (req.url!==location.href || req.cmd!=="myExt") return;
        let [tag, className] = [contextMenuElement.tagName, contextMenuElement.className];
        let link;
        if (tag == "TD" && className == "writer text_over") {
            link = contextMenuElement.previousElementSibling.querySelector("a").href;
        }
        else if (tag == "TD" && className == "subject") {
            link = contextMenuElement.querySelector("a").href;
        }
        else if (tag == "SPAN" && className == "num") {
            link = contextMenuElement.parentNode.previousElementSibling.href;
        }
        else if (tag == "A" && contextMenuElement.parentNode.className == "subject") {
            link = contextMenuElement.href;
        }
        getNameCode(link)
        .then(([writer, code]) => {
            let idx = banList.user.findIndex(user => user.code == code);
            if (idx > -1) {
                console.log([banList.user[idx].name, writer, code]);
                banList.user[idx].name = writer;
            }
            else {
                console.log([writer, code]);
                banList.user.push({name: writer, code: code});
            }
            banList.user.sort((a,b) => {if(a.name>b.name) return 1; if(a.name<b.name) return -1; return 0;});
            chrome.storage.sync.set({banList: banList}, ()=>{window.location.reload();});
        });
    });
}
else if (domain == "www.dogdrip.net") {
    shortcut['f'] = "/";
    if (url == "https://www.dogdrip.net/") {
        let main = document.querySelectorAll("div.eq.section.secontent.background-color-content > div.xe-widget-wrapper");
        main[6].style.display = "none";
        main[8].style.display = "none";
        main[9].style.display = "none";

        let boardList = [...document.querySelectorAll("div.eq.overflow-hidden")].slice(2);
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

        // for (let li of document.querySelector("ul.eq.widget.widget-normal").querySelectorAll("li")) {
        //     appendTooltip(li.querySelector("a"));
        // }
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

function getMain(link) {
    return fetch(link)
    .then(response => response.text())
    .then(content => {
        let doc = new DOMParser().parseFromString(content, "text/html");
        let article, comment;
        if (domain == "bbs.ruliweb.com") {
            article = doc.querySelector("div.board_main_view");
            comment = doc.querySelector(".comment_view.best");
        }
        else if (domain == "www.dogdrip.net") {
            article = doc.querySelector("div#article_1");
            comment = doc.querySelector(".comment-list");
        }
        return [article, comment];
    })
}

function appendTooltip(item, count) {
    if (item.className) {
        item.className += " myTooltip";
    }
    else {
        item.className = "myTooltip";
    }
    let tooltip = document.createElement("div");
    tooltip.style.marginTop = `${-400 + -20*count}px`;
    item.appendChild(tooltip);
    getMain(item.href)
    .then(([article, comment]) => {
        tooltip.appendChild(article);
        tooltip.appendChild(comment);
    });
}

function listAllEventListeners() {
    const allElements = [document, ...document.querySelectorAll("*")];
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
  
    return elements.sort((a,b) => {return a.type.localeCompare(b.type);});
}