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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],  # React dev server on multiple ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Storage functions
def load_account_setup():
    """Load account setup from file"""
    setup_file = 'account_setup.json'
    if os.path.exists(setup_file):
        with open(setup_file, 'r') as f:
            return json.load(f)
    return {'access_tokens': [], 'account_categorizations': {}}

def save_account_setup(data):
    """Save account setup to file"""
    setup_file = 'account_setup.json'
    with open(setup_file, 'w') as f:
        json.dump(data, f, indent=2)

# Load existing setup data
setup_data = load_account_setup()
access_tokens: List[str] = setup_data.get('access_tokens', [])
account_categorizations: Dict[str, str] = setup_data.get('account_categorizations', {})

@app.get("/")
async def root():
    return {"message": "Relationship Dashboard API"}

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
        save_account_setup({
            'access_tokens': access_tokens,
            'account_categorizations': account_categorizations
        })
        
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
    save_account_setup({
        'access_tokens': access_tokens,
        'account_categorizations': account_categorizations
    })
    return {"message": f"Account categorized as {categorization.owner}"}

@app.get("/api/finance_data")
async def get_finance_data():
    """Get aggregated finance data for the dashboard"""
    try:
        # Get all accounts
        accounts_response = await get_accounts()
        accounts = accounts_response["accounts"]
        
        # Initialize balances
        sydney_balance = 0.0
        ben_balance = 0.0
        investments_balance = 0.0
        
        # Aggregate balances by owner
        for account in accounts:
            balance = account.get('balance', 0) or 0
            owner = account.get('owner', 'uncategorized')
            
            if owner == 'sydney':
                sydney_balance += balance
            elif owner == 'ben':
                ben_balance += balance
            elif owner == 'investments':
                investments_balance += balance
        
        # Calculate weekly changes (simplified - you might want to implement transaction analysis)
        # For now, using mock changes but you could analyze transactions from the past week
        sydney_weekly_change = await calculate_weekly_change('sydney')
        ben_weekly_change = await calculate_weekly_change('ben')
        investments_weekly_change = await calculate_weekly_change('investments')
        
        return FinanceData(
            sydneyBalance=round(sydney_balance, 2),
            benBalance=round(ben_balance, 2),
            investmentsBalance=round(investments_balance, 2),
            sydneyWeeklyChange=round(sydney_weekly_change, 2),
            benWeeklyChange=round(ben_weekly_change, 2),
            investmentsWeeklyChange=round(investments_weekly_change, 2)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching finance data: {str(e)}")

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
    
    # Calculate weekly changes (simplified)
    sydney_weekly_change = await calculate_weekly_change('sydney')
    ben_weekly_change = await calculate_weekly_change('ben')
    investments_weekly_change = await calculate_weekly_change('investments')
    
    return {
        "sydney": {
            "balance": round(sydney_balance, 2),
            "weeklyChange": round(sydney_weekly_change, 2)
        },
        "ben": {
            "balance": round(ben_balance, 2),
            "weeklyChange": round(ben_weekly_change, 2)
        },
        "investments": {
            "balance": round(investments_balance, 2),
            "weeklyChange": round(investments_weekly_change, 2)
        }
    }

@app.get("/api/accounts")
async def get_accounts_list():
    """Get detailed list of all accounts (for debugging/management)"""
    out = []
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
                
                out.append({
                    "account_id": acct["account_id"],
                    "name": acct["name"],
                    "type": acct["type"],
                    "subtype": acct.get("subtype"),
                    "balance": balance,
                    "available": acct["balances"].get("available"),
                    "owner": owner
                })
        except Exception as e:
            print(f"Error fetching accounts for token: {str(e)}")
            continue
    
    return {"accounts": out}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "plaid_configured": bool(PLAID_CLIENT_ID and PLAID_SECRET)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 