import express from 'express';
import dotenv from 'dotenv';
import { initializeS3 } from './src/config/s3.js';
import { connectRedis } from './src/config/redis.js';
import { uploadErrorHandler } from './src/middlewares/upload.js';
import userRoutes from './src/routes/userRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import { rateLimiter } from './src/middlewares/rateLimiter.js';
import cors from 'cors'

dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json());
app.use(rateLimiter(100, 60)); // 100 requests per minute

// Initialize S3 Bucket
initializeS3();

// Initialize Redis
connectRedis();

// Routes
app.get("/", (req, res) => {
    res.send("I am up")
})

app.use('/user', userRoutes);
app.use('/chat', chatRoutes);

// Error Handling
app.use(uploadErrorHandler);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        data: null,
        error: "An internal server error occurred"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
});