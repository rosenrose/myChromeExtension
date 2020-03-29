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
    // let top_boards =  main[1].querySelectorAll("div > div.xe-widget-wrapper");
    let bottom_boards = main[5].querySelectorAll("div > div.xe-widget-wrapper");
    main[4].style.display = "none";

    // let dogdrip = top_boards[0].cloneNode(true);
    // let userdog = top_boards[1].cloneNode(true);
    // let doc = top_boards[2].cloneNode(true);
    let gameserial = main[2].cloneNode(true);
    let vehicle = main[3].cloneNode(true);
    let free = bottom_boards[0].cloneNode(true);
    let consultation = bottom_boards[1].cloneNode(true);
    let computer = bottom_boards[2].cloneNode(true);
    let game = bottom_boards[3].cloneNode(true);
    let console = bottom_boards[4].cloneNode(true);
    let mobilegame = bottom_boards[5].cloneNode(true);
    let lol = bottom_boards[6].cloneNode(true);
    let creation = bottom_boards[7].cloneNode(true);
    let duck = bottom_boards[8].cloneNode(true);
    let movie = bottom_boards[9].cloneNode(true);
    let music = bottom_boards[10].cloneNode(true);
    let cook = bottom_boards[11].cloneNode(true);
    let pic = bottom_boards[12].cloneNode(true);
    let girlgroup = bottom_boards[13].cloneNode(true);
    let politics = bottom_boards[14].cloneNode(true);
    let genderissue = bottom_boards[15].cloneNode(true);
    let sports = bottom_boards[16].cloneNode(true);
    let surplustime = bottom_boards[17].cloneNode(true);
    // let notice = bottom_boards[18].cloneNode(true);

    main[2].innerHTML = computer.innerHTML;
    main[3].innerHTML = movie.innerHTML;
    bottom_boards[0].innerHTML = creation.innerHTML;
    bottom_boards[1].innerHTML = duck.innerHTML;
    bottom_boards[2].innerHTML = game.innerHTML;
    bottom_boards[3].innerHTML = console.innerHTML;
    bottom_boards[4].innerHTML = music.innerHTML;
    bottom_boards[5].innerHTML = cook.innerHTML;
    bottom_boards[6].innerHTML = free.innerHTML;
    bottom_boards[7].innerHTML = consultation.innerHTML;
    bottom_boards[8].innerHTML = gameserial.innerHTML;
    bottom_boards[9].innerHTML = vehicle.innerHTML;
    bottom_boards[10].innerHTML = mobilegame.innerHTML;
    bottom_boards[11].innerHTML = lol.innerHTML;
    bottom_boards[12].innerHTML = pic.innerHTML;
    bottom_boards[13].innerHTML = girlgroup.innerHTML;
    bottom_boards[14].innerHTML = politics.innerHTML;
    bottom_boards[15].innerHTML = genderissue.innerHTML;
    bottom_boards[16].innerHTML = sports.innerHTML;
    bottom_boards[17].innerHTML = surplustime.innerHTML;
}