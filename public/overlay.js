const params = new URLSearchParams(window.location.search);
const uid = params.get('uid');

async function loadData() {
    if (!uid) return;

    try {
        const res = await fetch(`/api/data/${uid}`);
        const boardData = await res.json();
        const color = boardData.color || '#a855f7';

        document.documentElement.style.setProperty('--neon-color', color);

        const gifts = boardData.gifts || [];
        const column = document.getElementById('giftColumn');

        if (column.children.length !== gifts.length) {
            column.innerHTML = '';
            gifts.forEach((gift) => {
                const div = document.createElement('div');
                div.className = 'gift-item';
                div.innerHTML = `
                    <span>${gift.name}</span>
                    <img src="/images/${gift.image}" alt="${gift.name}">
                `;
                column.appendChild(div);
            });
        } else {
            gifts.forEach((gift, i) => {
                const span = column.children[i].querySelector('span');
                const img = column.children[i].querySelector('img');
                if (span.textContent !== gift.name) span.textContent = gift.name;
                const newSrc = `/images/${gift.image}`;
                if (img.getAttribute('src') !== newSrc) img.setAttribute('src', newSrc);
            });
        }
    } catch (err) {
        console.error('خطأ:', err);
    }
}

loadData();
setInterval(loadData, 1000);
