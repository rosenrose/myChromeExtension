banList = {};
replaceList = [];
chrome.storage.local.get(data => {
    chrome.storage.sync.get(data2 => {
        console.log(data, data2);
    })
    // let textarea = document.querySelector("textarea");
    // textarea.style.height = "7200vh";
    // textarea.value = JSON.stringify(data, null, 2);
});
chrome.storage.local.get("banList", data => {
    banList = data.banList;
    let userList = document.querySelector("#userList ol");
    for (let user of banList.user) {
        appendUser(userList, user);
    }
    let wordList = document.querySelector("#wordList ul");
    for (let word of banList.word) {
        appendWord(wordList, word);
    }
});
fetch("https://gist.github.com/rosenrose/20537c90ffbdcae3e3b44eaffbf44b1e")
.then(response => response.text())
.then(content => {
    let doc = new DOMParser().parseFromString(content, "text/html");
    let list = JSON.parse([...doc.querySelectorAll("tr > td:nth-child(2)")].map(i=>i.textContent).join("\n"));
    chrome.storage.local.set({"replace": list}, () => {
        chrome.storage.local.get("replace", data => {
            let replaceLi = document.querySelector("#replaceList ul");
            for (let replace of data.replace["replaceList"]) {
                appendReplace(replaceLi, replace[0], replace[1]);
            }
        })
    })
});

function appendUser(userList, user) {
    let li = document.createElement("li");
    li.id = `code-${user.code}`;
    let nick = document.createElement("span");
    nick.className = "name";
    for (let name of user.name) {
        nick.innerHTML += `${name}<br>`;
    }
    let code = document.createElement("span");
    code.className = "code";
    code.textContent = user.code;
    let btn = document.createElement("button");
    btn.type = "button";
    btn.className = "delUser";
    btn.textContent = "del";
    btn.addEventListener("click", event => {
        let code = event.target.previousElementSibling.textContent;
        let idx = banList.user.findIndex(user => user.code == code);
        if (idx > -1) banList.user.splice(idx, 1);
        event.target.parentNode.remove();
        save();
    });
    li.append(nick, code, btn);
    userList.append(li);
}

function appendWord(wordList, word) {
    let li = document.createElement("li");
    let name = document.createElement("span");
    name.className = "name";
    name.textContent = word;
    let btn = document.createElement("button");
    btn.type = "button";
    btn.className = "delWord";
    btn.textContent = "del";
    btn.addEventListener("click", event => {
        let word = event.target.previousElementSibling.textContent;
        let idx = banList.word.indexOf(word);
        if (idx > -1) banList.word.splice(idx, 1);
        event.target.parentNode.remove();
        save();
    });
    li.append(name, btn);
    wordList.append(li);
}

function appendReplace(replaceLi, original, replace) {
    let li = document.createElement("li");
    li.draggable = true;
    li.setAttribute("data-index",replaceLi.querySelectorAll("li").length);
    li.addEventListener("dragstart", event => {
        dragged = event.target;
        event.target.style.opacity = 0.5;
        event.target.style.backgroundColor = "rgb(56,138,255)";
    });
    li.addEventListener("dragend", event => {
        event.target.removeAttribute("style");
        dragged = null;
        replaces = document.querySelectorAll("#replaceList li");
        for (let i=0; i<replaces.length; i++) {
            replaces[i].setAttribute("data-index",i);
            replaceList[i] = [replaces[i].querySelector(".original").value, replaces[i].querySelector(".replace").value];
        }
        // save();
    });
    li.addEventListener("dragover", event => {
        event.preventDefault();
    });
    li.addEventListener("dragenter", event => {
        if (dragged && (dragged != event.target)) {
            if (next = event.target.nextElementSibling) {
                if (next == dragged) {  //상승
                    event.target.parentNode.insertBefore(dragged, event.target)
                }
                else {  //하강
                    event.target.parentNode.insertBefore(dragged, next)
                }
            }
            else {  //맨 아랫줄
                event.target.parentNode.append(dragged)
            }
        }
    });
    li.addEventListener("drop", event => {
        event.preventDefault();
    });

    let orig = document.createElement("input");
    orig.type = "text";
    orig.className = "original";
    orig.value = original;
    orig.addEventListener("focus", event => {
        event.target.setAttribute("oldValue", event.target.value);
    });
    orig.addEventListener("change", event => {
        replaceList[event.target.parentNode.getAttribute("data-index")][0] = event.target.value;
        //save();
    });
    let rep = document.createElement("input");
    rep.type = "text";
    rep.className = "replace";
    rep.value = replace;
    rep.addEventListener("change", event => {
        replaceList[event.target.parentNode.getAttribute("data-index")][1] = event.target.value;
        //save();
    });

    let del = document.createElement("button");
    del.type = "button";
    del.className = "delReplace";
    del.textContent = "del";
    del.addEventListener("click", event => {
        replaceList.splice(event.target.parentNode.getAttribute("data-index"), 1);
        event.target.parentNode.remove();
        //save();
    });
    
    li.append(orig, rep, del, "　↕");
    replaceLi.append(li);
}

document.querySelector("#addUser").addEventListener("click", () => {
    let name = document.querySelector("#addNameInput").value.trim();
    let code = document.querySelector("#addCodeInput").value.trim();
    let idx = banList.user.findIndex(user => user.code == code);
    if (idx > -1) {
        banList.user[idx].name.unshift(name);
        document.querySelector(`li#code-${code} span`).innerHTML += `${name}<br>`;
    }
    else {
        let user = {name: [name], code: code}
        banList.user.push(user);
        appendUser(document.querySelector("#userList ol"), user);
    }
    save();
});

document.querySelector("#resetUser").addEventListener("click", () => {
    banList.user = [];
    save();
    window.location.reload();
});

document.querySelector("#updateUser").addEventListener("click", () => {
    index = 0
    updateUser();
});

function updateUser() {
    console.log(index);
    setTimeout(() => {
        fetch(`https://mypi.ruliweb.com/mypi.htm?nid=${banList.user[index].code}`)
        .then(response => response.text())
        .then(content => {
            let doc = new DOMParser().parseFromString(content, "text/html");
            let nick = doc.querySelector("h2.txt");
            if (nick) {
                nick = nick.textContent.split(" MYPI")[0].trim();
                if (!banList.user[index].name.includes(nick)) {
                    console.log(banList.user[index], nick);
                    banList.user[index].name.unshift(nick);
                    save();
                }
                if (index < banList.user.length-1) {
                    index += 1;
                    updateUser();
                }
            }
            else {
                fetch(`https://bbs.ruliweb.com/best/board/300143?search_type=member_srl&search_key=${banList.user[index].code}`)
                .then(response => response.text())
                .then(content => {
                    let doc = new DOMParser().parseFromString(content, "text/html");
                    let tr = doc.querySelector(".table_body:not(.notice):not(.best):not(.list_inner)");
                    // let writer = tr.querySelector("td.writer");
                    let writer = tr.querySelector("a.nick");
                    if (writer) {
                        writer = writer.textContent.trim();
                        if (!banList.user[index].name.includes(writer)) {
                            console.log(banList.user[index], writer);
                            banList.user[index].name.unshift(writer);
                            save();
                        }
                    }
                    else {
                        console.log(banList.user[index], "del")
                    }
                    if (index < banList.user.length-1) {
                        index += 1;
                        updateUser();
                    }
                })
            }
        });
    }, 1000);
}

document.querySelector("#addWord").addEventListener("click", () => {
    let word = document.querySelector("#addWordInput").value.trim();
    banList.word.push(word);
    appendWord(document.querySelector("#wordList ul"), word);
    save();
});

document.querySelector("#resetWord").addEventListener("click", () => {
    banList.word = [];
    save();
    window.location.reload();
});


let boardList = [];
let userBoardList = [];
let draggables = [...document.querySelectorAll("#user td")].slice(2);
let dragged;

fetch("https://www.dogdrip.net/")
.then(response => response.text())
.then(content => {
    content = new DOMParser().parseFromString(content,"text/html");
    boardList = content.querySelectorAll("div.eq.overflow-hidden");
    boardList = [...boardList].map(board => board.querySelector("a.eq.link").textContent.trim());

    let td = document.querySelectorAll("#original td");
    for (let i=0; i<td.length; i++) {
        if (i < 2) {
            td[i].textContent = boardList[i];
        }
        else if (i < boardList.length) {
            let label = document.createElement("label");
            let input = document.createElement("input");
            input.type = "checkbox";
            input.value = boardList[i];
            input.addEventListener("change", event => {
                if (event.target.checked) {
                    userBoardList.push(event.target.value);
                }
                else {
                    let idx = userBoardList.indexOf(event.target.value);
                    if (idx > -1) userBoardList.splice(idx, 1);
                }
                save();
                updateTable();
            });
            label.append(input, boardList[i]);
            td[i].append(label);
        }
        else {
            td[i].textContent = "\u00A0";
        }
    }

    chrome.storage.sync.get("userBoardList", data => {
        if (data.userBoardList == undefined) {
            userBoardList = boardList.slice(2);
        }
        else {
            userBoardList = data.userBoardList.slice();
            if ((boardList.length > 0) && (userBoardList.length > boardList.length)) {
                userBoardList.length = boardList.length;
            }
        }
        save();
        updateTable();
    });
});

function updateTable() {
    let checkboxes = document.querySelectorAll("input[type='checkbox']");
    for (let checkbox of checkboxes) {
        checkbox.checked = userBoardList.includes(checkbox.value);
    }
    for (let i=0; i<draggables.length; i++) {
        if (i < userBoardList.length) {
            draggables[i].textContent = userBoardList[i];
            draggables[i].style.backgroundColor = "rgb(46,67,97)";
            draggables[i].draggable = true;
            if (!draggables[i].hasAttribute("event")) {
                draggables[i].id = i;
                draggables[i].setAttribute("event", true);
                draggables[i].addEventListener("dragstart", event => {
                    if (event.target.draggable) {
                        dragged = event.target;
                        event.target.style.opacity = 0.5;
                    }
                });
                draggables[i].addEventListener("dragend", event => {
                    event.target.style.opacity = 1;
                    dragged = null;
                });
                draggables[i].addEventListener("dragover", event => {
                    event.preventDefault();
                });
                draggables[i].addEventListener("dragenter", event => {
                    if (dragged && event.target.draggable) {
                        event.target.style.backgroundColor = "rgb(56,138,255)";
                    }
                });
                draggables[i].addEventListener("dragleave", event => {
                    if (dragged && event.target.draggable) {
                        event.target.style.backgroundColor = "rgb(46,67,97)";
                    }
                });
                draggables[i].addEventListener("drop", event => {
                    event.preventDefault();
                    if (dragged && event.target.draggable) {
                        event.target.style.backgroundColor = "rgb(46,67,97)";
                        if (dragged != event.target) {
                            [event.target.textContent, dragged.textContent] = [dragged.textContent, event.target.textContent];
                            userBoardList[dragged.id] = dragged.textContent;
                            userBoardList[event.target.id] = event.target.textContent;
                            save();
                        }
                    }
                });
            }
        }
        else {
            draggables[i].textContent = "\u00A0";
            draggables[i].style.backgroundColor = "";
            draggables[i].draggable = false;
        }
    }
}

document.querySelector("#resetButton").addEventListener("click", () => {
    chrome.storage.sync.set({"userBoardList": boardList}, ()=>{});
    window.location.reload();
});

function save() {
    banList.user.sort((a,b) => {if(a.name[0]>b.name[0]) return 1; if(a.name[0]<b.name[0]) return -1; return 0;});
    banList.word.sort();
    chrome.storage.local.set({"banList": banList}, ()=>{});
    chrome.storage.sync.set({"userBoardList": userBoardList}, ()=>{});
}

function backup() {
    chrome.storage.local.get(data => {
        chrome.storage.sync.get(data2 => {
            json = JSON.stringify([data, data2], null, 2);
            blob = new Blob([json]);
            saveAs(URL.createObjectURL(blob), "backup.json");
        })
    });
}

function replaceSort() {
    let regex = /[\d가-힣ㄱ-ㅎ]/;
    replaceList.sort((a,b) => {
        if(a[0].match(regex)[0]>b[0].match(regex)[0]) return 1;
        if(a[0].match(regex)[0]<b[0].match(regex)[0]) return -1;
        return 0;
    });
}

function clearCache() {
    chrome.storage.local.get("cache", data => {
        for (let i=0; i<data.cache.main.length; i++) {
            data.cache.main[i] = {"link":"", "info":[], "title":""};
        }
        for (let i=0; i<data.cache.top.length; i++) {
            data.cache.top[i] = {"link":"", "info":[], "title":""};
        }
        chrome.storage.local.set({"cache": data.cache}, ()=>{})
    });
}

function saveAs(uri, filename) {
    let link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.append(link); // Firefox requires the link to be in the body
        link.download = filename;
        link.href = uri;
        link.click();
        document.body.removeChild(link); // remove the link when done
    } else {
        location.replace(uri);
    }
}