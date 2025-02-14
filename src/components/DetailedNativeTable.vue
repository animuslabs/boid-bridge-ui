<template>
  <div class="q-pa-md" style="max-height: 100%; overflow-y: auto; width: 100% !important; max-width: 650px;">
    <q-table
      dark
      flat bordered
      :rows="props.hyperionActions"
      :columns="columns"
      row-key="name"
      class="hyperion-table"
      v-model:pagination="pagination"
      v-model:filter="filter"
    >

      <template v-slot:top>
        <q-input
          dark
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Search native actions..."
          class="q-mb-sm"
          style="width: 200px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th auto-width />
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width>
            <q-btn size="sm" color="accent" round dense @click="props.expand = !props.expand" :icon="props.expand ? 'remove' : 'add'" />
          </q-td>
          <q-td>
            {{ columns[0]?.format
               ? columns[0].format(props.row.timestamp, props.row)
              : props.row.timestamp
           }}
          </q-td>
          <q-td>
            {{ props.row.act.name }}
          </q-td>
          <q-td>
            Acc: {{ props.row.act.account }} | Trx: <a :href="`${explorer}/transaction/${props.row.trx_id}`" target="_blank" class="hash-link">
              {{ truncate(props.row.trx_id) }}
            </a>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <div class="text-left">{{ JSON.stringify(props.row.data) }}.</div>
          </q-td>
        </q-tr>
      </template>

    </q-table>
  </div>
</template>

<script setup lang="ts">

import { defineProps, ref } from 'vue'
import { QTableColumn } from 'quasar'
import { ActionResponse } from 'src/lib/hyperion'
import { configuration } from 'src/lib/config'

const truncate = (text: string): string => {
  if (!text) return ''
  return text.length > 13 ? text.slice(0, 10) + '...' : text
}
const pagination = ref({
  page: 1,
  rowsPerPage: 5
})
const explorer = configuration.testnet.native.explorer
const props = defineProps<{
  hyperionActions: ActionResponse[]
}>()
const columns: QTableColumn[] = [
  {
    name: 'timestamp',
    label: 'Time',
    field: (row: ActionResponse) => row.timestamp,
    format: (val: string) => {
      const date = new Date(val)
      return `${date.getDate()} ${date.toLocaleString('en-GB', { month: 'short' })} ` +
      date.toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    align: 'left',
    sortable: true
  },
  { name: `actionName`, label: 'Action Name', field: (row: ActionResponse) => row.act.name },
  {
    name: 'actionDetails',
    label: 'Action Details',
    field: (row: ActionResponse) => row
  }
]
const filter = ref('')

</script>
<style scoped>
.hyperion-table {
  background-color: var(--q-dark);
  color: white;
}

.hash-link {
  color: #42a5f5;  /* Matching event table's link color */
  text-decoration: none;
}

.hash-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}
</style>
