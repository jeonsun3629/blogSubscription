import { Client } from '@notionhq/client';
import { Request, Response } from 'express';
import { NotionBlock, NotionPost, NotionPostDetail } from '../types/notion';
import dotenv from 'dotenv';

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
const EXCERPT_PROPERTY = process.env.NOTION_EXCERPT_PROPERTY || 'Content_kr';
const CONTENT_FULL_PROPERTY = process.env.NOTION_CONTENT_FULL_PROPERTY || 'Content_full';
const IMAGE_URL_PROPERTY = process.env.NOTION_IMAGE_URL_PROPERTY || 'Image_URL';
const VIDEO_URL_PROPERTY = process.env.NOTION_VIDEO_URL_PROPERTY || 'Video_URL';

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
          
          // 카테고리 카운트 동적 관리
          if (!categoryCounts[postCategory]) {
            categoryCounts[postCategory] = 0;
          }
          categoryCounts[postCategory]++;
          
          const post: NotionPost = {
            id: pageObj.id,
            title: pageObj.properties[TITLE_PROPERTY]?.title[0]?.plain_text || '제목 없음',
            date: pageObj.properties[DATE_PROPERTY]?.date?.start || pageObj.created_time || null,
            category: postCategory,
            excerpt: pageObj.properties[EXCERPT_PROPERTY]?.rich_text?.[0]?.plain_text || '',
            content_full: pageObj.properties[CONTENT_FULL_PROPERTY]?.rich_text?.[0]?.plain_text || '',
            imageUrl: pageObj.properties[IMAGE_URL_PROPERTY]?.url || '',
            videoUrl: pageObj.properties[VIDEO_URL_PROPERTY]?.url || '',
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
    
    // 포스트 데이터 처리
    const post: NotionPostDetail = {
      id: pageObj.id,
      title: pageObj.properties[TITLE_PROPERTY]?.title[0]?.plain_text || '제목 없음',
      date: new Date(pageObj.properties[DATE_PROPERTY]?.date?.start || pageObj.created_time || Date.now()).toLocaleDateString('ko-KR'),
      category: pageObj.properties[CATEGORY_PROPERTY]?.select?.name || '분류 없음',
      excerpt: pageObj.properties[EXCERPT_PROPERTY]?.rich_text?.[0]?.plain_text || '',
      content_full: pageObj.properties[CONTENT_FULL_PROPERTY]?.rich_text?.[0]?.plain_text || '',
      imageUrl: pageObj.properties[IMAGE_URL_PROPERTY]?.url || '',
      videoUrl: pageObj.properties[VIDEO_URL_PROPERTY]?.url || '',
      content: await processBlocks(blocks.results),
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
          const category = pageObj.properties[CATEGORY_PROPERTY]?.select?.name || '분류 없음';
          
          // 제목, 내용, 카테고리에서 검색어 포함 여부 확인 (대소문자 구분 없이)
          if (
            title.toLowerCase().includes(searchQuery) || 
            excerpt.toLowerCase().includes(searchQuery) ||
            category.toLowerCase().includes(searchQuery)
          ) {
            const post: NotionPost = {
              id: pageObj.id,
              title: title,
              date: pageObj.properties[DATE_PROPERTY]?.date?.start || pageObj.created_time || null,
              category: category,
              excerpt: excerpt,
              content_full: pageObj.properties[CONTENT_FULL_PROPERTY]?.rich_text?.[0]?.plain_text || '',
              imageUrl: pageObj.properties[IMAGE_URL_PROPERTY]?.url || '',
              videoUrl: pageObj.properties[VIDEO_URL_PROPERTY]?.url || '',
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