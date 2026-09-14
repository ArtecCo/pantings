import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { apiUrl } from '../config/api'

function openNativeSelect(event) {
  if (event.key !== 'Enter') return
  event.preventDefault()
  const select = event.currentTarget
  if (typeof select.showPicker === 'function') {
    try { select.showPicker(); return } catch {}
  }
  select.click()
}

export default function EditPainting() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [frames, setFrames] = useState([])
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [form, setForm] = useState({ name:'', category:'', description:'', price:'', width:'', height:'', frame:'', goldDetails:'', status:'available' })

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [paintingResponse, categoriesResponse, framesResponse, sizesResponse] = await Promise.all([
        fetch(apiUrl(`paintings/get.php?id=${encodeURIComponent(id)}`), { credentials:'include' }),
        fetch(apiUrl('categories/list.php'), { credentials:'include' }),
        fetch(apiUrl('frames/list.php'), { credentials:'include' }),
        fetch(apiUrl('sizes/list.php'), { credentials:'include' })
      ])
      const paintingData = await paintingResponse.json().catch(() => ({}))
      const categoriesData = await categoriesResponse.json().catch(() => ({}))
      const framesData = await framesResponse.json().catch(() => ({}))
      const sizesData = await sizesResponse.json().catch(() => ({}))
      if (!paintingResponse.ok || !paintingData.success) throw new Error(paintingData.message || 'Unable to load painting')
      if (!categoriesResponse.ok || !categoriesData.success) throw new Error(categoriesData.message || 'Unable to load categories')
      if (!framesResponse.ok || !framesData.success) throw new Error(framesData.message || 'Unable to load frames')
      if (!sizesResponse.ok || !sizesData.success) throw new Error(sizesData.message || 'Unable to load sizes')
      const painting = paintingData.painting
      setCategories(categoriesData.categories || [])
      setFrames(framesData.frames || [])
      setSizes(sizesData.sizes || [])
      setForm({ name:painting.name || '', category:painting.category_name || '', description:painting.description || '', price:painting.price || '', width:painting.width || '', height:painting.height || '', frame:painting.frame || '', goldDetails:painting.gold_details || '', status:Number(painting.is_active) === 1 ? 'available' : 'unavailable' })
      const matchingSize = (sizesData.sizes || []).find(size => Number(size.width) === Number(painting.width) && Number(size.height) === Number(painting.height))
      setSelectedSize(matchingSize ? String(matchingSize.id) : '')
    } catch (error) {
      console.error('Edit painting load error:', error)
      toast.error(error.message || 'Unable to load painting')
    } finally { setLoading(false) }
  }

  const handleChange = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }))
  const handleSizeChange = event => {
    const sizeId = event.target.value
    setSelectedSize(sizeId)
    const selected = sizes.find(size => String(size.id) === String(sizeId))
    if (selected) setForm(previous => ({ ...previous, width:selected.width, height:selected.height }))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const response = await fetch(apiUrl('paintings/update.php'), {
        method:'PUT', credentials:'include', headers:{ 'Content-Type':'application/json', Accept:'application/json' },
        body:JSON.stringify({ id, ...form })
      })
      const raw = await response.text()
      let data
      try { data = JSON.parse(raw) } catch { throw new Error(`Server returned an invalid response (HTTP ${response.status})`) }
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to update painting')
      toast.success('Painting updated successfully')
      setTimeout(() => navigate('/paintings'), 1200)
    } catch (error) {
      console.error('Painting update error:', error)
      toast.error(error.message || 'Unable to update painting')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="painting-form-page"><div className="page-header"><div><span className="eyebrow">ART COLLECTION</span><h1>Edit Painting</h1><p>Loading artwork details...</p></div></div><div className="gold-rule" /><div className="heritage-card metadata-loading">Loading painting...</div></div>

  return (
    <div className="painting-form-page">
      <div className="page-header"><div><span className="eyebrow">ART COLLECTION</span><h1>Edit Painting</h1><p>Update the artwork details in the ARAmane Arts collection.</p></div><button type="button" className="back-button" onClick={() => navigate('/paintings')}>← Back to Paintings</button></div>
      <div className="gold-rule" />
      <form className="painting-form" onSubmit={handleSubmit}>
        <section className="heritage-card form-section"><div className="form-section-heading"><span className="eyebrow">01 · ARTWORK</span><h2>Painting Details</h2><p>Basic information about the artwork.</p></div><div className="form-grid">
          <div className="form-field form-field-wide"><label>Painting Name</label><input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Murugan · The Vel" required /></div>
          <div className="form-field"><label>Category</label><select name="category" value={form.category} onChange={handleChange} onKeyDown={openNativeSelect} required><option value="">Select category</option>{categories.filter(category => Number(category.is_active) === 1).map(category => <option key={category.id} value={category.name}>{category.name}</option>)}</select></div>
          <div className="form-field"><label>Status</label><select name="status" value={form.status} onChange={handleChange} onKeyDown={openNativeSelect}><option value="available">Available</option><option value="unavailable">Unavailable</option></select></div>
          <div className="form-field form-field-wide"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the artwork, its inspiration and heritage..." rows="5" /></div>
        </div></section>
        <section className="heritage-card form-section"><div className="form-section-heading"><span className="eyebrow">02 · SPECIFICATIONS</span><h2>Artwork Specifications</h2><p>Dimensions, pricing and frame information.</p></div><div className="form-grid">
          <div className="form-field"><label>Price (₹)</label><input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" required /></div>
          <div className="form-field"><label>Default Size</label><select value={selectedSize} onChange={handleSizeChange} onKeyDown={openNativeSelect}><option value="">Custom size</option>{sizes.filter(size => Number(size.is_active) === 1).map(size => <option key={size.id} value={size.id}>{size.name} — {size.width} × {size.height} {size.unit}</option>)}</select></div>
          <div className="form-field"><label>Width</label><input type="number" name="width" value={form.width} onChange={handleChange} min="0" step="0.01" required /></div>
          <div className="form-field"><label>Height</label><input type="number" name="height" value={form.height} onChange={handleChange} min="0" step="0.01" required /></div>
          <div className="form-field"><label>Frame</label><select name="frame" value={form.frame} onChange={handleChange} onKeyDown={openNativeSelect}><option value="">Select frame</option>{frames.filter(frame => Number(frame.is_active) === 1).map(frame => <option key={frame.id} value={frame.name}>{frame.name}</option>)}</select></div>
          <div className="form-field form-field-wide"><label>Gold Details</label><input name="goldDetails" value={form.goldDetails} onChange={handleChange} placeholder="22K gold foil, embossed details..." /></div>
        </div></section>
        <section className="heritage-card form-section"><div className="form-section-heading"><span className="eyebrow">03 · IMAGES</span><h2>Painting Images</h2><p>Image management will be connected next.</p></div><div className="image-upload-area"><div className="upload-symbol">✦</div><h3>Image management</h3><p>Existing image upload controls will be connected after the artwork editing workflow is complete.</p></div></section>
        <div className="form-actions"><button type="button" className="cancel-button" onClick={() => navigate('/paintings')} disabled={saving}>Cancel</button><button type="submit" className="gold-outline-button" disabled={saving}>{saving ? 'Saving...' : 'Update Painting'}</button></div>
      </form>
    </div>
  )
}
