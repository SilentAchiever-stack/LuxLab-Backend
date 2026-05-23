/* const JWT = require('jsonwebtoken');
// So this one checks if you register or not it does not really care if you are admin or you are user its own concern is have you registered or you've not registered and if you've registered have you logged in But if not logged in so even if you logged in do you have an account that is why I said I feel registered so this authorization is seeing is literally different from the authorization of you and we know you're not an admin it's own functionality is just have you registered or you've not registered do you have an account with me or you do have an account I do not care who u are Have you registered or 
const authMiddleware = (req, res, next) => {
    // Look for token in the 'Authorization' header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "index 0:<Bearer>, index 1: <JWT TOKEN>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        console.log("Token received:", token ? "Yes" : "No");
console.log("Secret Key loaded from .env:", process.env.JWT_SECRET_KEY);
        const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded; // Add user info (id, role) to the request object
        
        next(); // Move to the controller
    } catch (err) {
        console.log("MIDDLEWARE VERIFY ERROR:", err.message);
        res.status(403).json({ success: false, message: 'Invalid or expired token' });
    } 
};

module.exports = authMiddleware; */
const JWT = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    console.log("DEBUG: Request Headers received by server:", req.headers);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 1. Guard check: Is the token actually present, and is it a string?
    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. Valid authentication token missing.' 
        });
    }

    // 2. Guard check: Does it look like a real JWT structure (3 parts separated by dots)?
    if (token.split('.').length !== 3) {
        console.log("MALFORMED TOKEN BLOCKED:", token);
        return res.status(400).json({ 
            success: false, 
            message: 'Access denied. The provided authentication token is malformed.' 
        });
    }

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        console.log("MIDDLEWARE VERIFY ERROR:", err.message);
        res.status(403).json({ success: false, message: 'Invalid or expired token' });
    } 
};

module.exports = authMiddleware;

/*you can check route to understand more 

No, the authMiddleware should not be placed before the /login route.

In a standard API, you have two types of routes: Public and Protected.

1. The Public Routes (No Middleware)
Routes like /login and /create (signup) must be open to everyone. If you put the authMiddleware before /login, a user would need a token to get a token—a "chicken and egg" problem that would lock everyone out of your app!

2. The Protected Routes (With Middleware)
Routes like /get (fetching all users) or /single/:id should be protected so only logged-in users can see that data.

How your Router should look:
You should structure your code so the middleware only sits in front of the routes that actually need security:

JavaScript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/auth'); 
const { createUsersDetails, getUserDetails, getSingleuserDetailsById, userLogin } = require('../Controller/CT');

// --- PUBLIC: Anyone can hit these ---
router.post('/create', createUsersDetails); 
router.post('/login', userLogin); 

// --- PROTECTED: Only users with a valid Access Token can hit these ---
router.get('/get', authMiddleware, getUserDetails); 
router.get('/single/:id', authMiddleware, getSingleuserDetailsById);

module.exports = router;
How the "Bouncer" Works
Think of the authMiddleware as a bouncer at a club:

Login/Signup: These are the sidewalk. Anyone can stand there. You don't need an ID to talk to the person at the door.

Middleware: This is the bouncer at the door. He checks your ID (the Access Token).

Protected Routes: This is the inside of the club. You can only get here if the bouncer lets you pass.

Common Mistake to Avoid
If you do this in your main server.js:

JavaScript
app.use(authMiddleware); // DON'T DO THIS HERE
app.use('/api/users', router);
This would apply the "bouncer" to every single route in your app, including login. That’s why we apply it selectively inside the router file instead.

Does that clarify why we keep it away from the login route? */