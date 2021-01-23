var [domain, url] = [document.domain, document.URL];
var shortcut = {};
var alt = new Set();
var numMapping = {20: "q", 21: "w", 22: "e", 23: "r", 24: "t", 25: "y", 26: "u", 27: "i", 28: "o", 29: "p"};
var contextMenuElement = null;
// var exception = ["discord.com","www.youtube.com","docs.google.com","twitter.com","remotedesktop.google.com"];

document.addEventListener("keydown", event => {
    let tagName = event.target.tagName;
    if ((tagName != 'INPUT') && (tagName != 'TEXTAREA')){
        let [key, code] = [event.key, event.code];
        if (code.startsWith("Digit") || code.startsWith("Numpad")) {
            let num = parseInt(code.slice(-1));
            num = (event.shiftKey)? ((num+9)%10)+10 : (num+9)%10;
            if (shortcut[num]) {
                if (event.altKey) {
                    alt.add(shortcut[num]);
                }
                else {
                    window.open(shortcut[num], "_blank");
                }
            }
        }
        else if (shortcut[key.toLowerCase()] && !event.ctrlKey) {
            if ("qwertyuiop-=".includes(key.toLowerCase())) {
                window.open(shortcut[key.toLowerCase()], "_blank");
            }
            else {
                window.location = shortcut[key.toLowerCase()];
            }
        }
        else if (key.toLowerCase() == "q" && event.ctrlKey) {
            window.open(document.URL);
        }
        else if (key == "Backspace" && tagName == "BODY") {
            window.history.back();
        }
    }
});
document.addEventListener("keyup", event => {
    if (event.key == "Alt" && alt.size) {
        for (let a of alt) window.open(a, "_blank");
        alt = new Set();
    }
})
document.addEventListener("contextmenu", event => {
    // console.log(event.target);
    contextMenuElement = event.target;
});

if (!["namu.wiki","ipgidkohaopckafpfkpanpblchgbfohb"].includes(domain)) {
    replace(document.body);
}

if (domain == "bbs.ruliweb.com") {
    shortcut["f"] = "/best";
    shortcut["g"] = "/best/political";
    head = '<span style="color:red; font-weight:bold;">';
    tail = "</span>";
    if (!url.includes("/board/")) {
        let trs = document.querySelectorAll("tr.table_body");
        chrome.storage.local.get(["banList", "cache"], data => {
            banList = data.banList;
            let banCodes = banList.user.map(user => user.code);
            let banWords = banList.word;
            promises = [];

            console.log(data.cache)
            console.log(data.cache.main[0])
            for (let tr of trs) {
                let writer = tr.querySelector("td.writer.text_over").textContent.trim();
                let title = tr.querySelector("td.subject > a");
                title.target = "_blank";
                let board = tr.querySelector("td.board_name").textContent.trim();
                if (banWords.some(word => title.textContent.includes(word)) || !board.includes("유머")) {
                    tr.style.display = "none";
                    console.log(title, writer.slice(0,2));
                    // title.innerHTML+=`${head}←(병신)${tail}`;
                }
                
                if (mainResult = data.cache.main.find(main => main.link == title.href)) {
                    let [writer, code] = mainResult.info;
                    if (banCodes.includes(code)) {
                        hide(tr, writer, code, "main");
                    }
                }
                else {
                    promises.push(new Promise(resolve => {
                        getNameCode(title.href)
                        .then(([writer, code]) => {
                            if (banCodes.includes(code)) {
                                hide(tr, writer, code, "main");
                            }
                            resolve();
                            data.cache.main.pop();
                            data.cache.main.unshift({
                                "link": title.href,
                                "info": [writer, code]
                            });
                        });
                    }));
                }
            }
            Promise.all(promises).then(() => {
                visible = [...trs].filter(tr => !tr.hasAttribute("style"));
                for (let i=0; i<Math.min(30,visible.length); i++) {
                    let td = visible[i].querySelector("td.subject");
                    let a = td.querySelector("a");
                    let small = document.createElement("span");
                    if (i<20) {
                        small.textContent = `[${i+1}] `;
                        shortcut[i] = a.href;
                    }
                    else {
                        small.textContent = `[${numMapping[i].toUpperCase()}] `;
                        shortcut[numMapping[i]] = a.href;
                    }
                    small.style.fontSize = "small";
                    td.insertBefore(small, a);
                }
                promises = [];
            });

            let best = document.querySelector("div.list.best_date.active");
            let items = best.querySelectorAll("a.deco");
            for (let item of items) {
                item.target = "_blank";
                if (topResult = data.cache.top.find(top => top.link == item.href)) {
                    let [writer, code] = topResult.info;
                    if (banCodes.includes(code)) {
                        hide(item, writer, code, "top");
                    }
                }
                else {
                    getNameCode(item.href)
                    .then(([writer, code]) => {
                        if (banCodes.includes(code)) {
                            hide(item, writer, code, "top");
                        }
                        data.cache.top.pop();
                        data.cache.top.unshift({
                            "link": item.href,
                            "info": [writer, code]
                        });
                    });
                }
            }
            chrome.storage.local.set({cache: data.cache}, ()=>{});
        });

        page = /page=(\d+)/.exec(location.search);
        if (page) {
            page = parseInt(page[1]);
            shortcut["a"] = url.replace(`page=${page}`, `page=${(page>1)? page-1 : 1}`);
            shortcut["s"] = url.replace(`page=${page}`, `page=${page+1}`);
        }
        else {
            page = 1;
            if (location.search.includes("?")) {
                shortcut["s"] = `${url}&page=${page+1}`;
            }
            else {
                shortcut["s"] = `${url}?page=${page+1}`;
            }
        }
    }
    // for (let i=0; i<trs.length; i++) {
    //     appendTooltip(trs[i].querySelector("td.subject > a"), i);
    // }

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
        else if (tag == "A") {
            link = contextMenuElement.href;
        }
        getNameCode(link)
        .then(([writer, code]) => {
            let idx = banList.user.findIndex(user => user.code == code);
            console.log(banList);
            if (idx > -1) {
                console.log([banList.user[idx].name, writer, code]);
                banList.user[idx].name.unshift(writer);
            }
            else {
                console.log([writer, code]);
                banList.user.push({name: [writer], code: code});
            }
            banList.user.sort((a,b) => {if(a.name[0]>b.name[0]) return 1; if(a.name[0]<b.name[0]) return -1; return 0;});
            chrome.storage.local.set({banList: banList}, ()=>{console.log(banList); window.location.reload();});
        });
    });
}
else if (domain == "www.dogdrip.net") {
    shortcut["f"] = "/";
    if (url == "https://www.dogdrip.net/" || url == "https://www.dogdrip.net") {
        let main = document.querySelectorAll("div.eq.section.secontent.background-color-content > div.xe-widget-wrapper");
        main[6].style.display = "none";
        main[8].style.display = "none";
        main[9].style.display = "none";

        let boardList = [...document.querySelectorAll("div.eq.overflow-hidden")].slice(2);
        let boardMap = {};
        for (let board of boardList) {
            replace(board);
            boardMap[board.querySelector("a").textContent.trim()] = board.cloneNode(true);
        }

        chrome.storage.sync.get("userBoardList", data => {
            for (let i=0; i<boardList.length; i++) {
                if (i < data.userBoardList.length) {
                    boardList[i].parentNode.appendChild(boardMap[data.userBoardList[i]]);
                }
                boardList[i].remove();
            }

            document.querySelectorAll("ul.eq.widget.widget-normal > li").forEach((li, i) => {
                let a = li.querySelector("a");
                a.target = "_blank";
                if (i<22) {
                    let small = document.createElement("span");
                    small.textContent = `[${i+1}] `;
                    small.style.fontSize = "small";
                    small.style.color = "#fff";
                    let div = li.querySelector("div.eq.width-expand");
                    div.insertBefore(small, div.querySelector("span"));
                    if (i<20) {
                        shortcut[i] = a.href;
                    }
                    else if (i==20) {
                        shortcut["-"] = a.href;
                    }
                    else if (i==21) {
                        shortcut["="] = a.href;
                    }
                }
            });
        });

        // for (let li of document.querySelector("ul.eq.widget.widget-normal").querySelectorAll("li")) {
        //     appendTooltip(li.querySelector("a"));
        // }
    }
}
else if (domain == "namu.wiki") {
    if (url.includes("history")) {
        // let lists = document.querySelectorAll("#app > div > div:nth-child(2) > article > div");
        let xpath = "//a[text() = '비교']/../../..";
        let lists = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        lists = lists.querySelectorAll("li");
        lists.forEach(list => {
            let id = list.querySelector("div");
            let a = id.querySelector("a");
            a.target = "_blank";
            if (["180.224.237.249","49.171.158.105"].includes(id.textContent.trim())) {
                a.style["text-decoration"] = "line-through";
                list.querySelectorAll(":scope > span")[2].textContent = "";
            }
        });
    }
    else if (url.includes("starred_documents")) {
        // document.querySelectorAll("#app > div > div:nth-child(2) > article > div a")
        let xpath = "//li[contains(text(), '수정시각')]/..";
        let lists = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        lists = lists.querySelectorAll("li > a");
        lists.forEach(link => {
            link.href = link.href.replace("/w","/history");
            link.target = "_blank";
        });
    }
    else if (url.includes("edit")) {
        let check = document.querySelector("input[type='checkbox']");
        check.parentNode.nextElementSibling.addEventListener("click", () => {
            if (!check.checked) {
                check.click();
            }
        });
    }
    else {
        let xpath = "//a[text() = '편집']/..";
        let result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        result = [...result.querySelectorAll("a")].slice(1);
        for (let a of result) {
            a.target = "_blank";
        }
    }
}

function hide(elem, writer, code, board) {
    if (board == "main") {
        elem.style.display = "none";
        console.log(elem.querySelector("td.subject > a"), writer.slice(0,2));
    }
    else if (board == "top") {
        elem.innerHTML = `${head}()${tail}`;
        console.log(elem, writer.slice(0,2));
    }
    let user = banList.user.find(user => user.code == code);
    if (!user.name.includes(writer)) {
        user.name.unshift(writer);
        chrome.storage.local.set({banList: banList}, ()=>{});
    }
}

function replace(root) {
    ends = [["되","돼$1"],["구요","고요$1"],["되라","돼라$1"]];
    chrome.storage.sync.get("replaceList", data => {
        walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        while(node = walk.nextNode()) {
            if (text = node.textContent.trim()) {
                for (let replace of data.replaceList) {
                    regex = new RegExp(replace[0], "g");
                    if (result = regex.exec(text)) {
                        node.textContent = text.replaceAll(regex, replace[1]);
                        console.log(`${text} (${result[0]})\n-----\n${node.textContent}`);
                        text = node.textContent;
                    }
                }
                for (let end of ends) {
                    regex = new RegExp(`${end[0]}([.,!?]+)$`, "g")
                    if (result = regex.exec(text)) {
                        node.textContent = text.replaceAll(regex, end[1]);
                        console.log(`${text} (${result[0]})\n-----\n${node.textContent}`);
                        text = node.textContent;
                    }
                }
            }
        }
    })
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

function urlParse(url) {
    return Object.fromEntries(url.split("&").map(keyVal => keyVal.split("=")).map(([k,v]) => [k,decodeURIComponent(v)]));
}
function urlEncode(obj) {
    return Object.entries(obj).map(([key,val]) => `${key}=${encodeURIComponent(val)}`).join("&");
}