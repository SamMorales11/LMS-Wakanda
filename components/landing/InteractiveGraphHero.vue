<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useMouseInElement } from '@vueuse/core'

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Mouse tracking via VueUse
const { elementX, elementY, isOutside, elementWidth, elementHeight } = useMouseInElement(containerRef)

interface GraphNode {
  id: string
  label: string
  code: string
  nx: number // Normalized X (0 to 1)
  ny: number // Normalized Y (0 to 1)
  x: number  // Actual pixel X
  y: number  // Actual pixel Y
  baseX: number
  baseY: number
  vx: number
  vy: number
  radius: number
  group: 'root' | 'bst' | 'avl' | 'heap' | 'graph'
  color: string
}

interface GraphEdge {
  from: string
  to: string
  weight: number
  dashed?: boolean
}

interface PulsePacket {
  edgeIndex: number
  progress: number // 0 to 1
  speed: number
  color: string
}

// 14 Nodes representing IF2041 Data Structures
const initialNodes: Array<Omit<GraphNode, 'x' | 'y' | 'baseX' | 'baseY' | 'vx' | 'vy'>> = [
  { id: 'n-root', label: 'ROOT:ADT', code: '0x00', nx: 0.50, ny: 0.16, radius: 7, group: 'root', color: '#0D9488' },
  { id: 'n-bst-l', label: 'BST:LEFT', code: '0x1A', nx: 0.28, ny: 0.34, radius: 6, group: 'bst', color: '#38BDF8' },
  { id: 'n-bst-r', label: 'BST:RIGHT', code: '0x1B', nx: 0.72, ny: 0.34, radius: 6, group: 'bst', color: '#38BDF8' },
  { id: 'n-avl-1', label: 'AVL:BAL_L', code: '0x21', nx: 0.16, ny: 0.54, radius: 5.5, group: 'avl', color: '#2DD4BF' },
  { id: 'n-avl-2', label: 'AVL:BAL_R', code: '0x22', nx: 0.38, ny: 0.54, radius: 5.5, group: 'avl', color: '#2DD4BF' },
  { id: 'n-heap-1', label: 'HEAP:MIN', code: '0x31', nx: 0.62, ny: 0.54, radius: 5.5, group: 'heap', color: '#F59E0B' },
  { id: 'n-heap-2', label: 'HEAP:MAX', code: '0x32', nx: 0.84, ny: 0.54, radius: 5.5, group: 'heap', color: '#F59E0B' },
  { id: 'n-v1', label: 'GRAF:V1', code: '0x40', nx: 0.18, ny: 0.76, radius: 6, group: 'graph', color: '#818CF8' },
  { id: 'n-v2', label: 'GRAF:V2', code: '0x41', nx: 0.38, ny: 0.82, radius: 6, group: 'graph', color: '#818CF8' },
  { id: 'n-v3', label: 'DIJKSTRA', code: '0x42', nx: 0.52, ny: 0.72, radius: 6.5, group: 'graph', color: '#0D9488' },
  { id: 'n-v4', label: 'BFS:QUEUE', code: '0x43', nx: 0.68, ny: 0.82, radius: 6, group: 'graph', color: '#818CF8' },
  { id: 'n-v5', label: 'DFS:STACK', code: '0x44', nx: 0.82, ny: 0.74, radius: 6, group: 'graph', color: '#818CF8' },
  { id: 'n-hash', label: 'HASH:O(1)', code: '0x50', nx: 0.50, ny: 0.42, radius: 6, group: 'root', color: '#10B981' }
]

// Edges connecting Tree hierarchy & Graph topology
const edges: GraphEdge[] = [
  // Tree connections
  { from: 'n-root', to: 'n-bst-l', weight: 4 },
  { from: 'n-root', to: 'n-bst-r', weight: 8 },
  { from: 'n-root', to: 'n-hash', weight: 1, dashed: true },
  { from: 'n-bst-l', to: 'n-avl-1', weight: 2 },
  { from: 'n-bst-l', to: 'n-avl-2', weight: 3 },
  { from: 'n-bst-r', to: 'n-heap-1', weight: 5 },
  { from: 'n-bst-r', to: 'n-heap-2', weight: 7 },
  // Graph & Algorithmic traversal connections
  { from: 'n-avl-1', to: 'n-v1', weight: 6 },
  { from: 'n-avl-2', to: 'n-v2', weight: 4 },
  { from: 'n-v1', to: 'n-v2', weight: 3 },
  { from: 'n-v2', to: 'n-v3', weight: 2 },
  { from: 'n-hash', to: 'n-v3', weight: 5, dashed: true },
  { from: 'n-heap-1', to: 'n-v3', weight: 4 },
  { from: 'n-v3', to: 'n-v4', weight: 1 },
  { from: 'n-heap-2', to: 'n-v5', weight: 6 },
  { from: 'n-v4', to: 'n-v5', weight: 3 }
]

const nodes = ref<GraphNode[]>([])
const activeNodeId = ref<string | null>('n-v3')
let animationFrameId: number | null = null
const packets = ref<PulsePacket[]>([])

// HUD Telemetry
const activeNodeInfo = computed(() => {
  return nodes.value.find(n => n.id === activeNodeId.value) || nodes.value[0] || null
})

// Initialize nodes with scaled coordinates
const initNodes = (width: number, height: number) => {
  nodes.value = initialNodes.map(item => {
    const x = item.nx * width
    const y = item.ny * height
    return {
      ...item,
      x,
      y,
      baseX: x,
      baseY: y,
      vx: 0,
      vy: 0
    }
  })

  // Initialize algorithmic packets
  packets.value = [
    { edgeIndex: 0, progress: 0.1, speed: 0.007, color: '#38BDF8' },
    { edgeIndex: 1, progress: 0.6, speed: 0.006, color: '#38BDF8' },
    { edgeIndex: 9, progress: 0.3, speed: 0.009, color: '#2DD4BF' },
    { edgeIndex: 13, progress: 0.8, speed: 0.008, color: '#0D9488' },
    { edgeIndex: 15, progress: 0.4, speed: 0.006, color: '#F59E0B' }
  ]
}

// Render loop
const render = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width / (window.devicePixelRatio || 1)
  const height = canvas.height / (window.devicePixelRatio || 1)

  ctx.clearRect(0, 0, width, height)

  const mouseX = elementX.value
  const mouseY = elementY.value
  const mouseActive = !isOutside.value && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height

  // 1. Draw subtle coordinate grid within canvas
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.lineWidth = 1
  const gridSize = 28
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.restore()

  // 2. Physics & Node Spring Movement towards Base & Mouse
  let closestDist = Infinity
  let closestId: string | null = null

  nodes.value.forEach(node => {
    // Spring to base coordinate
    const dxBase = node.baseX - node.x
    const dyBase = node.baseY - node.y
    node.vx += dxBase * 0.04
    node.vy += dyBase * 0.04

    // Mouse proximity interaction (elastic attraction / deflection)
    if (mouseActive) {
      const dxMouse = mouseX - node.x
      const dyMouse = mouseY - node.y
      const dist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse)

      if (dist < closestDist) {
        closestDist = dist
        closestId = node.id
      }

      if (dist < 120 && dist > 2) {
        // Subtle magnetic pull
        const force = (120 - dist) / 120 * 0.25
        node.vx += (dxMouse / dist) * force
        node.vy += (dyMouse / dist) * force
      }
    }

    // Damping friction
    node.vx *= 0.78
    node.vy *= 0.78
    node.x += node.vx
    node.y += node.vy
  })

  if (closestId && closestDist < 100) {
    activeNodeId.value = closestId
  }

  const nodeMap = new Map<string, GraphNode>()
  nodes.value.forEach(n => nodeMap.set(n.id, n))

  // 3. Draw Edges
  edges.forEach((edge, idx) => {
    const fromNode = nodeMap.get(edge.from)
    const toNode = nodeMap.get(edge.to)
    if (!fromNode || !toNode) return

    const isConnectedToActive = fromNode.id === activeNodeId.value || toNode.id === activeNodeId.value

    ctx.save()
    if (edge.dashed) {
      ctx.setLineDash([3, 4])
    }

    if (isConnectedToActive) {
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.7)' // Scholarly Teal highlight
      ctx.lineWidth = 1.8
    } else {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)' // Subtle slate line
      ctx.lineWidth = 1
    }

    ctx.beginPath()
    ctx.moveTo(fromNode.x, fromNode.y)
    ctx.lineTo(toNode.x, toNode.y)
    ctx.stroke()

    // Draw edge weight badge
    const midX = (fromNode.x + toNode.x) / 2
    const midY = (fromNode.y + toNode.y) / 2
    ctx.fillStyle = isConnectedToActive ? '#0D9488' : 'rgba(148, 163, 184, 0.5)'
    ctx.font = '9px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(edge.weight), midX, midY - 4)

    ctx.restore()
  })

  // 4. Draw Animated Pulses (Algorithmic Packets)
  packets.value.forEach(pkt => {
    pkt.progress += pkt.speed
    if (pkt.progress >= 1) pkt.progress = 0

    const edge = edges[pkt.edgeIndex]
    if (!edge) return
    const fromNode = nodeMap.get(edge.from)
    const toNode = nodeMap.get(edge.to)
    if (!fromNode || !toNode) return

    const px = fromNode.x + (toNode.x - fromNode.x) * pkt.progress
    const py = fromNode.y + (toNode.y - fromNode.y) * pkt.progress

    ctx.save()
    ctx.fillStyle = pkt.color
    ctx.shadowColor = pkt.color
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(px, py, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  // 5. Draw Mouse Target Crosshairs if active
  if (mouseActive) {
    ctx.save()
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.25)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(mouseX - 12, mouseY)
    ctx.lineTo(mouseX + 12, mouseY)
    ctx.moveTo(mouseX, mouseY - 12)
    ctx.lineTo(mouseX, mouseY + 12)
    ctx.stroke()
    ctx.restore()
  }

  // 6. Draw Nodes
  nodes.value.forEach(node => {
    const isActive = node.id === activeNodeId.value

    ctx.save()

    // Outer glow ring if active
    if (isActive) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.5)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius + 9, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.2)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Node body
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? '#0D9488' : '#0F172A'
    ctx.fill()
    ctx.strokeStyle = isActive ? '#5EEAD4' : node.color
    ctx.lineWidth = 1.8
    ctx.stroke()

    // Inner node core
    ctx.beginPath()
    ctx.arc(node.x, node.y, 2, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()

    // Node label typography
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillStyle = isActive ? '#5EEAD4' : 'rgba(226, 232, 240, 0.85)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(node.label, node.x, node.y + node.radius + 4)

    ctx.restore()
  })

  animationFrameId = requestAnimationFrame(render)
}

// Canvas Resizing with Retina Support
const resizeCanvas = () => {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return

  const rect = container.getBoundingClientRect()
  const width = Math.max(rect.width, 320)
  const height = Math.max(rect.height, 360)

  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }

  initNodes(width, height)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  animationFrameId = requestAnimationFrame(render)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-[400px] sm:h-[440px] md:h-[460px] bg-[#0F172A] border border-slate-700/80 rounded-sm relative overflow-hidden flex flex-col justify-between shadow-lg select-none group"
  >
    <!-- Crosshair Corner Tokens (+) -->
    <span class="absolute -top-2.5 -left-2.5 text-teal-400/40 font-mono text-xs pointer-events-none">+</span>
    <span class="absolute -top-2.5 -right-2.5 text-teal-400/40 font-mono text-xs pointer-events-none">+</span>
    <span class="absolute -bottom-2.5 -left-2.5 text-teal-400/40 font-mono text-xs pointer-events-none">+</span>
    <span class="absolute -bottom-2.5 -right-2.5 text-teal-400/40 font-mono text-xs pointer-events-none">+</span>

    <!-- Top Scientific HUD Bar -->
    <div class="px-3.5 py-2.5 border-b border-slate-800 bg-[#0B132B]/80 backdrop-blur-xs flex items-center justify-between text-[11px] font-mono text-slate-400 relative z-10">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse"></span>
        <span class="text-slate-200 font-bold tracking-wider">TOPOLOGI_IF2041</span>
        <span class="text-slate-600 hidden sm:inline">•</span>
        <span class="text-slate-400 hidden sm:inline text-[10px]">Struktur Data &amp; Graf</span>
      </div>

      <div class="flex items-center gap-2 text-[10px]">
        <span class="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-teal-400 rounded-sm font-semibold">
          BFS/DIJKSTRA LIVE
        </span>
        <span class="text-slate-500 hidden md:inline">60 FPS</span>
      </div>
    </div>

    <!-- Canvas Simulation Area -->
    <div class="flex-1 relative w-full h-full min-h-0">
      <canvas ref="canvasRef" class="absolute inset-0 cursor-crosshair w-full h-full"></canvas>

      <!-- Active Node Floating Inspector HUD -->
      <div
        v-if="activeNodeInfo"
        class="absolute top-3 left-3 bg-[#0B132B]/90 border border-teal-500/40 p-2.5 rounded-sm backdrop-blur-md pointer-events-none text-white text-[10px] font-mono space-y-1 shadow-md max-w-[210px]"
      >
        <div class="flex items-center justify-between gap-3 text-teal-400 font-bold border-b border-slate-800 pb-1">
          <span>{{ activeNodeInfo.label }}</span>
          <span class="text-slate-500 text-[9px]">{{ activeNodeInfo.code }}</span>
        </div>
        <div class="text-slate-300 text-[10px] space-y-0.5">
          <div class="flex justify-between">
            <span class="text-slate-400">Tipe Node:</span>
            <span class="uppercase text-white font-semibold">{{ activeNodeInfo.group }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Kompleksitas:</span>
            <span class="text-teal-300 font-semibold">O(log n)</span>
          </div>
          <div class="flex justify-between text-[9px] text-slate-400 pt-0.5">
            <span>Koordinat:</span>
            <span>[{{ Math.round(activeNodeInfo.x) }}, {{ Math.round(activeNodeInfo.y) }}]</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Telemetry Status Strip -->
    <div class="px-3.5 py-2 border-t border-slate-800 bg-[#0B132B]/90 backdrop-blur-xs flex items-center justify-between text-[10px] font-mono text-slate-400 relative z-10">
      <div class="flex items-center gap-3">
        <span class="text-slate-300">
          SIMPUL: <strong class="text-white">13</strong>
        </span>
        <span class="text-slate-600">•</span>
        <span class="text-slate-300">
          SISI: <strong class="text-white">16</strong>
        </span>
        <span class="text-slate-600 hidden sm:inline">•</span>
        <span class="text-teal-400 hidden sm:inline font-semibold">
          MEMORI: 100% HEAP SAFE
        </span>
      </div>

      <div class="flex items-center gap-1.5 text-slate-500">
        <span class="text-[9px] hidden sm:inline">KURSOR:</span>
        <span class="text-slate-300">
          [{{ isOutside ? 'OFF' : `${Math.round(elementX)}, ${Math.round(elementY)}` }}]
        </span>
      </div>
    </div>
  </div>
</template>
