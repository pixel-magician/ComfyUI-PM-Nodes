from comfy_api.latest import ComfyExtension, IO
from .if_branch_node import IfBranchNode
from .dynamic_dropdown_node import DynamicDropdownNode


class TestImageExtension(ComfyExtension):
    async def get_node_list(self) -> list[type[IO.ComfyNode]]:
        return [
            DynamicDropdownNode,
            IfBranchNode,
        ]


async def comfy_entrypoint() -> TestImageExtension:
    return TestImageExtension()
