# X-Pulse
Twitter hashtag monitoring platform.

## Installation
.

## Challenges

### Twitter API Paywall
Twitter API for streaming is for paid enterprise developer accounts only.
Obtaining this account would be cost prohibitive, so mock streaming solution has to be implemented.
As shown [here](https://developer.twitter.com/en/docs/twitter-api/getting-started/about-twitter-api#v2-access-level), Free tier cannot be used to pull tweets.

Following documentation is used as reference:
- https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction
- https://developer.twitter.com/en/docs/tutorials/stream-tweets-in-real-time
- https://developer.twitter.com/en/docs/tutorials/consuming-streaming-data
- https://developer.twitter.com/en/docs/twitter-api/enterprise/powertrack-api/overview
- https://developer.twitter.com/en/docs/twitter-api/data-dictionary/object-model/tweet
 

## Tasks
| Task                                      | Time      |
|-------------------------------------------|-----------|
| Project investigation & setup             | 1h        |
| Mock service implementation               | 2h        |


## XMock - Mock service
Mock service is created to stream tweets for selected hashtags. It exposes API endpoint that's similar to Filtered Stream.
It's producing tweets at configured rate for several hash tags.
After X seconds, tweets per minute is increased and likelyhood of having tweet for specific hashtag is increased ("hashtag is trending" anomaly).

```
{
  "hashtags": ["tech", "news", "sports"], # available hashtags
  "tweetsPerMinute": 20, # number of tweets per minute
  "anomalyAfterSeconds": 30, # when to trigger anomaly
  "anomalyDuration": 15 # how long anomaly lasts
}
```

XMock post endpoint accepts `hashtags` in body to override hashtags from configuration (mimicking showing of tweets for only specific hashtags).

Tweet object produced:
```
{
    "id": "8628b2ed-7e4a-4a7c-90d2-42b893045256",
    "text": "Optio suus velut viridis expedita. #news",
    "created_at": "2024-03-31T16:22:48.545Z",
    "hashtag": "news",
    "user": {
        "id": "1cadc7d3-2c68-489c-bbe6-6802551c563c",
        "name": "Erma Champlin",
        "screen_name": "Savion24"
    }
}
```

## XPulse - Monitoring App
XPulse subscribes to XMock platform, and logs all tweets to the database. It provides statistics:
- Number of tweets per hash tag
- Number of anomalies
In XPulse, anomaly is defined as increased rate of tweets in given timeframe, for specific hashtag -- hashtag is trending.
It enables users to not miss out on important engagement opportunities, or to look in past which topics were tranding and when.