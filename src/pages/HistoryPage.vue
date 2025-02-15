<template>
  <q-page class="column items-center justify-start q-pt-lg">
    <div class="full-width q-px-xl">
      <q-tabs
        v-model="activeTab"
        dense
        class="text-white"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab name="requests" label="Live" />
        <q-tab name="events" label="History" />
      </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="full-width transparent-tabs">
      <q-tab-panel name="requests" class="flex flex-center">
        <div class="q-table-container">
          <template v-if="isLoading">
            <div class="flex flex-center q-pa-md">
              <q-spinner-hourglass color="white" size="2em" />
            </div>
          </template>
          <template v-else>
            <div class="text-h6 text-white q-mb-md">
              Confirm EVM Request <q-icon name="info" color="white">
              <q-tooltip>Unverified Requests on EVM side.</q-tooltip></q-icon>
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
              style="background-color: var(--q-dark); color: white; width: 100%;"
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
                <q-btn
                  flat
                  color="negative"
                  icon="delete"
                  size="sm"
                  :disabled="(new Date().getTime() - props.row.requested_at.getTime() < 30 * 60 * 1000) || (props.row.sender.toLowerCase() !== loggedEvmAccountFull?.toLowerCase())"
                  @click="deleteRequest(props.row.id!)"
                >
                  <q-tooltip>
                    {{ props.row.sender.toLowerCase() !== loggedEvmAccountFull?.toLowerCase()
                      ? 'Only request sender can refund'
                      : new Date().getTime() - props.row.requested_at.getTime() < 30 * 60 * 1000
                        ? `Available to refund after: ${new Date(props.row.requested_at.getTime() + 1800000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}`
                        : `Refund Request ${props.row.id}` }}
                  </q-tooltip>
                </q-btn>
                <q-btn flat color="green" icon="thumb_up_alt" size="sm" @click="approveRequest(props.row.id!)">
                  <q-tooltip>Approve Request {{ props.row.id }} on Telos Native</q-tooltip>
                </q-btn>
              </template>
            </q-table>
            <div class="flex flex-center">
              <q-icon name="keyboard_double_arrow_down" color="white" size="2em"></q-icon>
            </div>
            <div class="text-h6 text-white q-mb-md q-mt-lg">Release Tokens <q-icon name="info" color="white">
              <q-tooltip>Unverified Requests on Telos Native side.</q-tooltip></q-icon></div>
            <q-table
              :rows="activeRequestsTableNative"
              :columns="nativeColumns"
              dark
              flat
              bordered
              dense
              class="q-mb-md"
              style="background-color: var(--q-dark); color: white; width: 100%;"
            >
              <template v-slot:body-cell-sender="props">
                <q-td :props="props">
                  {{ truncate(props.value) }}
                  <q-tooltip>{{ props.value }}</q-tooltip>
                </q-td>
              </template>
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn flat color="green" :icon="props.row.processed ? 'verified' : 'thumb_up_alt'" size="sm" :disabled="props.row.processed" @click="verifyRequest(Number(props.row.request_id))">
                    <q-tooltip>
                      {{ props.row.processed ? 'Request already processed' : `Verify Request ${props.row.request_id}` }}
                    </q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </template>
        </div>
      </q-tab-panel>

        <q-tab-panel name="events" class="flex flex-center q-table-container-history">
          <template v-if="isLoading">
            <div class="flex flex-center q-pa-md">
              <q-spinner-hourglass color="white" size="2em" />
            </div>
          </template>
          <template v-else>
            <!-- New table displaying Telos Contract Transactions -->
            <q-table
              :rows="formattedTelosTransactions"
              :columns="telosColumns"
              dense
              dark
              flat
              bordered
              v-model:pagination="telosPagination"
              v-model:filter="telosSearch"
              :filter-method="(rows, terms, cols, getCellValue) =>
                rows.filter(row => {
                  const searchValues = Object.values(row).map(val => String(val).toLowerCase());
                  if (row.from === '0x0000000000000000000000000000000000000000') {
                    searchValues.push('mint');
                  }
                  if (row.to === '0x0000000000000000000000000000000000000000') {
                    searchValues.push('burn');
                  }
                  return searchValues.some(val => val.includes(terms.toLowerCase()))
                })"
              class="q-mt-md evm-trx-table"
            >
              <template v-slot:top>
                <q-input
                  dark
                  borderless
                  dense
                  debounce="300"
                  v-model="telosSearch"
                  placeholder="Search EVM Token Trx..."
                  style="width: 200px"
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </template>
              <template v-slot:body-cell-timestamp="props">
                <q-td :props="props">
                  {{ props.row.timestamp }}
                </q-td>
              </template>
              <template v-slot:body-cell-from="props">
                <q-td :props="props">
                  <div v-if="props.row.from === '0x0000000000000000000000000000000000000000'">
                    <q-chip color="green" text-color="white" outline dense square>Mint Action</q-chip>
                  </div>
                  <div v-else>
                    {{ shortAddress(props.row.from) }}
                    <q-tooltip>{{ props.row.from }}</q-tooltip>
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-to="props">
                <q-td :props="props">
                  <div v-if="props.row.to === '0x0000000000000000000000000000000000000000'">
                    <q-chip color="red" text-color="white" outline dense square>Burn Action</q-chip>
                  </div>
                  <div v-else>
                    {{ shortAddress(props.row.to) }}
                    <q-tooltip>{{ props.row.to }}</q-tooltip>
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-transaction="props">
                <q-td :props="props">
                  <a
                    :href="`${configuration.testnet.evm.explorer}/tx/${props.row.transaction}`"
                    target="_blank"
                    style="color: #1976d2; text-decoration: underline;"
                  >
                    {{ shortTx(props.row.transaction) }}
                  </a>
                </q-td>
              </template>
              <template v-slot:body-cell-amount="props">
                <q-td :props="props">
                  {{ props.row.amount }} BOID
                </q-td>
              </template>
            </q-table>
            <div v-if="!screen.lt.sm" class="q-mt-md row justify-center">
              <div class="col-12 col-md-6 q-pa-md">
                <DetailedNativeTable :hyperionActions="hyperionActions" />
              </div>
              <div class="col-12 col-md-6 q-pa-md">
                <DetailedEventTable :events="allEvents" class="q-mb-md"/>
              </div>
            </div>
          </template>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Screen } from 'quasar'
import { useEvmStore, BridgeRequest, TelosContractTransaction } from 'src/stores/evmStore'
import { QTableProps } from 'quasar'
import DetailedEventTable from 'src/components/DetailedEventTable.vue'
import DetailedNativeTable from 'src/components/DetailedNativeTable.vue'
import { Event } from 'src/lib/types/evmEvents'
import { ActionParams as EvmBoidActionParams, TableTypes as EvmBoidTableTypes } from "src/lib/types/evm.boid";
import { createEvmBoidAction, fetchDataFromEvmBoidTable } from "src/lib/antelope";
import { queryAllActions, ActionResponse } from 'src/lib/hyperion'
import { configuration } from 'src/lib/config'

const evmStore = useEvmStore()
const loggedEvmAccountFull = computed(() => evmStore.address)
const activeRequestsOnEvm = ref<BridgeRequest[]>([])
const activeRequestsTableNative = ref<EvmBoidTableTypes['requests'][]>([])
const hyperionActions = ref<ActionResponse[]>([])

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

const nativeColumns = ref<QTableProps['columns']>([
  { name: 'id', label: 'ID', field: (row) => Number(row.request_id), sortable: true },
  { name: 'sender', label: 'Sender', field: 'sender', sortable: true },
  { name: 'receiver', label: 'Receiver', field: (row) => `${row.receiver}`, sortable: true },
  { name: 'amount', label: 'Amount', field: (row) => `${row.amount} BOID`, sortable: true },
  {
    name: 'timestamp',
    label: 'Created At',
    field: 'timestamp',
    format: (val) => new Date(val).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }),
    sortable: true
  },
  { name: 'status', label: 'Status', field: (row) => `${row.processed ? 'Done' : 'Pending'}`, sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', sortable: false }
])

// Add these lines near your reactive declarations:
const tableKey = ref(0)
watch(activeRequestsOnEvm, () => {
  tableKey.value++
})

const allEvents = ref<Event[]>([])

// Add isLoading ref initialized to false
const isLoading = ref(false)

// Fetch all events on component mount
onMounted(async () => {
  // Set isLoading to true before fetching data
  isLoading.value = true
  await evmStore.initBlockNumber7DaysAgo()
  try {
    activeRequestsOnEvm.value = await evmStore.queryActiveRequests()
    activeRequestsTableNative.value = (await fetchDataFromEvmBoidTable('requests')) ?? []
  } catch (error) {
    console.error('Failed to fetch requests:', error)
  } finally {
    // Set isLoading to false after fetching data
    isLoading.value = false
  }
})

const loadDetailedData = async () => {
  isLoading.value = true
  try {
    console.log('Active Requests:', activeRequestsOnEvm.value)
    const bridgeTransactions = await evmStore.fetchBridgeTransactionEvents()
    const validationStatuses = await evmStore.fetchValidationStatusEvents()
    const requestStatuses = await evmStore.fetchRequestStatusEvents()
    const bridgeRequests = await evmStore.fetchBridgeRequestEvents()
    const requestRemovalSuccesses = await evmStore.fetchRequestRemovalSuccessEvents()
    const failedRequestCleareds = await evmStore.fetchFailedRequestClearedEvents()
    telosContractTransactions.value = await evmStore.fetchTelosContractTransactions()

    allEvents.value = [
      ...(bridgeTransactions.value?.map(e => ({ ...e, eventType: 'BridgeTransaction' })) || []),
      ...(validationStatuses.value?.map(e => ({ ...e, eventType: 'ValidationStatus' })) || []),
      ...(requestStatuses.value?.map(e => ({ ...e, eventType: 'RequestStatusCallback' })) || []),
      ...(bridgeRequests.value?.map(e => ({ ...e, eventType: 'BridgeRequest' })) || []),
      ...(requestRemovalSuccesses.value?.map(e => ({ ...e, eventType: 'RequestRemovalSuccess' })) || []),
      ...(failedRequestCleareds.value?.map(e => ({ ...e, eventType: 'FailedRequestCleared' })) || []),
    ] as Event[]
    hyperionActions.value = await queryAllActions() ?? []
    console.log('Hyperion Actions:', hyperionActions.value)
  } catch (error) {
    console.error('Failed to fetch events:', error)
  } finally {
    isLoading.value = false
  }
}

// Add computed property for formatted dates
const formattedRows = computed(() => {
  return activeRequestsOnEvm.value.map(req => ({
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
    activeRequestsOnEvm.value = await evmStore.queryActiveRequests()
  } catch (error) {
    console.error('Error removing request:', error)
  }
}

function truncate(text: string): string {
  if (!text) return ''
  return text.length > 13 ? text.slice(0, 10) + '...' : text
}

// Add this near other reactive declarations
const activeTab = ref<'requests' | 'events'>('requests')

// Add this watch to trigger detailed data loading
watch(activeTab, async (newVal) => {
  if (newVal === 'events' && allEvents.value.length === 0) {
    await loadDetailedData()
  }
})

watch(loggedEvmAccountFull, async (newAccount) => {
  if (newAccount) {
    activeRequestsOnEvm.value = await evmStore.queryActiveRequests()
  }
})

async function approveRequest(id: number) {
  const action: EvmBoidActionParams.reqnotify = {
    req_id: id,
  }
  const result = await createEvmBoidAction('reqnotify', action)
  console.log('Request approved:', result)
  activeRequestsOnEvm.value = await evmStore.queryActiveRequests()
}
async function verifyRequest(id: number) {
  const action: EvmBoidActionParams.verifytrx = {
    req_id: BigInt(id),
  }
  const result = await createEvmBoidAction('verifytrx', action)
  console.log('Request verified:', result)
  activeRequestsTableNative.value = (await fetchDataFromEvmBoidTable('requests')) ?? []
}

const telosContractTransactions = ref<TelosContractTransaction[]>([])
const telosColumns = ref<QTableProps['columns']>([
  { name: 'timestamp', label: 'Timestamp', field: 'timestamp', sortable: true },
  { name: 'from', label: 'From', field: 'from', sortable: true },
  { name: 'to', label: 'To', field: 'to', sortable: true },
  { name: 'transaction', label: 'Transaction', field: 'transaction', sortable: false },
  { name: 'amount', label: 'Amount', field: 'amount', sortable: true },
])

const formattedTelosTransactions = computed(() => {
  return telosContractTransactions.value.map(tx => ({
    ...tx,
    timestamp: new Date(tx.timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    })
  }))
})

// Helper functions to shorten addresses and tx hashes.
function shortAddress(addr: string): string {
  return addr.length > 10 ? addr.substring(0, 6) + '...' + addr.substring(addr.length - 4) : addr;
}

function shortTx(tx: string): string {
  return tx.length > 10 ? tx.substring(0, 6) + '...' + tx.substring(tx.length - 4) : tx;
}

const telosPagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'timestamp',
  descending: true
})

const telosSearch = ref('')

const screen = Screen

</script>

<style>
.evm-trx-table {
  background-color: var(--q-dark);
  color: white;
  max-height: 600px;
  overflow-y: auto;
  min-width: 500px;
  max-width: 100%;
}
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

.transparent-tabs .q-panel {
  background-color: transparent !important;
}

.transparent-tabs .q-tab-panel {
  background-color: transparent !important;
  padding: 0;
}

.q-table-container {
  max-width: 650px;
  width: 100%;
  margin: 0 auto;
}

.q-table-container-history {
  width: 100%;
  margin: 0 auto;
}

.q-tab-panels {
  background-color: transparent !important;
}

.q-tab-panel {
  background-color: transparent !important;
  padding: 0;
}
</style>
