import { z } from 'zod';

export const SaleItemSchema = z.object({
    product_id: z.string(),
    product_name: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    total: z.number()
});

export type SaleItem = z.infer<typeof SaleItemSchema>;

export const SaleSchema = z.object({
  id: z.string(),
  transaction_number: z.string(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  sale_date: z.any(),
  total_amount: z.number(),
  payment_method: z.enum(["Cash", "Mobile Money", "Bank Transfer"]),
  status: z.enum(["completed", "pending"]),
  created_by: z.string(),
  items: z.array(SaleItemSchema)
});

export type Sale = z.infer<typeof SaleSchema>;

export const SaleFormSchema = z.object({
    transaction_number: z.string().optional(),
    customer_name: z.string().optional(),
    customer_phone: z.string().optional(),
    sale_date: z.string().min(1, "Sale date is required"),
    total_amount: z.coerce.number(),
    payment_method: z.enum(["Cash", "Mobile Money", "Bank Transfer"]),
    status: z.enum(["completed", "pending"]),
    items: z.array(z.object({
        product_id: z.string(),
        product_name: z.string(),
        quantity: z.coerce.number().default(1),
        unit_price: z.coerce.number().default(0),
        total: z.coerce.number().default(0),
    })).min(1, "At least one item is required."),
}).transform((data) => ({
    ...data,
    items: data.items.filter(item => item.product_id && item.quantity > 0),
}));

export type SaleFormData = z.infer<typeof SaleFormSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
  sku: z.string(),
  description: z.string().optional(),
  unit: z.string(),
  default_selling_price: z.coerce.number().optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean(),
  type: z.enum(['finished', 'raw', 'packaging']),
  current_stock_quantity: z.coerce.number().optional(),
  reorder_level: z.coerce.number().optional(),
  supplierId: z.string().optional(),
  cost_per_unit: z.coerce.number().optional(),
  last_restocked_at: z.any().optional(),
  quantity_on_hand: z.coerce.number().optional(),
  location: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type Product = z.infer<typeof ProductSchema>;
export const ProductFormSchema = ProductSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type ProductFormData = z.infer<typeof ProductFormSchema>;
export type ProductCategory = { id: string; name: string; };

export const StockAdjustmentSchema = z.object({
    id: z.string(),
    product_id: z.string().min(1),
    product_name: z.string(),
    adjustment_date: z.any(),
    quantity: z.coerce.number().min(0.01, "Quantity must be greater than zero."),
    adjustment_type: z.enum(['Damage', 'Loss', 'Correction', 'Return']),
    reason: z.string().min(5, "A reason is required for adjustments."),
    logged_by: z.string(),
});

export type StockAdjustment = z.infer<typeof StockAdjustmentSchema>;
