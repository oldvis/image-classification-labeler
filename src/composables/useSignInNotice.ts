import { storeToRefs } from 'pinia'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'

const NAME_NOTICE = 'Set a Name in the header so new annotations include your user id.'

/**
 * Soft identity nudge via snackbar (not a permanent layout bar).
 * Call once when the annotate surface is ready.
 */
export const useSignInNotice = () => {
  const { isSignedIn } = storeToRefs(useUserStore())
  const { addInfoMessage } = useMessageStore()

  const notifyIfUnsigned = (): void => {
    if (!isSignedIn.value) {
      addInfoMessage(NAME_NOTICE)
    }
  }

  return { notifyIfUnsigned }
}
