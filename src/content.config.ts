import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const ART_STYLES = ['Madhubani', 'Pichwai', 'Lippan', 'Gond', 'Texture', 'Mixed Media'] as const;

const artworks = defineCollection({
  loader: file('src/data/artworks.json', {
    parser: (text) => JSON.parse(text).items,
  }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    style: z.enum(ART_STYLES),
    medium: z.string(),
    year: z.number().int().optional(),
    dimensions: z.string().optional(),
    aspectRatio: z.number().positive(),
    featured: z.boolean().default(false),
    order: z.number().int().default(100),
    description: z.string().optional(),
    image: z.string(),
  }),
});

const workshops = defineCollection({
  loader: file('src/data/site.json', {
    parser: (text) => JSON.parse(text).workshops,
  }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    blurb: z.string(),
    durationHours: z.number().positive().optional(),
    order: z.number().int().default(100),
  }),
});

export const collections = { artworks, workshops };
