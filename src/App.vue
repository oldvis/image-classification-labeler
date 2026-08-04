<template>
  <div
    class="h-full w-full"
    flex="~ col"
  >
    <TheNavBar />
    <main
      class="grow min-h-0"
      flex="~ col"
    >
      <RouterView />
    </main>
    <VMessages />
  </div>
</template>
