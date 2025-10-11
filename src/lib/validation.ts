import { z } from 'zod';

export const RSVPCreate = z.object({
  event_id: z.string().uuid(),
});

export const ReviewCreate = z.object({
  venue_id: z.string().uuid(),
  predictability: z.number().min(1).max(5),
  sensory_level: z.number().min(1).max(5),
  staff_knowledge: z.number().min(1).max(5),
  content: z.string().max(1000).optional(),
  best_time: z.string().max(200).optional(),
  triggers: z.array(z.string()).optional(),
});

export const VenueImport = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  type: z.string(),
  city_id: z.string().uuid(),
  quiet_room: z.boolean(),
  hand_dryer: z.boolean(),
  visual_supports: z.boolean(),
});

export type RSVPCreateInput = z.infer<typeof RSVPCreate>;
export type ReviewCreateInput = z.infer<typeof ReviewCreate>;
export type VenueImportInput = z.infer<typeof VenueImport>;
