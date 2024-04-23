import "./App.css";
import io from "socket.io-client";
import { useEffect, useState } from "react";

const socket = io.connect("http://localhost:3001");

export default function App() {
  const [squares, setSquares] = useState({});

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!squares[socket.id]) return; // If no square assigned yet, do nothing

      let newX = squares[socket.id].x;
      let newY = squares[socket.id].y;

      switch (event.key) {
        case "ArrowUp":
          newY -= 10;
          break;
        case "ArrowDown":
          newY += 10;
          break;
        case "ArrowLeft":
          newX -= 10;
          break;
        case "ArrowRight":
          newX += 10;
          break;
        default:
          return;
      }

      // Emit new position to server
      socket.emit("move_square", { id: socket.id, x: newX, y: newY });
    };

    window.addEventListener("keydown", handleKeyDown);

    socket.on("all_squares", (allSquares) => {
      setSquares(allSquares);
    });

    socket.on("new_square", (square) => {
      setSquares((prev) => ({ ...prev, [square.id]: square }));
    });

    socket.on("square_moved", (square) => {
      setSquares((prev) => ({ ...prev, [square.id]: square }));
    });

    socket.on("remove_square", (id) => {
      setSquares((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [squares]); // Include squares in the dependency array to re-run the effect when squares change

  return (
    <div className="App">
      {Object.values(squares).map((square) => (
        <div
          key={square.id}
          style={{
            left: `${square.x}px`,
            top: `${square.y}px`,
            position: "absolute",
            width: "50px",
            height: "50px",
            backgroundColor: square.color,
            opacity: 0.6, // Set opacity to 60%
          }}
        />
      ))}
    </div>
  );
}

// import "./App.css";
// import io from "socket.io-client";
// import { useState } from "react";

// // Connect to the server URL
// const socket = io.connect("http://localhost:3001");

// export default function App() {
//   const [sliderValue, setSliderValue] = useState(50); // Initial value set to 50

//   const handleSliderChange = (event) => {
//     const newValue = event.target.value;
//     setSliderValue(newValue);
//     console.log("Slider Value:", newValue);

//     // Send the slider value using socket
//     socket.emit("send_message", { message: `Slider value is ${newValue}` });
//   };

//   return (
//     <div className="App">
//       <h1>Slider Control</h1>
//       <input
//         type="range"
//         min="0"
//         max="100"
//         value={sliderValue}
//         onChange={handleSliderChange}
//       />
//       <p>Slider Value: {sliderValue}</p>
//     </div>
//   );
// }
