import express from 'express';
import dotenv from 'dotenv';
import { initializeS3 } from './src/config/s3.js';
import { uploadErrorHandler } from './src/middlewares/upload.js';
import userRoutes from './src/routes/userRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize S3 Bucket
initializeS3();

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