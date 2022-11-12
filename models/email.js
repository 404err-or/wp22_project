const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
    },
});

const RAND_DATA = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z'
];

const emailTemplete = (code) => `<html>
    <body>
        <div>
            <p style='color:black'>비밀번호 찾기를 통해 전송된 메일입니다.</p>
            <p style='color:black'>아래의 인증 번호를 입력하여 인증을 완료해주세요.</p>
            <h2>${code}</h2>
        </div>
    </body>
</html>`;

exports.Auth = () => {
    let data = [
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', ''
    ];
    return 'wp22 - ' + data.map((e, i) => {
        rand = Math.floor(Math.random() * 36);
        return RAND_DATA[rand];
    }).join('');
}
exports.sendmail = async (code, recipient, type, func=()=>{}) => {
    await smtpTransport.sendMail({
        from: `wp22 - 403 cctv`,
        to: recipient,
        subject: '비밀번호 찾기을 위한 인증번호를 입력해주세요.',
        html: emailTemplete(code),
    }, function (err, res) {
        console.log("Finish sending email : " + res.response);
        smtpTransport.close();
        if (err) {
            console.log(err);
            return false;
        }
        func();
        return true;
    });
};