import {
  abortPipelineCall,
  executePipeline,
  pageHeaderClassName,
  pipelineListAPI,
  pipelinesRoute,
  serviceStepAPI,
  serviceStepStageID,
  shouldDisableDeploymentAPI,
  updatedPipelineExecutionEndpoint
} from '../../support/70-pipeline/constants'

describe('Pipeline Execution', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.intercept('POST', updatedPipelineExecutionEndpoint, {
      fixture: 'pipeline/api/pipelineExecution/executePipeline'
    }).as('executePipeline')

    cy.intercept('GET', shouldDisableDeploymentAPI, {
      fixture: 'pipeline/api/pipelineExecution/shouldDisableDeployment'
    }).as('shouldDisableDeployment')

    cy.intercept('GET', serviceStepAPI, { fixture: 'pipeline/api/pipelineExecution/serviceStep' }).as('serviceStep')
    cy.intercept('GET', serviceStepStageID, { fixture: 'pipeline/api/pipelineExecution/serviceStepStageID' })
      .as('serviceStepStageID')
      .wait(1000)
    cy.intercept('POST', pipelineListAPI, {
      fixture: '/pipeline/api/pipelineExecution/getPipelineList'
    }).as('pipelineList')
    cy.visit(pipelinesRoute, {
      timeout: 30000
    })
  })

  it('Pipeline Execution steps phases - Running & Failed', () => {
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@pipelineList', {
      timeout: 30000
    })
    cy.get('[data-icon="Options"]').first().click()
    cy.findByText('Run').click()
    cy.wait(1000)
    cy.get('*[class^="RunPipelineForm-module_run-form"')
      .should('be.visible')
      .within(() => {
        cy.get('input[type="checkbox"]').eq(0).check({ force: true }).should('be.checked')
        cy.contains('span', 'Run Pipeline').click()
      })

    cy.wait(1000)
    cy.wait('@serviceStep', { timeout: 30000 })
    cy.contains('span', 'Pipeline started successfully').should('be.visible')
    cy.wait('@serviceStepStageID', { timeout: 30000 })
    cy.wait(2000)
    cy.get('*[class^="ExecutionStatusLabel"]').should('be.visible')

    // asserting color for running-blue ( cypress matches rgba color)
    cy.get('*[class^="ExecutionStatusLabel"]').should('have.css', 'background-color').and('eq', 'rgb(2, 120, 213)')

    cy.get('*[class^="ExecutionStatusLabel"]').within(() => {
      cy.get('span[data-icon="loading"]').should('be.visible')
      cy.contains('span', 'RUNNING').should('be.visible')
    })
    cy.wait(3000)
    cy.contains('div', 'testPipeline_Cypressss').should('be.visible')

    cy.intercept('GET', serviceStepStageID, { fixture: 'pipeline/api/pipelineExecution/statusRunning' }).as(
      'statusRunning'
    )
    cy.wait('@statusRunning', { timeout: 30000 })
    cy.wait(2000)
    cy.intercept('GET', serviceStepStageID, { fixture: 'pipeline/api/pipelineExecution/statusFailed' }).as(
      'statusFailed'
    )

    cy.wait('@statusFailed', { timeout: 30000 })

    cy.get('.Pane.horizontal.Pane1').within(() => {
      cy.contains('p', 'testStage_Cypress').should('be.visible')
      cy.get('span[icon="warning-sign"]').should('be.visible')
      cy.get('span[icon="warning-sign"]').siblings().contains('p', "File 'src/' not found").should('be.visible')

      cy.get('.default-node').should('be.visible').trigger('mouseover')
      cy.get('.default-node').should('be.visible').trigger('onmouseover')
      cy.get('.default-node').should('be.visible').trigger('mouseenter')

      cy.get('[class^="DynamicPopover-module_dynamic-popover"]').should('be.visible')
      cy.get('[class^="DynamicPopover-module_dynamic-popover"]').within(() => {
        cy.get('span[icon="warning-sign"]')
          .should('be.visible')
          .siblings()
          .contains('span', 'FAILED')
          .should('be.visible')
        cy.contains('p', 'testService').should('be.visible')
        cy.contains('p', 'testEnv').should('be.visible')
      })

      cy.get('.default-node').should('be.visible').trigger('mouseleave')
      cy.wait(1000)
    })

    cy.get('.Pane.horizontal.Pane2').within(() => {
      cy.get('span[icon="warning-sign"]').should('be.visible')
      cy.contains('div', 'Error Summary').should('be.visible')

      cy.get('*[class^="StepDetailsTab"]')
        .should('be.visible')
        .within(() => {
          cy.get('span[data-icon="info"]')
            .should('be.visible')
            .siblings()
            .contains('span', "Provided file path doesn't exist")
            .should('be.visible')

          cy.contains(
            'span',
            "Failed while trying to fetch files from git connector: 'GitConn1' in manifest with identifier: ManifestIdentifier"
          ).should('be.visible')
          cy.get('span[icon="lightbulb"]')
            .should('be.visible')
            .siblings()
            .contains(
              'span',
              'Please ensure that provided file path exists in git repository or in reference branch: master'
            )
            .should('be.visible')
        })

      cy.contains('div', 'Error Summary').should('be.visible')
      cy.contains('p', "File 'src/' not found").should('be.visible')

      cy.get('span[icon="warning-sign"]')
        .should('be.visible')
        .siblings()
        .contains('span', 'FAILED')
        .should('be.visible')
      cy.contains('div', 'testService').should('be.visible')
      cy.contains('li', 'testEnv').should('be.visible')
    })
    cy.wait(2000)
  })

  it('Pipeline Execution steps phases - Running & Success', () => {
    cy.intercept('POST', executePipeline, {
      fixture: 'pipeline/api/pipelineExecution/successPipeline/executePipeline'
    }).as('executePipeline')

    cy.intercept('GET', serviceStepAPI, { fixture: 'pipeline/api/pipelineExecution/successPipeline/serviceStep' }).as(
      'serviceStep'
    )
    cy.intercept('GET', serviceStepStageID, {
      fixture: 'pipeline/api/pipelineExecution/successPipeline/serviceStepStageID'
    }).as('serviceStepStageID')
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@pipelineList', {
      timeout: 30000
    })
    cy.get('[data-icon="Options"]').first().click()
    cy.findByText('Run').click()
    cy.get('*[class^="RunPipelineForm-module_run-form"')
      .should('be.visible')
      .within(() => {
        cy.get('input[type="checkbox"]').eq(0).check({ force: true }).should('be.checked')
        cy.contains('span', 'Run Pipeline').click()
      })

    cy.wait(1000)
    cy.wait('@serviceStep', { timeout: 30000 })
    cy.contains('span', 'Pipeline started successfully').should('be.visible')
    cy.wait(1000)
    cy.wait('@serviceStepStageID', { timeout: 30000 })
    cy.wait(2000)
    cy.get('*[class^="ExecutionStatusLabel"]').should('be.visible')

    cy.get('*[class^="ExecutionStatusLabel"]').should('have.css', 'background-color').and('eq', 'rgb(2, 120, 213)')
    cy.get('*[class^="ExecutionStatusLabel"]').within(() => {
      cy.get('span[data-icon="loading"]').should('be.visible')
      cy.contains('span', 'RUNNING').should('be.visible')
    })

    cy.wait(3000)

    cy.intercept('GET', serviceStepStageID, {
      fixture: 'pipeline/api/pipelineExecution/successPipeline/statusRunning'
    })
      .as('statusRunning')
      .wait(1000)
    cy.wait('@statusRunning', { timeout: 30000 })
    cy.get("span[data-icon='spinner']").should('be.visible')

    cy.wait(2000)
    cy.intercept('GET', serviceStepStageID, {
      fixture: 'pipeline/api/pipelineExecution/successPipeline/statusSuccess'
    }).as('statusSuccess')

    cy.wait('@statusSuccess', { timeout: 30000 })
    cy.get('*[class^="ExecutionStatusLabel"]').should('have.css', 'background-color').and('eq', 'rgb(228, 247, 225)')
    cy.get("span[data-icon='execution-success']").should('be.visible')
    cy.get('*[class^="ExecutionStatusLabel"]').within(() => {
      cy.get('span[icon="tick-circle"]').should('be.visible')
      cy.contains('span', 'SUCCESS').should('be.visible')
    })

    cy.get('.Pane.horizontal.Pane1').within(() => {
      cy.get('.default-node').should('be.visible').trigger('mouseover')
      cy.get('.default-node').should('be.visible').trigger('onmouseover')
      cy.get('.default-node').should('be.visible').trigger('mouseenter')
      cy.get('[class^="DynamicPopover-module_dynamic-popover"]').should('be.visible')
      cy.get('[class^="DynamicPopover-module_dynamic-popover"]').within(() => {
        cy.get('span[icon="tick-circle"]')
          .should('be.visible')
          .siblings()
          .contains('span', 'SUCCESS')
          .should('be.visible')
        cy.contains('p', 'testService').should('be.visible')
        cy.contains('p', 'testEnv').should('be.visible')
      })
      cy.wait(1000)
    })
    cy.get('.Pane.horizontal.Pane2').within(() => {
      cy.get("span[data-icon='execution-success']").should('be.visible')
      cy.contains('div', 'testService').should('be.visible')
      cy.contains('li', 'testEnv').should('be.visible')
    })
  })

  it('Pipeline Execution Serverless Aws Lambda Deploy step - Failed', () => {
    // execution/:executionId calls are made from here onwards
    cy.intercept('GET', serviceStepAPI, {
      fixture: 'pipeline/api/pipelineExecution/serverlessAwsLambda/serviceStep'
    }).as('serviceStep')
    cy.intercept('GET', serviceStepStageID, {
      fixture: 'pipeline/api/pipelineExecution/serverlessAwsLambda/serviceStepStageID'
    })
      .as('serviceStepStageID')
      .wait(1000)

    // Wait for pipeline list to appear on screen
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@pipelineList', {
      timeout: 30000
    })

    cy.get('[data-icon="Options"]').first().click()
    cy.findByText('Run').click()
    cy.wait(1000)
    cy.get('*[class^="RunPipelineForm-module_run-form"')
      .should('be.visible')
      .within(() => {
        // Click on checkbox 'Skip preflight check'
        cy.get('input[type="checkbox"]').eq(0).check({ force: true }).should('be.checked')
        // Click Run Pipeline button inside Run Pipeline Form
        cy.contains('span', 'Run Pipeline').click()
      })

    // Wait for API calls to be executed
    cy.wait(1000)
    cy.wait('@executePipeline', { timeout: 30000 })
    cy.wait(1000)
    cy.wait('@serviceStep', { timeout: 30000 })
    cy.wait(1000)
    cy.contains('span', 'Pipeline started successfully').should('be.visible')
    cy.wait('@serviceStepStageID', { timeout: 30000 })
    cy.wait(2000)
    cy.get('*[class^="ExecutionStatusLabel"]').should('be.visible')
    // asserting color for running-blue ( cypress matches rgba color)
    cy.get('*[class^="ExecutionStatusLabel"]').should('have.css', 'background-color').and('eq', 'rgb(2, 120, 213)')

    // Check for current status - Running
    cy.get('*[class^="ExecutionStatusLabel"]').within(() => {
      cy.get('span[data-icon="loading"]').should('be.visible')
      cy.contains('span', 'RUNNING').should('be.visible')
    })
    cy.wait(3000)
    // Check for correct pipeline name
    cy.contains('div', 'Pipeline 1304').should('be.visible')

    // more execution/:executionId calls are made
    cy.intercept('GET', serviceStepStageID, {
      fixture: 'pipeline/api/pipelineExecution/serverlessAwsLambda/statusRunning'
    }).as('statusRunning')
    cy.wait('@statusRunning', { timeout: 30000 })
    cy.wait(2000)
    cy.intercept('GET', serviceStepStageID, {
      fixture: 'pipeline/api/pipelineExecution/serverlessAwsLambda/serverlessAwsLambdaDeployFailed'
    }).as('statusFailed')
    cy.wait('@statusFailed', { timeout: 30000 })

    // Check if Pane1 and Pane2 showing correct success / failed data
    cy.get('.Pane.horizontal.Pane1').within(() => {
      cy.contains('p', 'Stage 1').should('be.visible')
      cy.get('span[icon="warning-sign"]').should('be.visible')
      cy.get('span[icon="warning-sign"]')
        .siblings()
        .contains(
          'p',
          'No manifests found in stage Stage_1. ServerlessAwsLambdaDeploy step requires a manifest defined in stage service definition'
        )
        .should('be.visible')

      cy.get('.default-node').should('be.visible').trigger('mouseover')
      cy.get('.default-node').should('be.visible').trigger('onmouseover')
      cy.get('.default-node').should('be.visible').trigger('mouseenter')
      cy.wait(2000)

      cy.get('[class^="DynamicPopover-module_dynamic-popover"]').should('be.visible')
      cy.get('[class^="DynamicPopover-module_dynamic-popover"]').within(() => {
        cy.get('span[icon="warning-sign"]')
          .should('be.visible')
          .siblings()
          .contains('span', 'FAILED')
          .should('be.visible')
        cy.contains('p', 'Service 1').should('be.visible')
        cy.contains('p', 'Env 1').should('be.visible')
      })

      cy.get('.default-node').should('be.visible').trigger('mouseleave')
      cy.wait(1000)
    })

    cy.get('.Pane.horizontal.Pane2').within(() => {
      cy.contains('div', 'Service 1').should('be.visible')
      cy.contains('li', 'Env 1').should('be.visible')
      cy.get('span[icon="warning-sign"]')
        .should('be.visible')
        .siblings()
        .contains('span', 'FAILED')
        .should('be.visible')
      cy.contains('div', 'Error Summary').should('be.visible')
      cy.contains(
        'p',
        'No manifests found in stage Stage_1. ServerlessAwsLambdaDeploy step requires a manifest defined in stage service definition'
      ).should('be.visible')

      cy.get('*[class^="StepDetailsTab"]')
        .should('be.visible')
        .within(() => {
          // @TODO: uncomment this once BE starts supporting it
          // cy.get('span[data-icon="info"]')
          //   .should('be.visible')
          //   .siblings()
          //   .contains('span', 'not able to find a serverless manifest file')
          //   .should('be.visible')

          cy.contains(
            'p',
            'No manifests found in stage Stage_1. ServerlessAwsLambdaDeploy step requires a manifest defined in stage service definition'
          ).should('be.visible')
          // @TODO: uncomment this once BE starts supporting it
          // cy.get('span[icon="lightbulb"]')
          //   .should('be.visible')
          //   .siblings()
          //   .contains('span', 'please add a serverless manifest file inside provided path: test1/')
          //   .should('be.visible')
        })
    })
  })

  it('Pipeline Execution steps phases - Running & Abort', () => {
    cy.intercept('GET', serviceStepAPI, { fixture: 'pipeline/api/pipelineExecution/successPipeline/serviceStep' }).as(
      'serviceStep'
    )
    cy.intercept('GET', serviceStepStageID, {
      fixture: 'pipeline/api/pipelineExecution/successPipeline/serviceStepStageID'
    }).as('serviceStepStageID')
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@pipelineList', {
      timeout: 30000
    })

    cy.intercept('PUT', abortPipelineCall, { fixture: 'pipeline/api/pipeline/execute/statusAbort' }).as('statusAbort')
    cy.get('[data-icon="Options"]').first().click()
    cy.findByText('Run').click()
    cy.wait(1000)
    cy.get('*[class^="RunPipelineForm-module_run-form"')
      .should('be.visible')
      .within(() => {
        cy.get('input[type="checkbox"]').eq(0).check({ force: true }).should('be.checked')
        cy.contains('span', 'Run Pipeline').click()
      })

    cy.wait(1000)
    cy.wait('@serviceStep')
    cy.contains('span', 'Pipeline started successfully').should('be.visible')
    cy.wait(1000)
    cy.wait('@serviceStepStageID')
    cy.wait(2000)
    cy.get('*[class^="ExecutionStatusLabel"]').should('be.visible')

    cy.get('*[class^="ExecutionStatusLabel"]').should('have.css', 'background-color').and('eq', 'rgb(2, 120, 213)')
    cy.get('*[class^="ExecutionStatusLabel"]').within(() => {
      cy.get('span[data-icon="loading"]').should('be.visible')
      cy.contains('span', 'RUNNING').should('be.visible')
    })
    cy.wait(1000)
    cy.contains('div', 'testPipeline_Cypressss').should('be.visible')
    cy.intercept('GET', serviceStepStageID, {
      fixture: 'pipeline/api/pipelineExecution/successPipeline/statusRunning'
    })
      .as('statusRunning')
      .wait(1000)
    cy.wait('@statusRunning', { timeout: 30000 })
    cy.get("span[data-icon='spinner']").should('be.visible')

    cy.get('*[class^="ExecutionHeader"]').within(() => {
      cy.get('span[icon="stop"]').click()
    })
    cy.wait(1000)
    cy.contains('span', 'Confirm').click({ force: true })
    cy.wait(1000)

    cy.intercept(
      'GET',
      'pipeline/api/pipelines/execution/executionId?routingId=accountId&orgIdentifier=default&projectIdentifier=project1&accountIdentifier=accountId&stageNodeId=wLwZhu2vSI2M3p_7_gfu_g',
      { fixture: 'pipeline/api/pipeline/execute/statusAbortResponse' }
    ).as('abortResponse')
    cy.intercept('GET', serviceStepStageID, { fixture: 'pipeline/api/pipeline/execute/statusAbortResponse' }).as(
      'statusAborted'
    )
    cy.wait('@statusAborted', { timeout: 30000 })

    cy.get('*[class^="ExecutionStatusLabel"]').should('have.css', 'background-color').and('eq', 'rgb(217, 218, 229)')
    cy.get('*[class^="ExecutionStatusLabel"]').within(() => {
      cy.contains('span', 'ABORTED').should('be.visible')
    })
  })
})
