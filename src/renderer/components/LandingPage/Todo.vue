<template>
  <v-list-item>
    <template v-slot:default>
      <v-list-item-action>
        <v-checkbox
          v-if="!editing"
          :input-value="todo.done"
          color="primary"
          @change="updateEntryStatus(todo)"
        />
        <v-icon
          v-else
          color="primary"
        >
          mdi-pencil
        </v-icon>
      </v-list-item-action>

      <v-list-item-content>
        <template v-if="!editing">
          <v-list-item-title
            @dblclick="!todo.published ? editing = true : editing = false"
          >
            {{ todo.comment }}
          </v-list-item-title>
          <v-list-item-subtitle>
            <Time :todo="todo" />
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            <span class="time">
              <Issue :todo="todo" />
            </span>
          </v-list-item-subtitle>
        </template>
        <v-text-field
          v-else
          ref="input"
          v-focus="editing"
          :value="todo.comment"
          clearable
          color="primary"
          flat
          hide-details
          maxlength="1023"
          solo
          @blur="doneEdit"
          @keydown.enter="doneEdit"
          @keydown.esc="cancelEdit"
        />
      </v-list-item-content>

      <v-list-item-action
        v-if="!editing"
        class="flex-row"
      >
        <v-btn
          v-if="!todo.done"
          :disabled="todo.published"
          color="primary"
          icon
          @click="toggleTimer(todo)"
        >
          <v-icon v-if="running">
            mdi-pause
          </v-icon>
          <v-icon v-else>
            mdi-play
          </v-icon>
        </v-btn>
        <v-btn
          v-else
          :disabled="todo.loading || todo.published || todo.seconds < 60"
          :loading="todo.loading"
          color="primary"
          icon
          @click="postWorklog(todo)"
        >
          <v-icon>mdi-cloud-upload</v-icon>
        </v-btn>
        <v-btn
          :disabled="todo.published || todo.loading"
          color="secondary"
          icon
          @click="removeEntry(todo)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-list-item-action>
    </template>
  </v-list-item>
</template>

<script>
import Issue from './Issue'
import Time from './Time'
import humanizeDuration from 'humanize-duration'
import { mapActions, mapState } from 'vuex'

export default {
  components: { Issue, Time },
  directives: {
    focus (el, { value }, { context }) {
      if (value) {
        context.$nextTick(() => {
          context.$refs.input.focus()
        })
      }
    }
  },
  filters: {
    spent (val) {
      return humanizeDuration(val * 1000)
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
      editing: false,
      details: false
    }
  },
  computed: {
    ...mapState({
      timerStatus: state => state.Timer.status,
      timerTodoId: state => state.Timer.todo
    }),
    running () {
      return this.timerStatus && this.todo.id === this.timerTodoId ? true : false
    }
  },
  methods: {
    ...mapActions([
      'updateEntryComment',
      'removeEntry',
      'updateEntryStatus',
      'toggleTimer',
      'postWorklog'
    ]),
    doneEdit (e) {
      const value = e.target.value.trim()
      const { todo } = this
      if (!value) {
        this.removeEntry(todo)
      } else if (this.editing) {
        this.updateEntryComment({ value: value, id: this.todo.id })
        this.editing = false
      }
    },
    cancelEdit () {
      this.editing = false
    }
  }
}
</script>

<style>
.todo-item.v-list__tile {
  height: auto;
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>
