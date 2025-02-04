<template>
  <q-page class="column items-center justify-start q-pt-lg">
    <!-- Date Filter -->
    <div class="q-pa-md" style="width: 300px;">
      <div class="custom-qselect">
        <q-select
          v-model="selectedDays"
          :options="dateOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          options-dense
          filled
          label="Filter by Date"
          hint="Select a time range"
          dropdown-icon="expand_less"
          popup-content-class="custom-select-popup"
          dense
        />
      </div>
    </div>
    <ComprehensiveEventTable :events="filteredEvents" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEvmStore } from 'src/stores/evmStore'
import ComprehensiveEventTable from 'src/components/ComprehensiveEventTable.vue'
import { Event } from 'src/lib/types/evmEvents'

const evmStore = useEvmStore()
const allEvents = ref<Event[]>([])

// Fetch all events on component mount
onMounted(async () => {
  await evmStore.initializeBlockNumberFor30DaysAgo()
  try {
    const bridgeTransactions = await evmStore.fetchBridgeTransactionEvents()
    const validationStatuses = await evmStore.fetchValidationStatusEvents()
    const requestStatuses = await evmStore.fetchRequestStatusEvents()
    const requestRetries = await evmStore.fetchRequestRetryStatusEvents()
    const refundStatuses = await evmStore.fetchRefundStatusEvents()
    const refundRetries = await evmStore.fetchRefundRetryStatusEvents()
    const bridgeRequests = await evmStore.fetchBridgeRequestEvents()

    allEvents.value = [
      ...bridgeTransactions.value.map(e => ({ ...e, eventType: 'BridgeTransaction' })),
      ...validationStatuses.value.map(e => ({ ...e, eventType: 'ValidationStatus' })),
      ...requestStatuses.value.map(e => ({ ...e, eventType: 'RequestStatusCallback' })),
      ...requestRetries.value.map(e => ({ ...e, eventType: 'RequestRetryStatus' })),
      ...refundStatuses.value.map(e => ({ ...e, eventType: 'RefundStatus' })),
      ...refundRetries.value.map(e => ({ ...e, eventType: 'RefundRetryStatus' })),
      ...bridgeRequests.value.map(e => ({ ...e, eventType: 'BridgeRequest' })),
    ] as Event[]
  } catch (error) {
    console.error('Failed to fetch events:', error)
  }
})

// Date filter options in days
const dateOptions = [
  { label: 'Last 24 Hours', value: 1 },
  { label: 'Last 3 Days', value: 3 },
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 }
]

// Reactive state for the selected filter value (in days)
const selectedDays = ref<number>(1)

// Computed property to filter events based on the selected date range
const filteredEvents = computed(() => {
  const now = new Date()
  const cutoffDate = new Date(now)
  cutoffDate.setDate(now.getDate() - selectedDays.value)

  return allEvents.value.filter(event => {
    const eventDate = new Date(event.timestamp)
    return eventDate >= cutoffDate
  })
})
</script>

<style>
/* Target the selected text container within our custom wrapper */
.custom-qselect .q-field__native span,
.custom-qselect .q-field__native input {
  color: white !important;
  /* font-weight: bold !important; */
}

/* Also override the label and hint */
.custom-qselect .q-field__label,
.custom-qselect .q-field__hint {
  color: white !important;
  /* font-weight: bold !important; */
}

/* Popup styles remain unchanged */
.custom-select-popup {
  background-color: var(--secondary) !important;
  color: white !important;
  padding: 0 !important;
  margin: 0 !important;
}

.custom-select-popup .q-item,
.custom-select-popup .q-item__label {
  color: white !important;
  padding: 4px 8px !important;
}

.custom-select-popup .q-item--active,
.custom-select-popup .q-item--active .q-item__label {
  background-color: #a3a3a3 !important;
  color: white !important;
  /* font-weight: bold !important; */
}
.custom-qselect .q-field__messages div {
  color: white !important;
}
</style>
