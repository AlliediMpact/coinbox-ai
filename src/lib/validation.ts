import { z } from 'zod';

// Common reusable Zod schemas for fintech inputs
export const schemas = {
  userId: z.string().min(1).max(128),
  email: z.string().email().max(254),
  currency: z.enum(['NGN','USD','ZAR','EUR']).default('NGN'),
  amountKobo: z.number().int().positive().max(100_000_000_00), // up to 1,000,000 NGN
  note: z.string().max(200).optional(),
  uuid: z.string().uuid(),
};

// Helpers
export function validateBody<T extends z.ZodTypeAny>(req: Request, schema: T) {
  return req.json().then((data) => schema.parse(data));
}

export function safeParseBody<T extends z.ZodTypeAny>(req: Request, schema: T) {
  return req.json().then((data) => schema.safeParse(data));
}

export const transferBodySchema = z.object({
  toUserId: schemas.userId,
  amountKobo: schemas.amountKobo,
  note: schemas.note,
});

export const depositBodySchema = z.object({
  amountKobo: schemas.amountKobo,
  reference: z.string().min(6).max(128),
});

export const withdrawBodySchema = z.object({
  amountKobo: schemas.amountKobo,
  destination: z.object({
    bankCode: z.string().min(2).max(16),
    accountNumber: z.string().min(6).max(20),
    name: z.string().min(2).max(100),
  }),
});
