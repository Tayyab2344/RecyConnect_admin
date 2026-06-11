export type ApiRecord = Record<string, unknown>;

export type DashboardStats = {
  users?: number;
  items?: number;
  transactions?: number;
  revenue?: number;
  activeCollectors?: number;
  totalProcessedKg?: number;
  roles?: Record<string, number>;
  payments?: Record<string, { count?: number; amount?: number }>;
  orders?: { total?: number; completed?: number; cancelled?: number };
  alerts?: { openDisputes?: number; suspendedUsers?: number; cancelledOrders?: number };
  analytics?: {
    day?: { buyValue?: number; sellValue?: number; volume?: number };
    week?: { buyValue?: number; sellValue?: number; volume?: number };
    month?: { buyValue?: number; sellValue?: number; volume?: number };
    year?: { buyValue?: number; sellValue?: number; volume?: number };
  };
};

export type RateItem = {
  id: number;
  category: string;
  pricePerUnit: number;
  unit: string;
  updatedAt: string;
};

export type AdminData = {
  dashboard?: DashboardStats;
  users: ApiRecord[];
  orders: ApiRecord[];
  payments: ApiRecord[];
  listings: ApiRecord[];
  rates: RateItem[];
  logs: ApiRecord[];
  complaints: ApiRecord[];
};

export const emptyData: AdminData = {
  users: [],
  orders: [],
  payments: [],
  listings: [],
  rates: [],
  logs: [],
  complaints: [],
};

export type Section = "dashboard" | "users" | "orders" | "payments" | "marketplace" | "logs" | "rates" | "complaints" | "observability" | "security";

export const navItems: { label: string; section: Section; icon: string }[] = [
  { label: "Dashboard", section: "dashboard", icon: "📊" },
  { label: "Users", section: "users", icon: "👥" },
  { label: "Orders", section: "orders", icon: "📦" },
  { label: "Payments", section: "payments", icon: "💳" },
  { label: "Marketplace", section: "marketplace", icon: "🏪" },
  { label: "Rate List", section: "rates", icon: "💰" },
  { label: "Complaints", section: "complaints", icon: "⚠️" },
  { label: "Security & Sessions", section: "security", icon: "🛡️" },
  { label: "Logs", section: "logs", icon: "📋" },
  { label: "AI Observability", section: "observability", icon: "🤖" },
];
