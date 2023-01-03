<template>
  <v-app class="body-1">
    <v-main>
      <v-container fluid>
        <v-row
          justify-center
          align-center
        >
          <router-view />
        </v-row>
      </v-container>
    </v-main>
    <v-snackbar
      v-model="snackbarShow"
      :color="snackbarColor"
      :timeout="snackbar.timeout"
      app
    >
      {{ snackbarText }}
      <v-btn
        text
        @click="snackbarShow = false"
      >
        Close
      </v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
  import { mapState } from 'vuex'
  import moment from 'moment'
  export default {
    data () {
      return {
        loading: false,
        snackbar: {
          timeout: 6000
        }
      }
    },
    computed: {
      ...mapState({
        snackbarText: state => state.UserData.snackbar.text,
        snackbarColor: state => state.UserData.snackbar.color,
        username: state => state.UserData.user.key,
        formattedDate: state => moment(state.UserData.currentDate).format('YYYY-MM-DD'),
        jiraUrl: state => state.Jira.jiraUrl,
        darkTheme: state => state.Configuration.darkTheme
      }),
      snackbarShow: {
        get () {
          return this.$store.state.UserData.snackbar.show
        },
        set (value) {
          this.$store.commit('UPDATE_SNACKBAR', { show: value })
        }
      }
    },
    created () {
      this.$store.commit('UPDATE_LOADING_STATE', true)
      this.$store.dispatch('initializeState', { vue: this }).then(() => {
        this.$store.dispatch('toggleDarkTheme', { vue: this, value: this.darkTheme })
        if (this.jiraUrl) {
          this.$store.dispatch('getWorklogs', { username: this.username, dateFrom: this.formattedDate, dateTo: this.formattedDate }).then(() => {
            this.$store.dispatch('initTimer')
            this.$store.commit('UPDATE_LOADING_STATE', false)
          })
        } else {
          this.$store.commit('UPDATE_LOADING_STATE', false)
        }
      })

      window.addEventListener('beforeunload', () => {
        this.$store.dispatch('storeWholeState', { vue: this })
      })
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons');
  ::-webkit-scrollbar {
    display: none; 
  }
  .clear {
    clear: both;
  }
  .overlay {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0; 
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(148, 148, 148, 0.9);
    z-index: 2;
    color: white;
    display: table;
    text-align: center;
  }
  .overlay span {
    vertical-align: middle;
    display: table-cell;
  }
</style>
