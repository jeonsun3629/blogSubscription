/**
 * 광고 자동 삽입 및 관리 스크립트
 */

// 광고 삽입 간격 (3개의 포스트마다 광고 삽입)
const AD_INSERTION_INTERVAL = 3;

/**
 * 포스트 목록 사이에 광고를 삽입하는 함수
 * @param {string} containerId - 포스트 목록을 담고 있는 컨테이너 ID
 */
function insertAdsInPosts(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // 포스트 아이템들 가져오기
  const postItems = container.querySelectorAll('.article-card');
  if (postItems.length < AD_INSERTION_INTERVAL) return; // 포스트가 너무 적으면 광고 삽입 안함
  
  // AD_INSERTION_INTERVAL 간격으로 광고 삽입
  for (let i = AD_INSERTION_INTERVAL; i < postItems.length; i += AD_INSERTION_INTERVAL + 1) {
    const adElement = createAdElement('YOUR_IN_FEED_AD_SLOT');
    
    // 현재 포스트 앞에 광고 삽입
    if (postItems[i]) {
      postItems[i].parentNode.insertBefore(adElement, postItems[i]);
    }
  }
}

/**
 * 광고 요소 생성 함수
 * @param {string} adSlot - 광고 슬롯 ID
 * @returns {HTMLElement} - 생성된 광고 요소
 */
function createAdElement(adSlot) {
  // 광고 컨테이너 생성
  const adContainer = document.createElement('div');
  adContainer.className = 'ad-container article-ad';
  
  // 광고 라벨 생성
  const adLabel = document.createElement('p');
  adLabel.className = 'ad-label';
  adLabel.textContent = '광고';
  adContainer.appendChild(adLabel);
  
  // AdSense 광고 요소 생성
  const adInsElement = document.createElement('ins');
  adInsElement.className = 'adsbygoogle';
  adInsElement.style.display = 'block';
  adInsElement.setAttribute('data-ad-client', 'ca-pub-YOUR_ADSENSE_ID');
  adInsElement.setAttribute('data-ad-slot', adSlot);
  adInsElement.setAttribute('data-ad-format', 'auto');
  adInsElement.setAttribute('data-full-width-responsive', 'true');
  adContainer.appendChild(adInsElement);
  
  // 광고 로드 스크립트 생성
  const adScript = document.createElement('script');
  adScript.textContent = '(adsbygoogle = window.adsbygoogle || []).push({});';
  adContainer.appendChild(adScript);
  
  return adContainer;
}

/**
 * 사이드바에 광고 삽입 함수
 */
function insertSidebarAd() {
  const sidebarWidgets = document.querySelectorAll('.sidebar-widget');
  if (sidebarWidgets.length < 2) return;
  
  // 첫 번째와 두 번째 위젯 사이에 광고 삽입
  const secondWidget = sidebarWidgets[1];
  const sidebar = secondWidget.parentNode;
  
  // 이미 광고가 있는지 확인
  const existingAd = sidebar.querySelector('.sidebar-ad');
  if (!existingAd) {
    const adElement = createAdElement('YOUR_SIDEBAR_AD_SLOT');
    adElement.classList.add('sidebar-ad');
    sidebar.insertBefore(adElement, secondWidget);
  }
}

/**
 * 포스트 내용에 광고 삽입 함수
 * @param {string} contentId - 포스트 내용을 담고 있는 요소 ID
 */
function insertAdInPostContent(contentId) {
  const contentElement = document.getElementById(contentId);
  if (!contentElement) return;
  
  // 포스트 내 모든 단락 찾기
  const paragraphs = contentElement.querySelectorAll('p');
  if (paragraphs.length < 4) return; // 단락이 너무 적으면 광고 삽입 안함
  
  // 중간 지점에 광고 삽입
  const middleIndex = Math.floor(paragraphs.length / 2);
  if (paragraphs[middleIndex]) {
    const adElement = createAdElement('YOUR_POST_CONTENT_AD_SLOT');
    paragraphs[middleIndex].parentNode.insertBefore(adElement, paragraphs[middleIndex]);
  }
}

/**
 * 페이지 로드 완료 후 광고 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
  // 메인 페이지인 경우
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    // 포스트 목록에 광고 삽입
    setTimeout(() => {
      insertAdsInPosts('latest');
      insertSidebarAd();
    }, 1000); // 컨텐츠 로드 후 광고 삽입
  }
  
  // 포스트 페이지인 경우
  if (window.location.pathname.startsWith('/post/')) {
    // 포스트 로드 후 광고 삽입
    setTimeout(() => {
      insertAdInPostContent('post-body');
    }, 1000);
  }
}); 