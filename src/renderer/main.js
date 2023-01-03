import Vue from 'vue'
// import Vuetify from 'vuetify'
import VueElectron from 'vue-electron'
import Paginate from 'vuejs-paginate'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/dist/vuetify.css'
import db from './datastore'
import vuetify from '@/plugins/vuetify'

import App from './App'
import router from './router'
import store from './store'
import * as api from './api/api'

// Vue.use(Vuetify, {
//   iconfont: 'mdi'
// })
Vue.use(VueElectron)
Vue.component('paginate', Paginate)
Vue.prototype.$db = db
Vue.prototype.$api = api

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

Vue.config.productionTip = false

export const EventBus = new Vue()

Vue.filter('capitalize', function (value) {
  if (!value) return ''
  value = value.toString()
  return value.charAt(0).toUpperCase() + value.slice(1)
})

/* eslint-disable no-new */
export const vue = new Vue({
  components: { App },
  router,
  store,
  vuetify,
  template: '<App/>'
}).$mount('#app')
