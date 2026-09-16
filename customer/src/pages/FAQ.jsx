import { useEffect, useState } from 'react'
import { apiUrl } from '../config/api'
import './FAQ.css'

export default function FAQ() {
  const [faqs, setFaqs] = useState([])
  const [open, setOpen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(apiUrl('faqs/list.php'), { cache: 'no-store' })
      .then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok || !d.success) throw new Error(d.message || 'Unable to load FAQs'); return d })
      .then(d => setFaqs(d.faqs || []))
      .catch(e => setError(e.message || 'Unable to load FAQs'))
      .finally(() => setLoading(false))
  }, [])

  return <main className="faq-page">
    <div className="faq-hero"><span className="faq-eyebrow">CUSTOMER ASSISTANCE</span><h1>Frequently Asked Questions</h1><p>Answers to common questions about ARAmane Arts.</p></div>
    <div className="faq-list">
      {loading && <p className="faq-state">Loading FAQs...</p>}
      {!loading && error && <p className="faq-state">{error}</p>}
      {!loading && !error && faqs.length === 0 && <p className="faq-state">No FAQs are available at the moment.</p>}
      {!loading && !error && faqs.map(faq => {
        const isOpen = open === faq.id
        return <section className={`faq-item${isOpen ? ' open' : ''}`} key={faq.id}>
          <button type="button" className="faq-question" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : faq.id)}>
            <span>{faq.question}</span><span className="faq-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
          </button>
          <div className="faq-answer-wrap" aria-hidden={!isOpen}>
            <div className="faq-answer">{faq.answer}</div>
          </div>
        </section>
      })}
    </div>
  </main>
}
