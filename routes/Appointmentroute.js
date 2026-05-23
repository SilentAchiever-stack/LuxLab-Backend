const express = require('express');
const router = express.Router();
const authMW = require('../middleWare/MW');
const adminMiddleWare = require('../middleWare/adminMD');

const {
    createAppointment,
    getUserAppointments,
    getAllAppointments,
    updateAppointmentStatus,
    deleteAppointment
} = require('../Controller/AppointmentController');

// =========================================================================
// USER APPOINTMENT ROUTES
// =========================================================================

// Book a new appointment
router.post('/book', authMW, createAppointment);

// Get logged in user's own appointments
router.get('/my-appointments', authMW, getUserAppointments);

// Delete an appointment (owner or admin)
router.delete('/:id', authMW, deleteAppointment);

// =========================================================================
// ADMIN APPOINTMENT ROUTES
// =========================================================================

// Get ALL appointments (admin only)
router.get('/all', authMW, adminMiddleWare, getAllAppointments);

// Update appointment status and price quote (admin only)
router.patch('/:id/status', authMW, adminMiddleWare, updateAppointmentStatus);

module.exports = router;