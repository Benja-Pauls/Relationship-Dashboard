import { PlaidData } from '../types/metrics';

// Note: This is a placeholder service. In a real implementation, you would:
// 1. Set up Plaid API credentials in environment variables
// 2. Implement proper OAuth flow for account linking
// 3. Handle token management and refresh
// 4. Implement proper error handling and retry logic

export class PlaidService {
  private static readonly PLAID_ENV = process.env.REACT_APP_PLAID_ENV || 'sandbox';
  private static readonly CLIENT_ID = process.env.REACT_APP_PLAID_CLIENT_ID;
  private static readonly SECRET = process.env.REACT_APP_PLAID_SECRET;
  private static readonly ACCESS_TOKEN_KEY = 'plaid_access_token';

  // Initialize Plaid Link - would use the real Plaid Link SDK
  static async initializePlaidLink(): Promise<void> {
    // In a real implementation, this would:
    // 1. Load the Plaid Link SDK
    // 2. Create a link_token from your backend
    // 3. Initialize the Plaid Link flow
    // 4. Handle the onSuccess callback to exchange public_token for access_token
    
    console.log('Plaid Link would be initialized here');
    
    // For demo purposes, we'll simulate having an access token
    if (!this.getAccessToken()) {
      // Simulate a successful link
      localStorage.setItem(this.ACCESS_TOKEN_KEY, 'demo_access_token');
    }
  }

  // Get stored access token
  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Remove access token (for unlinking accounts)
  static removeAccessToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }

  // Fetch account balances
  static async getAccountBalances(): Promise<PlaidData> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No Plaid access token found. Please link your accounts first.');
    }

    try {
      // In a real implementation, this would make an API call to your backend
      // which would then call Plaid's /accounts/balance/get endpoint
      
      // For demo purposes, return mock data
      return this.getMockPlaidData();
      
      // Real implementation would look like:
      // const response = await fetch('/api/plaid/accounts/balance', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ access_token: accessToken })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to fetch account balances');
      // }
      // 
      // return response.json();
      
    } catch (error) {
      console.error('Error fetching Plaid data:', error);
      throw error;
    }
  }

  // Get transaction history for calculating weekly changes
  static async getTransactions(startDate: Date, endDate: Date): Promise<any[]> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No Plaid access token found.');
    }

    try {
      // In a real implementation, this would call Plaid's /transactions/get endpoint
      // For demo, return empty array
      return [];
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // Calculate weekly change in balances
  static async calculateWeeklyChange(): Promise<number> {
    try {
      // In a real implementation, this would:
      // 1. Get current balances
      // 2. Get balances from 7 days ago (either from stored data or transactions)
      // 3. Calculate the difference
      
      // For demo, return a random change
      const randomChange = (Math.random() - 0.5) * 1000; // Random change between -500 and +500
      return Math.round(randomChange * 100) / 100; // Round to 2 decimal places
      
    } catch (error) {
      console.error('Error calculating weekly change:', error);
      return 0;
    }
  }

  // Mock data for demonstration
  private static getMockPlaidData(): PlaidData {
    return {
      accounts: [
        {
          account_id: 'demo_checking_001',
          balances: {
            available: 8420.50,
            current: 8420.50,
            limit: null,
            iso_currency_code: 'USD'
          },
          name: 'Joint Checking',
          type: 'depository',
          subtype: 'checking'
        },
        {
          account_id: 'demo_savings_001',
          balances: {
            available: 7000.00,
            current: 7000.00,
            limit: null,
            iso_currency_code: 'USD'
          },
          name: 'Savings Account',
          type: 'depository',
          subtype: 'savings'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  // Get total balance across all accounts
  static async getTotalBalance(): Promise<number> {
    try {
      const plaidData = await this.getAccountBalances();
      const total = plaidData.accounts.reduce((sum, account) => {
        return sum + (account.balances.current || 0);
      }, 0);
      
      return Math.round(total * 100) / 100; // Round to 2 decimal places
      
    } catch (error) {
      console.error('Error calculating total balance:', error);
      return 0;
    }
  }

  // Health check to see if Plaid is properly configured
  static isConfigured(): boolean {
    // In a real implementation, check if environment variables are set
    return true; // For demo, always return true
  }

  // Link a new account (would open Plaid Link)
  static async linkAccount(): Promise<void> {
    // In a real implementation, this would:
    // 1. Create a new link_token
    // 2. Open Plaid Link modal
    // 3. Handle the success flow
    
    console.log('Plaid Link modal would open here');
    
    // For demo, just simulate success
    await new Promise(resolve => setTimeout(resolve, 1000));
    localStorage.setItem(this.ACCESS_TOKEN_KEY, 'demo_access_token_' + Date.now());
  }
} 