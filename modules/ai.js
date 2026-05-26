// modules/ai.js - AI 造句模块（含历史记录）
(function() {
    let currentProvider = localStorage.getItem('ai_provider') || 'siliconflow';
    let aiKeys = JSON.parse(localStorage.getItem('ai_keys') || '{}');
    let allWordsData = [];
    let playAudioFn = null;
    let speakSentenceFn = null;
    let onCloseCallback = null;
    let aiHistory = JSON.parse(localStorage.getItem('basic_ai_history') || '[]');

    const API_CONFIG = {
        siliconflow: {
            name: '硅基流动',
            url: 'https://api.siliconflow.cn/v1/chat/completions',
            model: 'Qwen/Qwen2.5-7B-Instruct',
            getHeaders: (key) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }),
            buildBody: (prompt) => ({
                model: 'Qwen/Qwen2.5-7B-Instruct',
                messages: [
                    { role: 'system', content: '你是 Basic English 专家，只能用 850 个核心词汇造句。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 500
            }),
            parseResponse: (data) => data.choices?.[0]?.message?.content || null
        },
        deepseek: {
            name: 'DeepSeek',
            url: 'https://api.deepseek.com/v1/chat/completions',
            model: 'deepseek-chat',
            getHeaders: (key) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }),
            buildBody: (prompt) => ({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是 Basic English 专家，只能用 850 个核心词汇造句。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 500
            }),
            parseResponse: (data) => data.choices?.[0]?.message?.content || null
        },
        tongyi: {
            name: '通义千问',
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            model: 'qwen-plus',
            getHeaders: (key) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }),
            buildBody: (prompt) => ({
                model: 'qwen-plus',
                messages: [
                    { role: 'system', content: '你是 Basic English 专家，只能用 850 个核心词汇造句。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 500
            }),
            parseResponse: (data) => data.choices?.[0]?.message?.content || null
        }
    };

    function getLocalSentences(word) {
        if (typeof window.getBasicSentence === 'function') {
            return window.getBasicSentence(word);
        }
        return [
            { level: '简单', en: `The ${word} is good.`, cn: `这个 ${word} 很好。` },
            { level: '中级', en: `A ${word} can bring great pleasure to life.`, cn: `${word} 能给生活带来巨大快乐。` },
            { level: '高级', en: `The best ${word} is one that comes from a pure heart.`, cn: `最好的 ${word} 来自纯净的心。` }
        ];
    }

    function saveToHistory(word, sentences) {
        aiHistory = aiHistory.filter(h => h.word !== word);
        aiHistory.unshift({
            word: word,
            sentences: sentences,
            timestamp: new Date().toISOString()
        });
        if (aiHistory.length > 20) aiHistory.pop();
        localStorage.setItem('basic_ai_history', JSON.stringify(aiHistory));
    }

    async function callAI(word) {
        const config = API_CONFIG[currentProvider];
        const apiKey = aiKeys[currentProvider];
        
        if (!apiKey) {
            return null;
        }
        
        const prompt = `【严格限制】你是 Basic English 专家，严格遵守 C.K. Ogden 的 850 个核心词汇规则。

【动词限制】只能用这16个操作词：come, go, put, take, give, get, make, keep, let, do, be, have, seem, say, see, send

【任务】用单词 "${word}" 生成三个句子（简单/中级/高级）。每个句子后跟中文翻译。
格式：简单句：句子（中文）\n中级句：句子（中文）\n高级句：句子（中文）`;
        
        try {
            const response = await fetch(config.url, {
                method: 'POST',
                headers: config.getHeaders(apiKey),
                body: JSON.stringify(config.buildBody(prompt))
            });
            const data = await response.json();
            const result = config.parseResponse(data);
            
            if (result) {
                const lines = result.split(/\n/);
                const sentences = [];
                for (let line of lines) {
                    const match = line.match(/^(简单句|中级句|高级句)[：:]\s*(.+?)（(.+?)）$/);
                    if (match) {
                        sentences.push({
                            level: match[1],
                            en: match[2].trim(),
                            cn: match[3].trim()
                        });
                    }
                }
                if (sentences.length >= 2) return sentences;
            }
            return null;
        } catch (err) {
            console.error('AI 调用失败:', err);
            return null;
        }
    }

    async function getSentences(word) {
        const aiSentences = await callAI(word);
        if (aiSentences && aiSentences.length >= 2) {
            saveToHistory(word, aiSentences);
            return aiSentences;
        }
        const localSentences = getLocalSentences(word);
        saveToHistory(word, localSentences);
        return localSentences;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    }

    function handleSpeakSentence(sentence, event) {
        if (event) event.stopPropagation();
        if (!sentence) return;
        if (speakSentenceFn) {
            speakSentenceFn(sentence);
        } else {
            const utter = new SpeechSynthesisUtterance(sentence);
            utter.lang = 'en-US';
            utter.rate = 0.85;
            speechSynthesis.cancel();
            speechSynthesis.speak(utter);
        }
    }

    function renderSentences(sentences) {
        let html = '';
        sentences.forEach((s, idx) => {
            const safeEn = escapeHtml(s.en);
            const safeCn = escapeHtml(s.cn);
            html += `
                <div class="sentence-item">
                    <div class="sentence-en">
                        <span><strong>${s.level}</strong>：${safeEn}</span>
                        <button class="speak-btn" data-sentence="${safeEn.replace(/"/g, '&quot;')}">🔊 朗读</button>
                    </div>
                    <div class="sentence-cn">📝 ${safeCn}</div>
                </div>
            `;
        });
        return html;
    }

    function bindAudioButtons() {
        document.querySelectorAll('#aiResult .speak-btn').forEach(btn => {
            btn.removeEventListener('click', btn._listener);
            const sentence = btn.getAttribute('data-sentence');
            btn._listener = (e) => handleSpeakSentence(sentence, e);
            btn.addEventListener('click', btn._listener);
        });
    }

    function renderHistory() {
        if (aiHistory.length === 0) {
            return '<div style="text-align: center; padding: 30px; color: #94a3b8;">📭 暂无历史记录，生成句子后会自动保存</div>';
        }
        
        let html = '<div style="margin-top: 20px;"><h4>📜 最近查询历史</h4><div style="max-height: 300px; overflow-y: auto;">';
        aiHistory.forEach(item => {
            const date = new Date(item.timestamp).toLocaleString();
            const preview = item.sentences[0]?.en?.substring(0, 50) || '';
            html += `
                <div class="history-item" data-word="${escapeHtml(item.word)}" style="
                    background: #f8fafc;
                    margin-bottom: 10px;
                    padding: 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #1e3c72; font-size: 16px;">${escapeHtml(item.word)}</strong>
                        <span style="font-size: 11px; color: #64748b;">${date}</span>
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${escapeHtml(preview)}...</div>
                </div>
            `;
        });
        html += '</div><button id="clearHistoryBtn" class="action-btn" style="margin-top: 12px; background: #ef4444; color: white; width: 100%;">🗑️ 清空历史记录</button></div>';
        return html;
    }

    function bindHistoryEvents() {
        document.querySelectorAll('.history-item').forEach(item => {
            const word = item.dataset.word;
            item.onclick = async () => {
                document.getElementById('aiWordInput').value = word;
                document.getElementById('generateBtn').click();
            };
        });
        
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                if (confirm('确定要清空所有历史记录吗？')) {
                    aiHistory = [];
                    localStorage.setItem('basic_ai_history', '[]');
                    const historySection = document.getElementById('historySection');
                    if (historySection) historySection.innerHTML = renderHistory();
                    bindHistoryEvents();
                    if (window.showToast) window.showToast('历史记录已清空', 'info');
                }
            };
        }
    }

    function renderMainUI() {
        const container = document.getElementById('dynamicContainer');
        const hasKey = aiKeys[currentProvider];
        const providerName = API_CONFIG[currentProvider]?.name || currentProvider;
        
        container.innerHTML = `
            <div class="quiz-container">
                <h2>🤖 AI 造句助手</h2>
                <p style="color:#64748b; margin-bottom:15px;">
                    📖 严格遵循 <strong>C.K. Ogden Basic English 850</strong> 核心词汇规则<br>
                    ✅ 内置 1000+ 本地例句库 | 优先使用 AI，失败时自动降级
                </p>
                
                <div style="background:#f1f5f9; padding:12px; border-radius:12px; margin-bottom:15px;">
                    <label style="font-weight:bold;">选择 AI 提供商：</label>
                    <select id="providerSelect">
                        <option value="siliconflow" ${currentProvider === 'siliconflow' ? 'selected' : ''}>硅基流动</option>
                        <option value="deepseek" ${currentProvider === 'deepseek' ? 'selected' : ''}>DeepSeek</option>
                        <option value="tongyi" ${currentProvider === 'tongyi' ? 'selected' : ''}>通义千问</option>
                    </select>
                    <button id="configKeyBtn" class="action-btn" style="margin-left:15px;">🔑 配置 API Key</button>
                </div>
                
                <div style="background:${hasKey ? '#d1fae5' : '#fef3c7'}; padding:12px; border-radius:12px; margin-bottom:15px; border-left:4px solid ${hasKey ? '#10b981' : '#f59e0b'};">
                    ${hasKey ? `✅ 已配置 ${providerName}（优先使用 AI）` : `⚠️ 未配置 API Key，将使用本地例句库（严格遵循 850 词规范）`}
                </div>
                
                <div style="margin:15px 0;">
                    <label style="font-weight:bold;">📝 输入单词：</label>
                    <input type="text" id="aiWordInput" placeholder="例如: beautiful, happy, strong" style="width:100%; padding:12px; margin-top:8px; border-radius:8px; border:1px solid #cbd5e1; font-size:16px;">
                </div>
                
                <button id="generateBtn" class="action-btn" style="background:#1e3c72; color:white; padding:12px 24px; width:100%;">✨ 生成句子</button>
                
                <div id="aiResult" style="margin-top:20px;"></div>
                
                <div id="historySection">
                    ${renderHistory()}
                </div>
                
                <button id="closeAIBtn" class="action-btn" style="margin-top:20px; background:#64748b; color:white; width:100%;">返回</button>
            </div>
        `;
        
        document.getElementById('providerSelect').onchange = (e) => {
            currentProvider = e.target.value;
            localStorage.setItem('ai_provider', currentProvider);
            renderMainUI();
        };
        
        document.getElementById('configKeyBtn').onclick = () => {
            const providerDisplayName = API_CONFIG[currentProvider]?.name || currentProvider;
            const newKey = prompt(`请输入 ${providerDisplayName} 的 API Key：\n\n如果不配置，将使用本地例句库。`);
            if (newKey && newKey.trim()) {
                aiKeys[currentProvider] = newKey.trim();
                localStorage.setItem('ai_keys', JSON.stringify(aiKeys));
                renderMainUI();
            }
        };
        
        document.getElementById('generateBtn').onclick = async () => {
            const input = document.getElementById('aiWordInput');
            const word = input ? input.value.trim().toLowerCase() : '';
            if (!word) {
                if (window.showToast) window.showToast('请输入单词', 'warning');
                else alert('请输入单词');
                return;
            }
            const resultDiv = document.getElementById('aiResult');
            resultDiv.innerHTML = '<div style="text-align:center; padding:40px;">⏳ 正在生成句子...</div>';
            
            const sentences = await getSentences(word);
            resultDiv.innerHTML = renderSentences(sentences);
            bindAudioButtons();
            
            const historySection = document.getElementById('historySection');
            if (historySection) {
                historySection.innerHTML = renderHistory();
                bindHistoryEvents();
            }
        };
        
        document.getElementById('closeAIBtn').onclick = () => {
            if (onCloseCallback) onCloseCallback();
        };
        
        document.getElementById('aiWordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('generateBtn').click();
        });
        
        bindHistoryEvents();
    }

    window.initAI = function(allWords, playAudio, speakSentence, onClose) {
        allWordsData = allWords || [];
        playAudioFn = playAudio;
        speakSentenceFn = speakSentence;
        onCloseCallback = onClose;
        renderMainUI();
    };
})();