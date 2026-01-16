import express, { RequestHandler } from 'express';
import { verifyToken as auth } from '../../../middleware/auth';
import { validateBody } from '../../../middleware/validation';
import { addressController } from '../../../controllers/userController/addressController';
import { createAddressSchema, updateAddressSchema } from '../../../schemas/addressSchemas';

const router = express.Router();

// Get all saved addresses
router.get('/', auth as RequestHandler, addressController.getAddresses as RequestHandler);

// Get a specific address
router.get('/:id', auth as RequestHandler, addressController.getAddress as RequestHandler);

// Create new address
router.post('/', 
  auth as RequestHandler, 
  validateBody(createAddressSchema) as RequestHandler, 
  addressController.createAddress as RequestHandler
);

// Update address
router.put('/:id', 
  auth as RequestHandler, 
  validateBody(updateAddressSchema) as RequestHandler, 
  addressController.updateAddress as RequestHandler
);

// Delete address
router.delete('/:id', auth as RequestHandler, addressController.deleteAddress as RequestHandler);

export default router;
