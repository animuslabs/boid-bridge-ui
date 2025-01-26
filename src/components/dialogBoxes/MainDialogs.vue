<template>
  <!-- Info Dialog -->
<q-dialog v-model="infoDialog">
  <q-card class="q-pa-md" style="min-width: 350px">
    <q-card-section>
      <div class="text-h6">About Tokens Bridge</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      The Tokens Bridge allows you to transfer tokens between Telos Native and Telos EVM.
    </q-card-section>
    <q-card-section class="q-pt-none">
      <p>To use the bridge:</p>
      <ol>
        <li>Select the source and destination networks</li>
        <li>Enter the amount you want to transfer</li>
        <li>Review the transaction details</li>
        <li>Confirm and sign the transaction</li>
      </ol>
    </q-card-section>
    <q-card-actions allign="right">
      <q-btn flat label="Close" color="primary" v-close-popup />
    </q-card-actions>
  </q-card>
</q-dialog>

</template>
<script setup lang="ts">
import { ref } from 'vue'
import { defineExpose } from 'vue'

const infoDialog = ref(false) 

const showInfo = () => {
  infoDialog.value = true
}

// Expose methods to parent component
defineExpose({
  showInfo
})
</script>
