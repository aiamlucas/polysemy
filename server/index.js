const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust the CORS to accept connections from all origins
    methods: ["GET", "POST"],
  },
});

const ARDUINO_PORT = "/dev/ttyACM1"; // verity the port!
const arduino = new SerialPort({
  path: ARDUINO_PORT,
  baudRate: 9600,
});

arduino.on("open", function () {
  console.log(`Connected to ${ARDUINO_PORT}`);
});

arduino.on("error", function (err) {
  console.error("Failed to open port:", err.message);
});

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
    }, index * 1000); // Adjust the delay (in milliseconds) as needed
  });

  console.log(`Set light to RGB: (${r}, ${g}, ${b})`);
}

//setting RGBW to blue for testing
setLightColorByRGB(0, 0, 255);

let userSquares = {}; // Store squares with positions and properties

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Assign a random color and initial position to each new user
  const initialSquare = {
    id: socket.id,
    x: 50, // Starting X position
    y: 50, // Starting Y position
    color: `hsla(${Math.random() * 360}, 100%, 50%, 0.6)`, // Random color with 60% opacity
  };
  userSquares[socket.id] = initialSquare;

  // Emit the list of all squares to the new user
  socket.emit("all_squares", userSquares);

  // Broadcast new user's square to all other users
  socket.broadcast.emit("new_square", initialSquare);

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
    }
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
    // Remove square
    delete userSquares[socket.id];
    // Notify all users about the disconnected user
    io.emit("remove_square", socket.id);
  });
});

server.listen(3001, "0.0.0.0", () => {
  console.log("Server is running on port 3001");
});

// const express = require("express");
// const app = express();
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const OSC = require("osc-js");
// // socket io client.

// app.use(cors());
// const osc = new OSC({
//   plugin: new OSC.DatagramPlugin({ send: { port: 57120 } }),
// }); // Set the port to 57120 for sending OSC messages

// const server = http.createServer(app);

// // connecting with the URL from the frontend (localhost:3000)
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// });

// // listen to events!:
// io.on("connection", (socket) => {
//   console.log(`User Connected: ${socket.id} `);
//   //callback function that recieves the data from the frontend
//   socket.on("send_message", (data) => {
//     // console.log("server", data);

//     if (data.message) {
//       console.log("message : ", data);
//       let splitData = data.message.split("ሴ"); //ctrl+shit+u+1234
//       let stringData = splitData[0];
//       let numberData = parseFloat(splitData[1]);
//       if (
//         (typeof stringData === "string" &&
//           typeof numberData === "number" &&
//           numberData) ||
//         numberData === 0
//       ) {
//         console.log(stringData, numberData);
//         let uiElementMessage = new OSC.Message(stringData, numberData);
//         osc.send(uiElementMessage);
//         socket.broadcast.emit("receive_message", data);
//         // io.emit("receive_message", data); // to emit to all clients
//       } else {
//         socket.broadcast.emit("receive_message", data);
//         // io.emit("receive_message", data);
//       }

//       // socket.broadcast.emit("receive_message", messageBroadcast);
//     } else {
//       console.log("no message to transfer");
//     }
//   });
// });

// //listen to a port and create a server router
// server.listen(3001, () => {
//   console.log("Server is running...");
// });
