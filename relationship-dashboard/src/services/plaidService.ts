import { PartnerFinances } from '../types/metrics';

const API_BASE_URL = 'http://localhost:8000/api';

export class PlaidService {
  private static linkToken: string | null = null;
  private static accessToken: string | null = null;

  // Create a link token for Plaid Link
  static async createLinkToken(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/create_link_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.linkToken = data.link_token;
      return data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw error;
    }
  }

  // Exchange public token for access token
  static async exchangePublicToken(publicToken: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/exchange_public_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      return data.access_token;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw error;
    }
  }

  // Get all linked accounts
  static async getAccounts(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  // Categorize an account as belonging to Sydney, Ben, or Investments
  static async categorizeAccount(accountId: string, owner: 'sydney' | 'ben' | 'investments'): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorize_account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account_id: accountId, owner }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error categorizing account:', error);
      throw error;
    }
  }

  // Get finance data for the dashboard
  static async getFinanceData(): Promise<PartnerFinances> {
    console.log('PlaidService: Starting API call to:', `${API_BASE_URL}/balances`);
    try {
      const response = await fetch(`${API_BASE_URL}/balances`);
      console.log('PlaidService: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PlaidService: HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('PlaidService: Received finance data:', data);

      // Backend now returns aggregated data in the format: { sydney: {balance, weeklyChange}, ben: {...}, investments: {...} }
      const result = {
        sydneyBalance: data.sydney?.balance || 0,
        benBalance: data.ben?.balance || 0,
        investmentsBalance: data.investments?.balance || 0,
        sydneyWeeklyChange: data.sydney?.weeklyChange || 0,
        benWeeklyChange: data.ben?.weeklyChange || 0,
        investmentsWeeklyChange: data.investments?.weeklyChange || 0
      };
      console.log('PlaidService: Returning finance data:', result);
      return result;
    } catch (error) {
      console.error('Error fetching finance data from backend:', error);
      // Throw error so the dataService can handle it properly
      throw error;
    }
  }

  // Check if backend is healthy and Plaid is configured
  static async checkHealth(): Promise<{ status: string; plaid_configured: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      return { status: 'error', plaid_configured: false };
    }
  }

  // Initialize Plaid Link (setup method for the dashboard)
  static async initializePlaidLink(): Promise<void> {
    try {
      const health = await this.checkHealth();
      if (health.plaid_configured) {
        console.log('Plaid backend is configured and ready');
      } else {
        console.warn('Plaid backend is not properly configured');
      }
    } catch (error) {
      console.error('Error initializing Plaid link:', error);
    }
  }

  // Open Plaid Link to connect a bank account
  static async openPlaidLink(): Promise<void> {
    try {
      const linkToken = await this.createLinkToken();
      
      // Create Plaid Link handler
      const handler = (window as any).Plaid.create({
        token: linkToken,
        onSuccess: async (public_token: string, metadata: any) => {
          console.log('Plaid Link success:', { public_token, metadata });
          try {
            const accessToken = await this.exchangePublicToken(public_token);
            console.log('Access token received:', accessToken);
            
            // Auto-categorize accounts (you can customize this logic)
            const accounts = await this.getAccounts();
            for (const account of accounts) {
              if (account.owner === 'uncategorized') {
                // Simple auto-categorization - you can modify this
                let owner: 'ben' | 'sydney' | 'investments' = 'ben';
                if (account.type === 'credit') owner = 'sydney';
                if (account.subtype?.includes('investment')) owner = 'investments';
                
                await this.categorizeAccount(account.account_id, owner);
              }
            }
            
            alert('Bank account connected successfully! Refresh the page to see your real data.');
            window.location.reload();
          } catch (error) {
            console.error('Error exchanging token:', error);
            alert('Error connecting account. Please try again.');
          }
        },
        onExit: (err: any, metadata: any) => {
          console.log('Plaid Link exited:', { err, metadata });
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('Plaid Link event:', { eventName, metadata });
        },
      });

      handler.open();
    } catch (error) {
      console.error('Error opening Plaid Link:', error);
      alert('Error opening bank connection. Please try again.');
    }
  }

  // Legacy methods for backward compatibility
  static getAccessToken(): string | null {
    return this.accessToken;
  }

  static removeAccessToken(): void {
    this.accessToken = null;
  }

  static async getAccountBalances(): Promise<any[]> {
    return this.getAccounts();
  }

  static async getTransactions(): Promise<any[]> {
    // This would call a transactions endpoint if needed
    return [];
  }

  static calculateWeeklyChange(): number {
    // This is now handled by the backend
    return 0;
  }

  static getMockPlaidData(): any {
    // Not needed anymore, but kept for compatibility
    return null;
  }

  static getTotalBalance(): number {
    // This would need to be calculated from getFinanceData()
    return 0;
  }

  static isConfigured(): boolean {
    return Boolean(this.accessToken);
  }

  static async linkAccount(): Promise<void> {
    // This would integrate with Plaid Link frontend component
    const linkToken = await this.createLinkToken();
    console.log('Use this link token with Plaid Link:', linkToken);
  }
} 