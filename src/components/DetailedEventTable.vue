<template>
    <q-table
      dark
      class="event-table"
      :rows="formattedRows"
      :columns="columns"
      row-key="id"
      :filter="filter"
      :filter-method="filterEvents"
      flat
      bordered
      dense
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
          placeholder="Search in EVM events"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body-cell-time="props">
        <q-td :props="props">
          {{ props.col.format ? props.col.format(props.row.timestamp) : props.row.timestamp }}
        </q-td>
      </template>
      <template v-slot:body-cell-event="props">
        <q-td :props="props">
          <q-chip color="purple-2" outline dense square>
            {{ props.row.eventType }}
          </q-chip>
        </q-td>
      </template>
      <template v-slot:body-cell-transaction="props">
        <q-td :props="props">
          <a :href="`${explorer}/tx/${props.row.transactionHash}`" target="_blank" class="hash-link">
            {{ truncate(props.row.transactionHash) }}
          </a>
        </q-td>
      </template>
      <template v-slot:body-cell-reason="props">
        <q-td :props="props" class="wrapped-cell">
          <div>
            <div v-if="props.row.reason">
              {{ props.row.reason }}
            </div>
            <div v-if="props.row.message">
              {{ props.row.message }}
            </div>
          </div>
        </q-td>
      </template>
    </q-table>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Event } from 'src/lib/types/evmEvents'
import { configuration } from 'src/lib/config'

const explorer = configuration.testnet.evm.explorer
const props = defineProps<{
  events: Event[]
}>()

const filter = ref('')

const formattedRows = computed(() => {
  const sorted = [...props.events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return sorted.map((event) => ({
    id: `${event.eventType}-${event.transactionHash}-${event.timestamp}`,
    ...event
  }));
});

const columns = [
  {
    name: 'time',
    label: 'Time',
    field: 'timestamp',
    format: (val: string) => {
      const date = new Date(val)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      }) + '\n' +
      date.toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    sortable: true,
    sort: (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime(),
    classes: 'time-column'
  },
  {
    name: 'event',
    label: 'Event',
    field: 'eventType'
  },
  {
    name: 'transaction',
    label: 'Transaction',
    field: 'transactionHash'
  },
  {
    name: 'reason',
    label: 'Reason (Message)',
    field: 'reason'
  }
]

const expanded = ref([])

const pagination = ref({
  page: 1,
  rowsPerPage: 10
})

function truncate(text: string): string {
  return text.length > 13 ? text.slice(0, 10) + '...' : text
}

function filterEvents(
  rows: readonly Event[],
  terms: string
) {
  const searchTerm = terms.toLowerCase()
  return rows.filter(row => {
    return Object.entries(row).some(([key, value]) => {
      if (typeof value !== 'string' || key === 'id') return false
      return value.toLowerCase().includes(searchTerm)
    })
  })
}

</script>

<style scoped>
.event-table {
  background-color: var(--q-dark);
  color: white;
  overflow-y: auto;
  min-height: 100%;
  min-width: 480px;
}

.wrapped-cell {
  white-space: normal;
  max-width: 100%;
  padding: 8px;
}

.hash-link {
  color: #42a5f5 !important;
  text-decoration: none;
}

.hash-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}

.event-type {
  background: var(--q-primary);
  color: white;
}

.time-column {
  white-space: pre-line;
  text-align: center;
  line-height: 1.4;
}

@media (max-width: 600px) {
  .detail-item {
    min-width: 100%;
  }

  .time-column {
    min-width: 100px;
  }
}
</style>
