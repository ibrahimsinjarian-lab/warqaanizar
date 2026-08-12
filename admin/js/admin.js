/* admin.js — Warqaa Admin Panel (Supabase backend) */

/* ─── Helpers ─────────────────────────────────────── */
function el(id) { return document.getElementById(id); }
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatBytes(b) {
  if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB';
  return (b/1048576).toFixed(2)+' MB';
}
function textToHtml(t) {
  return (t||'').trim().split(/\n\n+/).filter(Boolean)
    .map(function(p){ return '<p>'+p.replace(/\n/g,' ').trim()+'</p>'; }).join('');
}
function htmlToText(h) {
  return (h||'').replace(/<\/p>\s*<p>/gi,'\n\n').replace(/<\/?p[^>]*>/gi,'')
    .replace(/<br\s*\/?>/gi,'\n').trim();
}
function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

/* ─── Supabase DB ─────────────────────────────────── */
var db = supabaseClient; /* from js/supabase-client.js */

/* ─── State ───────────────────────────────────────── */
var S = { essays:[], designs:[], decorations:[], settings:{} };

/* ─── Auth ────────────────────────────────────────── */
async function checkAuth() {
  if (!db) { alert('Supabase is not configured. Open js/supabase-client.js and add your URL and key.'); return; }
  var r = await db.auth.getSession();
  if (!r.data || !r.data.session) window.location.href = '/admin/login.html';
}
async function logout() {
  await db.auth.signOut();
  window.location.href = '/admin/login.html';
}

/* ─── Toast ───────────────────────────────────────── */
function toast(msg, type) {
  type = type || 'success';
  var t = document.createElement('div');
  t.className = 'toast '+type; t.textContent = msg;
  el('toasts').appendChild(t);
  setTimeout(function(){ t.remove(); }, 3500);
}

/* ─── Modal ───────────────────────────────────────── */
function openModal(html) { el('modal-card').innerHTML = html; el('modal').classList.add('open'); }
function closeModal()     { el('modal').classList.remove('open'); el('modal-card').innerHTML = ''; }

/* ─── Navigation ──────────────────────────────────── */
function navigate(section) {
  document.querySelectorAll('.nav-item').forEach(function(n){
    n.classList.toggle('active', n.dataset.nav === section);
  });
  document.querySelectorAll('.section').forEach(function(s){
    s.classList.toggle('active', s.id === 'section-'+section);
  });
  if(section==='essays')      renderEssays();
  if(section==='designs')     renderDesigns();
  if(section==='decorations') renderDecorations();
  if(section==='settings')    renderSettings();
  if(section==='upload')      renderUploadTool();
}

/* ─── Export / Import ─────────────────────────────── */
async function exportBackup() {
  var data = { essays:S.essays, designs:S.designs, decorations:S.decorations, settings:S.settings, exportedAt: new Date().toISOString() };
  var blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'warqaa-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
}

function importBackup(file) {
  var reader = new FileReader();
  reader.onload = async function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if(data.essays)      { await db.from('essays').upsert(data.essays);            S.essays      = data.essays; }
      if(data.designs)     { await db.from('designs').upsert(data.designs);          S.designs     = data.designs; }
      if(data.decorations) { await db.from('decorations').upsert(data.decorations);  S.decorations = data.decorations; }
      if(data.settings)    { await db.from('settings').upsert(Object.assign({id:1},data.settings)); S.settings = data.settings; }
      toast('Backup imported'); renderEssays();
    } catch(err) { toast('Import failed: '+err.message,'error'); }
  };
  reader.readAsText(file);
}

/* ══════════════════════════════════════════════════
   ESSAYS
══════════════════════════════════════════════════ */
function renderEssays() {
  var list = el('essays-list');
  if(!S.essays.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✦</div><div class="empty-state-label">No essays yet</div><div class="empty-state-sub">Click New Essay to add your first piece</div></div>';
    return;
  }
  list.innerHTML = '<div class="item-list">'+S.essays.map(function(e){
    return '<div class="item-row">'+
      '<div class="item-row-body">'+
        '<div class="item-title">'+escHtml(e.title)+'</div>'+
        '<div class="item-meta"><span>'+escHtml(e.year||'')+'</span>'+
          (e.tags||[]).map(function(t){return '<span class="tag-chip">'+escHtml(t)+'</span>';}).join('')+
          '<span class="badge">'+escHtml(e.category||'')+'</span>'+
        '</div>'+
      '</div>'+
      '<div class="item-actions">'+
        '<button class="action-btn" onclick="openEssayModal(\''+e.id+'\')">Edit</button>'+
        '<button class="action-btn danger" onclick="deleteEssay(\''+e.id+'\')">Delete</button>'+
      '</div>'+
    '</div>';
  }).join('')+'</div>';
}

function openEssayModal(id) {
  var e = id ? S.essays.find(function(x){return x.id===id;}) : null;
  var nextNum = String(S.essays.length+1).padStart(2,'0');
  var d = e || {id:'', num:nextNum, title:'', tags:[], category:'general', year:String(new Date().getFullYear()), content:''};
  openModal(
    '<div class="modal-header"><h2>'+(e?'Edit Essay':'New Essay')+'</h2>'+
    '<button class="modal-close" onclick="closeModal()">&#215;</button></div>'+
    '<div class="modal-body">'+
      '<div class="field-row">'+
        '<div class="field"><label>Title</label><input id="f-title" type="text" value="'+escHtml(d.title)+'" placeholder="Essay title"/></div>'+
        '<div class="field"><label>Year</label><input id="f-year" type="text" value="'+escHtml(d.year||'')+'" placeholder="2025"/></div>'+
      '</div>'+
      '<div class="field-row">'+
        '<div class="field"><label>Tags (comma separated)</label><input id="f-tags" type="text" value="'+escHtml((d.tags||[]).join(', '))+'" placeholder="design psychology, heritage"/></div>'+
        '<div class="field"><label>Category</label><select id="f-category">'+
          '<option value="general"'+(d.category==='general'?' selected':'')+'>General</option>'+
          '<option value="design"'+(d.category==='design'?' selected':'')+'>Design</option>'+
          '<option value="design, general"'+(d.category==='design, general'?' selected':'')+'>Both</option>'+
        '</select></div>'+
      '</div>'+
      '<div class="field"><label>Content (blank line = new paragraph)</label>'+
        '<textarea id="f-content" rows="13" placeholder="Write your essay here. Separate paragraphs with a blank line.">'+escHtml(htmlToText(d.content||''))+'</textarea>'+
      '</div>'+
    '</div>'+
    '<div class="modal-footer">'+
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>'+
      '<button class="btn btn-primary" onclick="saveEssay(\''+d.id+'\',\''+d.num+'\')">Save</button>'+
    '</div>'
  );
}

async function saveEssay(id, num) {
  var title    = el('f-title').value.trim();
  var year     = el('f-year').value.trim();
  var tags     = el('f-tags').value.split(',').map(function(t){return t.trim();}).filter(Boolean);
  var category = el('f-category').value;
  var content  = textToHtml(el('f-content').value);
  if(!title){ toast('Title is required','error'); return; }

  var payload = { num:num, title:title, year:year, tags:tags, category:category, content:content };
  var result;
  if(id) {
    result = await db.from('essays').update(payload).eq('id',id);
  } else {
    result = await db.from('essays').insert(payload).select().single();
  }

  if(result.error){ toast(result.error.message,'error'); return; }
  toast('Essay saved'); closeModal();
  var r = await db.from('essays').select('*').order('num');
  S.essays = r.data || []; renderEssays();
}

async function deleteEssay(id) {
  if(!confirm('Delete this essay? This cannot be undone.')) return;
  var r = await db.from('essays').delete().eq('id',id);
  if(r.error){ toast(r.error.message,'error'); return; }
  toast('Essay deleted');
  var res = await db.from('essays').select('*').order('num');
  S.essays = res.data || []; renderEssays();
}

/* ══════════════════════════════════════════════════
   DESIGNS
══════════════════════════════════════════════════ */
function renderDesigns() {
  var list = el('designs-list');
  if(!S.designs.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">◈</div><div class="empty-state-label">No designs yet</div><div class="empty-state-sub">Click New Design to add your first project</div></div>';
    return;
  }
  list.innerHTML = '<div class="item-list">'+S.designs.map(function(d){
    var thumb = (d.images&&d.images[0])
      ? '<img src="'+escHtml(d.images[0])+'" style="width:60px;height:60px;object-fit:cover;border-radius:2px;flex-shrink:0;border:1px solid var(--border)"/>'
      : '<div style="width:60px;height:60px;background:var(--bg);border:1px solid var(--border);border-radius:2px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:18px">◫</div>';
    return '<div class="item-row">'+thumb+
      '<div class="item-row-body">'+
        '<div class="item-title">'+escHtml(d.title)+'</div>'+
        '<div class="item-meta"><span class="tag-chip">'+escHtml(d.tag||'')+'</span><span class="badge">'+escHtml(d.category||'')+'</span><span>'+((d.images||[]).filter(Boolean).length)+' image(s)</span></div>'+
      '</div>'+
      '<div class="item-actions">'+
        '<button class="action-btn" onclick="openDesignModal(\''+d.id+'\')">Edit</button>'+
        '<button class="action-btn danger" onclick="deleteDesign(\''+d.id+'\')">Delete</button>'+
      '</div>'+
    '</div>';
  }).join('')+'</div>';
}

function openDesignModal(id) {
  var d = id ? S.designs.find(function(x){return x.id===id;}) : null;
  var empty = {id:'',slug:'',title:'',tag:'',category:'interior',palette:1,images:[],concept:''};
  var v = d || empty;
  openModal(
    '<div class="modal-header"><h2>'+(d?'Edit Design':'New Design')+'</h2>'+
    '<button class="modal-close" onclick="closeModal()">&#215;</button></div>'+
    '<div class="modal-body">'+
      '<div class="field-row">'+
        '<div class="field"><label>Title</label><input id="d-title" type="text" value="'+escHtml(v.title)+'" placeholder="Project title"/></div>'+
        '<div class="field"><label>Tag</label><input id="d-tag" type="text" value="'+escHtml(v.tag||'')+'" placeholder="interior design"/></div>'+
      '</div>'+
      '<div class="field-row">'+
        '<div class="field"><label>Category</label><select id="d-cat">'+
          '<option value="interior"'+(v.category==='interior'?' selected':'')+'>Interior Design</option>'+
          '<option value="architectural"'+(v.category==='architectural'?' selected':'')+'>Architectural</option>'+
          '<option value="room decor"'+(v.category==='room decor'?' selected':'')+'>Room Decor</option>'+
        '</select></div>'+
        '<div class="field"><label>Placeholder palette (1 to 6)</label><input id="d-pal" type="number" min="1" max="6" value="'+(v.palette||1)+'"/></div>'+
      '</div>'+
      '<div class="field"><label>Image URLs — one per line</label>'+
        '<textarea id="d-imgs" rows="4" placeholder="https://i.ibb.co/...">'+escHtml((v.images||[]).join('\n'))+'</textarea>'+
        '<p class="field-hint">Use the Upload Tool to compress and upload, then paste URLs here.</p>'+
      '</div>'+
      '<div class="field"><label>Concept text</label><textarea id="d-concept" rows="6">'+escHtml(htmlToText(v.concept||''))+'</textarea></div>'+
    '</div>'+
    '<div class="modal-footer">'+
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>'+
      '<button class="btn btn-primary" onclick="saveDesign(\''+v.id+'\',\''+v.slug+'\')">Save</button>'+
    '</div>'
  );
}

async function saveDesign(id, oldSlug) {
  var title   = el('d-title').value.trim();
  var tag     = el('d-tag').value.trim();
  var cat     = el('d-cat').value;
  var palette = parseInt(el('d-pal').value)||1;
  var images  = el('d-imgs').value.split('\n').map(function(u){return u.trim();}).filter(Boolean);
  var concept = textToHtml(el('d-concept').value);
  if(!title){ toast('Title is required','error'); return; }
  var slug    = oldSlug || slugify(title);
  var payload = { slug:slug, title:title, tag:tag, category:cat, palette:palette, images:images, concept:concept };
  var result;
  if(id) {
    result = await db.from('designs').update(payload).eq('id',id);
  } else {
    result = await db.from('designs').insert(payload).select().single();
  }
  if(result.error){ toast(result.error.message,'error'); return; }
  toast('Design saved'); closeModal();
  var r = await db.from('designs').select('*').order('sort_order');
  S.designs = r.data || []; renderDesigns();
}

async function deleteDesign(id) {
  if(!confirm('Delete this design? This cannot be undone.')) return;
  var r = await db.from('designs').delete().eq('id',id);
  if(r.error){ toast(r.error.message,'error'); return; }
  toast('Design deleted');
  var res = await db.from('designs').select('*').order('sort_order');
  S.designs = res.data || []; renderDesigns();
}

/* ══════════════════════════════════════════════════
   DECORATIONS
══════════════════════════════════════════════════ */
var ZONES = [
  {value:'hero',label:'Homepage Hero'},{value:'about',label:'Homepage About'},
  {value:'cards',label:'Homepage Cards'},{value:'essays-header',label:'Essays Header'},
  {value:'designs-header',label:'Designs Header'},{value:'contact',label:'Contact Footer'},
];

function renderDecorations() {
  var grid = el('decorations-grid');
  if(!S.decorations.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">❀</div><div class="empty-state-label">No decorations yet</div><div class="empty-state-sub">Add PNG images or flowers to any section of the site</div></div>';
    return;
  }
  grid.innerHTML = S.decorations.map(function(d,i){
    var zl = (ZONES.find(function(z){return z.value===d.zone;})||{}).label||d.zone;
    return '<div class="dec-card">'+
      (d.url?'<img class="dec-thumb" src="'+escHtml(d.url)+'" alt=""/>'  :'<div class="dec-thumb-empty">No image</div>')+
      '<div class="dec-info"><div class="dec-zone">'+escHtml(zl)+'</div><div class="dec-label">'+escHtml(d.label||'Decoration '+(i+1))+'</div></div>'+
      '<div class="dec-actions">'+
        '<button class="action-btn" onclick="openDecorationModal(\''+d.id+'\')">Edit</button>'+
        '<button class="action-btn danger" onclick="deleteDecoration(\''+d.id+'\')">Delete</button>'+
      '</div>'+
    '</div>';
  }).join('');
}

function openDecorationModal(id) {
  var d = id ? S.decorations.find(function(x){return x.id===id;}) : null;
  var v = d || {id:'',label:'',zone:'hero',url:'',pos_top:'',pos_right:'',pos_bottom:'',pos_left:'',width:'200px',opacity:'1',rotation:'0',z_index:1};
  var zoneOpts = ZONES.map(function(z){ return '<option value="'+z.value+'"'+(v.zone===z.value?' selected':'')+'>'+z.label+'</option>'; }).join('');
  openModal(
    '<div class="modal-header"><h2>'+(d?'Edit Decoration':'Add Decoration')+'</h2>'+
    '<button class="modal-close" onclick="closeModal()">&#215;</button></div>'+
    '<div class="modal-body">'+
      '<div class="field-row">'+
        '<div class="field"><label>Label (reference name)</label><input id="dc-lbl" type="text" value="'+escHtml(v.label||'')+'" placeholder="Red poppy, top-right"/></div>'+
        '<div class="field"><label>Site zone</label><select id="dc-zone">'+zoneOpts+'</select></div>'+
      '</div>'+
      '<div class="field"><label>Image URL (PNG recommended)</label>'+
        '<input id="dc-url" type="url" value="'+escHtml(v.url||'')+'" placeholder="https://i.ibb.co/..."/>'+
        '<p class="field-hint">Upload your PNG in the Upload Tool tab, then paste the URL here.</p>'+
      '</div>'+
      (v.url?'<img src="'+escHtml(v.url)+'" style="max-height:90px;object-fit:contain;border:1px solid var(--border);border-radius:2px" onerror="this.style.display=\'none\'"/>':'') +
      '<p style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding-top:8px">Position (leave blank to omit)</p>'+
      '<div class="field-row">'+
        '<div class="field"><label>Top (e.g. 10% or 80px)</label><input id="dc-top" type="text" value="'+escHtml(v.pos_top||'')+'"/></div>'+
        '<div class="field"><label>Right</label><input id="dc-right" type="text" value="'+escHtml(v.pos_right||'')+'"/></div>'+
      '</div>'+
      '<div class="field-row">'+
        '<div class="field"><label>Bottom</label><input id="dc-bot" type="text" value="'+escHtml(v.pos_bottom||'')+'"/></div>'+
        '<div class="field"><label>Left</label><input id="dc-left" type="text" value="'+escHtml(v.pos_left||'')+'"/></div>'+
      '</div>'+
      '<div class="field-row">'+
        '<div class="field"><label>Width</label><input id="dc-w" type="text" value="'+escHtml(v.width||'200px')+'"/></div>'+
        '<div class="field"><label>Rotation (degrees)</label><input id="dc-rot" type="text" value="'+escHtml(v.rotation||'0')+'"/></div>'+
      '</div>'+
      '<div class="field-row">'+
        '<div class="field"><label>Opacity (0 to 1)</label>'+
          '<input type="range" id="dc-op" min="0" max="1" step="0.05" value="'+escHtml(String(v.opacity||1))+'" oninput="el(\'dc-op-v\').textContent=this.value" style="padding:4px 0"/>'+
          '<span id="dc-op-v" style="font-size:11px;color:var(--muted)">'+escHtml(String(v.opacity||1))+'</span>'+
        '</div>'+
        '<div class="field"><label>Z-index</label><input id="dc-z" type="number" value="'+escHtml(String(v.z_index||1))+'"/></div>'+
      '</div>'+
    '</div>'+
    '<div class="modal-footer">'+
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>'+
      '<button class="btn btn-primary" onclick="saveDecoration(\''+v.id+'\')">Save</button>'+
    '</div>'
  );
}

async function saveDecoration(id) {
  var url = el('dc-url').value.trim();
  if(!url){ toast('Image URL is required','error'); return; }
  var payload = {
    label:      el('dc-lbl').value.trim(),
    zone:       el('dc-zone').value,
    url:        url,
    pos_top:    el('dc-top').value.trim(),
    pos_right:  el('dc-right').value.trim(),
    pos_bottom: el('dc-bot').value.trim(),
    pos_left:   el('dc-left').value.trim(),
    width:      el('dc-w').value.trim(),
    opacity:    el('dc-op').value,
    rotation:   el('dc-rot').value.trim(),
    z_index:    parseInt(el('dc-z').value) || 1,
  };
  var result;
  if(id) {
    result = await db.from('decorations').update(payload).eq('id',id);
  } else {
    result = await db.from('decorations').insert(payload).select().single();
  }
  if(result.error){ toast(result.error.message,'error'); return; }
  toast('Decoration saved'); closeModal();
  var r = await db.from('decorations').select('*');
  S.decorations = r.data || []; renderDecorations();
}

async function deleteDecoration(id) {
  if(!confirm('Remove this decoration from the site?')) return;
  var r = await db.from('decorations').delete().eq('id',id);
  if(r.error){ toast(r.error.message,'error'); return; }
  toast('Decoration removed');
  var res = await db.from('decorations').select('*');
  S.decorations = res.data || []; renderDecorations();
}

/* ══════════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════════ */
function renderSettings() {
  var st = S.settings;
  el('settings-form').innerHTML =
    '<div class="settings-grid">'+
      '<div class="field"><label>Name in Arabic</label><input id="st-arabic" type="text" value="'+escHtml(st.name_arabic||'')+'" dir="rtl"/></div>'+
      '<div class="field"><label>Name in Latin</label><input id="st-latin" type="text" value="'+escHtml(st.name_latin||'')+'"/></div>'+
      '<div class="field"><label>Roles subtitle</label><input id="st-roles" type="text" value="'+escHtml(st.roles||'')+'"/></div>'+
      '<div class="field"><label>Instagram handle</label><input id="st-ig" type="text" value="'+escHtml(st.instagram||'')+'"/></div>'+
      '<div class="field"><label>Instagram URL</label><input id="st-igurl" type="url" value="'+escHtml(st.instagram_url||'')+'"/></div>'+
      '<div class="field"><label>Email</label><input id="st-email" type="email" value="'+escHtml(st.email||'')+'"/></div>'+
      '<div class="field"><label>WhatsApp display</label><input id="st-wa" type="text" value="'+escHtml(st.whatsapp||'')+'"/></div>'+
      '<div class="field"><label>WhatsApp URL</label><input id="st-waurl" type="url" value="'+escHtml(st.whatsapp_url||'')+'"/></div>'+
      '<div class="field settings-full"><label>About tagline</label><input id="st-tagline" type="text" value="'+escHtml(st.about_tagline||'')+'"/></div>'+
      '<div class="field settings-full"><label>About text (blank line = new paragraph)</label><textarea id="st-about" rows="7">'+escHtml(st.about_text||'')+'</textarea></div>'+
      '<div class="field settings-full"><label>Portrait image URL</label><input id="st-portrait" type="url" value="'+escHtml(st.portrait_url||'')+'"/></div>'+
      '<div class="field settings-full" style="border-top:1px solid var(--border);padding-top:20px">'+
        '<label>imgBB API key (stored on this device only)</label>'+
        '<input id="st-imgbb" type="text" value="'+escHtml(localStorage.getItem('warqaa-imgbb-key')||'')+'" placeholder="Get yours free at api.imgbb.com"/>'+
        '<p class="field-hint">Your imgBB key is kept in this browser only — it is never sent to Supabase. You will need to re-enter it on a new device.</p>'+
      '</div>'+
    '</div>';
}

async function saveSettings() {
  var settings = {
    id:1,
    name_arabic:   el('st-arabic').value.trim(),
    name_latin:    el('st-latin').value.trim(),
    roles:         el('st-roles').value.trim(),
    instagram:     el('st-ig').value.trim(),
    instagram_url: el('st-igurl').value.trim(),
    email:         el('st-email').value.trim(),
    whatsapp:      el('st-wa').value.trim(),
    whatsapp_url:  el('st-waurl').value.trim(),
    about_tagline: el('st-tagline').value.trim(),
    about_text:    el('st-about').value.trim(),
    portrait_url:  el('st-portrait').value.trim(),
  };
  /* imgBB key stays local */
  var imgbbKey = el('st-imgbb').value.trim();
  if(imgbbKey) localStorage.setItem('warqaa-imgbb-key', imgbbKey);

  var r = await db.from('settings').upsert(settings);
  if(r.error){ toast(r.error.message,'error'); return; }
  S.settings = settings;
  toast('Settings saved');
}

/* ══════════════════════════════════════════════════
   UPLOAD TOOL (client-side, no server needed)
══════════════════════════════════════════════════ */
var UP = { file:null, compressedBlob:null, preset:'web', quality:0.82, maxDim:1200, format:'image/jpeg' };
var PRESETS = {
  raw:      {label:'Original', quality:1,    maxDim:99999, desc:'No compression'},
  web:      {label:'Web',      quality:0.82, maxDim:1200,  desc:'1200px · JPEG 82%'},
  portrait: {label:'Portrait', quality:0.88, maxDim:1600,  desc:'1600px · JPEG 88%'},
  thumb:    {label:'Thumbnail',quality:0.75, maxDim:600,   desc:'600px  · JPEG 75%'},
  high:     {label:'High',     quality:0.94, maxDim:2400,  desc:'2400px · JPEG 94%'},
  custom:   {label:'Custom',   quality:0.82, maxDim:1200,  desc:'Set below'},
};

function renderUploadTool() {
  el('upload-tool-content').innerHTML =
    '<div style="display:flex;flex-direction:column;gap:24px;max-width:860px">'+
    '<div class="upload-zone" id="drop-zone"><div class="upload-zone-icon">⬆</div>'+
      '<div class="upload-zone-label">Drag and drop an image here<br/>or click to browse</div>'+
      '<div class="upload-zone-sub">PNG · JPG · WebP · any size</div>'+
      '<input type="file" id="file-input" accept="image/*" style="display:none"/></div>'+
    '<div><p style="font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Compression preset</p>'+
      '<div class="presets" id="preset-row">'+
        Object.entries(PRESETS).map(function(kv){
          return '<button class="preset-btn'+(kv[0]===UP.preset?' active':'')+'" data-preset="'+kv[0]+'">'+
            kv[1].label+'<br/><span style="font-size:8px;opacity:.7">'+kv[1].desc+'</span></button>';
        }).join('')+
      '</div></div>'+
    '<div id="format-row-wrap"><p style="font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Output format</p>'+
      '<div class="presets" id="format-row">'+
        '<button class="preset-btn active" data-fmt="image/jpeg">JPEG<br/><span style="font-size:8px;opacity:.7">no transparency</span></button>'+
        '<button class="preset-btn" data-fmt="image/png">PNG<br/><span style="font-size:8px;opacity:.7">keeps transparency</span></button>'+
        '<button class="preset-btn" data-fmt="image/webp">WebP<br/><span style="font-size:8px;opacity:.7">modern browsers</span></button>'+
      '</div></div>'+
    '<div id="custom-controls" style="'+(UP.preset!=='custom'?'display:none':'')+'">'+
      '<div style="border:1px solid var(--border);border-radius:3px;padding:20px;display:flex;flex-direction:column;gap:14px">'+
        '<div class="slider-row"><span class="slider-label">Quality</span>'+
          '<input type="range" id="cq" min="10" max="99" value="'+Math.round(UP.quality*100)+'" oninput="el(\'cq-v\').textContent=this.value+\'%\';UP.quality=this.value/100"/>'+
          '<span class="slider-val" id="cq-v">'+Math.round(UP.quality*100)+'%</span></div>'+
        '<div class="slider-row"><span class="slider-label">Max size</span>'+
          '<input type="range" id="cd" min="200" max="4000" step="100" value="'+UP.maxDim+'" oninput="el(\'cd-v\').textContent=this.value+\'px\';UP.maxDim=parseInt(this.value)"/>'+
          '<span class="slider-val" id="cd-v">'+UP.maxDim+'px</span></div>'+
      '</div></div>'+
    '<div class="preview-pair" id="pp" style="display:none">'+
      '<div class="preview-box"><img class="preview-img" id="po" src="" alt="Original"/>'+
        '<div class="preview-meta"><div class="preview-label">Original</div><div class="preview-size" id="osz"></div><div class="preview-dims" id="odm"></div></div></div>'+
      '<div class="preview-box"><img class="preview-img" id="pc" src="" alt="Compressed"/>'+
        '<div class="preview-meta"><div class="preview-label">Compressed</div><div class="preview-size" id="csz"></div><div class="preview-dims" id="cdm">Not yet compressed</div></div></div>'+
    '</div>'+
    '<div class="savings-bar" id="sbar"></div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap">'+
      '<button class="btn btn-secondary" id="compress-btn" disabled>Compress</button>'+
      '<button class="btn btn-primary"   id="upload-btn"   disabled>Upload to imgBB</button></div>'+
    '<div id="url-row" style="display:none">'+
      '<p style="font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Hosted URL</p>'+
      '<div class="url-output"><input type="text" id="url-out" readonly/>'+
        '<button class="btn btn-secondary" id="copy-btn">Copy</button></div></div>'+
    '</div>';

  var dz=el('drop-zone'),fi=el('file-input');
  dz.addEventListener('click',function(){fi.click();});
  dz.addEventListener('dragover',function(e){e.preventDefault();dz.classList.add('drag-over');});
  dz.addEventListener('dragleave',function(){dz.classList.remove('drag-over');});
  dz.addEventListener('drop',function(e){e.preventDefault();dz.classList.remove('drag-over');var f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))handleUpFile(f);});
  fi.addEventListener('change',function(e){var f=e.target.files[0];if(f)handleUpFile(f);});
  el('preset-row').addEventListener('click',function(e){
    var btn=e.target.closest('.preset-btn');if(!btn)return;
    document.querySelectorAll('#preset-row .preset-btn').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');UP.preset=btn.dataset.preset;
    var p=PRESETS[UP.preset];UP.quality=p.quality;UP.maxDim=p.maxDim;
    el('custom-controls').style.display=UP.preset==='custom'?'':'none';
    /* hide format selector for raw — format is irrelevant */
    el('format-row-wrap').style.display=UP.preset==='raw'?'none':'';
    if(UP.file)el('compress-btn').disabled=false;
  });
  el('format-row').addEventListener('click',function(e){
    var btn=e.target.closest('.preset-btn');if(!btn)return;
    document.querySelectorAll('#format-row .preset-btn').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    UP.format=btn.dataset.fmt;
  });
  el('compress-btn').addEventListener('click',runCompress);
  el('upload-btn').addEventListener('click',runImgBB);
  el('copy-btn').addEventListener('click',function(){
    var v=el('url-out').value;
    if(v)navigator.clipboard.writeText(v).then(function(){toast('URL copied');});
  });
}

function handleUpFile(file) {
  UP.file=file;UP.compressedBlob=null;
  var url=URL.createObjectURL(file),img=new Image();
  img.onload=function(){
    el('pp').style.display='';el('po').src=url;
    el('osz').textContent=formatBytes(file.size);el('odm').textContent=img.naturalWidth+' x '+img.naturalHeight;
    el('csz').textContent='';el('cdm').textContent='Not yet compressed';el('pc').src='';
    el('sbar').style.display='none';el('url-row').style.display='none';
    el('compress-btn').disabled=false;el('upload-btn').disabled=true;
  };
  img.src=url;
}

async function runCompress() {
  if(!UP.file)return;
  var btn=el('compress-btn');btn.disabled=true;btn.textContent='Compressing...';

  /* Raw — skip canvas entirely, upload original file as-is */
  if(UP.preset==='raw') {
    UP.compressedBlob=UP.file;
    el('pc').src=el('po').src;
    el('csz').textContent=formatBytes(UP.file.size);
    el('cdm').textContent=el('odm').textContent+' (original)';
    el('sbar').style.display='';
    el('sbar').textContent='Original file — no compression applied. Will upload as-is.';
    el('upload-btn').disabled=false;
    btn.disabled=false;btn.textContent='Compress';
    return;
  }

  try {
    var res=await compressCanvas(UP.file,{maxWidth:UP.maxDim,maxHeight:UP.maxDim,quality:UP.quality,format:UP.format});
    UP.compressedBlob=res.blob;
    el('pc').src=URL.createObjectURL(res.blob);el('csz').textContent=formatBytes(res.blob.size);
    el('cdm').textContent=res.width+' x '+res.height;
    var pct=((1-res.blob.size/UP.file.size)*100).toFixed(1);
    el('sbar').style.display='';el('sbar').textContent=pct+'% smaller — '+formatBytes(UP.file.size)+' compressed to '+formatBytes(res.blob.size);
    el('upload-btn').disabled=false;
  } catch(err){toast('Compression failed: '+err.message,'error');}
  btn.disabled=false;btn.textContent='Compress';
}

async function runImgBB() {
  var apiKey=(localStorage.getItem('warqaa-imgbb-key')||'').trim();
  if(!apiKey){toast('Set your imgBB API key in Settings first','error');return;}
  if(!UP.compressedBlob){toast('Compress the image first','error');return;}
  var btn=el('upload-btn');btn.disabled=true;btn.textContent='Uploading...';
  try {
    /* Use correct extension based on format */
    var ext = UP.format==='image/png' ? '.png' : UP.format==='image/webp' ? '.webp' : '.jpg';
    var fname=(UP.file.name||'image').replace(/\.[^.]+$/,'')+ext;
    var url=await imgbbUpload(UP.compressedBlob,fname,apiKey);
    el('url-row').style.display='';el('url-out').value=url;toast('Uploaded. URL ready to copy.');
  } catch(err){toast('Upload failed: '+err.message,'error');}
  btn.disabled=false;btn.textContent='Upload to imgBB';
}

function compressCanvas(file,opts) {
  return new Promise(function(resolve,reject){
    var img=new Image(),url=URL.createObjectURL(file);
    img.onload=function(){
      URL.revokeObjectURL(url);
      var w=img.naturalWidth,h=img.naturalHeight,mW=opts.maxWidth||1920,mH=opts.maxHeight||1920;
      if(w>mW||h>mH){var r=Math.min(mW/w,mH/h);w=Math.round(w*r);h=Math.round(h*r);}
      var c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      c.toBlob(function(blob){blob?resolve({blob:blob,width:w,height:h}):reject(new Error('toBlob failed'));},opts.format||'image/jpeg',opts.quality||0.85);
    };
    img.onerror=function(){reject(new Error('Image load failed'));};img.src=url;
  });
}

async function imgbbUpload(blob,filename,apiKey) {
  var form=new FormData();form.append('image',blob,filename);
  var res=await fetch('https://api.imgbb.com/1/upload?key='+encodeURIComponent(apiKey),{method:'POST',body:form});
  if(!res.ok)throw new Error('HTTP '+res.status);
  var data=await res.json();if(!data.success)throw new Error((data.error&&data.error.message)||'imgBB error');
  return data.data.display_url||data.data.url;
}

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
async function init() {
  await checkAuth();

  var results = await Promise.all([
    db.from('essays').select('*').order('num'),
    db.from('designs').select('*').order('sort_order'),
    db.from('decorations').select('*'),
    db.from('settings').select('*').eq('id',1).single(),
  ]);

  S.essays      = results[0].data || [];
  S.designs     = results[1].data || [];
  S.decorations = results[2].data || [];
  S.settings    = results[3].data || {};

  document.querySelectorAll('.nav-item').forEach(function(btn){
    btn.addEventListener('click',function(){navigate(btn.dataset.nav);});
  });

  el('logout-btn').addEventListener('click',function(){if(confirm('Sign out?'))logout();});
  el('add-essay-btn').addEventListener('click',function(){openEssayModal('');});
  el('add-design-btn').addEventListener('click',function(){openDesignModal('');});
  el('add-dec-btn').addEventListener('click',function(){openDecorationModal('');});
  el('save-settings-btn').addEventListener('click',saveSettings);
  el('modal').addEventListener('click',function(e){if(e.target===el('modal'))closeModal();});

  el('export-btn').addEventListener('click',exportBackup);
  el('import-input').addEventListener('change',function(e){var f=e.target.files[0];if(f)importBackup(f);});

  renderEssays();
}

init();

/* ══════════════════════════════════════════════════
   SEED DEFAULTS
   Called once when a table is empty.
   Inserts the hardcoded fallback data into Supabase
   so the admin panel and website both show content.
══════════════════════════════════════════════════ */
var DEFAULT_ESSAYS = [
  { num:'01', title:'On the Architecture of Belonging', tags:['design psychology','political philosophy'], category:'design, general', year:'2025', sort_order:1, content:'<p>Every space makes a claim about who it was built for. Sometimes this claim is explicit, written into the building\'s programme or the city\'s zoning laws. More often it is embedded in the texture of things: the width of a door, the height of a counter, the placement of a window, the acoustics of a lobby. These are not neutral decisions. They are choices, and choices always have a politics.</p><p>To belong somewhere is not simply to be tolerated inside it. It is to feel that the space was made with you in mind. That the light falls where you need it. That the proportions suit your body. That the room does not ask you to shrink in order to move through it. This kind of belonging is rarer than we tend to admit, and its absence is rarely named for what it is.</p>' },
  { num:'02', title:'What Walls Remember', tags:['heritage','architecture'], category:'general', year:'2025', sort_order:2, content:'<p>There is a theory in architecture that buildings outlive their purposes but retain the memory of them. A factory converted to apartments still carries something of the factory in its bones. The high ceilings, the industrial windows, the loading bay that is now a courtyard. These are not just aesthetic traces. They are a form of testimony.</p><p>I grew up moving between houses. None of them held long enough to become architecture in the full sense of the word. But I remember the quality of particular walls. The way a certain staircase narrowed at the top. The smell of a courtyard in the afternoon. Memory does not require permanence. It requires attention.</p>' },
  { num:'03', title:'The Politics of Interior Space', tags:['political philosophy','design'], category:'design', year:'2024', sort_order:3, content:'<p>The interior is often treated as the domain of the personal, separate from the political. This separation is itself a political act. To declare the domestic private is to remove it from scrutiny, and to remove it from scrutiny is to protect the arrangements of power that organise it.</p><p>Interior design, as a discipline, has historically served those with interiors worth designing. The history of the field is largely a history of wealth: of houses commissioned by those who could afford to commission them, of rooms arranged for leisure by people who had leisure. This is not a neutral history.</p>' },
  { num:'04', title:'Softness as Resistance', tags:['design psychology'], category:'design', year:'2024', sort_order:4, content:'<p>The aesthetics of institutional spaces are rarely accidental. The hard surfaces, the bright lights, the chairs that discourage staying too long. These are design choices that express a relationship to the people who use the space. They say: this is not for you, not really. You may pass through, but you may not settle.</p><p>Softness in design is often dismissed as comfort, and comfort is often treated as a luxury. But softness is also a form of permission. A room with a soft chair by a window is telling you that your presence is welcome, that your body is allowed to rest here, that you are not a visitor who will be moved along.</p>' },
  { num:'05', title:'Reading Rooms as Acts of Care', tags:['general'], category:'general', year:'2024', sort_order:5, content:'<p>The reading room is one of the more generous inventions of public architecture. It asks very little of you. It offers shelter, light, and silence. It makes no demands on your productivity. It does not sell you anything. It simply holds you while you think.</p><p>The public library, at its best, is a form of radical hospitality. It is a space that says you do not need to purchase your right to be here. The act of walking in is enough. This is an unusual thing to say with architecture, and it is worth recognising as the political position it is.</p>' },
  { num:'06', title:'The Language of Thresholds', tags:['design psychology','heritage'], category:'design, general', year:'2023', sort_order:6, content:'<p>Every building has a moment of arrival, and that moment communicates something before a single word has been spoken. The threshold is architecture\'s first sentence. It sets the register for everything that follows.</p><p>In many traditional architectural traditions, the threshold is understood as a site of transformation. You are not the same person on the inside as you were on the outside. The transition is marked: by a change of material underfoot, by a compression of the ceiling, by a turn that delays the interior\'s reveal. These are not decorative choices. They are a grammar.</p>' },
  { num:'07', title:'Who Gets to Name a Place Home', tags:['political philosophy','general'], category:'general', year:'2023', sort_order:7, content:'<p>Home is not a building. This is something that everyone who has had their building taken away knows. Home is a set of practices, a network of relationships, a layering of time. It can exist in a single room if the conditions are right, and it can be absent from a large and beautiful house if they are not.</p><p>The right to name somewhere home is not equally distributed. For some people it is assumed. The city is theirs to move through and to settle in. For others it is contested at every step. The question of who is allowed to claim a place, to alter it, to be seen as belonging there, is always also a question of power.</p>' },
  { num:'08', title:'Material as Memory', tags:['design','heritage'], category:'design', year:'2023', sort_order:8, content:'<p>Materials carry time. This is one of the things that makes them interesting as a design medium. Stone that has been worn by feet tells you something about the number of people who passed and the duration of the passing. Wood that has darkened tells you about the quality of light in the room over many years. These are not qualities that can be specified in a brief. They accumulate.</p><p>I am interested in what it would mean to design for the accumulation of memory rather than against it. To choose materials that improve with use rather than deteriorating. To plan for the marks that inhabitants will leave, and to treat those marks not as damage but as evidence of a life being lived.</p>' },
];

var DEFAULT_DESIGNS = [
  { slug:'displaced-artists', title:'Residency for Displaced Artists', tag:'architectural design', category:'architectural', palette:1, sort_order:1, images:[], concept:'<p>A structure conceived as a temporary anchor for those whose creative practice has been interrupted by displacement. The building refuses permanence as a political act, using modular, demountable systems that can be rebuilt elsewhere.</p><p>Every threshold is designed to feel like a choice rather than a boundary. Light enters through recessed clerestories, ensuring that the interior remains independent of whatever is happening outside.</p>' },
  { slug:'room-that-breathes',  title:'The Room That Breathes',         tag:'interior design',      category:'interior',      palette:2, sort_order:2, images:[], concept:'<p>An interior study in how air movement, material porosity, and the positioning of openings can transform a static room into something that feels alive and responsive to its occupants.</p><p>Curtains of raw linen hang floor to ceiling, lifting with cross ventilation. Furniture sits low. The room does not perform comfort, it practices it.</p>' },
  { slug:'heritage-archive',    title:'Heritage Archive Library',       tag:'school',               category:'architectural', palette:3, sort_order:3, images:[], concept:'<p>A library built around the act of preservation as care. The archive holds oral histories, handwritten documents, and textile records from communities whose knowledge has been systematically excluded from formal institutions.</p>' },
  { slug:'adaptive-dwelling',   title:'Adaptive Dwelling',              tag:'house',                category:'architectural', palette:4, sort_order:4, images:[], concept:'<p>A house that changes with the family living inside it. Sliding partitions, a reversible kitchen, and convertible sleeping alcoves allow the floorplan to be reconfigured without structural work, supporting different household compositions over time.</p>' },
  { slug:'gathering-space',     title:'The Gathering Space',            tag:'interior design',      category:'interior',      palette:5, sort_order:5, images:[], concept:'<p>Designed in response to a community that had been meeting in car parks and rented rooms for years. The brief was simple: a place where people feel they are not guests.</p>' },
  { slug:'community-kitchen',   title:'Community Kitchen',              tag:'room decor',           category:'interior',      palette:6, sort_order:6, images:[], concept:'<p>A kitchen interior designed for shared use by multiple households, balancing individual ownership of tools and ingredients with collective cooking surfaces and storage systems.</p>' },
];

async function seedEssays() {
  var btn = el('seed-essays-btn');
  if(btn){ btn.disabled=true; btn.textContent='Seeding...'; }
  var r = await db.from('essays').insert(DEFAULT_ESSAYS);
  if(r.error){ toast(r.error.message,'error'); if(btn){ btn.disabled=false; btn.textContent='Seed default essays'; } return; }
  toast('Default essays added to Supabase');
  var res = await db.from('essays').select('*').order('num');
  S.essays = res.data || [];
  renderEssays();
}

async function seedDesigns() {
  var btn = el('seed-designs-btn');
  if(btn){ btn.disabled=true; btn.textContent='Seeding...'; }
  var r = await db.from('designs').insert(DEFAULT_DESIGNS);
  if(r.error){ toast(r.error.message,'error'); if(btn){ btn.disabled=false; btn.textContent='Seed default designs'; } return; }
  toast('Default designs added to Supabase');
  var res = await db.from('designs').select('*').order('sort_order');
  S.designs = res.data || [];
  renderDesigns();
}

/* Override renderEssays to inject seed banner when table is empty */
var _origRenderEssays = renderEssays;
renderEssays = function() {
  _origRenderEssays();
  var list = el('essays-list');
  if(S.essays.length === 0 && list) {
    list.innerHTML =
      '<div style="padding:24px;border:1px dashed var(--border);border-radius:3px;text-align:center">' +
        '<p style="font-size:13px;color:var(--muted);margin-bottom:14px">Your Supabase essays table is empty.</p>' +
        '<button id="seed-essays-btn" class="btn btn-primary" onclick="seedEssays()">Import 8 default essays into Supabase</button>' +
      '</div>';
  }
};

var _origRenderDesigns = renderDesigns;
renderDesigns = function() {
  _origRenderDesigns();
  var list = el('designs-list');
  if(S.designs.length === 0 && list) {
    list.innerHTML =
      '<div style="padding:24px;border:1px dashed var(--border);border-radius:3px;text-align:center">' +
        '<p style="font-size:13px;color:var(--muted);margin-bottom:14px">Your Supabase designs table is empty.</p>' +
        '<button id="seed-designs-btn" class="btn btn-primary" onclick="seedDesigns()">Import 6 default designs into Supabase</button>' +
      '</div>';
  }
};
