[domain, url] = [document.domain, document.URL];
shortcut = {};
alt = new Set();
numMapping = {20: "q", 21: "w", 22: "e", 23: "r", 24: "t", 25: "y", 26: "u", 27: "i", 28: "o", 29: "p"};
contextMenuElement = null;

document.addEventListener("keydown", event => {
    let tagName = event.target.tagName;
    if ((tagName != 'INPUT') && (tagName != 'TEXTAREA')){
        let [key, code] = [event.key, event.code];
        // console.log(key, code, "shift", event.shiftKey, "alt", event.altKey, "ctrl", event.ctrlKey);
        if (code.startsWith("Digit") || code.startsWith("Numpad")) {
            let num = parseInt(code.slice(-1));
            if (event.shiftKey || (!event.shiftKey && num != key)) { //쉬프트+넘패드
                num = ((num+9)%10)+10;
            }
            else {
                num = (num+9)%10;
            }
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
    console.log(event.target);
    contextMenuElement = event.target;
});

chrome.storage.local.get("replace", data => {
    replaceJson = data.replace;
    let ilbe = replaceJson["ilbe"].join("|");
    for (let i=0; i<2; i++) {
        replaceJson["ilbeReplace"][i][0] = replaceJson["ilbeReplace"][i][0].replace("${ilbe}",ilbe).replace("${endSuffix}",replaceJson["endSuffix"]);
    }
    
    observer = new MutationObserver((mutationList, observer) => {
        mutationList.forEach(mutation => {
            switch (mutation.type) {
                case "childList":
                    if (domain == "namu.wiki") {
                        namu();
                    }
                    else if (!replaceJson["domainExcept"].slice(1).includes(domain)) {
                        replace(mutation.target);
                        if (domain == "laftel.net") {
                            let inside = document.querySelector(".inside");
                            if (inside) {
                                inside.style.display = "none";
                            }
                        }
                    }
                    // console.log(`The ${mutation.attributeName} attribute was modified.`);
                    break;
                case "attributes":
                    // console.log(mutation.target);
                    if (domain == "bbs.ruliweb.com" && mutation.target.id == "push_bar" && mutation.target.hasAttribute("style")) {
                        // console.log(mutation.target);
                        mutation.target.removeAttribute("style");
                        mutation.target.querySelector("a").target = "_blank";
                    }
                    break;
            }
        });
    });
    observer.observe(document.body, {childList: true, subtree: true, attributes: true});

    if (!replaceJson["domainExcept"].includes(domain)) {
        replace(document.head);
        replace(document.body);
        document.querySelectorAll("iframe").forEach(iframe => {
            try {
                replace(iframe.contentWindow.document.body);
            } catch (error) {
                console.log("iframe: "+error);
            }
        });
    }
    main();
});

function replace(root) {
    walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while(node = walk.nextNode()) {
        if (replaceJson["tagExcept"].includes(node.parentNode.tagName)) continue;
        if (node.textContent.trim()) {
            text = node.textContent;
            for (let end of replaceJson["ends"]) {
                regex = new RegExp(`${end[0]}(${replaceJson["endSuffix"]}*)$`, "g")
                if (result = regex.exec(text)) {
                    node.textContent = text.replaceAll(regex, end[1]);
                    console.log(`${text} (${result[0]})\n-----\n${node.textContent}`);
                    text = node.textContent;
                }
            }
            for (let replace of replaceJson["replaceList"]) {
                regex = new RegExp(replace[0], "g");
                if (result = regex.exec(text)) {
                    node.textContent = text.replaceAll(regex, replace[1]);
                    console.log(`${text} (${result[0]})\n-----\n${node.textContent}`);
                    text = node.textContent;
                }
            }
            if (replaceJson["repDomain"].includes(domain)) {
                for (let replace of replaceJson["ilbeReplace"]) {
                    regex = new RegExp(replace[0], "g");
                    if (result = regex.exec(text)) {
                        if (result[1] && result[2] && replaceJson["replaceExcept"].some(rep => (result[1]+result[2]).endsWith(rep))) continue;
                        node.textContent = text.replaceAll(regex, replace[1]);
                        console.log(`${text} (${result[0]})\n-----\n${node.textContent}`);
                        text = node.textContent;
                    }
                }
            }
        }
    }
    if (domain == "dcinside.com") {
        document.querySelectorAll(".written_dccon").forEach(con => {
            let includeCheck = [con.getAttribute("data-original"), con.src, con.getAttribute("data-src"), con.getAttribute("ori-data")].filter(a => a != null);
            if (includeCheck.some(check => replaceJson["ilbeCon"].includes(check))) {
                con.setAttribute("data-original", "");
                con.src = "";
                con.setAttribute("data-src", "");
                con.setAttribute("ori-data", "");
                if (source = con.querySelector("source")) {
                    source.remove();
                }
            }
        });
    }
}

hideMode = true;
function main() {
    switch(domain) {
        case "bbs.ruliweb.com":
            shortcut["f"] = "/best";
            shortcut["g"] = "/best/political";
            head = '<span style="color:red; font-weight:bold;">';
            tail = "</span>";
            if (url.includes("/read/")) {
                let imgBtn = document.querySelector("button.btn_comment_img");
                if (imgBtn && imgBtn.getAttribute("data-active") == "1") {
                    imgBtn.click();
                }
            }
            else if (hideMode) {
                let trs = document.querySelectorAll("tr.table_body");
                chrome.storage.local.get(["banList", "cache"], data => {
                    banList = data.banList;
                    cache = data.cache;
                    let banCodes = banList.user.map(user => user.code);
                    let banWords = banList.word;
                    promises = [];
            
                    let writer, title, board;
                    for (let tr of trs) {
                        if (url.includes("view=list")) {
                            writer = tr.querySelector("td.writer.text_over").textContent.trim();
                            title = tr.querySelector("td.subject > a");
                            board = tr.querySelector("td.board_name").textContent.trim();
                        }
                        else {
                            writer = tr.querySelector("a.nick").textContent.trim();
                            title = tr.querySelector("a.title_wrapper");
                            board = tr.querySelector("div.article_info > a").textContent.trim();
                            tr.querySelector("div.thumbnail_wrapper > a").target = "_blank";
                        }
                        title.target = "_blank";
                        if (banWords.some(word => title.textContent.trim().toLowerCase().match(new RegExp(word)) != null)) {
                            tr.style.display = "none";
                            console.log(title, title.childNodes[0].textContent.trim()+"\n"+writer.slice(0,2));
                            // title.innerHTML+=`${head}←(병신)${tail}`;
                        }
                        
                        if (result = cache.main.find(main => main.link == title.href.split("?")[0])) {
                            let [writer, code] = result.info;
                            if (banCodes.includes(code)) {
                                hide(tr, writer, code, "main");
                            }
                        }
                        else {
                            promises.push(new Promise(resolve => {
                                getNameCode(title.href, title)
                                .then(([writer, code, title]) => {
                                    resolve();
                                    if (banCodes.includes(code)) {
                                        hide(tr, writer, code, "main");
                                    }
                                    cache.main.pop();
                                    cache.main.unshift({
                                        "link": title.href.split("?")[0],
                                        "info": [writer, code],
                                        "title": title.textContent.trim()
                                    });
                                });
                            }));
                        }
                    }
                    let best = document.querySelector("div.list.best_date.active");
                    if (best) {
                        let items = best.querySelectorAll("a.deco");
                        for (let item of items) {
                            item.target = "_blank";
                            if (result = cache.top.find(top => top.link == item.href)) {
                                let [writer, code] = result.info;
                                if (banCodes.includes(code)) {
                                    hide(item, writer, code, "top");
                                }
                            }
                            else {
                                promises.push(new Promise(resolve => {
                                    getNameCode(item.href, item)
                                    .then(([writer, code, item]) => {
                                        resolve();
                                        if (banCodes.includes(code)) {
                                            hide(item, writer, code, "top");
                                        }
                                        cache.top.pop();
                                        cache.top.unshift({
                                            "link": item.href,
                                            "info": [writer, code],
                                            "title": item.textContent.trim()
                                        });
                                    });
                                }));
                            }
                        }
                    }
            
                    Promise.all(promises).then(() => {
                        visible = [...trs].filter(tr => !tr.hasAttribute("style"));
                        for (let i=0; i<Math.min(30,visible.length); i++) {
                            let td;
                            if (url.includes("view=list")) {
                                td = visible[i].querySelector("td.subject");
                            }
                            else {
                                td = visible[i].querySelector("div.text_wrapper");
                            }
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
                            if (url.includes("view=list")) {
                                td.insertBefore(small, a);
                            }
                            else {
                                a.insertBefore(small, a.childNodes[0]);
                            }
                        }
                        promises = [];
                        chrome.storage.local.set({"cache": cache}, ()=>{});
                    });
                });
            
                page = (new URL(url)).searchParams.get("page");
                if (page) {
                    page = parseInt(page);
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
                let link;
                while (contextMenuElement != document.body) {
                    contextMenuElement = contextMenuElement.parentNode;
                    if (url.includes("view=list")) {
                        if (contextMenuElement.tagName == "TR" && contextMenuElement.classList.contains("table_body")) {
                            link = contextMenuElement.querySelector("td.subject > a").href;
                            break;
                        }
                    }
                    else {
                        if (contextMenuElement.tagName == "DIV" && contextMenuElement.classList.contains("text_wrapper")) {
                            link = contextMenuElement.querySelector("a").href;
                            break;
                        }
                    }
                }
                getNameCode(link)
                .then(([writer, code]) => {
                    console.log([writer, code]);
                    if (writer && code) {
                        let idx = banList.user.findIndex(user => user.code == code);
                        console.log(banList);
                        if (confirm([writer, code])) {
                            if (idx > -1) {
                                console.log([banList.user[idx].name, writer, code]);
                                banList.user[idx].name.unshift(writer);
                            }
                            else {
                                banList.user.push({name: [writer], code: code});
                            }
                            banList.user.sort((a,b) => {if(a.name[0]>b.name[0]) return 1; if(a.name[0]<b.name[0]) return -1; return 0;});
                            chrome.storage.local.set({"banList": banList}, ()=>{console.log(banList); window.location.reload();});
                        }
                    }
                });
            });
            break;
        case "www.dogdrip.net":
            shortcut["f"] = "/";
            if (url == "https://www.dogdrip.net/" || url == "https://www.dogdrip.net") {
                let main = document.querySelectorAll("div.eq.section.secontent.background-color-content > div.xe-widget-wrapper");
                main[0].style.display = "none";
                main[8].style.display = "none";
        
                let boardList = [...document.querySelectorAll("div.eq.overflow-hidden")].slice(2);
                let boardMap = {};
                for (let board of boardList) {
                    boardMap[board.querySelector("a").textContent.trim()] = board.cloneNode(true);
                }
        
                chrome.storage.sync.get("userBoardList", data => {
                    for (let i=0; i<boardList.length; i++) {
                        if (i < data.userBoardList.length) {
                            boardList[i].parentNode.replaceChild(boardMap[data.userBoardList[i]], boardList[i]);
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
            break;
        case "namu.wiki":
            namu();
            break;
        case "novelpia.com":
            for (let script of document.querySelectorAll("script")) {
                script.remove();
            }
            // saveAs(URL.createObjectURL(new Blob([document.children[0].outerHTML], {type: "text/html"})),"save.html");
            break;
    }
}

function namu() {
    url = document.URL;
    if (url.includes("namu.wiki/history/")) {
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
        let xpath = "//li[contains(text(), '수정시각')]/..";
        let lists = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        lists = lists.querySelectorAll("li > a");
        lists.forEach(link => {
            link.href = link.href.replace("/w","/history");
            link.target = "_blank";
        });
    }
    else if (url.includes("namu.wiki/edit/")) {
        let check = document.querySelector("input[type='checkbox']");
        check.parentNode.nextElementSibling.addEventListener("click", () => {
            if (!check.checked) {
                check.click();
            }
        });
    }
    else {
        // let xpath = "//a[text() = '편집']/..";
        // if (result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
        //     result = [...result.querySelectorAll("a")].slice(1);
        //     for (let a of result) {
        //         a.target = "_blank";
        //     }
        // }
    }
}

function hide(elem, writer, code, board) {
    if (board == "main") {
        elem.style.display = "none";
        if (url.includes("view=list")) {
            console.log(elem.querySelector("td.subject > a"), writer.slice(0,2));
        }
        else {
            let a = elem.querySelector("a.title_wrapper");
            console.log(a, a.childNodes[0].textContent.trim()+"\n"+writer.slice(0,2));
        }
    }
    else if (board == "top") {
        elem.innerHTML = `${head}()${tail}`;
        console.log(elem, writer.slice(0,2));
    }
    let user = banList.user.find(user => user.code == code);
    if (!user.name.includes(writer)) {
        user.name.unshift(writer);
        chrome.storage.local.set({"banList": banList}, ()=>{});
    }
}

function getNameCode(link, option) {
    return fetch(link)
    .then(response => response.text())
    .then(content => {
        let doc = new DOMParser().parseFromString(content, "text/html");
        try {
            let writer = doc.querySelector("strong.nick").textContent.trim();
            let code = doc.querySelector("#member_srl").value;
            if (option) {
                return [writer, code, option];
            }
            else {
                return [writer, code];
            }
        } catch (error) {
            return [null, null];
        }
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

function select(...elems) {
    for (let elem of elems) {
        if (elem) return elem;
    }
    return null;
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

function saveAs(uri, filename) {
    let link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); // Firefox requires the link to be in the body
        link.download = filename;
        link.href = uri;
        link.click();
        document.body.removeChild(link); // remove the link when done
    } else {
        location.replace(uri);
    }
}