domain = document.domain;
chrome.storage.local.get("replace", data => {
    replaceJson = data.replace;
    let ilbe = replaceJson["ilbe"].join("|");
    for (let i=0; i<2; i++) {
        replaceJson["ilbeReplace"][i][0] = replaceJson["ilbeReplace"][i][0].replace("${ilbe}",ilbe).replace("${endSuffix}",replaceJson["endSuffix"]);
    }

    observer = new MutationObserver((mutationList, observer) => {
        mutationList.forEach(mutation => {
            if (mutation.type == "childList") {
                if (!replaceJson["domainExcept"].includes(domain)) {
                    replace(mutation.target);
                }
            }
        });
    });
    observer.observe(document.body, {childList: true, subtree: true, attributes: false});

    if (!replaceJson["domainExcept"].includes(domain)) {
        replace(document.head);
        replace(document.body);
    }
});

function replace(root) {
    walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while(node = walk.nextNode()) {
        if (replaceJson["tagExcept"].includes(node.parentNode.tagName)) continue;
        if (node.textContent.trim()) {
            text = node.textContent;
            for (let end of replaceJson["ends"]) {
                regex = new RegExp(`${end[0]}(${replaceJson["endSuffix"]}*)$`, "g")
                if (regex.exec(text)) {
                    node.textContent = text.replace(regex, end[1]);
                    text = node.textContent;
                }
            }
            for (let replace of replaceJson["replaceList"]) {
                regex = new RegExp(replace[0], "g");
                if (regex.exec(text)) {
                    node.textContent = text.replace(regex, replace[1]);
                    text = node.textContent;
                }
            }
            if (replaceJson["repDomain"].includes(domain)) {
                for (let replace of replaceJson["ilbeReplace"]) {
                    regex = new RegExp(replace[0], "g");
                    if (result = regex.exec(text)) {
                        if (result[1] && result[2] && replaceJson["replaceExcept"].some(rep => (result[1]+result[2]).endsWith(rep))) continue;
                        node.textContent = text.replace(regex, replace[1]);
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
        document.querySelectorAll("li.comment:not([id])").forEach(dory => {dory.style.display = "none";});
    }
}
// document.body.innerHTML = replaces[0];