// Fixture utility, see test/README.md
//   npm run anonymize  -> test/fixtures/utility/anonymize/*.md  => anonymize/done/anonymized_*.md (anonymized, then jirafied)
//   npm run convert    -> test/fixtures/utility/convert_me/*.md => convert_me/done/*.md (jirafied)
require('dotenv').config({ quiet: true })
const fs = require('fs')
const path = require('path')

const mode = process.argv[2]
const jiraHost = process.env.JIRA_HOST
const testJiraHost = process.env.TEST_JIRA_HOST || 'example-org.atlassian.net'
if (!['anonymize', 'convert'].includes(mode) || !jiraHost) {
  console.error('Usage: JIRA_HOST=<company>.atlassian.net node test/utility/run.js anonymize|convert')
  process.exit(1)
}

// jirafy with the test host, so no real host ends up in the fixtures
process.env.JIRA_HOST = testJiraHost
const { jirafyChangelog } = require('../../utils/changelog')
const { anonymize, rename } = require('./anonymize')({ jiraHost, testJiraHost })

const dir = path.join(__dirname, '..', 'fixtures', 'utility', mode === 'anonymize' ? 'anonymize' : 'convert_me')
fs.mkdirSync(path.join(dir, 'done'), { recursive: true })
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  const changelog = fs.readFileSync(path.join(dir, file), 'utf8')
  const output = mode === 'anonymize' ? jirafyChangelog(anonymize(changelog)) : jirafyChangelog(changelog)
  const target = path.join(dir, 'done', mode === 'anonymize' ? rename(file) : file)
  fs.writeFileSync(target, output)
  console.log(`${file} -> ${path.relative(process.cwd(), target)}`)
}
