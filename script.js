[domain, url] = [document.domain, new URL(document.URL)];
shortcut = {};
alt = new Set();
// prettier-ignore
numMap = {
  20: "q", 21: "w", 22: "e", 23: "r", 24: "t", 25: "y", 26: "u", 27: "i", 28: "o", 29: "p",
  30: "a", 31: "s", 32: "d", 33: "f", 34: "g", 35: "h", 36: "j", 37: "k", 38: "l", 39: ";",
  40: "z", 41: "x", 42: "c", 43: "v", 44: "b", 45: "n", 46: "m", 47: ",", 48: ".", 49: "/",
  50: "-", 51: "=", 52: "[", 53: "]", 54: "'", 55: "\\", 56: "`",
};
contextMenuElement = null;
jamoRegex = /(?<=\{).+?(?=\})/;
zipRegex = /(?<=\()(?<![?!=<]+)[^?!=<]+?(?=\))/g;
regexMap = {};
sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

document.addEventListener("keydown", (event) => {
  let [key, code] = [event.key, event.code];
  // console.log(key, code, "shift", event.shiftKey, "alt", event.altKey, "ctrl", event.ctrlKey);

  if (event.target.matches("input, textarea")) {
    return;
  }
  if (code.startsWith("Digit") || code.startsWith("Numpad")) {
    let input = parseInt(code.slice(-1));
    let num = (input + 9) % 10;

    if (event.shiftKey || (!event.shiftKey && input != key)) {
      //쉬프트+일반 || 쉬프트+넘패드
      num += 10;
    }

    if (shortcut[num]) {
      if (event.altKey) {
        alt.add(shortcut[num]);
      } else {
        window.open(shortcut[num], "_blank");
      }
    }
  } else if (shortcut[key.toLowerCase()] && !event.ctrlKey) {
    let short = shortcut[key.toLowerCase()];

    if (typeof short == "object") {
      if ("target" in short) {
        window.open(short.url, short.target);
      } else {
        window.location = short.url;
      }
    } else if (typeof short == "function") {
      short();
    }
  } else if (key.toLowerCase() == "q" && event.ctrlKey) {
    window.open(document.URL);
  } else if (key == "Backspace" && event.target.matches("body") && document.designMode == "off") {
    window.history.back();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key == "Alt" && alt.size) {
    alt.forEach((a) => {
      window.open(a, "_blank");
    });
    alt.clear();
  }
});

document.addEventListener("contextmenu", (event) => {
  console.log(event.target);
  contextMenuElement = event.target;
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.url !== location.href || req.cmd !== "myExt" || req.id !== "imagePaste") return;

  let input;
  if (contextMenuElement?.matches("input[type='file']")) {
    input = contextMenuElement;
  } else {
    input = document.querySelector(prompt("query?", "input[type='file']"));
  }
  console.log(input);

  navigator.clipboard.read().then((data) => {
    data[0].getType("image/png").then((blob) => {
      let datatransfer = new DataTransfer();
      datatransfer.items.add(new File([blob], "image.png", { type: blob.type }));
      input.files = datatransfer.files;

      input.dispatchEvent(new InputEvent("change"), { bubbles: true });
      try {
        reactTriggerChange(input);
      } catch {}
    });
  });
});

chrome.storage.local.get("replace", (data) => {
  replaceJson = data.replace;
  replaceJson["ilbeReplace"].forEach((ilbe) => {
    if (ilbe[0].includes("${")) {
      regexMap[ilbe[0]] = new RegExp(
        ilbe[0]
          .replace("${ilbe}", replaceJson["ilbe"])
          .replace("${endSuffix}", replaceJson["endSuffix"]),
        "g"
      );
    } else {
      regexMap[ilbe[0]] = new RegExp(ilbe[0], "g");
    }
  });
  replaceJson["replaceList"].forEach((replace) => {
    if (zipRegex.exec(replace[1])) {
      regexMap[replace[0]] = new RegExp(replace[0], "gd");
      zipRegex.lastIndex = 0;
    } else {
      regexMap[replace[0]] = new RegExp(replace[0], "g");
    }
  });
  replaceJson["ends"].forEach((end) => {
    regexMap[end[0]] = new RegExp(`${end[0]}(?=${replaceJson["endSuffix"]}*$)`, "g");
  });

  observer = new MutationObserver(observeCallback);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
  });
  try {
    document.querySelectorAll("iframe").forEach((iframe) => {
      let observer = new MutationObserver(observeCallback);
      observer.observe(iframe.contentDocument.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    });
  } catch (error) {
    // console.log("iframe: " + error);
  }

  if (!replaceJson["domainExcept"].includes(domain)) {
    textReplace(document.body);
    textReplace(document.head.querySelector("title"));
    try {
      document.querySelectorAll("iframe").forEach((iframe) => {
        textReplace(iframe.contentDocument.body);
      });
    } catch (error) {
      // console.log("iframe: "+error);
    }
  }
  main();
});

function observeCallback(mutationList) {
  // if (mutation.target.nodeType === Node.ELEMENT_NODE)
  mutationList.forEach((mutation) => {
    // console.log(mutation.type, mutation.target);
    switch (mutation.type) {
      case "childList":
        // console.log(mutation.target.textContent.trim());
        try {
          if (mutation.target.matches?.("iframe")) {
            let observer = new MutationObserver(observeCallback);
            observer.observe(mutation.target.contentDocument.body, {
              childList: true,
              subtree: true,
              attributes: false,
            });
          }
        } catch (error) {
          // console.log("iframe: " + error);
        }

        if (domain == "namu.wiki") {
          namu();
        } else if (!replaceJson["domainExcept"].slice(1).includes(domain)) {
          textReplace(mutation.target);
          // replaceDeubg(mutation.target);
          if (domain == "laftel.net") {
            let inside = document.querySelector(".inside");
            if (inside) {
              inside.hidden = true;
            }
          }
        }
        if (domain.includes("dood")) {
          document.querySelector("#video_player > div.vjs-text-track-display")?.remove();
        }
        break;
      case "attributes":
        // console.log(mutation.target, mutation.attributeName, mutation.oldValue);
        if (domain == "bbs.ruliweb.com") {
          if (mutation.target.id == "push_bar" && mutation.target.style.display == "none") {
            mutation.target.removeAttribute("style");
            mutation.target.querySelector("a").target = "_blank";
            console.log(mutation.target.querySelector("a"));
          }
        }
        break;
    }
  });
}

function textReplace(element) {
  if (element.nodeType != Node.ELEMENT_NODE) return;

  walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  while ((node = walk.nextNode())) {
    text = node.textContent;
    if (!/[가-힣]/.test(text)) continue;
    if (replaceJson["tagExcept"].includes(node.parentNode.tagName)) continue;
    // console.log(text.trim());
    // node.textContent = "a";
    for (let end of replaceJson["ends"]) {
      regex = regexMap[end[0]];
      if ((result = regex.exec(text))) {
        node.textContent = text.replace(regex, end[1]);
        console.log(`${text.trim()} (${result[0]})\n-----\n${node.textContent.trim()}`);
        text = node.textContent;
        regex.lastIndex = 0;
      }
    }
    for (let replace of replaceJson["replaceList"]) {
      regex = regexMap[replace[0]];
      if ((result = regex.exec(text))) {
        if ((jamo = jamoRegex.exec(replace[1]))) {
          let [rep, start, end, repStart, repEnd] = jamo[0].split(",");
          let nfd = result[0].normalize("NFD");
          let newNFD;
          if (repStart) {
            newNFD =
              nfd.slice(0, start) + rep.normalize("NFD").slice(repStart, repEnd) + nfd.slice(end);
          } else {
            newNFD = nfd.slice(0, start) + rep.normalize("NFD") + nfd.slice(end);
          }
          node.textContent = text.replace(regex, newNFD.normalize());
        } else if ((repZips = replace[1].match(zipRegex))) {
          let orgZips = replace[0].match(zipRegex);
          let indices = [];
          for (let i = 1; i < result.length; i++) {
            let orgZip = orgZips[i - 1].split("|");
            let repZip = repZips[i - 1].split("|");
            let index = orgZip.indexOf(result[i]);
            indices.push([repZip[index], result.indices[i]]);
          }
          node.textContent = replaceAt(text, ...indices);
        } else {
          node.textContent = text.replace(regex, replace[1]);
        }
        console.log(
          `${text.trim()} (${replace[0]} -> ${result[0]})\n-----\n${node.textContent.trim()}`
        );
        text = node.textContent;
        regex.lastIndex = 0;
      }
    }
    if (replaceJson["repDomain"].includes(domain)) {
      for (let replace of replaceJson["ilbeReplace"]) {
        regex = regexMap[replace[0]];
        if ((result = regex.exec(text))) {
          if (result[1] && replaceJson["replaceExcept"].some((rep) => result[1].endsWith(rep)))
            continue;
          node.textContent = text.replace(regex, replace[1]);
          console.log(`${text.trim()} (${result[0]})\n-----\n${node.textContent.trim()}`);
          text = node.textContent;
          regex.lastIndex = 0;
        }
      }
    }
  }
  if (domain == "dcinside.com") {
    document.querySelectorAll(".written_dccon").forEach((con) => {
      let check = con
        .getAttributeNames()
        .map((attr) => con.getAttribute(attr))
        .filter((a) => a != "");
      if (check.some((c) => replaceJson["ilbeCon"].includes(c))) {
        con.parentNode.remove();
        // console.log(con.getAttributeNames());
      }
    });
  }
}

function replaceAt(str, ...indices) {
  indices = indices.sort((a, b) => (a[1][0] > b[1][0] ? 1 : -1));
  let result = [];
  result.push(str.slice(0, indices[0][1][0]));
  for (let i = 0; i < indices.length; i++) {
    result.push(indices[i][0]);
    if (i < indices.length - 1) {
      result.push(str.slice(indices[i][1][1], indices[i + 1][1][0]));
    }
  }
  result.push(str.slice(indices[indices.length - 1][1][1], str.length));
  return result.join("");
}

function main() {
  switch (domain) {
    case "bbs.ruliweb.com":
      ruliweb();
      break;
    case "www.dogdrip.net":
      dogdrip();
      break;
    case "namu.wiki":
      namu();
      break;
    case "dcinside.com":
      dcinside();
      break;
    case "novelpia.com":
      document.querySelectorAll("script").forEach((script) => {
        script.remove();
      });
      // saveAs(URL.createObjectURL(new Blob([document.documentElement.outerHTML], {type: "text/html"})),"save.html");
      break;
    case "dood.sh":
      window.open = null;
      HTMLElement.prototype.click = null;
      HTMLAnchorElement.prototype.click = null;
      break;
  }
}

function ruliweb() {
  shortcut["f"] = { url: "/best" };
  shortcut["g"] = { url: "/best/political" };
  head = '<span style="color:red; font-weight:bold;">';
  tail = "</span>";

  if (new URLPattern({ pathname: "*/read/*" }).test(url)) {
    let imgBtn = document.querySelector("button.btn_comment_img");
    if (imgBtn && imgBtn.getAttribute("data-active") == "1") {
      imgBtn.click();
    }
  } else {
    addNum(0, 0, "main");
    shortcut["z"] = () => addNum(0, 0, "top");
    shortcut["x"] = () => addNum(0, 0, "main");
  }

  let page = parseInt(url.searchParams.get("page")) || 1;

  let navURL = new URL(url);
  navURL.searchParams.set("page", page > 1 ? page - 1 : 1);
  shortcut["a"] = { url: navURL.href };

  navURL = new URL(url);
  navURL.searchParams.set("page", page + 1);
  shortcut["s"] = { url: navURL.href };

  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.url !== location.href || req.cmd !== "myExt" || req.id !== "ruliweb") return;

    let link = contextMenuElement.closest("div.text_wrapper")?.querySelector("a").href;
    if (link) {
      getNameCode(link).then(([writer, code]) => {
        console.log([writer, code]);
        if (writer && code) {
          let idx = banList.user.findIndex((user) => user.code == code);
          console.log(banList);
          if ((memo = prompt([writer, code]))) {
            if (idx > -1) {
              console.log([banList.user[idx].name, writer, code]);
              banList.user[idx].name.unshift(writer);
            } else {
              banList.user.push({
                name: [writer],
                code,
                memo: memo.trim(),
              });
            }
            banList.user.sort((a, b) => (a.name[0] > b.name[0] ? 1 : -1));
            chrome.storage.local.set({ banList: banList }, () => {
              console.log(banList);
              window.location.reload();
            });
          }
        }
      });
    }
  });
  // for (let i=0; i<trs.length; i++) {
  //     appendTooltip(trs[i].querySelector("td.subject > a"), i);
  // }
}

function dogdrip() {
  shortcut["f"] = { url: "/" };
  shortcut["a"] = { url: "/computer" };
  shortcut["s"] = { url: "/movie" };

  if (url.pathname == "/") {
    let main = [
      ...document.querySelectorAll(
        "div.eq.section.secontent.background-color-content > div.xe-widget-wrapper"
      ),
    ];
    main[0].hidden = true;
    main[8].hidden = true;
    main.at(-1).hidden = true;

    let boardList = [...document.querySelectorAll("div.eq.overflow-hidden")].slice(2);
    let boardMap = Object.fromEntries(
      boardList.map((board) => [board.querySelector("a").textContent.trim(), board])
    );

    chrome.storage.sync.get(["userBoardList", "etc"], (data) => {
      if (data.etc.isBoard) {
        boardList
          .map((board) => board.parentNode)
          .forEach((parent, i) => {
            let board = parent.querySelector("div.eq.overflow-hidden");
            if (i < data.userBoardList.length) {
              swap(board, boardMap[data.userBoardList[i]]);
            } else {
              board.remove();
            }
          });
      }

      const capicity = 30;
      addNum((startNum = 0), capicity);
      shortcut["z"] = () => addNum((startNum = Math.max(startNum - capicity, 0)), capicity);
      shortcut["x"] = () =>
        addNum((startNum = Math.min(startNum + capicity, capicity * 3)), capicity);
    });
  } else if (!new URLPattern({ pathname: "/(\\d+)" }).test(url)) {
    document.querySelectorAll("tbody tr:not(.notice)")?.forEach((tr, i) => {
      let a = tr.querySelector("td.title a.ed");
      a.target = "_blank";
      let small = tr.querySelector("td.no");
      if (i < 20) {
        small.textContent += `[${i + 1}] `;
        shortcut[i] = a.href;
      } else {
        small.textContent += `[${numMap[i].toUpperCase()}] `;
        shortcut[numMap[i]] = { url: a.href, target: "_blank" };
      }
    });
  }
  // for (let li of document.querySelector("ul.eq.widget.widget-normal").querySelectorAll("li")) {
  //     appendTooltip(li.querySelector("a"));
  // }
}

function namu() {
  url = new URL(document.URL);
  let xpath = "//h5[text() = '최근 변경']/..";
  // let div = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  document.querySelectorAll("aside > div").forEach((div) => {
    if (
      ((div.querySelector("h5") && div.querySelector("h5").textContent != "최근 변경") ||
        !div.querySelector("h5")) &&
      !div.hidden
    ) {
      div.hidden = true;
    }
  });

  if (url.pathname.startsWith("/history")) {
    xpath = "//a[text() = '비교']/../../..";
    let ul = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    ul?.querySelectorAll("li").forEach((li) => {
      let id = li.querySelector("div");
      let a = id.querySelector("a");
      a.target = "_blank";
      if (["180.224.237.249", "49.171.158.105"].includes(id.textContent.trim())) {
        a.style["text-decoration"] = "line-through";
        li.querySelectorAll(":scope > span")[2].textContent = "";
      }
    });
  } else if (url.pathname == "/member/starred_documents") {
    xpath = "//li[contains(text(), '수정시각')]/..";
    let ul = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    ul?.querySelectorAll("li > a").forEach((a) => {
      a.href = a.href.replace("/w/", "/history/");
      a.target = "_blank";
    });
  } else if (url.pathname.startsWith("/edit")) {
    let check = document.querySelector("input[type='checkbox']");
    if (!check?.checked) {
      check?.click();
    }
  } else {
    // xpath = "//a[text() = '편집']/..";
    // if (result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
    //     result = [...result.querySelectorAll("a")].slice(1);
    //     for (let a of result) {
    //         a.target = "_blank";
    //     }
    // }
  }
}

function dcinside() {
  let page = parseInt(url.searchParams.get("page")) || 1;
  let gall = url.searchParams.get("id");
  let mode = new URLPattern({ pathname: "*/board/:mode{/}?" }).exec(url).pathname.groups["mode"];

  ["a", "s", "f", "g", "w", "e", "delete"].forEach((key) => {
    let navURL = new URL(url);
    switch (key) {
      case "a":
        navURL.searchParams.set("page", page > 1 ? page - 1 : 1);
        break;
      case "s":
        navURL.searchParams.set("page", page + 1);
        break;
      case "f":
        navURL.pathname = navURL.pathname.replace(mode, "lists");
        navURL.search = `?${new URLSearchParams({ id: gall })}`;
        break;
      case "g":
        navURL.pathname = navURL.pathname.replace(mode, "lists");
        navURL.search = `?${new URLSearchParams({ id: gall, exception_mode: "recommend" })}`;
        break;
      case "w":
        navURL.pathname = navURL.pathname.replace(mode, "write");
        break;
      case "e":
        if (["view", "delete"].includes(mode)) {
          navURL.pathname = navURL.pathname.replace(mode, "modify");
        }
        break;
      case "delete":
        if (["view", "modify"].includes(mode)) {
          navURL.pathname = navURL.pathname.replace(mode, "delete");
        }
        break;
    }
    // if (url.href != navURL.href) {
    shortcut[key] = { url: navURL.href };
    // }
  });
  shortcut["c"] = () => {
    document.querySelector(".cmt_textarea_label")?.click();
  };
  shortcut["d"] = () => {
    document.querySelector(".btn_cmt_refresh")?.click();
    document.querySelectorAll(".dory")?.forEach((dory) => {
      dory.remove();
    });
  };
  shortcut["q"] = () => {
    window.scrollTo(0, 0);
  };

  const capicity = 20;
  addNum((startNum = 0), capicity);
  shortcut["z"] = () => addNum((startNum = Math.max(startNum - capicity, 0)), capicity);
  shortcut["x"] = () => addNum((startNum = Math.min(startNum + capicity, capicity * 2)), capicity);

  if (document.querySelector(".gall_list")) {
    document.querySelector(".gall_list col").style.width = "6.2em";
  }
  if (document.querySelector(".crt_icon")) {
    document.querySelector(".crt_icon").style.display = "inline-block";
  }
  document.querySelectorAll(".dory").forEach((dory) => {
    dory.remove();
  });
}

function addNum(start, capicity, select) {
  switch (domain) {
    case "dcinside.com":
      let i = 0;
      document.querySelectorAll(".gall_list tbody tr").forEach((tr) => {
        let subject = tr.querySelector("td.gall_subject");
        let a = tr.querySelector("td.gall_tit > a");
        tr.querySelector("span.mySmall")?.remove();

        a.target = "_blank";
        if ((a2 = a.nextElementSibling)) {
          a2.target = "_blank";
        }

        bold = subject?.querySelector("b");
        if (!isNaN(tr.querySelector("td").textContent) && !bold) {
          if (start <= i && i < start + capicity) {
            // tr.querySelector("td").textContent += ` [${i+1}]`;
            let small = document.createElement("span");
            small.className = "mySmall";
            small.textContent = ` [${i - start + 1}]`;
            tr.querySelector("td").append(small);
            shortcut[i - start] = a.href;
          }
          i += 1;
        }
      });
      break;
    case "www.dogdrip.net":
      document.querySelectorAll("ul.eq.widget.widget-normal > li").forEach((li, i) => {
        li.querySelector("span.mySmall")?.remove();
        let a = li.querySelector("a");
        a.target = "_blank";

        if (start <= i && i < start + capicity) {
          let small = document.createElement("span");
          small.className = "mySmall";
          small.style.fontSize = "small";
          small.style.color = "#fff";
          li.querySelector("div.eq.width-expand").prepend(small);

          if (i - start < 20) {
            small.textContent = `[${i - start + 1}] `;
            shortcut[i - start] = a.href;
          } else {
            small.textContent = `[${numMap[i - start].toUpperCase()}] `;
            shortcut[numMap[i - start]] = { url: a.href, target: "_blank" };
          }
        }
      });
      break;
    case "bbs.ruliweb.com":
      chrome.storage.local.get(["banList", "cache", "etc"], async (data) => {
        banList = data.banList;
        cache = data.cache;
        syncData = await new Promise((resolve) => {
          chrome.storage.sync.get("etc", resolve);
        });
        etc = syncData.etc;
        let banCodes = banList.user.map((user) => user.code);
        let banWords = banList.word;

        let i = 0;
        for (let tr of document.querySelectorAll("tr.table_body:not([hidden])")) {
          let writer = tr.querySelector("a.nick").textContent.trim();
          let title = tr.querySelector("a.title_wrapper");
          let dislike_value = "";

          tr.querySelector("div.thumbnail_wrapper > a").target = "_blank";
          title.target = "_blank";

          if (
            banWords.some(
              (word) => title.textContent.trim().toLowerCase().match(new RegExp(word)) != null
            )
          ) {
            tr.hidden = true;
            console.log(title, title.firstChild.textContent.trim() + "\n" + writer.slice(0, 2));
            // title.innerHTML+=`${head}←(병신)${tail}`;
          }

          if ((result = cache.main.find((main) => main.link == title.href.split("?")[0]))) {
            let [writer, code] = result.info;
            dislike_value = result.dislike;

            if (banCodes.includes(code)) {
              hide(tr, writer, code, "main");
            }
          } else if (
            (result = banList.user.find(
              (user) => user.name.includes(writer) && banCodes.includes(user.code)
            ))
          ) {
            hide(tr, writer, result.code, "main");
          } else {
            // console.log("FETCH", tr);
            if (etc.isFetch) {
              await sleep(randomInt(1450, 1600));
              let [writer, code, dislike] = await getNameCode(title.href);
              dislike_value = dislike;

              if (banCodes.includes(code)) {
                hide(tr, writer, code, "main");
              }
              cache.main.unshift({
                link: title.href.split("?")[0],
                info: [writer, code],
                title: title.textContent.trim(),
                dislike: dislike,
              });
              cache.main.pop();
              chrome.storage.local.set({ cache: cache }, () => {});
            }
          }

          if (tr.hidden) continue;

          let a = tr.querySelector("div.text_wrapper a");
          a.querySelector("span.mySmall")?.remove();
          if (select == "main") {
            let small = document.createElement("span");
            small.className = "mySmall";
            small.style.fontSize = "small";
            if (i < 20) {
              small.textContent = `[${i + 1}] `;
              shortcut[i] = a.href;
            } else {
              small.textContent = `[${numMap[i].toUpperCase()}] `;
              shortcut[numMap[i]] = { url: a.href, target: "_blank" };
            }
            small.style.fontSize = "small";
            a.prepend(small);
            i += 1;

            if (tr.querySelector(".dislike")) continue;

            let recomd = tr.querySelector("span.recomd");
            let dislike = recomd.cloneNode(true);
            dislike.className = "dislike";
            dislike.firstChild.textContent = " 반대 ";
            dislike.querySelector("strong").textContent = dislike_value;
            dislike.querySelector("strong").style.color = dislike_value >= 5 ? "red" : "";
            recomd.after(dislike);
          }
        }

        let best = document.querySelector("div.list.best_date.active");
        if (best) {
          i = 0;
          for (let item of best.querySelectorAll("a.deco")) {
            if (item.textContent == "()") continue;

            item.target = "_blank";
            if ((result = cache.top.find((top) => top.link == item.href))) {
              let [writer, code] = result.info;
              if (banCodes.includes(code)) {
                hide(item, writer, code, "top");
              }
            } else {
              // console.log("FETCH", tr);
              //getNameCode(item.href, item)//item을 넘기지 않으면 의도한 item과 프라미스가 실행될 시점의 item이 일치하지 않음 (스코프 문제)
              if (etc.isFetch) {
                await sleep(randomInt(3500, 4500));
                let [writer, code] = await getNameCode(item.href);
                if (banCodes.includes(code)) {
                  hide(item, writer, code, "top");
                }
                cache.top.unshift({
                  link: item.href,
                  info: [writer, code],
                  title: item.textContent.trim(),
                });
                cache.top.pop();
                chrome.storage.local.set({ cache: cache }, () => {});
              }
            }

            if (item.textContent == "()") continue;

            item.querySelector("span.mySmall")?.remove();
            item.textContent = item.textContent.replace(/^\d+\. /, "");
            if (select == "top") {
              let small = document.createElement("span");
              small.className = "mySmall";
              small.style.fontSize = "small";
              if (i < 20) {
                small.textContent = `[${i + 1}] `;
                shortcut[i] = item.href;
              } else {
                small.textContent = `[${numMap[i].toUpperCase()}] `;
                shortcut[numMap[i]] = { url: item.href, target: "_blank" };
              }
              item.prepend(small);
            }
            i += 1;
          }
        }
      });
      break;
  }
}

function hide(elem, writer, code, board) {
  if (board == "main") {
    elem.hidden = true;
    let a = elem.querySelector("a.title_wrapper");
    console.log(a, a.firstChild.textContent.trim() + "\n" + writer);
  } else if (board == "top") {
    elem.innerHTML = `${head}()${tail}`;
    console.log(elem, writer);
  }

  let user = banList.user.find((user) => user.code == code);
  if (!user.name.includes(writer)) {
    user.name.unshift(writer);
    chrome.storage.local.set({ banList: banList }, () => {});
  }
}

function getNameCode(link, option) {
  return fetch(link)
    .then((response) => response.text())
    .then((content) => {
      let doc = new DOMParser().parseFromString(content, "text/html");
      try {
        let writer = doc.querySelector("strong.nick").textContent.trim();
        let code = doc.querySelector("#member_srl").value;
        let dislike = doc.querySelector(".dislike_value").textContent.trim();
        if (option) {
          return [writer, code, dislike, option];
        } else {
          return [writer, code, dislike];
        }
      } catch (error) {
        return null;
      }
    });
}

function getMain(link) {
  return fetch(link)
    .then((response) => response.text())
    .then((content) => {
      let doc = new DOMParser().parseFromString(content, "text/html");
      let article, comment;
      if (domain == "bbs.ruliweb.com") {
        article = doc.querySelector("div.board_main_view");
        comment = doc.querySelector(".comment_view.best");
      } else if (domain == "www.dogdrip.net") {
        article = doc.querySelector("div#article_1");
        comment = doc.querySelector(".comment-list");
      }
      return [article, comment];
    });
}

function replaceDebug(element) {
  walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  while ((node = walk.nextNode())) {
    if (node.textContent.trim()) {
      console.log(text);
      node.textContent = text.replace(/노/g, "냐");
    }
  }
}

function appendTooltip(item, count) {
  if (item.className) {
    item.className += " myTooltip";
  } else {
    item.className = "myTooltip";
  }
  let tooltip = document.createElement("div");
  tooltip.style.marginTop = `${-400 + -20 * count}px`;
  item.append(tooltip);
  getMain(item.href).then(([article, comment]) => {
    tooltip.append(article, comment);
  });
}

function saveAs(uri, filename) {
  let link = document.createElement("a");
  if (typeof link.download === "string") {
    document.body.append(link); // Firefox requires the link to be in the body
    link.download = filename;
    link.href = uri;
    link.click();
    link.remove(); // remove the link when done
  } else {
    location.replace(uri);
  }
}

function swap(srcNode, destNode) {
  let [next, parent] = [srcNode.nextSibling, srcNode.parentNode];
  destNode.replaceWith(srcNode);
  if (next) {
    next.before(destNode);
  } else {
    parent.append(destNode);
  }
}

function randomInt(minInclude, maxExclude) {
  return Math.floor(Math.random() * (maxExclude - minInclude)) + minInclude;
}

// a = document.querySelector("#container > h1 > yt-formatted-string");
// a.draggable = true;
// a.style.position = "fixed";

// document.addEventListener("dragover", (e) => {
//   a.style.left = `${e.pageX}px`;
//   a.style.top = `${e.pageY}px`;
// });
// a.addEventListener("dragstart", (e) => console.log(e.type));
// a.addEventListener("dragend", (e) => console.log(e.type, x, y));
// a.addEventListener("dragleave", (e) => console.log(e.type));
// a.addEventListener("dragexit", (e) => console.log(e.type));
