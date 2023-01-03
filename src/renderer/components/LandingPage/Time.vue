<template>
  <v-dialog
    v-model="popup"
    max-width="500px"
  >
    <template
      v-slot:activator="{ on }"
    >
      <div
        v-on="on"
      >
        <span class="time">{{ todo.seconds | spent }} / {{ todo.estimate | estimate }}</span>
      </div>
    </template>
    <v-card>
      <v-card-title>
        Time
      </v-card-title>
      <v-card-text>
        <v-text-field
          :value="todo.seconds | hours"
          :hint="'Examples: ' + durationFmtExamples"
          :error-messages="durationErrorMessage"
          :disabled="todo.published"
          label="Spent"
          clearable
          prepend-icon="mdi-clock-check-outline"
          @change="(x = changeDuration($event)) && !isNaN(x)"
          @focus="focused = true"
          @blur="focused = false"
          @click:clear="changeDuration(0)"
        />
        <v-text-field
          :value="todo.estimate | estHours"
          :hint="'Examples: ' + durationFmtExamples"
          :error-messages="durationErrorMessage"
          :disabled="todo.published"
          label="Estimate"
          clearable
          prepend-icon="mdi-progress-clock"
          @change="(x = changeEstimate($event)) && !isNaN(x)"
          @focus="focused = true"
          @blur="focused = false"
          @click:clear="changeEstimate(0)"
        />
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
  import humanizeDuration from 'humanize-duration'

  export default {
    name: 'Time',
    filters: {
      spent (val) {
        return humanizeDuration(val * 1000)
      },
      estimate (val) {
        return humanizeDuration(val)
      },
      hours (val) {
        return val / 60 / 60
      },
      estHours (val) {
        return val / 1000 / 60 / 60
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
        durationFmtExamples: '1.5, 1h30m, 1:30, 12:00 - 13:30',
        durationErrorMessage: ''
      }
    },
    methods: {
      changeDuration (value) {
        let time = this.validateDuration(value)
        this.$store.commit('UPDATE_LOCAL_ENTRY', [
          {
            id: this.todo.id,
            key: 'seconds',
            value: time,
          }
        ])
      },
      changeEstimate (value) {
        let time = this.validateDuration(value)
        this.$store.commit('UPDATE_LOCAL_ENTRY', [
          {
            id: this.todo.id,
            key: 'estimate',
            value: time * 1000,
          }
        ])
      },
      validateDuration (value) {
        let time = this.convertTimeToSeconds(value)
        if (isNaN(time)) {
          this.durationErrorMessage = 'Unsupported time format, please use one of: ' + this.durationFmtExamples
          return 0
        } else {
          this.durationErrorMessage = ''
          return time
        }
      },
      convertTimeToSeconds (time) {
        let maybeNumber = Number(time)
        if (!isNaN(maybeNumber)) return maybeNumber * 3600
        time = time.trim()
        // Example: "11:20 - 12:10", whitespaces are ignored
        let matchPeriod = time.match(/(\d{1,2}:\d\d) *- *(\d{1,2}:\d\d)/)
        // Examples: "23h59m59s", "1h 4m 30s"
        let matchHMS = time.match(/^(?:(\d+)h)?(?: *(\d+)m)?(?: *(\d+)s)?$/)
        let hms
        if (matchPeriod !== null) {
          let [[hFrom, mFrom], [hTo, mTo]] = matchPeriod.slice(1, 3).map(x => x.split(':').map(y => Number(y)))
          if (hTo < hFrom) hTo += 24
          return ((hTo - hFrom) * 60 + (mTo - mFrom)) * 60
        } else if (matchHMS !== null && matchHMS[0] !== '') {
          hms = matchHMS.slice(1, 4)
        } else if (time.includes(':')) {
          // Examples: "12:34:56", "12:00"
          hms = time.split(':', 3)
          // There must be only 1-2 digits next to the colons, empty strings are not allowed too
          if (hms.some(x => !(/^\d{1,2}$/.test(x)))) return time
          // Normalisation: hms does not always contain seconds in this format, e.g. "12:00"
          hms = hms.concat([0]).slice(0, 3)
        } else {
          return NaN
        }
        let [hours, minutes, seconds] = hms.map(x => x !== undefined ? Number(x) : 0)
        return (hours * 60 + minutes) * 60 + seconds
      }
    }
  }
</script>

<style scoped>

</style>
