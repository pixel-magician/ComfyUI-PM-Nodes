
import { app } from "/scripts/app.js";

app.registerExtension({
    name: "ComfyUI.DynamicDropdown",

    nodeCreated(node) {
        if (node.comfyClass === "DynamicDropdown") {
            this.setupDynamicDropdown(node);
        }
    },

    setupDynamicDropdown(node) {
        const optionsWidget = node.widgets.find(w => w.name === "options");
        const selectionWidget = node.widgets.find(w => w.name === "selection");

        if (!optionsWidget || !selectionWidget) return;

        const parseOptions = (text) => {
            if (!text) return [];

            // 支持：换行、英文逗号、中文逗号、分号、空格
            const normalized = text.replace(/[,，;；\s]+/g, '\n');
            const optionList = normalized.split('\n')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);

            // 去重（保持顺序）
            const seen = new Set();
            return optionList.filter(opt => {
                if (seen.has(opt)) return false;
                seen.add(opt);
                return true;
            });
        };

        const updateDropdownOptions = () => {
            const optionList = parseOptions(optionsWidget.value);

            if (optionList.length > 0) {
                selectionWidget.options.values = optionList;

                if (!optionList.includes(selectionWidget.value)) {
                    selectionWidget.value = optionList[0];
                }
            } else {
                selectionWidget.options.values = ["无选项"];
                selectionWidget.value = "无选项";
            }

            node.setDirtyCanvas(true, true);
        };

        updateDropdownOptions();

        let lastValue = optionsWidget.value;
        setInterval(() => {
            if (optionsWidget.value !== lastValue) {
                lastValue = optionsWidget.value;
                updateDropdownOptions();
            }
        }, 300);

        setTimeout(() => {
            if (optionsWidget.inputEl) {
                optionsWidget.inputEl.addEventListener('input', (e) => {
                    optionsWidget.value = e.target.value;
                    updateDropdownOptions();
                });
            }
        }, 500);
    }
});
