/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { isEmpty, set, get, isArray } from 'lodash-es'
import * as Yup from 'yup'
import { FormikErrors, yupToFormErrors } from 'formik'
import { v4 as uuid } from 'uuid'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { parse } from 'yaml'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { listSecretsV2Promise, SecretResponseWrapper } from 'services/cd-ng'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { Scope } from '@common/interfaces/SecretsInterface'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'

import type { StringsMap } from 'stringTypes'
import { shellScriptType } from './BaseShellScript'

import { ShellScriptData, ShellScriptFormData, variableSchema } from './shellScriptTypes'
import ShellScriptInputSetStep from './ShellScriptInputSetStep'
import { ShellScriptWidgetWithRef } from './ShellScriptWidget'
import { ShellScriptVariablesView, ShellScriptVariablesViewProps } from './ShellScriptVariablesView'

const logger = loggerFor(ModuleName.CD)
const ConnectorRefRegex = /^.+step\.spec\.executionTarget\.connectorRef$/

const getConnectorValue = (connector?: SecretResponseWrapper): string =>
  `${
    connector?.secret?.orgIdentifier && connector?.secret?.projectIdentifier
      ? connector?.secret?.identifier
      : connector?.secret?.orgIdentifier
      ? `${Scope.ORG}.${connector?.secret?.identifier}`
      : `${Scope.ACCOUNT}.${connector?.secret?.identifier}`
  }` || ''

const getConnectorName = (connector?: SecretResponseWrapper): string =>
  `${
    connector?.secret?.orgIdentifier && connector?.secret?.projectIdentifier
      ? `${connector?.secret?.type}: ${connector?.secret?.name}`
      : connector?.secret?.orgIdentifier
      ? `${connector?.secret?.type}[Org]: ${connector?.secret?.name}`
      : `${connector?.secret?.type}[Account]: ${connector?.secret?.name}`
  }` || ''

export class ShellScriptStep extends PipelineStep<ShellScriptData> {
  constructor() {
    super()
    this.invocationMap.set(ConnectorRefRegex, this.getSecretsListForYaml.bind(this))
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  renderStep(props: StepProps<ShellScriptData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      onChange,
      allowableTypes,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly
    } = props

    if (this.isTemplatizedView(stepViewType)) {
      return (
        <ShellScriptInputSetStep
          initialValues={this.getInitialValues(initialValues)}
          onUpdate={data => onUpdate?.(this.processFormData(data))}
          stepViewType={stepViewType}
          readonly={!!inputSetData?.readonly}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          allowableTypes={allowableTypes}
        />
      )
    }

    if (stepViewType === StepViewType.InputVariable) {
      return (
        <ShellScriptVariablesView
          {...(customStepProps as ShellScriptVariablesViewProps)}
          originalData={initialValues}
        />
      )
    }

    return (
      <ShellScriptWidgetWithRef
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        onChange={data => onChange?.(this.processFormData(data))}
        allowableTypes={allowableTypes}
        stepViewType={stepViewType}
        isNewStep={isNewStep}
        readonly={readonly}
        ref={formikRef}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ShellScriptData>): FormikErrors<ShellScriptData> {
    const errors: FormikErrors<ShellScriptData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })
      if (isRequired) {
        timeoutSchema = timeoutSchema.required(getString?.('validation.timeout10SecMinimum'))
      }
      const timeout = Yup.object().shape({
        timeout: timeoutSchema
      })

      try {
        timeout.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }

    /* istanbul ignore else */
    if (
      (isArray(template?.spec?.environmentVariables) || isArray(template?.spec?.outputVariables)) &&
      isRequired &&
      getString
    ) {
      try {
        const schema = Yup.object().shape({
          spec: Yup.object().shape({
            environmentVariables: variableSchema(getString),
            outputVariables: variableSchema(getString)
          })
        })
        schema.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.source?.spec?.script) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.source?.spec?.script)
    ) {
      set(errors, 'spec.source.spec.script', getString?.('fieldRequired', { field: 'Script' }))
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.executionTarget?.host) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.executionTarget?.host)
    ) {
      set(errors, 'spec.executionTarget.host', getString?.('fieldRequired', { field: 'Target Host' }))
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.executionTarget?.connectorRef) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.executionTarget?.connectorRef)
    ) {
      set(
        errors,
        'spec.executionTarget.connectorRef',
        getString?.('fieldRequired', { field: 'SSH Connection Attribute' })
      )
    }

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.executionTarget?.workingDirectory) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.executionTarget?.workingDirectory)
    ) {
      set(errors, 'spec.executionTarget.workingDirectory', getString?.('fieldRequired', { field: 'Working Directory' }))
    }
    return errors
  }

  protected type = StepType.SHELLSCRIPT
  protected stepName = 'Shell Script'
  protected stepIcon: IconName = 'command-shell-script'
  protected stepIconColor = Color.GREY_700
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.SHELLSCRIPT'
  protected referenceId = 'shellScriptHelpPanel'
  protected isHarnessSpecific = false
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  protected defaultValues: ShellScriptData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.SHELLSCRIPT,
    spec: {
      shell: shellScriptType[0].value,
      onDelegate: 'targethost',
      source: {
        type: 'Inline',
        spec: {
          script: ''
        }
      }
    }
  }

  protected async getSecretsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (obj) {
        const listOfSecrets = await listSecretsV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            includeSecretsFromEverySubScope: true,
            types: ['SecretText', 'SSHKey'],
            pageIndex: 0,
            pageSize: 10
          }
        }).then(response =>
          response?.data?.content?.map(connector => {
            return {
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            }
          })
        )
        return listOfSecrets || []
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  private getInitialValues(initialValues: ShellScriptData): ShellScriptFormData {
    return {
      ...initialValues,
      spec: {
        ...initialValues.spec,
        shell: initialValues.spec?.shell || 'Bash',
        onDelegate: initialValues.spec?.onDelegate ? 'delegate' : 'targethost',
        source: {
          type: 'Inline',
          ...(initialValues?.spec?.source || {})
        },
        environmentVariables: Array.isArray(initialValues.spec?.environmentVariables)
          ? initialValues.spec?.environmentVariables.map(variable => ({
              ...variable,
              id: uuid()
            }))
          : [],

        outputVariables: Array.isArray(initialValues.spec?.outputVariables)
          ? initialValues.spec?.outputVariables.map(variable => ({
              ...variable,
              id: uuid()
            }))
          : []
      }
    }
  }

  processFormData(data: ShellScriptFormData): ShellScriptData {
    const modifiedData = {
      ...data,
      spec: {
        ...data.spec,
        onDelegate: data.spec?.onDelegate !== 'targethost',

        source: {
          ...data.spec?.source,
          spec: {
            ...data.spec?.source?.spec,
            script: data.spec?.source?.spec?.script
          }
        },

        executionTarget: {
          ...data.spec?.executionTarget,
          connectorRef:
            (data.spec?.executionTarget?.connectorRef?.value as string) ||
            data.spec?.executionTarget?.connectorRef?.toString()
        },

        environmentVariables: Array.isArray(data.spec?.environmentVariables)
          ? data.spec?.environmentVariables.filter(variable => variable.value).map(({ id, ...variable }) => variable)
          : undefined,

        outputVariables: Array.isArray(data.spec?.outputVariables)
          ? data.spec?.outputVariables.filter(variable => variable.value).map(({ id, ...variable }) => variable)
          : undefined
      }
    }

    if (!modifiedData.spec.executionTarget.connectorRef) {
      delete modifiedData.spec.executionTarget.connectorRef
    }

    if (modifiedData.spec.onDelegate) {
      delete modifiedData.spec.executionTarget
    }

    return modifiedData
  }
}
