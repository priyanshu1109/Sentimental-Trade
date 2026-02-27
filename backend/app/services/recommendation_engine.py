from typing import Dict, Any, List

class RecommendationEngine:
    @staticmethod
    def get_recommendation(stock_data: Dict[str, Any], sentiment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Combines indicators and sentiment into a final recommendation."""
        
        indicators = stock_data["indicators"]
        sentiment_score = sentiment_data["overall_sentiment_score"]
        
        points = 0
        total_factors = 4
        reasons = []

        # RSI Logic
        rsi = indicators["rsi"]
        if rsi < 30:
            points += 1
            reasons.append(f"RSI is oversold at {rsi}, suggesting a potential reversal upward.")
        elif rsi > 70:
            points -= 1
            reasons.append(f"RSI is overbought at {rsi}, suggesting a potential correction.")
        else:
            reasons.append(f"RSI is neutral at {rsi}.")

        # Moving Average Crossover
        current_price = stock_data["current_price"]
        sma_50 = indicators["sma_50"]
        sma_200 = indicators["sma_200"]
        
        if current_price > sma_50 and current_price > sma_200:
            points += 1
            reasons.append(f"Price is above both 50-day and 200-day moving averages (Bullish Trend).")
        elif current_price < sma_50 and current_price < sma_200:
            points -= 1
            reasons.append(f"Price is below both 50-day and 200-day moving averages (Bearish Trend).")
        else:
            reasons.append(f"Moving averages are currently mixed.")

        # MACD
        macd = indicators["macd"]
        macd_signal = indicators["macd_signal"]
        if macd > macd_signal:
            points += 1
            reasons.append(f"MACD is above its signal line (Bullish momentum).")
        else:
            points -= 1
            reasons.append(f"MACD is below its signal line (Bearish momentum).")

        # Reddit Sentiment
        if sentiment_score > 0.15:
            points += 1
            reasons.append(f"Reddit sentiment is positive ({sentiment_score}), indicating high retail interest.")
        elif sentiment_score < -0.15:
            points -= 1
            reasons.append(f"Reddit sentiment is negative ({sentiment_score}), indicating caution among retail traders.")
        else:
            reasons.append(f"Social sentiment is currently neutral.")

        # Determine Recommendation
        recommendation = "HOLD"
        color = "yellow"
        
        # Max points = 4, Min points = -4
        if points >= 2:
            recommendation = "BUY"
            color = "green"
        elif points <= -2:
            recommendation = "SELL"
            color = "red"
            
        return {
            "ticker": stock_data["ticker"],
            "recommendation": recommendation,
            "score": points,
            "max_score": total_factors,
            "color": color,
            "reasons": reasons,
            "sentiment_weight": 0.25, # 1/4th of the decision
            "technical_weight": 0.75 # 3/4ths of the decision
        }
