import { countOfServiceAPI, monitoredServiceListCall } from '../../../support/85-cv/monitoredService/constants'
import {
  heatlhScore,
  heatlhScoreTimeLine,
  overAllHeatlhScore,
  monitoredServiceData,
  monitoredServiceListData,
  metrics,
  healthSourceList,
  serviceScreenLogsListURL,
  serviceScreenLogsListData,
  serviceScreenLogsRadarClusterURL,
  serviceScreenLogsRadarClusterData
} from '../../../support/85-cv/monitoredService/service-health/constants'

describe('Load service health dashboard', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      return false
    })
    cy.login('test', 'test')
    cy.intercept('GET', monitoredServiceListCall, monitoredServiceListData)
    cy.intercept('GET', countOfServiceAPI, { allServicesCount: 1, servicesAtRiskCount: 0 })
    cy.visitChangeIntelligence()
  })
  it('Load dashboard', () => {
    cy.intercept('GET', '/cv/api/monitored-service/appd_prod?*', monitoredServiceData).as('monitoredServiceCall')
    cy.intercept('GET', heatlhScore.url, heatlhScore.data).as('heatlhScoreCall')
    cy.intercept('GET', heatlhScoreTimeLine.url, heatlhScoreTimeLine.data).as('heatlhScoreTimeLineCall')
    cy.intercept('GET', overAllHeatlhScore.url, overAllHeatlhScore.data).as('overAllHeatlhScoreCall')
    cy.intercept('GET', healthSourceList.url, healthSourceList.data).as('healthSourceListCall')
    cy.intercept('GET', metrics.url, metrics.data).as('metricsCall')
    cy.intercept('GET', serviceScreenLogsListURL, serviceScreenLogsListData).as('serviceScreenLogsListCall')
    cy.intercept('GET', serviceScreenLogsRadarClusterURL, serviceScreenLogsRadarClusterData).as(
      'serviceScreenLogsRadarClusterCall'
    )
    cy.contains('p', 'Monitored Services').click({ force: true })
    cy.contains('p', 'appd').click()
    cy.wait('@monitoredServiceCall')
    cy.contains('div', 'Service Health').click()
    cy.wait('@heatlhScoreCall')
    cy.wait('@heatlhScoreTimeLineCall')
    cy.wait('@overAllHeatlhScoreCall')

    cy.get('[class*=ColumnChart-module_column]').should('have.length', 48)

    cy.findByTestId('HealthScoreChartContainer').click()
    cy.wait('@healthSourceListCall')
    cy.wait('@metricsCall')
    cy.get('[class*=MetricAnalysisRow-module_main]').should('have.length', 1)

    cy.get('#bp3-tab-title_serviceScreenMetricsLogs_Logs').scrollIntoView().click()

    cy.wait('@serviceScreenLogsListCall')
    cy.wait('@serviceScreenLogsRadarClusterCall')

    cy.findAllByTestId('logs-data-row').should('have.length', 10)
  })
})
