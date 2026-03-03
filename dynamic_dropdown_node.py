import re
from comfy_api.latest import IO


class DynamicDropdownNode(IO.ComfyNode):
    @classmethod
    def define_schema(cls) -> IO.Schema:
        return IO.Schema(
            node_id="DynamicDropdown",
            display_name="Dynamic Dropdown",
            category="PM Nodes",
            inputs=[
                IO.String.Input("options", default="Option1,Option2,Option3", multiline=False),
                IO.Combo.Input("selection", options=["Option1", "Option2", "Option3"]),
            ],
            outputs=[
                IO.Int.Output("index"),
                IO.String.Output("selected_value"),
            ],
            accept_all_inputs=True,
        )

    @staticmethod
    def parse_options(options_text):
        if not options_text:
            return []
        normalized = re.sub(r"[,，;；\s]+", "\n", options_text)
        option_list = [opt.strip() for opt in normalized.split("\n") if opt.strip()]
        seen = set()
        unique_list = []
        for opt in option_list:
            if opt not in seen:
                seen.add(opt)
                unique_list.append(opt)
        return unique_list

    @classmethod
    def execute(cls, options, selection) -> IO.NodeOutput:
        option_list = cls.parse_options(options)
        try:
            index = option_list.index(selection)
        except ValueError:
            index = 0
        return IO.NodeOutput(index, selection)

    @classmethod
    def validate_inputs(cls, **kwargs) -> bool:
        """跳过内置 Combo 校验，前端 JS 负责动态更新下拉选项的合法性。"""
        return True

