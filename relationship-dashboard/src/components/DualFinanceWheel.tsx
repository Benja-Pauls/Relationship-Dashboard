import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AccountBalance, TrendingFlat, ExpandMore, ExpandLess } from '@mui/icons-material';
import { FINANCE_COLORS } from '../types/metrics';
import RadialCenterIcon from './RadialCenterIcon';
import { PlaidService } from '../services/plaidService';

interface DualFinanceWheelProps {
  sydneyBalance: number;
  benBalance: number;
  investmentsBalance: number;
  sydneyWeeklyChange: number;
  benWeeklyChange: number;
  investmentsWeeklyChange: number;
  isLoading?: boolean;
  error?: string;
}

const DualFinanceWheel: React.FC<DualFinanceWheelProps> = ({
  sydneyBalance,
  benBalance,
  investmentsBalance,
  sydneyWeeklyChange,
  benWeeklyChange,
  investmentsWeeklyChange,
  isLoading = false,
  error
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  type AccountItem = {
    account_id: string;
    name: string;
    type: string;
    subtype?: string;
    balance: number;
    available: number | null;
    owner: 'sydney' | 'ben' | 'investments' | string;
  };

  const [accounts, setAccounts] = useState<AccountItem[] | null>(null);
  const [expandedOwner, setExpandedOwner] = useState<'sydney' | 'ben' | 'investments' | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const ensureAccountsLoaded = async () => {
    if (accounts || accountsLoading) return;
    try {
      setAccountsLoading(true);
      const list = await PlaidService.getAccounts();
      setAccounts(list as AccountItem[]);
      setAccountsError(null);
    } catch (e: any) {
      setAccountsError(e?.message || 'Failed to load accounts');
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleToggle = async (owner: 'sydney' | 'ben' | 'investments') => {
    await ensureAccountsLoaded();
    setExpandedOwner(prev => (prev === owner ? null : owner));
  };

  const accountsByOwner = (owner: 'sydney' | 'ben' | 'investments') => {
    return (accounts || []).filter(a => a.owner === owner);
  };

  const totalBalance = sydneyBalance + benBalance + investmentsBalance;
  const sydneyPercentage = totalBalance > 0 ? (sydneyBalance / totalBalance) * 100 : 33.33;
  const benPercentage = totalBalance > 0 ? (benBalance / totalBalance) * 100 : 33.33;
  const investmentsPercentage = totalBalance > 0 ? (investmentsBalance / totalBalance) * 100 : 33.33;

  // Standard radial wheel dimensions - matching other components
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // Calculate arc lengths for three segments
  const sydneyArc = (sydneyPercentage / 100) * circumference;
  const benArc = (benPercentage / 100) * circumference;
  const investmentsArc = (investmentsPercentage / 100) * circumference;

  if (error) {
    return (
      <div className="radial-wheel-dark">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e040fb, #ff9100)' }}>
            <span className="text-white text-2xl font-bold">!</span>
          </div>
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <p className="text-gray-500 text-xs">Check Plaid connection</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="radial-wheel-dark">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="p-3 rounded-2xl bg-gray-800/50 border border-gray-600/40">
            <AccountBalance sx={{ fontSize: 40, color: '#9ca3af' }} />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-white text-lg mb-2">Finance Snapshot</h3>
            <p className="text-xs text-gray-400">Loading...</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="skeleton-dark w-24 h-24 rounded-full mx-auto mb-4"></div>
          <div className="skeleton-dark h-4 w-32 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="radial-wheel-dark group relative h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-3">
        <h3 className="font-bold text-white text-base mb-1">Finance Snapshot</h3>
        <p className="text-xs text-gray-400">
          Combined Accounts
        </p>
      </div>

      {/* Compact Three-Segment Radial Wheel */}
      <div className="relative mb-3 flex justify-center flex-1">
        <svg 
          className="transform -rotate-90 transition-all duration-500"
          width={160} 
          height={160}
          viewBox="0 0 160 160"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.4))'
          }}
        >
          <defs>
            {/* Sydney gradient */}
            <linearGradient id="sydney-gradient-finance" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={FINANCE_COLORS.sydney.primary} />
              <stop offset="100%" stopColor="#d500f9" />
            </linearGradient>
            
            {/* Ben gradient */}
            <linearGradient id="ben-gradient-finance" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={FINANCE_COLORS.ben.primary} />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            {/* Investments gradient */}
            <linearGradient id="investments-gradient-finance" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={FINANCE_COLORS.investments.primary} />
              <stop offset="100%" stopColor="#00c853" />
            </linearGradient>
            
            {/* Background gradient */}
            <linearGradient id="bg-gradient-finance" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>
          </defs>
          
          {/* Background circle */}
          <circle
            cx={80}
            cy={80}
            r={normalizedRadius}
            fill="none"
            stroke="url(#bg-gradient-finance)"
            strokeWidth={strokeWidth}
            className="opacity-40"
          />
          
          {/* Sydney arc */}
          <circle
            cx={80}
            cy={80}
            r={normalizedRadius}
            fill="none"
            stroke="url(#sydney-gradient-finance)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${sydneyArc} ${circumference - sydneyArc}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Ben arc */}
          <circle
            cx={80}
            cy={80}
            r={normalizedRadius}
            fill="none"
            stroke="url(#ben-gradient-finance)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${benArc} ${circumference - benArc}`}
            strokeDashoffset={-sydneyArc}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Investments arc */}
          <circle
            cx={80}
            cy={80}
            r={normalizedRadius}
            fill="none"
            stroke="url(#investments-gradient-finance)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${investmentsArc} ${circumference - investmentsArc}`}
            strokeDashoffset={-(sydneyArc + benArc)}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          <RadialCenterIcon
            Icon={AccountBalance}
            color="#10b981"
            size={72}
          />
        </svg>
      </div>

      {/* Compact Total Balance */}
      <div className="text-center mb-3">
        <div className="text-2xl font-bold mb-1">
          <span 
            className="neon-text"
            style={{ 
              color: '#10b981',
              textShadow: `0 0 20px #10b98160`
            }}
          >
            {formatCurrency(totalBalance)}
          </span>
        </div>
        <div className="text-xs text-gray-300 font-medium">
          Combined Balance
        </div>
      </div>

      {/* Compact Account Rows */}
      <div className="space-y-1 mb-2">
        {/* Sydney Row */}
        <div
          className="flex items-center justify-between p-2 rounded-lg border transition-all duration-300 cursor-pointer hover:scale-[1.01]"
          style={{
            background: `linear-gradient(135deg, ${FINANCE_COLORS.sydney.primary}15, ${FINANCE_COLORS.sydney.primary}08)`,
            borderColor: `${FINANCE_COLORS.sydney.primary}40`,
            boxShadow: `0 2px 8px ${FINANCE_COLORS.sydney.primary}20`
          }}
          onClick={() => handleToggle('sydney')}
          role="button"
        >
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full shadow-lg"
              style={{ 
                backgroundColor: FINANCE_COLORS.sydney.primary,
                boxShadow: `0 0 8px ${FINANCE_COLORS.sydney.primary}60`
              }}
            />
            <span className="text-xs font-bold text-white">{FINANCE_COLORS.sydney.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold text-white">
              {formatCurrency(sydneyBalance)}
            </span>
            {expandedOwner === 'sydney' ? (
              <ExpandLess sx={{ fontSize: 14 }} className="text-gray-300" />
            ) : (
              <ExpandMore sx={{ fontSize: 14 }} className="text-gray-300" />
            )}
          </div>
        </div>
        {expandedOwner === 'sydney' && (
          <div className="rounded-lg border p-2 ml-3" style={{ borderColor: `${FINANCE_COLORS.sydney.primary}30`, background: `linear-gradient(135deg, ${FINANCE_COLORS.sydney.primary}08, transparent)` }}>
            {accountsLoading && <div className="text-xs text-gray-400">Loading accounts…</div>}
            {accountsError && <div className="text-xs text-red-400">{accountsError}</div>}
            {!accountsLoading && !accountsError && (
              <div className="space-y-1">
                {accountsByOwner('sydney').length === 0 && (
                  <div className="text-xs text-gray-400">No accounts categorized to Sydney.</div>
                )}
                {accountsByOwner('sydney').map(acc => (
                  <div key={acc.account_id} className="flex items-center justify-between text-xs text-gray-200 p-1 rounded bg-gray-800/30">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-200 font-medium">{acc.name}</span>
                      <span className="text-gray-500 text-xs">{acc.subtype || acc.type}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(acc.balance || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ben Row */}
        <div
          className="flex items-center justify-between p-2 rounded-lg border transition-all duration-300 cursor-pointer hover:scale-[1.01]"
          style={{
            background: `linear-gradient(135deg, ${FINANCE_COLORS.ben.primary}15, ${FINANCE_COLORS.ben.primary}08)`,
            borderColor: `${FINANCE_COLORS.ben.primary}40`,
            boxShadow: `0 2px 8px ${FINANCE_COLORS.ben.primary}20`
          }}
          onClick={() => handleToggle('ben')}
          role="button"
        >
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full shadow-lg"
              style={{ 
                backgroundColor: FINANCE_COLORS.ben.primary,
                boxShadow: `0 0 8px ${FINANCE_COLORS.ben.primary}60`
              }}
            />
            <span className="text-xs font-bold text-white">{FINANCE_COLORS.ben.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold text-white">
              {formatCurrency(benBalance)}
            </span>
            {expandedOwner === 'ben' ? (
              <ExpandLess sx={{ fontSize: 14 }} className="text-gray-300" />
            ) : (
              <ExpandMore sx={{ fontSize: 14 }} className="text-gray-300" />
            )}
          </div>
        </div>
        {expandedOwner === 'ben' && (
          <div className="rounded-lg border p-2 ml-3" style={{ borderColor: `${FINANCE_COLORS.ben.primary}30`, background: `linear-gradient(135deg, ${FINANCE_COLORS.ben.primary}08, transparent)` }}>
            {accountsLoading && <div className="text-xs text-gray-400">Loading accounts…</div>}
            {accountsError && <div className="text-xs text-red-400">{accountsError}</div>}
            {!accountsLoading && !accountsError && (
              <div className="space-y-1">
                {accountsByOwner('ben').length === 0 && (
                  <div className="text-xs text-gray-400">No accounts categorized to Ben.</div>
                )}
                {accountsByOwner('ben').map(acc => (
                  <div key={acc.account_id} className="flex items-center justify-between text-xs text-gray-200 p-1 rounded bg-gray-800/30">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-200 font-medium">{acc.name}</span>
                      <span className="text-gray-500 text-xs">{acc.subtype || acc.type}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(acc.balance || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Investments Row */}
        <div
          className="flex items-center justify-between p-2 rounded-lg border transition-all duration-300 cursor-pointer hover:scale-[1.01]"
          style={{
            background: `linear-gradient(135deg, ${FINANCE_COLORS.investments.primary}15, ${FINANCE_COLORS.investments.primary}08)`,
            borderColor: `${FINANCE_COLORS.investments.primary}40`,
            boxShadow: `0 2px 8px ${FINANCE_COLORS.investments.primary}20`
          }}
          onClick={() => handleToggle('investments')}
          role="button"
        >
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full shadow-lg"
              style={{ 
                backgroundColor: FINANCE_COLORS.investments.primary,
                boxShadow: `0 0 8px ${FINANCE_COLORS.investments.primary}60`
              }}
            />
            <span className="text-xs font-bold text-white">{FINANCE_COLORS.investments.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold text-white">
              {formatCurrency(investmentsBalance)}
            </span>
            {expandedOwner === 'investments' ? (
              <ExpandLess sx={{ fontSize: 14 }} className="text-gray-300" />
            ) : (
              <ExpandMore sx={{ fontSize: 14 }} className="text-gray-300" />
            )}
          </div>
        </div>
        {expandedOwner === 'investments' && (
          <div className="rounded-lg border p-2 ml-3" style={{ borderColor: `${FINANCE_COLORS.investments.primary}30`, background: `linear-gradient(135deg, ${FINANCE_COLORS.investments.primary}08, transparent)` }}>
            {accountsLoading && <div className="text-xs text-gray-400">Loading accounts…</div>}
            {accountsError && <div className="text-xs text-red-400">{accountsError}</div>}
            {!accountsLoading && !accountsError && (
              <div className="space-y-1">
                {accountsByOwner('investments').length === 0 && (
                  <div className="text-xs text-gray-400">No accounts categorized to Investments.</div>
                )}
                {accountsByOwner('investments').map(acc => (
                  <div key={acc.account_id} className="flex items-center justify-between text-xs text-gray-200 p-1 rounded bg-gray-800/30">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-200 font-medium">{acc.name}</span>
                      <span className="text-gray-500 text-xs">{acc.subtype || acc.type}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(acc.balance || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compact Summary Footer */}
      <div 
        className="text-center py-2 px-3 rounded-lg text-xs border"
        style={{
          background: 'linear-gradient(135deg, #05966915, #10b98115)',
          border: '1px solid #10b98130',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
        }}
      >
        <div className="flex items-center justify-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-gray-300 font-medium">Real-time via Plaid</span>
        </div>
      </div>
    </div>
  );
};

export default DualFinanceWheel; 