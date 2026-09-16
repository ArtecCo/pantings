import { useEffect, useState } from 'react'
import { apiUrl } from '../config/api'
import { useToast } from '../components/Toast'

const empty = { question: '', answer: '', sort_order: 0, is_active: true }

export default function FAQs() {
  const { toast } = useToast()
  const [faqs, setFaqs] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const r = await fetch(apiUrl('faqs/admin.php'), { credentials: 'include', cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) throw new Error(d.message || 'Unable to load FAQs')
      setFaqs(d.faqs || [])
    } catch (e) { toast.error(e.message || 'Unable to load FAQs') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault()
    if (!form.question.trim() || !form.answer.trim()) return toast.error('Question and answer are required.')
    setSaving(true)
    try {
      const r = await fetch(apiUrl('faqs/admin.php'), {
        method: editing ? 'PUT' : 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(editing ? { ...form, id: editing } : form)
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) throw new Error(d.message || 'Unable to save FAQ')
      toast.success(d.message); setForm(empty); setEditing(null); load()
    } catch (e) { toast.error(e.message || 'Unable to save FAQ') }
    finally { setSaving(false) }
  }

  const remove = async id => {
    if (!window.confirm('Delete this FAQ?')) return
    try {
      const r = await fetch(apiUrl('faqs/admin.php'), { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) throw new Error(d.message || 'Unable to delete FAQ')
      toast.success(d.message); load()
    } catch (e) { toast.error(e.message || 'Unable to delete FAQ') }
  }

  return <div className="metadata-page">
    <div className="page-header"><div><span className="eyebrow">CUSTOMER SUPPORT</span><h1>FAQs</h1><p>Manage the questions and answers shown to customers.</p></div></div>
    <div className="gold-rule" />
    <section className="heritage-card" style={{ padding: 24, marginBottom: 24 }}>
      <div className="metadata-form-header"><div><span className="eyebrow">{editing ? 'EDIT FAQ' : 'NEW FAQ'}</span><h2>{editing ? 'Edit question' : 'Add a question'}</h2></div></div>
      <form onSubmit={save}>
        <div className="metadata-form-grid">
          <label>Question<input value={form.question} maxLength={500} onChange={e => setForm({ ...form, question: e.target.value })} /></label>
          <label>Display order<input type="number" min="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></label>
          <label style={{ gridColumn: '1 / -1' }}>Answer<textarea rows="6" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} /></label>
          <label><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        </div>
        <div className="metadata-form-actions"><button className="gold-outline-button" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add FAQ'}</button>{editing && <button type="button" className="cancel-button" onClick={() => { setEditing(null); setForm(empty) }}>Cancel</button>}</div>
      </form>
    </section>
    <section className="heritage-card metadata-list">
      <div className="metadata-form-header"><div><span className="eyebrow">FAQ LIBRARY</span><h2>Customer questions</h2></div></div>
      {loading ? <div className="metadata-loading">Loading FAQs...</div> : faqs.length === 0 ? <div className="metadata-loading">No FAQs have been added yet.</div> : faqs.map(faq => <div key={faq.id} style={{ borderBottom: '1px solid rgba(91,18,23,.12)', padding: '18px 0' }}><strong>{faq.question}</strong><p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{faq.answer}</p><div style={{ display: 'flex', gap: 10 }}><button type="button" className="cancel-button" onClick={() => { setEditing(faq.id); setForm({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order, is_active: !!Number(faq.is_active) }) }}>Edit</button><button type="button" className="cancel-button" onClick={() => remove(faq.id)}>Delete</button><span>{Number(faq.is_active) ? 'Active' : 'Hidden'}</span></div></div>)}
    </section>
  </div>
}
