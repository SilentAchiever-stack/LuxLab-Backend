const express = require('express')
const router = express.Router();
const {createUsersDetails,getUserDetails,getSingleuserDetailsById,userLogin, forgotPasswordController,changePasswordController} = require('../Controller/CT');
const authentication = require('../Middleware/MW')
const admin = require('../Middleware/adminMD')

router.get('/get',authentication,admin,getUserDetails);
router.post('/create',createUsersDetails);//registration
router.post('/login',userLogin);
// Ensure you import the new controller at the top of your routes file:
// const { changePasswordController, forgotPasswordPublicController } = require('../controllers/userController');

// 1. PUBLIC ROUTE (No "protect" middleware)
router.patch('/ForgotUserPassword', forgotPasswordController);

// 2. PROTECTED ROUTE (Requires "protect" middleware)
router.patch('/change-password', authentication, changePasswordController);
// NEW: Change Password Route
// Notice how we use 'authentication' here so req.user is available in the controller!
router.patch('/AdminChangePassword', authentication,admin,forgotPasswordController);
/* Why we use PATCH and authentication:
PATCH: This is the standard HTTP method used when you are updating just a small piece of data (like a password) rather than replacing a whole document.

authentication: Because you require a token here, the user doesn't have to send their User ID in the URL. Your middleware safely decrypts their token and tells the controller exactly who they are! */
router.get('/single/:id',authentication,admin,getSingleuserDetailsById);// So in this aspect instead of me saying get single user details by ID because I won't be dealing with the user ID because this is more like a barbie salon website so it will be get a this particular style codes by by their ID But I'm thinking of by their names or by their ID indicates that maybe I have tabafaid that tappafade has like 5 or to 10 different designs so I want to get the whole design that has to do with tapper fade for our work or in later.

module.exports = router;
