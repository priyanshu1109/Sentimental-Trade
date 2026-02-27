import yfinance as yf
import pandas as pd
import pandas_ta as ta
from typing import Dict, Any, List
import requests
import numpy as np
from datetime import datetime

class StockService:
    COUNTRY_FLAGS = {
        "India": "🇮🇳", "United States": "🇺🇸", "United Kingdom": "🇬🇧", "Canada": "🇨🇦",
        "Germany": "🇩🇪", "France": "🇫🇷", "Japan": "🇯🇵", "Australia": "🇦🇺",
        "China": "🇨🇳", "Brazil": "🇧🇷", "South Korea": "🇰🇷", "Netherlands": "🇳🇱",
        "Switzerland": "🇨🇭", "Hong Kong": "🇭🇰",
    }

    CURRENCY_SYMBOLS = {
        "INR": "₹", "USD": "$", "GBP": "£", "EUR": "€", "JPY": "¥",
        "CAD": "C$", "AUD": "A$", "CNY": "¥", "HKD": "HK$",
    }

    @staticmethod
    def search_tickers(query: str) -> List[Dict[str, Any]]:
        try:
            url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers)
            data = response.json()
            return [{"symbol": q.get("symbol"), "name": q.get("shortname"), "exchange": q.get("exchange")} for q in data.get("quotes", []) if q.get("quoteType") == "EQUITY"][:10]
        except: return []

    @staticmethod
    def format_df_to_dict(df: pd.DataFrame) -> List[Dict[str, Any]]:
        if df is None or df.empty: return []
        df = df.copy()
        df.columns = [str(col).split(' ')[0] for col in df.columns]
        results = []
        for metric, values in df.iterrows():
            row = {"metric": metric}
            for date, val in values.items():
                try:
                    num = pd.to_numeric(val, errors='coerce')
                    if pd.isna(num) or np.isinf(num): row[date] = "N/A"
                    elif abs(num) >= 1_000_000_000: row[date] = f"{num/1_000_000_000:.2f}B"
                    elif abs(num) >= 1_000_000: row[date] = f"{num/1_000_000:.2f}M"
                    else: row[date] = f"{num:.2f}"
                except: row[date] = "N/A"
            results.append(row)
        return results

    @staticmethod
    def get_stock_data(ticker: str, period: str = "1y") -> Dict[str, Any]:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        if df.empty: return None
        
        info = stock.info
        raw_price = info.get("currentPrice") or df["Close"].iloc[-1]
        current_price = float(raw_price) if raw_price else 0.0

        country = info.get("country", "")
        flag = StockService.COUNTRY_FLAGS.get(country, "🏳️")
        currency_code = info.get("currency", "USD")
        currency_symbol = StockService.CURRENCY_SYMBOLS.get(currency_code, currency_code)
        
        # Technicals
        df.ta.rsi(length=14, append=True)
        df.ta.macd(fast=12, slow=26, signal=9, append=True)
        df.ta.sma(length=50, append=True)
        df.ta.sma(length=200, append=True)
        
        # Notable Movements with safe News correlation
        news = stock.news[:15] if hasattr(stock, 'news') else []
        df['Pct_Change'] = pd.to_numeric(df['Close'].pct_change() * 100, errors='coerce').fillna(0)
        notable_df = df[abs(df['Pct_Change']) > 2.0].tail(5).reset_index()
        
        movements = []
        for _, row in notable_df.iterrows():
            date_str = row['Date'].strftime("%Y-%m-%d")
            
            # Safe reason lookup
            reason = "Market Volatility"
            for n in news:
                pub_time = n.get('providerPublishTime')
                if pub_time:
                    pub_date = datetime.fromtimestamp(pub_time).strftime("%Y-%m-%d")
                    if pub_date == date_str:
                        reason = n.get('title', "Significant Price Action")
                        break
            
            movements.append({
                "Date": date_str, 
                "Close": float(row['Close']), 
                "Pct_Change": round(float(row['Pct_Change']), 2), 
                "Reason": reason
            })

        last_row = df.iloc[-1]
        def safe_get(key):
            val = last_row.get(key, 0)
            return float(val) if pd.notnull(val) else 0.0

        indicators = {
            "rsi": safe_get("RSI_14"),
            "macd": safe_get("MACD_12_26_9"),
            "macd_signal": safe_get("MACDs_12_26_9"),
            "sma_50": safe_get("SMA_50"),
            "sma_200": safe_get("SMA_200"),
            "volume": int(last_row.get("Volume", 0))
        }

        earnings = []
        try:
            if not stock.income_stmt.empty and 'Basic EPS' in stock.income_stmt.index:
                eps = stock.income_stmt.loc['Basic EPS']
                for i, date in enumerate([str(col).split(' ')[0] for col in stock.income_stmt.columns]):
                    earnings.append({"Date": date, "EPS Actual": float(eps[i]) if pd.notnull(eps[i]) else "N/A", "Type": "Historical"})
        except: pass

        return {
            "ticker": ticker, "company_name": info.get("longName", ticker), "flag": flag,
            "currency_symbol": currency_symbol, "current_price": current_price,
            "sector": info.get("sector", "N/A"), "industry": info.get("industry", "N/A"),
            "description": info.get("longBusinessSummary", "N/A"),
            "indicators": indicators, "financials": {
                "income_statement": StockService.format_df_to_dict(stock.income_stmt),
                "balance_sheet": StockService.format_df_to_dict(stock.balance_sheet),
                "cash_flow": StockService.format_df_to_dict(stock.cashflow)
            },
            "earnings": earnings, "notable_movements": movements,
            "chart_data": df.tail(100).reset_index()[["Date", "Close"]].assign(Date=lambda d: d['Date'].dt.strftime("%Y-%m-%d")).to_dict(orient="records")
        }

    @staticmethod
    def get_market_summary() -> List[Dict[str, Any]]:
        indices = [{"s": "^GSPC", "n": "S&P 500", "c": "$"}, {"s": "^NSEI", "n": "Nifty 50", "c": "₹"}]
        data = []
        for i in indices:
            try:
                h = yf.Ticker(i["s"]).history(period="2d")
                if not h.empty:
                    p = float(h["Close"].iloc[-1])
                    cp = round(((p - h["Close"].iloc[0]) / h["Close"].iloc[0]) * 100, 2)
                    data.append({"symbol": i["n"], "price": f"{i['c']}{p:,.2f}", "change_pct": cp})
            except: continue
        return data
