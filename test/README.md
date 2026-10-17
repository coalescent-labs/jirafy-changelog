# Tests

```
npm install
npm test
```

The tests run with [mocha](https://mochajs.org) and need no credentials. The two tests that call the
GitHub API (`github api changelog`) are skipped unless `GITHUB_TOKEN` is set, either in the environment
or in a `.env` file in the root directory:

```
GITHUB_TOKEN=<token> npm test
```

# Anonymize utility
When collecting new data sets for unit tests, anonymize them first: they may contain information from
private repositories such as repository names, branches, authors, commit shas, PR numbers, Jira tickets
and domains.

`test/fixtures/utility` has two directories, `anonymize` and `convert_me`. Their `test` sub-directories
hold the files used by the utility's own tests; the others are for actual usage.

### (Step 1) Anonymize a changelog
- Add your data to `.md` file(s) in `test/fixtures/utility/anonymize`
- Run `JIRA_HOST=<company>.atlassian.net npm run anonymize`, where `JIRA_HOST` is the Jira host found in
  the data. The anonymized and jirafied files are written to `anonymize/done`, prefixed with `anonymized_`.
  `TEST_JIRA_HOST` (default `example-org.atlassian.net`) is the host used in their place.

### (Step 2) Run a changelog function on an anonymized changelog
- Move your `anonymized_*` file(s) to `test/fixtures/utility/convert_me`
- Run `JIRA_HOST=<company>.atlassian.net npm run convert`: the files are jirafied into `convert_me/done`.
  To use another function, change the call in `test/utility/run.js`.
