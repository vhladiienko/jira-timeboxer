import merge from 'lodash/merge'
import humanizeDuration from 'humanize-duration'
import { ipcRenderer } from 'electron'

const state = {
  status: false,
  timerInterval: null,
  todo: undefined
}

const mutations = {
  LOAD_TIMER (state, payload) {
    Object.keys(payload).forEach(key => {
      state[key] = payload[key]
    })
  },
  UPDATE_TIMER (state, payload) {
    merge(state, payload)
  }
}

const actions = {
  storeTimer (context, { vue }) {
    return new Promise((resolve, reject) => {
      vue.$db.update({ timer: { $exists: true } }, { timer: context.state }, { }, (err) => {
        if (err) {
          console.error('Error setting timer', err)
          reject(err)
          return
        }
        resolve()
      })
    })
  },
  toggleTimer ({ commit, dispatch }, entry) {
    if (!state.status) {
      clearInterval(state.timerInterval)
      commit('UPDATE_TIMER', {
        status: true,
        timerInterval: setInterval(() => {
          if (entry.published || Object.keys(entry).length === 0) { return dispatch('initTimer') }
          commit('UPDATE_LOCAL_ENTRY', [
            {
              id: entry.id,
              key: 'seconds',
              value: entry.seconds + 1,
            }
          ])
          ipcRenderer.send('updateDurationTooltip', `${entry.comment} - ${humanizeDuration(entry.seconds * 1000)}`)
        }, 1000),
        todo: entry.id
      })
      ipcRenderer.send('changeTrayIcon', 'on')
    } else {
      dispatch('initTimer')
    }
  },
  initTimer ({ commit, rootState }) {
    clearInterval(state.timerInterval)

    if (rootState.Configuration.notRunningNotification) {
      let idleTime = 0
      commit('UPDATE_TIMER', {
        status: false,
        timerInterval: setInterval(() => {
          idleTime = idleTime + 600000
          let notification = new Notification('Jira Timeboxer', {
            body: `The timer has not been running for ${humanizeDuration(idleTime)}`
          })
          notification.onclick = () => {
            ipcRenderer.send('notification-click')
          }
        }, 600000)
      })
    } else {
      commit('UPDATE_TIMER', { status: false })
    }

    ipcRenderer.send('changeTrayIcon', 'off')
  }
}

export default {
  state,
  mutations,
  actions
}
