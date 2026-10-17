// Loaded by .mocharc.js before any spec: utils/changelog reads the host when first required
require('dotenv').config({ quiet: true })
process.env.TEST_JIRA_HOST = process.env.TEST_JIRA_HOST || 'example-org.atlassian.net'
process.env.JIRA_HOST = process.env.TEST_JIRA_HOST
