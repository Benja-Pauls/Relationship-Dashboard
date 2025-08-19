import React from 'react';
import { TrendingUp, TrendingDown, AccountBalance } from '@mui/icons-material';
import { PARTNER_COLORS } from '../types/metrics';
import RadialCenterIcon from './RadialCenterIcon';

interface DualFinanceWheelProps {
  partner1Balance: number;
  partner2Balance: number;
  partner1Change: number;
  partner2Change: number;
  isLoading?: boolean;
  error?: string;
}

const DualFinanceWheel: React.FC<DualFinanceWheelProps> = ({
  partner1Balance,
  partner2Balance,
  partner1Change,
  partner2Change,
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
    if (change > 0) return <TrendingUp sx={{ fontSize: 16 }} className="text-green-400" />;
    if (change < 0) return <TrendingDown sx={{ fontSize: 16 }} className="text-red-400" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const totalBalance = partner1Balance + partner2Balance;
  const partner1Percentage = totalBalance > 0 ? (partner1Balance / totalBalance) * 100 : 50;
  const partner2Percentage = totalBalance > 0 ? (partner2Balance / totalBalance) * 100 : 50;

  // Standard radial wheel dimensions - matching other components
  const radius = 80;
  const strokeWidth = 12; // Increased thickness
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Calculate stroke dash arrays for each partner
  const partner1Arc = (partner1Percentage / 100) * circumference;
  const partner2Arc = (partner2Percentage / 100) * circumference;

  if (error) {
    return (
      <div className="radial-wheel-dark">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="p-3 rounded-2xl bg-red-900/20 border border-red-500/40">
            <AccountBalance sx={{ fontSize: 40, color: '#ef4444' }} />
          </div>
          <div className="text-center">
            <h3 className="tech-heading text-lg mb-1">Finance Snapshot</h3>
            <p className="text-xs text-gray-400">Unable to load</p>
          </div>
        </div>
        <div className="text-center py-8">
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
            <h3 className="tech-heading text-lg mb-1">Finance Snapshot</h3>
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
            {/* Simplified Header */}
      <div className="text-center mb-6">
        <h3 className="font-bold text-white text-lg mb-2">Finance Snapshot</h3>
        <p className="text-sm text-gray-400 flex items-center justify-center space-x-1">
          <span>Combined Accounts</span>
          <span>💰</span>
        </p>
      </div>

      {/* Cute Dual Radial Wheel */}
      <div className="relative mb-6 flex justify-center flex-1">
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
            {/* Orange gradient for Partner 1 */}
            <linearGradient id="orange-gradient-finance" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={PARTNER_COLORS.partner1.primary} />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            
            {/* Purple gradient for Partner 2 */}
            <linearGradient id="purple-gradient-finance" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={PARTNER_COLORS.partner2.primary} />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>

            {/* Background gradient */}
            <linearGradient id="bg-gradient-finance" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>

            {/* Glow filters */}
            <filter id="orange-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <filter id="purple-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
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
          
          {/* Partner 1 (Orange) arc */}
          <circle
            cx={100}
            cy={100}
            r={normalizedRadius}
            fill="none"
            stroke="url(#orange-gradient-finance)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${partner1Arc} ${circumference - partner1Arc}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            filter="url(#orange-glow)"
          />
          
          {/* Partner 2 (Purple) arc */}
          <circle
            cx={100}
            cy={100}
            r={normalizedRadius}
            fill="none"
            stroke="url(#purple-gradient-finance)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${partner2Arc} ${circumference - partner2Arc}`}
            strokeDashoffset={-partner1Arc}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            filter="url(#purple-glow)"
          />

          <RadialCenterIcon
            Icon={AccountBalance}
            color="#10b981"
            size={48}
          />
        </svg>
      </div>

      {/* Total Balance Below Ring */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold mb-1">
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

      {/* Partner Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Partner 1 (Orange) */}
        <div
          className="text-center p-3 rounded-xl border transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${PARTNER_COLORS.partner1.primary}10, ${PARTNER_COLORS.partner1.primary}05)`,
            borderColor: `${PARTNER_COLORS.partner1.primary}30`
          }}
        >
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                background: `linear-gradient(135deg, ${PARTNER_COLORS.partner1.primary}, #ea580c)`,
                boxShadow: `0 0 8px ${PARTNER_COLORS.partner1.primary}60`
              }}
            ></div>
            <span className="text-sm font-semibold text-gray-200">
              {PARTNER_COLORS.partner1.name}
            </span>
          </div>
                    <div
            className="text-xl font-bold mb-1"
            style={{ color: PARTNER_COLORS.partner1.primary }}
          >
            {formatCurrency(partner1Balance)}
          </div>
          <div className="text-xs text-gray-300 mb-1">
            {Math.round(partner1Percentage)}% of total
          </div>
          <div className={`flex items-center justify-center space-x-1 text-sm ${getChangeColor(partner1Change)}`}>
            {getChangeIcon(partner1Change)}
            <span className="font-medium">{formatChange(partner1Change)}</span>
          </div>
        </div>

                {/* Partner 2 (Purple) */}
        <div
          className="text-center p-3 rounded-xl border transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${PARTNER_COLORS.partner2.primary}10, ${PARTNER_COLORS.partner2.primary}05)`,
            borderColor: `${PARTNER_COLORS.partner2.primary}30`
          }}
        >
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                background: `linear-gradient(135deg, ${PARTNER_COLORS.partner2.primary}, #9333ea)`,
                boxShadow: `0 0 8px ${PARTNER_COLORS.partner2.primary}60`
              }}
            ></div>
            <span className="text-sm font-semibold text-gray-200">
              {PARTNER_COLORS.partner2.name}
            </span>
          </div>
                    <div
            className="text-xl font-bold mb-1"
            style={{ color: PARTNER_COLORS.partner2.primary }}
          >
            {formatCurrency(partner2Balance)}
          </div>
          <div className="text-xs text-gray-300 mb-1">
            {Math.round(partner2Percentage)}% of total
          </div>
          <div className={`flex items-center justify-center space-x-1 text-sm ${getChangeColor(partner2Change)}`}>
            {getChangeIcon(partner2Change)}
            <span className="font-medium">{formatChange(partner2Change)}</span>
          </div>
        </div>
      </div>

      {/* Total Change Summary */}
      <div 
        className="text-center text-sm px-4 py-3 rounded-xl border transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #059669, #10b981)',
          borderColor: '#10b98130',
          color: '#ffffff'
        }}
      >
        <span className="font-medium">Weekly Combined: </span>
        <span className={`font-bold ${getChangeColor(partner1Change + partner2Change)}`}>
          {formatChange(partner1Change + partner2Change)}
        </span>
      </div>

      <div className="mt-3 text-center text-xs text-gray-500">
        Updated via Plaid • Real-time sync
      </div>
    </div>
  );
};

export default DualFinanceWheel; 