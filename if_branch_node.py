from comfy_api.latest import  IO


class IfBranchNode(IO.ComfyNode):
    @classmethod
    def define_schema(cls):
        return IO.Schema(
            node_id="IfBranchNode",
            display_name="IF分支",
            category="PM Nodes",
            inputs=[
                IO.Boolean.Input("condition", default=True),
                IO.AnyType.Input("true_value", lazy=True, extra_dict={"forceInput": True}),
                IO.AnyType.Input("false_value", lazy=True, extra_dict={"forceInput": True}),
            ],
            outputs=[IO.AnyType.Output("result"),],
        )

    @classmethod
    def check_lazy_status(cls, condition, true_value=None, false_value=None):
        required = []
        if condition:
            if true_value is None:
                required.append("true_value")
        else:
            if false_value is None:
                required.append("false_value")
        return required

    @classmethod
    def execute(cls, condition, true_value=None, false_value=None) -> IO.NodeOutput:
        if condition:
            return IO.NodeOutput(true_value)
        else:
            return IO.NodeOutput(false_value)
