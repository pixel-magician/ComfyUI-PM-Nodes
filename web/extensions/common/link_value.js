/**
 * PM Nodes - 上游布尔值解析
 *
 * 从节点的某个输入槽出发，沿链路向上追溯，读取上游提供的布尔值。
 * 相比直接读 `graph.links[id]` 再取 widget，这里额外处理了几种前端会遇到的情况：
 *
 *   1. 链路起点是子图的输入边界（origin_id === -10），此时 getNodeById 必定返回 null，
 *      需要找到父级子图节点，改从它对应的输入槽继续往上追。
 *   2. 上游节点本身是子图节点，需要下钻到子图内部的输出边界继续追。
 *   3. 中间存在 Reroute 之类的直通节点。
 *   4. 上游节点的 widget 名称与输出槽名称对不上（核心 Boolean 原始节点即如此：
 *      输出名为 BOOLEAN，widget 名为 value）。
 */
import { app } from "/scripts/app.js";

const SUBGRAPH_INPUT_ID = -10;
const SUBGRAPH_OUTPUT_ID = -20;
const MAX_HOPS = 32;

const TRUE_WORDS = new Set(["true", "1", "yes", "on", "enable", "enabled"]);
const FALSE_WORDS = new Set(["false", "0", "no", "off", "disable", "disabled"]);
const VALUE_WIDGET_NAMES = ["value", "bool", "boolean", "enabled", "enable", "on"];

function coerceBool(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isNaN(value) ? null : value !== 0;
    if (typeof value === "string") {
        const text = value.trim().toLowerCase();
        if (TRUE_WORDS.has(text)) return true;
        if (FALSE_WORDS.has(text)) return false;
    }
    return null;
}

function getLink(graph, linkId) {
    if (!graph || linkId == null) return null;
    const link = graph.getLink?.(linkId);
    if (link) return link;
    const links = graph.links;
    if (!links) return null;
    if (typeof links.get === "function") return links.get(linkId) ?? null;
    return links[linkId] ?? null;
}

function* iterLinks(graph) {
    const map = graph?._links;
    if (map && typeof map.values === "function") {
        yield* map.values();
        return;
    }
    const links = graph?.links;
    if (!links) return;
    if (typeof links.values === "function") {
        yield* links.values();
        return;
    }
    for (const key of Object.keys(links)) yield links[key];
}

function getNodes(graph) {
    return graph?.nodes ?? graph?._nodes ?? [];
}

/**
 * 子图定义本身不持有实例引用（同一定义可被多处引用），
 * 只能从根图递归查找持有该子图的子图节点。
 */
function findSubgraphNodeInstance(subgraph) {
    if (!subgraph) return null;
    const stack = [];
    if (subgraph.rootGraph && subgraph.rootGraph !== subgraph) stack.push(subgraph.rootGraph);
    if (app?.graph && app.graph !== subgraph) stack.push(app.graph);

    const seen = new Set();
    while (stack.length) {
        const graph = stack.pop();
        if (!graph || seen.has(graph)) continue;
        seen.add(graph);
        for (const node of getNodes(graph)) {
            if (!node?.isSubgraphNode?.() || !node.subgraph) continue;
            if (node.subgraph === subgraph) return node;
            stack.push(node.subgraph);
        }
    }
    return null;
}

function findLinkToSubgraphOutput(subgraph, slotIndex) {
    for (const link of iterLinks(subgraph)) {
        if (link?.target_id === SUBGRAPH_OUTPUT_ID && link.target_slot === slotIndex) return link;
    }
    return null;
}

/** 取输入槽背后的 widget（子图节点上被提升出来的 widget 走这条路） */
function getWidgetForSlot(node, slot) {
    if (!node || !slot) return null;
    const widget = node.getWidgetFromSlot?.(slot);
    if (widget) return widget;
    const name = slot.widget?.name ?? slot.name;
    if (!name) return null;
    return node.widgets?.find((w) => w.name === name) ?? null;
}

/** 没有 widget、只做转发的节点，直接穿过去继续找源头 */
function isPassThrough(node) {
    if (!node) return false;
    if (typeof node.type === "string" && /reroute/i.test(node.type)) return true;
    if (node.widgets?.length) return false;
    return node.inputs?.length === 1 && node.outputs?.length === 1;
}

function readBoolFromOutput(node, slotIndex) {
    const widgets = node?.widgets;
    if (!widgets?.length) return null;

    const output = node.outputs?.[slotIndex];
    const names = [output?.widget?.name, output?.name, output?.localized_name, output?.label]
        .filter((name) => typeof name === "string" && name !== "");
    for (const name of names) {
        const widget = widgets.find((w) => w.name === name || w.label === name);
        const value = coerceBool(widget?.value);
        if (value !== null) return value;
    }

    // 节点上只有一个布尔 widget 时它必然就是要找的那个，核心 Boolean 原始节点属于此类
    const boolWidgets = widgets.filter(
        (w) => typeof w.value === "boolean" || w.type === "toggle" || w.type === "boolean",
    );
    if (boolWidgets.length === 1) {
        const value = coerceBool(boolWidgets[0].value);
        if (value !== null) return value;
    }

    for (const name of VALUE_WIDGET_NAMES) {
        const widget = widgets.find((w) => String(w.name).toLowerCase() === name);
        const value = coerceBool(widget?.value);
        if (value !== null) return value;
    }

    const bySlot = coerceBool(widgets[slotIndex]?.value);
    if (bySlot !== null) return bySlot;

    return widgets.length === 1 ? coerceBool(widgets[0].value) : null;
}

/**
 * 追溯输入槽上游的布尔值，返回 { value, reason, trace }。
 * value 为 null 表示没连线或上游读不出值，调用方应回退到手动控制。
 */
export function traceBoolFromInput(node, slotIndex = 0) {
    const trace = [];
    const fail = (reason) => ({ value: null, reason, trace });
    const ok = (value) => ({ value, reason: null, trace });

    const input = node?.inputs?.[slotIndex];
    if (!input) return fail(`输入槽 ${slotIndex} 不存在`);
    if (input.link == null) return fail("输入槽未连线");

    let graph = node.graph;
    let linkId = input.link;

    for (let hop = 0; hop < MAX_HOPS; hop++) {
        const link = getLink(graph, linkId);
        if (!link) return fail(`找不到链路 ${linkId}`);

        const step = { hop, linkId, originId: link.origin_id, originSlot: link.origin_slot };
        trace.push(step);

        if (link.origin_id === SUBGRAPH_INPUT_ID) {
            const subgraphNode = findSubgraphNodeInstance(graph);
            if (!subgraphNode) return fail("链路来自子图输入边界，但找不到父级子图节点");
            step.originType = "SubgraphInput";

            const outerInput = subgraphNode.inputs?.[link.origin_slot];
            if (!outerInput) return fail("父级子图节点上缺少对应的输入槽");

            if (outerInput.link == null) {
                // 外层没有连线时，值来自子图节点上提升出来的 widget
                const value = coerceBool(getWidgetForSlot(subgraphNode, outerInput)?.value);
                return value === null ? fail("子图输入既无外部连线也无可用 widget") : ok(value);
            }
            graph = subgraphNode.graph;
            linkId = outerInput.link;
            continue;
        }

        const originNode = graph?.getNodeById?.(link.origin_id);
        if (!originNode) return fail(`在当前图中找不到上游节点 ${link.origin_id}`);
        step.originType = originNode.type;

        if (originNode.isSubgraphNode?.() && originNode.subgraph) {
            const innerLink = findLinkToSubgraphOutput(originNode.subgraph, link.origin_slot);
            if (!innerLink) return fail("上游子图的输出边界内部没有连线");
            graph = originNode.subgraph;
            linkId = innerLink.id;
            continue;
        }

        if (isPassThrough(originNode)) {
            const upstream = originNode.inputs?.find((i) => i.link != null);
            if (upstream) {
                graph = originNode.graph ?? graph;
                linkId = upstream.link;
                continue;
            }
        }

        const value = readBoolFromOutput(originNode, link.origin_slot);
        return value === null ? fail(`上游节点 ${originNode.type} 上找不到可读取的布尔 widget`) : ok(value);
    }

    return fail("链路跳转次数超过上限，可能存在环");
}

export function resolveBoolFromInput(node, slotIndex = 0) {
    return traceBoolFromInput(node, slotIndex).value;
}

// 便于在浏览器控制台里排查："选中节点后执行 PMNodes.traceSelected()"
if (typeof window !== "undefined") {
    window.PMNodes = Object.assign(window.PMNodes ?? {}, {
        traceBoolFromInput,
        traceSelected(slotIndex = 0) {
            const node = Object.values(app?.canvas?.selected_nodes ?? {})[0];
            if (!node) return "没有选中节点";
            return traceBoolFromInput(node, slotIndex);
        },
    });
}
