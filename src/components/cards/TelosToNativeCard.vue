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
      <!-- Destination Address -->
      <q-input
        v-model="destinationAddress"
        type="text"
        label="Destination Address"
        filled
        stack-label
        style="background-color: var(--secondary); inline-size: 340px;"
        :readonly="showBoidId"
        :style="computedInputStyle"
        label-color="white"
        color="white"
        :input-style="{ color: 'white' }"
        dense
        clearable
        @input="handleDestinationAddressChange"
      />
      <!-- If sending to Boid ID, show the Boid ID field -->
      <q-input
        v-if="showBoidId"
        v-model="boidId"
        type="text"
        label="Boid ID"
        filled
        stack-label
        :style="getInputStyle()"
        label-color="white"
        color="white"
        :input-style="{ color: 'white' }"
        dense
        clearable
        class="q-mt-sm"
        @input="handleBoidIdChange"
      />

      <!-- Validation Error / Success messages -->
      <div v-if="localError" class="text-negative q-mt-sm">
        {{ localError }}
      </div>
      <div v-else-if="isValid" class="text-positive q-mt-sm">
        Address is valid.
      </div>

      <!-- Toggle for sending to Boid ID -->
      <q-toggle
        v-model="showBoidId"
        label="Send to Boid ID"
        color="secondary"
        class="q-mt-md"
      />
    </q-card-section>
    <q-separator style="size: 5px; color: white;"/>
    <q-card-section>
      <div class="q-mt-sm col-auto self-center">
        <div class="row items-center">
          <q-input
            v-model.number="boidTokenAmountEvm"
            type="number"
            label="token amount"
            filled
            stack-label
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
        v-if="loggedAccount"
        :label="loggedAccount + ' balance: ' + (Number(accountEvmBOIDBalance) / 1e18).toFixed(0)"
        @click="copyBoidBalance"
        aria-label="Copy balance to input"
        style="text-transform: lowercase; font-weight: bolder;"
      >
        <q-tooltip>
          {{ loggedAccountFull }}
        </q-tooltip>
      </q-btn>
      </div>
    </div>
    </q-card-section>
  </q-card>
  <q-btn
    label="Transfer to Telos Native"
    color="primary"
    no-caps
    class="full-width q-mt-sm"
    :disable="!isValid"
    @click="handleToNativeTransfer()"
  >
    <q-tooltip v-if="!isValid">
      <template v-if="!isValid">Invalid or empty address.</template>
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { ref, watch, computed, watchEffect, onMounted, onActivated } from "vue";
import { loadAccount, fetchDataFromBoidTable } from "src/lib/antelope"; // Adjust import path
import { useEvmStore } from 'src/stores/evmStore'
import { parseEther } from 'ethers';

const evmStore = useEvmStore()

// ---- Local States ----
const localError = ref<string|null>(null);
const isValid = ref(false);
const destinationAddress = ref("");
const boidId = ref("");
const showBoidId = ref(false); // Local toggle state for Boid ID
const boidTokenAmountEvm = ref<number|null>(null);
const loggedAccount = computed(() => evmStore.address ? `${evmStore.address.slice(0, 4)}...` : '')
const loggedAccountFull = computed(() => evmStore.address)

// A simple pattern for Telos account names: 1–12 chars [a-z 1-5.] or 12 chars
const telosNamePattern = /^[a-z1-5.]{1,12}$/;

const accountEvmBOIDBalance = ref('0')


async function updateBoidBalance(): Promise<void> {
  if (evmStore.isConnected && evmStore.address) {
    try {
      const balance = await evmStore.getBOIDTokenBalance(evmStore.address);
      accountEvmBOIDBalance.value = balance.toString();
    } catch (error) {
      console.error("Error fetching TLOS balance:", error);
      accountEvmBOIDBalance.value = "0";
    }
  } else {
    accountEvmBOIDBalance.value = "0";
  }
}

// Watch for changes in the connection status and fetch balance
watchEffect(() => {
  void updateBoidBalance();
});

// Watch for destinationAddress changes
watch(destinationAddress, (newAddress) => {
  handleDestinationAddressChange(newAddress);
});

// Watch for boidId changes
watch(boidId, (newBoidId) => {
  handleBoidIdChange(newBoidId);
});

// Watch for changes in the toggle
watch(showBoidId, (newVal) => {
  if (newVal) {
    destinationAddress.value = "boid";
    boidId.value = "";
    localError.value = null;
    isValid.value = false;
  }
});

// Watch for boidId changes
watch(boidId, (newBoidId) => {
  handleBoidIdChange(newBoidId);
});

// Watch for changes in the toggle
watch(showBoidId, (newVal) => {
  if (newVal) {
    destinationAddress.value = "boid";
    boidId.value = "";
    localError.value = null;
    isValid.value = false;
  }
}, { immediate: true });

let accountTimer: ReturnType<typeof setTimeout> | null = null;

// ---------- Normal Telos Address Handler ----------
function handleDestinationAddressChange(val: string | number | null) {
  if (showBoidId.value) {
    // Skip validation if showBoidId is true
    return;
  }
  const address = (val ?? "").toString().trim();
  destinationAddress.value = address;
  localError.value = null;
  isValid.value = false;

  // Basic pattern check
  if (!address || !telosNamePattern.test(address)) {
    localError.value = "Invalid Telos account name (1–12 chars [a-z1-5.]).";
    isValid.value = false;
    return;
  }

  // Debounce: wait 800ms before calling validateAddressOnChain
  if (accountTimer) clearTimeout(accountTimer);
  accountTimer = setTimeout(() => {
    void validateAddressOnChain(address); // Explicitly mark as ignored with `void`
  }, 800);
}

// ---------- Async Function for Validation ----------
async function validateAddressOnChain(address: string): Promise<void> {
  try {
    const accountData = await loadAccount(address); // Call the on-chain API
    if (!accountData) {
      localError.value = `Account "${address}" does not exist.`;
      isValid.value = false;
    } else {
      localError.value = null;
      isValid.value = true;
    }
  } catch (error) {
    console.error("Error checking Telos account:", error);
    localError.value = "Error verifying account on-chain.";
    isValid.value = false;
  }
}

function copyBoidBalance() {
  boidTokenAmountEvm.value = Math.floor(Number(accountEvmBOIDBalance.value) / 1e18);
}

// ---------- Boid ID Handler ----------
let boidTimer: ReturnType<typeof setTimeout> | null = null;

function handleBoidIdChange(val: string | number | null) {
  const id = (val ?? "").toString().trim();
  boidId.value = id;
  localError.value = null;
  isValid.value = false;

  // If empty, exit early
  if (!id) {
    localError.value = "Boid ID cannot be empty.";
    isValid.value = false;
    return;
  }

  // Debounce check
  if (boidTimer) clearTimeout(boidTimer);
  boidTimer = setTimeout(() => {
    // We call an async function, but do NOT make this callback async
    checkBoidIdDebounced(id).catch((error) => {
      console.error("Error validating Boid ID:", error);
      localError.value = "Error validating Boid ID. Try again.";
      isValid.value = false;
    });
  }, 800);
}

// A separate async function for checking Boid ID existence
async function checkBoidIdDebounced(id: string) {
  try {
    const data = await fetchDataFromBoidTable("accounts");
    if (!data) {
      localError.value = "Could not load Boid table data.";
      isValid.value = false;
      return;
    }

    const found = data.some((account) => account?.boid_id?.toString() === id);
    if (found) {
      localError.value = null;
      isValid.value = true;
    } else {
      localError.value = `Boid ID not found.`;
      isValid.value = false;
    }
  } catch (error: unknown) {
    console.error("Error validating Boid ID:", error);
    localError.value = "Error validating Boid ID. Try again.";
    isValid.value = false;
  }
}


const getInputStyle = () => ({
  backgroundColor: "var(--secondary)",
  borderColor: "transparent",
});
const getInputDarkStyle = () => ({
  backgroundColor: "var(--primary)",
  borderColor: "transparent",
});
const computedInputStyle = computed(() => {
  return showBoidId.value ? getInputDarkStyle() : getInputStyle();
});
function validateInteger() {
  if (boidTokenAmountEvm.value !== null && !Number.isInteger(boidTokenAmountEvm.value)) {
    boidTokenAmountEvm.value = Math.floor(boidTokenAmountEvm.value);
  }
}
async function handleToNativeTransfer() {
  if (!boidTokenAmountEvm.value) {
    console.error("No token amount provided");
    return;
  }
  const amount = parseEther(boidTokenAmountEvm.value.toString());
  console.log("handleToNativeTransfer");
  console.log("boidTokenAmountEvm", boidTokenAmountEvm.value);
  console.log("amount", amount);

  // Add this to log both address and boid ID:
  console.log("Destination Address:", destinationAddress.value);
  console.log("Boid ID:", boidId.value || "N/A");

  // Read the current allowance
  let currentAllowance = await evmStore.getTokenAllowance(loggedAccountFull.value as `0x${string}`);
  console.log("currentAllowance", currentAllowance);

  // Compare allowance < desired amount
  if (currentAllowance < amount) {
    console.log(
      `Current allowance = ${currentAllowance.toString()}. ` +
      `Needs approval for at least ${amount.toString()}...`
    );

    // Approve the token
    const approveTx = await evmStore.userApprovedToken(amount);
    if (!approveTx) {
      console.error("approveTx transaction not returned");
      return;
    }

    // Optionally re-check allowance (if you like) to confirm it updated
    currentAllowance = await evmStore.getTokenAllowance(evmStore.address as `0x${string}`);
    console.log(`New allowance: ${currentAllowance.toString()}`);
  } else {
    console.log(
      `Sufficient allowance: ${currentAllowance.toString()} (needed: ${amount.toString()})`
    );
  }

  // Now do the bridging transaction
  const bridgeTx = await evmStore.bridgeToken(
    amount,
    destinationAddress.value,
    boidId.value ? `deposit boid_id=${boidId.value}` : "Bridge Transfer"
  );
  // refresh BOID balance with a delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  await updateBoidBalance();
  if (!bridgeTx) {
    console.error("bridgeTx transaction not returned");
    return;
  }
}

// Force token amount to always be an integer by flooring any decimals immediately on input
watch(boidTokenAmountEvm, (newValue) => {
  if (newValue !== null && !Number.isInteger(newValue)) {
    boidTokenAmountEvm.value = Math.floor(newValue);
  }
});

onMounted(async () => {
  await updateBoidBalance();
});

onActivated(async () => {
  await updateBoidBalance();
});
</script>
