import { describe, it, expect, beforeAll } from 'vitest';
import { execa } from 'execa';
import { writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CLI 路徑（編譯後）
const CLI_PATH = join(__dirname, '../../dist/cli.js');

describe('CLI E2E', () => {
  beforeAll(async () => {
    // 確保已編譯（在實際測試前，需要先 build）
    // 這裡假設已經執行過 pnpm build
  });

  describe('check command', () => {
    it('should check text from stdin and find issues', async () => {
      try {
        await execa('node', [CLI_PATH, 'check'], {
          input: '我需要優化數據庫'
        });
        expect.fail('Should exit with code 1');
      } catch (error: any) {
        expect(error.exitCode).toBe(1);
        expect(error.stdout).toContain('優化');
        expect(error.stdout).toContain('數據庫');
      }
    });

    it('should output JSON format', async () => {
      const { stdout } = await execa('node', [CLI_PATH, 'check', '--format', 'json'], {
        input: '優化性能',
        reject: false
      });

      const result = JSON.parse(stdout);
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('summary');
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should exit with 0 when no issues', async () => {
      const { exitCode } = await execa('node', [CLI_PATH, 'check'], {
        input: '這段文字很正常',
        reject: false
      });

      expect(exitCode).toBe(0);
    });

    it('should respect --level option', async () => {
      const { exitCode } = await execa('node', [CLI_PATH, 'check', '--level', 'hazard'], {
        input: '優化性能', // error level，應該被過濾
        reject: false
      });

      expect(exitCode).toBe(0);
    });

    it('should check file', async () => {
      const testFile = join(__dirname, 'temp-test.txt');
      writeFileSync(testFile, '我需要優化數據庫的性能');

      try {
        await execa('node', [CLI_PATH, 'check', testFile]);
        expect.fail('Should exit with code 1');
      } catch (error: any) {
        expect(error.exitCode).toBe(1);
        expect(error.stdout).toContain('優化');
      } finally {
        unlinkSync(testFile);
      }
    });
  });

  describe('lookup command', () => {
    it('should lookup term', async () => {
      const { stdout } = await execa('node', [CLI_PATH, 'lookup', '--term', '視頻']);

      expect(stdout).toContain('視頻');
      expect(stdout).toContain('hazard');
      expect(stdout).toContain('影片');
    });

    it('should lookup rule by id', async () => {
      const { stdout } = await execa('node', [CLI_PATH, 'lookup', '--rule', '00001']);

      expect(stdout).toContain('00001');
      expect(stdout).toContain('hazard');
    });

    it('should handle unknown term', async () => {
      const { stdout } = await execa('node', [CLI_PATH, 'lookup', '--term', '不存在的詞']);

      expect(stdout).toContain('未在詞庫中');
    });
  });

  describe('stats command', () => {
    it('should display statistics', async () => {
      const { stdout } = await execa('node', [CLI_PATH, 'stats']);

      expect(stdout).toContain('詞庫統計');
      expect(stdout).toContain('版本');
      expect(stdout).toContain('總規則數');
      expect(stdout).toContain('總詞彙數');
      expect(stdout).toContain('hazard');
      expect(stdout).toContain('error');
    });
  });
});
