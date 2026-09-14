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
  const [images, setImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
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
      setImages(painting.images || [])
      setNewImages([])
      setForm({ name:painting.name || '', category:painting.category_name || '', description:painting.description || '', price:painting.price || '', width:painting.width || '', height:painting.height || '', frame:painting.frame || '', goldDetails:painting.gold_details || '', status:Number(painting.is_active) === 1 ? 'available' : 'unavailable' })
      const standardOption = (painting.size_options || []).find(size => Number(size.is_standard) === 1)
      const matchingSize = (sizesData.sizes || []).find(size => standardOption ? (Number(size.width) === Number(standardOption.width) && Number(size.height) === Number(standardOption.height) && String(size.unit || 'in') === String(standardOption.unit || 'in')) : (Number(size.width) === Number(painting.width) && Number(size.height) === Number(painting.height)))
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

  const handleNewImageChange = event => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    const valid = files.filter(file => {
      if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not a valid image.`); return false }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is larger than 10 MB.`); return false }
      return true
    })
    if (!valid.length) return
    setNewImages(previous => [...previous, ...valid])
  }

  const removePendingImage = index => setNewImages(previous => previous.filter((_, itemIndex) => itemIndex !== index))

  const uploadNewImages = async () => {
    if (!newImages.length) return
    const formData = new FormData()
    formData.append('painting_id', id)
    newImages.forEach(file => formData.append('images[]', file))
    const response = await fetch(apiUrl('paintings/upload-images.php'), { method:'POST', credentials:'include', body:formData })
    const raw = await response.text()
    let data
    try { data = JSON.parse(raw) } catch { throw new Error(`Image upload returned an invalid response (HTTP ${response.status})`) }
    if (!response.ok || !data.success) throw new Error(data.message || 'Unable to upload painting images')
    setImages(previous => [...previous, ...(data.images || [])])
    setNewImages([])
  }

  const deleteImage = async image => {
    if (imageBusy) return
    setImageBusy(true)
    try {
      const response = await fetch(apiUrl('paintings/delete-image.php'), { method:'DELETE', credentials:'include', headers:{ 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify({ image_id:Number(image.id) }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to delete image')
      setImages(previous => previous.filter(item => Number(item.id) !== Number(image.id)))
      if (Number(image.is_primary) === 1) setImages(previous => previous.map((item, index) => ({ ...item, is_primary: index === 0 ? 1 : 0 })))
      toast.success('Image deleted successfully')
    } catch (error) {
      console.error('Painting image delete error:', error)
      toast.error(error.message || 'Unable to delete image')
    } finally { setImageBusy(false) }
  }

  const setPrimaryImage = async image => {
    if (imageBusy || Number(image.is_primary) === 1) return
    setImageBusy(true)
    try {
      const response = await fetch(apiUrl('paintings/set-primary-image.php'), { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify({ painting_id:Number(id), image_id:Number(image.id) }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to set primary image')
      setImages(previous => previous.map(item => ({ ...item, is_primary:Number(item.id) === Number(image.id) ? 1 : 0 })))
      toast.success('Primary image updated')
    } catch (error) {
      console.error('Primary image update error:', error)
      toast.error(error.message || 'Unable to set primary image')
    } finally { setImageBusy(false) }
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const response = await fetch(apiUrl('paintings/update.php'), { method:'PUT', credentials:'include', headers:{ 'Content-Type':'application/json', Accept:'application/json' }, body:JSON.stringify({ id, ...form }) })
      const raw = await response.text()
      let data
      try { data = JSON.parse(raw) } catch { throw new Error(`Server returned an invalid response (HTTP ${response.status})`) }
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to update painting')
      if (newImages.length) {
        setImageBusy(true)
        toast.info('Painting updated. Uploading images...')
        await uploadNewImages()
        setImageBusy(false)
      }
      toast.success('Painting updated successfully')
      setTimeout(() => navigate('/paintings'), 900)
    } catch (error) {
      console.error('Painting update error:', error)
      setImageBusy(false)
      toast.error(error.message || 'Unable to update painting')
    } finally { setSaving(false) }
  }

  const imageSrc = image => image.image_url?.startsWith('http') ? image.image_url : image.image_url

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
        <section className="heritage-card form-section">
          <div className="form-section-heading"><span className="eyebrow">03 · IMAGES</span><h2>Painting Images</h2><p>Manage the existing artwork images, add new images and choose the primary image.</p></div>
          <div className="image-upload-area">
            <label className="upload-button">Add Images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNewImageChange} /></label>
            {(images.length > 0 || newImages.length > 0) && <div className="image-carousel">
              {images.map((image, index) => <div className={`image-carousel-card ${Number(image.is_primary) === 1 ? 'image-carousel-card-primary' : ''}`} key={`existing-${image.id}`}>
                <img src={imageSrc(image)} alt={`Artwork image ${index + 1}`} />
                <div className="image-carousel-info"><span>{Number(image.is_primary) === 1 ? 'Primary image' : `Image ${index + 1}`}</span><small>Uploaded artwork image</small></div>
                <div className="image-carousel-actions"><button type="button" className="gold-outline-button" onClick={() => setPrimaryImage(image)} disabled={imageBusy || Number(image.is_primary) === 1}>{Number(image.is_primary) === 1 ? 'Primary' : 'Make Primary'}</button><button type="button" className="cancel-button" onClick={() => deleteImage(image)} disabled={imageBusy}>Delete</button></div>
              </div>)}
              {newImages.map((file, index) => <div className="image-carousel-card" key={`new-${file.name}-${index}`}>
                <img src={URL.createObjectURL(file)} alt={`New artwork image ${index + 1}`} />
                <div className="image-carousel-info"><span>Pending upload</span><small>{file.name}</small></div>
                <div className="image-carousel-actions"><button type="button" className="cancel-button" onClick={() => removePendingImage(index)} disabled={imageBusy}>Remove</button></div>
              </div>)}
            </div>}
            {!images.length && !newImages.length && <div className="metadata-loading">No images uploaded for this painting yet.</div>}
            <p className="image-upload-note">Images are saved to the painting record. Deleting an existing image removes both its database record and uploaded file.</p>
          </div>
        </section>
        <div className="form-actions"><button type="button" className="cancel-button" onClick={() => navigate('/paintings')} disabled={saving || imageBusy}>Cancel</button><button type="submit" className="gold-outline-button" disabled={saving || imageBusy}>{saving || imageBusy ? 'Saving...' : 'Update Painting'}</button></div>
      </form>
    </div>
  )
}
