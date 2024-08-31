console.log('-----down load')
function getURLParameter(name, url = window.location.href) {  
	name = name.replace(/[\[\]]/g, '\\$&');  
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),  
			results = regex.exec(url);  
	if (!results) return null;  
	if (!results[2]) return '';  
	return decodeURIComponent(results[2].replace(/\+/g, ' '));  
} 
// const base64ToUint8Array = (base64) => {
// 	const dataUrlRegex = /^data:(.*?);base64,/;
// 	const matches = base64.match(dataUrlRegex);
// 	if (matches !== null) {
// 		// Base64 is a data URL
// 		const mimeType = matches[1];
// 		const binaryString = atob(base64.slice(matches[0].length));
// 		const bytes = new Uint8Array(binaryString.length);
// 		for (let i = 0; i < binaryString.length; i++) {
// 			bytes[i] = binaryString.charCodeAt(i);
// 		}
// 		return new Blob([bytes], { type: mimeType });
// 	} else {
// 		// Base64 is a regular string
// 		const binaryString = atob(base64);
// 		const bytes = new Uint8Array(binaryString.length);
// 		for (let i = 0; i < binaryString.length; i++) {
// 			bytes[i] = binaryString.charCodeAt(i);
// 		}
// 		return bytes;
// 	}
// };


window.onload =  async () => {


	// 监听来自父页面的消息  
window.addEventListener('message', async function(event) {  
	console.log('Received message from parent page:', event, event.data);  
	// 检查消息的来源，确保它来自我们期望的父页面  
	if (event && event.data && event.data.recordbase) {
		downLoad(event.data.recordbase, event.data.action || 0, event.data.events )
		// const buf =  await base64ToUint8Array(event.data.recordbase)
		// // 假设 uint8Array 是包含MP4视频数据的 Uint8Array 对象  
		// // // 创建一个 Blob 对象，type 为 'video/mp4'  
		// const blob = new Blob([buf], { type: 'video/webm' });  
		// window.frames[0].postMessage({ videoBlob: base64ImgtoFile(event.data.recordbase, 'video'), downUrl: ''}, '*');
	}
	// 处理接收到的消息  
	console.log('Received message from parent page:', event, event.data);  
	// 可以根据消息的内容执行相应的操作  

}, false);

//   console.log('base64----', window);
	return

}


// const base64ToUint8Array = (base64) => {
//   const dataUrlRegex = /^data:(.*?);base64,/;
//   const matches = base64.match(dataUrlRegex);
//   if (matches !== null) {
//     // Base64 is a data URL
//     const mimeType = matches[1];
//     const binaryString = atob(base64.slice(matches[0].length));
//     const bytes = new Uint8Array(binaryString.length);
//     for (let i = 0; i < binaryString.length; i++) {
//       bytes[i] = binaryString.charCodeAt(i);
//     }
//     return  bytes
//   } else {
//     // Base64 is a regular string
//     const binaryString = atob(base64);
//     const bytes = new Uint8Array(binaryString.length);
//     for (let i = 0; i < binaryString.length; i++) {
//       bytes[i] = binaryString.charCodeAt(i);
//     }
//     return bytes
//   }
// };

function base64ToUint8Array(base64) {
  const dataURLRegex = /^data:.+;base64,/;
  if (dataURLRegex.test(base64)) {
    base64 = base64.replace(dataURLRegex, "");
  }

  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }

  return bytes;
}

async function downLoad(base64, type = 0, events = []) {
	const buf =  await base64ToUint8Array(base64)
	// 假设 uint8Array 是包含MP4视频数据的 Uint8Array 对象  

  
// // 创建一个 Blob 对象，type 为 'video/mp4'  
// let blob = new Blob([buf], { type: 'video/mp4' });  
  
// // 创建一个指向该 Blob 对象的 URL  
// let url = URL.createObjectURL(blob);  
// console.log('url----', url)
// const a1 = document.createElement('a');
// a1.style.display = 'none';
// a1.href = url;
// a1.download = 'recording.mp4';
// document.body.appendChild(a1);
// a1.click();
	// const bufUrl = URL.createObjectURL(buf);
	// console.log('bufUrl----', buf, bufUrl)
	const { createFFmpeg, fetchFile } = FFmpeg;
	const ffmpeg = createFFmpeg({ 
		log: true,
		progress: (params) => {},
		corePath: "../assets/vendor/ffmpeg-core.js",
	 });
	 await ffmpeg.load()
	 await ffmpeg.FS('writeFile', `input.webm`, buf);

	 // 假设转码为输出.mp4
	 await ffmpeg.run(
		"-i",
	 "input.webm",
	 "-max_muxing_queue_size",
	 "512",
	 "-preset",
	 "superfast",
	 "-threads",
	 "0",
	 "-r",
	 "30",
	 "-tune",
	 "fastdecode",
	 "output.mp4");

// await ffmpeg.run('-i', 'input.webm', 'output.mp4')

	 // 读取生成的文件，并创建一个 URL
	 const data = ffmpeg.FS('readFile', 'output.mp4');
	 const videoBlob = new Blob([data.buffer], { type: "video/mp4" });

	 const downUrl = URL.createObjectURL(videoBlob);
		if (type === 0) {
			window.frames[0].postMessage({ videoBlob, downUrl, videoEvents: events}, '*');
		} else {
				const video = document.createElement('video');
				video.src = downUrl
				video.controls = true
				video.style.width = '500px'
				document.body.appendChild(video)
				document.getElementsByClassName('iframe-container')[0].style.display = 'none'
		}
	//  const video = document.createElement('video');
	// 	video.src = downUrl
	// 	video.controls = true
	// 	video.style.width = '500px'
	// 	document.body.appendChild(video)
		// document.getElementById('tip').style.display = 'none'
	//  console.log('downUrl---',file, URL.createObjectURL(file), data, videoBlob, downUrl)
	//  const a = document.createElement('a');
	//  a.style.display = 'none';
	//  a.href = downUrl;
	//  a.download = 'recording.mp4';
	//  document.body.appendChild(a);
	//  a.click();
}

// document.getElementById('transcode').addEventListener('click', async () => {
// 	const { createFFmpeg, fetchFile } = FFmpeg;
// 	const ffmpeg = createFFmpeg({ 
// 		log: true,
// 		progress: (params) => {},
// 		corePath: "../assets/vendor/ffmpeg-core.js",
// 	 });
// 	const uploader = document.getElementById('uploader');

// 	if (!ffmpeg.isLoaded()) {
// 			await ffmpeg.load();
// 	}

// 	if (uploader.files[0]) {
// 			const file = uploader.files[0];
// 			ffmpeg.FS('writeFile', file.name, await fetchFile(file));

// 			// 假设转码为输出.mp4
// 			await ffmpeg.run('-i', file.name, 'output.mp4');

// 			// 读取生成的文件，并创建一个 URL
// 			const data = ffmpeg.FS('readFile', 'output.mp4');
// 			const video = document.getElementById('outputVideo');
// 			video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
// 			video.play();
// 	}
// });




async function downloadBlobAsBuffer(blobUrl) {
	try {
			const response = await fetch(blobUrl);
			if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
			}
			const buffer = await response.arrayBuffer();
			return buffer;
	} catch (error) {
			console.error('Failed to download or convert blob to buffer:', error);
	}
}


function getBase64URL(pic) {
	const blob = base64ImgtoFile(pic)
	const blobUrl = URL.createObjectURL(blob);
	return blobUrl
}

function base64ImgtoFile (dataurl, filename = 'file') {
	//将base64格式分割：['data:image/png;base64','XXXX']
	const arr = dataurl.split(',')
	// .*？ 表示匹配任意字符到下一个符合条件的字符 刚好匹配到：
	// image/png
	const mime = arr[0].match(/:(.*?);/)[1]  //image/png
	//[image,png] 获取图片类型后缀
	const suffix = mime.split('/')[1] //png
	const bstr = atob(arr[1])   //atob() 方法用于解码使用 base-64 编码的字符串
	let n = bstr.length
	const u8arr = new Uint8Array(n)
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n)
	}
	return new File([u8arr], `${filename}.${suffix}`, {
		type: mime
	})
}