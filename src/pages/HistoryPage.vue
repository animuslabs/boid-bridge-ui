<template>
  <q-page class="column items-center justify-start q-pt-lg">
    <q-card
      class="text-h4 q-mb-lg q-pa-sm"
      bordered
      style="color: white; background-color: var(--primary);">
      Transfer History
    </q-card>

    <!-- History List -->
    <q-card
      class="q-pa-md q-mb-md"
      flat
      bordered
      style="background-color: var(--primary); color: white; min-width: 300px; max-width: 800px;"
    >
      <q-list separator>
        <q-item v-for="(transfer, index) in transfers" :key="index">
          <q-item-section>
            <q-item-label class="text-white">{{ transfer.from }} → {{ transfer.to }}</q-item-label>
            <q-item-label caption class="text-grey-4">
              {{ transfer.date }} • {{ transfer.amount }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip
              :color="transfer.status === 'completed' ? 'positive' : 'warning'"
              text-color="white"
              size="sm"
            >
              {{ transfer.status }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Dummy data for now - this would be replaced with actual transfer history data
const transfers = ref([
  {
    from: 'Telos EVM',
    to: 'Telos Native',
    date: '2025-01-26',
    amount: '100 TLOS',
    status: 'completed'
  },
  {
    from: 'Telos Native',
    to: 'Telos EVM',
    date: '2025-01-26',
    amount: '50 TLOS',
    status: 'pending'
  }
])
</script>
