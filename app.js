const express = require("express");
const port = 1890;
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
    userId: { type: String, default: null } // Add user ID
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

const Credit = mongoose.model('Credit', creditSchema);
var login = mongoose.model('login', loginSchema);
const booking = mongoose.model('booking', bookingSchema);


// pug specific stuff
// app.set('view engine', 'pug') // set the view engine as pug
// app.set("views", path.join(__dirname, "views"));


// express specific stuff
// app.use('/static', express.static('static'));
// app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'views')));
// app.use('/static', express.static(path.join(__dirname, 'views', 'static')));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

// Set the HTML rendering engine to ejs
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});
// app.get('/', (req, res) => {
//     res.render('home.html');
// });

app.get('/contact', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'contact.html'));
    } catch (error) {
        console.error('Error serving contact page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// app.get('/contact', (req, res) => {
//     try {
//         res.render('contact.html');
//     } catch (error) {
//         console.error('Error serving contact page:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });



app.get('/sign1.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});
app.get('/sign2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/menu.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'menu.html'));
});
app.get('/housekeeping.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'housekeeping.html'));
});
app.get('/reservation', (req, res) => {
    res.sendFile(path.join(__dirname,'reservation.html'));
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


// Modify your login route handler to compare hashed passwords
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

app.get('/cash.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'cash.html'));
});

app.get('/credit.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'credit.html'));
});

app.get('/thanks.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'thanks.html'));
});
app.post('/thanks.html', async (req, res) => {
    try {
        const { name, cardNumber, expiryDate, cvv } = req.body;

        // Create a new document with the credit card details
        const newCredit = new Credit({
            name: name,
            cardNumber: cardNumber,
            expiryDate: expiryDate,
            cvv: cvv
        });

        // Save the document to the database
        const savedCredit = await newCredit.save();

        // Respond with a success message
        res.sendFile(path.join(__dirname, 'savedDetailsCredit.html'));
    } catch (error) {
        // Handle any errors that occur during the saving process
        console.error('Error saving credit card details:', error);
        res.status(500).send('An error occurred while saving credit card details.');
    }
});

app.get('/free', (req, res) => {
    res.render('free'); // Assuming free.ejs is located in the views directory
});
// app.get('/free.ejs', (req, res) => {
//     res.sendFile(path.join(__dirname, 'views', 'free.ejs'));
    // booking.find({}, (err, allRooms) => {
    //     if (err) {
    //       res.status(500).send("Error fetching rooms");
    //     } else {
    //       res.sendFile(path.join(__dirname, 'free.html'));
    //     }
    //   });

// });


    // app.post('/book/:roomId', async (req, res) => {
    //     const { roomId } = req.params;
    //     try {
    //         const room = await booking.findOne({ room: roomId });
    //         if (room) {
    //             if (room.isBooked) {
    //                 res.sendFile(path.join(__dirname, 'views', 'room book.html'));
                    
    //             } else {
    //                 await booking.updateOne({ room: roomId }, { isBooked: true });
    //                 res.sendFile(path.join(__dirname, 'views', 'congratulations.html'));
    //             }
    //         } else {
    //             res.status(404).send("Room not found");
    //         }
    //     } catch (error) {
    //         res.status(500).send("Error booking the room");
    //     }
    // });

    app.post('/book', async (req, res) => {
        try {
            // Generate a random user ID
            const userId = uuidv4();
            const availableRoom = await booking.findOne({ isBooked: false });
    
            if (availableRoom) {
                // Update the booking entry to mark the room as booked and save the user ID
                await booking.updateOne({ room: availableRoom.room }, { isBooked: true, userId: userId });
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
    
            // Find the booking entry for the user
            const bookingEntry = await booking.findOne({ userId: userId, isBooked: true });
    
            if (bookingEntry) {
                // Update the booking entry to mark the room as free
                await booking.updateOne({ userId: userId, isBooked: true }, { isBooked: false, userId: null });
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
    





    app.listen(port, () => {
        console.log(`The application started succesfully on port ${port}!!`);
    })
    module.exports = booking;






