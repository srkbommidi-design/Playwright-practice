# Playwright Test Automation Framework

Practice project built to learn and demonstrate Playwright with TypeScript.

## Tech Stack
- Playwright
- TypeScript
- Node.js

## What's Included
- End-to-end UI tests with assertions
- Playwright config setup
- GitHub Actions workflow

## CI Pipeline
- Workflow file: .github/workflows/playwright.yml
- Triggers: push, pull request, manual dispatch, nightly schedule
- Split jobs:
	- sql-validation
	- api-smoke
	- orders-integration
	- ui-regression
	- quality-gate
- Artifacts uploaded per job: playwright-report-* and test-results-*

Run locally before pushing:
- npm run validate:sql
- npm test

## Status
In progress — actively expanding test coverage and framework structure.
