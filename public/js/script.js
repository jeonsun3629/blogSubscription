document.addEventListener('DOMContentLoaded', function() {
    // 카드 애니메이션 효과
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('card-hover');
        });
    });

    // 섹션 스크롤 애니메이션
    const sections = document.querySelectorAll('section');
    
    const fadeInOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px"
    };
    
    const fadeInOnScroll = new IntersectionObserver(function(entries, fadeInOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('fade-in');
                fadeInOnScroll.unobserve(entry.target);
            }
        });
    }, fadeInOptions);
    
    sections.forEach(section => {
        section.classList.add('fade-out');
        fadeInOnScroll.observe(section);
    });

    // 아티클 카드 호버 애니메이션 - 동적으로 추가되는 카드에도 적용
    function applyCardHoverEffects() {
        const articleCards = document.querySelectorAll('.article-card');
        
        articleCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px)';
                this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            });
        });
    }

    // 검색 기능
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm.length > 0) {
                performSearch(searchTerm);
            }
        });
    }

    async function performSearch(searchTerm) {
        try {
            console.log('검색 시작:', searchTerm);
            
            // 검색 중 로딩 표시
            const articlesContainer = document.getElementById('latest');
            if (articlesContainer) {
                articlesContainer.innerHTML = '<div class="loading"><p>검색 결과를 불러오는 중입니다...</p></div>';
            }
            
            // API 호출
            const url = `/api/search?q=${encodeURIComponent(searchTerm)}`;
            console.log('요청 URL:', url);
            
            const response = await fetch(url);
            console.log('응답 상태:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`검색 중 오류가 발생했습니다: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('검색 결과:', data);
            
            // 검색 결과 표시
            displaySearchResults(data, searchTerm);
        } catch (error) {
            console.error('검색 중 오류:', error);
            const articlesContainer = document.getElementById('latest');
            if (articlesContainer) {
                articlesContainer.innerHTML = `<div class="error-message"><p>검색 중 오류가 발생했습니다: ${error.message}</p></div>`;
            }
        } finally {
            // 검색 완료 후 입력 필드 초기화
            document.getElementById('search-input').value = '';
        }
    }
    
    // 검색 결과 표시 함수
    function displaySearchResults(data, searchTerm) {
        const articlesContainer = document.getElementById('latest');
        if (!articlesContainer) return;
        
        // 검색 결과 제목 업데이트
        const sectionTitle = document.querySelector('.articles-section h2');
        if (sectionTitle) {
            sectionTitle.innerHTML = `"${searchTerm}" 검색 결과 <span class="section-divider"></span>`;
        }
        
        // 결과가 없는 경우
        if (data.results.length === 0) {
            articlesContainer.innerHTML = `
                <div class="no-results">
                    <p>"${searchTerm}"에 대한 검색 결과가 없습니다.</p>
                    <p>다른 키워드로 검색해 보세요.</p>
                </div>
            `;
            return;
        }
        
        // 검색 결과 표시
        let resultsHTML = `<p class="results-count">총 ${data.total}개의 결과</p>`;
        
        data.results.forEach(post => {
            const categoryStyle = getCategoryStyle(post.category);
            const formattedDate = post.date ? new Date(post.date).toLocaleDateString('ko-KR') : '';
            
            resultsHTML += `
                <article class="article-card">
                    <div class="article-meta">
                        <span class="article-date">${formattedDate}</span>
                        <span class="article-category" style="color: ${categoryStyle.color}">
                            <i class="fas ${categoryStyle.icon}"></i> ${categoryStyle.name}
                        </span>
                    </div>
                    <h3 class="article-title">${post.title}</h3>
                    <p class="article-excerpt">
                        ${post.excerpt || '이 포스트에 대한 요약이 없습니다.'}
                    </p>
                    <div class="article-footer">
                        <a href="/post/${post.id}" class="read-more">자세히 보기 <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>
            `;
        });
        
        articlesContainer.innerHTML = resultsHTML;
        
        // 하이라이트 표시 (검색어 강조)
        highlightSearchTerms(searchTerm);
        
        // 카드 애니메이션 적용
        applyCardHoverEffects();
    }
    
    // 검색어 하이라이트 함수
    function highlightSearchTerms(searchTerm) {
        if (!searchTerm) return;
        
        const articleCards = document.querySelectorAll('.article-card');
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        
        articleCards.forEach(card => {
            const title = card.querySelector('.article-title');
            const excerpt = card.querySelector('.article-excerpt');
            
            if (title && title.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                title.innerHTML = title.textContent.replace(regex, '<mark>$1</mark>');
            }
            
            if (excerpt && excerpt.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                excerpt.innerHTML = excerpt.textContent.replace(regex, '<mark>$1</mark>');
            }
        });
    }

    // 구독 폼 제출;'[]
    const subscribeForm = document.getElementById('subscribe-form');
    const newsletterForm = document.getElementById('newsletter-form');

    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            if (validateEmail(email)) {
                alert('구독해 주셔서 감사합니다! 확인 이메일을 발송했습니다.');
                this.reset();
            } else {
                alert('유효한 이메일 주소를 입력해 주세요.');
            }
        });
    }

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            
            if (name && validateEmail(email)) {
                alert('구독해 주셔서 감사합니다! 확인 이메일을 발송했습니다.');
                this.reset();
            } else {
                alert('이름과 유효한 이메일 주소를 모두 입력해 주세요.');
            }
        });
    }

    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // 스크롤 버튼 기능 설정
    const scrollToTopButton = document.querySelector('.scroll-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopButton.classList.add('show');
        } else {
            scrollToTopButton.classList.remove('show');
        }
    });
    
    scrollToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 모바일 메뉴 토글
    const createMobileMenu = () => {
        const header = document.querySelector('header');
        const headerContent = document.querySelector('.header-content');
        const nav = document.querySelector('.main-nav');
        
        if (!header || !headerContent || !nav) return;
        
        const menuButton = document.createElement('button');
        menuButton.classList.add('menu-toggle');
        menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        
        menuButton.addEventListener('click', () => {
            nav.classList.toggle('mobile-open');
            menuButton.classList.toggle('active');
            
            if (menuButton.classList.contains('active')) {
                menuButton.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                menuButton.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        headerContent.appendChild(menuButton);
        
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('mobile-open');
                menuButton.classList.remove('active');
                menuButton.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    };
    
    if (window.innerWidth <= 768) {
        createMobileMenu();
    }
    
    window.addEventListener('resize', () => {
        const existingButton = document.querySelector('.menu-toggle');
        
        if (window.innerWidth <= 768 && !existingButton) {
            createMobileMenu();
        } else if (window.innerWidth > 768 && existingButton) {
            existingButton.remove();
            document.querySelector('.main-nav').classList.remove('mobile-open');
        }
    });

    // 애니메이션 추가 (글 목록, 사이드바 등)
    const animateElements = document.querySelectorAll('.article-card, .sidebar-widget');
    
    const showItems = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                showItems.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    animateElements.forEach(el => {
        el.classList.add('fade-item');
        showItems.observe(el);
    });

    // Notion API에서 포스트 가져오기
    // 메인 페이지에서 최신 포스트 로드
    if (document.getElementById('latest')) {
        // 카테고리 목록을 먼저 로드한 후 포스트 로드
        loadCategories().then(() => {
            loadLatestPosts();
        });
    }

    // 포스트 상세 페이지에서 포스트 내용 로드
    if (document.getElementById('post-content') && window.location.pathname.includes('/post/')) {
        const postId = window.location.pathname.split('/post/')[1];
        if (postId) {
            loadPostContent(postId);
        }
    }

    // 카테고리에 따른 스타일과 아이콘 반환 함수
    function getCategoryStyle(category) {
        switch (category.trim()) {
            case '모델 업데이트':
                return { color: '#3498db', icon: 'fa-robot', name: '모델 업데이트' };
            case '연구 동향':
                return { color: '#2ecc71', icon: 'fa-microscope', name: '연구 동향' };
            case '시장 동향':
                return { color: '#e74c3c', icon: 'fa-chart-line', name: '시장 동향' };
            case '개발자 도구':
                return { color: '#f39c12', icon: 'fa-tools', name: '개발자 도구' };
            default:
                return { color: '#95a5a6', icon: 'fa-tag', name: category || '분류 없음' };
        }
    }
    
    // 카테고리 목록을 가져와 사이드바에 표시
    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            
            if (!response.ok) {
                throw new Error('카테고리 목록을 가져오는 중 오류가 발생했습니다.');
            }
            
            const categories = await response.json();
            
            // 사이드바 카테고리 목록 컨테이너
            const categoryListContainer = document.querySelector('.category-list');
            
            // 기존 카테고리 항목들 삭제
            categoryListContainer.innerHTML = '';
            
            // "모든 글 보기" 항목을 맨 위에 추가
            const allPostsItem = document.createElement('li');
            allPostsItem.className = 'all-posts-item';
            allPostsItem.innerHTML = `
                <a href="#" class="category-item all-posts-link active" id="all-posts-animation-style" data-category="all">
                    <i class="fas fa-th-list"></i> 모든 글 보기
                </a>
            `;
            categoryListContainer.appendChild(allPostsItem);
            
            // 카테고리가 없는 경우 처리
            if (!categories || categories.length === 0) {
                const noCategories = document.createElement('li');
                noCategories.innerHTML = `
                    <p>카테고리가 없습니다.</p>
                `;
                categoryListContainer.appendChild(noCategories);
                return;
            }
            
            // 모든 카테고리 항목 추가
            categories.forEach(category => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <a href="#" class="category-item" data-category="${category.name}">
                        <i class="fas ${category.icon}" style="color: ${category.color}"></i>
                        ${category.name}
                        <span id="count-${category.name.replace(/\s+/g, '-').toLowerCase()}"></span>
                    </a>
                `;
                categoryListContainer.appendChild(listItem);
            });
            
            // 카테고리 클릭 이벤트 리스너 추가
            const categoryItems = document.querySelectorAll('.category-item');
            categoryItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const categoryFilter = e.currentTarget.getAttribute('data-category');
                    loadLatestPosts(1, categoryFilter);
                    
                    // 활성 카테고리 표시
                    categoryItems.forEach(i => i.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    
                    // 클릭 효과 추가
                    console.log('카테고리 클릭:', categoryFilter);
                });
            });
            
            console.log('카테고리 목록을 성공적으로 로드했습니다.');
        } catch (error) {
            console.error('카테고리 목록을 가져오는 중 오류 발생:', error);
            // 오류 발생 시 기본 카테고리 표시
            const categoryListContainer = document.querySelector('.category-list');
            categoryListContainer.innerHTML = `
                <li class="all-posts-item">
                    <a href="#" class="category-item all-posts-link active" id="all-posts-animation-style" data-category="all">
                        <i class="fas fa-th-list"></i> 모든 글 보기
                    </a>
                </li>
            `;
            
            // 이벤트 리스너 추가
            const allPostsLink = document.querySelector('.all-posts-link');
            if (allPostsLink) {
                allPostsLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadLatestPosts(1, 'all');
                });
            }
        }
    }

    // 최신 포스트 가져오기
    async function loadLatestPosts(page = 1, category = null) {
        try {
            // 로딩 표시
            document.getElementById('latest').innerHTML = `
                <div class="loading">
                    <p>포스트를 불러오는 중입니다...</p>
                </div>
            `;
            
            // 쿼리 파라미터 구성
            let url = `/api/posts?page=${page}`;
            if (category && category !== 'all') {
                url += `&category=${encodeURIComponent(category)}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('포스트를 가져오는 중 오류가 발생했습니다.');
            }
            
            const data = await response.json();
            const posts = data.posts;
            const categoryCounts = data.categoryCounts;
            
            // 로드된 포스트가 없는 경우
            if (!posts || posts.length === 0) {
                document.getElementById('latest').innerHTML = `
                    <div class="no-posts">
                        <p>현재 표시할 포스트가 없습니다.</p>
                    </div>
                `;
                return;
            }
            
            // 포스트 HTML 생성
            let postsHtml = '';
            
            posts.forEach(post => {
                const categoryStyle = getCategoryStyle(post.category);
                
                postsHtml += `
                    <article class="article-card">
                        <div class="article-meta">
                            <span class="article-date">${new Date(post.date).toLocaleDateString('ko-KR')}</span>
                            <span class="article-category" style="color: ${categoryStyle.color}">
                                <i class="fas ${categoryStyle.icon}"></i> ${categoryStyle.name}
                            </span>
                        </div>
                        <h3 class="article-title">${post.title}</h3>
                        <p class="article-excerpt">
                            ${post.excerpt || '이 포스트에 대한 요약이 없습니다.'}
                        </p>
                        <div class="article-footer">
                            <a href="/post/${post.id}" class="read-more">자세히 보기 <i class="fas fa-arrow-right"></i></a>
                        </div>
                    </article>
                `;
            });
            
            // 카테고리 카운트 업데이트
            if (categoryCounts) {
                // 기존 하드코딩된 카테고리 카운트 업데이트
                updateCategoryCount('모델 업데이트', categoryCounts['모델 업데이트'] || 0);
                updateCategoryCount('연구 동향', categoryCounts['연구 동향'] || 0);
                updateCategoryCount('시장 동향', categoryCounts['시장 동향'] || 0);
                updateCategoryCount('개발자 도구', categoryCounts['개발자 도구'] || 0);
                
                // 동적으로 가져온 다른 카테고리들의 카운트도 업데이트
                Object.keys(categoryCounts).forEach(categoryName => {
                    updateCategoryCount(categoryName, categoryCounts[categoryName] || 0);
                });
            }
            
            // 페이지네이션 정보
            const pagination = data.pagination;
            let paginationHtml = '';
            
            if (pagination && pagination.totalPages > 1) {
                paginationHtml = '<div class="pagination">';
                
                for (let i = 1; i <= pagination.totalPages; i++) {
                    if (i === pagination.currentPage) {
                        paginationHtml += `<a href="#" class="active">${i}</a>`;
                    } else {
                        paginationHtml += `<a href="#" data-page="${i}">${i}</a>`;
                    }
                }
                
                if (pagination.hasNextPage) {
                    paginationHtml += `<a href="#" class="next" data-page="${pagination.currentPage + 1}">다음 <i class="fas fa-chevron-right"></i></a>`;
                }
                
                paginationHtml += '</div>';
            }
            
            // 포스트 목록 업데이트
            const latestSection = document.getElementById('latest');
            latestSection.innerHTML = postsHtml + paginationHtml;
            
            // 페이지네이션 이벤트 리스너 추가
            const pageLinks = latestSection.querySelectorAll('.pagination a[data-page]');
            pageLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const pageNum = e.target.getAttribute('data-page');
                    loadLatestPosts(pageNum, category);
                });
            });
            
            // 카드에 호버 효과 적용
            applyCardHoverEffects();
            
            console.log('포스트 목록을 성공적으로 로드했습니다.');
        } catch (error) {
            console.error('포스트를 가져오는 중 오류 발생:', error);
            document.getElementById('latest').innerHTML = `
                <div class="error-message">
                    <h3>오류 발생</h3>
                    <p>포스트를 불러오는 중 문제가 발생했습니다. 나중에 다시 시도해 주세요.</p>
                </div>
            `;
        }
    }

    // 카테고리 카운트 업데이트 헬퍼 함수
    function updateCategoryCount(categoryName, count) {
        // 카테고리 이름을 ID에 맞는 형식으로 변환
        const categoryId = `count-${categoryName.replace(/\s+/g, '-').toLowerCase()}`;
        const countElement = document.getElementById(categoryId);
        
        if (countElement) {
            countElement.textContent = `(${count})`;
        }
    }

    // 포스트 상세 내용 로드
    async function loadPostContent(postId) {
        const postContainer = document.getElementById('post-content');
        
        try {
            const response = await fetch(`/api/posts/${postId}`);
            
            if (!response.ok) {
                throw new Error('포스트를 가져오는 중 오류가 발생했습니다.');
            }
            
            const post = await response.json();
            const categoryStyle = getCategoryStyle(post.category);
            
            // URL 찾기 (마지막 블록이나 "https://" 패턴 확인)
            let originalUrl = '';
            for (let i = post.content.length - 1; i >= 0; i--) {
                const block = post.content[i];
                if (block.text && block.text.includes('https://')) {
                    // URL 패턴 추출
                    const urlMatch = block.text.match(/(https?:\/\/[^\s]+)/);
                    if (urlMatch) {
                        originalUrl = urlMatch[0];
                        break;
                    }
                }
            }
            
            // 포스트 HTML 생성
            let postHtml = `
                <h1>${post.title}</h1>
                <div class="post-meta">
                    <span class="post-date">${post.date}</span>
                    <span class="post-category category-${categoryStyle.name.replace(/\s+/g, '-').toLowerCase()}">
                        <i class="fas ${categoryStyle.icon}"></i> ${categoryStyle.name}
                    </span>
                </div>
            `;
            
            // 이미지가 있고 example로 시작하지 않는 경우 추가
            if (post.imageUrl && !post.imageUrl.startsWith('example') && !post.imageUrl.includes('example.com')) {
                postHtml += `
                <div class="post-featured-image">
                    <img src="${post.imageUrl}" alt="${post.title}" class="featured-image">
                </div>
                `;
            }
            
            // 비디오가 있고 example로 시작하지 않는 경우 추가
            if (post.videoUrl && !post.videoUrl.startsWith('example') && !post.videoUrl.includes('example.com')) {
                postHtml += `
                <div class="post-featured-video">
                    <iframe 
                        src="${post.videoUrl}" 
                        allowfullscreen 
                        frameborder="0" 
                        class="featured-video">
                    </iframe>
                </div>
                `;
            }
            
            // 원문 콘텐츠 표시 (content_full이 있으면 사용)
            if (post.content_full && post.content_full.trim() !== '') {
                postHtml += `
                <div class="post-content">
                    ${post.content_full.replace(/\n/g, '<br>')}
                </div>
                `;
            } else {
                // 원문이 없는 경우 블록 콘텐츠 처리
                postHtml += `<div class="post-content">`;
                
                post.content.forEach(block => {
                    // 빈 텍스트는 건너뜀
                    if (!block.text || block.text.trim() === '') return;
                    
                    // 영문 컨텐츠 패턴 확인하고 건너뜀 
                    // 영문자, 숫자, 기호로만 구성된 텍스트는 표시하지 않음
                    if (block.text && /^[a-zA-Z0-9\s,.!?;:'"(){}\[\]<>@#$%^&*+=\-_\\\/|~`]+$/.test(block.text)) {
                        return;
                    }
                    
                    // "원문:" 또는 "출처:" 등으로 시작하는 텍스트 건너뜀
                    if (block.text && (block.text.startsWith('원문:') || 
                                      block.text.startsWith('출처:') || 
                                      block.text.startsWith('Reference:') || 
                                      block.text.startsWith('Source:'))) {
                        return;
                    }
                    
                    switch (block.type) {
                        case 'paragraph':
                            postHtml += `<p>${block.text}</p>`;
                            break;
                        case 'heading_1':
                            postHtml += `<h1>${block.text}</h1>`;
                            break;
                        case 'heading_2':
                            postHtml += `<h2>${block.text}</h2>`;
                            break;
                        case 'heading_3':
                            postHtml += `<h3>${block.text}</h3>`;
                            break;
                        case 'bulleted_list_item':
                            postHtml += `<li>${block.text}</li>`;
                            break;
                        case 'image':
                            // 이미지 URL이 example로 시작하지 않는 경우에만 표시
                            if (block.url && !block.url.startsWith('example') && !block.url.includes('example.com')) {
                                postHtml += `<img src="${block.url}" alt="포스트 이미지">`;
                            }
                            break;
                    }
                });
                
                postHtml += `</div>`;
            }
            
            // 원본 URL이 있을 경우 추가
            if (originalUrl) {
                postHtml += `
                <div class="post-source">
                    <a href="${originalUrl}" target="_blank" rel="noopener noreferrer">
                        원본 링크 <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
                `;
            }
            
            postContainer.innerHTML = postHtml;
            
            // 페이지 타이틀 업데이트
            document.title = `${post.title} - AI 트렌드 파인더`;
            
        } catch (error) {
            console.error('포스트를 가져오는 중 오류 발생:', error);
            postContainer.innerHTML = `
                <div class="error-message">
                    <h2>오류 발생</h2>
                    <p>포스트를 불러오는 중 문제가 발생했습니다. 나중에 다시 시도해 주세요.</p>
                    <p><a href="/">메인 페이지로 돌아가기</a></p>
                </div>
            `;
        }
    }
}); 