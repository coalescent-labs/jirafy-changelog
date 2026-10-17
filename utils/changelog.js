const core = require('@actions/core')
var jiraHost =
  core.getInput('jiraHost') ||
  process.env.JIRA_HOST ||
  (typeof Cypress !== 'undefined' ? Cypress.env('TEST_JIRA_HOST') : '')

/**
 * Regex source matching a Jira ticket (KEY-123). The project comes from the key itself.
 * A ticket must not follow a letter, "-" or "." nor be followed by another "-<digits>" group, so
 * CVE-2021-44228, 1.2.3-fork-2 or service-alpha-14.1 are not taken for tickets.
 * @param {Boolean} anyCase Match lowercase keys too
 * @returns {String} Regex source
 */
function ticketPattern(anyCase = false) {
  const key = anyCase ? '[a-zA-Z][a-zA-Z0-9]+' : '[A-Z][A-Z0-9]+'
  return `(?<![A-Za-z_.-])${key}-\\d+(?!-?\\d)`
}

/**
 * Strips referenced jira tickets that are already surrounded by brackets.
 * Assumes tickets are uppercase.
 * @param {String} changelog
 * @returns Modified changelog
 */
function stripBrackets(changelog) {
  let revisedChangelog

  try {
    // remove any matched or unmatched bracket adjacent to a JIRA ticket number
    const regex = new RegExp(`(?:\\[?)(${ticketPattern()})(?:\\]?)`, 'g')
    revisedChangelog = changelog.replace(regex, '$1')
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Formats referenced jira tickets to uppercase.
 * @param {String} changelog
 * @returns {String} Modified changelog
 */
function toUpperJiraTickets(changelog) {
  let revisedChangelog

  try {
    const regex = new RegExp(`(${ticketPattern(true)})`, 'g')
    revisedChangelog = changelog.replace(regex, (p1) => p1.toUpperCase())
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Separates referenced Jira Tickets with a comma space format.
 * Assumes tickets are uppercase and brackets have been removed.
 * @param {String} changelog
 * @returns Modified changelog
 */
function addCommaSpaceBetweenJiraTickets(changelog) {
  let revisedChangelog

  try {
    const regex = new RegExp(`(${ticketPattern()})[, ]*(?=${ticketPattern()})`, 'g')

    revisedChangelog = changelog.replace(regex, '$1, ')
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Surrounds jira ticket list with brackets.
 * Assumes tickets are uppercase and separated by a comma and space, and brackets have been removed
 * @param {String} changelog
 * @returns Modified changelog
 */
function surroundTicketListWithBrackets(changelog) {
  let revisedChangelog

  try {
    const regex = new RegExp(`((?:${ticketPattern()}, )*(?:${ticketPattern()}))`, 'g')
    revisedChangelog = changelog.replace(regex, '[$1]')
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Adds Jira markdown links to a given changelog for referenced Jira Tickets.
 * @param {String} changelog
 * @returns {String} Modified changelog
 */
function addJiraLinksToChangelog(changelog) {
  let revisedChangelog

  try {
    const regex = new RegExp(`(${ticketPattern()})`, 'g')
    revisedChangelog = changelog.replace(regex, `[\`$1\`](https://${jiraHost}/browse/$1)`)
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }

  return revisedChangelog
}

/**
 * Formats a changelog and adds Jira markdown links for referenced Jira Tickets
 * @param {String} changelog
 * @returns {String} Modified changelog
 */
function jirafyChangelog(changelog) {
  let revisedChangelog = toUpperJiraTickets(changelog)
  revisedChangelog = stripBrackets(revisedChangelog)
  revisedChangelog = addCommaSpaceBetweenJiraTickets(revisedChangelog)
  revisedChangelog = surroundTicketListWithBrackets(revisedChangelog)
  return addJiraLinksToChangelog(revisedChangelog)
}

module.exports = {
  jirafyChangelog,
  addJiraLinksToChangelog,
  toUpperJiraTickets,
  stripBrackets,
  addCommaSpaceBetweenJiraTickets,
  surroundTicketListWithBrackets,
}
