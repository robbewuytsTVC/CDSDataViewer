sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library"
], function (BaseController, JSONModel, formatter, mobileLibrary) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.adbsafegate.CDSViewer.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			oViewModel.setSizeLimit(9999999);

			this._oDataModel = this.getView().getModel();

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getModel().metadataLoaded().then(function () {

				this._bindView(sObjectId);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectId) {
			// Set busy indicator during view binding
			// var oViewModel = this.getModel("detailView");

			var sObjectPath = this.getView().getModel().createKey("CDSViewSet", {
				DDLName: sObjectId,
				DraftIndicator: false
			});

			this.getView().bindElement({
				path: "/" + sObjectPath,
				events: {
					change: this._onBindingChange.bind(this, sObjectId),
					dataRequested: function () {

						// oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {

						// oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_getColumnWidth: function (oColumnDefinition) {
			var sDataType = oColumnDefinition.S_TYPE.TYPE;
			var iDataTypeLength = (oColumnDefinition.S_TYPE.LENGTH + oColumnDefinition.S_TYPE.DECIMALS);
			var iLabelLength = oColumnDefinition.DESCRIPTION === "" ? oColumnDefinition.NAME.length : oColumnDefinition.DESCRIPTION.length;

			// Exception: ABAP Datatype String		
			if (sDataType === "g") iDataTypeLength = 25;

			// Pretty Print - if Colun Label is longer then the defined data type => use it
			iDataTypeLength = iDataTypeLength < iLabelLength ? iLabelLength : iDataTypeLength;

			// Optimization 
			// - minimum 4rem
			// - maximum 25rem
			if (iDataTypeLength < 4) {
				iDataTypeLength = 4;
			} else if (iDataTypeLength > 25) {
				iDataTypeLength = 25;
			}

			// return a string in rem
			return iDataTypeLength.toString() + "rem";
		},

		_updateListItemCount: function (iTotalItems) {
			var sTitle;
			sTitle = this.getResourceBundle().getText("detailItemCount", [iTotalItems]);
			this.getModel("detailView").setProperty("/title", sTitle);

		},

		// onTableFiltered: function(oEvent){
		// 	debugger;
		// 	this._updateListItemCount(oEvent.getSource().getRows().length);
		// },

		fetchPreviewData: function (sDdlName) {
			var that = this;
			var oDataPreviewModel = this.getModel("detailView");

			oDataPreviewModel.setProperty("/busy", true);

			this.readDataSourcePreviewAndReturnPromise(sDdlName, false, null, "99999").then(function (
				aTableMetadata,
				aTableData) {

				var oDataPreviewTable = that.getView().byId("table");

				oDataPreviewModel.setProperty("/rows", aTableData.data);
				oDataPreviewModel.setProperty("/columns", aTableMetadata);

				let iCount = aTableData.data ? aTableData.data.length : 0;

				that._updateListItemCount(iCount)

				// 	// restore original text
				// 	oDataPreviewTable.setNoData(that.getModel("i18n").getProperty("ymsg.noData"));

				// 	if (aTableData.data && aTableData.data.length > 0) {

				// 		if (oResourceBundle) {
				// 			if (aTableData.data.length >= 100) {
				// 				sTableTitle = oResourceBundle.getText("xtit.tableTitleCountLimitedTo", [sEntityTitle, aTableData.data.length]);
				// 			} else {
				// 				sTableTitle = oResourceBundle.getText("xtit.tableTitleCount", [sEntityTitle, aTableData.data.length]);
				// 			}
				// 		} else {
				// 			sTableTitle = sEntityTitle + " (" + aTableData.data.length + ")";
				// 		}

				// 		oDataPreviewModel.setProperty("/ViewLabelWithNumbers", sTableTitle);
				// 	}
				debugger;
				oDataPreviewTable.bindColumns({
					path: "detailView>/columns",
					factory: function (sId, oCtx) {
						var oColumnDefinition = oCtx.getObject();
						var sDataType = oColumnDefinition.S_TYPE.TYPE;
						var bRightAlign = (formatter.isNumericDataType(sDataType) === true || formatter.isDateTimeDataType(sDataType) === true);
						var sColumnWidth = that._getColumnWidth(oColumnDefinition);
						return new sap.ui.table.Column({
							label: oColumnDefinition.DESCRIPTION === "" ? oColumnDefinition.NAME : oColumnDefinition.DESCRIPTION,
							template: new sap.m.Text({
								text: "{detailView>" + oColumnDefinition.PROPERTY + "}"
							}),
							sortProperty: oColumnDefinition.PROPERTY,
							filterProperty: oColumnDefinition.PROPERTY,
							filterOperator: formatter.isNumericDataType(sDataType) || formatter.isDateTimeDataType(sDataType) ? "EQ" : "Contains",
							hAlign: bRightAlign ? sap.ui.core.TextAlign.End : sap.ui.core.TextAlign.Begin,
							width: sColumnWidth
						});
					}
				});

				var aItems = [];
				aTableMetadata.forEach(function (item) {
					aItems.push(new sap.m.Text({
						text: "{detailView>" + item.PROPERTY + "}"
					}));
				});

				oDataPreviewTable.bindRows({
					path: "detailView>/rows",
					events: {
						change: function (oEvent) {
							debugger;
							that._updateListItemCount(oEvent.getSource().aIndices.length);
						}
					},
					template: new sap.ui.table.Row({
						cells: [
							aItems
						]
					})

				});

				// oDataPreviewTable.getBinding('rows').attachEvent('change', function (e) {
				// 	debugger;
				// 	that._updateListItemCount(e.getSource().aIndices);
				// })
				oDataPreviewModel.setProperty("/busy", false);
			}, function () {
				oDataPreviewModel.setProperty("/busy", false);
			});
		},

		_readParameters: function (sDdlName) {
			var that = this;
			var oDataPreviewModel = this.getModel("detailView");

			oDataPreviewModel.setProperty("/busy", true);

			that.readDataSourceParametersAndReturnPromise(sDdlName).then(function (aParameters) {

				oDataPreviewModel.setProperty("/busy", false);

				// handle fetched values to keep user entered values
				aParameters.forEach(function (oParam) {
					// set value as defaultValue so that value can be bound to UI
					oParam.Value = oParam.DefaultValue;
				});

				oDataPreviewModel.setProperty("/Parameters", aParameters);
				that.handleParameterLinkPressed();

			}, function () {
				oDataPreviewModel.setProperty("/busy", false);
			});
		},

		readDataSourceParametersAndReturnPromise: function (sDdlDocumentName) {
			var oDeferred = new jQuery.Deferred();

			var sObjectPath = this._oDataModel.createKey("CDSViewSet", {
				DDLName: sDdlDocumentName,
				DraftIndicator: false
			});

			//var that = this;

			this._oDataModel.read("/" + sObjectPath + "/CDSViewParameterSet", {
				success: function (oData) {
					try {
						if (!(oData && oData.results)) {
							oDeferred.reject();
							return;
						}
						var aParameters = [];
						for (var i = 0; i < oData.results.length; i++) {
							var oParam = {
								DdlName: oData.results[i].DdlName,
								Decimals: oData.results[i].Decimals,
								// as the default value could also be of system default (starting with #), the backend passes us the derived values!
								DefaultValue: oData.results[i].DerivedDefaultValue,
								Description: oData.results[i].Description,
								Length: oData.results[i].Length,
								Name: oData.results[i].Name,
								Property: oData.results[i].Property,
								DataType: oData.results[i].DataType,
								Value: ""
							};
							aParameters.push(oParam);
						}
						oDeferred.resolve(aParameters);
					} catch (oError) {
						jQuery.sap.log.error("Error happened in AccessController while processing parameter reading response!");
					}
				},
				error: function (oError) {
					oDeferred.reject(oError);
				}
			});

			return oDeferred.promise();
		},

		readDataSourcePreviewAndReturnPromise: function (sDdlDocumentName, bDraftIndicator, sParameters, RowNumber) {
			var oDeferred = new jQuery.Deferred();
			if (!sParameters) {
				sParameters = "{}";
			}
			this.getView().getModel().callFunction("/ProcessDataPreview", {
				method: "GET",
				urlParameters: {
					ViewName: sDdlDocumentName,
					DraftIndicator: bDraftIndicator,
					Request: sParameters,
					RowNumber: RowNumber
				},
				success: function (oData) {
					try {
						if (!(oData && oData.Result)) {
							oDeferred.reject();
							return;
						}
						var oResult = JSON.parse(oData.Result);
						if (!oResult) {
							oDeferred.reject();
							return;
						}
						var aTableMetadata = oResult.dp.METADATA;
						var aTableData = [];
						if (oResult.dp.DATA.length > 0) {
							aTableData = JSON.parse(oResult.dp.DATA);
						}

						oDeferred.resolve(aTableMetadata, aTableData);
					} catch (oError) {
						jQuery.sap.log.error("Error happened in AccessController while processing data preview response!");
					}
				},
				error: function (oError) {
					oDeferred.reject(oError);
				}
			});
			// Welcher Vogel hat das hier eingebaut?? Das hat negative Effekte durch die ganze App, Mann!!
			/*this._oDataModel.createKey = function(sPath, mArguments) {
				return "/" + sPath;
			};*/

			return oDeferred.promise();
		},

		_onBindingChange: function (oCtxt, sObjectId) {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding(),
				oViewModel = this.getModel("detailView"),
				oDataPreviewTable = this.getView().byId("table");

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			if (oElementBinding.getBoundContext().getObject().HasParameterIndicator === true) {
				// reset columns so that table does not show outdated data
				oViewModel.setProperty("/rows", []);

				this.readParameters(sObjectId);
				// override original text with remark that parameters have to be filled out
				oDataPreviewTable.setNoData(i18n.getProperty("ymsg.parametersToBeFilledOut"));

			} else {
				// restore original text
				oDataPreviewTable.setNoData(i18n.getProperty("ymsg.noData"));
				// trigger data preview data retrieval
				this.fetchPreviewData(sObjectId);
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectName = oObject.DDLName;

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound

			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		}
	});

});