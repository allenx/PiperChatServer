var app = require('http').createServer(handle);
var io = require('socket.io')(app);
var mysql = require('mysql');
var fs = require('fs');

app.listen(3000);

var DBConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '328504',
    database: 'piperchat'
});

function handle(request, response) {
    fs.readFile(__dirname + '/index.html', function (error, data) {
        if (error) {
            response.writeHead(500);
            return response.end('Oops');
        }

        response.writeHead(200);
        response.end(data);
    });
}

var sockets = [];

io.on('connection', function (socket) {

    console.log("A user has connected");

    socket.emit('connection_status', {
        message: 'connected'
    });


    // // Sign up
    // socket.on('signup', function (userData) {
    //     console.log(userData);
    //     socket.username = userData.username;
    //     sockets.push(socket);
    //
    // });

    // Log in
    socket.on('login', function (userData) {
        console.log(userData);

        socket.username = userData.username;
        sockets.push(socket);

        var sqlQuery = "select * from user where username = '" + userData.username + "';";
        // DBConnection.connect();
        DBConnection.query(sqlQuery, function (error, results) {
            //if (error) throw error;

            var isLoggedIn = false;
            console.log(results);
            if (results.length > 0) {
                if (userData.password == results[0].password) {
                    isLoggedIn = true;
                    socket.emit('loginStatus', {
                        result: 'success',
                        id: results[0].id
                    });
                }
            }

            if (!isLoggedIn) {
                socket.emit('loginStatus', {
                    result: 'failure',
                    id: 0
                });
            }
        });
        // DBConnection.end();
    });

    socket.on('signup', function (userData) {
        console.log(userData);
        var sqlQuery = "insert into user (username, password) values('" + userData.username + "', '" + userData.password + "');";
        DBConnection.query(sqlQuery, function () {
            var hasSignedUp = false;
            sqlQuery = "select id from user where username = '" + userData.username + "';";
            DBConnection.query(sqlQuery, function (error, results) {
                if (results.length > 0) {
                    hasSignedUp = true;
                    socket.emit('signupStatus', {
                        result: 'success',
                        id: results[0].id
                    });
                }

                if (!isLoggedIn) {
                    socket.emit('signupStatus', {
                        result: 'failure',
                        id: 0
                    });
                }
            })
        })
    });

    socket.on('queryFriends', function (userData) {
        console.log(userData);
        var sqlQuery = "select * from friends where u1_id = " + userData.uid + " or u2_id = " + userData.uid + ";";
        console.log(sqlQuery);
        // DBConnection.connect();
        DBConnection.query(sqlQuery, function (error, results) {
            //if (error) throw error;
            var fooSql = "select * from user where ";
            for (var cursor in results) {
                fooSql += "id = " + results[cursor].u1_id + " or id = " + results[cursor].u2_id;
                if (cursor < results.length - 1) {
                    fooSql += " or ";
                }
            }
            fooSql += ";";
            console.log(fooSql);
            DBConnection.query(fooSql, function (error, results) {
                socket.emit('friendList', {
                    results: results
                });
            });
        });
        // DBConnection.end();
    });


    socket.on('messageTo', function (messageData) {


        // io.emit(messageData.to, {
        //     fromID: Number(messageData.fromID),
        //     from: messageData.from,
        //     message: messageData.message,
        // })


        // socket.broadcast.emit('receive', {
        //     fromID: Number(messageData.fromID),
        //     from: messageData.from,
        //     message: messageData.message,
        //     to: messageData.to
        // });

        for (var index in sockets) {
            if (sockets[index].username == messageData.to) {
                console.log('fuckit');
                console.log(sockets.length);
                sockets[index].emit('receive', {
                    fromID: Number(messageData.fromID),
                    from: messageData.from,
                    message: messageData.message,
                    to: messageData.to
                });
                break

            }
        }

    });



    socket.on('addFriend', function (userData) {
        // var sqlQuery = "insert into friends(u1_id, u2_id) values(" + userData.uid + ", " + userData.toAddID + "), (" + userData.toAddID + ", " + userData.uid + ");";
        var sqlQuery = "insert into friends(u1_id, u2_id) values(" + userData.uid + ", " + userData.toAddID + ");";
        // DBConnection.connect();
        DBConnection.query(sqlQuery, function (error) {
            //if (error) throw error;
            socket.emit('didAddFriend', {
                result: "success"
            });
        });
        // DBConnection.end();
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected');
        for (var index in sockets) {
            if (sockets[index].username == socket.username) {
                sockets.splice(index, 1);
            }
        }
    })
});

