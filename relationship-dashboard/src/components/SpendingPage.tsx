import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  ShoppingCart, 
  Restaurant, 
  Casino, 
  ShoppingBag, 
  Person as PersonIcon,
  Add,
  Delete,
  Edit,
  Refresh
} from '@mui/icons-material';
import { DataService } from '../services/dataService';

const DARK_THEME = {
  neon: {
    green: '#00ff88',
    cyan: '#00d9ff',
    blue: '#0099ff',
    purple: '#b24fff',
    pink: '#ff6eb5',
    orange: '#ff9944',
    yellow: '#ffdd00'
  }
};

const TAG_CONFIGS = {
  'necessities': { icon: ShoppingCart, color: DARK_THEME.neon.green, label: 'Necessities' },
  'eating out': { icon: Restaurant, color: DARK_THEME.neon.pink, label: 'Eating Out' },
  'fun': { icon: Casino, color: DARK_THEME.neon.orange, label: 'Fun' },
  'clothes': { icon: ShoppingBag, color: DARK_THEME.neon.purple, label: 'Clothes' }
};

const PERSON_CONFIGS = {
  'ben': { color: DARK_THEME.neon.cyan, label: 'Ben' },
  'sydney': { color: DARK_THEME.neon.pink, label: 'Sydney' }
};

interface SpendingTransaction {
  id: string;
  amount: number;
  tag: string;
  person: string;
  date: string;
}

interface SpendingPageState {
  transactions: SpendingTransaction[];
  stats: any;
  selectedMonth: string;
  showAddForm: boolean;
  editingTransaction: SpendingTransaction | null;
  isLoading: boolean;
  newTransaction: {
    amount: string;
    tag: string;
    person: string;
    date: string;
  };
}

const SpendingPage: React.FC = () => {
  const [state, setState] = useState<SpendingPageState>({
    transactions: [],
    stats: { monthly_stats: {} },
    selectedMonth: new Date().toISOString().slice(0, 7), // Current month (YYYY-MM)
    showAddForm: false,
    editingTransaction: null,
    isLoading: true,
    newTransaction: {
      amount: '',
      tag: 'necessities',
      person: 'ben',
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    }
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [allTransactions, stats] = await Promise.all([
        DataService.getSpendingTransactions(), // Get all transactions for the table
        DataService.getSpendingStats()
      ]);
      
      setState(prev => ({
        ...prev,
        transactions: allTransactions, // Show all in table
        stats,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading spending data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTransaction = async () => {
    if (!state.newTransaction.amount || parseFloat(state.newTransaction.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await DataService.createSpendingTransaction({
        amount: parseFloat(state.newTransaction.amount),
        tag: state.newTransaction.tag,
        person: state.newTransaction.person,
        date: state.newTransaction.date
      });

      setState(prev => ({
        ...prev,
        showAddForm: false,
        newTransaction: { 
          amount: '', 
          tag: 'necessities', 
          person: 'ben',
          date: new Date().toISOString().split('T')[0]
        }
      }));

      loadData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await DataService.deleteSpendingTransaction(transactionId);
      loadData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const handleUpdateTransaction = async (transactionId: string, updates: Partial<SpendingTransaction>) => {
    try {
      await DataService.updateSpendingTransaction(transactionId, updates);
      setState(prev => ({ ...prev, editingTransaction: null }));
      loadData();
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction');
    }
  };

  const handleEditTransaction = (transaction: SpendingTransaction) => {
    setState(prev => ({ ...prev, editingTransaction: transaction }));
  };

  const currentMonthStats = state.stats.monthly_stats[state.selectedMonth] || {
    total_by_tag: { necessities: 0, 'eating out': 0, fun: 0, clothes: 0 },
    total_by_person: { ben: 0, sydney: 0 },
    transaction_count: 0
  };

  // Prepare chart data
  const tagData = Object.entries(TAG_CONFIGS).map(([key, config]) => ({
    name: config.label,
    amount: currentMonthStats.total_by_tag[key] || 0,
    fill: config.color
  }));

  const personData = Object.entries(PERSON_CONFIGS).map(([key, config]) => ({
    name: config.label,
    amount: currentMonthStats.total_by_person[key] || 0,
    fill: config.color
  }));

  // Calculate monthly total
  const monthlyTotal = Object.values(currentMonthStats.total_by_tag as Record<string, number>).reduce(
    (sum: number, amount: number) => sum + amount, 0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (state.isLoading) {
    return (
      <div className="h-full bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Refresh 
              sx={{ 
                fontSize: 64, 
                color: DARK_THEME.neon.cyan
              }}
            />
          </div>
          <p className="text-gray-400 text-lg">Loading spending data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Spending Dashboard
            </span>
          </h1>
          <p className="text-sm text-gray-300">Track your spending over time</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-400">View Month:</label>
          <input
            type="month"
            value={state.selectedMonth}
            onChange={(e) => setState(prev => ({ ...prev, selectedMonth: e.target.value }))}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => setState(prev => ({ ...prev, showAddForm: !prev.showAddForm }))}
            className="px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all"
            style={{
              background: `linear-gradient(135deg, ${DARK_THEME.neon.cyan}, ${DARK_THEME.neon.blue})`,
              boxShadow: `0 4px 20px ${DARK_THEME.neon.cyan}40`
            }}
          >
            <Add sx={{ fontSize: 20 }} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Add Transaction Form */}
      {state.showAddForm && (
        <div className="mb-6 p-6 radial-wheel-dark">
          <h3 className="text-xl font-bold mb-4">Add New Transaction</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date</label>
              <input
                type="date"
                value={state.newTransaction.date}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  newTransaction: { ...prev.newTransaction, date: e.target.value }
                }))}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={state.newTransaction.amount}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  newTransaction: { ...prev.newTransaction, amount: e.target.value }
                }))}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select
                value={state.newTransaction.tag}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  newTransaction: { ...prev.newTransaction, tag: e.target.value }
                }))}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500"
              >
                {Object.entries(TAG_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Person</label>
              <select
                value={state.newTransaction.person}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  newTransaction: { ...prev.newTransaction, person: e.target.value }
                }))}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500"
              >
                {Object.entries(PERSON_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={handleAddTransaction}
                className="flex-1 px-6 py-2 rounded-lg font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${DARK_THEME.neon.green}, ${DARK_THEME.neon.cyan})`,
                  boxShadow: `0 4px 20px ${DARK_THEME.neon.green}40`
                }}
              >
                Save
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, showAddForm: false }))}
                className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(TAG_CONFIGS).map(([key, config]) => {
          const Icon = config.icon;
          const total = currentMonthStats.total_by_tag[key] || 0;
          return (
            <div key={key} className="radial-wheel-dark p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Icon sx={{ fontSize: 24, color: config.color }} />
                <span className="text-gray-400 text-sm">{config.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: config.color }}>
                {formatCurrency(total)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Spending by Category */}
        <div className="radial-wheel-dark p-6">
          <h3 className="text-xl font-bold mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tagData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  color: 'white'
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Spending by Person */}
        <div className="radial-wheel-dark p-6">
          <h3 className="text-xl font-bold mb-4">Spending by Person</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={personData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {personData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  color: 'white'
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="radial-wheel-dark p-6">
        <h3 className="text-xl font-bold mb-4">All Transactions (Sorted by Date Added)</h3>
        {state.transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No transactions this month
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Person</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.transactions.map((transaction) => {
                  const isEditing = state.editingTransaction?.id === transaction.id;
                  const tagConfig = TAG_CONFIGS[transaction.tag as keyof typeof TAG_CONFIGS];
                  const personConfig = PERSON_CONFIGS[transaction.person as keyof typeof PERSON_CONFIGS];
                  
                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-800 hover:bg-gray-900 transition-colors"
                    >
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="date"
                            defaultValue={transaction.date}
                            onBlur={(e) => handleUpdateTransaction(transaction.id, { date: e.target.value })}
                            className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-700"
                          />
                        ) : (
                          <span className="text-sm">{new Date(transaction.date).toLocaleDateString()}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={transaction.amount}
                            onBlur={(e) => handleUpdateTransaction(transaction.id, { amount: parseFloat(e.target.value) })}
                            className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-700"
                          />
                        ) : (
                          <span className="text-sm font-semibold" style={{ color: tagConfig?.color }}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            defaultValue={transaction.tag}
                            onBlur={(e) => handleUpdateTransaction(transaction.id, { tag: e.target.value })}
                            className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-700"
                          >
                            {Object.entries(TAG_CONFIGS).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm">{tagConfig?.label}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            defaultValue={transaction.person}
                            onBlur={(e) => handleUpdateTransaction(transaction.id, { person: e.target.value })}
                            className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-700"
                          >
                            {Object.entries(PERSON_CONFIGS).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm" style={{ color: personConfig?.color }}>
                            {personConfig?.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {!isEditing && (
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                              title="Edit"
                            >
                              <Edit sx={{ fontSize: 18 }} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <Delete sx={{ fontSize: 18 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingPage;

