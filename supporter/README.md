# 🚀 Netlify 배포 가이드

## 준비 파일 목록
```
박형준-서포터즈-앱/
├── index.html          (메인 앱)
├── admin.html          (관리자 대시보드)
├── js/
│   ├── firebase-config.js (Firebase 공통 설정)
│   ├── main.js            (메인 신청 페이지 동작)
│   └── admin.js           (관리자 대시보드 동작)
├── netlify/
│   └── functions/
│       ├── firebase-admin.js   (Firebase Admin 초기화)
│       ├── submit-supporter.js (서포터즈 신청 저장 API)
│       └── admin-data.js       (관리자 데이터 조회 API)
├── package.json         (백엔드 함수 의존성)
├── netlify.toml        (Netlify 설정)
├── firebase-init.json  (Firebase 초기 데이터)
├── FIREBASE_SETUP.md   (Firebase 설정 가이드)
└── README.md          (이 파일)
```

## 방법 1: 드래그 앤 드롭 배포 (가장 쉬움)

1. [netlify.com](https://netlify.com) 가입/로그인
2. 대시보드 하단 "Deploy" 영역에 **폴더 전체를 드래그**
3. 자동 배포 완료 (30초 소요)
4. 생성된 URL 확인: `https://random-name-123.netlify.app`

## 로컬 실행

백엔드 함수까지 함께 테스트하려면 Netlify CLI로 실행하세요.

```bash
npm install
npm install -g netlify-cli
netlify dev
```

브라우저에서 Netlify CLI가 표시한 로컬 주소를 열면 `/api/submit-supporter`, `/api/admin-data` 함수까지 같이 동작합니다.

## 방법 2: GitHub 연동 배포 (추천)

### 2-1. GitHub 레포 생성
```bash
git init
git add .
git commit -m "박형준 서포터즈 앱 초기 버전"
git branch -M main
git remote add origin https://github.com/당신계정/park-supporters.git
git push -u origin main
```

### 2-2. Netlify에서 레포 연결
1. Netlify 대시보드 > "New site from Git"
2. GitHub 선택 > 레포 선택
3. Build settings:
   - Build command: (비워둠)
   - Publish directory: `.` 
4. "Deploy site" 클릭

### 2-3. 자동 배포 확인
- GitHub에 새 커밋 푸시할 때마다 자동 재배포
- 배포 로그에서 상태 확인 가능

## 방법 3: CLI 배포

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로그인
netlify login

# 배포
netlify deploy --prod --dir .
```

## 배포 후 설정

### 1. 커스텀 도메인 연결 (선택)
1. 도메인 구매: `supporters.박형준.kr` 등
2. Netlify 사이트 설정 > Domain management
3. "Add custom domain" > 도메인 입력
4. DNS 설정: `CNAME` 레코드 추가

### 2. OG 이미지 업로드
1. 박형준 후보 캠페인 이미지 준비 (1200x630px)
2. Netlify 사이트에 `og-image.jpg` 업로드
3. `index.html`의 og:image URL 실제 도메인으로 수정

### 3. 관리자 비밀번호 변경
배포 전 반드시 다음 두 곳의 기본 비밀번호를 변경하세요.

- Netlify 환경변수 `ADMIN_PASSWORD`
- `netlify.toml`의 `Basic-Auth`

관리자 데이터 조회 API는 사용자가 입력한 비밀번호를 서버 환경변수 `ADMIN_PASSWORD`와 비교합니다. Netlify Basic Auth는 관리자 페이지 자체 접근을 한 번 더 막는 보호 장치입니다.

### 4. 개인정보 안내 확인
신청 폼에는 이름, 연락처, 지역, 응원 메시지 수집 동의 문구가 포함되어 있습니다. 실제 운영 전에는 캠페인 정책에 맞게 보관 기간, 삭제 요청 방법, 담당자 연락처를 확정해 문구를 조정하세요.

### 5. Netlify Forms 설정 확인
- Netlify 대시보드 > Site overview > Forms
- 서포터즈 신청 시 자동으로 이메일/Slack 알림 설정 가능

### 6. Firebase 설정
메인 페이지의 실시간 카운터 읽기용 Firebase 값은 `js/firebase-config.js` 한 곳에서 관리합니다. Firebase 콘솔에서 복사한 실제 웹 앱 설정값으로 placeholder를 교체하세요.

백엔드 저장 API는 Firebase Admin SDK를 사용합니다. Netlify 환경변수에 다음 값을 등록하세요.

```text
FIREBASE_DATABASE_URL=https://프로젝트ID-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account", ...}
ADMIN_PASSWORD=강한_관리자_비밀번호
```

## 성능 최적화

### 1. 이미지 최적화
```toml
# netlify.toml에 추가
[[plugins]]
  package = "netlify-plugin-image-optim"
```

### 2. 캐싱 설정 (이미 netlify.toml에 포함)
- HTML: 1시간
- CSS/JS: 24시간  
- 이미지: 7일

### 3. 폼 제출 최적화
```html
<!-- Netlify Forms 향상 -->
<form name="supporters" netlify-honeypot="bot-field" data-netlify="true">
  <input type="hidden" name="form-name" value="supporters" />
  <!-- 봇 방지 필드 -->
  <div style="display: none;">
    <label>Don't fill this out: <input name="bot-field" /></label>
  </div>
  <!-- 기존 필드들... -->
</form>
```

## 모니터링 & 분석

### 1. Netlify Analytics 활성화
- Site settings > Analytics > Enable

### 2. Google Analytics 추가 (선택)
```html
<!-- index.html <head>에 추가 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. 실시간 알림 설정
- Netlify > Site settings > Build & deploy > Deploy notifications
- Slack/이메일로 배포 완료 알림 가능

## 보안 강화

### 1. 헤더 보안 (이미 netlify.toml에 포함)
- XSS 보호
- 콘텐츠 타입 보호  
- 레퍼러 정책

### 2. 폼 스팸 방지
- Netlify Forms 자동 스팸 필터링
- Recaptcha 연동 가능

### 3. 관리자 페이지 보호
`netlify.toml`에 `/admin.html`과 `/admin` Basic Auth 설정이 들어 있습니다. 배포 전 기본 계정과 비밀번호를 반드시 교체하세요.

### 4. Firebase 보안 규칙
신청 저장과 카운터 증가는 Netlify Functions 백엔드가 처리합니다. `FIREBASE_SETUP.md`의 규칙처럼 브라우저 직접 쓰기는 막고, 공개 페이지에는 `stats` 읽기만 허용하는 구성을 권장합니다.

## 트러블슈팅

**Q: 배포는 되는데 흰 화면만 나와요**
A: 브라우저 개발자 도구에서 콘솔 오류 확인, 파일 경로 문제일 가능성

**Q: 폼 제출이 안 돼요**  
A: `netlify.toml` 파일 확인, 폼에 `data-netlify="true"` 속성 확인

**Q: Firebase 연결이 안 돼요**
A: Firebase 설정값 확인, 도메인 인증 필요할 수 있음

**Q: 커스텀 도메인 SSL 오류**
A: DNS 전파 대기 (최대 24시간), Netlify에서 자동 SSL 발급됨

## 성공 확인 체크리스트

✅ 사이트가 정상적으로 로드됨  
✅ 서포터즈 신청 폼이 작동함  
✅ 실시간 카운터가 업데이트됨  
✅ 관리자 대시보드 접근 가능  
✅ 모바일에서도 정상 표시  
✅ 소셜 공유 링크들이 정상 작동  
✅ OG 태그로 카톡 공유 시 미리보기 표시  

🎉 **축하합니다! 완전한 서포터즈 앱이 배포되었습니다!**
