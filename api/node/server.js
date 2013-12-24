//npm install mysql
var mysql = require('mysql');
var connection;

var clients = {};//подключенные клиенты
var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server,{ log: true });

server.listen(8080);

var db_config = {
	host: 'localhost',
    user: 'root',
    password: '1',
    database: 'selection'
};

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since the old one cannot be reused. 
  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

app.get('/', function (req, res) {
	handleDisconnect();
	/*var sql = 'SELECT distinct `id`, `comments`, `startPos`, `endPos`, `selectedtext` FROM selected_blocks';
	connection.query(sql, function(err, results) {
		res.json(results);
	});*/
});

var getBlocks = function(callback){
  var sql = 'SELECT distinct `id`, `comments`, `startPos`, `endPos`, `selectedtext` FROM selected_blocks';
	connection.query(sql, function(err, results) {
		callback(results);
	});
}

io.sockets.on('connection', function (socket) {
	var id = Math.random();
	clients[id] = socket;
	handleDisconnect();
	getBlocks(function(repl){
		socket.emit('getBlocks', repl);
	});
	socket.on('addComment', function(data){
		for(var key in clients){
			clients[key].emit('getComments', data);
		}
	
		getBlocks(function(repl){
			for(var key in clients){
				if(data['flagEmptyWnd'] === true){
					clients[key].emit('getBlocks', repl);
				}
			}
		});
	});
	socket.on('addReply', function(data){
		for(var key in clients){
			clients[key].emit('getCommentsAfterReply', data);
		}
	});
});