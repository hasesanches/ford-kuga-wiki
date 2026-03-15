<script setup lang="ts">
import {onMounted, ref} from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { pageConfigs } from "@/configs";
import { getAll } from "@/db/core";

const mapId = 'yandex-map'
const isLoaded = ref(false)
const route = useRoute()
const router = useRouter()

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

// Функция получения параметров карты из URL
function getMapParamsFromURL() {
  const params: { center?: number[]; zoom?: number; type?: string } = {}

  if (route.query.ll && typeof route.query.ll === 'string') {
    const coords = route.query.ll.split(',').map(Number)
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      params.center = coords
    }
  }

  if (route.query.z && typeof route.query.z === 'string') {
    const zoom = Number(route.query.z)
    if (!isNaN(zoom) && zoom >= 0 && zoom <= 23) {
      params.zoom = zoom
    }
  }

  if (route.query.t && typeof route.query.t === 'string') {
    params.type = decodeURIComponent(route.query.t)
  }

  return params
}

// Функция обновления URL с параметрами карты
function updateURL(map: any) {
  const center = map.getCenter()
  const zoom = map.getZoom()

  const query: Record<string, string> = {}

  query.ll = center.map((coord: number) => coord.toFixed(6)).join(',')
  query.z = zoom.toString()

  router.replace({ query })
}

// Функция рендера изображения
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

// Функция рендера ссылок
function renderLinks(links: any) {
  if (!links || !Array.isArray(links)) return ''

  return `
     <ul style="padding-left:16px;margin:6px 0;">
        ${links
      .filter((l: { url: any }) => l?.url)
      .map(
          (l: { url: any; title: any }) =>
              `<li>
                <a href="${l.url}" target="_blank" rel="noopener noreferrer">
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

    // Получаем параметры из URL или используем значения по умолчанию
    const urlParams = getMapParamsFromURL()
    const center = urlParams.center || [58, 58]
    const zoom = urlParams.zoom || 5

    ymaps.ready(() => {
      const map = new ymaps.Map(mapId, {
        center,
        zoom,
        type: urlParams.type || 'yandex#map'
      })

      // Функция debounce для предотвращения частого обновления URL
      let timeout: NodeJS.Timeout
      const debouncedUpdateURL = (map: any) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => updateURL(map), 300)
      }

      // Отслеживаем изменение границ карты (движение и зум)
      map.events.add('boundschange', function () {
        debouncedUpdateURL(map)
      })

      // Добавляем метки на карту
      items.forEach((point) => {
        // Проверяем, что координаты валидны
        if (!point.x || !point.y || isNaN(+point.x) || isNaN(+point.y)) {
          console.warn('Некорректные координаты для точки:', point)
          return
        }

        const placemark = new ymaps.Placemark(
            [+point.x, +point.y],
            {
              balloonContent: `
                <div style="max-width:260px;">
                  <strong>${point.name || 'Без названия'}</strong>
                  <div style="margin-top:4px;">
                    ${point.description || ''}
                  </div>
                  ${renderImage(point.image)}
                  ${renderLinks(point.contact)}
                </div>
              `,
              hintContent: point.name || 'Метка на карте'
            },
            {
              preset: presetMap[point.category] || 'islands#greenIcon',
              balloonMaxWidth: 300,
              hideIconOnBalloonOpen: false
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