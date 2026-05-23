const User = require('../Models/MD');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken'); // Don't forget this!

const createUsersDetails = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // 1. MUST extract from req.body BEFORE searching
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'This email already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        
        const details = new User({
            username,
            email,
            password: hashPassword,
            role: role || "user"
        });

        const savedDetails = await details.save();

        // Security: Convert to object and remove password
        const userResponse = savedDetails.toObject();
        delete userResponse.password;

        console.log('Details saved');

        res.status(201).json({ // 201 is better for "Created"
            success: true,
            message: 'User created successfully',
            data: userResponse // Send the cleaned version!
        });

    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists.`
            });
        }
        console.log('Error:', err);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

// ... other functions (getUserDetails and getSingleuserDetailsById look solid!)

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userFound = await User.findOne({ email });

        if (!userFound) {
            return res.status(404).json({
                success: false,
                message: 'Invalid email or password' // More secure message
            });
        }

        const doesPasswordMatch = await bcrypt.compare(password, userFound.password);
        if (!doesPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const payload = {
            userId: userFound._id,
            username: userFound.username,
            email: userFound.email,
            role: userFound.role
        };

        const accessToken = JWT.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            { expiresIn: '15m' }
        );

        const refreshToken = JWT.sign(
            payload,
            process.env.JWT_REFRESH_SECRET_KEY, // Use dedicated refresh secret
            { expiresIn: '7d' } // Use '7d' instead of '7days'
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            accessToken
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

module.exports = { createUsersDetails, getUserDetails, getSingleuserDetailsById, userLogin };