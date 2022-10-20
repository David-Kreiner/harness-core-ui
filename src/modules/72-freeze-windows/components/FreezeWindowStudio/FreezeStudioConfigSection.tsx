/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import { isEmpty, noop } from 'lodash-es'
import classnames from 'classnames'
import {
  Button,
  ButtonVariation,
  Card,
  Container,
  Formik,
  FormikForm,
  FormInput,
  Heading,
  Layout
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { FreezeWindowContext } from '@freeze-windows/components/FreezeWindowStudio/FreezeWindowContext/FreezeWindowContext'
import {
  EntityConfig,
  EntityType,
  EnvironmentType,
  FIELD_KEYS,
  FreezeWindowLevels,
  ResourcesInterface
} from '@freeze-windows/types'
import {
  convertValuesToYamlObj,
  FieldVisibility,
  getEmptyEntityConfig,
  getFieldsVisibility,
  getInitialValuesForConfigSection,
  getValidationSchema
} from './FreezeWindowStudioUtil'
import {
  EnvironmentTypeRenderer,
  Organizationfield,
  ProjectField,
  ServiceFieldRenderer,
  ServicesAndEnvRenderer,
  OrgProjAndServiceRenderer
} from './FreezeStudioConfigSectionRenderers'
import css from './FreezeWindowStudio.module.scss'

interface ConfigViewModeRendererProps {
  config: EntityConfig
  getString: UseStringsReturn['getString']
  setEditView: () => void
  deleteConfig: () => void
  fieldsVisibility: FieldVisibility
  resources: ResourcesInterface
  isReadOnly: boolean
  index: number
}

const ConfigViewModeRenderer: React.FC<ConfigViewModeRendererProps> = ({
  config,
  getString,
  setEditView,
  deleteConfig,
  fieldsVisibility,
  resources,
  isReadOnly,
  index
}) => {
  const { name, entities } = config || {}
  const entitiesMap: Record<FIELD_KEYS, EntityType> =
    entities?.reduce((accum: any, item: EntityType) => {
      if (item?.type) {
        accum[item.type] = item as EntityType
      }
      return accum
    }, {}) || {}
  return (
    <Layout.Horizontal
      flex={{ justifyContent: 'space-between', alignItems: 'start' }}
      data-testid={`config-view-mode_${index}`}
    >
      <Layout.Vertical>
        <Heading
          color={Color.GREY_800}
          level={3}
          style={{ fontWeight: 700, fontSize: '12px', lineHeight: '18px', marginBottom: '12px' }}
        >
          {name}
        </Heading>
        <OrgProjAndServiceRenderer
          entitiesMap={entitiesMap}
          freezeWindowLevel={fieldsVisibility.freezeWindowLevel}
          resources={resources}
          getString={getString}
        />
        <ServicesAndEnvRenderer
          freezeWindowLevel={fieldsVisibility.freezeWindowLevel}
          getString={getString}
          envType={(entitiesMap[FIELD_KEYS.EnvType]?.entityRefs?.[0] || EnvironmentType.All) as EnvironmentType}
        />
      </Layout.Vertical>
      <Layout.Horizontal>
        <Button disabled={isReadOnly} icon="edit" minimal withoutCurrentColor onClick={setEditView} />
        <Button disabled={isReadOnly} icon="trash" minimal withoutCurrentColor onClick={deleteConfig} />
      </Layout.Horizontal>
    </Layout.Horizontal>
  )
}

interface ConfigEditModeRendererProps {
  index: number
  getString: UseStringsReturn['getString']
  formikProps: any
  resources: ResourcesInterface
  saveEntity: any
  setVisualView: () => void
  fieldsVisibility: FieldVisibility
}

const ConfigEditModeRenderer: React.FC<ConfigEditModeRendererProps> = ({
  index,
  getString,
  formikProps,
  resources,
  saveEntity,
  setVisualView,
  fieldsVisibility
}) => {
  return (
    <FormikForm>
      <Layout.Vertical data-testid={`config-edit-mode_${index}`}>
        <Layout.Horizontal flex={{ justifyContent: 'space-between', alignItems: 'start' }}>
          <Layout.Vertical width={'400px'}>
            <FormInput.Text name={`entity[${index}].name`} label={getString('name')} inputGroup={{ autoFocus: true }} />
            {fieldsVisibility.showOrgField ? (
              <Organizationfield
                getString={getString}
                namePrefix={`entity[${index}]`}
                values={formikProps.values?.entity?.[index] || {}}
                setFieldValue={formikProps.setFieldValue}
                organizations={resources.orgs || []}
                fetchProjectsForOrgId={resources.fetchProjectsForOrgId}
              />
            ) : null}
            {fieldsVisibility.showProjectField ? (
              <ProjectField
                getString={getString}
                namePrefix={`entity[${index}]`}
                values={formikProps.values?.entity?.[index] || {}}
                setFieldValue={formikProps.setFieldValue}
                resources={resources}
              />
            ) : null}
          </Layout.Vertical>
          <Layout.Horizontal spacing="small">
            <Button icon="tick" minimal withoutCurrentColor className={css.tickButton} onClick={saveEntity} />
            <Button icon="cross" minimal withoutCurrentColor className={css.crossButton} onClick={setVisualView} />
          </Layout.Horizontal>
        </Layout.Horizontal>
        <hr className={css.separator} />
        <Layout.Vertical>
          <Layout.Horizontal spacing="medium">
            <ServiceFieldRenderer
              getString={getString}
              name={`entity[${index}].${FIELD_KEYS.Service}`}
              isDisabled={resources.freezeWindowLevel !== FreezeWindowLevels.PROJECT}
              services={resources.services || []}
            />
            <EnvironmentTypeRenderer getString={getString} name={`entity[${index}].${FIELD_KEYS.EnvType}`} />
          </Layout.Horizontal>
        </Layout.Vertical>
      </Layout.Vertical>
    </FormikForm>
  )
}

interface ConfigRendererProps {
  config: EntityConfig
  isEdit: boolean
  setEditView: (index: number, isEdit: boolean) => void
  getString: UseStringsReturn['getString']
  index: number
  updateFreeze: (freeze: any) => void
  formikProps: any
  entityConfigs: EntityConfig[]
  resources: ResourcesInterface
  fieldsVisibility: FieldVisibility
  onDeleteRule: (index: number) => void
  isReadOnly: boolean
}

const ConfigRenderer = ({
  config,
  isEdit,
  setEditView,
  getString,
  index,
  updateFreeze,
  formikProps,
  entityConfigs,
  resources,
  fieldsVisibility,
  onDeleteRule,
  isReadOnly
}: ConfigRendererProps) => {
  const saveEntity = async () => {
    const formErrors = await formikProps.validateForm()
    if (!isEmpty(formErrors?.entity?.[index])) {
      formikProps.setErrors(formErrors)
      const errorKeys = Object.keys(formErrors.entity[index])
      const newTouchedObj: { [key: string]: boolean } = {}
      errorKeys.forEach(k => (newTouchedObj[`entity[${index}].${k}`] = true))
      formikProps.setTouched({ ...formikProps.touched, ...newTouchedObj }) // required to display
      return
    }
    const values = formikProps.values.entity

    const updatedEntityConfigs = [...entityConfigs]
    updatedEntityConfigs[index] = convertValuesToYamlObj(updatedEntityConfigs[index], values[index], fieldsVisibility)

    updateFreeze({ entityConfigs: updatedEntityConfigs })
    setEditView(index, false)
  }

  const setVisualViewMode = React.useCallback(() => {
    setEditView(index, false)
  }, [])
  const setEditViewMode = React.useCallback(() => {
    setEditView(index, true)
  }, [])

  const deleteConfig = () => {
    const updatedEntityConfigs = entityConfigs.filter((_, i) => index !== i)
    updateFreeze({ entityConfigs: updatedEntityConfigs })
    onDeleteRule(index)
  }

  return (
    <Container
      padding="large"
      className={classnames(css.configFormContainer, { [css.isEditView]: isEdit })}
      margin={{ top: 'xlarge' }}
    >
      {isEdit ? (
        <ConfigEditModeRenderer
          index={index}
          getString={getString}
          formikProps={formikProps}
          resources={resources}
          saveEntity={saveEntity}
          setVisualView={setVisualViewMode}
          fieldsVisibility={fieldsVisibility}
        />
      ) : (
        <ConfigViewModeRenderer
          index={index}
          config={config}
          getString={getString}
          setEditView={setEditViewMode}
          deleteConfig={deleteConfig}
          fieldsVisibility={fieldsVisibility}
          resources={resources}
          isReadOnly={isReadOnly}
        />
      )}
    </Container>
  )
}

interface ConfigsSectionProps {
  entityConfigs: EntityConfig[]
  getString: UseStringsReturn['getString']
  updateFreeze: (freeze: any) => void
  resources: ResourcesInterface
  fieldsVisibility: FieldVisibility
  isReadOnly: boolean
}
const ConfigsSection = ({
  entityConfigs,
  getString,
  updateFreeze,
  resources,
  fieldsVisibility,
  isReadOnly
}: ConfigsSectionProps) => {
  const formikRef = React.useRef()
  const [editViews, setEditViews] = React.useState<boolean[]>(Array(entityConfigs?.length).fill(false))
  const [initialValues, setInitialValues] = React.useState(
    getInitialValuesForConfigSection(entityConfigs, getString, resources)
  )
  React.useEffect(() => {
    setInitialValues(getInitialValuesForConfigSection(entityConfigs, getString, resources))
  }, [
    resources.orgs.length,
    resources.projects.length,
    resources.services.length,
    Object.keys(resources.projectsByOrgId).length
  ])

  React.useEffect(() => {
    if (editViews.length === 0 && entityConfigs.length > 0) {
      setEditViews(Array(entityConfigs?.length).fill(false))
    }
  }, [entityConfigs.length])

  const onDeleteRule = React.useCallback(index => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const currentValues = formikRef.current?.values
    const updatedValues = [...(currentValues?.entity || [])]
    updatedValues.splice(index, 1)
    setInitialValues({ entity: updatedValues })
    setEditViews(_editViews => {
      const newEditViews = [..._editViews]
      newEditViews.splice(index, 1)
      return newEditViews
    })
  }, [])

  const onAddRule = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const currentValues = formikRef.current?.values
    const addedConfig = getEmptyEntityConfig(fieldsVisibility)
    const updatedEntityConfigs = [...(entityConfigs || []), addedConfig]
    const initValuesForAddedConfig = getInitialValuesForConfigSection([addedConfig], getString, resources)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const updatedValues = [...(currentValues?.entity || []), ...(initValuesForAddedConfig?.entity || [])]
    setInitialValues({ entity: updatedValues })
    updateFreeze({ entityConfigs: updatedEntityConfigs })
    setEditViews(_editViews => [..._editViews, true])
  }

  const setEditView = (index: number, isEdit: boolean) => {
    setEditViews(_editViews => {
      const newEditViews = [..._editViews]
      newEditViews[index] = isEdit
      return newEditViews
    })
  }

  return (
    <>
      <Formik
        // key={entityConfigs?.length}
        initialValues={initialValues}
        enableReinitialize
        onSubmit={noop}
        formName="freezeWindowStudioConfigForm"
        validationSchema={Yup.object().shape({
          entity: Yup.array().of(
            Yup.object().shape({
              name: Yup.string().required('Name is required'),
              ...getValidationSchema(fieldsVisibility.freezeWindowLevel)
            })
          )
        })}
      >
        {formikProps => {
          formikRef.current = formikProps as any
          return entityConfigs.map((config: EntityConfig, index: number) => (
            <ConfigRenderer
              // key={config.uuid}
              key={index}
              config={config}
              isEdit={editViews[index]}
              setEditView={setEditView}
              getString={getString}
              index={index}
              updateFreeze={updateFreeze}
              formikProps={formikProps}
              entityConfigs={entityConfigs}
              resources={resources}
              fieldsVisibility={fieldsVisibility}
              onDeleteRule={onDeleteRule}
              isReadOnly={isReadOnly}
            />
          ))
        }}
      </Formik>
      <Button
        minimal
        withoutBoxShadow
        intent="primary"
        text="Add rule"
        icon="plus"
        onClick={onAddRule}
        disabled={isReadOnly}
        className={css.addNewRuleButton}
      />
    </>
  )
}

interface FreezeStudioConfigSectionProps {
  onBack: () => void
  onNext: () => void
  resources: ResourcesInterface
}

export const FreezeStudioConfigSection: React.FC<FreezeStudioConfigSectionProps> = ({ onNext, onBack, resources }) => {
  const { getString } = useStrings()
  const {
    state: { freezeObj },
    updateFreeze,
    freezeWindowLevel,
    isReadOnly
  } = React.useContext(FreezeWindowContext)

  const fieldsVisibility: FieldVisibility = React.useMemo(() => {
    return getFieldsVisibility(freezeWindowLevel)
  }, [freezeWindowLevel])

  const entityConfigs = freezeObj?.entityConfigs || []

  return (
    <Container padding={{ top: 'small', right: 'xxlarge', bottom: 'xxlarge', left: 'xxlarge' }}>
      <Heading color={Color.BLACK} level={3} style={{ fontWeight: 600, fontSize: '16px', lineHeight: '24px' }}>
        {getString('freezeWindows.freezeStudio.freezeConfiguration')}
      </Heading>
      <Card className={css.sectionCard}>
        <Heading color={Color.GREY_700} level={4} style={{ fontWeight: 600, fontSize: '14px', lineHeight: '24px' }}>
          {getString('freezeWindows.freezeStudio.defineResources')}
        </Heading>
        <ConfigsSection
          entityConfigs={entityConfigs as EntityConfig[]}
          getString={getString}
          updateFreeze={updateFreeze}
          resources={resources}
          fieldsVisibility={fieldsVisibility}
          isReadOnly={isReadOnly}
        />
      </Card>
      <Layout.Horizontal spacing="small" margin={{ top: 'xxlarge' }}>
        <Button
          margin={{ top: 'medium' }}
          icon="chevron-left"
          onClick={onBack}
          variation={ButtonVariation.SECONDARY}
          text={getString('back')}
        />
        <Button
          margin={{ top: 'medium' }}
          rightIcon="chevron-right"
          onClick={onNext}
          variation={ButtonVariation.PRIMARY}
          text={getString('continue')}
        />
      </Layout.Horizontal>
    </Container>
  )
}
