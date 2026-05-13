const { getDatabase } = require('./firebase-admin');

const ALLOWED_REGIONS = new Set([
    '강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구',
    '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '해운대구', '기타'
]);

function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        },
        body: JSON.stringify(body)
    };
}

function parseBody(event) {
    if (!event.body) return {};
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';

    if (contentType.includes('application/json')) {
        return JSON.parse(event.body);
    }

    return Object.fromEntries(new URLSearchParams(event.body));
}

function clean(value) {
    return String(value || '').trim();
}

function validate(data) {
    const name = clean(data.name);
    const phone = clean(data.phone);
    const message = clean(data.message);
    const region = clean(data.region);
    const privacyConsent = data.privacyConsent === true || data.privacyConsent === 'on' || data.privacyConsent === 'true';

    if (clean(data['bot-field'])) return { ok: false, status: 204, error: 'bot' };
    if (!name || name.length > 30) return { ok: false, status: 400, error: '이름을 확인해 주세요.' };
    if (!/^[-0-9\s]{10,13}$/.test(phone)) return { ok: false, status: 400, error: '연락처를 확인해 주세요.' };
    if (!message || message.length > 300) return { ok: false, status: 400, error: '응원 메시지를 확인해 주세요.' };
    if (!ALLOWED_REGIONS.has(region)) return { ok: false, status: 400, error: '지역을 확인해 주세요.' };
    if (!privacyConsent) return { ok: false, status: 400, error: '개인정보 수집 및 이용 동의가 필요합니다.' };

    return {
        ok: true,
        data: {
            name,
            phone,
            message,
            region,
            privacyConsent: true,
            createdAt: new Date().toISOString(),
            timestamp: Date.now()
        }
    };
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return response(405, { ok: false, error: 'POST 요청만 허용됩니다.' });
    }

    try {
        const body = parseBody(event);
        const validation = validate(body);

        if (!validation.ok) {
            if (validation.status === 204) return { statusCode: 204, body: '' };
            return response(validation.status, { ok: false, error: validation.error });
        }

        const database = getDatabase();
        const supporterRef = database.ref('supporters').push();
        await supporterRef.set(validation.data);
        await database.ref('stats/totalCount').transaction((current) => (current || 0) + 1);
        await database.ref(`stats/byRegion/${validation.data.region}`).transaction((current) => (current || 0) + 1);

        return response(200, {
            ok: true,
            id: supporterRef.key,
            supporter: {
                name: validation.data.name,
                region: validation.data.region,
                message: validation.data.message,
                timestamp: validation.data.timestamp
            }
        });
    } catch (error) {
        console.error(error);
        return response(500, { ok: false, error: '신청 정보를 저장하지 못했습니다.' });
    }
};
