const express = require("express");
const fs = require("fs");
const { faker } = require("@faker-js/faker");

const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const app = express();
app.use(express.json()); // For parsing application/json

function generateTweet(hashtags) {
  const hashtag = hashtags[Math.floor(Math.random() * hashtags.length)];

  return {
    id: faker.string.uuid(),
    text: `${faker.lorem.sentence()} #${hashtag}`,
    created_at: new Date().toISOString(),
    hashtag,
    user: {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      screen_name: faker.internet.userName(),
    },
  };
}

app.post("/", (req, response) => {
  console.log("Client connected");
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");

  let requestedHashtags = req.body.hashtags || config.hashtags;
  let normalRate = config.tweetsPerMinute;
  let rate = normalRate;
  let anomalyHashtag = null;

  const sendTweet = () => {
    // Probability to use anomaly hashtag (we still want to send regular tweets)
    const useAnomalyHashtag = Math.random() < 0.6;
    // During anomaly, occasionally send a tweet with the anomaly hashtag
    const currentHashtags =
      anomalyHashtag && useAnomalyHashtag
        ? [anomalyHashtag]
        : requestedHashtags;
    const tweet = generateTweet(currentHashtags);
    response.write(`data: ${JSON.stringify(tweet)}\n\n`);
  };

  let interval = setInterval(sendTweet, 60000 / rate);

  // Setup anomaly to occur periodically
  const anomalyInterval = setInterval(() => {
    // Select a random hashtag for anomaly
    anomalyHashtag =
      requestedHashtags[Math.floor(Math.random() * requestedHashtags.length)];
    console.log(`Anomaly time for #${anomalyHashtag}`);
    clearInterval(interval); // Clear the current tweet interval
    rate = normalRate * 3; // Triple the rate for anomaly
    interval = setInterval(sendTweet, 60000 / rate); // Start a new interval for increased rate

    // After anomalyDuration, end the anomaly
    setTimeout(() => {
      anomalyHashtag = null; // Reset anomalyHashtag
      clearInterval(interval); // Clear increased rate interval
      rate = normalRate; // Reset rate to normal
      interval = setInterval(sendTweet, 60000 / rate); // Restart with normal rate
    }, config.anomalyDuration * 1000);
  }, config.anomalyAfterSeconds * 1000);

  // Handle client disconnection
  req.on("close", () => {
    if (interval) clearInterval(interval);
    if (anomalyInterval) clearInterval(anomalyInterval);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
