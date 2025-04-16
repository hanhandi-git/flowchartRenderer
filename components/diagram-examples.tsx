// 各种图表类型的示例代码
export const DiagramExamples: Record<string, string> = {
  // 流程图示例
  flowchart: `graph TD;
    A[开始] --> B[处理];
    B --> C{判断条件};
    C -->|是| D[处理1];
    C -->|否| E[处理2];
    D --> F[结束];
    E --> F;`,

  // 时序图示例
  sequence: `sequenceDiagram
    participant 浏览器
    participant 服务器
    participant 数据库
    
    浏览器->>服务器: 发送请求
    activate 服务器
    服务器->>数据库: 查询数据
    activate 数据库
    数据库-->>服务器: 返回数据
    deactivate 数据库
    服务器-->>浏览器: 响应请求
    deactivate 服务器
    
    Note right of 浏览器: 用户看到结果`,

  // 类图示例
  class: `classDiagram
    class Animal {
      +String name
      +int age
      +makeSound() void
    }
    
    class Dog {
      +String breed
      +bark() void
    }
    
    class Cat {
      +String color
      +meow() void
    }
    
    Animal <|-- Dog
    Animal <|-- Cat
    
    note for Dog "人类最好的朋友"`,

  // 状态图示例
  state: `stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中: 开始处理
    处理中 --> 已完成: 处理完成
    处理中 --> 已取消: 取消处理
    已完成 --> [*]
    已取消 --> [*]
    
    note right of 待处理: 初始状态
    note right of 已完成: 终态之一
    note right of 已取消: 终态之一`,

  // 实体关系图示例
  er: `erDiagram
    CUSTOMER ||--o{ ORDER : "下单"
    ORDER ||--|{ ORDER_ITEM : "包含"
    CUSTOMER {
      int id
      string name
      string email
    }
    ORDER {
      int id
      date created_at
      string status
    }
    ORDER_ITEM {
      int id
      int order_id
      int product_id
      int quantity
    }`,

  // 甘特图示例
  gantt: `gantt
    title 项目开发计划
    dateFormat YYYY-MM-DD
    
    section 规划阶段
    需求分析    :a1, 2023-01-01, 7d
    系统设计    :a2, after a1, 10d
    
    section 开发阶段
    编码实现    :b1, after a2, 15d
    单元测试    :b2, after b1, 5d
    
    section 测试阶段
    集成测试    :c1, after b2, 7d
    系统测试    :c2, after c1, 7d
    
    section 发布阶段
    部署上线    :d1, after c2, 3d
    用户培训    :d2, after d1, 5d`,

  // 饼图示例
  pie: `pie
    title 网站访问来源
    "搜索引擎" : 42.7
    "直接访问" : 28.9
    "社交媒体" : 18.6
    "邮件营销" : 5.3
    "其他渠道" : 4.5`,

  // Graphviz示例
  graphviz: `digraph G {
    start [label="开始", shape=box];
    process [label="处理", shape=box];
    decision [label="判断条件", shape=diamond];
    process1 [label="处理1", shape=box];
    process2 [label="处理2", shape=box];
    end [label="结束", shape=box];
    
    start -> process;
    process -> decision;
    decision -> process1 [label="是"];
    decision -> process2 [label="否"];
    process1 -> end;
    process2 -> end;
  }`,
}
