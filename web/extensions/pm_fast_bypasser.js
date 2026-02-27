/**
 * PM Fast Bypasser
 *
 * Frontend virtual node to quickly toggle enable/bypass status of connected nodes.
 * Bypassed nodes become gray (Bypass, mode=4).
 *
 * Usage: Connect any output of the nodes you want to control to this node's input.
 * The node will automatically create toggle controls for each connected node.
 * The first input "Master Toggle" can receive external bool value to control all switches.
 */
import { app } from "/scripts/app.js";
import { t } from "./common/i18n.js";

const NODE_TYPE = "PM Fast Bypasser";
const CATEGORY = "PM Nodes/Switch Management";
const MODE_BYPASS = 4;

class PMFastBypasserNode extends LGraphNode {
    static title = NODE_TYPE;
    static type = NODE_TYPE;
    static category = CATEGORY;
    static _category = CATEGORY;
    static collapsible = false;

    constructor(title = NODE_TYPE) {
        super(title);
        this.isVirtualNode = true;
        this.serialize_widgets = false;
        this.modeOn = LiteGraph.ALWAYS;
        this.modeOff = MODE_BYPASS;
        this._tempWidth = 0;
        this._debouncerTempWidth = 0;
        this._schedulePromise = null;
        this.properties = this.properties || {};
        this.properties["toggleRestriction"] = "default";
        this.widgets = this.widgets || [];

        this.addInput(t('masterToggle', 'Master Toggle'), "BOOLEAN");
        this.addInput("", "*");
    }

    onConnectionsChange(_type, _index, _connected, _linkInfo, _ioSlot) {
        this._scheduleStabilize();
    }

    _scheduleStabilize(ms = 100) {
        if (!this._schedulePromise) {
            this._schedulePromise = new Promise((resolve) => {
                setTimeout(() => {
                    this._schedulePromise = null;
                    this._doStabilize();
                    resolve();
                }, ms);
            });
        }
        return this._schedulePromise;
    }

    _getGlobalBoolValue() {
        const input = this.inputs?.[0];
        if (!input || !input.link) return null;
        const link = this.graph?.links[input.link];
        if (!link) return null;
        const sourceNode = this.graph.getNodeById(link.origin_id);
        if (!sourceNode) return null;
        const outputSlot = link.origin_slot;
        const output = sourceNode.outputs?.[outputSlot];
        if (output) {
            const widget = sourceNode.widgets?.find(w => w.name === output.name);
            if (widget != null && widget.value != null) return !!widget.value;
        }
        const widgetBySlot = sourceNode.widgets?.[outputSlot];
        if (widgetBySlot != null && widgetBySlot.value != null) return !!widgetBySlot.value;
        return null;
    }

    _doStabilize() {
        if (!this.graph) return;
        let dirty = false;
        this._tempWidth = this.size[0];

        const masterLabel = t('masterToggle', 'Master Toggle');
        if (this.inputs[0] && this.inputs[0].name !== masterLabel) {
            this.inputs[0].name = masterLabel;
            dirty = true;
        }

        dirty = this._stabilizeInputs() || dirty;

        const linkedNodes = this._getLinkedInputNodes();
        dirty = this._updateWidgets(linkedNodes) || dirty;

        const globalBool = this._getGlobalBoolValue();
        if (globalBool != null) {
            for (const widget of this.widgets) {
                if (widget.doModeChange) {
                    widget.doModeChange(globalBool, true);
                }
            }
        }

        if (dirty) {
            this.graph.setDirtyCanvas(true, true);
        }
        this._scheduleStabilize(500);
    }

    _stabilizeInputs() {
        let changed = false;
        const lastInput = this.inputs[this.inputs.length - 1];
        if (lastInput && lastInput.link != null) {
            this.addInput("", "*");
            changed = true;
        }
        for (let i = this.inputs.length - 2; i >= 1; i--) {
            const input = this.inputs[i];
            if (!input.link) {
                this.removeInput(i);
                changed = true;
            } else {
                const node = this._getNodeForInput(i);
                const newName = node ? node.title : "";
                if (input.name !== newName) {
                    input.name = newName;
                    changed = true;
                }
            }
        }
        return changed;
    }

    _getNodeForInput(slot) {
        const input = this.inputs[slot];
        if (!input || !input.link) return null;
        const link = this.graph.links[input.link];
        if (!link) return null;
        return this.graph.getNodeById(link.origin_id);
    }

    _getLinkedInputNodes() {
        const nodes = [];
        for (let i = 1; i < this.inputs.length; i++) {
            const node = this._getNodeForInput(i);
            if (node) nodes.push(node);
        }
        return nodes;
    }

    _changeModeOfNode(node, mode) {
        node.mode = mode;
    }

    _updateWidgets(linkedNodes) {
        let changed = false;
        for (let index = 0; index < linkedNodes.length; index++) {
            const linkedNode = linkedNodes[index];
            let widget = this.widgets && this.widgets[index];

            if (!widget) {
                this._tempWidth = this.size[0];
                widget = this.addWidget("toggle", "", false, "", { on: "yes", off: "no" });
                changed = true;
            }

            if (linkedNode) {
                changed = this._setWidget(widget, linkedNode) || changed;
            }
        }

        if (this.widgets && this.widgets.length > linkedNodes.length) {
            this.widgets.length = linkedNodes.length;
            changed = true;
        }
        return changed;
    }

    _setWidget(widget, linkedNode) {
        let changed = false;
        const value = linkedNode.mode === this.modeOn;
        const name = `${t('enable', 'Enable')} ${linkedNode.title}`;

        if (widget.name !== name) {
            widget.name = name;
            widget.options = { on: "yes", off: "no" };
            widget.value = value;

            widget.doModeChange = (forceValue, skipOtherNodeCheck) => {
                let newValue = forceValue != null ? forceValue : linkedNode.mode === this.modeOff;
                if (skipOtherNodeCheck !== true) {
                    if (newValue && this.properties["toggleRestriction"]?.includes(" one")) {
                        for (const w of this.widgets) {
                            w.doModeChange(false, true);
                        }
                    } else if (!newValue && this.properties["toggleRestriction"] === "always one") {
                        newValue = this.widgets.every((w) => !w.value || w === widget);
                    }
                }
                this._changeModeOfNode(linkedNode, newValue ? this.modeOn : this.modeOff);
                widget.value = newValue;
            };

            widget.callback = () => {
                const globalBool = this._getGlobalBoolValue();
                if (globalBool != null) return;
                widget.doModeChange();
            };

            changed = true;
        }
        return changed;
    }

    computeSize(out) {
        let size = super.computeSize(out);
        if (this._tempWidth) {
            size[0] = Math.max(this._tempWidth, size[0]);
            this._debouncerTempWidth && clearTimeout(this._debouncerTempWidth);
            this._debouncerTempWidth = setTimeout(() => {
                this._tempWidth = 0;
            }, 32);
        }
        setTimeout(() => {
            this.graph?.setDirtyCanvas(true, true);
        }, 16);
        return size;
    }

    getExtraMenuOptions(_canvas, options) {
        options.push(null);
        options.push({
            content: t('bypassAll', 'Bypass All'),
            callback: () => {
                for (const widget of this.widgets) {
                    widget.doModeChange?.(false, true);
                }
            },
        });
        options.push({
            content: t('enableAll', 'Enable All'),
            callback: () => {
                for (const widget of this.widgets) {
                    widget.doModeChange?.(true, true);
                }
            },
        });
        options.push({
            content: t('toggleAll', 'Toggle All'),
            callback: () => {
                for (const widget of this.widgets) {
                    widget.doModeChange?.(!widget.value, true);
                }
            },
        });
        return [];
    }
}

app.registerExtension({
    name: "ComfyUI.PM.FastBypasser",
    registerCustomNodes() {
        LiteGraph.registerNodeType(NODE_TYPE, PMFastBypasserNode);
        PMFastBypasserNode.category = CATEGORY;
    },
    loadedGraphNode(node) {
        if (node.type === NODE_TYPE) {
            node._tempWidth = node.size[0];
        }
    },
});
