import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'

const SIGN_IN_NOTICE = 'Please sign in if you want to save name in the exported annotations.'

/**
 * Show/Hide sign in notice
 * when the component is mounted and when sign in status updates.
 */
export const useSignInNotice = () => {
  const { addErrorMessage } = useMessageStore()
  const { isSignedIn } = storeToRefs(useUserStore())

  const updateSignInNotice = () => {
    if (isSignedIn.value) return
    addErrorMessage(SIGN_IN_NOTICE, Number.POSITIVE_INFINITY)
  }

  onMounted(updateSignInNotice)
  watch(isSignedIn, updateSignInNotice)
}
