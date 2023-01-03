import { fetchWorklogs } from '../../api/tempo_api'
import moment from 'moment'

const actions = {
  getWorklogs ({ commit }, { username, dateFrom, dateTo }) {
    commit('DATE_LOADING', true)
    return new Promise((resolve) => {
      fetchWorklogs({ username, dateFrom, dateTo }).then((response) => {
        let serverWorklogs = convertToLocalFormat(response)
        commit('UPDATE_SERVER_ENTRIES', serverWorklogs)
        commit('DATE_LOADING', false)
        resolve()
      })
    })
  },
}

function convertToLocalFormat (array) {
  return array.map(element => {
    let obj = Object.assign({}, element)
    obj = {
      id: element.tempoWorklogId,
      spentOn: moment(element.started).toDate(), //this was .utc(), but since tempo folks are handling time in a unique way, I had to remove it (put it back when tempo fixes its stuff)
      comment: element.comment,
      issue: {
        ...element.issue,
        fields: {
          summary: element.issue.summary
        }
      },
      seconds: element.timeSpentSeconds,
      published: true,
      loading: false,
      infoMessage: 'From API',
      done: true
    }
    return obj
  })
}

export default {
  actions
}
