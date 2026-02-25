<script setup lang="ts">
import { ref, watch, type Ref } from 'vue'
import type { CanFrame } from '@/pages/CanSniffer.vue'

/* ============================================
   TYPES
============================================ */

type ByteSelection = {
  id: number
  indexes: number[]
}

/* ============================================
   PROPS (FIXED FOR REF)
============================================ */

const props = defineProps<{
  frame: CanFrame
  previous?: number[]
  selected: Ref<ByteSelection | null>
  referenceSelected: Ref<ByteSelection | null>
}>()

const emit = defineEmits<{
  (e: 'toggle-byte', payload: { id: number; index: number }): void
  (e: 'toggle-reference', payload: { id: number; index: number }): void
}>()

/* ============================================
   CHANGE FLAGS
============================================ */

const changedFlags = ref<boolean[]>(Array(8).fill(false))
const everChanged = ref<boolean[]>(Array(8).fill(false))

watch(
    () => props.frame.data,
    (newData) => {
      newData.forEach((v, i) => {
        const prev = props.previous?.[i]

        if (prev !== undefined && prev !== v) {
          changedFlags.value[i] = true
          everChanged.value[i] = true
          setTimeout(() => (changedFlags.value[i] = false), 800)
        }
      })
    }
)

/* ============================================
   HELPERS
============================================ */

function hex(v: number) {
  return '0x' + v.toString(16).padStart(2, '0').toUpperCase()
}

function neverChanged(index: number) {
  return !everChanged.value[index]
}

function cellClass(index: number) {
  const selected = props.selected.value
  const reference = props.referenceSelected.value

  const isMain =
      selected &&
      selected.id === props.frame.id &&
      selected.indexes.includes(index)

  const isRef =
      reference &&
      reference.id === props.frame.id &&
      reference.indexes.includes(index)

  return {
    selected: isMain,
    reference: isRef,
    changed: changedFlags.value[index],
    neverchanged: neverChanged(index)
  }
}
</script>


<template>
  <tr>
    <td class="frame-id">{{ frame.id.toString(16).toUpperCase() }}</td>
    <td class="dlc">{{ frame.dlc }}</td>

    <td
        v-for="i in 8"
        :key="i"
        class="byte"
        :class="cellClass(i-1)"
        @click="emit('toggle-byte', { id: frame.id, index: i-1 })"
        @contextmenu.prevent="emit('toggle-reference', { id: frame.id, index: i-1 })"
    >
      <div v-if="i-1 < frame.dlc">
        <div class="hex">{{ hex(frame.data[i-1]) }}</div>
        <div class="dec">{{ frame.data[i-1] }}</div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.byte {
  width: 10%;
  cursor: pointer;
  text-align: center;
  font-family: "Roboto Mono", monospace;
  transition: background 0.5s, color 0.5s;
  padding: 2px;
}

.byte > div {
  padding: 4px;
  background: #606060; /* зелёный */
  color: white;
  transition: background 0.5s, color 0.5s;
}

.byte.changed > div {
  background: #ff4c4c; /* ярко-красный */
}

.byte.neverchanged > div {
  background: #232323; /* зелёный */
}

.byte.selected {
  background: #2196f3; /* синий */
}

.byte.reference {
  background: #f5fa3e;
}

.hex {
  font-weight: bold;
}

.dec {
  font-size: 10px;
  opacity: 0.8;
}

.frame-id {
  text-align: center;
  font-weight: bold;
  color: #fff;
}

.dlc {
  text-align: center;
  color: #aaa;
}

</style>
