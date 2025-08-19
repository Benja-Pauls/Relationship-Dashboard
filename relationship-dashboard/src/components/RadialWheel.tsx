import React from 'react';
import { Add, Remove } from '@mui/icons-material';
import * as MuiIcons from '@mui/icons-material';

interface RadialWheelProps {
  value: number;
  goal: number;
  label: string;
  muiIcon: string;
  neonColor: string;
  gradientFrom: string;
  gradientTo: string;
  unit?: string;
  goalType: 'higher' | 'lower';
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'small' | 'medium' | 'large';
  encouragement?: string;
}

const RadialWheel: React.FC<RadialWheelProps> = ({
  value,
  goal,
  label,
  muiIcon,
  neonColor,
  gradientFrom,
  gradientTo,
  unit,
  goalType,
  onIncrement,
  onDecrement,
  size = 'medium',
  encouragement
}) => {
  // Calculate progress percentage
  const progress = goalType === 'higher' 
    ? Math.min((value / goal) * 100, 100)
    : goal > 0 
      ? Math.max(100 - ((value / goal) * 100), 0)
      : 100;

  const isOverGoal = goalType === 'higher' ? value > goal : value > goal;
  const isComplete = progress >= 100;

  // Size configurations for professional layout
  const sizeConfig = {
    small: { radius: 70, strokeWidth: 10, centerSize: 'text-2xl', labelSize: 'text-sm' },
    medium: { radius: 85, strokeWidth: 12, centerSize: 'text-3xl', labelSize: 'text-base' },
    large: { radius: 100, strokeWidth: 14, centerSize: 'text-4xl', labelSize: 'text-lg' }
  };

  const { radius, strokeWidth, labelSize } = sizeConfig[size];
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Get MUI icon component dynamically
  const IconComponent = (MuiIcons as any)[muiIcon] || MuiIcons.Help;

  const displayValue = unit ? `${value}${unit}` : value;
  const displayGoal = unit ? `${goal}${unit}` : goal;

  return (
    <div className="radial-wheel-dark group relative h-full flex flex-col">
      {/* Floating achievement indicator */}
      {isComplete && (
        <div className="absolute -top-2 -right-2 z-10">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold animate-bounce"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              boxShadow: `0 0 15px ${neonColor}80`
            }}
          >
            🏆
          </div>
        </div>
      )}

            {/* Simplified Header */}
      <div className="text-center mb-6">
        <h3 className={`font-bold text-white ${labelSize} mb-2`}>{label}</h3>
        <p className="text-sm text-gray-400 flex items-center justify-center space-x-1">
          <span>Weekly Goal: {displayGoal}</span>
          <span>🎯</span>
        </p>
      </div>

      {/* Radial Progress Ring */}
      <div className="relative mb-6 flex justify-center flex-1">
        <svg 
          className="transform -rotate-90 transition-all duration-500"
          width={radius * 2} 
          height={radius * 2}
          style={{
            filter: isComplete 
              ? `drop-shadow(0 0 15px ${neonColor}60)` 
              : `drop-shadow(0 0 8px ${neonColor}30)`
          }}
        >
          <defs>
            {/* Background gradient */}
            <linearGradient id={`bg-gradient-${muiIcon}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>
            
            {/* Progress gradient */}
            <linearGradient id={`progress-gradient-${muiIcon}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>

            {/* Neon glow filter */}
            <filter id={`glow-${muiIcon}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background circle */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={`url(#bg-gradient-${muiIcon})`}
            strokeWidth={strokeWidth}
            className="opacity-40"
          />
          
          {/* Progress circle */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={`url(#progress-gradient-${muiIcon})`}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            filter={`url(#glow-${muiIcon})`}
            style={{
              opacity: progress > 0 ? 0.9 : 0
            }}
          />
          
          {/* Over-goal indicator */}
          {isOverGoal && (
            <circle
              cx={radius}
              cy={radius}
              r={normalizedRadius + 5}
              fill="none"
              stroke="#ffea00"
              strokeWidth="2"
              strokeDasharray="10,5"
              className="animate-spin"
              style={{ animationDuration: '3s' }}
            />
          )}
        </svg>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}40, ${gradientTo}40)`,
              border: `2px solid ${neonColor}60`,
              boxShadow: `0 0 20px ${neonColor}40`,
              transform: 'translateY(-65px)'
            }}
          >
            <IconComponent
              sx={{
                fontSize: size === 'large' ? 40 : size === 'medium' ? 35 : 30,
                color: neonColor,
                filter: `drop-shadow(0 0 8px ${neonColor}80)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Numbers Below Ring */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold">
              <span 
                className="neon-text"
                style={{ color: neonColor }}
              >
                {displayValue}
              </span>
            </div>
            <div className="text-xs text-gray-400">Current</div>
          </div>
          <div className="text-gray-500 text-lg">/</div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">
              {displayGoal}
            </div>
            <div className="text-xs text-gray-400">Goal</div>
          </div>
          <div className="text-gray-500 text-lg">=</div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: neonColor }}>
              {Math.round(progress)}%
            </div>
            <div className="text-xs text-gray-400">Progress</div>
          </div>
        </div>
      </div>

            {/* Individual Metric Item (like Household Chores style) */}
      <div className="space-y-2 mb-4">
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-800/50"
          style={isComplete ? {
            background: `linear-gradient(135deg, ${neonColor}15, transparent)`,
            border: `1px solid ${neonColor}40`
          } : {}}
        >
          <div className="flex items-center space-x-3 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              }}
            >
              <IconComponent sx={{ fontSize: 20, color: 'white' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white text-sm">{label}</span>
                <span className="text-xs text-gray-300 font-medium">
                  {value}/{goal}{unit || ''}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
                    boxShadow: progress > 0 ? `0 0 8px ${neonColor}60` : 'none'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={onDecrement}
              disabled={value <= 0}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                background: value > 0
                  ? 'linear-gradient(135deg, #666 0%, #555 100%)'
                  : 'linear-gradient(135deg, #333 0%, #222 100%)'
              }}
            >
              <Remove sx={{ fontSize: 16 }} />
            </button>

            <button
              onClick={onIncrement}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                boxShadow: `0 4px 12px ${neonColor}40`
              }}
            >
              <Add sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      </div>

            {/* Compact Encouragement */}
      {encouragement && (
        <div
          className="text-center text-xs px-2 py-1 rounded mb-2"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}10, ${gradientTo}10)`,
            color: '#9ca3af'
          }}
        >
          {encouragement}
        </div>
      )}


    </div>
  );
};

export default RadialWheel; 