/**
 * PM 忽略分组开关 (Fast Groups Bypasser)
 *
 * 自动收集工作流中所有 Group，可快速切换组内所有节点的 启用/忽略(Bypass) 状态。
 * 忽略后节点变为灰色。
 */
import { app } from "/scripts/app.js";
import { createFastGroupsNodeClass } from "./pm_groups_shared.js";

const NODE_TYPE = "PM 忽略分组开关";
const MODE_BYPASS = 4;

const PMFastGroupsBypasserNode = createFastGroupsNodeClass({
    nodeType: NODE_TYPE,
    modeOn: LiteGraph.ALWAYS,
    modeOff: MODE_BYPASS,
    offMenuLabel: "忽略",
});

app.registerExtension({
    name: "ComfyUI.PM.FastGroupsBypasser",
    registerCustomNodes() {
        LiteGraph.registerNodeType(NODE_TYPE, PMFastGroupsBypasserNode);
        PMFastGroupsBypasserNode.category = "PM Nodes/开关管理";
    },
    loadedGraphNode(node) {
        if (node.type === NODE_TYPE) {
            node._tempSize = [...node.size];
        }
    },
});
