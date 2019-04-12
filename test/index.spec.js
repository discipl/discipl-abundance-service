/* eslint-env mocha */
import { expect } from 'chai'
import * as svc from '../src/index.js'
import * as core from '@discipl/core'

import sinon from 'sinon'

describe('descipl-abundance-service-api', () => {
  describe('with mocked dependencies', () => {
    it('should be able to express an offer', async () => {
      let attestStub = sinon.stub(core, 'attest')
        .returns('link:discipl:mock:123123')

      let ssid = {
        'did': 'did:discipl:mock:abc',
        'privkey': 'SECRET'
      }

      let offerLink = await svc.offer(ssid, 'link:discipl:mock:456')

      expect(offerLink).to.equal('link:discipl:mock:123123')

      expect(attestStub.callCount).to.equal(1)
      expect(attestStub.args[0]).to.deep.equal([ssid, 'offer', 'link:discipl:mock:456'])

      attestStub.restore()
    })
  })
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
