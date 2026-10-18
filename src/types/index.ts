export interface Product {
  id: string;
  productCode: string; // e.g. "RP-001", unique, uppercase
  name: string; // e.g. "Royal Floral 3-Piece"
  images: string[]; // Multiple image URLs
  category: string; // e.g. "Cotton 3-Piece", "Georgette Party", "Luxury Lawn"
  color: string; // e.g. "Royal Blue", "Emerald Green", "Wine Red"
  size: string; // e.g. "Unstitched / Free Size", "Stitched M (38)", "Stitched L (40)"
  purchaseCost: number; // in ৳ BDT, e.g. 650
  defaultSellingPrice?: number | null; // optional, e.g. 1150
  initialStock: number; // e.g. 50
  currentStock: number; // dynamically updated
  lowStockThreshold: number; // e.g. 10
  notes?: string; // fabric composition, dupatta details, etc.
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 
  | 'INITIAL'
  | 'RESTOCK'
  | 'ADJUSTMENT_ADD'
  | 'ADJUSTMENT_SUBTRACT'
  | 'DAMAGE'
  | 'SALE'
  | 'RETURN_RESTOCK'
  | 'RETURN_DAMAGED'
  | 'ORDER_CANCEL';

export interface StockMovement {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  type: MovementType;
  quantity: number; // Absolute quantity affected (positive number)
  change: number; // Signed change, e.g. +20 or -5
  previousStock: number;
  newStock: number;
  unitCost?: number;
  reason: string;
  note?: string;
  orderId?: string;
  timestamp: string; // ISO String
  user: string;
}

export interface BrandSettings {
  brandName: string;
  logoUrl: string;
  slogan: string;
  currency: string;
  phone: string;
  email: string;
  address: string;
  branch: string;
  defaultLowStockThreshold: number;
  invoiceNote: string;
}

export interface FirebaseConnectionConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
  isConfigured: boolean;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Store Manager' | 'Sales Executive';
  avatar?: string;
  branch: string;
  isAuthenticated: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  district: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface VideoProductOffering {
  productCode: string;
  advertisedPrice: number; // The price announced in the video/reel
  notes?: string;
}

export interface VideoPost {
  id: string;
  title: string; // e.g. "Friday Evening Festive Live Campaign"
  platform: 'Facebook Live' | 'Facebook Reel' | 'TikTok' | 'YouTube' | 'Instagram';
  postDate: string; // ISO date string
  url?: string;
  productCodes: string[]; // Linked products
  productOfferings: VideoProductOffering[];
  adSpend: number; // e.g. ৳1500 boosted advertising
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  color: string;
  size: string;
  image: string;
  purchaseCost: number; // Unit wholesale cost
  sellingPrice: number; // Actual transaction selling price (can differ from default or video)
  quantity: number;
  discount: number; // Item-level discount
  totalAmount: number; // (sellingPrice * quantity) - discount
  grossProfit: number; // totalAmount - (purchaseCost * quantity)
  originVideoId?: string;
  originVideoTitle?: string;
  advertisedPrice?: number;
}

export interface OrderFinancials {
  subtotal: number;
  orderDiscount: number;
  deliveryFee: number; // Collected from customer
  sellerCourierCost: number; // Actual cost charged by courier (e.g. ৳70 inside Dhaka, ৳130 outside)
  packagingCost: number; // Poly, branded box, tags
  advertisingCost: number; // Allocated ad spend
  otherExpenses: number;
  totalPayable: number; // subtotal - orderDiscount + deliveryFee
  totalCogs: number; // Sum of purchase costs
  grossProfit: number; // (subtotal - orderDiscount) - totalCogs
  totalExpenses: number; // packagingCost + advertisingCost + otherExpenses + max(0, sellerCourierCost - deliveryFee)
  netProfit: number; // grossProfit - totalExpenses
}

export type OrderStatus = 
  | 'CONFIRMED'
  | 'PACKING'
  | 'PACKED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'PARTIALLY_RETURNED';

export type PaymentMethod = 'COD' | 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash';
export type PaymentStatus = 'PENDING_COD' | 'COLLECTED' | 'REFUNDED';

export interface SaleOrder {
  id: string;
  orderNumber: string; // e.g. ND-ORD-2026-1045
  invoiceNumber: string; // e.g. ND-INV-2026-1045
  createdAt: string;
  customer: {
    id?: string;
    name: string;
    phone: string;
    address: string;
    district: string;
  };
  items: OrderItem[];
  financials: OrderFinancials;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    collectedAt?: string;
    trxId?: string;
  };
  status: OrderStatus;
  courier: {
    provider: string; // e.g. "Steadfast Courier"
    consignmentId?: string; // Official Steadfast Consignment ID
    trackingCode?: string; // Official Steadfast Tracking Code
    zone: 'Inside Dhaka' | 'Outside Dhaka';
    bookedAt?: string;
    bookingStatus?: 'PENDING' | 'BOOKED' | 'FAILED' | 'CANCELLED';
    errorMessage?: string;
  };
  originVideoId?: string;
  originVideoTitle?: string;
  notes?: string;
  verificationToken: string; // Unique cryptographic token for QR verification
  isStockDeducted: boolean; // Safe transaction flag
  createdBy: string;
  updatedAt: string;
}

export type ReturnReason = 
  | 'Size / Fitting Issue'
  | 'Color / Pattern Variation'
  | 'Fabric or Stitching Defect'
  | 'Late Delivery'
  | 'Customer Changed Mind'
  | 'Damaged in Courier Transit'
  | 'Other';

export interface ReturnRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  quantityReturned: number;
  unitSellingPrice: number;
  reason: ReturnReason;
  itemCondition: 'RESELLABLE' | 'DAMAGED';
  refundAmount: number;
  deductDeliveryFee: boolean;
  restocked: boolean; // True if restocked to available inventory, false if routed to damaged stock
  processedBy: string;
  notes?: string;
  createdAt: string;
}

export interface SettlementRecord {
  id: string;
  settlementReference: string; // e.g. STDL-2026-9981
  settlementDate: string;
  source: 'Steadfast Portal API' | 'Steadfast CSV Import' | 'Manual Bank Transfer';
  totalPaidAmount: number;
  matchedOrderIds: string[]; // Order IDs covered by this settlement
  courierDeductions: number;
  notes?: string;
  createdAt: string;
  recordedBy: string;
}

export type PageId = 
  | 'dashboard'
  | 'products'
  | 'stock'
  | 'new-sale'
  | 'sales'
  | 'videos'
  | 'invoices'
  | 'courier'
  | 'settlements'
  | 'returns'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'login';

export type GlassTheme = 'emerald' | 'sapphire' | 'amethyst' | 'amber' | 'cyber-ice' | 'ruby-rose';

export type GlassFrostMode = 'crisp' | 'frosted' | 'deep';

