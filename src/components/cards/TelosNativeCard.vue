<template>
  <q-card
    class="q-pa-xs q-mb-xs"
    flat
    bordered
    style="background-color: var(--primary); color: white; min-width: 300px; max-width: 500px;"
  >
    <q-card-section>
      <div class="text-h6 text-center">Telos Native</div>
    </q-card-section>

    <q-card-section>
      <!-- Destination Address -->
      <q-input
        :model-value="destinationAddress"
        @update:model-value="handleDestinationAddressChange"
        type="text"
        label="Destination Address"
        filled
        :readonly="props.showBoidId"
        :style="getInputStyle()"
        label-color="white"
        color="white"
        :input-style="{ color: 'white' }"
        dense
        clearable
      />
      <!-- If sending to Boid ID, show the Boid ID field -->
      <q-input
        v-if="props.showBoidId"
        :model-value="boidId"
        @update:model-value="handleBoidIdChange"
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
        :model-value="props.showBoidId"
        @update:model-value="$emit('update:showBoidId', $event)"
        label="Send to Boid ID"
        color="secondary"
        class="q-mt-md"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { loadAccount, fetchDataFromBoidTable } from "src/lib/antelope"; // Adjust import path

// ----- Props & Emits -----
const props = defineProps({
  modelValue: String,       // Destination address from parent
  showBoidId: Boolean,      // Whether the Boid ID toggle is active
});
const emit = defineEmits(["update:modelValue", "update:showBoidId", "update:isValid", "update:boidId"]);

// ---- Local States ----
const localError = ref<string|null>(null);
const isValid = ref(false);

// This is the "destination address" for normal Telos accounts
// We only use it if !props.showBoidId
const destinationAddress = ref("");

// This is the "Boid ID" for boid scenario
const boidId = ref("");

// A simple pattern for Telos account names: 1–12 chars [a-z1-5.]
// or 13 chars. Adjust if you require 13-limit:
const telosNamePattern = /^[a-z1-5.]{1,13}$/;

// ---- Watch Toggles ----
watch(
  () => props.showBoidId,
  (newVal) => {
    if (newVal) {
      destinationAddress.value = "boid";
      emit("update:modelValue", "boid");

      boidId.value = "";
      localError.value = null;
      isValid.value = false;
    }
  },
  { immediate: true }
);



let accountTimer: ReturnType<typeof setTimeout> | null = null;
// ---------- Normal Telos Address Handler ----------
function handleDestinationAddressChange(val: string | number | null) {
  const address = (val ?? "").toString().trim();
  destinationAddress.value = address;
  localError.value = null;
  isValid.value = false;

  // Reflect the address up to the parent
  emit("update:modelValue", address);

  // Basic pattern check
  if (!address || !telosNamePattern.test(address)) {
    localError.value = "Invalid Telos account name (1–13 chars [a-z1-5.]).";
    emit("update:isValid", false);
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
      localError.value = `Account "${address}" does not exist on-chain.`;
      emit("update:isValid", false);
    } else {
      localError.value = null;
      isValid.value = true;
      emit("update:isValid", true);
    }
  } catch (error) {
    console.error("Error checking Telos account:", error);
    localError.value = "Error verifying account on-chain.";
    emit("update:isValid", false);
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
    emit("update:isValid", false);
    return;
  }

  // Debounce check
  if (boidTimer) clearTimeout(boidTimer);
  boidTimer = setTimeout(() => {
    // We call an async function, but do NOT make this callback async
    checkBoidIdDebounced(id).catch((error) => {
      console.error("Error validating Boid ID:", error);
      localError.value = "Error validating Boid ID. Try again.";
      emit("update:isValid", false);
    });
  }, 800);
}

// A separate async function for checking Boid ID existence
async function checkBoidIdDebounced(id: string) {
  try {
    const data = await fetchDataFromBoidTable("accounts");
    if (!data) {
      localError.value = "Could not load Boid table data.";
      emit("update:isValid", false);
      return;
    }

    const found = data.some((account) => account?.boid_id?.toString() === id);
    if (found) {
      localError.value = null;
      isValid.value = true;
      emit("update:boidId", id);
      emit("update:isValid", true);
    } else {
      localError.value = `Boid ID "${id}" not found in on-chain table.`;
      emit("update:isValid", false);
    }
  } catch (error: unknown) {
    console.error("Error validating Boid ID:", error);
    localError.value = "Error validating Boid ID. Try again.";
    emit("update:isValid", false);
  }
}


const getInputStyle = () => ({
  backgroundColor: "var(--secondary)",
  borderColor: "transparent",
});
</script>
