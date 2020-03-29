let page = document.querySelector('#buttonDiv');
let list = document.querySelector('#list');
let banList = [];
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

function update() {
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
	if (data.banList == null) {
		chrome.storage.sync.set({banList: []}, function() {});
	}
	banList = data.banList;
	update();
});

document.querySelector("#addButton").addEventListener('click', function() {
	var user = document.querySelector("#add").value;
	banList.push(user);
	update();
});

document.querySelector("#delButton").addEventListener('click', function() {
	var user = document.querySelector("#del").value;
	var idx = banList.indexOf(user)
	if (idx > -1) {
		banList.splice(idx,1);
	}
	update();
});

document.querySelector("#resetButton").addEventListener('click', function() {
	banList = [];
	update();
});