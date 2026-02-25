import { tuningConfig } from './tuning'
import { partsConfig } from './parts'
import { repairConfig } from './repair'
import { softwareConfig } from './software'
import { manualsConfig } from "@/configs/manuals";
import { mapConfig } from "@/configs/map";

import type { PageConfig } from '@/engine/types'

export const pageConfigs: Record<string, PageConfig> = {
    tuning: tuningConfig,
    software: softwareConfig,
    parts: partsConfig,
    repair: repairConfig,
    manuals: manualsConfig,
    map: mapConfig
}

