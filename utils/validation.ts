import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name is required'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword']
});

export const ticketSchema = z.object({
  vehiclePlate: z.string().min(3, 'Vehicle plate is required'),
  bayNumber: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleColor: z.string().optional(),
  driverName: z.string().optional(),
  notes: z.string().optional(),
  pricingRuleId: z.string().min(1, 'Pricing rule is required')
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type TicketFormValues = z.infer<typeof ticketSchema>;
