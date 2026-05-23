const Appointment = require('../Models/Appointment');

// Create a new appointment
const createAppointment = async (req, res) => {
    try {
        const { serviceType, appointmentDate, appointmentTime, customReferenceImage } = req.body;
        const userId = req.user?.userId || req.user?.id || req.user?._id;

        if (!serviceType || !appointmentDate || !appointmentTime) {
            return res.status(400).json({
                success: false,
                message: 'Service type, date and time are all required.'
            });
        }

        // Combine date and time into one Date object
        const combinedDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

        if (isNaN(combinedDateTime)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date or time format.'
            });
        }

        const newAppointment = new Appointment({
            userId,
            serviceType,
            appointmentDate: combinedDateTime,
            customReferenceImage: customReferenceImage || null,
            status: 'pending',
            priceQuote: 0
        });

        await newAppointment.save();

        return res.status(201).json({
            success: true,
            message: 'Appointment booked successfully.',
            appointment: newAppointment
        });

    } catch (error) {
        console.error('Create appointment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong.',
            error: error.message
        });
    }
};

// Get all appointments for the logged in user
const getUserAppointments = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || req.user?._id;

        const appointments = await Appointment.find({ userId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: appointments
        });

    } catch (error) {
        console.error('Get appointments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong.',
            error: error.message
        });
    }
};

// Get all appointments (admin only)
const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: appointments
        });

    } catch (error) {
        console.error('Get all appointments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong.',
            error: error.message
        });
    }
};

// Update appointment status (admin only)
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status, priceQuote } = req.body;
        const { id } = req.params;

        if (!['pending', 'approved', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be pending, approved or declined.'
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { 
                status,
                ...(priceQuote !== undefined && { priceQuote })
            },
            { new: true }
        ).populate('userId', 'username email');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Appointment ${status} successfully.`,
            appointment
        });

    } catch (error) {
        console.error('Update appointment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong.',
            error: error.message
        });
    }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id || req.user?._id;
        const userRole = req.user?.role;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found.'
            });
        }

        // Only the owner or admin can delete
        if (appointment.userId.toString() !== userId.toString() && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this appointment.'
            });
        }

        await Appointment.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Appointment deleted successfully.'
        });

    } catch (error) {
        console.error('Delete appointment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong.',
            error: error.message
        });
    }
};

module.exports = {
    createAppointment,
    getUserAppointments,
    getAllAppointments,
    updateAppointmentStatus,
    deleteAppointment
};