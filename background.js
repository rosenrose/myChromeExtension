chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({
        color: '#000000',
        banList: ["Gabriel Tosh","미쿠생태학","Brit Marling","A.Shipwright","샤스르리에어","쿈코다이스키"],
        userBoardList: ["읽을 거리 판","컴퓨터 / IT 판","영상 판","창작 판","덕후 판","게임 판","콘솔 게임 판","음악 판","요리 판",
                    "익명 판","고민 상담 판","게임 연재 / 정보 판","탈것 판","모바일 게임 판","리그 오브 레전드",
                    "짤방 판","걸그룹 판","정치 사회 판","젠더 이슈 판","스포츠 판","시간 때우기","공지 사항"]
    }, function() {
        console.log('Black');
    });
    // chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // 	chrome.declarativeContent.onPageChanged.addRules([{
    // 		conditions: [new chrome.declarativeContent.PageStateMatcher({
    // 			pageUrl: {
    // 				hostEquals: 'developer.chrome.com',
    // 				urlContains: 'ruliweb.com'
    // 			},
    // 		})],
    // 		actions: [new chrome.declarativeContent.ShowPageAction()]
    // 	}]);
    // });
});