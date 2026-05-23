require('dotenv').config()
const cors = require('cors');
const express = require('express');
const router = require('./routes/rt');
const uploadImageRoute = require('./routes/imageroute');
const appointmentRoute = require('./routes/Appointmentroute'); // FIX: missing import
const connectDB = require('./Database/DB');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', router);
app.use('/api/image', uploadImageRoute);
app.use('/api/appointments', appointmentRoute); // now works because it's imported above

app.listen(PORT, () => {
    console.log(`Server is now listening on port ${PORT}`);
});
/* require('dotenv').config()
const cors = require('cors');
const express = require('express');
/* const app = express();
const router = require('./Routes/RT');
const uploadImageRoute= require('./Routes/ImageRoute')
const connectDB = require('./Database/DB');
connectDB();

app.use(express.json());

app.use('/api/users', router);
app.use('/api/image',uploadImageRoute)
const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`server is now listening to port ${PORT}`)
}) 

const router = require('./Routes/RT');
const uploadImageRoute = require('./Routes/ImageRoute');
const connectDB = require('./Database/DB');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Establish Infrastructure Connections (Power Grid)
connectDB();

// 2. Global Middleware (Translators/Checkpoints)
app.use(express.json());
//app.use(cors()); // This allows your HTML file to communicate freely

// 3. Traffic Route Gates (Highways)
app.use('/api/users', router);
app.use('/api/image', uploadImageRoute);

// 4. Start Radio Broadcast (Listen)
app.listen(PORT, () => {
    console.log(`Server is now listening on port ${PORT}`);
});
 */
// when dealing with frontend
/* 1. Add CORS
If you plan to connect a frontend (like React, Vue, or a mobile app) to this API, you will likely run into "CORS errors." You can fix this by installing the cors package:

JavaScript
const cors = require('cors');
app.use(cors()); // Allow all origins, or configure it specifically
2. Cookie Parser
Since you are using Refresh Tokens stored in cookies, your Express app won't be able to read those cookies by default. You’ll need the cookie-parser middleware:

JavaScript
const cookieParser = require('cookie-parser');
app.use(cookieParser());
3. Global Error Handler
Instead of letting the server crash if something goes wrong outside a try-catch, you can add a global error handler at the very bottom (after your routes):

JavaScript
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});
 */