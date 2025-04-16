"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Panel,
  type NodeProps,
  Handle,
  Position,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Square, Circle, Diamond } from "lucide-react"
import type { DiagramType } from "@/app/page"

// 节点类型定义
type NodeData = {
  label: string
  type?: string
  shape?: string
}

// 自定义节点组件 - 处理节点
function ProcessNode({ data, selected, id }: NodeProps<NodeData>) {
  return (
    <div
      className={`px-4 py-2 rounded-md border-2 ${
        selected ? "border-primary" : "border-gray-300"
      } bg-white shadow-sm min-w-[100px] text-center`}
    >
      <Handle type="target" position={Position.Top} />
      <div>{data.label || "处理"}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 自定义节点组件 - 决策节点
function DecisionNode({ data, selected, id }: NodeProps<NodeData>) {
  return (
    <div
      className={`px-4 py-2 rotate-45 border-2 ${
        selected ? "border-primary" : "border-gray-300"
      } bg-white shadow-sm min-w-[100px] min-h-[100px] flex items-center justify-center`}
    >
      <Handle type="target" position={Position.Top} style={{ transform: "rotate(-45deg)" }} />
      <div className="-rotate-45 text-center">{data.label || "判断"}</div>
      <Handle type="source" position={Position.Bottom} style={{ transform: "rotate(-45deg)" }} />
      <Handle type="source" position={Position.Right} style={{ transform: "rotate(-45deg)" }} />
    </div>
  )
}

// 自定义节点组件 - 开始/结束节点
function TerminalNode({ data, selected, id }: NodeProps<NodeData>) {
  return (
    <div
      className={`px-4 py-2 rounded-full border-2 ${
        selected ? "border-primary" : "border-gray-300"
      } bg-white shadow-sm min-w-[100px] text-center`}
    >
      <Handle type="target" position={Position.Top} />
      <div>{data.label || "开始/结束"}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// 节点类型映射
const nodeTypes: NodeTypes = {
  process: ProcessNode,
  decision: DecisionNode,
  terminal: TerminalNode,
}

// 将Mermaid代码转换为ReactFlow节点和边
const parseMermaidToFlow = (code: string): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = []
  const edges: Edge[] = []

  if (!code || code.trim() === "") {
    return { nodes, edges }
  }

  try {
    // 简单解析Mermaid语法
    const lines = code.split("\n")
    let nodeId = 1
    const nodeMap: Record<string, string> = {}

    for (const line of lines) {
      // 解析节点定义
      const nodeMatch = line.match(/\s*([A-Za-z0-9_]+)(\[([^\]]+)\]|\{([^}]+)\}|$([^$]+)\))/)
      if (nodeMatch) {
        const id = nodeMatch[1]
        const label = nodeMatch[3] || nodeMatch[4] || nodeMatch[5] || id
        let type = "process"

        // 根据语法确定节点类型
        if (nodeMatch[0].includes("{")) {
          type = "decision"
        } else if (nodeMatch[0].includes("(")) {
          type = "terminal"
        }

        nodeMap[id] = `${nodeId}`

        nodes.push({
          id: `${nodeId}`,
          type,
          data: { label },
          position: { x: 100 + (nodeId % 3) * 200, y: 100 + Math.floor(nodeId / 3) * 150 },
        })

        nodeId++
      }

      // 解析边定义
      const edgeMatch = line.match(/\s*([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/)
      if (edgeMatch) {
        const source = edgeMatch[1]
        const target = edgeMatch[2]

        if (nodeMap[source] && nodeMap[target]) {
          edges.push({
            id: `e${nodeMap[source]}-${nodeMap[target]}`,
            source: nodeMap[source],
            target: nodeMap[target],
            type: "default",
          })
        }
      }
    }
  } catch (error) {
    console.error("解析Mermaid代码出错:", error)
  }

  return { nodes, edges }
}

// 修改解析Graphviz代码的函数，确保正确处理语法
const parseGraphvizToFlow = (code: string): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = []
  const edges: Edge[] = []

  if (!code || code.trim() === "") {
    return { nodes, edges }
  }

  try {
    // 简单解析Graphviz语法，忽略图形属性行
    const lines = code
      .split("\n")
      .filter(
        (line) =>
          !line.trim().startsWith("graph [") &&
          !line.trim().startsWith("node [") &&
          !line.trim().startsWith("edge [") &&
          !line.trim().startsWith("bgcolor=") &&
          !line.trim().startsWith("fontname="),
      )

    let nodeId = 1
    const nodeMap: Record<string, string> = {}

    for (const line of lines) {
      // 解析节点定义，支持带引号的节点ID
      const nodeMatch = line.match(/\s*"?([A-Za-z0-9_]+)"?\s*\[([^\]]+)\]/)
      if (nodeMatch) {
        const id = nodeMatch[1]
        const attrs = nodeMatch[2]

        let label = id
        let type = "process"

        // 解析标签
        const labelMatch = attrs.match(/label\s*=\s*"([^"]+)"/)
        if (labelMatch) {
          label = labelMatch[1]
        }

        // 解析形状
        const shapeMatch = attrs.match(/shape\s*=\s*([^,\s;]+)/)
        if (shapeMatch) {
          const shape = shapeMatch[1].toLowerCase()
          if (shape === "diamond") {
            type = "decision"
          } else if (shape === "ellipse" || shape === "circle") {
            type = "terminal"
          }
        }

        nodeMap[id] = `${nodeId}`

        nodes.push({
          id: `${nodeId}`,
          type,
          data: { label },
          position: { x: 100 + (nodeId % 3) * 200, y: 100 + Math.floor(nodeId / 3) * 150 },
        })

        nodeId++
      }

      // 解析边定义，支持带引号的节点ID
      const edgeMatch = line.match(/\s*"?([A-Za-z0-9_]+)"?\s*->\s*"?([A-Za-z0-9_]+)"?/)
      if (edgeMatch) {
        const source = edgeMatch[1]
        const target = edgeMatch[2]

        if (nodeMap[source] && nodeMap[target]) {
          edges.push({
            id: `e${nodeMap[source]}-${nodeMap[target]}`,
            source: nodeMap[source],
            target: nodeMap[target],
            type: "default",
          })
        }
      }
    }
  } catch (error) {
    console.error("解析Graphviz代码出错:", error)
  }

  return { nodes, edges }
}

// 修改将ReactFlow节点和边转换为Graphviz代码的函数
const convertFlowToGraphviz = (nodes: Node[], edges: Edge[]): string => {
  let code = "digraph G {\n"

  // 添加节点
  nodes.forEach((node) => {
    const label = node.data.label || "节点"
    let shape = "box"

    if (node.type === "decision") {
      shape = "diamond"
    } else if (node.type === "terminal") {
      shape = "ellipse"
    }

    // 确保节点定义使用正确的语法
    code += `  "${node.id}" [label="${label}", shape=${shape}];\n`
  })

  // 添加边
  edges.forEach((edge) => {
    // 确保边定义使用正确的语法
    code += `  "${edge.source}" -> "${edge.target}";\n`
  })

  code += "}"

  return code
}

// 将ReactFlow节点和边转换为Mermaid代码
const convertFlowToMermaid = (nodes: Node[], edges: Edge[]): string => {
  let code = "graph TD;\n"

  // 添加节点
  nodes.forEach((node) => {
    const label = node.data.label || "节点"
    let shape = "["

    if (node.type === "decision") {
      shape = "{"
    } else if (node.type === "terminal") {
      shape = "(("
    }

    code += `  ${node.id}${shape}${label}${shape === "[" ? "]" : shape === "{" ? "}" : ")"};\n`
  })

  // 添加边
  edges.forEach((edge) => {
    code += `  ${edge.source} --> ${edge.target};\n`
  })

  return code
}

// 可视化编辑器组件
export function VisualEditor({
  syntax,
  code,
  diagramType,
  onCodeChange,
}: {
  syntax: "mermaid" | "graphviz"
  code: string
  diagramType: DiagramType
  onCodeChange: (code: string) => void
}) {
  // 解析代码为节点和边
  const parseCode = useCallback(() => {
    try {
      if (syntax === "mermaid" && diagramType === "flowchart") {
        return parseMermaidToFlow(code || "graph TD;")
      } else if (syntax === "graphviz") {
        return parseGraphvizToFlow(code || "digraph G {}")
      }
      return { nodes: [], edges: [] }
    } catch (error) {
      console.error("解析代码出错:", error)
      return { nodes: [], edges: [] }
    }
  }, [code, syntax, diagramType])

  const { nodes: initialNodes, edges: initialEdges } = parseCode()

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // 连接节点
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges],
  )

  // 节点选择
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  // 背景点击
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // 更新节点数据
  const updateNodeData = useCallback(
    (id: string, newData: NodeData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...newData,
              },
            }
          }
          return node
        }),
      )
    },
    [setNodes],
  )

  // 更新节点类型
  const updateNodeType = useCallback(
    (id: string, newType: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              type: newType,
            }
          }
          return node
        }),
      )
    },
    [setNodes],
  )

  // 添加新节点
  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${nodes.length + 1}`,
        type,
        data: { label: type === "process" ? "处理" : type === "decision" ? "判断" : "开始/结束" },
        position: {
          x: 100 + (nodes.length % 3) * 200,
          y: 100 + Math.floor(nodes.length / 3) * 150,
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [nodes, setNodes],
  )

  // 删除选中节点
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))
      setSelectedNode(null)
    }
  }, [selectedNode, setNodes, setEdges])

  // 当节点或边变化时，更新代码
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        let newCode = ""
        if (syntax === "mermaid" && diagramType === "flowchart") {
          newCode = convertFlowToMermaid(nodes, edges)
        } else if (syntax === "graphviz") {
          newCode = convertFlowToGraphviz(nodes, edges)
        }
        onCodeChange(newCode)
      }, 500)

      return () => clearTimeout(timer)
    } catch (error) {
      console.error("更新代码出错:", error)
    }
  }, [nodes, edges, syntax, diagramType, onCodeChange])

  // 当代码或语法变化时，重新解析
  useEffect(() => {
    try {
      const { nodes: newNodes, edges: newEdges } = parseCode()
      setNodes(newNodes)
      setEdges(newEdges)
    } catch (error) {
      console.error("重新解析代码出错:", error)
    }
  }, [code, syntax, diagramType, parseCode, setNodes, setEdges])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />

        <Panel position="top-left" className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => addNode("process")}>
            <Square className="h-4 w-4 mr-1" />
            处理节点
          </Button>
          <Button size="sm" variant="outline" onClick={() => addNode("decision")}>
            <Diamond className="h-4 w-4 mr-1" />
            判断节点
          </Button>
          <Button size="sm" variant="outline" onClick={() => addNode("terminal")}>
            <Circle className="h-4 w-4 mr-1" />
            开始/结束
          </Button>
        </Panel>

        {selectedNode && (
          <Panel position="top-right">
            <Card className="w-64">
              <CardHeader>
                <CardTitle className="text-sm">节点属性</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="node-label">标签</Label>
                  <Input
                    id="node-label"
                    value={selectedNode.data.label || ""}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="node-type">类型</Label>
                  <Select
                    value={selectedNode.type || "process"}
                    onValueChange={(value) => updateNodeType(selectedNode.id, value)}
                  >
                    <SelectTrigger id="node-type">
                      <SelectValue placeholder="选择节点类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="process">处理节点</SelectItem>
                      <SelectItem value="decision">判断节点</SelectItem>
                      <SelectItem value="terminal">开始/结束节点</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" size="sm" onClick={deleteSelectedNode}>
                  删除节点
                </Button>
              </CardFooter>
            </Card>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}
