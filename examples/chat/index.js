// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

let agentArr = [];
let clientObj = {};

io.on('connection', (socket) => {
  var addedUser = false;
  console.log("Socket ID is:",socket.id);

  // Emits a user count to the person establish a connection
  io.emit('Receive User Count', {
    agent: agentArr.length,
    client: Object.keys(clientObj)? Object.keys(clientObj).length : 0
  });

  // Login screen, when a user chooses someone
  socket.on('User Chosen', (data) => {
    if (data.role === 'agent'){ agentArr.push(data.socketId);}
    if (data.role === 'client'){ clientObj[data.socketId]=data.username;}
    console.log(agentArr);
    console.log(clientObj);
  });

  // When a user disconnect
  socket.on('ClientRoom', () => {
    console.log(socket.id);
    console.log('Join Room ID:',socket.id);
    socket.join(`${socket.id}`);
  });

  socket.on('JoinClients', () => {
    console.log("joinclients",clientObj);
    if (Object.keys(clientObj) !== undefined) {
      Object.keys(clientObj).forEach(id => {
        console.log("room id is",id);
        socket.join(id);
      });
      io.emit('ReceiveClients', clientObj);
    }
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  socket.on('SEND_MESSAGE', function(data){
      console.log("receive");
      console.log(socket.id);
      io.sockets.in(`${data.room}`).emit('RECEIVE_MESSAGE', data);
    });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', (data) => {
    console.log("Socket closed:", socket.id);
    delete clientObj[socket.id];
    if(agentArr.includes(socket.id)){agentArr.pop();}
    console.log(agentArr);
    console.log(clientObj);
  });
});
