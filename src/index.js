import * as core from '@discipl/core'
import { BaseConnector } from '@discipl/core-baseconnector'

import { map } from 'rxjs/operators'

const ABUNDANCE_SERVICE_NEED_PREDICATE = 'need'
const ABUNDANCE_SERVICE_ATTENDTO_PREDICATE = 'attendTo'
const ABUNDANCE_SERVICE_MATCH_PREDICATE = 'matchedNeed'
const ABUNDANCE_SERVICE_OFFER_PREDICATE = 'offer'
const ABUNDANCE_SERVICE_REQUIRE_PREDICATE = 'require'
const ABUNDANCE_SERVICE_REFER_TO_PREDICATE = 'referTo'
const ABUNDANCE_SERVICE_REFERRED_FROM_PREDICATE = 'referredFrom'

/**
 * retrieve the loaded discipl core api object used by this module
 */
const getCoreAPI = () => {
  return core
}

/**
 * @typedef {Object} NeedResult
 * @property {object} needSsid - Ssid created to publically express the need
 * @property {object} myPrivateSsid - Ssid created to privately communicate with party serving need
 * @property {string} theirPrivateDid - Did created to match need in private
 * @property {Promise<object>} serviceInformationPromise - Promise with the first claim made in the private channel (likely require)
 */

/**
 * Register a need by creating a new ssid that claims the need in itś channel on the platform corresponding to the given connector
 *
 * It will then set up a private channel to communicate with the party that matches the need
 *
 * @param {string} connectorName
 * @param {string} what - Identifier of the need being expressed
 * @returns {NeedResult}
 */
const need = async (connectorName, what) => {
  let ssid = await core.newSsid(connectorName)

  let matchObserveResult = (await core.observe(null, ssid, { [ABUNDANCE_SERVICE_MATCH_PREDICATE]: ssid.did }, false, await getCoreAPI().getConnector(connectorName)))

  let matchPromise = matchObserveResult.takeOne()

  await core.allow(ssid)
  await core.claim(ssid, { [ABUNDANCE_SERVICE_NEED_PREDICATE]: what })

  let matchClaim = await matchPromise

  // TODO: check match referal validity

  let serviceInformationObserve = await core.observe(matchClaim.did, ssid)

  let serviceInformationPromise = serviceInformationObserve.takeOne()

  let myPrivateSsid = await refer(ssid, matchClaim.did)

  return {
    'needSsid': ssid,
    'myPrivateSsid': myPrivateSsid,
    'theirPrivateDid': matchClaim['did'],
    'serviceInformationPromise': serviceInformationPromise
  }
}

/**
 * @typedef {Object} AttendResult
 * @property {object} ssid - Ssid created to publically register attendance
 * @property {core.ObservableResult} observableResult - Can be subscribed on to implement serving of the need
 */

/**
 * Register an abundance service by creating a new ssid that claims the service and what needs it attends to in itś
 * channel on the platform corresponding to the given connector
 *
 * It will automatically set up private channels with matched needing parties
 *
 * @param {string} connectorName
 * @param {string} what - Identifier of the need being attended to
 * @param {string[]} requirements - Hints to what information is required to fulfill the need
 * @returns {AttendResult}
 *
 */
const attendTo = async (connectorName, what, requirements) => {
  let ssid = await core.newSsid(connectorName)
  await core.allow(ssid)
  await core.claim(ssid, { [ABUNDANCE_SERVICE_ATTENDTO_PREDICATE]: what })

  let needObserveResult = (await core.observe(null, { 'did': null, 'privkey': null }, { [ABUNDANCE_SERVICE_NEED_PREDICATE]: what }, false, await getCoreAPI().getConnector(connectorName)))

  let attendObservable = needObserveResult._observable.pipe(map(async (claim) => {
    let referralSsid = await refer(ssid, claim.did)

    let referObserveResult = await core.observe(claim.did, referralSsid, { [ABUNDANCE_SERVICE_REFER_TO_PREDICATE]: null }, false)

    let theirReferClaimPromise = referObserveResult.takeOne()

    await match(referralSsid, claim.did)

    let theirReferClaim = await theirReferClaimPromise
    let theirPrivateDid = theirReferClaim['claim']['data'][ABUNDANCE_SERVICE_REFER_TO_PREDICATE]

    let privateObserveResult = await core.observe(theirPrivateDid, referralSsid)

    let privateObservePromise = privateObserveResult.takeOne()
    await privateObserveResult._readyPromise

    await core.allow(referralSsid, null, theirPrivateDid)
    await require(referralSsid, requirements)

    return { 'theirPrivateDid': theirPrivateDid, 'myPrivateSsid': referralSsid, 'informationPromise': privateObservePromise }
  }))

  return {
    'ssid': ssid,
    'observableResult': new core.ObserveResult(attendObservable, needObserveResult.readyPromise)
  }
}

/**
 * Register a match between a abundance service and a need attending to it. Note that matches can be
 * registered between needs and services that are not really registered to be attending to those needs.
 * Registering the match by a service will trigger actors observing their need
 */
const match = async (referralSsid, didInNeed) => {
  let match = await core.attest(referralSsid, ABUNDANCE_SERVICE_MATCH_PREDICATE, didInNeed)

  return match
}

const require = async (ssid, requirements) => {
  return core.claim(ssid, { [ABUNDANCE_SERVICE_REQUIRE_PREDICATE]: requirements })
}

/**
 * Offer a fulfillment of a need. This must be a link to another claim
 *
 * @param {object} privateSsid
 * @param {string} link
 * @returns {Promise<string>} - The resulting attestation link
 */
const offer = async (privateSsid, link) => {
  return core.attest(privateSsid, ABUNDANCE_SERVICE_OFFER_PREDICATE, link)
}

/**
 * Observe an offer being made in the private channel
 *
 * @param {string} did - Of the party making the offer
 * @param {object} ssid - That allows access to the offer
 * @returns {Promise<{data: Object, previous: string}>} - The contents of the linked offer
 */
const observeOffer = async (did, ssid) => {
  let observeResult = await core.observe(did, ssid, { [ABUNDANCE_SERVICE_OFFER_PREDICATE]: null })

  let resultPromise = observeResult.takeOne().then(async (offer) => {
    let resultLink = offer['claim']['data'][ABUNDANCE_SERVICE_OFFER_PREDICATE]
    return core.get(resultLink, ssid)
  })

  return { 'resultPromise': resultPromise, 'readyPromise': observeResult._readyPromise }
}

const refer = async (originSsid, targetDid) => {
  // TODO: When refer is needed to another platform, allow configuration of this variable
  let connectorName = BaseConnector.getConnectorName(originSsid.did)

  let referralSsid = await core.newSsid(connectorName)
  await core.allow(referralSsid, null, targetDid)
  await core.claim(referralSsid, { [ABUNDANCE_SERVICE_REFERRED_FROM_PREDICATE]: originSsid.did })

  await core.claim(originSsid, { [ABUNDANCE_SERVICE_REFER_TO_PREDICATE]: referralSsid.did })

  return referralSsid
}

export {
  need,
  attendTo,
  offer,
  observeOffer,
  getCoreAPI
}
