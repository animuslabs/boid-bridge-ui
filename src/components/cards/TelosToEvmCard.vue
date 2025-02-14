<template>
  <q-card
    class="q-pa-xs q-mb-xs"
    flat
    bordered
    style="background-color: var(--primary); color: white; min-width: 300px; max-width: 500px;"
  >
    <q-card-section>
      <div class="text-h6 text-center">SEND TO</div>
    </q-card-section>
    <q-card-section>
      <q-input
        v-model="evmAddress"
        @update:model-value="handleEvmAddressChange"
        type="text"
        label="EVM destination address"
        filled
        style="background-color: var(--secondary); inline-size: 340px;"
        label-color="white"
        color="white"
        :input-style="{ color: 'white' }"
        dense
        clearable
        autogrow
      >
    </q-input>
      <div v-if="errorMsg" class="text-negative q-mt-sm">
        {{ errorMsg }}
      </div>
      <div v-else-if="isAddressValid" class="text-positive q-mt-sm">Address is valid</div>
    </q-card-section>
    <q-separator style="size: 5px; color: white;"/>
    <q-card-section>
      <div class="q-mt-sm col-auto self-center">
        <div class="row items-center">
          <q-input
            v-model.number="boidTokenAmount"
            type="number"
            label="token amount"
            filled
            style="background-color: var(--secondary); inline-size: 200px;"
            label-color="white"
            color="white"
            :input-style="{ color: 'white' }"
            dense
            clearable
            step="1"
            @blur="validateInteger"
          />
          <div style="margin-left: 10px; align-self: center; font-size: 1.2rem;">BOID</div>
        </div>
      <div class="text-accent q-mt-sm">
        <q-btn
        flat
        v-if="accName"
        :label="accName + ' balance: ' + boidBalance"
        @click="copyBoidBalance"
        aria-label="Copy balance to input"
        style="text-transform: lowercase; font-weight: bolder;"
      />
      </div>
    </div>
    </q-card-section>

  </q-card>
    <q-btn
    label="Transfer to Telos EVM"
    color="primary"
    no-caps
    class="full-width q-mt-sm"
    :disable="!isAddressValid || !isTransferValid || !canCoverFee"
    @click="handleToEVMTransfer"
  >
    <q-tooltip v-if="!isAddressValid || !isTransferValid || !canCoverFee">
      <template v-if="!isAddressValid">Invalid or empty EVM address.</template>
      <template v-else-if="!isTransferValid">Check your token amount and ensure it is valid.</template>
      <template v-else-if="!canCoverFee">Insufficient balance to cover the transfer fee.</template>
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Name, Asset } from '@wharfkit/antelope'
import { configuration } from 'src/lib/config'
import { ethers } from "ethers";
import { useSessionStore } from 'src/stores/sessionStore';
import { createEosioAndBoidTokenActions, fetchDataFromTokenBoidTable } from "src/lib/antelope";
import { ActionParams as EosioTokenActionParams } from "src/lib/types/eosio.token";
import { ActionParams as TokenBoidActionParams } from "src/lib/types/token.boid";

// Define props
defineProps<{
  canCoverFee: boolean;
}>();
// Access session store
const sessionStore = useSessionStore();

const errorMsg = ref<string|null>(null);
const isAddressValid = ref(false);
const evmAddress = ref<string>('');
const boidTokenAmount = ref<number|null>(null);
const boidBalance = ref<number>(0);
const accName = computed(() => sessionStore.session?.actor?.toString() || '');

function handleEvmAddressChange() {
  const addr = evmAddress.value.trim();

  if (!addr) {
    errorMsg.value = "Address cannot be empty.";
    isAddressValid.value = false;
  } else if (!ethers.isAddress(addr)) {
    errorMsg.value = "Invalid Ethereum address.";
    isAddressValid.value = false;
  } else {
    errorMsg.value = null;
    isAddressValid.value = true;
}}

function validateInteger() {
  if (boidTokenAmount.value !== null && !Number.isInteger(boidTokenAmount.value)) {
    boidTokenAmount.value = Math.floor(boidTokenAmount.value);
  }
}
function copyBoidBalance() {
  boidTokenAmount.value = boidBalance.value;
}
const isTransferValid = computed(() => {
  return (
    boidTokenAmount.value !== null &&
    boidTokenAmount.value <= boidBalance.value &&
    boidTokenAmount.value > 0
  );
});
async function getAccBOIDbalance(actor: string): Promise<number> {
  try {
    const data = await fetchDataFromTokenBoidTable(actor); // Adjust if necessary
    return Math.floor(data);
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return 0;
  }
}

// Handle Transfer Button Click
const handleToEVMTransfer = async () => {
  if (!isAddressValid.value || !isTransferValid.value) {
    console.error('Invalid transfer parameters');
    return;
  }

  const feeTransferAction: EosioTokenActionParams.transfer = {
    from: Name.from(sessionStore.session?.actor?.toString() || ""),
    to: Name.from(configuration.mainnet.native.contracts[2]?.contract.toString() || ""),
    quantity: Asset.from(configuration.other.bridge_fee + "000 " + configuration.other.evm_token_symbol),
    memo: "Fee",
  };

  const transferBOIDaction: TokenBoidActionParams.transfer = {
    from: Name.from(sessionStore.session?.actor?.toString() || ""),
    to: Name.from(configuration.mainnet.native.contracts[2]?.contract.toString() || ""),
    quantity: Asset.from(boidTokenAmount.value !== null ? `${boidTokenAmount.value}.0000 BOID` : "0.0000 BOID"),
    memo: evmAddress.value,
  };

  try {
    await createEosioAndBoidTokenActions(
      "transfer",
      feeTransferAction,
      "transfer",
      transferBOIDaction
    );
    // Wait briefly for the blockchain to register the transfer, then update the BOID token balance
    setTimeout(() => {
      void (async () => {
        if (sessionStore.session && sessionStore.session.actor) {
          boidBalance.value = await getAccBOIDbalance(sessionStore.session.actor.toString());
        }
      })();
    }, 2000); // 2-second delay before updating balance
  } catch (e) {
    console.error("Transfer failed:", e);
  }
};

// Update balance on session changes
watch(() => sessionStore.session, async (newSession) => {
  if (newSession && newSession.actor) {
    boidBalance.value = await getAccBOIDbalance(newSession.actor.toString());
  }
});

// Refresh BOID balance when component mounts
onMounted(async () => {
  if (sessionStore.session && sessionStore.session.actor) {
    boidBalance.value = await getAccBOIDbalance(sessionStore.session.actor.toString());
  }
});

// Force token amount to always be an integer by flooring any decimals immediately on input
watch(boidTokenAmount, (newValue) => {
  if (newValue !== null && !Number.isInteger(newValue)) {
    boidTokenAmount.value = Math.floor(newValue);
  }
});
</script>
