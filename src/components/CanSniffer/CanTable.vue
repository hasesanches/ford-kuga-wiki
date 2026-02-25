<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue'
import CanRow from './CanRow.vue'
import type { CanFrame } from '@/pages/CanSniffer.vue'

/* ============================================
   TYPES
============================================ */

type ByteSelection = {
  id: number
  indexes: number[]
}

/* ============================================
   PROPS
============================================ */

const props = defineProps<{
  frames: Ref<Map<number, CanFrame>>
  previous: Map<number, number[]>
  selected: Ref<ByteSelection | null>
  referenceSelected: Ref<ByteSelection | null>
}>()

const emit = defineEmits<{
  (e: 'toggle-byte', payload: { id: number; index: number }): void
  (e: 'toggle-reference', payload: { id: number; index: number }): void
}>()

/* ============================================
   FORMULA
============================================ */

const formula = ref('x')

/* ============================================
   SORTED FRAMES
============================================ */

const sortedFrames = computed(() =>
    Array.from(props.frames.value.values()).sort((a, b) => a.id - b.id)
)

/* ============================================
   COMBINE VALUE
============================================ */

function combine(selection: ByteSelection | null) {
  if (!selection) return null

  const frame = props.frames.value.get(selection.id)
  if (!frame) return null

  const sortedIndexes = [...selection.indexes].sort((a, b) => a - b)

  let result = 0
  for (const i of sortedIndexes) {
    result = (result << 8) | frame.data[i]
  }

  return result
}

const selectedValue = computed(() =>
    combine(props.selected.value)
)

const referenceValue = computed(() =>
    combine(props.referenceSelected.value)
)

/* ============================================
   SAFE COMPUTE
============================================ */

function safeCompute(x: number): number | null {
  try {
    const expression = formula.value
        .replace(/[^-()\d/*+.x ]/g, '')
        .replace(/x/g, String(x))

    return Function(`"use strict"; return (${expression})`)()
  } catch {
    return null
  }
}

const transformedValue = computed(() => {
  if (selectedValue.value === null) return null
  return safeCompute(selectedValue.value)
})

const delta = computed(() => {
  if (
      transformedValue.value === null ||
      referenceValue.value === null
  ) {
    return null
  }

  return transformedValue.value - referenceValue.value
})

const percentDiff = computed(() => {
  if (
      transformedValue.value === null ||
      referenceValue.value === null
  ) {
    return null
  }

  if (referenceValue.value === 0) return null

  return (transformedValue.value / referenceValue.value) * 100
})

/* ============================================
   RESET FORMULA ON ID CHANGE
============================================ */

watch(
    () => props.selected.value?.id,
    () => {
      formula.value = 'x'
    }
)
</script>



<template>
  <div class="can-table-wrapper">
    <table class="can-table">
      <thead>
      <tr>
        <th>ID</th>
        <th>DLC</th>
        <th v-for="i in 8" :key="i">B{{ i-1 }}</th>
      </tr>
      </thead>
      <tbody>
      <CanRow
          v-for="frame in sortedFrames"
          :key="frame.id"
          :frame="frame"
          :previous="previous.get(frame.id)"
          :selected="selected"
          :referenceSelected="referenceSelected"
          @toggle-byte="emit('toggle-byte', $event)"
          @toggle-reference="emit('toggle-reference', $event)"
      />
      </tbody>
    </table>

    <div
        v-if="selectedValue !== null || referenceValue !== null"
        class="combined-value"
    >
      <!-- Selected -->
      <div class="block">
        <div class="title main">Selected (Raw)</div>
        <div class="block-data" v-if="selectedValue !== null">
          <div>HEX: 0x{{ selectedValue.toString(16).toUpperCase() }}</div>
          <div>DEC: {{ selectedValue }}</div>
        </div>
      </div>

      <!-- Transform -->
      <div class="block transform" v-if="selectedValue !== null">
        <div class="title transform-title">Transform</div>

        <input
            v-model="formula"
            placeholder="x*(0.1-40)"
        />

        <div v-if="transformedValue !== null" class="transformed">
          = {{ transformedValue }}
        </div>
        <div v-else class="error">
          Invalid expression
        </div>
      </div>

      <!-- Reference -->
      <div class="block">
        <div class="title reference">Reference</div>
        <div class="block-data" v-if="referenceValue !== null">
          <div>HEX: 0x{{ referenceValue.toString(16).toUpperCase() }}</div>
          <div>DEC: {{ referenceValue }}</div>
        </div>
      </div>

      <!-- Difference -->
      <div class="block">
        <div class="title diff">Difference</div>
        <div class="block-data" v-if="delta !== null && percentDiff !== null">
          <div>Δ: {{ delta }}</div>
          <div>{{ percentDiff.toFixed(2) }} %</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.can-table-wrapper {
  box-sizing: border-box; 
  width: 100%;
  overflow-x: auto;
  background: #111;
  padding: 10px;
  border-radius: 8px;
  color: #fff;
}

.can-table {
  width: 100%;
  border-collapse: collapse;
}

.can-table th {
  color: #ccc;
  padding: 6px;
  text-align: center;
  border-bottom: 1px solid #333;
}

.can-table td {
  border: 1px solid #222;
  padding: 4px;
}

.combined-value {
  margin-top: 20px;
  display: flex;
  gap: 25px;
  justify-content: center;
  flex-wrap: wrap;
}

.block {
  background: #1b1b1b;
  padding: 14px;
  border-radius: 8px;
  min-width: 200px;
  text-align: center;
}

.block-data {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 15px;
}

.title {
  font-weight: bold;
  margin-bottom: 8px;
}

.title.main { color: #2196f3; }
.title.reference { color: #ff5722; }
.title.diff { color: #4caf50; }
.title.transform-title { color: #ffcc00; }

.transform input {
  width: 120px;
  background: #222;
  border: 1px solid #333;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  text-align: center;
}

.transformed {
  margin-top: 4px;
  font-weight: bold;
  color: #4caf50;
}

.error {
  margin-top: 8px;
  color: #f44336;
}
</style>

