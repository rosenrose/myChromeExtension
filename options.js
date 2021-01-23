var banList = {};
var replaceList = [];
chrome.storage.local.get("cache", data => console.log(data.cache));
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
chrome.storage.sync.get("replaceList", data => {
    replaceList = data.replaceList;
    let replaceLi = document.querySelector("#replaceList ul");
    for (let replace of replaceList) {
        appendReplace(replaceLi, replace[0], replace[1]);
    }
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
        event.target.parentNode.parentNode.removeChild(event.target.parentNode);
        save();
    });
    li.appendChild(nick);
    li.appendChild(code);
    li.appendChild(btn);
    userList.appendChild(li);
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
        event.target.parentNode.parentNode.removeChild(event.target.parentNode);
        save();
    });
    li.appendChild(name);
    li.appendChild(btn);
    wordList.appendChild(li);
}

function appendReplace(replaceLi, original, replace) {
    let li = document.createElement("li");
    let orig = document.createElement("input");
    orig.type = "text";
    orig.className = "original";
    orig.value = original;
    orig.addEventListener("change", event => {
        current = replaceList.find(replace => replace[1] == event.target.nextElementSibling.value);
        current[0] = event.target.value;
        save();
    });
    let rep = document.createElement("input");
    rep.type = "text";
    rep.className = "replace";
    rep.value = replace;
    rep.addEventListener("change", event => {
        current = replaceList.find(replace => replace[0] == event.target.previousElementSibling.value);
        current[1] = event.target.value;
        save();
    });

    let up = document.createElement("button");
    up.type = "button";
    up.className = "upReplace";
    up.textContent = "↑";
    up.addEventListener("click", event => {
        let currentNode = event.target.parentNode.parentNode;
        if (upperNode = currentNode.previousElementSibling) {
            currentIdx = replaceList.findIndex(replace => replace[1] == event.target.parentNode.previousElementSibling.value);
            upperIdx = replaceList.findIndex(replace => replace[1] == upperNode.querySelector(".replace").value);
            [replaceList[currentIdx], replaceList[upperIdx]] = [replaceList[upperIdx], replaceList[currentIdx]];
            save();
            currentNode.parentNode.insertBefore(currentNode, upperNode);
        }
    });
    let down = document.createElement("button");
    down.type = "button";
    down.className = "downReplace";
    down.textContent = "↓";
    down.addEventListener("click", event => {
        let currentNode = event.target.parentNode.parentNode;
        if (downerNode = currentNode.nextElementSibling) {
            currentIdx = replaceList.findIndex(replace => replace[1] == event.target.parentNode.previousElementSibling.value);
            downerIdx = replaceList.findIndex(replace => replace[1] == downerNode.querySelector(".replace").value);
            [replaceList[currentIdx], replaceList[downerIdx]] = [replaceList[downerIdx], replaceList[currentIdx]];
            save();
            currentNode.parentNode.insertBefore(downerNode, currentNode);
        }
    });
    let del = document.createElement("button");
    del.type = "button";
    del.className = "delReplace";
    del.textContent = "del";
    del.addEventListener("click", event => {
        let rep = event.target.previousElementSibling.previousElementSibling.value;
        let idx = replaceList.findIndex(replace => replace[1] == rep)
        if (idx > -1) replaceList.splice(idx, 1);
        event.target.parentNode.parentNode.removeChild(event.target.parentNode);
        save();
    });
    let updown = document.createElement("span");
    updown.className = "updown";
    updown.appendChild(up);
    updown.appendChild(down);
    li.appendChild(orig);
    li.appendChild(rep);
    li.appendChild(updown);
    li.appendChild(del);
    replaceLi.appendChild(li);
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
    banList.user.forEach(user => {
        fetch(`https://mypi.ruliweb.com/mypi.htm?nid=${user.code}`)
        .then(response => response.text())
        .then(content => {
            let doc = new DOMParser().parseFromString(content, "text/html");
            let nick = doc.querySelector("h2.txt");
            if (nick) {
                nick = nick.textContent.split(" MYPI")[0].trim();
                if (!user.name.includes(nick)) {
                    console.log(user, nick);
                    user.name.unshift(nick);
                    save();
                }
            }
            else {
                fetch(`https://bbs.ruliweb.com/best/board/300143?search_type=member_srl&search_key=${user.code}`)
                .then(response => response.text())
                .then(content => {
                    let doc = new DOMParser().parseFromString(content, "text/html");
                    let tr = doc.querySelector(".table_body:not(.notice):not(.best):not(.list_inner)");
                    let writer = tr.querySelector("td.writer")
                    if (writer) {
                        writer = writer.textContent.trim();
                        if (!user.name.includes(writer)) {
                            console.log(user, writer);
                            user.name.unshift(writer);
                            save();
                        }
                    }
                    else {
                        console.log(user, "del")
                    }
                })
            }
        });
    })
});

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

document.querySelector("#addReplace").addEventListener("click", () => {
    let original = document.querySelector("#addReplaceInput1").value.trim();
    let replace = document.querySelector("#addReplaceInput2").value.trim();
    replaceList.push([original, replace]);
    appendReplace(document.querySelector("#replaceList ul"), original, replace);
    save();
});
document.querySelector("#resetReplace").addEventListener("click", () => {
    replaceList = [];
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
            label.appendChild(input);
            label.appendChild(document.createTextNode(boardList[i]));
            td[i].appendChild(label);
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
    chrome.storage.sync.set({userBoardList: boardList}, ()=>{});
    window.location.reload();
});

function save() {
    banList.user.sort((a,b) => {if(a.name[0]>b.name[0]) return 1; if(a.name[0]<b.name[0]) return -1; return 0;});
    banList.word.sort();
    chrome.storage.local.set({banList: banList}, ()=>{});
    chrome.storage.sync.set({userBoardList: userBoardList}, ()=>{});
    chrome.storage.sync.set({replaceList: replaceList}, ()=>{});
}