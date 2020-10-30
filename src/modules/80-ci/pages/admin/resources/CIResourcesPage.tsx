import { Container, Layout } from '@wings-software/uikit'
import React from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { routeCIAdminResourcesConnectors, routeCIAdminResourcesSecretsListing } from 'navigation/ci/routes'
import { Page } from '@common/exports'
import i18n from './CIResourcesPage.i18n'
import css from './CIResourcesPage.module.scss'

const CIResourcesPage: React.FC = ({ children }) => {
  const { orgIdentifier, projectIdentifier } = useParams()
  return (
    <>
      <Page.Header
        title={i18n.title}
        toolbar={
          <Container>
            <Layout.Horizontal spacing="medium">
              <NavLink
                className={css.tags}
                activeClassName={css.activeTag}
                to={routeCIAdminResourcesConnectors.url({ orgIdentifier, projectIdentifier })}
              >
                {i18n.connectors}
              </NavLink>

              <NavLink
                className={css.tags}
                activeClassName={css.activeTag}
                to={routeCIAdminResourcesSecretsListing.url({ orgIdentifier, projectIdentifier })}
              >
                {i18n.secrets}
              </NavLink>

              <NavLink className={css.tags} to="#TBD">
                {i18n.delegates}
              </NavLink>

              <NavLink className={css.tags} to="#TBD">
                {i18n.templates}
              </NavLink>

              <NavLink className={css.tags} to="#TBD">
                {i18n.fileStore}
              </NavLink>
            </Layout.Horizontal>
          </Container>
        }
      />
      <Page.Body>{children}</Page.Body>
    </>
  )
}

export default CIResourcesPage
