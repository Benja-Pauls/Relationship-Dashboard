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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const entry = DataService.getTodaysEntry();
      const weekly = DataService.getCurrentWeekMetrics();
      
      setTodaysEntry(entry);
      setWeeklyMetrics(weekly);
      
      // Try to load finances, but don't fail if it errors
      try {
        const finances = await DataService.getPartnerFinances();
        setPartnerFinances(finances);
      } catch (financeError) {
        console.error('Finance data failed to load:', financeError);
        setPartnerFinances(null); // This will show error state in DualFinanceWheel
      }
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

    if (progress >= 100) return "You're amazing!";
    if (progress >= 75) return "So close!";
    if (progress >= 50) return "Halfway there!";
    if (progress >= 25) return "Beautiful start!";
    return "You've got this!";
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
          <p className="text-gray-500 text-sm mt-2">Preparing something magical</p>
        </div>
      </div>
    );
  }

  if (!todaysEntry || !weeklyMetrics) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center dark-card p-8 rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${DARK_THEME.neon.pink}, ${DARK_THEME.neon.purple})` }}>
            <span className="text-white text-2xl font-bold">!</span>
          </div>
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
            Try Again
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
    <div className="h-full text-white flex flex-col relative" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>

      
      {/* Clean, Purposeful Header */}
      <div className="px-6 py-3 border-b border-white/10 backdrop-blur-sm" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${DARK_THEME.neon.pink}, ${DARK_THEME.neon.purple})`,
                boxShadow: `0 0 20px ${DARK_THEME.neon.pink}40`
              }}
            >
              <Favorite sx={{ fontSize: 20, color: 'white' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Love & Life Dashboard
              </h1>
              <p className="text-sm text-gray-400">
                {currentDate} • Week {Math.ceil((new Date().getDate()) / 7)} Progress
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-lg font-bold">
                <span style={{ color: DARK_THEME.neon.green }}>{completedGoals}</span>
                <span className="text-gray-500">/{METRIC_CONFIGS.length}</span>
              </div>
              <div className="text-xs text-gray-400">Goals Complete</div>
            </div>
          </div>
        </div>
        
        {/* Improved Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Weekly Progress</span>
            <span className="text-sm font-bold" style={{ color: DARK_THEME.neon.cyan }}>
              {totalProgress}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${totalProgress}%`,
                background: totalProgress >= 80 
                  ? `linear-gradient(90deg, ${DARK_THEME.neon.green}, ${DARK_THEME.neon.cyan})`
                  : totalProgress >= 50
                  ? `linear-gradient(90deg, ${DARK_THEME.neon.cyan}, ${DARK_THEME.neon.purple})`
                  : `linear-gradient(90deg, ${DARK_THEME.neon.pink}, ${DARK_THEME.neon.purple})`,
                boxShadow: totalProgress >= 80 
                  ? `0 0 15px ${DARK_THEME.neon.green}60`
                  : `0 0 15px ${DARK_THEME.neon.cyan}40`
              }}
            />
          </div>
          {daysUntilReset > 0 && (
            <div className="text-right mt-1">
              <span className="text-xs text-gray-500">
                Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Better Balanced 3 Sections */}
      <div className="flex-1 p-4 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full max-h-full">
          {/* Love Section - More prominent */}
          <div className="lg:col-span-4 flex flex-col min-h-0">
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
          <div className="lg:col-span-4 flex flex-col min-h-0">
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
          
          {/* Finance Section - Three-way split */}
          <div className="lg:col-span-4 flex flex-col min-h-0">
            <DualFinanceWheel
              sydneyBalance={partnerFinances?.sydneyBalance || 0}
              benBalance={partnerFinances?.benBalance || 0}
              investmentsBalance={partnerFinances?.investmentsBalance || 0}
              sydneyWeeklyChange={0}
              benWeeklyChange={0}
              investmentsWeeklyChange={0}
              isLoading={!partnerFinances}
              error={partnerFinances ? undefined : "Unable to load financial data"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 