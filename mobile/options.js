fetch("https://gist.github.com/rosenrose/20537c90ffbdcae3e3b44eaffbf44b1e")
.then(response => response.text())
.then(content => {
    let doc = new DOMParser().parseFromString(content, "text/html");
    let list = [...doc.querySelectorAll("tr > td:nth-child(2)")].map(i=>i.textContent).join("\n");
    chrome.storage.local.set({"replace": JSON.parse(list)}, () => {
        chrome.storage.local.get("replace", data => {
            document.querySelector("pre").textContent = list;
        })
    })
});