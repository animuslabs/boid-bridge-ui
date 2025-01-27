<template>
  <q-page class="column items-center justify-start q-pt-lg">
    <!-- Flow Direction Header -->
    <div class="row items-center q-mb-lg justify-center">
      <q-btn
        class="direction-btn"
        @click="toggleDirection"
        color="primary"
        size="lg"
        text-color="white"
        no-caps
      >
        <template v-slot:default>
          {{ isReversed ? 'Telos EVM' : 'Telos Native' }}
          <q-icon
            name="chevron_right"
            size="md"
            class="q-mx-sm"
          />
          {{ isReversed ? 'Telos Native' : 'Telos EVM' }}
        </template>
      </q-btn>
    </div>

    <!-- Login Card -->
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
          :label="getLoginButtonLabel()"
          color="secondary"
          text-color="white"
          no-caps
          class="full-width"
          @click="handleLoginClick"
        />
      </q-card-section>
    </q-card>

    <!-- Conditionally Rendered Cards -->
    <q-card
      v-if="!isReversed"
      class="q-pa-md q-mb-md"
      flat
      bordered
      style="background-color: var(--primary); color: white; min-width: 300px; max-width: 500px;"
    >
      <!-- Telos EVM Card -->
      <q-card-section>
        <div class="text-h6 text-center">Telos EVM</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="toAddress"
          label="Destination Address"
          filled
          style="background-color: var(--secondary);"
          label-color="white"
          color="white"
          :input-style="{ color: 'white' }"
          dense
        />
      </q-card-section>
    </q-card>

    <q-card
      v-if="isReversed"
      class="q-pa-md q-mb-md"
      flat
      bordered
      style="background-color: var(--primary); color: white; min-width: 300px; max-width: 500px;"
    >
      <!-- Telos Native Card -->
      <q-card-section>
        <div class="text-h6 text-center">Telos Native</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="toAddress"
          label="Destination Address"
          filled
          style="background-color: var(--secondary);"
          label-color="white"
          color="white"
          :input-style="{ color: 'white' }"
          dense
        />
        <q-toggle
          v-model="showBoidId"
          label="Send to Boid ID"
          color="secondary"
          class="q-mt-md"
        />
        <q-input
          v-if="showBoidId"
          v-model="fromMemo"
          label="Boid ID"
          filled
          dense
          style="background-color: var(--secondary);"
          label-color="white"
          color="white"
          :input-style="{ color: 'white' }"
          class="q-mt-sm"
        />
      </q-card-section>
    </q-card>

    <!-- Transfer Button -->
    <q-card-section class="q-mt-md">
      <q-btn
        label="Transfer"
        color="primary"
        no-caps
        class="full-width"
      />
    </q-card-section>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useSessionStore } from "src/stores/sessionStore"

const sessionStore = useSessionStore()

const isReversed = ref(false); // Flow direction: false = Native to EVM, true = EVM to Native
const showBoidId = ref(false); // Toggles the Boid ID field for EVM to Native flow

const fromMemo = ref("");
const toAddress = ref("");

// Toggle the direction of the flow
const toggleDirection = () => {
  isReversed.value = !isReversed.value;
  showBoidId.value = false; // Reset Boid ID toggle when switching flow
};

onMounted(async() => {
  await sessionStore.renew()
})

const isLoggedIn = ref(sessionStore.isLoggedIn)
const loggedAccount = ref(sessionStore.session?.actor)

watch(() => sessionStore.isLoggedIn, (newVal) => {
  isLoggedIn.value = newVal
})

watch(() => sessionStore.session?.actor, (newVal) => {
  loggedAccount.value = newVal
})

const login = async() => {
  await sessionStore.login()
}

const logout = async() => {
  await sessionStore.logout()
}

const isEvmLoggedIn = ref(false) // TODO: Connect to EVM session store

const getLoginButtonLabel = () => {
  if (isReversed.value) {
    return isEvmLoggedIn.value ? 'Logout from Telos EVM' : 'Login to Telos EVM'
  } else {
    return isLoggedIn.value ? `Logout (${sessionStore.username})` : 'Login to Telos Native'
  }
}

const handleLoginClick = async () => {
  if (isReversed.value) {
    // TODO: Handle EVM login/logout when store is available
    console.log('EVM login/logout not yet implemented')
  } else {
    if (isLoggedIn.value) await logout()
    else await login()
  }
}

// Watch the toggle to update the destination address
watch(showBoidId, (newValue) => {
  if (newValue) {
    toAddress.value = "boid"; // Auto-fill destination address when toggled on
  } else {
    toAddress.value = ""; // Clear destination address when toggled off
  }
});
</script>

<style scoped>
.direction-btn {
  transition: all 0.3s ease;
  font-size: 1.1rem;
  min-width: 280px;
}
.direction-btn:hover {
  opacity: 0.9;
}
</style>
