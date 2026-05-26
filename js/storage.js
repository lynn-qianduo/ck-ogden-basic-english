// ======================== 存储模块 ========================
(function() {
    // 使用局部变量，通过 window 暴露
    let favorites = JSON.parse(localStorage.getItem('basic_favorites') || '[]');
    let wrongWords = JSON.parse(localStorage.getItem('basic_wrongWords') || '[]');
    let mastered = JSON.parse(localStorage.getItem('basic_mastered') || '[]');

    function saveFavorites() { localStorage.setItem('basic_favorites', JSON.stringify(favorites)); }
    function saveWrongWords() { localStorage.setItem('basic_wrongWords', JSON.stringify(wrongWords)); }
    function saveMastered() { localStorage.setItem('basic_mastered', JSON.stringify(mastered)); }

    window.isFavorite = function(word) { return favorites.includes(word); };

    window.addWrongWord = function(wordObj) {
        if (!wrongWords.find(w => w.word === wordObj.word)) {
            wrongWords.push(wordObj);
            saveWrongWords();
            window.wrongWords = wrongWords;
        }
    };

    window.removeWrongWord = function(word) {
        wrongWords = wrongWords.filter(w => w.word !== word);
        saveWrongWords();
        window.wrongWords = wrongWords;
    };

    window.toggleFavorite = function(word, event, skipRender) {
        if (event) event.stopPropagation();
        if (favorites.includes(word)) {
            favorites = favorites.filter(w => w !== word);
        } else {
            favorites.push(word);
        }
        saveFavorites();
        window.favorites = favorites;
        if (!skipRender && typeof window.renderCurrentView === 'function') {
            window.renderCurrentView(window.currentSearch || '');
        }
        if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
    };

    // 暴露数据
    window.favorites = favorites;
    window.wrongWords = wrongWords;
    window.mastered = mastered;
    window.saveFavorites = saveFavorites;
    window.saveWrongWords = saveWrongWords;
    window.saveMastered = saveMastered;
})();