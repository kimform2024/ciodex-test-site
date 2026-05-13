const database = initializeDatabase();

let count = 25000;
let selectedRegion = '해운대구';
let shareUrl = window.location.href;

function loadSupportersCount() {
    if (database) {
        database.ref('stats/totalCount').on('value', (snapshot) => {
            const value = snapshot.val() || 0;
            updateCounter(value);
        });
        return;
    }

    updateCounter(25000);
}

document.querySelectorAll('#region-tags .tag').forEach(function(t) {
    t.addEventListener('click', function() {
        document.querySelectorAll('#region-tags .tag').forEach(function(x) {
            x.classList.remove('active');
        });
        t.classList.add('active');
        selectedRegion = t.dataset.r;
        document.getElementById('inp-region').value = selectedRegion;
    });
});

function updateCounter(n) {
    count = n;
    document.getElementById('counter').textContent = n.toLocaleString();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function() {
        toast.classList.remove('show');
    }, 2800);
}

async function submitForm(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const name = document.getElementById('inp-name').value.trim();
    const phone = document.getElementById('inp-phone').value.trim();
    const msg = document.getElementById('inp-msg').value.trim();
    const privacyConsent = document.getElementById('privacy-consent').checked;

    if (form.elements['bot-field'] && form.elements['bot-field'].value) return;
    if (!name) { showToast('이름을 입력해 주세요'); return; }
    if (!phone) { showToast('연락처를 입력해 주세요'); return; }
    if (!/^[0-9\-\s]{10,13}$/.test(phone)) { showToast('올바른 연락처를 입력해 주세요'); return; }
    if (!msg) { showToast('응원 메시지를 입력해 주세요'); return; }
    if (!privacyConsent) { showToast('개인정보 수집 및 이용에 동의해 주세요'); return; }

    document.getElementById('inp-timestamp').value = new Date().toISOString();

    if (submitButton) submitButton.disabled = true;

    try {
        const saveResponse = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(new FormData(form)).toString()
        });

        if (!saveResponse.ok) {
            showToast('신청 정보를 저장하지 못했습니다');
            return;
        }
    } catch (error) {
        console.log('Netlify 폼 제출 오류:', error);
        showToast('신청 정보를 저장하지 못했습니다');
        return;
    } finally {
        if (submitButton) submitButton.disabled = false;
    }

    addToFeed(name, selectedRegion, msg);

    form.reset();
    selectedRegion = '해운대구';
    document.querySelectorAll('#region-tags .tag').forEach(function(x) {
        x.classList.toggle('active', x.dataset.r === selectedRegion);
    });
    document.getElementById('inp-region').value = selectedRegion;
    showToast('서포터즈 신청이 완료되었습니다');
}

function addToFeed(name, region, message) {
    const feed = document.getElementById('feed');
    const item = document.createElement('div');
    const avatar = document.createElement('div');
    const body = document.createElement('div');
    const meta = document.createElement('div');
    const nameEl = document.createElement('span');
    const regionEl = document.createElement('span');
    const msgEl = document.createElement('div');
    const timeEl = document.createElement('div');
    const newLabel = document.createElement('span');

    item.className = 'feed-item';
    item.style.borderLeft = '2px solid #DC2626';
    avatar.className = 'avatar';
    avatar.textContent = name.charAt(0);
    nameEl.className = 'feed-name';
    nameEl.textContent = name;
    regionEl.className = 'feed-region';
    regionEl.textContent = region;
    msgEl.className = 'feed-msg';
    msgEl.textContent = message;
    timeEl.className = 'feed-time';
    timeEl.textContent = '방금 전 ';
    newLabel.style.color = '#B91C1C';
    newLabel.style.fontSize = '11px';
    newLabel.style.marginLeft = '4px';
    newLabel.textContent = '새 서포터즈';

    meta.appendChild(nameEl);
    meta.appendChild(regionEl);
    timeEl.appendChild(newLabel);
    body.appendChild(meta);
    body.appendChild(msgEl);
    body.appendChild(timeEl);
    item.appendChild(avatar);
    item.appendChild(body);
    feed.insertBefore(item, feed.firstChild);
}

function copyLink() {
    const linkText = shareUrl + '?ref=' + selectedRegion;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(linkText).then(function() {
            showToast('링크 복사 완료');
        }).catch(function() {
            showToast('링크: ' + linkText);
        });
        return;
    }

    showToast('링크: ' + linkText);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('supporters-form').addEventListener('submit', submitForm);
    document.getElementById('copy-link-btn').addEventListener('click', copyLink);
    loadSupportersCount();
    setTimeout(function() {
        if (count === 0) updateCounter(25000);
    }, 1000);
});
