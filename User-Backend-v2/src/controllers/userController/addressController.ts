import { Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/errors';
import { AuthRequest } from '../../types/auth.types';
import { 
  AddressResponse, 
  AddressListResponse,
  AddressTypeValue,
  CreateAddressSchema, 
  UpdateAddressSchema,
  AddressTypes
} from '../../schemas/addressSchemas';

export const addressController = {
  // Get all addresses for a user
  getAddresses: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      
      const addresses = await prisma.savedAddress.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      // Transform to match expected response type
      const transformedAddresses = addresses.map(addr => ({
        ...addr,
        addressType: addr.addressType as AddressTypeValue,
        addressLine2: addr.addressLine2 || undefined,
        customAddressName: addr.customAddressName || undefined,
        // Include all required fields from base schema
        isDefault: false, // Set a default value
        relation: undefined,
        latitude: undefined,
        longitude: undefined,
        familyMembers: addr.familyMembers as any,
        countryCode: addr.countryCode
      })) as AddressListResponse;

      res.json({
        status: 'success',
        data: transformedAddresses
      });
    } catch (error) {
      next(error);
    }
  },

  // Get a specific address
  getAddress: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;

      const address = await prisma.savedAddress.findFirst({
        where: {
          id: addressId,
          userId
        }
      });

      if (!address) {
        throw new AppError(404, 'Address not found');
      }

      // Transform to match expected response type
      const transformedAddress = {
        ...address,
        addressType: address.addressType as AddressTypeValue,
        addressLine2: address.addressLine2 || undefined,
        customAddressName: address.customAddressName || undefined,
        // Include all required fields from base schema
        relation: undefined,
        latitude: undefined,
        longitude: undefined,
        familyMembers: address.familyMembers as any,
        countryCode: address.countryCode
      } as AddressResponse;

      res.json({
        status: 'success',
        data: transformedAddress
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new address
  createAddress: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const createData = req.body as CreateAddressSchema;

      // If it's a custom address type, ensure customAddressName is provided
      if (createData.addressType === 'Other' && !createData.customAddressName) {
        throw new AppError(400, 'Custom address name is required for Other address type');
      }

      // Create address with proper fields for Prisma schema - removing isDefault
      const address = await prisma.savedAddress.create({
        data: {
          userId,
          addressType: createData.addressType,
          fullName: createData.fullName,
          phoneNumber: createData.phoneNumber,
          countryCode: createData.countryCode,
          addressLine1: createData.addressLine1,
          addressLine2: createData.addressLine2,
          city: createData.city,
          state: createData.state,
          postalCode: createData.postalCode,
          country: createData.country,
          // isDefault field is removed since it's not in the Prisma model
          customAddressName: createData.customAddressName,
          familyMembers: createData.familyMembers || []
        }
      });

      // Transform to match expected response type
      const transformedAddress = {
        ...address,
        addressType: address.addressType as AddressTypeValue,
        addressLine2: address.addressLine2 || undefined,
        customAddressName: address.customAddressName || undefined,
        isDefault: createData.isDefault || false, // Use the input value
        relation: createData.relation,
        latitude: createData.latitude,
        longitude: createData.longitude,
        familyMembers: address.familyMembers as any,
        countryCode: address.countryCode
      } as AddressResponse;

      res.status(201).json({
        status: 'success',
        data: transformedAddress
      });
    } catch (error) {
      next(error);
    }
  },

  // Update address
  updateAddress: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;
      const updateData = req.body as UpdateAddressSchema;

      // Check if address exists and belongs to user
      const existingAddress = await prisma.savedAddress.findFirst({
        where: {
          id: addressId,
          userId
        }
      });

      if (!existingAddress) {
        throw new AppError(404, 'Address not found');
      }

      // If it's a custom address type, ensure customAddressName is provided
      if (updateData.addressType === 'Other' && !updateData.customAddressName) {
        throw new AppError(400, 'Custom address name is required for Other address type');
      }

      // Update with fields that match Prisma schema - removing isDefault
      const updatedAddress = await prisma.savedAddress.update({
        where: { id: addressId },
        data: {
          addressType: updateData.addressType,
          fullName: updateData.fullName,
          phoneNumber: updateData.phoneNumber,
          countryCode: updateData.countryCode,
          addressLine1: updateData.addressLine1,
          addressLine2: updateData.addressLine2,
          city: updateData.city,
          state: updateData.state,
          postalCode: updateData.postalCode,
          country: updateData.country,
          // isDefault field is removed since it's not in the Prisma model
          customAddressName: updateData.customAddressName,
          familyMembers: updateData.familyMembers
        }
      });

      // Transform to match expected response type
      const transformedAddress = {
        ...updatedAddress,
        addressType: updatedAddress.addressType as AddressTypeValue,
        addressLine2: updatedAddress.addressLine2 || undefined,
        customAddressName: updatedAddress.customAddressName || undefined,
        isDefault: updateData.isDefault || false, // Use the input value
        relation: updateData.relation,
        latitude: updateData.latitude,
        longitude: updateData.longitude,
        familyMembers: updatedAddress.familyMembers as any,
        countryCode: updatedAddress.countryCode
      } as AddressResponse;

      res.json({
        status: 'success',
        data: transformedAddress
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete address
  deleteAddress: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;

      // Check if address exists and belongs to user
      const existingAddress = await prisma.savedAddress.findFirst({
        where: {
          id: addressId,
          userId
        }
      });

      if (!existingAddress) {
        throw new AppError(404, 'Address not found');
      }

      await prisma.savedAddress.delete({
        where: { id: addressId }
      });

      res.json({
        status: 'success',
        message: 'Address deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
