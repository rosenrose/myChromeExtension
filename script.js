function getData(url) {
    return fetch(url)
        .then(response => response.text());
}
var domain = window.location.hostname;

if (domain == "bbs.ruliweb.com") {
    let head = '<span style="color:red; font-weight:bold;">';
    let tail = "</span>";
    chrome.storage.sync.get('banList', async function(data) {
        let trs = document.querySelectorAll("tr.table_body");
        for (let tr of trs) {
            let writer = tr.querySelector("td.writer.text_over").innerText;
            if (data.banList.includes(writer)) {
                let title = tr.querySelector("td.subject > a");
                title.innerHTML+=`${head}←(병신)${tail}`;
            }
        }
        let best = document.querySelector("div.list.best_date.active");
        let items = best.querySelectorAll("a.deco");
        for (let item of items) {
            let content = await getData(item.href);
            let doc = new DOMParser().parseFromString(content, "text/html");
            let user = doc.querySelector("strong.nick").innerText;
            if (data.banList.includes(user)) {
                item.innerHTML = `${head}(${user})${tail}`+item.innerHTML;
            }
        }
    });
}
else if (domain == "www.dogdrip.net") {
    let main = document.querySelectorAll("div.eq.section.secontent.background-color-content > div.xe-widget-wrapper");
    let top_boards =  main[1].querySelectorAll("div > div.xe-widget-wrapper");
    let bottom_boards = main[5].querySelectorAll("div > div.xe-widget-wrapper");
    main[4].style.display = "none";
    let boards = {};

    boards[top_boards[2].querySelector("a.eq.link").innerText] = top_boards[2].innerHTML;
    boards[main[2].querySelector("a.eq.link").innerText] = main[2].innerHTML;
    boards[main[3].querySelector("a.eq.link").innerText] = main[3].innerHTML;
    for (let i=0; i<bottom_boards.length; i++) {
        boards[bottom_boards[i].querySelector("a.eq.link").innerText] = bottom_boards[i].innerHTML;
    }
    
    chrome.storage.sync.get('userBoardList', async function(data) {
        top_boards[2].innerHTML = boards[data.userBoardList[0]];
        main[2].innerHTML = boards[data.userBoardList[1]];
        main[3].innerHTML = boards[data.userBoardList[2]];
        for (let i=0; i<bottom_boards.length; i++) {
            bottom_boards[i].innerHTML = boards[data.userBoardList[i+3]];
        }
    });
}