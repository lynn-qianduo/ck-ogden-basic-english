// modules/plan.js - 学习计划模块（完整学习功能版）
(function() {
    let studyPlan = { mode: 'normal', learnedWords: [], currentWordIndex: 0, todayLearned: 0 };
    let currentStudyWords = [];
    let currentCardIndex = 0;
    let onCloseCallback = null;
    
    const MODE_CONFIG = {
        easy: { name: '轻松模式', wordsPerDay: 10, desc: '每天10个新词', color: '#10b981', icon: '🐢' },
        normal: { name: '标准模式', wordsPerDay: 30, desc: '每天30个新词', color: '#3b82f6', icon: '🐇' },
        hard: { name: '强化模式', wordsPerDay: 60, desc: '每天60个新词', color: '#ef4444', icon: '🚀' }
    };

    function loadPlanData() {
        const saved = localStorage.getItem('basic_study_plan');
        if (saved) {
            try { studyPlan = { ...studyPlan, ...JSON.parse(saved) }; } catch(e) {}
        }
        if (!studyPlan.lastStudyDate) studyPlan.lastStudyDate = new Date().toISOString().split('T')[0];
        if (!studyPlan.learnedWords) studyPlan.learnedWords = [];
        savePlanData();
    }

    function savePlanData() { 
        localStorage.setItem('basic_study_plan', JSON.stringify(studyPlan)); 
    }

    // 标记单词为已学
    function markWordAsLearned(word) {
        if (!studyPlan.learnedWords.includes(word)) {
            studyPlan.learnedWords.push(word);
            // 同步到 mastered
            if (window.mastered && !window.mastered.includes(word)) {
                window.mastered.push(word);
                if (window.saveMastered) window.saveMastered();
            }
            studyPlan.todayLearned++;
            savePlanData();
            if (window.updateGlobalStats) window.updateGlobalStats();
        }
    }

    // 获取今日待学单词（未学过的）
    function getTodayWords() {
        const allWords = window.allWords || [];
        const learned = studyPlan.learnedWords;
        const wordsPerDay = MODE_CONFIG[studyPlan.mode].wordsPerDay;
        
        // 筛选未学过的单词
        const unlearned = allWords.filter(w => !learned.includes(w.word));
        
        // 打乱顺序
        const shuffled = [...unlearned].sort(() => 0.5 - Math.random());
        
        // 返回今日数量
        return shuffled.slice(0, wordsPerDay);
    }

    // 渲染主界面（模式选择和进度）
    function renderMainMenu() {
        const learnedCount = studyPlan.learnedWords.length;
        const totalCount = window.allWords ? window.allWords.length : 850;
        const progressPercent = totalCount ? (learnedCount / totalCount) * 100 : 0;
        const config = MODE_CONFIG[studyPlan.mode];
        const wordsPerDay = config.wordsPerDay;
        const remaining = totalCount - learnedCount;
        const daysNeeded = Math.ceil(remaining / wordsPerDay);

        const container = document.getElementById('dynamicContainer');
        container.innerHTML = `
            <div class="plan-panel" style="background: white; border-radius: 24px; padding: 24px;">
                <h2 style="color: #1e3c72; margin-bottom: 8px;">📅 学习计划</h2>
                <p style="color: #64748b; margin-bottom: 24px;">基于艾宾浩斯遗忘曲线，科学安排学习</p>
                
                <!-- 模式选择 -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px;">
                    ${Object.entries(MODE_CONFIG).map(([key, cfg]) => `
                        <div class="mode-select-card" data-mode="${key}" style="
                            background: ${studyPlan.mode === key ? cfg.color : '#f8fafc'};
                            color: ${studyPlan.mode === key ? 'white' : '#1e293b'};
                            padding: 20px 16px;
                            border-radius: 20px;
                            cursor: pointer;
                            text-align: center;
                            transition: all 0.3s;
                            border: 2px solid ${studyPlan.mode === key ? cfg.color : '#e2e8f0'};
                        ">
                            <div style="font-size: 48px;">${cfg.icon}</div>
                            <div style="font-weight: bold; margin: 8px 0 4px;">${cfg.name}</div>
                            <div style="font-size: 11px; opacity: 0.8;">${cfg.desc}</div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- 进度条 -->
                <div style="background: #f1f5f9; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: bold;">📊 总体进度</span>
                        <span>${learnedCount} / ${totalCount} (${progressPercent.toFixed(1)}%)</span>
                    </div>
                    <div style="background: #e2e8f0; border-radius: 20px; height: 20px; overflow: hidden;">
                        <div style="width: ${progressPercent}%; background: ${config.color}; height: 100%; border-radius: 20px;"></div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 20px;">
                        <div style="background: white; padding: 14px; border-radius: 16px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: ${config.color};">${wordsPerDay}</div>
                            <div style="font-size: 12px; color: #64748b;">每日新词</div>
                        </div>
                        <div style="background: white; padding: 14px; border-radius: 16px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: ${config.color};">${daysNeeded}</div>
                            <div style="font-size: 12px; color: #64748b;">预计完成天数</div>
                        </div>
                    </div>
                </div>
                
                <!-- 今日任务 -->
                <div style="background: linear-gradient(135deg, ${config.color}20, ${config.color}10); border-radius: 20px; padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 40px;">📖</span>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 18px;">今日学习任务</div>
                            <div style="font-size: 14px; color: #475569;">今日可学 ${Math.min(wordsPerDay, totalCount - learnedCount)} 个新单词</div>
                        </div>
                        <button id="startStudyBtn" style="background: ${config.color}; color: white; border: none; padding: 12px 24px; border-radius: 40px; font-weight: bold; cursor: pointer;">
                            🚀 开始学习
                        </button>
                    </div>
                </div>
                
                <!-- 学习统计 -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <div style="background: #f8fafc; padding: 12px; border-radius: 16px; text-align: center;">
                        <div style="font-size: 12px; color: #64748b;">今日已学</div>
                        <div style="font-size: 24px; font-weight: bold; color: ${config.color};">${studyPlan.todayLearned}</div>
                    </div>
                    <div style="background: #f8fafc; padding: 12px; border-radius: 16px; text-align: center;">
                        <div style="font-size: 12px; color: #64748b;">累计学习</div>
                        <div style="font-size: 24px; font-weight: bold; color: ${config.color};">${learnedCount}</div>
                    </div>
                </div>
                
                <button id="closePlanBtn" style="width: 100%; margin-top: 24px; padding: 14px; background: #64748b; color: white; border: none; border-radius: 40px; font-weight: bold; cursor: pointer;">
                    返回
                </button>
            </div>
        `;
        
        // 绑定模式切换
        document.querySelectorAll('.mode-select-card').forEach(card => {
            card.onclick = () => {
                studyPlan.mode = card.dataset.mode;
                savePlanData();
                renderMainMenu();
            };
        });
        
        // 开始学习
        document.getElementById('startStudyBtn').onclick = () => {
            startLearning();
        };
        
        document.getElementById('closePlanBtn').onclick = () => {
            if (onCloseCallback) onCloseCallback();
        };
    }
    
    // 开始学习（单词卡片模式）
    function startLearning() {
        currentStudyWords = getTodayWords();
        
        if (currentStudyWords.length === 0) {
            alert('🎉 恭喜！你已经学完了所有 850 个单词！');
            renderMainMenu();
            return;
        }
        
        currentCardIndex = 0;
        showWordCard();
    }
    
    // 显示单词卡片
    function showWordCard() {
        if (currentCardIndex >= currentStudyWords.length) {
            // 今日学习完成
            alert(`🎉 恭喜！今日已完成 ${currentStudyWords.length} 个新单词！\n明天继续加油！`);
            renderMainMenu();
            return;
        }
        
        const wordObj = currentStudyWords[currentCardIndex];
        const config = MODE_CONFIG[studyPlan.mode];
        const remaining = currentStudyWords.length - currentCardIndex;
        
        const container = document.getElementById('dynamicContainer');
        container.innerHTML = `
            <div class="quiz-container" style="max-width: 600px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <span style="background: ${config.color}20; color: ${config.color}; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                        ${config.name}
                    </span>
                    <span style="color: #64748b; font-size: 12px;">剩余 ${remaining} 个</span>
                </div>
                
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 48px; font-weight: bold; color: #1e3c72; margin-bottom: 16px;">
                        ${escapeHtml(wordObj.word)}
                    </div>
                    <div style="font-size: 16px; color: #64748b; margin-bottom: 20px;">
                        ${escapeHtml(wordObj.phonetic || '')}
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 30px;">
                        <button id="playUkBtn" style="background: #f1f5f9; border: none; padding: 10px 20px; border-radius: 30px; cursor: pointer;">🇬🇧 英音</button>
                        <button id="playUsBtn" style="background: #f1f5f9; border: none; padding: 10px 20px; border-radius: 30px; cursor: pointer;">🇺🇸 美音</button>
                    </div>
                    
                    <div id="meaningArea" style="
                        background: #f8fafc;
                        border-radius: 20px;
                        padding: 30px;
                        margin-bottom: 30px;
                        cursor: pointer;
                        transition: all 0.3s;
                        border: 2px dashed #cbd5e1;
                    " onclick="toggleMeaning()">
                        <div id="meaningPlaceholder" style="color: #94a3b8;">👆 点击显示释义</div>
                        <div id="meaningContent" style="display: none; font-size: 20px; font-weight: bold; color: ${config.color};">
                            ${escapeHtml(wordObj.meaning)}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button id="knownBtn" style="flex: 1; background: ${config.color}; color: white; border: none; padding: 14px; border-radius: 40px; font-weight: bold; cursor: pointer;">
                            ✅ 认识，标记已学
                        </button>
                        <button id="unknownBtn" style="flex: 1; background: #ef4444; color: white; border: none; padding: 14px; border-radius: 40px; font-weight: bold; cursor: pointer;">
                            ❌ 不认识，复习
                        </button>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button id="backToPlanBtn" style="background: none; border: none; color: #64748b; cursor: pointer;">← 返回计划</button>
                </div>
            </div>
        `;
        
        // 绑定发音
        document.getElementById('playUkBtn').onclick = () => {
            window.playAudio(wordObj.word, 1);
        };
        document.getElementById('playUsBtn').onclick = () => {
            window.playAudio(wordObj.word, 2);
        };
        
        // 认识：标记已学，进入下一个
        // 认识按钮：标记已学，然后进入下一个
document.getElementById('knownBtn').onclick = () => {
    markWordAsLearned(wordObj.word);
    currentCardIndex++;
    showWordCard();
};

// 不认识按钮：加入错词本，不增加索引，重新显示同一个词
document.getElementById('unknownBtn').onclick = () => {
    if (window.addWrongWord) {
        window.addWrongWord(wordObj);
    }
    // 重置释义显示（隐藏答案）
    const placeholder = document.getElementById('meaningPlaceholder');
    const content = document.getElementById('meaningContent');
    if (content && content.style.display === 'block') {
        placeholder.style.display = 'block';
        content.style.display = 'none';
    }
    // 视觉反馈：红色闪烁提示（静默，不弹窗）
    const meaningArea = document.getElementById('meaningArea');
    if (meaningArea) {
        meaningArea.style.transition = 'background-color 0.3s';
        meaningArea.style.backgroundColor = '#fee2e2';
        meaningArea.style.borderColor = '#ef4444';
        setTimeout(() => {
            meaningArea.style.backgroundColor = '#f8fafc';
            meaningArea.style.borderColor = '#cbd5e1';
        }, 500);
    }
    // 不增加 currentCardIndex，停留在同一个单词
};
        
        document.getElementById('backToPlanBtn').onclick = () => {
            renderMainMenu();
        };
        
        // 全局函数供 onclick 调用
        window.toggleMeaning = function() {
            const placeholder = document.getElementById('meaningPlaceholder');
            const content = document.getElementById('meaningContent');
            if (placeholder.style.display !== 'none') {
                placeholder.style.display = 'none';
                content.style.display = 'block';
            } else {
                placeholder.style.display = 'block';
                content.style.display = 'none';
            }
        };
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    }
    
    // 重置今日学习计数（每天首次打开时重置）
    function checkAndResetDaily() {
        const today = new Date().toISOString().split('T')[0];
        if (studyPlan.lastStudyDate !== today) {
            studyPlan.todayLearned = 0;
            studyPlan.lastStudyDate = today;
            savePlanData();
        }
    }
    
    window.initPlan = function(allWords, mastered, favorites, wrongWords, addWrongWord, updateStats, onClose) {
        window.allWords = allWords;
        window.mastered = mastered;
        onCloseCallback = onClose;
        loadPlanData();
        checkAndResetDaily();
        renderMainMenu();
    };
})();