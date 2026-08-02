import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'

/** Shown while unsigned; annotations store user UUID, not display name. */
const SIGN_IN_NOTICE = 'Please sign in to attach your identity (user id) to new annotations.'

/**
 * Show/hide the sign-in notice when mount and sign-in status change.
 */
export const useSignInNotice = () => {
  const messageStore = useMessageStore()
  const { addErrorMessage, removeMessage } = messageStore
  const { isSignedIn } = storeToRefs(useUserStore())

  const noticeUuids = (): string[] => (
    messageStore.messages
      .filter((d) => d.content === SIGN_IN_NOTICE)
      .map((d) => d.uuid)
  )

  const updateSignInNotice = () => {
    if (isSignedIn.value) {
      noticeUuids().forEach((uuid) => removeMessage(uuid))
      return
    }
    if (noticeUuids().length === 0) {
      addErrorMessage(SIGN_IN_NOTICE, Number.POSITIVE_INFINITY)
    }
  }

  onMounted(updateSignInNotice)
  watch(isSignedIn, updateSignInNotice)
}
