import express, { Router } from 'express';
import * as notionController from '../controllers/notionController';
import * as subscriptionController from '../controllers/subscriptionController';

const router: Router = express.Router();

// Notion 데이터베이스에서 모든 포스트 가져오기
router.get('/api/posts', notionController.getAllPosts);

// ID로 특정 포스트 가져오기
router.get('/api/posts/:id', notionController.getPostById);

// 카테고리 목록 가져오기
router.get('/api/categories', notionController.getCategories);

// 제목, 내용 등으로 포스트 검색하기
router.get('/api/search', notionController.searchPosts);

// 인기 포스트 가져오기 (최근 1주일 간 가장 많이 클릭된 포스트)
router.get('/api/popular-posts', notionController.getPopularPosts);

// 포스트 클릭 이벤트 추적
router.post('/api/posts/:postId/track-click', notionController.trackPostClick);

// 구독 관련 API 엔드포인트
// 구독 요청 처리
router.post('/api/subscribe', subscriptionController.subscribe);

// 구독 확인 처리
router.get('/verify-subscription/:token', subscriptionController.verifySubscription);

// 구독 취소 처리
router.get('/unsubscribe/:email/:token', subscriptionController.unsubscribe);

// 블로그 업데이트 알림 발송 (관리자용)
router.post('/api/send-update-notifications', subscriptionController.sendBlogUpdateNotifications);

export default router; 