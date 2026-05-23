const isAdmin = async (req, res, next) => {
    try {
        console.log("--- MIDDLEWARE REQ.USER PAYLOAD ---", req.user);
        // 1. Check if req.user exists and if their role is 'admin' OR 'superadmin'
        // (req.user was created and attached by your authMiddleware!)
        if (req.user && (req.user.role === 'admin' || req.user.role === 'superAdmin')) {
            return next(); // They are authorized! Move to the next middleware or controller.
        } else {
            // 2. If they are logged in but do NOT have the right role, block them
            return res.status(403).json({
                success: false,
                message: 'Access Denied. Admin resources only.'
            });
        }
    } catch (error) {
        console.log(error);
        // 3. Catch-all for unexpected server errors
        return res.status(500).json({
            success: false,
            message: 'Internal server error in admin middleware.'
        });
    }
};

module.exports = isAdmin;
