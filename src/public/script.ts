interface Post {
    id: string;
    title: string;
    date: string;
    category: string;
    excerpt: string;
}

interface PostDetail extends Post {
    content: Array<{
        type: string;
        text?: string;
        url?: string;
    }>;
}

document.addEventListener('DOMContentLoaded', function() {
    // 카드 애니메이션 효과
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function(this: HTMLElement) {
            this.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', function(this: HTMLElement) {
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

    // 아티클 카드 호버 애니메이션
    const articleCards = document.querySelectorAll('.article-card');
    
    articleCards.forEach(card => {
        card.addEventListener('mouseenter', function(this: HTMLElement) {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function(this: HTMLElement) {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        });
    });

    // 검색 기능
    const searchForm = document.getElementById('search-form') as HTMLFormElement;
    const searchInput = document.getElementById('search-input') as HTMLInputElement;

    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm.length > 0) {
                performSearch(searchTerm);
            }
        });
    }

    function performSearch(searchTerm: string): void {
        // 실제 검색 기능이 구현되면 이 부분을 수정
        // 지금은 검색어를 알림으로 표시
        console.log(`검색어: ${searchTerm}`);
        
        // 검색 결과 페이지로 이동하는 코드 (실제 구현 시 사용)
        // window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
        alert(`"${searchTerm}"에 대한 검색 결과를 보여드릴게요.`);
        
        // 검색 입력창 초기화
        searchInput.value = '';
    }

    // 구독 폼 제출
    const subscribeForm = document.getElementById('subscribe-form') as HTMLFormElement;
    const newsletterForm = document.getElementById('newsletter-form') as HTMLFormElement;

    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = (this.querySelector('input[type="email"]') as HTMLInputElement).value;
            
            if (validateEmail(email)) {
                // 실제로는 서버에 이메일 전송 로직 추가
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
            const name = (this.querySelector('input[type="text"]') as HTMLInputElement).value;
            const email = (this.querySelector('input[type="email"]') as HTMLInputElement).value;
            
            if (name && validateEmail(email)) {
                // 실제로는 서버에 이메일 전송 로직 추가
                alert('구독해 주셔서 감사합니다! 확인 이메일을 발송했습니다.');
                this.reset();
            } else {
                alert('이름과 유효한 이메일 주소를 모두 입력해 주세요.');
            }
        });
    }

    function validateEmail(email: string): boolean {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // 스크롤 버튼 기능 설정
    const scrollToTopButton = document.querySelector('.scroll-to-top') as HTMLButtonElement;
    
    // 스크롤 위치에 따라 버튼 표시/숨김
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopButton.classList.add('show');
        } else {
            scrollToTopButton.classList.remove('show');
        }
    });
    
    // 버튼 클릭 시 페이지 상단으로 스크롤
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
        
        // 링크 클릭 시 메뉴 닫기
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('mobile-open');
                menuButton.classList.remove('active');
                menuButton.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    };
    
    // 화면 너비가 모바일 크기일 때만 메뉴 생성
    if (window.innerWidth <= 768) {
        createMobileMenu();
    }
    
    window.addEventListener('resize', () => {
        const existingButton = document.querySelector('.menu-toggle');
        
        if (window.innerWidth <= 768 && !existingButton) {
            createMobileMenu();
        } else if (window.innerWidth > 768 && existingButton) {
            existingButton.remove();
            const mainNav = document.querySelector('.main-nav');
            if (mainNav) {
                mainNav.classList.remove('mobile-open');
            }
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
    const latestElement = document.getElementById('latest');
    if (latestElement) {
        setupCategoryFilters();
        loadLatestPosts();
    }

    // 포스트 상세 페이지에서 포스트 내용 로드
    const postContentElement = document.getElementById('post-content');
    if (postContentElement && window.location.pathname.includes('/post/')) {
        const postId = window.location.pathname.split('/post/')[1];
        if (postId) {
            loadPostContent(postId);
        }
    }

    // 카테고리에 따른 스타일과 아이콘 반환 함수
    function getCategoryStyle(category: string): { color: string; icon: string; name: string } {
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

    // 현재 선택된 카테고리
    let currentCategory = 'all';

    // 포스트 로드 함수
    async function loadLatestPosts(page = 1) {
        try {
            const perPage = 5;
            
            // 로딩 상태 표시
            document.getElementById('posts-container')!.innerHTML = `
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
                postsContainer!.innerHTML = `<div class="no-posts">게시물이 없습니다.</div>`;
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
            
            // 페이지네이션 HTML 생성
            let paginationHtml = '<div class="pagination">';
            for (let i = 1; i <= data.pagination.totalPages; i++) {
                paginationHtml += `<a href="#" class="${i === data.pagination.currentPage ? 'active' : ''}" data-page="${i}">${i}</a>`;
            }
            
            if (data.pagination.hasNextPage) {
                paginationHtml += `<a href="#" class="next" data-page="${data.pagination.currentPage + 1}">다음 <i class="fas fa-chevron-right"></i></a>`;
            }
            
            paginationHtml += '</div>';
            
            // 포스트 목록 업데이트
            postsContainer!.innerHTML = postsHtml + paginationHtml;
            
            // 페이지네이션 이벤트 리스너 추가
            const paginationLinks = postsContainer!.querySelectorAll('.pagination a');
            paginationLinks.forEach(link => {
                link.addEventListener('click', function(event) {
                    event.preventDefault();
                    const pageLink = event.currentTarget as HTMLElement;
                    const pageNum = parseInt(pageLink.getAttribute('data-page') || '1');
                    loadLatestPosts(pageNum);
                });
            });
        } catch (error) {
            console.error('포스트를 가져오는 중 오류 발생:', error);
            if (latestElement) {
                latestElement.innerHTML = `
                    <div class="error-message">
                        <h2>오류 발생</h2>
                        <p>포스트를 불러오는 중 문제가 발생했습니다. 나중에 다시 시도해 주세요.</p>
                    </div>
                `;
            }
        }
    }

    // 카테고리 필터 설정
    function setupCategoryFilters() {
        const categoryLinks = document.querySelectorAll('.category-link');
        
        categoryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 이전에 활성화된 링크에서 활성 클래스 제거
                categoryLinks.forEach(el => el.classList.remove('active'));
                
                // 클릭된 링크에 활성 클래스 추가
                link.classList.add('active');
                
                // 선택된 카테고리 업데이트
                const category = (link as HTMLElement).dataset.category;
                currentCategory = category || 'all';
                
                // 포스트 다시 로드
                loadLatestPosts(1);
            });
        });
    }

    // 카테고리 개수 업데이트
    function updateCategoryCounts(categoryCounts: Record<string, number>) {
        // 전체 포스트 개수 계산
        let totalCount = 0;
        Object.values(categoryCounts).forEach(count => {
            totalCount += count;
        });
        
        // '전체' 카테고리 개수 업데이트
        const allCountElement = document.querySelector('[data-category="all"] .count');
        if (allCountElement) {
            allCountElement.textContent = totalCount.toString();
        }
        
        // 각 카테고리별 개수 업데이트
        for (const [category, count] of Object.entries(categoryCounts)) {
            const countElement = document.querySelector(`[data-category="${category}"] .count`);
            if (countElement) {
                countElement.textContent = count.toString();
            }
        }
    }

    // 포스트 상세 내용 로드
    async function loadPostContent(postId: string): Promise<void> {
        const postContainer = document.getElementById('post-content');
        
        try {
            const response = await fetch(`/api/posts/${postId}`);
            
            if (!response.ok) {
                throw new Error('포스트를 가져오는 중 오류가 발생했습니다.');
            }
            
            const post = await response.json() as PostDetail;
            const categoryStyle = getCategoryStyle(post.category);
            
            // 포스트 HTML 생성
            let postHtml = `
                <h1>${post.title}</h1>
                <div class="post-meta">
                    <span class="post-date">${post.date}</span>
                    <span class="post-category" style="background-color: ${categoryStyle.color}20; color: ${categoryStyle.color};">
                        <i class="fas ${categoryStyle.icon}"></i> ${categoryStyle.name}
                    </span>
                </div>
                <div class="post-content">
            `;
            
            // 블록 콘텐츠 처리
            post.content.forEach(block => {
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
                        postHtml += `<img src="${block.url}" alt="포스트 이미지">`;
                        break;
                }
            });
            
            postHtml += `
                </div>
                <div class="post-source">
                    <a href="https://www.notion.so/${post.id.replace(/-/g, '')}" target="_blank">
                        원본 Notion 페이지 보기 <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            `;
            
            if (postContainer) {
                postContainer.innerHTML = postHtml;
            }
            
            // 페이지 타이틀 업데이트
            document.title = `${post.title} - AI 트렌드 파인더`;
            
        } catch (error) {
            console.error('포스트를 가져오는 중 오류 발생:', error);
            if (postContainer) {
                postContainer.innerHTML = `
                    <div class="error-message">
                        <h2>오류 발생</h2>
                        <p>포스트를 불러오는 중 문제가 발생했습니다. 나중에 다시 시도해 주세요.</p>
                        <p><a href="/">메인 페이지로 돌아가기</a></p>
                    </div>
                `;
            }
        }
    }
}); 