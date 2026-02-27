/**
 * PM Fast Groups Muter
 *
 * Automatically collect all Groups in the workflow, quickly toggle enable/mute status of all nodes in the group.
 * Muted nodes become purple.
 */
import { app } from "/scripts/app.js";
import { createFastGroupsNodeClass } from "./pm_groups_shared.js";
import { getNodeDisplayName, getCategoryPath } from "./common/i18n.js";

const NODE_TYPE = "PM Fast Groups Muter";
const CATEGORY = "PM Nodes/Switch Management";

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
        PMFastGroupsMuterNode.category = getCategoryPath(CATEGORY);
        PMFastGroupsMuterNode.title = getNodeDisplayName(NODE_TYPE);
    },
    loadedGraphNode(node) {
        if (node.type === NODE_TYPE) {
            node._tempSize = [...node.size];
            node.title = getNodeDisplayName(NODE_TYPE);
        }
    },
});
