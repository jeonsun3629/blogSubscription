const express = require('express');
const path = require('path');
const routes = require('./dist/routes').default;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 설정
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// API 라우트 등록
app.use('/', routes);

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 포스트 상세 페이지
app.get('/post/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'post.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
}); 