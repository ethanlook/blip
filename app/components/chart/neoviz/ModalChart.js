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
import { extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import React from 'react';
import ReactDOM from 'react-dom';
import bows from 'bows';

import ModalBackground from './ModalBackground';

const BUMPERS = {
  top: 30,
  bottom: 30,
};

const MARGINS = {
  top: 30,
  right: 10,
  bottom: 10,
  left: 40,
};

const SMBG_OPTS = {
  maxR: 7.5,
  r: 6,
};

const SVG_DIMS = {
  width: 960,
  height: 689,
};

class ModalChart extends React.Component {
  constructor(props) {
    super(props);
    this.log = bows('ModalChart');
  }

  static defaultProps = {
    svgDimensions: SVG_DIMS,
    margins: MARGINS,
    smbgOpts: SMBG_OPTS,
    xScale: scaleLinear()
      .domain([0, 86400000])
      .range([
        MARGINS.left + Math.round(SMBG_OPTS.maxR),
        SVG_DIMS.width - MARGINS.right - Math.round(SMBG_OPTS.maxR)
      ]),
    yScale:  scaleLinear()
      .clamp(true)
  };

  static propTypes = {
    activeDays: React.PropTypes.object.isRequired,
    bgClasses: React.PropTypes.object.isRequired,
    bgUnits: React.PropTypes.string.isRequired,
    cbgDayTraces: React.PropTypes.bool.isRequired,
    extentSize: React.PropTypes.number.isRequired,
    initialDatetimeLocation: React.PropTypes.string,
    showingSmbg: React.PropTypes.bool.isRequired,
    showingCbg: React.PropTypes.bool.isRequired,
    smbgRangeOverlay: React.PropTypes.bool.isRequired,
    smbgGrouped: React.PropTypes.bool.isRequired,
    smbgLines: React.PropTypes.bool.isRequired,
    svgDimensions: React.PropTypes.object.isRequired,
    timePrefs: React.PropTypes.object.isRequired,
    // data (crossfilter dimensions)
    cbgByDate: React.PropTypes.object.isRequired,
    cbgByDayOfWeek: React.PropTypes.object.isRequired,
    smbgByDate: React.PropTypes.object.isRequired,
    smbgByDayOfWeek: React.PropTypes.object.isRequired,
    // handlers
    onDatetimeLocationChange: React.PropTypes.func.isRequired,
    onSelectDay: React.PropTypes.func.isRequired,
  };

  // TODO: only setting bgDomain *once* when mounting ModalChart
  // is NOT compatible with eventual data paging!
  componentWillMount() {
    var allBg = this.props.smbgByDate.top(Infinity)
      .concat(this.props.cbgByDate.top(Infinity));
    var bgDomain = extent(allBg, d => d.value);
    this.setState({
      bgDomain: bgDomain,
      yScale: scaleLinear().clamp(true)
        .domain(bgDomain)
        .range([
          SVG_DIMS.height - MARGINS.bottom - BUMPERS.bottom,
          MARGINS.top + BUMPERS.top
        ])
    });
  }

  render() {
    const { svgDimensions } = this.props;
    return (
      <svg {...svgDimensions} >
        <ModalBackground
          bgClasses={this.props.bgClasses}
          margins={this.props.margins}
          smbgOpts={this.props.smbgOpts}
          svgDimensions={svgDimensions}
          xScale={this.props.xScale}
          yScale={this.state.yScale} />
      </svg>
    );
  }
}

export default ModalChart;