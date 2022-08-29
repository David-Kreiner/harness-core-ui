/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useRef, useState } from 'react'
import produce from 'immer'
import {
  Button,
  FontVariation,
  Text,
  StepProps,
  Layout,
  ButtonVariation,
  Icon,
  Color,
  Container,
  Formik,
  FormikForm,
  FormInput
} from '@harness/uicore'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import { LdapUserSettings, RestResponseLdapTestResponse, useValidateLdapUserSettings } from 'services/cd-ng'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import type { CreateUpdateLdapWizardProps, LdapWizardStepProps } from '../CreateUpdateLdapWizard'
import { QueryFormTitle, QueryStepTitle, QueryTestFailMsg, QueryTestSuccessMsg } from '../utils'
import css from '../CreateUpdateLdapWizard.module.scss'

export interface StepUserQueriesProps {
  name: string
  userSettingsList?: LdapUserSettings[]
}

interface UserQueryPreviewProps {
  index: number
  customClass?: string
}

interface LdapUserSettingsDraft extends LdapUserSettings {
  isDraft?: boolean
  isNewSetting?: boolean
}

const AddUserQuery: React.FC<{ onAddUserSetting: () => void }> = ({ onAddUserSetting: onAddUserSetting }) => {
  const { getString } = useStrings()
  return (
    <Layout.Vertical
      flex={{ justifyContent: 'center', alignItems: 'center' }}
      className={css.addQueryCtr}
      spacing="medium"
    >
      <Icon name="user" size={73} />
      <Text font={{ variation: FontVariation.H5 }} color={Color.GREY_600}>
        {getString('authSettings.ldap.addUserQueryHeading')}
      </Text>
      <Text font={{ variation: FontVariation.BODY }} width={400} className={css.addQueryDescription}>
        {getString('authSettings.ldap.addUserQueryDescription')}
      </Text>
      <Button
        text={getString('authSettings.ldap.newUserQuery')}
        icon="plus"
        variation={ButtonVariation.SECONDARY}
        onClick={onAddUserSetting}
        data-testid="add-first-user-query-btn"
      />
    </Layout.Vertical>
  )
}

const UserQueryEdit: React.FC<
  LdapUserSettings &
    UserQueryPreviewProps & {
      onUserQueryCommitEdit: (userSetting: LdapUserSettings, idx: number) => void
      onUserQueryDiscardEdit: (idx: number) => void
      onTestUserQuery: (formVal: LdapUserSettings) => Promise<RestResponseLdapTestResponse>
    }
> = ({
  baseDN,
  searchFilter,
  displayNameAttr,
  emailAttr,
  groupMembershipAttr,
  index,
  customClass,
  onUserQueryCommitEdit,
  onUserQueryDiscardEdit,
  onTestUserQuery
}) => {
  const { getString } = useStrings()
  const userQueryFormRef = useRef<FormikProps<LdapUserSettings>>(null)
  const [userQueryTestResult, setUserQueryTestResult] = useState<React.ReactNode | undefined>()
  const testUserQuery = async (): Promise<void> => {
    try {
      setUserQueryTestResult(undefined)
      const result = await onTestUserQuery((userQueryFormRef.current as FormikProps<LdapUserSettings>).values)
      if (result.resource?.status === 'SUCCESS') {
        setUserQueryTestResult(<QueryTestSuccessMsg message={getString('authSettings.ldap.queryTestSuccessful')} />)
      } else {
        setUserQueryTestResult(<QueryTestFailMsg message={result.resource?.message} />)
      }
    } catch (err) /* istanbul ignore next */ {
      const errMsg = err instanceof Error ? (err?.message as string) : getString('authSettings.ldap.queryTestFail')
      setUserQueryTestResult(<QueryTestFailMsg message={errMsg} />)
    }
  }
  return (
    <Layout.Vertical spacing="small" padding="medium" className={customClass}>
      <Formik<LdapUserSettings>
        innerRef={userQueryFormRef}
        formName={`addEditUserSetting-${index}`}
        initialValues={{ baseDN, searchFilter, displayNameAttr, emailAttr, groupMembershipAttr }}
        onSubmit={formData => {
          onUserQueryCommitEdit(formData, index)
        }}
      >
        <FormikForm>
          <Layout.Horizontal spacing="small" flex={{ alignItems: 'center' }}>
            <QueryFormTitle title={getString('authSettings.ldap.userQueryTitle', { index: index + 1 })} />
            <Container className={css.queryCtaContainer} flex={{ alignItems: 'center' }}>
              {userQueryTestResult}
              <Button
                text={getString('test')}
                variation={ButtonVariation.LINK}
                onClick={testUserQuery}
                data-testId="test-user-query-btn"
              />
              <Button
                icon="tick"
                className={css.commitBtn}
                color={Color.GREEN_700}
                type="submit"
                minimal
                data-testid="commit-query-btn"
              />
              <Button
                icon="cross"
                className={css.undoEditBtn}
                minimal
                onClick={() => {
                  onUserQueryDiscardEdit(index)
                }}
                data-testid="discard-query-btn"
              />
            </Container>
          </Layout.Horizontal>
          <Container className={css.settingsForm}>
            <FormInput.Text
              className={css.queryFormField}
              label={getString('authSettings.ldap.baseDN')}
              name="baseDN"
            />
            <FormInput.Text
              className={css.queryFormField}
              label={getString('authSettings.ldap.searchFilter')}
              name="searchFilter"
            />
            <FormInput.Text
              className={css.queryFormField}
              label={getString('authSettings.ldap.nameAttributes')}
              name="displayNameAttr"
            />
            <FormInput.Text
              className={css.queryFormField}
              label={getString('authSettings.ldap.emailAttributes')}
              name="emailAttr"
            />
            <FormInput.Text
              className={css.queryFormField}
              label={getString('authSettings.ldap.groupMembershipAttributes')}
              name="groupMembershipAttr"
            />
          </Container>
        </FormikForm>
      </Formik>
    </Layout.Vertical>
  )
}

const UserQueryPreview: React.FC<
  LdapUserSettings &
    UserQueryPreviewProps & {
      onDeleteUserQuery: (idx: number) => void
      onEnableUserQueryDraftMode: (idx: number) => void
    }
> = ({
  baseDN,
  searchFilter,
  displayNameAttr,
  emailAttr,
  groupMembershipAttr,
  index,
  customClass,
  onDeleteUserQuery,
  onEnableUserQueryDraftMode
}) => {
  const { getString } = useStrings()
  return (
    <Layout.Vertical spacing="small" padding="medium" className={customClass}>
      <Layout.Horizontal spacing="small" flex={{ alignItems: 'center' }}>
        <Text font={{ variation: FontVariation.H5 }}>
          <Icon name="chevron-down" color={Color.PRIMARY_6} margin={{ right: 'small' }} />
          {getString('authSettings.ldap.userQueryTitle', { index: index + 1 })}
        </Text>
        <Container className={css.queryCtaContainer}>
          <Button
            icon="edit"
            minimal
            withoutCurrentColor
            data-testid="edit-user-query-btn"
            onClick={() => {
              onEnableUserQueryDraftMode(index)
            }}
          />
          <Button
            icon="main-trash"
            minimal
            withoutCurrentColor
            data-testid="delete-user-query-btn"
            onClick={() => {
              onDeleteUserQuery(index)
            }}
          />
        </Container>
      </Layout.Horizontal>
      <Layout.Horizontal>
        <ul className={css.userSettingsList}>
          <li>
            <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
              <Text font={{ variation: FontVariation.BODY2 }} margin={{ right: 'xsmall' }}>
                {`${getString('authSettings.ldap.baseDN')}: `}
              </Text>
              <Text>{baseDN}</Text>
            </Layout.Horizontal>
          </li>
          <li>
            <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
              <Text font={{ variation: FontVariation.BODY2 }} margin={{ right: 'xsmall' }}>
                {`${getString('authSettings.ldap.searchFilter')}: `}
              </Text>
              <Text>{searchFilter}</Text>
            </Layout.Horizontal>
          </li>
          <li>
            <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
              <Text font={{ variation: FontVariation.BODY2 }} margin={{ right: 'xsmall' }}>
                {`${getString('authSettings.ldap.nameAttributes')}: `}
              </Text>
              <Text>{displayNameAttr}</Text>
            </Layout.Horizontal>
          </li>
          <li>
            <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
              <Text font={{ variation: FontVariation.BODY2 }} margin={{ right: 'xsmall' }}>
                {`${getString('authSettings.ldap.emailAttributes')}: `}
              </Text>
              <Text>{emailAttr}</Text>
            </Layout.Horizontal>
          </li>
          <li>
            <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
              <Text font={{ variation: FontVariation.BODY2 }} margin={{ right: 'xsmall' }}>
                {`${getString('authSettings.ldap.groupMembershipAttributes')}: `}
              </Text>
              <Text>{groupMembershipAttr}</Text>
            </Layout.Horizontal>
          </li>
        </ul>
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

export const StepUserQueries: React.FC<
  StepProps<CreateUpdateLdapWizardProps> & LdapWizardStepProps<LdapUserSettings[]>
> = props => {
  const { getString } = useStrings()
  const { name, updateStepData, auxilliaryData } = props
  const [userSettingsList, setUserSettingsList] = useState<LdapUserSettingsDraft[]>(props.stepData || [])
  const [isAddSettingEnabled, setIsAddSettingEnabled] = useState<boolean>(true)
  const { accountId } = useParams<AccountPathProps>()
  const isSettingsListEmpty = useMemo(() => userSettingsList.length === 0, [userSettingsList])
  const { mutate: validateUserSettings } = useValidateLdapUserSettings({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const onDeleteUserQuery = (idx: number): void => {
    setUserSettingsList(
      produce(userSettingsList, draft => {
        draft.splice(idx, 1)
      })
    )
  }
  const onEnableUserQueryDraftMode = (idx: number): void => {
    setUserSettingsList(
      produce(userSettingsList, draft => {
        draft[idx].isDraft = true
      })
    )
  }
  const onUserQueryCommitEdit = (userSetting: LdapUserSettingsDraft, idx: number): void => {
    setUserSettingsList(
      produce(userSettingsList, draft => {
        if (draft[idx].isNewSetting) {
          setIsAddSettingEnabled(true)
          delete userSetting.isNewSetting
        }
        delete userSetting.isDraft
        draft[idx] = userSetting
      })
    )
  }
  const onUserQueryDiscardEdit = (idx: number): void => {
    setUserSettingsList(
      produce(userSettingsList, draft => {
        if (draft[idx].isNewSetting) {
          // A newly added draft is discarded, hence it should be removed from list
          draft.splice(idx, 1)
          setIsAddSettingEnabled(true)
          return
        }
        delete draft[idx].isDraft
        delete draft[idx].isNewSetting
      })
    )
  }
  const onAddUserSetting = (): void => {
    setUserSettingsList(
      produce(userSettingsList, draft => {
        draft.unshift({ isDraft: true, isNewSetting: true })
        setIsAddSettingEnabled(false)
      })
    )
  }

  const onTestUserQuery = (ldapUserSetting: LdapUserSettings): Promise<RestResponseLdapTestResponse> => {
    return validateUserSettings({
      displayName: auxilliaryData?.displayName,
      userSettingsList: [ldapUserSetting],
      appId: '',
      connectionSettings: auxilliaryData?.connectionSettings || { host: '' },
      uuid: auxilliaryData?.identifier || '',
      type: 'LDAP',
      lastUpdatedAt: 0,
      accountId: accountId
    })
  }
  const UserQueryListPreview = userSettingsList?.map((userSetting, userQueryIdx) => {
    if (userSetting.isDraft) {
      return (
        <UserQueryEdit
          {...userSetting}
          key={`${userSetting.uidAttr}__${userQueryIdx}`}
          index={userQueryIdx}
          customClass={css.queryDraftItem}
          onUserQueryCommitEdit={onUserQueryCommitEdit}
          onUserQueryDiscardEdit={onUserQueryDiscardEdit}
          onTestUserQuery={onTestUserQuery}
        />
      )
    }
    return (
      <UserQueryPreview
        {...userSetting}
        key={`${userSetting.uidAttr}__${userQueryIdx}`}
        index={userQueryIdx}
        customClass={css.queryPreviewItem}
        onEnableUserQueryDraftMode={onEnableUserQueryDraftMode}
        onDeleteUserQuery={onDeleteUserQuery}
      />
    )
  })
  return (
    <Layout.Vertical className={cx(css.stepContainer, css.stepQueryContainer)}>
      <QueryStepTitle stepTitle={name as string} />
      <Layout.Horizontal margin={{ bottom: 'medium' }} className={css.alignCenter}>
        <Text className={css.fluidLabel} color={Color.BLACK}>
          {getString('authSettings.ldap.setScopeForUserQuery')}
        </Text>
        {!isSettingsListEmpty && (
          <Button
            text={getString('authSettings.ldap.newUserQuery')}
            disabled={!isAddSettingEnabled}
            icon="plus"
            variation={ButtonVariation.SECONDARY}
            onClick={onAddUserSetting}
            data-testid="add-another-user-query-btn"
          />
        )}
      </Layout.Horizontal>
      <Layout.Vertical className={css.queryCtr}>
        {isSettingsListEmpty ? (
          <AddUserQuery onAddUserSetting={onAddUserSetting} />
        ) : (
          <Container className={css.settingsListCtr}>{UserQueryListPreview}</Container>
        )}
      </Layout.Vertical>
      <Layout.Horizontal className={css.stepCtaContainer}>
        <Button
          onClick={() => props.previousStep?.()}
          text={getString('back')}
          icon="chevron-left"
          margin={{ right: 'small' }}
          variation={ButtonVariation.SECONDARY}
          data-testid="back-to-connection-step"
        />
        <Button
          intent="primary"
          onClick={() => {
            updateStepData(userSettingsList)
            props.nextStep?.()
          }}
          text={getString('continue')}
          rightIcon="chevron-right"
          data-testid="submit-usery-query-step"
        />
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

export default StepUserQueries
