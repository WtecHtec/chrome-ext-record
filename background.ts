
let videoBase64 = '';
let videoEvents = [];
chrome.action.onClicked.addListener((tab) => {
  chrome.tabCapture.capture({ audio: true, video: true }, function(stream) {
    if (stream) {
      console.log('Captured stream:', stream);
      chrome.storage.local.set({ "recordingStream": stream });
    } else {
      console.error('Error capturing stream.');
    }
  });
 console.log('---- 点击----',)
	
});

// 监听插件请求
chrome.runtime.onMessage.addListener(  (request, sender, sendResponse) => {
  // 获取插件列表
  const { action, datas } = request;
	console.log('request---', request);
  if (action === 'record-tab') {

    // chrome.tabCapture.capture({ audio: true, video: true }, function(stream) {
		// 	console.log('Captured stream:', stream);
		// 	sendResponse(stream);
		// });

		// chrome.tabCapture.getCapturedTabs((ci) => {
		// 	chrome.tabCapture.getMediaStreamId({ consumerTabId: tabId }, (streamId) => {
		// 		console.log('Captured stream:', streamId);
		// 		sendResponse(streamId)
		// 	});
		// });
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			console.log('tabs---', tabs);

		//   chrome.tabCapture.capture({ audio: true, video: true }, function(stream) {
		// 	console.log('Captured stream:', stream);
		// 	// sendResponse(stream);
		// });
			sendResponse({ })
		})

		
	}
	if (action === 'current-window-stream') {
		 // 发送消息到content script
		 chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {action: "start-record", datas});
	  });
	}
	if (action === 'perview-video') {
		// const blob = new Blob(datas.data, { type: 'video/webm' });
		const { data, base64, buffer, events } = datas
		// chrome.storage.local.set({
		// 	recordbase: base64
		// }, function() {
		// 	console.log("Value stored successfully!");
		// });

		videoBase64 = base64;
		videoEvents = events;
		chrome.tabs.create({ url: chrome.runtime.getURL(`/tabs/download.html`) });
		// console.log('tab-------', tab)
		// function func(base64) { 
		// 	console.log('----------  chrome.scripting.executeScript run ', window, base64)
		// }
		// await waitForTabToLoad(tab.id);
		// console.log('hrome.scripting.executeScript start -----')
		// await chrome.scripting.executeScript({
		// 	target: { tabId: tab.id,},
		// 	func,
		// 	args: [base64],
		// 	world: 'MAIN'
		// });
	}

	if (action === 'get-video-base') { 
		 getRecordData(sendResponse)
	}
	console.log('-----');
  return true; // 表示我们将异步发送响应
});

const getRecordData = async (sendResponse) => {
	// const base =  videoBase64 || await chrome.storage.local.get('recordbase')
	// console.log('get video base', base)
	sendResponse({ recordbase: videoBase64, events: videoEvents})
}



function waitForTabToLoad(tabId) {
  return new Promise((resolve) => {
    function onTabUpdated(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        console.log(`Tab ${tabId} has loaded.`);
        chrome.tabs.onUpdated.removeListener(onTabUpdated); // 移除监听器避免重复调用
        resolve(1); // 解决Promise
      }
    }
    chrome.tabs.onUpdated.addListener(onTabUpdated);
  });
}