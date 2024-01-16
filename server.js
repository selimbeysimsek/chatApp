const express = require('express');
const session = require('express-session');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const User = require('./models/User');
const passport = require('passport');
require('./config/passport')(passport);

// Datenbankverbindung
const mongoURL = 'mongodb://localhost:27017/ChatApp';

mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB erfolgreich verbunden'))
    .catch(err => console.error('MongoDB Verbindungsfehler:', err));

app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});

io.on('connection', (socket) => {
    console.log('a user connected');

    // Listener für Chat-Nachrichten
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); // Sendet die Nachricht an alle verbunden Clients 
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
    })
})

// Konfiguriere die Session-Middleware
app.use(session({
    secret: 'geheimesSchlüsselwort', // Ein Geheimnis, um die Session zu signieren
    resave: false, // Verhindert, dass die Session bei jedem Request neu gespeichert wird
    saveUninitialized: false, // Verhindert das Speichern leerer Sessions
    // Weitere Konfigurationen können hinzugefügt werden
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Registrierungsrouten
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userExists = await User.findOne({ username: username });
        if (userExists) {
            console.log("Benutzername bereits vergeben.");
            return res.status(400).json({ message: "Benutzername bereits vergeben." });
        } else {
            const newUser = new User({ username, password });
            await newUser.save();
            console.log("Registrierung erfolgreich.");
            res.status(200).json({ message: "Registrierung erfolgreich." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Serverfehler" });
    }
});

// Anmelderouten
app.post('/login', passport.authenticate('local'), (req, res) => {
    console.log("Anmeldung erfolgreich.");
    res.json({ message: "Anmeldung erfolgreich.", user: req.user });
});