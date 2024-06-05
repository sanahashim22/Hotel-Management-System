const express = require("express");
const port = 1800;
const path = require("path");
const app = express();
app.set('view engine', 'ejs');
const mongoose = require('mongoose');
const { error } = require("console");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds for hashing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
mongoose.connect('mongodb://localhost:27017/rooms', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));
const bookingSchema = new mongoose.Schema({
    room: { type: Number, unique: true },
    isBooked: { type: Boolean, default: false },
    userId: { type: String, default: null }, // User ID
    selectedFoodCount: { type: Number, default: 0 }, // Total count of selected food items
    housekeepingCount: { type: Number, default: 0 }, // Total count of selected housekeeping services
    discount: { type: Boolean, default: false },
    arrival: { type: Date, default: null },
    departure: { type: Date, default: null },
    amount: { type: Number, default: null }
});

const loginSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String
});
const creditSchema = new mongoose.Schema({
    name: String,
    cardNumber: String,
    expiryDate: String,
    cvv: String
});
//const Discount = mongoose.model('Discount', discountSchema);
const Credit = mongoose.model('Credit', creditSchema);
var login = mongoose.model('login', loginSchema);
const booking = mongoose.model('booking', bookingSchema);
var wall = null;
var amnt = null;
app.get('/discount.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'discount.html'));
});

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

app.get('/contact', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'contact.html'));
    } catch (error) {
        console.error('Error serving contact page:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/sign1.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});
app.get('/sign2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/housekeeping.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'housekeeping.html'));
});
app.get('/reservation', (req, res) => {
    res.sendFile(path.join(__dirname, 'reservation.html'));
});
app.get('/reservation.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'reservation.html'));
});
app.get('/congratulations.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/congratulations.html'));
});
app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'services.html'));
});
app.get('/services.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'services.html'));
});

app.post('/sign1', async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('Original password:', password); // Log the original password
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Hashed password:', hashedPassword); // Log the hashed password
        const newLogin = new login({
            email: email,
            password: hashedPassword // Store hashed password in the database
        });
        const savedLogin = await newLogin.save(); // Save to database
        const prompt = "Signed up successfully!!";
        res.status(200).json({ success: true, message: prompt });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: "An error occurred during signup." });
    }
});

app.post('/sign2', (req, res) => {
    const { email, password } = req.body;
    login.findOne({ email: email })
        .then(foundUser => {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, (err, result) => {
                    if (err) {
                        console.error('Error comparing passwords:', err);
                        res.status(500).json({ success: false, message: "An error occurred during login." });
                    } else {
                        if (result) {
                            const prompt = 'Logged in';
                            res.status(200).json({ success: true, message: prompt });
                        } else {
                            const prompt = "Incorrect login credentials";
                            res.status(200).json({ success: false, message: prompt });
                        }
                    }
                });
            } else {
                const prompt = "User not found";
                res.status(200).json({ success: false, message: prompt });
            }
        })
        .catch(err => {
            console.error('Error during login:', err.message);
            res.status(500).json({ success: false, message: "An error occurred during login." });
        });
});

app.get('/book.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'book.html'));
});

app.get('/money.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'money.html'));
});
app.get('/serviceconfirm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'serviceconfirm.html'));
});
app.get('/cash.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'cash.html'));
});

app.get('/credit.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'credit.html'));
});

app.get('/thanks.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'thanks.html'));
});

app.get('/free', (req, res) => {
    res.render('free'); // Assuming free.ejs is located in the views directory
});
function generateShortId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.post('/book', async (req, res) => {
    try {
        // Generate a short random user ID
        // Change the length as needed
        const availableRoom = await booking.findOne({ isBooked: false });

        if (availableRoom) {
            const userId = availableRoom.room;
            const currentDateTime = new Date();

            // Update the booking entry to mark the room as booked and save the user ID
            await booking.updateOne({ room: availableRoom.room }, { isBooked: true, userId: userId, arrival: currentDateTime, departure: null, amount: null });
            res.render('book', { roomNumber: availableRoom.room, userId: userId });
        } else {
            res.render('book', { roomNumber: null });
        }
    } catch (error) {
        console.error('Error booking the room:', error);
        res.status(500).send("Error booking the room");
    }
});
app.post('/free', async (req, res) => {
    let successMessage = "";
    try {
        const userId = req.body.userId;
        wall = userId;
        console.log(wall);
        // Find the booking entry for the user
        const bookingEntry = await booking.findOne({ userId: userId, isBooked: true });

        if (bookingEntry) {
            // Update the booking entry to mark the room as free
            // await booking.updateOne({ userId: userId, isBooked: true }, { isBooked: false, userId: null });
            successMessage = "Room freed successfully.";
        } else {
            // Pass error message to the template
            const errorMessage = "Booking entry not found for the user.";
            res.render('free3', { errorMessage: errorMessage });
            return;
        }
    } catch (error) {
        console.error('Error freeing the room:', error);
        res.status(500).send("Error freeing the room");
        return;
    }

    // Pass success message to the template
    res.render('free2', { successMessage: successMessage });
});

app.post('/discount', async (req, res) => {
    const { discountCode } = req.body;
    try {
        const book = await booking.findOne({ userId: wall });
        if (book && book.isBooked) {
            if (discountCode === "911") {
                book.discount = true;
                //wall = userID;
                await book.save();
                res.json({ success: true, message: "Valid discount code." });
            } else {
                res.json({ success: false, message: "Invalid discount code." });
            }
        } else {
            res.json({ success: false, message: "Room ID does not exist or room is not booked." });
        }
    } catch (error) {
        console.error('Error applying discount:', error);
        res.status(500).json({ success: false, message: "An error occurred while applying the discount." });
    }
});
app.get('/wallet', async (req, res) => {
    //const wall = req.query.roomId;

    try {
        console.log(wall);
        const book = await booking.findOne({ userId: wall });

        if (book) {
            // Calculate total charges (example calculation)
            var roomCharge = 3000; // Example room charge

            const foodCharge = book.selectedFoodCount * 400; // Example food charge per item
            const housekeepingCharge = book.housekeepingCount * 500; // Example housekeeping charge per service
            let totalCharge = foodCharge + housekeepingCharge;

            if (book.discount) {
                roomCharge *= 0.75; // Apply a 25% discount
            }
            totalCharge += roomCharge;
            amnt = totalCharge;
            res.render('wallet', { totalCharge, wall });
        } else {
            res.status(404).send('Booking not found.');
        }
    } catch (error) {
        console.error('Error retrieving booking:', error);
        res.status(500).send('An error occurred while retrieving the booking.');
    }
});
app.post('/thanks.html', async (req, res) => {
    try {
        console.log(wall);
        //const { name, cardNumber, expiryDate, cvv } = req.body;
        // Create a new document with the credit card details
        // const newCredit = new Credit({
        //     name: name,
        //     cardNumber: cardNumber,
        //     expiryDate: expiryDate,
        //     cvv: cvv
        // });

        // Save the document to the database
        //const savedCredit = await newCredit.save();
        const currentDateTime = new Date();
        await booking.updateOne({ userId: wall, isBooked: true }, { userId: null, isBooked: false, discount: false, departure: currentDateTime, amount: amnt });
        wall = null;
        amnt = null;
        console.log(wall);
        // Respond with a success message
        res.sendFile(path.join(__dirname, 'savedDetailsCredit.html'));
    } catch (error) {
        // Handle any errors that occur during the saving process
        console.error('Error saving credit card details:', error);
        res.status(500).send('An error occurred while saving credit card details.');
    }
});

app.get('/menu.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'menu.html'));


});
app.get('/orderconfirm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'orderconfirm.html'));
});

app.post('/confirmAndSave', async (req, res) => {
    try {
        const { userID, selectedFoods } = req.body;

        // Check if the user ID exists in the booking database
        const bookingEntry = await booking.findOne({ userId: userID, isBooked: true });

        if (bookingEntry) {
            // User ID exists in the booking database
            // Count the total occurrences of all selected food items
            const totalSelectedFoodCount = selectedFoods.length - 1;

            // Update the booking entry to include the total count of selected food items
            await booking.updateOne({ userId: userID, isBooked: true }, {
                $set: { selectedFoodCount: totalSelectedFoodCount },
            });
            res.status(200).json({ success: true, message: "Room ID confirmed and total count of selected food items saved." });
        } else {
            // User ID does not exist in the booking database
            res.status(404).json({ success: false, message: "Room ID not found." });
        }
    } catch (error) {
        console.error('Error confirming Room ID and saving total count of selected food items:', error);
        res.status(500).json({ success: false, message: "An error occurred while confirming Room ID and saving total count of selected food items." });
    }
});

app.post('/confirmAndSaveServices', async (req, res) => {
    try {
        const { userID, selectedServices } = req.body;

        // Check if the user ID exists in the booking database
        const bookingEntry = await booking.findOne({ userId: userID, isBooked: true });

        if (bookingEntry) {
            // User ID exists in the booking database
            // Count the total occurrences of all selected services
            const totalSelectedServicesCount = selectedServices.length - 1;

            // Update the booking entry to include the total count of selected services
            await booking.updateOne({ userId: userID, isBooked: true }, {
                $set: { housekeepingCount: totalSelectedServicesCount },
            });
            res.status(200).json({ success: true, message: "Room ID confirmed and total count of selected services saved." });
        } else {
            // User ID does not exist in the booking database
            res.status(404).json({ success: false, message: "Room ID not found." });
        }
    } catch (error) {
        console.error('Error confirming Room ID and saving total count of selected services:', error);
        res.status(500).json({ success: false, message: "An error occurred while confirming user ID and saving total count of selected services." });
    }
});

app.listen(port, () => {
    console.log(`The application started succesfully on port ${port}!!`);
})
module.exports = booking;







