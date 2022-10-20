/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { ApiKey } from 'services/cf'
import type { PlatformEntry } from '@cf/components/LanguageSelection/LanguageSelection'
import { MarkdownViewer } from '@common/components/MarkdownViewer/MarkdownViewer'
import type { StringKeys } from 'framework/strings'

const keyMask = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

export interface SetUpYourCodeViewProps {
  language: PlatformEntry
  apiKey: ApiKey | undefined
  flagName: string
  readmeOverrideString?: StringKeys
}

export const SetUpYourCodeView: React.FC<SetUpYourCodeViewProps> = props => {
  return (
    <MarkdownViewer
      stringId={props.readmeOverrideString || props.language.readmeStringId}
      vars={{
        ...props.apiKey,
        apiKey: props.apiKey?.apiKey || keyMask,
        flagName: props.flagName
      }}
    />
  )
}
