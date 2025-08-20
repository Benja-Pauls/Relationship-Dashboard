import React from 'react';
import { TrendingUp, TrendingDown, AccountBalance, Person, TrendingFlat } from '@mui/icons-material';
import { FINANCE_COLORS } from '../types/metrics';
import RadialCenterIcon from './RadialCenterIcon';

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

  const formatChange = (change: number) => {
    const formatted = formatCurrency(Math.abs(change));
    return change >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp sx={{ fontSize: 14 }} className="text-green-400" />;
    if (change < 0) return <TrendingDown sx={{ fontSize: 14 }} className="text-red-400" />;
    return <TrendingFlat sx={{ fontSize: 14 }} className="text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
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
      <div className="text-center mb-4">
        <h3 className="font-bold text-white text-lg mb-1">Finance Snapshot</h3>
        <p className="text-sm text-gray-400">
          Combined Accounts
        </p>
      </div>

      {/* Three-Segment Radial Wheel */}
      <div className="relative mb-4 flex justify-center flex-1">
        <svg 
          className="transform -rotate-90 transition-all duration-500"
          width={200} 
          height={200}
          viewBox="0 0 200 200"
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
            cx={100}
            cy={100}
            r={normalizedRadius}
            fill="none"
            stroke="url(#bg-gradient-finance)"
            strokeWidth={strokeWidth}
            className="opacity-40"
          />
          
          {/* Sydney arc */}
          <circle
            cx={100}
            cy={100}
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
            cx={100}
            cy={100}
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
            cx={100}
            cy={100}
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
            size={48}
          />
        </svg>
      </div>

      {/* Total Balance Below Ring */}
      <div className="text-center mb-3">
        <div className="text-2xl font-bold mb-1">
          <span 
            className="neon-text"
            style={{ color: '#10b981' }}
          >
            {formatCurrency(totalBalance)}
          </span>
        </div>
        <div className="text-sm text-gray-300">
          Combined Balance
        </div>
      </div>

      {/* Three Account Rows */}
      <div className="space-y-1 mb-2">
        {/* Sydney Row */}
        <div
          className="flex items-center justify-between p-2 rounded-xl border transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${FINANCE_COLORS.sydney.primary}10, ${FINANCE_COLORS.sydney.primary}05)`,
            borderColor: `${FINANCE_COLORS.sydney.primary}30`
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: FINANCE_COLORS.sydney.primary }}
            />
            <span className="text-sm font-medium text-white">{FINANCE_COLORS.sydney.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white">
              {formatCurrency(sydneyBalance)}
            </span>
            <div className={`flex items-center space-x-1 text-xs ${getChangeColor(sydneyWeeklyChange)}`}>
              {getChangeIcon(sydneyWeeklyChange)}
              <span>{formatChange(sydneyWeeklyChange)}</span>
            </div>
          </div>
        </div>

        {/* Ben Row */}
        <div
          className="flex items-center justify-between p-2 rounded-xl border transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${FINANCE_COLORS.ben.primary}10, ${FINANCE_COLORS.ben.primary}05)`,
            borderColor: `${FINANCE_COLORS.ben.primary}30`
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: FINANCE_COLORS.ben.primary }}
            />
            <span className="text-sm font-medium text-white">{FINANCE_COLORS.ben.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white">
              {formatCurrency(benBalance)}
            </span>
            <div className={`flex items-center space-x-1 text-xs ${getChangeColor(benWeeklyChange)}`}>
              {getChangeIcon(benWeeklyChange)}
              <span>{formatChange(benWeeklyChange)}</span>
            </div>
          </div>
        </div>

        {/* Investments Row */}
        <div
          className="flex items-center justify-between p-2 rounded-xl border transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${FINANCE_COLORS.investments.primary}10, ${FINANCE_COLORS.investments.primary}05)`,
            borderColor: `${FINANCE_COLORS.investments.primary}30`
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: FINANCE_COLORS.investments.primary }}
            />
            <span className="text-sm font-medium text-white">{FINANCE_COLORS.investments.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white">
              {formatCurrency(investmentsBalance)}
            </span>
            <div className={`flex items-center space-x-1 text-xs ${getChangeColor(investmentsWeeklyChange)}`}>
              {getChangeIcon(investmentsWeeklyChange)}
              <span>{formatChange(investmentsWeeklyChange)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div 
        className="text-center py-2 px-4 rounded-xl text-xs"
        style={{
          background: 'linear-gradient(135deg, #05966910, #10b98110)',
          border: '1px solid #10b98120'
        }}
      >
        <span className="text-gray-400">Updated via Plaid • Real-time sync</span>
      </div>
    </div>
  );
};

export default DualFinanceWheel; 