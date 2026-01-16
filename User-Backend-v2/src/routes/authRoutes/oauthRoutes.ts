import express from 'express';
import { getGoogleAuthURL, handleGoogleCallback } from '../../controllers/authController/oauthController';

const router = express.Router();

router.get('/google/url', getGoogleAuthURL);
router.get('/google/callback', handleGoogleCallback);

export default router;