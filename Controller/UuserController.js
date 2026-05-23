/* const Appointment = require('../models/userImage');
const cloudinary = require('cloudinary').v2; // Ensure Cloudinary is imported to handle destroy method

const createHomeAppointment = async (req, res) => {
    try {
        const { serviceType, appointmentDate } = req.body;
        const userId = req.user.id; 

        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path; // Automatic secure URL from Cloudinary
        }

        const newAppointment = new Appointment({
            userId, // Saved as userId
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

const deleteImage = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        
        // Extracting user ID and role injected from your authMiddleware
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        const userRole = req.user?.role; // e.g., 'user', 'admin', or 'superAdmin'

        // Locate the record in MongoDB
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment record not found'
            });
        }
        
        if (!appointment.userId) {
            return res.status(400).json({
                success: false,
                message: 'This record does not have an owner assigned.'
            });
        }

        // 1. Check if the requester is the original owner
        const isOwner = appointment.userId.toString() === userId.toString();

        // 2. Check if the requester has elevated management rights
        const allowedManagementRoles = ['admin', 'superAdmin'];
        const hasManagementAccess = allowedManagementRoles.includes(userRole);

        // STRICT SECURITY GUARD: Block if they are neither the owner nor an administrator
        if (!isOwner && !hasManagementAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You are not authorized to delete this resource.'
            });
        }

        // Wipe the asset from Cloudinary storage if it exists
        if (appointment.customReferenceImage) {
            const urlParts = appointment.customReferenceImage.split('/');
            const fileNameWithExtension = urlParts[urlParts.length - 1];
            const publicId = fileNameWithExtension.split('.')[0]; 
            
            await cloudinary.uploader.destroy(publicId).catch(err => {
                console.log("Cloudinary cleanup skipped or failed: ", err.message);
            });
        }
        
        // Permanently clear document record from MongoDB
        await Appointment.findByIdAndDelete(appointmentId);
        
        return res.status(200).json({
            success: true,
            message: hasManagementAccess 
                ? `Content removed successfully via ${userRole} override.` 
                : 'Your appointment request has been deleted successfully.'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong during deletion processing.'
        });
    }
};
 
module.exports = { createHomeAppointment, deleteImage };*/

/* / Extracting user ID and role injected from your authMiddleware

const userId = req.user?.id || req.user?.userId || req.user?._id;

const userRole = req.user?.role; // e.g., 'user', 'admin', or 'superAdmin' explain

This specific block of code acts like a security guard checking a visitor's ID card at the entrance of your server.

When a user logs into your salon website, your authMiddleware verifies their token and attaches their personal information directly onto the incoming request object (req.user). This block of code reads that attached information so the database controller knows exactly who is trying to delete the image and what permissions they have.

Let’s break down exactly how those lines work behind the scenes:

Line 1: Extracting the User ID
JavaScript
const userId = req.user?.id || req.user?.userId || req.user?._id;
The ?. (Optional Chaining)
The question mark ensures your code doesn't crash. If a request somehow bypasses your middleware without a login token, req.user will be undefined. Instead of throwing a massive system error, req.user?.id will just cleanly return undefined and keep running safely.

The || (OR Operators)
This is a failsafe mechanism for database consistency. Depending on how you wrote your authentication token configuration, user IDs can be named differently. This line checks them in order:

Is it saved as .id? If yes, use it.

If not, check if it's saved as .userId.

If still not, check if it's saved as ._id (which is MongoDB’s default unique identifier format).

This guarantees that no matter how your login token formatted the ID, your variable successfully captures the unique string representing that specific logged-in user.

Line 2: Extracting the User Role
JavaScript
const userRole = req.user?.role;
This line pulls the account tier out of the token payload. When a user account is created in your database, you likely have a role field on their schema that defaults to 'user', but can be manually set to 'admin' or 'superAdmin' for your staff.

By saving this into the userRole variable, the controller can use it right below to evaluate permissions:

If it finds 'user', it enforces the rule: "You can only delete this if your userId matches the userId attached to the appointment."

If it finds 'admin' or 'superAdmin', it grants the security override: "You are staff, you can bypass the owner check and delete this image right now." */
/* 
const userId = req.user?.id || req.user?.userId || req.user?._id; explain

Think of this line as a smart backup system for finding the logged-in user's unique identity code.

When a user logs in, your authentication middleware reads their token and creates an object called req.user containing their profile details. This line's entire job is to pull their unique ID out of that object, even if your code uses different naming styles in different places.

Here is exactly how it works, piece by piece:

1. The Safety Net: ?. (Optional Chaining)
The question marks (req.user?.id) are there to prevent your entire server from crashing.

If a request somehow hits this route without a valid token, req.user will be empty (undefined).

Without the question mark, trying to read req.user.id on an empty object causes a fatal "Cannot read properties of undefined" crash.

With ?., Node.js simply says, "Oh, req.user doesn't exist? I'll just return undefined and keep moving safely."

2. The Backups: || (OR Operators)
The || symbol means "OR". This sets up a chain of choices, moving from left to right. It will stop at the first one that actually contains data:

Look for .id⟶If empty, look for .userId⟶If empty, look for ._id
Here is why having these three options is so useful:

req.user?.id — Checks if the ID was saved as a standard, clean property name during the JWT token creation.

req.user?.userId — A backup check in case you named the payload property explicitly as userId inside your login route.

req.user?._id — The final backup that looks for the raw MongoDB format (MongoDB always automatically creates IDs using an underscore like _id).

Summary
By writing this single line, you ensure that no matter how your login token formatted the ID string, your variable safely grabs it without crashing your system. */