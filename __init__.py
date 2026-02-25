"""
ComfyUI-PM-Nodes 插件主入口模块

此模块是 ComfyUI-PM-Nodes 插件的主入口点，负责整合所有节点类
并提供统一的导出接口供 ComfyUI 加载和使用。

主要功能：
    - 导入并合并动态下拉框节点和IF分支节点的类映射
    - 定义 Web 目录路径，用于加载前端扩展
    - 导出节点类和显示名称映射供 ComfyUI 使用

节点类型：
    - DynamicDropdown: 动态下拉框节点，支持多种分隔符解析选项
    - IfBranch: IF分支节点，根据条件选择执行不同分支

作者: PM Nodes Team
版本: 1.0.0
"""

# 从动态下拉框节点模块导入节点类映射和显示名称映射
from .dynamic_dropdown_node import NODE_CLASS_MAPPINGS as DYNAMIC_DROPDOWN_NODE_CLASS_MAPPINGS
from .dynamic_dropdown_node import NODE_DISPLAY_NAME_MAPPINGS as DYNAMIC_DROPDOWN_NODE_DISPLAY_NAME_MAPPINGS

# 从IF分支节点模块导入节点类映射和显示名称映射
from .if_branch_node import NODE_CLASS_MAPPINGS as IF_BRANCH_NODE_CLASS_MAPPINGS
from .if_branch_node import NODE_DISPLAY_NAME_MAPPINGS as IF_BRANCH_NODE_DISPLAY_NAME_MAPPINGS

# Web 目录路径配置
# 指向包含前端 JavaScript 扩展的目录
# ComfyUI 会自动加载此目录下的扩展脚本
WEB_DIRECTORY = "./web"

# 合并所有节点的类映射字典
# 键：节点唯一标识符
# 值：节点类对象
NODE_CLASS_MAPPINGS = {
    **DYNAMIC_DROPDOWN_NODE_CLASS_MAPPINGS,  # 展开动态下拉框节点映射
    **IF_BRANCH_NODE_CLASS_MAPPINGS,         # 展开IF分支节点映射
}

# 合并所有节点的显示名称映射字典
# 键：节点唯一标识符
# 值：在 ComfyUI 界面中显示的友好名称
NODE_DISPLAY_NAME_MAPPINGS = {
    **DYNAMIC_DROPDOWN_NODE_DISPLAY_NAME_MAPPINGS,  # 展开动态下拉框显示名称
    **IF_BRANCH_NODE_DISPLAY_NAME_MAPPINGS,         # 展开IF分支显示名称
}

# 模块导出列表
# 定义当使用 'from module import *' 时导出的符号
__all__ = [
    'NODE_CLASS_MAPPINGS',      # 节点类映射
    'NODE_DISPLAY_NAME_MAPPINGS',  # 节点显示名称映射
    'WEB_DIRECTORY'             # Web 目录路径
]
