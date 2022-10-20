/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useLayoutEffect } from 'react'
import cx from 'classnames'
import { NavLink as Link, useParams } from 'react-router-dom'
import type { NavLinkProps } from 'react-router-dom'
import { Text, Icon, Layout, Avatar, useToggleOpen, Container, Popover } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Classes, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { String } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'

import paths from '@common/RouteDefinitions'

import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { ResourceCenter } from '@common/components/ResourceCenter/ResourceCenter'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'

import { DEFAULT_MODULES_ORDER, useNavModuleInfoMap } from '@common/hooks/useNavModuleInfo'
import {
  MODULES_CONFIG_PREFERENCE_STORE_KEY,
  ModulesPreferenceStoreData
} from '../ModuleConfigurationScreen/ModuleSortableList/ModuleSortableList'
import ModuleList from '../ModuleList/ModuleList'
import ModuleConfigurationScreen from '../ModuleConfigurationScreen/ModuleConfigurationScreen'

import ModulesContainer from './ModulesContainer/ModulesContainer'
import { moduleToNavItemsMap } from './util'
import css from './MainNav.module.scss'

const commonLinkProps: Partial<NavLinkProps> = {
  activeClassName: css.active,
  className: cx(css.navLink)
}

export default function L1Nav(): React.ReactElement {
  const params = useParams<ProjectPathProps>()
  const { RESOURCE_CENTER_ENABLED, NG_DASHBOARDS, NEW_LEFT_NAVBAR_SETTINGS } = useFeatureFlags()
  const { isOpen: isModuleListOpen, toggle: toggleModuleList, close: closeModuleList } = useToggleOpen(false)
  const { isOpen: isModuleConfigOpen, toggle: toggleModuleConfig, close: closeModuleConfig } = useToggleOpen(false)

  const { currentUserInfo: user } = useAppStore()
  const moduleMap = useNavModuleInfoMap()
  const { preference: modulesPreferenceData, setPreference: setModuleConfigPreference } =
    usePreferenceStore<ModulesPreferenceStoreData>(PreferenceScope.USER, MODULES_CONFIG_PREFERENCE_STORE_KEY)

  useLayoutEffect(() => {
    // main nav consists of two UL sections with classname "css.navList"
    const items = Array.from(document.querySelectorAll(`.${css.navList}`))
    // add the real height of both sections
    // real height is needed because number of items can change based on feature flags, license etc
    const minNavHeight = items.reduce((previousValue, listitem) => {
      return previousValue + listitem.getBoundingClientRect().height
    }, 0)
    // set the CSS variable defined in src/modules/10-common/layouts/layouts.module.scss
    const root = document.querySelector(':root') as HTMLElement
    root.style.setProperty('--main-nav-height', `${minNavHeight}px`)

    NEW_LEFT_NAVBAR_SETTINGS &&
      document.getElementsByClassName(css.active)[0]?.scrollIntoView({ inline: 'nearest', block: 'start' })
  })

  useEffect(() => {
    if (!modulesPreferenceData?.orderedModules?.length && NEW_LEFT_NAVBAR_SETTINGS) {
      const modulesWithLicense = DEFAULT_MODULES_ORDER.filter(m => !!moduleMap[m].licenseType)
      setModuleConfigPreference({
        selectedModules: modulesWithLicense,
        orderedModules: DEFAULT_MODULES_ORDER
      })
    }
  }, [])

  return (
    <>
      <nav className={cx(css.main, { [css.recessed]: isModuleListOpen })}>
        <ul className={css.navList}>
          {NEW_LEFT_NAVBAR_SETTINGS && (
            <li className={css.navItem}>
              <Link {...commonLinkProps} to={paths.toMainDashboard(params)}>
                <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
                  <Icon name={'harness'} size={30} />
                  <Text
                    font={{ weight: 'semi-bold', align: 'center' }}
                    padding={{ bottom: 'xsmall' }}
                    color={Color.WHITE}
                    className={css.text}
                  >
                    <String stringID={'common.home'} />
                  </Text>
                </Layout.Vertical>
              </Link>
            </li>
          )}
          <li className={css.navItem}>
            <Link {...commonLinkProps} to={paths.toHome(params)}>
              <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
                {NEW_LEFT_NAVBAR_SETTINGS ? (
                  <Icon name={'nav-project'} size={30} color={Color.PRIMARY_4} />
                ) : (
                  <Icon name={'harness'} size={30} />
                )}
                <Text
                  font={{ weight: 'semi-bold', align: 'center' }}
                  padding={{ bottom: 'xsmall' }}
                  color={Color.WHITE}
                  className={css.text}
                >
                  <String stringID={NEW_LEFT_NAVBAR_SETTINGS ? 'projectsText' : 'common.home'} />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
          {NEW_LEFT_NAVBAR_SETTINGS ? (
            <li>
              <ModulesContainer />
            </li>
          ) : (
            DEFAULT_MODULES_ORDER.map(moduleName => {
              const NavItem = moduleToNavItemsMap[moduleName]
              const moduleInfo = moduleMap[moduleName]
              return moduleInfo.shouldVisible ? <NavItem key={moduleName} /> : null
            })
          )}
          {NEW_LEFT_NAVBAR_SETTINGS && (
            <li>
              <Container flex={{ justifyContent: 'center' }}>
                <Popover
                  content={
                    <Text color={Color.WHITE} padding="small">
                      <String stringID="common.selectModules" />
                    </Text>
                  }
                  popoverClassName={Classes.DARK}
                  interactionKind={PopoverInteractionKind.HOVER}
                  position={Position.RIGHT}
                >
                  <button
                    className={cx(css.allModulesButton, {
                      [css.allModulesOpen]: isModuleListOpen
                    })}
                    onClick={toggleModuleList}
                  >
                    <Icon name={isModuleConfigOpen ? 'customize' : 'grid'} size={isModuleListOpen ? 26 : 16} />
                    {isModuleConfigOpen && (
                      <Text color={Color.WHITE} font={{ variation: FontVariation.TINY }} margin={{ top: 'xsmall' }}>
                        <String stringID="common.configureModuleList" />
                      </Text>
                    )}
                  </button>
                </Popover>
              </Container>
            </li>
          )}
        </ul>
        <ul className={css.navList}>
          {RESOURCE_CENTER_ENABLED && (
            <li className={css.navItem}>
              <ResourceCenter />
            </li>
          )}
          {NG_DASHBOARDS && (
            <li className={css.navItem}>
              <Link
                className={cx(css.navLink, css.settings, css.hoverNavLink)}
                activeClassName={css.active}
                to={paths.toCustomDashboard(params)}
              >
                <Layout.Vertical flex spacing="xsmall">
                  <Icon name="dashboard" size={20} />
                  <Text font={{ size: 'xsmall', align: 'center' }} color={Color.WHITE} className={css.hoverText}>
                    <String stringID="common.dashboards" />
                  </Text>
                </Layout.Vertical>
              </Link>
            </li>
          )}
          <li className={css.navItem}>
            <Link
              className={cx(css.navLink, css.settings, css.hoverNavLink)}
              activeClassName={css.active}
              to={paths.toAccountSettings(params)}
            >
              <Layout.Vertical flex spacing="xsmall">
                <Icon name="nav-settings" size={20} />
                <Text font={{ size: 'xsmall', align: 'center' }} color={Color.WHITE} className={css.hoverText}>
                  <String stringID="common.accountSettings" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
          <li className={css.navItem}>
            <Link
              className={cx(css.navLink, css.userLink, css.hoverNavLink)}
              activeClassName={css.active}
              to={paths.toUser(params)}
            >
              <Layout.Vertical flex spacing="xsmall">
                <Avatar name={user.name || user.email} email={user.email} size="small" hoverCard={false} />
                <Text font={{ size: 'xsmall', align: 'center' }} color={Color.WHITE} className={css.hiddenText}>
                  <String stringID="common.myProfile" />
                </Text>
              </Layout.Vertical>
            </Link>
          </li>
        </ul>
      </nav>
      {NEW_LEFT_NAVBAR_SETTINGS ? (
        <ModuleList
          isOpen={isModuleListOpen}
          close={() => {
            closeModuleList()
            closeModuleConfig()
          }}
          onConfigIconClick={toggleModuleConfig}
        />
      ) : null}
      {isModuleConfigOpen ? (
        <ModuleConfigurationScreen
          onClose={() => {
            closeModuleConfig()
            closeModuleList()
          }}
        />
      ) : null}
    </>
  )
}
