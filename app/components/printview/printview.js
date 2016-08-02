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

import bw_tidepoolpng from './img/bw-tidepool-logo.png';
import bw_blippng from './img/bw-blip-logo.png';

import personUtils from '../../core/personutils';
import utils from '../../core/utils';
import format from 'tideline/js/data/util/format';

import DeviceSettings from './pages/settings';

const MS_INHOUR = 3600000, MS_INDAY = 86400000;
const MIN_DUR_FOR_RATE = 2 * MS_INHOUR;


var PrintView = React.createClass({
  log: bows('Print View'),
  propTypes: {
    bgPrefs: React.PropTypes.object.isRequired,
    timePrefs: React.PropTypes.object.isRequired,
    patient: React.PropTypes.object.isRequired,
    patientData: React.PropTypes.object.isRequired,
    onClickRefresh: React.PropTypes.func.isRequired,
    trackMetric: React.PropTypes.func.isRequired
  },

  render: function() {
    return (
      <div>{ this.renderPrintView() }</div>
    );
    
  },

  renderPrintView: function() {
    return (
      <div className="print-view-content">
        <div className="print-view-page print-view-page-title">
          { this.renderTitlePage() }
        </div>      
        <div className="print-view-page print-view-page-device-settings">
          { this.isMissingSettings() ? null : this.renderDeviceSettings() }
        </div>
      </div>
    );
  },

  renderTitlePage: function() {
    return null;
  },

  renderDeviceSettings: function() {
    return (
      <div>
        { this.renderPageHeader('Device Settings') }
        <DeviceSettings
          bgPrefs={this.props.bgPrefs}
          timePrefs={this.props.timePrefs}
          patient={this.props.patient}
          patientData={this.props.patientData}
          updateDatetimeLocation={this.updateDatetimeLocation}
          trackMetric={this.props.trackMetric} />
      </div>
    );
  },

  renderPageHeader: function(title) {
    var patientName = personUtils.patientFullName(this.props.patient);
    return (
      <div className="print-view-header">
        <p className="print-view-header-name">{ patientName }</p>
        <p className="print-view-header-title">{ title }</p>
        <div className="print-view-header-logos">
          <img className='print-view-logo' src={bw_tidepoolpng} alt="Tidepool logo" />
          <img className='print-view-logo' src={bw_blippng} alt="Blip logo" />
        </div>
      </div>
    );
  },
  
  renderMissingSettingsMessage: function() {
    var self = this;
    var handleClickUpload = function() {
      self.props.trackMetric('Clicked Partial Data Upload, No Settings');
    };
    
    return (
      <div className="patient-data-message patient-data-message-loading">
        <p>{'Blip\'s Device Settings view shows your basal rates, carb ratios, sensitivity factors and more, but it looks like you haven\'t uploaded pump data yet.'}</p>
        <p>{'To see your Device Settings in Blip,  '}
          <a
            href={this.props.uploadUrl}
            target="_blank"
            onClick={handleClickUpload}>upload</a>
          {' your pump.'}</p>
        <p>{'If you just uploaded, try '}
          <a href="" onClick={this.props.onClickRefresh}>refreshing</a>
          {'.'}
        </p>
      </div>
    );
    
  },
  
  isMissingSettings: function() {
    var data = this.props.patientData;
    var pumpSettings = utils.getIn(data, ['grouped', 'pumpSettings'], false);
    if (pumpSettings === false) {
      return true;
    }
    // the TidelineData constructor currently replaces missing data with
    // an empty array, so we also have to check for content
    else if (_.isEmpty(pumpSettings)) {
      return true;
    }
    return false;
  }
});

module.exports = PrintView;
