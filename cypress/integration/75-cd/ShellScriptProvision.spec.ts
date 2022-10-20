import {
  pipelineSaveCall,
  stepLibrary,
  pipelineDetails,
  pipelineStudioRoute,
  accountId
} from '../../support/70-pipeline/constants'

describe('Shell Script Provision', () => {
  const visitExecutionStageWithAssertion = (): void => {
    cy.visit(pipelineStudioRoute, {
      timeout: 30000
    })
    cy.wait(2000)
    cy.visitPageAssertion()
  }
  const createdBy = `/ng/api/file-store/files/createdBy?routingId=${accountId}&accountIdentifier=${accountId}`
  const supportedEntityTypes = `/ng/api/file-store/supported-entity-types?routingId=${accountId}&accountIdentifier=${accountId}`
  const folderFileStore = `ng/api/file-store/folder?routingId=${accountId}&accountIdentifier=${accountId}`

  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.intercept('POST', pipelineSaveCall, { fixture: 'pipeline/api/pipelines.post' })
    cy.intercept('POST', stepLibrary, { fixture: 'ng/api/stepLibrary' }).as('stepLibrary')
    cy.intercept('POST', pipelineSaveCall, { fixture: 'pipeline/api/pipelines.postsuccess' })
    cy.intercept('GET', pipelineDetails, { fixture: 'pipeline/api/inputSet/pipelineDetails' }).as('pipelineDetails')
    cy.intercept('GET', createdBy, { fixture: '/ng/api/SshWinRM/createdByCall' }).as('createdByCall')
    cy.intercept('GET', supportedEntityTypes, { fixture: '/ng/api/SshWinRM/supportedEntityCall' }).as(
      'supportedEntityCall'
    )
    cy.intercept('POST', folderFileStore, { fixture: '/ng/api/SshWinRM/folderFileStore.post.json' }).as(
      'folderFileStore'
    )
    visitExecutionStageWithAssertion()
  })

  const openExecutionScreen = (): void => {
    // select pipeline
    cy.get(`div[data-testid="pipeline-studio"]`, { timeout: 5000 }).should('be.visible')
    cy.contains('p', 'testStage_Cypress').click()
    cy.contains('span', 'Execution').click()
    cy.get('p[data-name="node-name"]').contains('Add Step').click({ force: true })
    cy.wait(1000)
    cy.get('[class*="ExecutionGraph-module_add-step-popover"]', { withinSubject: null })
      .should('be.visible')
      .within(() => {
        cy.contains('span', 'Add Step').should('be.visible').click({ force: true })
      })
    cy.wait('@stepLibrary').wait(500)
    cy.get('div[data-testid="step-card-Shell Script Provision"]').click({ force: true })
  }

  it('Add Shell Script with Inline/Script values', () => {
    openExecutionScreen()
    // select Shell Script Provision step
    cy.contains('p', 'Shell Script Provision').should('be.visible')
    cy.get('input[placeholder="Enter Step Name"]').fillName('Step1')
    cy.get('[class*="ShellScriptMonaco"] textarea[class="inputarea"]').type('echo "hello"')
    cy.get('[data-testid="optional-config-summary"]').click()
    cy.get('[data-testid="add-environmentVar"]').click()

    cy.get('input[name="spec.environmentVariables[0].name"]').fillField('spec.environmentVariables[0].name', 'envName')
    cy.get('input[name="spec.environmentVariables[0].value"]').fillField(
      'spec.environmentVariables[0].value',
      'envValue'
    )
    cy.contains('span', 'Apply Changes').click()
  })

  it('Add Shell Script with Remote values', () => {
    openExecutionScreen()
    // select Shell Script Provision step
    cy.contains('p', 'Shell Script Provision').should('be.visible')
    cy.get('input[placeholder="Enter Step Name"]').fillName('Step1')
    cy.contains('Harness File Store').click()
    cy.contains('p', 'Select').click()

    cy.wait('@createdByCall')
    cy.wait('@supportedEntityCall')
    cy.wait('@folderFileStore')

    cy.contains('p', 'config.yaml').should('be.visible')
    cy.contains('span', 'Apply Selected').click()

    cy.get('[data-testid="optional-config-summary"]').click()
    cy.get('[data-testid="add-environmentVar"]').click()

    cy.get('input[name="spec.environmentVariables[0].name"]').fillField('spec.environmentVariables[0].name', 'envName')
    cy.get('input[name="spec.environmentVariables[0].value"]').fillField(
      'spec.environmentVariables[0].value',
      'envValue'
    )
    cy.contains('span', 'Apply Changes').click()
  })
})
