<template>
    <q-card
    class="q-pa-md q-mb-md"
    flat
    bordered
    style="background-color: var(--primary); color: white; min-width: 300px; max-width: 500px;"
  >
    <q-card-section>
      <div class="text-h6 text-center">LOGIN</div>
    </q-card-section>
    <q-card-section>
      <q-btn
        icon="img:src/assets/MetaMask.webp"
        :label="isLoggedIn ? `Logout (${loggedAccount})` : 'Login to Telos EVM'"
        color="secondary"
        text-color="white"
        no-caps
        class="full-width"
        @click="onEvmLogin"
      >
        <q-tooltip>
          Logout: {{ loggedAccountFull }}
        </q-tooltip>
      </q-btn>
      <div v-if="isLoggedIn" class="q-mt-sm text-positive">
        {{ configuration.other.bridge_fee }} {{ configuration.other.evm_token_symbol }} Fee
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEvmStore } from 'src/stores/evmStore'
import { configuration } from 'src/lib/config'

const evmStore = useEvmStore()
const isLoggedIn = computed(() => evmStore.isConnected)
const loggedAccount = computed(() => evmStore.address ? `${evmStore.address.slice(0, 4)}...` : '')
const loggedAccountFull = computed(() => evmStore.address)

// Example login button handler
function onEvmLogin() {
  if (!evmStore.isConnected) {
    // If not connected, connect using the first connector (e.g. MetaMask)
    evmStore.login()
  } else {
    evmStore.logout()
    console.log('Already connected with address:', evmStore.address)
  }
}
</script>
