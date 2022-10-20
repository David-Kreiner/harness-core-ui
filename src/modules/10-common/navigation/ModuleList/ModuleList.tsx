/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import cx from 'classnames'
import { Link } from 'react-router-dom'
import { Classes, Drawer, Position, PopoverInteractionKind } from '@blueprintjs/core'
import { Color, Container, Icon, Layout, Text, Popover } from '@harness/uicore'
import { String } from 'framework/strings'
import { moduleToModuleNameMapping } from 'framework/types/ModuleName'
import useNavModuleInfo, {
  GroupConfig,
  moduleGroupConfig,
  NavModuleName,
  useNavModuleInfoMap
} from '@common/hooks/useNavModuleInfo'
import { useModuleInfo } from '@common/hooks/useModuleInfo'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import NavModule from './NavModule/NavModule'
import ModuleConfigurationScreen from '../ModuleConfigurationScreen/ModuleConfigurationScreen'
import {
  ModulesPreferenceStoreData,
  MODULES_CONFIG_PREFERENCE_STORE_KEY
} from '../ModuleConfigurationScreen/ModuleSortableList/ModuleSortableList'
import css from './ModuleList.module.scss'

interface ModuleListProps {
  isOpen: boolean
  close: () => void
  usePortal?: boolean
  onConfigIconClick?: () => void
}

interface ModuleTooltipProps {
  activeModule?: NavModuleName
  handleClick: (module: NavModuleName) => void
}

interface ItemProps {
  data: NavModuleName
  tooltipProps: ModuleTooltipProps
  onModuleClick: (module: NavModuleName) => void
}

interface GroupProps {
  data: GroupConfig
  tooltipProps: ModuleTooltipProps
  onModuleClick: (module: NavModuleName) => void
}

const Item: React.FC<ItemProps> = ({ data, tooltipProps, onModuleClick }) => {
  const { homePageUrl, shouldVisible } = useNavModuleInfo(data)
  const { module } = useModuleInfo()
  const currentModule = module ? moduleToModuleNameMapping[module] : undefined

  if (!shouldVisible) {
    return null
  }

  return (
    <Link to={homePageUrl}>
      <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
        <NavModule module={data} active={currentModule === data} onClick={onModuleClick} />
        <Icon
          name="tooltip-icon"
          padding={'small'}
          margin={{ left: 'small' }}
          color={tooltipProps.activeModule === data ? Color.SUCCESS : undefined}
          size={12}
          className={css.clickable}
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            tooltipProps.handleClick(data)
          }}
        />
      </Layout.Horizontal>
    </Link>
  )
}

const Group: React.FC<GroupProps> = ({ data, tooltipProps, onModuleClick }) => {
  const moduleMap = useNavModuleInfoMap()
  const visibleItems = data.items.filter(module => !!moduleMap[module].shouldVisible)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <Container>
      <Text color={Color.PRIMARY_2} margin={{ bottom: 'large' }} font={{ size: 'small', weight: 'semi-bold' }}>
        <String stringID={data.label} />
      </Text>
      <Layout.Vertical spacing="medium">
        {data.items.map(item => (
          <Item key={item} data={item} tooltipProps={tooltipProps} onModuleClick={onModuleClick} />
        ))}
      </Layout.Vertical>
    </Container>
  )
}

const ModuleList: React.FC<ModuleListProps> = ({ isOpen, close, usePortal = true, onConfigIconClick }) => {
  const [activeModuleCarousel, setActiveModuleCarousel] = useState<NavModuleName | undefined>(undefined)
  const { setPreference: setModuleConfigPreference, preference: { orderedModules = [], selectedModules = [] } = {} } =
    usePreferenceStore<ModulesPreferenceStoreData>(PreferenceScope.USER, MODULES_CONFIG_PREFERENCE_STORE_KEY)

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={() => {
          close()
          setActiveModuleCarousel(undefined)
        }}
        position={Position.LEFT}
        size={Drawer.SIZE_SMALL}
        className={css.modulesList}
        backdropClassName={css.backdrop}
        usePortal={usePortal}
      >
        <div className={css.modulesListContainer}>
          <Container flex={{ alignItems: 'center' }} margin={{ bottom: 'huge' }}>
            <Text font={{ size: 'large', weight: 'bold' }} color={Color.WHITE}>
              <String stringID="common.moduleList.title" />
            </Text>
            <Popover
              content={
                <Text color={Color.WHITE} padding="small">
                  <String stringID="common.moduleConfig.customize" />
                </Text>
              }
              popoverClassName={Classes.DARK}
              interactionKind={PopoverInteractionKind.HOVER}
              position={Position.RIGHT}
            >
              <Icon
                name="customize"
                size={24}
                className={cx(css.blue, css.clickable)}
                padding={'small'}
                onClick={() => {
                  onConfigIconClick?.()
                  setActiveModuleCarousel(undefined)
                }}
              />
            </Popover>
          </Container>
          <Layout.Vertical flex spacing="xxxlarge" data-testId="grouplistContainer">
            {moduleGroupConfig.map(item => (
              <Group
                data={item}
                key={item.label}
                tooltipProps={{
                  handleClick: (module: NavModuleName) => {
                    setActiveModuleCarousel(module)
                  },
                  activeModule: activeModuleCarousel
                }}
                onModuleClick={(module: NavModuleName) => {
                  setModuleConfigPreference({
                    selectedModules:
                      selectedModules.indexOf(module) > -1 ? selectedModules : [...selectedModules, module],
                    orderedModules
                  })
                  close()
                }}
              />
            ))}
          </Layout.Vertical>
        </div>
      </Drawer>
      {activeModuleCarousel ? (
        <ModuleConfigurationScreen
          onClose={() => {
            setActiveModuleCarousel(undefined)
            close()
          }}
          activeModuleIndex={orderedModules.indexOf(activeModuleCarousel)}
          className={css.configScreenWithoutReorder}
          hideReordering
          hideHeader
        />
      ) : null}
    </>
  )
}

export default ModuleList
