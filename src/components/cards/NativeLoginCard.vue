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
        icon="img:./AnchorWallet.png"
        :label="isLoggedIn ? `Logout ${loggedAccount || ''}` : 'Login to Telos Native'"
        color="secondary"
        text-color="white"
        no-caps
        rounded
        class="full-width glossy"
        @click="onNativeLogin($event)"
      />
      <!-- Show balance if logged in -->
      <div v-if="isLoggedIn" class="q-mt-sm">
      <div class="text-positive">
          Unstaked balance: <b>{{ accountBalance }}</b>
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
import { computed } from 'vue'
import { configuration } from 'src/lib/config'
// Correctly define the props
const props = defineProps<{
  isLoggedIn: boolean;
  loggedAccount?: string | undefined;
  accountBalance: string;
  onNativeLogin: (evt: Event) => void;
}>();

// Use a computed to check if the TLOS amount is >= 0.5
const canCoverFee = computed(() => {
  // split "10.0000 TLOS" into ["10.0000", "TLOS"]
  const [balanceString] = props.accountBalance.split(" ");
  const balanceNum = parseFloat(balanceString || "0");
  return balanceNum >= 0.5;
});
</script>
