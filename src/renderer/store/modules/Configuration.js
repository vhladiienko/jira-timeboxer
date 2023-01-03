const state = {
  notRunningNotification: false,
  darkTheme: false
}

const mutations = {
  LOAD_CONFIG (state, payload) {
    Object.keys(payload).forEach(key => {
      state[key] = payload[key]
    })
  },
  UPDATE_NOT_RUNNING_NOTIFICATION (state, value) {
    state.notRunningNotification = value
  },
  TOGGLE_DARK_THEME (state, value) {
    state.darkTheme = value
  }
}

const actions = {
  storeSettings ({ state }, { vue }) {
    return new Promise((resolve, reject) => {
      vue.$db.update({ configuration: { $exists: true } }, { configuration: state }, { }, (err) => {
        if (err) {
          console.error('Error storing Jira data', err)
          reject(err)
          return
        }
        resolve()
        console.log(state)
      })
    })
  },
  toggleDarkTheme ({ commit }, { vue, value }) {
    commit('TOGGLE_DARK_THEME', value)
    vue.$vuetify.theme.dark = value
  }
}

export default {
  state,
  mutations,
  actions
}
