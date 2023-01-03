<template>
  <v-container>
    <Settings />
    <v-scale-transition
      hide-on-leave
    >
      <v-skeleton-loader
        v-if="appLoading"
        type="card-heading, article, actions, article, actions"
      />
      <v-row
        v-else
        class="justify-center"
      >
        <v-menu
          v-model="picker"
          close-on-content-click
          :nudge-right="40"
          transition="scale-transition"
          offset-y
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <div
              class="date mb-3"
              v-on="on"
            >
              <h1>
                {{ currentDate | day }}
              </h1>
              <h5>
                {{ currentDate | month }}
              </h5>
            </div>
          </template>
          <v-date-picker
            v-model="currentDate"
            no-title
            first-day-of-week="1"
            scrollable
            show-week
            @input="picker = false"
          />
        </v-menu>
        <Today />
      </v-row>
    </v-scale-transition>
  </v-container>
</template>

<script>
  import moment from 'moment'
  import Today from './LandingPage/Today'
  import Settings from './Settings'
  import { mapState } from 'vuex'

  export default {
    name: 'LandingPage',
    components: { Today, Settings },
    filters: {
      day (val) {
        return moment(val).format('dddd')
      },
      month (val) {
        return moment(val).format('MMMM Do')
      }
    },
    data () {
      return {
        loading: false,
        picker: false
      }
    },
    computed: {
      ...mapState({
        appLoading: state => state.UserData.appLoading
      }),
      currentDate: {
        get () {
          return moment(this.$store.state.UserData.currentDate).format('YYYY-MM-DD').toString()
        },
        set (value) {
          let dateFormat = moment(value, 'YYYY-MM-DD').toDate()
          this.$store.commit('SET_DATE', dateFormat)
        }
      }
    }
  }
</script>

<style scoped>
  .date {
    user-select: none;
    cursor: pointer;
  }
</style>
