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
import { ref, watch, computed } from "vue";
import { loadAccount, fetchDataFromBoidTable } from "src/lib/antelope"; // Adjust import path


// ---- Local States ----
const localError = ref<string|null>(null);
const isValid = ref(false);
const destinationAddress = ref("");
const boidId = ref("");
const showBoidId = ref(false); // Local toggle state for Boid ID
// A simple pattern for Telos account names: 1–12 chars [a-z 1-5.] or 13 chars
const telosNamePattern = /^[a-z1-5.]{1,13}$/;

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
    localError.value = "Invalid Telos account name (1–13 chars [a-z1-5.]).";
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
function handleToNativeTransfer() {
  console.log("handleToNativeTransfer");

  // Add this to log both address and boid ID:
  console.log("Destination Address:", destinationAddress.value);
  console.log("Boid ID:", boidId.value || "N/A");
}

</script>
