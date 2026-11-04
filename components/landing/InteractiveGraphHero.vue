<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useMouseInElement } from '@vueuse/core'

type ViewMode = 'rps' | 'ews'
const currentMode = ref<ViewMode>('rps')

const canvasWrapperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Mouse tracking via VueUse directly on the canvas wrapper to eliminate coordinate-space mismatch
const { elementX, elementY, isOutside } = useMouseInElement(canvasWrapperRef)

export interface SessionNode {
  id: string
  sessionNum: number
  label: string
  code: string
  title: string
  topic: string
  complexity: string
  badge: 'MATERI' | 'KUIS' | 'TUGAS' | 'UTS' | 'UAS'
  // Normalized Coords for RPS (0..1)
  rpsNx: number
  rpsNy: number
  // Normalized Coords for EWS (0..1)
  ewsNx: number
  ewsNy: number
  // EWS Telemetry Data
  ewsAttendance: number
  ewsStatus: 'SAFE' | 'WARNING' | 'CRITICAL'
  // Live physics state
  x: number
  y: number
  targetX: number
  targetY: number
  vx: number
  vy: number
  radius: number
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
  progress: number
  speed: number
  color: string
}

// 16 Nodes mapped to IF2041 16-Session RPS Structure
const initialNodesData: Array<Omit<SessionNode, 'x' | 'y' | 'targetX' | 'targetY' | 'vx' | 'vy'>> = [
  {
    id: 'p1-adt',
    sessionNum: 1,
    label: 'P-1:ADT',
    code: '0x01',
    title: 'Paradigma Abstract Data Type & Memory',
    topic: 'Enkapsulasi Modular & Pointer Addressing',
    complexity: 'O(1)',
    badge: 'MATERI',
    rpsNx: 0.10,
    rpsNy: 0.18,
    ewsNx: 0.06,
    ewsNy: 0.25,
    ewsAttendance: 100,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#0D9488'
  },
  {
    id: 'p2-arr',
    sessionNum: 2,
    label: 'P-2:ARRAY',
    code: '0x02',
    title: 'Dynamic Array & Amortized Analysis',
    topic: 'Geometric Expansion & Amortized Bound',
    complexity: 'O(1) amortized',
    badge: 'MATERI',
    rpsNx: 0.26,
    rpsNy: 0.18,
    ewsNx: 0.12,
    ewsNy: 0.25,
    ewsAttendance: 100,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#0D9488'
  },
  {
    id: 'p3-list',
    sessionNum: 3,
    label: 'P-3:LIST',
    code: '0x03',
    title: 'Single & Doubly Linked List',
    topic: 'Sentinel Node Pattern & Pointer Mutation',
    complexity: 'O(1) insert/del',
    badge: 'KUIS',
    rpsNx: 0.42,
    rpsNy: 0.18,
    ewsNx: 0.18,
    ewsNy: 0.30,
    ewsAttendance: 96,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#38BDF8'
  },
  {
    id: 'p4-queue',
    sessionNum: 4,
    label: 'P-4:QUEUE',
    code: '0x04',
    title: 'Stack, Queue & Ring Buffer',
    topic: 'LIFO & FIFO Architecture Circular Buffer',
    complexity: 'O(1) push/pop',
    badge: 'TUGAS',
    rpsNx: 0.58,
    rpsNy: 0.18,
    ewsNx: 0.24,
    ewsNy: 0.32,
    ewsAttendance: 95,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#38BDF8'
  },
  {
    id: 'p5-recur',
    sessionNum: 5,
    label: 'P-5:DIVIDE',
    code: '0x05',
    title: 'Rekursi & Divide-and-Conquer',
    topic: 'Call Stack Frame & Master Theorem',
    complexity: 'O(n log n)',
    badge: 'MATERI',
    rpsNx: 0.74,
    rpsNy: 0.18,
    ewsNx: 0.30,
    ewsNy: 0.36,
    ewsAttendance: 92,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#2DD4BF'
  },
  {
    id: 'p13-hash',
    sessionNum: 13,
    label: 'P-13:HASH',
    code: '0x0D',
    title: 'Hash Tables & Collision Resolution',
    topic: 'Separate Chaining & Open Addressing',
    complexity: 'O(1) avg lookup',
    badge: 'MATERI',
    rpsNx: 0.90,
    rpsNy: 0.18,
    ewsNx: 0.77,
    ewsNy: 0.56,
    ewsAttendance: 79,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#10B981'
  },
  {
    id: 'p6-tree',
    sessionNum: 6,
    label: 'P-6:TREE',
    code: '0x06',
    title: 'Binary Tree & Tree Traversals',
    topic: 'In/Pre/Post-Order & Level Traversals',
    complexity: 'O(n) traversal',
    badge: 'MATERI',
    rpsNx: 0.14,
    rpsNy: 0.50,
    ewsNx: 0.36,
    ewsNy: 0.38,
    ewsAttendance: 90,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#2DD4BF'
  },
  {
    id: 'p7-bst',
    sessionNum: 7,
    label: 'P-7:BST',
    code: '0x07',
    title: 'Binary Search Tree (BST)',
    topic: 'BST Invariant Search/Insert/Delete',
    complexity: 'O(log n) avg',
    badge: 'KUIS',
    rpsNx: 0.32,
    rpsNy: 0.50,
    ewsNx: 0.42,
    ewsNy: 0.41,
    ewsAttendance: 88,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#38BDF8'
  },
  {
    id: 'p8-uts',
    sessionNum: 8,
    label: 'P-8:UTS',
    code: '0x08',
    title: 'Evaluasi Tengah Semester (UTS)',
    topic: 'Ujian Mandiri Sesi 1-7 Terstandarisasi',
    complexity: 'Bobot 25% NA',
    badge: 'UTS',
    rpsNx: 0.50,
    rpsNy: 0.46,
    ewsNx: 0.48,
    ewsNy: 0.41,
    ewsAttendance: 88,
    ewsStatus: 'SAFE',
    radius: 7.5,
    color: '#D97706'
  },
  {
    id: 'p9-avl',
    sessionNum: 9,
    label: 'P-9:AVL',
    code: '0x09',
    title: 'Self-Balancing AVL Trees',
    topic: 'Rotasi LL/RR/LR/RL & Balance Factor',
    complexity: 'O(log n) strict',
    badge: 'MATERI',
    rpsNx: 0.68,
    rpsNy: 0.50,
    ewsNx: 0.54,
    ewsNy: 0.45,
    ewsAttendance: 85,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#2DD4BF'
  },
  {
    id: 'p14-heap',
    sessionNum: 14,
    label: 'P-14:HEAP',
    code: '0x0E',
    title: 'Binary Heaps & HeapSort',
    topic: 'Sift-Up/Down & Priority Queue In-Place',
    complexity: 'O(n log n)',
    badge: 'MATERI',
    rpsNx: 0.86,
    rpsNy: 0.50,
    ewsNx: 0.83,
    ewsNy: 0.50,
    ewsAttendance: 82,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#F59E0B'
  },
  {
    id: 'p10-graph',
    sessionNum: 10,
    label: 'P-10:GRAF',
    code: '0x0A',
    title: 'Representasi Graf (Matrix/List)',
    topic: 'Directed/Weighted Adjacency Structures',
    complexity: 'O(V + E) space',
    badge: 'TUGAS',
    rpsNx: 0.12,
    rpsNy: 0.78,
    ewsNx: 0.60,
    ewsNy: 0.50,
    ewsAttendance: 82,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#818CF8'
  },
  {
    id: 'p11-search',
    sessionNum: 11,
    label: 'P-11:BFS/DFS',
    code: '0x0B',
    title: 'Penelusuran Graf (BFS & DFS)',
    topic: 'Queue Level-Order & Stack Recursive Search',
    complexity: 'O(V + E)',
    badge: 'MATERI',
    rpsNx: 0.30,
    rpsNy: 0.78,
    ewsNx: 0.66,
    ewsNy: 0.54,
    ewsAttendance: 80,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#818CF8'
  },
  {
    id: 'p12-dijkstra',
    sessionNum: 12,
    label: 'P-12:DIJKSTRA',
    code: '0x0C',
    title: 'Shortest Path (Dijkstra/Bellman)',
    topic: 'Greedy Relaxation dengan Min-Heap',
    complexity: 'O((V+E) log V)',
    badge: 'KUIS',
    rpsNx: 0.50,
    rpsNy: 0.76,
    ewsNx: 0.72,
    ewsNy: 0.62,
    ewsAttendance: 76,
    ewsStatus: 'WARNING',
    radius: 7,
    color: '#0D9488'
  },
  {
    id: 'p15-dp',
    sessionNum: 15,
    label: 'P-15:DP',
    code: '0x0F',
    title: 'Pemrograman Dinamis (DP)',
    topic: 'Memoization & Tabulation Optimal Substructure',
    complexity: 'O(n × W)',
    badge: 'TUGAS',
    rpsNx: 0.70,
    rpsNy: 0.78,
    ewsNx: 0.89,
    ewsNy: 0.45,
    ewsAttendance: 85,
    ewsStatus: 'SAFE',
    radius: 6,
    color: '#818CF8'
  },
  {
    id: 'p16-uas',
    sessionNum: 16,
    label: 'P-16:UAS',
    code: '0x10',
    title: 'Evaluasi Akhir Semester (UAS)',
    topic: 'Presentasi Proyek & Evaluasi Komprehensif',
    complexity: 'Bobot 30% NA',
    badge: 'UAS',
    rpsNx: 0.88,
    rpsNy: 0.78,
    ewsNx: 0.95,
    ewsNy: 0.42,
    ewsAttendance: 87,
    ewsStatus: 'SAFE',
    radius: 7.5,
    color: '#38BDF8'
  }
]

// Structural Edges for RPS Topology Mode
const rpsEdges: GraphEdge[] = [
  // Foundations
  { from: 'p1-adt', to: 'p2-arr', weight: 1 },
  { from: 'p2-arr', to: 'p3-list', weight: 2 },
  { from: 'p3-list', to: 'p4-queue', weight: 3 },
  { from: 'p4-queue', to: 'p5-recur', weight: 4 },
  { from: 'p2-arr', to: 'p13-hash', weight: 5, dashed: true },
  // Trees
  { from: 'p5-recur', to: 'p6-tree', weight: 2 },
  { from: 'p6-tree', to: 'p7-bst', weight: 3 },
  { from: 'p7-bst', to: 'p8-uts', weight: 4 },
  { from: 'p7-bst', to: 'p9-avl', weight: 5 },
  { from: 'p9-avl', to: 'p14-heap', weight: 6 },
  // Graphs & Algorithmic Integration
  { from: 'p8-uts', to: 'p10-graph', weight: 4 },
  { from: 'p10-graph', to: 'p11-search', weight: 3 },
  { from: 'p11-search', to: 'p12-dijkstra', weight: 5 },
  { from: 'p13-hash', to: 'p12-dijkstra', weight: 2, dashed: true },
  { from: 'p14-heap', to: 'p12-dijkstra', weight: 3 },
  { from: 'p12-dijkstra', to: 'p15-dp', weight: 6 },
  { from: 'p15-dp', to: 'p16-uas', weight: 7 },
  { from: 'p8-uts', to: 'p16-uas', weight: 8, dashed: true }
]

// Chronological Trajectory Edges for EWS Trajectory Mode
const ewsEdges: GraphEdge[] = [
  { from: 'p1-adt', to: 'p2-arr', weight: 100 },
  { from: 'p2-arr', to: 'p3-list', weight: 100 },
  { from: 'p3-list', to: 'p4-queue', weight: 96 },
  { from: 'p4-queue', to: 'p5-recur', weight: 95 },
  { from: 'p5-recur', to: 'p6-tree', weight: 92 },
  { from: 'p6-tree', to: 'p7-bst', weight: 90 },
  { from: 'p7-bst', to: 'p8-uts', weight: 88 },
  { from: 'p8-uts', to: 'p9-avl', weight: 88 },
  { from: 'p9-avl', to: 'p10-graph', weight: 85 },
  { from: 'p10-graph', to: 'p11-search', weight: 82 },
  { from: 'p11-search', to: 'p12-dijkstra', weight: 80 },
  { from: 'p12-dijkstra', to: 'p13-hash', weight: 76 },
  { from: 'p13-hash', to: 'p14-heap', weight: 79 },
  { from: 'p14-heap', to: 'p15-dp', weight: 82 },
  { from: 'p15-dp', to: 'p16-uas', weight: 85 }
]

const nodes = ref<SessionNode[]>([])
const lockedNodeId = ref<string | null>(null)
const hoveredNodeId = ref<string | null>(null)
const isLocked = ref(false)

let animationFrameId: number | null = null
const packets = ref<PulsePacket[]>([])

// Active node in HUD Inspector
const activeNodeId = computed(() => {
  return lockedNodeId.value || hoveredNodeId.value || 'p8-uts'
})

const activeNodeInfo = computed(() => {
  return nodes.value.find(n => n.id === activeNodeId.value) || nodes.value[0] || null
})

// Metrik ringkas untuk sisi kanan Inspector Bar (bobot evaluasi utama, kompleksitas algoritma, dll.)
const metricLabel = computed(() => {
  const node = activeNodeInfo.value
  if (!node) return ''
  if (node.badge === 'UTS') return 'Bobot 25%'
  if (node.badge === 'UAS') return 'Bobot 30%'
  return node.complexity
})

// Current edges depending on mode
const currentEdges = computed(() => {
  return currentMode.value === 'rps' ? rpsEdges : ewsEdges
})

// Update target coordinates during mode morph or resize
const updateTargets = (width: number, height: number) => {
  // Margin horizontal minimal 38px (>= 36px) agar tidak menabrak tepi kanvas
  const horizontalPadding = Math.max(38, width * 0.065)
  const usableWidth = width - horizontalPadding * 2

  // Skala vertikal EWS proporsional
  // 100% kehadiran -> yTop = height * 0.18
  // 75% ambang kehadiran -> thresholdY = height * 0.74
  const yTop = height * 0.18
  const thresholdY = height * 0.74
  const yRange = thresholdY - yTop

  nodes.value.forEach(node => {
    if (currentMode.value === 'rps') {
      node.targetX = node.rpsNx * width
      node.targetY = node.rpsNy * height
    } else {
      // Posisi X terdistribusi proporsional P-1 s/d P-16 dengan margin aman
      const stepIndex = node.sessionNum - 1
      node.targetX = horizontalPadding + (stepIndex / 15) * usableWidth

      // Posisi Y proporsional terhadap persentase kehadiran
      const attendance = node.ewsAttendance
      if (attendance >= 75) {
        const ratio = (attendance - 75) / 25
        node.targetY = thresholdY - ratio * yRange
      } else {
        const critRatio = (75 - attendance) / 15
        node.targetY = thresholdY + critRatio * (height * 0.16)
      }
    }
  })
}

// Mode Switch Handler
const setMode = (mode: ViewMode) => {
  if (currentMode.value === mode) return
  currentMode.value = mode

  const wrapper = canvasWrapperRef.value
  if (wrapper) {
    const rect = wrapper.getBoundingClientRect()
    updateTargets(rect.width, rect.height)
  }

  // Reset pulse packets to adapt to new edges
  if (mode === 'rps') {
    packets.value = [
      { edgeIndex: 0, progress: 0.1, speed: 0.007, color: '#38BDF8' },
      { edgeIndex: 4, progress: 0.5, speed: 0.006, color: '#10B981' },
      { edgeIndex: 7, progress: 0.3, speed: 0.008, color: '#F59E0B' },
      { edgeIndex: 12, progress: 0.7, speed: 0.009, color: '#0D9488' },
      { edgeIndex: 15, progress: 0.4, speed: 0.006, color: '#818CF8' }
    ]
  } else {
    packets.value = [
      { edgeIndex: 2, progress: 0.1, speed: 0.012, color: '#16A34A' },
      { edgeIndex: 6, progress: 0.4, speed: 0.011, color: '#D97706' },
      { edgeIndex: 10, progress: 0.8, speed: 0.010, color: '#0D9488' }
    ]
  }
}

// Initialize nodes with scaled coordinates
const initNodes = (width: number, height: number) => {
  nodes.value = initialNodesData.map(item => {
    const targetX = (currentMode.value === 'rps' ? item.rpsNx : item.ewsNx) * width
    const targetY = (currentMode.value === 'rps' ? item.rpsNy : item.ewsNy) * height
    return {
      ...item,
      x: targetX,
      y: targetY,
      targetX,
      targetY,
      vx: 0,
      vy: 0
    }
  })

  setMode(currentMode.value)
}

// Click interaction to lock/unlock node
const handleCanvasClick = (e: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top

  let clickedNodeId: string | null = null
  for (const node of nodes.value) {
    const dx = clickX - node.x
    const dy = clickY - node.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist <= node.radius + 12) {
      clickedNodeId = node.id
      break
    }
  }

  if (clickedNodeId) {
    if (isLocked.value && lockedNodeId.value === clickedNodeId) {
      isLocked.value = false
      lockedNodeId.value = null
    } else {
      isLocked.value = true
      lockedNodeId.value = clickedNodeId
    }
  } else {
    isLocked.value = false
    lockedNodeId.value = null
  }
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

  // 1. Draw subtle coordinate grid
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)'
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

  // 1b. Mode EWS Special Guideline: Ambang Syarat UAS (≥75%)
  if (currentMode.value === 'ews') {
    const thresholdY = height * 0.74
    const horizontalPadding = Math.max(38, width * 0.065)

    ctx.save()

    // Shading Zona Kritis di bawah garis threshold
    const grad = ctx.createLinearGradient(0, thresholdY, 0, height)
    grad.addColorStop(0, 'rgba(217, 119, 6, 0.07)')
    grad.addColorStop(1, 'rgba(220, 38, 38, 0.02)')
    ctx.fillStyle = grad
    ctx.fillRect(0, thresholdY, width, height - thresholdY)

    // Dashed guideline 75%
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)' // Amber Alert
    ctx.lineWidth = 1.2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(horizontalPadding - 10, thresholdY)
    ctx.lineTo(width - horizontalPadding + 10, thresholdY)
    ctx.stroke()

    // Left Label: Zona Aman
    ctx.fillStyle = 'rgba(16, 185, 129, 0.75)'
    ctx.font = '9px JetBrains Mono, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('▲ ZONA AMAN PRESENSI', horizontalPadding, thresholdY + 5)

    // Right Label: Ambang Syarat UAS (≥ 75.0%) di bawah garis threshold agar tidak menabrak simpul/kurva
    ctx.fillStyle = '#D97706'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText('AMBANG SYARAT UAS (≥ 75.0%)', width - horizontalPadding, thresholdY + 5)

    ctx.restore()
  }

  // 2. Physics & Spring Movement towards Target & Mouse
  let closestDist = Infinity
  let closestId: string | null = null

  nodes.value.forEach(node => {
    // Spring physics towards target coordinate (enables smooth morph on mode change)
    const dxTarget = node.targetX - node.x
    const dyTarget = node.targetY - node.y
    node.vx += dxTarget * 0.045
    node.vy += dyTarget * 0.045

    // Mouse proximity interaction (elastic attraction)
    if (mouseActive) {
      const dxMouse = mouseX - node.x
      const dyMouse = mouseY - node.y
      const dist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse)

      if (dist < closestDist) {
        closestDist = dist
        closestId = node.id
      }

      if (dist < 100 && dist > 2) {
        const force = (100 - dist) / 100 * 0.2
        node.vx += (dxMouse / dist) * force
        node.vy += (dyMouse / dist) * force
      }
    }

    // Damping friction
    node.vx *= 0.78
    node.vy *= 0.78
    node.x += node.vx
    node.y += node.vy

    // Boundary Clamp inside Canvas
    node.x = Math.max(node.radius + 14, Math.min(width - node.radius - 14, node.x))
    node.y = Math.max(node.radius + 14, Math.min(height - node.radius - 16, node.y))
  })

  // Update hovered node if not locked
  if (!isLocked.value) {
    if (closestId && closestDist < 80) {
      hoveredNodeId.value = closestId
    } else {
      hoveredNodeId.value = null
    }
  }

  const nodeMap = new Map<string, SessionNode>()
  nodes.value.forEach(n => nodeMap.set(n.id, n))

  const activeEdges = currentEdges.value

  // 3. Draw Edges
  activeEdges.forEach(edge => {
    const fromNode = nodeMap.get(edge.from)
    const toNode = nodeMap.get(edge.to)
    if (!fromNode || !toNode) return

    const isConnectedToActive = fromNode.id === activeNodeId.value || toNode.id === activeNodeId.value

    ctx.save()
    if (edge.dashed) {
      ctx.setLineDash([3, 4])
    }

    if (isConnectedToActive) {
      ctx.strokeStyle = currentMode.value === 'ews' ? 'rgba(13, 148, 136, 0.9)' : 'rgba(13, 148, 136, 0.75)'
      ctx.lineWidth = 2
    } else {
      ctx.strokeStyle = currentMode.value === 'ews' ? 'rgba(45, 212, 191, 0.28)' : 'rgba(148, 163, 184, 0.2)'
      ctx.lineWidth = 1
    }

    ctx.beginPath()
    ctx.moveTo(fromNode.x, fromNode.y)
    ctx.lineTo(toNode.x, toNode.y)
    ctx.stroke()

    // Draw edge metric badge in RPS mode
    if (currentMode.value === 'rps') {
      const midX = (fromNode.x + toNode.x) / 2
      const midY = (fromNode.y + toNode.y) / 2
      ctx.fillStyle = isConnectedToActive ? '#0D9488' : 'rgba(148, 163, 184, 0.45)'
      ctx.font = '8px JetBrains Mono, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(edge.weight), midX, midY - 3)
    }

    ctx.restore()
  })

  // 4. Draw Animated Pulses (Algorithmic Packets)
  packets.value.forEach(pkt => {
    pkt.progress += pkt.speed
    if (pkt.progress >= 1) pkt.progress = 0

    const edge = activeEdges[pkt.edgeIndex]
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
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(mouseX - 10, mouseY)
    ctx.lineTo(mouseX + 10, mouseY)
    ctx.moveTo(mouseX, mouseY - 10)
    ctx.lineTo(mouseX, mouseY + 10)
    ctx.stroke()
    ctx.restore()
  }

  // 6. Draw Nodes with Guard Flip/Clamp for Bottom Labels
  nodes.value.forEach(node => {
    const isActive = node.id === activeNodeId.value

    ctx.save()

    // Outer glow ring if active
    if (isActive) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2)
      ctx.strokeStyle = node.badge === 'UTS' || node.badge === 'UAS' ? 'rgba(217, 119, 6, 0.6)' : 'rgba(13, 148, 136, 0.6)'
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

    // In EWS mode, node ring reflects attendance status
    let nodeStrokeColor = node.color
    if (currentMode.value === 'ews') {
      nodeStrokeColor = node.ewsStatus === 'SAFE' ? '#16A34A' : (node.ewsStatus === 'WARNING' ? '#D97706' : '#DC2626')
    }

    ctx.strokeStyle = isActive ? '#5EEAD4' : nodeStrokeColor
    ctx.lineWidth = node.badge === 'UTS' || node.badge === 'UAS' ? 2.4 : 1.8
    ctx.stroke()

    // Inner node core
    ctx.beginPath()
    ctx.arc(node.x, node.y, 2, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()

    // Node Label with Alternating Layout (EWS) and Guard Flip/Clamp
    const labelMargin = 5
    const labelHeight = 11

    ctx.font = isActive ? 'bold 9px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace'
    ctx.textAlign = 'center'

    let labelText = node.label
    let renderAbove = false

    if (currentMode.value === 'ews') {
      if (isActive) {
        // Tampilkan rincian nama algoritma & persentase kehadiran HANYA pada simpul aktif
        labelText = `${node.label} (${node.ewsAttendance}%)`
      } else {
        // Sederhanakan label default menjadi kode singkat P-1 s/d P-16
        labelText = `P-${node.sessionNum}`
      }

      // Selang-seling (atas-bawah): ganjil di atas, genap di bawah
      renderAbove = node.sessionNum % 2 !== 0
    } else {
      // Mode RPS: default di bawah
      renderAbove = false
    }

    // Guard Clamp: pastikan label tidak terpotong tepi atas atau bawah kanvas
    if (renderAbove) {
      if (node.y - node.radius - labelHeight - labelMargin < 6) {
        renderAbove = false
      }
    } else {
      if (node.y + node.radius + labelHeight + labelMargin > height - 6) {
        renderAbove = true
      }
    }

    const labelY = renderAbove
      ? node.y - node.radius - labelMargin
      : node.y + node.radius + labelMargin

    ctx.textBaseline = renderAbove ? 'bottom' : 'top'

    // Jika aktif di EWS mode (teks lebih panjang), berikan pill backdrop gelap agar kontras tinggi & tidak tertabrak garis
    if (currentMode.value === 'ews' && isActive) {
      const textWidth = ctx.measureText(labelText).width
      const bgPaddingX = 4
      const bgPaddingY = 2
      const bgX = node.x - textWidth / 2 - bgPaddingX
      const bgY = renderAbove
        ? labelY - labelHeight - bgPaddingY + 2
        : labelY - bgPaddingY

      ctx.fillStyle = 'rgba(11, 19, 43, 0.92)'
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.5)'
      ctx.lineWidth = 1
      ctx.fillRect(bgX, bgY, textWidth + bgPaddingX * 2, labelHeight + bgPaddingY * 2)
      ctx.strokeRect(bgX, bgY, textWidth + bgPaddingX * 2, labelHeight + bgPaddingY * 2)
    }

    ctx.fillStyle = isActive ? '#5EEAD4' : 'rgba(226, 232, 240, 0.85)'
    ctx.fillText(labelText, node.x, labelY)

    ctx.restore()
  })

  animationFrameId = requestAnimationFrame(render)
}

// Canvas Resizing directly measuring canvasWrapperRef (content box, dikurangi padding)
const resizeCanvas = () => {
  const wrapper = canvasWrapperRef.value
  const canvas = canvasRef.value
  if (!wrapper || !canvas) return

  const rect = wrapper.getBoundingClientRect()
  const styles = window.getComputedStyle(wrapper)
  const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0)
  const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0)

  // Kanvas diposisikan absolut di dalam padding box, jadi ukuran kanvas = content box wrapper.
  // Padding bawah ini menyisakan band kosong agar simpul terbawah tidak pernah menduduki area footer.
  // Lantai ukuran dibatasi agar kanvas tidak pernah melebihi content box (menyebabkan bleed ke footer).
  const width = Math.max(rect.width - padX, 240)
  const height = Math.max(rect.height - padY, 200)

  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }

  if (nodes.value.length === 0) {
    initNodes(width, height)
  } else {
    updateTargets(width, height)
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  // Jaga ukuran kanvas sinkron saat tinggi bar (mis. Inspector) berubah setelah mount
  if (canvasWrapperRef.value) {
    resizeObserver = new ResizeObserver(() => resizeCanvas())
    resizeObserver.observe(canvasWrapperRef.value)
  }
  animationFrameId = requestAnimationFrame(render)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  resizeObserver?.disconnect()
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div
    class="w-full min-h-[460px] sm:min-h-[480px] md:h-[510px] bg-[#0F172A] border border-slate-700/80 rounded-sm relative overflow-hidden flex flex-col justify-between shadow-lg select-none group"
  >
    <!-- Crosshair Corner Tokens (+) -->
    <span class="absolute -top-2.5 -left-2.5 text-teal-400/40 font-mono text-xs pointer-events-none">+</span>
    <span class="absolute -top-2.5 -right-2.5 text-teal-400/40 font-mono text-xs pointer-events-none">+</span>
    <span class="absolute -bottom-2.5 -left-2.5 text-teal-400/40 font-mono text-xs pointer-events-none">+</span>
    <span class="absolute -bottom-2.5 -right-2.5 text-teal-400/40 font-mono text-xs pointer-events-none">+</span>

    <!-- Top Scientific HUD Bar: Mode Switcher & Academic Metrics -->
    <div class="px-3.5 py-2.5 border-b border-slate-800 bg-[#0B132B]/90 backdrop-blur-xs flex items-center justify-between text-[11px] font-mono text-slate-400 relative z-10 gap-2 flex-wrap">
      <!-- Mode Switcher Buttons -->
      <div class="flex items-center gap-1.5 p-0.5 bg-slate-900/90 border border-slate-800 rounded-sm" role="tablist" aria-label="Mode visualisasi kanvas">
        <button
          type="button"
          role="tab"
          :aria-selected="currentMode === 'rps'"
          @click="setMode('rps')"
          class="px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold tracking-wider transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0D9488]"
          :class="currentMode === 'rps' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'"
        >
          TOPOLOGI RPS
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="currentMode === 'ews'"
          @click="setMode('ews')"
          class="px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold tracking-wider transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0D9488]"
          :class="currentMode === 'ews' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'"
        >
          TRAJEKTORI EWS
        </button>
      </div>

      <!-- Academic Context Metric -->
      <div class="flex items-center gap-2 text-[10px] font-mono">
        <span class="px-2 py-0.5 bg-slate-800/80 border border-slate-700 text-teal-300 rounded-sm font-semibold">
          BOBOT UAS: 30%
        </span>
        <span class="text-slate-400 hidden sm:inline">
          {{ currentMode === 'rps' ? '16 Sesi RPS Terstruktur' : 'Lintasan EWS & Ambang Kelulusan' }}
        </span>
      </div>
    </div>

    <!-- (1) Inspector Bar: Satu Baris Horizontal (Kiri: titik + badge | Tengah: topik | Kanan: metrik) -->
    <div
      v-if="activeNodeInfo"
      class="px-3.5 py-2.5 bg-[#090F1E] border-b border-slate-800/90 text-white font-mono text-[10px] relative z-10"
    >
      <div class="flex items-center gap-3 flex-nowrap">
        <!-- Kiri: Indikator titik warna + badge pertemuan -->
        <div class="flex items-center gap-2 shrink-0">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :class="activeNodeInfo.badge === 'UTS' || activeNodeInfo.badge === 'UAS' ? 'bg-[#D97706] ring-2 ring-amber-500/30' : 'bg-[#0D9488] ring-2 ring-teal-500/30'"
          ></span>
          <span
            class="px-1.5 py-0.5 rounded-sm border font-bold text-[10px] whitespace-nowrap"
            :class="{
              'bg-amber-950/70 border-amber-600/60 text-amber-300': activeNodeInfo.badge === 'UTS',
              'bg-sky-950/70 border-sky-600/60 text-sky-300': activeNodeInfo.badge === 'UAS',
              'bg-teal-950/70 border-teal-600/60 text-teal-300': activeNodeInfo.badge === 'MATERI',
              'bg-emerald-950/70 border-emerald-600/60 text-emerald-300': activeNodeInfo.badge === 'KUIS',
              'bg-indigo-950/70 border-indigo-600/60 text-indigo-300': activeNodeInfo.badge === 'TUGAS'
            }"
          >
            P-{{ activeNodeInfo.sessionNum }} • {{ activeNodeInfo.badge }}
          </span>
        </div>

        <!-- Tengah: Judul topik lengkap (tidak dipotong elipsis) -->
        <div class="flex-1 min-w-0 text-center">
          <span class="font-sans font-semibold text-[12px] text-slate-100 leading-snug">
            {{ activeNodeInfo.title }}
          </span>
        </div>

        <!-- Kanan: Metrik ringkas + gembok kecil saat simpul terkunci -->
        <div class="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <span class="text-teal-300 font-semibold text-[10px]">{{ metricLabel }}</span>
          <span class="text-slate-600">•</span>
          <span
            class="font-semibold text-[10px]"
            :class="activeNodeInfo.ewsAttendance >= 75 ? 'text-emerald-400' : 'text-amber-400'"
          >
            {{ activeNodeInfo.ewsAttendance }}% Hadir
          </span>
          <svg
            v-if="isLocked"
            class="w-3 h-3 text-amber-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="Simpul terkunci"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Canvas Simulation Area: 100% Bebas Halangan (No floating popup box inside) -->
    <div ref="canvasWrapperRef" class="flex-1 relative w-full h-full min-h-[280px] bg-[#0F172A] pb-6">
      <canvas
        ref="canvasRef"
        @click="handleCanvasClick"
        class="absolute inset-0 cursor-crosshair w-full h-full"
      ></canvas>
    </div>

    <!-- Bottom Status Strip: Satu Baris Bersih -->
    <div class="px-3.5 py-2 border-t border-slate-800 bg-[#0B132B] flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 relative z-10">
      <span class="text-slate-300 whitespace-nowrap">
        16 Pertemuan • UTS P-8 • UAS P-16
      </span>
      <span class="text-amber-400 font-bold whitespace-nowrap shrink-0">
        Ambang UAS ≥ 75%
      </span>
    </div>
  </div>
</template>
