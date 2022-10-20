/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Dispatch, SetStateAction, useCallback, useState } from 'react'
import { useParams, useHistory, matchPath } from 'react-router-dom'
import { parse } from 'yaml'
import { defaultTo, get, isEmpty } from 'lodash-es'
import type { FormikProps } from 'formik'
import cx from 'classnames'
import {
  Container,
  Layout,
  Text,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  useToaster,
  ThumbnailSelect,
  Card,
  Accordion,
  MultiTypeInputType,
  ButtonVariation,
  Tag,
  FormikForm,
  HarnessDocTooltip,
  AllowedTypesWithRunTime
} from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import routes from '@common/RouteDefinitions'
import { projectPathProps, modulePathProps, environmentPathProps } from '@common/utils/routeUtils'
import { NavigationCheck } from '@common/exports'
import { useStrings } from 'framework/strings'
import {
  ApplicationSettingsConfiguration,
  ConfigFileWrapper,
  ConnectionStringsConfiguration,
  ManifestConfigWrapper,
  NGEnvironmentInfoConfig,
  ResponseEnvironmentResponse,
  useGetYamlSchema
} from 'services/cd-ng'
import type { EnvironmentPathProps, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { YamlBuilderMemo } from '@common/components/YAMLBuilder/YamlBuilder'
import { NameIdDescriptionTags } from '@common/components'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { CustomVariablesEditableStage } from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariablesEditableStage'
import type { AllNGVariables } from '@pipeline/utils/types'
import { PipelineContextType } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { usePermission } from '@rbac/hooks/usePermission'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import ApplicationConfigSelection from '@cd/components/PipelineSteps/AzureWebAppServiceSpec/AzureWebAppServiceConfiguration/AzureWebAppServiceConfigSelection'
import { AzureWebAppSelectionTypes } from '@cd/components/PipelineSteps/AzureWebAppServiceSpec/AzureWebAppServiceConfiguration/AzureWebAppServiceConfig.types'
import ServiceManifestOverride from '../ServiceOverrides/ServiceManifestOverride/ServiceManifestOverride'
import ServiceConfigFileOverride from '../ServiceOverrides/ServiceConfigFileOverride/ServiceConfigFileOverride'
import css from '../EnvironmentDetails.module.scss'

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `environment.yaml`,
  entityType: 'Environment',
  width: '100%',
  height: 600,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

export interface EnvironmentConfigurationProps {
  formikProps: FormikProps<NGEnvironmentInfoConfig>
  selectedView: SelectedView
  setSelectedView: (view: SelectedView) => void
  yamlHandler?: YamlBuilderHandlerBinding
  setYamlHandler: Dispatch<SetStateAction<YamlBuilderHandlerBinding | undefined>>
  isModified: boolean
  data: ResponseEnvironmentResponse | null
  isEdit: boolean
  context?: PipelineContextType
}

const shouldBlockNavigation = ({
  isSubmitting,
  isValid,
  isYamlView,
  yamlHandler,
  dirty
}: {
  isSubmitting: boolean
  isValid: boolean
  isYamlView: boolean
  yamlHandler?: YamlBuilderHandlerBinding
  dirty: boolean
}): boolean => {
  const shouldBlockNav = !(isSubmitting && (isValid || isYamlView))
  if ((isYamlView && yamlHandler) || dirty) {
    return shouldBlockNav
  }
  return false
}

export default function EnvironmentConfiguration({
  selectedView,
  setSelectedView,
  formikProps,
  yamlHandler,
  setYamlHandler,
  isModified,
  data,
  isEdit,
  context
}: EnvironmentConfigurationProps): JSX.Element {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps & EnvironmentPathProps>()
  const history = useHistory()
  const { expressions } = useVariablesExpression()

  const [canEdit] = usePermission({
    resource: {
      resourceType: ResourceType.ENVIRONMENT
    },
    permissions: [PermissionIdentifier.EDIT_ENVIRONMENT]
  })
  const allowableTypes: AllowedTypesWithRunTime[] = [
    MultiTypeInputType.FIXED,
    MultiTypeInputType.RUNTIME,
    MultiTypeInputType.EXPRESSION
  ]
  const typeList: { label: string; value: string }[] = [
    {
      label: getString('production'),
      value: 'Production'
    },
    {
      label: getString('cd.preProduction'),
      value: 'PreProduction'
    }
  ]
  const [isYamlEditable, setIsYamlEditable] = useState(false)

  const { data: environmentSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'Environment',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })

  const handleYamlChange = useCallback((): void => {
    const yaml = defaultTo(yamlHandler?.getLatestYaml(), '{}')
    const yamlVisual = parse(yaml).environment as NGEnvironmentInfoConfig
    if (yamlVisual) {
      formikProps?.validateForm({
        ...yamlVisual
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yamlHandler])

  const handleModeSwitch = useCallback(
    /* istanbul ignore next */ (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '{}')
        const yamlVisual = parse(yaml).environment as NGEnvironmentInfoConfig

        if (isModified && yamlHandler?.getYAMLValidationErrorMap()?.size) {
          showError(getString('common.validation.invalidYamlText'))
          return
        }

        if (yamlVisual) {
          formikProps?.setValues({
            ...yamlVisual
          })
        }
      }
      setSelectedView(view)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [yamlHandler?.getLatestYaml, data]
  )

  const handleEditMode = (): void => setIsYamlEditable(true)

  const isInvalidYaml = useCallback((): boolean => {
    if (yamlHandler) {
      const parsedYaml = parse(yamlHandler.getLatestYaml())
      if (!parsedYaml || yamlHandler.getYAMLValidationErrorMap()?.size > 0) {
        return true
      }
    }
    return false
  }, [yamlHandler])

  const invalidYaml = isInvalidYaml()

  /**********************************************Service Overide CRUD Operations ************************************************/
  const handleOverrideSubmit = useCallback(
    (
      overrideObj:
        | ManifestConfigWrapper
        | ConfigFileWrapper
        | ApplicationSettingsConfiguration
        | ConnectionStringsConfiguration,
      overrideIdx: number,
      type: string
    ): void => {
      switch (type) {
        case 'applicationSettings':
        case 'connectionStrings':
          formikProps.setFieldValue(`overrides.${type}`, overrideObj)
          break
        default: {
          const envOverrides = get(formikProps.values.overrides, `${type}`)
          const overrideDefaultValue = Array.isArray(envOverrides) ? [...envOverrides] : []
          if (overrideDefaultValue.length > 0) {
            overrideDefaultValue.splice(overrideIdx, 1, overrideObj)
          } else {
            overrideDefaultValue.push(overrideObj)
          }
          formikProps.setFieldValue(`overrides.${type}`, overrideDefaultValue)
        }
      }
    },
    [formikProps]
  )

  const removeOverrideConfig = useCallback(
    (index: number, type: string): void => {
      switch (type) {
        case 'applicationSettings':
        case 'connectionStrings':
          formikProps.setFieldValue(`overrides.${type}`, undefined)
          break
        default: {
          const envOverrides = get(formikProps.values.overrides, `${type}`)
          const overrideDefaultValue = Array.isArray(envOverrides) ? [...envOverrides] : []
          overrideDefaultValue.splice(index, 1)
          formikProps.setFieldValue(`overrides.${type}`, overrideDefaultValue)
        }
      }
    },
    [formikProps]
  )
  /**********************************************Service Overide CRUD Operations ************************************************/

  return (
    <Container padding={{ left: 'xxlarge', right: 'medium' }}>
      <NavigationCheck
        when={isModified || invalidYaml}
        shouldBlockNavigation={nextLocation => {
          const matchDefault = matchPath(nextLocation.pathname, {
            path: routes.toEnvironmentDetails({
              ...projectPathProps,
              ...modulePathProps,
              ...environmentPathProps
            }),
            exact: true
          })

          return (
            !matchDefault?.isExact &&
            shouldBlockNavigation({
              isSubmitting: formikProps.isSubmitting,
              isValid: formikProps.isValid,
              isYamlView: selectedView === SelectedView.YAML,
              yamlHandler,
              dirty: formikProps.dirty
            })
          )
        }}
        textProps={{
          contentText: getString(invalidYaml ? 'navigationYamlError' : 'navigationCheckText'),
          titleText: getString(invalidYaml ? 'navigationYamlErrorTitle' : 'navigationCheckTitle')
        }}
        navigate={newPath => {
          history.push(newPath)
        }}
      />
      <Layout.Horizontal
        margin={{ bottom: 'medium' }}
        flex={{
          justifyContent: context !== PipelineContextType.Standalone ? 'flex-start' : 'center'
        }}
        width={'100%'}
      >
        <VisualYamlToggle
          selectedView={selectedView}
          onChange={nextMode => {
            handleModeSwitch(nextMode)
          }}
        />
      </Layout.Horizontal>
      {selectedView === SelectedView.VISUAL ? (
        <FormikForm>
          <Card
            className={cx(css.sectionCard, { [css.fullWidth]: context !== PipelineContextType.Standalone })}
            id="variables"
          >
            <Container width={'40%'} padding={{ top: 'small' }} margin={{ bottom: 'large' }}>
              <NameIdDescriptionTags
                formikProps={formikProps}
                identifierProps={{ isIdentifierEditable: !isEdit }}
                inputGroupProps={{ disabled: !canEdit }}
                descriptionProps={{ disabled: !canEdit }}
                tagsProps={{ disabled: !canEdit }}
              />
            </Container>
            <Text
              color={Color.GREY_450}
              margin={{ top: 'medium', bottom: 'small' }}
              font={{ variation: FontVariation.FORM_LABEL, weight: 'bold' }}
            >
              {getString('envType')}
            </Text>
            <ThumbnailSelect className={css.thumbnailSelect} name={'type'} items={typeList} isReadonly={!canEdit} />
          </Card>
          <Accordion activeId={'environment'} className={css.accordion}>
            <Accordion.Panel
              id="environment"
              addDomId={true}
              summary={
                <Text
                  color={Color.GREY_700}
                  font={{ weight: 'bold', size: 'medium' }}
                  margin={{ left: 'small', right: 'small' }}
                  data-tooltip-id="environmentGlobalOverride"
                >
                  {`${getString('common.environmentOverrides')}`}
                  <HarnessDocTooltip useStandAlone={true} tooltipId="environmentGlobalOverride" />
                </Text>
              }
              details={
                <Layout.Vertical spacing="medium" margin={{ bottom: 'small' }}>
                  <Card
                    className={cx(css.sectionCard, { [css.fullWidth]: context !== PipelineContextType.Standalone })}
                    id="manifests"
                  >
                    <Text
                      color={Color.GREY_700}
                      font={{ weight: 'bold' }}
                      margin={{ bottom: 'small' }}
                      data-tooltip-id="manifestsOverride"
                    >
                      {getString('manifests')}
                      <HarnessDocTooltip useStandAlone={true} tooltipId="manifestsOverride" />
                    </Text>
                    <ServiceManifestOverride
                      manifestOverrides={defaultTo(formikProps.values.overrides?.manifests, [])}
                      handleManifestOverrideSubmit={(manifestObj, index) =>
                        handleOverrideSubmit(manifestObj, index, 'manifests')
                      }
                      removeManifestConfig={index => removeOverrideConfig(index, 'manifests')}
                      isReadonly={!canEdit}
                      fromEnvConfigPage
                      expressions={expressions}
                      allowableTypes={allowableTypes}
                    />
                  </Card>
                  <Card
                    className={cx(css.sectionCard, { [css.fullWidth]: context !== PipelineContextType.Standalone })}
                    id="configFiles"
                  >
                    <Text
                      color={Color.GREY_700}
                      font={{ weight: 'bold' }}
                      margin={{ bottom: 'small' }}
                      data-tooltip-id="filesOverride"
                    >
                      {getString('pipelineSteps.configFiles')}
                      <HarnessDocTooltip useStandAlone={true} tooltipId="filesOverride" />
                    </Text>
                    <ServiceConfigFileOverride
                      fileOverrides={defaultTo(formikProps.values.overrides?.configFiles, [])}
                      allowableTypes={allowableTypes}
                      handleConfigFileOverrideSubmit={(filesObj, index) =>
                        handleOverrideSubmit(filesObj, index, 'configFiles')
                      }
                      handleServiceFileDelete={index => removeOverrideConfig(index, 'configFiles')}
                      isReadonly={!canEdit}
                      expressions={expressions}
                      fromEnvConfigPage
                    />
                  </Card>
                  <Card
                    className={cx(css.sectionCard, { [css.fullWidth]: context !== PipelineContextType.Standalone })}
                    id="applicationSettings"
                  >
                    <Text
                      color={Color.GREY_700}
                      font={{ weight: 'bold' }}
                      margin={{ bottom: 'small' }}
                      data-tooltip-id="applicationSettingsOverride"
                    >
                      {getString('pipeline.appServiceConfig.applicationSettings.name')}
                      <HarnessDocTooltip useStandAlone={true} tooltipId="applicationSettingsOverride" />
                    </Text>
                    <ApplicationConfigSelection
                      environmentAllowableTypes={allowableTypes}
                      readonly={!canEdit}
                      showApplicationSettings={true}
                      data={formikProps.values.overrides?.applicationSettings}
                      selectionType={AzureWebAppSelectionTypes.ENV_CONFIG}
                      handleSubmitConfig={(config: ApplicationSettingsConfiguration | ConnectionStringsConfiguration) =>
                        handleOverrideSubmit(config, 0, 'applicationSettings')
                      }
                      handleDeleteConfig={index => removeOverrideConfig(index, 'applicationSettings')}
                    />
                  </Card>
                  <Card
                    className={cx(css.sectionCard, { [css.fullWidth]: context !== PipelineContextType.Standalone })}
                    id="connectionStrings"
                  >
                    <Text
                      color={Color.GREY_700}
                      font={{ weight: 'bold' }}
                      margin={{ bottom: 'small' }}
                      data-tooltip-id="connectionStringsOverride"
                    >
                      {getString('pipeline.appServiceConfig.connectionStrings.name')}
                      <HarnessDocTooltip useStandAlone={true} tooltipId="connectionStringsOverride" />
                    </Text>
                    <ApplicationConfigSelection
                      environmentAllowableTypes={allowableTypes}
                      readonly={!canEdit}
                      showConnectionStrings={true}
                      data={formikProps.values.overrides?.connectionStrings}
                      selectionType={AzureWebAppSelectionTypes.ENV_CONFIG}
                      handleSubmitConfig={(config: ApplicationSettingsConfiguration | ConnectionStringsConfiguration) =>
                        handleOverrideSubmit(config, 0, 'connectionStrings')
                      }
                      handleDeleteConfig={index => removeOverrideConfig(index, 'connectionStrings')}
                    />
                  </Card>
                </Layout.Vertical>
              }
            />
          </Accordion>
          {/* #region Advanced section */}
          {data?.data && (
            <Accordion activeId={'advanced'} className={css.accordion}>
              <Accordion.Panel
                id="advanced"
                addDomId={true}
                summary={
                  <Text
                    color={Color.GREY_700}
                    font={{ weight: 'bold', size: 'medium' }}
                    margin={{ left: 'small', right: 'small' }}
                    data-tooltip-id="environmentAdvancedOverride"
                  >
                    {`${getString('common.advanced')}  ${getString('titleOptional')}`}
                    <HarnessDocTooltip useStandAlone={true} tooltipId="environmentAdvancedOverride" />
                  </Text>
                }
                details={
                  <Layout.Vertical spacing="medium" margin={{ bottom: 'small' }}>
                    <Card
                      className={cx(css.sectionCard, { [css.fullWidth]: context !== PipelineContextType.Standalone })}
                      id="variables"
                    >
                      <Text
                        color={Color.GREY_700}
                        margin={{ bottom: 'small' }}
                        font={{ weight: 'bold' }}
                        data-tooltip-id="variableOverride"
                      >
                        {getString('common.variables')}
                        <HarnessDocTooltip useStandAlone={true} tooltipId="variableOverride" />
                      </Text>
                      <CustomVariablesEditableStage
                        formName="editEnvironment"
                        initialValues={{
                          variables: defaultTo(formikProps.values.variables, []) as AllNGVariables[],
                          canAddVariable: true
                        }}
                        allowableTypes={[
                          MultiTypeInputType.FIXED,
                          MultiTypeInputType.RUNTIME,
                          MultiTypeInputType.EXPRESSION
                        ]}
                        readonly={!canEdit}
                        onUpdate={values => {
                          formikProps.setFieldValue('variables', values.variables)
                        }}
                        fromEnvironmentConfiguration={true}
                      />
                    </Card>
                  </Layout.Vertical>
                }
              />
            </Accordion>
          )}
          {/* #endregion */}
        </FormikForm>
      ) : (
        <div className={css.yamlBuilder}>
          <YamlBuilderMemo
            {...yamlBuilderReadOnlyModeProps}
            existingJSON={{
              environment: {
                name: defaultTo(formikProps.values.name, ''),
                identifier: defaultTo(formikProps.values.identifier, ''),
                description: formikProps.values.description,
                tags: defaultTo(formikProps.values.tags, {}),
                type: defaultTo(formikProps.values.type, 'Production'),
                orgIdentifier: defaultTo(formikProps.values.orgIdentifier, ''),
                projectIdentifier: defaultTo(formikProps.values.projectIdentifier, ''),
                variables: defaultTo(formikProps.values.variables, []),
                overrides: !isEmpty(formikProps.values.overrides)
                  ? {
                      manifests: formikProps.values.overrides?.manifests,
                      configFiles: formikProps.values.overrides?.configFiles,
                      applicationSettings: formikProps.values.overrides?.applicationSettings,
                      connectionStrings: formikProps.values.overrides?.connectionStrings
                    }
                  : undefined
              }
            }}
            key={isYamlEditable.toString()}
            schema={environmentSchema?.data}
            bind={setYamlHandler}
            isReadOnlyMode={!isYamlEditable}
            onChange={handleYamlChange}
            isEditModeSupported={canEdit}
            onEnableEditMode={handleEditMode}
          />
          {!isYamlEditable ? (
            <div className={css.buttonWrapper}>
              <Tag>{getString('common.readOnly')}</Tag>
              <RbacButton
                permission={{
                  resource: {
                    resourceType: ResourceType.ENVIRONMENT
                  },
                  permission: PermissionIdentifier.EDIT_ENVIRONMENT
                }}
                variation={ButtonVariation.SECONDARY}
                text={getString('common.editYaml')}
                onClick={handleEditMode}
              />
            </div>
          ) : null}
        </div>
      )}
    </Container>
  )
}
