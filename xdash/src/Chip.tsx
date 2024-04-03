// Chip.tsx
import React from "react";
import "./Chip.css"; // Assuming you'll create a separate CSS file for the Chip component

interface ChipProps {
  text: string;
  flash: boolean;
}

const Chip: React.FC<ChipProps> = ({ text, flash }) => {
  return <div className={`Chip ${flash ? "flash" : ""}`}>{text}</div>;
};

export default Chip;
