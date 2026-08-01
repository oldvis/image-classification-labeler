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
const onClickSignIn = () => {
  trySignIn(name.value)
  if (isSignedIn.value) {
    addSuccessMessage('Login Succeeded')
    dialog.value = false
  }
  else {
    addErrorMessage('Login Failed')
  }
}
</script>

<template>
  <VDialog :dialog="dialog">
    <template #activator>
      <button
        v-if="!isSignedIn"
        icon-btn
        class="mx-2 px-2 border-x border-gray-200"
        @click="dialog = !dialog"
      >
        Sign in
      </button>
      <div
        v-else
        class="mx-2 my-auto px-2 border-x border-gray-200"
      >
        Hi, {{ signedInName }}
        <button
          icon-btn
          class="pl-2"
          @click="signOut"
        >
          Sign out
        </button>
      </div>
    </template>
    <template #default>
      <div
        class="p-4 rounded max-w-md shadow"
        bg="white dark:gray-700"
      >
        <div class="flex">
          <div class="text-xl font-bold">
            Sign in
          </div>
          <button
            icon-btn
            class="ml-auto"
            title="Close"
            @click="dialog = false"
          >
            <div class="i-fa6-solid:xmark" />
          </button>
        </div>
        <div class="p-4">
          <div class="space-y-6">
            <div>
              <label
                for="user"
                class="mb-2 block"
              >
                Name
              </label>
              <input
                id="user"
                v-model="name"
                placeholder="Name"
                required
                class="text-sm p-2.5 rounded dark:placeholder-gray-400"
                bg="gray-50 dark:gray-600"
                border="~ gray-300 dark:gray-500"
              >
            </div>
            <button
              btn
              @click="onClickSignIn"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </template>
  </VDialog>
</template>
