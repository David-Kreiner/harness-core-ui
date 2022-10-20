/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ArtifactsComponent, { ArtifactGroup } from '../ArtifactsComponent'
import artifacts from './artifacts-mock.json'

describe('ArtifactsComponent snapshot test', () => {
  test('should render properly', async () => {
    const { container } = render(<ArtifactsComponent artifactGroups={artifacts as ArtifactGroup[]} />)
    expect(container).toMatchSnapshot()
  })
  test('should render properly for file artifact type', async () => {
    const { container, getAllByText } = render(
      <ArtifactsComponent artifactGroups={[artifacts[1]] as ArtifactGroup[]} />
    )
    userEvent.click(container.querySelector('[data-icon="main-chevron-right"]')!)
    expect(getAllByText('file://hub.docker.com').length).toBeGreaterThan(0)
    expect(document.querySelectorAll("a[href='file://hub.docker.com']").length).toBeGreaterThan(0)
  })
})
