// modules/quiz.js - 单词测试模块（移除 alert）
(function() {
    let quizWords = [];
    let quizIndex = 0;
    let quizScore = 0;
    let quizAnswered = false;
    let currentCallback = null;
    let onFinishCallback = null;

    function generateQuizQuestions(allWords, searchKeyword) {
        let pool = allWords;
        if (searchKeyword) {
            const kw = searchKeyword.toLowerCase();
            pool = allWords.filter(w => w.word.toLowerCase().includes(kw) || (w.meaning && w.meaning.toLowerCase().includes(kw)));
        }
        if (pool.length === 0) pool = allWords;
        const sample = pool.sort(() => 0.5 - Math.random()).slice(0, 10);
        const questions = [];
        for (let w of sample) {
            const type = Math.random() < 0.5 ? 'eng2chi' : 'chi2eng';
            let questionText, correct, options;
            if (type === 'eng2chi') {
                questionText = w.word;
                correct = w.meaning;
                let others = allWords.filter(o => o.word !== w.word).map(o => o.meaning).filter(m => m && m !== correct);
                let distinct = [...new Set(others)];
                let wrongs = [];
                while (wrongs.length < 3 && distinct.length > 0) wrongs.push(distinct.shift());
                while (wrongs.length < 3) wrongs.push('美丽的', '大的', '小的');
                options = [correct, ...wrongs];
                options.sort(() => 0.5 - Math.random());
            } else {
                questionText = w.meaning;
                correct = w.word;
                let others = allWords.filter(o => o.word !== w.word).map(o => o.word);
                let distinct = [...new Set(others)];
                let wrongs = [];
                while (wrongs.length < 3 && distinct.length > 0) wrongs.push(distinct.shift());
                while (wrongs.length < 3) wrongs.push('good', 'bad', 'big');
                options = [correct, ...wrongs];
                options.sort(() => 0.5 - Math.random());
            }
            questions.push({ questionText, correct, options, wordObj: w });
        }
        return questions;
    }

    function showResult() {
        const container = document.getElementById('dynamicContainer');
        const percent = Math.round((quizScore / quizWords.length) * 100);
        const isPass = percent >= 60;
        
        container.innerHTML = `
            <div class="quiz-container" style="text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px;">${isPass ? '🎉' : '📚'}</div>
                <h2 style="color: #1e3c72;">测试完成！</h2>
                <div style="font-size: 48px; font-weight: bold; margin: 20px 0; color: ${isPass ? '#10b981' : '#f59e0b'}">
                    ${quizScore} / ${quizWords.length}
                </div>
                <div style="margin-bottom: 30px;">
                    <div style="background: #e2e8f0; border-radius: 20px; height: 12px; max-width: 300px; margin: 0 auto;">
                        <div style="width: ${percent}%; background: ${isPass ? '#10b981' : '#f59e0b'}; height: 12px; border-radius: 20px;"></div>
                    </div>
                    <p style="margin-top: 12px; color: #64748b;">
                        ${percent >= 80 ? '优秀！继续保持！' : percent >= 60 ? '良好！再复习一下错词吧' : '继续努力，多复习错词本'}
                    </p>
                </div>
                <button id="quizResultCloseBtn" class="action-btn" style="background: #1e3c72; color: white; padding: 12px 32px;">
                    关闭
                </button>
            </div>
        `;
        
        document.getElementById('quizResultCloseBtn').onclick = () => {
            if (onFinishCallback) onFinishCallback();
            if (window.updateGlobalStats) window.updateGlobalStats();
        };
    }

    function renderQuestion(q, addWrongWord, updateStats) {
        const container = document.getElementById('dynamicContainer');
        const progress = ((quizIndex + 1) / quizWords.length) * 100;
        
        let html = `
            <div class="quiz-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <span style="color: #64748b;">第 ${quizIndex + 1} / ${quizWords.length} 题</span>
                    <div style="background: #e2e8f0; border-radius: 10px; width: 100px; height: 6px; overflow: hidden;">
                        <div style="width: ${progress}%; background: #1e3c72; height: 6px;"></div>
                    </div>
                </div>
                <div class="quiz-question">📖 ${window.escapeHtml(q.questionText)}</div>
        `;
        
        q.options.forEach(opt => {
            html += `<div class="quiz-option" data-value="${window.escapeHtml(opt)}">${window.escapeHtml(opt)}</div>`;
        });
        
        html += `<div class="quiz-feedback" id="quizFeedback"></div></div>`;
        container.innerHTML = html;

        let answered = false;
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.onclick = () => {
                if (answered) return;
                answered = true;
                const selected = opt.dataset.value;
                const isCorrect = (selected === q.correct);
                const feedback = document.getElementById('quizFeedback');
                if (isCorrect) {
                    quizScore++;
                    feedback.innerHTML = '<span style="color:green;">✅ 正确！</span>';
                    if (!window.mastered.includes(q.wordObj.word)) {
                        window.mastered.push(q.wordObj.word);
                        if (window.saveMastered) window.saveMastered();
                    }
                    if (typeof window.removeWrongWord === 'function') {
                        window.removeWrongWord(q.wordObj.word);
                    }
                } else {
                    feedback.innerHTML = `<span style="color:red;">❌ 错误！正确答案是：${window.escapeHtml(q.correct)}</span>`;
                    if (addWrongWord) addWrongWord(q.wordObj);
                }
                opt.classList.add(isCorrect ? 'correct' : 'wrong');
                setTimeout(() => {
                    quizIndex++;
                    if (quizIndex >= quizWords.length) {
                        showResult();
                    } else {
                        renderQuestion(quizWords[quizIndex], addWrongWord, updateStats);
                    }
                }, 1000);
            };
        });
    }

    function startQuiz(allWords, searchKeyword, addWrongWord, updateStats, onFinish) {
        onFinishCallback = onFinish;
        quizWords = generateQuizQuestions(allWords, searchKeyword);
        quizIndex = 0;
        quizScore = 0;

        if (quizWords.length === 0) {
            const container = document.getElementById('dynamicContainer');
            container.innerHTML = `
                <div class="quiz-container" style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
                    <h2>没有找到单词</h2>
                    <p style="color: #64748b;">当前没有可测试的单词</p>
                    <button id="quizEmptyCloseBtn" class="action-btn">返回</button>
                </div>
            `;
            document.getElementById('quizEmptyCloseBtn').onclick = () => {
                if (onFinish) onFinish();
            };
            return;
        }
        
        renderQuestion(quizWords[0], addWrongWord, updateStats);
    }

    window.initQuiz = function(allWords, searchKeyword, addWrongWord, updateStats, onFinish) {
        startQuiz(allWords, searchKeyword, addWrongWord, updateStats, onFinish);
    };
})();