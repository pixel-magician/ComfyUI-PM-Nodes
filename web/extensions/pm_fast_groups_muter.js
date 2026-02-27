/**
 * PM Fast Groups Muter
 *
 * Automatically collect all Groups in the workflow, quickly toggle enable/mute status of all nodes in the group.
 * Muted nodes become purple.
 */
import { app } from "/scripts/app.js";
import { createFastGroupsNodeClass } from "./pm_groups_shared.js";
const NODE_TYPE = "PM Fast Groups Muter";

const PMFastGroupsMuterNode = createFastGroupsNodeClass({
    nodeType: NODE_TYPE,
    modeOn: LiteGraph.ALWAYS,
    modeOff: LiteGraph.NEVER,
    offMenuLabel: "Mute",
});

app.registerExtension({
    name: "ComfyUI.PM.FastGroupsMuter",
    registerCustomNodes() {
        LiteGraph.registerNodeType(NODE_TYPE, PMFastGroupsMuterNode);
        PMFastGroupsMuterNode.category = "PM Nodes/Switch Management";
    },
    loadedGraphNode(node) {
        if (node.type === NODE_TYPE) {
            node._tempSize = [...node.size];
        }
    },
});
