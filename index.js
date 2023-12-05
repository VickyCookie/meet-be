const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { v4: uuid } = require('uuid')
const app = express();

const cors = require("cors");


app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

var meetings = {}

app.get("/", (req, res) => {
    res.send("Hello")
})

app.get("/hello", (req, res) => {
    res.send("Hello Room")
})

io.on("connection", (socket) => {
    console.log("A user Connected with Socket ID - ", socket.id)

    socket.on("create-room", (data) => {
        const meetingID = uuid()
        socket.join(meetingID)
        meetings[meetingID] = []
        //console.log(meetingID, meetings, meetings[meetingID])
        socket.emit("room-created", { meetingID: meetingID })
    })


    socket.on("join-room", (data) => {
        const { meetingID, peerID } = data;
        //console.log(meetingID, peerID, meetings[meetingID], meetings)
        if (meetings[meetingID] === undefined) {
            return
        }
        // Create the room if it doesn't exist
        socket.join(meetingID);

        // Add the user to the list of participants
        meetings[meetingID].push(peerID);


        // Emit the "users" event to all participants in the room
        io.to(meetingID).emit("users", {
            meetingID: meetingID,
            participants: meetings[meetingID]
        });

        io.to(meetingID).emit("user-joined", { peerID: peerID })
        socket.on('disconnect', () => {
            if (meetings[meetingID] === undefined) {
                return
            }
            meetings[meetingID] = meetings[meetingID].filter(item => item != peerID)
            io.to(meetingID).emit("users", {
                meetingID: meetingID,
                participants: meetings[meetingID]
            });
            io.to(meetingID).emit("user-disconnected", { peerID: peerID })
        })

    });




    socket.on("disconnect", () => {
        console.log("A user Disconnected with Socket ID - ", socket.id)
    })
});


const port = 8000

httpServer.listen(port, () => {
    //console.log("Server is running with port", port)
});