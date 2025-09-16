import React, { useState, useEffect } from 'react';
import { Favorite, Add, Message, Schedule } from '@mui/icons-material';
import LoveComposite from './LoveComposite';
import DualFinanceWheel from './DualFinanceWheel';
import ChoresComposite from './ChoresComposite';
import { DataService } from '../services/dataService';
import { MetricEntry, WeeklyMetrics, PartnerFinances, METRIC_CONFIGS, DARK_THEME, Note } from '../types/metrics';

const Dashboard: React.FC = () => {
  const [todaysEntry, setTodaysEntry] = useState<MetricEntry | null>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetrics | null>(null);
  const [partnerFinances, setPartnerFinances] = useState<PartnerFinances | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddMessage, setShowAddMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedSender, setSelectedSender] = useState<'partner1' | 'partner2'>('partner1');
  const [resetTimers, setResetTimers] = useState<{ daily_reset_in_seconds: number; weekly_reset_in_seconds: number } | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadMessages();
    loadResetTimers();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadResetTimers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const loadedNotes = await DataService.getNotes();
      // Show only recent messages (last 5) and sort by newest first
      setNotes(loadedNotes.slice(0, 5));
    } catch (error) {
      console.error('Error loading messages:', error);
      setNotes([]);
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const isMessageExpanded = (messageId: string) => expandedMessages.has(messageId);

  const shouldTruncateMessage = (content: string) => content.length > 15;

  const loadResetTimers = async () => {
    try {
      const timers = await DataService.getResetTimers();
      setResetTimers(timers);
    } catch (error) {
      console.error('Error loading reset timers:', error);
    }
  };

  const handleAddMessage = async () => {
    if (newMessage.trim()) {
      try {
        await DataService.addNote(newMessage.trim(), selectedSender);
        setNewMessage('');
        setShowAddMessage(false);
        await loadMessages();
      } catch (error) {
        console.error('Error adding message:', error);
        alert('Failed to send message. Please try again.');
      }
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

  const formatTimeUntilReset = (seconds: number): string => {
    if (seconds <= 0) return 'Resetting...';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
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
      const [entry, weekly] = await Promise.all([
        DataService.getTodaysEntry(),
        DataService.getCurrentWeekMetrics()
      ]);
      
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

  const handleMetricUpdate = async (metric: keyof Pick<MetricEntry, 'sexCount' | 'qualityTimeHours' | 'dishesDone' | 'trashFullHours' | 'kittyDuties'>, increment: number) => {
    try {
      const updatedEntry = await DataService.updateTodaysMetric(metric, increment);
      setTodaysEntry(updatedEntry);
      
      // Refresh weekly metrics
      const weekly = await DataService.getCurrentWeekMetrics();
      setWeeklyMetrics(weekly);
    } catch (error) {
      console.error('Error updating metric:', error);
      alert('Failed to update metric. Please try again.');
    }
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
          <button 
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
          >
            Retry
          </button>
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
    return sum + (isNaN(progress) ? 0 : progress);
  }, 0) / configs.length;

  const getProgressColor = (progress: number) => {
    if (isNaN(progress) || progress < 0) return DARK_THEME.neon.pink;
    if (progress >= 80) return DARK_THEME.neon.green;
    if (progress >= 60) return DARK_THEME.neon.cyan;
    if (progress >= 40) return DARK_THEME.neon.yellow;
    return DARK_THEME.neon.pink;
  };

  const safeProgress = isNaN(totalProgress) ? 0 : Math.round(totalProgress);

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Enhanced Header with Messages */}
      <div 
        className="flex-shrink-0 px-6 py-4 border-b"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderBottomColor: 'rgba(255, 255, 255, 0.15)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div 
              className="p-3 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${getProgressColor(totalProgress)}, ${getProgressColor(totalProgress)}80)`,
                boxShadow: `0 0 20px ${getProgressColor(totalProgress)}50`
              }}
            >
              <Favorite sx={{ fontSize: 24, color: 'white' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold mb-1">Relationship Dashboard</h1>
              <p className="text-sm text-gray-300">
                Weekly Progress: <span className="font-bold" style={{ color: getProgressColor(totalProgress) }}>{safeProgress}%</span>
              </p>
            </div>
          </div>
          
          {/* Messages Section in Header */}
          <div className="flex items-center space-x-4">
            {/* Recent Messages Display */}
            <div className="flex items-center space-x-1 max-w-2xl">
              {notes.length > 0 && (
                <div className="flex items-center space-x-1">
                  {notes.slice(0, 5).map((note) => {
                    const isExpanded = isMessageExpanded(note.id!);
                    const shouldTruncate = shouldTruncateMessage(note.content);
                    const displayContent = isExpanded || !shouldTruncate 
                      ? note.content 
                      : note.content.substring(0, 15) + '...';
                      
                    return (
                      <div 
                        key={note.id}
                        className={`relative px-2 py-1 rounded text-xs transition-all duration-200 cursor-pointer hover:scale-105 ${
                          isExpanded ? 'max-w-48' : 'max-w-24'
                        } ${shouldTruncate ? 'hover:shadow-lg' : ''}`}
                        style={{
                          background: `linear-gradient(135deg, ${getSenderColor(note.author)}25, ${getSenderColor(note.author)}15)`,
                          border: `1px solid ${getSenderColor(note.author)}50`,
                          boxShadow: isExpanded ? `0 2px 8px ${getSenderColor(note.author)}30` : 'none'
                        }}
                        title={`${getSenderName(note.author)}: ${note.content}`}
                        onClick={() => shouldTruncate ? toggleMessageExpansion(note.id!) : undefined}
                      >
                        <div 
                          className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: getSenderColor(note.author) }}
                        />
                        <span className="text-gray-100 text-xs font-medium">
                          {displayContent}
                        </span>
                        {shouldTruncate && !isExpanded && (
                          <span className="text-gray-400 text-xs ml-1">•••</span>
                        )}
                      </div>
                    );
                  })}
                  {notes.length > 5 && (
                    <div className="text-xs text-gray-400 px-2">
                      +{notes.length - 5} more
                    </div>
                  )}
                </div>
              )}
              
              {/* Add Message Button */}
              <button
                onClick={() => setShowAddMessage(!showAddMessage)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ml-2"
                style={{
                  background: `linear-gradient(135deg, ${DARK_THEME.neon.purple}, ${DARK_THEME.neon.pink})`,
                  boxShadow: `0 0 10px ${DARK_THEME.neon.purple}40`
                }}
                title="Add message"
              >
                <Add sx={{ fontSize: 14, color: 'white' }} />
              </button>
            </div>

            {/* Reset Timers */}
            {resetTimers && (
              <div className="text-right text-xs">
                <div className="flex items-center space-x-1 mb-1">
                  <Schedule sx={{ fontSize: 10 }} className="text-gray-400" />
                  <span className="text-gray-400">Weekly: {formatTimeUntilReset(resetTimers.weekly_reset_in_seconds)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Schedule sx={{ fontSize: 10 }} className="text-gray-400" />
                  <span className="text-gray-400">Daily: {formatTimeUntilReset(resetTimers.daily_reset_in_seconds)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Weekly Goal:</span>
            <div className="w-48 bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
              <div 
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${Math.min(safeProgress, 100)}%`,
                  background: `linear-gradient(90deg, ${getProgressColor(totalProgress)}, ${getProgressColor(totalProgress)}80)`,
                  boxShadow: `0 0 10px ${getProgressColor(totalProgress)}60`
                }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: getProgressColor(totalProgress) }}>
              {safeProgress}%
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">Live</span>
          </div>
        </div>

        {/* Message Creation Form */}
        {showAddMessage && (
          <div className="mt-3 p-3 rounded-xl bg-gray-800/60 border border-gray-600/50">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs text-gray-300">From:</span>
              <button
                onClick={() => setSelectedSender('partner1')}
                className={`w-4 h-4 rounded-full transition-all ${selectedSender === 'partner1' ? 'ring-2 ring-orange-400 scale-110' : ''}`}
                style={{ backgroundColor: DARK_THEME.neon.orange }}
              />
              <button
                onClick={() => setSelectedSender('partner2')}
                className={`w-4 h-4 rounded-full transition-all ${selectedSender === 'partner2' ? 'ring-2 ring-purple-400 scale-110' : ''}`}
                style={{ backgroundColor: DARK_THEME.neon.purple }}
              />
              <span className="text-xs text-gray-400">{getSenderName(selectedSender)}</span>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Quick message..."
                className="flex-1 p-2 bg-gray-700/80 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
              />
              <button
                onClick={handleAddMessage}
                disabled={!newMessage.trim()}
                className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                style={{
                  background: !newMessage.trim() ? '#666' : `linear-gradient(135deg, ${getSenderColor(selectedSender)}, ${getSenderColor(selectedSender)}80)`
                }}
              >
                Send
              </button>
              <button
                onClick={() => {
                  setShowAddMessage(false);
                  setNewMessage('');
                }}
                className="px-3 py-2 rounded-lg text-sm bg-gray-600 hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compact Main Content */}
      <div className="flex-1 p-4 min-h-0">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Love Only */}
          <div className="min-h-0">
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