// PM Nodes i18n module
import { api } from "/scripts/api.js";

let currentLocale = 'en';
let translations = {};
let localeChangeListeners = [];

// 等待 ComfyUI app 就绪（最多 timeoutMs 毫秒）
function waitForApp(timeoutMs = 5000) {
    return new Promise((resolve) => {
        if (window?.app?.ui?.settings) {
            resolve(true);
            return;
        }
        const interval = setInterval(() => {
            if (window?.app?.ui?.settings) {
                clearInterval(interval);
                clearTimeout(timeout);
                resolve(true);
            }
        }, 100);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            resolve(false);
        }, timeoutMs);
    });
}

// 获取当前 locale
function getCurrentLocale() {
    if (window?.app?.ui?.settings) {
        const comfyLocale = window.app.ui.settings.getSettingValue('Comfy.Locale');
        if (comfyLocale) return comfyLocale;
    }
    try {
        const settings = localStorage.getItem('Comfy.Settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            if (parsed['Comfy.Locale']) return parsed['Comfy.Locale'];
        }
    } catch (e) { /* ignore */ }
    const lang = (navigator.language || '').toLowerCase();
    if (lang.startsWith('zh')) return 'zh';
    return 'en';
}

// 加载指定 locale 的翻译
async function fetchTranslations(locale) {
    try {
        const response = await api.fetchApi('/i18n');
        const data = await response.json();
        // ComfyUI 的 /i18n 端点将所有插件的 main.json 扁平合并到 data[locale] 下
        if (data[locale]) {
            translations = data[locale];
            currentLocale = locale;
            console.log('[PM Nodes] Loaded translations for locale:', locale);
        } else {
            console.warn('[PM Nodes] No translations found for locale:', locale);
            translations = {};
        }
        
        // 单独加载 nodeDefs.json
        try {
            const nodeDefsResponse = await api.fetchApi(`/extensions/ComfyUI-PM-Nodes/locales/${locale}/nodeDefs.json`);
            if (nodeDefsResponse.ok) {
                const nodeDefsData = await nodeDefsResponse.json();
                translations['nodeDefs'] = nodeDefsData;
                console.log('[PM Nodes] Loaded nodeDefs for locale:', locale);
            }
        } catch (nodeDefsError) {
            console.warn('[PM Nodes] Failed to load nodeDefs:', nodeDefsError);
        }
        
        localeChangeListeners.forEach(listener => {
            try { listener(locale); } catch (e) {
                console.error('[PM Nodes] Error in locale change listener:', e);
            }
        });
    } catch (error) {
        console.error('[PM Nodes] Failed to load translations:', error);
        translations = {};
    }
}

// 翻译函数
export function t(key, defaultValue = '') {
    if (!key) return defaultValue;
    return translations[key] || defaultValue;
}

// 获取节点显示名称（从 nodeDefs 翻译中读取）
export function getNodeDisplayName(nodeType) {
    return translations['nodeDefs']?.[nodeType]?.display_name || nodeType;
}

// 获取分类路径翻译（从 nodeCategories 翻译中读取）
export function getCategoryPath(category) {
    return translations['nodeCategories']?.[category] || category;
}

// 获取当前 locale
export function getLocale() {
    return currentLocale;
}

// 重新加载翻译
export async function reloadTranslations(newLocale) {
    await fetchTranslations(newLocale || getCurrentLocale());
}

// 注册 locale 变化监听器
export function onLocaleChange(callback) {
    localeChangeListeners.push(callback);
    return () => {
        const index = localeChangeListeners.indexOf(callback);
        if (index > -1) localeChangeListeners.splice(index, 1);
    };
}

// 更新节点分类翻译
function updateNodeCategories() {
    if (!window.LiteGraph || !window.LiteGraph.registered_node_types) {
        console.log('[PM Nodes] LiteGraph not available');
        return;
    }

    const nodeCategories = translations['nodeCategories'];
    const nodeDefs = translations['nodeDefs'];
    
    console.log('[PM Nodes] Updating categories and titles...');

    // 更新所有已注册的节点类型
    for (const [nodeType, nodeDef] of Object.entries(window.LiteGraph.registered_node_types)) {
        // 更新分类
        if (nodeCategories && nodeDef.category && nodeCategories[nodeDef.category]) {
            const originalCategory = nodeDef.category;
            nodeDef.category = nodeCategories[originalCategory];
            if (nodeDef._category) {
                nodeDef._category = nodeCategories[originalCategory];
            }
            console.log('[PM Nodes] Updated category for', nodeType, ':', originalCategory, '->', nodeDef.category);
        }

        // 更新标题（从 nodeDefs 翻译中读取 display_name）
        if (nodeDefs && nodeDefs[nodeType] && nodeDefs[nodeType].display_name) {
            const translatedTitle = nodeDefs[nodeType].display_name;
            
            // 更新节点类型的 title（影响节点库中的显示）
            nodeDef.title = translatedTitle;
            if (nodeDef.constructor) {
                nodeDef.constructor.title = translatedTitle;
            }
            
            console.log('[PM Nodes] Updated title for', nodeType, ':', translatedTitle);
        }
    }

    // 更新画布上已存在的节点实例的标题
    if (window.app && window.app.graph && window.app.graph._nodes) {
        for (const node of window.app.graph._nodes) {
            const nodeType = node.type;
            if (nodeDefs && nodeDefs[nodeType] && nodeDefs[nodeType].display_name) {
                const translatedTitle = nodeDefs[nodeType].display_name;
                node.title = translatedTitle;
                console.log('[PM Nodes] Updated instance title for', nodeType, ':', translatedTitle);
            }
        }
    }

    // 触发 ComfyUI 重新构建节点菜单
    if (window.app && window.app.ui && window.app.ui.nodeLibrary) {
        try {
            window.app.ui.nodeLibrary.rebuild();
            console.log('[PM Nodes] Node library rebuilt');
        } catch (e) {
            console.warn('[PM Nodes] Failed to rebuild node library:', e);
        }
    }
    
    // 重绘画布
    if (window.app && window.app.canvas) {
        window.app.canvas.setDirty(true, true);
        console.log('[PM Nodes] Canvas redraw triggered');
    }
}

// 初始化：快速加载 → 等待 app 就绪 → 校准 locale → 启动监控
async function init() {
    // 第一步：快速加载，保证 t() 尽快有数据（locale 可能不准确）
    await fetchTranslations(getCurrentLocale());

    // 第二步：等待 ComfyUI app 就绪后校准 locale
    const appReady = await waitForApp();
    if (!appReady) {
        console.warn('[PM Nodes] App not ready after timeout, locale monitoring disabled');
        return;
    }

    const actualLocale = getCurrentLocale();
    if (actualLocale !== currentLocale) {
        console.log('[PM Nodes] Correcting locale from', currentLocale, 'to', actualLocale);
        await fetchTranslations(actualLocale);
    }

    // 更新节点分类翻译
    updateNodeCategories();

    // 第三步：启动 locale 变化监控，baseline 用实际加载的 locale
    let lastLocale = currentLocale;
    setInterval(() => {
        const newLocale = getCurrentLocale();
        if (newLocale !== lastLocale) {
            console.log('[PM Nodes] Locale changed from', lastLocale, 'to', newLocale);
            lastLocale = newLocale;
            reloadTranslations(newLocale).then(() => {
                updateNodeCategories();
            });
        }
    }, 1000);

    console.log('[PM Nodes] Locale monitoring started');
}

export const initPromise = init();
