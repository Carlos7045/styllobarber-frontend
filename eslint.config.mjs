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

  // Regras customizadas mais permissivas para desenvolvimento
  {
    rules: {
      // Warnings apenas para problemas críticos
      "no-unused-vars": "warn",
      "no-console": "off", // Permitir console durante desenvolvimento
      "no-debugger": "warn",
      "prefer-const": "warn",

      // Next.js específico
      "@next/next/no-img-element": "warn",

      // Desabilitar regras problemáticas
      "react/display-name": "off",
      "react/no-unescaped-entities": "off", // Permitir aspas não escapadas
      "react-hooks/exhaustive-deps": "warn", // Apenas warning para deps
      "react-hooks/rules-of-hooks": "warn", // Warning em vez de error
      
      // TypeScript - muito permissivo para desenvolvimento
      "@typescript-eslint/no-unused-vars": "off", // Desabilitar durante desenvolvimento
      "@typescript-eslint/no-explicit-any": "off", // Permitir any durante desenvolvimento
      "@typescript-eslint/no-require-imports": "off", // Permitir require em testes
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
    },
  },

  // Regras específicas para arquivos de teste
  {
    files: ["**/__tests__/**/*", "**/*.test.*", "**/*.spec.*"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },

  // Regras específicas para arquivos de lib/utilitários
  {
    files: ["src/lib/**/*", "src/utils/**/*"],
    rules: {
      "no-console": "off", // Permitir console em utilitários
      "@typescript-eslint/no-explicit-any": "warn", // Apenas warning
    },
  },
];

export default eslintConfig;