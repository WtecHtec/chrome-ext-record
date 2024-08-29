import { useState } from "react"
let mediaRecorder;
let recordedChunks = [];
function IndexPopup() {
  const [data, setData] = useState("")
 const startRecording = (stream) => {
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = function() {
        const blob = new Blob(recordedChunks, {
            type: 'video/webm'
        });
        recordedChunks = [];
        // 处理录制完成后的数据，比如保存文件
        // saveRecording(blob);
    };

    mediaRecorder.start();
}

const handleStartRecord = async () => {
	// let stream = await navigator.mediaDevices.getDisplayMedia({
  //   video: true,
  //   audio: true
  // });
	// startRecording(stream);

	// chrome.tabCapture.capture({ audio: true, video: true }, function(stream) {
	// 	console.log('Captured stream:', stream);
	// 	// sendResponse(stream);
	// });

	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
	 let	tabId = tabs[0].id;

	 chrome.tabs.sendMessage(tabId, { action: "current-window-stream", datas: {
		streamId: 'kkkk'
	}  });
	
		// chrome.tabCapture.getCapturedTabs((ci) => {
		// 	if (!ci.some(e => e.tabId == tabId)) {
		// 		chrome.tabCapture.getMediaStreamId({ consumerTabId: tabId }, (streamId) => {
		// 			console.log('streamId----', streamId);
		// 			chrome.tabs.sendMessage(tabId, { action: "current-window-stream", datas: {
		// 				streamId
		// 			}  });
		// 		});
		// 	}
		// });


	});
}

  return (
    <div
      style={{
        padding: '16px',
				width: '80px'
      }}>
       <button onClick={handleStartRecord}>开始录制</button>
    </div>
  )
}

export default IndexPopup
