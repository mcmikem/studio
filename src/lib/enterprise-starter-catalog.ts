export type StarterCategory = { name: string };

export type StarterProduct = {
  name: string;
  sku: string;
  type: 'finished' | 'raw' | 'packaging';
  category: string;
  unit: string;
  default_selling_price?: number;
  cost_per_unit?: number;
  reorder_level?: number;
  quantity_on_hand?: number;
  current_stock_quantity?: number;
  location?: string;
  description: string;
};

export const starterCategories: StarterCategory[] = [
  { name: 'Dignity Pads' },
  { name: 'Essential Soaps' },
  { name: 'Body Care' },
  { name: 'Pad Materials' },
  { name: 'Soap Inputs' },
  { name: 'Packaging' },
];

export const starterProducts: StarterProduct[] = [
  {
    name: 'Dignity Reusable Pad',
    sku: 'OE-PAD-SINGLE',
    type: 'finished',
    category: 'Dignity Pads',
    unit: 'piece',
    default_selling_price: 6000,
    quantity_on_hand: 0,
    reorder_level: 100,
    location: 'Main Store',
    description: 'Washable reusable pad; key RED Campaign product.',
  },
  {
    name: 'Premium Botanical Soap',
    sku: 'OE-SOAP-BOTANICAL',
    type: 'finished',
    category: 'Essential Soaps',
    unit: 'bar',
    default_selling_price: 5000,
    quantity_on_hand: 0,
    reorder_level: 80,
    location: 'Main Store',
    description: 'Herb-infused premium botanical soap.',
  },
  {
    name: 'Strawberry Dove Soap',
    sku: 'OE-SOAP-STRAWBERRY',
    type: 'finished',
    category: 'Essential Soaps',
    unit: 'bar',
    default_selling_price: 4000,
    quantity_on_hand: 0,
    reorder_level: 80,
    location: 'Main Store',
    description: 'Fruity everyday soap bar for families.',
  },
  {
    name: 'Lavender Fresh Soap',
    sku: 'OE-SOAP-LAVENDER',
    type: 'finished',
    category: 'Essential Soaps',
    unit: 'bar',
    default_selling_price: 4000,
    quantity_on_hand: 0,
    reorder_level: 80,
    location: 'Main Store',
    description: 'Calming lavender soap bar.',
  },
  {
    name: 'Skin Protection Jelly',
    sku: 'OE-BODY-JELLY',
    type: 'finished',
    category: 'Body Care',
    unit: 'unit',
    default_selling_price: 3000,
    quantity_on_hand: 0,
    reorder_level: 60,
    location: 'Main Store',
    description: 'Bubble gum + herbs skin protection jelly.',
  },
  {
    name: 'One in a Melon Body Wash',
    sku: 'OE-BODY-WASH-MELON',
    type: 'finished',
    category: 'Body Care',
    unit: 'bottle',
    default_selling_price: 12000,
    quantity_on_hand: 0,
    reorder_level: 40,
    location: 'Main Store',
    description: 'Premium melon body wash product.',
  },
  {
    name: 'Absorbent Cotton Core',
    sku: 'RM-PAD-COTTON-CORE',
    type: 'raw',
    category: 'Pad Materials',
    unit: 'kg',
    cost_per_unit: 12000,
    current_stock_quantity: 0,
    reorder_level: 10,
    description: 'Raw absorbent material for pad production.',
  },
  {
    name: 'Waterproof Pad Layer',
    sku: 'RM-PAD-WATERPROOF',
    type: 'raw',
    category: 'Pad Materials',
    unit: 'meter',
    cost_per_unit: 8000,
    current_stock_quantity: 0,
    reorder_level: 20,
    description: 'Waterproof outer layer for reusable pads.',
  },
  {
    name: 'Soap Base Compound',
    sku: 'RM-SOAP-BASE',
    type: 'raw',
    category: 'Soap Inputs',
    unit: 'kg',
    cost_per_unit: 10000,
    current_stock_quantity: 0,
    reorder_level: 15,
    description: 'Primary soap making compound.',
  },
  {
    name: 'Fragrance & Botanical Blend',
    sku: 'RM-SOAP-FRAGRANCE',
    type: 'raw',
    category: 'Soap Inputs',
    unit: 'liter',
    cost_per_unit: 22000,
    current_stock_quantity: 0,
    reorder_level: 5,
    description: 'Fragrance and botanical infusion for soap variants.',
  },
  {
    name: 'Soap Wrapping Pack',
    sku: 'PK-SOAP-WRAP',
    type: 'packaging',
    category: 'Packaging',
    unit: 'pack',
    cost_per_unit: 5000,
    current_stock_quantity: 0,
    reorder_level: 20,
    description: 'Wrapping materials for soap bars.',
  },
  {
    name: 'Body Wash Bottle 250ml',
    sku: 'PK-BODY-BOTTLE-250',
    type: 'packaging',
    category: 'Packaging',
    unit: 'piece',
    cost_per_unit: 1200,
    current_stock_quantity: 0,
    reorder_level: 100,
    description: 'Packaging bottle for melon body wash.',
  },
];
