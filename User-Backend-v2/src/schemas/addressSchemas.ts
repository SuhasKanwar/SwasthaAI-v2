import { z } from 'zod';

// Address type definitions
export const AddressTypes = ['Home', 'Work', 'Other'] as const;
export const AddressTypeEnum = z.enum(AddressTypes);
export type AddressTypeValue = z.infer<typeof AddressTypeEnum>;

// Base address schema
const addressBaseSchema = z.object({
  addressType: AddressTypeEnum,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phoneNumber: z.string()
    .regex(/^\d+$/, 'Phone number must contain only digits') // Allow only digits, flexible length
    .min(5, 'Phone number seems too short')
    .max(15, 'Phone number seems too long'),
  countryCode: z.string()
    .regex(/^\+[1-9]\d{0,3}$/, 'Country code must start with + and be 1-4 digits'), // Allow up to 4 digits for country code
  addressLine1: z.string().min(1, 'House/Building number is required'),
  addressLine2: z.string().nullable().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().regex(/^\d{6}$/, 'Postal code must be 6 digits'), // Revert to 6 digits only
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().default(false),
  customAddressName: z.string().optional(),
  familyMembers: z.array(z.any()).optional(),
  relation: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export type AddressBase = z.infer<typeof addressBaseSchema>;

// Schema for creating/updating addresses
export const createAddressSchema = addressBaseSchema;
export const updateAddressSchema = addressBaseSchema.partial();

export type CreateAddressSchema = z.infer<typeof createAddressSchema>;
export type UpdateAddressSchema = z.infer<typeof updateAddressSchema>;

// Response schemas
export const addressResponseSchema = addressBaseSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type AddressResponse = z.infer<typeof addressResponseSchema>;
export const addressListResponseSchema = z.array(addressResponseSchema);
export type AddressListResponse = z.infer<typeof addressListResponseSchema>;

// Search query schema
export const addressSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: AddressTypeEnum.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10)
});

export type AddressSearchQuery = z.infer<typeof addressSearchSchema>;
