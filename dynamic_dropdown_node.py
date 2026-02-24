
import re


class DynamicDropdownNode:
    """
    动态下拉框节点
    根据输入的选项数组动态生成下拉框，输出选择的索引
    支持多种分隔符：换行、中英文逗号、空格、分号
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        default_options = ["选项1", "选项2", "选项3"]
        return {
            "required": {
                "options": ("STRING", {
                    "multiline": False,
                    "default": "选项1,选项2,选项3",
                    "placeholder": "输入选项，支持逗号、空格、分号分隔"
                }),
                "selection": ("COMBO", {
                    "options": default_options
                }),
            }
        }

    RETURN_TYPES = ("INT", "STRING")
    RETURN_NAMES = ("index", "selected_value")
    FUNCTION = "process_selection"
    CATEGORY = "PM Nodes"

    @staticmethod
    def parse_options(options_text):
        """解析选项文本，支持多种分隔符"""
        if not options_text:
            return []

        # 统一替换所有分隔符为换行符
        # 支持：换行(\n)、英文逗号(,)、中文逗号(，)、分号(;、；)、空格( )
        normalized = options_text
        normalized = re.sub(r'[,，;；\s]+', '\n', normalized)

        # 按换行分割并过滤空值
        option_list = [opt.strip() for opt in normalized.split('\n') if opt.strip()]

        # 去重（保持顺序）
        seen = set()
        unique_list = []
        for opt in option_list:
            if opt not in seen:
                seen.add(opt)
                unique_list.append(opt)

        return unique_list

    def process_selection(self, options, selection):
        option_list = self.parse_options(options)

        try:
            index = option_list.index(selection)
        except ValueError:
            index = 0

        return (index, selection)

    @classmethod
    def VALIDATE_INPUTS(cls, options, selection):
        option_list = cls.parse_options(options)

        if not option_list:
            return "至少需要提供一个选项"

        if selection not in option_list:
            return f"选择的值 '{selection}' 不在选项列表中"

        return True


NODE_CLASS_MAPPINGS = {
    "DynamicDropdown": DynamicDropdownNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DynamicDropdown": "动态下拉框",
}
