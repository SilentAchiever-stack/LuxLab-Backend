const mongoose = require('mongoose');

const connectDB = () => {
    mongoose.connect(process.env.MONGO_IMPORT)
        .then(() => {
            console.log('MongoDB connected successfully');
        })
        .catch((err) => {
            console.error('Connection error:', err.message);
        });
};

module.exports = connectDB;