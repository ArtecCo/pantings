import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'

function openNativeSelect(event) {
  if (event.key !== 'Enter') return

  event.preventDefault()

  const select = event.currentTarget

  if (typeof select.showPicker === 'function') {
    try {
      select.showPicker()
      return
    } catch {
      // Fall back to click below.
    }
  }

  select.click()
}

export default function AddPainting() {
  const navigate = useNavigate()
const { toast } = useToast()
  
  const [categories, setCategories] = useState([])
  const [frames, setFrames] = useState([])
  const [sizes, setSizes] = useState([])

  const [loadingMetadata, setLoadingMetadata] = useState(true)
  const [metadataError, setMetadataError] = useState('')

  const [selectedSize, setSelectedSize] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
const [imagePreviews, setImagePreviews] = useState([])

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    width: '',
    height: '',
    frame: '',
    goldDetails: '',
    status: 'available',
  })

  useEffect(() => {
    loadMetadata()
  }, [])


  const loadMetadata = async () => {
    setLoadingMetadata(true)
    setMetadataError('')

    try {
      const [
        categoriesResponse,
        framesResponse,
        sizesResponse,
      ] = await Promise.all([
        fetch(`${API}/categories/list.php`, {
          credentials: 'include',
        }),

        fetch(`${API}/frames/list.php`, {
          credentials: 'include',
        }),

        fetch(`${API}/sizes/list.php`, {
          credentials: 'include',
        }),
      ])

      const categoriesData = await categoriesResponse.json()
      const framesData = await framesResponse.json()
      const sizesData = await sizesResponse.json()

      if (!categoriesData.success) {
        throw new Error(
          categoriesData.message || 'Unable to load categories'
        )
      }

      if (!framesData.success) {
        throw new Error(
          framesData.message || 'Unable to load frames'
        )
      }

      if (!sizesData.success) {
        throw new Error(
          sizesData.message || 'Unable to load default sizes'
        )
      }

      setCategories(categoriesData.categories || [])
      setFrames(framesData.frames || [])
      setSizes(sizesData.sizes || [])

    } catch (error) {
      console.error('Metadata loading error:', error)


      toast.error(
        error.message || 'Unable to load catalogue metadata'
      )

    } finally {
      setLoadingMetadata(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSizeChange = (e) => {
    const sizeId = e.target.value

    setSelectedSize(sizeId)

    if (!sizeId) {
      setForm((previous) => ({
        ...previous,
        width: '',
        height: '',
      }))

      return
    }

    const selected = sizes.find(
      (size) => String(size.id) === String(sizeId)
    )

    if (!selected) return

    setForm((previous) => ({
      ...previous,
      width: selected.width,
      height: selected.height,
    }))
  }

  const handleImageChange = (event) => {
  const files = Array.from(event.target.files || [])

  if (!files.length) return

  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not a valid image.`)
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} is larger than 10 MB.`)
      return false
    }

    return true
  })

  if (!validFiles.length) return

  setSelectedImages(validFiles)

  const previews = validFiles.map(file => ({
    file,
    url: URL.createObjectURL(file)
  }))

  setImagePreviews(previews)

  // Allow selecting the same files again later
  event.target.value = ''
}

const uploadPaintingImages = async (paintingId) => {
  if (!selectedImages.length) return true

  const formData = new FormData()

  formData.append('painting_id', paintingId)

  selectedImages.forEach(file => {
    formData.append('images[]', file)
  })

  const response = await fetch(
    `${API}/paintings/upload-images.php`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData
    }
  )

  const raw = await response.text()

  let data

  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error(
      `Image upload returned an invalid response (HTTP ${response.status})`
    )
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || 'Unable to upload painting images'
    )
  }

  return true
}

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(
        `${API}/paintings/create.php`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(form),
        }
      )

      const raw = await response.text()

      let data

      try {
        data = JSON.parse(raw)
      } catch {
        console.error('Server returned non-JSON:', raw)

        toast.error(
            `Server returned an invalid response (HTTP ${response.status})`
        )

        return
      }

      if (!response.ok || !data.success) {
        toast.error(
          'Unable to create painting'
        )

        return
      }

      const paintingId =
  data.painting_id ||
  data.id ||
  data.painting?.id

if (!paintingId) {
  throw new Error(
    'Painting was created, but the painting ID was not returned by the server'
  )
}

if (selectedImages.length) {
  toast.info('Painting created. Uploading images...')

  await uploadPaintingImages(paintingId)

  toast.success('Painting and images saved successfully')
} else {
  toast.success('Painting created successfully')
}

setTimeout(() => {
  navigate('/paintings')
}, 900)

    } catch (error) {
      console.error(error)

      toast.error(
        'Unable to connect to the server'
      )
    }
  }

  return (
    <div className="painting-form-page">

      <div className="page-header">

        <div>
          <span className="eyebrow">
            ART COLLECTION
          </span>

          <h1>Add Painting</h1>

          <p>
            Add a new work to the ARAmane Arts collection.
          </p>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/paintings')}
        >
          ← Back to Paintings
        </button>

      </div>

      <div className="gold-rule" />


      {loadingMetadata ? (

        <div className="heritage-card metadata-loading">
          Loading catalogue metadata...
        </div>

      ) : (

        <form
          className="painting-form"
          onSubmit={handleSubmit}
        >

          {/* =====================================================
              01 · ARTWORK
              ===================================================== */}

          <section className="heritage-card form-section">

            <div className="form-section-heading">

              <span className="eyebrow">
                01 · ARTWORK
              </span>

              <h2>Painting Details</h2>

              <p>
                Basic information about the artwork.
              </p>

            </div>

            <div className="form-grid">

              <div className="form-field form-field-wide">

                <label>Painting Name</label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Murugan · The Vel"
                  required
                />

              </div>

              <div className="form-field">

                <label>Category</label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  onKeyDown={openNativeSelect}
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  {categories
                    .filter(
                      (category) =>
                        Number(category.is_active) === 1
                    )
                    .map((category) => (
                      <option
                        key={category.id}
                        value={category.name}
                      >
                        {category.name}
                      </option>
                    ))}
                </select>

              </div>

              <div className="form-field">

                <label>Status</label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  onKeyDown={openNativeSelect}
                >
                  <option value="available">
                    Available
                  </option>

                  <option value="unavailable">
                    Unavailable
                  </option>
                </select>

              </div>

              <div className="form-field form-field-wide">

                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the artwork, its inspiration and heritage..."
                  rows="5"
                />

              </div>

            </div>

          </section>


          {/* =====================================================
              02 · SPECIFICATIONS
              ===================================================== */}

          <section className="heritage-card form-section">

            <div className="form-section-heading">

              <span className="eyebrow">
                02 · SPECIFICATIONS
              </span>

              <h2>Artwork Specifications</h2>

              <p>
                Dimensions, pricing and frame information.
              </p>

            </div>

            <div className="form-grid">

              <div className="form-field">

                <label>Price (₹)</label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="39500"
                  min="0"
                  step="0.01"
                  required
                />

              </div>


              <div className="form-field">

                <label>Default Size</label>

                <select
                  value={selectedSize}
                  onChange={handleSizeChange}
                  onKeyDown={openNativeSelect}
                >
                  <option value="">
                    Select standard size
                  </option>

                  {sizes
                    .filter(
                      (size) =>
                        Number(size.is_active) === 1
                    )
                    .map((size) => (
                      <option
                        key={size.id}
                        value={size.id}
                      >
                        {size.name} — {size.width} ×{' '}
                        {size.height} {size.unit}
                      </option>
                    ))}
                </select>

              </div>


              <div className="form-field">

                <label>Width</label>

                <input
                  type="number"
                  name="width"
                  value={form.width}
                  onChange={handleChange}
                  placeholder="18"
                  min="0"
                  step="0.01"
                  required
                />

              </div>


              <div className="form-field">

                <label>Height</label>

                <input
                  type="number"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  placeholder="24"
                  min="0"
                  step="0.01"
                  required
                />

              </div>


              <div className="form-field">

                <label>Frame</label>

                <select
                  name="frame"
                  value={form.frame}
                  onChange={handleChange}
                  onKeyDown={openNativeSelect}
                >
                  <option value="">
                    Select frame
                  </option>

                  {frames
                    .filter(
                      (frame) =>
                        Number(frame.is_active) === 1
                    )
                    .map((frame) => (
                      <option
                        key={frame.id}
                        value={frame.name}
                      >
                        {frame.name}
                      </option>
                    ))}
                </select>

              </div>


              <div className="form-field form-field-wide">

                <label>Gold Details</label>

                <input
                  name="goldDetails"
                  value={form.goldDetails}
                  onChange={handleChange}
                  placeholder="22K gold foil, embossed details..."
                />

              </div>

            </div>

          </section>


          {/* =====================================================
              03 · IMAGES
              ===================================================== */}

          <section className="heritage-card form-section">

            <div className="form-section-heading">

              <span className="eyebrow">
                03 · IMAGES
              </span>

              <h2>Painting Images</h2>

              <p>
                Upload the artwork images for the catalogue.
              </p>

            </div>

            <div className="image-upload-area">

              <div className="upload-symbol">
                ✦
              </div>

              <h3>
                Upload artwork images
              </h3>

              <p>
                Drag images here or choose files from your computer.
              </p>

              <label className="upload-button">
  Choose Images

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    onChange={handleImageChange}
  />
</label>

{imagePreviews.length > 0 && (
  <div className="image-carousel">
    {imagePreviews.map((preview, index) => (
      <div
        className={`image-carousel-card ${
          index === 0 ? 'image-carousel-card-primary' : ''
        }`}
        key={`${preview.file.name}-${index}`}
      >
        <img
          src={preview.url}
          alt={`Selected artwork ${index + 1}`}
        />

        <div className="image-carousel-info">
          <span>
            {index === 0
              ? 'Primary image'
              : `Image ${index + 1}`}
          </span>

          <small>{preview.file.name}</small>
        </div>
      </div>
    ))}
  </div>
)}

            </div>

          </section>


          {/* =====================================================
              ACTIONS
              ===================================================== */}

          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/paintings')}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="gold-outline-button"
            >
              Save Painting
            </button>

          </div>

        </form>
      )}

    </div>
  )
}