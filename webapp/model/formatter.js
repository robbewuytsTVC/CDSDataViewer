sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
		isNumericDataType: function (sDataType) {
			var aNumericDataTypes = ["NUMC", "CURR", "INT1", "INT2", "INT4", "INT8", "DEC", "FLTP", "D16D", "D16R", "D34D", "D34R", "DF16_SCL",
				"DF16_DEC", "QUAN", "P", ""
			];
			return aNumericDataTypes.indexOf(sDataType) >= 0;
		},
		isDateTimeDataType: function (sDataType) {
			var aDateTimeDataTypes = ["TIMS", "DATS", "T", "D"];
			return aDateTimeDataTypes.indexOf(sDataType) >= 0;
		},
	};
});