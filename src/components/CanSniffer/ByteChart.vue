<script setup lang="ts">
import { onMounted, watch, ref, type Ref } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip
} from 'chart.js'

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Tooltip
)

/* ============================================
   TYPES
============================================ */

type HistoryPoint = {
  ts: number
  value: number
}

/* ============================================
   PROPS (FIXED FOR REF)
============================================ */

const props = defineProps<{
  selectedFrameCounter: Ref<number>
  history: Ref<HistoryPoint[]>
  reference?: Ref<number[]>
}>()

/* ============================================
   CHART
============================================ */

const canvas = ref<HTMLCanvasElement | null>(null)
const WINDOW_SIZE = 50
let chart: Chart | null = null

onMounted(() => {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')!

  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, 'rgba(33, 150, 243, 0.6)')
  gradient.addColorStop(1, 'rgba(33, 150, 243, 0.05)')

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: WINDOW_SIZE }, (_, i) => i - WINDOW_SIZE + 1),
      datasets: [
        {
          label: 'CAN Value',
          data: Array(WINDOW_SIZE).fill(0),
          borderColor: '#2196f3',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.2,
          pointRadius: 0
        },
        {
          label: 'Reference',
          data: Array(WINDOW_SIZE).fill(0),
          borderColor: '#FF9800',
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          pointRadius: 0,
          borderDash: [6, 4]
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { maxRotation: 0, minRotation: 0 },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      },
      plugins: {
        legend: { display: true, labels: { color: '#fff' } },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              const idx = tooltipItem.dataIndex
              const value = tooltipItem.dataset.data[idx]
              const refVal =
                  chart?.data.datasets[1].data[idx] ?? '-'
              return `CAN: ${value}, Ref: ${refVal}`
            }
          }
        }
      }
    }
  })
})

/* ============================================
   UPDATE GRAPH
============================================ */

function updateChart() {
  if (!chart) return

  const history = props.history.value
  const counter = props.selectedFrameCounter.value
  const reference = props.reference?.value ?? []

  if (history.length === 0) {
    chart.data.datasets[0].data = Array(WINDOW_SIZE).fill(0)
    chart.data.datasets[1].data = Array(WINDOW_SIZE).fill(0)
    chart.data.labels = Array.from(
        { length: WINDOW_SIZE },
        (_, i) => i - WINDOW_SIZE + 1
    )

    chart.options.scales!.y!.min = 0
    chart.options.scales!.y!.max = 1

    chart.update()
    return
  }

  const latestData = history.slice(-WINDOW_SIZE)
  const values = latestData.map(h => h.value)

  const missing = WINDOW_SIZE - values.length
  const paddedValues = [...Array(missing).fill(0), ...values]

  const refValues = reference.slice(-WINDOW_SIZE)
  const paddedRef = [...Array(missing).fill(0), ...refValues]

  const labels = Array.from({ length: WINDOW_SIZE }, (_, i) =>
      counter - paddedValues.length + i + 1
  )

  chart.data.datasets[0].data = paddedValues
  chart.data.datasets[1].data = paddedRef
  chart.data.labels = labels

  const min = Math.min(...paddedValues.concat(paddedRef))
  const max = Math.max(...paddedValues.concat(paddedRef))
  const padding = (max - min) * 0.1 || 1

  chart.options.scales!.y!.min = min - padding
  chart.options.scales!.y!.max = max + padding

  chart.update()
}

/* ============================================
   WATCH
============================================ */

watch(
    () => [
      props.history.value.length,
      props.selectedFrameCounter.value
    ],
    updateChart
)
</script>


<template>
  <div class="byte-chart">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<style scoped>
.byte-chart {
  height: 300px;
  width: 100%;
  background: #111;
  padding: 10px;
  border-radius: 8px;
  box-sizing: border-box;
}
</style>
