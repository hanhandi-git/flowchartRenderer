"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Copy, RefreshCw, Code, MousePointer } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { toPng } from "html-to-image"
import mermaid from "mermaid"
import { graphviz } from "d3-graphviz"
import "reactflow/dist/style.css"
import { VisualEditor } from "@/components/visual-editor"
import { DiagramExamples } from "@/components/diagram-examples"

// 主题定义
type MermaidTheme = "default" | "forest" | "dark" | "neutral" | "base"
type GraphvizTheme = "default" | "dark" | "colorful" | "monochrome" | "blueprint"
type Theme = MermaidTheme | GraphvizTheme

// 图表类型定义
export type DiagramType = "flowchart" | "sequence" | "class" | "state" | "er" | "gantt" | "pie" | "graphviz"

// Graphviz主题样式
const GRAPHVIZ_THEMES = {
  default: `bgcolor="white"; fontname="Arial"; node [style="filled", fillcolor="#f5f5f5", color="#333333", fontname="Arial"]; edge [color="#666666", fontname="Arial"];`,
  dark: `bgcolor="#2d2d2d"; fontcolor="white"; fontname="Arial"; node [style="filled", fillcolor="#3d3d3d", color="#cccccc", fontcolor="white", fontname="Arial"]; edge [color="#999999", fontcolor="white", fontname="Arial"];`,
  colorful: `bgcolor="white"; fontname="Arial"; node [style="filled", color="#333333", fontname="Arial", colorscheme="set312"]; edge [colorscheme="set312", fontname="Arial"];`,
  monochrome: `bgcolor="white"; fontname="Arial"; node [style="filled", fillcolor="#e6e6e6", color="#333333", fontname="Arial"]; edge [color="#999999", fontname="Arial"];`,
  blueprint: `bgcolor="#f0f8ff"; fontname="Arial"; node [style="filled", fillcolor="#d0e0f0", color="#4682b4", fontname="Arial"]; edge [color="#4682b4", fontname="Arial"];`,
}

// Mermaid主题
const MERMAID_THEMES: MermaidTheme[] = ["default", "forest", "dark", "neutral", "base"]
const GRAPHVIZ_THEME_OPTIONS: GraphvizTheme[] = ["default", "dark", "colorful", "monochrome", "blueprint"]

// 初始化mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  logLevel: 5,
  flowchart: { htmlLabels: true, useMaxWidth: true },
  sequence: { useMaxWidth: true, showSequenceNumbers: true },
  gantt: { useMaxWidth: true },
})

// 图表类型配置
const DIAGRAM_TYPES = [
  { value: "flowchart", label: "流程图", syntax: "mermaid" },
  { value: "sequence", label: "时序图", syntax: "mermaid" },
  { value: "class", label: "类图", syntax: "mermaid" },
  { value: "state", label: "状态图", syntax: "mermaid" },
  { value: "er", label: "实体关系图", syntax: "mermaid" },
  { value: "gantt", label: "甘特图", syntax: "mermaid" },
  { value: "pie", label: "饼图", syntax: "mermaid" },
  { value: "graphviz", label: "Graphviz", syntax: "graphviz" },
]

export default function FlowchartRenderer() {
  const [diagramType, setDiagramType] = useState<DiagramType>("flowchart")
  const [syntax, setSyntax] = useState<"mermaid" | "graphviz">("mermaid")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [mermaidTheme, setMermaidTheme] = useState<MermaidTheme>("default")
  const [graphvizTheme, setGraphvizTheme] = useState<GraphvizTheme>("default")
  const [activeTab, setActiveTab] = useState<"code" | "visual">("code")
  const renderRef = useRef<HTMLDivElement>(null)
  const graphvizRef = useRef<HTMLDivElement>(null)

  // 获取当前主题
  const currentTheme = syntax === "mermaid" ? mermaidTheme : graphvizTheme

  // 渲染图表
  const renderChart = async () => {
    setIsRendering(true)
    setError(null)

    try {
      if (syntax === "mermaid") {
        // 更新Mermaid配置以应用主题
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme,
          securityLevel: "loose",
          logLevel: 5,
          flowchart: { htmlLabels: true, useMaxWidth: true },
          sequence: { useMaxWidth: true, showSequenceNumbers: true },
          gantt: { useMaxWidth: true },
        })

        if (renderRef.current) {
          renderRef.current.innerHTML = ""
          try {
            const { svg } = await mermaid.render("mermaid-diagram", code || getDefaultCode())
            if (renderRef.current) {
              renderRef.current.innerHTML = svg
            }
          } catch (mermaidError) {
            console.error("Mermaid rendering error:", mermaidError)
            setError(`Mermaid 渲染错误: ${mermaidError instanceof Error ? mermaidError.message : String(mermaidError)}`)
          }
        }
      } else if (syntax === "graphviz") {
        if (graphvizRef.current) {
          graphvizRef.current.innerHTML = ""

          // 应用Graphviz主题
          let themedCode = code || "digraph G {}"

          // 检查代码是否已包含图形属性
          if (themedCode.includes("digraph") || themedCode.includes("graph")) {
            // 正确插入图形属性
            const graphMatch = themedCode.match(/(digraph|graph)\s+([^{]+)\s*{/)

            if (graphMatch) {
              const prefix = graphMatch[0]
              const attributes = GRAPHVIZ_THEMES[graphvizTheme]

              // 在第一个大括号后插入属性
              themedCode = themedCode.replace(prefix, `${prefix}\n  ${attributes}\n`)
            }
          }

          try {
            graphviz(graphvizRef.current)
              .onerror((graphvizError) => {
                console.error("Graphviz error:", graphvizError)
                setError(`Graphviz 渲染错误: ${String(graphvizError)}`)
                setIsRendering(false)
              })
              .renderDot(themedCode)
              .on("end", () => setIsRendering(false))
          } catch (graphvizError) {
            console.error("Graphviz initialization error:", graphvizError)
            setError(
              `Graphviz 初始化错误: ${graphvizError instanceof Error ? graphvizError.message : String(graphvizError)}`,
            )
            setIsRendering(false)
          }
        }
      }
    } catch (err) {
      console.error("Rendering error:", err)
      setError(err instanceof Error ? err.message : "渲染错误: " + String(err))
      setIsRendering(false)
    } finally {
      if (syntax === "mermaid") {
        setIsRendering(false)
      }
    }
  }

  // 获取当前图表类型的默认代码
  const getDefaultCode = () => {
    return DiagramExamples[diagramType] || ""
  }

  // 图表类型切换
  const handleDiagramTypeChange = (newType: DiagramType) => {
    setDiagramType(newType)

    // 设置对应的语法类型
    const diagramConfig = DIAGRAM_TYPES.find((d) => d.value === newType)
    if (diagramConfig) {
      setSyntax(diagramConfig.syntax as "mermaid" | "graphviz")
    }

    // 重置为默认代码
    setCode(DiagramExamples[newType])

    // 重置为代码编辑模式
    setActiveTab("code")
  }

  // 初始化默认代码
  useEffect(() => {
    setCode(getDefaultCode())
  }, [])

  // 代码或主题变更时自动渲染
  useEffect(() => {
    if (!code) return // 如果代码为空，不进行渲染

    const timer = setTimeout(() => {
      renderChart().catch((err) => {
        console.error("Auto-render error:", err)
        setError(`自动渲染错误: ${err instanceof Error ? err.message : String(err)}`)
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [code, syntax, mermaidTheme, graphvizTheme, diagramType])

  // 下载SVG
  const downloadSVG = () => {
    const svgElement = renderRef.current?.querySelector("svg") || graphvizRef.current?.querySelector("svg")
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const blob = new Blob([svgData], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `diagram-${diagramType}-${Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  // 下载PNG
  const downloadPNG = () => {
    const element = syntax === "mermaid" ? renderRef.current : graphvizRef.current
    if (!element) {
      setError("无法找到要导出的元素")
      return
    }

    toPng(element)
      .then((dataUrl) => {
        const link = document.createElement("a")
        link.download = `diagram-${diagramType}-${Date.now()}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
      .catch((error) => {
        console.error("PNG export error:", error)
        setError(`PNG导出失败: ${error instanceof Error ? error.message : String(error)}`)
      })
  }

  // 复制代码
  const copyCode = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        alert("代码已复制到剪贴板")
      })
      .catch((err) => {
        setError(`复制失败: ${err.message}`)
      })
  }

  // 从可视化编辑器更新代码
  const handleVisualUpdate = (newCode: string) => {
    setCode(newCode)
  }

  // 判断当前图表类型是否支持可视化编辑
  const supportsVisualEditing = diagramType === "flowchart" || diagramType === "graphviz"

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6 text-center">多功能图表渲染器</h1>

      <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={diagramType} onValueChange={(value) => handleDiagramTypeChange(value as DiagramType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择图表类型" />
            </SelectTrigger>
            <SelectContent>
              {DIAGRAM_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentTheme}
            onValueChange={(value) => {
              if (syntax === "mermaid") {
                setMermaidTheme(value as MermaidTheme)
              } else {
                setGraphvizTheme(value as GraphvizTheme)
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择主题" />
            </SelectTrigger>
            <SelectContent>
              {syntax === "mermaid"
                ? MERMAID_THEMES.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </SelectItem>
                  ))
                : GRAPHVIZ_THEME_OPTIONS.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={renderChart} title="刷新">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={copyCode}>
            <Copy className="h-4 w-4 mr-2" />
            复制代码
          </Button>
          <Button variant="outline" onClick={downloadSVG}>
            <Download className="h-4 w-4 mr-2" />
            下载SVG
          </Button>
          <Button variant="outline" onClick={downloadPNG}>
            <Download className="h-4 w-4 mr-2" />
            下载PNG
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "code" | "visual")} className="mb-4">
        <TabsList>
          <TabsTrigger value="code" className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            代码编辑
          </TabsTrigger>
          <TabsTrigger
            value="visual"
            className="flex items-center gap-1"
            disabled={!supportsVisualEditing}
            title={!supportsVisualEditing ? "此图表类型不支持可视化编辑" : ""}
          >
            <MousePointer className="h-4 w-4" />
            可视化编辑
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[600px] flex flex-col">
            <Textarea
              className="flex-1 font-mono text-sm p-4 resize-none h-full"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`在此输入${syntax === "mermaid" ? "Mermaid" : "Graphviz"}语法...`}
            />
          </div>

          <Card className="p-4 h-[600px] overflow-auto relative">
            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {error && <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

            <div className={syntax === "mermaid" ? "block" : "hidden"}>
              <div ref={renderRef} className="flex items-center justify-center min-h-[500px]"></div>
            </div>

            <div className={syntax === "graphviz" ? "block" : "hidden"}>
              <div ref={graphvizRef} className="flex items-center justify-center min-h-[500px]"></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="visual">
          <div className="h-[600px] border rounded-md">
            {supportsVisualEditing && (
              <VisualEditor syntax={syntax} code={code} diagramType={diagramType} onCodeChange={handleVisualUpdate} />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          提示: 您可以在代码编辑模式下直接编写{syntax === "mermaid" ? "Mermaid" : "Graphviz"}
          语法。{supportsVisualEditing ? "也可以在可视化编辑模式下通过拖拽创建图表。" : ""}
        </p>
      </div>
    </div>
  )
}
