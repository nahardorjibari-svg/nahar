import React, { useState, useEffect } from 'react';
import { X, Image, Upload, Trash2, Plus, AlertCircle, Check, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { DataService, formatBDT } from '../../services/dataService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  productToEdit?: Product | null;
}

const CATEGORIES = [
  'Cotton Georgette 3-Piece',
  'Luxury Lawn 3-Piece',
  'Silk Festive 3-Piece',
  'Handloom Cotton 3-Piece',
  'Velvet Winter 3-Piece',
  'Organza Bridal 3-Piece',
  'Linen Casual 3-Piece',
  'Chiffon Embroidered 3-Piece',
];

const SIZES = [
  'Unstitched / Free Size',
  'Semi-Stitched',
  'Stitched M (38)',
  'Stitched L (40)',
  'Stitched XL (42)',
  'Stitched XXL (44)',
];

const PRESET_IMAGES = [
  { label: 'Royal Blue Floral', url: '/src/assets/images/three_piece_royal_floral_1792247226094.jpg' },
  { label: 'Emerald Green Lawn', url: '/src/assets/images/three_piece_emerald_silk_1792247226228.jpg' },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const isEditing = !!productToEdit;

  const [productCode, setProductCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState(SIZES[0]);
  const [purchaseCost, setPurchaseCost] = useState<number | ''>('');
  const [defaultSellingPrice, setDefaultSellingPrice] = useState<number | ''>('');
  const [initialStock, setInitialStock] = useState<number | ''>(50);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(10);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setProductCode(productToEdit.productCode);
      setName(productToEdit.name);
      if (CATEGORIES.includes(productToEdit.category)) {
        setCategory(productToEdit.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(productToEdit.category);
      }
      setColor(productToEdit.color);
      setSize(productToEdit.size);
      setPurchaseCost(productToEdit.purchaseCost);
      setDefaultSellingPrice(
        productToEdit.defaultSellingPrice !== null && productToEdit.defaultSellingPrice !== undefined
          ? productToEdit.defaultSellingPrice
          : ''
      );
      setInitialStock(productToEdit.initialStock);
      setLowStockThreshold(productToEdit.lowStockThreshold);
      setNotes(productToEdit.notes || '');
      setImages(productToEdit.images || []);
      setCodeError(null);
    } else {
      // Defaults for new product
      setProductCode('');
      setName('');
      setCategory(CATEGORIES[0]);
      setCustomCategory('');
      setColor('');
      setSize(SIZES[0]);
      setPurchaseCost('');
      setDefaultSellingPrice('');
      setInitialStock(50);
      setLowStockThreshold(10);
      setNotes('');
      setImages(['/src/assets/images/three_piece_royal_floral_1792247226094.jpg']);
      setCodeError(null);
    }
  }, [productToEdit, isOpen]);

  // Live duplicate code validation
  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setProductCode(val);

    if (!val.trim()) {
      setCodeError('Product Code is required (e.g. RP-001)');
      return;
    }

    const exists = await DataService.checkProductCodeExists(val, productToEdit?.id);
    if (exists) {
      setCodeError(`Code "${val}" is already taken. Please choose a unique code.`);
    } else {
      setCodeError(null);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages([...images, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productCode.trim()) {
      setCodeError('Product Code is required');
      return;
    }

    if (codeError) return;

    if (!name.trim()) {
      alert('Please enter a product name.');
      return;
    }

    if (purchaseCost === '' || Number(purchaseCost) < 0) {
      alert('Please specify a valid purchase cost per unit (৳).');
      return;
    }

    if (!isEditing && (initialStock === '' || Number(initialStock) < 0)) {
      alert('Please enter a valid initial stock quantity.');
      return;
    }

    const effectiveCategory = category === 'Other' ? (customCategory.trim() || 'General 3-Piece') : category;

    setIsSubmitting(true);
    try {
      if (isEditing && productToEdit) {
        await DataService.updateProduct(productToEdit.id, {
          productCode: productCode.trim().toUpperCase(),
          name: name.trim(),
          category: effectiveCategory,
          color: color.trim() || 'Unspecified',
          size: size.trim(),
          purchaseCost: Number(purchaseCost),
          defaultSellingPrice:
            defaultSellingPrice !== '' ? Number(defaultSellingPrice) : null,
          lowStockThreshold:
            lowStockThreshold !== '' ? Number(lowStockThreshold) : 10,
          notes: notes.trim(),
          images: images.length > 0 ? images : ['/src/assets/images/three_piece_royal_floral_1792247226094.jpg'],
        });
      } else {
        await DataService.addProduct({
          productCode: productCode.trim().toUpperCase(),
          name: name.trim(),
          category: effectiveCategory,
          color: color.trim() || 'Multicolor',
          size: size.trim(),
          purchaseCost: Number(purchaseCost),
          defaultSellingPrice:
            defaultSellingPrice !== '' ? Number(defaultSellingPrice) : null,
          initialStock: Number(initialStock),
          lowStockThreshold:
            lowStockThreshold !== '' ? Number(lowStockThreshold) : 10,
          notes: notes.trim(),
          images: images.length > 0 ? images : ['/src/assets/images/three_piece_royal_floral_1792247226094.jpg'],
        });
      }

      onSave();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="glass-panel-elevated rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-white/20 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div>
            <h3 className="font-bold text-white text-base">
              {isEditing ? `Edit Product: ${productToEdit?.productCode}` : 'Add New 3-Piece Product'}
            </h3>
            <p className="text-xs text-slate-400">
              {isEditing
                ? 'Update dress specifications, costs, and selling prices'
                : 'Register a unique 3-piece design with initial stock and images'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Section: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Product Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. RP-001"
                value={productCode}
                onChange={handleCodeChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 uppercase font-mono-numbers text-xs ${
                  codeError
                    ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-slate-900'
                }`}
              />
              {codeError ? (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {codeError}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">Unique SKU code (e.g. RP-001, ND-102)</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Royal Floral 3-Piece"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Section: Category, Color, Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Other">Other Category...</option>
              </select>
              {category === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Color</label>
              <input
                type="text"
                placeholder="e.g. Royal Blue, Emerald Green"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Size / Stitching</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs bg-white"
              >
                {SIZES.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Costs & Inventory */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Financials & Stock Quantities
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Purchase Cost (৳) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="650"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-mono-numbers font-medium"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Cost per unit</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-800">
                    Default Selling Price (৳)
                  </label>
                  <span className="text-[10px] text-amber-600 font-medium">Optional</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1150"
                    value={defaultSellingPrice}
                    onChange={(e) => setDefaultSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-mono-numbers"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Can vary per invoice/wholesale</span>
              </div>

              {!isEditing && (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Initial Stock (pcs) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-mono-numbers font-semibold"
                  />
                  <span className="text-[11px] text-slate-500">Initial units inward</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Low-Stock Alert</label>
                <input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-mono-numbers"
                />
                <span className="text-[11px] text-slate-500">Alert threshold pieces</span>
              </div>
            </div>

            {/* Price margin preview if both are provided */}
            {purchaseCost !== '' && defaultSellingPrice !== '' && Number(defaultSellingPrice) > Number(purchaseCost) && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span>Estimated Gross Margin per piece:</span>
                <span className="font-semibold text-emerald-700 font-mono-numbers">
                  {formatBDT(Number(defaultSellingPrice) - Number(purchaseCost))} (
                  {Math.round(((Number(defaultSellingPrice) - Number(purchaseCost)) / Number(purchaseCost)) * 100)}%
                  markup)
                </span>
              </div>
            )}
          </div>

          {/* Section: Multiple Images */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-slate-500" />
                <span>Product Images ({images.length})</span>
              </label>
              <label className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-500 shrink-0">Boutique Presets:</span>
              {PRESET_IMAGES.map((preset) => (
                <button
                  type="button"
                  key={preset.url}
                  onClick={() => {
                    if (!images.includes(preset.url)) {
                      setImages([...images, preset.url]);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Image URL input */}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Or paste external image URL..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Add URL
              </button>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100"
                  >
                    <img
                      src={img}
                      alt={`Product preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Notes & Fabric Specifications */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Fabric Composition & Piece Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Kamiz: 3.5 yards pure georgette with zari neckline. Salwar: butter silk. Dupatta: 2.5 yards organza digital print."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!codeError}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create 3-Piece Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
