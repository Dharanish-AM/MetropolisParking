import { z } from 'zod';

export const plateNumberSchema = z
  .string()
  .min(1, 'Plate number is required')
  .transform(val => val.toUpperCase().replace(/\s/g, ''))
  .refine(val => /^[A-Z0-9-]{4,15}$/.test(val), {
    message:
      'Plate number must be alphanumeric (optionally with hyphens) and 4 to 15 characters long.',
  });

export const vehicleTypeSchema = z.enum(['CAR', 'BIKE', 'SUV', 'TRUCK', 'EV']);

export const vehicleSchema = z.object({
  plateNumber: plateNumberSchema,
  type: vehicleTypeSchema,
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
