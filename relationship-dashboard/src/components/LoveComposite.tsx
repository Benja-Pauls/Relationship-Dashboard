import React from 'react';
import { Add, Remove, Favorite, Schedule, FavoriteBorder } from '@mui/icons-material';
import { METRIC_CONFIGS, DARK_THEME } from '../types/metrics';
import RadialCenterIcon from './RadialCenterIcon';

interface LoveCompositeProps {
  loveSparksValue: number;
  loveSparksGoal: number;
  qualityTimeValue: number;
  qualityTimeGoal: number;
  onLoveSparksIncrement: () => void;
  onLoveSparksDecrement: () => void;
  onQualityTimeIncrement: () => void;
  onQualityTimeDecrement: () => void;
}

const LoveComposite: React.FC<LoveCompositeProps> = ({
  loveSparksValue,
  loveSparksGoal,
  qualityTimeValue,
  qualityTimeGoal,
  onLoveSparksIncrement,
  onLoveSparksDecrement,
  onQualityTimeIncrement,
  onQualityTimeDecrement
}) => {
  // Get configs for the two love metrics
  const loveSparksConfig = METRIC_CONFIGS.find(c => c.key === 'sexCount')!;
  const qualityTimeConfig = METRIC_CONFIGS.find(c => c.key === 'qualityTimeHours')!;

  const loveMetrics = [
    {
      config: loveSparksConfig,
      value: loveSparksValue,
      goal: loveSparksGoal,
      onIncrement: onLoveSparksIncrement,
      onDecrement: onLoveSparksDecrement,
      icon: Favorite,
      label: 'Love Sparks'
    },
    {
      config: qualityTimeConfig,
      value: qualityTimeValue,
      goal: qualityTimeGoal,
      onIncrement: onQualityTimeIncrement,
      onDecrement: onQualityTimeDecrement,
      icon: Schedule,
      label: 'Quality Time'
    }
  ];

  // Standard radial wheel dimensions - matching other components
  const radius = 80;
  const strokeWidth = 12; // Increased thickness
  const normalizedRadius = radius - strokeWidth / 2;

  // Calculate overall progress across all love metrics
  const totalProgress = loveMetrics.reduce((sum, metric) => {
    const progress = metric.config.goalType === 'higher'
      ? Math.min((metric.value / metric.goal) * 100, 100)
      : metric.goal > 0
        ? Math.max(100 - ((metric.value / metric.goal) * 100), 0)
        : 100;
    return sum + progress;
  }, 0) / loveMetrics.length;

  const completedGoals = loveMetrics.filter(metric => {
    const progress = metric.config.goalType === 'higher'
      ? (metric.value / metric.goal) * 100
      : metric.goal > 0
        ? Math.max(100 - ((metric.value / metric.goal) * 100), 0)
        : 100;
    return progress >= 100;
  }).length;

  const getEncouragement = () => {
    if (completedGoals === 2) return "💕 Perfect love week! 🌟";
    if (completedGoals === 1) return "💖 Keep loving! 🦋";
    return "💫 Love is growing! 💕";
  };

  return (
    <div className="radial-wheel-dark group relative h-full flex flex-col">
      {/* Floating achievement indicator */}
      {completedGoals === 2 && (
        <div className="absolute -top-2 -right-2 z-10">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold animate-bounce"
            style={{
              background: `linear-gradient(135deg, ${DARK_THEME.neon.pink}, ${DARK_THEME.neon.purple})`,
              boxShadow: `0 0 15px ${DARK_THEME.neon.pink}80`
            }}
          >
            🏆
          </div>
        </div>
      )}

      {/* Simplified Header */}
      <div className="text-center mb-6">
        <h3 className="font-bold text-white text-lg mb-2">Love & Connection</h3>
        <p className="text-sm text-gray-400 flex items-center justify-center space-x-1">
          <span>Weekly Progress</span>
          <span>💕</span>
        </p>
      </div>

      {/* Cute Progress Ring */}
      <div className="relative mb-6 flex justify-center flex-1">
        <svg 
          className="transform -rotate-90 transition-all duration-500"
          width={200} 
          height={200}
          viewBox="0 0 200 200"
          style={{
            filter: completedGoals === 2 
              ? `drop-shadow(0 0 15px ${DARK_THEME.neon.pink}60)` 
              : `drop-shadow(0 0 8px ${DARK_THEME.neon.pink}30)`
          }}
        >
          <defs>
            <linearGradient id="love-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>
            
            <linearGradient id="love-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={DARK_THEME.neon.pink} />
              <stop offset="100%" stopColor={DARK_THEME.neon.purple} />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={100}
            cy={100}
            r={normalizedRadius}
            stroke="url(#love-bg-gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            className="opacity-30"
          />

          {/* Progress arc */}
          <circle
            cx={100}
            cy={100}
            r={normalizedRadius}
            stroke="url(#love-progress-gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${(totalProgress / 100) * (normalizedRadius * 2 * Math.PI)} ${normalizedRadius * 2 * Math.PI}`}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{
              filter: `drop-shadow(0 0 8px ${DARK_THEME.neon.pink}60)`
            }}
          />

          <RadialCenterIcon
            Icon={FavoriteBorder}
            color={DARK_THEME.neon.pink}
            size={48}
          />
        </svg>
      </div>

      {/* Progress Numbers Below Ring */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold">
              <span 
                className="neon-text"
                style={{ color: DARK_THEME.neon.pink }}
              >
                {completedGoals}
              </span>
            </div>
            <div className="text-xs text-gray-400">Done</div>
          </div>
          <div className="text-gray-500 text-lg">/</div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">
              {loveMetrics.length}
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="text-gray-500 text-lg">=</div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: DARK_THEME.neon.pink }}>
              {Math.round(totalProgress)}%
            </div>
            <div className="text-xs text-gray-400">Complete</div>
          </div>
        </div>
      </div>

      {/* Compact Love Items */}
      <div className="space-y-2 mb-4">
        {loveMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const progress = metric.config.goalType === 'higher'
            ? Math.min((metric.value / metric.goal) * 100, 100)
            : metric.goal > 0
              ? Math.max(100 - ((metric.value / metric.goal) * 100), 0)
              : 100;
          const isComplete = progress >= 100;

          return (
            <div
              key={metric.config.key}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-800/50"
              style={isComplete ? {
                background: `linear-gradient(135deg, ${metric.config.neonColor}15, transparent)`,
                border: `1px solid ${metric.config.neonColor}40`
              } : {}}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${metric.config.gradientFrom}, ${metric.config.gradientTo})`,
                  }}
                >
                  <Icon sx={{ fontSize: 20, color: 'white' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white text-sm">{metric.label}</span>
                    <span className="text-xs text-gray-300 font-medium">
                      {metric.value}/{metric.goal}{metric.config.unit || ''}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        background: `linear-gradient(90deg, ${metric.config.gradientFrom}, ${metric.config.gradientTo})`,
                        boxShadow: progress > 0 ? `0 0 8px ${metric.config.neonColor}60` : 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={metric.onDecrement}
                  disabled={metric.value <= 0}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    background: metric.value > 0
                      ? 'linear-gradient(135deg, #666 0%, #555 100%)'
                      : 'linear-gradient(135deg, #333 0%, #222 100%)'
                  }}
                >
                  <Remove sx={{ fontSize: 16 }} />
                </button>

                <button
                  onClick={metric.onIncrement}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${metric.config.gradientFrom}, ${metric.config.gradientTo})`,
                    boxShadow: `0 4px 12px ${metric.config.neonColor}40`
                  }}
                >
                  <Add sx={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Encouragement */}
      <div
        className="text-center text-xs px-2 py-1 rounded mb-2"
        style={{
          background: `linear-gradient(135deg, ${DARK_THEME.neon.pink}10, ${DARK_THEME.neon.purple}10)`,
          color: '#9ca3af'
        }}
      >
        {getEncouragement()}
      </div>
    </div>
  );
};

export default LoveComposite; 