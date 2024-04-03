# X-Pulse
Sample application for detecting trends on social media

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
 
 **Solution:** Custom service mocking API to deliver tweets in real time.

 ### Anomaly Definition
 What is considered an anomaly? It's something that's relevant to the user of the platform that's helping them notice current and past trends.
Hashtag with the biggest increase in posting rate between 10 and 30 seconds windows is considered trending.

### Posts archiving
Keeping tweets (posts) collection capped to 100,000 records is not a challenge by using capped collections in MongoDB.
However, archiving that data is more challenging and using capped collection would potentially result in data loss.
Mongo doesn't support conventional triggers. There's mongoose hooks feature, but for this scale and real-time data, Mongo Change Streams feature is more performant.
This would probably be the best way to go for production app.
In this case, for sake of simplicity, we'll assume new posts will be coming in only through this app, and archiving will be dealt with as part of new post creation process.

In addition, using transactions means running mongo in replica set mode. [Setting up docker was a bit tricky](https://medium.com/workleap/the-only-local-mongodb-replica-set-with-docker-compose-guide-youll-ever-need-2f0b74dd8384).

### Making collection platform agnostic
Analysing multiple streams of data (twitter, facebook...) is possible by making collection that persists data platform-agnostic.
That's why in XEnd (backend service), relevant data is stored as posts and adding new stream is just a matter of adding another source module.


## XMock - Twitter Mock service
Mock service is created to stream tweets for selected hashtags. It exposes API endpoint that's similar to Filtered Stream on `GET /stream` endpoint.
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

XMock post endpoint accepts `hashtags` in as query param to override hashtags from configuration (mimicking showing of tweets for only specific hashtags).

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

## XEnd - Monitoring App (Backend)
XEnd subscribes to XMock platform, and logs all tweets to the database. It provides statistics:
- Number of tweets per hash tag
- Number of anomalies

In XEnd, anomaly is defined as increased rate of tweets in given timeframe, for specific hashtag -- hashtag is trending.
It enables users to not miss out on important engagement opportunities, or to look in past which topics were trending and when.

XEnd employs following concept for data analysis:
- Shifting time window: analysis incoming stream of data to detect anomalies.
    - This is then triggering an alert if anomaly is detected
    - Anomaly is increased rate of incoming tweets in fixed time frame  (eg. last 10 seconds)


### Database

Collection "posts", capped at 100 000 entries after which oldest posts are moved to archived posts collection.
```
{
    "_id": UUID (mongo default),
    "postId": String,
    "text": String,
    "created_at": DateTime,
    "hashtag": String,
    "userId": String
    "platform": "xmock" | "facebook" ...
}
```



## Tasks
| Task                                      | Time      |
|-------------------------------------------|-----------|
| Project investigation & setup             | 1h        |
| XMock: design and implementation          | 2h        |
| XPulse: backend design and implementation | 6h        |
| Anomaly (trending detection)              | 2h        |
| Frontend                                  | 2h        |
