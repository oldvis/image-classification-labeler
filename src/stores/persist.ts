/** Prefix Pinia persist keys so this app does not collide with other labelers on the same origin. */
export const persistKey = (storeId: string): string => (
  `image-classification-labeler:${storeId}`
)
