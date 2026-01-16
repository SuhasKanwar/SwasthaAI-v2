import prisma from "@/config/prisma";
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyToken as auth } from '../middleware/auth';
import { AuthRequest } from '../types/auth.types';

const asHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => any): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => fn(req as AuthRequest, res, next);
};

const router = express.Router();

router.use(asHandler(auth));

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

router.post("/store-report", asHandler(async (req, res) => {
}));

export default router;