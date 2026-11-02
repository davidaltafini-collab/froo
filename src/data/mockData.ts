import { Leaf, MapPin, Coffee, Tag } from 'lucide-react';
import type { Offer, Transaction, CatalogueCategory } from '../types';

export const OFFERS: Offer[] = [
  {
    id: 1,
    title: 'Dairy & Eggs',
    desc: 'Off any purchase over $30',
    discount: '20% OFF',
    icon: Leaf,
    color: 'bg-green-100 text-green-600',
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 2,
    title: 'Fresh Produce',
    desc: 'On all organic vegetables',
    discount: '15% OFF',
    icon: MapPin,
    color: 'bg-green-100 text-green-700',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 3,
    title: 'Bakery',
    desc: 'Fresh baked bread & pastries',
    discount: '10% OFF',
    icon: Coffee,
    color: 'bg-orange-100 text-orange-600',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 4,
    title: 'Meat & Seafood',
    desc: 'Premium cuts',
    discount: '25% OFF',
    icon: Tag,
    color: 'bg-red-100 text-red-600',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=500',
  },
];

export const TRANSACTIONS: Transaction[] = [
  { id: 1, store: 'Store #402', date: 'Oct 18, 2023', amount: '-$14.20', points: '+42' },
  { id: 2, store: 'Store #211', date: 'Oct 15, 2023', amount: '-$89.50', points: '+150' },
  { id: 3, store: 'Store #104', date: 'Oct 12, 2023', amount: '-$24.00', points: '+60' },
];

export const CATALOGUE_ITEMS: CatalogueCategory[] = [
  { 
    id: 'produce', 
    name: 'Fresh Produce', 
    items: [
      { id: 'p1', name: 'Organic Bananas', price: 2.99, unit: 'per bunch', img: 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=400&q=80' },
      { id: 'p2', name: 'Avocados', price: 4.99, unit: '3 pack', img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80' },
      { id: 'p3', name: 'Strawberries', price: 3.49, unit: '1 lb', img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80' },
      { id: 'p4', name: 'Carrots', price: 1.99, unit: '1 bunch', img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80' },
    ]
  },
  { 
    id: 'dairy', 
    name: 'Dairy & Eggs', 
    items: [
      { id: 'd1', name: 'Whole Milk', price: 3.49, unit: '1 gallon', img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
      { id: 'd2', name: 'Large Brown Eggs', price: 4.29, unit: '1 dozen', img: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&q=80' },
      { id: 'd3', name: 'Greek Yogurt', price: 5.99, unit: '32 oz', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80' },
    ]
  }
];
