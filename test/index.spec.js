/* eslint-env mocha */
import { expect } from 'chai'
import * as svc from '../src/index.js'

describe('descipl-abundance-service-api', () => {
  describe('The discipl abundance service API with ephemeral connector ', () => {
    it('should be able to help fulfill a scenario', async () => {
      let serviceSsidAndObservable = await svc.attendTo('ephemeral', 'beer', ['BSN'])

      serviceSsidAndObservable.observableResult.subscribe({
        'next': async (attendPromise) => {
          let attendDetails = await attendPromise
          let information = await attendDetails.informationPromise

          let bsn = information['claim']['data']['BSN']

          let nlxSsid = await svc.getCoreAPI().newSsid('ephemeral')

          let nlxClaimLink = await svc.getCoreAPI().claim(nlxSsid, { 'BSN': bsn, 'woonplaats': 'Haarlem' })
          await svc.getCoreAPI().allow(nlxSsid, nlxClaimLink, attendDetails.theirPrivateDid)

          await svc.offer(attendDetails.myPrivateSsid, nlxClaimLink)
        } })

      let need = await svc.need('ephemeral', 'beer')

      await need.serviceInformationPromise

      let resultPromise = svc.observeOffer(need.theirPrivateDid, need.myPrivateSsid)

      await svc.getCoreAPI().claim(need.myPrivateSsid, { 'BSN': '123123123' })

      let result = await resultPromise

      expect(result.data).to.deep.equal({
        'BSN': '123123123',
        'woonplaats': 'Haarlem'
      })
    })
  })
})
