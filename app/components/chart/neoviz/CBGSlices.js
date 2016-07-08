/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2016, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

import _ from 'lodash';
import React from 'react';
import cx from 'classnames';

const CBGSlices = (props) => {
  const { data, xScale, yPositions } = props;

  return (
    <g id="cbgSlices">
      <g id="rangeSlices">
        {_.map(data, (d, i) => {
          return (
            <line className={cx({ cbgSlice: true, rangeSlice: true })}
              key={`rangeSlice-${i}`}
              x1={xScale(d.msX)}
              x2={xScale(d.msX)}
              y1={yPositions[`${i}-min`]}
              y2={yPositions[`${i}-max`]} />
          );
        })}
      </g>
      <g id="outerSlices">
        {_.map(data, (d, i) => {
          return (
            <line className={cx({ cbgSlice: true, outerSlice: true })}
              key={`outerSlice-${i}`}
              x1={xScale(d.msX)}
              x2={xScale(d.msX)}
              y1={yPositions[`${i}-tenthQuantile`]}
              y2={yPositions[`${i}-ninetiethQuantile`]} />
          );
        })}
      </g>
      <g id="quartileSlices">
        {_.map(data, (d, i) => {
          return (
            <line className={cx({ cbgSlice: true, quartileSlice: true })}
              key={`quartileSlice-${i}`}
              x1={xScale(d.msX)}
              x2={xScale(d.msX)}
              y1={yPositions[`${i}-firstQuartile`]}
              y2={yPositions[`${i}-thirdQuartile`]} />
          );
        })}
      </g>
    </g>
  );
};

CBGSlices.propTypes = {
  data: React.PropTypes.array.isRequired,
  xScale: React.PropTypes.func.isRequired,
  yPositions: React.PropTypes.object.isRequired,
};

export default CBGSlices;
