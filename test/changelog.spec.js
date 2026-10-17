const chai = require('chai')
const fs = require('fs')
const path = require('path')
const {
  jirafyChangelog,
  toUpperJiraTickets,
  addJiraLinksToChangelog,
  stripBrackets,
  addCommaSpaceBetweenJiraTickets,
  surroundTicketListWithBrackets,
} = require('../utils/changelog')

const owner = 'coalescent-labs'
const repo = 'jirafy-changelog'
const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')

describe('Jirafy Changelog', () => {
  context('changelog', () => {
    // Calls the GitHub API: runs only when GITHUB_TOKEN is set (env or .env)
    async function generateNotes(tagName, previousTagName) {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/generate-notes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
        body: JSON.stringify({ tag_name: tagName, target_commitish: 'main', previous_tag_name: previousTagName }),
      })
      chai.assert.isTrue(res.ok, `GitHub API returned ${res.status}`)
      return (await res.json()).body
    }

    it('github api changelog - different tag', async function () {
      if (!process.env.GITHUB_TOKEN) this.skip()
      chai.assert.equal(await generateNotes('v4.0.1', 'v4.0.0'), fixture('changelog/output-changelog-different-tag.md'))
    })

    it('github api changelog - same tag', async function () {
      if (!process.env.GITHUB_TOKEN) this.skip()
      chai.assert.equal(await generateNotes('v4.0.1', 'v4.0.1'), fixture('changelog/output-changelog-same-tag.md'))
    })
  })

  context('formatting', () => {
    const cases = [
      [
        'ensures changelog is stripped of brackets',
        stripBrackets,
        'stripBrackets/input-brackets.md',
        'stripBrackets/output-without-brackets.md',
      ],
      [
        'ensures jira tickets referenced are surrounded by brackets',
        surroundTicketListWithBrackets,
        'surroundTicketListWithBrackets/input-without-brackets.md',
        'surroundTicketListWithBrackets/output-normalized-brackets.md',
      ],
      [
        'ensures references to jira tickets are uppercase',
        toUpperJiraTickets,
        'toUpperJiraTickets/input-before-uppercasing-jira-key.md',
        'toUpperJiraTickets/output-uppercase-jira-key.md',
      ],
      [
        'ensures jira tickets referenced are displayed with proper comma and spacing',
        addCommaSpaceBetweenJiraTickets,
        'addCommaSpaceBetweenJiraTickets/input-multiple-tickets.md',
        'addCommaSpaceBetweenJiraTickets/output-multiple-tickets-normalized-separators.md',
      ],
      [
        'ensures markdown links are added to jira tickets',
        addJiraLinksToChangelog,
        'addJiraLinksToChangelog/input-before-adding-links.md',
        'addJiraLinksToChangelog/output-after-adding-links.md',
      ],
      [
        'ensures a changelog is correctly and completely jirafied',
        jirafyChangelog,
        'jirafyChangelog/input-original-changelog-before-jirafy.md',
        'jirafyChangelog/output-changelog-after-jirafy.md',
      ],
      [
        'ensures CVE ids and version suffixes are not taken for jira tickets',
        jirafyChangelog,
        'jirafyChangelog/false-positives/input.md',
        'jirafyChangelog/false-positives/output.md',
      ],
    ]

    for (const [title, fn, input, output] of cases) {
      it(title, () => {
        chai.assert.equal(fn(fixture(input)), fixture(output))
      })
    }

    it.skip('[SDET-609] fails if known issues are still present', () => {
      chai.assert.equal(
        jirafyChangelog(fixture('jirafyChangelog/known-issues/sdet-609/input-sdet-609.md')),
        fixture('jirafyChangelog/known-issues/sdet-609/output-sdet-609.md')
      )
    })
  })
})
