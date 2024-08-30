/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import './videoPlyer.css'
import { formatSecondsToHMS } from './uitl';
import React from 'react';
import { Button, Drawer } from 'antd';
import { getEffectFramesByZooms } from './frame';
const MIN_FRAME_MOD_TIME = 0.2
const SCALE_DEFAULT = 1.2
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        // eslint-disable-next-line prefer-const
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
const getId = () => {
    return generateUUID()
}

let timer = null;
const minsecondes = 2 // 最小秒数
const VideoPlayer = (props) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const timeLineRef = useRef<HTMLDivElement>(null)
    const zoomRef = useRef<HTMLDivElement>(null)
    const zoomMaskRef = useRef<HTMLDivElement>(null)
    const plyrVideoRef = useRef<HTMLDivElement>(null)
    const plyrCanvasRef = useRef<HTMLCanvasElement>(null)
    const updateCanvasRef = useRef<HTMLCanvasElement>(null)
    const scaleUpdateDivRef = useRef<HTMLDivElement>(null)
    const mouseEvent = useRef({
        status: 1,
        time: 0,
        isDrag: false,
        direction: 'left',
        dragIndex: 0,
        minWidth: 10,
        cacheLeft: 0,
        cacheWidth: 0,
        targetDom: null,
        duration: 0,
        mintimeline: 0,
    })
    const [progressInfo, setProgressInfo] = useState({
        current: 0,
        move: 0,
    })
    const [zoomMaskInfo, setZoomMaskInfo] = useState({
        current: 0,
        status: true,
        width: 0,
    })

    const [playInfo, setPlayInfo] = useState({
        playing: false,
        status: false,
        update: false,
        duration: 0,
        current: 0,
    })

    const [attentionEyesInfo, setAttentionEyesInfo] = useState({
        selectIndex: -1,
        left: 0,
        top: 0,
        scale: 1.2,
    })

    const renderFrameInfo = useRef({
		lastScale: 1, // 上一帧的缩放
		event: null, // 当前事件
		index: 0, // 当前帧
		sx: 0, // 开始x
		sy: 0, //  开始y
		effectFrames: [],
		wscale: 1, // 缩放
		hscale: 1, // 缩放
		tReset: false, // 是否重置
		tIndex: 0, // 是否重置
		tx: 0, // 移动x
		ty: 0, // 移动y
	})

    const scaleInfoRef = useRef({
        updatescale: 1, // 更新时画布的缩放
        perviewScale: 1, // 预览时画布的缩放
    })

    const [zoomDatas, setZoomDatas] = useState([])

    const [downUrl, setDownUrl] = useState('')

    const [playerRect, setPlayerRect] = useState({
        width: window.innerWidth,
    })


    const [open, setOpen] = useState(false);

    const handleScaleUpdateMouseMove = (event) => {
        console.log('handleScaleUpdateMouseMove', event, attentionEyesInfo)
        const rect = scaleUpdateDivRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        // 限制可移动元素的位置，使其不超出容器
        const movableWidth =  scaleUpdateDivRef.current.offsetWidth;
        const movableHeight =  scaleUpdateDivRef.current.offsetHeight;
        const update = {
            left: x > movableWidth ? movableWidth : x < 0 ? 0 : x,
            top: y > movableHeight ? movableHeight : y < 0 ? 0 : y,
        }
        setAttentionEyesInfo((per) => ({
            ...per,
            ...update
        }))
        const newZoomDatas = [...zoomDatas]
        newZoomDatas[attentionEyesInfo.selectIndex] = {
            ...newZoomDatas[attentionEyesInfo.selectIndex],
            scale: attentionEyesInfo.scale,
            x: update.left,
            y: update.top,
        }
        console.log('newZoomDatas---', newZoomDatas)
        setZoomDatas(() => [...newZoomDatas])
    }

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        scaleUpdateDivRef.current.removeEventListener('mousedown', handleScaleUpdateMouseMove)
        setOpen(false);
    };


    /**
     * 初始化录制视频
     */
    useEffect(() => {
        const { videoUrl, videoEvents } = props.recordInfo
        if (videoUrl) {
            videoRef.current.src = videoUrl
            setPlayInfo({
                playing: false,
                status: true,
                update: false,
            } as any);
            setPlayerRect({
                ...props.playerRect,
            });
            setZoomDatas([])
        }

    }, [props])

    // useEffect(() => {
    //     /**
    //      * 选择 锚点
    //      * @param e 
    //      * @returns 
    //      */
    //     const handleClick = (e: any) => {
    //         if (attentionEyesInfo.selectIndex < 0) return
    //         // update scale
    //         let update = {}

    //         if (!e.target.className.includes('zoom-setting')) {
    //             update = {
    //                 x: e.offsetX,
    //                 y: e.offsetY,
    //             }
    //             console.log(' handleClick ---- update', update)
    //             setAttentionEyesInfo((per) => {
    //                 return {
    //                     ...per,
    //                     left: e.offsetX,
    //                     top: e.offsetY,
    //                 }
    //             })
    //         }
    //         const newZoomDatas = [...zoomDatas]
    //         newZoomDatas[attentionEyesInfo.selectIndex] = {
    //             ...newZoomDatas[attentionEyesInfo.selectIndex],
    //             ...update,
    //             vscale: attentionEyesInfo.scale,
    //         }
    //         console.log('newZoomDatas', newZoomDatas)
    //         setZoomDatas(() => [...newZoomDatas])
    //     }
    //     if (plyrVideoRef.current) {
    //         plyrVideoRef.current.addEventListener('click', handleClick)
    //     }
    //     return () => {
    //         if (plyrVideoRef!.current) {
    //             plyrVideoRef!.current.removeEventListener('click', handleClick)
    //         }
    //     }
    // }, [attentionEyesInfo.scale, attentionEyesInfo.selectIndex, zoomDatas])

    /**
     * 点击其他地方 隐藏 锚点
     *  */
    // useEffect(() => {
    //     const handleDocumentClick = (e) => {
    //         if (!e.target.parentNode.className.includes('plyr--video')
    //             && !e.target.className.includes('zoom-item')
    //             && !e.target.parentNode.className.includes('dropdown')) {
    //             setAttentionEyesInfo((per) => {
    //                 return {
    //                     ...per,
    //                     selectIndex: -1,
    //                 }
    //             })
    //         }
    //     }
    //     document.addEventListener('click', handleDocumentClick)
    //     return () => {
    //         document.removeEventListener('click', handleDocumentClick)
    //     }
    // }, [])

    /**
     * 
     * @param moveValue 
     * @returns 
     */
    const getMinSeconds = (moveValue: number) => {
        // const diff = Math.round(moveValue / mouseEvent.current.mintimeline)
        // moveValue = Math.round(mouseEvent.current.mintimeline * diff)
        const diff = (moveValue / mouseEvent.current.mintimeline)
        moveValue = (mouseEvent.current.mintimeline * diff)
        moveValue = moveValue < 0 ? 0 : (moveValue > 100 ? 100 : moveValue)
        return Math.floor(moveValue)
    }
    // time line 
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            videoRef.current?.pause()
            setPlayInfo(per => {
                return {
                    ...per,
                    playing: false,
                }
            })
            const mod = timeLineRef.current?.clientWidth / 0.9 * 0.1 * 0.5
            let moveValue = Math.floor((e.clientX - mod) / timeLineRef.current?.clientWidth * 100)
            moveValue = getMinSeconds(moveValue)
            setProgressInfo(per => {
                videoRef.current.currentTime = mouseEvent.current.duration * moveValue / 100
                return {
                    ...per,
                    move: moveValue
                }
            })
        }

        const onMouseDown = (e) => {
            const { target } = e
            if (target.className.includes('zoom-item-left') || target.className.includes('zoom-item-right')) return;
            setProgressInfo(per => {
                videoRef.current.currentTime = mouseEvent.current.duration * per.move / 100
                return {
                    ...per,
                    current: per.move
                }
            })
        }

        if (timeLineRef.current) {
            timeLineRef.current.addEventListener('mousemove', onMouseMove)
            timeLineRef.current.addEventListener('mousedown', onMouseDown)
        }
        return () => {
            if (timeLineRef!.current) {
                timeLineRef!.current.removeEventListener('mousemove', onMouseMove);
                timeLineRef!.current.removeEventListener('mousedown', onMouseDown);
            }
        }
    }, [])

    useEffect(() => {
        if (attentionEyesInfo && attentionEyesInfo.selectIndex !== -1 && scaleUpdateDivRef.current) {
            scaleUpdateDivRef.current.addEventListener('mousedown', handleScaleUpdateMouseMove)
        }
        return () => {
            if (scaleUpdateDivRef.current) {
                scaleUpdateDivRef.current.removeEventListener('mousedown', handleScaleUpdateMouseMove)
            }
        }
    }, [attentionEyesInfo])

    /**
     * 锚点 移动事件处理
     */
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            const { target } = e;
            const mod = zoomRef.current?.clientWidth / 0.9 * 0.1 * 0.5
            let moveValue = ((e.clientX - mod) / (zoomRef.current?.clientWidth)) * 100
            moveValue = moveValue < 0 ? 0 : (moveValue > 100 ? 100 : moveValue)
            moveValue = getMinSeconds(moveValue)
            const { isDrag, dragIndex, minWidth, direction, cacheLeft, cacheWidth, time, status } = mouseEvent.current
            if (status === 1 && time) {
                mouseEvent.current.status = 0
                return
            }
            const lastValue = cacheLeft + cacheWidth
            if (isDrag) {
                showZoomMask(false);
                if (direction === 'right') {
                    const left = zoomDatas[dragIndex].left
                    let width = moveValue - left;
                    width = width > minWidth ? width : minWidth
                    width = width <= 0 ? 0 : width
                    const cpzoomDatas = [...zoomDatas]
                    cpzoomDatas.sort((a, b) => a.left - b.left)
                    for (let i = 0; i < cpzoomDatas.length; i++) {
                        if (i !== dragIndex
                            && left < cpzoomDatas[i].left) {
                            if (width + left >= cpzoomDatas[i].left) {
                                width = cpzoomDatas[i].left - left
                            }
                            break
                        }
                    }
                    setZoomDatas(per => {
                        per[dragIndex].width = width
                        return [...per]
                    })
                } else if (direction === 'left') {
                    const left = zoomDatas[dragIndex].left
                    let nwmoveValue = moveValue >= lastValue - minWidth ? lastValue - minWidth : moveValue;
                    const cpzoomDatas = [...zoomDatas]
                    cpzoomDatas.sort((a, b) => (b.left + b.width) - (a.left + a.width))
                    for (let i = 0; i < cpzoomDatas.length; i++) {
                        if (i !== dragIndex
                            && left > cpzoomDatas[i].left) {
                            if (nwmoveValue <= cpzoomDatas[i].left + cpzoomDatas[i].width) {
                                nwmoveValue = cpzoomDatas[i].left + cpzoomDatas[i].width
                            }
                            break
                        }
                    }
                    let nwidth = lastValue - nwmoveValue
                    nwidth = nwidth > minWidth ? nwidth : minWidth
                    setZoomDatas(per => {
                        per[dragIndex].width = nwidth
                        per[dragIndex].left = nwmoveValue
                        return [...per]
                    })
                }
            } else {
                showZoomMask(true);
            }

            // than 100%
            if (moveValue + mouseEvent.current.minWidth > 100) {
                showZoomMask(false)
            }

            // in zoom-item 
            if ((target as HTMLElement).className.includes('zoom-item')) {
                showZoomMask(false);
            }
            // range zoomdatas
            const postion = moveValue + zoomMaskInfo.width
            for (let i = 0; i < zoomDatas.length; i++) {
                const { left, width } = zoomDatas[i]
                if (postion > left && postion <= left + width) {
                    showZoomMask(false)
                    break
                }
                if (moveValue > left && moveValue < left + width) {
                    showZoomMask(false)
                    break
                }
            }

            setZoomMaskInfo(per => {
                return {
                    ...per,
                    current: moveValue
                }
            })
        }
        const onMouseDown = (e) => {
            const { target } = e
            if (target.className.includes('zoom-mark')) {
                if (!getMaskStatus() || mouseEvent.current.duration < 2) return;
                setPlayInfo((per) => {
                    return {
                        ...per,
                        update: true,
                    }
                })
                // add  zoom
                setZoomDatas(per => {
                    return [
                        ...per,
                        {
                            id: getId(),
                            left: zoomMaskInfo.current,
                            width: mouseEvent.current.minWidth,
                            x: 400 / 2,
                            y: 200 / 2,
                            scale: 1.2,
                        }
                    ]
                })
                showZoomMask(false)
            } else if (target.className.includes('zoom-item-right')) {
                // drag right
                mouseEvent.current.status = 1
                showZoomMask(false)
                mouseEvent.current.time = setTimeout(() => {
                    mouseEvent.current.isDrag = true
                    mouseEvent.current.direction = 'right'
                    mouseEvent.current.dragIndex = target.dataset['index']
                    mouseEvent.current.cacheLeft = zoomDatas[target.dataset['index']].left
                    mouseEvent.current.cacheWidth = zoomDatas[target.dataset['index']].width
                    mouseEvent.current.status = 0
                }, 0) as any;
            } else if (target.className.includes('zoom-item-left')) {
                // drag left
                showZoomMask(false)
                mouseEvent.current.status = 1
                mouseEvent.current.time = setTimeout(() => {
                    mouseEvent.current.isDrag = true
                    mouseEvent.current.direction = 'left'
                    mouseEvent.current.dragIndex = target.dataset['index']
                    mouseEvent.current.cacheLeft = zoomDatas[target.dataset['index']].left
                    mouseEvent.current.cacheWidth = zoomDatas[target.dataset['index']].width
                    mouseEvent.current.targetDom = target
                    mouseEvent.current.status = 0
                }, 0) as any;
            } else if (target.className.includes('zoom-item')) {
                // select zoom
                const index = target.dataset['index']
                const item = zoomDatas[index]
                showDrawer()
                requestAnimationFrame(() => {
                    const context = updateCanvasRef.current.getContext('2d')
                    const videoWidth = videoRef.current?.videoWidth
                    const videoHeight = videoRef.current?.videoHeight
                    const wScale = 400 / videoWidth
                    scaleInfoRef.current.updatescale = wScale;
                    const clientHeight = wScale * videoHeight
                    context.clearRect(0, 0, 400, clientHeight)
                    context.scale(wScale, wScale);
                    updateCanvasRef.current.height = clientHeight
                    scaleUpdateDivRef.current.style.height = clientHeight + 'px'
                    context.drawImage(videoRef.current, 0, 0, 400, clientHeight)
                    setAttentionEyesInfo({
                        selectIndex: index,
                        left: item.x,
                        top: item.y,
                        scale: item.scale,
                    });
                });
            }
        }

        const onMouseUp = () => {
            mouseEvent.current.isDrag = false
        }

        const onMouseLeave = () => {
            showZoomMask(false)
            mouseEvent.current.isDrag = false;
        }

        if (zoomRef.current) {
            zoomRef.current.addEventListener('mousemove', onMouseMove)
            zoomRef.current.addEventListener('mousedown', onMouseDown)
            zoomRef.current.addEventListener('mouseup', onMouseUp)
            zoomRef.current.addEventListener('mouseleave', onMouseLeave)
        }
        return () => {
            if (zoomRef!.current) {
                zoomRef!.current.removeEventListener('mousedown', onMouseDown)
                zoomRef!.current.removeEventListener('mousemove', onMouseMove)
                zoomRef!.current.removeEventListener('mouseup', onMouseUp)
                zoomRef!.current.removeEventListener('mouseleave', onMouseLeave)
            }
        }
    }, [zoomMaskInfo, zoomDatas])


    // eslint-disable-next-line react-hooks/exhaustive-deps
    const initMouseEvent = () => {
        console.log('initMouseEvent-----', videoRef)
        const width = timeLineRef.current?.clientWidth || 0
        const duration = (videoRef.current?.duration) || 0
        console.log('duration-----', duration, width)
        const scale = width / duration
        mouseEvent.current.mintimeline = ((scale * 1) / width * 100)
        mouseEvent.current.minWidth = Math.round(mouseEvent.current.mintimeline * minsecondes)
        mouseEvent.current.duration = duration
        // if (zoomDatas.length) {
        //     console.log('zoomDatas-----', zoomDatas, scale)
        // }
        const hScale = videoRef.current.clientHeight / videoRef.current.videoHeight
        scaleInfoRef.current.perviewScale = hScale;
        videoRef.current.style.width = videoRef.current.videoWidth * hScale + 'px'
        plyrCanvasRef.current.width = videoRef.current.videoWidth * hScale
        plyrCanvasRef.current.height = videoRef.current.clientHeight
        setTimeout(() => {
            drawVideoFrame();
        }, 1000);
        setPlayInfo((per) => {
            return {
                ...per,
                duration,
            }
        })
        setZoomMaskInfo(per => {
            return {
                ...per,
                width: mouseEvent.current.minWidth
            }
        })
    }
    useEffect(() => {
        const updateScrubber = () => {
            requestAnimationFrame(() => {
                const time = videoRef.current.currentTime
                const duration = mouseEvent.current.duration
                let position = (time / duration) * 100
                if (time === 0) {
                    position = 0
                }
                setProgressInfo(per => {
                    return {
                        ...per,
                        current: position
                    }
                })
                setPlayInfo((per) => {
                    return {
                        ...per,
                        current: time,
                    }
                })
                if (!playInfo.playing) {
                    if (timer) clearTimeout(timer);
                    timer = setTimeout(() => {
                        drawVideoFrame()
                        clearTimeout(timer)
                        timer = null
                    }, 500) as any;
                }
            })
        }
        const handelEnded = () => {
            setPlayInfo((per) => {
                return {
                    ...per,
                    playing: false,
                }
            })
        }
        /**
         * 初始化 时间轴
         */
        const handleLoadedmetadata = () => {
            initMouseEvent()
        }
        const handleLoadstart = () => {

        }
        if (videoRef.current) {
            videoRef.current.addEventListener('timeupdate', updateScrubber)
            videoRef.current.addEventListener('ended', handelEnded)
            videoRef.current.addEventListener('loadedmetadata', handleLoadedmetadata)
            videoRef.current.addEventListener('loadstart', handleLoadstart)
        }
        return () => {
            if (videoRef!.current) {
                videoRef!.current.removeEventListener('timeupdate', handelEnded)
                videoRef!.current.removeEventListener('ended', handelEnded)
                videoRef!.current.addEventListener('loadedmetadata', handleLoadedmetadata)
                videoRef!.current.removeEventListener('loadstart', handleLoadstart)
            }
        }
    }, [initMouseEvent, zoomDatas])

    const showZoomMask = (status: boolean) => {
        if (zoomMaskRef.current) {
            zoomMaskRef.current.style.opacity = status ? '1' : '0';
        }
    }
    const getMaskStatus = () => {
        if (zoomMaskRef.current) {
            return zoomMaskRef.current.style.opacity === String(1);
        }
        return true
    }

    // 更新视图
    useEffect(() => {
        console.log('更新视图 zoomDatas-----', zoomDatas)
        drawVideoFrame();
    }, [zoomDatas])

    /**
     * 点击播放/暂停
     */
    const onVideoPlay = () => {
        !playInfo.playing ? (videoRef.current?.play(), drawVideoFrame(1)) : videoRef.current?.pause()
        setPlayInfo(per => {
            return {
                ...per,
                playing: !playInfo.playing
            }
        })
    }

    /**
     * 
     * 删除锚点
     */
    const onDeleteZoomItem = () => {
        if (attentionEyesInfo.selectIndex < 0) return
        const newDatas = [...zoomDatas]
        newDatas.splice(attentionEyesInfo.selectIndex, 1)
        setZoomDatas(newDatas)
        setAttentionEyesInfo((per => {
            return {
                ...per,
                selectIndex: -1
            }
        }))
        onClose();
    
    }

    const onSaveFrame = async () => {

    }

    /**
     * 缩放程度
     * @param
     */
    const onScaleChange = (e) => {
        setAttentionEyesInfo((per) => {
            return {
                ...per,
                scale: e.target.value
            }
        })
        if (attentionEyesInfo.selectIndex !== -1) {
            const newZoomDatas = [...zoomDatas]
            newZoomDatas[attentionEyesInfo.selectIndex] = {
                ...newZoomDatas[attentionEyesInfo.selectIndex],
                scale: e.target.value,
            }
            setZoomDatas(() => [...newZoomDatas])
        }
    }

    /**
     * 绘制视频
     */
    const drawVideoFrame = (type = 0) => {
        if (type === 0) {
            console.log('drawVideoFrame----', zoomDatas)
        }
        if (type === 0 || (!videoRef.current.paused && !videoRef.current.ended)) {
            const context = plyrCanvasRef.current.getContext('2d')
            const cw = plyrCanvasRef.current.width
            const ch = plyrCanvasRef.current.height
            context.scale(1, 1);
            context.clearRect(0, 0, cw, ch);
            context.save()
            // context.scale(newScaleW, newScaleH);
            // 当前缩放帧数据
            let { index, event, lastScale, wscale, hscale, sx, sy} = renderFrameInfo.current

            if (zoomDatas.length > 0) {
                const effectFrames = getEffectFramesByZooms([...zoomDatas], videoRef.current.duration,
                    scaleInfoRef.current.updatescale, scaleInfoRef.current.perviewScale)
                // 检索帧
                if (!event) {
                    renderFrameInfo.current.tIndex = 0
                    renderFrameInfo.current.tReset = true
                    for (let i = index; i < effectFrames.length; i++) {
                        const { start, t } = effectFrames[i]
                        if (start <= videoRef.current.currentTime && videoRef.current.currentTime <= start + t) {
                            event = effectFrames[i]
                            renderFrameInfo.current.event = event
                            renderFrameInfo.current.index = i + 1
                            // renderFrameInfo.current.tx = (event as any).x
                            // renderFrameInfo.current.ty = (event as any).y
                            console.log('检索帧 event----', event)
                            break
                        }
                    }
                }
                // 处理帧
                if (event) {
                    if (type === 0 && effectFrames.length && effectFrames[index - 1]) {
                        console.log('处理帧 event----', effectFrames, event, index)
                        event = effectFrames[index - 1]
                        renderFrameInfo.current.event = event
                    }
                    let {x, y , start, t, children, scale = SCALE_DEFAULT} = event as any
                    // x = x * scaleInfoRef.current.perviewScale
                    // y = y * scaleInfoRef.current.perviewScale
                    // 记录移动x\y;解决缩放帧还原空白
                    // if (renderFrameInfo.current.tReset === true) {
                    //     renderFrameInfo.current.sx = x
                    //     renderFrameInfo.current.sy = y
                    // }
                    let newScale = 1
                    // 开始帧
                    if (videoRef.current.currentTime - MIN_FRAME_MOD_TIME > start 
                    ) {
                        newScale = newScale + (videoRef.current.currentTime - start) / (MIN_FRAME_MOD_TIME) * (scale - 1)
                        newScale = newScale > scale ? scale : newScale;
                        lastScale = newScale
                        console.log(' 开始帧 newScale----', videoRef.current.currentTime, scale, newScale);
                        renderFrameInfo.current.lastScale = lastScale
                    }
                    // 结束帧
                    if (videoRef.current.currentTime >= start + t - MIN_FRAME_MOD_TIME && videoRef.current.currentTime < start + t ) {
                        // console.log('结束帧', renderFrameInfo.current)
                        newScale = lastScale - ((lastScale - 1) - (start + t - videoRef.current.currentTime) / MIN_FRAME_MOD_TIME * (lastScale - 1))
                        console.log('结束帧 newScale----', newScale);
                        newScale = newScale < 1 ? 1 : newScale;
                    }
                    // 持续帧
                    if (videoRef.current.currentTime >= start  && videoRef.current.currentTime <= start + t - MIN_FRAME_MOD_TIME ) {
                        newScale = lastScale
                    }
                
                    // x = renderFrameInfo.current.sx
                    // y = renderFrameInfo.current.sy
                    console.log('newScale----', x, y);
                    context.translate(x, y);
                    context.scale(newScale, newScale);
                    context.translate(-x, -y);

                    if (videoRef.current.currentTime >= start + t) {
                        event = null
                        renderFrameInfo.current.event = event
                        renderFrameInfo.current.index = 0
                    }
                }
            }
            context.drawImage(videoRef.current, 0, 0, cw, ch)
            context.restore()
            if (type === 1) {
                requestAnimationFrame(drawVideoFrame.bind(this, type))
            }
        }
    }

    const onDownLoad = async () => {
        if (!downUrl) return;
    }
    return <>
        <div className="videoPlayer" style={{ minWidth: playerRect.width + 'px', maxWidth: playerRect.width + 'px', }}>
            <div className="playerWrap">
                <div className="plyr--video" ref={plyrVideoRef}>
                    <div className="desc"> Upload Video</div>
                    <video className="ply-video opacity-0" src="" ref={videoRef}></video>
                    <canvas className="ply-video-canvas" ref={plyrCanvasRef} ></canvas>
                    {/* <div className="dropdown" style={{ left: `${attentionEyesInfo.left}px`, top: `${attentionEyesInfo.top}px`, display: attentionEyesInfo.selectIndex > -1 ? 'block' : 'none' }}>
                        <div className="attention-eyes" > </div>
                        <div className="dropdown-opreation">
                            <input type="range" onChange={onScaleChange} value={attentionEyesInfo.scale * 100} min={1} max={10} className="zoom-setting"></input>
                        </div>
                    </div> */}

                </div>
            </div>
            <div className="control">
                <div className="operation">
                    <div style={{ display: 'flex', }}>
                        <button className="button default" onClick={onVideoPlay} disabled={!playInfo.status}>
                            {playInfo.playing ? '暂  停' : '播  放'}
                        </button>

                    </div>
                    <div style={{ color: '#666666', }}>
                        {formatSecondsToHMS(playInfo.current || 0)} / {formatSecondsToHMS(playInfo.duration)}
                    </div>
                    <div style={{ display: 'flex', }}>
                        <button className="button default" onClick={onSaveFrame} disabled={!playInfo.status || !playInfo.update}>
                            导&nbsp;&nbsp;出
                        </button>
                        {
                            downUrl ? <>
                                <button className="button default" onClick={onDownLoad}>
                                    预览视频
                                </button>
                                {/* <button className="button default" onClick={() => window.location.href = downUrl}>
									预览结果
								</button> */}
                            </>
                                : null
                        }

                    </div>
                </div>
                <div className="time-line" ref={timeLineRef} style={{ pointerEvents: !playInfo.status ? 'none' : 'auto' }}>
                    <div className="time-line-progress" style={{ left: `${progressInfo.current}%` }}></div>
                    <div className="time-line-progress time-line-progress-mark" style={{ left: `${progressInfo.move}%` }}></div>
                    <div className="video-frame-line">
                        <div className="video-frame-progress" style={{ width: `${progressInfo.current}%` }}></div>
                    </div>
                    <div className="attention-control" ref={zoomRef}>
                        <div className="zoom-mark" ref={zoomMaskRef} style={{ left: `${zoomMaskInfo.current}%`, width: `${zoomMaskInfo.width}%` }}>+</div>
                        {
                            zoomDatas.length === 0
                                ? <div className="tip"> click add zoom</div>
                                : zoomDatas.map((item, index) => {
                                    return <div className="zoom-item" data-index={index} style={{ left: `${item.left}%`, width: `${item.width}%` }} key={item.id}>
                                        <div className="zoom-item-left" data-index={index} ></div>
                                        <div className="zoom-item-right" data-index={index} ></div>
                                    </div>
                                })
                        }
                    </div>
                </div>
            </div>
        </div>
        <Drawer title="Scale" keyboard={false} width={450} maskClosable={false} onClose={onClose} open={open} zIndex={999999}>
            <p>
                Position：
                <div className="scale-update" ref={scaleUpdateDivRef}>
                    <canvas width={400} ref={updateCanvasRef}></canvas>
                    <div className="dropdown" style={{ left: `${attentionEyesInfo.left}px`, top: `${attentionEyesInfo.top}px`, display: attentionEyesInfo.selectIndex > -1 ? 'block' : 'none' }}>
                        <div className="attention-eyes" > </div>
                    </div>
                </div>
            </p>
            <p style={{ marginTop: '24px' }}>
                Zoom Scale:
                <input type="range" onChange={onScaleChange} step={0.1} value={attentionEyesInfo.scale} min={1} max={2} className="zoom-setting"></input>
            </p>
            <p>
                {
                    attentionEyesInfo.selectIndex !== -1
                        ? <button className="button default" onClick={onDeleteZoomItem} >删&nbsp;&nbsp;除</button>
                        : null
                }
            </p>
        </Drawer>
    </>
}

export default VideoPlayer