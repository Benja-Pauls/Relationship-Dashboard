# Relationship Dashboard Backend

FastAPI backend with real Plaid integration for the Relationship Dashboard.

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Make sure your `.env` file (in the root directory) contains:

```env
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SANDBOX_API=your_plaid_sandbox_secret
```

### 3. Run the Backend

```bash
python main.py
```

The backend will start on `http://localhost:8000`

### 4. API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.

## API Endpoints

- `POST /api/create_link_token` - Create Plaid Link token
- `POST /api/exchange_public_token` - Exchange public token for access token
- `GET /api/accounts` - Get all linked accounts
- `POST /api/categorize_account` - Categorize account by owner
- `GET /api/finance_data` - Get aggregated finance data for dashboard
- `GET /api/health` - Health check

## Usage Flow

1. **Frontend Integration**: The React app will call these endpoints
2. **Plaid Link**: Use the frontend Plaid Link to connect accounts
3. **Account Categorization**: Assign accounts to Sydney, Ben, or Investments
4. **Dashboard Display**: Real account balances will appear in the dashboard

## Development vs Production

Currently configured for Plaid **Sandbox** environment. To switch to production:

1. Change `PLAID_ENV = 'production'` in `main.py`
2. Use production Plaid credentials
3. Add proper database storage (currently using in-memory storage)

## Real Transaction Analysis

The `calculate_weekly_change` function analyzes real transactions to compute weekly spending changes. This provides actual spending behavior insights rather than mock data.

## Security Notes

- In production, use a proper database instead of in-memory storage
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Store access tokens securely 