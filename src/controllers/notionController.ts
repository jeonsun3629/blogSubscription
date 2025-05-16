import { Client } from '@notionhq/client';
import { Request, Response } from 'express';
import { NotionBlock, NotionPost, NotionPostDetail } from '../types/notion';
import dotenv from 'dotenv';
import supabase from '../config/supabase';

dotenv.config();

// Notion API 클라이언트 초기화
const notion = new Client({
  auth: process.env.NOTION_API_KEY || '',
});

// Notion 데이터베이스 ID
const databaseId = process.env.NOTION_DATABASE_ID || '';

// 노션 데이터베이스 속성 이름
const TITLE_PROPERTY = process.env.NOTION_TITLE_PROPERTY || 'Title';
const DATE_PROPERTY = process.env.NOTION_DATE_PROPERTY || 'Date';
const CATEGORY_PROPERTY = process.env.NOTION_CATEGORY_PROPERTY || 'Category';
const EXCERPT_PROPERTY = process.env.NOTION_EXCERPT_PROPERTY || 'Summary_kr';
const CONTENT_FULL_PROPERTY = process.env.NOTION_CONTENT_FULL_PROPERTY || 'Content_full_kr';
const IMAGE_URL_PROPERTY = process.env.NOTION_IMAGE_URL_PROPERTY || 'Image_URL';
const VIDEO_URL_PROPERTY = process.env.NOTION_VIDEO_URL_PROPERTY || 'Video_URL';
const URL_PROPERTY = process.env.NOTION_URL_PROPERTY || 'URL';

// 모든 포스트 가져오기 (페이지네이션 지원)
export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    // 페이지네이션 파라미터 추출
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 5;
    const category = req.query.category as string || '';
    
    // 정렬 없이 기본 쿼리 실행
    const response = await notion.databases.query({
      database_id: databaseId,
      // 정렬 관련 코드 완전 제거
    });
    
    // 포스트 데이터 처리
    const allPosts: NotionPost[] = [];
    
    // 카테고리 카운트 추적 (동적으로 생성)
    const categoryCounts: Record<string, number> = {};
    
    for (const pageItem of response.results) {
      // 타입 캐스팅
      const pageObj = pageItem as any;
      
      if (pageObj.properties) {
        try {
          // 카테고리 값 가져오기 (디버깅용 로그 추가)
          console.log('Category property path:', CATEGORY_PROPERTY);
          console.log('Properties available:', Object.keys(pageObj.properties));
          
          const postCategory = pageObj.properties[CATEGORY_PROPERTY]?.select?.name || '분류 없음';
          console.log('Post category found:', postCategory);
          
          // 요약(Summary_kr) 필드 디버깅
          console.log('Excerpt property path:', EXCERPT_PROPERTY);
          console.log('Excerpt value:', JSON.stringify(pageObj.properties[EXCERPT_PROPERTY], null, 2));
          
          // 카테고리 카운트 동적 관리
          if (!categoryCounts[postCategory]) {
            categoryCounts[postCategory] = 0;
          }
          categoryCounts[postCategory]++;
          
          // rich_text 필드에서 데이터 추출 방법 개선
          let excerptText = '이 포스트에 대한 요약이 없습니다.';
          const excerptProperty = pageObj.properties[EXCERPT_PROPERTY];
          
          if (excerptProperty && excerptProperty.rich_text && excerptProperty.rich_text.length > 0) {
            excerptText = excerptProperty.rich_text[0].plain_text || excerptText;
            console.log('Found excerpt text:', excerptText);
          } else if (excerptProperty) {
            console.log('Excerpt property structure:', JSON.stringify(excerptProperty, null, 2));
          }
          
          const post: NotionPost = {
            id: pageObj.id,
            title: pageObj.properties[TITLE_PROPERTY]?.title[0]?.plain_text || '제목 없음',
            date: pageObj.properties[DATE_PROPERTY]?.date?.start || pageObj.created_time || null,
            category: postCategory,
            excerpt: excerptText,
            content_full: pageObj.properties[CONTENT_FULL_PROPERTY]?.rich_text?.[0]?.plain_text || '',
            imageUrl: pageObj.properties[IMAGE_URL_PROPERTY]?.url || '',
            videoUrl: pageObj.properties[VIDEO_URL_PROPERTY]?.url || '',
            originalUrl: pageObj.properties[URL_PROPERTY]?.url || '',
          };
          
          // 제목이 "제목 없음"인 포스트는 제외하고 유효한 제목이 있는 포스트만 추가
          const hasValidTitle = post.title !== '제목 없음' && post.title.trim() !== '';
          
          // 카테고리 필터링이 있는 경우 필터링 적용 + 유효한 제목 확인
          if (((!category || category === post.category) && hasValidTitle)) {
            allPosts.push(post);
          }
        } catch (error) {
          console.error('포스트 처리 중 오류:', error);
          // 오류가 있는 포스트는 건너뛰고 계속 진행
        }
      }
    }
    
    // 페이지네이션 정보 계산
    const totalPosts = allPosts.length;
    const totalPages = Math.ceil(totalPosts / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    // 페이지에 해당하는 포스트만 필터링
    const paginatedPosts = allPosts.slice(startIndex, endIndex);
    
    // 페이지네이션 정보와 함께 응답
    res.json({
      posts: paginatedPosts,
      pagination: {
        totalPosts,
        totalPages,
        currentPage: page,
        perPage,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      categoryCounts
    });
  } catch (error) {
    console.error('Notion 데이터베이스에서 포스트를 가져오는 중 오류 발생:', error);
    res.status(500).json({ error: 'Notion 데이터를 가져오는 중 오류가 발생했습니다.' });
  }
};

// ID로 특정 포스트 가져오기
export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    
    // 포스트 정보 가져오기
    const postInfo = await notion.pages.retrieve({ page_id: postId });
    
    // 포스트 내용(블록) 가져오기
    const blocks = await notion.blocks.children.list({
      block_id: postId,
    });
    
    // 타입 캐스팅
    const pageObj = postInfo as any;
    
    // 디버깅: 포스트 속성 확인
    console.log('Post properties:', Object.keys(pageObj.properties));
    console.log('Excerpt property:', EXCERPT_PROPERTY);
    console.log('Excerpt data:', JSON.stringify(pageObj.properties[EXCERPT_PROPERTY], null, 2));
    
    // rich_text 필드에서 데이터 추출 방법 개선
    let excerptText = '이 포스트에 대한 요약이 없습니다.';
    const excerptProperty = pageObj.properties[EXCERPT_PROPERTY];
    
    if (excerptProperty && excerptProperty.rich_text && excerptProperty.rich_text.length > 0) {
      excerptText = excerptProperty.rich_text[0].plain_text || excerptText;
      console.log('Found excerpt text for single post:', excerptText);
    } else if (excerptProperty) {
      console.log('Single post excerpt property structure:', JSON.stringify(excerptProperty, null, 2));
    }
    
    // URL 필드에서 원본 URL 가져오기
    const originalUrl = pageObj.properties[URL_PROPERTY]?.url || '';
    console.log('Original URL from database:', originalUrl);
    
    // 포스트 데이터 처리
    const post: NotionPostDetail = {
      id: pageObj.id,
      title: pageObj.properties[TITLE_PROPERTY]?.title[0]?.plain_text || '제목 없음',
      date: new Date(pageObj.properties[DATE_PROPERTY]?.date?.start || pageObj.created_time || Date.now()).toLocaleDateString('ko-KR'),
      category: pageObj.properties[CATEGORY_PROPERTY]?.select?.name || '분류 없음',
      excerpt: excerptText,
      content_full: pageObj.properties[CONTENT_FULL_PROPERTY]?.rich_text?.[0]?.plain_text || '',
      imageUrl: pageObj.properties[IMAGE_URL_PROPERTY]?.url || '',
      videoUrl: pageObj.properties[VIDEO_URL_PROPERTY]?.url || '',
      content: await processBlocks(blocks.results),
      originalUrl: originalUrl,
    };
    
    res.json(post);
  } catch (error) {
    console.error('Notion에서 포스트를 가져오는 중 오류 발생:', error);
    res.status(500).json({ error: 'Notion 데이터를 가져오는 중 오류가 발생했습니다.' });
  }
};

// Notion 블록 처리
async function processBlocks(blocks: any[]): Promise<NotionBlock[]> {
  let content: NotionBlock[] = [];
  
  for (const block of blocks) {
    const blockContent: NotionBlock = { type: '' };
    
    try {
      switch (block.type) {
        case 'paragraph':
          blockContent.type = 'paragraph';
          blockContent.text = block.paragraph.rich_text.map((t: any) => t.plain_text).join('');
          break;
        case 'heading_1':
          blockContent.type = 'heading_1';
          blockContent.text = block.heading_1.rich_text.map((t: any) => t.plain_text).join('');
          break;
        case 'heading_2':
          blockContent.type = 'heading_2';
          blockContent.text = block.heading_2.rich_text.map((t: any) => t.plain_text).join('');
          break;
        case 'heading_3':
          blockContent.type = 'heading_3';
          blockContent.text = block.heading_3.rich_text.map((t: any) => t.plain_text).join('');
          break;
        case 'bulleted_list_item':
          blockContent.type = 'bulleted_list_item';
          blockContent.text = block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('');
          break;
        case 'image':
          blockContent.type = 'image';
          blockContent.url = block.image.file?.url || block.image.external?.url || '';
          break;
        default:
          blockContent.type = 'unsupported';
          blockContent.text = '지원되지 않는 블록 타입';
      }
    } catch (error) {
      console.error('블록 처리 중 오류:', error);
      blockContent.type = 'error';
      blockContent.text = '블록 처리 중 오류 발생';
    }
    
    content.push(blockContent);
  }
  
  return content;
}

// 카테고리 목록 가져오기
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    // 데이터베이스 쿼리 실행
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    
    console.log('카테고리 정보 가져오기 시작');
    console.log('사용 중인 카테고리 속성 이름:', CATEGORY_PROPERTY);
    
    // 카테고리 목록을 저장할 Set (중복 제거)
    const categories = new Set<string>();
    const processedCategories = new Set<string>(); // 처리된 카테고리 추적
    
    // 샘플 포스트 속성 확인 (첫 번째 포스트만)
    if (response.results.length > 0) {
      const samplePage = response.results[0] as any;
      console.log('포스트 속성 목록 샘플:', Object.keys(samplePage.properties));
    }
    
    // 모든 포스트에서 카테고리 추출 (로그 최소화)
    response.results.forEach((page: any) => {
      const category = page.properties[CATEGORY_PROPERTY]?.select?.name;
      
      if (category) {
        // 이미 처리된 카테고리는 로그 출력하지 않음
        if (!processedCategories.has(category)) {
          console.log('발견된 카테고리:', category);
          processedCategories.add(category);
        }
        categories.add(category);
      }
    });
    
    // Set을 배열로 변환
    const categoryList = Array.from(categories);
    console.log('최종 카테고리 목록:', categoryList);
    
    // 카테고리 정보를 포함한 응답 객체 생성
    const categoryInfo = categoryList.map(category => {
      return {
        name: category,
        // 카테고리 아이콘과 색상 정보 추가
        icon: getCategoryIcon(category),
        color: getCategoryColor(category)
      };
    });
    
    res.json(categoryInfo);
  } catch (error) {
    console.error('카테고리 목록을 가져오는 중 오류 발생:', error);
    res.status(500).json({ error: '카테고리 목록을 가져오는 중 오류가 발생했습니다.' });
  }
};

// 카테고리에 적절한 아이콘 반환
function getCategoryIcon(category: string): string {
  switch (category.trim()) {
    case '모델 업데이트':
      return 'fa-robot';
    case '연구 동향':
      return 'fa-microscope';
    case '시장 동향':
      return 'fa-chart-line';
    case '개발자 도구':
      return 'fa-tools';
    default:
      return 'fa-tag';
  }
}

// 카테고리에 적절한 색상 코드 반환
function getCategoryColor(category: string): string {
  switch (category.trim()) {
    case '모델 업데이트':
      return '#3498db';
    case '연구 동향':
      return '#2ecc71';
    case '시장 동향':
      return '#e74c3c';
    case '개발자 도구':
      return '#f39c12';
    default:
      return '#95a5a6';
  }
}

// 포스트 검색 기능
export const searchPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('검색 API 호출됨');
    
    // 검색어 파라미터 추출
    const query = req.query.q as string || '';
    console.log('검색어:', query);
    
    // 검색어가 없는 경우
    if (!query.trim()) {
      console.log('검색어 없음, 400 응답');
      res.status(400).json({ error: '검색어를 입력해주세요.' });
      return;
    }
    
    // 데이터베이스 쿼리 실행 (모든 포스트를 가져온 후 필터링)
    console.log('Notion 데이터베이스 쿼리 시작');
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    console.log(`Notion 응답 - 총 ${response.results.length}개 결과 받음`);
    
    // 포스트 데이터 처리 및 검색어 필터링
    const matchedPosts: NotionPost[] = [];
    
    // 검색어를 소문자로 변환하여 비교
    const searchQuery = query.toLowerCase();
    
    for (const pageItem of response.results) {
      // 타입 캐스팅
      const pageObj = pageItem as any;
      
      if (pageObj.properties) {
        try {
          // 포스트 데이터 추출
          const title = pageObj.properties[TITLE_PROPERTY]?.title[0]?.plain_text || '';
          const excerpt = pageObj.properties[EXCERPT_PROPERTY]?.rich_text?.[0]?.plain_text || '';
          const content_full = pageObj.properties[CONTENT_FULL_PROPERTY]?.rich_text?.[0]?.plain_text || '';
          const category = pageObj.properties[CATEGORY_PROPERTY]?.select?.name || '분류 없음';
          
          // 제목, 내용, 카테고리에서 검색어 포함 여부 확인 (대소문자 구분 없이)
          if (
            title.toLowerCase().includes(searchQuery) || 
            excerpt.toLowerCase().includes(searchQuery) ||
            content_full.toLowerCase().includes(searchQuery) ||
            category.toLowerCase().includes(searchQuery)
          ) {
            const post: NotionPost = {
              id: pageObj.id,
              title: title,
              date: pageObj.properties[DATE_PROPERTY]?.date?.start || pageObj.created_time || null,
              category: category,
              excerpt: excerpt,
              content_full: content_full,
              imageUrl: pageObj.properties[IMAGE_URL_PROPERTY]?.url || '',
              videoUrl: pageObj.properties[VIDEO_URL_PROPERTY]?.url || '',
              originalUrl: pageObj.properties[URL_PROPERTY]?.url || '',
            };
            
            matchedPosts.push(post);
          }
        } catch (error) {
          console.error('포스트 처리 중 오류:', error);
          // 오류가 있는 포스트는 건너뛰고 계속 진행
        }
      }
    }
    
    console.log(`검색 결과: ${matchedPosts.length}개 일치`);
    res.json({
      query: query,
      results: matchedPosts,
      total: matchedPosts.length
    });
  } catch (error) {
    console.error('포스트 검색 중 오류 발생:', error);
    res.status(500).json({ error: '포스트 검색 중 오류가 발생했습니다.' });
  }
};

// 인기 포스트 가져오기 (클릭 수에 따라 정렬된 포스트)
export const getPopularPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    // 현재 날짜에서 7일 전 날짜 계산
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    
    console.log('인기 포스트 API 호출됨');
    console.log(`날짜 필터링: ${oneWeekAgo.toISOString()} ~ ${now.toISOString()}`);
    
    // 인기 포스트 쿼리 - 클릭 카운트 테이블에서 상위 5개 가져오기
    const { data, error } = await supabase
      .from('post_click_counts')
      .select('notion_page_id, click_count, last_clicked_at')
      .gte('last_clicked_at', oneWeekAgo.toISOString())
      .lte('last_clicked_at', now.toISOString())
      .order('click_count', { ascending: false })
      .limit(5);
    
    console.log('Supabase 조회 결과:', data); // 데이터 로깅
    
    if (error) {
      console.error('인기 포스트 조회 중 오류 발생:', error);
      res.status(500).json({ error: '인기 포스트 조회 중 오류가 발생했습니다.' });
      return;
    }
    
    // 데이터가 없는 경우 원인 확인을 위한 추가 쿼리
    if (!data || data.length === 0) {
      console.log('최근 7일간 클릭 데이터가 없습니다. 전체 데이터 확인 중...');
      const { data: allData, error: allDataError } = await supabase
        .from('post_click_counts')
        .select('notion_page_id, click_count, last_clicked_at')
        .order('last_clicked_at', { ascending: false })
        .limit(5);
      
      console.log('전체 클릭 데이터 샘플:', allData);
      
      if (allDataError) {
        console.error('전체 데이터 조회 중 오류:', allDataError);
      }
    }
    
    // 포스트 ID 목록과 클릭수 맵 생성
    const postIds = data.map(item => item.notion_page_id);
    const clickCountMap = data.reduce((map, item) => {
      // 문자열과 숫자 모두 처리할 수 있도록 명시적 변환
      const count = typeof item.click_count === 'string' 
        ? parseInt(item.click_count, 10) 
        : (item.click_count || 0);
      
      map[item.notion_page_id] = count;
      return map;
    }, {} as Record<string, number>);
    
    console.log('클릭 카운트 맵:', clickCountMap); // 클릭 카운트 맵 로깅
    
    // 인기 포스트가 없는 경우
    if (postIds.length === 0) {
      console.log('인기 포스트 없음, 최신 포스트 반환');
      // 최신 포스트 5개를 반환
      const latestResponse = await notion.databases.query({
        database_id: databaseId,
        sorts: [
          {
            property: DATE_PROPERTY,
            direction: 'descending',
          },
        ],
        page_size: 5,
      });
      
      const latestPosts: NotionPost[] = [];
      
      for (const pageItem of latestResponse.results) {
        const pageObj = pageItem as any;
        
        if (pageObj.properties) {
          try {
            const post: NotionPost = {
              id: pageObj.id,
              title: pageObj.properties[TITLE_PROPERTY]?.title[0]?.plain_text || '제목 없음',
              date: pageObj.properties[DATE_PROPERTY]?.date?.start || pageObj.created_time || null,
              category: pageObj.properties[CATEGORY_PROPERTY]?.select?.name || '분류 없음',
              excerpt: pageObj.properties[EXCERPT_PROPERTY]?.rich_text?.[0]?.plain_text || '이 포스트에 대한 요약이 없습니다.',
              content_full: pageObj.properties[CONTENT_FULL_PROPERTY]?.rich_text?.[0]?.plain_text || '',
              imageUrl: pageObj.properties[IMAGE_URL_PROPERTY]?.url || '',
              videoUrl: pageObj.properties[VIDEO_URL_PROPERTY]?.url || '',
              clickCount: 0, // 최신 포스트는 클릭 카운트가 0으로 초기화
              originalUrl: pageObj.properties[URL_PROPERTY]?.url || '',
            };
            
            const hasValidTitle = post.title !== '제목 없음' && post.title.trim() !== '';
            
            if (hasValidTitle) {
              latestPosts.push(post);
            }
          } catch (error) {
            console.error('포스트 처리 중 오류:', error);
          }
        }
      }
      
      res.json({ 
        posts: latestPosts,
        isLatest: true,
        debug: { message: 'No click data found, using latest posts' }
      });
      return;
    }
    
    // 인기 포스트 데이터 가져오기
    const popularPosts: NotionPost[] = [];
    
    for (const postId of postIds) {
      try {
        const clickCount = clickCountMap[postId] || 0;
        console.log(`Notion API 호출: 포스트 ID=${postId}, 클릭 수=${clickCount} (${typeof clickCount})`);
        
        // 노션 페이지 가져오기
        const pageInfo = await notion.pages.retrieve({ page_id: postId });
        const pageObj = pageInfo as any;
        
        if (pageObj.properties) {
          const post: NotionPost = {
            id: pageObj.id,
            title: pageObj.properties[TITLE_PROPERTY]?.title[0]?.plain_text || '제목 없음',
            date: pageObj.properties[DATE_PROPERTY]?.date?.start || pageObj.created_time || null,
            category: pageObj.properties[CATEGORY_PROPERTY]?.select?.name || '분류 없음',
            excerpt: pageObj.properties[EXCERPT_PROPERTY]?.rich_text?.[0]?.plain_text || '이 포스트에 대한 요약이 없습니다.',
            content_full: pageObj.properties[CONTENT_FULL_PROPERTY]?.rich_text?.[0]?.plain_text || '',
            imageUrl: pageObj.properties[IMAGE_URL_PROPERTY]?.url || '',
            videoUrl: pageObj.properties[VIDEO_URL_PROPERTY]?.url || '',
            clickCount: clickCount, // 클릭 카운트 명시적 할당
            originalUrl: pageObj.properties[URL_PROPERTY]?.url || '',
          };
          
          console.log(`포스트 처리 완료: ${post.title}, 클릭 수=${post.clickCount} (${typeof post.clickCount})`);
          
          const hasValidTitle = post.title !== '제목 없음' && post.title.trim() !== '';
          
          if (hasValidTitle) {
            popularPosts.push(post);
          }
        }
      } catch (error) {
        console.error(`포스트 ID ${postId} 가져오기 중 오류:`, error);
        // 오류가 발생한 포스트는 건너뛰고 계속 진행
      }
    }
    
    // 클릭 수 기준으로 내림차순 정렬 (재정렬)
    popularPosts.sort((a, b) => {
      const countA = a.clickCount || 0;
      const countB = b.clickCount || 0;
      return countB - countA;
    });
    
    // 각 포스트의 clickCount가 숫자형인지 확인하는 추가 처리
    const processedPosts = popularPosts.map(post => {
      // clickCount가 문자열이면 숫자로 변환
      let processedClickCount = post.clickCount;
      
      if (typeof processedClickCount === 'string') {
        processedClickCount = parseInt(processedClickCount, 10) || 0;
      }
      
      // clickCount가 null, undefined인 경우 0으로 설정
      if (processedClickCount === null || processedClickCount === undefined) {
        processedClickCount = 0;
      }
      
      return {
        ...post,
        clickCount: processedClickCount, // 항상 숫자형으로 보장
        _debug: {
          clickCountType: typeof processedClickCount,
          clickCountOriginal: post.clickCount,
          clickCountProcessed: processedClickCount
        }
      };
    });
    
    console.log('최종 응답 처리 전 포스트:', processedPosts.map(p => ({ 
      id: p.id, 
      title: p.title, 
      clickCount: p.clickCount, 
      clickCountType: typeof p.clickCount 
    })));
    
    res.json({ 
      posts: processedPosts,
      isLatest: false,
      debug: { source: 'click_data', timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('인기 포스트 조회 중 예기치 않은 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 포스트 클릭 이벤트 추적
export const trackPostClick = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    
    if (!postId) {
      res.status(400).json({ error: '포스트 ID가 필요합니다.' });
      return;
    }

    console.log(`포스트 클릭 이벤트 추적 시작: postId=${postId}`);

    try {
      // 클릭 이벤트 기록 (개별 로그)
      const { error: clickError } = await supabase
        .from('post_clicks')
        .insert({
          notion_page_id: postId,
          clicked_at: new Date().toISOString(),
          user_agent: req.headers['user-agent'] || '',
          ip_address: req.ip || req.socket.remoteAddress || '',
        });

      if (clickError) {
        console.error('클릭 트래킹 중 오류 발생:', clickError);
        // 클릭 로그 오류는 무시하고 계속 진행 (중요한 것은 카운트 업데이트)
      }

      // Upsert 패턴 사용 - 존재하면 업데이트, 없으면 삽입
      const now = new Date().toISOString();
      
      // 1. 먼저 해당 레코드가 존재하는지 확인
      const { data: existingRecords, error: checkError } = await supabase
        .from('post_click_counts')
        .select('click_count, notion_page_id')
        .eq('notion_page_id', postId);
      
      console.log('기존 클릭 카운트 레코드 확인 결과:', existingRecords);

      if (checkError) {
        console.error('레코드 확인 중 오류:', checkError);
        res.status(500).json({ error: '클릭 카운트 확인 중 오류가 발생했습니다.' });
        return;
      }
      
      let result;
      
      if (existingRecords && existingRecords.length > 0) {
        // 2A. 레코드가 존재하면 업데이트
        const currentCount = parseInt(existingRecords[0].click_count, 10) || 0;
        const newCount = currentCount + 1;
        
        console.log(`기존 레코드 업데이트: postId=${postId}, ${currentCount} → ${newCount}`);
        
        const { data: updateData, error: updateError } = await supabase
          .from('post_click_counts')
          .update({ 
            click_count: newCount,
            last_clicked_at: now
          })
          .eq('notion_page_id', postId);
          
        if (updateError) {
          console.error('업데이트 오류:', updateError);
          res.status(500).json({ error: '클릭 카운트 업데이트 중 오류가 발생했습니다.' });
          return;
        }
        
        console.log('레코드 업데이트 성공:', updateData);
        result = { updated: true, count: newCount };
      } else {
        // 2B. 레코드가 없으면 새로 삽입
        console.log(`새 레코드 삽입 시도: postId=${postId}, click_count=1`);
        
        // 3. 중복 키 오류를 방지하기 위해 upsert 사용
        const { data: upsertData, error: upsertError } = await supabase
          .from('post_click_counts')
          .upsert({
            notion_page_id: postId,
            click_count: 1,
            last_clicked_at: now
          }, {
            onConflict: 'notion_page_id',  // 충돌 시 notion_page_id 기준으로 처리
            ignoreDuplicates: false        // 중복은 무시하지 않고 업데이트
          });
          
        if (upsertError) {
          console.error('Upsert 오류:', upsertError);
          res.status(500).json({ error: '클릭 카운트 업데이트 중 오류가 발생했습니다.' });
          return;
        }
        
        console.log('새 레코드 삽입 또는 업데이트 성공:', upsertData);
        result = { inserted: true, count: 1 };
      }
      
      // 성공적으로 처리된 후 현재 값 확인
      const { data: verifyData } = await supabase
        .from('post_click_counts')
        .select('click_count')
        .eq('notion_page_id', postId);
        
      console.log(`최종 검증: postId=${postId}의 현재 클릭 카운트:`, verifyData);
      
      console.log(`포스트 ${postId} 클릭 카운트 업데이트 완료`);
      res.status(200).json({ 
        success: true, 
        current_count: verifyData?.[0]?.click_count || 1,
        result
      });
      
    } catch (innerError) {
      console.error('클릭 처리 중 오류:', innerError);
      res.status(500).json({ error: '클릭 처리 중 오류가 발생했습니다.' });
    }
  } catch (error) {
    console.error('클릭 트래킹 중 예기치 않은 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}; 