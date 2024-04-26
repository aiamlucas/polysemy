const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { SerialPort } = require("serialport");

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust the CORS to accept connections from all origins
    methods: ["GET", "POST"],
  },
});

// const ARDUINO_PORT = "/dev/ttyACM1"; // verify the port!
// const arduino = new SerialPort({
//   path: ARDUINO_PORT,
//   baudRate: 9600,
// });

// arduino.on("open", function () {
//   console.log(`Connected to ${ARDUINO_PORT}`);
// });

// arduino.on("error", function (err) {
//   console.error("Failed to open port:", err.message);
// });

// function setLightColorByRGB(r, g, b) {
//   const commands = [`S1,${r}\n`, `S2,${g}\n`, `S3,${b}\n`];

//   commands.forEach((command, index) => {
//     setTimeout(() => {
//       arduino.write(command, (err) => {
//         if (err) {
//           console.error(`Failed to write command ${command}:`, err.message);
//         }
//       });
//       console.log(`Sent command: ${command}`);
//     }, index * 1000); // Adjust the delay (in milliseconds) as needed
//   });

//   console.log(`Set light to RGB: (${r}, ${g}, ${b})`);
// }

//setting RGBW to blue for testing
// setLightColorByRGB(0, 0, 255);

let userSquares = {}; // Store squares with positions and properties
let currentHue = 0;
const hueStep = 1; // Increment step for hue value
let transitionInterval = null;

io.on("connection", (socket) => {
  // Emit the current background color to the new user
  socket.emit("currentBackgroundColor", { hue: currentHue });

  // SQUARES IN HSL Color Space
  // Assign a random color and initial position to each new user
  const initialSquare = {
    id: socket.id,
    x: 50, // Starting X position
    y: 50, // Starting Y position
    color: `hsla(${Math.floor(
      Math.random() * 360
    )}, 100%, 50%, ${randomOpacity()})`, // Random color with random HSL values and random opacity
  };
  userSquares[socket.id] = initialSquare;

  // Random opacity value between 20 and 80 percent
  function randomOpacity() {
    const minOpacity = 20; // Minimum opacity
    const maxOpacity = 80; // Maximum opacity
    const opacityRange = maxOpacity - minOpacity; // Range of opacity values
    const randomOffset = Math.floor(Math.random() * (opacityRange + 1)); // Random offset within the range
    const opacity = minOpacity + randomOffset; // Calculate the final opacity
    return opacity / 100; // Convert opacity to a fraction
  }

  //   // --------- SQUARES IN RGB VALUES ??????????? -----

  //   // // Assign a random color and initial position to each new user
  //   // const initialSquare = {
  //   //   id: socket.id,
  //   //   x: 50, // Starting X position
  //   //   y: 50, // Starting Y position
  //   //   color: `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
  //   //     Math.random() * 256
  //   //   )}, ${Math.floor(Math.random() * 256)}, ${randomOpacity() / 100})`, // Random color with random RGB values and random opacity
  //   // };
  //   // userSquares[socket.id] = initialSquare;

  //   // // Random opacity value between 20 and 80 percent
  //   // function randomOpacity() {
  //   //   const minOpacity = 50; // Minimum opacity
  //   //   const maxOpacity = 70; // Maximum opacity
  //   //   const opacityRange = maxOpacity - minOpacity; // Range of opacity values
  //   //   const randomOffset = Math.floor(Math.random() * (opacityRange + 1)); // Random offset within the range
  //   //   const opacity = minOpacity + randomOffset; // Calculate the final opacity
  //   //   return opacity;
  //   // }
  //   // --------------------------------------------------

  // Emit the list of all squares to the new user
  socket.emit("all_squares", userSquares);

  socket.on("move_square", (data) => {
    if (userSquares[data.id]) {
      // Update square position
      const oldX = userSquares[data.id].x;
      const oldY = userSquares[data.id].y;
      const newX = data.x;
      const newY = data.y;

      // Log the movement
      console.log(
        `Square with ID ${data.id} moved from (${oldX}, ${oldY}) to (${newX}, ${newY})`
      );

      userSquares[data.id].x = newX;
      userSquares[data.id].y = newY;
      // Broadcast new position to all users
      io.emit("square_moved", userSquares[data.id]);

      // Check if squares align
      const alignedSquares = Object.values(userSquares).filter(
        (square) => square.x === newX && square.y === newY
      );

      console.log("Aligned squares:", alignedSquares);

      if (alignedSquares.length > 1) {
        // If squares align, update the background color
        io.emit("changeBackgroundColor", { hue: randHue() });
      }
    }
  });

  // Start the smooth transition when the first user connects
  if (Object.keys(userSquares).length === 1) {
    startTransition();
  }

  // Random hue value between 0 and 360 degrees
  function randHue() {
    currentHue = (currentHue + hueStep) % 360;
    return currentHue;
  }

  // Start the smooth transition
  function startTransition() {
    // Check if transition interval is not already running
    if (!transitionInterval) {
      let previousAlignment = false; // Track previous alignment state

      // Set up the interval for transitioning
      transitionInterval = setInterval(() => {
        const currentAlignment = checkAlignment(); // Check if squares are aligned

        // If squares are aligned and the alignment has changed from previous state, change background color
        if (currentAlignment && !previousAlignment) {
          currentHue = getRandomHueInRange(0, 360); // Calculate new hue
        }
        // If squares are not aligned, continue transitioning smoothly
        else if (!currentAlignment) {
          currentHue = (currentHue + hueStep) % 360; // Smooth transition
        }

        // Update previous alignment state
        previousAlignment = currentAlignment;

        // Emit the new background color to all clients
        io.emit("changeBackgroundColor", { hue: currentHue });
      }, 100); // Adjust the interval for smoother transition
    }
  }

  // Check if any squares are aligned
  function checkAlignment() {
    for (const square of Object.values(userSquares)) {
      const alignedSquares = Object.values(userSquares).filter(
        (s) => s.x === square.x && s.y === square.y
      );
      if (alignedSquares.length > 1) {
        return true; // Squares are aligned
      }
    }
    return false; // Squares are not aligned
  }

  // Generate a random hue value within a specified range
  function getRandomHueInRange(min, max) {
    return currentHue + Math.floor(Math.random() * (max - min)) + min;
  }

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
    // Remove square
    delete userSquares[socket.id];
    // Notify all users about the disconnected user
    io.emit("remove_square", socket.id);

    // Stop the transition if no users are connected
    if (Object.keys(userSquares).length === 0) {
      stopTransition();
    }
  });
});

// Stop the smooth transition
function stopTransition() {
  clearInterval(transitionInterval);
  transitionInterval = null;
}

server.listen(3001, "0.0.0.0", () => {
  console.log("Server is running on port 3001");
});

// // const ARDUINO_PORT = "/dev/ttyACM1"; // verity the port!
// // const arduino = new SerialPort({
// //   path: ARDUINO_PORT,
// //   baudRate: 9600,
// // });

// // arduino.on("open", function () {
// //   console.log(`Connected to ${ARDUINO_PORT}`);
// // });

// // arduino.on("error", function (err) {
// //   console.error("Failed to open port:", err.message);
// // });

// // function setLightColorByRGB(r, g, b) {
// //   const commands = [`S1,${r}\n`, `S2,${g}\n`, `S3,${b}\n`];

// //   commands.forEach((command, index) => {
// //     setTimeout(() => {
// //       arduino.write(command, (err) => {
// //         if (err) {
// //           console.error(`Failed to write command ${command}:`, err.message);
// //         }
// //       });
// //       console.log(`Sent command: ${command}`);
// //     }, index * 1000); // Adjust the delay (in milliseconds) as needed
// //   });

// //   console.log(`Set light to RGB: (${r}, ${g}, ${b})`);
// // }

// //setting RGBW to blue for testing
// // setLightColorByRGB(0, 0, 255);

// let userSquares = {}; // Store squares with positions and properties

// io.on("connection", (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   // Assign a random color and initial position to each new user
//   const initialSquare = {
//     id: socket.id,
//     x: 50, // Starting X position
//     y: 50, // Starting Y position
//     color: `hsla(${Math.random() * 360}, 100%, 50%, 0.6)`, // Random color with 60% opacity
//   };
//   userSquares[socket.id] = initialSquare;

//   // Emit the list of all squares to the new user
//   socket.emit("all_squares", userSquares);

//   // Broadcast new user's square to all other users
//   socket.broadcast.emit("new_square", initialSquare);

//   socket.on("move_square", (data) => {
//     if (userSquares[data.id]) {
//       // Update square position
//       const oldX = userSquares[data.id].x;
//       const oldY = userSquares[data.id].y;
//       const newX = data.x;
//       const newY = data.y;

//       // Log the movement
//       console.log(
//         `Square with ID ${data.id} moved from (${oldX}, ${oldY}) to (${newX}, ${newY})`
//       );

//       userSquares[data.id].x = newX;
//       userSquares[data.id].y = newY;
//       // Broadcast new position to all users
//       io.emit("square_moved", userSquares[data.id]);

//       // Change background color if squares align
//       if (
//         Object.values(userSquares).filter(
//           (square) => square.x === newX && square.y === newY
//         ).length > 1
//       ) {
//         io.emit("changeBackgroundColor", { color: randColor() });
//       }
//     }
//   });

//   // Random color
//   function randColor() {
//     return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
//       Math.random() * 256
//     )}, ${Math.floor(Math.random() * 256)})`;
//   }

//   socket.on("disconnect", () => {
//     console.log(`User Disconnected: ${socket.id}`);
//     // Remove square
//     delete userSquares[socket.id];
//     // Notify all users about the disconnected user
//     io.emit("remove_square", socket.id);
//   });
// });

// server.listen(3001, "0.0.0.0", () => {
//   console.log("Server is running on port 3001");
// });
