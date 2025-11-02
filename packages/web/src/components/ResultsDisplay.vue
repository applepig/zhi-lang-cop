<template>
  <v-card v-if="results">
    <v-card-title>
      檢查結果
      <v-chip
        :color="results.summary.total > 0 ? 'error' : 'success'"
        class="ml-2"
      >
        {{ results.summary.total }} 個問題
      </v-chip>
    </v-card-title>

    <v-card-text v-if="results.summary.total > 0">
      <!-- Summary by level -->
      <div class="mb-4">
        <v-chip
          v-for="(count, level) in results.summary.byLevel"
          :key="level"
          class="mr-2"
          size="small"
        >
          {{ getLevelEmoji(level) }} {{ level }}: {{ count }}
        </v-chip>
      </div>

      <!-- Issue list -->
      <v-expansion-panels>
        <v-expansion-panel
          v-for="(issue, index) in results.issues"
          :key="index"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-chip
                :color="getLevelColor(issue.level)"
                size="small"
                class="mr-2"
              >
                {{ getLevelEmoji(issue.level) }} {{ issue.level }}
              </v-chip>
              <strong class="mr-2">{{ issue.term }}</strong>
              <span class="text-grey">
                行 {{ issue.location.start.line }}:{{ issue.location.start.column }}
              </span>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <div>
              <p class="mb-2">
                <strong>說明：</strong>{{ issue.message }}
              </p>
              <p class="mb-2">
                <strong>規則 ID：</strong>{{ issue.ruleId }}
              </p>
              <p>
                <strong>建議替換為：</strong>
                <v-chip
                  v-for="suggestion in issue.suggestions"
                  :key="suggestion"
                  size="small"
                  color="success"
                  class="mr-1"
                >
                  {{ suggestion }}
                </v-chip>
              </p>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>

    <v-card-text v-else>
      <v-alert type="success" variant="tonal">
        ✓ 沒有發現問題
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface LintIssue {
  ruleId: string;
  level: string;
  term: string;
  message: string;
  suggestions: string[];
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

interface LintResult {
  issues: LintIssue[];
  summary: {
    total: number;
    byLevel: Record<string, number>;
  };
}

defineProps<{
  results?: LintResult;
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

const getLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    hazard: 'error',
    error: 'warning',
    warning: 'info',
    info: 'primary',
    depends: 'grey'
  };
  return colors[level] || 'grey';
};
</script>
