"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { formatMoney } from "@/lib/money";
import { useTranslation } from "@/lib/i18n";
import { ProductManagementModal, ProductData } from "./ProductManagementModal";
import { ReceiptModal } from "./ReceiptModal";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  CreditCard,
  Banknote,
  User,
  Barcode,
  RefreshCw,
  Sparkles,
  AlertCircle,
  X,
  Printer,
  PackagePlus,
  Package,
  Layers,
  CupSoda,
  Flame,
  Zap,
  Dumbbell,
} from "lucide-react";

interface CartItem {
  product: ProductData;
  quantity: number;
}

interface SelectedMember {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

interface PosTerminalProps {
  onSaleSuccess?: () => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ onSaleSuccess }) => {
  const { t, language } = useTranslation();
  const toast = useToast();

  // Products state
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "OTHER">("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Member search state
  const [isSearchingMember, setIsSearchingMember] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<SelectedMember[]>([]);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  // Modals
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch Products
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
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
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, search]);

  // Handle Barcode Scan / Fast text filter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      e.preventDefault();
      // If exactly 1 product matches the query or barcode, auto add to cart
      const matched = products.find(
        (p) =>
          p.barcode === search.trim() ||
          p.name.toLowerCase() === search.trim().toLowerCase()
      );
      if (matched) {
        addToCart(matched);
        setSearch("");
      }
    }
  };

  // Member Search Autocomplete
  useEffect(() => {
    if (!memberQuery.trim()) {
      setMemberSearchResults([]);
      setIsMemberDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMember(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(memberQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setMemberSearchResults(data.members || []);
          setIsMemberDropdownOpen(true);
        }
      } catch (err) {
        console.error("Member search error:", err);
      } finally {
        setIsSearchingMember(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [memberQuery]);

  // Cart Management
  const addToCart = (product: ProductData) => {
    if (product.stock <= 0) {
      toast.error(`"${product.name}" est en rupture de stock`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Stock maximum atteint pour "${product.name}" (${product.stock})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              toast.error(`Stock maximal disponible : ${item.product.stock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedMember(null);
    setReceivedAmount("");
  };

  // Totals calculations
  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const numReceived = parseInt(receivedAmount, 10) || 0;
  const changeDue = numReceived > totalAmount ? numReceived - totalAmount : 0;

  // Checkout Handler
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsProcessingCheckout(true);
    try {
      const payload = {
        paymentType: "POS_SALE",
        items: cart.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity,
        })),
        method: paymentMethod,
        memberId: selectedMember?.id || null,
        receivedAmount: numReceived > 0 ? numReceived : totalAmount,
      };

      const res = await fetch("/api/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Échec de l'encaissement");
      }

      toast.success(t("pos.checkoutSuccess") || "Vente validée avec succès !");

      // Invalidate cache
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("passpro:cache-invalidate", {
            detail: { prefixes: ["payment", "product", "dashboard"] },
          })
        );
      }

      // Open thermal receipt modal
      try {
        const receiptRes = await fetch(`/api/payments/${data.id}`);
        if (receiptRes.ok) {
          const rData = await receiptRes.json();
          setReceiptData(rData);
        }
      } catch (e) {
        console.error(e);
      }

      clearCart();
      fetchProducts();
      onSaleSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la validation");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const categories = [
    { value: "ALL", label: t("pos.categories.all") || "Tous", icon: Layers },
    { value: "BOISSONS", label: t("pos.categories.drinks") || "Boissons", icon: CupSoda },
    { value: "PROTEINES", label: t("pos.categories.proteins") || "Protéines & Snacks", icon: Flame },
    { value: "COMPLEMENTS", label: t("pos.categories.supplements") || "Compléments", icon: Zap },
    { value: "ACCESSOIRES", label: t("pos.categories.accessories") || "Accessoires", icon: Dumbbell },
  ];

  const quickBills = [
    { label: t("pos.exact") || "Exact", value: totalAmount },
    { label: "200 DA", value: 200 },
    { label: "500 DA", value: 500 },
    { label: "1 000 DA", value: 1000 },
    { label: "2 000 DA", value: 2000 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ─── LEFT: PRODUCT CATALOG & CATEGORIES (7 or 8 cols) ─── */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* 1. Category filter pills + Quick Add Product */}
        <div className="bg-white p-3.5 rounded-[20px] border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCategory === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setSelectedCategory(c.value)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-[12.5px] font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-[#2563EB] text-white shadow-sm shadow-blue-500/20"
                      : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-[#64748B]"}`} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<PackagePlus className="w-4 h-4 text-[#2563EB]" />}
            onClick={() => setIsNewProductModalOpen(true)}
          >
            {t("pos.newProduct") || "+ Article"}
          </Button>
        </div>

        {/* 2. Fast Search & Barcode Input */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t("pos.searchPlaceholder") || "Rechercher ou scanner un code-barres..."}
            className="w-full pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-3 bg-white border border-[#E2E8F0] rounded-[16px] text-[14px] text-[#0F172A] shadow-xs focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
          />
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3.5" />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-3 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Barcode className="w-4 h-4 text-[#CBD5E1] absolute right-3.5 rtl:right-auto rtl:left-3.5 top-3.5" />
          )}
        </div>

        {/* 3. Product Grid */}
        {isLoadingProducts ? (
          <div className="bg-white p-12 rounded-[20px] border border-[#E2E8F0] text-center text-[13.5px] text-[#64748B]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2563EB]" />
            <span>{t("common.loading")}</span>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-12 rounded-[20px] border border-[#E2E8F0] text-center text-[13.5px] text-[#64748B]">
            <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <p className="font-semibold text-[#0F172A]">Aucun produit disponible</p>
            <p className="text-[12px] text-[#94A3B8] mt-1">Créez votre premier article via le bouton &quot;+ Article&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {products.map((prod) => {
              const isOut = prod.stock <= 0;
              const isLow = prod.stock > 0 && prod.stock <= prod.minStockAlert;
              const cartItem = cart.find((i) => i.product.id === prod.id);

              return (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  disabled={isOut}
                  className={`group relative bg-white p-3 rounded-[18px] border text-left rtl:text-right transition-all duration-150 flex flex-col justify-between select-none cursor-pointer ${
                    isOut
                      ? "opacity-50 grayscale cursor-not-allowed border-[#E2E8F0]"
                      : cartItem
                      ? "border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-md shadow-blue-500/5 bg-gradient-to-b from-white to-[#EFF6FF]/40 active:scale-98"
                      : "border-[#E2E8F0] hover:border-[#BFDBFE] hover:shadow-md hover:shadow-slate-200/50 active:scale-98"
                  }`}
                >
                  {/* Top: Product Image + Stock Badge */}
                  <div className="relative w-full h-32 rounded-[14px] bg-[#F8FAFC] border border-[#F1F5F9] overflow-hidden flex items-center justify-center">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    {/* Stock status floating pill */}
                    <span
                      className={`absolute top-2 right-2 rtl:right-auto rtl:left-2 text-[10px] font-bold px-2 py-0.5 rounded-full nums shadow-xs backdrop-blur-md ${
                        isOut
                          ? "bg-[#FEF2F2]/95 text-[#DC2626] border border-[#FECACA]"
                          : isLow
                          ? "bg-[#FFFBEB]/95 text-[#D97706] border border-[#FDE68A]"
                          : "bg-white/95 text-[#059669] border border-[#A7F3D0]"
                      }`}
                    >
                      {isOut ? t("pos.outOfStock") : `${prod.stock} ${t("pos.inStock")}`}
                    </span>
                  </div>

                  {/* Middle: Product Name */}
                  <div className="mt-2.5 min-h-[36px]">
                    <span className="text-[13px] font-bold text-[#0F172A] leading-snug line-clamp-2">
                      {prod.name}
                    </span>
                  </div>

                  {/* Bottom: Price + Cart Badge */}
                  <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                    <span className="text-[15px] font-bold text-[#2563EB] nums">
                      {formatMoney(prod.price)}
                    </span>

                    {cartItem && (
                      <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white font-bold text-[11px] flex items-center justify-center shadow-xs animate-scale-up">
                        {cartItem.quantity}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── RIGHT: VIRTUAL REGISTER / CART PANEL (4 or 5 cols) ─── */}
      <div className="lg:col-span-5 xl:col-span-4 sticky top-4">
        <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden">
          {/* Header: Register Title & Reset */}
          <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-white border-b border-[#F1F5F9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#0F172A]">
                  {t("pos.cartTitle") || "Ticket de caisse"}
                </h3>
                <span className="text-[11px] text-[#64748B]">
                  {totalItemsCount} {t("pos.itemsCount") || "articles"}
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[12px] font-medium text-[#DC2626] hover:underline cursor-pointer"
              >
                Vider
              </button>
            )}
          </div>

          {/* Customer Selection (Walk-in vs Member) */}
          <div className="p-3 bg-[#F8FAFC] border-b border-[#F1F5F9]">
            {selectedMember ? (
              <div className="flex items-center justify-between p-2 rounded-[12px] bg-white border border-[#BFDBFE]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-[11px] flex items-center justify-center shrink-0">
                    {selectedMember.firstName[0]}
                    {selectedMember.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold text-[#0F172A] block truncate">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </span>
                    {selectedMember.phone && (
                      <span className="text-[10px] text-[#64748B] block truncate font-mono">
                        {selectedMember.phone}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-1 text-[#94A3B8] hover:text-[#DC2626] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-[12px] border border-[#E2E8F0]">
                  <User className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  <input
                    type="text"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder={t("pos.searchMember") || "Associer adhérent (nom, badge)..."}
                    className="w-full text-[12px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none bg-transparent"
                  />
                  {memberQuery && (
                    <button onClick={() => setMemberQuery("")} className="text-[#94A3B8]">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Member search dropdown */}
                {isMemberDropdownOpen && memberSearchResults.length > 0 && (
                  <div className="absolute top-10 left-0 right-0 bg-white rounded-[14px] shadow-xl border border-[#E2E8F0] z-50 max-h-[220px] overflow-y-auto divide-y divide-[#F1F5F9]">
                    {memberSearchResults.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMember(m);
                          setMemberQuery("");
                          setIsMemberDropdownOpen(false);
                        }}
                        className="w-full text-left rtl:text-right p-2.5 hover:bg-[#F8FAFC] flex items-center justify-between text-[12px] cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-[#0F172A] block">
                            {m.firstName} {m.lastName}
                          </span>
                          {m.phone && <span className="text-[10.5px] text-[#64748B]">{m.phone}</span>}
                        </div>
                        <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                          Sélectionner
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scrollable Cart Items */}
          <div className="max-h-[300px] overflow-y-auto p-3 divide-y divide-[#F1F5F9]">
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F8FAFC] text-[#CBD5E1] flex items-center justify-center mx-auto mb-2">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-bold text-[#0F172A]">
                  {t("pos.emptyCart") || "Ticket vide"}
                </p>
                <p className="text-[11.5px] text-[#94A3B8] max-w-[200px] mx-auto mt-1">
                  {t("pos.emptyCartHint") || "Cliquez sur un article pour l'ajouter au panier"}
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const lineTotal = item.product.price * item.quantity;
                return (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-[#94A3B8]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[12.5px] font-bold text-[#0F172A] block truncate">
                          {item.product.name}
                        </span>
                        <span className="text-[11px] text-[#64748B] nums">
                          {formatMoney(item.product.price)} / unité
                        </span>
                      </div>
                    </div>

                    {/* Stepper + Price */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-[10px] p-0.5">
                        <button
                          onClick={() => updateQuantity(item.product.id!, -1)}
                          className="w-6 h-6 rounded-[7px] bg-white hover:bg-[#E2E8F0] flex items-center justify-center text-[#0F172A] shadow-xs cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-[12px] font-bold nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id!, 1)}
                          className="w-6 h-6 rounded-[7px] bg-white hover:bg-[#E2E8F0] flex items-center justify-center text-[#0F172A] shadow-xs cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-[13.5px] text-[#0F172A] nums min-w-[65px] text-right rtl:text-left">
                        {formatMoney(lineTotal)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product.id!)}
                        className="text-[#94A3B8] hover:text-[#DC2626] p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer & Checkout Options */}
          {cart.length > 0 && (
            <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] space-y-3.5">
              {/* Grand Total */}
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wide">
                  {t("pos.total") || "Total à payer"}
                </span>
                <span className="text-[26px] font-black text-[#0F172A] tracking-tight nums text-gradient">
                  {formatMoney(totalAmount)}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("CASH")}
                  className={`py-2 px-3 rounded-[12px] border text-[12.5px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === "CASH"
                      ? "bg-[#ECFDF5] text-[#059669] border-[#059669] shadow-xs"
                      : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>{t("payments.methods.CASH") || "Espèces"}</span>
                </button>

                <button
                  onClick={() => setPaymentMethod("CARD")}
                  className={`py-2 px-3 rounded-[12px] border text-[12.5px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === "CARD"
                      ? "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] shadow-xs"
                      : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{t("payments.methods.CARD") || "Carte (TPE)"}</span>
                </button>
              </div>

              {/* Cash Presets & Change Due (When CASH is selected) */}
              {paymentMethod === "CASH" && (
                <div className="space-y-2 pt-1 border-t border-[#E2E8F0]/70">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B]">
                    <span>{t("pos.quickCash") || "Billets reçus :"}</span>
                    {changeDue > 0 && (
                      <span className="text-[#059669] font-bold nums">
                        {t("pos.changeDue") || "Rendu :"} {formatMoney(changeDue)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {quickBills.map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        onClick={() => setReceivedAmount(b.value.toString())}
                        className={`px-2.5 py-1 rounded-[8px] text-[11.5px] font-bold border transition-colors cursor-pointer ${
                          numReceived === b.value
                            ? "bg-[#059669] text-white border-[#059669]"
                            : "bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Validate & Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isProcessingCheckout || cart.length === 0}
                className="w-full py-3.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[14px] rounded-[14px] shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isProcessingCheckout ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>{t("pos.checkout") || "Valider l'encaissement & Reçu"}</span>
                    <span className="text-[11px] bg-white/25 px-1.5 py-0.5 rounded font-mono ml-1">
                      ↵
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal New Product */}
      <ProductManagementModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSuccess={fetchProducts}
      />

      {/* Modal Receipt after sale */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        receiptData={receiptData}
      />
    </div>
  );
};
