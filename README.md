# AI 트렌드 파인더

노션 데이터베이스를 활용한 AI 트렌드 블로그입니다. 노션 데이터베이스에서 컨텐츠를 가져와 웹사이트에 표시합니다.

## 기능

- 노션 데이터베이스에서 블로그 포스트 가져오기
- 포스트 목록 및 상세 페이지 표시
- 반응형 디자인
- 검색 기능 (기본 구현)
- 뉴스레터 구독 폼
- TypeScript 지원

## 기술 스택

- Node.js
- Express
- TypeScript
- Notion API

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
   NOTION_TITLE_PROPERTY=제목
   NOTION_DATE_PROPERTY=Published
   NOTION_CATEGORY_PROPERTY=카테고리
   NOTION_EXCERPT_PROPERTY=요약
   
   PORT=3000
   ```

4. 노션 통합 설정:
   - Notion 계정에서 [새 통합](https://www.notion.so/my-integrations)을 생성하세요.
   - 통합 토큰을 `.env` 파일의 `NOTION_API_KEY`에 입력하세요.
   - 데이터베이스 ID를 `.env` 파일의 `NOTION_DATABASE_ID`에 입력하세요.
   - 노션 데이터베이스에서 통합을 연결하세요.

## Notion 데이터베이스 구조

노션 데이터베이스는 다음 속성을 포함해야 합니다:

- `제목` (title) - 포스트 제목
- `작성일` (date) - 포스트 작성 날짜
- `카테고리` (select) - 포스트 카테고리
- `요약` (rich_text) - 포스트 요약 (선택사항)

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

## 라이선스

MIT License 