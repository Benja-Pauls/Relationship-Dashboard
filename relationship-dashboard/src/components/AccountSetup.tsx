import React, { useState, useEffect } from 'react';
import { PlaidService } from '../services/plaidService';
import { FINANCE_COLORS } from '../types/metrics';

interface Account {
  account_id: string;
  name: string;
  type: string;
  subtype?: string;
  balance: number;
  owner: string;
}

const AccountSetup: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const accountsData = await PlaidService.getAccounts();
      setAccounts(accountsData);
      setError(null);
    } catch (err) {
      setError('Failed to load accounts. Make sure the backend is running.');
      console.error('Error loading accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorizeAccount = async (accountId: string, owner: 'sydney' | 'ben' | 'investments') => {
    try {
      await PlaidService.categorizeAccount(accountId, owner);
      // Update local state
      setAccounts(accounts.map(account => 
        account.account_id === accountId ? { ...account, owner } : account
      ));
    } catch (err) {
      console.error('Error categorizing account:', err);
      setError('Failed to categorize account');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getOwnerColor = (owner: string) => {
    switch (owner) {
      case 'sydney': return FINANCE_COLORS.sydney.primary;
      case 'ben': return FINANCE_COLORS.ben.primary;
      case 'investments': return FINANCE_COLORS.investments.primary;
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button 
            onClick={loadAccounts}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Setup</h1>
        <p className="text-gray-600">
          Categorize your linked accounts to display them properly in the dashboard.
        </p>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-yellow-800 font-medium mb-2">No Accounts Found</h3>
          <p className="text-yellow-600 mb-4">
            You need to link your bank accounts first using Plaid Link.
          </p>
          <p className="text-sm text-yellow-600">
            Make sure the backend is running and you've completed the Plaid Link flow.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div 
              key={account.account_id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {account.type} • {account.subtype || 'General'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getOwnerColor(account.owner) }}
                  />
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {account.owner === 'uncategorized' ? 'Unassigned' : account.owner}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCategorizeAccount(account.account_id, 'sydney')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      account.owner === 'sydney'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    Sydney
                  </button>
                  <button
                    onClick={() => handleCategorizeAccount(account.account_id, 'ben')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      account.owner === 'ben'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                    }`}
                  >
                    Ben
                  </button>
                  <button
                    onClick={() => handleCategorizeAccount(account.account_id, 'investments')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      account.owner === 'investments'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    Investments
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-800 font-medium mb-2">Instructions</h3>
        <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
          <li>Use Plaid Link to connect your bank accounts</li>
          <li>Categorize each account as belonging to Sydney, Ben, or Investments</li>
          <li>Return to the dashboard to see your real account balances</li>
        </ol>
      </div>
    </div>
  );
};

export default AccountSetup; 