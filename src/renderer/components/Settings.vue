<template>
  <v-dialog
    v-model="popup"
    max-width="500px"
  >
    <template
      v-slot:activator="{ on }"
    >
      <v-btn
        fab
        icon
        v-on="on"
      >
        <v-icon>mdi-settings</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        Settings
      </v-card-title>
      <v-card-text>
        <v-text-field
          id="url"
          :value="jiraURL"
          placeholder="https://someurl.com"
          label="Jira URL"
          prepend-icon="mdi-link"
          @change="updateJiraURL"
        />
        <v-text-field
          id="token"
          :value="token"
          prepend-icon="mdi-textbox-password"
          :append-icon="inputType ? 'mdi-eye' : 'mdi-eye-off'"
          :type="inputType ? 'password' : 'text'"
          label="Token"
          @click:append="inputType = !inputType"
          @change="updateToken"
        />
        <span
          v-if="jiraURL"
        >
          Click <a @click="openUrl(jiraURL + '/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens')">here</a> to get one.
        </span>
        <v-divider 
          class="mt-2"
        />
        <v-checkbox
          v-model="notRunningNotification"
          color="primary"
          @change="save"
        >
          <div
            slot="label"
            class="light-fix"
          >
            Show desktop notification if the timer is not running
          </div>
        </v-checkbox>
        <v-switch
          v-model="darkTheme"
          :label="darkTheme ? 'Dark 🌑' : 'Light 🌞'"
        />
        <div class="text-center">
          <v-btn
            color="red"
            @click="clear"
          >
            Clear storage
          </v-btn>
          <div
            v-if="clearHint"
            class="mt-2"
          >
            Restart the application
          </div>
        </div>
      </v-card-text>
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
  import { fetchCurrentUser } from '../api/api'
  import { mapState } from 'vuex'
  import moment from 'moment'
  import { shell } from 'electron'

  export default {
    name: 'Settings',
    data() {
      return {
        popup: false,
        inputType: true,
        clearHint: false
      }
    },
    computed: {
      ...mapState({
        token: state => state.UserData.token,
        username: state => state.UserData.user.key,
        jiraURL: state => state.Jira.jiraUrl,
        formattedDate: state => moment(state.UserData.currentDate).format('YYYY-MM-DD')
      }),
      notRunningNotification: {
        get () {
          return this.$store.state.Configuration.notRunningNotification
        },
        set (value) {
          this.$store.commit('UPDATE_NOT_RUNNING_NOTIFICATION', value)
        }
      },
      darkTheme: {
        get () {
          return this.$store.state.Configuration.darkTheme
        },
        set (value) {
          this.$store.dispatch('toggleDarkTheme', { vue: this, value })
        }
      }
    },
    methods: {
      async getCurrentUser () {
        let userResponse = await fetchCurrentUser()
        if (userResponse.status === 200) {
          this.$store.dispatch('getWorklogs', { username: this.username, dateFrom: this.formattedDate, dateTo: this.formattedDate })
          this.$store.commit('UPDATE_SNACKBAR', {
            show: true,
            color: userResponse.status === 200 ? 'success' : 'error',
            text: userResponse.status === 200 ? 'Your credentials have been saved' : 'Wrong credentials'
          })
        } else {
          this.$store.commit('UPDATE_SNACKBAR', {
            show: true,
            color: 'error',
            text: userResponse
          })
        }
      },
      updateToken (value) {
        this.$store.dispatch('storeToken', { vue: this, token: value })
      },
      updateJiraURL (value) {
        this.$store.dispatch('storeUrl', { vue: this, url: value })
      },
      save () {
        this.$store.dispatch('storeSettings', { vue: this })
      },
      openUrl (url){
        shell.openExternal(url)
      },
      clear () {
        this.$db.remove({}, { multi: true })
        this.$store.commit('DONT_PERSIST')
        this.clearHint = true
      }
    }
  }
</script>

<style>

</style>
