const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
    name: String,
    resultImage: String,
    sourceImage1: String,
    sourceImage2: String,
    weight1: Number,
    weight2: Number,
    timestamp: Date
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema); 