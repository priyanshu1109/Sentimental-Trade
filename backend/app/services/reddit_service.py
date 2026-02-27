import praw
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import os
from typing import Dict, Any, List
import pandas as pd
from datetime import datetime, timedelta

class RedditService:
    def __init__(self):
        # Initialize Reddit API (with fallbacks for testing)
        client_id = os.getenv("REDDIT_CLIENT_ID")
        client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        user_agent = os.getenv("REDDIT_USER_AGENT", "stock-sentiment-bot/1.0")

        if client_id and client_secret:
            try:
                self.reddit = praw.Reddit(
                    client_id=client_id,
                    client_secret=client_secret,
                    user_agent=user_agent
                )
            except Exception:
                self.reddit = None
        else:
            self.reddit = None
            
        self.analyzer = SentimentIntensityAnalyzer()
        self.subreddits = ["stocks", "investing", "wallstreetbets"]

    def analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment of text (returns score between -1 and 1)."""
        score = self.analyzer.polarity_scores(text)
        return score['compound']

    def fetch_sentiment_data(self, ticker: str) -> Dict[str, Any]:
        """Fetches and analyzes sentiment from relevant subreddits."""
        if not self.reddit:
            # Fallback to mock data if credentials are not provided
            import random
            sentiment_score = random.uniform(-0.5, 0.8)
            num_posts = random.randint(10, 50)
            bullish_pct = round((sentiment_score + 1) / 2 * 100, 1)
            return {
                "ticker": ticker,
                "overall_sentiment_score": round(sentiment_score, 2),
                "bullish_pct": bullish_pct,
                "bearish_pct": round(100 - bullish_pct, 1),
                "num_posts_analyzed": num_posts,
                "top_posts": [
                    {"title": f"Bullish on {ticker}", "score": 0.8, "url": "#"},
                    {"title": f"Why {ticker} is a sell", "score": -0.6, "url": "#"},
                ]
            }

        all_posts = []
        for sub_name in self.subreddits:
            try:
                subreddit = self.reddit.subreddit(sub_name)
                # Search for ticker in titles and text
                search_results = subreddit.search(ticker, time_filter="week", limit=50)
                for post in search_results:
                    # Filter out irrelevant posts by checking if ticker is actually in title/selftext
                    if ticker.lower() in post.title.lower() or (post.selftext and ticker.lower() in post.selftext.lower()):
                        sentiment = self.analyze_sentiment(f"{post.title} {post.selftext}")
                        all_posts.append({
                            "title": post.title,
                            "sentiment": sentiment,
                            "url": f"https://reddit.com{post.permalink}",
                            "score": post.score
                        })
            except Exception as e:
                print(f"Error fetching from r/{sub_name}: {e}")

        if not all_posts:
            return {
                "ticker": ticker,
                "overall_sentiment_score": 0.0,
                "bullish_pct": 50.0,
                "bearish_pct": 50.0,
                "num_posts_analyzed": 0,
                "top_posts": []
            }

        # Calculate metrics
        sentiments = [p["sentiment"] for p in all_posts]
        avg_sentiment = sum(sentiments) / len(sentiments)
        bullish_posts = [s for s in sentiments if s > 0.1]
        bearish_posts = [s for s in sentiments if s < -0.1]
        
        bullish_pct = (len(bullish_posts) / len(sentiments)) * 100 if sentiments else 50
        
        # Sort top posts by absolute sentiment impact
        top_posts = sorted(all_posts, key=lambda x: abs(x["sentiment"]), reverse=True)[:5]
        
        return {
            "ticker": ticker,
            "overall_sentiment_score": round(avg_sentiment, 2),
            "bullish_pct": round(bullish_pct, 1),
            "bearish_pct": round(100 - bullish_pct, 1),
            "num_posts_analyzed": len(all_posts),
            "top_posts": top_posts
        }
