/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

type ComputeRange<N extends number, Result extends Array<unknown> = []> = Result['length'] extends N
  ? Result
  : ComputeRange<N, [...Result, Result['length']]>

export type ClientErrorStatus = Exclude<ComputeRange<500>[-1], ComputeRange<400>[-1]>
export type ServerErrorStatus = Exclude<ComputeRange<600>[-1], ComputeRange<500>[-1]>
