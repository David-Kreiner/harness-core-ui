/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import noop from 'lodash-es/noop'
import { parse } from 'yaml'

import { VisualYamlSelectedView as SelectedView } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { useLocalStorage } from '@common/hooks'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useGetFreeze } from 'services/cd-ng'
import { FreezeWindowLevels, WindowPathProps, FreezeNotificationRules } from '@freeze-windows/types'
import { FreezeWindowContextActions, DrawerTypes } from './FreezeWidowActions'
import { initialState, FreezeWindowReducerState, FreezeReducer, DefaultFreezeId } from './FreezeWindowReducer'

export interface FreezeWindowContextInterface {
  state: FreezeWindowReducerState
  view: string
  drawerType?: string
  setDrawerType: (drawerType?: DrawerTypes) => void
  notificationRules?: FreezeNotificationRules[]
  isReadOnly: boolean
  setView: (view: SelectedView) => void
  setYamlHandler: (yamlHandler: YamlBuilderHandlerBinding) => void
  updateYamlView: (isYamlEditable: boolean) => void
  updateFreeze: (response: any) => void
  freezeWindowLevel: FreezeWindowLevels
  loadingFreezeObj: boolean
  isUpdatingFreeze: boolean
  refetchFreezeObj: () => void
  freezeObjError?: any
}

export const FreezeWindowContext = React.createContext<FreezeWindowContextInterface>({
  state: initialState,
  isReadOnly: false,
  view: SelectedView.VISUAL,
  drawerType: '',
  setDrawerType: noop,
  notificationRules: [],
  setView: noop,
  setYamlHandler: noop,
  updateYamlView: noop,
  updateFreeze: noop,
  freezeWindowLevel: FreezeWindowLevels.ACCOUNT,
  loadingFreezeObj: false,
  isUpdatingFreeze: false,
  refetchFreezeObj: noop
})

const getFreezeWindowLevel = ({ projectIdentifier, orgIdentifier }: ProjectPathProps) => {
  if (projectIdentifier) return FreezeWindowLevels.PROJECT
  if (orgIdentifier) return FreezeWindowLevels.ORG
  return FreezeWindowLevels.ACCOUNT
}

export const FreezeWindowProvider: React.FC = ({ children }) => {
  const isInvalidYAML = false // state.entityValidityDetails.valid === false
  const [view, setView] = useLocalStorage<SelectedView>(
    'freeze_studio_view',
    isInvalidYAML ? SelectedView.YAML : SelectedView.VISUAL
  )
  const [drawerType, setDrawerType] = React.useState<DrawerTypes>()
  const { accountId, projectIdentifier, orgIdentifier, windowIdentifier } = useParams<WindowPathProps>()
  const [freezeWindowLevel, setFreezeWindowLevel] = React.useState<FreezeWindowLevels>(FreezeWindowLevels.ORG)
  const [isUpdatingFreeze, setIsUpdatingFreeze] = React.useState<boolean>(false)

  React.useEffect(() => {
    const _freezeWindowLevel = getFreezeWindowLevel({ accountId, projectIdentifier, orgIdentifier })
    setFreezeWindowLevel(_freezeWindowLevel)
    if (_freezeWindowLevel === FreezeWindowLevels.PROJECT) {
      updateFreeze({ orgIdentifier, projectIdentifier })
    }
    if (_freezeWindowLevel === FreezeWindowLevels.ORG) {
      updateFreeze({ orgIdentifier })
    }
  }, [accountId, projectIdentifier, orgIdentifier])

  const [state, dispatch] = React.useReducer(FreezeReducer, initialState)
  const updateYamlView = React.useCallback((isYamlEditable: boolean) => {
    dispatch(FreezeWindowContextActions.updateYamlView({ isYamlEditable }))
  }, [])

  const updateFreeze = React.useCallback(response => {
    dispatch(FreezeWindowContextActions.updateFreeze(response))
  }, [])

  const setYamlHandler = React.useCallback((yamlHandler: YamlBuilderHandlerBinding) => {
    dispatch(FreezeWindowContextActions.setYamlHandler({ yamlHandler }))
  }, [])

  const {
    data: freezeObjData,
    error: freezeObjError,
    loading: loadingFreezeObj,
    refetch: refetchFreezeObj
  } = useGetFreeze({
    freezeIdentifier: windowIdentifier,
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier },
    lazy: true
  })

  React.useEffect(() => {
    if (windowIdentifier !== DefaultFreezeId) {
      refetchFreezeObj()
    }
  }, [windowIdentifier, accountId, orgIdentifier, projectIdentifier])

  React.useEffect(() => {
    if (loadingFreezeObj) {
      setIsUpdatingFreeze(true)
      updateYamlView(false)
    }
    if (!loadingFreezeObj && !freezeObjError && freezeObjData?.data?.yaml) {
      const freezeObj = parse(freezeObjData?.data?.yaml)?.freeze
      updateFreeze({ ...freezeObj, oldFreezeObj: { ...freezeObj } })
      setIsUpdatingFreeze(false)
    }
  }, [loadingFreezeObj])

  const [canEdit] = usePermission({
    resourceScope: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },

    resource: {
      resourceType: ResourceType.DEPLOYMENTFREEZE
    },
    permissions: [PermissionIdentifier.MANAGE_DEPLOYMENT_FREEZE]
  })

  return (
    <FreezeWindowContext.Provider
      value={{
        state,
        view,
        setView,
        updateYamlView,
        updateFreeze,
        setYamlHandler,
        freezeWindowLevel,
        loadingFreezeObj,
        isUpdatingFreeze,
        freezeObjError,
        refetchFreezeObj,
        drawerType,
        setDrawerType,
        isReadOnly: !canEdit
      }}
    >
      {children}
    </FreezeWindowContext.Provider>
  )
}

export const useFreezeWindowContext = () => useContext(FreezeWindowContext)
