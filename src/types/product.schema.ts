// src/types/product.schema.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
  image: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  rating: z.number().optional(),
});

export const ProductListSchema = z.array(ProductSchema);

export type Product = z.infer<typeof ProductSchema>;

export interface CartItem {
  product: Product;
  quantity: number;
}