const params = new URLSearchParams(window.location.search);
const uid = params.get('uid');
const list = document.getElementById('list');

// رابط الـ Overlay (زي Fire Widget)
const overlayUrl = `${window.location.origin}/fire-widget.html?uid=${uid}`;
document.getElementById('overlayUrl').value = overlayUrl;

function copyOverlayUrl() {
    const input = document.getElementById('overlayUrl');
    input.select();
    document.execCommand('copy');
    alert('✅ تم نسخ الرابط!');
}

// ==== الألوان ====
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

// ==== الهدايا ====
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

async function addGift() {
    const name = document.getElementById('newName').value;
    const file = document.getElementById('newImage').files[0];

    if (!name || !file) return alert('اكتب الاسم واختار صورة');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('imageFile', file);

    await fetch(`/api/gifts/${uid}`, { method: 'POST', body: formData });

    document.getElementById('newName').value = '';
    document.getElementById('newImage').value = '';
    loadGifts();
}

async function deleteGift(id) {
    if (!confirm('متأكد من الحذف؟')) return;
    await fetch(`/api/gifts/${uid}/${id}`, { method: 'DELETE' });
    loadGifts();
}

async function moveUp(id) {
    await fetch(`/api/gifts/${uid}/${id}/up`, { method: 'POST' });
    loadGifts();
}

async function moveDown(id) {
    await fetch(`/api/gifts/${uid}/${id}/down`, { method: 'POST' });
    loadGifts();
}

loadColor();
loadGifts();