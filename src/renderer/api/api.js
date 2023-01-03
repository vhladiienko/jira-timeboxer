import axios from 'axios'
import endpoints from './endpoints'
import store from '@/store'

var rp = require('request-promise')

export const api = axios.create({
  timeout: 5000,
  validateStatus: function (status) {
    return status >= 200 && status < 300
  }
})

export async function fetchCurrentUser () {
  try {
    let response = await api.get(endpoints.currentUser)
    console.log('Successfully authorized user in Jira')
    console.dir(response)
    return response
  } catch (error) {
    console.error(error)
    return error
  }
}

export async function fetchProjects () {
  try {
    let response = await api.get(endpoints.projects)
    console.log('Successfully got a list of projects from Jira')
    console.dir(response)
    return response
  } catch (error) {
    console.error(error)
    return error
  }
}

export async function fetchIssueDetails (issueId) {
  try {
    let response = await api.get(endpoints.issue(issueId), {
      params: {
        fields: 'id,summary,description,assignee,reporter,status,comment'
      }
    })
    console.log('Successfully got issue details from Jira')
    console.dir(response)
    return response
  } catch (error) {
    console.error(error)
    return error
  }
}

export async function fetchFilters () {
  try {
    let response = await api.get(endpoints.filters)
    console.log('Successfully got filters from Jira')
    console.dir(response)
    return response
  } catch (error) {
    console.error(error)
    return error
  }
}

export function searchJql (jql) {
  let params = {
    jql: jql,
    startAt: 0,
    maxResults: 50,
    fields: 'summary,status'
  }
  return api.get(endpoints.search, { params })
}

export function autocompleteSuggestions (field, value) {
  let params = {
    fieldName: field,
    fieldValue: value
  }
  return api.get(endpoints.autocompleteSuggestions, { params })
}

// We have to use rp lib because axios does not support overriding User-Agent, while this is required for the POST request to this endpoint to work
// See https://community.atlassian.com/t5/Jira-questions/Re-Re-Jira-7-rest-api-XSRF-check-failed-for-post-issue/qaq-p/603225/comment-id/254043#M254043
// And https://confluence.atlassian.com/jirakb/rest-api-calls-with-a-browser-user-agent-header-may-fail-csrf-checks-802591455.html
export async function postWorklog (payload, issueId) {
  try {
    let params = {
      method: 'POST',
      uri: store.state.Jira.jiraUrl + `${endpoints.worklog(issueId)}?notifyUsers=false`,
      headers: {
        'User-Agent': ''
      },
      'auth': {
        'bearer': store.state.UserData.token
      },
      body: payload,
      json: true
    }
    let response = await rp.post(params)
    console.log('Successfully created a worklog')
    console.dir(response)
    return response
  } catch (error) {
    console.error(error)
    return error
  }
}
