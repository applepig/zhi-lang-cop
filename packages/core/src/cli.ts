#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { Database } from './database.js';
import { Matcher } from './matcher.js';
import type { Level, LintIssue } from './types.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('zhi-lang-cop')
  .description('檢查中文文件中的中國大陸用語')
  .version('0.2.0');

program
  .command('check')
  .description('檢查文件或文字')
  .argument('[file]', '要檢查的檔案路徑（省略則從 stdin 讀取）')
  .option('-l, --level <level>', '最低檢查等級', 'error')
  .option('-f, --format <format>', '輸出格式 (text|json)', 'text')
  .option('--no-color', '停用顏色輸出')
  .action(async (file, options) => {
    const text = file
      ? readFileSync(file, 'utf-8')
      : await readStdin();

    const db = new Database();
    const matcher = new Matcher(db, { minLevel: options.level as Level });
    const issues = matcher.findMatches(text);

    if (options.format === 'json') {
      console.log(JSON.stringify({
        results: issues,
        summary: {
          total: issues.length,
          byLevel: summarizeByLevel(issues)
        }
      }, null, 2));
    } else {
      printTextReport(issues, options.color);
    }

    // 有問題時回傳非零 exit code
    process.exit(issues.length > 0 ? 1 : 0);
  });

program
  .command('lookup')
  .description('查詢詞彙或規則')
  .option('-t, --term <term>', '查詢詞彙')
  .option('-r, --rule <ruleId>', '查詢規則 ID')
  .action((options) => {
    const db = new Database();

    if (options.term) {
      const results = db.getRulesByTerm(options.term);
      if (results.length === 0) {
        console.log(chalk.green(`✓ 詞彙「${options.term}」未在詞庫中`));
      } else {
        results.forEach(r => {
          console.log(chalk.red(`\n✗ ${options.term}`));
          console.log(chalk.gray(`  規則: ${r.ruleId}`));
          console.log(chalk.gray(`  等級: ${getLevelEmoji(r.rule.level)} ${r.rule.level}`));
          console.log(chalk.yellow(`  說明: ${r.rule.message}`));
          console.log(chalk.cyan(`  建議: ${r.taiwanAlternatives.join('、')}`));
        });
      }
    } else if (options.rule) {
      const rule = db.getRule(options.rule);
      if (!rule) {
        console.log(chalk.red(`✗ 規則 ${options.rule} 不存在`));
      } else {
        console.log(chalk.yellow(`\n規則 ${options.rule}`));
        console.log(chalk.gray(`等級: ${getLevelEmoji(rule.level)} ${rule.level}`));
        console.log(chalk.gray(`分類: ${rule.category}`));
        console.log(chalk.yellow(`說明: ${rule.message}`));
        console.log(chalk.cyan(`\n概念對照:`));
        rule.concepts.forEach(c => {
          console.log(`  ${c.lang}: ${c.value}`);
        });
      }
    } else {
      console.error(chalk.red('請指定 --term 或 --rule'));
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('顯示詞庫統計資訊')
  .action(() => {
    const db = new Database();
    const stats = db.getStatistics();

    console.log(chalk.bold('\n詞庫統計\n'));
    console.log(`版本: ${stats.version}`);
    console.log(`更新時間: ${stats.lastUpdated}`);
    console.log(`總規則數: ${stats.totalRules}`);
    console.log(`總詞彙數: ${stats.totalTerms}`);
    console.log(chalk.bold('\n按等級統計:'));
    Object.entries(stats.byLevel).forEach(([level, count]) => {
      console.log(`  ${getLevelEmoji(level)} ${level}: ${count}`);
    });
    console.log(chalk.bold('\n按分類統計:'));
    Object.entries(stats.byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
  });

program.parse();

// Helper functions
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function printTextReport(issues: LintIssue[], useColor: boolean) {
  if (issues.length === 0) {
    console.log(useColor ? chalk.green('✓ 沒有發現問題') : '✓ 沒有發現問題');
    return;
  }

  console.log(useColor
    ? chalk.red(`\n✗ 發現 ${issues.length} 個問題\n`)
    : `\n✗ 發現 ${issues.length} 個問題\n`
  );

  issues.forEach(issue => {
    const levelEmoji = getLevelEmoji(issue.level);
    const location = `${issue.location.start.line}:${issue.location.start.column}`;

    if (useColor) {
      console.log(chalk.gray(location) + ' ' + chalk.red(issue.term));
      console.log(chalk.yellow(`  ${levelEmoji} ${issue.level}: ${issue.message}`));
      console.log(chalk.cyan(`  建議: ${issue.suggestions.join('、')}`));
    } else {
      console.log(`${location} ${issue.term}`);
      console.log(`  ${levelEmoji} ${issue.level}: ${issue.message}`);
      console.log(`  建議: ${issue.suggestions.join('、')}`);
    }
    console.log();
  });
}

function summarizeByLevel(issues: LintIssue[]) {
  const summary: Record<string, number> = {
    hazard: 0, error: 0, warning: 0, info: 0, depends: 0
  };
  issues.forEach(i => summary[i.level]++);
  return summary;
}

function getLevelEmoji(level: string): string {
  const emojis: Record<string, string> = {
    hazard: '🔴',
    error: '🟠',
    warning: '🟡',
    info: '🔵',
    depends: '⚪'
  };
  return emojis[level] || '⚪';
}
