from comfy_api.latest import IO

# 哨兵值，用于区分"未连接"和"连接但值为 None"
MISSING = object()


class IfBranchNode(IO.ComfyNode):
    @classmethod
    def define_schema(cls):
        return IO.Schema(
            node_id="IfBranchNode",
            display_name="IF Branch",
            category="PM Nodes",
            inputs=[
                IO.Boolean.Input("condition", default=True),
                IO.AnyType.Input("true_value", lazy=True, optional=True),
                IO.AnyType.Input("false_value", lazy=True, optional=True),
            ],
            outputs=[IO.AnyType.Output("result"),],
        )

    @classmethod
    def check_lazy_status(cls, condition, false_value=MISSING, true_value=MISSING):
        # 根据条件决定需要加载哪个分支
        # 如果对应分支未连接，返回空列表（让 execute 处理报错）
        if condition:
            # 条件为 True，需要 true_value
            if true_value is MISSING:
                # true_value 未连接，不需要请求任何输入，让 validate_inputs 报错
                return []
            if true_value is None:
                return ["true_value"]
        else:
            # 条件为 False，需要 false_value
            if false_value is MISSING:
                # false_value 未连接，不需要请求任何输入，让 validate_inputs 报错
                return []
            if false_value is None:
                return ["false_value"]
        return []

    @classmethod
    def validate_inputs(cls, condition, false_value=MISSING, true_value=MISSING):
        # 根据条件检查对应的输入是否连接
        if condition:
            if true_value is MISSING:
                return "condition 为 True 时，必须连接 true_value"
        else:
            if false_value is MISSING:
                return "condition 为 False 时，必须连接 false_value"
        return True

    @classmethod
    def execute(cls, condition, false_value=MISSING, true_value=MISSING) -> IO.NodeOutput:
        # 根据条件返回对应值
        if condition:
            if true_value is MISSING:
                # 这种情况不应该发生，validate_inputs 应该已经拦截了
                raise ValueError("condition 为 True 时，true_value 未连接")
            return IO.NodeOutput(true_value)
        else:
            if false_value is MISSING:
                # 这种情况不应该发生，validate_inputs 应该已经拦截了
                raise ValueError("condition 为 False 时，false_value 未连接")
            return IO.NodeOutput(false_value)
