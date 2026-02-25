import {CanFrame} from "@/pages/CanSniffer.vue";

export function createCanEmulator(
    onFrame: (frame: CanFrame) => void
) {
  let interval: any = null

  // состояние автомобиля
  let speed = 0
  let rpm = 2000
  let temperature = 20
  let accel = 0.5
  let direction = 1
  let statusByte = 0

  function start() {
    if (interval) return

    interval = setInterval(() => {
      const now = Date.now()

      /* 🚗 SPEED 0x200 */

      speed += accel * direction

      if (speed > 160) direction = -1
      if (speed < 0) direction = 1

      speed = Math.max(0, Math.min(180, speed))

      const speedRaw = Math.floor(speed * 100)

      onFrame({
        ts: now,
        id: 0x200,
        dlc: 8,
        data: [
          speedRaw & 0xff,
          (speedRaw >> 8) & 0xff,
          0, 0, 0, 0, 0, 0
        ],
        source: 'A'
      })

      /* 🔄 RPM 0x201 */

      rpm = 800 + speed * 25 + Math.sin(now / 200) * 50
      rpm = Math.min(4500, rpm)

      const rpmRaw = Math.floor(rpm)

      onFrame({
        ts: now,
        id: 0x201,
        dlc: 8,
        data: [
          rpmRaw & 0xff,
          (rpmRaw >> 8) & 0xff,
          0, 0, 0, 0, 0, 0
        ],
        source: 'A'
      })

      /* 🌡 TEMP 0x350 */

      if (temperature < 95) {
        temperature += 0.02
      }

      onFrame({
        ts: now,
        id: 0x350,
        dlc: 8,
        data: [
          Math.floor(temperature),
          0, 0, 0, 0, 0, 0, 0
        ],
        source: 'B'
      })

      /* 🚪 STATUS 0x420 */

      if (Math.random() < 0.05) {
        const bit = Math.floor(Math.random() * 8)
        statusByte ^= (1 << bit)
      }

      onFrame({
        ts: now,
        id: 0x420,
        dlc: 8,
        data: [
          statusByte,
          0, 0, 0, 0, 0, 0, 0
        ],
        source: 'B'
      })

      // /* 🔧 UDS 0x7E8 */
      //
      // if (Math.random() < 0.02) {
      //   onFrame({
      //     ts: now,
      //     id: 0x7e8,
      //     dlc: 8,
      //     data: [0x03, 0x41, 0x0c, 0x1a, 0xf8, 0, 0, 0]
      //   })
      // }

    }, 200)
  }

  function stop() {
    if (!interval) return
    clearInterval(interval)
    interval = null
  }

  return {
    start,
    stop
  }
}
