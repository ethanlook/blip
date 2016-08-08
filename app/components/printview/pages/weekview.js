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
    weekChart.create(el, {
      width: '100%',
      height: 340
    }, this.getChartState());
  },

  componentDidUpdate: function() {
    var el = ReactDOM.findDOMNode(this);
    weekChart.update(el, this.getChartState());
  },

  getChartState: function() {
    var cbgData = this.sortByTime(
                    this.filterInTimeRange(
                      this.props.patientData.grouped.cbg));
    return {
      cbgData: cbgData,
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

weekChart.create = function(el, props, state) {
  var margin = {top: 40, right: 0, bottom: 0, left: 40};
  var width = 1300;
  var height = props.height - (margin.top + margin.bottom);

  var svg = d3.select(el).append('svg')
      .attr('class', 'd3')
      .attr('width', width)
      .attr('height', props.height + 'px')
      .append('g')
        .attr('transform', 'translate(' 
            + margin.left + ', ' 
            + margin.top + ')');

  svg.append('g')
      .attr('class', 'x axis');

  svg.append('g')
      .attr('class', 'cbg-points');

  svg.append('path')
      .attr('class', 'cbg-line');

  this.update(el, state);
};

weekChart.update = function(el, state) {
  // Re-compute the scales, and render the data points
  var scales = this._scales(el, state.domain);
  this._drawAxes(el, scales, state.height);
  // this._drawCbgPoints(el, scales, state.cbgData);
  this._drawCbgLine(el, scales, state.cbgData);
};

weekChart.destroy = function(el) {
  // Any clean-up would go here
};

weekChart._drawAxes = function(el, scales, height) {
  var gx = d3.select(el).selectAll('.axis').filter('.x');
  
  var xAxis = d3.svg.axis()
                .scale(scales.x)
                .orient('top')
                .ticks(d3.time.hours, 3)
                .tickFormat(function(d, i) {
                  if (i % 2 === 0)
                    return formatHours(d);
                })
                .tickSize(-height)
                .tickPadding(8);

  gx.call(xAxis)
    .selectAll('text')
      .style('text-anchor', 'start');
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

weekChart._scales = function(el, domain) {
  if (!domain) {
    return null;
  }

  var width = el.offsetWidth;
  var height = el.offsetHeight;

  var x = d3.time.scale()
    .range([0, width])
    .domain(domain.x);

  var y = d3.scale.linear()
    .range([height, 0])
    .domain(domain.y);

  return {x: x, y: y};
};