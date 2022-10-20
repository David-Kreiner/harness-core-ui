import { featureFlagsCall, overviewPage, orgOverviewPage, projectOverviewPage, getOrgCall } from './constants'

describe('check if Route is available if FF is enabled', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      return false
    })

    cy.fixture('api/users/feature-flags/accountId').then(featureFlagsData => {
      cy.intercept('GET', featureFlagsCall, {
        ...featureFlagsData,
        resource: [
          ...featureFlagsData.resource,
          {
            uuid: null,
            name: 'NG_DEPLOYMENT_FREEZE',
            enabled: true,
            lastUpdatedAt: 0
          }
        ]
      })
    })

    cy.intercept('GET', getOrgCall, { fixture: 'pipeline/api/organization/getOrganization' }).as('getOrgCall')
    cy.initializeRoute()
  })

  it('should find FreezeWindows at Account level, and should redirect to Freeze List Page', () => {
    cy.visit(overviewPage, { timeout: 30000 })
    cy.visitPageAssertion('.PageHeader--container')
    cy.get('div a p').contains('Freeze Windows').as('freezeWindowsLink')
    cy.get('@freezeWindowsLink').click()
    cy.wait(500)
    cy.location().should(loc => {
      expect(loc.hash).to.eq('#/account/accountId/settings/freeze-windows')
    })
    cy.get('button span').contains('New Freeze Window')
  })

  it('should find FreezeWindows at Organization level, and should redirect to Freeze List Page', () => {
    cy.visit(orgOverviewPage, { timeout: 30000 })
    cy.visitPageAssertion('.PageHeader--container')
    cy.get('div h1').contains('Organization Level Governance')
    cy.get('div div.bp3-card p span').contains('Freeze Windows').as('freezeWindowsLink')
    cy.get('@freezeWindowsLink').click()
    cy.wait(500)
    cy.location().should(loc => {
      expect(loc.hash).to.eq('#/account/accountId/settings/organizations/default/setup/freeze-windows')
    })
    cy.get('button span').contains('New Freeze Window')
  })

  it('should find FreezeWindows at Project level, and should redirect to Freeze List Page ', () => {
    cy.visit(projectOverviewPage, { timeout: 30000 })
    cy.visitPageAssertion('.PageHeader--container')
    cy.get('div p').contains('Project Setup').as('projectSetupNode')
    cy.get('@projectSetupNode').click()
    cy.wait(500)
    cy.get('span.bp3-icon-chevron-up').should('have.length', 1)
    cy.get('div a p').contains('Freeze Windows').as('freezeWindowsLink')
    cy.get('@freezeWindowsLink').click()
    cy.wait(500)
    cy.location().should(loc => {
      expect(loc.hash).to.eq('#/account/accountId/cd/orgs/default/projects/project1/setup/freeze-windows')
    })
    cy.get('button span').contains('New Freeze Window')
  })
})
