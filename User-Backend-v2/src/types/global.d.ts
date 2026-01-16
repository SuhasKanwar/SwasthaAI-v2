declare module 'nanoid' {
  export default function nanoid(size?: number): string;
}

declare global {
  namespace Express {
    interface Multer {
      File: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      JWT_SECRET: string;
      DATABASE_URL: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_CALLBACK_URL: string;
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      FROM_EMAIL: string;
      CLOUD_NAME: string;
      CLOUD_API_KEY: string;
      CLOUD_API_SECRET: string;
    }
  }
}