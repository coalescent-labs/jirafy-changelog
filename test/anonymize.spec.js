const chai = require('chai')
const fs = require('fs')
const path = require('path')
const { jirafyChangelog } = require('../utils/changelog')
const anonymizer = require('./utility/anonymize')

const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', 'utility', name), 'utf8')
const { anonymize, rename, getDomain } = anonymizer({
  jiraHost: 'google.atlassian.net',
  testJiraHost: 'example-org.atlassian.net',
})

describe('Anonymize Utility', () => {
  it('leaves an already anonymized changelog unchanged', () => {
    const base = fixture('anonymize/test/test_base.md')
    chai.assert.equal(anonymize(base), base)
  })

  it('anonymizes shas, tickets, domains and merge messages', () => {
    const base = fixture('anonymize/test/test_not_equal_base.md')
    const anonymized = anonymize(base)
    chai.assert.notEqual(anonymized, base)
    chai.assert.notInclude(anonymized, 'google')
    chai.assert.notInclude(anonymized, '05072624d24265aedad3608a245b22db24432d95')
  })

  it('anonymizes a jirafied changelog', () => {
    const anonymized = anonymize(jirafyChangelog(fixture('anonymize/test/test_not_equal_base.md')))
    chai.assert.notInclude(anonymized, 'google')
  })

  it('rename anonymize', () => {
    chai.assert.equal(rename('anonymize_rename_test.md'), 'anonymized_rename_test.md')
  })

  it('rename anonymized', () => {
    chai.assert.equal(rename('anonymized_rename_test.md'), 'anonymized_rename_test.md')
  })

  it('rename unanonymized', () => {
    chai.assert.equal(rename('another_rename_test.md'), 'anonymized_another_rename_test.md')
  })

  it('parse domain from jira host', () => {
    chai.assert.equal(getDomain('example-org.atlassian.net'), 'example-org')
  })
})
