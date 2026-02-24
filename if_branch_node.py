class IfBranchNode:
    """
    IF分支节点
    根据布尔条件选择输出两个值中的一个
    支持任意类型的输入和输出
    实现真正的条件执行：只执行选中的分支
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "condition": ("BOOLEAN", {
                    "default": True,
                }),
            },
            "optional": {
                "true_value": ("*", {
                    "forceInput": True,
                    "lazy": True,
                }),
                "false_value": ("*", {
                    "forceInput": True,
                    "lazy": True,
                }),
            }
        }

    RETURN_TYPES = ("*",)
    RETURN_NAMES = ("result",)
    FUNCTION = "select_branch"
    CATEGORY = "PM Nodes"

    def check_lazy_status(self, condition, true_value=None, false_value=None):
        """
        惰性求值检查：根据条件决定只需要哪个分支的输入
        """
        required = []
        
        if condition:
            if true_value is None:
                required.append("true_value")
        else:
            if false_value is None:
                required.append("false_value")
        
        return required

    def select_branch(self, condition, true_value=None, false_value=None):
        """
        根据条件选择返回值
        condition为True时返回true_value，否则返回false_value
        """
        if condition:
            return (true_value,)
        else:
            return (false_value,)


NODE_CLASS_MAPPINGS = {
    "IfBranch": IfBranchNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "IfBranch": "IF分支",
}
