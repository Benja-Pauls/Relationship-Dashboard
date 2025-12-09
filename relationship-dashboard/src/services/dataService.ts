import { MetricEntry, Note, WeeklyMetrics, PartnerFinances } from '../types/metrics';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export class DataService {
  // Metrics management
  static async getTodaysEntry(): Promise<MetricEntry> {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/today`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching today\'s metrics:', error);
      // Return default entry if backend is unavailable
      return {
        date: new Date().toISOString().split('T')[0],
        sexCount: 0,
        qualityTimeHours: 0,
        dishesDone: 0,
        trashFullHours: 0,
        kittyDuties: 0,
        notes: []
      };
    }
  }

  static async getCurrentWeekMetrics(): Promise<WeeklyMetrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/week`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        weekStart: data.weekStart,
        sexCount: data.sexCount || 0,
        qualityTimeHours: data.qualityTimeHours || 0,
        dishesDone: data.dishesDone || 0,
        trashTargetHours: data.trashTargetHours || 0,
        kittyDuties: data.kittyDuties || 0,
        partner1FinanceChange: 0,
        partner2FinanceChange: 0
      };
    } catch (error) {
      console.error('Error fetching weekly metrics:', error);
      return {
        weekStart: new Date().toISOString().split('T')[0],
        sexCount: 0,
        qualityTimeHours: 0,
        dishesDone: 0,
        trashTargetHours: 0,
        kittyDuties: 0,
        partner1FinanceChange: 0,
        partner2FinanceChange: 0
      };
    }
  }

  static async updateTodaysMetric(metric: keyof Pick<MetricEntry, 'sexCount' | 'qualityTimeHours' | 'dishesDone' | 'trashFullHours' | 'kittyDuties'>, increment: number): Promise<MetricEntry> {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metric, increment }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedEntry = await response.json();
      return {
        ...updatedEntry,
        notes: [] // Notes are handled separately
      };
    } catch (error) {
      console.error('Error updating metric:', error);
      throw error;
    }
  }

  static async getResetTimers(): Promise<{ daily_reset_in_seconds: number; weekly_reset_in_seconds: number; daily_reset_time: string; weekly_reset_time: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reset_timers`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching reset timers:', error);
      return {
        daily_reset_in_seconds: 0,
        weekly_reset_in_seconds: 0,
        daily_reset_time: '',
        weekly_reset_time: ''
      };
    }
  }

  // Messages management
  static async getNotes(): Promise<Note[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  static async addNote(content: string, author: 'partner1' | 'partner2'): Promise<Note> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, author }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  static async updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  static async deleteNote(noteId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Analytics data
  static async getAnalyticsHistory(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/history`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics history:', error);
      return { weekly_history: [] };
    }
  }

  // Finance data (delegated to PlaidService)
  static async getPartnerFinances(): Promise<PartnerFinances> {
    try {
      const { PlaidService } = await import('./plaidService');
      const result = await PlaidService.getFinanceData();
      console.log('DataService: Got finance data from PlaidService:', result);
      return result;
    } catch (error) {
      console.error('ERROR: Failed to fetch real finance data:', error);
      console.error('Full error details:', error);
      throw new Error(`Finance data unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Legacy methods for backward compatibility (no longer needed but kept to avoid breaking changes)
  static initializeSampleData(): void {
    // No longer needed - backend handles initialization
    console.log('Data initialization handled by backend');
  }

  static getMetricEntries(): MetricEntry[] {
    // Deprecated - use backend APIs instead
    console.warn('getMetricEntries is deprecated - use backend APIs');
    return [];
  }

  static saveMetricEntries(entries: MetricEntry[]): void {
    // Deprecated - use backend APIs instead
    console.warn('saveMetricEntries is deprecated - use backend APIs');
  }

  static getLastNMonthsEntries(months: number): MetricEntry[] {
    // This should be replaced with analytics history API call
    console.warn('getLastNMonthsEntries is deprecated - use getAnalyticsHistory');
    return [];
  }

  static getCurrentMonthMetrics(): any {
    // This should be replaced with analytics API
    console.warn('getCurrentMonthMetrics is deprecated - use analytics APIs');
    return {
      month: new Date().toISOString().slice(0, 7),
      totalSexCount: 0,
      totalDishesDone: 0,
      averageTrashFullHours: 0,
      totalKittyDuties: 0,
      averageBalance: 0,
      dishesAdherencePercent: 0
    };
  }

  static saveNotes(notes: Note[]): void {
    // Deprecated - use backend APIs instead
    console.warn('saveNotes is deprecated - use backend message APIs');
  }

  // Spending tracking
  static async getSpendingTransactions(month?: string): Promise<any[]> {
    try {
      const url = month ? `${API_BASE_URL}/spending/transactions?month=${month}` : `${API_BASE_URL}/spending/transactions`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Error fetching spending transactions:', error);
      return [];
    }
  }

  static async createSpendingTransaction(transaction: {
    amount: number;
    tag: string;
    person: string;
    date?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/spending/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating spending transaction:', error);
      throw error;
    }
  }

  static async updateSpendingTransaction(transactionId: string, updates: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/spending/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating spending transaction:', error);
      throw error;
    }
  }

  static async deleteSpendingTransaction(transactionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/spending/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting spending transaction:', error);
      throw error;
    }
  }

  static async getSpendingStats(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/spending/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching spending stats:', error);
      return { monthly_stats: {} };
    }
  }
} 