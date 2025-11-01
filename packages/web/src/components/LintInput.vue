<template>
  <v-card>
    <v-card-title>中文文字檢查</v-card-title>
    <v-card-text>
      <v-textarea
        v-model="text"
        label="輸入要檢查的中文文字"
        rows="8"
        variant="outlined"
        placeholder="例如：我需要優化數據庫的性能"
      />

      <v-select
        v-model="minLevel"
        :items="levelOptions"
        label="最低檢查等級"
        variant="outlined"
        density="compact"
      />
    </v-card-text>

    <v-card-actions>
      <v-btn
        color="primary"
        :loading="loading"
        :disabled="!text.trim()"
        @click="handleCheck"
      >
        <v-icon left>mdi-check-circle</v-icon>
        檢查
      </v-btn>
      <v-btn
        variant="text"
        :disabled="!text.trim()"
        @click="text = ''"
      >
        清除
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  check: [text: string, minLevel: string];
}>();

const text = ref('');
const minLevel = ref('error');
const loading = ref(false);

const levelOptions = [
  { title: '🔴 Hazard (最嚴重)', value: 'hazard' },
  { title: '🟠 Error (錯誤)', value: 'error' },
  { title: '🟡 Warning (警告)', value: 'warning' },
  { title: '🔵 Info (資訊)', value: 'info' },
  { title: '⚪ Depends (視情況)', value: 'depends' }
];

const handleCheck = async () => {
  loading.value = true;
  try {
    emit('check', text.value, minLevel.value);
  } finally {
    // Loading state will be managed by parent
    setTimeout(() => {
      loading.value = false;
    }, 100);
  }
};
</script>
