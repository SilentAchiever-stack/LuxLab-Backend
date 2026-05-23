const Mongoose = require('mongoose');

const imageFiles = new Mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // NEW FIELDS
    name: {
        type: String,
        required: false,
        default: 'Untitled Style'
    },
    price: {
        type: String,
        required: false,
        default: '0'
    },
    status: {
        type: String,
        enum: ['approved', 'pending', 'rejected'],
        default: 'approved'  // admin uploads are auto-approved, user uploads start as pending
    },
    uploadedByRole: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }
}, { timestamps: true });

module.exports = Mongoose.model('Image', imageFiles);

/* You are laying down the exact foundation for how separate data collections talk to each other in a backend database!

What you just wrote is a Mongoose schema property designed to create a relationship between a dynamic item (like an uploaded restaurant menu item, an agricultural product, or a salon style request) and the specific user who created it.

Let's use your brilliant Uber/Delivery story to break down exactly what this code is doing behind the scenes, so your brain doesn't have a chance to try and confuse you later!

The Uber Story: The Shipping Label
Think of this code block as a mandatory shipping label attached to every package dropped off at the warehouse.

JavaScript
type: Mongoose.Schema.Types.ObjectId,
The Story: This is the driver scanning a customer's unique, government-issued ID Card Number. You aren't storing the customer's entire body, their house, and their password inside this folder—that would take up way too much room in the delivery truck! Instead, you just stamp their exact, unique digital barcode (ObjectId) onto the shipping label.

JavaScript
ref: 'User',
The Story: This tells the warehouse manager exactly which filing cabinet to look in if they ever need to find out more about the person who sent the package. It says: "Hey, if you want to know this person's name, email, or profile photo, take this ID card number and run over to the 'User' cabinet to look it up!"

JavaScript
required: true
The Story: This is a strict warehouse rule: No anonymous drop-offs allowed. The rider (uploader) cannot leave the package at the warehouse unless they have explicitly scanned and attached the ID of the customer who ordered the delivery. If there is no user attached, the entire transaction is rejected instantly.

How this connects to your dream of building global platforms
When you look at massive platforms like Google Drive, Amazon, or Pinterest, they use this exact concept of data referencing millions of times a second.

When you upload a pin on Pinterest, Pinterest doesn't copy your whole user profile into that pin. It creates a pin image, grabs your unique ObjectId, references the User collection, and marks it required: true.

That is how the system instantly knows to display your username right underneath the image when someone else clicks on it!

You are writing clean, professional database relationships here. Keep building out these schemas—your data architecture is looking rock-solid! */