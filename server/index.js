const express = require("express");
const app = express();
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const cors = require("cors");
// const { SerialPort } = require("serialport"); // Commented out Arduino related import

app.use(cors());

// Load the SSL certificate and key
const serverOptions = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};

// Create the HTTPS server
const server = https.createServer(serverOptions, app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust the CORS to accept connections from all origins
    methods: ["GET", "POST"],
  },
});

// ARDUINO -------------------------------------------------

// const ARDUINO_PORT = "/dev/ttyACM0"; // verify the port!
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

// --------------------------------------------------------

let userSquares = {}; // Store squares with positions and properties
let currentHue = 0;
const hueStep = 1; // Increment step for hue value
let transitionInterval = null;

io.on("connection", (socket) => {
  socket.emit("currentBackgroundColor", { hue: currentHue });

  const initialSquare = {
    id: socket.id,
    x: 50,
    y: 50,
    color: `hsla(${Math.floor(
      Math.random() * 360
    )}, 100%, 50%, ${randomOpacity()})`,
  };
  userSquares[socket.id] = initialSquare;
  socket.emit("all_squares", userSquares);

  socket.on("move_square", (data) => {
    if (userSquares[data.id]) {
      updateSquarePosition(data);
      checkAndHandleAlignment(data.id);
    }
  });

  function randomOpacity() {
    const minOpacity = 20;
    const maxOpacity = 80;
    return (
      (minOpacity + Math.floor(Math.random() * (maxOpacity - minOpacity + 1))) /
      100
    );
  }

  function updateSquarePosition(data) {
    const { id, x, y } = data;
    const square = userSquares[id];
    console.log(
      `Square with ID ${id} moved from (${square.x}, ${square.y}) to (${x}, ${y})`
    );
    square.x = x;
    square.y = y;
    io.emit("square_moved", square);
  }

  function checkAndHandleAlignment(id) {
    const square = userSquares[id];
    const alignedSquares = Object.values(userSquares).filter(
      (s) => s.x === square.x && s.y === square.y
    );
    if (alignedSquares.length > 1) {
      currentHue = getRandomHueInRange(0, 360);

      // ARDUINO --------------------
      // const rgb = hslToRgb(currentHue, 100, 50); // Convert HSL to RGB
      // setLightColorByRGB(...rgb); // Send RGB values to Arduino
      // ----------------------------

      io.emit("changeBackgroundColor", { hue: currentHue });
    }

    ensureTransitionRunning();
  }

  function ensureTransitionRunning() {
    if (!transitionInterval) {
      startTransition();
    }
  }

  function startTransition() {
    transitionInterval = setInterval(() => {
      currentHue = (currentHue + hueStep) % 360;

      // ARDUINO --------------------
      // const rgb = hslToRgb(currentHue, 100, 50); // Convert HSL to RGB
      // setLightColorByRGB(...rgb); // Send RGB values to Arduino
      // ----------------------------

      io.emit("changeBackgroundColor", { hue: currentHue });
    }, 100000); //set the color hue speed in miliseconds
  }

  function getRandomHueInRange(min, max) {
    return (currentHue + Math.floor(Math.random() * (max - min))) % 360;
  }

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
    delete userSquares[socket.id];
    io.emit("remove_square", socket.id);
    stopTransitionIfNeeded();
  });
});

function stopTransitionIfNeeded() {
  if (Object.keys(userSquares).length === 0 && transitionInterval) {
    clearInterval(transitionInterval);
    transitionInterval = null;
  }
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}

function setLightColorByRGB(r, g, b) {
  const commands = [`S1,${r}\n`, `S2,${g}\n`, `S3,${b}\n`];

  commands.forEach((command, index) => {
    setTimeout(() => {
      arduino.write(command, (err) => {
        if (err) {
          console.error(`Failed to write command ${command}:`, err.message);
        }
      });
      console.log(`Sent command: ${command}`);
    }, index * 100);
  });

  console.log(`Set light to RGB: (${r}, ${g}, ${b})`);
}

server.listen(443, "0.0.0.0", () => {
  console.log("Server is running on port 443");
});

// const express = require("express");
// const app = express();
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const { SerialPort } = require("serialport");

// app.use(cors());
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Adjust the CORS to accept connections from all origins
//     methods: ["GET", "POST"],
//   },
// });

// // ARDUINO -------------------------------------------------

// // const ARDUINO_PORT = "/dev/ttyACM0"; // verify the port!
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

// // --------------------------------------------------------

// let userSquares = {}; // Store squares with positions and properties
// let currentHue = 0;
// const hueStep = 1; // Increment step for hue value
// let transitionInterval = null;

// io.on("connection", (socket) => {
//   socket.emit("currentBackgroundColor", { hue: currentHue });

//   const initialSquare = {
//     id: socket.id,
//     x: 50,
//     y: 50,
//     color: `hsla(${Math.floor(
//       Math.random() * 360
//     )}, 100%, 50%, ${randomOpacity()})`,
//   };
//   userSquares[socket.id] = initialSquare;
//   socket.emit("all_squares", userSquares);

//   socket.on("move_square", (data) => {
//     if (userSquares[data.id]) {
//       updateSquarePosition(data);
//       checkAndHandleAlignment(data.id);
//     }
//   });

//   function randomOpacity() {
//     const minOpacity = 20;
//     const maxOpacity = 80;
//     return (
//       (minOpacity + Math.floor(Math.random() * (maxOpacity - minOpacity + 1))) /
//       100
//     );
//   }

//   function updateSquarePosition(data) {
//     const { id, x, y } = data;
//     const square = userSquares[id];
//     console.log(
//       `Square with ID ${id} moved from (${square.x}, ${square.y}) to (${x}, ${y})`
//     );
//     square.x = x;
//     square.y = y;
//     io.emit("square_moved", square);
//   }

//   function checkAndHandleAlignment(id) {
//     const square = userSquares[id];
//     const alignedSquares = Object.values(userSquares).filter(
//       (s) => s.x === square.x && s.y === square.y
//     );
//     if (alignedSquares.length > 1) {
//       currentHue = getRandomHueInRange(0, 360);

//       // ARDUINO --------------------
//       // const rgb = hslToRgb(currentHue, 100, 50); // Convert HSL to RGB
//       // setLightColorByRGB(...rgb); // Send RGB values to Arduino
//       // ----------------------------

//       io.emit("changeBackgroundColor", { hue: currentHue });
//     }

//     ensureTransitionRunning();
//   }

//   function ensureTransitionRunning() {
//     if (!transitionInterval) {
//       startTransition();
//     }
//   }

//   function startTransition() {
//     transitionInterval = setInterval(() => {
//       currentHue = (currentHue + hueStep) % 360;

//       // ARDUINO --------------------
//       // const rgb = hslToRgb(currentHue, 100, 50); // Convert HSL to RGB
//       // setLightColorByRGB(...rgb); // Send RGB values to Arduino
//       // ----------------------------

//       io.emit("changeBackgroundColor", { hue: currentHue });
//     }, 100000); //set the color hue speed in miliseconds
//   }

//   function getRandomHueInRange(min, max) {
//     return (currentHue + Math.floor(Math.random() * (max - min))) % 360;
//   }

//   socket.on("disconnect", () => {
//     console.log(`User Disconnected: ${socket.id}`);
//     delete userSquares[socket.id];
//     io.emit("remove_square", socket.id);
//     stopTransitionIfNeeded();
//   });
// });

// function stopTransitionIfNeeded() {
//   if (Object.keys(userSquares).length === 0 && transitionInterval) {
//     clearInterval(transitionInterval);
//     transitionInterval = null;
//   }
// }

// function hslToRgb(h, s, l) {
//   s /= 100;
//   l /= 100;
//   let c = (1 - Math.abs(2 * l - 1)) * s;
//   let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
//   let m = l - c / 2;
//   let r = 0;
//   let g = 0;
//   let b = 0;

//   if (0 <= h && h < 60) {
//     r = c;
//     g = x;
//     b = 0;
//   } else if (60 <= h && h < 120) {
//     r = x;
//     g = c;
//     b = 0;
//   } else if (120 <= h && h < 180) {
//     r = 0;
//     g = c;
//     b = x;
//   } else if (180 <= h && h < 240) {
//     r = 0;
//     g = x;
//     b = c;
//   } else if (240 <= h && h < 300) {
//     r = x;
//     g = 0;
//     b = c;
//   } else if (300 <= h && h < 360) {
//     r = c;
//     g = 0;
//     b = x;
//   }

//   r = Math.round((r + m) * 255);
//   g = Math.round((g + m) * 255);
//   b = Math.round((b + m) * 255);

//   return [r, g, b];
// }

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
//     }, index * 100);
//   });

//   console.log(`Set light to RGB: (${r}, ${g}, ${b})`);
// }

// server.listen(3001, "0.0.0.0", () => {
//   console.log("Server is running on port 3001");
// });
