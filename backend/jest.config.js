/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.ts"],
  globals: {
    "ts-jest": { tsconfig: { esModuleInterop: true } },
  },
};
