const crypto = require('crypto')

/**
 * Anonymizes changelogs collected for test fixtures: replaces commit shas, jira tickets,
 * jira domains and merge messages. See test/README.md.
 * @param {Object} hosts
 * @param {String} hosts.jiraHost Jira host found in the source changelog (i.e company.atlassian.net)
 * @param {String} hosts.testJiraHost Jira host used in its place (i.e example-org.atlassian.net)
 */
module.exports = function anonymizer({ jiraHost, testJiraHost }) {
  // before anonymization
  const prodDomain = getDomain(jiraHost)
  // after anonymization
  const testDomain = getDomain(testJiraHost)

  /**
   * Anonymizes a given changelog by replacing github shas, jira ticket references and all domains
   * @param {String} changelog
   * @returns {String} Anonymized changelog
   */
  function anonymize(changelog) {
    let revisedChangelog = replaceSHA(changelog)
    revisedChangelog = replaceJiraTickets(revisedChangelog)
    revisedChangelog = domainSwap(revisedChangelog)

    // avoids pr # generation if changelogs are equal
    if (changelog === revisedChangelog) {
      return generateMergeMessage(revisedChangelog, false)
    }
    return generateMergeMessage(revisedChangelog)
  }

  /**
   * Anonymizes github shas
   * @param {String} changelog
   * @returns {String} Anonymized changelog
   */
  function replaceSHA(changelog) {
    const regex = new RegExp(
      '(?:\\*\\s\\[\\`)([a-z0-9]+)(?:\\`\\]\\(http:\\/\\/github.com\\/' +
        prodDomain +
        ')(?:\\/.*)(?:\\/?)(?:commit\\/)([a-z0-9]+)(?:\\)\\s)',
      'gm'
    )

    return changelog.replace(regex, () => {
      const sha = generateSha()
      return `* [\`${sha.substring(0, 7)}\`](http://github.com/${testDomain}/commit/${sha}) `
    })
  }

  /**
   * Swaps all referenced jira tickets with generated ones
   * @param {String} changelog
   * @returns {String} Anonymized changelog
   */
  function replaceJiraTickets(changelog) {
    // Replace grouped formatted jira tickets first
    let regex = new RegExp(
      '(([A-Z]+-[0-9]+)(\\`\\]\\()(https:\\/\\/' + prodDomain + '.atlassian.net\\/browse\\/)([A-Z+-[0-9]+)(\\)))',
      'gm'
    )
    let revisedChangelog = changelog.replace(regex, () => {
      const jiraTicket = generateJiraTicket()
      return `${jiraTicket}\`](https://${testJiraHost}/browse/${jiraTicket})`
    })

    // Replace single instances of jira tickets
    regex = /([a-zA-Z0-9]+)(-\d+)(?=([a-zA-Z0-9]+)(-\d+)(?=\s|\,)|\])|([a-zA-Z0-9]+)(-\d+)(?=\s|\,|\])/g
    return revisedChangelog.replace(regex, () => generateJiraTicket())
  }

  /**
   * Swaps production domains for test domain
   * @param {String} changelog
   * @returns {String} Anonymized changelog
   */
  function domainSwap(changelog) {
    const regex = new RegExp(`(https://)(${jiraHost.replace(/\./g, '\\.')})`, 'g')
    return changelog.replace(regex, `$1${testJiraHost}`)
  }

  return { anonymize, rename, getDomain }
}

/**
 * Renames file to established convention.
 * anonymize_ => anonymized_
 * anonymized_ => anonymized_
 * some_name => anonymized_some_name
 * @param {String} file
 * @returns {String} Renamed File
 */
function rename(file) {
  if (file.startsWith('anonymized_')) {
    return file
  }
  if (file.startsWith('anonymize_')) {
    return 'anonymized_' + file.substring('anonymize_'.length)
  }
  return 'anonymized_' + file
}

/**
 * Parses a jira host for the subdomain
 * @param {String} host i.e example-org.atlassian.net
 * @returns {String} subdomain
 */
function getDomain(host) {
  return host.replace(/(^.*)\.atlassian.net/g, '$1')
}

/**
 * Generates a github sha
 * @returns {String} github sha
 */
function generateSha() {
  return crypto.randomBytes(20).toString('hex')
}

/**
 * Generates a random string from a charset
 * @param {Number} length
 * @param {String} charset
 * @returns {String}
 */
function randomString(length, charset) {
  return Array.from({ length }, () => charset[crypto.randomInt(charset.length)]).join('')
}

/**
 * Generates a random jira ticket
 * @returns {String} Random jira ticket
 */
function generateJiraTicket() {
  return `${randomString(4, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')}-${randomString(4, '0123456789')}`
}

/**
 * Generates a random merge message
 * @param {String} changelog
 * @param {Boolean} generatePR
 * @returns {String} Anonymized changelog
 */
function generateMergeMessage(changelog, generatePR = true) {
  const regex = /(Merge\spull\srequest\s)(#[0-9]+)(\sfrom\s)(.*)/gm

  return changelog.replace(regex, (s, m1, m2) => {
    if (generatePR) {
      return `Merge pull request #${randomString(3, '0123456789')} from author/org/branch-name`
    }
    return `Merge pull request ${m2} from author/org/branch-name`
  })
}
