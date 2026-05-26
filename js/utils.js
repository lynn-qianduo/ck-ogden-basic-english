// js/utils.js - 统一工具函数和错误处理

// Toast 通知组件
function showToast(message, type = 'info') {
    const toast = document.getElementById('globalToast');
    if (toast) {
        toast.remove();
    }
    
    const div = document.createElement('div');
    div.id = 'globalToast';
    div.textContent = message;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    div.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 24px;
        border-radius: 48px;
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideUp 0.3s ease;
        pointer-events: none;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => div.remove(), 300);
    }, 2500);
}

// 统一错误处理
function handleError(error, context = '') {
    console.error(`[${context}]`, error);
    const message = error.message || '操作失败，请稍后重试';
    showToast(`${context ? context + ': ' : ''}${message}`, 'error');
}

// 防抖函数
function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// 导出数据
function exportUserData() {
    try {
        const data = {
            version: '1.0',
            exportTime: new Date().toISOString(),
            favorites: window.favorites || [],
            wrongWords: window.wrongWords || [],
            mastered: window.mastered || [],
            studyPlan: JSON.parse(localStorage.getItem('basic_study_plan') || '{}'),
            levelFilters: window.levelFilters || {},
            aiHistory: JSON.parse(localStorage.getItem('basic_ai_history') || '[]')
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `basic850_backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('数据导出成功！', 'success');
    } catch (error) {
        handleError(error, '导出数据');
    }
}

// 导入数据
function importUserData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.favorites) window.favorites = data.favorites;
                if (data.wrongWords) window.wrongWords = data.wrongWords;
                if (data.mastered) window.mastered = data.mastered;
                if (data.studyPlan) localStorage.setItem('basic_study_plan', JSON.stringify(data.studyPlan));
                if (data.levelFilters) window.levelFilters = data.levelFilters;
                if (data.aiHistory) localStorage.setItem('basic_ai_history', JSON.stringify(data.aiHistory));
                
                // 保存到 localStorage
                if (window.saveFavorites) window.saveFavorites();
                if (window.saveWrongWords) window.saveWrongWords();
                if (window.saveMastered) window.saveMastered();
                
                // 刷新界面
                if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
                if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
                
                showToast('数据导入成功！', 'success');
                resolve(data);
            } catch (error) {
                handleError(error, '导入数据');
                reject(error);
            }
        };
        reader.onerror = () => {
            showToast('文件读取失败', 'error');
            reject(new Error('文件读取失败'));
        };
        reader.readAsText(file);
    });
}

// 防重复点击装饰器
function preventDoubleClick(fn, delay = 500) {
    let isProcessing = false;
    return function(...args) {
        if (isProcessing) return;
        isProcessing = true;
        fn.apply(this, args);
        setTimeout(() => { isProcessing = false; }, delay);
    };
}

// 挂载到全局
window.showToast = showToast;
window.handleError = handleError;
window.debounce = debounce;
window.exportUserData = exportUserData;
window.importUserData = importUserData;
window.preventDoubleClick = preventDoubleClick;