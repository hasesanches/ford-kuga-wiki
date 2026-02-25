<script setup lang="ts">
import { ref } from 'vue'
import ConnectionPanel from '@/components/CanSniffer/ConnectionPanel.vue'
import CanTable from '@/components/CanSniffer/CanTable.vue'
import ByteChart from '@/components/CanSniffer/ByteChart.vue'
import { createCanEmulator } from '@/services/canEmulator'
import emulatePidSupport, { emulateOBDResponse, parseSupportedPIDs } from '@/services/obd2Parser'
import { PID_MAP } from '@/services/obd2Parser'

/* ============================================
   TYPES
============================================ */

export interface CanFrame {
  ts: number
  id: number
  dlc: number
  data: number[]
  source: 'A' | 'B'
}

/* ============================================
   GLOBAL
============================================ */

let emulator: ReturnType<typeof createCanEmulator> | null = null
let pollingInterval: any = null

const mode = ref<'ws' | 'emulator'>('emulator')
const socket = ref<WebSocket | null>(null)
const connected = ref(false)

const supportedPids = ref<{ pid: number; name: string }[]>([])

/* ============================================
   STATE FOR 2 DIRECTIONS
============================================ */

function createDirectionState() {
  return {
    frames: ref<Map<number, CanFrame>>(new Map()),
    previous: new Map<number, number[]>(),

    selected: ref<{ id: number; indexes: number[] } | null>(null),
    history: ref<{ ts: number; value: number }[]>([]),
    selectedFrameCounter: ref(0),

    referenceSelected: ref<{ id: number; indexes: number[] } | null>(null),
    referenceHistory: ref<number[]>([])
  }
}

const directionA = createDirectionState()
const directionB = createDirectionState()

function getDirectionState(source: 'A' | 'B') {
  return source === 'A' ? directionA : directionB
}

/* ============================================
   BYTE SELECT
============================================ */

function toggleByte(payload: { id: number; index: number; source: 'A' | 'B' }) {
  const dir = getDirectionState(payload.source)

  if (!dir.selected.value || dir.selected.value.id !== payload.id) {
    dir.selected.value = {
      id: payload.id,
      indexes: [payload.index]
    }
    dir.history.value = []
    dir.selectedFrameCounter.value = 0
    return
  }

  const idx = dir.selected.value.indexes.indexOf(payload.index)

  if (idx === -1) {
    dir.selected.value.indexes.push(payload.index)
  } else {
    dir.selected.value.indexes.splice(idx, 1)
  }

  dir.history.value = []
  dir.selectedFrameCounter.value = 0
}

/* ============================================
   REFERENCE SELECT
============================================ */

function toggleReference(payload: { id: number; index: number; source: 'A' | 'B' }) {
  const dir = getDirectionState(payload.source)

  if (!dir.referenceSelected.value || dir.referenceSelected.value.id !== payload.id) {
    dir.referenceSelected.value = {
      id: payload.id,
      indexes: [payload.index]
    }
    dir.referenceHistory.value = []
    return
  }

  const idx = dir.referenceSelected.value.indexes.indexOf(payload.index)

  if (idx === -1) {
    dir.referenceSelected.value.indexes.push(payload.index)
  } else {
    dir.referenceSelected.value.indexes.splice(idx, 1)
  }

  dir.referenceHistory.value = []
}

/* ============================================
   VALUE BUILDER
============================================ */

function buildCombinedValue(data: number[], indexes: number[]) {
  const sorted = [...indexes].sort((a, b) => a - b)

  let result = 0
  for (let i = 0; i < sorted.length; i++) {
    result = (result << 8) | data[sorted[i]]
  }

  return result
}

/* ============================================
   FRAME PROCESSING
============================================ */

function processFrame(frame: CanFrame) {
  const dir = getDirectionState(frame.source)

  // ---- PID DETECTION ----
  if (frame.id >= 0x7E8 && frame.id <= 0x7EF) {
    if (
        frame.data[1] === 0x41 &&
        [0x00, 0x20, 0x40, 0x60].includes(frame.data[2])
    ) {
      const start = frame.data[2]
      const detected = parseSupportedPIDs(frame.data, start)
      const existing = new Set(supportedPids.value.map(p => p.pid))

      const valid = detected
          .filter(pid => PID_MAP[pid] && !existing.has(pid))
          .map(pid => ({
            pid,
            name: PID_MAP[pid].name
          }))

      supportedPids.value = [
        ...supportedPids.value,
        ...valid
      ]
    }
  }

  // ---- FRAME STORAGE ----
  dir.previous.set(frame.id, dir.frames.value.get(frame.id)?.data || [])
  dir.frames.value.set(frame.id, frame)

  // ---- MAIN GRAPH ----
  if (
      dir.selected.value &&
      dir.selected.value.id === frame.id &&
      dir.selected.value.indexes.length
  ) {
    const value = buildCombinedValue(frame.data, dir.selected.value.indexes)

    dir.history.value = [
      ...dir.history.value,
      { ts: frame.ts, value }
    ].slice(-50)

    dir.selectedFrameCounter.value++
  }

  // ---- REFERENCE ----
  if (
      dir.referenceSelected.value &&
      dir.referenceSelected.value.id === frame.id &&
      dir.referenceSelected.value.indexes.length
  ) {
    const refValue = buildCombinedValue(
        frame.data,
        dir.referenceSelected.value.indexes
    )

    dir.referenceHistory.value = [
      ...dir.referenceHistory.value,
      refValue
    ].slice(-50)
  }
}

/* ============================================
   CONNECTION
============================================ */

function connectWS(url: string, baud: number) {
  socket.value = new WebSocket(url)

  socket.value.onopen = () => {
    connected.value = true
    socket.value?.send(JSON.stringify({ type: 'set_baud', value: baud }))
    socket.value?.send(JSON.stringify({ type: 'start' }))
  }

  socket.value.onmessage = (event) => {
    processFrame(JSON.parse(event.data))
  }

  socket.value.onclose = () => {
    connected.value = false
  }
}

function startEmulator() {
  connected.value = true
  emulator = createCanEmulator(processFrame)
  emulator.start()
}

function stopEmulator() {
  emulator?.stop()
  emulator = null
  connected.value = false
  clearInterval(pollingInterval)
}

function connect(url: string, baud: number, selectedMode: 'ws' | 'emulator') {
  mode.value = selectedMode

  if (selectedMode === 'ws') {
    connectWS(url, baud)
  } else {
    startEmulator()
  }
}

function disconnect() {
  if (mode.value === 'ws') {
    socket.value?.close()
  } else {
    stopEmulator()
  }
}

/* ============================================
   PID POLLING
============================================ */

function startPidPolling(pid: number) {
  clearInterval(pollingInterval)

  directionA.history.value = []
  directionB.history.value = []

  pollingInterval = setInterval(() => {
    if (mode.value === 'emulator') {
      const fakeFrame = emulateOBDResponse(pid)
      if (fakeFrame) processFrame(fakeFrame)
    } else {
      socket.value?.send(JSON.stringify({
        id: 0x7E0,
        dlc: 8,
        data: [0x02, 0x01, pid, 0, 0, 0, 0, 0]
      }))
    }
  }, 200)
}

function detectPids() {
  supportedPids.value = []

  const blocks = [0x00, 0x20, 0x40, 0x60]

  blocks.forEach(block => {
    if (mode.value === 'emulator') {
      const fake = emulatePidSupport(block)
      if (fake) processFrame(fake)
    } else {
      socket.value?.send(JSON.stringify({
        id: 0x7E0,
        dlc: 8,
        data: [0x02, 0x01, block, 0, 0, 0, 0, 0]
      }))
    }
  })
}
</script>

<template>
  <div class="can-sniffer">

    <ConnectionPanel
        :connected="connected"
        :supportedPids="supportedPids"
        @connect="connect"
        @disconnect="disconnect"
        @detect-pids="detectPids"
        @start-polling="startPidPolling"
    />

    <!-- ================= A ================= -->
    <h3>Direction A</h3>

    <CanTable
        :frames="directionA.frames"
        :previous="directionA.previous"
        :selected="directionA.selected"
        :referenceSelected="directionA.referenceSelected"
        @toggle-byte="(p) => toggleByte({ ...p, source: 'A' })"
        @toggle-reference="(p) => toggleReference({ ...p, source: 'A' })"
    />

    <ByteChart
        v-if="directionA.selected"
        :history="directionA.history"
        :reference="directionA.referenceHistory"
        :selectedFrameCounter="directionA.selectedFrameCounter"
    />

    <!-- ================= B ================= -->
    <h3>Direction B</h3>

    <CanTable
        :frames="directionB.frames"
        :previous="directionB.previous"
        :selected="directionB.selected"
        :referenceSelected="directionB.referenceSelected"
        @toggle-byte="(p) => toggleByte({ ...p, source: 'B' })"
        @toggle-reference="(p) => toggleReference({ ...p, source: 'B' })"
    />

    <ByteChart
        v-if="directionB.selected"
        :history="directionB.history"
        :reference="directionB.referenceHistory"
        :selectedFrameCounter="directionB.selectedFrameCounter"
    />

  </div>
</template>

<style scoped>
.can-sniffer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
