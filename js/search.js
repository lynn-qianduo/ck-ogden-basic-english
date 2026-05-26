// ======================== 搜索模块 ========================
// 注意：按钮事件已在 index.html 的 DOMContentLoaded 中统一绑定
// 此文件仅提供搜索逻辑函数，供 index.html 调用

function performSearch() {
    window.currentSearch = document.getElementById('searchInput').value.trim();
    window.currentView = window.currentView || 'all';
    if (typeof window.renderCurrentView === 'function') {
        window.renderCurrentView(window.currentSearch);
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    window.currentSearch = '';
    window.currentView = 'all';
    if (typeof window.renderCurrentView === 'function') {
        window.renderCurrentView('');
    }
}

window.performSearch = performSearch;
window.clearSearch = clearSearch;
