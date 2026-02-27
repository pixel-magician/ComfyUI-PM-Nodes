/**
 * PM Fast Groups Shared Module
 *
 * Contains Groups Service (singleton), Toggle Widget, utility functions,
 * shared by "Fast Groups Bypasser" and "Fast Groups Muter" nodes.
 */
import { app } from "/scripts/app.js";
import { t } from "./common/i18n.js";

const PROP_MATCH_COLORS = "matchColors";
const PROP_MATCH_TITLE = "matchTitle";
const PROP_SHOW_NAV = "showNav";
const PROP_SORT = "sort";
const PROP_RESTRICTION = "toggleRestriction";

export { PROP_MATCH_COLORS, PROP_MATCH_TITLE, PROP_SHOW_NAV, PROP_SORT, PROP_RESTRICTION };

// ─── Utility Functions ───

export function getGroupNodes(group) {
    if (group._children) {
        return Array.from(group._children).filter((c) => c instanceof LGraphNode);
    }
    if (group.nodes) {
        return group.nodes.filter((c) => c instanceof LGraphNode);
    }
    return [];
}

export function changeModeOfNodes(nodes, mode) {
    const list = Array.isArray(nodes) ? nodes : [nodes];
    for (const node of list) {
        node.mode = mode;
    }
}

function fitString(ctx, str, maxWidth) {
    let width = ctx.measureText(str).width;
    const ellipsis = "…";
    const ellipsisWidth = ctx.measureText(ellipsis).width;
    if (width <= maxWidth || width <= ellipsisWidth) return str;
    let lo = 0, hi = str.length;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (ctx.measureText(str.substring(0, mid)).width < maxWidth - ellipsisWidth) {
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return str.substring(0, hi) + ellipsis;
}

function isLowQuality() {
    const canvas = app.canvas;
    return ((canvas.ds?.scale) || 1) <= 0.5;
}

function drawNodeWidget(ctx, options) {
    const lowQuality = isLowQuality();
    const data = {
        width: options.size[0],
        height: options.size[1],
        posY: options.pos[1],
        lowQuality,
        margin: 15,
        colorOutline: LiteGraph.WIDGET_OUTLINE_COLOR,
        colorBackground: LiteGraph.WIDGET_BGCOLOR,
        colorText: LiteGraph.WIDGET_TEXT_COLOR,
        colorTextSecondary: LiteGraph.WIDGET_SECONDARY_TEXT_COLOR,
    };
    ctx.strokeStyle = data.colorOutline;
    ctx.fillStyle = data.colorBackground;
    ctx.beginPath();
    ctx.roundRect(data.margin, data.posY, data.width - data.margin * 2, data.height,
        lowQuality ? [0] : [options.size[1] * 0.5]);
    ctx.fill();
    if (!lowQuality) ctx.stroke();
    return data;
}

// ─── Toggle Row Widget ───

export class PMGroupToggleWidget {
    constructor(group, node) {
        this.name = "PM_GROUP_TOGGLE";
        this.type = "custom";
        this.value = { toggled: false };
        this.options = { on: "yes", off: "no" };
        this.label = "";
        this.group = group;
        this.node = node;
        this.last_y = 0;
        this.y = 0;
        this.controlled = false;
    }

    get toggled() { return this.value.toggled; }
    set toggled(v) { this.value.toggled = v; }

    doModeChange(force, skipOtherNodeCheck) {
        this.group.recomputeInsideNodes();
        const hasActive = getGroupNodes(this.group).some((n) => n.mode === LiteGraph.ALWAYS);
        let newValue = force != null ? force : !hasActive;

        if (skipOtherNodeCheck !== true) {
            if (newValue && this.node.properties[PROP_RESTRICTION]?.includes(" one")) {
                for (const w of this.node.widgets) {
                    if (w instanceof PMGroupToggleWidget) w.doModeChange(false, true);
                }
            } else if (!newValue && this.node.properties[PROP_RESTRICTION] === "always one") {
                newValue = this.node.widgets.every((w) => !w.value || w === this);
            }
        }

        changeModeOfNodes(getGroupNodes(this.group), newValue ? this.node.modeOn : this.node.modeOff);
        this.group._pm_hasAnyActive = newValue;
        this.toggled = newValue;
        this.group.graph?.setDirtyCanvas(true, false);
    }

    toggle(value) {
        value = value == null ? !this.toggled : value;
        if (value !== this.toggled) {
            this.value.toggled = value;
            this.doModeChange();
        }
    }

    draw(ctx, node, width, posY, height) {
        const wd = drawNodeWidget(ctx, { size: [width, height], pos: [15, posY] });
        const showNav = node.properties[PROP_SHOW_NAV] !== false;
        let currentX = wd.width - wd.margin;

        if (!wd.lowQuality && showNav) {
            currentX -= 7;
            const midY = wd.posY + wd.height * 0.5;
            ctx.fillStyle = ctx.strokeStyle = "#89A";
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            const arrow = new Path2D(`M${currentX} ${midY} l -7 6 v -3 h -7 v -6 h 7 v -3 z`);
            ctx.fill(arrow);
            ctx.stroke(arrow);
            currentX -= 14;
            currentX -= 7;
            ctx.strokeStyle = wd.colorOutline;
            ctx.stroke(new Path2D(`M ${currentX} ${wd.posY} v ${wd.height}`));
        } else if (wd.lowQuality && showNav) {
            currentX -= 28;
        }

        currentX -= 7;
        if (this.controlled) {
            ctx.fillStyle = this.toggled ? "#6A8" : "#555";
        } else {
            ctx.fillStyle = this.toggled ? "#89A" : "#333";
        }
        ctx.beginPath();
        const toggleRadius = height * 0.36;
        ctx.arc(currentX - toggleRadius, posY + height * 0.5, toggleRadius, 0, Math.PI * 2);
        ctx.fill();
        currentX -= toggleRadius * 2;

        if (!wd.lowQuality) {
            currentX -= 4;
            ctx.textAlign = "right";
            ctx.fillStyle = this.toggled ? wd.colorText : wd.colorTextSecondary;
            if (this.controlled) {
                ctx.globalAlpha = 0.6;
            }
            const toggleLabelOn = this.options.on || "true";
            const toggleLabelOff = this.options.off || "false";
            ctx.fillText(this.toggled ? toggleLabelOn : toggleLabelOff, currentX, posY + height * 0.7);
            currentX -= Math.max(
                ctx.measureText(toggleLabelOn).width,
                ctx.measureText(toggleLabelOff).width
            );
            currentX -= 7;
            ctx.textAlign = "left";
            const maxLabelWidth = wd.width - wd.margin - 10 - (wd.width - currentX);
            if (this.label != null) {
                ctx.fillText(fitString(ctx, this.label, maxLabelWidth), wd.margin + 10, posY + height * 0.7);
            }
            if (this.controlled) {
                ctx.globalAlpha = 1.0;
            }
        }
    }

    serializeValue() {
        return this.value;
    }

    mouse(event, pos, node) {
        if (event.type === "pointerdown") {
            const showNav = node.properties[PROP_SHOW_NAV] !== false;
            if (showNav && pos[0] >= node.size[0] - 15 - 28 - 1) {
                const canvas = app.canvas;
                const lowQ = ((canvas.ds?.scale) || 1) <= 0.5;
                if (!lowQ) {
                    canvas.centerOnNode(this.group);
                    const zoomCurrent = (canvas.ds?.scale) || 1;
                    const zoomX = canvas.canvas.width / this.group._size[0] - 0.02;
                    const zoomY = canvas.canvas.height / this.group._size[1] - 0.02;
                    canvas.setZoom(Math.min(zoomCurrent, zoomX, zoomY), [
                        canvas.canvas.width / 2,
                        canvas.canvas.height / 2,
                    ]);
                    canvas.setDirty(true, true);
                }
            } else if (!this.controlled) {
                this.toggle();
            }
        }
        return true;
    }
}

// ─── Groups Service (Singleton) ───

class PMGroupsService {
    constructor() {
        this._msThreshold = 400;
        this._msLastUnsorted = 0;
        this._msLastAlpha = 0;
        this._msLastPosition = 0;
        this._groupsUnsorted = [];
        this._groupsSortedAlpha = [];
        this._groupsSortedPosition = [];
        this._nodes = [];
        this._runScheduledMs = null;
        this._runTimeout = null;
        this._runAnim = null;
    }

    addNode(node) {
        this._nodes.push(node);
        this._scheduleRun(8);
    }

    removeNode(node) {
        const idx = this._nodes.indexOf(node);
        if (idx > -1) this._nodes.splice(idx, 1);
        if (!this._nodes.length) {
            this._clearRun();
            this._groupsUnsorted = [];
            this._groupsSortedAlpha = [];
            this._groupsSortedPosition = [];
        }
    }

    _run() {
        if (!this._runScheduledMs) return;
        for (const node of this._nodes) {
            node.refreshWidgets();
        }
        this._clearRun();
        this._scheduleRun();
    }

    _scheduleRun(ms = 500) {
        if (this._runScheduledMs && ms < this._runScheduledMs) this._clearRun();
        if (!this._runScheduledMs && this._nodes.length) {
            this._runScheduledMs = ms;
            this._runTimeout = setTimeout(() => {
                this._runAnim = requestAnimationFrame(() => this._run());
            }, ms);
        }
    }

    _clearRun() {
        this._runTimeout && clearTimeout(this._runTimeout);
        this._runAnim && cancelAnimationFrame(this._runAnim);
        this._runTimeout = null;
        this._runAnim = null;
        this._runScheduledMs = null;
    }

    _getGroupsUnsorted(now) {
        const canvas = app.canvas;
        const graph = canvas.getCurrentGraph?.() ?? app.graph;
        if (!canvas.selected_group_moving &&
            (!this._groupsUnsorted.length || now - this._msLastUnsorted > this._msThreshold)) {
            this._groupsUnsorted = [...(graph._groups || [])];
            for (const group of this._groupsUnsorted) {
                group.recomputeInsideNodes();
                group._pm_hasAnyActive = getGroupNodes(group).some((n) => n.mode === LiteGraph.ALWAYS);
            }
            this._msLastUnsorted = now;
        }
        return this._groupsUnsorted;
    }

    _getGroupsAlpha(now) {
        if (!this._groupsSortedAlpha.length || now - this._msLastAlpha > this._msThreshold) {
            this._groupsSortedAlpha = [...this._getGroupsUnsorted(now)].sort((a, b) =>
                a.title.localeCompare(b.title)
            );
            this._msLastAlpha = now;
        }
        return this._groupsSortedAlpha;
    }

    _getGroupsPosition(now) {
        if (!this._groupsSortedPosition.length || now - this._msLastPosition > this._msThreshold) {
            this._groupsSortedPosition = [...this._getGroupsUnsorted(now)].sort((a, b) => {
                const aY = Math.floor(a._pos[1] / 30);
                const bY = Math.floor(b._pos[1] / 30);
                if (aY === bY) {
                    return Math.floor(a._pos[0] / 30) - Math.floor(b._pos[0] / 30);
                }
                return aY - bY;
            });
            this._msLastPosition = now;
        }
        return this._groupsSortedPosition;
    }

    getGroups(sort) {
        const now = +new Date();
        if (sort === "alphanumeric") return this._getGroupsAlpha(now);
        if (sort === "position") return this._getGroupsPosition(now);
        return this._getGroupsUnsorted(now);
    }
}

export const groupsService = new PMGroupsService();

// ─── Factory: create a Fast Groups mode-changer node class ───

export function createFastGroupsNodeClass({ nodeType, modeOn, modeOff, offMenuLabel }) {
    const CATEGORY = "PM Nodes/Switch Management";

    class PMFastGroupsNode extends LGraphNode {
        static title = nodeType;
        static type = nodeType;
        static category = CATEGORY;
        static _category = CATEGORY;
        static collapsible = false;

        constructor(title = nodeType) {
            super(title);
            this.isVirtualNode = true;
            this.serialize_widgets = false;
            this.modeOn = modeOn;
            this.modeOff = modeOff;
            this._debouncerTempWidth = 0;
            this._tempSize = null;
            this.properties = this.properties || {};
            this.widgets = this.widgets || [];
            this.properties[PROP_MATCH_COLORS] = "";
            this.properties[PROP_MATCH_TITLE] = "";
            this.properties[PROP_SHOW_NAV] = true;
            this.properties[PROP_SORT] = "alphanumeric";
            this.properties[PROP_RESTRICTION] = "default";

        }

        onAdded(_graph) {
            groupsService.addNode(this);
        }

        onRemoved() {
            groupsService.removeNode(this);
        }

        _getInputBoolValue(inputIndex) {
            const input = this.inputs?.[inputIndex];
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

        refreshWidgets() {
            const sort = this.properties?.[PROP_SORT] || "position";
            const groups = [...groupsService.getGroups(sort)];

            let filterColors = (this.properties?.[PROP_MATCH_COLORS]?.split(",") || [])
                .filter((c) => c.trim());
            if (filterColors.length) {
                filterColors = filterColors.map((color) => {
                    color = color.trim().toLocaleLowerCase();
                    if (LGraphCanvas.node_colors[color]) {
                        color = LGraphCanvas.node_colors[color].groupcolor;
                    }
                    color = color.replace("#", "").toLocaleLowerCase();
                    if (color.length === 3) {
                        color = color.replace(/(.)(.)(.)/, "$1$1$2$2$3$3");
                    }
                    return `#${color}`;
                });
            }

            const matchedGroups = [];
            for (const group of groups) {
                if (filterColors.length) {
                    let gc = group.color?.replace("#", "").trim().toLocaleLowerCase();
                    if (!gc) continue;
                    if (gc.length === 3) gc = gc.replace(/(.)(.)(.)/, "$1$1$2$2$3$3");
                    gc = `#${gc}`;
                    if (!filterColors.includes(gc)) continue;
                }

                if (this.properties?.[PROP_MATCH_TITLE]?.trim()) {
                    try {
                        if (!new RegExp(this.properties[PROP_MATCH_TITLE], "i").exec(group.title)) continue;
                    } catch (e) {
                        console.error(e);
                        continue;
                    }
                }

                matchedGroups.push(group);
            }

            this._syncInputs(matchedGroups);

            let index = 0;
            for (const group of matchedGroups) {
                let isDirty = false;
                const widgetLabel = `${t('enable', 'Enable')} ${group.title}`;
                let widget = this.widgets.find((w) => w.label === widgetLabel);

                if (!widget) {
                    this._tempSize = [...this.size];
                    widget = this.addCustomWidget(new PMGroupToggleWidget(group, this));
                    this.setSize(this.computeSize());
                    isDirty = true;
                }
                if (widget.label !== widgetLabel) {
                    widget.label = widgetLabel;
                    isDirty = true;
                }
                if (group._pm_hasAnyActive != null && widget.toggled !== group._pm_hasAnyActive) {
                    widget.toggled = group._pm_hasAnyActive;
                    isDirty = true;
                }
                if (this.widgets[index] !== widget) {
                    const oldIndex = this.widgets.findIndex((w) => w === widget);
                    this.widgets.splice(index, 0, this.widgets.splice(oldIndex, 1)[0]);
                    isDirty = true;
                }

                const boolValue = this._getInputBoolValue(index);
                if (boolValue != null) {
                    widget.controlled = true;
                    if (widget.toggled !== boolValue) {
                        widget.doModeChange(boolValue, true);
                        isDirty = true;
                    }
                } else {
                    widget.controlled = false;
                }

                if (isDirty) this.setDirtyCanvas(true, false);
                index++;
            }

            while ((this.widgets || [])[index]) {
                this._removeWidget(index++);
            }
        }

        _syncInputs(matchedGroups) {
            let changed = false;

            for (let i = 0; i < matchedGroups.length; i++) {
                const groupTitle = matchedGroups[i].title;
                const inputName = groupTitle;

                if (this.inputs[i]) {
                    if (this.inputs[i].name !== inputName) {
                        this.inputs[i].name = inputName;
                        changed = true;
                    }
                } else {
                    this.addInput(inputName, "BOOLEAN");
                    changed = true;
                }
            }

            while (this.inputs.length > matchedGroups.length) {
                const lastIdx = this.inputs.length - 1;
                if (this.inputs[lastIdx].link) {
                    this.disconnectInput(lastIdx);
                }
                this.removeInput(lastIdx);
                changed = true;
            }

            if (changed) {
                this._tempSize = this._tempSize || [...this.size];
                this.setDirtyCanvas(true, true);
            }
        }

        _removeWidget(widgetOrIndex) {
            const widget = typeof widgetOrIndex === "number" ? this.widgets[widgetOrIndex] : widgetOrIndex;
            if (!widget) return;
            const idx = this.widgets.indexOf(widget);
            if (idx > -1) this.widgets.splice(idx, 1);
            widget.onRemove?.();
        }

        computeSize(out) {
            let size = super.computeSize(out);
            if (this._tempSize) {
                size[0] = Math.max(this._tempSize[0], size[0]);
                size[1] = Math.max(this._tempSize[1], size[1]);
                this._debouncerTempWidth && clearTimeout(this._debouncerTempWidth);
                this._debouncerTempWidth = setTimeout(() => {
                    this._tempSize = null;
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
                content: t(`${offMenuLabel.toLowerCase()}All`, `${offMenuLabel} All`),
                callback: () => {
                    const alwaysOne = this.properties[PROP_RESTRICTION] === "always one";
                    for (const [i, widget] of this.widgets.entries()) {
                        if (widget.controlled) continue;
                        widget.doModeChange?.(alwaysOne && !i ? true : false, true);
                    }
                },
            });
            options.push({
                content: t('enableAll', 'Enable All'),
                callback: () => {
                    const onlyOne = this.properties[PROP_RESTRICTION]?.includes(" one");
                    for (const [i, widget] of this.widgets.entries()) {
                        if (widget.controlled) continue;
                        widget.doModeChange?.(onlyOne && i > 0 ? false : true, true);
                    }
                },
            });
            options.push({
                content: t('toggleAll', 'Toggle All'),
                callback: () => {
                    const onlyOne = this.properties[PROP_RESTRICTION]?.includes(" one");
                    let foundOne = false;
                    for (const widget of this.widgets) {
                        if (widget.controlled) continue;
                        let newValue = onlyOne && foundOne ? false : !widget.value?.toggled;
                        foundOne = foundOne || newValue;
                        widget.doModeChange?.(newValue, true);
                    }
                    if (!foundOne && this.properties[PROP_RESTRICTION] === "always one") {
                        const lastUncontrolled = [...this.widgets].reverse().find(w => !w.controlled);
                        lastUncontrolled?.doModeChange?.(true, true);
                    }
                },
            });
            return [];
        }
    }

    PMFastGroupsNode["@" + PROP_MATCH_COLORS] = { type: "string" };
    PMFastGroupsNode["@" + PROP_MATCH_TITLE] = { type: "string" };
    PMFastGroupsNode["@" + PROP_SHOW_NAV] = { type: "boolean" };
    PMFastGroupsNode["@" + PROP_SORT] = {
        type: "combo",
        values: ["position", "alphanumeric", "creation"],
    };
    PMFastGroupsNode["@" + PROP_RESTRICTION] = {
        type: "combo",
        values: ["default", "max one", "always one"],
    };

    return PMFastGroupsNode;
}
