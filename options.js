let banList = {};
chrome.storage.sync.get("banList", data => {
    banList = data.banList;
    let userList = document.querySelector("#userList");
    for (let user of banList.user) {
        appendUser(userList, user);
    }
    let wordList = document.querySelector("#wordList");
    for (let word of banList.word) {
        appendWord(wordList, word);
    }
});

function appendUser(userList, user) {
    let li = document.createElement("li");
    let name = document.createElement("span");
    name.className = "name";
    name.textContent = user.name;
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
    li.appendChild(name);
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

document.querySelector("#addUser").addEventListener("click", () => {
    let name = document.querySelector("#addNameInput").value.trim();
    let code = document.querySelector("#addCodeInput").value.trim();
    let idx = banList.user.findIndex(user => user.code == code);
    if (idx > -1) {
        banList.user[idx].name = name;
        document.querySelector(`li#${code} span`).textContent = name;
    }
    else {
        banList.user.push({name: name, code: code});
        appendUser(document.querySelector("#userList"), {name: name, code: code});
    }
    save();
});

document.querySelector("#resetUser").addEventListener("click", () => {
    banList.user = [];
    save();
    window.location.reload();
});

document.querySelector("#addWord").addEventListener("click", () => {
    let word = document.querySelector("#addWordInput").value.trim();
    banList.word.push(word);
    appendWord(document.querySelector("#wordList"), word);
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

    for (let i=0; i<2; i++) {
        document.querySelectorAll("#original td")[i].textContent = boardList[i];
    }
    boardList = boardList.slice(2);

    let labels = document.querySelectorAll("label");
    for (let i=0; i<labels.length; i++) {
        labels[i].appendChild(document.createTextNode(boardList[i]));
        let input = labels[i].querySelector("input");
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
    }

    chrome.storage.sync.get("userBoardList", data => {
        if (data.userBoardList == undefined) {
            userBoardList = boardList.slice();
        }
        else {
            userBoardList = data.userBoardList.slice();
            if (userBoardList.length > boardList.length) {
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
    banList.user.sort((a,b) => {if(a.name>b.name) return 1; if(a.name<b.name) return -1; return 0;});
    banList.word.sort();
    chrome.storage.sync.set({banList: banList}, ()=>{});
    chrome.storage.sync.set({userBoardList: userBoardList}, ()=>{});
}