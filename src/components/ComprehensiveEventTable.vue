<template>
  <div>
    <q-spinner v-if="loading" size="50px" color="primary" />
    <q-table
      dark
      v-else
      :rows="formattedRows"
      :columns="columns"
      row-key="id"
      :filter="filter"
      flat
      bordered
      dense
      class="q-mb-md"
      style="background-color: var(--q-dark); color: white;"
      v-model:expanded="expanded"
      v-model:pagination="pagination"
    >
      <template v-slot:top>
        <q-input
          dark
          dense
          debounce="300"
          color="primary"
          v-model="filter"
          placeholder="Search in events"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body-cell-status="props">
        <q-chip
          :color="props.row.status === 'Completed' ? 'positive' : 'warning'"
          text-color="white"
          size="sm"
        >
          {{ props.row.status }}
        </q-chip>
      </template>
      <template v-slot:body-cell-details="props">
        <q-td :props="props" class="wrapped-cell">
          <div class="row-details">
            <div class="detail-item event-type">
              <strong>Event:</strong> {{ props.row.eventType }}
            </div>
            <div v-if="props.row.sender" class="detail-item">
              <strong>Sender:</strong> {{ truncate(props.row.sender) }}
              <q-tooltip>{{ props.row.sender }}</q-tooltip>
            </div>
            <div v-if="props.row.receiver" class="detail-item">
              <strong>Receiver:</strong> {{ truncate(props.row.receiver) }}
              <q-tooltip>{{ props.row.receiver }}</q-tooltip>
            </div>
            <div v-if="props.row.token" class="detail-item">
              <strong>Token:</strong> {{ props.row.token }}
            </div>
            <div v-if="props.row.amount" class="detail-item">
              <strong>Amount:</strong> {{ props.row.amount }}
            </div>
            <div v-if="props.row.status" class="detail-item">
              <strong>Status:</strong> {{ props.row.status }}
            </div>
            <div v-if="props.row.fromTokenContract" class="detail-item">
              <strong>From Contract:</strong> {{ truncate(props.row.fromTokenContract) }}
              <q-tooltip>{{ props.row.fromTokenContract }}</q-tooltip>
            </div>
            <div v-if="props.row.fromTokenSymbol" class="detail-item">
              <strong>From Symbol:</strong> {{ props.row.fromTokenSymbol }}
            </div>
            <div v-if="props.row.antelopeTokenContract" class="detail-item">
              <strong>Antelope Contract:</strong> {{ truncate(props.row.antelopeTokenContract) }}
              <q-tooltip>{{ props.row.antelopeTokenContract }}</q-tooltip>
            </div>
            <div v-if="props.row.antelopeSymbol" class="detail-item">
              <strong>Antelope Symbol:</strong> {{ props.row.antelopeSymbol }}
            </div>
            <div v-if="props.row.memo" class="detail-item">
              <strong>Memo:</strong> {{ props.row.memo }}
            </div>
            <div v-if="props.row.transactionHash" class="detail-item">
              <strong>Tx:</strong>
              <a :href="`${explorer}/tx/${props.row.transactionHash}`" target="_blank" class="hash-link">
                {{ truncate(props.row.transactionHash) }}
              </a>
            </div>
            <div v-if="props.row.reason" class="detail-item">
              <strong>Reason:</strong> {{ props.row.reason }}
            </div>
            <div v-if="props.row.message" class="detail-item">
              <strong>Message:</strong> {{ props.row.message }}
            </div>
          </div>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Event } from 'src/lib/types/evmEvents'
import { configuration } from 'src/lib/config'

const explorer = configuration.testnet.evm.explorer
const props = defineProps<{
  events: Event[]
}>()

const loading = ref(true)

const filter = ref('')

const formattedRows = computed(() => {
  const sorted = [...props.events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  return sorted.map((event, index) => ({
    id: index,
    ...event
  }));
});

const columns = [
  {
    name: 'time',
    label: 'Time',
    field: 'timestamp',
    format: (val: string) => new Date(val).toLocaleString('en-GB'),
    sortable: true
  },
  {
    name: 'details',
    label: 'Event Details',
    field: (row: Event) => row
  }
]

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

<style scoped>
.wrapped-cell {
  white-space: normal;
  max-width: 800px;
}

.row-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-item {
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin: 2px;
}

.hash-link {
  color: var(--q-primary);
  text-decoration: none;
}

.hash-link:hover {
  text-decoration: underline;
}

.event-type {
  background: var(--q-primary);
  color: white;
}
</style>
