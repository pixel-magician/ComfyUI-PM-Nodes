from comfy_api.latest import ComfyExtension, IO
from .if_branch_node import IfBranchNode
from .dynamic_dropdown_node import DynamicDropdownNode
from .simple_math_node import SimpleMathNode
from .virtual_nodes import (
    PMFastMuter,
    PMFastBypasser,
    PMFastGroupsMuter,
    PMFastGroupsBypasser,
)

WEB_DIRECTORY = "./web"


class PMNodesExtension(ComfyExtension):
    async def get_node_list(self) -> list[type[IO.ComfyNode]]:
        return [
            DynamicDropdownNode,
            IfBranchNode,
            SimpleMathNode,
            PMFastMuter,
            PMFastBypasser,
            PMFastGroupsMuter,
            PMFastGroupsBypasser,
        ]


async def comfy_entrypoint() -> PMNodesExtension:
    return PMNodesExtension()
