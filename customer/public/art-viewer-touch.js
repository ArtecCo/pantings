(() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
  const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)

  const enhance = (root) => {
    if (!root || root.dataset.touchZoomReady === '1') return
    const stage = root.querySelector('.ara-art-viewer-stage')
    const image = root.querySelector('.ara-art-viewer-image')
    if (!stage || !image) return
    root.dataset.touchZoomReady = '1'

    let startDistance = 0
    let startScale = 1
    let pinchActive = false
    let raf = 0
    let pendingScale = 1

    const applyScale = () => {
      raf = 0
      image.style.setProperty('--ara-touch-scale', String(pendingScale))
      image.style.transform = `scale(${pendingScale})`
    }

    const onStart = (event) => {
      if (event.touches.length !== 2) return
      pinchActive = true
      startDistance = distance(event.touches[0], event.touches[1])
      startScale = Number(image.dataset.touchScale || 1)
      event.preventDefault()
    }

    const onMove = (event) => {
      if (!pinchActive || event.touches.length !== 2 || !startDistance) return
      const ratio = distance(event.touches[0], event.touches[1]) / startDistance
      pendingScale = clamp(startScale * ratio, 1, 4)
      image.dataset.touchScale = String(pendingScale)
      if (!raf) raf = requestAnimationFrame(applyScale)
      event.preventDefault()
    }

    const onEnd = (event) => {
      if (event.touches.length < 2) {
        pinchActive = false
        startDistance = 0
      }
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
