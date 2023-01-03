import endpoints from './endpoints'
import store from '@/store'

var rp = require('request-promise')

// We have to use rp lib because axios does not support overriding User-Agent, while this is required for the POST request to this endpoint to work
// See https://community.atlassian.com/t5/Jira-questions/Re-Re-Jira-7-rest-api-XSRF-check-failed-for-post-issue/qaq-p/603225/comment-id/254043#M254043
// And https://confluence.atlassian.com/jirakb/rest-api-calls-with-a-browser-user-agent-header-may-fail-csrf-checks-802591455.html
export function fetchWorklogs ({username, dateFrom, dateTo} = {}) {
  try {
    let params = {
      method: 'POST',
      uri: store.state.Jira.jiraUrl + endpoints.findWorklogs,
      headers: {
        'User-Agent': ''
      },
      'auth': {
        'bearer': store.state.UserData.token
      },
      body: {
        from: dateFrom,
        to: dateTo,
        worker: [
          username
        ]
      },
      json: true
    }
    return rp.post(params)
  } catch (error) {
    console.error(error)
  }
}