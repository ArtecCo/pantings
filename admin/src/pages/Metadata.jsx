import { useEffect, useState } from 'react'

const API = 'http://localhost/paintings/api'

const tabs = ['Categories', 'Frames', 'Default Sizes']

export default function Metadata() {
  const [activeTab, setActiveTab] = useState('Categories')
  const [showForm, setShowForm] = useState(false)

  const [categories, setCategories] = useState([])
  const [frames, setFrames] = useState([])
  const [sizes, setSizes] = useState([])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadCategories = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API}/categories/list.php`,
        { credentials: 'include' }
      )

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Unable to load categories')
        return
      }

      setCategories(data.categories || [])
    } catch (err) {
      console.error(err)
      setError('Unable to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  const loadFrames = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API}/frames/list.php`,
        { credentials: 'include' }
      )

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Unable to load frames')
        return
      }

      setFrames(data.frames || [])
    } catch (err) {
      console.error(err)
      setError('Unable to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  const loadSizes = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API}/sizes/list.php`,
        { credentials: 'include' }
      )

      const data = await response.json()

      if (!data.success) {
        setError(data.message || 'Unable to load sizes')
        return
      }

      setSizes(data.sizes || [])
    } catch (err) {
      console.error(err)
      setError('Unable to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'Categories') {
      loadCategories()
    }

    if (activeTab === 'Frames') {
      loadFrames()
    }

    if (activeTab === 'Default Sizes') {
      loadSizes()
    }
  }, [activeTab])

  const handleSaved = async (successMessage) => {
    setShowForm(false)
    setError('')
    setMessage(successMessage)

    if (activeTab === 'Categories') {
      await loadCategories()
    }

    if (activeTab === 'Frames') {
      await loadFrames()
    }

    if (activeTab === 'Default Sizes') {
      await loadSizes()
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setShowForm(false)
    setMessage('')
    setError('')
  }

  const addLabel =
    activeTab === 'Categories'
      ? 'Category'
      : activeTab === 'Frames'
        ? 'Frame'
        : 'Size'

  return (
    <div className="metadata-page">

      <div className="page-header">

        <div>
          <span className="eyebrow">
            CATALOGUE CONFIGURATION
          </span>

          <h1>Metadata</h1>

          <p>
            Manage the categories, frames and standard sizes
            used throughout the ARAmane Arts collection.
          </p>
        </div>

        <button
          className="gold-outline-button"
          onClick={() => {
            setMessage('')
            setError('')
            setShowForm(true)
          }}
        >
          + Add {addLabel}
        </button>

      </div>

      <div className="gold-rule" />

      {message && (
        <div className="metadata-success">
          {message}
        </div>
      )}

      {error && (
        <div className="metadata-error">
          {error}
        </div>
      )}

      <div className="metadata-tabs">

        {tabs.map((tab) => (
          <button
            key={tab}
            className={
              activeTab === tab
                ? 'metadata-tab active'
                : 'metadata-tab'
            }
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}

      </div>

      {showForm ? (
        <MetadataForm
          type={activeTab}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      ) : (
        <MetadataList
          type={activeTab}
          categories={categories}
          frames={frames}
          sizes={sizes}
          loading={loading}
        />
      )}

    </div>
  )
}


/* =========================================================
   FORM
   ========================================================= */

function MetadataForm({
  type,
  onClose,
  onSaved,
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [unit, setUnit] = useState('in')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isCategory = type === 'Categories'
  const isFrame = type === 'Frames'
  const isSize = type === 'Default Sizes'

  const handleSave = async () => {
  setError('')

  if (!name.trim()) {
    setError(
      isSize
        ? 'Display name is required'
        : 'Name is required'
    )
    return
  }

  if (isSize && (!width || !height)) {
    setError('Width and height are required')
    return
  }

  setSaving(true)

  try {
    let endpoint
    let body

    if (isCategory) {
      endpoint = `${API}/categories/create.php`
      body = {
        name: name.trim(),
        description: description.trim(),
      }
    }

    if (isFrame) {
      endpoint = `${API}/frames/create.php`
      body = {
        name: name.trim(),
        description: description.trim(),
      }
    }

    if (isSize) {
      endpoint = `${API}/sizes/create.php`
      body = {
        name: name.trim(),
        width: Number(width),
        height: Number(height),
        unit,
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // Read as text first so PHP errors are not hidden
    const raw = await response.text()

    let data

    try {
      data = JSON.parse(raw)
    } catch {
      console.error('Server returned non-JSON:', raw)
      setError(
        raw ||
        `Server returned an invalid response (HTTP ${response.status})`
      )
      return
    }

    if (!response.ok || !data.success) {
      setError(
        data.message ||
        `Unable to save. Server returned HTTP ${response.status}`
      )
      return
    }

    onSaved(
      isCategory
        ? 'Category added successfully.'
        : isFrame
          ? 'Frame added successfully.'
          : 'Default size added successfully.'
    )

  } catch (err) {
    console.error('Metadata save error:', err)
    setError('Unable to connect to the server')
  } finally {
    setSaving(false)
  }
}

  return (
    <div className="heritage-card metadata-form-card">

      <div className="metadata-form-header">

        <div>
          <span className="eyebrow">
            NEW {type.toUpperCase()}
          </span>

          <h2>
            Add {
              isCategory
                ? 'Category'
                : isFrame
                  ? 'Frame'
                  : 'Default Size'
            }
          </h2>
        </div>

        <button
          type="button"
          className="metadata-close"
          onClick={onClose}
        >
          ×
        </button>

      </div>


      <div className="metadata-form-grid">

        <div className="form-field form-field-wide">

          <label>
            {isSize ? 'Display Name' : 'Name'}
          </label>

          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder={
              isSize
                ? 'e.g. 18 × 24 in'
                : isCategory
                  ? 'e.g. Tanjore'
                  : 'e.g. Chettinad Mani Frame'
            }
          />

        </div>


        {!isSize && (
          <div className="form-field form-field-wide">

            <label>Description</label>

            <textarea
              rows="4"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder={
                isCategory
                  ? 'Describe this painting category...'
                  : 'Describe this frame...'
              }
            />

          </div>
        )}


        {isSize && (
          <>
            <div className="form-field">

              <label>Width</label>

              <input
                type="number"
                value={width}
                onChange={(e) =>
                  setWidth(e.target.value)
                }
                min="0"
                step="0.01"
                placeholder="18"
              />

            </div>

            <div className="form-field">

              <label>Height</label>

              <input
                type="number"
                value={height}
                onChange={(e) =>
                  setHeight(e.target.value)
                }
                min="0"
                step="0.01"
                placeholder="24"
              />

            </div>

            <div className="form-field">

              <label>Unit</label>

              <select
                value={unit}
                onChange={(e) =>
                  setUnit(e.target.value)
                }
              >
                <option value="in">Inches</option>
                <option value="cm">Centimetres</option>
              </select>

            </div>
          </>
        )}

      </div>


      {error && (
        <div className="metadata-error">
          {error}
        </div>
      )}


      <div className="metadata-form-actions">

        <button
          type="button"
          className="cancel-button"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="button"
          className="gold-outline-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

      </div>

    </div>
  )
}


/* =========================================================
   LIST
   ========================================================= */

function MetadataList({
  type,
  categories,
  frames,
  sizes,
  loading,
}) {

  if (loading) {
    return (
      <div className="heritage-card metadata-list">
        <div className="metadata-loading">
          Loading {type.toLowerCase()}...
        </div>
      </div>
    )
  }


  /* =========================
     CATEGORIES
     ========================= */

  if (type === 'Categories') {

    return (
      <MetadataContainer
        eyebrow="CATEGORIES"
        title="Painting Categories"
        count={categories.length}
      >

        {categories.length === 0 ? (
          <EmptyMetadata
            title="No categories yet"
            text="Add your first painting category."
          />
        ) : (
          <div className="metadata-items">

            {categories.map((category) => (
              <div
                className="metadata-item"
                key={category.id}
              >

                <div className="metadata-item-main">

                  <h3>
                    {category.name}
                  </h3>

                  {category.description && (
                    <p>
                      {category.description}
                    </p>
                  )}

                  <span className="metadata-slug">
                    /{category.slug}
                  </span>

                </div>

                <MetadataActions
                  active={Number(category.is_active) === 1}
                />

              </div>
            ))}

          </div>
        )}

      </MetadataContainer>
    )
  }


  /* =========================
     FRAMES
     ========================= */

  if (type === 'Frames') {

    return (
      <MetadataContainer
        eyebrow="FRAMES"
        title="Painting Frames"
        count={frames.length}
      >

        {frames.length === 0 ? (
          <EmptyMetadata
            title="No frames yet"
            text="Add your first frame to make it available throughout the catalogue."
          />
        ) : (
          <div className="metadata-items">

            {frames.map((frame) => (
              <div
                className="metadata-item"
                key={frame.id}
              >

                <div className="metadata-item-main">

                  <h3>
                    {frame.name}
                  </h3>

                  {frame.description && (
                    <p>
                      {frame.description}
                    </p>
                  )}

                </div>

                <MetadataActions
                  active={Number(frame.is_active) === 1}
                />

              </div>
            ))}

          </div>
        )}

      </MetadataContainer>
    )
  }


  /* =========================
     SIZES
     ========================= */

  return (
    <MetadataContainer
      eyebrow="DEFAULT SIZES"
      title="Standard Painting Sizes"
      count={sizes.length}
    >

      {sizes.length === 0 ? (
        <EmptyMetadata
          title="No default sizes yet"
          text="Add standard painting sizes to make them available when creating artwork."
        />
      ) : (
        <div className="metadata-items">

          {sizes.map((size) => (
            <div
              className="metadata-item"
              key={size.id}
            >

              <div className="metadata-item-main">

                <h3>
                  {size.name}
                </h3>

                <p>
                  {size.width} × {size.height} {size.unit}
                </p>

              </div>

              <MetadataActions
                active={Number(size.is_active) === 1}
              />

            </div>
          ))}

        </div>
      )}

    </MetadataContainer>
  )
}


/* =========================================================
   REUSABLE LIST CONTAINER
   ========================================================= */

function MetadataContainer({
  eyebrow,
  title,
  count,
  children,
}) {
  return (
    <div className="heritage-card metadata-list">

      <div className="metadata-list-header">

        <div>

          <span className="eyebrow">
            {eyebrow}
          </span>

          <h2>
            {title}
          </h2>

        </div>

        <span className="metadata-count">
          {count}{' '}
          {count === 1 ? 'item' : 'items'}
        </span>

      </div>

      {children}

    </div>
  )
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyMetadata({
  title,
  text,
}) {
  return (
    <div className="metadata-empty">

      <div className="metadata-empty-symbol">
        ✦
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </div>
  )
}


/* =========================================================
   ACTIONS
   ========================================================= */

function MetadataActions({ active }) {
  return (
    <div className="metadata-item-right">

      <span
        className={
          active
            ? 'metadata-status active'
            : 'metadata-status'
        }
      >
        {active ? 'Active' : 'Inactive'}
      </span>

      <button
        className="metadata-edit"
        type="button"
      >
        Edit
      </button>

    </div>
  )
}