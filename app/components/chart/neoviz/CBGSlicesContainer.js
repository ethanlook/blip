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
import stats from 'simple-statistics';

import CBGSlices from './CBGSlices';

export default class CBGSlicesContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mungedData: [],
    };
  }

  static defaultProps = {
    // thirty-minute bins
    binSize: 1000 * 60 * 30,
  };

  static propTypes = {
    binSize: React.PropTypes.number.isRequired,
    data: React.PropTypes.array.isRequired,
    xScale: React.PropTypes.func.isRequired,
    yScale: React.PropTypes.func.isRequired,
  };

  _mungeData(binSize, data) {
    const binned = _.groupBy(data, (d) => {
      return Math.ceil(d.msPer24 / binSize) * binSize - (binSize / 2);
    });
    const binKeys = Object.keys(binned);
    const valueExtractor = (d) => { return d.value; };
    const mungedData = [];
    for (let i = 0; i < binKeys.length; ++i) {
      const values = _.map(binned[binKeys[i]], valueExtractor);
      mungedData.push({
        id: binKeys[i],
        min: stats.min(values),
        tenthQuantile: stats.quantile(values, 0.1),
        firstQuartile: stats.quantile(values, 0.25),
        thirdQuartile: stats.quantile(values, 0.75),
        ninetiethQuantile: stats.quantile(values, 0.9),
        max: stats.max(values),
        median: stats.median(values),
        msX: parseInt(binKeys[i], 10),
        data: binned[binKeys[i]],
      });
    }
    return mungedData;
  }

  componentWillMount() {
    const { binSize, data } = this.props;
    this.setState({ mungedData: this._mungeData(binSize, data) });
  }

  componentWillReceiveProps(nextProps) {
    const { binSize, data } = nextProps;
    this.setState({ mungedData: this._mungeData(binSize, data)});
  }

  render() {
    const { xScale, yScale } = this.props;
    const { mungedData } = this.state;
    return (
      <CBGSlices data={mungedData} xScale={xScale} yScale={yScale} />
    );
  }
};
