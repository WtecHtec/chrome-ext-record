export const getEvenFrames = (frames) => {
	// 总时长
	const durtion = Math.floor((frames.endTime - frames.startTime) / 1000)
	console.log(durtion)
	// 计算事件在第几秒发生
	const { events: evenFrames } = frames
	// const evenFrames = []
	// for (let i = 0; i < events.length; i++) {
	// 	const { time } = events[i]
	// 	const sec = Math.floor((time - frames.startTime) / 1000)
	// 	evenFrames.push({
	// 		...events[i],
	// 		sec,
	// 	})
	// }


	// 4s [1,1]
	const cutFrames = []
	let i = 0

	while (i < evenFrames.length) {
		const { time, type, use } = evenFrames[i]
		const sec = Math.floor((time - frames.startTime) / 1000)
		if (type === 'mousedown' && !use) {
			const item = {
				...evenFrames[i],
				start: sec,
				end: sec,
				children: [],
			}
			evenFrames[i].use = true
			for (let j = i; j < evenFrames.length; j++) {
				const { time: time1, type: type1, use: use1 } = evenFrames[j];
				const sec0 = Math.floor((time1 - frames.startTime) / 1000)
				if (type1 === 'keydown' && sec0 - item.end <= 2) {
					item.end = sec0
					// item.children.push(evenFrames[j])
					continue
				}
				if (type1 === 'mousedown' && !use1) {
					if (sec0 - item.end > 4) {
						i = j - 1
						break
					} else {
						evenFrames[j].use = true
						item.end = sec0
						item.children.push(evenFrames[j])
					}
				}
			}
			item.end = item.end + 2
			item.t = item.end - item.start
			cutFrames.push(item)
		}
		i = i + 1
	}
	return cutFrames;
}


export  function getURLParameter(name, url = window.location.href) {  
	name = name.replace(/[\[\]]/g, '\\$&');  
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),  
			results = regex.exec(url);  
	if (!results) return null;  
	if (!results[2]) return '';  
	return decodeURIComponent(results[2].replace(/\+/g, ' '));  
} 

export const toBase64 = (blob) => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(blob);
		reader.onloadend = () => {
			resolve(reader.result);
		};
		reader.onerror = reject;
	});
};
 
export const base64ToUint8Array = (base64) => {
  const dataUrlRegex = /^data:(.*?);base64,/;
  const matches = base64.match(dataUrlRegex);
  if (matches !== null) {
    // Base64 is a data URL
    const mimeType = matches[1];
    const binaryString = atob(base64.slice(matches[0].length));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  } else {
    // Base64 is a regular string
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: "video/webm" });
  }
};

export async function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert Blob to ArrayBuffer"));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}