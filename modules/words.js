// modules/words.js - 修复搜索功能（只显示匹配结果）
(function() {
    const sections = [
        { id: 'operators', title: '🔧 操作词', types: ['动词_operator'] },
        { id: 'prepositions', title: '📍 介词/方向词', types: ['介词_prep'] },
        { id: 'pronouns', title: '👤 代词/限定词', types: ['代词_pron', '限定词_det'] },
        { id: 'particles', title: '🔗 工具词', types: ['other'] },
        { id: 'adjGen', title: '✨ 形容词(通用)', types: ['形容词_gen'] },
        { id: 'adjOpp', title: '🔄 形容词(相反)', types: ['形容词_opp'] },
        { id: 'nounsAbs', title: '💭 抽象名词', types: ['名词_abs'] },
        { id: 'nounsPic', title: '🖼️ 具象名词', types: ['名词_pic'] }
    ];
    const mainTypes = ['动词_operator', '介词_prep', '代词_pron', '限定词_det', '形容词_gen', '形容词_opp', '名词_abs', '名词_pic'];

    function createWordCard(wordObj) {
        const card = document.createElement('div');
        card.className = 'word-card';
        card.onclick = () => window.showModal(wordObj);
        const isFav = window.isFavorite && window.isFavorite(wordObj.word);
        const star = isFav ? '★' : '☆';
        const searchKw = window.currentSearch || '';
        
        const highlight = (text, kw) => {
            if (!kw || !text) return window.escapeHtml(text);
            const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return window.escapeHtml(text).replace(regex, '<mark>$1</mark>');
        };
        
        card.innerHTML = `
            <div class="word-badges">
                <div class="favorite-star" onclick="event.stopPropagation(); window.toggleFavorite('${window.escapeHtml(wordObj.word).replace(/'/g, "\\'")}', event)">${star}</div>
                <div class="word-level">${window.escapeHtml(wordObj.level || '')}</div>
            </div>
            <div class="word-text">${searchKw ? highlight(wordObj.word, searchKw) : window.escapeHtml(wordObj.word)}</div>
            <div class="word-phonetic">${window.escapeHtml(wordObj.phonetic || '')}</div>
            <div class="word-meaning">${searchKw ? highlight(wordObj.meaning, searchKw) : window.escapeHtml(wordObj.meaning)}</div>
            <div class="audio-row">
                <button class="audio-btn" onclick="event.stopPropagation(); window.playAudio('${window.escapeHtml(wordObj.word).replace(/'/g, "\\'")}', 1, event)">英音</button>
                <button class="audio-btn" onclick="event.stopPropagation(); window.playAudio('${window.escapeHtml(wordObj.word).replace(/'/g, "\\'")}', 2, event)">美音</button>
            </div>
        `;
        return card;
    }

    function scrollToFirstHighlight() {
        setTimeout(() => {
            const firstMark = document.querySelector('mark');
            if (firstMark) {
                const card = firstMark.closest('.word-card');
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('highlight');
                    setTimeout(() => card.classList.remove('highlight'), 1500);
                }
            }
        }, 100);
    }

    function isWordMatched(wordObj, keyword) {
        if (!keyword) return true;
        const kw = keyword.toLowerCase();
        return (wordObj.word && wordObj.word.toLowerCase().includes(kw)) ||
               (wordObj.meaning && wordObj.meaning.toLowerCase().includes(kw));
    }

    // 主渲染函数
    window.renderWords = function(allWordsData, levels) {
        window.allWords = allWordsData;
        
        const container = document.getElementById('sectionsContainer');
        if (!container) return;
        
        container.style.display = 'block';
        const dynamicContainer = document.getElementById('dynamicContainer');
        if (dynamicContainer) dynamicContainer.style.display = 'none';
        const searchBar = document.getElementById('searchBar');
        if (searchBar) searchBar.style.display = 'flex';

        const existingLevels = new Set();
        allWordsData.forEach(w => { if (w.level) existingLevels.add(w.level); });
        const levelList = ['all', ...Array.from(existingLevels).sort()];
        const searchKeyword = window.currentSearch || '';

        let html = '';
        let totalMatchCount = 0;
        
        for (let s of sections) {
            let sectionWords = s.id === 'particles' 
                ? allWordsData.filter(w => !mainTypes.includes(w.type) && w.type !== '') 
                : allWordsData.filter(w => s.types.includes(w.type));
            
            const levelVal = (window.levelFilters && window.levelFilters[s.id]) || 'all';
            let levelFiltered = [...sectionWords];
            if (levelVal !== 'all') levelFiltered = levelFiltered.filter(w => w.level === levelVal);
            
            let searchMatched = levelFiltered;
            if (searchKeyword) {
                searchMatched = levelFiltered.filter(w => isWordMatched(w, searchKeyword));
            }
            
            const matchCount = searchMatched.length;
            totalMatchCount += matchCount;
            const totalCount = sectionWords.length;
            
            const levelBtns = levelList.map(lv => {
                const active = (levelVal === lv) ? 'active' : '';
                const displayName = lv === 'all' ? '全部' : lv;
                return `<button class="filter-btn ${active}" data-section="${s.id}" data-level="${lv}">${displayName}</button>`;
            }).join('');
            
            const sectionHidden = (searchKeyword && matchCount === 0);
            
            html += `
                <div class="section" data-section="${s.id}" id="section-${s.id}" style="${sectionHidden ? 'display: none;' : ''}">
                    <div class="section-header">
                        <span>${s.title}</span>
                        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                            <span class="section-count">${matchCount}${searchKeyword ? '/' + totalCount : ''}</span>
                            <div class="filter-buttons">${levelBtns}</div>
                        </div>
                    </div>
                    <div class="word-grid" id="grid-${s.id}"></div>
                </div>
            `;
        }
        
        if (searchKeyword) {
            const resultHeader = `
                <div style="background: #e0f2fe; padding: 10px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <span>🔍 找到 <strong>${totalMatchCount}</strong> 个包含 "<strong>${window.escapeHtml(searchKeyword)}</strong>" 的单词</span>
                    <button id="clearSearchHintBtn" style="background: none; border: none; color: #0284c7; cursor: pointer;">✖ 清除搜索</button>
                </div>
            `;
            container.innerHTML = resultHeader + html;
            const clearBtn = document.getElementById('clearSearchHintBtn');
            if (clearBtn) {
                clearBtn.onclick = () => {
                    document.getElementById('searchInput').value = '';
                    window.currentSearch = '';
                    window.renderWords(allWordsData, levels);
                };
            }
        } else {
            container.innerHTML = html;
        }
        
        for (let s of sections) {
            let sectionWords = s.id === 'particles' 
                ? allWordsData.filter(w => !mainTypes.includes(w.type) && w.type !== '') 
                : allWordsData.filter(w => s.types.includes(w.type));
            
            const levelVal = (window.levelFilters && window.levelFilters[s.id]) || 'all';
            let levelFiltered = [...sectionWords];
            if (levelVal !== 'all') levelFiltered = levelFiltered.filter(w => w.level === levelVal);
            
            let searchMatched = levelFiltered;
            if (searchKeyword) {
                searchMatched = levelFiltered.filter(w => isWordMatched(w, searchKeyword));
            }
            
            const grid = document.getElementById(`grid-${s.id}`);
            if (grid) {
                const fragment = document.createDocumentFragment();
                searchMatched.forEach(w => fragment.appendChild(createWordCard(w)));
                grid.innerHTML = '';
                grid.appendChild(fragment);
            }
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const sectionId = btn.dataset.section;
                const level = btn.dataset.level;
                if (!window.levelFilters) window.levelFilters = {};
                window.levelFilters[sectionId] = level;
                window.renderWords(allWordsData, existingLevels);
                if (window.updateGlobalStats) window.updateGlobalStats();
            };
        });
        
        if (searchKeyword) {
            scrollToFirstHighlight();
        }
        
        if (window.updateGlobalStats) window.updateGlobalStats();
    };

    window.renderFavorites = function() {
        const words = window.allWords.filter(w => window.favorites && window.favorites.includes(w.word));
        renderFilteredList(words, '⭐ 我的收藏', 'favorites');
    };

    window.renderWrong = function() {
        const words = window.wrongWords || [];
        renderFilteredList(words, '❌ 错词本', 'wrong');
    };

    function renderFilteredList(words, title, type) {
        const container = document.getElementById('sectionsContainer');
        container.style.display = 'block';
        document.getElementById('dynamicContainer').style.display = 'none';
        document.getElementById('searchBar').style.display = 'flex';

        const searchKeyword = window.currentSearch || '';
        
        let filtered = words;
        let matchCount = filtered.length;
        
        if (searchKeyword) {
            filtered = words.filter(w => isWordMatched(w, searchKeyword));
            matchCount = filtered.length;
        }

        if (filtered.length === 0) {
            let msg = '';
            if (searchKeyword) {
                msg = `🔍 没有找到 "<strong>${window.escapeHtml(searchKeyword)}</strong>" 相关的${title === '⭐ 我的收藏' ? '收藏' : '错词'}`;
            } else {
                msg = title === '⭐ 我的收藏' 
                    ? '⭐ 收藏夹是空的，在单词卡上点 ★ 即可收藏' 
                    : '🎉 错词本是空的，继续加油！';
            }
            container.innerHTML = `<div class="no-result">${msg}</div>`;
            if (window.updateGlobalStats) window.updateGlobalStats();
            return;
        }

        let html = `
            <div class="section">
                <div class="section-header">
                    <span>${title}</span>
                    <span class="section-count">${matchCount}${searchKeyword ? '/' + words.length : ''}</span>
                </div>
                <div class="word-grid" id="filteredGrid"></div>
            </div>`;
        
        if (searchKeyword) {
            html = `
                <div style="background: #e0f2fe; padding: 10px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <span>🔍 找到 <strong>${matchCount}</strong> 个包含 "<strong>${window.escapeHtml(searchKeyword)}</strong>" 的${title === '⭐ 我的收藏' ? '收藏' : '错词'}</span>
                    <button id="clearSearchHintBtn" style="background: none; border: none; color: #0284c7; cursor: pointer;">✖ 清除搜索</button>
                </div>
            ` + html;
        }
        
        container.innerHTML = html;
        
        if (searchKeyword) {
            const clearBtn = document.getElementById('clearSearchHintBtn');
            if (clearBtn) {
                clearBtn.onclick = () => {
                    document.getElementById('searchInput').value = '';
                    window.currentSearch = '';
                    if (type === 'favorites') window.renderFavorites();
                    else window.renderWrong();
                };
            }
        }
        
        const grid = document.getElementById('filteredGrid');
        const fragment = document.createDocumentFragment();
        
        if (type === 'favorites') {
            filtered.forEach(w => fragment.appendChild(createFavCard(w)));
        } else {
            filtered.forEach(w => fragment.appendChild(createWrongCard(w)));
        }
        
        grid.innerHTML = '';
        grid.appendChild(fragment);
        
        if (window.updateGlobalStats) window.updateGlobalStats();
    }

    function createFavCard(wordObj) {
        const card = createWordCard(wordObj);
        const removeBar = document.createElement('div');
        removeBar.style.cssText = 'margin-top:8px;';
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '★ 取消收藏';
        removeBtn.style.cssText = 'width:100%; background:#f59e0b; color:white; border:none; padding:6px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold;';
        
        let isRemoving = false;
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            if (isRemoving) return;
            isRemoving = true;
            
            if (typeof window.toggleFavorite === 'function') {
                window.toggleFavorite(wordObj.word, e, true);
            }
            card.style.transition = 'opacity 0.3s, transform 0.3s';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (card.parentNode) card.remove();
                const countEl = document.querySelector('.section-count');
                if (countEl) {
                    const text = countEl.textContent;
                    const n = parseInt(text) - 1;
                    const searchKw = window.currentSearch || '';
                    countEl.textContent = n + (searchKw ? '/' + (window.favorites.length) : '');
                    if (n === 0 && !searchKw) {
                        document.getElementById('sectionsContainer').innerHTML = '<div class="no-result">⭐ 收藏夹是空的，在单词卡上点 ★ 即可收藏</div>';
                    }
                }
                if (window.updateGlobalStats) window.updateGlobalStats();
                isRemoving = false;
            }, 300);
        };
        removeBar.appendChild(removeBtn);
        card.appendChild(removeBar);
        return card;
    }

    function createWrongCard(wordObj) {
        const card = createWordCard(wordObj);
        const removeBar = document.createElement('div');
        removeBar.style.cssText = 'margin-top:8px;';
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✅ 认识了，移除';
        removeBtn.style.cssText = 'width:100%; background:#10b981; color:white; border:none; padding:6px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold;';
        
        let isRemoving = false;
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            if (isRemoving) return;
            isRemoving = true;
            
            if (typeof window.removeWrongWord === 'function') {
                window.removeWrongWord(wordObj.word);
            }
            card.style.transition = 'opacity 0.3s, transform 0.3s';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (card.parentNode) card.remove();
                const countEl = document.querySelector('.section-count');
                if (countEl) {
                    const text = countEl.textContent;
                    const n = parseInt(text) - 1;
                    const searchKw = window.currentSearch || '';
                    countEl.textContent = n + (searchKw ? '/' + (window.wrongWords.length) : '');
                    if (n === 0 && !searchKw) {
                        document.getElementById('sectionsContainer').innerHTML = '<div class="no-result">🎉 错词本已清空，全部掌握！</div>';
                    }
                }
                if (window.updateGlobalStats) window.updateGlobalStats();
                isRemoving = false;
            }, 300);
        };
        removeBar.appendChild(removeBtn);
        card.appendChild(removeBar);
        return card;
    }

    window.initWrongQuiz = function(wrongList, onFinish) {
        if (!wrongList || wrongList.length === 0) {
            if (window.showToast) window.showToast('没有错词可以复习！', 'warning');
            else alert('没有错词可以复习！');
            if (onFinish) onFinish();
            return;
        }
        const pool = [...wrongList].sort(() => 0.5 - Math.random());
        let idx = 0, removed = 0;
        const allWords = window.allWords || [];

        function next() {
            if (idx >= pool.length) {
                const container = document.getElementById('dynamicContainer');
                container.innerHTML = `
                    <div class="quiz-container" style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:20px;">🎉</div>
                        <h2>复习完成！</h2>
                        <p>共复习 <strong>${pool.length}</strong> 个错词</p>
                        <p>答对并移除 <strong style="color:#10b981;">${removed}</strong> 个</p>
                        <button class="action-btn" id="wrongQuizDoneBtn" style="background:#1e3c72; color:white; margin-top:20px; padding:12px 30px;">返回错词本</button>
                    </div>`;
                document.getElementById('wrongQuizDoneBtn').onclick = () => {
                    if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
                    if (onFinish) onFinish();
                };
                return;
            }

            const w = pool[idx];
            const isEng2Chi = Math.random() < 0.5;
            let questionText, answer, options;
            if (isEng2Chi) {
                questionText = w.word;
                answer = w.meaning;
                let others = [...new Set(allWords.filter(o => o.word !== w.word).map(o => o.meaning).filter(Boolean))];
                others = others.sort(() => 0.5 - Math.random()).slice(0, 3);
                while (others.length < 3) others.push('美丽的');
                options = [answer, ...others].sort(() => 0.5 - Math.random());
            } else {
                questionText = w.meaning;
                answer = w.word;
                let others = [...new Set(allWords.filter(o => o.word !== w.word).map(o => o.word).filter(Boolean))];
                others = others.sort(() => 0.5 - Math.random()).slice(0, 3);
                while (others.length < 3) others.push('good');
                options = [answer, ...others].sort(() => 0.5 - Math.random());
            }

            const container = document.getElementById('dynamicContainer');
            container.innerHTML = `
                <div class="quiz-container">
                    <div style="color:#ef4444; font-size:13px; margin-bottom:8px;">❌ 错词复习 ${idx + 1} / ${pool.length}</div>
                    <div class="quiz-question">📖 ${window.escapeHtml(questionText)}</div>
                    ${options.map(opt => `<div class="quiz-option" data-value="${window.escapeHtml(opt)}">${window.escapeHtml(opt)}</div>`).join('')}
                    <div class="quiz-feedback" id="wrongFeedback"></div>
                </div>`;

            document.querySelectorAll('.quiz-option').forEach(opt => {
                opt.onclick = () => {
                    document.querySelectorAll('.quiz-option').forEach(o => o.style.pointerEvents = 'none');
                    const selected = opt.dataset.value;
                    const isCorrect = selected === answer;
                    const feedback = document.getElementById('wrongFeedback');
                    if (isCorrect) {
                        removed++;
                        opt.classList.add('correct');
                        feedback.innerHTML = '<span style="color:green;">✅ 正确！已从错词本移除</span>';
                        if (typeof window.removeWrongWord === 'function') window.removeWrongWord(w.word);
                        if (window.mastered && !window.mastered.includes(w.word)) {
                            window.mastered.push(w.word);
                            if (window.saveMastered) window.saveMastered();
                        }
                    } else {
                        opt.classList.add('wrong');
                        feedback.innerHTML = `<span style="color:red;">❌ 错误！正确答案是：${window.escapeHtml(answer)}</span>`;
                        document.querySelectorAll('.quiz-option').forEach(o => {
                            if (o.dataset.value === answer) o.classList.add('correct');
                        });
                    }
                    idx++;
                    setTimeout(next, 1200);
                };
            });
        }
        next();
    };
})();