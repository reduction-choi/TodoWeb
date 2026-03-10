import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 배포 시 레포명으로 base 설정
  // 예: https://username.github.io/my-repo → base: '/my-repo/'
  base: '/task-manager/', // ← 본인 레포명으로 변경하세요
});
