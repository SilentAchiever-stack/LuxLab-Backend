const express = require('express');
const adminMiddleWare = require('../Middleware/adminMD');
const authMW = require('../Middleware/MW');
const uploadMiddleWare = require('../Middleware/uploadMW');

const { 
    uploadImagecontroller, 
    fetchImageController, 
    deleteImageController,
    approveImageController,         // NEW
    rejectImageController,          // NEW
    fetchPendingImagesController    // NEW
} = require('../Controller/image-controller');

const { createHomeAppointment, deleteImage } = require('../Controller/UserContoller');

const router = express.Router();

// =========================================================================
// GENERAL PORTFOLIO GALLERY ENDPOINTS
// =========================================================================

// Upload an image directly to the salon's public gallery portfolio feed
router.post('/upload',
    authMW,
    adminMiddleWare,
    uploadMiddleWare.single('image'), 
    uploadImagecontroller
);

// Fetch all public gallery display images
router.get('/get', authMW, fetchImageController);

// Delete an entry from the general portfolio showcase layout
router.delete('/:id', authMW, adminMiddleWare, deleteImageController);

// =========================================================================
// ADMIN REVIEW ENDPOINTS (Pending User Submissions)
// =========================================================================

// Fetch all pending user-submitted images for admin review
router.get('/pending', authMW, adminMiddleWare, fetchPendingImagesController);

// Approve a user-submitted image
router.patch('/:id/approve', authMW, adminMiddleWare, approveImageController);

// Reject and delete a user-submitted image
router.patch('/:id/reject', authMW, adminMiddleWare, rejectImageController);

// =========================================================================
// CUSTOM USER APPOINTMENT & INSPO ENDPOINTS
// =========================================================================

// User submits a booking appointment
router.post('/appointments', authMW, createHomeAppointment);
// User reference image upload (no adminMiddleWare)
router.post('/user-upload',
    authMW,
    uploadMiddleWare.single('image'),
    uploadImagecontroller
);
// Only the uploader, admin, or superAdmin can hit this
router.delete('/appointments/:id', authMW, deleteImage);

module.exports = router;