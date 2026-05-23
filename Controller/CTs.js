const User = require('../Models/MD');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken')


const createUsersDetails = async (req, res) => {
    // FIX 1 & 3: Pull EVERYTHING from req.body at the absolute top, including email!
    const { username, email, password, role } = req.body;

    try {
        // FIX 2: Match your search variable with your conditional check variable!
        const checkExistingEmail = await User.findOne({ email });
        if (checkExistingEmail) {
            return res.status(400).json({
                success: false,
                message: 'This email already exists'
            });
        }

        // Hash the password safely
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Build the new user document
        const details = new User({
            username,
            email,
            password: hashPassword,
            role: role || "user"
        });

        const savedDetails = await details.save();

        // SECURITY FIX 4: Convert to object, strip password, and send the STRIPPED object!
        const userResponse = savedDetails.toObject();
        delete userResponse.password;

        console.log('Details saved successfully');

        return res.status(200).json({
            success: true,
            message: 'User details created successfully',
            data: userResponse // Sending the secure, password-free data!
        });

    } catch (err) {
        console.log('Error encountered:', err);

        if (err.code === 11000) {
            console.log("Duplicate Field Details:", err.keyValue);
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
}
//to get user details
const getUserDetails = async(req,res)=>{
    try{
    const getDetails = await User.find();
    if(getDetails?.length === 0){
      return  res.status(400).json({
            success:false,
            message:'No user details found'
        })
    }
    return res.status(200).json({
        success:true,
        message:'User details fetched successfully',
        data:getDetails
    });
    }catch(err){
        console.log(err);
        res.status(500).json({
            status:false,
        message:'something went wrong'
        });
    }
}
//get by id
const getSingleuserDetailsById = async(req,res)=>{
    try{
        const {id} = req.params;// we didnt add the .id cause we aready had a deconstruct
        const userdetailsId = await User.findById(id);
        if(!userdetailsId){
          return  res.status(400).json({
                success:false,
                message:'No user details found '
            })
        }
        res.status(202).json({
            success:true,
            message:`user details ID ${id}found successfully `,
            data:userdetailsId
        })
    }catch (err) {
        console.error("Error fetching user:", err);

        // Handle CastError (invalid ObjectId format) specifically
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid User ID format'
            });
        }

        res.status(500).json({
            success: false, // Changed from status: false for consistency
            message: 'Something went wrong'
        });
    }
}

//User login
const userLogin = async(req,res)=>{
try{
     const {email,password} = req.body;
     const emailChecked = await User.findOne({email});
     if(!emailChecked ){
        return res.status(401).json({//Unauthorized
            success:false,
            message:'invalid email or password'
        });
     }
const doesPasswordMatch = await bcrypt.compare(password,emailChecked.password);
if(!doesPasswordMatch){
    return res.status(401).json({//Unauthorized
        success:false,
        message:'invalid email or password'
    })
}
//.save() is a method used to store a document in the database. You don't need to save anything during a login; you just need a plain JavaScript object to act as the "payload" for your JWT.
//i usee await User.save({ }) so i corrected it.
const payload ={
    userId:emailChecked._id,
    username:emailChecked.username,
    email:emailChecked.email,
    role:emailChecked.role
}
//acess limited for just 15m
   const accessToken = JWT.sign(
        payload, 
        process.env.JWT_SECRET_KEY, 
        { expiresIn: '15m' }
    );

    const refreshToken = JWT.sign(
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: '7days' }
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
            accessToken // Client stores this in memory
        });
}catch(err){
        console.log(err);
        res.status(500).json({
            success:false,
            message:'something went wrong'
        })
    }
} 
module.exports = {createUsersDetails, getUserDetails,getSingleuserDetailsById,userLogin}

/* So I want to ask a very simple question for the registration is there still a need for me to put authentication before they can register I mean authentication has to do with if you are if you register or you are not registered so me still putting on education in for user to register it's not making sense I feel well authentication might you needed No even in law itself I doubt civil education has to be there I feel you should have just done it in your login as we can now wait meaning if this user does not believe this email does not exist access denied by ruler let for registration I mean you are just creating this person or you are just adding this person so there is no point in still having to authenticate who this person is when this person has never used it so the person is still trying to like create and I feel during time authentication is probably needed is maybe the person wants to says oh maybe let me just say the person wants to access the premium features of this particular website maybe the person wants to access the user information of this particular website maybe the person wants to get some kind of exclusive exclusive books like something that is literally meant for a particular set of people so that is where authentication is needed I see no reason why I have to put authentication in my registration when I know this person has no phone so there's no there's no point only maybe if the person is trying to sign in Oh no maybe only the person trying to login and they just say you've not registered or boy I see no reason why I have to use authentication for login when I have done the authentication directly into my login which is maybe if I am using email and password only and the person is trying to put in a pass a password and email that has never been registered before I will just say if this email does not exist access to 9 invalid email password or email instead of giving access the instead of giving hackers an idea that 0 this thing or just an invalid email or get invalid email password like that */

//answer
/* You have completely 100% correct logic here, and your instincts are spot on.

You should never put your authentication middleware (authMiddleware) on a Registration (Sign Up) or Login route. Doing so would actually break your application and make it impossible for new users to ever join!

Let’s break down exactly why your logic is right and map out where authentication actually belongs.

Why Registration and Login Must Be Completely Public
As you perfectly pointed out, a new user doesn't have an account yet, so they don't have a token.

If you put authMiddleware on the /register route, the middleware will look for a JWT token, find nothing, and block the request with a 401 Unauthorized error.

The user is trapped: they can't get a token until they register, but they can't register because they don't have a token!

The same goes for /login. A user goes to the login page because they need to get a token. If you lock the login page behind a token check, no one can ever log in.

Where Does Authentication Actually Belong?
Just like you said, authentication is meant to protect restricted data and actions once a person is already inside the system.

Here is a quick cheat sheet of what should be open (public) versus what should be locked (protected):

Public Routes (NO Middleware)	Protected Routes (Needs authMiddleware)	Admin Routes (Needs authMiddleware + isAdmin)
POST /api/auth/register (Creating account)	GET /api/users/profile (Viewing their own profile)	GET /api/admin/dashboard (View total company revenue)
POST /api/auth/login (Getting the token)	POST /api/orders (Placing an item in their cart)	DELETE /api/users/:id (Deleting a user account)
GET /api/products (Browsing items in a shop)	POST /api/reviews (Leaving a comment on a book)	POST /api/products/new (Adding a new item to sell)
Your Point on Security (Not Giving Hackers Hints)
You made an incredible point about security at the end: "instead of giving hackers an idea... just say invalid email or password."

This is a massive industry standard best practice. When a user tries to log in with the wrong credentials, you should never say "This email does not exist" or "Incorrect password". If you say "This email does not exist," a hacker now knows that any email that doesn't get that error is a real user on your site. They can use that to target your users.

Instead, in your login controller, you should always return a vague message, exactly like you suggested:

JavaScript
// Good Security Practice in your Login Controller
if (!userExists || !isPasswordCorrect) {
    return res.status(401).json({
        success: false,
        message: 'Invalid email or password.' // Keeps them guessing!
    });
}
Summary
Trust your gut—your breakdown of the architectural flow is exactly how professional systems work. Registration and Login are the "open doors" of your factory where people get their ID badges. The authentication middleware is the security checkpoint at the inner hallways after they already have their badge. */

/* res.cookie('refreshToken', refreshToken, {

            httpOnly: true,

            secure: process.env.NODE_ENV === 'production',

            sameSite: 'strict',

            maxAge: 7 * 24 * 60 * 60 * 1000

        }); explain

This block of code is used to safely store a Refresh Token directly in the user's web browser using an HTTP cookie.

Instead of passing the token back in the JSON body for the frontend JavaScript to handle and store in localStorage, this approach passes the responsibility of holding the token to the browser itself.

Here is why this is considered an industry gold standard for authentication security, broken down property by property:

Property Breakdown
JavaScript
res.cookie('refreshToken', refreshToken, {
What it does: It tells Express to set a cookie header in the response.

'refreshToken': This is the name of the cookie that will show up in the browser's developer tools.

refreshToken: This is the actual encrypted JWT string you generated earlier in your controller.

JavaScript
            httpOnly: true,
Why this is crucial: This is your strongest shield against XSS (Cross-Site Scripting) attacks. When httpOnly is set to true, client-side JavaScript (window.localStorage or document.cookie) cannot read or access this cookie. If a hacker successfully injects a malicious script into your frontend, they still cannot steal this token because JavaScript literally cannot touch it.

JavaScript
            secure: process.env.NODE_ENV === 'production',
Why this is crucial: This protects against Man-in-the-Middle attacks. When secure is true, the browser will only send this cookie over encrypted HTTPS connections.

The Logic: process.env.NODE_ENV === 'production' evaluates to a boolean (true or false). When you are developing locally on your machine (localhost), you use HTTP (not HTTPS), so this evaluates to false and the cookie works fine. When you deploy your site live to production, it becomes true, forcing HTTPS compliance.

JavaScript
            sameSite: 'strict',
Why this is crucial: This is your shield against CSRF (Cross-Site Request Forgery) attacks.

How it works: Setting it to 'strict' tells the browser: "Only send this cookie back to the server if the request originated directly from my own domain." If a user is logged into your site, clicks a malicious link on an evil external website, and that external site tries to make a sneaky background request to your API, the browser will refuse to attach this cookie.

JavaScript
            maxAge: 7 * 24 * 60 * 60 * 1000 
What it does: This sets the lifespan of the cookie in milliseconds.

The Math: 7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds = 7 days. After exactly 7 days, the browser will automatically delete this cookie, and the user will have to log in manually again.

The Big Picture: Refresh Tokens vs. Access Tokens
Using this code means you are likely setting up a Dual Token System, which is the most secure way to handle web apps:

Access Token (Short-lived, e.g., 15 mins): Sent in the JSON body to the frontend. The frontend uses it in the Authorization header for regular API requests (caught by your authMiddleware).

Refresh Token (Long-lived, e.g., 7 days): Sent via this secure cookie. The frontend never reads it. When the 15-minute access token expires, the frontend hits a /refresh endpoint. The browser automatically carries this cookie along, your server reads it, verifies it, and drops a fresh 15-minute access token to the user without making them log back in manually.





 */