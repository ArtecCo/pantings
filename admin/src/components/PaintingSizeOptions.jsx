import { useMemo } from 'react'

export default function PaintingSizeOptions({ sizes = [], value = [], onChange }) {
  const defaults = useMemo(() => sizes.filter(size => Number(size.is_active) === 1), [sizes])
  const options = Array.isArray(value) ? value : []

  const update = (index, patch) => onChange(options.map((item, i) => i === index ? { ...item, ...patch } : item))
  const add = () => {
    const fallback = defaults[0]
    onChange([...options, fallback
      ? { name: fallback.name, width: fallback.width, height: fallback.height, unit: fallback.unit || 'in', price: '', is_standard: options.length === 0 }
      : { name: '', width: '', height: '', unit: 'in', price: '', is_standard: options.length === 0 }
    ])
  }
  const remove = index => {
    if (options.length <= 1) return
    const next = options.filter((_, i) => i !== index)
    if (!next.some(item => item.is_standard)) next[0] = { ...next[0], is_standard: true }
    onChange(next)
  }
  const selectDefault = (index, id) => {
    const selected = defaults.find(size => String(size.id) === String(id))
    if (selected) update(index, { name: selected.name, width: selected.width, height: selected.height, unit: selected.unit || 'in' })
  }

  return <div className="painting-size-options">
    <div className="size-options-head">
      <div><label>Sizes & Pricing</label><p>Add every size offered for this painting. Each size has its own price; choose one as the standard size.</p></div>
      <button type="button" className="size-add-button" onClick={add}>+ Add Size</button>
    </div>
    {!options.length && <div className="size-empty">No sizes added yet. Add at least one size.</div>}
    {options.map((item, index) => {
      const matchingDefault = defaults.find(size => String(size.name) === String(item.name) && Number(size.width) === Number(item.width) && Number(size.height) === Number(item.height))
      return <div className={`size-option-row ${item.is_standard ? 'is-standard' : ''}`} key={index}>
        <div className="size-option-index">{String(index + 1).padStart(2, '0')}</div>
        <div className="size-option-fields">
          <select value={matchingDefault ? String(matchingDefault.id) : ''} onChange={e => selectDefault(index, e.target.value)}>
            <option value="">Custom size</option>
            {defaults.map(size => <option key={size.id} value={size.id}>{size.name} — {size.width} × {size.height} {size.unit}</option>)}
          </select>
          <input type="text" placeholder="Size name" value={item.name || ''} onChange={e => update(index, { name: e.target.value })} />
          <input type="number" min="0.01" step="0.01" placeholder="Width" value={item.width ?? ''} onChange={e => update(index, { width: e.target.value })} />
          <input type="number" min="0.01" step="0.01" placeholder="Height" value={item.height ?? ''} onChange={e => update(index, { height: e.target.value })} />
          <select value={item.unit || 'in'} onChange={e => update(index, { unit: e.target.value })}><option value="in">in</option><option value="cm">cm</option></select>
          <div className="size-price-input"><span>₹</span><input type="number" min="0" step="0.01" placeholder="Price" value={item.price ?? ''} onChange={e => update(index, { price: e.target.value })} /></div>
        </div>
        <label className="size-standard-toggle"><input type="radio" name="painting-standard-size" checked={Boolean(item.is_standard)} onChange={() => onChange(options.map((option, i) => ({ ...option, is_standard: i === index })))} /><span>Standard</span></label>
        <button type="button" className="size-remove-button" onClick={() => remove(index)} disabled={options.length <= 1} aria-label="Remove size">×</button>
      </div>
    })}
  </div>
}
