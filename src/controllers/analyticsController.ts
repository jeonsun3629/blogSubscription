import { Request, Response } from 'express';
import supabase from '../config/supabase';

// 포스트 클릭 트래킹
export const trackPostClick = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    
    if (!postId) {
      res.status(400).json({ error: '포스트 ID가 필요합니다.' });
      return;
    }

    // 클릭 이벤트 기록
    const { error } = await supabase
      .from('post_clicks')
      .insert({
        notion_page_id: postId,
        clicked_at: new Date(),
        user_agent: req.headers['user-agent'] || '',
        ip_address: req.ip || req.socket.remoteAddress || '',
      });

    if (error) {
      console.error('클릭 트래킹 중 오류 발생:', error);
      res.status(500).json({ error: '클릭 트래킹 중 오류가 발생했습니다.' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('클릭 트래킹 중 예기치 않은 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 인기 포스트 가져오기 (클릭 수에 따라 정렬된 포스트)
export const getPopularPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    // 현재 날짜에서 7일 전 날짜 계산
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // 인기 포스트 쿼리 - 클릭 카운트 테이블에서 상위 5개 가져오기
    const { data, error } = await supabase
      .from('post_click_counts')
      .select('notion_page_id, click_count, last_clicked_at')
      .gte('last_clicked_at', oneWeekAgo.toISOString())
      .order('click_count', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('인기 포스트 조회 중 오류 발생:', error);
      res.status(500).json({ error: '인기 포스트 조회 중 오류가 발생했습니다.' });
      return;
    }
    
    // 포스트 ID 목록 추출
    const postIds = data.map(item => item.notion_page_id);
    
    if (postIds.length === 0) {
      res.json({ posts: [] });
      return;
    }
    
    // 각 포스트의 상세 정보 가져오기 - Notion API 호출 필요
    // 이 부분은 Notion API에서 포스트 정보를 가져오는 로직 구현 필요
    // 임시 로직: 클라이언트에게 인기 포스트 ID만 반환
    res.json({ 
      popularPostIds: postIds,
      clickData: data
    });
  } catch (error) {
    console.error('인기 포스트 조회 중 예기치 않은 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}; 