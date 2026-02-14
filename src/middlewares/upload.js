const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createError = require('http-errors');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/audio',
    'uploads/images',
    'uploads/documents',
    'uploads/profiles'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    createUploadDirs();
    
    // Determine destination based on file type
    if (file.mimetype.startsWith('audio/')) {
      cb(null, 'uploads/audio/');
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, 'uploads/images/');
    } else if (file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
      cb(null, 'uploads/documents/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/mp4'],
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  // Check file type
  if (file.mimetype.startsWith('audio/')) {
    if (allowedTypes.audio.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type. Only MP3, WAV, and MP4 are allowed.'));
    }
  } else if (file.mimetype.startsWith('image/')) {
    if (allowedTypes.image.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file type. Only JPEG, JPG, PNG, GIF, and WEBP are allowed.'));
    }
  } else if (file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
    if (allowedTypes.document.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid document file type. Only PDF and Word documents are allowed.'));
    }
  } else {
    cb(new Error('Invalid file type. Only audio, images, and documents are allowed.'));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  }
});

// Single file upload middleware
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(createError(400, 'File size exceeds 50MB limit'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(createError(400, 'Too many files uploaded'));
        }
        return next(createError(400, `Upload error: ${err.message}`));
      } else if (err) {
        return next(createError(400, err.message));
      }
      
      // Add file info to request for easier access
      if (req.file) {
        req.fileInfo = {
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype
        };
      }
      
      next();
    });
  };
};

// Multiple files upload middleware
const uploadMultiple = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(createError(400, 'File size exceeds 50MB limit'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(createError(400, `Maximum ${maxCount} files allowed`));
        }
        return next(createError(400, `Upload error: ${err.message}`));
      } else if (err) {
        return next(createError(400, err.message));
      }
      
      // Add files info to request
      if (req.files && req.files.length > 0) {
        req.filesInfo = req.files.map(file => ({
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        }));
      }
      
      next();
    });
  };
};

// Fields upload middleware for mixed file types
const uploadFields = (fields) => {
  return (req, res, next) => {
    upload.fields(fields)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(createError(400, `Upload error: ${err.message}`));
      } else if (err) {
        return next(createError(400, err.message));
      }
      
      // Process uploaded files
      if (req.files) {
        req.filesInfo = {};
        Object.keys(req.files).forEach(key => {
          if (Array.isArray(req.files[key])) {
            req.filesInfo[key] = req.files[key].map(file => ({
              filename: file.filename,
              path: file.path,
              size: file.size,
              mimetype: file.mimetype
            }));
          } else {
            req.filesInfo[key] = {
              filename: req.files[key].filename,
              path: req.files[key].path,
              size: req.files[key].size,
              mimetype: req.files[key].mimetype
            };
          }
        });
      }
      
      next();
    });
  };
};

// File cleanup utility
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Cleanup uploaded files on error
const cleanupFiles = (req, res, next) => {
  const cleanup = () => {
    if (req.file) {
      deleteFile(req.file.path).catch(err => {
        console.error('Error cleaning up file:', err);
      });
    }
    
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      files.forEach(file => {
        deleteFile(file.path).catch(err => {
          console.error('Error cleaning up file:', err);
        });
      });
    }
  };

  // Cleanup on error
  const originalNext = next;
  next = function(err) {
    if (err) {
      cleanup();
    }
    originalNext(err);
  };

  // Cleanup on response finish
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      cleanup();
    }
  });

  return next;
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  cleanupFiles
};