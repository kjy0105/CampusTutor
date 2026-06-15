// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAP9fhIbCtoHhi_y5w7CXQFC-u7thqVIPM",
  authDomain: "aiprogramming-71ae4.firebaseapp.com",
  databaseURL: "https://aiprogramming-71ae4-default-rtdb.firebaseio.com",
  projectId: "aiprogramming-71ae4",
  storageBucket: "aiprogramming-71ae4.firebasestorage.app",
  messagingSenderId: "906168237817",
  appId: "1:906168237817:web:4d2f2b2fadc2171f85ac28",
  measurementId: "G-YT86VQJBXG"
};

// Initialize region dropdown & Firebase
document.addEventListener('DOMContentLoaded', () => {
    ['tutee', 'tutor', 'edit-tutee', 'edit-tutor'].forEach(prefix => {
        const regionSelect = document.getElementById(`${prefix}-region`);
        if (regionSelect) {
            Object.keys(regionData).forEach(reg => {
                const opt = document.createElement('option');
                opt.value = reg;
                opt.textContent = reg;
                regionSelect.appendChild(opt);
            });
        }
    });
    initFirebase();
    updateHomeHero();
    
    // Restore navigation UI state on refresh if user session is alive
    updateNavigationUI();

    // Close modals on Escape key press
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // Close chat modal properly if open
            const chatModal = document.getElementById('chatModal');
            if (chatModal && chatModal.style.display === 'block') {
                closeChatModal();
            }
            
            // Close tutoring application modal properly if open
            const applyModal = document.getElementById('applyModal');
            if (applyModal && applyModal.style.display === 'block') {
                closeApplyModal();
            }
            
            // Close authentication modal properly if open
            const authModal = document.getElementById('authModal');
            if (authModal && authModal.style.display === 'block') {
                closeAuthModal();
            }
            
            // Close other general modals
            const otherModals = ['reviewModal', 'suggestionModal', 'editProfileModal', 'deleteTutoringModal', 'tutorProposalModal', 'studentViewProposalsModal', 'editReviewModal', 'viewReviewsModal'];
            otherModals.forEach(id => {
                const modal = document.getElementById(id);
                if (modal && modal.style.display === 'block') {
                    closeModal(id);
                }
            });
        }
    });
});

// State Management
let currentUser = null;
let users = [];
let tutors = [];
let applications = [];
let reviews = [];
let suggestions = [];
let certifications = [];
let db = null;


const DEFAULT_USERS = [
    { email: "student@univ.ac.kr", password: "123", role: "tutee", region: "서울특별시", subRegion: "강남구", name: "홍길동", points: 5000, status: "active" },
    { email: "tutor@univ.ac.kr", password: "123", role: "tutor", region: "서울특별시", subRegion: "강남구", name: "김선생", points: 1000, status: "active" },
    { email: "admin@campustutor.com", password: "admin", role: "admin", region: "서울특별시", subRegion: "강남구", name: "최관리자", points: 0, status: "active" },
    
    // Students 1~20 (전라남도 나주시)
    { email: "student1@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "강지우", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student2@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "김민준", age: "17", school: "영산고등학교", points: 5000, status: "active" },
    { email: "student3@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "박서연", age: "19", school: "전남외국어고등학교", points: 5000, status: "active" },
    { email: "student4@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "이서준", age: "16", school: "나주중학교", points: 5000, status: "active" },
    { email: "student5@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "정예은", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student6@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "최도윤", age: "17", school: "영산고등학교", points: 5000, status: "active" },
    { email: "student7@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "한지민", age: "19", school: "전남외국어고등학교", points: 5000, status: "active" },
    { email: "student8@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "임예준", age: "18", school: "금성고등학교", points: 5000, status: "active" },
    { email: "student9@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "오윤아", age: "17", school: "나주여자고등학교", points: 5000, status: "active" },
    { email: "student10@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "서우진", age: "19", school: "금성고등학교", points: 5000, status: "active" },
    { email: "student11@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "신지아", age: "16", school: "영산중학교", points: 5000, status: "active" },
    { email: "student12@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "권현우", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student13@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "황다은", age: "17", school: "나주여자고등학교", points: 5000, status: "active" },
    { email: "student14@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "송민우", age: "19", school: "금성고등학교", points: 5000, status: "active" },
    { email: "student15@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "안채원", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student16@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "전태양", age: "17", school: "영산고등학교", points: 5000, status: "active" },
    { email: "student17@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "홍유진", age: "19", school: "전남외국어고등학교", points: 5000, status: "active" },
    { email: "student18@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "유재혁", age: "16", school: "나주중학교", points: 5000, status: "active" },
    { email: "student19@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "양하은", age: "18", school: "나주여자고등학교", points: 5000, status: "active" },
    { email: "student20@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "고준우", age: "17", school: "금성고등학교", points: 5000, status: "active" },
    
    // Students 21~45 (전라남도 나주시)
    { email: "student21@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "신지민", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student22@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "조현우", age: "17", school: "영산고등학교", points: 5000, status: "active" },
    { email: "student23@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "윤서윤", age: "19", school: "전남외국어고등학교", points: 5000, status: "active" },
    { email: "student24@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "백지우", age: "16", school: "나주중학교", points: 5000, status: "active" },
    { email: "student25@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "남윤아", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student26@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "배민재", age: "17", school: "금성고등학교", points: 5000, status: "active" },
    { email: "student27@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "곽지성", age: "19", school: "나주여자고등학교", points: 5000, status: "active" },
    { email: "student28@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "유다원", age: "18", school: "금성고등학교", points: 5000, status: "active" },
    { email: "student29@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "성준혁", age: "16", school: "영산중학교", points: 5000, status: "active" },
    { email: "student30@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "구예원", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student31@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "계지은", age: "17", school: "나주여자고등학교", points: 5000, status: "active" },
    { email: "student32@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "주태민", age: "19", school: "금성고등학교", points: 5000, status: "active" },
    { email: "student33@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "양지현", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student34@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "도지훈", age: "17", school: "영산고등학교", points: 5000, status: "active" },
    { email: "student35@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "진하은", age: "19", school: "전남외국어고등학교", points: 5000, status: "active" },
    { email: "student36@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "지예준", age: "16", school: "나주중학교", points: 5000, status: "active" },
    { email: "student37@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "선예원", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student38@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "표태윤", age: "17", school: "영산고등학교", points: 5000, status: "active" },
    { email: "student39@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "제지우", age: "19", school: "전남외국어고등학교", points: 5000, status: "active" },
    { email: "student40@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "동현우", age: "18", school: "금성고등학교", points: 5000, status: "active" },
    { email: "student41@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "명지민", age: "17", school: "나주여자고등학교", points: 5000, status: "active" },
    { email: "student42@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "기태양", age: "19", school: "금성고등학교", points: 5000, status: "active" },
    { email: "student43@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "손하은", age: "16", school: "영산중학교", points: 5000, status: "active" },
    { email: "student44@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "감준우", age: "18", school: "나주고등학교", points: 5000, status: "active" },
    { email: "student45@univ.ac.kr", password: "123", role: "tutee", region: "전라남도", subRegion: "나주시", name: "피채원", age: "17", school: "나주여자고등학교", points: 5000, status: "active" },
    
    // Tutors 1~6 (전라남도 나주시)
    { email: "tutor1@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "정다원", univ: "서울대학교 수학교육과", fee: "30000", spec: "수학/과학 전문 과외 3년 차, 친절하고 자세한 설명", subjects: ["수학", "물리학", "화학"], points: 1000, status: "active" },
    { email: "tutor2@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "최수현", univ: "고려대학교 영어영문학과", fee: "25000", spec: "토익 990점 만점, 수능 국어/영어 1등급 전문 지도", subjects: ["영어", "국어"], points: 1000, status: "active" },
    { email: "tutor3@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "박건우", univ: "연세대학교 화학과", fee: "28000", spec: "수능 과학탐구 전문, 철저한 개념 이해와 오답 분석", subjects: ["생명과학", "지구과학", "화학"], points: 1000, status: "active" },
    { email: "tutor4@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "이소영", univ: "이화여자대학교 사회교육과", fee: "24000", spec: "사회탐구 전과목 만점, 핵심 정리 요약 노트 제공", subjects: ["세계지리", "한국지리", "윤리와 사상"], points: 1000, status: "active" },
    { email: "tutor5@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "강민성", univ: "한양대학교 컴퓨터소프트웨어학부", fee: "27000", spec: "이공계 멘토링 경험 다수, 수학과 영어의 핵심 개념 지도", subjects: ["수학", "영어"], points: 1000, status: "active" },
    { email: "tutor6@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "윤지호", univ: "성균관대학교 글로벌경제학과", fee: "26000", spec: "상경계열 진학 컨설팅 병행, 쉬운 예시를 통한 사회탐구 완벽 대비", subjects: ["경제학", "법과 정치", "생활과 윤리"], points: 1000, status: "active" },
    { email: "tutor7@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "홍예슬", univ: "한국예술종합학교 디자인과", fee: "29000", spec: "미술 실기 및 파이썬 코딩, 음악 바이올린 기초 레슨 전문", subjects: ["파이썬", "미술", "음악"], points: 1000, status: "active" },

    // Tutors 8~22 (전라남도 나주시)
    { email: "tutor8@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "임찬우", univ: "서강대학교 신문방송학과", fee: "24000", spec: "수능 국어/사회탐구 전문, 쉽고 재미있게 가르치는 과외", subjects: ["국어", "세계지리", "생활과 윤리"], points: 1000, status: "active" },
    { email: "tutor9@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "송지혜", univ: "중앙대학교 피아노과", fee: "30000", spec: "클래식 피아노 기초부터 입시 실기 완벽 코칭", subjects: ["음악"], points: 1000, status: "active" },
    { email: "tutor10@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "권태현", univ: "성균관대학교 소프트웨어학과", fee: "28000", spec: "파이썬 코딩 및 수학 전문, 기초부터 알고리즘까지", subjects: ["파이썬", "수학"], points: 1000, status: "active" },
    { email: "tutor11@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "하은지", univ: "서울대학교 동양화과", fee: "29000", spec: "미술 실기 및 기초 드로잉, 예고 진학 컨설팅", subjects: ["미술"], points: 1000, status: "active" },
    { email: "tutor12@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "전승우", univ: "카이스트 전산학부", fee: "32000", spec: "수학/파이썬 전문 과외, 논리적이고 명쾌한 수업", subjects: ["수학", "파이썬"], points: 1000, status: "active" },
    { email: "tutor13@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "차수민", univ: "연세대학교 영어영문학과", fee: "27000", spec: "수능/내신 영어 전문, 꼼꼼한 관리와 1:1 밀착 피드백", subjects: ["영어"], points: 1000, status: "active" },
    { email: "tutor14@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "소정인", univ: "고려대학교 생명공학과", fee: "26000", spec: "생명과학, 화학 전문 지도. 개념부터 킬러 문제 풀이까지", subjects: ["생명과학", "화학"], points: 1000, status: "active" },
    { email: "tutor15@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "민경민", univ: "한양대학교 미래자동차공학과", fee: "25000", spec: "물리학, 지구과학 전문 과외, 이공계 기초 및 심화", subjects: ["물리학", "지구과학"], points: 1000, status: "active" },
    { email: "tutor16@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "설수진", univ: "경희대학교 지리학과", fee: "23000", spec: "세계지리 및 한국지리 완벽 개념 정리, 1등급 목표 관리", subjects: ["세계지리", "한국지리"], points: 1000, status: "active" },
    { email: "tutor17@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "방도윤", univ: "서울시립대학교 경제학과", fee: "24000", spec: "수능 경제학, 윤리와 사상 명품 강의, 기초 개념 다지기", subjects: ["경제학", "윤리와 사상"], points: 1000, status: "active" },
    { email: "tutor18@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "제갈선", univ: "동국대학교 법학과", fee: "24000", spec: "법과 정치, 생활과 윤리 핵심 요약 및 기출 완벽 분석", subjects: ["법과 정치", "생활과 윤리"], points: 1000, status: "active" },
    { email: "tutor19@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "나영우", univ: "포항공과대학교 컴퓨터공학과", fee: "35000", spec: "파이썬 실전 프로그래밍 및 고난도 수학 과외", subjects: ["파이썬", "수학"], points: 1000, status: "active" },
    { email: "tutor20@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "홍지우", univ: "한국외국어대학교 영어교육과", fee: "26000", spec: "내신 영어 만점 대비, 영어 기초 발음부터 독해 완벽 완성", subjects: ["영어"], points: 1000, status: "active" },
    { email: "tutor21@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "엄태호", univ: "건국대학교 수의학과", fee: "28000", spec: "수능 수학, 화학 전문 지도. 상위권 도약을 위한 맞춤 수업", subjects: ["수학", "화학"], points: 1000, status: "active" },
    { email: "tutor22@univ.ac.kr", password: "123", role: "tutor", region: "전라남도", subRegion: "나주시", name: "변아름", univ: "이화여자대학교 서양화과", fee: "29000", spec: "미술 기초 드로잉, 수채화 및 창의 미술 지도", subjects: ["미술"], points: 1000, status: "active" }
];

// Function to generate random realistic availability slots (excluding school hours for students)
function generateRandomAvailability(role) {
    const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const availability = [];
    
    if (role === 'tutor') {
        // Tutors: weekday afternoon/evening (12:00-24:00 -> slot 24-47), weekend all day (08:00-24:00 -> slot 16-47)
        DAYS.forEach(day => {
            const isWeekend = (day === 'sat' || day === 'sun');
            const startSlot = isWeekend ? 16 : 24;
            const endSlot = 47;
            
            for (let slot = startSlot; slot <= endSlot; slot++) {
                if (Math.random() < 0.45) { // 45% chance of being free
                    availability.push(`${day}-${slot}`);
                }
            }
        });
    } else if (role === 'tutee') {
        // Students: exclude Mon-Fri 09:00-17:00 (slot 18-34)
        DAYS.forEach(day => {
            const isWeekend = (day === 'sat' || day === 'sun');
            
            if (isWeekend) {
                // Weekend all day (08:00-24:00 -> slot 16-47)
                for (let slot = 16; slot <= 47; slot++) {
                    if (Math.random() < 0.35) { // 35% chance
                        availability.push(`${day}-${slot}`);
                    }
                }
            } else {
                // Weekdays: 08:00-09:00 (slot 16-17) and 17:00-24:00 (slot 34-47)
                for (let slot = 16; slot <= 17; slot++) {
                    if (Math.random() < 0.2) {
                        availability.push(`${day}-${slot}`);
                    }
                }
                for (let slot = 34; slot <= 47; slot++) {
                    if (Math.random() < 0.45) { // 45% chance
                        availability.push(`${day}-${slot}`);
                    }
                }
            }
        });
    }
    
    return availability;
}

// Populate random availability in DEFAULT_USERS
DEFAULT_USERS.forEach(user => {
    if (user.role === 'tutor' || user.role === 'tutee') {
        user.availability = generateRandomAvailability(user.role);
    }
});

const DEFAULT_TUTORS = [
    { id: 101, name: "김선생", region: "서울특별시", subRegion: "강남구", subject: "수학", bio: "서울대 수학과 졸업", fee: 25000 },
    { id: 102, name: "이튜터", region: "경기도", subRegion: "수원시", subject: "파이썬", bio: "현업 개발자", fee: 30000 },
    
    // Tutors 1~6
    { id: 103, name: "정다원", region: "전라남도", subRegion: "나주시", subject: "수학, 물리학, 화학", bio: "서울대학교 수학교육과 졸업 / 수학/과학 전문 과외 3년 차", fee: 30000 },
    { id: 104, name: "최수현", region: "전라남도", subRegion: "나주시", subject: "영어, 국어", bio: "고려대학교 영어영문학과 재학 / 수능 영어/국어 1등급 맞춤형 수업", fee: 25000 },
    { id: 105, name: "박건우", region: "전라남도", subRegion: "나주시", subject: "생명과학, 지구과학, 화학", bio: "연세대학교 화학과 재학 / 과학탐구 개념 완성 및 문제 풀이 강사", fee: 28000 },
    { id: 106, name: "이소영", region: "전라남도", subRegion: "나주시", subject: "세계지리, 한국지리, 윤리와 사상", bio: "이화여자대학교 사회교육과 재학 / 사회탐구 개념 완벽 마스터", fee: 24000 },
    { id: 107, name: "강민성", region: "전라남도", subRegion: "나주시", subject: "수학, 영어", bio: "한양대학교 컴퓨터소프트웨어학부 재학 / 눈높이에 맞춘 1:1 수학/영어 수업", fee: 27000 },
    { id: 108, name: "윤지호", region: "전라남도", subRegion: "나주시", subject: "경제학, 법과 정치, 생활과 윤리", bio: "성균관대학교 글로벌경제학과 졸업 / 재미있는 사회탐구 및 진학 코칭", fee: 26000 },
    { id: 109, name: "홍예슬", region: "전라남도", subRegion: "나주시", subject: "파이썬, 미술, 음악", bio: "한국예술종합학교 디자인과 재학 / 드로잉 실기 및 파이썬 융합 코딩 전문 튜터", fee: 29000 },

    // Tutors 8~22
    { id: 110, name: "임찬우", region: "전라남도", subRegion: "나주시", subject: "국어, 세계지리, 생활과 윤리", bio: "서강대학교 신문방송학과 재학 / 수능 국어/사탐 전문 지도", fee: 24000 },
    { id: 111, name: "송지혜", region: "전라남도", subRegion: "나주시", subject: "음악", bio: "중앙대학교 피아노과 재학 / 클래식 피아노 기초 및 입시 실기 레슨", fee: 30000 },
    { id: 112, name: "권태현", region: "전라남도", subRegion: "나주시", subject: "파이썬, 수학", bio: "성균관대학교 소프트웨어학과 재학 / 파이썬 코딩 기초 및 수학 논리 완성", fee: 28000 },
    { id: 113, name: "하은지", region: "전라남도", subRegion: "나주시", subject: "미술", bio: "서울대학교 동양화과 재학 / 미술 실기 및 드로잉, 예고 진학 컨설팅", fee: 29000 },
    { id: 114, name: "전승우", region: "전라남도", subRegion: "나주시", subject: "수학, 파이썬", bio: "카이스트 전산학부 재학 / 명쾌한 수학 개념 및 파이썬 실무 과외", fee: 32000 },
    { id: 115, name: "차수민", region: "전라남도", subRegion: "나주시", subject: "영어", bio: "연세대학교 영어영문학과 재학 / 수능 및 내신 영어 1:1 완벽 관리", fee: 27000 },
    { id: 116, name: "소정인", region: "전라남도", subRegion: "나주시", subject: "생명과학, 화학", bio: "고려대학교 생명공학과 재학 / 생과/화학 개념부터 킬러 문제 마스터", fee: 26000 },
    { id: 117, name: "민경민", region: "전라남도", subRegion: "나주시", subject: "물리학, 지구과학", bio: "한양대학교 미래자동차공학과 재학 / 물리학 및 지구과학 원리 이해 중심 수업", fee: 25000 },
    { id: 118, name: "설수진", region: "전라남도", subRegion: "나주시", subject: "세계지리, 한국지리", bio: "경희대학교 지리학과 재학 / 세계지리/한국지리 요점 정리 핵심 노하우", fee: 23000 },
    { id: 119, name: "방도윤", region: "전라남도", subRegion: "나주시", subject: "경제학, 윤리와 사상", bio: "서울시립대학교 경제학과 재학 / 경제학 및 윤리와 사상 명품 강의", fee: 24000 },
    { id: 120, name: "제갈선", region: "전라남도", subRegion: "나주시", subject: "법과 정치, 생활과 윤리", bio: "동국대학교 법학과 재학 / 법과 정치 및 생활과 윤리 기출 완벽 분석", fee: 24000 },
    { id: 121, name: "나영우", region: "전라남도", subRegion: "나주시", subject: "파이썬, 수학", bio: "포항공과대학교 컴퓨터공학과 재학 / 실전 파이썬 및 고난도 수학 전문 튜터", fee: 35000 },
    { id: 122, name: "홍지우", region: "전라남도", subRegion: "나주시", subject: "영어", bio: "한국외대학교 영어교육과 재학 / 내신 영어 만점 대비 및 영어 기초 완성", fee: 26000 },
    { id: 123, name: "엄태호", region: "전라남도", subRegion: "나주시", subject: "수학, 화학", bio: "건국대학교 수의학과 재학 / 수능 수학/화학 상위권 도약을 위한 맞춤 수업", fee: 28000 },
    { id: 124, name: "변아름", region: "전라남도", subRegion: "나주시", subject: "미술", bio: "이화여자대학교 서양화과 재학 / 드로잉 실기 및 서양화 창의 미술 전문 지도", fee: 29000 }
];
const DEFAULT_APPLICATIONS = [
    // Direct requests
    { id: "app_1", name: "강지우", subject: "수학", region: "전라남도", subRegion: "나주시", status: "pending", tutorName: "정다원", type: "tutee" },
    { id: "app_2", name: "김민준", subject: "영어", region: "전라남도", subRegion: "나주시", status: "pending", tutorName: "최수현", type: "tutee" },
    { id: "app_3", name: "박서연", subject: "국어", region: "전라남도", subRegion: "나주시", status: "수락됨", tutorName: "최수현", type: "tutee" },
    
    // Regional public pool requests
    { id: "app_4", name: "이서준", subject: "물리학", region: "전라남도", subRegion: "나주시", status: "pending", tutorName: "", type: "tutee" },
    { id: "app_5", name: "정예은", subject: "화학", region: "전라남도", subRegion: "나주시", status: "pending", tutorName: "", type: "tutee" },
    { id: "app_6", name: "최도윤", subject: "생명과학", region: "전라남도", subRegion: "나주시", status: "pending", tutorName: "", type: "tutee" },
    { id: "app_7", name: "한지민", subject: "지구과학", region: "전라남도", subRegion: "나주시", status: "pending", tutorName: "", type: "tutee" },
    { id: "app_8", name: "임예준", subject: "수학", region: "전라남도", subRegion: "나주시", status: "pending", tutorName: "", type: "tutee" },
    { id: "app_9", name: "오윤아", subject: "영어", region: "전라남도", subRegion: "나주시", status: "pending", tutorName: "", type: "tutee" },
    { id: "app_10", name: "서우진", subject: "국어", region: "전라남도", subRegion: "나주시", status: "pending", tutorName: "", type: "tutee" }
];
const DEFAULT_REVIEWS = [
    { id: "rev_1", tutorName: "최수현", studentName: "박서연", rating: 5, text: "선생님께서 친절하게 국어 개념을 기초부터 쉽게 설명해주셔서 큰 도움이 되었습니다! 직접 요약해 주신 유인물 덕분에 혼자 복습할 때도 정말 편하고 좋았어요. 완전 강추합니다!" },
    { id: "rev_2", tutorName: "김선생", studentName: "홍길동", rating: 5, text: "수학의 핵심을 명확하게 짚어 주셔서 긴가민가하던 개념들이 완전히 제 지식이 되었습니다. 매시간 열정 가득한 명품 강의 감사합니다!" },
    { id: "rev_3", tutorName: "정다원", studentName: "임예준", rating: 5, text: "까다로운 기출문제 분석부터 오답노트 작성법까지 꼼꼼히 챙겨주셔서 수학 성적이 눈에 띄게 올랐습니다. 질문도 늘 성의 있게 답변해주셔서 감동했습니다." }
];
const DEFAULT_SUGGESTIONS = [];

function loadState() {
    currentUser = JSON.parse(sessionStorage.getItem('ct_currentUser')) || null;
}

function saveState() {
    if (currentUser) {
        sessionStorage.setItem('ct_currentUser', JSON.stringify(currentUser));
        if (db) {
            db.ref('users').child(currentUser.email.replace(/\./g, '_')).set(currentUser);
        }
    } else {
        sessionStorage.removeItem('ct_currentUser');
    }
}

function performOneTimeSeeding() {
    if (!db) return;
    
    // 1. Seed missing users or populate missing availability using a batch update
    db.ref('users').once('value').then(snapshot => {
        const val = snapshot.val() || {};
        const updates = {};
        let needsUpdate = false;
        
        // Add random availability to any existing user in Firebase who doesn't have it
        Object.keys(val).forEach(path => {
            const user = val[path];
            if ((user.role === 'tutor' || user.role === 'tutee') && (!user.availability || user.availability.length === 0)) {
                user.availability = generateRandomAvailability(user.role);
                updates[path] = user;
                needsUpdate = true;
            }
        });
        
        // Seed missing default users with pre-populated random availability
        DEFAULT_USERS.forEach(du => {
            const path = du.email.replace(/\./g, '_');
            if (!val[path]) {
                const seededUser = { ...du };
                if (seededUser.role === 'tutor') {
                    seededUser.certified = true;
                }
                updates[path] = seededUser;
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            db.ref('users').update(updates);
        }
    });
    
    // 2. Seed missing tutors using batch update
    db.ref('tutors').once('value').then(snapshot => {
        const val = snapshot.val() || {};
        const updates = {};
        let needsUpdate = false;
        
        DEFAULT_TUTORS.forEach(dt => {
            if (!val[dt.id]) {
                updates[dt.id] = dt;
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            db.ref('tutors').update(updates);
        }
    });

    // 3. Seed missing applications using batch update
    db.ref('applications').once('value').then(snapshot => {
        const val = snapshot.val() || {};
        const updates = {};
        let needsUpdate = false;
        
        DEFAULT_APPLICATIONS.forEach(da => {
            if (!val[da.id]) {
                updates[da.id] = da;
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            db.ref('applications').update(updates);
        }
    });

    // 4. Seed missing reviews using batch update
    db.ref('reviews').once('value').then(snapshot => {
        const val = snapshot.val() || {};
        const updates = {};
        let needsUpdate = false;
        
        DEFAULT_REVIEWS.forEach(dr => {
            if (!val[dr.id]) {
                updates[dr.id] = dr;
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            db.ref('reviews').update(updates);
        }
    });

    // 5. Seed default notice if notices node is completely empty
    db.ref('notices').once('value').then(snapshot => {
        const val = snapshot.val();
        if (!val) {
            const defaultNotice = {
                id: "notice_default",
                title: "🎉 대학생 1:1 전문 과외 매칭 플랫폼 캠퍼스튜터 오픈 안내",
                content: "안녕하세요, 캠퍼스튜터 운영진입니다!\n\n학생과 선생님이 언제 어디서나 신뢰하고 비대면/대면 매칭 및 1:1 실시간 채팅을 진행할 수 있는 캠퍼스튜터 플랫폼이 공식 오픈하였습니다.\n건의사항이나 제안이 있으실 경우 마이페이지의 건의사항 탭을 적극 이용해 주시기 바랍니다.\n\n감사합니다.",
                timestamp: Date.now()
            };
            db.ref('notices').child(defaultNotice.id).set(defaultNotice);
        }
    });
}

// Initialize Firebase & setup Real-time database synchronizers
function initFirebase() {
    if (typeof firebase !== 'undefined' && !db) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        
        // Safe one-time seeding
        performOneTimeSeeding();
        
        // 1. Sync Users
        db.ref('users').on('value', (snapshot) => {
            const val = snapshot.val();
            if (val) {
                users = Object.values(val).map(u => ({ ...u, status: u.status || 'active' }));
            } else {
                users = [];
            }
            if (currentUser) {
                const matched = users.find(u => u.email === currentUser.email);
                if (matched) currentUser = matched;
            }
            if (currentUser) {
                if (currentUser.role === 'admin') {
                    refreshAdminConsole();
                } else {
                    updateDashboard();
                    updateMyPage();
                }
            }
        });

        // 2. Sync Tutors
        db.ref('tutors').on('value', (snapshot) => {
            const val = snapshot.val();
            tutors = val ? Object.values(val) : [];
            if (currentUser) updateDashboard();
        });

        // 3. Sync Applications (Matched Requests)
        db.ref('applications').on('value', (snapshot) => {
            const val = snapshot.val();
            const oldApplications = [...applications];
            
            applications = val ? Object.values(val) : [];
            
            // Check state diffs to update real-time states without browser alerts
            if (currentUser) {
                
                if (currentUser.role === 'admin') {
                    refreshAdminConsole();
                } else {
                    updateDashboard();
                    updateTutoringList();
                    initUnreadCounters();
                }
            }
        });

        // 4. Sync Reviews
        db.ref('reviews').on('value', (snapshot) => {
            const val = snapshot.val();
            reviews = val ? Object.entries(val).map(([key, v]) => ({ id: key, ...v })) : [];
            if (currentUser) {
                if (currentUser.role === 'admin') {
                    renderAdminReviewManagement();
                } else {
                    updateReviewList();
                    updateDashboard();
                }
            }
        });

        // 5. Sync Suggestions
        db.ref('suggestions').on('value', (snapshot) => {
            const val = snapshot.val();
            suggestions = val ? Object.values(val) : [];
            if (currentUser) {
                if (currentUser.role === 'admin') {
                    renderAdminSuggestions();
                    renderAdminDashboardStats();
                } else {
                    updateSuggestionsList();
                }
            }
        });

        // 5.5 Sync Certifications
        db.ref('certifications').on('value', (snapshot) => {
            const val = snapshot.val();
            certifications = val ? Object.values(val) : [];
            if (currentUser) {
                if (currentUser.role === 'admin') {
                    renderAdminCerts();
                } else if (currentUser.role === 'tutor') {
                    updateTutorCertBox();
                }
            }
        });

        // 6. Sync Notifications
        if (currentUser) {
            setupNotificationSync();
        }

        // 7. Sync Notices
        db.ref('notices').on('value', (snapshot) => {
            const val = snapshot.val();
            let list = [];
            if (val) {
                list = Object.values(val).sort((a, b) => b.timestamp - a.timestamp);
            }
            renderHomeNotices(list);
            if (currentUser && currentUser.role === 'admin') {
                updateAdminNoticesList(list);
            }
        });
    }
}

// Load initial currentUser immediately
loadState();

const regionData = {
    "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
    "부산광역시": ["강서구", "금정구", "남구", "동구", "동래구", "북구", "부산진구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구", "기장군"],
    "대구광역시": ["남구", "달서구", "동구", "북구", "서구", "수성구", "중구", "달성군", "군위군"],
    "인천광역시": ["계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "중구", "강화군", "옹진군"],
    "광주광역시": ["광산구", "남구", "동구", "북구", "서구"],
    "대전광역시": ["대덕구", "동구", "서구", "유성구", "중구"],
    "울산광역시": ["남구", "동구", "북구", "중구", "울주군"],
    "세종특별자치시": ["세종시"],
    "경기도": ["수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시", "화성시", "평택시", "의정부시", "시흥시", "파주시", "광명시", "김포시", "군포시", "광주시", "이천시", "양주시", "오산시", "구리시", "안성시", "의왕시", "하남시", "포천시", "양평군", "여주시", "동두천시", "가평군", "연천군"],
    "강원특별자치도": ["춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시", "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군", "양구군", "인제군", "고성군", "양양군"],
    "충청북도": ["청주시", "충주시", "제천시", "보은군", "옥천군", "영동군", "증평군", "진천군", "괴산군", "음성군", "단양군"],
    "충청남도": ["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "금산군", "부여군", "서천군", "청양군", "홍성군", "예산군", "태안군"],
    "전북특별자치도": ["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군"],
    "전라남도": ["목포시", "여수시", "순천시", "나주시", "광양시", "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군", "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군", "완도군", "진도군", "신안군"],
    "경상북도": ["포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "의성군", "청송군", "영양군", "영덕군", "청도군", "고령군", "성주군", "칠곡군", "예천군", "봉화군", "울진군", "울릉군"],
    "경상남도": ["창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "의령군", "함안군", "창녕군", "고성군", "남해군", "하동군", "산청군", "함양군", "거창군", "합천군"],
    "제주특별자치도": ["제주시", "서귀포시"]
};

function updateSubRegions(prefix) {
    const region = document.getElementById(`${prefix}-region`).value;
    const subRegionSelect = document.getElementById(`${prefix}-sub-region`);
    subRegionSelect.innerHTML = '<option value="">구/군을 선택하세요</option>';
    if (regionData[region]) {
        regionData[region].forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            subRegionSelect.appendChild(opt);
        });
    }
}

function showSection(id) {
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    document.getElementById(`section-${id}`).style.display = 'block';
    if (id === 'mypage') updateMyPage();
}

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openAuthModal() { openModal('authModal'); }
function closeAuthModal() { closeModal('authModal'); }

function toggleAuth(type) {
    document.getElementById('login-form-container').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('signup-tutor-container').style.display = type === 'signup-tutor' ? 'block' : 'none';
    document.getElementById('signup-tutee-container').style.display = type === 'signup-tutee' ? 'block' : 'none';
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) { alert('로그인 실패'); return; }
    if (user.status === 'suspended') {
        alert('🚫 정지된 계정입니다. 관리자(help@campustutor.com)에게 문의하세요.');
        return;
    }

    currentUser = user;
    saveState();
    updateNavigationUI();
    
    if (currentUser.role !== 'admin') {
        initUnreadCounters();
        setupNotificationSync();
    }
    updateHomeHero();
    closeAuthModal();
}

function handleSignup(role, event) {
    event.preventDefault();
    let email = role === 'tutor' ? document.getElementById('tutor-email').value : document.getElementById('tutee-email').value;
    
    // 중복 이메일 체크
    if (users.find(u => u.email === email)) {
        alert('이미 사용 중인 이메일입니다.');
        return;
    }

    // 비밀번호 일치 확인
    const password = role === 'tutor' ? document.getElementById('tutor-password').value : document.getElementById('tutee-password').value;
    const passwordConfirm = role === 'tutor' ? document.getElementById('tutor-password-confirm').value : document.getElementById('tutee-password-confirm').value;
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    let userData = {};
    if (role === 'tutor') {
        const checkedSubjects = Array.from(document.querySelectorAll('input[name="subject"]:checked')).map(cb => cb.value);
        if (checkedSubjects.length === 0 || checkedSubjects.length > 3) {
            alert('주력 과목을 1개 이상 3개 이하로 선택해주세요.');
            return;
        }
        
        userData = {
            email: email,
            password: password,
            name: document.getElementById('tutor-name').value,
            univ: document.getElementById('tutor-univ').value,
            fee: document.getElementById('tutor-fee').value,
            spec: document.getElementById('tutor-spec').value,
            region: document.getElementById('tutor-region').value,
            subRegion: document.getElementById('tutor-sub-region').value,
            subjects: checkedSubjects
        };
        
        if (db) {
            const tutorId = "tut_" + Date.now();
            db.ref('tutors').child(tutorId).set({
                id: tutorId,
                name: userData.name,
                region: document.getElementById('tutor-region').value,
                subRegion: document.getElementById('tutor-sub-region').value,
                subject: userData.subjects.join(', '),
                bio: userData.spec,
                fee: parseInt(userData.fee) || 20000
            });
        }
    } else {
        userData = {
            email: email,
            password: password,
            name: document.getElementById('tutee-name').value,
            age: document.getElementById('tutee-age').value,
            region: document.getElementById('tutee-region').value,
            subRegion: document.getElementById('tutee-sub-region').value,
            school: document.getElementById('tutee-school').value
        };
    }

    if (db) {
        db.ref('users').child(email.replace(/\./g, '_')).set({ ...userData, role, points: 0, status: 'active' });
    }
    
    alert('가입 완료');
    toggleAuth('login');
}

function handleLogout() {
    if (activeNotifRef) {
        activeNotifRef.off();
        activeNotifRef = null;
    }
    currentUser = null;
    saveState();
    updateNavigationUI();
    closeNotificationPanel();
    updateHomeHero();
}

function resetWithdrawFields() {
    const checkbox = document.getElementById('withdraw-confirm-checkbox');
    const passwordInput = document.getElementById('withdraw-password-input');
    if (checkbox) checkbox.checked = false;
    if (passwordInput) passwordInput.value = '';
}

function executeWithdraw(event) {
    event.preventDefault();
    
    const checkbox = document.getElementById('withdraw-confirm-checkbox');
    const passwordInput = document.getElementById('withdraw-password-input');
    
    if (!checkbox || !checkbox.checked) {
        alert('안내 사항 확인 체크박스에 동의해 주세요.');
        return;
    }
    
    if (!passwordInput || passwordInput.value !== currentUser.password) {
        alert('비밀번호가 올바르지 않습니다.');
        return;
    }
    
    if (!confirm('정말 탈퇴하시겠습니까? 탈퇴 시 모든 정보가 완전히 삭제됩니다.')) {
        return;
    }
    
    if (db) {
        db.ref('users').child(currentUser.email.replace(/\./g, '_')).remove();
        if (currentUser.role === 'tutor') {
            const t = tutors.find(x => x.name === currentUser.name);
            if (t) db.ref('tutors').child(t.id).remove();
        }
    }
    
    alert('회원 탈퇴가 안전하게 처리되었습니다. 그동안 CampusTutor 서비스를 이용해 주셔서 대단히 감사합니다.');
    handleLogout();
}

// MyPage Logic
function switchMyPageTab(tabName) {
    document.querySelectorAll('.tab-panel').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    // 이벤트 객체는 전역에서 전달되거나 별도 처리가 필요할 수 있어 탭 이름과 매칭되는 버튼에 클래스 추가
    document.querySelectorAll('.menu-item').forEach(m => {
        if(m.textContent.includes(
            tabName === 'profile' ? '프로필' : 
            tabName === 'tutoring' ? '수업' : 
            tabName === 'reviews' ? '후기' : 
            tabName === 'suggestion' ? '건의사항' : 
            tabName === 'withdraw' ? '탈퇴' : '회원 탈퇴'
        )) {
            m.classList.add('active');
        }
    });
    
    if (tabName === 'tutoring') updateTutoringList();
    if (tabName === 'reviews') updateReviewList();
    if (tabName === 'withdraw') resetWithdrawFields();
    if (tabName === 'suggestion') {
        resetSuggestionForm();
        updateSuggestionsList();
    }
}

function updateMyPage() {
    document.getElementById('sidebar-name').innerText = currentUser.name;
    document.getElementById('sidebar-role').innerText = currentUser.role === 'tutor' ? '선생님' : '학생';
    
    const display = document.getElementById('profile-info-display');
    if (display) {
        if (currentUser.role === 'tutor') {
            display.innerHTML = `
                <div class="profile-display-grid">
                    <div class="info-row"><strong>이메일</strong> <span>${currentUser.email}</span></div>
                    <div class="info-row"><strong>이름</strong> <span>${currentUser.name}</span></div>
                    <div class="info-row"><strong>역할</strong> <span>선생님</span></div>
                    <div class="info-row"><strong>대학교 및 전공</strong> <span>${currentUser.univ || '미입력'}</span></div>
                    <div class="info-row"><strong>희망 시급</strong> <span>${currentUser.fee ? parseInt(currentUser.fee).toLocaleString() + '원' : '미입력'}</span></div>
                    <div class="info-row"><strong>스펙/경력</strong> <span>${currentUser.spec || '미입력'}</span></div>
                    <div class="info-row"><strong>거주 지역</strong> <span>${currentUser.region} ${currentUser.subRegion || ''}</span></div>
                    <div class="info-row"><strong>주력 과목</strong> <span>${currentUser.subjects ? currentUser.subjects.join(', ') : '미입력'}</span></div>
                </div>
            `;
        } else {
            display.innerHTML = `
                <div class="profile-display-grid">
                    <div class="info-row"><strong>이메일</strong> <span>${currentUser.email}</span></div>
                    <div class="info-row"><strong>이름</strong> <span>${currentUser.name}</span></div>
                    <div class="info-row"><strong>역할</strong> <span>학생</span></div>
                    <div class="info-row"><strong>나이</strong> <span>${currentUser.age ? currentUser.age + '세' : '미입력'}</span></div>
                    <div class="info-row"><strong>거주 지역</strong> <span>${currentUser.region} ${currentUser.subRegion || ''}</span></div>
                    <div class="info-row"><strong>학교</strong> <span>${currentUser.school || '미입력'}</span></div>
                </div>
            `;
        }
    }
    
    const certBox = document.getElementById('tutor-cert-box');
    if (certBox) {
        if (currentUser.role === 'tutor') {
            certBox.style.display = 'block';
            updateTutorCertBox();
        } else {
            certBox.style.display = 'none';
        }
    }
}

function updateTutoringList() {
    const list = document.getElementById('my-tutoring-list');
    if (currentUser.role === 'tutor') {
        const myApps = applications.filter(a => {
            const isAccepted = a.status === '수락됨' || a.status === 'accepted';
            const appTutorName = a.tutorName ? a.tutorName.trim() : '';
            const currentTutorName = currentUser.name ? currentUser.name.trim() : '';
            
            if (isAccepted) {
                return appTutorName === currentTutorName;
            } else {
                const isDirectRequest = appTutorName === currentTutorName;
                const hasSentProposal = (!a.tutorName || a.tutorName === '') && a.proposals && a.proposals[currentUser.name.replace(/\s+/g, '_')];
                return isDirectRequest || hasSentProposal;
            }
        });

        // Group accepted tutor matches by student for MyPage Tutoring tab
        const pendingApps = myApps.filter(a => a.status === 'pending');
        const acceptedApps = myApps.filter(a => a.status === '수락됨' || a.status === 'accepted');
        
        const groupedAccepted = {};
        acceptedApps.forEach(a => {
            const studentNameKey = a.name ? a.name.trim() : '';
            if (!groupedAccepted[studentNameKey]) {
                groupedAccepted[studentNameKey] = {
                    ...a,
                    name: studentNameKey,
                    subjects: [a.subject]
                };
            } else {
                if (!groupedAccepted[studentNameKey].subjects.includes(a.subject)) {
                    groupedAccepted[studentNameKey].subjects.push(a.subject);
                }
            }
        });
        
        const finalAccepted = Object.values(groupedAccepted).map(g => ({
            ...g,
            subject: g.subjects.join(', ')
        }));
        
        const finalApps = [...pendingApps, ...finalAccepted];

        list.innerHTML = finalApps.length ? finalApps.map(a => {
            const roomId = `campustutor_chat_${a.name.trim()}_${currentUser.name.trim()}`.replace(/\s+/g, '_');
            const unread = unreadCounts[roomId] || 0;
            const badgeHtml = unread > 0 ? `<span class="chat-badge" style="background:#ef4444; color:white; font-size:0.75rem; font-weight:700; padding:0.15rem 0.45rem; border-radius:10px; margin-left:6px; vertical-align:middle; line-height:1; display:inline-flex; align-items:center; justify-content:center;">${unread}</span>` : '';
            const hasProposed = a.proposals && a.proposals[currentUser.name.replace(/\s+/g, '_')];
            const isDirectRequest = a.tutorName && a.tutorName.trim() === currentUser.name.trim() && a.status === 'pending';
            
            return `
                <div class="match-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box;">
                    <div>
                        <h3>${a.name} 학생</h3>
                        <p>과목: ${a.subject}</p>
                        <p>상태: <span class="tag">${isDirectRequest ? '직접 수업요청' : (hasProposed ? '역제안 보냄' : a.status)}</span></p>
                    </div>
                    <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
                        ${a.status === 'pending' ? `
                            ${isDirectRequest
                                ? `<button class="btn primary" onclick="acceptOffer('${a.id}')" style="width:100%; margin:0; background:var(--secondary); display:flex; align-items:center; justify-content:center; gap:6px;"><i class="fas fa-check"></i> 수업 신청 수락하기</button>`
                                : (hasProposed 
                                    ? `<button class="btn secondary" style="width:100%; margin:0; background:#e2e8f0; color:#94a3b8; cursor:not-allowed; border:none; display:flex; align-items:center; justify-content:center; gap:4px;" disabled><i class="fas fa-check-circle" style="color:#94a3b8;"></i>제안 완료 (대기 중)</button>`
                                    : `<button class="btn primary" onclick="openTutorProposalModal('${a.id}')" style="width:100%; margin:0; background:var(--primary); display:flex; align-items:center; justify-content:center; gap:6px;"><i class="fas fa-paper-plane"></i>과외 역제안하기</button>`
                                  )
                            }
                        ` : ''}
                        ${a.status === '수락됨' || a.status === 'accepted' ? `<button class="btn primary" onclick="openChatRoom('${a.name}', '${currentUser.name}')" style="width:100%; margin:0; background:var(--secondary); display:flex; align-items:center; justify-content:center; gap:6px;"><i class="fas fa-comments"></i> 1:1 채팅 ${badgeHtml}</button>` : ''}
                        <button class="btn secondary" onclick="openDeleteTutoringModal('${a.id}')" style="width:100%; margin:0; color: #ef4444; background: #fef2f2; border: 1px solid #fecdd3; display:flex; align-items:center; justify-content:center; gap:6px;"><i class="fas fa-trash-alt"></i> ${isDirectRequest ? '요청 거절하기' : '요청 삭제하기'}</button>
                    </div>
                </div>
            `;
        }).join('') : '<p>관리 중인 수업이 없습니다.</p>';
    } else {
        const myApps = applications.filter(a => a.name === currentUser.name);

        const pendingApps = myApps.filter(a => a.status === 'pending');
        const acceptedApps = myApps.filter(a => a.status === '수락됨' || a.status === 'accepted');
        
        const groupedAccepted = {};
        acceptedApps.forEach(a => {
            const targetTutor = a.tutorName || (a.subject.includes('수학') || a.subject.includes('결정') ? '김선생' : '이튜터');
            if (!groupedAccepted[targetTutor]) {
                groupedAccepted[targetTutor] = {
                    ...a,
                    tutorName: targetTutor,
                    subjects: [a.subject]
                };
            } else {
                if (!groupedAccepted[targetTutor].subjects.includes(a.subject)) {
                    groupedAccepted[targetTutor].subjects.push(a.subject);
                }
            }
        });
        
        const finalAccepted = Object.values(groupedAccepted).map(g => ({
            ...g,
            subject: g.subjects.join(', ')
        }));
        
        const finalApps = [...pendingApps, ...finalAccepted];

        list.innerHTML = finalApps.length ? finalApps.map(a => {
            const isAccepted = a.status === '수락됨' || a.status === 'accepted';
            const isPublicRequest = !a.tutorName && a.status === 'pending';
            const targetTutor = a.tutorName || (a.subject.includes('수학') || a.subject.includes('결정') ? '김선생' : '이튜터');
            const cardTitle = isPublicRequest ? `공개 과외 요청` : `지원 과외 (${targetTutor} 선생님)`;
            const roomId = `campustutor_chat_${currentUser.name.trim()}_${targetTutor.trim()}`.replace(/\s+/g, '_');
            const unread = unreadCounts[roomId] || 0;
            const badgeHtml = unread > 0 ? `<span class="chat-badge" style="background:#ef4444; color:white; font-size:0.75rem; font-weight:700; padding:0.15rem 0.45rem; border-radius:10px; margin-left:6px; vertical-align:middle; line-height:1; display:inline-flex; align-items:center; justify-content:center;">${unread}</span>` : '';
            
            const proposalsCount = a.proposals ? Object.keys(a.proposals).length : 0;
            
            return `
                <div class="match-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box;">
                    <div>
                        <h3>${cardTitle}</h3>
                        <p>과목: ${a.subject}</p>
                        <p>상태: <span class="tag">${a.status}</span></p>
                        ${a.request ? `<p style="font-size:0.85rem; color:#475569; margin: 0.4rem 0; background: #f8fafc; padding: 0.4rem; border-radius: 6px; border: 1px solid #e2e8f0; text-align: left;"><strong>요청사항:</strong> ${a.request}</p>` : ''}
                    </div>
                    <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
                        ${isPublicRequest ? `
                            <button class="btn primary" onclick="openViewProposalsModal('${a.id}')" style="width:100%; margin:0; background:var(--secondary); display:flex; align-items:center; justify-content:center; gap:6px; font-weight:700;">
                                <i class="fas fa-users-cog"></i> 받은 선생님 제안 보기 (${proposalsCount}개)
                            </button>
                        ` : ''}
                        ${isAccepted ? `
                            <div style="display:flex; gap:0.5rem; margin:0; width: 100%;">
                                <button class="btn primary" onclick="openChatRoom('${currentUser.name}', '${targetTutor}')" style="flex:1; margin:0; background:var(--secondary); font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:4px;"><i class="fas fa-comments"></i> 1:1 채팅 ${badgeHtml}</button>
                                <button class="btn secondary" onclick="openReviewModal('${targetTutor}')" style="flex:1; margin:0; font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:4px;"><i class="fas fa-star"></i> 후기 쓰기</button>
                            </div>
                        ` : ''}
                        <button class="btn secondary" onclick="openDeleteTutoringModal('${a.id}')" style="width:100%; margin:0; color: #ef4444; background: #fef2f2; border: 1px solid #fecdd3; display:flex; align-items:center; justify-content:center; gap:6px;"><i class="fas fa-trash-alt"></i> 요청 삭제하기</button>
                    </div>
                </div>
            `;
        }).join('') : '<p>신청한 과외가 없습니다.</p>';
    }
}

let targetAppIdToDelete = null;

function openDeleteTutoringModal(appId) {
    targetAppIdToDelete = appId;
    const checkbox = document.getElementById('delete-confirm-checkbox');
    if (checkbox) checkbox.checked = false;
    openModal('deleteTutoringModal');
}

function executeDeleteTutoring() {
    const checkbox = document.getElementById('delete-confirm-checkbox');
    if (!checkbox || !checkbox.checked) {
        alert('안내 사항 동의 체크박스에 체크해야 삭제가 가능합니다.');
        return;
    }
    
    if (db && targetAppIdToDelete) {
        const targetApp = applications.find(x => x.id == targetAppIdToDelete);
        if (targetApp && (targetApp.status === '수락됨' || targetApp.status === 'accepted')) {
            const matchingApps = applications.filter(x => 
                x.name === targetApp.name && 
                x.tutorName === targetApp.tutorName && 
                (x.status === '수락됨' || x.status === 'accepted')
            );
            const deletePromises = matchingApps.map(x => db.ref('applications').child(x.id.toString()).remove());
            Promise.all(deletePromises).then(() => {
                alert('해당 수업이 완전히 삭제되었습니다.');
                closeModal('deleteTutoringModal');
                updateTutoringList();
                updateDashboard();
            });
        } else {
            db.ref('applications').child(targetAppIdToDelete.toString()).remove();
            alert('해당 요청이 완전히 삭제되었습니다.');
            closeModal('deleteTutoringModal');
            updateTutoringList();
            updateDashboard();
        }
    }
}

function updateReviewList() {
    const list = document.getElementById('my-reviews-list');
    if (currentUser.role === 'tutor') {
        const myReviews = reviews.filter(r => r.tutorName === currentUser.name);
        list.innerHTML = myReviews.length ? myReviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <strong>${r.studentName} 학생</strong>
                    <span class="review-rating">${'⭐'.repeat(r.rating)}</span>
                </div>
                <p class="review-text" style="white-space: pre-wrap; text-align: left;">${r.text}</p>
            </div>
        `).join('') : '<p>받은 후기가 없습니다.</p>';
    } else {
        const myReviews = reviews.filter(r => r.studentName === currentUser.name);
        list.innerHTML = myReviews.length ? myReviews.map(r => `
            <div class="review-card" style="position: relative;">
                <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong>${r.tutorName} 선생님</strong>
                    <span class="review-rating" style="color: #fbbf24;">${'⭐'.repeat(r.rating)}</span>
                </div>
                <p class="review-text" style="white-space: pre-wrap; text-align: left; margin-bottom: 1rem; color: #475569;">${r.text}</p>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn secondary" onclick="openEditReviewModal('${r.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; font-weight: 700; margin: 0; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;"><i class="fas fa-edit"></i> 수정</button>
                    <button class="btn secondary" onclick="deleteReview('${r.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; font-weight: 700; color: #ef4444; background: #fee2e2; border: 1px solid #fecdd3; margin: 0; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;"><i class="fas fa-trash-alt"></i> 삭제</button>
                </div>
            </div>
        `).join('') : '<p>작성한 후기가 없습니다.</p>';
    }
}


// Review System
let targetTutorForReview = null;

function openReviewModal(tutorName) {
    targetTutorForReview = tutorName;
    document.getElementById('review-tutor-info').innerText = `${tutorName} 선생님에 대한 후기를 작성해주세요.`;
    openModal('reviewModal');
}

function submitReview() {
    const rating = parseInt(document.getElementById('review-rating').value);
    const text = document.getElementById('review-text').value;
    
    if (!text) { alert('내용을 입력해주세요.'); return; }
    
    if (db) {
        const reviewId = "rev_" + Date.now();
        db.ref('reviews').child(reviewId).set({
            id: reviewId,
            tutorName: targetTutorForReview,
            studentName: currentUser.name,
            rating: rating,
            text: text
        });
    }
    
    alert('후기가 등록되었습니다!');
    closeModal('reviewModal');
    document.getElementById('review-text').value = '';
}

let editingReviewId = null;

function openEditReviewModal(reviewId) {
    const r = reviews.find(x => x.id === reviewId);
    if (!r) return;
    editingReviewId = reviewId;
    document.getElementById('edit-review-tutor-info').innerText = `${r.tutorName} 선생님에 대한 후기를 수정합니다.`;
    document.getElementById('edit-review-rating').value = r.rating;
    document.getElementById('edit-review-text').value = r.text;
    openModal('editReviewModal');
}

function submitEditReview() {
    if (!editingReviewId) return;
    const rating = parseInt(document.getElementById('edit-review-rating').value);
    const text = document.getElementById('edit-review-text').value;
    
    if (!text) { alert('내용을 입력해주세요.'); return; }
    
    if (db) {
        db.ref('reviews').child(editingReviewId).update({
            rating: rating,
            text: text
        }).then(() => {
            alert('후기가 수정되었습니다!');
            closeModal('editReviewModal');
            updateReviewList();
        });
    }
}

function deleteReview(reviewId) {
    if (!confirm('정말 이 후기를 삭제하시겠습니까?')) return;
    if (db) {
        db.ref('reviews').child(reviewId).remove().then(() => {
            alert('후기가 삭제되었습니다.');
            updateReviewList();
        });
    }
}

function openViewReviewsModal(tutorName) {
    const tutorReviews = reviews.filter(r => r.tutorName === tutorName);
    
    document.getElementById('view-reviews-title').innerText = `${tutorName} 선생님 후기 목록`;
    
    const summaryDiv = document.getElementById('view-reviews-summary');
    const listDiv = document.getElementById('view-reviews-list');
    
    if (tutorReviews.length === 0) {
        summaryDiv.innerHTML = `
            <div style="font-weight: 700; color: #64748b;"><i class="far fa-star"></i> 아직 작성된 후기가 없습니다.</div>
        `;
        listDiv.innerHTML = `
            <div class="empty-state" style="padding: 2rem 0; text-align: center; border: none; box-shadow: none;">
                <p style="color: var(--text-muted); font-weight: 500;">첫 번째 후기의 주인공이 되어보세요!</p>
            </div>
        `;
    } else {
        const avg = (tutorReviews.reduce((sum, r) => sum + r.rating, 0) / tutorReviews.length).toFixed(1);
        summaryDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.8rem; font-weight: 800; color: #f59e0b; display: flex; align-items: center; gap: 4px;"><i class="fas fa-star"></i> ${avg}</span>
                <span style="font-size: 0.95rem; color: #475569; font-weight: 600;">전체 평점</span>
            </div>
            <div style="font-size: 0.95rem; color: #475569; font-weight: 600;">
                총 <span style="color: var(--secondary); font-weight: 700;">${tutorReviews.length}개</span>의 후기
            </div>
        `;
        
        listDiv.innerHTML = tutorReviews.map(r => `
            <div class="review-card" style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 12px; background: #ffffff;">
                <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="color: var(--text-main);">${r.studentName} 학생</strong>
                    <span class="review-rating" style="color: #fbbf24;">${'⭐'.repeat(r.rating)}</span>
                </div>
                <p class="review-text" style="margin: 0; font-size: 0.95rem; line-height: 1.5; color: #475569; white-space: pre-wrap; text-align: left;">${r.text}</p>
            </div>
        `).join('');
    }
    
    openModal('viewReviewsModal');
}

let selectedSubjectFilter = 'all';

function handleSubjectFilterChange(value) {
    selectedSubjectFilter = value;
    updateDashboard();
}

let selectedMainCategory = 'all';
let selectedSubCategory = 'all';

function selectMainCategory(cat) {
    selectedMainCategory = cat;
    selectedSubCategory = 'all'; // Reset subcategory on main change
    updateDashboard();
}

function selectSubCategory(sub) {
    selectedSubCategory = sub;
    updateDashboard();
}

// Dashboard Update
function updateDashboard() {
    const list = document.getElementById('match-list');
    const welcome = document.getElementById('tutor-welcome');
    welcome.innerText = `${currentUser.name}님, 환영합니다!`;
    
    if (currentUser.role === 'tutor') {
        let matches = applications.filter(app => {
            const isAccepted = app.status === '수락됨' || app.status === 'accepted';
            const appTutorName = app.tutorName ? app.tutorName.trim() : '';
            const currentTutorName = currentUser.name ? currentUser.name.trim() : '';
            if (isAccepted) {
                return appTutorName === currentTutorName;
            } else {
                return (appTutorName === currentTutorName) || (!app.tutorName && app.region === currentUser.region);
            }
        });
        
        // Group accepted tutor matches by student
        const pendingMatches = matches.filter(m => m.status === 'pending');
        const acceptedMatches = matches.filter(m => m.status === '수락됨' || m.status === 'accepted');
        
        const groupedAccepted = {};
        acceptedMatches.forEach(m => {
            const studentNameKey = m.name ? m.name.trim() : '';
            if (!groupedAccepted[studentNameKey]) {
                groupedAccepted[studentNameKey] = {
                    ...m,
                    name: studentNameKey,
                    subjects: [m.subject],
                    requests: m.request ? [m.request] : []
                };
            } else {
                if (!groupedAccepted[studentNameKey].subjects.includes(m.subject)) {
                    groupedAccepted[studentNameKey].subjects.push(m.subject);
                }
                if (m.request && !groupedAccepted[studentNameKey].requests.includes(m.request)) {
                    groupedAccepted[studentNameKey].requests.push(m.request);
                }
            }
        });
        
        const finalAccepted = Object.values(groupedAccepted).map(g => ({
            ...g,
            subject: g.subjects.join(', '),
            request: g.requests.join(' | ')
        }));
        
        // Only filter the pending/recommended matches by subject
        let filteredPending = [...pendingMatches];
        if (selectedSubjectFilter !== 'all') {
            filteredPending = filteredPending.filter(app => app.subject.includes(selectedSubjectFilter));
        }
        
        list.innerHTML = `
            <div class="tutor-dashboard-container">
                <div class="tutor-content" style="width:100%; display:flex; flex-direction:column; gap:2.5rem; margin-top:0.5rem;">
                    <!-- Currently Enrolled Students (수강 중인 학생) -->
                    ${finalAccepted.length ? `
                        <div class="enrolled-students-section" style="width:100%; margin-bottom: 1.5rem;">
                            <h3 style="margin-bottom:1rem; display:flex; align-items:center; gap:8px;"><i class="fas fa-graduation-cap" style="color:var(--primary);"></i>현재 수강 중인 학생</h3>
                            <div class="match-grid" style="margin: 0;">
                                ${finalAccepted.map(app => {
                                    const roomId = `campustutor_chat_${app.name.trim()}_${currentUser.name.trim()}`.replace(/\s+/g, '_');
                                    const unread = unreadCounts[roomId] || 0;
                                    const badgeHtml = unread > 0 ? `<span class="chat-badge" style="background:#ef4444; color:white; font-size:0.75rem; font-weight:700; padding:0.15rem 0.45rem; border-radius:10px; margin-left:6px; vertical-align:middle; line-height:1; display:inline-flex; align-items:center; justify-content:center;">${unread}</span>` : '';
                                    
                                    return `
                                        <div class="match-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%; border: 1px solid #d1fae5; background: #f0fdf4;">
                                            <div>
                                                <div style="display:flex; justify-content:space-between; align-items:start;">
                                                    <h3 style="margin-top:0; color:#065f46;">${app.name} 학생 (${app.subRegion || '지역 미정'})</h3>
                                                    <span class="tag" style="background:#d1fae5; color:#065f46; font-weight:600;">수강 중</span>
                                                </div>
                                                <p style="margin: 0.5rem 0; color:#047857;"><strong>과목:</strong> ${app.subject}</p>
                                                ${app.request ? `<p style="font-size:0.9rem; color:#065f46; margin: 0.5rem 0; line-height: 1.4; background: #e6fbf1; padding: 0.5rem; border-radius: 6px; border: 1px solid #a7f3d0; text-align: left;"><strong>요청사항:</strong> ${app.request}</p>` : ''}
                                            </div>
                                            <div>
                                                <button class="btn primary" onclick="openChatRoom('${app.name}', '${currentUser.name}')" style="width:100%; margin-top:1.5rem; background:#059669; display:flex; align-items:center; justify-content:center; gap:6px;"><i class="fas fa-comments"></i> 1:1 채팅 ${badgeHtml}</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Recommended Students & Requests (추천 학생 및 과외 요청) -->
                    <div class="recommended-students-section" style="width:100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                            <h3 style="margin:0; display:flex; align-items:center; gap:8px;"><i class="fas fa-search" style="color:var(--secondary);"></i>추천 학생 및 과외 요청</h3>
                            
                            <div class="filter-wrapper" style="display: flex; align-items: center; gap: 10px; background: white; padding: 0.4rem 1rem; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: var(--shadow-sm);">
                                <i class="fas fa-filter" style="color: var(--primary); font-size: 0.85rem;"></i>
                                <span style="font-weight: 700; color: var(--text-main); font-size: 0.85rem;">과목 필터:</span>
                                <select id="subject-filter-select" onchange="handleSubjectFilterChange(this.value)" style="padding: 0.25rem 0.5rem; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-weight: 600; font-size: 0.85rem; cursor: pointer; color: var(--text-main); outline: none;">
                                    <option value="all">전체보기</option>
                                    <option value="국어">국어</option>
                                    <option value="영어">영어</option>
                                    <option value="수학">수학</option>
                                    <option value="물리학">물리학</option>
                                    <option value="화학">화학</option>
                                    <option value="생명과학">생명과학</option>
                                    <option value="지구과학">지구과학</option>
                                    <option value="세계지리">세계지리</option>
                                    <option value="한국지리">한국지리</option>
                                    <option value="경제학">경제학</option>
                                    <option value="법과 정치">법과 정치</option>
                                    <option value="윤리와 사상">윤리와 사상</option>
                                    <option value="생활과 윤리">생활과 윤리</option>
                                    <option value="파이썬">파이썬</option>
                                    <option value="미술">미술</option>
                                    <option value="음악">음악</option>
                                </select>
                            </div>
                        </div>
                        
                        ${filteredPending.length ? `
                            <div class="match-grid" style="margin: 0;">
                                ${filteredPending.map(app => {
                                    const hasProposed = app.proposals && app.proposals[currentUser.name.replace(/\s+/g, '_')];
                                    
                                    return `
                                        <div class="match-card" style="display:flex; flex-direction:column; justify-content:space-between; min-height: 280px; box-sizing: border-box;">
                                            <div>
                                                <h3 style="margin-top:0;">${app.name} (${app.subRegion || '지역 미정'})</h3>
                                                <p style="margin: 0.5rem 0;"><strong>과목:</strong> ${app.subject}</p>
                                                ${app.request ? `<p style="font-size:0.9rem; color:#475569; margin: 0.5rem 0; line-height: 1.4; background: #f8fafc; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0; text-align: left;"><strong>요청사항:</strong> ${app.request}</p>` : ''}
                                                <p style="margin: 0.5rem 0;"><strong>상태:</strong> <span class="tag">${app.status}</span></p>
                                            </div>
                                            <div style="display:flex; gap:0.5rem; margin-top:1.5rem;">
                                                ${hasProposed 
                                                    ? `<button class="btn secondary" style="flex:1; margin:0; background:#e2e8f0; color:#94a3b8; cursor:not-allowed; border:none; display:flex; align-items:center; justify-content:center; gap:4px;" disabled><i class="fas fa-check-circle" style="color:#94a3b8;"></i>제안 완료</button>`
                                                    : `<button class="btn primary" onclick="openTutorProposalModal('${app.id}')" style="flex:1; margin:0; background:var(--primary); display:flex; align-items:center; justify-content:center; gap:6px;"><i class="fas fa-paper-plane"></i>역제안</button>`
                                                }
                                                <button class="btn secondary" onclick="openAvailabilityDetailsModal('${app.name}', 'tutee')" style="flex:1; margin:0; display:flex; align-items:center; justify-content:center; gap:4px; font-weight:700;"><i class="fas fa-clock"></i> 시간표</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <i class="fas fa-user-friends empty-icon"></i>
                                <p>해당 과목의 학생 과외 요청이 없습니다.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>`;
            
        const select = document.getElementById('subject-filter-select');
        if (select) select.value = selectedSubjectFilter;
    } else {
        const rawMatchedApps = applications.filter(a => a.name === currentUser.name && (a.status === '수락됨' || a.status === 'accepted'));
        
        const groupedAccepted = {};
        rawMatchedApps.forEach(a => {
            const targetTutor = (a.tutorName ? a.tutorName.trim() : '') || (a.subject.includes('수학') || a.subject.includes('결정') ? '김선생' : '이튜터');
            if (!groupedAccepted[targetTutor]) {
                groupedAccepted[targetTutor] = {
                    ...a,
                    tutorName: targetTutor,
                    subjects: [a.subject]
                };
            } else {
                if (!groupedAccepted[targetTutor].subjects.includes(a.subject)) {
                    groupedAccepted[targetTutor].subjects.push(a.subject);
                }
            }
        });
        
        const myMatchedApps = Object.values(groupedAccepted).map(g => ({
            ...g,
            subject: g.subjects.join(', ')
        }));
        
        let filteredTutors = [...tutors];
        if (selectedMainCategory !== 'all') {
            if (selectedMainCategory === '국어' || selectedMainCategory === '수학' || selectedMainCategory === '영어') {
                filteredTutors = filteredTutors.filter(t => t.subject.includes(selectedMainCategory));
            } else if (selectedMainCategory === '과학탐구') {
                if (selectedSubCategory === 'all') {
                    const scienceSubjects = ["물리학", "화학", "생명과학", "지구과학"];
                    filteredTutors = filteredTutors.filter(t => scienceSubjects.some(sub => t.subject.includes(sub)));
                } else {
                    filteredTutors = filteredTutors.filter(t => t.subject.includes(selectedSubCategory));
                }
            } else if (selectedMainCategory === '사회탐구') {
                if (selectedSubCategory === 'all') {
                    const socialSubjects = ["세계지리", "한국지리", "경제학", "법과 정치", "윤리와 사상", "생활과 윤리"];
                    filteredTutors = filteredTutors.filter(t => socialSubjects.some(sub => t.subject.includes(sub)));
                } else {
                    filteredTutors = filteredTutors.filter(t => t.subject.includes(selectedSubCategory));
                }
            } else if (selectedMainCategory === '이외') {
                if (selectedSubCategory === 'all') {
                    const otherSubjects = ["파이썬", "미술", "음악"];
                    filteredTutors = filteredTutors.filter(t => otherSubjects.some(sub => t.subject.includes(sub)));
                } else {
                    filteredTutors = filteredTutors.filter(t => t.subject.includes(selectedSubCategory));
                }
            }
        }
        
        const categories = ["all", "국어", "수학", "영어", "과학탐구", "사회탐구", "이외"];
        const categoryLabels = {
            "all": "전체보기",
            "국어": "국어",
            "수학": "수학",
            "영어": "영어 🔤",
            "과학탐구": "과학탐구 🧪",
            "사회탐구": "사회탐구 🗺️",
            "이외": "예체능/기타 💡"
        };
        
        const mainButtonsHtml = categories.map(cat => {
            const isActive = selectedMainCategory === cat;
            const activeStyle = isActive 
                ? "background: var(--secondary); color: white; border-color: var(--secondary); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);" 
                : "background: white; color: var(--text-main); border-color: #cbd5e1;";
            
            return `
                <button type="button" onclick="selectMainCategory('${cat}')" style="padding: 0.5rem 1.1rem; border-radius: 20px; border: 1px solid; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; ${activeStyle} display: flex; align-items: center; gap: 4px; margin: 0; outline: none;">
                    ${categoryLabels[cat]}
                </button>
            `;
        }).join('');

        let subButtonsHtml = '';
        if (selectedMainCategory === '과학탐구') {
            const subs = ["all", "물리학", "화학", "생명과학", "지구과학"];
            const labels = { "all": "전체 과학탐구 🧪", "물리학": "물리학", "화학": "화학", "생명과학": "생명과학", "지구과학": "지구과학" };
            subButtonsHtml = `
                <div class="sub-filter-row animate-fade" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.8rem; padding: 0.5rem 0.8rem; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box; animation: fadeIn 0.3s ease;">
                    ${subs.map(sub => {
                        const isActive = selectedSubCategory === sub;
                        const activeStyle = isActive
                            ? "background: #d1fae5; color: #047857; border-color: #a7f3d0; font-weight: 700; box-shadow: var(--shadow-sm);"
                            : "background: white; color: #64748b; border-color: #e2e8f0;";
                        return `
                            <button type="button" onclick="selectSubCategory('${sub}')" style="padding: 0.35rem 0.85rem; border-radius: 15px; border: 1px solid; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; ${activeStyle} margin: 0; outline: none;">
                                ${labels[sub]}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (selectedMainCategory === '사회탐구') {
            const subs = ["all", "세계지리", "한국지리", "경제학", "법과 정치", "윤리와 사상", "생활과 윤리"];
            const labels = { "all": "전체 사회탐구 🗺️", "세계지리": "세계지리", "한국지리": "한국지리", "경제학": "경제학", "법과 정치": "법과 정치", "윤리와 사상": "윤리와 사상", "생활과 윤리": "생활과 윤리" };
            subButtonsHtml = `
                <div class="sub-filter-row animate-fade" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.8rem; padding: 0.5rem 0.8rem; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box; animation: fadeIn 0.3s ease;">
                    ${subs.map(sub => {
                        const isActive = selectedSubCategory === sub;
                        const activeStyle = isActive
                            ? "background: #d1fae5; color: #047857; border-color: #a7f3d0; font-weight: 700; box-shadow: var(--shadow-sm);"
                            : "background: white; color: #64748b; border-color: #e2e8f0;";
                        return `
                            <button type="button" onclick="selectSubCategory('${sub}')" style="padding: 0.35rem 0.85rem; border-radius: 15px; border: 1px solid; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; ${activeStyle} margin: 0; outline: none;">
                                ${labels[sub]}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (selectedMainCategory === '이외') {
            const subs = ["all", "파이썬", "미술", "음악"];
            const labels = { "all": "전체 예체능/기타 💡", "파이썬": "파이썬 🐍", "미술": "미술 🎨", "음악": "음악 🎵" };
            subButtonsHtml = `
                <div class="sub-filter-row animate-fade" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.8rem; padding: 0.5rem 0.8rem; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box; animation: fadeIn 0.3s ease;">
                    ${subs.map(sub => {
                        const isActive = selectedSubCategory === sub;
                        const activeStyle = isActive
                            ? "background: #d1fae5; color: #047857; border-color: #a7f3d0; font-weight: 700; box-shadow: var(--shadow-sm);"
                            : "background: white; color: #64748b; border-color: #e2e8f0;";
                        return `
                            <button type="button" onclick="selectSubCategory('${sub}')" style="padding: 0.35rem 0.85rem; border-radius: 15px; border: 1px solid; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; ${activeStyle} margin: 0; outline: none;">
                                ${labels[sub]}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }

        list.innerHTML = `
            ${myMatchedApps.length ? `
                <h3 style="margin-bottom:1rem;"><i class="fas fa-graduation-cap" style="color:var(--primary); margin-right:8px;"></i>현재 수강 중인 선생님</h3>
                <div class="match-grid" style="margin-bottom: 2.5rem; margin-top: 0.5rem;">
                    ${myMatchedApps.map(a => {
                        const targetTutorName = (a.tutorName ? a.tutorName.trim() : '') || (a.subject.includes('수학') || a.subject.includes('결정') ? '김선생' : '이튜터');
                        const matchedTutorDetails = tutors.find(t => t.name && t.name.trim() === targetTutorName.trim()) || { subject: a.subject, bio: "매칭된 대학생 튜터", fee: 25000 };
                        const roomId = `campustutor_chat_${currentUser.name.trim()}_${targetTutorName.trim()}`.replace(/\s+/g, '_');
                        const unread = unreadCounts[roomId] || 0;
                        const badgeHtml = unread > 0 ? `<span class="chat-badge" style="background:#ef4444; color:white; font-size:0.75rem; font-weight:700; padding:0.15rem 0.45rem; border-radius:10px; margin-left:6px; vertical-align:middle; line-height:1; display:inline-flex; align-items:center; justify-content:center;">${unread}</span>` : '';
                        
                        return `
                            <div class="match-card" style="border: 1px solid #d1fae5; background: #f0fdf4;">
                                <div style="display:flex; justify-content:space-between; align-items:start;">
                                    <h3 style="margin-top:0; color:#065f46;">${targetTutorName} 선생님</h3>
                                    <span class="tag" style="background:#d1fae5; color:#065f46; font-weight:600;">수강 중</span>
                                </div>
                                <p style="font-size:0.9rem; color:#047857; margin:0.35rem 0;">과목: ${a.subject}</p>
                                <p style="margin:0.8rem 0; font-size:0.95rem; line-height: 1.5; color: #065f46;">${matchedTutorDetails.bio}</p>
                                <div style="display:flex; gap:0.5rem; margin-top:1.5rem;">
                                    <button class="btn primary" onclick="openChatRoom('${currentUser.name}', '${targetTutorName}')" style="flex:1; margin:0; background:#059669; display:flex; align-items:center; justify-content:center; gap:6px;"><i class="fas fa-comments"></i> 1:1 채팅 ${badgeHtml}</button>
                                    <button class="btn secondary" onclick="openReviewModal('${targetTutorName}')" style="flex:1; margin:0; border: 1px solid #10b981; color:#047857; background:#ffffff; display:flex; align-items:center; justify-content:center; gap:6px;"><i class="fas fa-star"></i> 후기 남기기</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
            
            <div style="margin-top: 2rem; margin-bottom: 1.5rem; width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <h3 style="margin:0; display:flex; align-items:center; gap:8px;"><i class="fas fa-search" style="color:var(--secondary);"></i>추천 선생님 목록</h3>
                    <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">조건에 맞는 선생님: ${filteredTutors.length}명</div>
                </div>
                
                <!-- Main categories filter buttons -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 0.5rem; background: #f1f5f9; padding: 0.6rem; border-radius: 24px; border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box;">
                    ${mainButtonsHtml}
                </div>
                
                <!-- Sub categories filter chips -->
                ${subButtonsHtml}
            </div>
            
            <div class="match-grid">
                ${filteredTutors.length ? filteredTutors.map(t => {
                    const tutorReviews = reviews.filter(r => r.tutorName === t.name);
                    const averageRating = tutorReviews.length 
                        ? (tutorReviews.reduce((sum, r) => sum + r.rating, 0) / tutorReviews.length).toFixed(1) 
                        : null;
                    
                    return `
                     <div class="match-card" style="display: flex; flex-direction: column; justify-content: space-between; min-height: 310px; box-sizing: border-box;">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:0.5rem; margin-bottom: 0.5rem;">
                                <h3 style="margin:0; font-size: 1.25rem; white-space: nowrap;">
                                    ${t.name} 선생님
                                    ${users.find(u => u.name === t.name && u.role === 'tutor')?.certified ? `<span style="color:#059669; font-size:0.9rem; margin-left:4px;" title="재학/졸업 인증 완료"><i class="fas fa-check-circle"></i></span>` : ''}
                                </h3>
                                <span class="tag" style="background:#e0f2fe; color:#0369a1; white-space: normal; word-break: keep-all;">${t.subject}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 0.75rem; font-size: 0.85rem; font-weight: 600;">
                                ${averageRating 
                                    ? `<span style="color: #fbbf24;"><i class="fas fa-star"></i> ${averageRating}</span> <span style="color: #64748b;">(${tutorReviews.length}개의 후기)</span>` 
                                    : `<span style="color: #94a3b8;"><i class="far fa-star"></i> 후기 없음</span>`
                                }
                            </div>
                            <p style="font-size:0.9rem; color:#64748b; margin:0.35rem 0;">${t.region} ${t.subRegion}</p>
                            <p style="margin:1rem 0; font-size:0.95rem; line-height: 1.5; color: var(--text-main); height: 4.5rem; min-height: 4.5rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; text-overflow: ellipsis;">${t.bio}</p>
                            <p style="margin: 0.5rem 0 0 0;"><strong>시급: ${t.fee ? t.fee.toLocaleString() : '협의'}원</strong></p>
                        </div>
                        <div style="display:flex; gap:0.4rem; margin-top:1.25rem;">
                            <button class="btn primary" onclick="applyTutor('${t.name}')" style="flex:1; margin:0; background:var(--secondary); display:flex; align-items:center; justify-content:center; gap:4px; font-size:0.82rem; padding: 0.6rem 0.4rem;"><i class="fas fa-paper-plane"></i>과외 제안</button>
                            <button class="btn secondary" onclick="openViewReviewsModal('${t.name}')" style="flex:1; margin:0; display:flex; align-items:center; justify-content:center; gap:4px; font-weight:700; font-size:0.82rem; padding: 0.6rem 0.4rem;"><i class="fas fa-comment-dots"></i> 후기 보기</button>
                            <button class="btn secondary" onclick="openAvailabilityDetailsModal('${t.name}', 'tutor')" style="flex:1; margin:0; display:flex; align-items:center; justify-content:center; gap:4px; font-weight:700; font-size:0.82rem; padding: 0.6rem 0.4rem;"><i class="fas fa-clock"></i> 시간표</button>
                        </div>
                    </div>
                    `;
                }).join('') : `
                    <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
                        <i class="fas fa-graduation-cap empty-icon" style="color:var(--text-muted); opacity:0.5;"></i>
                        <p style="color:var(--text-muted); font-weight:500;">조건에 부합하는 선생님이 존재하지 않습니다.</p>
                    </div>
                `}
            </div>
        `;
    }
}

// Tutor Reverse Proposal Handlers
function openTutorProposalModal(appId) {
    if (!currentUser || currentUser.role !== 'tutor') {
        alert('선생님 계정으로 로그인 후 이용해 주세요.');
        return;
    }
    
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    document.getElementById('proposal-app-id').value = appId;
    
    // Set default fee from tutor profile
    const tutorProfile = tutors.find(t => t.name === currentUser.name) || {};
    document.getElementById('proposal-fee').value = tutorProfile.fee || 25000;
    
    // Clear and set default introduction
    document.getElementById('proposal-bio').value = tutorProfile.bio || '';
    
    // Dynamic subject selection binding
    const subjects = app.subject.split(',').map(s => s.trim()).filter(Boolean);
    const select = document.getElementById('proposal-subject');
    const group = document.getElementById('proposal-subject-group');
    
    if (select) {
        select.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        if (subjects.length > 1) {
            group.style.display = 'block';
        } else {
            group.style.display = 'none';
        }
    }
    
    openModal('tutorProposalModal');
}

function submitTutorProposal(event) {
    event.preventDefault();
    
    if (!currentUser || currentUser.role !== 'tutor') return;
    
    const appId = document.getElementById('proposal-app-id').value;
    const feeVal = document.getElementById('proposal-fee').value;
    const bioVal = document.getElementById('proposal-bio').value;
    const subjectVal = document.getElementById('proposal-subject').value;
    
    if (!feeVal || !bioVal || !subjectVal) {
        alert('모든 필수 정보를 입력해 주세요.');
        return;
    }
    
    const proposalData = {
        tutorName: currentUser.name.trim(),
        subject: subjectVal,
        fee: parseInt(feeVal) || 25000,
        bio: bioVal.trim(),
        univ: currentUser.univ || "대학 정보 없음",
        spec: currentUser.spec || "경력 정보 없음",
        date: new Date().toISOString().split('T')[0]
    };
    
    if (db) {
        // Write under applications/{appId}/proposals/{tutorName}
        db.ref('applications').child(appId).child('proposals').child(currentUser.name.replace(/\s+/g, '_')).set(proposalData);
        
        // Find student email and send real-time notification
        const studentApp = applications.find(a => a.id === appId);
        if (studentApp) {
            const studentUser = users.find(u => u.name === studentApp.name && u.role === 'tutee');
            if (studentUser) {
                addNotification(studentUser.email, '🔔 새 과외 역제안 도착', `${currentUser.name} 선생님께서 [${subjectVal}] 과외 역제안을 보냈습니다!`, 'mypage-tutoring');
            }
        }
    }
    
    addNotification(currentUser.email, '✉️ 과외 제안 완료', `학생에게 [${subjectVal}] 과외 역제안을 성공적으로 제출했습니다.`, 'dashboard');
    closeModal('tutorProposalModal');
    
    updateDashboard();
    updateTutoringList();
}

function openViewProposalsModal(appId) {
    if (!currentUser || currentUser.role !== 'tutee') return;
    
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    document.getElementById('student-view-proposals-app-id').value = appId;
    const listContainer = document.getElementById('student-proposals-list');
    
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    const proposals = app.proposals || {};
    const proposalList = Object.values(proposals);
    
    if (proposalList.length === 0) {
        listContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem 0; font-weight: 500;">도착한 선생님의 과외 제안이 아직 없습니다.</p>`;
    } else {
        listContainer.innerHTML = proposalList.map(p => `
            <div class="proposal-tutor-card animate-fade" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; box-shadow: var(--shadow-sm); animation: fadeIn 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                        <h3 style="margin: 0 0 0.25rem 0; color: var(--text-main); font-size: 1.15rem;">${p.tutorName} 선생님</h3>
                        <div style="display: flex; gap: 6px; align-items: center; margin-top: 0.25rem; flex-wrap: wrap;">
                            <span style="font-size: 0.82rem; color: var(--primary); font-weight: 700; background: #ecfdf5; padding: 0.2rem 0.6rem; border-radius: 6px;">${p.univ}</span>
                            <span style="font-size: 0.82rem; color: var(--secondary); font-weight: 700; background: #f0fdf4; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid #d1fae5;">제안 과목: ${p.subject}</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 1.1rem; font-weight: 800; color: var(--secondary);">${parseInt(p.fee).toLocaleString()}원</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">희망 시급</span>
                    </div>
                </div>
                <div style="background: white; border: 1px solid #f1f5f9; border-radius: 8px; padding: 0.75rem; font-size: 0.9rem; line-height: 1.5; color: #475569; white-space: pre-wrap; font-weight: 500; text-align: left;">
                    <strong>💬 다짐 한줄:</strong> ${p.bio}
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); margin-right: auto;"><i class="far fa-calendar-alt" style="margin-right: 4px;"></i>${p.date} 제안</span>
                    <button class="btn primary" onclick="acceptTutorProposal('${appId}', '${p.tutorName}')" style="margin: 0; padding: 0.5rem 1.25rem; font-size: 0.85rem; background: var(--secondary); display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-check"></i> 이 선생님 선택하기
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    openModal('studentViewProposalsModal');
}

function acceptTutorProposal(appId, tutorName) {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    const propKey = tutorName.replace(/\s+/g, '_');
    const prop = app.proposals ? app.proposals[propKey] : null;
    const targetSubject = prop ? prop.subject : app.subject;
    
    if (confirm(`${tutorName} 선생님의 [${targetSubject}] 과외 제안을 수락하시겠습니까?`)) {
        const updatedStatus = '수락됨';
        
        const acceptedTutorUser = users.find(u => u.name && u.name.trim() === tutorName.trim() && u.role === 'tutor');
        
        saveState();
        
        if (db) {
            // 1. Update application status, set tutorName, subject to the chosen specific subject, and CLEAR the proposals node (cleanup)
            db.ref('applications').child(appId).update({
                status: updatedStatus,
                tutorName: tutorName.trim(),
                subject: targetSubject,
                proposals: null // DB hygiene clean up of alternative pending tutor proposals
            });
            
            // 2. Add real-time notification to the successful tutor
            if (acceptedTutorUser) {
                addNotification(acceptedTutorUser.email, '🎉 과외 매칭 완료!', `${currentUser.name} 학생이 선생님의 [${targetSubject}] 역제안을 최종 수락하셨습니다! 대화방이 활성화되었습니다.`, 'dashboard');
            }
        }
        
        addNotification(currentUser.email, '🎉 과외 매칭 완료', `[${tutorName}] 선생님의 [${targetSubject}] 역제안을 최종 수락하여 매칭이 성사되었습니다! 1:1 채팅방이 열렸습니다.`, 'dashboard');
        
        closeModal('studentViewProposalsModal');
        updateDashboard();
        updateTutoringList();
    }
}

function executeTutoringProposal(name, subject) {
    // Check duplicate enrollment for exact same subject with same tutor
    const exists = applications.find(a => {
        const appName = a.name ? a.name.trim() : '';
        const currentStudentName = currentUser.name ? currentUser.name.trim() : '';
        const appTutorName = a.tutorName ? a.tutorName.trim() : '';
        const targetTutorName = name ? name.trim() : '';
        return appName === currentStudentName && 
            appTutorName === targetTutorName && 
            a.subject === subject && 
            (a.status === 'pending' || a.status === '수락됨' || a.status === 'accepted');
    });
    if (exists) {
        alert(`⚠️ 신청 불가\n\n${name} 선생님에게 이미 [${subject}] 과목을 신청했거나 수강 중입니다.`);
        return;
    }

    const appId = "app_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const newApp = { 
        id: appId,
        name: currentUser.name, 
        subject: subject, 
        region: currentUser.region, 
        subRegion: currentUser.subRegion, 
        status: 'pending', 
        tutorName: name.trim(),
        type: 'tutee'
    };
    
    if (db) {
        db.ref('applications').child(appId).set(newApp);
        
        const targetTutorUser = users.find(u => u.name && u.name.trim() === name.trim() && u.role === 'tutor');
        if (targetTutorUser) {
            addNotification(targetTutorUser.email, '🔔 새 과외 제안 도착', `${currentUser.name} 학생이 [${subject}] 과외 제안을 보냈습니다.`, 'dashboard');
        }
    }
    
    addNotification(currentUser.email, '✉️ 과외 제안 발송', `${name} 선생님에게 [${subject}] 과외 제안을 보냈습니다.`, 'mypage-tutoring');
    updateDashboard();
}

function applyTutor(name) {
    const tutor = tutors.find(t => t.name === name);
    if (!tutor) return;
    
    const subjects = tutor.subject.split(',').map(s => s.trim()).filter(Boolean);
    
    if (subjects.length > 1) {
        showSubjectSelectionModal(name, subjects, (selectedSubject) => {
            executeTutoringProposal(name, selectedSubject);
        });
    } else {
        const selectedSubject = subjects[0] || "상담 후 결정";
        executeTutoringProposal(name, selectedSubject);
    }
}

function acceptOffer(idOrName) {
    let app = applications.find(a => a.id == idOrName);
    if (!app) {
        app = applications.find(a => a.name === idOrName && a.status === 'pending');
    }
    
    if (app) {
        // Check duplicate enrollment for tutor acceptance
        const exists = applications.find(a => {
            const appName = a.name ? a.name.trim() : '';
            const targetStudentName = app.name ? app.name.trim() : '';
            const appTutorName = a.tutorName ? a.tutorName.trim() : '';
            const currentTutorName = currentUser.name ? currentUser.name.trim() : '';
            return appName === targetStudentName && 
                appTutorName === currentTutorName && 
                a.subject === app.subject && 
                (a.status === '수락됨' || a.status === 'accepted');
        });
        if (exists) {
            alert(`⚠️ 수락 불가\n\n[${app.name}] 학생은 이미 귀하로부터 [${app.subject}] 과목을 수강 중입니다.`);
            return;
        }

        const updatedStatus = '수락됨';
        
        saveState();
        
        if (db && app.id) {
            db.ref('applications').child(app.id.toString()).update({
                status: updatedStatus,
                tutorName: currentUser.name.trim()
            });
            
            // Find student's email to add real-time notification
            const studentUser = users.find(u => u.name && u.name.trim() === app.name.trim() && u.role === 'tutee');
            if (studentUser) {
                addNotification(studentUser.email, '🎉 과외 매칭 완료!', `${currentUser.name} 선생님께서 [${app.subject}] 과외 제안을 수락하셨습니다!`, 'dashboard');
            }
        }
        
        addNotification(currentUser.email, '🎉 과외 매칭 완료', `[${app.subject}] 과외 신청을 수락했습니다! 대화방이 활성화되었습니다.`, 'dashboard');
        updateDashboard();
    }
}

let suggestionFileBase64 = null;

function handleSuggestionFileChange() {
    const fileInput = document.getElementById('suggestion-file-input');
    const previewImg = document.getElementById('suggestion-preview-img');
    const previewContainer = document.getElementById('suggestion-file-preview');
    
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            suggestionFileBase64 = e.target.result;
            if (previewImg) previewImg.src = e.target.result;
            if (previewContainer) previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(fileInput.files[0]);
    }
}

function clearSuggestionFile() {
    const fileInput = document.getElementById('suggestion-file-input');
    const previewContainer = document.getElementById('suggestion-file-preview');
    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
    suggestionFileBase64 = null;
}

function handleSuggestionSubmit(event) {
    event.preventDefault();
    const textInput = document.getElementById('suggestion-input-text');
    if (!textInput || !textInput.value) return;
    
    const newSuggestion = {
        id: Date.now(),
        userEmail: currentUser.email,
        text: textInput.value,
        image: suggestionFileBase64,
        date: new Date().toISOString().split('T')[0],
        reply: null // Answer is initially empty
    };
    
    if (db) {
        db.ref('suggestions').child(newSuggestion.id.toString()).set(newSuggestion);
    }
    
    // Toggle form to success screen
    document.getElementById('suggestion-form-wrapper').style.display = 'none';
    document.getElementById('suggestion-success-wrapper').style.display = 'block';
    
    updateSuggestionsList();
}

function resetSuggestionForm() {
    const textInput = document.getElementById('suggestion-input-text');
    if (textInput) textInput.value = '';
    clearSuggestionFile();
    
    const formWrapper = document.getElementById('suggestion-form-wrapper');
    const successWrapper = document.getElementById('suggestion-success-wrapper');
    if (formWrapper) formWrapper.style.display = 'block';
    if (successWrapper) successWrapper.style.display = 'none';
}

function updateSuggestionsList() {
    const list = document.getElementById('my-suggestions-list');
    if (!list) return;
    
    const myTickets = suggestions.filter(s => s.userEmail === currentUser.email);
    
    if (myTickets.length === 0) {
        list.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem 0; font-weight: 500;">등록된 건의사항이 없습니다.</p>`;
        return;
    }
    
    // Sort so newest is at the top
    const sortedTickets = [...myTickets].sort((a, b) => b.id - a.id);
    
    list.innerHTML = sortedTickets.map(s => `
        <div class="suggestion-ticket-card">
            <div class="suggestion-ticket-header">
                <span class="suggestion-ticket-date"><i class="far fa-calendar-alt" style="margin-right: 6px;"></i>${s.date}</span>
                <span class="suggestion-status-tag ${s.reply ? 'answered' : 'pending'}">
                    ${s.reply ? '답변 완료' : '답변 대기 중'}
                </span>
            </div>
            <div class="suggestion-ticket-body">
                <p style="margin: 0; white-space: pre-wrap; font-weight: 500;">${s.text}</p>
                ${s.image ? `<div style="margin-top: 1rem;"><img src="${s.image}" class="suggestion-ticket-image" alt="첨부 이미지"></div>` : ''}
            </div>
            ${s.reply ? `
                <div class="suggestion-reply-box">
                    <div class="suggestion-reply-header">
                        <i class="fas fa-reply fa-rotate-180" style="margin-right: 6px;"></i>ㄴ [운영진 답변]
                    </div>
                    <p style="margin: 0; white-space: pre-wrap; color: var(--text-main); font-weight: 500; line-height: 1.5;">${s.reply}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

let tutorCertFileBase64 = null;

function submitCertification() {
    showSection('mypage');
    switchMyPageTab('profile');
    const box = document.getElementById('tutor-cert-box');
    if (box) {
        box.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleTutorCertFileChange() {
    const fileInput = document.getElementById('tutor-cert-file-input');
    const filenameSpan = document.getElementById('tutor-cert-filename');
    const previewImg = document.getElementById('tutor-cert-preview-img');
    const previewContainer = document.getElementById('tutor-cert-preview-container');
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        if (filenameSpan) filenameSpan.innerText = file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            tutorCertFileBase64 = e.target.result;
            if (previewImg) previewImg.src = e.target.result;
            if (previewContainer) previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function clearTutorCertFile() {
    const fileInput = document.getElementById('tutor-cert-file-input');
    const filenameSpan = document.getElementById('tutor-cert-filename');
    const previewContainer = document.getElementById('tutor-cert-preview-container');
    
    if (fileInput) fileInput.value = '';
    if (filenameSpan) filenameSpan.innerText = '선택된 파일 없음';
    if (previewContainer) previewContainer.style.display = 'none';
    tutorCertFileBase64 = null;
}

function uploadTutorCertification() {
    if (!currentUser || currentUser.role !== 'tutor') return;
    if (!tutorCertFileBase64) {
        alert('제출할 증명서 사진 파일을 선택해 주세요.');
        return;
    }
    
    const emailPath = currentUser.email.replace(/\./g, '_');
    const certData = {
        email: currentUser.email,
        name: currentUser.name,
        file: tutorCertFileBase64,
        status: 'pending',
        timestamp: Date.now(),
        rejectReason: ''
    };
    
    if (db) {
        db.ref('certifications').child(emailPath).set(certData).then(() => {
            alert('재학/졸업 인증 신청서가 정상적으로 접수되었습니다.\n운영진의 승인을 기다려 주세요!');
            clearTutorCertFile();
            updateTutorCertBox();
        });
        
        // Notify admins
        const admins = users.filter(u => u.role === 'admin');
        admins.forEach(admin => {
            addNotification(admin.email, '🎓 새 재학인증서 도착', `${currentUser.name} 선생님께서 새로운 재학인증 심사를 요청하셨습니다.`, 'stats');
        });
    }
}

function updateTutorCertBox() {
    if (!currentUser || currentUser.role !== 'tutor') return;
    
    const statusText = document.getElementById('tutor-cert-status-text');
    const formDiv = document.getElementById('tutor-cert-form');
    
    if (!statusText || !formDiv) return;
    
    const emailPath = currentUser.email.replace(/\./g, '_');
    const cert = certifications.find(c => c.email === currentUser.email);
    
    if (!cert) {
        statusText.innerHTML = `현재 상태: <span class="tag" style="background:#f1f5f9; color:#475569;">미제출</span>`;
        formDiv.style.display = 'block';
    } else if (cert.status === 'pending') {
        statusText.innerHTML = `현재 상태: <span class="tag" style="background:#fef3c7; color:#d97706;"><i class="fas fa-hourglass-half" style="margin-right: 4px;"></i>심사 대기 중</span>`;
        formDiv.style.display = 'none';
    } else if (cert.status === 'approved') {
        statusText.innerHTML = `현재 상태: <span class="tag" style="background:#d1fae5; color:#065f46;"><i class="fas fa-check-circle" style="margin-right: 4px;"></i>인증 완료 🎓</span>`;
        formDiv.style.display = 'none';
    } else if (cert.status === 'rejected') {
        const reasonHtml = cert.rejectReason ? `<div style="font-size:0.8rem; color:#ef4444; margin-top: 0.5rem;"><strong>반려 사유:</strong> ${cert.rejectReason}</div>` : '';
        statusText.innerHTML = `현재 상태: <span class="tag" style="background:#fee2e2; color:#ef4444;"><i class="fas fa-times-circle" style="margin-right: 4px;"></i>반려됨</span>${reasonHtml}`;
        formDiv.style.display = 'block';
    }
}

function renderAdminCerts() {
    const container = document.getElementById('admin-certs-list');
    if (!container) return;
    
    if (certifications.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-muted);">접수된 재학/졸업 인증 신청이 없습니다.</p>`;
        return;
    }
    
    // Sort: pending first, then newest
    const sorted = [...certifications].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return b.timestamp - a.timestamp;
    });
    
    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>신청 교사</th>
                    <th>제출 시각</th>
                    <th>증명서 사진</th>
                    <th>상태</th>
                    <th>관리 동작</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(c => {
                    const isPending = c.status === 'pending';
                    const emailPath = c.email.replace(/\./g, '_');
                    
                    let statusTag = '';
                    if (c.status === 'approved') {
                        statusTag = `<span class="tag" style="background:#d1fae5; color:#065f46;">승인 완료</span>`;
                    } else if (c.status === 'rejected') {
                        statusTag = `<span class="tag" style="background:#fee2e2; color:#ef4444;">반려됨</span>`;
                    } else {
                        statusTag = `<span class="tag" style="background:#fef3c7; color:#d97706;">대기 중</span>`;
                    }
                    
                    return `
                        <tr>
                            <td><strong>${c.name} 선생님</strong><br><span style="font-size:0.85rem; color:var(--text-muted);">${c.email}</span></td>
                            <td><span style="font-size:0.85rem; color:var(--text-muted);">${new Date(c.timestamp).toLocaleString()}</span></td>
                            <td>
                                <img src="${c.file}" alt="증명서 파일" style="max-height: 100px; border-radius: 6px; cursor: pointer; border: 1px solid #e2e8f0; box-shadow: var(--shadow-sm);" onclick="window.open('${c.file}')">
                            </td>
                            <td>
                                <div>${statusTag}</div>
                                ${c.rejectReason ? `<div style="font-size:0.75rem; color:#ef4444; margin-top:4px; max-width: 150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${c.rejectReason}">사유: ${c.rejectReason}</div>` : ''}
                            </td>
                            <td>
                                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    ${isPending ? `
                                        <button class="btn primary" onclick="approveCertAdmin('${emailPath}', '${c.name}')" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:var(--secondary); margin:0; border:none; cursor:pointer;"><i class="fas fa-check"></i> 승인</button>
                                        <button class="btn secondary" onclick="rejectCertAdmin('${emailPath}', '${c.name}')" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:#fee2e2; color:#ef4444; border: 1px solid #fecdd3; margin:0; cursor:pointer;"><i class="fas fa-times"></i> 반려</button>
                                    ` : `
                                        <button class="btn secondary" onclick="deleteCertAdmin('${emailPath}')" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:#f1f5f9; color:#64748b; border: 1px solid #cbd5e1; margin:0; cursor:pointer;"><i class="fas fa-trash"></i> 내역 삭제</button>
                                    `}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function approveCertAdmin(emailPath, name) {
    if (!db) return;
    if (!confirm(`${name} 선생님의 재학/졸업 인증을 승인하시겠습니까?\n승인 시 프로필에 인증 배지가 부착됩니다.`)) return;
    
    db.ref('certifications').child(emailPath).update({
        status: 'approved',
        rejectReason: ''
    });
    
    db.ref('users').child(emailPath).update({
        certified: true
    });
    
    // Find tutor email and add notification
    const matchedUser = users.find(u => u.email.replace(/\./g, '_') === emailPath);
    if (matchedUser) {
        addNotification(matchedUser.email, '🎉 재학인증 승인 완료!', '선생님의 재학/졸업 증명 서류가 최종 승인되었습니다! 프로필에 정식 대학 인증 배지가 등록되었습니다.', 'mypage-tutoring');
    }
    
    alert(`${name} 선생님의 재학 인증이 최종 승인되었습니다.`);
}

function rejectCertAdmin(emailPath, name) {
    if (!db) return;
    const reason = prompt(`${name} 선생님의 재학/졸업 인증을 반려합니다.\n반려 사유를 입력해 주세요:`);
    if (reason === null) return;
    if (!reason.trim()) {
        alert('반려 사유를 필히 입력해 주셔야 반려가 가능합니다.');
        return;
    }
    
    db.ref('certifications').child(emailPath).update({
        status: 'rejected',
        rejectReason: reason.trim()
    });
    
    db.ref('users').child(emailPath).update({
        certified: false
    });
    
    // Find tutor email and add notification
    const matchedUser = users.find(u => u.email.replace(/\./g, '_') === emailPath);
    if (matchedUser) {
        addNotification(matchedUser.email, '❌ 재학인증 반려 안내', `선생님의 재학/졸업 증명 서류가 반려되었습니다.\n(사유: ${reason.trim()})\n내용 확인 후 다시 제출해 주세요.`, 'mypage-tutoring');
    }
    
    alert(`${name} 선생님의 재학 인증이 반려 처리되었습니다.`);
}

function deleteCertAdmin(emailPath) {
    if (!db) return;
    if (!confirm('경고: 이 인증 내역을 영구적으로 삭제하시겠습니까?')) return;
    
    db.ref('certifications').child(emailPath).remove().then(() => {
        alert('인증 신청 내역이 삭제되었습니다.');
    });
}

function openEditProfileModal() {
    document.getElementById('edit-profile-name').value = currentUser.name;
    document.getElementById('edit-profile-new-password').value = '';
    document.getElementById('edit-profile-new-password-confirm').value = '';
    document.getElementById('edit-profile-current-password').value = '';
    
    if (currentUser.role === 'tutor') {
        document.getElementById('tutor-edit-fields').style.display = 'block';
        document.getElementById('tutee-edit-fields').style.display = 'none';
        
        document.getElementById('edit-tutor-univ').value = currentUser.univ || '';
        document.getElementById('edit-tutor-fee').value = currentUser.fee || '';
        document.getElementById('edit-tutor-spec').value = currentUser.spec || '';
        
        // Set region dropdowns
        document.getElementById('edit-tutor-region').value = currentUser.region || '';
        updateSubRegions('edit-tutor');
        document.getElementById('edit-tutor-sub-region').value = currentUser.subRegion || '';
        
        // Check subjects
        const subjects = currentUser.subjects || [];
        document.querySelectorAll('input[name="edit-subject"]').forEach(cb => {
            cb.checked = subjects.includes(cb.value);
        });
    } else {
        document.getElementById('tutor-edit-fields').style.display = 'none';
        document.getElementById('tutee-edit-fields').style.display = 'block';
        
        document.getElementById('edit-tutee-age').value = currentUser.age || '';
        document.getElementById('edit-tutee-school').value = currentUser.school || '';
    }
        
    // Render availability scheduler table
    renderAvailabilityGrid('profile-availability-table', true, currentUser.availability || []);
    
    openModal('editProfileModal');
}

function handleProfileUpdate(event) {
    event.preventDefault();
    
    const currentPasswordInput = document.getElementById('edit-profile-current-password').value;
    if (currentPasswordInput !== currentUser.password) {
        alert('현재 비밀번호가 올바르지 않습니다.');
        return;
    }
    
    const newName = document.getElementById('edit-profile-name').value;
    const newPassword = document.getElementById('edit-profile-new-password').value;
    const newPasswordConfirm = document.getElementById('edit-profile-new-password-confirm').value;
    
    if (newPassword && newPassword !== newPasswordConfirm) {
        alert('새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.');
        return;
    }
    
    // Update basic info
    currentUser.name = newName;
    if (newPassword) {
        currentUser.password = newPassword;
    }
    
    // Extract selected availability cells from table
    const selectedCells = document.querySelectorAll('#profile-availability-table td.selected');
    currentUser.availability = Array.from(selectedCells).map(cell => `${cell.dataset.day}-${cell.dataset.slot}`);
    
    // Update role specific info
    if (currentUser.role === 'tutor') {
        const checkedSubjects = Array.from(document.querySelectorAll('input[name="edit-subject"]:checked')).map(cb => cb.value);
        if (checkedSubjects.length === 0 || checkedSubjects.length > 3) {
            alert('주력 과목을 1개 이상 3개 이하로 선택해주세요.');
            return;
        }
        
        currentUser.univ = document.getElementById('edit-tutor-univ').value;
        currentUser.fee = document.getElementById('edit-tutor-fee').value;
        currentUser.spec = document.getElementById('edit-tutor-spec').value;
        currentUser.region = document.getElementById('edit-tutor-region').value;
        currentUser.subRegion = document.getElementById('edit-tutor-sub-region').value;
        currentUser.subjects = checkedSubjects;
        
        // Also update tutor array entry so the recommendations are up to date!
        const tIndex = tutors.findIndex(t => t.name === currentUser.name || t.id === currentUser.id);
        if (tIndex !== -1) {
            tutors[tIndex].name = currentUser.name;
            tutors[tIndex].region = currentUser.region;
            tutors[tIndex].subRegion = currentUser.subRegion;
            tutors[tIndex].subject = checkedSubjects.join(', ');
            tutors[tIndex].bio = currentUser.spec;
            tutors[tIndex].fee = parseInt(currentUser.fee);
        }
    } else {
        currentUser.age = document.getElementById('edit-tutee-age').value;
        currentUser.school = document.getElementById('edit-tutee-school').value;
        currentUser.region = document.getElementById('edit-tutee-region').value;
        currentUser.subRegion = document.getElementById('edit-tutee-sub-region').value;
    }
    
    // Update local users array entry
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
        users[userIndex] = { ...currentUser };
    }
    
    saveState();
    
    if (db && currentUser.role === 'tutor') {
        const t = tutors.find(x => x.name === currentUser.name || x.id === currentUser.id);
        if (t) {
            db.ref('tutors').child(t.id.toString()).update({
                name: currentUser.name,
                region: currentUser.region,
                subRegion: currentUser.subRegion,
                subject: currentUser.subjects.join(', '),
                bio: currentUser.spec,
                fee: parseInt(currentUser.fee) || 20000
            });
        }
    }
    
    alert('프로필 정보가 안전하게 수정되었습니다.');
    closeModal('editProfileModal');
    updateMyPage();
    updateHomeHero();
}

function handleNewApply(event) {
    event.preventDefault();
    
    if (!currentUser || currentUser.role !== 'tutee') {
        alert('학생 계정으로 로그인 후 신청해주세요.');
        return;
    }
    
    const checkedSubjects = Array.from(document.querySelectorAll('input[name="apply-subject"]:checked')).map(cb => cb.value);
    const additionalRequest = document.getElementById('apply-request').value.trim();
    
    if (checkedSubjects.length === 0) {
        alert('희망 과목을 선택해주세요.');
        return;
    }

    const appId = "app_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const newApp = { 
        id: appId,
        name: currentUser.name, 
        region: currentUser.region || "미지정", 
        subRegion: currentUser.subRegion || "", 
        subject: checkedSubjects.join(', '), 
        status: 'pending', 
        type: 'tutee',
        request: additionalRequest
    };
    
    if (db) {
        db.ref('applications').child(appId).set(newApp);
        
        // Find all tutors in the same region to notify them
        const targetRegion = newApp.region;
        const regionalTutors = users.filter(u => u.role === 'tutor' && u.region === targetRegion);
        regionalTutors.forEach(tutor => {
            addNotification(tutor.email, '🔔 내 지역 새 과외 신청', `내 거주 지역(${targetRegion})에 새로운 학생(${currentUser.name})의 과외 신청이 접수되었습니다!`, 'dashboard');
        });
    }
    
    addNotification(currentUser.email, '✉️ 과외 신청 완료', `[${checkedSubjects.join(', ')}] 과외 신청서가 정상적으로 접수되었습니다.`, 'mypage-tutoring');
    closeApplyModal();
    // 데이터 반영 후 대시보드 업데이트
    if(currentUser) updateDashboard();
}

function openApplyModal(type) {
    const title = document.getElementById('applyTitle');
    if (type === 'tutor') {
        title.innerText = '선생님 등록하기';
        alert('선생님 등록은 회원가입을 통해 스펙을 입력해주시면 자동 등록됩니다.');
        openAuthModal();
        toggleAuth('signup-tutor');
    } else {
        if (!currentUser || currentUser.role !== 'tutee') {
            alert('학생 계정으로 로그인 후 신청해주세요.');
            return;
        }
        title.innerText = '과외 신청하기';
        
        // Dynamically show the logged-in student info
        const infoDisplay = document.getElementById('apply-user-info-display');
        if (infoDisplay) {
            infoDisplay.innerText = `${currentUser.name} (${currentUser.region} ${currentUser.subRegion || ''})`;
        }
        
        // Clear previous input request
        const requestTextarea = document.getElementById('apply-request');
        if (requestTextarea) requestTextarea.value = '';
        
        // Reset checkboxes
        document.querySelectorAll('input[name="apply-subject"]').forEach(cb => cb.checked = false);
        
        openModal('applyModal');
    }
}

function closeApplyModal() { closeModal('applyModal'); }

function updateHomeHero() {
    const badge = document.getElementById('hero-badge');
    const title = document.getElementById('hero-title');
    const desc = document.getElementById('hero-desc');
    const btns = document.getElementById('home-btns');
    const dynamicContent = document.getElementById('home-dynamic-content');
    
    if (!currentUser) {
        // Logged Out State
        if (badge) {
            badge.innerText = '검증된 대학생 튜터 매칭';
            badge.style.background = 'var(--white)';
            badge.style.color = 'var(--primary)';
        }
        if (title) title.innerHTML = '나에게 딱 맞는<br>대학생 과외를 만나보세요';
        if (desc) desc.innerText = '대학생 선생님들께 배우는 초중고 과외 서비스.';
        if (btns) {
            btns.innerHTML = `
                <button class="btn primary" onclick="openApplyModal('tutee')">과외 신청하기</button>
                <button class="btn secondary" onclick="openApplyModal('tutor')">튜터 등록하기</button>
            `;
        }
        if (dynamicContent) {
            dynamicContent.style.display = 'none';
            dynamicContent.innerHTML = '';
        }
    } else if (currentUser.role === 'tutor') {
        // Tutor Logged In State
        if (badge) {
            badge.innerText = '선생님 계정 🎓';
            badge.style.background = '#dbeafe';
            badge.style.color = 'var(--primary)';
        }
        if (title) title.innerHTML = `${currentUser.name} 선생님, 환영합니다!<br>오늘도 배움의 즐거움을 함께 나누어보세요.`;
        if (desc) desc.innerText = `${currentUser.univ || '대학교 미기재'} • 주력 과목: ${currentUser.subjects ? currentUser.subjects.join(', ') : '미선택'}`;
        if (btns) {
            btns.innerHTML = `
                <button class="btn primary" onclick="showSection('dashboard')">대시보드 바로가기</button>
                <button class="btn secondary" onclick="submitCertification()">재학인증서 제출하기</button>
            `;
        }
        
        // Show matching student requests in their region (no accept button here)
        if (dynamicContent) {
            dynamicContent.style.display = 'block';
            const matches = applications.filter(app => {
                const isAccepted = app.status === '수락됨' || app.status === 'accepted';
                const appTutorName = app.tutorName ? app.tutorName.trim() : '';
                const currentTutorName = currentUser.name ? currentUser.name.trim() : '';
                if (isAccepted) {
                    return appTutorName === currentTutorName;
                } else {
                    return (appTutorName === currentTutorName) || (!app.tutorName && app.region === currentUser.region);
                }
            });
            
            dynamicContent.innerHTML = `
                <div class="home-tutor-section" style="margin-top: 1rem;">
                    <div class="section-title-wrapper" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h2 style="margin:0; font-size: 1.6rem;"><i class="fas fa-map-marker-alt" style="color:var(--primary); margin-right:8px;"></i>${currentUser.region} 지역의 실시간 과외 요청</h2>
                        <span class="role-badge" style="background:#eff6ff; color:var(--primary); font-weight:600; padding:0.25rem 0.75rem; border-radius:20px; font-size:0.85rem;">내 거주 지역 맞춤</span>
                    </div>
                    
                    ${matches.length ? `
                        <div class="match-grid" style="margin:0;">
                            ${matches.map(app => `
                                <div class="match-card" style="display:flex; flex-direction:column; justify-content:space-between; min-height: 280px; box-sizing: border-box;">
                                    <div>
                                        <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:0.5rem; margin-bottom: 0.75rem;">
                                            <h3 style="margin:0; font-size: 1.25rem; white-space: nowrap;">${app.name} 학생</h3>
                                            <span class="tag" style="background:#f1f5f9; color:var(--text-main); font-weight:600; font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 6px; white-space: normal; word-break: keep-all;">${app.subRegion || '지역 미정'}</span>
                                        </div>
                                        <p style="margin: 0.5rem 0; font-size: 0.95rem;"><strong>희망 과목:</strong> ${app.subject}</p>
                                        ${app.request ? `<p style="font-size:0.85rem; color:#475569; margin: 0.4rem 0; background: #f8fafc; padding: 0.4rem; border-radius: 6px; border: 1px solid #e2e8f0; text-align: left;"><strong>요청사항:</strong> ${app.request}</p>` : ''}
                                        <p style="margin: 0.5rem 0; font-size: 0.95rem;"><strong>신청 상태:</strong> <span class="tag" style="background:#e0f2fe; color:#0369a1; font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 6px;">${app.status}</span></p>
                                    </div>
                                    <div style="display:flex; gap:0.5rem; margin-top:1.5rem;">
                                        <button class="btn primary" onclick="showSection('dashboard')" style="flex:1; margin:0; font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:4px; padding: 0.7rem 0.5rem;">
                                            상세보기 및 수락 <i class="fas fa-arrow-right"></i>
                                        </button>
                                        <button class="btn secondary" onclick="openAvailabilityDetailsModal('${app.name}', 'tutee')" style="flex:1; margin:0; font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:4px; padding: 0.7rem 0.5rem; font-weight:700;">
                                            <i class="fas fa-clock"></i> 시간표 확인
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state" style="max-width: 100%; padding: 4rem 2rem;">
                            <i class="fas fa-search-location empty-icon" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5; margin-bottom: 1rem;"></i>
                            <p style="font-size: 1.1rem; color: var(--text-muted); font-weight: 500;">현재 ${currentUser.region} 지역에 대기 중인 학생 과외 신청이 없습니다.</p>
                        </div>
                    `}
                </div>
            `;
        }
    } else {
        // Tutee Logged In State
        if (badge) {
            badge.innerText = '학생 계정 ✏️';
            badge.style.background = '#d1fae5';
            badge.style.color = 'var(--secondary)';
        }
        if (title) title.innerHTML = `${currentUser.name} 학생, 반갑습니다!<br>나에게 딱 맞는 과외 선생님을 만나보세요.`;
        if (desc) desc.innerText = `${currentUser.school || '학교 미기재'} • 거주 지역: ${currentUser.region || ''} ${currentUser.subRegion || ''}`;
        if (btns) {
            btns.innerHTML = `
                <button class="btn primary" onclick="showSection('dashboard')">선생님 목록 보기</button>
                <button class="btn secondary" onclick="openApplyModal('tutee')">새 과외 신청하기</button>
            `;
        }
        
        // Show matching tutors in their region
        if (dynamicContent) {
            dynamicContent.style.display = 'block';
            const localTutors = tutors.filter(t => t.region === currentUser.region);
            
            dynamicContent.innerHTML = `
                <div class="home-tutee-section" style="margin-top: 1rem;">
                    <div class="section-title-wrapper" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h2 style="margin:0; font-size: 1.6rem;"><i class="fas fa-chalkboard-teacher" style="color:var(--secondary); margin-right:8px;"></i>${currentUser.region} 지역의 추천 선생님</h2>
                        <span class="role-badge" style="background:#ecfdf5; color:var(--secondary); font-weight:600; padding:0.25rem 0.75rem; border-radius:20px; font-size:0.85rem;">내 지역 맞춤</span>
                    </div>
                    
                    ${localTutors.length ? `
                        <div class="match-grid" style="margin:0;">
                            ${localTutors.map(t => `
                                <div class="match-card" style="display:flex; flex-direction:column; justify-content:space-between; min-height: 280px; box-sizing: border-box;">
                                    <div>
                                        <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:0.5rem; margin-bottom: 0.75rem;">
                                            <h3 style="margin:0; font-size: 1.25rem; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                                ${t.name} 선생님
                                                ${users.find(u => u.name === t.name && u.role === 'tutor')?.certified ? `<span style="color:#059669; font-size:0.9rem;" title="재학/졸업 인증 완료"><i class="fas fa-check-circle"></i></span>` : ''}
                                            </h3>
                                            <span class="tag" style="background:#eff6ff; color:var(--primary); font-weight:600; font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 6px; white-space: normal; word-break: keep-all;">${t.subject}</span>
                                        </div>
                                        <p style="font-size:0.85rem; color:#64748b; margin:0.35rem 0;">${t.region} ${t.subRegion || ''}</p>
                                        <p style="margin:0.8rem 0; font-size:0.95rem; line-height: 1.5; color: var(--text-main);">${t.bio}</p>
                                        <p style="margin: 0; font-size:0.95rem;"><strong>시급:</strong> ${t.fee ? parseInt(t.fee).toLocaleString() : '협의'}원</p>
                                    </div>
                                    <div style="display:flex; gap:0.5rem; margin-top:1.5rem;">
                                        <button class="btn primary" onclick="showSection('dashboard')" style="flex:1; margin:0; font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:4px; padding: 0.7rem 0.5rem; background: var(--secondary);">
                                            상세보기 및 제안 <i class="fas fa-arrow-right"></i>
                                        </button>
                                        <button class="btn secondary" onclick="openAvailabilityDetailsModal('${t.name}', 'tutor')" style="flex:1; margin:0; font-size:0.85rem; display:flex; align-items:center; justify-content:center; gap:4px; padding: 0.7rem 0.5rem; font-weight:700;">
                                            <i class="fas fa-clock"></i> 시간표 확인
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state" style="max-width: 100%; padding: 4rem 2rem;">
                            <i class="fas fa-search-location empty-icon" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5; margin-bottom: 1rem;"></i>
                            <p style="font-size: 1.1rem; color: var(--text-muted); font-weight: 500;">현재 ${currentUser.region} 지역에 등록된 추천 선생님이 없습니다.</p>
                        </div>
                    `}
                </div>
            `;
        }
    }
}

// Firebase Real-time Chat Engine & Unread Messages System
let currentChatRoomId = null;
let unreadCounts = {};
let chatRoomListeners = {};

function getLastReadTimestamp(roomId) {
    if (!currentUser) return 0;
    return parseInt(localStorage.getItem(`lastRead_${currentUser.email}_${roomId}`)) || 0;
}

function setLastReadTimestamp(roomId, timestamp) {
    if (!currentUser) return;
    localStorage.setItem(`lastRead_${currentUser.email}_${roomId}`, timestamp);
}

function initUnreadCounters() {
    if (!db || !currentUser) return;
    
    // Filter matching (accepted) applications to watch chat rooms
    const matchedApps = applications.filter(a => {
        const isAccepted = a.status === '수락됨' || a.status === 'accepted';
        const aTutorName = a.tutorName ? a.tutorName.trim() : '';
        const currentTutorName = currentUser.name ? currentUser.name.trim() : '';
        if (currentUser.role === 'tutor') {
            return isAccepted && aTutorName === currentTutorName;
        } else {
            return isAccepted && a.name === currentUser.name;
        }
    });
    
    matchedApps.forEach(app => {
        const studentName = app.name ? app.name.trim() : '';
        const tutorName = (app.tutorName ? app.tutorName.trim() : '') || (app.subject.includes('수학') || app.subject.includes('결정') ? '김선생' : '이튜터');
        const roomId = `campustutor_chat_${studentName}_${tutorName}`.replace(/\s+/g, '_');
        
        if (chatRoomListeners[roomId]) return; // Skip if listener already bound
        chatRoomListeners[roomId] = true;
        
        // Listen on message events for this specific room
        db.ref('chats/' + roomId).on('value', (snapshot) => {
            const val = snapshot.val();
            let count = 0;
            
            if (val) {
                const lastRead = getLastReadTimestamp(roomId);
                const msgList = Object.values(val);
                
                // Count messages not sent by me and created after my last read timestamp
                msgList.forEach(msg => {
                    if (msg.sender !== currentUser.email && msg.timestamp > lastRead) {
                        count++;
                    }
                });
            }
            
            // If user is currently inside this chat room, unread is zero
            if (currentChatRoomId === roomId) {
                count = 0;
            }
            
            unreadCounts[roomId] = count;
            
            // Trigger dynamic re-renders to paint badge overlays
            updateDashboard();
            updateTutoringList();
        });
    });
}

let currentChatMessages = [];
let opponentLastReadTime = 0;
let oppReadRef = null;

function openChatRoom(studentName, tutorName) {
    const sName = studentName ? studentName.trim() : '';
    const tName = tutorName ? tutorName.trim() : '';
    const rawRoomId = `campustutor_chat_${sName}_${tName}`.replace(/\s+/g, '_');
    currentChatRoomId = rawRoomId;
    currentChatMessages = [];
    opponentLastReadTime = 0;
    
    // Set my read timestamp in Firebase
    if (db) {
        db.ref(`chats_read/${currentChatRoomId}/${currentUser.email.replace(/\./g, '_')}`).set(Date.now());
    }
    
    const activeApps = applications.filter(a => {
        const aName = a.name ? a.name.trim() : '';
        const aTutorName = a.tutorName ? a.tutorName.trim() : '';
        const isAccepted = a.status === '수락됨' || a.status === 'accepted';
        return aName === sName && 
            isAccepted &&
            (aTutorName === tName || (!a.tutorName && tName === (a.subject.includes('수학') || a.subject.includes('결정') ? '김선생' : '이튜터')));
    });
    const activeSubjects = activeApps.map(a => a.subject).join(', ');
    const subjectsBadge = activeSubjects ? `<span style="font-size: 0.8rem; background: rgba(255,255,255,0.25); padding: 0.2rem 0.6rem; border-radius: 12px; font-weight: 600; margin-left: 10px;">과목: ${activeSubjects}</span>` : '';

    const chatTitle = document.getElementById('chat-room-title');
    if (chatTitle) {
        chatTitle.innerHTML = `<div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;"><i class="fas fa-comments"></i> ${currentUser.role === 'tutor' ? sName + ' 학생' : tName + ' 선생님'}과의 1:1 📑 채팅 ${subjectsBadge}</div>`;
    }
    
    const container = document.getElementById('chat-messages-container');
    if (container) container.innerHTML = '';
    
    openModal('chatModal');
    
    if (db) {
        // Find opponent user email
        const parts = currentChatRoomId.replace('campustutor_chat_', '').split('_');
        const opponentName = currentUser.role === 'tutor' ? parts[0] : parts[1];
        const opponentRole = currentUser.role === 'tutor' ? 'tutee' : 'tutor';
        const opponentUser = users.find(u => u.name && u.name.trim() === opponentName.replace(/_/g, ' ').trim() && u.role === opponentRole);
        
        if (opponentUser) {
            const oppPath = opponentUser.email.replace(/\./g, '_');
            oppReadRef = db.ref(`chats_read/${currentChatRoomId}/${oppPath}`);
            oppReadRef.on('value', (snapshot) => {
                opponentLastReadTime = snapshot.val() || 0;
                renderChatMessages();
            });
        }
        
        db.ref('chats/' + currentChatRoomId).off();
        db.ref('chats/' + currentChatRoomId).on('child_added', (snapshot) => {
            const msg = snapshot.val();
            if (msg) {
                currentChatMessages.push(msg);
                // Mark my read timestamp
                db.ref(`chats_read/${currentChatRoomId}/${currentUser.email.replace(/\./g, '_')}`).set(Date.now());
                renderChatMessages();
            }
        });
    } else {
        container.innerHTML = `<p style="text-align:center; padding: 2rem; color:var(--text-muted);">1:1 채팅 모듈을 불러오는 중입니다... (잠시 후 다시 열어주세요)</p>`;
    }
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    currentChatMessages.forEach(msg => {
        const isMe = msg.sender === currentUser.email;
        const dateStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const bubble = document.createElement('div');
        bubble.className = `chat-message-bubble ${isMe ? 'sent' : 'received'}`;
        
        // KakaoTalk-style read indicator (small yellow "1" for unread)
        const isRead = !isMe || (opponentLastReadTime >= msg.timestamp);
        const readIndicator = (!isRead) ? `<span class="read-indicator" style="color: #fbbf24; font-size: 0.75rem; font-weight: 700; margin-right: 6px; align-self: flex-end; line-height: 1;">1</span>` : '';
        
        let contentHtml = '';
        if (msg.type === 'image') {
            contentHtml = `<img src="${msg.fileData}" style="max-width: 100%; max-height: 250px; border-radius: 8px; cursor: pointer; display: block; margin-top: 4px;" onclick="window.open('${msg.fileData}')">`;
        } else if (msg.type === 'file') {
            contentHtml = `
                <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.05); padding: 0.5rem 0.75rem; border-radius: 8px; margin-top: 4px; border: 1px solid #cbd5e1;">
                    <i class="fas fa-file-download" style="font-size: 1.25rem; color: var(--primary);"></i>
                    <div style="text-align: left; overflow: hidden;">
                        <div style="font-weight: 700; font-size: 0.85rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-main);">${msg.fileName}</div>
                        <a href="${msg.fileData}" download="${msg.fileName}" style="font-size: 0.75rem; color: var(--primary); text-decoration: underline; font-weight: 600;">다운로드</a>
                    </div>
                </div>`;
        } else {
            contentHtml = `<span style="white-space: pre-wrap;">${msg.text}</span>`;
        }
        
        if (isMe) {
            bubble.innerHTML = `
                <div style="display: flex; align-items: flex-end; justify-content: flex-end; width: 100%;">
                    ${readIndicator}
                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                        ${contentHtml}
                        <span class="chat-message-info">${dateStr}</span>
                    </div>
                </div>
            `;
        } else {
            bubble.innerHTML = `
                <span class="chat-message-sender">${msg.senderName || '상대방'}</span>
                <div style="display: flex; align-items: flex-end; justify-content: flex-start; width: 100%;">
                    <div style="display: flex; flex-direction: column; align-items: flex-start;">
                        ${contentHtml}
                        <span class="chat-message-info" style="color:var(--text-muted); text-align: left;">${dateStr}</span>
                    </div>
                </div>
            `;
        }
        
        container.appendChild(bubble);
    });
    
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('chat-input-message');
    if (!input || !input.value.trim() || !currentChatRoomId || !db) return;
    
    const text = input.value.trim();
    input.value = '';
    
    const timestamp = Date.now();
    const msg = {
        sender: currentUser.email,
        senderName: currentUser.name,
        text: text,
        timestamp: timestamp
    };
    
    db.ref(`chats_read/${currentChatRoomId}/${currentUser.email.replace(/\./g, '_')}`).set(timestamp);
    db.ref('chats/' + currentChatRoomId).push(msg);
    
    // Parse opponent name to send notification
    const parts = currentChatRoomId.replace('campustutor_chat_', '').split('_');
    const studentName = parts[0];
    const tutorName = parts[1];
    const opponentName = currentUser.role === 'tutor' ? studentName : tutorName;
    const opponentRole = currentUser.role === 'tutor' ? 'tutee' : 'tutor';
    const opponentUser = users.find(u => u.name && u.name.trim() === opponentName.replace(/_/g, ' ').trim() && u.role === opponentRole);
    if (opponentUser) {
        addNotification(opponentUser.email, '💬 새 메시지 도착', `${currentUser.name}님으로부터 새 메시지가 도착했습니다: "${text.substring(0, 15)}${text.length > 15 ? '...' : ''}"`, 'chat', currentUser.name);
    }
}

function triggerChatFileSelect() {
    const input = document.getElementById('chat-file-input');
    if (input) input.click();
}

function handleChatFileChange() {
    const input = document.getElementById('chat-file-input');
    if (!input || !input.files || !input.files[0] || !currentChatRoomId || !db) return;
    
    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
        alert('파일 용량은 최대 10MB까지 전송 가능합니다.');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        const timestamp = Date.now();
        const isImage = file.type.startsWith('image/');
        
        const msg = {
            sender: currentUser.email,
            senderName: currentUser.name,
            text: isImage ? '📷 이미지를 보냈습니다.' : '📂 파일을 보냈습니다.',
            type: isImage ? 'image' : 'file',
            fileName: file.name,
            fileData: base64Data,
            timestamp: timestamp
        };
        
        db.ref(`chats_read/${currentChatRoomId}/${currentUser.email.replace(/\./g, '_')}`).set(timestamp);
        db.ref('chats/' + currentChatRoomId).push(msg);
        
        // Parse opponent name to send notification
        const parts = currentChatRoomId.replace('campustutor_chat_', '').split('_');
        const studentName = parts[0];
        const tutorName = parts[1];
        const opponentName = currentUser.role === 'tutor' ? studentName : tutorName;
        const opponentRole = currentUser.role === 'tutor' ? 'tutee' : 'tutor';
        const opponentUser = users.find(u => u.name && u.name.trim() === opponentName.replace(/_/g, ' ').trim() && u.role === opponentRole);
        if (opponentUser) {
            addNotification(opponentUser.email, '💬 새 파일 도착', `${currentUser.name}님이 1:1 채팅으로 파일을 전송했습니다.`, 'chat', currentUser.name);
        }
    };
    reader.readAsDataURL(file);
    input.value = ''; // Reset input
}

function closeChatRoom() {
    if (currentChatRoomId) {
        if (db) {
            db.ref(`chats_read/${currentChatRoomId}/${currentUser.email.replace(/\./g, '_')}`).set(Date.now());
            db.ref('chats/' + currentChatRoomId).off();
        }
        if (oppReadRef) {
            oppReadRef.off();
            oppReadRef = null;
        }
        unreadCounts[currentChatRoomId] = 0;
    }
    closeModal('chatModal');
    currentChatRoomId = null;
    currentChatMessages = [];
    
    // Refresh panels to remove badge
    updateDashboard();
    updateTutoringList();
}

function closeChatModal() {
    closeChatRoom();
}

// Notification Drawer Helpers & Firebase Alert API
let activeNotifRef = null;

function setupNotificationSync() {
    if (!db || !currentUser) return;
    
    if (activeNotifRef) {
        activeNotifRef.off();
    }
    
    const notifPath = currentUser.email.replace(/\./g, '_');
    activeNotifRef = db.ref('notifications/' + notifPath);
    activeNotifRef.on('value', (snapshot) => {
        const val = snapshot.val();
        let list = [];
        let unreadCount = 0;
        
        if (val) {
            list = Object.values(val).sort((a, b) => b.timestamp - a.timestamp);
            list.forEach(n => {
                if (!n.read) unreadCount++;
            });
        }
        
        renderNotifications(list, unreadCount);
    });
}

function addNotification(targetEmail, title, text, type = null, relatedIdOrName = null) {
    if (!db) return;
    const path = targetEmail.replace(/\./g, '_');
    const newNotif = {
        id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        title: title,
        text: text,
        timestamp: Date.now(),
        read: false,
        type: type,
        relatedIdOrName: relatedIdOrName
    };
    db.ref('notifications/' + path).child(newNotif.id).set(newNotif);
}

function deleteNotification(id, event) {
    if (event) event.stopPropagation();
    if (!db || !currentUser) return;
    const path = currentUser.email.replace(/\./g, '_');
    db.ref('notifications/' + path).child(id).remove();
}

function renderNotifications(list, unreadCount) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    const container = document.getElementById('notification-list');
    if (!container) return;
    
    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 3rem 1rem; color:var(--text-muted); font-size:0.95rem; font-weight:500;">도착한 새 알림이 없습니다.</p>`;
        return;
    }
    
    container.innerHTML = list.map(n => {
        const timeStr = new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="notification-card ${n.read ? '' : 'unread'}" onclick="handleNotificationClick('${n.id}')" style="cursor: pointer;">
                <button type="button" class="notification-delete-btn" onclick="deleteNotification('${n.id}', event)">&times;</button>
                <span class="notification-card-title">${n.title}</span>
                <span class="notification-card-text">${n.text}</span>
                <span class="notification-card-time">${timeStr}</span>
            </div>
        `;
    }).join('');
}

function toggleNotificationPanel(event) {
    if (event) event.preventDefault();
    const panel = document.getElementById('notification-panel');
    const overlay = document.getElementById('notification-overlay');
    
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        panel.classList.add('open');
        overlay.style.display = 'block';
    }
}

function closeNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    const overlay = document.getElementById('notification-overlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
}

function markNotificationRead(id) {
    if (!db || !currentUser) return;
    const path = currentUser.email.replace(/\./g, '_');
    db.ref('notifications/' + path).child(id).update({
        read: true
    });
}

function handleNotificationClick(id) {
    if (!db || !currentUser) return;
    const path = currentUser.email.replace(/\./g, '_');
    
    // Mark as read in Firebase
    db.ref('notifications/' + path).child(id).update({
        read: true
    });
    
    // Fetch notification data to decide path redirection
    db.ref('notifications/' + path).child(id).once('value').then(snapshot => {
        const notif = snapshot.val();
        if (!notif) return;
        
        // Close notification panel drawer
        closeNotificationPanel();
        
        // Page navigation mapping
        if (notif.type === 'chat') {
            const opponentName = notif.relatedIdOrName;
            if (opponentName) {
                if (currentUser.role === 'tutor') {
                    openChatRoom(opponentName, currentUser.name);
                } else {
                    openChatRoom(currentUser.name, opponentName);
                }
            }
        } else if (notif.type === 'dashboard') {
            showSection('dashboard');
        } else if (notif.type === 'mypage-tutoring') {
            showSection('mypage');
            switchMyPageTab('tutoring');
        } else {
            // Title-based fallback mechanism
            const t = notif.title || '';
            if (t.includes('채팅') || t.includes('메시지') || t.includes('대화')) {
                showSection('dashboard');
            } else if (t.includes('수락') || t.includes('매칭') || t.includes('완료')) {
                showSection('dashboard');
            } else if (t.includes('신청') || t.includes('제안') || t.includes('요청')) {
                if (currentUser.role === 'tutor') {
                    showSection('dashboard');
                } else {
                    showSection('mypage');
                    switchMyPageTab('tutoring');
                }
            }
        }
    });
}

function markAllNotificationsRead() {
    if (!db || !currentUser) return;
    const path = currentUser.email.replace(/\./g, '_');
    db.ref('notifications/' + path).once('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
            Object.keys(val).forEach(key => {
                db.ref('notifications/' + path).child(key).update({
                    read: true
                });
            });
        }
    });
}

// ==========================================
// ADMIN CONSOLE MODULE & MANAGEMENT ENGINE
// ==========================================

function updateNavigationUI() {
    const loginLi = document.getElementById('nav-login');
    const dashboardLi = document.getElementById('nav-dashboard');
    const mypageLi = document.getElementById('nav-mypage');
    const adminLi = document.getElementById('nav-admin');
    const notificationsLi = document.getElementById('nav-notifications');
    
    if (currentUser) {
        if (loginLi) loginLi.style.display = 'none';
        
        if (currentUser.role === 'admin') {
            if (dashboardLi) dashboardLi.style.display = 'none';
            if (mypageLi) mypageLi.style.display = 'none';
            if (adminLi) adminLi.style.display = 'block';
            if (notificationsLi) notificationsLi.style.display = 'none'; // Admin doesn't need badging
            
            showSection('admin');
            switchAdminTab('stats');
        } else {
            if (dashboardLi) dashboardLi.style.display = 'block';
            if (mypageLi) mypageLi.style.display = 'block';
            if (adminLi) adminLi.style.display = 'none';
            if (notificationsLi) notificationsLi.style.display = 'block';
            
            updateDashboard();
            showSection('dashboard');
        }
    } else {
        if (loginLi) loginLi.style.display = 'block';
        if (dashboardLi) dashboardLi.style.display = 'none';
        if (mypageLi) mypageLi.style.display = 'none';
        if (adminLi) adminLi.style.display = 'none';
        if (notificationsLi) notificationsLi.style.display = 'none';
        
        showSection('home');
    }
}

function switchAdminTab(tabName) {
    // Hide all tab panels
    const panels = document.querySelectorAll('#section-admin .tab-panel');
    panels.forEach(p => p.style.display = 'none');
    
    // Deactivate all sidebar items
    const menuItems = document.querySelectorAll('#section-admin .menu-item');
    menuItems.forEach(m => m.classList.remove('active'));
    
    // Show current panel
    const currentPanel = document.getElementById(`admin-tab-${tabName}`);
    if (currentPanel) currentPanel.style.display = 'block';
    
    // Set current button active
    const currentBtn = document.getElementById(`admin-menu-${tabName}`);
    if (currentBtn) currentBtn.classList.add('active');
    
    // Refresh components
    if (tabName === 'stats') renderAdminDashboardStats();
    if (tabName === 'users') renderAdminUserManagement();
    if (tabName === 'suggestions') renderAdminSuggestions();
    if (tabName === 'matches') renderAdminTutoringMatches();
    if (tabName === 'reviews') renderAdminReviewManagement();
    if (tabName === 'certs') renderAdminCerts();
}

function refreshAdminConsole() {
    if (!currentUser || currentUser.role !== 'admin') return;
    renderAdminDashboardStats();
    renderAdminUserManagement();
    renderAdminSuggestions();
    renderAdminTutoringMatches();
    renderAdminReviewManagement();
    renderAdminCerts();
    
    if (db) {
        db.ref('notices').once('value', (snapshot) => {
            const val = snapshot.val();
            let list = [];
            if (val) {
                list = Object.values(val).sort((a, b) => b.timestamp - a.timestamp);
            }
            updateAdminNoticesList(list);
        });
    }
}

function renderAdminDashboardStats() {
    const statsContainer = document.getElementById('admin-stats-grid');
    if (!statsContainer) return;
    
    const totalUsers = users.length;
    const studentCount = users.filter(u => u.role === 'tutee').length;
    const tutorCount = users.filter(u => u.role === 'tutor').length;
    const matchCount = applications.filter(a => a.status === '수락됨' || a.status === 'accepted').length;
    const pendingCount = applications.filter(a => a.status === 'pending').length;
    const suggestionCount = suggestions.length;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="color: var(--primary);"><i class="fas fa-users"></i></div>
            <div class="stat-details">
                <p>전체 회원 수</p>
                <h3>${totalUsers}명</h3>
                <span class="stat-sub">학생 ${studentCount} | 선생님 ${tutorCount}</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="color: var(--secondary);"><i class="fas fa-graduation-cap"></i></div>
            <div class="stat-details">
                <p>누적 매칭 완료</p>
                <h3>${matchCount}건</h3>
                <span class="stat-sub">매칭 진행률 ${totalUsers > 0 ? Math.round((matchCount / (applications.length || 1)) * 100) : 0}%</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="color: #fbbf24;"><i class="fas fa-hourglass-half"></i></div>
            <div class="stat-details">
                <p>대기 중인 과외</p>
                <h3>${pendingCount}건</h3>
                <span class="stat-sub">수락 대기 중인 신청 목록</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="color: #ec4899;"><i class="fas fa-comment-dots"></i></div>
            <div class="stat-details">
                <p>건의사항 문의 건수</p>
                <h3>${suggestionCount}건</h3>
                <span class="stat-sub">답변 완료 ${suggestions.filter(s => s.reply).length} | 대기 ${suggestions.filter(s => !s.reply).length}</span>
            </div>
        </div>
    `;
}

let selectedAdminUserFilter = 'all';

function handleAdminUserFilterChange(value) {
    selectedAdminUserFilter = value;
    renderAdminUserManagement();
}

function renderAdminUserManagement() {
    const container = document.getElementById('admin-users-list');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-muted);">가입된 회원이 없습니다.</p>`;
        return;
    }
    
    let filteredUsers = users.filter(u => u.role !== 'admin');
    if (selectedAdminUserFilter === 'tutee') {
        filteredUsers = filteredUsers.filter(u => u.role === 'tutee');
    } else if (selectedAdminUserFilter === 'tutor') {
        filteredUsers = filteredUsers.filter(u => u.role === 'tutor');
    }
    
    const studentCount = users.filter(u => u.role === 'tutee').length;
    const tutorCount = users.filter(u => u.role === 'tutor').length;
    const totalActiveCount = studentCount + tutorCount;
    
    const countText = `전체 ${totalActiveCount}명 (학생 ${studentCount}명 | 선생님 ${tutorCount}명)`;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">
                <i class="fas fa-users" style="color: var(--primary); margin-right: 6px;"></i>${countText}
            </div>
            <div class="filter-wrapper" style="display: flex; align-items: center; gap: 8px; background: white; padding: 0.5rem 1rem; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: var(--shadow-sm); margin: 0; width: fit-content;">
                <i class="fas fa-filter" style="color: var(--primary); font-size: 0.9rem;"></i>
                <span style="font-weight: 700; color: var(--text-main); font-size: 0.9rem; white-space: nowrap;">회원 유형 분류:</span>
                <select id="admin-user-filter-select" onchange="handleAdminUserFilterChange(this.value)" style="padding: 0.3rem 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; font-weight: 600; font-size: 0.85rem; cursor: pointer; color: var(--text-main); outline: none;">
                    <option value="all">전체보기</option>
                    <option value="tutee">학생만 보기 (Tutee)</option>
                    <option value="tutor">선생님만 보기 (Tutor)</option>
                </select>
            </div>
        </div>
        
        ${filteredUsers.length === 0 ? `
            <div class="empty-state" style="padding: 3rem 1rem; text-align: center; border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc;">
                <i class="fas fa-user-slash empty-icon" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 0.5rem; display: block; opacity: 0.6;"></i>
                <p style="font-size: 0.95rem; color: var(--text-muted); font-weight: 500;">조건에 맞는 회원이 존재하지 않습니다.</p>
            </div>
        ` : `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>이름 (역할)</th>
                        <th>이메일</th>
                        <th>지역</th>
                        <th>상태</th>
                        <th>관리 동작</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredUsers.map(u => {
                        const isSuspended = u.status === 'suspended';
                        return `
                            <tr>
                                <td><strong>${u.name}</strong> (${u.role === 'tutor' ? '선생님' : '학생'})</td>
                                <td>${u.email}</td>
                                <td>${u.region || '미지정'} ${u.subRegion || ''}</td>
                                <td><span class="tag" style="background:${isSuspended ? '#fee2e2; color:#ef4444;' : '#d1fae5; color:#065f46;'}">${isSuspended ? '정지됨' : '활동 중'}</span></td>
                                <td>
                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                        ${isSuspended ? 
                                            `<button class="btn primary" onclick="setUserStatus('${u.email}', 'active')" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:var(--secondary); margin:0;">정지 해제</button>` : 
                                            `<button class="btn secondary" onclick="setUserStatus('${u.email}', 'suspended')" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:#fee2e2; color:#ef4444; border: 1px solid #fecdd3; margin:0;">계정 정지</button>`
                                        }
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `}
    `;
    
    const select = document.getElementById('admin-user-filter-select');
    if (select) select.value = selectedAdminUserFilter;
}

function setUserStatus(email, status) {
    if (!db) return;
    const confirmMsg = status === 'suspended' ? '정말 이 계정을 정지 처리하시겠습니까?' : '정말 이 계정의 정지를 해제하시겠습니까?';
    if (!confirm(confirmMsg)) return;
    
    const path = email.replace(/\./g, '_');
    db.ref('users/' + path).update({
        status: status
    });
    alert('계정 상태가 변경되었습니다.');
}



function renderAdminSuggestions() {
    const container = document.getElementById('admin-suggestions-list');
    if (!container) return;
    
    if (suggestions.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-muted);">접수된 건의사항이 없습니다.</p>`;
        return;
    }
    
    const sorted = [...suggestions].sort((a, b) => {
        if (!a.reply && b.reply) return -1;
        if (a.reply && !b.reply) return 1;
        return b.id - a.id;
    });
    
    container.innerHTML = sorted.map(s => {
        return `
            <div class="suggestion-ticket-card" style="margin-bottom: 1.5rem;">
                <div class="suggestion-ticket-header">
                    <span class="suggestion-ticket-date"><i class="far fa-user" style="margin-right: 6px;"></i>${s.userEmail} | ${s.date}</span>
                    <span class="suggestion-status-tag ${s.reply ? 'answered' : 'pending'}">${s.reply ? '답변 완료' : '답변 대기'}</span>
                </div>
                <div class="suggestion-ticket-body">
                    <p style="margin: 0 0 1rem 0; white-space: pre-wrap; font-weight: 500;">${s.text}</p>
                    ${s.image ? `<img src="${s.image}" class="suggestion-ticket-image" style="max-height: 120px; display:block; margin-bottom: 1rem;">` : ''}
                </div>
                
                <div style="background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1px solid #cbd5e1; margin-top: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: var(--primary);"><i class="fas fa-edit"></i> 답변 등록 및 수정</h4>
                    <form onsubmit="handleAdminReplySubmit(${s.id}, event)" style="display:flex; gap:0.5rem; margin:0; align-items:center;">
                        <textarea id="reply-input-${s.id}" rows="2" style="flex:1; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical;" placeholder="건의사항에 대한 답변을 입력해 주세요..." required>${s.reply || ''}</textarea>
                        <button type="submit" class="btn primary" style="padding: 0.6rem 1rem; margin: 0; font-size: 0.95rem; height: 100%;">등록</button>
                    </form>
                </div>
            </div>
        `;
    }).join('');
}

function handleAdminReplySubmit(id, event) {
    event.preventDefault();
    const input = document.getElementById(`reply-input-${id}`);
    if (!input || !input.value.trim() || !db) return;
    
    db.ref('suggestions/' + id).update({
        reply: input.value.trim()
    });
    alert('답변이 등록되었습니다.');
}

function renderAdminTutoringMatches() {
    const container = document.getElementById('admin-matches-list');
    if (!container) return;
    
    if (applications.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-muted);">접수된 과외 및 제안 목록이 없습니다.</p>`;
        return;
    }
    
    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>학생 이름</th>
                    <th>신청 과목</th>
                    <th>매칭된 선생님</th>
                    <th>매칭 상태</th>
                    <th>관리 동작</th>
                </tr>
            </thead>
            <tbody>
                ${applications.map(a => {
                    const isAccepted = a.status === '수락됨' || a.status === 'accepted';
                    return `
                        <tr>
                            <td><strong>${a.name}</strong> (${a.region || '지역 미정'} ${a.subRegion || ''})</td>
                            <td>
                                <div>${a.subject}</div>
                                ${a.request ? `<div style="font-size:0.8rem; color:#475569; margin-top: 3.5px; max-width: 250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight: 500;" title="${a.request}">요청: ${a.request}</div>` : ''}
                            </td>
                            <td>${isAccepted ? `<span style="font-weight:700; color:var(--primary);">${a.tutorName} 선생님</span>` : '<span style="color:var(--text-muted);">미배정 (공개제안)</span>'}</td>
                            <td><span class="tag" style="background:${isAccepted ? '#d1fae5; color:#065f46;' : '#fef3c7; color:#b45309;'}">${isAccepted ? '매칭 성공' : '대기 중'}</span></td>
                            <td>
                                <button class="btn secondary" onclick="deleteTutoringAdmin('${a.id}')" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:#fee2e2; color:#ef4444; border: 1px solid #fecdd3; margin:0;"><i class="fas fa-trash"></i> 삭제</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function deleteTutoringAdmin(id) {
    if (!db) return;
    if (!confirm('경고: 이 수업/신청 건을 관리자 권한으로 강제 삭제하시겠습니까?\n삭제 후에는 대화방 등 관련 데이터가 복구되지 않습니다.')) return;
    
    db.ref('applications').child(id).remove();
    alert('삭제가 완료되었습니다.');
}

function updateAdminNoticesList(list) {
    const container = document.getElementById('admin-notices-list-container');
    if (!container) return;
    
    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-muted);">등록된 공지사항이 없습니다.</p>`;
        return;
    }
    
    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>날짜</th>
                    <th>제목</th>
                    <th>동작</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(n => `
                    <tr>
                        <td style="width: 120px; font-size: 0.85rem; color: var(--text-muted);">${new Date(n.timestamp).toLocaleDateString()}</td>
                        <td><strong>${n.title}</strong></td>
                        <td>
                            <button class="btn secondary" onclick="deleteNoticeAdmin('${n.id}')" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:#fee2e2; color:#ef4444; border: 1px solid #fecdd3; margin:0;"><i class="fas fa-trash"></i> 삭제</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteNoticeAdmin(id) {
    if (!db) return;
    if (!confirm('정말 이 공지사항을 제거하시겠습니까?')) return;
    
    db.ref('notices').child(id).remove();
    alert('공지사항이 정상 제거되었습니다.');
}

function renderAdminReviewManagement() {
    const container = document.getElementById('admin-reviews-list');
    if (!container) return;
    
    if (reviews.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-muted);">작성된 선생님 후기가 없습니다.</p>`;
        return;
    }
    
    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>선생님 / 학생</th>
                    <th>별점</th>
                    <th>후기 내용</th>
                    <th>관리 동작</th>
                </tr>
            </thead>
            <tbody>
                ${reviews.map(r => {
                    const rId = r.id || `rev_${r.tutorName}_${r.studentName}_${r.text.substring(0,5)}`;
                    return `
                        <tr>
                            <td><strong>${r.tutorName} 선생님</strong><br><span style="font-size:0.85rem; color:var(--text-muted);">${r.studentName} 학생</span></td>
                            <td><span style="color:#fbbf24;">${'★'.repeat(r.rating)}</span></td>
                            <td><div style="font-size:0.9rem; max-width: 280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.text}">${r.text}</div></td>
                            <td>
                                <button class="btn secondary" onclick="deleteReviewAdmin('${rId}')" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:#fee2e2; color:#ef4444; border: 1px solid #fecdd3; margin:0;"><i class="fas fa-trash"></i> 블라인드</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function deleteReviewAdmin(id) {
    if (!db) return;
    if (!confirm('정말 이 후기를 부적절한 노출물로 판단하여 영구 삭제(블라인드) 하시겠습니까?')) return;
    
    db.ref('reviews').child(id).remove();
    alert('후기가 성공적으로 제거되었습니다.');
}

function handlePostNotice(event) {
    event.preventDefault();
    const titleInput = document.getElementById('notice-title');
    const contentInput = document.getElementById('notice-content');
    if (!titleInput || !contentInput || !db) return;
    
    const id = "notice_" + Date.now();
    const newNotice = {
        id: id,
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        timestamp: Date.now()
    };
    
    db.ref('notices').child(id).set(newNotice);
    
    titleInput.value = '';
    contentInput.value = '';
    alert('공지사항이 정상 게시되었습니다.');
}

function renderHomeNotices(list) {
    const container = document.getElementById('notice-banner-container');
    if (!container) return;
    
    if (list.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = `
        <div class="notice-box-wrapper" style="background: #fffbeb; border: 1px solid #fde68a; padding: 1.25rem 1.75rem; border-radius: 16px; margin-bottom: 1.5rem; box-shadow: var(--shadow-sm);">
            <h3 style="margin-top: 0; margin-bottom: 0.75rem; color: #d97706; display: flex; align-items: center; gap: 8px; font-size: 1.15rem;"><i class="fas fa-bullhorn"></i> 공지사항</h3>
            <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                ${list.map((n, idx) => `
                    <div style="border-bottom: ${idx === list.length - 1 ? 'none' : '1px dashed #fcd34d'}; padding-bottom: ${idx === list.length - 1 ? '0' : '0.5rem'};">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                            <strong style="color: #92400e; font-size: 0.95rem;">${n.title}</strong>
                            <span style="font-size: 0.8rem; color: #b45309; font-weight: 500;">${new Date(n.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p style="margin: 0.35rem 0 0 0; font-size: 0.9rem; color: #78350f; white-space: pre-wrap; line-height: 1.5; font-weight: 500;">${n.content}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function showSubjectSelectionModal(tutorName, subjects, callback) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(15, 23, 42, 0.6)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '2000';
    overlay.style.animation = 'fadeIn 0.2s ease';
    
    const card = document.createElement('div');
    card.style.background = '#ffffff';
    card.style.padding = '2rem';
    card.style.borderRadius = '20px';
    card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    card.style.width = '90%';
    card.style.maxWidth = '400px';
    card.style.textAlign = 'center';
    card.style.boxSizing = 'border-box';
    
    const title = document.createElement('h3');
    title.innerText = '신청할 과목 선택';
    title.style.margin = '0 0 0.5rem 0';
    title.style.color = '#1e293b';
    title.style.fontSize = '1.35rem';
    title.style.fontWeight = '800';
    
    const desc = document.createElement('p');
    desc.innerText = `${tutorName} 선생님이 담당하시는 과목 중 신청할 과목을 하나 선택해 주세요.`;
    desc.style.margin = '0 0 1.5rem 0';
    desc.style.color = '#64748b';
    desc.style.fontSize = '0.9rem';
    desc.style.lineHeight = '1.5';
    desc.style.fontWeight = '500';
    
    const select = document.createElement('select');
    select.style.width = '100%';
    select.style.padding = '0.75rem';
    select.style.borderRadius = '10px';
    select.style.border = '1px solid #e2e8f0';
    select.style.background = '#f8fafc';
    select.style.fontSize = '0.95rem';
    select.style.fontWeight = '600';
    select.style.color = '#1e293b';
    select.style.marginBottom = '1.5rem';
    select.style.outline = 'none';
    
    subjects.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        select.appendChild(opt);
    });
    
    const btns = document.createElement('div');
    btns.style.display = 'flex';
    btns.style.gap = '0.5rem';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = '취소';
    cancelBtn.style.flex = '1';
    cancelBtn.style.padding = '0.75rem';
    cancelBtn.style.borderRadius = '10px';
    cancelBtn.style.border = '1px solid #cbd5e1';
    cancelBtn.style.background = '#ffffff';
    cancelBtn.style.color = '#64748b';
    cancelBtn.style.fontWeight = '600';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    const confirmBtn = document.createElement('button');
    confirmBtn.innerText = '신청하기';
    confirmBtn.style.flex = '1';
    confirmBtn.style.padding = '0.75rem';
    confirmBtn.style.borderRadius = '10px';
    confirmBtn.style.border = 'none';
    confirmBtn.style.background = 'var(--secondary)';
    confirmBtn.style.color = '#ffffff';
    confirmBtn.style.fontWeight = '600';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.onclick = () => {
        callback(select.value);
        document.body.removeChild(overlay);
    };
    
    btns.appendChild(cancelBtn);
    btns.appendChild(confirmBtn);
    
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(select);
    card.appendChild(btns);
    overlay.appendChild(card);
    
    document.body.appendChild(overlay);
}

// ==========================================================================
// Weekly Availability Timetable Drag & Drop Match System Logic
// ==========================================================================
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };

function renderAvailabilityGrid(tableId, isEditable, savedAvailability = [], targetAvailability = null) {
    const table = document.getElementById(tableId);
    if (!table) return;
    table.innerHTML = '';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const timeTh = document.createElement('th');
    timeTh.innerText = '시간';
    timeTh.style.width = '85px';
    headerRow.appendChild(timeTh);
    
    DAYS.forEach(day => {
        const th = document.createElement('th');
        th.innerText = DAY_LABELS[day];
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    for (let slot = 16; slot < 48; slot++) {
        const tr = document.createElement('tr');
        
        const timeTd = document.createElement('td');
        timeTd.className = 'time-label';
        const startHour = String(Math.floor(slot / 2)).padStart(2, '0');
        const startMin = (slot % 2 === 0) ? '00' : '30';
        const endHour = String(Math.floor((slot + 1) / 2)).padStart(2, '0');
        const endMin = ((slot + 1) % 2 === 0) ? '00' : '30';
        timeTd.innerText = `${startHour}:${startMin}~${endHour}:${endMin}`;
        tr.appendChild(timeTd);
        
        DAYS.forEach(day => {
            const td = document.createElement('td');
            td.className = 'slot';
            td.dataset.day = day;
            td.dataset.slot = slot;
            
            const slotKey = `${day}-${slot}`;
            
            if (targetAvailability) {
                const isTargetFree = targetAvailability.includes(slotKey);
                const isMeFree = savedAvailability.includes(slotKey);
                if (isTargetFree && isMeFree) {
                    td.classList.add('overlap');
                } else if (isTargetFree) {
                    td.classList.add('target-available');
                }
            } else {
                if (savedAvailability.includes(slotKey)) {
                    td.classList.add('selected');
                }
            }
            
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    
    if (isEditable) {
        let isDragging = false;
        let dragPath = [];
        let initialStates = new Map();
        
        const slots = table.querySelectorAll('td.slot');
        
        const startDrag = (cell) => {
            isDragging = true;
            dragPath = [cell];
            initialStates.clear();
            initialStates.set(cell, cell.classList.contains('selected'));
            cell.classList.toggle('selected');
        };
        
        const moveDrag = (cell) => {
            if (!isDragging) return;
            const len = dragPath.length;
            if (len > 1 && cell === dragPath[len - 2]) {
                // Backtracked! Revert the last dragged cell to its pre-drag state
                const lastCell = dragPath.pop();
                const origState = initialStates.get(lastCell);
                if (origState) {
                    lastCell.classList.add('selected');
                } else {
                    lastCell.classList.remove('selected');
                }
            } else if (cell !== dragPath[len - 1]) {
                // Entered a new cell in the drag path
                dragPath.push(cell);
                if (!initialStates.has(cell)) {
                    initialStates.set(cell, cell.classList.contains('selected'));
                }
                cell.classList.toggle('selected');
            }
        };
        
        slots.forEach(slotTd => {
            slotTd.addEventListener('mousedown', (e) => {
                e.preventDefault();
                startDrag(slotTd);
            });
            
            slotTd.addEventListener('mouseenter', () => {
                moveDrag(slotTd);
            });
        });
        
        const stopDrag = () => {
            isDragging = false;
            dragPath = [];
            initialStates.clear();
        };
        
        window.addEventListener('mouseup', stopDrag);
        
        table.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const elem = document.elementFromPoint(touch.clientX, touch.clientY);
            if (elem && elem.classList.contains('slot') && elem.closest(`#${tableId}`)) {
                e.preventDefault();
                startDrag(elem);
            }
        }, { passive: false });
        
        table.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            const elem = document.elementFromPoint(touch.clientX, touch.clientY);
            if (elem && elem.classList.contains('slot') && elem.closest(`#${tableId}`)) {
                e.preventDefault();
                moveDrag(elem);
            }
        }, { passive: false });
        
        table.addEventListener('touchend', stopDrag);
    }
}

function setAvailabilityPreset(type) {
    const table = document.getElementById('profile-availability-table');
    if (!table) return;
    const slots = table.querySelectorAll('td.slot');
    
    slots.forEach(cell => {
        const day = cell.dataset.day;
        const slot = parseInt(cell.dataset.slot);
        
        cell.classList.remove('selected');
        
        if (type === 'all') {
            cell.classList.add('selected');
        } else if (type === 'weekday-evening') {
            const isWeekday = ['mon', 'tue', 'wed', 'thu', 'fri'].includes(day);
            if (isWeekday && slot >= 36) {
                cell.classList.add('selected');
            }
        } else if (type === 'weekend-all') {
            const isWeekend = ['sat', 'sun'].includes(day);
            if (isWeekend && slot >= 18) {
                cell.classList.add('selected');
            }
        }
    });
}

function clearAvailabilityGrid() {
    const table = document.getElementById('profile-availability-table');
    if (!table) return;
    const slots = table.querySelectorAll('td.slot');
    slots.forEach(cell => cell.classList.remove('selected'));
}

function openAvailabilityDetailsModal(targetName, targetRole) {
    if (!currentUser) {
        alert('로그인 후 스케줄을 확인하실 수 있습니다.');
        return;
    }
    
    const targetUser = users.find(u => u.name && u.name.trim() === targetName.trim() && u.role === targetRole);
    if (!targetUser) {
        alert('해당 사용자의 상세 정보를 찾을 수 없습니다.');
        return;
    }
    
    const targetAvailability = targetUser.availability || [];
    const myAvailability = currentUser.availability || [];
    
    // Filter to only include slots that are actually visible (slot index >= 16)
    const overlaps = myAvailability.filter(slotKey => {
        if (!targetAvailability.includes(slotKey)) return false;
        const parts = slotKey.split('-');
        if (parts.length < 2) return false;
        const slotIdx = parseInt(parts[1], 10);
        return slotIdx >= 16;
    });
    
    const desc = document.getElementById('availability-modal-desc');
    const title = document.getElementById('availability-modal-title');
    
    title.innerHTML = `<i class="fas fa-clock" style="color:var(--primary);"></i> ${targetName} 님의 스케줄 확인`;
    
    if (overlaps.length > 0) {
        const hours = (overlaps.length * 30) / 60;
        desc.innerHTML = `<span style="color: var(--secondary); font-weight: 800;">🎉 나랑 겹치는 시간대가 총 ${hours}시간 있습니다!</span><br>초록색으로 표시된 시간대에 과외 매칭을 조율해보세요.`;
        document.getElementById('availability-legend-overlap').style.display = 'flex';
    } else {
        desc.innerHTML = `현재 나와 겹치는 시간대가 없습니다.<br>하늘색으로 표시된 ${targetName} 님의 가능 시간에 내 시간표를 맞춰보세요!`;
        if (myAvailability.length === 0) {
            desc.innerHTML = `내 프로필에서 시간표를 먼저 설정하면,<br>상대방과 겹치는 매칭 가능 시간을 실시간으로 대조해볼 수 있습니다!`;
        }
    }
    
    renderAvailabilityGrid('view-availability-table', false, myAvailability, targetAvailability);
    
    openModal('viewAvailabilityModal');
}
