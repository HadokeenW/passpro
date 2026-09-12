"use client";

import React, { useState, useEffect } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { formatMoney } from "@/lib/money";
import { useTranslation } from "@/lib/i18n";
import { ProductManagementModal, ProductData } from "./ProductManagementModal";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  Barcode,
  TrendingUp,
  CheckCircle2,
  Layers,
  CupSoda,
  Flame,
  Zap,
  Dumbbell,
} from "lucide-react";

export const ProductsCatalogView: React.FC = () => {
  const { t, language } = useTranslation();
  const toast = useToast();

  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (search.trim()) params.append("search", search.trim());
      params.append("activeOnly", "true");

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, search]);

  const handleQuickRestock = async (product: ProductData, amount: number) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockAdjustment: amount }),
      });

      if (res.ok) {
        toast.success(`+${amount} unités ajoutées à "${product.name}"`);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (product: ProductData) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذا المنتج؟" : `Désactiver l'article "${product.name}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(language === "ar" ? "تم الحذف بنجاح" : "Article désactivé");
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    { value: "ALL", label: t("pos.categories.all") || "Tous", icon: Layers },
    { value: "BOISSONS", label: t("pos.categories.drinks") || "Boissons", icon: CupSoda },
    { value: "PROTEINES", label: t("pos.categories.proteins") || "Protéines & Snacks", icon: Flame },
    { value: "COMPLEMENTS", label: t("pos.categories.supplements") || "Compléments", icon: Zap },
    { value: "ACCESSOIRES", label: t("pos.categories.accessories") || "Accessoires", icon: Dumbbell },
  ];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "BOISSONS":
        return { label: t("pos.categories.drinks") || "Boissons", icon: CupSoda, color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "PROTEINES":
        return { label: t("pos.categories.proteins") || "Protéines & Snacks", icon: Flame, color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "COMPLEMENTS":
        return { label: t("pos.categories.supplements") || "Compléments", icon: Zap, color: "text-purple-700 bg-purple-50 border-purple-200" };
      case "ACCESSOIRES":
        return { label: t("pos.categories.accessories") || "Accessoires", icon: Dumbbell, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      default:
        return { label: category, icon: Package, color: "text-slate-700 bg-slate-50 border-slate-200" };
    }
  };

  // Quick stats
  const totalItemsCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalStockValue = products.reduce((acc, p) => acc + p.stock * p.price, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-5">
      {/* 1. Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-[18px] bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
            <Package className="w-4 h-4 text-[#2563EB]" />
            <span>{t("pos.stockCount") || "Articles répertoriés"}</span>
          </div>
          <div className="mt-2 text-[22px] font-bold text-[#0F172A] nums">
            {products.length} <span className="text-[12px] font-normal text-[#94A3B8]">({totalItemsCount} unités)</span>
          </div>
        </div>

        <div className="p-4 rounded-[18px] bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B]">
            <TrendingUp className="w-4 h-4 text-[#059669]" />
            <span>Valeur marchande</span>
          </div>
          <div className="mt-2 text-[22px] font-bold text-[#059669] nums">
            {formatMoney(totalStockStockValue(totalStockValue))}
          </div>
        </div>

        <div className="p-4 rounded-[18px] bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#D97706]">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <span>Stock faible (&le; seuil)</span>
          </div>
          <div className="mt-2 text-[22px] font-bold text-[#D97706] nums">
            {lowStockCount}
          </div>
        </div>

        <div className="p-4 rounded-[18px] bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#DC2626]">
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
            <span>Ruptures de stock</span>
          </div>
          <div className="mt-2 text-[22px] font-bold text-[#DC2626] nums">
            {outOfStockCount}
          </div>
        </div>
      </div>

      {/* 2. Search, Filters & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-[18px] border border-[#E2E8F0]">
        <div className="flex items-center gap-2.5 flex-1 max-w-[400px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 rtl:left-auto rtl:right-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pos.searchPlaceholder") || "Rechercher un article..."}
              className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[13px] focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-[12px] overflow-x-auto max-w-full">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCategory === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setSelectedCategory(c.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#2563EB]" : "text-[#64748B]"}`} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
          >
            {t("pos.newProduct") || "Nouvel article"}
          </Button>
        </div>
      </div>

      {/* 3. Products Table Card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-12 text-center text-[13.5px] text-[#64748B]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2563EB]" />
            <span>{t("common.loading")}</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-[13.5px] text-[#64748B]">
            <Package className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" />
            <p className="font-semibold text-[#0F172A]">Aucun article trouvé</p>
            <p className="text-[12px] text-[#94A3B8] mt-1">Ajoutez un premier produit à la boutique</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-[13px] border-collapse">
              <thead>
                <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] font-semibold text-[#64748B]">
                  <th className="px-5">Article</th>
                  <th className="px-4">Catégorie</th>
                  <th className="px-4 text-right rtl:text-left">Prix de vente</th>
                  <th className="px-4 text-right rtl:text-left">Prix d&apos;achat</th>
                  <th className="px-4 text-center">Stock actuel</th>
                  <th className="px-4">Code-barres</th>
                  <th className="px-5 text-right rtl:text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {products.map((prod) => {
                  const isLow = prod.stock > 0 && prod.stock <= prod.minStockAlert;
                  const isOut = prod.stock === 0;

                  return (
                    <tr key={prod.id} className="h-14 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-[#94A3B8]" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[#0F172A] block">{prod.name}</span>
                            {isLow && (
                              <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">
                                &bull; Stock bas (seuil {prod.minStockAlert})
                              </span>
                            )}
                            {isOut && (
                              <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider">
                                &bull; En rupture
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4">
                        {(() => {
                          const badge = getCategoryBadge(prod.category);
                          const CatIcon = badge.icon;
                          return (
                            <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 rounded-full border ${badge.color}`}>
                              <CatIcon className="w-3.5 h-3.5" />
                              <span>{badge.label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-4 text-right rtl:text-left font-bold text-[#0F172A] nums text-[13.5px]">
                        {formatMoney(prod.price)}
                      </td>

                      <td className="px-4 text-right rtl:text-left font-medium text-[#94A3B8] nums text-[12px]">
                        {prod.costPrice ? formatMoney(prod.costPrice) : "—"}
                      </td>

                      <td className="px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-bold text-[12px] nums ${
                            isOut
                              ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                              : isLow
                              ? "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]"
                              : "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                          }`}
                        >
                          {prod.stock} unités
                        </span>
                      </td>

                      <td className="px-4">
                        {prod.barcode ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-[#64748B]">
                            <Barcode className="w-3.5 h-3.5 text-[#94A3B8]" />
                            <span>{prod.barcode}</span>
                          </div>
                        ) : (
                          <span className="text-[#CBD5E1] text-[11px]">—</span>
                        )}
                      </td>

                      <td className="px-5 text-right rtl:text-left">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleQuickRestock(prod, 12)}
                            title="Ajouter +12 unités"
                            className="px-2 py-1 rounded-[8px] text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] transition-colors"
                          >
                            +12
                          </button>
                          <button
                            onClick={() => handleQuickRestock(prod, 24)}
                            title="Ajouter +24 unités"
                            className="px-2 py-1 rounded-[8px] text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] transition-colors"
                          >
                            +24
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsModalOpen(true);
                            }}
                            title="Modifier"
                            className="w-8 h-8 rounded-[8px] text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] flex items-center justify-center transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod)}
                            title="Supprimer"
                            className="w-8 h-8 rounded-[8px] text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal for Add / Edit */}
      <ProductManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        productToEdit={editingProduct}
      />
    </div>
  );
};

function totalStockStockValue(n: number) {
  return n;
}
