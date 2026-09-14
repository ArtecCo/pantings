import { useEffect, useId, useRef, useState } from 'react'
import './UniversalDropdown.css'

export default function UniversalDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  name,
  label,
  id,
  className = '',
  menuClassName = '',
}) {
  const generatedId = useId()
  const buttonId = id || `ara-dropdown-${generatedId}`
  const listboxId = `${buttonId}-listbox`
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const normalizedOptions = options.map((option) => typeof option === 'string'
    ? { value: option, label: option }
    : { ...option, value: String(option.value), label: option.label ?? String(option.value) }
  )

  const selectedIndex = normalizedOptions.findIndex((option) => String(option.value) === String(value))
  const selected = selectedIndex >= 0 ? normalizedOptions[selectedIndex] : null

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (selectedIndex >= 0) setActiveIndex(selectedIndex)
  }, [selectedIndex])

  const choose = (option) => {
    if (disabled || option.disabled) return
    onChange?.(option.value, option)
    setOpen(false)
  }

  const handleKeyDown = (event) => {
    if (disabled) return
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        setOpen(false)
      }
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
        return
      }
      setActiveIndex((current) => {
        if (!normalizedOptions.length) return 0
        const direction = event.key === 'ArrowDown' ? 1 : -1
        return (current + direction + normalizedOptions.length) % normalizedOptions.length
      })
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      if (!open || !normalizedOptions.length) return
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? 0 : normalizedOptions.length - 1)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
        return
      }
      const option = normalizedOptions[activeIndex]
      if (option) choose(option)
    }
  }

  return (
    <div className={`ara-universal-dropdown ${className}`.trim()} ref={rootRef}>
      {label && <span className="ara-universal-dropdown-label">{label}</span>}
      {name && <input type="hidden" name={name} value={value ?? ''} required={required} />}
      <button
        id={buttonId}
        type="button"
        className={`ara-universal-dropdown-trigger ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-required={required}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span className={selected ? '' : 'is-placeholder'}>{selected?.label || placeholder}</span>
        <span className="ara-universal-dropdown-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div id={listboxId} className={`ara-universal-dropdown-menu ${menuClassName}`.trim()} role="listbox" aria-labelledby={buttonId}>
          {normalizedOptions.length === 0 ? (
            <div className="ara-universal-dropdown-empty">No options available</div>
          ) : normalizedOptions.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={selectedIndex === index}
              disabled={option.disabled}
              className={`ara-universal-dropdown-option ${selectedIndex === index ? 'is-selected' : ''} ${activeIndex === index ? 'is-active' : ''}`}
              key={`${option.value}-${index}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {selectedIndex === index && <span className="ara-universal-dropdown-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
