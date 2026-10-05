const params = new URLSearchParams(window.location.search);
const uid = params.get('uid');
const list = document.getElementById('list');

const overlayUrl = `${window.location.origin}/fire-widget.html?uid=${uid}`;
document.getElementById('overlayUrl').value = overlayUrl;

function copyOverlayUrl() {
    const input = document.getElementById('overlayUrl');
    input.select();
    document.execCommand('copy');
    alert('✅ تم نسخ الرابط!');
}

// ====== الألوان ======
const colorInput = document.getElementById('neonColor');
const colorValue = document.getElementById('colorValue');

colorInput.addEventListener('input', (e) => {
    colorValue.textContent = e.target.value;
});

document.querySelectorAll('.preset').forEach(btn => {
    btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        colorInput.value = color;
        colorValue.textContent = color;
    });
});

async function saveColor() {
    const color = colorInput.value;
    await fetch(`/api/color/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color })
    });
    alert('✅ تم حفظ اللون! هيتغير فوراً في الـ Overlay');
}

async function loadColor() {
    const res = await fetch(`/api/data/${uid}`);
    const data = await res.json();
    const color = data.color || '#a855f7';
    colorInput.value = color;
    colorValue.textContent = color;
}

// ====== Drag & Drop ======
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewBox = document.getElementById('previewBox');
const saveAllBtn = document.getElementById('saveAllBtn');

let pendingImages = [];

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    imageFiles.forEach(file => {
        pendingImages.push({
            file: file,
            name: file.name.replace(/\.[^/.]+$/, ''),
            previewUrl: URL.createObjectURL(file)
        });
    });
    renderPreview();
}

function renderPreview() {
    previewBox.innerHTML = '';
    pendingImages.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <img src="${item.previewUrl}">
            <input type="text" value="${item.name}" 
                   placeholder="اكتب اسم الهدية"
                   onchange="updateName(${i}, this.value)">
            <button class="remove-preview" onclick="removePreview(${i})">✖</button>
        `;
        previewBox.appendChild(div);
    });
    saveAllBtn.style.display = pendingImages.length > 0 ? 'block' : 'none';
}

function updateName(index, value) {
    pendingImages[index].name = value;
}

function removePreview(index) {
    pendingImages.splice(index, 1);
    renderPreview();
}

async function saveAllGifts() {
    if (pendingImages.length === 0) return;

    saveAllBtn.disabled = true;
    saveAllBtn.textContent = '⏳ جاري الحفظ...';

    const formData = new FormData();
    const names = [];
    pendingImages.forEach(item => {
        formData.append('images', item.file);
        names.push(item.name);
    });
    formData.append('names', JSON.stringify(names));

    try {
        const res = await fetch(`/api/gifts/${uid}/bulk`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('فشل الرفع');
        
        alert('✅ تم حفظ كل الصور!');
        pendingImages = [];
        renderPreview();
        loadGifts();
    } catch (err) {
        alert('❌ حصل خطأ: ' + err.message);
    } finally {
        saveAllBtn.disabled = false;
        saveAllBtn.textContent = '💾 حفظ كل الصور';
    }
}

// ====== الهدايا الحالية ======
async function loadGifts() {
    if (!uid) {
        list.innerHTML = '<h2>❌ مفيش uid في الرابط</h2>';
        return;
    }
    const res = await fetch(`/api/gifts/${uid}`);
    const gifts = await res.json();
    list.innerHTML = '';

    if (gifts.length === 0) {
        list.innerHTML = '<h2>❌ مفيش هدايا</h2>';
        return;
    }

    gifts.forEach((g) => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            <img src="/images/${g.image}">
            <input type="text" value="${g.name}" data-id="${g.id}">
            <button class="up" onclick="moveUp(${g.id})">⬆️</button>
            <button class="down" onclick="moveDown(${g.id})">⬇️</button>
            <button class="del" onclick="deleteGift(${g.id})">🗑️</button>
            <span class="saved" id="saved-${g.id}">✅</span>
        `;
        list.appendChild(div);
    });

    document.querySelectorAll('.item input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const id = e.target.dataset.id;
            const newName = e.target.value;
            await fetch(`/api/gifts/${uid}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            const saved = document.getElementById(`saved-${id}`);
            saved.classList.add('show');
            setTimeout(() => saved.classList.remove('show'), 1500);
        });
    });
}

async function deleteGift(id) {
    if (!confirm('متأكد من الحذف؟')) return;
    await fetch(`/api/gifts/${uid}/${id}`, { method: 'DELETE' });
    loadGifts();
}

async function moveUp(id) {
    await
