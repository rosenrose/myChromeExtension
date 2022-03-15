banList = {};
boardList = [];
userBoardList = [];
etc = {};

chrome.storage.local.get((localData) => {
  chrome.storage.sync.get((syncData) => {
    console.log(localData, syncData);

    etc = syncData.etc;
    document.querySelectorAll("#etc input").forEach((input) => {
      input.checked = etc[input.value];
    });
  });
  // let textarea = document.querySelector("textarea");
  // textarea.style.height = "7200vh";
  // textarea.value = JSON.stringify(data, null, 2);
});

chrome.storage.local.get("banList", (data) => {
  banList = data.banList;
  let userList = document.querySelector("#userList ol");
  banList.user.forEach((user) => {
    appendUser(userList, user);
  });

  let wordList = document.querySelector("#wordList ul");
  banList.word.forEach((word) => {
    appendWord(wordList, word);
  });
});

fetch("https://gist.github.com/rosenrose/20537c90ffbdcae3e3b44eaffbf44b1e")
  .then((response) => response.text())
  .then((content) => {
    let doc = new DOMParser().parseFromString(content, "text/html");
    let list = JSON.parse([...doc.querySelectorAll("tr > td:nth-child(2)")].map((i) => i.textContent).join("\n"));
    chrome.storage.local.set({ replace: list }, () => {});
    // document.querySelector("pre").textContent = doc
    //   .querySelector("tbody")
    //   .textContent.trim()
    //   .replace(/\n(\s)\s+/g, "\n$1");
  });
recoverCache();

// ruliweb code

function appendUser(userList, user) {
  let template = document.querySelector("#userTemplate").content.cloneNode(true);
  let li = template.firstElementChild;
  let nick = template.querySelector(".name");

  li.dataset.code = user.code;
  user.name.forEach((name) => {
    let p = document.createElement("p");
    p.textContent = name;
    nick.append(p);
  });
  template.querySelector(".code").textContent = user.code;
  template.querySelector(".memo").value = user?.memo || "";
  template.querySelector(".memo").addEventListener("change", (event) => {
    let code = event.target.closest("li").dataset.code;
    let idx = banList.user.findIndex((user) => user.code == code);
    banList.user[idx].memo = event.target.value.trim();
    save();
  });
  template.querySelector("button").addEventListener("click", (event) => {
    let li = event.target.closest("li");
    let code = li.dataset.code;
    let idx = banList.user.findIndex((user) => user.code == code);
    if (idx > -1) banList.user.splice(idx, 1);
    li.remove();
    save();
  });
  userList.append(li);
}

function appendWord(wordList, word) {
  let template = document.querySelector("#wordTemplate").content.cloneNode(true);

  template.querySelector("span").textContent = word;
  template.querySelector("button").addEventListener("click", (event) => {
    let li = event.target.closest("li");
    let word = li.querySelector(".name").textContent;
    let idx = banList.word.indexOf(word);
    if (idx > -1) banList.word.splice(idx, 1);
    li.remove();
    save();
  });
  wordList.append(template.firstElementChild);
}

document.querySelector("#addUser").addEventListener("click", () => {
  let name = document.querySelector("#addNameInput").value.trim();
  let code = document.querySelector("#addCodeInput").value.trim();
  let memo = document.querySelector("#addMemoInput").value.trim();
  let idx = banList.user.findIndex((user) => user.code == code);

  if (idx > -1) {
    banList.user[idx].name.unshift(name);
    if (memo.length) {
      banList.user[idx].memo = memo;
    }

    let p = document.createElement("p");
    p.textContent = name;
    [...document.querySelectorAll("#userList li")]
      .find((li) => li.dataset.code == code)
      .querySelector(".name")
      .prepend(p);
  } else {
    let user = { name: [name], code: code };
    if (memo.length) {
      user.memo = memo;
    }

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
  index = 0;
  updateUser();
});

function updateUser() {
  console.log(index);
  setTimeout(() => {
    fetch(`https://mypi.ruliweb.com/mypi.htm?nid=${banList.user[index].code}`)
      .then((response) => response.text())
      .then((content) => {
        let doc = new DOMParser().parseFromString(content, "text/html");
        let nick = doc.querySelector("h2.txt");

        if (nick) {
          nick = nick.textContent.split(" MYPI")[0].trim();

          if (!banList.user[index].name.includes(nick)) {
            console.log(banList.user[index], nick);
            banList.user[index].name.unshift(nick);
            save();
          }

          if (index < banList.user.length - 1) {
            index += 1;
            updateUser();
          }
        } else {
          fetch(
            `https://bbs.ruliweb.com/best/board/300143?search_type=member_srl&search_key=${banList.user[index].code}`
          )
            .then((response) => response.text())
            .then((content) => {
              let doc = new DOMParser().parseFromString(content, "text/html");
              let tr = doc.querySelector(".table_body:not(.notice):not(.best):not(.list_inner)");
              // let writer = tr.querySelector("td.writer");
              let writer = tr.querySelector("a.nick");

              if (writer) {
                writer = writer.textContent.trim();

                if (!banList.user[index].name.includes(writer)) {
                  console.log(banList.user[index], writer);
                  banList.user[index].name.unshift(writer);
                  save();
                }
              } else {
                console.log(banList.user[index], "del");
              }

              if (index < banList.user.length - 1) {
                index += 1;
                updateUser();
              }
            });
        }
      });
  }, 1000);
}

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

// dogdrip code

let dragged;
const darkBlue = "rgb(46, 67, 97)";
const lightBlue = "rgb(56, 138, 255)";

fetch("https://www.dogdrip.net/")
  .then((response) => response.text())
  .then((content) => {
    content = new DOMParser().parseFromString(content, "text/html");
    boardList = content.querySelectorAll("div.eq.overflow-hidden");
    boardList = [...boardList].map((board) => board.querySelector("a.eq.link").textContent.trim());
    let orig = document.querySelector("#original");

    boardList.forEach((board, i) => {
      if (i < 2) {
        let origDiv = document.createElement("div");
        origDiv.textContent = board;
        orig.append(origDiv);
      } else {
        let template = document.querySelector("#checkboxTemplate").content.cloneNode(true);
        let input = template.querySelector("input");

        input.value = board;
        input.nextSibling.textContent = board;
        input.addEventListener("change", (event) => {
          if (event.target.checked) {
            userBoardList.push(event.target.value);
          } else {
            let idx = userBoardList.indexOf(event.target.value);
            if (idx > -1) userBoardList.splice(idx, 1);
          }
          save();
          updateTable();
        });
        orig.append(template.firstElementChild);
      }
    });

    chrome.storage.sync.get("userBoardList", (data) => {
      if (data.userBoardList == undefined) {
        userBoardList = boardList.slice(2);
      } else {
        userBoardList = data.userBoardList.slice();
        if (boardList.length > 0) {
          userBoardList = userBoardList.filter((userBoard) => boardList.includes(userBoard));
        }
      }
      save();
      updateTable();

      let user = document.querySelector("#user");

      user.addEventListener("dragstart", (event) => {
        if (event.target.draggable) {
          dragged = event.target;
          event.target.style.opacity = 0.5;
        }
      });
      user.addEventListener("dragend", (event) => {
        event.target.style.opacity = 1;
        dragged = null;
      });
      user.addEventListener("dragover", (event) => {
        event.preventDefault();
      });
      user.addEventListener("dragenter", (event) => {
        if (dragged && event.target.draggable) {
          event.target.style.backgroundColor = lightBlue;
        }
      });
      user.addEventListener("dragleave", (event) => {
        if (dragged && event.target.draggable) {
          event.target.style.backgroundColor = darkBlue;
        }
      });
      user.addEventListener("drop", (event) => {
        event.preventDefault();
        if (dragged && event.target.draggable) {
          event.target.style.backgroundColor = darkBlue;

          if (dragged != event.target) {
            let draggedText = dragged.textContent;
            let targetText = event.target.textContent;

            userBoardList = userBoardList.filter((board) => board != draggedText);
            let index = userBoardList.indexOf(targetText);

            if (index < userBoardList.length - 1) {
              userBoardList.splice(index, 0, draggedText);
            } else {
              userBoardList.push(draggedText);
            }

            save();
            updateTable();
          }
        }
      });
    });
  });

function updateTable() {
  document.querySelectorAll("#dogdrip input").forEach((checkbox) => {
    checkbox.checked = userBoardList.includes(checkbox.value);
  });

  let user = document.querySelector("#user");
  user.replaceChildren();

  for (let i = 0; i < userBoardList.length + 2; i++) {
    let userDiv = document.createElement("div");

    if (i < 2) {
      userDiv.textContent = "\u00A0";
    } else {
      userDiv.textContent = userBoardList[i - 2];
      userDiv.dataset.index = i - 2;
      userDiv.style.backgroundColor = darkBlue;
      userDiv.setAttribute("draggable", true);
    }
    user.append(userDiv);
  }
}

document.querySelector("#resetButton").addEventListener("click", () => {
  chrome.storage.sync.set({ userBoardList: boardList }, () => {});
  window.location.reload();
});

// etc

document.querySelector("#etc").addEventListener("change", (event) => {
  etc[event.target.value] = event.target.checked;
  chrome.storage.sync.set({ etc: etc }, () => {});
});

document.querySelector("#backupButton").addEventListener("click", backup);

// functions

function save() {
  banList.user.sort((a, b) => (a.name[0] > b.name[0] ? 1 : -1));
  banList.word.sort();
  chrome.storage.local.set({ banList: banList }, () => {});
  chrome.storage.sync.set({ userBoardList: userBoardList }, () => {});
}

function backup() {
  chrome.storage.local.get((localData) => {
    chrome.storage.sync.get((syncData) => {
      json = JSON.stringify([localData.banList, syncData.userBoardList]);
      blob = new Blob([json]);
      saveAs(URL.createObjectURL(blob), "backup.json");
    });
  });
}

function clearCache() {
  chrome.storage.local.get("cache", (data) => {
    for (let i = 0; i < data.cache.main.length; i++) {
      data.cache.main[i] = { link: "", info: [], title: "" };
    }
    for (let i = 0; i < data.cache.top.length; i++) {
      data.cache.top[i] = { link: "", info: [], title: "" };
    }
    chrome.storage.local.set({ cache: data.cache }, () => {});
  });
}

function recoverCache() {
  chrome.storage.local.get("cache", (data) => {
    while (data.cache.main.length < 360) {
      data.cache.main.push({ link: "", info: [], title: "", dislike: "" });
    }
    while (data.cache.top.length < 60) {
      data.cache.top.push({ link: "", info: [], title: "" });
    }
    chrome.storage.local.set({ cache: data.cache }, () => {});
  });
}

function saveAs(uri, filename) {
  let link = document.createElement("a");
  if (typeof link.download === "string") {
    document.body.append(link); // Firefox requires the link to be in the body
    link.download = filename;
    link.href = uri;
    link.click();
    document.body.removeChild(link); // remove the link when done
  } else {
    location.replace(uri);
  }
}

function sortName() {
  console.log(banList.user.flatMap((a) => a.name).sort((a, b) => b.length - a.length));
}

// li.addEventListener("dragstart", (event) => {
//   dragged = event.target;
//   event.target.style.opacity = 0.5;
//   event.target.style.backgroundColor = "rgb(56,138,255)";
// });
// li.addEventListener("dragend", (event) => {
//   event.target.removeAttribute("style");
//   dragged = null;
//   replaces = document.querySelectorAll("#replaceList li");
//   for (let i = 0; i < replaces.length; i++) {
//     replaces[i].setAttribute("data-index", i);
//     replaceList[i] = [replaces[i].querySelector(".original").value, replaces[i].querySelector(".replace").value];
//   }
//   // save();
// });
// li.addEventListener("dragover", (event) => {
//   event.preventDefault();
// });
// li.addEventListener("dragenter", (event) => {
//   if (dragged && dragged != event.target) {
//     if (dragged == event.target.nextElementSibling) {
//       //상승
//       event.target.before(dragged);
//     } else if (dragged == event.target.previousElementSibling) {
//       //하강
//       event.target.after(dragged);
//     }
//   }
// });
// li.addEventListener("drop", (event) => {
//   event.preventDefault();
// });
