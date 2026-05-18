const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/proposals';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// -------------------------------------------------------------------
// 1. Memory Storage (For CSV/Excel Batch Uploads)
// Best for files that only need to be parsed and immediately discarded
// -------------------------------------------------------------------
const csvStorage = multer.memoryStorage();

const csvFilter = (req, file, cb) => {
    const allowedMimetypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimetypes.includes(file.mimetype) || ext === '.csv' || ext === '.xlsx') {
        cb(null, true);
    } else {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid file format. Only CSV or Excel files allowed.'));
    }
};

const uploadCSV = multer({
    storage: csvStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: csvFilter
});

// -------------------------------------------------------------------
// 2. Disk Storage (For Proposal PDF Attachments)
// Best for permanent files that need to be served back to clients
// -------------------------------------------------------------------
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `proposal-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
        cb(null, true);
    } else {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF files are allowed for proposals.'));
    }
};

const uploadPDF = multer({
    storage: pdfStorage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: pdfFilter
});

module.exports = { uploadCSV, uploadPDF };