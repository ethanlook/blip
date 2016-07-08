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
import cx from 'classnames';
import React from 'react';

const FILL_CLASSES = [
  'd3-fill-darkest',
  'd3-fill-dark',
  'd3-fill-lighter',
  'd3-fill-light',
  'd3-fill-lightest',
  'd3-fill-lighter',
  'd3-fill-dark',
  'd3-fill-darker'
];

const THREE_HRS = 10800000;

const ModalBackground = (props) => {
  const { bgClasses, data, margins, smbgOpts, svgDimensions, xScale, yScale } = props;
  return (
    <g id="modalBackgroundRects">
      <g id="aboveTarget">
        {_.map(data, (val, i) => {
          const xRange = xScale.range();
          const baseWidth = (xRange[1] - xRange[0])/props.data.length;
          return (
            <rect
              className={cx({ [FILL_CLASSES[i]]: true, 'd3-rect-fill': true})}
              key={`aboveTargetBkgrd-${i}`}
              x={(i === 0) ? margins.left : xScale(val)}
              y={margins.top}
              width={_.includes([0,7], i) ? baseWidth + smbgOpts.maxR : baseWidth}
              height={yScale(bgClasses.target.boundary) - margins.top}
            >
            </rect>
          );
        })}
      </g>
      <g id="inTarget">
        {_.map(data, (val, i) => {
          const xRange = xScale.range();
          const baseWidth = (xRange[1] - xRange[0])/props.data.length;
          return (
            <rect
              className={cx({ [FILL_CLASSES[i]]: true, 'd3-rect-fill': true, 'd3-rect-fill-faded': true})}
              key={`inTargetBkgrd-${i}`}
              x={(i === 0) ? margins.left : xScale(val)}
              y={yScale(bgClasses.target.boundary)}
              width={_.includes([0,7], i) ? baseWidth + smbgOpts.maxR : baseWidth}
              height={yScale(bgClasses.low.boundary) - yScale(bgClasses.target.boundary)}
            >
            </rect>
          );
        })}
      </g>
      <g id="belowTarget">
        {_.map(data, (val, i) => {
          const xRange = xScale.range();
          const baseWidth = (xRange[1] - xRange[0])/props.data.length;
          return (
            <rect
              className={cx({ [FILL_CLASSES[i]]: true, 'd3-rect-fill': true})}
              key={`belowTargetBkgrd-${i}`}
              x={(i === 0) ? margins.left : xScale(val)}
              y={yScale(bgClasses.low.boundary)}
              width={_.includes([0,7], i) ? baseWidth + smbgOpts.maxR : baseWidth}
              height={svgDimensions.height - margins.bottom - yScale(bgClasses.low.boundary)}
            >
            </rect>
          );
        })}
      </g>
    </g>
  );
};

ModalBackground.defaultProps = {
  data: _.map([0,1,2,3,4,5,6,7], (i) => (i * THREE_HRS)),
};

ModalBackground.propTypes = {
  bgClasses: React.PropTypes.object.isRequired,
  data: React.PropTypes.array.isRequired,
  margins: React.PropTypes.object.isRequired,
  smbgOpts: React.PropTypes.object.isRequired,
  svgDimensions: React.PropTypes.object.isRequired,
  xScale: React.PropTypes.func.isRequired,
  yScale: React.PropTypes.func.isRequired,
};

export default ModalBackground;
