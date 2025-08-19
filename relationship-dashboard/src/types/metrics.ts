export interface MetricEntry {
  date: string; // ISO date string
  sexCount: number;
  qualityTimeHours: number;
  dishesDone: number;
  trashFullHours: number;
  kittyDuties: number;
  financesBalance?: number; // Optional, comes from Plaid
  partnerFinances?: PartnerFinances; // Split finances data
  notes: Note[];
}

export interface PartnerFinances {
  partner1Balance: number; // Orange partner
  partner2Balance: number; // Purple partner
  partner1Change: number;  // Weekly change
  partner2Change: number;  // Weekly change
}

export interface Note {
  id: string;
  content: string;
  author: 'partner1' | 'partner2';
  timestamp: string; // ISO date string
  isRead: boolean;
  isFavorite: boolean;
}

export interface MonthlyMetrics {
  month: string; // YYYY-MM format
  totalSexCount: number;
  totalDishesDone: number;
  averageTrashFullHours: number;
  totalKittyDuties: number;
  averageBalance: number;
  dishesAdherencePercent: number; // percentage of days dishes were done
}

export interface WeeklyMetrics {
  weekStart: string; // ISO date string for Sunday
  sexCount: number;
  qualityTimeHours: number;
  dishesDone: number;
  trashTargetHours: number; // Target to stay under
  kittyDuties: number;
  partner1FinanceChange: number;
  partner2FinanceChange: number;
}

export interface MetricConfig {
  key: keyof Pick<MetricEntry, 'sexCount' | 'qualityTimeHours' | 'dishesDone' | 'trashFullHours' | 'kittyDuties'>;
  friendlyLabel: string;
  muiIcon: string; // MUI icon name
  neonColor: string; // Neon glow color
  gradientFrom: string;
  gradientTo: string;
  unit?: string;
  goalType: 'higher' | 'lower'; // whether higher or lower values are better
  weeklyGoal: number; // Weekly target
  resetDay: 'sunday' | 'monday'; // When the week resets
}

export const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'sexCount',
    friendlyLabel: 'Love Sparks',
    muiIcon: 'Favorite',
    neonColor: '#ff1744', // Neon pink/red
    gradientFrom: '#ff1744',
    gradientTo: '#f50057',
    goalType: 'higher',
    weeklyGoal: 2,
    resetDay: 'sunday'
  },
  {
    key: 'qualityTimeHours',
    friendlyLabel: 'Quality Time',
    muiIcon: 'Schedule',
    neonColor: '#e91e63', // Neon pink
    gradientFrom: '#e91e63',
    gradientTo: '#ad1457',
    unit: 'h',
    goalType: 'higher',
    weeklyGoal: 10,
    resetDay: 'sunday'
  },
  {
    key: 'dishesDone',
    friendlyLabel: 'Dish Duty',
    muiIcon: 'LocalDining',
    neonColor: '#00e5ff', // Neon cyan
    gradientFrom: '#00e5ff',
    gradientTo: '#0091ea',
    goalType: 'higher',
    weeklyGoal: 6, // 6 days out of 7
    resetDay: 'sunday'
  },
  {
    key: 'trashFullHours',
    friendlyLabel: 'Trash Patrol',
    muiIcon: 'Delete',
    neonColor: '#00e676', // Neon green
    gradientFrom: '#00e676',
    gradientTo: '#00c853',
    unit: 'h',
    goalType: 'lower',
    weeklyGoal: 12, // Target to stay under 12 hours total per week
    resetDay: 'sunday'
  },
  {
    key: 'kittyDuties',
    friendlyLabel: 'Kitty Care',
    muiIcon: 'Pets',
    neonColor: '#e040fb', // Neon purple
    gradientFrom: '#e040fb',
    gradientTo: '#d500f9',
    goalType: 'higher',
    weeklyGoal: 7, // Every day
    resetDay: 'sunday'
  }
];

export interface PlaidData {
  accounts: PlaidAccount[];
  lastUpdated: string;
}

export interface PlaidAccount {
  account_id: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    iso_currency_code: string | null;
  };
  name: string;
  type: string;
  subtype: string | null;
  owner?: 'partner1' | 'partner2'; // For splitting accounts
}

// Partner color configuration - Updated for dark theme
export const PARTNER_COLORS = {
  partner1: {
    name: 'Ben', // You can customize this
    primary: '#ff9100', // Bright orange for dark theme
    neon: '#ff9100',
    gradient: 'from-orange-400 to-orange-500',
    light: 'orange-900/20',
    text: 'orange-300',
    glow: '0 0 20px rgba(255, 145, 0, 0.5)'
  },
  partner2: {
    name: 'My Love', // You can customize this  
    primary: '#e040fb', // Bright purple for dark theme
    neon: '#e040fb',
    gradient: 'from-purple-400 to-purple-500',
    light: 'purple-900/20',
    text: 'purple-300',
    glow: '0 0 20px rgba(224, 64, 251, 0.5)'
  }
};

// Dark theme color palette
export const DARK_THEME = {
  background: {
    primary: '#0a0a0a', // Pure dark
    secondary: '#1a1a1a', // Card background
    tertiary: '#2a2a2a', // Elevated elements
  },
  text: {
    primary: '#ffffff',
    secondary: '#b0b0b0',
    muted: '#666666',
  },
  neon: {
    pink: '#ff1744',
    cyan: '#00e5ff', 
    green: '#00e676',
    purple: '#e040fb',
    orange: '#ff9100',
    yellow: '#ffea00',
  },
  glow: {
    subtle: '0 0 10px rgba(255, 255, 255, 0.1)',
    medium: '0 0 20px rgba(255, 255, 255, 0.2)',
    strong: '0 0 30px rgba(255, 255, 255, 0.3)',
  }
}; 