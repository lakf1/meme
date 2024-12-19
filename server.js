const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const GalleryImage = require('./models/GalleryImage');
require('dotenv').config();

mongoose.connect("mongodb+srv://rgmotd:ewqirtjhq2541@cluster0.srsxi.mongodb.net/image-fusion?retryWrites=true&w=majority&appName=Cluster0", {
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

// Add your tokens
const API_TOKENS = [
    "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzZWEtYXJ0IiwiYXVkIjpbImxvZ2luIl0sImV4cCI6MTczOTgwNjUwNiwiaWF0IjoxNzM0NjIyNTA2LCJqdGkiOiI1OTAwNTY5MDAwMjI5Mjc0MSIsInBheWxvYWQiOnsiaWQiOiIyODU5MjM0MjQ2OTYwOGJiYWRmODY5YWNkOGE0ZjBkOCIsImVtYWlsIjoicmdtb3RkQGdtYWlsLmNvbSIsImNyZWF0ZV9hdCI6MTczNDQ3MjMxOTIzNCwidG9rZW5fc3RhdHVzIjowLCJzdGF0dXMiOjEsImlzcyI6IiJ9fQ.nMmubcUIevhJ2JwpQ70yy6imc59AHmAOOEXYtNvY1bDirhXMekncjQhz2kBad1lA97M66kvaX59Cqz5-B-HqAiQ20U6nT7p4xJ8AsF4yxTTXql_EAvn-gvrUn7guJLp7LPpe1Lj96GBtVgwcW88m6bGaZw38AemAeLaLjeq7VciT6n1f7Y9pkNyijHqkZLTV8BINs_BX3alMo3Mka7_njAx_ULkfI16Xu9cYVs2jZ7VR769WCAQeuJfz3F4u4ElNGr-gacGW8qzUfn2YxCjd57tZboyagc_4fWlujaofV4wC6ws7_XWLWCXGd_Hq6jgFwuIM7dYsLkm5Za1AvggB6g",
];

// Add timeout for token release (e.g., 5 minutes)
const TOKEN_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

// Add timeout tracking
const tokenTimeouts = new Map();

// Update token management
const tokens = API_TOKENS.map(token => ({ token, inUse: false }));

// Add force release endpoint
app.post('/force-release-all', (req, res) => {
    tokens.forEach(token => {
        token.inUse = false;
        if (tokenTimeouts.has(token.token)) {
            clearTimeout(tokenTimeouts.get(token.token));
            tokenTimeouts.delete(token.token);
        }
    });
    console.log('All tokens force released');
    res.json({ message: 'All tokens released' });
});

// Update token request
app.get('/token', (req, res) => {
    const availableToken = tokens.find(t => !t.inUse);
    if (!availableToken) {
        return res.status(503).json({ error: '!!! All tokens are in use !!!' });
    }

    availableToken.inUse = true;
    
    // Set automatic release timeout
    const timeout = setTimeout(() => {
        availableToken.inUse = false;
        tokenTimeouts.delete(availableToken.token);
        console.log(`Token auto-released after timeout: ${availableToken.token.substring(0, 10)}...`);
    }, TOKEN_TIMEOUT);
    
    tokenTimeouts.set(availableToken.token, timeout);
    
    console.log(`Token assigned: ${availableToken.token.substring(0, 10)}...`);
    res.json({ token: availableToken.token });
});

// Update release endpoint
app.post('/release', (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const tokenObj = tokens.find(t => t.token === token);
    if (!tokenObj) {
        return res.status(404).json({ error: 'Token not found' });
    }

    // Clear any existing timeout
    if (tokenTimeouts.has(token)) {
        clearTimeout(tokenTimeouts.get(token));
        tokenTimeouts.delete(token);
    }

    tokenObj.inUse = false;
    console.log(`Token released: ${token.substring(0, 10)}...`);
    res.json({ message: 'Token released' });
});

// Add status endpoint
app.get('/status', (req, res) => {
    const status = tokens.map(t => ({
        token: t.token.substring(0, 10) + '...',
        inUse: t.inUse,
        hasTimeout: tokenTimeouts.has(t.token)
    }));
    res.json(status);
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