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
import { utcDay } from 'd3-time';
import React from 'react';
import bows from 'bows';
import sundial from 'sundial';

import ModalBackground from './ModalBackground';
import CBGSlicesContainer from './CBGSlicesContainer';

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
  height: 520,
};

class ModalChart extends React.Component {
  constructor(props) {
    super(props);
    this.log = bows('ModalChart');
    this.state = {
      currentCbgData: [],
      currentSmbgData: [],
    };
  }

  static defaultProps = {
    margins: MARGINS,
    smbgOpts: SMBG_OPTS,
    svgDimensions: SVG_DIMS,
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

  _filterActiveDaysFn(activeDays) {
    return (d) => { return activeDays[d]; };
  }

  _getInitialExtent(dateDomain) {
    const { timePrefs: { timezoneAware, timezoneName } } = this.props;
    const { extentSize, initialDatetimeLocation } = this.props;

    const timezone = timezoneAware ? 'UTC' : (timezoneName ? timezoneName : 'UTC');

    // have simplified here: initialDatetimeLocation may be beyond end of smbg data
    const extentBasis = sundial.ceil(
      initialDatetimeLocation ? initialDatetimeLocation : dateDomain[1],
      'day',
      timezone
    );
    // have also simplified here, not caring whether start < dateDomain[0]
    const start = utcDay.offset(extentBasis, -extentSize);
    return [
      start.toISOString(),
      extentBasis.toISOString(),
    ];
  }

  _initialDataFiltering(dataByDate, dataByDayOfWeek) {
    const { activeDays } = this.props;
    // clear old filters
    dataByDayOfWeek.filterAll();

    // set up filtering for day of week (Monday, Tuesday, etc.)
    dataByDayOfWeek.filterFunction(this._filterActiveDaysFn(activeDays));

    // find the date domain for this data type
    const dateDomain = this._getInitialExtent(
      extent(dataByDate.top(Infinity), (d) => { return d.normalTime; })
    );

    return dateDomain;
  }

  _updateDateFilter(dataByDate) {
    // TODO!
  }

  _updateDayOfWeekFilter(dataByDayOfWeek, activeDays) {
    dataByDayOfWeek.filterFunction(this._filterActiveDaysFn(activeDays));
  }

  // TODO: only setting bgDomain *once* when mounting ModalChart
  // is NOT compatible with eventual data paging!
  componentWillMount() {
    const { cbgByDate, cbgByDayOfWeek, smbgByDate, smbgByDayOfWeek } = this.props;
    const allBg = this.props.smbgByDate.filterAll().top(Infinity)
      .concat(this.props.cbgByDate.filterAll().top(Infinity));
    const bgDomain = extent(allBg, d => d.value);
    const cbgDateDomain = this._initialDataFiltering(cbgByDate, cbgByDayOfWeek);
    const smbgDateDomain = this._initialDataFiltering(smbgByDate, smbgByDayOfWeek);
    const dateDomain = (cbgDateDomain[1] > smbgDateDomain[1]) ? cbgDateDomain : smbgDateDomain;
    cbgByDate.filter(dateDomain);
    smbgByDate.filter(dateDomain);
    this.setState({
      currentCbgData: cbgByDate.top(Infinity).reverse(),
      currentSmbgData: smbgByDate.top(Infinity).reverse(),
      bgDomain: bgDomain,
      dateDomain: dateDomain,
      yScale: scaleLinear().clamp(true)
        .domain(bgDomain)
        .range([
          SVG_DIMS.height - MARGINS.bottom - BUMPERS.bottom,
          MARGINS.top + BUMPERS.top
        ])
    });
  }

  componentWillReceiveProps(nextProps) {
    const { activeDays, extentSize } = nextProps;
    const { cbgByDate, cbgByDayOfWeek, smbgByDate, smbgByDayOfWeek } = nextProps;
    let updatedDayOfWeek = false;
    let updatedDate = false;

    if (!_.isEqual(this.props.activeDays, activeDays)) {
      this._updateDayOfWeekFilter(cbgByDayOfWeek, activeDays);
      this._updateDayOfWeekFilter(smbgByDayOfWeek, activeDays);
      updatedDayOfWeek = true;
    }

    if (this.props.extentSize !== extentSize) {
      this._updateDateFilter(cbgByDate);
      this._updateDateFilter(smbgByDate);
      updatedDate = true;
    }

    // only rerun the filter if we updated something!
    if (updatedDayOfWeek || updatedDate) {
      this.setState({
        currentCbgData: cbgByDate.top(Infinity).reverse(),
        currentSmbgData: smbgByDate.top(Infinity).reverse(),
      });
    }
  }

  _renderCBGSlices() {
    if (this.props.showingCbg) {
      return (
        <CBGSlicesContainer
          data={this.state.currentCbgData}
          xScale={this.props.xScale}
          yScale={this.state.yScale} />
      );
    }
    return null;
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
        {this._renderCBGSlices()}
      </svg>
    );
  }
};

export default ModalChart;