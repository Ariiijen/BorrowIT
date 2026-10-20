import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const equipmentSchema = z.object({
  name: z.string().min(2, 'Equipment name is required'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  condition: z.enum(['excellent', 'good', 'fair', 'needs_repair']),
})
