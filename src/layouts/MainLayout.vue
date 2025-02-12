<template>
  <q-layout view="hhh lpR fff" class="gradient-bg">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar class="row justify-between">
        <!-- Logo -->
        <q-btn
          @click="$router.push('/')"
          flat
          class="no-padding"
        >
          <img
            src="../assets/logo.png"
            alt="Boid Lore NFTs"
            style="height: 40px;"
          />
        </q-btn>

        <!-- Centered Title -->
        <div class="text-h6 absolute-center">Bridge</div>

        <!-- Navigation Section -->
        <div class="q-gutter-sm">
          <q-btn
            flat
            dense
            icon="info"
            @click="showInfo"
            aria-label="About"
          />
          <q-btn
            flat
            dense
            icon="manage_search"
            @click="router.push('/history')"
            aria-label="Search"
          />
          <q-btn
            flat
            dense
            icon="home"
            @click="router.push('/')"
            aria-label="Home"
          />
        </div>
      </q-toolbar>
    </q-header>

    <!-- Page Content -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
  <MainDialog ref="dialogsRef" />
</template>

<script setup lang="ts">
import MainDialog from 'src/components/dialogBoxes/MainDialog.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router'
import { notifyEvent, showNotification } from "src/lib/helperFunctions"

const dialogsRef = ref();
const router = useRouter();

const showInfo = () => {
  dialogsRef.value?.showInfo();
};

notifyEvent.on('TrxResult', (result) => {
  showNotification(result)
})

notifyEvent.on('EvmTrxResult', ({ hash, isError }) => {
  showNotification(hash || 'unknown', isError, true)
})
</script>

<style scoped>
/* Gradient Background */
.gradient-bg {
  background: linear-gradient(-45deg, #756F8E, #954B97, #3E426D, #a18cd1);
  background-size: 150% 150%;
  animation: gradientAnimation 15s ease-in-out infinite;
  min-height: 100vh; /* Ensure background spans the full viewport */
  width: 100vw;
}

/* Gradient Animation */
@keyframes gradientAnimation {
  0% {
    background-size: 150% 150%;
  }
  50% {
    background-size: 170% 170%;
  }
  100% {
    background-size: 150% 150%;
  }
}
</style>
