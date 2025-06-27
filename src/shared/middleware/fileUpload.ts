import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../errors/AppError';

// Ensure upload directories exist
const createDirectories = () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  const profilePicsDir = path.join(uploadDir, 'profile-pictures');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  if (!fs.existsSync(profilePicsDir)) {
    fs.mkdirSync(profilePicsDir, { recursive: true });
  }
  
  return { uploadDir, profilePicsDir };
};

const { profilePicsDir } = createDirectories();

// Storage configuration for profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePicsDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${fileExt}`);
  }
});

// File filter for images
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (!file.mimetype.startsWith('image/')) {
    return cb(new AppError('Only image files are allowed', 'INVALID_FILE_TYPE', 400));
  }
  
  // Validate file extension
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (!validExtensions.includes(fileExt)) {
    return cb(new AppError(`Invalid file extension. Allowed: ${validExtensions.join(', ')}`, 'INVALID_FILE_TYPE', 400));
  }
  
  cb(null, true);
};

// Create multer instances for different upload types
export const profilePictureUpload = multer({
  storage: profilePictureStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Helper to get public URL for uploaded files
export const getFileUrl = (filename: string, type: 'profile-picture'): string => {
  if (!filename) return '';
  
  // In a production environment, this might be a CDN URL
  // For development, we'll use a local path
  return `/uploads/${type}/${filename}`;
};

// Helper to delete file
export const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}; 