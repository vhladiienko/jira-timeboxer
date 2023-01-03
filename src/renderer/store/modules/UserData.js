import { api, fetchCurrentUser, postWorklog } from '../../api/api'
import Jira from './Jira'
import humanizeDuration from 'humanize-duration'
import unionBy from 'lodash/unionBy'
import uniqueId from 'lodash/uniqueId'
import merge from 'lodash/merge'
import sortBy from 'lodash/sortBy'
import db from '../../datastore'
import ENUM from '../../enums'

var moment = require('moment')

const humanize = humanizeDuration.humanizer({
  language: "shortEn",
  largest: 2,
  delimiter: " ",
  spacer: "",
  languages: {
    shortEn: {
      y: () => "y",
      mo: () => "mo",
      w: () => "w",
      d: () => "d",
      h: () => "h",
      m: () => "m",
      s: () => "s",
      ms: () => "ms",
    },
  }
})

const state = {
  vuexState: ENUM.INIT,
  token: '',
  user: {},
  timeEntriesLocal: [],
  timeEntriesServer: [],
  snackbar: {
    show: false,
    text: '',
    color: ''
  },
  appLoading: false,
  currentDate: new Date,
  dateLoading: false,
  dontPersistOnNextExit: false
}

const mutations = {
  SET_VUEX_STATE (state, vuexState) {
    state.vuexState = vuexState
  },
  LOAD_STORE (state, payload) {
    let keysToLoad = ['user', 'token', 'timeEntriesLocal']
    Object.keys(payload).forEach(key => {
      if (keysToLoad.includes(key)) {
        state[key] = payload[key]
      }
    })
    api.defaults.headers.common = {
      'Authorization': `Bearer ${payload.token}`
    }
  },
  UPDATE_USER (state, userData) {
    state.user = userData
  },
  UPDATE_SNACKBAR (state, payload) {
    merge(state.snackbar, payload)
  },
  UPDATE_LOADING_STATE (state, value) {
    state.appLoading = value
  },
  DATE_LOADING (state, value) {
    state.dateLoading = value
  },
  UPDATE_TOKEN (state, token) {
    state.token = token
    api.defaults.headers.common = {
      'Authorization': `Bearer ${token}`
    }
  },
  ADD_LOCAL_ENTRY (state, entry) {
    state.timeEntriesLocal.unshift(entry)
  },
  ADD_SERVER_ENTRY (state, entry) {
    state.timeEntriesServer.unshift(entry)
  },
  REMOVE_LOCAL_ENTRY (state, entry) {
    state.timeEntriesLocal.splice(state.timeEntriesLocal.indexOf(entry), 1)
  },
  UPDATE_LOCAL_ENTRY (state, obj) {
    obj.forEach(element => {
      let id = element.id
      let key = element.key
      let entry = getItemById(id, state.timeEntriesLocal)
      if (entry !== undefined) {
        entry[key] = element.value
      }
    })
  },
  UPDATE_SERVER_ENTRIES (state, array) {
    state.timeEntriesServer = array
  },
  SET_DATE (state, value) {
    state.currentDate = value
  },
  DONT_PERSIST (state) {
    state.dontPersistOnNextExit = true
  }
}

const getters = {
  todayLog () {
    var todayLocalEntries = []
    state.timeEntriesLocal.forEach(element => {
      var date = element.spentOn
      var today = state.currentDate
      if (moment(date).isSame(today, 'day')) {
        todayLocalEntries.push(element)
      }
    })
    return sortBy(sortBy(unionBy(state.timeEntriesServer, todayLocalEntries, 'id'), 'spentOn').reverse(), 'done')
  },
  todayCompleted () {
    return getters.todayLog().filter(todo => todo.done)
  },
  totalWorkedToday () {
    let totalSeconds = 0
    getters.todayLog().forEach(element => {
      totalSeconds += element.seconds
    })
    return totalSeconds ? humanize(totalSeconds * 1000) : '-'
  },
  totalEstimatedToday () {
    let estimate = 0
    getters.todayLog().forEach(element => {
      estimate += element.estimate
    })
    return estimate ? humanize(estimate) : '-'
  }
}

const actions = {
  storeToken ({ commit, dispatch }, { token }) {
    commit('UPDATE_TOKEN', token)
    db.update({ 'state.UserData.token': { $exists: true } }, { $set: { 'state.UserData.token': token } })
    dispatch('getUserInfo')
  },
  getUserInfo ({ commit }) {
    fetchCurrentUser().then((response) => {
      let userData = response.data
      commit('UPDATE_USER', userData)
      db.update({ 'state.UserData.user': { $exists: true } }, { $set: { 'state.UserData.user': userData } })
    })  
  },
  storeWholeState (context, { vue }) {
    if (context.state.dontPersistOnNextExit) return
    return new Promise((resolve) => {
      db.update({ state: { $exists: true } }, { state: vue.$store.state }, { upsert: true }, (err, numReplaced) => {
        if (numReplaced > 0) {
          resolve()
        } else {
          console.error(err) 
        }
      })
    })
  },
  updateEntryComment ({ commit }, { value, id }) {
    commit('UPDATE_LOCAL_ENTRY', [
      {
        id: id,
        key: 'comment',
        value: value,
      }
    ])
    db.update({ 'state.UserData.timeEntriesLocal': { $exists: true } }, { $set: { 'state.UserData.timeEntriesLocal': state.timeEntriesLocal } }, { upsert: true })
  },
  updateEntryStatus ({ commit }, entry) {
    commit('UPDATE_LOCAL_ENTRY', [
      {
        id: entry.id,
        key: 'done',
        value: !entry.done,
      }
    ])
    db.update({ 'state.UserData.timeEntriesLocal': { $exists: true } }, { $set: { 'state.UserData.timeEntriesLocal': state.timeEntriesLocal } }, { upsert: true })
  },
  toggleAllEntriesStatus ({ commit, getters }, allDone) {
    getters.todayLog.forEach((entry) => {
      if (!allDone) {
        commit('UPDATE_LOCAL_ENTRY', [
          {
            id: entry.id,
            key: 'done',
            value: true,
          }
        ])
      } else {
        commit('UPDATE_LOCAL_ENTRY', [
          {
            id: entry.id,
            key: 'done',
            value: !entry.done,
          }
        ])
      }
    })
    db.update({ 'state.UserData.timeEntriesLocal': { $exists: true } }, { $set: { 'state.UserData.timeEntriesLocal': state.timeEntriesLocal } }, { upsert: true })
  },
  createNewEntry ({ commit }, { todoText, estimate }) {
    let entry = {
      id: uniqueId(`id_${Math.floor(Math.random() * 101)}`),
      project: {},
      spentOn: moment(state.currentDate).set({
        hour: moment().format('HH'),
        minute: moment().format('mm'),
        second: moment().format('ss'),
      }).toDate(),
      comment: todoText,
      issue: {},
      seconds: 0,
      estimate: estimate,
      published: false,
      loading: false,
      infoMessage: '',
      done: false
    }
    commit('ADD_LOCAL_ENTRY', entry)
    db.update({ 'state.UserData.timeEntriesLocal': { $exists: true } }, { $set: { 'state.UserData.timeEntriesLocal': state.timeEntriesLocal } }, { upsert: true })
  },
  removeEntry ({ commit, dispatch }, entry) {
    commit('REMOVE_LOCAL_ENTRY', entry)
    dispatch('initTimer')
    db.update({ 'state.UserData.timeEntriesLocal': { $exists: true } }, { $set: { 'state.UserData.timeEntriesLocal': state.timeEntriesLocal } }, { upsert: true })
  },
  removeDone ({ commit, getters }) {
    getters.todayLog.filter(entry => entry.done).forEach((entry) => {
      commit('REMOVE_LOCAL_ENTRY', entry)
    })
    db.update({ 'state.UserData.timeEntriesLocal': { $exists: true } }, { $set: { 'state.UserData.timeEntriesLocal': state.timeEntriesLocal } }, { upsert: true })
  },
  uploadDone ({ dispatch, getters }) {
    getters.todayCompleted.forEach(todo => {
      if (!todo.published) {
        dispatch('postWorklog', todo)
      }
    })
  },
  postponeActive ({ commit, getters }) {
    getters.todayLog.filter(entry => !entry.done).forEach((todo) => {
      commit('UPDATE_LOCAL_ENTRY', [
        {
          id: todo.id,
          key: 'spentOn',
          value: moment(todo.spentOn).add(1, 'd').toDate()
        }
      ])
      db.update({ 'state.UserData.timeEntriesLocal': { $exists: true } }, { $set: { 'state.UserData.timeEntriesLocal': state.timeEntriesLocal } }, { upsert: true })
    })
  },
  updateEntryIssue ({ commit }, { issueId, todo }) {
    let issue = getItemById(issueId, Jira.state.jiraList)
    commit('UPDATE_LOCAL_ENTRY', [
      {
        id: todo.id,
        key: 'issue',
        value: issue
      }
    ])
    db.update({ 'state.UserData.timeEntriesLocal': { $exists: true } }, { $set: { 'state.UserData.timeEntriesLocal': state.timeEntriesLocal } }, { upsert: true })
  },
  async postWorklog ({ commit }, todo) {
    commit('UPDATE_LOCAL_ENTRY', [
      {
        id: todo.id,
        key: 'loading',
        value: true
      }
    ])

    let response = await postWorklog({
      timeSpentSeconds: todo.seconds,
      comment: todo.comment,
      started: moment(todo.spentOn).format('YYYY-MM-DDTHH:mm:ss.SSS+0000') // had to hardcode 0000 TZ because tempo made a wrong decising at some point
    }, todo.issue.id)

    if (response) {
      commit('UPDATE_LOCAL_ENTRY', [
        {
          id: todo.id,
          key: 'loading',
          value: false
        },
        {
          id: todo.id,
          key: 'published',
          value: true
        },
      ])
      commit('ADD_SERVER_ENTRY', todo)
      commit('REMOVE_LOCAL_ENTRY', todo)
    } else {
      let errorMessage = `Error ${response.statusCode}: ` + response.message
      commit('UPDATE_LOCAL_ENTRY', [
        {
          id: todo.id,
          key: 'published',
          value: false
        },
        {
          id: todo.id,
          key: 'loading',
          value: false
        },
        {
          id: todo.id,
          key: 'infoMessage',
          value: errorMessage
        }
      ])
      commit('UPDATE_SNACKBAR', {
        show: true,
        color: 'error',
        text: errorMessage
      })
    }
  },
  initializeState ({ commit }) {
    commit('SET_VUEX_STATE', ENUM.LOADING)
    return new Promise ((resolve) => {
      db.findOne({ 'state.Jira': { $exists: true } }, (err, result) => {
        if (err) {
          console.error(err)
          return commit('SET_VUEX_STATE', ENUM.ERROR)
        } else if (result !== null) {
          commit('LOAD_JIRA', result.state['Jira'])
        }
        db.findOne({ 'state.UserData': { $exists: true } }, (err, result) => {
          if (err) {
            console.error(err)
            return commit('SET_VUEX_STATE', ENUM.ERROR)
          } else if (result !== null) {
            commit('LOAD_STORE', result.state['UserData'])
          }
          db.findOne({ 'state.Configuration': { $exists: true } }, (err, result) => {
            if (err) {
              console.error(err)
              return commit('SET_VUEX_STATE', ENUM.ERROR)
            } else if (result !== null) {
              commit('LOAD_CONFIG', result.state['Configuration'])
            }
            db.findOne({ 'state.Timer': { $exists: true } }, (err, result) => {
              if (err) {
                console.error(err)
                return commit('SET_VUEX_STATE', ENUM.ERROR)
              } else if (result !== null) {
                commit('LOAD_TIMER', result.state['Timer'])
              }
              resolve(commit('SET_VUEX_STATE', ENUM.LOADED))
            })
          })
        })
      })
    })
  }
}

function getItemById (id, array) {
  return array.find(function (element) {
    return element.id === id
  })
}

export default {
  state,
  mutations,
  actions,
  getters
}
