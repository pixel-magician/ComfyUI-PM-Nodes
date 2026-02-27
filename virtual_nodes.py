"""
虚拟节点的服务端元数据注册。

这些节点实际运行在前端（isVirtualNode=true），不参与服务端执行。
注册它们是为了让 ComfyUI 的 object_info 端点返回元数据，
从而支持节点徽章显示和中文搜索。
"""
from comfy_api.latest import IO


class PMFastMuter(IO.ComfyNode):
    @classmethod
    def define_schema(cls):
        return IO.Schema(
            node_id="PM Fast Muter",
            display_name="PM Fast Muter",
            category="PM Nodes/Switch Management",
            description="Quickly toggle enable/mute status of connected nodes",
            search_aliases=["快速禁用", "Fast Muter", "Muter"],
        )

    @classmethod
    def execute(cls, **kwargs) -> IO.NodeOutput:
        return IO.NodeOutput()


class PMFastBypasser(IO.ComfyNode):
    @classmethod
    def define_schema(cls):
        return IO.Schema(
            node_id="PM Fast Bypasser",
            display_name="PM Fast Bypasser",
            category="PM Nodes/Switch Management",
            description="Quickly toggle enable/bypass status of connected nodes",
            search_aliases=["快速忽略", "Fast Bypasser", "Bypasser"],
        )

    @classmethod
    def execute(cls, **kwargs) -> IO.NodeOutput:
        return IO.NodeOutput()


class PMFastGroupsMuter(IO.ComfyNode):
    @classmethod
    def define_schema(cls):
        return IO.Schema(
            node_id="PM Fast Groups Muter",
            display_name="PM Fast Groups Muter",
            category="PM Nodes/Switch Management",
            description="Automatically collect all groups and toggle enable/mute status",
            search_aliases=["快速禁用多框", "Fast Groups Muter", "Groups Muter"],
        )

    @classmethod
    def execute(cls, **kwargs) -> IO.NodeOutput:
        return IO.NodeOutput()


class PMFastGroupsBypasser(IO.ComfyNode):
    @classmethod
    def define_schema(cls):
        return IO.Schema(
            node_id="PM Fast Groups Bypasser",
            display_name="PM Fast Groups Bypasser",
            category="PM Nodes/Switch Management",
            description="Automatically collect all groups and toggle enable/bypass status",
            search_aliases=["快速忽略多框", "Fast Groups Bypasser", "Groups Bypasser"],
        )

    @classmethod
    def execute(cls, **kwargs) -> IO.NodeOutput:
        return IO.NodeOutput()
