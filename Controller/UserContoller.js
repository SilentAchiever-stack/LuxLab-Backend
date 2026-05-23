const Appointment = require('../Models/userImage');
const cloudinary = require('cloudinary').v2; // Handles removing the asset from Cloudinary storage

// Create a new home appointment with an optional custom hair style image
const createHomeAppointment = async (req, res) => {
    try {
        const { serviceType, appointmentDate } = req.body;
        
        // Extracted securely from your token validation middleware (authMW)
        const userId = req.user?.id || req.user?.userId || req.user?._id; 

        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path; // Secure URL generated automatically by Cloudinary
        }

        const newAppointment = new Appointment({
            userId,
            serviceType,
            appointmentDate,
            customReferenceImage: imageUrl 
        });

        await newAppointment.save();

        res.status(201).json({
            success: true,
            message: 'Appointment request submitted successfully!',
            appointment: newAppointment
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Deletes an image/appointment (Restricted strictly to Owner, Admin, or SuperAdmin)
const deleteImage = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        
        // Extracts the requester's ID and Role from your auth token payload
        const currentUserId = req.user?.id || req.user?.userId || req.user?._id;
        const currentUserRole = req.user?.role; // Expected: 'user', 'admin', or 'superAdmin'

        // 1. Look up the specific appointment record in MongoDB
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'This appointment record or image could not be found.'
            });
        }
        
        if (!appointment.userId) {
            return res.status(400).json({
                success: false,
                message: 'This record does not have a valid owner assigned to it.'
            });
        }

        // 2. Run the dynamic authorization checks
        // Check A: Is this the original user who uploaded it and made a mistake?
        const isOwner = appointment.userId.toString() === currentUserId.toString();

        // Check B: Is this an authorized system administrator clearing bad content?
        const allowedManagementRoles = ['admin', 'superAdmin'];
        const hasManagementAccess = allowedManagementRoles.includes(currentUserRole);

        // 3. SECURITY GATE: If they are NOT the owner AND NOT an administrator, shut them down!
        if (!isOwner && !hasManagementAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You do not have permission to delete this image.'
            });
        }

        // 4. CLEANUP CODES: Remove the media file asset from Cloudinary storage if it exists
        if (appointment.customReferenceImage) {
            const urlParts = appointment.customReferenceImage.split('/');
            const fileNameWithExtension = urlParts[urlParts.length - 1];
            const publicId = fileNameWithExtension.split('.')[0]; 
            
            await cloudinary.uploader.destroy(publicId).catch(err => {
                console.log("Cloudinary cloud asset cleanup skipped/failed: ", err.message);
            });
        }
        
        // 5. DATABASE WIPE: Permanently remove the document from your MongoDB collection
        await Appointment.findByIdAndDelete(appointmentId);
        
        // 6. Custom success response depending on who did the action
        return res.status(200).json({
            success: true,
            message: hasManagementAccess 
                ? `Image/Appointment successfully removed by ${currentUserRole} policy moderation override.` 
                : 'Your appointment request and image have been deleted successfully.'
        });

    } catch (error) {
        console.error("Error inside delete dynamic controller:", error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while processing your deletion request.'
        });
    }
};

module.exports = { createHomeAppointment, deleteImage };