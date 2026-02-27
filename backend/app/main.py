from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .services.stock_service import StockService
from .services.reddit_service import RedditService
from .services.recommendation_engine import RecommendationEngine
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Stock Analysis & Sentiment API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
reddit_service = RedditService()

@app.get("/")
async def root():
    return {"message": "AI Stock Analysis & Sentiment API is running"}

@app.get("/api/stock/{ticker}")
async def get_stock_analysis(ticker: str):
    """
    Fetches full analysis for a given ticker:
    1. Stock Data & Technicals
    2. Reddit Sentiment
    3. Final Recommendation
    """
    try:
        # 1. Fetch Stock Data & Technical Indicators
        stock_data = StockService.get_stock_data(ticker)
        if not stock_data:
            raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found.")

        # 2. Fetch Reddit Sentiment Data
        sentiment_data = reddit_service.fetch_sentiment_data(ticker)

        # 3. Generate Final Recommendation
        recommendation = RecommendationEngine.get_recommendation(stock_data, sentiment_data)

        # Combine results
        return {
            "stock_data": stock_data,
            "sentiment_data": sentiment_data,
            "recommendation": recommendation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market-summary")
async def get_market_summary():
    """Fetches general market performance (S&P 500, Nasdaq, Dow Jones)."""
    try:
        return StockService.get_market_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
async def search_stock(q: str = Query(..., min_length=1)):
    """Search for stock tickers by company name or ticker prefix."""
    try:
        results = StockService.search_tickers(q)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    # Run from the current module context
    uvicorn.run(app, host="0.0.0.0", port=port)
