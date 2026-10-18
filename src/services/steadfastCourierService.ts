import { SaleOrder } from '../types';

export interface SteadfastSettings {
  apiKey: string;
  secretKey: string;
  isSandboxMode: boolean; // Test mode toggle
  defaultRateInsideDhaka: number;
  defaultRateOutsideDhaka: number;
  autoMarkDispatchedOnBooking: boolean;
}

export interface SteadfastBookingResponse {
  success: boolean;
  consignmentId?: string;
  trackingCode?: string;
  trackingUrl?: string;
  status?: string;
  message: string;
  rawResponse?: any;
}

const STEADFAST_STORAGE_KEY = 'nahar_steadfast_settings_v1';

const DEFAULT_SETTINGS: SteadfastSettings = {
  apiKey: '',
  secretKey: '',
  isSandboxMode: true, // Defaults to safe test/sandbox mode
  defaultRateInsideDhaka: 70,
  defaultRateOutsideDhaka: 130,
  autoMarkDispatchedOnBooking: true,
};

export class SteadfastCourierService {
  /**
   * Retrieves Steadfast integration settings from persistent storage
   */
  public static getSettings(): SteadfastSettings {
    try {
      const stored = localStorage.getItem(STEADFAST_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to read Steadfast settings', e);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Saves updated Steadfast integration settings
   */
  public static saveSettings(settings: Partial<SteadfastSettings>): SteadfastSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STEADFAST_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Generates official Steadfast parcel tracking URL
   */
  public static getTrackingUrl(trackingCode: string): string {
    if (!trackingCode) return 'https://steadfast.com.bd/tracking';
    return `https://steadfast.com.bd/t/${encodeURIComponent(trackingCode.trim())}`;
  }

  /**
   * Validates customer phone format for Bangladesh courier delivery
   * (Must be 11 digits starting with 013-019)
   */
  public static validateBDPhone(phone: string): { isValid: boolean; formatted: string; error?: string } {
    const clean = phone.replace(/[^\d+]/g, '');
    let normalized = clean;
    if (normalized.startsWith('+880')) {
      normalized = normalized.substring(3);
    } else if (normalized.startsWith('880')) {
      normalized = normalized.substring(2);
    }

    if (!/^01[3-9]\d{8}$/.test(normalized)) {
      return {
        isValid: false,
        formatted: normalized,
        error: 'Phone number must be an 11-digit valid Bangladeshi mobile number (e.g. 017XXXXXXXX, 018XXXXXXXX).',
      };
    }

    return { isValid: true, formatted: normalized };
  }

  /**
   * Creates a Steadfast parcel from a confirmed order.
   * Ensures idempotency: will not double-book if a consignment ID already exists.
   */
  public static async bookParcel(order: SaleOrder): Promise<SteadfastBookingResponse> {
    // 1. Idempotency Check: Prevent duplicate bookings
    if (order.courier.consignmentId && order.courier.bookingStatus === 'BOOKED') {
      return {
        success: true,
        consignmentId: order.courier.consignmentId,
        trackingCode: order.courier.trackingCode,
        trackingUrl: this.getTrackingUrl(order.courier.trackingCode || ''),
        status: 'already_booked',
        message: `Order ${order.orderNumber} is already booked on Steadfast with Consignment ID: ${order.courier.consignmentId}. Duplicate booking prevented.`,
      };
    }

    // 2. Validate Required Customer Fields as per official Steadfast API Documentation
    if (!order.customer.name.trim()) {
      return {
        success: false,
        message: 'Recipient Name is required by Steadfast Courier.',
      };
    }

    const phoneValidation = this.validateBDPhone(order.customer.phone);
    if (!phoneValidation.isValid) {
      return {
        success: false,
        message: phoneValidation.error || 'Invalid recipient phone number.',
      };
    }

    if (!order.customer.address.trim()) {
      return {
        success: false,
        message: 'Full Delivery Address is required by Steadfast Courier.',
      };
    }

    // Determine COD amount (0 if already paid or collected, otherwise totalPayable)
    const codAmount = order.payment.status === 'COLLECTED' ? 0 : order.financials.totalPayable;
    const itemsDescription = order.items
      .map((i) => `${i.productCode} (${i.productName}) x${i.quantity}`)
      .join(', ');

    const payload = {
      invoice: order.invoiceNumber,
      recipient_name: order.customer.name.trim(),
      recipient_phone: phoneValidation.formatted,
      recipient_address: `${order.customer.address.trim()}, ${order.customer.district}`,
      cod_amount: codAmount,
      note: `Nahar Dorjibari 3-Piece Boutique: ${itemsDescription}. ${order.notes || ''}`.trim(),
    };

    const settings = this.getSettings();

    // 3. Sandbox / Test Mode Handler
    if (settings.isSandboxMode || !settings.apiKey || !settings.secretKey) {
      // Simulate realistic network round-trip
      await new Promise((resolve) => setTimeout(resolve, 600));

      const simulatedConsignmentId = `SF-CID-${Math.floor(1000000 + Math.random() * 9000000)}`;
      const simulatedTrackingCode = `STDF${Math.floor(10000000 + Math.random() * 90000000)}`;

      return {
        success: true,
        consignmentId: simulatedConsignmentId,
        trackingCode: simulatedTrackingCode,
        trackingUrl: this.getTrackingUrl(simulatedTrackingCode),
        status: 'in_review',
        message: `[Steadfast Sandbox] Parcel created successfully! Assigned Consignment ID: ${simulatedConsignmentId}, Tracking: ${simulatedTrackingCode}. COD Collection: ৳${codAmount}.`,
        rawResponse: {
          status: 200,
          message: 'Order created successfully (Sandbox Simulation)',
          consignment: {
            consignment_id: simulatedConsignmentId,
            invoice: payload.invoice,
            tracking_code: simulatedTrackingCode,
            recipient_name: payload.recipient_name,
            recipient_phone: payload.recipient_phone,
            recipient_address: payload.recipient_address,
            cod_amount: payload.cod_amount,
            status: 'in_review',
            created_at: new Date().toISOString(),
          },
        },
      };
    }

    // 4. Official Steadfast Live API Call
    try {
      const response = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': settings.apiKey.trim(),
          'Secret-Key': settings.secretKey.trim(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === 200 && data.consignment) {
        const c = data.consignment;
        return {
          success: true,
          consignmentId: c.consignment_id?.toString(),
          trackingCode: c.tracking_code,
          trackingUrl: this.getTrackingUrl(c.tracking_code),
          status: c.status || 'in_review',
          message: `Steadfast consignment booked successfully! ID: ${c.consignment_id}`,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          message: data.message || `Steadfast API error (HTTP ${response.status})`,
          rawResponse: data,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Steadfast connection error: ${err.message || 'Network request failed'}. Please check your internet or Steadfast credentials.`,
      };
    }
  }
}
