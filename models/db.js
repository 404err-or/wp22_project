const mysql = require('mysql'); // mysql 변수에 mysql 모듈을 할당
require('dotenv').config()

// const db = mysql. createConnection({  //db변수에 mysql변수에 있는 크리에이드커넥션 메소드를 호출(객체를 받음) 할당
//     host : process.env.DB_HOST,   //host객체 - 마리아DB가 존재하는 서버의 주소
//     user : process.env.DB_USER, //user객체 - 마리아DB의 계정
//     password : process.env.DB_PASS,   //password객체 - 마리아DB 계정의 비밀번호
//     port : process.env.DB_PORT,
//     database : process.env.DB_DATABASE   //database객체 - 접속 후 사용할 DB명
// });
options = {  //db변수에 mysql변수에 있는 크리에이드커넥션 메소드를 호출(객체를 받음) 할당
    host : process.env.DB_HOST,   //host객체 - 마리아DB가 존재하는 서버의 주소
    user : process.env.DB_USER, //user객체 - 마리아DB의 계정
    password : process.env.DB_PASS,   //password객체 - 마리아DB 계정의 비밀번호
    port : process.env.DB_PORT,
    database : process.env.DB_DATABASE   //database객체 - 접속 후 사용할 DB명
}
exports.options = options;
const db = mysql. createPool(options);
let t = new Date();
console.log(t.toString());

db.getConnection(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
});

const sql = {
    'login': 'SELECT * FROM admin WHERE id=? AND pw=password(?)',
    'email': 'SELECT email FROM admin WHERE id=?',
    'change_pw': 'UPDATE admin SET pw=password(?) WHERE id=?'
};

exports.sql_query = (sql_data, params) => {
    return new Promise(function(resolve, reject){
        db.query(sql[sql_data], params, function (err, rows, fields) {
            if (!err) {
                resolve(rows);
            } else {
                // console.log('query error : ' + err);
                console.log(err);
                reject(err);
            }
        });
    });
};