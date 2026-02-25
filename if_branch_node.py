"""
IF分支节点模块

此模块实现了一个IF条件分支节点，根据布尔条件选择执行不同的分支。
支持惰性求值（Lazy Evaluation），只执行被选中的分支，提高效率。

主要功能：
    - 根据布尔条件选择输出
    - 支持惰性求值，只执行需要的分支
    - 支持任意类型的输入和输出（通配符 *）
    - 实现真正的条件执行逻辑

惰性求值说明：
    惰性求值是一种计算策略，只在需要时才计算表达式的值。
    在IF分支节点中，这意味着只有被选中的分支会被执行，
    未被选中的分支不会消耗计算资源。

使用场景：
    - 根据条件选择不同的模型或参数
    - 实现工作流的分支逻辑
    - 条件性地启用或禁用某些处理步骤
    - 根据用户输入动态选择执行路径

技术实现：
    - 使用 check_lazy_status 方法声明依赖关系
    - ComfyUI 引擎根据返回的依赖列表决定执行顺序
    - 未被依赖的输入不会被计算
"""


class IfBranchNode:
    """
    IF分支节点类
    
    根据布尔条件选择输出两个值中的一个。
    支持任意类型的输入和输出（使用通配符 *）。
    实现真正的条件执行：只执行选中的分支。
    
    属性:
        CATEGORY (str): 节点分类，用于在 ComfyUI 界面中组织节点
        FUNCTION (str): 节点主处理函数名称
        RETURN_TYPES (tuple): 返回值类型元组，使用通配符 * 表示任意类型
        RETURN_NAMES (tuple): 返回值名称元组
        
    惰性求值机制:
        通过 check_lazy_status 方法告诉 ComfyUI 引擎
        只需要计算条件为真的那个分支的输入
    """

    def __init__(self):
        """
        初始化IF分支节点
        
        当前实现为空，因为节点状态不需要在实例之间保持。
        所有状态都通过输入参数传递。
        """
        pass

    @classmethod
    def INPUT_TYPES(cls):
        """
        定义节点的输入类型和参数
        
        返回:
            dict: 输入配置字典，包含必需和可选参数的定义
            
        输入参数:
            required:
                condition: 布尔条件，决定选择哪个分支
            optional:
                true_value: 条件为真时的输出值（惰性求值）
                false_value: 条件为假时的输出值（惰性求值）
                
        惰性求值配置:
            lazy: True - 启用惰性求值
            forceInput: True - 强制作为输入端口
        """
        return {
            "required": {
                # 布尔条件输入
                # 决定选择 true_value 还是 false_value
                "condition": ("BOOLEAN", {
                    "default": True,  # 默认值为真
                }),
            },
            "optional": {
                # 条件为真时的输出值
                # 使用通配符 * 表示接受任意类型
                # lazy=True 启用惰性求值
                # forceInput=True 强制显示为输入端口
                "true_value": ("*", {
                    "forceInput": True,
                    "lazy": True,
                }),
                # 条件为假时的输出值
                # 同样使用通配符和惰性求值
                "false_value": ("*", {
                    "forceInput": True,
                    "lazy": True,
                }),
            }
        }

    # 返回值类型定义
    # 使用通配符 * 表示可以返回任意类型
    # 类型与选中的输入值相同
    RETURN_TYPES = ("*",)
    
    # 返回值名称定义
    # 用于在 ComfyUI 界面中标识输出端口
    RETURN_NAMES = ("result",)
    
    # 节点主处理函数名称
    FUNCTION = "select_branch"
    
    # 节点分类，用于在 ComfyUI 界面中组织节点
    CATEGORY = "PM Nodes"

    def check_lazy_status(self, condition, true_value=None, false_value=None):
        """
        惰性求值检查：根据条件决定只需要哪个分支的输入
        
        此方法在 ComfyUI 执行节点前被调用，用于声明节点的输入依赖关系。
        返回的列表告诉引擎哪些输入是必需的，哪些可以跳过。
        
        参数:
            condition (bool): 布尔条件值
            true_value: 条件为真时的值（可能尚未计算）
            false_value: 条件为假时的值（可能尚未计算）
            
        返回:
            list: 必需的输入参数名称列表
                - 如果 condition 为 True，返回 ["true_value"]
                - 如果 condition 为 False，返回 ["false_value"]
                - 如果所需值已提供，返回空列表
                
        惰性求值原理：
            1. ComfyUI 引擎首先调用此方法检查依赖关系
            2. 根据返回的列表，引擎只计算必需的输入
            3. 未被列出的输入不会被计算，节省资源
            4. 然后调用 select_branch 方法进行实际处理
            
        示例：
            如果 condition=True 且 true_value=None：
                返回 ["true_value"] - 引擎会计算 true_value
                false_value 不会被计算
                
            如果 condition=False 且 false_value=None：
                返回 ["false_value"] - 引擎会计算 false_value
                true_value 不会被计算
        """
        required = []
        
        # 如果条件为真，需要 true_value
        if condition:
            if true_value is None:
                required.append("true_value")
        # 如果条件为假，需要 false_value
        else:
            if false_value is None:
                required.append("false_value")
        
        return required

    def select_branch(self, condition, true_value=None, false_value=None):
        """
        根据条件选择返回值
        
        这是节点的主处理函数，在输入值都准备好后被调用。
        根据 condition 的值返回 true_value 或 false_value。
        
        参数:
            condition (bool): 布尔条件值
            true_value: 条件为真时的返回值（任意类型）
            false_value: 条件为假时的返回值（任意类型）
            
        返回:
            tuple: (result,)
                - result: 根据条件选择的值，类型与输入相同
                
        处理逻辑：
            - condition 为 True 时返回 true_value
            - condition 为 False 时返回 false_value
            
        注意：
            由于惰性求值机制，未被选中的值不会被计算，
            因此不会消耗不必要的计算资源。
        """
        # 根据条件选择返回值
        if condition:
            # 条件为真，返回 true_value
            return (true_value,)
        else:
            # 条件为假，返回 false_value
            return (false_value,)


# 节点类映射字典
# 键：节点唯一标识符，用于在 ComfyUI 中注册节点
# 值：节点类对象
NODE_CLASS_MAPPINGS = {
    "IfBranch": IfBranchNode,
}

# 节点显示名称映射字典
# 键：节点唯一标识符
# 值：在 ComfyUI 界面中显示的友好名称（中文）
NODE_DISPLAY_NAME_MAPPINGS = {
    "IfBranch": "IF分支",
}
