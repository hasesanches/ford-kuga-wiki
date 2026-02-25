import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const page = () => import('@/pages/Page.vue')

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/pages/Home.vue')
    },
    {
        path: '/repair',
        name: 'repair',
        component: page
    },
    {
        path: '/tuning',
        name: 'tuning',
        component: page
    },
    {
        path: '/parts',
        name: 'parts',
        component: page
    },
    {
        path: '/software',
        name: 'software',
        component: page
    },
    {
        path: '/manuals',
        name: 'manuals',
        component: page
    },
    {
        path: '/map',
        name: 'map',
        component: () => import('@/pages/Map.vue')
    },
    {
        path: '/contact',
        name: 'contact',
        component: () => import('@/pages/Contact.vue')
    },
    {
        path: '/admin',
        name: 'admin',
        component: () => import('@/admin/AdminPage.vue'),
        meta: {
            admin: true
        }
    },
    {
        path: '/can_sniffer',
        name: 'CanSniffer',
        component: () => import('@/pages/CanSniffer.vue'),
        meta: {
            admin: true
        }
    },
]

export const router = createRouter({
    history: createWebHashHistory(),
    routes
})
