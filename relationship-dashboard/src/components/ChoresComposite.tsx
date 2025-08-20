import React from 'react';
import { Add, Remove, LocalDining, Delete, Pets, Home } from '@mui/icons-material';
import { METRIC_CONFIGS, DARK_THEME } from '../types/metrics';
import RadialCenterIcon from './RadialCenterIcon';

interface ChoresCompositeProps {
  dishesValue: number;
  dishesGoal: number;
  trashValue: number;
  trashGoal: number;
  kittyValue: number;
  kittyGoal: number;
  onDishesIncrement: () => void;
  onDishesDecrement: () => void;
  onTrashIncrement: () => void;
  onTrashDecrement: () => void;
  onKittyIncrement: () => void;
  onKittyDecrement: () => void;
}

const ChoresComposite: React.FC<ChoresCompositeProps> = ({
  dishesValue,
  dishesGoal,
  trashValue,
  trashGoal,
  kittyValue,
  kittyGoal,
  onDishesIncrement,
  onDishesDecrement,
  onTrashIncrement,
  onTrashDecrement,
  onKittyIncrement,
  onKittyDecrement
}) => {
  // Get configs for the three chore metrics
  const dishesConfig = METRIC_CONFIGS.find(c => c.key === 'dishesDone')!;
  const trashConfig = METRIC_CONFIGS.find(c => c.key === 'trashFullHours')!;
  const kittyConfig = METRIC_CONFIGS.find(c => c.key === 'kittyDuties')!;

  const choreMetrics = [
    {
      config: dishesConfig,
      value: dishesValue,
      goal: dishesGoal,
      onIncrement: onDishesIncrement,
      onDecrement: onDishesDecrement,
      icon: LocalDining,
      label: 'Dish Duty'
    },
    {
      config: trashConfig,
      value: trashValue,
      goal: trashGoal,
      onIncrement: onTrashIncrement,
      onDecrement: onTrashDecrement,
      icon: Delete,
      label: 'Trash Takeouts'
    },
    {
      config: kittyConfig,
      value: kittyValue,
      goal: kittyGoal,
      onIncrement: onKittyIncrement,
      onDecrement: onKittyDecrement,
      icon: Pets,
      label: 'Kitty Care'
    }
  ];

  // Standard radial wheel dimensions - matching other components
  const radius = 80;
  const strokeWidth = 12; // Increased thickness
  const normalizedRadius = radius - strokeWidth / 2;

  // Calculate overall progress across all chore metrics
  const totalProgress = choreMetrics.reduce((sum, metric) => {
    const progress = metric.config.goalType === 'higher' 
      ? Math.min((metric.value / metric.goal) * 100, 100)
      : metric.goal > 0 
        ? Math.max(100 - ((metric.value / metric.goal) * 100), 0)
        : 100;
    return sum + progress;
  }, 0) / choreMetrics.length;

  const completedChores = choreMetrics.filter(metric => {
    const progress = metric.config.goalType === 'higher' 
      ? (metric.value / metric.goal) * 100
      : metric.goal > 0 
        ? Math.max(100 - ((metric.value / metric.goal) * 100), 0)
        : 100;
    return progress >= 100;
  }).length;

  const getEncouragement = () => {
    if (completedChores === 3) return "Home sweet home!";
    if (completedChores === 2) return "Almost perfect!";
    if (completedChores === 1) return "Great teamwork!";
    return "Let's make it sparkle!";
  };

  return (
    <div className="radial-wheel-dark group relative h-full flex flex-col">
      {/* Floating achievement indicator */}
      {completedChores === 3 && (
        <div className="absolute -top-2 -right-2 z-10">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold animate-bounce"
            style={{
              background: `linear-gradient(135deg, ${DARK_THEME.neon.green}, ${DARK_THEME.neon.cyan})`,
              boxShadow: `0 0 15px ${DARK_THEME.neon.green}80`
            }}
          >
            ✓
          </div>
        </div>
      )}

            {/* Simplified Header */}
      <div className="text-center mb-4">
        <h3 className="font-bold text-white text-lg mb-1">Household Chores</h3>
        <p className="text-sm text-gray-400">
          Weekly Progress
        </p>
      </div>

      {/* Cute Progress Ring */}
      <div className="relative mb-4 flex justify-center flex-1">
        <svg 
          className="transform -rotate-90 transition-all duration-500"
          width={200} 
          height={200}
          viewBox="0 0 200 200"
          style={{
            filter: completedChores === 3
              ? `drop-shadow(0 0 15px ${DARK_THEME.neon.green}60)` 
              : `drop-shadow(0 0 8px ${DARK_THEME.neon.green}30)`
          }}
        >
          <defs>
            <linearGradient id="chore-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>
            
            <linearGradient id="chore-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={DARK_THEME.neon.green} />
              <stop offset="100%" stopColor={DARK_THEME.neon.cyan} />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={100}
            cy={100}
            r={normalizedRadius}
            stroke="url(#chore-bg-gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            className="opacity-30"
          />

          {/* Progress arc */}
          <circle
            cx={100}
            cy={100}
            r={normalizedRadius}
            stroke="url(#chore-progress-gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${(totalProgress / 100) * (normalizedRadius * 2 * Math.PI)} ${normalizedRadius * 2 * Math.PI}`}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{
              filter: `drop-shadow(0 0 8px ${DARK_THEME.neon.green}60)`
            }}
          />

          <RadialCenterIcon
            Icon={Home}
            color={DARK_THEME.neon.green}
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
                style={{ color: DARK_THEME.neon.cyan }}
              >
                {completedChores}
              </span>
            </div>
            <div className="text-xs text-gray-400">Done</div>
          </div>
          <div className="text-gray-500 text-lg">/</div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">
              {choreMetrics.length}
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="text-gray-500 text-lg">=</div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: DARK_THEME.neon.cyan }}>
              {Math.round(totalProgress)}%
            </div>
            <div className="text-xs text-gray-400">Complete</div>
          </div>
        </div>
      </div>

      {/* Compact Chore Items */}
      <div className="space-y-2 mb-4">
        {choreMetrics.map((metric, index) => {
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
          background: `linear-gradient(135deg, ${DARK_THEME.neon.cyan}10, ${DARK_THEME.neon.green}10)`,
          color: '#9ca3af'
        }}
      >
        {getEncouragement()}
      </div>


    </div>
  );
};

export default ChoresComposite; 