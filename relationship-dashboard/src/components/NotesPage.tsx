import React, { useState, useEffect } from 'react';
import { Add, Favorite, Star, Delete, Person, Schedule, Message } from '@mui/icons-material';
import { DataService } from '../services/dataService';
import { Note } from '../types/metrics';
import { DARK_THEME } from '../types/metrics';

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<'partner1' | 'partner2'>('partner1');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const loadedNotes = DataService.getNotes();
    // Sort notes by timestamp, newest first
    setNotes(loadedNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      DataService.addNote(newNoteContent.trim(), selectedAuthor);
      setNewNoteContent('');
      setShowAddForm(false);
      loadNotes();
    }
  };

  const handleToggleFavorite = (noteId: string, currentFavorite: boolean) => {
    DataService.updateNote(noteId, { isFavorite: !currentFavorite });
    loadNotes();
  };

  const handleMarkRead = (noteId: string) => {
    DataService.updateNote(noteId, { isRead: true });
    loadNotes();
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      DataService.deleteNote(noteId);
      loadNotes();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const getAuthorColor = (author: 'partner1' | 'partner2') => {
    return author === 'partner1' ? DARK_THEME.neon.orange : DARK_THEME.neon.purple;
  };

  const getAuthorIcon = (author: 'partner1' | 'partner2') => {
    return author === 'partner1' ? '💕' : '🌟';
  };

  const unreadCount = notes.filter(note => !note.isRead).length;
  const favoriteNotes = notes.filter(note => note.isFavorite);

  return (
    <div className="h-full bg-black text-white p-6 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div 
              className="p-2 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${DARK_THEME.neon.purple}, ${DARK_THEME.neon.pink})`,
                boxShadow: `0 0 20px ${DARK_THEME.neon.purple}40`
              }}
            >
              <Message sx={{ fontSize: 28, color: 'white' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                <span 
                  className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent"
                >
                  Love Messages
                </span>
              </h1>
              <p className="text-sm text-gray-300">Your shared communication hub</p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <div className="mt-4">
              <div 
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold animate-pulse"
                style={{
                  background: `linear-gradient(135deg, ${DARK_THEME.neon.pink}, ${DARK_THEME.neon.purple})`,
                  boxShadow: `0 0 30px ${DARK_THEME.neon.pink}60`
                }}
              >
                <Favorite sx={{ fontSize: 20, color: 'white' }} />
                <span className="text-white">
                  {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Add Note Section */}
        <div className="mb-8 text-center">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="tech-button-primary px-8 py-4 rounded-2xl font-medium text-lg"
              style={{
                background: `linear-gradient(135deg, ${DARK_THEME.neon.pink}, ${DARK_THEME.neon.purple})`,
                boxShadow: `0 8px 30px ${DARK_THEME.neon.pink}40, 0 0 20px ${DARK_THEME.neon.pink}30`
              }}
            >
              <Add sx={{ fontSize: 24, marginRight: 1 }} />
              Create New Message
            </button>
          ) : (
            <div className="dark-card-elevated rounded-3xl p-8 max-w-2xl mx-auto">
              <div className="flex items-center space-x-3 mb-6">
                <Add sx={{ fontSize: 32, color: DARK_THEME.neon.pink }} />
                <h3 className="text-2xl font-bold">Compose Message</h3>
              </div>
              
              {/* Author Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">From:</label>
                <div className="flex space-x-6 justify-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="partner1"
                      checked={selectedAuthor === 'partner1'}
                      onChange={(e) => setSelectedAuthor(e.target.value as 'partner1' | 'partner2')}
                      className="sr-only"
                    />
                    <div 
                      className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border-2 transition-all duration-300 ${
                        selectedAuthor === 'partner1' ? 'border-orange-400' : 'border-gray-600'
                      }`}
                      style={selectedAuthor === 'partner1' ? {
                        background: `linear-gradient(135deg, ${DARK_THEME.neon.orange}20, ${DARK_THEME.neon.orange}10)`,
                        boxShadow: `0 0 20px ${DARK_THEME.neon.orange}30`
                      } : {}}
                    >
                      <span className="text-2xl">💕</span>
                      <span className="font-medium text-white">Ben</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="partner2"
                      checked={selectedAuthor === 'partner2'}
                      onChange={(e) => setSelectedAuthor(e.target.value as 'partner1' | 'partner2')}
                      className="sr-only"
                    />
                    <div 
                      className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border-2 transition-all duration-300 ${
                        selectedAuthor === 'partner2' ? 'border-purple-400' : 'border-gray-600'
                      }`}
                      style={selectedAuthor === 'partner2' ? {
                        background: `linear-gradient(135deg, ${DARK_THEME.neon.purple}20, ${DARK_THEME.neon.purple}10)`,
                        boxShadow: `0 0 20px ${DARK_THEME.neon.purple}30`
                      } : {}}
                    >
                      <span className="text-2xl">🌟</span>
                      <span className="font-medium text-white">My Love</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Message Content */}
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your love message here..."
                className="w-full p-4 bg-gray-800 border border-gray-600 rounded-2xl resize-none h-32 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                autoFocus
              />

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className="flex-1 tech-button-primary py-3 rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: !newNoteContent.trim() 
                      ? 'linear-gradient(135deg, #666, #555)' 
                      : `linear-gradient(135deg, ${DARK_THEME.neon.pink}, ${DARK_THEME.neon.purple})`
                  }}
                >
                  Send Message
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewNoteContent('');
                  }}
                  className="flex-1 tech-button py-3 rounded-2xl font-medium bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Favorite Notes Section */}
        {favoriteNotes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Star sx={{ fontSize: 32, color: DARK_THEME.neon.yellow }} />
              <h2 className="text-2xl font-bold">Favorite Messages</h2>
            </div>
            <div className="grid gap-6">
              {favoriteNotes.slice(0, 3).map((note) => (
                <div 
                  key={`fav-${note.id}`} 
                  className="dark-card rounded-3xl p-6 border"
                  style={{
                    borderColor: DARK_THEME.neon.yellow + '40',
                    background: `linear-gradient(135deg, ${DARK_THEME.neon.yellow}10, transparent)`
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-3xl">{getAuthorIcon(note.author)}</span>
                    <div className="flex-1">
                      <p className="text-gray-200 leading-relaxed text-lg">{note.content}</p>
                    </div>
                    <Star sx={{ fontSize: 24, color: DARK_THEME.neon.yellow }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Messages */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <Message sx={{ fontSize: 32, color: DARK_THEME.neon.cyan }} />
            <h2 className="text-2xl font-bold">All Messages</h2>
          </div>
          
          {notes.length === 0 ? (
            <div className="dark-card rounded-3xl p-12 text-center">
              <Favorite sx={{ fontSize: 64, color: DARK_THEME.neon.pink, marginBottom: 2 }} />
              <h3 className="text-xl font-bold mb-2">No messages yet</h3>
              <p className="text-gray-400">Start by creating your first love message!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className={`dark-card rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] ${
                    !note.isRead ? 'border' : ''
                  }`}
                  style={!note.isRead ? {
                    borderColor: getAuthorColor(note.author) + '60',
                    background: `linear-gradient(135deg, ${getAuthorColor(note.author)}10, transparent)`,
                    boxShadow: `0 0 20px ${getAuthorColor(note.author)}20`
                  } : {}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                        style={{
                          background: `linear-gradient(135deg, ${getAuthorColor(note.author)}, ${getAuthorColor(note.author)}80)`,
                          boxShadow: `0 0 15px ${getAuthorColor(note.author)}40`
                        }}
                      >
                        {getAuthorIcon(note.author)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span 
                            className="font-bold"
                            style={{ color: getAuthorColor(note.author) }}
                          >
                            {note.author === 'partner1' ? 'Ben' : 'My Love'}
                          </span>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <Schedule sx={{ fontSize: 16 }} />
                            <span className="text-sm">
                              {formatTimestamp(note.timestamp)}
                            </span>
                          </div>
                          {!note.isRead && (
                            <div 
                              className="px-3 py-1 rounded-full text-xs font-bold animate-pulse"
                              style={{
                                background: getAuthorColor(note.author),
                                color: 'white'
                              }}
                            >
                              NEW
                            </div>
                          )}
                        </div>
                        <p className="text-gray-200 leading-relaxed text-lg">{note.content}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 ml-4">
                      {!note.isRead && (
                        <button
                          onClick={() => handleMarkRead(note.id)}
                          className="tech-button w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-gray-700 transition-colors"
                          title="Mark as read"
                        >
                          <Person sx={{ fontSize: 20, color: '#9ca3af' }} />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleFavorite(note.id, note.isFavorite)}
                        className={`tech-button w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          note.isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'
                        }`}
                        title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star 
                          sx={{ 
                            fontSize: 20,
                            color: note.isFavorite ? DARK_THEME.neon.yellow : '#9ca3af'
                          }} 
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="tech-button w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete message"
                      >
                        <Delete sx={{ fontSize: 20 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage; 