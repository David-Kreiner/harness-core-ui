/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEmpty, isUndefined } from 'lodash-es'
import { string, array, object, ObjectSchema } from 'yup'
import { illegalIdentifiers, regexIdentifier } from '@common/utils/StringUtils'
import type { PanelInterface } from '@triggers/components/TabWizard/TabWizard'
import type { UseStringsReturn } from 'framework/strings'
import type { GetActionsListQueryParams, NGTriggerSourceV2, PipelineInfoConfig } from 'services/pipeline-ng'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { connectorUrlType } from '@connectors/constants'
import type { AddConditionInterface } from '@triggers/components/AddConditionsSection/AddConditionsSection'
import type { Module } from '@common/interfaces/RouteInterfaces'
import { SettingType } from '@default-settings/interfaces/SettingType.types'
import type { SourceRepo, TriggerBaseType } from '../TriggerInterface'
import { ciCodebaseBuild, CUSTOM, TriggerGitEvent } from '../utils'

export function getDefaultPipelineReferenceBranch(event = ''): string {
  switch (event) {
    case TriggerGitEvent.ISSUE_COMMENT:
    case TriggerGitEvent.PULL_REQUEST:
    default:
      return ciCodebaseBuild.spec.branch
  }
}

export function flattenKeys(_object: any = {}, initialPathPrefix = 'pipeline'): Record<string, any> {
  if (!_object || typeof _object !== 'object') {
    return [{ [initialPathPrefix]: _object }]
  }

  const prefix = initialPathPrefix ? (Array.isArray(_object) ? initialPathPrefix : `${initialPathPrefix}.`) : ''

  return Object.keys(_object)
    .flatMap(key => flattenKeys(_object[key], Array.isArray(_object) ? `${prefix}[${key}]` : `${prefix}${key}`))
    .reduce((acc, path) => ({ ...acc, ...path }), {})
}

//! Qualified

const isIdentifierIllegal = (identifier: string): boolean =>
  regexIdentifier.test(identifier) && illegalIdentifiers.includes(identifier)

const checkValidTriggerConfiguration = ({
  formikValues
}: {
  formikValues: { [key: string]: any }
  formikErrors: { [key: string]: any }
}): boolean => {
  const sourceRepo = formikValues['sourceRepo']
  const identifier = formikValues['identifier']
  const connectorURLType = formikValues.connectorRef?.connector?.spec?.type

  if (isIdentifierIllegal(identifier)) {
    return false
  }

  if (sourceRepo !== CUSTOM) {
    if (!formikValues['connectorRef'] || !formikValues['event'] || !formikValues['actions']) return false
    // onEdit case, waiting for api response
    else if (formikValues['connectorRef']?.value && !formikValues['connectorRef'].connector) return true
    else if (
      !connectorURLType ||
      !!([connectorURLType.ACCOUNT, connectorURLType.PROJECT].includes(connectorURLType) && !formikValues.repoName)
    )
      return false
  }
  return true
}

const isRowUnfilled = (payloadCondition: AddConditionInterface): boolean => {
  const truthyValuesLength = Object.values(payloadCondition).filter(val => !!val?.trim())?.length
  return truthyValuesLength > 0 && truthyValuesLength < 3
}

const checkValidPayloadConditions = ({ formikValues }: { formikValues: { [key: string]: any } }): boolean => {
  const payloadConditions = formikValues['payloadConditions']
  const headerConditions = formikValues['headerConditions']
  if (
    (formikValues['sourceBranchOperator'] && !formikValues['sourceBranchValue']) ||
    (!formikValues['sourceBranchOperator'] && formikValues['sourceBranchValue']?.trim()) ||
    (formikValues['targetBranchOperator'] && !formikValues['targetBranchValue']) ||
    (!formikValues['targetBranchOperator'] && formikValues['targetBranchValue']?.trim()) ||
    (formikValues['changedFilesOperator'] && !formikValues['changedFilesValue']) ||
    (!formikValues['changedFilesOperator'] && formikValues['changedFilesValue']?.trim()) ||
    (formikValues['tagConditionOperator'] && !formikValues['tagConditionValue']) ||
    (!formikValues['tagConditionOperator'] && formikValues['tagConditionValue']?.trim()) ||
    (payloadConditions?.length &&
      payloadConditions.some((payloadCondition: AddConditionInterface) => isRowUnfilled(payloadCondition)))
  ) {
    return false
  } else if (
    headerConditions?.length &&
    headerConditions.some((headerCondition: AddConditionInterface) => isRowUnfilled(headerCondition))
  ) {
    return false
  }
  return true
}

const checkValidPipelineInput = ({ formikErrors }: { formikErrors: { [key: string]: any } }): boolean => {
  if (!isEmpty(formikErrors?.pipeline) || !isEmpty(formikErrors?.stages)) {
    return false
  }
  return true
}

export const getPanels = (getString: UseStringsReturn['getString']): PanelInterface[] | [] => {
  return [
    {
      id: 'Trigger Configuration',
      tabTitle: getString('configuration'),
      requiredFields: ['name', 'identifier'], // conditional required validations checkValidTriggerConfiguration
      checkValidPanel: checkValidTriggerConfiguration
    },
    {
      id: 'Conditions',
      tabTitle: getString('conditions'),
      checkValidPanel: checkValidPayloadConditions
    },
    {
      id: 'Pipeline Input',
      tabTitle: getString('triggers.pipelineInputLabel'),
      checkValidPanel: checkValidPipelineInput
      //? was already added -> require all fields for input set and have preflight check handled on backend
    }
  ]
}

export interface WebhookInitialValuesInterface {
  triggerType: TriggerBaseType
  sourceRepo: SourceRepo
}

export interface FlatInitialValuesInterface {
  triggerType: NGTriggerSourceV2['type']
  identifier?: string
  tags?: {
    [key: string]: string
  }
  pipeline?: string | PipelineInfoConfig
  originalPipeline?: PipelineInfoConfig
  resolvedPipeline?: PipelineInfoConfig
  inputSetTemplateYamlObj?: {
    pipeline: PipelineInfoConfig | Record<string, never>
  }
  name?: string
  sourceRepo?: string
  connectorRef?: ConnectorRefInterface
  anyAction?: boolean
  autoAbortPreviousExecutions?: boolean
  pipelineBranchName?: string
}

export interface ConnectorRefInterface {
  identifier?: string
  repoName?: string
  value?: string
  connector?: ConnectorInfoDTO
  label?: string
  live?: boolean
}

export interface FlatOnEditValuesInterface {
  name?: string
  identifier?: string
  // targetIdentifier: string
  description?: string
  tags?: {
    [key: string]: string
  }
  pipeline?: PipelineInfoConfig
  triggerType: NGTriggerSourceV2['type']
  manifestType?: string
  artifactType?: string
  originalPipeline?: PipelineInfoConfig
  resolvedPipeline?: PipelineInfoConfig
  // WEBHOOK-SPECIFIC
  sourceRepo?: GetActionsListQueryParams['sourceRepo']
  connectorRef?: ConnectorRefInterface
  connectorIdentifier?: string
  repoName?: string
  repoUrl?: string
  autoAbortPreviousExecutions?: boolean
  event?: string
  actions?: string[]
  anyAction?: boolean // required for onEdit to show checked
  secureToken?: string
  sourceBranchOperator?: string
  sourceBranchValue?: string
  targetBranchOperator?: string
  targetBranchValue?: string
  changedFilesOperator?: string
  changedFilesValue?: string
  tagConditionOperator?: string
  tagConditionValue?: string
  headerConditions?: AddConditionInterface[]
  payloadConditions?: AddConditionInterface[]
  jexlCondition?: string
  stageId?: string
  inputSetTemplateYamlObj?: {
    pipeline: PipelineInfoConfig | Record<string, never>
  }
  eventConditions?: AddConditionInterface[]
  versionValue?: string
  versionOperator?: string
  buildValue?: string
  buildOperator?: string
  pipelineBranchName?: string
  inputSetRefs?: string[]
}

export const getModifiedTemplateValues = (
  initialValuesForEdit: FlatOnEditValuesInterface
): FlatOnEditValuesInterface => {
  const returnInitialValuesForEdit = { ...initialValuesForEdit }
  if (
    returnInitialValuesForEdit?.pipeline?.template?.templateInputs?.properties?.ci?.codebase?.repoName === '' &&
    !!returnInitialValuesForEdit.pipeline.template.templateInputs.properties.ci.codebase.connectorRef
  ) {
    // for CI Codebase, remove repoName: "" onEdit since connector is repo url type
    delete returnInitialValuesForEdit.pipeline.template.templateInputs.properties.ci.codebase.repoName
  }
  return returnInitialValuesForEdit
}

// requiredFields and checkValidPanel in getPanels() above to render warning icons related to this schema
export const getValidationSchema = (
  getString: UseStringsReturn['getString'],
  isGithubWebhookAuthenticationEnabled = false
): ObjectSchema<Record<string, any> | undefined> => {
  return object().shape({
    name: NameSchema({ requiredErrorMsg: getString('triggers.validation.triggerName') }),
    identifier: IdentifierSchema(),
    ...(isGithubWebhookAuthenticationEnabled && {
      encryptedWebhookSecretIdentifier: string().test(
        getString('triggers.validation.configureSecret'),
        getString('triggers.validation.configureSecret'),
        function (encryptedWebhookSecretIdentifier) {
          return !!encryptedWebhookSecretIdentifier
        }
      )
    }),
    event: string().test(
      getString('triggers.validation.event'),
      getString('triggers.validation.event'),
      function (event) {
        return this.parent.sourceRepo === CUSTOM || event
      }
    ),
    connectorRef: object().test(
      getString('triggers.validation.connector'),
      getString('triggers.validation.connector'),
      function (connectorRef) {
        // connectorRef is an object keeping track of whether repoName should be required
        return this.parent.sourceRepo === CUSTOM || connectorRef?.value
      }
    ),
    repoName: string()
      .nullable()
      .test(getString('triggers.validation.repoName'), getString('triggers.validation.repoName'), function (repoName) {
        const connectorURLType = this.parent.connectorRef?.connector?.spec?.type
        return (
          !connectorURLType ||
          (connectorURLType === connectorUrlType.ACCOUNT && repoName?.trim()) ||
          (connectorURLType === connectorUrlType.REGION && repoName?.trim()) ||
          (connectorURLType === connectorUrlType.PROJECT && repoName?.trim()) ||
          connectorURLType === connectorUrlType.REPO
        )
      }),
    actions: array().test(
      getString('triggers.validation.actions'),
      getString('triggers.validation.actions'),
      function (actions) {
        return this.parent.sourceRepo === CUSTOM || !isUndefined(actions) || this.parent.event === eventTypes.PUSH
      }
    ),
    sourceBranchOperator: string().test(
      getString('triggers.validation.operator'),
      getString('triggers.validation.operator'),
      function (operator) {
        return (
          // both filled or both empty. Return false to show error
          (operator && !this.parent.sourceBranchValue) ||
          (operator && this.parent.sourceBranchValue) ||
          (!this.parent.sourceBranchValue?.trim() && !operator)
        )
      }
    ),
    sourceBranchValue: string().test(
      getString('triggers.validation.matchesValue'),
      getString('triggers.validation.matchesValue'),
      function (matchesValue) {
        return (
          (matchesValue && !this.parent.sourceBranchOperator) ||
          (matchesValue && this.parent.sourceBranchOperator) ||
          (!matchesValue?.trim() && !this.parent.sourceBranchOperator)
        )
      }
    ),
    targetBranchOperator: string().test(
      getString('triggers.validation.operator'),
      getString('triggers.validation.operator'),
      function (operator) {
        return (
          (operator && !this.parent.targetBranchValue) ||
          (operator && this.parent.targetBranchValue) ||
          (!this.parent.targetBranchValue?.trim() && !operator)
        )
      }
    ),
    targetBranchValue: string().test(
      getString('triggers.validation.matchesValue'),
      getString('triggers.validation.matchesValue'),
      function (matchesValue) {
        return (
          (matchesValue && !this.parent.targetBranchOperator) ||
          (matchesValue && this.parent.targetBranchOperator) ||
          (!matchesValue?.trim() && !this.parent.targetBranchOperator)
        )
      }
    ),
    changedFilesOperator: string().test(
      getString('triggers.validation.operator'),
      getString('triggers.validation.operator'),
      function (operator) {
        return (
          (operator && !this.parent.changedFilesValue) ||
          (operator && this.parent.changedFilesValue) ||
          (!this.parent.changedFilesValue?.trim() && !operator)
        )
      }
    ),
    changedFilesValue: string().test(
      getString('triggers.validation.matchesValue'),
      getString('triggers.validation.matchesValue'),
      function (matchesValue) {
        return (
          (matchesValue && !this.parent.changedFilesOperator) ||
          (matchesValue && this.parent.changedFilesOperator) ||
          (!matchesValue?.trim() && !this.parent.changedFilesOperator)
        )
      }
    ),
    tagConditionOperator: string().test(
      getString('triggers.validation.operator'),
      getString('triggers.validation.operator'),
      function (operator) {
        return (
          (operator && !this.parent.tagConditionValue) ||
          (operator && this.parent.tagConditionValue) ||
          (!this.parent.tagConditionValue?.trim() && !operator)
        )
      }
    ),
    tagConditionValue: string().test(
      getString('triggers.validation.matchesValue'),
      getString('triggers.validation.matchesValue'),
      function (matchesValue) {
        return (
          (matchesValue && !this.parent.tagConditionOperator) ||
          (matchesValue && this.parent.tagConditionOperator) ||
          (!matchesValue?.trim() && !this.parent.tagConditionOperator)
        )
      }
    ),
    payloadConditions: array().test(
      getString('triggers.validation.payloadConditions'),
      getString('triggers.validation.payloadConditions'),
      function (payloadConditions = []) {
        if (payloadConditions.some((payloadCondition: AddConditionInterface) => isRowUnfilled(payloadCondition))) {
          return false
        }
        return true
      }
    ),
    headerConditions: array().test(
      getString('triggers.validation.headerConditions'),
      getString('triggers.validation.headerConditions'),
      function (headerConditions = []) {
        if (headerConditions.some((headerCondition: AddConditionInterface) => isRowUnfilled(headerCondition))) {
          return false
        }
        return true
      }
    )
  })
}

export const eventTypes = {
  PUSH: 'Push',
  BRANCH: 'Branch',
  TAG: 'Tag',
  PULL_REQUEST: 'PullRequest',
  MERGE_REQUEST: 'MergeRequest',
  ISSUE_COMMENT: 'IssueComment',
  PR_COMMENT: 'PRComment',
  MR_COMMENT: 'MRComment'
}

export const getWebhookGithubTriggersAuthenticationSetting = (moduleName: Module): string => {
  if (moduleName === 'cd') {
    return SettingType.WEBHOOK_GITHUB_TRIGGERS_AUTHENTICATION_CD
  }

  if (moduleName === 'ci') {
    return SettingType.WEBHOOK_GITHUB_TRIGGERS_AUTHENTICATION_CI
  }

  return ''
}
