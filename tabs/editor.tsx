import React, { useRef } from 'react';




import '~tabs/update.css';
import { base64ToUint8Array } from '~uitls';

export default function UpdateRender() {
	const iframeRef = useRef()
  const [updated, setUpdated] = React.useState(false);
  React.useEffect(() => {
    let timer  = setTimeout( async () => {
        setUpdated(true);
				chrome.runtime.sendMessage({ action: 'get-video-base' }) .then(async (response) => {
					console.log('response----', response);
						const blob =  base64ToUint8Array(response.recordbase)
						const bufUrl = URL.createObjectURL(blob);
					console.log('blob---', blob, bufUrl);
				
					window.parent.postMessage(response, '*')
				

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
    <div className="container">
      <div className="loading">{updated ? <Updated></Updated> : <UpdateIng></UpdateIng>}</div>
    </div>
  );
}
