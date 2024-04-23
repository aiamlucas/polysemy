# Polysemy

## Chapter One: Moving Squares

This project creates an interactive web application where users control squares on the screen. Each client connected to the app controls a unique square, which moves according to real-time keyboard inputs. The application utilizes websockets to communicate the movement coordinates between the client and a server, ensuring live, responsive interaction.

#### Features

- **Dynamic Square Generation:** Each user is represented by a square on the screen, assigned a unique, randomly generated color with opacity. The opacity ensures that overlapping squares blend colors, providing a visual representation of user interaction.
- **Real-time Interaction:** Movement input from users is handled in real-time, allowing immediate feedback and interaction on the user interface.
- **Unique User Identification:** Each user session is assigned a unique ID, which tracks the movement and color of the corresponding square.

### Technology Stack

- **Frontend:** React
- **Backend:** Node.js, Express
- **Real-Time Communication:** Websockets
