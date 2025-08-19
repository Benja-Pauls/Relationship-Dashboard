# 💕 Relationship Dashboard

A beautiful, touch-friendly React app designed for couples to track relationship metrics and household tasks together. Perfect for a kitchen tablet or shared computer!

## ✨ Features

### 🏠 Main Dashboard
- **Love Sparks** (💕) - Track intimate moments 
- **Dish Duty** (🍽️) - Monitor daily dish washing
- **Trash Patrol** (🗑️) - Track hours trash stays full
- **Kitty Duties** (🐱) - Monitor pet care tasks
- **Finance Snapshot** (💰) - Combined account balances via Plaid
- Real-time updates with encouraging messages
- Monthly progress summaries

### 📈 Progress & Trends
- Interactive charts showing 7/14/30/90-day trends
- Current and longest streaks for each metric
- Monthly comparison bar charts
- Activity distribution pie charts
- Performance insights and achievements

### 💌 Love Notes & Messages
- Shared message board for partners
- Mark messages as read/unread and favorites
- Beautiful, emoji-rich interface
- Real-time message notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser
- (Optional) Plaid API credentials for real financial data

### Installation

1. **Clone and install dependencies:**
```bash
cd relationship-dashboard
npm install
```

2. **Start the development server:**
```bash
npm start
```

3. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

The app will automatically create sample data for testing!

## 🔧 Configuration

### Plaid Integration (Optional)
To connect real financial accounts:

1. **Get Plaid API credentials:**
   - Sign up at [Plaid Dashboard](https://dashboard.plaid.com)
   - Get your `client_id`, `secret`, and choose environment

2. **Create `.env` file in project root:**
```env
REACT_APP_PLAID_CLIENT_ID=your_client_id_here
REACT_APP_PLAID_SECRET=your_secret_here
REACT_APP_PLAID_ENV=sandbox  # or development/production
```

3. **Backend Setup (Required for Production):**
The Plaid integration requires a backend server to securely handle API calls. You'll need to:
- Set up a Node.js/Express backend
- Implement `/api/plaid/link/token/create` endpoint
- Implement `/api/plaid/accounts/balance/get` endpoint
- Handle token exchange and storage securely

### Data Storage
The app uses localStorage by default for quick setup. For production, consider:
- Setting up a proper database (PostgreSQL, MongoDB)
- Implementing user authentication
- Adding data backup/sync capabilities

## 📊 Data Schema

### CSV Format (sample-data.csv)
```csv
date,sexCount,dishesDone,trashFullHours,kittyDuties,financesBalance,notes
2024-01-01,1,1,0,1,15420.50,"Great start to the year! 💕"
```

### Metric Definitions
- **sexCount**: Number of intimate encounters (integer)
- **dishesDone**: Whether dishes were done that day (0 or 1)
- **trashFullHours**: Hours trash was full before being taken out (integer)
- **kittyDuties**: Whether cat care was completed (0 or 1)
- **financesBalance**: Combined account balance (optional, from Plaid)
- **notes**: Text messages between partners (JSON array in real storage)

## 🎨 Customization

### Metric Configuration
Edit `src/types/metrics.ts` to customize metrics:

```typescript
export const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'sexCount',
    friendlyLabel: 'Love Sparks',  // Change this!
    emoji: '💕',                   // Change this!
    color: 'love',
    goalType: 'higher'
  },
  // Add your own metrics...
];
```

### Styling
The app uses Tailwind CSS with custom color schemes:
- **Warm colors**: Earthy, cozy tones
- **Love colors**: Pink/magenta for romantic elements
- **Touch-friendly**: Large buttons (3rem minimum touch targets)

Edit `tailwind.config.js` to customize colors and spacing.

### Partner Labels
Change partner names in `src/components/NotesPage.tsx`:
```typescript
💕 Partner 1  →  💕 Your Name
🌟 Partner 2  →  🌟 Partner Name
```

## 📱 Deployment

### Kitchen Tablet Setup
1. **Use a tablet browser in kiosk mode**
2. **Enable "Add to Home Screen" for app-like experience**
3. **Adjust display timeout to prevent sleep**
4. **Consider touch screen calibration**

### Production Deployment
```bash
# Build for production
npm run build

# Deploy to your hosting service
# (Netlify, Vercel, Firebase Hosting, etc.)
```

### Environment Variables for Production
```env
REACT_APP_PLAID_CLIENT_ID=prod_client_id
REACT_APP_PLAID_SECRET=prod_secret
REACT_APP_PLAID_ENV=production
```

## 🛠️ Development

### Project Structure
```
src/
  components/          # React components
    Dashboard.tsx      # Main metrics display
    MetricCard.tsx     # Individual metric cards
    FinancialSummary.tsx # Plaid integration display
    TrendsPage.tsx     # Charts and analytics
    NotesPage.tsx      # Shared messaging
  services/            # Data and API services
    dataService.ts     # localStorage operations
    plaidService.ts    # Plaid API integration
  types/               # TypeScript definitions
    metrics.ts         # Data models and configs
```

### Adding New Metrics
1. Update `MetricEntry` interface in `types/metrics.ts`
2. Add configuration to `METRIC_CONFIGS` array
3. Update `DataService` methods as needed
4. Add UI components if required

### Available Scripts
```bash
npm start          # Development server
npm test           # Run tests
npm run build      # Production build
npm run eject      # Eject from Create React App (irreversible)
```

## 🎯 Roadmap & Ideas

### Potential Enhancements
- **Voice input** for hands-free metric updates
- **Mood tracking** with emoji selection
- **Photo integration** for daily memories
- **Gamification** with badges and achievements
- **Data export** to CSV/PDF for relationship insights
- **Reminder notifications** for daily check-ins
- **Mobile app** version with React Native
- **Multi-device sync** with cloud backend

### Bonus Features from Original Spec
- Daily check-in questions
- Customizable rewards/badges
- OpenAI integration for encouraging messages
- Voice commands for metric updates
- Photo-of-the-day feature

## 🤝 Contributing

This is a personal relationship tracking app, but feel free to:
- Fork for your own use
- Submit bug reports
- Suggest new features
- Share your customizations

## 💝 Made with Love

Built for couples who want to track their love and life together. Perfect for nerdy partners who appreciate data-driven insights into their relationship! 

**Happy tracking!** 📊💕
