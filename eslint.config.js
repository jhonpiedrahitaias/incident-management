// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    // --- La capa de dominio no depende de Angular ---------------------------
    //
    // Entidades y puertos. Que esto sea una regla y no un acuerdo es lo que
    // hace que siga siendo cierto dentro de seis meses: un `inject()` puesto
    // por costumbre falla en el linter, no en la revisión de nadie.
    //
    // Se aplica también a los `.spec.ts`: el dominio se prueba sin TestBed.
    // Si una prueba de dominio necesita Angular, lo que hay que revisar es el
    // dominio.
    files: ["src/app/core/models/**/*.ts", "src/app/core/ports/**/*.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@angular/*", "@angular/**"],
              message:
                "La capa de dominio (models/ y ports/) no puede importar Angular. " +
                "Si necesitas un InjectionToken, va en core/di/tokens.ts. " +
                "Ver docs/arquitectura-hexagonal.md.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  }
]);