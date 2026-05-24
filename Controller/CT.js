const User = require('../Models/MD');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');

// 1. CREATE USER (Now with JWT Generation!)
const createUsersDetails = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const checkExistingEmail = await User.findOne({ email });
        if (checkExistingEmail) {
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

        const userResponse = savedDetails.toObject();
        delete userResponse.password;

        console.log('Details saved successfully');

        // STEP A: Assemble the Payload Box using the fresh database data
        const payload = {
            userId: savedDetails._id,
            username: savedDetails.username,
            email: savedDetails.email,
            role: savedDetails.role
        };

        // STEP B: Mint both tokens right after the payload is declared
        const accessToken = JWT.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = JWT.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            { expiresIn: '7d' }
        );

        // STEP C: Securely attach the refresh token inside an httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // STEP D: Hand back the secure user info AND both tokens to Postman
        return res.status(200).json({
            success: true,
            message: 'User details created successfully',
            accessToken,
            refreshToken,
            data: userResponse 
        });

    } catch (err) {
        console.log('Error encountered:', err);

        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists. Please use a different ${field}.`
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Something went wrong on the server'
        });
    }
};

// 2. GET ALL USERS (SECURED)
const getUserDetails = async (req, res) => {
    try {
        const getDetails = await User.find().select('-password');
        
        if (getDetails?.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No user details found'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'User details fetched successfully',
            data: getDetails
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

// 3. GET SINGLE USER BY ID (SECURED)
const getSingleuserDetailsById = async (req, res) => {
    try {
        const { id } = req.params;
        const userdetailsId = await User.findById(id).select('-password');
        
        if (!userdetailsId) {
            return res.status(400).json({
                success: false,
                message: 'No user details found'
            });
        }
        return res.status(202).json({
            success: true,
            message: `User details ID ${id} found successfully`,
            data: userdetailsId
        });
    } catch (err) {
        console.error("Error fetching user:", err);

        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid User ID format'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

// 4. USER LOGIN
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const emailChecked = await User.findOne({ email });
        
      /*   if (!emailChecked) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const doesPasswordMatch = await bcrypt.compare(password, emailChecked.password);
        if (!doesPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        } */
       if (!emailChecked) {
            return res.status(401).json({
                success: false,
                message: 'DEBUG: Email not found in database!' // <-- Change this temporarily
            });
        }

        const doesPasswordMatch = await bcrypt.compare(password, emailChecked.password);
        if (!doesPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'DEBUG: Password does not match hash!' // <-- Change this temporarily
            });
        }

        const payload = {
            userId: emailChecked._id,
            username: emailChecked.username,
            email: emailChecked.email,
            role: emailChecked.role
        };

        const accessToken = JWT.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = JWT.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        if (emailChecked.mustChangePassword) {
            // We still set the cookie so they stay in a valid session state
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                success: true,
                mustChangePassword: true, // Frontend uses this flag to block dashboard access and redirect to /change-password
                message: 'Logged in successfully, but you must change your default password before proceeding.',
                accessToken,
                role: emailChecked.role
            });
        }
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            accessToken,
            role: emailChecked.role
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

// 5. CHANGE FORCED PASSWORD CONTROLLER:Use this for users who are logged out. It asks for an email and does not require a login token.
const forgotPasswordController = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Finds user strictly by email
        const updatedUser = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { password: hashedPassword, mustChangePassword: false },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'No account found with that email.' });
        }

        return res.status(200).json({ success: true, message: 'Password reset successful!' });

    } catch (err) {
        console.error('Forgot Password Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

const changePasswordController = async (req, res) => {
    try {
        const { newPassword } = req.body;
        // userId comes from your auth middleware, NOT the request body
        const userId = req.user?.id || req.user?._id; 

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User context missing. Please log in again.' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { password: hashedPassword, mustChangePassword: false },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User account not found.' });
        }

        return res.status(200).json({ success: true, message: 'Password updated successfully!' });

    } catch (err) {
        console.error('Change Password Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
module.exports = { 
    createUsersDetails, 
    getUserDetails, 
    getSingleuserDetailsById, 
    userLogin,
    forgotPasswordController,
    changePasswordController
};


/* To understand emailChecked.mustChangePassword, let's break it down into two parts: how JavaScript reads it, and why we are using it for your system's business logic.1. The Code Meaning (Object.property)emailChecked: This is the variable holding the document returned from MongoDB when you ran User.findOne({ email }). It represents the user who is trying to log in..mustChangePassword: This is the specific property (or field) inside that user document that we added to your schema.2. The Practical Purpose (What it does)This field acts as a gatekeeper or a flag that holds a boolean value: either true or false.                       [ Is mustChangePassword TRUE? ]
                                      |
                     +----------------+----------------+
                     |                                 |
                  ( YES )                           ( NO )
                     |                                 |
    Blocks access to dashboard.              Allows normal login.
    Forces redirect to change-password.      Drops straight into system.
When it is true: The system knows this user is logging in with a temporary, generic password (like the default one you create for the owner). It halts the login process, issues a special response, and forces them to pick a personal password.When it is false: The system knows the user is using a permanent password they set themselves. They can pass right through to their dashboard without interruptions.3. How the Login Controller Uses ItLook closely at this specific chunk inside your login controller:JavaScriptif (emailChecked.mustChangePassword) {
    // 1. Set the cookie anyway so they have a session
    res.cookie('refreshToken', ...);

    // 2. Stop right here! Don't send a normal success response.
    return res.status(200).json({
        success: true,
        mustChangePassword: true,  // <-- Frontend sees this and opens the reset screen
        message: 'Logged in successfully, but you must change your default password...',
        accessToken
    });
}
If JavaScript reads emailChecked.mustChangePassword and evaluates it as true, it triggers that if block. It returns early, meaning it never reaches your normal success message at the bottom of the function.4. The Lifecycle FlowHere is exactly how this property changes values during your user hand-off cycle:StepActionState of mustChangePassword1. DeliveryYou manually create the Admin account for the original owner in the DB.Set manually to true2. First LoginThe owner logs in with your default password. The if statement catches it.Remains true3. The ResetThe owner submits a brand new password via the /change-password endpoint.Flips automatically to false4. Future LoginsThe owner logs in again using their private password. The if statement is skipped.Stays false forever */

/* okay what if i want just one admin or its of no use

It is a very common question, and honestly, restricting the app to just one admin makes a lot of sense for a personal portfolio, a single-owner business, or a simple blog.

However, you do not need to write complex code to enforce a "maximum of 1 admin" rule. Writing code to restrict that is usually over-engineering, because what happens if the owner eventually hires an assistant or an IT person to help manage the site? They might want a second admin later.

The easiest and most secure way to handle this is to control how admins are created, rather than strictly limiting the database to one.

Here is the best-practice approach:

1. Stop people from registering as an Admin
Right now, in your createUsersDetails controller, you have this code:

JavaScript
role: role || "user"
If a smart user figures out your API endpoint, they could send { "role": "admin" } in their Postman or frontend request and instantly make themselves an admin!

The Fix: Force everyone who registers through your normal route to be a "user". Delete the role variable from your req.body destructuring entirely.

JavaScript
// Change this:
const { username, email, password, role } = req.body;

// To this:
const { username, email, password } = req.body;

// And when saving to the database, hardcode it:
const details = new User({
    username,
    email,
    password: hashPassword,
    role: "user" // NO ONE can register as an admin through the API now
});
2. How do you make the ONE Admin?
Since no one can register as an admin through your API anymore, you simply create the one admin manually yourself.

Open your database (MongoDB Compass or Atlas).

Insert a document or edit an existing user.

Set their role to "admin" and mustChangePassword to true.

Hand those login details to the owner.

Why this is the best method:
It is 100% secure. Hackers cannot create admin accounts through your signup route.

It naturally limits admins. There is only one admin because you only manually created one.

It is flexible. If the owner ever comes back to you in a year and says, "Hey, I hired a manager, can they get an admin account too?" you don't have to rewrite any code. You just go into the database and manually upgrade the new person's role to "admin".

What do you think? It keeps your code super clean and completely removes the headache of managing admin limits!

// Change this:

const { username, email, password, role } = req.body;



// To this:

const { username, email, password } = req.body;



// And when saving to the database, hardcode it:

const details = new User({

    username,

    email,

    password: hashPassword,

    role: "user" // NO ONE can register as an admin through the API now

}); after these hw do the api detects these person is an admin

That is the beauty of how your architecture works! The API detects them because it reads their role dynamically straight out of the database whenever they log in, and then bakes that role into their security token.

Here is the exact step-by-step lifecycle of how the API knows a user is an admin, even though the signup route only creates regular users.

Step 1: You Make the Admin in the Database
Because your API code now prevents people from signing up as an admin, you act as the gatekeeper. You open MongoDB Compass or MongoDB Atlas, find the account you want to make the admin, and edit their document manually:

JSON
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
  "username": "emma_admin",
  "email": "admin@example.com",
  "password": "[hashed_password_here]",
  "role": "admin",             // <-- You set this manually to 'admin'
  "mustChangePassword": true   // <-- You set this manually to true
}
Step 2: The Login API Fetches the Role
When this specific user logs in, your userLogin controller runs User.findOne({ email }).

Mongoose grabs that document from the database. Look at what happens inside your payload box right after that:

JavaScript
const payload = {
    userId: emailChecked._id,
    username: emailChecked.username,
    email: emailChecked.email,
    role: emailChecked.role // <-- This dynamically becomes "admin"!
};
Because emailChecked.role equals "admin", that word gets locked inside the encrypted accessToken and sent to Postman.

Step 3: The Middleware Detects the Admin
Now, when the admin wants to hit a restricted route like /change-password or /get, they pass their token into Postman. Your middleware handles the detection completely automatically.

1. First, your authentication middleware decrypts the token:
JavaScript
const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
req.user = decoded; // req.user.role is now "admin"
2. Next, your admin middleware looks at that role:
Inside your Middleware/adminMD.js file, you likely have code that looks exactly like this:

JavaScript
const adminMiddleware = (req, res, next) => {
    // The API checks the role we extracted from the token!
    if (req.user && req.user.role === 'admin') {
        next(); // Clear! Move to the controller.
    } else {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Admins only." 
        });
    }
};
Summary
The API doesn't need to guess or hardcode admin details. It trusts the database during login, and it trusts the JWT Token during routing. Regular users will have role: "user" inside their tokens, so your admin middleware will automatically kick them out!

So what you're trying to say is after I've created everything then I should go to my mongo DB and addicts a particular user to be the only admin After that when the user logs in with that particular email and that particular umm passwords then the middle itself or the API itself detects that this person is admin without me having to limit

Exactly! You hit the nail right on the head. That is exactly how it works.

By doing it this way, you are letting the database manage who is who, and letting the middleware manage enforcement. You don't have to write a single line of messy code trying to count how many admins exist or block people from registering.

Here is why your logic is 100% correct:

Zero API Vulnerability: Since your code hardcodes role: "user" on the registration endpoint, a malicious user can send whatever they want in Postman—they will never be able to hijack an admin role through the signup form.

Database is the Source of Truth: The database is where roles are defined. When you manually flip that one user's role string to "admin", you've created your master account safely behind closed doors.

Automatic Identity Checking: When that person logs in, your JWT payload securely encapsulates that "admin" string. Every time they visit a route protected by your adminMD middleware, the API looks at their token, sees "admin", and waves them through. Everyone else gets stopped at the gate.

It's clean, it's elegant, and it's exactly how enterprise-level developers handle single-admin or multi-admin privileges without breaking a sweat!

You've got a really solid handle on this security flow now. Are you ready to test this out in MongoDB Compass, or should we move on to tweaking the image upload logic next?
 */