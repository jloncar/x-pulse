import React from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const processData = (data: any) => {
  const sortedEntries = Object.entries(data).sort(
    (a, b) => (new Date(a[0]) as any) - (new Date(b[0]) as any)
  );
  const labels = sortedEntries.map(([key]) =>
    new Date(key).toLocaleTimeString()
  );
  const techData = sortedEntries.map(([, value]) => (value as any).tech);
  const newsData = sortedEntries.map(([, value]) => (value as any).news);
  const sportsData = sortedEntries.map(([, value]) => (value as any).sports);

  return {
    labels,
    datasets: [
      {
        label: "News",
        data: newsData,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
      },
      {
        label: "Tech",
        data: techData,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
      },
      {
        label: "Sports",
        data: sportsData,
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
      },
    ],
  };
};

const TimeSeriesChart = ({ dataset }: { dataset: any }) => {
  const data = processData(dataset);

  return <Line data={data} />;
};

export default TimeSeriesChart;
