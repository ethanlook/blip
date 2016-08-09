/* 
 * == BSD2 LICENSE ==
 * Copyright (c) 2014, Tidepool Project
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

var _ = require('lodash');
var bows = require('bows');
var React = require('react');
var ReactDOM = require('react-dom');

import personUtils from '../../../core/personutils';
import utils from '../../../core/utils';
import format from 'tideline/js/data/util/format';

const MS_INHOUR = 3600000, MS_INDAY = 86400000;
const MIN_DUR_FOR_RATE = 2 * MS_INHOUR;

var WeekView = React.createClass({
  log: bows('Print View Week View'),
  propTypes: {
    bgPrefs: React.PropTypes.object.isRequired,
    timePrefs: React.PropTypes.object.isRequired,
    timeRange: React.PropTypes.array.isRequired,
    patient: React.PropTypes.object.isRequired,
    patientData: React.PropTypes.object.isRequired,
    onClickRefresh: React.PropTypes.func.isRequired,
    trackMetric: React.PropTypes.func.isRequired
  },

  componentDidMount: function() {
    var el = ReactDOM.findDOMNode(this);
    weekChart.create(el, this.getChartState());
  },

  componentDidUpdate: function() {
    var el = ReactDOM.findDOMNode(this);
    weekChart.update(el, this.getChartState());
  },

  getChartState: function() {
    var cbgData = this.sortByTime(
                    this.filterInTimeRange(
                      this.props.patientData.grouped.cbg));
    var smbgData = this.sortByTime(
                    this.filterInTimeRange(
                      this.props.patientData.grouped.smbg));
    return {
      cbgData: cbgData,
      smbgData: smbgData,
      margin: {top: 40, right: 0, bottom: 0, left: 67},
      width: 1300,
      height: 340,
      domain: {x: this.props.timeRange, y: [0, 400]}
    };
  },

  componentWillUnmount: function() {
    var el = ReactDOM.findDOMNode(this);
    weekChart.destroy(el);
  },

  render: function() {
    return (
      <div className='print-view-week-view-content'></div>
    );
  },

  filterInTimeRange: function(data) {
    var timeRange = this.props.timeRange;
    return _.filter(data, function(d) {
      var date = new Date(d.time).getTime(),
          start = timeRange[0].getTime(),
          end = timeRange[1].getTime();
      return date >= start
              && date < end;
    });
  },

  sortByTime: function(data) {
    return _.sortBy(data, function(d) {
      return new Date(d.time);
    });
  }

});

module.exports = WeekView;

var weekChart = {};
var applyOffsetToDate = function(d, offset) {
  var date = new Date(d);
  date.setUTCMinutes(date.getUTCMinutes() + offset);
  return new Date(date).toISOString();
};
var formatDate = function(d) {
  return d3.time.format('%Y-%m-%dT%H:%M:%S.%LZ').parse(
      applyOffsetToDate(d.time, d.timezoneOffset)
    );
};
var formatDateLabel = d3.time.format('%a %e');
var formatHours = function(d) {
  var hours = d.getHours();
  if (hours === 0)
    return '12a';
  if (hours < 12)
    return hours + 'a';
  if (hours === 12)
    return '12p';
  return (hours - 12) + 'p';
};

weekChart.create = function(el, state) {

  var svg = d3.select(el).append('svg')
      .attr('class', 'd3')
      .attr('width', state.width)
      .attr('height', state.height)
      .append('g')
        .attr('transform', 'translate(' 
            + state.margin.left + ', ' 
            + state.margin.top + ')');

  svg.append('g')
      .attr('class', 'y axis');

  svg.append('g')
      .attr('class', 'x axis major');

  svg.append('g')
      .attr('class', 'x axis minor');

  svg.append('g')
      .attr('class', 'cbg-points');

  svg.append('path')
      .attr('class', 'cbg-line');

  svg.append('g')
      .attr('class', 'smbg-points');

  this.update(el, state);
};

weekChart.update = function(el, state) {
  // Re-compute the scales, and render the data points
  var scales = this._scales(el, state);
  this._drawAxes(el, scales, state);
  // this._drawCbgPoints(el, scales, state.cbgData);
  this._drawCbgLine(el, scales, state.cbgData);
  this._drawSmbgPoints(el, scales, state.smbgData);
};

weekChart.destroy = function(el) {
  // Any clean-up would go here
};

weekChart._drawAxes = function(el, scales, state) {
  this._drawYAxis(el, scales, state.width);
  this._drawXAxisMinor(el, scales, state.height);
  this._drawXAxisMajor(el, scales, state.height);
};

weekChart._drawYAxis = function(el, scales, width) {
  var gy = d3.select(el).selectAll('.axis')
                        .filter('.y');

  var yAxis = d3.svg.axis()
              .scale(scales.y)
              .orient('left')
              .tickValues([50, 80, 180, 300])
              .tickFormat(d3.format('d'))
              .tickSize(-width)
              .tickPadding(8);

  gy.call(yAxis);

  gy.selectAll('.tick')
      .select('text')
      .style('font-size', '15px')
      .style('font-weight', '300');  

  gy.selectAll('line')
      .style('stroke-dasharray', '2,2');

  gy.append('text')
      .attr('dx', -67)
      .attr('dy', 12)
      .style('font-size', '13px')
      .style('font-weight', '400')
      .style('color', '#000000')
      .text('BG & CGM');

  gy.append('text')
      .attr('dx', -42)
      .attr('dy', 28)
      .style('font-size', '13px')
      .style('font-weight', '300')
      .style('color', '#000000')
      .text('mg/dL');      
};

weekChart._drawXAxisMajor = function(el, scales, height) {
  var gxmajor = d3.select(el).selectAll('.axis')
                        .filter('.x')
                        .filter('.major');

  var xAxisMajor = d3.svg.axis()
                .scale(scales.x)
                .orient('top')
                .ticks(d3.time.days, 1)
                .tickFormat(function(d, i) {
                  if (i === 7) return '';
                  return formatDateLabel(d);
                })
                .tickSize(0)
                .tickPadding(28);

  gxmajor.call(xAxisMajor);

  gxmajor.selectAll('text')
      .style('text-anchor', 'start')
      .style('font-size', '13px')
      .style('font-weight', '400');
};

weekChart._drawXAxisMinor = function(el, scales, height) {
  const MAJOR_TICKS = 8;

  var gxminor = d3.select(el).selectAll('.axis')
                        .filter('.x')
                        .filter('.minor');
  
  var xAxisMinor = d3.svg.axis()
                .scale(scales.x)
                .orient('top')
                .ticks(d3.time.hours, 3)
                .tickFormat(function(d, i) {
                  if (i === 7 * MAJOR_TICKS) return '';
                  if (i % 2 === 0)
                    return formatHours(d);
                })
                .tickSize(-height)
                .tickPadding(8);

  gxminor.call(xAxisMinor);

  gxminor.selectAll('text')
      .style('text-anchor', 'start')
      .style('font-size', '15px')
      .style('font-weight', '300');

  gxminor.selectAll('line').filter(function(d, i) {
      if (i % MAJOR_TICKS !== 0) return d;
    })
    .style('stroke-dasharray', '2,2');;
};

weekChart._drawSmbgPoints = function(el, scales, data) {
  var g = d3.select(el).selectAll('.smbg-points');

  var point = g.selectAll('.smbg-point')
    .data(data, function(d) { return d.id; });

  // ENTER
  point.enter().append('circle')
      .attr('class', 'smbg-point');

  // ENTER & UPDATE
  point.attr('cx', function(d) { return scales.x(formatDate(d)); })
      .attr('cy', function(d) { return scales.y(d.value); })
      .attr('r', function(d) { return 5; });

  // EXIT
  point.exit()
      .remove();
};

weekChart._drawCbgPoints = function(el, scales, data) {
  var g = d3.select(el).selectAll('.cbg-points');

  var point = g.selectAll('.cbg-point')
    .data(data, function(d) { return d.id; });

  // ENTER
  point.enter().append('circle')
      .attr('class', 'cbg-point');

  // ENTER & UPDATE
  point.attr('cx', function(d) { return scales.x(formatDate(d)); })
      .attr('cy', function(d) { return scales.y(d.value); })
      .attr('r', function(d) { return 1; });

  // EXIT
  point.exit()
      .remove();
};

weekChart._drawCbgLine = function(el, scales, data) {
  var path = d3.select(el).selectAll('.cbg-line');

  var line = d3.svg.line()
      .interpolate('basis')
      .x(function(d) {return scales.x(formatDate(d));})
      .y(function(d) {return scales.y(d.value);});

  path
      .attr('d', line(data))
      .attr('stroke', '#000000')
      .attr('stroke-width', '1')
      .attr('fill', 'none');
};

weekChart._scales = function(el, state) {
  var domain = state.domain;
  if (!domain) {
    return null;
  }

  var width = state.width 
    - (state.margin.left + state.margin.right);
  var height = el.offsetHeight
    - (state.margin.top + state.margin.bottom);

  var x = d3.time.scale()
    .range([0, width])
    .domain(domain.x)
    .nice();

  var y = d3.scale.linear()
    .range([height, 0])
    .domain(domain.y);

  return {x: x, y: y};
};