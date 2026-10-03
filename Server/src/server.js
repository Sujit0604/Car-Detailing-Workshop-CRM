const env = require("./config/env.js");
const connectDB = require("./config/db.js");
const app = require("./app.js");
const logger = require("./utils/logger.js");
const { verifySmtpConnection } = require("./config/EmailConfig.js");

const PORT = env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        
        // console.log('server to DB connection done');
        logger.info('server to DB connection done');

        // Reported, never fatal: the API must stay up even if SMTP is down.
        // Deliberately after listen() so a slow or dead SMTP host cannot delay
        // the service becoming ready.
        void verifySmtpConnection();
        
        app.listen(PORT, () => {
            // console.log(`server is running at http://localhost:${PORT}`);
            logger.info(`server is running at http://localhost:${PORT}`);
        });
        
    } catch (error) {
        // console.error('Server failed to start');
        logger.error('Server failed to start');
        
        process.exit(1);
    }
}

startServer();
