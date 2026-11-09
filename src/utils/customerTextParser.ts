// Bangladesh 64 Districts List in Bengali and English
export const BD_DISTRICTS = [
  'ঢাকা (Dhaka)',
  'চট্টগ্রাম (Chattogram)',
  'রাজশাহী (Rajshahi)',
  'খুলনা (Khulna)',
  'বরিশাল (Barishal)',
  'সিলেট (Sylhet)',
  'রংপুর (Rangpur)',
  'ময়মনসিংহ (Mymensingh)',
  'গাজীপুর (Gazipur)',
  'নারায়ণগঞ্জ (Narayanganj)',
  'সাভার (Savar)',
  'কুমিল্লা (Cumilla)',
  'বগুড়া (Bogura)',
  'যশোর (Jashore)',
  'ফেনী (Feni)',
  'নোয়াখালী (Noakhali)',
  'কক্সবাজার (Cox\'s Bazar)',
  'ব্রাহ্মণবাড়িয়া (Brahmanbaria)',
  'চাঁদপুর (Chandpur)',
  'লক্ষ্মীপুর (Lakshmipur)',
  'টাঙ্গাইল (Tangail)',
  'কিশোরগঞ্জ (Kishoreganj)',
  'মানিকগঞ্জ (Manikganj)',
  'মুন্সীগঞ্জ (Munshiganj)',
  'নরসিংদী (Narsingdi)',
  'ফরিদপুর (Faridpur)',
  'গোপালগঞ্জ (Gopalganj)',
  'মাদারীপুর (Madaripur)',
  'রাজবাড়ী (Rajbari)',
  'শরীয়তপুর (Shariatpur)',
  'পাবনা (Pabna)',
  'সিরাজগঞ্জ (Sirajganj)',
  'নাটোর (Natore)',
  'নওগাঁ (Naogaon)',
  'চাঁপাইনবাবগঞ্জ (Chapainawabganj)',
  'জয়পুরহাট (Joypurhat)',
  'কুষ্টিয়া (Kushtia)',
  'ঝিনাইদহ (Jhenaidah)',
  'চুয়াডাঙ্গা (Chuadanga)',
  'মেহেরপুর (Meherpur)',
  'সাতক্ষীরা (Satkhira)',
  'বাগেরহাট (Bagerhat)',
  'নড়াইল (Narail)',
  'মাগুরা (Magura)',
  'পটুয়াখালী (Patuakhali)',
  'ভোলা (Bhola)',
  'পিরোজপুর (Pirojpur)',
  'বরগুনা (Barguna)',
  'ঝালকাঠি (Jhalokathi)',
  'দিনাজপুর (Dinajpur)',
  'গাইবান্ধা (Gaibandha)',
  'কুড়িগ্রাম (Kurigram)',
  'লালমনিরহাট (Lalmonirhat)',
  'নীলফামারী (Nilphamari)',
  'পঞ্চগড় (Panchagarh)',
  'ঠাকুরগাঁও (Thakurgaon)',
  'জামালপুর (Jamalpur)',
  'নেত্রকোণা (Netrokona)',
  'শেরপুর (Sherpur)',
  'মৌলভীবাজার (Moulvibazar)',
  'হবিগঞ্জ (Habiganj)',
  'সুনামগঞ্জ (Sunamganj)',
];

export interface ParsedCustomerData {
  customerName: string;
  phone: string;
  district: string;
  fullAddress: string;
  notes?: string;
  detectedProductHint?: string;
  detectedQuantity?: number;
  detectedAdvance?: number;
}

/**
 * Parses user copied customer text like:
 * 👤 আপনার নাম: ফাতেমা আক্তার
 * 📞 মোবাইল নম্বর: 01712345678
 * 🏙️ জেলা: ঢাকা
 * 📍 সম্পূর্ণ ঠিকানা: বাসা ১২, রোড ৩, মিরপুর ১০, ঢাকা
 */
export function parseCustomerPastedText(text: string): ParsedCustomerData {
  const result: ParsedCustomerData = {
    customerName: '',
    phone: '',
    district: '',
    fullAddress: '',
  };

  if (!text || !text.trim()) return result;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Look for explicit labeled patterns
  for (const line of lines) {
    // Name pattern: 👤 আপনার নাম:, নাম:, Name:, Customer:, কাস্টমার:
    const nameMatch = line.match(/(?:(?:👤\s*)?(?:আপনার\s*)?নাম|Name|Customer)\s*[:ঃ\-]\s*(.+)/i);
    if (nameMatch && !result.customerName) {
      result.customerName = nameMatch[1].trim();
      continue;
    }

    // Phone pattern: 📞 মোবাইল নম্বর:, ফোন:, Mobile:, Phone:, Number:
    const phoneMatch = line.match(/(?:(?:📞\s*)?(?:মোবাইল\s*(?:নম্বর)?|ফোন|Mobile|Phone|Cell|Number))\s*[:ঃ\-]\s*(.+)/i);
    if (phoneMatch && !result.phone) {
      const cleanPhone = phoneMatch[1].replace(/[^\d+]/g, '');
      if (cleanPhone.length >= 10) {
        result.phone = cleanPhone.startsWith('+88') ? cleanPhone.slice(3) : cleanPhone;
      } else {
        result.phone = phoneMatch[1].trim();
      }
      continue;
    }

    // District pattern: 🏙️ জেলা:, জেলা:, District:, City:
    const districtMatch = line.match(/(?:(?:🏙️\s*)?জেলা|District|City)\s*[:ঃ\-]\s*(.+)/i);
    if (districtMatch && !result.district) {
      result.district = districtMatch[1].trim();
      continue;
    }

    // Address pattern: 📍 সম্পূর্ণ ঠিকানা:, ঠিকানা:, Address:, Location:
    const addressMatch = line.match(/(?:(?:📍\s*)?(?:সম্পূর্ণ\s*)?ঠিকানা|Address|Location)\s*[:ঃ\-]\s*(.+)/i);
    if (addressMatch && !result.fullAddress) {
      result.fullAddress = addressMatch[1].trim();
      continue;
    }

    // Advance payment pattern
    const advanceMatch = line.match(/(?:অগ্রিম|এডভান্স|Advance|bKash|বিকাশ)\s*[:ঃ\-]\s*(?:৳|Tk\.?)?\s*(\d+)/i);
    if (advanceMatch && !result.detectedAdvance) {
      result.detectedAdvance = parseInt(advanceMatch[1], 10);
      continue;
    }

    // Quantity pattern
    const qtyMatch = line.match(/(?:পরিমাণ|পিস|Qty|Quantity)\s*[:ঃ\-]\s*(\d+)/i);
    if (qtyMatch && !result.detectedQuantity) {
      result.detectedQuantity = parseInt(qtyMatch[1], 10);
      continue;
    }
  }

  // 2. Fallbacks if labels were missing or formatted differently:
  // Find Bangladeshi Phone Number: 013-019XXXXXXXX
  if (!result.phone) {
    const rawPhoneMatch = text.match(/(?:\+?8801|01)[3-9]\d{8}/);
    if (rawPhoneMatch) {
      const found = rawPhoneMatch[0];
      result.phone = found.startsWith('+88') ? found.slice(3) : found;
    }
  }

  // Find District by matching 64 districts in the entire text if not parsed
  if (!result.district) {
    for (const d of BD_DISTRICTS) {
      const bngName = d.split(' ')[0];
      const engName = d.match(/\(([^)]+)\)/)?.[1] || '';
      if (text.includes(bngName) || (engName && new RegExp(`\\b${engName}\\b`, 'i').test(text))) {
        result.district = bngName;
        break;
      }
    }
  }

  // If district found, match full district standard string
  if (result.district) {
    const matched = BD_DISTRICTS.find((d) => d.toLowerCase().includes(result.district.toLowerCase()));
    if (matched) {
      result.district = matched.split(' ')[0];
    }
  } else {
    // Default to Dhaka if inside Dhaka locations found
    if (/মিরপুর|উত্তরা|গুলশান|বনানী|ধানমন্ডি|বাড্ডা|সাভার|মোহাম্মদপুর|যাত্রাবাড়ী|মতিঝিল/i.test(text)) {
      result.district = 'ঢাকা';
    }
  }

  // If address not explicitly tagged, grab lines that aren't phone or name
  if (!result.fullAddress) {
    const potentialAddressLines = lines.filter((l) => {
      if (result.phone && l.includes(result.phone)) return false;
      if (result.customerName && l.includes(result.customerName)) return false;
      if (/(?:নাম|Name|Phone|ফোন|Mobile|জেলা|District)\s*[:ঃ\-]/i.test(l)) return false;
      return l.length > 5;
    });
    if (potentialAddressLines.length > 0) {
      result.fullAddress = potentialAddressLines.join(', ');
    }
  }

  // Product hints detection
  if (/নারিকেল তেল|কোকোনাট|coconut oil|oil|তেল/i.test(text)) {
    result.detectedProductHint = 'কোল্ড প্রেসড নারিকেল তেল';
  } else if (/৩-পিস|থ্রি-পিস|3-piece|ড্রেস/i.test(text)) {
    result.detectedProductHint = '৩-পিস';
  }

  return result;
}
