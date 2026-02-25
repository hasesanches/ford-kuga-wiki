<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  connected: boolean
  supportedPids: { pid: number; name: string }[]
}>()

const emit = defineEmits([
  'connect',
  'disconnect',
  'detect-pids',
  'start-polling'
])

const url = ref('ws://192.168.4.1:81')
const baud = ref(500)
const mode = ref<'ws' | 'emulator'>('emulator')

const selectedPid = ref<number | null>(null)

function onConnect() {
  emit('connect', url.value, baud.value, mode.value)
}

function onDetect() {
  emit('detect-pids')
}

function onStartPolling() {
  if (selectedPid.value !== null) {
    emit('start-polling', selectedPid.value)
  }
}
</script>

<template>
  <div class="connection-panel">

    <select v-model="mode">
      <option value="emulator">Emulator</option>
      <option value="ws">WebSocket</option>
    </select>

    <input
        v-if="mode === 'ws'"
        v-model="url"
        placeholder="ws://192.168.4.1:81"
    />

    <select v-model="baud">
      <option :value="125">125 kbps</option>
      <option :value="250">250 kbps</option>
      <option :value="500">500 kbps</option>
      <option :value="1000">1000 kbps</option>
    </select>

    <button v-if="!connected" @click="onConnect">
      Connect
    </button>

    <button v-else @click="$emit('disconnect')">
      Disconnect
    </button>

    <!-- OBD2 -->

    <button
        v-if="connected"
        @click="onDetect"
    >
      Auto Detect PID
    </button>

    <select
        v-if="supportedPids.length"
        v-model="selectedPid"
    >
      <option
          v-for="p in supportedPids"
          :key="p.pid"
          :value="p.pid"
      >
        {{ p.name }} (0x{{ p.pid.toString(16).toUpperCase() }})
      </option>
    </select>

    <button
        v-if="selectedPid !== null"
        @click="onStartPolling"
    >
      Start PID
    </button>

  </div>
</template>

<style scoped>
.connection-panel {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
