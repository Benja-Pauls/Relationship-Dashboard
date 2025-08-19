import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Timeline, Assessment, EmojiEvents } from '@mui/icons-material';
import { DataService } from '../services/dataService';
import { MonthlyMetrics, METRIC_CONFIGS, DARK_THEME } from '../types/metrics';

interface ChartData {
  date: string;
  sexCount: number;
  dishesDone: number;
  trashFullHours: number;
  kittyDuties: number;
  formattedDate: string;
}

const TrendsPage: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyMetrics[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('sexCount');
  const [timeRange, setTimeRange] = useState<number>(30); // days

  useEffect(() => {
    loadTrendsData();
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTrendsData = () => {
    const entries = DataService.getLastNMonthsEntries(3);
    
    // Prepare daily chart data
    const processedData: ChartData[] = entries.map(entry => ({
      ...entry,
      formattedDate: new Date(entry.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));

    // Filter by time range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    const filteredData = processedData.filter(entry => 
      new Date(entry.date) >= cutoffDate
    ).slice(-timeRange);

    setChartData(filteredData);

    // Calculate monthly aggregates for the last 3 months
    const monthlyAggregates: MonthlyMetrics[] = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthEntries = entries.filter(entry => entry.date.startsWith(monthStr));
      
      if (monthEntries.length > 0) {
        const monthlyMetric: MonthlyMetrics = {
          month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          totalSexCount: monthEntries.reduce((sum, entry) => sum + entry.sexCount, 0),
          totalDishesDone: monthEntries.reduce((sum, entry) => sum + entry.dishesDone, 0),
          averageTrashFullHours: monthEntries.reduce((sum, entry) => sum + entry.trashFullHours, 0) / monthEntries.length,
          totalKittyDuties: monthEntries.reduce((sum, entry) => sum + entry.kittyDuties, 0),
          averageBalance: 0,
          dishesAdherencePercent: (monthEntries.filter(entry => entry.dishesDone > 0).length / monthEntries.length) * 100
        };
        monthlyAggregates.push(monthlyMetric);
      }
    }

    setMonthlyData(monthlyAggregates);
  };

  const getMetricConfig = (key: string) => {
    return METRIC_CONFIGS.find(config => config.key === key) || METRIC_CONFIGS[0];
  };

  const getChartColor = (metric: string) => {
    const config = getMetricConfig(metric);
    return config.neonColor;
  };

  return (
    <div className="h-full bg-black text-white p-6 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div 
              className="p-2 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${DARK_THEME.neon.green}, ${DARK_THEME.neon.cyan})`,
                boxShadow: `0 0 20px ${DARK_THEME.neon.green}40`
              }}
            >
              <Assessment sx={{ fontSize: 28, color: 'white' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                <span 
                  className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
                >
                  Analytics Dashboard
                </span>
              </h1>
              <p className="text-sm text-gray-300">Track your relationship trends</p>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8 flex justify-center">
          <div className="dark-card rounded-2xl p-2">
            {[7, 14, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-6 py-3 rounded-xl mr-2 last:mr-0 transition-all duration-300 font-medium ${
                  timeRange === days 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                style={timeRange === days ? {
                  background: `linear-gradient(135deg, ${DARK_THEME.neon.green}, ${DARK_THEME.neon.cyan})`,
                  boxShadow: `0 0 20px ${DARK_THEME.neon.green}40`
                } : {}}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Main Trend Chart */}
          <div className="xl:col-span-2 dark-card rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Timeline sx={{ fontSize: 32, color: DARK_THEME.neon.cyan }} />
                <h2 className="text-2xl font-bold">Daily Trends</h2>
              </div>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {METRIC_CONFIGS.map(config => (
                  <option key={config.key} value={config.key}>
                    {config.friendlyLabel}
                  </option>
                ))}
              </select>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="formattedDate"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: 'white'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={getChartColor(selectedMetric)}
                  strokeWidth={3}
                  dot={{ fill: getChartColor(selectedMetric), strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: getChartColor(selectedMetric) }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="dark-card rounded-3xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <EmojiEvents sx={{ fontSize: 24, color: DARK_THEME.neon.yellow }} />
                <h3 className="font-bold text-lg">Performance</h3>
              </div>
              <div className="text-center">
                <div 
                  className="text-4xl font-bold mb-2 neon-text"
                  style={{ color: DARK_THEME.neon.yellow }}
                >
                  A+
                </div>
                <p className="text-gray-400 text-sm">Overall Grade</p>
              </div>
            </div>

            <div className="dark-card rounded-3xl p-6">
              <h3 className="font-bold text-lg mb-4 text-center">Coming Soon</h3>
              <p className="text-gray-400 text-sm text-center">
                Advanced analytics, streak tracking, and predictive insights are being developed.
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="dark-card rounded-3xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Assessment sx={{ fontSize: 32, color: DARK_THEME.neon.purple }} />
            <h2 className="text-2xl font-bold">Monthly Comparison</h2>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="month"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'white'
                }}
              />
              <Bar dataKey="totalSexCount" fill={DARK_THEME.neon.pink} name="Love Sparks" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalDishesDone" fill={DARK_THEME.neon.cyan} name="Dishes Done" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalKittyDuties" fill={DARK_THEME.neon.purple} name="Kitty Care" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TrendsPage; 