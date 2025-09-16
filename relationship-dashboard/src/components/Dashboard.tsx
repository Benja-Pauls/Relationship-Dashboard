import React, { useState, useEffect } from 'react';
import { Favorite, Speed, AutoAwesome, Add, Message, Person } from '@mui/icons-material';
import LoveComposite from './LoveComposite';
import DualFinanceWheel from './DualFinanceWheel';
import ChoresComposite from './ChoresComposite';
import { DataService } from '../services/dataService';
import { PlaidService } from '../services/plaidService';
import { MetricEntry, WeeklyMetrics, PartnerFinances, METRIC_CONFIGS, DARK_THEME, Note } from '../types/metrics';

const Dashboard: React.FC = () => {
  const [todaysEntry, setTodaysEntry] = useState<MetricEntry | null>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetrics | null>(null);
  const [partnerFinances, setPartnerFinances] = useState<PartnerFinances | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddMessage, setShowAddMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedSender, setSelectedSender] = useState<'partner1' | 'partner2'>('partner1');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    DataService.initializeSampleData();
    PlaidService.initializePlaidLink();
    loadData();
    loadMessages();
  }, []);

  const loadMessages = () => {
    const loadedNotes = DataService.getNotes();
    // Show only recent messages (last 5) and sort by newest first
    setNotes(loadedNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));
  };

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      DataService.addNote(newMessage.trim(), selectedSender);
      setNewMessage('');
      setShowAddMessage(false);
      loadMessages();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getSenderColor = (author: 'partner1' | 'partner2') => {
    return author === 'partner1' ? DARK_THEME.neon.orange : DARK_THEME.neon.purple;
  };

  const getSenderName = (author: 'partner1' | 'partner2') => {
    return author === 'partner1' ? 'Ben' : 'Sydney';
  };

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
    const updatedEntry = DataService.updateTodaysMetric(metric, increment);
    setTodaysEntry(updatedEntry);
    
    // Refresh weekly metrics
    const weekly = DataService.getCurrentWeekMetrics();
    setWeeklyMetrics(weekly);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!todaysEntry || !weeklyMetrics) {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-red-400">Error loading dashboard data</p>
        </div>
      </div>
    );
  }

  // Calculate overall progress for header
  const configs = METRIC_CONFIGS;
     const totalProgress = configs.reduce((sum, config) => {
     const weeklyValue = weeklyMetrics[config.key as keyof WeeklyMetrics] as number;
     const progress = config.goalType === 'higher' 
       ? Math.min((weeklyValue / config.weeklyGoal) * 100, 100)
       : config.weeklyGoal > 0 
         ? Math.max(100 - ((weeklyValue / config.weeklyGoal) * 100), 0)
         : 100;
     return sum + progress;
   }, 0) / configs.length;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return DARK_THEME.neon.green;
    if (progress >= 60) return DARK_THEME.neon.cyan;
    if (progress >= 40) return DARK_THEME.neon.yellow;
    return DARK_THEME.neon.pink;
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Dynamic Header */}
      <div 
        className="flex-shrink-0 px-6 py-5 border-b"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderBottomColor: 'rgba(255, 255, 255, 0.15)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${getProgressColor(totalProgress)}, ${getProgressColor(totalProgress)}80)`,
                boxShadow: `0 0 25px ${getProgressColor(totalProgress)}50`
              }}
            >
              <Favorite sx={{ fontSize: 28, color: 'white' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Relationship Dashboard</h1>
              <p className="text-sm text-gray-300">
                Weekly Progress: <span className="font-bold" style={{ color: getProgressColor(totalProgress) }}>{Math.round(totalProgress)}%</span>
              </p>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: getProgressColor(totalProgress) }}>
                {Math.round(totalProgress)}%
              </div>
              <div className="text-xs text-gray-400">Weekly Goal</div>
            </div>
            <div className="w-56 bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
              <div 
                className="h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${Math.min(totalProgress, 100)}%`,
                  background: `linear-gradient(90deg, ${getProgressColor(totalProgress)}, ${getProgressColor(totalProgress)}80)`,
                  boxShadow: `0 0 15px ${getProgressColor(totalProgress)}60`
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400 font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 min-h-0">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Love & Messages */}
          <div className="flex flex-col gap-6 min-h-0">
            <div className="flex-1">
              <LoveComposite
                loveSparksValue={todaysEntry.sexCount}
                loveSparksGoal={METRIC_CONFIGS.find(c => c.key === 'sexCount')?.weeklyGoal || 2}
                qualityTimeValue={todaysEntry.qualityTimeHours}
                qualityTimeGoal={METRIC_CONFIGS.find(c => c.key === 'qualityTimeHours')?.weeklyGoal || 10}
                onLoveSparksIncrement={() => handleMetricUpdate('sexCount', 1)}
                onLoveSparksDecrement={() => handleMetricUpdate('sexCount', -1)}
                onQualityTimeIncrement={() => handleMetricUpdate('qualityTimeHours', 1)}
                onQualityTimeDecrement={() => handleMetricUpdate('qualityTimeHours', -1)}
              />
            </div>
            
            {/* Enhanced Messages Post-it Board */}
            <div className="radial-wheel-dark p-5 max-h-96 border-2 border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${DARK_THEME.neon.purple}, ${DARK_THEME.neon.pink})`,
                      boxShadow: `0 0 15px ${DARK_THEME.neon.purple}40`
                    }}
                  >
                    <Message sx={{ fontSize: 20, color: 'white' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Daily Messages</h3>
                    <p className="text-xs text-gray-400">Quick notes & love</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddMessage(!showAddMessage)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${DARK_THEME.neon.purple}, ${DARK_THEME.neon.pink})`,
                    boxShadow: `0 0 15px ${DARK_THEME.neon.purple}40`
                  }}
                >
                  <Add sx={{ fontSize: 16, color: 'white' }} />
                </button>
              </div>

              {/* Enhanced Add Message Form */}
              {showAddMessage && (
                <div className="mb-4 p-4 rounded-xl bg-gray-800/60 border border-gray-600/50 backdrop-blur-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-xs text-gray-300 font-medium">From:</span>
                    <button
                      onClick={() => setSelectedSender('partner1')}
                      className={`w-5 h-5 rounded-full transition-all duration-200 ${selectedSender === 'partner1' ? 'ring-2 ring-orange-400 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: DARK_THEME.neon.orange, boxShadow: `0 0 10px ${DARK_THEME.neon.orange}60` }}
                    />
                    <button
                      onClick={() => setSelectedSender('partner2')}
                      className={`w-5 h-5 rounded-full transition-all duration-200 ${selectedSender === 'partner2' ? 'ring-2 ring-purple-400 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: DARK_THEME.neon.purple, boxShadow: `0 0 10px ${DARK_THEME.neon.purple}60` }}
                    />
                    <span className="text-xs text-gray-400">{getSenderName(selectedSender)}</span>
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write a quick love note..."
                    className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-xl resize-none h-20 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={handleAddMessage}
                      disabled={!newMessage.trim()}
                      className="flex-1 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: !newMessage.trim() ? '#666' : `linear-gradient(135deg, ${getSenderColor(selectedSender)}, ${getSenderColor(selectedSender)}80)`,
                        boxShadow: newMessage.trim() ? `0 4px 12px ${getSenderColor(selectedSender)}40` : 'none'
                      }}
                    >
                      Send Message
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMessage(false);
                        setNewMessage('');
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-600 hover:bg-gray-500 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Enhanced Messages List */}
              <div className="space-y-3 overflow-y-auto max-h-56">
                {notes.length === 0 ? (
                  <div className="text-center py-8">
                    <div 
                      className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${DARK_THEME.neon.purple}20, ${DARK_THEME.neon.pink}20)` }}
                    >
                      <Message sx={{ fontSize: 32, color: DARK_THEME.neon.purple }} />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">No messages yet</p>
                    <p className="text-xs text-gray-500 mt-1">Start your daily conversation!</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div 
                      key={note.id}
                      className="relative p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                      style={{
                        background: `linear-gradient(135deg, ${getSenderColor(note.author)}15, ${getSenderColor(note.author)}08)`,
                        border: `1px solid ${getSenderColor(note.author)}40`,
                        boxShadow: `0 2px 8px ${getSenderColor(note.author)}20`
                      }}
                    >
                      {/* Enhanced Sender Dot */}
                      <div 
                        className="absolute -top-2 -left-2 w-4 h-4 rounded-full border-2 border-gray-900 shadow-lg"
                        style={{ 
                          backgroundColor: getSenderColor(note.author),
                          boxShadow: `0 0 8px ${getSenderColor(note.author)}60`
                        }}
                      />
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-3">
                          <p className="text-sm text-gray-100 leading-relaxed font-medium">{note.content}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1 text-right">
                          <span className="text-xs font-bold" style={{ color: getSenderColor(note.author) }}>
                            {getSenderName(note.author)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(note.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Center Column - Finances */}
          <div className="min-h-0">
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

          {/* Right Column - Chores */}
          <div className="min-h-0">
            <ChoresComposite
              dishesValue={todaysEntry.dishesDone}
              dishesGoal={METRIC_CONFIGS.find(c => c.key === 'dishesDone')?.weeklyGoal || 6}
              trashValue={todaysEntry.trashFullHours}
              trashGoal={METRIC_CONFIGS.find(c => c.key === 'trashFullHours')?.weeklyGoal || 3}
              kittyValue={todaysEntry.kittyDuties}
              kittyGoal={METRIC_CONFIGS.find(c => c.key === 'kittyDuties')?.weeklyGoal || 7}
              onDishesIncrement={() => handleMetricUpdate('dishesDone', 1)}
              onDishesDecrement={() => handleMetricUpdate('dishesDone', -1)}
              onTrashIncrement={() => handleMetricUpdate('trashFullHours', 1)}
              onTrashDecrement={() => handleMetricUpdate('trashFullHours', -1)}
              onKittyIncrement={() => handleMetricUpdate('kittyDuties', 1)}
              onKittyDecrement={() => handleMetricUpdate('kittyDuties', -1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 