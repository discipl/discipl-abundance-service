/* eslint-env mocha */
import { expect } from 'chai'
import * as svc from '../src/index.js'

describe('descipl-abundance-service-api', () => {
  describe('The discipl abundance service API with memory connector ', () => {
    it('should be able to claim a need', async () => {
      let ssid = await svc.need('memory', 'beer')
      let data = await svc.getCoreAPI().exportLD(ssid)
      // the first claim exported in the channel of the ssid is {need:'beer'}
      let firstClaim = data[ssid.did][0]
      expect(JSON.stringify(firstClaim[Object.keys(firstClaim)[0]])).to.equal(JSON.stringify({ [svc.ABUNDANCE_SERVICE_NEED_PREDICATE]: 'beer' }))
    })

    it('should be able to claim being a service attending to certain needs', async () => {
      let ssid = await svc.attendTo('memory', 'beer')
      let data = await svc.getCoreAPI().exportLD(ssid)
      // the first claim exported in the channel of the ssid is {attendTo:'beer'}
      let firstClaim = data[ssid.did][0]
      expect(JSON.stringify(firstClaim[Object.keys(firstClaim)[0]])).to.equal(JSON.stringify({ [svc.ABUNDANCE_SERVICE_ATTENDTO_PREDICATE]: 'beer' }))
    })

    it('should be able to match a need to a service attending to it', async () => {
      let ssidNeed = await svc.need('memory', 'beer')
      let dataNeed = await svc.getCoreAPI().exportLD(ssidNeed)
      let needClaim = dataNeed[ssidNeed.did][0]

      let ssidService = await svc.attendTo('memory', 'beer')
      await svc.match(ssidService, ssidNeed.did)
      let dataService = await svc.getCoreAPI().exportLD(ssidService, 1)

      // the second claim exported in the channel of the service ssid links to the need claim in the channel of the ssid of the need
      let secondClaim = dataService[ssidService.did][1]
      expect(JSON.stringify(secondClaim[Object.keys(secondClaim)[0]][svc.ABUNDANCE_SERVICE_MATCH_PREDICATE][ssidNeed.did][0])).to.equal(JSON.stringify(needClaim))
    })
  })
})
