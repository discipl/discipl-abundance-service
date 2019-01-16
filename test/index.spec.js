/* eslint-env mocha */
import { expect } from 'chai'
import * as svc from '../src/index.js'

import sinon from 'sinon'

describe('descipl-abundance-service-api', () => {
  describe('The discipl abundance service API with memory connector ', () => {
    it('should be able to claim a need', async () => {
      let ssid = await svc.need('memory', 'beer')
      let data = await svc.getCoreAPI().exportLD(ssid)
      // the first claim exported in the channel of the ssid is {need:'beer'}
      expect(JSON.stringify(data[Object.keys(data)[0]][Object.keys(data[Object.keys(data)[0]])[0]])).to.equal(JSON.stringify({need:'beer'}))
    })

    it('should be able to claim being a service attending to certain needs', async () => {
      let ssid = await svc.attendTo('memory', 'beer')
      let data = await svc.getCoreAPI().exportLD(ssid)
      // the first claim exported in the channel of the ssid is {attendTo:'beer'}
      expect(JSON.stringify(data[Object.keys(data)[0]][Object.keys(data[Object.keys(data)[0]])[0]])).to.equal(JSON.stringify({attendTo:'beer'}))
    })

    it('should be able to claim additional service info about a service that attends to needs', async () => {
      let ssid = await svc.attendTo('memory', 'beer')
      console.log(ssid.did)
      await svc.serviceInfo(ssid, 'memory', 'only non alcoholic')
      let data = await svc.getCoreAPI().exportLD(ssid)
      // the second claim exported in the channel of the ssid is {attendTo:'beer'}
      //expect(JSON.stringify(data[Object.keys(data)[0]][Object.keys(data[Object.keys(data)[0]])[1]])).to.equal(JSON.stringify({serviceInfo:'only non alcoholic'}))
      expect(1).to.equal(0)
    })
/*
    it('should be able to claim a match a service attending to needs with a need it attends to', async () => {
      svc.match()
    })

    it('should be able to claim a request for fulfilling a need by a specific service attending to it following the universal transaction pattern (DEMO modelling)', async () => {
      svc.request
    })

    it('should be able to claim allowing a revocation folloing the universal transaction pattern (DEMO modelling)', async () => {
      svc.allow
    })

    it('should be able to claim refusing a revocation following the universal transaction pattern (DEMO modelling)', async () => {
      svc.refuse
    })

    it('should be able to revoke a request following the universal transaction pattern (DEMO modelling)', async () => {
      svc.revoke
    })

    it('should be able to claim a decline a request following the universal transaction pattern (DEMO modelling)', async () => {
      svc.decline
    })

    it('should be able to claim a promise for actually fulfilling a need following the universal transaction pattern (DEMO modelling)', async () => {
      svc.promise
    })

    it('should be able to revoke a promise following the universal transaction pattern (DEMO modelling)', async () => {
      svc.revoke
    })

    it('should be able to claim a state a solution that fulfills a need following the universal transaction pattern (DEMO modelling)', async () => {
      svc.state
    })

    it('should be able to revoke a state following the universal transaction pattern (DEMO modelling)', async () => {
      svc.revoke
    })

    it('should be able to claim an acceptance of a stated solution following the universal transaction pattern (DEMO modelling)', async () => {
      svc.accept
    })

    it('should be able to claim a rejection of a stated solution following the universal transaction pattern (DEMO modelling)', async () => {
      svc.reject
    })

    it('should be able to revoke an acceptance following the universal transaction pattern (DEMO modelling)', async () => {
      svc.revoke
    })

    it('should be able to subscribe on new needs a service is attending to being claimed', async () => {
      svc.subscribe
    })

    it('should be able to subscribe on new matches', async () => {
      svc.subscribe
    })

    it('should be able to subscribe on new state changes on a need following the universal transaction pattern that starts on a request', async () => {
      svc.subscribe
    })

    it('should be able to claim a need as been solved', async () => {
      svc.solved
    })

    it('should be able to refer the servicing of needs to a different (more private) service', async () => {
      svc.referTo
    })
    */
  })
})
