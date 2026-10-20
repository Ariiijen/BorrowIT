import { z } from 'zod'

export const emailLoginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export const emailRegisterSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  confirmPassword: z.string(),
  role: z.enum(['Borrower', 'Lender', 'Faculty']),
  studentNumber: z.string().trim().optional(),
  employeeNumber: z.string().trim().optional(),
  acceptedTerms: z.boolean().refine(Boolean, 'You must accept the terms to continue.'),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' })
  }
  if (values.role === 'Faculty' && !values.employeeNumber?.trim()) {
    context.addIssue({ code: 'custom', path: ['employeeNumber'], message: 'Employee number is required.' })
  }
  if (values.role !== 'Faculty' && !values.studentNumber?.trim()) {
    context.addIssue({ code: 'custom', path: ['studentNumber'], message: 'Student number is required.' })
  }
})
