/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { clone, isEqual, omit } from 'lodash-es'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import { ActionReturnType, FreezeWindowActions } from './FreezeWidowActions'

export const DefaultFreezeId = '-1'

export const DefaultFreeze = {
  name: '',
  identifier: DefaultFreezeId,
  entityConfigs: [],
  status: 'Disabled'
}

export interface FreezeWindowReducerState {
  isYamlEditable: boolean
  freezeObj: Record<string, unknown>
  oldFreezeObj: Record<string, unknown>
  isUpdated: boolean | undefined
  yamlHandler?: YamlBuilderHandlerBinding
}
export const initialState: FreezeWindowReducerState = {
  isYamlEditable: false,
  freezeObj: { ...DefaultFreeze },
  oldFreezeObj: { ...DefaultFreeze },
  isUpdated: false
}

export const FreezeReducer = (state: FreezeWindowReducerState, data: ActionReturnType): FreezeWindowReducerState => {
  const { type, response } = data
  switch (type) {
    case FreezeWindowActions.SetYAMLViewEditable: {
      return {
        ...state,
        isYamlEditable: response?.isYamlEditable as boolean
      }
    }
    case FreezeWindowActions.UpdateFreeze: {
      return {
        ...state,
        isUpdated: response?.oldFreezeObj
          ? false
          : !isEqual(state.oldFreezeObj, { ...state.freezeObj, ...omit(response, 'oldFreezeObj') }),
        oldFreezeObj: response?.oldFreezeObj ? response.oldFreezeObj : state.oldFreezeObj,
        freezeObj: (response
          ? clone({
              ...state.freezeObj,
              ...omit(response, 'oldFreezeObj'),
              status: response?.status || state?.freezeObj?.status
            })
          : state.freezeObj) as Record<string, unknown>
      }
    }
    case FreezeWindowActions.Success: {
      return { ...state, ...response } as FreezeWindowReducerState
    }
    case FreezeWindowActions.SetYamlHandler: {
      return {
        ...state,
        yamlHandler: data.response?.yamlHandler
      }
    }
    default:
      return state
  }
}
