(() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
  const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  const midpoint = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 })

  const readTransform = image => {
    const transform = getComputedStyle(image).transform
    if (!transform || transform === 'none') return { scale: 1, x: 0, y: 0 }
    const match = transform.match(/^matrix\(([^)]+)\)$/)
    if (!match) return { scale: 1, x: 0, y: 0 }
    const values = match[1].split(',').map(Number)
    return {
      scale: Math.sqrt((values[0] || 1) ** 2 + (values[1] || 0) ** 2),
      x: values[4] || 0,
      y: values[5] || 0,
    }
  }

  const enhance = root => {
    if (!root || root.dataset.touchZoomReady === '1') return
    const stage = root.querySelector('.ara-art-viewer-stage')
    const canvas = root.querySelector('.ara-art-viewer-canvas')
    const image = root.querySelector('.ara-art-viewer-image')
    if (!stage || !canvas || !image) return
    root.dataset.touchZoomReady = '1'

    let scale = 1
    let panX = 0
    let panY = 0
    let gesture = null

    const syncFromComputed = () => {
      const current = readTransform(image)
      scale = clamp(current.scale, 1, 4)
      panX = current.x
      panY = current.y
    }

    const render = () => {
      image.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`
      image.dataset.touchScale = String(scale)
    }

    const onStart = event => {
      if (event.touches.length === 2) {
        syncFromComputed()
        const a = event.touches[0]
        const b = event.touches[1]
        gesture = {
          type: 'pinch',
          startDistance: Math.max(1, distance(a, b)),
          startScale: scale,
          startPanX: panX,
          startPanY: panY,
          startMidpoint: midpoint(a, b),
        }
        event.preventDefault()
        return
      }

      if (event.touches.length !== 1 || !event.target.closest('.ara-art-viewer-image, .ara-art-viewer-canvas')) return
      syncFromComputed()
      if (scale <= 1) return
      const touch = event.touches[0]
      gesture = {
        type: 'pan',
        startX: touch.clientX,
        startY: touch.clientY,
        startPanX: panX,
        startPanY: panY,
      }
      event.preventDefault()
    }

    const onMove = event => {
      if (!gesture) return

      if (gesture.type === 'pinch' && event.touches.length >= 2) {
        const a = event.touches[0]
        const b = event.touches[1]
        const ratio = distance(a, b) / gesture.startDistance
        scale = clamp(gesture.startScale * ratio, 1, 4)
        const mid = midpoint(a, b)
        panX = gesture.startPanX + (mid.x - gesture.startMidpoint.x)
        panY = gesture.startPanY + (mid.y - gesture.startMidpoint.y)
        render()
        event.preventDefault()
        return
      }

      if (gesture.type === 'pan' && event.touches.length === 1) {
        const touch = event.touches[0]
        panX = gesture.startPanX + touch.clientX - gesture.startX
        panY = gesture.startPanY + touch.clientY - gesture.startY
        render()
        event.preventDefault()
      }
    }

    const onEnd = event => {
      if (event.touches.length === 0) gesture = null
    }

    image.dataset.touchScale = '1'
    stage.addEventListener('touchstart', onStart, { passive: false })
    stage.addEventListener('touchmove', onMove, { passive: false })
    stage.addEventListener('touchend', onEnd, { passive: false })
    stage.addEventListener('touchcancel', onEnd, { passive: false })
  }

  const scan = () => document.querySelectorAll('.ara-art-viewer').forEach(enhance)
  const observer = new MutationObserver(scan)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  scan()
})()
