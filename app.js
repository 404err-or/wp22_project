const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const session = require('express-session');
const logger = require('morgan');
const favicon = require('serve-favicon');
const ios = require("express-socket.io-session");
const fs = require('fs');
const path = require('path');
const { options, sql_query} = require("./models/db");
const { Auth, sendmail } = require("./models/email");
require('dotenv').config();
console.log(options);
const session_data = session({
	HttpOnly:true,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
});
const pantilthat = require('pan-tilt-hat');
const pan_tilt = new pantilthat;
pan_tilt.pan(0);
pan_tilt.tilt(0);

const spawn = require('child_process').spawn;
let proc;
// let proc_vid;
app.set("view engine", "ejs");

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.png')))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(session_data);
io.use(ios(
    session_data, {
        autoSave: true
    }
));

let code_verify = {};
let sockets = {};
let logined_session = '';
let interval;

const IsLogin = (session) => {
	return (session && session.login == true && session.name)?true:false;
}

app.get('/image_stream.jpg', function(req, res) {
	if(IsLogin(req.session) && req.session.id == logined_session) {
		// console.log(req.headers.referer, req.headers.host);
		if((req.headers.host == '10.82.119.6:3000' || req.headers.host == '192.168.10.11:3000') && req.headers.referer == 'http://' + req.headers.host + '/main') {
			// console.log(JSON.stringify(req.headers, null,4));
			res.setHeader('content-type', 'image/jpeg');
			res.sendFile(__dirname + '/stream/image_stream.jpg');
		} else {
			res.send('403 Bad requests: Other host');
		}
	} else {
		res.send('403 Bad requests: dont login or incorrect session');
	}
});

app.get('/', function (req, res) {
	if(IsLogin(req.session)) {
		res.render("index", {islogin: true, name: req.session.name});
	} else {
		res.render("index", {islogin: false});
	}
});

app.get('/forget', function (req, res) {
	if(IsLogin(req.session)) {
		res.redirect('/main');
	} else {
		res.sendFile(__dirname + '/public/forget.html');
	}
});

app.post("/forget", function(req,res){
    if(req.session.name) {
        res.redirect('/main');
    } else {
        if(req.body && req.body.id && req.body.id_verify) {
            let id = req.body.id;
            let code = req.body.id_verify;
			let pw = req.body.pw;
			let valid_pw = req.body.valid_pw;
			if(code_verify[id] == code && code_verify[id] && code_verify[id].length == 27) {
				if(pw === valid_pw && pw.length >= 8) {
					sql_query('change_pw', [pw,id])
						.then(result => res.send('success'))
						.catch((err)=> {
							console.log(err);
							res.send('error');
						})
				} else {
					res.send('fail');
				}
			} else {
				res.send('fail');
			}
        }
    }
});

app.get('/login', function (req, res) {
	if(IsLogin(req.session)) {
		res.redirect('/main');
	} else {
		res.sendFile(__dirname + '/public/login.html');
	}
});

app.post("/login", function(req,res){ // login site
    if(req.session.name) {
        console.log(req.session)
        res.redirect("/");
    } else {
        if(req.body && req.body.name && req.body.password) {
            console.log(req.body);
            sql_query('login', [req.body.name, req.body.password])
                .then(result => {
                    if(result.length == 0) {
                        res.send('<script>alert("로그인 실패!");history.go(-1)</script>');
                    } else {
                        req.session.name = req.body.name;
						req.session.login = true;
						logined_session = req.session.id;
						console.log(req.session.id);
                        res.redirect('/main');
                    }
                })
        } else {
            res.redirect("/");
        }
    }
});

app.get("/logout", function(req,res){ // login site
    if(req.session.name) {
        req.session.destroy();
    }
    res.redirect("/login");
});

app.get('/main', function (req, res) {
	if(IsLogin(req.session)) {
		res.render("main", {name: req.session.name});
		// res.sendFile(__dirname + '/main.html');
	} else {
		res.redirect('/login');
	}
});

app.post('/check_id', function(req, res) { // email authentication code
    let id = req.body.id;
	sql_query('email', [req.body.id])
		.then(result => {
			if(result.length == 0) {
				res.send('fail');
			} else {
				let code = Auth();
				let status = sendmail(code, result[0].email);
				code_verify[id] = code;
				setTimeout(() => {
					delete code_verify[id];
				}, 10*60*1000);
				console.log(JSON.stringify(code_verify,null,4));
				if(status) {
					res.send('success');
				} else {
					res.send('fail');
				}
			}
		})
});

app.post('/verify_id', function(req, res) { // email authentication code check
    let id = req.body.id;
    let code = req.body.code;
    if(code_verify[id] == code && code_verify[id] && code_verify[id].length == 27) {
        res.send('success');
    } else {
        res.send('fail');
    }
});

io.on('connection', function (socket) {

	sockets[socket.id] = [socket.handshake.session, socket];

	socket.on('page', function(url) {
		let socket_key = Object.keys(sockets);
		console.log(socket.id, socket.handshake.session.id);
		console.log(logined_session);
		console.log(sockets);
		for(let i in socket_key) {
			let socket_id = socket_key[i];
			// let session_id = sockets[socket_id][0].id;
			console.log(socket_id, sockets[socket_id][0].id);
			console.log(sockets[socket_id][0]);
	
			if(!IsLogin(sockets[socket_id][0])) {
				console.log('no login');
				io.to(socket_id).emit('other login');
				sockets[socket_id][1].disconnect();
				delete sockets[socket_id];
			} else if(sockets[socket_id][0].id != logined_session) {
				console.log('other login');
				sockets[socket_id][0].destroy();
				io.to(socket_id).emit('other login');
				sockets[socket_id][1].disconnect();
				delete sockets[socket_id];
			} else if(socket_id != socket.id) {
				if(url == 'main') {
					io.to(socket_id).emit('other stream');
					sockets[socket_id][1].disconnect();
					delete sockets[socket_id];
				}
			}
		}
	})

	console.log("Total clients connected : ", Object.keys(sockets).length);

	socket.on('disconnect', function () {
		delete sockets[socket.id];

		// no more sockets, kill the stream
		if (Object.keys(sockets).length == 0) {
			app.set('watchingFile', false);
			clearInterval(interval);
			if (proc) proc.kill();
			fs.unwatchFile('./stream/image_stream.jpg');
		}
	});

	socket.on('change value', function(type, val) {
		console.log(type, val);
		if(type == 'vertical') {
			pan_tilt.pan(val);
		} else if(type == 'horizontal') {
			pan_tilt.tilt(val);
		}
	})

	socket.on('start-stream', function () {
		startStreaming(io);
	});

});

http.listen(3000, function () {
	console.log('listening on *:3000');
});

function startStreaming(io) {

	if (app.get('watchingFile')) {
		return;
	}

	let args = ["-w", "640", "-h", "480", "-q", "50", "-o", "./stream/image_stream.jpg", "-t", 200*60*1000, "-tl", "0", "-ex", "auto", "-a", "8", "-a", "wp %Y-%m-%d %X", "-ae", "16"]
	/**
	 * w: 너비
	 * h: 높이
	 * q: 화질
	 * o: 저장 위치
	 * t: 동작 시간
	 * tl: 타임랩스, 사진찍는 주기
	 * ex: 노출모드 설정
	 * a: 설명 플래그 또는 텍스트 활성화 설정
	 * ae: 추가 설명 파라미터 설정
	 */
	// proc_vid = spawn('raspivid', args_vid);
	proc = spawn('raspistill', args);

	if(!interval) {
		interval = setInterval(()=> {
			if (proc) proc.kill();
			proc = spawn('raspistill', args);
		}, 60*60*1000);
	}

	console.log('Watching for changes...');

	app.set('watchingFile', true);

	fs.watchFile('./stream/image_stream.jpg', function (current, previous) {
		io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
	})

}
