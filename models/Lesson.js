const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    thumbnail: {
        type: Object,
        data: Buffer,
        originalname: String,
        contentType: String,
        required: true
    },
    language: {
        type: Array,
        required: false,
    },
    choreographerID: {
        type: String,
        require: true
    },
    price: {
        type: Number,
        require: true,
    },
    time: {
        start: {
            type: String,
            require: true,
        },
        end: {
            type: String,
            require: true,
        }
    },
    level: {
        type: Array,
        required: true,
    },
    genre: {
        type: Array,
        required: true,
    },
    purpose: {
        type: Array,
        required: false
    },
    mood: {
        type: Array,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    s3: {
        duration: {
            type: String
        },
        archiveURL: {
            type: String
        }
    }
});

const Lesson = mongoose.model('Lesson', LessonSchema);

module.exports = Lesson;