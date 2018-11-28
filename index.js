const core = require('discipl-core')

const ABUNDANCE_SERVICE_NEED_PREDICATE = 'need'
const ABUNDANCE_SERVICE_ATTENDTO_PREDICATE = 'attendTo'
const ABUNDANCE_SERVICE_SERVICEINFO_PREDICATE = 'serviceInfo'
const ABUNDANCE_SERVICE_MATCH_PREDICATE = 'matchedNeed'
const ABUNDANCE_SERVICE_SOLVED_PREDICATE = 'solvedNeed'
const ABUNDANCE_SERVICE_REFERTO_PREDICATE = 'referTo'
const ABUNDANCE_SERVICE_REFERRED_FROM_PREDICATE = 'referredFrom'

const getAttendingTo = async (did) => {
  let conversation = await core.exportLD(did, 1)
  return Object.keys(conversation[did])[0]
}

const getNeedClaimLink = async (did) => {
  let conversation = await core.exportLD(did, 1)
  return Object.keys(conversation[did])[0]
}

const need = async (connector, what) => {
  let ssid = await core.newSsid(connector)
  core.claim(ssid, ABUNDANCE_SERVICE_NEED_PREDICATE, what)
  return ssid
}

const attendTo = async (connector, what) => {
  let ssid = await core.newSsid(connector)
  core.claim(ssid, ABUNDANCE_SERVICE_ATTENDTO_PREDICATE, what)
  return ssid
}

const serviceInfo = async (ssid, info) => {
  return core.claim(ssid, ABUNDANCE_SERVICE_SERVICEINFO_PREDICATE, info)
}

const subscribe = async (did) {
  let need = await getAttendingTo(did)
  if(need) {
    return core.subscribe(null, ABUNDANCE_SERVICE_NEED_PREDICATE, need)
  } else {
    need = await getNeedClaimLink(did)
    if(need) {
      return core.subscribe(null, ABUNDANCE_SERVICE_MATCH_PREDICATE, need)
    }
  }
  return false
}

const match = async (ssidService, didInNeed) => {
  let need = await getNeedClaimLink(didInNeed)
  if(need) {
    return core.claim(ssidService, ABUNDANCE_SERVICE_MATCH_PREDICATE, need)
  }
  return false
}

const solved = async (ssidInNeed) => {
  let need = await getNeedClaimLink(ssidInNeed.did)
  if(need) {
    return core.claim(ssidInNeed, ABUNDANCE_SERVICE_SOLVED_PREDICATE, need)
  }
  return false
}

const referTo = async (ssidA, ssidB) => {
  let link = core.claim(ssidA, ABUNDANCE_SERVICE_REFERTO_PREDICATE, ssidB.did)
  return core.attest(ssidB, ABUNDANCE_SERVICE_REFERRED_FROM_PREDICATE, link)
}

module.exports = {
  need,
  attendTo,
  serviceInfo,
  subscribe,
  match,
  solved,
  referTo
}
