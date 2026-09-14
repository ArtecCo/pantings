import './metadata-enhancer.js'

const API = 'http://localhost/paintings/api'
const state = { options: [], route: '' }
const normalize = option => ({ name: String(option.name || '').trim(), width: option.width, height: option.height, unit: option.unit || 'in', price: option.price, is_standard: Boolean(option.is_standard) })

function readFormValues() {
  const form = document.querySelector('.painting-form')
  if (!form) return null
  const value = name => form.querySelector(`[name="${name}"]`)?.value ?? ''
  return { price:value('price'), width:value('width'), height:value('height') }
}

function syncLegacyFields() {
  const standard = state.options.find(option => option.is_standard) || state.options.find(option => option.name && Number(option.width)>0 && Number(option.height)>0 && option.price !== '')
  if (!standard) return
  const values = readFormValues()
  if (!values) return
  const setValue = (name, value) => {
    const input = document.querySelector(`.painting-form [name="${name}"]`)
    if (!input) return
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value == null ? '' : value)
    input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }))
  }
  if (standard.price !== '' && standard.price != null) setValue('price', standard.price)
  if (standard.width !== '' && standard.width != null) setValue('width', standard.width)
  if (standard.height !== '' && standard.height != null) setValue('height', standard.height)
}

function render() {
  const form = document.querySelector('.painting-form')
  if (!form || form.dataset.sizeOptionsReady) return
  form.dataset.sizeOptionsReady = '1'
  const sections = form.querySelectorAll('.form-section'), target = sections[1] || sections[0]
  const box = document.createElement('div'); box.className = 'painting-size-options'
  box.innerHTML = '<div class="size-options-head"><div><label>Sizes & Pricing</label><p>Add every size offered for this painting. Each size has its own price. Choose exactly one standard size.</p></div><button type="button" class="size-add-button">+ Add Size</button></div><div class="size-options-list"></div>'
  target?.appendChild(box); box.querySelector('.size-add-button').addEventListener('click', () => addRow())
  if (!state.options.length) addRow(); else state.options.forEach(option => addRow(option))
  form.addEventListener('submit', syncLegacyFields, true)
}

function addRow(seed = null) {
  const box = document.querySelector('.painting-size-options'); if (!box) return
  const defaults = window.__araDefaultSizes || [], fallback = defaults[0]
  const option = normalize(seed || (fallback ? { name:fallback.name,width:fallback.width,height:fallback.height,unit:fallback.unit,price:'',is_standard:state.options.length===0 } : { name:'',width:'',height:'',unit:'in',price:'',is_standard:state.options.length===0 }))
  state.options.push(option)
  const row = document.createElement('div'); row.className = `size-option-row ${option.is_standard ? 'is-standard' : ''}`
  row.innerHTML = `<div class="size-option-index">${String(state.options.length).padStart(2,'0')}</div><div class="size-option-fields"><select class="size-default"></select><input class="size-name" type="text" placeholder="Size name"><input class="size-width" type="number" min="0.01" step="0.01" placeholder="Width"><input class="size-height" type="number" min="0.01" step="0.01" placeholder="Height"><select class="size-unit"><option value="in">in</option><option value="cm">cm</option></select><div class="size-price-input"><span>₹</span><input class="size-price" type="number" min="0" step="0.01" placeholder="Price"></div></div><label class="size-standard-toggle"><input type="radio" name="painting-standard-size" ${option.is_standard?'checked':''}><span>Standard</span></label><button type="button" class="size-remove-button">×</button>`
  const select = row.querySelector('.size-default'); select.innerHTML = '<option value="">Custom size</option>' + defaults.map(size => `<option value="${size.id}">${size.name} — ${size.width} × ${size.height} ${size.unit}</option>`).join('')
  row.querySelector('.size-name').value=option.name; row.querySelector('.size-width').value=option.width??''; row.querySelector('.size-height').value=option.height??''; row.querySelector('.size-unit').value=option.unit||'in'; row.querySelector('.size-price').value=option.price??''
  const list=box.querySelector('.size-options-list'); list.appendChild(row)
  const sync=()=>{const index=[...list.children].indexOf(row);state.options[index]=normalize({name:row.querySelector('.size-name').value,width:row.querySelector('.size-width').value,height:row.querySelector('.size-height').value,unit:row.querySelector('.size-unit').value,price:row.querySelector('.size-price').value,is_standard:row.querySelector('.size-standard-toggle input').checked});if(state.options[index].is_standard){state.options=state.options.map((item,i)=>({...item,is_standard:i===index}));list.querySelectorAll('.size-option-row').forEach((item,i)=>item.classList.toggle('is-standard',i===index));list.querySelectorAll('.size-standard-toggle input').forEach((radio,i)=>{radio.checked=i===index});syncLegacyFields()}}
  row.querySelectorAll('input,select').forEach(input=>input.addEventListener('input',sync)); select.addEventListener('change',event=>{if(event.currentTarget.value){const picked=defaults.find(size=>String(size.id)===String(event.currentTarget.value));if(picked){row.querySelector('.size-name').value=picked.name;row.querySelector('.size-width').value=picked.width;row.querySelector('.size-height').value=picked.height;row.querySelector('.size-unit').value=picked.unit||'in'}}sync()})
  row.querySelector('.size-remove-button').addEventListener('click',()=>{if(state.options.length<=1)return;const index=[...list.children].indexOf(row);state.options.splice(index,1);row.remove();if(!state.options.some(item=>item.is_standard))state.options[0].is_standard=true;list.querySelectorAll('.size-option-row').forEach((item,i)=>item.querySelector('.size-option-index').textContent=String(i+1).padStart(2,'0'));syncLegacyFields()})
}

async function loadDefaults(){try{const response=await fetch(`${API}/sizes/list.php`,{credentials:'include'});const data=await response.json();if(data.success)window.__araDefaultSizes=data.sizes||[]}catch{}}
async function loadExisting(id){if(!id){state.options=[];return}try{const response=await fetch(`${API}/paintings/get.php?id=${encodeURIComponent(id)}`,{credentials:'include'});const data=await response.json();state.options=data.success&&Array.isArray(data.painting?.size_options)?data.painting.size_options.map(normalize):[]}catch{state.options=[]}}

const originalFetch=window.fetch.bind(window)
window.fetch=async(input,init={})=>{const url=typeof input==='string'?input:input?.url||'';if(/\/paintings\/(create|update)\.php(?:\?|$)/.test(url)&&init.body){try{const body=JSON.parse(init.body);const valid=state.options.filter(option=>option.name&&Number(option.width)>0&&Number(option.height)>0&&option.price!=='');if(valid.length){const standardIndex=Math.max(0,valid.findIndex(option=>option.is_standard));body.size_options=valid.map((option,index)=>({...option,is_standard:index===standardIndex}));const standard=body.size_options[standardIndex];body.price=standard.price;body.width=standard.width;body.height=standard.height;init={...init,body:JSON.stringify(body)}}}catch{}}return originalFetch(input,init)}

let loadingRoute=''
async function refresh(){const form=document.querySelector('.painting-form');const route=location.pathname;if(route===loadingRoute&&form)return;loadingRoute=route;const match=route.match(/\/paintings\/(\d+)\/edit/);state.options=[];if(match)await loadExisting(match[1]);render()}
async function boot(){await loadDefaults();await refresh();new MutationObserver(()=>{if(location.pathname!==state.route){state.route=location.pathname;refresh()}else render()}).observe(document.body,{childList:true,subtree:true});setInterval(()=>{if(location.pathname!==state.route){state.route=location.pathname;refresh()}},500)}
boot()
