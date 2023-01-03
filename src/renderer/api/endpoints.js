export default {
  currentUser: '/rest/api/2/myself',
  projects: '/rest/api/2/project',
  filters: '/rest/api/2/filter/favourite',
  worklog: (issueId) => {
    return `/rest/api/2/issue/${issueId}/worklog`
  },
  search: '/rest/api/2/search',
  findWorklogs: '/rest/tempo-timesheets/4/worklogs/search',
  issue: (issueId) => {
    return `/rest/api/2/issue/${issueId}`
  },
  autocompleteSuggestions: '/rest/api/2/jql/autocompletedata/suggestions'
}
