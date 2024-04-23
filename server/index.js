const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const OSC = require("osc-js");
// socket io client.

app.use(cors());
const osc = new OSC({
  plugin: new OSC.DatagramPlugin({ send: { port: 57120 } }),
}); // Set the port to 57120 for sending OSC messages

const server = http.createServer(app);

// connecting with the URL from the frontend (localhost:3000)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// listen to events!:
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id} `);
  //callback function that recieves the data from the frontend
  socket.on("send_message", (data) => {
    // console.log("server", data);

    if (data.message) {
      console.log("message : ", data);
      let splitData = data.message.split("ሴ"); //ctrl+shit+u+1234
      let stringData = splitData[0];
      let numberData = parseFloat(splitData[1]);
      if (
        (typeof stringData === "string" &&
          typeof numberData === "number" &&
          numberData) ||
        numberData === 0
      ) {
        console.log(stringData, numberData);
        let uiElementMessage = new OSC.Message(stringData, numberData);
        osc.send(uiElementMessage);
        socket.broadcast.emit("receive_message", data);
        // io.emit("receive_message", data); // to emit to all clients
      } else {
        socket.broadcast.emit("receive_message", data);
        // io.emit("receive_message", data);
      }

      // socket.broadcast.emit("receive_message", messageBroadcast);
    } else {
      console.log("no message to transfer");
    }
  });
});

//listen to a port and create a server router
server.listen(3001, () => {
  console.log("Server is running...");
});
