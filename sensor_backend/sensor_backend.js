const net = require('net');
const port = 55555;
const host = '192.168.0.39';

// https://www.digitalocean.com/community/tutorials/how-to-develop-a-node-js-tcp-server-application-using-pm2-and-nginx-on-ubuntu-16-04

const server = net.createServer();
server.listen(port, host, () => {
    console.log('TCP Server is running on port ' + port +'.');
});

let sockets = [];

server.on('connection', (sock) => {
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    sockets.push(sock);


    // When a connected client sends data, print it to the console, and respond that it got it.
    sock.on('data', (data) => {
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
        
        // Write the data back to all the connected, the client will receive it as data from the server
        sockets.forEach((sock, index, array) => {
            sock.write(sock.remoteAddress + ':' + sock.remotePort + " said " + data + '\n');
        });
    });


    // Add a 'close' event handler to this instance of socket
    sock.on('close', (data) => {

        let index = sockets.findIndex((o) => {
            return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
        })

        if (index !== -1)
            sockets.splice(index, 1);

        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });
});

