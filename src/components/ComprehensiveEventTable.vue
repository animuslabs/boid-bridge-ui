<template>
  <div>
    <q-spinner v-if="loading" size="50px" color="primary" />
    <q-table
      dark
      v-else
      :rows="formattedEvents"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      class="q-mb-md"
      style="background-color: var(--q-dark); color: white;"
      v-model:expanded="expanded"
      v-model:pagination="pagination"
    >
      <template v-slot:body-cell-status="props">
        <q-chip
          :color="props.row.status === 'Completed' ? 'positive' : 'warning'"
          text-color="white"
          size="sm"
        >
          {{ props.row.status }}
        </q-chip>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" :key="`m_${props.row.id}`">
          <q-td v-for="col in columns" :key="col.name" :props="props">
            <span v-if="col.name === 'sender'">
              <span>{{ truncate(props.row[col.field]) }}</span>
              <q-tooltip>{{ props.row[col.field] }}</q-tooltip>
            </span>
            <span v-else>
              {{ props.row[col.field] }}
            </span>
          </q-td>
          <q-td auto-width>
            <q-toggle v-model="props.expand" checked-icon="add" unchecked-icon="remove" />
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props" :key="`e_${props.row.id}`">
          <q-td :colspan="columns.length + 1">
            <div v-for="(value, key) in props.row.details" :key="key">
              <strong>{{ key }}:</strong> {{ value }}
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Event } from 'src/lib/types/evmEvents'

const props = defineProps<{
  events: Event[]
}>()

const loading = ref(true)

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
  { name: 'sender', label: 'Sender', field: 'sender', align: 'left' as const },
  { name: 'receiver', label: 'Receiver', field: 'receiver', align: 'left' as const },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'center' as const },
  { name: 'timestamp', label: 'Timestamp', field: 'timestamp', align: 'left' as const },
]

const formattedEvents = computed(() => {
  return props.events.map(event => {
    const id = 'id' in event ? event.id : ('requestId' in event ? event.requestId : 'unknown')

    const commonDetails = {
      attemptCount: 'attemptCount' in event ? event.attemptCount : undefined,
      memo: 'memo' in event ? event.memo : undefined,
    }

    const specificDetails = event.eventType === 'BridgeTransaction' ? {
      fromTokenContract: event.fromTokenContract,
      fromTokenSymbol: event.fromTokenSymbol,
      reason: event.reason,
    } : event.eventType === 'RequestStatusCallback' || event.eventType === 'RefundStatus' ? {
      antelopeTokenContract: event.antelopeTokenContract,
      antelopeSymbol: event.antelopeSymbol,
      reason: event.reason,
    } : {}

    const formattedTimestamp = new Date(event.timestamp).toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      hour12: false
    })

    return {
      ...event,
      id,
      amount: parseFloat(event.amount).toFixed(2),
      showDetails: false,
      details: {
        ...commonDetails,
        ...specificDetails,
      },
      timestamp: formattedTimestamp
    }
  })
})

const expanded = ref([])

const pagination = ref({
  page: 1,
  rowsPerPage: 20
})

function truncate(text: string): string {
  return text.length > 13 ? text.slice(0, 10) + '...' : text
}

onMounted(() => {
  // Simulate data loading
  setTimeout(() => {
    loading.value = false
  }, 4000) // Adjust the timeout as needed
})
</script>
