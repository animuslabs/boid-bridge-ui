<template>
  <q-page class="column items-center justify-start q-pt-md">
    <!-- Flow Direction Header -->
    <div class="row items-center q-mb-md justify-center">
      <q-btn
        class="direction-btn"
        @click="toggleDirection"
        color="primary"
        size="lg"
        text-color="white"
        no-caps
      >
      <template v-slot:default>
        {{ isReversed ? 'Telos EVM ' : 'Telos Native ' }}
        <q-icon name="chevron_right" size="md" class="q-mx-sm" />
        {{ isReversed ? 'Telos Native' : 'Telos EVM' }}
      </template>
      </q-btn>
    </div>

    <!-- Cards for Scenario 1: Telos Native -> Telos EVM -->
    <div v-if="!isReversed">
      <NativeLoginCard
        :isLoggedIn="isLoggedIn"
        :loggedAccount="loggedAccount"
        :accountBalance="accountBalance"
        :onNativeLogin="handleNativeLogin"
      />
      <TelosEvmCard :canCoverFee="canCoverFee" />
    </div>

    <!-- Cards for Scenario 2: Telos EVM -> Telos Native -->
    <div v-else>
      <EvmLoginCard/>
      <TelosNativeCard/>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";

import { useSessionStore } from "src/stores/sessionStore";
import { loadAccount } from "src/lib/antelope";
import TelosNativeCard from "src/components/cards/TelosNativeCard.vue";
import TelosEvmCard from "src/components/cards/TelosEvmCard.vue";
import NativeLoginCard from "src/components/cards/NativeLoginCard.vue";
import EvmLoginCard from "src/components/cards/EvmLoginCard.vue";

const sessionStore = useSessionStore();

const isReversed = ref(false); // Flow direction: false = Native to EVM, true = EVM to Native
const accountBalance = ref<string>("0.0000 TLOS");
const canCoverFee = computed(() => {
  const [balanceString] = accountBalance.value.split(" ");
  const balanceNum = parseFloat(balanceString || "0");
  return balanceNum >= 0.5;
});
const isLoggedIn = computed(() => sessionStore.isLoggedIn);
const loggedAccount = computed(() => sessionStore.session?.actor?.toString() || undefined);

// Toggle the flow direction
const toggleDirection = () => {
  isReversed.value = !isReversed.value;
};

// Handle Native Login
const handleNativeLogin = async () => {
  try {
    if (isLoggedIn.value) {
      await sessionStore.logout();
    } else {
      await sessionStore.login();
    }
  } catch (error) {
    console.error("Error during Native login/logout:", error);
  }
};

// Sync session store state
onMounted(async () => {
  try {
    await sessionStore.renew();
  } catch (error) {
    console.error("Error during session renewal:", error);
  }
});

watch(() => sessionStore.isLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    // user is logged in -> check actor, fetch balance
    const actorName = sessionStore.session?.actor?.toString();
    if (actorName) {
      try {
        const accountData = await loadAccount(actorName);
        accountBalance.value =
          accountData?.value.toString() + " TLOS" || "0.0000 TLOS";
      } catch (error) {
        console.error("Error loading account:", error);
        accountBalance.value = "0.0000 TLOS";
      }
    }
  } else {
    // user is logged out
    accountBalance.value = "0.0000 TLOS";
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
