// data/sentenceDatabase.js - 避免重复加载
if (typeof window.BASIC_850_SENTENCE_DB === 'undefined') {

const BASIC_850_SENTENCE_DB = {
    // ... 保持原有内容不变 ...
};

window.BASIC_850_SENTENCE_DB = BASIC_850_SENTENCE_DB;

window.getBasicSentence = function(word, level = null) {
    const lowerWord = word.toLowerCase();
    
    // 在操作词中查找
    for (const [category, words] of Object.entries(BASIC_850_SENTENCE_DB.operators || {})) {
        if (words[lowerWord]) {
            const sentences = words[lowerWord];
            if (level && level === 'simple') return sentences[0];
            if (level && level === 'intermediate') return sentences.find(s => s.level === '中级') || sentences[2];
            if (level && level === 'advanced') return sentences.find(s => s.level === '高级') || sentences[3];
            return sentences;
        }
    }
    
    // 在形容词中查找
    for (const [category, words] of Object.entries(BASIC_850_SENTENCE_DB.adjectives || {})) {
        if (words[lowerWord]) {
            const sentences = words[lowerWord];
            if (level && level === 'simple') return sentences[0];
            if (level && level === 'intermediate') return sentences.find(s => s.level === '中级') || sentences[2];
            if (level && level === 'advanced') return sentences.find(s => s.level === '高级') || sentences[3];
            return sentences;
        }
    }
    
    // 在名词中查找
    for (const [category, words] of Object.entries(BASIC_850_SENTENCE_DB.nouns || {})) {
        if (words[lowerWord]) {
            const sentences = words[lowerWord];
            if (level && level === 'simple') return sentences[0];
            if (level && level === 'intermediate') return sentences.find(s => s.level === '中级') || sentences[2];
            if (level && level === 'advanced') return sentences.find(s => s.level === '高级') || sentences[3];
            return sentences;
        }
    }
    
    // 在方向词中查找
    for (const [category, words] of Object.entries(BASIC_850_SENTENCE_DB.directives || {})) {
        if (words[lowerWord]) {
            const sentences = words[lowerWord];
            if (level && level === 'simple') return sentences[0];
            if (level && level === 'intermediate') return sentences.find(s => s.level === '中级') || sentences[2];
            if (level && level === 'advanced') return sentences.find(s => s.level === '高级') || sentences[3];
            return sentences;
        }
    }
    
    // 降级到通用语句库
    const generic = BASIC_850_SENTENCE_DB.generic;
    if (level === 'simple') {
        const template = generic.simple[Math.floor(Math.random() * generic.simple.length)];
        return [{ level: '简单', en: template.replace('{word}', word), cn: `这个 ${word} 很好。` }];
    } else if (level === 'intermediate') {
        const template = generic.intermediate[Math.floor(Math.random() * generic.intermediate.length)];
        return [{ level: '中级', en: template.replace('{word}', word), cn: `${word} 让生活更美好。` }];
    } else if (level === 'advanced') {
        const template = generic.advanced[Math.floor(Math.random() * generic.advanced.length)];
        return [{ level: '高级', en: template.replace('{word}', word), cn: `${word} 是人生的重要部分。` }];
    }
    
    return [
        { level: '简单', en: `The ${word} is good.`, cn: `这个 ${word} 很好。` },
        { level: '中级', en: `A ${word} can bring great pleasure to life.`, cn: `${word} 能给生活带来巨大快乐。` },
        { level: '高级', en: `The best ${word} is one that comes from a pure heart.`, cn: `最好的 ${word} 来自纯净的心。` }
    ];
};

console.log('Basic English 850 例句库已加载');

} // 结束 if