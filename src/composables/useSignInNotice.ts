import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'

/** Shown while unsigned; annotations store user UUID, not display name. */
const NAME_NOTICE = 'Please set a name so new annotations include your user id.'

/**
 * Show/hide the name-identity notice when mount and signed-in status change.
 */
export const useSignInNotice = () => {
  const messageStore = useMessageStore()
  const { addErrorMessage, removeMessage } = messageStore
  const { isSignedIn } = storeToRefs(useUserStore())

  const noticeUuids = (): string[] => (
    messageStore.messages
      .filter((d) => d.content === NAME_NOTICE)
      .map((d) => d.uuid)
  )

  const updateNameNotice = () => {
    if (isSignedIn.value) {
      noticeUuids().forEach((uuid) => removeMessage(uuid))
      return
    }
    if (noticeUuids().length === 0) {
      addErrorMessage(NAME_NOTICE, Number.POSITIVE_INFINITY)
    }
  }

  onMounted(updateNameNotice)
  watch(isSignedIn, updateNameNotice)
}
