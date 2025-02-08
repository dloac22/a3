const mongoose = require("mongoose");

const PracticeSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    practiceType: String,
    duration: Number,
    score: Number,
    date: String,
});

module.exports = mongoose.model("Practice", PracticeSchema);
