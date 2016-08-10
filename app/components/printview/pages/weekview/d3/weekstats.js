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
var datetime = require('./util/datetime')
var weekStats = {};

weekStats.create = function(el, state) {
  var totalHeight = this._getTotalChartHeight(state)
                    + state.margin.top + state.margin.bottom;

  var svg = d3.select(el).append('svg')
      .attr('class', 'd3')
      .attr('width', state.width)
      .attr('height', totalHeight)
      .append('g')
        .attr('transform', 'translate(' 
            + state.margin.left + ', ' 
            + state.margin.top + ')');

  svg.append('g')
      .attr('class', 'x axis');

  this.update(el, state);
};

weekStats.update = function(el, state) {
  // Re-compute the scales, and render the data points
  var xscale = this._xscale(el, state);
  this._drawXAxis(el, xscale, this._getTotalChartHeight(state));
};

weekStats.destroy = function(el) {
  // Any clean-up would go here
};

weekStats._getTotalChartHeight = function(state) {
  return state.cgmTimeHeight + state.aveBgHeight 
          + state.totCarbsHeight + state.insulinHeight;
}

weekStats._drawXAxis = function(el, xscale, height) {
  var gx = d3.select(el).selectAll('.axis')
                        .filter('.x');
  
  var xAxis = d3.svg.axis()
                .scale(xscale)
                .orient('top')
                .ticks(d3.time.days, 1)
                .tickFormat('')
                .tickSize(-height);

  gx.call(xAxis);

  gx.selectAll('line')
    .style('stroke-dasharray', '2,2');

  gx.selectAll('g')
      .filter(function(d) {return d === 0;})
      .remove();
};

weekStats._xscale = function(el, state) {
  var domain = state.domain;
  if (!domain) {
    return null;
  }

  var width = state.width 
    - (state.margin.left + state.margin.right);

  var x = d3.time.scale()
    .range([0, width])
    .domain(domain.x);

  return x;
};

module.exports = weekStats;