# ComfyUI-PM-Nodes

ComfyUI 自定义节点集合，提供流程控制、数学计算、动态下拉菜单和节点管理功能。

## 安装

### 方法1：通过 ComfyUI Manager 安装
在 ComfyUI Manager 中搜索 "PM Nodes" 并安装。

### 方法2：手动安装
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/pixel-magician/ComfyUI-PM-Nodes.git
```

## 节点列表

### 1. IF Branch (条件分支节点)

根据布尔条件选择输出值。

**输入：**
- `condition` (Boolean): 条件判断值
- `true_value` (Any): 条件为 True 时输出的值
- `false_value` (Any): 条件为 False 时输出的值

**输出：**
- `result` (Any): 根据条件返回对应的值

**使用场景：**
- 根据条件动态选择不同的模型或参数
- 实现工作流的分支逻辑

---

### 2. Simple Math (简单数学计算节点)

执行自定义数学表达式计算，支持变量 a、b、c、d。

**输入：**
- `value` (String): 数学表达式，如 "a + b * 2"
- `a`, `b`, `c`, `d` (Any, 可选): 变量值

**输出：**
- `int_result` (Int): 整数结果
- `float_result` (Float): 浮点数结果

**支持的运算符：**
- 基础运算: `+`, `-`, `*`, `/`, `//`, `%`, `**`
- 比较运算: `==`, `!=`, `<`, `<=`, `>`, `>=`
- 逻辑运算: `and`, `or`, `not`

**支持的函数：**
- `min()`, `max()`, `round()`, `sum()`, `len()`

**使用示例：**
- `value`: `"a * 2 + b"`
- `value`: `"max(a, b)"`
- `value`: `"len(a)"` (a 为张量时返回 shape)

---

### 3. Dynamic Dropdown (动态下拉菜单节点)

创建可动态配置选项的下拉菜单。

**输入：**
- `options` (String): 选项列表，用逗号、分号或换行分隔
- `selection` (Combo): 选择的选项

**输出：**
- `index` (Int): 选中项的索引
- `selected_value` (String): 选中的值

**使用示例：**
- `options`: `"Option1,Option2,Option3"`
- `options`: `"低质量,中等质量,高质量"`

---

### 4. PM Fast Muter (快速禁用节点)

快速切换连接节点的启用/禁用状态。

**分类：** PM Nodes/Switch Management

**功能：**
- 一键禁用/启用连接的节点
- 支持中文搜索别名："快速禁用"

---

### 5. PM Fast Bypasser (快速忽略节点)

快速切换连接节点的启用/忽略状态。

**分类：** PM Nodes/Switch Management

**功能：**
- 一键绕过/恢复连接的节点
- 支持中文搜索别名："快速忽略"

---

### 6. PM Fast Groups Muter (快速多框禁用节点)

自动收集所有组并批量切换启用/禁用状态。

**分类：** PM Nodes/Switch Management

**功能：**
- 对整个组内的节点进行批量禁用/启用
- 支持中文搜索别名："快速禁用多框"

---

### 7. PM Fast Groups Bypasser (快速多框忽略节点)

自动收集所有组并批量切换启用/忽略状态。

**分类：** PM Nodes/Switch Management

**功能：**
- 对整个组内的节点进行批量绕过/恢复
- 支持中文搜索别名："快速忽略多框"

## 技术特性

- **多语言支持**：内置中英文本地化
- **延迟加载**：IF Branch 节点支持延迟输入加载，优化性能
- **虚拟节点**：Switch Management 系列节点在前端运行，不参与服务端执行
- **类型安全**：完整的输入验证和类型检查

## 依赖

- ComfyUI >= 1.0.0
- comfy_api (ComfyUI V3 API)

## 许可证

详见项目 LICENSE 文件。

## 链接

- 源码仓库：https://github.com/pixel-magician/ComfyUI-PM-Nodes
- 问题反馈：https://github.com/pixel-magician/ComfyUI-PM-Nodes/issues
- 文档：https://github.com/pixel-magician/ComfyUI-PM-Nodes/wiki
