/* eslint-env mocha */
import { expect } from 'chai'
import * as svc from '../src/index.js'

import { take } from 'rxjs/operators'

describe('descipl-abundance-service-api', () => {
  describe('The discipl abundance service API with ephemeral connector ', () => {
    it('should be able to claim a need', async () => {
      let ssid = await svc.need('ephemeral', 'beer')
      let data = await svc.getCoreAPI().exportLD(ssid.did)
      // the first claim exported in the channel of the ssid is {need:'beer'}
      let firstClaim = data[ssid.did][0]
      expect(JSON.stringify(firstClaim[Object.keys(firstClaim)[0]])).to.equal(JSON.stringify({ [svc.ABUNDANCE_SERVICE_NEED_PREDICATE]: 'beer' }))
    })

    it('should be able to claim being a service attending to certain needs', async () => {
      let ssid = await svc.attendTo('ephemeral', 'beer')
      let data = await svc.getCoreAPI().exportLD(ssid.did)
      // the first claim exported in the channel of the ssid is {attendTo:'beer'}
      let firstClaim = data[ssid.did][0]
      expect(JSON.stringify(firstClaim[Object.keys(firstClaim)[0]])).to.equal(JSON.stringify({ [svc.ABUNDANCE_SERVICE_ATTENDTO_PREDICATE]: 'beer' }))
    })

    it('should be able to match a need to a service attending to it', async () => {
      let ssidNeed = await svc.need('ephemeral', 'beer')
      let dataNeed = await svc.getCoreAPI().exportLD(ssidNeed.did)
      let needClaim = dataNeed[ssidNeed.did][0]

      let ssidService = await svc.attendTo('ephemeral', 'beer')
      await svc.match(ssidService, ssidNeed.did)
      let dataService = await svc.getCoreAPI().exportLD(ssidService.did, 1)

      // the second claim exported in the channel of the service ssid links to the need claim in the channel of the ssid of the need
      let secondClaim = dataService[ssidService.did][1]
      expect(JSON.stringify(secondClaim[Object.keys(secondClaim)[0]][svc.ABUNDANCE_SERVICE_MATCH_PREDICATE][ssidNeed.did][0])).to.equal(JSON.stringify(needClaim))
    })

    it('should be able to observe a need being attended', async () => {
      let ssidService = await svc.attendTo('ephemeral', 'beer')

      let observedNeedPromise = (await svc.observe(ssidService.did, 'ephemeral')).pipe(take(1)).toPromise()
      let ssidNeed = await svc.need('ephemeral', 'beer')
      let observedNeed = await observedNeedPromise

      expect(observedNeed).to.deep.equal({
        'claim': {
          'data': {
            'need': 'beer'
          },
          'previous': null
        },
        'did': ssidNeed.did
      })
    })

    it('should be able to observe a need being matched', async () => {
      let ssidService = await svc.attendTo('ephemeral', 'beer')
      let dataAttend = await svc.getCoreAPI().exportLD(ssidService.did)
      let attendClaimLink = Object.keys(dataAttend[ssidService.did][0])[0]

      let ssidNeed = await svc.need('ephemeral', 'beer')
      let dataNeed = await svc.getCoreAPI().exportLD(ssidNeed.did)
      let needClaimLink = Object.keys(dataNeed[ssidNeed.did][0])[0]

      let observedMatchPromise = (await svc.observe(ssidNeed.did, 'ephemeral')).pipe(take(1)).toPromise()

      await svc.match(ssidService, ssidNeed.did)

      let observedMatch = await observedMatchPromise

      expect(observedMatch).to.deep.equal({
        'claim': {
          'data': {
            'matchedNeed': needClaimLink
          },
          'previous': attendClaimLink
        },
        'did': ssidService.did
      })
    })

    it('should be able to observe a need being matched by listening as attending service', async () => {
      let ssidService = await svc.attendTo('ephemeral', 'beer')
      let dataAttend = await svc.getCoreAPI().exportLD(ssidService.did)
      let attendClaimLink = Object.keys(dataAttend[ssidService.did][0])[0]

      let observedNeedPromise = (await svc.observe(ssidService.did, 'ephemeral')).pipe(take(1)).toPromise()
      let ssidNeed = await svc.need('ephemeral', 'beer')
      let dataNeed = await svc.getCoreAPI().exportLD(ssidNeed.did)
      let needClaimLink = Object.keys(dataNeed[ssidNeed.did][0])[0]
      let observedNeed = await observedNeedPromise
      let observedMatchPromise = (await svc.observe(ssidNeed.did, 'ephemeral')).pipe(take(1)).toPromise()
      await svc.match(ssidService, observedNeed.did)

      let observedMatch = await observedMatchPromise

      expect(observedMatch).to.deep.equal({
        'claim': {
          'data': {
            'matchedNeed': needClaimLink
          },
          'previous': attendClaimLink
        },
        'did': ssidService.did
      })
    })
  })
})
