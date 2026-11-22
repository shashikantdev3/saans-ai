/** zod schemas for every API input. Anything that fails validation gets a 400. */
import { z } from 'zod';
import { profileSchema } from '../profile/schema';

const lat = z.coerce.number().min(-90).max(90);
const lon = z.coerce.number().min(-180).max(180);
const lang = z.enum(['en', 'hi']).default('en');
/** Letters (any script), spaces and a few punctuation marks used in place names. */
const placeName = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[\p{L}\p{M}\s.,'()-]+$/u);

export const geocodeQuery = z.object({
  q: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[\p{L}\p{M}\s.,'-]+$/u),
});

export const airQualityQuery = z.object({ lat, lon });

export const planBody = z.object({
  lat,
  lon,
  placeName,
  profile: profileSchema,
  lang,
});

export const chatBody = z.object({
  lat,
  lon,
  placeName,
  profile: profileSchema,
  lang,
  question: z.string().trim().min(1).max(500),
  history: z
    .array(z.object({ role: z.enum(['user', 'model']), text: z.string().max(1500) }))
    .max(10)
    .default([]),
});
