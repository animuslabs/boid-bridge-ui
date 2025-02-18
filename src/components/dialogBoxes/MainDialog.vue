<template>
  <!-- Info Dialog -->
<q-dialog v-model="infoDialog">
  <q-card class="q-pa-md" style="min-width: 350px">
    <q-card-section>
      <div class="text-h6">About Tokens Bridge</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      The Tokens Bridge allows you to transfer BOID tokens between Telos Native and Telos EVM.
    </q-card-section>
    <q-card-section class="q-pt-none">
      <p>To use the bridge:</p>
      <ol>
        <li>Select the source and destination networks</li>
        <li>Enter the amount you want to transfer</li>
        <li>Review the transaction details</li>
        <li>Confirm and sign the transaction</li>
      </ol>
      <p class="text-caption" style="color: green; font-weight: bolder">NOTE:
        <br>Transfers from Native to EVM should be instant.
        <br>Manual completion is only required for transactions not automatically processed within expected timeframes.
      </p>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <p>Transaction management features:</p>
      <ul>
        <li>View complete transaction history with status tracking</li>
        <li>Manual two step process for finalization of EVM-to-Native transfers:
            <ol type="a">
              <li>First you approve the transaction in EVM table</li>
              <li>Then verify and finalize the transaction in Native table</li>
            </ol>
        </li>
      </ul>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <p>Any questions about the bridge?</p>
      <p>Contact us on <a href="https://t.me/boidcommunity">Telegram</a></p>
    </q-card-section>
    <q-card-actions allign="right">
      <q-btn flat label="Close" color="primary" v-close-popup />
    </q-card-actions>
  </q-card>
</q-dialog>

</template>
<script setup lang="ts">
import { ref } from 'vue'

const infoDialog = ref(false)

 
const showInfo = () => {
  infoDialog.value = true
}

defineExpose({ showInfo })
</script>
