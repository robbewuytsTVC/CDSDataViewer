/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("com.adbsafegate.CDSViewer.util.DateTime");
jQuery.sap.require("sap.ui.core.format.DateFormat");

com.adbsafegate.CDSViewer.util.DateTime = {
	/**
	 * Pattern for ABAP date format
	 */
	AbapDateFormatPattern: "yyyyMMdd",
	DateDisplayStyle: "short",
	AbapInitialDate: "00000000",

	appendLeadingZero: function(i) {
		return (i < 10 ? '0' : '') + i;
	},

	formatDateToAbap: function(oDate) {
		var f00 = com.adbsafegate.CDSViewer.util.DateTime.appendLeadingZero;
		var sDate = "";
		if (oDate) {
			sDate = oDate.getFullYear() + f00(oDate.getMonth() + 1) + f00(oDate.getDate());
		}
		return sDate;
	},

	formatTimeToAbap: function(oDate) {
		var f00 = com.adbsafegate.CDSViewer.util.DateTime.appendLeadingZero;
		var sTime = "";
		if (oDate) {
			sTime = f00(oDate.getHours()) + f00(oDate.getMinutes()) + f00(oDate.getSeconds());
		}
		return sTime;
	},

	/**
	 * Get current date in ABAP format "yyyyMMdd"
	 */
	getCurrentAbapDate: function() {
		var formatDateToAbap = com.adbsafegate.CDSViewer.util.DateTime.formatDateToAbap;
		var oDate = new Date();
		return formatDateToAbap(oDate);
	},

	/**
	 * Get current time in ABAP format "hhmmss"
	 */
	getCurrentAbapTime: function() {
		var formatTimeToAbap = com.adbsafegate.CDSViewer.util.DateTime.formatTimeToAbap;
		var oDate = new Date();
		return formatTimeToAbap(oDate);
	},

	getJsDateObjectFromAbapDate: function(sAbapDate) {
		var DateTime = com.adbsafegate.CDSViewer.util.DateTime;
		if (sAbapDate && sAbapDate !== DateTime.AbapInitialDate) {
			var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
				pattern: com.adbsafegate.CDSViewer.util.DateTime.AbapDateFormatPattern
			});
			var oResult = null;
			try {
				oResult = oDateFormat.parse(sAbapDate);
			} catch (e) {}
			return oResult;
		} else {
			return null;
		}
	},

	/**
	 * Format abap time (hhmmss) to the display format according to locale settings.
	 */
	formatAbapTimeForDisplay: function(sAbapTime) {
		var oAbapFormat = sap.ui.core.format.DateFormat.getTimeInstance({
			pattern: "hhmmss"
		});
		var oDisplayFormat = sap.ui.core.format.DateFormat.getTimeInstance();

		var oTime = oAbapFormat.parse(sAbapTime);
		var sDisplayTime = oDisplayFormat.format(oTime);

		return sDisplayTime;
	},

	/**
	 * Format abap date to the display format according to locale settings
	 */
	formatAbapDateForDisplay: function(sAbapDate) {
		var DateTime = com.adbsafegate.CDSViewer.util.DateTime;

		var oDateDisplayFormat = sap.ui.core.format.DateFormat.getInstance({});

		if (sAbapDate && sAbapDate !== DateTime.AbapInitialDate) {
			var oDate = DateTime.getJsDateObjectFromAbapDate(sAbapDate);
			return oDateDisplayFormat.format(oDate);
		}
	},

	getDisplayFormatForDatePicker: function() {
		var oDisplayFormat = sap.ui.core.format.DateFormat.getInstance({}).oFormatOptions.pattern;
		return oDisplayFormat;
	},

	getDisplayFormatForTimeInput: function() {
		var oDisplayFormat = sap.ui.core.format.DateFormat.getTimeInstance().oFormatOptions.pattern;
		return oDisplayFormat;
	}

};