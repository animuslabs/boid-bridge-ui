<template>
  <q-card
    class="q-pa-md q-mb-md"
    flat
    bordered
    style="background-color: var(--primary); color: white; min-width: 300px; max-width: 500px;"
  >
    <q-card-section>
      <div class="text-h6 text-center">Login</div>
    </q-card-section>
    <q-card-section>
      <q-btn
        :label="isLoggedIn ? `Logout (${loggedAccount || ''})` : 'Login to Telos EVM'"
        color="secondary"
        text-color="white"
        no-caps
        class="full-width"
        @click="onEvmLogin($event)"
      />
      <!-- Show balance if logged in -->
      <div v-if="isLoggedIn" class="q-mt-sm text-positive">
        0.5 TLOS Fee
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// Correctly define the props
defineProps<{
  isLoggedIn: boolean;
  loggedAccount?: string | undefined;
  // accountBalance: string;
  onEvmLogin: (evt: Event) => void;
}>();
</script>
