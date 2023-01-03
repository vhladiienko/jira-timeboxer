<template>
  <v-dialog
    v-model="popup"
    max-width="500px"
  >
    <template
      v-slot:activator="{ on, attrs }"
    >
      <v-chip
        :color="todo.issue.key ? 'primary' : 'secondary'"
        label
        x-small
        v-bind="attrs"
        v-on="on"
      >
        {{ todo.issue.key || 'Select issue' }}
      </v-chip>
      <span
        class="ml-1"
        v-text="todo.issue.key ? todo.issue.fields.summary : ''"
      />
    </template>
    <v-card>
      <v-card-title>
        Issue
      </v-card-title>
      <v-card-text>
        <v-autocomplete
          v-model="autocomplete"
          :search-input.sync="lookup"
          item-value="id"
          item-text="name"
          :items="jiraList"
          :hint="project ? 'Searching in ' + project.name : ''"
          :loading="dropdownLoading"
          :disabled="todo.published"
          :prepend-icon="focus && project ? 'mdi-close' : 'mdi-jira'"
          placeholder="Start typing to search"
          persistent-hint
          hide-no-data
          no-filter
          return-object
          @change="changeIssue"
          @focus="focus = !focus"
          @click:prepend="project = null"
        >
          <template v-slot:item="data">
            <template v-if="typeof data.item === 'object'">
              <v-list-item-content>
                <v-list-item-title
                  v-html="data.item.group === 'Projects' ? data.item.html : data.item.name"
                />
                <v-list-item-subtitle
                  v-if="data.item.fields"
                >
                  {{ data.item.fields.status.name }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>
            <template v-else>
              <v-list-item-content v-text="data.item" />
            </template>
          </template>
        </v-autocomplete>
      </v-card-text>
      <v-divider />
      <div v-if="todo.issue.key">
        <v-card-subtitle>
          <v-chip
            class="mr-2"
            color="primary"
            label
            x-small
          >
            {{ todo.issue.key }}
          </v-chip>
          {{ todo.issue.fields.summary }}
          <v-btn
            icon
            @click="openIssueUrl(todo.issue.key)"
          >
            <v-icon>mdi-open-in-new</v-icon>
          </v-btn>
        </v-card-subtitle>
        <v-card-text>
          <v-skeleton-loader
            v-if="loading"
            type="list-item-two-line@5"
            tile
          />
          <div v-else>
            <v-list-item class="px-0">
              <v-list-item-content>
                <v-chip
                  label
                  class="text-uppercase"
                >
                  {{ issueDetails.fields.status.name }}
                </v-chip>
              </v-list-item-content>
            </v-list-item>
            <v-list-item class="px-0">
              <v-list-item-avatar>
                <v-img :src="issueDetails.fields.reporter.avatarUrls['48x48']" />
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>Reporter</v-list-item-title>
                <v-list-item-subtitle>{{ issueDetails.fields.reporter.displayName }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item class="px-0">
              <v-list-item-avatar
                v-if="issueDetails.fields.assignee"
              >
                <v-img :src="issueDetails.fields.assignee.avatarUrls['48x48']" />
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>Assignee</v-list-item-title>
                <v-list-item-subtitle>{{ issueDetails.fields.assignee ? issueDetails.fields.assignee.displayName : 'Unassigned' }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <div
              v-if="issueDetails.fields.description"
              class="preformatted"
            >
              {{ issueDetails.fields.description }}
            </div>
            <div
              v-else
              class="text--disabled font-italic"
            >
              No description provided
            </div>
            <v-subheader>Comments</v-subheader>
            <v-divider />
            <v-list
              v-if="issueDetails.fields.comment.comments.length > 0"
              three-line
              dense
              flat
            >
              <v-list-item-group>
                <template v-for="(item, index) in issueDetails.fields.comment.comments.slice().reverse()">
                  <v-list-item :key="item.title">
                    <template>
                      <v-list-item-avatar>
                        <v-img :src="item.author.avatarUrls['48x48']" />
                      </v-list-item-avatar>
                      <v-list-item-content>
                        <v-list-item-title v-text="item.author.displayName" />
                        <v-list-item-subtitle>{{ item.created | date }}</v-list-item-subtitle>
                        <v-list-item-content class="preformatted">
                          {{ item.body }}
                        </v-list-item-content>
                      </v-list-item-content>
                    </template>
                  </v-list-item>

                  <v-divider
                    v-if="index + 1 < issueDetails.fields.comment.comments.length"
                    :key="index"
                    inset
                  />
                </template>
              </v-list-item-group>
            </v-list>
            <v-row
              v-else
              class="text--disabled font-italic py-5"
              justify="center"
            >
              No comments
            </v-row>
          </div>
        </v-card-text>
      </div>
      <v-card-actions>
        <v-btn
          color="primary"
          text
          @click="popup = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  import { shell } from 'electron'
  import moment from 'moment'
  import { mapState } from 'vuex'
  import debounce from 'lodash/debounce'

  export default {
    name: 'Issue',
    filters: {
      date (value) {
        return moment(value).format('DD/MMM/YY HH:mm')
      }
    },
    props: {
      todo: {
        type: Object,
        default: () => {
          return {}
        }
      }
    },
    data () {
      return {
        popup: false,
        loading: true,
        dropdownLoading: false,
        issueDetails: this.todo.issue,
        autocomplete: null,
        lookup: null,
        project: null,
        jql: '',
        selectedIssueId: this.todo.issue ? this.todo.issue.id : null,
        focus: false
      }
    },
    computed: {
      ...mapState({
        jiraList: state => state.Jira.jiraList
      })
    },
    watch: {
      popup (value) {
        if (!value || !this.todo.issue.key) return

        this.loading = true
        this.$store.dispatch('getIssueDetails', this.todo.issue.id).then((response) => {
          this.loading = false
          this.issueDetails = response
        })
      },
      'lookup': debounce(function (value) {
        if (this.jiraList > 0) return
        if (this.dropdownLoading) return

        this.dropdownLoading = true
        let issueKeys

        if (value) {
          issueKeys = value.match(/\b[a-zA-Z]+-\d+\b/g)
        }
        let jql = ''

        if (issueKeys) {
          this.project = null
          value = ''
          jql = `key in ("${issueKeys.join('", "')}")`
        } else if (this.project && !value) {
          jql = `project = "${this.project.id}"`
        } else if (this.project) {
          jql = `project = "${this.project.id}" and summary ~ "${value}"`
        } else if (value) {
          jql = `summary ~ "${value}"`
        } else {
          return this.dropdownLoading = false
        }
        this.$store.dispatch('populateJiraList', { jql, value }).then(() => {
          this.dropdownLoading = false
        })
      }, 500)
    },
    methods: {
      openIssueUrl (key) {
        let issueUrl = this.$store.state.Jira.jiraUrl + '/browse/' + key
        shell.openExternal(issueUrl)
      },
      getProjectByKey (value, array) {
        return array.find(function (element) {
          return element.key.toUpperCase() === value.toUpperCase()
        })
      },
      changeIssue (object) {
        if (Number(object.id)) {
          this.selectedIssueId = object.id
          this.$store.dispatch('updateEntryIssue', { issueId: this.selectedIssueId, todo: this.todo})
          this.loading = true
          this.$store.dispatch('getIssueDetails', this.selectedIssueId).then((response) => {
            this.loading = false
            this.issueDetails = response
          })
        } else {
          this.project = object
          this.$nextTick(() => {
            this.autocomplete = null
          })
        }
      }
    }
  }
</script>

<style scoped>
  .preformatted {
    white-space: pre-wrap;
  }
  .block {
    display: block;
    word-wrap: break-word;
    word-break: break-word;
  }
</style>
