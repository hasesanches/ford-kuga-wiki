// obd2Parser.ts

import {CanFrame} from "@/pages/CanSniffer.vue";

export type OBDResult = {
    pid: number
    name: string
    value: number
    unit: string
}

export interface PIDDefinition {
    name: string
    unit: string
    bytes: number
    parse: (A?: number, B?: number, C?: number, D?: number) => number
}

export const PID_MAP: Record<number, PIDDefinition> = {
    0x04: {
        name: 'Engine Load / Нагрузка двигателя',
        unit: '%',
        bytes: 1,
        parse: (A) => (A! * 100) / 255
    },

    0x05: {
        name: 'Coolant Temperature / Температура ОЖ',
        unit: '°C',
        bytes: 1,
        parse: (A) => A! - 40
    },

    0x06: {
        name: 'Short Term Fuel Trim B1 / Краткосрочная коррекция топлива B1',
        unit: '%',
        bytes: 1,
        parse: (A) => ((A! - 128) * 100) / 128
    },

    0x07: {
        name: 'Long Term Fuel Trim B1 / Долгосрочная коррекция топлива B1',
        unit: '%',
        bytes: 1,
        parse: (A) => ((A! - 128) * 100) / 128
    },

    0x0A: {
        name: 'Fuel Pressure / Давление топлива',
        unit: 'kPa',
        bytes: 1,
        parse: (A) => A! * 3
    },

    0x0B: {
        name: 'Intake Manifold Pressure / Давление во впуске',
        unit: 'kPa',
        bytes: 1,
        parse: (A) => A!
    },

    0x0C: {
        name: 'Engine RPM / Обороты двигателя',
        unit: 'rpm',
        bytes: 2,
        parse: (A, B) => (((A! << 8) | B!) / 4)
    },

    0x0D: {
        name: 'Vehicle Speed / Скорость автомобиля',
        unit: 'km/h',
        bytes: 1,
        parse: (A) => A!
    },

    0x0F: {
        name: 'Intake Air Temperature / Температура впуска',
        unit: '°C',
        bytes: 1,
        parse: (A) => A! - 40
    },

    0x10: {
        name: 'MAF Air Flow / Расход воздуха MAF',
        unit: 'g/s',
        bytes: 2,
        parse: (A, B) => (((A! << 8) | B!) / 100)
    },

    0x11: {
        name: 'Throttle Position / Положение дросселя',
        unit: '%',
        bytes: 1,
        parse: (A) => (A! * 100) / 255
    },

    0x1F: {
        name: 'Run Time Since Start / Время работы двигателя',
        unit: 'sec',
        bytes: 2,
        parse: (A, B) => ((A! << 8) | B!)
    },

    0x21: {
        name: 'Distance With MIL / Пробег с MIL',
        unit: 'km',
        bytes: 2,
        parse: (A, B) => ((A! << 8) | B!)
    },

    0x2F: {
        name: 'Fuel Level / Уровень топлива',
        unit: '%',
        bytes: 1,
        parse: (A) => (A! * 100) / 255
    },

    0x31: {
        name: 'Distance Since Clear / Пробег после сброса',
        unit: 'km',
        bytes: 2,
        parse: (A, B) => ((A! << 8) | B!)
    },

    0x33: {
        name: 'Barometric Pressure / Атмосферное давление',
        unit: 'kPa',
        bytes: 1,
        parse: (A) => A!
    },

    0x3C: {
        name: 'Catalyst Temp B1S1 / Температура катализатора B1S1',
        unit: '°C',
        bytes: 2,
        parse: (A, B) => (((A! << 8) | B!) / 10) - 40
    },

    0x42: {
        name: 'Control Module Voltage / Напряжение ЭБУ',
        unit: 'V',
        bytes: 2,
        parse: (A, B) => (((A! << 8) | B!) / 1000)
    },

    0x44: {
        name: 'Commanded Equivalence Ratio / Лямбда (командная)',
        unit: 'λ',
        bytes: 2,
        parse: (A, B) => (((A! << 8) | B!) / 32768)
    },

    0x46: {
        name: 'Ambient Air Temp / Температура окружающей среды',
        unit: '°C',
        bytes: 1,
        parse: (A) => A! - 40
    },

    0x4C: {
        name: 'Commanded Throttle Actuator / Команда дросселя',
        unit: '%',
        bytes: 1,
        parse: (A) => (A! * 100) / 255
    },

    0x52: {
        name: 'Ethanol Fuel % / Процент этанола',
        unit: '%',
        bytes: 1,
        parse: (A) => (A! * 100) / 255
    },

    0x5E: {
        name: 'Engine Fuel Rate / Расход топлива',
        unit: 'L/h',
        bytes: 2,
        parse: (A, B) => (((A! << 8) | B!) / 20)
    }
}

export function parseOBDFrame(frame: {
    id: number
    data: number[]
}): OBDResult | null {

    if (frame.id < 0x7E8 || frame.id > 0x7EF) return null
    if (frame.data[1] !== 0x41) return null

    const pid = frame.data[2]
    const def = PID_MAP[pid]
    if (!def) return null

    const A = frame.data[3]
    const B = frame.data[4]
    const C = frame.data[5]
    const D = frame.data[6]

    const value = def.parse(A, B, C, D)

    return {
        pid,
        name: def.name,
        value,
        unit: def.unit
    }
}

export function parseSupportedPIDs(data: number[], startPID: number): number[] {
    const supported: number[] = []

    const bytes = data.slice(3, 7) // 4 байта битовой маски

    for (let i = 0; i < 4; i++) {
        for (let bit = 0; bit < 8; bit++) {
            if (bytes[i] & (1 << (7 - bit))) {
                supported.push(startPID + (i * 8) + bit + 1)
            }
        }
    }

    return supported
}

export function emulateOBDResponse(pid: number): CanFrame | null {
    let value = 0

    switch (pid) {
        case 0x0C: { // RPM
            value = 800 + Math.sin(Date.now() / 300) * 2000
            value = Math.max(700, value)

            const rpmRaw = Math.floor(value * 4)

            return {
                ts: Date.now(),
                id: 0x7E8,
                dlc: 8,
                data: [
                    0x04,
                    0x41,
                    0x0C,
                    (rpmRaw >> 8) & 0xff,
                    rpmRaw & 0xff,
                    0,
                    0,
                    0
                ]
            }
        }

        case 0x0D: { // Speed
            const speed = Math.floor(Math.abs(Math.sin(Date.now() / 1000)) * 120)

            return {
                ts: Date.now(),
                id: 0x7E8,
                dlc: 8,
                data: [0x03, 0x41, 0x0D, speed, 0, 0, 0, 0]
            }
        }

        default:
            return null
    }
}

function emulatePidSupport(block: number): CanFrame {
    const supportedPids = [
        0x0C,
        0x0D,
    ]

    let mask = 0

    supportedPids.forEach(pid => {
        if (pid >= block + 1 && pid <= block + 32) {
            const offset = pid - (block + 1)
            const bitIndex = 31 - offset
            mask |= (1 << bitIndex)
        }
    })

    return {
        ts: Date.now(),
        id: 0x7E8,
        dlc: 8,
        data: [
            0x06,
            0x41,
            block,
            (mask >> 24) & 0xff,
            (mask >> 16) & 0xff,
            (mask >> 8) & 0xff,
            mask & 0xff,
            0
        ]
    }
}


export default emulatePidSupport


