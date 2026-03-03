import ast
import operator as op
import math
from comfy_api.latest import IO

# 哨兵值，用于区分"未连接"和"连接但值为 None"
MISSING = object()


class SimpleMathNode(IO.ComfyNode):
    """SimpleMath节点 - 使用V3api语法复刻ComfyUI_essentials的SimpleMath节点"""

    @classmethod
    def define_schema(cls) -> IO.Schema:
        return IO.Schema(
            node_id="SimpleMath",
            display_name="Simple Math",
            category="PM Nodes",
            inputs=[
                IO.String.Input("value", default="a + b", multiline=False),
                IO.AnyType.Input("a", optional=True),
                IO.AnyType.Input("b", optional=True),
                IO.AnyType.Input("c", optional=True),
                IO.AnyType.Input("d", optional=True),
            ],
            outputs=[
                IO.Int.Output("int_result"),
                IO.Float.Output("float_result"),
            ],
        )

    @classmethod
    def execute(cls, value: str, a=MISSING, b=MISSING, c=MISSING, d=MISSING) -> IO.NodeOutput:
        # 设置默认值
        a = 0.0 if a is MISSING else a
        b = 0.0 if b is MISSING else b
        c = 0.0 if c is MISSING else c
        d = 0.0 if d is MISSING else d

        # 处理输入值，如果是tensor则获取shape
        if hasattr(a, 'shape'):
            a = list(a.shape)
        if hasattr(b, 'shape'):
            b = list(b.shape)
        if hasattr(c, 'shape'):
            c = list(c.shape)
        if hasattr(d, 'shape'):
            d = list(d.shape)

        # 字符串转数字
        if isinstance(a, str):
            a = float(a)
        if isinstance(b, str):
            b = float(b)
        if isinstance(c, str):
            c = float(c)
        if isinstance(d, str):
            d = float(d)

        # 定义运算符
        operators = {
            ast.Add: op.add,
            ast.Sub: op.sub,
            ast.Mult: op.mul,
            ast.Div: op.truediv,
            ast.FloorDiv: op.floordiv,
            ast.Pow: op.pow,
            ast.USub: op.neg,
            ast.Mod: op.mod,
            ast.Eq: op.eq,
            ast.NotEq: op.ne,
            ast.Lt: op.lt,
            ast.LtE: op.le,
            ast.Gt: op.gt,
            ast.GtE: op.ge,
            ast.And: lambda x, y: x and y,
            ast.Or: lambda x, y: x or y,
            ast.Not: op.not_
        }

        # 定义函数
        op_functions = {
            'min': min,
            'max': max,
            'round': round,
            'sum': sum,
            'len': len,
        }

        def eval_(node):
            if isinstance(node, ast.Num):  # Python 3.7
                return node.n
            elif isinstance(node, ast.Constant):  # Python 3.8+
                return node.value
            elif isinstance(node, ast.Name):  # 变量
                if node.id == "a":
                    return a
                if node.id == "b":
                    return b
                if node.id == "c":
                    return c
                if node.id == "d":
                    return d
            elif isinstance(node, ast.BinOp):  # 二元运算
                return operators[type(node.op)](eval_(node.left), eval_(node.right))
            elif isinstance(node, ast.UnaryOp):  # 一元运算
                return operators[type(node.op)](eval_(node.operand))
            elif isinstance(node, ast.Compare):  # 比较运算
                left = eval_(node.left)
                for operator_type, comparator in zip(node.ops, node.comparators):
                    if not operators[type(operator_type)](left, eval_(comparator)):
                        return 0
                return 1
            elif isinstance(node, ast.BoolOp):  # 布尔运算
                values = [eval_(v) for v in node.values]
                return operators[type(node.op)](*values)
            elif isinstance(node, ast.Call):  # 函数调用
                if node.func.id in op_functions:
                    args = [eval_(arg) for arg in node.args]
                    return op_functions[node.func.id](*args)
            elif isinstance(node, ast.Subscript):  # 索引
                value = eval_(node.value)
                if isinstance(node.slice, ast.Constant):
                    return value[node.slice.value]
                elif isinstance(node.slice, ast.Index):  # Python 3.8
                    return value[eval_(node.slice.value)]
                else:
                    return 0
            else:
                return 0

        try:
            result = eval_(ast.parse(value, mode='eval').body)
        except Exception:
            result = 0.0

        if math.isnan(result):
            result = 0.0

        return IO.NodeOutput(round(result), float(result))
