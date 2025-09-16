import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Timeline, Assessment, EmojiEvents, TrendingUp, Favorite, LocalDining, Delete, Pets, AccountBalance, Schedule, Star } from '@mui/icons-material';
import { DataService } from '../services/dataService';
import { MetricEntry, METRIC_CONFIGS, DARK_THEME, PartnerFinances } from '../types/metrics';

interface AnalyticsData {
  relationshipScore: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: {
    week: string;
    loveScore: number;
    choreScore: number;
    overallScore: number;
  }[];
  goalAchievement: {
    metric: string;
    achieved: number;
    total: number;
    percentage: number;
    color: string;
  }[];
  trendData: {
    date: string;
    love: number;
    chores: number;
    overall: number;
    formattedDate: string;
  }[];
  insights: string[];
}

const TrendsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [partnerFinances, setPartnerFinances] = useState<PartnerFinances | null>(null);

  useEffect(() => {
    loadAnalyticsData();
    loadFinanceData();
  }, [timeRange]);

  const loadFinanceData = async () => {
    try {
      const finances = await DataService.getPartnerFinances();
      setPartnerFinances(finances);
    } catch (error) {
      console.error('Failed to load finance data for analytics:', error);
    }
  };

  const loadAnalyticsData = () => {
    const entries = DataService.getLastNMonthsEntries(3);
    const recentEntries = entries.slice(-timeRange);
    
    // Calculate relationship health score (0-100)
    const relationshipScore = calculateRelationshipScore(recentEntries);
    
    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(entries);
    
    // Weekly progress comparison
    const weeklyProgress = calculateWeeklyProgress(entries);
    
    // Goal achievement rates
    const goalAchievement = calculateGoalAchievement(recentEntries);
    
    // Trend data for charts
    const trendData = recentEntries.map(entry => ({
      date: entry.date,
      love: (entry.sexCount * 50) + (entry.qualityTimeHours * 10), // Love score
      chores: (entry.dishesDone * 25) + (entry.kittyDuties * 20) + Math.max(0, 50 - (entry.trashFullHours * 10)), // Chore score
      overall: 0, // Will be calculated
      formattedDate: new Date(entry.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
    
    // Calculate overall scores
    trendData.forEach(day => {
      day.overall = Math.round((day.love + day.chores) / 2);
    });
    
    // Generate insights
    const insights = generateInsights(recentEntries, relationshipScore);
    
    setAnalyticsData({
      relationshipScore,
      currentStreak,
      longestStreak,
      weeklyProgress,
      goalAchievement,
      trendData,
      insights
    });
  };

  const calculateRelationshipScore = (entries: MetricEntry[]): number => {
    if (entries.length === 0) return 0;
    
    const avgLove = entries.reduce((sum, e) => sum + e.sexCount, 0) / entries.length;
    const avgQualityTime = entries.reduce((sum, e) => sum + e.qualityTimeHours, 0) / entries.length;
    const avgDishes = entries.reduce((sum, e) => sum + e.dishesDone, 0) / entries.length;
    const avgKitty = entries.reduce((sum, e) => sum + e.kittyDuties, 0) / entries.length;
    const avgTrash = entries.reduce((sum, e) => sum + e.trashFullHours, 0) / entries.length;
    
    // Weight different metrics
    const loveScore = Math.min(100, (avgLove / 2) * 100); // Target 2/week
    const qualityTimeScore = Math.min(100, (avgQualityTime / 10) * 100); // Target 10h/week
    const choresScore = Math.min(100, (avgDishes / 0.85) * 100); // Target 85% adherence
    const kittyScore = Math.min(100, (avgKitty / 1) * 100); // Target daily
    const trashScore = Math.max(0, 100 - (avgTrash * 50)); // Lower is better
    
    return Math.round((loveScore * 0.3) + (qualityTimeScore * 0.25) + (choresScore * 0.2) + (kittyScore * 0.15) + (trashScore * 0.1));
  };

  const calculateStreaks = (entries: MetricEntry[]) => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      const hasGoodDay = entry.sexCount > 0 || entry.qualityTimeHours >= 2 || entry.dishesDone > 0;
      
      if (hasGoodDay) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        
        // If this is recent, count towards current streak
        const daysDiff = Math.floor((new Date().getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 7) currentStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    
    return { currentStreak, longestStreak };
  };

  const calculateWeeklyProgress = (entries: MetricEntry[]) => {
    const weeks: { [key: string]: MetricEntry[] } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(entry);
    });
    
    return Object.entries(weeks).slice(-8).map(([weekStart, weekEntries]) => {
      const loveScore = Math.min(100, (weekEntries.reduce((sum, e) => sum + e.sexCount, 0) / 2) * 100);
      const choreScore = Math.min(100, ((weekEntries.filter(e => e.dishesDone > 0).length / 7) * 100));
      
      return {
        week: new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        loveScore: Math.round(loveScore),
        choreScore: Math.round(choreScore),
        overallScore: Math.round((loveScore + choreScore) / 2)
      };
    });
  };

  const calculateGoalAchievement = (entries: MetricEntry[]) => {
    const achievements = METRIC_CONFIGS.map(config => {
      let achieved = 0;
      let total = entries.length;
      
      entries.forEach(entry => {
        const value = entry[config.key];
        const weeklyTarget = config.weeklyGoal / 7; // Daily target
        
        if (config.goalType === 'higher' && value >= weeklyTarget) achieved++;
        else if (config.goalType === 'lower' && value <= weeklyTarget) achieved++;
      });
      
      return {
        metric: config.friendlyLabel,
        achieved,
        total,
        percentage: total > 0 ? Math.round((achieved / total) * 100) : 0,
        color: config.neonColor
      };
    });
    
    return achievements;
  };

  const generateInsights = (entries: MetricEntry[], score: number): string[] => {
    const insights: string[] = [];
    
    if (score >= 85) {
      insights.push("🎉 Outstanding relationship health! You're both crushing your goals.");
    } else if (score >= 70) {
      insights.push("💪 Great progress! Small improvements could make a big difference.");
    } else if (score >= 50) {
      insights.push("📈 Room for growth. Focus on consistency in daily habits.");
    } else {
      insights.push("🎯 Let's get back on track! Start with small, achievable daily goals.");
    }
    
    // Love insights
    const avgLove = entries.reduce((sum, e) => sum + e.sexCount, 0) / entries.length;
    if (avgLove < 1) {
      insights.push("💕 Consider scheduling more intimate time together.");
    }
    
    // Quality time insights
    const avgQualityTime = entries.reduce((sum, e) => sum + e.qualityTimeHours, 0) / entries.length;
    if (avgQualityTime < 8) {
      insights.push("⏰ Try to increase quality time - aim for 1-2 hours daily.");
    }
    
    // Chore insights
    const dishesAdherence = (entries.filter(e => e.dishesDone > 0).length / entries.length) * 100;
    if (dishesAdherence < 70) {
      insights.push("🍽️ Dishes routine needs attention - consistency is key!");
    }
    
    return insights.slice(0, 4); // Limit to 4 insights
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return DARK_THEME.neon.green;
    if (score >= 70) return DARK_THEME.neon.cyan;
    if (score >= 50) return DARK_THEME.neon.yellow;
    return DARK_THEME.neon.pink;
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    return 'C-';
  };

  if (!analyticsData) {
    return (
      <div className="h-full bg-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Assessment sx={{ fontSize: 64, color: DARK_THEME.neon.cyan, marginBottom: 2 }} />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white p-6 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div 
              className="p-2 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${getScoreColor(analyticsData.relationshipScore)}, ${getScoreColor(analyticsData.relationshipScore)}80)`,
                boxShadow: `0 0 20px ${getScoreColor(analyticsData.relationshipScore)}40`
              }}
            >
              <Assessment sx={{ fontSize: 28, color: 'white' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                <span 
                  className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
                >
                  Relationship Analytics
                </span>
              </h1>
              <p className="text-sm text-gray-300">Data-driven insights for your partnership</p>
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Relationship Score */}
          <div className="radial-wheel-dark p-6 text-center">
            <div 
              className="text-4xl font-bold mb-2"
              style={{ color: getScoreColor(analyticsData.relationshipScore) }}
            >
              {analyticsData.relationshipScore}
            </div>
            <div className="text-sm text-gray-400 mb-1">Health Score</div>
            <div 
              className="text-lg font-bold"
              style={{ color: getScoreColor(analyticsData.relationshipScore) }}
            >
              {getScoreGrade(analyticsData.relationshipScore)}
            </div>
          </div>

          {/* Current Streak */}
          <div className="radial-wheel-dark p-6 text-center">
            <div className="text-4xl font-bold mb-2" style={{ color: DARK_THEME.neon.orange }}>
              {analyticsData.currentStreak}
            </div>
            <div className="text-sm text-gray-400 mb-1">Current Streak</div>
            <div className="text-xs text-gray-500">days</div>
          </div>

          {/* Best Streak */}
          <div className="radial-wheel-dark p-6 text-center">
            <div className="text-4xl font-bold mb-2" style={{ color: DARK_THEME.neon.purple }}>
              {analyticsData.longestStreak}
            </div>
            <div className="text-sm text-gray-400 mb-1">Best Streak</div>
            <div className="text-xs text-gray-500">days</div>
          </div>

          {/* Financial Impact */}
          <div className="radial-wheel-dark p-6 text-center">
            <div className="text-4xl font-bold mb-2" style={{ color: DARK_THEME.neon.green }}>
              {partnerFinances ? `$${Math.round((partnerFinances.sydneyBalance + partnerFinances.benBalance + partnerFinances.investmentsBalance) / 1000)}K` : '---'}
            </div>
            <div className="text-sm text-gray-400 mb-1">Net Worth</div>
            <div className="text-xs text-gray-500">combined</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Relationship Trend */}
          <div className="radial-wheel-dark p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp sx={{ fontSize: 24, color: DARK_THEME.neon.cyan }} />
              <h3 className="text-xl font-bold">Relationship Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analyticsData.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="formattedDate" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Area type="monotone" dataKey="overall" stroke={DARK_THEME.neon.cyan} fill={`${DARK_THEME.neon.cyan}20`} strokeWidth={2} />
                <Area type="monotone" dataKey="love" stroke={DARK_THEME.neon.pink} fill={`${DARK_THEME.neon.pink}10`} strokeWidth={2} />
                <Area type="monotone" dataKey="chores" stroke={DARK_THEME.neon.green} fill={`${DARK_THEME.neon.green}10`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Goal Achievement */}
          <div className="radial-wheel-dark p-6">
            <div className="flex items-center space-x-3 mb-4">
              <EmojiEvents sx={{ fontSize: 24, color: DARK_THEME.neon.yellow }} />
              <h3 className="text-xl font-bold">Goal Achievement</h3>
            </div>
            <div className="space-y-3">
              {analyticsData.goalAchievement.map(goal => (
                <div key={goal.metric} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">{goal.metric}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${goal.percentage}%`,
                          backgroundColor: goal.color
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold" style={{ color: goal.color }}>
                      {goal.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="radial-wheel-dark p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Timeline sx={{ fontSize: 24, color: DARK_THEME.neon.purple }} />
            <h3 className="text-xl font-bold">Weekly Progress</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
              <Bar dataKey="loveScore" fill={DARK_THEME.neon.pink} name="Love Score" radius={[2, 2, 0, 0]} />
              <Bar dataKey="choreScore" fill={DARK_THEME.neon.cyan} name="Chore Score" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="radial-wheel-dark p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Star sx={{ fontSize: 24, color: DARK_THEME.neon.yellow }} />
            <h3 className="text-xl font-bold">AI Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyticsData.insights.map((insight, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl border"
                style={{
                  background: `linear-gradient(135deg, ${DARK_THEME.neon.yellow}10, transparent)`,
                  borderColor: `${DARK_THEME.neon.yellow}30`
                }}
              >
                <p className="text-gray-200 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendsPage; 