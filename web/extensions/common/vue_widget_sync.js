/**
 * PM Nodes - Nodes 2.0 控件状态同步
 *
 * 新版（Vue）画布并不直接读 litegraph 上的 widget 对象，它渲染的是 pinia 里
 * `widgetValue` store 登记的那一份状态：控件的显示值取自 store，取不到就是 undefined。
 * 节点定义里声明的控件会在创建时自动登记，而 addWidget 手工加出来的不会，
 * 于是 PM 这类动态生成控件的节点改了 widget.value 之后界面纹丝不动。
 *
 * 这里把动态控件补登记进 store，并在每次改值后同步过去。
 * 旧版画布没有这个 store，所有函数都会静默跳过。
 */

const STORE_ID = "widgetValue";
// widgetId 的格式是固定的三段式 graphId:nodeId:name
const ID_SEPARATOR = ":";

function getWidgetValueStore() {
    try {
        const pinia =
            window.app?.extensionManager?._p ||
            document.querySelector("#vue-app")?.__vue_app__?.config?.globalProperties?.$pinia;
        return pinia?._s?.get(STORE_ID) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 按前端推算 widgetId 的同一套规则生成 id：同名同类型的控件从第二个起带 #n 后缀。
 * widget.widgetId 是只读的，只能读不能写，因此这里只能算出一致的值而不是直接指定。
 */
function buildWidgetId(graphId, nodeId, name, dupIndex) {
    const suffixed = dupIndex > 0 ? `${name}#${dupIndex}` : name;
    return [graphId, encodeURIComponent(String(nodeId)), encodeURIComponent(suffixed)].join(ID_SEPARATOR);
}

/**
 * 把节点上所有动态控件的名称和值同步到 Nodes 2.0 的响应式状态，使画布立即重绘。
 * 反复调用是安全的：值没变时 Vue 不会触发重渲染。
 */
export function syncNodeWidgetsToVue(node) {
    const widgets = node?.widgets;
    if (!widgets?.length) return;

    const store = getWidgetValueStore();
    if (!store) return;

    const graphId = node.graph?.rootGraph?.id;
    if (!graphId || node.id == null) return;

    const seen = new Map();
    for (const widget of widgets) {
        if (!widget?.name) continue;

        const key = `${widget.name}:${widget.type}`;
        const dupIndex = seen.get(key) ?? 0;
        seen.set(key, dupIndex + 1);

        const id = widget.widgetId || buildWidgetId(graphId, node.id, widget.name, dupIndex);
        // 控件改名后 id 会变，旧条目要清掉，否则 store 里会越积越多
        if (widget._pmVueId && widget._pmVueId !== id) {
            dropWidgetState(store, widget._pmVueId);
        }
        widget._pmVueId = id;

        try {
            const state =
                store.getWidget(id) ||
                // options 里的 on/off 标签会让布尔控件渲染成两个按钮而不是开关，不要带过去
                store.registerWidget(id, { type: widget.type, value: widget.value, options: {} });
            if (!state) continue;
            state.name = widget.name;
            state.value = widget.value;
        } catch (e) {
            console.warn("[PM-Nodes] 同步控件状态到 Nodes 2.0 失败", e);
        }
    }
}

function dropWidgetState(store, id) {
    try {
        store.deleteWidget(id);
    } catch (e) {
        console.warn("[PM-Nodes] 清理 Nodes 2.0 控件状态失败", e);
    }
}

/** 控件被移除时清掉 store 里对应的条目 */
export function removeWidgetFromVue(widget) {
    if (!widget?._pmVueId) return;
    const store = getWidgetValueStore();
    if (!store) return;
    dropWidgetState(store, widget._pmVueId);
    widget._pmVueId = undefined;
}
