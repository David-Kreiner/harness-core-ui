/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { SelectOption } from '@wings-software/uicore'
import { FormInput, Heading } from '@harness/uicore'
import { Color } from '@harness/design-system'
import type { UseStringsReturn } from 'framework/strings'
import { EntityType, FIELD_KEYS, FreezeWindowLevels, ResourcesInterface, EnvironmentType } from '@freeze-windows/types'
import { allProjectsObj, getEnvTypeMap, isAllOptionSelected } from './FreezeWindowStudioUtil'

const All = 'All'
const Equals = 'Equals'
const NotEquals = 'NotEquals'

interface EnvTypeRendererProps {
  getString: UseStringsReturn['getString']
  name: string
}

export const EnvironmentTypeRenderer = ({ getString, name }: EnvTypeRendererProps) => {
  const envTypeMap = getEnvTypeMap(getString)
  const [envTypes] = React.useState<SelectOption[]>([
    { label: envTypeMap[EnvironmentType.All], value: All },
    { label: envTypeMap[EnvironmentType.PROD], value: EnvironmentType.PROD },
    { label: envTypeMap[EnvironmentType.NON_PROD], value: EnvironmentType.NON_PROD }
  ])

  return <FormInput.Select name={name} items={envTypes} label={getString('envType')} style={{ width: '400px' }} />
}

interface ServiceFieldRendererPropsInterface {
  getString: UseStringsReturn['getString']
  isDisabled: boolean
  name: string
  services: SelectOption[]
}
export const ServiceFieldRenderer: React.FC<ServiceFieldRendererPropsInterface> = ({
  getString,
  isDisabled,
  name,
  services
}) => {
  const [disabledItems] = React.useState<SelectOption[]>([{ label: getString('common.allServices'), value: All }])
  if (isDisabled) {
    return (
      <FormInput.Select
        name={name}
        items={disabledItems}
        disabled={isDisabled}
        placeholder={disabledItems[0].label}
        label={getString('services')}
        style={{ width: '400px' }}
      />
    )
  }
  return (
    <FormInput.MultiSelect
      style={{ width: '400px' }}
      name={name}
      items={services}
      label={getString('services')}
      // onChange={(selected?: SelectOption[]) => {}}
    />
  )
}

const getOrgNameKeys = (namePrefix: string) => {
  const orgFieldName = `${namePrefix}.${FIELD_KEYS.Org}`
  const orgCheckBoxName = `${namePrefix}.${FIELD_KEYS.ExcludeOrgCheckbox}`
  const excludeOrgName = `${namePrefix}.${FIELD_KEYS.ExcludeOrg}`
  return { orgFieldName, orgCheckBoxName, excludeOrgName }
}

const getProjNameKeys = (namePrefix: string) => {
  const projFieldName = `${namePrefix}.${FIELD_KEYS.Proj}`
  const projCheckBoxName = `${namePrefix}.${FIELD_KEYS.ExcludeProjCheckbox}`
  const excludeProjName = `${namePrefix}.${FIELD_KEYS.ExcludeProj}`
  return { projFieldName, projCheckBoxName, excludeProjName }
}

interface OrganizationfieldPropsInterface {
  getString: UseStringsReturn['getString']
  namePrefix: string
  organizations: SelectOption[]
  values: any
  setFieldValue: any
}

export const Organizationfield: React.FC<OrganizationfieldPropsInterface> = ({
  getString,
  namePrefix,
  organizations,
  values,
  setFieldValue
}) => {
  const orgValue = values[FIELD_KEYS.Org]
  const excludeOrgCheckboxValue = values[FIELD_KEYS.ExcludeOrgCheckbox]
  const isCheckBoxEnabled = isAllOptionSelected(orgValue) && orgValue?.length === 1
  const { orgFieldName, orgCheckBoxName, excludeOrgName } = getOrgNameKeys(namePrefix)
  const { projFieldName, projCheckBoxName, excludeProjName } = getProjNameKeys(namePrefix)

  const [allOrgs, setAllOrgs] = React.useState<SelectOption[]>([])
  React.useEffect(() => {
    if (organizations.length) {
      setAllOrgs([{ label: 'All Organizations', value: All }, ...organizations])
    }
  }, [organizations])
  return (
    <>
      <FormInput.MultiSelect
        name={orgFieldName}
        items={allOrgs}
        label={getString('orgLabel')}
        onChange={(selected?: SelectOption[]) => {
          const isAllSelected = isAllOptionSelected(selected)
          const isMultiSelected = (selected || []).length > 1

          // Only All Orgs is selected
          if (isAllSelected && !isMultiSelected) {
            // set projects fields
            setFieldValue(projFieldName, [allProjectsObj(getString)])
            setFieldValue(projCheckBoxName, false)
            setFieldValue(excludeProjName, undefined)
          }

          if (isMultiSelected) {
            // Set org field
            setFieldValue(orgCheckBoxName, false)
            setFieldValue(excludeOrgName, undefined)
            // Set Project field
            setFieldValue(projFieldName, [allProjectsObj(getString)])
            setFieldValue(projCheckBoxName, false)
            setFieldValue(excludeProjName, undefined)
          }
        }}
      />

      <FormInput.CheckBox
        name={orgCheckBoxName}
        label={getString('freezeWindows.freezeStudio.excludeOrgs')}
        disabled={!isCheckBoxEnabled}
        onChange={() => {
          setFieldValue(excludeOrgName, undefined)
        }}
      />

      {isCheckBoxEnabled && excludeOrgCheckboxValue ? (
        <FormInput.MultiSelect name={excludeOrgName} items={organizations} style={{ marginLeft: '24px' }} />
      ) : null}
    </>
  )
}

interface ProjectFieldPropsInterface {
  getString: UseStringsReturn['getString']
  namePrefix: string
  resources: ResourcesInterface
  values: any
  setFieldValue: any
}
export const ProjectField: React.FC<ProjectFieldPropsInterface> = ({
  getString,
  namePrefix,
  resources,
  values,
  setFieldValue
}) => {
  const { projects, freezeWindowLevel } = resources
  const orgValue = values[FIELD_KEYS.Org]
  const isAccLevel = freezeWindowLevel === FreezeWindowLevels.ACCOUNT
  const isOrgValueMultiselected = isAccLevel ? orgValue?.length > 1 : false
  const isOrgValueAll = isAccLevel ? isAllOptionSelected(orgValue) : false
  const projValue = values[FIELD_KEYS.Proj]
  const excludeProjValue = values[FIELD_KEYS.ExcludeProjCheckbox]
  const isCheckBoxEnabled = isAllOptionSelected(projValue) && projValue?.length === 1
  const { projFieldName, projCheckBoxName, excludeProjName } = getProjNameKeys(namePrefix)
  const [allProj, setAllProj] = React.useState<SelectOption[]>([])

  React.useEffect(() => {
    if (isOrgValueAll || isOrgValueMultiselected || projects?.length === 0) {
      setAllProj([allProjectsObj(getString)])
    } else if (projects?.length) {
      setAllProj([allProjectsObj(getString), ...projects])
    }
  }, [projects, isOrgValueAll])
  return (
    <>
      <FormInput.MultiSelect
        name={projFieldName}
        items={allProj}
        label={getString('projectsText')}
        disabled={isOrgValueAll}
        // placeholder="All Projects"
        onChange={(selected?: SelectOption[]) => {
          const isAllSelected = isAllOptionSelected(selected)
          const isMultiSelected = (selected || []).length > 1
          if (!isAllSelected || isMultiSelected) {
            setFieldValue(projCheckBoxName, false)
            setFieldValue(excludeProjName, undefined)
          }
        }}
      />

      <FormInput.CheckBox
        name={projCheckBoxName}
        label={getString('freezeWindows.freezeStudio.excludeProjects')}
        disabled={!isCheckBoxEnabled || isOrgValueAll}
        onChange={() => {
          setFieldValue(excludeProjName, undefined)
        }}
      />

      {isCheckBoxEnabled && excludeProjValue ? (
        <FormInput.MultiSelect
          disabled={isOrgValueAll}
          name={excludeProjName}
          items={projects}
          style={{ marginLeft: '24px' }}
        />
      ) : null}
    </>
  )
}

const renderKeyValue = (key: string, value?: string) => {
  return (
    <div>
      <span>{key}</span>: <span>{value}</span>
    </div>
  )
}

interface OrgFieldViewModePropsInterface {
  data?: EntityType
  getString: UseStringsReturn['getString']
}
export const OrgFieldViewMode: React.FC<OrgFieldViewModePropsInterface> = ({ data, getString }) => {
  if (!data) return null
  const { filterType, entityRefs } = data
  let value = 'All Organizations'
  if (filterType === All) {
    value = 'All Organizations'
  } else if (filterType === Equals) {
    value = (entityRefs as string[])?.join(', ')
  } else if (filterType === NotEquals) {
    value = `All Organizations except ${entityRefs?.join(', ')}`
  }
  return renderKeyValue(getString('orgLabel'), value)
}

interface ProjectFieldViewModePropsInterface {
  data?: EntityType
  getString: UseStringsReturn['getString']
}
export const ProjectFieldViewMode: React.FC<ProjectFieldViewModePropsInterface> = ({ data, getString }) => {
  if (!data) return null
  const { filterType, entityRefs } = data
  let value = 'All Projects'
  if (filterType === All) {
    value = 'All Projects'
  } else if (filterType === Equals) {
    value = (entityRefs as string[])?.join(', ')
  } else if (filterType === NotEquals) {
    value = `All Projects except ${entityRefs?.join(', ')}`
  }
  return renderKeyValue(getString('projectsText'), value)
}

export const ServicesAndEnvRenderer: React.FC<{
  freezeWindowLevel: FreezeWindowLevels
  envType: EnvironmentType
  getString: UseStringsReturn['getString']
}> = ({ freezeWindowLevel, getString, envType }) => {
  const envTypeMap = getEnvTypeMap(getString)

  return (
    <Heading
      level={3}
      style={{ fontWeight: 600, fontSize: '12px', lineHeight: '18px', marginTop: '12px' }}
      color={Color.GREY_600}
    >
      {freezeWindowLevel === FreezeWindowLevels.PROJECT ? (
        <span style={{ marginRight: '8px', paddingRight: '8px', borderRight: '0.5px solid' }}>
          {getString('common.allServices')}
        </span>
      ) : null}
      {`${getString('envType')}: ${envTypeMap[envType as EnvironmentType]}`}
    </Heading>
  )
}