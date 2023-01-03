import { api, fetchIssueDetails, searchJql, autocompleteSuggestions } from '../../api/api'
import concat from 'lodash/concat'
import db from '../../datastore'

const state = {
  jiraUrl: '',
  jiraList: []
}

const mutations = {
  LOAD_JIRA (state, payload) {
    Object.keys(payload).forEach(key => {
      state[key] = payload[key]
    })
    api.defaults.baseURL = state.jiraUrl
  },
  UPDATE_URL (state, url) {
    state.jiraUrl = url
  },
  UPDATE_JIRA_LIST (state, list) {
    state.jiraList = list.slice()
  }
}

const actions = {
  storeJiraData (context, { vue }) {
    return new Promise((resolve, reject) => {
      vue.$db.update({ jira: { $exists: true } }, { jira: context.state }, { }, (err) => {
        if (err) {
          console.error('Error storing Jira data', err)
          reject(err)
          return
        }
        resolve()
        console.log(context.state)
      })
    })
  },
  getIssueDetails ({ commit }, issueId) {
    return new Promise((resolve, reject) => {
      fetchIssueDetails(issueId).then((response) => {
        if (response.status === 200) {
          return resolve(response.data)
        } else {
          reject(response)
          commit('UPDATE_SNACKBAR', {
            show: true,
            color: 'error',
            text: `Error: ${response}`
          })
        }
      })
    })
  },
  storeUrl ({ commit }, { url }) {
    commit('UPDATE_URL', url)
    db.update({ 'state.Jira.jiraUrl': { $exists: true } }, { $set: { 'state.Jira.jiraUrl': url } })
    api.defaults.baseURL = state.jiraUrl
  },
  populateJiraList ({ commit }, payload) {
    return new Promise((resolve) => {
      let list = []
      let issues = searchJql(payload.jql)
      let projects
      if (payload.value) {
        projects = autocompleteSuggestions('project', payload.value)
      } else {
        projects = new Promise((resolve) => {
          resolve({data: {results: []}})
        })
      }
      let regExp = /(.*) \(([^)]+)\)/
  
      Promise.all([issues, projects]).then((results) => {
        let formattedIssues = results[0].data.issues.map(element => {
          let obj = Object.assign({}, element)
          obj.name = '[' + obj.key + '] ' + obj.fields.summary
          obj.group = 'Issues'
          return obj
        })

        let formattedProjects = results[1].data.results.map(element => {
          let html = element.displayName
          let div = document.createElement("div")
          div.innerHTML = html
          let cleanedText = div.textContent || div.innerText || ""

          let matches = regExp.exec(cleanedText)
          let projectName = matches[1]
          let projectKey = matches[2]

          return {
            html: element.displayName,
            name: projectName,
            id: projectKey,
            group: 'Projects'
          }
        })
        if (formattedProjects.length > 0) {
          list = concat({ header: 'Issues' }, formattedIssues, { divider: true }, { header: 'Projects' }, formattedProjects)
        } else {
          list = formattedIssues
        }
        commit('UPDATE_JIRA_LIST', list)
        resolve()
      })
    })
  }
}

export default {
  state,
  mutations,
  actions
}
