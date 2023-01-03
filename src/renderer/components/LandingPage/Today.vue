<template>
  <v-container>
    <v-card>
      <v-list class="pa-0">
        <v-list-item>
          <template v-slot:default>
            <v-list-item-action>
              <v-checkbox
                v-if="todayLog.length > 0"
                color="primary"
                :input-value="allChecked"
                @change="toggleAllEntriesStatus(allChecked)"
              />
              <v-icon
                v-else
                color="primary"
              >
                mdi-check
              </v-icon>
            </v-list-item-action>

            <v-list-item-content>
              <v-text-field
                v-model="newTodo"
                label="Add your to-do here"
                autofocus
                autocomplete="off"
                clearable
                color="primary"
                flat
                hide-details
                maxlength="1023"
                placeholder="Some important task 30m"
                solo
                @keydown.enter="addTodo"
              />
            </v-list-item-content>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
    <v-skeleton-loader
      v-if="dateLoading"
      type="list-item-two-line@5"
      tile
    />
    <v-card
      v-else
      v-show="todayLog.length"
      class="mt-3"
    >
      <v-progress-linear
        v-model="progressPercentage"
        class="my-0"
      />
      <v-card-actions
        v-show="todayLog.length"
        class="px-3"
      >
        <span class="primary--text">
          {{ remaining }} {{ remaining | pluralize('item') }} left
        </span>
        <v-spacer />
        <span class="secondary--text">
          {{ totalWorkedToday }} / {{ totalEstimatedToday }}
        </span>
        <v-spacer />
        <v-btn-toggle
          v-show="todayLog.length"
          v-model="visibility"
          class="elevation-0"
          mandatory
        >
          <v-btn
            v-for="(val, key) in filters"
            :key="key"
            :value="key"
            class="mx-0"
            small
          >
            {{ key | capitalize }}
          </v-btn>
        </v-btn-toggle>
      </v-card-actions>
      <v-list class="pa-0">
        <template v-for="todo in filteredTodos">
          <v-divider :key="`${todo.id}-divider`" />
          <Todo
            :key="todo.id"
            :todo="todo"
          />
        </template>
      </v-list>
    </v-card>
    <div class="text-end">
      <v-btn
        v-show="remaining > 0 && visibility === 'active'"
        class="mt-3"
        color="primary"
        @click="postponeActive"
      >
        Move to tomorrow
        <v-icon right>
          mdi-calendar-arrow-right
        </v-icon>
      </v-btn>
      <v-btn
        v-show="todayLog.length > remaining"
        class="mt-3"
        color="primary"
        @click="uploadDone"
      >
        Upload completed
        <v-icon right>
          mdi-cloud-upload
        </v-icon>
      </v-btn>
      <v-btn
        v-show="todayLog.length > remaining"
        class="mt-3"
        color="secondary"
        @click="removeDone"
      >
        Clear completed
        <v-icon right>
          mdi-delete
        </v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script>
import moment from 'moment'
import { mapActions, mapGetters, mapState } from 'vuex'
import Todo from './Todo.vue'

const filters = {
  all: todayLog => todayLog,
  active: todayLog => todayLog.filter(todo => !todo.done),
  completed: todayLog => todayLog.filter(todo => todo.done),
  published: todayLog => todayLog.filter(todo => todo.published)
}

export default {
  components: { Todo },
  filters: {
    pluralize: (n, w) => n === 1 ? w : (w + 's'),
    capitalize: s => s.charAt(0).toUpperCase() + s.slice(1)
  },
  data () {
    return {
      newTodo: '',
      filters: filters,
      visibility: 'all'
    }
  },
  computed: {
    ...mapGetters([
      'todayLog',
      'totalWorkedToday',
      'totalEstimatedToday'
    ]),
    ...mapState({
      formattedDate: state => moment(state.UserData.currentDate).format('YYYY-MM-DD'),
      dateLoading: state => state.UserData.dateLoading,
      username: state => state.UserData.user.key
    }),
    allChecked () {
      return this.todayLog.every(todo => todo.done)
    },
    filteredTodos () {
      return filters[this.visibility](this.todayLog)
    },
    remaining () {
      return this.todayLog.filter(todo => !todo.done).length
    },
    progressPercentage () {
      const len = this.todayLog.length
      return ((len - this.remaining) * 100) / len
    }
  },
  watch: {
    formattedDate () {
      this.loadWorklogs()
    }
  },
  methods: {
    ...mapActions([
      'toggleAllEntriesStatus',
      'removeDone',
      'uploadDone',
      'postponeActive'
    ]),
    addTodo () {
      let text = this.newTodo.trim()
      let { todoText, estimate } = this.parseEstimate(text)
      if (todoText) {
        this.$store.dispatch('createNewEntry', { todoText, estimate })
      }
      this.newTodo = ''
    },
    parseEstimate (text) {
      let todoWordsArray = text.split(' ')
      
      if (!todoWordsArray) {
        return {
          todoText: '',
          estimate: 0
        }
      }

      let estimateWords = []
      let days
      let hours
      let minutes
      let seconds

      todoWordsArray.forEach((word) => {
        if (word.length > 0) {
          const lastChar = word.slice(-1)
          const amount = parseInt(word.slice(0, word.length - 1), 10)

          if (lastChar === 's') {
            seconds = amount
            if (typeof seconds === 'number' && !isNaN(seconds)) estimateWords.push(word)
          }
          if (lastChar === 'm') {
            minutes = amount
            if (typeof minutes === 'number' && !isNaN(minutes)) estimateWords.push(word)
          }
          if (lastChar === 'h') {
            hours = amount
            if (typeof hours === 'number' && !isNaN(hours)) estimateWords.push(word)
          }
          if (lastChar === 'd') {
            days = amount
            if (typeof days === 'number' && !isNaN(days)) estimateWords.push(word)
          }
        }
      })

      if (typeof seconds === 'number' || typeof minutes === 'number' || typeof hours === 'number' || typeof days === 'number') {
        let cleanedText = text
        estimateWords.map((word) => {
          cleanedText = cleanedText.replace(word, '')
        })

        seconds = (typeof seconds === 'number' && !isNaN(seconds)) ? seconds : 0
        minutes = (typeof minutes === 'number' && !isNaN(minutes)) ? minutes : 0
        hours = (typeof hours === 'number' && !isNaN(hours)) ? hours : 0
        days = (typeof days === 'number' && !isNaN(days)) ? days : 0

        return {
          todoText: cleanedText,
          estimate: +(seconds * 1000)
          + (minutes * 1000 * 60)
          + (hours * 1000 * 60 * 60)
          + (days * 1000 * 60 * 60 * 24)
        }

      } else {
        return {
          todoText: text,
          estimate: 0
        }
      }
    },
    loadWorklogs () {
      this.$store.dispatch('getWorklogs', { username: this.username, dateFrom: this.formattedDate, dateTo: this.formattedDate })
    }
  }
}
</script>

<style>
  h1 {
    opacity: 0.3;
  }
  .v-text-field.v-input__slot {
    padding: 0 !important;
  }
</style>
