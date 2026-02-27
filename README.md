# AI Stock Analysis & Sentiment Web App

A full-stack application that combines traditional technical indicators with real-time Reddit sentiment analysis to provide stock recommendations.

## Features
- **Company Search:** Search by ticker (e.g., AAPL, TSLA, BTC-USD).
- **Technical Indicators:** RSI, MACD, 50-day SMA, 200-day SMA.
- **Sentiment Analysis:** Real-time sentiment score from r/stocks, r/investing, and r/wallstreetbets.
- **AI Recommendation:** BUY / SELL / HOLD logic based on combined data.
- **Dynamic Charts:** Historical price action visualization.

## Tech Stack
- **Backend:** Python FastAPI, PRAW (Reddit), yFinance, VADER NLP, Pandas-TA.
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Recharts, Lucide Icons.

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Reddit API Credentials (optional but recommended for live sentiment)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your Reddit credentials
# Use the -m flag to run the app as a module
python -m app.main
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Recommendation Algorithm
The recommendation is calculated using a scoring system (-4 to +4):

1. **RSI (Relative Strength Index):**
   - RSI < 30: +1 point (Oversold/Bullish)
   - RSI > 70: -1 point (Overbought/Bearish)
2. **Moving Average Crossover:**
   - Price > SMA(50) and Price > SMA(200): +1 point (Bullish Trend)
   - Price < SMA(50) and Price < SMA(200): -1 point (Bearish Trend)
3. **MACD (Moving Average Convergence Divergence):**
   - MACD > Signal: +1 point (Bullish Momentum)
   - MACD < Signal: -1 point (Bearish Momentum)
4. **Reddit Sentiment:**
   - Score > 0.15: +1 point (Bullish Social)
   - Score < -0.15: -1 point (Bearish Social)

**Final Outcome:**
- **BUY:** Score >= 2
- **SELL:** Score <= -2
- **HOLD:** Score between -1 and 1

---

## Future Improvements (ML-based)
- **LSTM Networks:** Use Long Short-Term Memory models for price prediction based on sequences.
- **Transformer-based Sentiment:** Replace VADER with a BERT-based model (e.g., FinBERT) for more nuanced financial sentiment analysis.
- **Correlation Engine:** Analyze how sentiment leads price movement (lag analysis).
- **Portfolio Tracking:** Add user accounts to track watched stocks.

---

## License
MIT
