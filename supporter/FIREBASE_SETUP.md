# 🔥 Firebase 연동 설정 가이드

## 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `park-hyungjun-supporters`
4. Google 애널리틱스: 선택 사항
5. 프로젝트 생성 완료

## 2단계: Realtime Database 설정

1. Firebase 콘솔에서 "Realtime Database" 클릭
2. "데이터베이스 만들기" 클릭
3. 보안 규칙: **"테스트 모드에서 시작"** 선택
4. 지역: `asia-southeast1 (싱가포르)` 선택
5. 완료

## 3단계: 웹 앱 등록

1. 프로젝트 개요에서 웹(</>) 아이콘 클릭
2. 앱 닉네임: `박형준 서포터즈`
3. 호스팅 설정: 나중에
4. **SDK 구성 정보 복사** (중요!)

## 4단계: 보안 규칙 설정

Realtime Database > 규칙 탭에서 다음 규칙 적용:

```json
{
  "rules": {
    "supporters": {
      ".read": "auth != null && auth.token.admin === true",
      ".write": false,
      "$id": {
        ".validate": "newData.hasChildren(['name', 'phone', 'message', 'region', 'privacyConsent', 'timestamp']) && newData.child('privacyConsent').val() === true && newData.child('name').isString() && newData.child('name').val().length <= 30 && newData.child('phone').isString() && newData.child('phone').val().matches(/^[-0-9\\s]{10,13}$/) && newData.child('message').isString() && newData.child('message').val().length <= 300 && newData.child('region').isString()"
      }
    },
    "stats": {
      ".read": true,
      ".write": false
    },
    "messages": {
      ".read": true,
      ".write": false
    }
  }
}
```

신청 저장과 카운터 증가는 Netlify Function 백엔드가 Firebase Admin SDK로 처리합니다. Firebase Admin SDK는 보안 규칙을 우회하므로 브라우저 직접 쓰기는 `false`로 막아도 됩니다.

관리자 읽기 권한을 쓰려면 Firebase Authentication과 Admin custom claim 설정이 필요합니다. 이 설정 전까지는 관리자 페이지가 Firebase 데이터를 읽지 못하고 샘플 데이터를 표시할 수 있습니다.

## 5단계: 초기 데이터 임포트

1. Database > 데이터 탭
2. ⋮ 메뉴 > "JSON 가져오기" 
3. `firebase-init.json` 파일 업로드

## 6단계: 웹 앱에 Firebase 설정 적용

1. `js/firebase-config.js` 파일 열기
2. `firebaseConfig` 객체 찾기:

```javascript
const firebaseConfig = {
    apiKey: "여기에-실제-API-키", 
    authDomain: "park-hyungjun-supporters.firebaseapp.com",
    databaseURL: "https://park-hyungjun-supporters-default-rtdb.firebaseio.com/",
    projectId: "park-hyungjun-supporters",
    storageBucket: "park-hyungjun-supporters.appspot.com", 
    messagingSenderId: "123456789",
    appId: "여기에-실제-앱-ID"
};
```

3. Firebase 콘솔에서 복사한 실제 값으로 교체

설정 파일이 분리되어 있으므로 `index.html`과 `admin.html`을 각각 수정할 필요가 없습니다.

## 7단계: Netlify 백엔드 환경변수 설정

Netlify > Site configuration > Environment variables에 다음 값을 등록하세요.

```text
FIREBASE_DATABASE_URL=https://프로젝트ID-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account", ...}
ADMIN_PASSWORD=강한_관리자_비밀번호
```

`FIREBASE_SERVICE_ACCOUNT_JSON`은 Firebase Console > Project settings > Service accounts > Generate new private key에서 받은 JSON 전체를 한 줄 문자열로 넣으면 됩니다.

개별 변수로 나누고 싶다면 다음 방식도 지원합니다.

```text
FIREBASE_PROJECT_ID=프로젝트ID
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@프로젝트ID.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_DATABASE_URL=https://프로젝트ID-default-rtdb.firebaseio.com
ADMIN_PASSWORD=강한_관리자_비밀번호
```

## 8단계: 관리자 비밀번호 변경

1. Netlify 환경변수 `ADMIN_PASSWORD`를 실제 비밀번호로 설정
2. `netlify.toml`의 Basic Auth 값도 같은 수준의 강한 값으로 변경:

```toml
Basic-Auth = "admin:change-this-admin-password"
```

관리자 데이터 조회 함수는 `ADMIN_PASSWORD` 환경변수와 사용자가 입력한 비밀번호를 비교합니다. `netlify.toml`의 Basic Auth는 관리자 페이지 자체 접근을 한 번 더 막는 보호 장치입니다.

## 9단계: 도메인 인증 (선택사항)

Firebase 콘솔 > Authentication > Settings > 승인된 도메인에 다음 추가:
- `localhost` (개발용)
- `your-site.netlify.app` (배포용)
- 커스텀 도메인 (있는 경우)

## 배포 후 확인사항

✅ 서포터즈 신청 시 Firebase에 데이터 저장되는지 확인  
✅ 실시간 카운터 업데이트 확인  
✅ 관리자 대시보드에서 데이터 조회 확인  
✅ 지역별 통계 정상 작동 확인

## 문제해결

**Q: 데이터가 저장되지 않아요**
A: 브라우저 콘솔에서 오류 확인, 보안 규칙 및 Firebase 설정 재확인

**Q: 실시간 업데이트가 안 돼요** 
A: 네트워크 연결 확인, Firebase SDK 버전 확인

**Q: 관리자 대시보드가 빈 화면이에요**
A: Firebase 설정이 index.html과 admin.html 모두 동일한지 확인

## 고급 설정 (선택)

### 서버 타임스탬프 사용
```javascript
firebase.database.ServerValue.TIMESTAMP
```

### 오프라인 지원
```javascript
database.goOffline(); // 오프라인 모드
database.goOnline();  // 온라인 모드  
```

### 실시간 리스너 최적화
```javascript
database.ref('supporters').limitToLast(50).on('value', callback);
```

---

🎯 **모든 설정이 완료되면 실시간으로 데이터가 쌓이는 완전한 서포터즈 앱이 됩니다!**
