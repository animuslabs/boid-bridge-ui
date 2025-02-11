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

    <q-table
      :rows="formattedRows"
      :columns="columns"
      :key="tableKey"
      sort-by="id"
      dark
      flat
      bordered
      dense
      class="q-mb-md"
      style="background-color: var(--q-dark); color: white;"
    >
      <template v-slot:body-cell-sender="props">
        <q-td :props="props">
          {{ truncate(props.value) }}
          <q-tooltip>{{ props.value }}</q-tooltip>
        </q-td>
      </template>
      <template v-slot:body-cell-memo="props">
        <q-td :props="props">
          {{ truncate(props.value) }}
          <q-tooltip>{{ props.value }}</q-tooltip>
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-btn flat color="negative" icon="delete" size="sm" @click="deleteRequest(props.row.id!)" />
      </template>
    </q-table>
    <ComprehensiveEventTable :events="filteredEvents" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useEvmStore, BridgeRequest } from 'src/stores/evmStore'
import { QTableProps } from 'quasar'
import ComprehensiveEventTable from 'src/components/ComprehensiveEventTable.vue'
import { Event } from 'src/lib/types/evmEvents'

const evmStore = useEvmStore()
const activeRequests = ref<BridgeRequest[]>([])
const columns = ref<QTableProps['columns']>([
  { name: 'id', label: 'ID', field: 'id', sortable: true },
  { name: 'sender', label: 'Sender', field: 'sender', sortable: true },
  { name: 'receiver', label: 'Receiver', field: 'receiver', sortable: true },
  {
    name: 'amount',
    label: 'Amount',
    field: (row) => `${row.amount} BOID`,
    sortable: true
  },
  { name: 'memo', label: 'Memo', field: 'memo', sortable: false },
  { name: 'formattedDate', label: 'Requested At', field: 'formattedDate', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', sortable: false }
])

// Add these lines near your reactive declarations:
const tableKey = ref(0)
watch(activeRequests, () => {
  tableKey.value++
})

const allEvents = ref<Event[]>([])

// Fetch all events on component mount
onMounted(async () => {
  await evmStore.initializeBlockNumberFor30DaysAgo()
  try {
    activeRequests.value = await evmStore.queryActiveRequests()
    console.log('Active Requests:', activeRequests.value)
    const bridgeTransactions = await evmStore.fetchBridgeTransactionEvents()
    const validationStatuses = await evmStore.fetchValidationStatusEvents()
    const requestStatuses = await evmStore.fetchRequestStatusEvents()
    const bridgeRequests = await evmStore.fetchBridgeRequestEvents()
    const requestRemovalSuccesses = await evmStore.fetchRequestRemovalSuccessEvents()
    const failedRequestCleareds = await evmStore.fetchFailedRequestClearedEvents()

    allEvents.value = [
      ...(bridgeTransactions.value?.map(e => ({ ...e, eventType: 'BridgeTransaction' })) || []),
      ...(validationStatuses.value?.map(e => ({ ...e, eventType: 'ValidationStatus' })) || []),
      ...(requestStatuses.value?.map(e => ({ ...e, eventType: 'RequestStatusCallback' })) || []),
      ...(bridgeRequests.value?.map(e => ({ ...e, eventType: 'BridgeRequest' })) || []),
      ...(requestRemovalSuccesses.value?.map(e => ({ ...e, eventType: 'RequestRemovalSuccess' })) || []),
      ...(failedRequestCleareds.value?.map(e => ({ ...e, eventType: 'FailedRequestCleared' })) || []),
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

// Add computed property for formatted dates
const formattedRows = computed(() => {
  return activeRequests.value.map(req => ({
    ...req,
    formattedDate: req.requested_at.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    })
  }))
})

async function deleteRequest(id: number) {
  try {
    const result = await evmStore.removeRequest(id)
    console.log('Request removed:', result)
    activeRequests.value = await evmStore.queryActiveRequests()
  } catch (error) {
    console.error('Error removing request:', error)
  }
}

function truncate(text: string): string {
  if (!text) return ''
  return text.length > 13 ? text.slice(0, 10) + '...' : text
}

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
