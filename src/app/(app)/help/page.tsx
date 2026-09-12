"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/business/Button";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  CalendarCheck,
  ScanLine,
  ShoppingCart,
  Users,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Command,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  X,
  BookOpen,
  ArrowRight,
  Database,
  Lock,
} from "lucide-react";

interface StepItem {
  number: number;
  title: string;
  description: string;
}

interface FaqItem {
  id: string;
  category: "SUBSCRIPTIONS" | "CARDS" | "POS" | "MEMBERS" | "SYSTEM";
  question: { fr: string; en: string; ar: string };
  summary: { fr: string; en: string; ar: string };
  steps: {
    fr: StepItem[];
    en: StepItem[];
    ar: StepItem[];
  };
  tip?: { fr: string; en: string; ar: string };
  actionLink?: {
    href: string;
    label: { fr: string; en: string; ar: string };
  };
}

const FAQ_DATA: FaqItem[] = [
  // ─── 1. ABONNEMENTS & RENOUVELLEMENTS ───
  {
    id: "renew-subscription",
    category: "SUBSCRIPTIONS",
    question: {
      fr: "Comment renouveler l'abonnement d'un adhérent ?",
      en: "How do I renew a member's subscription?",
      ar: "كيف يمكنني تجديد اشتراك مشترك؟",
    },
    summary: {
      fr: "Le renouvellement prolonge automatiquement l'accès et édite un ticket de règlement en caisse.",
      en: "Renewing extends access automatically and generates a cash register receipt.",
      ar: "يقوم التجديد بتمديد فترة الصلاحية تلقائياً وإصدار وصل دفع في الصندوق.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Accéder au dossier de l'adhérent",
          description: "Allez dans Gestion > Adhérents ou appuyez sur '/' pour taper le nom de l'adhérent.",
        },
        {
          number: 2,
          title: "Cliquer sur 'Renouveler'",
          description: "Dans la section 'Abonnement actuel', cliquez sur le bouton bleu 'Renouveler'.",
        },
        {
          number: 3,
          title: "Sélectionner la nouvelle formule",
          description: "Choisissez la durée (1 mois, 3 mois, annuel...) et la date d'effet. Le tarif se calcule tout seul.",
        },
        {
          number: 4,
          title: "Encaisser & imprimer le reçu",
          description: "Validez le mode de règlement (Espèces ou Carte) pour clôturer le renouvellement.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Open Member Profile",
          description: "Go to Management > Members or press '/' to search the member's name.",
        },
        {
          number: 2,
          title: "Click 'Renew'",
          description: "In the 'Current Subscription' card, click the blue 'Renew' button.",
        },
        {
          number: 3,
          title: "Select Membership Plan",
          description: "Choose the formula (1 month, 3 months, annual...) and effective date. Price is auto-calculated.",
        },
        {
          number: 4,
          title: "Collect Payment & Print Receipt",
          description: "Confirm the payment method (Cash or Card) to complete renewal.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "الدخول إلى ملف المشترك",
          description: "توجه إلى الإدارة > المشتركون أو اضغط على '/' للبحث عن اسم المشترك.",
        },
        {
          number: 2,
          title: "الضغط على 'تجديد'",
          description: "في بطاقة 'الاشتراك الحالي'، اضغط على الزر الأزرق 'تجديد'.",
        },
        {
          number: 3,
          title: "اختيار الباقة والمدة",
          description: "اختر الباقة المطلوبة وتاريخ البداية. يتم احتساب المبلغ وتاريخ الانتهاء تلقائياً.",
        },
        {
          number: 4,
          title: "تسجيل الدفع وطباعة الوصل",
          description: "حدد وسيلة الدفع (نقداً أو بطاقة بنكية) لتأكيد التجديد فورا.",
        },
      ],
    },
    tip: {
      fr: "Si l'adhérent se trouve devant vous au comptoir, vous pouvez aussi renouveler directement depuis le menu 'Caisse' > '+ Encaisser un abonnement'.",
      en: "If the member is standing at the reception, you can also renew via 'Cash Register' > '+ Subscribe / Renew'.",
      ar: "إذا كان المشترك أمام مكتب الاستقبال، يمكنك أيضاً التجديد مباشرة من قائمة 'الصندوق' > '+ تحصيل اشتراك'.",
    },
    actionLink: {
      href: "/members",
      label: { fr: "Aller aux Adhérents", en: "Go to Members", ar: "الانتقال إلى المشتركين" },
    },
  },
  {
    id: "expiring-soon",
    category: "SUBSCRIPTIONS",
    question: {
      fr: "Que faire si un abonnement expire bientôt ou est déjà expiré ?",
      en: "What should I do if a subscription is expiring soon or expired?",
      ar: "ماذا أفعل عندما يقترب اشتراك من الانتهاء أو ينتهي بالفعل؟",
    },
    summary: {
      fr: "PassPro affiche des alertes visuelles jaunes (< 7 jours) et rouges (expiré) pour relancer les adhérents.",
      en: "PassPro displays warning badges (< 7 days) and expired alerts to easily follow up with members.",
      ar: "يعرض باسبور شارات تنبيه ملونة (أقل من 7 أيام) وشارات حمراء للمنتهية اشتراكاتهم لتسهيل التذكير.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Consulter les alertes du Tableau de bord",
          description: "Sur la page d'accueil, cliquez sur la carte 'Expirant sous 7 jours' pour filtrer la liste.",
        },
        {
          number: 2,
          title: "Contacter ou relancer l'adhérent",
          description: "Utilisez le numéro de téléphone affiché pour le prévenir avant que son badge ne soit bloqué.",
        },
        {
          number: 3,
          title: "Comportement au tourniquet",
          description: "Un abonnement expiré déclenche automatiquement un écran rouge 'Accès Refusé' à la borne.",
        },
      ],
      en: [
        {
          number: 1,
          title: "View Dashboard Alerts",
          description: "On the home dashboard, click 'Expiring in 7 days' to filter the list.",
        },
        {
          number: 2,
          title: "Contact Member",
          description: "Use the phone number on file to remind the member before their badge gets locked.",
        },
        {
          number: 3,
          title: "Kiosk Barrier Behavior",
          description: "An expired subscription triggers an immediate red 'Access Denied' screen at the turnstile.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "متابعة تنبيهات لوحة التحكم",
          description: "من الشاشة الرئيسية، اضغط على بطاقة 'تنتهي خلال 7 أيام' لعرض القائمة المفلترة.",
        },
        {
          number: 2,
          title: "التواصل مع المشترك",
          description: "استعمل رقم الهاتف المسجل لتذكيره قبل إيقاف شارة الدخول الخاصة به.",
        },
        {
          number: 3,
          title: "التعامل عند البوابة الإلكترونية",
          description: "الاشتراك المنتهي يظهر فوراً شاشة حمراء 'دخول مرفوض' مع ذكر السبب بوضوح.",
        },
      ],
    },
    actionLink: {
      href: "/members?filter=expiring_soon",
      label: { fr: "Voir les expirations imminentes", en: "View Expiring Soon", ar: "عرض الاشتراكات المنتهية قريباً" },
    },
  },
  {
    id: "suspend-subscription",
    category: "SUBSCRIPTIONS",
    question: {
      fr: "Comment suspendre temporairement un abonnement (congés, maladie) ?",
      en: "How to freeze or temporarily suspend a subscription?",
      ar: "كيف أقوم بتجميد أو تعليق اشتراك مؤقتاً (سفر، عطلة، مرض)؟",
    },
    summary: {
      fr: "La suspension bloque l'accès immédiatement et reporte la date de fin à la reprise sans perte de jours.",
      en: "Freezing blocks turnstile access and extends the expiration date upon resumption without losing days.",
      ar: "التعليق المؤقت يمنع الدخول فوراً ويقوم بترحيل تاريخ النهاية عند الاستئناف دون ضياع الأيام.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Ouvrir la fiche de l'adhérent",
          description: "Rendez-vous dans son profil complet.",
        },
        {
          number: 2,
          title: "Cliquer sur 'Suspendre l'abonnement'",
          description: "Confirmez le motif (ex: Certificat médical, voyage professionnel).",
        },
        {
          number: 3,
          title: "Réactivation au retour",
          description: "Dès que l'adhérent revient à la salle, cliquez sur 'Réactiver' : sa date d'échéance est repoussée automatiquement.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Open Member Profile",
          description: "Go to the member's full 360 profile.",
        },
        {
          number: 2,
          title: "Click 'Suspend Subscription'",
          description: "State the reason (e.g. Medical certificate, travel).",
        },
        {
          number: 3,
          title: "Reactivate upon Return",
          description: "When the member returns, click 'Reactivate' : expiration date is shifted forward automatically.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "فتح ملف المشترك",
          description: "انتقل إلى الملف الشخصي الشامل للمشترك.",
        },
        {
          number: 2,
          title: "الضغط على 'تجميد الاشتراك'",
          description: "أدخل سبب التجميد (شهادة طبية، سفر، إلخ).",
        },
        {
          number: 3,
          title: "إعادة التفعيل عند العودة",
          description: "بمجرد عودة المشترك، اضغط على 'إلغاء التجميد' : يتم تمديد تاريخ الصلاحية بقدر مدة التوقف تلقائياً.",
        },
      ],
    },
    tip: {
      fr: "L'historique de chaque suspension reste consigné dans l'audit système pour éviter tout abus.",
      en: "All freeze events are logged in the system audit trail to prevent misuse.",
      ar: "يتم تسجيل كل عمليات التجميد في سجل العمليات لمنع أي تجاوزات.",
    },
  },
  {
    id: "duration-vs-packs",
    category: "SUBSCRIPTIONS",
    question: {
      fr: "Quelle est la différence entre un abonnement à durée et un carnet de séances (Packs) ?",
      en: "What is the difference between a time-based subscription and a session pack?",
      ar: "ما هو الفرق بين الاشتراك الزمني ودفتر الحصص (Packs)؟",
    },
    summary: {
      fr: "Les abonnements temporels offrent un accès illimité dans le temps, tandis que les packs décomptent 1 séance par passage.",
      en: "Time-based plans provide unlimited access for a duration, while packs deduct 1 session per scan.",
      ar: "الاشتراكات الزمنية تمنح دخولاً غير محدود خلال المدة، بينما تخصم باقات الحصص حصة واحدة مع كل دخول.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Abonnement à durée (Mensuel, Trimestriel, Annuel)",
          description: "L'adhérent peut venir tous les jours selon les créneaux de sa formule jusqu'à la date d'expiration.",
        },
        {
          number: 2,
          title: "Carnet de séances (Ex: Pack 10 ou 20 entrées)",
          description: "À chaque bip valide au tourniquet, le solde restant diminue de 1. Lorsque le solde atteint 0, l'accès est bloqué.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Time-based Subscription (Monthly, Quarterly, Annual)",
          description: "Member can enter daily within plan hours until the expiration date.",
        },
        {
          number: 2,
          title: "Session Pack (e.g. 10 or 20 sessions)",
          description: "Each badge scan deducts 1 session. When 0 sessions remain, access is denied.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "اشتراك زمني (شهري، فصلي، سنوي)",
          description: "يمكن للمشترك الدخول يومياً حسب ساعات باقته حتى انتهاء التاريخ المحدد.",
        },
        {
          number: 2,
          title: "باقة حصص (مثال: 10 أو 20 حصة)",
          description: "مع كل تمريرة بطاقة ناجحة، يُخصم رصيد حصة واحدة، وعند الوصول إلى 0 يُمنع الدخول تلقائياً.",
        },
      ],
    },
  },

  // ─── 2. BADGES RFID & TOURNIQUET ───
  {
    id: "assign-rfid-card",
    category: "CARDS",
    question: {
      fr: "Comment assigner une nouvelle carte RFID à un adhérent ?",
      en: "How do I assign a new RFID card badge to a member?",
      ar: "كيف أقوم بربط بطاقة RFID جديدة بمشترك؟",
    },
    summary: {
      fr: "Il suffit de passer la carte sur le lecteur USB connecté au PC de réception.",
      en: "Simply swipe the card on the USB reader connected to your reception computer.",
      ar: "يكفي تمرير البطاقة فوق قارئ الـ USB المتصل بجهاز الاستقبال.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Ouvrir le champ 'Carte RFID'",
          description: "Sur la fiche de l'adhérent (ou lors de l'inscription F2), cliquez sur 'Assigner un badge'.",
        },
        {
          number: 2,
          title: "Passer le badge sur le lecteur",
          description: "Le lecteur USB émule la saisie et remplit automatiquement le numéro UID (ex: 04E5A8B2).",
        },
        {
          number: 3,
          title: "Enregistrer",
          description: "La carte est immédiatement active sur toutes les bornes et tourniquets du réseau.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Select RFID Card Field",
          description: "On the member profile (or during F2 registration), click 'Assign Badge'.",
        },
        {
          number: 2,
          title: "Scan Card on USB Reader",
          description: "The reader automatically enters the card's UID hex number (e.g. 04E5A8B2).",
        },
        {
          number: 3,
          title: "Save",
          description: "The badge is instantly active on all turnstiles and kiosk terminals.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "فتح حقل بطاقة RFID",
          description: "في ملف المشترك (أو أثناء التسجيل السريع F2)، اضغط على 'ربط بطاقة'.",
        },
        {
          number: 2,
          title: "تمرير البطاقة على القارئ",
          description: "يقوم القارئ بكتابة المعرف الفريد (UID) تلقائياً (مثال: 04E5A8B2).",
        },
        {
          number: 3,
          title: "حفظ",
          description: "تصبح البطاقة مفعلة فوراً على جميع بوابات ونقاط الدخول.",
        },
      ],
    },
    tip: {
      fr: "Tout lecteur RFID USB standard (13.56 MHz Mifare ou 125 kHz EM4100) en mode Keyboard Wedge fonctionne instantanément sans pilote.",
      en: "Any standard USB RFID reader in Keyboard Wedge mode works out of the box with zero drivers.",
      ar: "أي قارئ بطاقات USB قياسي يعمل بنمط لوحة المفاتيح متوافق فوراً بدون برامج تشغيل إضافية.",
    },
  },
  {
    id: "lost-rfid-card",
    category: "CARDS",
    question: {
      fr: "Que faire si un adhérent a perdu ou endommagé son badge ?",
      en: "What if a member loses or damages their RFID badge?",
      ar: "ما العمل في حال فقدان أو تلف بطاقة المشترك؟",
    },
    summary: {
      fr: "Désactivez l'ancien badge en 1 clic pour interdire tout accès frauduleux, puis assignez-en un nouveau.",
      en: "Disable the lost card in one click to prevent unauthorized entry, then bind a new card.",
      ar: "عطّل البطاقة القديمة بنقرة واحدة لمنع أي دخول غير مصرح به، ثم قم بربط بطاقة جديدة.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Aller sur la fiche adhérent",
          description: "Dans le bloc 'Carte d'accès', cliquez sur le menu d'actions ou 'Dissocier la carte'.",
        },
        {
          number: 2,
          title: "Désactivation immédiate",
          description: "L'ancienne carte est invalidée dans la base de données. Si quelqu'un la présente, l'accès sera refusé.",
        },
        {
          number: 3,
          title: "Attribuer la nouvelle carte",
          description: "Passez le nouveau badge sur le lecteur et enregistrez.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Open Member Profile",
          description: "Under the 'Access Badge' card, click 'Unbind / Remove Card'.",
        },
        {
          number: 2,
          title: "Instant Invalidation",
          description: "The old card is immediately revoked. Any scan attempt will be rejected.",
        },
        {
          number: 3,
          title: "Assign Replacement Badge",
          description: "Scan the new badge on the reader and click Save.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "الدخول لملف المشترك",
          description: "في قسم 'بطاقة الدخول'، اضغط على 'فصل / إلغاء البطاقة'.",
        },
        {
          number: 2,
          title: "إلغاء الصلاحية فوراً",
          description: "تصبح البطاقة القديمة ملغاة في النظام، وسيقوم Tourniquet برفضها تلقائياً.",
        },
        {
          number: 3,
          title: "ربط بطاقة جديدة",
          description: "مرر البطاقة الجديدة على القارئ واضغط حفظ.",
        },
      ],
    },
  },
  {
    id: "access-denied-reasons",
    category: "CARDS",
    question: {
      fr: "Pourquoi l'accès d'un adhérent est-il refusé au tourniquet / kiosque ?",
      en: "Why is a member's access denied at the turnstile / kiosk?",
      ar: "لماذا يتم رفض دخول المشترك عند البوابة الإلكترونية / الكشك؟",
    },
    summary: {
      fr: "Le journal des accès affiche le motif exact du refus pour chaque passage.",
      en: "The access log displays the exact refusal reason for every scanned badge.",
      ar: "يعرض سجل الدخول السبب الدقيق لرفض الدخول مع كل محاولة.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Abonnement expiré",
          description: "La date de fin est dépassée. Un renouvellement est requis.",
        },
        {
          number: 2,
          title: "Hors créneau horaire",
          description: "La formule de l'adhérent est limitée (ex: Heures Creuses 08h-14h) et il se présente hors plage.",
        },
        {
          number: 3,
          title: "Anti-Passback actif",
          description: "Le badge a déjà été bipé à l'entrée il y a moins de X minutes pour empêcher de prêter sa carte.",
        },
        {
          number: 4,
          title: "Abonnement suspendu ou certificat manquant",
          description: "Le statut de l'adhérent a été mis en pause ou son dossier est incomplet.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Expired Subscription",
          description: "The end date has passed. A renewal is required.",
        },
        {
          number: 2,
          title: "Outside Authorized Hours",
          description: "The member's plan has time restrictions (e.g. Off-peak 08am-02pm).",
        },
        {
          number: 3,
          title: "Anti-Passback Active",
          description: "The badge was scanned a few minutes ago to prevent sharing cards with friends.",
        },
        {
          number: 4,
          title: "Suspended or Missing Medical Form",
          description: "Account has been frozen or requires document validation.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "اشتراك منتهي",
          description: "انتهت فترة الاشتراك ويجب التجديد لمتابعة الدخول.",
        },
        {
          number: 2,
          title: "خارج الأوقات المسموحة",
          description: "باقة المشترك محددة بساعات معينة (مثال: أوقات الذروة أو الصباح فقط).",
        },
        {
          number: 3,
          title: "تفعيل منع تمرير البطاقة (Anti-Passback)",
          description: "تم تمرير البطاقة قبل قليل لمنع إعارتها لشخص آخر في نفس اللحظة.",
        },
        {
          number: 4,
          title: "اشتراك مجمد أو نقص وثائق",
          description: "تم تجميد الحساب بطلب من المشترك أو في انتظار تسوية إدارية.",
        },
      ],
    },
    actionLink: {
      href: "/access-logs",
      label: { fr: "Consulter le Journal des Passages", en: "Check Access Logs", ar: "مراجعة سجل الدخول المباشر" },
    },
  },

  // ─── 3. CAISSE & MINI POS ───
  {
    id: "sell-product-pos",
    category: "POS",
    question: {
      fr: "Comment vendre une boisson ou un snack au comptoir (Mini POS) ?",
      en: "How to sell drinks, snacks, or accessories at the register (Mini POS)?",
      ar: "كيف أقوم ببيع مشروب أو سناك في الصندوق (Mini POS)؟",
    },
    summary: {
      fr: "Le Mini POS permet d'encaisser les consommables en 2 clics avec rendu de monnaie et impression de reçu.",
      en: "The Mini POS allows ringing up consumables in 2 clicks with change calculation and receipt printing.",
      ar: "تتيح نقطة البيع المصغرة بيع المشروبات والمكملات بنقرتين مع حساب الصرف وطباعة الوصل.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Ouvrir la Caisse",
          description: "Allez dans Finances > Caisse (l'onglet 'Terminal Mini POS' est sélectionné par défaut).",
        },
        {
          number: 2,
          title: "Sélectionner les articles",
          description: "Cliquez sur les photos des produits ou scannez leurs codes-barres avec la douchette.",
        },
        {
          number: 3,
          title: "(Optionnel) Associer un adhérent",
          description: "Recherchez son nom si l'adhérent souhaite rattacher ses achats à son historique.",
        },
        {
          number: 4,
          title: "Règlement & Rendu de monnaie",
          description: "Sélectionnez Espèces ou Carte TPE, cliquez sur les raccourcis de billets (500 DA, 1 000 DA...) pour voir la monnaie à rendre, puis validez.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Open Cash Register",
          description: "Go to Finances > Cash Register (the Mini POS terminal is selected by default).",
        },
        {
          number: 2,
          title: "Select Products",
          description: "Click product photos or scan their barcodes with a handheld scanner.",
        },
        {
          number: 3,
          title: "(Optional) Assign Member",
          description: "Search the member's name if they want purchases attached to their account.",
        },
        {
          number: 4,
          title: "Payment & Change Calculation",
          description: "Choose Cash or Card, click quick bills (500 DZD, 1000 DZD...) to see change due, and finalize.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "فتح الصندوق",
          description: "توجه إلى المالية > الصندوق (يفتح تبويب نقطة البيع Mini POS تلقائياً).",
        },
        {
          number: 2,
          title: "اختيار المنتجات",
          description: "اضغط على صور المنتجات أو امسح الباركود الخاص بها بجهاز المسح.",
        },
        {
          number: 3,
          title: "(اختياري) ربط بمشترك",
          description: "ابحث عن اسم المشترك لربط المشتريات بحسابه وسجل مشترياته.",
        },
        {
          number: 4,
          title: "الدفع وحساب المتبقي",
          description: "اختر نقداً أو بطاقة، واضغط على مبالغ الأوراق النقدية لمعرفة الصرف المتبقي، ثم أكد العملية.",
        },
      ],
    },
    actionLink: {
      href: "/payments",
      label: { fr: "Ouvrir le Mini POS", en: "Open Mini POS", ar: "فتح نقطة البيع" },
    },
  },
  {
    id: "add-product-inventory",
    category: "POS",
    question: {
      fr: "Comment ajouter un produit au catalogue ou faire un réassort de stock ?",
      en: "How to add a new product or adjust stock inventory?",
      ar: "كيف أضيف منتجاً جديداً أو أقوم بزيادة كمية المخزون؟",
    },
    summary: {
      fr: "Gérez les photos, codes-barres, prix de vente et alertes de seuil d'épuisement.",
      en: "Manage product pictures, barcodes, prices, and low-stock alert thresholds.",
      ar: "تحكم في صور المنتجات، الباركود، أسعار البيع، وتنبيهات نفاد المخزون.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Accéder à l'onglet 'Stocks & Produits'",
          description: "Dans la page Caisse, cliquez sur l'onglet 'Stocks & Produits'.",
        },
        {
          number: 2,
          title: "Créer un article (+ Article)",
          description: "Importez une photo depuis votre PC ou choisissez une photo studio prête à l'emploi (eau, whey, barre...).",
        },
        {
          number: 3,
          title: "Réassort rapide (+12 / +24)",
          description: "Dans le tableau, utilisez les boutons '+12' ou '+24' sur la ligne du produit pour ajouter un pack de stock en un clic.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Go to 'Inventory & Products'",
          description: "In the Payments page, click the 'Inventory & Products' tab.",
        },
        {
          number: 2,
          title: "Create Product (+ New Item)",
          description: "Upload a photo from your computer or pick a pre-made gym photo (water, shaker, protein bar...).",
        },
        {
          number: 3,
          title: "Quick Restock (+12 / +24)",
          description: "In the table, click '+12' or '+24' buttons to restock full packs in 1 click.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "الانتقال لتبويب 'المخزون والمنتجات'",
          description: "من صفحة الصندوق، اضغط على تبويب 'المخزون والمنتجات'.",
        },
        {
          number: 2,
          title: "إضافة منتج جديد (+ منتج جديد)",
          description: "حمّل صورة من جهازك أو اختر من الصور الجاهزة للنوادي الرياضية (ماء، بروتين، سناك...).",
        },
        {
          number: 3,
          title: "إعادة التموين السريع (+12 / +24)",
          description: "استعمل أزرار '+12' أو '+24' بجانب كل منتج لإضافة كميات جديدة بنقرة واحدة.",
        },
      ],
    },
  },
  {
    id: "z-report-close",
    category: "POS",
    question: {
      fr: "Comment imprimer un duplicata de reçu ou éditer la clôture journalière (Rapport Z) ?",
      en: "How to reprint a receipt or print the daily closing report (Z-Report)?",
      ar: "كيف أقوم بإعادة طباعة وصل أو إعداد تقرير الإغلاق اليومي (Rapport Z)؟",
    },
    summary: {
      fr: "Chaque encaissement peut être réimprimé sur imprimante thermique 80mm/58mm.",
      en: "Any transaction can be reprinted on an 80mm/58mm thermal receipt printer.",
      ar: "يمكن إعادة طباعة أي وصل في أي وقت عبر الطابعة الحرارية 80 مم / 58 مم.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Réimprimer un reçu",
          description: "Dans l'onglet 'Journal des Règlements', cliquez sur l'icône Imprimante à côté de la transaction.",
        },
        {
          number: 2,
          title: "Clôture de Caisse (Rapport Z)",
          description: "Cliquez sur le bouton 'Clôture de caisse (Rapport Z)' en haut à droite pour afficher le total encaissé par mode de règlement (Espèces, Carte) et imprimer la feuille de caisse de fin de poste.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Reprint Receipt",
          description: "In the 'Payments Log' tab, click the Printer icon next to any transaction.",
        },
        {
          number: 2,
          title: "Daily Z-Report Closing",
          description: "Click the 'Daily Closing (Z-Report)' button in the top right to view totals by payment method (Cash, Card) and print the end-of-shift report.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "إعادة طباعة وصل",
          description: "من تبويب 'سجل المدفوعات'، اضغط على أيقونة الطابعة بجانب أي عملية سابقة.",
        },
        {
          number: 2,
          title: "إغلاق الصندوق اليومي (تقرير Z)",
          description: "اضغط على زر 'إغلاق الصندوق (تقرير Z)' لعرض إجمالي المداخيل حسب طريقة الدفع وطباعة الحصيلة اليومية.",
        },
      ],
    },
  },

  // ─── 4. ADHÉRENTS & INSCRIPTION F2 ───
  {
    id: "onboard-wizard-f2",
    category: "MEMBERS",
    question: {
      fr: "Comment inscrire un nouvel adhérent en moins d'une minute avec le raccourci F2 ?",
      en: "How to register a new member in under a minute using the F2 shortcut?",
      ar: "كيف أقوم بتسجيل مشترك جديد في أقل من دقيقة باستخدام الزر F2؟",
    },
    summary: {
      fr: "L'assistant universel regroupe identité, webcam, abonnement, badge RFID et paiement en un seul flux fluide.",
      en: "The universal wizard bundles profile, webcam photo, plan, RFID badge, and payment into a single streamlined flow.",
      ar: "يجمع المساعد الشامل بين المعلومات الشخصية، صورة الويبكام، الباقة، البطاقة، والدفع في خطوة واحدة.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Appuyer sur la touche F2",
          description: "Depuis n'importe quel écran du logiciel, appuyez sur F2 (ou cliquez sur '+ Inscrire un adhérent').",
        },
        {
          number: 2,
          title: "Étape 1 : Infos & Photo",
          description: "Saisissez nom, prénom, téléphone et prenez la photo via la webcam en direct.",
        },
        {
          number: 3,
          title: "Étape 2 : Choix de la formule",
          description: "Sélectionnez le forfait souhaité (Mensuel, Pack 20 séances, etc.).",
        },
        {
          number: 4,
          title: "Étape 3 : Scan du badge & Encaissement",
          description: "Passez la carte sur le lecteur USB et validez le montant reçu. Le ticket de caisse s'imprime et l'adhérent peut entrer immédiatement !",
        },
      ],
      en: [
        {
          number: 1,
          title: "Press F2 Shortcut",
          description: "From any screen in the application, hit F2 (or click '+ Onboard Member').",
        },
        {
          number: 2,
          title: "Step 1: Info & Photo",
          description: "Enter name, phone, and snap a portrait with the live webcam.",
        },
        {
          number: 3,
          title: "Step 2: Choose Plan",
          description: "Select the desired formula (Monthly, 20 Sessions Pack, etc.).",
        },
        {
          number: 4,
          title: "Step 3: Scan Badge & Collect Payment",
          description: "Scan the RFID card on the reader and confirm payment. The thermal receipt prints and the member can enter immediately!",
        },
      ],
      ar: [
        {
          number: 1,
          title: "الضغط على زر F2",
          description: "من أي صفحة في البرنامج، اضغط F2 (أو اضغط على زر '+ تسجيل مشترك جديد').",
        },
        {
          number: 2,
          title: "الخطوة 1: البيانات والصورة",
          description: "أدخل الاسم، الهاتف، والتقط صورة المشترك مباشرة عبر كاميرا الويبكام.",
        },
        {
          number: 3,
          title: "الخطوة 2: اختيار الباقة",
          description: "حدد نوع الاشتراك المطلوب (شهري، باقة 20 حصة، إلخ).",
        },
        {
          number: 4,
          title: "الخطوة 3: تمرير البطاقة والدفع",
          description: "مرر بطاقة المشترك على القارئ وسجل المبلغ المدفوع. يُطبع الوصل فوراً ويفتح له الدخول مباشرة!",
        },
      ],
    },
    tip: {
      fr: "La touche F2 fonctionne partout dans l'application, même lorsque vous êtes sur une autre page.",
      en: "The F2 key works globally across the entire desktop app, even when viewing other screens.",
      ar: "يعمل اختصار F2 في جميع شاشات البرنامج لتسهيل العمل في أوقات الذروة.",
    },
    actionLink: {
      href: "/members",
      label: { fr: "Voir les Adhérents", en: "Go to Members", ar: "عرض المشتركين" },
    },
  },

  // ─── 5. SYSTÈME & SAUVEGARDE ───
  {
    id: "backup-database",
    category: "SYSTEM",
    question: {
      fr: "Comment faire une sauvegarde (backup) de la base de données ?",
      en: "How do I backup the gym database?",
      ar: "كيف أقوم بعمل نسخة احتياطية (Backup) لقاعدة البيانات؟",
    },
    summary: {
      fr: "Toutes vos données sont stockées localement en SQLite. Téléchargez une copie de secours en un clic.",
      en: "All gym data is stored locally in SQLite. Download a complete backup copy in one click.",
      ar: "جميع بياناتك محفوظة محلياً بتقنية SQLite. يمكنك تحميل نسخة احتياطية بنقرة واحدة.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Accéder aux Paramètres",
          description: "Allez dans Système > Paramètres (réservé aux Managers et Administrateurs).",
        },
        {
          number: 2,
          title: "Section 'Sauvegarde & Données'",
          description: "Cliquez sur 'Télécharger une sauvegarde'.",
        },
        {
          number: 3,
          title: "Conserver sur clé USB ou disque externe",
          description: "Le fichier .db contient l'intégralité des adhérents, abonnements, ventes et historiques de passages.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Open Settings",
          description: "Go to System > Settings (accessible to Managers and Admins).",
        },
        {
          number: 2,
          title: "Backup & Data Section",
          description: "Click 'Download Database Backup'.",
        },
        {
          number: 3,
          title: "Store on USB Key or External Drive",
          description: "The .db file safely contains all members, subscriptions, sales, and access histories.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "الدخول إلى الإعدادات",
          description: "توجه إلى النظام > الإعدادات (خاص بالمدير والمسؤول).",
        },
        {
          number: 2,
          title: "قسم 'النسخ الاحتياطي والبيانات'",
          description: "اضغط على زر 'تحميل نسخة احتياطية'.",
        },
        {
          number: 3,
          title: "الحفظ في فلاش ديسك خارجي",
          description: "يحتوي ملف .db على جميع المشتركين، الاشتراكات، المبيعات وسجل الدخول كاملاً.",
        },
      ],
    },
    actionLink: {
      href: "/settings",
      label: { fr: "Ouvrir les Paramètres", en: "Go to Settings", ar: "فتح الإعدادات" },
    },
  },
  {
    id: "roles-permissions",
    category: "SYSTEM",
    question: {
      fr: "Quels sont les différents rôles utilisateurs (Admin, Manager, Réceptionniste) ?",
      en: "What are the different user roles (Admin, Manager, Receptionist)?",
      ar: "ما هي صلاحيات المستخدمين المختلفة (مدير عام، مدير، موظف استقبال)؟",
    },
    summary: {
      fr: "La séparation des droits protège les finances, les tarifs et les paramètres système sensibles.",
      en: "Role separation protects sensitive financial metrics, pricing formulas, and system settings.",
      ar: "يحمي تقسيم الصلاحيات المالية، أسعار الاشتراكات، وإعدادات النظام الحساسة.",
    },
    steps: {
      fr: [
        {
          number: 1,
          title: "Administrateur (ADMIN)",
          description: "Accès illimité : gestion des comptes utilisateurs, tarifs, exports complets et configuration matérielle.",
        },
        {
          number: 2,
          title: "Manager (MANAGER)",
          description: "Exploitation complète : gestion des adhérents, renouvellements, ventes caisse, clôture journalière Z, sans droit de supprimer les comptes.",
        },
        {
          number: 3,
          title: "Réceptionniste (RECEPTIONIST)",
          description: "Accueil & Vente : inscriptions rapides, scans de badges, encaissements POS. Pas d'accès aux paramètres système.",
        },
      ],
      en: [
        {
          number: 1,
          title: "Administrator (ADMIN)",
          description: "Unlimited access: user accounts, pricing, full exports, and hardware configs.",
        },
        {
          number: 2,
          title: "Manager (MANAGER)",
          description: "Full daily operations: members, renewals, cash sales, Z-reports, cannot delete user accounts.",
        },
        {
          number: 3,
          title: "Receptionist (RECEPTIONIST)",
          description: "Front desk & POS: quick registrations, badge scans, sales. No access to system settings.",
        },
      ],
      ar: [
        {
          number: 1,
          title: "المسؤول العام (ADMIN)",
          description: "صلاحيات كاملة غير محدودة: إدارة حسابات الموظفين، الأسعار، التصدير، وإعدادات العتاد.",
        },
        {
          number: 2,
          title: "المدير (MANAGER)",
          description: "إدارة العمليات اليومية: المشتركون، التجديد، الصندوق وتقارير الإغلاق، بدون إمكانية حذف الموظفين.",
        },
        {
          number: 3,
          title: "موظف الاستقبال (RECEPTIONIST)",
          description: "مهام الاستقبال والبيع: تسجيل المشتركين، تمرير البطاقات، والبيع السريع دون الوصول للإعدادات.",
        },
      ],
    },
  },
];

export default function HelpPage() {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    "renew-subscription": true,
  });

  const categories = [
    { value: "ALL", label: { fr: "Tous les guides", en: "All Guides", ar: "جميع الأدلة" }, icon: Layers },
    { value: "SUBSCRIPTIONS", label: { fr: "Abonnements", en: "Subscriptions", ar: "الاشتراكات" }, icon: CalendarCheck },
    { value: "CARDS", label: { fr: "Badges & Accès", en: "Badges & Access", ar: "البطاقات والدخول" }, icon: ScanLine },
    { value: "POS", label: { fr: "Caisse & POS", en: "Register & POS", ar: "الصندوق والمبيعات" }, icon: ShoppingCart },
    { value: "MEMBERS", label: { fr: "Adhérents (F2)", en: "Members (F2)", ar: "المشتركون (F2)" }, icon: Users },
    { value: "SYSTEM", label: { fr: "Système & Backup", en: "System & Backup", ar: "النظام والنسخ" }, icon: ShieldCheck },
  ];

  const toggleAccordion = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    FAQ_DATA.forEach((item) => {
      allExpanded[item.id] = true;
    });
    setExpandedIds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const qLower = searchQuery.toLowerCase().trim();
      const questionText = item.question[language]?.toLowerCase() || "";
      const summaryText = item.summary[language]?.toLowerCase() || "";
      const stepsText = (item.steps[language] || [])
        .map((s) => `${s.title} ${s.description}`.toLowerCase())
        .join(" ");

      return (
        questionText.includes(qLower) ||
        summaryText.includes(qLower) ||
        stepsText.includes(qLower)
      );
    });
  }, [searchQuery, selectedCategory, language]);

  return (
    <div className="space-y-7 max-w-6xl mx-auto pb-12">
      {/* 1. Hero Header */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-7 sm:p-9 shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[12px] font-bold tracking-wide">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {language === "ar" ? "مركز المساعدة والأدلة الإرشادية" : "Centre d'Assistance & Documentation"}
            </span>
          </div>

          <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight text-white leading-tight">
            {language === "ar"
              ? "كيف يمكننا مساعدتك اليوم؟"
              : language === "en"
              ? "How can we help you today?"
              : "Comment pouvons-nous vous aider ?"}
          </h1>

          <p className="text-[14px] sm:text-[15px] text-slate-300 leading-relaxed">
            {language === "ar"
              ? "دليل شامل ومفصل خطوة بخطوة للإجابة على جميع الأسئلة الشائعة حول إدارة المشتركين، التجديد، الصندوق، وبطاقات الدخول."
              : language === "en"
              ? "Step-by-step practical guides answering everyday gym management questions: renewals, POS sales, and RFID turnstiles."
              : "Guides pratiques détaillés étape par étape pour gérer votre salle de sport en toute sérénité : renouvellements, caisse, badges et contrôle d'accès."}
          </p>

          {/* Search bar inside Hero */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === "ar"
                    ? "ابحث عن سؤال أو كلمة مفتاحية (مثال: تجديد، بطاقة ضائعة، صرافة، F2)..."
                    : language === "en"
                    ? "Search question or keyword (e.g. renew, lost card, cash, F2)..."
                    : "Rechercher une question (ex: renouveler, carte perdue, rendu monnaie, F2)..."
                }
                className="w-full pl-11 pr-10 rtl:pl-10 rtl:pr-11 py-3.5 bg-white/10 hover:bg-white/15 focus:bg-white focus:text-[#0F172A] border border-white/20 focus:border-[#2563EB] rounded-[16px] text-[14px] text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner backdrop-blur-md"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 rtl:left-auto rtl:right-4 top-4" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-3.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Category Filter Pills & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[20px] border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCategory === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setSelectedCategory(c.value)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-[12.5px] font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-[#2563EB] text-white shadow-sm shadow-blue-500/20"
                    : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-[#64748B]"}`} />
                <span>{c.label[language]}</span>
              </button>
            );
          })}
        </div>

        {/* Expand / Collapse All buttons */}
        <div className="flex items-center gap-2 shrink-0 px-1">
          <button
            onClick={expandAll}
            className="text-[11.5px] font-semibold text-[#64748B] hover:text-[#2563EB] hover:underline cursor-pointer"
          >
            {language === "ar" ? "توسيع الكل" : "Tout développer"}
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={collapseAll}
            className="text-[11.5px] font-semibold text-[#64748B] hover:text-[#2563EB] hover:underline cursor-pointer"
          >
            {language === "ar" ? "طي الكل" : "Tout réduire"}
          </button>
        </div>
      </div>

      {/* 3. Main Content: FAQ Accordions + Quick Reference Sidebox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Accordion List (8 cols) */}
        <div className="lg:col-span-8 space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white p-12 rounded-[22px] border border-[#E2E8F0] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#0F172A] text-[16px]">
                {language === "ar" ? "لا توجد نتائج مطابقة" : "Aucun guide trouvé"}
              </h3>
              <p className="text-[13px] text-[#64748B] max-w-sm mx-auto">
                {language === "ar"
                  ? "جرّب البحث بكلمات أخرى أو تصفح الأقسام من الأزرار أعلاه."
                  : "Essayez de modifier votre recherche ou sélectionnez une autre catégorie ci-dessus."}
              </p>
              <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(""); setSelectedCategory("ALL"); }}>
                {language === "ar" ? "إعادة تعيين البحث" : "Réinitialiser les filtres"}
              </Button>
            </div>
          ) : (
            filteredFaqs.map((item) => {
              const isExpanded = Boolean(expandedIds[item.id]);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-[20px] border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "border-[#BFDBFE] shadow-md shadow-blue-500/5 ring-1 ring-blue-100"
                      : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  {/* Question Clickable Header */}
                  <button
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full text-left rtl:text-right p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold transition-colors ${
                          isExpanded
                            ? "bg-[#2563EB] text-white"
                            : "bg-[#F1F5F9] text-[#64748B]"
                        }`}
                      >
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-[#0F172A] leading-snug">
                          {item.question[language]}
                        </h3>
                        <p className="text-[12.5px] text-[#64748B] mt-1 line-clamp-1">
                          {item.summary[language]}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 p-1 rounded-full bg-[#F8FAFC] text-[#64748B] mt-0.5">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#2563EB]" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-[#F1F5F9] animate-fadeIn">
                      {/* Numbered Steps */}
                      <div className="space-y-2.5 pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          {language === "ar" ? "الخطوات المتبعة :" : "Étapes pas à pas :"}
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {(item.steps[language] || []).map((step) => (
                            <div
                              key={step.number}
                              className="p-3 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0]/70 flex items-start gap-3"
                            >
                              <span className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] font-black text-[12px] flex items-center justify-center shrink-0 shadow-xs">
                                {step.number}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-[13px] font-bold text-[#0F172A]">
                                  {step.title}
                                </h4>
                                <p className="text-[12px] text-[#64748B] mt-0.5 leading-relaxed">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pro Tip Callout */}
                      {item.tip && (
                        <div className="p-3.5 rounded-[14px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                          <div className="text-[12px] text-[#1E40AF] leading-relaxed">
                            <span className="font-bold mr-1 rtl:mr-0 rtl:ml-1">
                              {language === "ar" ? "نصيحة عملية :" : "Astuce Pro :"}
                            </span>
                            {item.tip[language]}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      {item.actionLink && (
                        <div className="pt-1 flex items-center justify-end">
                          <Link href={item.actionLink.href}>
                            <Button
                              variant="secondary"
                              size="sm"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-[#2563EB]" />}
                            >
                              {item.actionLink.label[language]}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: Quick Reference Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Essential Keyboard Shortcuts */}
          <div className="bg-white rounded-[22px] border border-[#E2E8F0] p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                <Command className="w-4 h-4" />
              </div>
              <h3 className="text-[14px] font-bold text-[#0F172A]">
                {language === "ar" ? "اختصارات لوحة المفاتيح" : "Raccourcis Clavier Essentiels"}
              </h3>
            </div>

            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between p-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-[#475569] font-medium">
                  {language === "ar" ? "تسجيل مشترك جديد فوري" : "Inscription express 3-en-1"}
                </span>
                <kbd className="px-2 py-1 bg-white rounded-[6px] border border-[#CBD5E1] font-mono text-[11px] font-bold text-[#0F172A] shadow-2xs">
                  F2
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-[#475569] font-medium">
                  {language === "ar" ? "البحث الشامل في البرنامج" : "Recherche globale adhérent"}
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-1 bg-white rounded-[6px] border border-[#CBD5E1] font-mono text-[11px] font-bold text-[#0F172A] shadow-2xs">
                    /
                  </kbd>
                  <span className="text-slate-300">ou</span>
                  <kbd className="px-1.5 py-1 bg-white rounded-[6px] border border-[#CBD5E1] font-mono text-[11px] font-bold text-[#0F172A] shadow-2xs">
                    Ctrl+K
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-[#475569] font-medium">
                  {language === "ar" ? "تأكيد البيع / المسح" : "Validation encaissement"}
                </span>
                <kbd className="px-2 py-1 bg-white rounded-[6px] border border-[#CBD5E1] font-mono text-[11px] font-bold text-[#0F172A] shadow-2xs">
                  ↵ Entrée
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-[#475569] font-medium">
                  {language === "ar" ? "إغلاق النوافذ المنبثقة" : "Fermer fenêtre active"}
                </span>
                <kbd className="px-2 py-1 bg-white rounded-[6px] border border-[#CBD5E1] font-mono text-[11px] font-bold text-[#0F172A] shadow-2xs">
                  Échap
                </kbd>
              </div>
            </div>
          </div>

          {/* Card 2: Tourniquet & Hardware Diagnostic */}
          <div className="bg-white rounded-[22px] border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold">
                <ScanLine className="w-4 h-4" />
              </div>
              <h3 className="text-[14px] font-bold text-[#0F172A]">
                {language === "ar" ? "تشخيص القارئ والبوابة" : "Lecteur USB & Tourniquet"}
              </h3>
            </div>

            <p className="text-[12px] text-[#64748B] leading-relaxed">
              {language === "ar"
                ? "قارئ بطاقات RFID يعمل بنظام التوصيل الفوري (Plug & Play). إذا لم يستجب، تأكد من توصيل كابل USB بإحكام."
                : "Les lecteurs RFID USB fonctionnent sans configuration supplémentaire. Si le badge ne répond pas, vérifiez le branchement du câble USB."}
            </p>

            <Link href="/access" target="_blank" className="block pt-1">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center"
                leftIcon={<ScanLine className="w-3.5 h-3.5 text-[#2563EB]" />}
              >
                {language === "ar" ? "فتح شاشة الكشك والتحكم" : "Ouvrir la Borne Kiosk"}
              </Button>
            </Link>
          </div>

          {/* Card 3: Security & Offline-First Data */}
          <div className="p-4 rounded-[20px] bg-gradient-to-b from-[#F8FAFC] to-white border border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#0F172A]">
              <Lock className="w-4 h-4 text-[#2563EB]" />
              <span>{language === "ar" ? "بياناتك محمية ومحلية 100%" : "Données 100% Souveraines"}</span>
            </div>
            <p className="text-[11.5px] text-[#64748B] leading-relaxed">
              {language === "ar"
                ? "يعمل البرنامج بدون الحاجة إلى الإنترنت في وضع محلي كامل (Offline-First) لضمان استمرار الدخول والبيع في جميع الظروف."
                : "PassPro fonctionne en mode autonome sans dépendance au cloud. Votre salle reste 100% opérationnelle même sans connexion Internet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
