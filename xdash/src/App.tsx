import React, { useEffect, useState } from "react";
import "./App.css"; // Ensure your styles are updated in App.css
import Chip from "./Chip";
import Chart from "./Chart";
import io from "socket.io-client";

// Assuming dataset is initially defined here, as you had it

const App: React.FC = () => {
  const [currentTrending, setCurrentTrending] = useState("...");
  const [flash, setFlash] = useState(false);
  const [dataset, setDataset] = useState({});

  useEffect(() => {
    // Connect to the WebSocket server
    const socket = io(process.env.REACT_APP_XEND as string, {
      transports: ["websocket"],
    });

    // Subscribe to `updateTrending` event
    socket.on("updateTrending", (data) => {
      console.log("UPDATE TRENDING", data);
      setCurrentTrending(`#${String(data).toUpperCase()}`);
      setFlash(true);
      setTimeout(() => setFlash(false), 1000); // Flash for 1 second
    });

    // Subscribe to `updateAnalytics` event
    socket.on("updateAnalytics", (data) => {
      console.log("UPDATE DATA", data);
      setDataset(data);
    });

    // Clean up on component unmount
    return () => {
      socket.off("updateTrending");
      socket.off("updateAnalytics");
      socket.close();
    };
  }, []);

  return (
    <div className="App">
      <div className={`CurrentlyTrending`}>
        <Chip text={`${currentTrending}`} flash={flash} />
      </div>
      <div className="ChartWrapper">
        <Chart dataset={dataset} />
      </div>
    </div>
  );
};

export default App;
