import React, { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import "./App.css";
import "./styles.css";

const socket = io.connect(`http://${window.location.hostname}:3001`);

export default function App() {
  const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
  const [squares, setSquares] = useState({});
  const [deviceType, setDeviceType] = useState("");

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const type =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      )
        ? "Smartphone/Tablet"
        : "Laptop/Desktop";
    setDeviceType(type);

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

    socket.on("changeBackgroundColor", ({ hue }) => {
      const color = `hsl(${hue}, 100%, 50%)`;
      document.body.style.backgroundColor = color;
    });

    return () => {
      socket.off("all_squares");
      socket.off("new_square");
      socket.off("square_moved");
      socket.off("remove_square");
      socket.off("changeBackgroundColor");
    };
  }, []);

  const handleDeviceOrientation = useCallback(
    (event) => {
      if (!squares[socket.id]) return;

      let newX = squares[socket.id].x + event.gamma / 10;
      let newY = squares[socket.id].y + event.beta / 10;

      socket.emit("move_square", { id: socket.id, x: newX, y: newY });
    },
    [squares]
  );

  const requestPermission = useCallback(async () => {
    console.log("Attempting to request permission..."); // Debug log
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((permission) => {
          console.log(`Permission result: ${permission}`); // Debug log
          if (permission === "granted") {
            window.addEventListener(
              "deviceorientation",
              handleDeviceOrientation
            );
            setGyroscopeEnabled(true);
          } else {
            alert("Permission not granted to use gyroscope.");
          }
        })
        .catch((error) => {
          console.error("Permission request failed", error);
          alert(`Permission request error: ${error}`);
        });
    } else {
      console.log("Using fallback permission request."); // Debug log
      window.addEventListener("deviceorientation", handleDeviceOrientation);
      setGyroscopeEnabled(true);
    }
  }, [handleDeviceOrientation]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!squares[socket.id]) return;

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

      socket.emit("move_square", { id: socket.id, x: newX, y: newY });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [squares]);

  return (
    <div className="App">
      <p>Device Type: {deviceType}</p>
      {deviceType === "Smartphone/Tablet" &&
        window.DeviceOrientationEvent &&
        !gyroscopeEnabled && (
          <button onClick={requestPermission}>Enable Gyroscope</button>
        )}
      {Object.values(squares).map((square) => (
        <div
          key={square.id}
          className="square"
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
//   const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
//   const [squares, setSquares] = useState({});
//   const [deviceType, setDeviceType] = useState("");

//   useEffect(() => {
//     // Check if the device supports the gyroscope API
//     if (window.DeviceOrientationEvent) {
//       setGyroscopeEnabled(true);
//     }
//   }, []);

//   useEffect(() => {
//     // Log device type
//     const userAgent = navigator.userAgent || navigator.vendor || window.opera;
//     const type =
//       /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
//         userAgent
//       )
//         ? "Smartphone/Tablet"
//         : "Laptop/Desktop";
//     setDeviceType(type);

//     // Check if the device supports the gyroscope API
//     if (type === "Smartphone/Tablet") {
//       if (window.DeviceOrientationEvent) {
//         setGyroscopeEnabled(true);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     const handleDeviceOrientation = (event) => {
//       if (!squares[socket.id]) return;

//       let newX = squares[socket.id].x;
//       let newY = squares[socket.id].y;

//       // Adjust movement based on device orientation data
//       newX += event.gamma / 10; // Adjust speed as needed
//       newY += event.beta / 10; // Adjust speed as needed

//       // Emit new position to server
//       socket.emit("move_square", { id: socket.id, x: newX, y: newY });
//     };

//     if (gyroscopeEnabled) {
//       window.addEventListener("deviceorientation", handleDeviceOrientation);
//     } else {
//       window.removeEventListener("deviceorientation", handleDeviceOrientation);
//     }

//     socket.on("all_squares", (allSquares) => {
//       setSquares(allSquares);
//     });

//     socket.on("new_square", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("square_moved", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("connect", () => {
//       console.log("Connected to server");
//     });

//     socket.on("changeBackgroundColor", ({ hue }) => {
//       const color = `hsl(${hue}, 100%, 50%)`;
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
//       window.removeEventListener("deviceorientation", handleDeviceOrientation);
//     };
//   }, [gyroscopeEnabled, squares]);

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

//     socket.on("connect", () => {
//       console.log("Connected to server");
//     });

//     // socket.on("changeBackgroundColor", ({ color }) => {
//     //   document.body.style.backgroundColor = color;
//     // });

//     socket.on("changeBackgroundColor", ({ hue }) => {
//       // Convert hue to an HSL color
//       const color = `hsl(${hue}, 100%, 50%)`;
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
//       <p>Device Type: {deviceType}</p>
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

// import "./App.css";
// import "./styles.css";
// import io from "socket.io-client";
// import { useEffect, useState } from "react";

// const socket = io.connect(`http://${window.location.hostname}:3001`);

// export default function App() {
//   const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
//   const [squares, setSquares] = useState({});
//   const [deviceType, setDeviceType] = useState("");

//   useEffect(() => {
//     // Check if the device supports the gyroscope API
//     if (window.DeviceOrientationEvent) {
//       setGyroscopeEnabled(true);
//     }
//   }, []);

//   useEffect(() => {
//     // Log device type
//     const userAgent = navigator.userAgent || navigator.vendor || window.opera;
//     const type =
//       /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
//         userAgent
//       )
//         ? "Smartphone/Tablet"
//         : "Laptop/Desktop";
//     setDeviceType(type);

//     // Check if the device supports the gyroscope API
//     if (type === "Smartphone/Tablet") {
//       if (window.DeviceOrientationEvent) {
//         setGyroscopeEnabled(true);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     const handleDeviceOrientation = (event) => {
//       if (!squares[socket.id]) return;

//       let newX = squares[socket.id].x;
//       let newY = squares[socket.id].y;

//       // Adjust movement based on device orientation data
//       newX += event.gamma / 10; // Adjust speed as needed
//       newY += event.beta / 10; // Adjust speed as needed

//       // Emit new position to server
//       socket.emit("move_square", { id: socket.id, x: newX, y: newY });
//     };

//     if (gyroscopeEnabled) {
//       window.addEventListener("deviceorientation", handleDeviceOrientation);
//     } else {
//       window.removeEventListener("deviceorientation", handleDeviceOrientation);
//     }

//     socket.on("all_squares", (allSquares) => {
//       setSquares(allSquares);
//     });

//     socket.on("new_square", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("square_moved", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("connect", () => {
//       console.log("Connected to server");
//     });

//     socket.on("changeBackgroundColor", ({ hue }) => {
//       const color = `hsl(${hue}, 100%, 50%)`;
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
//       window.removeEventListener("deviceorientation", handleDeviceOrientation);
//     };
//   }, [gyroscopeEnabled, squares]);

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

//     socket.on("connect", () => {
//       console.log("Connected to server");
//     });

//     // socket.on("changeBackgroundColor", ({ color }) => {
//     //   document.body.style.backgroundColor = color;
//     // });

//     socket.on("changeBackgroundColor", ({ hue }) => {
//       // Convert hue to an HSL color
//       const color = `hsl(${hue}, 100%, 50%)`;
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
//       <p>Device Type: {deviceType}</p>
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

// import "./App.css";
// import "./styles.css";
// import io from "socket.io-client";
// import { useEffect, useState } from "react";

// const socket = io.connect(`http://${window.location.hostname}:3001`);

// export default function App() {
//   const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
//   const [squares, setSquares] = useState({});
//   const [deviceType, setDeviceType] = useState("");

//   useEffect(() => {
//     // Check if the device supports the gyroscope API
//     if (window.DeviceOrientationEvent) {
//       setGyroscopeEnabled(true);
//     }
//   }, []);

//   useEffect(() => {
//     // Log device type
//     const userAgent = navigator.userAgent || navigator.vendor || window.opera;
//     const type =
//       /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
//         userAgent
//       )
//         ? "Smartphone/Tablet"
//         : "Laptop/Desktop";
//     setDeviceType(type);

//     // Check if the device supports the gyroscope API
//     if (type === "Smartphone/Tablet") {
//       if (window.DeviceOrientationEvent) {
//         setGyroscopeEnabled(true);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     const handleDeviceOrientation = (event) => {
//       if (!squares[socket.id]) return;

//       let newX = squares[socket.id].x;
//       let newY = squares[socket.id].y;

//       // Adjust movement based on device orientation data
//       newX += event.gamma / 10; // Adjust speed as needed
//       newY += event.beta / 10; // Adjust speed as needed

//       // Emit new position to server
//       socket.emit("move_square", { id: socket.id, x: newX, y: newY });
//     };

//     if (gyroscopeEnabled) {
//       window.addEventListener("deviceorientation", handleDeviceOrientation);
//     } else {
//       window.removeEventListener("deviceorientation", handleDeviceOrientation);
//     }

//     socket.on("all_squares", (allSquares) => {
//       setSquares(allSquares);
//     });

//     socket.on("new_square", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("square_moved", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("connect", () => {
//       console.log("Connected to server");
//     });

//     socket.on("changeBackgroundColor", ({ hue }) => {
//       const color = `hsl(${hue}, 100%, 50%)`;
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
//       window.removeEventListener("deviceorientation", handleDeviceOrientation);
//     };
//   }, [gyroscopeEnabled, squares]);

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

//     socket.on("connect", () => {
//       console.log("Connected to server");
//     });

//     // socket.on("changeBackgroundColor", ({ color }) => {
//     //   document.body.style.backgroundColor = color;
//     // });

//     socket.on("changeBackgroundColor", ({ hue }) => {
//       // Convert hue to an HSL color
//       const color = `hsl(${hue}, 100%, 50%)`;
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
//       <p>Device Type: {deviceType}</p>
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

// import "./App.css";
// import "./styles.css";
// import io from "socket.io-client";
// import { useEffect, useState } from "react";

// const socket = io.connect(`http://${window.location.hostname}:3001`);

// export default function App() {
//   const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
//   const [squares, setSquares] = useState({});

//   useEffect(() => {
//     const handleDeviceOrientation = (event) => {
//       if (!squares[socket.id]) return;

//       let newX = squares[socket.id].x;
//       let newY = squares[socket.id].y;

//       // Adjust movement based on device orientation data
//       newX += event.gamma / 10; // Adjust speed as needed
//       newY += event.beta / 10; // Adjust speed as needed

//       // Emit new position to server
//       socket.emit("move_square", { id: socket.id, x: newX, y: newY });
//     };

//     if (gyroscopeEnabled) {
//       window.addEventListener("deviceorientation", handleDeviceOrientation);
//     } else {
//       window.removeEventListener("deviceorientation", handleDeviceOrientation);
//     }

//     socket.on("all_squares", (allSquares) => {
//       setSquares(allSquares);
//     });

//     socket.on("new_square", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("square_moved", (square) => {
//       setSquares((prev) => ({ ...prev, [square.id]: square }));
//     });

//     socket.on("connect", () => {
//       console.log("Connected to server");
//     });

//     socket.on("changeBackgroundColor", ({ hue }) => {
//       const color = `hsl(${hue}, 100%, 50%)`;
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
//       window.removeEventListener("deviceorientation", handleDeviceOrientation);
//     };
//   }, [gyroscopeEnabled, squares]);

//   useEffect(() => {
//     // Check if the device supports the gyroscope API
//     if (window.DeviceOrientationEvent) {
//       setGyroscopeEnabled(true);
//     }
//   }, []);

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

//     socket.on("connect", () => {
//       console.log("Connected to server");
//     });

//     // socket.on("changeBackgroundColor", ({ color }) => {
//     //   document.body.style.backgroundColor = color;
//     // });

//     socket.on("changeBackgroundColor", ({ hue }) => {
//       // Convert hue to an HSL color
//       const color = `hsl(${hue}, 100%, 50%)`;
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

// __________________________________

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
