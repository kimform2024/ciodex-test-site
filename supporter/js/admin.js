const ADMIN_SESSION_KEY = 'supporters-admin-authenticated';
const ADMIN_PASSWORD_KEY = 'supporters-admin-password';

let supportersData = [];
let regionStats = {};

function unlockAdmin() {
    const passwordInput = document.getElementById('admin-password');
    const error = document.getElementById('admin-auth-error');

    const password = passwordInput.value;

    if (!password) {
        error.textContent = '비밀번호가 올바르지 않습니다.';
        passwordInput.focus();
        return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
    document.body.classList.remove('admin-locked');
    document.getElementById('admin-auth').style.display = 'none';
    startDashboard();
}

function requireAdminAuth() {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
        document.body.classList.remove('admin-locked');
        document.getElementById('admin-auth').style.display = 'none';
        startDashboard();
        return;
    }

    document.body.classList.add('admin-locked');
    document.getElementById('admin-auth-form').addEventListener('submit', function(event) {
        event.preventDefault();
        unlockAdmin();
    });
}

function loadMockData() {
    document.getElementById('data-mode').textContent = '백엔드 미연결: 샘플 데이터 표시 중';

    supportersData = [
        {
            name: "김부산",
            region: "해운대구",
            message: "부산이 세계도시로 도약하길 기대합니다. 박형준 시장님 힘내세요!",
            timestamp: Date.now()
        },
        {
            name: "이사하",
            region: "사하구",
            message: "부산 경제 살리고, 글로벌 도시 만들어주실 분은 박형준 시장님입니다!",
            timestamp: Date.now() - 300000
        },
        {
            name: "박동래",
            region: "동래구",
            message: "아이들이 살기 좋은 세계적인 부산을 만들어 주세요. 응원합니다!",
            timestamp: Date.now() - 600000
        }
    ];

    regionStats = {
        "해운대구": 512, "부산진구": 345, "동래구": 287, "수영구": 267,
        "남구": 234, "연제구": 234, "사하구": 198, "금정구": 189,
        "사상구": 178, "영도구": 167, "기장군": 156, "서구": 145,
        "강서구": 142, "기타": 137, "북구": 123, "동구": 98
    };

    updateDashboard();
}

async function loadFirebaseData() {
    const password = sessionStorage.getItem(ADMIN_PASSWORD_KEY);

    try {
        const response = await fetch('/api/admin-data', {
            method: 'POST',
            headers: { 'X-Admin-Password': password || '' }
        });
        const result = await response.json();

        if (response.status === 401) {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
            document.body.classList.add('admin-locked');
            document.getElementById('admin-auth').style.display = 'flex';
            document.getElementById('admin-auth-error').textContent = result.error || '관리자 비밀번호가 올바르지 않습니다.';
            return;
        }

        if (!response.ok || !result.ok) {
            throw new Error(result.error || '관리자 데이터를 불러오지 못했습니다.');
        }

        document.getElementById('data-mode').textContent = '백엔드 데이터베이스 연결됨';
        regionStats = result.regionStats || {};
        supportersData = result.supporters || [];
        document.getElementById('total-supporters').textContent = (result.totalCount || 0).toLocaleString();
        document.getElementById('goal-progress').textContent = Math.round((result.totalCount || 0) / 10000 * 100) + '%';
        updateDashboard();
    } catch (error) {
        console.log('관리자 백엔드 조회 오류:', error);
        loadMockData();
    }
}

function updateDashboard() {
    updateStats();
    updateRecentSupporters();
    updateRegionStats();
}

function updateStats() {
    const total = Object.values(regionStats).reduce((a, b) => a + b, 0);
    const topRegion = Object.keys(regionStats).reduce((a, b) =>
        regionStats[a] > regionStats[b] ? a : b, "해운대구"
    );

    document.getElementById('total-supporters').textContent = total.toLocaleString();
    document.getElementById('goal-progress').textContent = Math.round(total / 10000 * 100) + '%';
    document.getElementById('top-region').textContent = topRegion;
    document.getElementById('today-supporters').textContent = getTodaySupportersCount();
}

function getTodaySupportersCount() {
    const today = new Date();
    return supportersData.filter((supporter) => {
        const createdAt = new Date(supporter.timestamp);
        return createdAt.getFullYear() === today.getFullYear()
            && createdAt.getMonth() === today.getMonth()
            && createdAt.getDate() === today.getDate();
    }).length;
}

function updateRecentSupporters() {
    const container = document.getElementById('recent-supporters');
    container.innerHTML = '';

    supportersData.slice(0, 10).forEach(supporter => {
        const item = document.createElement('div');
        const info = document.createElement('div');
        const name = document.createElement('div');
        const region = document.createElement('div');
        const message = document.createElement('div');
        const time = document.createElement('div');

        item.className = 'supporter-item';
        info.className = 'supporter-info';
        name.className = 'supporter-name';
        region.className = 'supporter-region';
        message.className = 'supporter-message';
        time.className = 'supporter-time';

        name.textContent = supporter.name || '-';
        region.textContent = supporter.region || '-';
        message.textContent = supporter.message || '';
        time.textContent = getTimeAgo(supporter.timestamp);

        info.appendChild(name);
        info.appendChild(region);
        info.appendChild(message);
        item.appendChild(info);
        item.appendChild(time);
        container.appendChild(item);
    });
}

function updateRegionStats() {
    const container = document.getElementById('region-stats');
    container.innerHTML = '';

    Object.entries(regionStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([region, count]) => {
            const item = document.createElement('div');
            const name = document.createElement('span');
            const value = document.createElement('span');

            item.className = 'region-item';
            name.className = 'region-name';
            value.className = 'region-count';
            name.textContent = region;
            value.textContent = count;

            item.appendChild(name);
            item.appendChild(value);
            container.appendChild(item);
        });
}

function getTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
}

function refreshData() {
    loadFirebaseData();
}

function exportToCSV() {
    const headers = ['이름', '지역', '메시지', '신청시간'];
    const rows = supportersData.map(s => [
        s.name,
        s.region,
        String(s.message || '').replace(/"/g, '""'),
        new Date(s.timestamp).toLocaleString('ko-KR')
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(field => `"${field}"`).join(',') + '\n';
    });

    downloadFile(csv, 'park-supporters.csv', 'text/csv');
}

function exportToExcel() {
    alert('Excel 내보내기 기능은 실제 배포 시 구현됩니다. (SheetJS 라이브러리 연동)');
}

function generateReport() {
    const total = Object.values(regionStats).reduce((a, b) => a + b, 0);
    const reportContent = `
박형준 서포터즈 현황 보고서
생성일시: ${new Date().toLocaleString('ko-KR')}

=== 요약 ===
총 서포터즈: ${total.toLocaleString()}명
목표 달성률: ${Math.round(total / 10000 * 100)}%

=== 지역별 현황 ===
${Object.entries(regionStats)
    .sort(([,a], [,b]) => b - a)
    .map(([region, count]) => `${region}: ${count}명`)
    .join('\n')}

=== 최근 신청자 ===
${supportersData.slice(0, 5).map(s =>
    `${s.name} (${s.region}): ${String(s.message || '').substring(0, 50)}...`
).join('\n')}
            `;

    downloadFile(reportContent, 'park-supporters-report.txt', 'text/plain');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function startDashboard() {
    loadFirebaseData();
    setInterval(refreshData, 30000);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('refresh-btn').addEventListener('click', refreshData);
    document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
    document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
    document.getElementById('generate-report-btn').addEventListener('click', generateReport);
    requireAdminAuth();
});
