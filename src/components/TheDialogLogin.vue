<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'

const dialog = ref(false)
const userStore = useUserStore()
const { isSignedIn, name: signedInName } = storeToRefs(userStore)
const { signOut, trySignIn } = userStore
const { addErrorMessage, addSuccessMessage } = useMessageStore()
const name = ref('')

const onSubmit = (): void => {
  trySignIn(name.value)
  if (isSignedIn.value) {
    addSuccessMessage('Name saved')
    dialog.value = false
    name.value = ''
  }
  else {
    addErrorMessage('Name required')
  }
}
</script>

<template>
  <VDialog :dialog="dialog">
    <template #activator>
      <button
        v-if="!isSignedIn"
        type="button"
        btn-secondary
        class="flex gap-1 items-center"
        title="Set a local annotator name for new labels"
        @click="dialog = !dialog"
      >
        <div class="i-fa6-regular:user my-auto" />
        <span>Set annotator name</span>
      </button>
      <div
        v-else
        class="flex gap-1 items-center"
      >
        <button
          type="button"
          btn-secondary
          class="flex gap-1 items-center"
          title="Change annotator name"
          @click="dialog = !dialog"
        >
          <div class="i-fa6-regular:user my-auto" />
          <span>Hi, {{ signedInName }}</span>
        </button>
        <button
          type="button"
          btn-ghost
          title="Clear annotator name"
          @click="signOut"
        >
          Clear
        </button>
      </div>
    </template>
    <template #default>
      <form
        dialog-panel
        role="dialog"
        aria-labelledby="annotator-name-title"
        @submit.prevent="onSubmit"
      >
        <div class="status-strip border-b border-gray-200 dark:border-gray-700">
          <div
            id="annotator-name-title"
            strip-label
          >
            Annotator name
          </div>
          <button
            type="button"
            icon-btn
            class="ml-auto"
            title="Close"
            @click="dialog = false"
          >
            <div class="i-fa6-solid:xmark" />
          </button>
        </div>

        <div dialog-body>
          <label
            for="user"
            class="text-sm font-semibold"
          >
            Name
          </label>
          <input
            id="user"
            v-model="name"
            name="name"
            placeholder="e.g. Alex"
            required
            autocomplete="nickname"
            dialog-field
          >
          <p class="strip-meta m-0">
            Shown locally only. Saved annotations use a generated id.
          </p>
        </div>

        <div class="status-strip border-t border-gray-200 gap-1.5 justify-end dark:border-gray-700">
          <button
            type="button"
            btn-secondary
            title="Cancel without saving"
            @click="dialog = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            btn
            title="Save annotator name"
          >
            Save
          </button>
        </div>
      </form>
    </template>
  </VDialog>
</template>
