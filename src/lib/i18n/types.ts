export type Language = "fr" | "en" | "ar";
export type Direction = "ltr" | "rtl";

export interface LanguageInfo {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: Direction;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "fr",
    label: "Français",
    nativeLabel: "Français",
    flag: "FR",
    dir: "ltr",
  },
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    flag: "EN",
    dir: "ltr",
  },
  {
    code: "ar",
    label: "Arabe",
    nativeLabel: "العربية",
    flag: "AR",
    dir: "rtl",
  },
];

export interface TranslationSchema {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    search: string;
    confirm: string;
    close: string;
    back: string;
    refresh: string;
    loading: string;
    all: string;
    active: string;
    inactive: string;
    yes: string;
    no: string;
    actions: string;
    details: string;
    status: string;
    online: string;
    offline: string;
    error: string;
    success: string;
  };
  nav: {
    exploitation: string;
    dashboard: string;
    kiosk: string;
    accessLogs: string;
    management: string;
    members: string;
    subscriptions: string;
    plans: string;
    cards: string;
    finances: string;
    payments: string;
    system: string;
    settings: string;
    notifications: string;
    markAllRead: string;
    deleteAll: string;
    noNotifications: string;
    profile: string;
    help: string;
    logout: string;
    searchPlaceholder: string;
  };
  breadcrumbs: {
    dashboard: string;
    members: string;
    memberDetail: string;
    subscriptions: string;
    plans: string;
    cards: string;
    payments: string;
    accessLogs: string;
    help: string;
    settings: string;
  };
  titleBar: {
    appTitle: string;
    subtitle: string;
    onlineLan: string;
    minimize: string;
    maximize: string;
    restore: string;
    closeApp: string;
  };
  kiosk: {
    topBarTitle: string;
    online: string;
    badgeReaderReady: string;
    presentBadge: string;
    accessControlTerminal: string;
    onPremiseReady: string;
    minimizeTooltip: string;
    maximizeTooltip: string;
    closeTooltip: string;
    scanGranted: string;
    scanDenied: string;
    scanWarning: string;
    reasons: {
      OK: string;
      CARD_NOT_FOUND: string;
      CARD_BLOCKED: string;
      CARD_UNASSIGNED: string;
      NO_ACTIVE_SUBSCRIPTION: string;
      SUBSCRIPTION_EXPIRED: string;
      SUBSCRIPTION_SUSPENDED: string;
      SESSIONS_EXHAUSTED: string;
      OUTSIDE_TIME_WINDOW: string;
      ANTI_PASSBACK: string;
    };
    memberDetails: {
      plan: string;
      validUntil: string;
      daysRemaining: string;
      sessionsRemaining: string;
      unlimited: string;
      debtAlert: string;
      daysLeftSingular: string;
      daysLeftPlural: string;
      expiresToday: string;
    };
  };
  dashboard: {
    title: string;
    subtitle: string;
    currentPresence: string;
    todayEntries: string;
    todayEntriesContext: string;
    activeSubs: string;
    activeSubsContext: string;
    todayRevenue: string;
    todayRevenueContext: string;
    monthRevenue: string;
    monthRevenueContext: string;
    expiringSoon: string;
    expiringSoonContext: string;
    expired: string;
    expiredContext: string;
    quickActions: string;
    newMember: string;
    newSubscription: string;
    recentActivity: string;
    recentActivitySubtitle: string;
    viewAllLogs: string;
    hourlyHeatmap: string;
    hourlyHeatmapSubtitle: string;
    subscriptionBreakdown: string;
    subscriptionBreakdownSubtitle: string;
    noRecentActivity: string;
    unassignedBadge: string;
    loadingMap: string;
  };
  settings: {
    title: string;
    subtitle: string;
    general: string;
    generalSubtitle: string;
    gymName: string;
    kioskName: string;
    language: string;
    languageHelp: string;
    selectLanguage: string;
    save: string;
    saving: string;
    saveSuccess: string;
  };
  members: {
    title: string;
    subtitle: string;
    newMember: string;
    exportCsv: string;
    searchPlaceholder: string;
    filters: {
      all: string;
      active: string;
      expiring_soon: string;
      expired: string;
      inactive: string;
      debt: string;
      blocked: string;
    };
    table: {
      member: string;
      contact: string;
      card: string;
      planValidity: string;
      status: string;
      balance: string;
      actions: string;
    };
    emptyTitle: string;
    emptyDesc: string;
    loading: string;
  };
  subscriptions: {
    title: string;
    subtitle: string;
    newSubscription: string;
    filters: {
      all: string;
      active: string;
      expiring: string;
      expired: string;
      suspended: string;
      debt: string;
    };
    table: {
      member: string;
      planPrice: string;
      period: string;
      sessions: string;
      balanceDue: string;
      status: string;
      actions: string;
    };
    actions: {
      reactivate: string;
      suspend: string;
      whatsapp: string;
      manage: string;
    };
    emptyTitle: string;
    emptyDesc: string;
    loading: string;
  };
  cards: {
    title: string;
    subtitle: string;
    scanCard: string;
    kpiActive: string;
    kpiBlocked: string;
    kpiUnassigned: string;
    searchPlaceholder: string;
    filters: {
      all: string;
      active: string;
      blocked: string;
    };
    table: {
      uid: string;
      member: string;
      plan: string;
      status: string;
      assignedAt: string;
      actions: string;
    };
    actions: {
      block: string;
      unblock: string;
      delete: string;
      viewMember: string;
    };
    emptyTitle: string;
    emptyDesc: string;
    loading: string;
  };
  payments: {
    title: string;
    subtitle: string;
    newPayment: string;
    exportCsv: string;
    closeZReport: string;
    kpiTotal: string;
    kpiCash: string;
    kpiCard: string;
    periods: {
      today: string;
      week: string;
      month: string;
      all: string;
    };
    table: {
      receiptNumber: string;
      dateTime: string;
      member: string;
      plan: string;
      method: string;
      amount: string;
      operator: string;
      actions: string;
    };
    actions: {
      reprint: string;
    };
    methods: {
      CASH: string;
      CARD: string;
      OTHER: string;
    };
    emptyTitle: string;
    emptyDesc: string;
    loading: string;
  };
  plans: {
    title: string;
    subtitle: string;
    createPlan: string;
    activeOffers: string;
    archivedOffers: string;
    sessionsCount: string;
    daysCount: string;
    unlimitedAccess: string;
    statusActive: string;
    statusHidden: string;
    actions: {
      edit: string;
      deactivate: string;
      activate: string;
      delete: string;
    };
    emptyTitle: string;
    emptyDesc: string;
    loading: string;
  };
  accessLogs: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allPassages: string;
    granted: string;
    denied: string;
    table: {
      dateTime: string;
      member: string;
      badgeUid: string;
      kiosk: string;
      source: string;
      reasonStatus: string;
      decision: string;
    };
    emptyTitle: string;
    emptyDesc: string;
    loading: string;
  };
  notificationsPage: {
    title: string;
    subtitle: string;
    markAllRead: string;
    filterUnread: string;
    emptyTitle: string;
    emptyDesc: string;
    loading: string;
  };
  login: {
    title: string;
    subtitle: string;
    username: string;
    password: string;
    loginButton: string;
    loggingIn: string;
    rememberMe: string;
    demoAccounts: string;
  };
  pos: {
    title: string;
    subtitle: string;
    tabs: {
      pos: string;
      journal: string;
      products: string;
    };
    categories: {
      all: string;
      drinks: string;
      proteins: string;
      supplements: string;
      accessories: string;
      other: string;
    };
    searchPlaceholder: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
    cartTitle: string;
    emptyCart: string;
    emptyCartHint: string;
    walkInCustomer: string;
    selectMember: string;
    searchMember: string;
    total: string;
    itemsCount: string;
    quickCash: string;
    exact: string;
    changeDue: string;
    received: string;
    checkout: string;
    checkoutSuccess: string;
    newProduct: string;
    editProduct: string;
    productName: string;
    category: string;
    price: string;
    costPrice: string;
    stock: string;
    stockAlert: string;
    barcode: string;
    icon: string;
    saveProduct: string;
    addStock: string;
    stockCount: string;
  };
}
