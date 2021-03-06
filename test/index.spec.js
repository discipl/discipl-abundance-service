/* eslint-env mocha */
import { expect } from 'chai'
import { DisciplCore } from '@discipl/core'

import sinon from 'sinon'
import { AbundanceService } from '../src/index'

let svc

describe('descipl-abundance-service-api', () => {
  describe('with mocked dependencies', () => {
    it('should be able to express an offer', async () => {
      let core = new DisciplCore()
      let attestStub = sinon.stub(core, 'attest')
        .returns('link:discipl:mock:123123')

      let ssid = {
        'did': 'did:discipl:mock:abc',
        'privkey': 'SECRET'
      }

      let abundanceService = new AbundanceService(core)
      let offerLink = await abundanceService.offer(ssid, 'link:discipl:mock:456')

      expect(offerLink).to.equal('link:discipl:mock:123123')

      expect(attestStub.callCount).to.equal(1)
      expect(attestStub.args[0]).to.deep.equal([ssid, 'offer', 'link:discipl:mock:456'])

      attestStub.restore()
    })
  })
  describe('The discipl abundance service API with ephemeral connector ', () => {
    before(() => {
      svc = new AbundanceService()
    })
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

      let observeOffer = await svc.observeOffer(need.theirPrivateDid, need.myPrivateSsid)

      await observeOffer.readyPromise

      await svc.getCoreAPI().claim(need.myPrivateSsid, { 'BSN': '123123123' })

      let result = await observeOffer.resultPromise

      expect(result.claim.data).to.deep.equal({
        'BSN': '123123123',
        'woonplaats': 'Haarlem'
      })

      expect(result.link).to.be.a('string')
    })
  })
})
