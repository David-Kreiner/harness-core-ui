/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, isEmpty, isEqual } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { parse } from 'yaml'
import { ButtonVariation, Tag } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { YamlBuilderMemo } from '@common/components/YAMLBuilder/YamlBuilder'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetFreezeSchema } from 'services/cd-ng'
import { FreezeWindowContext } from '@freeze-windows/context/FreezeWindowContext'
import css from './FreezeWindowStudioBody.module.scss'

const defaultFileName = 'FreezeWindow.yaml'
export const POLL_INTERVAL = 1 * 1000

let Interval: number | undefined

export const FreezeWindowStudioYAMLView = () => {
  const [yamlFileName] = React.useState<string>(defaultFileName)
  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const {
    state: { isYamlEditable, freezeObj },
    isReadOnly,
    isActiveFreeze,
    updateYamlView,
    updateFreeze,
    drawerType,
    setYamlHandler: setYamlHandlerContext
  } = React.useContext(FreezeWindowContext)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const isDrawerOpened = !!drawerType

  React.useEffect(() => {
    if (yamlHandler) {
      setYamlHandlerContext(yamlHandler)
    }
  }, [yamlHandler, setYamlHandlerContext])

  React.useEffect(() => {
    if (yamlHandler && !isDrawerOpened) {
      Interval = window.setInterval(() => {
        try {
          const freezeFromYaml = parse(yamlHandler.getLatestYaml())?.freeze
          const schemaValidationErrorMap = yamlHandler.getYAMLValidationErrorMap()
          const areSchemaValidationErrorsAbsent = !(schemaValidationErrorMap && schemaValidationErrorMap.size > 0)
          if (
            !isEqual(freezeObj, freezeFromYaml) &&
            !isEmpty(freezeFromYaml) &&
            areSchemaValidationErrorsAbsent // Don't update for Invalid Yaml
          ) {
            updateFreeze(freezeFromYaml)
          }
        } catch (e) {
          // console.log(e)
        }
      }, POLL_INTERVAL)
      return () => {
        window.clearInterval(Interval)
      }
    }
  }, [yamlHandler, freezeObj])

  const { data: freezeSchema } = useGetFreezeSchema({
    queryParams: {
      projectIdentifier,
      orgIdentifier,
      scope: getScopeFromDTO({
        accountIdentifier: accountId,
        projectIdentifier,
        orgIdentifier
      }),
      accountIdentifier: accountId
    }
  })

  const _isReadOnly = isReadOnly || !isYamlEditable || isActiveFreeze

  return isDrawerOpened ? null : (
    <div className={css.yamlBuilder}>
      <YamlBuilderMemo
        key={`${isYamlEditable.toString()}_${freezeObj.identifier}`}
        fileName={defaultTo(yamlFileName, defaultFileName)}
        entityType={'Freeze'}
        isReadOnlyMode={_isReadOnly}
        existingJSON={{ freeze: freezeObj }}
        // existingYaml
        bind={setYamlHandler}
        schema={freezeSchema?.data}
        // onExpressionTrigger
        yamlSanityConfig={{ removeEmptyString: false, removeEmptyObject: false, removeEmptyArray: false }}
        height={'calc(100vh - 200px)'}
        width="calc(100vw - 400px)"
        // invocationMap
        onEnableEditMode={() => {
          updateYamlView(true)
        }}
        isEditModeSupported={!isReadOnly || !isActiveFreeze}
      />
      {_isReadOnly ? (
        <div className={css.buttonsWrapper}>
          <Tag>{getString('common.readOnly')}</Tag>
          <RbacButton
            permission={{
              resourceScope: {
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              },
              resource: {
                resourceType: ResourceType.DEPLOYMENTFREEZE,
                resourceIdentifier: freezeObj.identifier as string
              },
              permission: PermissionIdentifier.MANAGE_DEPLOYMENT_FREEZE
            }}
            variation={ButtonVariation.SECONDARY}
            text={getString('common.editYaml')}
            onClick={() => {
              updateYamlView(true)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
