#!/usr/bin/env python3
"""
One-time bank connection script for Relationship Dashboard.
Run this once to connect your 3 bank accounts, then never deal with it again.
"""

import os
import json
import webbrowser
from dotenv import load_dotenv
import plaid
from plaid.api import plaid_api
from plaid.configuration import Configuration
from plaid.api_client import ApiClient
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.products import Products

# Load environment variables
load_dotenv()

# Plaid configuration
PLAID_CLIENT_ID = os.getenv('PLAID_CLIENT_ID')
PLAID_SECRET = os.getenv('PLAID_PRODUCTION_API')
PLAID_ENV = 'production'

if not PLAID_CLIENT_ID or not PLAID_SECRET:
    print("❌ Error: PLAID_CLIENT_ID and PLAID_PRODUCTION_API must be set in .env file")
    exit(1)

configuration = Configuration(
    host=getattr(plaid.Environment, PLAID_ENV.capitalize(), plaid.Environment.Production),
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
    }
)

api_client = ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

STORAGE_FILE = 'account_setup.json'

def load_storage():
    if os.path.exists(STORAGE_FILE):
        with open(STORAGE_FILE, 'r') as f:
            return json.load(f)
    return {'access_tokens': [], 'account_categorizations': {}}

def save_storage(data):
    with open(STORAGE_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def create_link_token():
    """Create a link token for Plaid Link"""
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
        return response['link_token']
    except Exception as e:
        print(f"❌ Error creating link token: {str(e)}")
        return None

def exchange_public_token(public_token):
    """Exchange public token for access token"""
    try:
        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = client.item_public_token_exchange(request)
        return response['access_token'], response['item_id']
    except Exception as e:
        print(f"❌ Error exchanging token: {str(e)}")
        return None, None

def get_accounts(access_token):
    """Get accounts for an access token"""
    try:
        request = AccountsGetRequest(access_token=access_token)
        response = client.accounts_get(request)
        return response['accounts']
    except Exception as e:
        print(f"❌ Error getting accounts: {str(e)}")
        return []

def categorize_accounts(access_token, accounts):
    """Categorize accounts interactively"""
    storage = load_storage()
    
    print(f"\n📋 Found {len(accounts)} accounts. Let's categorize them:")
    print("Options: 'sydney', 'ben', 'investments', or 'skip'")
    
    for i, account in enumerate(accounts, 1):
        print(f"\n{i}. {account['name']}")
        print(f"   Type: {account['type']} - {account.get('subtype', 'N/A')}")
        print(f"   Balance: ${account['balances']['current']}")
        
        while True:
            owner = input(f"   Who owns this account? (sydney/ben/investments/skip): ").strip().lower()
            if owner in ['sydney', 'ben', 'investments', 'skip']:
                if owner != 'skip':
                    storage['account_categorizations'][account['account_id']] = owner
                    print(f"   ✅ Assigned to {owner.title()}")
                else:
                    print(f"   ⏭️  Skipped")
                break
            else:
                print("   Please enter 'sydney', 'ben', 'investments', or 'skip'")
    
    # Store access token
    if access_token not in storage['access_tokens']:
        storage['access_tokens'].append(access_token)
    
    save_storage(storage)
    return storage

def main():
    print("🏦 Relationship Dashboard - One-Time Bank Setup")
    print("=" * 50)
    
    storage = load_storage()
    
    if storage['access_tokens']:
        print(f"✅ You already have {len(storage['access_tokens'])} bank(s) connected:")
        total_accounts = len(storage['account_categorizations'])
        categorized = {
            'sydney': len([v for v in storage['account_categorizations'].values() if v == 'sydney']),
            'ben': len([v for v in storage['account_categorizations'].values() if v == 'ben']),
            'investments': len([v for v in storage['account_categorizations'].values() if v == 'investments'])
        }
        print(f"   Sydney: {categorized['sydney']} accounts")
        print(f"   Ben: {categorized['ben']} accounts") 
        print(f"   Investments: {categorized['investments']} accounts")
        
        add_more = input("\nDo you want to connect another bank? (y/n): ").strip().lower()
        if add_more != 'y':
            print("\n🎉 Your banks are already connected! Your dashboard should show real data.")
            return
    
    print("\nConnecting a new bank account...")
    print("This will open Plaid Link in your browser where you can:")
    print("1. Search for your bank")
    print("2. Enter your real login credentials") 
    print("3. Select which accounts to connect")
    
    input("Press Enter to continue...")
    
    # Create link token
    link_token = create_link_token()
    if not link_token:
        return
    
    # Open local Plaid Link HTML file
    html_file = os.path.abspath("plaid_link.html")
    link_url = f"file://{html_file}?token={link_token}"
    print(f"\n🌐 Opening Plaid Link in your browser...")
    print(f"If it doesn't open automatically, go to: {link_url}")
    
    webbrowser.open(link_url)
    
    print("\n📋 Instructions:")
    print("1. In the browser, connect your bank account")
    print("2. When done, you'll see a success page")
    print("3. Copy the 'public_token' from the URL or success page")
    print("4. Paste it below")
    
    # Get public token from user
    while True:
        public_token = input("\nPaste your public_token here: ").strip()
        if public_token.startswith('public-'):
            break
        else:
            print("❌ That doesn't look like a valid public token. It should start with 'public-'")
    
    # Exchange token
    print("\n🔄 Exchanging token...")
    access_token, item_id = exchange_public_token(public_token)
    if not access_token:
        return
    
    print("✅ Bank connected successfully!")
    
    # Get and categorize accounts
    accounts = get_accounts(access_token)
    if accounts:
        storage = categorize_accounts(access_token, accounts)
        
        print(f"\n🎉 Setup complete!")
        print(f"   Connected: {len(storage['access_tokens'])} banks")
        print(f"   Configured: {len(storage['account_categorizations'])} accounts")
        print(f"\n💰 Your dashboard should now show real financial data!")
        print(f"🌐 Go to: http://localhost:3000")
    else:
        print("❌ No accounts found. Please try again.")

if __name__ == "__main__":
    main() 