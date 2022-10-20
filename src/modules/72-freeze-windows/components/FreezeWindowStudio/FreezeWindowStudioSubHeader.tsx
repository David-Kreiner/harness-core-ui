/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Dialog, Switch } from '@blueprintjs/core'
import {
  Button,
  ButtonVariation,
  Container,
  Layout,
  Text,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color, FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import { FreezeWindowContext } from '@freeze-windows/components/FreezeWindowStudio/FreezeWindowContext/FreezeWindowContext'
import { DefaultFreezeId } from '@freeze-windows/components/FreezeWindowStudio/FreezeWindowContext/FreezeWindowReducer'
import type { WindowPathProps } from '@freeze-windows/types'
import { FreezeWindowStudioSubHeaderRightView } from './FreezeWindowStudioSubHeaderRightView'
import { CreateNewFreezeWindow } from './CreateNewFreezeWindow'
import css from './FreezeWindowStudio.module.scss'

interface FreezeWindowStudioSubHeaderProps {
  onViewChange(newView: SelectedView): boolean
}

export const FreezeWindowStudioSubHeader: React.FC<FreezeWindowStudioSubHeaderProps> = ({ onViewChange }) => {
  const { accountId, projectIdentifier, orgIdentifier, module, windowIdentifier } = useParams<
    ModulePathParams & WindowPathProps
  >()
  const { getString } = useStrings()
  const {
    state: { freezeObj },
    updateFreeze,
    isReadOnly
  } = React.useContext(FreezeWindowContext)
  const history = useHistory()
  const { view } = React.useContext(FreezeWindowContext)
  const isYaml = view === SelectedView.YAML
  const isVisualViewDisabled = false
  const navigateToFreezeWindows = React.useCallback(() => {
    history.push(routes.toFreezeWindows({ orgIdentifier, projectIdentifier, accountId, module }))
  }, [history, routes.toFreezeWindows, orgIdentifier, projectIdentifier, accountId, module])

  const [showConfigModal, hideConfigModal] = useModalHook(() => {
    const onCloseCreate = (identifier = freezeObj.identifier) => {
      if (identifier === DefaultFreezeId) {
        navigateToFreezeWindows()
      }

      hideConfigModal()
    }

    return (
      <Dialog
        enforceFocus={false}
        isOpen={true}
        onClose={() => onCloseCreate()}
        title={
          <Container padding={{ left: 'xlarge', top: 'xlarge' }}>
            <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_800}>
              {freezeObj.identifier === DefaultFreezeId
                ? getString('freezeWindows.freezeWindowsPage.newFreezeWindow')
                : getString('freezeWindows.freezeWindowsPage.editFreezeWindow')}
            </Text>
          </Container>
        }
      >
        <CreateNewFreezeWindow onClose={onCloseCreate} updateFreeze={updateFreeze} freezeObj={freezeObj} />
      </Dialog>
    )
  }, [windowIdentifier, freezeObj.identifier, freezeObj.name, freezeObj.description, freezeObj.tags])

  React.useEffect(() => {
    if (windowIdentifier === DefaultFreezeId) {
      hideConfigModal()
      showConfigModal()
    }
  }, [windowIdentifier, showConfigModal])

  return (
    <Container
      className={css.subHeader}
      height={49}
      padding={{ right: 'xlarge', left: 'xlarge' }}
      border={{ bottom: true, color: Color.GREY_200 }}
      background={Color.WHITE}
    >
      <Layout.Horizontal height={'100%'} flex={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Layout.Horizontal className={css.freezeNameContainer} flex={{ alignItems: 'center' }}>
          {isYaml || isReadOnly ? null : (
            <Switch
              aria-label="Toggle freeze"
              onChange={event => {
                const checked = event.currentTarget.checked
                updateFreeze({ status: checked ? 'Enabled' : 'Disabled' })
              }}
              checked={freezeObj?.status === 'Enabled'}
              className={css.freezeToggler}
            />
          )}
          <Text lineClamp={1} className={css.freezeName}>
            {freezeObj.name as string}
          </Text>
          {isYaml || isReadOnly ? null : (
            <Button variation={ButtonVariation.ICON} icon="Edit" onClick={showConfigModal} />
          )}
        </Layout.Horizontal>
        <Container>
          <VisualYamlToggle
            className={css.visualYamlToggle}
            selectedView={isYaml || isVisualViewDisabled ? SelectedView.YAML : SelectedView.VISUAL}
            onChange={nextMode => {
              onViewChange(nextMode)
            }}
            disableToggle={isVisualViewDisabled}
          />
        </Container>
        <FreezeWindowStudioSubHeaderRightView />
      </Layout.Horizontal>
    </Container>
  )
}
