<template>
    <q-table
      dark
      flat
      bordered
      :rows="props.hyperionActions"
      :columns="columns"
      row-key="name"
      class="hyperion-table"
      v-model:pagination="pagination"
      v-model:filter="filter"
      :filter-method="(rows, terms, cols, getCellValue) => {
        const searchTerm = terms.toLowerCase();
        return rows.filter(row => {
          let combined = '';
          cols.forEach(col => {
            let val = getCellValue(col, row);
            if (typeof val !== 'string') {
              val = JSON.stringify(val);
            }
            combined += val.toLowerCase() + ' ';
          });
          return combined.includes(searchTerm);
        });
      }"
    >

      <template v-slot:top>
        <!-- Search Field Row -->
        <div>
          <q-input
            dark
            dense
            debounce="300"
            v-model="filter"
            placeholder="Search native actions..."
            style="width: 200px"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </template>

      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            style="text-align: left;"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td>
            {{ columns[0]?.format
               ? columns[0].format(props.row.timestamp, props.row)
              : props.row.timestamp
           }}
          </q-td>
          <q-td>
            <q-chip color="purple-2" outline dense square>
              {{ props.row.act.name }}
            </q-chip>
          </q-td>
          <q-td>
            <a :href="`${explorer}/transaction/${props.row.trx_id}`" target="_blank" class="hash-link">
              {{ truncate(props.row.trx_id) }}
            </a>
          </q-td>
        </q-tr>
      </template>

    </q-table>
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
  rowsPerPage: 10
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
  min-width: 100%;
  max-width: 350px;
  min-height: 100%;
  overflow-y: auto;
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
