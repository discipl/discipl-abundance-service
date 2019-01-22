import * as core from 'discipl-core'

const ABUNDANCE_SERVICE_NEED_PREDICATE = 'need'
const ABUNDANCE_SERVICE_ATTENDTO_PREDICATE = 'attendTo'
const ABUNDANCE_SERVICE_MATCH_PREDICATE = 'matchedNeed'

const getCoreAPI = () => {
  return core
}

/**
 * retrieve what need it is a service is attending to, returning the object (the "what") of the claim the service registered itself with.
 * returns false if it could not be determined using the given did
 */
const getAttendingTo = async (did) => {
  let conversation = await core.exportLD(did, 1)
  if(conversation[did][0] !== undefined &&
    Object.keys(conversation[did][0][Object.keys(conversation[did][0])[0]])[0] == ABUNDANCE_SERVICE_ATTENDTO_PREDICATE)
    return Object.keys(conversation[did][0])[0]
  else
    return false
}

/**
 * retrieve what need it is a service is attending to, returning the object (the "what") of the claim the service registered itself with.
 * returns false if it could not be determined using the given did
 */
const getNeedClaimLink = async (did) => {
  let conversation = await core.exportLD(did, 1)
  if(conversation[did][0] !== undefined &&
    Object.keys(conversation[did][0][Object.keys(conversation[did][0])[0]])[0] == ABUNDANCE_SERVICE_NEED_PREDICATE)
    return Object.keys(conversation[did][0])[0]
  else
    return false
}

const need = async (connector, what) => {
  let ssid = await core.newSsid(connector)
  let link = await core.claim(ssid, {[ABUNDANCE_SERVICE_NEED_PREDICATE]:what})
  return ssid
}

const attendTo = async (connector, what) => {
  let ssid = await core.newSsid(connector)
  await core.claim(ssid, {[ABUNDANCE_SERVICE_ATTENDTO_PREDICATE]:what})
  return ssid
}

const match = async (ssidService, didInNeed) => {
  let need = await getNeedClaimLink(didInNeed)
  if (need) {
    return core.claim(ssidService, {[ABUNDANCE_SERVICE_MATCH_PREDICATE]:need})
  }
  return false
}

/**
 * observe the creation of needs attending to or services matching a need on a given platform
 * @param {string} did - either the did of the service observing creation of needs attending to, or the did of the need observing getting matched by services
 * @param {string} connector - name of connector to platform on which to observe
 */
const observe = async (did, connector) => {
  let need = await getAttendingTo(did)
  if (need) {
    return core.observe(connector, {[ABUNDANCE_SERVICE_NEED_PREDICATE]: need})
  } else {
    need = await getNeedClaimLink(did)
    if (need) {
      return core.observe(connector, {[ABUNDANCE_SERVICE_MATCH_PREDICATE]: need})
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
