import * as fs from 'fs';
import * as path from 'path';

interface MulterFile {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    folderName?: string;
}

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Ensures the upload directory exists
 */
const ensureUploadDir = (folderName: string): string => {
    const folderPath = path.join(UPLOADS_DIR, folderName);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    return folderPath;
};

/**
 * Uploads a file to local storage
 * @param file - Multer file object
 * @returns URL path of the uploaded file
 */
export const uploadToCloud = async (file: MulterFile): Promise<string> => {
    try {
        const folderName = file.folderName || 'appointment-documents';
        const uploadPath = ensureUploadDir(folderName);

        // Generate unique filename using timestamp and original name
        const timestamp = new Date().getTime();
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
        const fileName = `${timestamp}-${safeFileName}`;
        const filePath = path.join(uploadPath, fileName);

        // Write file to disk
        await fs.promises.writeFile(filePath, file.buffer);

        // Return the relative URL path (to be served by express static)
        return `/uploads/${folderName}/${fileName}`;
    } catch (error) {
        console.error('Error saving file locally:', error);
        throw new Error('Failed to save file');
    }
};
