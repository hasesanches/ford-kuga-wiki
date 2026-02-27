<script setup lang="ts">
import {onMounted, ref} from 'vue'

import { pageConfigs } from "@/configs";
import { getAll } from "@/db/core";

const mapId = 'yandex-map'
const isLoaded = ref(false)

const presetMap:any = {
  service: 'islands#redIcon',
  garage: 'islands#blueIcon',
  other: 'islands#greenIcon'
}

function loadYandexApi(apikey: string) {
  return new Promise((resolve, reject) => {
    if ((window as any).ymaps) {
      resolve((window as any).ymaps)
      return
    }
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apikey}&lang=ru_RU`
    script.onload = () => resolve((window as any).ymaps)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function renderImage(image?: string) {
  if (!image) return ''
  return `
    <div style="margin:6px 0;">
      <img
        src="${image}"
        style="max-width:220px;max-height:160px;border-radius:4px;display:block;"
      />
    </div>
  `
}

function renderLinks(links: any) {
  if (!links) return ''

  return `
     <ul style="padding-left:16px;margin:6px 0;">
        ${links
        .filter((l: { url: any; }) => l?.url)
        .map(
            (l: { url: any; title: any; }) =>
                `<li>
                <a href="${l.url}" target="_blank">
                  ${l.title || l.url}
                </a>
              </li>`
        )
        .join('')}
      </ul>
    `
}

onMounted(async () => {
  try {
    await loadYandexApi('5eceed32-391d-4e8e-a4f7-aaaebb73892a')
    const ymaps = (window as any).ymaps

    if (!ymaps) {
      console.error('ymaps не найден после загрузки скрипта')
      return
    }

    const config = pageConfigs['map'];
    const items = await getAll<any>(config.collection)
    const center = [58, 58];
    const zoom = 5;

    ymaps.ready(() => {
      const map = new ymaps.Map(mapId, {center, zoom})

      items.forEach((point) => {
        const placemark = new ymaps.Placemark(
            [+point.x, +point.y],
            {
              balloonContent: `
                <div style="max-width:260px;">
                  <strong>${point.name}</strong>
                  <div style="margin-top:4px;">
                    ${point.description || ''}
                  </div>

                  ${renderImage(point.image)}
                  ${renderLinks(point.contact)}
                </div>
              `
            },
            {
              preset: presetMap[point.category] || 'islands#greenIcon'
            }
        )

        map.geoObjects.add(placemark)
      })

      isLoaded.value = true
    })
  } catch (e) {
    console.error('Ошибка в onMounted:', e)
  }
})
</script>

<template>
  <div class="map-page">
    <div class="map-wrapper">
      <div v-if="!isLoaded" class="loading">Загрузка карты…</div>
      <div :id="mapId" class="map"></div>
    </div>
  </div>
</template>

<style scoped>
.map-page {
  height: 100%;
  width: 100%;
}
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 100%;
}

.loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111;
  color: #aaa;
  z-index: 1;
}
</style>
