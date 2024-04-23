import "./App.css";
import io from "socket.io-client";
import { useState } from "react";

// Connect to the server URL
const socket = io.connect("http://localhost:3001");

export default function App() {
  const [sliderValue, setSliderValue] = useState(50); // Initial value set to 50

  const handleSliderChange = (event) => {
    const newValue = event.target.value;
    setSliderValue(newValue);
    console.log("Slider Value:", newValue);

    // Send the slider value using socket
    socket.emit("send_message", { message: `Slider value is ${newValue}` });
  };

  return (
    <div className="App">
      <h1>Slider Control</h1>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        onChange={handleSliderChange}
      />
      <p>Slider Value: {sliderValue}</p>
    </div>
  );
}
