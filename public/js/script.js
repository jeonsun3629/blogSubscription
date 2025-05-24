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
            
            // 섹션 타이틀 업데이트
            const sectionTitle = document.querySelector('.articles-section h2');
            if (sectionTitle) {
                sectionTitle.innerHTML = `"${searchTerm}" 검색 중... <span class="section-divider"></span>`;
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
                    <p><a href="#" class="back-to-all" onclick="loadLatestPosts(1, 'all'); return false;">모든 글 보기</a></p>
                </div>
            `;
            return;
        }
        
        // 검색 결과 표시
        let resultsHTML = `
            <div class="results-count">
                <p>총 ${data.total}개의 결과</p>
                <p><a href="#" class="back-to-all" onclick="loadLatestPosts(1, 'all'); return false;">모든 글 보기</a></p>
            </div>
        `;
        
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
        
        // 카테고리 필터 초기화 - 검색 결과를 보여줄 때 모든 필터링 해제
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // '모든 글 보기' 버튼 스타일링
        document.querySelector('.back-to-all')?.addEventListener('click', function(e) {
            e.preventDefault();
            // '모든 글 보기' 카테고리 항목 활성화
            document.querySelector('.category-item[data-category="all"]')?.classList.add('active');
            loadLatestPosts(1, 'all');
        });
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

    // 구독 폼 제출
    const subscribeForm = document.getElementById('subscribe-form');
    const newsletterForm = document.getElementById('newsletter-form');

    if (subscribeForm) {
        subscribeForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            if (validateEmail(email)) {
                // 버튼 원래 텍스트 미리 저장 (이동)
                const button = this.querySelector('button');
                const originalText = button.textContent;
                
                try {
                    // 로딩 상태 표시
                    button.disabled = true;
                    button.textContent = '처리 중...';
                    
                    console.log('요청 시작:', { email });
                    
                    // API 호출
                    const response = await fetch(window.location.origin + '/api/subscribe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email })
                    });
                    
                    console.log('응답 상태:', response.status, response.statusText);
                    
                    // 오류 응답 처리 개선
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('API 오류 응답:', errorText);
                        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    console.log('응답 데이터:', data);
                    
                    // 버튼 원래 상태로 복원
                    button.disabled = false;
                    button.textContent = originalText;
                    
                    if (data.success) {
                        if (data.subscribed) {
                            alert('이미 구독 중입니다.');
                        } else {
                            alert('구독해 주셔서 감사합니다! 확인 이메일을 발송했습니다.');
                            this.reset();
                        }
                    } else {
                        alert(`구독 처리 중 오류가 발생했습니다: ${data.message}`);
                    }
                } catch (error) {
                    console.error('구독 요청 오류 상세:', error);
                    alert('서버 연결 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.');
                    
                    // 버튼 상태 복원 추가
                    button.disabled = false;
                    button.textContent = originalText;
                }
            } else {
                alert('유효한 이메일 주소를 입력해 주세요.');
            }
        });
    }

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            
            if (name && validateEmail(email)) {
                // 버튼 원래 텍스트 미리 저장 (이동)
                const button = this.querySelector('button');
                const originalText = button.textContent;
                
                try {
                    // 로딩 상태 표시
                    button.disabled = true;
                    button.textContent = '처리 중...';
                    
                    console.log('요청 시작:', { email, name });
                    
                    // API 호출
                    const response = await fetch(window.location.origin + '/api/subscribe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, name })
                    });
                    
                    console.log('응답 상태:', response.status, response.statusText);
                    
                    // 오류 응답 처리 개선
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('API 오류 응답:', errorText);
                        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    console.log('응답 데이터:', data);
                    
                    // 버튼 원래 상태로 복원
                    button.disabled = false;
                    button.textContent = originalText;
                    
                    if (data.success) {
                        if (data.subscribed) {
                            alert('이미 구독 중입니다.');
                        } else {
                            alert('구독해 주셔서 감사합니다! 확인 이메일을 발송했습니다.');
                            this.reset();
                        }
                    } else {
                        alert(`구독 처리 중 오류가 발생했습니다: ${data.message}`);
                    }
                } catch (error) {
                    console.error('구독 요청 오류 상세:', error);
                    alert('서버 연결 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.');
                    
                    // 버튼 상태 복원 추가
                    button.disabled = false;
                    button.textContent = originalText;
                }
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
        console.log('포스트 상세 페이지 감지됨');
        console.log('현재 URL:', window.location.href);
        console.log('pathname:', window.location.pathname);
        
        try {
            const pathParts = window.location.pathname.split('/');
            console.log('URL 경로 분석:', pathParts);
            
            // /post/ 다음에 오는 부분이 postId
            const postIndex = pathParts.indexOf('post');
            const postId = postIndex >= 0 && postIndex < pathParts.length - 1 ? pathParts[postIndex + 1] : null;
            
            console.log('추출된 postId:', postId);
            
            if (postId) {
                console.log('포스트 로딩 함수 호출 준비. ID:', postId);
                loadPostContent(postId);
            } else {
                console.error('URL에서 포스트 ID를 추출할 수 없습니다.');
                document.getElementById('error-message').style.display = 'block';
                document.getElementById('error-message').querySelector('p').textContent = 'URL에서 포스트 ID를 찾을 수 없습니다.';
                document.getElementById('loading-post').style.display = 'none';
            }
        } catch (error) {
            console.error('포스트 ID 추출 중 오류:', error);
            document.getElementById('error-message').style.display = 'block';
            document.getElementById('error-message').querySelector('p').textContent = `URL 처리 중 오류: ${error.message}`;
            document.getElementById('loading-post').style.display = 'none';
        }
    } else if (window.location.pathname.includes('/post/')) {
        console.warn('포스트 페이지로 탐지되었으나 #post-content 요소를 찾을 수 없습니다.');
        console.log('현재 URL:', window.location.href);
        console.log('문서 내 요소 확인:');
        console.log('- #post-content 존재:', !!document.getElementById('post-content'));
        console.log('- #loading-post 존재:', !!document.getElementById('loading-post'));
        console.log('- #error-message 존재:', !!document.getElementById('error-message'));
    }

    // 상세 페이지 카테고리 스타일 적용
    if (window.location.pathname.startsWith('/post/')) {
        stylePostDetailCategories();
    }

    // 카테고리 스타일 적용하는 함수
    function stylePostDetailCategories() {
        // 카테고리별 스타일 정의
        const categoryStyles = {
            '모델 업데이트': {
                bgColor: 'rgba(52, 152, 219, 0.15)',
                color: '#3498db'
            },
            '연구 동향': {
                bgColor: 'rgba(46, 204, 113, 0.15)',
                color: '#2ecc71'
            },
            '시장 동향': {
                bgColor: 'rgba(231, 76, 60, 0.15)',
                color: '#e74c3c'
            },
            '개발자 도구': {
                bgColor: 'rgba(243, 156, 18, 0.15)',
                color: '#f39c12'
            }
        };
        
        // 공통 스타일 속성
        const commonStyles = {
            padding: '0.3rem 0.8rem',
            borderRadius: '20px',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center'
        };
        
        // 모든 span 요소 순회
        const allSpans = document.querySelectorAll('span');
        allSpans.forEach(span => {
            const spanText = span.textContent || '';
            
            // 카테고리 매칭
            for (const [category, style] of Object.entries(categoryStyles)) {
                if (spanText.includes(category)) {
                    // 배경색과 텍스트 색상 적용
                    span.style.backgroundColor = style.bgColor;
                    span.style.color = style.color;
                    
                    // 공통 스타일 적용
                    for (const [prop, value] of Object.entries(commonStyles)) {
                        span.style[prop] = value;
                    }
                    
                    break; // 일치하는 카테고리를 찾으면 루프 종료
                }
            }
        });
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
            
            // 고정된 카테고리 순서 정의
            const fixedOrder = ['모든 글 보기', '모델 업데이트', '연구 동향', '시장 동향', '개발자 도구'];
            
            // 카테고리를 맵 형태로 변환하여 쉽게 접근할 수 있도록 함
            const categoryMap = {};
            categories.forEach(category => {
                categoryMap[category.name] = category;
            });
            
            // "모든 글 보기" 항목을 맨 위에 추가
            const allPostsItem = document.createElement('li');
            allPostsItem.className = 'all-posts-item';
            allPostsItem.innerHTML = `
                <a href="#" class="category-item all-posts-link active" data-category="all">
                    <i class="fas fa-th-list"></i> 모든 글 보기
                </a>
            `;
            categoryListContainer.appendChild(allPostsItem);
            
            // 고정된 순서에 따라 카테고리 추가
            for (let i = 1; i < fixedOrder.length; i++) { // index 1부터 시작 (모든 글 보기 이미 추가됨)
                const categoryName = fixedOrder[i];
                const category = categoryMap[categoryName];
                
                if (category) {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <a href="#" class="category-item" data-category="${category.name}">
                            <i class="fas ${category.icon}" style="color: ${category.color}"></i>
                            ${category.name}
                            <span id="count-${category.name.replace(/\s+/g, '-').toLowerCase()}"></span>
                        </a>
                    `;
                    categoryListContainer.appendChild(listItem);
                }
            }
            
            // 정의된 고정 순서에 없는 나머지 카테고리들 추가
            categories.forEach(category => {
                if (!fixedOrder.includes(category.name)) {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <a href="#" class="category-item" data-category="${category.name}">
                            <i class="fas ${category.icon}" style="color: ${category.color}"></i>
                            ${category.name}
                            <span id="count-${category.name.replace(/\s+/g, '-').toLowerCase()}"></span>
                        </a>
                    `;
                    categoryListContainer.appendChild(listItem);
                }
            });
            
            // 카테고리 클릭 이벤트 리스너 추가
            const categoryItems = document.querySelectorAll('.category-item');
            categoryItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const categoryFilter = e.currentTarget.getAttribute('data-category');
                    loadLatestPosts(1, categoryFilter);
                    
                    // 모든 카테고리 버튼 비활성화
                    categoryItems.forEach(i => i.classList.remove('active'));
                    
                    // 클릭한 카테고리 활성화 및 애니메이션 효과 추가
                    e.currentTarget.classList.add('active');
                    
                    // 애니메이션 효과 추가 - 버튼 기존 효과 제거 후 다시 추가하여 매번 애니메이션 재생
                    e.currentTarget.classList.remove('animate-pulse');
                    setTimeout(() => {
                        e.currentTarget.classList.add('animate-pulse');
                    }, 10);
                    
                    // 클릭 효과 추가
                    console.log('카테고리 클릭:', categoryFilter);
                });
            });
            
            console.log('카테고리 목록을 성공적으로 로드했습니다.');
        } catch (error) {
            console.error('카테고리 목록을 가져오는 중 오류 발생:', error);
            // 오류 발생 시 기본 카테고리 HTML에서도 동일한 애니메이션 코드 적용
            // 기본 카테고리 표시
            const categoryListContainer = document.querySelector('.category-list');
            categoryListContainer.innerHTML = `
                <li class="all-posts-item">
                    <a href="#" class="category-item all-posts-link active" data-category="all">
                        <i class="fas fa-th-list"></i> 모든 글 보기
                    </a>
                </li>
                <li>
                    <a href="#" class="category-item" data-category="모델 업데이트">
                        <i class="fas fa-robot" style="color: #3498db"></i>
                        모델 업데이트
                        <span id="count-모델-업데이트"></span>
                    </a>
                </li>
                <li>
                    <a href="#" class="category-item" data-category="연구 동향">
                        <i class="fas fa-microscope" style="color: #2ecc71"></i>
                        연구 동향
                        <span id="count-연구-동향"></span>
                    </a>
                </li>
                <li>
                    <a href="#" class="category-item" data-category="시장 동향">
                        <i class="fas fa-chart-line" style="color: #e74c3c"></i>
                        시장 동향
                        <span id="count-시장-동향"></span>
                    </a>
                </li>
                <li>
                    <a href="#" class="category-item" data-category="개발자 도구">
                        <i class="fas fa-tools" style="color: #f39c12"></i>
                        개발자 도구
                        <span id="count-개발자-도구"></span>
                    </a>
                </li>
            `;
            
            // 이벤트 리스너 추가
            const categoryItems = document.querySelectorAll('.category-item');
            categoryItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const categoryFilter = e.currentTarget.getAttribute('data-category');
                    loadLatestPosts(1, categoryFilter);
                    
                    // 활성 카테고리 표시
                    categoryItems.forEach(i => i.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    
                    // 애니메이션 효과 추가 - 매번 애니메이션이 재생되도록 함
                    e.currentTarget.classList.remove('animate-pulse');
                    setTimeout(() => {
                        e.currentTarget.classList.add('animate-pulse');
                    }, 10);
                });
            });
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
                
                // 이전 버튼 추가 - 현재 페이지가 1보다 클 때만 표시
                if (pagination.currentPage > 1) {
                    paginationHtml += `<a href="#" class="prev" data-page="${pagination.currentPage - 1}"><i class="fas fa-chevron-left"></i> 이전</a>`;
                }
                
                // 페이지네이션 로직 개선 - 최대 10개까지만 보이게
                const maxVisiblePages = 10;
                const totalPages = pagination.totalPages;
                const currentPage = pagination.currentPage;
                
                let startPage = 1;
                let endPage = totalPages;
                
                if (totalPages > maxVisiblePages) {
                    // 현재 페이지를 중심으로 표시할 범위 계산
                    const halfVisible = Math.floor(maxVisiblePages / 2);
                    
                    if (currentPage <= halfVisible) {
                        // 현재 페이지가 앞쪽에 있을 때
                        startPage = 1;
                        endPage = maxVisiblePages;
                    } else if (currentPage > totalPages - halfVisible) {
                        // 현재 페이지가 뒤쪽에 있을 때
                        startPage = totalPages - maxVisiblePages + 1;
                        endPage = totalPages;
                    } else {
                        // 현재 페이지가 중간에 있을 때
                        startPage = currentPage - halfVisible;
                        endPage = currentPage + halfVisible;
                    }
                }
                
                // 첫 페이지가 보이지 않으면 첫 페이지와 ... 추가
                if (startPage > 1) {
                    paginationHtml += `<a href="#" data-page="1">1</a>`;
                    if (startPage > 2) {
                        paginationHtml += `<span class="ellipsis">...</span>`;
                    }
                }
                
                // 페이지 번호 생성
                for (let i = startPage; i <= endPage; i++) {
                    if (i === currentPage) {
                        paginationHtml += `<a href="#" class="active">${i}</a>`;
                    } else {
                        paginationHtml += `<a href="#" data-page="${i}">${i}</a>`;
                    }
                }
                
                // 마지막 페이지가 보이지 않으면 ... 와 마지막 페이지 추가
                if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                        paginationHtml += `<span class="ellipsis">...</span>`;
                    }
                    paginationHtml += `<a href="#" data-page="${totalPages}">${totalPages}</a>`;
                }
                
                // 다음 버튼 - 현재 페이지가 총 페이지 수보다 작을 때만 표시
                if (currentPage < totalPages) {
                    paginationHtml += `<a href="#" class="next" data-page="${currentPage + 1}">다음 <i class="fas fa-chevron-right"></i></a>`;
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
        console.log('==== 포스트 로딩 시작 ====');
        console.log('요청된 포스트 ID:', postId);
        
        const postContainer = document.getElementById('post-content');
        const loadingElement = document.getElementById('loading-post');
        const errorElement = document.getElementById('error-message');
        
        console.log('DOM 요소 상태:');
        console.log('- postContainer:', postContainer);
        console.log('- loadingElement:', loadingElement);
        console.log('- errorElement:', errorElement);
        console.log('- postContainer display:', postContainer ? getComputedStyle(postContainer).display : 'element not found');
        console.log('- loadingElement display:', loadingElement ? getComputedStyle(loadingElement).display : 'element not found');
        
        // 명시적으로 로딩 표시 및 컨테이너 숨김
        if (loadingElement) loadingElement.style.display = 'block';
        if (errorElement) errorElement.style.display = 'none';
        if (postContainer) postContainer.style.display = 'none';
        
        // 배경색 가져오는 헬퍼 함수
        function getBackgroundColor(category) {
            switch(category.trim()) {
                case '모델 업데이트': return 'rgba(52, 152, 219, 0.15)';
                case '연구 동향': return 'rgba(46, 204, 113, 0.15)';
                case '시장 동향': return 'rgba(231, 76, 60, 0.15)';
                case '개발자 도구': return 'rgba(243, 156, 18, 0.15)';
                default: return 'rgba(149, 165, 166, 0.15)';
            }
        }
        
        try {
            console.log('API 요청 시작:', `/api/posts/${postId}`);
            const response = await fetch(`/api/posts/${postId}`);
            console.log('API 응답 상태:', response.status, response.statusText);
            console.log('API 응답 헤더:', [...response.headers.entries()]);
            
            if (!response.ok) {
                throw new Error(`API 오류: ${response.status} ${response.statusText}`);
            }
            
            const post = await response.json();
            console.log('API 응답 데이터:', post);
            
            if (!post || !post.title) {
                console.error('유효하지 않은 포스트 데이터:', post);
                throw new Error('포스트 데이터가 유효하지 않습니다');
            }
            
            const categoryStyle = getCategoryStyle(post.category);
            
            // 원본 URL 찾기
            let originalUrl = '';
            
            // 1. 서버에서 제공한 originalUrl 필드가 있으면 우선 사용
            if (post.originalUrl) {
                originalUrl = post.originalUrl;
                console.log('서버에서 제공한 원본 URL 사용:', originalUrl);
            } 
            // 2. 없는 경우 콘텐츠에서 URL 추출 (기존 방식)
            else if (post.content && Array.isArray(post.content)) {
                console.log('콘텐츠에서 URL 추출 시도');
                for (let i = post.content.length - 1; i >= 0; i--) {
                    const block = post.content[i];
                    if (block.text && block.text.includes('https://')) {
                        // URL 패턴 추출
                        const urlMatch = block.text.match(/(https?:\/\/[^\s]+)/);
                        if (urlMatch) {
                            originalUrl = urlMatch[0];
                            console.log('콘텐츠에서 URL 추출됨:', originalUrl);
                            break;
                        }
                    }
                }
            } else {
                console.warn('URL을 찾을 수 있는 데이터가 없습니다:', post.content);
            }
            
            console.log('HTML 생성 시작');
            
            // 포스트 HTML 생성
            let postHtml = `
                <h1>${post.title}</h1>
                <div class="post-meta">
                    <span class="post-date">${post.date}</span>
                    <span class="post-category" 
                          style="background-color:${getBackgroundColor(post.category)}; color:${categoryStyle.color}; padding:0.3rem 0.8rem; border-radius:20px; font-weight:500; display:inline-flex; align-items:center;">
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
                // 먼저 요약(excerpt) 표시
                if (post.excerpt && post.excerpt.trim() !== '') {
                    postHtml += `
                    <div class="post-summary">
                        <h3>요약</h3>
                        <p>${post.excerpt}</p>
                    </div>
                    `;
                }
                
                // 그 다음 본문(content_full) 표시
                // 불릿포인트에 대한 줄바꿈 처리
                let formattedContent = post.content_full;
                
                // • 문자 주변에 줄바꿈 추가 (이미 줄바꿈 되어 있지 않은 경우에만)
                formattedContent = formattedContent.replace(/([^\n])•/g, '$1\n\n•');
                
                postHtml += `
                <div class="post-content">
                    <h3>본문</h3>
                    ${formattedContent.replace(/\n/g, '<br>')}
                </div>
                `;
            } else {
                // 원문이 없는 경우 블록 콘텐츠 처리
                // 먼저 요약(excerpt) 표시
                if (post.excerpt && post.excerpt.trim() !== '') {
                    postHtml += `
                    <div class="post-summary">
                        <h3>요약</h3>
                        <p>${post.excerpt}</p>
                    </div>
                    `;
                }
                
                postHtml += `<div class="post-content"><h3>본문</h3>`;
                
                // 불릿 포인트 아이템이 있는지 확인하고 필요한 경우 ul 요소 열기
                let inBulletedList = false;
                
                post.content.forEach((block, index) => {
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
                            // 만약 불릿 리스트 중이었다면 닫기
                            if (inBulletedList) {
                                postHtml += `</ul>`;
                                inBulletedList = false;
                            }
                            postHtml += `<p>${block.text}</p>`;
                            break;
                        case 'heading_1':
                            if (inBulletedList) {
                                postHtml += `</ul>`;
                                inBulletedList = false;
                            }
                            postHtml += `<h1>${block.text}</h1>`;
                            break;
                        case 'heading_2':
                            if (inBulletedList) {
                                postHtml += `</ul>`;
                                inBulletedList = false;
                            }
                            postHtml += `<h2>${block.text}</h2>`;
                            break;
                        case 'heading_3':
                            if (inBulletedList) {
                                postHtml += `</ul>`;
                                inBulletedList = false;
                            }
                            postHtml += `<h3>${block.text}</h3>`;
                            break;
                        case 'bulleted_list_item':
                            // 불릿 리스트가 시작되지 않았다면 ul 태그 열기
                            if (!inBulletedList) {
                                postHtml += `<ul class="bulleted-list">`;
                                inBulletedList = true;
                            }
                            postHtml += `<li>${block.text}</li>`;
                            
                            // 다음 블록이 불릿 리스트가 아니거나 마지막 블록이면 ul 태그 닫기
                            const nextBlock = index < post.content.length - 1 ? post.content[index + 1] : null;
                            if (!nextBlock || nextBlock.type !== 'bulleted_list_item') {
                                postHtml += `</ul>`;
                                inBulletedList = false;
                            }
                            break;
                        case 'image':
                            if (inBulletedList) {
                                postHtml += `</ul>`;
                                inBulletedList = false;
                            }
                            // 이미지 URL이 example로 시작하지 않는 경우에만 표시
                            if (block.url && !block.url.startsWith('example') && !block.url.includes('example.com')) {
                                postHtml += `<img src="${block.url}" alt="포스트 이미지">`;
                            }
                            break;
                    }
                });
                
                // 혹시 불릿 리스트가 닫히지 않았으면 닫아줌
                if (inBulletedList) {
                    postHtml += `</ul>`;
                }
                
                postHtml += `</div>`;
            }
            
            // 원본 URL이 있을 경우 추가
            if (originalUrl) {
                postHtml += `
                <div class="post-source">
                    <a href="${originalUrl}" target="_blank" rel="noopener noreferrer">
                        원본 링크 보기 <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
                `;
            }
            
            console.log('HTML 생성 완료. HTML 길이:', postHtml.length);
            
            // DOM 업데이트 전 상태 확인
            console.log('DOM 업데이트 전:');
            console.log('- postContainer display:', postContainer ? getComputedStyle(postContainer).display : 'element not found');
            console.log('- loadingElement display:', loadingElement ? getComputedStyle(loadingElement).display : 'element not found');
            
            // 로딩 숨기고 컨텐츠 표시
            if (loadingElement) loadingElement.style.display = 'none';
            if (postContainer) {
                postContainer.innerHTML = postHtml;
                postContainer.style.display = 'block';
                console.log('postContainer HTML 업데이트 완료. 현재 display:', getComputedStyle(postContainer).display);
            } else {
                console.error('postContainer 요소를 찾을 수 없습니다!');
            }
            
            // 페이지 타이틀 업데이트
            document.title = `${post.title} - AI 트랜드 블로그`;
            
            // 불릿 포인트 스타일링 적용
            applyBulletPointStyling();
            
            // DOM 변경 후 최종 상태 확인
            console.log('DOM 업데이트 후:');
            console.log('- postContainer visibility:', postContainer ? getComputedStyle(postContainer).visibility : 'element not found');
            console.log('- postContainer display:', postContainer ? getComputedStyle(postContainer).display : 'element not found');
            console.log('- postContainer offsetHeight:', postContainer ? postContainer.offsetHeight : 'element not found');
            
            // 페이지 로드 시 자동으로 클릭 이벤트 추적
            console.log('클릭 이벤트 추적 시작');
            await trackPostClick(postId);
            console.log('==== 포스트 로딩 완료 ====');
            
        } catch (error) {
            console.error('==== 포스트 로딩 오류 ====');
            console.error('오류 세부 정보:', error);
            console.error('오류 스택:', error.stack);
            
            // 로딩 숨기고 오류 표시
            if (loadingElement) loadingElement.style.display = 'none';
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.querySelector('p').textContent = `오류 메시지: ${error.message}`;
            } else if (postContainer) {
                postContainer.style.display = 'block';
                postContainer.innerHTML = `
                    <div class="error-message">
                        <h2>오류 발생</h2>
                        <p>포스트를 불러오는 중 문제가 발생했습니다: ${error.message}</p>
                        <p>콘솔을 확인하여 자세한 오류 정보를 확인하세요.</p>
                        <p><a href="/">메인 페이지로 돌아가기</a></p>
                    </div>
                `;
            }
        }
    }

    // 불릿 포인트 스타일링 적용 함수
    function applyBulletPointStyling() {
        // 모든 포스트 컨텐츠 p 태그 확인
        const paragraphs = document.querySelectorAll('.post-content p');
        
        paragraphs.forEach(p => {
            const html = p.innerHTML;
            
            // • 문자가 포함된 단락 찾기
            if (html.includes('•')) {
                // 클래스 추가
                p.classList.add('bullet-point-paragraph');
                
                // • 문자를 기준으로 텍스트 분할 후 다시 조합
                const parts = html.split('•');
                
                if (parts.length > 1) {
                    let newHtml = parts[0]; // 첫 부분은 그대로 유지
                    
                    // 불릿 포인트 부분에 스타일 적용하여 재조합
                    for (let i = 1; i < parts.length; i++) {
                        newHtml += '<br><br>• ' + parts[i];
                    }
                    
                    p.innerHTML = newHtml;
                }
            }
        });
    }

    // 인기 포스트 로드
    loadPopularPosts();

    // 현재 연도 자동 표시
    const currentYear = new Date().getFullYear();
    const copyrightElements = document.querySelectorAll('.copyright-year');
    
    copyrightElements.forEach(function(element) {
        element.textContent = currentYear;
    });
});

// 인기 포스트 로드 함수
async function loadPopularPosts() {
    try {
        const popularPostsContainer = document.querySelector('.popular-posts');
        if (!popularPostsContainer) return;

        // 로딩 상태 표시
        popularPostsContainer.innerHTML = '<li class="loading-popular-posts"><p>인기 포스트를 불러오는 중입니다...</p></li>';
        
        // 인기 포스트 데이터 가져오기 (캐시 방지 쿼리 파라미터 추가)
        const cacheBuster = new Date().getTime();
        console.log('인기 포스트 데이터 요청 중...');
        const response = await fetch(`/api/popular-posts?_=${cacheBuster}`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`인기 포스트를 가져오는 중 오류가 발생했습니다: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('인기 포스트 데이터 수신됨:', data);
        
        // 포스트가 없는 경우
        if (!data.posts || data.posts.length === 0) {
            console.log('인기 포스트 데이터가 없습니다');
            popularPostsContainer.innerHTML = '<li class="no-popular-posts"><p>아직 인기 포스트가 없습니다.</p></li>';
            return;
        }
        
        // 인기 포스트 목록 생성
        let postsHTML = '';
        
        data.posts.forEach(post => {
            const formattedDate = post.date ? new Date(post.date).toLocaleDateString('ko-KR') : '';
            
            // 클릭 카운트 처리 - 명시적 타입 변환 및 디버깅
            let clickCount = 0;
            
            // 클릭 카운트 로직 개선 - 수신된 데이터 로깅
            console.log(`포스트 '${post.title}'의 원본 클릭 카운트:`, post.clickCount, `(타입: ${typeof post.clickCount})`);
            
            if (post.clickCount !== undefined && post.clickCount !== null) {
                // 문자열 또는 다른 타입에서 숫자로 명시적 변환
                clickCount = Number(post.clickCount);
                
                // NaN 체크
                if (isNaN(clickCount)) {
                    console.log(`포스트 '${post.title}'의 클릭 카운트가 유효한 숫자가 아닙니다. 0으로 설정합니다.`);
                    clickCount = 0;
                }
            }
            
            console.log(`포스트 '${post.title}'의 최종 클릭 카운트:`, clickCount);
            
            postsHTML += `
                <li>
                    <a href="/post/${post.id}" onclick="trackPostClick('${post.id}')">
                        <span class="post-title">${post.title}</span>
                        <div class="post-meta">
                            <span class="post-date">${formattedDate}</span>
                            <span class="post-clicks"><i class="fas fa-eye"></i>&nbsp;${clickCount}회</span>
                        </div>
                    </a>
                </li>
            `;
        });
        
        popularPostsContainer.innerHTML = postsHTML;
        
        // 인기 포스트인지 최신 포스트인지 표시
        const popularPostsTitle = document.querySelector('.sidebar-widget h3');
        if (popularPostsTitle && data.isLatest) {
            popularPostsTitle.innerHTML = '최신 포스트 <span class="badge">NEW</span>';
        } else if (popularPostsTitle) {
            popularPostsTitle.innerHTML = '인기 포스트 <span class="badge">HOT</span>';
        }
    } catch (error) {
        console.error('인기 포스트를 로드하는 중 오류 발생:', error);
        
        const popularPostsContainer = document.querySelector('.popular-posts');
        if (popularPostsContainer) {
            popularPostsContainer.innerHTML = '<li class="error-message"><p>인기 포스트를 불러오는 중 오류가 발생했습니다.</p></li>';
        }
    }
}

// 포스트 클릭 추적 함수
async function trackPostClick(postId) {
    try {
        console.log(`포스트 클릭 추적 시작: ${postId}`);
        
        // 클릭 이벤트 추적 API 호출
        const response = await fetch(`/api/posts/${postId}/track-click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('클릭 이벤트 추적 실패:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('오류 상세:', errorText);
        } else {
            const result = await response.json();
            console.log('클릭 이벤트 추적 성공:', result);
            
            // 즉시 인기 포스트 새로고침 (지연 없이)
            if (document.querySelector('.popular-posts')) {
                console.log('인기 포스트 목록 새로고침');
                loadPopularPosts();
            }
        }
    } catch (error) {
        // 클릭 추적 실패해도 사용자 경험에 영향을 주지 않도록 조용히 처리
        console.error('클릭 이벤트 추적 중 오류:', error);
    }
    
    // 기본 네비게이션은 계속 진행
    return true;
} 