-- post_clicks 테이블 생성
CREATE TABLE IF NOT EXISTS post_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notion_page_id TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS post_clicks_notion_page_id_idx ON post_clicks(notion_page_id);
CREATE INDEX IF NOT EXISTS post_clicks_clicked_at_idx ON post_clicks(clicked_at);

-- 포스트 클릭 카운트 테이블 생성
CREATE TABLE IF NOT EXISTS post_click_counts (
  notion_page_id TEXT PRIMARY KEY,
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 보안 정책 설정 (RLS)
ALTER TABLE post_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_click_counts ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (서비스 계정만 허용)
CREATE POLICY "Service accounts can read post_clicks"
  ON post_clicks FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service accounts can read post_click_counts"
  ON post_click_counts FOR SELECT
  USING (auth.role() = 'service_role');

-- 삽입 정책 (인증된 사용자와 익명 사용자 모두 허용)
CREATE POLICY "Anyone can insert into post_clicks"
  ON post_clicks FOR INSERT
  WITH CHECK (true);

-- 업데이트 정책 (서비스 계정만 허용)
CREATE POLICY "Service accounts can update post_click_counts"
  ON post_click_counts FOR UPDATE
  USING (auth.role() = 'service_role');

-- 클릭 이벤트 발생 시 post_click_counts 테이블 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_post_click_count() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO post_click_counts (notion_page_id, click_count, last_clicked_at, last_updated)
  VALUES (NEW.notion_page_id, 1, NEW.clicked_at, NOW())
  ON CONFLICT (notion_page_id) 
  DO UPDATE SET 
    click_count = post_click_counts.click_count + 1,
    last_clicked_at = NEW.clicked_at,
    last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- post_clicks에 트리거 연결
DROP TRIGGER IF EXISTS trigger_update_post_click_count ON post_clicks;
CREATE TRIGGER trigger_update_post_click_count
AFTER INSERT ON post_clicks
FOR EACH ROW
EXECUTE FUNCTION update_post_click_count();

-- 7일 이상 지난 클릭 데이터 자동 삭제를 위한 함수 생성
CREATE OR REPLACE FUNCTION delete_old_post_clicks() RETURNS void AS $$
BEGIN
  DELETE FROM post_clicks
  WHERE clicked_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 매일 자정에 함수를 실행하는 트리거 생성
SELECT cron.schedule(
  'delete-old-post-clicks',
  '0 0 * * *',
  $$SELECT delete_old_post_clicks()$$
); 