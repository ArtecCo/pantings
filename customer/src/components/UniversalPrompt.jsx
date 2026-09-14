import { useEffect } from 'react'
import './UniversalPrompt.css'

export default function UniversalPrompt({ open, eyebrow = 'CONFIRM ACTION', title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, loading = false, danger = false }) {
  useEffect(() => { if (!open) return undefined; const keyDown = event => { if (event.key === 'Escape' && !loading) onCancel?.() }; document.addEventListener('keydown', keyDown); return () => document.removeEventListener('keydown', keyDown) }, [open, loading, onCancel])
  if (!open) return null
  return <div className="ara-universal-prompt-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !loading) onCancel?.() }}><section className="ara-universal-prompt" role="dialog" aria-modal="true" aria-labelledby="ara-prompt-title"><span className="ara-universal-prompt-eyebrow">{eyebrow}</span><h2 id="ara-prompt-title">{title}</h2><p>{message}</p><div className="ara-universal-prompt-actions"><button type="button" className="ara-universal-prompt-cancel" onClick={onCancel} disabled={loading}>{cancelLabel}</button><button type="button" className={`ara-universal-prompt-confirm ${danger ? 'is-danger' : ''}`} onClick={onConfirm} disabled={loading}>{loading ? 'Please wait…' : confirmLabel}</button></div></section></div>
}
