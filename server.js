const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataPath = path.join(__dirname, 'gifts-data.json');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'images'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

function readData() {
    try {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch {
        return {};
    }
}

function writeData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

// الصفحة الرئيسية → لوحة التحكم
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

// Overlay
app.get('/fire-widget.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'overlay.html'));
});

// Control (للاختصار)
app.get('/control', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

// API: جلب الإعدادات والهدايا
app.get('/api/data/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const board = data[uid] || { color: '#a855f7', gifts: [] };
    res.json(board);
});

// API: تغيير لون النيون
app.put('/api/color/:uid', (req, res) => {
    const uid = req.params.uid;
    const { color } = req.body;
    const data = readData();
    if (!data[uid]) data[uid] = { color: '#a855f7', gifts: [] };
    data[uid].color = color;
    writeData(data);
    res.json({ success: true, color });
});

// API: جلب الهدايا
app.get('/api/gifts/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const board = data[uid] || { gifts: [] };
    res.json(board.gifts || []);
});

// API: تعديل اسم هدية
app.put('/api/gifts/:uid/:id', (req, res) => {
    const uid = req.params.uid;
    const id = parseInt(req.params.id);
    const data = readData();
    if (!data[uid]) return res.status(404).json({ error: 'اللوحة غير موجودة' });
    const index = data[uid].gifts.findIndex(g => g.id === id);
    if (index === -1) return res.status(404).json({ error: 'الهدية غير موجودة' });
    data[uid].gifts[index] = { ...data[uid].gifts[index], ...req.body };
    writeData(data);
    res.json(data[uid].gifts[index]);
});

// API: إضافة هدية (صورة واحدة)
app.post('/api/gifts/:uid', upload.single('imageFile'), (req, res) => {
    const uid = req.params.uid;
    const { name } = req.body;
    const data = readData();
    if (!data[uid]) data[uid] = { color: '#a855f7', gifts: [] };

    if (!name || !req.file) {
        return res.status(400).json({ error: 'الاسم والصورة مطلوبين' });
    }

    const newGift = {
        id: Date.now(),
        name: name,
        image: req.file.filename
    };
    data[uid].gifts.push(newGift);
    writeData(data);
    res.status(201).json(newGift);
});

// API: رفع صور متعددة مع أسماء (Bulk)
app.post('/api/gifts/:uid/bulk', upload.array('images', 20), (req, res) => {
    const uid = req.params.uid;
    const { names } = req.body;
    const data = readData();
    if (!data[uid]) data[uid] = { color: '#a855f7', gifts: [] };

    const namesArray = JSON.parse(names || '[]');
    const newGifts = [];

    req.files.forEach((file, i) => {
        const newGift = {
            id: Date.now() + i,
            name: namesArray[i] || `هدية ${i + 1}`,
            image: file.filename
        };
        data[uid].gifts.push(newGift);
        newGifts.push(newGift);
    });

    writeData(data);
    res.status(201).json(newGifts);
});

// API: حذف هدية
app.delete('/api/gifts/:uid/:id', (req, res) => {
    const uid = req.params.uid;
    const id = parseInt(req.params.id);
    const data = readData();
    if (!data[uid]) return res.status(404).json({ error: 'اللوحة غير موجودة' });
    data[uid].gifts = data[uid].gifts.filter(g => g.id !== id);
    writeData(data);
    res.json({ success: true });
});

// API: رفع لفوق
app.post('/api/gifts/:uid/:id/up', (req, res) => {
    const uid = req.params.uid;
    const id = parseInt(req.params.id);
    const data = readData();
    if (!data[uid]) return res.status(404).json({ error: 'اللوحة غير موجودة' });
    const arr = data[uid].gifts;
    const index = arr.findIndex(g => g.id === id);
    if (index <= 0) return res.json({ success: false });
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    writeData(data);
    res.json({ success: true });
});

// API: تنزيل لتحت
app.post('/api/gifts/:uid/:id/down', (req, res) => {
    const uid = req.params.uid;
    const id = parseInt(req.params.id);
    const data = readData();
    if (!data[uid]) return res.status(404).json({ error: 'اللوحة غير موجودة' });
    const arr = data[uid].gifts;
    const index = arr.findIndex(g => g.id === id);
    if (index === -1 || index >= arr.length - 1) return res.json({ success: false });
    [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    writeData(data);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});