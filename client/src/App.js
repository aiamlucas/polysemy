import "./App.css";
import "./styles.css";
import io from "socket.io-client";
import { useEffect, useState } from "react";

const socket = io.connect(`http://${window.location.hostname}:3001`);

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

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    // socket.on("changeBackgroundColor", ({ color }) => {
    //   document.body.style.backgroundColor = color;
    // });

    socket.on("changeBackgroundColor", ({ hue }) => {
      // Convert hue to an HSL color
      const color = `hsl(${hue}, 100%, 50%)`;
      document.body.style.backgroundColor = color;
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
          className="square" // Apply the 'square' CSS class
          style={{
            left: `${square.x}px`,
            top: `${square.y}px`,
            backgroundColor: square.color,
          }}
        />
      ))}
    </div>
  );
}

// import "./App.css";
// import "./styles.css";
// import io from "socket.io-client";
// import { useEffect, useState } from "react";

// const socket = io.connect(`http://${window.location.hostname}:3001`);

// export default function App() {
//   const [squares, setSquares] = useState({});

//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       if (!squares[socket.id]) return; // If no square assigned yet, do nothing

//       let newX = squares[socket.id].x;
//       let newY = squares[socket.id].y;

//       switch (event.key) {
//         case "ArrowUp":
//           newY -= 10;
//           break;
//         case "ArrowDown":
//           newY += 10;
//           break;
//         case "ArrowLeft":
//           newX -= 10;
//           break;
//         case "ArrowRight":
//           newX += 10;
//           break;
//         default:
//           return;
//       }

//       // Emit new position to server
//       socket.emit("move_square", { id: socket.id, x: newX, y: newY });
//     };

//     window.addEventListener("keydown", handleKeyDown);

//     socket.on("all_squares", (allSquares) => {
//       setSquares(allSquares);
//     });

//     socket.on("new_square", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("square_moved", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("changeBackgroundColor", ({ color }) => {
//       document.body.style.backgroundColor = color;
//     });

//     socket.on("remove_square", (id) => {
//       setSquares((prev) => {
//         const newState = { ...prev };
//         delete newState[id];
//         return newState;
//       });
//     });

//     return () => {
//       window.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [squares]); // Include squares in the dependency array to re-run the effect when squares change

//   return (
//     <div className="App">
//       {Object.values(squares).map((square) => (
//         <div
//           key={square.id}
//           className="square" // Apply the 'square' CSS class
//           style={{
//             left: `${square.x}px`,
//             top: `${square.y}px`,
//             backgroundColor: square.color,
//           }}
//         />
//       ))}
//     </div>
//   );
// }
