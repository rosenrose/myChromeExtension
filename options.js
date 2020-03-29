let page = document.querySelector('#buttonDiv');
let list = document.querySelector('#list');
let banList = [];
let userBoardList = [];
const kButtonColors = ['#3aa757', '#e8453c', '#f9bb2d', '#4688f1'];

function constructOptions(kButtonColors) {
    for (let item of kButtonColors) {
        let button = document.createElement('button');
        button.style.backgroundColor = item;
        button.className = "colorBtn";
        button.addEventListener('click', function() {
            chrome.storage.sync.set({color: item}, function() {
                console.log('color is' + item);
            })
        });
        page.appendChild(button);
    }
}
constructOptions(kButtonColors);

function banListUpdate() {
    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }
    for (ban of banList) {
        li = document.createElement("li")
        li.innerText = ban
        list.appendChild(li)
    }
    chrome.storage.sync.set({banList: banList}, function() {});
}

chrome.storage.sync.get('banList', function(data) {
    if (data.banList.length == 0) {
        chrome.storage.sync.set({banList: []}, function() {});
    }
    banList = data.banList;
    banListUpdate();
});

document.querySelector("#addButton").addEventListener('click', function() {
    var user = document.querySelector("#add").value;
    banList.push(user);
    banListUpdate();
});

document.querySelector("#delButton").addEventListener('click', function() {
    var user = document.querySelector("#del").value;
    var idx = banList.indexOf(user)
    if (idx > -1) {
        banList.splice(idx,1);
    }
    banListUpdate();
});

document.querySelector("#resetButton").addEventListener('click', function() {
    banList = [];
    banListUpdate();
});

function getData(url) {
    return fetch(url)
        .then(response => response.text());
}
userSelects = document.querySelector("table~table").querySelectorAll("select");
async function init() {
    boardList = [];
    content = await getData("https://www.dogdrip.net");
    content = new DOMParser().parseFromString(content,"text/html");
    dogdripMain = content.querySelectorAll("div.eq.section.secontent.background-color-content > div.xe-widget-wrapper");
    top_boards =  dogdripMain[1].querySelectorAll("div > div.xe-widget-wrapper");
    bottom_boards = dogdripMain[5].querySelectorAll("div > div.xe-widget-wrapper");

    tableTds = document.querySelector("table").querySelectorAll("td");
    for (let i=0; i<tableTds.length; i++) {
        tableTds[i].id = `board${i}`;
    }
    for (let i=0; i<top_boards.length; i++) {
        boardName = top_boards[i].querySelector("a.eq.link").text;
        document.querySelector(`#board${i}`).innerText = boardName;
        boardList.push(boardName);
    }
    for (let i=2; i<4; i++) {
        boardName = dogdripMain[i].querySelector("a.eq.link").text;
        document.querySelector(`#board${i+1}`).innerText = boardName;
        boardList.push(boardName);
    }
    for (let i=0; i<bottom_boards.length; i++) {
        boardName = bottom_boards[i].querySelector("a.eq.link").text;
        document.querySelector(`#board${i+5}`).innerText = boardName;
        boardList.push(boardName);
    }
    boardList = boardList.slice(2,boardList.length);

    for (let i=0; i<userSelects.length; i++) {
        userSelects[i].id = i;
        userSelects[i].addEventListener("change", event => {
            userBoardList[event.target.id] = event.target.value;
            chrome.storage.sync.set({userBoardList: userBoardList}, function() {});
        });
        for (let j=0; j<boardList.length; j++) {
            let option = document.createElement("option");
            option.value = boardList[j];
            option.text = boardList[j];            
            userSelects[i].appendChild(option);
        }
    }

    chrome.storage.sync.get('userBoardList', function(data) {
        if (data.userBoardList.length == 0) {
            for (let i=0; i<boardList.length; i++) {
                userBoardList.push(boardList[i]);
            }
            chrome.storage.sync.set({userBoardList: userBoardList}, function() {});
        }
        else {
            userBoardList = data.userBoardList;
        }
        userSelectUpdate();
    });
}
init();

function userSelectUpdate() {
    for (let i=0; i<userSelects.length; i++) {
        let options = userSelects[i].querySelectorAll("option");
        for (let j=0; j<options.length; j++) {
            if (options[j].value == userBoardList[i]) {
                options[j].selected = true;
            }
        }
    }
}

document.querySelector("#resetButton2").addEventListener('click', function() {
    for (let i=0; i<userSelects.length; i++) {
        let options = userSelects[i].querySelectorAll("option");
        options[i].selected = true;
        userBoardList[i] = boardList[i];
    }
    chrome.storage.sync.set({userBoardList: userBoardList}, function() {});
});