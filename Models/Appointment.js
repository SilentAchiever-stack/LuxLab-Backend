const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assumes your user model is named 'User'
        required: true
    },
    serviceType: {
        type: String,
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    customReferenceImage: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'declined'],
        default: 'pending'
    },
    priceQuote: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt fields
});
module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);