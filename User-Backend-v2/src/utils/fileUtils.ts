import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AppError } from './errors';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

interface MulterFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  folderName?: string;
}

/**
 * Uploads a file to cloud storage
 * @param file - Multer file object
 * @returns URL of the uploaded file
 */
export const uploadToCloud = async (file: MulterFile): Promise<string> => {
  try {
    // Generate unique filename using timestamp and original name
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, '-')}`;
    
    // Set up S3 upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${file.folderName || 'profile-photos'}/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    // Upload to S3
    await s3Client.send(new PutObjectCommand(params));

    // Return the public URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.folderName || 'profile-photos'}/${fileName}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new AppError(500, 'Failed to upload file');
  }
};
