import React, { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import "./App.css";
import "./styles.css";

// // const socket = io.connect(`http://${window.location.hostname}:3001`);
// const socket = io.connect(`https://${window.location.hostname}:3001`);

// Connect to the server using HTTPS
const socket = io.connect(`https://${window.location.hostname}:443`, {
  secure: true,
  rejectUnauthorized: false, // This may be needed depending on your server setup
});

export default function App() {
  const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
  const [orientationData, setOrientationData] = useState({
    alpha: null,
    beta: null,
    gamma: null,
  });
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

    const setupSocketListeners = () => {
      socket.on("all_squares", (allSquares) => setSquares(allSquares));
      socket.on("new_square", (square) =>
        setSquares((prev) => ({ ...prev, [square.id]: square }))
      );
      socket.on("square_moved", (square) =>
        setSquares((prev) => ({ ...prev, [square.id]: square }))
      );
      socket.on("remove_square", (id) =>
        setSquares((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        })
      );
      socket.on("changeBackgroundColor", ({ hue }) => {
        document.body.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
      });
    };

    setupSocketListeners();
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
      setOrientationData({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      });

      if (gyroscopeEnabled && squares[socket.id]) {
        const newX = squares[socket.id].x + event.gamma * 5; // Increase sensitivity
        const newY = squares[socket.id].y + event.beta * 5; // Increase sensitivity
        socket.emit("move_square", { id: socket.id, x: newX, y: newY });
      }
    },
    [gyroscopeEnabled, squares]
  );

  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((permission) => {
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
        .catch(console.error);
    } else {
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
          newY -= 20;
          break;
        case "ArrowDown":
          newY += 20;
          break;
        case "ArrowLeft":
          newX -= 20;
          break;
        case "ArrowRight":
          newX += 20;
          break;
        default:
          return;
      }

      socket.emit("move_square", { id: socket.id, x: newX, y: newY });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [squares]); // Correct dependency to ensure up-to-date data is used

  return (
    <div className="App">
      <p>Device Type: {deviceType}</p>
      {deviceType === "Smartphone/Tablet" && !gyroscopeEnabled && (
        <button onClick={requestPermission}>Enable Gyroscope</button>
      )}
      {gyroscopeEnabled && (
        <>
          <p>
            Alpha (z-axis rotation):{" "}
            {orientationData.alpha?.toFixed(2) || "Not available"}
          </p>
          <p>
            Beta (x-axis tilt):{" "}
            {orientationData.beta?.toFixed(2) || "Not available"}
          </p>
          <p>
            Gamma (y-axis tilt):{" "}
            {orientationData.gamma?.toFixed(2) || "Not available"}
          </p>
        </>
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

// import React, { useEffect, useState, useCallback } from "react";
// import io from "socket.io-client";
// import "./App.css";
// import "./styles.css";

// const socket = io.connect(`http://${window.location.hostname}:3001`);

// export default function App() {
//   const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
//   const [orientationData, setOrientationData] = useState({
//     alpha: null,
//     beta: null,
//     gamma: null,
//   });
//   const [squares, setSquares] = useState({});
//   const [deviceType, setDeviceType] = useState("");

//   useEffect(() => {
//     const userAgent = navigator.userAgent || navigator.vendor || window.opera;
//     const type =
//       /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
//         userAgent
//       )
//         ? "Smartphone/Tablet"
//         : "Laptop/Desktop";
//     setDeviceType(type);

//     // Setting up socket listeners for squares and background color
//     const setupSocketListeners = () => {
//       socket.on("all_squares", (allSquares) => setSquares(allSquares));
//       socket.on("new_square", (square) =>
//         setSquares((prev) => ({ ...prev, [square.id]: square }))
//       );
//       socket.on("square_moved", (square) =>
//         setSquares((prev) => ({ ...prev, [square.id]: square }))
//       );
//       socket.on("remove_square", (id) =>
//         setSquares((prev) => {
//           const newState = { ...prev };
//           delete newState[id];
//           return newState;
//         })
//       );
//       socket.on(
//         "changeBackgroundColor",
//         ({ hue }) =>
//           (document.body.style.backgroundColor = `hsl(${hue}, 100%, 50%)`)
//       );
//     };

//     setupSocketListeners();

//     return () => {
//       socket.off("all_squares");
//       socket.off("new_square");
//       socket.off("square_moved");
//       socket.off("remove_square");
//       socket.off("changeBackgroundColor");
//     };
//   }, []);

//   const handleDeviceOrientation = useCallback(
//     (event) => {
//       setOrientationData({
//         alpha: event.alpha,
//         beta: event.beta,
//         gamma: event.gamma,
//       });

//       if (gyroscopeEnabled && squares[socket.id]) {
//         const newX = squares[socket.id].x + event.gamma / 10;
//         const newY = squares[socket.id].y + event.beta / 10;
//         socket.emit("move_square", { id: socket.id, x: newX, y: newY });
//       }
//     },
//     [gyroscopeEnabled, squares]
//   );

//   const requestPermission = useCallback(async () => {
//     if (typeof DeviceOrientationEvent.requestPermission === "function") {
//       DeviceOrientationEvent.requestPermission()
//         .then((permission) => {
//           if (permission === "granted") {
//             window.addEventListener(
//               "deviceorientation",
//               handleDeviceOrientation
//             );
//             setGyroscopeEnabled(true);
//           } else {
//             alert("Permission not granted to use gyroscope.");
//           }
//         })
//         .catch(console.error);
//     } else {
//       window.addEventListener("deviceorientation", handleDeviceOrientation);
//       setGyroscopeEnabled(true);
//     }
//   }, [handleDeviceOrientation]);

//   useEffect(() => {
//     window.addEventListener("keydown", (event) => {
//       if (!squares[socket.id]) return;

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

//       socket.emit("move_square", { id: socket.id, x: newX, y: newY });
//     });

//     return () => window.removeEventListener("keydown", handleDeviceOrientation);
//   }, [squares]);

//   return (
//     <div className="App">
//       <p>Device Type: {deviceType}</p>
//       {deviceType === "Smartphone/Tablet" && !gyroscopeEnabled && (
//         <button onClick={requestPermission}>Enable Gyroscope</button>
//       )}
//       {gyroscopeEnabled && (
//         <>
//           <p>
//             Alpha (z-axis rotation):{" "}
//             {orientationData.alpha?.toFixed(2) || "Not available"}
//           </p>
//           <p>
//             Beta (x-axis tilt):{" "}
//             {orientationData.beta?.toFixed(2) || "Not available"}
//           </p>
//           <p>
//             Gamma (y-axis tilt):{" "}
//             {orientationData.gamma?.toFixed(2) || "Not available"}
//           </p>
//         </>
//       )}
//       {Object.values(squares).map((square) => (
//         <div
//           key={square.id}
//           className="square"
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
