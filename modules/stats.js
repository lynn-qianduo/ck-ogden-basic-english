// modules/stats.js - 增加备份功能
(function() {
    function renderStats(allWords, favorites, wrongWords, mastered, onClose) {
        const total = allWords.length;
        const masteredCount = mastered.length;
        const wrongCount = wrongWords.length;
        const correctRate = total ? ((masteredCount / total) * 100).toFixed(1) : 0;

        const container = document.getElementById('dynamicContainer');
        container.innerHTML = `
            <div class="quiz-container">
                <h2>📊 学习统计</h2>
                <p>📚 总单词数：${total}</p>
                <p>✅ 已掌握单词：${masteredCount}</p>
                <p>❌ 错词本数量：${wrongCount}</p>
                <p>⭐ 收藏夹数量：${favorites.length}</p>
                <p>📈 掌握率：${correctRate}%</p>
                
                <div style="margin: 20px 0; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <h4>💾 数据备份与恢复</h4>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
                        <button id="exportDataBtn" class="action-btn" style="background: #10b981; color: white;">📤 导出数据</button>
                        <label id="importLabelBtn" class="action-btn" style="background: #3b82f6; color: white; cursor: pointer; display: inline-block;">
                            📥 导入数据
                            <input type="file" id="importFileInput" accept=".json" style="display: none;">
                        </label>
                        <button id="clearAllDataBtn" class="action-btn" style="background: #ef4444; color: white;">⚠️ 清空所有数据</button>
                    </div>
                    <p style="font-size: 12px; color: #64748b; margin-top: 12px;">
                        💡 提示：导出数据可保存学习进度，导入后自动恢复收藏、错词本等所有学习记录
                    </p>
                </div>
                
                <button id="closeStatsBtn" class="action-btn">返回</button>
            </div>
        `;
        
        document.getElementById('closeStatsBtn').onclick = () => {
            if (onClose) onClose();
        };
        
        // 导出数据
        document.getElementById('exportDataBtn').onclick = () => {
            if (window.exportUserData) window.exportUserData();
        };
        
        // 导入数据
        const fileInput = document.getElementById('importFileInput');
        document.getElementById('importLabelBtn').onclick = () => {
            fileInput.click();
        };
        fileInput.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                await window.importUserData(e.target.files[0]);
                fileInput.value = '';
                // 刷新统计显示
                renderStats(allWords, window.favorites, window.wrongWords, window.mastered, onClose);
            }
        };
        
        // 清空所有数据
        document.getElementById('clearAllDataBtn').onclick = () => {
            if (confirm('⚠️ 警告：这将清空所有学习数据（收藏、错词本、已学记录），且不可恢复！\n\n确定要清空吗？')) {
                localStorage.removeItem('basic_favorites');
                localStorage.removeItem('basic_wrongWords');
                localStorage.removeItem('basic_mastered');
                localStorage.removeItem('basic_study_plan');
                localStorage.removeItem('basic_ai_history');
                
                window.favorites = [];
                window.wrongWords = [];
                window.mastered = [];
                
                if (window.saveFavorites) window.saveFavorites();
                if (window.saveWrongWords) window.saveWrongWords();
                if (window.saveMastered) window.saveMastered();
                
                if (window.updateGlobalStats) window.updateGlobalStats();
                if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
                
                showToast('所有数据已清空', 'warning');
                renderStats(allWords, [], [], [], onClose);
            }
        };
    }

    window.initStats = function(allWords, favorites, wrongWords, mastered, onClose) {
        renderStats(allWords, favorites, wrongWords, mastered, onClose);
    };
})();