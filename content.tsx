
import { useCallback, useEffect, useRef, useState } from "react"
import cssText from 'data-text:~content.css';
import { blobToArrayBuffer, getEvenFrames, toBase64 } from "~uitls";


export const getStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};
let mediaRecorder;
let recordedChunks = [];
let recorder;
let mod = 1; // 缩放0.5秒

// 防抖
function useThrottle(fn, delay, dep = []) {
	const { current } = useRef({ fn, timer: null });

	useEffect(function () {
		current.fn = fn;
	}, [fn]);

	return useCallback(function f(...args) {
		if (!current.timer) {
			current.timer = setTimeout(() => {
				delete current.timer;
			}, delay);
			current.fn(...args);
		}
	}, dep);
}




function IndexContent() {
	const [status, setStatus] = useState(false)
	const [loadVideo, setLoadVideo] = useState(false)
	const [playing, setPlaying] = useState(false)
	const [exporting, setExporting] = useState(false)

	const videoRef = useRef()
	const canvasRef = useRef()
	const exportCanvasRef = useRef()
	const webCodecsRef = useRef({
		outputChunks: [],
		videoEncoder: null,
		frameIndex: 0,
	})
	const perviewRef = useRef({
		scale: 1,
		type: 0, // 0: 预览 1: 导出
		lastTime: 0, // 预览上次时间
		event: null,
		eventIndex: 0,
		lastScale: 1,
	})

	const recordInfo = useRef({
		startTime: 0,
		endTime: 0,
		lastTime: 0,
		events: [],
		eventFrames: []
	})




	useEffect(() => {
    const script = document.createElement("script");

    script.src = "/assets/plugin/ffmpeg.min.js";
    script.async = true;

    // On load, set scriptLoaded to true
    script.onload = () => {
      // scriptLoaded.current = true;
      // loadFfmpeg();
			console.log('加载 ffmpeg.mini.js')
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

	const addKeyDowns = useThrottle((e) => {
		recordInfo.current.events.push({
			type: 'keydown',
			time: new Date().getTime()
		})
	}, 1000)

	const addDowns = (e) => {
		recordInfo.current.events.push({
			type: 'mousedown',
			time: new Date().getTime(),
			scale: 1.3,
			position: {
				x: e.screenX,
				y: e.screenY
			}
		})
	}

	const addMoves = (e) => {
		if (recordInfo.current.lastTime !== 0
			&& recordInfo.current.lastTime + 1000 > new Date().getTime()
		) {
			return
		}
		console.log('recordInfo.current.lastTime + 1000 < new Date().getTime()', e, recordInfo.current.lastTime + 1000 < new Date().getTime())
		recordInfo.current.lastTime = new Date().getTime()
		recordInfo.current.events.push({
			type: 'mousemove',
			time: recordInfo.current.lastTime,
			position: {
				x: e.screenX,
				y: e.screenY
			}
		})
	}

	const drawVideoFrame = async () => {
		if (!videoRef.current.paused && !videoRef.current.ended) {
			const context = perviewRef.current.type === 0
				? canvasRef.current.getContext('2d')
				: exportCanvasRef.current.getContext('2d')
			const cw = perviewRef.current.type === 0 ? canvasRef.current.width : exportCanvasRef.current.width;
			const ch = perviewRef.current.type === 0 ? canvasRef.current.height : exportCanvasRef.current.height;
			context.clearRect(0, 0, cw, ch);
			context.scale(1, 1);
			context.save();
			let { event, lastScale, eventIndex } = perviewRef.current
			const { eventFrames: events } = recordInfo.current
			if (!event) {
				for (let i = eventIndex; i < events.length; i++) {
					const { start, t } = events[i]
					if (start <= videoRef.current.currentTime && videoRef.current.currentTime < start + t) {
						event = events[i]
						perviewRef.current.event = event
						perviewRef.current.eventIndex = i + 1
						break
					}
				}
			}
			if (event) {
				const { position: { x, y }, scale, start, t } = event
				let newScale = 1
				if (videoRef.current.currentTime - start < mod) {
					newScale = newScale + (videoRef.current.currentTime - start) / 1 * (scale - 1)
					lastScale = newScale
					perviewRef.current.lastScale = lastScale
				}
				if (videoRef.current.currentTime >= start + t - mod && videoRef.current.currentTime < start + t) {

					newScale = lastScale - ((lastScale - 1) - (start + t - videoRef.current.currentTime) / 1 * (lastScale - 1))
					// console.log(lastScale, lastScale - 1, (start + t  - video.currentTime - 1 )/ 1 * (lastScale - 1), newScale)
					// return
				}

				if (videoRef.current.currentTime - start > mod && videoRef.current.currentTime < start + t - mod) {
					newScale = lastScale
				}
				context.translate(x, y);
				context.scale(newScale, newScale);
				context.translate(-x, -y);
				if (videoRef.current.currentTime >= start + t) {
					event = null
					perviewRef.current.event = event
					perviewRef.current.eventIndex = 0
				}
			}
			context.drawImage(videoRef.current, 0, 0, cw, ch);
			context.restore()
			// if (perviewRef.current.type === 1) {
			// 	const bitmap = await createImageBitmap(exportCanvasRef.current)
			// 	if (	webCodecsRef.current.videoEncoder.state === "closed") {
			// 			console.log("Encoder is already closed.");
			// 	} else {
			// 		webCodecsRef.current.frameIndex =  webCodecsRef.current.frameIndex  + 1
			// 		const videoFrame = new VideoFrame(bitmap, { timestamp:  webCodecsRef.current.frameIndex  / 30 });
			// 		await webCodecsRef.current.videoEncoder.encode(videoFrame);
			// 		videoFrame.close(); // 关闭帧释放资源
			// 	}
			// }
			requestAnimationFrame(drawVideoFrame)
		}

	}
	const startRecording = (stream) => {
		mediaRecorder = new MediaRecorder(stream);

		mediaRecorder.onstart = () => {
			recordInfo.current.startTime = new Date().getTime()
			recordInfo.current.events = []
			document.addEventListener("mousedown", addDowns)
			document.addEventListener("mousemove", addMoves)
			document.addEventListener("keydown", addKeyDowns)
		}
		mediaRecorder.ondataavailable = function (event) {
			if (event.data.size > 0) {
				recordedChunks.push(event.data);
			}
		};

		mediaRecorder.onstop = function () {
			setStatus(true)
			recordInfo.current.endTime = new Date().getTime()
			const blob = new Blob(recordedChunks, {
				type: 'video/webm'
			});
			recordedChunks = [];
			recordInfo.current.eventFrames = getEvenFrames(recordInfo.current)
			console.log('-----', blob, recordInfo);
			const url = URL.createObjectURL(blob);
			setTimeout(() => {
				videoRef.current.src = url


				videoRef.current.addEventListener('play', function () {
					console.log(videoRef.current)

					requestAnimationFrame(drawVideoFrame)
				})
				videoRef.current.addEventListener('loadedmetadata', function () {
					perviewRef.current.scale = 1080 / videoRef.current.videoWidth
					canvasRef.current.width = 1080;
					canvasRef.current.height = videoRef.current.videoHeight * perviewRef.current.scale;
					exportCanvasRef.current.width = videoRef.current.videoWidth
					exportCanvasRef.current.height = videoRef.current.videoHeight
					setLoadVideo(true)
				});

				videoRef.current.addEventListener('ended', async () => {
					recorder && recorder.stop();
					console.log('recorder------', recorder);
					// if (perviewRef.current.type === 1) {
					// 	console.log('关闭状态--------');
					// 	webCodecsRef.current.videoEncoder.flush().then(() => {
					// 		webCodecsRef.current.videoEncoder.close();
					// 		// 可以选择保存文件或处理输出数据
					// 		const blob = new Blob(webCodecsRef.current.outputChunks, { type: 'video/webm' });
					// 		saveRecording(blob)
					// 	});
					// }
				})
			}, 1000)

			// 处理录制完成后的数据，比如保存文件
			// saveRecording(blob);

			document.removeEventListener('mousedown', addDowns)
			document.removeEventListener('mousemove', addMoves)
			document.removeEventListener("keydown", addKeyDowns)
		};

		mediaRecorder.start();
	}


	function saveRecording(blob) {
		// const blob = new Blob(recordedChunks, { type: 'video/webm' });
		const url = URL.createObjectURL(blob);
		console.log('下载 url', url)
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = 'recording.webm';
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
	}

	const handleStartRecord = async () => {
		// document.body.style.filter = `invert(1) hue-rotate(180deg)`;
		let stream = await navigator.mediaDevices.getDisplayMedia({
			video: { displaySurface: 'browser' },
			audio: true
		});
		setPlaying(false)
		startRecording(stream);

		//  invert(1) hue-rotate(180deg)

		// chrome.tabCapture.capture({ audio: true, video: true }, function(stream) {
		// 	console.log('Captured stream:', stream);
		// 	// sendResponse(stream);
		// });

		// chrome.runtime
		//     .sendMessage({ action: 'record-tab'})
		// 		.then((stream) => {
		// 			console.log('Captured stream:', stream);
		// 			startRecording(stream);
		// 		})


	}

	const handeExport = async () => {
		// chrome.runtime
		// .sendMessage({ action: 'perview-video' })
		// setExporting(true)
		// const fps = 30;
		// const MP4 = await loadMP4Module();
		// const encoder = MP4.createWebCodecsEncoder({
		//   width: videoRef.current.videoWidth,
		//   height: videoRef.current.videoHeight,
		//   fps
		// });
		// mp4wasmRef.current = encoder
		// videoRef.current.currentTime = 0
		// perviewRef.current.type = 1
		// requestAnimationFrame(() => {
		// 	videoRef.current.play()
		// })
		setExporting(true)
		// setupVideoEncoder()
		perviewRef.current.type = 1
		videoRef.current.currentTime = 0
		console.log('总时长：', videoRef.current.duration)
		requestAnimationFrame(() => {
			videoRef.current.play()

			let stream = exportCanvasRef.current.captureStream(60);
			const mimeType = 'video/webm; codecs=vp9';
			recorder = new MediaRecorder(stream, { mimeType: mimeType });
			const data = []
			recorder.ondataavailable = function (event) {
				if (event?.data.size) data.push(event.data);
			}
			recorder.onstop =  async () => {
				console.log('data---', data)
				// let url = URL.createObjectURL(new Blob(data, { type:mimeType  }));
				//   console.log('recorder.onstop ----', url)
				const blob = new Blob(data, { type: 'video/webm' });
				const url = URL.createObjectURL(blob);
				const base64 = await toBase64(blob)
				const buffer = await blobToArrayBuffer(blob)
				chrome.runtime
					.sendMessage({ action: 'perview-video', datas: { data, base64 , buffer } })
					setExporting(false)
			}
			recorder.start()

		})
	}

	useEffect(() => {
		const handle = async (request, sender, sendResponse) => {
			if (request.action == "current-window-stream") {
				// loadMP4Module()
				handleStartRecord()
			}
		}
		chrome.runtime.onMessage.addListener(handle);
		return () => {
			chrome.runtime.onMessage.removeListener(handle);
		}
	}, [])

	// WebCodecs 使用
	const handleOutput = (chunk) => {
		webCodecsRef.current.outputChunks.push(chunk.data);
	}
	const setupVideoEncoder = () => {
		const config = {
			codec: 'avc1.640028',   // 使用AVC，级别3.0 // 示例使用 VP8，可根据浏览器支持替换为 'avc1.42E01E', 'vp9' 等
			width: 1080,
			height: 1920,
			bitrate: 10000000,     // 可能需要增加比特率
			framerate: 30
		};

		const videoEncoder = new VideoEncoder({
			output: handleOutput,
			error: (error) => console.error('Video encoding error:', error)
		});

		videoEncoder.configure(config);
		webCodecsRef.current.videoEncoder = videoEncoder
	}
	const handleClose = () => {
		videoRef.current.pause()
		setStatus(false)
		initRef()

	}
	// 初始化状态
	const initRef = () => {
		perviewRef.current = {
			scale: 1,
			type: 0, // 0: 预览 1: 导出
			lastTime: 0, // 预览上次时间
			event: null,
			eventIndex: 0,
			lastScale: 1,
		}
		recordInfo.current = {
			startTime: 0,
			endTime: 0,
			lastTime: 0,
			events: [],
			eventFrames: []
		}
	}
	return <>
		{
			status
				? <div className="perview-container">
					{exporting ? <div className="tip">正在导出</div> : null}
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<div style={{ position: 'relative' }}>
							<video ref={videoRef} style={{ width: "1080px", display: 'none' }}></video>
							<canvas ref={canvasRef}></canvas>
							{
								playing ? null : <div className="tip">点击“预览”按钮</div>
							}
						</div>
						<div style={{ textAlign: 'center', display: loadVideo ? 'block': 'none' }}>
							<button onClick={() => {
								setPlaying(true);
								videoRef.current.play();
							}}> 预览 </button>
							{/* <button onClick={() => videoRef.current.pause()}> 停止 </button> */}
							<button onClick={handleClose}> 退出 </button>
							<button onClick={handeExport}> 导出</button>
						</div>
						<canvas ref={exportCanvasRef} style={{ display: 'none' }}></canvas>
					</div>
				</div>
				: null
		}

	</>
}

export default IndexContent
