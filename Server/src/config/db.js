const mongoose =  require("mongoose");

const env = require("../config/env.js");

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(env.MONGO_URI);

        console.log(`MongoDB Connected Successfully.`);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
