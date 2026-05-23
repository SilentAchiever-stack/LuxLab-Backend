const Image = require('../Models/image');
const uploadToCloudinary = require('../ClodinaryHelper/helper');
const fs = require('fs');
const cloudinary = require('../config/Clodinary');

const uploadImagecontroller = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: "Multer did not receive a file.",
            whatToCheck: {
                incomingBodyKeys: Object.keys(req.body || {}),
                contentTypeHeader: req.headers['content-type'],
                wasFileSent: "No"
            }
        });
    }

    try {
        const cloudinaryResponse = await uploadToCloudinary(req.file.path);
        
        const url = cloudinaryResponse.secure_url || cloudinaryResponse.url;
        const publicId = cloudinaryResponse.public_id || cloudinaryResponse.publicId;

        if (!url || !publicId) {
            throw new Error("Cloudinary did not return a valid URL or Public ID.");
        }

        const { name, price } = req.body;
        const uploaderRole = req.user?.role || 'user';

        const newUploadedImage = new Image({
            url: url,
            publicId: publicId,
            uploadedBy: req.user?.userId || req.user?.id || req.user?._id,
            name: name || 'Untitled Style',
            price: price || '0',
            uploadedByRole: uploaderRole,
            status: uploaderRole === 'admin' ? 'approved' : 'pending'
        });

        await newUploadedImage.save();

        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            Image: newUploadedImage,
        });

    } catch (error) { 
        console.error("Database or Server Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Something went wrong during the database save.",
            actualError: error.message 
        });
    }
};

const fetchImageController = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100; 
        const skip = parseInt(page - 1) * limit;

        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const totalImages = await Image.countDocuments();
        const totalpages = Math.ceil(totalImages / limit);

        const sortObj = {};
        sortObj[sortBy] = sortOrder;
        
        const images = await Image.find()
            .populate('uploadedBy', 'username email') // FIX: correct populate syntax
            .sort(sortObj)
            .skip(skip)
            .limit(limit);
        
        if (images) {
            res.status(200).json({
                success: true,
                data: images
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'something went wrong'
        });
    }
};

const approveImageController = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        image.status = 'approved';
        await image.save();

        return res.status(200).json({
            success: true,
            message: 'Image approved successfully',
            image
        });
    } catch (error) {
        console.error("Approve error:", error);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

const rejectImageController = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        if (image.publicId) {
            await cloudinary.uploader.destroy(image.publicId);
        }

        await Image.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Image rejected and deleted successfully'
        });
    } catch (error) {
        console.error("Reject error:", error);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

// FIX: correct populate syntax — second arg is a string not separate args
const fetchPendingImagesController = async (req, res) => {
    try {
        const pendingImages = await Image.find({ 
            status: 'pending',
            uploadedByRole: 'user'
        }).populate('uploadedBy', 'username email'); // FIX: was ('uploadedBy', 'username','email')

        return res.status(200).json({
            success: true,
            data: pendingImages
        });
    } catch (error) {
        console.error("Fetch pending error:", error);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

const deleteImageController = async (req, res) => {
    try {
        const getCurrentIdOfImageToBeDeleted = req.params.id;
        
        const userId = req.user?.userId || req.user?.id || req.user?._id;
        const userRole = req.user?.role;

        const image = await Image.findById(getCurrentIdOfImageToBeDeleted);
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'image not found'
            });
        }
        
        const isOwner = image.uploadedBy.toString() === userId.toString();
        const isSuperAdmin = userRole === 'superAdmin';

        if (!isOwner && !isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: `you are not authorized to delete this image because you haven't uploaded it`
            });
        }

        await cloudinary.uploader.destroy(image.publicId);
        await Image.findByIdAndDelete(getCurrentIdOfImageToBeDeleted);
        
        return res.status(200).json({
            success: true,
            message: isSuperAdmin 
                ? 'image deleted successfully by Super Admin override' 
                : 'image deleted successfully'
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'something went wrong'
        });
    }
};

module.exports = { 
    uploadImagecontroller, 
    fetchImageController, 
    deleteImageController,
    approveImageController,
    rejectImageController,
    fetchPendingImagesController
};