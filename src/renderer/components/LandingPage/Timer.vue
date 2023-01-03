<template>
  <v-container>
    <v-row
      justify="center"
      align-content="center"
      align="center"
    >
      <v-col
        cols="8"
      >
        <v-tooltip
          bottom
          open-delay="800"
        >
          <template v-slot:activator="{ on }">
            <div
              class="timer text-h3"
              :class="emptyEntry || publishedEntry || todayLog.length === 0 ? 'text--disabled' : ''"
              @click="toggle"
              @dblclick="createNew"
              v-on="on"
            >
              <span class="hours">{{ hours | twoDigits }}</span>:<span class="minutes">{{ minutes | twoDigits }}</span>:<span class="seconds">{{ seconds | twoDigits }}</span>
            </div>
          </template>
          <span>
            <b>Click</b> to toggle the timer<br>
            <b>Double click</b> to add a new entry
          </span>
        </v-tooltip>
      </v-col>
      <v-col
        cols="4"
      >
        <div class="text-caption text-uppercase">
          Total:
          <span
            class="font-weight-black"
            v-text="totalToday"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import { mapState, mapGetters } from 'vuex'
  import moment from 'moment'
  var Mousetrap = require('mousetrap')

  export default {
    name: 'Timer',
    filters: {
      twoDigits (value) {
        if (value.toString().length <= 1) {
          return '0' + value.toString()
        }
        return value.toString()
      }
    },
    data () {
      return {
        interval: null,
        running: false,
        beep: new Audio('/static/beep.wav'),
        timer: null
      }
    },

    computed: {
      ...mapState({
        playBeep: state => state.Configuration.config.beep,
        notRunningNotification: state => state.Configuration.config.notRunningNotification,
        timerStatus: state => state.Timer.status,
        started: state => state.Timer.started
      }),
      ...mapGetters([
        'totalToday',
        'todayLog',
        'currentEntry',
        'duration'
      ]),
      emptyEntry () {
        return Object.keys(this.currentEntry).length === 0 && this.currentEntry.constructor === Object
      },
      publishedEntry () {
        return this.currentEntry.published
      },
      seconds () {
        return Math.trunc(this.duration) % 60
      },
      minutes () {
        return Math.trunc(this.duration / 60) % 60
      },
      hours () {
        return Math.trunc(this.duration / 60 / 60)
      }
    },
    watch: {
      duration () {
        if (this.duration % 3600 === 0 && this.playBeep) {
          this.beep.play()
        }
      },
      timerStatus () {
        let options = {
          body: 'The timer is not running'
        }
        if (this.timerStatus === false && this.notRunningNotification) {
          this.interval = setInterval(() => {
            let notification = new Notification('Jira Timeboxer', options)
            notification.onclick = () => {
              this.notificationClick()
            }
          }, 600000)
        } else if (this.timerStatus === true) {
          clearInterval(this.interval)
        }
      },
      todayLog () {
        if (this.todayLog.length === 0) {
          this.$store.commit('UPDATE_TIMER', { duration: 0 })
        }
      }
    },
    destroyed () {
      clearInterval(this.interval)
    },
    mounted () {
      let self = this
      Mousetrap.bind('ctrl+space', function () {
        self.toggle()
      })
      Mousetrap.bind('ctrl+e', function () {
        self.reset()
      })

      this.$electron.ipcRenderer.on('toggle', () => {
        self.toggle()
      })

      this.$store.dispatch('initTimer')
    },
    methods: {
      toggle () {
        if (this.publishedEntry || this.emptyEntry || this.todayLog.length === 0) return
        this.$store.dispatch('toggleTimer')
      },
      reset () {
        if (this.timerStatus) { this.toggle() }
        this.$store.commit('UPDATE_LOCAL_ENTRY', [
          {
            id: this.currentEntry.id,
            key: 'seconds',
            value: 0,
          }
        ])
      },
      createNew () {
        this.$store.dispatch('createNewEntry')
      },
      notificationClick () {
        this.$electron.ipcRenderer.send('notification-click')
      }
    }
  }
</script>

<style scoped>
  .timer {
    user-select: none;
    cursor: pointer;
    justify-content: center;
    display: flex;
  }
</style>
