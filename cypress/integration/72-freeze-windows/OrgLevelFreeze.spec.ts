/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  featureFlagsCall,
  newOrgLevelFreezeRoute,
  projectsAPI,
  orgLevelPostFreezeCall,
  orgLevelGetFreezeCall,
  existingOrgLevelFreezeRoute,
  orgLevelPutFreezeCall
} from './constants'

describe('Org Level Freeze', () => {
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
    cy.initializeRoute()
    cy.intercept('GET', projectsAPI, { fixture: 'ng/api/projects/projects' }).as('projectsData')
    cy.intercept('POST', orgLevelPostFreezeCall).as('createFreezeCall')
    cy.intercept('PUT', orgLevelPutFreezeCall).as('updateFreezeCall')
    cy.intercept('GET', orgLevelGetFreezeCall, { fixture: 'pipeline/api/freeze/getOrgLevelFreeze' })
  })
  it('should go to freeze creation page in Org Level and init config, and add a rule in Config Section', () => {
    cy.visit(newOrgLevelFreezeRoute, { timeout: 30000 })
    cy.visitPageAssertion('.PillToggle--item')

    cy.get('.bp3-dialog input[name="name"]')
      .should('be.visible')
      .type('org level freeze')
      .should('have.value', 'org level freeze')
    cy.get('[class*=bp3-dialog]').within(() => {
      cy.get('button[type="submit"]').click()
    })

    // Check if Header has required nodes
    cy.get('.bp3-switch span').should('not.be.checked')

    // Click on Freeze Config Tab
    cy.get('#bp3-tab-title_freezeWindowStudio_FREEZE_CONFIG').should('be.visible').click()
    cy.get('h4').contains('Define which resources you want to include in this freeze window')

    // Click on Add rule, All Projects
    cy.get('button span[icon="plus"]').click()
    cy.wait(500)

    // Formik - Rules section
    cy.get('[data-testid="config-edit-mode_0"]').should('have.length', 1)

    // Fill Rule form
    cy.get('input[name="entity[0].name"]')
      .should('be.visible')
      .type('Org Level Rule Number 1')
      .should('have.value', 'Org Level Rule Number 1')

    cy.get('button span.bp3-icon-tick').click()
    cy.wait(500)

    // formik form vanishes now, and content is replaced with view layer
    cy.get('[data-testid="config-edit-mode_0"]').should('have.length', 0)
    cy.get('[data-testid="config-view-mode_0"]').should('have.length', 1)

    // Check if view layer has add required fields
    cy.get('[data-testid="config-view-mode_0"] h3').contains('Org Level Rule Number 1')
    cy.get('[data-testid="config-view-mode_0"] div span').contains('All Projects')
    cy.get('[data-testid="config-view-mode_0"] h3 span').contains('All Services')
    cy.get('[data-testid="config-view-mode_0"] h3').contains('Environment Type: All Environments')

    /*** Add another rule, Multiple Projects ***/
    cy.get('button span[icon="plus"]').click()
    cy.wait(500)
    cy.get('[data-testid="config-edit-mode_1"]').should('have.length', 1)

    cy.get('button span.bp3-icon-tick').click()
    cy.wait(500)
    // Check Validation Error
    cy.get('.FormError--error').contains('Name is required')

    cy.get('input[name="entity[1].name"]').should('be.visible').type('Rule Number 2')

    cy.get('input[name="entity[1].Project"]').should('be.visible').click()
    cy.get('li.MultiSelect--menuItem').should('have.length', 4).as('projectMenuItem')
    cy.get('@projectMenuItem').eq(0).should('contain.text', 'All Projects').as('typeAllProj')
    cy.get('@projectMenuItem').eq(1).should('contain.text', 'ishant project 1').as('proj1')
    cy.get('@projectMenuItem').eq(2).should('contain.text', 'freeze windows 2').as('proj2')
    cy.get('@projectMenuItem').eq(3).should('contain.text', 'default org project').as('proj3')

    // Uselect All, Select proj and proj2
    cy.get('@typeAllProj').click({ force: true })
    cy.get('@proj1').click({ force: true })
    cy.get('@proj2').click({ force: true })

    // Hit Tick button
    cy.get('button span.bp3-icon-tick').click()
    cy.wait(500)

    cy.get('[data-testid="config-view-mode_1"] h3').contains('Rule Number 2')
    cy.get('[data-testid="config-view-mode_1"] div span').contains('ishant project 1')
    cy.get('[data-testid="config-view-mode_1"] div span').contains('freeze windows 2')
    cy.get('[data-testid="config-view-mode_1"] h3 span').contains('All Services')
    cy.get('[data-testid="config-view-mode_1"] h3').contains('Environment Type: All Environments')

    /*** Add another rule, All projects, excluding few Projects ***/
    cy.get('button span[icon="plus"]').click()
    cy.wait(500)
    cy.get('input[name="entity[2].name"]').should('be.visible').type('Rule Number 3')

    // Click on Exclude specific Projects
    cy.contains('span', 'Exclude specific Projects').should('be.visible').click()
    cy.wait(500)
    cy.get('input[name="entity[2].ExcludeProj"]').should('be.visible').click()
    cy.get('li.MultiSelect--menuItem').should('have.length', 3).as('excludeProjectMenuItem')
    cy.get('@excludeProjectMenuItem').eq(0).should('contain.text', 'ishant project 1').as('excludeProj1')
    cy.get('@excludeProjectMenuItem').eq(1).should('contain.text', 'freeze windows 2').as('excludeProj2')
    cy.get('@excludeProjectMenuItem').eq(2).should('contain.text', 'default org project').as('excludeProj3')
    cy.get('@excludeProj3').click({ force: true })
    cy.get('@excludeProj2').click({ force: true })

    // Hit Tick button
    cy.get('button span.bp3-icon-tick').click()
    cy.wait(500)

    cy.get('[data-testid="config-view-mode_2"] h3').contains('Rule Number 3')
    cy.get('[data-testid="config-view-mode_2"] div span').contains('All Projects')
    cy.get('[data-testid="config-view-mode_2"] div span').contains('default org project')
    cy.get('[data-testid="config-view-mode_2"] div span').contains('freeze windows 2')

    // Go To YAML - validate YAML
    cy.contains('div[data-name="toggle-option-two"]', 'YAML').should('be.visible').click()
    cy.wait(500)

    cy.get('.view-lines div').should('have.length', 37)
    cy.contains('span', 'freeze').should('be.visible')
    cy.contains('span', 'Org Level Rule Number 1').should('be.visible')
    cy.contains('span', 'Rule Number 2').should('be.visible')
    cy.contains('span', 'Equals').should('be.visible')
    cy.contains('span', 'ishant_project_1').should('be.visible')
    cy.contains('span', 'freeze_windows_2').should('be.visible')
    cy.contains('span', 'Rule Number 3').should('be.visible')
    cy.contains('span', 'NotEquals').should('be.visible')
    cy.contains('span', 'default_org_project').should('be.visible')
    cy.contains('span', 'freeze_windows_2').should('be.visible')
    cy.contains('span', 'Disabled').should('be.visible')
    cy.contains('span', 'orgIdentifier').should('be.visible')
    cy.contains('span', 'default').should('be.visible')

    // Hit Save Button
    cy.get('button span.bp3-button-text').contains('Save').click()
    cy.contains('p', 'Loading, please wait...').should('be.visible')

    cy.get('@createFreezeCall').should(req => {
      cy.contains('.bp3-toast span.bp3-toast-message', 'Freeze window created successfully').should('be.visible')
      expect(req.request.method).to.equal('POST')
      expect(req.request.body).to.equal(`freeze:
  name: org level freeze
  identifier: org_level_freeze
  entityConfigs:
    - name: Org Level Rule Number 1
      entities:
        - type: Project
          filterType: All
        - type: Service
          filterType: All
        - type: EnvType
          filterType: All
    - name: Rule Number 2
      entities:
        - type: Project
          filterType: Equals
          entityRefs:
            - ishant_project_1
            - freeze_windows_2
        - type: Service
          filterType: All
        - type: EnvType
          filterType: All
    - name: Rule Number 3
      entities:
        - type: Project
          filterType: NotEquals
          entityRefs:
            - default_org_project
            - freeze_windows_2
        - type: Service
          filterType: All
        - type: EnvType
          filterType: All
  status: Disabled
  orgIdentifier: default
`)
    })

    // save and Discard buttons should be disabled by default
    cy.get('button').contains('span', 'Save').parent().should('be.disabled')
    cy.get('button').contains('span', 'Discard').parent().should('be.disabled')
  })

  it('should go render in Edit View, update fields, and submit successfully', () => {
    cy.visit(existingOrgLevelFreezeRoute, { timeout: 30000 })
    cy.visitPageAssertion('.PillToggle--item')

    // save and Discard buttons should be disabled by default
    cy.get('button').contains('span', 'Save').parent().should('be.disabled')
    cy.get('button').contains('span', 'Discard').parent().should('be.disabled')

    // Should land on Overview Tab
    cy.get('#bp3-tab-title_freezeWindowStudio_FREEZE_CONFIG').should('be.visible').click()
    cy.get('h4').contains('Define which resources you want to include in this freeze window')
    cy.get('[data-testid="config-view-mode_0"]').should('have.length', 1)
    cy.get('[data-testid="config-view-mode_1"]').should('have.length', 1)
    cy.get('[data-testid="config-view-mode_2"]').should('have.length', 1)

    // Delete Rule 2
    cy.get('[data-testid="config-view-mode_1"] button span.bp3-icon-trash').click()
    cy.get('button').contains('span', 'Save').parent().should('not.be.disabled')
    cy.get('button').contains('span', 'Discard').parent().should('not.be.disabled')
    cy.get('button span').contains('Unsaved changes')

    // click save
    cy.get('button span.bp3-button-text').contains('Save').click()
    cy.contains('p', 'Loading, please wait...').should('be.visible')
    cy.get('@updateFreezeCall').should(req => {
      cy.contains('.bp3-toast span.bp3-toast-message', 'Freeze window updated successfully').should('be.visible')
      expect(req.request.method).to.equal('PUT')

      expect(req.request.body).to.equal(`freeze:
  name: org level freeze
  identifier: org_level_freeze
  entityConfigs:
    - name: Org Level Rule Number 1
      entities:
        - type: Project
          filterType: All
        - type: Service
          filterType: All
        - type: EnvType
          filterType: All
    - name: Rule Number 3
      entities:
        - type: Project
          filterType: NotEquals
          entityRefs:
            - default_org_project
            - freeze_windows_2
        - type: Service
          filterType: All
        - type: EnvType
          filterType: All
  status: Disabled
  orgIdentifier: default
`)
    })
  })
})
