import express, { Router } from 'express';
import * as notionController from '../controllers/notionController';

const router: Router = express.Router();

// Notion 데이터베이스에서 모든 포스트 가져오기
router.get('/api/posts', notionController.getAllPosts);

// ID로 특정 포스트 가져오기
router.get('/api/posts/:id', notionController.getPostById);

// 카테고리 목록 가져오기
router.get('/api/categories', notionController.getCategories);

// 제목, 내용 등으로 포스트 검색하기
router.get('/api/search', notionController.searchPosts);

export default router; 