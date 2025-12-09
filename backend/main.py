from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from datetime import datetime, timedelta
import json
import requests
from dotenv import load_dotenv
import pytz

# Load environment variables from .env file (check both current and parent directory)
load_dotenv()  # Current directory
load_dotenv(dotenv_path='../.env')  # Parent directory

# Plaid imports
import plaid
from plaid.api import plaid_api
from plaid.configuration import Configuration
from plaid.api_client import ApiClient
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.products import Products

app = FastAPI(title="Relationship Dashboard API")

# CORS setup for React frontend
# For production, add your Amplify domain after deployment
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:3002').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Timezone setup
CST = pytz.timezone('US/Central')

# Plaid configuration
PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
PLAID_SECRET = os.getenv('PLAID_PRODUCTION_API')  # Using sandbox secret
PLAID_ENV = 'production'  # Change to 'development' or 'production' when ready

configuration = Configuration(
    host=getattr(plaid.Environment, PLAID_ENV.capitalize(), plaid.Environment.Sandbox),
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
    }
)

api_client = ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

# Data models
class PublicTokenExchange(BaseModel):
    public_token: str

class AccountCategorization(BaseModel):
    account_id: str
    owner: str  # 'sydney', 'ben', or 'investments'

class FinanceData(BaseModel):
    sydneyBalance: float
    benBalance: float
    investmentsBalance: float
    sydneyWeeklyChange: float
    benWeeklyChange: float
    investmentsWeeklyChange: float

class MetricEntry(BaseModel):
    date: str
    sexCount: int = 0
    qualityTimeHours: int = 0
    dishesDone: int = 0
    trashFullHours: int = 0
    kittyDuties: int = 0

class MetricUpdate(BaseModel):
    metric: str
    increment: int

class Note(BaseModel):
    id: Optional[str] = None
    content: str
    author: str  # 'partner1' or 'partner2'
    timestamp: Optional[str] = None
    isRead: bool = False
    isFavorite: bool = False

class WeeklyMetrics(BaseModel):
    weekStart: str
    sexCount: int = 0
    qualityTimeHours: int = 0
    dishesDone: int = 0
    trashTargetHours: int = 0
    kittyDuties: int = 0

class SpendingTransaction(BaseModel):
    amount: float
    tag: str  # 'groceries', 'eating out', 'fun', 'clothes'
    person: str  # 'ben' or 'sydney'
    date: Optional[str] = None
    id: Optional[str] = None

# Data storage functions
def load_data_file(filename: str, default_data: dict = None) -> dict:
    """Load data from JSON file"""
    if default_data is None:
        default_data = {}
    
    if os.path.exists(filename):
        try:
            with open(filename, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            print(f"Error reading {filename}, using default data")
            return default_data
    return default_data

def save_data_file(filename: str, data: dict):
    """Save data to JSON file"""
    try:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
    except IOError as e:
        print(f"Error saving {filename}: {e}")

def get_current_week_start() -> str:
    """Get the start of the current week (Monday) in CST"""
    now = datetime.now(CST)
    days_since_monday = now.weekday()  # Monday is 0
    week_start = now - timedelta(days=days_since_monday)
    week_start = week_start.replace(hour=4, minute=0, second=0, microsecond=0)
    
    # If it's before 4am on Monday, use the previous week
    if now.weekday() == 0 and now.hour < 4:
        week_start -= timedelta(days=7)
    
    return week_start.strftime('%Y-%m-%d')

def get_current_day() -> str:
    """Get the current day in CST, accounting for 4am reset"""
    now = datetime.now(CST)
    
    # If it's before 4am, use the previous day
    if now.hour < 4:
        now -= timedelta(days=1)
    
    return now.strftime('%Y-%m-%d')

def get_time_until_reset() -> dict:
    """Get time until next reset for both daily and weekly"""
    now = datetime.now(CST)
    
    # Next daily reset (4am tomorrow, or 4am today if before 4am)
    next_daily = now.replace(hour=4, minute=0, second=0, microsecond=0)
    if now.hour >= 4:
        next_daily += timedelta(days=1)
    
    # Next weekly reset (4am next Monday)
    days_until_monday = (7 - now.weekday()) % 7
    if days_until_monday == 0 and now.hour >= 4:  # It's Monday after 4am
        days_until_monday = 7
    
    next_weekly = now + timedelta(days=days_until_monday)
    next_weekly = next_weekly.replace(hour=4, minute=0, second=0, microsecond=0)
    
    daily_seconds = int((next_daily - now).total_seconds())
    weekly_seconds = int((next_weekly - now).total_seconds())
    
    return {
        'daily_reset_in_seconds': daily_seconds,
        'weekly_reset_in_seconds': weekly_seconds,
        'daily_reset_time': next_daily.isoformat(),
        'weekly_reset_time': next_weekly.isoformat()
    }

def cleanup_old_messages():
    """Remove messages older than 24 hours"""
    messages_data = load_data_file('messages.json', {'messages': []})
    current_day = get_current_day()
    
    # Filter messages to only keep today's
    messages_data['messages'] = [
        msg for msg in messages_data['messages'] 
        if msg.get('timestamp', '').startswith(current_day)
    ]
    
    save_data_file('messages.json', messages_data)

def archive_weekly_data():
    """Archive current week's data to analytics and reset current metrics"""
    current_week = get_current_week_start()
    metrics_data = load_data_file('current_metrics.json', {})
    analytics_data = load_data_file('analytics_data.json', {'weekly_history': []})
    
    # Archive current week if it exists
    if 'current_week' in metrics_data and metrics_data['current_week']['week_start'] != current_week:
        analytics_data['weekly_history'].append(metrics_data['current_week'])
        
        # Keep only last 12 weeks for analytics
        analytics_data['weekly_history'] = analytics_data['weekly_history'][-12:]
        save_data_file('analytics_data.json', analytics_data)
    
    # Reset current week data
    metrics_data['current_week'] = {
        'week_start': current_week,
        'daily_entries': {},
        'weekly_totals': {
            'sexCount': 0,
            'qualityTimeHours': 0,
            'dishesDone': 0,
            'trashTargetHours': 0,
            'kittyDuties': 0
        }
    }
    
    save_data_file('current_metrics.json', metrics_data)

# Load existing setup data
setup_data = load_data_file('account_setup.json', {'access_tokens': [], 'account_categorizations': {}})
access_tokens: List[str] = setup_data.get('access_tokens', [])
account_categorizations: Dict[str, str] = setup_data.get('account_categorizations', {})

# Initialize data files on startup
def initialize_data():
    """Initialize data files with default structure"""
    current_week = get_current_week_start()
    current_day = get_current_day()
    
    # Initialize current metrics
    metrics_data = load_data_file('current_metrics.json', {})
    if 'current_week' not in metrics_data or metrics_data['current_week']['week_start'] != current_week:
        archive_weekly_data()
    
    # Ensure today's entry exists
    if 'current_week' in metrics_data:
        if current_day not in metrics_data['current_week']['daily_entries']:
            metrics_data['current_week']['daily_entries'][current_day] = {
                'date': current_day,
                'sexCount': 0,
                'qualityTimeHours': 0,
                'dishesDone': 0,
                'trashFullHours': 0,
                'kittyDuties': 0
            }
            save_data_file('current_metrics.json', metrics_data)
    
    # Initialize messages and clean old ones
    load_data_file('messages.json', {'messages': []})
    cleanup_old_messages()
    
    # Initialize analytics data
    load_data_file('analytics_data.json', {'weekly_history': []})
    
    # Initialize spending data
    load_data_file('spending.json', {'transactions': []})

# Initialize on startup
initialize_data()

@app.get("/")
async def root():
    return {"message": "Relationship Dashboard API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "plaid_configured": bool(PLAID_CLIENT_ID and PLAID_SECRET)}

@app.get("/api/reset_timers")
async def get_reset_timers():
    """Get time until next resets"""
    return get_time_until_reset()

# Metrics endpoints
@app.get("/api/metrics/today")
async def get_todays_metrics():
    """Get today's metric entry"""
    current_day = get_current_day()
    metrics_data = load_data_file('current_metrics.json', {})
    
    if 'current_week' not in metrics_data:
        initialize_data()
        metrics_data = load_data_file('current_metrics.json', {})
    
    daily_entry = metrics_data['current_week']['daily_entries'].get(current_day, {
        'date': current_day,
        'sexCount': 0,
        'qualityTimeHours': 0,
        'dishesDone': 0,
        'trashFullHours': 0,
        'kittyDuties': 0
    })
    
    return daily_entry

@app.get("/api/metrics/week")
async def get_weekly_metrics():
    """Get current week's aggregated metrics"""
    current_week = get_current_week_start()
    metrics_data = load_data_file('current_metrics.json', {})
    
    if 'current_week' not in metrics_data:
        initialize_data()
        metrics_data = load_data_file('current_metrics.json', {})
    
    weekly_data = metrics_data['current_week']['weekly_totals']
    weekly_data['weekStart'] = current_week
    
    return weekly_data

@app.post("/api/metrics/update")
async def update_metric(update: MetricUpdate):
    """Update a specific metric for today"""
    current_day = get_current_day()
    current_week = get_current_week_start()
    
    metrics_data = load_data_file('current_metrics.json', {})
    
    if 'current_week' not in metrics_data or metrics_data['current_week']['week_start'] != current_week:
        archive_weekly_data()
        metrics_data = load_data_file('current_metrics.json', {})
    
    # Ensure today's entry exists
    if current_day not in metrics_data['current_week']['daily_entries']:
        metrics_data['current_week']['daily_entries'][current_day] = {
            'date': current_day,
            'sexCount': 0,
            'qualityTimeHours': 0,
            'dishesDone': 0,
            'trashFullHours': 0,
            'kittyDuties': 0
        }
    
    # Update the metric
    daily_entry = metrics_data['current_week']['daily_entries'][current_day]
    if update.metric in daily_entry:
        old_value = daily_entry[update.metric]
        new_value = max(0, old_value + update.increment)
        daily_entry[update.metric] = new_value
        
        # Update weekly totals
        weekly_totals = metrics_data['current_week']['weekly_totals']
        if update.metric in weekly_totals:
            weekly_totals[update.metric] += (new_value - old_value)
            weekly_totals[update.metric] = max(0, weekly_totals[update.metric])
    
    save_data_file('current_metrics.json', metrics_data)
    return daily_entry

@app.get("/api/analytics/history")
async def get_analytics_history():
    """Get historical data for analytics"""
    analytics_data = load_data_file('analytics_data.json', {'weekly_history': []})
    current_metrics = load_data_file('current_metrics.json', {})
    
    # Include current week in history for analytics
    history = analytics_data['weekly_history'].copy()
    if 'current_week' in current_metrics:
        history.append(current_metrics['current_week'])
    
    return {'weekly_history': history}

# Messages endpoints
@app.get("/api/messages")
async def get_messages():
    """Get all messages for today"""
    cleanup_old_messages()
    messages_data = load_data_file('messages.json', {'messages': []})
    
    # Sort by timestamp, newest first
    messages = sorted(messages_data['messages'], key=lambda x: x.get('timestamp', ''), reverse=True)
    return {'messages': messages}

@app.post("/api/messages")
async def create_message(note: Note):
    """Create a new message"""
    cleanup_old_messages()
    messages_data = load_data_file('messages.json', {'messages': []})
    
    # Generate ID and timestamp
    new_message = {
        'id': str(len(messages_data['messages']) + int(datetime.now().timestamp())),
        'content': note.content,
        'author': note.author,
        'timestamp': datetime.now(CST).isoformat(),
        'isRead': False,
        'isFavorite': False
    }
    
    messages_data['messages'].append(new_message)
    save_data_file('messages.json', messages_data)
    
    return new_message

@app.put("/api/messages/{message_id}")
async def update_message(message_id: str, updates: dict):
    """Update a message (mark as read, favorite, etc.)"""
    messages_data = load_data_file('messages.json', {'messages': []})
    
    for message in messages_data['messages']:
        if message['id'] == message_id:
            message.update(updates)
            save_data_file('messages.json', messages_data)
            return message
    
    raise HTTPException(status_code=404, detail="Message not found")

@app.delete("/api/messages/{message_id}")
async def delete_message(message_id: str):
    """Delete a message"""
    messages_data = load_data_file('messages.json', {'messages': []})
    
    messages_data['messages'] = [msg for msg in messages_data['messages'] if msg['id'] != message_id]
    save_data_file('messages.json', messages_data)
    
    return {"message": "Message deleted"}

# Spending tracking endpoints
@app.get("/api/spending/transactions")
async def get_spending_transactions(month: Optional[str] = None):
    """Get all spending transactions, optionally filtered by month"""
    spending_data = load_data_file('spending.json', {'transactions': []})
    transactions = spending_data.get('transactions', [])
    
    # If month filter is provided (format: YYYY-MM), filter transactions
    if month:
        transactions = [t for t in transactions if t.get('date', '').startswith(month)]
    
    # Sort by date, newest first
    transactions.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    return {'transactions': transactions}

@app.post("/api/spending/transactions")
async def create_spending_transaction(transaction: SpendingTransaction):
    """Create a new spending transaction"""
    spending_data = load_data_file('spending.json', {'transactions': []})
    
    # Generate ID and date if not provided
    new_transaction = {
        'id': str(len(spending_data['transactions']) + int(datetime.now().timestamp())),
        'amount': transaction.amount,
        'tag': transaction.tag,
        'person': transaction.person,
        'date': transaction.date or datetime.now(CST).isoformat()
    }
    
    spending_data['transactions'].append(new_transaction)
    save_data_file('spending.json', spending_data)
    
    return new_transaction

@app.put("/api/spending/transactions/{transaction_id}")
async def update_spending_transaction(transaction_id: str, updates: dict):
    """Update a spending transaction"""
    spending_data = load_data_file('spending.json', {'transactions': []})
    
    for transaction in spending_data['transactions']:
        if transaction['id'] == transaction_id:
            transaction.update(updates)
            save_data_file('spending.json', spending_data)
            return transaction
    
    raise HTTPException(status_code=404, detail="Transaction not found")

@app.delete("/api/spending/transactions/{transaction_id}")
async def delete_spending_transaction(transaction_id: str):
    """Delete a spending transaction"""
    spending_data = load_data_file('spending.json', {'transactions': []})
    
    spending_data['transactions'] = [
        t for t in spending_data['transactions'] if t['id'] != transaction_id
    ]
    save_data_file('spending.json', spending_data)
    
    return {"message": "Transaction deleted"}

@app.get("/api/spending/stats")
async def get_spending_stats():
    """Get spending statistics aggregated by tag and person"""
    spending_data = load_data_file('spending.json', {'transactions': []})
    transactions = spending_data.get('transactions', [])
    
    # Group by month
    monthly_stats = {}
    
    for transaction in transactions:
        date_str = transaction.get('date', '')
        if not date_str:
            continue
        
        # Extract month (YYYY-MM)
        month = date_str[:7] if len(date_str) >= 7 else datetime.now(CST).strftime('%Y-%m')
        
        if month not in monthly_stats:
            monthly_stats[month] = {
                'total_by_tag': {'necessities': 0, 'eating out': 0, 'fun': 0, 'clothes': 0},
                'total_by_person': {'ben': 0, 'sydney': 0},
                'transaction_count': 0
            }
        
        stats = monthly_stats[month]
        tag = transaction.get('tag', '')
        person = transaction.get('person', '')
        amount = transaction.get('amount', 0)
        
        if tag in stats['total_by_tag']:
            stats['total_by_tag'][tag] += amount
        
        if person in stats['total_by_person']:
            stats['total_by_person'][person] += amount
        
        stats['transaction_count'] += 1
    
    # Calculate averages
    for month, stats in monthly_stats.items():
        stats['avg_by_tag'] = {
            tag: stats['total_by_tag'][tag] / max(1, stats['transaction_count']) 
            for tag in ['necessities', 'eating out', 'fun', 'clothes']
        }
    
    return {'monthly_stats': monthly_stats}

# Existing Plaid endpoints (unchanged)
@app.get("/connect", response_class=HTMLResponse)
async def connect():
    """One-time bank connection page - visit once per bank, then never again"""
    html = """
<!doctype html><html><body>
<h2>One-Time Bank Connection</h2>
<p>This will open Plaid Link to connect your banks. You only need to do this once per bank.</p>
<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
<script>
fetch('/api/create_link_token', {method:'POST'}).then(r=>r.json()).then(data=>{
  if (data.link_token) {
    const handler = Plaid.create({
      token: data.link_token,
      onSuccess: function(public_token, metadata) {
        document.body.innerHTML = '<p>Connecting...</p>';
        fetch('/api/exchange_public_token', {
          method:'POST', 
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ public_token })
        }).then(r=>r.json()).then(result=>{
          document.body.innerHTML = '<h3>✅ Connected!</h3><p>' + metadata.institution.name + ' has been connected.</p><p>You can close this page and refresh your dashboard.</p>';
        }).catch(err=>{
          document.body.innerHTML = '<h3>❌ Error</h3><p>Failed to save connection. Check console.</p>';
          console.error(err);
        });
      },
      onExit: function(err, metadata) { 
        if(err) {
          console.error(err);
          document.body.innerHTML = '<h3>❌ Cancelled</h3><p>Bank connection was cancelled.</p>';
        }
      }
    });
    handler.open();
  } else {
    document.body.innerHTML = '<h3>❌ Error</h3><p>Failed to create link token. Check server logs.</p>';
  }
}).catch(err=>{
  document.body.innerHTML = '<h3>❌ Error</h3><p>Failed to connect to server.</p>';
  console.error(err);
});
</script>
</body></html>"""
    return HTMLResponse(html)

@app.post("/api/create_link_token")
async def create_link_token():
    """Create a Plaid Link token for account linking"""
    try:
        user = LinkTokenCreateRequestUser(client_user_id='relationship_dashboard_user')
        
        request = LinkTokenCreateRequest(
            products=[Products('transactions')],
            client_name="Relationship Dashboard",
            country_codes=[CountryCode('US')],
            language='en',
            user=user
        )
        
        response = client.link_token_create(request)
        return {"link_token": response['link_token']}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating link token: {str(e)}")

@app.post("/api/exchange_public_token")
async def exchange_public_token(data: PublicTokenExchange):
    """Exchange public token for access token"""
    try:
        request = ItemPublicTokenExchangeRequest(
            public_token=data.public_token
        )
        
        response = client.item_public_token_exchange(request)
        access_token = response['access_token']
        
        # Store access token and save to file
        access_tokens.append(access_token)
        setup_data['access_tokens'] = access_tokens
        setup_data['account_categorizations'] = account_categorizations
        save_data_file('account_setup.json', setup_data)
        
        return {"access_token": access_token, "item_id": response['item_id']}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exchanging token: {str(e)}")

@app.get("/api/accounts")
async def get_accounts():
    """Get all linked accounts"""
    all_accounts = []
    
    for access_token in access_tokens:
        try:
            accounts_data = {
                "client_id": PLAID_CLIENT_ID,
                "secret": PLAID_SECRET,
                "access_token": access_token
            }
            r = requests.post("https://production.plaid.com/accounts/get", 
                            json=accounts_data, timeout=30)
            r.raise_for_status()
            response = r.json()
            
            for account in response.get('accounts', []):
                account_data = {
                    'account_id': account['account_id'],
                    'name': account['name'],
                    'type': account['type'],
                    'subtype': account.get('subtype'),
                    'balance': account['balances']['current'],
                    'available': account['balances']['available'],
                    'owner': account_categorizations.get(account['account_id'], 'ben')
                }
                all_accounts.append(account_data)
                
        except Exception as e:
            print(f"Error fetching accounts for token: {str(e)}")
            continue
    
    return {"accounts": all_accounts}

@app.post("/api/categorize_account")
async def categorize_account(categorization: AccountCategorization):
    """Categorize an account as belonging to Sydney, Ben, or Investments"""
    account_categorizations[categorization.account_id] = categorization.owner
    setup_data['access_tokens'] = access_tokens
    setup_data['account_categorizations'] = account_categorizations
    save_data_file('account_setup.json', setup_data)
    return {"message": f"Account categorized as {categorization.owner}"}

async def calculate_weekly_change(owner: str) -> float:
    """Calculate weekly spending/income change for an owner"""
    # This is a simplified implementation
    # In a real app, you'd analyze transactions from the past week vs previous week
    
    total_change = 0.0
    week_ago = datetime.now() - timedelta(days=7)
    
    for access_token in access_tokens:
        try:
            # Get transactions for the past 14 days to compare weeks
            start_date = (datetime.now() - timedelta(days=14)).date().isoformat()
            end_date = datetime.now().date().isoformat()
            
            transaction_data = {
                "client_id": PLAID_CLIENT_ID,
                "secret": PLAID_SECRET,
                "access_token": access_token,
                "start_date": start_date,
                "end_date": end_date
            }
            
            r = requests.post("https://production.plaid.com/transactions/get", 
                            json=transaction_data, timeout=30)
            
            if r.status_code != 200:
                print(f"Plaid transactions API error: {r.status_code} - {r.text}")
                continue
                
            response_data = r.json()
            transactions = response_data.get("transactions", [])
            
            # Filter transactions for accounts owned by this person
            for transaction in transactions:
                account_id = transaction['account_id']
                if account_categorizations.get(account_id) == owner:
                    # Only count transactions from the past week
                    date_value = transaction['date']
                    if isinstance(date_value, str):
                        transaction_date = datetime.strptime(date_value, '%Y-%m-%d')
                    else:
                        # Already a date object, convert to datetime
                        transaction_date = datetime.combine(date_value, datetime.min.time())
                    if transaction_date >= week_ago:
                        # Negative amount means money spent, positive means money received
                        total_change -= transaction['amount']
        
        except Exception as e:
            print(f"Error calculating weekly change: {str(e)}")
            continue
    
    # If no real transaction data found, return 0 instead of fake data
    if total_change == 0:
        print(f"No transactions found for {owner} in the past week")
        total_change = 0.0  # Return actual 0 instead of fake random numbers
    
    return total_change

@app.get("/api/balances")
async def get_balances():
    """Get aggregated financial data for the dashboard - subtracts credit cards"""
    # Initialize balances
    sydney_balance = 0.0
    ben_balance = 0.0
    investments_balance = 0.0
    
    for access_token in access_tokens:
        try:
            accounts_data = {
                "client_id": PLAID_CLIENT_ID,
                "secret": PLAID_SECRET,
                "access_token": access_token
            }
            r = requests.post("https://production.plaid.com/accounts/balance/get", 
                            json=accounts_data, timeout=30)
            r.raise_for_status()
            
            for acct in r.json().get("accounts", []):
                owner = account_categorizations.get(acct["account_id"], "ben")
                balance = acct["balances"].get("current", 0) or 0
                
                # For credit cards, subtract the balance (debt) from net worth
                if acct["type"] == "credit":
                    balance = -balance  # Convert debt to negative value
                
                # Aggregate by owner
                if owner == 'sydney':
                    sydney_balance += balance
                elif owner == 'ben':
                    ben_balance += balance
                elif owner == 'investments':
                    investments_balance += balance
                    
        except Exception as e:
            print(f"Error fetching balances for token: {str(e)}")
            continue
    
    # Skip weekly changes calculation to avoid blocking API calls
    # Since we're not displaying weekly changes, this makes the API much faster
    
    return {
        "sydney": {
            "balance": round(sydney_balance, 2),
            "weeklyChange": 0.0
        },
        "ben": {
            "balance": round(ben_balance, 2),
            "weeklyChange": 0.0
        },
        "investments": {
            "balance": round(investments_balance, 2),
            "weeklyChange": 0.0
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 