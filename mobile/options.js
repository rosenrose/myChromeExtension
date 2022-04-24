fetch("https://gist.github.com/rosenrose/20537c90ffbdcae3e3b44eaffbf44b1e")
  .then((response) => response.text())
  .then((content) => {
    let doc = new DOMParser().parseFromString(content, "text/html");
    let list = [...doc.querySelectorAll("tr > td:nth-child(2)")]
      .map((i) => i.textContent)
      .join("\n");

    chrome.storage.local.set({ replace: JSON.parse(list) }, () => {
      document.querySelector("#replace").textContent = list;
    });
  });

fetch("https://raw.githubusercontent.com/rosenrose/myChromeExtension/master/backup.json")
  .then((response) => response.json())
  .then((json) => {
    let banUser = json[0].user;
    let banNames = banUser.flatMap((user) => user.name);

    chrome.storage.local.set({ banNames: banNames }, () => {
      document.querySelector("#banUsers").textContent = JSON.stringify(banUser, null, 2);
    });
  });

const banWordsUl = document.querySelector("#banWords");
let banWords = [];
chrome.storage.local.get("banWords", (data) => {
  data.banWords?.forEach(addWord);
});
banWordsUl.addEventListener("change", (event) => {
  const li = event.target.closest("li");
  const newWord = event.target.value;
  const index = banWords.findIndex((word) => word === li.dataset.word);
  banWords[index] = newWord;
  save();
  li.dataset.word = newWord;
});
banWordsUl.addEventListener("click", (event) => {
  if (event.target.matches?.("button")) {
    const li = event.target.closest("li");
    banWords = banWords.filter((word) => word !== li.dataset.word);
    save();
    li.remove();
  }
});

const addBanWord = document.querySelector("form");
addBanWord.addEventListener("submit", (event) => {
  event.preventDefault();
  const word = event.target.querySelector("input").value.trim();
  banWords.push(word);
  save();
  addWord(word);
});

function addWord(word) {
  const template = document.querySelector("#banWordTemplate").content.cloneNode(true);
  const li = template.firstElementChild;
  li.dataset.word = word;
  template.querySelector("input").value = word;
  banWordsUl.append(li);
}
function save() {
  chrome.storage.local.set({ banWords: banWords.sort() }, () => {});
}
