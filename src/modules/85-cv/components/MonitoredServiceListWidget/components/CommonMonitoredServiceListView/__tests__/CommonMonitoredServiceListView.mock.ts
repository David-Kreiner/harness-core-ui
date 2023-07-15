import { MonitoredServiceActiveAgentsDTOArray } from '@cet/ErrorTracking.types'
import type { PageMonitoredServicePlatformResponse } from 'services/cv'

export const mockedMonitoredServiceListData = {
  totalPages: 6,
  totalItems: 56,
  pageItemCount: 10,
  pageSize: 10,
  content: [
    {
      name: 'svcappd_envappd',
      identifier: 'svcappd_envappd',
      serviceRef: 'svcappd',
      environmentRefs: ['envappd'],
      serviceName: 'svcappd',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 2
    },
    {
      name: 'svcqasignoffelasticsearch_envqasignoffelasticsearch',
      identifier: 'svcqasignoffelasticsearch_envqasignoffelasticsearch',
      serviceRef: 'svcqasignoffelasticsearch',
      environmentRefs: ['envqasignoffelasticsearch'],
      serviceName: 'svc-qa-signoff-elasticsearch',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 1
    },
    {
      name: 'svccloudwatch_envcloudwatch',
      identifier: 'svccloudwatch_envcloudwatch',
      serviceRef: 'svccloudwatch',
      environmentRefs: ['envcloudwatch'],
      serviceName: 'svc-cloudwatch',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 1
    },
    {
      name: 'datadogmetrics_datadogmetrics',
      identifier: 'datadogmetrics_datadogmetrics',
      serviceRef: 'datadogmetrics',
      environmentRefs: ['datadogmetrics'],
      serviceName: 'datadog-metrics',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 1
    },
    {
      name: 'svcddlogs_envddlogs',
      identifier: 'svcddlogs_envddlogs',
      serviceRef: 'svcddlogs',
      environmentRefs: ['envddlogs'],
      serviceName: 'svcddlogs',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 1
    },
    {
      name: 'svcstageprometheus_envstageprometheus',
      identifier: 'svcstageprometheus_envstageprometheus',
      serviceRef: 'svcstageprometheus',
      environmentRefs: ['envstageprometheus'],
      serviceName: 'svcstageprometheus',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 1
    },
    {
      name: 'svcgcpmetrics_envgcpmetrics',
      identifier: 'svcgcpmetrics_envgcpmetrics',
      serviceRef: 'svcgcpmetrics',
      environmentRefs: ['envgcpmetrics'],
      serviceName: 'svcgcpmetrics',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 1
    },
    {
      name: 'svcgcplogs_envgcplogs',
      identifier: 'svcgcplogs_envgcplogs',
      serviceRef: 'svcgcplogs',
      environmentRefs: ['envgcplogs'],
      serviceName: 'svcgcplogs',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 1
    },
    {
      name: 'svcdynatrace_envdynatrace',
      identifier: 'svcdynatrace_envdynatrace',
      serviceRef: 'svcdynatrace',
      environmentRefs: ['envdynatrace'],
      serviceName: 'svcdynatrace',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 1
    },
    {
      name: 'newrelicsvc_newrelicenv',
      identifier: 'newrelicsvc_newrelicenv',
      serviceRef: 'newrelicsvc',
      environmentRefs: ['newrelicenv'],
      serviceName: 'newrelic-svc',
      type: 'Application',
      configuredChangeSources: 0,
      configuredHealthSources: 1
    }
  ],
  pageIndex: 0,
  empty: false
} as PageMonitoredServicePlatformResponse & MonitoredServiceActiveAgentsDTOArray
