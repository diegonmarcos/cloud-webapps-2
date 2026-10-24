export interface GraphNode {
  id: string
  type: 'array' | 'object'
  path: string
  x: number
  y: number
  data: Record<string, unknown>
  label: string
  totalSize: number
  depth: number
}

export interface GraphEdge {
  from: string
  to: string
  label: string
}

export interface GraphResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  size: number
}

export interface OpenDoc {
  filename: string
  content: string
  originalContent: string
  pinned?: boolean
  sourceUrl?: string
}

export interface Notification {
  msg: string
  isError?: boolean
}

export type ViewMode = 'split' | 'editor' | 'visual' | 'graph' | 'table' | 'paths' | 'mindmap'
export type LayoutMode = 'vertical' | 'horizontal'
