import type { GraphNode, GraphEdge, GraphResult, LayoutMode } from '@/types/json'

const calculateTreeSize = (data: unknown): number => {
  if (data === null || typeof data !== 'object') return 1
  const keys = Object.keys(data as object)
  if (keys.length === 0) return 1
  let size = 0
  keys.forEach(key => {
    const value = (data as Record<string, unknown>)[key]
    if (typeof value === 'object' && value !== null) {
      size += calculateTreeSize(value)
    } else {
      size += 1
    }
  })
  return size
}

export function processGraph(
  data: unknown,
  layout: LayoutMode = 'vertical',
  path = '',
  depth = 0,
  startOffset = 0
): GraphResult {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  if (typeof data !== 'object' || data === null) {
    return { nodes: [], edges: [], size: 1 }
  }

  const keys = Object.keys(data)
  const isArray = Array.isArray(data)
  const nodeId = path || 'root'
  const myTreeSize = calculateTreeSize(data)

  const V_X_GAP = 500
  const V_Y_GAP = 120
  const H_X_GAP = 360
  const H_Y_GAP = 250

  let x: number, y: number

  if (layout === 'vertical') {
    x = depth * V_X_GAP + 80
    y = startOffset * V_Y_GAP + 80
  } else {
    x = startOffset * H_X_GAP + 80
    y = depth * H_Y_GAP + 80
  }

  const node: GraphNode = {
    id: nodeId,
    type: isArray ? 'array' : 'object',
    path: path,
    x,
    y,
    data: {},
    label: path.split('.').pop() || path.split('[').pop()?.replace(']', '') || 'Root',
    totalSize: myTreeSize,
    depth
  }

  let currentOffsetCursor = startOffset

  keys.forEach((key) => {
    const value = (data as Record<string, unknown>)[key]
    const currentPath = path ? (isArray ? `${path}[${key}]` : `${path}.${key}`) : key
    const isPrimitive = value === null || typeof value !== 'object'

    if (isPrimitive) {
      node.data[key] = value
    } else {
      const childResult = processGraph(value, layout, currentPath, depth + 1, currentOffsetCursor)
      nodes.push(...childResult.nodes)
      edges.push(...childResult.edges)
      edges.push({ from: nodeId, to: currentPath, label: key })

      currentOffsetCursor += childResult.size + (layout === 'vertical' ? 1.2 : 0.2)
    }
  })

  nodes.push(node)

  const totalSizeUsed = Math.max(1, currentOffsetCursor - startOffset)
  return { nodes, edges, size: totalSizeUsed }
}

export function setValueByPath(obj: unknown, path: string, key: string, value: unknown): unknown {
  const newObj = JSON.parse(JSON.stringify(obj))

  if (!path) {
    newObj[key] = value
    return newObj
  }

  const parts = path.replace(/\]/g, '').split(/[.\[]/)

  let current = newObj
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (current[part] === undefined) return obj
    current = current[part]
  }

  current[key] = value
  return newObj
}
