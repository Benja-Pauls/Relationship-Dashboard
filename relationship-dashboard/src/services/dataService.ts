import { MetricEntry, Note, MonthlyMetrics, WeeklyMetrics, PartnerFinances } from '../types/metrics';

const CSV_STORAGE_KEY = 'relationship_dashboard_data';
const NOTES_STORAGE_KEY = 'relationship_dashboard_notes';

export class DataService {
  // Get all metric entries from localStorage
  static getMetricEntries(): MetricEntry[] {
    const data = localStorage.getItem(CSV_STORAGE_KEY);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing metric entries:', error);
      return [];
    }
  }

  // Save metric entries to localStorage
  static saveMetricEntries(entries: MetricEntry[]): void {
    try {
      localStorage.setItem(CSV_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving metric entries:', error);
    }
  }

  // Get today's metric entry or create a new one
  static getTodaysEntry(): MetricEntry {
    const today = new Date().toISOString().split('T')[0];
    const entries = this.getMetricEntries();
    const todaysEntry = entries.find(entry => entry.date === today);
    
    if (todaysEntry) {
      return todaysEntry;
    }

    // Create new entry for today
    const newEntry: MetricEntry = {
      date: today,
      sexCount: 0,
      qualityTimeHours: 0,
      dishesDone: 0,
      trashFullHours: 0,
      kittyDuties: 0,
      notes: []
    };

    entries.push(newEntry);
    this.saveMetricEntries(entries);
    return newEntry;
  }

  // Update a specific metric for today
  static updateTodaysMetric(metric: keyof Pick<MetricEntry, 'sexCount' | 'qualityTimeHours' | 'dishesDone' | 'trashFullHours' | 'kittyDuties'>, increment: number): MetricEntry {
    const entries = this.getMetricEntries();
    const today = new Date().toISOString().split('T')[0];
    const entryIndex = entries.findIndex(entry => entry.date === today);
    
    if (entryIndex >= 0) {
      entries[entryIndex][metric] = Math.max(0, entries[entryIndex][metric] + increment);
    } else {
      const newEntry: MetricEntry = {
        date: today,
        sexCount: 0,
        qualityTimeHours: 0,
        dishesDone: 0,
        trashFullHours: 0,
        kittyDuties: 0,
        notes: []
      };
      newEntry[metric] = Math.max(0, increment);
      entries.push(newEntry);
    }

    this.saveMetricEntries(entries);
    return entries.find(entry => entry.date === today)!;
  }

  // Get monthly metrics for the current month
  static getCurrentMonthMetrics(): MonthlyMetrics {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const entries = this.getMetricEntries().filter(entry => entry.date.startsWith(currentMonth));
    
    const totalSexCount = entries.reduce((sum, entry) => sum + entry.sexCount, 0);
    const totalDishesDone = entries.reduce((sum, entry) => sum + entry.dishesDone, 0);
    const totalKittyDuties = entries.reduce((sum, entry) => sum + entry.kittyDuties, 0);
    const averageTrashFullHours = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + entry.trashFullHours, 0) / entries.length 
      : 0;
    
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dishesAdherencePercent = entries.length > 0 
      ? (entries.filter(entry => entry.dishesDone > 0).length / Math.min(daysInMonth, now.getDate())) * 100
      : 0;

    return {
      month: currentMonth,
      totalSexCount,
      totalDishesDone,
      averageTrashFullHours,
      totalKittyDuties,
      averageBalance: 0, // Will be updated by Plaid service
      dishesAdherencePercent
    };
  }

  // Get entries for the last N months for trending
  static getLastNMonthsEntries(months: number): MetricEntry[] {
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const cutoffString = cutoffDate.toISOString().split('T')[0];
    
    return this.getMetricEntries().filter(entry => entry.date >= cutoffString);
  }

  // Notes management
  static getNotes(): Note[] {
    const data = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing notes:', error);
      return [];
    }
  }

  static saveNotes(notes: Note[]): void {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }

  static addNote(content: string, author: 'partner1' | 'partner2'): Note {
    const notes = this.getNotes();
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      author,
      timestamp: new Date().toISOString(),
      isRead: false,
      isFavorite: false
    };
    notes.push(newNote);
    this.saveNotes(notes);
    return newNote;
  }

  static updateNote(noteId: string, updates: Partial<Note>): void {
    const notes = this.getNotes();
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex >= 0) {
      notes[noteIndex] = { ...notes[noteIndex], ...updates };
      this.saveNotes(notes);
    }
  }

  static deleteNote(noteId: string): void {
    const notes = this.getNotes().filter(note => note.id !== noteId);
    this.saveNotes(notes);
  }

  // Get current week's metrics (Sunday to Saturday)
  static getCurrentWeekMetrics(): WeeklyMetrics {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromSunday = dayOfWeek;
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromSunday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekStartString = weekStart.toISOString().split('T')[0];
    
    // Get all entries for this week
    const entries = this.getMetricEntries();
    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= now;
    });
    
    // Calculate totals for the week
    const sexCount = weekEntries.reduce((sum, entry) => sum + entry.sexCount, 0);
    const qualityTimeHours = weekEntries.reduce((sum, entry) => sum + entry.qualityTimeHours, 0);
    const dishesDone = weekEntries.reduce((sum, entry) => sum + entry.dishesDone, 0);
    const trashTargetHours = weekEntries.reduce((sum, entry) => sum + entry.trashFullHours, 0);
    const kittyDuties = weekEntries.reduce((sum, entry) => sum + entry.kittyDuties, 0);
    
    // Get partner finance changes (mock data for now)
    const partner1FinanceChange = (Math.random() - 0.5) * 500;
    const partner2FinanceChange = (Math.random() - 0.5) * 500;
    
    return {
      weekStart: weekStartString,
      sexCount,
      qualityTimeHours,
      dishesDone,
      trashTargetHours,
      kittyDuties,
      partner1FinanceChange: Math.round(partner1FinanceChange * 100) / 100,
      partner2FinanceChange: Math.round(partner2FinanceChange * 100) / 100
    };
  }

  // Get three-way finance data (Sydney, Ben, Investments) from Plaid
  static async getPartnerFinances(): Promise<PartnerFinances> {
    try {
      const { PlaidService } = await import('./plaidService');
      const result = await PlaidService.getFinanceData();
      console.log('DataService: Got finance data from PlaidService:', result);
      return result;
          } catch (error) {
        console.error('ERROR: Failed to fetch real finance data:', error);
        console.error('Full error details:', error);
        // Show error state instead of fake data
        throw new Error(`Finance data unavailable: ${error instanceof Error ? error.message : String(error)}`);
      }
  }

  // Initialize with sample data if no data exists
  static initializeSampleData(): void {
    const existingEntries = this.getMetricEntries();
    if (existingEntries.length === 0) {
      const sampleEntries: MetricEntry[] = [];
      const today = new Date();
      
      // Create sample data for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        sampleEntries.push({
          date: dateString,
          sexCount: Math.floor(Math.random() * 3),
          qualityTimeHours: Math.floor(Math.random() * 5) + 1,
          dishesDone: Math.random() > 0.3 ? 1 : 0,
          trashFullHours: Math.floor(Math.random() * 2), // 0-1 times taking out trash per day
          kittyDuties: Math.random() > 0.2 ? 1 : 0,
          notes: []
        });
      }
      
      this.saveMetricEntries(sampleEntries);
    }

    // Add sample notes if none exist
    const existingNotes = this.getNotes();
    if (existingNotes.length === 0) {
      const sampleNotes: Note[] = [
        {
          id: '1',
          content: 'Great job on keeping up with the dishes this week!',
          author: 'partner1',
          timestamp: new Date().toISOString(),
          isRead: false,
          isFavorite: false
        },
        {
          id: '2',
          content: 'Thanks for taking out the trash regularly this week!',
          author: 'partner2',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          isFavorite: true
        }
      ];
      this.saveNotes(sampleNotes);
    }
  }
} 