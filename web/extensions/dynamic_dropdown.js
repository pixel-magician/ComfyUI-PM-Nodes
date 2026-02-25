/**
 * 动态下拉框前端扩展模块
 *
 * 此模块为 ComfyUI 的动态下拉框节点提供前端交互支持。
 * 实现实时监听选项文本输入，动态更新下拉框选项列表。
 *
 * 主要功能：
 *     - 监听选项文本输入框的变化
 *     - 实时解析选项文本并更新下拉框
 *     - 支持多种分隔符解析
 *     - 保持选中状态或自动选择第一个选项
 *
 * 分隔符支持：
 *     - 换行符 (\n)
 *     - 英文逗号 (,)
 *     - 中文逗号 (，)
 *     - 英文分号 (;)
 *     - 中文分号 (；)
 *     - 空格
 *
 * 技术实现：
 *     - 使用 ComfyUI 扩展 API 注册节点创建回调
 *     - 通过 setInterval 轮询检测文本变化
 *     - 监听 input 事件实现实时响应
 *     - 使用正则表达式统一处理分隔符
 *
 * @module DynamicDropdown
 * @requires /scripts/app.js
 */

// 导入 ComfyUI 应用实例
import { app } from "/scripts/app.js";

/**
 * 注册 ComfyUI 扩展
 *
 * 使用 app.registerExtension 方法注册扩展，提供以下功能：
 *     - name: 扩展的唯一标识名称
 *     - nodeCreated: 节点创建时的回调函数
 */
app.registerExtension({
    /**
     * 扩展名称
     * 用于在 ComfyUI 中标识此扩展
     */
    name: "ComfyUI.DynamicDropdown",

    /**
     * 节点创建回调函数
     *
     * 当 ComfyUI 创建新节点时调用此函数。
     * 检查节点类型是否为 DynamicDropdown，如果是则设置动态下拉框功能。
     *
     * @param {Object} node - 创建的节点对象
     * @param {string} node.comfyClass - 节点的类标识符
     */
    nodeCreated(node) {
        // 检查是否为动态下拉框节点
        if (node.comfyClass === "DynamicDropdown") {
            // 设置动态下拉框功能
            this.setupDynamicDropdown(node);
        }
    },

    /**
     * 设置动态下拉框功能
     *
     * 为指定的节点设置选项文本监听和下拉框更新功能。
     * 此方法实现核心交互逻辑。
     *
     * @param {Object} node - 动态下拉框节点对象
     * @param {Array} node.widgets - 节点的控件数组
     * @param {Function} node.setDirtyCanvas - 标记画布需要重绘的函数
     */
    setupDynamicDropdown(node) {
        // 查找选项文本输入控件
        // options 控件用于输入选项文本
        const optionsWidget = node.widgets.find(w => w.name === "options");
        // selection 控件是下拉框选择控件
        const selectionWidget = node.widgets.find(w => w.name === "selection");

        // 如果找不到控件，直接返回
        if (!optionsWidget || !selectionWidget) return;

        /**
         * 解析选项文本函数
         *
         * 将输入的选项文本解析为选项数组。
         * 支持多种分隔符，自动去重并保持顺序。
         *
         * @param {string} text - 选项文本
         * @returns {Array} 解析后的选项数组
         */
        const parseOptions = (text) => {
            // 检查空输入
            if (!text) return [];

            // 使用正则表达式统一替换所有分隔符为换行符
            // 匹配：英文逗号、中文逗号、英文分号、中文分号、空白字符
            const normalized = text.replace(/[,，;；\s]+/g, '\n');

            // 按换行分割并处理每个选项
            const optionList = normalized.split('\n')
                .map(opt => opt.trim())           // 去除前后空白
                .filter(opt => opt.length > 0);   // 过滤空字符串

            // 去重（保持顺序）
            // 使用 Set 记录已见过的选项
            const seen = new Set();
            return optionList.filter(opt => {
                if (seen.has(opt)) return false;  // 已存在，跳过
                seen.add(opt);                    // 添加到记录
                return true;                      // 保留
            });
        };

        /**
         * 更新下拉框选项函数
         *
         * 根据当前选项文本解析结果更新下拉框的选项列表。
         * 如果当前选中的值不在新列表中，自动选择第一个选项。
         */
        const updateDropdownOptions = () => {
            // 解析当前选项文本
            const optionList = parseOptions(optionsWidget.value);

            // 如果有有效选项
            if (optionList.length > 0) {
                // 更新下拉框的选项值
                selectionWidget.options.values = optionList;

                // 如果当前选中的值不在新列表中
                if (!optionList.includes(selectionWidget.value)) {
                    // 自动选择第一个选项
                    selectionWidget.value = optionList[0];
                }
            } else {
                // 没有有效选项时，显示"无选项"
                selectionWidget.options.values = ["无选项"];
                selectionWidget.value = "无选项";
            }

            // 标记画布需要重绘
            // 第一个参数 true 表示需要重绘节点
            // 第二个参数 true 表示需要重绘背景
            node.setDirtyCanvas(true, true);
        };

        // 初始化下拉框选项
        updateDropdownOptions();

        /**
         * 轮询检测选项文本变化
         *
         * 使用 setInterval 每 300 毫秒检查一次选项文本是否变化。
         * 这种轮询方式可以捕获所有方式引起的值变化。
         *
         * 注意：300ms 的间隔在响应性和性能之间取得平衡
         */
        let lastValue = optionsWidget.value;  // 记录上次的值
        setInterval(() => {
            // 检测值是否变化
            if (optionsWidget.value !== lastValue) {
                lastValue = optionsWidget.value;  // 更新记录
                updateDropdownOptions();          // 更新下拉框
            }
        }, 300);

        /**
         * 监听输入事件
         *
         * 为选项文本输入框添加 input 事件监听器，
         * 实现实时响应用户输入。
         *
         * 使用 setTimeout 延迟 500ms 执行，确保 DOM 元素已准备好。
         */
        setTimeout(() => {
            // 检查输入元素是否存在
            if (optionsWidget.inputEl) {
                // 添加 input 事件监听器
                optionsWidget.inputEl.addEventListener('input', (e) => {
                    // 更新控件值为输入值
                    optionsWidget.value = e.target.value;
                    // 立即更新下拉框
                    updateDropdownOptions();
                });
            }
        }, 500);
    }
});
