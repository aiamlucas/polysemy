# Client

This is the client-side code for the project. It contains the front-end interface for interacting with the server.

## Features

- Displays squares representing users connected to the server.
- Allows users to move their squares using arrow keys.
- Updates the positions of squares in real-time based on server data.

## Technologies Used

- **React**: Library for building user interfaces.
- **socket.io-client**: Enables WebSocket connections with the server.

## Getting Started

1. Clone this repository to your local machine.
2. Navigate to the `client` directory in your terminal.
3. Install dependencies by running `npm install`.
4. Start the client by running `npm start`.
5. Access the client interface in your web browser.

## How It Works

- Upon connecting to the server, the client receives data about all existing squares and displays them.
- Users can move their squares by pressing arrow keys, which sends updated position data to the server.
- The server broadcasts these updates to all connected clients, ensuring synchronized square movement.

## Directory Structure

- `App.js`: Main component of the client application.
- `App.css`: Styles for the main component.
- `styles.css`: Additional styles for the client application.
