"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { useTranslation } from "@/lib/i18n";
import {
  Package,
  Plus,
  DollarSign,
  Barcode,
  Layers,
  Tag,
  Upload,
  Image as ImageIcon,
  X,
  Check,
} from "lucide-react";

export interface ProductData {
  id?: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number | null;
  stock: number;
  minStockAlert: number;
  barcode?: string | null;
  icon?: string | null;
  image?: string | null;
  active?: boolean;
}

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: ProductData | null;
}

const PRESET_IMAGES = [
  { label: "Eau minérale", url: "/products/water.jpg" },
  { label: "Boisson énergisante", url: "/products/energy_drink.jpg" },
  { label: "Barre protéinée", url: "/products/protein_bar.jpg" },
  { label: "Shaker Whey", url: "/products/whey_shaker.jpg" },
  { label: "Cookie Protéiné", url: "/products/cookie_protein.jpg" },
  { label: "Booster Pre-Workout", url: "/products/preworkout.jpg" },
  { label: "Boisson Isotonique", url: "/products/isotonic_drink.jpg" },
  { label: "Cadenas", url: "/products/padlock.jpg" },
  { label: "Serviette Gym", url: "/products/gym_towel.jpg" },
  { label: "Sangles", url: "/products/lifting_straps.jpg" },
];

export const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}) => {
  const { t, language } = useTranslation();
  const toast = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("BOISSONS");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStockAlert, setMinStockAlert] = useState("5");
  const [barcode, setBarcode] = useState("");
  const [image, setImage] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    { value: "BOISSONS", label: t("pos.categories.drinks") || "Boissons" },
    { value: "PROTEINES", label: t("pos.categories.proteins") || "Protéines & Snacks" },
    { value: "COMPLEMENTS", label: t("pos.categories.supplements") || "Compléments" },
    { value: "ACCESSOIRES", label: t("pos.categories.accessories") || "Accessoires" },
    { value: "AUTRE", label: t("pos.categories.other") || "Autres" },
  ];

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || "");
      setCategory(productToEdit.category || "BOISSONS");
      setPrice(productToEdit.price?.toString() || "");
      setCostPrice(productToEdit.costPrice ? productToEdit.costPrice.toString() : "");
      setStock(productToEdit.stock?.toString() || "0");
      setMinStockAlert(productToEdit.minStockAlert?.toString() || "5");
      setBarcode(productToEdit.barcode || "");
      setImage(productToEdit.image || "");
      setImageUrlInput(productToEdit.image || "");
    } else {
      setName("");
      setCategory("BOISSONS");
      setPrice("");
      setCostPrice("");
      setStock("24");
      setMinStockAlert("5");
      setBarcode("");
      setImage("/products/water.jpg");
      setImageUrlInput("");
    }
    setShowUrlInput(false);
    setError("");
  }, [productToEdit, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setError(language === "ar" ? "حجم الصورة كبير جداً (أقل من 4 ميغابايت)" : "L'image ne doit pas dépasser 4 Mo");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === "ar" ? "يرجى إدخال اسم المنتج" : "Le nom du produit est requis.");
      return;
    }

    const numPrice = parseInt(price, 10);
    if (isNaN(numPrice) || numPrice < 0) {
      setError(language === "ar" ? "يرجى إدخال سعر صحيح" : "Veuillez saisir un prix valide.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        category,
        price: numPrice,
        costPrice: costPrice ? parseInt(costPrice, 10) : null,
        stock: parseInt(stock || "0", 10),
        minStockAlert: parseInt(minStockAlert || "5", 10),
        barcode: barcode.trim() || null,
        image: image.trim() || null,
        icon: null,
      };

      const url = productToEdit?.id ? `/api/products/${productToEdit.id}` : "/api/products";
      const method = productToEdit?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Erreur lors de l'enregistrement");
      }

      toast.success(
        productToEdit?.id
          ? (language === "ar" ? "تم تعديل المنتج بنجاح" : "Article mis à jour avec succès")
          : (language === "ar" ? "تمت إضافة المنتج بنجاح" : "Nouvel article ajouté au catalogue")
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? t("pos.editProduct") : t("pos.newProduct")}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {t("pos.saveProduct")}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[13px] text-[#DC2626]">
            {error}
          </div>
        )}

        {/* 1. Photo du produit (Upload & Presets) */}
        <div>
          <label className="block text-[12.5px] font-semibold text-[#0F172A] mb-1.5">
            {language === "ar" ? "صورة المنتج" : "Photo du produit"}
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="flex items-start gap-3.5 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px]">
            {/* Image Preview */}
            <div className="relative w-20 h-20 rounded-[12px] bg-white border border-[#CBD5E1] overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {image ? (
                <img
                  src={image}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-[#94A3B8]" />
              )}

              {image && (
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-0.5 rounded-full transition-colors"
                  title="Supprimer la photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Actions: Upload or URL */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {language === "ar" ? "تحميل صورة" : "Parcourir..."}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[12px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  {showUrlInput
                    ? (language === "ar" ? "إخفاء الرابط" : "Fermer")
                    : (language === "ar" ? "أو أدخل رابط URL" : "ou lien URL...")}
                </button>
              </div>

              {showUrlInput && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => {
                      setImageUrlInput(e.target.value);
                      setImage(e.target.value);
                    }}
                    placeholder="https://example.com/produit.jpg"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[12px] focus:outline-none focus:border-[#2563EB]"
                  />
                  {imageUrlInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setImage(imageUrlInput);
                        setShowUrlInput(false);
                      }}
                      className="px-2 py-1.5 bg-[#2563EB] text-white text-[11px] font-bold rounded-[8px]"
                    >
                      OK
                    </button>
                  )}
                </div>
              )}

              <p className="text-[11px] text-[#64748B]">
                {language === "ar"
                  ? "قم بتحميل صورة عالية الجودة أو اختر من المعرض أدناه"
                  : "Formats acceptés : JPG, PNG, WebP (max 4 Mo) ou galerie ci-dessous"}
              </p>
            </div>
          </div>

          {/* Quick preset gallery */}
          <div className="mt-2.5">
            <span className="block text-[11px] font-medium text-[#64748B] mb-1.5">
              {language === "ar" ? "صور جاهزة للنوادي الرياضية :" : "Photos prêtes à l'emploi (salle de sport) :"}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {PRESET_IMAGES.map((preset) => {
                const isSelected = image === preset.url;
                return (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setImage(preset.url)}
                    className={`shrink-0 w-12 h-12 rounded-[10px] overflow-hidden border-2 transition-all relative ${
                      isSelected
                        ? "border-[#2563EB] ring-2 ring-[#2563EB]/20 scale-105"
                        : "border-[#E2E8F0] hover:border-[#94A3B8] opacity-80 hover:opacity-100"
                    }`}
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#2563EB]/40 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block text-[12.5px] font-semibold text-[#0F172A] mb-1">
              {t("pos.productName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Eau minérale 0.5L, Barre protéinée..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-[12px] text-[13.5px] focus:outline-none focus:border-[#2563EB] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-[#0F172A] mb-1">
              {t("pos.category")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-[12px] text-[13.5px] focus:outline-none focus:border-[#2563EB] transition-colors"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-[#0F172A] mb-1">
              {t("pos.barcode")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="613..."
                className="w-full pl-9 pr-3.5 rtl:pl-3.5 rtl:pr-9 py-2.5 bg-white border border-[#E2E8F0] rounded-[12px] text-[13.5px] font-mono focus:outline-none focus:border-[#2563EB] transition-colors"
              />
              <Barcode className="w-4 h-4 text-[#94A3B8] absolute left-3 rtl:left-auto rtl:right-3 top-3" />
            </div>
          </div>
        </div>

        {/* 3. Pricing */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[12.5px] font-semibold text-[#0F172A] mb-1">
              {t("pos.price")}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="10"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="250"
                className="w-full pl-3.5 pr-10 rtl:pl-10 rtl:pr-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-[12px] text-[13.5px] font-semibold nums focus:outline-none focus:border-[#2563EB] transition-colors"
                required
              />
              <span className="absolute right-3 rtl:right-auto rtl:left-3 top-2.5 text-[11px] font-bold text-[#64748B]">
                DA
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-1">
              {t("pos.costPrice")}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="10"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="150"
                className="w-full pl-3.5 pr-10 rtl:pl-10 rtl:pr-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-[12px] text-[13.5px] nums focus:outline-none focus:border-[#2563EB] transition-colors"
              />
              <span className="absolute right-3 rtl:right-auto rtl:left-3 top-2.5 text-[11px] font-bold text-[#94A3B8]">
                DA
              </span>
            </div>
          </div>
        </div>

        {/* 4. Stock & Alert */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[12.5px] font-semibold text-[#0F172A] mb-1">
              {t("pos.stock")}
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="24"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-[12px] text-[13.5px] nums font-medium focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-1">
              {t("pos.stockAlert")}
            </label>
            <input
              type="number"
              min="1"
              value={minStockAlert}
              onChange={(e) => setMinStockAlert(e.target.value)}
              placeholder="5"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-[12px] text-[13.5px] nums focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
