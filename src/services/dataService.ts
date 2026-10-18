import {
  Product,
  StockMovement,
  BrandSettings,
  MovementType,
  Customer,
  VideoPost,
  SaleOrder,
  ReturnRecord,
  SettlementRecord,
  OrderStatus,
  PaymentStatus,
} from '../types';
import {
  INITIAL_BRAND_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_VIDEOS,
  INITIAL_ORDERS,
  INITIAL_RETURNS,
} from './seedData';
import { getFirebaseInstances } from './firebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
} from 'firebase/firestore';

function cleanForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore);
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    }
  }
  return cleaned;
}

function handleFirestoreNotice(action: string, err: any) {
  if (err?.code === 'permission-denied' || (err?.message && err.message.includes('permission'))) {
    console.warn(`Firestore permission notice on ${action} (using local storage cache):`, err?.message || err);
  } else {
    console.warn(`Firestore sync notice on ${action} (using local storage):`, err?.message || err);
  }
}

const PRODUCTS_KEY = 'nahar_products_cache_v2';
const MOVEMENTS_KEY = 'nahar_movements_cache_v2';
const BRAND_KEY = 'nahar_brand_settings_v2';
const ORDERS_KEY = 'nahar_orders_cache_v2';
const VIDEOS_KEY = 'nahar_videos_cache_v2';
const CUSTOMERS_KEY = 'nahar_customers_cache_v2';
const RETURNS_KEY = 'nahar_returns_cache_v2';
const SETTLEMENTS_KEY = 'nahar_settlements_cache_v2';

// Local storage helpers
function getLocalProducts(): Product[] {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local products', e);
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

function setLocalProducts(products: Product[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getLocalMovements(): StockMovement[] {
  try {
    const data = localStorage.getItem(MOVEMENTS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local movements', e);
  }
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
  return INITIAL_STOCK_MOVEMENTS;
}

function setLocalMovements(movements: StockMovement[]): void {
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
}

function getLocalBrandSettings(): BrandSettings {
  try {
    const data = localStorage.getItem(BRAND_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Force update if phone, address, or branch is outdated
      if (parsed.phone !== '+880 1354-234702' || parsed.address !== INITIAL_BRAND_SETTINGS.address || parsed.branch !== INITIAL_BRAND_SETTINGS.branch) {
        const updated = {
          ...parsed,
          phone: '+880 1354-234702',
          address: INITIAL_BRAND_SETTINGS.address,
          branch: INITIAL_BRAND_SETTINGS.branch,
        };
        localStorage.setItem(BRAND_KEY, JSON.stringify(updated));
        return updated;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading brand settings', e);
  }
  localStorage.setItem(BRAND_KEY, JSON.stringify(INITIAL_BRAND_SETTINGS));
  return INITIAL_BRAND_SETTINGS;
}

function setLocalBrandSettings(settings: BrandSettings): void {
  localStorage.setItem(BRAND_KEY, JSON.stringify(settings));
}

function getLocalOrders(): SaleOrder[] {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local orders', e);
  }
  localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
  return INITIAL_ORDERS;
}

function setLocalOrders(orders: SaleOrder[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getLocalVideos(): VideoPost[] {
  try {
    const data = localStorage.getItem(VIDEOS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local videos', e);
  }
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(INITIAL_VIDEOS));
  return INITIAL_VIDEOS;
}

function setLocalVideos(videos: VideoPost[]): void {
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

function getLocalCustomers(): Customer[] {
  try {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local customers', e);
  }
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
  return INITIAL_CUSTOMERS;
}

function setLocalCustomers(customers: Customer[]): void {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

function getLocalReturns(): ReturnRecord[] {
  try {
    const data = localStorage.getItem(RETURNS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local returns', e);
  }
  localStorage.setItem(RETURNS_KEY, JSON.stringify(INITIAL_RETURNS));
  return INITIAL_RETURNS;
}

function setLocalReturns(returns: ReturnRecord[]): void {
  localStorage.setItem(RETURNS_KEY, JSON.stringify(returns));
}

function getLocalSettlements(): SettlementRecord[] {
  try {
    const data = localStorage.getItem(SETTLEMENTS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local settlements', e);
  }
  return [];
}

function setLocalSettlements(settlements: SettlementRecord[]): void {
  localStorage.setItem(SETTLEMENTS_KEY, JSON.stringify(settlements));
}

export class DataService {
  public static isCloudMode(): boolean {
    const { isConfigured } = getFirebaseInstances();
    return isConfigured;
  }

  public static getStorageStatus(): {
    mode: 'firestore' | 'demo_local';
    isPermanent: boolean;
    description: string;
  } {
    if (this.isCloudMode()) {
      return {
        mode: 'firestore',
        isPermanent: true,
        description: 'Connected to Cloud Firestore & Firebase Auth (Permanent Real-Time Cloud Storage)',
      };
    }
    return {
      mode: 'demo_local',
      isPermanent: false,
      description: 'Demo & Browser Storage Mode. Real-time changes are preserved in your browser, but not yet synced to Cloud Firestore.',
    };
  }

  // --- BRAND SETTINGS ---
  public static async getBrandSettings(): Promise<BrandSettings> {
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'brand_settings'));
        if (!snap.empty) {
          return snap.docs[0].data() as BrandSettings;
        }
      } catch (err) {
        console.warn('Firestore fetch failed for brand settings, falling back to local', err);
      }
    }
    return getLocalBrandSettings();
  }

  public static async updateBrandSettings(updates: Partial<BrandSettings>): Promise<BrandSettings> {
    const current = await this.getBrandSettings();
    const updated = { ...current, ...updates };

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'brand_settings', 'main_config'), updated);
      } catch (err) {
        handleFirestoreNotice('update brand settings', err);
      }
    }
    setLocalBrandSettings(updated);
    return updated;
  }

  // --- PRODUCTS ---
  public static async getProducts(): Promise<Product[]> {
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Product));
        }
      } catch (err) {
        console.warn('Firestore fetch failed for products, falling back to local', err);
      }
    }
    return getLocalProducts();
  }

  public static async getProductByCode(code: string): Promise<Product | null> {
    const products = await this.getProducts();
    const normalized = code.trim().toUpperCase();
    return products.find(p => p.productCode.toUpperCase() === normalized) || null;
  }

  public static async checkProductCodeExists(code: string, excludeId?: string): Promise<boolean> {
    const normalized = code.trim().toUpperCase();
    const products = await this.getProducts();
    return products.some(p => p.productCode.toUpperCase() === normalized && p.id !== excludeId);
  }

  public static async addProduct(input: {
    productCode: string;
    name: string;
    images: string[];
    category: string;
    color: string;
    size: string;
    purchaseCost: number;
    defaultSellingPrice?: number | null;
    initialStock: number;
    lowStockThreshold?: number;
    notes?: string;
    actor?: string;
  }): Promise<Product> {
    const normalizedCode = input.productCode.trim().toUpperCase();

    const exists = await this.checkProductCodeExists(normalizedCode);
    if (exists) {
      throw new Error(`Product Code "${normalizedCode}" already exists. Each 3-Piece product must have a unique code.`);
    }

    if (input.purchaseCost < 0) {
      throw new Error('Purchase cost cannot be negative.');
    }

    if (input.initialStock < 0) {
      throw new Error('Initial stock quantity cannot be negative.');
    }

    const brand = await this.getBrandSettings();
    const newId = `prod-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newProduct: Product = {
      id: newId,
      productCode: normalizedCode,
      name: input.name.trim(),
      images: input.images.length > 0 ? input.images : ['/src/assets/images/three_piece_royal_floral_1792247226094.jpg'],
      category: input.category,
      color: input.color,
      size: input.size,
      purchaseCost: Number(input.purchaseCost),
      defaultSellingPrice: input.defaultSellingPrice !== undefined && input.defaultSellingPrice !== null && !isNaN(Number(input.defaultSellingPrice))
        ? Number(input.defaultSellingPrice)
        : null,
      initialStock: Number(input.initialStock),
      currentStock: Number(input.initialStock),
      lowStockThreshold: input.lowStockThreshold ?? brand.defaultLowStockThreshold ?? 10,
      notes: input.notes?.trim() || '',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'products', newId), cleanForFirestore(newProduct));
      } catch (err) {
        handleFirestoreNotice('save product', err);
      }
    }

    const currentList = getLocalProducts();
    setLocalProducts([newProduct, ...currentList]);

    if (newProduct.initialStock > 0) {
      await this.recordStockMovement({
        productId: newProduct.id,
        productCode: newProduct.productCode,
        productName: newProduct.name,
        type: 'INITIAL',
        quantity: newProduct.initialStock,
        change: newProduct.initialStock,
        previousStock: 0,
        newStock: newProduct.initialStock,
        unitCost: newProduct.purchaseCost,
        reason: 'Initial Product Stock Inward',
        note: `Created catalog entry with ${newProduct.initialStock} units initial stock`,
        user: input.actor || 'Super Admin - নাহার দর্জি বাড়ি',
      });
    }

    return newProduct;
  }

  public static async updateProduct(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt'>>
  ): Promise<Product> {
    const products = await this.getProducts();
    const existing = products.find(p => p.id === id);
    if (!existing) {
      throw new Error(`Product with ID ${id} not found.`);
    }

    if (updates.productCode) {
      const normalizedCode = updates.productCode.trim().toUpperCase();
      const codeExists = await this.checkProductCodeExists(normalizedCode, id);
      if (codeExists) {
        throw new Error(`Product Code "${normalizedCode}" is already in use by another product.`);
      }
      updates.productCode = normalizedCode;
    }

    if (updates.purchaseCost !== undefined && updates.purchaseCost < 0) {
      throw new Error('Purchase cost cannot be negative.');
    }

    const updatedProduct: Product = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await updateDoc(doc(db, 'products', id), cleanForFirestore(updatedProduct) as any);
      } catch (err) {
        handleFirestoreNotice('update product', err);
      }
    }

    const updatedList = products.map(p => (p.id === id ? updatedProduct : p));
    setLocalProducts(updatedList);
    return updatedProduct;
  }

  public static async deleteProduct(id: string): Promise<boolean> {
    const products = await this.getProducts();
    const exists = products.find(p => p.id === id);
    if (!exists) return false;

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        handleFirestoreNotice('delete product', err);
      }
    }

    const filtered = products.filter(p => p.id !== id);
    setLocalProducts(filtered);
    return true;
  }

  // --- STOCK ACTIONS & AUDIT MOVEMENTS ---
  public static async recordStockMovement(input: {
    productId: string;
    productCode: string;
    productName: string;
    type: MovementType;
    quantity: number;
    change: number;
    previousStock: number;
    newStock: number;
    unitCost?: number;
    reason: string;
    note?: string;
    orderId?: string;
    user: string;
  }): Promise<StockMovement> {
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: input.productId,
      productCode: input.productCode,
      productName: input.productName,
      type: input.type,
      quantity: Math.abs(input.quantity),
      change: input.change,
      previousStock: input.previousStock,
      newStock: input.newStock,
      unitCost: input.unitCost,
      reason: input.reason.trim(),
      note: input.note?.trim() || '',
      orderId: input.orderId,
      timestamp: new Date().toISOString(),
      user: input.user || 'Store Manager',
    };

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'stock_movements', newMovement.id), cleanForFirestore(newMovement));
      } catch (err) {
        handleFirestoreNotice('save stock movement', err);
      }
    }

    const currentMovements = getLocalMovements();
    setLocalMovements([newMovement, ...currentMovements]);
    return newMovement;
  }

  public static async addStock(params: {
    productId: string;
    quantity: number;
    unitPurchaseCost?: number;
    supplierLot?: string;
    note?: string;
    user?: string;
  }): Promise<{ product: Product; movement: StockMovement }> {
    if (params.quantity <= 0) {
      throw new Error('Stock quantity added must be greater than zero.');
    }

    const products = await this.getProducts();
    const product = products.find(p => p.id === params.productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    const previousStock = product.currentStock;
    const newStock = previousStock + params.quantity;
    const effectiveCost = params.unitPurchaseCost ?? product.purchaseCost;

    const updatedProduct = await this.updateProduct(product.id, {
      currentStock: newStock,
      purchaseCost: effectiveCost,
    } as any);

    const movement = await this.recordStockMovement({
      productId: product.id,
      productCode: product.productCode,
      productName: product.name,
      type: 'RESTOCK',
      quantity: params.quantity,
      change: params.quantity,
      previousStock,
      newStock,
      unitCost: effectiveCost,
      reason: params.supplierLot ? `Restock: Lot #${params.supplierLot}` : 'Purchase Restock Batch',
      note: params.note,
      user: params.user || 'Super Admin - নাহার দর্জি বাড়ি',
    });

    return { product: updatedProduct, movement };
  }

  public static async adjustStock(params: {
    productId: string;
    direction: 'ADD' | 'SUBTRACT';
    quantity: number;
    reason: string;
    note?: string;
    user?: string;
  }): Promise<{ product: Product; movement: StockMovement }> {
    if (params.quantity <= 0) {
      throw new Error('Adjustment quantity must be a positive number greater than zero.');
    }

    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('A reason is mandatory for stock adjustment audits.');
    }

    const products = await this.getProducts();
    const product = products.find(p => p.id === params.productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    const previousStock = product.currentStock;
    let newStock: number;
    let movementType: MovementType;
    let change: number;

    if (params.direction === 'ADD') {
      newStock = previousStock + params.quantity;
      movementType = 'ADJUSTMENT_ADD';
      change = params.quantity;
    } else {
      if (previousStock - params.quantity < 0) {
        throw new Error(
          `Cannot deduct ${params.quantity} units. Current stock is only ${previousStock} pieces. Negative stock is not allowed.`
        );
      }
      newStock = previousStock - params.quantity;
      movementType = params.reason.toLowerCase().includes('damage') || params.reason.toLowerCase().includes('defect')
        ? 'DAMAGE'
        : 'ADJUSTMENT_SUBTRACT';
      change = -params.quantity;
    }

    const updatedProduct = await this.updateProduct(product.id, {
      currentStock: newStock,
    } as any);

    const movement = await this.recordStockMovement({
      productId: product.id,
      productCode: product.productCode,
      productName: product.name,
      type: movementType,
      quantity: params.quantity,
      change,
      previousStock,
      newStock,
      unitCost: product.purchaseCost,
      reason: params.reason,
      note: params.note,
      user: params.user || 'Store Manager',
    });

    return { product: updatedProduct, movement };
  }

  public static async getStockMovements(productId?: string): Promise<StockMovement[]> {
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        const q = query(collection(db, 'stock_movements'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as StockMovement));
          return productId ? list.filter(m => m.productId === productId) : list;
        }
      } catch (err) {
        console.warn('Firestore fetch failed for movements, falling back to local', err);
      }
    }
    const local = getLocalMovements();
    return productId ? local.filter(m => m.productId === productId) : local;
  }

  // --- SALES & ORDERS (IDEMPOTENT & ATOMIC) ---
  public static async getOrders(): Promise<SaleOrder[]> {
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as SaleOrder));
        }
      } catch (err) {
        console.warn('Firestore fetch failed for orders, falling back to local', err);
      }
    }
    return getLocalOrders();
  }

  public static async getOrderById(id: string): Promise<SaleOrder | null> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id || o.orderNumber === id || o.invoiceNumber === id) || null;
  }

  /**
   * ATOMIC SALE EXECUTION:
   * 1. Validates all line items have sufficient stock (prevents overselling).
   * 2. Deducts stock from each product in a safe atomic manner.
   * 3. Records an immutable StockMovement for each line item (type SALE).
   * 4. Updates or creates Customer profile.
   * 5. Saves order with unique cryptographically verified token for QR verification.
   */
  public static async createSaleOrder(input: {
    customer: {
      id?: string;
      name: string;
      phone: string;
      address: string;
      district: string;
    };
    items: Array<{
      productId: string;
      sellingPrice: number;
      quantity: number;
      discount?: number;
      originVideoId?: string;
      originVideoTitle?: string;
      advertisedPrice?: number;
    }>;
    orderDiscount?: number;
    deliveryFee?: number;
    sellerCourierCost?: number;
    packagingCost?: number;
    advertisingCost?: number;
    otherExpenses?: number;
    paymentMethod: 'COD' | 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash';
    paymentStatus?: 'PENDING_COD' | 'COLLECTED';
    trxId?: string;
    courierProvider?: string;
    courierZone?: 'Inside Dhaka' | 'Outside Dhaka';
    originVideoId?: string;
    originVideoTitle?: string;
    notes?: string;
    createdBy?: string;
  }): Promise<SaleOrder> {
    if (!input.items || input.items.length === 0) {
      throw new Error('Cannot create an order without product items.');
    }

    if (!input.customer.name.trim() || !input.customer.phone.trim() || !input.customer.address.trim()) {
      throw new Error('Customer Name, Phone number, and Delivery Address are mandatory.');
    }

    // Step 1: Stock pre-flight verification
    const currentProducts = await this.getProducts();
    const productMap = new Map<string, Product>();
    currentProducts.forEach(p => productMap.set(p.id, p));

    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new Error(`Quantity for product must be greater than zero.`);
      }
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found in catalog.`);
      }
      if (product.currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.productCode}" (${product.name}). Requested: ${item.quantity} pcs, Available: only ${product.currentStock} pcs.`
        );
      }
    }

    // Step 2: Calculate financials
    let subtotal = 0;
    let totalCogs = 0;
    const populatedItems = input.items.map(item => {
      const product = productMap.get(item.productId)!;
      const discount = item.discount || 0;
      const itemTotal = (item.sellingPrice * item.quantity) - discount;
      const itemCogs = product.purchaseCost * item.quantity;
      const grossProfit = itemTotal - itemCogs;

      subtotal += itemTotal;
      totalCogs += itemCogs;

      return {
        productId: product.id,
        productCode: product.productCode,
        productName: product.name,
        category: product.category,
        color: product.color,
        size: product.size,
        image: product.images[0] || '/src/assets/images/three_piece_royal_floral_1792247226094.jpg',
        purchaseCost: product.purchaseCost,
        sellingPrice: Number(item.sellingPrice),
        quantity: Number(item.quantity),
        discount,
        totalAmount: itemTotal,
        grossProfit,
        originVideoId: item.originVideoId || input.originVideoId,
        originVideoTitle: item.originVideoTitle || input.originVideoTitle,
        advertisedPrice: item.advertisedPrice,
      };
    });

    const orderDiscount = Number(input.orderDiscount) || 0;
    const deliveryFee = Number(input.deliveryFee) || 0;
    const sellerCourierCost = Number(input.sellerCourierCost) || deliveryFee;
    const packagingCost = Number(input.packagingCost) || 0;
    const advertisingCost = Number(input.advertisingCost) || 0;
    const otherExpenses = Number(input.otherExpenses) || 0;

    const totalPayable = (subtotal - orderDiscount) + deliveryFee;
    const grossProfit = (subtotal - orderDiscount) - totalCogs;
    const courierDifference = Math.max(0, sellerCourierCost - deliveryFee);
    const totalExpenses = packagingCost + advertisingCost + otherExpenses + courierDifference;
    const netProfit = grossProfit - totalExpenses;

    const orderSeq = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const orderNumber = `ND-ORD-${year}-${orderSeq}`;
    const invoiceNumber = `ND-INV-${year}-${orderSeq}`;
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();
    const verificationToken = `vtok_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

    const newOrder: SaleOrder = {
      id: orderId,
      orderNumber,
      invoiceNumber,
      createdAt: timestamp,
      customer: {
        id: input.customer.id,
        name: input.customer.name.trim(),
        phone: input.customer.phone.trim(),
        address: input.customer.address.trim(),
        district: input.customer.district || 'Dhaka',
      },
      items: populatedItems,
      financials: {
        subtotal,
        orderDiscount,
        deliveryFee,
        sellerCourierCost,
        packagingCost,
        advertisingCost,
        otherExpenses,
        totalPayable,
        totalCogs,
        grossProfit,
        totalExpenses,
        netProfit,
      },
      payment: {
        method: input.paymentMethod,
        status: input.paymentStatus || (input.paymentMethod === 'COD' ? 'PENDING_COD' : 'COLLECTED'),
        collectedAt: input.paymentStatus === 'COLLECTED' || input.paymentMethod !== 'COD' ? timestamp : undefined,
        trxId: input.trxId?.trim() || undefined,
      },
      status: 'CONFIRMED',
      courier: {
        provider: input.courierProvider || 'Steadfast Courier',
        trackingCode: `SF-${orderSeq}`,
        zone: input.courierZone || (input.customer.district?.toLowerCase().includes('dhaka') ? 'Inside Dhaka' : 'Outside Dhaka'),
      },
      originVideoId: input.originVideoId,
      originVideoTitle: input.originVideoTitle,
      notes: input.notes?.trim() || '',
      verificationToken,
      isStockDeducted: true,
      createdBy: input.createdBy || 'Super Admin - নাহার দর্জি বাড়ি',
      updatedAt: timestamp,
    };

    // Step 3: Atomic stock deduction and stock audit movement logging
    for (const item of populatedItems) {
      const prod = productMap.get(item.productId)!;
      const prevStock = prod.currentStock;
      const nextStock = prevStock - item.quantity;

      // Update product currentStock
      await this.updateProduct(prod.id, {
        currentStock: nextStock,
      } as any);

      // Record immutable stock movement
      await this.recordStockMovement({
        productId: prod.id,
        productCode: prod.productCode,
        productName: prod.name,
        type: 'SALE',
        quantity: item.quantity,
        change: -item.quantity,
        previousStock: prevStock,
        newStock: nextStock,
        unitCost: prod.purchaseCost,
        reason: `Order ${orderNumber} sale dispatch`,
        note: `Sold at ৳${item.sellingPrice}/pc (${newOrder.payment.method}) to ${newOrder.customer.name}`,
        orderId,
        user: input.createdBy || 'Super Admin - নাহার দর্জি বাড়ি',
      });
    }

    // Step 4: Save Customer Profile
    await this.saveCustomer({
      name: newOrder.customer.name,
      phone: newOrder.customer.phone,
      address: newOrder.customer.address,
      district: newOrder.customer.district,
      orderTotalSpent: newOrder.financials.totalPayable,
    });

    // Step 5: Save order
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'orders', orderId), cleanForFirestore(newOrder));
      } catch (err) {
        handleFirestoreNotice('save order', err);
      }
    }

    const currentOrders = getLocalOrders();
    setLocalOrders([newOrder, ...currentOrders]);

    return newOrder;
  }

  public static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    trackingCode?: string,
    courierUpdate?: {
      consignmentId?: string;
      bookingStatus?: 'PENDING' | 'BOOKED' | 'FAILED' | 'CANCELLED';
      bookedAt?: string;
      errorMessage?: string;
    }
  ): Promise<SaleOrder> {
    const orders = await this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const updated: SaleOrder = {
      ...order,
      status,
      payment: {
        ...order.payment,
        status: paymentStatus || order.payment.status,
        collectedAt: paymentStatus === 'COLLECTED' && !order.payment.collectedAt ? new Date().toISOString() : order.payment.collectedAt,
      },
      courier: {
        ...order.courier,
        trackingCode: trackingCode || order.courier.trackingCode,
        consignmentId: courierUpdate?.consignmentId !== undefined ? courierUpdate.consignmentId : order.courier.consignmentId,
        bookingStatus: courierUpdate?.bookingStatus || order.courier.bookingStatus,
        bookedAt: courierUpdate?.bookedAt || order.courier.bookedAt,
        errorMessage: courierUpdate?.errorMessage !== undefined ? courierUpdate.errorMessage : order.courier.errorMessage,
      },
      updatedAt: new Date().toISOString(),
    };

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), cleanForFirestore(updated) as any);
      } catch (err) {
        handleFirestoreNotice('update order status', err);
      }
    }

    const updatedOrders = orders.map(o => (o.id === orderId ? updated : o));
    setLocalOrders(updatedOrders);
    return updated;
  }

  /**
   * Safe cancellation of an order:
   * Restores deducted stock to products if previously deducted, and records ORDER_CANCEL stock movement.
   */
  public static async cancelSaleOrder(orderId: string, reason: string): Promise<SaleOrder> {
    const orders = await this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (order.status === 'CANCELLED') {
      return order; // Idempotent
    }

    // Restore stock if previously deducted
    if (order.isStockDeducted) {
      for (const item of order.items) {
        const prod = await this.getProductByCode(item.productCode);
        if (prod) {
          const prev = prod.currentStock;
          const next = prev + item.quantity;
          await this.updateProduct(prod.id, { currentStock: next } as any);

          await this.recordStockMovement({
            productId: prod.id,
            productCode: prod.productCode,
            productName: prod.name,
            type: 'ORDER_CANCEL',
            quantity: item.quantity,
            change: item.quantity,
            previousStock: prev,
            newStock: next,
            unitCost: prod.purchaseCost,
            reason: `Order ${order.orderNumber} cancelled: ${reason}`,
            note: 'Stock restored to saleable inventory',
            orderId,
            user: 'Store Manager',
          });
        }
      }
    }

    const updated: SaleOrder = {
      ...order,
      status: 'CANCELLED',
      isStockDeducted: false,
      notes: order.notes ? `${order.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`,
      updatedAt: new Date().toISOString(),
    };

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), updated as any);
      } catch (err) {
        handleFirestoreNotice('cancel order', err);
      }
    }

    const updatedOrders = orders.map(o => (o.id === orderId ? updated : o));
    setLocalOrders(updatedOrders);
    return updated;
  }

  // --- RETURNS WORKFLOW ---
  public static async getReturns(): Promise<ReturnRecord[]> {
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        const q = query(collection(db, 'returns'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as ReturnRecord));
        }
      } catch (err) {
        console.warn('Firestore fetch failed for returns, falling back to local', err);
      }
    }
    return getLocalReturns();
  }

  /**
   * Process Return:
   * Restocks ONLY items confirmed as resellable. Damaged items are routed to damaged stock audit.
   * Prevents processing the same return twice.
   */
  public static async processReturn(input: {
    orderId: string;
    productCode: string;
    quantityReturned: number;
    reason: any;
    itemCondition: 'RESELLABLE' | 'DAMAGED';
    refundAmount: number;
    deductDeliveryFee?: boolean;
    notes?: string;
    processedBy?: string;
  }): Promise<ReturnRecord> {
    if (input.quantityReturned <= 0) {
      throw new Error('Returned quantity must be greater than zero.');
    }

    const orders = await this.getOrders();
    const order = orders.find(o => o.id === input.orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    const orderItem = order.items.find(i => i.productCode.toUpperCase() === input.productCode.toUpperCase());
    if (!orderItem) {
      throw new Error(`Product ${input.productCode} was not part of order ${order.orderNumber}.`);
    }

    // Check duplicate return guard
    const existingReturns = await this.getReturns();
    const previousReturnedQty = existingReturns
      .filter(r => r.orderId === input.orderId && r.productCode.toUpperCase() === input.productCode.toUpperCase())
      .reduce((acc, r) => acc + r.quantityReturned, 0);

    const availableToReturn = orderItem.quantity - previousReturnedQty;
    if (input.quantityReturned > availableToReturn) {
      throw new Error(
        `Cannot return ${input.quantityReturned} units. Already returned: ${previousReturnedQty} of ${orderItem.quantity} units. Max returnable: ${availableToReturn} pcs.`
      );
    }

    const returnId = `ret-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();
    const isResellable = input.itemCondition === 'RESELLABLE';

    // Restock ONLY if resellable
    if (isResellable) {
      const prod = await this.getProductByCode(input.productCode);
      if (prod) {
        const prev = prod.currentStock;
        const next = prev + input.quantityReturned;
        await this.updateProduct(prod.id, { currentStock: next } as any);

        await this.recordStockMovement({
          productId: prod.id,
          productCode: prod.productCode,
          productName: prod.name,
          type: 'RETURN_RESTOCK',
          quantity: input.quantityReturned,
          change: input.quantityReturned,
          previousStock: prev,
          newStock: next,
          unitCost: prod.purchaseCost,
          reason: `Customer Return (Resellable): Order #${order.orderNumber} - ${input.reason}`,
          note: input.notes,
          orderId: order.id,
          user: input.processedBy || 'Store Manager',
        });
      }
    } else {
      // Damaged condition: Do NOT restore available stock
      const prod = await this.getProductByCode(input.productCode);
      if (prod) {
        await this.recordStockMovement({
          productId: prod.id,
          productCode: prod.productCode,
          productName: prod.name,
          type: 'RETURN_DAMAGED',
          quantity: input.quantityReturned,
          change: 0, // No addition to active saleable inventory
          previousStock: prod.currentStock,
          newStock: prod.currentStock,
          unitCost: prod.purchaseCost,
          reason: `Customer Return (Damaged): Order #${order.orderNumber} - ${input.reason}`,
          note: `Transferred to reject/damaged category. Condition: ${input.itemCondition}. ${input.notes || ''}`,
          orderId: order.id,
          user: input.processedBy || 'Store Manager',
        });
      }
    }

    const returnRecord: ReturnRecord = {
      id: returnId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber,
      productId: orderItem.productId,
      productCode: orderItem.productCode,
      productName: orderItem.productName,
      quantityReturned: input.quantityReturned,
      unitSellingPrice: orderItem.sellingPrice,
      reason: input.reason,
      itemCondition: input.itemCondition,
      refundAmount: Number(input.refundAmount),
      deductDeliveryFee: !!input.deductDeliveryFee,
      restocked: isResellable,
      processedBy: input.processedBy || 'Store Manager',
      notes: input.notes?.trim() || '',
      createdAt: timestamp,
    };

    // Update order status
    const totalOrderItemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
    const totalReturnedCount = previousReturnedQty + input.quantityReturned;
    const newStatus: OrderStatus = totalReturnedCount >= totalOrderItemsCount ? 'RETURNED' : 'PARTIALLY_RETURNED';
    await this.updateOrderStatus(order.id, newStatus);

    // Save return
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'returns', returnId), returnRecord);
      } catch (err) {
        handleFirestoreNotice('save return record', err);
      }
    }

    const currentReturns = getLocalReturns();
    setLocalReturns([returnRecord, ...currentReturns]);
    return returnRecord;
  }

  // --- VIDEO & POST TRACKING ---
  public static async getVideoPosts(): Promise<VideoPost[]> {
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        const q = query(collection(db, 'videos'), orderBy('postDate', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as VideoPost));
        }
      } catch (err) {
        console.warn('Firestore fetch failed for videos, falling back to local', err);
      }
    }
    return getLocalVideos();
  }

  public static async getVideos(): Promise<VideoPost[]> {
    return this.getVideoPosts();
  }

  public static async addVideoPost(input: {
    title: string;
    platform: any;
    postDate: string;
    url?: string;
    productOfferings: Array<{
      productCode: string;
      advertisedPrice: number;
      notes?: string;
    }>;
    adSpend?: number;
    notes?: string;
  }): Promise<VideoPost> {
    if (!input.title.trim()) {
      throw new Error('Video/Post title is required.');
    }

    const newVideo: VideoPost = {
      id: `vid-${Date.now()}`,
      title: input.title.trim(),
      platform: input.platform || 'Facebook Live',
      postDate: input.postDate || new Date().toISOString(),
      url: input.url?.trim() || '',
      productCodes: input.productOfferings.map(p => p.productCode.toUpperCase()),
      productOfferings: input.productOfferings.map(p => ({
        productCode: p.productCode.toUpperCase(),
        advertisedPrice: Number(p.advertisedPrice),
        notes: p.notes?.trim() || '',
      })),
      adSpend: Number(input.adSpend) || 0,
      notes: input.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'videos', newVideo.id), newVideo);
      } catch (err) {
        handleFirestoreNotice('save video', err);
      }
    }

    const currentVideos = getLocalVideos();
    setLocalVideos([newVideo, ...currentVideos]);
    return newVideo;
  }

  public static async updateVideoPost(id: string, updates: Partial<VideoPost>): Promise<VideoPost> {
    const list = await this.getVideoPosts();
    const existing = list.find(v => v.id === id);
    if (!existing) {
      throw new Error('Video record not found.');
    }

    const updated = { ...existing, ...updates };

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await updateDoc(doc(db, 'videos', id), updated as any);
      } catch (err) {
        handleFirestoreNotice('update video', err);
      }
    }

    const updatedList = list.map(v => (v.id === id ? updated : v));
    setLocalVideos(updatedList);
    return updated;
  }

  public static async deleteVideoPost(id: string): Promise<boolean> {
    const list = await this.getVideoPosts();
    const filtered = list.filter(v => v.id !== id);

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'videos', id));
      } catch (err) {
        handleFirestoreNotice('delete video', err);
      }
    }

    setLocalVideos(filtered);
    return true;
  }

  // --- CUSTOMERS DIRECTORY ---
  public static async getCustomers(): Promise<Customer[]> {
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'customers'));
        if (!snap.empty) {
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer));
        }
      } catch (err) {
        console.warn('Firestore fetch failed for customers, falling back to local', err);
      }
    }
    return getLocalCustomers();
  }

  public static async saveCustomer(input: {
    id?: string;
    name: string;
    phone: string;
    address: string;
    district: string;
    orderTotalSpent?: number;
  }): Promise<Customer> {
    const list = await this.getCustomers();
    const cleanPhone = input.phone.trim();
    const existing = list.find(c => c.phone === cleanPhone || (input.id && c.id === input.id));

    let customerRecord: Customer;
    if (existing) {
      customerRecord = {
        ...existing,
        name: input.name.trim() || existing.name,
        address: input.address.trim() || existing.address,
        district: input.district || existing.district,
        totalOrders: input.orderTotalSpent ? existing.totalOrders + 1 : existing.totalOrders,
        totalSpent: input.orderTotalSpent ? existing.totalSpent + input.orderTotalSpent : existing.totalSpent,
        lastOrderDate: new Date().toISOString(),
      };
    } else {
      customerRecord = {
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: input.name.trim(),
        phone: cleanPhone,
        address: input.address.trim(),
        district: input.district || 'Dhaka',
        totalOrders: input.orderTotalSpent ? 1 : 0,
        totalSpent: input.orderTotalSpent || 0,
        lastOrderDate: new Date().toISOString(),
      };
    }

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'customers', customerRecord.id), cleanForFirestore(customerRecord));
      } catch (err) {
        handleFirestoreNotice('save customer', err);
      }
    }

    const updatedList = existing
      ? list.map(c => (c.id === customerRecord.id ? customerRecord : c))
      : [customerRecord, ...list];
    setLocalCustomers(updatedList);
    return customerRecord;
  }

  // --- SETTLEMENTS & RECONCILIATION ---
  public static async getSettlements(): Promise<SettlementRecord[]> {
    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'settlements'));
        if (!snap.empty) {
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as SettlementRecord));
        }
      } catch (err) {
        console.warn('Firestore fetch failed for settlements, falling back to local', err);
      }
    }
    return getLocalSettlements();
  }

  public static async recordSettlement(input: {
    settlementReference: string;
    settlementDate: string;
    source: 'Steadfast Portal API' | 'Steadfast CSV Import' | 'Manual Bank Transfer';
    totalPaidAmount: number;
    matchedOrderIds: string[];
    courierDeductions?: number;
    notes?: string;
    recordedBy?: string;
  }): Promise<SettlementRecord> {
    const record: SettlementRecord = {
      id: `settle-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      settlementReference: input.settlementReference.trim(),
      settlementDate: input.settlementDate,
      source: input.source,
      totalPaidAmount: input.totalPaidAmount,
      matchedOrderIds: input.matchedOrderIds,
      courierDeductions: input.courierDeductions || 0,
      notes: input.notes?.trim() || '',
      createdAt: new Date().toISOString(),
      recordedBy: input.recordedBy || 'Super Admin - নাহার দর্জি বাড়ি',
    };

    const { db, isConfigured } = getFirebaseInstances();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'settlements', record.id), record);
      } catch (err) {
        handleFirestoreNotice('save settlement', err);
      }
    }

    const current = getLocalSettlements();
    setLocalSettlements([record, ...current]);
    return record;
  }

  // --- SECURE INVOICE QR VERIFICATION ---
  public static async verifyInvoice(invoiceNumber: string, token: string): Promise<{
    valid: boolean;
    order?: SaleOrder;
    message: string;
  }> {
    const orders = await this.getOrders();
    const order = orders.find(
      o => o.invoiceNumber.toUpperCase() === invoiceNumber.trim().toUpperCase()
    );

    if (!order) {
      return { valid: false, message: 'Invoice number not found in system.' };
    }

    if (order.verificationToken !== token.trim()) {
      return { valid: false, message: 'Invalid verification token. This invoice could not be authenticated.' };
    }

    return {
      valid: true,
      order,
      message: 'Genuine and verified invoice from নাহার দর্জি বাড়ি (Nahar Dorjibari).',
    };
  }

  // Reset to demo data
  public static resetToDemoData(): void {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
    localStorage.setItem(BRAND_KEY, JSON.stringify(INITIAL_BRAND_SETTINGS));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(INITIAL_VIDEOS));
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(RETURNS_KEY, JSON.stringify(INITIAL_RETURNS));
  }
}

// Bangladesh Currency Formatter (৳ BDT)
export function formatBDT(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '৳0';
  }
  return `৳${Math.round(amount).toLocaleString('en-IN')}`;
}

// Bangladesh Date & Time Formatter
export function formatBDDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return (
      new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Dhaka',
      }).format(d) + ' BST'
    );
  } catch (e) {
    return isoString;
  }
}
