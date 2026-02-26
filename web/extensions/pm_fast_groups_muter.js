/**
 * PM 禁用分组开关 (Fast Groups Muter)
 *
 * 自动收集工作流中所有 Group，可快速切换组内所有节点的 启用/禁用(Mute) 状态。
 * 禁用后节点变为紫色。
 */
import { app } from "/scripts/app.js";
import { createFastGroupsNodeClass } from "./pm_groups_shared.js";

const NODE_TYPE = "PM 禁用分组开关";
const PMFastGroupsMuterNode = createFastGroupsNodeClass({
    nodeType: NODE_TYPE,
    modeOn: LiteGraph.ALWAYS,
    modeOff: LiteGraph.NEVER,
    offMenuLabel: "禁用",
});

app.registerExtension({
    name: "ComfyUI.PM.FastGroupsMuter",
    registerCustomNodes() {
        LiteGraph.registerNodeType(NODE_TYPE, PMFastGroupsMuterNode);
        PMFastGroupsMuterNode.category = "PM Nodes/开关管理";
    },
    loadedGraphNode(node) {
        if (node.type === NODE_TYPE) {
            node._tempSize = [...node.size];
        }
    },
});
