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
        icon="img:./MetaMask.webp"
        :label="isEvmLoggedIn ? `Logout (${loggedEvmAccount})` : 'Login to Telos EVM'"
        color="secondary"
        text-color="white"
        no-caps
        class="full-width"
        @click="onEvmLogin"
      >
        <q-tooltip v-if="isEvmLoggedIn">
          Logout: {{ loggedEvmAccountFull }}
        </q-tooltip>
        <q-tooltip v-else>
          Login to Telos EVM
        </q-tooltip>
      </q-btn>
      <div v-if="isEvmLoggedIn" class="q-mt-sm text-positive">
        <div>
          Balance: <b>{{ accountEvmTlosBalance }}</b>
        </div>
        <div v-if="canCoverFee" class="text-amber-10">
          {{ configuration.other.bridge_fee }} {{ configuration.other.evm_token_symbol }} Fee
        </div>
        <div v-if="!canCoverFee" class="text-negative text-bold">
          {{ configuration.other.bridge_fee }} {{ configuration.other.evm_token_symbol }} Fee (Not enough {{ configuration.other.evm_token_symbol }}!)
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useEvmStore } from 'src/stores/evmStore'
import { configuration } from 'src/lib/config'

const evmStore = useEvmStore()
const isEvmLoggedIn = computed(() => evmStore.isConnected)
const loggedEvmAccount = computed(() => evmStore.address ? `${evmStore.address.slice(0, 4)}...` : '')
const loggedEvmAccountFull = computed(() => evmStore.address)
const accountEvmTlosBalance = ref('0')

watchEffect(() => {
  async function updateTlosBalance() {
    if (evmStore.address) {
      accountEvmTlosBalance.value = await evmStore.getTLOSNativeBalance(evmStore.address);
    }
  }
  // Call the async function without returning it
  void updateTlosBalance();
});

// Example login button handler
function onEvmLogin() {
  if (!evmStore.isConnected) {
    evmStore.login()
  } else {
    evmStore.logout()
    console.log('Already connected with address:', evmStore.address)
  }
}

// Use a computed to check if the TLOS amount is >= 0.5
const canCoverFee = computed(() => {
  const balanceNum = parseFloat(accountEvmTlosBalance.value || '0')
  return balanceNum >= 0.5
})
</script>
