/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import classnames from 'classnames'
import type { SelectOption } from '@wings-software/uicore'
import { FormInput, Heading } from '@harness/uicore'
import { Color } from '@harness/design-system'
import type { UseStringsReturn } from 'framework/strings'
import { EntityType, EnvironmentType, FIELD_KEYS, FreezeWindowLevels, ResourcesInterface } from '@freeze-windows/types'
import { allProjectsObj, getEnvTypeMap, isAllOptionSelected } from './FreezeWindowStudioUtil'
import css from './FreezeWindowStudio.module.scss'

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
  return <FormInput.MultiSelect style={{ width: '400px' }} name={name} items={services} label={getString('services')} />
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
  fetchProjectsForOrgId: (orgId: string) => void
}

export const Organizationfield: React.FC<OrganizationfieldPropsInterface> = ({
  getString,
  namePrefix,
  organizations,
  values,
  setFieldValue,
  fetchProjectsForOrgId
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

  React.useEffect(() => {
    const isAllOrgSelected = isAllOptionSelected(orgValue)
    if (!isAllOrgSelected && orgValue?.length === 1) {
      fetchProjectsForOrgId(orgValue[0]?.value as string)
    }
  }, [])

  return (
    <>
      <FormInput.MultiSelect
        name={orgFieldName}
        items={allOrgs}
        label={getString('orgLabel')}
        onChange={(selected?: SelectOption[]) => {
          const isAllSelected = isAllOptionSelected(selected)
          const selectedLen = (selected || []).length
          const isMultiSelected = selectedLen > 1
          const isSingleSelected = selectedLen === 1
          const isEmptyOrg = selectedLen === 0

          // Only All Orgs is selected
          if ((isAllSelected && !isMultiSelected) || isEmptyOrg) {
            // set projects fields
            setFieldValue(projFieldName, [allProjectsObj(getString)])
            setFieldValue(projCheckBoxName, false)
            setFieldValue(excludeProjName, undefined)
          }

          if (isMultiSelected || isEmptyOrg) {
            // Set org field
            setFieldValue(orgCheckBoxName, false)
            setFieldValue(excludeOrgName, undefined)
            // Set Project field
            setFieldValue(projFieldName, [allProjectsObj(getString)])
            setFieldValue(projCheckBoxName, false)
            setFieldValue(excludeProjName, undefined)
          }

          if (!isAllSelected && isSingleSelected) {
            fetchProjectsForOrgId(selected?.[0]?.value as string)
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
  const [excludeProjects, setExcludeProjects] = React.useState(projects)

  const orgValue = values[FIELD_KEYS.Org]
  const isAccLevel = freezeWindowLevel === FreezeWindowLevels.ACCOUNT
  const isOrgValueAll = isAccLevel ? isAllOptionSelected(orgValue) : false
  const isSingleOrgValue = isAccLevel ? orgValue?.length === 1 && !isOrgValueAll : true
  const projValue = values[FIELD_KEYS.Proj]
  const excludeProjValue = values[FIELD_KEYS.ExcludeProjCheckbox]
  const isCheckBoxEnabled = isAllOptionSelected(projValue) && projValue?.length === 1
  const { projFieldName, projCheckBoxName, excludeProjName } = getProjNameKeys(namePrefix)
  const [allProj, setAllProj] = React.useState<SelectOption[]>([])

  React.useEffect(() => {
    if (isAccLevel) {
      if (isSingleOrgValue) {
        const orgId = orgValue[0].value
        const _projects = resources.projectsByOrgId?.[orgId]?.projects || []
        setAllProj([allProjectsObj(getString), ..._projects])
        setExcludeProjects(_projects)
      } else {
        setAllProj([allProjectsObj(getString)])
        setExcludeProjects([])
      }
    } else {
      if (!isSingleOrgValue || projects?.length === 0) {
        setAllProj([allProjectsObj(getString)])
        setExcludeProjects([])
      } else if (projects?.length) {
        setAllProj([allProjectsObj(getString), ...projects])
        setExcludeProjects(projects)
      }
    }
  }, [projects, isOrgValueAll, isSingleOrgValue, resources.projectsByOrgId])
  return (
    <>
      <FormInput.MultiSelect
        name={projFieldName}
        items={allProj}
        label={getString('projectsText')}
        // enabled only if org value is single select, and not All Organizations
        disabled={!isSingleOrgValue}
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
        disabled={!isCheckBoxEnabled || !isSingleOrgValue}
        onChange={() => {
          setFieldValue(excludeProjName, undefined)
        }}
      />

      {isCheckBoxEnabled && excludeProjValue ? (
        <FormInput.MultiSelect
          disabled={isOrgValueAll}
          name={excludeProjName}
          items={excludeProjects}
          style={{ marginLeft: '24px' }}
        />
      ) : null}
    </>
  )
}

export const ServicesAndEnvRenderer: React.FC<{
  freezeWindowLevel: FreezeWindowLevels
  envType: EnvironmentType
  getString: UseStringsReturn['getString']
}> = ({ freezeWindowLevel, getString, envType }) => {
  const envTypeMap = getEnvTypeMap(getString)

  return (
    <Heading level={3} style={{ fontWeight: 600, fontSize: '12px', lineHeight: '18px' }} color={Color.GREY_600}>
      {freezeWindowLevel !== FreezeWindowLevels.PROJECT ? (
        <span style={{ marginRight: '8px', paddingRight: '8px', borderRight: '0.5px solid' }}>
          {getString('common.allServices')}
        </span>
      ) : null}
      {`${getString('envType')}: ${envTypeMap[envType as EnvironmentType]}`}
    </Heading>
  )
}

interface OrgProjAndServiceRendererPropsInterface {
  entitiesMap: Record<FIELD_KEYS, EntityType>
  freezeWindowLevel: FreezeWindowLevels
  resources: ResourcesInterface
  getString: UseStringsReturn['getString']
}

const ProjectLevelRender: React.FC<OrgProjAndServiceRendererPropsInterface> = ({
  entitiesMap,
  resources,
  getString
}) => {
  const serviceEntityMap = entitiesMap[FIELD_KEYS.Service]
  const filterType = serviceEntityMap?.filterType || All
  const serviceMap = resources.servicesMap
  const selectedServiceIds = serviceEntityMap?.entityRefs || []
  let serviceNodes = null
  if (filterType === All || selectedServiceIds.length === 0) {
    serviceNodes = <span className={css.badge}>{serviceMap[All]?.label}</span>
  } else {
    serviceNodes = selectedServiceIds.map(svcId => {
      return (
        <span key={svcId} className={css.badge}>
          {serviceMap[svcId]?.label || svcId}
        </span>
      )
    })
  }

  return (
    <div className={css.viewRowNode}>
      <span>{getString('services')}:</span> {serviceNodes}
    </div>
  )
}

const AccountLevelRenderer: React.FC<OrgProjAndServiceRendererPropsInterface> = ({
  entitiesMap,
  resources,
  getString
}) => {
  const entityMap = entitiesMap[FIELD_KEYS.Org]
  const filterType = entityMap?.filterType || All
  const resourcesMap = resources.orgsMap
  const projResourcesMap = resources.projectsMap
  const selectedItemIds = entityMap?.entityRefs || []
  if (filterType === All || selectedItemIds.length === 0) {
    return (
      <>
        <div className={css.viewRowNode}>
          <span>{getString('orgsText')}:</span> <span className={css.badge}>{resourcesMap[All]?.label}</span>
        </div>
        <div className={css.viewRowNode}>
          <span>{getString('projectsText')}:</span> <span className={css.badge}>{projResourcesMap[All]?.label}</span>
        </div>
      </>
    )
  } else if (filterType === NotEquals) {
    const nodes = selectedItemIds.map(itemId => {
      return (
        <span key={itemId} className={css.badge}>
          {resourcesMap[itemId]?.label || itemId}
        </span>
      )
    })
    return (
      <>
        <div className={classnames(css.viewRowNode, css.marginSmaller)}>
          <span>{getString('orgsText')}:</span> <span className={css.badge}>{resourcesMap[All]?.label}</span>
        </div>
        <div className={css.viewRowNode}>
          <span>
            {getString(
              selectedItemIds.length === 1
                ? 'freezeWindows.freezeStudio.excludeFollowingOrg'
                : 'freezeWindows.freezeStudio.excludeFollowingOrgs'
            )}
            :
          </span>{' '}
          {nodes}
        </div>
        <div className={css.viewRowNode}>
          <span>{getString('projectsText')}:</span> <span className={css.badge}>{projResourcesMap[All]?.label}</span>
        </div>
      </>
    )
  } else if (filterType === Equals) {
    const isOrgMultiSelected = selectedItemIds.length > 1
    const nodes = selectedItemIds.map(itemId => {
      return (
        <span key={itemId} className={css.badge}>
          {resourcesMap[itemId]?.label || itemId}
        </span>
      )
    })
    // Render selected orgs and render "All Projects" test
    if (isOrgMultiSelected) {
      return (
        <>
          <div className={css.viewRowNode}>
            <span>{getString('orgsText')}:</span> {nodes}
          </div>
          <div className={css.viewRowNode}>
            <span>{getString('projectsText')}:</span> <span className={css.badge}>{projResourcesMap[All]?.label}</span>
          </div>
        </>
      )
    } else {
      return (
        <>
          <div className={css.viewRowNode}>
            <span>{getString('orgsText')}:</span> {nodes}
          </div>
          <OrgLevelRenderer
            entitiesMap={entitiesMap}
            projectsMap={resources.projectsByOrgId[selectedItemIds[0]]?.projectsMap || {}}
            getString={getString}
          />
        </>
      )
    }
  }
  return <div></div>
}

interface OrgRendererPropsInterface {
  entitiesMap: Record<FIELD_KEYS, EntityType>
  projectsMap: Record<string, SelectOption>
  getString: UseStringsReturn['getString']
}

const OrgLevelRenderer: React.FC<OrgRendererPropsInterface> = ({ entitiesMap, projectsMap, getString }) => {
  const entityMap = entitiesMap[FIELD_KEYS.Proj]
  const filterType = entityMap?.filterType || All
  const selectedItemIds = entityMap?.entityRefs || []
  let nodesEl = null
  if (filterType === All || selectedItemIds.length === 0) {
    const nodes = <span className={css.badge}>{allProjectsObj(getString).label}</span>
    nodesEl = (
      <>
        <span>{getString('projectsText')}:</span> {nodes}
      </>
    )
  } else if (filterType === NotEquals) {
    const nodes = selectedItemIds.map(itemId => {
      return (
        <span key={itemId} className={css.badge}>
          {projectsMap[itemId]?.label || itemId}
        </span>
      )
    })

    return (
      <>
        <div className={classnames(css.viewRowNode, css.marginSmaller)}>
          <span>{getString('projectsText')}:</span>{' '}
          <span className={css.badge}>{allProjectsObj(getString)?.label}</span>
        </div>
        <div className={css.viewRowNode}>
          <span>
            {getString(
              selectedItemIds.length === 1
                ? 'freezeWindows.freezeStudio.excludeFollowingProject'
                : 'freezeWindows.freezeStudio.excludeFollowingProjects'
            )}
            :
          </span>{' '}
          {nodes}
        </div>
      </>
    )
  } else if (filterType === Equals) {
    const nodes = selectedItemIds.map(itemId => {
      return (
        <span key={itemId} className={css.badge}>
          {projectsMap[itemId]?.label || itemId}
        </span>
      )
    })
    nodesEl = (
      <>
        <span>{getString('projectsText')}:</span> {nodes}
      </>
    )
  }

  return <div className={css.viewRowNode}>{nodesEl}</div>
}

export const OrgProjAndServiceRenderer: React.FC<OrgProjAndServiceRendererPropsInterface> = ({
  entitiesMap,
  freezeWindowLevel,
  resources,
  getString
}) => {
  if (freezeWindowLevel === FreezeWindowLevels.PROJECT) {
    return (
      <ProjectLevelRender
        entitiesMap={entitiesMap}
        resources={resources}
        getString={getString}
        freezeWindowLevel={freezeWindowLevel}
      />
    )
  }
  if (freezeWindowLevel === FreezeWindowLevels.ORG) {
    return (
      <OrgLevelRenderer entitiesMap={entitiesMap} projectsMap={resources.projectsMap || {}} getString={getString} />
    )
  }
  if (freezeWindowLevel === FreezeWindowLevels.ACCOUNT) {
    return (
      <AccountLevelRenderer
        entitiesMap={entitiesMap}
        resources={resources}
        getString={getString}
        freezeWindowLevel={freezeWindowLevel}
      />
    )
  }
  return <div></div>
}
