// ======================== 核心模块 ========================
(function() {
    let allWords = [];
    let currentView = 'all';
    let currentSearch = '';
    let levelFilters = {};
    let availableLevels = new Set();

    // ======================== 发音 ========================
    window.playAudio = function(word, type, event) {
        if (event) event.stopPropagation();
        if (!word) return;
        const audio = document.getElementById('globalAudio');
        audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`;
        audio.play().catch(() => {
            const utter = new SpeechSynthesisUtterance(word);
            utter.lang = type === 1 ? 'en-GB' : 'en-US';
            speechSynthesis.cancel();
            speechSynthesis.speak(utter);
        });
    };

    window.speakSentence = function(sentence, event) {
        if (event) event.stopPropagation();
        if (!sentence || sentence === '无例句') return;
        const utter = new SpeechSynthesisUtterance(sentence);
        utter.lang = 'en-US';
        utter.rate = 0.85;
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
    };

    window.escapeHtml = function(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    };

    // ======================== 更新统计 ========================
    window.updateGlobalStats = function() {
        const total = allWords.length;
        const statsDiv = document.getElementById('globalStats');
        if (statsDiv) {
            statsDiv.innerHTML = `📊 总单词 ${total} | ⭐ ${window.favorites?.length || 0} | ❌ ${window.wrongWords?.length || 0} | ✅ ${window.mastered?.length || 0}`;
        }
    };

    // ======================== 模态框 ========================
    window.showModal = function(wordObj) {
        document.getElementById('modalWord').innerText = wordObj.word;
        document.getElementById('modalPhonetic').innerText = wordObj.phonetic || '';
        document.getElementById('modalMeaning').innerHTML = '📖 ' + (wordObj.meaning || '');
        document.getElementById('modalSentenceEn').innerHTML = wordObj.sentence || '无例句';
        document.getElementById('modalSentenceCn').innerHTML = wordObj.sentence_cn || '无翻译';
        document.getElementById('modalType').innerHTML = wordObj.type || '';
        document.getElementById('modalLevel').innerHTML = wordObj.level || '';
        document.getElementById('modalPlayUkBtn').onclick = () => window.playAudio(wordObj.word, 1);
        document.getElementById('modalPlayUsBtn').onclick = () => window.playAudio(wordObj.word, 2);
        document.getElementById('modalPlaySentenceBtn').onclick = () => window.speakSentence(wordObj.sentence);
        document.getElementById('modal').style.display = 'flex';
    };

    function closeModal() {
        speechSynthesis.cancel();
        document.getElementById('modal').style.display = 'none';
    }
    document.getElementById('modalCloseBtn').onclick = closeModal;
    window.onclick = e => { if (e.target === document.getElementById('modal')) closeModal(); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // ======================== 规则卡片折叠 ========================
    (function initRuleCard() {
        const header = document.getElementById('ruleHeader');
        const body = document.getElementById('ruleBody');
        if (!header || !body) return;
        const isCollapsed = localStorage.getItem('ruleCollapsed') === 'true';
        if (isCollapsed) {
            body.classList.add('collapsed');
            header.classList.add('collapsed');
        }
        header.onclick = () => {
            const nowCollapsed = body.classList.toggle('collapsed');
            header.classList.toggle('collapsed');
            localStorage.setItem('ruleCollapsed', nowCollapsed);
        };
    })();

    // ======================== 辅助 ========================
    window.showDynamicContainer = function() {
        document.getElementById('sectionsContainer').style.display = 'none';
        document.getElementById('dynamicContainer').style.display = 'block';
        document.getElementById('searchBar').style.display = 'none';
    };

    window.showMainContainer = function() {
        document.getElementById('dynamicContainer').style.display = 'none';
        document.getElementById('sectionsContainer').style.display = 'block';
        document.getElementById('searchBar').style.display = 'flex';
    };

    // ======================== 视图渲染入口 ========================
    window.renderCurrentView = function(searchKeyword) {
        window.currentSearch = searchKeyword !== undefined ? searchKeyword : (window.currentSearch || '');
        const view = window.currentView || 'all';
        if (view === 'favorites') {
            if (typeof window.renderFavorites === 'function') window.renderFavorites();
        } else if (view === 'wrong') {
            if (typeof window.renderWrong === 'function') window.renderWrong();
        } else {
            if (typeof window.renderWords === 'function') window.renderWords(allWords, availableLevels);
        }
    };

    // ======================== CSV 解析 ========================
    function parseCSV(csvText) {
        const lines = csvText.split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const idx = (name) => headers.indexOf(name);
        const words = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = [];
            let inQuote = false, cur = '';
            for (let ch of line) {
                if (ch === '"') inQuote = !inQuote;
                else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
                else cur += ch;
            }
            values.push(cur.trim());
            const clean = values.map(v => v.replace(/^"|"$/g, ''));
            if (clean.length <= idx('word')) continue;
            const level = idx('level') !== -1 ? clean[idx('level')] : '';
            if (level) availableLevels.add(level);
            words.push({
                word: clean[idx('word')] || '',
                meaning: idx('meaning') !== -1 ? clean[idx('meaning')] : '',
                type: idx('type') !== -1 ? clean[idx('type')] : '',
                level: level,
                sentence: idx('sentence') !== -1 ? clean[idx('sentence')] : '',
                sentence_cn: idx('sentence_cn') !== -1 ? clean[idx('sentence_cn')] : '',
                phonetic: idx('phonetic') !== -1 ? clean[idx('phonetic')] : ''
            });
        }
        return words;
    }

    // ======================== CSV 加载 ========================
    window.loadData = function() {
        fetch('data/words.csv?' + Date.now())
            .then(res => { if (!res.ok) throw new Error('CSV not found'); return res.text(); })
            .then(text => {
                allWords = parseCSV(text);
                window.allWords = allWords;
                window.availableLevels = availableLevels;
                if (!allWords.length) throw new Error('No words parsed');
                if (typeof window.renderWords === 'function') {
                    window.renderWords(allWords, availableLevels);
                }
                window.updateGlobalStats();
            })
            .catch(err => {
                const container = document.getElementById('sectionsContainer');
                if (container) {
                    container.innerHTML = `<div class="no-result">❌ 加载失败: ${err.message}<br>请确保 data/words.csv 存在</div>`;
                }
            });
    };

    // 暴露变量
    window.allWords = allWords;
    window.availableLevels = availableLevels;
    window.levelFilters = levelFilters;
    window.currentSearch = currentSearch;
    window.currentView = currentView;
})();