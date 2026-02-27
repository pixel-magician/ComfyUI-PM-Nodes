/**
 * PM Fast Groups Bypasser
 *
 * Automatically collect all Groups in the workflow, quickly toggle enable/bypass status of all nodes in the group.
 * Bypassed nodes become gray.
 */
import { app } from "/scripts/app.js";
import { createFastGroupsNodeClass } from "./pm_groups_shared.js";
const NODE_TYPE = "PM Fast Groups Bypasser";
const MODE_BYPASS = 4;

const PMFastGroupsBypasserNode = createFastGroupsNodeClass({
    nodeType: NODE_TYPE,
    modeOn: LiteGraph.ALWAYS,
    modeOff: MODE_BYPASS,
    offMenuLabel: "Bypass",
});

app.registerExtension({
    name: "ComfyUI.PM.FastGroupsBypasser",
    registerCustomNodes() {
        LiteGraph.registerNodeType(NODE_TYPE, PMFastGroupsBypasserNode);
        PMFastGroupsBypasserNode.category = "PM Nodes/Switch Management";
    },
    loadedGraphNode(node) {
        if (node.type === NODE_TYPE) {
            node._tempSize = [...node.size];
        }
    },
});
