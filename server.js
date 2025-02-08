require("dotenv").config();
const express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    session = require("express-session"),
    LocalStrategy = require("passport-local").Strategy,
    GitHubStrategy = require("passport-github2").Strategy,
    bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
    username: String,
    githubId: String,  
    password: String,
});

const PracticeSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    practiceType: String,
    duration: Number,
    score: Number,
    date: String,
});

const User = mongoose.model("User", UserSchema);
const Practice = mongoose.model("Practice", PracticeSchema);

// Middleware
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      
      if (!user) {
        user = new User({
          githubId: profile.id,
          username: profile.username
        });
        await user.save();
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// GitHub Authentication Routes
app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );
  
  app.get('/auth/github/callback', 
    passport.authenticate('github', { 
      successRedirect: '/',
      failureRedirect: '/' 
    })
  );

// Passport strategy
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await User.findOne({ username: username });
        // If the user is not found, return an error message
        if (!user) {
            return done(null, false, { message: "User not found" });
        }

        // If the password does not match, return an error message
        if (user.password !== password) {
            return done(null, false, { message: "Incorrect password" });
        }
        // Default case: return the user object
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Serialization methods
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Routes
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.post("/login", passport.authenticate("local"), (req, res) => res.send("Logged in"));
app.get("/logout", (req, res) => {
    req.logout(function(err) {
        if (err) return next(err);
        req.session.destroy(() => {
            res.send("Logged out");
        });
    });
});


// Signup route
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    try {
        let existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send("Username already exists.");
        }

        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).send("User created successfully.");
    } catch (error) {
        res.status(500).send("Error creating user.");
    }
});

// Practice data routes
app.get("/data", async (req, res) => {
    console.log("Session User in /data:", req.user); // Debugging line
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
        const data = await Practice.find({ userId: req.user._id }); // Use `_id`, not `id`
        res.json(data);
    } catch (err) {
        res.status(500).send("Error retrieving data");
    }
});


// Add practice data
app.post("/add", async (req, res) => {
    console.log("Session User:", req.user); // Debugging line
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
        const newPractice = new Practice({ ...req.body, userId: req.user.id });
        await newPractice.save();
        res.send("Practice data added");
    } catch (err) {
        res.status(500).send("Error adding practice data");
    }
});


// Update practice data
app.put("/update/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
        // Find the practice data entry
        const updatedPractice = await Practice.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }  // Returns the updated document
        );
        // If the entry was not found, return a 404 status
        if (!updatedPractice) {
            return res.status(404).send("Entry not found");
        }
        // Return the updated document as JSON
        res.json(updatedPractice);
    } catch (err) {
        // If there is an error, return a 500 status with an error message
        res.status(500).send("Error updating entry");
    }
});


// Delete practice data
app.delete("/delete/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    try {
        await Practice.findByIdAndDelete(req.params.id);
        res.send("Entry deleted");
    } catch (err) {
        res.status(500).send("Error deleting entry");
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));