chrome.runtime.onInstalled.addListener(function() {
	chrome.storage.sync.set({
		color: '#000000',
		banList: []
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