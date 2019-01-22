import * as core from 'discipl-core'

const ABUNDANCE_SERVICE_NEED_PREDICATE = 'need'
const ABUNDANCE_SERVICE_ATTENDTO_PREDICATE = 'attendTo'
const ABUNDANCE_SERVICE_MATCH_PREDICATE = 'matchedNeed'

/**
 * retrieve the loaded discipl core api object used by this module
 */
const getCoreAPI = () => {
  return core
}

/**
 * Retrieve what need it is a service is attending to, returning the object (the "what") of the claim the service registered itself with.
 * returns false if it could not be determined using the given did
 */
const getAttendingTo = async (did) => {
  let conversation = await core.exportLD(did, 1)
  if (conversation[did][0] !== undefined &&
    Object.keys(conversation[did][0][Object.keys(conversation[did][0])[0]])[0] === ABUNDANCE_SERVICE_ATTENDTO_PREDICATE) { return Object.keys(conversation[did][0])[0] } else { return false }
}

/**
 * Retrieve the link to the actual claim in which a need (for which the given did should have been created) is expressed
 */
const getNeedClaimLink = async (did) => {
  let conversation = await core.exportLD(did, 1)
  if (conversation[did][0] !== undefined &&
    Object.keys(conversation[did][0][Object.keys(conversation[did][0])[0]])[0] === ABUNDANCE_SERVICE_NEED_PREDICATE) { return Object.keys(conversation[did][0])[0] } else { return false }
}

/**
 * Register a need by creating a new ssid that claims the need in itś channel on the platform corresponding to the given connector
 */
const need = async (connector, what) => {
  let ssid = await core.newSsid(connector)
  await core.claim(ssid, { [ABUNDANCE_SERVICE_NEED_PREDICATE]: what })
  return ssid
}

/**
 * Register an abundance service by creating a new ssid that claims the service and what needs it attends to in itś channel on the platform corresponding to the given connector
 */
const attendTo = async (connector, what) => {
  let ssid = await core.newSsid(connector)
  await core.claim(ssid, { [ABUNDANCE_SERVICE_ATTENDTO_PREDICATE]: what })
  return ssid
}

/**
 * Register a match between a abundance service and a need attending to it. Note that matches can be
 * registered between needs and services that are not really registered to be attending to those needs.
 * Registering the match by a service will trigger actors observing their need
 */
const match = async (ssidService, didInNeed) => {
  let needLink = await getNeedClaimLink(didInNeed)
  if (needLink) {
    return core.attest(ssidService, ABUNDANCE_SERVICE_MATCH_PREDICATE, needLink)
  }
  return false
}

/**
 * Observe the creation of needs attending to or services matching a need on a given platform
 * @param {string} did - either the did of the service observing creation of needs attending to, or the did of the need observing getting matched by services
 * @param {string} connector - name of connector to platform on which to observe
 */
const observe = async (did, connector) => {
  let need = await getAttendingTo(did)

  if (need) {
    let needClaim = await core.get(need)
    let needObject = needClaim['data'][ABUNDANCE_SERVICE_ATTENDTO_PREDICATE]
    return core.observe(null, { [ABUNDANCE_SERVICE_NEED_PREDICATE]: needObject }, false, await getCoreAPI().getConnector(connector))
  } else {
    need = await getNeedClaimLink(did)
    if (need) {
      return core.observe(null, { [ABUNDANCE_SERVICE_NEED_PREDICATE]: need }, false, await getCoreAPI().getConnector(connector))
    }
  }
  return false
}

module.exports = {
  need,
  attendTo,
  observe,
  match,
  getCoreAPI,
  ABUNDANCE_SERVICE_NEED_PREDICATE,
  ABUNDANCE_SERVICE_ATTENDTO_PREDICATE,
  ABUNDANCE_SERVICE_MATCH_PREDICATE
}
