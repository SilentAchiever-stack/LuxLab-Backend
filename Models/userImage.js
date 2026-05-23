const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, required: true }, // e.g., "Home Appointment"
    appointmentDate: { type: Date, required: true },
    
    // 📸 The key field for custom reference images
    customReferenceImage: { 
        type: String, 
        default: null // Defaults to null if they pick an admin-provided image
    },
    
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'declined'], 
        default: 'pending' 
    },
    priceQuote: { type: Number, default: 0 } // Admin will fill this out later
});

module.exports = mongoose.model('Appointment', appointmentSchema);