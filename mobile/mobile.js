domain = document.domain;
jamoRegex = /(?<=\{).+?(?=\})/;
zipRegex = /(?<=\()(?<![?!=<]+)[^?!=<]+?(?=\))/g;
debug = false;

if (debug) {
  console = document.createElement("textarea");
  console.style.width = "100%";
  console.style.height = "20vh";
  document.body.append(console);
}
function writeLog(msg) {
  console.value += `${msg}\n`;
}

chrome.storage.local.get("replace", (data) => {
  replaceJson = data.replace;

  replaceJson["ilbeReplace"].forEach((ilbe) => {
    ilbe[0] = new RegExp(
      ilbe[0].includes("${")
        ? ilbe[0]
            .replace("${ilbe}", replaceJson["ilbe"])
            .replace("${endSuffix}", replaceJson["endSuffix"])
        : ilbe[0],
      "g"
    );
  });

  replaceJson["regexList"].forEach((regex) => {
    if (regex[1].match(zipRegex)) {
      regex.push(regex[0]);
    }

    regex[0] = new RegExp(regex[0], "g");
  });

  replaceJson["ends"].forEach((end) => {
    end[0] = new RegExp(`${end[0]}(?=${replaceJson["endSuffix"]}*$)`, "g");
  });

  Object.values(replaceJson["domainSpecific"]).forEach((value) => {
    value.forEach((replace) => {
      replace[0] = new RegExp(replace[0], "g");
    });
  });

  replaceJson["tagExcept"] = new Set(replaceJson["tagExcept"]);
  replaceJson["repDomain"] = new Set(replaceJson["repDomain"]);

  observer = new MutationObserver(observeCallback);
  observer.observe(document.body, { childList: true, subtree: true, attributes: false });
  try {
    document.querySelectorAll("iframe").forEach((iframe) => {
      let observer = new MutationObserver(observeCallback);
      observer.observe(iframe.contentDocument.body, {
        childList: true,
        subtree: true,
        attributes: false,
      });
    });
  } catch (error) {
    // console.log("iframe: "+error);
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
});

if (domain == "m.ruliweb.com") {
  chrome.storage.local.get(["banNames", "banWords"], (data) => {
    document.querySelectorAll("table.board_list_table tbody > tr").forEach((tr) => {
      let writer = tr.querySelector(".subject .info .writer");
      if (data.banNames.includes(writer?.textContent.trim())) {
        // writer.style.color = "red";
        writer.style.textDecoration = "line-through";
      }

      let title = tr.querySelector(".subject .title");
      let board = tr.querySelector(".subject .board_name");
      if (
        data.banWords.some(
          (word) => title?.textContent.includes(word) || board?.textContent.includes(word)
        )
      ) {
        tr.style.display = "none";
      }
    });
  });
}

function observeCallback(mutationList) {
  mutationList.forEach((mutation) => {
    if (mutation.type == "childList") {
      try {
        if (mutation.target.matches?.("iframe")) {
          let observer = new MutationObserver(observeCallback);
          observer.observe(iframe.contentDocument.body, {
            childList: true,
            subtree: true,
            attributes: false,
          });
        }
      } catch (error) {
        // console.log("iframe: " + error);
      }

      if (!replaceJson["domainExcept"].includes(domain)) {
        textReplace(mutation.target);
      }
      if (domain == "dcinside.com") {
        document.querySelectorAll(".written_dccon").forEach((con) => {
          let check = con
            .getAttributeNames()
            .map((attr) => con.getAttribute(attr))
            .filter((a) => a != "");
          if (check.some((c) => replaceJson["ilbeCon"].includes(c))) {
            con.remove();
          }
        });
        document.querySelectorAll("li.comment:not([id])").forEach((dory) => {
          dory.style.display = "none";
        });
      }
    }
  });
}

function textReplace(element) {
  if (!element?.nodeType || element.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  while ((node = walk.nextNode())) {
    text = node.textContent;

    if (!/[가-힣]/.test(text)) {
      continue;
    }
    if (replaceJson["tagExcept"].has(node.parentNode.tagName)) {
      continue;
    }

    for (let [regex, sub] of replaceJson["ends"]) {
      if (regex.exec(text)) {
        node.textContent = text.replace(regex, sub);
        // writeLog(`${text}\n-----\n${node.textContent}`);
        text = node.textContent;
      }
    }
    // writeLog(text);
    for (let [word, sub] of replaceJson["wordList"]) {
      if (text.includes(word)) {
        node.textContent = text.replaceAll(word, sub);
        text = node.textContent;
      }
    }

    for (let [regex, sub, original] of replaceJson["regexList"]) {
      if ((result = regex.exec(text))) {
        if ((jamo = jamoRegex.exec(sub))) {
          let [rep, start, end, repStart, repEnd] = jamo[0].split(",");
          let nfd = result[0].normalize("NFD");
          let newNFD = repStart
            ? nfd.slice(0, start) + rep.normalize("NFD").slice(repStart, repEnd) + nfd.slice(end)
            : nfd.slice(0, start) + rep.normalize("NFD") + nfd.slice(end);

          node.textContent = text.replace(regex, newNFD.normalize());
        } else if ((repZips = sub.match(zipRegex))) {
          let orgZips = original.match(zipRegex);
          let replaceText = [];

          for (let i = 1; i < result.length; i++) {
            let orgZip = orgZips[i - 1].split("|");
            let repZip = repZips[i - 1].split("|");
            let index = orgZip.indexOf(result[i]);
            replaceText.push(repZip[index]);
          }

          let rest = sub.slice(sub.lastIndexOf(")") + 1);
          node.textContent = text.replace(regex, replaceText.join("") + rest);
        } else {
          node.textContent = text.replace(regex, sub);
        }
        // writeLog(`${text} (${regex} -> ${result[0]})\n-----\n${node.textContent}`);
        text = node.textContent;
      }
    }

    if (replaceJson["repDomain"].has(domain)) {
      for (let [regex, sub] of replaceJson["ilbeReplace"]) {
        if ((result = regex.exec(text))) {
          if (result[1] && replaceJson["replaceExcept"].some((rep) => result[1].endsWith(rep))) {
            continue;
          }

          node.textContent = text.replace(regex, sub);
          text = node.textContent;
        }
      }
    }

    if (domain in replaceJson["domainSpecific"]) {
      for (let [regex, sub] of replaceJson["domainSpecific"][domain]) {
        if ((result = regex.exec(text))) {
          node.textContent = text.replace(regex, sub);
          text = node.textContent;
        }
      }
    }
  }
}

// regex = new RegExp("A", "gd");
// document.body.innerHTML = "aa";
