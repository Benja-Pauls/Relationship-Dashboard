import React, { useState, useEffect } from 'react';
import { Favorite, Speed, AutoAwesome } from '@mui/icons-material';
import LoveComposite from './LoveComposite';
import DualFinanceWheel from './DualFinanceWheel';
import ChoresComposite from './ChoresComposite';
import { DataService } from '../services/dataService';
import { PlaidService } from '../services/plaidService';
import { MetricEntry, WeeklyMetrics, PartnerFinances, METRIC_CONFIGS, DARK_THEME } from '../types/metrics';

const Dashboard: React.FC = () => {
  const [todaysEntry, setTodaysEntry] = useState<MetricEntry | null>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetrics | null>(null);
  const [partnerFinances, setPartnerFinances] = useState<PartnerFinances | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    DataService.initializeSampleData();
    PlaidService.initializePlaidLink();
    loadData();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    try {
      const entry = DataService.getTodaysEntry();
      const weekly = DataService.getCurrentWeekMetrics();
      const finances = DataService.getPartnerFinances();
      
      setTodaysEntry(entry);
      setWeeklyMetrics(weekly);
      setPartnerFinances(finances);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetricUpdate = (metric: keyof Pick<MetricEntry, 'sexCount' | 'qualityTimeHours' | 'dishesDone' | 'trashFullHours' | 'kittyDuties'>, increment: number) => {
    try {
      const updatedEntry = DataService.updateTodaysMetric(metric, increment);
      setTodaysEntry(updatedEntry);
      const updatedWeekly = DataService.getCurrentWeekMetrics();
      setWeeklyMetrics(updatedWeekly);
    } catch (error) {
      console.error('Error updating metric:', error);
    }
  };

    const getWeeklyValue = (config: any) => {
    if (!weeklyMetrics) return 0;

    switch (config.key) {
      case 'sexCount': return weeklyMetrics.sexCount;
      case 'qualityTimeHours': return weeklyMetrics.qualityTimeHours;
      case 'dishesDone': return weeklyMetrics.dishesDone;
      case 'trashFullHours': return weeklyMetrics.trashTargetHours;
      case 'kittyDuties': return weeklyMetrics.kittyDuties;
      default: return 0;
    }
  };

  const getDaysUntilReset = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    return daysUntilSunday === 7 ? 0 : daysUntilSunday;
  };

  const getTotalProgress = () => {
    if (!weeklyMetrics) return 0;
    
    let totalProgress = 0;
    METRIC_CONFIGS.forEach(config => {
      const weeklyValue = getWeeklyValue(config);
      const progress = config.goalType === 'higher' 
        ? Math.min((weeklyValue / config.weeklyGoal) * 100, 100)
        : config.weeklyGoal > 0 
          ? Math.max(100 - ((weeklyValue / config.weeklyGoal) * 100), 0)
          : 100;
      totalProgress += progress;
    });
    
    return Math.round(totalProgress / METRIC_CONFIGS.length);
  };

  const getCompletedGoals = () => {
    if (!weeklyMetrics) return 0;
    
    return METRIC_CONFIGS.filter(config => {
      const weeklyValue = getWeeklyValue(config);
      const progress = config.goalType === 'higher' 
        ? (weeklyValue / config.weeklyGoal) * 100
        : config.weeklyGoal > 0 
          ? Math.max(100 - ((weeklyValue / config.weeklyGoal) * 100), 0)
          : 100;
      return progress >= 100;
    }).length;
  };

  const getEncouragement = (config: any, weeklyValue: number, goal: number) => {
    const progress = config.goalType === 'higher' 
      ? (weeklyValue / goal) * 100 
      : goal > 0 ? Math.max(100 - ((weeklyValue / goal) * 100), 0) : 100;

    if (progress >= 100) return "🎉 You're amazing! ✨";
    if (progress >= 75) return "🌟 So close, love! 💕";
    if (progress >= 50) return "💪 Halfway there! 🦋";
    if (progress >= 25) return "🌸 Beautiful start! 💖";
    return "💫 You've got this! 🎀";
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div 
            className="w-20 h-20 rounded-full mx-auto animate-spin mb-6"
            style={{
              background: `conic-gradient(${DARK_THEME.neon.pink}, ${DARK_THEME.neon.cyan}, ${DARK_THEME.neon.green}, ${DARK_THEME.neon.purple}, ${DARK_THEME.neon.pink})`,
              boxShadow: `0 0 40px ${DARK_THEME.neon.pink}60`
            }}
          />
          <p className="text-gray-300 text-lg">Loading your love dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">✨ Preparing something magical ✨</p>
        </div>
      </div>
    );
  }

  if (!todaysEntry || !weeklyMetrics) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center dark-card p-8 rounded-3xl">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-red-400 mb-4">Oops! Something went wrong</p>
          <p className="text-gray-400 mb-6">We couldn't load your relationship data</p>
          <button 
            onClick={loadData}
            className="px-8 py-3 rounded-2xl font-medium text-white transition-all duration-200 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${DARK_THEME.neon.pink}, ${DARK_THEME.neon.purple})`,
              boxShadow: `0 8px 25px ${DARK_THEME.neon.pink}40`
            }}
          >
            💖 Try Again
          </button>
        </div>
      </div>
    );
  }

  const daysUntilReset = getDaysUntilReset();
  const totalProgress = getTotalProgress();
  const completedGoals = getCompletedGoals();
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="h-screen text-white overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>

      
      {/* Cute Header */}
      <div className="px-8 py-6 border-b border-white/10 backdrop-blur-sm" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
        <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
                style={{
                  background: `linear-gradient(135deg, #ff6b9d, #4ecdc4)`,
                  boxShadow: `0 0 30px rgba(255, 107, 157, 0.8), 0 0 60px rgba(78, 205, 196, 0.4)`
                }}
              >
                <Favorite sx={{ fontSize: 28, color: 'white' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  💕 Love & Life Dashboard 🌟
                </h1>
                <p className="text-gray-300 flex items-center space-x-2">
                  <span>{currentDate}</span>
                  <AutoAwesome sx={{ fontSize: 16, color: '#ffd700' }} />
                  <span className="text-xs">Crafted with love & sparkles ✨</span>
                </p>
              </div>
            </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                <span style={{ color: DARK_THEME.neon.green }}>{completedGoals}</span>
                <span className="text-gray-500">/{METRIC_CONFIGS.length}</span>
              </div>
              <div className="text-xs text-gray-400">Goals Complete</div>
            </div>
            <div className="flex items-center space-x-2">
              <Speed sx={{ fontSize: 18, color: DARK_THEME.neon.green }} />
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gray-300">All Systems Go</span>
            </div>
          </div>
        </div>
        
        {/* Cute Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 flex items-center space-x-2">
              <span>Weekly Progress</span>
              <span className="text-xs">🎯</span>
            </span>
            <span className="text-sm font-bold" style={{ color: DARK_THEME.neon.cyan }}>
              {totalProgress}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden backdrop-blur-sm">
            <div 
              className="h-3 rounded-full transition-all duration-1000 ease-out relative"
              style={{ 
                width: `${totalProgress}%`,
                background: `linear-gradient(90deg, #ff6b9d 0%, #4ecdc4 30%, #45b7d1 60%, #96ceb4 100%)`,
                boxShadow: `0 0 20px rgba(78, 205, 196, 0.6), 0 0 40px rgba(78, 205, 196, 0.3)`
              }}
            >
              {totalProgress >= 100 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>🌸 You're doing amazing! 💕</span>
            <span>{daysUntilReset}d to reset 🗓️✨</span>
          </div>
        </div>
      </div>

      {/* Main Content - Better Balanced 3 Sections */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Love Section - More prominent */}
          <div className="lg:col-span-4 flex flex-col">
            <LoveComposite
              loveSparksValue={getWeeklyValue(METRIC_CONFIGS[0])}
              loveSparksGoal={METRIC_CONFIGS[0].weeklyGoal}
              qualityTimeValue={getWeeklyValue(METRIC_CONFIGS[1])}
              qualityTimeGoal={METRIC_CONFIGS[1].weeklyGoal}
              onLoveSparksIncrement={() => handleMetricUpdate('sexCount', 1)}
              onLoveSparksDecrement={() => handleMetricUpdate('sexCount', -1)}
              onQualityTimeIncrement={() => handleMetricUpdate('qualityTimeHours', 1)}
              onQualityTimeDecrement={() => handleMetricUpdate('qualityTimeHours', -1)}
            />
          </div>
          
          {/* Chores Section - Balanced middle */}
          <div className="lg:col-span-4 flex flex-col">
            <ChoresComposite
              dishesValue={getWeeklyValue(METRIC_CONFIGS[2])}
              dishesGoal={METRIC_CONFIGS[2].weeklyGoal}
              trashValue={getWeeklyValue(METRIC_CONFIGS[3])}
              trashGoal={METRIC_CONFIGS[3].weeklyGoal}
              kittyValue={getWeeklyValue(METRIC_CONFIGS[4])}
              kittyGoal={METRIC_CONFIGS[4].weeklyGoal}
              onDishesIncrement={() => handleMetricUpdate('dishesDone', 1)}
              onDishesDecrement={() => handleMetricUpdate('dishesDone', -1)}
              onTrashIncrement={() => handleMetricUpdate('trashFullHours', 1)}
              onTrashDecrement={() => handleMetricUpdate('trashFullHours', -1)}
              onKittyIncrement={() => handleMetricUpdate('kittyDuties', 1)}
              onKittyDecrement={() => handleMetricUpdate('kittyDuties', -1)}
            />
          </div>
          
          {/* Finance Section - More spacious */}
          <div className="lg:col-span-4 flex flex-col">
            {partnerFinances && (
              <DualFinanceWheel
                partner1Balance={partnerFinances.partner1Balance}
                partner2Balance={partnerFinances.partner2Balance}
                partner1Change={partnerFinances.partner1Change}
                partner2Change={partnerFinances.partner2Change}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 