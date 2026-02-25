"""
动态下拉框节点模块

此模块实现了一个动态下拉框节点，允许用户通过文本输入定义选项列表，
并在下拉框中进行选择。支持多种分隔符，提供灵活的数据输入方式。

主要功能：
    - 解析多种分隔符分隔的选项文本
    - 动态生成下拉框选项列表
    - 返回选中项的索引和值

分隔符支持：
    - 换行符 (\\n)
    - 英文逗号 (,)
    - 中文逗号 (，)
    - 英文分号 (;)
    - 中文分号 (；)
    - 空格 ( )

使用示例：
    输入文本: "选项1,选项2;选项3 选项4"
    解析结果: ["选项1", "选项2", "选项3", "选项4"]
"""

import re  # 导入正则表达式模块，用于文本解析


class DynamicDropdownNode:
    """
    动态下拉框节点类
    
    根据输入的选项数组动态生成下拉框，输出选择的索引和值。
    支持多种分隔符：换行、中英文逗号、空格、分号。
    
    属性:
        CATEGORY (str): 节点分类，用于在 ComfyUI 界面中组织节点
        FUNCTION (str): 节点主处理函数名称
        RETURN_TYPES (tuple): 返回值类型元组
        RETURN_NAMES (tuple): 返回值名称元组
    """

    def __init__(self):
        """
        初始化动态下拉框节点
        
        当前实现为空，因为节点状态不需要在实例之间保持
        """
        pass

    @classmethod
    def INPUT_TYPES(cls):
        """
        定义节点的输入类型和参数
        
        返回:
            dict: 输入配置字典，包含必需参数的定义
            
        输入参数:
            options: 字符串输入，用于定义选项列表
            selection: 下拉框选择，动态更新的选项列表
        """
        # 默认选项列表，用于初始化下拉框
        default_options = ["选项1", "选项2", "选项3"]
        
        return {
            "required": {
                # 选项文本输入框
                "options": ("STRING", {
                    "multiline": False,  # 单行输入
                    "default": "选项1,选项2,选项3",  # 默认选项文本
                    "placeholder": "输入选项，支持逗号、空格、分号分隔"  # 输入提示文本
                }),
                # 下拉框选择控件
                "selection": ("COMBO", {
                    "options": default_options  # 初始选项列表
                }),
            }
        }

    # 返回值类型定义
    # INT: 选中项的索引
    # STRING: 选中项的值
    RETURN_TYPES = ("INT", "STRING")
    
    # 返回值名称定义
    # 用于在 ComfyUI 界面中标识输出端口
    RETURN_NAMES = ("index", "selected_value")
    
    # 节点主处理函数名称
    FUNCTION = "process_selection"
    
    # 节点分类，用于在 ComfyUI 界面中组织节点
    CATEGORY = "PM Nodes"

    @staticmethod
    def parse_options(options_text):
        """
        解析选项文本，支持多种分隔符
        
        此方法使用正则表达式统一处理各种分隔符，将输入文本
        转换为标准化的选项列表。支持去重功能，保持选项顺序。
        
        参数:
            options_text (str): 包含选项的原始文本
            
        返回:
            list: 解析后的唯一选项列表
            
        处理流程:
            1. 检查空输入
            2. 统一替换所有分隔符为换行符
            3. 按换行分割并去除空白
            4. 过滤空值
            5. 去重（保持原始顺序）
        """
        # 检查空输入
        if not options_text:
            return []

        # 统一替换所有分隔符为换行符
        # 正则表达式 [,，;；\s]+ 匹配以下分隔符：
        # - 英文逗号 (,)
        # - 中文逗号 (，)
        # - 英文分号 (;)
        # - 中文分号 (；)
        # - 任意空白字符 (\s 包括空格、制表符等)
        normalized = options_text
        normalized = re.sub(r'[,，;；\s]+', '\n', normalized)

        # 按换行分割并过滤空值
        # strip() 去除每个选项前后的空白字符
        option_list = [opt.strip() for opt in normalized.split('\n') if opt.strip()]

        # 去重（保持顺序）
        # 使用集合记录已见过的选项
        seen = set()
        unique_list = []
        for opt in option_list:
            if opt not in seen:
                seen.add(opt)
                unique_list.append(opt)

        return unique_list

    def process_selection(self, options, selection):
        """
        处理用户的选择
        
        解析选项文本，查找选中项在列表中的索引，
        返回索引和选中值。如果选中项不在列表中，默认返回索引0。
        
        参数:
            options (str): 选项文本，包含所有可选项
            selection (str): 用户当前选中的值
            
        返回:
            tuple: (index, selected_value)
                - index (int): 选中项的索引，未找到时默认为0
                - selected_value (str): 选中项的值
        """
        # 解析选项文本为列表
        option_list = self.parse_options(options)

        try:
            # 查找选中项在列表中的索引
            index = option_list.index(selection)
        except ValueError:
            # 如果选中项不在列表中（可能由于选项更新），默认使用索引0
            index = 0

        # 返回索引和选中值
        return (index, selection)

    @classmethod
    def VALIDATE_INPUTS(cls, options, selection):
        """
        验证输入参数的有效性
        
        在 ComfyUI 执行节点前调用，用于验证输入数据是否合法。
        如果验证失败，会显示错误信息并阻止节点执行。
        
        参数:
            options (str): 选项文本
            selection (str): 选中的值
            
        返回:
            bool 或 str: 
                - True: 验证通过
                - str: 验证失败时的错误信息
                
        验证规则:
            1. 至少提供一个有效选项
            2. 选中的值必须在选项列表中
        """
        # 解析选项文本
        option_list = cls.parse_options(options)

        # 验证至少有一个选项
        if not option_list:
            return "至少需要提供一个选项"

        # 验证选中值在选项列表中
        if selection not in option_list:
            return f"选择的值 '{selection}' 不在选项列表中"

        # 验证通过
        return True


# 节点类映射字典
# 键：节点唯一标识符，用于在 ComfyUI 中注册节点
# 值：节点类对象
NODE_CLASS_MAPPINGS = {
    "DynamicDropdown": DynamicDropdownNode,
}

# 节点显示名称映射字典
# 键：节点唯一标识符
# 值：在 ComfyUI 界面中显示的友好名称（中文）
NODE_DISPLAY_NAME_MAPPINGS = {
    "DynamicDropdown": "动态下拉框",
}
