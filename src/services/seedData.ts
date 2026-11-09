import {
  Product,
  StockMovement,
  BrandSettings,
  Customer,
  VideoPost,
  SaleOrder,
  ReturnRecord,
  PreOrder,
} from '../types';

export const INITIAL_BRAND_SETTINGS: BrandSettings = {
  brandName: 'নাহার দর্জি বাড়ি (Nahar Dorji Bari)',
  logoUrl: '/src/assets/images/nahar_dorjibari_official_logo_1792248454639.jpg',
  slogan: 'এক্সক্লুসিভ ৩-পিস, অর্গানিক অয়েল ও টেইলার্স (Nahar Dorjibari)',
  currency: '৳',
  phone: '+880 1354-234702',
  email: 'nahardorjibari@gmail.com',
  address: 'Raj place, Rishipara, Padma mor, Hemayetpur, Dhaka, Bangladesh',
  branch: 'Hemayetpur Head Office & Showroom',
  defaultLowStockThreshold: 10,
  invoiceNote: 'নাহার দর্জি বাড়ি বেছে নেওয়ার জন্য ধন্যবাদ। সারা বাংলাদেশে স্টিডফাস্ট কুরিয়ারের মাধ্যমে হোম ডেলিভারি। ক্যাশ রিফান্ড নেই, ৩ দিনের মধ্যে রসিদসহ পণ্য পরিবর্তন যোগ্য।',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-oil-001',
    productCode: 'OIL-001',
    name: 'কোল্ড প্রেসড নারিকেল তেল ৫০০ মিলি (Cold Pressed Coconut Oil 500mL)',
    images: [
      '/assets/aistudio/IMG_5666.JPG_9edab587.jpeg',
      '/assets/aistudio/IMG_5673_72fed036.JPEG',
    ],
    category: 'অর্গানিক ও স্কিনকেয়ার (Organic & Skincare)',
    color: 'ন্যাচারাল ক্রিস্টাল ক্লিয়ার (Natural)',
    size: '500 mL কাঁচের বয়াম',
    purchaseCost: 420,
    defaultSellingPrice: 690,
    initialStock: 60,
    currentStock: 56,
    lowStockThreshold: 10,
    notes: '১০০% খাঁটি কোল্ড প্রেসড এক্সট্রা ভার্জিন নারিকেল তেল। চুল ও ত্বকের গভীর পুষ্টির জন্য আদর্শ। ফ্রেশ ইনটেক ও প্রি-অর্ডারে সবচেয়ে জনপ্রিয়।',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-nd-001',
    productCode: 'RP-001',
    name: 'রয়েল ফ্লোরাল কটন ৩-পিস (Royal Floral Cotton 3-Piece)',
    images: ['/src/assets/images/three_piece_royal_floral_1792247226094.jpg'],
    category: 'Cotton Georgette 3-Piece',
    color: 'রয়েল ব্লু (Royal Blue)',
    size: 'Unstitched / Free Size',
    purchaseCost: 650,
    defaultSellingPrice: 1250,
    initialStock: 40,
    currentStock: 32,
    lowStockThreshold: 8,
    notes: 'প্রিমিয়াম ডিজিটাল প্রিন্ট সুতি থ্রি-পিস ও শিফন দোপাট্টা।',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_PRE_ORDERS: PreOrder[] = [
  {
    id: 'pre-1001',
    orderNumber: 'PO-2026-001',
    customerName: 'সুমাইয়া তাসনিম',
    phone: '01712345678',
    district: 'ঢাকা',
    fullAddress: 'বাসা ২৮, রোড ৪, ব্লক সি, বনশ্রী, ঢাকা',
    items: [
      {
        productId: 'prod-oil-001',
        productCode: 'OIL-001',
        productName: 'কোল্ড প্রেসড নারিকেল তেল ৫০০ মিলি (Cold Pressed Coconut Oil 500mL)',
        category: 'অর্গানিক ও স্কিনকেয়ার (Organic & Skincare)',
        image: '/assets/aistudio/IMG_5666.JPG_9edab587.jpeg',
        unitPrice: 690,
        quantity: 2,
        totalPrice: 1380,
      },
    ],
    advancePayment: 200,
    deliveryFee: 70,
    totalAmount: 1450,
    dueAmount: 1250,
    courierName: 'Steadfast Courier',
    rawPastedText: '👤 আপনার নাম: সুমাইয়া তাসনিম\n📞 মোবাইল নম্বর: 01712345678\n🏙️ জেলা: ঢাকা\n📍 সম্পূর্ণ ঠিকানা: বাসা ২৮, রোড ৪, ব্লক সি, বনশ্রী, ঢাকা',
    notes: 'নারিকেল তেল ২ বোতল প্রি-অর্ডার, বিকাশ ২০০ টাকা অগ্রিম নেওয়া হয়েছে।',
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'pre-1002',
    orderNumber: 'PO-2026-002',
    customerName: 'নুসরাত জাহান',
    phone: '01898765432',
    district: 'চট্টগ্রাম',
    fullAddress: 'জিইসি মোড়, নাসিরাবাদ হাউজিং সোসাইটি, চট্টগ্রাম',
    items: [
      {
        productId: 'prod-oil-001',
        productCode: 'OIL-001',
        productName: 'কোল্ড প্রেসড নারিকেল তেল ৫০০ মিলি (Cold Pressed Coconut Oil 500mL)',
        category: 'অর্গানিক ও স্কিনকেয়ার (Organic & Skincare)',
        image: '/assets/aistudio/IMG_5666.JPG_9edab587.jpeg',
        unitPrice: 690,
        quantity: 1,
        totalPrice: 690,
      },
      {
        productId: 'prod-nd-001',
        productCode: 'RP-001',
        productName: 'রয়েল ফ্লোরাল কটন ৩-পিস (Royal Floral Cotton 3-Piece)',
        category: 'Cotton Georgette 3-Piece',
        image: '/src/assets/images/three_piece_royal_floral_1792247226094.jpg',
        unitPrice: 1250,
        quantity: 1,
        totalPrice: 1250,
      },
    ],
    advancePayment: 300,
    deliveryFee: 130,
    totalAmount: 2070,
    dueAmount: 1770,
    courierName: 'Steadfast Courier',
    rawPastedText: '👤 আপনার নাম: নুসরাত জাহান\n📞 মোবাইল নম্বর: 01898765432\n🏙️ জেলা: চট্টগ্রাম\n📍 সম্পূর্ণ ঠিকানা: জিইসি মোড়, নাসিরাবাদ হাউজিং সোসাইটি, চট্টগ্রাম',
    notes: 'চট্টগ্রাম কুরিয়ার পার্সেল',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_VIDEOS: VideoPost[] = [];
export const INITIAL_ORDERS: SaleOrder[] = [];
export const INITIAL_RETURNS: ReturnRecord[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

