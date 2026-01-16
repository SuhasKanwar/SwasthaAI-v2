import prisma from "@/config/prisma";
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyToken as auth } from '../middleware/auth';
import { AuthRequest } from '../types/auth.types';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const asHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => fn(req as AuthRequest, res, next);
};

const router = express.Router();

router.use(asHandler(auth));

// Configure local vault storage
const vaultDir = path.join(__dirname, '../../vault');
if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, vaultDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}-${safeOriginalName}`);
  },
});

const upload = multer({ storage });

router.post("/check-pin", asHandler(async (req, res) => {
    const { pin } = req.body;

    try {
        const securityPin = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { securityPin: true },
        });
        if (!securityPin) {
            return res.status(404).json({ message: "User not found" });
        }
        if (securityPin.securityPin === pin) {
            return res.status(200).json({ message: "PIN is correct" });
        }
        return res.status(401).json({ message: "Incorrect PIN" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}));

router.post(
  "/store-report",
  upload.single("report"), // Expect the file in the "report" field of multipart/form-data
  asHandler(async (req, res) => {
    const file = (req as Request & { file?: Express.Multer.File }).file;

    if (!file) {
      return res.status(400).json({ message: "No report file provided" });
    }

    const { title, notes, recordType } = req.body;
    const publicUrl = `/vault/${file.filename}`;

    try {
      const vaultFile = await prisma.vaultFile.create({
        data: {
          userId: req.user.id,
          title: title || file.originalname,
          notes: notes || null,
          recordType: recordType || null,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          publicUrl,
        },
      });

      return res.status(201).json({
        message: "Report stored in vault",
        report: vaultFile,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to store report in DB" });
    }
  })
);

export default router;