# AI 트렌드 파인더

노션 데이터베이스와 연결된 AI 트렌드 정보 블로그입니다.

## 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 항목을 설정하세요:

```env
# 서버 설정
PORT=3000

# Notion API 설정
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id

# Notion 데이터베이스 속성 이름
NOTION_TITLE_PROPERTY=Title
NOTION_DATE_PROPERTY=Date
NOTION_CATEGORY_PROPERTY=Category
NOTION_EXCERPT_PROPERTY=Summary_kr
NOTION_CONTENT_FULL_PROPERTY=Content_full_kr
NOTION_IMAGE_URL_PROPERTY=Image_URL
NOTION_VIDEO_URL_PROPERTY=Video_URL

# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

## Supabase 설정

인기 포스트 기능을 사용하려면 Supabase에서 다음 테이블을 생성해야 합니다:

```sql
-- post_clicks 테이블 생성
CREATE TABLE IF NOT EXISTS post_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS post_clicks_post_id_idx ON post_clicks(post_id);
CREATE INDEX IF NOT EXISTS post_clicks_clicked_at_idx ON post_clicks(clicked_at);

-- 보안 정책 설정 (RLS)
ALTER TABLE post_clicks ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (서비스 계정만 허용)
CREATE POLICY "Service accounts can read post_clicks"
  ON post_clicks FOR SELECT
  USING (auth.role() = 'service_role');

-- 삽입 정책 (인증된 사용자와 익명 사용자 모두 허용)
CREATE POLICY "Anyone can insert into post_clicks"
  ON post_clicks FOR INSERT
  WITH CHECK (true);
```

## 프로젝트 실행

### 설치

```bash
npm install
```

### 개발 모드

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm start
```

## 주요 기능

- Notion 데이터베이스에서 블로그 포스트 표시
- 카테고리별 포스트 필터링
- 검색 기능
- 인기 포스트 표시 (최근 1주일 동안 가장 많이 클릭된 포스트)

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

## 구독 시스템 설정

구독 시스템을 사용하기 위해 다음 단계를 따라 설정하세요:

### 1. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```env
# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# 서버 설정
PORT=3000
NODE_ENV=development
WEBSITE_URL=http://localhost:3000 # 프로덕션에서는 실제 URL로 변경

# 이메일 서비스 설정 (SMTP)
EMAIL_HOST=smtp.gmail.com # Gmail 사용 예시, 다른 서비스도 가능
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password # Gmail의 경우 앱 비밀번호 사용
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=AI 트렌드 파인더

# 알림 API 보안
NOTIFICATION_API_KEY=your_secret_api_key_for_notifications # 임의의 안전한 문자열
```

> **참고**: Gmail을 사용하는 경우 앱 비밀번호를 생성해야 합니다. Google 계정 설정에서 2단계 인증을 활성화한 다음 앱 비밀번호를 생성하세요.

### 2. 이메일 서비스 설정

이메일 발송을 위해 다음 서비스 중 하나를 선택할 수 있습니다:

- **Gmail**: 개인 이메일 계정을 사용하여 테스트하기 적합 (일일 발송 제한 있음)
- **SendGrid**: 대량 이메일에 적합 (무료 티어: 일 100건)
- **Mailgun**: 트랜잭션 이메일에 적합 (무료 티어: 월 5,000건)
- **AWS SES**: 대규모 이메일 발송에 적합 (가장 경제적인 가격)

Gmail 외 다른 서비스를 사용하려면 `src/config/email.ts` 파일의 설정을 수정하세요.

### 3. 블로그 업데이트 알림 전송 방법

블로그에 새 글이 게시될 때 구독자에게 알림을 보내려면:

1. 관리자 권한으로 다음 API 엔드포인트를 호출합니다:

```bash
curl -X POST http://your-domain.com/api/send-update-notifications \
  -H "x-api-key: your_notification_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {
        "title": "새로운 AI 모델 소개",
        "url": "http://your-domain.com/post/new-ai-model",
        "excerpt": "최근 출시된 혁신적인 AI 모델에 대해 알아봅니다."
      },
      {
        "title": "머신러닝 기초 가이드",
        "url": "http://your-domain.com/post/ml-basics",
        "excerpt": "머신러닝을 처음 시작하는 분들을 위한 가이드입니다."
      }
    ]
  }'
```

2. 또는 자동화 스크립트를 사용하여 새 게시물이 있을 때 자동으로 알림을 보낼 수 있습니다. 
    이를 위해 Notion API 또는 데이터베이스 업데이트를 모니터링하는 로직을 추가로 구현하세요. 