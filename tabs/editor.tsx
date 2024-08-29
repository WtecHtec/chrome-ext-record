import React, { useRef, useState, useEffect } from 'react';

import '~tabs/update.css';
import { base64ToUint8Array } from '~uitls';
import VideoPlayer from './component/videoPlyer';
let videoEvents = [];
export default function UpdateRender() {
  const [updated, setUpdated] = useState(false);
  const [recordInfo, setRecordInfo] = useState({
    videoUrl: '',
    videoEvents: [],
  })
  useEffect(() => {
    let timer  = setTimeout( async () => {
				chrome.runtime.sendMessage({ action: 'get-video-base' }) .then(async (response) => {
						// const blob =  base64ToUint8Array(response.recordbase)
						// const bufUrl = URL.createObjectURL(blob);
            // console.log('response----updated----', bufUrl);
            videoEvents = response.events
					  window.parent.postMessage(response, '*')
            // setUpdated(true);
            // setRecordInfo({
            //   videoUrl: response.recordbase,
            //   videoEvents:response.recordbase
            // })
               
            // setRecordInfo({
            //   videoUrl: bufUrl,
            //   videoEvents: response.events
            // })

					// 将Base64字符串转换为二进制数据
          // const binaryData = atob(response.recordbase);
					// 创建一个下载链接
					// const url = base64ToUint8Array(response.recordbase)
					// console.log('url---', url)
					// const bufUrl = URL.createObjectURL(url);
					// console.log('bufUrl---', bufUrl)
					// iframeRef.current.contentWindow.postMessage(response.recordbase, '*');
				})
				.catch((err) => {
					console.log('response----', err);
				});
			
      }, 1000 * 2);

      window.addEventListener('message', function(event) {
          // 这里可以添加安全性检查，例如检查 event.origin
          const message = event.data;
          console.log('message---', message)
          setUpdated(true);
          setRecordInfo({
            videoUrl: URL.createObjectURL(message.videoBlob),
            videoEvents: videoEvents,
          })
      });
    
    return () => {
      timer && clearTimeout(timer);
    };
  }, []);

  const UpdateIng = () => (
    <>
      <div className="spinner"></div>
      <h1 className="message">处理中，请稍候... </h1>
    </>
  );

  const Updated = () => (
    <>
      <div className="checkmark">✔</div>
      <h1 className="message">处理成功</h1>
    </>
  );

  return (
   <>
      {updated
        ? <VideoPlayer recordInfo={recordInfo} playerRect={{width: window.innerWidth, height: window.innerHeight}}></VideoPlayer> 
        :  <div className="container">
            <div className="loading">
              <UpdateIng></UpdateIng>
            </div>
          </div>
      }
      </>
  );
}
