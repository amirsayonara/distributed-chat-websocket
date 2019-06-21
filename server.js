var WebSocketServer = require('websocket').server,
    http = require('http'), https = require('https'),
    fs = require('fs'),
    redis = require('redis');

PORT = 1111;

subscriber = redis.createClient(6379, '127.0.0.1');
publisher = redis.createClient(6379, '127.0.0.1');

subscriber.on('message', (channel, message) => {
    tmp = JSON.parse(message);
    if (tmp['from'] != PORT & tmp['type']=='msg') {
        Object.keys(clients).forEach(d => {
            clients[d].send(tmp['msg']);
        });
    } else if (tmp['from'] != PORT) {
        Object.keys(clients).forEach(d => {
            clients[d].send(message);
        });
    }
});

subscriber.on("error", function(err) {
    console.error("Error, connecting to redis");
});
publisher.on("error", function(err) {
    console.error("Error, connecting to redis");
});

subscriber.subscribe('CHAT-TERDISTRIBUSI');

var server = http.createServer(function(request, response) {
    response.setHeader('server', 'chat-amir');
    var data;
    if (request.url == '/') {
        response.setHeader('content-type', 'text/html');
        data = fs.readFileSync('index.html');
    } else {
        data = 'Invalid';
    }
    response.end(data);
});

server.listen(PORT, function() {
    console.log('Server is listening');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // デフォルトでは65535byte以上受けつけないので
    // 値を増やしてみる
    maxReceivedFrameSize: 0x1000000,
    autoAcceptConnections: false
});

clients = {};

wsServer.on('request', function(request) {
    var conn = request.accept(null, request.origin);
    var id = request.key;
    clients[id] = conn;
    time = new Date().toLocaleDateString('ID-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
    console.log(request.remoteAddress + ' '+ id + ' connected');
    console.log(request.socket._peername);
    
    conn.send('{"from":"'+PORT+'", "to":["you"], "msg":"your id: '+id+'", "time":"'+time+'"}');
    /*publisher.publish("CHAT-TERDISTRIBUSI", '{"from":"'+PORT+'", "to":["notif"], "msg":"ID: '+id+' connected", "time":"'+time+'"}');
    Object.keys(clients).forEach(d => {
        if (d!=id)
            clients[d].send('{"from":"'+PORT+'", "to":["notif"], "msg":"ID: '+id+' connected", "time":"'+time+'"}');
    });*/

    conn.on('close', function(){
        time = new Date().toLocaleDateString('ID-ID',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
        console.log(id + ' disconnected');
        delete clients[id];
        /*Object.keys(clients).forEach(d => {
            clients[d].send('{"from":"'+PORT+'", "to":["notif"], "msg":"ID: '+id+' disconnected"}');
        });
        publisher.publish("CHAT-TERDISTRIBUSI", '{"from":"'+PORT+'", "to":["notif"], "msg":"ID: '+id+' disconnected", "time":"'+time+'"}');*/
    });

    conn.on('message', function(message){
        Object.keys(clients).forEach(d => {
            if (d!=id)
                clients[d].send(id+': '+message.utf8Data);
        });
        publisher.publish('CHAT-TERDISTRIBUSI', '{"from":"'+PORT+'", "type":"msg", "msg":"'+id+': '+message.utf8Data+'"}');
    });
});