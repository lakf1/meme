const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const GalleryImage = require('./models/GalleryImage');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(cors({
    origin: [
        'https://lakf1.github.io',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Our simple in-memory database
const tokens = [
    {
        token: "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzZWEtYXJ0IiwiYXVkIjpbImxvZ2luIl0sImV4cCI6MTczOTgwNjUwNiwiaWF0IjoxNzM0NjIyNTA2LCJqdGkiOiI1OTAwNTY5MDAwMjI5Mjc0MSIsInBheWxvYWQiOnsiaWQiOiIyODU5MjM0MjQ2OTYwOGJiYWRmODY5YWNkOGE0ZjBkOCIsImVtYWlsIjoicmdtb3RkQGdtYWlsLmNvbSIsImNyZWF0ZV9hdCI6MTczNDQ3MjMxOTIzNCwidG9rZW5fc3RhdHVzIjowLCJzdGF0dXMiOjEsImlzcyI6IiJ9fQ.nMmubcUIevhJ2JwpQ70yy6imc59AHmAOOEXYtNvY1bDirhXMekncjQhz2kBad1lA97M66kvaX59Cqz5-B-HqAiQ20U6nT7p4xJ8AsF4yxTTXql_EAvn-gvrUn7guJLp7LPpe1Lj96GBtVgwcW88m6bGaZw38AemAeLaLjeq7VciT6n1f7Y9pkNyijHqkZLTV8BINs_BX3alMo3Mka7_njAx_ULkfI16Xu9cYVs2jZ7VR769WCAQeuJfz3F4u4ElNGr-gacGW8qzUfn2YxCjd57tZboyagc_4fWlujaofV4wC6ws7_XWLWCXGd_Hq6jgFwuIM7dYsLkm5Za1AvggB6g",
        inUse: false
    }
];

const gallery = [];

// Root route
app.get('/', (req, res) => {
    console.log('Homepage accessed');
    res.json({
        status: 'running',
        endpoints: {
            'GET /token': 'Get a free token',
            'POST /release': 'Release a token',
            'GET /status': 'Check tokens status'
        }
    });
});

// Get a free token
app.get('/token', (req, res) => {
    const freeToken = tokens.find(t => !t.inUse);
    if (freeToken) {
        freeToken.inUse = true;
        console.log('\n=== Token Acquired ===');
        console.log('Token status:');
        tokens.forEach((t, i) => {
            console.log(`Token ${i + 1}: ${t.inUse ? 'IN USE' : 'FREE'}`);
        });
        console.log('==================\n');
        res.json({ token: freeToken.token });
    } else {
        console.log('\n!!! All tokens are in use !!!\n');
        res.status(503).json({ error: 'No tokens available' });
    }
});

// Check tokens status
app.get('/status', (req, res) => {
    console.log('\n=== Status Check ===');
    console.log('Total tokens:', tokens.length);
    console.log('In use:', tokens.filter(t => t.inUse).length);
    console.log('Available:', tokens.filter(t => !t.inUse).length);
    tokens.forEach((t, i) => {
        console.log(`Token ${i + 1}: ${t.inUse ? 'IN USE' : 'FREE'}`);
    });
    console.log('=================\n');
    
    res.json({
        total: tokens.length,
        inUse: tokens.filter(t => t.inUse).length,
        available: tokens.filter(t => !t.inUse).length,
        tokens: tokens.map(t => ({ inUse: t.inUse }))
    });
});

// Release a token
app.post('/release', (req, res) => {
    const { token } = req.body;
    const tokenObj = tokens.find(t => t.token === token);
    if (tokenObj) {
        tokenObj.inUse = false;
        console.log('\n=== Token Released ===');
        console.log('Token status:');
        tokens.forEach((t, i) => {
            console.log(`Token ${i + 1}: ${t.inUse ? 'IN USE' : 'FREE'}`);
        });
        console.log('===================\n');
        res.json({ success: true });
    } else {
        console.log('\n!!! Token not found for release !!!\n');
        res.status(404).json({ error: 'Token not found' });
    }
});

app.post('/gallery', async (req, res) => {
    try {
        const { imageUrl, sourceImages, timestamp } = req.body;
        
        const newImage = new GalleryImage({
            resultImage: imageUrl,
            sourceImage1: sourceImages.image1,
            sourceImage2: sourceImages.image2,
            weight1: sourceImages.weight1,
            weight2: sourceImages.weight2,
            timestamp: timestamp
        });
        
        await newImage.save();
        console.log('Saved gallery image:', newImage); // Debug log
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to save to gallery:', error);
        res.status(500).json({ error: 'Failed to save to gallery' });
    }
});

app.get('/gallery', async (req, res) => {
    try {
        const images = await GalleryImage.find().sort({ timestamp: -1 });
        console.log('Retrieved gallery images:', images); // Debug log
        res.json(images);
    } catch (error) {
        console.error('Failed to fetch gallery:', error);
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

app.listen(port, () => {
    console.log(`\n=== Token Server Started ===`);
    console.log(`Server running on port ${port}`);
    console.log('Initial token status:');
    tokens.forEach((t, i) => {
        console.log(`Token ${i + 1}: ${t.inUse ? 'IN USE' : 'FREE'}`);
    });
    console.log('=======================\n');
});