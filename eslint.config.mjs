import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignorar arquivos primeiro
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "*.config.js",
      "*.config.mjs",
      "public/**",
      ".kiro/**",
      "supabase/**",
    ]
  },
  
  // Usar configuração do Next.js que já inclui TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Regras customizadas mais simples
  {
    rules: {
      // Reduzir para apenas warnings essenciais
      "no-unused-vars": "warn",
      "no-console": "warn",
      "no-debugger": "warn",
      "prefer-const": "warn",
      
      // Next.js específico
      "@next/next/no-img-element": "warn",
      
      // Desabilitar regras problemáticas
      "react/display-name": "off",
    },
  },
];

export default eslintConfig;