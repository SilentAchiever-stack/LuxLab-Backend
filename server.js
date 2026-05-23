require('dotenv').config()
const cors = require('cors');
const express = require('express');
const router = require('./routes/rt');
const uploadImageRoute = require('./routes/imageroute');
const appointmentRoute = require('./routes/Appointmentroute');
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

app.use('/api/users', router);
app.use('/api/image', uploadImageRoute);
app.use('/api/appointments', appointmentRoute);

app.listen(PORT, () => {
    console.log(`Server is now listening on port ${PORT}`);
});
