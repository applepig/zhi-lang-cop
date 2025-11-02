<template>
  <v-card>
    <v-card-title>詞庫統計</v-card-title>
    <v-card-text v-if="stats">
      <v-list density="compact">
        <v-list-item>
          <v-list-item-title>版本</v-list-item-title>
          <v-list-item-subtitle>{{ stats.version }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>更新時間</v-list-item-title>
          <v-list-item-subtitle>{{ stats.lastUpdated }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>總規則數</v-list-item-title>
          <v-list-item-subtitle>{{ stats.totalRules }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>總詞彙數</v-list-item-title>
          <v-list-item-subtitle>{{ stats.totalTerms }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <v-divider class="my-2" />

      <div class="text-subtitle-2 mb-2">按等級統計</div>
      <v-chip
        v-for="(count, level) in stats.byLevel"
        :key="level"
        size="small"
        class="mr-1 mb-1"
      >
        {{ getLevelEmoji(level) }} {{ level }}: {{ count }}
      </v-chip>

      <v-divider class="my-2" />

      <div class="text-subtitle-2 mb-2">按分類統計</div>
      <v-chip
        v-for="(count, category) in stats.byCategory"
        :key="category"
        size="small"
        class="mr-1 mb-1"
        color="primary"
        variant="outlined"
      >
        {{ category }}: {{ count }}
      </v-chip>
    </v-card-text>

    <v-card-text v-else>
      <v-progress-circular indeterminate color="primary" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Stats {
  version: string;
  lastUpdated: string;
  totalRules: number;
  totalTerms: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
}

defineProps<{
  stats?: Stats;
}>();

const getLevelEmoji = (level: string): string => {
  const emojis: Record<string, string> = {
    hazard: '🔴',
    error: '🟠',
    warning: '🟡',
    info: '🔵',
    depends: '⚪'
  };
  return emojis[level] || '⚪';
};
</script>
