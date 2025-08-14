import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Dashboard from '../views/Dashboard.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/dashboard/:sessionId?',
    name: 'Dashboard',
    component: Dashboard,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router