const env = require("./config/env.js");
const connectDB = require("./config/db.js");
const app = require("./app.js");

const PORT = env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        
        console.log('server to DB connection done');
        
        app.listen(PORT, () => {
            console.log(`server is running at http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error('Server failed to start')
        
        process.exit(1);
    }
}

startServer();
