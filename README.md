# AI 트렌드 파인더

노션 데이터베이스를 활용한 AI 트렌드 블로그입니다. 노션 데이터베이스에서 컨텐츠를 가져와 웹사이트에 표시합니다.

## 기능

- 노션 데이터베이스에서 블로그 포스트 가져오기
- 포스트 목록 및 상세 페이지 표시
- 카테고리별 필터링 (고정된 순서로 표시)
- 이미지 및 비디오 콘텐츠 지원
- 원문 전체 콘텐츠 표시
- 반응형 디자인
- 검색 기능
- 뉴스레터 구독 폼
- 다크 모드 지원
- TypeScript 지원

## 기술 스택

- Node.js
- Express
- TypeScript
- Notion API
- 바닐라 JavaScript (프론트엔드)
- CSS3

## 설치 방법

1. 저장소 클론하기:
   ```
   git clone https://github.com/yourusername/ai-trend-finder.git
   cd ai-trend-finder
   ```

2. 의존성 설치:
   ```
   npm install
   ```

3. 환경 변수 설정:
   `.env` 파일을 생성하고 다음 정보를 입력하세요:
   ```
   NOTION_API_KEY=your_notion_api_key
   NOTION_DATABASE_ID=your_notion_database_id
   
   # 노션 데이터베이스 속성 이름 설정 (속성이 다른 이름일 경우 수정)
   NOTION_TITLE_PROPERTY=Title
   NOTION_DATE_PROPERTY=Date
   NOTION_CATEGORY_PROPERTY=Category
   NOTION_EXCERPT_PROPERTY=Content_kr
   NOTION_CONTENT_FULL_PROPERTY=Content_full
   NOTION_IMAGE_URL_PROPERTY=Image_URL
   NOTION_VIDEO_URL_PROPERTY=Video_URL
   
   PORT=3000
   ```

4. 노션 통합 설정:
   - Notion 계정에서 [새 통합](https://www.notion.so/my-integrations)을 생성하세요.
   - 통합 토큰을 `.env` 파일의 `NOTION_API_KEY`에 입력하세요.
   - 데이터베이스 ID를 `.env` 파일의 `NOTION_DATABASE_ID`에 입력하세요.
   - 노션 데이터베이스에서 통합을 연결하세요.

## Notion 데이터베이스 구조

노션 데이터베이스는 다음 속성을 포함해야 합니다:

- `Title` (title) - 포스트 제목
- `Date` (date) - 포스트 작성 날짜
- `Category` (select) - 포스트 카테고리 (모델 업데이트, 연구 동향, 시장 동향, 개발자 도구 등)
- `Content_kr` (rich_text) - 포스트 요약 (한국어)
- `Content_full` (rich_text) - 포스트 전체 내용 (선택사항)
- `Image_URL` (url) - 포스트 대표 이미지 URL (선택사항)
- `Video_URL` (url) - 포스트 관련 비디오 URL (선택사항)

**참고**: 이미지나 비디오 URL이 `example.com` 도메인을 포함하거나 "example"로 시작하는 경우, 포스트 페이지에서 표시되지 않습니다.

## 카테고리 순서

카테고리는 다음과 같은 고정된 순서로 표시됩니다:
1. 모든 글 보기
2. 모델 업데이트 
3. 연구 동향
4. 시장 동향
5. 개발자 도구

새로운 카테고리를 추가하면 위 고정 카테고리 다음에 표시됩니다.

## 실행 방법

TypeScript 빌드:
```
npm run build
```

개발 모드에서 서버 실행:
```
npm run dev
```

프로덕션 모드에서 서버 실행:
```
npm start
```

TypeScript 파일 변경사항 감시:
```
npm run watch
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 배포 방법

다음 서비스를 사용하여 웹사이트를 배포할 수 있습니다:

### 간단한 방법 (권장)
1. **Vercel**
   - GitHub 저장소 연결
   - 환경 변수 설정
   - 자동 배포 활성화

2. **Render**
   - Web Service로 설정
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - 환경 변수 설정

### 직접 서버 관리
1. **DigitalOcean/Linode**
   - Node.js 앱으로 설정
   - Nginx를 프록시 서버로 설정
   - PM2로 앱 실행 관리

### 추가 설정
- 커스텀 도메인 연결
- SSL 인증서 설정 (Let's Encrypt 권장)
- 필요시 CDN 설정

## 라이선스

MIT License 