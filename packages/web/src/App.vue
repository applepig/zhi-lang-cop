<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-title>
        <v-icon left>mdi-shield-check</v-icon>
        Zhi Lang Cop - 中文語言檢查工具
      </v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-alert type="info" variant="tonal" class="mb-4">
              此工具用於檢查中文文字中的中國大陸用語，並提供台灣慣用的替代詞彙建議。
            </v-alert>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="8">
            <lint-input @check="handleCheck" class="mb-4" />
            <results-display :results="lintResults" />
          </v-col>

          <v-col cols="12" md="4">
            <stats-card :stats="stats" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LintInput from './components/LintInput.vue';
import ResultsDisplay from './components/ResultsDisplay.vue';
import StatsCard from './components/StatsCard.vue';

interface LintResult {
  issues: any[];
  summary: {
    total: number;
    byLevel: Record<string, number>;
  };
}

interface Stats {
  version: string;
  lastUpdated: string;
  totalRules: number;
  totalTerms: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
}

const lintResults = ref<LintResult | undefined>();
const stats = ref<Stats | undefined>();
const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
});

const handleCheck = async (text: string, minLevel: string) => {
  try {
    const response = await fetch('/api/lint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, minLevel })
    });

    if (!response.ok) {
      throw new Error('Failed to check text');
    }

    const data = await response.json();
    lintResults.value = data;

    if (data.summary.total === 0) {
      snackbar.value = {
        show: true,
        message: '✓ 沒有發現問題',
        color: 'success'
      };
    }
  } catch (error) {
    console.error('Error checking text:', error);
    snackbar.value = {
      show: true,
      message: '檢查失敗，請稍後再試',
      color: 'error'
    };
  }
};

const loadStats = async () => {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) {
      throw new Error('Failed to load stats');
    }
    stats.value = await response.json();
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

onMounted(() => {
  loadStats();
});
</script>
