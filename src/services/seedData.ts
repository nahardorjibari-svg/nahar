import {
  Product,
  StockMovement,
  BrandSettings,
  Customer,
  VideoPost,
  SaleOrder,
  ReturnRecord,
} from '../types';

export const INITIAL_BRAND_SETTINGS: BrandSettings = {
  brandName: 'নাহার দর্জি বাড়ি (Nahar Dorji Bari)',
  logoUrl: '/src/assets/images/nahar_dorjibari_official_logo_1792248454639.jpg',
  slogan: 'এক্সক্লুসিভ ৩-পিস বুটিক ও টেইলার্স (Nahar Dorjibari)',
  currency: '৳',
  phone: '+880 1354-234702',
  email: 'nahardorjibari@gmail.com',
  address: 'Raj place, Rishipara, Padma mor, Hemayetpur, Dhaka, Bangladesh',
  branch: 'Hemayetpur Head Office & Showroom',
  defaultLowStockThreshold: 10,
  invoiceNote: 'নাহার দর্জি বাড়ি বেছে নেওয়ার জন্য ধন্যবাদ। সারা বাংলাদেশে স্টিডফাস্ট কুরিয়ারের মাধ্যমে হোম ডেলিভারি। ক্যাশ রিফান্ড নেই, ৩ দিনের মধ্যে রসিদসহ পণ্য পরিবর্তন যোগ্য।',
};

export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_VIDEOS: VideoPost[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_ORDERS: SaleOrder[] = [];
export const INITIAL_RETURNS: ReturnRecord[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
