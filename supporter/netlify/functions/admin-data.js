const { getDatabase } = require('./firebase-admin');

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

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return response(405, { ok: false, error: 'POST 요청만 허용됩니다.' });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    const providedPassword = event.headers['x-admin-password'] || event.headers['X-Admin-Password'];

    if (!adminPassword || providedPassword !== adminPassword) {
        return response(401, { ok: false, error: '관리자 비밀번호가 올바르지 않습니다.' });
    }

    try {
        const database = getDatabase();
        const [totalSnapshot, regionSnapshot, supportersSnapshot] = await Promise.all([
            database.ref('stats/totalCount').once('value'),
            database.ref('stats/byRegion').once('value'),
            database.ref('supporters').limitToLast(50).once('value')
        ]);

        const supporters = [];
        supportersSnapshot.forEach((child) => {
            supporters.push({
                id: child.key,
                ...child.val()
            });
        });

        supporters.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        return response(200, {
            ok: true,
            totalCount: totalSnapshot.val() || 0,
            regionStats: regionSnapshot.val() || {},
            supporters
        });
    } catch (error) {
        console.error(error);
        return response(500, { ok: false, error: '관리자 데이터를 불러오지 못했습니다.' });
    }
};
