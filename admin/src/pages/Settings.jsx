import { useEffect, useState } from 'react'
import { apiUrl } from '../config/api'
import { useToast } from '../components/Toast'

export default function Settings() {
  const { toast } = useToast()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  const load = async () => {
    try {
      const response = await fetch(apiUrl('mail/groups.php'), { credentials: 'include', cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load mail groups')
      setGroups(data.groups || [])
    } catch (error) {
      toast.error(error.message || 'Unable to load mail groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateGroup = async (groupId, recipients) => {
    setSaving(groupId)
    try {
      const response = await fetch(apiUrl('mail/groups.php'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ group_id: groupId, recipients }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to update mail group')
      toast.success('Mail group updated successfully.')
      await load()
    } catch (error) {
      toast.error(error.message || 'Unable to update mail group')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="metadata-page"><div className="page-header"><div><span className="eyebrow">SYSTEM CONFIGURATION</span><h1>Settings</h1></div></div><div className="gold-rule"/><div className="heritage-card metadata-list"><div className="metadata-loading">Loading settings...</div></div></div>

  return (
    <div className="metadata-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">SYSTEM CONFIGURATION</span>
          <h1>Settings</h1>
          <p>Manage system notification recipients without leaving the admin panel.</p>
        </div>
      </div>
      <div className="gold-rule" />
      <div className="settings-mail-groups">
        {groups.map(group => (
          <MailGroupCard key={group.id} group={group} saving={saving === group.id} onSave={updateGroup} />
        ))}
      </div>
    </div>
  )
}

function MailGroupCard({ group, saving, onSave }) {
  const [recipients, setRecipients] = useState(() => (group.recipients || []).map(item => ({ name: item.recipient_name, email: item.recipient_email })))
  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')

  const addRecipient = () => {
    const name = draftName.trim()
    const email = draftEmail.trim().toLowerCase()
    if (!name || !email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    if (recipients.some(item => item.email.toLowerCase() === email)) return
    setRecipients(current => [...current, { name, email }])
    setDraftName('')
    setDraftEmail('')
  }

  return (
    <section className="heritage-card settings-mail-group">
      <div className="metadata-form-header">
        <div>
          <span className="eyebrow">{group.group_key.replace('_', ' ')}</span>
          <h2>{group.group_name}</h2>
          <p>{group.description}</p>
        </div>
      </div>
      <div className="settings-mail-from">
        <span>DELIVERY SOURCE</span>
        <strong>{group.group_key === 'ORDER_UPDATES' ? 'systems@arts.araha.co.in' : 'systems@arts.araha.co.in'}</strong>
      </div>
      <div className="settings-recipient-list">
        {recipients.map((recipient, index) => (
          <div className="settings-recipient" key={`${recipient.email}-${index}`}>
            <div><strong>{recipient.name}</strong><span>{recipient.email}</span></div>
            <button type="button" onClick={() => setRecipients(current => current.filter((_, i) => i !== index))}>Remove</button>
          </div>
        ))}
        {recipients.length === 0 && <div className="settings-empty">No recipients configured.</div>}
      </div>
      <div className="settings-add-recipient">
        <input value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Recipient name" />
        <input value={draftEmail} onChange={e => setDraftEmail(e.target.value)} placeholder="recipient@example.com" type="email" />
        <button type="button" className="cancel-button" onClick={addRecipient}>Add recipient</button>
      </div>
      <div className="metadata-form-actions">
        <button type="button" className="gold-outline-button" onClick={() => onSave(group.id, recipients)} disabled={saving}>{saving ? 'Saving...' : 'Save Mail Group'}</button>
      </div>
    </section>
  )
}
