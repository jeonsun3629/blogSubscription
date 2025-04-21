// 카테고리에 따른 스타일과 아이콘 반환 함수
function getCategoryStyle(category) {
    switch (category?.trim()) {
        case '모델 업데이트':
            return { color: '#3498db', icon: 'fa-robot', name: '모델 업데이트' };
        case '연구 동향':
            return { color: '#2ecc71', icon: 'fa-microscope', name: '연구 동향' };
        case '시장 동향':
            return { color: '#e74c3c', icon: 'fa-chart-line', name: '시장 동향' };
        case '개발자 도구':
            return { color: '#f39c12', icon: 'fa-tools', name: '개발자 도구' };
        default:
            // 다른 카테고리일 경우 기본값
            return { color: '#95a5a6', icon: 'fa-tag', name: category || '분류 없음' };
    }
}

// 포스트 로드 함수
async function loadLatestPosts(page = 1) {
    try {
        const perPage = 5;
        
        // 로딩 상태 표시
        document.getElementById('posts-container').innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>포스트를 불러오는 중...</p>
            </div>
        `;
        
        // 카테고리 필터링을 포함한 API 요청
        let apiUrl = `/api/posts?page=${page}&perPage=${perPage}`;
        if (currentCategory !== 'all') {
            apiUrl += `&category=${encodeURIComponent(currentCategory)}`;
        }
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // 카테고리 개수 업데이트
        if (data.categoryCounts) {
            updateCategoryCounts(data.categoryCounts);
        }
        
        const postsContainer = document.getElementById('posts-container');
        
        // 데이터가 없는 경우 처리
        if (!data.posts || data.posts.length === 0) {
            postsContainer.innerHTML = `<div class="no-posts">게시물이 없습니다.</div>`;
            return;
        }
        
        // 포스트 렌더링
        const postsHtml = data.posts.map(post => {
            const categoryStyle = getCategoryStyle(post.category);
            
            return `
                <article class="article-card">
                    <div class="article-meta">
                        <span class="article-date">${new Date(post.date || '').toLocaleDateString('ko-KR')}</span>
                        <span class="article-category" style="background-color: ${categoryStyle.color}20; color: ${categoryStyle.color};">
                            <i class="fas ${categoryStyle.icon}"></i> ${categoryStyle.name}
                        </span>
                    </div>
                    <h3 class="article-title">${post.title}</h3>
                    <p class="article-excerpt">
                        ${post.excerpt || post.title}
                    </p>
                    <div class="article-footer">
                        <a href="/post/${post.id}" class="read-more">자세히 보기 <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>
            `;
        }).join('');
        
        // HTML을 DOM에 추가
        postsContainer.innerHTML = postsHtml;
        
        // 페이지네이션 처리
        // ... existing code ...
    } catch (error) {
        console.error('포스트를 불러오는 중 오류가 발생했습니다:', error);
        postsContainer.innerHTML = '<div class="error-message">포스트를 불러오는 중 오류가 발생했습니다.</div>';
    }
} 