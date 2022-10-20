/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import { Connectors } from '@connectors/constants'
import { StringUtils } from '@common/exports'
import type { StringKeys } from 'framework/strings'

export const AuthTypes = {
  CLIENT_KEY_CERT: 'ClientKeyCert',
  USER_PASSWORD: 'UsernamePassword',
  SERVICE_ACCOUNT: 'ServiceAccount',
  OIDC: 'OpenIdConnect',
  ANNONYMOUS: 'Anonymous',
  BEARER_TOKEN: 'Bearer Token (HTTP Header)'
}

export enum GitAuthTypes {
  USER_PASSWORD = 'UsernamePassword',
  USER_TOKEN = 'UsernameToken',
  KERBEROS = 'Kerberos',
  OAUTH = 'OAuth'
}

export const GitAPIAuthTypes = {
  GITHUB_APP: 'GithubApp',
  TOKEN: 'Token',
  OAUTH: 'OAuth'
}

export const dockerProviderTypes = {
  CLIENT_KEY_CERT: 'ClientKeyCert',
  USER_PASSWORD: 'UsernamePassword',
  SERVICE_ACCOUNT: 'ServiceAccount',
  OIDC: 'OpenIdConnect',
  ANNONYMOUS: 'Anonymous'
}

export const getKubInitialValues = () => {
  return {
    type: 'KUBERNETES_CLUSTER',
    name: 'NAME',
    description: '',
    identifier: '',
    tags: {},
    delegateMode: '',
    credentialType: '',
    credential: {
      masterUrl: '',
      manualCredentialType: '',
      manualCredentials: {
        userName: '',
        encryptedPassword: ''
      }
    }
  }
}

export const getHeadingIdByType = (type: string): StringKeys => {
  switch (type) {
    case Connectors.VAULT:
      return 'connectors.hashicorpVaultDetails'
    case Connectors.LOCAL:
      return 'connectors.secretManagerDetails'
    case Connectors.APP_DYNAMICS:
      return 'connectors.appDynamicsDetails'
    case Connectors.SPLUNK:
      return 'connectors.splunkConnectorDetails'
    case Connectors.ELK:
      return 'connectors.elk.elkConnectorDetails'
    case 'Gcr':
      return 'connectors.gcrConnectorDetails'
    default:
      return 'overview'
  }
}

export const getConnectorTitleIdByType = (type: string): StringKeys => {
  switch (type) {
    case Connectors.KUBERNETES_CLUSTER:
      return 'connectors.title.k8sCluster'
    case Connectors.HttpHelmRepo:
      return 'connectors.title.helmConnector'
    case Connectors.OciHelmRepo:
      return 'connectors.title.ociHelmConnector'
    case Connectors.GIT:
      return 'connectors.title.gitConnector'
    case Connectors.GITHUB:
      return 'connectors.title.githubConnector'
    case Connectors.GITLAB:
      return 'connectors.title.gitlabConnector'
    case Connectors.BITBUCKET:
      return 'connectors.title.bitbucketConnector'
    case Connectors.AZURE_REPO:
      return 'connectors.title.azureRepoConnector'
    case Connectors.VAULT:
      return 'connectors.title.hashicorpVault'
    case Connectors.GCP_KMS:
      return 'connectors.title.gcpKms'
    case Connectors.LOCAL:
      return 'connectors.title.secretManager'
    case Connectors.APP_DYNAMICS:
      return 'connectors.title.appdynamics'
    case Connectors.SPLUNK:
      return 'connectors.title.splunk'
    case Connectors.DOCKER:
      return 'dockerRegistry'
    case Connectors.JENKINS:
      return 'connectors.jenkins.jenkins'
    case Connectors.CEAWS:
      return 'connectors.title.ceAws'
    case Connectors.AWS:
      return 'connectors.title.aws'
    case Connectors.AWS_CODECOMMIT:
      return 'connectors.title.awsCodeCommit'
    case Connectors.NEXUS:
      return 'connectors.title.nexus'
    case Connectors.Jira:
      return 'connectors.title.jira'
    case Connectors.SERVICE_NOW:
      return 'connectors.title.serviceNow'
    case Connectors.ARTIFACTORY:
      return 'connectors.title.artifactory'
    case Connectors.GCP:
      return 'connectors.title.gcpConnector'
    case Connectors.PDC:
      return 'connectors.title.pdcConnector'
    case 'Gcr':
      return 'connectors.GCR.fullName'
    case Connectors.AWS_KMS:
      return 'connectors.title.awsKms'
    case Connectors.AWS_SECRET_MANAGER:
      return 'connectors.title.awsSecretManager'
    case Connectors.CE_AZURE:
      return 'connectors.title.ceAzureConnector'
    case Connectors.DATADOG:
      return 'connectors.title.datadog'
    case Connectors.SUMOLOGIC:
      return 'connectors.title.sumologic'
    case Connectors.AZURE_KEY_VAULT:
      return 'connectors.title.azureKeyVault'
    case Connectors.ERROR_TRACKING:
      return 'common.purpose.errorTracking.title'
    case Connectors.AZURE:
      return 'connectors.title.azure'
    case Connectors.CUSTOM_SECRET_MANAGER:
      return 'connectors.title.customSecretManager'
    case Connectors.NEW_RELIC:
      return 'connectors.newRelicLabel'
    case Connectors.PROMETHEUS:
      return 'connectors.prometheusLabel'
    case Connectors.DYNATRACE:
      return 'connectors.dynatraceLabel'
    case Connectors.CE_GCP:
      return 'common.gcp'
    case Connectors.PAGER_DUTY:
      return 'common.pagerDuty'
    case Connectors.CUSTOM_HEALTH:
      return 'connectors.customLabel'
    case Connectors.ELK:
      return 'connectors.elk.elkLabel'
    case Connectors.AWSSECRETMANAGER:
      return 'connectors.title.awsSecretManager'
    case Connectors.GcpSecretManager:
      return 'connectors.title.gcpSecretManager'
    default:
      return 'connector'
  }
}

export const getConnectorIconByType = (type: string): IconName => {
  switch (type) {
    case Connectors.KUBERNETES_CLUSTER:
    case Connectors.CE_KUBERNETES:
      return 'app-kubernetes'
    case Connectors.GIT:
      return 'service-github'
    case Connectors.HttpHelmRepo:
      return 'service-helm'
    case Connectors.OciHelmRepo:
      return 'helm-oci'
    case Connectors.GITHUB:
      return 'github'
    case Connectors.GITLAB:
      return 'service-gotlab'
    case Connectors.BITBUCKET:
      return 'bitbucket-selected'
    case Connectors.VAULT:
      return 'hashiCorpVault'
    case Connectors.GCP_KMS:
      return 'gcp-kms'
    case Connectors.LOCAL:
      return 'lock'
    case Connectors.APP_DYNAMICS:
      return 'service-appdynamics'
    case Connectors.SPLUNK:
      return 'service-splunk'
    case Connectors.NEW_RELIC:
      return 'service-newrelic'
    case Connectors.PROMETHEUS:
      return 'service-prometheus'
    case Connectors.DYNATRACE:
      return 'service-dynatrace'
    case Connectors.JENKINS:
      return 'service-jenkins-inverse'
    case Connectors.DOCKER:
    case 'Dockerhub':
      return 'service-dockerhub'
    case Connectors.AWS:
      return 'service-aws'
    case Connectors.AWS_CODECOMMIT:
      return 'aws-codecommit'
    case Connectors.NEXUS:
      return 'service-nexus'
    case Connectors.ARTIFACTORY:
      return 'service-artifactory'
    case Connectors.Jira:
      return 'service-jira'
    case Connectors.SERVICE_NOW:
      return 'service-servicenow'
    case Connectors.GCP:
    case Connectors.CE_GCP:
    case 'Gcr':
      return 'service-gcp'
    case Connectors.PDC:
      return 'pdc-inverse'
    case Connectors.AWS_KMS:
      return 'aws-kms'
    case Connectors.CE_AZURE:
    case Connectors.AZURE_REPO:
      return 'service-azure'
    case Connectors.DATADOG:
      return 'service-datadog'
    case Connectors.AZURE_KEY_VAULT:
      return 'azure-key-vault'
    case Connectors.SUMOLOGIC:
      return 'service-sumologic'
    case Connectors.CEAWS:
      return 'service-aws'
    case Connectors.AWS_SECRET_MANAGER:
      return 'aws-secret-manager'
    case Connectors.PAGER_DUTY:
      return 'service-pagerduty'
    case Connectors.ARGO:
      return 'argo'
    case Connectors.HARNESS_MANAGED_GITOPS:
      return 'harness'
    case Connectors.CUSTOM_HEALTH:
      return 'service-custom-connector'
    case Connectors.ELK:
      return 'service-elk'
    case Connectors.ERROR_TRACKING:
      return 'error-tracking'
    case Connectors.AZURE:
      return 'microsoft-azure'
    case Connectors.CUSTOM_SECRET_MANAGER:
      return 'custom-sm'
    case Connectors.GcpSecretManager:
      return 'gcp-secret-manager'
    default:
      return 'placeholder'
  }
}

export enum ConnectorDetailsView {
  'overview' = 'overview',
  'referencedBy' = 'referencedBy',
  'activityHistory' = 'activityHistory'
}

export const getConnectorIconPropsByType = (type: string): Omit<IconProps, 'name'> => {
  switch (type) {
    case Connectors.CUSTOM_HEALTH:
      return { size: 37, background: 'white' }
    default:
      return { size: 37 }
  }
}

export const generateDefaultSecretConfig = (name: string, type: string) => {
  return StringUtils.getIdentifierFromName(name || '').concat(type)
}

export const getLabelForAuthType = (type: string) => {
  switch (type) {
    case AuthTypes.USER_PASSWORD:
      return 'Username and Password'
    case AuthTypes.SERVICE_ACCOUNT:
      return 'Service Account Token'
    case AuthTypes.OIDC:
      return 'OIDC Token'
    case AuthTypes.CLIENT_KEY_CERT:
      return 'Client Key Certificate'
    default:
      return ''
  }
}
