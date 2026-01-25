import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 } from 'uuid';
import { s3, s3BucketName } from '../config/s3.js';

export const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: s3BucketName,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, `${v4()}-${Date.now().toString()}`)
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'text/plain'];
        if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, Audio, and Text files are allowed.'), false);
        }
    }
});

export const uploadErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            data: null,
            error: err.message
        });
    }
    next(err);
};
