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

// 방문자 기록 저장
export const logVisitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const ipStr = Array.isArray(ip) ? ip[0] : ip;
    const { error } = await supabase.from('visitor_logs').insert({
      ip_address: ipStr,
      user_agent: userAgent,
      visited_at: new Date()
    });
    if (error) {
      console.error('방문자 기록 저장 중 오류:', error);
      res.status(500).json({ error: '방문자 기록 저장 중 오류가 발생했습니다.' });
      return;
    }
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('방문자 기록 저장 중 예기치 않은 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 오늘(한국시간) 방문자 수 반환
export const getTodayVisitorCount = async (req: Request, res: Response): Promise<void> => {
  try {
    // 한국시간(KST) 기준 오늘 00:00 ~ 23:59
    const now = new Date();
    const kstOffset = 9 * 60; // KST: UTC+9
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstNow = new Date(utc + (kstOffset * 60000));
    const start = new Date(kstNow);
    start.setHours(0, 0, 0, 0);
    const end = new Date(kstNow);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('visitor_logs')
      .select('ip_address')
      .gte('visited_at', start.toISOString())
      .lte('visited_at', end.toISOString());

    if (error) {
      console.error('오늘 방문자 수 조회 중 오류:', error);
      res.status(500).json({ error: 'DB 조회 오류' });
      return;
    }

    // 유니크 IP만 카운트
    const uniqueIps = Array.from(new Set((data || []).map(v => v.ip_address)));
    res.json({ count: uniqueIps.length });
  } catch (error) {
    console.error('오늘 방문자 수 집계 중 예기치 않은 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}; 